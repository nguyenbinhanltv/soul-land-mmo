// Đọc bài học vẽ hoạt ảnh phụ thể võ hồn từ art/src/phuthe-anim/lessons.md (#1022) để chèn vào prompt tiếng Anh. Fork từ beast-sheet-lessons.mjs:
// họ hoạt ảnh của hồn thú đổi thành nhóm phụ thể `@A` / `@B` / `@C`, giai đoạn chỉ có `turnaround` và `direction`.
// Cú pháp và nguồn bài học nằm ở đầu chính file lessons.md; không đặt bài học ở nơi khác.
import { readFileSync } from "node:fs";
import { LESSONS_FILE, GROUPS } from "./phuthe-sheet-lib.mjs";

export { LESSONS_FILE };
export const STAGES = ["turnaround", "direction"];

/** Phân tích nội dung lessons.md → [{ stages: Set | null, groups: Set | null, text, note }]; dòng sai cú pháp ném lỗi (để test bắt). */
export function parseLessons(md) {
  const out = [];
  for (const [i, line] of md.split(/\r?\n/).entries()) {
    if (!/^- \[/.test(line)) continue;
    const m = /^- \[([^\]]*)\]\s+(.+?)(?:\s+\/\/\s+(.*))?$/.exec(line);
    if (!m) throw new Error(`lessons.md dòng ${i + 1}: sai cú pháp bài học`);
    const stages = new Set(), groups = new Set();
    for (const t of m[1].split(/[,\s]+/).filter(Boolean)) {
      if (t.startsWith("@")) { if (!GROUPS.includes(t.slice(1))) throw new Error(`lessons.md dòng ${i + 1}: nhóm lạ ${t}`); groups.add(t.slice(1)); }
      else if (t === "all") stages.add("all");
      else if (STAGES.includes(t)) stages.add(t);
      else throw new Error(`lessons.md dòng ${i + 1}: giai đoạn lạ ${t}`);
    }
    out.push({ stages: stages.size && !stages.has("all") ? stages : null, groups: groups.size ? groups : null, text: m[2].trim(), note: m[3]?.trim() ?? "" });
  }
  return out;
}

/** Bài học áp cho (giai đoạn, nhóm), theo thứ tự trong file. */
export function lessonsFor(stage, group, md = readFileSync(LESSONS_FILE, "utf8")) {
  return parseLessons(md).filter((l) => (!l.stages || l.stages.has(stage)) && (!l.groups || l.groups.has(group)));
}
