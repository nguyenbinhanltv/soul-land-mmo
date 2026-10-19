// Dự đoán chuyển động phía client (mục 6, Kỹ thuật): chính mình đi ngay theo phím, không chờ server trả vị trí.
// Server vẫn là nguồn sự thật: mỗi lần state mới về, lấy vị trí server rồi phát lại các bước chưa được xác nhận.
import { moveEnt, MOVE_DEAD, PLAYER_HW, PLAYER_HH, type SolidGrid } from "../../shared/move.ts";

/** Dự đoán cũ và mới lệch quá chừng này (pixel) thì đặt thẳng (bị kéo, đi cổng, hồi sinh, dịch chuyển); dưới thì trượt dần. */
const SNAP = 40;
/** Tốc độ làm mờ độ lệch hiển thị sau mỗi lần đối chiếu (mỗi giây). */
const SMOOTH = 12;
/** Bước chưa được xác nhận giữ tối đa chừng này giây (server không trả lời thì thôi đoán). */
const MAX_PENDING = 5;

/** Một khung hình đi theo input `seq`: hướng đã gửi, thời lượng, có được đi không (đang gục thì không). */
interface Step { seq: number; x: number; y: number; dt: number; go: boolean; }

/** Phần PlayerState của chính mình mà bộ dự đoán đọc (trường đồng bộ từ server). */
export interface MeState { x: number; y: number; seq: number; seqT: number; spd: number; dead: boolean; }

/** Bật bằng mặc định; `?nopredict` trên địa chỉ trang thì tắt (để so sánh). */
export const PREDICT = !new URLSearchParams(location.search).has("nopredict");

export class Predictor {
  /** Số thứ tự input gần nhất đã gửi (gửi kèm `input {x, y, s}`). */
  seq = 0;
  /** Vị trí dự đoán (chân), null khi chưa có state. */
  pos: { x: number; y: number } | null = null;
  /** Độ lệch hiển thị còn lại sau lần đối chiếu gần nhất; vẽ ở pos + off, off giảm dần về 0. */
  off = { x: 0, y: 0 };
  /** Lần đối chiếu gần nhất bị đặt thẳng (lệch lớn): để đếm / gỡ lỗi. */
  snaps = 0;
  private steps: Step[] = [];
  private used = { seq: 0, t: 0 }; // phần thời gian của input `used.seq` đã bỏ khỏi `steps` vì server đã áp
  private key = "";               // state server lần đối chiếu trước (đổi mới phát lại)
  constructor(private grid: SolidGrid) {}

  /** Hướng đi vừa đổi: số thứ tự mới để gửi lên server. */
  next(): number { return ++this.seq; }

  /**
   * Mỗi khung hình: đối chiếu với state server nếu có bản mới, rồi đi trước một bước theo hướng `dir` đang giữ (đúng như server sẽ
   * tính khi nhận input: cùng hàm va chạm, cùng tốc độ `spd`, cùng ngưỡng MOVE_DEAD). Trả về vị trí để vẽ.
   */
  update(me: MeState, dir: { x: number; y: number }, dt: number): { x: number; y: number } {
    dt = Math.min(dt, 0.1); // server cũng kẹp mỗi nhịp tối đa 100 ms
    this.reconcile(me);
    const pos = this.pos!;
    if (Math.hypot(dir.x, dir.y) > MOVE_DEAD) {
      const go = !me.dead;
      this.steps.push({ seq: this.seq, x: dir.x, y: dir.y, dt, go });
      if (go) moveEnt(this.grid, pos, dir.x * me.spd * dt, dir.y * me.spd * dt, PLAYER_HW, PLAYER_HH);
    }
    // Bỏ bước quá cũ: chỉ xảy ra khi server không trả lời; vị trí sẽ được kéo về theo server ở lần đối chiếu sau.
    let old = 0, i = this.steps.length;
    while (i > 0 && old < MAX_PENDING) old += this.steps[--i].dt;
    if (i > 0) this.steps.splice(0, i);
    const k = Math.exp(-SMOOTH * dt); this.off.x *= k; this.off.y *= k;
    if (Math.hypot(this.off.x, this.off.y) < 0.05) this.off = { x: 0, y: 0 };
    return { x: pos.x + this.off.x, y: pos.y + this.off.y };
  }

  /** Đang tự đi (để chạy animation đi ngay, không chờ cờ `moving` của server). */
  walking(me: MeState, dir: { x: number; y: number }): boolean { return !me.dead && me.spd > 0 && Math.hypot(dir.x, dir.y) > MOVE_DEAD; }

  /** State server mới: lấy vị trí server, bỏ các bước server đã áp (theo `seq` / `seqT`), phát lại phần còn lại. */
  private reconcile(me: MeState) {
    const key = `${me.x}|${me.y}|${me.seq}|${me.seqT}|${me.spd}|${me.dead}`;
    if (key === this.key && this.pos) return;
    this.key = key;
    // Input cũ hơn input server đang áp: đã xong hẳn.
    let i = 0; while (i < this.steps.length && this.steps[i].seq < me.seq) i++;
    if (this.used.seq !== me.seq) this.used = { seq: me.seq, t: 0 };
    // Input server đang áp: bỏ đúng số giây server đã chạy (seqT đếm từ lúc server nhận input đó).
    let left = me.seqT - this.used.t, skip = 0;
    while (i < this.steps.length && this.steps[i].seq === me.seq && left > 1e-6) {
      const s = this.steps[i];
      if (s.dt <= left + 1e-6) { left -= s.dt; this.used.t += s.dt; i++; } else { skip = left; break; }
    }
    this.steps.splice(0, i);
    const q = { x: me.x, y: me.y };
    if (me.dead) this.steps.length = 0; // gục: đứng đúng chỗ server, hồi sinh thì về doanh trại
    for (let j = 0; j < this.steps.length; j++) {
      const s = this.steps[j], dt = j === 0 ? s.dt - skip : s.dt;
      if (s.go && dt > 0) moveEnt(this.grid, q, s.x * me.spd * dt, s.y * me.spd * dt, PLAYER_HW, PLAYER_HH);
    }
    if (this.pos) {
      const ex = this.pos.x + this.off.x - q.x, ey = this.pos.y + this.off.y - q.y;
      if (Math.hypot(ex, ey) > SNAP) { this.off = { x: 0, y: 0 }; this.snaps++; } else this.off = { x: ex, y: ey };
    }
    this.pos = q;
  }
}

/**
 * Giả lập ping cao để thử (`?lag=<ms>`, tối đa 1000): trì hoãn mọi gói tin vào và ra của phòng thêm ngần ấy mili giây mỗi chiều.
 * Chỉ ảnh hưởng chính client này; thứ tự gói tin giữ nguyên.
 */
export const LAG_MS = Math.max(0, Math.min(1000, Number(new URLSearchParams(location.search).get("lag")) || 0));
export function addLag(room: { connection: { send(d: any): void; transport: any } }, ms = LAG_MS) {
  if (!ms) return;
  const conn = room.connection, ws: WebSocket | undefined = conn.transport?.ws;
  if (!ws?.onmessage) return;
  const recv = ws.onmessage, send = conn.send.bind(conn);
  ws.onmessage = (e) => { setTimeout(() => recv.call(ws, e), ms); };
  // colyseus.js gửi một đoạn của bộ đệm dùng lại cho mọi tin: phải chép trước khi hoãn, không thì tin sau ghi đè tin trước.
  conn.send = (d) => { const b = d instanceof Uint8Array ? d.slice() : d; setTimeout(() => { if (ws.readyState === WebSocket.OPEN) send(b); }, ms); };
}
