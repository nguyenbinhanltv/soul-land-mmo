// Pháp tướng Võ Hồn Chân Thân (#482 / #486, GAME_DESIGN 5.18): hư ảnh võ hồn khổng lồ sau lưng hồn sư khi Chân Thân bật.
// Chỉ hiển thị ở client (không đổi state, mạng hay luật chơi). Số liệu ở `PHAP_TUONG` / `PT_*` trong shared/data.ts.
// - Sheet `pt_<mã>` (khung 160×160, hàng = hướng, 16 cột: 8 thở + 8 đánh) do preloadSprites tải; chưa có ảnh thì vẽ bản tạm bằng code (tempSheet).
// - Mỗi người đang Chân Thân có một `Rig` gồm 1–2 hình (hai pháp tướng hòa nhau cho dung hợp kỹ H6); sprite lấy từ pool, không tạo mỗi khung.
// - Chuỗi: hiện từ dưới lên (cột sáng vẽ ở auraFx) → gầm → giữ; hết Chân Thân thì tan thành bụi sáng. Đánh: lấy đà → ra đòn → dừng hình
//   2–3 khung + chớp sáng tại chỗ → thu về; KHÔNG rung màn hình (chỉ rung khi đánh boss).
import Phaser from "phaser";
import {
  PHAP_TUONG, PT_FRAME, PT_COLS, PT_IDLE_N, PT_ATTACK_N, PT_ORIGIN, PT_DIRS, PT_FRONT_ALPHA, PT_GHOST, PT_FORM, PT_STRIKE,
  PT_OTHERS_K, PT_DUO, PT_BURST_SEC, PT_STAGES, PT_CUTIN_SEC, VOHON, phapTuongStage, type PhapTuongDef, type PtGroup, type PtHat,
} from "../../shared/data.ts";
import { fxPrefs, flashOn, type ParticleLayer, fxLevel } from "./combatFx.ts";
import type { Dir8 } from "./iso.ts";
import { DIRV, ptRow, ptIsBack, ptStrikeFrame, ptStrikeCurve, clamp01 } from "./phapTuongMath.ts";

const hexN = (c: string) => parseInt(c.replace("#", ""), 16);

// ---------- ảnh tạm bằng code ----------

const tempKeys = new Set<string>();
/**
 * Chưa có ảnh `pt_<mã>` thì vẽ sheet tạm (cùng bố cục: 16 cột × 5 hàng, khung 160, alpha 0 / 255, viền #1a1020) theo nhóm bố cục.
 * Trả true nếu đã có texture (thật hoặc tạm). Dùng cho đến khi ảnh H1 / P1..P5 vào main.
 */
export function ensurePtSheet(scene: Phaser.Scene, id: string): boolean {
  const def = PHAP_TUONG[id], vh = VOHON.find((v) => v.id === id);
  if (!def || !vh) return false;
  if (scene.textures.exists(def.sheet)) return true;
  const S = 40, K = PT_FRAME / S, W = PT_COLS * PT_FRAME, H = PT_DIRS.length * PT_FRAME;
  const tex = scene.textures.createCanvas(def.sheet, W, H); if (!tex) return false;
  const ctx = tex.getContext(), small = document.createElement("canvas"); small.width = small.height = S;
  const sc = small.getContext("2d", { willReadFrequently: true })!;
  const ox = PT_ORIGIN[0] / K, oy = PT_ORIGIN[1] / K;
  for (let row = 0; row < PT_DIRS.length; row++) for (let col = 0; col < PT_COLS; col++) {
    sc.clearRect(0, 0, S, S);
    const atk = col >= PT_IDLE_N, i = atk ? col - PT_IDLE_N : col;
    const ph = i / PT_IDLE_N, ext = atk ? Math.sin(Math.min(1, i / (PT_ATTACK_N * 0.62)) * Math.PI * (i > PT_ATTACK_N * 0.62 ? 0.5 : 1)) : 0;
    const dx = [0, -4, -7, -4, 0][row], front = row >= 3;
    sc.save(); sc.translate(ox + dx, oy); drawGroup(sc, def.group, vh.col, vh.robe, ph, ext, front); sc.restore();
    // nhị phân hóa alpha + viền 1 điểm #1a1020 (nhìn như ảnh pixel thật)
    const im = sc.getImageData(0, 0, S, S), d = im.data, solid = new Uint8Array(S * S);
    for (let p = 0; p < S * S; p++) solid[p] = d[p * 4 + 3] > 90 ? 1 : 0;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const p = y * S + x; if (solid[p]) { d[p * 4 + 3] = 255; continue; }
      const nb = (x > 0 && solid[p - 1]) || (x < S - 1 && solid[p + 1]) || (y > 0 && solid[p - S]) || (y < S - 1 && solid[p + S]);
      if (nb) { d[p * 4] = 0x1a; d[p * 4 + 1] = 0x10; d[p * 4 + 2] = 0x20; d[p * 4 + 3] = 255; } else d[p * 4 + 3] = 0;
    }
    sc.putImageData(im, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, col * PT_FRAME, row * PT_FRAME, PT_FRAME, PT_FRAME);
  }
  tex.refresh();
  for (let r = 0; r < PT_DIRS.length; r++) for (let c = 0; c < PT_COLS; c++) tex.add(r * PT_COLS + c, 0, c * PT_FRAME, r * PT_FRAME, PT_FRAME, PT_FRAME);
  tempKeys.add(def.sheet);
  return true;
}

