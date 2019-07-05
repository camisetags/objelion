# objelion

A cache layer for object functions

## How to use

```js
const Objelion = require('objelion');
const Redis = require('redis-node'); // it also works with ioredis

const redisClient = new Redis({
  // redis connection data
});

const objelion = new Objelion({
  enabled: true,
  cacheClient: redisClient, // by default you can use memoization
  cacheKeyRule: (fnName, args) => 'Rule to mount keys',
  expireTime: 15
});

const cacheMiddleware = objelion.createCacheMiddleware();

const targetObject = {
  sum: () => 2 + 2;
}

// will cache sum function
cacheMiddleware(targetObject).sum().then(response => console.log(response)) // 4

```

## Installation

```
  $ yarn add objelion
```

## Tests

```
  $ yarn test
```
