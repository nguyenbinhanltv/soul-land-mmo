// Tự săn online phía server (Auto 1, mục 5.13). Mỗi người bật tự săn có một AutoHunter trong MapRoom: nó chỉ quyết định làm gì rồi
// gọi đúng các hàm xử lý lệnh của người chơi (applyInput như tin `input`, attack, skill, switchSlot, useItem, pickup), nên mọi luật
// cũ (hồi chiêu, hồn lực, Câm lặng / Choáng, vùng an toàn, quyền nhặt, túi đầy…) vẫn áp như khi người chơi tự bấm. Không đường tắt.
// Quyết định chạy AUTO_HZ lần mỗi giây; giữa hai lần chỉ lái hướng đi theo đường đã tìm và đánh thường khi mục tiêu trong tầm.
// Từ #218 đánh cả tinh anh, thú vương, boss thế giới (mục tiêu chung), né vùng báo trước / vùng độc mỗi nhịp, đổi võ hồn theo cơ chế boss.
import type { Client } from "colyseus";
import { TIERS, TILE, ITEMS, BONE_ITEM, CORE_ITEM, RING_ITEM, PICKUP_RANGE, BEAST_AGGRO_R, TIEN_CO_MAX, CHAN_THAN_RING, CHAN_THAN_SKILL_SLOT,
  AUTO_HZ, AUTO_DAILY_SECS, AUTO_CLAIM_SECS, AUTO_MOVE, AUTO_SUM_LOOT, AUTO_RADIUS, AUTO_PACE, AUTO_STATUS, AUTO_BOSS, AUTO_LOOT_RADIUS, AUTO_LOOT_WAIT,
  AUTO_BOSS_DETOUR, AUTO_TARGET, AUTO_PARTY, AUTO_STUCK, AUTO_CLUSTER, AUTO_AOE_MIN, AUTO_SPAWN, AUTO_REST, BEASTS, STATUS, VOHON, offlineFight, loadoutOf, ringSkill,
  chanThanOf, autoTimeText, itemDef, xpNeed, formatYears, vohonIndex, isCcStatus, teleHits, teleSafe,
  type AutoSettings, type AutoSummary, type AutoWhy, type AutoRate, type OfflinePower, type SkillDef, type ItemDef, type He } from "../../../shared/data.ts";
import { MOVE_DEAD, type SolidGrid } from "../../../shared/move.ts";
import { findPath, findLongPath, clearLine, buildNav, navNode, type Pt, type Nav } from "../../../shared/path.ts";
import type { GameMap } from "../map.ts";
import * as party from "../party.ts";
import type { MapRoom, PData } from "./MapRoom.ts";
import type { PlayerState, BeastState, DropState } from "./schema.ts";
import { AutoFeed } from "./autoStatus.ts";

/** Đan theo thứ tự ITEMS (đan thường trước đan lớn): uống loại có trong túi đầu tiên. */
const HP_POTS = ITEMS.filter((d) => d.hp), MP_POTS = ITEMS.filter((d) => d.mp);
/** Nửa cỡ hồn thú lớn nhất: cộng vào bán kính khi lấy ứng viên từ lưới không gian (như BEAST_HALF của MapRoom). */
const BEAST_HALF = Math.max(...TIERS.map((t) => t.size)) / 2;
/** Dạng hồn kỹ đánh diện rộng quanh thân / trước mặt (AUTO_AOE_MIN, B1 #610). */
const AOE_AREAS: string[] = ["around", "front"];
const rand = (a: number, b: number) => a + Math.random() * (b - a);
/** Kinh nghiệm tích lũy của một võ hồn (mọi cấp đã qua cộng phần của cấp đang có): hiệu hai lần chụp là kinh nghiệm nhận được. */
const xpTotal = (level: number, xp: number) => { let n = xp; for (let l = 1; l < level; l++) n += xpNeed(l); return n; };

/**
 * Lưới tìm đường của tự săn và đồ thị dẫn đường (#213), dựng một lần cho mỗi bản đồ: như lưới ô chặn của bản đồ, thêm các ô chạm vùng
 * an toàn (vào vùng an toàn thì tự săn dừng) nên đường đi, kể cả đường dài qua cả bản đồ, luôn vòng qua trại / làng.
 */
const navs = new WeakMap<GameMap, { grid: SolidGrid; nav: Nav }>();
function navOf(map: GameMap) {
  let v = navs.get(map);
  if (!v) {
    const solid = map.solid.slice(), { MW, MH } = map;
    for (const r of map.safe) {
      const x0 = Math.max(0, Math.floor(r.x / TILE)), x1 = Math.min(MW - 1, Math.floor((r.x + r.w) / TILE));
      const y0 = Math.max(0, Math.floor(r.y / TILE)), y1 = Math.min(MH - 1, Math.floor((r.y + r.h) / TILE));
      for (let y = y0; y <= y1; y++) solid.fill(1, y * MW + x0, y * MW + x1 + 1);
    }
    const grid = { MW, MH, solid };
    v = { grid, nav: buildNav(grid, AUTO_MOVE.nav.block) }; navs.set(map, v);
  }
  return v;
}

