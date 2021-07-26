import { makeState } from '../utils'
import api from '~/api/'
import { encodePassword } from '~/utils/encoders'

const slices = makeState({
  initialState: {
    logged: false,
    role: null,
    recordCount: null,
  },
  mutations: {
    async login(state, payload) {
      const { userPublicId, serviceTokens, organizations } = await api.auth.connect([
        '0login',
        '1' + payload.username,
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
        organizations.publicId[0], // need to define how to pick one of available, rev needs to say...
      ]

      const { role, recordCount } = await api.app.connect(content)

      state.role = role
      state.recordCount = recordCount
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
