// G3 (#394): hiệu ứng hồn kỹ theo hệ. Chỉ hiển thị ở client (không đổi state, luật hay số cân bằng; số cân bằng ở shared/data.ts).
// Texture tĩnh (ComfyUI, `fx_<hệ>_<kiểu>`) + chuyển động Phaser; vị trí bám lưới pixel (bội SPR), texture chưa có thì chỉ chạy hạt.
import Phaser from "phaser";
import { SkillDef, VOHON, ringSkill, chanThanOf } from "../../shared/data.ts";
import { ELEMENTS, elementOf, type Element } from "./audio/soundMap.ts";
import { SPR } from "./iso.ts";
import { fxPrefs, type ParticleLayer } from "./combatFx.ts";

/** 5 kiểu dựng sẵn: phóng (bay tới), vùng tròn (trên mặt đất), chém (vệt cong), hào quang buff (quanh thân), tia trúng (tại mục tiêu). */
export type FxKind = "proj" | "zone" | "slash" | "aura" | "hit";
export const FX_KINDS: readonly FxKind[] = ["proj", "zone", "slash", "aura", "hit"];
export const FX_KIND_NAME: Record<FxKind, string> = { proj: "Phóng", zone: "Vùng tròn", slash: "Chém", aura: "Hào quang", hit: "Tia trúng" };
export const ELEMENT_NAME: Record<Element, string> = { fire: "Hỏa", ice: "Băng", lightning: "Lôi", poison: "Độc", light: "Quang", dark: "Ám", wood: "Mộc", wind: "Phong" };

/** Hệ → tiền tố texture. Texture đã có theo hệ (cập nhật khi thêm ảnh): hệ khác chỉ chạy hạt. */
const TEX_PREFIX: Record<Element, string> = { fire: "lua", ice: "bang", lightning: "loi", poison: "doc", light: "quang", dark: "am", wood: "moc", wind: "phong" };
/** Tên texture của từng kiểu (mỗi hệ 5 ảnh `fx_<tiền tố>_<tên>`). */
const TEX_NAME: Record<FxKind, string> = { proj: "cau", zone: "phu", slash: "chem", aura: "ngon", hit: "tia" };
export const fxTexKey = (el: Element, kind: FxKind) => `fx_${TEX_PREFIX[el]}_${TEX_NAME[kind]}`;
/** Khóa texture cần tải theo manifest: hệ nào đã có ảnh. */
export const FX_TEX_ELEMENTS: readonly Element[] = ["fire", "ice", "lightning", "poison", "light", "dark", "wood", "wind"];

/** Màu hệ: chính, sáng (lõi / hạt), tối (viền khói). */
export const ELEMENT_COL: Record<Element, { main: number; hi: number; lo: number }> = {
  fire:      { main: 0xff7a2a, hi: 0xffe08a, lo: 0x8f2a14 },
  ice:       { main: 0x7fd8ff, hi: 0xeafcff, lo: 0x2a5a9a },
  lightning: { main: 0x8ac8ff, hi: 0xffffff, lo: 0x3a4aa8 },
  poison:    { main: 0x9bd64a, hi: 0xe4ffa0, lo: 0x3a5a1a },
  light:     { main: 0xffe9a0, hi: 0xffffff, lo: 0xb8902a },
  dark:      { main: 0xa06bff, hi: 0xe0c8ff, lo: 0x2a1a4a },
  wood:      { main: 0x5ed06a, hi: 0xd0ffc0, lo: 0x1f5a2a },
  wind:      { main: 0xbff4ff, hi: 0xffffff, lo: 0x5a8aa0 },
};

// ---------- Bảng hiển thị: hồn kỹ → kiểu + hệ ----------
export interface SkillFxDef { kind: FxKind; element: Element; tier?: number }

