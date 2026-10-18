// Sprite pixel tạm thời được vẽ bằng code. Ảnh thật được tải trước theo
// shared/assets/sprites/manifest.json (sprites.ts); key nào đã có ảnh thì ở đây bỏ qua.
import Phaser from "phaser";
import { TIERS, VOHON, HAIR_COLORS, OUTFIT_COLORS, type Looks } from "../../shared/data.ts";

const hex = (c: string) => parseInt(c.slice(1), 16);

/** Tô một hình chữ nhật, tọa độ tính từ gốc (chân). */
export type Rect = (x: number, y: number, w: number, h: number, c: string) => void;

function draw(scene: Phaser.Scene, key: string, w: number, h: number, ox: number, oy: number, fn: (R: Rect) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  fn((x, y, ww, hh, c) => { g.fillStyle(hex(c), 1); g.fillRect(ox + x, oy + y, ww, hh); });
  g.generateTexture(key, w, h); g.destroy();
}

/** Người chơi: 16x24, gốc tại chân (8,22). */
export const PLAYER_ORIGIN = { x: 0.5, y: 22 / 24 };
/** Hồn thú: 48x32, gốc tại chân (24,28). */
export const BEAST_ORIGIN = { x: 0.5, y: 28 / 32 };

const SKIN = "#f1c7a0", SKIN_DARK = "#c98f6c", EYE = "#1a1010", BLUSH = "#e08a7a", TIGHTS = "#2b2430";

/**
 * Hồn sư tạm vẽ bằng code (đến bước 2.2b ghép lớp theo mục 5.11): nhìn sang phải, gốc tại chân, cao tới y = -20.
 * Dùng chung cho sprite trong game và ô xem trước ở màn tạo nhân vật. `f` = khung bước chân (0/1), `belt` = màu đai.
 */
export function drawHonsu(R: Rect, L: Looks, f: number, belt?: string) {
  const H = (HAIR_COLORS[L.hairCol] ?? HAIR_COLORS[0]).ramp, O = (OUTFIT_COLORS[L.outfitCol] ?? OUTFIT_COLORS[0]).ramp;
  const girl = L.sex === 1;
  // Chân: nam mặc quần cùng màu áo, nữ mặc quần bó sẫm dưới váy ngắn.
  const leg = girl ? TIGHTS : O[0];
  R(-3, -3, 2, f ? 3 : 4, leg); R(1, -3, 2, f ? 4 : 3, leg);
  // Áo hồn sư có đai lưng: sáng ở vai, tối bên phải (ánh sáng từ trên bên trái).
  R(-4, -11, 8, 9, O[2]); R(3, -11, 1, 9, O[1]); R(-4, -11, 8, 1, O[3]);
  R(-5, -10, 1, 5, O[1]); R(4, -10, 1, 5, O[1]);
  R(-4, -6, 8, 1, belt ?? O[0]);
  if (girl) { R(-5, -5, 10, 2, O[2]); R(-5, -4, 10, 1, O[1]); }
  R(-5, -5, 1, 1, SKIN); R(4, -5, 1, 1, SKIN);
  // Đầu.
  R(-3, -16, 6, 5, SKIN); R(-3, -12, 6, 1, SKIN_DARK); R(1, -14, 1, 1, EYE);
  if (girl) R(2, -13, 1, 1, BLUSH);
  // Tóc: phần chung trên đỉnh và sau gáy, rồi kiểu riêng (bảng HAIR_STYLES).
  R(-3, -17, 6, 2, H[2]); R(-2, -17, 2, 1, H[3]); R(-4, -16, 2, 3, H[1]);
  switch (L.sex * 4 + L.hair) {
    case 0: // Nam: ngắn rối
      R(-3, -18, 1, 1, H[2]); R(0, -18, 1, 1, H[2]); R(2, -18, 1, 1, H[1]); R(2, -16, 1, 1, H[1]); break;
    case 1: // Nam: dài buộc thấp sau gáy
      R(-5, -13, 2, 1, H[0]); R(-5, -12, 2, 5, H[1]); R(-5, -12, 1, 4, H[2]); break;
    case 2: // Nam: dựng nhọn
      R(-4, -18, 1, 1, H[1]); R(-3, -19, 1, 2, H[2]); R(-1, -20, 1, 3, H[2]); R(1, -19, 1, 2, H[2]); R(3, -18, 1, 1, H[1]); break;
    case 3: // Nam: mái dài che một bên mắt
      R(0, -16, 3, 3, H[2]); R(2, -13, 1, 1, H[1]); break;
    case 4: // Nữ: dài thả thẳng
      R(-5, -16, 2, 10, H[1]); R(-4, -16, 1, 9, H[2]); R(2, -16, 1, 2, H[1]); break;
    case 5: // Nữ: đuôi ngựa cao
      R(-5, -18, 2, 2, H[0]); R(-6, -17, 2, 7, H[1]); R(-6, -17, 1, 5, H[2]); break;
    case 6: // Nữ: bím dài một bên
      for (let i = 0; i < 8; i++) R(-5, -14 + i, 2, 1, i % 2 ? H[1] : H[2]);
      R(-5, -6, 2, 1, H[0]); break;
    default: // Nữ: ngắn ngang vai, có mái
      R(-5, -16, 2, 6, H[1]); R(-1, -16, 4, 1, H[2]); R(2, -15, 1, 1, H[1]); break;
  }
}

/** Texture hồn sư theo võ hồn ra trận và ngoại hình, chỉ tạo khi có người dùng tổ hợp đó. Key cũ `p{vh}_…` bỏ ở bước 2.2b. */
export function honsuTexture(scene: Phaser.Scene, vh: number, f: number, L: Looks) {
  const key = `p${vh}_${f}_${L.sex}${L.hair}${L.hairCol}${L.outfitCol}`;
  draw(scene, key, 16, 24, 8, 22, (R) => drawHonsu(R, L, f, VOHON[vh]?.col));
  return key;
}

export function makeTextures(scene: Phaser.Scene) {
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
  if (!scene.textures.exists("vignette")) {
    const c = scene.textures.createCanvas("vignette", 256, 256)!;
    const ctx = c.getContext();
    const grd = ctx.createRadialGradient(128, 128, 40, 128, 128, 180);
    grd.addColorStop(0, "rgba(5,8,20,0)"); grd.addColorStop(1, "rgba(5,8,20,1)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256); c.refresh();
  }
}
