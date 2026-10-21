// Nền tảng asset theo mục 5.11 của GAME_DESIGN.md:
// - tải ảnh thật theo shared/assets/sprites/manifest.json (chỉ key có trong danh sách, tránh 404);
// - tạo animation từ chỉ số khung cố định, key `{sheet}:{animation}_{hướng}`;
// - ánh xạ khung lớp thân sang lớp áo, tóc, phụ thể;
// - hoán màu dải 4 xám chuẩn, key `{gốc}@{chỉ số màu}`;
// - hồn sư theo bộ giới × kiểu tóc: `hs_{lớp}_{giới}_{kiểu tóc}` (honsuKey). Từ 10.4 bộ có `"iso": true` trong manifest
//   là sheet isometric 64×64, 24 × 6, 8 hướng (vẽ 5, lật 3); bộ chưa có vẫn là sheet 32×32 cũ (4 hướng) hoặc vẽ bằng code.
// Key nào chưa có ảnh thì makeTextures() trong textures.ts vẽ bằng code như cũ.
import Phaser from "phaser";
import { TELE_WARN } from "../../shared/data.ts";
import { legacyDir, SPR, type Dir8 } from "./iso.ts";
import { attachNormal, lightingOn } from "./lighting.ts";

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

/** Hồn sư isometric (mục 5.11, từ 10.4): khung 64×64 gốc (32,58); phụ thể 96×96 gốc (48,74). Sheet hồn sư 24 cột × 6 hàng;
 *  phụ thể cùng bố cục cột, hai nửa theo giới (24 × 12, vohonHalf). */
export const ISO_HS_FRAME = 64, ISO_VH_FRAME = 96, ISO_SHEET_COLS = 24;
export const ISO_HS_ORIGIN = { x: 0.5, y: 58 / 64 };
export const ISO_VH_ORIGIN = { x: 0.5, y: 74 / 96 };
/** 5 hướng vẽ theo thứ tự hàng 0–4; sw, w, nw dùng se, e, ne lật ngang. */
export const ISO_DIRS = ["s", "se", "e", "ne", "n"] as const;
export type IsoDir = (typeof ISO_DIRS)[number];
const ISO_FLIP: Partial<Record<Dir8, IsoDir>> = { sw: "se", w: "e", nw: "ne" };

/** Bảng animation hồn sư isometric (mục 5.11): cột bắt đầu và thời gian từng khung (ms); `die` dừng ở khung cuối (nằm). */
export const ISO_HS_ANIMS = {
  idle:   { col: 0,  ms: [200, 200, 200, 200], loop: true },
  walk:   { col: 4,  ms: [100, 100, 100, 100, 100, 100], loop: true },
  attack: { col: 10, ms: [70, 70, 90, 120], loop: false },
  cast:   { col: 14, ms: [100, 200, 140], loop: false },
  hurt:   { col: 17, ms: [80, 120], loop: false },
  die:    { col: 19, ms: [120, 120, 120, 120], loop: false },
  absorb: { col: 0,  ms: [500, 500], loop: true, row: 5 }, // chỉ hướng s
} satisfies Record<string, AnimDef>;

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

/** Sheet hồn sư / phụ thể (kể cả bản hoán màu `…@n`) theo bố cục isometric 24 cột (khung 64 hoặc 96) hay không. */
export function isIsoSheet(scene: Phaser.Scene, key: string) {
  if (!scene.textures.exists(key)) return false;
  const w = scene.textures.get(key).source[0].width;
  return w === ISO_SHEET_COLS * ISO_HS_FRAME || w === ISO_SHEET_COLS * ISO_VH_FRAME;
}

/** Bảng animation theo bố cục của sheet thân. */
export const honsuAnims = (scene: Phaser.Scene, sheet: string): Record<HsAnim, AnimDef> => (isIsoSheet(scene, sheet) ? ISO_HS_ANIMS : HS_ANIMS);
/** Tổng thời gian một animation hồn sư (ms) theo bố cục của sheet thân. */
export const honsuAnimMs = (scene: Phaser.Scene, sheet: string, a: HsAnim) => honsuAnims(scene, sheet)[a].ms.reduce((x, y) => x + y, 0);

/**
 * Gốc và hệ số phóng của một lớp hồn sư / phụ thể theo texture đang đặt: hình chứa (container) của hồn sư phóng SPR cho sprite 32×32
 * cũ, nên lớp isometric 64×64 / 96×96 phóng 1 / SPR để 1 pixel ảnh là 1 pixel màn hình nội bộ.
 */
