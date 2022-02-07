/* eslint-disable consistent-return */
import { reactive } from 'vue'

/*  Creates an object { state, actions }

    state is a reactive object instance
    actions is an object, where each key maps to a function that takes state and payload as positional arguments
*/
export function makeState<
  IState extends { loading: Record<string, unknown>; error: Record<string, unknown> },
  IMutations,
  IActions,
>({ initialState, mutations }: { initialState: IState; mutations: IMutations }) {
  const state = reactive<IState>(initialState)
  const actions: IActions = {}
  state.loading = {}
  state.error = {}

  const actionNames = Object.keys(mutations)

  actionNames.forEach(actionName => {
    state.loading[actionName] = false
    const mutation = mutations[actionName] as (
      store: typeof state,
      payload?: unknown,
    ) => Promise<void>

    actions[actionName] = async function (payload: unknown) {
      try {
        state.loading[actionName] = true
        const result = await mutation(state, payload)
        return result
      } catch (error: unknown) {
        state.error[actionName] = error?.message || 'Unknown error'
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
