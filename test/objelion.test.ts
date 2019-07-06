import Objelion, { CacheClient, TargetObject } from '../src/objelion'

const cache: TargetObject = {}

const redisClient: CacheClient = {
  set: (key: string, value: any, strategy?: string, timeout?: any): any => {
    cache[key] = value
    return value
  },
  get: (key: string) => cache[key],
  // tslint:disable-next-line:no-empty
  setex: () => {}
}

const cacheKeyRule = (fnName: string, args: any[]) =>
  `TEST_TARGET-test-${fnName}-${JSON.stringify(args)}`

test('curry pattern', () => {
  const objelion = new Objelion({
    enabled: true,
    cacheClient: redisClient,
    cacheKeyRule,
    expireTime: 15
  })

  const cacheMiddleware = objelion.createCacheMiddleware()

  expect(cacheMiddleware).toBeInstanceOf(Function)
})

test('caches object functions', () => {
  const objelion = new Objelion({
    enabled: true,
    cacheClient: redisClient,
    cacheKeyRule,
    expireTime: 15
  })

  const targetObj = {
    testFun: () => 2 + 2
  }

  const cacheMiddleware = objelion.createCacheMiddleware()
  const cachedTargetObj = cacheMiddleware(targetObj)

  cachedTargetObj
    .testFun()
    .then((result: any) => {
      expect(result).toBe(4)
    })
    // tslint:disable-next-line:no-empty
    .catch(() => {})
})

test('caches object from promises', () => {
  const objelion = new Objelion({
    enabled: true,
    cacheClient: redisClient,
    cacheKeyRule,
    expireTime: 15
  })

  const targetObj = {
    testFun: () => Promise.resolve(2 + 2)
  }

  const cacheMiddleware = objelion.createCacheMiddleware()
  const cachedTargetObj = cacheMiddleware(targetObj)

  cachedTargetObj
    .testFun()
    .then((result: any) => {
      expect(result).toBe(4)
    })
    // tslint:disable-next-line:no-empty
    .catch(() => {})
})

test('saves key with rule function', () => {
  const objelion = new Objelion({
    enabled: true,
    cacheClient: redisClient,
    cacheKeyRule,
    expireTime: 15
  })

  delete cache['TEST_TARGET-test-testFun-[]']

  const targetObj = {
    testFun: () => 2 + 2
  }

  const cacheMiddleware = objelion.createCacheMiddleware()
  const cachedTargetObj = cacheMiddleware(targetObj)

  cachedTargetObj
    .testFun()
    .then(() => {
      expect('TEST_TARGET-test-testFun-[]' in cache).toBe(true)
    })
    // tslint:disable-next-line:no-empty
    .catch(() => {})
})

test('handle enabled', () => {
  const objelion = new Objelion({
    enabled: true,
    cacheClient: redisClient,
    cacheKeyRule,
    expireTime: 15
  })
  delete cache['TEST_TARGET-test-testFun-[]']

  const targetObj = {
    testFun: () => 2 + 2
  }

  const cacheMiddleware = objelion.createCacheMiddleware()
  const cachedTargetObj = cacheMiddleware(targetObj)

  cachedTargetObj
    .testFun()
    .then(() => {
      expect(Object.keys(cache).length).toBe(0)
    })
    // tslint:disable-next-line:no-empty
    .catch(() => {})
})

test('memoization saves', () => {
  const objelion = new Objelion({
    enabled: true,
    cacheKeyRule,
    expireTime: 15
  })

  const targetObj = {
    testFun: () => 2 + 2
  }

  const cacheMiddleware = objelion.createCacheMiddleware()
  const cachedTargetObj = cacheMiddleware(targetObj)

  cachedTargetObj
    .testFun()
    .then((result: any) => {
      expect(result).toBe(4)
    })
    // tslint:disable-next-line:no-empty
    .catch(() => {})
})
