import { makeState } from '../makeState'
import api from '~/api'
import { encodePassword } from '~/utils/encoders'

export interface ILogin {
  username: string
  password: string
}

interface IState {
  logged: boolean
  role: null
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

const slices = makeState<IState, IMutations, IActions>({
  initialState: {
    logged: false,
    role: null,
    loading: {},
    error: {},
  },
  mutations: {
    async login(state: IState, payload: ILogin) {
      const { userPublicId, serviceTokens, organizations } = await api.auth.connect<{
        userPublicId: string
        serviceTokens: {
          user: string
        }
        organizations: {
          publicId: string[]
        }
      }>([
        '0login',
        '1' + payload.username.split('@')[0], // TODO remove
        '2' + encodePassword(payload.password),
        '31',
        '424787297130491616',
        '5android',
      ])

      const content = [
        userPublicId,
        serviceTokens.user,
        '24787297130491616',
        'android',
        organizations.publicId[0],
      ]

      const { role } = await api.app.connect(content)

      state.role = role
      state.logged = true
      console.log('aca estoy', state.logged)
    },

    logout() {
      localStorage.clear()
      window.location.replace('/')
    },
  },
})

export default slices.state

export const { login, logout } = slices.actions
