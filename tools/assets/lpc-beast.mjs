// Hình TẠM cho hồn thú thường từ sprite thú LPC (Liberated Pixel Cup) trên OpenGameArt, 0 lượt PixelLab (skill asset-gen mục
// "LPC"). Chỉ cho hồn thú thường có mẫu gần đúng; KHÔNG dùng cho thú vương / boss thế giới (khung 160 / 192) hay hồn sư.
//   node tools/assets/lpc-beast.mjs --src <thư mục gói thú LPC> --out <thư mục> [--species a,b,…] [--desat 0…1] [--credits <file.md>]
//   node tools/assets/lpc-beast.mjs --list            bảng loài ↔ mẫu LPC, gói, giấy phép
//
// Gói thú tải về NGOÀI repo game (thư mục artifact), mỗi gói một thư mục con của --src đúng như đường dẫn `file` trong SPECIES
// (zip giải nén tại chỗ). Chỉ đọc PNG, không chạy gì trong gói. Giấy phép, tác giả, lời ghi công của từng gói lấy từ trang
// OpenGameArt (PACKS, đã soát 2026-10-21); gói chỉ có CC-BY-SA / GPL thì không có mặt ở đây (rắn LPC, LPC Monsters, bò…).
//
// Các bước cho mỗi loài:
//   1. Cắt khung theo lưới của sheet nguồn (`grids`: cỡ khung, góc trên trái; sói có hai lưới: nhìn dọc 32×64, nhìn ngang 64×32).
//   2. Ánh xạ 4 hướng LPC → 5 hướng vẽ (như NPC phụ, lpc-compose.mjs LPC_DIR_ROW): s = xuống, n = lên, se / e / ne = phải;
//      sw / w / nw do client lật. Gói chỉ có hàng "trái" thì lật ngang thành "phải" (`flip`).
//   3. Animation của bố cục hồn thú (ISO_BEAST_ANIMS: idle 4, walk 6, attack 4, hurt 2, die 4): có trong gói thì chọn khung theo
//      thứ tự (thiếu thì lặp, thừa thì chọn đều, khung đầu attack là tư thế báo trước); thiếu thì vẽ bằng code từ khung đứng:
//      idle thở (phần trên dòng lưng nhích 1 pixel), attack lùi 1 rồi lao 3 pixel theo hướng nhìn, hurt lùi 1 / 2 pixel,
//      die ép dẹt dần về dòng chân. Die chỉ có hướng xuống (nhện, dơi) thì dùng cho mọi hướng (`all`).
//   4. Màu: mắt nguồn (`eyes`) thành màu "Mắt" của bảng chung (client vẽ mắt phát sáng theo bậc, không vẽ vào sprite) và ghi
//      điểm mắt từng hướng; màu khác đổi sắc theo loài (`tint`: kéo sắc độ về màu đích, nhân bão hòa / độ sáng), giảm bão hòa
//      (--desat, mặc định DESAT_DEFAULT, recipe `desat` ghi đè) rồi đưa về màu gần nhất của art/palette.gpl + bảng vùng
//      art/palettes/<map>.gpl. Điểm gần đen thành viền #1a1020.
//   5. Phóng số nguyên `scale` (1 hoặc 2, không phóng lẻ), đặt vào khung theo bậc `size` (ISO_BEAST_SIZES, tối đa 128): mỗi hướng
//      dời để giữa hình khung đứng nằm giữa khung và dòng chân thấp nhất chạm gốc (size − ISO_BEAST_FOOT), thú bay nâng `hover`.
//      Viền: điểm mép tối thành #1a1020; điểm mép sáng (LPC thiếu viền) thì thêm viền #1a1020 ngay bên ngoài.
//   6. Ghi khung {hướng}_{animation}_{i}.png vào <out>/<loài>/ rồi pack.mjs ghép <out>/<loài>.png (sheet 20 × 5 khung `size`);
//      <out>/<loài>.json ghi cỡ khung, nguồn, điểm mắt từng hướng; ghi công vào <out>/CREDITS-LPC-BEASTS.md, hoặc mục giữa
//      `<!-- lpc-beast:start -->` / `<!-- lpc-beast:end -->` của --credits (ví dụ art/CREDITS.md khi đưa vào game; chưa có hai
//      dấu thì thêm mục mới ở cuối file).
// Chưa có --game: client chưa tải sheet hồn thú isometric (bước 10.6), nên sheet chỉ để xem thử / duyệt.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, readPng, encodePng, Img, hex, toHex, readGplNamed, OUTLINE, ISO_DIRS, ISO_BEAST_SIZES, ISO_BEAST_FOOT, ISO_BEAST_ANIMS } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 && !!args.splice(i, 1); };
const src = opt("--src", process.env.LPC_BEAST_DIR ?? ""), out = opt("--out", ""), speciesOpt = opt("--species", ""), desatOpt = opt("--desat", "");
const creditsOpt = opt("--credits", ""), list = flag("--list");
const fail = (m) => { console.error(m); process.exit(1); };
if (args.length) fail(`tham số lạ: ${args.join(" ")}`);

