import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import { LocalPresence, type Presence } from "colyseus";
import { RedisPresence } from "@colyseus/redis-presence";

export const PRESENCE_TTL_MS = 15_000;
export const PRESENCE_HEARTBEAT_MS = 5_000;
/** Khóa lease giữ tài khoản của phiên đang chơi (MapRoom.holdAccount); script seed tài khoản test (#517) đọc khóa này để biết có đang online không. */
export const accountLeaseKey = (accountId: number) => `accountHold:${accountId}`;

/** Lỗi do mất / chập chờn kết nối Redis (ioredis, socket): không phải lỗi logic, nên không được làm chết tiến trình (#561). */
export function isRedisFailure(e: unknown) {
  if (!e || typeof e !== "object") return false;
  const { name, message } = e as { name?: string; message?: string };
  // Chỉ dấu hiệu riêng của ioredis: mã socket chung (ECONNRESET…) cũng do pg / fetch ném, không được coi là lỗi Redis. Lỗi socket của chính ioredis đã đi qua
  // sự kiện `error` (guardClient) nên không cần nhánh mã chung ở đây.
  return name === "MaxRetriesPerRequestError" || name === "ClusterAllFailedError" || name === "ReplyError" && /LOADING|READONLY|MASTERDOWN|CLUSTERDOWN|TRYAGAIN/.test(message ?? "")
    || /Connection is closed|Stream isn't writeable|Reached the max retries per request/.test(message ?? "");
}

/** Ghi log lỗi nền tối đa một lần mỗi 10 giây cho mỗi `what` (Redis mất cả phút không làm ngập log). */
const lastLogged = new Map<string, { at: number; skipped: number }>();
function logLimited(what: string, e: unknown) {
  const now = Date.now(), prev = lastLogged.get(what);
  if (prev && now - prev.at < 10_000) { prev.skipped++; return; }
  lastLogged.set(what, { at: now, skipped: 0 });
  console.error(`${what}${prev?.skipped ? ` (còn ${prev.skipped} lỗi cùng loại bị ẩn trong 10 giây qua)` : ""}:`, e instanceof Error ? `${e.name}: ${e.message}` : e);
}

/**
 * Chạy nền một thao tác presence (publish, ghi khóa TTL…): lỗi (thường là Redis mất) chỉ ghi log, không ném ra thành unhandledRejection
 * làm chết tiến trình (#561). Chỉ dùng khi chủ ý bỏ kết quả; đường cần biết kết quả vẫn `await` và tự xử lý lỗi (fail-closed).
 */
export function bg(op: unknown, what: string) {
  if (op && typeof (op as PromiseLike<unknown>).then === "function") void Promise.resolve(op).then(undefined, (e) => logLimited(what, e));
}

type LocalValue = { value: string; expiresAt: number };

export interface PresenceBackend {
  readonly mode: "local" | "redis";
  readonly presence: Presence;
  readonly workerId: string;
  /** Kết nối presence còn dùng được. Redis mất thì false: server báo /health lỗi và từ chối vào phòng mới (fail-closed, #561); RAM luôn true. */
  healthy(): boolean;
  acquireLease(key: string, owner: string, ttlMs?: number): Promise<boolean>;
  /** Như acquireLease nhưng trả fencing token (số tăng dần qua mỗi lần lấy khóa, đếm ở một khóa chung `fenceKey`, nên số khóa trong Redis không tăng theo số món); 0 = khóa đang có người giữ. Lỗi Redis thì ném lỗi (fail-closed). */
  acquireFenced(key: string, owner: string, ttlMs?: number, fenceKey?: string): Promise<number>;
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
  healthy() { return true; }
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

