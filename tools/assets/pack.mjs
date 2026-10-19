// Ghép khung đã chuẩn hóa vào spritesheet bố cục cố định của mục 5.11.
//   node tools/assets/pack.mjs --kind honsu|vohon --out <sheet.png> <thư mục khung> [--fill]
//   node tools/assets/pack.mjs --kind beast<bậc> --out <sheet.png> <thư mục khung> [--fill] [--breathe <y>]
//   node tools/assets/pack.mjs --kind honsu --set <giới>_<kiểu tóc> <thư mục normalize --split> [--out <thư mục>] [--fill] [--breathe <y>]
//
// --set m_2: ghép một bộ hồn sư giới × kiểu tóc (mục 5.11) từ 3 thư mục con body/outfit/hair mà `normalize --split`
//         tách ra từ cùng một hình, ghi honsu/{body,outfit,hair}_m_2.png (mặc định vào shared/assets/sprites/honsu,
//         --out đổi thư mục). Cùng --breathe/--fill cho cả 3 lớp để các lớp khớp khung.
//
// Tên file khung quy định ô:
//   hồn sư / phụ thể: {hướng}_{animation}_{i}.png, hướng = down|right|up, animation = idle|walk|attack|cast|hurt|die
//                     (cột = cột bắt đầu của animation + i, hàng = 0/1/2), absorb_{i}.png → hàng 3, cột i.
//   hồn thú:          {animation}_{i}.png, animation = idle|walk|attack|hurt|die (một hàng 13 khung).
// Bố cục 16 cột × 4 hàng; khung 32×32 (sheet 512×128) cho hồn sư, 48×48 (768×192) cho phụ thể.
// Phụ thể chỉ nhận idle/walk/attack/cast (cột 0–11, hàng 0–2); hurt/die/absorb do client ánh xạ.
//
// --breathe <y>: idle khung 2 còn trống thì tạo từ idle khung 1: dời mọi điểm có y ≤ <y> xuống 1 pixel
//         (đầu và vai nhích 1 pixel, đúng mô tả idle của 5.11). Hồn sư: dùng cùng <y> cho mọi lớp để các lớp khớp nhau.
//         Hồn thú: lấy <y> ngang lưng để đầu và lưng nhích, chân đứng yên.
// --fill: ô bắt buộc còn trống thì chép tạm khung idle đầu cùng hàng (để client không hiện khung rỗng khi
//         mới có vài animation). validate.mjs sẽ cảnh báo các ô chép tạm này.
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { readPng, encodePng, Img, SPRITES, SHEET_COLS, SHEET_ROWS, HS_FRAME, VH_FRAME, HS_ANIMS, HS_LAYERS, DIRS, BEAST_FRAMES, BEAST_COLS } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const kind = opt("--kind", "honsu"), out = opt("--out", ""), fill = flag("--fill"), breathe = opt("--breathe", ""), set = opt("--set", "");
const dir = args[0];
if ((!out && !set) || !dir) { console.error("Cách dùng: pack.mjs --kind honsu|vohon|beast<bậc> --out <sheet.png> <thư mục khung> [--fill] [--breathe <y>]\n          pack.mjs --kind honsu --set <giới>_<kiểu tóc> <thư mục normalize --split> [--out <thư mục>]"); process.exit(1); }
if (set && (kind !== "honsu" || !/^[mf]_\d+$/.test(set))) { console.error(`--set cần --kind honsu và dạng m_0 / f_2 (nhận: ${kind}, ${set})`); process.exit(1); }

