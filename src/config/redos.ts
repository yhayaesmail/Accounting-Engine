import RedisPackage from "ioredis";
const Redis = RedisPackage.default || RedisPackage;

export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});