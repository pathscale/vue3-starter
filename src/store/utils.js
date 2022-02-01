import { reactive } from 'vue'

/*  Creates an object { state, actions }

    state is a reactive object instance
    actions is an object, where each key maps to a function that takes state and payload as positional arguments
*/
export function makeState({ initialState, mutations }) {
  const state = reactive(initialState)
  const actions = {}
  state.loading = {}

  const actionNames = Object.keys(mutations)

  actionNames.forEach(actionName => {
    state.loading[actionName] = false
    const action = mutations[actionName]
    actions[actionName] = async function (payload) {
      try {
        state.loading[actionName] = true
        const result = await action(state, payload)
        return result
      } finally {
        state.loading[actionName] = false
      }
    }
  })

  return {
    state,
    actions,
  }
}

export function dateDiff(first, second) {
  // Take the difference between the dates and divide by milliseconds per day.
  // Round to nearest whole number to deal with DST.
  return Math.round(Math.abs((first - second) / (1000 * 60 * 60 * 24)))
}

export const normalize = (response, key) => {
  const keys = Object.keys(response)
  const ids = response[key]

  if (!ids) {
    return {}
  }
  const content = ids.map((e, i) => {
    const obj = {}
    keys.forEach(e => {
      if (response[e]) {
        Object.assign(obj, { [e]: response[e][i] })
      } else {
        console.warn(`${e} not found`)
      }
    })
    return obj
  })
  const items = {}
  ids.forEach((e, i) => {
    items[e] = content[i]
  })
  return items
}

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
