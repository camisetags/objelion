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
  skipMethodKeys?: string[]
  enabled: boolean
  expireTime: number
}
