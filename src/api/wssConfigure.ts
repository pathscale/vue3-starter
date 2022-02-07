import wssAdapter from '@pathscale/wss-adapter'
import errors from './errors'
import auth from './services/auth.service'
import app from './services/app.service'

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
          setTimeout(() => {
            router.replace({ name: 'login' })
            localStorage.clear()
          }, 2000)
        },
      },
    },
    errors,
    onError({ message }) {
      console.log(message)
    },
  })
  console.log('wss client configured')
}

export default wssConfigure
