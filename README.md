# objex

A cache layer to object functions

## How to use

```js
const Objex = require('objex');
const Redis = require('redis-node'); // it works with ioredis too

const redisClient = new Redis({
  // redis connection data
});

const objex = new Objex({
  enabled: true,
  redisInstance: redisClient,
  cacheKeyRule: (fnName, args) => 'Rule to mount keys',
});

const cacheMiddleware = objex.createCacheMiddleware();

const targetObject = {
  sum: () => 2 + 2;
}

// will cache sum function
cacheMiddleware(targetObject).sum().then(response => console.log(response)) // 4

```

## Installation

```
  $ yarn add objex
```

## Tests

```
  $ yarn test
```
