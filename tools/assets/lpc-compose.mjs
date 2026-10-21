// Ghép NPC phụ (dân thường, lính gác…) từ Universal LPC Spritesheet Character Generator (xem skill asset-gen mục "Nguồn LPC").
// Không dùng cho hồn sư người chơi (bộ giới × kiểu tóc vẽ bằng PixelLab, phong cách LPC lệch).
//   node tools/assets/lpc-compose.mjs --lpc <repo LPC> --out <thư mục> --npc truong_thon|thuong_nhan|tho_ren|linh_gac
//   node tools/assets/lpc-compose.mjs --lpc <repo LPC> --out <thư mục> --recipe <công thức.json>
//   node tools/assets/lpc-compose.mjs --lpc <repo LPC> --game --recipe art/src/lpc/<tên>.json   (đưa vào game, xem bước 7)
//   tùy chọn: [--hair-col N] [--outfit-col N] [--skin N] [--desat 0…1] [--credits <file.md>]
//
// Repo LPC (https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) tải về NGOÀI repo game;
// chỉ đọc PNG trong `spritesheets/` và `CREDITS.csv`, không chạy code của repo đó.
//
// Quy cách LPC (đã soát trên repo, 2026-10-21): mỗi lớp là một thư mục, mỗi animation một PNG khung 64×64, hàng 0–3 =
// nhìn lên / trái / xuống / phải (`hurt` chỉ 1 hàng, nhìn xuống). Số khung: walk 9 (khung 0 đứng), slash 6, spellcast 7,
// hurt 6 (ngã nằm), thrust 8, shoot 13, idle 2. Lớp có màu sẵn nằm ở `<thư mục>/<animation>/<màu>.png`, lớp màu gốc ở
// `<thư mục>/<animation>.png` (tóc, thân, quần… repo hoán màu lúc chạy; ở đây hoán theo dải màu của game).
//
// Các bước:
//   1. Chồng các lớp theo zPos (như định nghĩa trong `sheet_definitions/`), ghi lại điểm nhìn thấy cuối cùng thuộc nhóm nào
//      (body / outfit / hair), nên 3 lớp tách ra chồng lại đúng như ảnh gộp (tóc sau gáy z9 không đè lên thân).
//   2. Màu: mỗi lớp tóc / áo đưa về dải 4 xám chuẩn (GRAY_RAMP, hoặc một đoạn của dải theo `ramp`) theo hạng độ sáng các
//      màu của lớp đó trên cả bộ; da của lớp thân / đầu về 3 sắc da tông 0 (SKIN_TONES[0]), mắt lam về màu "Mắt"; lớp thân
//      có `ramp` (giày) về dải đó; còn lại (lòng trắng mắt) về màu gần nhất của bảng chung. Lớp `keep` (giáp, mũ sắt, tạp
//      dề) giữ màu gốc, giảm bão hòa theo --desat (mặc định DESAT_DEFAULT, NPC phụ không nổi hơn hồn sư) rồi đưa về bảng
//      chung, không hoán màu. Màu giữ nguyên không lấy dải xám hay dải da tông 0 (client hoán các màu đó). Màu gần đen và
//      điểm mép hình (giáp điểm trong suốt) thành viền `#1a1020`.
//   3. Ánh xạ 4 hướng LPC → 5 hướng vẽ của game (LPC_DIR_ROW): s = xuống, n = lên, e / se / ne = phải (hai chéo nông lệch
//      26,6° so với phương ngang nên gần ngang hơn, cùng quy tắc `legacyDir` của client/src/iso.ts); sw / w / nw do client
//      lật se / e / ne như mọi bộ isometric. Hàng "trái" của LPC không dùng.
//   4. Chọn khung LPC → bố cục sheet hồn sư 24 × 6 (LPC_FRAMES): idle từ khung đứng của walk (pack --breathe), walk 6 / 8,
//      attack 4 / 6 khung slash, cast 3 / 7 khung spellcast; hurt 2, die 4 lấy từ hurt LPC cho hướng s, các hướng khác và
//      absorb vẽ bằng code (pack --code). Dời cả nhân vật để chân (đáy thân, khung đứng nhìn xuống) chạm gốc ISO_HS_ORIGIN.
//   5. Ghi khung `{hướng}_{animation}_{i}.png` vào <out>/<tên>/{body,outfit,hair}/ rồi gọi pack.mjs --set ghi
//      <out>/{body,outfit,hair}_<tên>.png (3 lớp xám để client hoán màu như phương án (b) mục 5.11), kèm
//      <out>/<tên>_mau.png đã tô màu tóc / áo / da (xem thử).
//   6. Ghi công: mỗi file LPC đã đọc tra đúng mục của nó trong CREDITS.csv (tác giả, giấy phép, URL; file màu
//      `<thư mục>/<animation>/<màu>.png` tra `<thư mục>/<animation>.png`), không có thì dừng. Nhận mọi giấy phép đã biết
//      (LICENSE_KNOWN của lib.mjs; giấy phép lạ / trống thì dừng). Lớp nhiều giấy phép thì game dùng theo nhóm ít ràng buộc
//      nhất (licenseUse); lớp chỉ có SA / GPL / NC thì gắn cờ, sheet ghép có lớp SA / GPL thì cả file theo giấy phép đó. Ghi bảng vào
//      <out>/CREDITS-LPC.md, hoặc vào mục LPC giữa hai dấu `<!-- lpc:start -->` / `<!-- lpc:end -->` của file `--credits`
//      (ví dụ art/CREDITS.md khi đưa ảnh vào game; thiếu / thừa dấu thì dừng trước khi ghi).
//   7. --game (NPC phụ / dân thường vào game, mục 5.11 "NPC phụ và dân thường"): NPC phụ không đổi màu theo người chơi nên
//      chỉ cần bản đã tô màu. Ghi bản tô màu thành sheet `lpc_<tên>` (shared/assets/sprites/iso/lpc/<tên>.png), sinh normal
//      map (normal.mjs), thêm key vào manifest.json ("iso": true) và ghi công vào art/CREDITS.md; lớp xám và thư mục làm việc
//      để ở thư mục tạm (hoặc --out). Màu tóc / áo khi --game: `hairRamp` / `outfitRamp` của công thức (4 màu của
//      art/palette.gpl, chọn dải trầm như "Đất trầm", "Đá trầm"), không có thì dải HAIR_COLORS / OUTFIT_COLORS giảm bão hòa
//      theo --desat rồi đưa về màu gần nhất của bảng chung.
//
// Công thức (--recipe, tên = tên file; hoặc RECIPES dựng sẵn bên dưới): { "sex": "male"|"female", "hairCol", "outfitCol",
//   "skin", "base"?: true, "hairRamp"?: [4 màu], "outfitRamp"?: [4 màu], "layers": [{ "dir": "hair/spiked/adult/", "z": 120,
//   "group": "hair", "variant"?: "white", "keep"?: true, "ramp"?: [0, 1, 2] | ["#3a2a18", …] }] }. `dir` lấy đúng cột
//   layer_N của sheet_definitions theo thể hình; `z` là zPos của lớp đó; `ramp` là chỉ số GRAY_RAMP (tóc / áo) hoặc mã màu
//   (lớp thân không phải da như giày; lớp áo / tóc khi --game: màu cuối cùng, không qua hoán màu). `base`: thêm sẵn thân,
//   đầu, giày của thể hình (như công thức dựng sẵn).
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, SPRITES, MANIFEST, readPng, encodePng, Img, hex, toHex, readGplNamed, GRAY_RAMP, OUTLINE, HS_LAYERS, ISO_DIRS, ISO_HS_FRAME, ISO_HS_ORIGIN, LICENSE_KNOWN, licenseUse } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 && !!args.splice(i, 1); };
const lpc = opt("--lpc", process.env.LPC_DIR ?? ""), npc = opt("--npc", ""), recipeFile = opt("--recipe", ""), game = flag("--game");
const outOpt = opt("--out", ""), out = outOpt || (game ? mkdtempSync(path.join(os.tmpdir(), "lpc-")) : "");
const hairColOpt = opt("--hair-col", ""), outfitColOpt = opt("--outfit-col", ""), skinOpt = opt("--skin", ""), desatOpt = opt("--desat", "");
const creditsFile = opt("--credits", "") || (game ? path.join(ROOT, "art", "CREDITS.md") : "");
const fail = (m) => { console.error(m); process.exit(1); };
if (!lpc || !out || [npc, recipeFile].filter(Boolean).length !== 1)
  fail("Cách dùng: lpc-compose.mjs --lpc <repo LPC> (--out <thư mục> | --game) (--npc <tên> | --recipe <file.json>) [--hair-col N] [--outfit-col N] [--skin N] [--desat 0…1] [--credits <file.md>]");
