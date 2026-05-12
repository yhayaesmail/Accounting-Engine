import { Redis } from "ioredis";
import { env } from "./env.js";

class MemoryRedis {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, seconds?: number) {
    const expiresAt = mode === "EX" && seconds ? Date.now() + seconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async incr(key: string) {
    const current = Number((await this.get(key)) ?? 0) + 1;
    this.store.set(key, { value: String(current), expiresAt: this.store.get(key)?.expiresAt });
    return current;
  }

  async expire(key: string, seconds: number) {
    const item = this.store.get(key);
    if (!item) return 0;
    this.store.set(key, { ...item, expiresAt: Date.now() + seconds * 1000 });
    return 1;
  }

  async del(key: string) {
    return this.store.delete(key) ? 1 : 0;
  }

  async flushall() {
    this.store.clear();
    return "OK";
  }
}

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })
  : new MemoryRedis();
