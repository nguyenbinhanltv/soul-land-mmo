// G1 (#392): cảm giác đánh. Chỉ hiển thị cục bộ ở client (không đổi state, nhịp mạng, dự đoán hay luật chơi); hằng số ở đây là
// độ dài / độ mạnh của hiệu ứng, KHÔNG phải số cân bằng (số cân bằng ở shared/data.ts).
import Phaser from "phaser";
import type { He, HaoQuangMode } from "../../shared/data.ts";
import { FxGovernor, GOV, FX_DEFAULT_LEVEL, normalizeFxLevel } from "./combatFeelRules.ts";

export type FxLevel = "low" | "mid" | "high";
/** Rung màn hình (#437): Tắt (không rung / giật), Chỉ boss (mặc định: tinh anh trở lên, chiêu mạnh vào mình, hồn kỹ lớn), Đầy đủ (thêm chí mạng lên hồn thú thường, trừ khi tự săn). */
export type ShakeMode = "off" | "boss" | "full";
export const SHAKE_MODES: [ShakeMode, string][] = [["off", "Tắt"], ["boss", "Chỉ boss"], ["full", "Đầy đủ"]];
export interface FxPrefs { level: FxLevel; reduce: boolean; shake: ShakeMode; cine: boolean; cutin: boolean; halo: HaoQuangMode; hideHat: boolean; /** Tự hạ mức hiệu ứng khi FPS thấp (H8 #491); chỉ hạ, không nâng quá mức người chơi chọn. */ auto: boolean }

const KEY = "soul-land-fx-v1";
const store = (): Storage | null => { try { return window.localStorage; } catch { return null; } };
const prefersReduce = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

function load(): FxPrefs {
  const def: FxPrefs = { level: FX_DEFAULT_LEVEL, reduce: prefersReduce(), shake: "boss", cine: true, cutin: true, halo: "halo", hideHat: false, auto: true };
  try {
    const raw = JSON.parse(store()?.getItem(KEY) ?? "null");
    if (raw && typeof raw === "object") return { level: normalizeFxLevel(raw.level), reduce: typeof raw.reduce === "boolean" ? raw.reduce : def.reduce, shake: raw.shake === "off" || raw.shake === "full" ? raw.shake : "boss", cine: typeof raw.cine === "boolean" ? raw.cine : true, cutin: typeof raw.cutin === "boolean" ? raw.cutin : true, halo: raw.halo === "feet" || raw.halo === "old" ? raw.halo : "halo", hideHat: raw.hideHat === true, auto: raw.auto !== false }; // bản lưu cũ không có `shake` → Chỉ boss
  } catch { /* hỏng thì dùng mặc định */ }
  return def;
}

/** Cài đặt hiệu ứng hiện hành (đối tượng sống, mọi nơi đọc trực tiếp). */
export const fxPrefs: FxPrefs = load();
/** Giảm chuyển động (G8 #399): gắn lớp `reduce-motion` lên <html> để CSS tắt cả nháy / rung / nhấp nháy giao diện, không chỉ khi hệ điều hành bật (style.css, cuối file). */
function applyReduceClass(): void { try { document.documentElement.classList.toggle("reduce-motion", fxPrefs.reduce); } catch { /* không có DOM (bot, kiểm thử) */ } }
applyReduceClass();
export function setFxPrefs(p: Partial<FxPrefs>): void {
  Object.assign(fxPrefs, p);
  applyReduceClass();
  try { store()?.setItem(KEY, JSON.stringify(fxPrefs)); } catch { /* localStorage có thể bị khóa */ }
}

// ---- H8 (#491): tự hạ mức hiệu ứng khi FPS thấp. Chỉ hiển thị, không đổi lựa chọn đã lưu của người chơi.
export { GOV };
export const fxGov = new FxGovernor();
/** Mức hiệu ứng đang áp dụng: lựa chọn của người chơi, hạ thêm khi FPS thấp (nếu bật `auto`). MỌI nơi vẽ hiệu ứng đọc hàm này, không đọc `fxPrefs.level`. */
export function fxLevel(): FxLevel { return fxPrefs.auto ? fxGov.effective(fxPrefs.level) : fxPrefs.level; }

