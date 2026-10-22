// Bạn bè và chặn (mục 5.9 "Bạn bè", #195). Mỗi người tự thêm vào danh sách của mình (tối đa FRIEND_MAX), chỉ khi hai bên đã thêm
// nhau mới thấy nhau đang online và ở bản đồ / kênh nào. Chặn (tối đa BLOCK_MAX) lọc tin riêng, lời mời tổ đội, lời thêm bạn và chat
// bản đồ / tổ đội / thế giới của người bị chặn; chặn thì tự bỏ người đó khỏi danh sách bạn bè.
// File này giữ danh sách của người đang trong game (mức tiến trình, khóa theo accountId; nạp ở onAuth, bỏ khi rời phòng) và luật.
// MapRoom ghi DB phần của chính người gửi qua chuỗi lưu (không ghi chéo tài khoản khác), rồi phát mỗi FriendNote lên presence
// FRIEND_TOPIC để phòng đang giữ người nhận (có thể ở bản đồ khác) gửi lại bảng bạn bè. Chạy nhiều tiến trình thì phải chuyển sang
// presence (Redis), như tổ đội (party.ts, mục 6).
import { FRIEND_MAX, BLOCK_MAX } from "../../shared/data.ts";
import { nameKey } from "./names.ts";
import type { SocialPeer, SocialRow } from "./db.ts";

/** Kênh presence: mọi phòng nghe, gửi lại tin riêng "friends" (và log) cho người chơi của mình có trong `to`. */
export const FRIEND_TOPIC = "friend";

/** Danh sách của một người đang trong game: bạn bè / chặn (tài khoản -> tên), `fans`: tài khoản đã thêm người này làm bạn. */
interface Social { sid: string; name: string; friends: Map<number, string>; blocks: Map<number, string>; fans: Set<number>; }
/**
 * Thông báo cho các tài khoản `to`: phòng của họ gửi lại bảng bạn bè (luôn), kèm dòng log `text` (nếu có). `added`: `acc` vừa thêm
 * người nhận vào danh sách bạn bè (người nhận đã chặn `acc` thì phòng bỏ phần này, mục 5.9).
 */
export interface FriendNote { to: number[]; text?: string; added?: { acc: number; name: string } }
/** Kết quả một thao tác: lỗi (báo riêng người gửi, không đổi gì), hoặc lần ghi DB của chính người gửi và các thông báo cần phát. */
export type FriendResult = { error: string } | { write: { other: number; friend?: boolean; block?: boolean }; notes: FriendNote[] };
/** Một mục trong bảng bạn bè gửi cho chính chủ: `map` / `ch` chỉ có khi hai bên đã thêm nhau và người đó đang trong game. */
export interface FriendEntry { name: string; mutual: boolean; map?: string; ch?: number; }

const social = new Map<number, Social>();

/** Phòng nhận người chơi (onJoin): giữ danh sách vừa nạp từ DB (onAuth, sau lần ghi cuối của phiên cũ). */
export function enter(acc: number, sid: string, name: string, row: SocialRow) {
  social.set(acc, { sid, name, friends: new Map(row.friends.map((p) => [p.id, p.name])), blocks: new Map(row.blocks.map((p) => [p.id, p.name])),
    fans: new Set(row.fans) });
}

/** Phiên `sid` rời phòng: bỏ danh sách khỏi RAM (phòng mới nạp lại từ DB). */
export function leave(acc: number, sid: string) { if (social.get(acc)?.sid === sid) social.delete(acc); }

/** `by` đang trong game và đã chặn `who`. */
export function blocked(by: number, who: number) { return !!social.get(by)?.blocks.has(who); }

/**
 * `a` và `b` đã thêm nhau chưa, nhìn từ phía `a` (đang trong game): `a` có `b`, và `b` có `a` (đọc danh sách của `b` nếu `b` đang
 * trong game, không thì theo `fans` của `a` nạp từ DB và cập nhật khi người khác thêm / bỏ).
 */
function mutual(a: number, b: number) {
  const s = social.get(a), o = social.get(b);
  return !!s?.friends.has(b) && (o ? o.friends.has(a) : s.fans.has(b));
}

/**
 * Người đang trong game đã thêm nhau với `acc` (`acc` đang trong game): cần gửi lại bảng bạn bè khi `acc` vào / rời game, đổi bản đồ /
 * kênh. Chỉ duyệt danh sách của `acc` (tối đa FRIEND_MAX), không duyệt mọi người đang online.
 */
export function mutualOnline(acc: number) { return [...(social.get(acc)?.friends.keys() ?? [])].filter((o) => !!social.get(o)?.friends.has(acc)); }

