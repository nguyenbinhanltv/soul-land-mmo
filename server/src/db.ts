// Lưu trữ tài khoản và võ hồn sở hữu.
// Có DATABASE_URL -> dùng PostgreSQL/Supabase. Không có -> lưu trong RAM (mất khi tắt server, chỉ để thử nhanh).
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { nameKey } from "./names.ts";
import { mapFile } from "./map.ts";
import { DEFAULT_LOOKS, parseLooks, parseTeam, TEAM_SIZE, MAPS, MAP_MOVED, DEFAULT_MAP, parseQuest, isDaily, parseHerbs, bagSlotsOf, BAG_SLOTS, BAG_MAX_SLOTS, type Looks, type QuestProgress, type ArenaRecord } from "../../shared/data.ts";

/** Một võ hồn tài khoản sở hữu (một dòng bảng `vohons`). Mỗi võ hồn có cấp, kinh nghiệm, hồn hoàn riêng. */
export interface Character {
  accountId: number; name: string;
  rowId: number;     // vohons.id
  vohon: string;     // mã võ hồn trong VOHON
  level: number; xp: number; stars: number;
  rings: number[];   // niên hạn (số năm) từng hồn hoàn
  kills: number;
  skills: number[];  // từ 8.1a: 4 ô hồn kỹ mang theo (chỉ số vòng, -1 = trống); rỗng = mặc định vòng 1–4 (loadoutOf)
  herbs: Record<string, number>; // từ BĐ6b: số cây tiên thảo đã dùng theo mã (HERBS), cột `vohons.herbs`; lưu cùng tiến độ như `stars`
}

/** Ngoại hình hồn sư của tài khoản. `chosen` = đã tự chọn (chỉ chọn được một lần). */
export interface AccountLooks extends Looks { chosen: boolean; }

/**
 * Bản đồ đang đứng (mã trong MAPS) và vị trí của hồn sư; x, y = null khi chưa lưu vị trí hoặc vị trí ghi trên file Tiled khác file server
 * đang dùng cho bản đồ đó (vào ở `spawn`).
 */
export interface Location { mapId: string; x: number | null; y: number | null; }
/**
 * Ánh xạ `accounts.map_id` sang bản đồ đang có: mã cũ đã bỏ (MAP_MOVED, ví dụ `tinh_dau` từ BĐ3) thì sang bản đồ thay thế;
 * chưa lưu (null) hoặc mã lạ thì về DEFAULT_MAP (mục 5.3, 6). PgStore dùng cùng luật này trong SQL (`mapExpr`) cho lớp chặn `WHERE map_id`.
 */
export const resolveMap = (raw: string | null | undefined) =>
  (raw && Object.hasOwn(MAPS, raw) ? raw : raw && Object.hasOwn(MAP_MOVED, raw) ? MAP_MOVED[raw] : DEFAULT_MAP);
const toLocation = (raw: string | null | undefined, x: unknown, y: unknown, file: string | null | undefined): Location => {
  const mapId = resolveMap(raw);
  // Bản đồ bị ánh xạ thì vị trí cũ vô nghĩa: vào ở `spawn` của bản đồ mới. Tọa độ chỉ có nghĩa trên đúng file Tiled lúc ghi
  // (`accounts.map_file`, 11.5; NULL = ghi trước 11.5, bản cũ `<mapId>`): bản ×8 thành mặc định hoặc đổi qua lại bằng MAP_V1 thì về `spawn`.
  const same = mapId === raw && (file ?? raw) === mapFile(mapId);
  return same && x !== null && y !== null && x !== undefined && y !== undefined ? { mapId, x: Number(x), y: Number(y) } : { mapId, x: null, y: null };
};

/** Một ô trong túi đồ (một dòng bảng `items`, mục 5.7). `id` do server sinh (UUID) ngay khi món đồ xuất hiện. */
export interface Item {
  id: string;
  kind: string; code: string;  // nhóm (ITEM_KINDS) và mã vật phẩm (ITEMS)
  qty: number;                 // số món trong ô (đồ gộp được), ≥ 1
  years: number | null; stars: number | null; enhance: number;
  stats: unknown;              // dòng chỉ số (JSON) hoặc null
  vohonId: number | null;      // đang gắn vào võ hồn nào (vohons.id), null = nằm trong túi
  created: number;             // thời điểm tạo (ms, items.created_at): thứ tự ô trong túi khi nạp lại
  locked?: boolean;            // người chơi khoá (#216, items.locked): không bán / bỏ / làm nguyên liệu
}
/**
 * Túi đồ và Hồn Tệ (đồng) của một tài khoản: chỉ server và chính chủ thấy. Từ 6.2 kèm tiến độ nhiệm vụ `quests` (bảng `quests`,
 * mỗi chuỗi một dòng): ghi trong cùng transaction với túi để phần thưởng và bước mới không bao giờ lệch nhau. Thiếu `quests` khi
 * ghi thì giữ nguyên tiến độ đang lưu. Từ 9.8 `slots`: số ô túi (cột `accounts.bag_slots`, mở rộng ở thương nhân); thiếu khi ghi thì
 * giữ nguyên, ghi thì chỉ tăng (không bao giờ giảm số ô đã mua). Từ #216 `sell`: bộ lọc tự bán (JSON thô, room kiểm lại bằng
 * parseSell; `accounts.auto_sell`), `sold`: các món tự bán gần nhất để mua lại (`accounts.auto_sold`); thiếu khi ghi thì giữ nguyên.
 */
export interface Bag { items: Item[]; honTe: number; quests?: QuestProgress[]; slots?: number; sell?: unknown; sold?: SoldRow[]; }
/** Một món đã tự bán (#216): bản sao món (số lượng đã bán), giá mỗi món đã nhận, lúc bán (ms); `key` gửi lại trong `buyback {key}`. */
export interface SoldRow { key: string; item: Item; price: number; at: number; }
/**
 * Tự săn (Auto 1, bảng `auto_hunt`, mục 5.13): cài đặt (JSON thô, room kiểm lại bằng parseAuto) và số giây đã treo trong ngày `day`
 * (giờ Việt Nam), `bonus`: giây treo cộng thêm còn lại từ Ủy Thác Lệnh (Auto 2, 021_auto_bonus.sql; không đặt lại theo ngày).
 * Tài khoản chưa có dòng: cài đặt null, `day` rỗng, 0 giây.
 */
export interface AutoRow { settings: unknown; day: string; used: number; bonus: number; }
/** Giờ treo đã dùng / cộng thêm phải là số hữu hạn không âm (lưu của cả hai store kiểm trước khi ghi). */
function checkAutoRow(row: AutoRow) {
  if (!Number.isFinite(row.used) || row.used < 0 || !Number.isFinite(row.bonus) || row.bonus < 0) throw new Error("Giờ treo tự săn không hợp lệ.");
}
/**
 * Ủy thác offline (Auto 3, bảng `auto_offline`, mục 5.13): thoát ở vùng săn `zone` của bản đồ `mapId` lúc `at` (ms, đồng hồ server);
 * `day` / `used`: ngày giờ Việt Nam và giây tự săn đã treo trong ngày đó lúc thoát.
 */
export interface OfflineRow { mapId: string; zone: string; at: number; day: string; used: number; }
const copyItem = (i: Item): Item => ({ ...i, stats: i.stats == null ? null : structuredClone(i.stats) });
const copyQuest = (q: QuestProgress): QuestProgress => ({ ...q, prog: [...q.prog] });
const copySold = (r: SoldRow): SoldRow => ({ ...r, item: copyItem(r.item) });
const copyBag = (b: Bag): Bag => ({ honTe: b.honTe, items: b.items.map(copyItem), ...(b.quests ? { quests: b.quests.map(copyQuest) } : {}),
  ...(b.slots !== undefined ? { slots: b.slots } : {}), ...(b.sell !== undefined ? { sell: structuredClone(b.sell) } : {}),
  ...(b.sold ? { sold: b.sold.map(copySold) } : {}) });
