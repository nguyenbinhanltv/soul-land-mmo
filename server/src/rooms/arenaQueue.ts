// Hàng chờ Đại Đấu Hồn Trường (mục 5.9, bước 7.2): trạng thái mức tiến trình như suất thú vương (kingSeats) của MapRoom, dùng chung
// cho mọi kênh bản đồ. MapRoom thêm / bỏ người xếp hàng (arenaAction, freeze); vòng ghép ở đây chỉ chọn cặp bằng hàm thuần arenaPairs
// (shared/data.ts), mở phòng "arena" (ArenaRoom) rồi báo cho phòng bản đồ của từng người. Luật trận đấu nằm trong ArenaRoom.
// File riêng (không nằm trong MapRoom.ts / ArenaRoom.ts) để hai phòng cùng import mà không vòng import lẫn nhau.
// Chạy nhiều tiến trình thì hàng chờ phải chuyển sang presence (Redis), như lịch boss.
import { matchMaker } from "colyseus";
import { randomUUID } from "node:crypto";
import { ARENA, arenaPairs, type ArenaRecord } from "../../../shared/data.ts";

/** Một người đang xếp hàng. Hàm `ready` / `found` do phòng bản đồ của người đó cung cấp. */
export interface ArenaEntry {
  accountId: number; name: string;
  rec: ArenaRecord;  // Elo và thành tích đọc lúc xếp hàng (mỗi tài khoản chỉ một phiên, không đổi trong lúc chờ)
  since: number;     // lúc xếp hàng (ms)
  /** Lúc này ghép được không (không đi cổng, gục, hấp thụ, giao chiến): không thì bỏ qua lượt ghép này nhưng vẫn giữ chỗ. */
  ready(): boolean;
  /** Đã ghép: báo người chơi vào phòng `roomId` gặp `foe`. false = người đó đã rời phòng bản đồ. */
  found(roomId: string, foe: ArenaEntry): boolean;
}
/**
 * Một trận đã ghép: mã ngẫu nhiên, hai bên theo thứ tự (bên 0, bên 1). ArenaRoom đọc lúc mở phòng (`matchId`), ghi `roomId` (mỗi trận
 * đúng một phòng) và xóa khi phòng hủy.
 */
export interface ArenaMatch { id: string; roomId?: string; sides: { accountId: number; name: string; rec: ArenaRecord }[]; }

const queue = new Map<number, ArenaEntry>();   // accountId -> người đang xếp hàng (theo thứ tự xếp hàng)
export const arenaMatches = new Map<string, ArenaMatch>();
/**
 * Đối thủ của trận ngay trước của mỗi tài khoản (chống dàn xếp, 9.7): ghi lúc ghép, arenaPairs tránh ghép lại trong ARENA.rematchSecs
 * giây chờ đầu nếu còn người khác. Chỉ ở RAM: khởi động lại server thì quên (số trận tính Elo của cặp vẫn ở bảng arena_pairs).
 */
const lastFoe = new Map<number, number>();
/** Nhịp chạy vòng ghép (ms): chỉ chạy khi có người xếp hàng. */
const TICK_MS = 500;
let timer: ReturnType<typeof setInterval> | null = null;
let busy = false;

export const arenaQueued = (accountId: number) => queue.get(accountId);
export function arenaEnqueue(e: ArenaEntry) {
  queue.set(e.accountId, e);
  if (!timer) timer = setInterval(() => { if (!busy) void pass(); }, TICK_MS);
}
/** Bỏ người khỏi hàng chờ; true nếu người đó đang xếp hàng. */
export function arenaDequeue(accountId: number) {
  const had = queue.delete(accountId);
  if (!queue.size && timer) { clearInterval(timer); timer = null; }
  return had;
}

/**
 * Lần xếp hàng có đọc Elo từ DB gần nhất của mỗi tài khoản (ms, #208): hai lần đọc cách nhau ít nhất ARENA.queueCd giây, kể cả khi đổi
 * kênh / bản đồ giữa chừng (như channelSwitchAt của MapRoom). Mỗi lần gọi dọn các mốc đã hết nhịp nên Map chỉ giữ người vừa xếp hàng.
 */
