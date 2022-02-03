interface IService {
  remote: string
  methods: {
    [methodCode: string]: {
      name: string
      parameters: string[]
    }
  }
}

interface IServiceConfig extends IService {
  onDisconnect: () => void | null
}

interface IServices {
  [serviceName: string]: IServiceConfig
}

interface IErrors {
  [errorCode: number]: string
}

interface IConfiguration {
  timeout: number
  services: IServices
  errors: IErrors
  onError: (error: { error: number; message: string }) => void
}

interface IServiceConnect {
  connect<T>(payload: string | string[] | undefined): Promise<T>
  disconnect: () => void
}

interface IWssAdapter {
  services: {
    [serviceName: string]: IServiceConnect
  }
  sessions: {
    [serviceName: string]: unknown
  }
  configure: (configuration: IConfiguration) => void
}

interface ISequence {
  value: number
  getSeq: () => number
  decreaseSeq: () => void
}

interface ISessions {
  [serviceName: string]: WebSocket
}

interface IPendingPromises {
  [seq: number]: {
    resolve: (payload: unknown) => void
    reject: (error: Error) => void
    toHandler: ReturnType<typeof setTimeout>
  }
}

interface IStore {
  timeout: number
  errors: IErrors
  services: IServices
  sequence: ISequence
  sessions: ISessions
  pendingPromises: IPendingPromises
  onError: (error: { error: number; message: string }) => void
}

export { IStore, IWssAdapter, IServiceConfig, IConfiguration, IErrors, IServices, IService }
