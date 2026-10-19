// Phòng của một bản đồ (mapId): toàn bộ logic game chạy ở đây (server-authoritative).
// Mỗi bản đồ có thể có nhiều phòng (kênh); mọi phòng dùng chung một lớp, khác nhau ở dữ liệu bản đồ.
// Client chỉ gửi ý định (hướng di chuyển, bấm đánh...), server quyết định kết quả.
import { Room, Client, ServerError } from "colyseus";
import { MapState, PlayerState, BeastState, DropState } from "./schema.ts";
import { TIERS, TIER_MULT, VOHON, SKILLS, ringLimit, xpNeed, atBottleneck, calcStats, TICK_RATE, tierOfYears, vohonIndex,
  AWAKEN_GIFT, AWAKEN_CHOICES, TEAM_SIZE, SWITCH_CD, TEAM_COMBAT_SECS, REVIVE_SECS, RESPAWN_SECS, XP_SHARE_ACTIVE, XP_SHARE_BENCH,
  beastLevel, xpLevelScale, MAX_RINGS, parseTeam, BEASTS, MAPS, DEFAULT_MAP, parseLooks, dir4, type Looks,
  TIEN_CO, TIEN_CO_MAX, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY, energyGain, tienCoDmgMult, TILE } from "../../../shared/data.ts";
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
}
/** Một đòn đánh thường / một lần tung hồn kỹ: năng lượng tiên cơ chỉ tính một lần dù trúng nhiều hồn thú hay nhiều mũi đạn. */
interface Hit { kind: "attack" | "skill"; done: boolean; }
interface AuthData { accountId: number; ch: Character; owned: Character[]; team: number[]; looks: Looks; }
interface BData { zone: number; hx: number; hy: number; tx: number; ty: number; wt: number; cd: number; kx: number; ky: number; target: string | null; hitBy: string | null; anim: number; stun: number; }
interface Proj { x: number; y: number; vx: number; vy: number; life: number; dmg: number; owner: string; col: string; hit: Hit; }

let nextId = 1;
const uid = (p: string) => p + (nextId++).toString(36);

