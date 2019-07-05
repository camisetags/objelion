interface PrimaryCacheClient {
  get(key: string): string
  set(key: string, value: any, strategy?: string, timeout?: number): string
}

export interface CacheClient extends PrimaryCacheClient {
  setex(key: string, timeout: number, value: any): void
}

interface Config {
  redisInstance: CacheClient
  cacheKeyRule: Function
  skipMethodKeys?: Array<string>
  enabled: boolean
  expireTime: number
}

export interface TargetObject {
  [prop: string]: any
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

export default class Objelion {
  private redisInstance: CacheClient
  private cacheKeyRule: Function
  private skipMethodKeys: Array<string>
  private enabled: boolean
  private expireTime: number

  constructor(config: Config) {
    this.redisInstance = config.redisInstance
    this.cacheKeyRule = config.cacheKeyRule
    this.skipMethodKeys = config.skipMethodKeys || _skipMethodKeys
    this.enabled = config.enabled
    this.expireTime = config.expireTime
  }

  public createCacheMiddleware() {
    const cacheClient = this.generateConnectionInterface(this.redisInstance)
    const { enabled, skipMethodKeys, cacheKeyRule, expireTime } = this

    return (targetDatasource: TargetObject) =>
      new Proxy(targetDatasource, {
        get(targetObj: TargetObject, methodName: string) {
          const origMethod = targetObj[methodName]

          return enabled
            ? async (...args: any[]) => {
                const isSkipMetod = skipMethodKeys.some(term =>
                  methodName.toLowerCase().includes(term)
                )

                const cacheKey = cacheKeyRule(methodName, args)
                const cacheResult = !isSkipMetod ? await cacheClient.get(cacheKey) : null

                if (cacheResult) {
                  return JSON.parse(cacheResult)
                }

                const result = await Promise.resolve(origMethod.apply(this, args))

                if (!isSkipMetod) {
                  cacheClient.setex(cacheKey, expireTime, JSON.stringify(result))
                }

                return result
              }
            : async (...args: any[]) => Promise.resolve(origMethod.apply(this, args))
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