/** Giấy phép game dùng được (như lpc-compose.mjs): không bắt ảnh dẫn xuất chia sẻ tương tự. Gói phải có ít nhất một giấy phép này. */
const LICENSE_USE = /^(CC0|CC-BY \d|OGA-BY \d)/;
/** Giảm bão hòa mặc định: LPC tươi hơn nền trầm của game (phong cách A, mục 5.11); hồn thú vẫn nổi hơn nền. */
const DESAT_DEFAULT = 0.3;
/** Khung lớn nhất cho hình tạm: thú vương (160) / boss thế giới (192) không dùng LPC. */
const MAX_SIZE = 128;

// ---------- Gói thú LPC (trang OpenGameArt, đã soát 2026-10-21) ----------
const REDSHRIKE = 'Stephen "Redshrike" Challener (họa sĩ), William.Thompsonj (đặt vẽ)';
const PACKS = {
  wolf: { title: "[LPC] Wolf Animation", url: "https://opengameart.org/content/lpc-wolf-animation", by: REDSHRIKE,
    licenses: ["CC-BY 4.0", "CC-BY 3.0", "GPL 3.0", "GPL 2.0", "OGA-BY 3.0"] },
  spider: { title: "[LPC] Spider", url: "https://opengameart.org/content/lpc-spider", by: REDSHRIKE,
    licenses: ["CC-BY 4.0", "CC-BY 3.0", "GPL 3.0", "GPL 2.0", "OGA-BY 3.0"] },
  animals2022: { title: "[LPC] bears, deer, lions and more", url: "https://opengameart.org/content/lpc-bears-deer-lions-and-more", by: "tapatilorenzo",
    licenses: ["CC-BY 4.0"] },
  animals2022_sevarihk: { title: "[LPC] bears, deer, lions and more (giant rat)", url: "https://opengameart.org/content/lpc-bears-deer-lions-and-more",
    by: "tapatilorenzo, phỏng theo Sevarihk", licenses: ["CC-BY 4.0"], note: "Adapted from work by Sevarihk under CC-BY 4.0 license" },
  boar: { title: "Pigs Rework", url: "https://opengameart.org/content/pigs-rework", by: "Daniel Eddeland (daneeklu), Jordan Irwin (AntumDeluge)",
    licenses: ["CC-BY 3.0"], note: "gốc LPC Style Farm Animals: https://opengameart.org/content/lpc-style-farm-animals" },
  rabbit: { title: "Reorganised LPC rabbit", url: "https://opengameart.org/content/reorganised-lpc-rabbit",
    by: 'Stephen "Redshrike" Challener (đặt vẽ: tebruno99), Evert (sắp lại sheet)', licenses: ["CC-BY 3.0", "CC-BY-SA 3.0", "OGA-BY 3.0"],
    note: "gốc: https://opengameart.org/content/bunny-rabbit-lpc-style-for-pixelfarm" },
  rodent: { title: "Rodents (Rat Rework)", url: "https://opengameart.org/content/rodents-rat-rework", by: "Tuomo Untinen (Reemax), Jordan Irwin (AntumDeluge)",
    licenses: ["CC-BY 3.0", "CC-BY-SA 3.0"] },
  bat: { title: "[LPC] Bat combined/extended", url: "https://opengameart.org/content/lpc-bat-combinedextended", by: "bagzie, bluecarrot16 (Evert chỉnh)",
    licenses: ["OGA-BY 3.0"], note: '"[LPC] Bat extended" by bagzie and bluecarrot16; gốc https://opengameart.org/content/bat-sprite' },
  birds: { title: "[LPC] Birds", url: "https://opengameart.org/content/lpc-birds", by: "bluecarrot16 (đặt vẽ: castelonia)",
    licenses: ["CC-BY 4.0", "CC-BY 3.0", "CC-BY-SA 4.0", "CC-BY-SA 3.0", "GPL 3.0", "GPL 2.0", "OGA-BY 3.0"] },
};
for (const [k, p] of Object.entries(PACKS)) if (!p.licenses.some((l) => LICENSE_USE.test(l))) fail(`gói ${k}: chỉ có ${p.licenses.join(", ")}, cần CC0 / CC-BY / OGA-BY`);

