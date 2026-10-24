// S1 (#542): trình phát sheet hiệu ứng chiêu. Chỉ hiển thị ở client (không đổi state, luật hay số cân bằng).
// Sheet = một texture Phaser nhiều khung, bố cục `rows` hàng (1 hoặc 8 hướng, hàng 0 = hướng phải, đi theo chiều kim đồng hồ màn hình)
// × `cols` khung. Lớp cộng sáng (ADD), pool Image dùng lại, mảng ô định sẵn: không tạo object mới mỗi khung hay mỗi lần phát (trừ lần đầu tới trần).
import Phaser from "phaser";
import { SPR } from "./iso.ts";
import { fxPrefs, type FxLevel } from "./combatFx.ts";

/** Trần số sprite sheet cùng lúc theo mức (Thấp: vài hình chính; ở đông người thì chiêu của người khác nhường chỗ, xem `light`). */
export const SHEET_CAP: Record<FxLevel, number> = { low: 3, mid: 10, high: 24 };
const snap = (v: number) => Math.round(v / SPR) * SPR;

export interface SheetPlay {
  /** Khóa texture (đã tải theo manifest hoặc dựng bằng code, xem `makeCodeSheet`). */
  key: string;
  x: number; y: number;
  /** Hướng rad màn hình (0 = phải): chọn hàng khi sheet có 8 hướng, và lật ngang khi chỉ có 1 hàng. */
  ang?: number;
  /** Số hàng hướng của sheet (1 hoặc 8). */
  rows?: number;
  /** Cỡ nguyên (bội SPR): ảnh chạy 1 khung. */
  scale?: number;
  fps?: number;
  /** Màu nhân vào ảnh (không tô: giữ nguyên màu ảnh). */
  tint?: number;
  /** Bay thẳng tới điểm này trong suốt thời gian phát (đạn). */
  to?: { x: number; y: number };
  /** Chậm bắt đầu (ms). */
  delay?: number;
  /** Bản nhẹ cho chiêu của người khác: nhỏ hơn, mờ hơn. */
  light?: boolean;
  /** Bù độ cao lên (pixel màn hình). */
  lift?: number;
  /** Bề ngang mong muốn trên màn hình (px): chọn cỡ nguyên gần nhất cho khung (vùng khớp bán kính chiêu). Có thì bỏ qua `scale`. */
  fitW?: number;
  /** Xoay ảnh theo hướng bay (đạn vẽ hướng sang phải): thay cho lật ngang. */
  rotate?: boolean;
  /** Độ đục tối đa 0..1 (lớp cộng sáng nhẹ hơn thân). */
  alpha?: number;
  /** Vẽ thường (không cộng sáng): hiệu ứng khói bụi / đá giữ được màu tối và viền. Mặc định cộng sáng (sét, lửa, quang). */
  normal?: boolean;
}

interface Cell { img: Phaser.GameObjects.Image; on: boolean; t: number; dur: number; cols: number; row: number; x0: number; y0: number; x1: number; y1: number; a: number; calm: boolean; wait: number; frames: number }

export class SheetFx {
  private cells: Cell[] = [];
  private live = 0;
  constructor(private scene: Phaser.Scene, private depth = 99983) {}
  get active() { return this.live; }
  /** Số Image đã tạo (kiểm thử "không tạo object mỗi khung"). */
  get pooled() { return this.cells.length; }
  has(key: string) { return this.scene.textures.exists(key); }
  /** Bề ngang một khung (px) của texture nhiều khung (khung 0; `__BASE` đứng trước nên lấy khung 0). */
  private frameW(tex: Phaser.Textures.Texture) { return tex.get(0).width; }

