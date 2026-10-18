// Lưu trữ tài khoản và võ hồn sở hữu.
// Có DATABASE_URL -> dùng PostgreSQL/Supabase. Không có -> lưu trong RAM (mất khi tắt server, chỉ để thử nhanh).
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { nameKey } from "./names.ts";
import { DEFAULT_LOOKS, parseLooks, parseTeam, TEAM_SIZE, MAPS, DEFAULT_MAP, type Looks } from "../../shared/data.ts";

/** Một võ hồn tài khoản sở hữu (một dòng bảng `vohons`). Mỗi võ hồn có cấp, kinh nghiệm, hồn hoàn riêng. */
export interface Character {
  accountId: number; name: string;
  rowId: number;     // vohons.id
  vohon: string;     // mã võ hồn trong VOHON
  level: number; xp: number; stars: number;
  rings: number[];   // niên hạn (số năm) từng hồn hoàn
  kills: number;
}

/** Ngoại hình hồn sư của tài khoản. `chosen` = đã tự chọn (chỉ chọn được một lần). */
export interface AccountLooks extends Looks { chosen: boolean; }

/** Bản đồ đang đứng (mã trong MAPS) và vị trí của hồn sư; x, y = null khi chưa lưu vị trí (vào ở `spawn`). */
export interface Location { mapId: string; x: number | null; y: number | null; }
/**
 * Ánh xạ `accounts.map_id` sang bản đồ đang có: chưa lưu (null) hoặc mã không còn trong MAPS thì về DEFAULT_MAP (mục 5.3, 6).
 * PgStore dùng cùng luật này trong SQL (`mapExpr`) cho lớp chặn `WHERE map_id`.
 */
export const resolveMap = (raw: string | null | undefined) => (raw && Object.hasOwn(MAPS, raw) ? raw : DEFAULT_MAP);
const toLocation = (raw: string | null | undefined, x: unknown, y: unknown): Location => {
  const mapId = resolveMap(raw);
  // Bản đồ bị ánh xạ thì vị trí cũ vô nghĩa: vào ở `spawn` của bản đồ mới.
  return mapId === raw && x !== null && y !== null && x !== undefined && y !== undefined ? { mapId, x: Number(x), y: Number(y) } : { mapId, x: null, y: null };
};

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
  /**
   * Đội hình: mã dòng võ hồn (vohons.id) theo ô, dài TEAM_SIZE, 0 = ô trống. Tài khoản chưa có đội (tài khoản có từ trước
   * bước 2.3a, hoặc vừa thức tỉnh) được tự xếp từ các võ hồn đang có: võ hồn ra trận ở ô 1, còn lại theo thứ tự nhận được.
   * Chưa thức tỉnh thì toàn 0.
   */
  getTeam(accountId: number): Promise<number[]>;
  /** Lưu đội hình cùng võ hồn ra trận (một lần ghi). false nếu đội sai (parseTeam), có võ hồn không thuộc tài khoản
   *  hoặc `active` không nằm trong đội. */
  saveTeam(accountId: number, team: number[], active: number): Promise<boolean>;
  saveCharacter(c: Character): Promise<void>;
  /** Thức tỉnh lần đầu: tạo các võ hồn khởi đầu và cho `active` ra trận.
   *  null nếu tài khoản đã có võ hồn (thức tỉnh chỉ diễn ra một lần). */
  awaken(accountId: number, name: string, starters: string[], active: string, level: number): Promise<Character | null>;
  /** Ngoại hình hiện tại; tài khoản chưa chọn nhận DEFAULT_LOOKS với chosen = false. */
  getLooks(accountId: number): Promise<AccountLooks>;
  /** Lưu ngoại hình lần đầu (đã kiểm tra bằng parseLooks). false nếu tài khoản đã chọn rồi. */
  chooseLooks(accountId: number, looks: Looks): Promise<boolean>;
  /** Bản đồ đang đứng và vị trí (đã ánh xạ bằng resolveMap). */
  getLocation(accountId: number): Promise<Location>;
  /**
   * Lưu vị trí theo chu kỳ hoặc khi rời phòng (không phải lúc đi cổng). Chỉ ghi khi bản đồ đang lưu (đã ánh xạ) vẫn là
   * `mapId` của phòng gọi (lớp chặn `WHERE map_id`, mục 6). false nếu không ghi.
   */
  saveLocation(accountId: number, mapId: string, x: number, y: number): Promise<boolean>;
  /**
   * Đi qua cổng (mục 6, bước 3): trong MỘT transaction lưu các võ hồn có tiến độ chưa lưu (võ hồn ra trận và võ hồn vừa
   * nhận kinh nghiệm chia cho đội) và đổi bản đồ sang `to` tại (x, y). Hoặc ghi hết, hoặc không ghi gì: lỗi (kể cả khi
   * tài khoản không còn ở bản đồ `from` hoặc có võ hồn không thuộc tài khoản) thì rollback rồi ném lỗi.
   */
  saveTravel(accountId: number, chars: Character[], from: string, to: string, x: number, y: number): Promise<void>;
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
/** Đội tự xếp từ danh sách mã dòng võ hồn (đã theo thứ tự ưu tiên): lấy tối đa TEAM_SIZE, ô thừa để trống. */
const autoTeam = (ids: number[]) => Array.from({ length: TEAM_SIZE }, (_, i) => ids[i] ?? 0);
/** Đội hợp lệ và có võ hồn ra trận trong đó (kiểm tra chung cho cả hai store). */
const teamOk = (team: number[], active: number) => !!parseTeam(team) && active > 0 && team.includes(active);

