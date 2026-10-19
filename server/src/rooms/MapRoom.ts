// Phòng của một bản đồ (mapId): toàn bộ logic game chạy ở đây (server-authoritative).
// Mỗi bản đồ có thể có nhiều phòng (kênh); mọi phòng dùng chung một lớp, khác nhau ở dữ liệu bản đồ.
// Client chỉ gửi ý định (hướng di chuyển, bấm đánh...), server quyết định kết quả.
import { Room, Client, ServerError } from "colyseus";
import { MapState, PlayerState, BeastState, DropState } from "./schema.ts";
import { TIERS, VOHON, ringLimit, xpNeed, atBottleneck, calcStats, TICK_RATE, tierOfYears, vohonIndex,
  AWAKEN_GIFT, AWAKEN_CHOICES, TEAM_SIZE, SWITCH_CD, TEAM_COMBAT_SECS, REVIVE_SECS, RESPAWN_SECS, XP_SHARE_ACTIVE, XP_SHARE_BENCH,
  beastLevel, xpLevelScale, MAX_RINGS, parseTeam, BEASTS, MAPS, DEFAULT_MAP, parseLooks, dir4, type Looks,
  TIEN_CO, TIEN_CO_MAX, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY, energyGain, tienCoDmgMult, TILE,
  STATUS, STATUS_IDS, STATUS_TICK, CC_TIER_MULT, BEAST_REGEN, statusBit, BUFF_IDS, buffBit, CRIT, skillPower, buffPower, PCT_HP_CAP,
  PROJ_SPEED, skillsOf, TIEN_CO_RIENG, type SkillDef, type StatusId, type StatusApply, type BuffId } from "../../../shared/data.ts";
import { loadMap, type GameMap } from "../map.ts";
import { store, Character, type AccountLooks } from "../db.ts";
import { chatCheck } from "../ratelimit.ts";

interface PData {
  accountId: number;
  owned: Character[];   // mọi võ hồn sở hữu (chỉ gửi cho chính chủ)
  team: number[];       // đội hình: rowId võ hồn theo ô (TEAM_SIZE ô, 0 = trống); chỉ gửi cho chính chủ
  ch: Character;        // võ hồn đang ra trận, là một phần tử của owned và luôn nằm trong team
  ringYears: number[];  // niên hạn thật của từng hồn hoàn; p.rings chỉ là bậc để hiển thị
  input: { x: number; y: number }; dir: { x: number; y: number };
  atk: number; speed: number; atkCd: number; inv: number; lastHit: number; deadT: number;
  absorbing: { dropId: string; t: number; dur: number; risk: number } | null;
  mpF: number; hpF: number; // hpF: sinh lực của võ hồn ra trận
  benchHp: Map<number, number>; // sinh lực các võ hồn khác (rowId -> sinh lực; không có = đầy). Không lưu DB: vào lại thì hồi đầy
  down: Map<number, number>;    // võ hồn đã gục: rowId -> số giây ngoài trận còn lại trước khi hồi (REVIVE_SECS)
  dirty: Set<number>;           // võ hồn không ra trận có tiến độ chưa lưu (kinh nghiệm chia cho đội)
  squadKey: string; squadT: number; // tin riêng "squad": nội dung lần gửi trước, đếm giờ kiểm tra lại
  fight: number;        // số giây kể từ lần cuối đánh trúng hoặc bị đánh
  teamSaving: Promise<void> | null; teamDirty: boolean; // lưu đội hình: tối đa một lần ghi đang chạy, lần sau ghi bản mới nhất
  energy: Map<number, number>;  // năng lượng tiên cơ từng võ hồn trong đội (rowId -> 0..TIEN_CO_MAX; không có = 0). Không lưu DB
  shield: number; shieldT: number; // khiên của hồn sư (tiên cơ phụ trợ) và số giây còn lại
  buffs: Map<BuffId, { t: number; v: number }>; // hiệu ứng có lợi của hồn sư (hồn kỹ phụ trợ): giây còn lại, độ lớn; đổi võ hồn vẫn còn
}
/** Một đòn đánh thường / một lần tung hồn kỹ: năng lượng tiên cơ chỉ tính một lần dù trúng nhiều hồn thú hay nhiều mũi đạn. */
interface Hit { kind: "attack" | "skill"; done: boolean; }
interface AuthData { accountId: number; ch: Character; owned: Character[]; team: number[]; looks: Looks; }
/** Một trạng thái trên hồn thú: giây còn lại, số tầng, độ lớn mỗi tầng (sát thương mỗi giây hoặc tỉ lệ), người gây. */
interface SInst { t: number; n: number; v: number; src: string; }
interface BData {
  zone: number; hx: number; hy: number; tx: number; ty: number; wt: number; cd: number; kx: number; ky: number; target: string | null; hitBy: string | null; anim: number;
  st: Map<StatusId, SInst>; // trạng thái dùng chung (mục 5.1) đang có
  dotT: number;             // đếm giờ tới lần gây sát thương theo thời gian kế tiếp (STATUS_TICK)
  calm: number;             // số giây kể từ lần cuối bị đánh (hồi máu khi không có mục tiêu, BEAST_REGEN)
  regen: number;            // phần lẻ sinh lực hồi chưa cộng (sinh lực đồng bộ là số nguyên)
}
/** Mũi hồn kỹ đang bay: chạm hồn thú đầu tiên thì gọi `fire` (sát thương và trạng thái của hồn kỹ). */
interface Proj { x: number; y: number; vx: number; vy: number; life: number; fire: (bid: string) => void; }
/** Tùy chọn của một lần gây sát thương lên hồn thú. `direct` = false: sát thương theo thời gian (không chí mạng, không đẩy lùi,
 *  không tính Phá giáp, không lan Cảm điện). `chain`: sát thương lan của Cảm điện (không chí mạng, không lan tiếp). */
