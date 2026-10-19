// Sprite pixel vẽ bằng code. Ảnh thật được tải trước theo shared/assets/sprites/manifest.json (sprites.ts);
// key nào đã có ảnh thì ở đây bỏ qua. Hồn sư ghép lớp theo mục 5.11: hình vẽ nằm trong honsuArt.ts.
import Phaser from "phaser";
import { TIERS, VOHON, HAIR_STYLES, HAIR_COLORS, OUTFIT_COLORS, type Looks } from "../../shared/data.ts";
import { addGridFrames, recolor, honsuKey, HS_FRAME, VH_FRAME } from "./sprites.ts";
import { honsuSheet, vohonSheets, bufCanvas, type Buf, type Sex } from "./honsuArt.ts";

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

/** Sheet thân (có animation) của bộ giới × kiểu tóc, ví dụ `hs_body_f_2`. */
export const bodyKey = (L: Pick<Looks, "sex" | "hair">) => honsuKey("body", sexKey(L.sex), hairOf(L));

/**
 * Key texture thân, áo, tóc theo ngoại hình: cả 3 lớp cùng bộ giới × kiểu tóc (mục 5.11).
 * Áo và tóc hoán màu (key `hs_hair_f_2@3`, `hs_outfit_f_2@5`), chỉ tạo khi có người dùng tổ hợp đó.
 */
export function looksTextures(scene: Phaser.Scene, L: Looks) {
  const s = sexKey(L.sex), h = hairOf(L);
  return {
    body: bodyKey(L),
    outfit: recolor(scene, honsuKey("outfit", s, h), L.outfitCol, (OUTFIT_COLORS[L.outfitCol] ?? OUTFIT_COLORS[0]).ramp),
    hair: recolor(scene, honsuKey("hair", s, h), L.hairCol, (HAIR_COLORS[L.hairCol] ?? HAIR_COLORS[0]).ramp),
  };
}

/**
 * Vòng hồn hoàn dưới chân (mục 5.11): elip 20×6, thân 2 pixel màu `col` cộng 1 pixel `glow`.
 * `halo{tier}` khung 24×10, khung 0 cung trên (vẽ sau thân), khung 1 cung dưới (vẽ trước thân), đúng key ảnh vẽ tay.
 * `halo{tier}_lit` khung 28×12 là vòng đang tung hồn kỹ: phình 2 pixel, sáng hơn một bậc (col → glow, glow → trắng).
 */
function haloTexture(scene: Phaser.Scene, key: string, col: string, glow: string, big: boolean) {
  if (scene.textures.exists(key)) return;
  const rx = big ? 12 : 10, ry = big ? 4 : 3, fw = big ? 28 : 24, fh = big ? 12 : 10;
  const tex = scene.textures.createCanvas(key, fw * 2, fh)!, ctx = tex.getContext();
  const inE = (px: number, py: number, a: number, b: number) => (px / a) ** 2 + (py / b) ** 2 <= 1;
  for (let y = -ry - 1; y <= ry; y++) for (let x = -rx - 1; x <= rx; x++) {
    const px = x + 0.5, py = y + 0.5;
    if (!inE(px, py, rx, ry)) continue;
    const edge = !inE(px, py, rx - 1, ry - 0.8);
    if (!edge && inE(px, py, rx - 3, ry - 2)) continue;
    ctx.fillStyle = edge ? glow : col;
    ctx.fillRect((py < 0 ? 0 : fw) + fw / 2 + x, fh / 2 + y, 1, 1);
  }
  tex.refresh();
  addGridFrames(scene, key, fw, fh);
}

export function makeTextures(scene: Phaser.Scene) {
  // Hồn sư: mỗi bộ giới × kiểu tóc còn thiếu ảnh thật thì vẽ bằng code (thân, áo dải xám, tóc dải xám);
  // bản hoán màu tạo sau trong looksTextures(). Bản code dùng chung thân và áo cho mọi kiểu tóc.
  SEX_KEYS.forEach((s, sex) => HAIR_STYLES[sex].forEach((_, h) => {
    addSheet(scene, honsuKey("body", s, h), () => honsuSheet(s, "body"), HS_FRAME);
    addSheet(scene, honsuKey("outfit", s, h), () => honsuSheet(s, "outfit"), HS_FRAME);
    addSheet(scene, honsuKey("hair", s, h), () => honsuSheet(s, "hair", h), HS_FRAME);
  }));
  // Bóng dưới chân hồn sư: elip mờ 12×4 (mục 5.11, lớp 1).
  if (!scene.textures.exists("hs_shadow")) {
    const g = scene.make.graphics({}, false);
    g.fillStyle(0x000000, 0.35); g.fillEllipse(6, 2, 12, 4);
    g.generateTexture("hs_shadow", 12, 4); g.destroy();
  }
  TIERS.forEach((t, tier) => {
    haloTexture(scene, `halo${tier}`, t.col, t.glow, false);
    haloTexture(scene, `halo${tier}_lit`, t.glow, "#ffffff", true);
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
  if (!scene.textures.exists("vignette")) {
    const c = scene.textures.createCanvas("vignette", 256, 256)!;
    const ctx = c.getContext();
    const grd = ctx.createRadialGradient(128, 128, 40, 128, 128, 180);
    grd.addColorStop(0, "rgba(5,8,20,0)"); grd.addColorStop(1, "rgba(5,8,20,1)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256); c.refresh();
  }
}
