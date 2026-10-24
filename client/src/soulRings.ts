// Vòng hồn hoàn quanh hồn sư (mục 5.11 "Vòng hồn hoàn"; quầng hào quang Chân Thân #535). Chỉ hiển thị, đọc state đã đồng bộ.
// - Bình thường: các vòng đồng tâm trên mặt đất dưới chân; tung hồn kỹ thì vòng đó bay lên ngang ngực rồi hạ về.
// - Chân Thân, kiểu "Hào quang" (mặc định): lúc biến hình (PT_FORM) các vòng lần lượt bay xoắn lên, rồi hợp thành quầng đồng tâm nhỏ SAU lưng
//   (chỉ lớp sau thân, nằm trên pháp tướng lớp sau); vòng `HAO_QUANG.foot` ở lại dưới chân và sáng; hồn kỹ chỉ làm vòng tương ứng lóe sáng;
//   hết Chân Thân thì quầng hạ về dưới chân. Kiểu "Dưới chân": không bay, vòng 7 sáng. Kiểu "Kiểu cũ": các vòng bay xếp quanh thân.
// - Mức hiệu ứng (`fxPrefs`): Thấp / Giảm chuyển động bỏ xoắn, xoay và lớp sáng; người khác thấy bản nhẹ hơn (PT_OTHERS_K, không xoay, không lớp trước).
import Phaser from "phaser";
import { TIERS, HAO_QUANG as H, PT_FORM, PT_OTHERS_K } from "../../shared/data.ts";
import { fxPrefs } from "./combatFx.ts";
import { SPR } from "./iso.ts";
import { soulRingKey } from "./textures.ts";

/** Vòng thứ i bay lên ngang ngực, sáng rồi hạ về trong chừng này mili giây khi tung hồn kỹ của vòng đó (kiểu thường). */
export const RING_LIT_MS = 450;
/** Vòng hồn hoàn khi bay lên: độ cao ngang ngực khi tung hồn kỹ; Chân Thân kiểu cũ xếp đều các vòng từ RING_UP_LOW tới RING_UP_TOP (pixel nội bộ). */
const RING_CHEST = 28, RING_UP_LOW = 6, RING_UP_TOP = 52;
const TAU = Math.PI * 2;
const hex = (c: string) => parseInt(c.slice(1), 16);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
/** Màu nét theo niên hạn; vòng đen dùng màu sáng (tím) vì nét đen chìm trên nền tối. */
const lineCol = (t: number) => hex(t === 3 ? TIERS[3].glow : (TIERS[t] ?? TIERS[0]).col);

/** Hai lớp vẽ quầng (sau thân; trước thân chỉ lúc các vòng bay xoắn) và trạng thái chuyển. Tạo khi cần lần đầu. */
export interface HaloState { gB: Phaser.GameObjects.Graphics; gF: Phaser.GameObjects.Graphics; on: boolean; out: number }
/** Phần của hồn sư mà vòng hồn hoàn cần (PView ở GameScene, hồn sư thử ở trang `?thu=phaptuong`). */
export interface RingHost {
  root: Phaser.GameObjects.Container; ringsB: Phaser.GameObjects.Container; ringsF: Phaser.GameObjects.Container;
  ringY: number[]; lit: { i: number; t0: number } | null; halo: HaloState | null;
}
export interface RingState { ava: number; dead: boolean; rings: ArrayLike<number> }
/** mine: chính mình; formAge: giây từ lúc bắt đầu biến hình (PhapTuongSystem.formAge, -1 nếu không đang biến); lift: độ nhấc khi bay; delta: ms khung. */
export interface RingOpts { mine: boolean; formAge: number; lift: number; delta: number }

/**
 * Một cặp ảnh cho mỗi hồn hoàn của võ hồn ra trận: cung trên (sau thân) và cung dưới (trước thân), vẽ ở pixel nội bộ (phóng 1 / SPR
 * trong khung chứa); texture đặt mỗi khung theo cách hiện (animateRings).
 */
export function buildRings(scene: Phaser.Scene, v: RingHost, tiers: number[]) {
  v.ringsB.removeAll(true); v.ringsF.removeAll(true); v.ringY = tiers.map(() => 0);
  tiers.forEach((t, k) => {
    const key = soulRingKey(scene, t, k);
    v.ringsB.add(scene.make.image({ key, frame: 0 }, false).setScale(1 / SPR));
    v.ringsF.add(scene.make.image({ key, frame: 1 }, false).setScale(1 / SPR));
  });
}

function haloOf(scene: Phaser.Scene, v: RingHost): HaloState {
  if (v.halo) return v.halo;
  const mk = () => scene.make.graphics({}, false).setScale(1 / SPR).setVisible(false);
  const gB = mk(), gF = mk();
  v.root.addAt(gB, 1); // sau bóng, trước mọi lớp thân và vòng; pháp tướng lớp sau nằm ngoài `root`, dưới cả khung này
  v.root.add(gF);
  return (v.halo = { gB, gF, on: false, out: -1 });
}

