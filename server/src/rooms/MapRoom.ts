// Phòng của một bản đồ (mapId): toàn bộ logic game chạy ở đây (server-authoritative).
// Mỗi bản đồ có thể có nhiều phòng (kênh); mọi phòng dùng chung một lớp, khác nhau ở dữ liệu bản đồ.
// Client chỉ gửi ý định (hướng di chuyển, bấm đánh...), server quyết định kết quả.
import { Room, Client, ServerError } from "colyseus";
import { randomUUID } from "node:crypto";
import { MapState, PlayerState, BeastState, DropState } from "./schema.ts";
import { TIERS, VOHON, ringLimit, xpNeed, atBottleneck, calcStats, TICK_RATE, tierOfYears, vohonIndex,
  AWAKEN_GIFT, AWAKEN_CHOICES, TEAM_SIZE, SWITCH_CD, TEAM_COMBAT_SECS, REVIVE_SECS, RESPAWN_SECS, XP_SHARE_ACTIVE, XP_SHARE_BENCH,
  beastLevel, xpLevelScale, MAX_RINGS, parseTeam, BEASTS, MAPS, DEFAULT_MAP, parseLooks, dir4, type Looks,
  TRAVEL_CAST, TRAVEL_LEAVE_SECS,
  TIEN_CO, TIEN_CO_MAX, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY, energyGain, tienCoDmgMult, TILE,
  itemDef, BAG_SLOTS, DAN_CD, STARTER_ITEMS, BEAST_COIN, formatHonTe, type ItemDef,
  MAX_YEARS, tierBand, rollYears, beastStats, formatYears, RING_ITEM, DROP_OWNER_SECS, DROP_TTL_SECS, PICKUP_RANGE,
  absorbSecs, ABSORB_RISK, ABSORB_FAIL_HP,
  STATUS, STATUS_IDS, STATUS_TICK, CC_TIER_MULT, BEAST_REGEN, statusBit, BUFF_IDS, buffBit, CRIT, skillPower, buffPower, PCT_HP_CAP,
  PROJ_SPEED, PHOENIX_FIELD_R, SLOW_CAP, PHONG_LOI, skillsOf, TIEN_CO_RIENG, type SkillDef, type StatusId, type StatusApply, type BuffId } from "../../../shared/data.ts";
import { loadMap, type GameMap, type Portal } from "../map.ts";
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
  absorbing: { itemId: string; t: number; dur: number; risk: number } | null; // hấp thụ hồn hoàn trong túi (từ 3.2)
  mpF: number; hpF: number; // hpF: sinh lực của võ hồn ra trận
  benchHp: Map<number, number>; // sinh lực các võ hồn khác (rowId -> sinh lực; không có = đầy). Không lưu DB: vào lại thì hồi đầy
  down: Map<number, number>;    // võ hồn đã gục: rowId -> số giây ngoài trận còn lại trước khi hồi (REVIVE_SECS)
  dirty: Set<number>;           // võ hồn không ra trận có tiến độ chưa lưu (kinh nghiệm chia cho đội)
  squadKey: string; squadT: number; // tin riêng "squad": nội dung lần gửi trước, đếm giờ kiểm tra lại
  fight: number;        // số giây kể từ lần cuối đánh trúng hoặc bị đánh
  // Mọi lần ghi DB về người chơi này nối tiếp nhau trong một chuỗi (mục 6): tối đa một lần ghi đang chạy, commit đúng thứ tự.
  saving: Promise<void>;
  teamQueued: boolean;  // đã có một lần lưu đội hình đang chờ trong chuỗi (lần đó ghi bản mới nhất lúc chạy)
  portalKey: string;    // hộp đi cổng đã gửi cho client ("" = không đứng ở cổng)
  travelCast: { portal: Portal; t: number } | null; // đang niệm đi qua cổng (TRAVEL_CAST giây, bị đánh thì hủy)
  travelling: boolean;  // cờ đang chuyển bản đồ (bước 2): bỏ qua mọi hành động, lưu định kỳ bỏ qua người này
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
}
/** Một đòn đánh thường / một lần tung hồn kỹ: năng lượng tiên cơ chỉ tính một lần dù trúng nhiều hồn thú hay nhiều mũi đạn. */
interface Hit { kind: "attack" | "skill"; done: boolean; }
interface AuthData { accountId: number; ch: Character; owned: Character[]; team: number[]; looks: Looks; loc: Location; bag: Bag; starter: boolean; }
/** Một trạng thái trên hồn thú: giây còn lại, số tầng, độ lớn mỗi tầng (sát thương mỗi giây hoặc tỉ lệ), người gây. */
interface SInst { t: number; n: number; v: number; src: string; }
interface BData {
  zone: number; hx: number; hy: number; tx: number; ty: number; wt: number; cd: number; kx: number; ky: number; target: string | null; hitBy: string | null; anim: number;
  st: Map<StatusId, SInst>; // trạng thái dùng chung (mục 5.1) đang có
  dotT: number;             // đếm giờ tới lần gây sát thương theo thời gian kế tiếp (STATUS_TICK)
  calm: number;             // số giây kể từ lần cuối bị đánh (hồi máu khi không có mục tiêu, BEAST_REGEN)
  regen: number;            // phần lẻ sinh lực hồi chưa cộng (sinh lực đồng bộ là số nguyên)
  dmg: number;              // sát thương đòn thường theo số năm (beastStats, bước 3.2)
}
/** Mũi hồn kỹ đang bay của hồn sư `owner`: chạm hồn thú đầu tiên thì gọi `fire` (sát thương và trạng thái của hồn kỹ). */
interface Proj { x: number; y: number; vx: number; vy: number; life: number; owner: string; fire: (bid: string) => void; }
/** Tùy chọn của một lần gây sát thương lên hồn thú. `direct` = false: sát thương theo thời gian (không chí mạng, không đẩy lùi,
 *  không tính Phá giáp, không lan Cảm điện). `chain`: sát thương lan của Cảm điện (không chí mạng, không lan tiếp). */
