// Hiệu năng bản đồ lớn (bước 11.4, GAME_DESIGN.md mục 6 "Đồng bộ xuống client"): lưới không gian cho truy vấn hồn thú / đồ rơi / hồn sư
// theo vị trí, và lọc đồng bộ theo vùng gần cho từng client bằng StateView của Colyseus (trường `@view()` trong schema.ts).
import { Encoder, StateView, type Schema } from "@colyseus/schema";
import type { Client } from "colyseus";
import { SYNC_VIEW } from "../../../shared/data.ts";
import type { MapState, PlayerState } from "./schema.ts";

/**
 * Bộ đệm mã hóa state của mỗi phòng (byte). Có view, Colyseus ghi bản vá chung rồi phần riêng của từng client nối tiếp nhau trong cùng
 * bộ đệm; tràn thì phần riêng bị cắt hỏng (client báo `"refId" not found`, state lệch). Mặc định 8 KB không đủ cho bản đồ lớn nhiều
 * người: 1 MB (mỗi phòng một bộ đệm). Đặt khi nạp module, trước khi phòng nào tạo state.
 */
Encoder.BUFFER_SIZE = 1024 * 1024;

type Pos = { x: number; y: number };

/**
 * Lưới không gian: mỗi ô `size` pixel giữ id các thực thể đứng trong ô. Đồng bộ lại theo state mỗi nhịp (`sync`, O(số thực thể));
 * thực thể mới thêm giữa hai nhịp gọi `put` ngay. Truy vấn trả ứng viên trong các ô giao hình vuông quanh điểm (cộng lề `SLACK` cho
 * thực thể bị kéo / đẩy giữa hai nhịp); nơi gọi vẫn tự lọc theo khoảng cách thật như khi quét cả bản đồ.
 */
export class Grid {
  /** Lề truy vấn: thực thể dời chỗ giữa hai lần `sync` (kéo, đẩy, lướt) không quá chừng này pixel. */
  static readonly SLACK = 64;
  private readonly cols: number; private readonly rows: number;
  private readonly cells: Set<string>[];
  private readonly at = new Map<string, number>();
  constructor(w: number, h: number, readonly size = SYNC_VIEW.cell) {
    this.cols = Math.max(1, Math.ceil(w / size)); this.rows = Math.max(1, Math.ceil(h / size));
    this.cells = Array.from({ length: this.cols * this.rows }, () => new Set<string>());
  }
  private cx(x: number) { return Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.size))); }
  private cy(y: number) { return Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.size))); }
  cellOf(x: number, y: number) { return this.cy(y) * this.cols + this.cx(x); }
  put(id: string, x: number, y: number) {
    const c = this.cellOf(x, y), o = this.at.get(id);
    if (o === c) return;
    if (o !== undefined) this.cells[o].delete(id);
    this.cells[c].add(id); this.at.set(id, c);
  }
  del(id: string) { const o = this.at.get(id); if (o !== undefined) { this.cells[o].delete(id); this.at.delete(id); } }
  /** Đặt lại theo collection của state: cập nhật ô của mọi thực thể, bỏ id không còn. */
  sync(all: { forEach(fn: (v: Pos, k: string) => void): void; has(k: string): boolean }) {
    all.forEach((v, k) => this.put(k, v.x, v.y));
    for (const id of this.at.keys()) if (!all.has(id)) this.del(id);
  }
  /** Gọi `fn(c)` cho mỗi ô giao hình vuông tâm (x, y) nửa cạnh r. */
  cellsAround(x: number, y: number, r: number, fn: (c: number) => void) {
    const x0 = this.cx(x - r), x1 = this.cx(x + r), y0 = this.cy(y - r), y1 = this.cy(y + r);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) fn(j * this.cols + i);
  }
  /** Id ứng viên trong bán kính r (cộng lề SLACK) quanh (x, y). */
  near(x: number, y: number, r: number): string[] {
    const out: string[] = [];
    this.cellsAround(x, y, r + Grid.SLACK, (c) => { for (const id of this.cells[c]) out.push(id); });
    return out;
  }
  get cellCount() { return this.cells.length; }
}

/** Thực thể đang đồng bộ cho một client: hồn sư khác, hồn thú, đồ rơi, vùng lưu lại (#161); `all`: tắt lọc (hook kiểm thử, phòng sân đấu). */
interface Seen { p: Set<string>; b: Set<string>; d: Set<string>; g: Set<string>; all: boolean }

/**
 * Lọc đồng bộ theo vùng gần: mỗi client có một StateView; mỗi nhịp (trước bản vá) thêm thực thể vào trong SYNC_VIEW.r, bỏ thực thể ra
 * ngoài SYNC_VIEW.out. Chính mình luôn có; hồn thú có `rank` (tinh anh, thú vương, boss thế giới) luôn có. Thực thể bị xóa khỏi state
 * thì Colyseus tự báo xóa cho mọi client đang thấy.
 */
export class Interest {
  readonly beasts: Grid; readonly drops: Grid; readonly players: Grid;
  private seen = new Map<string, Seen>();
  /** Hồn thú ngủ: ô lưới hồn thú có hồn sư trong SYNC_VIEW.wake được đánh dấu bằng số nhịp hiện tại. */
  private wakeAt: Uint32Array; private tickNo = 1;
  /** Hồn thú có `rank` (luôn đồng bộ cho mọi client), lập lại mỗi nhịp ở `syncEntities`. */
  private ranked: string[] = [];
  constructor(private state: MapState, w: number, h: number, public all = false) {
    this.beasts = new Grid(w, h); this.drops = new Grid(w, h); this.players = new Grid(w, h);
    this.wakeAt = new Uint32Array(this.beasts.cellCount);
  }

