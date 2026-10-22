// Hàng chờ Đại Đấu Hồn Trường (mục 5.9, bước 7.2): trạng thái mức tiến trình như suất thú vương (kingSeats) của MapRoom, dùng chung
// cho mọi kênh bản đồ. MapRoom thêm / bỏ một bên (arenaAction, freeze); vòng ghép ở đây chỉ chọn cặp bằng hàm thuần arenaPairs
// (shared/data.ts), mở phòng ArenaRoom rồi báo cho phòng bản đồ của từng thành viên. Luật trận đấu nằm trong ArenaRoom.
// File riêng để hai phòng cùng import mà không vòng import lẫn nhau; chạy nhiều tiến trình thì hàng chờ phải chuyển sang presence.
import { matchMaker } from "colyseus";
import { randomUUID } from "node:crypto";
import { ARENA, arenaPairs, type ArenaRecord } from "../../../shared/data.ts";
import { presenceBackend, PRESENCE_HEARTBEAT_MS, PRESENCE_TTL_MS } from "../presence.ts";

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
/** Ghép lại cặp vừa đấu nhau chỉ sau ngần này giây chờ (giây). */
const REMATCH_SETTLE_S = 1;
let timer: ReturnType<typeof setInterval> | null = null;
let busy = false;

const QUEUE_KEY = "arena:queue";
const T = { found: "arena:found", requeue: "arena:requeue", abort: "arena:abort", rollback: "arena:rollback" };
type RemoteEntry = { id: string; members: ArenaMember[]; elo: number; since: number; owner: string };
const owner = () => `${presenceBackend.workerId}:arena`;
const shadows = new WeakSet<ArenaTeamEntry>();
/** Bên đã được báo mã phòng (rời `queue` lúc found): giữ lại ít giây để rollback từ tiến trình ghép còn tìm được. */
const delivered = new Map<string, ArenaTeamEntry>();
const publish = (topic: string, m: unknown) => { void presenceBackend.presence.publish(topic, m); return true; };

/** Bên của tiến trình khác trong hàng chung: tiến trình ghép chỉ gửi tin, phòng bản đồ chủ của bên đó mới đổi trạng thái thật. */
function shadow(r: RemoteEntry): ArenaTeamEntry {
  const e: ArenaTeamEntry = { id: r.id, members: r.members.map((m) => ({ ...m, rec: { ...m.rec } })), elo: r.elo, since: r.since,
    canFound: () => true, ready: () => true,
    found: (roomId, foe) => publish(T.found, { id: r.id, owner: r.owner, roomId, foe: { id: foe.id, members: foe.members, elo: foe.elo, since: foe.since } }),
    requeue: () => { publish(T.requeue, { id: r.id }); }, abort: () => { publish(T.abort, { id: r.id }); }, rollback: () => { publish(T.rollback, { id: r.id }); } };
  shadows.add(e);
  return e;
}
const sub = <M>(topic: string, fn: (m: M) => void) => void presenceBackend.presence.subscribe(topic, (m: M) => { if (m) fn(m); });
/**
 * Báo bên `e` vào phòng `roomId`: rời `queue`, nhớ vào `delivered` (30 giây) để rollback từ tiến trình ghép tìm được, rồi gọi `found`.
 * Dùng cho cả đường ghép trực tiếp ở pass() và đường tin T.found; `found` false thì bỏ khỏi `delivered`.
 */
export function arenaDeliver(e: ArenaTeamEntry, roomId: string, foe: ArenaTeamEntry) {
  if (!shadows.has(e)) {
    queue.delete(e.id); delivered.set(e.id, e);
    setTimeout(() => { if (delivered.get(e.id) === e) delivered.delete(e.id); }, 30_000).unref();
  }
  const ok = e.found(roomId, foe);
  if (!ok) delivered.delete(e.id);
  return ok;
}
sub<{ id: string; owner: string; roomId: string; foe: ArenaTeamEntry }>(T.found, (m) => {
  if (m.owner !== presenceBackend.workerId) return; // tin tới mọi tiến trình: chỉ tiến trình chủ của bên này xử lý
  const e = queue.get(m.id), foe = m.foe;
  // Bên này đã hủy / đã mất: trả đối thủ (đã nhận mã phòng) về hàng chờ thay vì để vào sân một mình.
  if (!e) { publish(T.rollback, { id: foe.id }); publish(T.requeue, { id: foe.id }); return; }
  if (!arenaDeliver(e, m.roomId, foe)) { publish(T.rollback, { id: foe.id }); publish(T.requeue, { id: foe.id }); e.abort(); }
});
sub<{ id: string }>(T.rollback, (m) => {
  const e = delivered.get(m.id); if (!e) return;
  delivered.delete(m.id); queue.set(m.id, e); e.rollback();
});
sub<{ id: string }>(T.requeue, (m) => {
  const e = queue.get(m.id); if (!e) return;
  addRemote(e).then(() => e.requeue(), (err) => { console.error("Không trả bên về hàng chờ chung", err); queue.delete(m.id); e.abort(); });
});
sub<{ id: string }>(T.abort, (m) => {
  const e = queue.get(m.id); if (!e) return;
  queue.delete(m.id); e.abort();
});

