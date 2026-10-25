// Tổ đội người chơi (mục 5.9, bước 7.1): mời / chấp nhận / từ chối / rời / đuổi / nhường trưởng nhóm, tối đa PARTY_MAX người.
// Tổ đội sống ở mức tiến trình, xuyên mọi phòng và bản đồ: đi cổng là đổi phòng và đổi sessionId, nên mọi thứ khóa theo accountId.
// Không lưu DB: tắt server thì mọi tổ đội tan. Chạy nhiều tiến trình thì phải chuyển sang presence (Redis), như suất thú vương (mục 6).
// File này chỉ giữ trạng thái và luật. MapRoom gọi các hàm ở đây, rồi phát mỗi PartyNote trả về lên kênh presence PARTY_TOPIC để
// phòng đang giữ người nhận (có thể ở bản đồ khác) gửi lại khung tổ đội và dòng thông báo cho đúng người đó (dữ liệu riêng, mục 6).
import { PARTY_MAX, PARTY_INVITE_SECS, PARTY_OFFLINE_SECS } from "../../shared/data.ts";
import type { RallyMsg } from "../../shared/rally.ts";
import { nameKey } from "./names.ts";
import type { PresenceBackend } from "./presence.ts";

/** Kênh presence: mọi phòng nghe, gửi tin riêng "party" (và log) cho người chơi của mình có trong `to`. */
export const PARTY_TOPIC = "party";
export const PARTY_STATE_TOPIC = "party:state";
/** Kênh presence của dấu "Tập trung ở đây" (R6 #433): chỉ chuyển tiếp tới tài khoản trong `to` (thành viên tổ đội lúc đặt dấu). */
export const RALLY_TOPIC = "party:rally";
/** Dấu tập trung trên presence: `pid` là tổ đội lúc đặt (nơi nhận kiểm lại người nhận còn trong đúng tổ đội đó). */
export interface RallyRoute { to: number[]; pid: number; from: number; msg: RallyMsg; map: string }

/**
 * Người chơi đang trong game (hoặc vừa rời phòng, chờ vào lại / đi cổng trong PARTY_OFFLINE_SECS): phòng đang giữ người đó ghi đè
 * định kỳ (cấp, sinh lực võ hồn ra trận) để khung tổ đội của đồng đội ở bản đồ khác vẫn thấy. `off`: 0 = đang trong phòng, khác 0 =
 * lúc rời phòng (ms).
 */
export interface Live {
  acc: number; name: string; sid: string; mapId: string; roomId: string; ch: number;
  level: number; vh: number; hp: number; maxHp: number; dead: boolean; off: number;
  /** Lúc phòng nhận người (goOnline, ms): tin cập nhật một phần của phiên cũ đến muộn không được ghi đè phiên mới hơn. */
  at?: number;
}
export interface Party { id: number; leader: number; members: number[]; }
/** Một thông báo cho các tài khoản `to`: phòng của họ gửi lại khung tổ đội (luôn) kèm dòng log `text` (nếu có). */
export interface PartyNote { to: number[]; text?: string; col?: string; }
/** Kết quả một thao tác: lỗi (báo riêng cho người gửi, không đổi gì) hoặc các thông báo cần phát. */
export type PartyResult = { error: string } | { notes: PartyNote[] };

const COL = "#7dff8a";
const live = new Map<number, Live>();
const byName = new Map<string, number>();                 // nameKey(tên) -> accountId (người có trong `live`)
const parties = new Map<number, Party>();
const partyOfAcc = new Map<number, number>();             // accountId -> id tổ đội
const invites = new Map<number, Map<number, number>>();   // người được mời -> (người mời -> hết hạn, ms)
let nextParty = 1;
/** Phiên bản trạng thái chung: tăng một ở mỗi lần ghi (remoteMutation, dưới khóa); bản chụp cũ hơn bản đã áp bị bỏ qua. */
let stateVer = 0;
let remote: PresenceBackend | null = null;
const REMOTE_KEY = "party:state";
const REMOTE_TTL_MS = 60_000;
const PARTY_SWEEP_LEASE_KEY = "party:sweep";
const PARTY_SWEEP_INTERVAL_MS = 500;
const PARTY_SWEEP_LEASE_TTL_MS = 1_000;
let nextSweepAt = 0;
let sweepInFlight: Promise<PartyNote[]> | null = null;
export type PartySnapshot = { ver?: number; nextParty: number; live: Record<string, Live>; parties: Record<string, Party>; invites: Record<string, Record<string, number>> };