/** Hình tạm theo nhóm, vẽ trong khung 40×40 (gốc ở (0, 0) sau translate); `ph` pha thở 0..1, `ext` mức vươn khi đánh 0..1. */
function drawGroup(c: CanvasRenderingContext2D, g: PtGroup, col: string, dark: string, ph: number, ext: number, front: boolean) {
  const bob = Math.sin(ph * Math.PI * 2) * 0.8 - ext * 1.5, a = front ? 0.95 : 1;
  c.globalAlpha = a; c.lineJoin = "round"; c.lineCap = "round";
  const body = (r: number, x: number, y: number, rx = r, ry = r) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); };
  c.fillStyle = dark; c.strokeStyle = col;
  switch (g) {
    case "S": { // rồng / rắn: dải uốn sóng, đầu ngẩng
      c.lineWidth = 6; c.beginPath();
      for (let k = 0; k <= 20; k++) { const t = k / 20, y = 0 - t * 34 + bob, x = Math.sin(t * 7 + ph * 6.28) * 7 * (1 - t * 0.2); k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); c.lineWidth = 3; c.strokeStyle = dark; c.stroke();
      c.fillStyle = col; body(0, 4 + ext * 5, -35 + bob, 5, 3.5); c.fillStyle = "#fff"; body(0, 6 + ext * 5, -36 + bob, 1, 1); break;
    }
    case "B": { // chim: hai cánh xòe + thân
      const f = Math.sin(ph * Math.PI * 2) * 3 + ext * 5;
      for (const s of [-1, 1]) { c.fillStyle = col; c.beginPath(); c.moveTo(0, -18); c.lineTo(s * 24, -30 - f); c.lineTo(s * 18, -12); c.lineTo(s * 8, -4); c.closePath(); c.fill(); c.fillStyle = dark; c.beginPath(); c.moveTo(0, -16); c.lineTo(s * 14, -22 - f * 0.5); c.lineTo(s * 9, -9); c.closePath(); c.fill(); }
      c.fillStyle = col; body(0, 0, -16 + bob, 4, 8); body(0, 0, -27 + bob, 3, 3.5);
      c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(-4, 3, -1, 12 + Math.sin(ph * 6.28) * 2); c.stroke(); break;
    }
    case "T": { // thú ngồi: thân tròn, đầu, tai, đuôi
      c.fillStyle = dark; body(0, 0, -12 + bob, 12, 13); c.fillStyle = col; body(0, 0, -29 + bob - ext * 2, 7, 6.5);
      body(0, -5, -35 + bob, 2, 4); body(0, 5, -35 + bob, 2, 4);
      c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(11, -6); c.quadraticCurveTo(20, -8 + Math.sin(ph * 6.28) * 4, 18, -18 + ext * -6); c.stroke();
      c.fillStyle = "#fff"; body(0, -3, -29 + bob, 1, 1); body(0, 3, -29 + bob, 1, 1); break;
    }
    case "D": { // bóng người lớn
      c.fillStyle = dark; c.beginPath(); c.moveTo(-14, 4); c.quadraticCurveTo(-16, -22 + bob, 0, -36 + bob); c.quadraticCurveTo(16, -22 + bob, 14, 4); c.closePath(); c.fill();
      c.fillStyle = col; body(0, 0, -30 + bob, 6, 6); c.fillStyle = "#fff"; body(0, -2, -30 + bob, 1, 1); body(0, 2, -30 + bob, 1, 1);
      c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.moveTo(-12, -20); c.lineTo(-17 - ext * 4, -8 + ext * 6); c.moveTo(12, -20); c.lineTo(17 + ext * 4, -8 + ext * 6); c.stroke(); break;
    }
    case "V": { // vũ khí dựng chéo (cán + đầu)
      c.save(); c.rotate(0.35 + ext * 0.5); c.strokeStyle = dark; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -34 + bob); c.stroke();
      c.fillStyle = col; c.fillRect(-7, -38 + bob, 14, 9); c.fillStyle = dark; c.fillRect(-7, -33 + bob, 14, 3); c.restore(); break;
    }
    case "O": { // vật lơ lửng: vòng + lõi
      c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(0, -22 + bob, 13, 0, 7); c.stroke();
      c.fillStyle = dark; body(0, 0, -22 + bob, 8); c.fillStyle = col; body(0, 0, -22 + bob, 4);
      c.fillRect(-1, -22 + bob - 13, 2, 26); c.fillRect(-13, -23 + bob, 26, 2); break;
    }
    case "P": { // hoa / cây: thân + cánh quanh tâm
      c.strokeStyle = dark; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 4); c.quadraticCurveTo(-6, -14, 0, -22 + bob); c.stroke();
      c.fillStyle = col; for (let k = 0; k < 8; k++) { const t = (k / 8) * 6.28 + ph * 0.8, r = 12 + ext * 3; body(0, Math.cos(t) * r, -26 + bob + Math.sin(t) * r * 0.8, 4, 4); }
      c.fillStyle = "#ffe08a"; body(0, 0, -26 + bob, 5); break;
    }
  }
  c.globalAlpha = 1;
}