/** Danh sách tự bán đọc từ DB (#216): bỏ dòng hỏng (thiếu khóa, món, giá). */
const parseSold = (raw: unknown): SoldRow[] => (Array.isArray(raw) ? raw : []).filter((r): r is SoldRow =>
  !!r && typeof r.key === "string" && !!r.item && typeof r.item.code === "string" && Number.isInteger(r.item.qty) && r.item.qty >= 1
  && Number.isSafeInteger(r.price) && r.price >= 0).map((r) => ({ key: r.key, item: { ...r.item, stats: r.item.stats ?? null, vohonId: null, locked: false },
  price: r.price, at: Number(r.at) || 0 }));
/** Kiểm tra chung cho cả hai store trước khi ghi túi: id không trùng, số lượng và Hồn Tệ là số nguyên hợp lệ. */
function bagOk(b: Bag) {
  const ids = new Set(b.items.map((i) => i.id));
  if (ids.size !== b.items.length) throw new Error("Túi đồ có hai ô trùng id.");
  if (!Number.isSafeInteger(b.honTe) || b.honTe < 0) throw new Error(`Hồn Tệ không hợp lệ: ${b.honTe}.`);
  if (b.slots !== undefined && (!Number.isInteger(b.slots) || b.slots < BAG_SLOTS || b.slots > BAG_MAX_SLOTS)) throw new Error(`Số ô túi không hợp lệ: ${b.slots}.`);
  for (const i of b.items) if (!Number.isInteger(i.qty) || i.qty < 1) throw new Error(`Số lượng ô ${i.id} không hợp lệ: ${i.qty}.`);
  for (const r of b.sold ?? []) if (!Number.isInteger(r.item.qty) || r.item.qty < 1 || !Number.isSafeInteger(r.price) || r.price < 0) throw new Error(`Món tự bán ${r.key} không hợp lệ.`);
  const chains = new Set((b.quests ?? []).map((q) => q.chain));
  if (chains.size !== (b.quests ?? []).length) throw new Error("Tiến độ nhiệm vụ có hai dòng cùng chuỗi.");
}