export function fitHonsuLayer<T extends Phaser.GameObjects.Sprite>(s: T, vohon = false): T {
  const iso = isIsoSheet(s.scene, s.texture.key), o = iso ? (vohon ? ISO_VH_ORIGIN : ISO_HS_ORIGIN) : vohon ? VH_ORIGIN : HS_ORIGIN;
  if (s.originY !== o.y) s.setOrigin(o.x, o.y);
  const k = iso ? 1 / SPR : 1;
  if (s.scaleX !== k) s.setScale(k);
  return s;
}

/** Khung hồn thú theo bậc niên hạn (TIERS): rộng × cao. */
export const BEAST_FRAMES: readonly [number, number][] = [[16, 16], [32, 32], [48, 32], [48, 48], [64, 64]];

/** Hồn thú: một hàng 13 khung, chỉ vẽ hướng phải. */
export const BEAST_ANIMS = {
  idle:   { col: 0,  ms: [400, 400], loop: true },
  walk:   { col: 2,  ms: [120, 120, 120, 120], loop: true },
  // Khung đầu là tư thế báo trước, giữ cho khớp vùng cảnh báo TELE_WARN (mục 5.3, bước 3.5); hồn thú còn giữ khung này tới khi
  // server tung chiêu (BeastState.cast về false) rồi mới chạy 2 khung ra đòn.
  attack: { col: 6,  ms: [TELE_WARN * 1000, 80, 140], loop: false },
  hurt:   { col: 9,  ms: [150], loop: false },
  die:    { col: 10, ms: [120, 120, 120], loop: false },
} satisfies Record<string, AnimDef>;

/** Gốc hồn thú cách mép dưới khung 4 pixel (cùng gốc với sprite vẽ bằng code; normalize --anchor 16,28 cho khung 32). */
export const BEAST_FOOT = 4;

/**
 * Hồn thú theo loài (M4): nếu loài đã có sheet `beast_{loài}` thì đặt sheet đó, gốc giữa đáy và chạy `idle`/`walk`.
 * Trả false khi loài chưa có ảnh thật để nơi gọi vẽ `b{tier}_…` bằng code như cũ. Lật ngang do nơi gọi đặt.
 */
