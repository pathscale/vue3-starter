interface IService {
  remote: string
  methods: {
    [methodCode: string]: {
      name: string
      parameters: string[]
    }
  }
}
type SubscriptionCallback<T> = (payload: T) => void
type ISubscriptions<T> = Record<string, SubscriptionCallback<T>>

interface IServiceConfig extends IService {
  subscriptions?: ISubscriptions<any>
  onDisconnect: (event: { code: number; reason: string; wasClean: boolean }) => void | null
}
interface IServices {
  [serviceName: string]: IServiceConfig
}

export interface IErrors {
  language: string
  codes: Code[]
}

export interface Code {
  code: number
  symbol: string
  message: string
  source: string
}
interface IConfiguration {
  timeout: number
  services: IServices
  errors: IErrors
}
interface IServiceConnect {
  connect<T>(payload: string | string[] | undefined, remote?: string): Promise<T>
  disconnect: () => void
}
interface IWssAdapter {
  services: {
    [serviceName: string]: IServiceConnect
  }
  sessions: {
    [serviceName: string]: Record<
      string,
      <Response, Params = any>(payload?: Params) => Promise<{ params: Response }>
    >
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
  [methodName: string]: {
    resolve: (payload: unknown) => void
    reject: (error: Error) => void
    toHandler: ReturnType<typeof setTimeout>
    methodName: string
  }
}
interface IStore {
  timeout: number
  errors: IErrors
  services: IServices
  sequence: ISequence
  sessions: ISessions
  subscriptions: ISubscriptions<{
    updateStrategyDataUpdate: () => void
  }>
  pendingPromises: IPendingPromises
}

export type { IStore, IWssAdapter, IServiceConfig, IConfiguration, IServices, IService }