const BEAST_ANIMS = { idle: [0, 2], walk: [2, 4], attack: [6, 3], hurt: [9, 1], die: [10, 3] };
let FW, FH, cols, rows, cellOf, required;
if (kind === "honsu" || kind === "vohon") {
  FW = FH = kind === "honsu" ? HS_FRAME : VH_FRAME; cols = SHEET_COLS; rows = SHEET_ROWS;
  const anims = kind === "honsu" ? HS_ANIMS : Object.fromEntries(Object.entries(HS_ANIMS).filter(([a]) => ["idle", "walk", "attack", "cast"].includes(a)));
  cellOf = (name) => {
    let m = name.match(/^(down|right|up)_([a-z]+)_(\d+)$/);
    if (m && anims[m[2]] && +m[3] < anims[m[2]][1]) return [DIRS.indexOf(m[1]), anims[m[2]][0] + +m[3]];
    m = name.match(/^absorb_(\d+)$/);
    if (m && kind === "honsu" && +m[1] < 2) return [3, +m[1]];
    return null;
  };
  required = [];
  for (let r = 0; r < 3; r++) for (const [, [c0, n]] of Object.entries(anims)) for (let i = 0; i < n; i++) required.push([r, c0 + i]);
  if (kind === "honsu") required.push([3, 0], [3, 1]);
} else if (/^beast\d$/.test(kind)) {
  [FW, FH] = BEAST_FRAMES[+kind.slice(5)]; cols = BEAST_COLS; rows = 1;
  cellOf = (name) => { const m = name.match(/^([a-z]+)_(\d+)$/); return m && BEAST_ANIMS[m[1]] && +m[2] < BEAST_ANIMS[m[1]][1] ? [0, BEAST_ANIMS[m[1]][0] + +m[2]] : null; };
  required = Object.values(BEAST_ANIMS).flatMap(([c0, n]) => Array.from({ length: n }, (_, i) => [0, c0 + i]));
} else { console.error(`--kind không hợp lệ: ${kind}`); process.exit(1); }

/** Ghép mọi khung trong `dir` thành một sheet và ghi ra `outFile`. */
function pack(dir, outFile) {
  const sheet = new Img(FW * cols, FH * rows), filled = new Set();
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".png")).sort()) {
    const cell = cellOf(path.basename(f, ".png"));
    if (!cell) { console.warn(`[pack] bỏ qua ${f}: tên không đúng quy ước`); continue; }
    const img = readPng(path.join(dir, f));
    if (img.w !== FW || img.h !== FH) { console.error(`[pack] ${f}: ${img.w}×${img.h}, cần ${FW}×${FH} (chạy normalize trước)`); process.exit(1); }
    sheet.blit(img, 0, 0, FW, FH, cell[1] * FW, cell[0] * FH);
    filled.add(cell.join(","));
  }

  if (breathe) {
    const cut = +breathe;
    for (let r = 0; r < (kind === "honsu" ? 3 : kind === "vohon" ? 0 : 1); r++) {
      if (!filled.has(`${r},0`) || filled.has(`${r},1`)) continue;
      const y0 = r * FH; // idle khung 1 (cột 0) → khung 2 (cột 1)
      sheet.blit(sheet, 0, y0 + cut + 1, FW, FH - cut - 1, FW, y0 + cut + 1); // phần dưới giữ nguyên
      sheet.blit(sheet, 0, y0, FW, cut + 1, FW, y0 + 1);                      // phần trên dời xuống 1
      filled.add(`${r},1`);
    }
  }
  const missing = required.filter((c) => !filled.has(c.join(",")));
  if (fill) {
    for (const [r, c] of missing) {
      // Hàng 3 (absorb) mượn idle hướng xuống; hồn thú mượn idle khung đầu.
      const src = r === 3 ? [0, 0] : [r, 0];
      if (!filled.has(src.join(","))) continue;
      sheet.blit(sheet, src[1] * FW, src[0] * FH, FW, FH, c * FW, r * FH);
    }
  }
  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, encodePng(sheet));
  console.log(`[pack] ${outFile}: ${sheet.w}×${sheet.h}, ${filled.size} khung` +
    (missing.length ? `, thiếu ${missing.length} ô bắt buộc${fill ? " (đã chép tạm idle)" : ""}` : ""));
}

if (set) for (const layer of HS_LAYERS) pack(path.join(dir, layer), path.join(out || path.join(SPRITES, "honsu"), `${layer}_${set}.png`));
else pack(dir, out);
