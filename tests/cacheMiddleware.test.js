const Objex = require('../src');

const cache = {};

const redisClient = {
  set: (key, value, t, time) => {
    cache[key] = value;
    return value;
  },
  get: key => cache[key],
};

const cacheKeyRule = (fnName, args) => `TEST_TARGET-test-${fnName}-${JSON.stringify(args)}`;

test('curry pattern', () => {
  const objex = new Objex({
    enabled: true,
    redisInstance: redisClient,
    cacheKeyRule,
  });

  const cacheMiddleware = objex.createCacheMiddleware();

  expect(cacheMiddleware).toBeInstanceOf(Function);
});

test('caches object functions', () => {
  const objex = new Objex({
    enabled: true,
    redisInstance: redisClient,
    cacheKeyRule,
  });

  const targetObj = {
    testFun: () => 2 + 2,
  };

  const cacheMiddleware = objex.createCacheMiddleware();
  const cachedTargetObj = cacheMiddleware(targetObj);

  cachedTargetObj
    .testFun()
    .then(result => {
      expect(result).toBe(2);
    })
    .catch(() => {});
});

test('saves key with rule function', () => {
  const objex = new Objex({
    enabled: true,
    redisInstance: redisClient,
    cacheKeyRule,
  });

  delete cache['TEST_TARGET-test-testFun-[]'];

  const targetObj = {
    testFun: () => 2 + 2,
  };

  const cacheMiddleware = objex.createCacheMiddleware();
  const cachedTargetObj = cacheMiddleware(targetObj);

  cachedTargetObj
    .testFun()
    .then(() => {
      expect('TEST_TARGET-test-testFun-[]' in cache).toBe(true);
    })
    .catch(() => {});
});

test('handle enabled', () => {
  const objex = new Objex({
    enabled: false,
    redisInstance: redisClient,
    cacheKeyRule,
  });

  delete cache['TEST_TARGET-test-testFun-[]'];

  const targetObj = {
    testFun: () => 2 + 2,
  };

  const cacheMiddleware = objex.createCacheMiddleware();
  const cachedTargetObj = cacheMiddleware(targetObj);

  cachedTargetObj
    .testFun()
    .then(() => {
      expect(Object.keys(cache).length).toBe(0);
    })
    .catch(() => {});
});