if (args.length) fail(`tham số lạ: ${args.join(" ")}`);
const SHEETS = path.join(lpc, "spritesheets");
if (!existsSync(SHEETS) || !existsSync(path.join(lpc, "CREDITS.csv"))) fail(`--lpc ${lpc}: không thấy spritesheets/ và CREDITS.csv`);

// ---------- Quy cách LPC → game ----------
const LPC_FRAME = 64;
/** Hàng của từng hướng trong sheet LPC. */
const LPC_ROW = { up: 0, left: 1, down: 2, right: 3 };
/** Hướng vẽ của game (ISO_DIRS) → hàng LPC: chéo nông se / ne về ngang (như legacyDir ở client/src/iso.ts). */
const LPC_DIR_ROW = { s: LPC_ROW.down, se: LPC_ROW.right, e: LPC_ROW.right, ne: LPC_ROW.right, n: LPC_ROW.up };
/** Animation game ← (file LPC, các khung LPC chọn). `only`: chỉ hướng đó (hurt LPC chỉ có 1 hàng nhìn xuống). */
const LPC_FRAMES = {
  idle: { file: "walk", frames: [0] }, // 3 khung thở còn lại do pack --breathe
  walk: { file: "walk", frames: [1, 2, 4, 5, 7, 8] },
  attack: { file: "slash", frames: [1, 2, 3, 5] }, // khung 0 của slash trùng khung đứng ở vài hướng
  cast: { file: "spellcast", frames: [1, 3, 5] },
  hurt: { file: "hurt", frames: [1, 2], only: "s", row: 0 },
  die: { file: "hurt", frames: [2, 3, 4, 5], only: "s", row: 0 },
};
/** Giảm bão hòa mặc định cho màu giữ nguyên (lớp `keep`): LPC màu tươi, NPC phụ không được nổi hơn hồn sư. */
const DESAT_DEFAULT = 0.5;

