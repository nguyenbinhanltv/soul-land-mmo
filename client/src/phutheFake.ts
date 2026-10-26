// Sheet phụ thể hoạt ảnh GIẢ LẬP để thử client phát clip khi chưa có ảnh thật (Phụ thể v2 P2, #1023): KHÔNG phải ảnh model, không vào game.
// Dựng lúc chạy ở trang thử `?thu=phuthe&anim=fake` từ ảnh phụ thể tĩnh sẵn có (khung đứng từng hướng): mỗi khung của clip là ảnh tĩnh xoay / nhún / dịch
// theo clip và khung (giống tools/assets/beast-sheet-fake.mjs của hồn thú). Hàm thuần ở file này; phần vẽ canvas nằm ở phutheTest.ts.
import type { PhuClip } from "./phutheAnim.ts";

/** Phép biến đổi của khung `i` / `n` của clip (quanh chân): dịch `dx`, `dy` (pixel khung), xoay `rot` (rad), co giãn `sx`, `sy`. Chu kỳ tuần hoàn cho idle / walk. */
export interface FakePose { dx: number; dy: number; rot: number; sx: number; sy: number }

export function fakePose(clip: PhuClip, i: number, n: number, out: FakePose = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 }): FakePose {
  const t = n > 1 ? i / n : 0, w = Math.sin(t * 2 * Math.PI), e = n > 1 ? i / (n - 1) : 1; // w: sóng tuần hoàn; e: tiến độ 0..1 của clip một lần
  out.dx = 0; out.dy = 0; out.rot = 0; out.sx = 1; out.sy = 1;
  switch (clip) {
    case "idle": out.dy = w; out.sy = 1 + 0.03 * w; out.sx = 1 - 0.015 * w; break;
    case "walk": out.dy = -2 * Math.abs(w); out.rot = 0.09 * w; out.sx = 1 + 0.05 * w; break;
    case "attack": { const k = Math.sin(Math.PI * e); out.dx = 8 * k - 3; out.dy = -2 * k; out.rot = 0.28 * k - 0.05; out.sx = 1 + 0.12 * k; out.sy = 1 - 0.05 * k; break; }
    case "cast": out.dy = -5 * e; out.sx = 1 + 0.14 * e; out.sy = 1 + 0.18 * e; out.rot = -0.04 * e; break;
    case "hurt": out.dx = -4 + 3 * e; out.rot = -0.12 + 0.1 * e; out.sy = 0.95 + 0.05 * e; break;
  }
  return out;
}