// ---------- Loài ↔ mẫu LPC ----------
// Ô khung: [lưới, hàng, [cột…], "flip"?]. Hướng LPC: down / right / up (thiếu right thì ghi left kèm "flip").
// `stand`: khung đứng mỗi hướng (đặt chân, idle, khung gốc cho animation vẽ bằng code). `tint`: { hue: màu đích, amount 0…1,
// sat, light: hệ số }. `size`: khung theo bậc của vùng sinh (ISO_BEAST_TIER), `scale` 1 | 2, `hover`: thú bay nâng khỏi gốc.
const A22 = "animals2022/lpc animals 2022 v1.1/individual creature spritesheets/";
const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
const SPECIES = {
  // Thánh Hồn Thôn (10–450 năm, khung 64)
  nhu_cot_tho_hoang: { pack: "rabbit", file: "rabbit/rabbit_2.png", map: "thanh_hon_thon", size: 64, scale: 1,
    grids: { g: { fw: 72, fh: 72 } }, tint: { hue: "#c8c0b4", amount: 0.3 },
    stand: { down: ["g", 6, [0]], right: ["g", 7, [0]], up: ["g", 4, [0]] },
    anims: { walk: { down: ["g", 2, [0, 1, 2, 3]], right: ["g", 3, [0, 1, 2, 3]], up: ["g", 0, [0, 1, 2, 3]] },
      idle: { down: ["g", 6, [0, 1, 2, 3]], right: ["g", 7, [0, 1, 2, 3]], up: ["g", 4, [0, 1, 2, 3]] } } },
  dien_thu: { pack: "rodent", file: "rodent/PNG/32x32/rat.png", map: "thanh_hon_thon", size: 64, scale: 1, eyes: ["#e3c48b"],
    grids: { g: { fw: 32, fh: 32 } }, tint: { hue: "#957d57", amount: 0.6, light: 1.25 },
    stand: { down: ["g", 2, [1]], right: ["g", 1, [1]], up: ["g", 0, [1]] },
    anims: { walk: { down: ["g", 2, [0, 1, 2, 1]], right: ["g", 1, [0, 1, 2, 1]], up: ["g", 0, [0, 1, 2, 1]] } } },
  hoi_vu_tuoc: { pack: "birds", file: "birds/bird_3_sparrow.png", map: "thanh_hon_thon", size: 64, scale: 2, hover: 4,
    grids: { g: { fw: 32, fh: 32 } }, tint: { hue: "#646370", amount: 0.7, sat: 0.5 },
    stand: { down: ["g", 6, [0]], right: ["g", 4, [0]], up: ["g", 5, [0]] },
    anims: { walk: { down: ["g", 6, [0, 1, 2]], right: ["g", 4, [0, 1, 2]], up: ["g", 5, [0, 1, 2]] },
      attack: { down: ["g", 2, [0, 1, 2, 1]], right: ["g", 3, [0, 1, 2, 1]], up: ["g", 1, [0, 1, 2, 1]] } } },
  phong_lang_con: { pack: "animals2022", file: A22 + "fox, woods.png", map: "thanh_hon_thon", size: 64, scale: 1,
    grids: { g: { fw: 64, fh: 64 } }, tint: { hue: "#8a87a0", amount: 0.85, sat: 0.45 },
    stand: { down: ["g", 0, [0]], right: ["g", 1, [0]], up: ["g", 3, [0]] },
    anims: { walk: { down: ["g", 0, range(0, 4)], right: ["g", 1, range(0, 4)], up: ["g", 3, range(0, 4)] } } },
  hac_boi_da_tru: { pack: "boar", file: "boar/PNG/64x64/boar.png", map: "thanh_hon_thon", size: 64, scale: 1,
    grids: { g: { fw: 64, fh: 64 } }, tint: { hue: "#4a3a28", amount: 0.5, light: 0.7 },
    stand: { down: ["g", 2, [1]], right: ["g", 1, [1]], up: ["g", 0, [1]] },
    anims: { walk: { down: ["g", 2, [0, 1, 2, 1]], right: ["g", 1, [0, 1, 2, 1]], up: ["g", 0, [0, 1, 2, 1]] } } },
  // Tinh Đấu Ngoại vi (300–2.000 năm; Bìa rừng Vàng → khung 64, từ Khe suối Tím → khung 96)
  // Sói LPC nhìn xuống cao 60 (cả đuôi), không vừa khung 64 khi giữ 1:1 nên đặt khung 96.
  phong_lang: { pack: "wolf", file: "wolf/wolfsheet6_0.png", map: "tinh_dau_ngoai_vi", size: 96, scale: 1,
    grids: { v: { fw: 32, fh: 64 }, h: { fw: 64, fh: 32, x0: 320 } }, eyes: ["#96f0de"], tint: { hue: "#7a8aa8", amount: 0.5, sat: 0.6 },
    stand: { down: ["v", 2, [0]], right: ["h", 3, [0]], up: ["v", 2, [5]] },
    anims: { walk: { down: ["v", 2, range(0, 4)], right: ["h", 3, range(0, 5)], up: ["v", 2, range(5, 9)] },
      attack: { down: ["v", 4, range(0, 5)], right: ["h", 5, range(0, 5)], up: ["v", 4, range(5, 10)] },
      die: { down: ["v", 1, range(0, 4)], right: ["h", 0, range(0, 4)], up: ["v", 1, range(5, 9)] } } },
  tu_van_bao: { pack: "animals2022", file: A22 + "lioness.png", map: "tinh_dau_ngoai_vi", size: 96, scale: 1,
    grids: { g: { fw: 64, fh: 64 } }, tint: { hue: "#5d4380", amount: 0.8, sat: 0.6 },
    stand: { down: ["g", 3, [0]], right: ["g", 1, [0]], up: ["g", 0, [0]] },
    anims: { walk: { down: ["g", 3, range(0, 4)], right: ["g", 1, range(0, 5)], up: ["g", 0, range(0, 4)] } } },
  kim_linh_ung: { pack: "birds", file: "birds/bird_2_eagle.png", map: "tinh_dau_ngoai_vi", size: 96, scale: 2, hover: 6,
    grids: { g: { fw: 32, fh: 32 } }, tint: { hue: "#b8862a", amount: 0.35, sat: 1.1 },
    stand: { down: ["g", 2, [0]], right: ["g", 3, [1]], up: ["g", 1, [0]] },
    anims: { walk: { down: ["g", 2, [0, 1, 2, 1]], right: ["g", 3, [0, 1, 2, 1]], up: ["g", 1, [0, 1, 2, 1]] },
      idle: { down: ["g", 2, [0, 1, 2, 1]], right: ["g", 3, [0, 1, 2, 1]], up: ["g", 1, [0, 1, 2, 1]] } } },
  nhan_dien_ma_chu_non: { pack: "spider", file: "spider/LPC_Spiders/spider05.png", map: "tinh_dau_ngoai_vi", size: 96, scale: 1,
    grids: { g: { fw: 64, fh: 64 } }, tint: { hue: "#5d4380", amount: 0.4 },
    stand: { down: ["g", 2, [0]], right: ["g", 3, [0]], up: ["g", 0, [0]] },
    anims: { walk: { down: ["g", 2, range(4, 10)], right: ["g", 3, range(4, 10)], up: ["g", 0, range(4, 10)] },
      attack: { down: ["g", 2, range(0, 4)], right: ["g", 3, range(0, 4)], up: ["g", 0, range(0, 4)] },
      die: { all: ["g", 4, range(0, 4)] } } },
  liet_trao_hung: { pack: "animals2022", file: A22 + "bear, grizzly.png", map: "tinh_dau_ngoai_vi", size: 96, scale: 1,
    grids: { g: { fw: 64, fh: 64 } }, tint: { hue: "#8f2a14", amount: 0.25, sat: 0.9 },
    stand: { down: ["g", 3, [0]], right: ["g", 1, [0]], up: ["g", 0, [0]] },
    anims: { walk: { down: ["g", 3, range(0, 4)], right: ["g", 1, range(0, 5)], up: ["g", 0, range(0, 4)] },
      attack: { down: ["g", 7, range(0, 4)], right: ["g", 5, [0, 1, 2, 2]], up: ["g", 4, range(0, 4)] },
      die: { down: ["g", 11, range(0, 4)], right: ["g", 9, range(0, 4)], up: ["g", 8, range(0, 4)] } } },
};