// ---------- Màu của game (shared/data.ts, art/palette.gpl) ----------
const DATA = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
/** Các dải `ramp: [...]` của một mảng SwatchDef / SkinDef trong shared/data.ts. */
function ramps(constName) {
  const i = DATA.indexOf(`export const ${constName}`);
  if (i < 0) fail(`không thấy ${constName} trong shared/data.ts`);
  return [...DATA.slice(i, DATA.indexOf("];", i)).matchAll(/ramp: \[([^\]]+)\]/g)].map((m) => [...m[1].matchAll(/#[0-9a-fA-F]{6}/g)].map((c) => c[0].toLowerCase()));
}
const HAIR_RAMPS = ramps("HAIR_COLORS"), OUTFIT_RAMPS = ramps("OUTFIT_COLORS"), SKIN_RAMPS = ramps("SKIN_TONES");
const PAL = readGplNamed();
const EYE = PAL.find((c) => c.name.startsWith("Mắt "))?.hex ?? OUTLINE;
// Màu giữ nguyên (lớp `keep`, lòng trắng mắt) không được rơi vào dải xám hoán màu (client tô theo màu áo / tóc) hay dải da
// tông 0 SKIN_TONES[0] (client tô các điểm của lớp thân như da khi người chơi / NPC chọn tông da khác).
const KEEP_PAL = PAL.map((c) => c.hex).filter((c) => !GRAY_RAMP.includes(c) && !SKIN_RAMPS[0].includes(c)), KEEP_RGB = KEEP_PAL.map(hex);
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const nearest = (p) => {
  let best = 0, bd = Infinity;
  KEEP_RGB.forEach((c, i) => { const d = (c[0] - p[0]) ** 2 * 0.3 + (c[1] - p[1]) ** 2 * 0.59 + (c[2] - p[2]) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } });
  return KEEP_PAL[best];
};

// ---------- Công thức dựng sẵn ----------
const HEAD = { male: "head/heads/human/male/", female: "head/heads/human/female/" };
/** Giày nâu (quy ước màu khóa của lớp thân, skill asset-gen): 3 sắc gỗ / đất của bảng chung. */
const palHex = (...names) => names.map((n) => PAL.find((c) => c.name.startsWith(n + " #"))?.hex ?? fail(`art/palette.gpl thiếu màu "${n}"`));
const base = (sex) => [
  { dir: `body/bodies/${sex}/`, z: 10, group: "body" },
  { dir: HEAD[sex], z: 100, group: "body" },
  { dir: `feet/shoes/basic/${sex === "male" ? "male" : "thin"}/`, z: 15, group: "body", ramp: palHex("Gỗ tối", "Gỗ gốc", "Đất") },
];
/**
 * Áo kiểu phương Đông: nam áo dài tay + đai obi + quần; nữ kimono + đai obi (LPC chỉ có kimono / robe / tunic cho thân nữ).
 * `ramp` chỉ số dải xám: quần và đai tối hơn áo để lớp áo một màu vẫn tách khối.
 */
const OUTFIT = {
  male: [
    { dir: "legs/pants/male/", z: 20, group: "outfit", ramp: [0, 1, 2] },
    { dir: "torso/clothes/longsleeve/longsleeve/male/", z: 35, group: "outfit", ramp: [1, 2, 3] },
    { dir: "torso/waist/obi/male/", z: 65, group: "outfit", variant: "charcoal", ramp: [0, 1] },
  ],
  female: [
    { dir: "dress/kimono/normal/universal/female/", z: 30, group: "outfit", variant: "white" },
    { dir: "torso/waist/obi/thin/", z: 65, group: "outfit", variant: "charcoal", ramp: [0, 1] },
  ],
};
/** NPC phụ thử (looks lấy theo NPCS: Lão Kiệt Khắc, Thương nhân, Thợ rèn; lính gác chưa có trong NPCS). Tóc chọn lớp không cờ (có CC0 / CC-BY / OGA-BY). */
const RECIPES = {
  truong_thon: { sex: "male", hairCol: 3, outfitCol: 2, layers: [...base("male"), ...OUTFIT.male,
    { dir: "head/heads/human/male_elderly/", z: 101, group: "body" }, { dir: "hair/balding/adult/", z: 120, group: "hair" },
    { dir: "beards/beard/winter/male/", z: 110, group: "hair" }] },
  thuong_nhan: { sex: "female", hairCol: 1, outfitCol: 1, layers: [...base("female"), ...OUTFIT.female, { dir: "hair/bob/adult/", z: 120, group: "hair" }] },
  tho_ren: { sex: "male", hairCol: 1, outfitCol: 5, layers: [...base("male"), ...OUTFIT.male, { dir: "hair/buzzcut/adult/", z: 120, group: "hair" },
    { dir: "torso/aprons/apron/male/", z: 40, group: "outfit", variant: "leather", keep: true }] },
  linh_gac: { sex: "male", hairCol: 0, outfitCol: 0, layers: [...base("male"), OUTFIT.male[0],
    { dir: "torso/armour/legion/male/", z: 60, group: "outfit", keep: true }, { dir: "hat/helmet/legion/adult/", z: 130, group: "hair", keep: true },
    { dir: "feet/boots/basic/male/", z: 25, group: "body" }] },
};
const name = npc || path.basename(recipeFile, ".json");
if (!/^[a-z][a-z0-9_]*$/.test(name)) fail(`tên ${name}: chỉ chữ thường, số, "_" (key lpc_<tên>)`);
let R;
if (npc) R = RECIPES[npc] ?? fail(`--npc: ${Object.keys(RECIPES).join(", ")} (nhận ${npc})`);
else R = JSON.parse(readFileSync(recipeFile, "utf8"));
R = { hairCol: 0, outfitCol: 0, skin: 0, ...R };
if (!["male", "female"].includes(R.sex)) fail(`sex: "male" hoặc "female" (nhận ${R.sex})`);
if (R.base) R.layers = [...base(R.sex), ...R.layers];
// Dải màu riêng của công thức: đúng 4 màu, màu nào cũng phải có trong art/palette.gpl.
const PAL_HEX = new Set(PAL.map((c) => c.hex));
for (const k of ["hairRamp", "outfitRamp"]) if (R[k]) {
  R[k] = R[k].map((c) => String(c).toLowerCase());
  if (R[k].length !== 4 || R[k].some((c) => !PAL_HEX.has(c))) fail(`${k}: cần 4 màu của art/palette.gpl (nhận ${R[k].join(", ")})`);
}
for (const l of R.layers) for (const c of l.ramp ?? []) {
  if (typeof c === "string" && !PAL_HEX.has(c.toLowerCase())) fail(`${l.dir}: ramp ${c} không có trong art/palette.gpl`);
  // Lớp áo / tóc ghi mã màu thẳng: màu đó không được là dải xám, kẻo bước tô màu đổi nó thành màu áo / tóc.
  if (typeof c === "string" && l.group !== "body" && GRAY_RAMP.includes(c.toLowerCase())) fail(`${l.dir}: ramp ${c} trùng dải xám hoán màu`);
}
if (hairColOpt) R.hairCol = +hairColOpt;
if (outfitColOpt) R.outfitCol = +outfitColOpt;
if (skinOpt) R.skin = +skinOpt;
const inRange = (v, list) => Number.isInteger(v) && v >= 0 && v < list.length;
if (!inRange(R.hairCol, HAIR_RAMPS)) fail(`hairCol ${R.hairCol} ngoài 0…${HAIR_RAMPS.length - 1} (HAIR_COLORS)`);
if (!inRange(R.outfitCol, OUTFIT_RAMPS)) fail(`outfitCol ${R.outfitCol} ngoài 0…${OUTFIT_RAMPS.length - 1} (OUTFIT_COLORS)`);
if (!inRange(R.skin, SKIN_RAMPS)) fail(`skin ${R.skin} ngoài 0…${SKIN_RAMPS.length - 1} (SKIN_TONES)`);
const desat = desatOpt ? +desatOpt : DESAT_DEFAULT;
if (!(desat >= 0 && desat <= 1)) fail(`--desat cần số 0…1 (nhận ${desatOpt})`);
/** Kéo màu về xám cùng độ sáng theo tỉ lệ `desat` (0 = giữ nguyên, 1 = xám hẳn). */
const desaturate = (p) => { const L = lum(p); return [0, 1, 2].map((k) => p[k] + (L - p[k]) * desat); };
// File ghi công: đọc và soát dấu mục LPC trước khi ghi ảnh (thiếu `lpc:end` thì dừng, không ghi chữ "undefined" vào file).
const START = "<!-- lpc:start -->", END = "<!-- lpc:end -->";
const creditsTarget = creditsFile || path.join(out, "CREDITS-LPC.md");
const creditsDoc = existsSync(creditsTarget) ? readFileSync(creditsTarget, "utf8") : "";
const nStart = creditsDoc.split(START).length - 1, nEnd = creditsDoc.split(END).length - 1;
if (nStart > 1 || nStart !== nEnd || (nStart && creditsDoc.indexOf(END) < creditsDoc.indexOf(START)))
  fail(`${creditsTarget}: cần đúng một cặp ${START} … ${END} theo thứ tự (đang có ${nStart} start, ${nEnd} end)`);
// Mã màu trong `ramp` của lớp thân (giày) không được trùng dải da tông 0, kẻo client hoán thành da.
for (const l of R.layers) if (l.group === "body") for (const c of l.ramp ?? [])
  if (typeof c === "string" && SKIN_RAMPS[0].includes(c.toLowerCase())) fail(`${l.dir}: ramp ${c} trùng SKIN_TONES[0], client sẽ hoán thành da`);

// ---------- Đọc lớp LPC, ghi công ----------
const used = new Map(); // file tương đối → { dir, variant, c: mục CREDITS }
const credits = parseCsv(readFileSync(path.join(lpc, "CREDITS.csv"), "utf8"));
function parseCsv(src) {
  const rows = new Map();
  for (const line of src.split(/\r?\n/).slice(1)) {
    const cells = [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"'));
    if (cells.length >= 5) rows.set(cells[0], { file: cells[0], notes: cells[1], authors: cells[2], licenses: cells[3].split(",").map((s) => s.trim()).filter(Boolean), urls: cells[4] });
  }
  return rows;
}
/**
 * Mục CREDITS.csv của đúng file đã đọc: `rel`, hoặc `<thư mục>/<animation>.png` khi `rel` là file màu (CREDITS.csv chỉ ghi
 * file màu gốc). Không đoán theo thư mục: các animation của một lớp thường do người khác vẽ thêm, ghi công sai là rủi ro giấy phép.
 */
function creditOf(rel, dir, anim) {
  const plain = `${dir}${anim}.png`, c = credits.get(rel) ?? credits.get(plain);
  if (!c) fail(`[lpc] ${rel}: CREDITS.csv không có mục ${rel === plain ? rel : `${rel} hay ${plain}`}, không rõ tác giả / giấy phép nên không dùng được`);
  const bad = c.licenses.filter((l) => !LICENSE_KNOWN.test(l));
  if (!c.licenses.length || bad.length) fail(`[lpc] ${rel}: không đọc được giấy phép ${c.licenses.join(", ") || "(trống)"} (ngoài CC0 / CC-BY / CC-BY-SA / CC-BY-NC / OGA-BY / GPL), chọn lớp khác`);
  return c;
}
const cache = new Map();
/** Sheet của lớp `l` cho animation LPC `anim`, hoặc null nếu lớp không có animation đó. */
function layerSheet(l, anim) {
  const rel = l.variant ? `${l.dir}${anim}/${l.variant}.png` : `${l.dir}${anim}.png`;
  if (cache.has(rel)) return cache.get(rel);
  const file = path.join(SHEETS, rel);
  let img = null;
  if (existsSync(file)) { img = readPng(file); used.set(rel, { dir: l.dir, variant: l.variant, c: creditOf(rel, l.dir, anim) }); }
  else console.warn(`[lpc] thiếu ${rel}: bỏ lớp này ở animation ${anim}`);
  cache.set(rel, img);
  return img;
}

// ---------- Ghép một khung, tách nhóm ----------
const layers = [...R.layers].sort((a, b) => a.z - b.z);
/** Khung (hàng, cột) của animation LPC: trả { px: Img, own: mảng chỉ số lớp sở hữu từng điểm (-1 = trống) }. */
function composeFrame(anim, row, col) {
  const px = new Img(LPC_FRAME, LPC_FRAME), own = new Int16Array(LPC_FRAME * LPC_FRAME).fill(-1);
  layers.forEach((l, li) => {
    const s = layerSheet(l, anim);
    if (!s || (col + 1) * LPC_FRAME > s.w || (row + 1) * LPC_FRAME > s.h) return;
    for (let y = 0; y < LPC_FRAME; y++) for (let x = 0; x < LPC_FRAME; x++) {
      const p = s.get(col * LPC_FRAME + x, row * LPC_FRAME + y);
      if (p[3] < 128) continue;
      px.set(x, y, [p[0], p[1], p[2], 255]); own[y * LPC_FRAME + x] = li;
    }
  });
  return { px, own };
}

// Gom mọi khung cần dùng trước để xếp hạng độ sáng theo nhóm trên cả bộ (cùng màu nguồn → cùng màu đích ở mọi khung).
const frames = []; // { dir, anim, i, px, own }
for (const [anim, spec] of Object.entries(LPC_FRAMES)) for (const d of ISO_DIRS) {
  if (spec.only && spec.only !== d) continue;
  spec.frames.forEach((c, i) => frames.push({ dir: d, anim, i, ...composeFrame(spec.file, spec.row ?? LPC_DIR_ROW[d], c) }));
}
const isEye = ([r, g, b]) => b > r + 25 && b > g;
const isSkinSrc = (li) => /^(body\/bodies|head\/heads)\//.test(layers[li].dir);
const isWhite = ([r, g, b]) => Math.min(r, g, b) > 200 && Math.max(r, g, b) - Math.min(r, g, b) < 30;
// Lòng trắng mắt: điểm gần trắng của lớp đầu nằm cạnh tròng mắt (cùng hàng, cách tối đa 2 điểm). Điểm gần trắng khác của lớp
// thân / đầu là chỗ sáng nhất của da (vai, cánh tay trần, đỉnh đầu hói) nên theo dải da, không giữ màu trắng.
const isHeadSrc = (li) => /^head\/heads\//.test(layers[li].dir);
const nearEye = (f, x, y) => [-2, -1, 1, 2].some((u) => { const a = x + u; return a >= 0 && a < LPC_FRAME && f.own[y * LPC_FRAME + a] >= 0 && isEye(f.px.get(a, y)); });
/** Bảng đổi màu: các màu nguồn xếp theo độ sáng, chia đều vào `ramp`. */
function rankMap(colors, ramp) {
  const list = [...colors].sort((a, b) => lum(hex(a)) - lum(hex(b)));
  return new Map(list.map((c, i) => [c, ramp[Math.min(ramp.length - 1, Math.floor((i * ramp.length) / list.length))]]));
}
/** Dải đích của lớp: `ramp` của công thức (mã màu hoặc chỉ số GRAY_RAMP), mặc định cả dải xám cho tóc / áo. */
const rampOf = (l) => (l.ramp ? l.ramp.map((c) => (typeof c === "number" ? GRAY_RAMP[c] : c)) : l.group === "body" ? null : GRAY_RAMP);
const NEAR_BLACK = 0.12 * 255;
/** Loại điểm (x, y) của khung `f`, lớp `li`, màu `p`: outline / keep / eye / skin / ramp. */
const kindOf = (li, p, f, x, y) => {
  const l = layers[li];
  if (lum(p) < NEAR_BLACK) return "outline";
  if (l.keep) return "keep";
  if (l.group === "body" && isSkinSrc(li)) return isEye(p) ? "eye" : isWhite(p) && isHeadSrc(li) && nearEye(f, x, y) ? "keep" : "skin";
  return rampOf(l) ? "ramp" : "keep";
};
// Da gộp mọi lớp thân / đầu; lớp có dải riêng (tóc, áo, giày) xếp hạng riêng từng lớp trên cả bộ.
const skinPool = new Set(), pools = layers.map(() => new Set());
for (const f of frames) for (let k = 0; k < f.own.length; k++) {
  if (f.own[k] < 0) continue;
  const x = k % LPC_FRAME, y = (k / LPC_FRAME) | 0, p = toHex(f.px.get(x, y)), kind = kindOf(f.own[k], hex(p), f, x, y);
  if (kind === "skin") skinPool.add(p); else if (kind === "ramp") pools[f.own[k]].add(p);
}
const skinMap = rankMap(skinPool, SKIN_RAMPS[0]), layerMaps = layers.map((l, li) => rampOf(l) && rankMap(pools[li], rampOf(l)));

// Dời để chân chạm gốc: đáy nhóm body ở khung đứng của từng hướng (LPC nhìn lên thì chân cao hơn nhìn xuống 1 điểm). Hurt / die
// lấy từ hàng nhìn xuống nên theo hướng s.
const footOf = (d) => {
  const stand = frames.find((f) => f.dir === d && f.anim === "idle");
  let foot = 0;
  for (let k = 0; k < stand.own.length; k++) if (stand.own[k] >= 0 && layers[stand.own[k]].group === "body") foot = Math.max(foot, (k / LPC_FRAME) | 0);
  return foot;
};
const dyDir = Object.fromEntries(ISO_DIRS.map((d) => [d, ISO_HS_ORIGIN[1] - footOf(d)]));
const foot = footOf("s"), dy = dyDir.s, dx = ISO_HS_ORIGIN[0] - LPC_FRAME / 2;
// Dòng --breathe (ngay dưới vai): sheet thân LPC không có đầu, hàng trên cùng của nó là cổ; vai thấp hơn LPC_SHOULDER.
const LPC_SHOULDER = 4;
// Đọc thẳng sheet thân (điểm thân ở cổ đã bị đầu / áo che trong ảnh gộp).
const bodySheet = layerSheet(layers.find((l) => l.dir.startsWith("body/bodies/")) ?? fail("công thức thiếu lớp body/bodies/"), LPC_FRAMES.idle.file);
const standRow = LPC_DIR_ROW.s * LPC_FRAME;
let neck = 0;
while (neck < LPC_FRAME && ![...Array(LPC_FRAME).keys()].some((x) => bodySheet.alpha(x, standRow + neck) >= 128)) neck++;
const breathe = neck + LPC_SHOULDER + dy;

// ---------- Ghi khung đã tách ----------
const work = path.join(out, name);
rmSync(work, { recursive: true, force: true });
for (const l of HS_LAYERS) mkdirSync(path.join(work, l), { recursive: true });
const groupOut = { body: 0, outfit: 1, hair: 2 };
for (const f of frames) {
  const parts = HS_LAYERS.map(() => new Img(ISO_HS_FRAME, ISO_HS_FRAME));
  for (let y = 0; y < LPC_FRAME; y++) for (let x = 0; x < LPC_FRAME; x++) {
    const li = f.own[y * LPC_FRAME + x];
    if (li < 0) continue;
    const X = x + dx, Y = y + dyDir[f.dir];
    if (X < 0 || Y < 0 || X >= ISO_HS_FRAME || Y >= ISO_HS_FRAME) continue;
    const p = f.px.get(x, y), kind = kindOf(li, p, f, x, y);
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, v]) => { const a = x + u, b = y + v; return a < 0 || b < 0 || a >= LPC_FRAME || b >= LPC_FRAME || f.own[b * LPC_FRAME + a] < 0; });
    const c = edge || kind === "outline" ? OUTLINE : kind === "eye" ? EYE : kind === "keep" ? nearest(desaturate(p)) : (kind === "skin" ? skinMap : layerMaps[li]).get(toHex(p));
    // Lớp `keep` (giáp, mũ) nằm ở lớp áo / tóc nhưng màu ngoài dải xám: client hoán màu sẽ bỏ qua các màu đó.
    parts[groupOut[layers[li].group]].set(X, Y, [...hex(c), 255]);
  }
  HS_LAYERS.forEach((l, i) => writeFileSync(path.join(work, l, `${f.dir}_${f.anim}_${f.i}.png`), encodePng(parts[i])));
}

