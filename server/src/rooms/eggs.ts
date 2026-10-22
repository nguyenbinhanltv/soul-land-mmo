// Bọc trứng của chiêu có `eggs` (#162, Vạn Chu Phệ của Tà hóa Thiên Độc Chu Hoàng, mục 5.4). Số liệu ở EggDef (shared/data.ts);
// MapRoom gọi `lay` khi chiêu tung, `tick` mỗi nhịp, `broke` khi bọc bị phá (thay cho killBeast: không thưởng).
import { BOSSES, MAX_YEARS, TELE_FIRST, beastIndex, rollYears, type EggDef } from "../../../shared/data.ts";
import type { MapRoom } from "./MapRoom.ts";
import type { BeastState } from "./schema.ts";

/** Một bọc trứng: hồn thú đã đẻ ra nó, chiêu đã đẻ, số giây còn lại trước khi nở. */
interface Egg { mother: string; def: EggDef; t: number; }

/** Màu hiệu ứng đẻ / nở / vỡ: hào quang của thú vương đã đẻ (BOSSES.aura), không có thì trắng. */
const auraOf = (b: BeastState | undefined) => (b?.rank ? BOSSES[b.species]?.aura : undefined) ?? "#ffffff";

export class SpiderEggs {
  private eggs = new Map<string, Egg>();
  constructor(private room: MapRoom) {}

  has(bid: string) { return this.eggs.has(bid); }

  /** Bọc trứng còn nguyên do `mother` đẻ. */
  private of(mother: string) { return [...this.eggs].filter(([bid, e]) => e.mother === mother && this.room.state.beasts.has(bid)); }

  /**
   * Hồn thú `bid` tung chiêu có `eggs`: đẻ bọc trứng quanh thân tới khi có `def.n` bọc còn nguyên, không để nhện con còn sống do nó gọi
   * cộng số nhện sẽ nở vượt `def.n` × `def.per` (EggDef). Bọc đứng trong hang (thú vương) hoặc chỗ đứng được, ngoài vùng an toàn.
   */
  lay(bid: string, b: BeastState, def: EggDef) {
    const r = this.room, bd = r.bdata.get(bid), sp = beastIndex(def.species); if (!bd || sp < 0) return 0;
    for (const m of bd.minions) if (!r.state.beasts.has(m)) bd.minions.delete(m);
    const have = this.of(bid).length, room = Math.floor((def.n * def.per - bd.minions.size - have * def.per) / def.per);
    const want = Math.min(def.n - have, room), lair = r.map.lair, a0 = Math.random() * Math.PI * 2;
    let laid = 0;
    for (let tries = 0; laid < want && tries < 24; tries++) {
      // Rải đều quanh thân (lệch dần theo số lần thử khi vướng), cách thân đủ xa để sprite thú vương (KING.scale) không che bọc.
      const a = a0 + ((laid + tries * 0.37) / Math.max(1, want)) * Math.PI * 2, d = 56 + (tries % 3) * 10;
      const x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d * 0.7;
      if (r.map.hits(x, y, 6, 4) || r.map.inSafe(x, y) || (lair && b.rank >= 2 && !r.map.inLair(x, y))) continue;
      const years = Math.min(MAX_YEARS - 1, rollYears(def.years[0], def.years[1], Math.random()));
      const eid = r.addBeast(bd.zone, years, sp, x, y), e = r.state.beasts.get(eid)!, ed = r.bdata.get(eid)!;
      e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp * def.hp));
      ed.rooted = true; ed.skills = []; ed.reach = 0; // đứng yên, không đánh, không tung chiêu, không bị đẩy / kéo
      e.egg = Math.min(255, Math.ceil(def.secs * 10)); // uint8: tối đa 25,5 giây
      this.eggs.set(eid, { mother: bid, def, t: def.secs });
      r.broadcast("fx", { k: "egg", s: "lay", x, y, x0: b.x, y0: b.y, col: auraOf(b) });
      laid++;
    }
    return laid;
  }

  /**
   * Mỗi nhịp: đếm giờ nở (đồng bộ `BeastState.egg`, phần mười giây). Hết giờ thì nở `per` nhện con cùng số năm tại chỗ, lao vào mục tiêu
   * của hồn thú đã đẻ. Hồn thú đã đẻ không còn (bị hạ, rút đi, hook test xóa) thì bọc tan, không nở.
   */
  tick(dt: number) {
    const r = this.room;
    for (const [bid, e] of this.eggs) {
      const b = r.state.beasts.get(bid);
      if (!b) { this.eggs.delete(bid); continue; }
      const mb = r.state.beasts.get(e.mother);
      if (!mb) { this.remove(bid, b, "fade", "#ffffff"); continue; }
      e.t -= dt;
      if (e.t > 0) { const v = Math.min(255, Math.ceil(e.t * 10)); if (b.egg !== v) b.egg = v; continue; }
      this.hatch(bid, b, e, mb);
    }
  }

  private hatch(bid: string, b: BeastState, e: Egg, mb: BeastState) {
    const r = this.room, md = r.bdata.get(e.mother), zone = r.bdata.get(bid)?.zone ?? md?.zone ?? 0, sp = beastIndex(e.def.species);
    const { x, y, years } = b;
    this.remove(bid, b, "hatch", auraOf(mb));
    const tgt = md?.target && r.state.players.has(md.target) ? md.target : null;
    for (let i = 0; i < e.def.per; i++) {
      const a = (i / e.def.per) * Math.PI * 2 + Math.random(), sx = x + Math.cos(a) * 8, sy = y + Math.sin(a) * 6;
      const [hx, hy] = r.map.hits(sx, sy, 6, 4) ? [x, y] : [sx, sy];
      const mid = r.addBeast(zone, years, sp, hx, hy), nd = r.bdata.get(mid)!;
      if (tgt) { nd.target = tgt; r.state.beasts.get(mid)!.aggro = true; nd.skT = TELE_FIRST[1]; }
      md?.minions.add(mid);
    }
  }

  /** Bọc `bid` bị phá (sát thương đưa máu về 0, hook `slay`): không nở, không kinh nghiệm / Hồn Tệ / đồ rơi / đóng góp. */
  broke(bid: string, by: string) {
    const b = this.room.state.beasts.get(bid), e = this.eggs.get(bid); if (!b || !e) return;
    this.remove(bid, b, "break", auraOf(this.room.state.beasts.get(e.mother)));
    this.room.log(by, "Phá vỡ một bọc trứng: nhện con bên trong không nở.", "#9be23a");
  }

  private remove(bid: string, b: BeastState, s: "hatch" | "break" | "fade", col: string) {
    this.eggs.delete(bid); this.room.state.beasts.delete(bid); this.room.bdata.delete(bid);
    this.room.broadcast("fx", { k: "egg", s, x: b.x, y: b.y, col });
  }

  /** Hook test `egg`: mọi bọc còn nguyên (hồn thú đã đẻ, giây còn lại, máu); `t {s}` đặt mọi bọc còn đúng s giây. */
  info(t?: number) {
    if (t !== undefined) for (const e of this.eggs.values()) e.t = t;
    return [...this.eggs].flatMap(([bid, e]) => {
      const b = this.room.state.beasts.get(bid);
      return b ? [{ bid, mother: e.mother, t: e.t, x: b.x, y: b.y, years: b.years, hp: b.hp, maxHp: b.maxHp }] : [];
    });
  }
}
