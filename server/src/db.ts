// Lưu trữ tài khoản và võ hồn sở hữu.
// Có DATABASE_URL -> dùng PostgreSQL/Supabase. Không có -> lưu trong RAM (mất khi tắt server, chỉ để thử nhanh).
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { nameKey } from "./names.ts";

/** Một võ hồn tài khoản sở hữu (một dòng bảng `vohons`). Mỗi võ hồn có cấp, kinh nghiệm, hồn hoàn riêng. */
export interface Character {
  accountId: number; name: string;
  rowId: number;     // vohons.id
  vohon: string;     // mã võ hồn trong VOHON
  level: number; xp: number; stars: number;
  rings: number[];   // niên hạn (số năm) từng hồn hoàn
  kills: number;
}

// Nguyên tắc: không bao giờ mất võ hồn. Store không có hàm xóa võ hồn.
export interface Store {
  init(): Promise<void>;
  /** Tìm tài khoản theo nameKey(name) (names.ts), chưa có thì tạo với tên hiển thị `name`. */
  login(name: string, password: string): Promise<{ token: string; accountId: number } | { error: string }>;
  accountFromToken(token: string): Promise<{ accountId: number; name: string } | null>;
  /** Võ hồn đang ra trận (chưa chọn thì là võ hồn sở hữu sớm nhất). null = chưa thức tỉnh. */
  getCharacter(accountId: number): Promise<Character | null>;
  /** Mọi võ hồn tài khoản sở hữu, theo thứ tự nhận được. */
  listVohons(accountId: number): Promise<Character[]>;
  /** Thêm võ hồn mới. null nếu tài khoản đã có võ hồn này. */
  addVohon(accountId: number, name: string, vohon: string, level: number): Promise<Character | null>;
  /** Chọn võ hồn ra trận. false nếu dòng `rowId` không thuộc tài khoản. */
  setActive(accountId: number, rowId: number): Promise<boolean>;
  saveCharacter(c: Character): Promise<void>;
  /** Thức tỉnh lần đầu: tạo các võ hồn khởi đầu và cho `active` ra trận.
   *  null nếu tài khoản đã có võ hồn (thức tỉnh chỉ diễn ra một lần). */
  awaken(accountId: number, name: string, starters: string[], active: string, level: number): Promise<Character | null>;
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
const copy = (c: Character): Character => ({ ...c, rings: [...c.rings] });

export class MemoryStore implements Store {
  accounts = new Map<string, { id: number; pass: string }>();  // nameKey(tên) -> tài khoản
  names = new Map<number, string>();
  sessions = new Map<string, number>();
  rows = new Map<number, Character>();  // vohons.id -> võ hồn
  active = new Map<number, number>();   // accountId -> vohons.id đang ra trận
  seq = 1; rowSeq = 1;
  async init() { console.warn("⚠  Chưa có DATABASE_URL: dữ liệu chỉ lưu trong RAM."); }
  async login(name: string, password: string) {
    const key = nameKey(name);
    let acc = this.accounts.get(key);
    if (!acc) { acc = { id: this.seq++, pass: hashPass(password) }; this.accounts.set(key, acc); this.names.set(acc.id, name); }
    else if (!checkPass(password, acc.pass)) return { error: "Sai mật khẩu." };
    const token = newToken(); this.sessions.set(token, acc.id);
    return { token, accountId: acc.id };
  }
  async accountFromToken(token: string) {
    const id = this.sessions.get(token); return id ? { accountId: id, name: this.names.get(id)! } : null;
  }
  owned(accountId: number) { return [...this.rows.values()].filter((c) => c.accountId === accountId).sort((a, b) => a.rowId - b.rowId); }
  async getCharacter(accountId: number) {
    const list = this.owned(accountId), c = list.find((x) => x.rowId === this.active.get(accountId)) ?? list[0];
    return c ? copy(c) : null;
  }
  async listVohons(accountId: number) { return this.owned(accountId).map(copy); }
  async addVohon(accountId: number, name: string, vohon: string, level: number) {
    if (this.owned(accountId).some((c) => c.vohon === vohon)) return null;
    const c: Character = { accountId, name, rowId: this.rowSeq++, vohon, level, xp: 0, stars: 1, rings: [], kills: 0 };
    this.rows.set(c.rowId, c);
    return copy(c);
  }
  async setActive(accountId: number, rowId: number) {
    if (this.rows.get(rowId)?.accountId !== accountId) return false;
    this.active.set(accountId, rowId); return true;
  }
  async saveCharacter(c: Character) {
    const cur = this.rows.get(c.rowId);
    if (cur?.accountId === c.accountId) this.rows.set(c.rowId, { ...copy(c), vohon: cur.vohon });
  }
  async awaken(accountId: number, name: string, starters: string[], active: string, level: number) {
    if (this.owned(accountId).length) return null;
    for (const v of starters) await this.addVohon(accountId, name, v, level);
    const a = this.owned(accountId).find((c) => c.vohon === active);
    if (!a) throw new Error(`Võ hồn ra trận ${active} không nằm trong danh sách khởi đầu.`);
    this.active.set(accountId, a.rowId);
    return copy(a);
  }
}

export class PgStore implements Store {
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
      await this.backfillNameKeys();
    } catch (e) {
      const host = (() => { try { return new URL(process.env.DATABASE_URL!).host; } catch { return "?"; } })();
      console.error(`✗ Không kết nối được PostgreSQL (${host}): ${(e as Error).message}`);
      if (/db\.[a-z0-9]+\.supabase\.co/.test(host))
        console.error("  Gợi ý: kết nối trực tiếp db.<ref>.supabase.co chỉ hỗ trợ IPv6. Dùng chuỗi \"Session pooler\" (…pooler.supabase.com:5432).");
      throw e;
    }
    console.log("✓ Đã kết nối PostgreSQL và cập nhật bảng.");
  }
  /**
   * Điền accounts.name_key (cột thêm ở 004_account_name_key.sql) cho tài khoản chưa có. Tính bằng nameKey trong JS,
   * không bằng SQL, để khớp tuyệt đối với login() và rate limit. Chạy mỗi lần khởi động, chỉ đụng dòng name_key IS NULL.
   * Hai tài khoản cũ trùng khóa (vd "Tam" và "ＴＡＭ", tạo trước khi có cột này): tài khoản cũ nhất giữ khóa; tài khoản
   * còn lại KHÔNG bị xóa, giữ name_key NULL và bị cảnh báo mỗi lần khởi động. Chủ của nó vẫn đăng nhập được bằng tên
   * (mọi cách viết) và mật khẩu RIÊNG của mình (xem login), nên người tạo sau không bị kẻ chiếm tên trước khóa ngoài.
   * Xử lý tay: đổi tên nó (UPDATE accounts SET name='…' WHERE id=…), lần khởi động sau tự điền.
   */
  async backfillNameKeys() {
    const r = await this.pool.query("SELECT id, name FROM accounts WHERE name_key IS NULL ORDER BY created_at, id");
    for (const a of r.rows) {
      const key = nameKey(a.name);
      const u = await this.pool.query(
        "UPDATE accounts SET name_key=$2 WHERE id=$1 AND NOT EXISTS (SELECT 1 FROM accounts WHERE name_key=$2) RETURNING id", [a.id, key]);
      if (u.rowCount) continue;
      const owner = await this.pool.query("SELECT id, name FROM accounts WHERE name_key=$1", [key]);
      console.warn(`⚠  Tài khoản #${a.id} "${a.name}" trùng tên với tài khoản cũ hơn #${owner.rows[0]?.id} "${owner.rows[0]?.name}" `
        + `sau khi chuẩn hóa. Giữ nguyên dữ liệu; chủ #${a.id} vẫn vào được bằng mật khẩu riêng. Nên đổi tên #${a.id}.`);
    }
  }
  async login(name: string, password: string) {
    const key = nameKey(name);
    const find = async () => (await this.pool.query("SELECT id, pass_hash FROM accounts WHERE name_key=$1", [key])).rows[0];
    let acc = await find(), created = false;
    if (!acc) {
      const ins = await this.pool.query(
        "INSERT INTO accounts(name, name_key, pass_hash) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id", [name, key, hashPass(password)]);
      created = !!ins.rowCount;
      // Hai yêu cầu tạo cùng tên một lúc: yêu cầu thua bị chỉ mục duy nhất chặn, lấy tài khoản vừa tạo và kiểm tra mật khẩu như thường.
      acc = created ? ins.rows[0] : await find();
      // Không tìm thấy dù chèn bị chặn: tên trùng y hệt một tài khoản cũ bị loại khi điền name_key (xem backfillNameKeys).
      if (!acc) return { error: "Tên này đã có người dùng." };
    }
    if (!created && !checkPass(password, acc.pass_hash)) {
      // Tài khoản cũ trùng tên bị loại khi điền name_key (backfillNameKeys) vẫn đăng nhập được bằng mật khẩu của chính nó.
      const legacy = (await this.pool.query("SELECT id, name, pass_hash FROM accounts WHERE name_key IS NULL ORDER BY id")).rows
        .find((r) => nameKey(r.name) === key && checkPass(password, r.pass_hash));
      if (!legacy) return { error: "Sai mật khẩu." };
      acc = legacy;
    }
    const id = Number(acc.id);
    const token = newToken();
    await this.pool.query("INSERT INTO sessions(token, account_id) VALUES ($1,$2)", [token, id]);
    return { token, accountId: id };
  }
  async accountFromToken(token: string) {
    const r = await this.pool.query(
      "SELECT a.id, a.name FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token=$1 AND s.created_at > now() - interval '30 days'", [token]);
    return r.rowCount ? { accountId: Number(r.rows[0].id), name: r.rows[0].name as string } : null;
  }
  row(x: any, accountId: number, name: string): Character {
    return { accountId, name, rowId: Number(x.id), vohon: x.vohon, level: x.level, xp: x.xp, stars: x.stars,
      rings: (x.rings ?? []).map(Number), kills: x.kills };
  }
  async getCharacter(accountId: number) {
    const r = await this.pool.query(
      `SELECT v.*, a.name FROM vohons v JOIN accounts a ON a.id=v.account_id
       WHERE v.account_id=$1 ORDER BY COALESCE(v.id = a.active_vohon, false) DESC, v.id LIMIT 1`, [accountId]);
    return r.rowCount ? this.row(r.rows[0], accountId, r.rows[0].name) : null;
  }
  async listVohons(accountId: number) {
    const r = await this.pool.query(
      "SELECT v.*, a.name FROM vohons v JOIN accounts a ON a.id=v.account_id WHERE v.account_id=$1 ORDER BY v.id", [accountId]);
    return r.rows.map((x) => this.row(x, accountId, x.name));
  }
  async addVohon(accountId: number, name: string, vohon: string, level: number, db: pg.Pool | pg.PoolClient = this.pool) {
    const r = await db.query(
      "INSERT INTO vohons(account_id, vohon, level) VALUES ($1,$2,$3) ON CONFLICT (account_id, vohon) DO NOTHING RETURNING *",
      [accountId, vohon, level]);
    return r.rowCount ? this.row(r.rows[0], accountId, name) : null;
  }
  async setActive(accountId: number, rowId: number) {
    const r = await this.pool.query(
      "UPDATE accounts SET active_vohon=$2 WHERE id=$1 AND EXISTS (SELECT 1 FROM vohons WHERE id=$2 AND account_id=$1)",
      [accountId, rowId]);
    return (r.rowCount ?? 0) > 0;
  }
  async saveCharacter(c: Character) {
    await this.pool.query(
      "UPDATE vohons SET level=$3, xp=$4, stars=$5, rings=$6, kills=$7, updated_at=now() WHERE id=$1 AND account_id=$2",
      [c.rowId, c.accountId, c.level, c.xp, c.stars, c.rings, c.kills]);
  }
  async awaken(accountId: number, name: string, starters: string[], active: string, level: number) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      // Khóa dòng tài khoản: hai yêu cầu thức tỉnh cùng lúc không thể cùng tạo võ hồn.
      await db.query("SELECT id FROM accounts WHERE id=$1 FOR UPDATE", [accountId]);
      const has = await db.query("SELECT 1 FROM vohons WHERE account_id=$1 LIMIT 1", [accountId]);
      if (has.rowCount) { await db.query("ROLLBACK"); return null; }
      let a: Character | null = null;
      for (const v of starters) {
        const c = await this.addVohon(accountId, name, v, level, db);
        if (c && v === active) a = c;
      }
      if (!a) throw new Error(`Võ hồn ra trận ${active} không nằm trong danh sách khởi đầu.`);
      await db.query("UPDATE accounts SET active_vohon=$2 WHERE id=$1", [accountId, a.rowId]);
      await db.query("COMMIT");
      return a;
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
}

export const store: Store = process.env.DATABASE_URL ? new PgStore(process.env.DATABASE_URL) : new MemoryStore();
