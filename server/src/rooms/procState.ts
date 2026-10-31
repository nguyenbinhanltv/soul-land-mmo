// Trạng thái MỨC TIẾN TRÌNH của các phòng bản đồ, chỉ trong bộ nhớ (miền D1, #702): thú vương theo bản đồ (`kingSeats`, `kingClaimCache`), khóa thưởng tinh anh nhiều kênh
// (`eliteLocks`), hồi chiêu Võ Hồn Dung Hợp Kỹ (`fusionReady`), đổi kênh / kênh vừa rời (`channelSwitchAt`, `leftRoom`, dọn định kỳ `sweepChannelMaps`), hook test (`testNoLeaveLock`,
// `testOfflineAgo`), danh sách mua lại (`buybacks`). Nguyên văn từ MapRoom; MỘT thể hiện duy nhất mỗi Map / Set (MapRoom, các miền và script kiểm thử đều import từ đây).
// Module lá: KHÔNG gọi presence / Redis và KHÔNG import MapRoom (chỉ phụ thuộc shared/data.ts, schedule.ts cho đồng hồ boss và type của db.ts / schema.ts). Hai tác dụng phụ lúc nạp module, giữ nguyên như khi còn ở MapRoom: `CHANNEL_CAP` đọc `GAME_TEST` / `CHANNEL_MAX`, và `setInterval(sweepChannelMaps).unref()` (chạy đúng một lần vì module chỉ nạp một lần). Phần ghi presence (`persistKingSeat`, `takeKingSeat`, `persistEliteLock`, `editBuyback`...) là miền D2, còn ở MapRoom.
import { KING, WORLD, BOSSES, MAPS, kingActive, worldActive, CHANNEL_MAX, CHANNEL_CD } from "../../../shared/data.ts";
import { bossOffset } from "../schedule.ts";
import type { BeastState } from "./schema.ts";
import type { Item } from "../db.ts";

/**
 * Một "suất" thú vương của một khung giờ: mỗi kênh đang mở của bản đồ giữ tối đa một suất (`owner` = roomId, null = phòng giữ suất đã
 * bị hủy). `state`: còn sống / đã bị hạ / đã rút đi; `leaveAt`: lúc rút đi (ms).
 */
export interface KingSeat { id: string; owner: string | null; state: "alive" | "down" | "gone"; leaveAt: number; }
/**
 * Một khung giờ đã sinh của bản đồ: các suất (mỗi kênh tối đa một) và các tài khoản đã nhận rương của khung này ở bất kỳ kênh nào
 * (`claimed`): đổi kênh rồi hạ thú vương của kênh khác trong cùng khung thì không nhận thêm rương (mục 6 "Nhiều kênh").
 */
export interface KingSlot { slot: number; until: number; seats: KingSeat[]; claimed: Set<number>; boss: string; } // boss: mã BOSSES của khung (BĐ6e: boss thế giới luân phiên)
export type KingSlotDoc = { slot: number; until: number; boss: string; seats: KingSeat[]; claimed: number[] };
export type KingDoc = Record<string, KingSlotDoc>;
/**
 * Thú vương theo bản đồ, sống lâu hơn phòng (Colyseus tự hủy phòng trống): mỗi khung giờ đã sinh (`slot`, hết lúc `until`) và các suất
 * của khung đó. Phòng mở lại trong cùng khung nhận lại suất không chủ thay vì sinh con mới, nên hạ thú vương rồi rời bản đồ cho phòng
 * hủy, quay lại cũng không có con mới. Khung hết hạn thì bỏ. Chạy nhiều tiến trình thì phải chuyển sang presence (Redis), như lịch.
 */
export const kingSeats = new Map<string, Map<number, KingSlot>>(); // map-co-dinh: khóa theo mapId; khung hết hạn bị kingRecs / applyKingDoc bỏ
export const kingClaimCache = new Map<string, Set<number>>();
/** Bỏ bộ nhớ đệm người đã nhận rương của khung `slot` (khung hết hạn / không còn trong tài liệu): không có thì Map chỉ tăng theo uptime (#739). */
export const dropKingClaims = (mapId: string, slot: number) => { kingClaimCache.delete(`${mapId}:${slot}`); };
/** Các khung còn hạn của bản đồ `mapId` (bỏ khung đã hết). */
export function kingRecs(mapId: string, now: number) {
  let recs = kingSeats.get(mapId);
  if (!recs) { recs = new Map(); kingSeats.set(mapId, recs); }
  for (const [slot, r] of recs) if (r.until <= now) { recs.delete(slot); dropKingClaims(mapId, slot); }
  return recs;
}
/**
 * Khung giờ thú vương đang diễn ra của bản đồ `mapId`: khung muộn nhất trong lịch (kingActive) và các khung đã sinh còn hạn (kể cả do
 * hook test).
 */
