import { makeState } from '../makeState'

export interface ILogin {
  username: string
  password: string
}

interface IState {
  logged: boolean
  role: string | null
  loading: Record<string, unknown>
  error: Record<string, unknown>
}

interface IMutations {
  login: (state: IState, payload: ILogin) => Promise<void>
  logout: () => void
}

interface IActions {
  login: (payload: ILogin) => Promise<void>
  logout: () => void
}

const mockAuthResponse = {
  userPublicId: 'mock-user-id-123',
  serviceTokens: {
    user: 'mock-service-token-456',
  },
  organizations: {
    publicId: ['mock-org-id-789'],
  },
}

const mockAppResponse = {
  role: 'admin',
}

const slices = makeState<IState, IMutations, IActions>({
  initialState: {
    logged: false,
    role: null,
    loading: {},
    error: {},
  },
  mutations: {
    async login(state: IState, payload: ILogin) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const { userPublicId, serviceTokens, organizations } = mockAuthResponse
      const { role } = mockAppResponse
      state.role = role
      state.logged = true
    },

    logout() {
      localStorage.clear()
      window.location.replace('/')
    },
  },
})

export default slices.state

export const { login, logout } = slices.actions
