

const IORedis = require("ioredis");

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) throw new Error("REDIS_URL missing in .env");

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  tls: {}, // required for rediss://
});

module.exports = connection;


/* use below one when on development phase to work with redis locally */

// const IORedis = require("ioredis");

// const connection = new IORedis({
//   host: process.env.REDIS_HOST,
//   port: Number(process.env.REDIS_PORT),
//   maxRetriesPerRequest: null,
// });

// module.exports = connection;


