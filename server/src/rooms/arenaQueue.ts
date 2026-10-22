// Hàng chờ Đại Đấu Hồn Trường (mục 5.9, bước 7.2): hỗ trợ đấu đơn và tổ đội 2v2.
// Một mục hàng chờ là một bên trận; Elo ghép là trung bình Elo của các tài khoản trong bên.
// Tổ đội được khóa ở MapRoom trong lúc đọc Elo và chờ ghép. Hàng chờ vẫn ở RAM như các trạng thái phòng hiện tại.
import { matchMaker } from "colyseus";
import { randomUUID } from "node:crypto";
import { ARENA, arenaPairs, type ArenaRecord } from "../../../shared/data.ts";

export interface ArenaMember { accountId: number; name: string; rec: ArenaRecord; }
/** Một bên đang xếp hàng: một người hoặc đúng hai thành viên của tổ đội. */
export interface ArenaTeamEntry {
  id: string;
  members: ArenaMember[];
  elo: number;
  since: number;
  ready(): boolean;
  found(roomId: string, foe: ArenaTeamEntry): boolean;
}
export interface ArenaMatch { id: string; roomId?: string; sides: { id: string; members: ArenaMember[]; elo: number }[]; }

const queue = new Map<string, ArenaTeamEntry>();
export const arenaMatches = new Map<string, ArenaMatch>();
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

const queueReadAt = new Map<number, number>();
export function arenaQueueSlot(accountId: number, now = Date.now()) {
  for (const [id, t] of queueReadAt) if (now - t >= ARENA.queueCd * 1000) queueReadAt.delete(id);
  if (queueReadAt.has(accountId)) return false;
  queueReadAt.set(accountId, now);
  return true;
}
const reads = new Map<number, { cancelled: boolean }>();
const slow = new Map<number, number>();
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
export const arenaReadCancelled = (accountId: number) => reads.get(accountId)?.cancelled === true;
export function arenaTestSlow(accountId: number, ms: number) { if (ms > 0) slow.set(accountId, ms); else slow.delete(accountId); }

/** Ghép hai bên cùng cỡ theo Elo trung bình. `id` dùng để tránh ghép lại cùng cặp bên trong thời gian ngắn. */
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
      lastFoe.set(a, b); lastFoe.set(b, a);
      const m: ArenaMatch = { id: randomUUID(), sides: [ea, eb].map((e) => ({ id: e.id, elo: e.elo,
        members: e.members.map((member) => ({ ...member, rec: { ...member.rec } })) })) };
      arenaMatches.set(m.id, m);
      try {
        const room = await matchMaker.createRoom("arena", { matchId: m.id });
        ea.found(room.roomId, eb); eb.found(room.roomId, ea);
      } catch (err) {
        console.error("Không mở được phòng Đại Đấu Hồn Trường", err);
        arenaMatches.delete(m.id);
        for (const e of [ea, eb]) if (e.ready()) arenaEnqueue(e);
      }
    }
  } finally { busy = false; }
}
