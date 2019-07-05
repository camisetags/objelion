const _skipMethods = ['insert', 'create', 'add', 'update', 'alter', 'delete', 'destroy', 'remove'];

function _generateConnectionInterface(cacheClient) {
  return {
    get: cacheClient.get.bind(cacheClient),
    set: cacheClient.set.bind(cacheClient),
    setex: (key, timeout = 15, value) => {
      cacheClient.set(key, value, 'EX', timeout);
    },
  };
}

class Objelion {
  constructor({
    redisInstance,
    cacheKeyRule,
    skipMethods = _skipMethods,
    generateConnectionInterface = _generateConnectionInterface,
    enabled,
  }) {
    this.redisInstance = redisInstance;
    this.cacheKeyRule = cacheKeyRule;
    this.skipMethods = skipMethods;
    this.generateConnectionInterface = generateConnectionInterface;
    this.enabled = enabled;
  }

  createCacheMiddleware() {
    const cacheClient = this.generateConnectionInterface(this.redisInstance);
    const { enabled, skipMethods, cacheKeyRule } = this;

    return targetDatasource =>
      new Proxy(targetDatasource, {
        get(targetObj, methodName) {
          const origMethod = targetObj[methodName];

          return enabled
            ? async (...args) => {
                const isSkipMetod = skipMethods.some(term =>
                  methodName.toLowerCase().includes(term),
                );

                const cacheKey = cacheKeyRule(methodName, args);
                const cacheResult = !isSkipMetod ? await cacheClient.get(cacheKey) : null;

                if (cacheResult) {
                  return JSON.parse(cacheResult);
                }

                const result =
                  origMethod instanceof Promise
                    ? await origMethod.apply(this, args)
                    : origMethod.apply(this, args);

                if (!isSkipMetod) {
                  cacheClient.setex(cacheKey, 15, JSON.stringify(result));
                }

                return result;
              }
            : async (...args) => origMethod.apply(this, args);
        },
      });
  }
}

module.exports = Objelion;