  join(c: Client, p: PlayerState) {
    c.view = new StateView();
    c.view.add(p);
    this.seen.set(c.sessionId, { p: new Set([c.sessionId]), b: new Set(), d: new Set(), g: new Set(), all: this.all });
    this.refresh(c);
  }
  leave(id: string) { this.seen.delete(id); }
  /** Tắt / bật lọc cho một client (hook kiểm thử `view`). Bật lại lọc thì thực thể ở xa bị bỏ ở nhịp sau. */
  setAll(id: string, on: boolean) { const s = this.seen.get(id); if (s) s.all = on; }
  stats(id: string) { const s = this.seen.get(id); return s && { all: s.all, players: s.p.size, beasts: s.b.size, drops: s.d.size, grounds: s.g.size }; }
  sees(id: string, kind: "p" | "b" | "d" | "g", eid: string) { return !!this.seen.get(id)?.[kind].has(eid); }

  /** Đầu nhịp: đặt lại lưới hồn sư và đánh dấu các ô hồn thú còn thức (quanh mọi hồn sư trong phòng). */
  beginTick() {
    this.players.sync(this.state.players);
    this.tickNo++;
    this.state.players.forEach((p) => this.beasts.cellsAround(p.x, p.y, SYNC_VIEW.wake, (c) => { this.wakeAt[c] = this.tickNo; }));
  }
  /** Hồn thú ở (x, y) đang thức (có hồn sư trong khoảng SYNC_VIEW.wake, theo ô lưới). */
  awake(x: number, y: number) { return this.wakeAt[this.beasts.cellOf(x, y)] === this.tickNo; }
  /** Sau khi hồn thú di chuyển / đồ rơi đổi: đặt lại hai lưới. */
  syncEntities() {
    this.beasts.sync(this.state.beasts); this.drops.sync(this.state.drops);
    this.ranked.length = 0; this.state.beasts.forEach((b, id) => { if (b.rank > 0) this.ranked.push(id); });
  }

  /** Cuối nhịp, trước bản vá: cập nhật view của mọi client. */
  update(clients: Iterable<Client>) { for (const c of clients) this.refresh(c); }

  private refresh(c: Client) {
    const s = this.seen.get(c.sessionId), v = c.view, me = this.state.players.get(c.sessionId);
    if (!s || !v || !me) return;
    const { r, out } = SYNC_VIEW, d2 = (e: Pos) => (e.x - me.x) ** 2 + (e.y - me.y) ** 2;
    const R2 = r * r, OUT2 = out * out;
    // Bỏ thực thể đã ra xa (thực thể đã bị xóa khỏi state: Colyseus đã báo xóa, chỉ quên id).
    const drop = <T extends Schema & Pos>(set: Set<string>, all: { get(k: string): T | undefined }, keep: (e: T, id: string) => boolean) => {
      for (const id of set) {
        const e = all.get(id);
        if (!e) set.delete(id);
        else if (!s.all && !keep(e, id) && d2(e) > OUT2) { v.remove(e); set.delete(id); }
      }
    };
    drop(s.p, this.state.players, (_e, id) => id === c.sessionId);
    drop(s.b, this.state.beasts, (b) => b.rank > 0);
    drop(s.d, this.state.drops, () => false);
    // Thêm thực thể mới vào tầm (tắt lọc: thêm tất cả).
    const add = <T extends Schema & Pos>(set: Set<string>, all: { get(k: string): T | undefined; forEach(fn: (v: T, k: string) => void): void }, grid: Grid,
      always: Iterable<string> = []) => {
      if (s.all) { all.forEach((e, id) => { if (!set.has(id)) { v.add(e); set.add(id); } }); return; }
      for (const id of grid.near(me.x, me.y, r)) if (!set.has(id)) { const e = all.get(id); if (e && d2(e) <= R2) { v.add(e); set.add(id); } }
      for (const id of always) if (!set.has(id)) { const e = all.get(id); if (e) { v.add(e); set.add(id); } }
    };
    add(s.p, this.state.players, this.players);
    add(s.b, this.state.beasts, this.beasts, this.ranked);
    add(s.d, this.state.drops, this.drops);
    // Vùng lưu lại trên mặt đất (#161): ít nên quét cả phòng, không cần lưới; khoảng cách tính tới gốc vùng trừ kích thước `r` (vùng
    // lớn hiện khi mép vào tầm). Người mới vào tầm nhìn vẫn thấy vùng đang có (không chỉ tin `fx` một lần).
    for (const id of s.g) {
      const g = this.state.grounds.get(id);
      if (!g) s.g.delete(id);
      else if (!s.all && d2(g) > (out + g.r) ** 2) { v.remove(g); s.g.delete(id); }
    }
    this.state.grounds.forEach((g, id) => {
      if (!s.g.has(id) && (s.all || d2(g) <= (r + g.r) ** 2)) { v.add(g); s.g.add(id); }
    });
  }

  /** Client `id` ở xa điểm (x, y) hơn r (tin `fx` / `dmg` không cần gửi). Tắt lọc thì không bao giờ xa. */
  far(id: string, x: number, y: number, r = SYNC_VIEW.fx) {
    const s = this.seen.get(id), me = this.state.players.get(id);
    return !!s && !!me && !s.all && (me.x - x) ** 2 + (me.y - y) ** 2 > r * r;
  }
}