/** Ảnh khung `s` (hàng 0, cột 0) của sheet thành data URL, cho cut-in (concept / hướng s của pháp tướng). Chưa có thì ''. */
const frameUrls = new Map<string, string>();
export function ptFrameUrl(scene: Phaser.Scene, id: string): string {
  const def = PHAP_TUONG[id]; if (!def) return "";
  const hit = frameUrls.get(def.sheet); if (hit) return hit;
  if (!ensurePtSheet(scene, id)) return "";
  const src = scene.textures.get(def.sheet).getSourceImage() as CanvasImageSource;
  const cv = document.createElement("canvas"); cv.width = cv.height = PT_FRAME;
  cv.getContext("2d")!.drawImage(src, 0, 0, PT_FRAME, PT_FRAME, 0, 0, PT_FRAME, PT_FRAME);
  const url = cv.toDataURL("image/png"); frameUrls.set(def.sheet, url); return url;
}

// ---------- hệ thống ----------

type Sprite = Phaser.GameObjects.Sprite;
interface Slot { id: string; def: PhapTuongDef; col: number; body: Sprite; glow: Sprite; acc: number; own: boolean }
interface Rig {
  slots: Slot[]; state: "in" | "hold" | "out"; t0: number; born: number; strike: number; burst: number;
  extra: { id: string; alpha: number } | null;
}
export interface PtView { x: number; y: number; depth: number; face: Dir8; alpha: number }
export interface PtPlayer { ava: number; dead: boolean; rings: number; vohonId: string }

const FORM_QUICK = PT_FORM.total * 0.75;
/** Chuyển động sinh vật bằng sheet có đủ khung đánh (80 khung) hay ảnh tĩnh 5 khung. */
const animated = (scene: Phaser.Scene, key: string) => scene.textures.get(key).frameTotal - 1 >= PT_DIRS.length * PT_COLS;

export class PhapTuongSystem {
  private rigs = new Map<string, Rig>();
  private free: Sprite[] = [];
  private all: Sprite[] = [];
  constructor(private scene: Phaser.Scene, private fxp: ParticleLayer) {}

