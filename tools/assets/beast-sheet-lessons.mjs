// Đọc bài học vẽ hoạt ảnh hồn thú từ art/src/beast-anim/lessons.md (#865, theo dõi #861) để chèn vào prompt tiếng Anh.
// Cú pháp và nguồn bài học nằm ở đầu chính file lessons.md; không đặt bài học ở nơi khác.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.mjs";

export const LESSONS_FILE = path.join(ROOT, "art", "src", "beast-anim", "lessons.md");
export const STAGES = ["turnaround", "direction", "sheet"];
const FAMILIES = ["quad", "bird", "snake", "insect", "plant"];

/** Phân tích nội dung lessons.md → [{ stages: Set | null, families: Set | null, text, note }]; dòng sai cú pháp ném lỗi (để test bắt). */
export function parseLessons(md) {
  const out = [];
  for (const [i, line] of md.split(/\r?\n/).entries()) {
    if (!/^- \[/.test(line)) continue;
    const m = /^- \[([^\]]*)\]\s+(.+?)(?:\s+\/\/\s+(.*))?$/.exec(line);
    if (!m) throw new Error(`lessons.md dòng ${i + 1}: sai cú pháp bài học`);
    const stages = new Set(), families = new Set();
    for (const t of m[1].split(/[,\s]+/).filter(Boolean)) {
      if (t.startsWith("@")) { if (!FAMILIES.includes(t.slice(1))) throw new Error(`lessons.md dòng ${i + 1}: họ lạ ${t}`); families.add(t.slice(1)); }
      else if (t === "all") stages.add("all");
      else if (STAGES.includes(t)) stages.add(t);
      else throw new Error(`lessons.md dòng ${i + 1}: giai đoạn lạ ${t}`);
    }
    out.push({ stages: stages.size && !stages.has("all") ? stages : null, families: families.size ? families : null, text: m[2].trim(), note: m[3]?.trim() ?? "" });
  }
  return out;
}

/** Bài học áp cho (giai đoạn, họ), theo thứ tự trong file. */
export function lessonsFor(stage, family, md = readFileSync(LESSONS_FILE, "utf8")) {
  return parseLessons(md).filter((l) => (!l.stages || l.stages.has(stage)) && (!l.families || l.families.has(family)));
}