/** Đặt vị trí, texture, độ đục các vòng và vẽ quầng. Gọi mỗi khung từ animatePlayer. */
export function animateRings(scene: Phaser.Scene, v: RingHost, p: RingState, time: number, o: RingOpts) {
  const n = v.ringsB.length, up = p.ava > 0 && !p.dead, mode = fxPrefs.halo, lv = fxPrefs.level, calm = fxPrefs.reduce;
  v.ringsB.setVisible(!p.dead); v.ringsF.setVisible(!p.dead);
  const lit = v.lit && time < v.lit.t0 + RING_LIT_MS ? v.lit.i : -1;
  const ease = Math.min(1, o.delta / 90);
  const F = n > H.foot ? H.foot : -1;

  // Quầng: trạng thái bật / tắt và độ bay e[k] (0 dưới chân, 1 trong quầng) của từng vòng
  let h = v.halo;
  if (mode === "halo" && !h && up) h = haloOf(scene, v);
  if (h) {
    const on = up && mode === "halo";
    if (on && !h.on) h.out = -1;
    else if (!on && h.on) h.out = p.dead ? -1 : time;
    h.on = on;
    if (h.out >= 0 && (time - h.out > H.fadeOut * 1000 || mode !== "halo")) h.out = -1;
  }
  const outing = !!h && h.out >= 0;
  const haloOn = !!h && (h.on || outing) && n > 0;
  const e: number[] = [];
  if (haloOn) {
    const spiral = !calm && lv !== "low", age = o.formAge;
    const stag = Math.min(H.stagger, Math.max(0, PT_FORM.total - 0.08 - H.flight) / Math.max(1, n - 1));
    const stOut = (H.fadeOut * 0.3) / Math.max(1, n - 1), durOut = H.fadeOut * 0.7, tOut = outing ? (time - h!.out) / 1000 : 0;
    for (let k = 0; k < n; k++) {
      e[k] = k === F ? 0 : outing ? 1 - easeInOut(clamp01((tOut - k * stOut) / durOut)) : age >= 0 && spiral ? easeInOut(clamp01((age - k * stag) / H.flight)) : 1;
    }
  }

  const pending = (k: number) => haloOn && k !== F && e[k] > 0; // đang bay hoặc trong quầng: ảnh dưới chân ẩn
  for (let k = 0; k < n; k++) {
    const t = p.rings[k], flash = k === lit;
    let a: number, y: number, key: string;
    if (up && mode === "old") {
      // Kiểu cũ: mọi vòng bay lên xếp đều quanh thân
      const want = RING_UP_LOW + ((k + 0.5) * (RING_UP_TOP - RING_UP_LOW)) / n + Math.sin(time / 600 + k * 1.3) * 1.5;
      v.ringY[k] += (want - v.ringY[k]) * ease;
      key = soulRingKey(scene, t, "up", flash); a = 1; y = -Math.round(v.ringY[k]) / SPR;
    } else if (up) {
      // Hào quang / Dưới chân: vòng ở lại mặt đất; vòng Chân Thân luôn sáng, vòng đang tung hồn kỹ sáng thêm
      v.ringY[k] = 0; y = 0;
      key = soulRingKey(scene, t, k, k === F || flash);
      a = k === F ? 0.9 + 0.1 * Math.sin(time / 380) : 0.7 + 0.3 * Math.sin(time / 380 - k * 0.7);
      if (pending(k)) a = 0;
    } else {
      // Bình thường (kể cả khi quầng đang hạ về): vòng đang tung hồn kỹ bay lên ngang ngực, sáng rồi hạ về
      const self = flash, f = self ? (time - v.lit!.t0) / RING_LIT_MS : 0;
      const want = self ? Math.sin(Math.PI * f) * RING_CHEST : 0;
      v.ringY[k] = self ? want : v.ringY[k] + (want - v.ringY[k]) * ease;
      const flying = self || v.ringY[k] > 2;
      key = soulRingKey(scene, t, flying ? "up" : k, self);
      a = flying ? 1 : 0.7 + 0.3 * Math.sin(time / 380 - k * 0.7); y = -Math.round(v.ringY[k]) / SPR;
      if (pending(k)) a = 0;
    }
    (v.ringsB.list[k] as Phaser.GameObjects.Image).setTexture(key, 0).setY(y).setAlpha(a);
    (v.ringsF.list[k] as Phaser.GameObjects.Image).setTexture(key, 1).setY(y).setAlpha(a);
  }

  if (h) {
    h.gB.setVisible(haloOn).setY(o.lift); h.gF.setVisible(haloOn).setY(o.lift);
    if (haloOn) drawHalo(h, p, time, o, e, F, lit, v.lit?.t0 ?? 0, outing ? 1 - clamp01((time - h.out) / (H.fadeOut * 1000)) * 0.35 : 1);
    else { h.gB.clear(); h.gF.clear(); }
  }
}

/**
 * Vẽ các vòng đang bay (e < 1: elip nghiêng, xoắn, đầu sao băng) và quầng (e = 1: vòng tròn đứt đoạn xoay, hướng về người xem).
 * Tọa độ pixel nội bộ, gốc ở chân; `fade`: hệ số độ đục chung (quầng tan).
 */
