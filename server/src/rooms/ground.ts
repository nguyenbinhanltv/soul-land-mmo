// Vùng lưu lại trên mặt đất (#161, GAME_DESIGN.md mục 5.3 "Luật chung của hồn thú"): vũng độc, sương độc do chiêu hồn thú có `ground`
// để lại; #173, #174 dùng lại. Số liệu (thời gian, nhịp, trạng thái) ở shared/data.ts (GroundDef); MapRoom chỉ gọi `add`, `tick`.
// Vùng đồng bộ xuống client qua MapState.grounds (schema.ts), lọc theo vùng gần ở interest.ts.
import { GROUND_KINDS, GROUND_MAX, GROUND_TICK, TELE_SHAPES, teleHits, type GroundDef, type Tele } from "../../../shared/data.ts";
import type { MapRoom } from "./MapRoom.ts";
import { GroundState } from "./schema.ts";

/** Một vùng đang có: hình (vùng báo trước đã khóa), luật, hồn thú gây ra, sát thương đòn thường của nó (Trúng độc tính theo số này). */
interface Ground { tele: Tele; def: GroundDef; src: string; base: number; t: number; next: number }

export class Grounds {
  private list = new Map<string, Ground>();
  private seq = 0;
  constructor(private room: MapRoom) {}

  /**
   * Hồn thú `src` (sát thương đòn thường `base`) tung xong chiêu có `def`: để lại một vùng cho mỗi vùng báo trước `teles`. Nhịp đầu chạy
   * ở `tick` kế tiếp (cùng nhịp với lúc tung, vì MapRoom gọi `tick` sau vòng hồn thú).
   */
  add(src: string, def: GroundDef, teles: Tele[], base: number) {
    const grounds = this.room.state.grounds;
    for (const tele of teles) {
      // Quá GROUND_MAX thì bỏ vùng cũ nhất (Map giữ thứ tự thêm vào).
      while (this.list.size >= GROUND_MAX) { const old = this.list.keys().next().value!; this.list.delete(old); grounds.delete(old); }
      const id = `g${++this.seq}`, g = new GroundState();
      g.kind = Math.max(0, GROUND_KINDS.findIndex((k) => k.id === def.kind)); g.shape = TELE_SHAPES.indexOf(tele.shape);
      g.x = tele.x; g.y = tele.y; g.ang = tele.ang; g.r = Math.round(tele.r); g.w = Math.round(tele.w); g.arc = Math.round(tele.arc);
      g.ttl = g.secs = def.secs;
      grounds.set(id, g);
      this.list.set(id, { tele, def, src, base, t: def.secs, next: 0 });
    }
  }

  /**
   * Mỗi nhịp: vùng hết giờ hoặc hồn thú gây ra không còn (bị hạ, rút đi, bị xóa) thì mất; tới nhịp thì gây trạng thái cho hồn sư đứng
   * trong vùng (ứng viên lấy từ lưới hồn sư của interest.ts). Người đã gục, đang đi cổng, trong vùng an toàn: applyPStatus không gây;
   * người đang miễn sát thương (Vô Địch Thần Quang) cũng không dính, như khi chiêu báo trước trúng (hurtPlayer trả false).
   * `ttl` đồng bộ theo bậc 0,25 giây (client chỉ dùng để mờ dần), không ghi mỗi nhịp.
   */
  tick(dt: number) {
    if (!this.list.size) return;
    const room = this.room, { grounds, players, beasts } = room.state;
    for (const [id, z] of this.list) {
      const g = grounds.get(id), b = beasts.get(z.src);
      z.t -= dt;
      if (!g || z.t <= 0 || !b || b.hp <= 0) { this.list.delete(id); grounds.delete(id); continue; }
      const ttl = Math.ceil(z.t * 4) / 4; if (g.ttl !== ttl) g.ttl = ttl;
      if ((z.next -= dt) > 0) continue;
      z.next += z.def.every ?? GROUND_TICK;
      // Vệt / nón tính từ gốc: tầm với là chiều dài cộng bề rộng (Grid.near đã cộng lề).
      for (const pid of room.interest.players.near(z.tele.x, z.tele.y, z.tele.r + z.tele.w)) {
        const p = players.get(pid), d = room.pdata.get(pid);
        if (!p || !d || room.buffV(d, "inv") || !teleHits(z.tele, p.x, p.y)) continue;
        for (const a of z.def.status) room.applyPStatus(pid, a, z.base);
      }
    }
  }

  /** Hook kiểm thử `ground {ttl}`: mọi vùng còn đúng `s` giây. */
  setTtl(s: number) {
    for (const [id, z] of this.list) { z.t = s; const g = this.room.state.grounds.get(id); if (g) { g.secs = Math.max(g.secs, s); g.ttl = s; } }
  }

  /** Các vùng đang có (hook kiểm thử `ground`). */
  info() {
    return [...this.list].map(([id, z]) => ({ id, kind: z.def.kind, src: z.src, x: z.tele.x, y: z.tele.y, r: z.tele.r, shape: z.tele.shape, ttl: z.t }));
  }
}
