// Che tầm nhìn (#175, STATUS.ink; Phun Mực của tinh anh Ma Chương Vương): chính mình đang có trạng thái này thì màn hình phủ mực thủy
// mặc, chỉ chừa một vòng quanh hồn sư (PLAYER_INK). Chỉ là hiển thị: không đổi luật, người khác chỉ thấy biểu tượng trên đầu.
// Lớp mực nằm trong cảnh Phaser (trên hồn thú, chữ, thanh máu, vùng báo trước; dưới số sát thương) nên không che HUD HTML; không dùng
// Lighting / Weather nên vẫn hiện khi tắt ánh sáng (?light=0, Canvas) hay tắt hạt bay (/hat).
import Phaser from "phaser";
import { PLAYER_INK } from "../../shared/data.ts";

/** Độ sâu: trên thanh máu (99990), dưới số sát thương (99999). */
const DEPTH = 99996;
/** Màu mực (đen tím); mép vòng nhạt dần như mực loang trên giấy. */
const INK = [14, 10, 22], WASH = [52, 40, 72];
/** Phủ lên trong `inMs`, tan trong `outMs`; lúc trúng vòng hở mở dần từ `open0` lần cỡ thật trong `openMs` (vệt mực bắn vào mặt). */
const ANIM = { inMs: 160, outMs: 650, openMs: 700, open0: 0.12 };
/** Ảnh mực: rìa ngoài vòng (r + edge) còn `pad` pixel vệt / tua mực rồi mới đặc đều (khớp các khối phủ phần còn lại). */
const PAD = 52, KEY = "fx_ink";

/** Nhiễu theo góc, cố định (không Math.random): mép vòng lồi lõm và tua mực. */
const wave = (a: number, ks: readonly [number, number, number][]) => ks.reduce((s, [f, ph, w]) => s + Math.sin(a * f + ph) * w, 0);

function makeInkTexture(scene: Phaser.Scene) {
  const { r, edge, a } = PLAYER_INK, R = r + edge + PAD, S = Math.ceil(R) * 2, c = S / 2;
  if (scene.textures.exists(KEY)) return S;
  const t = scene.textures.createCanvas(KEY, S, S)!, ctx = t.getContext(), img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    // Mép vòng lồi lõm; vài tua mực (vệt) thò vào trong vòng.
    const rim = r + wave(ang, [[3, 0.7, 4], [5, 2.1, 3], [11, 4.2, 1.5]]);
    const tendril = Math.max(0, wave(ang, [[7, 1.3, 1], [13, 0.4, 0.6]]) - 0.9) * 26;
    const k = Math.min(1, Math.max(0, (d - rim + tendril) / edge)), ease = k * k * (3 - 2 * k);
    // Ngoài vòng: vệt quét đậm nhạt (nét bút) rồi đặc đều ở rìa ảnh.
    const outer = Math.min(1, Math.max(0, (d - (r + edge)) / PAD));
    const stroke = (1 - outer) * Math.max(0, wave(ang * 2 + d / 9, [[3, 0.2, 1]])) * 0.35;
    const wash = (1 - ease) * 0.8 + stroke;
    const i = (y * S + x) * 4;
    for (let j = 0; j < 3; j++) img.data[i + j] = Math.round(INK[j] + (WASH[j] - INK[j]) * Math.min(1, wash));
    img.data[i + 3] = Math.round(255 * a * ease);
  }
  ctx.putImageData(img, 0, 0);
  // Giọt mực bắn vào trong vòng (vị trí cố định theo góc).
  ctx.fillStyle = `rgba(${INK.join(",")},${a * 0.85})`;
  for (let n = 0; n < 9; n++) {
    const ang = n * 2.399 + 0.6, d = r * (0.62 + 0.3 * ((n * 7) % 5) / 4), s = 1.2 + ((n * 3) % 4) * 0.7;
    ctx.beginPath(); ctx.arc(c + Math.cos(ang) * d, c + Math.sin(ang) * d, s, 0, Math.PI * 2); ctx.fill();
  }
  t.refresh();
  return S;
}

