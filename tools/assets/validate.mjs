// Kiểm tra sprite theo quy cách mục 5.11, và đăng ký sprite mới vào manifest + art/CREDITS.md.
//   node tools/assets/validate.mjs                     kiểm mọi key trong shared/assets/sprites/manifest.json
//   node tools/assets/validate.mjs --register <key> --prompt "<mô tả/prompt>" [--tool "<công cụ>"] [--note "<ghi chú>"] [--frame WxH]
//        kiểm file của key, thêm key vào manifest (nếu chưa có) và ghi/cập nhật một dòng trong art/CREDITS.md.
// Lỗi (thoát mã 1): kích thước sheet sai bố cục, alpha khác 0/255, màu ngoài bảng (tóc/áo: chỉ dải 4 xám + viền #1a1020),
//       lớp thân thiếu khung bắt buộc, bộ hồn sư giới × kiểu tóc thiếu lớp (phải đủ hs_body/outfit/hair_{giới}_{kiểu}),
//       phụ thể vẽ vào cột 12–15 hoặc hàng 3, hồn thú thiếu khung; chân dung (portrait_{id}) quá PORTRAIT_MAX_COLORS màu
//       (chân dung không theo bảng chung), vật đứng (prop_{vật}) cạnh không chia hết cho ISO_PROP_STEP hoặc màu ngoài
//       bảng chung + bảng nhấn art/palettes/*.gpl. Key isometric (sheetSpec có iso) ghi "iso": true trong manifest.
// Cảnh báo: khung chép tạm (trùng idle khung đầu, do pack --fill); lớp áo/tóc trống khung (bị lớp khác che);
//       chân hồn sư (gộp 3 lớp cùng bộ, idle khung đầu mỗi hướng) không chạm dòng gốc y = 30.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { ROOT, SPRITES, MANIFEST, readPng, toHex, allowedColors, accentColors, sheetSpec, GRAY_RAMP, OUTLINE, SHEET_COLS, HS_ANIMS, HS_ORIGIN, HS_LAYERS, PORTRAIT_MAX_COLORS, ISO_PROP_STEP } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const register = opt("--register", ""), prompt = opt("--prompt", ""), tool = opt("--tool", "PixelLab MCP"), note = opt("--note", ""), frameOpt = opt("--frame", "");

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
manifest.sprites ??= [];
const entryKey = (e) => (typeof e === "string" ? e : e.key);
const allowed = allowedColors(), withAccents = new Set([...allowed, ...accentColors()]);
// Tóc/áo: 4 xám để hoán màu + viền ngoài #1a1020 (màu thứ 5, giữ nguyên khi hoán màu).
const grayOnly = new Set([...GRAY_RAMP, OUTLINE]);
let errors = 0, warns = 0;
const feet = new Map(); // "bộ:hàng" → dòng thấp nhất của idle khung đầu (3 lớp của bộ giới × kiểu tóc)
const err = (k, m) => { errors++; console.error(`[validate] LỖI ${k}: ${m}`); };
const warn = (k, m) => { warns++; console.warn(`[validate] cảnh báo ${k}: ${m}`); };

function cellEmpty(img, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (img.alpha(x, y)) return false;
  return true;
}
function cellSame(img, a, b, w, h) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = img.get(a[0] + x, a[1] + y), q = img.get(b[0] + x, b[1] + y);
    if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2] || p[3] !== q[3]) return false;
  }
  return true;
}