const snapshot = (): PartySnapshot => ({
  ver: stateVer,
  nextParty,
  live: Object.fromEntries(live),
  parties: Object.fromEntries(parties),
  invites: Object.fromEntries([...invites].map(([acc, m]) => [acc, Object.fromEntries(m)])),
});
export function applySnapshot(s: (PartySnapshot | { live?: Record<string, Live>; parties?: unknown; invites?: unknown }) | null | undefined) {
  if (!s) return;
  const partial = s as { live?: Record<string, Live>; parties?: unknown; invites?: unknown };
  if (!partial.parties && !partial.invites) {
    for (const [acc, value] of Object.entries(partial.live ?? {})) {
      const l = value as Live, cur = live.get(Number(acc));
      if (cur && (l.at ?? 0) < (cur.at ?? 0)) continue; // tin của phiên cũ hơn phiên đang có
      live.set(Number(acc), l); byName.set(nameKey(l.name), Number(acc));
    }
    return;
  }
  const full = s as PartySnapshot;
  // Tin publish đi sau khi nhả khóa nên có thể đến muộn / sai thứ tự: bản cũ hơn bản đã áp thì bỏ (không để trạng thái lùi).
  if (full.ver !== undefined && full.ver < stateVer) return;
  stateVer = Math.max(stateVer, full.ver ?? 0);
  live.clear(); byName.clear(); parties.clear(); partyOfAcc.clear(); invites.clear();
  nextParty = Math.max(1, Number(full.nextParty) || 1);
  for (const [acc, value] of Object.entries(full.live ?? {})) {
    const l = value as Live; live.set(Number(acc), l); byName.set(nameKey(l.name), Number(acc));
  }
  for (const [id, value] of Object.entries(full.parties ?? {})) {
    const p = value as Party; parties.set(Number(id), p); for (const acc of p.members) partyOfAcc.set(acc, p.id);
  }
  for (const [acc, value] of Object.entries(full.invites ?? {})) invites.set(Number(acc), new Map(Object.entries(value).map(([from, exp]) => [Number(from), Number(exp)])));
}
export function configurePresence(backend: PresenceBackend) {
  remote = backend;
  void backend.getJson<PartySnapshot>(REMOTE_KEY).then(applySnapshot).catch((e) => console.error("Không đọc được trạng thái tổ đội từ presence", e));
}
async function remoteMutation<T>(fn: () => T | Promise<T>, publish = true): Promise<T> {
  if (!remote) return fn();
  let result!: T;
  const ok = await remote.withLock<PartySnapshot>(REMOTE_KEY, remote.workerId, 5000, async (old) => {
    applySnapshot(old ?? snapshot()); result = await fn(); stateVer++; return snapshot();
  }, 0);
  if (!ok) throw new Error("Không khóa được trạng thái tổ đội trong presence.");
  if (publish) void remote.presence.publish(PARTY_STATE_TOPIC, snapshot());
  return result;
}

const nameOf = (acc: number) => live.get(acc)?.name ?? "?";
const partyOf = (acc: number) => parties.get(partyOfAcc.get(acc) ?? 0);
const all = (p: Party, text?: string, col = COL): PartyNote => ({ to: [...p.members], text, col });

/** Id tổ đội của tài khoản (0 = không có). Đồ rơi chụp id này lúc rơi (DropState.party). */
export function partyIdOf(acc: number) { return partyOfAcc.get(acc) ?? 0; }
/** Mọi thành viên (accountId) của tổ đội có `acc`, kể cả chính nó; không có tổ đội thì []. */
export function partyMembers(acc: number) { return partyOf(acc)?.members ?? []; }
/** Trưởng nhóm của tổ đội; 0 nếu tài khoản chưa vào tổ đội. */
export function partyLeader(acc: number) { return partyOf(acc)?.leader ?? 0; }
/** Tổ đội đã đủ thành viên đang online trong cùng một phòng bản đồ chưa. */
export function partyInRoom(acc: number, roomId: string) {
  const p = partyOf(acc);
  return !!p && p.members.every((m) => { const l = live.get(m); return !!l && !l.off && l.roomId === roomId; });
}