if (list) {
  for (const [id, s] of Object.entries(SPECIES)) {
    const p = PACKS[s.pack];
    console.log(`${id.padEnd(22)} ← ${p.title} (${s.file.split("/").pop()}), ${s.size}×${s.size} ×${s.scale}, ${p.licenses.filter((l) => LICENSE_USE.test(l)).join(" / ")}`);
  }
  process.exit(0);
}
if (!src || !out) fail("Cách dùng: lpc-beast.mjs --src <thư mục gói thú LPC> --out <thư mục> [--species a,b,…] [--desat 0…1] [--credits <file.md>] | --list");
const DATA = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
const BEASTS_AT = DATA.indexOf("export const BEASTS"), BEASTS_END = DATA.indexOf("\n];", BEASTS_AT);
if (BEASTS_AT < 0 || BEASTS_END < 0) fail("không tìm thấy khối BEASTS trong shared/data.ts");
const BEAST_IDS = new Set([...DATA.slice(BEASTS_AT, BEASTS_END).matchAll(/\{ id: "([a-z_]+)"/g)].map((m) => m[1]));
const ids = speciesOpt ? speciesOpt.split(",") : Object.keys(SPECIES);
for (const id of ids) {
  if (!SPECIES[id]) fail(`--species ${id}: chưa có mẫu LPC (có: ${Object.keys(SPECIES).join(", ")})`);
  if (!BEAST_IDS.has(id)) fail(`${id}: không có trong BEASTS (shared/data.ts)`);
  const s = SPECIES[id];
  if (!ISO_BEAST_SIZES.includes(s.size) || s.size > MAX_SIZE) fail(`${id}: size ${s.size} phải là ${ISO_BEAST_SIZES.filter((n) => n <= MAX_SIZE).join(" / ")} (thú vương / boss không dùng LPC)`);
  if (![1, 2].includes(s.scale)) fail(`${id}: scale ${s.scale} chỉ 1 hoặc 2 (không phóng lẻ)`);
}
const desatGlobal = desatOpt === "" ? null : +desatOpt;
if (desatGlobal !== null && !(desatGlobal >= 0 && desatGlobal <= 1)) fail(`--desat cần số 0…1 (nhận ${desatOpt})`);

// ---------- Màu ----------
const PAL = readGplNamed();
const EYE = PAL.find((c) => c.name.startsWith("Mắt "))?.hex ?? OUTLINE;
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const NEAR_BLACK = 0.12 * 255, EDGE_DARK = 0.3 * 255;
function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function hsl2rgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v + m)) * 255));
}
/** Kéo sắc độ `h` về `to` một đoạn `t` (đi đường ngắn trên vòng màu). */
const lerpHue = (h, to, t) => { const d = ((to - h + 540) % 360) - 180; return (h + d * t + 360) % 360; };
/** Màu cho phép của loài: bảng chung + bảng nhấn vùng (asset một vùng chỉ dùng hai bảng này, mục 5.11).
 *  Bỏ các màu "Mắt …": chỉ điểm mắt nguồn (`eyes`) thành màu mắt, lông tối không bị snap nhầm thành điểm mắt. */
