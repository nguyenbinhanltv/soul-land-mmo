// Logic thuần của màn chỉnh ráp phụ thể `?thu=phuthe&sua=1` (#1192): hoàn tác / làm lại theo ảnh chụp bảng neo, nhích bằng phím, đổi kéo chuột sang (dx, dy). Không Phaser, kiểm bằng node.
import { PHU_SCALE_RANGE, parsePhuAnchor, phuAnchorJson, type PhuAnchor, type PhuAnchorTable } from "./phutheAnchor.ts";

/** Biên dx, dy (điểm ảnh khung) của ô số / phím / kéo. */
export const PHU_SHIFT_MAX = 64;
const r2 = (v: number) => Math.round(v * 100) / 100;
export const clampShift = (v: number) => r2(Math.max(-PHU_SHIFT_MAX, Math.min(PHU_SHIFT_MAX, Number.isFinite(v) ? v : 0)));
export const clampScale = (v: number) => r2(Math.max(PHU_SCALE_RANGE[0], Math.min(PHU_SCALE_RANGE[1], Number.isFinite(v) ? v : 1)));

/** Bước phím mũi tên: thường 1, Shift 5, Ctrl 0,25 (điểm ảnh khung). */
export const phuStep = (shift: boolean, ctrl: boolean) => (shift ? 5 : ctrl ? 0.25 : 1);
/** Phím mũi tên → (Δdx, Δdy) theo MÀN HÌNH; `flip` (hướng tây lật) đổi dấu dx vì dx tính theo hướng nhìn. */
export function phuNudge(key: string, step: number, flip: boolean): [number, number] | null {
  const s = flip ? -1 : 1;
  return key === "ArrowLeft" ? [-step * s, 0] : key === "ArrowRight" ? [step * s, 0] : key === "ArrowUp" ? [0, -step] : key === "ArrowDown" ? [0, step] : null;
}
/** Kéo chuột Δ (điểm ảnh màn hình) → Δ điểm ảnh khung (zoom camera; hướng tây lật dấu dx). */
export const phuDragDelta = (sx: number, sy: number, zoom: number, flip: boolean): [number, number] => [(flip ? -sx : sx) / zoom, sy / zoom];
/** Lăn chuột → scale mới (mỗi nấc 0,02, lăn lên = to hơn). */
export const phuWheelScale = (scale: number, deltaY: number) => clampScale(scale + (deltaY < 0 ? 0.02 : -0.02));

/** Hoàn tác / làm lại: giữ ảnh chụp JSON của bảng neo (giới hạn 200 bước). */
export class PhuHistory {
  private undoS: string[] = []; private redoS: string[] = [];
  /** Gọi TRƯỚC mỗi thay đổi (một cú kéo / một chuỗi phím = một lần gọi) để lưu trạng thái hiện tại. */
  push(t: PhuAnchorTable) {
    const s = JSON.stringify(phuAnchorJson(t, t.manual)); if (this.undoS[this.undoS.length - 1] === s) return;
    this.undoS.push(s); if (this.undoS.length > 200) this.undoS.shift(); this.redoS = [];
  }
  get canUndo() { return this.undoS.length > 0; }
  get canRedo() { return this.redoS.length > 0; }
  private swap(from: string[], to: string[], cur: PhuAnchorTable): PhuAnchorTable | null {
    const s = from.pop(); if (s === undefined) return null;
    const t = parsePhuAnchor(JSON.parse(s)); if (!t) return null;
    to.push(JSON.stringify(phuAnchorJson(cur, cur.manual))); return t;
  }
  undo(cur: PhuAnchorTable) { return this.swap(this.undoS, this.redoS, cur); }
  redo(cur: PhuAnchorTable) { return this.swap(this.redoS, this.undoS, cur); }
  clear() { this.undoS = []; this.redoS = []; }
}

/** Chép giá trị bảng `from` vào `to` tại chỗ (để hoàn tác mà giữ nguyên tham chiếu bảng mà cảnh đang đọc). */
export function phuAssignTable(to: PhuAnchorTable, from: PhuAnchorTable) {
  to.frame = from.frame; to.manual = from.manual;
  for (const sex of ["m", "f"] as const) to[sex] = from[sex].map((a: PhuAnchor) => ({ ...a }));
}