// Nguyên tắc: không bao giờ mất võ hồn. Store không có hàm xóa võ hồn.
export interface Store {
  init(): Promise<void>;
  /** Tìm tài khoản theo nameKey(name) (names.ts), chưa có thì tạo với tên hiển thị `name`. */
  login(name: string, password: string): Promise<{ token: string; accountId: number } | { error: string }>;
  /** Tài khoản của phiên `token`; `token` sai định dạng (không phải chuỗi newToken) thì null, không hỏi DB. */
  accountFromToken(token: unknown): Promise<{ accountId: number; name: string } | null>;
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
  /** Lưu tiến độ võ hồn (cấp, kinh nghiệm, sao, hồn hoàn, số hồn thú đã hạ, tiên thảo từ BĐ6b); không đổi `skills` (chỉ saveSkills ghi). */
  saveCharacter(c: Character): Promise<void>;
  /** Từ 8.1a: lưu 4 ô hồn kỹ mang theo của võ hồn `rowId` (đã kiểm tra bằng parseLoadout ở room). false nếu võ hồn không thuộc tài khoản. */
  saveSkills(accountId: number, rowId: number, skills: number[]): Promise<boolean>;
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
   * `mapId` của phòng gọi (lớp chặn `WHERE map_id`, mục 6). false nếu không ghi. Ghi kèm `file`: file Tiled của tọa độ, mặc định
   * file server đang dùng (`mapFile`, 11.5); null = như dòng ghi trước 11.5 (chỉ hook test truyền khác mặc định).
   */
  saveLocation(accountId: number, mapId: string, x: number, y: number, file?: string | null): Promise<boolean>;
  /**
   * Lưu định kỳ / khi rời phòng (MapRoom.write, #165): trong MỘT transaction ghi vị trí như saveLocation (cùng lớp chặn `WHERE map_id`),
   * các võ hồn `chars` (như saveTravel) và túi `bag` nếu có (như saveBag). Lớp chặn không khớp (DB đã ở bản đồ khác, vd transaction đi
   * cổng đã commit dù phòng nhận lỗi) thì không ghi gì, kể cả túi, và trả false. Lỗi khác thì rollback rồi ném lỗi.
   */
  saveProgress(accountId: number, chars: Character[], mapId: string, x: number, y: number, file?: string | null, bag?: Bag): Promise<boolean>;
  /**
   * Đi qua cổng (mục 6, bước 3): trong MỘT transaction lưu các võ hồn có tiến độ chưa lưu (võ hồn ra trận và võ hồn vừa
   * nhận kinh nghiệm chia cho đội) và đổi bản đồ sang `to` tại (x, y). Hoặc ghi hết, hoặc không ghi gì: lỗi (kể cả khi
   * tài khoản không còn ở bản đồ `from` hoặc có võ hồn không thuộc tài khoản) thì rollback rồi ném lỗi.
   * Từ bước 3.1 có `bag` (túi đồ và Hồn Tệ chưa lưu) thì ghi luôn trong cùng transaction, như saveBag. (x, y) ghi kèm file Tiled
   * server đang dùng cho `to` (`mapFile`, 11.5) như saveLocation.
   */
  saveTravel(accountId: number, chars: Character[], from: string, to: string, x: number, y: number, bag?: Bag): Promise<void>;
  /**
   * Túi đồ và Hồn Tệ. Tài khoản chưa nhận vật phẩm khởi đầu thì thêm `starter` vào túi (một lần, cùng một lần ghi với cờ
   * `starter_items`) rồi mới trả về; đã nhận thì bỏ qua `starter`. `starter` trong kết quả: lần này vừa nhận. Từ 6.2 `bag.quests`
   * là các dòng `quests` đã lưu (chưa có dòng = chưa bắt đầu chuỗi đó; nơi gọi dùng questStart).
   */
  loadBag(accountId: number, starter: Item[]): Promise<{ bag: Bag; starter: boolean }>;
  /**
   * Ghi cả túi (ảnh chụp lúc lưu): thêm/sửa mọi ô trong `bag`, xóa ô của tài khoản không còn trong `bag`, Hồn Tệ, và (từ 6.2) tiến
   * độ nhiệm vụ `bag.quests` nếu có (thêm / sửa từng chuỗi).
   * Hoặc ghi hết, hoặc không ghi gì; lỗi (id trùng, id thuộc tài khoản khác, đồ gắn vào võ hồn không thuộc tài khoản) thì ném lỗi.
   */
  saveBag(accountId: number, bag: Bag): Promise<void>;
  /**
   * Mở võ hồn bằng mảnh (bước 3.4): trong MỘT transaction thêm võ hồn `vohon` (cấp `level`, 1 sao) và ghi cả túi `bag` (đã trừ
   * mảnh), như saveBag. null (không ghi gì) nếu tài khoản đã có võ hồn này; lỗi khác thì rollback rồi ném lỗi.
   */
  unlockVohon(accountId: number, name: string, vohon: string, level: number, bag: Bag): Promise<Character | null>;
  /**
   * Lên sao bằng mảnh (bước 3.4): trong MỘT transaction lưu các võ hồn `chars` (như saveTravel, kể cả `stars`) và cả túi `bag`.
   * Từ BĐ6b cũng dùng khi dùng tiên thảo (võ hồn có `herbs` mới, túi đã bớt tiên thảo).
   * Hoặc ghi hết, hoặc không ghi gì; võ hồn không thuộc tài khoản thì rollback rồi ném lỗi.
   */
  saveVohonsBag(accountId: number, chars: Character[], bag: Bag): Promise<void>;
  /** Mã các truyền tống trận tài khoản đã mở khóa (bảng `waypoints`, 11.2; mã `<mapId>:<tên trận>`). */
  getWaypoints(accountId: number): Promise<string[]>;
  /** Mở khóa truyền tống trận `wp` (đã có thì thôi, chạy lại an toàn). */
  unlockWaypoint(accountId: number, wp: string): Promise<void>;
  /** Cài đặt và giờ treo tự săn của tài khoản (bảng `auto_hunt`, Auto 1). */
  getAuto(accountId: number): Promise<AutoRow>;
  /** Ghi đè cài đặt và giờ treo tự săn (thêm dòng nếu chưa có); chỉ gọi trong chuỗi lưu của người chơi. */
  saveAuto(accountId: number, row: AutoRow): Promise<void>;
  /**
   * Dùng Ủy Thác Lệnh (Auto 2): trong MỘT transaction ghi dòng tự săn `row` (quỹ giờ đã cộng) và cả túi `bag` (đã bớt lệnh), như
   * saveAuto + saveBag. Hoặc ghi hết, hoặc không ghi gì (không mất lệnh mà không có giờ, không có giờ mà lệnh còn).
   */
  saveAutoBag(accountId: number, row: AutoRow, bag: Bag): Promise<void>;
  /** Ghi (đè) lần ủy thác offline của tài khoản (bảng `auto_offline`, Auto 3); chỉ gọi trong chuỗi lưu của người chơi. */
  startOffline(accountId: number, row: OfflineRow): Promise<void>;
  /** Lấy và xóa lần ủy thác offline (một lệnh, nên không nhận hai lần); không có thì null. */
  takeOffline(accountId: number): Promise<OfflineRow | null>;
  /** Số lần tài khoản đã nhận thưởng boss loại `kind` trong ngày `day` (giờ Việt Nam, "YYYY-MM-DD"; bảng `boss_claims`, BĐ5). */
  bossClaims(accountId: number, day: string, kind: string): Promise<number>;
  /**
   * Nhận thưởng boss (BĐ5): trong MỘT transaction tăng lượt của (`day`, `kind`) nếu còn dưới `limit` và ghi cả túi `bag` (đã có rương),
   * như saveBag. Trả về số lượt sau khi nhận; null (không ghi gì) nếu đã đủ `limit` lượt trong ngày; lỗi khác thì rollback rồi ném lỗi.
   */
  claimBoss(accountId: number, day: string, kind: string, limit: number, bag: Bag): Promise<number | null>;
  /** Elo và thành tích Đại Đấu Hồn Trường (bảng `arena_ratings`, 7.2); chưa đấu trận nào thì Elo `start`, 0 trận. */
  getArena(accountId: number, start: number): Promise<ArenaRecord>;
  /**
   * Ghi kết quả một trận đấu hồn (7.2) trong MỘT transaction: CỘNG `delta` (chênh Elo do phòng tính bằng eloAfter, +1 thắng / thua /
   * hòa) vào dòng đang lưu, chưa có dòng thì tính từ Elo `start`; mọi cột không dưới 0. Cộng (không ghi đè) để một lần ghi đến muộn
   * không xóa kết quả trận khác. Có `reward` thì tăng lượt (`day`, `kind`) nếu còn dưới `limit` (như claimBoss) và ghi cả túi
   * `reward.bag` (túi đã có phần thưởng), như saveBag. Trả về thành tích sau khi ghi và `paid` (đã ghi phần thưởng; false nếu không có
   * hoặc đã đủ lượt trong ngày: vẫn ghi Elo, không ghi túi). Lỗi thì rollback rồi ném lỗi.
   */
  saveArena(accountId: number, start: number, delta: ArenaRecord, reward?: { day: string; kind: string; limit: number; bag: Bag }): Promise<{ rec: ArenaRecord; paid: boolean }>;
  /**
   * Bảng xếp hạng (7.2): `n` tài khoản đứng đầu (đã đấu ít nhất một trận) theo Elo, rồi số trận thắng, rồi ai đạt mức đó trước; kèm
   * hạng và thành tích của `accountId` (null = chưa đấu trận nào).
   */
  arenaTop(n: number, accountId: number): Promise<{ list: (ArenaRecord & { accountId: number; name: string })[]; me: (ArenaRecord & { rank: number }) | null }>;
  /** Số trận có kết quả giữa hai tài khoản `a`, `b` (thứ tự bất kỳ) trong ngày `day` (giờ Việt Nam; bảng `arena_pairs`, 9.7). */
  arenaPairCount(day: string, a: number, b: number): Promise<number>;
  /**
   * Đếm thêm một trận có kết quả của cặp (`a`, `b`) trong ngày `day` (9.7), một câu lệnh nên hai lần ghi cùng lúc không đếm trùng.
   * Trả về số trận sau khi đếm (trận này là trận thứ mấy; arenaRanked quyết định có tính Elo không).
   */
  arenaPairAdd(day: string, a: number, b: number): Promise<number>;
}