const KIND_OF_AREA: Record<SkillDef["area"], FxKind> = { proj: "proj", around: "zone", front: "slash", dash: "slash", target: "hit", self: "aura" };
/** Trạng thái gây ra → hệ của hồn kỹ (ưu tiên hơn hệ của võ hồn: Hỏa Long dùng chiêu thiêu đốt thì cháy). */
const ELEMENT_OF_STATUS: Record<string, Element> = { burn: "fire", shock: "lightning", poison: "poison", silence: "dark" };
/** Ngoại lệ theo `<mã võ hồn>:<vòng 0..9>` (chỉ khi mặc định theo area / trạng thái không hợp). */
const OVERRIDE: Readonly<Record<string, Partial<SkillFxDef>>> = {};

/** Kiểu + hệ hiển thị của hồn kỹ ở vòng `ring` (0..9) của võ hồn `vohonId`; `chanThan`: hồn kỹ Chân Thân. */
export function skillFxOf(vohonId: string, ring: number, chanThan = false): SkillFxDef {
  const def = VOHON.find(v => v.id === vohonId);
  const sk = chanThan ? chanThanOf(vohonId)?.skill : ringSkill(vohonId, ring);
  const stEl = sk?.status?.map(s => ELEMENT_OF_STATUS[s.s]).find(Boolean);
  const base: SkillFxDef = { kind: sk ? KIND_OF_AREA[sk.area] : "zone", element: stEl ?? elementOf(def) };
  return { ...base, ...OVERRIDE[`${vohonId}:${ring}`] };
}
/** Hồn kỹ lớn (vòng 7+ hoặc Chân Thân, ring chỉ số 6+): cảnh tối màn, chân dung, tên chiêu. */
export const isCinematic = (ring: number, chanThan: boolean) => chanThan || ring >= 6;
export { ELEMENTS };

// ---------- Bộ dựng ----------
/** Trần số sprite hiệu ứng cùng lúc theo mức (Thấp: tối giản, chỉ 1 hình chính). */
const SPRITE_CAP: Record<"low" | "mid" | "high", number> = { low: 4, mid: 14, high: 30 };
/** Số hạt theo mức: nhân với số hạt gốc của từng kiểu. */
const PART_K: Record<"low" | "mid" | "high", number> = { low: 0, mid: 1, high: 1.7 };
const snap = (v: number) => Math.round(v / SPR) * SPR;
const HALO_KEY = "fx_halo";

export interface PlayOpts {
  /** Tâm (màn hình, chân nếu là vùng / hào quang). */
  x: number; y: number;
  /** Hướng bay / chém, rad màn hình (0 = phải). */
  ang?: number;
  /** Nửa bề ngang vùng, pixel màn hình (zone / slash). */
  r?: number;
  /** Màu niên hạn (TIERS[..].glow): pha vào lõi và hạt. */
  tierCol?: number;
  /** Quãng bay (proj), pixel màn hình. */
  dist?: number;
  dur?: number;
  /** S2 (#548): chỉ phát hạt (sprite + quầng do sheet `SKILL_VISUAL` thay). */
  partsOnly?: boolean;
}

export class SkillFx {
  private pool: Phaser.GameObjects.Image[] = [];
  private bare = false;
  private live = 0;
  constructor(private scene: Phaser.Scene, private fxp: ParticleLayer, private depth = 99982) {
    // Quầng sáng bậc thang (đĩa đồng tâm, không làm mờ mượt) để hợp phong cách pixel; tô màu hệ khi dùng.
    if (!scene.textures.exists(HALO_KEY)) {
      const t = scene.textures.createCanvas(HALO_KEY, 32, 32); if (t) {
        const c = t.getContext(); for (let r = 15; r >= 3; r -= 4) { c.fillStyle = `rgba(255,255,255,${0.14 + (15 - r) * 0.03})`; c.beginPath(); c.arc(16, 16, r, 0, Math.PI * 2); c.fill(); } t.refresh();
      }
    }
  }

  get active() { return this.live; }

