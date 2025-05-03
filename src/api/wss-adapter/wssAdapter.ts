/* eslint-disable @typescript-eslint/no-empty-function */

import type { IServiceConfig, IStore, IWssAdapter } from "./types";

const wssAdapter: IWssAdapter = {
  services: {},
  sessions: {},
  configure() {},
};

const store: IStore = {
  timeout: 0,
  errors: {
    language: "en",
    codes: [],
  },
  services: {},
  subscriptions: {},
  sequence: {
    value: 1,
    getSeq() {
      store.sequence.value += 1;
      return store.sequence.value;
    },
    decreaseSeq() {
      store.sequence.value -= 1;
    },
  },
  sessions: {},
  pendingPromises: {},
};

wssAdapter.configure = (configuration) => {
  const { timeout, services, errors } = configuration;

  // save some stuff for later retrieval
  store.timeout = timeout;
  store.errors = errors;
  store.services = services;

  for (const [serviceName, serviceConfig] of Object.entries(services)) {
    // construct services objects with two simple functions
    // intended use: `wssAdapter.services.admin.connect([1, 2, 3])` or `wssAdapter.services.auth.connect([1, 2, 3])`
    wssAdapter.services[serviceName] = {
      connect: <T>(payload: string | string[] | undefined, remote?: string) =>
        connectHandler<T>(serviceName, serviceConfig, payload, remote),
      disconnect: () => disconnectHandler(serviceName),
    };

    if (serviceConfig.subscriptions) {
      store.subscriptions[serviceName] = serviceConfig.subscriptions;
    }

    // construct sessions objects that contain a proxy so you can ask unknown property
    // intended use: `wssAdapter.sessions.admin.updatePassword({ newPassword: 'hotdog6737637' })`
    wssAdapter.sessions[serviceName] = new Proxy(
      {},
      {
        get:
          (target, methodName: string) => (payload: Record<string, unknown>) =>
            sendHandler(serviceName, serviceConfig, methodName, payload),
      },
    );
  }
};

const connectHandler = <T>(
  serviceName: string,
  serviceConfig: IServiceConfig,
  payload: string | string[] | undefined,
  remote?: string,
) => {
  return new Promise((resolve, reject) => {
    store.sessions[serviceName] = new WebSocket(
      remote || serviceConfig.remote,
      payload,
    );
    store.sessions[serviceName].onmessage = (event: { data: string }) => {
      const response = JSON.parse(event.data);

      if (response.code) {
        const error = store.errors.codes.find((c) => c.code === response.code);
        reject(new Error(error?.message ?? response.code));
        return;
      }

      store.sessions[serviceName].onmessage = receiveHandler;
      resolve(response.params);
    };

    store.sessions[serviceName].onclose = (event) => {
      serviceConfig.onDisconnect?.(event);

      reject(
        new Error(
          `code: ${event.code}, reason: ${event.reason}, wasClean: ${event.wasClean}`,
        ),
      );
    };

    store.sessions[serviceName].onerror = (event) => {
      console.log(`onError: ${event}`);
    };
  }) as Promise<T>;
};

const disconnectHandler = (serviceName: string) => {
  store.sessions[serviceName]?.close();
};

const sendHandler = (
  serviceName: string,
  serviceConfig: IServiceConfig,
  methodName: string,
  params: Record<string, unknown> = {},
) => {
  const methodCode = Object.entries(serviceConfig.methods)
    .map(([code, info]) => ({ code, info }))
    .find(({ info }) => info.name === methodName)?.code;

  if (!methodCode) {
    throw new Error(
      `method ${methodName} not available in ${serviceName} service`,
    );
  }

  const payload = {
    method: Number.parseInt(methodCode),
    seq: store.sequence.getSeq(),
    params: params,
  };

  // console.log(`sends ${serviceName}::${methodName}:`, payload)

  return new Promise((resolve, reject) => {
    store.sessions[serviceName].send(JSON.stringify(payload));

    // save executor so that when response for this request comes the promise can be resolved
    store.pendingPromises[payload.seq] = {
      resolve,
      reject,
      toHandler: setTimeout(() => {
        reject(new Error(`${methodName} took too long, aborting`));
      }, store.timeout),
      methodName,
    };
  });
};

const receiveHandler = (event: { data: string }) => {
  const response = JSON.parse(event.data);

  if (
    response.type === "Immediate" ||
    (response.type === "Error" && response.method) ||
    response.method === 0
  ) {
    // console.log(
    //   `got app::${store.pendingPromises[response.seq]?.methodName || response.method}:`,
    //   response,
    // )

    const error =
      response.code ||
      response.params?.success === false ||
      response.params?.error;

    console.log("error", error);

    const resolve = (payload: unknown) => {
      const executor = store.pendingPromises[response.seq];
      clearTimeout(store.pendingPromises[response.seq].toHandler);
      delete store.pendingPromises[response.seq];
      executor.resolve(payload);
    };

    // handle error
    if (error) {
      onError(response);
    } else {
      resolve(response);
    }
  } else if (response.type === "Stream") {
    const resource = store.services.app.methods[response.method];
    //@ts-ignore
    const executor = store.subscriptions.app[resource.name];
    executor?.(response.data);
  }
};

interface IResponse {
  code: number;
  seq: number;
  params?: string | { reason?: string; error?: string };
}

function onError(response: IResponse) {
  const error = store.errors.codes.find((c) => c.code === response.code);
  const params = typeof response.params === "object" ? response.params : {};
  const errorMsg =
    params.reason ||
    params.error ||
    response.params ||
    error?.message ||
    response.code;

  if (store.pendingPromises[response.seq]) {
    const executor = store.pendingPromises[response.seq];
    clearTimeout(executor.toHandler);
    executor.reject(new Error(`${executor.methodName ?? ""}: ${errorMsg}`));
    delete store.pendingPromises[response.seq];
  } else {
    throw new Error("Unkown request failed");
  }
}

export default wssAdapter;
