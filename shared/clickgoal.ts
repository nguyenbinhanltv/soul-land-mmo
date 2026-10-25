// Bấm để đi (mục 5.11 "Điều khiển", M4 #749): đường A* tới điểm bấm và bước lái theo đường đó mỗi khung hình. Hàm thuần, không dùng
// Phaser: GameScene lái bằng `stepGoal`, bot và kiểm thử Node import thẳng file này. Vẫn chỉ cho ra hướng đi để gửi trong `input`.
import { TILE, CLICK_GOAL } from "./data.ts";
import { findPath, type Pt } from "./path.ts";
import type { SolidGrid } from "./move.ts";

/**
 * Điểm đang đi tới: `path` là đường A*, `i` điểm đang đi tới, `d` / `t` khoảng cách tốt nhất tới điểm đó và lúc cải thiện cuối,
 * `dest` điểm bấm gốc (để tính lại đường), `stuck` lúc bắt đầu bị kẹt (0: không kẹt), `auto` do tự đi tới cờ lái (có logic dừng riêng).
 */
export interface ClickGoal { x: number; y: number; path: Pt[]; i: number; d: number; t: number; auto?: boolean; dest?: Pt; stuck?: number; }

/** Lưới ô chặn kèm ô hồn thú đang đứng (vật cản mềm); không đánh dấu ô mình đứng và ô đích. */
export function softGrid(g: SolidGrid, at: Pt, to: Pt, beasts: readonly Pt[]): SolidGrid {
  const solid = g.solid.slice(), keep = new Set([Math.floor(at.y / TILE) * g.MW + Math.floor(at.x / TILE), Math.floor(to.y / TILE) * g.MW + Math.floor(to.x / TILE)]);
  for (const b of beasts) {
    const tx = Math.floor(b.x / TILE), ty = Math.floor(b.y / TILE), i = ty * g.MW + tx;
    if (tx >= 0 && ty >= 0 && tx < g.MW && ty < g.MH && !keep.has(i)) solid[i] = 1;
  }
  return { MW: g.MW, MH: g.MH, solid };
}

/** Đường mới từ `at` tới `dest` tránh hồn thú; không có đường như vậy thì tìm lại không tránh. */
export function replan(g: SolidGrid | null, at: Pt, dest: Pt, beasts: readonly Pt[]): Pt[] {
  if (!g) return [dest];
  const path = beasts.length ? findPath(softGrid(g, at, dest, beasts), at, dest) : [];
  return path.length ? path : findPath(g, at, dest);
}

/** Tạo điểm đi tới từ chỗ bấm `w`; null nếu không đi được chút nào. */
export function newGoal(g: SolidGrid | null, at: Pt, w: Pt, now: number): ClickGoal | null {
  const path = g ? findPath(g, at, w) : [w];
  if (!path.length) return null;
  const end = path[path.length - 1];
  return { x: end.x, y: end.y, path, i: 0, d: Infinity, t: now, dest: { x: w.x, y: w.y }, stuck: 0 };
}

export interface GoalEnv {
  at: Pt;
  /** Coi là tới điểm khi còn cách dưới chừng này pixel (một bước đi của một khung, không thì lắc qua lại). */
  near: number;
  now: number;
  /** Đang bị khống chế (choáng, trói, băng…): đứng chờ, không tính là kẹt. */
  held: boolean;
  grid: SolidGrid | null;
  beasts: readonly Pt[];
}
/** `dir`: hướng cần đi (đơn vị); `end`: lý do dừng (`arrived` tới nơi, `stalled` điểm do cờ lái bị kẹt, `blocked` kẹt thật quá CLICK_GOAL.giveUpMs). */
export interface GoalStep { dir: Pt | null; end?: "arrived" | "stalled" | "blocked"; }

/**
 * Một bước lái: tới điểm đang đi thì sang điểm kế; mỗi CLICK_GOAL.stallMs không gần điểm đó thêm thì tính lại A* từ chỗ đứng (hồn thú là vật
 * cản mềm), chỉ bỏ khi kẹt liên tục quá CLICK_GOAL.giveUpMs. Điểm do tự đi tới cờ lái (`auto`) bị kẹt thì dừng ngay (flagTick tự tính lại).
 */
export function stepGoal(g: ClickGoal, e: GoalEnv): GoalStep {
  const { at, now } = e;
  let wp = g.path[g.i], dx = wp.x - at.x, dy = wp.y - at.y, L = Math.hypot(dx, dy);
  while (L < e.near && g.i < g.path.length - 1) {
    wp = g.path[++g.i]; dx = wp.x - at.x; dy = wp.y - at.y; L = Math.hypot(dx, dy); g.d = Infinity; g.t = now;
  }
  if (L < e.near) return { dir: null, end: "arrived" };
  if (!g.auto && e.held) { g.t = now; g.stuck = 0; }
  else if (now - g.t > CLICK_GOAL.stallMs) {
    if (L <= g.d - 2) { g.d = L; g.t = now; g.stuck = 0; }
    else if (g.auto) return { dir: null, end: "stalled" };
    else {
      g.stuck ||= now - CLICK_GOAL.stallMs;
      const np = replan(e.grid, at, g.dest ?? g, e.beasts);
      if (now - g.stuck >= CLICK_GOAL.giveUpMs || !np.length) return { dir: null, end: "blocked" };
      const end = np[np.length - 1];
      g.path = np; g.i = 0; g.t = now; g.x = end.x; g.y = end.y;
      wp = np[0]; dx = wp.x - at.x; dy = wp.y - at.y; L = Math.hypot(dx, dy) || 1;
      g.d = L; // đo tiến bộ từ chỗ đang đứng: để Infinity thì lần kiểm kế tiếp luôn tính là có tiến bộ và không bao giờ coi là kẹt
    }
  }
  return { dir: { x: dx / L, y: dy / L } };
}
