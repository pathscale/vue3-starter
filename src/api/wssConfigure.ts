import wssAdapter from './wssAdapter'
import errors from './errors'
import auth from './services/auth'
import app from './services/app'
import { store } from '../store/store'

import { router } from '~/router'

const wssConfigure = () => {
  wssAdapter.configure({
    timeout: 90000,
    services: {
      auth: {
        ...auth,
        onDisconnect() {
          console.log('disconnected from auth!')
        },
      },
      app: {
        ...app,
        onDisconnect() {
          console.log('disconnected!')
          store.notification = 'Your session has expired!'
          setTimeout(() => {
            router.replace({ name: 'login' })
            localStorage.clear()
          }, 2000)
        },
      },
    },
    errors,
    onError({ message }) {
      store.notification = message
    },
  })
  console.log('wss client configured')
}

export default wssConfigure