const workerKey = (id: string) => `arena:worker:${id}`;
// Lease sống của tiến trình này: mục hàng chờ của owner hết lease (crash / kill) bị coi là mục ma và bị dọn ở pass().
const beat = () => presenceBackend.putJson(workerKey(presenceBackend.workerId), 1, PRESENCE_TTL_MS);
setInterval(() => { void beat().catch((err) => console.error("Không gia hạn lease worker đấu trường", err)); }, PRESENCE_HEARTBEAT_MS).unref();
async function locked(update: (old: RemoteEntry[]) => RemoteEntry[]) {
  if (!await presenceBackend.withLock<RemoteEntry[]>(QUEUE_KEY, owner(), 5000, (old) => update(old ?? []), 0)) throw new Error("Không lấy được khóa hàng chờ đấu trường");
}
async function addRemote(e: ArenaTeamEntry) {
  await beat();
  await locked((old) => [ ...old.filter((x) => x.id !== e.id),
    { id: e.id, members: e.members.map((m) => ({ ...m, rec: { ...m.rec } })), elo: e.elo, since: e.since, owner: presenceBackend.workerId } ]);
}
const removeRemote = (id: string) => locked((old) => old.filter((x) => x.id !== id));
async function claimRemote(a: string, b: string) {
  let claimed = false;
  await locked((old) => {
    if (old.some((x) => x.id === a) && old.some((x) => x.id === b)) { claimed = true; return old.filter((x) => x.id !== a && x.id !== b); }
    return old;
  });
  return claimed;
}
/** Mục còn hiệu lực: owner là tiến trình này và còn xếp hàng cục bộ, hoặc owner khác còn lease; mục ma bị xóa khỏi hàng chung. */
async function liveRemote(remote: RemoteEntry[]) {
  const others = [...new Set(remote.map((e) => e.owner).filter((o) => o !== presenceBackend.workerId))];
  const leases = await presenceBackend.getJsonMany<number>(others.map(workerKey));
  const alive = new Set(others.filter((_, i) => leases[i] !== null));
  const live = remote.filter((e) => e.owner === presenceBackend.workerId ? queue.has(e.id) : alive.has(e.owner));
  if (live.length < remote.length) {
    const stale = new Set(remote.filter((e) => !live.includes(e)).map((e) => `${e.id}:${e.owner}`));
    await locked((old) => old.filter((x) => !stale.has(`${x.id}:${x.owner}`)))
      .catch((err) => console.error("Không dọn được mục ma của hàng chờ đấu trường", err));
  }
  return live;
}

/** Mục hàng chờ của tài khoản, dùng để hủy / hiển thị trạng thái cho mọi thành viên. */
export const arenaQueued = (accountId: number) => [...queue.values()].find((e) => e.members.some((m) => m.accountId === accountId));
/** Xếp hàng: ném lỗi (đã rollback hàng cục bộ) nếu không ghi được vào hàng chung; phòng gọi báo người chơi. */
export async function arenaEnqueue(e: ArenaTeamEntry) {
  if (shadows.has(e)) return; // bên của tiến trình khác: chủ của nó tự trả về hàng khi nhận tin requeue
  queue.set(e.id, e); pendingRemove.delete(e.id);
  try { await addRemote(e); } catch (err) { if (queue.get(e.id) === e) queue.delete(e.id); throw err; }
  if (queue.get(e.id) !== e) { await removeRemote(e.id).catch((err) => { console.error("Không xóa được hàng chờ đấu trường khỏi presence, sẽ thử lại", err); pendingRemove.add(e.id); startTimer(); }); return; }
  startTimer();
}
/**
 * Đối soát bên của tiến trình này: có ở `queue` mà không có ở hàng chung quá RECONCILE_MS (bị giành nhưng tin found / requeue / abort mất,
 * hoặc tiến trình ghép chết giữa chừng) thì ghi lại vào hàng chung (giữ `since`); không ghi được thì hủy để người chơi không chờ mãi.
 */
