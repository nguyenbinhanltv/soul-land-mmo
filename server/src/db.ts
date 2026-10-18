// Lưu trữ tài khoản và nhân vật.
// Có DATABASE_URL -> dùng PostgreSQL/Supabase. Không có -> lưu trong RAM (mất khi tắt server, chỉ để thử nhanh).
import pg from "pg";
import { readFileSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export interface Character {
  accountId: number; name: string;
  vohon: number; innate: number; level: number; xp: number; rings: number[]; kills: number;
}

export interface Store {
  init(): Promise<void>;
  login(name: string, password: string): Promise<{ token: string; accountId: number } | { error: string }>;
  accountFromToken(token: string): Promise<{ accountId: number; name: string } | null>;
  getCharacter(accountId: number): Promise<Character | null>;
  saveCharacter(c: Character): Promise<void>;
}

function hashPass(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;
}
function checkPass(pw: string, stored: string) {
  const [salt, hex] = stored.split(":");
  const a = Buffer.from(hex, "hex"), b = scryptSync(pw, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}
const newToken = () => randomBytes(24).toString("base64url");

class MemoryStore implements Store {
  accounts = new Map<string, { id: number; pass: string }>();
  names = new Map<number, string>();
  sessions = new Map<string, number>();
  chars = new Map<number, Character>();
  seq = 1;
  async init() { console.warn("⚠  Chưa có DATABASE_URL: dữ liệu chỉ lưu trong RAM."); }
  async login(name: string, password: string) {
    let acc = this.accounts.get(name.toLowerCase());
    if (!acc) { acc = { id: this.seq++, pass: hashPass(password) }; this.accounts.set(name.toLowerCase(), acc); this.names.set(acc.id, name); }
    else if (!checkPass(password, acc.pass)) return { error: "Sai mật khẩu." };
    const token = newToken(); this.sessions.set(token, acc.id);
    return { token, accountId: acc.id };
  }
  async accountFromToken(token: string) {
    const id = this.sessions.get(token); return id ? { accountId: id, name: this.names.get(id)! } : null;
  }
  async getCharacter(id: number) { const c = this.chars.get(id); return c ? { ...c, rings: [...c.rings] } : null; }
  async saveCharacter(c: Character) { this.chars.set(c.accountId, { ...c, rings: [...c.rings] }); }
}

class PgStore implements Store {
  pool: pg.Pool;
  constructor(url: string) {
    const ssl = process.env.PGSSL === "false" ? false : /supabase|sslmode=require/.test(url) || process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false;
    this.pool = new pg.Pool({ connectionString: url, ssl, max: 10, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000 });
    // Pooler của Supabase có thể cắt kết nối rảnh; không bắt lỗi này thì Node sẽ sập cả server.
    this.pool.on("error", (e) => console.error("Kết nối PostgreSQL bị ngắt (pool sẽ tự mở lại):", e.message));
  }
  async init() {
    const sql = readFileSync(new URL("../sql/001_init.sql", import.meta.url), "utf8");
    try {
      await this.pool.query(sql);
    } catch (e) {
      const host = (() => { try { return new URL(process.env.DATABASE_URL!).host; } catch { return "?"; } })();
      console.error(`✗ Không kết nối được PostgreSQL (${host}): ${(e as Error).message}`);
      if (/db\.[a-z0-9]+\.supabase\.co/.test(host))
        console.error("  Gợi ý: kết nối trực tiếp db.<ref>.supabase.co chỉ hỗ trợ IPv6. Dùng chuỗi \"Session pooler\" (…pooler.supabase.com:5432).");
      throw e;
    }
    console.log("✓ Đã kết nối PostgreSQL và cập nhật bảng.");
  }
  async login(name: string, password: string) {
    const found = await this.pool.query("SELECT id, pass_hash FROM accounts WHERE lower(name)=lower($1)", [name]);
    let id: number;
    if (found.rowCount === 0) {
      const ins = await this.pool.query("INSERT INTO accounts(name, pass_hash) VALUES ($1,$2) RETURNING id", [name, hashPass(password)]);
      id = Number(ins.rows[0].id);
    } else {
      if (!checkPass(password, found.rows[0].pass_hash)) return { error: "Sai mật khẩu." };
      id = Number(found.rows[0].id);
    }
    const token = newToken();
    await this.pool.query("INSERT INTO sessions(token, account_id) VALUES ($1,$2)", [token, id]);
    return { token, accountId: id };
  }
  async accountFromToken(token: string) {
    const r = await this.pool.query(
      "SELECT a.id, a.name FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token=$1 AND s.created_at > now() - interval '30 days'", [token]);
    return r.rowCount ? { accountId: Number(r.rows[0].id), name: r.rows[0].name as string } : null;
  }
  async getCharacter(accountId: number) {
    const r = await this.pool.query(
      "SELECT c.*, a.name FROM characters c JOIN accounts a ON a.id=c.account_id WHERE c.account_id=$1", [accountId]);
    if (!r.rowCount) return null;
    const x = r.rows[0];
    return { accountId, name: x.name, vohon: x.vohon, innate: x.innate, level: x.level, xp: x.xp, rings: x.rings ?? [], kills: x.kills };
  }
  async saveCharacter(c: Character) {
    await this.pool.query(
      `INSERT INTO characters(account_id, vohon, innate, level, xp, rings, kills, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,now())
       ON CONFLICT (account_id) DO UPDATE SET vohon=$2, innate=$3, level=$4, xp=$5, rings=$6, kills=$7, updated_at=now()`,
      [c.accountId, c.vohon, c.innate, c.level, c.xp, c.rings, c.kills]);
  }
}

export const store: Store = process.env.DATABASE_URL ? new PgStore(process.env.DATABASE_URL) : new MemoryStore();
