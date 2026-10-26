import type { Room } from "colyseus.js";

/**
 * Giữ tin server gửi riêng lúc vào phòng cho tới khi cảnh game nghe được (#714). Server gửi `party`, `resonance`, `squad`, `mini`…
 * ngay sau onJoin, còn `GameScene.setupMessages()` chỉ chạy sau khi chờ state đầu và Phaser tải xong; colyseus.js bỏ tin không có
 * bộ nghe (chỉ cảnh báo). Gọi `bufferRoomMessages` ngay khi có `room`, rồi `replayBufferedMessages` sau khi cảnh đã đăng ký đủ.
 */
type Held = { type: string | number; msg: unknown };
const bufs = new WeakMap<Room, { buf: Held[]; off: () => void }>();
/** Tin vẽ tức thời, quá hạn khi chờ: bỏ. `mini` (bản đồ nhỏ, mỗi giây một lần) và `vit` (dữ liệu riêng của mình, #949) chỉ giữ tin mới nhất. */
const STALE = new Set<string | number>(["dmg", "fx"]);
const MAX = 400;

export function bufferRoomMessages(room: Room) {
  const buf: Held[] = [];
  // "*" chỉ nhận tin chưa có bộ nghe riêng: cảnh đăng ký xong thì tin mới đi thẳng tới nó.
  const off = room.onMessage("*", (type: string | number, msg: unknown) => {
    if (STALE.has(type) || buf.length >= MAX) return;
    if (type === "mini" || type === "vit") { const i = buf.findIndex((b) => b.type === type); if (i >= 0) buf.splice(i, 1); }
    buf.push({ type, msg });
  });
  bufs.set(room, { buf, off });
}

/** Gỡ bộ đệm rồi phát lại theo thứ tự tới cho các bộ nghe vừa đăng ký (mỗi tin đúng một lần). */
export function replayBufferedMessages(room: Room) {
  const held = bufs.get(room);
  if (!held) return;
  bufs.delete(room);
  held.off();
  const dispatch = (room as unknown as { dispatchMessage(t: string | number, m: unknown): void }).dispatchMessage.bind(room);
  // Một bộ nghe ném lỗi với tin cũ không được làm hỏng create() của cảnh (bộ nghe thật của colyseus.js cũng chạy cô lập).
  for (const { type, msg } of held.buf) {
    try { dispatch(type, msg); } catch (e) { console.error("Phát lại tin lúc vào phòng", type, e); }
  }
}