  private grab(key: string): Phaser.GameObjects.Image | null {
    if (this.bare || this.live >= SPRITE_CAP[fxPrefs.level] || !this.scene.textures.exists(key)) return null;
    let s = this.pool.pop();
    if (!s) s = this.scene.add.image(0, 0, key).setBlendMode(Phaser.BlendModes.ADD);
    s.setTexture(key).clearTint().setActive(true).setVisible(true).setDepth(this.depth).setAlpha(1).setFlip(false, false).setRotation(0).setOrigin(0.5);
    this.live++;
    return s;
  }
  private drop(s: Phaser.GameObjects.Image) {
    s.setActive(false).setVisible(false); this.live = Math.max(0, this.live - 1);
    this.pool.push(s);
  }
  /** Phóng sprite `s` theo tween `o.k` 0→1; hủy trả pool khi xong. */
  private run(s: Phaser.GameObjects.Image, dur: number, upd: (k: number) => void, delay = 0) {
    const o = { k: 0 };
    s.setVisible(false);
    this.scene.tweens.add({ targets: o, k: 1, duration: dur, delay, onStart: () => s.setVisible(true), onUpdate: () => upd(o.k), onComplete: () => this.drop(s) });
  }
  /** Quầng sáng màu `col` rộng ~`w` pixel màn hình, tắt dần trong `dur` ms (bám lưới: tâm và cỡ làm tròn theo SPR). */
  private halo(x: number, y: number, col: number, w: number, dur: number, follow?: (k: number) => { x: number; y: number }) {
    if (this.bare) return;
    const s = this.grab(HALO_KEY); if (!s) return;
    s.setTint(col).setScale(Math.max(SPR, snap(w / 32))); s.setPosition(snap(x), snap(y));
    this.run(s, dur, k => { if (follow) { const p = follow(k); s.setPosition(snap(p.x), snap(p.y)); } s.setAlpha((1 - k) * 0.75); });
  }
  /** Cỡ nguyên theo bội SPR sao cho ảnh rộng xấp xỉ `w` pixel màn hình. */
  private scaleFor(s: Phaser.GameObjects.Image, w: number) { return Math.max(1, Math.round(w / (s.width * SPR))) * SPR; }