export function kingSlotNow(mapId: string, now: number): { slot: number; until: number } | null {
  // Bản đồ boss thế giới (BĐ6e): lịch WORLD_TIME, sống WORLD.lifeSecs.
  // Lịch tính trên đồng hồ lịch boss (bossNow: giờ thật, trừ khi GAME_TEST đặt lại), khung trả về đổi lại giờ thật.
  const world = !!MAPS[mapId].world?.length, off = bossOffset(now), at = world ? worldActive(now + off) : kingActive(now + off), recs = kingRecs(mapId, now);
  const active = at === null ? null : at - off;
  let best = active === null ? null : recs.get(active) ?? { slot: active, until: active + (world ? WORLD.lifeSecs : KING.lifeSecs) * 1000 };
  for (const r of recs.values()) if (!best || r.slot > best.slot) best = r;
  return best;
}
/**
 * Lấy suất thú vương cho phòng `roomId` trong khung `slot` của bản đồ `mapId`: suất không chủ trước (phòng cũ đã hủy), không còn thì
 * thêm suất mới còn sống tới `until`.
 */
export function applyKingDoc(mapId: string, doc: KingDoc | null) {
  if (!doc) return;
  const recs = new Map<number, KingSlot>(), now = Date.now();
  for (const value of Object.values(doc)) {
    const cacheKey = `${mapId}:${value.slot}`, cached = kingClaimCache.get(cacheKey) ?? new Set<number>();
    for (const accountId of value.claimed) cached.add(accountId);
    if (value.until > now) kingClaimCache.set(cacheKey, cached); else dropKingClaims(mapId, value.slot);
    recs.set(value.slot, { slot: value.slot, until: value.until, boss: value.boss, seats: value.seats, claimed: new Set(cached) });
  }
  for (const slot of kingSeats.get(mapId)?.keys() ?? []) if (!recs.has(slot)) dropKingClaims(mapId, slot);
  kingSeats.set(mapId, recs);
}
/** Hook kiểm thử (server/scripts/map-leak-test.ts): nạp tài liệu khung, lấy các khung còn hạn, đếm / hỏi bộ nhớ đệm rương. */
export const kingClaimTest = { apply: applyKingDoc, recs: kingRecs, size: () => kingClaimCache.size, has: (mapId: string, slot: number) => kingClaimCache.has(`${mapId}:${slot}`) };
/**
 * `${mapId}|${mã tinh anh}` -> accountId -> lúc (ms) được nhận lại thưởng tinh anh đó (ELITE.lock giây sau lần nhận). Theo bản đồ, không
 * theo phòng: mỗi kênh có tinh anh hồi sinh riêng, nên đổi kênh liên tục không nhân thưởng. Mất khi khởi động lại server (lâu nhất
 * ELITE.lock giây, chấp nhận được). Chạy nhiều tiến trình thì phải chuyển sang presence (Redis), như kingSeats.
 */
export const eliteLocks = new Map<string, Map<number, number>>();
export function applyEliteLock(key: string, values: Record<string, number>) {
  const m = new Map(Object.entries(values).map(([acc, until]) => [Number(acc), Number(until)]));
  if (m.size) eliteLocks.set(key, m); else eliteLocks.delete(key);
}
/** Khóa nhận thưởng của tinh anh `b` trên bản đồ `mapId` (khóa của eliteLocks): theo loài tinh anh (mã BOSSES). */
export const eliteKey = (mapId: string, b: BeastState) => `${mapId}|${BOSSES[b.species]?.id ?? b.species}`;
/** Số giây còn lại trước khi tài khoản `acc` nhận lại thưởng tinh anh `key` (0 = nhận được); bỏ các mục đã hết hạn của `key`. */
export function eliteLockLeft(key: string, acc: number, now = Date.now()): number {
  const m = eliteLocks.get(key); if (!m) return 0;
  for (const [a, until] of m) if (until <= now) m.delete(a);
  if (!m.size) eliteLocks.delete(key);
  return Math.max(0, ((m.get(acc) ?? now) - now) / 1000);
}
/**
 * Hồi chiêu Võ Hồn Dung Hợp Kỹ (#192, FUSION.cd) theo tài khoản, mức tiến trình: accountId -> lúc (ms) dùng lại được. Thuộc hồn sư nên đổi
 * võ hồn, đổi kênh, đi cổng, thoát vào lại đều không làm mới. Mất khi khởi động lại server; ghi cả vào presence (`fusion:<acc>`, TTL = FUSION.cd), nạp lại lúc vào phòng (#120).
 */
