// Ghi neo đã chỉnh tay ở màn `?thu=phuthe&sua=1` vào shared/assets/sprites/vohonanim/anchor.json (lệnh dev, không qua server):
//   node tools/assets/phuthe-anchor-apply.mjs <anchor.json tải về> [--out <anchor.json đích>] [--dry]
// Mỗi mục trong tệp tải về được kiểm (checkAnchors), gán `manual: true` (công cụ phuthe-anchor.mjs không ghi đè) rồi gộp vào tệp đích, khóa xếp theo tên.
import { writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ANCHOR_FILE, checkAnchors, readAnchors } from "./phuthe-anchor.mjs";

/** Gộp `incoming` (đối tượng { id: mục }) vào `all`; trả { all, ids } hoặc ném lỗi nếu có mục sai. Mục nhận vào luôn đánh dấu `manual`. */
export function applyAnchors(all, incoming) {
  const ids = Object.keys(incoming ?? {});
  if (!ids.length) throw new Error("tệp không có mục võ hồn nào");
  const bad = ids.flatMap((id) => checkAnchors(id, incoming[id]));
  if (bad.length) throw new Error(bad.join("\n"));
  const next = { ...all };
  for (const id of ids) next[id] = { ...incoming[id], manual: true };
  return { all: Object.fromEntries(Object.entries(next).sort(([x], [y]) => (x < y ? -1 : 1))), ids };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), i = a.indexOf("--out"), out = i < 0 ? ANCHOR_FILE : path.resolve(a[i + 1]), src = a.find((x, k) => !x.startsWith("--") && a[k - 1] !== "--out");
  if (!src) { console.error("Dùng: node tools/assets/phuthe-anchor-apply.mjs <anchor.json tải về> [--out <anchor.json đích>] [--dry]"); process.exit(2); }
  try {
    const r = applyAnchors(readAnchors(out), JSON.parse(readFileSync(path.resolve(src), "utf8")));
    if (!a.includes("--dry")) writeFileSync(out, JSON.stringify(r.all, null, 1) + "\n");
    console.log(`${a.includes("--dry") ? "[dry] " : "ghi "}${r.ids.join(", ")} -> ${path.relative(process.cwd(), out)}`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
