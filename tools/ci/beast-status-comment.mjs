// Đăng sổ trạng thái hoạt ảnh hồn thú lên comment ghim ở issue #766 (#973): tìm comment của bot có dấu `<!-- beast-status -->`, sửa nội dung;
// chưa có thì tạo mới. Chỉ cần GITHUB_TOKEN (quyền issues: write), qua `gh` có sẵn trên runner.
//   node tools/ci/beast-status-comment.mjs --file <_status.md> [--issue 766] [--run-url <link job>] [--dry-run]
// Env: GH_TOKEN, GITHUB_REPOSITORY. Nội dung quá 65536 ký tự (giới hạn comment) thì cắt ở ranh giới dòng, kèm link job summary / artifact.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MARKER = "<!-- beast-status -->";
export const BOT = "github-actions[bot]";
const LIMIT = 65000; // dưới 65536 để chừa chỗ cho dấu ẩn và dòng báo cắt

/** Thân comment: dấu ẩn + bảng; vượt LIMIT thì cắt ở ranh giới dòng và trỏ tới job summary / artifact (bản đầy đủ). */
export function buildBody(md, { runUrl = "", limit = LIMIT } = {}) {
  const head = `${MARKER}\n`, foot = (cut) => `\n\n---\n${cut ? `_Bảng đã cắt gọn vì quá dài cho một comment; bản đầy đủ ở job summary / artifact của ` : "_Tự sinh bởi workflow `beast-status` (không sửa tay); chạy tại "}${runUrl ? `[lượt chạy](${runUrl})` : "workflow `beast-status`"}._\n`;
  const full = head + md.trimEnd() + foot(false);
  if (full.length <= limit) return full;
  const room = limit - head.length - foot(true).length - 1;
  const cut = md.slice(0, room), nl = cut.lastIndexOf("\n");
  return head + cut.slice(0, nl > 0 ? nl : room).trimEnd() + foot(true);
}

/** Comment đầu tiên của bot có dấu ẩn (người khác dán dấu giả thì bỏ qua). */
export const findComment = (comments) => comments.find((c) => c.user?.login === BOT && typeof c.body === "string" && c.body.startsWith(MARKER));

function gh(args, input) {
  const r = spawnSync("gh", args, { encoding: "utf8", input, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`gh ${args.slice(0, 3).join(" ")}: ${r.stderr || r.stdout}`);
  return r.stdout;
}

function main(argv) {
  const o = { issue: "766" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--file") o.file = argv[++i];
    else if (argv[i] === "--issue") o.issue = argv[++i];
    else if (argv[i] === "--run-url") o.runUrl = argv[++i];
    else if (argv[i] === "--dry-run") o.dry = true;
    else throw new Error(`tùy chọn lạ: ${argv[i]}`);
  }
  if (!o.file) throw new Error("thiếu --file <_status.md>");
  const body = buildBody(readFileSync(o.file, "utf8"), { runUrl: o.runUrl });
  if (o.dry) { console.log(body); return; }
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error("thiếu GITHUB_REPOSITORY");
  // `--paginate` nối nhiều trang JSON; --slurp gom thành một mảng các trang
  const pages = JSON.parse(gh(["api", "--paginate", "--slurp", `repos/${repo}/issues/${o.issue}/comments?per_page=100`]));
  const found = findComment(pages.flat());
  const payload = JSON.stringify({ body });
  if (found) {
    gh(["api", "-X", "PATCH", `repos/${repo}/issues/comments/${found.id}`, "--input", "-"], payload);
    console.log(`đã sửa comment ${found.html_url} (${body.length} ký tự)`);
  } else {
    const out = JSON.parse(gh(["api", "-X", "POST", `repos/${repo}/issues/${o.issue}/comments`, "--input", "-"], payload));
    console.log(`đã tạo comment ${out.html_url} (${body.length} ký tự); chủ repo ghim comment này một lần`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
