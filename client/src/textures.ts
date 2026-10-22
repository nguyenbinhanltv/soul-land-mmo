// Sprite pixel vẽ bằng code. Ảnh thật được tải trước theo shared/assets/sprites/manifest.json (sprites.ts);
// key nào đã có ảnh thì ở đây bỏ qua. Hồn sư ghép lớp theo mục 5.11: hình vẽ nằm trong honsuArt.ts.
import Phaser from "phaser";
import { TIERS, VOHON, HAIR_STYLES, HAIR_COLORS, OUTFIT_COLORS, SKIN_TONES, type Looks } from "../../shared/data.ts";
import { addGridFrames, recolor, createHonsuAnims, honsuKey, HS_FRAME, VH_FRAME } from "./sprites.ts";
import { honsuSheet, vohonSheets, bufCanvas, type Buf, type Sex } from "./honsuArt.ts";
import { boneTextures } from "./boneIcons.ts";
import { coreTextures } from "./coreIcons.ts";

const hex = (c: string) => parseInt(c.slice(1), 16);

/** Tô một hình chữ nhật, tọa độ tính từ gốc (chân). */
type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

function draw(scene: Phaser.Scene, key: string, w: number, h: number, ox: number, oy: number, fn: (R: Rect) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  fn((x, y, ww, hh, c) => { g.fillStyle(hex(c), 1); g.fillRect(ox + x, oy + y, ww, hh); });
  g.generateTexture(key, w, h); g.destroy();
}

/** Hồn thú: 48x32, gốc tại chân (24,28). */
export const BEAST_ORIGIN = { x: 0.5, y: 28 / 32 };

const SEX_KEYS = ["m", "f"] as const;
export const sexKey = (sex: number): Sex => (sex === 1 ? "f" : "m");

/** Thêm bộ đệm pixel làm texture có khung đánh số theo lưới, như spritesheet tải từ ảnh. Key đã có (ảnh thật) thì bỏ qua. */
function addSheet(scene: Phaser.Scene, key: string, make: () => Buf, frame: number) {
  if (scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, bufCanvas(make()));
  addGridFrames(scene, key, frame, frame);
}

/** Phụ thể võ hồn đang ra trận (`vh_{id}_b`, `vh_{id}_f`), chỉ vẽ khi có người dùng võ hồn đó. */
export function vohonTextures(scene: Phaser.Scene, vh: number): [string, string] {
  const v = VOHON[vh] ?? VOHON[0], kb = `vh_${v.id}_b`, kf = `vh_${v.id}_f`;
  if (!scene.textures.exists(kb) || !scene.textures.exists(kf)) {
    const sh = vohonSheets(v);
    addSheet(scene, kb, () => sh.b, VH_FRAME);
    addSheet(scene, kf, () => sh.f, VH_FRAME);
  }
  return [kb, kf];
}

/** Kiểu tóc hợp lệ (0–3) của ngoại hình; ngoài khoảng thì về kiểu 0. */
const hairOf = (L: Pick<Looks, "sex" | "hair">) => (L.hair >= 0 && L.hair < HAIR_STYLES[L.sex === 1 ? 1 : 0].length ? L.hair : 0);

/** Tông da hợp lệ của ngoại hình; ngoài khoảng thì về tông 0. */
const skinOf = (L: Pick<Looks, "skin">) => (L.skin > 0 && L.skin < SKIN_TONES.length ? L.skin : 0);

/** Sheet thân (có animation) của bộ giới × kiểu tóc, ví dụ `hs_body_f_2`; tông da khác 0 là bản hoán màu `hs_body_f_2@2` (9.9). */
export const bodyKey = (L: Pick<Looks, "sex" | "hair" | "skin">) => {
  const base = honsuKey("body", sexKey(L.sex), hairOf(L)), skin = skinOf(L);
  return skin ? `${base}@${skin}` : base;
};

/**
 * Key texture thân, áo, tóc theo ngoại hình: cả 3 lớp cùng bộ giới × kiểu tóc (mục 5.11).
 * Áo và tóc hoán màu (key `hs_hair_f_2@3`, `hs_outfit_f_2@5`), thân hoán 3 sắc da theo tông da (`hs_body_f_2@2`, kèm animation
 * riêng của sheet đó); chỉ tạo khi có người dùng tổ hợp đó.
 */
export function looksTextures(scene: Phaser.Scene, L: Looks) {
  const s = sexKey(L.sex), h = hairOf(L), skin = skinOf(L);
  if (skin) createHonsuAnims(scene, recolor(scene, honsuKey("body", s, h), skin, SKIN_TONES[skin].ramp, SKIN_TONES[0].ramp));
  return {
    body: bodyKey(L),
    outfit: recolor(scene, honsuKey("outfit", s, h), L.outfitCol, (OUTFIT_COLORS[L.outfitCol] ?? OUTFIT_COLORS[0]).ramp),
    hair: recolor(scene, honsuKey("hair", s, h), L.hairCol, (HAIR_COLORS[L.hairCol] ?? HAIR_COLORS[0]).ramp),
  };
}

