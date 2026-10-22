import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import { LocalPresence, type Presence } from "colyseus";
import { RedisPresence } from "@colyseus/redis-presence";

export const PRESENCE_TTL_MS = 15_000;
export const PRESENCE_HEARTBEAT_MS = 5_000;

type LocalValue = { value: string; expiresAt: number };

export interface PresenceBackend {
  readonly mode: "local" | "redis";
  readonly presence: Presence;
  readonly workerId: string;
  acquireLease(key: string, owner: string, ttlMs?: number): Promise<boolean>;
  renewLease(key: string, owner: string, ttlMs?: number): Promise<boolean>;
  releaseLease(key: string, owner: string): Promise<boolean>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttlMs?: number): Promise<void>;
  getJson<T>(key: string): Promise<T | null>;
  getJsonMany<T>(keys: readonly string[]): Promise<(T | null)[]>;
  putJson<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  withLock<T>(key: string, owner: string, lockTtlMs: number, update: (value: T | null) => T | Promise<T>, dataTtlMs?: number): Promise<boolean>;
  close(): Promise<void>;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

class LocalBackend implements PresenceBackend {
  readonly mode = "local" as const;
  readonly presence = new LocalPresence();
  readonly workerId = `ram-${process.pid}-${randomUUID()}`;
  private readonly values = new Map<string, LocalValue>();

  private prune(key: string) {
    const found = this.values.get(key);
    if (found && found.expiresAt <= Date.now()) this.values.delete(key);
    return this.values.get(key);
  }

  async acquireLease(key: string, owner: string, ttlMs = PRESENCE_TTL_MS) {
    if (this.prune(key)) return false;
    this.values.set(key, { value: owner, expiresAt: Date.now() + ttlMs });
    return true;
  }

  async renewLease(key: string, owner: string, ttlMs = PRESENCE_TTL_MS) {
    const found = this.prune(key);
    if (!found || found.value !== owner) return false;
    found.expiresAt = Date.now() + ttlMs;
    return true;
  }

  async releaseLease(key: string, owner: string) {
    const found = this.prune(key);
    if (!found || found.value !== owner) return false;
    this.values.delete(key);
    return true;
  }

  async get(key: string) { return this.prune(key)?.value ?? null; }

  async put(key: string, value: string, ttlMs = 0) {
    this.values.set(key, { value, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : Number.POSITIVE_INFINITY });
  }

  async getJson<T>(key: string) {
    const value = await this.get(key);
    return value === null ? null : JSON.parse(value) as T;
  }

  async getJsonMany<T>(keys: readonly string[]) {
    return Promise.all(keys.map((key) => this.getJson<T>(key)));
  }

  async putJson<T>(key: string, value: T, ttlMs = 0) { await this.put(key, JSON.stringify(value), ttlMs); }
  async delete(key: string) { this.values.delete(key); }

  async withLock<T>(key: string, owner: string, lockTtlMs: number, update: (value: T | null) => T | Promise<T>, dataTtlMs = 0) {
    const lock = `${key}:lock`;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await this.acquireLease(lock, owner, lockTtlMs)) {
        try {
          const next = await update(await this.getJson<T>(key));
          await this.putJson(key, next, dataTtlMs);
          return true;
        } finally { await this.releaseLease(lock, owner); }
      }
      await sleep(10);
    }
    return false;
  }

  async close() { /* LocalPresence is owned by Colyseus and has no shutdown method. */ }
}

class RedisBackend implements PresenceBackend {
  readonly mode = "redis" as const;
  readonly presence: Presence;
  readonly workerId = `redis-${process.pid}-${randomUUID()}`;
  private readonly redis: Redis;
  private readonly prefix: string;

  constructor(url: string, prefix: string) {
    this.redis = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 2 });
    this.presence = new RedisPresence(url);
    this.prefix = prefix;
  }

  private key(key: string) { return `${this.prefix}:${key}`; }

  async acquireLease(key: string, owner: string, ttlMs = PRESENCE_TTL_MS) {
    const result = await this.redis.eval(
      "if redis.call('exists', KEYS[1]) == 0 then redis.call('psetex', KEYS[1], ARGV[2], ARGV[1]); return 1 end; return 0",
      1, this.key(key), owner, String(ttlMs));
    return result === 1;
  }

  async renewLease(key: string, owner: string, ttlMs = PRESENCE_TTL_MS) {
    const result = await this.redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then redis.call('pexpire', KEYS[1], ARGV[2]); return 1 end; return 0",
      1, this.key(key), owner, String(ttlMs));
    return result === 1;
  }

  async releaseLease(key: string, owner: string) {
    const result = await this.redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end; return 0",
      1, this.key(key), owner);
    return result === 1;
  }

  async get(key: string) { return this.redis.get(this.key(key)); }
  async put(key: string, value: string, ttlMs = 0) {
    if (ttlMs > 0) await this.redis.set(this.key(key), value, "PX", ttlMs);
    else await this.redis.set(this.key(key), value);
  }
  async getJson<T>(key: string) {
    const value = await this.get(key);
    return value === null ? null : JSON.parse(value) as T;
  }
  async getJsonMany<T>(keys: readonly string[]) {
    if (!keys.length) return [];
    const values = await this.redis.mget(keys.map((key) => this.key(key)));
    return values.map((value) => value === null ? null : JSON.parse(value) as T);
  }
  async putJson<T>(key: string, value: T, ttlMs = 0) { await this.put(key, JSON.stringify(value), ttlMs); }
  async delete(key: string) { await this.redis.del(this.key(key)); }

  async withLock<T>(key: string, owner: string, lockTtlMs: number, update: (value: T | null) => T | Promise<T>, dataTtlMs = 0) {
    const lock = `${key}:lock`;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await this.acquireLease(lock, owner, lockTtlMs)) {
        try {
          const next = await update(await this.getJson<T>(key));
          await this.putJson(key, next, dataTtlMs);
          return true;
        } finally { await this.releaseLease(lock, owner); }
      }
      await sleep(10);
    }
    return false;
  }

  async close() {
    await Promise.allSettled([this.redis.quit(), Promise.resolve((this.presence as RedisPresence).shutdown())]);
  }
}

export function createPresenceBackend(options: { mode?: "local" | "redis"; redisUrl?: string; prefix?: string } = {}): PresenceBackend {
  const url = options.redisUrl ?? process.env.REDIS_URL?.trim();
  const mode = options.mode ?? (url ? "redis" : "local");
  if (mode === "redis") {
    if (!url) throw new Error("REDIS_URL is required when RedisPresence is enabled.");
    return new RedisBackend(url, options.prefix ?? (process.env.REDIS_PREFIX?.trim() || "soul-land-mmo:presence"));
  }
  return new LocalBackend();
}

export const presenceBackend = createPresenceBackend();
export const gamePresence = presenceBackend.presence;
