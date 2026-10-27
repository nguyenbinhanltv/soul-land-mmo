// Chuyển ảnh RAW võ hồn v2 thành pixel thật (#1087, epic #1020). Thuật toán ở vohon-pixelize-lib.mjs; kiểm ở vohon-check.mjs; xem trước ở vohon-preview.mjs.
//   node tools/assets/vohon-pixelize.mjs --type portrait --id <võ hồn> --in <raw.png> --out <thư mục> [--crop x,y,w,h | --focus fx,fy --zoom Z] [--size 64]
//   node tools/assets/vohon-pixelize.mjs --type icon      --id <võ hồn> --in <raw.png> --out <thư mục>      (ra <id>-icon-32.png và -24.png)
//   node tools/assets/vohon-pixelize.mjs --type phaptuong --id <võ hồn> --in <tờ 5 hướng.png> --out <thư mục> [--frame 160|128]
// Chung: --colors N (mặc định theo loại: PORTRAIT_MAX_COLORS / PT_MAX_COLORS) --palette auto|gpl (gpl = chỉ chọn trong art/palette.gpl + màu võ hồn)
//        --merge D (gộp màu gần hơn D) --min-cluster N --passes N (làm cứng cạnh) --accent K (ưu tiên điểm sáng): mặc định theo loại, xem DEFAULTS_BY_TYPE ở vohon-pixelize-lib.mjs
//        --bg auto|none|#rrggbb (bỏ nền; chân dung mặc định none) --outline on|off --lift auto|off|<0..1> (icon: nâng sáng ảnh tối, mặc định auto 0,8) --no-check (chỉ tắt in kết quả kiểm; vẫn thoát mã 1 nếu CHẶN)
//        --preset portrait (#1095, tạo tương phản: nền lạnh tối, hue-shift, ≤ 8 màu, viền sáng; chỉ chân dung; từng mục chỉnh bằng) --hue-shift 0..1 --max-colors N --cool on|off --rim on|off --protect on|off
// Ghi `<id>-<loại>[-cỡ].png`, `.report.json` (cắt, màu, điểm sáng còn / mất) và in kết quả `vohon-check pixel`. Thoát mã 1 nếu có mục CHẶN.
// Ảnh RAW KHÔNG vào game từ đây: đây chỉ là bản thử để duyệt bằng mắt (vohon-preview.mjs); nhập game theo skill asset-gen sau khi chủ repo duyệt.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, encodePng, readGpl, hex, toHex, vohonColors, shadesOf } from "./lib.mjs";
import { TYPES, ICON_SIZES, PORTRAIT_SIZE, PT_DIRS, pixelizePortrait, pixelizeIcon, pixelizePhapTuong, prepareSource, splitPoses, strip } from "./vohon-pixelize-lib.mjs";
import { checkPixel, formatResult, verdict } from "./vohon-check.mjs";

/** Bảng cho `--palette gpl`: art/palette.gpl + col / robe của võ hồn (kèm một sắc tối, một sắc sáng, như validate cho phép). */
export function gplPool(id) {
  const pool = readGpl().map(hex), vc = id && vohonColors(id);
  for (const c of vc ?? []) for (const s of [c, ...shadesOf(c)]) pool.push(hex(s));
  return pool;
}
const num = (s) => (s === undefined ? undefined : +s);