export function syncBeastSprite(s: Phaser.GameObjects.Sprite, species: string | undefined, moving: boolean, aggro: boolean, cast = false): boolean {
  const key = `beast_${species}`, anim = `${key}:${moving ? "walk" : "idle"}`, atk = `${key}:attack`;
  if (!species || !s.scene.anims.exists(anim)) return false;
  if (s.texture.key !== key) {
    s.setTexture(key, 0);
    s.setOrigin(0.5, (s.frame.height - BEAST_FOOT) / s.frame.height);
  }
  // Báo trước chiêu (3.5): giữ khung đầu của `attack`; tung xong thì chạy nốt 2 khung ra đòn rồi mới về idle / walk.
  const cur = s.anims.currentAnim?.key === atk;
  if (cast) { if (!cur || !(s.anims.isPaused || s.anims.isPlaying)) { s.play(atk); s.anims.pause(); } }
  else if (cur && s.anims.isPaused) { s.anims.resume(); s.anims.nextFrame(); }
  else if (!(cur && s.anims.isPlaying)) s.play(anim, true);
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
type ManifestEntry = string | { key: string; frame?: [number, number]; iso?: boolean };

/** Đường dẫn ảnh và kích thước khung suy ra từ key (bảng thư mục ở mục 5.11). */
function sheetSpec(key: string, frame?: readonly [number, number], iso = false): SheetSpec | null {
  let m: RegExpMatchArray | null;
  if ((m = key.match(/^hs_((?:body|outfit|hair)_[mf]_\d+)$/))) return { url: `honsu/${m[1]}.png`, frame: iso ? [ISO_HS_FRAME, ISO_HS_FRAME] : [HS_FRAME, HS_FRAME] };
  if ((m = key.match(/^vh_([a-z_]+_[bf])$/))) return { url: `vohon/${m[1]}.png`, frame: iso ? [ISO_VH_FRAME, ISO_VH_FRAME] : [VH_FRAME, VH_FRAME] };
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
      // Asset isometric (mục 5.11): từ 10.4 tải bộ hồn sư (cả 3 lớp cùng có "iso", validate.mjs kiểm), từ 10.5 phụ thể 96×96 (võ hồn
      // chưa có ảnh mới vẫn dùng bộ 48×48 cũ hoặc vẽ bằng code; vohonFrame ánh xạ khung giữa hai bố cục); vật đứng do isoMap.ts tải
      // theo shared/assets/iso/tiles.json (chỉ vật bản đồ đang vào dùng); chân dung, NPC, vật phẩm, hồn thú chờ bước dùng chúng (10.6, 10.8).
      const key = typeof e === "string" ? e : e.key, iso = typeof e !== "string" && !!e.iso;
      if (iso && !/^(hs|vh)_/.test(key)) continue;
      const spec = sheetSpec(key, typeof e === "string" ? undefined : e.frame, iso);
      if (!spec) { console.warn(`[sprites] key không hợp lệ trong manifest: ${key}`); continue; }
      if (spec.frame) scene.load.spritesheet(key, BASE + spec.url, { frameWidth: spec.frame[0], frameHeight: spec.frame[1] });
      else scene.load.image(key, BASE + spec.url);
      // Normal map của bộ hồn sư / phụ thể isometric (`<ảnh>_n.png`, 10.7): tải riêng, GameScene gắn vào texture (attachNormal).
      if (iso && lightingOn(scene.game)) scene.load.image(`${key}_n`, BASE + spec.url.replace(/\.png$/, "_n.png"));
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

/**
 * Tạo animation `{sheet}:{animation}_{hướng}` cho một sheet thân hồn sư (chỉ lớp thân có animation). Sheet isometric: hướng
 * s, se, e, ne, n (`absorb_s`); sheet 32×32 cũ: down, right, up (`absorb_down`).
 */
export function createHonsuAnims(scene: Phaser.Scene, sheet: string) {
  if (!scene.textures.exists(sheet)) return;
  if (isIsoSheet(scene, sheet)) {
    for (const [name, a] of Object.entries(ISO_HS_ANIMS) as [HsAnim, AnimDef][]) {
      if (a.row !== undefined) makeAnim(scene, sheet, `${sheet}:${name}_s`, a.row * ISO_SHEET_COLS + a.col, a);
      else ISO_DIRS.forEach((d, row) => makeAnim(scene, sheet, `${sheet}:${name}_${d}`, row * ISO_SHEET_COLS + a.col, a));
    }
    return;
  }
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

/**
 * Key animation và cờ lật ngang cho hướng 8 phía trên màn hình; `absorb` chỉ có hướng xuống. Sheet isometric: sw, w, nw lật se, e, ne;
 * sheet 32×32 cũ: hướng gần nhất trong 4 hướng cũ (legacyDir), trái lật phải.
 */
export function honsuAnimKey(scene: Phaser.Scene, sheet: string, anim: HsAnim, d: Dir8): { key: string; flip: boolean } {
  if (isIsoSheet(scene, sheet)) {
    if (anim === "absorb") return { key: `${sheet}:absorb_s`, flip: false };
    const f = ISO_FLIP[d];
    return { key: `${sheet}:${anim}_${f ?? d}`, flip: !!f };
  }
  if (anim === "absorb") return { key: `${sheet}:absorb_down`, flip: false };
  const dir = legacyDir(d);
  return { key: `${sheet}:${anim}_${dir === "left" ? "right" : dir}`, flip: dir === "left" };
}

/** Đọc một khung theo bố cục sheet hồn sư: animation, hàng hướng (absorb: 0), khung thứ mấy; null nếu ô ngoài bố cục. */
function decodeFrame(n: number, iso: boolean): { anim: HsAnim; row: number; i: number } | null {
  const cols = iso ? ISO_SHEET_COLS : SHEET_COLS, table: Record<HsAnim, AnimDef> = iso ? ISO_HS_ANIMS : HS_ANIMS;
  const row = Math.floor(n / cols), col = n % cols, dirs = iso ? ISO_DIRS.length : DIRS.length;
  for (const [anim, a] of Object.entries(table) as [HsAnim, AnimDef][]) {
    const onRow = a.row !== undefined ? row === a.row : row < dirs;
    if (onRow && col >= a.col && col < a.col + a.ms.length) return { anim, row: a.row !== undefined ? 0 : row, i: col - a.col };
  }
  return null;
}

/** Hàng hướng giữa hai bố cục: isometric s, se, e, ne, n → cũ down, right, up; và ngược lại. */
const ISO_ROW_TO_OLD = [0, 1, 1, 1, 2], OLD_ROW_TO_ISO = [0, 2, 4];

/**
 * Bảng ánh xạ khung lớp phụ thể (mục 5.11; phụ thể chỉ vẽ idle / walk / attack / cast): cùng animation, cùng hướng, cùng khung (phụ thể
 * ít khung hơn thì khung cuối); hurt → idle khung đầu; absorb → idle hướng xuống, mờ 60%; die → ẩn (null). Thân và phụ thể có thể khác
 * bố cục trong lúc chuyển sang isometric (thân từ 10.4, phụ thể từ 10.5) nên ánh xạ qua (animation, hướng, khung).
 */
export function vohonFrame(bodyFrame: number, isoBody = false, isoVohon = false): { frame: number; alpha: number } | null {
  const f = decodeFrame(bodyFrame, isoBody);
  if (!f || f.anim === "die") return null;
  const [anim, i, alpha]: [HsAnim, number, number] = f.anim === "absorb" ? ["idle", f.i, 0.6] : f.anim === "hurt" ? ["idle", 0, 1] : [f.anim, f.i, 1];
  const row = isoBody === isoVohon ? f.row : isoBody ? ISO_ROW_TO_OLD[f.row] : OLD_ROW_TO_ISO[f.row];
  const a = (isoVohon ? ISO_HS_ANIMS : HS_ANIMS)[anim];
  return { frame: row * (isoVohon ? ISO_SHEET_COLS : SHEET_COLS) + a.col + Math.min(i, a.ms.length - 1), alpha };
}

/** Số hàng mỗi nửa sheet phụ thể isometric; sheet đủ hai nửa (nam rồi nữ, mục 5.11) cao 2 × ISO_VH_HALF_ROWS khung. */
const ISO_VH_HALF_ROWS = 6;

/**
 * Phụ thể isometric (10.5) có một nửa sheet cho mỗi dáng thân, ghép theo điểm neo của thân mẫu giới đó (mục 5.11: nam hàng 0–4,
 * nữ hàng 6–10, vì tay nữ khép sát người hơn). Trả số khung cần cộng vào khung phụ thể: thân nữ (`hs_body_f_…`, kể cả bộ 32×32 cũ)
 * dùng nửa nữ nếu sheet có đủ hai nửa; sheet cũ / vẽ bằng code: 0.
 */
export function vohonHalf(scene: Phaser.Scene, vohonKey: string, bodyKey: string): number {
  if (!/^hs_body_f_/.test(bodyKey) || !isIsoSheet(scene, vohonKey)) return 0;
  return scene.textures.get(vohonKey).source[0].height >= 2 * ISO_VH_HALF_ROWS * ISO_VH_FRAME ? ISO_VH_HALF_ROWS * ISO_SHEET_COLS : 0;
}

/** Đặt khung lớp áo, tóc (cùng khung) và phụ thể (theo bảng ánh xạ, nửa sheet theo giới) theo khung lớp thân hiện tại. */
export function syncLayers(body: Phaser.GameObjects.Sprite, clothes: Phaser.GameObjects.Sprite[], vohon: Phaser.GameObjects.Sprite[]) {
  const n = Number(body.frame.name), isoBody = isIsoSheet(body.scene, body.texture.key);
  for (const s of clothes) { s.setFrame(n); s.setFlipX(body.flipX); }
  const v = vohon.length ? vohonFrame(n, isoBody, isIsoSheet(body.scene, vohon[0].texture.key)) : null;
  const half = v ? vohonHalf(body.scene, vohon[0].texture.key, body.texture.key) : 0;
  for (const s of vohon) {
    s.setVisible(v !== null).setFlipX(body.flipX);
    if (v) s.setFrame(v.frame + half).setAlpha(v.alpha);
  }
}

const rgb = (c: string) => parseInt(c.slice(1), 16);

/**
 * Hoán màu: tạo texture `{base}@{index}` bằng cách thay đúng các màu của dải `from` (mặc định 4 xám GRAY_RAMP của tóc / áo;
 * lớp thân thì 3 sắc da tông 0, từ 9.9) bằng `ramp` (tối → sáng), giữ nguyên các khung. Không dùng setTint vì phép nhân màu
 * làm mất sắc độ. Chỉ gọi khi có người chơi dùng tổ hợp đó; gọi lại thì dùng texture đã tạo.
 */
export function recolor(scene: Phaser.Scene, base: string, index: number, ramp: readonly string[], from: readonly string[] = GRAY_RAMP): string {
  const key = `${base}@${index}`;
  if (scene.textures.exists(key) || !scene.textures.exists(base)) return key;
  const src = scene.textures.get(base);
  const img = src.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const tex = scene.textures.createCanvas(key, img.width, img.height)!;
  const ctx = tex.getContext();
  ctx.drawImage(img, 0, 0);
  const swap = new Map(from.map((g, i) => [rgb(g), rgb(ramp[i])]));
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
  attachNormal(scene, base, key); // cùng cỡ, cùng hình: dùng normal map của ảnh gốc (10.7)
  return key;
}