// scrypt bất đồng bộ (threadpool của libuv): bản Sync mất vài chục ms mỗi lần trên luồng chính, đăng nhập dồn dập làm đứng tick mọi phòng.
const scryptAsync = promisify(scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>;
async function hashPass(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await scryptAsync(pw, salt, 32)).toString("hex")}`;
}
async function checkPass(pw: string, stored: string) {
  const [salt, hex] = stored.split(":");
  const a = Buffer.from(hex, "hex"), b = await scryptAsync(pw, salt, 32);
  return a.length === b.length && timingSafeEqual(a, b);
}
const newToken = () => randomBytes(24).toString("base64url");
/** Token đúng dạng newToken (base64url). Chặn trước khi hỏi DB: chuỗi lạ (ký tự NUL…) làm PostgreSQL báo lỗi mã hóa. */
const tokenOk = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9_-]{32}$/.test(t);
const copy = (c: Character): Character => ({ ...c, rings: [...c.rings], skills: [...c.skills], herbs: { ...c.herbs } });
/** Đội tự xếp từ danh sách mã dòng võ hồn (đã theo thứ tự ưu tiên): lấy tối đa TEAM_SIZE, ô thừa để trống. */
const autoTeam = (ids: number[]) => Array.from({ length: TEAM_SIZE }, (_, i) => ids[i] ?? 0);
/** Đội hợp lệ và có võ hồn ra trận trong đó (kiểm tra chung cho cả hai store). */
const teamOk = (team: number[], active: number) => !!parseTeam(team) && active > 0 && team.includes(active);
/** Chênh Elo / số trận của một lần ghi kết quả là số nguyên (bảng arena_ratings, 7.2; kết quả cộng vào được kẹp không dưới 0). */
function arenaOk(r: ArenaRecord) {
  if (![r.elo, r.wins, r.losses, r.draws].every((x) => Number.isSafeInteger(x))) throw new Error(`Kết quả đấu hồn không hợp lệ: ${JSON.stringify(r)}.`);
}
/** Khóa cặp của bảng arena_pairs (9.7): mã nhỏ trước. */
const pairKey = (day: string, a: number, b: number) => `${day}|${Math.min(a, b)}|${Math.max(a, b)}`;
const arenaRow = (x: any): ArenaRecord => ({ elo: Number(x.elo), wins: Number(x.wins), losses: Number(x.losses), draws: Number(x.draws) });

export class MemoryStore implements Store {
  accounts = new Map<string, { id: number; pass: string }>();  // nameKey(tên) -> tài khoản
  names = new Map<number, string>();
  sessions = new Map<string, number>();
  rows = new Map<number, Character>();  // vohons.id -> võ hồn
  active = new Map<number, number>();   // accountId -> vohons.id đang ra trận
  looks = new Map<number, Looks>();     // accountId -> ngoại hình đã chọn (chưa có = chưa chọn)
  teams = new Map<number, number[]>();  // accountId -> đội hình (vohons.id theo ô, 0 = trống)
  locs = new Map<number, { mapId: string | null; x: number | null; y: number | null; file: string | null }>(); // accountId -> accounts.map_id, pos_x, pos_y, map_file
  bags = new Map<number, Bag>();        // accountId -> túi đồ (bảng items) và Hồn Tệ (accounts.hon_te)
  starter = new Set<number>();          // accountId đã nhận vật phẩm khởi đầu (accounts.starter_items)
  claims = new Map<string, number>();   // "accountId|day|kind" -> số lần nhận thưởng boss (bảng boss_claims, BĐ5)
  quests = new Map<number, QuestProgress[]>(); // accountId -> tiến độ nhiệm vụ từng chuỗi (bảng quests, 6.2)
  arena = new Map<number, ArenaRecord & { t: number }>(); // accountId -> Elo, thành tích, lần ghi (bảng arena_ratings, 7.2)
  pairs = new Map<string, number>(); // "day|a|b" (a < b) -> số trận của cặp trong ngày (bảng arena_pairs, 9.7)
  wps = new Map<number, Set<string>>(); // accountId -> mã truyền tống trận đã mở khóa (bảng waypoints, 11.2)
  autos = new Map<number, AutoRow>(); // accountId -> cài đặt và giờ treo tự săn (bảng auto_hunt, Auto 1)
  offline = new Map<number, OfflineRow>(); // accountId -> lần ủy thác offline chưa nhận (bảng auto_offline, Auto 3)
  arenaT = 0;
  seq = 1; rowSeq = 1;
  async init() { console.warn("⚠  Chưa có DATABASE_URL: dữ liệu chỉ lưu trong RAM."); }
  async login(name: string, password: string) {
    const key = nameKey(name);
    let acc = this.accounts.get(key), created = false;
    if (!acc) {
      const pass = await hashPass(password);
      // Trong lúc băm có yêu cầu khác cùng tên vừa tạo tài khoản: kiểm mật khẩu như tài khoản có sẵn.
      acc = this.accounts.get(key);
      if (!acc) { acc = { id: this.seq++, pass }; this.accounts.set(key, acc); this.names.set(acc.id, name); created = true; }
    }
    if (!created && !(await checkPass(password, acc.pass))) return { error: "Sai mật khẩu." };
    const token = newToken(); this.sessions.set(token, acc.id);
    return { token, accountId: acc.id };
  }
  async accountFromToken(token: unknown) {
    const id = tokenOk(token) ? this.sessions.get(token) : undefined; return id ? { accountId: id, name: this.names.get(id)! } : null;
  }
  owned(accountId: number) { return [...this.rows.values()].filter((c) => c.accountId === accountId).sort((a, b) => a.rowId - b.rowId); }
  async getCharacter(accountId: number) {
    const list = this.owned(accountId), c = list.find((x) => x.rowId === this.active.get(accountId)) ?? list[0];
    return c ? copy(c) : null;
  }
  async listVohons(accountId: number) { return this.owned(accountId).map(copy); }
  async addVohon(accountId: number, name: string, vohon: string, level: number) {
    if (this.owned(accountId).some((c) => c.vohon === vohon)) return null;
    const c: Character = { accountId, name, rowId: this.rowSeq++, vohon, level, xp: 0, stars: 1, rings: [], kills: 0, skills: [], herbs: {} };
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
    if (cur?.accountId === c.accountId) this.rows.set(c.rowId, { ...copy(c), vohon: cur.vohon, skills: [...cur.skills] });
  }
  async saveSkills(accountId: number, rowId: number, skills: number[]) {
    const cur = this.rows.get(rowId);
    if (cur?.accountId !== accountId) return false;
    cur.skills = [...skills]; return true;
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
    return toLocation(l?.mapId, l?.x, l?.y, l?.file);
  }
  async saveLocation(accountId: number, mapId: string, x: number, y: number, file: string | null = mapFile(mapId)) {
    if (resolveMap(this.locs.get(accountId)?.mapId) !== mapId) return false;
    this.locs.set(accountId, { mapId, x, y, file }); return true;
  }
  async saveProgress(accountId: number, chars: Character[], mapId: string, x: number, y: number, file: string | null = mapFile(mapId), bag?: Bag) {
    // Như saveTravel: kiểm tra xong mới gán mọi trường trong cùng một đoạn đồng bộ.
    if (resolveMap(this.locs.get(accountId)?.mapId) !== mapId) return false;
    for (const c of chars)
      if (c.accountId !== accountId || this.rows.get(c.rowId)?.accountId !== accountId) throw new Error(`Võ hồn #${c.rowId} không thuộc tài khoản #${accountId}.`);
    if (bag) this.checkBag(accountId, bag);
    for (const c of chars) { const cur = this.rows.get(c.rowId)!; this.rows.set(c.rowId, { ...copy(c), vohon: cur.vohon, skills: [...cur.skills] }); }
    this.locs.set(accountId, { mapId, x, y, file });
    if (bag) this.putBag(accountId, bag);
    return true;
  }
  async saveTravel(accountId: number, chars: Character[], from: string, to: string, x: number, y: number, bag?: Bag) {
    // Kiểm tra xong mới gán mọi trường trong cùng một đoạn đồng bộ (không có await xen giữa): ghi hết hoặc không ghi gì.
    for (const c of chars)
      if (c.accountId !== accountId || this.rows.get(c.rowId)?.accountId !== accountId) throw new Error(`Võ hồn #${c.rowId} không thuộc tài khoản #${accountId}.`);
    if (resolveMap(this.locs.get(accountId)?.mapId) !== from) throw new Error(`Tài khoản #${accountId} không còn ở bản đồ ${from}.`);
    if (bag) this.checkBag(accountId, bag);
    for (const c of chars) { const cur = this.rows.get(c.rowId)!; this.rows.set(c.rowId, { ...copy(c), vohon: cur.vohon, skills: [...cur.skills] }); }
    this.locs.set(accountId, { mapId: to, x, y, file: mapFile(to) });
    if (bag) this.putBag(accountId, bag);
  }
  /**
   * Ghi túi (đã kiểm tra) cùng tiến độ nhiệm vụ: như writeBag của PgStore, chuỗi có trong `bag.quests` thì thay, chuỗi khác giữ nguyên;
   * có bài khảo hạch hằng ngày thì bỏ bài của các ngày khác.
   */
  putBag(accountId: number, bag: Bag) {
    const { quests, slots, sell, sold, ...rest } = copyBag(bag), prev = this.bags.get(accountId), old = prev?.slots;
    // Bộ lọc / danh sách tự bán (#216): thiếu khi ghi thì giữ bản đang lưu, như writeBag.
    const keepSell = sell !== undefined ? sell : prev?.sell, keepSold = sold ?? prev?.sold;
    this.bags.set(accountId, { ...rest, ...(slots !== undefined || old !== undefined ? { slots: Math.max(slots ?? 0, old ?? 0) } : {}),
      ...(keepSell !== undefined ? { sell: keepSell } : {}), ...(keepSold ? { sold: keepSold } : {}) });
    if (quests) {
      const daily = quests.some((x) => isDaily(x.chain));
      const keep = (this.quests.get(accountId) ?? []).filter((q) => !quests.some((x) => x.chain === q.chain) && !(daily && isDaily(q.chain)));
      this.quests.set(accountId, [...keep, ...quests]);
    }
  }
  /** Như các ràng buộc của bảng `items`: id không thuộc tài khoản khác, đồ chỉ gắn vào võ hồn của chính tài khoản. */
  checkBag(accountId: number, bag: Bag) {
    bagOk(bag);
    for (const [acc, b] of this.bags)
      if (acc !== accountId && b.items.some((i) => bag.items.some((j) => j.id === i.id))) throw new Error("Id món đồ thuộc tài khoản khác.");
    for (const i of bag.items)
      if (i.vohonId !== null && this.rows.get(i.vohonId)?.accountId !== accountId) throw new Error(`Võ hồn #${i.vohonId} không thuộc tài khoản #${accountId}.`);
  }
  async loadBag(accountId: number, starter: Item[]) {
    let b = this.bags.get(accountId) ?? { items: [], honTe: 0 };
    const fresh = !this.starter.has(accountId);
    if (fresh) {
      const next = { ...b, items: [...b.items, ...starter] };
      this.checkBag(accountId, next);
      b = copyBag(next); this.bags.set(accountId, b); this.starter.add(accountId);
    }
    return { bag: { ...copyBag(b), slots: bagSlotsOf(b.slots), quests: (this.quests.get(accountId) ?? []).map(copyQuest) }, starter: fresh };
  }
  async saveBag(accountId: number, bag: Bag) {
    this.checkBag(accountId, bag);
    this.putBag(accountId, bag);
  }
  async unlockVohon(accountId: number, name: string, vohon: string, level: number, bag: Bag) {
    if (this.owned(accountId).some((c) => c.vohon === vohon)) return null;
    this.checkBag(accountId, bag);
    const c = await this.addVohon(accountId, name, vohon, level);
    this.putBag(accountId, bag);
    return c;
  }
  async saveVohonsBag(accountId: number, chars: Character[], bag: Bag) {
    for (const c of chars)
      if (c.accountId !== accountId || this.rows.get(c.rowId)?.accountId !== accountId) throw new Error(`Võ hồn #${c.rowId} không thuộc tài khoản #${accountId}.`);
    this.checkBag(accountId, bag);
    for (const c of chars) { const cur = this.rows.get(c.rowId)!; this.rows.set(c.rowId, { ...copy(c), vohon: cur.vohon, skills: [...cur.skills] }); }
    this.putBag(accountId, bag);
  }
  async getWaypoints(accountId: number) { return [...(this.wps.get(accountId) ?? [])]; }
  async unlockWaypoint(accountId: number, wp: string) {
    let set = this.wps.get(accountId);
    if (!set) this.wps.set(accountId, (set = new Set()));
    set.add(wp);
  }
  async getAuto(accountId: number): Promise<AutoRow> {
    const r = this.autos.get(accountId);
    return r ? { settings: structuredClone(r.settings), day: r.day, used: r.used, bonus: r.bonus } : { settings: null, day: "", used: 0, bonus: 0 };
  }
  async saveAuto(accountId: number, row: AutoRow) {
    checkAutoRow(row);
    this.autos.set(accountId, { settings: structuredClone(row.settings), day: row.day, used: row.used, bonus: row.bonus });
  }
  async saveAutoBag(accountId: number, row: AutoRow, bag: Bag) {
    checkAutoRow(row); this.checkBag(accountId, bag);
    await this.saveAuto(accountId, row);
    this.putBag(accountId, bag);
  }
  async startOffline(accountId: number, row: OfflineRow) { this.offline.set(accountId, { ...row }); }
  async takeOffline(accountId: number) {
    const r = this.offline.get(accountId); this.offline.delete(accountId);
    return r ? { ...r } : null;
  }
  async bossClaims(accountId: number, day: string, kind: string) { return this.claims.get(`${accountId}|${day}|${kind}`) ?? 0; }
  async claimBoss(accountId: number, day: string, kind: string, limit: number, bag: Bag) {
    const key = `${accountId}|${day}|${kind}`, n = this.claims.get(key) ?? 0;
    if (n >= limit) return null;
    this.checkBag(accountId, bag);
    this.claims.set(key, n + 1); this.putBag(accountId, bag);
    return n + 1;
  }
  async getArena(accountId: number, start: number) {
    const r = this.arena.get(accountId);
    return r ? { elo: r.elo, wins: r.wins, losses: r.losses, draws: r.draws } : { elo: start, wins: 0, losses: 0, draws: 0 };
  }
  async saveArena(accountId: number, start: number, delta: ArenaRecord, reward?: { day: string; kind: string; limit: number; bag: Bag }) {
    arenaOk(delta);
    if (!this.names.has(accountId)) throw new Error(`Không có tài khoản #${accountId}.`);
    let paid = false;
    if (reward) {
      const key = `${accountId}|${reward.day}|${reward.kind}`, n = this.claims.get(key) ?? 0;
      if (n < reward.limit) { this.checkBag(accountId, reward.bag); this.claims.set(key, n + 1); this.putBag(accountId, reward.bag); paid = true; }
    }
    const cur = this.arena.get(accountId) ?? { elo: start, wins: 0, losses: 0, draws: 0 }, add = (a: number, b: number) => Math.max(0, a + b);
    const rec = { elo: add(cur.elo, delta.elo), wins: add(cur.wins, delta.wins), losses: add(cur.losses, delta.losses), draws: add(cur.draws, delta.draws) };
    this.arena.set(accountId, { ...rec, t: ++this.arenaT });
    return { rec, paid };
  }
  async arenaTop(n: number, accountId: number) {
    // Cùng thứ tự với chỉ mục arena_ratings_rank: Elo, số trận thắng, ai ghi trước, mã tài khoản.
    const all = [...this.arena].sort(([ia, a], [ib, b]) => b.elo - a.elo || b.wins - a.wins || a.t - b.t || ia - ib);
    const rec = ([id, r]: [number, ArenaRecord & { t: number }]) => ({ accountId: id, name: this.names.get(id) ?? "?", elo: r.elo, wins: r.wins, losses: r.losses, draws: r.draws });
    const at = all.findIndex(([id]) => id === accountId), mine = at >= 0 ? all[at][1] : null;
    return { list: all.slice(0, n).map(rec), me: mine ? { elo: mine.elo, wins: mine.wins, losses: mine.losses, draws: mine.draws, rank: at + 1 } : null };
  }
  async arenaPairCount(day: string, a: number, b: number) { return this.pairs.get(pairKey(day, a, b)) ?? 0; }
  async arenaPairAdd(day: string, a: number, b: number) {
    if (a === b || !this.names.has(a) || !this.names.has(b)) throw new Error(`Cặp tài khoản #${a}, #${b} không hợp lệ.`);
    const k = pairKey(day, a, b), n = (this.pairs.get(k) ?? 0) + 1;
    this.pairs.set(k, n);
    return n;
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
        "INSERT INTO accounts(name, name_key, pass_hash) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id", [name, key, await hashPass(password)]);
      created = !!ins.rowCount;
      // Hai yêu cầu tạo cùng tên một lúc: yêu cầu thua bị chỉ mục duy nhất chặn, lấy tài khoản vừa tạo và kiểm tra mật khẩu như thường.
      acc = created ? ins.rows[0] : await find();
      // Không tìm thấy dù chèn bị chặn: tên trùng y hệt một tài khoản cũ bị loại khi điền name_key (xem backfillNameKeys).
      if (!acc) return { error: "Tên này đã có người dùng." };
    }
    if (!created && !(await checkPass(password, acc.pass_hash))) {
      // Tài khoản cũ trùng tên bị loại khi điền name_key (backfillNameKeys) vẫn đăng nhập được bằng mật khẩu của chính nó.
      let legacy = null;
      for (const r of (await this.pool.query("SELECT id, name, pass_hash FROM accounts WHERE name_key IS NULL ORDER BY id")).rows)
        if (nameKey(r.name) === key && await checkPass(password, r.pass_hash)) { legacy = r; break; }
      if (!legacy) return { error: "Sai mật khẩu." };
      acc = legacy;
    }
    const id = Number(acc.id);
    const token = newToken();
    await this.pool.query("INSERT INTO sessions(token, account_id) VALUES ($1,$2)", [token, id]);
    return { token, accountId: id };
  }
  async accountFromToken(token: unknown) {
    if (!tokenOk(token)) return null;
    const r = await this.pool.query(
      "SELECT a.id, a.name FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token=$1 AND s.created_at > now() - interval '30 days'", [token]);
    return r.rowCount ? { accountId: Number(r.rows[0].id), name: r.rows[0].name as string } : null;
  }
  row(x: any, accountId: number, name: string): Character {
    return { accountId, name, rowId: Number(x.id), vohon: x.vohon, level: x.level, xp: x.xp, stars: x.stars,
      rings: (x.rings ?? []).map(Number), kills: x.kills, skills: (x.skills ?? []).map(Number), herbs: parseHerbs(x.herbs) };
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
      "UPDATE vohons SET level=$3, xp=$4, stars=$5, rings=$6, kills=$7, herbs=$8::jsonb, updated_at=now() WHERE id=$1 AND account_id=$2",
      [c.rowId, c.accountId, c.level, c.xp, c.stars, c.rings, c.kills, JSON.stringify(parseHerbs(c.herbs))]);
  }
  async saveSkills(accountId: number, rowId: number, skills: number[]) {
    const r = await this.pool.query("UPDATE vohons SET skills=$3, updated_at=now() WHERE id=$1 AND account_id=$2", [rowId, accountId, skills]);
    return (r.rowCount ?? 0) > 0;
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
    const r = await this.pool.query("SELECT sex, hair, hair_col, outfit_col, skin, looks_chosen FROM accounts WHERE id=$1", [accountId]);
    const x = r.rows[0];
    // Giá trị ngoài khoảng (sửa tay trong DB, hoặc bảng màu bị rút bớt) thì về mặc định thay vì gửi chỉ số hỏng cho client.
    const l = x ? parseLooks({ sex: x.sex, hair: x.hair, hairCol: x.hair_col, outfitCol: x.outfit_col, skin: x.skin }) : null;
    return { ...(l ?? DEFAULT_LOOKS), chosen: !!x?.looks_chosen };
  }
  /**
   * Biểu thức SQL của resolveMap(map_id) và các tham số của nó, đánh số từ `$n`: mọi mã trong MAPS, mã cũ / mã thay thế trong
   * MAP_MOVED (cùng thứ tự), DEFAULT_MAP.
   */
  mapExpr(n: number) {
    const sql = `COALESCE(CASE WHEN map_id = ANY($${n}::text[]) THEN map_id ELSE ($${n + 2}::text[])[array_position($${n + 1}::text[], map_id)] END, $${n + 3})`;
    return { sql, args: [Object.keys(MAPS), Object.keys(MAP_MOVED), Object.values(MAP_MOVED), DEFAULT_MAP] };
  }
  async getLocation(accountId: number) {
    const x = (await this.pool.query("SELECT map_id, pos_x, pos_y, map_file FROM accounts WHERE id=$1", [accountId])).rows[0];
    return toLocation(x?.map_id, x?.pos_x, x?.pos_y, x?.map_file);
  }
  async saveLocation(accountId: number, mapId: string, x: number, y: number, file: string | null = mapFile(mapId)) {
    const m = this.mapExpr(6);
    const r = await this.pool.query(`UPDATE accounts SET map_id=$2, pos_x=$3, pos_y=$4, map_file=$5 WHERE id=$1 AND ${m.sql} = $2`, [accountId, mapId, x, y, file, ...m.args]);
    return (r.rowCount ?? 0) > 0;
  }
  async saveProgress(accountId: number, chars: Character[], mapId: string, x: number, y: number, file: string | null = mapFile(mapId), bag?: Bag) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      // Câu UPDATE accounts đầu tiên vừa là lớp chặn WHERE map_id vừa khóa dòng tài khoản (như writeBag).
      const m = this.mapExpr(6);
      const a = await db.query(`UPDATE accounts SET map_id=$2, pos_x=$3, pos_y=$4, map_file=$5 WHERE id=$1 AND ${m.sql} = $2`, [accountId, mapId, x, y, file, ...m.args]);
      if (a.rowCount !== 1) { await db.query("ROLLBACK"); return false; }
      for (const c of chars) {
        const v = await db.query(
          "UPDATE vohons SET level=$3, xp=$4, stars=$5, rings=$6, kills=$7, herbs=$8::jsonb, updated_at=now() WHERE id=$1 AND account_id=$2",
          [c.rowId, accountId, c.level, c.xp, c.stars, c.rings, c.kills, JSON.stringify(parseHerbs(c.herbs))]);
        if (v.rowCount !== 1 || c.accountId !== accountId) throw new Error(`Võ hồn #${c.rowId} không thuộc tài khoản #${accountId}.`);
      }
      if (bag) await this.writeBag(db, accountId, bag);
      await db.query("COMMIT");
      return true;
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async saveTravel(accountId: number, chars: Character[], from: string, to: string, x: number, y: number, bag?: Bag) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      for (const c of chars) {
        const v = await db.query(
          "UPDATE vohons SET level=$3, xp=$4, stars=$5, rings=$6, kills=$7, herbs=$8::jsonb, updated_at=now() WHERE id=$1 AND account_id=$2",
          [c.rowId, accountId, c.level, c.xp, c.stars, c.rings, c.kills, JSON.stringify(parseHerbs(c.herbs))]);
        if (v.rowCount !== 1 || c.accountId !== accountId) throw new Error(`Võ hồn #${c.rowId} không thuộc tài khoản #${accountId}.`);
      }
      const m = this.mapExpr(7);
      const a = await db.query(`UPDATE accounts SET map_id=$3, pos_x=$4, pos_y=$5, map_file=$6 WHERE id=$1 AND ${m.sql} = $2`, [accountId, from, to, x, y, mapFile(to), ...m.args]);
      if (a.rowCount !== 1) throw new Error(`Tài khoản #${accountId} không còn ở bản đồ ${from}.`);
      if (bag) await this.writeBag(db, accountId, bag);
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  itemRow(x: any): Item {
    return { id: x.id, kind: x.kind, code: x.code, qty: x.qty, years: x.years, stars: x.stars, enhance: x.enhance, stats: x.stats ?? null,
      vohonId: x.vohon_id === null ? null : Number(x.vohon_id), created: new Date(x.created_at).getTime(), ...(x.locked ? { locked: true } : {}) };
  }
  /** Thêm hoặc sửa các ô `items` (chỉ ô của chính tài khoản; id thuộc tài khoản khác thì ném lỗi). Gọi trong transaction. */
  async upsertItems(db: pg.PoolClient, accountId: number, items: Item[]) {
    if (!items.length) return;
    const rows = JSON.stringify(items.map((i) => ({ id: i.id, kind: i.kind, code: i.code, qty: i.qty, years: i.years, stars: i.stars,
      enhance: i.enhance, stats: i.stats ?? null, vohon_id: i.vohonId, created: new Date(i.created).toISOString(), locked: !!i.locked })));
    const r = await db.query(
      `INSERT INTO items(id, account_id, kind, code, qty, years, stars, enhance, stats, vohon_id, created_at, locked)
       SELECT x.id, $1, x.kind, x.code, x.qty, x.years, x.stars, x.enhance, x.stats, x.vohon_id, x.created, x.locked
       FROM jsonb_to_recordset($2::jsonb) AS x(id uuid, kind text, code text, qty int, years int, stars smallint, enhance smallint,
         stats jsonb, vohon_id bigint, created timestamptz, locked boolean)
       ON CONFLICT (id) DO UPDATE SET kind=EXCLUDED.kind, code=EXCLUDED.code, qty=EXCLUDED.qty, years=EXCLUDED.years, stars=EXCLUDED.stars,
         enhance=EXCLUDED.enhance, stats=EXCLUDED.stats, vohon_id=EXCLUDED.vohon_id, locked=EXCLUDED.locked,
         -- Thứ tự ô (#215 "Sắp xếp" đặt lại created); cùng mili giây thì giữ giá trị cũ (Item.created chỉ có mili giây).
         created_at=CASE WHEN date_trunc('milliseconds', items.created_at) = EXCLUDED.created_at THEN items.created_at ELSE EXCLUDED.created_at END
       WHERE items.account_id = EXCLUDED.account_id`, [accountId, rows]);
    if (r.rowCount !== items.length) throw new Error("Id món đồ thuộc tài khoản khác.");
  }
  /** Ghi cả túi và Hồn Tệ trong transaction đang mở (saveBag, saveTravel). Câu UPDATE accounts đầu tiên khóa dòng tài khoản. */
  async writeBag(db: pg.PoolClient, accountId: number, bag: Bag) {
    bagOk(bag);
    // Số ô túi (9.8) chỉ tăng: lần ghi nào cũng không làm mất ô đã mua.
    // Bộ lọc và danh sách tự bán (#216): thiếu thì giữ nguyên (COALESCE); ghi cùng transaction để mua lại không lệch với túi / Hồn Tệ.
    const a = await db.query(`UPDATE accounts SET hon_te=$2, bag_slots=CASE WHEN $3::int IS NULL THEN bag_slots ELSE GREATEST(COALESCE(bag_slots, 0), $3::int) END,
      auto_sell=COALESCE($4::jsonb, auto_sell), auto_sold=COALESCE($5::jsonb, auto_sold) WHERE id=$1`,
      [accountId, bag.honTe, bag.slots ?? null, bag.sell === undefined ? null : JSON.stringify(bag.sell), bag.sold ? JSON.stringify(bag.sold) : null]);
    if (a.rowCount !== 1) throw new Error(`Không có tài khoản #${accountId}.`);
    await db.query("DELETE FROM items WHERE account_id=$1 AND NOT (id = ANY($2::uuid[]))", [accountId, bag.items.map((i) => i.id)]);
    await this.upsertItems(db, accountId, bag.items);
    if (bag.quests?.length) {
      await db.query(
        `INSERT INTO quests(account_id, chain, step, accepted, prog)
         SELECT $1, x.chain, x.step, x.accepted, x.prog FROM jsonb_to_recordset($2::jsonb) AS x(chain text, step smallint, accepted boolean, prog jsonb)
         ON CONFLICT (account_id, chain) DO UPDATE SET step=EXCLUDED.step, accepted=EXCLUDED.accepted, prog=EXCLUDED.prog, updated_at=now()`,
        [accountId, JSON.stringify(bag.quests.map((q) => ({ chain: q.chain, step: q.step, accepted: q.accepted, prog: q.prog })))]);
      // Khảo hạch hằng ngày (mã `daily:<yyyymmdd>:<i>`): chỉ giữ dòng của bộ bài đang ghi, bài các ngày đã qua xóa đi.
      const daily = bag.quests.filter((q) => isDaily(q.chain)).map((q) => q.chain);
      if (daily.length) await db.query("DELETE FROM quests WHERE account_id=$1 AND chain LIKE 'daily:%' AND NOT (chain = ANY($2::text[]))", [accountId, daily]);
    }
  }
  async loadBag(accountId: number, starter: Item[]) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      // Khóa dòng tài khoản: hai phiên vào cùng lúc không thể cùng nhận vật phẩm khởi đầu.
      const a = await db.query("SELECT hon_te, starter_items, bag_slots, auto_sell, auto_sold FROM accounts WHERE id=$1 FOR UPDATE", [accountId]);
      if (!a.rowCount) throw new Error(`Không có tài khoản #${accountId}.`);
      const fresh = !a.rows[0].starter_items;
      if (fresh) {
        await this.upsertItems(db, accountId, starter);
        await db.query("UPDATE accounts SET starter_items=true WHERE id=$1", [accountId]);
      }
      const r = await db.query("SELECT * FROM items WHERE account_id=$1 ORDER BY created_at, id", [accountId]);
      const q = await db.query("SELECT chain, step, accepted, prog FROM quests WHERE account_id=$1", [accountId]);
      await db.query("COMMIT");
      return { bag: { honTe: Number(a.rows[0].hon_te), slots: bagSlotsOf(a.rows[0].bag_slots), items: r.rows.map((x) => this.itemRow(x)),
        sell: a.rows[0].auto_sell ?? undefined, sold: parseSold(a.rows[0].auto_sold),
        quests: q.rows.map((x) => parseQuest({ step: Number(x.step), accepted: x.accepted, prog: x.prog }, x.chain)) }, starter: fresh };
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async saveBag(accountId: number, bag: Bag) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      await this.writeBag(db, accountId, bag);
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async unlockVohon(accountId: number, name: string, vohon: string, level: number, bag: Bag) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      const c = await this.addVohon(accountId, name, vohon, level, db);
      if (!c) { await db.query("ROLLBACK"); return null; }
      await this.writeBag(db, accountId, bag);
      await db.query("COMMIT");
      return c;
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async saveVohonsBag(accountId: number, chars: Character[], bag: Bag) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      for (const c of chars) {
        const v = await db.query(
          "UPDATE vohons SET level=$3, xp=$4, stars=$5, rings=$6, kills=$7, herbs=$8::jsonb, updated_at=now() WHERE id=$1 AND account_id=$2",
          [c.rowId, accountId, c.level, c.xp, c.stars, c.rings, c.kills, JSON.stringify(parseHerbs(c.herbs))]);
        if (v.rowCount !== 1 || c.accountId !== accountId) throw new Error(`Võ hồn #${c.rowId} không thuộc tài khoản #${accountId}.`);
      }
      await this.writeBag(db, accountId, bag);
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async getWaypoints(accountId: number) {
    const r = await this.pool.query("SELECT wp FROM waypoints WHERE account_id=$1", [accountId]);
    return r.rows.map((x) => String(x.wp));
  }
  async unlockWaypoint(accountId: number, wp: string) {
    await this.pool.query("INSERT INTO waypoints (account_id, wp) VALUES ($1, $2) ON CONFLICT DO NOTHING", [accountId, wp]);
  }
  async getAuto(accountId: number): Promise<AutoRow> {
    const r = await this.pool.query("SELECT settings, day, used_secs, bonus_secs FROM auto_hunt WHERE account_id=$1", [accountId]);
    if (!r.rowCount) return { settings: null, day: "", used: 0, bonus: 0 };
    return { settings: r.rows[0].settings, day: String(r.rows[0].day), used: Number(r.rows[0].used_secs) || 0, bonus: Number(r.rows[0].bonus_secs) || 0 };
  }
  async saveAuto(accountId: number, row: AutoRow, db: pg.Pool | pg.PoolClient = this.pool) {
    checkAutoRow(row);
    await db.query(
      `INSERT INTO auto_hunt (account_id, settings, day, used_secs, bonus_secs, updated_at) VALUES ($1, $2::jsonb, $3, $4, $5, now())
       ON CONFLICT (account_id) DO UPDATE SET settings=EXCLUDED.settings, day=EXCLUDED.day, used_secs=EXCLUDED.used_secs,
         bonus_secs=EXCLUDED.bonus_secs, updated_at=now()`,
      [accountId, JSON.stringify(row.settings ?? {}), row.day, row.used, row.bonus]);
  }
  async saveAutoBag(accountId: number, row: AutoRow, bag: Bag) {
    checkAutoRow(row);
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      await this.saveAuto(accountId, row, db);
      await this.writeBag(db, accountId, bag);
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async startOffline(accountId: number, row: OfflineRow) {
    await this.pool.query(
      `INSERT INTO auto_offline (account_id, map_id, zone, started_at, day, used_secs) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (account_id) DO UPDATE SET map_id=EXCLUDED.map_id, zone=EXCLUDED.zone, started_at=EXCLUDED.started_at,
         day=EXCLUDED.day, used_secs=EXCLUDED.used_secs`,
      [accountId, row.mapId, row.zone, new Date(row.at), row.day, row.used]);
  }
  async takeOffline(accountId: number): Promise<OfflineRow | null> {
    const r = await this.pool.query("DELETE FROM auto_offline WHERE account_id=$1 RETURNING map_id, zone, started_at, day, used_secs", [accountId]);
    if (!r.rowCount) return null;
    const o = r.rows[0];
    return { mapId: String(o.map_id), zone: String(o.zone), at: new Date(o.started_at).getTime(), day: String(o.day), used: Number(o.used_secs) || 0 };
  }
  async bossClaims(accountId: number, day: string, kind: string) {
    const r = await this.pool.query("SELECT n FROM boss_claims WHERE account_id=$1 AND day=$2::date AND kind=$3", [accountId, day, kind]);
    return r.rowCount ? Number(r.rows[0].n) : 0;
  }
  async claimBoss(accountId: number, day: string, kind: string, limit: number, bag: Bag) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      // Tăng lượt chỉ khi còn dưới giới hạn: hai lần nhận cùng lúc không thể cùng vượt (dòng bị khóa khi cập nhật).
      const r = await db.query(
        `INSERT INTO boss_claims(account_id, day, kind, n) VALUES ($1, $2::date, $3, 1)
         ON CONFLICT (account_id, day, kind) DO UPDATE SET n = boss_claims.n + 1, updated_at = now() WHERE boss_claims.n < $4
         RETURNING n`, [accountId, day, kind, limit]);
      if (!r.rowCount || Number(r.rows[0].n) > limit) { await db.query("ROLLBACK"); return null; }
      await this.writeBag(db, accountId, bag);
      await db.query("COMMIT");
      return Number(r.rows[0].n);
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async getArena(accountId: number, start: number) {
    const r = await this.pool.query("SELECT elo, wins, losses, draws FROM arena_ratings WHERE account_id=$1", [accountId]);
    return r.rowCount ? arenaRow(r.rows[0]) : { elo: start, wins: 0, losses: 0, draws: 0 };
  }
  async saveArena(accountId: number, start: number, delta: ArenaRecord, reward?: { day: string; kind: string; limit: number; bag: Bag }) {
    arenaOk(delta);
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      const a = await db.query(
        `INSERT INTO arena_ratings(account_id, elo, wins, losses, draws)
         VALUES ($1, GREATEST(0, $2::int + $3::int), GREATEST(0, $4::int), GREATEST(0, $5::int), GREATEST(0, $6::int))
         ON CONFLICT (account_id) DO UPDATE SET elo = GREATEST(0, arena_ratings.elo + $3::int), wins = GREATEST(0, arena_ratings.wins + $4::int),
           losses = GREATEST(0, arena_ratings.losses + $5::int), draws = GREATEST(0, arena_ratings.draws + $6::int), updated_at = now()
         RETURNING elo, wins, losses, draws`,
        [accountId, start, delta.elo, delta.wins, delta.losses, delta.draws]);
      let paid = false;
      if (reward) {
        // Như claimBoss: tăng lượt chỉ khi còn dưới giới hạn; đủ lượt thì chỉ ghi Elo.
        const r = await db.query(
          `INSERT INTO boss_claims(account_id, day, kind, n) VALUES ($1, $2::date, $3, 1)
           ON CONFLICT (account_id, day, kind) DO UPDATE SET n = boss_claims.n + 1, updated_at = now() WHERE boss_claims.n < $4
           RETURNING n`, [accountId, reward.day, reward.kind, reward.limit]);
        if (r.rowCount && Number(r.rows[0].n) <= reward.limit) { await this.writeBag(db, accountId, reward.bag); paid = true; }
      }
      await db.query("COMMIT");
      return { rec: arenaRow(a.rows[0]), paid };
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async arenaTop(n: number, accountId: number) {
    const order = "ORDER BY r.elo DESC, r.wins DESC, r.updated_at, r.account_id";
    const [top, me] = await Promise.all([
      this.pool.query(`SELECT r.account_id, a.name, r.elo, r.wins, r.losses, r.draws FROM arena_ratings r JOIN accounts a ON a.id=r.account_id ${order} LIMIT $1`, [n]),
      this.pool.query(`SELECT * FROM (SELECT r.account_id, r.elo, r.wins, r.losses, r.draws, ROW_NUMBER() OVER (${order}) AS rank FROM arena_ratings r) x
        WHERE x.account_id=$1`, [accountId]),
    ]);
    return { list: top.rows.map((x) => ({ accountId: Number(x.account_id), name: x.name as string, ...arenaRow(x) })),
      me: me.rowCount ? { ...arenaRow(me.rows[0]), rank: Number(me.rows[0].rank) } : null };
  }
  async arenaPairCount(day: string, a: number, b: number) {
    const r = await this.pool.query("SELECT n FROM arena_pairs WHERE day=$1::date AND a=$2 AND b=$3", [day, Math.min(a, b), Math.max(a, b)]);
    return r.rowCount ? Number(r.rows[0].n) : 0;
  }
  async arenaPairAdd(day: string, a: number, b: number) {
    const r = await this.pool.query(
      `INSERT INTO arena_pairs(day, a, b, n) VALUES ($1::date, $2, $3, 1)
       ON CONFLICT (day, a, b) DO UPDATE SET n = arena_pairs.n + 1, updated_at = now() RETURNING n`, [day, Math.min(a, b), Math.max(a, b)]);
    return Number(r.rows[0].n);
  }
  async chooseLooks(accountId: number, looks: Looks) {
    // Một lần duy nhất: điều kiện NOT looks_chosen làm hai yêu cầu cùng lúc chỉ một cái được ghi.
    const r = await this.pool.query(
      "UPDATE accounts SET sex=$2, hair=$3, hair_col=$4, outfit_col=$5, skin=$6, looks_chosen=true WHERE id=$1 AND NOT looks_chosen",
      [accountId, looks.sex, looks.hair, looks.hairCol, looks.outfitCol, looks.skin]);
    return (r.rowCount ?? 0) > 0;
  }
}

export const store: Store = process.env.DATABASE_URL ? new PgStore(process.env.DATABASE_URL) : new MemoryStore();