/** Chạy một lượt; trả [{ file, res, check }]. Không ghi gì nếu `outDir` rỗng. */
export function run(o) {
  const src = readPng(o.in), base = `${o.id ?? "vohon"}-${o.type}`, outs = [];
  const opt = { colors: num(o.colors), palette: o.palette, pool: o.palette === "gpl" ? gplPool(o.id) : [], merge: num(o.merge), minCluster: num(o.minCluster), preset: o.preset, maxColors: num(o.maxColors), hueShift: num(o.hueShift), cool: o.cool === undefined ? undefined : o.cool !== "off", rim: o.rim === undefined ? undefined : o.rim !== "off", protect: o.protect === undefined ? undefined : o.protect !== "off", passes: num(o.passes), accent: num(o.accent), bg: o.bg, outline: o.outline, lift: o.lift, crop: o.crop, zoom: num(o.zoom) ?? 1, focus: o.focus?.split(",").map(Number) };
  const clean = Object.fromEntries(Object.entries(opt).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.some(Number.isNaN))));
  if (o.type === "portrait") { const size = num(o.size) ?? PORTRAIT_SIZE, res = pixelizePortrait(src, { ...clean, size }); outs.push({ name: `${base}.png`, img: res.img, res, check: { size } }); }
  else if (o.type === "icon") for (const size of o.size ? [num(o.size)] : ICON_SIZES) { const res = pixelizeIcon(src, { ...clean, size }); outs.push({ name: `${base}-${size}.png`, img: res.img, res, check: { size } }); }
  else {
    const prep = prepareSource(src, { bg: o.bg ?? "auto" }), poses = splitPoses(prep.img);
    if (poses.length !== PT_DIRS.length) throw new Error(`tách được ${poses.length} hướng, cần ${PT_DIRS.length} (cách nhau bằng khoảng trống; nền phải tách được: --bg auto|#rrggbb)`);
    const res = pixelizePhapTuong(poses.map((q) => q.img), { ...clean, frame: num(o.frame) });
    outs.push({ name: `${base}.png`, img: strip(res.frames), res, check: { frame: res.report.frame }, frames: res.frames });
  }
  for (const f of outs) f.result = checkPixel(f.img, { type: o.type, id: o.id, report: { ...f.res.report, ...f.check } });
  if (o.out) {
    mkdirSync(o.out, { recursive: true });
    for (const f of outs) {
      writeFileSync(path.join(o.out, f.name), encodePng(f.img));
      writeFileSync(path.join(o.out, f.name.replace(/\.png$/, ".report.json")), JSON.stringify({ ...f.res.report, ...f.check, palette: f.res.palette.map(toHex), source: path.basename(o.in), options: clean }, null, 2));
      if (f.frames) f.frames.forEach((fr, i) => writeFileSync(path.join(o.out, f.name.replace(/\.png$/, `-${PT_DIRS[i]}.png`)), encodePng(fr)));
    }
  }
  return outs;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  const o = { type: val("--type"), id: val("--id"), in: val("--in"), out: val("--out"), crop: val("--crop"), focus: val("--focus"), zoom: val("--zoom"), size: val("--size"), frame: val("--frame"), colors: val("--colors"), palette: val("--palette"), merge: val("--merge"), minCluster: val("--min-cluster"), passes: val("--passes"), accent: val("--accent"), bg: val("--bg"), outline: val("--outline"), lift: val("--lift"), preset: val("--preset"), maxColors: val("--max-colors"), hueShift: val("--hue-shift"), cool: val("--cool"), rim: val("--rim"), protect: val("--protect") };
  if (!TYPES.includes(o.type) || !o.in || !o.out) { console.error("Dùng: node tools/assets/vohon-pixelize.mjs --type portrait|icon|phaptuong --id <võ hồn> --in <raw.png> --out <thư mục> [--crop x,y,w,h | --focus fx,fy --zoom Z] [--colors N] [--palette auto|gpl] [--bg auto|none|#rrggbb] [--frame 160|128]"); process.exit(2); }
  try {
    let bad = false;
    for (const f of run(o)) { console.log(`ghi ${path.join(o.out, f.name)} (${f.img.w}×${f.img.h}, ${f.res.report.colors} màu, đổi ${f.res.report.hardenedPixels ?? "-"} điểm khi làm cứng)`); if (!a.includes("--no-check")) console.log(formatResult(f.result, "pixel")); if (verdict(f.result) === "block") bad = true; }
    process.exit(bad ? 1 : 0);
  } catch (e) { console.error(e.message); process.exit(2); }
}
