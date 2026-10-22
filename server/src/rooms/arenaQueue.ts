// Hàng chờ Đại Đấu Hồn Trường (mục 5.9, bước 7.2): trạng thái mức tiến trình như suất thú vương (kingSeats) của MapRoom, dùng chung
// cho mọi kênh bản đồ. MapRoom thêm / bỏ một bên (arenaAction, freeze); vòng ghép ở đây chỉ chọn cặp bằng hàm thuần arenaPairs
// (shared/data.ts), mở phòng ArenaRoom rồi báo cho phòng bản đồ của từng thành viên. Luật trận đấu nằm trong ArenaRoom.
// File riêng để hai phòng cùng import mà không vòng import lẫn nhau; chạy nhiều tiến trình thì hàng chờ phải chuyển sang presence.
import { matchMaker } from "colyseus";
import { randomUUID } from "node:crypto";
import { ARENA, arenaPairs, type ArenaRecord } from "../../../shared/data.ts";

/** Thành viên của một bên: Elo và thành tích được chụp lúc bắt đầu đọc DB. */
export interface ArenaMember { accountId: number; name: string; rec: ArenaRecord; }
/** Một bên đang xếp hàng: một người hoặc đúng hai thành viên của tổ đội; các callback do MapRoom sở hữu. */
export interface ArenaTeamEntry {
  id: string;
  members: ArenaMember[];
  elo: number;
  since: number;
  /** Lúc này mọi thành viên còn ở phòng bản đồ và có thể nhận mã phòng. */
  canFound(): boolean;
  ready(): boolean;
  found(roomId: string, foe: ArenaTeamEntry): boolean;
  /** Báo cho thành viên rằng đối thủ rời nên bên này được trả lại hàng chờ. */
  requeue(): void;
  /** Báo cho thành viên còn lại rằng mục hàng chờ đã hủy vì không thể vào sân. */
  abort(): void;
  /** Hoàn tác freeze nếu callback phía bên kia phát hiện phiên mất sau khi bên này đã nhận mã phòng. */
  rollback(): void;
}
/** Một trận đã ghép: mã ngẫu nhiên, hai bên theo thứ tự; ArenaRoom đọc bản sao này lúc mở phòng. */
export interface ArenaMatch { id: string; roomId?: string; sides: { id: string; members: ArenaMember[]; elo: number }[]; }

const queue = new Map<string, ArenaTeamEntry>();
export const arenaMatches = new Map<string, ArenaMatch>();

/**
 * Trận mở cho người xem trực tiếp (#278, mục 5.9): ArenaRoom ghi lúc mở phòng, xóa lúc hủy phòng. `holds`: tài khoản được giữ chỗ xem
 * (MapRoom `arena {op: "watch"}`) -> hết hạn (ms); `watching`: phiên đang xem -> tài khoản. Mức tiến trình như hàng chờ (nhiều tiến
 * trình thì chuyển sang presence, #120).
 */
export interface ArenaLive {
  roomId: string; mode: string; sides: { name: string; elo: number }[];
  phase(): string; secs(): number;
  holds: Map<number, number>; watching: Map<string, number>;
}
export const arenaLive = new Map<string, ArenaLive>();
/** Hook test `awatch {max}` (chỉ GAME_TEST): hạ số người xem tối đa mỗi trận để bot thử từ chối khi đầy; null = ARENA.watchMax. */
let testWatchMax: number | null = null;
export const arenaWatchMax = () => testWatchMax ?? ARENA.watchMax;
export function setTestWatchMax(n: number | null) { testWatchMax = n; }
/** Số chỗ xem đã dùng của trận: đang xem + giữ chỗ còn hạn (bỏ chỗ giữ đã hết hạn). */
export function arenaWatchUsed(l: ArenaLive) {
  const now = Date.now();
  for (const [acc, until] of l.holds) if (until <= now) l.holds.delete(acc);
  return l.watching.size + l.holds.size;
}
/** Tài khoản đang xem hoặc đang giữ chỗ xem một trận nào đó. */
export const arenaWatchingAny = (accountId: number) =>
  [...arenaLive.values()].some((l) => (l.holds.get(accountId) ?? 0) > Date.now() || [...l.watching.values()].includes(accountId));
/** Bên đối thủ của trận ngay trước, giữ trong RAM để arenaPairs tránh ghép lại quá sớm nếu còn bên khác. */
const lastFoe = new Map<string, string>();
const TICK_MS = 500;
let timer: ReturnType<typeof setInterval> | null = null;
let busy = false;

/** Mục hàng chờ của tài khoản, dùng để hủy / hiển thị trạng thái cho mọi thành viên. */
export const arenaQueued = (accountId: number) => [...queue.values()].find((e) => e.members.some((m) => m.accountId === accountId));
export function arenaEnqueue(e: ArenaTeamEntry) {
  queue.set(e.id, e);
  if (!timer) timer = setInterval(() => { if (!busy) void pass(); }, TICK_MS);
}
/** Bỏ cả bên khỏi hàng chờ; hủy từ một thành viên hủy luôn tổ đội. */
export function arenaDequeue(accountId: number) {
  const e = arenaQueued(accountId);
  const had = e ? queue.delete(e.id) : false;
  if (!queue.size && timer) { clearInterval(timer); timer = null; }
  return had;
}
export const arenaQueueLocked = (accountId: number) => !!arenaQueued(accountId);