export const fusionReady = new Map<number, number>();
/** Số giây hồi chiêu dung hợp kỹ còn lại của tài khoản `acc` (0 = dùng được); bỏ mục đã hết hạn. */
export function fusionCdLeft(acc: number) {
  const t = fusionReady.get(acc); if (t === undefined) return 0;
  const left = (t - Date.now()) / 1000; if (left <= 0) fusionReady.delete(acc);
  return Math.max(0, left);
}
/** Số người tối đa mỗi kênh: CHANNEL_MAX; chỉ khi bật GAME_TEST=1 mới hạ được bằng biến môi trường CHANNEL_MAX (bot thử kênh 2). */
export const CHANNEL_CAP = (() => {
  const n = Math.floor(Number(process.env.CHANNEL_MAX));
  return process.env.GAME_TEST === "1" && n >= 1 ? Math.min(n, CHANNEL_MAX) : CHANNEL_MAX;
})();
/** Lần đổi kênh gần nhất của mỗi tài khoản (ms): đổi kênh là đổi phòng (đổi sessionId) nên khóa theo tài khoản (CHANNEL_CD). */
export const channelSwitchAt = new Map<number, number>(); // dòng hết CHANNEL_CD giây bị sweepChannelMaps dọn (#957); hook test `chan {reset}` ở gm.ts xóa tay
/**
 * Kênh vừa rời không qua đường server duyệt (đóng tab, mất mạng, client tự rời; onLeave không ghi khi đi cổng / đổi kênh đã commit): trong
 * CHANNEL_CD giây tài khoản chỉ được vào lại đúng kênh đó của bản đồ (onAuth từ chối kênh khác khi kênh cũ còn mở và còn chỗ;
 * pickChannel đưa về kênh cũ). Không có lớp này thì client tự rời rồi joinById kênh khác là né được luật đổi kênh (giao chiến, chờ).
 * Từ #164 (`travel`): đi cổng / đổi kênh / truyền tống sang bản đồ khác commit xong cũng ghi kênh server đã chọn ở bản đồ đích, để
 * client vào đúng kênh đó (mục 6: client không chọn kênh đích) chứ không tự joinById kênh khác.
 */
export const leftRoom = new Map<number, { mapId: string; roomId: string; ch: number; until: number; travel?: boolean }>();
/**
 * #957: dọn dòng hết hạn của channelSwitchAt (đã qua CHANNEL_CD giây) và leftRoom (until đã qua): hai Map này khóa theo tài khoản nên
 * không dọn thì phình theo số tài khoản từng chơi. Chỉ xóa dòng mà luật đổi kênh đã coi như không có (không đổi luật); trả số dòng đã xóa.
 */
export function sweepChannelMaps(now: number) {
  let n = 0;
  for (const [k, at] of channelSwitchAt) if (now - at >= CHANNEL_CD * 1000) { channelSwitchAt.delete(k); n++; }
  for (const [k, l] of leftRoom) if (l.until <= now) { leftRoom.delete(k); n++; }
  return n;
}
const CHANNEL_SWEEP_MS = 5 * 60_000;
setInterval(() => sweepChannelMaps(Date.now()), CHANNEL_SWEEP_MS).unref();
/** Hook test `chan {nolock}`: lần rời phòng kế tiếp của tài khoản không ghi leftRoom (bot thử chọn kênh khi vào game). */
export const testNoLeaveLock = new Set<number>(); // map-co-dinh: đường xóa duy nhất là `testNoLeaveLock.delete` ở onLeave (join.ts), như trước khi tách
/**
 * Hook test `offline {ago}` (Auto 3, chỉ GAME_TEST): lần ủy thác offline kế tiếp của tài khoản ghi thời điểm bắt đầu lùi `ago` giây,
 * như đã thoát từ `ago` giây trước (giả lập thời gian trôi: bot vào lại ngay mà vẫn nhận thưởng theo quãng vắng mặt đó).
 */
export const testOfflineAgo = new Map<number, number>(); // map-co-dinh: đường xóa duy nhất là `testOfflineAgo.delete` ở onLeave (join.ts), như trước khi tách
/**
 * Mua lại đồ bán nhầm (bước 9.8): BUYBACK_MAX lần bán gần nhất của mỗi tài khoản (mới nhất trước), mức tiến trình theo tài khoản để
 * đi cổng / đổi kênh / vào sân đấu vẫn còn; ghi cả vào presence (`buyback:<acc>`, TTL BUYBACK_TTL_MS, nạp lại lúc vào phòng) để sang phòng ở tiến trình khác vẫn còn; xóa khi người chơi rời game (onLeave không qua đi cổng, forgetBuyback).
 * `item`: bản sao món đã bán (số lượng đã bán, giữ chỉ số / cấp cường hóa), `price`: giá đã nhận mỗi món.
 */
export interface Buyback { key: string; item: Item; price: number; }
export const buybacks = new Map<number, Buyback[]>(); // map-co-dinh: đường xóa là `buybacks.delete` ở editBuyback (MapRoom, miền D2), forgetBuyback (shop.ts) và join.ts (nạp lại / dọn khi vào phòng); mỗi tài khoản tối đa BUYBACK_MAX mục