// ---------- pack.mjs: sheet 24 × 6, idle thở, hurt / die hướng khác và absorb bằng code ----------
const tag = `${R.sex === "male" ? "m" : "f"}_0`; // pack --set cần dạng giới_số, chỉ là tên file tạm
const packOut = path.join(work, "_pack");
execFileSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), "pack.mjs"), "--kind", "honsu", "--set", tag, "--out", packOut,
  "--breathe", String(breathe), "--code", "hurt,die,absorb", work], { stdio: "inherit" });
const sheets = HS_LAYERS.map((l) => readPng(path.join(packOut, `${l}_${tag}.png`)));
HS_LAYERS.forEach((l, i) => writeFileSync(path.join(out, `${l}_${name}.png`), encodePng(sheets[i])));
rmSync(packOut, { recursive: true, force: true });

// Bản tô màu (xem thử; --game: chính là sheet đưa vào game): dải xám → màu tóc / áo, da tông R.skin. Dải riêng của công thức
// (hairRamp / outfitRamp) dùng nguyên; dải HAIR_COLORS / OUTFIT_COLORS là màu người chơi (tươi), khi --game thì giảm bão hòa
// theo --desat rồi đưa về màu gần nhất của bảng chung (NPC phụ không được nổi hơn hồn sư).
const ALL_RGB = PAL.map((c) => hex(c.hex));
const nearestAll = (p) => {
  let best = 0, bd = Infinity;
  ALL_RGB.forEach((c, i) => { const d = (c[0] - p[0]) ** 2 * 0.3 + (c[1] - p[1]) ** 2 * 0.59 + (c[2] - p[2]) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } });
  return PAL[best].hex;
};
const finalRamp = (own, swatch) => own ?? (game ? swatch.map((c) => nearestAll(desaturate(hex(c)))) : swatch);
const outfitFinal = finalRamp(R.outfitRamp, OUTFIT_RAMPS[R.outfitCol]), hairFinal = finalRamp(R.hairRamp, HAIR_RAMPS[R.hairCol]);
const swap = new Map([
  ...GRAY_RAMP.map((g, i) => [`1:${g}`, outfitFinal[i]]),
  ...GRAY_RAMP.map((g, i) => [`2:${g}`, hairFinal[i]]),
  ...SKIN_RAMPS[0].map((s, i) => [`0:${s}`, SKIN_RAMPS[R.skin][i]]),
]);
const col = new Img(sheets[0].w, sheets[0].h);
sheets.forEach((s, li) => {
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const p = s.get(x, y);
    if (!p[3]) continue;
    const c = swap.get(`${li}:${toHex(p)}`);
    col.set(x, y, c ? [...hex(c), 255] : p);
  }
});
writeFileSync(path.join(out, `${name}_mau.png`), encodePng(col));