function check(key, frame) {
  const spec = sheetSpec(key, frame);
  if (!spec) return err(key, "key sai quy ước (xem sheetSpec trong client/src/sprites.ts)");
  const file = path.join(SPRITES, spec.file);
  if (!existsSync(file)) return err(key, `thiếu file ${path.relative(ROOT, file)}`);
  let img;
  try { img = readPng(file); } catch (e) { return err(key, `không đọc được PNG: ${e.message}`); }
  if (spec.size && (img.w !== spec.size[0] || img.h !== spec.size[1])) return err(key, `kích thước ${img.w}×${img.h}, cần ${spec.size[0]}×${spec.size[1]}`);
  if (spec.frame && (img.w % spec.frame[0] || img.h % spec.frame[1])) return err(key, `kích thước không chia hết cho khung ${spec.frame.join("×")}`);
  if (spec.kind === "prop" && (img.w % ISO_PROP_STEP || img.h % ISO_PROP_STEP)) return err(key, `kích thước ${img.w}×${img.h} không chia hết cho ${ISO_PROP_STEP}`);

  // Màu và alpha.
  const palette = /^hs_(hair|outfit)_/.test(key) ? grayOnly : spec.kind === "prop" ? withAccents : allowed;
  const bad = new Map(), used = new Set(); let semi = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.get(x, y);
    if (!p[3]) continue;
    if (p[3] !== 255) semi++;
    const c = toHex(p);
    used.add(c);
    if (spec.kind !== "portrait" && !palette.has(c)) bad.set(c, (bad.get(c) ?? 0) + 1);
  }
  if (semi) err(key, `${semi} điểm bán trong suốt (chỉ được alpha 0 hoặc 255)`);
  if (spec.kind === "portrait" && used.size > PORTRAIT_MAX_COLORS) err(key, `${used.size} màu, chân dung tối đa ${PORTRAIT_MAX_COLORS}`);
  if (bad.size) err(key, `${bad.size} màu ngoài bảng${palette === grayOnly ? " (tóc/áo chỉ dùng dải 4 xám + viền)" : ""}: ` +
    [...bad].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, n]) => `${c}×${n}`).join(", "));

  // Khung bắt buộc.
  const [fw, fh] = spec.frame ?? [img.w, img.h];
  const at = (r, c) => [c * fw, r * fh];
  if (spec.kind === "honsu") {
    const need = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < SHEET_COLS; c++) need.push([r, c]);
    need.push([3, 0], [3, 1]);
    const empty = need.filter(([r, c]) => cellEmpty(img, ...at(r, c), fw, fh));
    // Lớp thân phải đủ khung; lớp áo/tóc có thể trống ở khung bị lớp khác che hết (ví dụ áo sau tóc dài khi quay lưng).
    const report = /^hs_body_/.test(key) ? err : warn;
    if (empty.length) report(key, `${/^hs_body_/.test(key) ? "thiếu" : "trống"} ${empty.length} khung bắt buộc: ` + empty.slice(0, 10).map(([r, c]) => `(${r},${c})`).join(" "));
    const temp = need.filter(([r, c]) => c > 0 && !(r === 3 && c === 0) && !(r === 0 && c === 0) &&
      cellSame(img, at(r, c), r === 3 ? at(0, 0) : at(r, 0), fw, fh) && !cellEmpty(img, ...at(r, c), fw, fh));
    const names = (c) => Object.entries(HS_ANIMS).find(([, [c0, n]]) => c >= c0 && c < c0 + n)?.[0] ?? "absorb";
    if (temp.length) warn(key, `${temp.length} khung trùng idle khung đầu, thường là chép tạm (${[...new Set(temp.map(([r, c]) => (r === 3 ? "absorb" : names(c))))].join(", ")})`);
    // Dòng thấp nhất của idle khung đầu mỗi hướng; gộp 3 lớp cùng bộ rồi kiểm ở cuối (chân có thể thuộc lớp áo).
    for (let r = 0; r < 3; r++) {
      const [x0, y0] = at(r, 0), k = `${spec.set}:${r}`;
      for (let y = 0; y < fh; y++) if (!cellEmpty(img, x0, y0 + y, fw, 1)) feet.set(k, Math.max(feet.get(k) ?? -1, y));
    }
  } else if (spec.kind === "vohon") {
    const stray = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < SHEET_COLS; c++) if ((r === 3 || c >= 12) && !cellEmpty(img, ...at(r, c), fw, fh)) stray.push([r, c]);
    if (stray.length) err(key, `phụ thể vẽ vào ô client không đọc (cột 12–15 hoặc hàng 3): ` + stray.map(([r, c]) => `(${r},${c})`).join(" "));
    if (cellEmpty(img, 0, 0, img.w, img.h)) warn(key, "sheet trống hoàn toàn");
  } else if (spec.kind === "beast") {
    const empty = [];
    for (let c = 0; c < img.w / fw; c++) if (cellEmpty(img, c * fw, 0, fw, fh)) empty.push(c);
    if (empty.length) err(key, `thiếu khung: cột ${empty.join(", ")}`);
  }
  return spec;
}

