import { CacheClient, CacheResult, TargetObject, PrimaryCacheClient } from './cacheTypes';

const _skipMethodKeys = [
  'new',
  'save',
  'insert',
  'create',
  'add',
  'update',
  'alter',
  'delete',
  'destroy',
  'remove'
];

export interface Config {
  cacheClient?: CacheClient;
  cacheKeyRule: (fnName: string, args: any[]) => string;
  skipMethodKeys?: string[];
  enabled: boolean;
  expireTime: number;
}

export default class Objelion {
  private cacheClient: CacheClient;
  private cacheKeyRule: (fnName: string, args: any[]) => string;
  private skipMethodKeys: Array<string>;
  private enabled: boolean;
  private expireTime: number;
  private cache: CacheResult = {};

  private isInternalClient: boolean = false;

  constructor(config: Config) {
    if (config.cacheClient) {
      this.isInternalClient = true;
    }
    this.cacheClient = config.cacheClient || this.memoizationClient;
    this.cacheKeyRule = config.cacheKeyRule;
    this.skipMethodKeys = config.skipMethodKeys || _skipMethodKeys;
    this.enabled = config.enabled;
    this.expireTime = config.expireTime;
  }

  private memoizationClient: CacheClient = {
    get: (key: string): string => {
      return this.cache[key];
    },

    set: (key: string, value: any): string => {
      this.cache[key] = value;
      return this.cache[key];
    },

    setex: (key: string, expireTime: number = 15, value: any): void => {
      this.cache[key] = value;

      setTimeout(() => {
        delete this.cache[key];
      }, expireTime * 1000);
    }
  };

  private generateConnectionInterface(cacheClient: PrimaryCacheClient): CacheClient {
    return {
      get: cacheClient.get.bind(cacheClient),
      set: cacheClient.set.bind(cacheClient),
      setex: (key: string, expireTime: number = 15, value: any) => {
        cacheClient.set(key, value, 'EX', expireTime);
      }
    };
  }

  public createCacheMiddleware() {
    const cacheClient = this.isInternalClient
      ? this.memoizationClient
      : this.generateConnectionInterface(this.cacheClient);

    const { enabled, skipMethodKeys, cacheKeyRule, expireTime } = this;

    return (targetDatasource: TargetObject) =>
      new Proxy(targetDatasource, {
        get(targetObj: TargetObject, methodName: string) {
          const origMethod = targetObj[methodName];

          if (enabled) {
            return async (...args: any[]) => {
              const isSkipMetod = skipMethodKeys.some((term: string) =>
                methodName.toLowerCase().includes(term)
              );

              const cacheKey = cacheKeyRule(methodName, args);
              const cacheResult = !isSkipMetod ? await cacheClient.get(cacheKey) : null;

              if (cacheResult) {
                return JSON.parse(cacheResult);
              }

              const result = await Promise.resolve(origMethod.apply(this, args));

              if (!isSkipMetod) {
                cacheClient.setex(cacheKey, expireTime, JSON.stringify(result));
              }

              return result;
            };
          }

          return async (...args: any[]) => Promise.resolve(origMethod.apply(this, args));
        }
      });
  }
}