  private take(): Sprite {
    const s = this.free.pop() ?? (() => { const n = this.scene.add.sprite(0, 0, "__DEFAULT"); this.all.push(n); return n; })();
    return s.setVisible(true).setActive(true);
  }
  private give(s: Sprite) { s.setVisible(false).setActive(false).clearTint().setCrop(); this.free.push(s); }
  /** Số sprite đang dùng + trong pool (kiểm thử "không tạo đối tượng mỗi khung"). */
  get pooled() { return this.all.length; }
  get active() { return this.rigs.size; }

  private makeSlot(id: string): Slot | null {
    const def = PHAP_TUONG[id], vh = VOHON.find((v) => v.id === id);
    if (!def || !vh || !ensurePtSheet(this.scene, id)) return null;
    // Có sheet lớp sáng riêng `pt_<mã>_glow` (cùng bố cục, màu đã nướng sẵn) thì lớp cộng sáng dùng nó, không tô màu; chưa có thì dùng lại sheet thân.
    const gk = `${def.sheet}_glow`, own = this.scene.textures.exists(gk);
    const mk = (add: boolean) => {
      const s = this.take().setTexture(add && own ? gk : def.sheet, 0).setOrigin(PT_ORIGIN[0] / PT_FRAME, PT_ORIGIN[1] / PT_FRAME);
      s.setBlendMode(add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL); return s;
    };
    return { id, def, col: hexN(def.glow ?? vh.col), body: mk(false), glow: mk(true), acc: 0, own };
  }
  private release(r: Rig) { for (const s of r.slots) { s.body.setBlendMode(0); this.give(s.body); this.give(s.glow); } r.slots = []; }
  private setSlots(r: Rig, ids: string[]) {
    const have = r.slots.map((s) => s.id).join("|");
    if (have === ids.join("|")) return;
    for (const s of r.slots) { this.give(s.body); this.give(s.glow); }
    r.slots = ids.map((i) => this.makeSlot(i)).filter((s): s is Slot => !!s);
  }

  /** Bắt đầu chuỗi biến hình (tin `avatar` bật); `full` false: vào thẳng giai đoạn cuối (người mới vào thấy đang Chân Thân). */
  begin(id: string, time: number, full = true) {
    const r = this.rigs.get(id);
    if (r) { r.state = "in"; r.t0 = full ? time : time - FORM_QUICK * 1000; return; }
    this.rigs.set(id, { slots: [], state: "in", t0: full ? time : time - FORM_QUICK * 1000, born: time, strike: -1e9, burst: -1e9, extra: null });
  }
  /** Ra đòn (đánh thường, hồn kỹ): chạy động tác đánh nếu không đang đánh dở. */
  strike(id: string, time: number) {
    const r = this.rigs.get(id); if (!r || r.state === "out") return;
    const total = (PT_STRIKE.windup + PT_STRIKE.hit + PT_STRIKE.stop + PT_STRIKE.recover) * 1000;
    if (time - r.strike < total * 0.7) return;
    r.strike = time;
  }
  /** Tuyệt kỹ: bùng hết cỡ ở bậc 10 trong PT_BURST_SEC. */
  burst(id: string, time: number) { const r = this.rigs.get(id); if (r) r.burst = time; }
  /** Pháp tướng thứ hai hòa với pháp tướng chính (dung hợp kỹ, H6); `null` bỏ. */
  setExtra(id: string, vohonId: string | null) {
    const r = this.rigs.get(id); if (!r) return;
    r.extra = vohonId ? { id: vohonId, alpha: PT_DUO.alpha } : null;
  }
  /** Đang trong bước nào của biến hình (giây từ lúc bắt đầu), -1 nếu không phải "in". Để vẽ cột sáng / vòng ở auraFx. */
  formAge(id: string, time: number): number { const r = this.rigs.get(id); return r?.state === "in" ? (time - r.t0) / 1000 : -1; }
  drop(id: string) { const r = this.rigs.get(id); if (r) { this.release(r); this.rigs.delete(id); } }
  clear() { for (const id of [...this.rigs.keys()]) this.drop(id); }

