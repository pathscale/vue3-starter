/* eslint-disable compat/compat -- ok */
/* eslint-disable promise/avoid-new -- ok */

const wssAdapter = {
  configure: null,
  services: {},
  sessions: {},
}

const store = {
  timeout: 0,
  errors: {},
  services: {},

  sequence: {
    value: 1,
    getSeq() {
      store.sequence.value += 1
      return store.sequence.value
    },
    decreaseSeq() {
      store.sequence.value -= 1
    },
  },

  sessions: {},
  pendingPromises: {},
  onError: null,
}

wssAdapter.configure = configuration => {
  const { timeout, services, errors, onError } = configuration

  // save some stuff for later retrieval
  store.timeout = timeout
  store.errors = errors
  store.services = services
  store.onError = onError

  for (const [serviceName, serviceConfig] of Object.entries(services)) {
    // construct services objects with two simple functions
    // intended use: `wssAdapter.services.admin.connect([1, 2, 3])` or `wssAdapter.services.auth.connect([1, 2, 3])`
    wssAdapter.services[serviceName] = {
      connect: payload => connectHandler(serviceName, serviceConfig, payload),
      disconnect: () => disconnectHandler(serviceName),
    }

    // construct sessions objects that contain a proxy so you can ask any property
    // intended use: `wssAdapter.sessions.admin.updatePassword({ newPassword: 'hotdog6737637' })`
    wssAdapter.sessions[serviceName] = new Proxy(
      {},
      {
        get: (target, methodName) => payload =>
          sendHandler(serviceName, serviceConfig, methodName, payload),
      },
    )
  }
}

const connectHandler = (serviceName, serviceConfig, payload) => {
  return new Promise((resolve, reject) => {
    store.sessions[serviceName] = new WebSocket(serviceConfig.remote, payload)

    store.sessions[serviceName].onmessage = function (event) {
      const response = JSON.parse(event.data)
      console.log(response)

      if (response.params.error) {
        reject(new Error(store.errors[response.params.error] ?? 'Something went wrong'))
        return
      }

      store.sessions[serviceName].onmessage = receiveHandler
      resolve(response.params)
    }

    store.sessions[serviceName].onclose = serviceConfig.onDisconnect
  })
}

const disconnectHandler = serviceName => {
  store.sessions[serviceName]?.close()
}

const sendHandler = (serviceName, serviceConfig, methodName, params) => {
  const methodCode = Object.entries(serviceConfig.methods)
    .map(([code, info]) => ({ code, info }))
    .find(({ info }) => info.name === methodName)?.code

  if (!methodCode) {
    throw new Error(`method ${methodName} not available in ${serviceName} service`)
  }

  if (
    !Object.keys(params).every(param =>
      serviceConfig.methods[methodCode].parameters.includes(param),
    )
  ) {
    console.log(`wss method ${methodCode} is being called with missing parameters`)
  }

  const purgedParams = {}
  serviceConfig.methods[methodCode].parameters.forEach(k => {
    purgedParams[k] = params[k]
  })

  const payload = {
    method: Number.parseInt(methodCode),
    seq: store.sequence.getSeq(),
    params: purgedParams,
  }

  console.log(`${serviceName}::${methodName} sends:`, payload)

  return new Promise((resolve, reject) => {
    store.sessions[serviceName].send(JSON.stringify(payload))

    // save executor so that when response for this request comes the promise can be resolved
    store.pendingPromises[payload.seq] = {
      resolve,
      reject,
      toHandler: setTimeout(() => {
        reject(store.handleError(methodCode.toString() + ' took to long, aborting'))
      }, store.timeout),
    }
  })
}

const receiveHandler = event => {
  const response = JSON.parse(event.data)
  console.log(`app::${response.method} got:`, response)

  const error = response.method === 0
  const done = response.method.toString().endsWith('1')

  const resolve = (payload, code) => {
    const executor = store.pendingPromises[response.seq]
    clearTimeout(store.pendingPromises[response.seq].toHandler)
    delete store.pendingPromises[response.seq]
    executor.resolve(payload)
  }

  // handle error
  if (error) {
    onError(response)
  } else if (done) {
    const code = response.method - 1
    resolve(response, code)
  }
}

// if it was one of these guys
// 1) protocol violation
// 2) malformed request
// seq must be decreased
function onError(response) {
  const { error: errorCode } = response.params
  const errorMsg = store.errors[errorCode] ?? 'Something went wrong'

  if ([45349638, 45349637].includes(errorCode)) {
    store.sequence.decreaseSeq()
    console.log('seq has been decreased because of error')
  }

  store.onError?.({
    error: errorCode,
    message: errorMsg,
  })

  // if there was only one executor saved in store.pendingPromises, then it was that request that failed
  if (Object.keys(store.pendingPromises).length === 1) {
    const onlyKey = Object.keys(store.pendingPromises)[0]
    clearTimeout(store.pendingPromises[onlyKey].toHandler)
    store.pendingPromises[onlyKey].reject(new Error(errorMsg))
    delete store.pendingPromises[onlyKey]
  }

  // if there were more than one, there is no way of knowing who failed
  else {
    throw new Error('Unkown request failed')
  }
}

export default wssAdapter
