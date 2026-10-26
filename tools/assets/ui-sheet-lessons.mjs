// Đọc bài học vẽ tờ UI từ art/src/ui-kit/lessons.md (#880, theo dõi #877) để chèn vào prompt tiếng Anh.
// Cú pháp và nguồn bài học nằm ở đầu chính file lessons.md; không đặt bài học ở nơi khác.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.mjs";

export const LESSONS_FILE = path.join(ROOT, "art", "src", "ui-kit", "lessons.md");
export const SHEET_KINDS = ["BOARD", "F", "N", "O", "T", "I", "D"];

/** Phân tích nội dung lessons.md → [{ kinds: Set | null, text, note }]; dòng sai cú pháp ném lỗi (để test bắt). */
export function parseLessons(md) {
  const out = [];
  for (const [i, line] of md.split(/\r?\n/).entries()) {
    if (!/^- \[/.test(line)) continue;
    const m = /^- \[([^\]]*)\]\s+(.+?)(?:\s+\/\/\s+(.*))?$/.exec(line);
    if (!m) throw new Error(`lessons.md dòng ${i + 1}: sai cú pháp bài học`);
    const kinds = new Set();
    for (const t of m[1].split(/[,\s]+/).filter(Boolean)) {
      if (t === "all") kinds.add("all");
      else if (SHEET_KINDS.includes(t)) kinds.add(t);
      else throw new Error(`lessons.md dòng ${i + 1}: loại tờ lạ ${t}`);
    }
    out.push({ kinds: kinds.size && !kinds.has("all") ? kinds : null, text: m[2].trim(), note: m[3]?.trim() ?? "" });
  }
  return out;
}

/** Bài học áp cho một loại tờ, theo thứ tự trong file. */
export function lessonsFor(kind, md = readFileSync(LESSONS_FILE, "utf8")) {
  return parseLessons(md).filter((l) => !l.kinds || l.kinds.has(kind));
}
