// Vùng lưu lại trên mặt đất (#161, GAME_DESIGN.md mục 5.3 "Luật chung của hồn thú"): vũng độc, sương độc do chiêu hồn thú có `ground`
// để lại; #173, #174 dùng lại (#174: vùng ngập, xoáy nước của Thủy Triều Dâng, tide.ts; báo trước `warn`, kéo về tâm `pull`). Số liệu
// (thời gian, nhịp, trạng thái) ở shared/data.ts (GroundDef); MapRoom chỉ gọi `add`, `tick`.
// Vùng đồng bộ xuống client qua MapState.grounds (schema.ts), lọc theo vùng gần ở interest.ts.
import { GROUND_KINDS, GROUND_MAX, GROUND_TICK, TELE_SHAPES, teleHits, type GroundDef, type Tele } from "../../../shared/data.ts";
import type { MapRoom } from "./MapRoom.ts";
import { GroundState } from "./schema.ts";

/** Lề sai số khi đếm thời gian theo dt (giây). */
const EPS = 1e-6;
/**
 * Một vùng đang có: hình (vùng báo trước đã khóa), luật, hồn thú gây ra, sát thương đòn thường của nó (Trúng độc tính theo số này), giây
 * còn lại (gồm cả báo trước), giây báo trước còn lại (#174), giây tới nhịp gây trạng thái kế tiếp.
 */
interface Ground { tele: Tele; def: GroundDef; src: string; base: number; t: number; wait: number; next: number }

export class Grounds {
  private list = new Map<string, Ground>();
  private seq = 0;
  constructor(private room: MapRoom) {}

  /**
   * Hồn thú `src` (sát thương đòn thường `base`) tung xong chiêu có `def`: để lại một vùng cho mỗi vùng báo trước `teles`. Nhịp đầu chạy
   * ở `tick` kế tiếp (cùng nhịp với lúc tung, vì MapRoom gọi `tick` sau vòng hồn thú), hoặc lúc hết báo trước `def.warn` (#174). Trả id các vùng.
   */
  add(src: string, def: GroundDef, teles: Tele[], base: number) {
    const grounds = this.room.state.grounds, ids: string[] = [], warn = def.warn ?? 0;
    for (const tele of teles) {
      // Quá GROUND_MAX thì bỏ vùng cũ nhất (Map giữ thứ tự thêm vào).
      while (this.list.size >= GROUND_MAX) { const old = this.list.keys().next().value!; this.list.delete(old); grounds.delete(old); }
      const id = `g${++this.seq}`, g = new GroundState();
      g.kind = Math.max(0, GROUND_KINDS.findIndex((k) => k.id === def.kind)); g.shape = TELE_SHAPES.indexOf(tele.shape);
      g.x = tele.x; g.y = tele.y; g.ang = tele.ang; g.r = Math.round(tele.r); g.w = Math.round(tele.w); g.arc = Math.round(tele.arc);
      g.ttl = Math.ceil(warn + def.secs); g.wait = Math.ceil(warn);
      grounds.set(id, g);
      this.list.set(id, { tele, def, src, base, t: warn + def.secs, wait: warn, next: 0 });
      ids.push(id);
    }
    return ids;
  }

  /** Các vùng `ids` còn nhiều hơn `s` giây thì chỉ còn `s` giây (#174: nước đợt cũ rút khi đợt mới hết báo trước). */
  cut(ids: string[], s: number) {
    for (const id of ids) { const z = this.list.get(id); if (z && z.t > s) z.t = s; }
  }

  /**
   * Mỗi nhịp: vùng hết giờ hoặc hồn thú gây ra không còn (bị hạ, rút đi, bị xóa) thì mất; tới nhịp thì gây trạng thái cho hồn sư đứng
   * trong vùng (ứng viên lấy từ lưới hồn sư của interest.ts). Người đã gục, đang đi cổng, trong vùng an toàn: applyPStatus không gây;
   * người đang miễn sát thương (Vô Địch Thần Quang) cũng không dính, như khi chiêu báo trước trúng (hurtPlayer trả false). Khung
   * bất tử ngắn sau mỗi đòn (`d.inv`) không chặn, như sát thương theo thời gian của Trúng độc. Đang báo trước (`warn`, #174) thì chưa gây
   * gì; vùng có `pull` kéo hồn sư đứng trong vùng về tâm mỗi nhịp server (MapRoom.dragPlayer: không kéo người đã gục, đang đi cổng, không
   * kéo vào vùng an toàn), cùng điều kiện miễn sát thương như gây trạng thái.
   * `ttl` đồng bộ theo giây nguyên (một bản vá mỗi giây; client tự đếm giữa hai lần đổi để mờ dần). Hết giờ xét với lề EPS để số nhịp
   * gây trạng thái luôn là secs / every (không thêm một nhịp do sai số cộng dồn dt).
   */
  tick(dt: number) {
    if (!this.list.size) return;
    const room = this.room, { grounds, players, beasts } = room.state;
    for (const [id, z] of this.list) {
      const g = grounds.get(id), b = beasts.get(z.src);
      z.t -= dt;
      if (!g || z.t <= EPS || !b || b.hp <= 0) { this.list.delete(id); grounds.delete(id); continue; }
      const ttl = Math.ceil(z.t - EPS); if (g.ttl !== ttl) g.ttl = ttl;
      let step = dt; // phần nhịp vùng đã có tác dụng (nhịp hết báo trước: chỉ phần sau lúc hết báo trước)
      if (z.wait > 0) {
        z.wait -= dt; const w = Math.max(0, Math.ceil(z.wait - EPS)); if (g.wait !== w) g.wait = w;
        if (z.wait > EPS) continue;
        step = Math.max(0, -z.wait); z.wait = 0;
      }
      const fire = (z.next -= step) <= 0, pull = z.def.pull ?? 0;
      if (fire) z.next += z.def.every ?? GROUND_TICK;
      if (!fire && !pull) continue;
      // Vệt / nón tính từ gốc: tầm với là chiều dài cộng bề rộng (Grid.near đã cộng lề).
      for (const pid of room.interest.players.near(z.tele.x, z.tele.y, z.tele.r + z.tele.w)) {
        const p = players.get(pid), d = room.pdata.get(pid);
        if (!p || !d || room.buffV(d, "inv") || !teleHits(z.tele, p.x, p.y)) continue;
        if (fire) for (const a of z.def.status) room.applyPStatus(pid, a, z.base);
        if (pull) room.dragPlayer(pid, z.tele.x, z.tele.y, pull * step);
      }
    }
  }

  /** Điểm (x, y) đứng trong một vùng đang có không (tự săn né vùng độc, #218; cùng cách tính trúng với `tick`). */
  hits(x: number, y: number) {
    for (const z of this.list.values()) if (teleHits(z.tele, x, y)) return true;
    return false;
  }

  /** Hook kiểm thử `ground {ttl}`: mọi vùng còn đúng `s` giây. */
  setTtl(s: number) {
    for (const [id, z] of this.list) { z.t = s; const g = this.room.state.grounds.get(id); if (g) g.ttl = Math.ceil(s); }
  }

  /** Các vùng đang có (hook kiểm thử `ground`); vùng có hồn thú gây ra vừa mất (xóa ở nhịp sau) không tính. */
  info() {
    return [...this.list].filter(([, z]) => this.room.state.beasts.get(z.src)?.hp)
      .map(([id, z]) => ({ id, kind: z.def.kind, src: z.src, x: z.tele.x, y: z.tele.y, r: z.tele.r, shape: z.tele.shape, ttl: z.t, wait: z.wait }));
  }
}