/** Trần số hạt cùng lúc theo mức (Thấp: không hạt). */
export const PARTICLE_CAP: Record<FxLevel, number> = { low: 0, mid: 56, high: 140 };
/** Hệ số rung theo mức (Thấp: tắt). */
const SHAKE_K: Record<FxLevel, number> = { low: 0, mid: 1, high: 1.6 };

/** Rung màn hình đã nhân theo mức; 0 khi Thấp, Rung màn hình Tắt hoặc Giảm chuyển động. */
export function shakeK(): number { return fxPrefs.reduce || fxPrefs.shake === "off" ? 0 : SHAKE_K[fxLevel()]; }
export const flashOn = () => !fxPrefs.reduce;
export const zoomOn = () => !fxPrefs.reduce && fxLevel() !== "low" && fxPrefs.shake !== "off";
export const hitstopOn = () => !fxPrefs.reduce && fxLevel() !== "low" && fxPrefs.shake !== "off";
/**
 * Đòn của mình lên hồn thú bậc `rank` (0 thường, 1 tinh anh, 2 thú vương, 3 boss thế giới) có được rung / phóng to / dừng hình không (#437):
 * hồn thú thường không (trừ "Đầy đủ"); đang tự săn chỉ còn thú vương / boss.
 */
export function beastJerk(rank: number, auto: boolean): boolean {
  if (fxPrefs.shake === "off" || (auto && rank < 2)) return false;
  return fxPrefs.shake === "full" || rank >= 1;
}

/**
 * Thời gian dừng hình (ms, 40–80): theo tỉ lệ sát thương / sinh lực tối đa của mục tiêu; chí mạng và kết liễu lâu hơn.
 * `ratio` = sát thương / sinh lực tối đa.
 */
export function hitstopMs(ratio: number, crit: boolean, kill: boolean, heavy = 0): number {
  const more = HEAVY_STOP_MS[Math.min(3, heavy)] ?? 0; // chiêu nặng (SKILL_VISUAL.heavy, S1 #542) khựng lâu thêm
  if (kill) return Math.min(HITSTOP_MAX, 80 + more);
  return Math.min(HITSTOP_MAX, Math.round(40 + Math.min(1, ratio * 6) * 20 + (crit ? 20 : 0)) + more);
}
/** Cộng thêm vào thời gian dừng hình (ms) theo độ nặng khai báo của chiêu (S1 #542); trần chung. */
export const HEAVY_STOP_MS: readonly number[] = [0, 6, 12, 18];
export const HITSTOP_MAX = 96;
/** Cấp rung 0–3 → [ms, cường độ] (trúng thường ≈ 0, chí mạng nhẹ, boss / vòng cao mạnh). */
export const SHAKE_TIER: [number, number][] = [[0, 0], [90, 0.0015], [170, 0.003], [320, 0.0055]];

/** Màu và kiểu tia va chạm theo hệ võ hồn của người đánh. */
export const HIT_SPARK: Record<He, { col: number; n: number; speed: number; size: number }> = {
  cuong_cong: { col: 0xff8a4a, n: 9, speed: 95, size: 3 },   // mạnh, tỏa rộng, hạt to
  man_cong:   { col: 0xbff4ff, n: 7, speed: 150, size: 2 },  // nhanh, mảnh
  khong_che:  { col: 0xc49bff, n: 8, speed: 70, size: 2 },   // chậm, xoáy
  phu_tro:    { col: 0x8ef0b0, n: 6, speed: 60, size: 2 },   // nhẹ, bồng bềnh
};

/**
 * Lớp hạt dùng chung: mảng định sẵn (không cấp phát mỗi hạt), một Graphics vẽ lại mỗi khung, quá trần thì bỏ hạt mới.
 * Tọa độ màn hình; `g` ≈ độ rơi (âm: bay lên).
 */