/**
 * Phòng (kênh) của đồng đội đang trong game ở bản đồ `mapId` (không tính chính `acc`), kèm số đồng đội ở mỗi phòng: vào game, đi
 * cổng ưu tiên kênh có đồng đội (mục 6 "Nhiều kênh").
 */
export function mateRooms(acc: number, mapId: string) {
  const out = new Map<string, number>();
  for (const m of partyOf(acc)?.members ?? []) {
    const l = live.get(m);
    if (m !== acc && l && !l.off && l.mapId === mapId) out.set(l.roomId, (out.get(l.roomId) ?? 0) + 1);
  }
  return out;
}

/**
 * Hồn sư tên `name` đang trong game (đang ở một phòng, không tính người vừa rời chờ vào lại): tài khoản và tên đúng cách viết, cho
 * tin riêng (#188). Không có thì null.
 */
export function onlineByName(name: string) {
  const acc = byName.get(nameKey(name)), l = acc !== undefined ? live.get(acc) : undefined;
  return l && !l.off ? { acc: l.acc, name: l.name } : null;
}

/** Bản đồ và kênh của hồn sư đang trong game (không tính người vừa rời chờ vào lại); không có thì null (bảng bạn bè, #195). */
export function whereIs(acc: number) {
  const l = live.get(acc);
  return l && !l.off ? { mapId: l.mapId, ch: l.ch } : null;
}

/** Phòng `roomId` nhận người chơi (vào game, vào lại, sang bản đồ mới qua cổng). */
function goOnlineLocal(l: Live): PartyNote[] {
  const old = live.get(l.acc);
  if (old && nameKey(old.name) !== nameKey(l.name)) byName.delete(nameKey(old.name));
  live.set(l.acc, l);
  byName.set(nameKey(l.name), l.acc);
  const p = partyOf(l.acc);
  return p ? [all(p)] : [];
}
export async function goOnline(v: Omit<Live, "off">) {
  const l: Live = { ...v, off: 0, at: Date.now() };
  // Ghi heartbeat trước khi vào trạng thái chung: sweep xen giữa không thấy thiếu heartbeat mà đánh dấu người vừa vào là đã rời.
  if (remote) await remote.putJson(`party:live:${l.acc}`, l, REMOTE_TTL_MS);
  return remoteMutation(() => goOnlineLocal(l));
}

/** Cập nhật định kỳ trạng thái hiển thị (cấp, võ hồn ra trận, sinh lực) của người đang trong phòng `sid`. */
export function setLive(acc: number, sid: string, v: Pick<Live, "level" | "vh" | "hp" | "maxHp" | "dead">) {
  const l = live.get(acc); if (!l || l.sid !== sid) return;
  l.level = v.level; l.vh = v.vh; l.hp = v.hp; l.maxHp = v.maxHp; l.dead = v.dead;
  if (remote) void remote.putJson(`party:live:${acc}`, l, REMOTE_TTL_MS).then(() => remote!.presence.publish(PARTY_STATE_TOPIC, { live: { [acc]: l } })).catch((e) => console.error("Không cập nhật trạng thái tổ đội", e));
}

/** Phiên `sid` rời phòng (đi cổng, đóng tab, mất mạng): vẫn trong tổ đội PARTY_OFFLINE_SECS giây (sweep mới loại). */
function goOfflineLocal(acc: number, sid: string, now: number): PartyNote[] {
  const l = live.get(acc); if (!l || l.sid !== sid) return [];
  l.off = now;
  const p = partyOf(acc);
  return p ? [all(p)] : [];
}
export async function goOffline(acc: number, sid: string, now: number) {
  const notes = await remoteMutation(() => goOfflineLocal(acc, sid, now));
  const l = live.get(acc);
  if (remote && l?.sid === sid) await remote.putJson(`party:live:${acc}`, l, REMOTE_TTL_MS);
  return notes;
}

