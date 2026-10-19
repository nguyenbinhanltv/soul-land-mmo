// Tổ đội người chơi (mục 5.9, bước 7.1): mời / chấp nhận / từ chối / rời / đuổi / nhường trưởng nhóm, tối đa PARTY_MAX người.
// Tổ đội sống ở mức tiến trình, xuyên mọi phòng và bản đồ: đi cổng là đổi phòng và đổi sessionId, nên mọi thứ khóa theo accountId.
// Không lưu DB: tắt server thì mọi tổ đội tan. Chạy nhiều tiến trình thì phải chuyển sang presence (Redis), như suất thú vương (mục 6).
// File này chỉ giữ trạng thái và luật. MapRoom gọi các hàm ở đây, rồi phát mỗi PartyNote trả về lên kênh presence PARTY_TOPIC để
// phòng đang giữ người nhận (có thể ở bản đồ khác) gửi lại khung tổ đội và dòng thông báo cho đúng người đó (dữ liệu riêng, mục 6).
import { PARTY_MAX, PARTY_INVITE_SECS, PARTY_OFFLINE_SECS } from "../../shared/data.ts";
import { nameKey } from "./names.ts";

/** Kênh presence: mọi phòng nghe, gửi tin riêng "party" (và log) cho người chơi của mình có trong `to`. */
export const PARTY_TOPIC = "party";

/**
 * Người chơi đang trong game (hoặc vừa rời phòng, chờ vào lại / đi cổng trong PARTY_OFFLINE_SECS): phòng đang giữ người đó ghi đè
 * định kỳ (cấp, sinh lực võ hồn ra trận) để khung tổ đội của đồng đội ở bản đồ khác vẫn thấy. `off`: 0 = đang trong phòng, khác 0 =
 * lúc rời phòng (ms).
 */