function paletteOf(map) {
  const f = path.join(ROOT, "art", "palettes", `${map}.gpl`);
  if (!existsSync(f)) fail(`không thấy art/palettes/${map}.gpl`);
  return [...new Set([...PAL, ...readGplNamed(f)].filter((c) => !c.name.startsWith("Mắt ")).map((c) => c.hex))];
}
function nearestIn(pal) {
  const rgb = pal.map(hex), memo = new Map();
  return (p) => {
    const k = toHex(p);
    if (!memo.has(k)) {
      let best = 0, bd = Infinity;
      rgb.forEach((c, i) => { const d = (c[0] - p[0]) ** 2 * 0.3 + (c[1] - p[1]) ** 2 * 0.59 + (c[2] - p[2]) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } });
      memo.set(k, pal[best]);
    }
    return memo.get(k);
  };
}

// ---------- Cắt khung ----------
const sheetCache = new Map();
function sheetOf(file) {
  if (!sheetCache.has(file)) {
    const f = path.join(src, file);
    if (!existsSync(f)) fail(`không thấy ${f} (tải gói về --src, giữ đúng đường dẫn)`);
    sheetCache.set(file, readPng(f));
  }
  return sheetCache.get(file);
}
/** Các khung của một ô `[lưới, hàng, [cột…], "flip"?]`; điểm nửa trong suốt bỏ (alpha 0 / 255). */
function cells(s, spec) {
  const [g, row, cols, flipTag] = spec, G = s.grids[g] ?? fail(`lưới ${g} không có`), sheet = sheetOf(s.file);
  return cols.map((c) => {
    const img = new Img(G.fw, G.fh), x0 = (G.x0 ?? 0) + c * G.fw, y0 = (G.y0 ?? 0) + row * G.fh;
    if (x0 + G.fw > sheet.w || y0 + G.fh > sheet.h) fail(`${s.file}: ô ${g}[${row}, ${c}] ra ngoài sheet ${sheet.w}×${sheet.h}`);
    for (let y = 0; y < G.fh; y++) for (let x = 0; x < G.fw; x++) {
      const p = sheet.get(x0 + x, y0 + y);
      if (p[3] >= 128) img.set(flipTag === "flip" ? G.fw - 1 - x : x, y, [p[0], p[1], p[2], 255]);
    }
    return img;
  });
}
const LPC_OF = { s: "down", se: "right", e: "right", ne: "right", n: "up" };
/** Hướng nhìn trên màn hình của hướng LPC (attack / hurt vẽ bằng code dời theo hướng này). */
const FACING = { down: [0, 1], right: [1, 0], up: [0, -1] };

