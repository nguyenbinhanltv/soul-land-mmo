// Tự săn online phía server (Auto 1, mục 5.13). Mỗi người bật tự săn có một AutoHunter trong MapRoom: nó chỉ quyết định làm gì rồi
// gọi đúng các hàm xử lý lệnh của người chơi (applyInput như tin `input`, attack, skill, switchSlot, useItem, pickup), nên mọi luật
// cũ (hồi chiêu, hồn lực, Câm lặng / Choáng, vùng an toàn, quyền nhặt, túi đầy…) vẫn áp như khi người chơi tự bấm. Không đường tắt.
// Quyết định chạy AUTO_HZ lần mỗi giây; giữa hai lần chỉ lái hướng đi theo đường đã tìm và đánh thường khi mục tiêu trong tầm.
import type { Client } from "colyseus";
import { TIERS, TILE, ITEMS, BONE_ITEM, CORE_ITEM, PICKUP_RANGE, BEAST_AGGRO_R, TEAM_SIZE, TIEN_CO_MAX, CHAN_THAN_RING, CHAN_THAN_SKILL_SLOT,
  AUTO_HZ, AUTO_RADIUS, AUTO_DAILY_SECS, AUTO_CLAIM_SECS, AUTO_MOVE, loadoutOf, ringSkill, chanThanOf,
  type AutoSettings, type SkillDef, type ItemDef } from "../../../shared/data.ts";
import { MOVE_DEAD } from "../../../shared/move.ts";
import { findPath, clearLine, type Pt } from "../../../shared/path.ts";
import * as party from "../party.ts";
import type { MapRoom, PData } from "./MapRoom.ts";
import type { PlayerState, BeastState, DropState } from "./schema.ts";