/** Hồn sư tên `name` có trong danh sách bạn bè hoặc chặn của `acc` (tra không cần DB). */
export function known(acc: number, name: string): SocialPeer | null {
  const s = social.get(acc), key = nameKey(name);
  for (const m of [s?.friends, s?.blocks]) for (const [id, n] of m ?? []) if (nameKey(n) === key) return { id, name: n };
  return null;
}

/** Tìm `name` trong `m` (theo nameKey). */
function find(m: Map<number, string>, name: string): SocialPeer | null {
  const key = nameKey(name);
  for (const [id, n] of m) if (nameKey(n) === key) return { id, name: n };
  return null;
}

/** `acc` thêm `t` vào danh sách bạn bè của mình; `t` nhận lời "X đã thêm bạn…" (trừ khi `t` đã chặn `acc`). */
export function add(acc: number, t: SocialPeer): FriendResult {
  const s = social.get(acc); if (!s) return { error: "Chưa nạp xong danh sách bạn bè, thử lại sau giây lát." };
  if (t.id === acc) return { error: "Không thể tự thêm chính mình vào danh sách bạn bè." };
  if (s.friends.has(t.id)) return { error: `${t.name} đã có trong danh sách bạn bè.` };
  if (s.blocks.has(t.id)) return { error: `Bạn đang chặn ${t.name}: bỏ chặn trước rồi mới thêm bạn.` };
  if (s.friends.size >= FRIEND_MAX) return { error: `Danh sách bạn bè đã đủ ${FRIEND_MAX} người: xóa bớt rồi thêm.` };
  s.friends.set(t.id, t.name);
  social.get(t.id)?.fans.add(acc);
  return { write: { other: t.id, friend: true }, notes: [
    { to: [acc], text: `Đã thêm ${t.name} vào danh sách bạn bè.` },
    { to: [t.id], added: { acc, name: s.name } },
  ] };
}

/** `acc` bỏ `name` khỏi danh sách bạn bè của mình; người kia (nếu đang trong game) chỉ được gửi lại bảng, không báo. */
export function remove(acc: number, name: string): FriendResult {
  const s = social.get(acc), t = s && find(s.friends, name);
  if (!s || !t) return { error: `${name} không có trong danh sách bạn bè.` };
  s.friends.delete(t.id);
  social.get(t.id)?.fans.delete(acc);
  return { write: { other: t.id, friend: false }, notes: [{ to: [acc], text: `Đã xóa ${t.name} khỏi danh sách bạn bè.` }, { to: [t.id] }] };
}

/** `acc` chặn `t` (tự bỏ khỏi danh sách bạn bè của `acc`); người bị chặn không được báo, chỉ được gửi lại bảng. */
export function block(acc: number, t: SocialPeer): FriendResult {
  const s = social.get(acc); if (!s) return { error: "Chưa nạp xong danh sách chặn, thử lại sau giây lát." };
  if (t.id === acc) return { error: "Không thể tự chặn chính mình." };
  if (s.blocks.has(t.id)) return { error: `${t.name} đã ở trong danh sách chặn.` };
  if (s.blocks.size >= BLOCK_MAX) return { error: `Danh sách chặn đã đủ ${BLOCK_MAX} người: bỏ chặn bớt rồi chặn.` };
  s.blocks.set(t.id, t.name);
  if (s.friends.delete(t.id)) social.get(t.id)?.fans.delete(acc);
  return { write: { other: t.id, block: true }, notes: [
    { to: [acc], text: `Đã chặn ${t.name}: không nhận tin, lời mời tổ đội, lời thêm bạn của người này.` }, { to: [t.id] },
  ] };
}

/** `acc` bỏ chặn `name`. */
export function unblock(acc: number, name: string): FriendResult {
  const s = social.get(acc), t = s && find(s.blocks, name);
  if (!s || !t) return { error: `${name} không có trong danh sách chặn.` };
  s.blocks.delete(t.id);
  return { write: { other: t.id, block: false }, notes: [{ to: [acc], text: `Đã bỏ chặn ${t.name}.` }] };
}

/**
 * Bảng bạn bè của `acc` (tin riêng "friends"): mỗi bạn kèm đã thêm nhau chưa; bản đồ / kênh (`where`, null = không trong game) chỉ
 * có khi đã thêm nhau. Danh sách chặn là tên.
 */
export function view(acc: number, where: (acc: number) => { mapId: string; ch: number } | null) {
  const s = social.get(acc);
  const list: FriendEntry[] = [...(s?.friends ?? [])].map(([id, name]) => {
    const m = mutual(acc, id), w = m ? where(id) : null;
    return { name, mutual: m, ...(w ? { map: w.mapId, ch: w.ch } : {}) };
  });
  return { list, blocks: [...(s?.blocks.values() ?? [])] };
}

/** `acc` đã có `other` trong danh sách bạn bè. */
export function has(acc: number, other: number) { return !!social.get(acc)?.friends.has(other); }