export class MemoryStore implements Store {
  accounts = new Map<string, { id: number; pass: string }>();  // nameKey(tên) -> tài khoản
  names = new Map<number, string>();
  sessions = new Map<string, number>();
  rows = new Map<number, Character>();  // vohons.id -> võ hồn
  active = new Map<number, number>();   // accountId -> vohons.id đang ra trận
  looks = new Map<number, Looks>();     // accountId -> ngoại hình đã chọn (chưa có = chưa chọn)
  teams = new Map<number, number[]>();  // accountId -> đội hình (vohons.id theo ô, 0 = trống)
  locs = new Map<number, { mapId: string | null; x: number | null; y: number | null }>(); // accountId -> accounts.map_id, pos_x, pos_y
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
  async getTeam(accountId: number) {
    let t = this.teams.get(accountId);
    if (!t) {
      const list = this.owned(accountId), act = this.active.get(accountId);
      if (!list.length) return autoTeam([]);
      t = autoTeam([...list.filter((c) => c.rowId === act), ...list.filter((c) => c.rowId !== act)].map((c) => c.rowId));
      this.teams.set(accountId, t);
    }
    return [...t];
  }
  async saveTeam(accountId: number, team: number[], active: number) {
    if (!teamOk(team, active) || team.some((r) => r && this.rows.get(r)?.accountId !== accountId)) return false;
    this.teams.set(accountId, [...team]); this.active.set(accountId, active); return true;
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
  async getLooks(accountId: number) {
    const l = this.looks.get(accountId);
    return { ...(l ?? DEFAULT_LOOKS), chosen: !!l };
  }
  async chooseLooks(accountId: number, looks: Looks) {
    if (this.looks.has(accountId)) return false;
    this.looks.set(accountId, { ...looks }); return true;
  }
  async getLocation(accountId: number) {
    const l = this.locs.get(accountId);
    return toLocation(l?.mapId, l?.x, l?.y);
  }
  async saveLocation(accountId: number, mapId: string, x: number, y: number) {
    if (resolveMap(this.locs.get(accountId)?.mapId) !== mapId) return false;
    this.locs.set(accountId, { mapId, x, y }); return true;
  }
  async saveTravel(accountId: number, chars: Character[], from: string, to: string, x: number, y: number) {
    // Kiểm tra xong mới gán mọi trường trong cùng một đoạn đồng bộ (không có await xen giữa): ghi hết hoặc không ghi gì.
    for (const c of chars)
      if (c.accountId !== accountId || this.rows.get(c.rowId)?.accountId !== accountId) throw new Error(`Võ hồn #${c.rowId} không thuộc tài khoản #${accountId}.`);
    if (resolveMap(this.locs.get(accountId)?.mapId) !== from) throw new Error(`Tài khoản #${accountId} không còn ở bản đồ ${from}.`);
    for (const c of chars) this.rows.set(c.rowId, { ...copy(c), vohon: this.rows.get(c.rowId)!.vohon });
    this.locs.set(accountId, { mapId: to, x, y });
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
  async getTeam(accountId: number) {
    const read = async () =>
      (await this.pool.query("SELECT slot, vohon_id FROM teams WHERE account_id=$1 AND slot < $2", [accountId, TEAM_SIZE])).rows;
    let rows = await read();
    if (!rows.length) {
      // Chưa có đội: xếp từ võ hồn đang có, cùng thứ tự với getCharacter (võ hồn ra trận trước, rồi theo thứ tự nhận).
      const v = await this.pool.query(
        `SELECT v.id FROM vohons v JOIN accounts a ON a.id=v.account_id
         WHERE v.account_id=$1 ORDER BY COALESCE(v.id = a.active_vohon, false) DESC, v.id LIMIT $2`, [accountId, TEAM_SIZE]);
      if (!v.rowCount) return autoTeam([]);
      // Hai phiên cùng xếp một lúc thì cùng ra một đội; dòng trùng bị bỏ qua.
      await this.pool.query(
        `INSERT INTO teams(account_id, slot, vohon_id)
         SELECT $1, s - 1, id FROM unnest($2::bigint[]) WITH ORDINALITY AS u(id, s) ON CONFLICT DO NOTHING`,
        [accountId, v.rows.map((x) => Number(x.id))]);
      rows = await read();
    }
    const team = autoTeam([]);
    for (const x of rows) team[x.slot] = Number(x.vohon_id);
    return team;
  }
  async saveTeam(accountId: number, team: number[], active: number) {
    if (!teamOk(team, active)) return false;
    const ids = team.filter((r) => r > 0);
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      const own = await db.query("SELECT count(*)::int AS n FROM vohons WHERE account_id=$1 AND id = ANY($2::bigint[])", [accountId, ids]);
      if (own.rows[0].n !== ids.length) { await db.query("ROLLBACK"); return false; }
      await db.query("DELETE FROM teams WHERE account_id=$1", [accountId]);
      await db.query(
        `INSERT INTO teams(account_id, slot, vohon_id)
         SELECT $1, s - 1, id FROM unnest($2::bigint[]) WITH ORDINALITY AS u(id, s) WHERE id > 0`, [accountId, team]);
      await db.query("UPDATE accounts SET active_vohon=$2 WHERE id=$1", [accountId, active]);
      await db.query("COMMIT");
      return true;
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
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
  async getLooks(accountId: number) {
    const r = await this.pool.query("SELECT sex, hair, hair_col, outfit_col, looks_chosen FROM accounts WHERE id=$1", [accountId]);
    const x = r.rows[0];
    // Giá trị ngoài khoảng (sửa tay trong DB, hoặc bảng màu bị rút bớt) thì về mặc định thay vì gửi chỉ số hỏng cho client.
    const l = x ? parseLooks({ sex: x.sex, hair: x.hair, hairCol: x.hair_col, outfitCol: x.outfit_col }) : null;
    return { ...(l ?? DEFAULT_LOOKS), chosen: !!x?.looks_chosen };
  }
  /** Biểu thức SQL của resolveMap(map_id): $known = mọi mã trong MAPS, $def = DEFAULT_MAP. */
  mapExpr(known: string, def: string) { return `COALESCE(CASE WHEN map_id = ANY(${known}::text[]) THEN map_id END, ${def})`; }
  async getLocation(accountId: number) {
    const x = (await this.pool.query("SELECT map_id, pos_x, pos_y FROM accounts WHERE id=$1", [accountId])).rows[0];
    return toLocation(x?.map_id, x?.pos_x, x?.pos_y);
  }
  async saveLocation(accountId: number, mapId: string, x: number, y: number) {
    const r = await this.pool.query(
      `UPDATE accounts SET map_id=$2, pos_x=$3, pos_y=$4 WHERE id=$1 AND ${this.mapExpr("$5", "$6")} = $2`,
      [accountId, mapId, x, y, Object.keys(MAPS), DEFAULT_MAP]);
    return (r.rowCount ?? 0) > 0;
  }
  async saveTravel(accountId: number, chars: Character[], from: string, to: string, x: number, y: number) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      for (const c of chars) {
        const v = await db.query(
          "UPDATE vohons SET level=$3, xp=$4, stars=$5, rings=$6, kills=$7, updated_at=now() WHERE id=$1 AND account_id=$2",
          [c.rowId, accountId, c.level, c.xp, c.stars, c.rings, c.kills]);
        if (v.rowCount !== 1 || c.accountId !== accountId) throw new Error(`Võ hồn #${c.rowId} không thuộc tài khoản #${accountId}.`);
      }
      const a = await db.query(
        `UPDATE accounts SET map_id=$3, pos_x=$4, pos_y=$5 WHERE id=$1 AND ${this.mapExpr("$6", "$7")} = $2`,
        [accountId, from, to, x, y, Object.keys(MAPS), DEFAULT_MAP]);
      if (a.rowCount !== 1) throw new Error(`Tài khoản #${accountId} không còn ở bản đồ ${from}.`);
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async chooseLooks(accountId: number, looks: Looks) {
    // Một lần duy nhất: điều kiện NOT looks_chosen làm hai yêu cầu cùng lúc chỉ một cái được ghi.
    const r = await this.pool.query(
      "UPDATE accounts SET sex=$2, hair=$3, hair_col=$4, outfit_col=$5, looks_chosen=true WHERE id=$1 AND NOT looks_chosen",
      [accountId, looks.sex, looks.hair, looks.hairCol, looks.outfitCol]);
    return (r.rowCount ?? 0) > 0;
  }
}

export const store: Store = process.env.DATABASE_URL ? new PgStore(process.env.DATABASE_URL) : new MemoryStore();