/** Đan theo thứ tự ITEMS (đan thường trước đan lớn): uống loại có trong túi đầu tiên. */
const HP_POTS = ITEMS.filter((d) => d.hp), MP_POTS = ITEMS.filter((d) => d.mp);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class AutoHunter {
  /** Hồn thú đang nhắm; `hit`: mình đã đánh trúng nó (thấy `hitBy` là mình) nên người khác đánh sau không làm mình bỏ. */
  target: string | null = null; hit = false;
  /** Đồ rơi đang đi tới nhặt. */
  loot: string | null = null;
  /** Đường đi (các điểm, không gồm chỗ đứng) và đích của đường đó; `pathT`: giây từ lần tìm đường trước. */
  path: Pt[] = []; goal: Pt | null = null; pathT = 0;
  /** Điểm đi dạo khi không có việc và giây còn lại trước khi đổi điểm. */
  patrol: Pt | null = null; patrolT = 0;
  /** Hồn thú / đồ rơi không tới được (kẹt, A* không tới): bỏ qua tới thời điểm (giây của `clock`). */
  skip = new Map<string, number>();
  /** Võ hồn chính trước khi tự đổi tay tung tiên cơ (rowId; null = chưa đổi). Người chơi tự đổi võ hồn thì bỏ. */
  home: number | null = null;
  /** Đồng hồ riêng (giây) và chờ tới lần quyết định kế tiếp. */
  clock = 0; decT = 0;
  /** Kẹt: chỗ đứng lần kiểm tra trước và số giây đã định đi mà không nhích. */
  last = { x: 0, y: 0 }; stuckT = 0;

  constructor(private room: MapRoom, readonly id: string, readonly anchor: Pt, public cfg: AutoSettings) {}

  /**
   * Mỗi nhịp của phòng (trước bước di chuyển của người chơi): tính giờ treo, quyết định AUTO_HZ lần mỗi giây, lái hướng đi và đánh
   * thường. Gặp điều kiện dừng thì gọi room.autoStop (đối tượng này bị bỏ ngay).
   */
  tick(dt: number) {
    const room = this.room, p = room.state.players.get(this.id), d = room.pdata.get(this.id), c = room.clients.getById(this.id);
    if (!p || !d || !c) return room.autoStop(this.id, "mất kết nối.");
    this.clock += dt;
    d.autoUsed += dt; d.autoDirty = true;
    const why = this.stopReason(p, d);
    if (why) return room.autoStop(this.id, why);
    if ((this.decT -= dt) <= 0) { this.decT = 1 / AUTO_HZ; this.decide(p, d, c, dt); }
    if (d.auto !== this) return; // vừa dừng trong lúc quyết định
    this.steer(p, d, dt);
    // Đánh thường mỗi nhịp khi mục tiêu đã trong tầm (như giữ phím J); attack tự kiểm hồi chiêu, Choáng, vùng an toàn.
    const b = this.target ? room.state.beasts.get(this.target) : undefined;
    if (b && d.atkCd <= 0 && this.inReach(p, d, b)) room.attack(this.id);
  }

  /** Điều kiện dừng kiểm mỗi nhịp (mục 5.13): gục, vùng an toàn, đi cổng / truyền tống, hấp thụ, hết giờ trong ngày, túi đầy. */
  stopReason(p: PlayerState, d: PData): string | null {
    if (p.dead) return "cả đội đã gục.";
    if (d.travelling) return "rời bản đồ.";
    if (d.travelCast) return "đang đi cổng / truyền tống.";
    if (this.room.map.inSafe(p.x, p.y)) return "vào vùng an toàn.";
    if (d.absorbing) return "đang hấp thụ hồn hoàn.";
    if (d.autoUsed >= AUTO_DAILY_SECS) return `đã treo đủ ${AUTO_DAILY_SECS / 3600} giờ hôm nay.`;
    if (d.bag.filter((i) => i.vohonId === null).length >= d.bagSlots) return `túi đồ đã đầy (${d.bagSlots} ô).`;
    return null;
  }

  // ---------- Quyết định (AUTO_HZ lần mỗi giây) ----------
  decide(p: PlayerState, d: PData, c: Client, dt: number) {
    const room = this.room;
    // Sang ngày mới (giờ Việt Nam) thì giờ treo về 0.
    const day = room.today(); if (day !== d.autoDay) { d.autoDay = day; d.autoUsed = 0; }
    for (const [k, t] of this.skip) if (t <= this.clock) this.skip.delete(k);
    this.checkStuck(p, d, 1 / AUTO_HZ);
    if (this.potions(p, d) === "stop") return;
    // Bỏ mục tiêu đã chết / ra khỏi vùng / bị người khác giành; hồn thú đang đánh mình thì đổi sang nó (đánh trả).
    if (this.target && !this.keep(this.target, p)) this.drop();
    const foe = this.attacker(p);
    if (foe && foe !== this.target && (!this.target || room.bdata.get(this.target)?.target !== this.id)) this.setTarget(foe);
    if (this.target) {
      this.loot = null; this.patrol = null;
      const b = room.state.beasts.get(this.target)!;
      if (this.tienCo(p, d, c)) return;
      this.skill(p, d, c, b);
      return;
    }
    // Không có ai đánh: tự đổi về võ hồn chính nếu vừa đổi tay tung tiên cơ, rồi nhặt đồ, tìm mục tiêu mới, đi dạo / về điểm neo.
    this.tienCo(p, d, c);
    if (this.loot && !this.lootable(this.loot)) this.loot = null;
    if (!this.loot) this.loot = this.findLoot(p);
    if (this.loot) {
      const dr = room.state.drops.get(this.loot)!;
      if (Math.hypot(dr.x - p.x, dr.y - p.y) < PICKUP_RANGE - 4) {
        room.pickup(this.id);
        if (room.state.drops.has(this.loot)) this.skip.set(this.loot, this.clock + AUTO_MOVE.skip); // không nhặt được (ví dụ chưa tới lượt)
        this.loot = null; this.go(null);
      } else this.go({ x: dr.x, y: dr.y });
      return;
    }
    const t = this.findTarget(p);
    if (t) { this.setTarget(t); return; }
    const far = Math.hypot(p.x - this.anchor.x, p.y - this.anchor.y) > AUTO_RADIUS;
    if (far) { this.patrol = null; this.go(this.anchor); return; }
    if (!this.patrol || (this.patrolT -= dt) <= 0 || Math.hypot(this.patrol.x - p.x, this.patrol.y - p.y) < 6) {
      this.patrol = this.patrolPoint(); this.patrolT = rand(AUTO_MOVE.patrol[0], AUTO_MOVE.patrol[1]);
    }
    this.go(this.patrol);
  }

  setTarget(bid: string) { this.target = bid; this.hit = false; this.go(null); }
  drop() { this.target = null; this.hit = false; this.go(null); }

  /** Đặt đích đi tới (null = đứng yên); đích đổi thì bỏ đường cũ để lần lái sau tìm lại. */
  go(goal: Pt | null) {
    if (!goal) { this.goal = null; this.path = []; return; }
    if (this.goal && Math.hypot(goal.x - this.goal.x, goal.y - this.goal.y) < 2) return;
    this.goal = { x: goal.x, y: goal.y }; this.path = []; this.pathT = AUTO_MOVE.repath;
  }

  /** Bạn cùng phe: chính mình hoặc đồng đội tổ đội. */
  ally(sid: string | null | undefined) {
    if (!sid) return false;
    if (sid === this.id) return true;
    const me = this.room.pdata.get(this.id), o = this.room.pdata.get(sid), pid = me ? party.partyIdOf(me.accountId) : 0;
    return !!pid && !!o && party.partyIdOf(o.accountId) === pid;
  }
  /** Hồn thú đang giao chiến với người khác (không cướp quái): đang nhắm người khác, hoặc vừa bị người khác đánh. */
  taken(bid: string) {
    const bd = this.room.bdata.get(bid); if (!bd) return true;
    if (bd.target && !this.ally(bd.target)) return true;
    return !!bd.hitBy && !this.ally(bd.hitBy) && bd.calm < AUTO_CLAIM_SECS;
  }
  /** Còn giữ mục tiêu này: còn sống, hồn thú thường, không đang về chỗ sinh, trong vùng neo (hoặc đang đánh mình), không bị giành. */
  keep(bid: string, p: PlayerState) {
    const b = this.room.state.beasts.get(bid), bd = this.room.bdata.get(bid);
    if (!b || !bd || b.hp <= 0 || b.rank || bd.ret > 0 || this.skip.has(bid)) return false;
    if (bd.hitBy === this.id) this.hit = true;
    if (bd.target === this.id) return Math.hypot(b.x - p.x, b.y - p.y) < AUTO_RADIUS * 2;
    if (Math.hypot(b.x - this.anchor.x, b.y - this.anchor.y) > AUTO_RADIUS + 2 * TILE) return false;
    return !(this.taken(bid) && !(this.hit && bd.hitBy === this.id));
  }
  /** Hồn thú thường đang đánh mình ở gần (gần nhất). */
  attacker(p: PlayerState) {
    let best: string | null = null, bd2 = BEAST_AGGRO_R * 2;
    for (const [bid, b] of this.room.beastsNear(p.x, p.y, BEAST_AGGRO_R * 2)) {
      const bd = this.room.bdata.get(bid);
      if (b.rank || b.hp <= 0 || bd?.target !== this.id || this.skip.has(bid)) continue;
      const dd = Math.hypot(b.x - p.x, b.y - p.y); if (dd < bd2) { bd2 = dd; best = bid; }
    }
    return best;
  }
  /** Mục tiêu mới: hồn thú thường trong vùng neo, đúng khoảng niên hạn, chưa ai giành, gần mình nhất. */
  findTarget(p: PlayerState) {
    const [y0, y1] = this.cfg.years, R = AUTO_RADIUS;
    let best: string | null = null, bdist = Infinity;
    for (const [bid, b] of this.room.beastsNear(this.anchor.x, this.anchor.y, R)) {
      if (b.rank || b.hp <= 0 || b.years < y0 || b.years > y1 || this.skip.has(bid)) continue;
      if (Math.hypot(b.x - this.anchor.x, b.y - this.anchor.y) > R) continue;
      const bd = this.room.bdata.get(bid); if (!bd || bd.ret > 0 || this.taken(bid)) continue;
      const dd = Math.hypot(b.x - p.x, b.y - p.y); if (dd < bdist) { bdist = dd; best = bid; }
    }
    return best;
  }

  // ---------- Nhặt ----------
  /** Đồ rơi qua bộ lọc cài đặt: hồn hoàn từ `ring` năm, hồn cốt, hồn hạch, vật phẩm khác. */
  wanted(dr: DropState) {
    if (dr.item === "") return this.cfg.ring >= 0 && dr.years >= this.cfg.ring;
    if (dr.item === BONE_ITEM) return this.cfg.bone;
    if (dr.item === CORE_ITEM) return this.cfg.core;
    return this.cfg.item;
  }
  lootable(did: string) {
    const dr = this.room.state.drops.get(did);
    return !!dr && !this.skip.has(did) && this.wanted(dr) && this.room.canLoot(dr, this.id)
      && Math.hypot(dr.x - this.anchor.x, dr.y - this.anchor.y) <= AUTO_RADIUS + 2 * TILE;
  }
  findLoot(p: PlayerState) {
    let best: string | null = null, bdist = Infinity;
    for (const did of this.room.interest.drops.near(this.anchor.x, this.anchor.y, AUTO_RADIUS)) {
      if (!this.lootable(did)) continue;
      const dr = this.room.state.drops.get(did)!, dd = Math.hypot(dr.x - p.x, dr.y - p.y);
      if (dd < bdist) { bdist = dd; best = did; }
    }
    return best;
  }

  // ---------- Đan, tiên cơ, hồn kỹ ----------
  /** Uống đan khi sinh lực / hồn lực dưới ngưỡng (qua useItem: hồi chiêu chung DAN_CD, đầy thì không uống). "stop" nếu hết đan cần dừng. */
  potions(p: PlayerState, d: PData): "stop" | void {
    if (d.danCd > 0) return;
    const pot = (list: ItemDef[]) => { for (const def of list) { const it = d.bag.find((i) => i.code === def.id && i.vohonId === null); if (it) return it; } return null; };
    if (this.cfg.hp > 0 && d.hpF < p.maxHp * this.cfg.hp) {
      const it = pot(HP_POTS);
      if (it) return void this.room.useItem(this.id, it.id);
      if (this.cfg.stopNoPot) { this.room.autoStop(this.id, "hết đan hồi sinh lực."); return "stop"; }
    }
    if (this.cfg.mp > 0 && d.mpF < p.maxMp * this.cfg.mp) { const it = pot(MP_POTS); if (it) this.room.useItem(this.id, it.id); }
  }

  /**
   * Đổi tay tung tiên cơ (cài đặt `tienCo`): đang đánh mà võ hồn khác trong đội (chưa gục) đầy năng lượng thì đổi vào (switchSlot tự
   * tung); hết hồi chiêu đổi thì về võ hồn chính. Trả về true nếu vừa đổi.
   */
  tienCo(p: PlayerState, d: PData, c: Client) {
    if (!this.cfg.tienCo || p.swCd > 0) return false;
    if (this.home !== null && (!d.team.includes(this.home) || d.down.has(this.home))) this.home = null;
    if (this.target) {
      for (let s = 0; s < TEAM_SIZE; s++) {
        const r = d.team[s];
        if (!r || r === d.ch.rowId || d.down.has(r) || (d.energy.get(r) ?? 0) < TIEN_CO_MAX) continue;
        const from = d.ch.rowId;
        this.room.switchSlot(c, s);
        if (d.ch.rowId === r) { this.home ??= from; return true; }
      }
    }
    if (this.home !== null && this.home !== d.ch.rowId) {
      const s = d.team.indexOf(this.home), home = this.home;
      this.room.switchSlot(c, s);
      if (d.ch.rowId === home) { this.home = null; return true; }
    }
    return false;
  }

  /** Hồn kỹ ở ô `i` như skill() sẽ tung (kể cả hồn kỹ Chân Thân ở ô P); null nếu ô trống / chưa mở vòng. */
  skillAt(p: PlayerState, d: PData, i: number): { sk: SkillDef; ct: boolean } | null {
    const ct = i === CHAN_THAN_SKILL_SLOT && d.ava ? chanThanOf(d.ch.vohon)?.skill ?? null : null;
    const r = ct ? CHAN_THAN_RING - 1 : loadoutOf(d.ch.vohon, d.ch.skills)[i];
    if (r < 0 || r >= p.rings.length) return null;
    const sk = ct ?? ringSkill(d.ch.vohon, r);
    return sk ? { sk, ct: !!ct } : null;
  }

  /**
   * Tung một hồn kỹ theo thứ tự ưu tiên của cài đặt khi mục tiêu trong tầm của hồn kỹ đó: hết hồi chiêu, không Câm lặng / Choáng, đủ hồn
   * lực và còn chừa `mpKeep`; hồn kỹ nhắm mục tiêu thì hồn thú gần nhất trong tầm phải không thuộc người khác. Tung qua skill() như
   * người chơi bấm U / I / O / P.
   */
  skill(p: PlayerState, d: PData, c: Client, b: BeastState) {
    const room = this.room;
    if (room.pctl(d).noSkill) return;
    const dist = Math.hypot(b.x - p.x, b.y - p.y) - TIERS[b.tier].size / 2;
    for (const i of this.cfg.skills) {
      const at = this.skillAt(p, d, i); if (!at) continue;
      if (at.ct ? p.ctCd > 0 : p.cds[i] > 0) continue;
      let run = at.sk;
      if (run.copy) { const src = room.copySource(this.id); if (!src) continue; run = src.sk; }
      const cost = at.sk.cost * (1 - Math.min(0.9, room.buffV(d, "mp")));
      if (d.mpF < cost || d.mpF - cost < p.maxMp * this.cfg.mpKeep) continue;
      const reach = run.area === "target" ? run.r : run.at ?? (run.area === "self" ? BEAST_AGGRO_R : run.r);
      if (dist > reach) continue;
      if (run.area === "target" || run.at) { const near = room.nearestBeast(p, reach); if (!near || (near !== this.target && this.taken(near))) continue; }
      room.skill(c, i);
      return;
    }
  }

  // ---------- Di chuyển ----------
  /** Đòn đánh thường trúng `b` nếu đánh ngay (đúng hình đòn trong attack(): điểm trước mặt 10 pixel, bán kính 18 + nửa cỡ hồn thú). */
  inReach(p: PlayerState, d: PData, b: BeastState) {
    const ax = p.x + d.dir.x * 10, ay = p.y - 6 + d.dir.y * 10, s = TIERS[b.tier].size;
    return Math.hypot(b.x - ax, b.y - s / 2 - ay) < 18 + s / 2 - 2;
  }

  /**
   * Mỗi nhịp: đặt hướng đi (applyInput, như tin `input` của người chơi) theo việc đang làm. Có mục tiêu: trong tầm thì đứng yên, không
   * thì đi thẳng tới nó nếu không vướng, vướng thì theo đường A*. Không có mục tiêu: đi theo đường tới đích (đồ rơi, điểm dạo, điểm neo).
   */
  steer(p: PlayerState, d: PData, dt: number) {
    const room = this.room, map = room.map;
    const b = this.target ? room.state.beasts.get(this.target) : undefined;
    let to: Pt | null = null;
    if (b) {
      if (this.inReach(p, d, b)) return room.applyInput(d, 0, 0, false);
      // Không vướng thì đi thẳng tới hồn thú (đứng sát mà lệch hướng thì bước này quay mặt, như người chơi nhích phím).
      if (clearLine(map, p, b)) { this.path = []; this.goal = null; to = { x: b.x, y: b.y }; }
      else {
        this.pathT += dt;
        if (!this.goal || Math.hypot(this.goal.x - b.x, this.goal.y - b.y) > 2 * TILE) { this.goal = { x: b.x, y: b.y }; this.path = []; }
        if (!this.path.length && this.pathT >= AUTO_MOVE.repath) this.plan(p);
        to = this.path[0] ?? null;
      }
    } else if (this.goal) {
      this.pathT += dt;
      if (!this.path.length && this.pathT >= AUTO_MOVE.repath) this.plan(p);
      to = this.path[0] ?? null;
    }
    while (to && this.path.length && Math.hypot(to.x - p.x, to.y - p.y) < Math.max(3, p.spd * dt)) { this.path.shift(); to = this.path[0] ?? null; }
    if (!to) return room.applyInput(d, 0, 0, false);
    const dx = to.x - p.x, dy = to.y - p.y, dd = Math.hypot(dx, dy);
    if (dd < 1) return room.applyInput(d, 0, 0, false);
    // Gần đích cuối thì đẩy cần nhẹ để không bước qua (server nhân tốc độ theo độ dài hướng đi), nhưng không dưới ngưỡng MOVE_DEAD.
    const last = !b && this.path.length <= 1, k = last ? Math.max(MOVE_DEAD * 1.5, Math.min(1, dd / Math.max(1, 2 * p.spd * dt))) : 1;
    room.applyInput(d, (k * dx) / dd, (k * dy) / dd, false);
  }

  /** Tìm đường A* (shared/path.ts) tới `goal`; không tới gần được thì bỏ qua mục tiêu / đồ rơi đó một lúc. */
  plan(p: PlayerState) {
    this.pathT = 0;
    if (!this.goal) return;
    this.path = findPath(this.room.map, p, this.goal, AUTO_MOVE.path);
    const end = this.path.at(-1) ?? p;
    if (Math.hypot(end.x - this.goal.x, end.y - this.goal.y) > 2 * TILE) this.unreachable();
  }

  /** Kẹt: định đi mà quá AUTO_MOVE.stuck giây không nhích thì bỏ việc đang làm (mục tiêu / đồ / điểm dạo). */
  checkStuck(p: PlayerState, d: PData, dt: number) {
    const moved = Math.hypot(p.x - this.last.x, p.y - this.last.y);
    this.last = { x: p.x, y: p.y };
    const trying = Math.hypot(d.input.x, d.input.y) > MOVE_DEAD && p.spd > 0;
    this.stuckT = trying && moved < 0.5 ? this.stuckT + dt : 0;
    if (this.stuckT >= AUTO_MOVE.stuck) { this.stuckT = 0; this.unreachable(); }
  }
  unreachable() {
    const key = this.target ?? this.loot;
    if (key) this.skip.set(key, this.clock + AUTO_MOVE.skip);
    if (this.target) this.drop(); else this.loot = null;
    this.patrol = null; this.go(null);
  }

  /** Điểm dạo ngẫu nhiên đứng được trong vùng neo (ngoài vùng an toàn); không tìm được thì về điểm neo. */
  patrolPoint(): Pt {
    const map = this.room.map;
    for (let k = 0; k < 12; k++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * AUTO_RADIUS * 0.85;
      const x = this.anchor.x + Math.cos(a) * r, y = this.anchor.y + Math.sin(a) * r;
      if (map.standable(x, y) && !map.inSafe(x, y)) return { x, y };
    }
    return { ...this.anchor };
  }
}
