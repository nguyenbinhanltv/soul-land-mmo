// Tờ I riêng cho ba khung mảnh võ hồn (#1305); dùng nguyên bộ prompt / kiểm / cắt UI.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, Img, encodePng, readPng } from "./lib.mjs";
import { areaDown } from "./ui-kit-lib.mjs";
import { shardKind, shardKit } from "./manh-sheet-spec.mjs";
export { shardKind, shardKit } from "./manh-sheet-spec.mjs";
import { buildPrompt } from "./ui-sheet-prompt.mjs";
import { lessonsFor } from "./ui-sheet-lessons.mjs";
import { analyzeUiSheet, writeReport, toMarkdown } from "./ui-sheet-check.mjs";
import { cutUiSheet } from "./ui-sheet-cut.mjs";

export const shardPrompt = () => buildPrompt(shardKind, {
  // Ba bài cuối chỉ nói về lưới / họ menu, không áp sang khung mảnh.
  lessons: lessonsFor("I", undefined, "manh").filter((l) => !/four equally spaced|menu icon|menu family/.test(l.text)),
  family: "three empty broken martial soul shard frames, increasing rarity left to right. Original approved INK and PAPER UI kit only: ivory rice paper rim with a thin pale bronze bevel and a flat near-black ink interior. Each piece is one solid contiguous silhouette with a broad empty center for a portrait inserted later; no holes, no portrait now. Keep each piece approximately square, same size and outline weight. Silhouettes must differ in grayscale. Pieces fill at most 70 percent of their cell, with at least five percent of the sheet width of empty magenta between pieces and wide margins. Use flat one or two colour bands, no texture noise, no decorative marks inside",
});

export const FRAME_DIR = path.join(ROOT, "art/src/ui-kit/khung-manh");
export const RARITIES = ["SR", "SSR", "UR"];
// Chuẩn hóa ảnh model thành mẫu năm sắc 32×32, giữ hình và mảng giấy / đồng.
// Chỉ mẫu này dùng màu đánh dấu; khi ghép, đồng đổi sang col của võ hồn.
export const FRAME_PALETTE = [[26, 16, 32], [35, 29, 39], [110, 75, 42], [185, 138, 75], [240, 220, 175]];
export function frameFromMaster(master) {
  const small = areaDown(master, Math.max(master.w, master.h) / 30);
  const out = new Img(32, 32), ox = Math.floor((32 - small.w) / 2), oy = Math.floor((32 - small.h) / 2);
  for (let y = 0; y < small.h; y++) for (let x = 0; x < small.w; x++) {
    const p = small.get(x, y); if (p[3] < 128) continue;
    const l = (p[0] + p[1] + p[2]) / 3;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => x + dx < 0 || y + dy < 0 || x + dx >= small.w || y + dy >= small.h || small.alpha(x + dx, y + dy) < 128);
    const i = edge ? 0 : l < 65 ? 1 : l < 125 ? 2 : l < 195 ? 3 : 4;
    out.set(x + ox, y + oy, [...FRAME_PALETTE[i], 255]);
  }
  return out;
}
export function cutFrames(file) {
  const cut = cutUiSheet({ img: readPng(file), kit: shardKit(), kindId: "I", name: "toI-manh", soft: true, mirror: false });
  return cut.check.pieces.map((p) => frameFromMaster(p.master));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, file, out] = process.argv.slice(2);
  if (mode === "prompt") {
    writeFileSync(file, shardPrompt() + "\n");
  } else if (mode === "check") {
    const r = analyzeUiSheet(file, { kit: shardKit(), kindId: "I", soft: process.argv.includes("--soft") });
    mkdirSync(out, { recursive: true });
    writeReport(r, out);
    console.log(toMarkdown(r));
    process.exitCode = r.level === "chặn" ? 1 : 0;
  } else if (mode === "cut") {
    const frames = cutFrames(file);
    mkdirSync(FRAME_DIR, { recursive: true });
    frames.forEach((im, i) => writeFileSync(path.join(FRAME_DIR, `${RARITIES[i]}.png`), encodePng(im)));
  } else throw new Error("Dùng: node tools/assets/manh-sheet.mjs prompt <prompt.txt> | check <tờ.png> <thư mục ngoài repo> [--soft] | cut <tờ.png>");
}