  private fence = new Map<string, number>();
  async acquireFenced(key: string, owner: string, ttlMs = PRESENCE_TTL_MS, fenceKey = "fence") {
    if (!(await this.acquireLease(key, owner, ttlMs))) return 0;
    const n = (this.fence.get(fenceKey) ?? 0) + 1;
    this.fence.set(fenceKey, n);
    return n;
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

  private down: number | null = null;

  constructor(url: string, prefix: string) {
    // Kết nối lại vô hạn (ioredis mặc định); lệnh đang chờ chỉ thử lại 2 lần rồi báo lỗi, nên mất Redis thì lệnh lỗi nhanh (fail-closed) thay vì treo.
    this.redis = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 2 });
    const rp = new RedisPresence(url);
    this.presence = safePresence(rp);
    this.prefix = prefix;
    this.watch("Redis (lệnh)", this.redis);
    // Hai kết nối pub / sub nội bộ của RedisPresence: gắn trình nghe lỗi (không có thì ioredis chỉ in "Unhandled error event") và theo dõi trạng thái.
    for (const k of ["pub", "sub"] as const) { const c = (rp as unknown as Record<string, unknown>)[k]; if (isClient(c)) this.watch(`Redis (${k})`, c); }
  }

  /** Theo dõi một kết nối: mất thì ghi giờ, có lại thì báo log; lỗi kết nối chỉ ghi log có giới hạn. */
  private watch(label: string, c: Redis) {
    guardClient(label, c);
    c.on("close", () => {
      if (c !== this.redis || this.down !== null) return;
      this.down = Date.now();
      console.error("Redis mất kết nối: server báo /health lỗi, từ chối người chơi vào phòng mới và tự kết nối lại tới khi Redis có lại.");
    });
    c.on("ready", () => {
      if (c !== this.redis || this.down === null) return;
      console.error(`Redis đã có lại sau ${Math.round((Date.now() - this.down) / 1000)} giây: server phục vụ lại.`); this.down = null;
    });
  }

  healthy() { return this.redis.status === "ready"; }

  private key(key: string) { return `${this.prefix}:${key}`; }

  async acquireLease(key: string, owner: string, ttlMs = PRESENCE_TTL_MS) {
    const result = await this.redis.eval(
      "if redis.call('exists', KEYS[1]) == 0 then redis.call('psetex', KEYS[1], ARGV[2], ARGV[1]); return 1 end; return 0",
      1, this.key(key), owner, String(ttlMs));
    return result === 1;
  }

  async acquireFenced(key: string, owner: string, ttlMs = PRESENCE_TTL_MS, fenceKey = "fence") {
    const result = await this.redis.eval(
      "if redis.call('exists', KEYS[1]) == 0 then redis.call('psetex', KEYS[1], ARGV[2], ARGV[1]); return redis.call('incr', KEYS[2]) end; return 0",
      2, this.key(key), this.key(fenceKey), owner, String(ttlMs));
    return Number(result);
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

const isClient = (c: unknown): c is Redis => !!c && typeof (c as Redis).on === "function";
/** Gắn trình nghe lỗi cho một kết nối ioredis (không có thì ioredis chỉ in "Unhandled error event" mỗi lần thử nối lại): ghi log có giới hạn. */
export function guardClient(label: string, c: Redis) { c.on("error", (e) => logLimited(`${label}: lỗi kết nối`, e)); }

/**
 * Bọc Presence của Colyseus: publish / subscribe / unsubscribe của RedisPresence trả promise mà nhiều chỗ gọi kiểu `this.presence.publish(…)`
 * không `await` (phòng, lịch boss, hàng chờ đấu trường); Redis lỗi thì lỗi đó thành unhandledRejection. Ở đây bắt lại, ghi log, trả mặc định.
 * Tin pub/sub vốn không đảm bảo giao (mất kết nối là mất tin), nên bỏ tin lúc Redis mất không đổi hợp đồng.
 */
function safePresence(inner: RedisPresence): Presence {
  const wrapped = new Set(["publish", "subscribe", "unsubscribe"]);
  return new Proxy(inner, {
    get(target, prop) {
      const v = Reflect.get(target, prop, target);
      if (typeof v !== "function") return v;
      if (typeof prop !== "string" || !wrapped.has(prop)) return v.bind(target);
      return (...args: unknown[]) => {
        try { const r = v.apply(target, args); return r && typeof r.then === "function" ? Promise.resolve(r).catch((e) => { logLimited(`Presence ${prop}`, e); return 0; }) : r; }
        catch (e) { logLimited(`Presence ${prop}`, e); return 0; }
      };
    },
  }) as unknown as Presence;
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
