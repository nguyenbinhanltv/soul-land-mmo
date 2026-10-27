// Thư viện dùng chung cho dây chuyền asset (tools/assets/*): đọc/ghi PNG, bảng màu, quy cách 5.11.
// Không phụ thuộc thư viện ngoài (chỉ node:zlib) để chạy được trong `npm run check` mà không cần cài gì.
import { inflateSync, deflateSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const SPRITES = path.join(ROOT, "shared", "assets", "sprites");
export const MANIFEST = path.join(SPRITES, "manifest.json");

// ---------- Quy cách GAME_DESIGN.md mục 5.11 (khớp client/src/sprites.ts) ----------
export const SHEET_COLS = 16, SHEET_ROWS = 4;
export const HS_FRAME = 32, VH_FRAME = 48;
/** Gốc tại chân: hồn sư (16,30), phụ thể (24,38). */
export const HS_ORIGIN = [16, 30], VH_ORIGIN = [24, 38];
/** Viền ngoài; trong lớp tóc/áo là màu thứ 5 được phép, không bị hoán màu. */
export const OUTLINE = "#1a1020";
/** Dải 4 xám chuẩn (tối → sáng) của lớp tóc và áo. */
export const GRAY_RAMP = ["#3a3a3a", "#6a6a6a", "#9a9a9a", "#cacaca"];
/** Hồn thú theo bậc: rộng × cao (một hàng 13 khung, hướng phải). */
export const BEAST_FRAMES = [[16, 16], [32, 32], [48, 32], [48, 48], [64, 64]];
export const BEAST_COLS = 13;
/** Cột bắt đầu và số khung của từng animation hồn sư; hàng 0–2 = xuống, phải, lên. */
export const HS_ANIMS = { idle: [0, 2], walk: [2, 4], attack: [6, 3], cast: [9, 3], hurt: [12, 1], die: [13, 3] };
export const DIRS = ["down", "right", "up"];

// ---------- Isometric (Giai đoạn 10, GAME_DESIGN.md mục 5.11) ----------
// Dây chuyền normalize → pack → normal → validate dùng các hằng dưới đây (từ bước 10.3). Bộ 32×32 / 48×48 ở trên chỉ còn để
// validate kiểm các key cũ chưa có "iso": true trong manifest (client dùng tới 10.4–10.6).
/**
 * Bề ngang thoi của MỘT ô logic (16×16 pixel thế giới), mục 5.11: đã chốt thoi 32×16 (người dùng duyệt 2026-10-21).
 * Phải khớp hằng chiếu ở client/src/iso.ts; mọi cỡ khác ở tools/assets suy ra từ hằng này.
 * Ô lớn phủ 2×2 ô logic có bề ngang 2 × ISO_TILE_W.
 */
export const ISO_TILE_W = 32;
/** Bề dày đáy ô / bề ngang thoi, đo trên ô PixelLab "thin tile" (size 32: đáy 5, size 64: đáy khoảng 11–12). */
export const ISO_TILE_THICK = 0.17;
/**
 * Ảnh ô nền cho thoi bề ngang W: ảnh W×W, thoi W×W/2 nằm sát đáy ảnh trừ phần đáy dày `thick`
 * (W = 32: tâm mặt trên (16, 19), đáy 5; W = 64: tâm (32, 37), đáy 11, khớp ô PixelLab size 32 / 64).
 */
export function isoTileImage(W) {
  const thick = Math.round(W * ISO_TILE_THICK);
  return { size: [W, W], center: [W / 2, W - W / 4 - thick], thick };
}
/** Hồn sư 64×64 gốc tại chân (32,58); phụ thể 96×96 gốc (48,74). */
export const ISO_HS_FRAME = 64, ISO_HS_ORIGIN = [32, 58], ISO_VH_FRAME = 96, ISO_VH_ORIGIN = [48, 74];
/** Khung vuông hồn thú: Trắng / Vàng 64, Tím / Đen 96, Đỏ 128, thú vương 160, boss thế giới 192; gốc giữa đáy, cách mép dưới ISO_BEAST_FOOT. */
export const ISO_BEAST_SIZES = [64, 96, 128, 160, 192], ISO_BEAST_FOOT = 8;
/** Khung hồn thú theo bậc TIERS (0 Trắng, 1 Vàng → 64; 2 Tím, 3 Đen → 96; 4 Đỏ → 128). Thú vương, boss: `--size 160 / 192`. */
export const ISO_BEAST_TIER = [0, 0, 1, 1, 2].map((i) => ISO_BEAST_SIZES[i]);

/** 5 hướng vẽ theo thứ tự hàng 0–4 của sheet; 3 hướng còn lại lật ngang (ISO_FLIP). */
export const ISO_DIRS = ["s", "se", "e", "ne", "n"];
/** Hướng lật → hướng vẽ được lật ngang (cho mọi lớp cùng lúc). */
export const ISO_FLIP = { sw: "se", w: "e", nw: "ne" };
/** 8 hướng theo vòng kim đồng hồ từ `s` (thứ tự xem thử của preview.mjs). */
export const ISO_DIRS8 = ["s", "sw", "w", "nw", "n", "ne", "e", "se"];
/** Tên hướng của PixelLab (`rotations/south-east.png`) → hướng ngắn. */
export const PIXELLAB_DIRS = { south: "s", "south-east": "se", east: "e", "north-east": "ne", north: "n", "north-west": "nw", west: "w", "south-west": "sw" };
/** Sheet hồn sư: 24 cột × 6 hàng; [cột bắt đầu, số khung]; hàng 5 cột 0–1 là `absorb` (hướng s). Phụ thể: 24 × 12 (ISO_VH_SEXES). */
export const ISO_HS_COLS = 24, ISO_HS_ROWS = 6;
export const ISO_HS_ANIMS = { idle: [0, 4], walk: [4, 6], attack: [10, 4], cast: [14, 3], hurt: [17, 2], die: [19, 4] };
export const ISO_ABSORB = 2;
/** Lớp phụ thể chỉ vẽ các animation này (cột 0–16 của hàng 0–4); hurt / die / absorb do client ánh xạ. */
export const ISO_VH_ANIMS = ["idle", "walk", "attack", "cast"];
/**
 * Sheet phụ thể gồm một nửa cho mỗi dáng thân (giới): nửa i là hàng i × ISO_HS_ROWS … + 4 (nam hàng 0–4, nữ hàng 6–10), cùng bố cục
 * cột với sheet hồn sư; mỗi nửa ghép theo điểm neo của thân giới đó (tay nữ khép sát người hơn tay nam), client chọn theo lớp thân.
 */
export const ISO_VH_SEXES = ["m", "f"];
/** Sheet hồn thú: 20 cột × 5 hàng (5 hướng vẽ). */
export const ISO_BEAST_COLS = 20, ISO_BEAST_ROWS = 5;
export const ISO_BEAST_ANIMS = { idle: [0, 4], walk: [4, 6], attack: [10, 4], hurt: [14, 2], die: [16, 4] };
/**
 * Pháp tướng Võ Hồn Chân Thân (mục 5.18, #482): sheet `phaptuong/<mã võ hồn>.png`, khung 160×160, gốc (80, 124) trùng chân hồn sư (ISO_HS_ORIGIN).
 * 5 hàng hướng (s, se, e, ne, n; sw / w / nw lật), 16 cột: idle 8 (vòng "thở"), attack 8 (đánh / niệm). Ảnh chỉ alpha 0 / 255 (như mọi sheet);
 * độ đục hư ảnh PT_GHOST (và 70% ở lớp trước) do client áp lúc vẽ, ghi ở `pt` của manifest. Viền sáng màu `col` 2 điểm (điểm ngoài dithering).
 * Mỗi sheet tối đa PT_MAX_COLORS màu (bảng riêng từng võ hồn, như chân dung). Điểm alpha ≤ PT_ALPHA_MIN của khung nguồn bị bỏ.
 */
export const PT_FRAME = 160, PT_ORIGIN = [80, 124], PT_COLS = 16, PT_ANIMS = { idle: [0, 8], attack: [8, 8] }, PT_GHOST = 0.88, PT_ALPHA_MIN = 40, PT_MAX_COLORS = 48;
/** pack --code (hurt / die / absorb vẽ bằng code, mục 5.11): dòng hông mặc định trong khung 64, độ hạ thân khi khuỵu / ngồi,
 *  nửa bề ngang người đứng (để đặt người nằm chạm đất). */
export const ISO_HIP = 40, ISO_KNEEL = 6, ISO_SIT = 10, ISO_LIE_HALF = 10;
/** Góc vung (độ, chiều kim đồng hồ trên màn hình) của vũ khí phụ thể ở 4 khung `attack`: lấy đà, vung, trúng, thu về. */
export const ISO_ATTACK_SWING = [-25, -55, 45, 15];

/**
 * Bố cục sheet isometric theo loại (mục 5.11): `honsu`, `vohon`, `beast` (cần `size`, một cỡ trong ISO_BEAST_SIZES).
 * Trả { kind, frame, origin, cols, rows, anims, cells: ô có thể vẽ "hàng,cột", required: [[hàng, cột]…], cellOf(tên khung) }.
 * Tên khung: `{hướng}_{animation}_{i}` (hướng ISO_DIRS), hồn sư thêm `absorb_{i}`.
 */
export function isoLayout(kind, size) {
  let frame, origin, cols, rows, anims;
  if (kind === "honsu" || kind === "vohon") {
    frame = kind === "honsu" ? ISO_HS_FRAME : ISO_VH_FRAME; origin = kind === "honsu" ? ISO_HS_ORIGIN : ISO_VH_ORIGIN;
    cols = ISO_HS_COLS; rows = kind === "honsu" ? ISO_HS_ROWS : ISO_HS_ROWS * ISO_VH_SEXES.length;
    anims = kind === "honsu" ? ISO_HS_ANIMS : Object.fromEntries(ISO_VH_ANIMS.map((a) => [a, ISO_HS_ANIMS[a]]));
  } else if (kind === "phaptuong") {
    frame = PT_FRAME; origin = PT_ORIGIN; cols = PT_COLS; rows = ISO_DIRS.length; anims = PT_ANIMS;
  } else if (kind === "beast") {
    if (!ISO_BEAST_SIZES.includes(size)) throw new Error(`hồn thú cần khung ${ISO_BEAST_SIZES.join(" / ")} (nhận ${size})`);
    frame = size; origin = [size >> 1, size - ISO_BEAST_FOOT]; cols = ISO_BEAST_COLS; rows = ISO_BEAST_ROWS; anims = ISO_BEAST_ANIMS;
  } else throw new Error(`loại không hợp lệ: ${kind}`);
  const required = [];
  const halves = kind === "vohon" ? ISO_VH_SEXES.map((_, k) => k * ISO_HS_ROWS) : [0];
  for (const r0 of halves) for (let r = 0; r < ISO_DIRS.length; r++) for (const [c0, n] of Object.values(anims)) for (let i = 0; i < n; i++) required.push([r0 + r, c0 + i]);
  if (kind === "honsu") for (let i = 0; i < ISO_ABSORB; i++) required.push([ISO_DIRS.length, i]);
  const cellOf = (name) => {
    let m = name.match(/^([a-z]+)_([a-z]+)_(\d+)$/);
    if (m && ISO_DIRS.includes(m[1]) && anims[m[2]]) return { row: ISO_DIRS.indexOf(m[1]), col: anims[m[2]][0], n: anims[m[2]][1], dir: m[1], anim: m[2], i: +m[3] };
    m = name.match(/^absorb_(\d+)$/);
    if (m && kind === "honsu") return { row: ISO_DIRS.length, col: 0, n: ISO_ABSORB, dir: "s", anim: "absorb", i: +m[1] };
    return null;
  };
  return { kind, frame: [frame, frame], origin, cols, rows, anims, required, cells: new Set(required.map((c) => c.join(","))), cellOf };
}

/** Đổi tên hướng PixelLab ở đầu tên file sang hướng ngắn: `south-east_walk_0` → `se_walk_0`; tên chỉ có hướng → `{hướng}_idle_0`. */
export function shortDirName(name) {
  const m = name.match(/^(south-east|south-west|north-east|north-west|south|north|east|west|s|se|e|ne|n|nw|w|sw)(_.*)?$/);
  if (!m) return name;
  const d = PIXELLAB_DIRS[m[1]] ?? m[1];
  return m[2] ? d + m[2] : `${d}_idle_0`;
}
/** Chân dung võ hồn (giao diện HTML): khung vuông, tối đa PORTRAIT_MAX_COLORS màu mỗi ảnh (không theo bảng chung). */
export const ISO_PORTRAIT = 64, PORTRAIT_MAX_COLORS = 32;
/** Chân dung NPC trong hộp thoại (giao diện HTML): khung vuông, cùng luật màu với chân dung võ hồn. */
export const ISO_NPC_PORTRAIT = 112;
/** Chân dung hồn thú `thu_<loài>` ở khung mục tiêu (giao diện HTML, #339): khung vuông, nền trong suốt, cùng luật màu với chân dung. */
export const ISO_BEAST_PORTRAIT = 64;
/** Biểu tượng vật phẩm trong ô túi đồ (giao diện HTML): khung vuông, nền trong suốt, cùng luật màu với chân dung. */
export const ISO_ITEM_ICON = 32;
/** Biểu tượng hồn kỹ `skill_<mã võ hồn | chung>_<chỉ số vòng 0..9>` (thanh kỹ năng, #384): khung vuông 32, nền ngoài khung tròn trong suốt. */
export const ISO_SKILL_ICON = 32;
/** Biểu tượng trạng thái (hiệu ứng trên hồn thú / hồn sư, giao diện HTML): khung vuông, nền trong suốt. */
export const ISO_STATUS_ICON = 24;
/** Huy hiệu hệ võ hồn (giao diện HTML, góc thẻ võ hồn): khung vuông, nền trong suốt, một biểu tượng lớn trên tròn màu hệ. */
export const ISO_HE_ICON = 24;
/** Khung thẻ võ hồn (rộng × cao), cửa sổ chân dung trong suốt; chân dung ISO_PORTRAIT đặt phía trên cửa sổ. */
export const ISO_CARD = [96, 152];
/** Vật đứng isometric: khung bội của ISO_PROP_STEP (nửa thoi ô logic), chân giữa đáy cách mép dưới ISO_PROP_FOOT. */
export const ISO_PROP_STEP = ISO_TILE_W / 2, ISO_PROP_FOOT = 2;

// ---------- Giấy phép asset ngoài (GAME_DESIGN.md mục 5.11 "Nguồn và giấy phép") ----------
/**
 * Giấy phép đã biết, ghi như CREDITS.csv của LPC / trang OpenGameArt ("CC0", "CC-BY 4.0", "CC-BY-SA 3.0", "OGA-BY 3.0+",
 * "GPL 3.0", "CC-BY-NC 4.0", "OGA-SA 3.0"…; CC / OGA ghi không kèm số phiên bản như "CC-BY" vẫn đọc được). Mọi giấy phép đã biết đều dùng được; giấy phép lạ, trống, ND (cấm sửa, mà công cụ
 * luôn sửa ảnh) thì công cụ dừng. OGA-SA (OpenGameArt Share-Alike, lớp LPC `neck/scarf`, `torso/clothes/corset`) gắn cờ SA.
 */
export const LICENSE_KNOWN = /^(CC0|CC-BY(-NC)?(-SA)?( \d(\.\d)?\+?)?|OGA-(BY|SA)( \d(\.\d)?\+?)?|GPL \d(\.\d)?\+?)$/;
/** Cờ nghĩa vụ của một giấy phép: SA / GPL (bản đã sửa theo đúng giấy phép đó), NC (chỉ dùng khi game phi thương mại). */
export const licenseFlags = (l) => [/-SA\b/.test(l) && "SA", /^GPL\b/.test(l) && "GPL", /-NC\b/.test(l) && "NC"].filter(Boolean);
const licenseRank = (l) => { const f = licenseFlags(l); return (f.includes("NC") ? 3 : 0) + (f.includes("SA") ? 1 : 0) + (f.includes("GPL") ? 2 : 0); };
/**
 * Asset có nhiều giấy phép (ví dụ "OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0") thì game dùng theo nhóm ít ràng buộc nhất:
 * CC0 / CC-BY / OGA-BY < CC-BY-SA < GPL < NC. Trả { use: giấy phép game dùng theo, flags: cờ của nhóm đó }.
 */
export function licenseUse(licenses) {
  const min = Math.min(...licenses.map(licenseRank)), use = licenses.filter((l) => licenseRank(l) === min);
  return { use, flags: [...new Set(use.flatMap(licenseFlags))] };
}

// ---------- Màu ----------
export const hex = (c) => { const n = parseInt(c.replace("#", ""), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export const toHex = ([r, g, b]) => "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

/** Đọc art/palette.gpl → mảng { hex, name }. */
export function readGplNamed(file = path.join(ROOT, "art", "palette.gpl")) {
  const out = [];
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s*(.*)$/);
    if (m) out.push({ hex: toHex([+m[1], +m[2], +m[3]]), name: m[4].trim() });
  }
  return out;
}
/** Đọc art/palette.gpl → mảng hex. */
export const readGpl = (file) => readGplNamed(file).map((c) => c.hex);
/** Màu trong palette.gpl có tên bắt đầu bằng `prefix` (ví dụ "Da " → 3 sắc da tối, gốc, sáng). */
export const paletteGroup = (prefix) => readGplNamed().filter((c) => c.name.startsWith(prefix)).map((c) => c.hex);

/** Đọc `col`/`robe` của VOHON và `col`/`glow` của TIERS từ shared/data.ts (không chép số ra chỗ khác). */
export function readDataColors() {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
  const pick = (re) => [...src.matchAll(re)].map((m) => m[1].toLowerCase());
  // VOHON khai báo bằng vh("id", …, col, robe, trait): col/robe là hai mã màu liền nhau đầu tiên sau id.
  const vohon = [...src.matchAll(/vh\("[a-z_]+"[\s\S]*?"(#[0-9a-fA-F]{6})",\s*"(#[0-9a-fA-F]{6})"/g)].flatMap((m) => [m[1], m[2]].map((c) => c.toLowerCase()));
  // TIERS ghi theo tên trường: col (thân vòng) và glow (viền sáng).
  return { vohon, tiers: [...pick(/\bcol:\s*"(#[0-9a-fA-F]{6})"/g), ...pick(/\bglow:\s*"(#[0-9a-fA-F]{6})"/g)] };
}

/** Mã NPC trong NPCS (shared/data.ts): mục có `id`, `name`, `title` liền nhau. */
export function npcIds() {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
  return new Set([...src.matchAll(/\bid: "([a-z_]+)", name: "[^"]*", title: "/g)].map((m) => m[1]));
}

/** Mã loài trong BEASTS (shared/data.ts): tên file chân dung hồn thú `thu_<loài>`. */
export function beastIds() {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8"), i = src.indexOf("export const BEASTS");
  return new Set(i < 0 ? [] : [...src.slice(i, src.indexOf("];", i)).matchAll(/\bid: "([a-z_]+)"/g)].map((m) => m[1]));
}

/** Mã hệ võ hồn trong HE_IDS (shared/data.ts): tên file huy hiệu hệ. */
export function heIds() {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8"), i = src.indexOf("export const HE_IDS");
  return new Set(i < 0 ? [] : [...src.slice(i, src.indexOf("];", i)).matchAll(/"([a-z_]+)"/g)].map((m) => m[1]));
}

/** Mã trạng thái / buff trong game (STATUS_IDS, BUFF_IDS, BEAST_BUFF_IDS): tên file biểu tượng trạng thái. */
export function statusIds() {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8"), ids = new Set();
  for (const name of ["STATUS_IDS", "BUFF_IDS", "BEAST_BUFF_IDS"]) {
    const i = src.indexOf(`export const ${name} = [`);
    if (i >= 0) for (const m of src.slice(i, src.indexOf("] as const", i)).matchAll(/"([a-z_]+)"/g)) ids.add(m[1]);
  }
  return ids;
}

/** Id ô (EQUIP_SLOTS) và id bậc (EQUIP_TIERS) của trang bị hồn sư, đọc từ shared/data.ts theo đúng thứ tự khai báo. */
export function equipSlotTierIds() {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
  const block = (name) => { const i = src.indexOf(`export const ${name}`); return i < 0 ? "" : src.slice(i, src.indexOf("\n];", i)); };
  const ids = (name) => [...block(name).matchAll(/\bid: "([a-z_]+)"/g)].map((m) => m[1]);
  return { slots: ids("EQUIP_SLOTS"), tiers: ids("EQUIP_TIERS") };
}

/**
 * Mã biểu tượng vật phẩm hợp lệ: id trong ITEMS (mục có `id`, `kind` liền nhau), nhóm trong ITEM_KINDS (biểu tượng chung
 * của nhóm, ví dụ `hon_hach`, `manh_vo_hon`) và `hon_cot_<vị trí>` theo BONE_SLOTS.
 */
export function itemIconIds() {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
  const ids = new Set([...src.matchAll(/\bid: "([a-z_]+)",\s*kind: "/g)].map((m) => m[1]));
  // Mã khai báo bằng hằng (id: AUTO_TOKEN, ...): tra `export const AUTO_TOKEN = "uy_thac_lenh"`.
  for (const m of src.matchAll(/\bid: ([A-Z][A-Z_]+),\s*kind: "/g)) { const c = src.match(new RegExp(`export const ${m[1]} = "([a-z_]+)"`)); if (c) ids.add(c[1]); }
  const k0 = src.indexOf("export const ITEM_KINDS"), kinds = src.slice(k0, src.indexOf("};", k0));
  for (const m of kinds.matchAll(/^\s*([a-z_]+): \{/gm)) ids.add(m[1]);
  const start = src.indexOf("export const BONE_SLOTS"), bones = src.slice(start, src.indexOf("];", start));
  for (const m of bones.matchAll(/\bid: "([a-z_]+)"/g)) ids.add(`hon_cot_${m[1]}`);
  // Hồn hạch theo bộ (#696): `hon_hach_<bộ>` theo CORE_SETS.
  const c0 = src.indexOf("export const CORE_SETS"), cores = src.slice(c0, src.indexOf("\n];", c0));
  for (const m of cores.matchAll(/^\s*\{ id: "([a-z_]+)"/gm)) ids.add(`hon_hach_${m[1]}`);
  // Trang bị hồn sư (E0, mục 5.15): `equip_<mẫu>`, `equip_slot_<ô>`, `equip_frame_<bậc>`; nguyên liệu (EQUIP_STONES, EQUIP_CHARM…) theo mã.
  const block = (name, end) => { const i = src.indexOf(`export const ${name}`); return i < 0 ? "" : src.slice(i, src.indexOf(end, i)); };
  const { slots, tiers } = equipSlotTierIds();
  for (const s of slots) { ids.add(`equip_slot_${s}`); for (const t of tiers) ids.add(`equip_${s}_${t}`); }
  for (const t of tiers) ids.add(`equip_frame_${t}`);
  for (const m of block("EQUIP_STONES", "\n];").matchAll(/\bid: "([a-z_0-9]+)"/g)) ids.add(m[1]);
  for (const c of ["EQUIP_CHARM", "EQUIP_ESSENCE", "EQUIP_SOUL"]) { const m = src.match(new RegExp(`export const ${c} = "([a-z_]+)"`)); if (m) ids.add(m[1]); }
  return ids;
}

/** Mã võ hồn có hồn kỹ riêng trong VOHON_SKILLS (shared/data.ts) cộng `chung` (bảng SKILLS): tên file biểu tượng hồn kỹ `skill_<mã>_<vòng>`. */
export function skillIconIds() {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8"), i = src.indexOf("export const VOHON_SKILLS:");
  const ids = new Set(i < 0 ? [] : [...src.slice(i, src.indexOf("export const skillsOf", i)).matchAll(/^  ([a-z_]+): \[\s*$/gm)].map((m) => m[1]));
  ids.add("chung");
  return ids;
}

/** `col` và `robe` của một võ hồn trong VOHON (shared/data.ts), hoặc null nếu không có id đó. */
export function vohonColors(id) {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
  const m = src.match(new RegExp(`vh\\("${id}"[\\s\\S]*?"(#[0-9a-fA-F]{6})",\\s*"(#[0-9a-fA-F]{6})"`));
  return m ? [m[1].toLowerCase(), m[2].toLowerCase()] : null;
}

/** Một sắc tối và một sắc sáng suy ra từ màu gốc (cho phép theo 5.11). */
export function shadesOf(c) {
  const [r, g, b] = hex(c);
  const dark = toHex([r, g, b].map((v) => Math.round(v * 0.62)));
  const light = toHex([r, g, b].map((v) => Math.round(v + (255 - v) * 0.45)));
  return [dark, light];
}

/** Màu nhấn của mọi vùng / giao diện (art/palettes/*.gpl, phong cách B, C, D ở mục 5.11). */
export function accentColors() {
  const dir = path.join(ROOT, "art", "palettes");
  return new Set(readdirSync(dir).filter((f) => f.endsWith(".gpl")).flatMap((f) => readGpl(path.join(dir, f))));
}

/** Bảng màu cho phép: palette.gpl + col/robe võ hồn (kèm 1 tối, 1 sáng) + màu hồn hoàn. */
export function allowedColors() {
  const set = new Set(readGpl());
  const { vohon, tiers } = readDataColors();
  for (const c of vohon) { set.add(c); for (const s of shadesOf(c)) set.add(s); }
  for (const c of tiers) set.add(c);
  return set;
}

// ---------- PNG ----------
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/** Ảnh RGBA trong bộ nhớ. */
export class Img {
  constructor(w, h, data) { this.w = w; this.h = h; this.data = data ?? new Uint8Array(w * h * 4); }
  idx(x, y) { return (y * this.w + x) * 4; }
  get(x, y) { const i = this.idx(x, y), d = this.data; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; }
  set(x, y, [r, g, b, a]) { const i = this.idx(x, y), d = this.data; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a; }
  alpha(x, y) { return this.data[this.idx(x, y) + 3]; }
  /** Chép vùng (sx,sy,w,h) của `src` vào (dx,dy), bỏ qua điểm trong suốt nếu `over`. */
  blit(src, sx, sy, w, h, dx, dy, over = false) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = dx + x, Y = dy + y, u = sx + x, v = sy + y;
      if (X < 0 || Y < 0 || X >= this.w || Y >= this.h || u < 0 || v < 0 || u >= src.w || v >= src.h) continue;
      const p = src.get(u, v);
      if (over && p[3] === 0) continue;
      this.set(X, Y, p);
    }
  }
}

export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error("Không phải PNG");
  let pos = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0, plte = null, trns = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), name = buf.toString("ascii", pos + 4, pos + 8), body = buf.subarray(pos + 8, pos + 8 + len);
    if (name === "IHDR") { w = body.readUInt32BE(0); h = body.readUInt32BE(4); depth = body[8]; type = body[9]; interlace = body[12]; }
    else if (name === "PLTE") plte = body;
    else if (name === "tRNS") trns = body;
    else if (name === "IDAT") idat.push(body);
    else if (name === "IEND") break;
    pos += 12 + len;
  }
  if (interlace) throw new Error("PNG interlace chưa hỗ trợ");
  if (depth === 16 || (depth < 8 && type !== 3 && type !== 0)) throw new Error(`PNG bit depth ${depth} chưa hỗ trợ`);
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const raw = inflateSync(Buffer.concat(idat));
  const bitsPP = ch * depth, stride = Math.ceil((w * bitsPP) / 8), bpp = Math.max(1, bitsPP >> 3);
  const px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride), prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0, b = prev ? prev[i] : 0, c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[i] = v & 255;
    }
  }
  const img = new Img(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const row = px.subarray(y * stride);
    let r, g, b, al = 255;
    if (depth < 8) {
      const bit = x * depth, v = (row[bit >> 3] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
      if (type === 3) { r = plte[v * 3]; g = plte[v * 3 + 1]; b = plte[v * 3 + 2]; al = trns && v < trns.length ? trns[v] : 255; }
      else { r = g = b = Math.round((v * 255) / ((1 << depth) - 1)); }
    } else {
      const i = x * ch;
      if (type === 0) { r = g = b = row[i]; }
      else if (type === 4) { r = g = b = row[i]; al = row[i + 1]; }
      else if (type === 2) { r = row[i]; g = row[i + 1]; b = row[i + 2]; }
      else if (type === 6) { r = row[i]; g = row[i + 1]; b = row[i + 2]; al = row[i + 3]; }
      else { const v = row[i]; r = plte[v * 3]; g = plte[v * 3 + 1]; b = plte[v * 3 + 2]; al = trns && v < trns.length ? trns[v] : 255; }
    }
    img.set(x, y, [r, g, b, al]);
  }
  return img;
}

function chunk(name, body) {
  const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
  const nb = Buffer.concat([Buffer.from(name, "ascii"), body]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(nb));
  return Buffer.concat([len, nb, crc]);
}

/** Ghi PNG RGBA 8 bit (điểm trong suốt chuẩn hóa về 0,0,0,0 để file ổn định). */
export function encodePng(img) {
  const { w, h, data } = img, stride = w * 4, raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < stride; x += 4) {
      const s = y * stride + x, d = y * (stride + 1) + 1 + x;
      if (data[s + 3] === 0) continue;
      raw[d] = data[s]; raw[d + 1] = data[s + 1]; raw[d + 2] = data[s + 2]; raw[d + 3] = data[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIG, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

export const readPng = (file) => decodePng(readFileSync(file));

// ---------- Key ↔ đường dẫn, khung (khớp sheetSpec trong client/src/sprites.ts) ----------
/** Ba lớp của một bộ hồn sư giới × kiểu tóc (mục 5.11): `hs_body_m_2`, `hs_outfit_m_2`, `hs_hair_m_2` tách từ cùng một hình. */
export const HS_LAYERS = ["body", "outfit", "hair"];
/**
 * Trả về { file, frame:[w,h], kind } cho một key manifest, hoặc null nếu key sai quy ước.
 * Hồn sư thêm `set` = "{giới}_{kiểu tóc}" (ví dụ "f_2").
 * `iso` (manifest ghi `"iso": true`): hồn sư, phụ thể, hồn thú theo bố cục isometric của isoLayout, kèm `layout` (hồn thú theo
 * loài cần `frame` vuông); chân dung `portrait_*`, vật đứng `prop_*`, NPC `npc_*`, vật phẩm `item_*`, trạng thái `status_*`,
 * huy hiệu hệ `he_*`, mảnh giao diện `ui_*`, khung thẻ `card_*` và hiệu ứng `fx_*` (cần `frame` vuông) chỉ có dạng isometric.
 * `ui_the_*` để dành cho `card_*` (cùng thư mục iso/ui).
 * `stat` (manifest ghi `"static": true`, chỉ với `beast_*` isometric): sheet tĩnh 3 khung (nam, đông, bắc) của hồn thú lai.
 */
export function sheetSpec(key, frame, iso = false, stat = false) {
  let m;
  if (iso) {
    const spec = (file, layout, extra = {}) => ({ file, frame: layout.frame, size: [layout.frame[0] * layout.cols, layout.frame[1] * layout.rows], kind: layout.kind, layout, iso: true, ...extra });
    if ((m = key.match(/^hs_((?:body|outfit|hair)_([mf]_\d+))$/))) return spec(`honsu/${m[1]}.png`, isoLayout("honsu"), { set: m[2] });
    if ((m = key.match(/^vh_([a-z_]+_[bf])$/))) return spec(`vohon/${m[1]}.png`, isoLayout("vohon"));
    if ((m = key.match(/^pt_([a-z_]+)$/))) return spec(`phaptuong/${m[1]}.png`, isoLayout("phaptuong"));
    if ((m = key.match(/^b(\d)$/)) && ISO_BEAST_TIER[+m[1]]) return spec(`beast/${key}.png`, isoLayout("beast", frame?.[0] ?? ISO_BEAST_TIER[+m[1]]));
    // Hồn thú lai (#386): sheet tĩnh 3 khung nam / đông / bắc (ISO_STATIC_DIRS), chuyển động vẽ bằng code ở client; manifest ghi `"static": true`.
    // Hoạt ảnh vẽ thật (#688): `beast_<loài>_anim`, 6 cột × 20 hàng (5 hướng × 4 dải, beast-sheet-cut.mjs); bảng màu riêng từng loài như sheet tĩnh.
    if ((m = key.match(/^beast_([a-z_]+)_anim$/)) && frame && frame[0] === frame[1] && ISO_BEAST_SIZES.includes(frame[0])) return { file: `beast/${key.slice(6)}.png`, frame, size: [frame[0] * 6, frame[1] * 20], kind: "beast", iso: true, static: true, anim: true };
    if (stat && (m = key.match(/^beast_([a-z_]+)$/)) && frame && frame[0] === frame[1] && ISO_BEAST_SIZES.includes(frame[0])) return { file: `beast/${m[1]}.png`, frame, size: [frame[0] * 3, frame[1]], kind: "beast", iso: true, static: true };
    if ((m = key.match(/^beast_([a-z_]+)$/)) && frame && frame[0] === frame[1] && ISO_BEAST_SIZES.includes(frame[0])) return spec(`beast/${m[1]}.png`, isoLayout("beast", frame[0]));
    // NPC phụ / dân thường ghép từ LPC (lpc-compose --game): bố cục sheet hồn sư 24 × 6, đã tô màu (không hoán màu), một lớp.
    if ((m = key.match(/^lpc_([a-z0-9_]+)$/))) return spec(`iso/lpc/${m[1]}.png`, isoLayout("honsu"), { kind: "lpc" });
    // Hiệu ứng (lpc-item.mjs): dải một hàng khung vuông `frame` (manifest ghi), giữ màu gốc của gói như chân dung.
    if ((m = key.match(/^fx_([a-z0-9_]+)$/)) && frame && frame[0] === frame[1]) return { file: `iso/fx/${m[1]}.png`, frame, kind: "fx", iso: true };
    if (!/^(portrait|prop|npc|item|status|he|ui|card|thu|skill|gi)_/.test(key)) return null; // chân dung, vật đứng, NPC, vật phẩm, trạng thái, hệ, giao diện, chân dung hồn thú, biểu tượng hồn kỹ: luôn isometric, khớp ở dưới
  }
  if ((m = key.match(/^hs_((?:body|outfit|hair)_([mf]_\d+))$/))) return { file: `honsu/${m[1]}.png`, frame: [HS_FRAME, HS_FRAME], size: [HS_FRAME * SHEET_COLS, HS_FRAME * SHEET_ROWS], kind: "honsu", set: m[2] };
  if ((m = key.match(/^vh_([a-z_]+_[bf])$/))) return { file: `vohon/${m[1]}.png`, frame: [VH_FRAME, VH_FRAME], size: [VH_FRAME * SHEET_COLS, VH_FRAME * SHEET_ROWS], kind: "vohon" };
  if ((m = key.match(/^b(\d)$/)) && BEAST_FRAMES[+m[1]]) { const f = frame ?? BEAST_FRAMES[+m[1]]; return { file: `beast/${key}.png`, frame: f, size: [f[0] * BEAST_COLS, f[1]], kind: "beast" }; }
  if ((m = key.match(/^beast_([a-z_]+)$/)) && frame) return { file: `beast/${m[1]}.png`, frame, size: [frame[0] * BEAST_COLS, frame[1]], kind: "beast" };
  if (/^ring\d$/.test(key)) return { file: `ring/${key}.png`, kind: "ring" };
  if (/^halo\d$/.test(key)) return { file: `ring/${key}.png`, frame: [24, 10], kind: "ring" };
  // Asset isometric (manifest ghi "iso": true; client chưa tải, bước 10.2 / 10.8 dùng): chân dung võ hồn, NPC, vật phẩm, vật đứng.
  if ((m = key.match(/^portrait_([a-z_]+)$/))) return { file: `iso/portrait/${m[1]}.png`, size: [ISO_PORTRAIT, ISO_PORTRAIT], kind: "portrait", iso: true };
  if ((m = key.match(/^status_([a-z_]+)$/))) return { file: `iso/status/${m[1]}.png`, size: [ISO_STATUS_ICON, ISO_STATUS_ICON], kind: "portrait", iso: true, status: m[1] };
  if ((m = key.match(/^he_([a-z_]+)$/))) return { file: `iso/he/${m[1]}.png`, size: [ISO_HE_ICON, ISO_HE_ICON], kind: "portrait", iso: true, he: m[1] };
  if ((m = key.match(/^card_(sr|ssr|ur)$/))) return { file: `iso/ui/the_${m[1]}.png`, size: ISO_CARD, kind: "portrait", iso: true };
  if ((m = key.match(/^ui_(?!the_)([a-z0-9_]+)$/))) return { file: `iso/ui/${m[1]}.png`, kind: "portrait", iso: true };
  if ((m = key.match(/^gi_([a-z0-9_]+)$/))) return { file: `iso/gi/${m[1]}.png`, size: [ISO_SKILL_ICON, ISO_SKILL_ICON], kind: "portrait", iso: true }; // game-icons.net (#625): Chân Thân, dung hợp, menu HUD
  if ((m = key.match(/^item_([a-z0-9_]+)$/))) return { file: `iso/item/${m[1]}.png`, size: [ISO_ITEM_ICON, ISO_ITEM_ICON], kind: "portrait", iso: true, item: m[1] };
  if ((m = key.match(/^npc_([a-z_]+)$/))) return { file: `iso/npc/${m[1]}.png`, size: [ISO_NPC_PORTRAIT, ISO_NPC_PORTRAIT], kind: "portrait", iso: true, npc: m[1] };
  if ((m = key.match(/^thu_([a-z_]+)$/))) return { file: `iso/thu/${m[1]}.png`, size: [ISO_BEAST_PORTRAIT, ISO_BEAST_PORTRAIT], kind: "portrait", iso: true, beast: m[1] };
  if ((m = key.match(/^skill_([a-z_]+)_(\d)$/))) return { file: `iso/skill/${m[1]}_${m[2]}.png`, size: [ISO_SKILL_ICON, ISO_SKILL_ICON], kind: "portrait", iso: true, skill: m[1] };
  if ((m = key.match(/^prop_([a-z_]+)$/))) return { file: `iso/props/${m[1]}.png`, kind: "prop", iso: true };
  return null;
}

// ---------- Điểm neo phụ thể (mục 5.11 "Phụ thể ghép theo điểm neo") ----------
/**
 * Đọc (và gỡ khỏi `args`) các tham số `--body <giới>:<thân.png>,<áo.png>,<tóc.png>` của pack / vohon-part (`--body <…>` không ghi
 * giới là giới đầu của ISO_VH_SEXES). Trả Map giới → { fig: ảnh gộp các lớp, skin: lớp thân (dò màu da), w, h } theo thứ tự ISO_VH_SEXES.
 */
export function vohonBodies(args) {
  const got = new Map();
  for (let i = args.indexOf("--body"); i >= 0; i = args.indexOf("--body")) {
    const [, v] = args.splice(i, 2), m = v?.match(/^([a-z]):(.+)$/), sex = m ? m[1] : ISO_VH_SEXES[0];
    if (!ISO_VH_SEXES.includes(sex)) throw new Error(`--body: giới ${sex} không thuộc ${ISO_VH_SEXES.join(", ")}`);
    const sheets = (m ? m[2] : v).split(",").map((f) => readPng(f)), fig = new Img(sheets[0].w, sheets[0].h);
    for (const s of sheets) fig.blit(s, 0, 0, s.w, s.h, 0, 0, true);
    got.set(sex, { fig, skin: sheets[0], w: fig.w, h: fig.h });
  }
  return new Map(ISO_VH_SEXES.filter((x) => got.has(x)).map((x) => [x, got.get(x)]));
}
/** Điểm neo `pack --kind vohon --attach`: tay (mảng da), đỉnh đầu, giữa lưng, chân. */
export const ANCHORS = ["hand", "head", "back", "feet"];
/** Phần trên cùng của hình (theo chiều cao) tính là đầu: mảng da trong đó là mặt, không phải tay. */
export const HEAD_ZONE = 0.3;
/** Đầu mút mảng da thấp hơn tỉ lệ này của chiều cao hình là bàn chân (dép, chân trần), không phải tay. */
export const HAND_ZONE = 0.8;

/**
 * Điểm neo trên một khung thân (vùng x0, y0, w, h của ảnh `fig` gộp thân + áo + tóc; `skin` là ảnh lớp thân, mặc định `fig`):
 * head = giữa hàng trên cùng; back = trọng tâm phần thân trên (dưới vùng đầu tới giữa người); feet = giữa hàng dưới cùng;
 * hands = các mảng màu da (3 sắc "Da " của palette.gpl) dưới vùng đầu và trên vùng chân (HAND_ZONE), mỗi mảng { x, y, n }:
 *   đầu mút của mảng (trung bình các điểm xa giữa lưng nhất, vì tay trần thì cả cánh tay là một mảng da) và số điểm.
 * Trả null nếu khung trống.
 */
export function frameAnchors(fig, x0, y0, w, h, skin = fig) {
  let top = h, bottom = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (fig.alpha(x0 + x, y0 + y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  if (bottom < 0) return null;
  const rowMid = (y) => { let s = 0, n = 0; for (let x = 0; x < w; x++) if (fig.alpha(x0 + x, y0 + y)) { s += x; n++; } return n ? s / n + 0.5 : w / 2; };
  const headEnd = top + Math.round((bottom - top + 1) * HEAD_ZONE), midEnd = top + Math.round((bottom - top + 1) * 0.55);
  let bx = 0, by = 0, bn = 0;
  for (let y = headEnd; y < midEnd; y++) for (let x = 0; x < w; x++) if (fig.alpha(x0 + x, y0 + y)) { bx += x + 0.5; by += y + 0.5; bn++; }
  const tones = new Set(paletteGroup("Da "));
  const isSkin = (x, y) => skin.alpha(x0 + x, y0 + y) && tones.has(toHex(skin.get(x0 + x, y0 + y)));
  const back = bn ? { x: bx / bn, y: by / bn } : { x: rowMid(headEnd), y: headEnd }, footEnd = top + (bottom - top + 1) * HAND_ZONE;
  const seen = new Uint8Array(w * h), hands = [];
  for (let y = headEnd; y < h; y++) for (let x = 0; x < w; x++) {
    if (seen[y * w + x] || !isSkin(x, y)) continue;
    const stack = [[x, y]], pts = []; seen[y * w + x] = 1;
    while (stack.length) {
      const [u, v] = stack.pop(); pts.push([u + 0.5, v + 0.5]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const U = u + dx, V = v + dy;
        if (U >= 0 && V >= headEnd && U < w && V < h && !seen[V * w + U] && isSkin(U, V)) { seen[V * w + U] = 1; stack.push([U, V]); }
      }
    }
    if (pts.length < 2) continue;
    const far = Math.max(...pts.map(([u, v]) => Math.hypot(u - back.x, v - back.y)));
    const tip = pts.filter(([u, v]) => Math.hypot(u - back.x, v - back.y) >= far - 1.5);
    const hand = { x: tip.reduce((a, p) => a + p[0], 0) / tip.length, y: tip.reduce((a, p) => a + p[1], 0) / tip.length, n: pts.length };
    if (hand.y < footEnd) hands.push(hand);
  }
  return { head: { x: rowMid(top), y: top }, back, feet: { x: rowMid(bottom), y: bottom + 1 }, hands, mid: rowMid(midEnd) };
}

// ---------- Lượng tử normal map (#975) ----------
/** Số bit mỗi kênh mặc định của normal map `_n.png`: 32 mức/kênh nén tốt hơn ~55–60% mà Light2D không thấy khác. */
export const NORMAL_BITS = 5;
/** Làm tròn một kênh về lưới `bits` bit (bước 2^(8−bits)), giữ đúng 128 (pháp tuyến phẳng) và 255 (z hướng thẳng ra màn hình). */
export function quantChannel(v, bits = NORMAL_BITS) {
  if (bits >= 8) return v;
  const step = 1 << (8 - bits);
  return v >= 255 - step / 2 ? 255 : Math.min(Math.round(v / step) * step, 256 - step);
}
/** Lượng tử tại chỗ RGB của các điểm có alpha > 0 (điểm trong suốt giữ nguyên, encodePng ghi 0). Trả lại `img`. */
export function quantizeNormal(img, bits = NORMAL_BITS) {
  if (bits >= 8) return img;
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { d[i] = quantChannel(d[i], bits); d[i + 1] = quantChannel(d[i + 1], bits); d[i + 2] = quantChannel(d[i + 2], bits); }
  return img;
}
/** Sai số góc (độ) giữa pháp tuyến của hai normal map cùng cỡ, chỉ tính điểm có alpha > 0: { mean, max, n }. */
export function normalAngleError(a, b) {
  const unit = (d, i) => { const x = d[i] / 127.5 - 1, y = d[i + 1] / 127.5 - 1, z = d[i + 2] / 127.5 - 1, l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  let sum = 0, max = 0, n = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (!a.data[i + 3]) continue;
    const p = unit(a.data, i), q = unit(b.data, i), deg = Math.acos(Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2])) * 180 / Math.PI;
    sum += deg; n++; if (deg > max) max = deg;
  }
  return { mean: n ? sum / n : 0, max, n };
}
