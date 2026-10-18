// Phòng của một bản đồ (mapId): toàn bộ logic game chạy ở đây (server-authoritative).
// Mỗi bản đồ có thể có nhiều phòng (kênh); mọi phòng dùng chung một lớp, khác nhau ở dữ liệu bản đồ.
// Client chỉ gửi ý định (hướng di chuyển, bấm đánh...), server quyết định kết quả.
import { Room, Client, ServerError } from "colyseus";
import { MapState, PlayerState, BeastState, DropState } from "./schema.ts";
import { TIERS, TIER_MULT, VOHON, SKILLS, ringLimit, xpNeed, atBottleneck, calcStats, TICK_RATE, tierOfYears, vohonIndex,
  AWAKEN_GIFT, AWAKEN_CHOICES, PICK_COMBAT_SECS, PICK_CD, BEASTS, MAPS, DEFAULT_MAP, parseLooks, type Looks } from "../../../shared/data.ts";
import { loadMap, type GameMap } from "../map.ts";
import { store, Character, type AccountLooks } from "../db.ts";
import { chatCheck } from "../ratelimit.ts";

interface PData {
  accountId: number;
  owned: Character[];   // mọi võ hồn sở hữu (chỉ gửi cho chính chủ)
  ch: Character;        // võ hồn đang ra trận, là một phần tử của owned
  ringYears: number[];  // niên hạn thật của từng hồn hoàn; p.rings chỉ là bậc để hiển thị
  input: { x: number; y: number }; dir: { x: number; y: number };
  atk: number; speed: number; atkCd: number; inv: number; lastHit: number; deadT: number;
  absorbing: { dropId: string; t: number; dur: number; risk: number } | null;
  mpF: number; hpF: number;
  fight: number;        // số giây kể từ lần cuối đánh trúng hoặc bị đánh
  pickCd: number;       // chờ trước khi được đổi võ hồn tiếp
}
interface AuthData { accountId: number; ch: Character; owned: Character[]; looks: Looks; }
interface BData { zone: number; hx: number; hy: number; tx: number; ty: number; wt: number; cd: number; kx: number; ky: number; target: string | null; hitBy: string | null; anim: number; }
interface Proj { x: number; y: number; vx: number; vy: number; life: number; dmg: number; owner: string; col: string; }

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
    const auth: AuthData = { accountId: acc.accountId, ch: owned.find((v) => v.rowId === ch.rowId) ?? ch, owned, looks };
    if (!owned.includes(auth.ch)) owned.push(auth.ch);
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
    this.onMessage("pick", (c, m: { rowId: number }) => { this.pick(c, Number(m?.rowId)).catch((e) => console.error("Đổi võ hồn thất bại", e)); });
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
    const { ch, owned, looks } = auth;
    // Một tài khoản chỉ được vào một lần: đá phiên cũ.
    for (const other of this.clients) if (other !== client && (other.auth as AuthData)?.accountId === auth.accountId) other.leave(4001);
    const p = new PlayerState();
    p.name = ch.name; this.showVohon(p, ch);
    p.sex = looks.sex; p.hair = looks.hair; p.hairCol = looks.hairCol; p.outfitCol = looks.outfitCol;
    const pos = this.spawnPoint(); p.x = pos.x; p.y = pos.y;
    const d: PData = { accountId: auth.accountId, owned, ch, ringYears: [...ch.rings], input: { x: 0, y: 0 }, dir: { x: 1, y: 0 },
      atk: 0, speed: 0, atkCd: 0, inv: 1.5, lastHit: 99, deadT: 0, absorbing: null, mpF: 0, hpF: 0, fight: 99, pickCd: 0 };
    this.pdata.set(client.sessionId, d);
    this.state.players.set(client.sessionId, p);
    this.recalc(client.sessionId, true);
    this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã vào rừng.` }, { except: client });
  }

  async onLeave(client: Client) {
    const p = this.state.players.get(client.sessionId);
    if (p) {
      await this.save(client.sessionId).catch((e) => console.error("Lưu thất bại", e));
      this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã rời rừng.` });
    }
    this.state.players.delete(client.sessionId);
    this.pdata.delete(client.sessionId);
  }

  async onDispose() {
    await Promise.all([...this.state.players.keys()].map((id) => this.save(id).catch(() => {})));
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

  async save(id: string) {
    const d = this.pdata.get(id); if (!d) return;
    this.syncCh(id);
    await store.saveCharacter({ ...d.ch, rings: [...d.ch.rings] });
  }

  // ---------- Võ hồn sở hữu ----------
  /** Danh sách võ hồn chỉ gửi riêng cho chính chủ, không nằm trong state đồng bộ. */
  sendVohons(c: Client) {
    const d = this.pdata.get(c.sessionId); if (!d) return;
    this.syncCh(c.sessionId);
    c.send("vohons", { active: d.ch.rowId, list: d.owned.map((v) => ({ rowId: v.rowId, vohon: v.vohon, level: v.level, stars: v.stars, rings: [...v.rings] })) });
  }

  /** Chọn võ hồn ra trận (đến bước 2.3: chỉ đổi khi ngoài giao chiến). */
  async pick(c: Client, rowId: number) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || rowId === d.ch.rowId) return;
    const next = d.owned.find((v) => v.rowId === rowId);
    if (!next) return this.log(id, "Bạn không sở hữu võ hồn này.", "#ffb35c");
    if (p.dead) return this.log(id, "Đã gục ngã, không thể đổi võ hồn.", "#ffb35c");
    if (d.absorbing) return this.log(id, "Đang hấp thụ hồn hoàn, không thể đổi võ hồn.", "#ffb35c");
    if (d.fight < PICK_COMBAT_SECS) return this.log(id, `Đang giao chiến: rời xa hồn thú ${PICK_COMBAT_SECS} giây rồi mới đổi võ hồn được.`, "#ffb35c");
    if (d.pickCd > 0) return;
    this.syncCh(id);
    const prev = d.ch, hpR = d.hpF / Math.max(1, p.maxHp), mpR = d.mpF / Math.max(1, p.maxMp);
    d.ch = next; d.ringYears = [...next.rings]; d.pickCd = PICK_CD;
    this.showVohon(p, next);
    // Giữ tỉ lệ sinh lực / hồn lực để đổi võ hồn không thành cách hồi đầy.
    this.recalc(id, false); d.hpF = Math.max(1, hpR * p.maxHp); d.mpF = mpR * p.maxMp; this.recalc(id, false);
    this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 34, col: VOHON[p.vh].col });
    this.log(id, `${VOHON[p.vh].name} ra trận (cấp ${p.level}, ${p.rings.length} hồn hoàn).`, VOHON[p.vh].col);
    this.sendVohons(c);
    await Promise.all([store.saveCharacter({ ...prev, rings: [...prev.rings] }), store.setActive(d.accountId, next.rowId)]);
  }

  log(id: string, text: string, col?: string) { this.clients.getById(id)?.send("log", { text, col }); }

  addXp(id: string, n: number) {
    const p = this.state.players.get(id)!;
    if (atBottleneck(p.level, p.rings.length)) return;
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
    d.hpF -= dmg; d.inv = 0.45; d.lastHit = 0; d.fight = 0;
    this.broadcast("dmg", { x: p.x, y: p.y - 18, v: -dmg, c: "#ff6b6b" });
    if (d.absorbing) { d.absorbing = null; p.absorb = 0; this.log(id, "Bị tấn công: quá trình hấp thụ bị gián đoạn!", "#ffb35c"); }
    if (d.hpF <= 0) {
      d.hpF = 0; p.dead = true; d.deadT = 2.5;
      const lost = Math.floor(p.xp * 0.3); p.xp -= lost;
      this.log(id, `Bạn đã gục ngã${lost ? ` và mất ${lost} kinh nghiệm` : ""}. Đang trở về doanh trại…`, "#ff8a8a");
    }
  }

  // ---------- Chiến đấu ----------
  attack(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.atkCd > 0) return;
    d.atkCd = 0.38;
    const ax = p.x + d.dir.x * 10, ay = p.y - 6 + d.dir.y * 10;
    this.broadcast("fx", { k: "slash", id, dx: d.dir.x, dy: d.dir.y, col: VOHON[p.vh].col });
    this.state.beasts.forEach((b, bid) => {
      const size = TIERS[b.tier].size;
      if (Math.hypot(b.x - ax, b.y - size / 2 - ay) < 18 + size / 2) this.damageBeast(bid, d.atk * (0.85 + Math.random() * 0.3), id, VOHON[p.vh].col);
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
    this.broadcast("fx", { k: "soulring", id, tier });
    const inRange = (r: number) => [...this.state.beasts.entries()].filter(([, b]) => Math.hypot(b.x - p.x, b.y - p.y) < r);
    if (i === 0) {
      this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 48, col });
      for (const [bid] of inRange(50)) this.damageBeast(bid, d.atk * 2.2 * tm, id, col);
    } else if (i === 1) {
      const sx = p.x, sy = p.y; let dist = 0;
      while (dist < 70 && !this.map.hits(p.x + d.dir.x * 2, p.y + d.dir.y * 2, 5, 4)) { p.x += d.dir.x * 2; p.y += d.dir.y * 2; dist += 2; }
      d.inv = 0.35;
      this.broadcast("fx", { k: "trail", x0: sx, y0: sy, x1: p.x, y1: p.y, col });
      const L = Math.max(1, dist), ux = (p.x - sx) / L, uy = (p.y - sy) / L;
      this.state.beasts.forEach((b, bid) => {
        const bx = b.x - sx, by = b.y - sy, pr = Math.max(0, Math.min(L, bx * ux + by * uy));
        if (Math.hypot(bx - ux * pr, by - uy * pr) < 14 + TIERS[b.tier].size / 2) this.damageBeast(bid, d.atk * 2.6 * tm, id, col);
      });
    } else if (i === 2) {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        this.projs.push({ x: p.x, y: p.y - 8, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 0.65, dmg: d.atk * 1.5 * tm, owner: id, col });
      }
      this.broadcast("fx", { k: "burst", x: p.x, y: p.y - 8, col });
    } else {
      this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 90, col: glow, shake: 0.5 });
      for (const [bid] of inRange(90)) this.damageBeast(bid, d.atk * 4 * tm, id, glow);
    }
  }

  damageBeast(bid: string, dmg: number, by: string, col: string) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), p = this.state.players.get(by);
    if (!b || !bd || !p || b.hp <= 0) return;
    const crit = Math.random() < 0.12; if (crit) dmg *= 1.8;
    dmg = Math.max(1, Math.round(dmg));
    b.hp = Math.max(0, b.hp - dmg); b.aggro = true; bd.target = by; bd.hitBy = by;
    const pd = this.pdata.get(by); if (pd) pd.fight = 0;
    const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1, kb = b.tier >= 3 ? 40 : 110;
    bd.kx = (dx / dd) * kb; bd.ky = (dy / dd) * kb;
    this.broadcast("dmg", { x: b.x, y: b.y - TIERS[b.tier].size, v: dmg, crit, c: crit ? "#ffe14d" : col, bid });
    if (b.hp <= 0) this.killBeast(bid, by);
  }

  killBeast(bid: string, by: string) {
    const b = this.state.beasts.get(bid)!; const td = TIERS[b.tier], name = BEASTS[b.species]?.name ?? "hồn thú";
    this.state.beasts.delete(bid); this.bdata.delete(bid);
    const p = this.state.players.get(by)!; p.kills++;
    this.addXp(by, td.xp);
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
      const b = new BeastState(); b.x = x; b.y = y; b.tier = tier; b.species = species; b.hp = b.maxHp = TIERS[tier].hp;
      const id = uid("b"); this.state.beasts.set(id, b);
      this.bdata.set(id, { zone: zi, hx: x, hy: y, tx: x, ty: y, wt: 0, cd: 0, kx: 0, ky: 0, target: null, hitBy: null, anim: 0 });
      return;
    }
  }

  /** Chọn loài theo trọng số trong số loài của vùng có bậc tạm bằng `tier`; vùng thiếu thì lấy mọi loài cùng bậc. */
  pickSpecies(zi: number, tier: number) {
    let list = this.map.zones[zi].beasts.filter((b) => BEASTS[b.species].tier === tier);
    if (!list.length) list = BEASTS.flatMap((b, i) => (b.tier === tier ? [{ species: i, w: 1 }] : []));
    let r = Math.random() * list.reduce((a, b) => a + b.w, 0);
    for (const b of list) { r -= b.w; if (r <= 0) return b.species; }
    return list[list.length - 1].species;
  }

  // ---------- Vòng lặp ----------
  tick(dt: number) {
    // người chơi
    this.state.players.forEach((p, id) => {
      const d = this.pdata.get(id)!;
      d.atkCd -= dt; d.inv -= dt; d.lastHit += dt; d.fight += dt; d.pickCd -= dt;
      for (let i = 0; i < 4; i++) if (p.cds[i] > 0) p.cds[i] = Math.max(0, p.cds[i] - dt);
      if (p.dead) {
        d.deadT -= dt;
        if (d.deadT <= 0) { const s = this.spawnPoint(); p.x = s.x; p.y = s.y; p.dead = false; d.inv = 1.5; this.recalc(id, true); }
        return;
      }
      const { x: ix, y: iy } = d.input; const il = Math.hypot(ix, iy);
      p.moving = il > 0.15;
      if (p.moving) {
        if (d.absorbing) { d.absorbing = null; p.absorb = 0; this.log(id, "Di chuyển: đã hủy hấp thụ."); }
        this.map.moveEnt(p, ix * d.speed * dt, iy * d.speed * dt, 5, 4);
        d.dir = { x: ix / il, y: iy / il }; if (Math.abs(ix) > 0.1) p.face = ix > 0 ? 1 : -1;
      }
      if (d.absorbing) { d.absorbing.t += dt; p.absorb = Math.min(0.999, d.absorbing.t / d.absorbing.dur); if (d.absorbing.t >= d.absorbing.dur) this.finishAbsorb(id); }
      d.mpF = Math.min(p.maxMp, d.mpF + (4 + p.level * 0.15) * (VOHON[p.vh].mp > 1 ? 1.5 : 1) * dt);
      d.hpF = Math.min(p.maxHp, d.hpF + (d.lastHit > 5 ? p.maxHp * 0.04 : 1.5) * dt);
      p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
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
        if (Math.hypot(b.x - pr.x, b.y - TIERS[b.tier].size / 2 - pr.y) < TIERS[b.tier].size / 2 + 5) { this.damageBeast(bid, pr.dmg, pr.owner, pr.col); return false; }
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
