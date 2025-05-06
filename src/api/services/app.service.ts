import type { IService } from '@pathscale/wss-adapter/types'
import config from '~/config'

import methods from './user.json'
import adminMethods from './admin.json'

const appServer = localStorage.getItem('appServer') || config.appServer

const service: IService = {
  remote: appServer,
  methods: Object.assign(methods, adminMethods),
}

export { appServer }

export default service
