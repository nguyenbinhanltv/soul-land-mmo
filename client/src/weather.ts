// Thời tiết và hạt bay theo vùng (bước 10.7, GAME_DESIGN.md mục 5.11 bảng các vùng và quy tắc "Hạt bay, thời tiết"):
// hạt vẽ trong thế giới (theo camera) dưới chữ và thanh máu, độ mờ tối đa 50%, cả màn hình không quá MAX_PARTICLES hạt; đánh thú vương
// / boss thế giới thì giảm một nửa; điện thoại giảm thêm; lệnh chat `/hat` bật / tắt (lưu trên máy). Sương, mưa, sét, cực quang theo
// vùng (tên vùng `zone` trong file Tiled) hoặc theo giờ. Chạy cả khi chỉ có Canvas (ánh chớp sét khi đó chỉ là lớp phủ sáng).
import Phaser from "phaser";
import { storage } from "./net.ts";
import { VIEW_W, VIEW_H, screenToWorld } from "./iso.ts";
import { vnHour, type Lighting } from "./lighting.ts";
import type { IsoMap } from "./isoMap.ts";

/** Hạt bay trên màn hình tối đa (mục 5.11), độ mờ tối đa. */
const MAX_PARTICLES = 150, MAX_ALPHA = 0.5;
/** Độ sâu: trên hồn sư / hồn thú, dưới hiệu ứng chiêu (99980), chữ (99984) và thanh máu (99990). */
const DEPTH = 99970, OVERLAY_DEPTH = 99968;
/** Ngưỡng `storage` của lệnh `/hat`. */
const OFF_KEY = "shh-hat";

/**
 * Một loại hạt: ảnh (FX_TEX), các màu, số hạt mỗi giây trên khung VIEW_W × VIEW_H, tuổi (ms), vận tốc (pixel nội bộ / giây), trọng lực,
 * độ mờ đỉnh, cộng sáng (`add`, hạt phát sáng), lập lòe; `when`: chỉ ban đêm / ban ngày / buổi sớm (hệ số theo mức đêm);
 * `at`: chỗ sinh (`view` khắp màn hình, `water` trên mặt nước, `house` trên mái nhà / lửa trại); `zone`: chỉ khi đứng trong vùng đó;
 * `north`: dày dần về phía bắc bản đồ (y thế giới nhỏ).
 */
interface Kind {
  tex: keyof typeof FX_TEX; tint: string[]; rate: number; life: [number, number]; vx: [number, number]; vy: [number, number]; gy?: number;
  alpha: number; add?: boolean; flicker?: boolean; when?: "night" | "day" | "dawn"; at?: "view" | "water" | "house"; zone?: string; north?: boolean;
  scale?: [number, number];
}
/** Lớp phủ toàn màn hình: sương (màu, độ mờ, vùng / giờ), mưa, sét, cực quang. */
interface Sky { fog?: { col: string; a: number; zone?: string; when?: "dawn" }[]; bolt?: string; aurora?: boolean }
interface Climate { fx: Kind[]; sky?: Sky }