/**
 * Vòng hồn hoàn (mục 5.11 "Vòng hồn hoàn", 10.7), vẽ ở pixel nội bộ (lớp hồn sư phóng 1 / SPR trong khung chứa): khung 0 cung trên
 * (sau thân), khung 1 cung dưới (trước thân), gốc ở tâm elip.
 * - `size` 0–9: vòng thứ size + 1 lúc bình thường, nằm trên mặt đất đồng tâm dưới chân (elip 2:1, bán trục ngang
 *   RING_RX0 + RING_STEP · size): nét 1 pixel màu `col`, phía trong 1 pixel `glow` mờ (vòng đen vẫn nổi trên nền tối nhờ nét tím).
 * - `"up"`: vòng nổi quanh thân (Chân Thân, vòng đang tung hồn kỹ), elip dẹt 34×10, thân 2 pixel `col` viền 1 pixel `glow`.
 * - `lit`: sáng hơn một bậc (col → glow, glow → trắng).
 */
export const RING_RX0 = 15, RING_STEP = 3;
export function soulRingKey(scene: Phaser.Scene, tier: number, size: number | "up", lit = false) {
  const key = `sring${tier}_${size}${lit ? "L" : ""}`;
  if (scene.textures.exists(key)) return key;
  const t = TIERS[tier] ?? TIERS[0], col = lit ? t.glow : t.col, glow = lit ? "#ffffff" : t.glow, up = size === "up";
  const rx = up ? 17 : RING_RX0 + RING_STEP * size, ry = up ? 5 : rx / 2;
  const fw = 2 * Math.ceil(rx) + 2, fh = 2 * Math.ceil(ry) + 2;
  const tex = scene.textures.createCanvas(key, fw * 2, fh)!, ctx = tex.getContext();
  const inE = (px: number, py: number, a: number, b: number) => (px / a) ** 2 + (py / b) ** 2 <= 1;
  for (let y = -fh / 2; y < fh / 2; y++) for (let x = -fw / 2; x < fw / 2; x++) {
    const px = x + 0.5, py = y + 0.5;
    if (!inE(px, py, rx, ry)) continue;
    let c: string, a = 1;
    if (up) {
      if (inE(px, py, rx - 3, ry - 2)) continue;
      c = inE(px, py, rx - 1, ry - 0.8) ? col : glow;
    } else if (!inE(px, py, rx - 1, ry - 1)) c = col;
    else if (!inE(px, py, rx - 2, ry - 2)) { c = glow; a = 0.5; }
    else continue;
    ctx.globalAlpha = a; ctx.fillStyle = c;
    ctx.fillRect((py < 0 ? 0 : fw) + fw / 2 + x, fh / 2 + y, 1, 1);
  }
  tex.refresh();
  addGridFrames(scene, key, fw, fh);
  return key;
}

