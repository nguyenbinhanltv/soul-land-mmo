// Luật "một bản nguồn mỗi loài" cho tờ hoạt ảnh hồn thú (#1061, chủ repo chọn hướng 3). Chạy trong `npm run check`.
// Chi tiết luật: docs/art/hon-thu-hoat-anh.md mục "Nguồn trong git: chỉ lần nộp mới nhất"; thao tác: skill beast-anim.
//   1) Mỗi loài chỉ có tờ nguồn đúng tên: toA..toE.png, to-<hướng>.png, turnaround.png (vẽ lại thì THAY file, không thêm tên song song);
//      không có ảnh khác (`-attemptN`, `-legacy`, `-before`, ảnh chụp review, guide…): RAW / bản nháp ở NGOÀI repo (artifacts), truy vết bằng prompt + SHA256 trong NGUON.md.
//   2) `candidates/` chỉ còn là chỗ cho tờ BỊ CHẶN chưa có `toX.png` chính (#1141): mỗi nhãn đúng một `toX-attemptN.png` (+ .prompt.txt / .source.json cùng tên).
//   3) Tổng dung lượng PNG nguồn vượt BEAST_SRC_BUDGET_MB thì CẢNH BÁO (không làm đỏ): bàn lại nén / kho ngoài trước khi nhập thêm loài.
import { execSync } from "node:child_process";
import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Ngưỡng cảnh báo tổng PNG nguồn (MB). Một chỗ duy nhất; đổi ở đây, tài liệu chỉ trỏ tên hằng. */
export const BEAST_SRC_BUDGET_MB = 600;
const SHEET = "to(?:[A-E]|-(?:s|se|e|ne|n))";
const MAIN_PNG = new RegExp(`^(?:${SHEET}|turnaround)[.]png$`);
const CAND = new RegExp(`^(${SHEET})-attempt([0-9]+)[.](png|prompt[.]txt|source[.]json)$`);

/** files: đường dẫn tương đối (dấu /) của file được theo dõi. Trả { errs, pngBytes } (size(f) trả byte). */
export function checkBeastSrc(files, size = () => 0) {
  const errs = [], set = new Set(files), perLabel = new Map();
  let pngBytes = 0;
  for (const f of files) {
    const m = /^art[/]src[/]beast-anim[/]([^/]+)[/](.+)$/.exec(f);
    if (!m || !f.endsWith(".png")) { if (m && /^candidates[/]/.test(m[2]) && !CAND.test(m[2].slice(11))) errs.push(`${f}: file thừa trong candidates/ (chỉ giữ tờ bị chặn \`toX-attemptN\`; RAW nháp để ngoài repo)`); continue; }
    const [, sp, rel] = m;
    pngBytes += size(f);
    if (!rel.includes("/")) { if (!MAIN_PNG.test(rel)) errs.push(`${f}: ảnh không phải tờ nguồn đúng tên (toA..toE / to-<hướng> / turnaround); bản nháp, ảnh review để ngoài repo`); continue; }
    const c = /^candidates[/]([^/]+)$/.exec(rel), cm = c && CAND.exec(c[1]);
    if (!cm) { errs.push(`${f}: không được nằm trong repo (bản nháp / lượt cũ để ngoài, giữ prompt + SHA256 ở NGUON.md)`); continue; }
    const key = `${sp}/${cm[1]}`;
    if (set.has(`art/src/beast-anim/${sp}/${cm[1]}.png`)) errs.push(`${f}: đã có ${cm[1]}.png chính, lượt thử này là bản dư`);
    (perLabel.get(key) ?? perLabel.set(key, []).get(key)).push(f);
  }
  for (const [key, list] of perLabel) if (list.length > 1) errs.push(`${key}: ${list.length} bản trong candidates/ (chỉ giữ MỘT lượt mới nhất): ${list.join(", ")}`);
  return { errs, pngBytes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const files = execSync("git ls-files art/src/beast-anim", { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }).split(/\r?\n/).filter(Boolean);
  const { errs, pngBytes } = checkBeastSrc(files, (f) => statSync(path.join(ROOT, f)).size);
  const mb = pngBytes / 1048576;
  if (errs.length) { for (const e of errs) console.error(`[beast-src] ✗ ${e}`); process.exit(1); }
  if (mb > BEAST_SRC_BUDGET_MB) console.warn(`[beast-src] ⚠ PNG nguồn ${mb.toFixed(1)} MB vượt ngưỡng ${BEAST_SRC_BUDGET_MB} MB (BEAST_SRC_BUDGET_MB): bàn lại nén / kho ngoài (#1061)`);
  console.log(`[beast-src] OK: mỗi loài một bản nguồn (${mb.toFixed(1)} MB PNG)`);
}
