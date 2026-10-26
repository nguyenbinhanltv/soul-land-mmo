// Chế độ "--local" dùng chung cho beast-sheet-ci.mjs và ui-sheet-ci.mjs (#971): chạy ĐÚNG logic của job CI ngay ở máy,
// trước khi đẩy PR, để tờ sai cỡ không còn chỉ bị bắt sau khi push. Nhẹ: chỉ node:* + git, không Chrome / server.
//   --local            -> file đổi so với origin/main (hoặc main) + đã stage + sửa dở + file mới chưa add
//   --local --staged   -> chỉ file đã git add (hook pre-commit)
import { execFileSync } from "node:child_process";
import { ROOT } from "./lib.mjs";

function git(args) {
  try { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split(/\r?\n/).filter(Boolean); }
  catch { return null; }
}

/** Danh sách file đổi (đường dẫn gốc repo, dấu `/`), giới hạn trong các thư mục `paths` cho nhanh. */
export function localChangedFiles({ staged = false, paths = [] } = {}) {
  const spec = paths.length ? ["--", ...paths] : [];
  const out = new Set();
  const add = (l) => { for (const f of l ?? []) out.add(f); };
  add(git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", ...spec]));
  if (!staged) {
    const base = ["origin/main", "main"].find((r) => git(["rev-parse", "--verify", "--quiet", r]));
    if (base) add(git(["diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`, ...spec]));
    else console.warn("[kiểm tờ] không thấy origin/main hoặc main: chỉ kiểm file đã stage / đang sửa (git fetch origin để kiểm đủ).");
    add(git(["diff", "--name-only", "--diff-filter=ACMR", ...spec]));
    add(git(["ls-files", "--others", "--exclude-standard", ...spec]));
  }
  return [...out].sort();
}

/** Gợi ý sửa in sau các dòng lỗi (tiếng Việt, đủ để tự sửa không cần đọc CI). */
export const SIZE_HINT = [
  "Cách sửa lỗi kích thước: tờ A phải tỉ lệ 2:3 (đúng cỡ 1024×1536), tờ B 1:1, tờ một hướng 3:2 (1536×1024).",
  "Model trả sai tỉ lệ (ví dụ 948×1659) thì SINH LẠI tờ đó (tối đa 3 lượt mỗi khối); KHÔNG resize / cắt ảnh RAW cho khớp.",
  "Kiểm lại: npm run beast:check -- <loài>  (hoặc npm run ui:check cho UI Kit). Chi tiết: skill beast-anim / ui-kit.",
].join("\n");