// ---------- --game: sheet lpc_<tên> vào game ----------
if (game) {
  const rel = `iso/lpc/${name}.png`, file = path.join(SPRITES, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, encodePng(col));
  execFileSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), "normal.mjs"), file], { stdio: "inherit" });
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")), key = `lpc_${name}`, keyOf = (e) => (typeof e === "string" ? e : e.key);
  if (!manifest.sprites.some((e) => keyOf(e) === key)) {
    manifest.sprites.push({ key, iso: true });
    manifest.sprites.sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  }
  console.log(`[lpc] --game: ${path.relative(ROOT, file).split(path.sep).join("/")} (+ _n.png), key ${key}`);
}

// ---------- Ghi công ----------
const groups = new Map(); // gộp các animation của cùng một lớp có cùng ghi công
for (const { dir, variant, c } of used.values()) {
  const key = `${dir}|${c.authors}|${c.licenses}|${c.urls}`;
  if (!groups.has(key)) groups.set(key, { dir: variant ? `${dir}*/${variant}.png` : dir, c });
}
const cell = (s) => s.replace(/\|/g, "\\|");
const flagged = new Set(); // cờ SA / GPL / NC của các lớp đã ghép
const useCell = (c) => {
  const { use, flags } = licenseUse(c.licenses);
  flags.forEach((f) => flagged.add(f));
  return cell(use.join(", ")) + (flags.length ? ` (cờ ${flags.join(", ")})` : "");
};
const rowsMd = [...groups.values()].map(({ dir, c }) =>
  `| \`${cell(dir)}\` | ${cell(c.authors.split(",").map((s) => s.trim()).join(", "))} | ${cell(c.licenses.join(", "))} | ${useCell(c)} | ${c.urls.split(",").map((u) => u.trim()).filter(Boolean).map((u) => `<${u}>`).join(" ")} |`);