export class ParticleLayer {
  private g: Phaser.GameObjects.Graphics;
  private n = 0;
  private x: Float32Array; private y: Float32Array; private vx: Float32Array; private vy: Float32Array;
  private life: Float32Array; private max: Float32Array; private size: Float32Array; private gr: Float32Array; private col: Uint32Array;
  constructor(scene: Phaser.Scene, depth: number, private px: number) {
    const N = Math.max(...Object.values(PARTICLE_CAP));
    this.g = scene.add.graphics().setDepth(depth);
    this.x = new Float32Array(N); this.y = new Float32Array(N); this.vx = new Float32Array(N); this.vy = new Float32Array(N);
    this.life = new Float32Array(N); this.max = new Float32Array(N); this.size = new Float32Array(N); this.gr = new Float32Array(N);
    this.col = new Uint32Array(N);
  }
  get count() { return this.n; }
  emit(x: number, y: number, col: number, o: { vx?: number; vy?: number; life?: number; size?: number; gravity?: number }) {
    const cap = PARTICLE_CAP[fxLevel()];
    if (this.n >= cap) return;
    const i = this.n++;
    this.x[i] = x; this.y[i] = y; this.vx[i] = o.vx ?? 0; this.vy[i] = o.vy ?? 0; this.gr[i] = o.gravity ?? 0;
    this.life[i] = this.max[i] = o.life ?? 0.4; this.size[i] = o.size ?? 2; this.col[i] = col;
  }
  /** Tia tỏa quanh (x, y). */
  burst(x: number, y: number, col: number, n: number, speed: number, size: number, life = 0.28, gravity = 0) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.5 + Math.random() * 0.5);
      this.emit(x, y, k % 3 === 0 ? 0xffffff : col, { vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, life: life * (0.7 + Math.random() * 0.5), size, gravity });
    }
  }
  /** Bụi sáng tan ra từ khung chữ nhật, trôi lên rồi mờ. */
  dust(cx: number, cy: number, w: number, h: number, col: number, n: number) {
    for (let k = 0; k < n; k++) {
      this.emit(cx + (Math.random() - 0.5) * w, cy - Math.random() * h, k % 2 ? 0xffffff : col,
        { vx: (Math.random() - 0.5) * 24, vy: -(18 + Math.random() * 40), life: 0.7 + Math.random() * 0.5, size: 2, gravity: -10 });
    }
  }
  /** Bụi chân nhỏ theo nhịp bước; không dùng lõi trắng để không chớp gắt. */
  footDust(cx: number, cy: number, col: number, n: number, walking: boolean) {
    for (let k = 0; k < n; k++) {
      this.emit(cx + (Math.random() - 0.5) * 8 * this.px, cy - Math.random() * 2 * this.px, k % 2 ? col : 0x4a3c35,
        { vx: (Math.random() - 0.5) * 18 * this.px, vy: -(8 + Math.random() * (walking ? 16 : 22)) * this.px / 2, life: 0.24 + Math.random() * 0.16, size: walking ? 1.5 : 2, gravity: 8 });
    }
  }
  update(dt: number) {
    const g = this.g; g.clear();
    let i = 0;
    while (i < this.n) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { // đổi chỗ với hạt cuối
        const j = --this.n;
        if (i !== j) {
          this.x[i] = this.x[j]; this.y[i] = this.y[j]; this.vx[i] = this.vx[j]; this.vy[i] = this.vy[j]; this.life[i] = this.life[j];
          this.max[i] = this.max[j]; this.size[i] = this.size[j]; this.gr[i] = this.gr[j]; this.col[i] = this.col[j];
        }
        continue;
      }
      this.vy[i] += this.gr[i] * dt; this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt;
      const s = this.size[i] * this.px;
      g.fillStyle(this.col[i], Math.min(1, (this.life[i] / this.max[i]) * 1.6)).fillRect(this.x[i] - s / 2, this.y[i] - s / 2, s, s);
      i++;
    }
  }
  clear() { this.n = 0; this.g.clear(); }
  destroy() { this.g.destroy(); }
}
