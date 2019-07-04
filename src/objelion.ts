const _skipMethods = ['insert', 'create', 'add', 'update', 'alter', 'delete', 'destroy', 'remove']

interface PrimaryCacheClient {
  get(key: string): string
  set(key: string, value: any, strategy?: string, timeout?: number): string
}

interface CacheClient extends PrimaryCacheClient {
  setex(key: string, timeout: number, value: any): void
}


function _generateConnectionInterface(cacheClient: PrimaryCacheClient): CacheClient {
  return {
    get: cacheClient.get.bind(cacheClient),
    set: cacheClient.set.bind(cacheClient),
    setex: (key: string, timeout: number = 15, value: any) => {
      cacheClient.set(key, value, 'EX', timeout)
    }
  }
}

export default class Objelion {
  constructor(config: {
    redisInstance: CacheClient,
    cacheKeyRule: Function,
    skipMethods: array = _skipMethods,
    generateConnectionInterface = _generateConnectionInterface,
    enabled: boolean
  }) {
    this.redisInstance = config.redisInstance
    this.cacheKeyRule = config.cacheKeyRule
    this.skipMethods = config.skipMethods
    this.generateConnectionInterface = config.generateConnectionInterface
    this.enabled = config.enabled
  }

  createCacheMiddleware() {
    const cacheClient = this.generateConnectionInterface(this.redisInstance)
    const { enabled, skipMethods, cacheKeyRule } = this

    return targetDatasource =>
      new Proxy(targetDatasource, {
        get(targetObj, methodName) {
          const origMethod = targetObj[methodName]

          return enabled
            ? async (...args) => {
                const isSkipMetod = skipMethods.some(term =>
                  methodName.toLowerCase().includes(term)
                )

                const cacheKey = cacheKeyRule(methodName, args)
                const cacheResult = !isSkipMetod ? await cacheClient.get(cacheKey) : null

                if (cacheResult) {
                  return JSON.parse(cacheResult)
                }

                const result =
                  origMethod instanceof Promise
                    ? await origMethod.apply(this, args)
                    : origMethod.apply(this, args)

                if (!isSkipMetod) {
                  cacheClient.setex(cacheKey, 15, JSON.stringify(result))
                }

                return result
              }
            : async (...args) => origMethod.apply(this, args)
        }
      })
  }
}