  play(kind: FxKind, el: Element, o: PlayOpts) {
    this.bare = !!o.partsOnly;
    const c = ELEMENT_COL[el], tc = o.tierCol ?? c.hi, lv = fxPrefs.level, pk = PART_K[lv];
    const tex = fxTexKey(el, kind), a = o.ang ?? 0, reduce = fxPrefs.reduce;
    const n = (k: number) => Math.round(k * pk);
    if (kind === "proj") {
      const dist = o.dist ?? 110 * SPR, dur = o.dur ?? 420, x1 = o.x + Math.cos(a) * dist, y1 = o.y + Math.sin(a) * dist * 0.5;
      const s = this.grab(tex);
      if (s) { s.setScale(this.scaleFor(s, 28 * SPR)).setFlipX(Math.cos(a) < 0); this.run(s, dur, k => { s.setPosition(snap(o.x + (x1 - o.x) * k), snap(o.y + (y1 - o.y) * k)); s.setAlpha(k > 0.85 ? (1 - k) / 0.15 : 1); }); }
      this.halo(o.x, o.y, c.main, 44 * SPR, dur, k => ({ x: o.x + (x1 - o.x) * k, y: o.y + (y1 - o.y) * k }));
      // vệt hạt sau đầu đạn
      const steps = Math.max(2, n(10));
      for (let j = 0; j < steps && pk > 0; j++) this.scene.time.delayedCall((j / steps) * dur * 0.9, () => {
        const k = (j / steps) * 0.9;
        this.fxp.emit(o.x + (x1 - o.x) * k, o.y + (y1 - o.y) * k, j % 2 ? c.hi : c.main, { vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 20, life: 0.4, size: 2, gravity: -12 });
      });
      this.scene.time.delayedCall(dur, () => this.play("hit", el, { x: x1, y: y1, tierCol: tc, partsOnly: o.partsOnly }));
    } else if (kind === "zone") {
      const r = o.r ?? 60 * SPR, dur = o.dur ?? 700, s = this.grab(tex);
      if (s) { const sc = this.scaleFor(s, 2 * r); s.setScale(sc, sc / 2); s.setPosition(snap(o.x), snap(o.y)); this.run(s, dur, k => {
        const q = reduce ? 1 : 0.55 + 0.45 * Math.min(1, k * 3); // nở thành bậc (bám lưới)
        s.setScale(Math.max(SPR, snap(sc * q)), Math.max(SPR / 2, snap(sc * q) / 2)); s.setAlpha(k < 0.2 ? k / 0.2 : (1 - k) / 0.8);
      }); }
      this.halo(o.x, o.y, c.main, 1.25 * r, dur * 0.8);
      const m = n(14);
      for (let j = 0; j < m; j++) this.scene.time.delayedCall(j * (dur / (m + 1)) * 0.7, () => {
        const t = Math.random() * Math.PI * 2, d = r * (0.2 + 0.8 * Math.random());
        this.fxp.emit(o.x + Math.cos(t) * d, o.y + Math.sin(t) * d * 0.5, j % 3 ? c.main : tc, { vy: -(30 + Math.random() * 40) * SPR / 2, life: 0.6, size: 2, gravity: -8 });
      });
    } else if (kind === "slash") {
      const dur = o.dur ?? 300, s = this.grab(tex), r = o.r ?? 36 * SPR, dx = Math.cos(a), dy = Math.sin(a) * 0.5;
      const cx = o.x + dx * r * 0.7, cy = o.y - 8 * SPR + dy * r * 0.7;
      if (s) { s.setScale(this.scaleFor(s, 1.6 * r)).setFlipX(dx < 0); s.setPosition(snap(cx), snap(cy)); this.run(s, dur, k => { s.setAlpha(1 - k * k); s.x = snap(cx + dx * r * 0.3 * k); s.y = snap(cy + dy * r * 0.3 * k); }); }
      const m = n(9);
      for (let j = 0; j < m; j++) { // tàn lửa tung quanh vệt chém, bay theo hướng chém
        const t = Math.random() * 2 - 1, u = Math.random();
        this.fxp.emit(cx + Math.cos(a + Math.PI / 2) * t * r * 0.5 + dx * u * r * 0.4, cy + Math.sin(a + Math.PI / 2) * t * r * 0.25 + dy * u * r * 0.4,
          j % 2 ? c.hi : c.main, { vx: dx * (40 + Math.random() * 50), vy: dy * 30 - 10 - Math.random() * 20, life: 0.35 + Math.random() * 0.2, size: 2, gravity: 8 });
      }
    } else if (kind === "aura") {
      const dur = o.dur ?? 700, s = this.grab(tex);
      if (s) { s.setScale(this.scaleFor(s, 26 * SPR)); this.run(s, dur, k => { s.setPosition(snap(o.x), snap(o.y - (10 + 14 * k) * SPR)); s.setAlpha(Math.sin(k * Math.PI)); }); }
      this.halo(o.x, o.y - 10 * SPR, c.main, 36 * SPR, dur);
      const m = n(12);
      for (let j = 0; j < m; j++) this.scene.time.delayedCall(j * (dur / (m + 1)) * 0.8, () => this.fxp.emit(o.x + (Math.random() - 0.5) * 18 * SPR, o.y - 2 * SPR, j % 3 ? c.main : tc, { vx: (Math.random() - 0.5) * 10, vy: -(34 + Math.random() * 40) * SPR / 2, life: 0.7, size: 2, gravity: -6 }));
    } else { // hit
      const dur = o.dur ?? 280, s = this.grab(tex);
      if (s) { s.setScale(this.scaleFor(s, 22 * SPR)); s.setPosition(snap(o.x), snap(o.y - 8 * SPR)); this.run(s, dur, k => { s.setAlpha(1 - k); }); }
      this.halo(o.x, o.y - 8 * SPR, c.hi, 40 * SPR, dur);
      this.fxp.burst(o.x, o.y - 8 * SPR, c.main, n(10), 80 * SPR / 2, 2, 0.32, -4);
      if (pk > 0) this.fxp.burst(o.x, o.y - 8 * SPR, c.hi, n(4), 40 * SPR / 2, 2, 0.2);
    }
  }

  destroy() { this.pool.forEach(s => s.destroy()); this.pool = []; this.live = 0; }
}