/** Bbox các điểm có màu: [minX, minY, maxX, maxY] hoặc null. */
function bbox(img) {
  let a = Infinity, b = Infinity, c = -1, d = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y)) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  return c < 0 ? null : [a, b, c, d];
}
function scaleInt(img, k) {
  if (k === 1) return img;
  const o = new Img(img.w * k, img.h * k);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.set(x, y, img.get((x / k) | 0, (y / k) | 0));
  return o;
}
/** Dời cả hình (dx, dy), điểm ra ngoài thì bỏ. */
function moved(img, dx, dy) { const o = new Img(img.w, img.h); o.blit(img, 0, 0, img.w, img.h, dx, dy); return o; }
/** Ép dẹt theo chiều dọc về dòng `foot` (giữ nguyên điểm, không nội suy): hệ số `k` 0…1. */
function squash(img, foot, k) {
  const o = new Img(img.w, img.h);
  for (let y = 0; y <= foot; y++) { const v = Math.round(foot - (foot - y) / k); if (v >= 0 && v < img.h) o.blit(img, 0, v, img.w, 1, 0, y); }
  return o;
}
/** Idle thở: điểm có y ≤ `cut` nhích xuống 1 pixel (chân đứng yên). */
function breathe(img, cut) {
  const o = new Img(img.w, img.h);
  o.blit(img, 0, cut + 1, img.w, img.h - cut - 1, 0, cut + 1);
  o.blit(img, 0, 0, img.w, cut + 1, 0, 1, true);
  return o;
}
/** Chọn `n` khung từ `list` giữ thứ tự vòng lặp (thiếu thì lặp khung, thừa thì chọn đều). */
const pickN = (list, n) => Array.from({ length: n }, (_, i) => list[list.length >= n ? Math.round((i * (list.length - 1)) / Math.max(1, n - 1)) : Math.floor((i * list.length) / n)]);