function drawHalo(h: HaloState, p: RingState, time: number, o: RingOpts, e: number[], F: number, lit: number, litT0: number, fade: number) {
  const { gB, gF } = h, n = e.length, lv = fxPrefs.level, calm = fxPrefs.reduce;
  gB.clear(); gF.clear();
  const rich = o.mine && !calm && lv !== "low"; // xoay, lớp sáng, đầu sao băng, lớp trước
  const ok = o.mine ? 1 : PT_OTHERS_K[lv];
  const cy = -H.cy, ts = time / 1000;
  const ramp = o.formAge >= 0 && !rich ? clamp01(o.formAge / (PT_FORM.total * 0.6)) : 1; // không xoắn: hiện dần theo chuỗi biến hình
  const slots: number[] = [];
  for (let k = 0; k < n; k++) if (k !== F) slots.push(k);
  const rOut = H.r0 + H.step * Math.max(0, slots.length - 1);
  // nền rất mờ: chỉ để quầng có chiều sâu, không che pháp tướng
  const top = Math.max(...Array.from({ length: n }, (_, k) => p.rings[k]));
  if (rich && slots.every((k) => e[k] >= 1)) gB.fillStyle(hex(TIERS[top]?.glow ?? "#ffffff"), 0.06 * fade).fillCircle(0, cy, rOut + 1);
  slots.forEach((k, j) => {
    const t = p.rings[k], col = lineCol(t), glow = hex((TIERS[t] ?? TIERS[0]).glow), dir = j % 2 ? -1 : 1;
    const ek = e[k], rt = H.r0 + H.step * j, rf = 15 + 3 * k;
    const spin = rich ? dir * H.spin * ts * (1 + 0.08 * j) : 0, base = j * 1.3 + spin;
    const rx = lerp(rf, rt, ek), ry = rx * lerp(0.5, 1, ek), cyk = cy * ek;
    const rot = base + (ek < 1 ? dir * H.turns * TAU * (ek - 1) : 0);
    const m = 3 + (j % 3), frac = lerp(1, 0.72, ek), pulse = calm ? 1 : 0.85 + 0.15 * Math.sin(ts * (1000 / H.pulse) * TAU + j * 0.9);
    const flash = k === lit ? Math.sin(Math.PI * clamp01((time - litT0) / (H.litSec * 1000))) : 0;
    const al = clamp01((H.alpha + 0.08 * t) * pulse * ok * fade * ramp);
    const split = ek < 0.98 && rich; // đang nghiêng: nửa gần người xem vẽ lớp trước
    if (rich) { gB.lineStyle(3, 0x0a0614, 0.4 * al / H.alpha * fade * ramp); arcs(gB, gB, 0, cyk, rx, ry, rot, m, frac, false); } // viền tối: nét nổi trên nền pháp tướng sáng
    gB.lineStyle(1, col, al); gF.lineStyle(1, col, al);
    arcs(gB, gF, 0, cyk, rx, ry, rot, m, frac, split);
    if (flash > 0) {
      gB.lineStyle(2, glow, clamp01(flash * 0.9)); arcs(gB, gB, 0, cyk, rx + 1.5 * flash, ry + 1.5 * flash, rot, m, 1, false);
      gB.lineStyle(1, 0xffffff, clamp01(flash)); arcs(gB, gB, 0, cyk, rx, ry, rot, m, 1, false);
    }
    if (split) {
      // đầu sao băng chạy đầu dải xoắn
      const a0 = rot + dir * 0.6;
      for (let s = 0; s < 4; s++) {
        const a = a0 - dir * s * 0.22, x = Math.cos(a) * rx, y = cyk + Math.sin(a) * ry, g = Math.sin(a) > 0 ? gF : gB;
        g.fillStyle(0xffffff, (1 - s * 0.22) * (1 - ek * 0.6) * fade).fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
      }
    }
  });
}

/** Vẽ `m` dải cung đều nhau (mỗi dải chiếm `frac` của khoảng chia) của elip tâm (cx, cy); `split`: đoạn nửa gần người xem (sin > 0) vẽ vào `gF`. */
function arcs(gB: Phaser.GameObjects.Graphics, gF: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, rot: number, m: number, frac: number, split: boolean) {
  const span = (TAU / m) * frac, steps = Math.max(2, Math.ceil(span / 0.28));
  for (let d = 0; d < m; d++) {
    const a0 = rot + (d * TAU) / m;
    if (!split) gB.beginPath();
    for (let s = 0; s < steps; s++) {
      const x0 = cx + Math.cos(a0 + (span * s) / steps) * rx, y0 = cy + Math.sin(a0 + (span * s) / steps) * ry;
      const x1 = cx + Math.cos(a0 + (span * (s + 1)) / steps) * rx, y1 = cy + Math.sin(a0 + (span * (s + 1)) / steps) * ry;
      if (split) (Math.sin(a0 + (span * (s + 0.5)) / steps) > 0 ? gF : gB).lineBetween(x0, y0, x1, y1);
      else { if (s === 0) gB.moveTo(x0, y0); gB.lineTo(x1, y1); }
    }
    if (!split) gB.strokePath();
  }
}
