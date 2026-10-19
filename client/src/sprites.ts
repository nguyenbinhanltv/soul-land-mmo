// Nền tảng asset theo mục 5.11 của GAME_DESIGN.md:
// - tải ảnh thật theo shared/assets/sprites/manifest.json (chỉ key có trong danh sách, tránh 404);
// - tạo animation từ chỉ số khung cố định, key `{sheet}:{animation}_{hướng}`;
// - ánh xạ khung lớp thân sang lớp áo, tóc, phụ thể;
// - hoán màu dải 4 xám chuẩn, key `{gốc}@{chỉ số màu}`;
// - hồn sư theo bộ giới × kiểu tóc: `hs_{lớp}_{giới}_{kiểu tóc}` (honsuKey).
// Key nào chưa có ảnh thì makeTextures() trong textures.ts vẽ bằng code như cũ.
import Phaser from "phaser";

const MANIFEST_KEY = "sprites-manifest";
const BASE = "sprites/";

/** Bố cục spritesheet hồn sư (mọi lớp giống nhau): 16 cột × 4 hàng. */
export const SHEET_COLS = 16;
/** Khung hồn sư 32×32, gốc tại chân (16,30). */
export const HS_FRAME = 32;
export const HS_ORIGIN = { x: 0.5, y: 30 / 32 };
/** Khung phụ thể 48×48 (khung thân mở rộng 8 pixel mỗi phía), gốc tại (24,38). */
export const VH_FRAME = 48;
export const VH_ORIGIN = { x: 0.5, y: 38 / 48 };

/** Hướng được vẽ, theo thứ tự hàng 0, 1, 2. Hướng trái dùng `right` và lật ngang. */
export const DIRS = ["down", "right", "up"] as const;
export type Dir = (typeof DIRS)[number] | "left";

interface AnimDef { col: number; ms: readonly number[]; loop: boolean; row?: number }

/** Bảng animation hồn sư (mục 5.11): cột bắt đầu và thời gian từng khung (ms). */
export const HS_ANIMS = {
  idle:   { col: 0,  ms: [400, 400], loop: true },
  walk:   { col: 2,  ms: [120, 120, 120, 120], loop: true },
  attack: { col: 6,  ms: [80, 80, 140], loop: false },
  cast:   { col: 9,  ms: [100, 200, 140], loop: false },
  hurt:   { col: 12, ms: [150], loop: false },
  die:    { col: 13, ms: [120, 120, 120], loop: false }, // dừng ở khung cuối (nằm)
  absorb: { col: 0,  ms: [500, 500], loop: true, row: 3 }, // chỉ hướng xuống
} satisfies Record<string, AnimDef>;
export type HsAnim = keyof typeof HS_ANIMS;

/** Khung hồn thú theo bậc niên hạn (TIERS): rộng × cao. */
export const BEAST_FRAMES: readonly [number, number][] = [[16, 16], [32, 32], [48, 32], [48, 48], [64, 64]];

/** Hồn thú: một hàng 13 khung, chỉ vẽ hướng phải. */
export const BEAST_ANIMS = {
  idle:   { col: 0,  ms: [400, 400], loop: true },
  walk:   { col: 2,  ms: [120, 120, 120, 120], loop: true },
  // Khung đầu là tư thế báo trước, giữ cho khớp vùng cảnh báo 0,8 giây (mục 5.3).
  // Khi bước 3.5 đưa thời gian báo trước vào shared/data.ts thì đọc từ đó.
  attack: { col: 6,  ms: [800, 80, 140], loop: false },
  hurt:   { col: 9,  ms: [150], loop: false },
  die:    { col: 10, ms: [120, 120, 120], loop: false },
} satisfies Record<string, AnimDef>;

/** Gốc hồn thú cách mép dưới khung 4 pixel (cùng gốc với sprite vẽ bằng code; normalize --anchor 16,28 cho khung 32). */
export const BEAST_FOOT = 4;

/**
 * Hồn thú theo loài (M4): nếu loài đã có sheet `beast_{loài}` thì đặt sheet đó, gốc giữa đáy và chạy `idle`/`walk`.
 * Trả false khi loài chưa có ảnh thật để nơi gọi vẽ `b{tier}_…` bằng code như cũ. Lật ngang do nơi gọi đặt.
 */
export function syncBeastSprite(s: Phaser.GameObjects.Sprite, species: string | undefined, moving: boolean, aggro: boolean): boolean {
  const key = `beast_${species}`, anim = `${key}:${moving ? "walk" : "idle"}`;
  if (!species || !s.scene.anims.exists(anim)) return false;
  if (s.texture.key !== key) {
    s.setTexture(key, 0);
    s.setOrigin(0.5, (s.frame.height - BEAST_FOOT) / s.frame.height);
  }
  s.play(anim, true);
  // Chưa có dấu "!" riêng cho trạng thái hung hăng (5.11): tạm ửng đỏ nhẹ để vẫn nhận ra.
  if (aggro) s.setTint(0xffb4b4); else s.clearTint();
  return true;
}

