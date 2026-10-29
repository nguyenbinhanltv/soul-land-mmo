// Chấm / thanh ping trên HUD (UI v2, kiểm kê UI #9; Part of #885). Chỉ hiển thị, không gửi thêm tin lên server: RTT lấy từ số `seq` của input
// (GameScene đánh số mỗi hướng đi gửi lên; server trả lại số cuối đã nhận ở PlayerState.seq, predict.ts dùng cho đối chiếu), tức thời gian từ lúc
// gửi input tới lúc state có số đó. Chỉ có mẫu khi người chơi vừa đổi hướng đi; lâu không có mẫu thì hiện "Chưa đo" (không đoán).
// Mức: tốt / chậm / kém / chưa đo, mỗi mức một hình + một chữ (mù màu: không chỉ bằng màu). Chỉ dựng khi cờ `ui2` bật.
import { isUi2 } from "./uiKit.ts";

export type PingLevel = "good" | "warn" | "bad" | "none";
/** Từ mức này (ms) trở lên là "chậm" / "kém" (dự đoán chuyển động của predict.ts vẫn mượt tới khoảng 250 ms). */
export const PING_WARN_MS = 120, PING_BAD_MS = 250;
/** Mẫu cũ hơn ngần này (ms) thì bỏ: hiện "Chưa đo". */
export const PING_STALE_MS = 30_000;
/** Làm mượt: giá trị mới = cũ × (1 − K) + mẫu × K. */
export const PING_EMA_K = 0.4;
/** Số input chờ trả lời tối đa giữ lại (đứng im lâu không trả thì bỏ cái cũ nhất). */
const PENDING_MAX = 32;

export const PING_TEXT: Record<PingLevel, string> = { good: "Tốt", warn: "Chậm", bad: "Kém", none: "Chưa đo" };
/** Hình khác nhau cho từng mức (tròn / tam giác / vuông / rỗng). */
export const PING_MARK: Record<PingLevel, string> = { good: "●", warn: "▲", bad: "■", none: "○" };

export function pingLevel(ms: number | null): PingLevel {
  if (ms === null || !Number.isFinite(ms)) return "none";
  return ms < PING_WARN_MS ? "good" : ms < PING_BAD_MS ? "warn" : "bad";
}
/** Chữ hiển thị: "Tốt 45 ms", "Chưa đo", "Mất kết nối". */
export function pingText(ms: number | null, online = true): string {
  if (!online) return "Mất kết nối";
  const lv = pingLevel(ms);
  return lv === "none" ? PING_TEXT.none : `${PING_TEXT[lv]} ${Math.round(ms!)} ms`;
}

/** Bộ đo RTT theo số input. Thuần (đưa giờ vào) để test bằng node. */
export class RttMeter {
  private pending = new Map<number, number>();
  private avg: number | null = null;
  private at = 0;
  /** Input số `seq` vừa gửi lúc `now` (ms). */
  sent(seq: number, now: number) {
    this.pending.set(seq, now);
    if (this.pending.size > PENDING_MAX) this.pending.delete(this.pending.keys().next().value as number);
  }
  /** State báo server đã nhận tới `seq`: mẫu = giờ nhận − giờ gửi của đúng input đó; input cũ hơn thì bỏ. Trả true khi có mẫu mới. */
  acked(seq: number, now: number): boolean {
    let got = false;
    for (const s of [...this.pending.keys()]) {
      if (s > seq) continue;
      const t0 = this.pending.get(s)!; this.pending.delete(s);
      if (s !== seq) continue;
      const ms = Math.max(0, now - t0);
      this.avg = this.avg === null ? ms : this.avg * (1 - PING_EMA_K) + ms * PING_EMA_K;
      this.at = now; got = true;
    }
    return got;
  }
  /** Giá trị làm mượt (ms), hoặc null khi chưa có / quá cũ. */
  value(now: number): number | null { return this.avg !== null && now - this.at <= PING_STALE_MS ? this.avg : null; }
  reset() { this.pending.clear(); this.avg = null; this.at = 0; }
}

// ---- phần DOM ----
const meter = new RttMeter();
let box: HTMLElement | null = null, online = true, last = "";

function ensureBox(): HTMLElement | null {
  if (!isUi2()) return null;
  if (box?.isConnected) return box;
  const info = document.querySelector(".c12-radar-info"); if (!info?.parentElement) return null;
  box = document.createElement("div"); box.id = "ping2"; box.className = "pg2"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "off");
  box.innerHTML = `<i class="pg2-mark" aria-hidden="true"></i><span class="pg2-txt"></span>`;
  info.after(box);
  return box;
}
function paint() {
  const el = ensureBox(); if (!el) return;
  const ms = online ? meter.value(performance.now()) : null, lv = online ? pingLevel(ms) : "bad", txt = pingText(ms, online), mark = online ? PING_MARK[lv] : PING_MARK.bad;
  const key = `${lv}|${txt}`; if (key === last) return; last = key;
  el.dataset.level = lv;
  el.title = `Độ trễ tới server: ${txt}`;
  el.setAttribute("aria-label", `Mạng: ${txt}`);
  el.querySelector(".pg2-mark")!.textContent = mark;
  el.querySelector(".pg2-txt")!.textContent = txt;
}
/** Phòng mới (số input bắt đầu lại từ 1): bỏ mẫu cũ. */
export function pingReset() { meter.reset(); last = ""; paint(); }
export function pingSent(seq: number) { if (isUi2()) meter.sent(seq, performance.now()); }
/** Gọi mỗi khung hình với `PlayerState.seq` của mình; chỉ vẽ lại khi chữ đổi. */
export function pingAck(seq: number) { if (isUi2() && (meter.acked(seq, performance.now()) || last === "")) paint(); }
/** Hết hạn mẫu cũ: gọi chừng 1 lần / giây. */
export function pingTick() { if (isUi2()) paint(); }
/** Kết nối của phòng (uiIcons.setConnectionLabel): mất kết nối thì hiện "Mất kết nối" mức kém. */
export function pingOnline(on: boolean) { online = on; if (isUi2()) paint(); }
