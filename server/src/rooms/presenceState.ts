// Trạng thái dùng chung QUA PRESENCE / Redis của các phòng bản đồ (miền D2, #702): thú vương theo bản đồ (`loadKingState` / `persistKingSeat` / `takeKingSeat`, khóa `king:<mapId>`), khóa thưởng
// tinh anh nhiều kênh (`loadEliteLocks` / `persistEliteLock`, khóa `elite:<key>`, chủ đề `presence:elite-lock`), danh sách mua lại (`editBuyback` / `claimBuyback`, khóa `buyback:<acc>`).
// Nguyên văn từ MapRoom (không đổi khóa presence / REDIS_PREFIX / thứ tự ghi / TTL / `withLock`); các Map ở procState.ts (MỘT thể hiện). Module lá: không import MapRoom.
import { randomUUID } from "node:crypto";
import { ServerError } from "colyseus";
import { KING, WORLD, ELITE, BOSSES } from "../../../shared/data.ts";
import { presenceBackend } from "../presence.ts";
import { eliteLocks, applyKingDoc, kingClaimCache, kingSeats, dropKingClaims, buybacks, type KingSeat, type KingDoc, type Buyback } from "./procState.ts";
import { buybackKey } from "./common.ts";

const kingKey = (mapId: string) => `king:${mapId}`;
const KING_STATE_TTL_MS = (Math.max(KING.lifeSecs, WORLD.lifeSecs) + 120) * 1000;
export const ELITE_LOCK_TOPIC = "presence:elite-lock";
const ELITE_STATE_TTL_MS = (ELITE.lock + 60) * 1000;
/** Nạp khóa thưởng tinh anh của bản đồ từ presence (phòng mới mở / tiến trình mới bật chưa nghe tin nào), gộp giữ mốc muộn hơn. */
export async function loadEliteLocks(mapId: string) {
  const keys = BOSSES.map((b) => `${mapId}|${b.id}`);
  const docs = await presenceBackend.getJsonMany<Record<string, number>>(keys.map((k) => `elite:${k}`));
  docs.forEach((doc, i) => {
    if (!doc) return;
    const m = eliteLocks.get(keys[i]) ?? new Map<number, number>();
    for (const [acc, until] of Object.entries(doc)) m.set(Number(acc), Math.max(m.get(Number(acc)) ?? 0, Number(until)));
    if (m.size) eliteLocks.set(keys[i], m);
  });
}
export async function persistEliteLock(key: string, changes: Map<number, number>) {
  const owner = `${presenceBackend.workerId}:elite:${key}`;
  let merged: Record<string, number> = {};
  await presenceBackend.withLock<Record<string, number>>(`elite:${key}`, owner, 5000, (old) => {
    merged = { ...(old ?? {}) };
    for (const [acc, until] of changes) merged[String(acc)] = until;
    return merged;
  }, ELITE_STATE_TTL_MS);
  void presenceBackend.presence.publish(ELITE_LOCK_TOPIC, { key, values: merged });
}
export async function loadKingState(mapId: string) { applyKingDoc(mapId, await presenceBackend.getJson<KingDoc>(kingKey(mapId))); }
export async function persistKingSeat(mapId: string, slot: number, seat: KingSeat, claimed: Set<number>) {
  const cacheKey = `${mapId}:${slot}`, cached = kingClaimCache.get(cacheKey) ?? new Set<number>();
  for (const accountId of claimed) cached.add(accountId);
  if (kingSeats.get(mapId)?.has(slot)) kingClaimCache.set(cacheKey, cached); // khung đã bị bỏ (hết hạn) thì không tạo lại khóa mồ côi
  const owner = `${presenceBackend.workerId}:king:${mapId}:${slot}:${seat.id}`;
  await presenceBackend.withLock<KingDoc>(kingKey(mapId), owner, 5000, (old) => {
    const next = old ?? {}, rec = next[String(slot)];
    if (!rec) return next;
    const found = rec.seats.findIndex((s) => s.id === seat.id);
    if (found >= 0) rec.seats[found] = { ...seat };
    rec.claimed = [...new Set([...rec.claimed, ...cached])];
    return next;
  }, KING_STATE_TTL_MS);
}
export async function takeKingSeat(mapId: string, slot: number, until: number, roomId: string, boss: string): Promise<{ seat: KingSeat; claimed: Set<number>; boss: string }> {
  const owner = `${presenceBackend.workerId}:king:${mapId}:${slot}:${roomId}`;
  let result!: { seat: KingSeat; claimed: Set<number>; boss: string };
  const ok = await presenceBackend.withLock<KingDoc>(kingKey(mapId), owner, 5000, (old) => {
    const now = Date.now(), next = old ?? {};
    for (const [key, value] of Object.entries(next)) if (value.until <= now) { delete next[key]; dropKingClaims(mapId, value.slot); }
    let rec = next[String(slot)];
    if (!rec) { rec = { slot, until, seats: [], claimed: [], boss }; next[String(slot)] = rec; }
    let seat = rec.seats.find((s) => s.owner === null);
    if (!seat) { seat = { id: randomUUID(), owner: null, state: "alive", leaveAt: until }; rec.seats.push(seat); }
    seat.owner = roomId;
    const cacheKey = `${mapId}:${slot}`, cached = kingClaimCache.get(cacheKey) ?? new Set<number>();
    for (const accountId of rec.claimed) cached.add(accountId);
    kingClaimCache.set(cacheKey, cached);
    result = { seat: { ...seat }, claimed: new Set(cached), boss: rec.boss };
    return next;
  }, KING_STATE_TTL_MS);
  if (!ok || !result) throw new ServerError(503, "Không lấy được suất thú vương, hãy thử lại sau.");
  await loadKingState(mapId);
  const local = kingSeats.get(mapId)?.get(slot), seat = local?.seats.find((s) => s.id === result.seat.id) ?? result.seat;
  return { seat, claimed: local?.claimed ?? result.claimed, boss: local?.boss ?? result.boss };
}
export const BUYBACK_TTL_MS = 6 * 3600 * 1000;
/** Đọc-sửa-ghi danh sách mua lại ở presence trong một lần khóa (presence là nguồn đúng); cập nhật bản cục bộ theo kết quả. */
export async function editBuyback(accountId: number, edit: (list: Buyback[]) => Buyback[]) {
  let next: Buyback[] = [];
  const ok = await presenceBackend.withLock<Buyback[]>(buybackKey(accountId), `${presenceBackend.workerId}:buyback`, 5000, (old) => { next = edit(old ?? []); return next; }, BUYBACK_TTL_MS);
  if (!ok) throw new Error("Không khóa được danh sách mua lại trong presence.");
  if (next.length) buybacks.set(accountId, next); else buybacks.delete(accountId);
}
/** Lấy món `key` ra khỏi danh sách mua lại ở presence (chỉ một lần gọi nhận được món); null nếu không còn. */
export async function claimBuyback(accountId: number, key: string) {
  let got: Buyback | null = null;
  await editBuyback(accountId, (list) => { got = list.find((x) => x.key === key) ?? null; return list.filter((x) => x.key !== key); });
  return got as Buyback | null;
}