  /**
   * Mỗi khung với mỗi hồn sư còn trong cảnh. `mine`: chính mình (người khác nhẹ hơn, PT_OTHERS_K). `time`: ms của Phaser.
   * Hết Chân Thân / gục thì tan (bụi sáng) rồi trả sprite về pool.
   */
  sync(id: string, v: PtView, p: PtPlayer, mine: boolean, time: number, dt: number) {
    let r = this.rigs.get(id);
    const want = p.ava > 0 && !p.dead && !!PHAP_TUONG[p.vohonId];
    if (!r && want) { this.begin(id, time, false); r = this.rigs.get(id)!; }
    if (!r) return;
    if (want && r.state === "out") { r.state = "in"; r.t0 = time - FORM_QUICK * 1000; }
    if (!want && r.state !== "out") {
      r.state = "out"; r.t0 = time;
      if (this.fxp) for (const s of r.slots) this.fxp.dust(v.x + s.def.dx, v.y - 40 + s.def.dy, 50, 70, s.col, 14);
    }
    const age = (time - r.t0) / 1000;
    if (r.state === "out" && age > PT_FORM.fadeOut) { this.drop(id); return; }
    if (r.state === "in" && age >= PT_FORM.total) r.state = "hold";
    this.setSlots(r, [p.vohonId, ...(r.extra ? [r.extra.id] : [])]);

    const lv = fxLevel(), calm = fxPrefs.reduce, k = mine ? 1 : PT_OTHERS_K[lv];
    const stage = phapTuongStage(p.rings), tb = (time - r.burst) / 1000;
    const bur = tb >= 0 && tb < PT_BURST_SEC ? 1 - tb / PT_BURST_SEC : 0, top = PT_STAGES[PT_STAGES.length - 1];
    const lerpTop = (a: number, b: number) => a + (b - a) * bur;
    const stA = lerpTop(stage.alpha, top.alpha), stG = lerpTop(stage.glow, top.glow), stH = lerpTop(stage.hat, top.hat);
    // pha: độ hiện 0..1 (hiện từ dưới lên khi "in", tan khi "out")
    const rise = r.state === "in" ? clamp01((age - PT_FORM.rise0) / (PT_FORM.rise1 - PT_FORM.rise0)) : r.state === "out" ? 1 - clamp01(age / PT_FORM.fadeOut) : 1;
    const vis = calm || lv === "low" ? (r.state === "in" ? clamp01((age - PT_FORM.rise0) / 0.3) : rise) : rise;
    const roar = r.state === "in" && age >= PT_FORM.roar && !calm ? 1 : 0;
    if (roar && time - r.strike > 1500 && age - dt < PT_FORM.roar + 0.1 && age < PT_FORM.roar + 0.1) r.strike = time; // gầm / vung một lần

    const { row, flip, dir } = ptRow(v.face), back = ptIsBack(dir), dv = DIRV[v.face];
    const ts = (time - r.strike) / 1000, sf = ptStrikeFrame(ts), sc = ptStrikeCurve(ts);
    const stopT = ts >= PT_STRIKE.windup + PT_STRIKE.hit && ts < PT_STRIKE.windup + PT_STRIKE.hit + PT_STRIKE.stop;
    const sgn = flip ? -1 : 1;

    r.slots.forEach((s, i) => {
      const m = s.def.motion, tt = time / 1000;
      const duo = r.slots.length > 1, side = duo ? (i === 0 ? -1 : 1) : 0;
      const alpha = PT_GHOST * stA * k * (back ? 1 : PT_FRONT_ALPHA) * vis * v.alpha * (duo ? (i === 0 ? 1 : r.extra!.alpha) : 1);
      const phase = (tt / m.bobSec) % 1;
      let frame: number, f = 0;
      const anim = animated(this.scene, s.def.sheet);
      if (anim) {
        if (sf >= 0) frame = row * PT_COLS + PT_IDLE_N + Math.min(PT_ATTACK_N - 1, Math.floor(sf));
        else frame = row * PT_COLS + Math.floor(phase * PT_IDLE_N) % PT_IDLE_N;
      } else frame = row;
      s.body.setFrame(frame); s.glow.setFrame(frame);
      // chuyển động bằng code: lơ lửng, lắc trễ pha, xoay, vung / lao khi đánh (calm: bỏ hẳn, chỉ ảnh)
      const mv = calm ? 0 : 1;
      let rot = 0, ox = 0, oy = 0;
      if (mv) {
        oy += Math.sin(phase * Math.PI * 2) * m.bob;
        rot += Math.sin((phase - m.lag) * Math.PI * 2) * m.sway * (Math.PI / 180);
        if (m.spin) rot += ((tt * m.spin) % 360) * (Math.PI / 180);
        rot += sc * m.swing * sgn * (Math.PI / 180);
        const pull = sc < 0 ? sc * PT_STRIKE.back * 2 : sc * m.lunge;
        ox += dv[0] * pull; oy += dv[1] * pull * 0.5;
      }
      const sin = Math.sin(rot), cos = Math.cos(rot), pv = m.pivot;
      // quay quanh điểm cách gốc `pv` phía trên: gốc dịch (pv·sin, pv·(cos−1))
      ox += pv * sin; oy += pv * (cos - 1);
      // Không nhân SPR: sprite pháp tướng nằm ngoài container `root` (SPR) và lớp thân isometric 64 px cũng vẽ ở 1/SPR trong đó (fitHonsuLayer),
      // nên cả hai đều 1 pixel ảnh = 1 pixel màn hình nội bộ; dx / dy / bob / lunge / pivot cũng tính theo pixel nội bộ đó.
      const scl = s.def.scale * (1 + 0.06 * bur + 0.04 * (roar ? 1 : 0)) * (r.state === "in" && !calm ? 0.94 + 0.06 * rise : 1);
      const x = v.x + (s.def.dx + side * PT_DUO.dx) * sgn + ox, y = v.y + s.def.dy + oy;
      const depth = v.depth + (back ? -0.2 : 0.2) + i * 0.02;
      for (const sp of [s.body, s.glow]) {
        sp.setPosition(x, y).setRotation(rot).setScale(scl).setFlipX(flip).setDepth(sp === s.glow ? depth + 0.01 : depth);
        if (r.state === "in" && rise < 1 && !calm && lv !== "low") sp.setCrop(0, PT_FRAME * (1 - rise), PT_FRAME, PT_FRAME * rise); else if (sp.isCropped) sp.setCrop();
      }
      s.body.setAlpha(clamp01(alpha));
      const flashHit = stopT && flashOn();
      if (flashHit) s.body.setTintFill(0xffffff); else s.body.clearTint();
      const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
      s.glow.setVisible(mine || lv !== "low"); // H8: Thấp, pháp tướng người khác bỏ lớp cộng sáng (một lượt vẽ thay vì hai)
      (s.own ? s.glow.clearTint() : s.glow.setTint(s.col)).setAlpha(clamp01((0.25 + 0.3 * m.pulse * pulse * 2 + (flashHit ? 0.6 : 0) + sc * 0.2 + 0.4 * bur) * stG * k * vis * v.alpha * (lv === "low" ? 0.5 : 1)));
      // hạt theo hệ (pool dùng chung ở ParticleLayer; Thấp: trần 0 nên không phát)
      if (stH > 0 && k > 0 && !calm && lv !== "low" && vis > 0.5) {
        s.acc += dt * 14 * stH * k;
        while (s.acc >= 1) { s.acc -= 1; this.emit(s, x, y, s.def.hat, stH); }
      }
    });
  }