// ---------- Từng loài ----------
mkdirSync(out, { recursive: true });
const PACK_MJS = path.join(path.dirname(fileURLToPath(import.meta.url)), "pack.mjs");
const used = []; // { id, pack, file }
for (const id of ids) {
  const s = SPECIES[id], size = s.size, foot = size - ISO_BEAST_FOOT - (s.hover ?? 0), cx = size >> 1;
  const pal = paletteOf(s.map), snap = nearestIn(pal), desat = desatGlobal ?? s.desat ?? DESAT_DEFAULT;
  const eyes = new Set((s.eyes ?? []).map((c) => c.toLowerCase()));
  const t = s.tint ?? {}, H = t.hue ? rgb2hsl(hex(t.hue))[0] : null;
  /** Màu một điểm nguồn → màu của game. */
  const recolor = (p) => {
    if (lum(p) < NEAR_BLACK) return OUTLINE;
    if (eyes.has(toHex(p))) return EYE;
    let [h, sa, l] = rgb2hsl(p);
    if (H !== null) h = lerpHue(h, H, t.amount ?? 1);
    sa = Math.min(1, sa * (t.sat ?? 1) * (1 - desat)); l = Math.min(1, l * (t.light ?? 1));
    return snap(hsl2rgb([h, sa, l]));
  };
  const toGame = (img) => {
    const o = new Img(img.w, img.h);
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y)) o.set(x, y, [...hex(recolor(img.get(x, y))), 255]);
    return scaleInt(o, s.scale);
  };
  const frameOf = (spec) => cells(s, spec).map(toGame);
  // Đặt vào khung: mỗi hướng một độ dời theo khung đứng (giữa hình → giữa khung, đáy → dòng chân).
  const place = (img, [dx, dy]) => { const o = new Img(size, size); o.blit(img, 0, 0, img.w, img.h, dx, dy); return o; };
  const shiftOf = {}, standOf = {};
  for (const L of ["down", "right", "up"]) {
    const [st] = frameOf(s.stand[L] ?? fail(`${id}: thiếu stand.${L}`)), b = bbox(st) ?? fail(`${id}: khung đứng ${L} trống`);
    if (b[2] - b[0] + 1 > size || b[3] - b[1] + 1 > size - ISO_BEAST_FOOT - (s.hover ?? 0)) fail(`${id}: hình ${b[2] - b[0] + 1}×${b[3] - b[1] + 1} không vừa khung ${size} (giảm scale hoặc tăng size)`);
    shiftOf[L] = [cx - ((b[0] + b[2] + 1) >> 1), foot - b[3]];
    standOf[L] = place(st, shiftOf[L]);
  }
  const back = (L, k) => [-FACING[L][0] * k, -FACING[L][1] * k];
  /** Khung các animation của hướng LPC `L` (đã đặt vào khung `size`). */
  const animsOf = (L) => {
    const got = (a) => { const sp = s.anims[a]?.[L] ?? s.anims[a]?.all; return sp ? frameOf(sp).map((f) => place(f, shiftOf[L])) : null; };
    const st = standOf[L], b = bbox(st), cut = b[1] + Math.round((b[3] - b[1]) * 0.45);
    const walk = got("walk") ?? [st];
    return {
      idle: got("idle") ? pickN(got("idle"), 4) : [st, breathe(st, cut), breathe(st, cut), st],
      walk: pickN(walk, 6),
      attack: got("attack") ? pickN(got("attack"), 4) : [st, moved(st, ...back(L, 1)), moved(st, ...back(L, -3)), moved(st, ...back(L, -1))],
      hurt: got("hurt") ? pickN(got("hurt"), 2) : [moved(st, ...back(L, 1)), moved(st, ...back(L, 2))],
      die: got("die") ? pickN(got("die"), 4) : [0.85, 0.65, 0.45, 0.3].map((k) => squash(st, foot, k)),
    };
  };
  // Viền: mép tối thành #1a1020, mép sáng (thiếu viền) thêm một điểm #1a1020 bên ngoài.
  const O = [...hex(OUTLINE), 255];
  const outline = (img) => {
    const o = new Img(img.w, img.h, Uint8Array.from(img.data)), N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const empty = (x, y) => x < 0 || y < 0 || x >= img.w || y >= img.h || !img.alpha(x, y);
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      if (!img.alpha(x, y) || !N.some(([u, v]) => empty(x + u, y + v))) continue;
      const p = img.get(x, y);
      if (lum(p) < EDGE_DARK) { o.set(x, y, O); continue; }
      for (const [u, v] of N) if (empty(x + u, y + v) && x + u >= 0 && y + v >= 0 && x + u < img.w && y + v < img.h) o.set(x + u, y + v, O);
    }
    return o;
  };
  const work = path.join(out, id);
  rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true });
  const eyePts = {}, animCache = {};
  for (const d of ISO_DIRS) {
    const L = LPC_OF[d], A = (animCache[L] ??= animsOf(L));
    for (const [anim, [, n]] of Object.entries(ISO_BEAST_ANIMS)) {
      if (A[anim].length !== n) fail(`${id}: ${anim} có ${A[anim].length} khung, cần ${n}`);
      A[anim].forEach((f, i) => writeFileSync(path.join(work, `${d}_${anim}_${i}.png`), encodePng(outline(f))));
    }
    // Điểm mắt (khung đứng) để client vẽ mắt phát sáng theo màu niên hạn (mục 5.11).
    const pts = [], st = standOf[L];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (st.alpha(x, y) && toHex(st.get(x, y)) === EYE && eyes.size) pts.push([x, y]);
    eyePts[d] = pts;
  }
  execFileSync(process.execPath, [PACK_MJS, "--kind", "beast", "--size", String(size), "--out", path.join(out, `${id}.png`), work], { stdio: "inherit" });
  const meta = JSON.stringify({ id, size, scale: s.scale, hover: s.hover ?? 0, map: s.map, desat, source: s.file, pack: s.pack }, null, 1);
  writeFileSync(path.join(out, `${id}.json`), `${meta.slice(0, -2)},\n "eyes": ${JSON.stringify(eyePts)}\n}\n`);
  // Số điểm mắt mỗi hướng để soát (loài không khai `eyes` phải là 0).
  console.log(`[lpc-beast] ${id}: điểm mắt ${ISO_DIRS.map((d) => `${d} ${eyePts[d].length}`).join(", ")}`);
  used.push({ id, pack: s.pack, file: s.file });
}