const queueReadAt = new Map<number, number>();
/** Hết nhịp thì ghi mốc lúc `now` và trả true (được đọc Elo từ DB); còn trong nhịp thì false (xếp hàng quá nhanh). */
export function arenaQueueSlot(accountId: number, now = Date.now()) {
  for (const [id, t] of queueReadAt) if (now - t >= ARENA.queueCd * 1000) queueReadAt.delete(id);
  if (queueReadAt.has(accountId)) return false;
  queueReadAt.set(accountId, now);
  return true;
}

/**
 * Lần đọc Elo đang chạy của mỗi tài khoản (#225): `cancel` tới trong lúc chờ DB thì đánh dấu đã hủy, đọc xong không xếp hàng. Theo tài
 * khoản như queueReadAt. `slow`: hook test `aslow` (chỉ GAME_TEST=1) làm chậm lần đọc kế tiếp thêm số mili giây.
 */
const reads = new Map<number, { cancelled: boolean }>();
const slow = new Map<number, number>();
/** Đọc Elo để xếp hàng bằng `read`; trả null nếu người chơi đã hủy trong lúc đọc. */
export async function arenaReadElo(accountId: number, read: () => Promise<ArenaRecord>): Promise<ArenaRecord | null> {
  const r = { cancelled: false }, ms = slow.get(accountId) ?? 0;
  reads.set(accountId, r); slow.delete(accountId);
  try {
    const rec = await read();
    if (ms) await new Promise((res) => setTimeout(res, ms));
    return r.cancelled ? null : rec;
  } finally { if (reads.get(accountId) === r) reads.delete(accountId); }
}
/** Hủy lần đọc Elo đang chạy; true nếu có lần đọc chưa bị hủy. */
export function arenaReadCancel(accountId: number) {
  const r = reads.get(accountId); if (!r || r.cancelled) return false;
  r.cancelled = true; return true;
}
/** Lần đọc Elo đang chạy đã bị hủy chưa. */
export const arenaReadCancelled = (accountId: number) => reads.get(accountId)?.cancelled === true;
/** Hook test `aslow {ms}`: lần đọc Elo kế tiếp của tài khoản chậm thêm `ms` mili giây (0 bỏ). */
export function arenaTestSlow(accountId: number, ms: number) { if (ms > 0) slow.set(accountId, ms); else slow.delete(accountId); }

/**
 * Một lượt ghép: cặp theo arenaPairs (chờ lâu nhất trước, Elo gần nhất trong cửa sổ nới dần, 9.7: tránh ghép lại đối thủ vừa đấu),
 * mỗi cặp một phòng ArenaRoom.
 */
async function pass() {
  busy = true;
  try {
    const now = Date.now();
    const list = [...queue.values()].filter((e) => e.ready()).sort((x, y) => x.since - y.since).map((e) => ({ id: e.accountId, elo: e.rec.elo, wait: (now - e.since) / 1000, last: lastFoe.get(e.accountId) }));
    for (const [a, b] of arenaPairs(list)) {
      const ea = queue.get(a), eb = queue.get(b); if (!ea || !eb) continue;
      arenaDequeue(a); arenaDequeue(b);
      lastFoe.set(a, b); lastFoe.set(b, a);
      const m: ArenaMatch = { id: randomUUID(), sides: [ea, eb].map((e) => ({ accountId: e.accountId, name: e.name, rec: { ...e.rec } })) };
      arenaMatches.set(m.id, m);
      try {
        const room = await matchMaker.createRoom("arena", { matchId: m.id });
        // Ai đã rời phòng bản đồ trong lúc mở phòng thì trận xử như bỏ trận (ArenaRoom: không vào sân trong ARENA.joinSecs giây).
        ea.found(room.roomId, eb); eb.found(room.roomId, ea);
      } catch (err) {
        // Không mở được phòng: trả cả hai về hàng chờ, giữ thời gian chờ cũ.
        console.error("Không mở được phòng Đại Đấu Hồn Trường", err);
        arenaMatches.delete(m.id);
        for (const e of [ea, eb]) if (e.ready()) arenaEnqueue(e);
      }
    }
  } finally { busy = false; }
}