const RECONCILE_MS = 10_000;
const missingSince = new Map<string, number>();
function reconcile(raw: RemoteEntry[], now: number) {
  const inRemote = new Set(raw.map((r) => r.id));
  for (const id of missingSince.keys()) if (!queue.has(id) || inRemote.has(id)) missingSince.delete(id);
  for (const [id, e] of queue) {
    if (inRemote.has(id) || pendingRemove.has(id)) continue;
    const t = missingSince.get(id) ?? now; missingSince.set(id, t);
    if (now - t < RECONCILE_MS) continue;
    missingSince.delete(id);
    addRemote(e).catch((err) => { console.error("Không đối soát được hàng chờ đấu trường", err); if (queue.get(id) === e) { queue.delete(id); e.abort(); } });
  }
}
/** Bên đã hủy cục bộ nhưng chưa xóa được khỏi hàng chung (không lấy được khóa): thử lại mỗi nhịp, timer chạy tới khi xóa hết. */
const pendingRemove = new Set<string>();
function startTimer() {
  if (!timer) timer = setInterval(() => {
    for (const id of pendingRemove) removeRemote(id).then(() => { pendingRemove.delete(id); stopTimer(); }, (err) => console.error("Không xóa được hàng chờ đấu trường khỏi presence, thử lại", err));
    if (!busy) void pass().catch((err) => console.error("Lượt ghép Đại Đấu Hồn Trường lỗi", err));
  }, TICK_MS);
}
function stopTimer() { if (!queue.size && !pendingRemove.size && timer) { clearInterval(timer); timer = null; } }
/** Trả bên về hàng sau lỗi ghép rồi báo `requeue`; không ghi được hàng chung thì hủy bên đó. */
function retry(e: ArenaTeamEntry) {
  if (shadows.has(e)) return e.requeue();
  arenaEnqueue(e).then(() => e.requeue(), (err) => { console.error("Không trả bên về hàng chờ đấu trường", err); e.abort(); });
}
/** Bỏ cả bên khỏi hàng chờ; hủy từ một thành viên hủy luôn tổ đội. */
export function arenaDequeue(accountId: number) {
  const e = arenaQueued(accountId);
  const had = e ? queue.delete(e.id) : false;
  if (e) {
    pendingRemove.add(e.id);
    removeRemote(e.id).then(() => { pendingRemove.delete(e.id); stopTimer(); }, (err) => { console.error("Không xóa được hàng chờ đấu trường khỏi presence, sẽ thử lại", err); startTimer(); });
  }
  stopTimer();
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
    const raw = await presenceBackend.getJson<RemoteEntry[]>(QUEUE_KEY) ?? [];
    reconcile(raw, now);
    const remote = await liveRemote(raw);
    const entries = new Map(remote.map((r) => [r.id, queue.get(r.id) ?? shadow(r)] as const));
    const list = [...entries.values()].filter((e) => e.ready()).sort((x, y) => x.since - y.since)
      .map((e) => ({ id: e.id, size: e.members.length, elo: e.elo, wait: (now - e.since) / 1000, last: lastFoe.get(e.id) }));
    const groups = new Map<number, typeof list>();
    for (const item of list) groups.set(item.size, [...(groups.get(item.size) ?? []), item]);
    for (const group of groups.values()) for (const [a, b] of arenaPairs(group)) {
      // Ghép lại đúng đối thủ vừa đấu thì chờ REMATCH_SETTLE_S giây cho người khác kịp xếp hàng (arenaPairs chỉ tránh được khi họ đã có mặt).
      const waited = (id: string) => group.find((x) => x.id === id)!.wait;
      if ((lastFoe.get(a) === b || lastFoe.get(b) === a) && Math.min(waited(a), waited(b)) < REMATCH_SETTLE_S) continue;
      const ea = entries.get(a), eb = entries.get(b); if (!ea || !eb) continue;
      try { if (!await claimRemote(a, b)) continue; } catch (err) { console.error("Không giành được cặp ở hàng chờ đấu trường", err); continue; }
      queue.delete(a); queue.delete(b);
      // Kiểm tra cả hai bên ngay trước khi mở phòng. Nếu một thành viên vừa rời, bên còn nguyên được trả lại queue,
      // bên không còn đủ người nhận tin hủy; không để họ vào một phòng chờ thiếu người rồi bị tính noshow.
      const canA = ea.canFound(), canB = eb.canFound();
      if (!canA || !canB) {
        for (const [e, can] of [[ea, canA], [eb, canB]] as const) {
          if (can && e.ready()) retry(e); else e.abort();
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
            if (can && e.ready()) retry(e); else e.abort();
          }
          continue;
        }
        // canFound() vừa được kiểm tra sau await; found() chỉ còn là guard cuối nếu callback phát hiện phiên lỗi.
        const foundA = arenaDeliver(ea, room.roomId, eb), foundB = arenaDeliver(eb, room.roomId, ea);
        if (!foundA || !foundB) {
          // Guard kép ở trên khiến nhánh này hiếm gặp; hoàn tác bên đã freeze để không tạo trận mồ côi.
          console.error("Không thể báo mã phòng Đại Đấu Hồn Trường cho đủ hai bên");
          arenaMatches.delete(m.id);
          for (const [e, found] of [[ea, foundA], [eb, foundB]] as const) {
            if (found) { delivered.delete(e.id); e.rollback(); }
            if (e.ready()) retry(e); else e.abort();
          }
        }
      } catch (err) {
        console.error("Không mở được phòng Đại Đấu Hồn Trường", err);
        arenaMatches.delete(m.id);
        // Trả nguyên thời gian chờ về queue nếu cả bên vẫn còn hợp lệ.
        for (const e of [ea, eb]) if (e.ready()) retry(e); else e.abort();
      }
    }
  } finally { busy = false; }
}