/** Ảnh chụp để tính tổng kết (Auto 2): hồn thú đã hạ và kinh nghiệm cộng mọi võ hồn, Hồn Tệ, số món trong túi theo nhãn. */
export interface AutoSnap { kills: number; xp: number; coins: number; bag: Map<string, number>; }
export function snap(room: MapRoom, id: string, d: PData): AutoSnap {
  room.syncCh(id); // võ hồn ra trận: cấp / kinh nghiệm / số hồn thú đã hạ đang ở state, chép vào d.ch trước khi cộng
  const bag = new Map<string, number>();
  for (const it of d.bag) {
    if (it.vohonId !== null) continue;
    const name = it.code === RING_ITEM ? `Hồn hoàn ${formatYears(it.years ?? 0)}` : it.code === CORE_ITEM ? `Hồn hạch ${it.stars ?? 1}★`
      : itemDef(it.code)?.name ?? "Vật phẩm lạ";
    bag.set(name, (bag.get(name) ?? 0) + it.qty);
  }
  return { kills: d.owned.reduce((n, v) => n + v.kills, 0), xp: d.owned.reduce((n, v) => n + xpTotal(v.level, v.xp), 0), coins: d.honTe, bag };
}

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
  /** Số giây mục tiêu trong tầm mà không đánh được vì đòn sẽ trúng hồn thú người khác đang giao chiến. */
  blockT = 0;
  /**
   * Đi thẳng tới mục tiêu được không (clearLine), tính lại khi mình hoặc mục tiêu dời quá vài pixel so với lần tính trước; toạ độ NaN là
   * chưa tính (lần đầu, hoặc mục tiêu ở xa ngoài khung A*) nên lần tới gần luôn tính (#291).
   */
  los = { px: NaN, py: NaN, bx: NaN, by: NaN, ok: false };
  /** Hook test (#291): nhịp trước đi thẳng ("line") hay theo đường A* ("path"), số lần tìm đường A* (plan) và số lần tính clearLine. */
  way: "line" | "path" | null = null; plans = 0; lines = 0;

  /** Giây còn phải chờ đồ rơi sau khi vừa hạ một hồn thú thường (AUTO_LOOT_WAIT) trước khi nhắm con mới (#608). */
  lootWait = 0;
  /** Lần kiểm "quanh mình hết hồn thú thường" gần nhất (hasNear): giây của `clock` và kết quả. */
  freeAt: { t: number; v: boolean } | null = null;

  /** Vùng sinh hồn thú nơi vừa hạ một con (chỉ số trong map.zones → giây của `clock` lúc hạ), tối đa AUTO_SPAWN.max (B2, #610). */
  spawns = new Map<number, number>();
  /** Số lần tung hồn kỹ diện rộng vì có từ AUTO_AOE_MIN con trong vùng (hook test, B1 #610). */
  aoeCasts = 0;
  /** Đang đi dạo tới vùng hồi sinh đã nhớ (để hiện trạng thái). */
  spawning = false;
  /** Hết đan: đang đứng nghỉ hồi sinh lực tới AUTO_REST.resume (B3, #610). */
  resting = false;

  /** Nợ nhịp (giây, AUTO_PACE): còn dương thì không nhắm hồn thú mới. `est`: giây tự đánh ước lượng của con vừa hạ (hook test). */
  pace = 0; est = 0;

  /** #218: mục tiêu là tinh anh / thú vương / boss thế giới (mục tiêu chung: không áp luật không cướp quái, không tính trần AUTO_PACE). */
  boss = false;
  /** Chỗ né đang đi tới khi đứng trong vùng báo trước / vùng độc (#218); `dodgeT`: chờ trước lần tìm lại; `dodges`: số lần chọn chỗ né (hook test). */
  dodge: Pt | null = null; dodgeT = 0; dodges = 0;
  /** Đang lùi ra khỏi boss vì ít máu (AUTO_BOSS.retreat → back); `warm`: đang tới Hỏa Đàn xả tầng Hàn (Cực Hàn, #163). */
  away = false; warm = false;
  /** Võ hồn đổi vì cơ chế boss (#218): hệ đang cần và số giây đã giữ (quá AUTO_BOSS.hold thì thôi tới khi cơ chế đổi). */
  role: { he: He; t: number } | null = null;

  /** Chống kẹt (AH4, #611): các điểm đứng mỗi AUTO_STUCK.sample giây, giây tới lần ghi kế, lý do vừa đổi việc (`why`, hiện AUTO_STUCK.show giây). */
  trail: Pt[] = []; trailT = 0; why: { w: AutoWhy; t: number } | null = null;

  /** Tổng kết: giây đã treo lượt này và ảnh chụp lúc bật. */
  secs = 0; start: AutoSnap;
  /** Trạng thái và thống kê theo giờ gửi cho chính chủ (AH2, #609). */
  feed = new AutoFeed();

  constructor(readonly room: MapRoom, readonly id: string, readonly anchor: Pt, public cfg: AutoSettings) {
    this.start = snap(room, id, room.pdata.get(id)!);
  }
  /** Săn khắp bản đồ (phạm vi "map", #213) hay chỉ quanh điểm neo ("near"). */
  get wide() { return this.cfg.scope !== "near"; }
  /** Bán kính (pixel) nhặt đồ / tìm hồn thú trước tiên quanh tâm săn: vùng neo theo cài đặt, hoặc AUTO_RADIUS quanh mình khi săn khắp bản đồ. */
  get R() { return this.wide ? AUTO_RADIUS : this.cfg.radius * TILE; }
  /** Tâm săn: chỗ đang đứng khi săn khắp bản đồ, điểm neo khi chỉ quanh chỗ đứng. */
  center(): Pt { const p = this.wide ? this.room.state.players.get(this.id) : undefined; return p ? { x: p.x, y: p.y } : this.anchor; }

  /** Tổng kết lượt tự săn (Auto 2): so ảnh chụp lúc bật với bây giờ; đồ nhặt là các món tăng trong túi, nhiều nhất trước. */
  summary(d: PData): AutoSummary {
    const now = snap(this.room, this.id, d), loot: [string, number][] = [];
    for (const [k, n] of now.bag) { const g = n - (this.start.bag.get(k) ?? 0); if (g > 0) loot.push([k, g]); }
    loot.sort((a, b) => b[1] - a[1]);
    this.feed.sample(this.secs, now);
    const h = this.secs >= AUTO_STATUS.minSecs ? 3600 / this.secs : 0, xp = Math.max(0, now.xp - this.start.xp), coins = Math.max(0, now.coins - this.start.coins);
    return { secs: Math.round(this.secs), kills: Math.max(0, now.kills - this.start.kills), xp, coins, loot: loot.slice(0, AUTO_SUM_LOOT),
      ...(h ? { rate: [Math.round(xp * h), Math.round(coins * h), Math.round(this.feed.gained * h)] as AutoRate } : {}) };
  }

  /**
   * Mỗi nhịp của phòng (trước bước di chuyển của người chơi): tính giờ treo, quyết định AUTO_HZ lần mỗi giây, lái hướng đi và đánh
   * thường. Gặp điều kiện dừng thì gọi room.autoStop (đối tượng này bị bỏ ngay).
   */
  tick(dt: number) {
    const room = this.room, p = room.state.players.get(this.id), d = room.pdata.get(this.id), c = room.clients.getById(this.id);
    if (!p || !d || !c) return room.autoStop(this.id, "mất kết nối.");
    this.clock += dt; this.secs += dt; this.lootWait = Math.max(0, this.lootWait - dt);
    // Nợ nhịp giảm theo thời gian thực; chỉ kẹp khi không có mục tiêu (rảnh), không kẹp lúc đang đi tới / đánh một con (AUTO_PACE).
    this.pace -= dt; if (!this.target) this.pace = Math.max(-AUTO_PACE.credit, this.pace);
    // Giờ miễn phí của hôm nay trước, hết thì tiêu quỹ cộng thêm từ Ủy Thác Lệnh (Auto 2).
    if (d.autoUsed < AUTO_DAILY_SECS) d.autoUsed += dt; else d.autoBonus = Math.max(0, d.autoBonus - dt);
    d.autoDirty = true;
    const why = this.stopReason(p, d);
    if (why) return room.autoStop(this.id, why);
    if ((this.decT -= dt) <= 0) { this.decT = 1 / AUTO_HZ; this.decide(p, d, c, 1 / AUTO_HZ); }
    if (d.auto !== this) return; // vừa dừng trong lúc quyết định
    this.feed.tick(this, p, c, () => snap(room, this.id, d));
    this.steer(p, d, dt);
    // Đánh thường mỗi nhịp khi mục tiêu đã trong tầm (như giữ phím J); attack tự kiểm hồi chiêu, Choáng, vùng an toàn.
    // Đòn thường trúng mọi hồn thú quanh điểm trước mặt: vướng hồn thú người khác đang giao chiến thì không đánh (trừ khi mục tiêu đang
    // đánh mình), quá AUTO_MOVE.stuck giây vẫn vướng thì bỏ mục tiêu này.
    const b = this.target ? room.state.beasts.get(this.target) : undefined;
    if (b && !this.away && !this.warm && d.atkCd <= 0 && this.inReach(p, d, b)) {
      const ax = p.x + d.dir.x * 10, ay = p.y - 6 + d.dir.y * 10;
      if (!this.fighting() && this.splash(ax, ay, 18)) { if ((this.blockT += dt) >= AUTO_MOVE.stuck) this.unreachable(); }
      else { this.blockT = 0; room.attack(this.id); }
    }
  }

  /** Mục tiêu đang đánh chính mình (đánh trả thì không né hồn thú người khác đứng cạnh). */
  fighting() { return !!this.target && this.room.bdata.get(this.target)?.target === this.id; }
  /**
   * Đòn / vùng tâm (x, y) bán kính r (tính tới thân hồn thú như attack(): tâm thân cao nửa cỡ) trúng hồn thú khác mục tiêu mà người
   * khác đang giao chiến (taken) không: tự săn không đánh lan sang hồn thú của người khác.
   */
  splash(x: number, y: number, r: number) {
    if (this.boss) return false; // trận boss là mục tiêu chung: đánh trúng cả hồn thú khác quanh boss (bầy, nhện con) cũng được
    for (const [bid, b] of this.room.beastsNear(x, y, r + BEAST_HALF)) {
      const s = TIERS[b.tier].size;
      if (bid !== this.target && Math.hypot(b.x - x, b.y - s / 2 - y) < r + s / 2 && this.taken(bid)) return true;
    }
    return false;
  }

  /**
   * Điều kiện dừng kiểm mỗi nhịp (mục 5.13): gục, vùng an toàn, đi cổng / truyền tống, hấp thụ, hết giờ trong ngày, túi đầy (đã bật tự
   * bán thì bán từ xa theo bộ lọc trước, #216; vẫn đầy mới dừng).
   */
  stopReason(p: PlayerState, d: PData): string | null {
    if (p.dead) return "cả đội đã gục.";
    if (d.travelling) return "rời bản đồ.";
    if (d.travelCast) return "đang đi cổng / truyền tống.";
    if (this.room.map.inSafe(p.x, p.y)) return "vào vùng an toàn.";
    if (d.absorbing) return "đang hấp thụ hồn hoàn.";
    if (d.autoUsed >= AUTO_DAILY_SECS && d.autoBonus <= 0) return `đã treo đủ ${autoTimeText(AUTO_DAILY_SECS)} hôm nay.`;
    if (d.bag.filter((i) => i.vohonId === null).length >= d.bagSlots && !this.room.autoSell(this.id))
      return `túi đồ đã đầy (${d.bagSlots} ô)${d.sellCfg.on ? ", không còn món nào hợp bộ lọc tự bán" : ""}.`;
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
    if (this.target && !this.keep(this.target, p, d)) this.drop();
    // Đang nghỉ hồi: bỏ mục tiêu chưa đánh (đánh trả và con đang đánh mình vẫn giữ).
    if (this.resting && this.target && !(this.hit || this.fighting())) this.drop();
    // Thứ tự mỗi nhịp (#608): né (steer) → đan (trên) → đánh trả con đang đánh mình (sát) → NHẶT → chọn mục tiêu → đi dạo. Chế độ boss
    // "always" (#218, như cũ): tinh anh / thú vương / boss thế giới trên bản đồ thì tới đánh trước mọi việc khác (kể cả đánh trả: bầy /
    // nhện con boss gọi ra trúng lan từ đòn và hồn kỹ diện rộng, và nhặt); không xét trần AUTO_PACE. Chưa đánh trúng boss đang nhắm thì
    // vẫn xét lại: boss bậc cao hơn / gần hơn vừa nhắm được (ví dụ vừa hết khóa thưởng) thì đổi sang.
    const always = this.cfg.bossMode === "always";
    if (always && !this.resting && (!this.boss || !this.hit)) { const t = this.findBoss(p, d); if (t && t !== this.target) this.setTarget(t); }
    const foe = this.boss ? null : this.attacker(p);
    if (foe && foe !== this.target && (!this.target || room.bdata.get(this.target)?.target !== this.id)) this.setTarget(foe);
    // Đang đánh (đã trúng, hoặc nó đang đánh mình) thì giữ tới khi hạ; chưa thì nhặt đồ trước (bỏ mục tiêu đang đi tới, chọn lại sau).
    if (!(this.target && (this.hit || this.fighting())) && !(this.boss && always)) {
      this.tienCo(p, d, c);
      if (this.loot && !this.lootable(this.loot)) this.loot = null;
      if (!this.loot) this.loot = this.findLoot(p);
      if (this.loot) {
        if (this.target) this.drop();
        const dr = room.state.drops.get(this.loot)!;
        if (Math.hypot(dr.x - p.x, dr.y - p.y) < PICKUP_RANGE - 4) {
          room.pickup(this.id, this.loot); // đúng món đã chọn theo bộ lọc, không phải món gần nhất (có thể bị lọc bỏ)
          if (room.state.drops.has(this.loot)) this.skip.set(this.loot, this.clock + AUTO_MOVE.skip); // không nhặt được (ví dụ chưa tới lượt)
          this.loot = null; this.go(null);
        } else this.go({ x: dr.x, y: dr.y });
        return;
      }
      // Vừa hạ một con: chờ đồ rơi rồi mới nhắm con mới.
      if (!this.target && this.lootWait > 0) { this.patrol = null; this.go(null); return; }
    }
    // Chế độ "near": tinh anh / thú vương / boss thế giới chỉ khi gần (findBoss); không xét trần AUTO_PACE. Chưa đánh trúng boss đang nhắm
    // thì xét lại như trên; đang đi tới hồn thú thường chưa đánh trúng mà boss vừa vào tầm thì đổi sang boss.
    if (!always && !this.resting && !this.hit && !this.fighting()) { const t = this.findBoss(p, d); if (t && t !== this.target) this.setTarget(t); }
    // Chưa có mục tiêu: chọn con mới (trần AUTO_PACE: còn nợ nhịp thì đứng nghỉ, vẫn đánh trả và nhặt đồ).
    if (!this.target && this.pace <= 0 && !this.resting) { const t = this.findTarget(p); if (t) { this.setTarget(t); return; } }
    // Săn khắp bản đồ: đang đi tới hồn thú ở xa (chưa đánh trúng, nó chưa đánh mình) mà gần mình có con hợp lệ thì đổi sang con gần.
    if (this.target && !this.boss && this.wide && !this.hit && !this.fighting() && this.pace <= 0) {
      const b = room.state.beasts.get(this.target)!;
      if (Math.hypot(b.x - p.x, b.y - p.y) > this.R) { const t = this.findTarget(p, true); if (t) this.setTarget(t); }
    }
    if (this.target) {
      this.loot = null; this.patrol = null;
      const b = room.state.beasts.get(this.target)!;
      if (this.boss) this.hurt(p, d, b);
      const need = this.boss ? this.mechanic(p, d, c, b, dt) : null;
      if (need === "swap") return;
      if (!need && this.tienCo(p, d, c)) return;
      this.skill(p, d, c, b, need);
      return;
    }
    if (this.pace > 0 || this.resting) { this.patrol = null; this.go(null); return; }
    // Tổ đội cùng treo (AH4): hết việc mà cách đồng đội xa thì đi lại gần, không đi dạo tách nhau.
    const mate = this.mates().reduce<{ p: PlayerState } | null>((m, q) => (!m || Math.hypot(q.p.x - p.x, q.p.y - p.y) < Math.hypot(m.p.x - p.x, m.p.y - p.y) ? q : m), null);
    if (mate && Math.hypot(mate.p.x - p.x, mate.p.y - p.y) > AUTO_PARTY.follow && (this.wide || Math.hypot(mate.p.x - this.anchor.x, mate.p.y - this.anchor.y) <= this.R)) { this.patrol = null; this.go({ x: mate.p.x, y: mate.p.y }); return; }
    const far = !this.wide && Math.hypot(p.x - this.anchor.x, p.y - this.anchor.y) > this.R;
    if (far) { this.patrol = null; this.go(this.anchor); return; }
    // Vùng neo trống / cả bản đồ không còn hồn thú hợp lệ (săn khắp bản đồ): đi dạo chờ hồn thú hồi sinh, ưu tiên trong vùng sinh đã nhớ (B2).
    if (!this.patrol || (this.patrolT -= dt) <= 0 || Math.hypot(this.patrol.x - p.x, this.patrol.y - p.y) < 6) {
      const sp = this.spawnSpot(p);
      this.spawning = !!sp; this.patrol = sp ?? this.patrolPoint(this.center()); this.patrolT = rand(AUTO_MOVE.patrol[0], AUTO_MOVE.patrol[1]);
    }
    this.go(this.patrol);
  }

  /**
   * MapRoom báo mình vừa hạ một hồn thú thường (killBeast): cộng thời gian tự đánh con đó vào nợ nhịp (AUTO_PACE). Thời gian thật đã
   * đi / đánh mục tiêu đã trừ vào nợ (không kẹp), nên con đó tốn max(thật, ước lượng); phần thật dư quá `credit` giây bỏ khi thôi nhắm
   * mục tiêu (drop). Hạ lan con khác giữa trận không kẹp, để không xóa thời gian thật của trận đang đánh.
   */
  killed(pw: OfflinePower, years: number, species: string, zi?: number) {
    this.est = offlineFight(pw, years, species).secs; this.pace += this.est; this.lootWait = AUTO_LOOT_WAIT;
    if (zi === undefined || !this.room.map.zones[zi]) return; // zi: vùng sinh thật của con vừa hạ (bdata.zone), không theo chỗ nó chết
    this.spawns.delete(zi); this.spawns.set(zi, this.clock); // làm mới: vùng hạ gần nhất xếp cuối
    if (this.spawns.size > AUTO_SPAWN.max) this.spawns.delete(this.spawns.keys().next().value!);
  }

  /**
   * Điểm đi dạo trong vùng sinh đã nhớ (B2, #610): vùng chưa quá AUTO_SPAWN.keep giây, niên hạn vùng giao khoảng đã chọn, điểm đứng được,
   * đi bộ tới được (cùng vùng liên thông) và, chỉ quanh chỗ đứng, trong vùng neo. Chọn vùng có (thời gian đi + giây còn chờ hồi sinh) nhỏ
   * nhất. Không có thì null (đi dạo quanh tâm săn như cũ).
   */
  spawnSpot(p: PlayerState): Pt | null {
    const map = this.room.map, { nav } = navOf(map), me = navNode(nav, p.x, p.y), region = me >= 0 ? nav.region[me] : -1, spd = Math.max(1, p.spd);
    let best: Pt | null = null, bcost = Infinity;
    for (const [zi, t] of [...this.spawns]) {
      if (this.clock - t > AUTO_SPAWN.keep) { this.spawns.delete(zi); continue; }
      const z = map.zones[zi];
      if (z.years && (z.years[1] < this.cfg.years[0] || z.years[0] > this.cfg.years[1])) continue;
      for (let k = 0; k < 12; k++) {
        const x = z.x0 + 8 + Math.random() * Math.max(0, z.x1 - z.x0 - 16), y = z.y0 + 24 + Math.random() * Math.max(0, z.y1 - z.y0 - 48);
        if (!map.standable(x, y) || map.inSafe(x, y)) continue;
        if (!this.wide && Math.hypot(x - this.anchor.x, y - this.anchor.y) > this.R + 2 * TILE) continue;
        const n = navNode(nav, x, y); if (n < 0 || nav.region[n] !== region) continue;
        const cost = Math.hypot(x - p.x, y - p.y) / spd + Math.max(0, t + AUTO_SPAWN.wait - this.clock);
        if (cost < bcost) { bcost = cost; best = { x, y }; }
        break;
      }
    }
    return best;
  }

  setTarget(bid: string) {
    this.target = bid; this.hit = false; this.blockT = 0; this.go(null);
    this.boss = !!this.room.state.beasts.get(bid)?.rank; this.away = this.warm = false; this.role = null;
  }
  drop() {
    this.target = null; this.hit = false; this.go(null); this.pace = Math.max(-AUTO_PACE.credit, this.pace);
    this.boss = false; this.away = this.warm = false; this.role = null;
  }

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
  /**
   * Đồng đội tổ đội đang tự săn cùng phòng (AH4, #611): người chơi và bộ tự săn của họ. Chỉ tính người có vùng săn chồng vùng của mình:
   * khi một trong hai săn "Chỉ quanh chỗ đứng", tâm săn hai người phải cách nhau không quá R + AUTO_PARTY.leash (neo xa nhau thì mỗi người
   * săn vùng mình, không kéo nhau).
   */
  mates() {
    const out: { p: PlayerState; a: AutoHunter }[] = [], c = this.center(), me = this.room.pdata.get(this.id);
    if (!me || !party.partyIdOf(me.accountId)) return out; // không tổ đội: khỏi duyệt cả phòng
    for (const [sid, o] of this.room.pdata) {
      const q = o.auto && o.auto !== this && this.ally(sid) ? this.room.state.players.get(sid) : undefined;
      if (!q || q.dead) continue;
      if ((!this.wide || !o.auto!.wide) && Math.hypot(o.auto!.center().x - c.x, o.auto!.center().y - c.y) > this.R + AUTO_PARTY.leash) continue;
      out.push({ p: q, a: o.auto! });
    }
    return out;
  }
  /**
   * Hồn thú người treo khác (ngoài tổ đội) đang nhắm: không nhắm theo, để hai người treo không cùng đi tới một con ở xa (săn khắp bản
   * đồ) rồi một người đi uổng.
   */
  claimed() {
    const out = new Set<string>();
    for (const [sid, o] of this.room.pdata) if (o.auto && o.auto !== this && o.auto.target && !this.ally(sid)) out.add(o.auto.target);
    return out;
  }
  /**
   * Còn giữ mục tiêu này: còn sống, hồn thú thường, không đang về chỗ sinh, trong vùng neo khi chỉ quanh chỗ đứng (hoặc đang đánh mình),
   * không bị giành. Tinh anh / thú vương / boss thế giới (#218): công tắc còn bật, mình còn nhận được thưởng, trong vùng neo khi chỉ quanh
   * chỗ đứng (hoặc đang đánh mình); không xét giành (mục tiêu chung).
   */
  keep(bid: string, p: PlayerState, d: PData) {
    const b = this.room.state.beasts.get(bid), bd = this.room.bdata.get(bid);
    if (!b || !bd || b.hp <= 0 || this.skip.has(bid)) return false;
    if (bd.hitBy === this.id || bd.elite?.dmgBy.has(this.id)) this.hit = true; // boss nhiều người đánh: đã có đóng góp là đã đánh trúng
    if (b.rank) return this.bossOn(b) && this.room.autoBossOk(d, b) && (this.wide || bd.target === this.id || this.nearAnchor(b));
    if (bd.ret > 0) return false;
    // Tổ đội cùng treo (AH4): đồng đội vừa bật tự săn mà con này (chưa đánh trúng, không đánh mình) ngoài AUTO_PARTY.leash quanh họ thì bỏ.
    if (!this.hit && bd.target !== this.id) { const ms = this.mates(); if (ms.length && !ms.some((m) => Math.hypot(b.x - m.p.x, b.y - m.p.y) <= AUTO_PARTY.leash)) return false; }
    if (bd.target === this.id) return Math.hypot(b.x - p.x, b.y - p.y) < this.R * 2;
    if (!this.wide && Math.hypot(b.x - this.anchor.x, b.y - this.anchor.y) > this.R + 2 * TILE) return false;
    return !(this.taken(bid) && !(this.hit && bd.hitBy === this.id));
  }
  /** Hồn thú thường đang đánh mình ở sát (trong AUTO_TARGET.retaliate; gần nhất). */
  attacker(p: PlayerState) {
    let best: string | null = null, bd2 = AUTO_TARGET.retaliate;
    for (const [bid, b] of this.room.beastsNear(p.x, p.y, AUTO_TARGET.retaliate + BEAST_HALF)) {
      const bd = this.room.bdata.get(bid);
      if (b.rank || b.hp <= 0 || bd?.target !== this.id || this.skip.has(bid)) continue;
      const dd = Math.hypot(b.x - p.x, b.y - p.y); if (dd < bd2) { bd2 = dd; best = bid; }
    }
    return best;
  }
  /** Công tắc của bậc hồn thú `b` trong cài đặt (#218): tinh anh, thú vương, boss thế giới. */
  bossOn(b: BeastState) { return this.cfg.bossMode !== "off" && (b.rank === 1 ? this.cfg.elite : b.rank === 2 ? this.cfg.king : b.rank === 3 && this.cfg.world); }
  /** Trong vùng neo (phạm vi "Chỉ quanh chỗ đứng"), có lề 2 ô. */
  nearAnchor(b: { x: number; y: number }) { return Math.hypot(b.x - this.anchor.x, b.y - this.anchor.y) <= this.R + 2 * TILE; }
  /**
   * Độ dài đường đi ước lượng (pixel) từ `p` tới `b` (#608): khoảng cách thẳng nếu đi thẳng được (clearLine, trong khung A*), không thì
   * nhân AUTO_TARGET.detour. Không chạy A* cho từng ứng viên (xét nhiều con mỗi lần chọn).
   */
  walk(p: Pt, b: Pt) {
    const dd = Math.hypot(b.x - p.x, b.y - p.y);
    const near = Math.max(Math.abs(b.x - p.x), Math.abs(b.y - p.y)) < AUTO_MOVE.path.maxTiles * TILE;
    if (!near) return dd * AUTO_TARGET.detour;
    this.lines++;
    return clearLine(navOf(this.room.map).grid, p, b) ? dd : dd * AUTO_TARGET.detour;
  }
  /**
   * Quanh mình không còn hồn thú thường hợp lệ (đang nhắm một con thường thì chắc chắn còn); kết quả giữ AUTO_TARGET.free giây để
   * findBoss (mỗi nhịp khi chưa có mục tiêu) không quét lại hồn thú quanh mình AUTO_HZ lần mỗi giây.
   */
  hasNear(p: PlayerState) {
    if (this.target && !this.boss) return false;
    if (this.freeAt === null || this.clock - this.freeAt.t >= AUTO_TARGET.free) this.freeAt = { t: this.clock, v: this.findTarget(p, true) === null };
    return this.freeAt.v;
  }
  /**
   * Tinh anh / thú vương / boss thế giới đang có trên bản đồ (#218): công tắc bật (bossMode khác "off"), mình còn nhận được thưởng
   * (MapRoom.autoBossOk), chỗ sinh đi bộ tới được (cùng vùng liên thông), trong vùng neo khi chỉ quanh chỗ đứng. "always": bậc cao
   * trước, cùng bậc thì gần nhất. "near" (#608): chỉ con có đường đi ≤ AUTO_BOSS_DETOUR, hoặc khi không có hồn thú thường nào (đang
   * nhắm hay chọn được trong AUTO_RADIUS quanh mình); xếp theo đường đi / hệ số AUTO_TARGET.value (thấp nhất trước).
   */
  findBoss(p: PlayerState, d: PData) {
    if (this.cfg.bossMode === "off") return null;
    const room = this.room, { nav } = navOf(room.map), me = navNode(nav, p.x, p.y), region = me >= 0 ? nav.region[me] : -1, always = this.cfg.bossMode === "always";
    let best: string | null = null, key = -Infinity, free: boolean | null = null;
    for (const [bid, b] of room.autoBosses()) {
      const bd = room.bdata.get(bid);
      if (!bd || !this.bossOn(b) || this.skip.has(bid) || (!this.wide && !this.nearAnchor(b)) || !room.autoBossOk(d, b)) continue;
      const n = navNode(nav, bd.hx, bd.hy); if (n < 0 || nav.region[n] !== region) continue;
      if (always) { const k = b.rank * 1e7 - Math.hypot(b.x - p.x, b.y - p.y); if (k > key) { key = k; best = bid; } continue; }
      const len = this.walk(p, b);
      if (len > AUTO_BOSS_DETOUR) {
        free ??= this.hasNear(p);
        if (!free) continue;
      }
      const k = -len / AUTO_TARGET.value[b.rank - 1];
      if (k > key) { key = k; best = bid; }
    }
    return best;
  }
  /**
   * Mục tiêu mới (#608): hồn thú thường đúng khoảng niên hạn, chưa ai giành (kể cả người treo khác đang nhắm), chi phí thấp nhất:
   * (đường đi / tốc độ) + giây ước lượng hạ (offlineFight với chỉ số võ hồn ra trận; không đánh nổi thì cộng AUTO_TARGET.tough). Chỉ
   * quanh chỗ đứng: trong vùng neo. Săn khắp bản đồ: trong R quanh mình trước (lưới không gian), không có thì quét mọi hồn thú của
   * kênh, chỉ lấy con đi bộ tới được (cùng vùng liên thông của đồ thị dẫn đường). `nearOnly`: chỉ xét trong R quanh tâm săn.
   */
  findTarget(p: PlayerState, nearOnly = false) {
    const [y0, y1] = this.cfg.years, R = this.R, c = this.center(), claimed = this.claimed(), d = this.room.pdata.get(this.id);
    const pw = d ? this.room.offlinePower(d, p) : null, spd = Math.max(1, p.spd), gain = 1 + AUTO_CLUSTER.bonus * AUTO_CLUSTER.max;
    // Tổ đội cùng treo (AH4): chỉ con trong AUTO_PARTY.leash quanh đồng đội gần nhất; con đồng đội đang nhắm rẻ đi (cùng hạ một con).
    const mates = this.mates(), focus = new Set(mates.map((m) => m.a.target).filter((t): t is string => !!t));
    let best: string | null = null, bcost = Infinity;
    const consider = (bid: string, b: BeastState, r: number) => {
      if (b.rank || b.hp <= 0 || b.years < y0 || b.years > y1 || this.skip.has(bid) || claimed.has(bid)) return;
      if (mates.length && !mates.some((m) => Math.hypot(b.x - m.p.x, b.y - m.p.y) <= AUTO_PARTY.leash)) return;
      const dd = Math.hypot(b.x - p.x, b.y - p.y);
      const k = focus.has(bid) ? AUTO_PARTY.focus : 1;
      if (dd / spd * k / gain >= bcost || Math.hypot(b.x - c.x, b.y - c.y) > r) return;
      const bd = this.room.bdata.get(bid); if (!bd || bd.ret > 0 || this.taken(bid)) return;
      const f = pw ? offlineFight(pw, b.years, BEASTS[b.species]?.id ?? "") : null, fight = f ? f.secs + (f.ok ? 0 : AUTO_TARGET.tough) : 0;
      // Chi phí ≥ (đi thẳng + đánh) × (hệ số đồng đội) / hệ số cụm tối đa: chưa thắng được con tốt nhất hiện có thì không tốn clearLine của walk() / đếm cụm.
      if ((dd / spd + fight) * k / gain >= bcost) return;
      const cost = (this.walk(p, b) / spd + fight) * k / (1 + AUTO_CLUSTER.bonus * this.crowd(bid, b, claimed));
      if (cost < bcost) { bcost = cost; best = bid; }
    };
    for (const [bid, b] of this.room.beastsNear(c.x, c.y, R)) consider(bid, b, R);
    if (best || !this.wide || nearOnly) return best;
    const { nav } = navOf(this.room.map), me = navNode(nav, p.x, p.y), region = me >= 0 ? nav.region[me] : -1;
    this.room.state.beasts.forEach((b, bid) => {
      if (Math.hypot(b.x - p.x, b.y - p.y) / spd * (focus.size ? AUTO_PARTY.focus : 1) / gain >= bcost) return;
      const n = navNode(nav, b.x, b.y); if (n < 0 || nav.region[n] !== region) return;
      consider(bid, b, Infinity);
    });
    return best;
  }

  /** Số hồn thú thường hợp lệ khác (đúng niên hạn, chưa ai giành) trong AUTO_CLUSTER.r quanh `b`, tối đa AUTO_CLUSTER.max (B1, #610). */
  crowd(bid: string, b: BeastState, claimed: Set<string>) {
    const [y0, y1] = this.cfg.years; let n = 0;
    for (const [oid, o] of this.room.beastsNear(b.x, b.y, AUTO_CLUSTER.r + BEAST_HALF)) {
      if (oid === bid || o.rank || o.hp <= 0 || o.years < y0 || o.years > y1 || this.skip.has(oid) || claimed.has(oid)) continue;
      if (Math.hypot(o.x - b.x, o.y - b.y) > AUTO_CLUSTER.r || this.taken(oid)) continue;
      if (++n >= AUTO_CLUSTER.max) break;
    }
    return n;
  }

  // ---------- Nhặt ----------
  /** Đồ rơi qua bộ lọc cài đặt: hồn hoàn từ `ring` năm, hồn cốt, hồn hạch từ `coreStar` sao, vật phẩm khác theo loại (`kinds`). */
  wanted(dr: DropState) {
    if (dr.item === "") return this.cfg.ring >= 0 && dr.years >= this.cfg.ring;
    if (dr.item === BONE_ITEM) return this.cfg.bone;
    if (dr.item === CORE_ITEM) return this.cfg.core && dr.stars >= this.cfg.coreStar;
    const kind = itemDef(dr.item)?.kind;
    return !!kind && this.cfg.kinds.includes(kind);
  }
  /** Món đang nằm đó còn nhặt được: hợp bộ lọc, quyền nhặt, chưa bỏ qua, trong vùng nhặt (AUTO_LOOT_RADIUS quanh mình; chỉ quanh chỗ đứng: trong vùng neo). */
  lootable(did: string) {
    const dr = this.room.state.drops.get(did);
    const c = this.center();
    return !!dr && !this.skip.has(did) && this.wanted(dr) && this.room.canLoot(dr, this.id)
      && Math.hypot(dr.x - c.x, dr.y - c.y) <= (this.wide ? AUTO_LOOT_RADIUS : this.R) + 2 * TILE;
  }
  /** Món hợp bộ lọc trong AUTO_LOOT_RADIUS quanh mình, gần nhất trước (nhặt xong lại tìm từ chỗ mới: chuỗi gần nhất); bỏ món trong vùng báo trước / vùng độc (#608). */
  findLoot(p: PlayerState) {
    let best: string | null = null, bdist = Infinity;
    for (const did of this.room.interest.drops.near(p.x, p.y, AUTO_LOOT_RADIUS)) {
      if (!this.lootable(did)) continue;
      const dr = this.room.state.drops.get(did)!, dd = Math.hypot(dr.x - p.x, dr.y - p.y);
      if (dd < bdist && !this.inDanger(dr.x, dr.y)) { bdist = dd; best = did; }
    }
    return best;
  }

  // ---------- Đan, tiên cơ, hồn kỹ ----------
  /** Uống đan khi sinh lực / hồn lực dưới ngưỡng (qua useItem: hồi chiêu chung DAN_CD, đầy thì không uống). "stop" nếu hết đan cần dừng. */
  potions(p: PlayerState, d: PData): "stop" | void {
    if (this.resting && p.hp >= p.maxHp * AUTO_REST.resume) { this.resting = false; this.go(null); } // nghỉ đủ: săn tiếp (B3, #610)
    if (d.danCd > 0) return;
    const pot = (list: ItemDef[]) => { for (const def of list) { const it = d.bag.find((i) => i.code === def.id && i.vohonId === null); if (it) return it; } return null; };
    if (this.cfg.hp > 0 && d.hpF < p.maxHp * this.cfg.hp) {
      const it = pot(HP_POTS);
      if (it) return void this.room.useItem(this.id, it.id);
      if (this.cfg.stopNoPot) { this.room.autoStop(this.id, "hết đan hồi sinh lực."); return "stop"; }
      if (this.cfg.restNoPot && !this.resting) { this.resting = true; this.patrol = null; this.go(null); } // hết đan: đứng nghỉ tới AUTO_REST.resume
    }
    if (this.cfg.mp > 0 && d.mpF < p.maxMp * this.cfg.mp) { const it = pot(MP_POTS); if (it) this.room.useItem(this.id, it.id); }
  }

  /**
   * Đổi tay tung tiên cơ (cài đặt `tienCo`): đang đánh mà võ hồn khác trong đội (chưa gục) đầy năng lượng thì đổi vào (switchSlot tự
   * tung), xét các ô theo thứ tự ưu tiên `slots`; hết hồi chiêu đổi thì về võ hồn chính (cả khi vừa đổi vì cơ chế boss, `mechanic`). Trả
   * về true nếu vừa đổi.
   */
  tienCo(p: PlayerState, d: PData, c: Client) {
    if (p.swCd > 0) return false;
    if (this.home !== null && (!d.team.includes(this.home) || d.down.has(this.home))) this.home = null;
    if (this.target && this.cfg.tienCo) {
      for (const s of this.cfg.slots) {
        const r = d.team[s];
        if (!r || r === d.ch.rowId || d.down.has(r) || (d.energy.get(r) ?? 0) < TIEN_CO_MAX) continue;
        const from = d.ch.rowId;
        this.room.switchSlot(c, s);
        if (d.ch.rowId === r) { this.home ??= from; if (this.home === r) this.home = null; return true; }
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
   * người chơi bấm U / I / O / P. #218: hồn kỹ hợp việc đang cần lên trước (giữ thứ tự cài đặt trong mỗi nhóm): thanh tẩy khi cơ chế cần
   * Phụ trợ (`need`), khống chế khi mục tiêu đang báo trước (Choáng / Câm lặng / Mê hoặc ngắt chiêu; tích lực của boss thế giới tính mọi
   * khống chế của võ hồn Khống chế).
   */
  skill(p: PlayerState, d: PData, c: Client, b: BeastState, need: He | null = null) {
    const room = this.room;
    if (room.pctl(d).noSkill) return;
    const dist = Math.hypot(b.x - p.x, b.y - p.y) - TIERS[b.tier].size / 2, cast = this.target ? room.bdata.get(this.target)?.cast : null;
    const cleanse = need === "phu_tro", cc = (sk: SkillDef) => [...(sk.status ?? []), ...(sk.finisher ?? [])]
      .some((a) => (cast?.charge ? isCcStatus(a.s) : STATUS[a.s].noAtk || STATUS[a.s].noSkill));
    const want = (i: number) => { const sk = this.skillAt(p, d, i)?.sk; return !!sk && (cleanse ? !!sk.self?.cleanse : !!cast && cc(sk)); };
    // Không có việc cần (thanh tẩy / ngắt chiêu): hồn kỹ diện rộng có từ AUTO_AOE_MIN hồn thú thường trong vùng thì lên trước (B1, #610).
    const hot = cleanse || cast || this.boss ? [] : this.cfg.skills.filter((i) => { const sk = this.skillAt(p, d, i)?.sk; return !!sk && AOE_AREAS.includes(sk.area) && sk.dmg > 0 && this.inArea(p, sk.r) >= AUTO_AOE_MIN; });
    const order = cleanse || cast ? [...this.cfg.skills.filter(want), ...this.cfg.skills.filter((i) => !want(i))]
      : hot.length ? [...hot, ...this.cfg.skills.filter((i) => !hot.includes(i))] : this.cfg.skills;
    for (const i of order) {
      const at = this.skillAt(p, d, i); if (!at) continue;
      if (at.ct ? p.ctCd > 0 : p.cds[i] > 0) continue;
      let run = at.sk;
      if (run.copy) { const src = room.copySource(this.id); if (!src) continue; run = src.sk; }
      const cost = at.sk.cost * (1 - Math.min(0.9, room.buffV(d, "mp")));
      if (d.mpF < cost || d.mpF - cost < p.maxMp * this.cfg.mpKeep) continue;
      const reach = run.area === "target" ? run.r : run.at ?? (run.area === "self" ? BEAST_AGGRO_R : run.r);
      if (dist > reach && !(cleanse && run.self?.cleanse)) continue; // thanh tẩy thì tung cả khi đang lùi xa boss
      if (run.area === "target" || run.at) { const near = room.nearestBeast(p, reach); if (!near || (near !== this.target && !this.boss && this.taken(near))) continue; }
      // Hồn kỹ diện rộng (quanh thân, trước mặt, lướt, bắn mũi) không tung khi vùng của nó có hồn thú người khác đang giao chiến.
      else if (run.area !== "self" && !this.fighting() && this.splash(p.x, p.y - 6, run.r)) continue;
      if (hot.includes(i)) this.aoeCasts++;
      room.skill(c, i);
      return;
    }
  }

  /** Số hồn thú thường sống trong `r` pixel quanh thân (kể cả mục tiêu; bỏ con người khác đang giao chiến). */
  inArea(p: PlayerState, r: number) {
    let n = 0;
    for (const [bid, b] of this.room.beastsNear(p.x, p.y - 6, r + BEAST_HALF)) {
      const s = TIERS[b.tier].size;
      if (!b.rank && b.hp > 0 && Math.hypot(b.x - p.x, b.y - s / 2 - (p.y - 6)) < r + s / 2 && (bid === this.target || !this.taken(bid))) n++;
    }
    return n;
  }

  // ---------- Trận boss (#218) ----------
  /**
   * Cơ chế boss buộc đổi võ hồn (mục 5.4): boss thế giới đang tích lực → võ hồn Khống chế (chỉ khống chế của hệ này tính lần ngắt); trên
   * mình có trạng thái xấu còn lâu (Vết thương sâu) → võ hồn Phụ trợ có hồn kỹ thanh tẩy sẵn sàng; Bá Thể → hệ phá khiên nhanh; điểm yếu
   * hệ đang hiện → đúng hệ. Đội có võ hồn đúng hệ (chưa gục) thì đổi vào bằng switchSlot như người chơi bấm số, nhớ võ hồn chính để
   * tienCo đổi về khi hết việc. Trả về hệ đang cần (võ hồn đúng hệ đang ra trận), "swap" nếu vừa đổi, null nếu không cần / không có
   * võ hồn hợp / đã giữ quá AUTO_BOSS.hold giây cho cùng cơ chế.
   */
  mechanic(p: PlayerState, d: PData, c: Client, b: BeastState, dt: number): He | "swap" | null {
    const bd = this.room.bdata.get(this.target!), k = bd?.elite?.king, w = k?.world, armor = k?.def.world?.armor;
    const he: He | null = w && bd?.cast?.charge ? "khong_che" : this.cleanseRow(d) !== null ? "phu_tro"
      : armor && b.shield > 0 ? armor.he : w?.weak ?? null;
    if (!he) { this.role = null; return null; }
    if (this.role?.he !== he) this.role = { he, t: 0 };
    if ((this.role.t += dt) > AUTO_BOSS.hold) return null;
    if (VOHON[p.vh]?.he === he && (he !== "phu_tro" || this.cleanseRow(d) === d.ch.rowId)) return he;
    if (p.swCd > 0) return null;
    const row = he === "phu_tro" ? this.cleanseRow(d) : d.team.find((r) => r && r !== d.ch.rowId && !d.down.has(r)
      && VOHON[vohonIndex(d.owned.find((v) => v.rowId === r)?.vohon ?? "")]?.he === he);
    if (!row) return null;
    const from = d.ch.rowId;
    this.room.switchSlot(c, d.team.indexOf(row));
    if (d.ch.rowId !== row) return null;
    this.home ??= from; if (this.home === row) this.home = null;
    return "swap";
  }
  /**
   * Võ hồn Phụ trợ trong đội (chưa gục) có hồn kỹ thanh tẩy trong ô được phép tung (`skills`), đã mở vòng và hết hồi chiêu, khi trên mình
   * có trạng thái xấu còn từ AUTO_BOSS.cleanse giây (Vết thương sâu) hoặc từ AUTO_BOSS.chill tầng Hàn (Cực Hàn, không tự hết); ưu tiên võ
   * hồn đang ra trận. Không cần / không có thì null.
   */
  cleanseRow(d: PData): number | null {
    if (![...d.st].some(([s, x]) => (s === "chill" ? x.n >= AUTO_BOSS.chill : x.t >= AUTO_BOSS.cleanse))) return null;
    for (const row of [d.ch.rowId, ...d.team]) {
      const v = d.owned.find((o) => o.rowId === row);
      if (!v || d.down.has(row) || VOHON[vohonIndex(v.vohon)]?.he !== "phu_tro") continue;
      const lo = loadoutOf(v.vohon, v.skills);
      if (this.cfg.skills.some((i) => { const r = lo[i]; return r >= 0 && r < v.rings.length && !!ringSkill(v.vohon, r)?.self?.cleanse && !((d.skCd.get(`${row}:${r}`) ?? 0) > 0); }))
        return row;
    }
    return null;
  }
  /**
   * Cực Hàn (#163): từ AUTO_BOSS.chill tầng Hàn mà không có thanh tẩy sẵn sàng (cleanseRow) thì tới đứng cạnh Hỏa Đàn cho tới khi hết tầng
   * rồi quay lại đánh. Ít máu khi đánh boss: sinh lực võ hồn ra trận dưới AUTO_BOSS.retreat thì lùi ra cách boss ít nhất AUTO_BOSS.dist
   * (đan uống theo ngưỡng cài đặt như thường, potions), từ AUTO_BOSS.back thì quay lại đánh.
   */
  hurt(p: PlayerState, d: PData, b: BeastState) {
    const cold = this.room.cold.active()?.cold, fire = cold ? this.room.map.hoaDan : null, chill = d.st.get("chill")?.n ?? 0;
    const was = this.warm;
    this.warm = !!fire && chill > 0 && (this.warm || chill >= AUTO_BOSS.chill) && this.cleanseRow(d) === null;
    if (this.warm && fire && cold) { this.go(Math.hypot(p.x - fire.x, p.y - fire.y) <= cold.fire.r * 0.6 ? null : fire); return; }
    if (was) this.go(null);
    const r = p.hp / Math.max(1, p.maxHp);
    if (!this.away && r < AUTO_BOSS.retreat) this.away = true;
    else if (this.away && r >= AUTO_BOSS.back) { this.away = false; this.go(null); }
    if (!this.away) return;
    // Không có chỗ đi thẳng tới được (trong hang hẹp) thì chỗ cùng vùng liên thông, đi theo đường A*.
    const ok = (x: number, y: number) => Math.hypot(x - b.x, y - b.y) >= AUTO_BOSS.dist && !this.inDanger(x, y);
    this.go(Math.hypot(p.x - b.x, p.y - b.y) >= AUTO_BOSS.dist ? null : this.spot(p, ok) ?? this.spot(p, ok, [], false));
  }
  /**
   * Điểm (x, y) sẽ trúng một chiêu đang báo trước (trừ khi đứng trong vòng an toàn của chiêu toàn sàn, teleSafe) hoặc đang trong vùng
   * lưu lại trên đất (vũng / sương độc, ground.ts). Cùng cách tính trúng với server (teleHits).
   */
  inDanger(x: number, y: number) {
    if (this.room.casting.size) for (const c of this.room.activeCasts()) if (c.teles.some((t) => teleHits(t, x, y)) && !c.safe?.some((s) => teleSafe(s, x, y))) return true;
    return this.room.grounds.hits(x, y);
  }
  /**
   * Chỗ né được (#292): (x, y) và 8 điểm cách nó AUTO_BOSS.dodge.pad pixel đều ngoài nguy hiểm. move() dừng khi còn cách đích dưới 1 pixel;
   * chỗ chỉ vừa lọt mép vòng an toàn thì hồn sư có lúc đứng lại ngay ngoài mép, vẫn trúng mà escape() giữ chỗ đó (chỗ né vẫn "an toàn").
   */
  dodgeOk(x: number, y: number) {
    if (this.inDanger(x, y)) return false;
    const r = AUTO_BOSS.dodge.pad;
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; if (this.inDanger(x + Math.cos(a) * r, y + Math.sin(a) * r)) return false; }
    return true;
  }
  /**
   * Chỗ gần mình nhất thỏa `ok`, đứng được, ngoài vùng an toàn (vào là tự săn dừng), đi thẳng tới được: xét các điểm `extra` (tâm vòng
   * an toàn) rồi AUTO_BOSS.dodge.dirs hướng, mỗi `step` pixel tới `max` pixel. `straight` = false: cùng vùng liên thông của đồ thị dẫn
   * đường (đi theo A*), xa tới 2 lần `max`. Không có thì null.
   */
  spot(p: PlayerState, ok: (x: number, y: number) => boolean, extra: Pt[] = [], straight = true): Pt | null {
    const map = this.room.map, { grid, nav } = navOf(map), D = AUTO_BOSS.dodge, me = navNode(nav, p.x, p.y), region = me >= 0 ? nav.region[me] : -1;
    const reach = (x: number, y: number) => { if (straight) return clearLine(grid, p, { x, y }); const n = navNode(nav, x, y); return n >= 0 && nav.region[n] === region; };
    let best: Pt | null = null, bd = Infinity;
    const at = (x: number, y: number) => {
      const dd = Math.hypot(x - p.x, y - p.y);
      if (dd < bd && map.standable(x, y) && !map.inSafe(x, y) && ok(x, y) && reach(x, y)) { best = { x, y }; bd = dd; }
    };
    for (const e of extra) at(e.x, e.y);
    for (let r = D.step; r <= D.max * (straight ? 1 : 2) && r < bd; r += D.step)
      for (let k = 0; k < D.dirs; k++) { const a = (k / D.dirs) * Math.PI * 2; at(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); }
    return best;
  }
  /**
   * Né (mỗi nhịp, mọi lúc tự săn chứ không chỉ trận boss): đang đứng trong vùng báo trước / vùng độc thì trả chỗ né (giữ chỗ đã chọn khi
   * còn an toàn, tìm lại tối đa AUTO_HZ lần mỗi giây); không trong vùng thì null.
   */
  escape(p: PlayerState, dt: number): Pt | null {
    if (!this.inDanger(p.x, p.y)) { this.dodge = null; return null; }
    if (this.dodge && this.dodgeOk(this.dodge.x, this.dodge.y)) return this.dodge;
    if ((this.dodgeT -= dt) > 0) return this.dodge;
    this.dodgeT = 1 / AUTO_HZ;
    const safe: Pt[] = [];
    for (const c of this.room.activeCasts()) for (const s of c.safe ?? []) safe.push(s);
    this.dodge = this.spot(p, (x, y) => this.dodgeOk(x, y), safe);
    if (this.dodge) this.dodges++;
    return this.dodge;
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
    const room = this.room, map = navOf(room.map).grid;
    this.way = null;
    // #218: đang đứng trong vùng báo trước / vùng độc thì đi thẳng tới chỗ né trước mọi việc khác.
    const esc = this.escape(p, dt);
    if (esc) return this.move(p, d, esc, dt, true);
    // Đang lùi vì ít máu / tới Hỏa Đàn: đi theo đích đã đặt (hurt). Boss thế giới đang lặn (Du Thủy): tới chỗ nổi lên đã báo trước, không
    // thì đứng chờ.
    const t = this.target && !this.away && !this.warm ? room.state.beasts.get(this.target) : undefined, b = t && !t.dive ? t : undefined;
    if (t?.dive) this.go(room.bdata.get(this.target!)?.elite?.king?.world?.surf ?? null);
    let to: Pt | null = null;
    if (b) {
      if (this.inReach(p, d, b)) return room.applyInput(d, 0, 0, false);
      // Không vướng thì đi thẳng tới hồn thú (đứng sát mà lệch hướng thì bước này quay mặt, như người chơi nhích phím). Hồn thú ở xa
      // (ngoài khung A*, săn khắp bản đồ) thì đi theo đường dài, không thử đường thẳng mỗi nhịp.
      const l = this.los, near = Math.max(Math.abs(b.x - p.x), Math.abs(b.y - p.y)) < AUTO_MOVE.path.maxTiles * TILE;
      if (!near) { l.ok = false; l.px = NaN; }
      // So kiểu !(… <= 6): toạ độ NaN (chưa tính) cũng tính lại; `> 6` với NaN luôn sai nên trước #291 không bao giờ đi thẳng.
      else if (!(Math.hypot(l.px - p.x, l.py - p.y) <= 6 && Math.hypot(l.bx - b.x, l.by - b.y) <= 6)) {
        this.lines++; Object.assign(l, { px: p.x, py: p.y, bx: b.x, by: b.y, ok: clearLine(map, p, b) });
      }
      this.way = l.ok ? "line" : "path";
      if (l.ok) { this.path = []; this.goal = null; this.pathT = AUTO_MOVE.repath; to = { x: b.x, y: b.y }; } // pathT đầy: chuyển sang A* thì tìm đường ngay, không khựng
      else {
        this.pathT += dt;
        // Đích đổi khi mục tiêu dời quá 2 ô, hoặc khi đã đi hết đường tới đích cũ mà mục tiêu chưa trong tầm (nó dời ít hơn 2 ô, #325).
        if (!this.goal || Math.hypot(this.goal.x - b.x, this.goal.y - b.y) > 2 * TILE
          || (!this.path.length && Math.hypot(this.goal.x - p.x, this.goal.y - p.y) < 2 * TILE)) { this.goal = { x: b.x, y: b.y }; this.path = []; }
        if (!this.path.length && this.pathT >= AUTO_MOVE.repath) this.plan(p);
        to = this.path[0] ?? null;
      }
    } else if (this.goal) {
      this.way = "path"; this.pathT += dt;
      if (!this.path.length && this.pathT >= AUTO_MOVE.repath) this.plan(p);
      to = this.path[0] ?? null;
    }
    while (to && this.path.length && Math.hypot(to.x - p.x, to.y - p.y) < Math.max(3, p.spd * dt)) { this.path.shift(); to = this.path[0] ?? null; }
    // Mục tiêu sát bên (trong 2 ô) mà chưa trong tầm và không còn bước nào (điểm cuối của đường chỉ còn trong một bước nên đã bỏ, hoặc
    // đang chờ tìm lại đường): đi thẳng tới (bước này quay mặt), không đứng yên ngoài tầm mãi; vướng thật thì checkStuck bỏ (#325).
    if (!to && b && Math.hypot(b.x - p.x, b.y - p.y) < 2 * TILE) to = { x: b.x, y: b.y };
    if (!to) return room.applyInput(d, 0, 0, false);
    this.move(p, d, to, dt, !b && this.path.length <= 1, true);
  }

  /**
   * Đặt hướng đi tới `to` (applyInput). `last`: đích cuối, đẩy cần nhẹ để không bước qua (server nhân tốc độ theo độ dài hướng đi), nhưng
   * không dưới ngưỡng MOVE_DEAD. `wary` (#218): bước kế tiếp vào vùng báo trước / vùng độc thì đứng chờ (lúc né thì không xét).
   */
  move(p: PlayerState, d: PData, to: Pt, dt: number, last: boolean, wary = false) {
    const room = this.room, dx = to.x - p.x, dy = to.y - p.y, dd = Math.hypot(dx, dy);
    if (dd < 1) return room.applyInput(d, 0, 0, false);
    const k = last ? Math.max(MOVE_DEAD * 1.5, Math.min(1, dd / Math.max(1, 2 * p.spd * dt))) : 1;
    // Xét cả điểm nhìn trước lẫn đúng chỗ đứng sau bước này (k × tốc độ × dt, như bước di chuyển của phòng): đi xiên sát mép vùng tròn
    // thì điểm nhìn trước ở ngoài mà bước kế tiếp đã lấn vào dây cung (#328).
    const look = Math.max(10, p.spd * 0.3), step = Math.min(dd, k * p.spd * dt);
    if (wary && (this.inDanger(p.x + (dx / dd) * look, p.y + (dy / dd) * look) || this.inDanger(p.x + (dx / dd) * step, p.y + (dy / dd) * step)))
      return room.applyInput(d, 0, 0, false);
    room.applyInput(d, (k * dx) / dd, (k * dy) / dd, false);
  }

  /**
   * Tìm đường A* (shared/path.ts) tới `goal`: trong khung AUTO_MOVE.path thì A* thường, xa hơn thì đường dài theo điểm trung gian của
   * đồ thị dẫn đường (#213). Không tới gần được thì bỏ qua mục tiêu / đồ rơi đó một lúc.
   */
  plan(p: PlayerState) {
    this.pathT = 0; this.plans++;
    if (!this.goal) return;
    const { grid, nav } = navOf(this.room.map), M = AUTO_MOVE.path;
    const far = Math.max(Math.abs(this.goal.x - p.x), Math.abs(this.goal.y - p.y)) > (M.maxTiles - 2) * TILE;
    const t0 = this.room.perfOn ? performance.now() : 0;
    this.path = far ? findLongPath(grid, nav, p, this.goal, AUTO_MOVE.nav.look, M) : findPath(grid, p, this.goal, M);
    if (t0) this.room.perfPlan.push([this.id, performance.now() - t0, `${far ? "dài" : "thường"} ${this.path.length} điểm`]);
    // Đích cùng ô với mình mà đường thẳng vướng (ví dụ hồn thú đứng sau lưng, sát ô chặn): A* không có ô nào để đi nên trả đường rỗng,
    // không phải không tới được; đi thẳng tới (bước này quay mặt), vướng thật thì checkStuck bỏ sau AUTO_MOVE.stuck giây (#324).
    if (!this.path.length && Math.floor(p.x / TILE) === Math.floor(this.goal.x / TILE) && Math.floor(p.y / TILE) === Math.floor(this.goal.y / TILE))
      this.path = [{ x: this.goal.x, y: this.goal.y }];
    // Không tới gần được; hoặc không còn bước nào mà chưa tới đích (đích sát ô chặn / vùng an toàn: đã đứng ở ô tới được gần nhất, ví dụ
    // đồ rơi ngoài tầm nhặt), không thì đứng yên mãi mà không tính là kẹt.
    const end = this.path.at(-1) ?? p;
    if (Math.hypot(end.x - this.goal.x, end.y - this.goal.y) > 2 * TILE || (!this.path.length && Math.hypot(p.x - this.goal.x, p.y - this.goal.y) > 6)) this.unreachable();
  }

  /** Kẹt: định đi mà quá AUTO_MOVE.stuck giây không nhích thì bỏ việc đang làm (mục tiêu / đồ / điểm dạo). */
  checkStuck(p: PlayerState, d: PData, dt: number) {
    const moved = Math.hypot(p.x - this.last.x, p.y - this.last.y);
    this.last = { x: p.x, y: p.y };
    const trying = Math.hypot(d.input.x, d.input.y) > MOVE_DEAD && p.spd > 0;
    this.stuckT = trying && moved < 0.5 ? this.stuckT + dt : 0;
    if (this.stuckT >= AUTO_MOVE.stuck) { this.stuckT = 0; this.trail = []; this.unreachable("stuck"); return; }
    this.checkLoop(p, d, dt);
  }
  /**
   * Đi vòng lặp / đứng yên (AH4, #611): đang định di chuyển (chưa tới tầm đánh, không nghỉ chờ nợ nhịp / đồ rơi, không né / lùi) mà trong
   * AUTO_STUCK.window giây các điểm đứng đều nằm trong AUTO_STUCK.radius thì đổi mục tiêu / đường (unreachable).
   */
  checkLoop(p: PlayerState, d: PData, dt: number) {
    const b = this.target ? this.room.state.beasts.get(this.target) : undefined;
    const moving = !this.away && !this.warm && !this.dodge && (b ? !this.inReach(p, d, b) : !!(this.loot || this.goal || this.patrol)) && !(!b && this.pace > 0) && !(!b && this.lootWait > 0);
    if (!moving) { this.trail = []; this.trailT = 0; return; }
    if ((this.trailT -= dt) > 0) return;
    this.trailT = AUTO_STUCK.sample;
    this.trail.push({ x: p.x, y: p.y });
    if (this.trail.length > Math.ceil(AUTO_STUCK.window / AUTO_STUCK.sample)) this.trail.shift();
    if (this.trail.length < Math.ceil(AUTO_STUCK.window / AUTO_STUCK.sample)) return;
    const r = AUTO_STUCK.radius;
    if (this.trail.every((q) => Math.hypot(q.x - p.x, q.y - p.y) <= r)) { this.trail = []; this.unreachable("loop"); }
  }
  unreachable(why: AutoWhy = "stuck") {
    this.why = { w: why, t: this.clock };
    // Đang lùi / tới Hỏa Đàn (#218): chỉ bỏ đích đó (nhịp quyết định sau chọn lại), không bỏ boss đang đánh.
    if (this.away || this.warm) { this.go(null); return; }
    const key = this.target ?? this.loot;
    if (key) this.skip.set(key, this.clock + AUTO_MOVE.skip);
    if (this.target) this.drop(); else this.loot = null;
    this.patrol = null; this.go(null);
  }

  /** Điểm dạo ngẫu nhiên đứng được trong bán kính R quanh tâm `c` (ngoài vùng an toàn); không tìm được thì đứng ở tâm. */
  patrolPoint(c: Pt): Pt {
    const map = this.room.map;
    for (let k = 0; k < 12; k++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * this.R * 0.85;
      const x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
      if (map.standable(x, y) && !map.inSafe(x, y)) return { x, y };
    }
    return { ...c };
  }
}