// ---------- Ghi công ----------
const START = "<!-- lpc-beast:start -->", END = "<!-- lpc-beast:end -->";
const HEAD = ["| Key | Tác giả | Giấy phép của gói (game dùng giấy phép in đậm) | Nguồn, thay đổi |", "|---|---|---|---|"];
const rows = used.map(({ id, pack, file }) => {
  const p = PACKS[pack], pick = p.licenses.find((l) => LICENSE_USE.test(l));
  return `| \`beast_${id}\` (hình tạm) | ${p.by} | ${p.licenses.map((l) => (l === pick ? `**${l}**` : l)).join(", ")} | [${p.title}](${p.url}), file \`${file.split("/").pop()}\`; đổi màu, giảm bão hòa, viền, xếp lại 5 hướng isometric${p.note ? `; ${p.note}` : ""} |`;
});
const target = creditsOpt || path.join(out, "CREDITS-LPC-BEASTS.md");
let doc = existsSync(target) ? readFileSync(target, "utf8") : "";
const nS = doc.split(START).length - 1, nE = doc.split(END).length - 1;
if (nS > 1 || nS !== nE || (nS && doc.indexOf(END) < doc.indexOf(START))) fail(`${target}: cần đúng một cặp ${START} … ${END} (đang có ${nS} start, ${nE} end)`);
if (!nS) doc = `${doc}${doc && !doc.endsWith("\n") ? "\n" : ""}\n## Hồn thú: hình tạm từ thú LPC (OpenGameArt)\nVùng này do \`tools/assets/lpc-beast.mjs\` ghi, không sửa tay.\n\n${START}\n${END}\n`;
// Chạy lại thì thay dòng của loài vừa làm, giữ dòng của loài khác.
const old = doc.slice(doc.indexOf(START) + START.length, doc.indexOf(END)).split("\n").filter((l) => /^\| `beast_/.test(l));
const keep = old.filter((l) => !used.some((u) => l.startsWith(`| \`beast_${u.id}\``)));
const merged = [...HEAD, ...[...keep, ...rows].sort()].join("\n");
doc = doc.slice(0, doc.indexOf(START) + START.length) + "\n" + merged + "\n" + doc.slice(doc.indexOf(END));
writeFileSync(target, doc);
console.log(`[lpc-beast] ${used.length} loài → ${out}; ghi công ${target}`);