const LEAF = ["#e8b04a", "#d8602a", "#a0301e", "#f0904a"];
/** Bảng các vùng (mục 5.11): thời tiết và hạt bay. Màu lấy từ art/palettes/<mapId>.gpl. */
const CLIMATE: Record<string, Climate> = {
  thanh_hon_thon: { fx: [
    { tex: "smoke", tint: ["#c8c0b4"], rate: 3, life: [2600, 3800], vx: [2, 8], vy: [-14, -8], alpha: 0.35, at: "house", scale: [0.6, 1.4] },  // khói bếp
    { tex: "fluff", tint: ["#f4f0e8", "#ffffff"], rate: 2.5, life: [4000, 6000], vx: [6, 14], vy: [-4, 3], alpha: 0.45, when: "day" },     // bồ công anh
  ] },
  nac_dinh_thanh: { fx: [
    { tex: "smoke", tint: ["#b8b0a8"], rate: 2, life: [2600, 3600], vx: [2, 8], vy: [-14, -8], alpha: 0.3, at: "house", scale: [0.6, 1.3] },
    { tex: "leaf", tint: ["#b0654a", "#d8a24a"], rate: 0.8, life: [4000, 6000], vx: [-6, 6], vy: [8, 14], alpha: 0.45 },
  ] },
  tinh_dau_ngoai_vi: {
    fx: [
      { tex: "glow", tint: ["#c8f07a"], rate: 2, life: [2500, 4500], vx: [-6, 6], vy: [-6, 6], alpha: 0.5, add: true, flicker: true, when: "night" }, // đom đóm thưa
      { tex: "leaf", tint: ["#4a7a50", "#2f5a40", "#d8d08a"], rate: 1.5, life: [4000, 6500], vx: [-6, 6], vy: [8, 14], alpha: 0.45 },
    ],
    sky: { fog: [{ col: "#d8e4dc", a: 0.16, when: "dawn" }] }, // sương mỏng buổi sớm
  },
  tinh_dau_noi_dia: {
    fx: [
      { tex: "glow", tint: ["#d0ff8a"], rate: 3, life: [2500, 4500], vx: [-6, 6], vy: [-6, 6], alpha: 0.5, add: true, flicker: true },            // đom đóm
      { tex: "dot", tint: ["#5ae0d0", "#b0fff0"], rate: 4, life: [3000, 5000], vx: [-3, 3], vy: [-8, -3], alpha: 0.45, add: true },             // bào tử phát quang
    ],
    sky: { fog: [{ col: "#6a4a9a", a: 0.2, zone: "Đầm sương độc" }], bolt: "Lôi Cốc" },
  },
  thien_dau_thanh: { fx: [
    { tex: "petal", tint: ["#f4c8d8", "#ffe0e8", "#ffffff"], rate: 2, life: [4000, 6000], vx: [6, 14], vy: [6, 12], alpha: 0.45 },             // cánh hoa
  ] },
  lac_nhat_sam_lam: { fx: [
    { tex: "leaf", tint: LEAF, rate: 8, life: [4000, 6500], vx: [6, 16], vy: [8, 16], alpha: 0.5 },                                              // lá rụng đỏ / cam / vàng
    { tex: "petal", tint: ["#3ac07a", "#b04a8a"], rate: 1, life: [3500, 5000], vx: [4, 12], vy: [4, 10], alpha: 0.4 },                           // cánh hoa độc
  ] },
  cuc_bac_chi_dia: {
    fx: [{ tex: "flake", tint: ["#e8f4ff", "#ffffff"], rate: 12, life: [3500, 5500], vx: [-4, 10], vy: [14, 26], alpha: 0.5, north: true }],      // tuyết, dày dần về bắc
    sky: { aurora: true, fog: [{ col: "#e8f4ff", a: 0.12, zone: "Cực Bắc Băng Uyên" }] },                                                        // bão tuyết phía bắc
  },
  hai_than_dao: {
    fx: [
      { tex: "dot", tint: ["#e8fff8"], rate: 6, life: [900, 1600], vx: [-3, 3], vy: [-2, 1], alpha: 0.5, at: "water" },                           // bọt sóng
      { tex: "glow", tint: ["#4ac8c8", "#8af0e8"], rate: 3, life: [2000, 3500], vx: [-4, 4], vy: [-5, 2], alpha: 0.5, add: true, flicker: true, when: "night", at: "water" }, // đom đóm biển
      { tex: "streak", tint: ["#c8dce8"], rate: 30, life: [500, 700], vx: [-40, -30], vy: [160, 200], alpha: 0.4, zone: "Ma Quỷ Hải Vực" },      // mưa
    ],
    sky: { fog: [{ col: "#3a4a5a", a: 0.18, zone: "Ma Quỷ Hải Vực" }] },
  },
  loi_tinh_dau: {
    fx: [{ tex: "glow", tint: ["#c0e0ff", "#6ab0f0"], rate: 5, life: [3000, 5000], vx: [-3, 3], vy: [-14, -6], alpha: 0.5, add: true }],          // hạt hồn lực trôi lên
    sky: { fog: [{ col: "#6a6a9a", a: 0.12 }] },                                                                                                 // sương mù
  },
  dai_dau_hon_truong: { fx: [
    { tex: "dot", tint: ["#c8b08a", "#e0d0b0"], rate: 3, life: [2000, 3500], vx: [6, 16], vy: [-3, 3], alpha: 0.35 },                          // bụi cát
  ] },
};

