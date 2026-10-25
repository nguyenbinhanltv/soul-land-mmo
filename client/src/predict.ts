// Dự đoán chuyển động phía client (mục 6, Kỹ thuật): chính mình đi ngay theo phím, không chờ server trả vị trí.
// Server vẫn là nguồn sự thật: mỗi lần state mới về, lấy vị trí server rồi phát lại các bước chưa được xác nhận.
// Không dùng Phaser: kiểm thử bằng `npm run test:predict --prefix client` (scripts/predict-test.mjs, chạy thẳng bằng Node).
import { moveEnt, MOVE_DEAD, PLAYER_HW, PLAYER_HH, type SolidGrid } from "../../shared/move.ts";
import { dir4, RUN_MULT } from "../../shared/data.ts";

/** Dự đoán cũ và mới lệch quá chừng này (pixel) thì đặt thẳng (bị kéo, đi cổng, hồi sinh, dịch chuyển); dưới thì trượt dần. */
const SNAP = 40;
/** Tốc độ làm mờ độ lệch hiển thị sau mỗi lần đối chiếu (mỗi giây). */
const SMOOTH = 12;
/**
 * Đang đi thì mỗi giây chỉ thu độ lệch tối đa chừng này phần tốc độ đi (11.1): vừa vào giao chiến (chạy → đi bộ) với ping cao thì
 * hình chậm lại một chút cho server đuổi kịp, không bị kéo giật lùi.
 */
const SMOOTH_MOVING = 0.6;
/** Bước chưa được xác nhận giữ tối đa chừng này giây (server không trả lời thì thôi đoán). */
const MAX_PENDING = 5;

/** Một khung hình đi theo input `seq`: hướng đã gửi, có giữ Shift (đi bộ) không, thời lượng. */
interface Step { seq: number; x: number; y: number; w: boolean; dt: number; }

/** Phần PlayerState của chính mình mà bộ dự đoán đọc (trường đồng bộ từ server). */
export interface MeState { x: number; y: number; dir: number; seq: number; seqT: number; spd: number; dead: boolean; calm: boolean; walk: boolean; }

/**
 * Tốc độ một bước giữ Shift hay không (`w`) theo state server (11.1): `spd` là tốc độ thật lúc này (đã nhân RUN_MULT khi đang chạy:
 * ngoài giao chiến và input cuối không giữ Shift); tách ra tốc độ đi bộ rồi nhân lại theo cờ của chính bước đó.
 */
export function stepSpeed(me: MeState, w: boolean): number {
  const walkSpd = me.spd / (me.calm && !me.walk ? RUN_MULT : 1);
  return walkSpd * (me.calm && !w ? RUN_MULT : 1);
}

/** Bật bằng mặc định; `?nopredict` trên địa chỉ trang thì tắt (để so sánh). */
const query = new URLSearchParams(typeof location === "undefined" ? "" : location.search);
export const PREDICT = !query.has("nopredict");
/** Nhãn gỡ lỗi (trễ giả lập / dự đoán) trên màn chơi: ẩn mặc định, chỉ hiện khi địa chỉ trang có `?debug`. */
export const DEBUG_TAG = query.has("debug");

export class Predictor {
  /** Số thứ tự input gần nhất đã gửi (gửi kèm `input {x, y, s}`). */
  seq = 0;
  /** Vị trí dự đoán (chân), null khi chưa có state. */
  pos: { x: number; y: number } | null = null;
  /** Độ lệch hiển thị còn lại sau lần đối chiếu gần nhất; vẽ ở pos + off, off giảm dần về 0. */
  off = { x: 0, y: 0 };
  /** Lần đối chiếu gần nhất bị đặt thẳng (lệch lớn): để đếm / gỡ lỗi. */
  snaps = 0;
  /**
   * Server tự bỏ hướng đi đang giữ (đặt `seq` vượt số client đã gửi, vd hook thử `goto`): GameScene phải gửi lại hướng đang giữ
   * với số mới; tới lúc đó không đi trước.
   */
  resend = false;
  private steps: Step[] = [];
  // Phần thời gian của input `used.seq` đã bỏ khỏi `steps` (server đã áp, hoặc bỏ vì quá cũ): bước đầu còn lại bắt đầu ở giây `used.t`.
  private used = { seq: 0, t: 0 };
  private key = "";               // state server lần đối chiếu trước (đổi mới phát lại)
  private face = -1;              // hướng nhìn lúc tự đi gần nhất (chỉ số DIRS4), -1 = chưa đi
  private grid: SolidGrid;
  constructor(grid: SolidGrid) { this.grid = grid; }

  /** Hướng đi vừa đổi: số thứ tự mới để gửi lên server. */
  next(): number { this.resend = false; return ++this.seq; }