// ---------- Đăng ký key mới ----------
function upsertCredits(key, file) {
  const credits = path.join(ROOT, "art", "CREDITS.md");
  let md = readFileSync(credits, "utf8");
  // Mỗi công cụ AI một mục: --tool có chữ "Gemini" thì ghi vào mục Gemini, còn lại mục PixelLab.
  const gemini = /gemini/i.test(tool);
  const head = gemini ? "## Asset tạo bằng AI (Gemini)" : "## Asset tạo bằng AI (PixelLab)";
  const intro = gemini
    ? "Người dùng tạo ảnh bằng Gemini (gemini.google.com), rồi nhập bằng `tools/assets/gemini-import.mjs` (gỡ logo, xóa nền, điểm ảnh giả → pixel thật, đưa về khung) và đăng ký bằng `validate --register`. Quy trình: `.claude/skills/asset-gen/SKILL.md`."
    : "Tạo bằng PixelLab qua MCP, rồi chuẩn hóa bằng `tools/assets` (normalize → pack → validate). Quy trình: `.claude/skills/asset-gen/SKILL.md`.";
  if (!md.includes(head)) {
    md = md.replace("## Asset bên ngoài", `${head}\n\n${intro}\n\n` +
      "| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |\n|---|---|---|---|---|---|\n\n## Asset bên ngoài");
  }
  const date = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD theo giờ máy
  const cell = (s) => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const row = `| \`${file}\` | \`${key}\` | ${cell(tool)} | ${cell(prompt)} | ${date} | ${cell(note)} |`;
  const lines = md.split("\n"), i = lines.findIndex((l) => l.includes(`| \`${key}\` |`));
  if (i >= 0) lines[i] = row;
  else {
    // Chèn sau dòng cuối của bảng trong mục AI.
    let j = lines.indexOf(head) + 1;
    while (j < lines.length && !lines[j].startsWith("|")) j++;
    while (j < lines.length && lines[j].startsWith("|")) j++;
    lines.splice(j, 0, row);
  }
  writeFileSync(credits, lines.join("\n"));
}

if (register) {
  if (!prompt) { console.error("--register cần --prompt (ghi vào art/CREDITS.md)"); process.exit(1); }
  const frame = frameOpt ? frameOpt.split("x").map(Number) : undefined;
  const spec = check(register, frame);
  if (errors) process.exit(1);
  if (!manifest.sprites.some((e) => entryKey(e) === register)) {
    manifest.sprites.push(spec.iso ? { key: register, iso: true } : frame ? { key: register, frame } : register);
    manifest.sprites.sort((a, b) => entryKey(a).localeCompare(entryKey(b)));
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  }
  upsertCredits(register, `shared/assets/sprites/${spec.file}`);
  console.log(`[validate] đã đăng ký ${register}`);
  process.exit(0);
}

// ---------- Kiểm toàn bộ manifest ----------
const seen = new Set();
for (const e of manifest.sprites) {
  const key = entryKey(e);
  if (seen.has(key)) err(key, "trùng key trong manifest");
  seen.add(key);
  const spec = check(key, typeof e === "string" ? undefined : e.frame);
  if (spec) seen.add(spec.file);
}
// Bộ hồn sư giới × kiểu tóc phải đủ 3 lớp tách từ cùng một hình: thiếu lớp nào thì client vẽ lớp đó bằng code, lệch nét.
const sets = new Map();
for (const e of manifest.sprites) { const k = entryKey(e), set = sheetSpec(k)?.set; if (set) sets.set(set, [...(sets.get(set) ?? []), k]); }
for (const [set, keys] of sets) {
  const miss = HS_LAYERS.map((l) => `hs_${l}_${set}`).filter((k) => !keys.includes(k));
  if (miss.length) err(`hs_*_${set}`, `bộ giới × kiểu tóc thiếu lớp ${miss.join(", ")} (mỗi bộ đủ thân, áo, tóc tách từ cùng một hình)`);
}
// Chân hồn sư (gộp thân, áo, tóc cùng bộ) phải chạm dòng gốc y = 30 ở idle mỗi hướng.
for (const [k, low] of feet) if (low !== HS_ORIGIN[1]) warn(`hs_*_${k.split(":")[0]}`, `hàng ${k.split(":")[1]}: chân ở y = ${low}, gốc là y = ${HS_ORIGIN[1]}`);
// Ảnh nằm trong thư mục sprites mà manifest không nhắc tới thì client sẽ không tải.
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(path.join(d, f.name)) : [path.join(d, f.name)]));
for (const f of walk(SPRITES).filter((f) => f.endsWith(".png"))) {
  const rel = path.relative(SPRITES, f).split(path.sep).join("/");
  if (!seen.has(rel)) warn(rel, "có ảnh nhưng không có key trong manifest.json");
}
console.log(`[validate] ${manifest.sprites.length} key, ${errors} lỗi, ${warns} cảnh báo`);
process.exit(errors ? 1 : 0);
