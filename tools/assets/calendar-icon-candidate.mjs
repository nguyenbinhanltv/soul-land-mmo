// Cắt thử #1597 ngoài shared/assets; chỉ nhập sau khi chủ repo duyệt mỹ thuật.
// node tools/assets/calendar-icon-candidate.mjs --out <thư mục ngoài repo>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { ROOT, readPng, decodePng, encodePng } from "./lib.mjs";
import { cutUiSheet } from "./ui-sheet-cut.mjs";
import { fitFrame } from "./menu-icon-import.mjs";

export const EVENTS = [
  ["king", "Thú vương tà hóa", "king:*"],
  ["world", "Boss thế giới", "world:*"],
  ["arena", "Đại Đấu Hồn Trường", "always:arena"],
  ["auto", "Tự săn", "always:auto"],
  ["daily", "Làm mới ngày", "reset:daily"],
  ["weekly", "Làm mới tuần", "reset:tong"],
];
export function buildCandidate() {
  const dir = path.join(ROOT, "art/src/ui-kit/calendar-1597"), source = JSON.parse(readFileSync(path.join(dir, "nguon.json"), "utf8"));
  for (const [name, hash] of [["RAW.png", source.raw_sha256], ["prompt.txt", source.prompt_sha256]]) {
    if (createHash("sha256").update(readFileSync(path.join(dir, name))).digest("hex") !== hash) throw new Error(`SHA256 nguồn lệch: ${name}`);
  }
  const img = readPng(path.join(dir, "RAW.png"));
  if (img.w !== 1254 || img.h !== 1254) throw new Error(`RAW sai cỡ native: ${img.w}×${img.h}`);
  // Bản làm việc: alpha thật -> màu khóa cho cutter UI hiện có; RAW không ghi lại.
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.get(x, y); if (p[3] < 128) img.set(x, y, [255, 0, 255, 255]);
    else img.set(x, y, [p[0], p[1], p[2], 255]);
  }
  const cut = cutUiSheet({ img, name: "calendar-1597", kindId: "I", prefix: "calendar_", soft: true });
  const files = new Map();
  for (const [i, [id]] of EVENTS.entries()) {
    const piece = decodePng(cut.files.get(`2x/ui2_calendar_icon_${String(i + 1).padStart(2, "0")}.png`));
    for (const size of [24, 32]) files.set(`${id}-${size}.png`, encodePng(fitFrame(piece, size)));
  }
  return { files, issues: cut.check.issues };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[process.argv.indexOf("--out") + 1];
  if (!process.argv.includes("--out") || !out) throw new Error("Cần --out ngoài repo để duyệt loại B");
  const target = path.resolve(out), relative = path.relative(ROOT, target);
  if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) throw new Error("Bản thử phải ở ngoài repo");
  const { files, issues } = buildCandidate(); mkdirSync(target, { recursive: true });
  for (const [name, bytes] of files) writeFileSync(path.join(target, name), bytes);
  console.log(JSON.stringify({ files: files.size, issues }, null, 2));
}
