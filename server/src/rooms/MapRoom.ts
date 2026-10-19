// Phòng của một bản đồ (mapId): toàn bộ logic game chạy ở đây (server-authoritative).
// Mỗi bản đồ có thể có nhiều phòng (kênh); mọi phòng dùng chung một lớp, khác nhau ở dữ liệu bản đồ.
// Client chỉ gửi ý định (hướng di chuyển, bấm đánh...), server quyết định kết quả.
import { Room, Client, ServerError } from "colyseus";
import { randomUUID } from "node:crypto";
import { MapState, PlayerState, BeastState, DropState } from "./schema.ts";
import { TIERS, VOHON, xpNeed, atBottleneck, xpBlocked, MAX_LEVEL, calcStats, TICK_RATE, tierOfYears, vohonIndex,
  AWAKEN_GIFT, AWAKEN_CHOICES, TEAM_SIZE, SWITCH_CD, TEAM_COMBAT_SECS, REVIVE_SECS, RESPAWN_SECS, XP_SHARE_ACTIVE, XP_SHARE_BENCH,
  beastLevel, xpLevelScale, MAX_RINGS, parseTeam, BEASTS, beastIndex, MAPS, MAP_MOVED, DEFAULT_MAP, parseLooks, dir4, type Looks,
  TRAVEL_CAST, TRAVEL_LEAVE_SECS,
  TIEN_CO, TIEN_CO_MAX, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY, energyGain, tienCoDmgMult, TILE,
  itemDef, BAG_SLOTS, DAN_CD, STARTER_ITEMS, BEAST_COIN, formatHonTe, type ItemDef,
  MAX_YEARS, tierBand, rollYears, beastStats, formatYears, RING_ITEM, DROP_OWNER_SECS, DROP_TTL_SECS, PICKUP_RANGE,
  absorbSecs, absorbChance, SHARD_UNLOCK, SHARD_QTY, MAX_STARS, starCost, shardChance, shardCode,
  BONE_ITEM, BONE_SLOTS, boneChance, boneName, parseBone, boneBonus, boneSlotIndex,
  CORE_ITEM, CORE_SETS, coreChance, rollCore, rollCoreStats, parseCore, coreName, coreSetIndex, MAX_CORE_STARS, type CoreData,
  CORE_SLOTS, CORE_SET_2, CORE_SET_4, CORE_FX_RULE, coreSlotOf, coreBonus, coreFx, coreSetCounts, isCcStatus, ATTACK_CD, type CoreFx,
  BONE_ACTIVE_SLOTS, boneSkillOf, bonePassive, type BonePassive, type PassiveBuff,
  BONE_MAX_ENHANCE, BONE_FEED_MAX, boneXp, boneEnhancePreview, boneSkillMult,
  CORE_MAX_ENHANCE, CORE_FEED_MAX, coreXp, coreEnhancePreview, coreUpgradeSubs, coreStatText,
  STATUS, STATUS_IDS, STATUS_TICK, CC_TIER_MULT, BEAST_REGEN, BEAST_AGGRO_R, BEAST_WANDER, statusBit, BUFF_IDS, buffBit, skillPower, buffPower, PCT_HP_CAP,
  PROJ_SPEED, PHOENIX_FIELD_R, SLOW_CAP, PHONG_LOI, skillsOf, TIEN_CO_RIENG, bondsOf, type BondDef, type SkillDef, type StatusId, type StatusApply, type BuffId,
  beastSkillOf, teleHits, TELE_FIRST, PLAYER_STATUS, type BeastSkillDef, type Tele,
  teleZones, BOSSES, bossIndex, ELITE, ELITE_RAGE, bossHpMult, beastName, beastBuffBit, BEAST_BUFFS, type BeastBuffId,
  KING, KING_CHEST, BOSS_CLAIM_KING, kingActive, kingNext, kingShardPool, vnDay, chestCode, type BossDef,
  npcDef, NPC_RANGE, SHOP, SHOP_MAX_QTY, sellPrice, type NpcRole } from "../../../shared/data.ts";
import { loadMap, type GameMap, type Portal, type EliteSpot, type NpcSpot } from "../map.ts";
import { BOSS_TOPIC, ANNOUNCE_TOPIC, publishBoss, type BossEvent } from "../schedule.ts";
import { store, Character, type AccountLooks, type Location, type Item, type Bag } from "../db.ts";
import { chatCheck } from "../ratelimit.ts";

interface PData {
  accountId: number;
  owned: Character[];   // mọi võ hồn sở hữu (chỉ gửi cho chính chủ)
  team: number[];       // đội hình: rowId võ hồn theo ô (TEAM_SIZE ô, 0 = trống); chỉ gửi cho chính chủ
  ch: Character;        // võ hồn đang ra trận, là một phần tử của owned và luôn nằm trong team
  ringYears: number[];  // niên hạn thật của từng hồn hoàn (số năm); p.rings chỉ là bậc để hiển thị
  input: { x: number; y: number }; dir: { x: number; y: number };
  atk: number; speed: number; atkCd: number; inv: number; lastHit: number; deadT: number;
  // Hấp thụ hồn hoàn trong túi (từ 3.2) vào võ hồn `rowId` (từ 3.3 chọn được võ hồn bất kỳ đang ở bình cảnh), vòng thứ `slot`.
  absorbing: { itemId: string; rowId: number; slot: number; years: number; t: number; dur: number; fail: number } | null;
  testRoll: number | null; // hook test `roll` (chỉ khi GAME_TEST=1): cố định số ngẫu nhiên 0..1 cho lần quyết định hấp thụ
  testShard: { r: number; i: number } | null; // hook test `shard`: cố định số ngẫu nhiên rơi mảnh (0..1) và võ hồn được chọn (-1 = ngẫu nhiên)
  testBone: { r: number; s: number } | null;   // hook test `bone` (4.1): cố định số ngẫu nhiên rơi hồn cốt (0..1) và vị trí (-1 = ngẫu nhiên)
  // hook test `core` (5.1): cố định số ngẫu nhiên rơi hồn hạch (0..1), sao (0 = ngẫu nhiên trong khoảng) và bộ (-1 = ngẫu nhiên)
  testCore: { r: number; stars: number; set: number } | null;
  shardBusy: boolean;   // đang chờ DB mở võ hồn bằng mảnh (bước 3.4): chặn lần mở thứ hai cho tới khi xong
  mpF: number; hpF: number; // hpF: sinh lực của võ hồn ra trận
  benchHp: Map<number, number>; // sinh lực các võ hồn khác (rowId -> sinh lực; không có = đầy). Không lưu DB: vào lại thì hồi đầy
  down: Map<number, number>;    // võ hồn đã gục: rowId -> số giây ngoài trận còn lại trước khi hồi (REVIVE_SECS)
  dirty: Set<number>;           // võ hồn không ra trận có tiến độ chưa lưu (kinh nghiệm chia cho đội)
  squadKey: string; squadT: number; // tin riêng "squad": nội dung lần gửi trước, đếm giờ kiểm tra lại
  fight: number;        // số giây kể từ lần cuối đánh trúng hoặc bị đánh
  // Mọi lần ghi DB về người chơi này nối tiếp nhau trong một chuỗi (mục 6): tối đa một lần ghi đang chạy, commit đúng thứ tự.
  saving: Promise<void>;
  teamQueued: boolean;  // đã có một lần lưu đội hình đang chờ trong chuỗi (lần đó ghi bản mới nhất lúc chạy)
  tradeQueued: boolean; // đã có một lần lưu sau mua / bán ở thương nhân đang chờ trong chuỗi (6.1; lần đó chụp túi mới nhất lúc chạy)
  portalKey: string;    // hộp đi cổng đã gửi cho client ("" = không đứng ở cổng)
  travelCast: { portal: Portal; t: number } | null; // đang niệm đi qua cổng (TRAVEL_CAST giây, bị đánh thì hủy)
  travelling: boolean;  // cờ đang chuyển bản đồ (bước 2) hoặc client đã rời phòng: bỏ qua mọi hành động, lưu định kỳ bỏ qua người này
  travelled: boolean;   // transaction đi cổng đã commit: onLeave không ghi gì nữa
  energy: Map<number, number>;  // năng lượng tiên cơ từng võ hồn trong đội (rowId -> 0..TIEN_CO_MAX; không có = 0). Không lưu DB
  shield: number; shieldT: number; // khiên của hồn sư (tiên cơ phụ trợ) và số giây còn lại
  buffs: Map<BuffId, { t: number; v: number }>; // hiệu ứng có lợi của hồn sư (hồn kỹ phụ trợ): giây còn lại, độ lớn; đổi võ hồn vẫn còn
  lei: number; leiQueued: boolean; // Phong Lôi Chi Lực (PHONG_LOI, 2.5c) và cờ đã hẹn tung Lôi Động Minh Thiên. Không lưu DB
  lastSkill: { sk: SkillDef; row: number } | null; // hồn kỹ gần nhất của võ hồn không có Phục Chế (Xúc Xích sao chép, 2.5c)
  // Túi đồ (mục 5.7, bước 3.1): chỉ gửi riêng cho chính chủ qua tin "bag". Lưu cùng lần lưu định kỳ, khi rời phòng và khi đi cổng.
  bag: Item[];          // mọi ô (thứ tự hiển thị); món đang gắn vào võ hồn (vohonId) không chiếm ô túi
  honTe: number;        // Hồn Tệ (đồng)
  bagDirty: boolean;    // túi hoặc Hồn Tệ đổi từ lần lưu trước
  danCd: number;        // giây còn lại của hồi chiêu chung các đan (DAN_CD)
  starterNote: boolean; // vừa nhận vật phẩm khởi đầu: báo một lần khi client xin túi đồ
  // Trạng thái trên hồn sư (từ 3.5, PLAYER_STATUS): do chiêu báo trước của hồn thú gây; `src` là mã hồn thú. Không lưu DB.
  st: Map<StatusId, SInst>; dotT: number;
  // Lượt nhận rương thú vương hôm nay (BĐ5, bảng boss_claims; `day` theo giờ Việt Nam): nạp lúc vào phòng, DB là nguồn chính khi nhận.
  claims: { day: string; n: number };
  claimBusy: number;    // số lần nhận rương đang chờ DB: chặn mở / bỏ rương cho tới khi xong
  testChest: { bone: number; ur: number; i: number; n: number; s: number } | null; // hook test `chest`: cố định số ngẫu nhiên khi mở rương (−1 = ngẫu nhiên)
  // Kỹ năng bị động của hồn cốt thân / chân trên võ hồn ra trận (từ 4.3, bonePassive): tính lại trong recalc. Không lưu DB.
  passive: BonePassive;
  // Hồn hạch (từ 5.2): hiệu ứng bộ của võ hồn ra trận (coreFx, tính lại trong recalc), tỉ lệ / hệ số chí mạng (calcStats), số đòn
  // thường trúng liên tiếp và số giây từ đòn trước (bộ Hạo Thiên 4 món), giây còn lại của tăng tốc đánh (Linh Miêu 4 món), chờ
  // trước lần hồi hồn lực kế tiếp (Bá Vương Long 4 món). Không lưu DB.
  coreFx: CoreFx; crit: number; critMult: number; combo: number; comboT: number; haste: number; shockMpCd: number;
}
/** Một đòn đánh thường / một lần tung hồn kỹ: năng lượng tiên cơ chỉ tính một lần dù trúng nhiều hồn thú hay nhiều mũi đạn. */
interface Hit { kind: "attack" | "skill"; done: boolean; onHit?: () => void; } // onHit: gọi một lần khi trúng lần đầu (5.2, bộ Lam Ngân)
interface AuthData { accountId: number; ch: Character; owned: Character[]; team: number[]; looks: Looks; loc: Location; bag: Bag; starter: boolean;
  claims: { day: string; n: number }; }
/** Một trạng thái trên hồn thú: giây còn lại, số tầng, độ lớn mỗi tầng (sát thương mỗi giây hoặc tỉ lệ), người gây. */
interface SInst { t: number; n: number; v: number; src: string; }
interface BData {
  zone: number; hx: number; hy: number; tx: number; ty: number; wt: number; cd: number; kx: number; ky: number; target: string | null; hitBy: string | null; anim: number;
  st: Map<StatusId, SInst>; // trạng thái dùng chung (mục 5.1) đang có
  dotT: number;             // đếm giờ tới lần gây sát thương theo thời gian kế tiếp (STATUS_TICK)
  calm: number;             // số giây kể từ lần cuối bị đánh (hồi máu khi không có mục tiêu, BEAST_REGEN)
  regen: number;            // phần lẻ sinh lực hồi chưa cộng (sinh lực đồng bộ là số nguyên)
  dmg: number;              // sát thương đòn thường theo số năm (beastStats, bước 3.2)
  // Chiêu báo trước (bước 3.5): hồn thú thường từ 1.000 năm có 1 chiêu (beastSkillOf), tinh anh (BĐ4) có 2 (BOSSES). `cd` từng chiêu,
  // `skT`: chờ trước lần tung kế tiếp (mọi chiêu); `cast`: chiêu đang báo trước (các vùng đã khóa, còn `t` giây).
  skills: { def: BeastSkillDef; cd: number }[];
  skT: number;
  cast: { def: BeastSkillDef; teles: Tele[]; t: number; target: string } | null;
  buffs: Map<BeastBuffId, number>; // từ BĐ4: hiệu ứng có lợi của hồn thú (giây còn lại), ví dụ Cuồng nộ của tinh anh
  minions: Set<string>;     // hồn thú do chiêu gọi bầy (BeastSkillDef.summon) của con này gọi ra
  elite: EliteData | null;  // tinh anh (BĐ4); null với hồn thú thường
}
/**
 * Tinh anh (mục 5.4, BĐ4). `base`: máu tối đa khi 1 người (đã nhân ELITE.hp); `n`: số người đang áp vào máu (bossHpMult);
 * `parts`: người tham gia -> số giây liên tục ở ngoài bán kính ELITE.radius; `lonely`: số giây không còn người tham gia nào trong
 * bán kính; `dropT`: chờ trước lần giảm `n` kế tiếp; `dmgBy`: đóng góp (sát thương) để chia ưu tiên hồn hoàn; `rageCd`: chờ trước
 * lần Cuồng nộ kế tiếp.
 */
interface EliteData {
  base: number; n: number; engaged: boolean; parts: Map<string, number>; lonely: number; dropT: number;
  dmgBy: Map<string, number>; rageCd: number;
  king: KingData | null; // tà hóa thú vương (BĐ5): cùng bộ máy người tham gia / máu theo số người, bán kính là cả hang
}
/**
 * Tà hóa thú vương (mục 5.4, BĐ5). `slot`: khung giờ đã sinh ra nó; `life`: số giây còn lại trước khi rút đi (KING.lifeSecs);
 * `phase`: giai đoạn (2 khi máu còn KING.phaseHp); `roar`: giây còn lại của tiếng gầm chuyển giai đoạn (đứng yên, không nhận khống chế);
 * `spd`: hệ số tốc độ (BossDef.phase2.spd ở giai đoạn 2); `noted`: người đã được nhắc hết lượt nhận thưởng trong trận này;
 * `rankT`: chờ trước lần gửi bảng xếp hạng sát thương kế tiếp.
 */
interface KingData { def: BossDef; slot: number; life: number; phase: 1 | 2; roar: number; spd: number; noted: Set<string>; rankT: number; }
/** Mũi hồn kỹ đang bay của hồn sư `owner`: chạm hồn thú đầu tiên thì gọi `fire` (sát thương và trạng thái của hồn kỹ). */
interface Proj { x: number; y: number; vx: number; vy: number; life: number; owner: string; fire: (bid: string) => void; }
/** Tùy chọn của một lần gây sát thương lên hồn thú. `direct` = false: sát thương theo thời gian (không chí mạng, không đẩy lùi,
 *  không tính Phá giáp, không lan Cảm điện). `chain`: sát thương lan của Cảm điện (không chí mạng, không lan tiếp). */
interface DmgOpt { crit?: number; lifesteal?: number; direct?: boolean; chain?: boolean; }

let nextId = 1;
const uid = (p: string) => p + (nextId++).toString(36);

// ---------- Phiên giữ tài khoản (mục 6 "Mỗi tài khoản một phiên") ----------
/** Hash presence: accountId -> sessionId của phiên đang giữ tài khoản, từ onJoin tới khi lần ghi DB cuối của phiên đó xong. */
const HOLD = "accountHold";
/** Phiên mới chờ phiên cũ lưu xong tối đa bấy nhiêu mili giây; quá thì từ chối vào phòng (không nạp dữ liệu cũ). */
const HOLD_WAIT_MS = 8000;

// ---------- Thú vương theo bản đồ, mức tiến trình (mục 6; bước BĐ5) ----------
/**
 * Một "suất" thú vương của một khung giờ: mỗi kênh đang mở của bản đồ giữ tối đa một suất (`owner` = roomId, null = phòng giữ suất đã
 * bị hủy). `state`: còn sống / đã bị hạ / đã rút đi; `leaveAt`: lúc rút đi (ms).
 */
interface KingSeat { owner: string | null; state: "alive" | "down" | "gone"; leaveAt: number; }
/**
 * Thú vương theo bản đồ, sống lâu hơn phòng (Colyseus tự hủy phòng trống): mỗi khung giờ đã sinh (`slot`, hết lúc `until`) và các suất
 * của khung đó. Phòng mở lại trong cùng khung nhận lại suất không chủ thay vì sinh con mới, nên hạ thú vương rồi rời bản đồ cho phòng
 * hủy, quay lại cũng không có con mới. Khung hết hạn thì bỏ. Chạy nhiều tiến trình thì phải chuyển sang presence (Redis), như lịch.
 */
const kingSeats = new Map<string, Map<number, { slot: number; until: number; seats: KingSeat[] }>>();
/** Các khung còn hạn của bản đồ `mapId` (bỏ khung đã hết). */
function kingRecs(mapId: string, now: number) {
  let recs = kingSeats.get(mapId);
  if (!recs) { recs = new Map(); kingSeats.set(mapId, recs); }
  for (const [slot, r] of recs) if (r.until <= now) recs.delete(slot);
  return recs;
}
/**
 * Khung giờ thú vương đang diễn ra của bản đồ `mapId`: khung muộn nhất trong lịch (kingActive) và các khung đã sinh còn hạn (kể cả do
 * hook test).
 */
function kingSlotNow(mapId: string, now: number): { slot: number; until: number } | null {
  const active = kingActive(now), recs = kingRecs(mapId, now);
  let best = active === null ? null : recs.get(active) ?? { slot: active, until: active + KING.lifeSecs * 1000 };
  for (const r of recs.values()) if (!best || r.slot > best.slot) best = r;
  return best;
}
/**
 * Lấy suất thú vương cho phòng `roomId` trong khung `slot` của bản đồ `mapId`: suất không chủ trước (phòng cũ đã hủy), không còn thì
 * thêm suất mới còn sống tới `until`.
 */
function takeKingSeat(mapId: string, slot: number, until: number, roomId: string): KingSeat {
  const recs = kingRecs(mapId, Date.now());
  let rec = recs.get(slot);
  if (!rec) { rec = { slot, until, seats: [] }; recs.set(slot, rec); }
  let seat = rec.seats.find((s) => s.owner === null);
  if (!seat) { seat = { owner: null, state: "alive", leaveAt: until }; rec.seats.push(seat); }
  seat.owner = roomId;
  return seat;
}
/**
 * Báo trước thú vương gần nhất theo bản đồ (kênh "boss", `at` = giờ xuất hiện, ms): phòng mở ra trong lúc chờ (kể cả báo trước của
 * hook test) vẫn có đếm ngược. Xóa khi thú vương của bản đồ đó xuất hiện.
 */
const kingWarns = new Map<string, BossEvent & { at: number }>();

// ---------- Vật phẩm (mục 5.7) ----------
let itemClock = 0;
/**
 * Một ô mới chứa `qty` món `def` (id UUID do server sinh). `created` tăng dần để thứ tự ô giữ nguyên khi nạp lại từ DB.
 * `years`: số năm (hồn hoàn).
 */
function newItem(def: ItemDef, qty: number, years: number | null = null): Item {
  itemClock = Math.max(Date.now(), itemClock + 1);
  return { id: randomUUID(), kind: def.kind, code: def.id, qty, years, stars: null, enhance: 0, stats: null, vohonId: null, created: itemClock };
}
/** `qty` món mã `code` chia thành các ô đầy theo `stack` (ô cuối có thể chưa đầy). */
function itemStacks(code: string, qty: number): Item[] {
  const def = itemDef(code); if (!def) return [];
  const out: Item[] = [];
  for (let left = qty; left > 0; left -= def.stack) out.push(newItem(def, Math.min(left, def.stack)));
  return out;
}
/** Số ô túi đang dùng: món đang gắn vào võ hồn không tính. */
const bagUsed = (bag: Item[]) => bag.filter((i) => i.vohonId === null).length;

export class MapRoom extends Room<MapState> {
  maxClients = 60;
  state = new MapState();
  map!: GameMap;
  pdata = new Map<string, PData>();
  bdata = new Map<string, BData>();
  /** Hồn hạch đang nằm dưới đất (bước 5.1): id đồ rơi -> sao và chỉ số đã tung lúc rơi (DropState chỉ đồng bộ sao và bộ). */
  coreDrops = new Map<string, { stars: number; data: CoreData }>();
  projs: Proj[] = [];
  timers: { t: number; fn: () => void }[] = []; // việc hẹn giờ (các nhát của hồn kỹ liên hoàn), chạy trong tick
  spawnT = 0;
  saveT = 0;
  /** Ô tinh anh (object `elite` của bản đồ, BĐ4): hồn thú đang sống (`bid`), hoặc số giây còn lại trước khi hồi sinh (`t`). */
  elites: { spot: EliteSpot; bid: string | null; t: number }[] = [];
  /**
   * Thú vương của phòng (BĐ5): khung giờ đã lấy suất (không lấy lại trong cùng khung), hồn thú đang sống (null = đã hạ / rút đi) và
   * suất của bản đồ ở mức tiến trình (kingSeats: còn đúng khi phòng bị hủy rồi mở lại).
   */
  king: { slot: number; bid: string | null; seat: KingSeat } | null = null;
  /** Lần báo trước thú vương gần nhất trên kênh "boss" (mọi bản đồ): gửi lại cho người vào phòng trong lúc chờ, `at` = giờ xuất hiện (ms). */
  bossWarn: (BossEvent & { at: number }) | null = null;
  /** Hook test `day {shift}`: lệch ngày nhận thưởng (ngày) để thử đặt lại lượt lúc 00:00; luôn 0 khi không bật GAME_TEST. */
  dayShift = 0;
  /** Lịch boss trên presence (schedule.ts, mục 6): mọi phòng báo cho người chơi của mình; phòng của đúng bản đồ sinh thú vương. */
  bossSub = (ev: BossEvent) => this.onBossEvent(ev);
  /** Thông báo toàn server (presence "announce", mục 6): hiện như tin hệ thống trong chat. */
  announceSub = (m: { text: string }) => this.broadcast("chat", { name: "Hệ thống", text: String(m?.text ?? "") });
  /** Đá phiên trùng tài khoản ở mọi phòng (presence, mục 6). */
  kickSub = (m: { accountId: number; sessionId: string }) => {
    for (const other of this.clients) if (other.sessionId !== m.sessionId && (other.auth as AuthData)?.accountId === m.accountId) other.leave(4001);
  };

  /**
   * Đá phiên cũ của tài khoản (ở mọi phòng) và chờ nó nhả tài khoản, tức là lần ghi cuối của nó (onLeave nối vào chuỗi lưu) đã
   * xong, rồi mới cho onAuth nạp DB. Không chờ thì phiên mới nạp bản cũ, phiên cũ lưu sau, và lần lưu kế tiếp của phiên mới
   * ghi đè làm mất tiến độ (mục 6).
   */
  async waitOldSession(accountId: number, sessionId: string) {
    const key = String(accountId), old = await this.presence.hget(HOLD, key);
    if (!old) return;
    this.presence.publish("kick", { accountId, sessionId });
    for (let t = 0; t < HOLD_WAIT_MS; t += 50) {
      await new Promise((r) => setTimeout(r, 50));
      if ((await this.presence.hget(HOLD, key)) !== old) return;
    }
    throw new ServerError(503, "Phiên trước của tài khoản chưa lưu xong, hãy thử lại sau giây lát.");
  }

  /** Nhả tài khoản sau lần ghi cuối của phiên `sessionId` (chỉ khi phiên đó vẫn đang giữ). */
  async releaseAccount(accountId: number, sessionId: string) {
    const key = String(accountId);
    if ((await this.presence.hget(HOLD, key)) === sessionId) await this.presence.hdel(HOLD, key);
  }

  /** Đọc võ hồn ra trận, ngoại hình, vị trí; từ chối nếu chưa được vào phòng này. */
  async checkJoin(accountId: number) {
    const [ch, looks, loc] = await Promise.all([store.getCharacter(accountId), store.getLooks(accountId), store.getLocation(accountId)]);
    // Tạo nhân vật trước (tài khoản cũ cũng phải chọn một lần), rồi mới đến lễ thức tỉnh.
    if (!looks.chosen) throw new ServerError(403, "Chưa tạo nhân vật.");
    if (!ch) throw new ServerError(403, "Chưa thức tỉnh võ hồn.");
    // Chỉ vào được phòng của bản đồ đang lưu trong DB; sai thì client hỏi lại /api/me (trả mapId) rồi vào đúng phòng.
    if (loc.mapId !== this.state.mapId) throw new ServerError(409, `Sai bản đồ: hồn sư đang ở ${MAPS[loc.mapId].name}.`);
    return { ch, looks, loc };
  }

  async onAuth(client: Client, options: { token?: string }) {
    const acc = options?.token ? await store.accountFromToken(options.token) : null;
    if (!acc) throw new ServerError(401, "Phiên đăng nhập không hợp lệ.");
    // Kiểm tra trước khi đá phiên cũ: lần vào bị từ chối không được đá phiên đang chơi. Chờ xong thì đọc và kiểm tra lại
    // (phiên cũ có thể vừa đi cổng xong, đổi map_id).
    await this.checkJoin(acc.accountId);
    await this.waitOldSession(acc.accountId, client.sessionId);
    const [{ ch, looks, loc }, owned] = await Promise.all([this.checkJoin(acc.accountId), store.listVohons(acc.accountId)]);
    const auth: AuthData = { accountId: acc.accountId, ch: owned.find((v) => v.rowId === ch.rowId) ?? ch, owned, team: [], looks, loc,
      bag: { items: [], honTe: 0 }, starter: false, claims: { day: this.today(), n: 0 } };
    if (!owned.includes(auth.ch)) owned.push(auth.ch);
    // Đội hình (tài khoản cũ được tự xếp trong store). Bỏ ô trỏ tới võ hồn không còn sở hữu; võ hồn ra trận luôn nằm trong đội.
    const team = (await store.getTeam(acc.accountId)).map((r) => (owned.some((v) => v.rowId === r) ? r : 0));
    if (!team.includes(auth.ch.rowId)) {
      const first = owned.find((v) => team.includes(v.rowId));
      if (first) auth.ch = first; else team[0] = auth.ch.rowId;
    }
    auth.team = team;
    // Túi đồ nạp sau mọi bước kiểm tra; tài khoản chưa nhận vật phẩm khởi đầu thì nhận ngay trong lần nạp này (một lần, ghi DB).
    const loaded = await store.loadBag(acc.accountId, STARTER_ITEMS.flatMap((s) => itemStacks(s.code, s.qty)));
    auth.bag = loaded.bag; auth.starter = loaded.starter;
    // Lượt nhận rương thú vương hôm nay (BĐ5): để nhắc "hết lượt" khi vào giao chiến; lúc nhận thì DB kiểm tra lại.
    auth.claims.n = await store.bossClaims(acc.accountId, auth.claims.day, BOSS_CLAIM_KING);
    return auth;
  }

  onCreate(options: { mapId?: unknown }) {
    // Client gửi mapId lấy từ /api/me (bản đồ đang lưu); thiếu thì dùng bản đồ mặc định. onAuth đối chiếu với DB.
    const mapId = options?.mapId ?? DEFAULT_MAP;
    if (typeof mapId !== "string" || !Object.hasOwn(MAPS, mapId)) throw new ServerError(400, "Bản đồ không tồn tại.");
    this.map = loadMap(mapId);
    this.state.mapId = mapId;
    // Ghi mapId vào listing để filterBy(["mapId"]) ghép đúng phòng cả khi phòng được mở mà không có mapId trong tham số.
    this.listing.mapId = mapId;
    const { zones } = this.map;
    // Thành không có hồn thú (mục 5.3).
    if (this.map.kind !== "town") for (let z = 0; z < zones.length; z++) for (let i = 0; i < zones[z].count; i++) this.spawnBeast(z);
    // Mỗi vùng 1 tinh anh (mục 5.4): sinh ngay khi mở phòng, không báo (chưa có ai trong phòng).
    if (this.map.kind !== "town") { this.elites = this.map.elites.map((spot) => ({ spot, bid: null, t: 0 })); this.elites.forEach((_, i) => this.spawnElite(i, false)); }
    this.setSimulationInterval((ms) => this.tick(Math.min(ms, 100) / 1000), 1000 / TICK_RATE);
    this.presence.subscribe("kick", this.kickSub);
    this.presence.subscribe(BOSS_TOPIC, this.bossSub);
    this.presence.subscribe(ANNOUNCE_TOPIC, this.announceSub);
    // Phòng mở ra trong lúc khung giờ thú vương đang diễn ra (mục 6): nhận lại suất của phòng cũ đã hủy (đã hạ / rút đi thì không có
    // con mới; còn sống thì về với thời gian còn lại), không thì sinh con mới với thời gian còn lại của khung.
    const now = Date.now(), active = kingSlotNow(mapId, now);
    if (active) this.spawnKing(active.slot, (active.until - now) / 1000);
    // Phòng mở ra trong 5 phút chờ cũng có đếm ngược: báo trước đã phát (kể cả hook test), không có thì tính từ lịch (kingNext).
    const next = kingNext(now);
    this.bossWarn = kingWarns.get(mapId) ?? [...kingWarns.values()].at(-1) ?? null;
    if (this.bossWarn && this.bossWarn.at <= now) this.bossWarn = null;
    if (!this.bossWarn && next - now <= KING.warnSecs * 1000) {
      const m = MAPS[mapId].king ? MAPS[mapId] : Object.values(MAPS).filter((x) => x.king).at(-1);
      if (m?.king) this.bossWarn = { mapId: m.id, king: m.king, phase: "warn", slot: next, in: (next - now) / 1000, life: KING.lifeSecs, at: next };
    }

    this.onMessage("input", (c, m: { x: number; y: number }) => {
      const d = this.pdata.get(c.sessionId); if (!d || d.travelling) return;
      let x = Number(m?.x) || 0, y = Number(m?.y) || 0; const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
      d.input = { x, y };
    });
    this.onMessage("attack", (c) => this.attack(c.sessionId));
    this.onMessage("skill", (c, m: { i: number }) => this.skill(c, Number(m?.i)));
    this.onMessage("boneskill", (c, m: { i: number }) => this.boneSkill(c, Number(m?.i)));
    this.onMessage("absorb", (c, m: { itemId: unknown; vohonId: unknown }) => this.tryAbsorb(c, m?.itemId, m?.vohonId));
    this.onMessage("pickup", (c) => this.pickup(c.sessionId));
    this.onMessage("discard", (c, m: { id: unknown }) => this.discardItem(c.sessionId, m?.id));
    this.onMessage("vohons", (c) => this.sendVohons(c));
    this.onMessage("team", (c, m: { slots: unknown }) => this.setTeam(c, m?.slots));
    this.onMessage("switch", (c, m: { slot: number }) => this.switchSlot(c, Number(m?.slot)));
    this.onMessage("test", (c, m: unknown) => this.testHook(c, m));
    this.onMessage("travel", (c, m: { portal: string }) => this.travel(c, String(m?.portal ?? "")));
    this.onMessage("bag", (c) => this.sendBag(c.sessionId));
    this.onMessage("use", (c, m: { id: unknown }) => this.useItem(c.sessionId, m?.id));
    this.onMessage("open", (c, m: { id: unknown }) => this.openChest(c.sessionId, m?.id)); // mở rương thú vương (BĐ5)
    this.onMessage("unlock", (c, m: { vohon: unknown }) => this.unlockVohon(c.sessionId, m?.vohon));
    this.onMessage("starup", (c, m: { vohon: unknown }) => this.starUp(c.sessionId, m?.vohon));
    this.onMessage("equip", (c, m: { itemId: unknown; vohonId: unknown; slot: unknown }) => this.equipBone(c.sessionId, m?.itemId, m?.vohonId, m?.slot));
    this.onMessage("unequip", (c, m: { itemId: unknown }) => this.unequipBone(c.sessionId, m?.itemId));
    this.onMessage("equipcore", (c, m: { itemId: unknown; vohonId: unknown; slot: unknown }) => this.equipCore(c.sessionId, m?.itemId, m?.vohonId, m?.slot));
    this.onMessage("unequipcore", (c, m: { itemId: unknown }) => this.unequipCore(c.sessionId, m?.itemId));
    this.onMessage("enhance", (c, m: { targetId: unknown; materialIds: unknown }) => this.enhanceBone(c.sessionId, m?.targetId, m?.materialIds));
    this.onMessage("enhancecore", (c, m: { targetId: unknown; materialIds: unknown }) => this.enhanceCore(c.sessionId, m?.targetId, m?.materialIds));
    this.onMessage("talk", (c, m: { npc: unknown }) => this.talkNpc(c.sessionId, m?.npc)); // NPC (6.1)
    this.onMessage("buy", (c, m: { code: unknown; qty: unknown }) => this.buyItem(c.sessionId, m?.code, m?.qty));
    this.onMessage("sell", (c, m: { id: unknown; qty: unknown }) => this.sellItem(c.sessionId, m?.id, m?.qty));
    this.onMessage("chat", (c, m: { text: string }) => {
      // Chống spam (server/src/ratelimit.ts): tin vượt giới hạn bị bỏ, chỉ báo riêng cho người gửi.
      const p = this.state.players.get(c.sessionId); if (!p) return;
      const r = chatCheck((c.auth as AuthData)?.accountId ?? c.sessionId, m?.text);
      if (!r) return;
      if ("error" in r) return this.log(c.sessionId, r.error, "#ffb35c");
      this.broadcast("chat", { name: p.name, text: r.text });
    });
  }