/** Ảnh hạt vẽ bằng code (pixel nội bộ, trắng để tô màu): chấm, đốm sáng mềm, lá, cánh hoa, bông tuyết, khói, vệt mưa, giấy hoa. */
const FX_TEX = {
  dot: [2, 2], glow: [5, 5], leaf: [4, 3], petal: [3, 2], flake: [3, 3], fluff: [3, 3], smoke: [8, 8], streak: [1, 5], confetti: [2, 3],
} as const;

function makeFxTextures(scene: Phaser.Scene) {
  const px = (key: string, w: number, h: number, f: (x: number, y: number) => number) => {
    if (scene.textures.exists(`fx_${key}`)) return;
    const t = scene.textures.createCanvas(`fx_${key}`, w, h)!, ctx = t.getContext();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = f(x, y); if (a > 0) { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(x, y, 1, 1); } }
    t.refresh();
  };
  px("dot", 2, 2, () => 1);
  px("glow", 5, 5, (x, y) => { const d = Math.hypot(x - 2, y - 2); return d < 0.5 ? 1 : d < 1.5 ? 0.7 : d < 2.3 ? 0.25 : 0; });
  px("leaf", 4, 3, (x, y) => ((x === 0 && y === 2) || (x === 3 && y === 0) ? 0 : x + y === 3 ? 0.7 : 1));
  px("petal", 3, 2, (x, y) => (x === 2 && y === 0 ? 0 : x === 1 ? 1 : 0.7));
  px("flake", 3, 3, (x, y) => (x === 1 || y === 1 ? 1 : 0));
  px("fluff", 3, 3, (x, y) => (x === 1 && y === 1 ? 1 : x === 1 || y === 1 ? 0.5 : 0));
  px("smoke", 8, 8, (x, y) => Math.max(0, 1 - Math.hypot(x - 3.5, y - 3.5) / 4) * 0.8);
  px("streak", 1, 5, () => 1);
  px("confetti", 2, 3, () => 1);
  if (!scene.textures.exists("fx_aurora")) {
    // Cực quang: các dải rèm lục / tím, sáng ở mép trên, mờ dần xuống dưới.
    const t = scene.textures.createCanvas("fx_aurora", 256, 64)!, ctx = t.getContext();
    for (let x = 0; x < 256; x++) {
      const k = 0.5 + 0.5 * Math.sin(x / 13) * Math.sin(x / 31 + 1), top = 6 + 10 * Math.sin(x / 23);
      const g = ctx.createLinearGradient(0, top, 0, 64);
      g.addColorStop(0, `rgba(74,240,160,${0.9 * k})`); g.addColorStop(0.45, `rgba(160,122,240,${0.5 * k})`); g.addColorStop(1, "rgba(160,122,240,0)");
      ctx.fillStyle = g; ctx.fillRect(x, top, 1, 64 - top);
    }
    t.refresh();
  }
}

interface Live { kind: Kind; em: Phaser.GameObjects.Particles.ParticleEmitter; base: number }

export class Weather {
  private live: Live[] = [];
  private on: boolean;
  private fog: Phaser.GameObjects.Rectangle | null = null;
  private flashRect: Phaser.GameObjects.Rectangle | null = null;
  private aurora: Phaser.GameObjects.Image[] = [];
  private climate: Climate;
  private nextBolt = 0;
  /** Khung camera (thế giới) và vị trí mình lần cập nhật gần nhất: chỗ sinh hạt. */
  private view = new Phaser.Geom.Rectangle();