/** Người được mời `name` có hợp lệ không (chưa tốn lượt mời của ratelimit). Trả tài khoản người được mời. */
export function inviteDeny(from: number, name: string, now: number): { error: string } | { target: number } {
  const target = byName.get(nameKey(name)), t = target !== undefined ? live.get(target) : undefined;
  if (target === undefined || !t || t.off) return { error: `Không có hồn sư nào tên "${name}" đang trong game.` };
  if (target === from) return { error: "Không thể tự mời chính mình." };
  const p = partyOf(from);
  if (p && p.members.length >= PARTY_MAX) return { error: `Tổ đội đã đủ ${PARTY_MAX} người.` };
  const tp = partyOfAcc.get(target);
  if (tp && tp === p?.id) return { error: `${t.name} đã ở trong tổ đội của bạn.` };
  if (tp) return { error: `${t.name} đang ở trong một tổ đội khác.` };
  if ((invites.get(target)?.get(from) ?? 0) > now) return { error: `Đã mời ${t.name}, đang chờ trả lời.` };
  return { target };
}

/** Ghi lời mời (sau inviteDeny và ratelimit). */
function addInviteLocal(from: number, target: number, now: number): PartyNote[] {
  let m = invites.get(target);
  if (!m) { m = new Map(); invites.set(target, m); }
  m.set(from, now + PARTY_INVITE_SECS * 1000);
  return [
    { to: [target], text: `${nameOf(from)} mời bạn vào tổ đội: bấm "Vào đội" ở khung tổ đội (hết hạn sau ${PARTY_INVITE_SECS} giây).`, col: COL },
    { to: [from], text: `Đã mời ${nameOf(target)} vào tổ đội.`, col: COL },
  ];
}
export function addInvite(from: number, target: number, now: number) { return remoteMutation(() => addInviteLocal(from, target, now)); }

/** Lời mời của `fromName` gửi `acc` còn hạn: trả tài khoản người mời, đồng thời xóa lời mời đó. */
function takeInvite(acc: number, fromName: string, now: number) {
  const from = byName.get(nameKey(fromName)), m = invites.get(acc);
  const exp = from !== undefined ? m?.get(from) : undefined;
  if (from !== undefined) m?.delete(from);
  if (m && !m.size) invites.delete(acc);
  return exp !== undefined && exp > now ? from! : null;
}

/** Bỏ lời mời của `from` gửi `acc` (chặn, #195); trả true nếu có lời mời để bỏ. */
function dropInviteLocal(acc: number, from: number) {
  const m = invites.get(acc); if (!m?.delete(from)) return false;
  if (!m.size) invites.delete(acc);
  return true;
}
export function dropInvite(acc: number, from: number) { return remoteMutation(() => dropInviteLocal(acc, from)); }

/** Tài khoản người mời của lời mời còn hạn, chỉ đọc để MapRoom kiểm tra khóa hàng chờ trước khi nhận lời. */
export function inviteFrom(acc: number, fromName: string, now: number) {
  const from = byName.get(nameKey(fromName)), exp = from !== undefined ? invites.get(acc)?.get(from) : undefined;
  return from !== undefined && exp !== undefined && exp > now ? from : null;
}

/** `acc` nhận lời mời của `fromName`: vào tổ đội của người mời (người mời chưa có tổ đội thì lập mới, người mời làm trưởng nhóm). */
function acceptLocal(acc: number, fromName: string, now: number): PartyResult {
  const from = takeInvite(acc, fromName, now);
  if (from === null || !live.has(from)) return { error: "Lời mời không còn hiệu lực." };
  if (partyOfAcc.has(acc)) return { error: "Bạn đang ở trong tổ đội: rời tổ đội trước khi vào đội khác." };
  let p = partyOf(from);
  if (p && p.members.length >= PARTY_MAX) return { error: `Tổ đội của ${nameOf(from)} đã đủ ${PARTY_MAX} người.` };
  if (!p) { p = { id: nextParty++, leader: from, members: [from] }; parties.set(p.id, p); partyOfAcc.set(from, p.id); }
  p.members.push(acc); partyOfAcc.set(acc, p.id);
  invites.delete(acc); // đã vào đội: các lời mời khác hết tác dụng
  return { notes: [all(p, `${nameOf(acc)} đã vào tổ đội (${p.members.length}/${PARTY_MAX}).`)] };
}
export function accept(acc: number, fromName: string, now: number) { return remoteMutation(() => acceptLocal(acc, fromName, now)); }