export interface Live {
  acc: number; name: string; sid: string; mapId: string; roomId: string;
  level: number; vh: number; hp: number; maxHp: number; dead: boolean; off: number;
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

const nameOf = (acc: number) => live.get(acc)?.name ?? "?";
const partyOf = (acc: number) => parties.get(partyOfAcc.get(acc) ?? 0);
const all = (p: Party, text?: string, col = COL): PartyNote => ({ to: [...p.members], text, col });

/** Id tổ đội của tài khoản (0 = không có). Đồ rơi chụp id này lúc rơi (DropState.party). */
export function partyIdOf(acc: number) { return partyOfAcc.get(acc) ?? 0; }
/** Mọi thành viên (accountId) của tổ đội có `acc`, kể cả chính nó; không có tổ đội thì []. */
export function partyMembers(acc: number) { return partyOf(acc)?.members ?? []; }

/** Phòng `roomId` nhận người chơi (vào game, vào lại, sang bản đồ mới qua cổng). */
export function goOnline(l: Omit<Live, "off">): PartyNote[] {
  const old = live.get(l.acc);
  if (old && nameKey(old.name) !== nameKey(l.name)) byName.delete(nameKey(old.name));
  live.set(l.acc, { ...l, off: 0 });
  byName.set(nameKey(l.name), l.acc);
  const p = partyOf(l.acc);
  return p ? [all(p)] : [];
}

/** Cập nhật định kỳ trạng thái hiển thị (cấp, võ hồn ra trận, sinh lực) của người đang trong phòng `sid`. */
export function setLive(acc: number, sid: string, v: Pick<Live, "level" | "vh" | "hp" | "maxHp" | "dead">) {
  const l = live.get(acc); if (!l || l.sid !== sid) return;
  l.level = v.level; l.vh = v.vh; l.hp = v.hp; l.maxHp = v.maxHp; l.dead = v.dead;
}

/** Phiên `sid` rời phòng (đi cổng, đóng tab, mất mạng): vẫn trong tổ đội PARTY_OFFLINE_SECS giây (sweep mới loại). */
export function goOffline(acc: number, sid: string, now: number): PartyNote[] {
  const l = live.get(acc); if (!l || l.sid !== sid) return [];
  l.off = now;
  const p = partyOf(acc);
  return p ? [all(p)] : [];
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
export function addInvite(from: number, target: number, now: number): PartyNote[] {
  let m = invites.get(target);
  if (!m) { m = new Map(); invites.set(target, m); }
  m.set(from, now + PARTY_INVITE_SECS * 1000);
  return [
    { to: [target], text: `${nameOf(from)} mời bạn vào tổ đội: bấm "Vào đội" ở khung tổ đội (hết hạn sau ${PARTY_INVITE_SECS} giây).`, col: COL },
    { to: [from], text: `Đã mời ${nameOf(target)} vào tổ đội.`, col: COL },
  ];
}

/** Lời mời của `fromName` gửi `acc` còn hạn: trả tài khoản người mời, đồng thời xóa lời mời đó. */
function takeInvite(acc: number, fromName: string, now: number) {
  const from = byName.get(nameKey(fromName)), m = invites.get(acc);
  const exp = from !== undefined ? m?.get(from) : undefined;
  if (from !== undefined) m?.delete(from);
  if (m && !m.size) invites.delete(acc);
  return exp !== undefined && exp > now ? from! : null;
}

/** `acc` nhận lời mời của `fromName`: vào tổ đội của người mời (người mời chưa có tổ đội thì lập mới, người mời làm trưởng nhóm). */
export function accept(acc: number, fromName: string, now: number): PartyResult {
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

/** `acc` từ chối lời mời của `fromName`. */
export function decline(acc: number, fromName: string, now: number): PartyResult {
  const from = takeInvite(acc, fromName, now);
  if (from === null) return { notes: [{ to: [acc] }] }; // đã hết hạn: chỉ vẽ lại khung
  return { notes: [{ to: [acc] }, { to: [from], text: `${nameOf(acc)} từ chối lời mời vào tổ đội.`, col: "#ffb35c" }] };
}

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

export function leave(acc: number): PartyResult {
  if (!partyOfAcc.has(acc)) return { error: "Bạn không ở trong tổ đội nào." };
  return { notes: remove(acc, "leave") };
}

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
export function kick(leader: number, name: string): PartyResult {
  const r = leaderTarget(leader, name, "mời thành viên ra khỏi đội được");
  return "error" in r ? r : { notes: remove(r.target, "kick") };
}

/** Trưởng nhóm nhường trưởng nhóm cho thành viên `name`. */
export function promote(leader: number, name: string): PartyResult {
  const r = leaderTarget(leader, name, "nhường trưởng nhóm được");
  if ("error" in r) return r;
  r.p.leader = r.target;
  return { notes: [all(r.p, `${nameOf(r.target)} trở thành trưởng nhóm.`)] };
}

/** Dọn định kỳ: lời mời hết hạn, người rời game quá PARTY_OFFLINE_SECS giây thì ra khỏi tổ đội và khỏi danh sách đang trong game. */
export function sweep(now: number): PartyNote[] {
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
      map: l?.mapId ?? "", level: l?.level ?? 0, vh: l?.vh ?? 0, hp: l?.hp ?? 0, maxHp: l?.maxHp ?? 0, dead: !!l?.dead, off: !l || l.off > 0 };
  });
  const inv = [...(invites.get(acc) ?? [])].filter(([, exp]) => exp > now).map(([from, exp]) => ({ name: nameOf(from), secs: Math.ceil((exp - now) / 1000) }));
  const view = { id: p?.id ?? 0, max: PARTY_MAX, members, invites: inv };
  return { view, key: JSON.stringify([view.id, members, inv.map((i) => i.name)]) };
}

/** Hook kiểm thử: đẩy lùi lúc rời game của `acc` `s` giây (thử loại người rời game quá lâu mà không phải chờ). */
export function _ageOffline(name: string, s: number) {
  const l = live.get(byName.get(nameKey(name)) ?? -1); if (l?.off) l.off -= s * 1000;
  return !!l?.off;
}
