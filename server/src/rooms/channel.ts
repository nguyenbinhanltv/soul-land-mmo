// Kênh của phòng bản đồ (mục 6 "Nhiều kênh", miền D2, #702): registry kênh dùng chung qua presence (`takeChannel` / `touchChannel` / `releaseChannel`, khóa `channels:<mapId>`, TTL tự dọn),
// kênh vừa rời (`leftLock`, đọc presence rồi Map `leftRoom` ở procState.ts), danh sách kênh đang mở (`listChannels`, matchMaker) và chọn kênh vào (`pickChannel`).
// Nguyên văn từ MapRoom (không đổi khóa presence / thứ tự ghi / TTL / `withLock`). Module lá: không import MapRoom.
import { ServerError, matchMaker } from "colyseus";
import { presenceBackend, bg } from "../presence.ts";
import * as party from "../party.ts";
import { leftRoom } from "./procState.ts";
import { channelLeftKey } from "./common.ts";

/** Registry kênh dùng chung: TTL tự dọn số của phòng chết, lock chống hai tiến trình cùng cấp một số. */
const CHANNEL_TTL_MS = 60_000;
type ChannelLease = { roomId: string; owner: string; ch: number; expiresAt: number };
type ChannelRegistry = Record<string, ChannelLease>;
const channelKey = (mapId: string) => `channels:${mapId}`;
export async function takeChannel(mapId: string, roomId: string) {
  const owner = `${presenceBackend.workerId}:${roomId}`;
  let chosen = 0;
  const ok = await presenceBackend.withLock<ChannelRegistry>(channelKey(mapId), owner, 5000, (old) => {
    const now = Date.now(), next = old ?? {};
    for (const [ch, lease] of Object.entries(next)) if (lease.expiresAt <= now) delete next[ch];
    const used = new Set(Object.keys(next).map(Number));
    chosen = 1; while (used.has(chosen)) chosen++;
    next[String(chosen)] = { roomId, owner, ch: chosen, expiresAt: now + CHANNEL_TTL_MS };
    return next;
  }, CHANNEL_TTL_MS);
  if (!ok || !chosen) throw new ServerError(503, "Không cấp được kênh, hãy thử lại sau.");
  return chosen;
}
export async function touchChannel(mapId: string, roomId: string, ch: number) {
  const owner = `${presenceBackend.workerId}:${roomId}`;
  await presenceBackend.withLock<ChannelRegistry>(channelKey(mapId), owner, 5000, (old) => {
    const next = old ?? {}, found = next[String(ch)];
    if (found?.roomId === roomId && found.owner === owner) found.expiresAt = Date.now() + CHANNEL_TTL_MS;
    return next;
  }, CHANNEL_TTL_MS);
}
export async function releaseChannel(mapId: string, roomId: string, ch: number) {
  const owner = `${presenceBackend.workerId}:${roomId}`;
  await presenceBackend.withLock<ChannelRegistry>(channelKey(mapId), owner, 5000, (old) => {
    const next = old ?? {}, found = next[String(ch)];
    if (found?.roomId === roomId && found.owner === owner) delete next[String(ch)];
    return next;
  }, CHANNEL_TTL_MS);
}
/** Kênh vừa rời của tài khoản ở bản đồ `mapId` nếu còn khóa và kênh đó còn mở, còn chỗ (trong `list`). */
export async function leftLock(accountId: number, mapId: string, list: ChannelInfo[]) {
  // Redis: sổ presence dùng chung là nguồn duy nhất (Map RAM của tiến trình khác / lần đi cổng trước có thể đã cũ, chặn nhầm); RAM: presence chính là Map.
  const shared = await presenceBackend.getJson<{ mapId: string; roomId: string; ch: number; until: number; travel?: boolean }>(channelLeftKey(accountId));
  const l = presenceBackend.mode === "redis" ? shared : shared ?? leftRoom.get(accountId);
  if (!l || l.until <= Date.now()) { leftRoom.delete(accountId); bg(presenceBackend.delete(channelLeftKey(accountId)), "presence"); return null; }
  leftRoom.set(accountId, l);
  return l.mapId === mapId ? list.find((c) => c.roomId === l.roomId && !c.full) ?? null : null;
}
/** Một kênh đang mở: phòng, số kênh, số người (gồm chỗ đã giữ cho người đang vào), tối đa, đầy chưa. */
export interface ChannelInfo { roomId: string; ch: number; n: number; max: number; full: boolean; }
/** Các kênh đang mở của bản đồ `mapId` (danh sách phòng của matchMaker), theo số kênh. */
export async function listChannels(mapId: string): Promise<ChannelInfo[]> {
  const rooms = await matchMaker.query({ name: "map", mapId } as Parameters<typeof matchMaker.query>[0]);
  return rooms.map((r) => ({ roomId: r.roomId, ch: Number(r.metadata?.channel) || 0, n: r.clients, max: r.maxClients, full: r.locked || r.clients >= r.maxClients }))
    .filter((c) => c.ch > 0).sort((a, b) => a.ch - b.ch);
}
/**
 * Kênh để vào bản đồ `mapId` (vào game, đi cổng): vừa rời một kênh của bản đồ này chưa quá CHANNEL_CD giây thì về đúng kênh đó
 * (leftLock); không thì kênh còn chỗ có nhiều đồng đội tổ đội nhất, rồi kênh còn chỗ ít người nhất (bằng nhau thì số kênh nhỏ hơn).
 * Mọi kênh đều đầy thì null: client joinOrCreate và Colyseus mở kênh mới.
 */
export async function pickChannel(accountId: number, mapId: string): Promise<ChannelInfo | null> {
  const list = await listChannels(mapId), back = await leftLock(accountId, mapId, list);
  if (back) return back;
  const open = list.filter((c) => !c.full), mates = party.mateRooms(accountId, mapId);
  open.sort((a, b) => (mates.get(b.roomId) ?? 0) - (mates.get(a.roomId) ?? 0) || a.n - b.n || a.ch - b.ch);
  return open[0] ?? null;
}