  private emit(s: Slot, x: number, y: number, hat: PtHat, stH: number) {
    const rx = (Math.random() - 0.5) * 56 * s.def.scale, ry = -10 - Math.random() * 70 * s.def.scale, c = s.col, px = x + rx, py = y + ry;
    switch (hat) {
      case "dien": this.fxp.emit(px, py, Math.random() < 0.5 ? 0xffffff : c, { vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90, life: 0.16, size: 2 }); break;
      case "lua": this.fxp.emit(px, py, Math.random() < 0.4 ? 0xffd060 : c, { vx: (Math.random() - 0.5) * 12, vy: -26 - Math.random() * 20, life: 0.6, size: 2, gravity: -10 }); break;
      case "bang": this.fxp.emit(px, py, Math.random() < 0.5 ? 0xffffff : c, { vx: (Math.random() - 0.5) * 10, vy: 8 + Math.random() * 10, life: 0.9, size: 2 }); break;
      case "la": this.fxp.emit(px, py, Math.random() < 0.3 ? 0xd8ffb0 : c, { vx: (Math.random() - 0.5) * 24, vy: -10 - Math.random() * 12, life: 0.9, size: 2 }); break;
      case "doc": this.fxp.emit(px, py, Math.random() < 0.5 ? 0xb8ff9a : c, { vx: (Math.random() - 0.5) * 8, vy: -8 - Math.random() * 10, life: 1, size: 2 }); break;
      case "khoi": this.fxp.emit(px, py, Math.random() < 0.5 ? 0xcfcfd8 : c, { vx: (Math.random() - 0.5) * 8, vy: -12 - Math.random() * 8, life: 1, size: 2 }); break;
      default: this.fxp.emit(px, py, Math.random() < 0.4 ? 0xffffff : c, { vx: (Math.random() - 0.5) * 10, vy: -14 - Math.random() * 14, life: 0.8, size: 2 }); break;
    }
    void stH;
  }