export class InkVeil {
  /** Ảnh mực và các khối phủ: tạo lần đầu bị Che tầm nhìn (đa số cảnh không bao giờ cần, khỏi tốn vẽ ảnh lúc vào bản đồ). */
  private img: Phaser.GameObjects.Image | null = null;
  private rest: Phaser.GameObjects.Graphics | null = null;
  private size = 0;
  /** Độ phủ hiện tại 0..1; `openT`: ms kể từ lúc trúng (vòng hở mở dần); `on` / `at` của khung này cho `layout`. */
  private k = 0;
  private openT = Infinity;
  private on = false;
  private at: { x: number; y: number } | null = null;

  constructor(private scene: Phaser.Scene) {
    // Camera theo chính mình cập nhật scroll trong preRender, sau update() của cảnh: đặt lại vị trí ngay sau đó để vòng hở không trễ
    // một khung so với nhân vật khi đi.
    const cam = scene.cameras.main, Ev = Phaser.Cameras.Scene2D.Events, fn = () => this.layout(cam);
    cam.on(Ev.FOLLOW_UPDATE, fn);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => cam.off(Ev.FOLLOW_UPDATE, fn));
  }

  /**
   * Mỗi khung: `on` = chính mình đang Che tầm nhìn; `at` = tâm vòng (tọa độ cảnh của thân hồn sư), null khi chưa có hình. Bị lại khi
   * màn mực đang tan thì vòng hở mở lại từ đầu như lúc mới trúng.
   */
  update(on: boolean, at: { x: number; y: number } | null, delta: number, cam: Phaser.Cameras.Scene2D.Camera) {
    if (on && !this.on) this.openT = 0;
    this.on = on; this.at = at;
    this.k = Phaser.Math.Clamp(this.k + (on ? delta / ANIM.inMs : -delta / ANIM.outMs), 0, 1);
    if (this.k > 0 && !this.img) {
      this.size = makeInkTexture(this.scene);
      this.img = this.scene.add.image(0, 0, KEY).setScrollFactor(0).setDepth(DEPTH);
      this.rest = this.scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    }
    if (this.k > 0) this.openT += delta;
    this.layout(cam);
  }

  /** Lớp scrollFactor 0 vẽ quanh tâm camera rồi phóng: điểm cảnh P ở `P - scroll`, khung nhìn rộng `w / zoom` quanh `w / 2`. */
  private layout(cam: Phaser.Cameras.Scene2D.Camera) {
    if (!this.img || !this.rest) return;
    const at = this.at, show = this.k > 0 && !!at;
    this.img.setVisible(show); this.rest.setVisible(show);
    if (!show) return;
    const o = Math.min(1, this.openT / ANIM.openMs), open = ANIM.open0 + (1 - ANIM.open0) * (1 - (1 - o) ** 3);
    // Cỡ ảnh làm tròn thành số nguyên chẵn (tâm nguyên): mép ảnh trùng khít mép các khối phủ, không có đường nối đậm hơn.
    const half = Math.max(1, Math.round((this.size * open) / 2)), sc = (half * 2) / this.size;
    const cx = Math.round(at!.x - cam.scrollX), cy = Math.round(at!.y - cam.scrollY);
    this.img.setPosition(cx, cy).setScale(sc).setAlpha(this.k);
    // Phần khung nhìn ngoài ảnh: bốn khối mực đặc cùng màu, cùng độ đậm với rìa ảnh.
    const sw = this.scene.scale.width, sh = this.scene.scale.height, z = cam.zoom, m = 24;
    const x0 = sw / 2 - sw / (2 * z) - m, x1 = sw / 2 + sw / (2 * z) + m, y0 = sh / 2 - sh / (2 * z) - m, y1 = sh / 2 + sh / (2 * z) + m;
    const l = cx - half, r = cx + half, t = cy - half, b = cy + half;
    const g = this.rest.clear().fillStyle(Phaser.Display.Color.GetColor(INK[0], INK[1], INK[2]), PLAYER_INK.a * this.k);
    if (t > y0) g.fillRect(x0, y0, x1 - x0, t - y0);
    if (b < y1) g.fillRect(x0, b, x1 - x0, y1 - b);
    if (l > x0) g.fillRect(x0, Math.max(t, y0), l - x0, Math.min(b, y1) - Math.max(t, y0));
    if (r < x1) g.fillRect(r, Math.max(t, y0), x1 - r, Math.min(b, y1) - Math.max(t, y0));
  }
}