/** `acc` từ chối lời mời của `fromName`. */
function declineLocal(acc: number, fromName: string, now: number): PartyResult {
  const from = takeInvite(acc, fromName, now);
  if (from === null) return { notes: [{ to: [acc] }] }; // đã hết hạn: chỉ vẽ lại khung
  return { notes: [{ to: [acc] }, { to: [from], text: `${nameOf(acc)} từ chối lời mời vào tổ đội.`, col: "#ffb35c" }] };
}
export function decline(acc: number, fromName: string, now: number) { return remoteMutation(() => declineLocal(acc, fromName, now)); }

/**
 * Đưa `acc` ra khỏi tổ đội. Trưởng nhóm rời thì người vào sớm nhất còn lại làm trưởng nhóm; còn 1 người thì tổ đội giải tán.
 * `why`: tự rời, bị đuổi, rời game quá lâu.
 */
function remove(acc: number, why: "leave" | "kick" | "timeout"): PartyNote[] {
  const p = partyOf(acc); if (!p) return [];
  p.members = p.members.filter((m) => m !== acc); partyOfAcc.delete(acc);
  const name = nameOf(acc), notes: PartyNote[] = [];
  notes.push({ to: [acc], text: why === "kick" ? "Bạn bị trưởng nhóm mời ra khỏi tổ đội." : why === "timeout" ? "Bạn rời game quá lâu nên đã ra khỏi tổ đội." : "Bạn đã rời tổ đội.", col: "#ffb35c" });
  const reason = why === "kick" ? `${name} bị trưởng nhóm mời ra khỏi tổ đội.` : why === "timeout" ? `${name} rời game quá lâu, đã ra khỏi tổ đội.` : `${name} đã rời tổ đội.`;
  if (p.members.length <= 1) {
    for (const m of p.members) partyOfAcc.delete(m);
    parties.delete(p.id);
    notes.push({ to: [...p.members], text: `${reason} Tổ đội đã giải tán.`, col: "#ffb35c" });
    return notes;
  }
  let lead = "";
  if (p.leader === acc) { p.leader = p.members[0]; lead = ` ${nameOf(p.leader)} trở thành trưởng nhóm.`; }
  notes.push(all(p, reason + lead));
  return notes;
}

function leaveLocal(acc: number): PartyResult {
  if (!partyOfAcc.has(acc)) return { error: "Bạn không ở trong tổ đội nào." };
  return { notes: remove(acc, "leave") };
}
export function leave(acc: number) { return remoteMutation(() => leaveLocal(acc)); }

/** Thành viên `name` trong tổ đội của trưởng nhóm `leader` (lỗi nếu không phải trưởng nhóm hoặc không có người đó). */
function leaderTarget(leader: number, name: string, what: string): { error: string } | { target: number; p: Party } {
  const p = partyOf(leader);
  if (!p) return { error: "Bạn không ở trong tổ đội nào." };
  if (p.leader !== leader) return { error: `Chỉ trưởng nhóm mới ${what}.` };
  const target = p.members.find((m) => nameKey(nameOf(m)) === nameKey(name));
  if (target === undefined) return { error: `${name} không ở trong tổ đội của bạn.` };
  if (target === leader) return { error: "Chọn một thành viên khác." };
  return { target, p };
}

/** Trưởng nhóm đuổi thành viên `name`. */
function kickLocal(leader: number, name: string): PartyResult {
  const r = leaderTarget(leader, name, "mời thành viên ra khỏi đội được");
  return "error" in r ? r : { notes: remove(r.target, "kick") };
}
export function kick(leader: number, name: string) { return remoteMutation(() => kickLocal(leader, name)); }

/** Trưởng nhóm nhường trưởng nhóm cho thành viên `name`. */
function promoteLocal(leader: number, name: string): PartyResult {
  const r = leaderTarget(leader, name, "nhường trưởng nhóm được");
  if ("error" in r) return r;
  r.p.leader = r.target;
  return { notes: [all(r.p, `${nameOf(r.target)} trở thành trưởng nhóm.`)] };
}
export function promote(leader: number, name: string) { return remoteMutation(() => promoteLocal(leader, name)); }