  onJoin(client: Client, _o: unknown, auth: AuthData) {
    const { ch, owned, team, looks, loc, bag } = auth;
    // Một tài khoản chỉ được vào một lần: giữ tài khoản cho phiên này, đá phiên cũ ở mọi phòng (kể cả phòng này). onAuth đã
    // chờ phiên cũ lưu xong; lần đá này chặn hai lần vào gần như cùng lúc.
    this.presence.hset(HOLD, String(auth.accountId), client.sessionId)
      .catch((e) => console.error(`Không ghi được phiên giữ tài khoản #${auth.accountId}`, e));
    this.presence.publish("kick", { accountId: auth.accountId, sessionId: client.sessionId });
    const p = new PlayerState();
    p.name = ch.name; this.showVohon(p, ch);
    p.sex = looks.sex; p.hair = looks.hair; p.hairCol = looks.hairCol; p.outfitCol = looks.outfitCol;
    // Vị trí đã lưu; chưa có, kẹt trong ô chặn hoặc ngoài bản đồ thì về `spawn` (mục 6).
    const pos = loc.x !== null && loc.y !== null && this.map.standable(loc.x, loc.y) ? { x: loc.x, y: loc.y } : this.spawnPoint();
    p.x = pos.x; p.y = pos.y;
    const d: PData = { accountId: auth.accountId, owned, team, ch, ringYears: [...ch.rings], input: { x: 0, y: 0 }, dir: { x: 1, y: 0 },
      atk: 0, speed: 0, atkCd: 0, inv: 1.5, lastHit: 99, deadT: 0, absorbing: null, testRoll: null, testShard: null, testBone: null, testCore: null, shardBusy: false, mpF: 0, hpF: 0, fight: 99,
      benchHp: new Map(), down: new Map(), dirty: new Set(), squadKey: "", squadT: 0,
      saving: Promise.resolve(), teamQueued: false, tradeQueued: false, portalKey: "", travelCast: null, travelling: false, travelled: false,
      energy: new Map(), shield: 0, shieldT: 0, buffs: new Map(), lei: 0, leiQueued: false, lastSkill: null,
      bag: bag.items, honTe: bag.honTe, bagDirty: false, danCd: 0, starterNote: auth.starter, st: new Map(), dotT: 0,
      claims: auth.claims, claimBusy: 0, testChest: null, passive: { buff: {}, resist: {} },
      coreFx: {}, crit: 0, critMult: 1, combo: 0, comboT: 99, haste: 0, shockMpCd: 0 };
    this.pdata.set(client.sessionId, d);
    this.state.players.set(client.sessionId, p);
    this.recalc(client.sessionId, true);
    this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã tới ${MAPS[this.state.mapId].name}.` }, { except: client });
    // Thú vương (BĐ5): người vào giữa lúc chờ thì nhận đếm ngược còn lại; thú vương đang ở bản đồ này thì nhận thời gian trước khi rút đi.
    const w = this.bossWarn;
    if (w && w.at > Date.now()) client.send("boss", this.bossMsg(w, "warn", (w.at - Date.now()) / 1000));
    const kb = this.king?.bid ? this.state.beasts.get(this.king.bid) : undefined, kd = this.king?.bid ? this.bdata.get(this.king.bid)?.elite?.king : undefined;
    if (kb && kd) client.send("boss", { k: "here", name: beastName(2, kb.species), mapId: this.state.mapId, mapName: MAPS[this.state.mapId].name, life: kd.life,
      phase: kd.phase, title: kd.phase === 2 ? kd.def.phase2?.name : "" });
  }

  async onLeave(client: Client) {
    const id = client.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (p && d) {
      // Client đã đi: dừng mọi tiến độ ngay (hấp thụ dở bị hủy). Không dừng thì trong lúc chờ ghi DB, tick vẫn có thể hấp thụ
      // xong hay đạn còn bay hạ hồn thú, cộng vào nhân vật sau khi write() đã chụp dữ liệu, rồi mất khi pdata bị xóa.
      if (d.absorbing) { d.absorbing = null; p.absorb = 0; }
      this.freeze(id);
      // Nối vào chuỗi lưu: chờ mọi lần ghi trước (kể cả transaction đi cổng) rồi mới xét. Đã đi cổng thành công thì
      // không ghi gì nữa; transaction lỗi hoặc chưa đi cổng thì lưu như thường (có lớp chặn WHERE map_id).
      await this.chain(d, () => (d.travelled ? undefined : this.write(id)));
      if (!d.travelled) this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã rời ${MAPS[this.state.mapId].name}.` });
    }
    this.state.players.delete(id);
    this.pdata.delete(id);
    // Lần ghi cuối đã xong: phiên mới của tài khoản (đang chờ trong onAuth) được nạp DB.
    const accountId = d?.accountId ?? (client.auth as AuthData | undefined)?.accountId;
    if (accountId !== undefined) await this.releaseAccount(accountId, id);
  }

  async onDispose() {
    this.presence.unsubscribe("kick", this.kickSub);
    this.presence.unsubscribe(BOSS_TOPIC, this.bossSub);
    this.presence.unsubscribe(ANNOUNCE_TOPIC, this.announceSub);
    // Trả suất thú vương (BĐ5): phòng mở lại trong cùng khung giờ nhận lại đúng trạng thái (đã hạ / rút đi / còn sống tới lúc rút đi).
    const ks = this.king?.seat;
    if (ks?.owner === this.roomId) {
      const kd = this.king?.bid ? this.bdata.get(this.king.bid)?.elite?.king : undefined;
      if (ks.state === "alive" && kd) ks.leaveAt = Date.now() + kd.life * 1000;
      ks.owner = null;
    }
    await Promise.all([...this.pdata.entries()].map(async ([id, d]) => {
      await this.chain(d, () => (d.travelled ? undefined : this.write(id)));
      await this.releaseAccount(d.accountId, id);
    }));
  }

  // ---------- Nhân vật ----------
  spawnPoint() {
    const { spawn } = this.map;
    for (let k = 0; k < 30; k++) {
      const x = spawn.x + 8 + Math.random() * (spawn.w - 16), y = spawn.y + 8 + Math.random() * (spawn.h - 16);
      if (!this.map.hits(x, y, 5, 4)) return { x, y };
    }
    return { x: spawn.x + spawn.w / 2, y: spawn.y + spawn.h / 2 };
  }

  recalc(id: string, full: boolean) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    const cores = this.coresOn(d, d.ch.rowId);
    const s = calcStats(p.vh, p.level, [...p.rings], d.ch.stars, this.boneBonusOf(d, d.ch.rowId), coreBonus(cores));
    p.maxHp = s.maxHp; p.maxMp = s.maxMp; d.atk = s.atk; d.speed = s.speed; d.crit = s.crit; d.critMult = s.critMult;
    d.passive = bonePassive(this.bonesOn(d, d.ch.rowId)); // bị động hồn cốt (4.3) theo võ hồn ra trận
    d.coreFx = coreFx(cores); // hiệu ứng bộ hồn hạch (5.2) theo võ hồn ra trận
    p.xpNeed = xpBlocked(p.level, p.rings.length) ? 0 : xpNeed(p.level);
    if (full) { d.hpF = p.maxHp; d.mpF = p.maxMp; }
    d.hpF = Math.min(d.hpF, p.maxHp); d.mpF = Math.min(d.mpF, p.maxMp);
    p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
  }

  /** Hiện võ hồn `ch` lên trạng thái đồng bộ (người khác thấy võ hồn ra trận, cấp, hồn hoàn). */
  showVohon(p: PlayerState, ch: Character) {
    p.vh = Math.max(0, vohonIndex(ch.vohon)); p.level = ch.level; p.xp = ch.xp; p.kills = ch.kills;
    p.rings.clear(); ch.rings.forEach((y) => p.rings.push(tierOfYears(y)));
  }

  /** Chép tiến độ đang chơi vào võ hồn ra trận (d.ch). */
  syncCh(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    Object.assign(d.ch, { level: p.level, xp: p.xp, rings: [...d.ringYears], kills: p.kills });
  }

  /**
   * Nối một lần ghi DB vào chuỗi lưu của người chơi (mục 6 "Lưu của mỗi người chơi chạy nối tiếp"). Lỗi được ghi log và
   * không làm gãy chuỗi; promise trả về luôn resolve.
   */
  chain(d: PData, fn: () => unknown) {
    d.saving = d.saving.then(fn).then(() => {}, (e) => console.error(`Lưu dữ liệu tài khoản #${d.accountId} thất bại`, e));
    return d.saving;
  }

  /** Lưu định kỳ / sau sự kiện quan trọng: xếp vào chuỗi lưu, chụp dữ liệu lúc tới lượt. */
  save(id: string) {
    const d = this.pdata.get(id); if (!d) return Promise.resolve();
    return this.chain(d, () => this.write(id));
  }

  /** Chụp tiến độ chưa lưu: võ hồn ra trận và các võ hồn khác vừa nhận kinh nghiệm chia cho đội (xóa đánh dấu `dirty`). */
  unsaved(id: string) {
    const d = this.pdata.get(id)!;
    this.syncCh(id);
    d.dirty.delete(d.ch.rowId);
    const list = [d.ch, ...d.owned.filter((v) => d.dirty.has(v.rowId))].map((v) => ({ ...v, rings: [...v.rings] }));
    d.dirty.clear();
    return list;
  }

  /** Ảnh chụp túi đồ và Hồn Tệ chưa lưu (bỏ đánh dấu `bagDirty`); undefined nếu không đổi gì từ lần lưu trước. */
  unsavedBag(d: PData): Bag | undefined {
    return d.bagDirty ? this.bagSnapshot(d) : undefined;
  }
  /** Ảnh chụp cả túi đồ và Hồn Tệ (bỏ đánh dấu `bagDirty`), dù có đổi hay không. */
  bagSnapshot(d: PData): Bag {
    d.bagDirty = false;
    return { honTe: d.honTe, items: d.bag.map((i) => ({ ...i, stats: i.stats == null ? null : structuredClone(i.stats) })) };
  }

  /**
   * Ghi tiến độ võ hồn, vị trí và túi đồ (chỉ gọi trong chuỗi lưu). Vị trí có lớp chặn: chỉ ghi khi DB vẫn ở bản đồ của phòng này.
   * Ghi lỗi thì đánh dấu lại võ hồn không ra trận / túi đồ để lần sau ghi tiếp.
   */
  async write(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const list = this.unsaved(id), x = p.x, y = p.y, bag = this.unsavedBag(d);
    try {
      await Promise.all(list.map((v) => store.saveCharacter(v)
        .catch((e) => { if (v.rowId !== d.ch.rowId) d.dirty.add(v.rowId); throw e; })));
      await store.saveLocation(d.accountId, this.state.mapId, x, y);
      if (bag) await store.saveBag(d.accountId, bag);
    } catch (e) { if (bag) d.bagDirty = true; throw e; }
  }

  /** Sinh lực tối đa của một võ hồn sở hữu (dù đang ra trận hay không), kể cả hồn cốt (4.2) và hồn hạch (5.2) đang gắn. */
  maxHpOf(d: PData, v: Character) {
    return calcStats(Math.max(0, vohonIndex(v.vohon)), v.level, v.rings.map(tierOfYears), v.stars, this.boneBonusOf(d, v.rowId), this.coreBonusOf(d, v.rowId)).maxHp;
  }

  // ---------- Võ hồn sở hữu và đội hình ----------
  /** Danh sách võ hồn và đội hình chỉ gửi riêng cho chính chủ, không nằm trong state đồng bộ (mục 6). */
  sendVohons(c: Client) {
    const d = this.pdata.get(c.sessionId); if (!d) return;
    this.syncCh(c.sessionId);
    c.send("vohons", { active: d.ch.rowId, team: [...d.team],
      list: d.owned.map((v) => ({ rowId: v.rowId, vohon: v.vohon, level: v.level, xp: v.xp, stars: v.stars, rings: [...v.rings] })) });
    this.sendSquad(c.sessionId, true);
  }

  /**
   * Tin riêng "squad": sinh lực từng võ hồn trong đội, võ hồn đã gục và số giây còn lại trước khi hồi, năng lượng tiên cơ `en`,
   * có đang giao chiến không (đồng hồ hồi chỉ chạy ngoài trận). Chỉ gửi khi nội dung đổi (`force` thì gửi luôn); tick kiểm tra định kỳ.
   */
  sendSquad(id: string, force = false) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const list = d.team.flatMap((r) => {
      const v = d.owned.find((o) => o.rowId === r); if (!v) return [];
      const maxHp = v === d.ch ? p.maxHp : this.maxHpOf(d, v), down = d.down.get(r);
      const hp = v === d.ch ? p.hp : down !== undefined ? 0 : Math.ceil(Math.min(maxHp, d.benchHp.get(r) ?? maxHp));
      return [{ rowId: r, hp, maxHp, down: down !== undefined ? Math.max(1, Math.ceil(down)) : 0, en: Math.floor(d.energy.get(r) ?? 0) }];
    });
    const msg = { combat: d.fight < TEAM_COMBAT_SECS, list }, key = JSON.stringify(msg);
    if (!force && key === d.squadKey) return;
    d.squadKey = key;
    this.clients.getById(id)?.send("squad", msg);
  }

  /** Xếp đội hình (thay võ hồn khác vào đội, đổi chỗ, bỏ ra): chỉ khi ngoài giao chiến. Client gửi đủ TEAM_SIZE ô. */
  setTeam(c: Client, slots: unknown) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    // Từ chối thì gửi lại đội hình đang lưu để client bỏ thay đổi vừa làm.
    const deny = (text: string) => { this.log(id, text, "#ffb35c"); this.sendVohons(c); };
    const team = parseTeam(slots);
    if (!team) return deny("Đội hình không hợp lệ.");
    if (team.some((r) => r && !d.owned.some((v) => v.rowId === r))) return deny("Bạn không sở hữu võ hồn này.");
    if (team.every((r, i) => r === d.team[i])) return this.sendVohons(c);
    if (p.dead) return deny("Đã gục ngã, không thể đổi đội hình.");
    if (d.absorbing) return deny("Đang hấp thụ hồn hoàn, không thể đổi đội hình.");
    if (d.fight < TEAM_COMBAT_SECS) return deny(`Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới đổi đội hình được.`);
    // Võ hồn ra trận bị bỏ khỏi đội thì võ hồn chưa gục ở ô đầu tiên còn lại ra trận.
    const nextId = team.includes(d.ch.rowId) ? d.ch.rowId : team.find((r) => r > 0 && !d.down.has(r));
    if (!nextId) return deny("Đội phải còn ít nhất một võ hồn chưa gục.");
    d.team = team;
    for (const r of d.energy.keys()) if (!team.includes(r)) d.energy.delete(r); // rời đội thì mất năng lượng tiên cơ
    if (nextId !== d.ch.rowId) this.activate(id, d.owned.find((v) => v.rowId === nextId)!);
    this.persistTeam(d);
    this.sendVohons(c);
  }

  /** Đổi sang võ hồn ở ô `slot` của đội, được cả khi đang đánh (mục 5.1 "Trong trận"); mỗi lần đổi hồi SWITCH_CD giây. */
  switchSlot(c: Client, slot: number) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || d.travelling || !(Number.isInteger(slot) && slot >= 0 && slot < TEAM_SIZE)) return;
    const next = d.owned.find((v) => v.rowId === d.team[slot]);
    if (!next) return this.log(id, `Ô ${slot + 1} của đội đang trống. Nhấn V để xếp đội hình.`, "#ffb35c");
    if (next === d.ch) return;
    if (p.dead) return this.log(id, "Đã gục ngã, không thể đổi võ hồn.", "#ffb35c");
    if (d.absorbing) return this.log(id, "Đang hấp thụ hồn hoàn, không thể đổi võ hồn.", "#ffb35c");
    const down = d.down.get(next.rowId);
    if (down !== undefined) return this.log(id, `${VOHON[Math.max(0, vohonIndex(next.vohon))].name} đã gục: hồi lại sau ${Math.ceil(down)} giây ngoài trận hoặc khi về doanh trại.`, "#ffb35c");
    if (p.swCd > 0) return; // client hiện hồi chiêu đổi trên thanh đội hình
    this.activate(id, next);
    p.swCd = SWITCH_CD;
    // Bộ hồn hạch Lưu Ly 4 món (5.2): đổi tay võ hồn mang bộ vào thì cả đội tăng công (hiệu ứng có lợi của hồn sư) một lúc.
    const sa = d.coreFx.swapAtk;
    if (sa) {
      const cur = d.buffs.get("atk"), col = CORE_SETS[coreSetIndex("luu_ly")].col;
      d.buffs.set("atk", { t: Math.max(cur?.t ?? 0, CORE_FX_RULE.swapSecs), v: Math.max(cur?.v ?? 0, sa) });
      this.syncBuffs(p, d); this.broadcast("fx", { k: "buff", id, col });
      this.log(id, `Bộ Lưu Ly: cả đội tăng ${Math.round(sa * 100)}% công trong ${CORE_FX_RULE.swapSecs} giây.`, col);
    }
    // Đủ năng lượng thì tung chiêu tiên cơ ngay lúc xuất hiện (chỉ khi đổi tay; tự đổi lúc gục thì giữ năng lượng).
    // Vùng an toàn không giao chiến (mục 5.3): đổi vẫn được nhưng không tung, giữ năng lượng.
    if ((d.energy.get(next.rowId) ?? 0) >= TIEN_CO_MAX) {
      if (this.map.inSafe(p.x, p.y)) this.log(id, "Vùng an toàn: không tung tiên cơ.", "#ffb35c");
      else { d.energy.set(next.rowId, 0); this.tienCo(id); }
    }
    this.persistTeam(d);
    this.sendVohons(c);
  }

  /**
   * Cho võ hồn `next` (trong đội, chưa gục) ra trận: đổi chỉ số, hồn hoàn, phụ thể hiển thị; lưu tiến độ võ hồn vừa rút về.
   * Từ 2.3b mỗi võ hồn giữ sinh lực riêng. Hồn lực thuộc về hồn sư (thiết kế chưa tách theo võ hồn) nên vẫn giữ tỉ lệ như bước 2.2.
   * `text`: thông báo thay câu mặc định.
   */
  activate(id: string, next: Character, text?: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    this.syncCh(id);
    const prev = d.ch, mpR = d.mpF / Math.max(1, p.maxMp);
    if (d.down.has(prev.rowId)) d.benchHp.delete(prev.rowId); else d.benchHp.set(prev.rowId, d.hpF);
    d.ch = next; d.ringYears = [...next.rings]; d.dirty.delete(next.rowId);
    this.showVohon(p, next);
    this.recalc(id, false);
    d.hpF = Math.min(p.maxHp, d.benchHp.get(next.rowId) ?? p.maxHp); d.benchHp.delete(next.rowId);
    d.mpF = mpR * p.maxMp; this.recalc(id, false);
    this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 34, col: VOHON[p.vh].col });
    this.log(id, text ?? `${VOHON[p.vh].name} ra trận (cấp ${p.level}, ${p.rings.length} hồn hoàn).`, VOHON[p.vh].col);
    const old = { ...prev, rings: [...prev.rings] };
    this.chain(d, () => store.saveCharacter(old));
  }

  /** Lưu đội hình cùng võ hồn ra trận qua chuỗi lưu. Đổi dồn dập thì không ghi chồng: đã có một lần chờ thì lần đó ghi bản mới nhất. */
  persistTeam(d: PData) {
    if (d.teamQueued) return;
    d.teamQueued = true;
    this.chain(d, async () => {
      d.teamQueued = false;
      const ok = await store.saveTeam(d.accountId, [...d.team], d.ch.rowId);
      if (!ok) console.error(`Đội hình của tài khoản #${d.accountId} không hợp lệ, không lưu:`, d.team, d.ch.rowId);
    });
  }

  // ---------- Cổng (mục 5.3 "Cổng và chặn mềm", mục 6 "Đi qua cổng và lưu vị trí") ----------
  /** Hộp đi cổng gửi riêng: tên cổng, bản đồ đích, cấp đề xuất và cảnh báo khi võ hồn ra trận dưới cấp tối thiểu (chặn mềm). */
  portalHint(id: string, p: PlayerState, d: PData) {
    const portal = d.travelling || p.dead ? undefined : this.map.portalAt(p.x, p.y);
    const warn = !!portal?.level && p.level < portal.level[0];
    const key = portal ? `${portal.name}|${warn}` : "";
    if (key === d.portalKey) return;
    d.portalKey = key;
    this.clients.getById(id)?.send("portal", portal
      ? { name: portal.name, to: portal.to, toName: MAPS[portal.to].name, level: portal.level, warn }
      : { name: "" });
  }

  /** Lý do không được đi cổng `name` lúc này (null = được, "" = bỏ qua im lặng). Server tự kiểm tra, client chỉ gửi tên cổng. */
  travelDeny(id: string, name: string): string | null {
    const p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d) return "";
    const portal = this.map.portals.find((q) => q.name === name);
    if (!portal) return "Cổng không tồn tại.";
    if (this.map.portalAt(p.x, p.y) !== portal) return "Hãy đứng trong cổng rồi mới đi qua được.";
    if (p.dead) return "Đã gục ngã, không thể đi qua cổng.";
    if (d.absorbing) return "Đang hấp thụ hồn hoàn, không thể đi qua cổng.";
    return null;
  }

  /** Xin đi qua cổng: kiểm tra rồi niệm TRAVEL_CAST giây (bị đánh hoặc rời cổng thì hủy), xong thì beginTravel. */
  travel(c: Client, name: string) {
    const id = c.sessionId, d = this.pdata.get(id);
    if (!d || d.travelling || d.travelCast) return;
    const why = this.travelDeny(id, name);
    if (why !== null) { if (why) this.log(id, why, "#ffb35c"); return; }
    const portal = this.map.portals.find((q) => q.name === name)!;
    d.travelCast = { portal, t: TRAVEL_CAST };
    this.log(id, `Đang đi tới ${MAPS[portal.to].name}…`);
  }

  /**
   * Bật cờ `travelling` (đi cổng bước 2, hoặc client vừa rời phòng): từ đây người chơi không còn tiến độ mới nào trước lần ghi
   * cuối. Tick bỏ qua người này (không di chuyển, không hấp thụ tiếp), hồn thú bỏ mục tiêu, và đạn hồn kỹ còn bay bị bỏ để
   * không hạ được hồn thú sau khi đã chụp dữ liệu (mục 6).
   */
  freeze(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    d.travelling = true; d.input = { x: 0, y: 0 }; p.moving = false;
    this.bdata.forEach((bd) => { if (bd.target === id) bd.target = null; });
    this.projs = this.projs.filter((pr) => pr.owner !== id);
  }

  /**
   * Bước 2–4 của mục 6: đánh dấu đang chuyển bản đồ, nối transaction đi cổng vào chuỗi lưu (chờ mọi lần ghi trước xong rồi
   * mới chụp dữ liệu), commit xong mới gửi riêng `travel {mapId}`. Lỗi thì bỏ cờ, người chơi ở lại.
   */
  beginTravel(id: string, portal: Portal) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, from = this.state.mapId;
    this.freeze(id);
    this.portalHint(id, p, d);
    this.chain(d, async () => {
      // Từ bước 3.1 transaction đi cổng ghi luôn túi đồ và Hồn Tệ chưa lưu (mục 6, bước 3).
      const list = this.unsaved(id), bag = this.unsavedBag(d);
      try { await store.saveTravel(d.accountId, list, from, portal.to, portal.ax, portal.ay, bag); }
      catch (e) { for (const v of list) if (v.rowId !== d.ch.rowId) d.dirty.add(v.rowId); if (bag) d.bagDirty = true; throw e; }
      d.travelled = true;
    }).then(() => {
      const c = this.clients.getById(id);
      if (!c) return; // client đã rời: onLeave (đang chờ trong chuỗi) xét d.travelled
      if (!d.travelled) {
        d.travelling = false;
        return this.log(id, "Không chuyển được bản đồ, thử lại.", "#ff8a8a");
      }
      c.send("travel", { mapId: portal.to });
      // Client phải tự rời phòng cũ và vào phòng mới; quá TRAVEL_LEAVE_SECS giây thì server ngắt kết nối.
      this.clock.setTimeout(() => { if (this.clients.getById(id)) c.leave(4003); }, TRAVEL_LEAVE_SECS * 1000);
    });
  }

  // ---------- Túi đồ, vật phẩm và Hồn Tệ (mục 5.7, bước 3.1) ----------
  /**
   * Tin riêng "bag": mọi ô túi đồ, số ô tối đa, Hồn Tệ (đồng) và giây còn lại của hồi chiêu chung đan. Chỉ gửi cho chính chủ
   * (mục 6), không nằm trong state đồng bộ. Gửi khi client xin và mỗi khi túi đổi.
   */
  sendBag(id: string) {
    const d = this.pdata.get(id), c = this.clients.getById(id); if (!d || !c) return;
    c.send("bag", { slots: BAG_SLOTS, honTe: d.honTe, cd: d.danCd,
      items: d.bag.map((i) => ({ id: i.id, kind: i.kind, code: i.code, qty: i.qty, years: i.years, stars: i.stars, enhance: i.enhance, stats: i.stats, vohon: i.vohonId })) });
    if (d.starterNote) {
      d.starterNote = false;
      const gift = STARTER_ITEMS.map((s) => `${s.qty} ${itemDef(s.code)?.name ?? s.code}`).join(", ");
      this.log(id, `Quà khởi đầu đã vào túi đồ: ${gift}. Nhấn B để mở túi.`, "#86e0b0");
    }
  }

  /**
   * Thêm `qty` món mã `code` vào túi: gộp vào ô cùng mã chưa đầy trước (đồ gộp được), rồi mở ô mới khi còn chỗ (BAG_SLOTS).
   * Trả về số món đã nhận; phần dư khi túi đầy thì không nhận (nơi gọi quyết định báo gì). Không tự gửi tin "bag".
   */
  addItem(d: PData, code: string, qty: number) {
    const def = itemDef(code); if (!def || !(qty > 0)) return 0;
    let left = qty;
    for (const it of d.bag) {
      if (left <= 0) break;
      if (it.code !== code || it.vohonId !== null || it.qty >= def.stack) continue;
      const n = Math.min(left, def.stack - it.qty); it.qty += n; left -= n;
    }
    while (left > 0 && bagUsed(d.bag) < BAG_SLOTS) { const n = Math.min(left, def.stack); d.bag.push(newItem(def, n)); left -= n; }
    if (left < qty) d.bagDirty = true;
    return qty - left;
  }

  /** Bớt `n` món ở ô `it`; hết thì bỏ ô. */
  takeItem(d: PData, it: Item, n: number) {
    it.qty -= n;
    if (it.qty <= 0) d.bag = d.bag.filter((x) => x !== it);
    d.bagDirty = true;
  }

  /** Thêm một hồn hoàn `years` năm vào túi (mỗi chiếc một ô, không gộp). Túi đầy thì false. Không tự gửi tin "bag". */
  addRing(d: PData, years: number) {
    const def = itemDef(RING_ITEM); if (!def || bagUsed(d.bag) >= BAG_SLOTS) return false;
    d.bag.push(newItem(def, 1, years)); d.bagDirty = true;
    return true;
  }

  /**
   * Thêm một hồn cốt vào túi (bước 4.1, mỗi món một ô): số năm `years`, loài `beast` (mã trong BEASTS), vị trí `slot` (mã trong
   * BONE_SLOTS), cường hóa +0, chưa gắn. Túi đầy thì null. Không tự gửi tin "bag".
   */
  addBone(d: PData, years: number, beast: string, slot: string) {
    const def = itemDef(BONE_ITEM); if (!def || bagUsed(d.bag) >= BAG_SLOTS) return null;
    const it = newItem(def, 1, years); it.stats = { beast, slot };
    d.bag.push(it); d.bagDirty = true;
    return it;
  }

  /**
   * Thêm một hồn hạch vào túi (bước 5.1, mỗi món một ô): `stars` sao, bộ / chỉ số chính / dòng phụ `data` (đã tung), nâng cấp +0,
   * chưa gắn. Túi đầy thì null. Không tự gửi tin "bag".
   */
  addCore(d: PData, stars: number, data: CoreData) {
    const def = itemDef(CORE_ITEM); if (!def || bagUsed(d.bag) >= BAG_SLOTS) return null;
    const it = newItem(def, 1); it.stars = stars; it.stats = { set: data.set, main: data.main, subs: data.subs.map(([k, v]) => [k, v]) };
    d.bag.push(it); d.bagDirty = true;
    return it;
  }

  /** Tên một ô để báo trong log: "Hồn hoàn 437 năm", "3 Hồi Huyết Đan", "hồn cốt Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm". */
  itemLabel(it: Item) {
    const bone = it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
    if (bone) return `hồn cốt ${boneName(bone.beast, bone.slot, it.years!, it.enhance)}`;
    const core = it.code === CORE_ITEM ? parseCore(it.stats) : null;
    if (core) return coreName(core.set, it.stars ?? 1, it.enhance).replace("Hồn hạch", "hồn hạch");
    const name = itemDef(it.code)?.name ?? "vật phẩm lạ";
    return it.years !== null ? `${name} ${formatYears(it.years)}` : it.qty > 1 ? `${it.qty} ${name}` : name;
  }

  /**
   * Nhặt hồn hoàn gần nhất (cách dưới PICKUP_RANGE) vào túi đồ (mục 5.2 "Hồn hoàn là vật phẩm"): DROP_OWNER_SECS giây đầu chỉ
   * người hạ hồn thú nhặt được; túi đầy thì báo và hồn hoàn ở lại dưới đất. Client chỉ gửi ý định, server chọn theo vị trí.
   * Đồ rơi chồng nhau thì chọn món gần nhất mà người này được nhặt (của mình hoặc đã hết ưu tiên), để đồ của người khác nằm
   * trên không chặn đồ của mình; không có món nào được nhặt thì báo theo món gần nhất.
   */
  pickup(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || p.dead || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const mine = (dr: DropState) => !dr.owner || dr.owner === id || dr.ownerTtl <= 0;
    let best: [string, DropState] | undefined, bd = PICKUP_RANGE;
    for (const [did, dr] of this.state.drops.entries()) {
      const dd = Math.hypot(dr.x - p.x, dr.y - p.y);
      if (dd < PICKUP_RANGE && (!best || (mine(dr) && !mine(best[1])) || (mine(dr) === mine(best[1]) && dd < bd))) { bd = dd; best = [did, dr]; }
    }
    if (!best) return warn("Không có hồn hoàn hay vật phẩm nào ở gần để nhặt.");
    const [did, dr] = best, label = formatYears(dr.years);
    // Từ 4.1: hồn cốt dưới đất, cùng luật ưu tiên người hạ như hồn hoàn; túi đầy thì báo và hồn cốt ở lại.
    if (dr.item === BONE_ITEM) {
      const beast = BEASTS[dr.species]?.id ?? "", slot = BONE_SLOTS[dr.slot]?.id ?? BONE_SLOTS[0].id, name = `hồn cốt ${boneName(beast, slot, dr.years)}`;
      if (dr.owner && dr.owner !== id && dr.ownerTtl > 0) return warn(`Hồn cốt thuộc về người hạ hồn thú: còn ${Math.ceil(dr.ownerTtl)} giây nữa mới nhặt được.`);
      if (!this.addBone(d, dr.years, beast, slot)) return warn(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
      this.state.drops.delete(did);
      this.log(id, `Nhặt ${name} vào túi đồ (B để xem chỉ số).`, TIERS[dr.tier].glow);
      this.sendBag(id);
      return;
    }
    // Từ 5.1: hồn hạch dưới đất, cùng luật ưu tiên người hạ như hồn hoàn; túi đầy thì báo và hồn hạch ở lại.
    if (dr.item === CORE_ITEM) {
      const core = this.coreDrops.get(did), name = coreName(CORE_SETS[dr.cset]?.id ?? "", dr.stars);
      if (dr.owner && dr.owner !== id && dr.ownerTtl > 0) return warn(`${name} thuộc về người hạ hồn thú: còn ${Math.ceil(dr.ownerTtl)} giây nữa mới nhặt được.`);
      if (!core) { this.state.drops.delete(did); return warn(`${name} đã tan biến.`); } // không xảy ra: mọi hồn hạch rơi đều có trong coreDrops
      if (!this.addCore(d, core.stars, core.data)) return warn(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
      this.state.drops.delete(did); this.coreDrops.delete(did);
      this.log(id, `Nhặt ${name} vào túi đồ (B để xem chỉ số).`, CORE_SETS[dr.cset]?.col);
      this.sendBag(id);
      return;
    }
    // Từ 3.4: mảnh võ hồn rơi xuống đất (túi người hạ đã đầy), cùng luật ưu tiên; túi chỉ nhận một phần thì phần còn lại ở lại.
    if (dr.item) {
      const def = itemDef(dr.item), name = def?.name ?? "vật phẩm lạ";
      if (dr.owner && dr.owner !== id && dr.ownerTtl > 0) return warn(`${name} thuộc về người hạ hồn thú: còn ${Math.ceil(dr.ownerTtl)} giây nữa mới nhặt được.`);
      const got = this.addItem(d, dr.item, dr.qty);
      if (!got) return warn(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
      if (got < dr.qty) dr.qty -= got; else this.state.drops.delete(did);
      this.log(id, `Nhặt ${got} ${name} vào túi đồ${this.shardNote(d, dr.item)}.`, def?.col);
      this.sendBag(id);
      return;
    }
    if (dr.owner && dr.owner !== id && dr.ownerTtl > 0) return warn(`Hồn hoàn ${label} thuộc về người hạ hồn thú: còn ${Math.ceil(dr.ownerTtl)} giây nữa mới nhặt được.`);
    if (!this.addRing(d, dr.years)) return warn(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới nhặt được hồn hoàn ${label}.`);
    this.state.drops.delete(did);
    this.log(id, `Nhặt hồn hoàn ${label} (${TIERS[dr.tier].color}) vào túi đồ. Mở túi (B) để hấp thụ.`, TIERS[dr.tier].glow);
    this.sendBag(id);
  }

  /** Bỏ hẳn một ô trong túi (cả chồng), ví dụ hồn hoàn không dùng tới để nhường chỗ. Không bỏ được hồn hoàn đang hấp thụ. */
  discardItem(id: string, raw: unknown) {
    const d = this.pdata.get(id); if (!d || d.travelling) return;
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
    if (!it) return this.log(id, "Không có vật phẩm này trong túi đồ.", "#ffb35c");
    if (d.absorbing?.itemId === it.id) return this.log(id, "Đang hấp thụ hồn hoàn này, không bỏ được.", "#ffb35c");
    if (d.claimBusy && itemDef(it.code)?.kind === "ruong") return this.log(id, "Đang nhận rương thú vương, đợi một chút.", "#ffb35c");
    this.takeItem(d, it, it.qty);
    this.log(id, `Đã bỏ ${this.itemLabel(it)}.`);
    this.sendBag(id);
  }

  /** Hồn Tệ khi hạ hồn thú bậc `tier` (BEAST_COIN): người hạ nhận thẳng vào túi. Trả về số đồng nhận được. */
  rewardCoin(id: string, tier: number) {
    const d = this.pdata.get(id); if (!d) return 0;
    const [lo, hi] = BEAST_COIN[tier] ?? BEAST_COIN[0], n = lo + Math.floor(Math.random() * (hi - lo + 1));
    d.honTe = Math.min(Number.MAX_SAFE_INTEGER, d.honTe + n); d.bagDirty = true;
    this.sendBag(id);
    return n;
  }

  /**
   * Dùng một món trong túi theo id (client chỉ gửi id ô). Server kiểm tra món đó nằm trong túi của chính người gửi, dùng được,
   * người chơi không gục / không hấp thụ / không đang chuyển bản đồ, hết hồi chiêu chung đan, và không phí đan khi đã đầy.
   * Đan dùng được cả khi giao chiến và trong vùng an toàn.
   */
  useItem(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
    if (!it) return warn("Không có vật phẩm này trong túi đồ.");
    const def = itemDef(it.code);
    if (!def || !(def.hp || def.mp)) return warn(`${def?.name ?? "Vật phẩm này"} không dùng trực tiếp được.`);
    if (p.dead) return warn("Đã gục ngã, không thể dùng đan dược.");
    if (d.absorbing) return warn("Đang hấp thụ hồn hoàn, không thể dùng đan dược.");
    if (def.cd && d.danCd > 0) return warn(`Đan dược đang hồi: còn ${Math.ceil(d.danCd)} giây.`);
    if ((!def.hp || d.hpF >= p.maxHp) && (!def.mp || d.mpF >= p.maxMp)) return warn(def.hp ? "Sinh lực đang đầy." : "Hồn lực đang đầy.");
    const hp0 = p.hp, mp0 = p.mp;
    if (def.hp) d.hpF = Math.min(p.maxHp, d.hpF + p.maxHp * def.hp);
    if (def.mp) d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * def.mp);
    p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
    if (def.cd) d.danCd = DAN_CD;
    this.takeItem(d, it, 1);
    this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 22, col: def.col });
    const gain = [def.hp ? `+${p.hp - hp0} sinh lực` : "", def.mp ? `+${p.mp - mp0} hồn lực` : ""].filter(Boolean).join(", ");
    this.log(id, `Dùng ${def.name}: ${gain}.`, def.col);
    this.sendBag(id);
  }

  // ---------- NPC, thương nhân, lò rèn (mục 5.8, bước 6.1) ----------
  /**
   * NPC trong tầm NPC_RANGE của người chơi: đúng mã `id` (nói chuyện), hoặc NPC gần nhất có vai trò `role` (mua bán ở thương nhân).
   * Người đã gục / đang chuyển bản đồ thì không có. Client chỉ gửi ý định, vị trí do server giữ.
   */
  npcNear(id: string, want: { id?: string; role?: NpcRole }): NpcSpot | undefined {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || p.dead || d.travelling) return undefined;
    let best: NpcSpot | undefined, bd = NPC_RANGE;
    for (const n of this.map.npcs) {
      if ((want.id && n.id !== want.id) || (want.role && npcDef(n.id)?.role !== want.role)) continue;
      const k = Math.hypot(n.x - p.x, n.y - p.y);
      if (k <= bd) { bd = k; best = n; }
    }
    return best;
  }

  /** Nói chuyện với NPC `raw` (mã trong NPCS): đứng đủ gần thì gửi riêng tin `npc {id}` để client mở hộp thoại (lời thoại ở NPCS). */
  talkNpc(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const def = npcDef(raw), spot = def && this.map.npcs.find((n) => n.id === def.id);
    if (!def || !spot) return this.log(id, "Không có NPC này ở đây.", "#ffb35c");
    if (p.dead) return this.log(id, "Đã gục ngã, không thể nói chuyện.", "#ffb35c");
    if (!this.npcNear(id, { id: def.id })) return this.log(id, `Hãy lại gần ${def.name} hơn để nói chuyện.`, "#ffb35c");
    this.clients.getById(id)?.send("npc", { id: def.id });
  }

  /** Lưu túi đồ sau mua / bán qua chuỗi lưu (mục 6); bấm dồn dập thì chỉ một lần chờ trong chuỗi, lần đó chụp túi mới nhất. */
  saveTrade(id: string, d: PData) {
    if (d.tradeQueued) return;
    d.tradeQueued = true;
    this.chain(d, () => { d.tradeQueued = false; return this.write(id); });
  }

  /** Số món mã `code` túi còn nhận được: chỗ trống trong ô cùng mã chưa đầy và các ô trống (như addItem). */
  bagRoom(d: PData, code: string) {
    const def = itemDef(code); if (!def) return 0;
    const part = d.bag.reduce((a, it) => a + (it.code === code && it.vohonId === null ? Math.max(0, def.stack - it.qty) : 0), 0);
    return part + Math.max(0, BAG_SLOTS - bagUsed(d.bag)) * def.stack;
  }

  /**
   * Mua `rawQty` món `rawCode` ở thương nhân (SHOP, giá đồng mỗi món): phải đứng gần thương nhân, mã có trong SHOP, 1..SHOP_MAX_QTY
   * món, đủ Hồn Tệ và túi đủ chỗ cho cả số món đó (thiếu thì từ chối hết, không trừ tiền). Server tính giá; ghi DB qua chuỗi lưu.
   */
  buyItem(id: string, rawCode: unknown, rawQty: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    if (!this.npcNear(id, { role: "shop" })) return warn("Hãy đứng cạnh thương nhân rồi mới mua được.");
    const row = SHOP.find((s) => s.code === rawCode), def = row && itemDef(row.code);
    if (!row || !def) return warn("Thương nhân không bán món này.");
    const qty = Number.isInteger(rawQty) ? (rawQty as number) : 0;
    if (qty < 1 || qty > SHOP_MAX_QTY) return warn(`Mỗi lần mua từ 1 đến ${SHOP_MAX_QTY} món.`);
    const cost = row.price * qty;
    if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: ${qty} ${def.name} giá ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
    if (this.bagRoom(d, row.code) < qty) return warn(`Túi đồ không đủ chỗ cho ${qty} ${def.name} (${BAG_SLOTS} ô): bỏ hoặc bán bớt đồ trước.`);
    d.honTe -= cost; d.bagDirty = true;
    this.addItem(d, row.code, qty);
    this.log(id, `Mua ${qty} ${def.name}: −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)}).`, def.col);
    this.sendBag(id);
    this.saveTrade(id, d);
  }

  /**
   * Bán cho thương nhân `rawQty` món (thiếu: cả ô) ở ô `rawId` trong túi của chính người gửi: phải đứng gần thương nhân; không bán
   * đồ đang gắn trên võ hồn (hồn cốt, hồn hạch), hồn hoàn đang hấp thụ, đan và rương (sellPrice null). Giá do
   * server tính (sellPrice theo niên hạn / sao / độ hiếm); ghi DB qua chuỗi lưu.
   */
  sellItem(id: string, rawId: unknown, rawQty: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    if (!this.npcNear(id, { role: "shop" })) return warn("Hãy đứng cạnh thương nhân rồi mới bán được.");
    const it = typeof rawId === "string" ? d.bag.find((i) => i.id === rawId) : undefined;
    if (!it) return warn("Không có vật phẩm này trong túi đồ.");
    if (it.vohonId !== null) return warn(`${this.itemLabel(it)} đang gắn trên võ hồn: tháo ra trước mới bán được.`);
    if (d.absorbing?.itemId === it.id) return warn("Đang hấp thụ hồn hoàn này, không bán được.");
    const price = sellPrice(it);
    if (price === null) return warn(`Thương nhân không mua ${itemDef(it.code)?.name ?? "vật phẩm lạ"}.`);
    const qty = rawQty === undefined || rawQty === null ? it.qty : Number.isInteger(rawQty) ? (rawQty as number) : 0;
    if (qty < 1 || qty > it.qty) return warn(`Số lượng bán phải từ 1 đến ${it.qty}.`);
    const label = this.itemLabel({ ...it, qty }), gain = price * qty;
    this.takeItem(d, it, qty);
    d.honTe = Math.min(Number.MAX_SAFE_INTEGER, d.honTe + gain); d.bagDirty = true;
    this.log(id, `Bán ${label}: +${formatHonTe(gain)} (còn ${formatHonTe(d.honTe)}).`, "#f2c84b");
    this.sendBag(id);
    this.saveTrade(id, d);
  }

  log(id: string, text: string, col?: string) { this.clients.getById(id)?.send("log", { text, col }); }

  /**
   * Hook kiểm thử cho bot (client/scripts/bot-test.mjs), chỉ chạy khi server bật biến môi trường GAME_TEST=1; mặc định chỉ trả
   * lời "không bật". Đi qua đúng các hàm luật chơi: `down` (võ hồn ra trận gục), `kill {tier}` (nhận kinh nghiệm như hạ hồn thú),
   * `rest {s}` (nghỉ ngoài trận s giây; hiệu ứng có lợi cũng trôi s giây), `set {rowId, level, xp, rings}` (đặt tiến độ một võ hồn của mình; có lưu DB),
   * `energy {v}` (đặt năng lượng tiên cơ mọi võ hồn chưa gục trong đội, tính như vừa giao chiến), `spawn {tier, dx, dy}` (sinh hồn thú cạnh mình),
   * `hurt {pct}` (võ hồn ra trận mất pct% sinh lực hiện có, bỏ qua khiên), `clear` (bỏ mọi hồn thú trong vòng 160 pixel quanh mình),
   * `beast {dx, dy}` (đặt một hồn thú thường 1 máu, đứng yên, lệch (dx, dy) so với mình; chỉ bản đồ có vùng săn),
   * `give {code, qty, years}` (thêm vật phẩm vào túi, gộp và giới hạn ô như nhặt đồ; hồn hoàn mang `years` năm), `coin {n}` (đặt
   * Hồn Tệ), `drain {pct}` (mất pct% hồn lực hiện có), `goto {x, y}` (đứng ở điểm đứng được), `drops {s}` (mọi hồn hoàn dưới đất
   * già thêm s giây). `rest` cũng trừ hồi chiêu đan. Từ 3.2 `beast`, `spawn`, `kill` nhận thêm `years` (tuổi hồn thú; thiếu thì
   * lấy mốc năm của bậc).
   * Từ 2.5a: `status {s, n, secs, all}` (gây trạng thái lên hồn thú gần nhất trong 160 pixel, `all`: mọi hồn thú trong 160 pixel,
   * bằng applyStatus với sức mạnh 1), `boom` (Viêm bạo lên hồn thú gần nhất), `bhp {pct}` (hồn thú gần nhất còn pct% sinh lực,
   * coi như vừa bị đánh), `regen {s}` (hồn thú gần nhất hồi máu s giây bằng regenBeast; trả `gain`), `ready {mp}` (hết hồi chiêu
   * hồn kỹ, hồn lực còn mp%), `grant {vohon}` (thêm võ hồn bất kỳ, kể cả UR, vào tài khoản; có lưu DB). `down` / `hurt` bỏ qua cả
   * miễn sát thương.
   * Từ BĐ3: `legacy {mapId, x, y}` ghi `map_id` cũ đã bỏ khỏi MAPS (mã trong MAP_MOVED, ví dụ `tinh_dau`) và vị trí (x, y) như tài
   * khoản của bản trước, qua đúng transaction đi cổng (freeze, saveTravel; trả `saved`); client rời phòng rồi hỏi lại /api/me.
   * Từ 2.5c: `lei {v}` (đặt Phong Lôi Chi Lực, tính như vừa giao chiến; đủ max thì chỉ tung khi đánh trúng lần tới).
   * Từ 3.4: `shard {r, i}` cố định số ngẫu nhiên rơi mảnh võ hồn (r: 0..100, rơi khi r/100 < shardChance; −1 bỏ) và võ hồn
   * được chọn (chỉ số i trong MAPS[bản đồ].shards, −1 ngẫu nhiên); `give` nhận cả mã mảnh (shardCode).
   * Từ 3.5: `spawn` nhận `species` (mã loài); `tele {i}` hồn thú gần nhất báo trước chiêu thứ i nhắm người gọi ngay (trả `bid`, `name`);
   * `pst {s, n, secs}` gây trạng thái lên chính người gọi (PLAYER_STATUS). Hồn thú của `beast` không có chiêu báo trước.
   * Từ BĐ4: `elite` trả mọi ô tinh anh của phòng (vị trí, vùng, chỉ số, người tham gia, Cuồng nộ, giây chờ hồi sinh); `etick {s}` chạy
   * luật tinh anh như đã trôi `s` giây (loại người ở ngoài bán kính, giảm số người, bỏ giao chiến, Cuồng nộ hết giờ); `erespawn {s}`
   * rút thời gian chờ hồi sinh của mọi tinh anh đã bị hạ xuống còn `s` giây; `clear {keep}` giữ lại tinh anh; `beast` nhận `boss`
   * (mã trong BOSSES): tinh anh 1 máu, không thuộc ô tinh anh nào (không hồi sinh), để thử thưởng khi hạ (hồn cốt x ELITE.bone).
   * Từ 4.1: `bone {r, s}` cố định số ngẫu nhiên rơi hồn cốt (r: 0..100, rơi khi r/100 < boneChance; −1 bỏ) và vị trí (chỉ số s
   * trong BONE_SLOTS, −1 ngẫu nhiên); `beast` nhận `species` (mã loài trong BEASTS); `give` hồn cốt (BONE_ITEM) nhận `years`,
   * `beast`, `slot` (mã vị trí).
   * Từ 5.1: `core {r, stars, set}` cố định số ngẫu nhiên rơi hồn hạch (r: 0..100, rơi khi r/100 < coreChance, tinh anh luôn rơi; −1
   * bỏ), sao (0 = ngẫu nhiên trong khoảng theo niên hạn; ngoài khoảng cũng là ngẫu nhiên) và bộ (chỉ số trong CORE_SETS, −1 theo bản
   * đồ); `give` hồn hạch (CORE_ITEM) nhận `stars`, `set` (mã bộ) và tung chỉ số như khi rơi.
   * Từ 4.2: `stats {rowId}` trả chỉ số một võ hồn của mình (`base` không hồn cốt, `stats` có hồn cốt, `bones` phần cộng thêm,
   * `live` chỉ số đang dùng nếu là võ hồn ra trận).
   */
  testHook(c: Client, m: unknown) {
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, op = String(o.op ?? "");
    if (process.env.GAME_TEST !== "1") return c.send("test", { op, enabled: false });
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const int = (x: unknown, lo: number, hi: number, def: number) => (Number.isInteger(x) ? Math.max(lo, Math.min(hi, x as number)) : def);
    if ((op === "down" || op === "hurt") && d.buffs.delete("inv")) this.syncBuffs(p, d);
    const nearB = () => { const bid = this.nearestBeast(p, 160); return bid ? { bid, b: this.state.beasts.get(bid)!, bd: this.bdata.get(bid)! } : null; };
    let out: Record<string, unknown> = {};
    const yearsOf = (tier: number) => int(o.years, TIERS[0].years, MAX_YEARS, TIERS[tier].years);
    if (op === "down" && !p.dead) { d.inv = 0; d.shield = 0; this.hurtPlayer(id, d.hpF / VOHON[p.vh].def + 1); }
    else if (op === "hurt" && !p.dead) { d.inv = 0; d.shield = 0; this.hurtPlayer(id, Math.floor(d.hpF * int(o.pct, 0, 99, 0) / 100) / VOHON[p.vh].def); }
    else if (op === "kill") this.rewardKill(id, yearsOf(int(o.tier, 0, TIERS.length - 1, 0)));
    else if (op === "beast" && this.map.zones.length) {
      // Hồn thú thường 1 máu đứng yên tại (x+dx, y+dy) so với người gọi, để bot thử đạn hồn kỹ trúng đích đúng lúc và nhặt hồn hoàn.
      const sp = typeof o.species === "string" ? Math.max(0, beastIndex(o.species)) : 0; // từ 4.1: loài theo mã (hồn cốt mang tên loài)
      const boss = typeof o.boss === "string" ? bossIndex(o.boss) : -1; // từ BĐ4: tinh anh theo mã BOSSES (không thuộc ô tinh anh nào)
      const bid = this.addBeast(0, yearsOf(0), boss >= 0 ? boss : sp, p.x + int(o.dx, -200, 200, 0), p.y + int(o.dy, -200, 200, 0), boss >= 0 ? 1 : 0);
      this.state.beasts.get(bid)!.hp = 1; this.bdata.get(bid)!.wt = 1e9; this.bdata.get(bid)!.skills = []; // không tung chiêu báo trước
    }
    else if (op === "goto") {
      const x = Number(o.x), y = Number(o.y);
      if (this.map.standable(x, y)) { p.x = x; p.y = y; d.input = { x: 0, y: 0 }; }
    }
    else if (op === "drops") {
      const s = int(o.s, 0, 3600, 0);
      this.state.drops.forEach((dr) => { dr.ownerTtl = Math.max(0, dr.ownerTtl - s); dr.ttl = Math.max(0.01, dr.ttl - s); });
    }
    else if (op === "rest") {
      const s = int(o.s, 0, 3600, 0); d.fight = Math.max(d.fight + s, TEAM_COMBAT_SECS);
      this.tickDowns(id, s); this.tickEnergy(id, s); this.sendSquad(id);
      for (const [b, x] of d.buffs) { x.t -= s; if (x.t <= 0) d.buffs.delete(b); } // hiệu ứng có lợi cũng hết giờ
      this.syncBuffs(p, d);
      d.danCd = Math.max(0, d.danCd - s); this.sendBag(id);
    }
    else if (op === "give") {
      const code = String(o.code ?? ""), qty = int(o.qty, 1, 10000, 1);
      let got = 0;
      if (code === RING_ITEM) while (got < qty && this.addRing(d, yearsOf(0))) got++;
      else if (code === BONE_ITEM) {
        const beast = beastIndex(String(o.beast ?? "")) >= 0 ? String(o.beast) : BEASTS[0].id;
        const slot = BONE_SLOTS.some((s) => s.id === o.slot) ? String(o.slot) : BONE_SLOTS[0].id;
        while (got < qty && this.addBone(d, yearsOf(0), beast, slot)) got++;
      }
      else if (code === CORE_ITEM) {
        const stars = int(o.stars, 1, MAX_CORE_STARS, 1), si = coreSetIndex(o.set);
        while (got < qty && this.addCore(d, stars, rollCoreStats(stars, MAPS[this.state.mapId]?.cores ?? [], Math.random, si >= 0 ? si : undefined))) got++;
      }
      else got = this.addItem(d, code, qty);
      if (got < qty) this.log(id, itemDef(code) ? `Túi đồ đã đầy (${BAG_SLOTS} ô): ${qty - got} món không nhận được.` : "Vật phẩm không tồn tại.", "#ffb35c");
      this.sendBag(id);
    }
    else if (op === "coin") { d.honTe = int(o.n, 0, 1e12, d.honTe); d.bagDirty = true; this.sendBag(id); }
    else if (op === "shard") {
      const r = int(o.r, -1, 100, -1);
      d.testShard = r < 0 ? null : { r: Math.min(0.9999, r / 100), i: int(o.i, -1, 99, -1) };
    }
    else if (op === "bone") {
      const r = int(o.r, -1, 100, -1);
      d.testBone = r < 0 ? null : { r: Math.min(0.9999, r / 100), s: int(o.s, -1, BONE_SLOTS.length - 1, -1) };
    }
    else if (op === "core") {
      const r = int(o.r, -1, 100, -1);
      d.testCore = r < 0 ? null : { r: Math.min(0.9999, r / 100), stars: int(o.stars, 0, MAX_CORE_STARS, 0), set: int(o.set, -1, CORE_SETS.length - 1, -1) };
    }
    else if (op === "roll") { const r = int(o.r, -1, 100, -1); d.testRoll = r < 0 ? null : Math.min(0.9999, r / 100); }
    else if (op === "rush") { if (d.absorbing) this.finishAbsorb(id); }
    else if (op === "drain") { d.mpF = Math.floor(d.mpF * (100 - int(o.pct, 0, 100, 0)) / 100); p.mp = Math.floor(d.mpF); }
    else if (op === "lei") { d.lei = int(o.v, 0, PHONG_LOI.max, 0); p.lei = d.lei; d.fight = 0; }
    else if (op === "bond") out = { crit: this.bondV(d, "crit"), burn: this.bondV(d, "burn") }; // ràng buộc của đội hiện tại (2.5d)
    else if (op === "energy") { const v = int(o.v, 0, TIEN_CO_MAX, 0); d.fight = 0; for (const r of d.team) if (r && !d.down.has(r)) d.energy.set(r, v); }
    else if (op === "spawn") {
      const years = yearsOf(int(o.tier, 0, TIERS.length - 1, 0));
      const x = Math.max(8, Math.min(this.map.MW * TILE - 8, p.x + int(o.dx, -200, 200, 20)));
      const y = Math.max(8, Math.min(this.map.MH * TILE - 8, p.y + int(o.dy, -200, 200, 0)));
      const zi = Math.max(0, this.map.zones.findIndex((z) => x >= z.x0 && x < z.x1)), sp = beastIndex(String(o.species ?? ""));
      this.addBeast(zi, years, sp >= 0 ? sp : this.map.zones[zi]?.beasts[0]?.species ?? 0, x, y);
    }
    else if (op === "tele") {
      // Hồn thú gần nhất báo trước chiêu thứ `i` nhắm người gọi ngay lúc này (bỏ qua tầm, hồi chiêu và thời gian chờ).
      const x = nearB(), s = x?.bd.skills[int(o.i, 0, 9, 0)];
      if (x && s && !x.bd.cast) { x.bd.target = id; x.b.aggro = true; this.beginCast(x.bid, x.b, x.bd, s, id, p); out = { bid: x.bid, name: s.def.name }; }
    }
    else if (op === "pst") {
      // Trạng thái lên chính người gọi như do hồn thú gần nhất gây (sát thương đòn thường của nó cho Trúng độc / Thiêu đốt).
      const s = String(o.s ?? "") as StatusId, x = nearB();
      this.applyPStatus(id, { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) }, x?.bd.dmg ?? 10);
    }
    else if (op === "status") {
      const s = String(o.s ?? "") as StatusId, x = nearB();
      const a: StatusApply = { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) };
      if (x && (STATUS_IDS as readonly string[]).includes(s))
        for (const bid of o.all ? [...this.state.beasts.keys()].filter((k) => { const b = this.state.beasts.get(k)!; return Math.hypot(b.x - p.x, b.y - p.y) < 160; }) : [x.bid])
          this.applyStatus(bid, a, id);
    }
    else if (op === "boom") { const x = nearB(); if (x) this.detonateBurn(x.bid, id); }
    else if (op === "bst") {
      // Trạng thái trên hồn thú gần nhất (5.2): giây còn lại, số tầng, độ lớn, có phải do người gọi gây không.
      const x = nearB();
      out = x ? { bid: x.bid, st: Object.fromEntries([...x.bd.st].map(([s, i]) => [s, { t: i.t, n: i.n, v: i.v, mine: i.src === id }])) } : {};
    }
    else if (op === "bhp") { const x = nearB(); if (x) { x.b.hp = Math.max(1, Math.round(x.b.maxHp * int(o.pct, 1, 100, 100) / 100)); x.bd.calm = 0; x.bd.regen = 0; } }
    else if (op === "regen") { const x = nearB(); if (x) { const h0 = x.b.hp; this.regenBeast(x.b, x.bd, int(o.s, 0, 60, 0)); out = { gain: x.b.hp - h0 }; } }
    else if (op === "ready") { for (let i = 0; i < 4; i++) p.cds[i] = 0; for (let i = 0; i < p.bcds.length; i++) p.bcds[i] = 0; d.mpF = p.maxMp * int(o.mp, 0, 100, 100) / 100; p.mp = Math.floor(d.mpF); }
    else if (op === "grant") {
      const vohon = String(o.vohon ?? "");
      if (vohonIndex(vohon) >= 0) {
        store.addVohon(d.accountId, p.name, vohon, d.ch.level).then((v) => {
          if (v && this.pdata.get(id) === d) d.owned.push(v);
          this.sendVohons(c); c.send("test", { op, enabled: true });
        }).catch((e) => { console.error("grant thất bại", e); c.send("test", { op, enabled: true }); });
        return;
      }
    }
    else if (op === "legacy") {
      const to = String(o.mapId ?? "");
      if (Object.hasOwn(MAP_MOVED, to) && !d.travelling) {
        this.freeze(id);
        this.chain(d, async () => {
          await store.saveTravel(d.accountId, this.unsaved(id), this.state.mapId, to, int(o.x, 0, 1e5, 0), int(o.y, 0, 1e5, 0), this.unsavedBag(d));
          d.travelled = true;
        }).then(() => {
          if (!d.travelled) d.travelling = false;
          this.sendVohons(c); c.send("test", { op, enabled: true, saved: d.travelled });
        });
        return;
      }
    }
    else if (op === "stats") {
      // Chỉ số của một võ hồn của mình (thiếu rowId: võ hồn ra trận): `bones` là phần hồn cốt cộng thêm (4.2), `base` là khi không
      // gắn gì; võ hồn ra trận kèm `live` (chỉ số đang dùng trong trận: maxHp, maxMp, atk). Từ 5.2: `cores` (chỉ số hồn hạch kèm phần
      // của bộ), `sets` (số món từng bộ), `fx` (hiệu ứng bộ), `slots` (id hồn hạch -> ô); `live` thêm chí mạng và hiệu ứng bộ đang dùng.
      const v = d.owned.find((x) => x.rowId === o.rowId) ?? d.ch;
      if (v === d.ch) this.syncCh(id);
      const vh = Math.max(0, vohonIndex(v.vohon)), rings = v.rings.map(tierOfYears), bones = this.boneBonusOf(d, v.rowId);
      const worn = this.coresOn(d, v.rowId), cores = coreBonus(worn);
      out = { rowId: v.rowId, bones, cores, sets: Object.fromEntries(coreSetCounts(worn)), fx: coreFx(worn),
        slots: Object.fromEntries(worn.map((w) => [w.it.id, w.slot])),
        base: calcStats(vh, v.level, rings, v.stars), stats: calcStats(vh, v.level, rings, v.stars, bones, cores),
        live: v === d.ch ? { maxHp: p.maxHp, maxMp: p.maxMp, atk: d.atk, passive: d.passive, crit: d.crit, critMult: d.critMult, fx: d.coreFx } : null };
    }
    else if (op === "elite") out = { list: this.elites.map((slot) => {
      const b = slot.bid ? this.state.beasts.get(slot.bid) : undefined, bd = slot.bid ? this.bdata.get(slot.bid) : undefined, e = bd?.elite;
      const { spot } = slot, def = BOSSES[spot.boss];
      return { boss: def.id, name: beastName(1, spot.boss), zone: this.map.zones[spot.zone].name, zi: spot.zone,
        rect: { x: spot.x, y: spot.y, w: spot.w, h: spot.h }, bid: slot.bid, respawn: slot.bid ? 0 : slot.t,
        ...(b && bd && e ? { x: b.x, y: b.y, hx: bd.hx, hy: bd.hy, years: b.years, hp: b.hp, maxHp: b.maxHp, base: e.base, dmg: bd.dmg, n: e.n, engaged: e.engaged,
          parts: [...e.parts.keys()], rage: bd.buffs.get("rage") ?? 0, rageCd: e.rageCd, skills: bd.skills.map((x) => x.def.name), minions: bd.minions.size } : {}) };
    }) };
    else if (op === "etick") {
      // Từ BĐ5 chạy cả luật thú vương (người tham gia trong hang, bỏ giao chiến, rút đi khi hết giờ).
      const s = Math.min(1200, Math.max(0, Number(o.s) || 0));
      for (const [bid, bd] of [...this.bdata]) { const b = this.state.beasts.get(bid); if (b && bd.elite) this.tickElite(bid, b, bd, s); }
    }
    else if (op === "king") {
      // BĐ5: `warn {s}` / `spawn {life}` phát sự kiện lịch boss qua presence cho mọi phòng (như schedule.ts), bản đồ `mapId` (mặc định
      // bản đồ của phòng); `info` trả thú vương của phòng (máu, số người, giai đoạn, chiêu, đóng góp, thời gian còn lại).
      const kop = String(o.kop ?? "info"), mid = typeof o.mapId === "string" && MAPS[o.mapId]?.king ? o.mapId : this.state.mapId, kingId = MAPS[mid].king;
      if ((kop === "warn" || kop === "spawn") && kingId) {
        const slot = Date.now();
        publishBoss(this.presence, { mapId: mid, king: kingId, phase: kop, slot, in: kop === "warn" ? int(o.s, 0, 3600, KING.warnSecs) : 0,
          life: int(o.life, 1, 7200, KING.lifeSecs), test: true });
      }
      const bid = this.king?.bid, b = bid ? this.state.beasts.get(bid) : undefined, bd = bid ? this.bdata.get(bid) : undefined, e = bd?.elite, k = e?.king;
      out = { lair: this.map.lair, slot: this.king?.slot ?? 0, seat: this.king?.seat.state ?? "", roomId: this.roomId, ...(b && bd && e && k ? { bid, x: b.x, y: b.y, years: b.years, hp: b.hp, maxHp: b.maxHp, base: e.base,
        dmg: bd.dmg, engaged: e.engaged, parts: [...e.parts.keys()], phase: k.phase, roar: k.roar, spd: k.spd, life: k.life,
        skills: bd.skills.map((x) => x.def.name), st: [...bd.st.keys()], ...this.kingRank(e) } : {}) };
    }
    else if (op === "kdmg") {
      // BĐ5: gây đúng `v` sát thương lên thú vương của phòng (không chí mạng, đi qua damageBeast: thành người tham gia, ghi đóng góp).
      const bid = this.king?.bid; if (bid) out = { dealt: this.damageBeast(bid, int(o.v, 1, 1e8, 1), id, "#ffffff", undefined, { direct: false }) };
    }
    else if (op === "chest") {
      // BĐ5: cố định số ngẫu nhiên khi mở rương: hồn cốt / mảnh UR (0..100, rơi khi r/100 < tỉ lệ), võ hồn i trong kingShardPool, số mảnh n,
      // vị trí hồn cốt s; mọi giá trị −1 = ngẫu nhiên; `off` bỏ.
      const pct = (x: unknown) => { const v = int(x, -1, 100, -1); return v < 0 ? -1 : Math.min(0.9999, v / 100); };
      d.testChest = o.off ? null : { bone: pct(o.bone), ur: pct(o.ur), i: int(o.i, -1, 99, -1), n: int(o.n, -1, 99, -1), s: int(o.s, -1, BONE_SLOTS.length - 1, -1) };
    }
    else if (op === "day") { this.dayShift = int(o.shift, -3650, 3650, 0); out = { day: this.today() }; }
    else if (op === "claims") {
      // BĐ5: lượt nhận rương thú vương hôm nay trong bộ nhớ và trong DB (đọc sau khi chuỗi lưu xong).
      this.chain(d, async () => {
        const db = await store.bossClaims(d.accountId, this.today(), BOSS_CLAIM_KING);
        this.sendVohons(c); c.send("test", { op, enabled: true, day: this.today(), n: this.claimsToday(d), db });
      });
      return;
    }
    else if (op === "erespawn") { const s = Math.max(0, Number(o.s) || 0); for (const slot of this.elites) if (!slot.bid) slot.t = Math.min(slot.t, s); }
    else if (op === "clear") this.state.beasts.forEach((b, bid) => { // `keep`: giữ tinh anh (BĐ4)
      if (Math.hypot(b.x - p.x, b.y - p.y) < 160 && !(o.keep && b.rank)) { this.state.beasts.delete(bid); this.bdata.delete(bid); }
    });
    else if (op === "set") {
      const v = d.owned.find((x) => x.rowId === o.rowId);
      if (v) {
        this.syncCh(id);
        v.level = int(o.level, 1, MAX_LEVEL, v.level); v.xp = int(o.xp, 0, 1e9, v.xp);
        if (Array.isArray(o.rings)) v.rings = o.rings.filter((y) => Number.isInteger(y) && y > 0).slice(0, MAX_RINGS) as number[];
        if (v === d.ch) { d.ringYears = [...v.rings]; this.showVohon(p, v); this.recalc(id, true); } else d.dirty.add(v.rowId);
      }
    }
    this.sendVohons(c);
    c.send("test", { op, enabled: true, ...out });
  }

  /**
   * Kinh nghiệm hạ hồn thú `years` năm (mục 5.1, 5.3; tăng theo số năm, beastStats): giảm theo chênh cấp giữa võ hồn ra trận và
   * cấp tương đương của số năm (beastLevel, từ BĐ3) một lần, rồi chia cho đội:
   * võ hồn ra trận XP_SHARE_ACTIVE, mỗi võ hồn khác trong đội XP_SHARE_BENCH (kể cả võ hồn đã gục). Ô trống và võ hồn
   * ở bình cảnh không nhận, phần đó không chia lại. `mult`: hệ số theo bậc hồn thú (tinh anh ELITE.xp, BĐ4).
   */
  rewardKill(id: string, years: number, mult = 1) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const base = beastStats(years).xp * mult * xpLevelScale(p.level, beastLevel(years));
    for (const r of d.team) {
      const v = d.owned.find((o) => o.rowId === r); if (!v) continue;
      if (v === d.ch) this.addXp(id, Math.round(base * XP_SHARE_ACTIVE));
      else this.benchXp(id, v, Math.round(base * XP_SHARE_BENCH));
    }
  }

  /** Kinh nghiệm cho võ hồn trong đội đang không ra trận (cùng luật lên cấp, bình cảnh như addXp). */
  benchXp(id: string, v: Character, n: number) {
    if (n <= 0 || xpBlocked(v.level, v.rings.length)) return;
    const d = this.pdata.get(id)!, name = VOHON[Math.max(0, vohonIndex(v.vohon))].name;
    v.xp += n; d.dirty.add(v.rowId);
    while (!xpBlocked(v.level, v.rings.length) && v.xp >= xpNeed(v.level)) {
      v.xp -= xpNeed(v.level); v.level++;
      if (!d.down.has(v.rowId)) d.benchHp.delete(v.rowId); // lên cấp thì hồi đầy, như võ hồn ra trận
      if (xpBlocked(v.level, v.rings.length)) {
        v.xp = 0;
        this.log(id, `${name} đạt cấp ${v.level}: bình cảnh! Cần hấp thụ hồn hoàn thứ ${v.rings.length + 1}.`, "#ffe08a");
      } else this.log(id, `${name} lên cấp ${v.level}.`);
    }
  }

  addXp(id: string, n: number) {
    const p = this.state.players.get(id)!;
    if (n <= 0 || xpBlocked(p.level, p.rings.length)) return;
    p.xp += n;
    while (!xpBlocked(p.level, p.rings.length) && p.xp >= xpNeed(p.level)) {
      p.xp -= xpNeed(p.level); p.level++;
      this.recalc(id, false); this.pdata.get(id)!.hpF = p.maxHp;
      this.broadcast("fx", { k: "wave", x: p.x, y: p.y, r: 30, col: "#ffe9a0" });
      if (xpBlocked(p.level, p.rings.length)) {
        p.xp = 0;
        this.log(id, `Đạt cấp ${p.level}: bình cảnh! Hãy săn hồn thú và hấp thụ hồn hoàn thứ ${p.rings.length + 1}.`, "#ffe08a");
      } else this.log(id, `Lên cấp ${p.level}.`);
    }
    this.recalc(id, false);
  }

  /**
   * Hồn thú gây `dmg` cho hồn sư `id`. Trả về true nếu đòn trúng (kể cả khiên đỡ hết), false nếu bị bỏ qua (vừa bị đánh, bất tử,
   * miễn sát thương, đang chuyển bản đồ). Từ 3.5: Dễ thương / Phá giáp trên hồn sư tăng sát thương nhận; `dot`: sát thương theo
   * thời gian (Trúng độc, Thiêu đốt: bỏ qua và không đặt khung bất tử 0,45 giây, không lan Cảm điện); đòn trực tiếp trúng hồn sư
   * Cảm điện thì lan STATUS.shock.chain sang hồn sư Cảm điện khác gần đó (`chain`: phần lan, không lan tiếp).
   */
  hurtPlayer(id: string, dmg: number, o: { dot?: boolean; chain?: boolean } = {}): boolean {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, direct = !o.dot && !o.chain;
    if ((direct && d.inv > 0) || p.dead || d.travelling) return false; // trong vùng an toàn hồn thú đã bỏ mục tiêu (tick) nên không đánh tới
    if (d.travelCast) { d.travelCast = null; this.log(id, "Bị tấn công: đã hủy đi qua cổng.", "#ffb35c"); }
    // Miễn sát thương (Vô Địch Thần Quang): không mất gì nhưng vẫn tính là bị đánh (giao chiến), hiện chữ "Miễn".
    if (this.buffV(d, "inv")) { d.fight = 0; if (direct) d.inv = 0.45; this.broadcast("dmg", { x: p.x, y: p.y - 18, v: 0, c: "#fff2b0", id, immune: true }); return false; }
    const raw = dmg, armor = d.st.get("armor");
    dmg *= 1 + (d.st.has("vuln") ? STATUS.vuln.amp : 0) + (direct && armor ? STATUS.armor.amp * armor.n : 0);
    dmg = Math.round(dmg * VOHON[p.vh].def * (1 - Math.min(0.9, this.buffV(d, "def"))));
    // Khiên (tiên cơ phụ trợ) đỡ trước; vẫn tính là bị đánh (giao chiến, gián đoạn hấp thụ).
    const blocked = Math.min(d.shield, dmg); d.shield -= blocked; dmg -= blocked; p.shield = Math.ceil(d.shield);
    d.hpF -= dmg; if (direct) d.inv = 0.45; d.lastHit = 0; d.fight = 0;
    // Khiên đỡ hết thì hiện số bị đỡ (màu lam) thay cho số 0.
    this.broadcast("dmg", { x: p.x, y: p.y - 18, v: -(dmg || blocked), c: blocked ? "#9ad8ff" : o.dot ? "#8ef08a" : "#ff6b6b", id }); // id: client chạy animation hurt cho hồn sư này
    if (d.absorbing) this.cancelAbsorb(id, "Bị tấn công: quá trình hấp thụ bị gián đoạn, hồn hoàn vẫn còn trong túi.");
    if (d.hpF <= 0) { d.hpF = 0; p.hp = 0; this.knockOut(id); }
    if (direct && d.st.has("shock")) {
      const sh = STATUS.shock;
      for (const [oid, op] of this.state.players.entries())
        if (oid !== id && !op.dead && this.pdata.get(oid)?.st.has("shock") && Math.hypot(op.x - p.x, op.y - p.y) < sh.chainR) this.hurtPlayer(oid, raw * sh.chain, { chain: true });
    }
    return true;
  }

  /**
   * Võ hồn ra trận gục (mục 5.1): tự đổi sang võ hồn chưa gục kế tiếp trong đội (theo thứ tự ô, hết thì vòng lại ô 1), không
   * tính và không chờ hồi chiêu đổi. Cả đội gục thì sau RESPAWN_SECS giây về doanh trại; không mất kinh nghiệm hay đồ (mục 2).
   */
  knockOut(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, fallen = d.ch, name = VOHON[p.vh].name;
    d.down.set(fallen.rowId, REVIVE_SECS); d.energy.delete(fallen.rowId); // gục thì mất hết năng lượng tiên cơ
    if (fallen.vohon === PHONG_LOI.vohon) { d.lei = 0; p.lei = 0; } // Lam Điện Bá Vương Long gục thì mất Phong Lôi Chi Lực
    const at = d.team.indexOf(fallen.rowId);
    let next: Character | undefined;
    for (let k = 1; k < TEAM_SIZE && !next; k++) {
      const r = d.team[(at + k) % TEAM_SIZE];
      if (r && !d.down.has(r)) next = d.owned.find((v) => v.rowId === r);
    }
    const c = this.clients.getById(id);
    if (next) {
      const nextName = VOHON[Math.max(0, vohonIndex(next.vohon))].name;
      this.activate(id, next, `${name} đã gục! ${nextName} tự động ra trận. ${name} hồi lại sau ${REVIVE_SECS} giây ngoài trận hoặc khi về doanh trại.`);
      c?.send("ko", { fallen: fallen.vohon, next: next.vohon });
      this.persistTeam(d);
      if (c) this.sendVohons(c);
    } else {
      p.dead = true; d.deadT = RESPAWN_SECS; this.clearPStatus(p, d);
      this.log(id, `${name} đã gục, cả đội đều đã gục. Đang trở về doanh trại… (không mất kinh nghiệm hay đồ)`, "#ff8a8a");
      c?.send("ko", { fallen: fallen.vohon, next: null });
      this.sendSquad(id, true);
    }
  }

  /** Hồi các võ hồn đã gục, đầy sinh lực. */
  revive(id: string, rows: number[], where: string) {
    const d = this.pdata.get(id)!;
    for (const r of rows) { d.down.delete(r); d.benchHp.delete(r); }
    const names = rows.map((r) => VOHON[Math.max(0, vohonIndex(d.owned.find((v) => v.rowId === r)?.vohon ?? ""))].name);
    this.log(id, `${names.join(", ")} đã hồi phục ${where}, đổi vào trận được rồi.`, "#86e0b0");
    this.sendSquad(id, true);
  }

  // ---------- Chiến đấu ----------
  attack(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.atkCd > 0 || d.travelling || this.pctl(d).noAtk) return; // Choáng: không đánh
    // Bộ hồn hạch Linh Miêu 4 món (5.2): đang tăng tốc đánh thì hồi chiêu đánh thường ngắn lại.
    d.atkCd = ATTACK_CD / (1 + (d.haste > 0 ? d.coreFx.haste ?? 0 : 0));
    if (this.map.inSafe(p.x, p.y)) { d.atkCd = 1; return this.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c"); }
    this.unhide(p, d);
    const ax = p.x + d.dir.x * 10, ay = p.y - 6 + d.dir.y * 10;
    this.broadcast("fx", { k: "slash", id, dx: d.dir.x, dy: d.dir.y, col: VOHON[p.vh].col });
    const hit: Hit = { kind: "attack", done: false };
    const near = [...this.state.beasts.entries()].filter(([, b]) => Math.hypot(b.x - ax, b.y - TIERS[b.tier].size / 2 - ay) < 18 + TIERS[b.tier].size / 2);
    // Bộ Hạo Thiên 4 món (5.2): đòn thường trúng thứ comboN liên tiếp (cách nhau không quá comboGap giây) thêm sát thương; trượt thì đếm lại.
    let mult = 1;
    if (d.coreFx.combo) {
      d.combo = near.length ? (d.comboT <= CORE_FX_RULE.comboGap ? d.combo + 1 : 1) : 0; d.comboT = 0;
      if (d.combo >= CORE_FX_RULE.comboN) { d.combo = 0; mult += d.coreFx.combo; this.broadcast("fx", { k: "combo", id, col: CORE_SETS[coreSetIndex("hao_thien")].col }); }
    }
    for (const [bid] of near) this.damageBeast(bid, this.atkOf(d) * mult * (0.85 + Math.random() * 0.3), id, VOHON[p.vh].col, hit);
  }

  /** Độ lớn hiệu ứng có lợi `b` đang có trên hồn sư (0 = không có), cộng cả bị động hồn cốt cùng tên (4.3) của võ hồn ra trận. */
  buffV(d: PData, b: BuffId) { return (d.buffs.get(b)?.v ?? 0) + (d.passive.buff[b as PassiveBuff] ?? 0); }
  /** Công hiện tại của võ hồn ra trận, tính cả hiệu ứng tăng công. */
  atkOf(d: PData) { return d.atk * (1 + this.buffV(d, "atk")); }
  /** Đồng bộ PlayerState.buff (bit theo BUFF_IDS) để mọi người thấy hào quang. */
  syncBuffs(p: PlayerState, d: PData) { let m = 0; for (const b of d.buffs.keys()) m |= buffBit(b); p.buff = m; }
  /**
   * Ràng buộc (BONDS, 2.5d, chờ chốt): tổng hiệu ứng `k` của các cặp võ hồn cùng trong đội của hồn sư (ô bất kỳ, kể cả đang gục),
   * võ hồn nào ra trận cũng hưởng.
   */
  bondV(d: PData, k: "crit" | "burn") {
    const ids = d.team.map((r) => d.owned.find((v) => v.rowId === r)?.vohon ?? "");
    return bondsOf(ids).reduce((a, b: BondDef) => a + (b[k] ?? 0), 0);
  }
  /** Đánh thường, tung hồn kỹ hoặc tiên cơ thì hết tàng hình (Yêu Hồ, 2.5c). */
  unhide(p: PlayerState, d: PData) { if (d.buffs.delete("hide")) this.syncBuffs(p, d); }

  /** Hồn thú gần hồn sư nhất trong bán kính r. */
  nearestBeast(p: PlayerState, r: number) {
    let best: string | undefined, bd = r;
    for (const [bid, b] of this.state.beasts.entries()) { const dd = Math.hypot(b.x - p.x, b.y - p.y); if (dd < bd) { bd = dd; best = bid; } }
    return best;
  }

  /** Hồn thú còn ít sinh lực nhất (theo tỉ lệ) trong bán kính r; bằng nhau thì con gần hơn (Nguyệt Nhận khóa mục tiêu yếu máu). */
  weakestBeast(p: PlayerState, r: number) {
    let best: string | undefined, bf = 2, bd = r;
    for (const [bid, b] of this.state.beasts.entries()) {
      const dd = Math.hypot(b.x - p.x, b.y - p.y), f = b.hp / Math.max(1, b.maxHp);
      if (dd < r && (f < bf - 1e-6 || (Math.abs(f - bf) <= 1e-6 && dd < bd))) { bf = f; bd = dd; best = bid; }
    }
    return best;
  }

  /** Lướt theo d.dir tối đa `dist` pixel, dừng khi vướng vật cản. Trả về quãng đã lướt. */
  dashStep(p: PlayerState, d: PData, dist: number) {
    let moved = 0;
    while (moved < dist && !this.map.hits(p.x + d.dir.x * 2, p.y + d.dir.y * 2, 5, 4)) { p.x += d.dir.x * 2; p.y += d.dir.y * 2; moved += 2; }
    return moved;
  }

  /** Quay mặt về hồn thú `b` rồi lướt tới sát nó (tối đa `dist`). */
  dashTo(p: PlayerState, d: PData, b: BeastState, dist: number) {
    const dd = Math.max(1, Math.hypot(b.x - p.x, b.y - p.y));
    d.dir = { x: (b.x - p.x) / dd, y: (b.y - p.y) / dd }; p.dir = dir4(d.dir.x, d.dir.y);
    return this.dashStep(p, d, Math.min(dist, Math.max(0, dd - TIERS[b.tier].size / 2 - 8)));
  }

  /** Kéo hồn thú về sát hồn sư (gom quái), từng bước nhỏ để không xuyên vật cản. */
  pullBeast(bid: string, p: PlayerState) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid); if (!b || !bd) return;
    const hw = Math.max(3, TIERS[b.tier].size / 3);
    for (let k = 0; k < 40; k++) {
      const dx = p.x - b.x, dy = p.y - b.y, dd = Math.hypot(dx, dy), stop = TIERS[b.tier].size / 2 + 8;
      if (dd <= stop) break;
      const s = Math.min(4, dd - stop), x0 = b.x, y0 = b.y;
      this.moveBeast(b, (dx / dd) * s, (dy / dd) * s, hw); // không kéo vào vùng an toàn
      if (b.x === x0 && b.y === y0) break;
    }
    bd.kx = 0; bd.ky = 0;
  }

  /**
   * Đẩy lùi hồn thú ra xa hồn sư `dist` pixel (nhân CC_TIER_MULT theo bậc), từng bước nhỏ để không xuyên vật cản. Hồn thú đang
   * Choáng / Trói không bị đẩy (mục 5.1), và không bị đẩy vào vùng an toàn (moveBeast).
   */
  pushBeast(bid: string, p: PlayerState, dist: number) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid); if (!b || !bd || bd.st.has("stun") || bd.st.has("root")) return;
    const hw = Math.max(3, TIERS[b.tier].size / 3), dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1;
    let left = dist * (CC_TIER_MULT[b.tier] ?? 1);
    while (left > 0) {
      const s = Math.min(4, left), x0 = b.x, y0 = b.y;
      this.moveBeast(b, (dx / dd) * s, (dy / dd) * s, hw); left -= s;
      if (b.x === x0 && b.y === y0) break;
    }
  }

  /** Hẹn chạy `fn` sau `t` giây (trong tick). */
  later(t: number, fn: () => void) { this.timers.push({ t, fn }); }

  /** Hồi sinh lực theo tỉ lệ cho võ hồn ra trận và mọi võ hồn chưa gục trong đội (Hộ Thể, Vô Địch Thần Quang). */
  healTeam(id: string, frac: number) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    d.hpF = Math.min(p.maxHp, d.hpF + p.maxHp * frac); p.hp = Math.ceil(d.hpF);
    for (const r of d.team) {
      const v = d.owned.find((o) => o.rowId === r);
      if (!v || v === d.ch || d.down.has(r) || !d.benchHp.has(r)) continue;
      const max = this.maxHpOf(d, v), hp = d.benchHp.get(r)! + max * frac;
      if (hp >= max) d.benchHp.delete(r); else d.benchHp.set(r, hp);
    }
  }

  /** Hiệu ứng lên bản thân của hồn kỹ (SkillDef.self): hiệu ứng có lợi, hồi sinh lực cả đội, khiên, hồi hồn lực; nhân `bpow`. */
  selfEffect(id: string, e: NonNullable<SkillDef["self"]>, bpow: number, col: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, secs = e.secs ?? 5;
    for (const [b, v] of Object.entries(e.buff ?? {}) as [BuffId, number][]) {
      const cur = d.buffs.get(b), val = b === "inv" || b === "hide" ? 1 : v * bpow;
      d.buffs.set(b, { t: Math.max(cur?.t ?? 0, secs), v: Math.max(cur?.v ?? 0, val) });
    }
    this.syncBuffs(p, d);
    const hm = 1 + (d.coreFx.heal ?? 0); // bộ hồn hạch Lưu Ly 2 món (5.2): hồi máu và khiên mạnh thêm
    if (e.heal) this.healTeam(id, e.heal * bpow * hm);
    if (e.shield) { d.shield = Math.max(d.shield, Math.round(p.maxHp * e.shield * bpow * hm)); d.shieldT = Math.max(d.shieldT, secs); p.shield = d.shield; }
    if (e.mp) { d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * e.mp * bpow); p.mp = Math.floor(d.mpF); }
    if (e.cleanse) this.clearPStatus(p, d); // giải khống chế (Xúc Xích, từ 3.5)
    this.broadcast("fx", { k: "buff", id, col });
  }

  /**
   * Bộ máy hồn kỹ theo dữ liệu (SkillDef trong shared/data.ts) cho hồn kỹ chung, hồn kỹ riêng và chiêu tiên cơ riêng.
   * `power`: sức mạnh (skillPower theo số năm hồn hoàn của vòng, hoặc tienCoDmgMult cho tiên cơ); `bpow`: hệ số hiệu ứng lên
   * bản thân (buffPower). `hit`: đòn tạo năng lượng tiên cơ (bỏ trống với tiên cơ). Vùng "target" không có mục tiêu thì
   * lướt theo hướng nhìn nếu có `dash` (người gọi đã kiểm tra trước với hồn kỹ thường).
   */
  runSkill(id: string, sk: SkillDef, power: number, bpow: number, col: string, hit?: Hit) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, atk = this.atkOf(d) * power;
    /** Một nhát trúng hồn thú `bid`: sát thương (kèm % sinh lực, theo tầng trạng thái) rồi gây trạng thái. */
    const strike = (bid: string, last: boolean) => {
      const b = this.state.beasts.get(bid), bd = this.bdata.get(bid); if (!b || !bd || b.hp <= 0) return;
      let dmg = atk * sk.dmg;
      if (sk.pctHp) dmg += Math.min(b.maxHp * sk.pctHp, atk * PCT_HP_CAP);
      if (sk.perStack) dmg += atk * sk.perStack.dmg * (bd.st.get(sk.perStack.s)?.n ?? 0);
      if (sk.lowHp) dmg *= 1 + sk.lowHp * (1 - b.hp / Math.max(1, b.maxHp)); // hạ mục tiêu yếu máu (Nguyệt Nhận)
      if (dmg > 0) this.damageBeast(bid, dmg, id, col, hit, { crit: sk.crit, lifesteal: sk.lifesteal });
      if (!this.state.beasts.has(bid)) return;
      if (sk.dispel) this.dispelBeast(bid, id); // xóa buff địch (Thiên Càn Trấn Áp, BĐ4)
      if (sk.push) this.pushBeast(bid, p, sk.push);
      // Viêm bạo (Hỏa Long): kích nổ mọi tầng Thiêu đốt rồi đặt lại `keep` tầng.
      if (sk.boom) { this.detonateBurn(bid, id); if (sk.boom.keep > 0) this.applyStatus(bid, { s: "burn", n: sk.boom.keep }, id, power); }
      for (const a of [...(sk.status ?? []), ...(last ? sk.finisher ?? [] : [])]) this.applyStatus(bid, a, id, power);
    };
    const near = (r: number, x = p.x, y = p.y) => [...this.state.beasts.entries()].filter(([, b]) => Math.hypot(b.x - x, b.y - y) < r).map(([bid]) => bid);
    if (sk.fly) this.broadcast("fx", { k: "fly", id, t: sk.fly, col });
    if (sk.area === "around") {
      // `n` > 1: nhiều nhát quanh vị trí hiện tại của hồn sư cách nhau `every` giây (cánh hoa xoay); nhát cuối mới gây `finisher`.
      // Từ 2.5c: `at` đặt vùng cố định tại hồn thú gần nhất (bay tới nếu có `dash`), `fixed` cố định ở chỗ hồn sư đứng lúc tung.
      const n = sk.n ?? 1;
      let at: { x: number; y: number } | null = sk.fixed ? { x: p.x, y: p.y } : null;
      if (sk.at) {
        const bid = this.nearestBeast(p, sk.at), b = bid ? this.state.beasts.get(bid) : undefined;
        if (b && sk.dash) { const x0 = p.x, y0 = p.y; if (this.dashTo(p, d, b, sk.dash) > 0) this.broadcast("fx", { k: "trail", x0, y0, x1: p.x, y1: p.y, col }); }
        at = b ? { x: b.x, y: b.y } : { x: p.x, y: p.y };
      }
      if (at && n > 1) this.broadcast("fx", { k: "zone", x: at.x, y: at.y - 4, r: sk.r, t: n * (sk.every ?? 0.15), col });
      for (let k = 0; k < n; k++) {
        const go = () => {
          const me = this.state.players.get(id); if (me !== p || me.dead) return;
          const cx = at?.x ?? p.x, cy = at?.y ?? p.y;
          this.broadcast("fx", { k: "wave", x: cx, y: cy - 6, r: sk.r, col, ...(sk.shake && k === 0 ? { shake: 0.5 } : {}) });
          const ids = near(sk.r, cx, cy);
          if (sk.pull) { this.broadcast("fx", { k: "pull", x: p.x, y: p.y - 4, r: sk.r, col }); for (const bid of ids) this.pullBeast(bid, p); }
          for (const bid of ids) strike(bid, k === n - 1);
        };
        if (k === 0) go(); else this.later(k * (sk.every ?? 0.15), go);
      }
    } else if (sk.area === "front") {
      this.broadcast("fx", { k: "arc", id, x: p.x, y: p.y - 6, dx: d.dir.x, dy: d.dir.y, r: sk.r, col });
      for (const [bid, b] of this.state.beasts.entries()) {
        const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1;
        if (dd < sk.r + TIERS[b.tier].size / 2 && (dx * d.dir.x + dy * d.dir.y) / dd > 0.2) strike(bid, true);
      }
    } else if (sk.area === "dash") {
      const sx = p.x, sy = p.y, dist = this.dashStep(p, d, sk.r);
      this.broadcast("fx", { k: "trail", x0: sx, y0: sy, x1: p.x, y1: p.y, col });
      const L = Math.max(1, dist), ux = (p.x - sx) / L, uy = (p.y - sy) / L;
      for (const [bid, b] of this.state.beasts.entries()) {
        const bx = b.x - sx, by = b.y - sy, pr = Math.max(0, Math.min(L, bx * ux + by * uy));
        if (Math.hypot(bx - ux * pr, by - uy * pr) < 14 + TIERS[b.tier].size / 2) strike(bid, true);
      }
    } else if (sk.area === "proj") {
      const n = sk.n ?? 1, spread = (sk.spread ?? 0) * Math.PI / 180, ring = spread >= Math.PI * 2 - 1e-6, a0 = Math.atan2(d.dir.y, d.dir.x);
      for (let k = 0; k < n; k++) {
        const a = ring ? (k / n) * Math.PI * 2 : a0 + (n > 1 ? (k / (n - 1) - 0.5) * spread : 0);
        this.projs.push({ x: p.x, y: p.y - 8, vx: Math.cos(a) * PROJ_SPEED, vy: Math.sin(a) * PROJ_SPEED, life: sk.r / PROJ_SPEED, owner: id, fire: (bid) => strike(bid, true) });
      }
      this.broadcast("fx", ring ? { k: "burst", x: p.x, y: p.y - 8, col } : { k: "burst", x: p.x, y: p.y - 8, col, n, a0, spread, r: sk.r });
    } else if (sk.area === "target") {
      const bid = sk.pick === "low" ? this.weakestBeast(p, sk.r) : this.nearestBeast(p, sk.r), b = bid ? this.state.beasts.get(bid) : undefined;
      if (!bid || !b) {
        if (sk.dash) { const x0 = p.x, y0 = p.y; this.dashStep(p, d, sk.dash); this.broadcast("fx", { k: "trail", x0, y0, x1: p.x, y1: p.y, col }); }
      } else {
        if (sk.dash) { const x0 = p.x, y0 = p.y; if (this.dashTo(p, d, b, sk.dash) > 0) this.broadcast("fx", { k: "trail", x0, y0, x1: p.x, y1: p.y, col }); }
        const n = sk.n ?? 1;
        for (let k = 0; k < n; k++) {
          const go = () => {
            const me = this.state.players.get(id), t = this.state.beasts.get(bid);
            if (!me || me.dead || !t) return;
            this.broadcast("fx", { k: "claw", x: t.x, y: t.y - TIERS[t.tier].size / 2, col, i: k });
            strike(bid, k === n - 1);
          };
          if (k === 0) go(); else this.later(k * (sk.every ?? 0.15), go);
        }
      }
    }
    if (sk.self) this.selfEffect(id, sk.self, bpow, col);
    if (sk.inv) d.inv = Math.max(d.inv, sk.inv);
  }

  // ---------- Trạng thái dùng chung trên hồn thú (mục 5.1) ----------
  /**
   * Gây trạng thái `a` lên hồn thú `bid`, người gây `by`, sức mạnh hồn kỹ `power`. Cộng dồn tầng tới STATUS.max, thời gian lấy
   * phần còn lại dài hơn, độ lớn lấy giá trị mạnh hơn. Khống chế ngắn hơn với hồn thú bậc cao (CC_TIER_MULT).
   */
  applyStatus(bid: string, a: StatusApply, by: string, power = 1) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), pd = this.pdata.get(by), p = this.state.players.get(by);
    // Như damageBeast: đang chuyển bản đồ hoặc đứng trong vùng an toàn thì không gây trạng thái.
    if (!b || !bd || b.hp <= 0 || !pd || !p || pd.travelling || this.map.inSafe(p.x, p.y)) return;
    const def = STATUS[a.s], fx = pd.coreFx;
    // Thú vương đang gầm chuyển giai đoạn (BĐ5): không nhận khống chế.
    if (bd.elite?.king?.roar && (def.noMove || def.noAtk || def.noSkill || def.wander)) return;
    if (a.s === "allure" && bd.st.has("charm")) return; // đang Mê hoặc thì không cộng Mị hoặc (không khống chế nối liền)
    // Bộ hồn hạch Lam Ngân 2 món (5.2): khống chế do hồn sư gây kéo dài hơn.
    const secs = (a.secs ?? def.secs) * (def.noMove || def.noAtk ? CC_TIER_MULT[b.tier] ?? 1 : 1) * (isCcStatus(a.s) ? 1 + (fx.cc ?? 0) : 1);
    // Ràng buộc Tà Hỏa – Hỏa Ảnh (2.5d), bộ hồn hạch Phượng Hoàng / Xà Hoàng 2 món (5.2): Thiêu đốt / Trúng độc của hồn sư mạnh
    // thêm, tính lúc gây như tăng công.
    const amp = a.s === "burn" ? this.bondV(pd, "burn") + (fx.burn ?? 0) : a.s === "poison" ? fx.poison ?? 0 : 0;
    const v = def.dot ? this.atkOf(pd) * def.dot * power * (1 + amp) : def.amp;
    // Bộ Phượng Hoàng 4 món: Thiêu đốt của hồn sư thêm tầng tối đa (người khác gây tiếp không làm giảm số tầng đang có).
    const max = def.max + (a.s === "burn" ? fx.burnMax ?? 0 : 0);
    const cur = bd.st.get(a.s), n = a.n ?? 1;
    if (cur) { cur.n = Math.max(cur.n, Math.min(max, cur.n + n)); cur.t = Math.max(cur.t, secs); cur.v = Math.max(cur.v, v); cur.src = by; }
    else bd.st.set(a.s, { t: secs, n: Math.min(max, n), v, src: by });
    if (def.noMove) { bd.kx = 0; bd.ky = 0; }
    // Đủ tầng thì bùng phát (2.5c): Mị hoặc thành Mê hoặc, Phong ấn thành Dễ thương 6,8 giây; tầng về 0.
    if (def.burst && bd.st.get(a.s)!.n >= def.max) {
      bd.st.delete(a.s);
      this.applyStatus(bid, { s: def.burst.s, ...(def.burst.secs ? { secs: def.burst.secs } : {}) }, by, power);
      if (STATUS[def.burst.s].wander) { bd.target = null; b.aggro = false; }
    }
    this.syncStatus(b, bd);
  }

  /** Đồng bộ trạng thái hồn thú cho client: bit theo STATUS_IDS và số tầng Thiêu đốt / Trúng độc / Phá giáp / Mị hoặc / Phong ấn. */
  syncStatus(b: BeastState, bd: BData) {
    let m = 0; for (const s of bd.st.keys()) m |= statusBit(s);
    b.st = m; b.burn = bd.st.get("burn")?.n ?? 0; b.poison = bd.st.get("poison")?.n ?? 0; b.armor = bd.st.get("armor")?.n ?? 0;
    b.allure = bd.st.get("allure")?.n ?? 0; b.lock = bd.st.get("lock")?.n ?? 0;
  }

  /**
   * Viêm bạo: kích nổ mọi tầng Thiêu đốt còn lại cùng lúc (sát thương còn lại × boom), xóa Thiêu đốt. Hỏa Long dùng (SkillDef.boom, 2.5b).
   * `by`: người kích nổ; bộ hồn hạch Phượng Hoàng 4 món của người đó (không có `by` thì của người gây Thiêu đốt) thêm sát thương (5.2).
   */
  detonateBurn(bid: string, by?: string) {
    const bd = this.bdata.get(bid), s = bd?.st.get("burn"); if (!bd || !s) return;
    bd.st.delete("burn"); this.syncStatus(this.state.beasts.get(bid)!, bd);
    const boom = 1 + (this.pdata.get(by ?? s.src)?.coreFx.boom ?? 0);
    this.damageBeast(bid, s.v * s.n * s.t * STATUS.burn.boom * boom, s.src, STATUS.burn.col, undefined, { direct: false });
  }

  /** Mỗi tick: trạng thái hết giờ thì bỏ; mỗi STATUS_TICK giây Thiêu đốt / Trúng độc gây sát thương (người gây đã rời thì bỏ). */
  tickStatus(bid: string, dt: number) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid); if (!b || !bd || !bd.st.size) return;
    bd.dotT += dt;
    const dots: [StatusId, SInst][] = [];
    if (bd.dotT >= STATUS_TICK) { bd.dotT -= STATUS_TICK; for (const [s, x] of bd.st) if (STATUS[s].dot) dots.push([s, { ...x }]); }
    let changed = false;
    for (const [s, x] of bd.st) { x.t -= dt; if (x.t <= 0) { bd.st.delete(s); changed = true; } }
    if (changed) this.syncStatus(b, bd);
    for (const [s, x] of dots) {
      if (!this.state.players.has(x.src)) { bd.st.delete(s); this.syncStatus(b, bd); continue; }
      if (!this.state.beasts.has(bid)) return;
      this.damageBeast(bid, x.v * x.n, x.src, STATUS[s].col, undefined, { direct: false });
    }
    if (!bd.st.size) bd.dotT = 0;
  }

  /** Hồn thú không mục tiêu, không bị đánh BEAST_REGEN.delay giây thì hồi máu; Trúng độc giảm hồi máu (healCut). */
  regenBeast(b: BeastState, bd: BData, dt: number) {
    if (b.hp >= b.maxHp || b.hp <= 0) { bd.regen = 0; return; }
    bd.regen += b.maxHp * BEAST_REGEN.pct * dt * (bd.st.has("poison") ? 1 - STATUS.poison.healCut : 1);
    const add = Math.floor(bd.regen); if (add > 0) { bd.regen -= add; b.hp = Math.min(b.maxHp, b.hp + add); }
  }

  // ---------- Chiêu có báo trước của hồn thú (mục 5.3, 5.4; bước 3.5) ----------
  /**
   * Hồn thú `bid` bắt đầu báo trước chiêu `s` nhắm hồn sư `pid`: khóa vùng (hướng vệt / nón, tâm vòng dưới chân mục tiêu) theo vị
   * trí lúc này, gửi `fx tele` (vùng và thời lượng) cho mọi người. Hồn thú đứng yên, không đánh thường cho tới khi tung.
   */
  beginCast(bid: string, b: BeastState, bd: BData, s: BData["skills"][number], pid: string, tgt: PlayerState) {
    const def = s.def, ang = Math.atan2(tgt.y - b.y, tgt.x - b.x);
    // Từ BĐ4 một chiêu có thể có nhiều vùng (teleZones); fx gửi vùng đầu như 3.5, các vùng còn lại trong `parts`.
    // Từ BĐ5 vòng rơi ngẫu nhiên (`scatter`, Độc Châm Vũ) do server tung.
    const teles = teleZones(def, b.x, b.y, tgt.x, tgt.y, Math.random);
    bd.cast = { def, teles, t: def.warn, target: pid };
    s.cd = def.cd * (0.8 + Math.random() * 0.4);
    b.cast = true; b.moving = false; if (Math.abs(Math.cos(ang)) > 0.1) b.face = Math.cos(ang) > 0 ? 1 : -1;
    this.broadcast("fx", { k: "tele", bid, name: def.name, ...teles[0], parts: teles.slice(1), t: def.warn });
  }

  /** Bỏ chiêu đang báo trước (hồn thú bị Choáng / Câm lặng / Mê hoặc: "ngắt chiêu"); client xóa vùng cảnh báo. */
  cancelCast(bid: string, b: BeastState, bd: BData) {
    if (!bd.cast) return;
    bd.cast = null; b.cast = false; bd.skT = Math.max(bd.skT, 1);
    this.broadcast("fx", { k: "teleEnd", bid });
  }

  /**
   * Hết thời gian báo trước: tính trúng theo vị trí THẬT của mọi hồn sư lúc này (teleHits). Không trúng người đã gục, đang chuyển
   * bản đồ hay đứng trong vùng an toàn (mục 5.3); hurtPlayer bỏ qua người đang bất tử / miễn sát thương (khi đó cũng không dính
   * trạng thái). Có `dash` thì hồn thú lao tới cuối vệt / tâm vòng (dừng khi vướng, không vào vùng an toàn).
   */
  fireCast(bid: string, b: BeastState, bd: BData) {
    const c = bd.cast!, def = c.def, x0 = b.x, y0 = b.y, main = c.teles[Math.floor(c.teles.length / 2)], base = this.beastDmg(bd);
    bd.cast = null; b.cast = false; bd.skT = Math.max(bd.skT, 1.2);
    const hit: string[] = [];
    this.state.players.forEach((p, pid) => {
      const d = this.pdata.get(pid);
      if (d && !p.dead && !d.travelling && !this.map.inSafe(p.x, p.y) && c.teles.some((t) => teleHits(t, p.x, p.y))) hit.push(pid);
    });
    if (def.dash) {
      // Nhiều vùng (BĐ4): lao theo vùng giữa.
      const tx = def.shape === "line" ? main.x + Math.cos(main.ang) * def.r : main.x, ty = def.shape === "line" ? main.y + Math.sin(main.ang) * def.r : main.y;
      const hw = Math.max(3, TIERS[b.tier].size / 3), n = Math.ceil(Math.hypot(tx - b.x, ty - b.y) / 6);
      for (let k = 0; k < n; k++) this.moveBeast(b, (tx - x0) / n, (ty - y0) / n, hw);
    }
    this.broadcast("fx", { k: "teleHit", bid, name: def.name, ...c.teles[0], parts: c.teles.slice(1), hit, x0, y0, x1: b.x, y1: b.y });
    for (const pid of hit) {
      if (!this.hurtPlayer(pid, base * def.dmg * (0.9 + Math.random() * 0.2))) continue;
      for (const a of def.status ?? []) this.applyPStatus(pid, a, base);
      if (def.pull) this.pullPlayer(pid, b, def.pull);
    }
    if (def.summon) this.summonPack(b, bd, def.summon, c.target);
  }

  /** Kéo hồn sư `id` về phía hồn thú `b` tối đa `dist` pixel (Quấn Kéo, Lưỡi Quất; BĐ4): dừng khi vướng, sát hồn thú hoặc sắp vào vùng an toàn. */
  pullPlayer(id: string, b: BeastState, dist: number) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || p.dead || d.travelling) return;
    const dd = Math.hypot(b.x - p.x, b.y - p.y), go = Math.min(dist, dd - TIERS[b.tier].size / 2 - 8); if (go <= 0) return;
    const ux = (b.x - p.x) / dd, uy = (b.y - p.y) / dd;
    for (let moved = 0; moved < go; moved += 2) {
      const ox = p.x, oy = p.y;
      this.map.moveEnt(p, ux * 2, uy * 2, 5, 4);
      if (this.map.inSafe(p.x, p.y)) { p.x = ox; p.y = oy; break; }
      if (p.x === ox && p.y === oy) break;
    }
  }

  /**
   * Gọi bầy (Hú Bầy; BeastSkillDef.summon, BĐ4): thêm hồn thú loài `s.species` quanh thân tới khi đủ `s.n` con do hồn thú này gọi còn
   * sống. Hồn thú gọi ra thuộc vùng của người gọi (tính vào `count` của vùng, nên vùng không sinh thêm cho tới khi chúng bị hạ), tuổi tung
   * trong `years` của vùng, lao ngay vào mục tiêu của người gọi.
   */
  summonPack(b: BeastState, bd: BData, s: NonNullable<BeastSkillDef["summon"]>, target: string) {
    const sp = beastIndex(s.species), z = this.map.zones[bd.zone]; if (sp < 0 || !z) return;
    for (const m of bd.minions) if (!this.state.beasts.has(m)) bd.minions.delete(m);
    for (let tries = 0; bd.minions.size < s.n && tries < 20; tries++) {
      const a = Math.random() * Math.PI * 2, x = b.x + Math.cos(a) * 28, y = b.y + Math.sin(a) * 20;
      if (this.map.hits(x, y, 6, 4) || this.map.inSafe(x, y)) continue;
      const yr = s.years ?? z.years, years = yr ? rollYears(yr[0], yr[1], Math.random()) : b.years; // thú vương gọi nhện con trẻ hơn (summon.years)
      const mid = this.addBeast(bd.zone, years, sp, x, y), mb = this.bdata.get(mid)!;
      if (this.state.players.has(target)) { mb.target = target; this.state.beasts.get(mid)!.aggro = true; mb.skT = TELE_FIRST[1]; }
      bd.minions.add(mid);
      this.broadcast("fx", { k: "wave", x, y, r: 14, col: b.rank ? BOSSES[b.species]?.aura : TIERS[b.tier].glow });
    }
  }

  /** Mỗi tick của hồn thú đang báo trước: Choáng / Câm lặng / Mê hoặc ngắt chiêu; hết giờ thì tung. */
  tickCast(bid: string, b: BeastState, bd: BData, dt: number, interrupt: boolean) {
    if (!bd.cast) return;
    if (interrupt) return this.cancelCast(bid, b, bd);
    if ((bd.cast.t -= dt) <= 0) this.fireCast(bid, b, bd);
  }

  // ---------- Trạng thái trên hồn sư (từ 3.5, PLAYER_STATUS) ----------
  /**
   * Gây trạng thái `a` lên hồn sư `id` (do chiêu báo trước, `base`: sát thương đòn thường của hồn thú, nhân `dot` thành sát thương
   * mỗi giây mỗi tầng). Cùng luật cộng tầng với hồn thú (applyStatus). Không gây cho người đã gục, đang chuyển bản đồ, trong vùng an toàn.
   */
  applyPStatus(id: string, a: StatusApply, base: number) {
    const p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.travelling || this.map.inSafe(p.x, p.y) || !PLAYER_STATUS.includes(a.s)) return;
    // Kháng trạng thái của bị động hồn cốt (4.3): thời gian ngắn đi theo tỉ lệ.
    const def = STATUS[a.s], secs = (a.secs ?? def.secs) * (1 - (d.passive.resist[a.s] ?? 0)), v = def.dot ? base * def.dot : def.amp, cur = d.st.get(a.s), n = a.n ?? 1;
    if (cur) { cur.n = Math.min(def.max, cur.n + n); cur.t = Math.max(cur.t, secs); cur.v = Math.max(cur.v, v); }
    else d.st.set(a.s, { t: secs, n: Math.min(def.max, n), v, src: "" });
    this.syncPStatus(p, d); // Trói / Choáng: tick bỏ qua input (giữ nguyên hướng phím, hết khống chế thì đi tiếp)
  }
  syncPStatus(p: PlayerState, d: PData) { let m = 0; for (const s of d.st.keys()) m |= statusBit(s); p.st = m; }
  clearPStatus(p: PlayerState, d: PData) { if (d.st.size) { d.st.clear(); d.dotT = 0; this.syncPStatus(p, d); } }
  /** Khống chế đang có trên hồn sư: không đi (Choáng, Trói), không đánh (Choáng), không dùng hồn kỹ (Choáng, Câm lặng), làm chậm. */
  pctl(d: PData) {
    let noMove = false, noAtk = false, noSkill = false, slow = 0;
    for (const [s, x] of d.st) { const def = STATUS[s]; noMove ||= def.noMove; noAtk ||= def.noAtk; noSkill ||= def.noAtk || def.noSkill; slow += def.slow * x.n; }
    return { noMove, noAtk, noSkill, slow: Math.min(SLOW_CAP, slow) };
  }
  /** Mỗi tick: vào vùng an toàn thì hết mọi trạng thái; hết giờ thì bỏ; mỗi STATUS_TICK giây Trúng độc / Thiêu đốt gây sát thương. */
  tickPStatus(id: string, p: PlayerState, d: PData, dt: number) {
    if (!d.st.size) return;
    if (this.map.inSafe(p.x, p.y)) return this.clearPStatus(p, d);
    d.dotT += dt;
    let dot = 0;
    if (d.dotT >= STATUS_TICK) { d.dotT -= STATUS_TICK; for (const [s, x] of d.st) if (STATUS[s].dot) dot += x.v * x.n; }
    let changed = false;
    for (const [s, x] of d.st) { x.t -= dt; if (x.t <= 0) { d.st.delete(s); changed = true; } }
    if (changed) this.syncPStatus(p, d);
    if (!d.st.size) d.dotT = 0;
    if (dot > 0) this.hurtPlayer(id, dot, { dot: true });
  }

  /**
   * Hồn kỹ ở ô `i` (U/I/O/P): hồn kỹ riêng của võ hồn ra trận nếu có (VOHON_SKILLS), không thì 4 hồn kỹ dùng chung. Hồn kỹ thứ i
   * mở khi có hồn hoàn thứ i, mạnh theo số năm của hồn hoàn đó (skillPower, mục 5.2). Hồn kỹ đánh một mục tiêu mà không có
   * hồn thú trong tầm thì không tung (không tốn hồn lực, không hồi chiêu).
   */
  skill(c: Client, i: number) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.travelling || !(i >= 0 && i < 4)) return;
    if (this.map.inSafe(p.x, p.y)) return this.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c");
    if (i >= p.rings.length) return this.log(id, `Hồn kỹ ${i + 1} cần hồn hoàn thứ ${i + 1}.`);
    if (p.cds[i] > 0) return;
    if (this.pctl(d).noSkill) return this.log(id, `Đang bị ${d.st.has("stun") ? STATUS.stun.name : STATUS.silence.name}: không dùng được hồn kỹ.`, "#ffb35c");
    const set = skillsOf(VOHON[p.vh].id), sk = set[i], cost = sk.cost * (1 - Math.min(0.9, this.buffV(d, "mp")));
    // Phục Chế (Xúc Xích, 2.5c): tung lại hồn kỹ gần nhất của võ hồn khác còn trong đội; chưa có thì không tung.
    // Võ hồn nguồn phải còn trong đội và chưa gục.
    const last = d.lastSkill, src = sk.copy && last && last.row !== d.ch.rowId && d.team.includes(last.row) && !d.down.has(last.row) ? last : null;
    if (sk.copy && !src) return this.log(id, `${sk.name}: chưa có hồn kỹ của võ hồn khác trong đội (chưa gục) để sao chép.`);
    const run = src?.sk ?? sk;
    if (d.mpF < cost) return this.log(id, "Không đủ hồn lực.");
    const reach = run.area === "target" ? run.r : run.at;
    if (reach && !this.nearestBeast(p, reach)) return this.log(id, `${run.name}: không có hồn thú trong tầm.`);
    d.mpF -= cost; p.cds[i] = sk.cd;
    this.unhide(p, d);
    const tier = p.rings[i], years = d.ringYears[i] ?? TIERS[tier].years;
    this.broadcast("fx", { k: "soulring", id, tier, i, vh: p.vh }); // i: vòng hồn hoàn của hồn kỹ, client làm sáng vòng đó và hiện tên hồn kỹ
    if (src) this.log(id, `${sk.name}: sao chép ${run.name}.`, VOHON[p.vh].col);
    // Phục Chế nhân `copy` cả sát thương lẫn hiệu ứng lên bản thân (hồi máu, khiên, hồn lực, hiệu ứng có lợi; inv/hide giữ nguyên).
    const mult = sk.copy ?? 1, hit: Hit = { kind: "skill", done: false };
    // Bộ hồn hạch Lam Ngân 4 món (5.2): hồn kỹ có gây khống chế, trúng ít nhất một hồn thú thì hồi hồn lực (một lần mỗi lần tung).
    const ccMp = d.coreFx.ccMp ?? 0;
    if (ccMp && [...(run.status ?? []), ...(run.finisher ?? [])].some((a) => isCcStatus(a.s))) hit.onHit = () => {
      const q = this.state.players.get(id); if (q !== p || p.dead) return;
      d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * ccMp); p.mp = Math.floor(d.mpF);
    };
    this.runSkill(id, run, skillPower(years) * mult, buffPower(years) * mult, run.glow ? TIERS[tier].glow : VOHON[p.vh].col, hit);
    if (!set.some((x) => x.copy)) d.lastSkill = { sk, row: d.ch.rowId };
  }

  /**
   * Kỹ năng chủ động của hồn cốt (mục 5.5, bước 4.3) ở nút `i` (BONE_ACTIVE_SLOTS: đầu, tay trái, tay phải) của võ hồn ĐANG RA TRẬN.
   * Kỹ năng theo loài hồn thú gốc (BONE_SKILLS), mạnh theo số năm hồn cốt (skillPower / buffPower như hồn kỹ), chạy bằng runSkill.
   * Mỗi nút một hồi chiêu riêng (`PlayerState.bcds`, thuộc hồn sư: đổi võ hồn không làm mới), tốn hồn lực. Cùng luật chặn với hồn kỹ:
   * gục, hấp thụ, đang chuyển bản đồ / niệm cổng, vùng an toàn, Choáng / Câm lặng; kỹ năng đánh một mục tiêu mà không có hồn thú
   * trong tầm thì không tung (không tốn hồn lực, không hồi chiêu).
   */
  boneSkill(c: Client, i: number) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.travelling || !(i >= 0 && i < BONE_ACTIVE_SLOTS.length)) return;
    const slot = BONE_SLOTS[boneSlotIndex(BONE_ACTIVE_SLOTS[i])];
    const bone = this.bonesOn(d, d.ch.rowId).find((b) => b.slot === slot.id);
    const k = bone ? boneSkillOf(bone.beast, bone.slot) : null;
    if (!bone || !k?.active) return this.log(id, `Ô ${slot.name} của ${VOHON[p.vh].name} chưa gắn hồn cốt có kỹ năng chủ động.`, "#ffb35c");
    if (d.travelCast) return this.log(id, "Đang đi qua cổng: không dùng được kỹ năng hồn cốt.", "#ffb35c");
    if (this.map.inSafe(p.x, p.y)) return this.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c");
    if (p.bcds[i] > 0) return;
    if (this.pctl(d).noSkill) return this.log(id, `Đang bị ${d.st.has("stun") ? STATUS.stun.name : STATUS.silence.name}: không dùng được kỹ năng hồn cốt.`, "#ffb35c");
    const sk = k.sk, cost = sk.cost * (1 - Math.min(0.9, this.buffV(d, "mp")));
    if (d.mpF < cost) return this.log(id, "Không đủ hồn lực.");
    const reach = sk.area === "target" ? sk.r : sk.at;
    if (reach && !this.nearestBeast(p, reach)) return this.log(id, `${sk.name}: không có hồn thú trong tầm.`);
    d.mpF -= cost; p.mp = Math.floor(d.mpF); p.bcds[i] = sk.cd;
    this.unhide(p, d);
    const tier = tierOfYears(bone.years), col = TIERS[tier].glow;
    // Client tra tên kỹ năng theo loài (chỉ số BEASTS) và vị trí; `i` là nút, hào quang theo niên hạn hồn cốt.
    this.broadcast("fx", { k: "bone", id, i, sp: beastIndex(bone.beast), tier });
    // Mốc cường hóa +5 / +10 / +15 / +20 nâng kỹ năng (4.4): sức mạnh và hiệu ứng lên bản thân nhân boneSkillMult.
    const em = boneSkillMult(bone.enhance);
    this.runSkill(id, sk, skillPower(bone.years) * em, buffPower(bone.years) * em, col, { kind: "skill", done: false });
  }

  /**
   * `hit`: đòn đánh thường / hồn kỹ tạo năng lượng tiên cơ cho đội; bỏ trống (chiêu tiên cơ, sát thương theo thời gian, lan
   * Cảm điện) thì không tạo. Dễ thương tăng mọi sát thương, Phá giáp tăng sát thương đòn trực tiếp; đòn trực tiếp trúng hồn
   * thú Cảm điện thì lan sang hồn thú Cảm điện gần đó. Trả về sát thương đã gây.
   * Người đang chuyển bản đồ hoặc đứng trong vùng an toàn không gây sát thương (kể cả tiên cơ, nhát hẹn giờ của hồn kỹ liên
   * hoàn, mũi đạn đang bay, sát thương theo thời gian và lan Cảm điện) và không tích năng lượng: kills / kinh nghiệm sau lúc
   * chụp dữ liệu đi cổng sẽ mất (mục 6), vùng an toàn không giao chiến (mục 5.3).
   */
  damageBeast(bid: string, dmg: number, by: string, col: string, hit?: Hit, o: DmgOpt = {}) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), p = this.state.players.get(by), pd = this.pdata.get(by);
    if (!b || !bd || !p || !pd || b.hp <= 0 || pd.travelling || this.map.inSafe(p.x, p.y)) return 0;
    const direct = o.direct !== false && !o.chain, fx = pd.coreFx;
    const vuln = bd.st.get("vuln"), armor = bd.st.get("armor"), poison = bd.st.get("poison"), shocked = bd.st.has("shock");
    // Bộ hồn hạch Xà Hoàng 4 món (5.2): Trúng độc đủ tầng do người mang bộ gây thì như Dễ thương thêm (mọi nguồn). Thất Sát 2 món:
    // "xuyên thủ" tạm quy thành thêm sát thương đòn trực tiếp (hồn thú chưa có thủ).
    const pv = poison && poison.n >= CORE_FX_RULE.poisonStacks ? this.pdata.get(poison.src)?.coreFx.poisonVuln ?? 0 : 0;
    dmg *= 1 + (vuln ? vuln.v : 0) + pv + (direct ? (armor ? armor.v * armor.n : 0) + (fx.pierce ?? 0) : 0) + this.phoenixAmp(b);
    // Chí mạng theo võ hồn ra trận (CRIT cộng hồn hạch, 5.2); bộ Thất Sát 4 món thêm tỉ lệ lên hồn thú Phá giáp.
    const crit = direct && Math.random() < pd.crit + (o.crit ?? 0) + this.buffV(pd, "crit") + this.bondV(pd, "crit") + (armor ? fx.armorCrit ?? 0 : 0);
    if (crit) dmg *= pd.critMult;
    if (crit && fx.haste) pd.haste = CORE_FX_RULE.hasteSecs; // bộ Linh Miêu 4 món: chí mạng thì tăng tốc đánh một lúc
    dmg = Math.max(1, Math.round(dmg));
    // Tinh anh (BĐ4): người gây sát thương thành người tham gia trước (máu tối đa tăng theo số người, giữ tỉ lệ), rồi mới trừ máu.
    if (bd.elite) { this.eliteJoin(b, bd, by); bd.elite.dmgBy.set(by, (bd.elite.dmgBy.get(by) ?? 0) + Math.min(dmg, b.hp)); }
    b.hp = Math.max(0, b.hp - dmg); b.aggro = true; bd.target = by; bd.hitBy = by; bd.calm = 0;
    if (o.direct !== false) pd.fight = 0; // sát thương theo thời gian không giữ hồn sư trong giao chiến
    if (direct && !bd.st.has("stun") && !bd.st.has("root")) {
      const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1, kb = b.rank >= 2 ? 0 : b.tier >= 3 ? 40 : 110; // thú vương không bị đẩy lùi
      bd.kx = (dx / dd) * kb; bd.ky = (dy / dd) * kb;
    }
    this.broadcast("dmg", { x: b.x, y: b.y - TIERS[b.tier].size, v: dmg, crit, c: crit ? "#ffe14d" : col, bid });
    if (hit && !hit.done) { hit.done = true; this.gainEnergy(by, hit.kind); this.gainLei(by, hit.kind, bd.st.has("shock")); hit.onHit?.(); }
    // Hút máu của hồn kỹ (đòn trực tiếp) cộng hút huyết `leech` của hồn sư (Quỷ Mị, 2.5d: mọi sát thương, kể cả theo thời gian và lan
    // Cảm điện), hồi cho võ hồn ra trận; cả đội đã gục thì không hồi.
    const steal = (o.lifesteal ?? 0) + this.buffV(pd, "leech");
    if (steal && !p.dead) { pd.hpF = Math.min(p.maxHp, pd.hpF + dmg * steal); p.hp = Math.ceil(pd.hpF); }
    // Bộ hồn hạch Bá Vương Long 4 món (5.2): đòn trực tiếp trúng hồn thú Cảm điện hồi hồn lực, mỗi shockMpCd giây một lần.
    if (direct && shocked && fx.shockMp && pd.shockMpCd <= 0 && !p.dead) {
      pd.shockMpCd = CORE_FX_RULE.shockMpCd; pd.mpF = Math.min(p.maxMp, pd.mpF + p.maxMp * fx.shockMp); p.mp = Math.floor(pd.mpF);
    }
    // Cảm điện: lan một phần sát thương sang hồn thú Cảm điện khác gần đó (một bước, không lan tiếp); bộ Bá Vương Long 2 món lan mạnh thêm.
    if (direct && bd.st.has("shock")) {
      const sh = STATUS.shock;
      for (const [oid, ob] of [...this.state.beasts.entries()])
        if (oid !== bid && this.bdata.get(oid)?.st.has("shock") && Math.hypot(ob.x - b.x, ob.y - b.y) < sh.chainR)
          this.damageBeast(oid, dmg * sh.chain * (1 + (fx.chain ?? 0)), by, sh.col, undefined, { chain: true });
    }
    if (b.hp <= 0) this.killBeast(bid, by);
    return dmg;
  }

  /**
   * Lãnh vực phượng hoàng (Tà Hỏa Phượng Hoàng, 2.5b): hồn thú trong PHOENIX_FIELD_R quanh một hồn sư đang có lãnh vực nhận thêm
   * sát thương từ mọi nguồn (lấy lãnh vực mạnh nhất, không cộng nhiều lãnh vực). Hồn sư đã gục, đang chuyển bản đồ hoặc đứng
   * trong vùng an toàn thì lãnh vực không có tác dụng.
   */
  phoenixAmp(b: BeastState) {
    let a = 0;
    for (const [pid, pd] of this.pdata) {
      const v = pd.buffs.get("phoenix")?.v ?? 0, pp = this.state.players.get(pid);
      if (v <= a || !pp || pp.dead || pd.travelling || this.map.inSafe(pp.x, pp.y)) continue;
      if (Math.hypot(b.x - pp.x, b.y - pp.y) < PHOENIX_FIELD_R) a = v;
    }
    return a;
  }

  /** Bộ hồn hạch Tiên Cơ (mục 5.6) gắn trên võ hồn `v` (từ 5.2): 2 món tích năng lượng nhanh hơn (khi ở ngoài), 4 món tiên cơ mạnh hơn. */
  tienCoSet(d: PData, v: Character) {
    const n = coreSetCounts(this.coresOn(d, v.rowId)).get("tien_co") ?? 0;
    return { set2: n >= CORE_SET_2, set4: n >= CORE_SET_4 };
  }

  /** Võ hồn ra trận đánh trúng: mỗi võ hồn khác trong đội chưa gục tích năng lượng tiên cơ (mục 5.1 "Trong trận"). */
  gainEnergy(id: string, kind: Hit["kind"]) {
    const d = this.pdata.get(id); if (!d) return;
    for (const r of d.team) {
      const v = d.owned.find((o) => o.rowId === r);
      if (!v || v === d.ch || d.down.has(r)) continue;
      d.energy.set(r, Math.min(TIEN_CO_MAX, (d.energy.get(r) ?? 0) + energyGain(kind, this.tienCoSet(d, v).set2)));
    }
    this.sendSquad(id);
  }

  /**
   * Phong Lôi Chi Lực (PHONG_LOI, 2.5c): Lam Điện Bá Vương Long ra trận đánh trúng thì tích (gấp shockMult nếu hồn thú trúng đầu
   * tiên đang Cảm điện). Đầy thì hẹn tung Lôi Động Minh Thiên ở tick sau (không tung giữa lúc đang tính một đòn).
   */
  gainLei(id: string, kind: Hit["kind"], shocked: boolean) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || VOHON[p.vh].id !== PHONG_LOI.vohon) return;
    d.lei = Math.min(PHONG_LOI.max, d.lei + PHONG_LOI.gain[kind] * (shocked ? PHONG_LOI.shockMult : 1)); p.lei = Math.floor(d.lei);
    if (d.lei >= PHONG_LOI.max && !d.leiQueued) { d.leiQueued = true; this.later(0, () => this.leiDong(id)); }
  }

  /** Lôi Động Minh Thiên: chỉ khi Lam Điện vẫn ra trận, còn sống, không trong vùng an toàn / đang chuyển bản đồ (không thì giữ thanh đầy). */
  leiDong(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    d.leiQueued = false;
    if (p.dead || d.travelling || VOHON[p.vh].id !== PHONG_LOI.vohon || d.lei < PHONG_LOI.max || this.map.inSafe(p.x, p.y)) return;
    d.lei = 0; p.lei = 0;
    const sk = PHONG_LOI.skill, col = VOHON[p.vh].col, years = Math.max(TIERS[0].years, ...d.ringYears);
    this.broadcast("fx", { k: "bolt", id, x: p.x, y: p.y, r: sk.r, col, name: sk.name });
    this.runSkill(id, sk, skillPower(years), 1, col);
    this.log(id, `${PHONG_LOI.name} đầy: ${sk.name}!`, col);
  }

  /** Ra khỏi giao chiến quá TIEN_CO_IDLE_SECS giây: năng lượng cả đội (và Phong Lôi Chi Lực) giảm dần mỗi giây. */
  tickEnergy(id: string, dt: number) {
    const d = this.pdata.get(id)!, idle = Math.min(dt, d.fight - TIEN_CO_IDLE_SECS);
    if (idle > 0 && d.lei > 0) { d.lei = Math.max(0, d.lei - idle * PHONG_LOI.decay); this.state.players.get(id)!.lei = Math.floor(d.lei); }
    if (idle <= 0 || !d.energy.size) return;
    for (const [r, e] of d.energy) { if (e - idle * TIEN_CO_DECAY <= 0) d.energy.delete(r); else d.energy.set(r, e - idle * TIEN_CO_DECAY); }
  }

  /**
   * Chiêu tiên cơ của võ hồn vừa đổi vào. Võ hồn có tiên cơ riêng (TIEN_CO_RIENG, bước 2.5a) chạy bằng bộ máy hồn kỹ với sức
   * mạnh tienCoDmgMult. Còn lại dùng tiên cơ chung theo hệ (bảng TIEN_CO, bước 2.4): cường công nổ diện rộng, mẫn công lướt tới
   * hồn thú gần nhất và chém mạnh, khống chế choáng diện rộng, phụ trợ hồi sinh lực cả đội và tạo khiên. Không tốn hồn lực,
   * không tạo năng lượng.
   */
  tienCo(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, def = VOHON[p.vh], he = def.he, tc = TIEN_CO[he];
    const mult = tienCoDmgMult(this.tienCoSet(d, d.ch).set4), dmg = this.atkOf(d) * tc.dmg * mult, col = def.col, x0 = p.x, y0 = p.y;
    const own = TIEN_CO_RIENG[def.id];
    this.unhide(p, d); // tung tiên cơ cũng hiện hình như đánh thường / hồn kỹ
    if (own) {
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, vh: p.vh, own: true });
      this.runSkill(id, own, mult, 1, col);
      this.log(id, `Tiên cơ – ${def.name}: ${own.name}, ${own.desc}!`, col);
      this.sendSquad(id);
      return;
    }
    if (he === "man_cong") {
      // Lướt về hồn thú gần nhất trong tầm (không có thì lướt theo hướng đang nhìn), dừng sát mục tiêu hoặc khi vướng vật cản.
      let tgt: string | undefined, b: BeastState | undefined, best = tc.range;
      for (const [bid, o] of this.state.beasts.entries()) { const dd = Math.hypot(o.x - p.x, o.y - p.y); if (dd < best) { best = dd; tgt = bid; b = o; } }
      if (b) this.dashTo(p, d, b, tc.dash); else this.dashStep(p, d, tc.dash);
      d.inv = Math.max(d.inv, 0.35);
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, x0, y0 });
      // Lướt vào vùng an toàn thì không chém (không giao chiến trong vùng an toàn).
      if (tgt && b && !this.map.inSafe(p.x, p.y) && Math.hypot(b.x - p.x, b.y - p.y) < 18 + TIERS[b.tier].size) this.damageBeast(tgt, dmg, id, col);
    } else if (he === "phu_tro") {
      const hm = 1 + (d.coreFx.heal ?? 0); // bộ hồn hạch Lưu Ly 2 món (5.2)
      this.healTeam(id, tc.heal * hm);
      d.shield = Math.max(d.shield, Math.round(p.maxHp * tc.shield * hm)); d.shieldT = tc.shieldSecs; p.shield = d.shield;
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y });
    } else {
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, r: tc.r });
      const near = [...this.state.beasts.entries()].filter(([, b]) => Math.hypot(b.x - p.x, b.y - p.y) < tc.r + TIERS[b.tier].size / 2);
      for (const [bid] of near) {
        if (tc.stun) this.applyStatus(bid, { s: "stun", secs: tc.stun }, id);
        this.damageBeast(bid, dmg, id, col);
      }
    }
    this.log(id, `Tiên cơ – ${def.name}: ${tc.name}, ${tc.desc}!`, col);
    this.sendSquad(id);
  }

  /**
   * Hạ hồn thú: kinh nghiệm, Hồn Tệ, và hồn hoàn rơi xuống đất mang đúng số năm của hồn thú (mục 5.2); người hạ được ưu tiên nhặt.
   * Tinh anh (mục 5.4, BĐ4): kinh nghiệm x ELITE.xp cho người hạ; hồn hoàn và hồn cốt ưu tiên người đóng góp nhiều nhất còn trong
   * phòng; tỉ lệ hồn cốt x ELITE.bone, hồn cốt mang loài gốc; chắc chắn rơi 1 hồn hạch (từ 5.1).
   */
  killBeast(bid: string, by: string) {
    const b = this.state.beasts.get(bid)!, e = this.bdata.get(bid)?.elite;
    const td = TIERS[b.tier], name = beastName(b.rank, b.species), age = formatYears(b.years);
    this.state.beasts.delete(bid); this.bdata.delete(bid);
    if (e?.king) return this.killKing(bid, b, e, by); // tà hóa thú vương (BĐ5): thưởng theo đóng góp, rương
    const p = this.state.players.get(by)!; p.kills++;
    this.rewardKill(by, b.years, e ? ELITE.xp : 1);
    const coin = this.rewardCoin(by, b.tier);
    let owner = by;
    if (e) for (const [pid, v] of e.dmgBy) if (this.state.players.has(pid) && v > (e.dmgBy.get(owner) ?? 0)) owner = pid;
    const drop = this.newDrop(b.x, b.y, owner);
    drop.tier = b.tier; drop.years = b.years;
    this.state.drops.set(uid("d"), drop);
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: td.size + 10, col: td.glow });
    const pick = owner === by ? `${DROP_OWNER_SECS} giây đầu chỉ bạn nhặt được (phím E).`
      : `${DROP_OWNER_SECS} giây đầu thuộc ${this.state.players.get(owner)!.name} (đóng góp nhiều nhất).`;
    this.log(by, `Hạ ${name} (${age}), nhận ${formatHonTe(coin)} Hồn Tệ. Hồn hoàn ${age} rơi xuống đất: ${pick}`, td.glow);
    if (owner !== by) this.log(owner, `Bạn đóng góp nhiều nhất khi hạ ${name}: hồn hoàn ${age} ưu tiên bạn nhặt ${DROP_OWNER_SECS} giây đầu (phím E).`, td.glow);
    if (e) this.broadcast("elite", { k: "down", name, by: p.name, col: BOSSES[b.species]?.aura });
    this.rollShard(by, b.years, b.x, b.y);
    const base = e ? Math.max(0, beastIndex(BOSSES[b.species]?.species ?? "")) : b.species;
    this.rollBone(by, owner, base, b.years, b.tier, b.x, b.y, e ? ELITE.bone : 1);
    this.rollCoreDrop(by, owner, b.years, b.x, b.y, !!e);
  }

  /**
   * Hồn hạch (bước 5.1, bảng rơi 5.3): hạ hồn thú `years` năm thì tung coreChance (tinh anh `sure`: chắc chắn rơi, mục 5.4); trúng thì
   * một hồn hạch sao theo niên hạn, bộ đặc trưng của bản đồ (MapDef.cores) hoặc bộ bất kỳ, chỉ số chính / phụ tung ngay lúc rơi
   * (giữ trong coreDrops). Rơi xuống đất cạnh hồn hoàn, cùng luật đồ rơi: `owner` ưu tiên DROP_OWNER_SECS giây, nhặt (E) vào túi,
   * túi đầy thì báo. Hook test `core` của người hạ `id` cố định được số ngẫu nhiên, sao và bộ.
   * Rương tà hóa thú vương (BĐ5, openChest) cho hồn hạch thẳng vào túi bằng `rollCore(..., { high: true })` rồi `addCore`.
   */
  rollCoreDrop(id: string, owner: string, years: number, x: number, y: number, sure = false) {
    const d = this.pdata.get(id); if (!d) return;
    const t = d.testCore;
    if ((t ? t.r : Math.random()) >= (sure ? 1 : coreChance(years))) return;
    const core = rollCore(years, MAPS[this.state.mapId]?.cores ?? [], Math.random, t ? { stars: t.stars, set: t.set >= 0 ? t.set : undefined } : {});
    // Bên phải hồn hoàn (hồn cốt nằm bên trái, mảnh võ hồn khi túi đầy sát bên phải) để biểu tượng và nhãn không chồng lên nhau.
    // Không chỗ nào đứng được (hồn thú gục sát vật cản) thì nằm đúng chỗ hồn hoàn, như hồn hoàn.
    const [cx, cy] = [[x + 16, y], [x, y + 8]].find(([a, b]) => this.map.standable(a, b)) ?? [x, y];
    const drop = this.newDrop(cx, cy, owner);
    const si = Math.max(0, coreSetIndex(core.data.set)), col = CORE_SETS[si].col;
    drop.item = CORE_ITEM; drop.qty = 1; drop.tier = tierOfYears(years); drop.years = years; drop.stars = core.stars; drop.cset = si;
    const did = uid("d");
    this.coreDrops.set(did, core); this.state.drops.set(did, drop);
    this.broadcast("fx", { k: "wave", x: drop.x, y: drop.y, r: 30, col });
    const msg = `${coreName(core.data.set, core.stars)} rơi xuống đất!`, mine = `${DROP_OWNER_SECS} giây đầu chỉ bạn nhặt được (phím E).`;
    if (owner === id) this.log(id, `${msg} ${mine}`, col);
    else {
      this.log(id, `${msg} ${DROP_OWNER_SECS} giây đầu thuộc ${this.state.players.get(owner)?.name ?? ""} (đóng góp nhiều nhất).`, col);
      this.log(owner, `${msg} ${mine}`, col);
    }
  }

  /**
   * Hồn cốt (bước 4.1, bảng rơi 5.3): hạ hồn thú `years` năm thì tung boneChance; trúng thì một hồn cốt cùng loài, cùng số năm, vị
   * trí ngẫu nhiên trong 6 vị trí, rơi xuống đất cạnh hồn hoàn. Cùng luật đồ rơi như hồn hoàn: người hạ ưu tiên DROP_OWNER_SECS
   * giây, nhặt (E) vào túi, túi đầy thì báo. Hook test `bone` của người hạ `id` cố định được số ngẫu nhiên và vị trí.
   * Tinh anh (BĐ4): `mult` = ELITE.bone, quyền ưu tiên thuộc `owner` (người đóng góp nhiều nhất, như hồn hoàn).
   */
  rollBone(id: string, owner: string, species: number, years: number, tier: number, x: number, y: number, mult = 1) {
    const d = this.pdata.get(id); if (!d) return;
    const t = d.testBone;
    if ((t ? t.r : Math.random()) >= boneChance(years, mult)) return;
    const slot = t && t.s >= 0 ? t.s % BONE_SLOTS.length : Math.floor(Math.random() * BONE_SLOTS.length);
    const drop = this.map.standable(x - 8, y) ? this.newDrop(x - 8, y, owner) : this.newDrop(x, y, owner);
    drop.item = BONE_ITEM; drop.qty = 1; drop.tier = tier; drop.years = years; drop.species = species; drop.slot = slot;
    this.state.drops.set(uid("d"), drop);
    this.broadcast("fx", { k: "wave", x: drop.x, y: drop.y, r: 30, col: TIERS[tier].glow });
    const bone = `Hồn cốt ${boneName(BEASTS[species]?.id ?? "", BONE_SLOTS[slot].id, years)} rơi xuống đất!`;
    const mine = `${DROP_OWNER_SECS} giây đầu chỉ bạn nhặt được (phím E).`;
    if (owner === id) this.log(id, `${bone} ${mine}`, TIERS[tier].glow);
    else {
      this.log(id, `${bone} ${DROP_OWNER_SECS} giây đầu thuộc ${this.state.players.get(owner)?.name ?? ""} (đóng góp nhiều nhất).`, TIERS[tier].glow);
      this.log(owner, `${bone} ${mine}`, TIERS[tier].glow);
    }
  }

  /** Đồ rơi tại (x, y): người hạ `owner` được ưu tiên nhặt DROP_OWNER_SECS giây, tồn tại DROP_TTL_SECS giây (mục 4, 5.2). */
  newDrop(x: number, y: number, owner: string) {
    const drop = new DropState();
    drop.x = x; drop.y = y; drop.owner = owner; drop.ownerTtl = DROP_OWNER_SECS; drop.ttl = DROP_TTL_SECS;
    return drop;
  }

  // ---------- Mảnh võ hồn, mở võ hồn, lên sao (mục 5.1 "Sưu tầm võ hồn", 5.3 "Rơi đặc trưng", bước 3.4) ----------
  /**
   * Hạ hồn thú `years` năm: tung tỉ lệ rơi mảnh (shardChance, bảng rơi 5.3); trúng thì SHARD_QTY mảnh của một võ hồn ngẫu nhiên
   * trong MAPS[bản đồ].shards vào thẳng túi người hạ. Túi đầy thì phần không nhận rơi xuống đất cạnh hồn hoàn, cùng luật ưu tiên
   * người hạ như hồn hoàn (3.2). Hook test `shard` cố định được số ngẫu nhiên và võ hồn được chọn.
   */
  rollShard(id: string, years: number, x: number, y: number) {
    const d = this.pdata.get(id), list = MAPS[this.state.mapId].shards; if (!d || !list.length) return;
    const t = d.testShard;
    if ((t ? t.r : Math.random()) >= shardChance(years)) return;
    const vohon = list[t && t.i >= 0 ? t.i % list.length : Math.floor(Math.random() * list.length)], code = shardCode(vohon), def = itemDef(code);
    if (!def) return;
    const got = this.addItem(d, code, SHARD_QTY);
    if (got) { this.log(id, `Nhận ${got} ${def.name}${this.shardNote(d, code)}.`, def.col); this.sendBag(id); }
    if (got < SHARD_QTY) {
      // Cạnh hồn hoàn nếu chỗ đó đứng được (không thì chồng lên hồn hoàn; nhấn E lần nữa để nhặt nốt).
      const drop = this.map.standable(x + 8, y) ? this.newDrop(x + 8, y, id) : this.newDrop(x, y, id);
      drop.item = code; drop.qty = SHARD_QTY - got;
      this.state.drops.set(uid("d"), drop);
      this.log(id, `Túi đồ đã đầy (${BAG_SLOTS} ô): ${drop.qty} ${def.name} rơi xuống đất, ${DROP_OWNER_SECS} giây đầu chỉ bạn nhặt được (phím E).`, "#ffb35c");
    }
  }

  /** Tổng số mảnh mã `code` trong túi (mọi ô). */
  shardCount(d: PData, code: string) { return d.bag.reduce((n, i) => n + (i.code === code && i.vohonId === null ? i.qty : 0), 0); }

  /** Bớt `n` mảnh mã `code` khỏi túi, lấy từ các ô ít nhất trước (gọi sau khi đã kiểm tra đủ). */
  takeShards(d: PData, code: string, n: number) {
    for (const it of d.bag.filter((i) => i.code === code && i.vohonId === null).sort((a, b) => a.qty - b.qty)) {
      if (n <= 0) break;
      const k = Math.min(n, it.qty); this.takeItem(d, it, k); n -= k;
    }
  }

  /** Chú thích tiến độ sau khi nhận mảnh: " (12/50)" khi chưa sở hữu, " (8/40 lên 3★)" khi đã sở hữu, "" khi đã tối đa sao. */
  shardNote(d: PData, code: string) {
    const vohon = itemDef(code)?.vohon; if (!vohon) return "";
    const n = this.shardCount(d, code), v = d.owned.find((x) => x.vohon === vohon);
    if (!v) return ` (${n}/${SHARD_UNLOCK})`;
    const cost = starCost(v.stars);
    return cost === null ? "" : ` (${n}/${cost} lên ${v.stars + 1}★)`;
  }

  /**
   * Mở võ hồn `raw` (mã trong VOHON) bằng SHARD_UNLOCK mảnh (mục 5.1): chỉ võ hồn chưa sở hữu. Trừ mảnh ngay (bấm hai lần không
   * tiêu hai lần), rồi trong chuỗi lưu ghi võ hồn mới (cấp 1, 1 sao) và cả túi đồ trong một transaction (store.unlockVohon).
   * DB lỗi hoặc tài khoản đã có võ hồn này thì trả lại mảnh.
   */
  unlockVohon(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const vohon = typeof raw === "string" ? raw : "", vi = vohonIndex(vohon);
    if (vi < 0) return warn("Võ hồn không tồn tại.");
    const name = VOHON[vi].name, code = shardCode(vohon);
    if (d.owned.some((v) => v.vohon === vohon)) return warn(`Đã sở hữu ${name}: dùng mảnh để lên sao.`);
    if (d.shardBusy) return warn("Đang mở võ hồn, đợi một chút.");
    const have = this.shardCount(d, code);
    if (have < SHARD_UNLOCK) return warn(`Cần ${SHARD_UNLOCK} Mảnh ${name} để mở, mới có ${have}.`);
    this.takeShards(d, code, SHARD_UNLOCK);
    d.shardBusy = true;
    this.sendBag(id);
    // Không mở được thì trả mảnh, kể cả khi túi vừa đầy (không bao giờ mất đồ; ô thêm có thể tạm vượt BAG_SLOTS).
    const refund = () => {
      const left = SHARD_UNLOCK - this.addItem(d, code, SHARD_UNLOCK);
      if (left > 0) d.bag.push(...itemStacks(code, left));
      d.bagDirty = true;
    };
    this.chain(d, async () => {
      let v: Character | null;
      try { v = await store.unlockVohon(d.accountId, p.name, vohon, 1, this.bagSnapshot(d)); }
      catch (e) { refund(); throw e; }
      if (!v) { refund(); return; }
      d.owned.push(v);
      this.log(id, `Mở võ hồn ${name}! Đã vào bộ sưu tập (cấp 1, 1★): xếp vào đội ở bảng đội hình (phím V).`, VOHON[vi].col);
      this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã mở võ hồn ${name} bằng ${SHARD_UNLOCK} mảnh.` });
    }).then(() => {
      d.shardBusy = false;
      if (this.pdata.get(id) !== d) return;
      if (!d.owned.some((v) => v.vohon === vohon)) warn(`Chưa mở được ${name}, mảnh đã trả lại túi đồ.`);
      const c = this.clients.getById(id); if (c) this.sendVohons(c);
      this.sendBag(id);
    });
  }

  /**
   * Lên sao võ hồn `raw` (mã trong VOHON) đã sở hữu bằng mảnh theo STAR_COST (mục 5.1), tối đa MAX_STARS. Mỗi sao tăng chỉ số
   * gốc (starMult trong calcStats). Đổi trong bộ nhớ ngay, rồi trong chuỗi lưu ghi võ hồn và cả túi đồ trong một transaction
   * (store.saveVohonsBag); lỗi thì đánh dấu lại để lần lưu sau ghi tiếp. Hiệu ứng hồn kỹ theo sao để bước sau.
   */
  starUp(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const vohon = typeof raw === "string" ? raw : "", vi = vohonIndex(vohon), v = d.owned.find((x) => x.vohon === vohon);
    if (vi < 0) return warn("Võ hồn không tồn tại.");
    const name = VOHON[vi].name, code = shardCode(vohon);
    if (!v) return warn(`Chưa sở hữu ${name}: đủ ${SHARD_UNLOCK} mảnh thì mở trước.`);
    const cost = starCost(v.stars);
    if (cost === null) return warn(`${name} đã đạt ${MAX_STARS}★, không lên sao thêm được.`);
    const have = this.shardCount(d, code);
    if (have < cost) return warn(`Cần ${cost} Mảnh ${name} để lên ${v.stars + 1}★, mới có ${have}.`);
    this.takeShards(d, code, cost);
    v.stars++;
    if (v === d.ch) this.recalc(id, false); else d.dirty.add(v.rowId);
    this.log(id, `${name} lên ${v.stars}★! Chỉ số gốc tăng.`, VOHON[vi].col);
    const c = this.clients.getById(id); if (c) this.sendVohons(c);
    this.sendBag(id);
    this.chain(d, async () => {
      const list = this.unsaved(id), bag = this.bagSnapshot(d);
      if (!list.some((x) => x.rowId === v.rowId)) list.push({ ...v, rings: [...v.rings] });
      try { await store.saveVohonsBag(d.accountId, list, bag); }
      catch (e) { for (const x of list) if (x.rowId !== d.ch.rowId) d.dirty.add(x.rowId); d.bagDirty = true; throw e; }
    });
  }

  // ---------- Gắn hồn cốt (mục 5.5, bước 4.2) ----------
  /** Hồn cốt đang gắn trên võ hồn `rowId` (món của chính người chơi trong `d.bag`, `vohonId` = rowId); dữ liệu hỏng thì bỏ qua. */
  bonesOn(d: PData, rowId: number) {
    return d.bag.flatMap((it) => {
      const b = it.vohonId === rowId && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
      return b ? [{ it, beast: b.beast, slot: b.slot, years: it.years!, enhance: it.enhance }] : [];
    });
  }
  /** Tổng chỉ số gốc hồn cốt đang gắn trên võ hồn `rowId` (boneBonus), cộng vào calcStats. */
  boneBonusOf(d: PData, rowId: number) { return boneBonus(this.bonesOn(d, rowId)); }

  /** Luật chung khi gắn / tháo hồn cốt (từ 5.2 cả hồn hạch: `what`), như xếp đội hình: không gục, không hấp thụ, ngoài giao chiến. "" = được. */
  boneLock(p: PlayerState, d: PData, what = "hồn cốt") {
    if (p.dead) return `Đã gục ngã, không thể gắn / tháo ${what}.`;
    if (d.absorbing) return `Đang hấp thụ hồn hoàn, không thể gắn / tháo ${what}.`;
    if (d.fight < TEAM_COMBAT_SECS) return `Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới gắn / tháo ${what} được.`;
    return "";
  }

  /**
   * Gắn hồn cốt `rawItem` (id ô trong túi) vào võ hồn `rawVohon` (vohons.id) của chính người gửi (mục 5.5). Hồn cốt chỉ vào ô
   * cùng vị trí: client gửi kèm `rawSlot` (ô được thả vào) thì phải đúng vị trí của hồn cốt. Ô đã có hồn cốt thì đổi chỗ, món cũ
   * về túi (số ô túi không đổi nên không cần chỗ trống). Đổi trong bộ nhớ ngay; túi (cả cột vohon_id) ghi DB cùng lần lưu túi
   * kế tiếp (lưu định kỳ, rời phòng, transaction đi cổng). Võ hồn đang ra trận thì chỉ số đổi ngay.
   */
  equipBone(id: string, rawItem: unknown, rawVohon: unknown, rawSlot: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem) : undefined;
    const bone = it && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
    if (!it || !bone) return warn("Không có hồn cốt này trong túi đồ.");
    const v = Number.isInteger(rawVohon) ? d.owned.find((x) => x.rowId === rawVohon) : undefined;
    if (!v) return warn("Bạn không sở hữu võ hồn này.");
    if (it.vohonId === v.rowId) return this.sendBag(id);
    if (it.vohonId !== null) return warn("Hồn cốt này đang gắn trên võ hồn khác: tháo ra trước.");
    const slot = BONE_SLOTS[boneSlotIndex(bone.slot)];
    if (rawSlot !== undefined && rawSlot !== null && rawSlot !== bone.slot) {
      const to = BONE_SLOTS[boneSlotIndex(rawSlot)];
      return warn(`Hồn cốt ${slot.name} chỉ gắn vào ô ${slot.name}${to ? `, không gắn vào ô ${to.name}` : ""}.`);
    }
    const lock = this.boneLock(p, d); if (lock) return warn(lock);
    const old = this.bonesOn(d, v.rowId).find((b) => b.slot === bone.slot)?.it;
    if (old) old.vohonId = null;
    it.vohonId = v.rowId; d.bagDirty = true;
    const vname = VOHON[Math.max(0, vohonIndex(v.vohon))].name;
    this.log(id, `Gắn ${this.itemLabel(it)} vào ô ${slot.name} của ${vname}.${old ? ` ${this.itemLabel(old)} về túi đồ.` : ""}`, TIERS[tierOfYears(it.years!)].glow);
    this.afterBones(id, v);
  }

  /** Tháo hồn cốt `rawItem` đang gắn trên một võ hồn của chính người gửi về túi; túi đầy thì từ chối. Giữ nguyên cấp cường hóa. */
  unequipBone(id: string, rawItem: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem && i.vohonId !== null && i.code === BONE_ITEM) : undefined;
    if (!it) return warn("Hồn cốt này không gắn trên võ hồn nào.");
    const lock = this.boneLock(p, d); if (lock) return warn(lock);
    if (bagUsed(d.bag) >= BAG_SLOTS) return warn(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới tháo được hồn cốt.`);
    const v = d.owned.find((x) => x.rowId === it.vohonId);
    it.vohonId = null; d.bagDirty = true;
    this.log(id, `Tháo ${this.itemLabel(it)}${v ? ` khỏi ${VOHON[Math.max(0, vohonIndex(v.vohon))].name}` : ""} về túi đồ (giữ cường hóa +${it.enhance}).`);
    if (v) this.afterBones(id, v); else this.sendBag(id);
  }

  /**
   * Cường hóa hồn cốt `rawTarget` (id ô của chính người gửi, trong túi hoặc đang gắn) bằng các hồn cốt nguyên liệu `rawMats` (mục
   * 5.5, bước 4.4): nguyên liệu phải là hồn cốt nằm trong túi (không đang gắn), không phải chính nó, không trùng, tối đa
   * BONE_FEED_MAX món. Điểm tính bằng boneEnhancePreview (niên hạn, cùng vị trí +50%, trả lại phần điểm đã nạp vào nguyên liệu),
   * cộng dồn vào `stats.xp`, cấp ở `items.enhance` (tối đa +20, điểm dư bị bỏ). Luôn thành công, nguyên liệu bị xóa khỏi túi. Cùng
   * luật như gắn / tháo (boneLock: ngoài giao chiến, không gục, không hấp thụ), không đang chuyển bản đồ. Hồn cốt đang gắn thì chỉ
   * số / kỹ năng đổi ngay (afterBones). Ghi DB qua chuỗi lưu (save) như các thay đổi túi đồ khác; transaction đi cổng cũng mang
   * theo nếu lần lưu này chưa kịp chạy. Lò rèn ở Nặc Đinh Thành (6.1) sẽ mở cùng message này.
   */
  enhanceBone(id: string, rawTarget: unknown, rawMats: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const boneIn = (it: Item | undefined) => (it && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null);
    const it = typeof rawTarget === "string" ? d.bag.find((i) => i.id === rawTarget) : undefined, bone = boneIn(it);
    if (!it || !bone) return warn("Không có hồn cốt này để cường hóa.");
    if (it.enhance >= BONE_MAX_ENHANCE) return warn(`${this.itemLabel(it)} đã cường hóa tối đa +${BONE_MAX_ENHANCE}.`);
    if (!Array.isArray(rawMats) || !rawMats.length) return warn("Chọn ít nhất một hồn cốt làm nguyên liệu.");
    if (rawMats.length > BONE_FEED_MAX) return warn(`Mỗi lần cường hóa tối đa ${BONE_FEED_MAX} nguyên liệu.`);
    if (new Set(rawMats).size !== rawMats.length) return warn("Nguyên liệu bị chọn trùng.");
    const mats: Item[] = [];
    for (const raw of rawMats) {
      if (raw === it.id) return warn("Không dùng chính hồn cốt đang cường hóa làm nguyên liệu.");
      const m = typeof raw === "string" ? d.bag.find((i) => i.id === raw) : undefined;
      if (!m || !boneIn(m)) return warn("Nguyên liệu phải là hồn cốt trong túi đồ.");
      if (m.vohonId !== null) return warn(`${this.itemLabel(m)} đang gắn trên võ hồn: tháo ra trước mới dùng làm nguyên liệu được.`);
      mats.push(m);
    }
    const lock = this.boneLock(p, d); if (lock) return warn(lock.replace("gắn / tháo", "cường hóa"));
    const r = boneEnhancePreview({ slot: bone.slot, xp: boneXp(it.stats) },
      mats.map((m) => ({ slot: parseBone(m.stats)!.slot, years: m.years!, xp: boneXp(m.stats) })));
    const drop = new Set(mats);
    d.bag = d.bag.filter((x) => !drop.has(x));
    it.stats = { ...(it.stats as object), xp: r.xp }; it.enhance = r.level; d.bagDirty = true;
    const up = r.level > r.from ? ` lên +${r.level}` : ` (vẫn +${r.level})`;
    this.log(id, `Cường hóa ${this.itemLabel(it)}${up}: ${mats.length} nguyên liệu, +${r.gain.toLocaleString("vi-VN")} điểm`
      + (r.waste ? ` (dư ${r.waste.toLocaleString("vi-VN")} điểm bị bỏ vì đã tối đa)` : "") + ".", TIERS[tierOfYears(it.years!)].glow);
    this.clients.getById(id)?.send("enhanced", { id: it.id, from: r.from, to: r.level, gain: r.gain, xp: r.xp, used: mats.length });
    const v = it.vohonId !== null ? d.owned.find((x) => x.rowId === it.vohonId) : undefined;
    if (v) this.afterBones(id, v); else this.sendBag(id);
    this.save(id); // nguyên liệu đã mất: ghi ngay qua chuỗi lưu
  }

  /**
   * Sau khi gắn / tháo hồn cốt hoặc hồn hạch (5.2) trên võ hồn `v`: võ hồn ra trận thì tính lại chỉ số (và hiệu ứng bộ) ngay; gửi lại
   * túi và sinh lực đội (sinh lực tối đa đổi).
   */
  afterBones(id: string, v: Character) {
    const d = this.pdata.get(id)!;
    if (v === d.ch) this.recalc(id, false);
    this.sendBag(id);
    this.sendSquad(id, true);
  }

  // ---------- Gắn hồn hạch (mục 5.6, bước 5.2) ----------
  /** Hồn hạch đang gắn trên võ hồn `rowId` (món của chính người chơi, `vohonId` = rowId), kèm ô (coreSlotOf); dữ liệu hỏng thì bỏ qua. */
  coresOn(d: PData, rowId: number) {
    return d.bag.flatMap((it) => {
      const c = it.vohonId === rowId && it.code === CORE_ITEM ? parseCore(it.stats) : null;
      return c ? [{ it, stars: it.stars ?? 1, data: c, enhance: it.enhance, slot: coreSlotOf(it.stats) }] : [];
    });
  }
  /** Tổng chỉ số hồn hạch đang gắn trên võ hồn `rowId` (coreBonus, kèm phần chỉ số của bộ), cộng vào calcStats. */
  coreBonusOf(d: PData, rowId: number) { return coreBonus(this.coresOn(d, rowId)); }
  /** Câu báo khi bộ `set` trên võ hồn `rowId` vừa đủ 2 / 4 món ("" nếu không). */
  coreSetNote(d: PData, rowId: number, set: string) {
    const n = coreSetCounts(this.coresOn(d, rowId)).get(set) ?? 0, cs = CORE_SETS[coreSetIndex(set)];
    if (!cs || (n !== CORE_SET_2 && n !== CORE_SET_4)) return "";
    return ` Kích hoạt bộ ${cs.name} ${n} món: ${n === CORE_SET_4 ? cs.set4 : cs.set2}.`;
  }

  /**
   * Gắn hồn hạch `rawItem` (id ô trong túi) vào ô `rawSlot` (0..CORE_SLOTS − 1; bỏ trống thì ô trống đầu tiên) của võ hồn `rawVohon`
   * (vohons.id) của chính người gửi (mục 5.6). Ô nào cũng nhận mọi hồn hạch. Ô đã có thì đổi chỗ, món cũ về túi (số ô túi không đổi);
   * hồn hạch đang gắn trên chính võ hồn đó thì chuyển sang ô kia (hai ô đổi chỗ cho nhau). Cùng luật với hồn cốt (boneLock), không
   * đang chuyển bản đồ. Đổi trong bộ nhớ ngay; ghi DB cùng lần lưu túi kế tiếp (ô ở `items.stats.slot`, võ hồn ở `items.vohon_id`;
   * lưu định kỳ, rời phòng, transaction đi cổng). Võ hồn đang ra trận thì chỉ số và hiệu ứng bộ đổi ngay.
   */
  equipCore(id: string, rawItem: unknown, rawVohon: unknown, rawSlot: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem) : undefined;
    const core = it && it.code === CORE_ITEM ? parseCore(it.stats) : null;
    if (!it || !core) return warn("Không có hồn hạch này trong túi đồ.");
    const v = Number.isInteger(rawVohon) ? d.owned.find((x) => x.rowId === rawVohon) : undefined;
    if (!v) return warn("Bạn không sở hữu võ hồn này.");
    if (it.vohonId !== null && it.vohonId !== v.rowId) return warn("Hồn hạch này đang gắn trên võ hồn khác: tháo ra trước.");
    const vname = VOHON[Math.max(0, vohonIndex(v.vohon))].name, worn = this.coresOn(d, v.rowId);
    const full = `${vname} đã đủ ${CORE_SLOTS} hồn hạch: chọn một ô để thay.`;
    let slot: number;
    if (rawSlot === undefined || rawSlot === null) {
      if (it.vohonId === v.rowId) return this.sendBag(id);
      slot = [...Array(CORE_SLOTS).keys()].find((s) => !worn.some((w) => w.slot === s)) ?? -1;
      if (slot < 0) return warn(full);
    } else if (typeof rawSlot === "number" && Number.isInteger(rawSlot) && rawSlot >= 0 && rawSlot < CORE_SLOTS) slot = rawSlot;
    else return warn(`Ô hồn hạch không hợp lệ: chỉ có ô 1–${CORE_SLOTS}.`);
    const lock = this.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock);
    const st = (x: Item) => x.stats as Record<string, unknown>, ow = worn.find((w) => w.slot === slot && w.it !== it), old = ow?.it;
    const oldName = ow ? coreName(ow.data.set, ow.stars, ow.it.enhance) : "";
    if (it.vohonId === v.rowId) {
      // Đổi chỗ trong cùng võ hồn: chỉ số và bộ không đổi.
      const from = coreSlotOf(it.stats); if (from === slot) return this.sendBag(id);
      if (old) { if (from >= 0) st(old).slot = from; else delete st(old).slot; }
      st(it).slot = slot; d.bagDirty = true;
      this.log(id, `Chuyển ${this.itemLabel(it)} sang ô ${slot + 1} của ${vname}.${old && from >= 0 ? ` ${oldName} sang ô ${from + 1}.` : ""}`);
      return this.sendBag(id);
    }
    if (!old && worn.length >= CORE_SLOTS) return warn(full);
    if (old) { old.vohonId = null; delete st(old).slot; }
    it.vohonId = v.rowId; st(it).slot = slot; d.bagDirty = true;
    this.log(id, `Gắn ${this.itemLabel(it)} vào ô ${slot + 1} của ${vname}.${old ? ` ${oldName} về túi đồ.` : ""}${this.coreSetNote(d, v.rowId, core.set)}`,
      CORE_SETS[coreSetIndex(core.set)]?.col);
    this.afterBones(id, v);
  }

  /** Tháo hồn hạch `rawItem` đang gắn trên một võ hồn của chính người gửi về túi; túi đầy thì từ chối. Giữ nguyên cấp nâng cấp. */
  unequipCore(id: string, rawItem: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem && i.vohonId !== null && i.code === CORE_ITEM) : undefined;
    if (!it) return warn("Hồn hạch này không gắn trên võ hồn nào.");
    const lock = this.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock);
    if (bagUsed(d.bag) >= BAG_SLOTS) return warn(`Túi đồ đã đầy (${BAG_SLOTS} ô): bỏ bớt vật phẩm rồi mới tháo được hồn hạch.`);
    const v = d.owned.find((x) => x.rowId === it.vohonId);
    it.vohonId = null; if (it.stats && typeof it.stats === "object") delete (it.stats as Record<string, unknown>).slot; d.bagDirty = true;
    this.log(id, `Tháo ${this.itemLabel(it)}${v ? ` khỏi ${VOHON[Math.max(0, vohonIndex(v.vohon))].name}` : ""} về túi đồ (giữ nâng cấp +${it.enhance}).`);
    if (v) this.afterBones(id, v); else this.sendBag(id);
  }

  /**
   * Nâng cấp hồn hạch `rawTarget` (id ô của chính người gửi, trong túi hoặc đang gắn) bằng các hồn hạch nguyên liệu `rawMats` (mục
   * 5.6, bước 5.3): nguyên liệu phải là hồn hạch nằm trong túi (không đang gắn), không phải chính nó, không trùng, tối đa
   * CORE_FEED_MAX món; một món sai thì cả lần bị từ chối, không mất gì. Điểm tính bằng coreEnhancePreview (theo sao, cùng bộ thêm,
   * trả lại phần điểm đã nạp vào nguyên liệu), cộng dồn vào `stats.xp`, cấp ở `items.enhance` (tối đa +15, điểm dư bị bỏ). Mỗi mốc
   * +3 / +6 / +9 / +12 / +15 vượt qua thì tăng 1 dòng phụ ngẫu nhiên (coreUpgradeSubs, ghi vào `stats.subs`). Luôn thành công,
   * nguyên liệu bị xóa khỏi túi. Cùng luật như gắn / tháo (boneLock), không đang chuyển bản đồ. Đang gắn thì chỉ số đổi ngay
   * (afterBones). Ghi DB qua chuỗi lưu (save) như cường hóa hồn cốt; transaction đi cổng cũng mang theo nếu lần lưu chưa kịp chạy.
   */
  enhanceCore(id: string, rawTarget: unknown, rawMats: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const coreIn = (it: Item | undefined) => (it && it.code === CORE_ITEM ? parseCore(it.stats) : null);
    const it = typeof rawTarget === "string" ? d.bag.find((i) => i.id === rawTarget) : undefined, core = coreIn(it);
    if (!it || !core) return warn("Không có hồn hạch này để nâng cấp.");
    if (it.enhance >= CORE_MAX_ENHANCE) return warn(`${this.itemLabel(it)} đã nâng cấp tối đa +${CORE_MAX_ENHANCE}.`);
    if (!Array.isArray(rawMats) || !rawMats.length) return warn("Chọn ít nhất một hồn hạch làm nguyên liệu.");
    if (rawMats.length > CORE_FEED_MAX) return warn(`Mỗi lần nâng cấp tối đa ${CORE_FEED_MAX} nguyên liệu.`);
    if (new Set(rawMats).size !== rawMats.length) return warn("Nguyên liệu bị chọn trùng.");
    const mats: Item[] = [];
    for (const raw of rawMats) {
      if (raw === it.id) return warn("Không dùng chính hồn hạch đang nâng cấp làm nguyên liệu.");
      const m = typeof raw === "string" ? d.bag.find((i) => i.id === raw) : undefined;
      if (!m || !coreIn(m)) return warn("Nguyên liệu phải là hồn hạch trong túi đồ.");
      if (m.vohonId !== null) return warn(`${this.itemLabel(m)} đang gắn trên võ hồn: tháo ra trước mới dùng làm nguyên liệu được.`);
      mats.push(m);
    }
    const lock = this.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock.replace("gắn / tháo", "nâng cấp"));
    const stars = it.stars ?? 1, r = coreEnhancePreview({ set: core.set, xp: coreXp(it.stats), subs: core.subs.length },
      mats.map((m) => ({ set: parseCore(m.stats)!.set, stars: m.stars ?? 1, xp: coreXp(m.stats) })));
    const up = coreUpgradeSubs(core, stars, r.rolls, Math.random), label = this.itemLabel(it); // tên trước khi lên cấp
    const drop = new Set(mats);
    d.bag = d.bag.filter((x) => !drop.has(x));
    it.stats = { ...(it.stats as object), subs: up.data.subs, xp: r.xp }; it.enhance = r.level; d.bagDirty = true;
    const lv = r.level > r.from ? ` lên +${r.level}` : ` (vẫn +${r.level})`;
    // "thêm dòng phụ Công +3,2%" / "dòng phụ Sinh lực +150 (tăng +62)"
    const subs = up.ups.map((u) => (u.add ? `thêm dòng phụ ${coreStatText(u.k, u.v)}`
      : `dòng phụ ${coreStatText(u.k, u.to)} (tăng +${coreStatText(u.k, u.v).split(" +").pop()})`));
    this.log(id, `Nâng cấp ${label}${lv}: ${mats.length} nguyên liệu, +${r.gain.toLocaleString("vi-VN")} điểm`
      + (r.waste ? ` (dư ${r.waste.toLocaleString("vi-VN")} điểm bị bỏ vì đã tối đa)` : "") + (subs.length ? `; ${subs.join("; ")}` : "") + ".",
      CORE_SETS[coreSetIndex(core.set)]?.col);
    this.clients.getById(id)?.send("enhancedcore", { id: it.id, from: r.from, to: r.level, gain: r.gain, xp: r.xp, used: mats.length, subs: up.ups });
    const v = it.vohonId !== null ? d.owned.find((x) => x.rowId === it.vohonId) : undefined;
    if (v) this.afterBones(id, v); else this.sendBag(id);
    this.save(id); // nguyên liệu đã mất: ghi ngay qua chuỗi lưu
  }

  // ---------- Hồn hoàn ----------
  /**
   * Hấp thụ hồn hoàn trong túi vào một võ hồn (mục 5.2 "Hấp thụ", bước 3.3). Client gửi id ô và `vohonId` (vohons.id; thiếu thì
   * võ hồn đang ra trận); server kiểm tra ô thuộc túi và võ hồn thuộc bộ sưu tập của chính người gửi. Chỉ khi võ hồn ở bình cảnh
   * và không giao chiến; vượt giới hạn của vòng (RING_LIMIT) thì thất bại theo bảng ABSORB_FAIL, vượt > 100% thì không cho.
   * Hồn hoàn nằm trong túi suốt lúc hấp thụ (absorbSecs theo số năm): di chuyển hoặc bị đánh thì hủy, không mất gì.
   */
  tryAbsorb(c: Client, raw: unknown, rawVohon: unknown) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    if (d.travelCast) return warn("Đang đi qua cổng, không thể hấp thụ.");
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
    if (!it || it.code !== RING_ITEM || it.years === null) return warn("Hãy chọn một hồn hoàn trong túi đồ để hấp thụ (phím B).");
    const v = rawVohon === undefined || rawVohon === null ? d.ch : d.owned.find((x) => x.rowId === rawVohon);
    if (!v) return warn("Bạn không sở hữu võ hồn này.");
    if (v === d.ch) this.syncCh(id);
    const name = VOHON[Math.max(0, vohonIndex(v.vohon))].name, slot = v.rings.length + 1, years = it.years;
    if (v.rings.length >= MAX_RINGS) return warn(`${name} đã đủ ${MAX_RINGS} hồn hoàn, không hấp thụ thêm được.`);
    if (!atBottleneck(v.level, v.rings.length)) return warn(`${name} cần đạt cấp ${slot * 10} (bình cảnh) mới hấp thụ được hồn hoàn thứ ${slot}.`);
    if (d.fight < TEAM_COMBAT_SECS) return warn(`Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới hấp thụ được.`);
    const ch = absorbChance(years, slot);
    if (ch.fail === null) return warn(`Hồn hoàn ${formatYears(years)} vượt giới hạn vòng thứ ${slot} (${formatYears(ch.limit)}) tới ${ch.over}%: cơ thể không chịu nổi, không thể hấp thụ.`);
    const dur = absorbSecs(years);
    d.absorbing = { itemId: it.id, rowId: v.rowId, slot, years, t: 0, dur, fail: ch.fail };
    p.absorbTier = tierOfYears(years); p.absorb = 0.001;
    c.send("absorbing", { on: true, rowId: v.rowId, years, slot, secs: dur, over: ch.over, fail: ch.fail });
    const secs = `${String(dur).replace(".", ",")} giây`;
    if (ch.fail) this.log(id, `Bắt đầu hấp thụ hồn hoàn ${formatYears(years)} vào ${name}: vượt giới hạn ${ch.over}%, ${Math.round(ch.fail * 100)}% thất bại (mất hồn hoàn). Cần ${secs}.`, "#ffb35c");
    else this.log(id, `Bắt đầu hấp thụ hồn hoàn ${formatYears(years)} vào ${name} (${secs}). Đừng di chuyển và đừng để bị tấn công.`);
  }

  /** Hủy hấp thụ (di chuyển, bị đánh): không mất gì, hồn hoàn vẫn trong túi. */
  cancelAbsorb(id: string, text: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d?.absorbing) return;
    const a = d.absorbing; d.absorbing = null; p.absorb = 0;
    this.clients.getById(id)?.send("absorbing", { on: false, result: "cancel", rowId: a.rowId, years: a.years });
    this.log(id, text, "#ffb35c");
  }

  /**
   * Hết thời gian hấp thụ: server tung kết quả (hook test `roll` cố định được số ngẫu nhiên). Thành công hay thất bại hồn hoàn đều
   * rời túi; thất bại không phạt gì thêm. Thành công: lưu số năm vào vòng, lên 1 cấp (tối đa MAX_LEVEL). Hồn kỹ vòng 5–10 chưa có
   * (bước 8.1): vòng 5+ chỉ tăng chỉ số qua calcStats.
   */
  finishAbsorb(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, a = d.absorbing!, c = this.clients.getById(id);
    d.absorbing = null; p.absorb = 0;
    const it = d.bag.find((i) => i.id === a.itemId), v = d.owned.find((x) => x.rowId === a.rowId);
    if (v === d.ch) this.syncCh(id);
    // Hồn hoàn hoặc võ hồn không còn đúng như lúc bắt đầu: bỏ qua, không mất gì.
    if (!it || it.years !== a.years || !v || v.rings.length + 1 !== a.slot || !atBottleneck(v.level, v.rings.length)) {
      c?.send("absorbing", { on: false, result: "cancel", rowId: a.rowId, years: a.years });
      return;
    }
    const years = a.years, tier = tierOfYears(years), age = formatYears(years), name = VOHON[Math.max(0, vohonIndex(v.vohon))].name;
    // Thành công hay thất bại hồn hoàn đều rời túi (thất bại là vỡ tan).
    this.takeItem(d, it, 1); this.sendBag(id);
    const roll = d.testRoll ?? Math.random();
    if (roll < a.fail) {
      c?.send("absorbing", { on: false, result: "fail", rowId: v.rowId, years, slot: a.slot });
      this.log(id, `Thất bại! Hồn hoàn ${age} vỡ tan (vượt giới hạn vòng thứ ${a.slot}). ${name} không bị tổn hại gì thêm.`, "#ff8a8a");
      this.save(id); return;
    }
    v.rings.push(years); v.level = Math.min(MAX_LEVEL, v.level + 1); v.xp = 0;
    const n = v.rings.length;
    if (v === d.ch) {
      this.showVohon(p, v); d.ringYears = [...v.rings];
      this.recalc(id, true);
      this.broadcast("fx", { k: "absorbed", id, tier });
    } else {
      d.dirty.add(v.rowId);
      if (!d.down.has(v.rowId)) d.benchHp.delete(v.rowId); // lên cấp thì hồi đầy, như benchXp
    }
    c?.send("absorbing", { on: false, result: "ok", rowId: v.rowId, years, slot: n, level: v.level });
    const sk = n <= 4 ? ` Nhận Hồn kỹ ${n}: ${skillsOf(v.vohon)[n - 1].name}.` : " Hồn kỹ vòng 5–10 chưa mở (bản sau); vòng này tăng chỉ số.";
    const lv = n >= MAX_RINGS ? ` Đủ ${MAX_RINGS} hồn hoàn, cấp tối đa ${v.level}.` : ` Lên cấp ${v.level}.`;
    this.log(id, `Hấp thụ thành công hồn hoàn ${age} vào ${name} (vòng ${n})!${lv}${sk}`, TIERS[tier].glow);
    this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã hấp thụ hồn hoàn thứ ${n} (${age}) cho ${name}.` });
    if (c) this.sendVohons(c);
    this.save(id);
  }

  // ---------- Hồn thú ----------
  /**
   * Sinh một hồn thú trong vùng `zi`: tuổi ngẫu nhiên trong khoảng `years` của vùng (bảng 5.3; vùng thiếu `years` thì tung bậc
   * theo `weights` rồi tung tuổi trong bậc), loài theo trọng số `beasts` của vùng. Mỗi phòng tối đa 1 hồn thú thường
   * MAX_YEARS năm cùng lúc (mục 5.3): đã có thì tung dưới mức đó. Không sinh trong vùng an toàn, cách người chơi dưới 140 pixel, hay
   * trong SPAWN_CLEAR quanh trại cổng, cổng và điểm xuất hiện (map.nearGate: hồn thú lang thang không tới đánh người vừa tới nơi,
   * vừa hồi sinh, đang niệm cổng).
   */
  spawnBeast(zi: number) {
    const z = this.map.zones[zi], hasRed = [...this.state.beasts.values()].some((b) => b.years >= MAX_YEARS);
    let years: number;
    if (z.years) {
      const hi = hasRed ? Math.min(z.years[1], MAX_YEARS - 1) : z.years[1];
      if (hi < z.years[0]) return;
      years = rollYears(z.years[0], hi, Math.random());
    } else {
      let r = Math.random(), tier = 0;
      for (let i = 0; i < z.weights.length; i++) { r -= z.weights[i]; if (r <= 0) { tier = i; break; } }
      if (tier === TIERS.length - 1 && hasRed) tier--;
      const [lo, hi] = tierBand(tier);
      years = rollYears(lo, hi, Math.random());
    }
    const species = this.pickSpecies(zi);
    for (let k = 0; k < 40; k++) {
      const x = z.x0 + 8 + Math.random() * (z.x1 - z.x0 - 16), y = z.y0 + 24 + Math.random() * (z.y1 - z.y0 - 48);
      if (this.map.hits(x, y, 6, 4) || this.map.inSafe(x, y) || this.map.nearGate(x, y)) continue;
      if ([...this.state.players.values()].some((p) => Math.hypot(p.x - x, p.y - y) < 140)) continue;
      this.addBeast(zi, years, species, x, y);
      return;
    }
  }

  /**
   * Thêm hồn thú `years` năm: bậc (màu, kích thước) suy từ số năm, máu và sát thương tăng liên tục theo số năm (beastStats).
   * `rank` 1 (tinh anh, BĐ4): `species` là chỉ số trong BOSSES; máu x ELITE.hp, sát thương x ELITE.dmg so với loài gốc cùng năm,
   * 2 chiêu báo trước của BOSSES (không phụ thuộc mốc 1.000 năm).
   * `rank` 2 (tà hóa thú vương, BĐ5): máu x BossDef.hp, sát thương x KING.dmg; chiêu giai đoạn 1 của BOSSES, giai đoạn 2 thêm khi
   * còn KING.phaseHp máu; `slot` / `life`: khung giờ đã sinh và số giây trước khi rút đi.
   */
  addBeast(zi: number, years: number, species: number, x: number, y: number, rank = 0, slot = 0, life: number = KING.lifeSecs) {
    const st = beastStats(years), b = new BeastState(), boss = rank === 1 || rank === 2 ? BOSSES[species] : undefined, king = boss?.rank === 2;
    const hp = Math.round(st.hp * (!boss ? 1 : king ? boss.hp ?? 6 : ELITE.hp));
    b.x = x; b.y = y; b.years = years; b.tier = tierOfYears(years); b.species = species; b.rank = boss ? boss.rank : 0; b.hp = b.maxHp = hp;
    b.phase = king ? 1 : 0; b.parts = boss ? 1 : 0;
    const id = uid("b"); this.state.beasts.set(id, b);
    const sk = boss ? null : beastSkillOf(BEASTS[species]?.id ?? "", years);
    this.bdata.set(id, { zone: zi, hx: x, hy: y, tx: x, ty: y, wt: 0, cd: 0, kx: 0, ky: 0, target: null, hitBy: null, anim: 0,
      st: new Map(), dotT: 0, calm: 99, regen: 0, dmg: st.dmg * (!boss ? 1 : king ? KING.dmg : ELITE.dmg),
      skills: boss ? boss.skills.map((def) => ({ def, cd: 0 })) : sk ? [{ def: sk, cd: 0 }] : [], skT: 0, cast: null,
      buffs: new Map(), minions: new Set(),
      elite: boss ? { base: hp, n: 1, engaged: false, parts: new Map(), lonely: 0, dropT: 0, dmgBy: new Map(), rageCd: 0,
        king: king ? { def: boss, slot, life, phase: 1, roar: 0, spd: 1, noted: new Set(), rankT: 0 } : null } : null });
    return id;
  }

  // ---------- Tinh anh (mục 5.4, bước BĐ4) ----------
  /**
   * Sinh tinh anh của ô `i` ở điểm ngẫu nhiên trong chữ nhật `elite`: niên hạn = mức trên của vùng (mục 5.4), không sinh trong vùng an
   * toàn, quanh trại cổng / cổng / điểm xuất hiện (SPAWN_CLEAR) hay sát người chơi (thử lại sau 5 giây). `announce`: báo cả bản đồ.
   */
  spawnElite(i: number, announce: boolean) {
    const slot = this.elites[i], { spot } = slot, z = this.map.zones[spot.zone], def = BOSSES[spot.boss];
    const years = z.years ? z.years[1] : tierBand(z.weights.reduce((t, w, k) => (w > 0 ? k : t), 0))[1];
    for (let k = 0; k < 40; k++) {
      const x = spot.x + 6 + Math.random() * Math.max(0, spot.w - 12), y = spot.y + 6 + Math.random() * Math.max(0, spot.h - 12);
      if (this.map.hits(x, y, 6, 4) || this.map.inSafe(x, y) || this.map.nearGate(x, y)) continue;
      if ([...this.state.players.values()].some((p) => Math.hypot(p.x - x, p.y - y) < 140)) continue;
      slot.bid = this.addBeast(spot.zone, years, spot.boss, x, y, 1);
      if (announce) this.broadcast("elite", { k: "spawn", name: beastName(1, spot.boss), zone: z.name, x, y, col: def.aura });
      return;
    }
    slot.t = 5;
  }

  /** Sát thương đòn thường hiện tại của hồn thú (đánh thường và bội số chiêu): Cuồng nộ cộng thêm ELITE_RAGE.dmg. */
  beastDmg(bd: BData) { return bd.dmg * (bd.buffs.has("rage") ? 1 + ELITE_RAGE.dmg : 1); }
  syncBeastBuff(b: BeastState, bd: BData) { let m = 0; for (const k of bd.buffs.keys()) m |= beastBuffBit(k); b.buff = m; }

  /**
   * Hồn sư `by` sắp gây sát thương lên tinh anh (mục 5.4 "Máu tăng theo số người tham gia"): lần đầu bị đánh thì bắt đầu giao chiến,
   * mọi hồn sư trong ELITE.radius thành người tham gia; sau đó ai gây sát thương cũng thành người tham gia. Số người tăng thì máu tối
   * đa tăng ngay, máu hiện tại giữ tỉ lệ. Hồi máu / tạo khiên cho người tham gia khác chưa tính: hồi máu và khiên hiện chỉ cho đội võ
   * hồn của chính hồn sư.
   */
  eliteJoin(b: BeastState, bd: BData, by: string) {
    const e = bd.elite!;
    if (!e.engaged) {
      e.engaged = true; e.lonely = 0;
      this.state.players.forEach((p, pid) => {
        if (!this.pdata.get(pid)?.travelling && this.inFight(b, e, p)) this.joinFight(e, pid);
      });
    }
    this.joinFight(e, by);
    this.eliteScale(b, e);
  }

  /** Bán kính giao chiến (mục 5.4): tinh anh ELITE.radius pixel quanh thân, thú vương cả hang (object `boss`). */
  inFight(b: BeastState, e: EliteData, p: PlayerState) {
    return e.king ? this.map.inLair(p.x, p.y) : Math.hypot(p.x - b.x, p.y - b.y) <= ELITE.radius;
  }

  /** Thêm người tham gia; thú vương: người đã hết lượt nhận thưởng hôm nay được nhắc một lần mỗi trận (mục 5.4). */
  joinFight(e: EliteData, pid: string) {
    if (e.parts.has(pid)) return;
    e.parts.set(pid, 0);
    const d = this.pdata.get(pid);
    if (e.king && d && !e.king.noted.has(pid) && this.claimsToday(d) >= KING.daily) {
      e.king.noted.add(pid);
      this.log(pid, `Hôm nay đã hết lượt nhận thưởng thú vương (${KING.daily}/${KING.daily}): vẫn đánh và nhận kinh nghiệm được, nhưng không nhận rương. Lượt mới lúc 00:00 giờ Việt Nam.`, "#ffb35c");
    }
  }

  /** Áp số người tham gia vào máu: tăng thì ngay, giảm tối đa 1 mỗi ELITE.dropEvery giây; máu hiện tại giữ tỉ lệ phần trăm. */
  eliteScale(b: BeastState, e: EliteData) {
    const want = Math.max(1, e.parts.size);
    let n = e.n;
    if (want > n) n = want;
    else if (want < n && e.dropT <= 0) { n--; e.dropT = e.king ? KING.dropEvery : ELITE.dropEvery; }
    if (n === e.n) return;
    const ratio = b.hp / Math.max(1, b.maxHp);
    e.n = n; b.parts = n; b.maxHp = Math.round(e.base * bossHpMult(n));
    if (b.hp > 0) b.hp = Math.max(1, Math.min(b.maxHp, Math.round(ratio * b.maxHp)));
  }

  /**
   * Mỗi tick của tinh anh: Cuồng nộ (máu dưới ELITE_RAGE.hp), loại người tham gia đã rời phòng / ở ngoài bán kính ELITE.outSecs giây
   * liên tục, bỏ giao chiến sau ELITE.idleSecs giây không còn người tham gia nào trong bán kính. Hook test `etick` gọi với `dt` lớn.
   */
  tickElite(bid: string, b: BeastState, bd: BData, dt: number) {
    const e = bd.elite!, k = e.king;
    e.rageCd = Math.max(0, e.rageCd - dt); e.dropT = Math.max(0, e.dropT - dt);
    const rage = bd.buffs.get("rage");
    if (k) { if (this.tickKing(bid, b, bd, k, dt)) return; } // thú vương: rút đi, giai đoạn 2 (không có Cuồng nộ)
    else if (rage !== undefined) {
      if (rage - dt <= 0) { bd.buffs.delete("rage"); e.rageCd = ELITE_RAGE.cd; this.syncBeastBuff(b, bd); } else bd.buffs.set("rage", rage - dt);
    } else if (e.rageCd <= 0 && b.hp > 0 && b.hp < b.maxHp * ELITE_RAGE.hp) {
      bd.buffs.set("rage", ELITE_RAGE.secs); this.syncBeastBuff(b, bd);
      this.broadcast("fx", { k: "rage", bid, name: BEAST_BUFFS.rage.name });
    }
    if (!e.engaged) return;
    let near = false;
    const outSecs = k ? KING.outSecs : ELITE.outSecs, idleSecs = k ? KING.idleSecs : ELITE.idleSecs;
    for (const [pid, out] of e.parts) {
      const p = this.state.players.get(pid);
      if (!p || this.pdata.get(pid)?.travelling) { e.parts.delete(pid); continue; } // rời phòng, mất kết nối, đi cổng
      if (this.inFight(b, e, p)) { near = true; e.parts.set(pid, 0); }
      else if (out + dt >= outSecs) e.parts.delete(pid);
      else e.parts.set(pid, out + dt);
    }
    if (near) e.lonely = 0;
    else if ((e.lonely += dt) >= idleSecs) return this.eliteReset(bid, b, bd);
    this.eliteScale(b, e);
    // Bảng xếp hạng sát thương chỉ gửi cho người tham gia (đang áp vào máu hoặc đã có đóng góp), không phủ màn hình người đứng xem.
    if (k && (k.rankT -= dt) <= 0) {
      k.rankT = 1;
      const msg = { k: "rank", bid, ...this.kingRank(e) };
      for (const pid of new Set([...e.parts.keys(), ...e.dmgBy.keys()])) this.clients.getById(pid)?.send("boss", msg);
    }
  }

  /** Bỏ giao chiến (mục 5.4): về chỗ sinh, hồi đầy máu (1 người), xóa người tham gia, đóng góp, trạng thái và hiệu ứng có lợi. */
  eliteReset(bid: string, b: BeastState, bd: BData) {
    const e = bd.elite!;
    this.cancelCast(bid, b, bd);
    e.engaged = false; e.parts.clear(); e.dmgBy.clear(); e.lonely = 0; e.n = 1; b.parts = 1; e.dropT = 0; e.rageCd = 0;
    bd.st.clear(); bd.buffs.clear(); this.syncStatus(b, bd); this.syncBeastBuff(b, bd);
    // Thú vương (BĐ5): về giai đoạn 1, bỏ chiêu giai đoạn 2; cả phòng được báo (thanh máu và bảng xếp hạng đặt lại).
    if (e.king) {
      const k = e.king; k.phase = 1; b.phase = 1; k.roar = 0; k.spd = 1; k.noted.clear(); k.rankT = 0;
      bd.skills = k.def.skills.map((def) => ({ def, cd: 0 }));
      this.broadcast("boss", { k: "reset", bid, name: beastName(2, b.species) });
    }
    bd.target = null; b.aggro = false; bd.kx = 0; bd.ky = 0; b.x = bd.hx; b.y = bd.hy; bd.tx = bd.hx; bd.ty = bd.hy;
    b.maxHp = e.base; b.hp = e.base; bd.regen = 0;
  }

  /**
   * "Xóa buff địch" (SkillDef.dispel, Thiên Càn Trấn Áp của Thiên Càn Bạch Ngọc Đỉnh): bỏ mọi hiệu ứng có lợi trên hồn thú `bid`;
   * Cuồng nộ bị xóa thì ELITE_RAGE.cd giây sau mới nổi lại được. Như applyStatus: người gây đang chuyển bản đồ / trong vùng an toàn thì không.
   */
  dispelBeast(bid: string, by: string) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), p = this.state.players.get(by), pd = this.pdata.get(by);
    if (!b || !bd || !p || !pd || !bd.buffs.size || pd.travelling || this.map.inSafe(p.x, p.y)) return;
    const names = [...bd.buffs.keys()].map((k) => BEAST_BUFFS[k].name).join(", ");
    bd.buffs.clear(); this.syncBeastBuff(b, bd);
    if (bd.elite) bd.elite.rageCd = ELITE_RAGE.cd;
    this.broadcast("fx", { k: "dispel", bid });
    this.log(by, `Xóa ${names} của ${beastName(b.rank, b.species)}.`, "#f0e0a0");
  }

  // ---------- Tà hóa thú vương (mục 5.4, 6; bước BĐ5) ----------
  /** Ngày nhận thưởng boss theo giờ Việt Nam (đổi lúc 00:00; hook test `day` lệch được để thử đặt lại lượt). */
  today() { return vnDay(Date.now() + this.dayShift * 86400000); }
  /** Lượt nhận rương thú vương hôm nay của người chơi (sang ngày mới thì về 0). */
  claimsToday(d: PData) { if (d.claims.day !== this.today()) d.claims = { day: this.today(), n: 0 }; return d.claims.n; }

  /** Tin "boss" gửi client cho một sự kiện lịch: tên, bản đồ, còn bao nhiêu giây, thú vương có ở bản đồ của phòng này không. */
  bossMsg(ev: BossEvent, k: string, secs: number) {
    const bi = bossIndex(ev.king), m = MAPS[ev.mapId];
    return { k, name: beastName(2, bi), mapId: ev.mapId, mapName: m?.name ?? ev.mapId, in: Math.max(0, Math.round(secs)), life: ev.life,
      here: ev.mapId === this.state.mapId, col: BOSSES[bi]?.aura };
  }

  /**
   * Sự kiện lịch boss trên presence (schedule.ts hoặc hook test): mọi phòng báo cho người chơi của mình (đếm ngược / xuất hiện); phòng
   * của đúng bản đồ sinh thú vương khi `spawn` (mỗi khung giờ một lần, mỗi kênh một con).
   */
  onBossEvent(ev: BossEvent) {
    if (!ev || !Object.hasOwn(MAPS, ev.mapId) || bossIndex(ev.king) < 0) return;
    if (ev.phase === "warn") {
      this.bossWarn = { ...ev, at: Date.now() + ev.in * 1000 };
      kingWarns.set(ev.mapId, this.bossWarn);
      this.broadcast("boss", this.bossMsg(ev, "warn", ev.in));
    } else if (ev.phase === "spawn") {
      if (this.bossWarn?.mapId === ev.mapId) this.bossWarn = null;
      kingWarns.delete(ev.mapId);
      this.broadcast("boss", this.bossMsg(ev, "spawn", 0));
      if (ev.mapId === this.state.mapId) this.spawnKing(ev.slot, ev.life);
    }
  }

  /**
   * Sinh thú vương của bản đồ trong hang (object `boss`) cho khung giờ `slot`, rút đi sau `life` giây. Niên hạn = mức trên của bản đồ
   * (mục 5.4). Mỗi phòng lấy một suất mỗi khung giờ (takeKingSeat); suất của phòng cũ đã hủy mà đã hạ / rút đi thì không sinh, còn sống
   * thì sinh lại đầy máu ở giai đoạn 1 (phòng trống là không ai trong hang: như bỏ giao chiến) với thời gian còn lại của suất. Đang có
   * thú vương sống thì bỏ qua. Thú vương không tính vào `count` của vùng.
   */
  spawnKing(slot: number, life: number) {
    const lair = this.map.lair, years = MAPS[this.state.mapId].years?.[1], now = Date.now();
    if (!lair || !years || life <= 0 || this.king?.slot === slot) return;
    if (this.king?.bid && this.state.beasts.has(this.king.bid)) return;
    const seat = takeKingSeat(this.state.mapId, slot, now + life * 1000, this.roomId);
    this.king = { slot, bid: null, seat };
    if (seat.state === "alive" && seat.leaveAt <= now) seat.state = "gone";
    if (seat.state !== "alive") return;
    life = (seat.leaveAt - now) / 1000;
    const cx = lair.x + lair.w / 2, cy = lair.y + lair.h / 2;
    let x = cx, y = cy;
    for (let k = 0; k < 40 && this.map.hits(x, y, 8, 4); k++) { x = cx + (Math.random() - 0.5) * lair.w * 0.6; y = cy + (Math.random() - 0.5) * lair.h * 0.6; }
    this.king.bid = this.addBeast(lair.zone, years, lair.boss, x, y, 2, slot, life);
  }

  /**
   * Mỗi tick của thú vương: hết KING.lifeSecs thì rút đi; máu còn KING.phaseHp thì sang giai đoạn 2; đếm tiếng gầm. Trả true nếu thú
   * vương đã rời bản đồ (tick dừng ở đây).
   */
  tickKing(bid: string, b: BeastState, bd: BData, k: KingData, dt: number) {
    if ((k.life -= dt) <= 0) { this.kingLeave(bid, b, bd); return true; }
    if (k.roar > 0) k.roar = Math.max(0, k.roar - dt);
    if (k.phase === 1 && k.def.phase2 && b.hp > 0 && b.hp <= b.maxHp * KING.phaseHp) this.kingPhase2(bid, b, bd, k);
    return false;
  }

  /**
   * Giai đoạn 2 (mục 5.4): gầm lên, đứng yên KING.roarSecs giây (không nhận khống chế, mất khống chế đang có, ngắt chiêu đang báo trước),
   * rồi thêm chiêu của BossDef.phase2 và nhanh hơn (phase2.spd). Cả phòng được báo.
   */
  kingPhase2(bid: string, b: BeastState, bd: BData, k: KingData) {
    const ph = k.def.phase2!;
    k.phase = 2; b.phase = 2; k.roar = KING.roarSecs; k.spd = ph.spd;
    this.cancelCast(bid, b, bd);
    let cc = false;
    for (const s of [...bd.st.keys()]) { const def = STATUS[s]; if (def.noMove || def.noAtk || def.noSkill || def.wander) { bd.st.delete(s); cc = true; } }
    if (cc) this.syncStatus(b, bd);
    bd.skills.push(...ph.skills.map((def) => ({ def, cd: KING.roarSecs + 1 })));
    bd.skT = Math.max(bd.skT, KING.roarSecs);
    bd.kx = 0; bd.ky = 0;
    const name = beastName(2, b.species);
    this.broadcast("fx", { k: "roar", bid, name: ph.name, col: k.def.aura, secs: KING.roarSecs });
    this.broadcast("boss", { k: "phase", bid, name, phase: 2, title: ph.name, desc: ph.desc, col: k.def.aura });
  }

  /** Bảng xếp hạng sát thương lên thú vương: tối đa 10 người (sessionId, tên, % đóng góp), tổng sát thương và số người tham gia. */
  kingRank(e: EliteData) {
    const total = [...e.dmgBy.values()].reduce((a, v) => a + v, 0);
    const list = [...e.dmgBy.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([id, v]) => ({ id, name: this.state.players.get(id)?.name ?? "(đã rời)", pct: total ? +(v / total * 100).toFixed(1) : 0 }));
    return { list, total, n: e.n };
  }

  /** Không ai hạ trong KING.lifeSecs giây: thú vương rút đi, không ai nhận thưởng; cả phòng và toàn server được báo. */
  kingLeave(bid: string, b: BeastState, bd: BData) {
    this.cancelCast(bid, b, bd);
    const name = beastName(2, b.species), map = MAPS[this.state.mapId].name;
    this.state.beasts.delete(bid); this.bdata.delete(bid);
    if (this.king?.bid === bid) { this.king.bid = null; this.king.seat.state = "gone"; }
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 60, col: BOSSES[b.species]?.aura });
    this.broadcast("boss", { k: "leave", bid, name, mapName: map });
    this.presence.publish(ANNOUNCE_TOPIC, { text: `${name} ở ${map} đã rút đi: không ai hạ được trong ${KING.lifeSecs / 60} phút.` });
  }

  /** Người tham gia ngẫu nhiên trong tầm `range` của thú vương để đánh dấu (BeastSkillDef.mark, Huyết Cuồng); không có thì null. */
  markTarget(b: BeastState, bd: BData, range: number): [string, PlayerState] | null {
    const list: [string, PlayerState][] = [];
    for (const pid of bd.elite?.parts.keys() ?? []) {
      const p = this.state.players.get(pid), pd = this.pdata.get(pid);
      if (p && pd && !p.dead && !pd.travelling && !pd.buffs.has("hide") && !this.map.inSafe(p.x, p.y) && Math.hypot(p.x - b.x, p.y - b.y) <= range) list.push([pid, p]);
    }
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  }

  /**
   * Hạ thú vương (mục 5.4 "Chia thưởng theo đóng góp"): đóng góp = sát thương. Mọi người đóng góp còn trong phòng nhận kinh nghiệm
   * x KING.xp; người hạ nhận Hồn Tệ; hồn hoàn rơi ưu tiên người đóng góp nhiều nhất DROP_OWNER_SECS giây; ai từ KING.share (3%) nhận
   * rương vào túi (giới hạn KING.daily lần/ngày, grantChest). Cả phòng nhận bảng xếp hạng cuối, toàn server được báo.
   */
  killKing(bid: string, b: BeastState, e: EliteData, by: string) {
    const k = e.king!, name = beastName(2, b.species), map = MAPS[this.state.mapId].name, rank = this.kingRank(e);
    if (this.king?.bid === bid) { this.king.bid = null; this.king.seat.state = "down"; }
    const p = this.state.players.get(by)!; p.kills++;
    const total = rank.total || 1;
    let owner = by;
    for (const [pid, v] of e.dmgBy) if (this.state.players.has(pid) && v > (e.dmgBy.get(owner) ?? 0)) owner = pid;
    const coin = this.rewardCoin(by, b.tier);
    const drop = this.newDrop(b.x, b.y, owner); drop.tier = b.tier; drop.years = b.years;
    this.state.drops.set(uid("d"), drop);
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 80, col: k.def.aura });
    const ownerName = this.state.players.get(owner)!.name, age = formatYears(b.years);
    for (const [pid, v] of e.dmgBy) {
      const d = this.pdata.get(pid); if (!d || !this.state.players.has(pid) || d.travelling) continue;
      const pct = v / total, pctTxt = `${(pct * 100).toFixed(1).replace(".", ",")}%`;
      this.rewardKill(pid, b.years, KING.xp);
      const ring = pid === owner ? ` Hồn hoàn ${age} ưu tiên bạn nhặt ${DROP_OWNER_SECS} giây đầu (phím E).` : "";
      const coinTxt = pid === by ? ` Nhận ${formatHonTe(coin)} Hồn Tệ.` : "";
      if (pct >= KING.share) { this.log(pid, `Hạ ${name}! Đóng góp ${pctTxt}.${coinTxt}${ring}`, k.def.aura); this.grantChest(pid, k.def); }
      else this.log(pid, `Hạ ${name}! Đóng góp ${pctTxt}: cần từ ${KING.share * 100}% mới nhận rương.${coinTxt}${ring}`, "#ffb35c");
    }
    if (!e.dmgBy.has(by)) this.log(by, `Hạ ${name}, nhận ${formatHonTe(coin)} Hồn Tệ.`, k.def.aura);
    this.broadcast("boss", { k: "down", bid, name, by: p.name, top: ownerName, mapName: map, ...rank });
    this.presence.publish(ANNOUNCE_TOPIC, { text: `${name} ở ${map} đã bị hạ! ${ownerName} đóng góp nhiều nhất, ${p.name} ra đòn cuối.` });
  }

  /**
   * Rương thú vương cho người chơi `id` (đóng góp từ KING.share): hôm nay còn lượt (KING.daily, tính chung mọi bản đồ, đặt lại 00:00 giờ
   * Việt Nam) thì tới lượt trong chuỗi lưu mới cho rương vào túi và ngay đó tăng lượt cùng ghi cả túi trong một transaction
   * (store.claimBoss). Không lần ghi nào khác chụp được túi có rương trước transaction này (mọi lần ghi nối tiếp trong chuỗi), nên DB
   * không bao giờ có rương mà chưa trừ lượt. DB báo hết lượt hoặc lỗi thì lấy lại rương. Túi đầy thì rương vẫn vào (ô tạm vượt
   * BAG_SLOTS, như trả mảnh ở 3.4) để không mất thưởng.
   */
  grantChest(id: string, def: BossDef) {
    const d = this.pdata.get(id), it = itemDef(chestCode(def.id)); if (!d || !it) return;
    const day = this.today(), warn = (text: string) => this.log(id, text, "#ffb35c");
    if (this.claimsToday(d) >= KING.daily) return warn(`Hôm nay đã hết lượt nhận thưởng thú vương (${KING.daily}/${KING.daily}): không nhận rương. Lượt mới lúc 00:00 giờ Việt Nam.`);
    const takeBack = () => { const x = d.bag.find((i) => i.code === it.id && i.vohonId === null); if (x) this.takeItem(d, x, 1); };
    d.claimBusy++;
    this.chain(d, async () => {
      // Rương vào túi ngay trước khi chụp túi cho transaction (không có await xen giữa); chặn mở / bỏ rương tới khi xong (claimBusy).
      const full = !this.addItem(d, it.id, 1);
      if (full) { d.bag.push(newItem(it, 1)); d.bagDirty = true; }
      let n: number | null;
      try { n = await store.claimBoss(d.accountId, day, BOSS_CLAIM_KING, KING.daily, this.bagSnapshot(d)); }
      catch (e) { takeBack(); warn(`Không lưu được ${it.name}, thử lại sau.`); throw e; }
      if (n === null) { takeBack(); d.claims = { day, n: KING.daily }; return warn(`Hôm nay đã hết lượt nhận thưởng thú vương (${KING.daily}/${KING.daily}): không nhận rương.`); }
      d.claims = { day, n };
      this.log(id, `Nhận ${it.name} vào túi đồ (lượt ${n}/${KING.daily} hôm nay). Mở trong túi đồ (B).`, it.col);
      if (full) warn(`Túi đồ đã đầy: ${it.name} vẫn vào túi, bỏ bớt đồ để mở được (cần ${KING_CHEST.slots} ô trống).`);
    }).then(() => { d.claimBusy--; if (this.pdata.get(id) === d) this.sendBag(id); });
  }

  /**
   * Mở rương thú vương `raw` (id ô trong túi; KING_CHEST, mục 5.3): cần KING_CHEST.slots ô trống. Server tung: hồn cốt (boneChance theo
   * năm thú vương x KING_CHEST.bone, loài gốc, vị trí ngẫu nhiên), mảnh võ hồn (kingShardPool của bản đồ thú vương), mảnh UR
   * (KING_CHEST.ur), và luôn 1 hồn hạch sao cao nhất theo năm thú vương, bộ theo bản đồ thú vương (rollCore `high`, 5.1). Hook test
   * `chest` cố định được các số ngẫu nhiên.
   */
  openChest(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined, def = it && itemDef(it.code);
    if (!it || !def) return warn("Không có vật phẩm này trong túi đồ.");
    const boss = BOSSES[bossIndex(def.boss ?? "")];
    if (def.kind !== "ruong" || !boss) return warn(`${def.name} không mở được.`);
    if (d.claimBusy) return warn("Đang nhận rương thú vương, đợi một chút.");
    if (BAG_SLOTS - bagUsed(d.bag) < KING_CHEST.slots) return warn(`Cần ${KING_CHEST.slots} ô trống trong túi đồ để mở ${def.name}.`);
    const mapId = Object.values(MAPS).find((m) => m.king === boss.id)?.id ?? this.state.mapId, years = MAPS[mapId].years?.[1] ?? TIERS[0].years;
    const t = d.testChest, r = (v: number | undefined) => (v !== undefined && v >= 0 ? v : Math.random());
    this.takeItem(d, it, 1);
    const got: string[] = [];
    if (r(t?.bone) < boneChance(years, KING_CHEST.bone)) {
      const slot = BONE_SLOTS[t && t.s >= 0 ? t.s % BONE_SLOTS.length : Math.floor(Math.random() * BONE_SLOTS.length)].id;
      if (this.addBone(d, years, boss.species, slot)) got.push(`hồn cốt ${boneName(boss.species, slot, years)}`);
    }
    const pool = kingShardPool(mapId), wsum = pool.reduce((a, x) => a + x.w, 0);
    let pick = pool[0];
    if (t && t.i >= 0) pick = pool[t.i % pool.length];
    else { let x = Math.random() * wsum; for (const q of pool) { x -= q.w; if (x <= 0) { pick = q; break; } } }
    const [lo, hi] = KING_CHEST.shards, qty = t && t.n > 0 ? t.n : lo + Math.floor(Math.random() * (hi - lo + 1));
    const sc = shardCode(pick.vohon), sd = itemDef(sc), n1 = sd ? this.addItem(d, sc, qty) : 0;
    if (sd && n1) got.push(`${n1} ${sd.name}${this.shardNote(d, sc)}`);
    let ur = "";
    if (r(t?.ur) < KING_CHEST.ur) {
      const u = KING_CHEST.urShards[Math.floor(Math.random() * KING_CHEST.urShards.length)], uc = shardCode(u), ud = itemDef(uc);
      if (ud && this.addItem(d, uc, 1)) { got.push(`1 ${ud.name} (UR)${this.shardNote(d, uc)}`); ur = ud.name; }
    }
    const core = rollCore(years, MAPS[mapId].cores, Math.random, { high: true });
    if (this.addCore(d, core.stars, core.data)) got.push(coreName(core.data.set, core.stars).replace("Hồn hạch", "hồn hạch"));
    this.sendBag(id);
    this.log(id, `Mở ${def.name}: ${got.join(", ")}.`, def.col);
    if (ur) this.broadcast("chat", { name: "Hệ thống", text: `${p.name} mở ${def.name} nhận được ${ur}!` });
    this.save(id);
  }

  /** Chọn loài theo trọng số trong số loài khai báo ở vùng; vùng không có loài hợp lệ thì lấy loài bất kỳ. */
  pickSpecies(zi: number) {
    let list = this.map.zones[zi].beasts;
    if (!list.length) list = BEASTS.map((_, i) => ({ species: i, w: 1 }));
    let r = Math.random() * list.reduce((a, b) => a + b.w, 0);
    for (const b of list) { r -= b.w; if (r <= 0) return b.species; }
    return list[list.length - 1].species;
  }

  /** Võ hồn đã gục: hồi ngay khi hồn sư đứng trong doanh trại, hoặc sau REVIVE_SECS giây ngoài trận (giao chiến thì đồng hồ dừng). */
  tickDowns(id: string, dt: number) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    if (!d.down.size) return;
    if (this.map.inSpawn(p.x, p.y)) return this.revive(id, [...d.down.keys()], "ở doanh trại");
    if (d.fight < TEAM_COMBAT_SECS) return;
    const done: number[] = [];
    for (const [r, t] of d.down) { if (t - dt <= 0) done.push(r); else d.down.set(r, t - dt); }
    if (done.length) this.revive(id, done, "sau khi nghỉ ngoài trận");
  }

  // ---------- Vòng lặp ----------
  tick(dt: number) {
    // việc hẹn giờ (các nhát của hồn kỹ liên hoàn)
    if (this.timers.length) {
      const due: (() => void)[] = [];
      this.timers = this.timers.filter((t) => { t.t -= dt; if (t.t > 0) return true; due.push(t.fn); return false; });
      for (const fn of due) fn();
    }

    // người chơi
    this.state.players.forEach((p, id) => {
      const d = this.pdata.get(id)!;
      d.atkCd -= dt; d.inv -= dt; d.lastHit += dt; d.fight += dt;
      d.haste -= dt; d.shockMpCd -= dt; d.comboT += dt; // hiệu ứng bộ hồn hạch (5.2)
      for (let i = 0; i < 4; i++) if (p.cds[i] > 0) p.cds[i] = Math.max(0, p.cds[i] - dt);
      for (let i = 0; i < p.bcds.length; i++) if (p.bcds[i] > 0) p.bcds[i] = Math.max(0, p.bcds[i] - dt);
      if (p.swCd > 0) p.swCd = Math.max(0, p.swCd - dt);
      if (d.danCd > 0) d.danCd = Math.max(0, d.danCd - dt);
      if (d.shieldT > 0) { d.shieldT -= dt; if (d.shieldT <= 0) d.shield = 0; p.shield = Math.ceil(d.shield); }
      if (d.buffs.size) {
        for (const [b, x] of d.buffs) { x.t -= dt; if (x.t <= 0 || p.dead) d.buffs.delete(b); } // cả đội gục thì mất hiệu ứng có lợi
        this.syncBuffs(p, d);
      }
      if (d.travelling) { p.moving = false; return; } // đang chuyển bản đồ: đứng yên chờ client rời phòng
      this.tickPStatus(id, p, d, dt);
      if (p.dead) {
        d.deadT -= dt;
        if (d.deadT <= 0) {
          // Cả đội gục: về doanh trại, cả đội hồi đầy.
          const s = this.spawnPoint(); p.x = s.x; p.y = s.y; p.dead = false; d.inv = 1.5;
          d.down.clear(); d.benchHp.clear(); this.recalc(id, true);
          this.log(id, "Đã về doanh trại, cả đội hồi phục.", "#86e0b0");
          this.sendSquad(id, true);
        }
        return;
      }
      // Choáng / Trói (từ 3.5, do chiêu báo trước của hồn thú): không đi; Làm chậm giảm tốc.
      const ctl = this.pctl(d), { x: ix, y: iy } = ctl.noMove ? { x: 0, y: 0 } : d.input; const il = Math.hypot(ix, iy);
      p.moving = il > 0.15;
      if (p.moving) {
        if (d.absorbing) this.cancelAbsorb(id, "Di chuyển: đã hủy hấp thụ, hồn hoàn vẫn còn trong túi.");
        const sp = d.speed * (1 + this.buffV(d, "spd")) * (1 - ctl.slow);
        this.map.moveEnt(p, ix * sp * dt, iy * sp * dt, 5, 4);
        d.dir = { x: ix / il, y: iy / il };
        p.dir = dir4(ix, iy);
      }
      if (d.absorbing) { d.absorbing.t += dt; p.absorb = Math.min(0.999, d.absorbing.t / d.absorbing.dur); if (d.absorbing.t >= d.absorbing.dur) this.finishAbsorb(id); }
      this.portalHint(id, p, d);
      if (d.travelCast) {
        const cast = d.travelCast;
        if (this.map.portalAt(p.x, p.y) !== cast.portal) { d.travelCast = null; this.log(id, "Đã rời cổng: hủy đi qua cổng."); }
        else if ((cast.t -= dt) <= 0) {
          d.travelCast = null;
          const why = this.travelDeny(id, cast.portal.name);
          if (why === null) this.beginTravel(id, cast.portal); else if (why) this.log(id, why, "#ffb35c");
        }
      }
      d.mpF = Math.min(p.maxMp, d.mpF + (4 + p.level * 0.15) * (VOHON[p.vh].mp > 1 ? 1.5 : 1) * dt);
      const regen = (max: number) => (d.lastHit > 5 ? max * 0.04 : 1.5) * dt;
      d.hpF = Math.min(p.maxHp, d.hpF + regen(p.maxHp));
      p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
      // Võ hồn khác trong đội (chưa gục) hồi sinh lực cùng nhịp với võ hồn ra trận.
      for (const [r, hp] of d.benchHp) {
        const v = d.owned.find((o) => o.rowId === r), max = v ? this.maxHpOf(d, v) : 0;
        if (!v || hp + regen(max) >= max) d.benchHp.delete(r); else d.benchHp.set(r, hp + regen(max));
      }
      this.tickDowns(id, dt);
      this.tickEnergy(id, dt);
      d.squadT -= dt;
      if (d.squadT <= 0) { d.squadT = 0.5; this.sendSquad(id); }
    });

    // hồn thú: trạng thái trước (sát thương theo thời gian có thể hạ hồn thú), rồi di chuyển và đánh
    for (const bid of [...this.state.beasts.keys()]) this.tickStatus(bid, dt);
    this.state.beasts.forEach((b, id) => {
      const bd = this.bdata.get(id)!, td = TIERS[b.tier];
      bd.cd -= dt; bd.anim += dt; bd.calm += dt;
      if (bd.elite) this.tickElite(id, b, bd, dt);
      if (!this.state.beasts.has(id)) return; // thú vương vừa rút đi (BĐ5)
      const king = bd.elite?.king;
      // Thú vương đang gầm chuyển giai đoạn (BĐ5): đứng yên, không đánh, không tung chiêu.
      if (king?.roar) { b.moving = false; bd.kx = 0; bd.ky = 0; return; }
      // Từ 2.5c: hồn thú đang chịu trạng thái `wander` (Mê hoặc) bỏ mục tiêu, đi lung tung.
      const charm = [...bd.st.keys()].some((s) => STATUS[s].wander);
      if (charm) bd.target = null;
      let tgt = bd.target ? this.state.players.get(bd.target) : undefined;
      // Không đuổi theo người đã vào vùng an toàn, đang chuyển bản đồ (mục 5.3, 6) hoặc đang tàng hình (Yêu Hồ, 2.5c).
      const off = (p: PlayerState, pid: string) => { const pd = this.pdata.get(pid); return p.dead || this.map.inSafe(p.x, p.y) || !!pd?.travelling || !!pd?.buffs.has("hide"); };
      // Thú vương (BĐ5) chỉ đuổi người trong hang và nhận mục tiêu là bất kỳ ai trong hang; hồn thú khác bỏ mục tiêu khi xa chỗ sinh quá 220 pixel.
      const leash = (p: PlayerState) => (king ? !this.map.inLair(p.x, p.y) : Math.hypot(b.x - bd.hx, b.y - bd.hy) > 220);
      if (tgt && (off(tgt, bd.target!) || leash(tgt))) { bd.target = null; tgt = undefined; }
      if (!tgt && (b.tier >= 1 || king) && !charm) {
        let best = king ? Infinity : BEAST_AGGRO_R;
        this.state.players.forEach((p, pid) => {
          if (off(p, pid) || (king && !this.map.inLair(p.x, p.y))) return;
          const dd = Math.hypot(p.x - b.x, p.y - b.y); if (dd < best) { best = dd; bd.target = pid; tgt = p; }
        });
      }
      // Vừa có mục tiêu: chờ TELE_FIRST giây mới tung chiêu báo trước đầu tiên (3.5).
      if (tgt && !b.aggro) bd.skT = Math.max(bd.skT, TELE_FIRST[0] + Math.random() * (TELE_FIRST[1] - TELE_FIRST[0]));
      b.aggro = !!tgt;
      bd.skT -= dt; for (const s of bd.skills) s.cd -= dt;
      const hw = Math.max(3, td.size / 3);
      // Khống chế (mục 5.1): Choáng đứng yên và không đánh; Trói không đi (vẫn đánh khi kề bên).
      // Bị khống chế không di chuyển thì cũng không bị đẩy lùi.
      // Từ 2.5c đọc cờ trong bảng STATUS (Mê hoặc không đánh); Làm chậm / Mị hoặc giảm tốc độ theo tầng (tối đa SLOW_CAP).
      // Từ 3.5: Câm lặng (noSkill) chỉ chặn và ngắt chiêu báo trước; Choáng, Mê hoặc (noAtk) chặn cả đánh thường lẫn chiêu.
      const stun = bd.st.has("stun");
      let noMove = false, noAtk = false, noSkill = false, slow = 0;
      for (const [s, x] of bd.st) { const def = STATUS[s]; noMove ||= def.noMove; noAtk ||= def.noAtk; noSkill ||= def.noSkill; slow += def.slow * x.n; }
      // Tinh anh đang giao chiến không tự hồi máu (bỏ giao chiến thì hồi đầy, mục 5.4).
      if (!tgt && bd.calm > BEAST_REGEN.delay && !bd.elite?.engaged) this.regenBeast(b, bd, dt);
      this.tickCast(id, b, bd, dt, noAtk || noSkill);
      if (stun) { bd.kx = 0; bd.ky = 0; b.moving = false; return; }
      if (noMove) { bd.kx = 0; bd.ky = 0; }
      if (bd.kx || bd.ky) { this.moveBeast(b, bd.kx * dt, bd.ky * dt, hw); bd.kx *= 0.85; bd.ky *= 0.85; if (Math.abs(bd.kx) < 2 && Math.abs(bd.ky) < 2) { bd.kx = 0; bd.ky = 0; } }
      if (bd.cast) { b.moving = false; return; } // đang báo trước: đứng yên, không đánh thường
      let mx = 0, my = 0, sp = td.spd * (1 - Math.min(SLOW_CAP, slow)) * (bd.buffs.has("rage") ? 1 + ELITE_RAGE.spd : 1) * (king?.spd ?? 1);
      if (tgt) {
        const dx = tgt.x - b.x, dy = tgt.y - b.y, dd = Math.hypot(dx, dy);
        // Chiêu báo trước: hết chờ, chiêu hết hồi và mục tiêu trong tầm (không nhắm người trong vùng an toàn: đã bỏ mục tiêu ở trên).
        // Chiêu đánh dấu (BĐ5, `mark`): nhắm một người tham gia ngẫu nhiên trong tầm thay cho mục tiêu đang đuổi.
        if (!(noAtk || noSkill || bd.skT > 0)) for (const s of bd.skills) {
          if (s.cd > 0) continue;
          const m = s.def.mark ? this.markTarget(b, bd, s.def.range) : dd <= s.def.range ? [bd.target!, tgt] as [string, PlayerState] : null;
          if (m) { this.beginCast(id, b, bd, s, m[0], m[1]); return; }
        }
        if (dd > td.size / 2 + 6) { if (!noMove) { mx = dx / dd; my = dy / dd; } }
        else if (bd.cd <= 0 && !noAtk) { bd.cd = 1.1; this.hurtPlayer(bd.target!, this.beastDmg(bd) * (0.85 + Math.random() * 0.3)); }
      } else {
        bd.wt -= dt;
        // Mê hoặc: đổi hướng liên tục quanh chỗ đang đứng, đi nhanh hơn lúc lang thang thường.
        if (charm && bd.wt > 0.7) bd.wt = 0;
        if (bd.wt <= 0) {
          const [ox, oy, w] = charm ? [b.x, b.y, 80] : [bd.hx, bd.hy, 2 * BEAST_WANDER];
          bd.wt = charm ? 0.4 + Math.random() * 0.3 : 2 + Math.random() * 3; bd.tx = ox + (Math.random() - 0.5) * w; bd.ty = oy + (Math.random() - 0.5) * w;
        }
        const ex = bd.tx - b.x, ey = bd.ty - b.y, ed = Math.hypot(ex, ey);
        if (ed > 4 && !noMove) { mx = ex / ed; my = ey / ed; sp *= charm ? 0.7 : 0.4; }
      }
      b.moving = !!(mx || my);
      if (b.moving) { this.moveBeast(b, mx * sp * dt, my * sp * dt, hw); if (Math.abs(mx) > 0.1) b.face = mx > 0 ? 1 : -1; }
    });

    // đạn hồn kỹ
    this.projs = this.projs.filter((pr) => {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      if (pr.life <= 0 || this.map.hits(pr.x, pr.y + 6, 1, 1)) return false;
      for (const [bid, b] of this.state.beasts.entries())
        if (Math.hypot(b.x - pr.x, b.y - TIERS[b.tier].size / 2 - pr.y) < TIERS[b.tier].size / 2 + 5) { pr.fire(bid); return false; }
      return true;
    });

    // hồn hoàn rơi dưới đất: hết DROP_TTL_SECS giây thì biến mất (từ 3.2 hấp thụ từ túi, không còn ai "đang hấp thụ" hồn hoàn dưới đất)
    this.state.drops.forEach((dr, id) => {
      dr.ttl -= dt; if (dr.ownerTtl > 0) dr.ownerTtl = Math.max(0, dr.ownerTtl - dt);
      if (dr.ttl <= 0) { this.state.drops.delete(id); this.coreDrops.delete(id); }
    });

    // hồi sinh hồn thú
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.2;
      const { zones } = this.map, counts = zones.map(() => 0); this.bdata.forEach((b) => { if (!b.elite) counts[b.zone]++; }); // tinh anh không tính vào `count`
      zones.forEach((z, i) => { if (counts[i] < z.count) this.spawnBeast(i); });
    }

    // thú vương bị hook test `clear` xóa: coi như đã rời (không sinh lại trong cùng khung giờ)
    if (this.king?.bid && !this.state.beasts.has(this.king.bid)) this.king.bid = null;
    // tinh anh: bị hạ (hoặc bị hook test xóa) thì hồi sinh sau ELITE.respawn giây ngẫu nhiên, server không báo giờ (mục 5.4)
    this.elites.forEach((slot, i) => {
      if (slot.bid && !this.state.beasts.has(slot.bid)) { slot.bid = null; slot.t = ELITE.respawn[0] + Math.random() * (ELITE.respawn[1] - ELITE.respawn[0]); }
      if (!slot.bid && (slot.t -= dt) <= 0) this.spawnElite(i, true);
    });

    // lưu định kỳ (bỏ qua người đang chuyển bản đồ: transaction đi cổng là lần ghi cuối của phòng này cho người đó)
    this.saveT += dt;
    if (this.saveT > 30) { this.saveT = 0; this.pdata.forEach((d, id) => { if (!d.travelling) this.save(id); }); }
  }

  /** Hồn thú di chuyển nhưng không bước vào vùng an toàn. */
  moveBeast(b: BeastState, dx: number, dy: number, hw: number) {
    const ox = b.x, oy = b.y;
    this.map.moveEnt(b, dx, dy, hw, 3);
    // Thú vương (BĐ5) không ra khỏi hang.
    if (this.map.inSafe(b.x, b.y) || (b.rank === 2 && this.map.lair && !this.map.inLair(b.x, b.y))) { b.x = ox; b.y = oy; }
  }
}

