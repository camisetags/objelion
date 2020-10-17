export interface PrimaryCacheClient {
  get(key: string): string
  set(key: string, value: any, strategy?: string, expireTime?: number): string
}

export interface CacheClient extends PrimaryCacheClient {
  setex(key: string, timeout: number, value: any): void
}

export interface CacheResult {
  [prop: string]: string
}

export interface TargetObject {
  [prop: string]: any
}

export interface Config {
  cacheClient?: CacheClient
  cacheKeyRule: Function
  skipMethodKeys?: Array<string>
  enabled: boolean
  expireTime: number
}

interface MethodExecutionDTO {
  skipMethodKeys: string[]
  cacheKeyRule: Function
  cacheClient: CacheClient
  origMethod: Function
  expireTime: number
  methodName: string
  context: ProxyHandler<TargetObject>
}

const _skipMethodKeys = [
  'insert',
  'create',
  'add',
  'update',
  'alter',
  'delete',
  'destroy',
  'remove'
]

const funcExecution = (ecxecMethodDTO: MethodExecutionDTO) =>
  async function(...args: any[]) {
    const {
      skipMethodKeys,
      methodName,
      cacheKeyRule,
      cacheClient,
      origMethod,
      context,
      expireTime
    } = ecxecMethodDTO

    const isSkipMetod = skipMethodKeys.some(term => methodName.toLowerCase().includes(term))

    const cacheKey = cacheKeyRule(methodName, args)
    const cacheResult = !isSkipMetod ? await cacheClient.get(cacheKey) : null

    if (cacheResult) {
      return JSON.parse(cacheResult)
    }

    const result = await Promise.resolve(origMethod.apply(context, args))

    if (!isSkipMetod) {
      cacheClient.setex(cacheKey, expireTime, JSON.stringify(result))
    }

    return result
  }

export default class Objelion {
  private cacheClient: CacheClient
  private cacheKeyRule: Function
  private skipMethodKeys: Array<string>
  private enabled: boolean
  private expireTime: number
  private cache: CacheResult = {}

  private isInternalClient: boolean = false

  constructor(config: Config) {
    if (config.cacheClient) {
      this.isInternalClient = true
    }
    this.cacheClient = config.cacheClient || this.memoizationClient
    this.cacheKeyRule = config.cacheKeyRule
    this.skipMethodKeys = config.skipMethodKeys || _skipMethodKeys
    this.enabled = config.enabled
    this.expireTime = config.expireTime
  }

  private memoizationClient: CacheClient = {
    get: (key: string): string => {
      return this.cache[key]
    },

    set: (key: string, value: any): string => {
      this.cache[key] = value
      return this.cache[key]
    },

    setex: (key: string, expireTime: number = 15, value: any): void => {
      this.cache[key] = value

      setTimeout(() => {
        delete this.cache[key]
      }, expireTime * 1000)
    }
  }

  public createCacheMiddleware() {
    const cacheClient = this.isInternalClient
      ? this.memoizationClient
      : this.generateConnectionInterface(this.cacheClient)

    const { enabled, skipMethodKeys, cacheKeyRule, expireTime } = this

    return (targetDatasource: TargetObject) =>
      new Proxy(targetDatasource, {
        get(targetObj: TargetObject, methodName: string) {
          const origMethod = targetObj[methodName]

          return enabled
            ? funcExecution({
                context: this,
                cacheClient,
                cacheKeyRule,
                expireTime,
                methodName,
                skipMethodKeys,
                origMethod
              })
            : (...args: any[]) => Promise.resolve(origMethod.apply(this, args))
        }
      })
  }

  private generateConnectionInterface(cacheClient: PrimaryCacheClient): CacheClient {
    return {
      get: cacheClient.get.bind(cacheClient),
      set: cacheClient.set.bind(cacheClient),
      setex: (key: string, expireTime: number = 15, value: any) => {
        cacheClient.set(key, value, 'EX', expireTime)
      }
    }
  }
}
