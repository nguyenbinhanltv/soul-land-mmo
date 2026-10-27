// Nhập sheet phụ thể hoạt ảnh `vhanim_{id}_{b|f}` vào game (#1024, docs/art/phu-the-hoat-anh.md).
//   node tools/assets/phuthe-import.mjs --id <võ hồn> --dir <thư mục phuthe-sheet-cut> [--anchor <anchor.json do phuthe-anchor.mjs ghi>] [--dry-run] [--sprites <thư mục>]
// Chép vhanim_<id>_b.png / _f.png vào <sprites>/vohonanim/<id>_{b|f}.png, thêm / cập nhật mục `vhanim_<id>_{b|f}` ngay sau mục `vh_<id>_f` trong manifest.json
// (đổi `anim.anims` của cutter thành `anim.clips` client đọc; nửa không có điểm ảnh ghi `"blank": true`, không chép ảnh), và gộp --anchor vào vohonanim/anchor.json (mục "manual" không bị ghi đè).
// Chạy lại không đổi gì. Không sửa tay manifest.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT } from "./lib.mjs";

const DEF_SPRITES = path.join(ROOT, "shared", "assets", "sprites");
const entryText = (e) => JSON.stringify(e, null, 2).split("\n").map((l) => "    " + l).join("\n");

function findEntry(text, key) {
  const head = `    {\n      "key": ${JSON.stringify(key)},`, at = text.indexOf(head);
  if (at < 0) return null;
  const end = text.indexOf("\n    }", at) + "\n    }".length;
  return { start: at, end };
}

/** Mục manifest cho client từ mục của cutter: `anim.anims` → `anim.clips`, bỏ trường chỉ dùng cho công cụ. */
export function clientEntry(e, blank) {
  const { cols, anims } = e.anim;
  return { key: e.key, iso: true, frame: e.frame, anim: { cols, clips: anims }, ...(blank ? { blank: true } : {}) };
}

/** Thêm / thay mục `entry` trong văn bản manifest; mục mới đặt sau `after` (key). Trả về { text, action }. */
export function upsert(text, entry, after) {
  const old = findEntry(text, entry.key), body = entryText(entry);
  if (old) return text.slice(old.start, old.end) === body ? { text, action: "giữ" } : { text: text.slice(0, old.start) + body + text.slice(old.end), action: "cập nhật" };
  const prev = findEntry(text, after);
  if (!prev) throw new Error(`manifest chưa có mục ${after}`);
  const comma = text[prev.end] === ",";
  const at = comma ? prev.end + 1 : prev.end;
  return { text: text.slice(0, at) + (comma ? "\n" + body + "," : ",\n" + body) + text.slice(at), action: "mới" };
}

export function run(o) {
  const mf = path.join(o.sprites, "manifest.json"), cut = JSON.parse(readFileSync(path.join(o.dir, "manifest-entry.json"), "utf8"));
  const raw = readFileSync(mf, "utf8"), crlf = raw.includes("\r\n"); // manifest có thể là CRLF (autocrlf trên Windows): xử lý bằng LF, ghi lại đúng kiểu cũ
  let text = raw.replace(/\r\n/g, "\n"), after = `vh_${o.id}_f`;
  const rows = [];
  for (const half of ["b", "f"]) {
    const key = `vhanim_${o.id}_${half}`, src = path.join(o.dir, `${key}.png`), dst = path.join(o.sprites, "vohonanim", `${o.id}_${half}.png`), e = cut.find((x) => x.key === key);
    const blank = !e;
    const ref = e ?? cut[0], entry = clientEntry({ ...ref, key }, blank);
    const up = upsert(text, entry, after); text = up.text; after = key;
    const same = !blank && existsSync(dst) && Buffer.compare(readFileSync(src), readFileSync(dst)) === 0;
    rows.push(`${key}: ảnh ${blank ? "trống (blank)" : same ? "giữ" : "chép"}, manifest ${up.action}`);
    if (!o.dryRun && !blank && !same) { mkdirSync(path.dirname(dst), { recursive: true }); copyFileSync(src, dst); }
  }
  if (!o.dryRun) writeFileSync(mf, crlf ? text.replace(/\n/g, "\r\n") : text);
  if (o.anchor) {
    const file = path.join(o.sprites, "vohonanim", "anchor.json"), all = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {}, next = JSON.parse(readFileSync(o.anchor, "utf8"))[o.id];
    if (!next) throw new Error(`--anchor không có mục ${o.id}`);
    if (all[o.id]?.manual) rows.push("anchor: mục manual, giữ nguyên");
    else {
      all[o.id] = next; rows.push("anchor: ghi");
      if (!o.dryRun) writeFileSync(file, JSON.stringify(Object.fromEntries(Object.entries(all).sort(([x], [y]) => (x < y ? -1 : 1))), null, 1) + "\n");
    }
  }
  console.log(rows.join("\n") + (o.dryRun ? "\n[dry-run, không ghi gì]" : ""));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  if (!val("--id") || !val("--dir")) { console.error("Dùng: node tools/assets/phuthe-import.mjs --id <võ hồn> --dir <thư mục phuthe-sheet-cut> [--anchor <anchor.json>] [--dry-run] [--sprites <thư mục>]"); process.exit(2); }
  try { run({ id: val("--id"), dir: path.resolve(val("--dir")), anchor: val("--anchor") && path.resolve(val("--anchor")), dryRun: a.includes("--dry-run"), sprites: val("--sprites") ? path.resolve(val("--sprites")) : DEF_SPRITES }); }
  catch (e) { console.error(e.message); process.exit(1); }
}