  /**
   * Cột sáng + vòng + hào quang dưới chân theo bậc (vẽ vào Graphics của drawStatus). `q` = SPR (pixel nội bộ → màn hình).
   * Người khác (`mine` false) nhẹ hơn: hệ số PT_OTHERS_K.
   */
  auraFx(g: Phaser.GameObjects.Graphics, id: string, x: number, y: number, rings: number, col: number, mine: boolean, time: number, q: number) {
    const r = this.rigs.get(id); if (!r) return;
    const lv = fxLevel(), calm = fxPrefs.reduce, k = mine ? 1 : PT_OTHERS_K[lv], st = phapTuongStage(rings), pu = 0.5 + 0.5 * Math.sin(time / 150);
    const age = (time - r.t0) / 1000;
    if (r.state === "in" && !calm) {
      // vòng 7 sáng → cột sáng
      const ring = clamp01(age / PT_FORM.column);
      if (ring < 1) g.lineStyle(3, 0xffffff, (1 - ring) * k).strokeEllipse(x, y, (20 + 40 * ring) * q, (6 + 12 * ring) * q);
      const col1 = clamp01((age - PT_FORM.column * 0.5) / 0.25), fade = 1 - clamp01((age - PT_FORM.rise1) / (PT_FORM.total - PT_FORM.rise1 + 0.2));
      if (col1 > 0 && fade > 0 && lv !== "low") {
        const h = 150 * col1 * q, w = (24 - 8 * (1 - fade)) * q;
        g.fillStyle(col, 0.16 * fade * k).fillRect(x - w / 2, y - h, w, h);
        g.fillStyle(0xffffff, 0.22 * fade * k).fillRect(x - w / 5, y - h, w * 0.4, h);
      }
    }
    const vis = r.state === "out" ? 1 - clamp01(age / PT_FORM.fadeOut) : 1;
    // vòng dưới chân: càng nhiều vòng hồn hoàn càng rõ (bậc 9+: vòng ngoài thứ hai)
    g.lineStyle(2, col, clamp01((0.25 + 0.3 * pu) * st.aura * k * vis)).strokeEllipse(x, y, (30 + 8 * st.aura + 3 * pu) * q, (9 + 2 * st.aura) * q);
    if (st.aura >= 1 && lv !== "low") g.lineStyle(1, 0xffffff, 0.35 * k * vis).strokeEllipse(x, y, (46 + 6 * st.aura) * q, (14 + 2 * st.aura) * q);
  }
}

/** Cut-in khi bật Chân Thân (chỉ mình thấy, ~0,5 s): chân dung pháp tướng lướt ngang màn hình kiểu anime. Tắt được; không hiện khi Giảm chuyển động / mức Thấp. */
export class PhapTuongCutIn {
  private el: HTMLDivElement | null = null;
  private timer = 0;
  static allowed() { return fxPrefs.cutin && !fxPrefs.reduce && fxLevel() !== "low"; }
  show(scene: Phaser.Scene, vohonId: string, col: string): boolean {
    this.clear();
    if (!PhapTuongCutIn.allowed()) return false;
    const url = ptFrameUrl(scene, vohonId); if (!url) return false;
    const el = document.createElement("div");
    el.className = "ptcut"; el.style.setProperty("--col", col); el.style.setProperty("--dur", `${PT_CUTIN_SEC}s`);
    el.setAttribute("aria-hidden", "true");
    const band = document.createElement("i"), img = document.createElement("img");
    band.className = "ptband"; img.className = "ptimg"; img.src = url; img.alt = "";
    el.append(band, img);
    document.body.appendChild(el); this.el = el;
    this.timer = window.setTimeout(() => this.clear(), PT_CUTIN_SEC * 1000 + 100);
    return true;
  }
  clear() { window.clearTimeout(this.timer); this.el?.remove(); this.el = null; }
  destroy() { this.clear(); }
}
