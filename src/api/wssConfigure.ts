import wssAdapter from './wss-adapter/wssAdapter'
import auth from './services/auth.service'
import app from './services/app.service'
import errors from '../../docs/error_codes/error_codes.json'

const wssConfigure = () => {
  wssAdapter.configure({
    timeout: 1000 * 30,
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
          console.log('disconnected from app!')
        },
        subscriptions: {
        },
      },
    },
    errors,
  })
  console.log('wss client configured')
}

export default wssConfigure