export type HsLayer = "body" | "outfit" | "hair";
/**
 * Key sheet hồn sư (mục 5.11): mỗi tổ hợp giới × kiểu tóc là một bộ 3 lớp tách từ cùng một hình,
 * ví dụ `hs_body_f_2`, `hs_outfit_f_2`, `hs_hair_f_2`. Animation chạy trên lớp thân: `hs_body_f_2:walk_down`.
 */
export const honsuKey = (layer: HsLayer, sex: "m" | "f", hair: number) => `hs_${layer}_${sex}_${hair}`;

/** Dải 4 xám chuẩn (tối → sáng) của lớp tóc và áo, được thay khi hoán màu. Viền ngoài #1a1020 không thuộc dải nên giữ nguyên. */
export const GRAY_RAMP = ["#3a3a3a", "#6a6a6a", "#9a9a9a", "#cacaca"] as const;

interface SheetSpec { url: string; frame?: readonly [number, number] }
type ManifestEntry = string | { key: string; frame?: [number, number] };

/** Đường dẫn ảnh và kích thước khung suy ra từ key (bảng thư mục ở mục 5.11). */
function sheetSpec(key: string, frame?: readonly [number, number]): SheetSpec | null {
  let m: RegExpMatchArray | null;
  if ((m = key.match(/^hs_((?:body|outfit|hair)_[mf]_\d+)$/))) return { url: `honsu/${m[1]}.png`, frame: [HS_FRAME, HS_FRAME] };
  if ((m = key.match(/^vh_([a-z_]+_[bf])$/))) return { url: `vohon/${m[1]}.png`, frame: [VH_FRAME, VH_FRAME] };
  if ((m = key.match(/^b(\d)$/)) && BEAST_FRAMES[+m[1]]) return { url: `beast/${key}.png`, frame: frame ?? BEAST_FRAMES[+m[1]] };
  // Khung của từng loài phụ thuộc bậc của loài, nên manifest phải ghi `frame`.
  if ((m = key.match(/^beast_([a-z_]+)$/)) && frame) return { url: `beast/${m[1]}.png`, frame };
  if (/^ring\d$/.test(key)) return { url: `ring/${key}.png` };
  if (/^halo\d$/.test(key)) return { url: `ring/${key}.png`, frame: [24, 10] };
  return null;
}

/** Gọi trong preload(): đọc manifest rồi xếp hàng tải các ảnh có trong đó. */
export function preloadSprites(scene: Phaser.Scene) {
  scene.load.json(MANIFEST_KEY, BASE + "manifest.json");
  scene.load.once(`filecomplete-json-${MANIFEST_KEY}`, (_key: string, _type: string, data: { sprites?: ManifestEntry[] }) => {
    for (const e of data?.sprites ?? []) {
      const key = typeof e === "string" ? e : e.key;
      const spec = sheetSpec(key, typeof e === "string" ? undefined : e.frame);
      if (!spec) { console.warn(`[sprites] key không hợp lệ trong manifest: ${key}`); continue; }
      if (spec.frame) scene.load.spritesheet(key, BASE + spec.url, { frameWidth: spec.frame[0], frameHeight: spec.frame[1] });
      else scene.load.image(key, BASE + spec.url);
    }
  });
}

/** Thêm khung đánh số theo lưới cho texture vẽ bằng code, để dùng y như spritesheet tải từ ảnh. */
export function addGridFrames(scene: Phaser.Scene, key: string, fw: number, fh: number) {
  const tex = scene.textures.get(key), src = tex.source[0];
  const cols = Math.floor(src.width / fw), rows = Math.floor(src.height / fh);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (!tex.has(String(i))) tex.add(i, 0, c * fw, r * fh, fw, fh);
  }
}

function makeAnim(scene: Phaser.Scene, sheet: string, key: string, start: number, a: AnimDef) {
  if (scene.anims.exists(key)) return;
  const frames = scene.anims.generateFrameNumbers(sheet, { start, end: start + a.ms.length - 1 });
  if (frames.length !== a.ms.length) return; // sheet thiếu khung: bỏ qua thay vì tạo animation hỏng
  scene.anims.create({ key, frames: frames.map((f, i) => ({ ...f, duration: a.ms[i] })), repeat: a.loop ? -1 : 0 });
}