export class MapRoom extends Room<MapState> {
  maxClients = 60;
  state = new MapState();
  map!: GameMap;
  pdata = new Map<string, PData>();
  bdata = new Map<string, BData>();
  projs: Proj[] = [];
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
      benchHp: new Map(), down: new Map(), dirty: new Set(), squadKey: "", squadT: 0, energy: new Map(), shield: 0, shieldT: 0 };
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
   * `rest {s}` (nghỉ ngoài trận s giây), `set {rowId, level, xp, rings}` (đặt tiến độ một võ hồn của mình; có lưu DB),
   * `energy {v}` (đặt năng lượng tiên cơ mọi võ hồn chưa gục trong đội, tính như vừa giao chiến), `spawn {tier, dx, dy}` (sinh hồn thú cạnh mình),
   * `hurt {pct}` (võ hồn ra trận mất pct% sinh lực hiện có, bỏ qua khiên), `clear` (bỏ mọi hồn thú trong vòng 160 pixel quanh mình).
   */
  testHook(c: Client, m: unknown) {
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, op = String(o.op ?? "");
    if (process.env.GAME_TEST !== "1") return c.send("test", { op, enabled: false });
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const int = (x: unknown, lo: number, hi: number, def: number) => (Number.isInteger(x) ? Math.max(lo, Math.min(hi, x as number)) : def);
    if (op === "down" && !p.dead) { d.inv = 0; d.shield = 0; this.hurtPlayer(id, d.hpF / VOHON[p.vh].def + 1); }
    else if (op === "hurt" && !p.dead) { d.inv = 0; d.shield = 0; this.hurtPlayer(id, Math.floor(d.hpF * int(o.pct, 0, 99, 0) / 100) / VOHON[p.vh].def); }
    else if (op === "kill") this.rewardKill(id, int(o.tier, 0, TIERS.length - 1, 0));
    else if (op === "rest") {
      const s = int(o.s, 0, 3600, 0); d.fight = Math.max(d.fight + s, TEAM_COMBAT_SECS);
      this.tickDowns(id, s); this.tickEnergy(id, s); this.sendSquad(id);
    }
    else if (op === "energy") { const v = int(o.v, 0, TIEN_CO_MAX, 0); d.fight = 0; for (const r of d.team) if (r && !d.down.has(r)) d.energy.set(r, v); }
    else if (op === "spawn") {
      const tier = int(o.tier, 0, TIERS.length - 1, 0), species = Math.max(0, BEASTS.findIndex((b) => b.tier === tier));
      const x = Math.max(8, Math.min(this.map.MW * TILE - 8, p.x + int(o.dx, -200, 200, 20)));
      const y = Math.max(8, Math.min(this.map.MH * TILE - 8, p.y + int(o.dy, -200, 200, 0)));
      this.addBeast(Math.max(0, this.map.zones.findIndex((z) => x >= z.x0 && x < z.x1)), tier, species, x, y);
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
    c.send("test", { op, enabled: true });
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
    dmg = Math.round(dmg * VOHON[p.vh].def);
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
      if (Math.hypot(b.x - ax, b.y - size / 2 - ay) < 18 + size / 2) this.damageBeast(bid, d.atk * (0.85 + Math.random() * 0.3), id, VOHON[p.vh].col, hit);
    });
  }

  skill(c: Client, i: number) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || !(i >= 0 && i < 4)) return;
    if (i >= p.rings.length) return this.log(id, `Hồn kỹ ${i + 1} cần hồn hoàn thứ ${i + 1}.`);
    if (p.cds[i] > 0) return;
    const sk = SKILLS[i]; if (d.mpF < sk.cost) return this.log(id, "Không đủ hồn lực.");
    d.mpF -= sk.cost; p.cds[i] = sk.cd;
    const tier = p.rings[i], tm = TIER_MULT[tier], col = VOHON[p.vh].col, glow = TIERS[tier].glow;
    this.broadcast("fx", { k: "soulring", id, tier, i }); // i: vòng hồn hoàn của hồn kỹ, client làm sáng vòng đó
    const inRange = (r: number) => [...this.state.beasts.entries()].filter(([, b]) => Math.hypot(b.x - p.x, b.y - p.y) < r);
    const hit: Hit = { kind: "skill", done: false };
    if (i === 0) {
      this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 48, col });
      for (const [bid] of inRange(50)) this.damageBeast(bid, d.atk * 2.2 * tm, id, col, hit);
    } else if (i === 1) {
      const sx = p.x, sy = p.y; let dist = 0;
      while (dist < 70 && !this.map.hits(p.x + d.dir.x * 2, p.y + d.dir.y * 2, 5, 4)) { p.x += d.dir.x * 2; p.y += d.dir.y * 2; dist += 2; }
      d.inv = 0.35;
      this.broadcast("fx", { k: "trail", x0: sx, y0: sy, x1: p.x, y1: p.y, col });
      const L = Math.max(1, dist), ux = (p.x - sx) / L, uy = (p.y - sy) / L;
      this.state.beasts.forEach((b, bid) => {
        const bx = b.x - sx, by = b.y - sy, pr = Math.max(0, Math.min(L, bx * ux + by * uy));
        if (Math.hypot(bx - ux * pr, by - uy * pr) < 14 + TIERS[b.tier].size / 2) this.damageBeast(bid, d.atk * 2.6 * tm, id, col, hit);
      });
    } else if (i === 2) {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        this.projs.push({ x: p.x, y: p.y - 8, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 0.65, dmg: d.atk * 1.5 * tm, owner: id, col, hit });
      }
      this.broadcast("fx", { k: "burst", x: p.x, y: p.y - 8, col });
    } else {
      this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 90, col: glow, shake: 0.5 });
      for (const [bid] of inRange(90)) this.damageBeast(bid, d.atk * 4 * tm, id, glow, hit);
    }
  }

  /** `hit`: đòn đánh thường / hồn kỹ tạo năng lượng tiên cơ cho đội; bỏ trống (chiêu tiên cơ) thì không tạo. */
  damageBeast(bid: string, dmg: number, by: string, col: string, hit?: Hit) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), p = this.state.players.get(by);
    if (!b || !bd || !p || b.hp <= 0) return;
    const crit = Math.random() < 0.12; if (crit) dmg *= 1.8;
    dmg = Math.max(1, Math.round(dmg));
    b.hp = Math.max(0, b.hp - dmg); b.aggro = true; bd.target = by; bd.hitBy = by;
    const pd = this.pdata.get(by); if (pd) pd.fight = 0;
    const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1, kb = b.tier >= 3 ? 40 : 110;
    bd.kx = (dx / dd) * kb; bd.ky = (dy / dd) * kb;
    this.broadcast("dmg", { x: b.x, y: b.y - TIERS[b.tier].size, v: dmg, crit, c: crit ? "#ffe14d" : col, bid });
    if (hit && !hit.done) { hit.done = true; this.gainEnergy(by, hit.kind); }
    if (b.hp <= 0) this.killBeast(bid, by);
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
   * Chiêu tiên cơ chung theo hệ của võ hồn vừa đổi vào (bảng TIEN_CO; tiên cơ riêng từng võ hồn ở bước 2.5): cường công nổ
   * diện rộng, mẫn công lướt tới hồn thú gần nhất và chém mạnh, khống chế choáng diện rộng, phụ trợ hồi sinh lực cả đội và
   * tạo khiên. Không tốn hồn lực, không tạo năng lượng.
   */
  tienCo(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, def = VOHON[p.vh], he = def.he, tc = TIEN_CO[he];
    const dmg = d.atk * tc.dmg * tienCoDmgMult(this.tienCoSet(d.ch).set4), col = def.col, x0 = p.x, y0 = p.y;
    if (he === "man_cong") {
      // Lướt về hồn thú gần nhất trong tầm (không có thì lướt theo hướng đang nhìn), dừng sát mục tiêu hoặc khi vướng vật cản.
      let tgt: string | undefined, b: BeastState | undefined, best = tc.range;
      for (const [bid, o] of this.state.beasts.entries()) { const dd = Math.hypot(o.x - p.x, o.y - p.y); if (dd < best) { best = dd; tgt = bid; b = o; } }
      if (b) { const dd = Math.max(1, best); d.dir = { x: (b.x - p.x) / dd, y: (b.y - p.y) / dd }; p.dir = dir4(d.dir.x, d.dir.y); }
      const stop = b ? Math.min(tc.dash, Math.max(0, best - TIERS[b.tier].size / 2 - 8)) : tc.dash;
      for (let dist = 0; dist < stop && !this.map.hits(p.x + d.dir.x * 2, p.y + d.dir.y * 2, 5, 4); dist += 2) { p.x += d.dir.x * 2; p.y += d.dir.y * 2; }
      d.inv = Math.max(d.inv, 0.35);
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, x0, y0 });
      if (tgt && b && Math.hypot(b.x - p.x, b.y - p.y) < 18 + TIERS[b.tier].size) this.damageBeast(tgt, dmg, id, col);
    } else if (he === "phu_tro") {
      d.hpF = Math.min(p.maxHp, d.hpF + p.maxHp * tc.heal); p.hp = Math.ceil(d.hpF);
      for (const r of d.team) {
        const v = d.owned.find((o) => o.rowId === r);
        if (!v || v === d.ch || d.down.has(r) || !d.benchHp.has(r)) continue;
        const max = this.maxHpOf(v), hp = d.benchHp.get(r)! + max * tc.heal;
        if (hp >= max) d.benchHp.delete(r); else d.benchHp.set(r, hp);
      }
      d.shield = Math.max(d.shield, Math.round(p.maxHp * tc.shield)); d.shieldT = tc.shieldSecs; p.shield = d.shield;
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y });
    } else {
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, r: tc.r });
      const near = [...this.state.beasts.entries()].filter(([, b]) => Math.hypot(b.x - p.x, b.y - p.y) < tc.r + TIERS[b.tier].size / 2);
      for (const [bid] of near) {
        const bd = this.bdata.get(bid);
        if (tc.stun && bd) { bd.stun = Math.max(bd.stun, tc.stun); this.state.beasts.get(bid)!.stun = true; }
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
    this.log(id, `Hấp thụ thành công hồn hoàn ${td.age}! Lên cấp ${p.level}.` + (n <= 4 ? ` Nhận Hồn kỹ ${n}: ${SKILLS[n - 1].name}.` : ""), td.glow);
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
    this.bdata.set(id, { zone: zi, hx: x, hy: y, tx: x, ty: y, wt: 0, cd: 0, kx: 0, ky: 0, target: null, hitBy: null, anim: 0, stun: 0 });
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
    // người chơi
    this.state.players.forEach((p, id) => {
      const d = this.pdata.get(id)!;
      d.atkCd -= dt; d.inv -= dt; d.lastHit += dt; d.fight += dt;
      for (let i = 0; i < 4; i++) if (p.cds[i] > 0) p.cds[i] = Math.max(0, p.cds[i] - dt);
      if (p.swCd > 0) p.swCd = Math.max(0, p.swCd - dt);
      if (d.shieldT > 0) { d.shieldT -= dt; if (d.shieldT <= 0) d.shield = 0; p.shield = Math.ceil(d.shield); }
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
        this.map.moveEnt(p, ix * d.speed * dt, iy * d.speed * dt, 5, 4);
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

    // hồn thú
    this.state.beasts.forEach((b, id) => {
      const bd = this.bdata.get(id)!, td = TIERS[b.tier];
      bd.cd -= dt; bd.anim += dt;
      let tgt = bd.target ? this.state.players.get(bd.target) : undefined;
      if (tgt && (tgt.dead || Math.hypot(b.x - bd.hx, b.y - bd.hy) > 220)) { bd.target = null; tgt = undefined; }
      if (!tgt && b.tier >= 1) {
        let best = 70;
        this.state.players.forEach((p, pid) => { if (p.dead) return; const dd = Math.hypot(p.x - b.x, p.y - b.y); if (dd < best) { best = dd; bd.target = pid; tgt = p; } });
      }
      b.aggro = !!tgt;
      const hw = Math.max(3, td.size / 3);
      // Choáng (tiên cơ khống chế): đứng yên tại chỗ (không bị đẩy lùi), không đánh cho đến hết thời gian.
      if (bd.stun > 0) bd.stun = Math.max(0, bd.stun - dt);
      b.stun = bd.stun > 0;
      if (b.stun) { bd.kx = 0; bd.ky = 0; b.moving = false; return; }
      if (bd.kx || bd.ky) { this.map.moveEnt(b, bd.kx * dt, bd.ky * dt, hw, 3); bd.kx *= 0.85; bd.ky *= 0.85; if (Math.abs(bd.kx) < 2 && Math.abs(bd.ky) < 2) { bd.kx = 0; bd.ky = 0; } }
      let mx = 0, my = 0, sp = td.spd;
      if (tgt) {
        const dx = tgt.x - b.x, dy = tgt.y - b.y, dd = Math.hypot(dx, dy);
        if (dd > td.size / 2 + 6) { mx = dx / dd; my = dy / dd; }
        else if (bd.cd <= 0) { bd.cd = 1.1; this.hurtPlayer(bd.target!, td.dmg * (0.85 + Math.random() * 0.3)); }
      } else {
        bd.wt -= dt;
        if (bd.wt <= 0) { bd.wt = 2 + Math.random() * 3; bd.tx = bd.hx + (Math.random() - 0.5) * 120; bd.ty = bd.hy + (Math.random() - 0.5) * 120; }
        const ex = bd.tx - b.x, ey = bd.ty - b.y, ed = Math.hypot(ex, ey);
        if (ed > 4) { mx = ex / ed; my = ey / ed; sp *= 0.4; }
      }
      b.moving = !!(mx || my);
      if (b.moving) { this.map.moveEnt(b, mx * sp * dt, my * sp * dt, hw, 3); if (Math.abs(mx) > 0.1) b.face = mx > 0 ? 1 : -1; }
    });

    // đạn hồn kỹ
    this.projs = this.projs.filter((pr) => {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      if (pr.life <= 0 || this.map.hits(pr.x, pr.y + 6, 1, 1)) return false;
      for (const [bid, b] of this.state.beasts.entries())
        if (Math.hypot(b.x - pr.x, b.y - TIERS[b.tier].size / 2 - pr.y) < TIERS[b.tier].size / 2 + 5) { this.damageBeast(bid, pr.dmg, pr.owner, pr.col, pr.hit); return false; }
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