interface DmgOpt { crit?: number; lifesteal?: number; direct?: boolean; chain?: boolean; }

let nextId = 1;
const uid = (p: string) => p + (nextId++).toString(36);

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
  projs: Proj[] = [];
  timers: { t: number; fn: () => void }[] = []; // việc hẹn giờ (các nhát của hồn kỹ liên hoàn), chạy trong tick
  spawnT = 0;
  saveT = 0;
  /** Đá phiên trùng tài khoản ở mọi phòng (presence, mục 6). */
  kickSub = (m: { accountId: number; sessionId: string }) => {
    for (const other of this.clients) if (other.sessionId !== m.sessionId && (other.auth as AuthData)?.accountId === m.accountId) other.leave(4001);
  };

  async onAuth(_client: Client, options: { token?: string }) {
    const acc = options?.token ? await store.accountFromToken(options.token) : null;
    if (!acc) throw new ServerError(401, "Phiên đăng nhập không hợp lệ.");
    const [ch, owned, looks, loc] = await Promise.all([store.getCharacter(acc.accountId), store.listVohons(acc.accountId),
      store.getLooks(acc.accountId), store.getLocation(acc.accountId)]);
    // Tạo nhân vật trước (tài khoản cũ cũng phải chọn một lần), rồi mới đến lễ thức tỉnh.
    if (!looks.chosen) throw new ServerError(403, "Chưa tạo nhân vật.");
    if (!ch) throw new ServerError(403, "Chưa thức tỉnh võ hồn.");
    // Chỉ vào được phòng của bản đồ đang lưu trong DB; sai thì client hỏi lại /api/me (trả mapId) rồi vào đúng phòng.
    if (loc.mapId !== this.state.mapId) throw new ServerError(409, `Sai bản đồ: hồn sư đang ở ${MAPS[loc.mapId].name}.`);
    const auth: AuthData = { accountId: acc.accountId, ch: owned.find((v) => v.rowId === ch.rowId) ?? ch, owned, team: [], looks, loc,
      bag: { items: [], honTe: 0 }, starter: false };
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
    this.setSimulationInterval((ms) => this.tick(Math.min(ms, 100) / 1000), 1000 / TICK_RATE);
    this.presence.subscribe("kick", this.kickSub);

    this.onMessage("input", (c, m: { x: number; y: number }) => {
      const d = this.pdata.get(c.sessionId); if (!d || d.travelling) return;
      let x = Number(m?.x) || 0, y = Number(m?.y) || 0; const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
      d.input = { x, y };
    });
    this.onMessage("attack", (c) => this.attack(c.sessionId));
    this.onMessage("skill", (c, m: { i: number }) => this.skill(c, Number(m?.i)));
    this.onMessage("absorb", (c, m: { itemId: unknown }) => this.tryAbsorb(c, m?.itemId));
    this.onMessage("pickup", (c) => this.pickup(c.sessionId));
    this.onMessage("discard", (c, m: { id: unknown }) => this.discardItem(c.sessionId, m?.id));
    this.onMessage("vohons", (c) => this.sendVohons(c));
    this.onMessage("team", (c, m: { slots: unknown }) => this.setTeam(c, m?.slots));
    this.onMessage("switch", (c, m: { slot: number }) => this.switchSlot(c, Number(m?.slot)));
    this.onMessage("test", (c, m: unknown) => this.testHook(c, m));
    this.onMessage("travel", (c, m: { portal: string }) => this.travel(c, String(m?.portal ?? "")));
    this.onMessage("bag", (c) => this.sendBag(c.sessionId));
    this.onMessage("use", (c, m: { id: unknown }) => this.useItem(c.sessionId, m?.id));
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
    // Một tài khoản chỉ được vào một lần: đá phiên cũ ở mọi phòng (kể cả phòng này).
    this.presence.publish("kick", { accountId: auth.accountId, sessionId: client.sessionId });
    const p = new PlayerState();
    p.name = ch.name; this.showVohon(p, ch);
    p.sex = looks.sex; p.hair = looks.hair; p.hairCol = looks.hairCol; p.outfitCol = looks.outfitCol;
    // Vị trí đã lưu; chưa có, kẹt trong ô chặn hoặc ngoài bản đồ thì về `spawn` (mục 6).
    const pos = loc.x !== null && loc.y !== null && this.map.standable(loc.x, loc.y) ? { x: loc.x, y: loc.y } : this.spawnPoint();
    p.x = pos.x; p.y = pos.y;
    const d: PData = { accountId: auth.accountId, owned, team, ch, ringYears: [...ch.rings], input: { x: 0, y: 0 }, dir: { x: 1, y: 0 },
      atk: 0, speed: 0, atkCd: 0, inv: 1.5, lastHit: 99, deadT: 0, absorbing: null, mpF: 0, hpF: 0, fight: 99,
      benchHp: new Map(), down: new Map(), dirty: new Set(), squadKey: "", squadT: 0,
      saving: Promise.resolve(), teamQueued: false, portalKey: "", travelCast: null, travelling: false, travelled: false,
      energy: new Map(), shield: 0, shieldT: 0, buffs: new Map(), lei: 0, leiQueued: false, lastSkill: null,
      bag: bag.items, honTe: bag.honTe, bagDirty: false, danCd: 0, starterNote: auth.starter };
    this.pdata.set(client.sessionId, d);
    this.state.players.set(client.sessionId, p);
    this.recalc(client.sessionId, true);
    this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã tới ${MAPS[this.state.mapId].name}.` }, { except: client });
  }

  async onLeave(client: Client) {
    const id = client.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (p && d) {
      // Nối vào chuỗi lưu: chờ mọi lần ghi trước (kể cả transaction đi cổng) rồi mới xét. Đã đi cổng thành công thì
      // không ghi gì nữa; transaction lỗi hoặc chưa đi cổng thì lưu như thường (có lớp chặn WHERE map_id).
      await this.chain(d, () => (d.travelled ? undefined : this.write(id)));
      if (!d.travelled) this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã rời ${MAPS[this.state.mapId].name}.` });
    }
    this.state.players.delete(id);
    this.pdata.delete(id);
  }

  async onDispose() {
    this.presence.unsubscribe("kick", this.kickSub);
    await Promise.all([...this.pdata.entries()].map(([id, d]) => this.chain(d, () => (d.travelled ? undefined : this.write(id)))));
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
    const s = calcStats(p.vh, p.level, [...p.rings]);
    p.maxHp = s.maxHp; p.maxMp = s.maxMp; d.atk = s.atk; d.speed = s.speed;
    p.xpNeed = atBottleneck(p.level, p.rings.length) ? 0 : xpNeed(p.level);
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
    if (!d.bagDirty) return undefined;
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

  /** Sinh lực tối đa của một võ hồn sở hữu (dù đang ra trận hay không). */
  maxHpOf(v: Character) { return calcStats(Math.max(0, vohonIndex(v.vohon)), v.level, v.rings.map(tierOfYears)).maxHp; }

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
      const maxHp = v === d.ch ? p.maxHp : this.maxHpOf(v), down = d.down.get(r);
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
   * Bước 2–4 của mục 6: đánh dấu đang chuyển bản đồ, nối transaction đi cổng vào chuỗi lưu (chờ mọi lần ghi trước xong rồi
   * mới chụp dữ liệu), commit xong mới gửi riêng `travel {mapId}`. Lỗi thì bỏ cờ, người chơi ở lại.
   */
  beginTravel(id: string, portal: Portal) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, from = this.state.mapId;
    d.travelling = true; d.input = { x: 0, y: 0 }; p.moving = false;
    this.bdata.forEach((bd) => { if (bd.target === id) bd.target = null; });
    // Đạn hồn kỹ còn bay (bắn lúc đang niệm) không được hạ hồn thú sau khi transaction đã chụp dữ liệu: bỏ luôn (mục 6).
    this.projs = this.projs.filter((pr) => pr.owner !== id);
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

  /** Tên một ô để báo trong log: "Hồn hoàn 437 năm", "3 Hồi Huyết Đan". */
  itemLabel(it: Item) {
    const name = itemDef(it.code)?.name ?? "vật phẩm lạ";
    return it.years !== null ? `${name} ${formatYears(it.years)}` : it.qty > 1 ? `${it.qty} ${name}` : name;
  }

  /**
   * Nhặt hồn hoàn gần nhất (cách dưới PICKUP_RANGE) vào túi đồ (mục 5.2 "Hồn hoàn là vật phẩm"): DROP_OWNER_SECS giây đầu chỉ
   * người hạ hồn thú nhặt được; túi đầy thì báo và hồn hoàn ở lại dưới đất. Client chỉ gửi ý định, server chọn theo vị trí.
   */
  pickup(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || p.dead || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    let best: [string, DropState] | undefined, bd = PICKUP_RANGE;
    for (const [did, dr] of this.state.drops.entries()) { const dd = Math.hypot(dr.x - p.x, dr.y - p.y); if (dd < bd) { bd = dd; best = [did, dr]; } }
    if (!best) return warn("Không có hồn hoàn nào ở gần để nhặt.");
    const [did, dr] = best, label = formatYears(dr.years);
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
   * Từ 2.5c: `lei {v}` (đặt Phong Lôi Chi Lực, tính như vừa giao chiến; đủ max thì chỉ tung khi đánh trúng lần tới).
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
      const bid = this.addBeast(0, yearsOf(0), 0, p.x + int(o.dx, -200, 200, 0), p.y + int(o.dy, -200, 200, 0));
      this.state.beasts.get(bid)!.hp = 1; this.bdata.get(bid)!.wt = 1e9;
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
      else got = this.addItem(d, code, qty);
      if (got < qty) this.log(id, itemDef(code) ? `Túi đồ đã đầy (${BAG_SLOTS} ô): ${qty - got} món không nhận được.` : "Vật phẩm không tồn tại.", "#ffb35c");
      this.sendBag(id);
    }
    else if (op === "coin") { d.honTe = int(o.n, 0, 1e12, d.honTe); d.bagDirty = true; this.sendBag(id); }
    else if (op === "drain") { d.mpF = Math.floor(d.mpF * (100 - int(o.pct, 0, 100, 0)) / 100); p.mp = Math.floor(d.mpF); }
    else if (op === "lei") { d.lei = int(o.v, 0, PHONG_LOI.max, 0); p.lei = d.lei; d.fight = 0; }
    else if (op === "energy") { const v = int(o.v, 0, TIEN_CO_MAX, 0); d.fight = 0; for (const r of d.team) if (r && !d.down.has(r)) d.energy.set(r, v); }
    else if (op === "spawn") {
      const years = yearsOf(int(o.tier, 0, TIERS.length - 1, 0));
      const x = Math.max(8, Math.min(this.map.MW * TILE - 8, p.x + int(o.dx, -200, 200, 20)));
      const y = Math.max(8, Math.min(this.map.MH * TILE - 8, p.y + int(o.dy, -200, 200, 0)));
      const zi = Math.max(0, this.map.zones.findIndex((z) => x >= z.x0 && x < z.x1));
      this.addBeast(zi, years, this.map.zones[zi]?.beasts[0]?.species ?? 0, x, y);
    }
    else if (op === "status") {
      const s = String(o.s ?? "") as StatusId, x = nearB();
      const a: StatusApply = { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) };
      if (x && (STATUS_IDS as readonly string[]).includes(s))
        for (const bid of o.all ? [...this.state.beasts.keys()].filter((k) => { const b = this.state.beasts.get(k)!; return Math.hypot(b.x - p.x, b.y - p.y) < 160; }) : [x.bid])
          this.applyStatus(bid, a, id);
    }
    else if (op === "boom") { const x = nearB(); if (x) this.detonateBurn(x.bid); }
    else if (op === "bhp") { const x = nearB(); if (x) { x.b.hp = Math.max(1, Math.round(x.b.maxHp * int(o.pct, 1, 100, 100) / 100)); x.bd.calm = 0; x.bd.regen = 0; } }
    else if (op === "regen") { const x = nearB(); if (x) { const h0 = x.b.hp; this.regenBeast(x.b, x.bd, int(o.s, 0, 60, 0)); out = { gain: x.b.hp - h0 }; } }
    else if (op === "ready") { for (let i = 0; i < 4; i++) p.cds[i] = 0; d.mpF = p.maxMp * int(o.mp, 0, 100, 100) / 100; p.mp = Math.floor(d.mpF); }
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
    else if (op === "clear") this.state.beasts.forEach((b, bid) => { if (Math.hypot(b.x - p.x, b.y - p.y) < 160) { this.state.beasts.delete(bid); this.bdata.delete(bid); } });
    else if (op === "set") {
      const v = d.owned.find((x) => x.rowId === o.rowId);
      if (v) {
        this.syncCh(id);
        v.level = int(o.level, 1, 99, v.level); v.xp = int(o.xp, 0, 1e9, v.xp);
        if (Array.isArray(o.rings)) v.rings = o.rings.filter((y) => Number.isInteger(y) && y > 0).slice(0, MAX_RINGS) as number[];
        if (v === d.ch) { d.ringYears = [...v.rings]; this.showVohon(p, v); this.recalc(id, true); } else d.dirty.add(v.rowId);
      }
    }
    this.sendVohons(c);
    c.send("test", { op, enabled: true, ...out });
  }

  /**
   * Kinh nghiệm hạ hồn thú `years` năm (mục 5.1, 5.3; tăng theo số năm, beastStats): giảm theo chênh cấp với võ hồn ra trận một
   * lần (cấp tương đương vẫn tính theo bậc đến BĐ3), rồi chia cho đội:
   * võ hồn ra trận XP_SHARE_ACTIVE, mỗi võ hồn khác trong đội XP_SHARE_BENCH (kể cả võ hồn đã gục). Ô trống và võ hồn
   * ở bình cảnh không nhận, phần đó không chia lại.
   */
  rewardKill(id: string, years: number) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const base = beastStats(years).xp * xpLevelScale(p.level, beastLevel(tierOfYears(years)));
    for (const r of d.team) {
      const v = d.owned.find((o) => o.rowId === r); if (!v) continue;
      if (v === d.ch) this.addXp(id, Math.round(base * XP_SHARE_ACTIVE));
      else this.benchXp(id, v, Math.round(base * XP_SHARE_BENCH));
    }
  }

  /** Kinh nghiệm cho võ hồn trong đội đang không ra trận (cùng luật lên cấp, bình cảnh như addXp). */
  benchXp(id: string, v: Character, n: number) {
    if (n <= 0 || atBottleneck(v.level, v.rings.length)) return;
    const d = this.pdata.get(id)!, name = VOHON[Math.max(0, vohonIndex(v.vohon))].name;
    v.xp += n; d.dirty.add(v.rowId);
    while (!atBottleneck(v.level, v.rings.length) && v.xp >= xpNeed(v.level) && v.level < 99) {
      v.xp -= xpNeed(v.level); v.level++;
      if (!d.down.has(v.rowId)) d.benchHp.delete(v.rowId); // lên cấp thì hồi đầy, như võ hồn ra trận
      if (atBottleneck(v.level, v.rings.length)) {
        v.xp = 0;
        this.log(id, `${name} đạt cấp ${v.level}: bình cảnh! Cần hấp thụ hồn hoàn thứ ${v.rings.length + 1}.`, "#ffe08a");
      } else this.log(id, `${name} lên cấp ${v.level}.`);
    }
  }

  addXp(id: string, n: number) {
    const p = this.state.players.get(id)!;
    if (n <= 0 || atBottleneck(p.level, p.rings.length)) return;
    p.xp += n;
    while (!atBottleneck(p.level, p.rings.length) && p.xp >= xpNeed(p.level) && p.level < 99) {
      p.xp -= xpNeed(p.level); p.level++;
      this.recalc(id, false); this.pdata.get(id)!.hpF = p.maxHp;
      this.broadcast("fx", { k: "wave", x: p.x, y: p.y, r: 30, col: "#ffe9a0" });
      if (atBottleneck(p.level, p.rings.length)) {
        p.xp = 0;
        this.log(id, `Đạt cấp ${p.level}: bình cảnh! Hãy săn hồn thú và hấp thụ hồn hoàn thứ ${p.rings.length + 1}.`, "#ffe08a");
      } else this.log(id, `Lên cấp ${p.level}.`);
    }
    this.recalc(id, false);
  }

  hurtPlayer(id: string, dmg: number) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    if (d.inv > 0 || p.dead || d.travelling) return; // trong vùng an toàn hồn thú đã bỏ mục tiêu (tick) nên không đánh tới
    if (d.travelCast) { d.travelCast = null; this.log(id, "Bị tấn công: đã hủy đi qua cổng.", "#ffb35c"); }
    // Miễn sát thương (Vô Địch Thần Quang): không mất gì nhưng vẫn tính là bị đánh (giao chiến), hiện chữ "Miễn".
    if (this.buffV(d, "inv")) { d.fight = 0; d.inv = 0.45; this.broadcast("dmg", { x: p.x, y: p.y - 18, v: 0, c: "#fff2b0", id, immune: true }); return; }
    dmg = Math.round(dmg * VOHON[p.vh].def * (1 - Math.min(0.9, this.buffV(d, "def"))));
    // Khiên (tiên cơ phụ trợ) đỡ trước; vẫn tính là bị đánh (giao chiến, gián đoạn hấp thụ).
    const blocked = Math.min(d.shield, dmg); d.shield -= blocked; dmg -= blocked; p.shield = Math.ceil(d.shield);
    d.hpF -= dmg; d.inv = 0.45; d.lastHit = 0; d.fight = 0;
    // Khiên đỡ hết thì hiện số bị đỡ (màu lam) thay cho số 0.
    this.broadcast("dmg", { x: p.x, y: p.y - 18, v: -(dmg || blocked), c: blocked ? "#9ad8ff" : "#ff6b6b", id }); // id: client chạy animation hurt cho hồn sư này
    if (d.absorbing) { d.absorbing = null; p.absorb = 0; this.log(id, "Bị tấn công: quá trình hấp thụ bị gián đoạn!", "#ffb35c"); }
    if (d.hpF <= 0) { d.hpF = 0; p.hp = 0; this.knockOut(id); }
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
      p.dead = true; d.deadT = RESPAWN_SECS;
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
    if (!p || !d || p.dead || d.absorbing || d.atkCd > 0 || d.travelling) return;
    d.atkCd = 0.38;
    if (this.map.inSafe(p.x, p.y)) { d.atkCd = 1; return this.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c"); }
    this.unhide(p, d);
    const ax = p.x + d.dir.x * 10, ay = p.y - 6 + d.dir.y * 10;
    this.broadcast("fx", { k: "slash", id, dx: d.dir.x, dy: d.dir.y, col: VOHON[p.vh].col });
    const hit: Hit = { kind: "attack", done: false };
    this.state.beasts.forEach((b, bid) => {
      const size = TIERS[b.tier].size;
      if (Math.hypot(b.x - ax, b.y - size / 2 - ay) < 18 + size / 2) this.damageBeast(bid, this.atkOf(d) * (0.85 + Math.random() * 0.3), id, VOHON[p.vh].col, hit);
    });
  }

  /** Độ lớn hiệu ứng có lợi `b` đang có trên hồn sư (0 = không có). */
  buffV(d: PData, b: BuffId) { return d.buffs.get(b)?.v ?? 0; }
  /** Công hiện tại của võ hồn ra trận, tính cả hiệu ứng tăng công. */
  atkOf(d: PData) { return d.atk * (1 + this.buffV(d, "atk")); }
  /** Đồng bộ PlayerState.buff (bit theo BUFF_IDS) để mọi người thấy hào quang. */
  syncBuffs(p: PlayerState, d: PData) { let m = 0; for (const b of d.buffs.keys()) m |= buffBit(b); p.buff = m; }
  /** Đánh thường hoặc tung hồn kỹ thì hết tàng hình (Yêu Hồ, 2.5c). */
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
      const max = this.maxHpOf(v), hp = d.benchHp.get(r)! + max * frac;
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
    if (e.heal) this.healTeam(id, e.heal * bpow);
    if (e.shield) { d.shield = Math.max(d.shield, Math.round(p.maxHp * e.shield * bpow)); d.shieldT = Math.max(d.shieldT, secs); p.shield = d.shield; }
    if (e.mp) { d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * e.mp * bpow); p.mp = Math.floor(d.mpF); }
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
      if (sk.push) this.pushBeast(bid, p, sk.push);
      // Viêm bạo (Hỏa Long): kích nổ mọi tầng Thiêu đốt rồi đặt lại `keep` tầng.
      if (sk.boom) { this.detonateBurn(bid); if (sk.boom.keep > 0) this.applyStatus(bid, { s: "burn", n: sk.boom.keep }, id, power); }
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
    const def = STATUS[a.s];
    if (a.s === "allure" && bd.st.has("charm")) return; // đang Mê hoặc thì không cộng Mị hoặc (không khống chế nối liền)
    const secs = (a.secs ?? def.secs) * (def.noMove || def.noAtk ? CC_TIER_MULT[b.tier] ?? 1 : 1);
    const v = def.dot ? this.atkOf(pd) * def.dot * power : def.amp;
    const cur = bd.st.get(a.s), n = a.n ?? 1;
    if (cur) { cur.n = Math.min(def.max, cur.n + n); cur.t = Math.max(cur.t, secs); cur.v = Math.max(cur.v, v); cur.src = by; }
    else bd.st.set(a.s, { t: secs, n: Math.min(def.max, n), v, src: by });
    if (def.noMove) { bd.kx = 0; bd.ky = 0; }
    // Đủ tầng thì bùng phát (2.5c): Mị hoặc thành Mê hoặc, Phong ấn thành Dễ thương 6,8 giây; tầng về 0.
    if (def.burst && bd.st.get(a.s)!.n >= def.max) {
      bd.st.delete(a.s);
      this.applyStatus(bid, { s: def.burst.s, ...(def.burst.secs ? { secs: def.burst.secs } : {}) }, by, power);
      if (def.burst.s === "charm") { bd.target = null; b.aggro = false; }
    }
    this.syncStatus(b, bd);
  }

  /** Đồng bộ trạng thái hồn thú cho client: bit theo STATUS_IDS và số tầng Thiêu đốt / Trúng độc / Phá giáp / Mị hoặc / Phong ấn. */
  syncStatus(b: BeastState, bd: BData) {
    let m = 0; for (const s of bd.st.keys()) m |= statusBit(s);
    b.st = m; b.burn = bd.st.get("burn")?.n ?? 0; b.poison = bd.st.get("poison")?.n ?? 0; b.armor = bd.st.get("armor")?.n ?? 0;
    b.allure = bd.st.get("allure")?.n ?? 0; b.lock = bd.st.get("lock")?.n ?? 0;
  }

  /** Viêm bạo: kích nổ mọi tầng Thiêu đốt còn lại cùng lúc (sát thương còn lại × boom), xóa Thiêu đốt. Hỏa Long dùng (SkillDef.boom, 2.5b). */
  detonateBurn(bid: string) {
    const bd = this.bdata.get(bid), s = bd?.st.get("burn"); if (!bd || !s) return;
    bd.st.delete("burn"); this.syncStatus(this.state.beasts.get(bid)!, bd);
    this.damageBeast(bid, s.v * s.n * s.t * STATUS.burn.boom, s.src, STATUS.burn.col, undefined, { direct: false });
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
    const set = skillsOf(VOHON[p.vh].id), sk = set[i], cost = sk.cost * (1 - Math.min(0.9, this.buffV(d, "mp")));
    // Phục Chế (Xúc Xích, 2.5c): tung lại hồn kỹ gần nhất của võ hồn khác còn trong đội; chưa có thì không tung.
    const last = d.lastSkill, src = sk.copy && last && last.row !== d.ch.rowId && d.team.includes(last.row) ? last : null;
    if (sk.copy && !src) return this.log(id, `${sk.name}: chưa có hồn kỹ của võ hồn khác trong đội để sao chép.`);
    const run = src?.sk ?? sk;
    if (d.mpF < cost) return this.log(id, "Không đủ hồn lực.");
    const reach = run.area === "target" ? run.r : run.at;
    if (reach && !this.nearestBeast(p, reach)) return this.log(id, `${run.name}: không có hồn thú trong tầm.`);
    d.mpF -= cost; p.cds[i] = sk.cd;
    this.unhide(p, d);
    const tier = p.rings[i], years = d.ringYears[i] ?? TIERS[tier].years;
    this.broadcast("fx", { k: "soulring", id, tier, i, vh: p.vh }); // i: vòng hồn hoàn của hồn kỹ, client làm sáng vòng đó và hiện tên hồn kỹ
    if (src) this.log(id, `${sk.name}: sao chép ${run.name}.`, VOHON[p.vh].col);
    this.runSkill(id, run, skillPower(years) * (sk.copy ?? 1), buffPower(years), run.glow ? TIERS[tier].glow : VOHON[p.vh].col, { kind: "skill", done: false });
    if (!set.some((x) => x.copy)) d.lastSkill = { sk, row: d.ch.rowId };
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
    const direct = o.direct !== false && !o.chain;
    const vuln = bd.st.get("vuln"), armor = bd.st.get("armor");
    dmg *= 1 + (vuln ? vuln.v : 0) + (direct && armor ? armor.v * armor.n : 0) + this.phoenixAmp(b);
    const crit = direct && Math.random() < CRIT.chance + (o.crit ?? 0) + this.buffV(pd, "crit"); if (crit) dmg *= CRIT.mult;
    dmg = Math.max(1, Math.round(dmg));
    b.hp = Math.max(0, b.hp - dmg); b.aggro = true; bd.target = by; bd.hitBy = by; bd.calm = 0;
    if (o.direct !== false) pd.fight = 0; // sát thương theo thời gian không giữ hồn sư trong giao chiến
    if (direct && !bd.st.has("stun") && !bd.st.has("root")) {
      const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1, kb = b.tier >= 3 ? 40 : 110;
      bd.kx = (dx / dd) * kb; bd.ky = (dy / dd) * kb;
    }
    this.broadcast("dmg", { x: b.x, y: b.y - TIERS[b.tier].size, v: dmg, crit, c: crit ? "#ffe14d" : col, bid });
    if (hit && !hit.done) { hit.done = true; this.gainEnergy(by, hit.kind); this.gainLei(by, hit.kind, bd.st.has("shock")); }
    if (o.lifesteal) { pd.hpF = Math.min(p.maxHp, pd.hpF + dmg * o.lifesteal); p.hp = Math.ceil(pd.hpF); }
    // Cảm điện: lan một phần sát thương sang hồn thú Cảm điện khác gần đó (một bước, không lan tiếp).
    if (direct && bd.st.has("shock")) {
      const sh = STATUS.shock;
      for (const [oid, ob] of [...this.state.beasts.entries()])
        if (oid !== bid && this.bdata.get(oid)?.st.has("shock") && Math.hypot(ob.x - b.x, ob.y - b.y) < sh.chainR)
          this.damageBeast(oid, dmg * sh.chain, by, sh.col, undefined, { chain: true });
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

  /** Bộ hồn hạch Tiên Cơ (mục 5.6) của một võ hồn: 2 món tích nhanh hơn, 4 món tiên cơ mạnh hơn. Chưa có hồn hạch (GĐ5). */
  tienCoSet(_v: Character) { return { set2: false, set4: false }; }

  /** Võ hồn ra trận đánh trúng: mỗi võ hồn khác trong đội chưa gục tích năng lượng tiên cơ (mục 5.1 "Trong trận"). */
  gainEnergy(id: string, kind: Hit["kind"]) {
    const d = this.pdata.get(id); if (!d) return;
    for (const r of d.team) {
      const v = d.owned.find((o) => o.rowId === r);
      if (!v || v === d.ch || d.down.has(r)) continue;
      d.energy.set(r, Math.min(TIEN_CO_MAX, (d.energy.get(r) ?? 0) + energyGain(kind, this.tienCoSet(v).set2)));
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
    const mult = tienCoDmgMult(this.tienCoSet(d.ch).set4), dmg = this.atkOf(d) * tc.dmg * mult, col = def.col, x0 = p.x, y0 = p.y;
    const own = TIEN_CO_RIENG[def.id];
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
      this.healTeam(id, tc.heal);
      d.shield = Math.max(d.shield, Math.round(p.maxHp * tc.shield)); d.shieldT = tc.shieldSecs; p.shield = d.shield;
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

  /** Hạ hồn thú: kinh nghiệm, Hồn Tệ, và hồn hoàn rơi xuống đất mang đúng số năm của hồn thú (mục 5.2); người hạ được ưu tiên nhặt. */
  killBeast(bid: string, by: string) {
    const b = this.state.beasts.get(bid)!; const td = TIERS[b.tier], name = BEASTS[b.species]?.name ?? "hồn thú", age = formatYears(b.years);
    this.state.beasts.delete(bid); this.bdata.delete(bid);
    const p = this.state.players.get(by)!; p.kills++;
    this.rewardKill(by, b.years);
    const coin = this.rewardCoin(by, b.tier);
    const drop = new DropState();
    drop.x = b.x; drop.y = b.y; drop.tier = b.tier; drop.years = b.years; drop.owner = by; drop.ownerTtl = DROP_OWNER_SECS; drop.ttl = DROP_TTL_SECS;
    this.state.drops.set(uid("d"), drop);
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: td.size + 10, col: td.glow });
    this.log(by, `Hạ ${name} (${age}), nhận ${formatHonTe(coin)} Hồn Tệ. Hồn hoàn ${age} rơi xuống đất: ${DROP_OWNER_SECS} giây đầu chỉ bạn nhặt được (phím E).`, td.glow);
  }

  // ---------- Hồn hoàn ----------
  /**
   * Luật hấp thụ theo bậc (bản cũ, mục 4), tạm giữ cho hồn hoàn trong túi đến bước 3.3 (giới hạn theo truyện, mục 5.2): phải ở
   * bình cảnh; vượt giới hạn vòng (ringLimit) 1 bậc thì ABSORB_RISK thất bại, từ 2 bậc thì không cho.
   */
  absorbCheck(p: PlayerState, years: number) {
    const slot = p.rings.length + 1, over = tierOfYears(years) - ringLimit(slot);
    if (p.level < slot * 10) return { ok: false, msg: `Cần đạt cấp ${slot * 10} (bình cảnh) mới hấp thụ được hồn hoàn thứ ${slot}.` };
    if (over >= 2) return { ok: false, msg: `Hồn hoàn ${formatYears(years)} quá mạnh cho vòng thứ ${slot}. Cơ thể không chịu nổi.` };
    return { ok: true, risk: over === 1 ? ABSORB_RISK : 0, msg: "" };
  }

  /**
   * Hấp thụ hồn hoàn trong túi vào võ hồn đang ra trận (từ 3.2; client gửi id ô, server kiểm tra ô thuộc túi của chính người gửi).
   * Hồn hoàn nằm trong túi suốt lúc hấp thụ: di chuyển hoặc bị đánh thì hủy, không mất gì. Chọn võ hồn khác để 3.3.
   */
  tryAbsorb(c: Client, raw: unknown) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.travelling) return;
    if (d.travelCast) return this.log(id, "Đang đi qua cổng, không thể hấp thụ.", "#ffb35c");
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
    if (!it || it.code !== RING_ITEM || it.years === null) return this.log(id, "Hãy chọn một hồn hoàn trong túi đồ để hấp thụ (phím B).", "#ffb35c");
    const chk = this.absorbCheck(p, it.years);
    if (!chk.ok) return this.log(id, chk.msg, "#ffb35c");
    const tier = tierOfYears(it.years);
    d.absorbing = { itemId: it.id, t: 0, dur: absorbSecs(tier), risk: chk.risk! };
    p.absorbTier = tier; p.absorb = 0.001;
    this.log(id, chk.risk ? `Bắt đầu hấp thụ hồn hoàn ${formatYears(it.years)} vượt giới hạn: ${Math.round(chk.risk * 100)}% thất bại!`
      : `Bắt đầu hấp thụ hồn hoàn ${formatYears(it.years)}. Đừng di chuyển và đừng để bị tấn công.`, chk.risk ? "#ffb35c" : undefined);
  }

  finishAbsorb(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, a = d.absorbing!;
    d.absorbing = null; p.absorb = 0;
    const it = d.bag.find((i) => i.id === a.itemId); if (!it || it.years === null) return;
    const years = it.years, tier = tierOfYears(years), td = TIERS[tier], age = formatYears(years);
    // Thành công hay thất bại hồn hoàn đều rời túi (thất bại là vỡ tan).
    this.takeItem(d, it, 1); this.sendBag(id);
    if (Math.random() < a.risk) {
      d.hpF = Math.max(1, Math.round(d.hpF * ABSORB_FAIL_HP));
      this.log(id, `Thất bại! Hồn hoàn ${age} vỡ tan, bạn bị phản phệ nặng.`, "#ff8a8a");
      this.save(id); return;
    }
    p.rings.push(tier); d.ringYears.push(years); p.level = Math.min(99, p.level + 1); p.xp = 0;
    this.recalc(id, true);
    this.broadcast("fx", { k: "absorbed", id, tier });
    const n = p.rings.length;
    this.log(id, `Hấp thụ thành công hồn hoàn ${age}! Lên cấp ${p.level}.` + (n <= 4 ? ` Nhận Hồn kỹ ${n}: ${skillsOf(VOHON[p.vh].id)[n - 1].name}.` : ""), td.glow);
    this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã hấp thụ hồn hoàn thứ ${n} (${age}).` });
    this.save(id);
  }

  // ---------- Hồn thú ----------
  /**
   * Sinh một hồn thú trong vùng `zi`: tuổi ngẫu nhiên trong khoảng `years` của vùng (bảng 5.3; vùng thiếu `years` thì tung bậc
   * theo `weights` rồi tung tuổi trong bậc), loài theo trọng số `beasts` của vùng. Mỗi phòng tối đa 1 hồn thú thường
   * MAX_YEARS năm cùng lúc (mục 5.3): đã có thì tung dưới mức đó.
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
      if (this.map.hits(x, y, 6, 4) || this.map.inSpawn(x, y) || this.map.inSafe(x, y)) continue;
      if ([...this.state.players.values()].some((p) => Math.hypot(p.x - x, p.y - y) < 140)) continue;
      this.addBeast(zi, years, species, x, y);
      return;
    }
  }

  /** Thêm hồn thú `years` năm: bậc (màu, kích thước) suy từ số năm, máu và sát thương tăng liên tục theo số năm (beastStats). */
  addBeast(zi: number, years: number, species: number, x: number, y: number) {
    const st = beastStats(years), b = new BeastState();
    b.x = x; b.y = y; b.years = years; b.tier = tierOfYears(years); b.species = species; b.hp = b.maxHp = st.hp;
    const id = uid("b"); this.state.beasts.set(id, b);
    this.bdata.set(id, { zone: zi, hx: x, hy: y, tx: x, ty: y, wt: 0, cd: 0, kx: 0, ky: 0, target: null, hitBy: null, anim: 0,
      st: new Map(), dotT: 0, calm: 99, regen: 0, dmg: st.dmg });
    return id;
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
      for (let i = 0; i < 4; i++) if (p.cds[i] > 0) p.cds[i] = Math.max(0, p.cds[i] - dt);
      if (p.swCd > 0) p.swCd = Math.max(0, p.swCd - dt);
      if (d.danCd > 0) d.danCd = Math.max(0, d.danCd - dt);
      if (d.shieldT > 0) { d.shieldT -= dt; if (d.shieldT <= 0) d.shield = 0; p.shield = Math.ceil(d.shield); }
      if (d.buffs.size) {
        for (const [b, x] of d.buffs) { x.t -= dt; if (x.t <= 0 || p.dead) d.buffs.delete(b); } // cả đội gục thì mất hiệu ứng có lợi
        this.syncBuffs(p, d);
      }
      if (d.travelling) { p.moving = false; return; } // đang chuyển bản đồ: đứng yên chờ client rời phòng
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
      const { x: ix, y: iy } = d.input; const il = Math.hypot(ix, iy);
      p.moving = il > 0.15;
      if (p.moving) {
        if (d.absorbing) { d.absorbing = null; p.absorb = 0; this.log(id, "Di chuyển: đã hủy hấp thụ."); }
        const sp = d.speed * (1 + this.buffV(d, "spd"));
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
        const v = d.owned.find((o) => o.rowId === r), max = v ? this.maxHpOf(v) : 0;
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
      // Từ 2.5c: hồn thú đang Mê hoặc bỏ mục tiêu, đi lung tung.
      const charm = bd.st.has("charm");
      if (charm) bd.target = null;
      let tgt = bd.target ? this.state.players.get(bd.target) : undefined;
      // Không đuổi theo người đã vào vùng an toàn, đang chuyển bản đồ (mục 5.3, 6) hoặc đang tàng hình (Yêu Hồ, 2.5c).
      const off = (p: PlayerState, pid: string) => { const pd = this.pdata.get(pid); return p.dead || this.map.inSafe(p.x, p.y) || !!pd?.travelling || !!pd?.buffs.has("hide"); };
      if (tgt && (off(tgt, bd.target!) || Math.hypot(b.x - bd.hx, b.y - bd.hy) > 220)) { bd.target = null; tgt = undefined; }
      if (!tgt && b.tier >= 1 && !charm) {
        let best = 70;
        this.state.players.forEach((p, pid) => { if (off(p, pid)) return; const dd = Math.hypot(p.x - b.x, p.y - b.y); if (dd < best) { best = dd; bd.target = pid; tgt = p; } });
      }
      b.aggro = !!tgt;
      const hw = Math.max(3, td.size / 3);
      // Khống chế (mục 5.1): Choáng đứng yên và không đánh; Trói không đi (vẫn đánh khi kề bên); Câm lặng không đánh.
      // Bị khống chế không di chuyển thì cũng không bị đẩy lùi.
      // Từ 2.5c đọc cờ trong bảng STATUS (Mê hoặc không đánh); Làm chậm / Mị hoặc giảm tốc độ theo tầng (tối đa SLOW_CAP).
      const stun = bd.st.has("stun");
      let noMove = false, noAtk = false, slow = 0;
      for (const [s, x] of bd.st) { const def = STATUS[s]; noMove ||= def.noMove; noAtk ||= def.noAtk; slow += def.slow * x.n; }
      if (!tgt && bd.calm > BEAST_REGEN.delay) this.regenBeast(b, bd, dt);
      if (stun) { bd.kx = 0; bd.ky = 0; b.moving = false; return; }
      if (noMove) { bd.kx = 0; bd.ky = 0; }
      if (bd.kx || bd.ky) { this.moveBeast(b, bd.kx * dt, bd.ky * dt, hw); bd.kx *= 0.85; bd.ky *= 0.85; if (Math.abs(bd.kx) < 2 && Math.abs(bd.ky) < 2) { bd.kx = 0; bd.ky = 0; } }
      let mx = 0, my = 0, sp = td.spd * (1 - Math.min(SLOW_CAP, slow));
      if (tgt) {
        const dx = tgt.x - b.x, dy = tgt.y - b.y, dd = Math.hypot(dx, dy);
        if (dd > td.size / 2 + 6) { if (!noMove) { mx = dx / dd; my = dy / dd; } }
        else if (bd.cd <= 0 && !noAtk) { bd.cd = 1.1; this.hurtPlayer(bd.target!, bd.dmg * (0.85 + Math.random() * 0.3)); }
      } else {
        bd.wt -= dt;
        // Mê hoặc: đổi hướng liên tục quanh chỗ đang đứng, đi nhanh hơn lúc lang thang thường.
        if (charm && bd.wt > 0.7) bd.wt = 0;
        if (bd.wt <= 0) {
          const [ox, oy, w] = charm ? [b.x, b.y, 80] : [bd.hx, bd.hy, 120];
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
      if (dr.ttl <= 0) this.state.drops.delete(id);
    });

    // hồi sinh hồn thú
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.2;
      const { zones } = this.map, counts = zones.map(() => 0); this.bdata.forEach((b) => counts[b.zone]++);
      zones.forEach((z, i) => { if (counts[i] < z.count) this.spawnBeast(i); });
    }

    // lưu định kỳ (bỏ qua người đang chuyển bản đồ: transaction đi cổng là lần ghi cuối của phòng này cho người đó)
    this.saveT += dt;
    if (this.saveT > 30) { this.saveT = 0; this.pdata.forEach((d, id) => { if (!d.travelling) this.save(id); }); }
  }

  /** Hồn thú di chuyển nhưng không bước vào vùng an toàn. */
  moveBeast(b: BeastState, dx: number, dy: number, hw: number) {
    const ox = b.x, oy = b.y;
    this.map.moveEnt(b, dx, dy, hw, 3);
    if (this.map.inSafe(b.x, b.y)) { b.x = ox; b.y = oy; }
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
