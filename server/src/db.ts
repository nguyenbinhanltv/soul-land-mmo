// Lưu trữ tài khoản và nhân vật.
// Có DATABASE_URL -> dùng PostgreSQL/Supabase. Không có -> lưu trong RAM (mất khi tắt server, chỉ để thử nhanh).
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Võ hồn đang ra trận của một tài khoản (một dòng bảng `vohons`). */
export interface Character {
  accountId: number; name: string;
  rowId: number;     // vohons.id
  vohon: string;     // mã võ hồn trong VOHON
  level: number; xp: number; stars: number;
  rings: number[];   // niên hạn (số năm) từng hồn hoàn
  kills: number;
}

export interface Store {
  init(): Promise<void>;
  login(name: string, password: string): Promise<{ token: string; accountId: number } | { error: string }>;
  accountFromToken(token: string): Promise<{ accountId: number; name: string } | null>;
  /** Võ hồn đang ra trận (tạm thời: võ hồn sở hữu sớm nhất). null = chưa thức tỉnh. */
  getCharacter(accountId: number): Promise<Character | null>;
  saveCharacter(c: Character): Promise<void>;
  /** Xóa mọi võ hồn của tài khoản và tạo võ hồn mới (thức tỉnh / thức tỉnh lại). */
  awaken(accountId: number, name: string, vohon: string, level: number): Promise<Character>;
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
  seq = 1; rowSeq = 1;
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
  async saveCharacter(c: Character) {
    if (this.chars.get(c.accountId)?.rowId === c.rowId) this.chars.set(c.accountId, { ...c, rings: [...c.rings] });
  }
  async awaken(accountId: number, name: string, vohon: string, level: number) {
    const c: Character = { accountId, name, rowId: this.rowSeq++, vohon, level, xp: 0, stars: 1, rings: [], kills: 0 };
    this.chars.set(accountId, c);
    return { ...c, rings: [] };
  }
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
    // Chạy lần lượt mọi file .sql theo tên (001_…, 002_…). Mỗi file phải an toàn khi chạy lại.
    const dir = new URL("../sql/", import.meta.url);
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    try {
      for (const f of files) await this.pool.query(readFileSync(new URL(f, dir), "utf8"));
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
      `SELECT v.*, a.name FROM vohons v JOIN accounts a ON a.id=v.account_id
       WHERE v.account_id=$1 ORDER BY v.id LIMIT 1`, [accountId]);
    if (!r.rowCount) return null;
    const x = r.rows[0];
    return { accountId, name: x.name, rowId: Number(x.id), vohon: x.vohon, level: x.level, xp: x.xp, stars: x.stars,
      rings: (x.rings ?? []).map(Number), kills: x.kills };
  }
  async saveCharacter(c: Character) {
    await this.pool.query(
      "UPDATE vohons SET level=$2, xp=$3, stars=$4, rings=$5, kills=$6, updated_at=now() WHERE id=$1",
      [c.rowId, c.level, c.xp, c.stars, c.rings, c.kills]);
  }
  async awaken(accountId: number, name: string, vohon: string, level: number) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      await db.query("DELETE FROM vohons WHERE account_id=$1", [accountId]);
      const r = await db.query("INSERT INTO vohons(account_id, vohon, level) VALUES ($1,$2,$3) RETURNING id", [accountId, vohon, level]);
      await db.query("COMMIT");
      return { accountId, name, rowId: Number(r.rows[0].id), vohon, level, xp: 0, stars: 1, rings: [], kills: 0 };
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
}

export const store: Store = process.env.DATABASE_URL ? new PgStore(process.env.DATABASE_URL) : new MemoryStore();