/** Mốc lần đọc Elo gần nhất của từng tài khoản (#208), chống đọc DB dồn dập khi xếp rồi hủy liên tục. */
const queueReadAt = new Map<number, number>();
function clearQueueSlots(now: number) {
  for (const [id, t] of queueReadAt) if (now - t >= ARENA.queueCd * 1000) queueReadAt.delete(id);
}
/** Hết nhịp thì ghi mốc và trả true; không ghi mốc một phần nếu một thành viên trong bên bị chặn. */
export function arenaQueueSlot(accountId: number, now = Date.now()) {
  clearQueueSlots(now);
  if (queueReadAt.has(accountId)) return false;
  queueReadAt.set(accountId, now);
  return true;
}
export function arenaQueueSlots(accountIds: number[], now = Date.now()) {
  clearQueueSlots(now);
  if (accountIds.some((id) => queueReadAt.has(id))) return false;
  for (const id of accountIds) queueReadAt.set(id, now);
  return true;
}
/** Lần đọc Elo đang chạy; dùng để khóa nhận lời mời từ một người chưa kịp vào queue. */
const reads = new Map<number, { cancelled: boolean }>();
const slow = new Map<number, number>();
/** Đọc Elo để xếp hàng; trả null nếu lần đọc đã bị hủy. `slow` chỉ phục vụ hook kiểm thử. */
export async function arenaReadElo(accountId: number, read: () => Promise<ArenaRecord>): Promise<ArenaRecord | null> {
  const r = { cancelled: false }, ms = slow.get(accountId) ?? 0;
  reads.set(accountId, r); slow.delete(accountId);
  try {
    const rec = await read();
    if (ms) await new Promise((res) => setTimeout(res, ms));
    return r.cancelled ? null : rec;
  } catch (e) {
    if (!r.cancelled) throw e;
    console.error(`Không đọc được Elo của tài khoản #${accountId} (đã hủy xếp hàng)`, e);
    return null;
  } finally { if (reads.get(accountId) === r) reads.delete(accountId); }
}
export function arenaReadCancel(accountId: number) {
  const r = reads.get(accountId); if (!r || r.cancelled) return false;
  r.cancelled = true; return true;
}
export const arenaReadActive = (accountId: number) => reads.has(accountId);
export const arenaReadCancelled = (accountId: number) => reads.get(accountId)?.cancelled === true;
/** Hook test `aslow {ms}`: làm chậm lần đọc Elo kế tiếp của tài khoản. */
export function arenaTestSlow(accountId: number, ms: number) { if (ms > 0) slow.set(accountId, ms); else slow.delete(accountId); }

/** Một lượt ghép: chỉ ghép trong cùng nhóm cỡ; arenaPairs vẫn quyết định cửa sổ Elo và đối thủ vừa gặp. */
async function pass() {
  busy = true;
  try {
    const now = Date.now();
    const list = [...queue.values()].filter((e) => e.ready()).sort((x, y) => x.since - y.since)
      .map((e) => ({ id: e.id, size: e.members.length, elo: e.elo, wait: (now - e.since) / 1000, last: lastFoe.get(e.id) }));
    const groups = new Map<number, typeof list>();
    for (const item of list) groups.set(item.size, [...(groups.get(item.size) ?? []), item]);
    for (const group of groups.values()) for (const [a, b] of arenaPairs(group)) {
      const ea = queue.get(a), eb = queue.get(b); if (!ea || !eb) continue;
      arenaDequeue(ea.members[0].accountId); arenaDequeue(eb.members[0].accountId);
      // Kiểm tra cả hai bên ngay trước khi mở phòng. Nếu một thành viên vừa rời, bên còn nguyên được trả lại queue,
      // bên không còn đủ người nhận tin hủy; không để họ vào một phòng chờ thiếu người rồi bị tính noshow.
      const canA = ea.canFound(), canB = eb.canFound();
      if (!canA || !canB) {
        for (const [e, can] of [[ea, canA], [eb, canB]] as const) {
          if (can && e.ready()) { arenaEnqueue(e); e.requeue(); } else e.abort();
        }
        continue;
      }
      lastFoe.set(a, b); lastFoe.set(b, a);
      const m: ArenaMatch = { id: randomUUID(), sides: [ea, eb].map((e) => ({ id: e.id, elo: e.elo,
        members: e.members.map((member) => ({ ...member, rec: { ...member.rec } })) })) };
      arenaMatches.set(m.id, m);
      try {
        const room = await matchMaker.createRoom("arena", { matchId: m.id });
        // createRoom là await nên người chơi có thể rời phòng trong lúc mở ArenaRoom; kiểm tra lại trước khi gửi mã vào sân.
        if (!ea.canFound() || !eb.canFound()) {
          arenaMatches.delete(m.id);
          for (const [e, can] of [[ea, ea.canFound()], [eb, eb.canFound()]] as const) {
            if (can && e.ready()) { arenaEnqueue(e); e.requeue(); } else e.abort();
          }
          continue;
        }
        // canFound() vừa được kiểm tra sau await; found() chỉ còn là guard cuối nếu callback phát hiện phiên lỗi.
        const foundA = ea.found(room.roomId, eb), foundB = eb.found(room.roomId, ea);
        if (!foundA || !foundB) {
          // Guard kép ở trên khiến nhánh này hiếm gặp; hoàn tác bên đã freeze để không tạo trận mồ côi.
          console.error("Không thể báo mã phòng Đại Đấu Hồn Trường cho đủ hai bên");
          arenaMatches.delete(m.id);
          for (const [e, found] of [[ea, foundA], [eb, foundB]] as const) {
            if (found) e.rollback();
            if (e.ready()) { arenaEnqueue(e); e.requeue(); } else e.abort();
          }
        }
      } catch (err) {
        console.error("Không mở được phòng Đại Đấu Hồn Trường", err);
        arenaMatches.delete(m.id);
        // Trả nguyên thời gian chờ về queue nếu cả bên vẫn còn hợp lệ.
        for (const e of [ea, eb]) if (e.ready()) { arenaEnqueue(e); e.requeue(); } else e.abort();
      }
    }
  } finally { busy = false; }
}