// ---------- Lễ thức tỉnh (gọi từ /api/awaken, trước khi vào phòng) ----------
/** Tài khoản chưa có võ hồn: tặng Lam Ngân Thảo + 1 võ hồn SSR tự chọn. Hồn lực bẩm sinh do server roll. */
export async function awakenAccount(accountId: number, name: string, choice: unknown):
  Promise<{ character: Character } | { status: number; error: string }> {
  const pick = AWAKEN_CHOICES.find((v) => v.id === choice);
  if (!pick) return { status: 400, error: "Hãy chọn một võ hồn SSR trong danh sách." };
  // Tạo nhân vật diễn ra ngay trước bước chọn SSR của lễ thức tỉnh.
  if (!(await store.getLooks(accountId)).chosen) return { status: 409, error: "Hãy tạo nhân vật trước lễ thức tỉnh." };
  // Hồn lực bẩm sinh 1–10 thuộc về hồn sư: làm cấp khởi đầu của cả hai võ hồn.
  const level = Math.random() < 0.04 ? 10 : 1 + Math.floor(Math.pow(Math.random(), 1.6) * 9);
  const character = await store.awaken(accountId, name, [AWAKEN_GIFT, pick.id], pick.id, level);
  if (!character) return { status: 409, error: "Tài khoản đã thức tỉnh võ hồn rồi." };
  return { character };
}

/** Tạo nhân vật (một lần): client gửi giới tính, kiểu tóc, màu tóc, màu áo; mọi giá trị phải nằm trong bảng ở data.ts. */
export async function chooseLooks(accountId: number, body: unknown):
  Promise<{ looks: AccountLooks } | { status: number; error: string }> {
  const looks = parseLooks(body);
  if (!looks) return { status: 400, error: "Ngoại hình không hợp lệ." };
  if (!(await store.chooseLooks(accountId, looks))) return { status: 409, error: "Bạn đã chọn ngoại hình rồi, không đổi được nữa." };
  return { looks: { ...looks, chosen: true } };
}
