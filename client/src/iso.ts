// Phép chiếu hiển thị (bước 10.1): server giữ tọa độ thế giới Descartes (pixel, ô TILE), client chỉ đổi cách vẽ và cách đọc input.
// Mặc định isometric 2:1: một ô lưới logic là một ô hình thoi TILE_W × TILE_H. `?view=topdown` vẽ nhìn thẳng từ trên xuống như cũ
// (để so sánh / khắc phục). Mọi phép đổi đi qua ma trận tuyến tính M dưới đây nên hai chế độ dùng chung một đường code.
import type Phaser from "phaser";
import { TILE } from "../../shared/data.ts";
import type { Dir } from "./sprites.ts";

/**
 * Một ô logic 16×16 thế giới vẽ thành thoi 32×16 (GAME_DESIGN.md mục 5.11): sx = x − y, sy = (x + y) / 2, giữ tầm nhìn khoảng
 * 14 ô ngang mỗi bên ở 640×360. Hằng hiển thị, không phải số cân bằng.
 */
export const TILE_W = 32, TILE_H = 16;
/** Sprite cũ (hồn sư 32×32, phụ thể 48×48, hồn thú theo bậc) phóng ×2 lên khung mới (hồn sư 64×64) cho tới khi có ảnh isometric. */
export const SPR = 2;
/** Độ phân giải nội bộ: camera phóng số nguyên lớn nhất còn chứa đủ VIEW_W × VIEW_H (mục 5.11). */
export const VIEW_W = 640, VIEW_H = 360;

export const TOPDOWN = typeof location !== "undefined" && new URLSearchParams(location.search).get("view") === "topdown";

/**
 * Ma trận chiếu: màn hình = (a·x + b·y, c·x + d·y). Isometric: trục x thế giới đi xuống bên phải, trục y đi xuống bên trái;
 * ô (16 pixel) thành hình thoi TILE_W × TILE_H. Nhìn thẳng: phóng 2 (ô 32 pixel, hồn sư phóng ×2 vẫn cao 2 ô như trước).
 */
const M = TOPDOWN ? { a: 2, b: 0, c: 0, d: 2 } : { a: TILE_W / 2 / TILE, b: -TILE_W / 2 / TILE, c: TILE_H / 2 / TILE, d: TILE_H / 2 / TILE };
const DET = M.a * M.d - M.b * M.c;

export interface Pt { x: number; y: number; }

/** Tọa độ thế giới → tọa độ màn hình (không gian camera của Phaser). */
export const worldToScreen = (x: number, y: number): Pt => ({ x: M.a * x + M.b * y, y: M.c * x + M.d * y });
/** Tọa độ màn hình → tọa độ thế giới (chiếu ngược, ví dụ điểm chuột trên mặt đất). */
export const screenToWorld = (sx: number, sy: number): Pt => ({ x: (M.d * sx - M.b * sy) / DET, y: (M.a * sy - M.c * sx) / DET });

/**
 * Độ sâu vẽ của một điểm chạm đất: chính tung độ màn hình (isometric: tỉ lệ x + y thế giới), nên vật đứng phía trước (gần mép dưới
 * màn hình) che vật phía sau. Mặt đất vẽ ở độ sâu âm, chữ và lớp phủ ở 99980 trở lên.
 */
export const depthAt = (x: number, y: number) => M.c * x + M.d * y;

/** Bán trục ngang / dọc trên màn hình của vòng tròn bán kính 1 trên mặt đất (isometric: elip 2:1). */
export const RX = Math.hypot(M.a, M.b), RY = Math.hypot(M.c, M.d);

/** Hướng trên màn hình (phím, cần điều khiển; lên = lên trên màn hình) → hướng thế giới server nhận, giữ nguyên độ dài (≤ 1). */
export function screenDirToWorld(sx: number, sy: number): Pt {
  const l = Math.hypot(sx, sy); if (l < 1e-6) return { x: 0, y: 0 };
  const w = screenToWorld(sx, sy), k = Math.min(1, l) / Math.hypot(w.x, w.y);
  return { x: w.x * k, y: w.y * k };
}

/** Vector thế giới → vector màn hình (không tịnh tiến). */
export const vecToScreen = worldToScreen;

/** 8 hướng nhìn trên màn hình theo thứ tự chiều kim đồng hồ từ hướng xuống. */
export const DIRS8 = ["s", "sw", "w", "nw", "n", "ne", "e", "se"] as const;
export type Dir8 = (typeof DIRS8)[number];

/** Hướng 8 phía trên màn hình của một vector thế giới (null khi gần như đứng yên). */
export function dir8(wx: number, wy: number): Dir8 | null {
  const s = vecToScreen(wx, wy); if (Math.hypot(s.x, s.y) < 1e-6) return null;
  // Góc màn hình đo trên lưới đã "nắn" dọc về tỉ lệ thật (RX / RY) để 8 hướng chia đều theo hướng đi thế giới.
  const a = Math.atan2((s.y * RX) / RY, s.x); // 0 = phải, π/2 = xuống
  const k = Math.round((a - Math.PI / 2) / (Math.PI / 4));
  return DIRS8[((k % 8) + 8) % 8];
}

/** Hướng thế giới theo chỉ số DIRS4 của server (down, right, up, left). */
export const DIR4_VEC: readonly Pt[] = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }];

/**
 * Sprite cũ chỉ có 4 hướng nhìn thẳng (xuống, phải, lên, trái = lật phải): chọn hướng gần nhất theo góc trên màn hình.
 * Hai chéo nông (lệch 26,6° so với phương ngang) gần ngang hơn nên dùng khung nghiêng.
 */
export function legacyDir(d: Dir8): Dir {
  return d === "s" ? "down" : d === "n" ? "up" : d === "e" || d === "ne" || d === "se" ? "right" : "left";
}

/** Đổi danh sách điểm thế giới sang điểm màn hình, nhấc lên `lift` pixel màn hình. */
export const ptsToScreen = (pts: readonly Pt[], lift = 0): Pt[] => pts.map((p) => { const s = worldToScreen(p.x, p.y); return { x: s.x, y: s.y - lift }; });

/** Các điểm thế giới trên cung tròn tâm (x, y) bán kính r từ góc a0 tới a1 (radian, góc thế giới). */
export function arcPts(x: number, y: number, r: number, a0: number, a1: number, n = 18): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r }); }
  return out;
}

/** Tô vòng tròn bán kính r trên mặt đất (elip theo phép chiếu). */
export function fillGround(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, lift = 0) {
  const s = worldToScreen(x, y); g.fillEllipse(s.x, s.y - lift, 2 * RX * r, 2 * RY * r);
}
/** Viền vòng tròn bán kính r trên mặt đất (elip theo phép chiếu). */
export function strokeGround(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, lift = 0) {
  const s = worldToScreen(x, y); g.strokeEllipse(s.x, s.y - lift, 2 * RX * r, 2 * RY * r);
}
/** Điểm màn hình trên vòng tròn bán kính r quanh (x, y) ở góc thế giới a. */
export function groundAt(x: number, y: number, r: number, a: number, lift = 0): Pt {
  const s = worldToScreen(x + Math.cos(a) * r, y + Math.sin(a) * r); return { x: s.x, y: s.y - lift };
}