/** Dọn định kỳ: lời mời hết hạn, người rời game quá PARTY_OFFLINE_SECS giây thì ra khỏi tổ đội và khỏi danh sách đang trong game. */
function sweepLocal(now: number): PartyNote[] {
  const notes: PartyNote[] = [];
  for (const [acc, m] of invites) {
    let gone = false;
    for (const [from, exp] of m) if (exp <= now) { m.delete(from); gone = true; }
    if (!m.size) invites.delete(acc);
    if (gone) notes.push({ to: [acc] });
  }
  for (const [acc, l] of live) {
    if (!l.off || now - l.off < PARTY_OFFLINE_SECS * 1000) continue;
    notes.push(...remove(acc, "timeout"));
    live.delete(acc);
    if (byName.get(nameKey(l.name)) === acc) byName.delete(nameKey(l.name));
    invites.delete(acc);
  }
  return notes;
}
export async function sweep(now: number): Promise<PartyNote[]> {
  if (!remote) return sweepLocal(now);
  if (sweepInFlight) return sweepInFlight;
  if (now < nextSweepAt) return [];
  nextSweepAt = now + PARTY_SWEEP_INTERVAL_MS;
  const backend = remote;
  const run = (async () => {
    // Giữ lease tới hết chu kỳ để nhiều phòng / tiến trình không cùng quét và phát snapshot.
    const owner = `${backend.workerId}:party-sweep`;
    if (!await backend.acquireLease(PARTY_SWEEP_LEASE_KEY, owner, PARTY_SWEEP_LEASE_TTL_MS)) return [];
    const notes = await remoteMutation(async () => {
      const members = [...live.values()];
      const heartbeats = await backend.getJsonMany<Live>(members.map((l) => `party:live:${l.acc}`));
      for (let i = 0; i < members.length; i++) {
        const l = members[i], heartbeat = heartbeats[i];
        if (heartbeat?.sid === l.sid) Object.assign(l, heartbeat);
        else if (!heartbeat && !l.off) l.off = now - PARTY_OFFLINE_SECS * 1000;
      }
      return sweepLocal(now);
    }, false);
    if (notes.length) void backend.presence.publish(PARTY_STATE_TOPIC, snapshot());
    return notes;
  })();
  sweepInFlight = run.finally(() => { sweepInFlight = null; });
  return sweepInFlight;
}

/**
 * Khung tổ đội của `acc` (tin riêng "party", chỉ gửi chính chủ): thành viên theo thứ tự vào đội, ai là trưởng nhóm, đang ở bản đồ
 * nào, cấp / võ hồn / sinh lực võ hồn ra trận, rời game chưa; `sid` chỉ có với người cùng phòng `roomId` (đánh dấu trên bản đồ
 * nhỏ). Kèm lời mời đang chờ (tên người mời, giây còn lại). `key`: nội dung trừ số giây, để phòng chỉ gửi lại khi đổi.
 */
export function partyView(acc: number, roomId: string, now: number) {
  const p = partyOf(acc);
  const members = (p?.members ?? []).map((m) => {
    const l = live.get(m);
    return { name: l?.name ?? "?", leader: m === p!.leader, me: m === acc, sid: l && !l.off && l.roomId === roomId ? l.sid : "",
      map: l?.mapId ?? "", ch: l?.ch ?? 0, level: l?.level ?? 0, vh: l?.vh ?? 0, hp: l?.hp ?? 0, maxHp: l?.maxHp ?? 0, dead: !!l?.dead, off: !l || l.off > 0 };
  });
  const inv = [...(invites.get(acc) ?? [])].filter(([, exp]) => exp > now).map(([from, exp]) => ({ name: nameOf(from), secs: Math.ceil((exp - now) / 1000) }));
  const view = { id: p?.id ?? 0, max: PARTY_MAX, members, invites: inv };
  return { view, key: JSON.stringify([view.id, members, inv.map((i) => i.name)]) };
}

/** Hook kiểm thử: đẩy lùi lúc rời game của `acc` `s` giây (thử loại người rời game quá lâu mà không phải chờ). */
export async function _ageOffline(name: string, s: number) {
  const l = live.get(byName.get(nameKey(name)) ?? -1); if (!l?.off) return false;
  l.off -= s * 1000;
  if (remote) {
    await remote.putJson(`party:live:${l.acc}`, l, REMOTE_TTL_MS);
    await remote.putJson(REMOTE_KEY, snapshot());
  }
  return true;
}
