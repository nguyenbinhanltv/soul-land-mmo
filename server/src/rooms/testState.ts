// Trạng thái CHỈ DÙNG CHO HOOK KIỂM THỬ (GAME_TEST) của các phòng bản đồ, tách khỏi procState.ts (#702, miền D2): `testNoLeaveLock`, `testOfflineAgo` (gm.ts ghi, join.ts đọc / xóa ở
// onLeave) và `kingClaimTest` (server/scripts/map-leak-test.ts). Nguyên văn từ MapRoom; MỘT thể hiện mỗi Set / Map. Module lá: không import MapRoom, không presence / Redis.
import { applyKingDoc, kingRecs, kingClaimCache } from "./procState.ts";

/** Hook test `chan {nolock}`: lần rời phòng kế tiếp của tài khoản không ghi leftRoom (bot thử chọn kênh khi vào game). */
export const testNoLeaveLock = new Set<number>(); // map-co-dinh: đường xóa duy nhất là `testNoLeaveLock.delete` ở onLeave (join.ts), như trước khi tách
/**
 * Hook test `offline {ago}` (Auto 3, chỉ GAME_TEST): lần ủy thác offline kế tiếp của tài khoản ghi thời điểm bắt đầu lùi `ago` giây,
 * như đã thoát từ `ago` giây trước (giả lập thời gian trôi: bot vào lại ngay mà vẫn nhận thưởng theo quãng vắng mặt đó).
 */
export const testOfflineAgo = new Map<number, number>(); // map-co-dinh: đường xóa duy nhất là `testOfflineAgo.delete` ở onLeave (join.ts), như trước khi tách
/** Hook kiểm thử (server/scripts/map-leak-test.ts): nạp tài liệu khung, lấy các khung còn hạn, đếm / hỏi bộ nhớ đệm rương. */
export const kingClaimTest = { apply: applyKingDoc, recs: kingRecs, size: () => kingClaimCache.size, has: (mapId: string, slot: number) => kingClaimCache.has(`${mapId}:${slot}`) };