  /**
   * Mỗi khung hình: đối chiếu với state server nếu có bản mới, rồi đi trước một bước theo hướng `dir` đang giữ (đúng như server sẽ
   * tính khi nhận input: cùng hàm va chạm, cùng tốc độ (stepSpeed), cùng ngưỡng MOVE_DEAD). `walk`: đang giữ Shift. Trả về vị trí để vẽ.
   */
  update(me: MeState, dir: { x: number; y: number }, dt: number, walk = false): { x: number; y: number } {
    dt = Math.min(dt, 0.1); // server cũng kẹp mỗi nhịp tối đa 100 ms
    this.reconcile(me);
    const pos = this.pos!;
    let moved = 0;
    // Bước vẫn ghi cả lúc gục: server đếm `seqT` cả lúc gục, hai bên phải cùng một dòng thời gian thì mới bỏ đúng phần đã áp.
    if (!this.resend && Math.hypot(dir.x, dir.y) > MOVE_DEAD) {
      this.steps.push({ seq: this.seq, x: dir.x, y: dir.y, w: walk, dt });
      const sp = stepSpeed(me, walk);
      if (!me.dead) { moveEnt(this.grid, pos, dir.x * sp * dt, dir.y * sp * dt, PLAYER_HW, PLAYER_HH); moved = sp * Math.hypot(dir.x, dir.y); }
    }
    // Bỏ bước quá cũ: chỉ xảy ra khi server không trả lời; vị trí sẽ được kéo về theo server ở lần đối chiếu sau.
    let old = 0, i = this.steps.length;
    while (i > 0 && old < MAX_PENDING) old += this.steps[--i].dt;
    if (i > 0) this.drop(i);
    const ol = Math.hypot(this.off.x, this.off.y), cut = ol * (1 - Math.exp(-SMOOTH * dt)), max = moved ? SMOOTH_MOVING * moved * dt : Infinity;
    if (ol > 0) { const k = 1 - Math.min(cut, max) / ol; this.off.x *= k; this.off.y *= k; }
    if (Math.hypot(this.off.x, this.off.y) < 0.05) this.off = { x: 0, y: 0 };
    return { x: pos.x + this.off.x, y: pos.y + this.off.y };
  }

  /** Đang tự đi (để chạy animation đi ngay, không chờ cờ `moving` của server). */
  walking(me: MeState, dir: { x: number; y: number }): boolean { return !me.dead && me.spd > 0 && Math.hypot(dir.x, dir.y) > MOVE_DEAD; }

  /**
   * Hướng nhìn của chính mình (chỉ số DIRS4): đang đi thì theo phím; vừa nhả phím thì giữ hướng vừa đi tới khi server nhận input cuối,
   * sau đó theo `dir` của server (server cũng quay mặt khi đánh hồn thú).
   */
  look(me: MeState, dir: { x: number; y: number }): number {
    if (this.walking(me, dir)) return (this.face = dir4(dir.x, dir.y));
    return this.face < 0 || me.seq >= this.seq ? me.dir : this.face;
  }

  /** Bỏ `n` bước đầu, ghi phần thời gian đã bỏ của từng input vào `used`. */
  private drop(n: number) {
    for (const s of this.steps.splice(0, n)) {
      if (this.used.seq !== s.seq) this.used = { seq: s.seq, t: 0 };
      this.used.t += s.dt;
    }
  }

  /** State server mới: lấy vị trí server, bỏ các bước server đã áp (theo `seq` / `seqT`), phát lại phần còn lại. */
  private reconcile(me: MeState) {
    const key = `${me.x}|${me.y}|${me.seq}|${me.seqT}|${me.spd}|${me.dead}|${me.calm}|${me.walk}`;
    if (key === this.key && this.pos) return;
    this.key = key;
    if (me.seq > this.seq) { this.seq = me.seq; this.resend = true; } // server tự dừng (hook thử): mọi bước đã gửi đều hết hiệu lực
    // Input cũ hơn input server đang áp: đã xong hẳn.
    let i = 0; while (i < this.steps.length && this.steps[i].seq < me.seq) i++;
    this.drop(i);
    if (this.used.seq !== me.seq) this.used = { seq: me.seq, t: 0 };
    // Input server đang áp: bỏ đúng số giây server đã chạy (seqT đếm từ lúc server nhận input đó).
    let left = me.seqT - this.used.t, skip = 0; i = 0;
    while (i < this.steps.length && this.steps[i].seq === me.seq && left > 1e-6) {
      const s = this.steps[i];
      if (s.dt <= left + 1e-6) { left -= s.dt; i++; } else { skip = left; break; }
    }
    this.drop(i);
    const q = { x: me.x, y: me.y };
    // Gục: đứng đúng chỗ server (hồi sinh thì về doanh trại). Bước vẫn giữ để còn đối chiếu được sau khi sống lại.
    if (!me.dead) for (let j = 0; j < this.steps.length; j++) {
      const s = this.steps[j], dt = j === 0 ? s.dt - skip : s.dt;
      const sp = stepSpeed(me, s.w);
      if (dt > 0) moveEnt(this.grid, q, s.x * sp * dt, s.y * sp * dt, PLAYER_HW, PLAYER_HH);
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
export const LAG_MS = Math.max(0, Math.min(1000, Number(query.get("lag")) || 0));
export function addLag(room: { connection: { send(d: any): void; transport: any } }, ms = LAG_MS) {
  if (!ms) return;
  const conn = room.connection, ws: WebSocket | undefined = conn.transport?.ws;
  if (!ws?.onmessage) return;
  const recv = ws.onmessage, send = conn.send.bind(conn);
  ws.onmessage = (e) => { setTimeout(() => recv.call(ws, e), ms); };
  // colyseus.js gửi một đoạn của bộ đệm dùng lại cho mọi tin: phải chép trước khi hoãn, không thì tin sau ghi đè tin trước.
  conn.send = (d) => { const b = d instanceof Uint8Array ? d.slice() : d; setTimeout(() => { if (ws.readyState === WebSocket.OPEN) send(b); }, ms); };
}
