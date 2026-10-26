// Lưu trữ tài khoản và võ hồn sở hữu.
// Có DATABASE_URL -> dùng PostgreSQL/Supabase. Không có -> lưu trong RAM (mất khi tắt server, chỉ để thử nhanh).
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { nameKey, isReservedName } from "./names.ts";
import { mapFile } from "./map.ts";
import { DEFAULT_LOOKS, parseLooks, encodeLpc, decodeLpc, presetToLpc, parseTeam, TEAM_SIZE, MAPS, MAP_MOVED, DEFAULT_MAP, parseQuest, isDaily, isTongTask, type TongRank, parseHerbs, bagSlotsOf, BAG_SLOTS, BAG_MAX_SLOTS,
  BONE_ITEM, CORE_ITEM, EQUIP_ITEM, EQUIP_SLOTS, resonanceProgress, resonanceLevels, resonanceRankValue, resonanceRankCompare,
  RESONANCE_RANK_PAGE_SIZE, RESONANCE_RANK_PAGE_MAX, RESONANCE_RANK_CACHE, RANK_BOARD_CACHE,
  type Looks, type QuestProgress, type ArenaRecord, type ResonanceRankRow, type ResonanceRankValue } from "../../shared/data.ts";

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

/** Ngoại hình hồn sư của tài khoản. `chosen` = đã tạo nhân vật (lần chọn đầu, miễn phí); `changes` = số lần đã đổi ở thợ may sau đó (LOOKS_CHANGE). */
export interface AccountLooks extends Looks { chosen: boolean; changes: number; }

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
  equipSlot?: number;          // trang bị hồn sư đang mặc (E1, items.equip_slot): chỉ số ô trong EQUIP_SLOTS; thiếu = nằm trong túi
}
/**
 * Túi đồ và Hồn Tệ (đồng) của một tài khoản: chỉ server và chính chủ thấy. Từ 6.2 kèm tiến độ nhiệm vụ `quests` (bảng `quests`,
 * mỗi chuỗi một dòng): ghi trong cùng transaction với túi để phần thưởng và bước mới không bao giờ lệch nhau. Thiếu `quests` khi
 * ghi thì giữ nguyên tiến độ đang lưu. Từ 9.8 `slots`: số ô túi (cột `accounts.bag_slots`, mở rộng ở thương nhân); thiếu khi ghi thì
 * giữ nguyên, ghi thì chỉ tăng (không bao giờ giảm số ô đã mua). Từ #216 `sell`: bộ lọc tự bán (JSON thô, room kiểm lại bằng
 * parseSell; `accounts.auto_sell`), `sold`: các món tự bán gần nhất để mua lại (`accounts.auto_sold`); thiếu khi ghi thì giữ nguyên.
 */
/** Tông môn của tài khoản (#196). */
export interface TongRow { tong: string | null; at: number | null; }
/** Bảng tông tuần (#197): mỗi tông có điểm trong tuần (TongRank), và top cá nhân mỗi tông (tên, điểm; điểm > 0, cao trước). */
export interface TongBoard { tongs: TongRank[]; top: Record<string, { name: string; points: number }[]>; }
export interface Bag { items: Item[]; honTe: number; quests?: QuestProgress[]; slots?: number; sell?: unknown; sold?: SoldRow[];
  /** Điểm tông tuần (#197, #320) cộng cùng transaction với túi: bài tông vụ đã xong thì điểm đi theo lần ghi túi, không mất một nửa. */
  tongPts?: { week: number; tong: string; n: number }[];
  /** Khóa phiên bản (E3, cường hóa trang bị): các món sẽ bị sửa / xóa, kèm cấp cường hóa đang lưu mà phòng dựa vào để tung. Lệch thì ném lỗi, không ghi gì. */
  lock?: { id: string; enhance: number }[]; }
/** Một hồn sư trong danh sách bạn bè / chặn (#195). */
export interface SocialPeer { id: number; name: string; }
/** Bạn bè, chặn và người đã thêm mình của một tài khoản (#195; Store.getSocial). */
export interface SocialRow { friends: SocialPeer[]; blocks: SocialPeer[]; fans: number[]; }
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
/**
 * Tài khoản TEST (#517, cột `accounts.is_test`, 028_is_test.sql): dữ liệu dựng sẵn do `server/src/testPreset.ts` tạo, ghi một lần bằng
 * Store.seedTestAccount. Võ hồn, món gắn võ hồn và đội hình trỏ bằng MÃ võ hồn (VOHON), vì mã dòng `vohons.id` chỉ có sau khi ghi.
 */
export interface SeedVohon { vohon: string; level: number; xp: number; stars: number; rings: number[]; kills: number; skills: number[]; herbs: Record<string, number>; }
export type SeedItem = Omit<Item, "id" | "created" | "vohonId"> & { vohon?: string };
export interface SeedData {
  vohons: SeedVohon[];
  active: string;                 // mã võ hồn ra trận (nằm trong `vohons` và `team`)
  team: string[];                 // mã võ hồn theo ô đội (tối đa TEAM_SIZE, không trùng)
  items: SeedItem[];              // túi đồ: `vohon` có thì món gắn vào võ hồn đó; `equipSlot` có thì đang mặc
  honTe: number; slots: number;   // Hồn Tệ (đồng) và số ô túi
  starter: boolean;               // đã nhận vật phẩm khởi đầu (STARTER_ITEMS) chưa; false thì lần vào game tới server tặng
  waypoints: string[];            // mã truyền tống trận đã mở khoá
  mapId: string | null;           // bản đồ đang đứng (null = chưa lưu: về DEFAULT_MAP); vị trí luôn về điểm xuất hiện
  looks: Looks;
}
/** Tài khoản theo tên, kể cả chưa thức tỉnh: `isTest` (cờ 028), `lastLogin` (ms phiên đăng nhập gần nhất, null = chưa có; RAM không ghi). */
export interface AccountRef { id: number; name: string; isTest: boolean; lastLogin: number | null; }
/** Hàm kiểm tra dữ liệu dựng sẵn dùng chung cho cả hai store: võ hồn không trùng, đội / võ hồn ra trận / món gắn đều trỏ tới võ hồn có thật. */
function seedOk(d: SeedData) {
  const codes = new Set(d.vohons.map((v) => v.vohon));
  if (!d.vohons.length || codes.size !== d.vohons.length) throw new Error("Dữ liệu dựng sẵn: võ hồn trống hoặc trùng.");
  if (!codes.has(d.active) || !d.team.includes(d.active) || new Set(d.team).size !== d.team.length || d.team.length > TEAM_SIZE || d.team.some((c) => !codes.has(c)))
    throw new Error("Dữ liệu dựng sẵn: đội hình / võ hồn ra trận không hợp lệ.");
  for (const i of d.items) if (i.vohon !== undefined && !codes.has(i.vohon)) throw new Error(`Dữ liệu dựng sẵn: món ${i.code} gắn vào võ hồn lạ ${i.vohon}.`);
  if (!parseTeam(autoTeam(d.team.map((_, k) => k + 1)))) throw new Error("Dữ liệu dựng sẵn: đội hình sai dạng.");
}
/** Đổi món dựng sẵn thành `Item` thật (id mới, thứ tự ô theo vị trí trong danh sách); `rowOf` đổi mã võ hồn thành `vohons.id`. */
const seedItems = (items: SeedItem[], rowOf: (code: string) => number): Item[] => {
  const t0 = Date.now() - items.length;
  return items.map(({ vohon, ...i }, k): Item => ({ ...copyItem({ ...i, id: "", created: 0, vohonId: null }), id: randomUUID(), created: t0 + k, vohonId: vohon === undefined ? null : rowOf(vohon) }));
};
/** Các bảng xoá khi `removeTestAccount` (theo thứ tự xoá; kết quả trả số dòng mỗi bảng). */
const REMOVE_TABLES = ["items", "teams", "vohons", "quests", "waypoints", "boss_claims", "auto_hunt", "auto_offline", "tong_points", "arena_ratings", "arena_pairs", "arena_elo_day",
  "friends", "blocks", "map_fog", "sessions", "characters", "inventory", "accounts"] as const;
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
  // Trang bị đang mặc (E1): ô có thật, đúng món trang bị, không gắn võ hồn, mỗi ô một món (khớp CHECK và chỉ mục duy nhất của 027_trang_bi.sql).
  const worn = new Set<number>();
  for (const i of b.items) {
    if (i.equipSlot === undefined) continue;
    if (!Number.isInteger(i.equipSlot) || i.equipSlot < 0 || i.equipSlot >= EQUIP_SLOTS.length || i.code !== EQUIP_ITEM || i.vohonId !== null || worn.has(i.equipSlot))
      throw new Error(`Ô trang bị ${i.equipSlot} của ${i.id} không hợp lệ.`);
    worn.add(i.equipSlot);
  }
  for (const r of b.sold ?? []) if (!Number.isInteger(r.item.qty) || r.item.qty < 1 || !Number.isSafeInteger(r.price) || r.price < 0) throw new Error(`Món tự bán ${r.key} không hợp lệ.`);
  const chains = new Set((b.quests ?? []).map((q) => q.chain));
  if (chains.size !== (b.quests ?? []).length) throw new Error("Tiến độ nhiệm vụ có hai dòng cùng chuỗi.");
}