  /** Phát một lần; trả false khi texture chưa có hoặc quá trần (nơi gọi giữ hiệu ứng cũ). */
  play(o: SheetPlay): boolean {
    const tex = this.scene.textures.exists(o.key) ? this.scene.textures.get(o.key) : null;
    if (!tex || this.live >= SHEET_CAP[fxPrefs.level]) return false;
    const total = tex.frameTotal - 1, rows = Math.max(1, o.rows ?? 1), cols = Math.floor(total / rows);
    if (cols < 1) return false;
    const a = o.ang ?? 0, calm = fxPrefs.reduce;
    // 8 hướng: hàng = hướng gần nhất, 0 = phải, tăng theo chiều kim đồng hồ trên màn hình (y xuống).
    const row = rows >= 8 ? ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8 : 0;
    let c = this.cells.find(k => !k.on);
    if (!c) { c = { img: this.scene.add.image(0, 0, o.key).setBlendMode(Phaser.BlendModes.ADD), on: false, t: 0, dur: 0, cols: 0, row: 0, x0: 0, y0: 0, x1: 0, y1: 0, a: 1, calm: false, wait: 0, frames: 0 }; this.cells.push(c); }
    const sc = o.fitW ? Math.max(SPR, Math.round(o.fitW * (o.light ? 0.7 : 1) / (this.frameW(tex) * 0.88))) : Math.max(SPR, snap((o.scale ?? 2 * SPR) * (o.light ? 0.7 : 1)));
    const dy = -(o.lift ?? 0);
    c.img.setBlendMode(o.normal ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD).setTexture(o.key, 0).setDepth(this.depth).setScale(sc).setRotation(o.rotate ? Math.atan2((o.to?.y ?? o.y) - o.y, (o.to?.x ?? o.x) - o.x) : 0).setAlpha(0).setVisible(false).setActive(true)
      .setFlipX(rows < 8 && !o.rotate && Math.cos(a) < 0);
    if (o.tint !== undefined) c.img.setTint(o.tint); else c.img.clearTint();
    c.on = true; c.t = 0; c.cols = cols; c.row = row; c.frames = cols;
    c.dur = (cols / (o.fps ?? 20)) * 1000; c.wait = o.delay ?? 0;
    c.x0 = o.x; c.y0 = o.y + dy; c.x1 = o.to ? o.to.x : o.x; c.y1 = (o.to ? o.to.y : o.y) + dy;
    c.a = (o.light ? 0.75 : 1) * (o.alpha ?? 1); c.calm = calm;
    this.live++;
    return true;
  }

  /** Mỗi khung (dt: ms): đổi khung, vị trí bám lưới; hết thì trả pool. Giảm chuyển động: một khung giữa, mờ vào rồi ra, không bay. */
  update(dt: number) {
    for (const c of this.cells) {
      if (!c.on) continue;
      if (c.wait > 0) { c.wait -= dt; if (c.wait > 0) continue; c.t += -c.wait; c.wait = 0; } else c.t += dt;
      const k = c.t / c.dur;
      if (k >= 1) { c.on = false; c.img.setVisible(false).setActive(false); this.live--; continue; }
      const f = c.calm ? c.frames >> 1 : Math.min(c.frames - 1, (k * c.frames) | 0);
      const m = c.calm ? 0 : k;
      c.img.setFrame(c.row * c.cols + f).setVisible(true)
        .setPosition(snap(c.x0 + (c.x1 - c.x0) * m), snap(c.y0 + (c.y1 - c.y0) * m))
        .setAlpha(c.calm ? Math.sin(k * Math.PI) * c.a : k > 0.85 ? ((1 - k) / 0.15) * c.a : c.a);
    }
  }
  clear() { for (const c of this.cells) if (c.on) { c.on = false; c.img.setVisible(false).setActive(false); } this.live = 0; }
  destroy() { for (const c of this.cells) c.img.destroy(); this.cells = []; this.live = 0; }
}

/**
 * Dựng bằng code một sheet một hàng `frames` khung `size`×`size` (canvas, mỗi khung vẽ bằng `draw(ctx, k 0..1, size)`), để thử khung
 * khi chưa có ảnh vẽ (S2 thay bằng ảnh thật cùng khóa / bố cục). Đã có khóa thì không dựng lại.
 */
export function makeCodeSheet(scene: Phaser.Scene, key: string, frames: number, size: number, draw: (c: CanvasRenderingContext2D, k: number, size: number) => void): boolean {
  if (scene.textures.exists(key)) return true;
  const t = scene.textures.createCanvas(key, frames * size, size); if (!t) return false;
  const c = t.getContext();
  for (let i = 0; i < frames; i++) { c.save(); c.translate(i * size, 0); c.beginPath(); c.rect(0, 0, size, size); c.clip(); draw(c, i / (frames - 1), size); c.restore(); t.add(i, 0, i * size, 0, size, size); }
  t.refresh();
  return true;
}