interface DmgOpt { crit?: number; lifesteal?: number; direct?: boolean; chain?: boolean; }

let nextId = 1;
const uid = (p: string) => p + (nextId++).toString(36);

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

  async onAuth(_client: Client, options: { token?: string }) {
    const acc = options?.token ? await store.accountFromToken(options.token) : null;
    if (!acc) throw new ServerError(401, "Phiên đăng nhập không hợp lệ.");
    const [ch, owned, looks] = await Promise.all([store.getCharacter(acc.accountId), store.listVohons(acc.accountId), store.getLooks(acc.accountId)]);
    // Tạo nhân vật trước (tài khoản cũ cũng phải chọn một lần), rồi mới đến lễ thức tỉnh.
    if (!looks.chosen) throw new ServerError(403, "Chưa tạo nhân vật.");
    if (!ch) throw new ServerError(403, "Chưa thức tỉnh võ hồn.");
    const auth: AuthData = { accountId: acc.accountId, ch: owned.find((v) => v.rowId === ch.rowId) ?? ch, owned, team: [], looks };
    if (!owned.includes(auth.ch)) owned.push(auth.ch);
    // Đội hình (tài khoản cũ được tự xếp trong store). Bỏ ô trỏ tới võ hồn không còn sở hữu; võ hồn ra trận luôn nằm trong đội.
    const team = (await store.getTeam(acc.accountId)).map((r) => (owned.some((v) => v.rowId === r) ? r : 0));
    if (!team.includes(auth.ch.rowId)) {
      const first = owned.find((v) => team.includes(v.rowId));
      if (first) auth.ch = first; else team[0] = auth.ch.rowId;
    }
    auth.team = team;
    return auth;
  }

  onCreate(options: { mapId?: unknown }) {
    // Đến BĐ2 client chưa gửi mapId: server dùng bản đồ mặc định. Client đọc state.mapId để tải đúng file Tiled.
    const mapId = options?.mapId ?? DEFAULT_MAP;
    if (typeof mapId !== "string" || !Object.hasOwn(MAPS, mapId)) throw new ServerError(400, "Bản đồ không tồn tại.");
    this.map = loadMap(mapId);
    this.state.mapId = mapId;
    // Ghi mapId vào listing để filterBy(["mapId"]) ghép đúng phòng cả khi phòng được mở mà không có mapId trong tham số.
    this.listing.mapId = mapId;
    const { zones } = this.map;
    for (let z = 0; z < zones.length; z++) for (let i = 0; i < zones[z].count; i++) this.spawnBeast(z);
    this.setSimulationInterval((ms) => this.tick(Math.min(ms, 100) / 1000), 1000 / TICK_RATE);

    this.onMessage("input", (c, m: { x: number; y: number }) => {
      const d = this.pdata.get(c.sessionId); if (!d) return;
      let x = Number(m?.x) || 0, y = Number(m?.y) || 0; const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
      d.input = { x, y };
    });
    this.onMessage("attack", (c) => this.attack(c.sessionId));
    this.onMessage("skill", (c, m: { i: number }) => this.skill(c, Number(m?.i)));
    this.onMessage("absorb", (c) => this.tryAbsorb(c));
    this.onMessage("vohons", (c) => this.sendVohons(c));
    this.onMessage("team", (c, m: { slots: unknown }) => this.setTeam(c, m?.slots));
    this.onMessage("switch", (c, m: { slot: number }) => this.switchSlot(c, Number(m?.slot)));
    this.onMessage("test", (c, m: unknown) => this.testHook(c, m));
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
    const { ch, owned, team, looks } = auth;
    // Một tài khoản chỉ được vào một lần: đá phiên cũ.
    for (const other of this.clients) if (other !== client && (other.auth as AuthData)?.accountId === auth.accountId) other.leave(4001);
    const p = new PlayerState();
    p.name = ch.name; this.showVohon(p, ch);
    p.sex = looks.sex; p.hair = looks.hair; p.hairCol = looks.hairCol; p.outfitCol = looks.outfitCol;
    const pos = this.spawnPoint(); p.x = pos.x; p.y = pos.y;
    const d: PData = { accountId: auth.accountId, owned, team, ch, ringYears: [...ch.rings], input: { x: 0, y: 0 }, dir: { x: 1, y: 0 },
      atk: 0, speed: 0, atkCd: 0, inv: 1.5, lastHit: 99, deadT: 0, absorbing: null, mpF: 0, hpF: 0, fight: 99, teamSaving: null, teamDirty: false,
      benchHp: new Map(), down: new Map(), dirty: new Set(), squadKey: "", squadT: 0, energy: new Map(), shield: 0, shieldT: 0, buffs: new Map() };
    this.pdata.set(client.sessionId, d);
    this.state.players.set(client.sessionId, p);
    this.recalc(client.sessionId, true);
    this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã vào rừng.` }, { except: client });
  }

  async onLeave(client: Client) {
    const p = this.state.players.get(client.sessionId);
    if (p) {
      await this.save(client.sessionId).catch((e) => console.error("Lưu thất bại", e));
      await this.pdata.get(client.sessionId)?.teamSaving;
      this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã rời rừng.` });
    }
    this.state.players.delete(client.sessionId);
    this.pdata.delete(client.sessionId);
  }

  async onDispose() {
    await Promise.all([...this.state.players.keys()].map((id) => this.save(id).catch(() => {})));
    await Promise.all([...this.pdata.values()].map((d) => d.teamSaving));
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

  /** Lưu võ hồn ra trận và các võ hồn khác vừa nhận kinh nghiệm chia cho đội. */
  async save(id: string) {
    const d = this.pdata.get(id); if (!d) return;
    this.syncCh(id);
    d.dirty.delete(d.ch.rowId);
    const list = [d.ch, ...d.owned.filter((v) => d.dirty.has(v.rowId))]; d.dirty.clear();
    await Promise.all(list.map((v) => store.saveCharacter({ ...v, rings: [...v.rings] })
      .catch((e) => { if (v !== d.ch) d.dirty.add(v.rowId); throw e; })));
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
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
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
    if (!p || !d || !(Number.isInteger(slot) && slot >= 0 && slot < TEAM_SIZE)) return;
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
    if ((d.energy.get(next.rowId) ?? 0) >= TIEN_CO_MAX) { d.energy.set(next.rowId, 0); this.tienCo(id); }
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
    store.saveCharacter({ ...prev, rings: [...prev.rings] }).catch((e) => console.error("Lưu võ hồn thất bại", e));
  }

  /** Lưu đội hình cùng võ hồn ra trận. Đổi dồn dập thì không ghi chồng: chờ lần ghi đang chạy xong rồi ghi một lần bản mới nhất. */
  persistTeam(d: PData) {
    d.teamDirty = true;
    if (d.teamSaving) return;
    d.teamSaving = (async () => {
      while (d.teamDirty) {
        d.teamDirty = false;
        const ok = await store.saveTeam(d.accountId, [...d.team], d.ch.rowId).catch((e) => { console.error("Lưu đội hình thất bại", e); return true; });
        if (!ok) console.error(`Đội hình của tài khoản #${d.accountId} không hợp lệ, không lưu:`, d.team, d.ch.rowId);
      }
      d.teamSaving = null;
    })();
  }

  log(id: string, text: string, col?: string) { this.clients.getById(id)?.send("log", { text, col }); }

  /**
   * Hook kiểm thử cho bot (client/scripts/bot-test.mjs), chỉ chạy khi server bật biến môi trường GAME_TEST=1; mặc định chỉ trả
   * lời "không bật". Đi qua đúng các hàm luật chơi: `down` (võ hồn ra trận gục), `kill {tier}` (nhận kinh nghiệm như hạ hồn thú),
   * `rest {s}` (nghỉ ngoài trận s giây; hiệu ứng có lợi cũng trôi s giây), `set {rowId, level, xp, rings}` (đặt tiến độ một võ hồn của mình; có lưu DB),
   * `energy {v}` (đặt năng lượng tiên cơ mọi võ hồn chưa gục trong đội, tính như vừa giao chiến), `spawn {tier, dx, dy}` (sinh hồn thú cạnh mình),
   * `hurt {pct}` (võ hồn ra trận mất pct% sinh lực hiện có, bỏ qua khiên), `clear` (bỏ mọi hồn thú trong vòng 160 pixel quanh mình).
   * Từ 2.5a: `status {s, n, secs, all}` (gây trạng thái lên hồn thú gần nhất trong 160 pixel, `all`: mọi hồn thú trong 160 pixel,
   * bằng applyStatus với sức mạnh 1), `boom` (Viêm bạo lên hồn thú gần nhất), `beast {pct}` (hồn thú gần nhất còn pct% sinh lực,
   * coi như vừa bị đánh), `regen {s}` (hồn thú gần nhất hồi máu s giây bằng regenBeast; trả `gain`), `ready {mp}` (hết hồi chiêu
   * hồn kỹ, hồn lực còn mp%), `grant {vohon}` (thêm võ hồn bất kỳ, kể cả UR, vào tài khoản; có lưu DB). `down` / `hurt` bỏ qua cả
   * miễn sát thương.
   */
  testHook(c: Client, m: unknown) {
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, op = String(o.op ?? "");
    if (process.env.GAME_TEST !== "1") return c.send("test", { op, enabled: false });
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const int = (x: unknown, lo: number, hi: number, def: number) => (Number.isInteger(x) ? Math.max(lo, Math.min(hi, x as number)) : def);
    if ((op === "down" || op === "hurt") && d.buffs.delete("inv")) this.syncBuffs(p, d);
    const nearB = () => { const bid = this.nearestBeast(p, 160); return bid ? { bid, b: this.state.beasts.get(bid)!, bd: this.bdata.get(bid)! } : null; };
    let out: Record<string, unknown> = {};
    if (op === "down" && !p.dead) { d.inv = 0; d.shield = 0; this.hurtPlayer(id, d.hpF / VOHON[p.vh].def + 1); }
    else if (op === "hurt" && !p.dead) { d.inv = 0; d.shield = 0; this.hurtPlayer(id, Math.floor(d.hpF * int(o.pct, 0, 99, 0) / 100) / VOHON[p.vh].def); }
    else if (op === "kill") this.rewardKill(id, int(o.tier, 0, TIERS.length - 1, 0));
    else if (op === "rest") {
      const s = int(o.s, 0, 3600, 0); d.fight = Math.max(d.fight + s, TEAM_COMBAT_SECS);
      this.tickDowns(id, s); this.tickEnergy(id, s); this.sendSquad(id);
      for (const [b, x] of d.buffs) { x.t -= s; if (x.t <= 0) d.buffs.delete(b); } // hiệu ứng có lợi cũng hết giờ
      this.syncBuffs(p, d);
    }
    else if (op === "energy") { const v = int(o.v, 0, TIEN_CO_MAX, 0); d.fight = 0; for (const r of d.team) if (r && !d.down.has(r)) d.energy.set(r, v); }
    else if (op === "spawn") {
      const tier = int(o.tier, 0, TIERS.length - 1, 0), species = Math.max(0, BEASTS.findIndex((b) => b.tier === tier));
      const x = Math.max(8, Math.min(this.map.MW * TILE - 8, p.x + int(o.dx, -200, 200, 20)));
      const y = Math.max(8, Math.min(this.map.MH * TILE - 8, p.y + int(o.dy, -200, 200, 0)));
      this.addBeast(Math.max(0, this.map.zones.findIndex((z) => x >= z.x0 && x < z.x1)), tier, species, x, y);
    }
    else if (op === "status") {
      const s = String(o.s ?? "") as StatusId, x = nearB();
      const a: StatusApply = { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) };
      if (x && (STATUS_IDS as readonly string[]).includes(s))
        for (const bid of o.all ? [...this.state.beasts.keys()].filter((k) => { const b = this.state.beasts.get(k)!; return Math.hypot(b.x - p.x, b.y - p.y) < 160; }) : [x.bid])
          this.applyStatus(bid, a, id);
    }
    else if (op === "boom") { const x = nearB(); if (x) this.detonateBurn(x.bid); }
    else if (op === "beast") { const x = nearB(); if (x) { x.b.hp = Math.max(1, Math.round(x.b.maxHp * int(o.pct, 1, 100, 100) / 100)); x.bd.calm = 0; x.bd.regen = 0; } }
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
   * Kinh nghiệm hạ hồn thú bậc `tier` (mục 5.1, 5.3): giảm theo chênh cấp với võ hồn ra trận một lần, rồi chia cho đội:
   * võ hồn ra trận XP_SHARE_ACTIVE, mỗi võ hồn khác trong đội XP_SHARE_BENCH (kể cả võ hồn đã gục). Ô trống và võ hồn
   * ở bình cảnh không nhận, phần đó không chia lại.
   */
  rewardKill(id: string, tier: number) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const base = TIERS[tier].xp * xpLevelScale(p.level, beastLevel(tier));
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
    if (d.inv > 0 || p.dead) return;
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
    if (!p || !d || p.dead || d.absorbing || d.atkCd > 0) return;
    d.atkCd = 0.38;
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

  /** Hồn thú gần hồn sư nhất trong bán kính r. */
  nearestBeast(p: PlayerState, r: number) {
    let best: string | undefined, bd = r;
    for (const [bid, b] of this.state.beasts.entries()) { const dd = Math.hypot(b.x - p.x, b.y - p.y); if (dd < bd) { bd = dd; best = bid; } }
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
      this.map.moveEnt(b, (dx / dd) * s, (dy / dd) * s, hw, 3);
      if (b.x === x0 && b.y === y0) break;
    }
    bd.kx = 0; bd.ky = 0;
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
      const cur = d.buffs.get(b), val = b === "inv" ? 1 : v * bpow;
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
      if (dmg > 0) this.damageBeast(bid, dmg, id, col, hit, { crit: sk.crit, lifesteal: sk.lifesteal });
      for (const a of [...(sk.status ?? []), ...(last ? sk.finisher ?? [] : [])]) this.applyStatus(bid, a, id, power);
    };
    const near = (r: number) => [...this.state.beasts.entries()].filter(([, b]) => Math.hypot(b.x - p.x, b.y - p.y) < r).map(([bid]) => bid);
    if (sk.area === "around") {
      this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: sk.r, col, ...(sk.shake ? { shake: 0.5 } : {}) });
      const ids = near(sk.r);
      if (sk.pull) { this.broadcast("fx", { k: "pull", x: p.x, y: p.y - 4, r: sk.r, col }); for (const bid of ids) this.pullBeast(bid, p); }
      for (const bid of ids) strike(bid, true);
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
        this.projs.push({ x: p.x, y: p.y - 8, vx: Math.cos(a) * PROJ_SPEED, vy: Math.sin(a) * PROJ_SPEED, life: sk.r / PROJ_SPEED, fire: (bid) => strike(bid, true) });
      }
      this.broadcast("fx", ring ? { k: "burst", x: p.x, y: p.y - 8, col } : { k: "burst", x: p.x, y: p.y - 8, col, n, a0, spread, r: sk.r });
    } else if (sk.area === "target") {
      const bid = this.nearestBeast(p, sk.r), b = bid ? this.state.beasts.get(bid) : undefined;
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
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), pd = this.pdata.get(by);
    if (!b || !bd || b.hp <= 0 || !pd) return;
    const def = STATUS[a.s];
    const secs = (a.secs ?? def.secs) * (def.noMove || def.noAtk ? CC_TIER_MULT[b.tier] ?? 1 : 1);
    const v = def.dot ? this.atkOf(pd) * def.dot * power : def.amp;
    const cur = bd.st.get(a.s), n = a.n ?? 1;
    if (cur) { cur.n = Math.min(def.max, cur.n + n); cur.t = Math.max(cur.t, secs); cur.v = Math.max(cur.v, v); cur.src = by; }
    else bd.st.set(a.s, { t: secs, n: Math.min(def.max, n), v, src: by });
    if (def.noMove) { bd.kx = 0; bd.ky = 0; }
    this.syncStatus(b, bd);
  }

  /** Đồng bộ trạng thái hồn thú cho client: bit theo STATUS_IDS và số tầng Thiêu đốt / Trúng độc / Phá giáp. */
  syncStatus(b: BeastState, bd: BData) {
    let m = 0; for (const s of bd.st.keys()) m |= statusBit(s);
    b.st = m; b.burn = bd.st.get("burn")?.n ?? 0; b.poison = bd.st.get("poison")?.n ?? 0; b.armor = bd.st.get("armor")?.n ?? 0;
  }

  /** Viêm bạo: kích nổ mọi tầng Thiêu đốt còn lại cùng lúc (sát thương còn lại × boom), xóa Thiêu đốt. Chưa võ hồn nào dùng ở 2.5a. */
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
    if (!p || !d || p.dead || d.absorbing || !(i >= 0 && i < 4)) return;
    if (i >= p.rings.length) return this.log(id, `Hồn kỹ ${i + 1} cần hồn hoàn thứ ${i + 1}.`);
    if (p.cds[i] > 0) return;
    const sk = skillsOf(VOHON[p.vh].id)[i], cost = sk.cost * (1 - Math.min(0.9, this.buffV(d, "mp")));
    if (d.mpF < cost) return this.log(id, "Không đủ hồn lực.");
    if (sk.area === "target" && !this.nearestBeast(p, sk.r)) return this.log(id, `${sk.name}: không có hồn thú trong tầm.`);
    d.mpF -= cost; p.cds[i] = sk.cd;
    const tier = p.rings[i], years = d.ringYears[i] ?? TIERS[tier].years;
    this.broadcast("fx", { k: "soulring", id, tier, i, vh: p.vh }); // i: vòng hồn hoàn của hồn kỹ, client làm sáng vòng đó và hiện tên hồn kỹ
    this.runSkill(id, sk, skillPower(years), buffPower(years), sk.glow ? TIERS[tier].glow : VOHON[p.vh].col, { kind: "skill", done: false });
  }

  /**
   * `hit`: đòn đánh thường / hồn kỹ tạo năng lượng tiên cơ cho đội; bỏ trống (chiêu tiên cơ, sát thương theo thời gian, lan
   * Cảm điện) thì không tạo. Dễ thương tăng mọi sát thương, Phá giáp tăng sát thương đòn trực tiếp; đòn trực tiếp trúng hồn
   * thú Cảm điện thì lan sang hồn thú Cảm điện gần đó. Trả về sát thương đã gây.
   */
  damageBeast(bid: string, dmg: number, by: string, col: string, hit?: Hit, o: DmgOpt = {}) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), p = this.state.players.get(by), pd = this.pdata.get(by);
    if (!b || !bd || !p || !pd || b.hp <= 0) return 0;
    const direct = o.direct !== false && !o.chain;
    const vuln = bd.st.get("vuln"), armor = bd.st.get("armor");
    dmg *= 1 + (vuln ? vuln.v : 0) + (direct && armor ? armor.v * armor.n : 0);
    const crit = direct && Math.random() < CRIT.chance + (o.crit ?? 0) + this.buffV(pd, "crit"); if (crit) dmg *= CRIT.mult;
    dmg = Math.max(1, Math.round(dmg));
    b.hp = Math.max(0, b.hp - dmg); b.aggro = true; bd.target = by; bd.hitBy = by; bd.calm = 0;
    if (o.direct !== false) pd.fight = 0; // sát thương theo thời gian không giữ hồn sư trong giao chiến
    if (direct && !bd.st.has("stun") && !bd.st.has("root")) {
      const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1, kb = b.tier >= 3 ? 40 : 110;
      bd.kx = (dx / dd) * kb; bd.ky = (dy / dd) * kb;
    }
    this.broadcast("dmg", { x: b.x, y: b.y - TIERS[b.tier].size, v: dmg, crit, c: crit ? "#ffe14d" : col, bid });
    if (hit && !hit.done) { hit.done = true; this.gainEnergy(by, hit.kind); }
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

  /** Ra khỏi giao chiến quá TIEN_CO_IDLE_SECS giây: năng lượng cả đội giảm dần TIEN_CO_DECAY mỗi giây. */
  tickEnergy(id: string, dt: number) {
    const d = this.pdata.get(id)!, idle = Math.min(dt, d.fight - TIEN_CO_IDLE_SECS);
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
      if (tgt && b && Math.hypot(b.x - p.x, b.y - p.y) < 18 + TIERS[b.tier].size) this.damageBeast(tgt, dmg, id, col);
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

  killBeast(bid: string, by: string) {
    const b = this.state.beasts.get(bid)!; const td = TIERS[b.tier], name = BEASTS[b.species]?.name ?? "hồn thú";
    this.state.beasts.delete(bid); this.bdata.delete(bid);
    const p = this.state.players.get(by)!; p.kills++;
    this.rewardKill(by, b.tier);
    const drop = new DropState();
    drop.x = b.x; drop.y = b.y; drop.tier = b.tier; drop.owner = by; drop.ownerTtl = 15; drop.ttl = 60;
    this.state.drops.set(uid("d"), drop);
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: td.size + 10, col: td.glow });
    this.log(by, `Hạ ${name} (${td.age}). Hồn hoàn đã xuất hiện, 15 giây đầu chỉ bạn hấp thụ được.`, td.glow);
  }

  // ---------- Hồn hoàn ----------
  absorbCheck(p: PlayerState, tier: number) {
    const slot = p.rings.length + 1, over = tier - ringLimit(slot);
    if (p.level < slot * 10) return { ok: false, msg: `Cần đạt cấp ${slot * 10} (bình cảnh) mới hấp thụ được hồn hoàn thứ ${slot}.` };
    if (over >= 2) return { ok: false, msg: `Hồn hoàn ${TIERS[tier].age} quá mạnh cho vòng thứ ${slot}. Cơ thể không chịu nổi.` };
    return { ok: true, risk: over === 1 ? 0.6 : 0, msg: "" };
  }

  tryAbsorb(c: Client) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing) return;
    let best: string | null = null, bd = 22;
    this.state.drops.forEach((dr, did) => { const dd = Math.hypot(dr.x - p.x, dr.y - p.y); if (dd < bd) { bd = dd; best = did; } });
    if (!best) return;
    const dr = this.state.drops.get(best)!;
    if (dr.owner && dr.owner !== id && dr.ownerTtl > 0) return this.log(id, "Hồn hoàn này thuộc về người hạ hồn thú. Đợi thêm chút nữa.", "#ffb35c");
    if ([...this.pdata.values()].some((o) => o.absorbing?.dropId === best)) return this.log(id, "Có người đang hấp thụ hồn hoàn này.", "#ffb35c");
    const chk = this.absorbCheck(p, dr.tier);
    if (!chk.ok) return this.log(id, chk.msg, "#ffb35c");
    d.absorbing = { dropId: best, t: 0, dur: 2.5 + dr.tier * 0.8, risk: chk.risk! };
    p.absorbTier = dr.tier; p.absorb = 0.001;
    this.log(id, chk.risk ? `Bắt đầu hấp thụ hồn hoàn vượt giới hạn: ${Math.round(chk.risk * 100)}% thất bại!` : "Bắt đầu hấp thụ. Đừng di chuyển và đừng để bị tấn công.", chk.risk ? "#ffb35c" : undefined);
  }

  finishAbsorb(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, a = d.absorbing!;
    d.absorbing = null; p.absorb = 0;
    const dr = this.state.drops.get(a.dropId); if (!dr) return;
    const td = TIERS[dr.tier]; this.state.drops.delete(a.dropId);
    if (Math.random() < a.risk) {
      d.hpF = Math.max(1, Math.round(d.hpF * 0.3));
      this.log(id, `Thất bại! Hồn hoàn ${td.age} vỡ tan, bạn bị phản phệ nặng.`, "#ff8a8a"); return;
    }
    // Hồn thú chưa có tuổi theo năm (giai đoạn 3) -> tạm lấy số năm nhỏ nhất của bậc.
    p.rings.push(dr.tier); d.ringYears.push(td.years); p.level = Math.min(99, p.level + 1); p.xp = 0;
    this.recalc(id, true);
    this.broadcast("fx", { k: "absorbed", id, tier: dr.tier });
    const n = p.rings.length;
    this.log(id, `Hấp thụ thành công hồn hoàn ${td.age}! Lên cấp ${p.level}.` + (n <= 4 ? ` Nhận Hồn kỹ ${n}: ${skillsOf(VOHON[p.vh].id)[n - 1].name}.` : ""), td.glow);
    this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã hấp thụ hồn hoàn thứ ${n} (${td.age}).` });
    this.save(id).catch(() => {});
  }

  // ---------- Hồn thú ----------
  spawnBeast(zi: number) {
    const z = this.map.zones[zi]; let r = Math.random(), tier = 0;
    for (let i = 0; i < z.weights.length; i++) { r -= z.weights[i]; if (r <= 0) { tier = i; break; } }
    if (tier === 4 && [...this.state.beasts.values()].some((b) => b.tier === 4)) tier = 3;
    const species = this.pickSpecies(zi, tier);
    for (let k = 0; k < 40; k++) {
      const x = z.x0 + 8 + Math.random() * (z.x1 - z.x0 - 16), y = z.y0 + 24 + Math.random() * (z.y1 - z.y0 - 48);
      if (this.map.hits(x, y, 6, 4) || this.map.inSpawn(x, y)) continue;
      if ([...this.state.players.values()].some((p) => Math.hypot(p.x - x, p.y - y) < 140)) continue;
      this.addBeast(zi, tier, species, x, y);
      return;
    }
  }

  addBeast(zi: number, tier: number, species: number, x: number, y: number) {
    const b = new BeastState(); b.x = x; b.y = y; b.tier = tier; b.species = species; b.hp = b.maxHp = TIERS[tier].hp;
    const id = uid("b"); this.state.beasts.set(id, b);
    this.bdata.set(id, { zone: zi, hx: x, hy: y, tx: x, ty: y, wt: 0, cd: 0, kx: 0, ky: 0, target: null, hitBy: null, anim: 0,
      st: new Map(), dotT: 0, calm: 99, regen: 0 });
  }

  /** Chọn loài theo trọng số trong số loài của vùng có bậc tạm bằng `tier`; vùng thiếu thì lấy mọi loài cùng bậc. */
  pickSpecies(zi: number, tier: number) {
    let list = this.map.zones[zi].beasts.filter((b) => BEASTS[b.species].tier === tier);
    if (!list.length) list = BEASTS.flatMap((b, i) => (b.tier === tier ? [{ species: i, w: 1 }] : []));
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
      if (d.shieldT > 0) { d.shieldT -= dt; if (d.shieldT <= 0) d.shield = 0; p.shield = Math.ceil(d.shield); }
      if (d.buffs.size) {
        for (const [b, x] of d.buffs) { x.t -= dt; if (x.t <= 0 || p.dead) d.buffs.delete(b); } // cả đội gục thì mất hiệu ứng có lợi
        this.syncBuffs(p, d);
      }
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
      let tgt = bd.target ? this.state.players.get(bd.target) : undefined;
      if (tgt && (tgt.dead || Math.hypot(b.x - bd.hx, b.y - bd.hy) > 220)) { bd.target = null; tgt = undefined; }
      if (!tgt && b.tier >= 1) {
        let best = 70;
        this.state.players.forEach((p, pid) => { if (p.dead) return; const dd = Math.hypot(p.x - b.x, p.y - b.y); if (dd < best) { best = dd; bd.target = pid; tgt = p; } });
      }
      b.aggro = !!tgt;
      const hw = Math.max(3, td.size / 3);
      // Khống chế (mục 5.1): Choáng đứng yên và không đánh; Trói không đi (vẫn đánh khi kề bên); Câm lặng không đánh.
      // Bị khống chế không di chuyển thì cũng không bị đẩy lùi.
      const stun = bd.st.has("stun"), noMove = stun || bd.st.has("root"), noAtk = stun || bd.st.has("silence");
      if (!tgt && bd.calm > BEAST_REGEN.delay) this.regenBeast(b, bd, dt);
      if (stun) { bd.kx = 0; bd.ky = 0; b.moving = false; return; }
      if (noMove) { bd.kx = 0; bd.ky = 0; }
      if (bd.kx || bd.ky) { this.map.moveEnt(b, bd.kx * dt, bd.ky * dt, hw, 3); bd.kx *= 0.85; bd.ky *= 0.85; if (Math.abs(bd.kx) < 2 && Math.abs(bd.ky) < 2) { bd.kx = 0; bd.ky = 0; } }
      let mx = 0, my = 0, sp = td.spd;
      if (tgt) {
        const dx = tgt.x - b.x, dy = tgt.y - b.y, dd = Math.hypot(dx, dy);
        if (dd > td.size / 2 + 6) { if (!noMove) { mx = dx / dd; my = dy / dd; } }
        else if (bd.cd <= 0 && !noAtk) { bd.cd = 1.1; this.hurtPlayer(bd.target!, td.dmg * (0.85 + Math.random() * 0.3)); }
      } else {
        bd.wt -= dt;
        if (bd.wt <= 0) { bd.wt = 2 + Math.random() * 3; bd.tx = bd.hx + (Math.random() - 0.5) * 120; bd.ty = bd.hy + (Math.random() - 0.5) * 120; }
        const ex = bd.tx - b.x, ey = bd.ty - b.y, ed = Math.hypot(ex, ey);
        if (ed > 4 && !noMove) { mx = ex / ed; my = ey / ed; sp *= 0.4; }
      }
      b.moving = !!(mx || my);
      if (b.moving) { this.map.moveEnt(b, mx * sp * dt, my * sp * dt, hw, 3); if (Math.abs(mx) > 0.1) b.face = mx > 0 ? 1 : -1; }
    });

    // đạn hồn kỹ
    this.projs = this.projs.filter((pr) => {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      if (pr.life <= 0 || this.map.hits(pr.x, pr.y + 6, 1, 1)) return false;
      for (const [bid, b] of this.state.beasts.entries())
        if (Math.hypot(b.x - pr.x, b.y - TIERS[b.tier].size / 2 - pr.y) < TIERS[b.tier].size / 2 + 5) { pr.fire(bid); return false; }
      return true;
    });

    // hồn hoàn rơi
    this.state.drops.forEach((dr, id) => {
      dr.ttl -= dt; if (dr.ownerTtl > 0) dr.ownerTtl = Math.max(0, dr.ownerTtl - dt);
      const busy = [...this.pdata.values()].some((o) => o.absorbing?.dropId === id);
      if (dr.ttl <= 0 && !busy) this.state.drops.delete(id);
    });

    // hồi sinh hồn thú
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.2;
      const { zones } = this.map, counts = zones.map(() => 0); this.bdata.forEach((b) => counts[b.zone]++);
      zones.forEach((z, i) => { if (counts[i] < z.count) this.spawnBeast(i); });
    }

    // lưu định kỳ
    this.saveT += dt;
    if (this.saveT > 30) { this.saveT = 0; this.state.players.forEach((_p, id) => this.save(id).catch(() => {})); }
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
