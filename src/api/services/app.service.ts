import { IService } from '@pathscale/wss-adapter/types'

const service: IService = {
  remote: 'wss://api.salesaction.pk:8448',
  methods: {
    20000: {
      name: 'Init',
      parameters: ['userPublicId', 'token', 'deviceId', 'deviceOS', 'organizationPublicId'],
    },
  },
}

export default service