export function makeTextures(scene: Phaser.Scene) {
  // Hồn sư: mỗi bộ giới × kiểu tóc còn thiếu ảnh thật thì vẽ bằng code (thân, áo dải xám, tóc dải xám);
  // bản hoán màu tạo sau trong looksTextures(). Bản code dùng chung thân và áo cho mọi kiểu tóc.
  SEX_KEYS.forEach((s, sex) => HAIR_STYLES[sex].forEach((_, h) => {
    addSheet(scene, honsuKey("body", s, h), () => honsuSheet(s, "body"), HS_FRAME);
    addSheet(scene, honsuKey("outfit", s, h), () => honsuSheet(s, "outfit"), HS_FRAME);
    addSheet(scene, honsuKey("hair", s, h), () => honsuSheet(s, "hair", h), HS_FRAME);
  }));
  // Bóng dưới chân hồn sư: elip 2:1 màu viền tối, mờ 35% (mục 5.11, lớp 1); client phóng SPR thành 24×12.
  if (!scene.textures.exists("hs_shadow")) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(0x1a1020, 0.35); g.fillEllipse(6, 3, 12, 6);
    g.generateTexture("hs_shadow", 12, 6); g.destroy();
  }
  TIERS.forEach((t, tier) => {
    for (const f of [0, 1]) for (const ag of [0, 1]) draw(scene, `b${tier}_${f}${ag ? "a" : ""}`, 48, 32, 24, 28, (R) => {
      const C = t.body, eye = ag ? "#ff3030" : "#1a0a0a", bob = f;
      if (tier === 0) {
        R(-4, -6 - bob, 8, 6, C); R(2, -9 - bob, 4, 4, C); R(3, -13 - bob, 1, 4, C); R(5, -12 - bob, 1, 3, C);
        R(4, -8 - bob, 1, 1, eye); R(-5, -5 - bob, 2, 2, "#ffffff");
      } else if (tier === 1 || tier === 2) {
        const s = tier === 2 ? 1 : 0;
        R(-6, -3, 2, 3, C); R(-2, -3 + bob, 2, 3, C); R(2, -3, 2, 3, C);
        R(-7 - s, -9 - s, 12 + s * 2, 6 + s, C); R(4 + s, -12 - s, 6, 5, C); R(9 + s, -10 - s, 2, 2, C); R(5 + s, -14 - s, 2, 2, C);
        R(-11 - s, -10 - s, 4, 2, C); R(7 + s, -11 - s, 1, 1, eye);
        if (s) { R(-4, -10, 1, 5, "#2b1a40"); R(-1, -10, 1, 5, "#2b1a40"); R(2, -10, 1, 5, "#2b1a40"); }
      } else if (tier === 3) {
        R(-8, -4, 4, 4, C); R(2, -4 + bob, 4, 4, C); R(-9, -15, 16, 12, C); R(5, -16, 7, 7, C);
        R(6, -18, 2, 2, C); R(10, -18, 2, 2, C); R(-7, -15, 11, 2, "#5a5672"); R(-7, -11, 11, 1, "#47435c");
        R(9, -13, 1, 1, ag ? "#ff3030" : "#b9a6ff");
      } else {
        for (let i = 7; i >= 0; i--) { const w = Math.max(3, Math.round(8 - i * 0.6)); R(-i * 4 - 2, Math.round(-6 + Math.sin(f * 2 + i) * 2 - w / 2), 5, w, i % 2 ? C : "#a8303a"); }
        R(2, -11, 8, 7, C); R(6, -13, 2, 3, "#f0d27a"); R(7, -9, 1, 1, "#ffe14d"); R(9, -7, 3, 1, "#ff9a9a");
      }
    });
    if (!scene.textures.exists(`ring${tier}`)) {
      const g = scene.make.graphics({}, false);
      g.fillStyle(hex(t.glow), 0.18); g.fillEllipse(12, 7, 22, 11);
      g.lineStyle(3, hex(t.col), 1); g.strokeEllipse(12, 6, 16, 7);
      g.lineStyle(1, hex(t.glow), 1); g.strokeEllipse(12, 6, 17, 8);
      g.generateTexture(`ring${tier}`, 24, 14); g.destroy();
    }
  });
  // Mảnh võ hồn rơi dưới đất (bước 3.4): viên tinh thể trắng 10×12, tô màu võ hồn bằng setTint khi vẽ.
  draw(scene, "shard", 10, 12, 5, 11, (R) => {
    R(-1, -11, 2, 1, "#ffffff"); R(-2, -10, 4, 2, "#ffffff"); R(-3, -8, 6, 3, "#e8e8e8"); R(-4, -5, 8, 2, "#d0d0d0");
    R(-3, -3, 6, 2, "#b8b8b8"); R(-2, -1, 4, 1, "#a0a0a0"); R(-1, -9, 1, 4, "#ffffff");
  });
  // Bọc trứng nhện (#162, Vạn Chu Phệ): kén tơ trắng ngà quấn chéo, bóng nhện con xanh độc bên trong; cùng khung 48×32, gốc chân
  // (24,28) như hồn thú để dùng chung BEAST_ORIGIN.
  draw(scene, "spider_egg", 48, 32, 24, 28, (R) => {
    R(-9, -1, 18, 2, "#1a2414"); // bóng đổ
    const rows: [number, number][] = [[-16, 3], [-15, 5], [-14, 6], [-13, 7], [-12, 7], [-11, 8], [-10, 8], [-9, 8], [-8, 8], [-7, 8], [-6, 8], [-5, 7], [-4, 7], [-3, 6], [-2, 5]];
    for (const [y, h] of rows) { R(-h, y, h * 2, 1, "#d6e2c4"); R(h - 3, y, 3, 1, "#a9bd96"); R(-h, y, 1, 1, "#eef6e4"); }
    R(-4, -14, 3, 2, "#f8fdf2"); R(-6, -12, 2, 3, "#f8fdf2"); // ánh sáng mép trên trái
    for (let k = 0; k < 6; k++) { R(-6 + k * 2, -13 + k * 2, 2, 1, "#ffffff"); R(5 - k * 2, -12 + k * 2, 2, 1, "#c7d6b4"); } // tơ quấn chéo
    R(-3, -9, 3, 3, "#557d3c"); R(2, -7, 3, 3, "#4a6e34"); R(-1, -5, 2, 2, "#3e5c2c"); // bóng nhện con
    R(-2, -8, 1, 1, "#7bff5a"); R(3, -6, 1, 1, "#7bff5a"); // mắt độc
    R(-7, -3, 2, 1, "#eef6e4"); R(5, -3, 2, 1, "#eef6e4"); R(-8, -2, 1, 2, "#eef6e4"); R(7, -2, 1, 2, "#eef6e4"); // sợi tơ bám đất
  });
  boneTextures(scene); // hồn cốt rơi dưới đất (bước 4.1): `bone_<vị trí>`, tô màu niên hạn bằng setTint
  coreTextures(scene); // hồn hạch rơi dưới đất (bước 5.1): `core_<bộ>`, màu bộ vẽ sẵn
}