// Nguyên tắc: không bao giờ mất võ hồn. Store không có hàm xóa võ hồn.
export interface Store {
  init(): Promise<void>;
  /** Đóng kết nối DB khi tắt server (index.ts, sau lần lưu cuối của mọi người chơi đang online; #270). */
  close(): Promise<void>;
  /** Tìm tài khoản theo nameKey(name) (names.ts), chưa có thì tạo với tên hiển thị `name`. `created`: lần này vừa tạo tài khoản (giới
   *  hạn tạo tài khoản mới theo IP, #207). `create` false (IP hết lượt tạo): tên chưa có thì không tạo, trả lỗi kèm `noCreate`. */
  login(name: string, password: string, create?: boolean):
    Promise<{ token: string; accountId: number; created: boolean } | { error: string; noCreate?: true }>;
  /** Đăng nhập Google (#612): tài khoản đã liên kết với định danh `subject` của `provider` (null = chưa). */
  accountByIdentity(provider: string, subject: string): Promise<number | null>;
  /** Mở phiên mới cho tài khoản (đăng nhập qua định danh ngoài, không mật khẩu): trả token như login. */
  startSession(accountId: number): Promise<string>;
  /** Xóa phiên quá hạn (> 30 ngày) của mọi tài khoản, tối đa SESSION_SWEEP_LIMIT dòng mỗi lần; trả số dòng đã xóa. Server gọi mỗi giờ. */
  pruneSessions(): Promise<number>;
  /** Tạo tài khoản MỚI chỉ có định danh ngoài (mật khẩu ngẫu nhiên không ai biết) với tên hiển thị `name` (đã cleanName). Tên trùng thì
   *  `taken`; định danh đã có tài khoản (hai yêu cầu song song) thì `linked`. */
  createIdentityAccount(name: string, provider: string, subject: string): Promise<{ accountId: number } | { error: "taken" | "linked" }>;
  /** Liên kết định danh với tài khoản đang đăng nhập: `subject-taken` = định danh đã thuộc tài khoản khác, `has-provider` = tài khoản đã liên kết
   *  một định danh cùng nhà cung cấp. Liên kết lại đúng định danh đã có của chính tài khoản này là `ok`. */
  linkIdentity(accountId: number, provider: string, subject: string): Promise<"ok" | "subject-taken" | "has-provider">;
  /** Tài khoản đã liên kết `provider` chưa (cho Cài đặt: "đã liên kết Google"). */
  hasIdentity(accountId: number, provider: string): Promise<boolean>;
  /** Tài khoản của phiên `token`; `token` sai định dạng (không phải chuỗi newToken) thì null, không hỏi DB. */
  accountFromToken(token: unknown): Promise<{ accountId: number; name: string } | null>;
  /** Đăng xuất (#999): xóa đúng phiên `token` (phiên khác của cùng tài khoản giữ nguyên). true = có phiên bị xóa; token sai dạng thì false, không hỏi DB. */
  endSession(token: unknown): Promise<boolean>;
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
  /**
   * Đổi ngoại hình ở thợ may (L4 #511) trong MỘT transaction: ghi ngoại hình mới, tăng số lần đổi và ghi túi (đã trừ Hồn Tệ). Chỉ thành công khi
   * tài khoản đã tạo nhân vật và số lần đổi trong DB đúng bằng `expect` (hai yêu cầu cùng lúc chỉ một cái được ghi); trả số lần đổi mới,
   * hoặc null (không ghi gì, kể cả túi) nếu không khớp.
   */
  changeLooks(accountId: number, looks: Looks, expect: number, bag: Bag): Promise<number | null>;
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
  /**
   * Sương mù khám phá (R8 #435, bảng `map_fog`): bitset ô thô của tài khoản ở bản đồ `mapId` (shared/fog.ts). null = chưa có, hoặc dòng ghi cho
   * file Tiled khác `file` (tọa độ không còn đúng). Nơi gọi tự kiểm kích thước bằng fogValid.
   */
  getFog(accountId: number, mapId: string, file: string): Promise<Uint8Array | null>;
  /** Ghi (thay cả dòng) bitset ô thô của tài khoản ở bản đồ `mapId` / file `file`. Gọi qua chuỗi lưu của người chơi, gộp theo nhịp lưu, không mỗi bước. */
  saveFog(accountId: number, mapId: string, file: string, cells: Uint8Array): Promise<void>;
  /** Tông môn của tài khoản (#196, cột `accounts.tong` / `tong_at`): `tong` mã trong TONG_MON (null = không), `at` ms gia nhập gần nhất (null = chưa từng). */
  getTong(accountId: number): Promise<TongRow>;
  /**
   * Đặt tông (null = rời) và lúc gia nhập `at` (null = giữ nguyên). `week` (tongWeek): xoá điểm tuần đó của tài khoản (bảng `tong_points`)
   * trong cùng transaction; thiếu thì không xoá. Gọi qua chuỗi lưu của người chơi.
   */
  setTong(accountId: number, tong: string | null, at: number | null, week?: number): Promise<void>;
  /** Điểm tông tuần `week` (tongWeek) của tài khoản (#197, bảng `tong_points`): tông và số điểm; chưa có dòng thì null. */
  tongPoints(accountId: number, week: number): Promise<{ tong: string; points: number } | null>;
  /** Cộng `n` điểm tông tuần `week` cho tài khoản ở tông `tong` (#197); trả số điểm sau khi cộng. Gọi qua chuỗi lưu của người chơi. */
  addTongPoints(accountId: number, week: number, tong: string, n: number): Promise<number>;
  /**
   * Bảng tông tuần `week` (#197): mỗi tông có dòng điểm trong tuần: số thành viên hoạt động (từ `min` điểm) và điểm trung bình của họ
   * (0 nếu không ai hoạt động); top `topN` cá nhân mỗi tông.
   */
  tongBoard(week: number, min: number, topN: number): Promise<TongBoard>;
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
   * `n`: tăng ngần này lượt một lần (mua `n` mảnh ở Thương hội, #282); số lượt sau khi tăng vượt `limit` thì null, không ghi gì.
   */
  claimBoss(accountId: number, day: string, kind: string, limit: number, bag: Bag, n?: number): Promise<number | null>;
  /** Elo và thành tích Đại Đấu Hồn Trường (bảng `arena_ratings`, 7.2); chưa đấu trận nào thì Elo `start`, 0 trận. */
  getArena(accountId: number, start: number): Promise<ArenaRecord>;
  /**
   * Ghi kết quả một trận đấu hồn (7.2) trong MỘT transaction: CỘNG `delta` (chênh Elo do phòng tính bằng eloAfter, +1 thắng / thua /
   * hòa) vào dòng đang lưu, chưa có dòng thì tính từ Elo `start`; mọi cột không dưới 0. Cộng (không ghi đè) để một lần ghi đến muộn
   * không xóa kết quả trận khác. Có `reward` thì tăng lượt (`day`, `kind`) nếu còn dưới `limit` (như claimBoss) và ghi cả túi
   * `reward.bag` (túi đã có phần thưởng), như saveBag. Trả về thành tích sau khi ghi và `paid` (đã ghi phần thưởng; false nếu không có
   * hoặc đã đủ lượt trong ngày: vẫn ghi Elo, không ghi túi). Lỗi thì rollback rồi ném lỗi.
   * `eloCap` (#791, bảng `arena_elo_day`): trần tổng Elo cộng thêm của tài khoản trong ngày `day`; `delta.elo` dương bị kẹp phần còn lại
   * dưới `limit` (không còn thì Elo không đổi, `eloCapped` = true và KHÔNG ghi `reward`); `delta.elo` âm / 0 không đụng trần. Thắng / thua / hòa vẫn ghi.
   */
  saveArena(accountId: number, start: number, delta: ArenaRecord, reward?: { day: string; kind: string; limit: number; bag: Bag },
    eloCap?: { day: string; limit: number }): Promise<{ rec: ArenaRecord; paid: boolean; eloCapped: boolean }>;
  /**
   * Bảng xếp hạng (7.2): `n` tài khoản đứng đầu (đã đấu ít nhất một trận) theo Elo, rồi số trận thắng, rồi ai đạt mức đó trước; kèm
   * hạng và thành tích của `accountId` (null = chưa đấu trận nào).
   */
  arenaTop(n: number, accountId: number): Promise<{ list: (ArenaRecord & { accountId: number; name: string })[]; me: (ArenaRecord & { rank: number }) | null }>;
  /** Bảng xếp hạng cộng minh, tính lại từ võ hồn và đồ đang gắn; không có bảng tóm tắt riêng. */
  resonanceTop(page: number, pageSize: number, accountId: number): Promise<ResonanceTopResult>;
  /** Số trận có kết quả giữa hai tài khoản `a`, `b` (thứ tự bất kỳ) trong ngày `day` (giờ Việt Nam; bảng `arena_pairs`, 9.7). */
  arenaPairCount(day: string, a: number, b: number): Promise<number>;
  /**
   * Đếm thêm một trận có kết quả của cặp (`a`, `b`) trong ngày `day` (9.7), một câu lệnh nên hai lần ghi cùng lúc không đếm trùng.
   * Trả về số trận sau khi đếm (trận này là trận thứ mấy; arenaRanked quyết định có tính Elo không).
   */
  arenaPairAdd(day: string, a: number, b: number): Promise<number>;
  /** Hồn sư tên `name` (so theo nameKey, đã thức tỉnh) có thật không, kể cả đang ngoại tuyến: tài khoản và tên đúng cách viết (#195). */
  findAccount(name: string): Promise<SocialPeer | null>;
  /**
   * Bạn bè và chặn của tài khoản (#195, bảng `friends` / `blocks`, theo thứ tự thêm), cùng `fans`: tài khoản đã thêm tài khoản này
   * vào danh sách của họ (biết hai bên đã thêm nhau khi người kia ngoại tuyến).
   */
  getSocial(accountId: number): Promise<SocialRow>;
  /** Thêm (`on`) / bỏ `other` khỏi danh sách bạn bè của chính tài khoản (chạy lại an toàn). Chỉ gọi trong chuỗi lưu của người chơi. */
  setFriend(accountId: number, other: number, on: boolean): Promise<void>;
  /**
   * Chặn (`on`, trong MỘT transaction bỏ luôn `other` khỏi danh sách bạn bè của chính tài khoản) / bỏ chặn (chạy lại an toàn). Chỉ
   * ghi dòng của chính tài khoản; chỉ gọi trong chuỗi lưu của người chơi.
   */
  setBlock(accountId: number, other: number, on: boolean): Promise<void>;
  /** Tài khoản theo tên (so theo nameKey), kể cả chưa thức tỉnh; chưa có thì null (công cụ tài khoản test, #517). */
  lookupAccount(name: string): Promise<AccountRef | null>;
  /** Tài khoản có cờ `is_test` không (ẩn khỏi xếp hạng, chỉ ghép đấu trường với tài khoản test cùng loại, #517). Không có tài khoản thì false. */
  isTestAccount(accountId: number): Promise<boolean>;
  /**
   * Tạo (nếu chưa có; cần `password`) hoặc dựng lại tài khoản TEST `name` theo `data`, trong MỘT transaction (#517): xoá võ hồn, đồ, đội, nhiệm vụ,
   * truyền tống, tự săn, điểm tông của tài khoản rồi ghi lại, bật `is_test`. Tên đã có mà KHÔNG có cờ `is_test` thì ném lỗi, không ghi gì.
   * Không đụng tài khoản khác, không đổi mật khẩu tài khoản đã có, không đụng Elo / bạn bè.
   */
  seedTestAccount(name: string, password: string | null, data: SeedData): Promise<{ accountId: number; created: boolean }>;
  /** Bật cờ `is_test` cho tài khoản (admin dùng lệnh GM, #518). Chỉ bật, không có đường tắt cờ qua game; tắt cờ chỉ bằng SQL tay. */
  markTest(accountId: number): Promise<void>;
  /** Xoá sạch tài khoản TEST `name` (mọi bảng tham chiếu, rồi dòng `accounts`) trong MỘT transaction; trả số dòng đã xoá mỗi bảng. Không có cờ `is_test` thì ném lỗi. */
  removeTestAccount(name: string): Promise<Record<string, number>>;
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
/** Phiên sống 30 ngày (accountFromToken); mỗi tài khoản giữ tối đa SESSION_KEEP phiên mới nhất (nhiều thiết bị vẫn đủ); quét định kỳ xóa
 *  tối đa SESSION_SWEEP_LIMIT phiên quá hạn mỗi lượt (#736). */
const SESSION_DAYS = 30, SESSION_KEEP = 10, SESSION_SWEEP_LIMIT = 5000;
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

export interface ResonanceTopEntry extends ResonanceRankRow { name: string; }
export interface ResonanceTopResult {
  page: number; pageSize: number; total: number; hasNext: boolean;
  list: ResonanceTopEntry[];
  me: (ResonanceRankValue & { rank: number }) | null;
}
function resonanceEntry(accountId: number, name: string, vohons: { level: number; rings: number; stars: number }[], bones: { enhance: number }[], cores: { stars: number }[]): ResonanceTopEntry | null {
  const prog = resonanceProgress({ vohons, bones, cores }), levels = resonanceLevels(prog);
  const value = resonanceRankValue(prog, levels, vohons.reduce((s, v) => s + Math.max(0, Math.floor(v.stars) - 1), 0));
  return value.score ? { accountId, name, ...value } : null;
}
// Bảng xếp hạng đấu trường / tông môn (#738): kết quả dùng chung trong tiến trình, hết hạn sau RANK_BOARD_CACHE giây; yêu cầu đến lúc đang
// tính dùng chung một Promise. Mọi lần ghi điểm / Elo trong tiến trình gọi rankBoardClear() nên chỉ bảng do tiến trình khác ghi mới trễ.
const rankBoards = new Map<string, { at: number; v: unknown }>(), rankBusy = new Map<string, Promise<unknown>>();
let rankGen = 0;
export const rankBoardClear = () => { rankGen++; rankBoards.clear(); rankBusy.clear(); };
function rankBoard<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const hit = rankBoards.get(key);
  if (hit && Date.now() - hit.at < RANK_BOARD_CACHE * 1000) return Promise.resolve(hit.v as T);
  const busy = rankBusy.get(key); if (busy) return busy as Promise<T>;
  const gen = rankGen;
  const p = compute().then((v) => { if (gen === rankGen) rankBoards.set(key, { at: Date.now(), v }); return v; }).finally(() => { if (rankBusy.get(key) === p) rankBusy.delete(key); });
  rankBusy.set(key, p);
  return p;
}
// Bảng đã sắp xếp dùng chung mọi phòng / cả hai Store, hết hạn sau RESONANCE_RANK_CACHE giây; yêu cầu đến lúc đang tính dùng chung một Promise.
let resonanceCache: { at: number; all: ResonanceTopEntry[] } | null = null, resonanceBusy: Promise<ResonanceTopEntry[]> | null = null;
async function resonanceRanking(compute: () => Promise<ResonanceTopEntry[]>): Promise<ResonanceTopEntry[]> {
  if (resonanceCache && Date.now() - resonanceCache.at < RESONANCE_RANK_CACHE * 1000) return resonanceCache.all;
  resonanceBusy ??= compute().then((all) => { all.sort(resonanceRankCompare); resonanceCache = { at: Date.now(), all }; return all; }).finally(() => { resonanceBusy = null; });
  return resonanceBusy;
}
function resonancePage(all: ResonanceTopEntry[], page: number, pageSize: number, accountId: number): ResonanceTopResult {
  const p = Math.max(1, Math.floor(page) || 1), size = Math.max(1, Math.min(RESONANCE_RANK_PAGE_MAX, Math.floor(pageSize) || RESONANCE_RANK_PAGE_SIZE));
  const at = all.findIndex((x) => x.accountId === accountId), start = (p - 1) * size;
  const me = at < 0 ? null : { score: all[at].score, milestones: all[at].milestones, progressBp: all[at].progressBp, extraStars: all[at].extraStars, rank: at + 1 };
  return { page: p, pageSize: size, total: all.length, hasNext: start + size < all.length, list: all.slice(start, start + size), me };
}

export class MemoryStore implements Store {
  accounts = new Map<string, { id: number; pass: string }>();  // nameKey(tên) -> tài khoản
  names = new Map<number, string>();
  sessions = new Map<string, { accountId: number; at: number }>(); // token -> tài khoản + lúc mở phiên (ms)
  rows = new Map<number, Character>();  // vohons.id -> võ hồn
  active = new Map<number, number>();   // accountId -> vohons.id đang ra trận
  looks = new Map<number, Looks>();     // accountId -> ngoại hình đã chọn (chưa có = chưa chọn)
  looksChanges = new Map<number, number>(); // accountId -> số lần đã đổi ngoại hình ở thợ may (accounts.looks_changes, L4 #511)
  teams = new Map<number, number[]>();  // accountId -> đội hình (vohons.id theo ô, 0 = trống)
  locs = new Map<number, { mapId: string | null; x: number | null; y: number | null; file: string | null }>(); // accountId -> accounts.map_id, pos_x, pos_y, map_file
  bags = new Map<number, Bag>();        // accountId -> túi đồ (bảng items) và Hồn Tệ (accounts.hon_te)
  starter = new Set<number>();          // accountId đã nhận vật phẩm khởi đầu (accounts.starter_items)
  claims = new Map<string, number>();   // "accountId|day|kind" -> số lần nhận thưởng boss (bảng boss_claims, BĐ5)
  quests = new Map<number, QuestProgress[]>(); // accountId -> tiến độ nhiệm vụ từng chuỗi (bảng quests, 6.2)
  arena = new Map<number, ArenaRecord & { t: number }>(); // accountId -> Elo, thành tích, lần ghi (bảng arena_ratings, 7.2)
  pairs = new Map<string, number>(); // "day|a|b" (a < b) -> số trận của cặp trong ngày (bảng arena_pairs, 9.7)
  eloDay = new Map<string, number>(); // "accountId|day" -> tổng Elo cộng thêm trong ngày (bảng arena_elo_day, #791)
  wps = new Map<number, Set<string>>(); // accountId -> mã truyền tống trận đã mở khóa (bảng waypoints, 11.2)
  fogs = new Map<number, Map<string, { file: string; cells: Uint8Array }>>(); // accountId -> mapId -> bitset sương mù (bảng map_fog, R8)
  tongs = new Map<number, TongRow>(); // accountId -> tông môn (accounts.tong / tong_at, #196)
  tongPts = new Map<string, { accountId: number; week: number; tong: string; points: number }>(); // `${accountId}|${week}|${tong}` -> điểm tông tuần (tong_points, #197)
  autos = new Map<number, AutoRow>(); // accountId -> cài đặt và giờ treo tự săn (bảng auto_hunt, Auto 1)
  offline = new Map<number, OfflineRow>(); // accountId -> lần ủy thác offline chưa nhận (bảng auto_offline, Auto 3)
  friends = new Map<number, Set<number>>(); // accountId -> tài khoản đã thêm làm bạn, theo thứ tự thêm (bảng friends, #195)
  blocks = new Map<number, Set<number>>(); // accountId -> tài khoản đã chặn, theo thứ tự chặn (bảng blocks, #195)
  tests = new Set<number>(); // accountId có cờ is_test (028_is_test.sql, #517)
  arenaT = 0;
  seq = 1; rowSeq = 1;
  async init() { console.warn("⚠  Chưa có DATABASE_URL: dữ liệu chỉ lưu trong RAM."); }
  async close() {}
  async login(name: string, password: string, create = true) {
    const key = nameKey(name);
    let acc = this.accounts.get(key), created = false;
    if (!acc && !create) return { error: "Chưa có tài khoản.", noCreate: true as const };
    if (!acc) {
      const pass = await hashPass(password);
      // Trong lúc băm có yêu cầu khác cùng tên vừa tạo tài khoản: kiểm mật khẩu như tài khoản có sẵn.
      acc = this.accounts.get(key);
      if (!acc) { acc = { id: this.seq++, pass }; this.accounts.set(key, acc); this.names.set(acc.id, name); created = true; }
    }
    if (!created && !(await checkPass(password, acc.pass))) return { error: "Sai mật khẩu." };
    const token = this.openSession(acc.id);
    return { token, accountId: acc.id, created };
  }
  identities = new Map<string, number>(); // `${provider}|${subject}` -> accountId (bảng account_identities, #612)
  async accountByIdentity(provider: string, subject: string) { return this.identities.get(`${provider}|${subject}`) ?? null; }
  async startSession(accountId: number) { return this.openSession(accountId); }
  /** Mở phiên: bỏ phiên quá hạn của tài khoản, rồi giữ SESSION_KEEP - 1 phiên mới nhất để chừa chỗ cho phiên mới. */
  openSession(accountId: number) {
    const now = Date.now(), own = [...this.sessions].filter(([, s]) => s.accountId === accountId).reverse().sort((a, b) => b[1].at - a[1].at); // reverse: cùng ms thì phiên chèn sau là mới hơn (sort ổn định)
    own.forEach(([t, s], i) => { if (now - s.at > SESSION_DAYS * 864e5 || i >= SESSION_KEEP - 1) this.sessions.delete(t); });
    const token = newToken(); this.sessions.set(token, { accountId, at: now }); return token;
  }
  async endSession(token: unknown) { return tokenOk(token) && this.sessions.delete(token); }
  async pruneSessions() {
    const cut = Date.now() - SESSION_DAYS * 864e5; let n = 0;
    for (const [t, s] of this.sessions) if (s.at < cut && n < SESSION_SWEEP_LIMIT) { this.sessions.delete(t); n++; }
    return n;
  }
  async createIdentityAccount(name: string, provider: string, subject: string) {
    const key = nameKey(name), ik = `${provider}|${subject}`;
    if (this.identities.has(ik)) return { error: "linked" as const };
    if (this.accounts.has(key)) return { error: "taken" as const };
    const pass = await hashPass(randomBytes(24).toString("base64url"));
    // Trong lúc băm có yêu cầu khác vừa tạo cùng tên / cùng định danh.
    if (this.identities.has(ik)) return { error: "linked" as const };
    if (this.accounts.has(key)) return { error: "taken" as const };
    const acc = { id: this.seq++, pass }; this.accounts.set(key, acc); this.names.set(acc.id, name); this.identities.set(ik, acc.id);
    return { accountId: acc.id };
  }
  async linkIdentity(accountId: number, provider: string, subject: string) {
    const ik = `${provider}|${subject}`, owner = this.identities.get(ik);
    if (owner === accountId) return "ok" as const;
    if (owner !== undefined) return "subject-taken" as const;
    if ([...this.identities].some(([k, a]) => a === accountId && k.startsWith(`${provider}|`))) return "has-provider" as const;
    this.identities.set(ik, accountId); return "ok" as const;
  }
  async hasIdentity(accountId: number, provider: string) { return [...this.identities].some(([k, a]) => a === accountId && k.startsWith(`${provider}|`)); }
  async accountFromToken(token: unknown) {
    const s = tokenOk(token) ? this.sessions.get(token) : undefined, id = s && Date.now() - s.at <= SESSION_DAYS * 864e5 ? s.accountId : undefined; return id ? { accountId: id, name: this.names.get(id)! } : null;
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
  async getLooks(accountId: number): Promise<AccountLooks> {
    let l = this.looks.get(accountId);
    // HL2 #571: đã chọn mà chưa phải LPC thì chuyển sang LPC (cùng luật với PgStore.getLooks), không đụng số lần đổi.
    if (l && l.mode !== "lpc") { l = parseLooks({ mode: "lpc", lpc: presetToLpc(l) })!; this.looks.set(accountId, l); }
    return { ...(l ?? DEFAULT_LOOKS), chosen: !!l, changes: this.looksChanges.get(accountId) ?? 0 };
  }
  async chooseLooks(accountId: number, looks: Looks) {
    if (this.looks.has(accountId)) return false;
    this.looks.set(accountId, { ...looks }); return true;
  }
  async changeLooks(accountId: number, looks: Looks, expect: number, bag: Bag) {
    if (!this.looks.has(accountId) || (this.looksChanges.get(accountId) ?? 0) !== expect) return null;
    this.checkBag(accountId, bag);
    this.looks.set(accountId, { ...looks }); this.looksChanges.set(accountId, expect + 1); this.putBag(accountId, bag);
    return expect + 1;
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
   * có bài khảo hạch hằng ngày (tông vụ, #197) thì bỏ bài khảo hạch (tông vụ) của các ngày khác.
   */
  putBag(accountId: number, bag: Bag) {
    for (const t of bag.tongPts ?? []) this.bumpTong(accountId, t.week, t.tong, t.n);
    const { quests, slots, sell, sold, ...rest } = copyBag(bag), prev = this.bags.get(accountId), old = prev?.slots;
    // Bộ lọc / danh sách tự bán (#216): thiếu khi ghi thì giữ bản đang lưu, như writeBag.
    const keepSell = sell !== undefined ? sell : prev?.sell, keepSold = sold ?? prev?.sold;
    this.bags.set(accountId, { ...rest, ...(slots !== undefined || old !== undefined ? { slots: Math.max(slots ?? 0, old ?? 0) } : {}),
      ...(keepSell !== undefined ? { sell: keepSell } : {}), ...(keepSold ? { sold: keepSold } : {}) });
    if (quests) {
      const daily = quests.some((x) => isDaily(x.chain)), tong = quests.some((x) => isTongTask(x.chain));
      const keep = (this.quests.get(accountId) ?? []).filter((q) => !quests.some((x) => x.chain === q.chain) && !(daily && isDaily(q.chain))
        && !(tong && isTongTask(q.chain)));
      this.quests.set(accountId, [...keep, ...quests]);
    }
  }
  /** Như các ràng buộc của bảng `items`: id không thuộc tài khoản khác, đồ chỉ gắn vào võ hồn của chính tài khoản. */
  checkBag(accountId: number, bag: Bag) {
    bagOk(bag);
    for (const l of bag.lock ?? []) { const x = this.bags.get(accountId)?.items.find((i) => i.id === l.id); if (x && x.enhance !== l.enhance) throw new Error(`Món ${l.id} đã đổi cấp ở nơi khác.`); }
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
  async getFog(accountId: number, mapId: string, file: string) {
    const r = this.fogs.get(accountId)?.get(mapId);
    return r && r.file === file ? new Uint8Array(r.cells) : null;
  }
  async saveFog(accountId: number, mapId: string, file: string, cells: Uint8Array) {
    let m = this.fogs.get(accountId); if (!m) this.fogs.set(accountId, (m = new Map()));
    m.set(mapId, { file, cells: new Uint8Array(cells) });
  }
  async getWaypoints(accountId: number) { return [...(this.wps.get(accountId) ?? [])]; }
  async unlockWaypoint(accountId: number, wp: string) {
    let set = this.wps.get(accountId);
    if (!set) this.wps.set(accountId, (set = new Set()));
    set.add(wp);
  }
  async getTong(accountId: number) { return { ...(this.tongs.get(accountId) ?? { tong: null, at: null }) }; }
  async setTong(accountId: number, tong: string | null, at: number | null, week?: number) {
    this.tongs.set(accountId, { tong, at: at ?? this.tongs.get(accountId)?.at ?? null });
    if (week !== undefined) { for (const [k, x] of this.tongPts) if (x.accountId === accountId && x.week === week) this.tongPts.delete(k); rankBoardClear(); }
  }
  async tongPoints(accountId: number, week: number) {
    let best: { tong: string; points: number } | null = null;
    for (const x of this.tongPts.values()) if (x.accountId === accountId && x.week === week && (!best || x.points > best.points)) best = { tong: x.tong, points: x.points };
    return best;
  }
  bumpTong(accountId: number, week: number, tong: string, n: number) {
    const k = `${accountId}|${week}|${tong}`, x = this.tongPts.get(k) ?? { accountId, week, tong, points: 0 };
    x.points += n; this.tongPts.set(k, x); rankBoardClear();
    return x.points;
  }
  async addTongPoints(accountId: number, week: number, tong: string, n: number) { return this.bumpTong(accountId, week, tong, n); }
  async tongBoard(week: number, min: number, topN: number): Promise<TongBoard> {
    return rankBoard(`tong|${week}|${min}|${topN}`, async () => {
    const by = new Map<string, { accountId: number; points: number }[]>();
    for (const x of this.tongPts.values()) if (x.week === week && !this.tests.has(x.accountId)) { const l = by.get(x.tong) ?? []; l.push(x); by.set(x.tong, l); }
    const tongs: TongRank[] = [], top: TongBoard["top"] = {};
    for (const [tong, l] of by) {
      const act = l.filter((x) => x.points >= min);
      tongs.push({ tong, active: act.length, avg: act.length ? act.reduce((a, x) => a + x.points, 0) / act.length : 0 });
      top[tong] = l.filter((x) => x.points > 0).sort((a, b) => b.points - a.points || a.accountId - b.accountId).slice(0, topN)
        .map((x) => ({ name: this.names.get(x.accountId) ?? "?", points: x.points }));
    }
    return { tongs, top };
    });
  }
  async findAccount(name: string) {
    const acc = this.accounts.get(nameKey(name));
    return acc && this.owned(acc.id).length ? { id: acc.id, name: this.names.get(acc.id)! } : null;
  }
  async getSocial(accountId: number): Promise<SocialRow> {
    const peers = (ids: Set<number> | undefined) => [...(ids ?? [])].map((id) => ({ id, name: this.names.get(id) ?? "?" }));
    const fans = [...this.friends].filter(([a, set]) => a !== accountId && set.has(accountId)).map(([a]) => a);
    return { friends: peers(this.friends.get(accountId)), blocks: peers(this.blocks.get(accountId)), fans };
  }
  /** Thêm / bỏ `other` trong tập của `accountId` ở `m` (giữ thứ tự thêm như created_at). */
  private mark(m: Map<number, Set<number>>, accountId: number, other: number, on: boolean) {
    if (on && (accountId === other || !this.names.has(other))) throw new Error(`Tài khoản #${other} không hợp lệ.`); // như CHECK / khóa ngoại khi thêm
    let set = m.get(accountId);
    if (!set) m.set(accountId, (set = new Set()));
    if (on) set.add(other); else set.delete(other);
  }
  async setFriend(accountId: number, other: number, on: boolean) { this.mark(this.friends, accountId, other, on); }
  async setBlock(accountId: number, other: number, on: boolean) {
    this.mark(this.blocks, accountId, other, on); // thêm: kiểm như CHECK / khóa ngoại trước khi gán
    if (on) this.friends.get(accountId)?.delete(other);
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
  async claimBoss(accountId: number, day: string, kind: string, limit: number, bag: Bag, add = 1) {
    const key = `${accountId}|${day}|${kind}`, n = this.claims.get(key) ?? 0;
    if (n + add > limit) return null;
    this.checkBag(accountId, bag);
    this.claims.set(key, n + add); this.putBag(accountId, bag);
    return n + add;
  }
  async getArena(accountId: number, start: number) {
    const r = this.arena.get(accountId);
    return r ? { elo: r.elo, wins: r.wins, losses: r.losses, draws: r.draws } : { elo: start, wins: 0, losses: 0, draws: 0 };
  }
  async saveArena(accountId: number, start: number, delta: ArenaRecord, reward?: { day: string; kind: string; limit: number; bag: Bag }, eloCap?: { day: string; limit: number }) {
    arenaOk(delta);
    if (!this.names.has(accountId)) throw new Error(`Không có tài khoản #${accountId}.`);
    let paid = false, eloCapped = false;
    if (eloCap && delta.elo > 0) {
      const key = `${accountId}|${eloCap.day}`, got = this.eloDay.get(key) ?? 0, room = Math.max(0, eloCap.limit - got);
      eloCapped = room <= 0;
      delta = { ...delta, elo: Math.min(delta.elo, room) };
      if (delta.elo > 0) this.eloDay.set(key, got + delta.elo);
    }
    if (reward && !eloCapped) {
      const key = `${accountId}|${reward.day}|${reward.kind}`, n = this.claims.get(key) ?? 0;
      if (n < reward.limit) { this.checkBag(accountId, reward.bag); this.claims.set(key, n + 1); this.putBag(accountId, reward.bag); paid = true; }
    }
    const cur = this.arena.get(accountId) ?? { elo: start, wins: 0, losses: 0, draws: 0 }, add = (a: number, b: number) => Math.max(0, a + b);
    const rec = { elo: add(cur.elo, delta.elo), wins: add(cur.wins, delta.wins), losses: add(cur.losses, delta.losses), draws: add(cur.draws, delta.draws) };
    this.arena.set(accountId, { ...rec, t: ++this.arenaT }); rankBoardClear();
    return { rec, paid, eloCapped };
  }
  async arenaTop(n: number, accountId: number) {
    // Cùng thứ tự với chỉ mục arena_ratings_rank: Elo, số trận thắng, ai ghi trước, mã tài khoản.
    const all = [...this.arena].filter(([id]) => !this.tests.has(id)).sort(([ia, a], [ib, b]) => b.elo - a.elo || b.wins - a.wins || a.t - b.t || ia - ib);
    const rec = ([id, r]: [number, ArenaRecord & { t: number }]) => ({ accountId: id, name: this.names.get(id) ?? "?", elo: r.elo, wins: r.wins, losses: r.losses, draws: r.draws });
    const at = all.findIndex(([id]) => id === accountId), mine = at >= 0 ? all[at][1] : null;
    return { list: all.slice(0, n).map(rec), me: mine ? { elo: mine.elo, wins: mine.wins, losses: mine.losses, draws: mine.draws, rank: at + 1 } : null };
  }
  async resonanceTop(page: number, pageSize: number, accountId: number) {
    const all = await resonanceRanking(async () => [...this.names].filter(([id]) => !this.tests.has(id)).map(([id, name]) => {
      const vohons = this.owned(id).map((v) => ({ level: v.level, rings: v.rings.length, stars: v.stars }));
      const worn = (this.bags.get(id)?.items ?? []).filter((i) => i.vohonId !== null);
      return resonanceEntry(id, name, vohons, worn.filter((i) => i.code === BONE_ITEM).map((i) => ({ enhance: i.enhance })),
        worn.filter((i) => i.code === CORE_ITEM).map((i) => ({ stars: i.stars ?? 1 })));
    }).filter((x): x is ResonanceTopEntry => !!x));
    return resonancePage(all, page, pageSize, accountId);
  }
  async arenaPairCount(day: string, a: number, b: number) { return this.pairs.get(pairKey(day, a, b)) ?? 0; }
  async arenaPairAdd(day: string, a: number, b: number) {
    if (a === b || !this.names.has(a) || !this.names.has(b)) throw new Error(`Cặp tài khoản #${a}, #${b} không hợp lệ.`);
    const k = pairKey(day, a, b), n = (this.pairs.get(k) ?? 0) + 1;
    this.pairs.set(k, n);
    return n;
  }
  async lookupAccount(name: string): Promise<AccountRef | null> {
    const acc = this.accounts.get(nameKey(name));
    return acc ? { id: acc.id, name: this.names.get(acc.id)!, isTest: this.tests.has(acc.id), lastLogin: null } : null;
  }
  async isTestAccount(accountId: number) { return this.tests.has(accountId); }
  async markTest(accountId: number) { if (this.names.has(accountId)) this.tests.add(accountId); }
  async seedTestAccount(name: string, password: string | null, data: SeedData) {
    // Kiểm tra hết trước khi đụng gì: ghi hết hoặc không ghi gì.
    seedOk(data); bagOk({ honTe: data.honTe, slots: data.slots, items: seedItems(data.items, () => 1) });
    const key = nameKey(name);
    let acc = this.accounts.get(key), created = false;
    if (acc && !this.tests.has(acc.id)) throw new Error(`Tài khoản "${name}" không có cờ is_test: không ghi đè tài khoản thật.`);
    if (!acc) {
      if (password === null) throw new Error(`Tài khoản "${name}" chưa có: cần mật khẩu để tạo.`);
      const pass = await hashPass(password);
      acc = this.accounts.get(key); // trong lúc băm có yêu cầu khác cùng tên vừa tạo tài khoản
      if (acc && !this.tests.has(acc.id)) throw new Error(`Tài khoản "${name}" không có cờ is_test: không ghi đè tài khoản thật.`);
      if (!acc) { acc = { id: this.seq++, pass }; this.accounts.set(key, acc); this.names.set(acc.id, name); created = true; }
    }
    const id = acc.id;
    this.tests.add(id);
    for (const [rid, c] of this.rows) if (c.accountId === id) this.rows.delete(rid);
    for (const k of [...this.tongPts.keys()]) if (this.tongPts.get(k)!.accountId === id) this.tongPts.delete(k);
    for (const k of [...this.claims.keys()]) if (k.startsWith(`${id}|`)) this.claims.delete(k);
    for (const m of [this.active, this.teams, this.bags, this.quests, this.wps, this.autos, this.offline, this.tongs, this.fogs]) m.delete(id);
    const rowOf = new Map<string, number>();
    for (const v of data.vohons) {
      const c: Character = { accountId: id, name: this.names.get(id)!, rowId: this.rowSeq++, vohon: v.vohon, level: v.level, xp: v.xp, stars: v.stars, rings: [...v.rings],
        kills: v.kills, skills: [...v.skills], herbs: { ...v.herbs } };
      this.rows.set(c.rowId, c); rowOf.set(v.vohon, c.rowId);
    }
    this.active.set(id, rowOf.get(data.active)!);
    this.teams.set(id, autoTeam(data.team.map((c) => rowOf.get(c)!)));
    const bag: Bag = { honTe: data.honTe, slots: data.slots, items: seedItems(data.items, (c) => rowOf.get(c)!) };
    this.checkBag(id, bag); this.putBag(id, bag);
    if (data.starter) this.starter.add(id); else this.starter.delete(id);
    this.locs.set(id, { mapId: data.mapId, x: null, y: null, file: null });
    this.looks.set(id, { ...data.looks }); this.looksChanges.delete(id);
    this.wps.set(id, new Set(data.waypoints));
    return { accountId: id, created };
  }
  async removeTestAccount(name: string) {
    const key = nameKey(name), acc = this.accounts.get(key);
    if (!acc) throw new Error(`Không có tài khoản "${name}".`);
    if (!this.tests.has(acc.id)) throw new Error(`Tài khoản "${name}" không có cờ is_test: không xoá tài khoản thật.`);
    const id = acc.id, n = Object.fromEntries(REMOVE_TABLES.map((t) => [t, 0])) as Record<string, number>;
    const owned = this.owned(id), tokens = [...this.sessions].filter(([, s]) => s.accountId === id).map(([t]) => t);
    const pairs = [...this.pairs.keys()].filter((k) => { const [, a, b] = k.split("|"); return Number(a) === id || Number(b) === id; });
    const eloDays = [...this.eloDay.keys()].filter((k) => k.startsWith(`${id}|`));
    const tp = [...this.tongPts].filter(([, x]) => x.accountId === id).map(([k]) => k), cl = [...this.claims.keys()].filter((k) => k.startsWith(`${id}|`));
    const rel = (m: Map<number, Set<number>>) => (m.get(id)?.size ?? 0) + [...m].filter(([a, set]) => a !== id && set.has(id)).length;
    Object.assign(n, { items: this.bags.get(id)?.items.length ?? 0, teams: this.teams.get(id)?.filter(Boolean).length ?? 0, vohons: owned.length,
      quests: this.quests.get(id)?.length ?? 0, waypoints: this.wps.get(id)?.size ?? 0, map_fog: this.fogs.get(id)?.size ?? 0, boss_claims: cl.length, auto_hunt: this.autos.has(id) ? 1 : 0,
      auto_offline: this.offline.has(id) ? 1 : 0, tong_points: tp.length, arena_ratings: this.arena.has(id) ? 1 : 0, arena_pairs: pairs.length, arena_elo_day: eloDays.length,
      friends: rel(this.friends), blocks: rel(this.blocks), sessions: tokens.length, accounts: 1 });
    for (const c of owned) this.rows.delete(c.rowId);
    for (const k of tp) this.tongPts.delete(k);
    for (const k of cl) this.claims.delete(k);
    for (const k of pairs) this.pairs.delete(k);
    for (const k of eloDays) this.eloDay.delete(k);
    for (const t of tokens) this.sessions.delete(t);
    for (const [k, a] of this.identities) if (a === id) this.identities.delete(k);
    for (const m of [this.active, this.teams, this.bags, this.quests, this.wps, this.autos, this.offline, this.tongs, this.arena, this.locs, this.looks, this.looksChanges, this.friends, this.blocks, this.names, this.fogs])
      m.delete(id);
    for (const m of [this.friends, this.blocks]) for (const set of m.values()) set.delete(id);
    this.starter.delete(id); this.tests.delete(id); this.accounts.delete(key);
    return n;
  }
}

/** Số nguyên dương từ biến môi trường; thiếu hoặc sai thì dùng mặc định. */
function envInt(name: string, def: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 && process.env[name] !== undefined && process.env[name] !== "" ? Math.floor(n) : def;
}

export class PgStore implements Store {
  pool: pg.Pool;
  constructor(url: string) {
    const ssl = process.env.PGSSL === "false" ? false : /supabase|sslmode=require/.test(url) || process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false;
    this.pool = new pg.Pool({ connectionString: url, ssl, max: Math.max(1, envInt("PG_POOL_MAX", 10)), connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000,
      // Mặc định tắt (0 = không giới hạn); đặt thì một truy vấn treo bị cắt thay vì giữ kết nối và chuỗi lưu của người chơi đó mãi.
      ...(envInt("PG_STATEMENT_TIMEOUT_MS", 0) > 0 ? { statement_timeout: envInt("PG_STATEMENT_TIMEOUT_MS", 0), query_timeout: envInt("PG_STATEMENT_TIMEOUT_MS", 0) + 2000 } : {}) });
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
    await this.warnReservedNames().catch((e) => console.warn("⚠  Không soát được tên cấm:", (e as Error).message)); // chỉ cảnh báo: lỗi ở đây không được chặn khởi động
  }
  /** Chờ các truy vấn đang chạy xong rồi đóng mọi kết nối của pool. */
  async close() { await this.pool.end(); }
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
  /** Cảnh báo (không đổi dữ liệu) tài khoản đã tồn tại trùng tên cấm (RESERVED_NAMES, #818). Tin hệ thống mang cờ `sys` nên không còn giả được
   *  (#827), nhưng tên vẫn gây nhầm khi nhìn: đổi tay bằng UPDATE accounts SET name='…', name_key=NULL WHERE id=… (khởi động sau tự điền name_key). */
  async warnReservedNames() {
    const r = await this.pool.query("SELECT id, name FROM accounts ORDER BY id");
    for (const a of r.rows) if (isReservedName(a.name))
      console.warn(`⚠  Tài khoản #${a.id} "${a.name}" trùng tên cấm (tạo trước khi có danh sách tên cấm). Giữ nguyên dữ liệu; nên đổi tên bằng UPDATE accounts SET name='…', name_key=NULL WHERE id=${a.id}.`);
  }
  async login(name: string, password: string, create = true) {
    const key = nameKey(name);
    const find = async () => (await this.pool.query("SELECT id, pass_hash FROM accounts WHERE name_key=$1", [key])).rows[0];
    let acc = await find(), created = false;
    if (!acc && !create) return { error: "Chưa có tài khoản.", noCreate: true as const };
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
    await this.openSession(token, id);
    return { token, accountId: id, created };
  }
  async accountByIdentity(provider: string, subject: string) {
    const r = await this.pool.query("SELECT account_id FROM account_identities WHERE provider=$1 AND subject=$2", [provider, subject]);
    return r.rowCount ? Number(r.rows[0].account_id) : null;
  }
  async startSession(accountId: number) {
    const token = newToken();
    await this.openSession(token, accountId);
    return token;
  }
  /** Thêm phiên rồi xóa phiên quá hạn và phiên vượt SESSION_KEEP (giữ mới nhất) của chính tài khoản đó, một câu lệnh (chỉ mục sessions_account_idx). */
  async openSession(token: string, accountId: number) {
    await this.pool.query("INSERT INTO sessions(token, account_id) VALUES ($1,$2)", [token, accountId]);
    await this.pool.query(
      `DELETE FROM sessions WHERE account_id=$1 AND (created_at < now() - make_interval(days => $2) OR token NOT IN
         (SELECT token FROM sessions WHERE account_id=$1 ORDER BY created_at DESC, token LIMIT $3))`, [accountId, SESSION_DAYS, SESSION_KEEP]);
  }
  async endSession(token: unknown) {
    return tokenOk(token) && !!(await this.pool.query("DELETE FROM sessions WHERE token=$1", [token])).rowCount;
  }
  async pruneSessions() {
    const r = await this.pool.query(
      `DELETE FROM sessions WHERE token IN (SELECT token FROM sessions WHERE created_at < now() - make_interval(days => $1) LIMIT $2)`,
      [SESSION_DAYS, SESSION_SWEEP_LIMIT]);
    return r.rowCount ?? 0;
  }
  async createIdentityAccount(name: string, provider: string, subject: string) {
    const hash = await hashPass(randomBytes(24).toString("base64url"));
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      const ins = await db.query("INSERT INTO accounts(name, name_key, pass_hash) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id", [name, nameKey(name), hash]);
      if (!ins.rowCount) { await db.query("ROLLBACK"); return { error: "taken" as const }; }
      const id = Number(ins.rows[0].id);
      const idn = await db.query("INSERT INTO account_identities(provider, subject, account_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [provider, subject, id]);
      if (!idn.rowCount) { await db.query("ROLLBACK"); return { error: "linked" as const }; }
      await db.query("COMMIT");
      return { accountId: id };
    } catch (e) { await db.query("ROLLBACK").catch(() => {}); throw e; } finally { db.release(); }
  }
  async linkIdentity(accountId: number, provider: string, subject: string) {
    try {
      const r = await this.pool.query("INSERT INTO account_identities(provider, subject, account_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING", [provider, subject, accountId]);
      if (r.rowCount) return "ok" as const;
    } catch (e) { if ((e as { code?: string }).code !== "23505") throw e; }
    // Không chèn được: định danh đã có chủ, hoặc tài khoản đã có định danh cùng nhà cung cấp (UNIQUE account_id, provider).
    const owner = await this.accountByIdentity(provider, subject);
    if (owner === accountId) return "ok" as const;
    return owner === null ? "has-provider" as const : "subject-taken" as const;
  }
  async hasIdentity(accountId: number, provider: string) {
    return !!(await this.pool.query("SELECT 1 FROM account_identities WHERE account_id=$1 AND provider=$2", [accountId, provider])).rowCount;
  }
  async accountFromToken(token: unknown) {
    if (!tokenOk(token)) return null;
    const r = await this.pool.query(
      "SELECT a.id, a.name FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token=$1 AND s.created_at > now() - make_interval(days => $2)", [token, SESSION_DAYS]);
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
  async getLooks(accountId: number): Promise<AccountLooks> {
    const r = await this.pool.query("SELECT sex, hair, hair_col, outfit_col, skin, looks_lpc, looks_chosen, looks_changes FROM accounts WHERE id=$1", [accountId]);
    const x = r.rows[0];
    // Giá trị ngoài khoảng (sửa tay trong DB, hoặc bảng màu bị rút bớt) thì về mặc định thay vì gửi chỉ số hỏng cho client.
    // Cột looks_lpc có chuỗi thì là chế độ Tự tạo (decodeLpc kiểm lại theo danh mục; hỏng thì cũng về mặc định).
    let l = x ? parseLooks(x.looks_lpc ? { mode: "lpc", lpc: decodeLpc(x.looks_lpc) }
      : { sex: x.sex, hair: x.hair, hairCol: x.hair_col, outfitCol: x.outfit_col, skin: x.skin }) : null;
    // HL2 #571: tài khoản preset cũ (đã chọn ngoại hình, looks_lpc rỗng) chuyển lười sang LPC. Chuỗi looks_lpc khác rỗng mà hỏng (bản cũ hơn
    // đọc dữ liệu của bản mới, món bị gỡ) thì KHÔNG đụng vào: chỉ hiển thị mặc định, dữ liệu còn nguyên. Ghi có điều kiện looks_lpc vẫn rỗng
    // (nhiều tiến trình cùng nạp thì cùng ra một kết quả vì hàm thuần; ai ghi trước thắng, cái sau đọc lại). Không đụng looks_changes,
    // giữ nguyên năm cột preset cũ (chỉ looks_lpc quyết định chế độ). Đưa thẳng năm cột thô: số ngoài khoảng được xử lý từng trường.
    if (x?.looks_chosen && !x.looks_lpc) {
      const lpc = presetToLpc({ sex: x.sex, hair: x.hair, hairCol: x.hair_col, outfitCol: x.outfit_col, skin: x.skin });
      const w = await this.pool.query("UPDATE accounts SET looks_lpc=$2 WHERE id=$1 AND looks_chosen AND looks_lpc=''", [accountId, encodeLpc(lpc)]);
      if (!w.rowCount) return this.getLooks(accountId);
      l = parseLooks({ mode: "lpc", lpc });
    }
    return { ...(l ?? DEFAULT_LOOKS), chosen: !!x?.looks_chosen, changes: Number(x?.looks_changes ?? 0) };
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
      if (bag?.tongPts?.length) rankBoardClear(); // sau COMMIT: bảng tông đọc được điểm mới (#738)
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
      if (bag?.tongPts?.length) rankBoardClear(); // sau COMMIT: bảng tông đọc được điểm mới (#738)
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  itemRow(x: any): Item {
    return { id: x.id, kind: x.kind, code: x.code, qty: x.qty, years: x.years, stars: x.stars, enhance: x.enhance, stats: x.stats ?? null,
      vohonId: x.vohon_id === null ? null : Number(x.vohon_id), created: new Date(x.created_at).getTime(), ...(x.locked ? { locked: true } : {}),
      ...(x.equip_slot === null || x.equip_slot === undefined ? {} : { equipSlot: Number(x.equip_slot) }) };
  }
  /** Thêm hoặc sửa các ô `items` (chỉ ô của chính tài khoản; id thuộc tài khoản khác thì ném lỗi). Gọi trong transaction. */
  async upsertItems(db: pg.PoolClient, accountId: number, items: Item[]) {
    if (!items.length) return;
    const rows = JSON.stringify(items.map((i) => ({ id: i.id, kind: i.kind, code: i.code, qty: i.qty, years: i.years, stars: i.stars,
      enhance: i.enhance, stats: i.stats ?? null, vohon_id: i.vohonId, created: new Date(i.created).toISOString(), locked: !!i.locked, equip_slot: i.equipSlot ?? null })));
    await db.query(
      `INSERT INTO items(id, account_id, kind, code, qty, years, stars, enhance, stats, vohon_id, created_at, locked, equip_slot)
       SELECT x.id, $1, x.kind, x.code, x.qty, x.years, x.stars, x.enhance, x.stats, x.vohon_id, x.created, x.locked, x.equip_slot
       FROM jsonb_to_recordset($2::jsonb) AS x(id uuid, kind text, code text, qty int, years int, stars smallint, enhance smallint,
         stats jsonb, vohon_id bigint, created timestamptz, locked boolean, equip_slot smallint)
       ON CONFLICT (id) DO UPDATE SET kind=EXCLUDED.kind, code=EXCLUDED.code, qty=EXCLUDED.qty, years=EXCLUDED.years, stars=EXCLUDED.stars,
         -- ver (027): tăng khi cấp cường hóa, chỉ số hoặc ô mặc của món đổi.
         ver=CASE WHEN items.enhance IS DISTINCT FROM EXCLUDED.enhance OR items.stats IS DISTINCT FROM EXCLUDED.stats
           OR items.equip_slot IS DISTINCT FROM EXCLUDED.equip_slot THEN items.ver + 1 ELSE items.ver END,
         enhance=EXCLUDED.enhance, stats=EXCLUDED.stats, vohon_id=EXCLUDED.vohon_id, locked=EXCLUDED.locked, equip_slot=EXCLUDED.equip_slot,
         -- Thứ tự ô (#215 "Sắp xếp" đặt lại created); cùng mili giây thì giữ giá trị cũ (Item.created chỉ có mili giây).
         created_at=CASE WHEN date_trunc('milliseconds', items.created_at) = EXCLUDED.created_at THEN items.created_at ELSE EXCLUDED.created_at END
       WHERE items.account_id = EXCLUDED.account_id
         -- #737: món không đổi thì không tạo phiên bản dòng mới (WAL, dead tuple, autovacuum). Cột so sánh = đúng các cột SET ở trên.
         AND (items.kind IS DISTINCT FROM EXCLUDED.kind OR items.code IS DISTINCT FROM EXCLUDED.code OR items.qty IS DISTINCT FROM EXCLUDED.qty
           OR items.years IS DISTINCT FROM EXCLUDED.years OR items.stars IS DISTINCT FROM EXCLUDED.stars OR items.enhance IS DISTINCT FROM EXCLUDED.enhance
           OR items.stats IS DISTINCT FROM EXCLUDED.stats OR items.vohon_id IS DISTINCT FROM EXCLUDED.vohon_id OR items.locked IS DISTINCT FROM EXCLUDED.locked
           OR items.equip_slot IS DISTINCT FROM EXCLUDED.equip_slot
           OR date_trunc('milliseconds', items.created_at) <> EXCLUDED.created_at)`, [accountId, rows]);
    // Dòng không đổi không được trả về, nên rowCount không còn bằng số món: kiểm riêng id thuộc tài khoản khác (khóa chính, rẻ).
    const other = await db.query("SELECT 1 FROM items WHERE id = ANY($2::uuid[]) AND account_id <> $1 LIMIT 1", [accountId, items.map((i) => i.id)]);
    if (other.rowCount) throw new Error("Id món đồ thuộc tài khoản khác.");
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
    if (bag.lock?.length) { // E3: khóa dòng món theo id tăng dần (sau dòng tài khoản), cấp lưu lệch cấp phòng dựa vào thì hủy cả transaction
      const ids = bag.lock.map((l) => l.id).sort(), r = await db.query("SELECT id, enhance FROM items WHERE account_id=$1 AND id = ANY($2::uuid[]) ORDER BY id FOR UPDATE", [accountId, ids]);
      for (const x of r.rows) if (Number(x.enhance) !== bag.lock.find((l) => l.id === x.id)!.enhance) throw new Error(`Món ${x.id} đã đổi cấp ở nơi khác.`);
    }
    await db.query("DELETE FROM items WHERE account_id=$1 AND NOT (id = ANY($2::uuid[]))", [accountId, bag.items.map((i) => i.id)]);
    // Trang bị (027): món đổi ô / tháo ra thì nhả ô trước, để chỉ mục duy nhất (account_id, equip_slot) không vướng khi hai món đổi chỗ trong một câu upsert.
    await db.query(`UPDATE items i SET equip_slot=NULL WHERE i.account_id=$1 AND i.equip_slot IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM jsonb_to_recordset($2::jsonb) AS x(id uuid, s smallint) WHERE x.id=i.id AND x.s=i.equip_slot)`,
      [accountId, JSON.stringify(bag.items.filter((i) => i.equipSlot !== undefined).map((i) => ({ id: i.id, s: i.equipSlot })))]);
    await this.upsertItems(db, accountId, bag.items);
    for (const t of bag.tongPts ?? []) await this.addTongPointsTx(db, accountId, t.week, t.tong, t.n);
    if (bag.quests?.length) {
      await db.query(
        `INSERT INTO quests(account_id, chain, step, accepted, prog)
         SELECT $1, x.chain, x.step, x.accepted, x.prog FROM jsonb_to_recordset($2::jsonb) AS x(chain text, step smallint, accepted boolean, prog jsonb)
         ON CONFLICT (account_id, chain) DO UPDATE SET step=EXCLUDED.step, accepted=EXCLUDED.accepted, prog=EXCLUDED.prog, updated_at=now()`,
        [accountId, JSON.stringify(bag.quests.map((q) => ({ chain: q.chain, step: q.step, accepted: q.accepted, prog: q.prog })))]);
      // Khảo hạch hằng ngày (mã `daily:<yyyymmdd>:<i>`): chỉ giữ dòng của bộ bài đang ghi, bài các ngày đã qua xóa đi.
      const daily = bag.quests.filter((q) => isDaily(q.chain)).map((q) => q.chain);
      if (daily.length) await db.query("DELETE FROM quests WHERE account_id=$1 AND chain LIKE 'daily:%' AND NOT (chain = ANY($2::text[]))", [accountId, daily]);
      // Tông vụ (#197, mã `tong:<yyyymmdd>:<i>`): như khảo hạch, chỉ giữ dòng của bộ bài đang ghi.
      const tong = bag.quests.filter((q) => isTongTask(q.chain)).map((q) => q.chain);
      if (tong.length) await db.query("DELETE FROM quests WHERE account_id=$1 AND chain LIKE 'tong:%' AND NOT (chain = ANY($2::text[]))", [accountId, tong]);
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
      if (bag?.tongPts?.length) rankBoardClear(); // sau COMMIT: bảng tông đọc được điểm mới (#738)
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
      if (bag?.tongPts?.length) rankBoardClear(); // sau COMMIT: bảng tông đọc được điểm mới (#738)
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
      if (bag?.tongPts?.length) rankBoardClear(); // sau COMMIT: bảng tông đọc được điểm mới (#738)
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
  async getFog(accountId: number, mapId: string, file: string) {
    const r = await this.pool.query("SELECT map_file, cells FROM map_fog WHERE account_id=$1 AND map_id=$2", [accountId, mapId]);
    const x = r.rows[0];
    return x && x.map_file === file ? new Uint8Array(x.cells as Buffer) : null;
  }
  async saveFog(accountId: number, mapId: string, file: string, cells: Uint8Array) {
    await this.pool.query(
      `INSERT INTO map_fog (account_id, map_id, map_file, cells) VALUES ($1,$2,$3,$4)
       ON CONFLICT (account_id, map_id) DO UPDATE SET map_file=EXCLUDED.map_file, cells=EXCLUDED.cells, updated_at=now()`,
      [accountId, mapId, file, Buffer.from(cells)]);
  }
  async getTong(accountId: number) {
    const r = await this.pool.query("SELECT tong, tong_at FROM accounts WHERE id=$1", [accountId]);
    const x = r.rows[0];
    return { tong: x?.tong ?? null, at: x?.tong_at == null ? null : Number(x.tong_at) };
  }
  async setTong(accountId: number, tong: string | null, at: number | null, week?: number) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      await db.query("UPDATE accounts SET tong=$2, tong_at=COALESCE($3, tong_at) WHERE id=$1", [accountId, tong, at]);
      if (week !== undefined) await db.query("DELETE FROM tong_points WHERE account_id=$1 AND week=$2", [accountId, week]);
      await db.query("COMMIT");
      rankBoardClear();
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async findAccount(name: string) {
    const r = await this.pool.query(
      "SELECT a.id, a.name FROM accounts a WHERE a.name_key=$1 AND EXISTS (SELECT 1 FROM vohons v WHERE v.account_id=a.id)", [nameKey(name)]);
    return r.rowCount ? { id: Number(r.rows[0].id), name: String(r.rows[0].name) } : null;
  }
  async getSocial(accountId: number): Promise<SocialRow> {
    const [f, b, fans] = await Promise.all([
      this.pool.query("SELECT f.friend_id AS id, a.name FROM friends f JOIN accounts a ON a.id=f.friend_id WHERE f.account_id=$1 ORDER BY f.created_at, f.friend_id", [accountId]),
      this.pool.query("SELECT b.blocked_id AS id, a.name FROM blocks b JOIN accounts a ON a.id=b.blocked_id WHERE b.account_id=$1 ORDER BY b.created_at, b.blocked_id", [accountId]),
      this.pool.query("SELECT account_id FROM friends WHERE friend_id=$1", [accountId]),
    ]);
    const peers = (rows: { id: unknown; name: unknown }[]) => rows.map((x) => ({ id: Number(x.id), name: String(x.name) }));
    return { friends: peers(f.rows), blocks: peers(b.rows), fans: fans.rows.map((x) => Number(x.account_id)) };
  }
  async setFriend(accountId: number, other: number, on: boolean) {
    if (on) await this.pool.query("INSERT INTO friends (account_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [accountId, other]);
    else await this.pool.query("DELETE FROM friends WHERE account_id=$1 AND friend_id=$2", [accountId, other]);
  }
  async setBlock(accountId: number, other: number, on: boolean) {
    if (!on) { await this.pool.query("DELETE FROM blocks WHERE account_id=$1 AND blocked_id=$2", [accountId, other]); return; }
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      await db.query("INSERT INTO blocks (account_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [accountId, other]);
      await db.query("DELETE FROM friends WHERE account_id=$1 AND friend_id=$2", [accountId, other]);
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async tongPoints(accountId: number, week: number) {
    const r = await this.pool.query("SELECT tong, points FROM tong_points WHERE account_id=$1 AND week=$2 ORDER BY points DESC LIMIT 1", [accountId, week]);
    return r.rowCount ? { tong: r.rows[0].tong as string, points: Number(r.rows[0].points) } : null;
  }
  async addTongPoints(accountId: number, week: number, tong: string, n: number) { return this.addTongPointsTx(this.pool, accountId, week, tong, n); }
  async addTongPointsTx(db: pg.Pool | pg.PoolClient, accountId: number, week: number, tong: string, n: number) {
    const r = await db.query(
      `INSERT INTO tong_points(account_id, week, tong, points) VALUES ($1, $2, $3, $4)
       ON CONFLICT (account_id, week, tong) DO UPDATE SET points = tong_points.points + EXCLUDED.points RETURNING points`, [accountId, week, tong, n]);
    rankBoardClear();
    return Number(r.rows[0].points);
  }
  async tongBoard(week: number, min: number, topN: number): Promise<TongBoard> {
    return rankBoard(`tong|${week}|${min}|${topN}`, () => this.tongBoardQuery(week, min, topN));
  }
  private async tongBoardQuery(week: number, min: number, topN: number): Promise<TongBoard> {
    const [g, t] = await Promise.all([
      this.pool.query(
        `SELECT p.tong, COUNT(*) FILTER (WHERE p.points >= $2)::int AS active, COALESCE(AVG(p.points) FILTER (WHERE p.points >= $2), 0)::float8 AS avg
         FROM tong_points p JOIN accounts a ON a.id = p.account_id WHERE p.week=$1 AND NOT a.is_test GROUP BY p.tong`, [week, min]),
      this.pool.query(
        `SELECT x.tong, a.name, x.points FROM (
           SELECT p.tong, p.account_id, p.points, ROW_NUMBER() OVER (PARTITION BY p.tong ORDER BY p.points DESC, p.account_id) AS r
           FROM tong_points p JOIN accounts t ON t.id = p.account_id WHERE p.week=$1 AND p.points > 0 AND NOT t.is_test) x
         JOIN accounts a ON a.id = x.account_id WHERE x.r <= $2 ORDER BY x.tong, x.points DESC, x.account_id`, [week, topN]),
    ]);
    const top: TongBoard["top"] = {};
    for (const x of t.rows) (top[x.tong] ??= []).push({ name: x.name, points: Number(x.points) });
    return { tongs: g.rows.map((x) => ({ tong: x.tong as string, active: Number(x.active), avg: Number(x.avg) })), top };
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
      if (bag?.tongPts?.length) rankBoardClear(); // sau COMMIT: bảng tông đọc được điểm mới (#738)
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
  async claimBoss(accountId: number, day: string, kind: string, limit: number, bag: Bag, add = 1) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      // Tăng lượt chỉ khi không vượt giới hạn: hai lần nhận cùng lúc không thể cùng vượt (dòng bị khóa khi cập nhật).
      const r = await db.query(
        `INSERT INTO boss_claims(account_id, day, kind, n) VALUES ($1, $2::date, $3, $5::int)
         ON CONFLICT (account_id, day, kind) DO UPDATE SET n = boss_claims.n + $5::int, updated_at = now() WHERE boss_claims.n + $5::int <= $4
         RETURNING n`, [accountId, day, kind, limit, add]);
      if (!r.rowCount || Number(r.rows[0].n) > limit) { await db.query("ROLLBACK"); return null; }
      await this.writeBag(db, accountId, bag);
      await db.query("COMMIT");
      if (bag?.tongPts?.length) rankBoardClear(); // sau COMMIT: bảng tông đọc được điểm mới (#738)
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
  async saveArena(accountId: number, start: number, delta: ArenaRecord, reward?: { day: string; kind: string; limit: number; bag: Bag }, eloCap?: { day: string; limit: number }) {
    arenaOk(delta);
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      let eloCapped = false;
      if (eloCap && delta.elo > 0) {
        // Khóa dòng (account, day) tới hết transaction để hai trận kết thúc cùng lúc không cùng đọc "còn chỗ"; chỉ tăng phần còn lại dưới trần.
        const g = await db.query(
          `INSERT INTO arena_elo_day(account_id, day, gain) VALUES ($1, $2::date, 0)
           ON CONFLICT (account_id, day) DO UPDATE SET updated_at = now() RETURNING gain`, [accountId, eloCap.day]);
        const room = Math.max(0, eloCap.limit - Number(g.rows[0].gain)), add = Math.min(delta.elo, room);
        eloCapped = room <= 0;
        delta = { ...delta, elo: add };
        if (add > 0) await db.query("UPDATE arena_elo_day SET gain = gain + $3::int WHERE account_id=$1 AND day=$2::date", [accountId, eloCap.day, add]);
      }
      const a = await db.query(
        `INSERT INTO arena_ratings(account_id, elo, wins, losses, draws)
         VALUES ($1, GREATEST(0, $2::int + $3::int), GREATEST(0, $4::int), GREATEST(0, $5::int), GREATEST(0, $6::int))
         ON CONFLICT (account_id) DO UPDATE SET elo = GREATEST(0, arena_ratings.elo + $3::int), wins = GREATEST(0, arena_ratings.wins + $4::int),
           losses = GREATEST(0, arena_ratings.losses + $5::int), draws = GREATEST(0, arena_ratings.draws + $6::int), updated_at = now()
         RETURNING elo, wins, losses, draws`,
        [accountId, start, delta.elo, delta.wins, delta.losses, delta.draws]);
      let paid = false;
      if (reward && !eloCapped) {
        // Như claimBoss: tăng lượt chỉ khi còn dưới giới hạn; đủ lượt thì chỉ ghi Elo.
        const r = await db.query(
          `INSERT INTO boss_claims(account_id, day, kind, n) VALUES ($1, $2::date, $3, 1)
           ON CONFLICT (account_id, day, kind) DO UPDATE SET n = boss_claims.n + 1, updated_at = now() WHERE boss_claims.n < $4
           RETURNING n`, [accountId, reward.day, reward.kind, reward.limit]);
        if (r.rowCount && Number(r.rows[0].n) <= reward.limit) { await this.writeBag(db, accountId, reward.bag); paid = true; }
      }
      await db.query("COMMIT");
      rankBoardClear();
      return { rec: arenaRow(a.rows[0]), paid, eloCapped };
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async arenaTop(n: number, accountId: number) {
    // Danh sách đầu bảng dùng chung (cache); `me` tính riêng: lấy dòng của mình rồi đếm số người đứng trước (khoá chỉ mục arena_ratings_rank).
    const [list, me] = await Promise.all([
      rankBoard(`arena|${n}`, async () => (await this.pool.query(
        `SELECT r.account_id, a.name, r.elo, r.wins, r.losses, r.draws FROM arena_ratings r JOIN accounts a ON a.id=r.account_id WHERE NOT a.is_test
         ORDER BY r.elo DESC, r.wins DESC, r.updated_at, r.account_id LIMIT $1`, [n])).rows),
      this.pool.query(
        `SELECT m.elo, m.wins, m.losses, m.draws, 1 + (SELECT COUNT(*) FROM arena_ratings r JOIN accounts a ON a.id=r.account_id
           WHERE NOT a.is_test AND (r.elo > m.elo OR (r.elo = m.elo AND (r.wins > m.wins OR (r.wins = m.wins AND
             (r.updated_at < m.updated_at OR (r.updated_at = m.updated_at AND r.account_id < m.account_id))))))) AS rank
         FROM arena_ratings m JOIN accounts t ON t.id=m.account_id WHERE m.account_id=$1 AND NOT t.is_test`, [accountId]),
    ]);
    return { list: list.map((x: any) => ({ accountId: Number(x.account_id), name: x.name as string, ...arenaRow(x) })),
      me: me.rowCount ? { ...arenaRow(me.rows[0]), rank: Number(me.rows[0].rank) } : null };
  }
  async resonanceTop(page: number, pageSize: number, accountId: number) {
    const all = await resonanceRanking(() => this.resonanceAll());
    return resonancePage(all, page, pageSize, accountId);
  }
  private async resonanceAll(): Promise<ResonanceTopEntry[]> {
    const [accounts, vohons, items] = await Promise.all([
      this.pool.query("SELECT id, name FROM accounts WHERE NOT is_test ORDER BY id"),
      this.pool.query("SELECT account_id, level, COALESCE(cardinality(rings), 0) AS rings, stars FROM vohons"),
      this.pool.query("SELECT account_id, code, enhance, stars FROM items WHERE vohon_id IS NOT NULL AND code = ANY($1::text[])", [[BONE_ITEM, CORE_ITEM]]),
    ]);
    const byVohon = new Map<number, { level: number; rings: number; stars: number }[]>(), byItem = new Map<number, { code: string; enhance: number; stars: number | null }[]>();
    for (const v of vohons.rows) {
      const id = Number(v.account_id), list = byVohon.get(id) ?? [];
      list.push({ level: Number(v.level), rings: Number(v.rings), stars: Number(v.stars ?? 1) }); byVohon.set(id, list);
    }
    for (const i of items.rows) {
      const id = Number(i.account_id), list = byItem.get(id) ?? [];
      list.push({ code: String(i.code), enhance: Number(i.enhance ?? 0), stars: i.stars == null ? null : Number(i.stars) }); byItem.set(id, list);
    }
    return accounts.rows.map((a) => {
      const worn = byItem.get(Number(a.id)) ?? [];
      return resonanceEntry(Number(a.id), String(a.name), byVohon.get(Number(a.id)) ?? [],
        worn.filter((i) => i.code === BONE_ITEM).map((i) => ({ enhance: i.enhance })),
        worn.filter((i) => i.code === CORE_ITEM).map((i) => ({ stars: i.stars ?? 1 })));
    }).filter((x): x is ResonanceTopEntry => !!x);
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
  async lookupAccount(name: string): Promise<AccountRef | null> {
    const r = await this.pool.query(
      `SELECT a.id, a.name, a.is_test, (SELECT max(created_at) FROM sessions WHERE account_id=a.id) AS last_login FROM accounts a WHERE a.name_key=$1`, [nameKey(name)]);
    const x = r.rows[0];
    return x ? { id: Number(x.id), name: x.name as string, isTest: !!x.is_test, lastLogin: x.last_login ? new Date(x.last_login).getTime() : null } : null;
  }
  async markTest(accountId: number) { await this.pool.query("UPDATE accounts SET is_test=true WHERE id=$1", [accountId]); }
  async isTestAccount(accountId: number) {
    const r = await this.pool.query("SELECT is_test FROM accounts WHERE id=$1", [accountId]);
    return !!r.rows[0]?.is_test;
  }
  async seedTestAccount(name: string, password: string | null, data: SeedData) {
    seedOk(data); bagOk({ honTe: data.honTe, slots: data.slots, items: seedItems(data.items, () => 1) });
    const key = nameKey(name), hash = password === null ? null : await hashPass(password);
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      const found = await db.query("SELECT id, is_test FROM accounts WHERE name_key=$1 FOR UPDATE", [key]);
      let id: number, created = false;
      if (found.rowCount) {
        if (!found.rows[0].is_test) throw new Error(`Tài khoản "${name}" không có cờ is_test: không ghi đè tài khoản thật.`);
        id = Number(found.rows[0].id);
      } else {
        if (hash === null) throw new Error(`Tài khoản "${name}" chưa có: cần mật khẩu để tạo.`);
        const ins = await db.query("INSERT INTO accounts(name, name_key, pass_hash, is_test) VALUES ($1,$2,$3,true) ON CONFLICT DO NOTHING RETURNING id", [name, key, hash]);
        if (!ins.rowCount) throw new Error(`Không tạo được tài khoản "${name}" (trùng tên vừa có người tạo?).`);
        id = Number(ins.rows[0].id); created = true;
      }
      // Xoá phần dựng lại được (không đụng Elo, bạn bè, chặn): đồ trước võ hồn vì items tham chiếu vohons.
      for (const t of ["items", "teams", "vohons", "quests", "waypoints", "boss_claims", "auto_hunt", "auto_offline", "tong_points", "map_fog"])
        await db.query(`DELETE FROM ${t} WHERE account_id=$1`, [id]);
      const rowOf = new Map<string, number>();
      for (const v of data.vohons) {
        const r = await db.query(
          "INSERT INTO vohons(account_id, vohon, level, xp, stars, rings, kills, skills, herbs) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) RETURNING id",
          [id, v.vohon, v.level, v.xp, v.stars, v.rings, v.kills, v.skills, JSON.stringify(parseHerbs(v.herbs))]);
        rowOf.set(v.vohon, Number(r.rows[0].id));
      }
      for (const [slot, code] of data.team.entries()) await db.query("INSERT INTO teams(account_id, slot, vohon_id) VALUES ($1,$2,$3)", [id, slot, rowOf.get(code)]);
      await db.query(
        `UPDATE accounts SET is_test=true, active_vohon=$2, map_id=$3, pos_x=NULL, pos_y=NULL, map_file=NULL, sex=$4, hair=$5, hair_col=$6, outfit_col=$7, skin=$8,
           looks_lpc='', looks_changes=0, looks_chosen=true, starter_items=$9, tong=NULL, tong_at=NULL, bag_slots=NULL, auto_sell=NULL, auto_sold=NULL WHERE id=$1`,
        [id, rowOf.get(data.active), data.mapId, data.looks.sex, data.looks.hair, data.looks.hairCol, data.looks.outfitCol, data.looks.skin, data.starter]);
      await this.writeBag(db, id, { honTe: data.honTe, slots: data.slots, items: seedItems(data.items, (c) => rowOf.get(c)!) });
      for (const wp of data.waypoints) await db.query("INSERT INTO waypoints(account_id, wp) VALUES ($1,$2) ON CONFLICT DO NOTHING", [id, wp]);
      await db.query("COMMIT");
      return { accountId: id, created };
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async removeTestAccount(name: string) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      const found = await db.query("SELECT id, is_test FROM accounts WHERE name_key=$1 FOR UPDATE", [nameKey(name)]);
      if (!found.rowCount) throw new Error(`Không có tài khoản "${name}".`);
      if (!found.rows[0].is_test) throw new Error(`Tài khoản "${name}" không có cờ is_test: không xoá tài khoản thật.`);
      const id = Number(found.rows[0].id), n: Record<string, number> = {};
      const where: Record<string, string> = { arena_pairs: "a=$1 OR b=$1", friends: "account_id=$1 OR friend_id=$1", blocks: "account_id=$1 OR blocked_id=$1", accounts: "id=$1" };
      for (const t of REMOVE_TABLES) n[t] = (await db.query(`DELETE FROM ${t} WHERE ${where[t] ?? "account_id=$1"}`, [id])).rowCount ?? 0;
      await db.query("COMMIT");
      return n;
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
  async chooseLooks(accountId: number, looks: Looks) {
    // Một lần duy nhất: điều kiện NOT looks_chosen làm hai yêu cầu cùng lúc chỉ một cái được ghi.
    const r = await this.pool.query(
      "UPDATE accounts SET sex=$2, hair=$3, hair_col=$4, outfit_col=$5, skin=$6, looks_lpc=$7, looks_chosen=true WHERE id=$1 AND NOT looks_chosen",
      [accountId, looks.sex, looks.hair, looks.hairCol, looks.outfitCol, looks.skin, looks.lpc ? encodeLpc(looks.lpc) : ""]);
    return (r.rowCount ?? 0) > 0;
  }
  async changeLooks(accountId: number, looks: Looks, expect: number, bag: Bag) {
    const db = await this.pool.connect();
    try {
      await db.query("BEGIN");
      // Điều kiện looks_changes = expect: hai yêu cầu cùng lúc chỉ một cái khớp (dòng bị khóa khi cập nhật), cái kia ROLLBACK, không trừ tiền.
      const r = await db.query(
        `UPDATE accounts SET sex=$2, hair=$3, hair_col=$4, outfit_col=$5, skin=$6, looks_lpc=$7, looks_changes=looks_changes+1
         WHERE id=$1 AND looks_chosen AND looks_changes=$8 RETURNING looks_changes`,
        [accountId, looks.sex, looks.hair, looks.hairCol, looks.outfitCol, looks.skin, looks.lpc ? encodeLpc(looks.lpc) : "", expect]);
      if (!r.rowCount) { await db.query("ROLLBACK"); return null; }
      await this.writeBag(db, accountId, bag);
      await db.query("COMMIT");
      if (bag?.tongPts?.length) rankBoardClear(); // sau COMMIT: bảng tông đọc được điểm mới (#738)
      return Number(r.rows[0].looks_changes);
    } catch (e) {
      await db.query("ROLLBACK").catch(() => {});
      throw e;
    } finally { db.release(); }
  }
}

/**
 * Hook test `savefail {n}` (#797, CHỈ GAME_TEST=1): số lần ghi kế tiếp của tài khoản bị ép lỗi, để bot kiểm nhánh hoàn lại khi lỗi DB
 * (equipLuck, equipEnhance, coreset, tongAction). Chỉ chặn ba đường ghi túi / tông: saveBag, setTong, saveProgress có kèm túi.
 * Lỗi ném TRƯỚC khi chạm DB nên không ghi gì (giống transaction rollback). Không GAME_TEST thì store trả về nguyên bản, không bọc.
 */
export const saveFailTest = new Map<number, { n: number; only: string }>();
/** `kind`: "bag" (saveBag, saveProgress có túi) hoặc "tong" (setTong); hook đặt `only` thì chỉ chặn đúng loại đó (tránh lần lưu định kỳ của túi ăn mất lượt ép lỗi của setTong). */
const failSave = (accountId: number, kind: "bag" | "tong") => {
  const f = saveFailTest.get(accountId); if (!f || f.n <= 0 || (f.only && f.only !== kind)) return;
  if (f.n === 1) saveFailTest.delete(accountId); else f.n--;
  throw new Error("hook test savefail: ép lần ghi DB lỗi (#797)");
};
const withSaveFail = (s: Store): Store => new Proxy(s, {
  get(t, k) {
    const f = Reflect.get(t, k, t);
    if (typeof f !== "function") return f;
    if (k === "saveBag") return async (accountId: number, ...a: unknown[]) => { failSave(accountId, "bag"); return f.call(t, accountId, ...a); };
    if (k === "setTong") return async (accountId: number, ...a: unknown[]) => { failSave(accountId, "tong"); return f.call(t, accountId, ...a); };
    if (k === "saveProgress") return async (accountId: number, ...a: unknown[]) => { if (a[5] !== undefined) failSave(accountId, "bag"); return f.call(t, accountId, ...a); };
    return f.bind(t);
  },
});
const baseStore: Store = process.env.DATABASE_URL ? new PgStore(process.env.DATABASE_URL) : new MemoryStore();
export const store: Store = process.env.GAME_TEST === "1" ? withSaveFail(baseStore) : baseStore;