/** Tạo animation `{sheet}:{animation}_{hướng}` cho một sheet thân hồn sư (chỉ lớp thân có animation). */
export function createHonsuAnims(scene: Phaser.Scene, sheet: string) {
  if (!scene.textures.exists(sheet)) return;
  for (const [name, a] of Object.entries(HS_ANIMS) as [HsAnim, AnimDef][]) {
    if (a.row !== undefined) makeAnim(scene, sheet, `${sheet}:${name}_down`, a.row * SHEET_COLS + a.col, a);
    else DIRS.forEach((d, row) => makeAnim(scene, sheet, `${sheet}:${name}_${d}`, row * SHEET_COLS + a.col, a));
  }
}

/** Tạo animation `{sheet}:{animation}` cho sheet hồn thú (một hàng, hướng phải). */
export function createBeastAnims(scene: Phaser.Scene, sheet: string) {
  if (!scene.textures.exists(sheet)) return;
  for (const [name, a] of Object.entries(BEAST_ANIMS)) makeAnim(scene, sheet, `${sheet}:${name}`, a.col, a);
}

/** Tạo animation cho mọi sheet thân hồn sư và hồn thú đang có (ảnh thật hoặc vẽ bằng code). */
export function createSheetAnims(scene: Phaser.Scene) {
  for (const key of scene.textures.getTextureKeys()) {
    if (/^hs_body_[mf]_\d+$/.test(key)) createHonsuAnims(scene, key);
    else if (/^(b\d|beast_[a-z_]+)$/.test(key)) createBeastAnims(scene, key);
  }
}

/** Key animation và cờ lật ngang cho một hướng; `absorb` chỉ có hướng xuống. */
export function honsuAnimKey(sheet: string, anim: HsAnim, dir: Dir): { key: string; flip: boolean } {
  if (anim === "absorb") return { key: `${sheet}:absorb_down`, flip: false };
  return { key: `${sheet}:${anim}_${dir === "left" ? "right" : dir}`, flip: dir === "left" };
}

/**
 * Bảng ánh xạ khung dự phòng cho lớp phụ thể (chỉ vẽ idle/walk/attack/cast, cột 0–11 hàng 0–2).
 * Trả về khung phụ thể và độ mờ, hoặc null nếu phải ẩn phụ thể.
 */
export function vohonFrame(bodyFrame: number): { frame: number; alpha: number } | null {
  const row = Math.floor(bodyFrame / SHEET_COLS), col = bodyFrame % SHEET_COLS;
  if (row === 3) return col <= 1 ? { frame: col, alpha: 0.6 } : null; // absorb → idle hướng xuống, mờ 60%
  if (col <= 11) return { frame: bodyFrame, alpha: 1 };
  if (col === 12) return { frame: row * SHEET_COLS, alpha: 1 }; // hurt → idle khung đầu cùng hàng
  return null; // die: ẩn phụ thể
}

/** Đặt khung lớp áo, tóc (cùng khung) và phụ thể (theo bảng ánh xạ) theo khung lớp thân hiện tại. */
export function syncLayers(body: Phaser.GameObjects.Sprite, clothes: Phaser.GameObjects.Sprite[], vohon: Phaser.GameObjects.Sprite[]) {
  const n = Number(body.frame.name);
  for (const s of clothes) { s.setFrame(n); s.setFlipX(body.flipX); }
  const v = vohonFrame(n);
  for (const s of vohon) {
    s.setVisible(v !== null).setFlipX(body.flipX);
    if (v) s.setFrame(v.frame).setAlpha(v.alpha);
  }
}

const rgb = (c: string) => parseInt(c.slice(1), 16);

/**
 * Hoán màu: tạo texture `{base}@{index}` bằng cách thay đúng 4 màu của GRAY_RAMP bằng `ramp`
 * (tối → sáng), giữ nguyên các khung. Không dùng setTint vì phép nhân màu làm mất sắc độ.
 * Chỉ gọi khi có người chơi dùng tổ hợp đó; gọi lại thì dùng texture đã tạo.
 */
export function recolor(scene: Phaser.Scene, base: string, index: number, ramp: readonly string[]): string {
  const key = `${base}@${index}`;
  if (scene.textures.exists(key) || !scene.textures.exists(base)) return key;
  const src = scene.textures.get(base);
  const img = src.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const tex = scene.textures.createCanvas(key, img.width, img.height)!;
  const ctx = tex.getContext();
  ctx.drawImage(img, 0, 0);
  const swap = new Map(GRAY_RAMP.map((g, i) => [rgb(g), rgb(ramp[i])]));
  const px = ctx.getImageData(0, 0, img.width, img.height), d = px.data;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const to = swap.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    if (to !== undefined) { d[i] = to >> 16; d[i + 1] = (to >> 8) & 255; d[i + 2] = to & 255; }
  }
  ctx.putImageData(px, 0, 0);
  for (const name of src.getFrameNames()) {
    const f = src.get(name);
    tex.add(name, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight);
  }
  tex.refresh();
  return key;
}