// Sheet là một file ghép mọi lớp: có lớp SA / GPL thì cả file theo giấy phép đó; có lớp NC thì phải thay khi thương mại hóa.
const shareAlike = ["SA", "GPL"].filter((f) => flagged.has(f));
const flagNotes = [
  shareAlike.length && `**Cờ ${shareAlike.join(" / ")}:** cả sheet \`lpc_${name}\` (kèm \`_n.png\`) ghép từ lớp có cờ nên theo đúng giấy phép ${shareAlike.join(" / ")} của lớp đó.`,
  flagged.has("NC") && "**Cờ NC:** chỉ dùng khi game phi thương mại; thương mại hóa thì thay lớp có cờ.",
].filter(Boolean);
const section = (title, rows) => [`### ${title}`, "", "| Lớp LPC (`spritesheets/`) | Tác giả | Giấy phép | Game dùng theo | Nguồn |", "|---|---|---|---|---|", ...rows, ...(flagNotes.length ? ["", ...flagNotes] : []), ""].join("\n");
const block = section(`${name} (lpc-compose.mjs)`, rowsMd);
const header = "## Asset LPC (Universal LPC Spritesheet Character Generator)\n\nNPC phụ ghép bằng `tools/assets/lpc-compose.mjs` từ <https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator>; tác giả, giấy phép, nguồn lấy từ `CREDITS.csv` của repo đó cho đúng từng file đã dùng. Nhận mọi giấy phép đã biết; lớp nhiều giấy phép thì dùng theo nhóm ít ràng buộc nhất. Ảnh đã sửa (ghép lớp, đổi màu, chọn khung) dùng theo giấy phép ở cột \"Game dùng theo\"; cờ SA / GPL / NC theo `GAME_DESIGN.md` mục 5.11.\n";
let doc = creditsDoc;
if (!doc.includes(START)) doc = `${doc}${doc && !doc.endsWith("\n") ? "\n" : ""}\n${header}\n${START}\n${END}\n`;
const [pre, rest] = doc.split(START), [mid, post] = rest.split(END);
// Mỗi NPC một mục, chạy lại thì thay mục cùng tên.
const others = mid.split(/(?=^### )/m).filter((s) => s.trim() && !s.startsWith(`### ${name} (`));
writeFileSync(creditsTarget, `${pre}${START}\n${[...others.map((s) => s.trimEnd() + "\n"), block].join("\n")}${END}${post}`);

if (game && !outOpt) rmSync(out, { recursive: true, force: true }); // thư mục làm việc tạm của --game
console.log(`[lpc] ${name}: ${frames.length} khung LPC, ${used.size} file, chân y=${foot} → dời ${dy}, --breathe ${breathe}, --desat ${desat}`);
if (!game || outOpt) console.log(`[lpc] ghi ${HS_LAYERS.map((l) => `${l}_${name}.png`).join(", ")}, ${name}_mau.png; ghi công → ${creditsTarget}`);