  constructor(private scene: Phaser.Scene, mapId: string, private map: IsoMap, private light: Lighting, private mapH: number) {
    this.climate = CLIMATE[mapId] ?? { fx: [] };
    this.on = storage.get(OFF_KEY) !== "0";
    makeFxTextures(scene);
    const cap = MAX_PARTICLES / Math.max(1, this.climate.fx.length);
    for (const kind of this.climate.fx) {
      const life = (kind.life[0] + kind.life[1]) / 2, base = 1000 / kind.rate;
      const em = scene.add.particles(0, 0, `fx_${kind.tex}`, {
        lifespan: { min: kind.life[0], max: kind.life[1] },
        speedX: { min: kind.vx[0], max: kind.vx[1] }, speedY: { min: kind.vy[0], max: kind.vy[1] }, gravityY: kind.gy ?? 0,
        scale: kind.scale ? { start: kind.scale[0], end: kind.scale[1] } : 1,
        tint: kind.tint.map((c) => parseInt(c.slice(1), 16)),
        alpha: { onEmit: () => 0, onUpdate: (p: Phaser.GameObjects.Particles.Particle, _k: string, t: number) =>
          Math.min(MAX_ALPHA, kind.alpha) * Math.sin(Math.PI * t) * (kind.flicker ? 0.55 + 0.45 * Math.sin(p.lifeCurrent / 160 + p.x) : 1) },
        blendMode: kind.add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
        frequency: base, quantity: 1,
        maxAliveParticles: Math.min(cap, Math.ceil((kind.rate * life) / 1000) + 4),
        emitZone: { type: "random", source: { getRandomPoint: (p: Phaser.Types.Math.Vector2Like) => this.spawn(kind, p) } } as Phaser.Types.GameObjects.Particles.EmitZoneData,
      }).setDepth(DEPTH);
      this.live.push({ kind, em, base });
    }
    if (this.climate.sky?.fog) this.fog = scene.add.rectangle(0, 0, 8, 8, 0xffffff, 0).setScrollFactor(0).setDepth(OVERLAY_DEPTH);
    if (this.climate.sky?.bolt) this.flashRect = scene.add.rectangle(0, 0, 8, 8, 0xe0f0ff, 0).setScrollFactor(0).setDepth(OVERLAY_DEPTH + 1);
    if (this.climate.sky?.aurora) for (let k = 0; k < 3; k++)
      this.aurora.push(scene.add.image(0, 0, "fx_aurora").setScrollFactor(0).setOrigin(0.5, 0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(OVERLAY_DEPTH));
    this.apply();
  }

  /** Bật / tắt hạt bay và thời tiết (lệnh `/hat`); trả trạng thái mới. */
  toggle() { this.on = !this.on; storage.set(OFF_KEY, this.on ? "1" : "0"); this.apply(); return this.on; }
  private apply() {
    for (const l of this.live) { if (!this.on) l.em.killAll(); l.em.emitting = this.on; l.em.setVisible(this.on); }
    for (const o of [this.fog, this.flashRect, ...this.aurora]) o?.setVisible(this.on);
  }

  /** Chỗ sinh một hạt của loại `kind` (tọa độ màn hình thế giới); không có chỗ hợp lệ thì đặt ngoài xa (hạt bỏ phí, không thấy). */
  private spawn(kind: Kind, p: Phaser.Types.Math.Vector2Like) {
    const v = this.view, far = () => { p.x = -1e6; p.y = -1e6; return p; };
    if (kind.at === "house") {
      const hs = this.map.chimneys().filter((h) => v.contains(h.x, h.y));
      if (!hs.length) return far();
      const h = hs[Math.floor(Math.random() * hs.length)]; p.x = h.x + (Math.random() - 0.5) * 4; p.y = h.y; return p;
    }
    for (let n = 0; n < (kind.at === "water" ? 8 : 1); n++) {
      // Hạt rơi (vận tốc dọc dương) sinh ở nửa trên khung để còn rơi qua màn hình.
      const x = v.x + Math.random() * v.width, y = v.y - 20 + Math.random() * (kind.vy[0] > 6 ? v.height * 0.7 : v.height + 20);
      if (kind.at === "water" && !this.map.isWater(x, y)) continue;
      if (kind.north && this.mapH > 0 && Math.random() > 0.35 + 0.65 * (1 - screenToWorld(x, y).y / this.mapH)) continue;
      p.x = x; p.y = y; return p;
    }
    return far();
  }

  /** Giấy hoa khi có người thắng ở Đại Đấu Hồn Trường. */
  confetti() {
    if (!this.on) return;
    const v = this.view, em = this.scene.add.particles(0, 0, "fx_confetti", {
      lifespan: 2200, speedX: { min: -60, max: 60 }, speedY: { min: -90, max: -30 }, gravityY: 70, rotate: { min: 0, max: 360 },
      tint: [0xd04a30, 0xf2c84b, 0x5ac0c8, 0xffffff, 0xa253e0], alpha: { start: 0.9, end: 0 }, emitting: false,
    }).setDepth(DEPTH);
    em.explode(80, v.centerX, v.centerY - v.height * 0.2);
    this.scene.time.delayedCall(2600, () => em.destroy());
  }

  /**
   * Mỗi khung: khung camera, tên vùng đang đứng (`zone`), đang đánh thú vương / boss thế giới (`boss`, hạt giảm
   * một nửa). Đặt tần suất sinh từng loại hạt theo giờ / vùng, lớp sương, ánh chớp, cực quang.
   */
  update(time: number, cam: Phaser.Cameras.Scene2D.Camera, zone: string, boss: boolean) {
    const wv = cam.worldView; this.view.setTo(wv.x, wv.y, wv.width, wv.height);
    if (!this.on) return;
    const night = this.light.nightness(), h = vnHour(), dawn = h >= 5 && h < 8.5 ? 1 - Math.abs(h - 6.5) / 2 : 0;
    const k = (boss ? 0.5 : 1) * (document.body.classList.contains("touch") ? 0.6 : 1) * Math.max(0.3, (wv.width * wv.height) / (VIEW_W * VIEW_H));
    for (const l of this.live) {
      const w = l.kind.when === "night" ? night : l.kind.when === "day" ? 1 - night : l.kind.when === "dawn" ? dawn : 1;
      const z = !l.kind.zone || l.kind.zone === zone, f = w * k * (z ? 1 : 0);
      l.em.emitting = f > 0.05;
      if (f > 0.05) l.em.frequency = l.base / f;
    }
    // Lớp phủ toàn màn hình theo khung nhìn (như lớp vignette cũ: đặt giữa màn hình, chia hệ số phóng).
    const sw = this.scene.scale.width, sh = this.scene.scale.height, z = cam.zoom;
    const cover = (o: Phaser.GameObjects.Rectangle) => o.setPosition(sw / 2, sh / 2).setSize(sw / z + 40, sh / z + 40).setOrigin(0.5);
    if (this.fog) {
      const f = this.climate.sky!.fog!.find((x) => (!x.zone || x.zone === zone) && (x.when !== "dawn" || dawn > 0));
      const a = f ? f.a * (f.when === "dawn" ? dawn : 1) * (0.85 + 0.15 * Math.sin(time / 2300)) : 0;
      cover(this.fog); if (f) this.fog.setFillStyle(parseInt(f.col.slice(1), 16), a); else this.fog.setFillStyle(0xffffff, 0);
    }
    if (this.flashRect) {
      cover(this.flashRect);
      // Sét ở Lôi Cốc: chớp đôi mỗi 5–13 giây (lớp phủ sáng + màu môi trường bừng lên).
      if (zone === this.climate.sky!.bolt && time > this.nextBolt) {
        this.nextBolt = time + 5000 + Math.random() * 8000;
        this.light.bolt(260);
        this.scene.tweens.add({ targets: this.flashRect, fillAlpha: { from: 0.28, to: 0 }, duration: 140, yoyo: false, repeat: 1, repeatDelay: 70 });
      }
    }
    if (this.aurora.length) {
      const a = Math.min(0.45, night * 0.5);
      this.aurora.forEach((im, n) => {
        const W = sw / z + 40;
        im.setPosition(sw / 2 + (n - 1) * W * 0.34 + Math.sin(time / 7000 + n * 2) * 30, sh / 2 - sh / (2 * z) - 6)
          .setDisplaySize(W * 0.45, (sh / z) * 0.32).setAlpha(a * (0.6 + 0.4 * Math.sin(time / 2600 + n * 1.7)));
      });
    }
  }
}
