import { makeState } from '../utils'
import api from '~/api/'
import { encodePassword } from '~/utils/encoders'

const slices = makeState({
  initialState: {
    logged: false, // process.env.NODE_ENV === 'development',
    role: null,
  },
  mutations: {
    async login(state, payload) {
      const { userPublicId, serviceTokens, organizations } = await api.auth.connect([
        '0login',
        '1' + payload.username.$value.split('@')[0], // TODO remove
        '2' + encodePassword(payload.password.$value),
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
    },

    logout(state, payload) {
      localStorage.clear()
      window.location.replace('/')
    },
  },
})

export default slices.state

export const { login, register, logout, autologin } = slices.actions
