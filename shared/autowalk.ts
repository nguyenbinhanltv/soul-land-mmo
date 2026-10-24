// Tự đi tới cờ (GAME_DESIGN.md mục 5.17, R4): hàm thuần quyết định chặng kế tiếp. Dùng chung client (GameScene) và kiểm thử; không phụ
// thuộc Phaser / DOM. Số liệu ở `AUTOWALK` (data.ts). Đường xuyên bản đồ lấy từ `route` server đã gửi (map.ts `mapRoute`: bản đồ kề nên
// đi tới trước, theo số cổng ít nhất) nên chỉ đi qua cổng có thật; không dùng truyền tống trận hay Hồi Thành Phù (tốn phí).

/** Đích của cờ: bản đồ, và `tile` = đã chọn ô cụ thể (cờ đặt trên bản đồ khu vực); chưa chọn ô (đi từ bản đồ thế giới) thì dừng khi vào tới bản đồ đó. */
export interface AutoGoal { map: string; tile: boolean }
/** Chặng kế tiếp: đi tới cờ trong bản đồ này, đi tới cổng sang bản đồ `to`, đã tới nơi (đích chỉ là bản đồ), hoặc không có đường. */
export type AutoLeg = { k: "flag" } | { k: "gate"; to: string } | { k: "arrived" } | { k: "none" };

/** `here`: bản đồ đang đứng; `route`: bản đồ kề nên đi tới trước, theo bản đồ đích (tin "daily"). */
export function autoLeg(here: string, goal: AutoGoal, route: Record<string, string>): AutoLeg {
  if (goal.map === here) return goal.tile ? { k: "flag" } : { k: "arrived" };
  const to = Object.hasOwn(route, goal.map) ? route[goal.map] : "";
  return to ? { k: "gate", to } : { k: "none" };
}

/** Lý do dừng (chữ hiện cho người chơi). */
export const AUTO_STOP = {
  moved: "Bạn tự di chuyển", hit: "Bị tấn công", dead: "Hồn sư đã gục", hunt: "Đang tự săn", talk: "Đang nói chuyện",
  stuck: "Bị kẹt, không đi tới được", none: "Không có đường tới đó", gate: "Không qua được cổng", arrived: "Đã tới nơi",
} as const;
