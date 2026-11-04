// Nhập pose Codex cho NPC (#1552). RAW luôn ở ngoài repo.
// node tools/assets/npc-reply-import.mjs --id <NPC> --raw <RAW.png> --out <thư mục tạm> [--install]
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, SPRITES, MANIFEST, Img, readPng, encodePng, appendManifestEntry } from "./lib.mjs";

const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const equal = (a, b) => a.every((v, i) => v === b[i]);
function inside(x, y, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [a, b] = polygon[i], [c, d] = polygon[j];
    if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) hit = !hit;
  }
  return hit;
}
function bounds(img, x0, x1, y0 = 0, y1 = img.h) {
  let l = x1, r = x0, t = y1, b = y0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (img.alpha(x, y) >= 128) {
    l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
  }
  if (l > r || t > b) throw new Error("Ô ảnh trống");
  return [l, t, r - l + 1, b - t + 1];
}
function nearest(p, palette) {
  let best = palette[0], distance = Infinity;
  for (const q of palette) {
    const d = p.slice(0, 3).reduce((sum, v, i) => sum + (v - q[i]) ** 2, 0);
    if (d < distance) { best = q; distance = d; }
  }
  return best;
}

/** Giữ stencil đầu LPC (cả râu / tóc đuôi), nhập màu pose từ ảnh sinh rồi hạ đầu một điểm.
 * Thân / tay / chân ngoài hợp hai stencil giữ nguyên từng byte; không cắt ngang hàng 29. */
export function importReply(source, raw, spec, mask) {
  const out = new Img(64 * 5, 64), report = [];
  for (let row = 0; row < 5; row++) {
    const col = row === 0 ? 0 : row === 4 ? 2 : 1, polygon = spec.masks?.[col];
    const base = new Img(64, 64);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) base.set(x, y, source.get(x, row * 64 + y));
    const oldMask = (x, y) => y >= 0 && y < 64 && (mask ? mask.alpha(x, row * 64 + y) > 0 : inside(x + .5, y + .5, polygon)) && base.alpha(x, y) > 0;
    const newMask = (x, y) => oldMask(x, y - 1);
    const bb = bounds(base, 0, 64), rb = bounds(raw, Math.floor(col * raw.w / 3), Math.floor((col + 1) * raw.w / 3));
    const headPalette = [], clothPalette = [];
    const add = (list, p) => { if (p[3] && !list.some((q) => equal(q, p))) list.push(p); };
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      if (oldMask(x, y)) add(headPalette, base.get(x, y));
      if (x >= 28 && x <= 37 && y >= 41 && y <= 44) add(clothPalette, base.get(x, y));
    }
    if (!headPalette.length || !clothPalette.length) throw new Error("Stencil / bảng màu trống");
    const sample = (x, y) => raw.get(
      Math.min(rb[0] + rb[2] - 1, rb[0] + Math.floor((x - bb[0] + .5) * rb[2] / bb[2])),
      Math.min(rb[1] + rb[3] - 1, rb[1] + Math.floor((y - bb[1] + .5) * rb[3] / bb[3])));
    let changed = 0;
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      let p = base.get(x, y);
      if (oldMask(x, y)) p = y < 29 ? [0, 0, 0, 0] : nearest(sample(x, y), clothPalette);
      if (newMask(x, y)) {
        const q = sample(x, y - 1);
        p = q[3] >= 128 ? nearest(q, headPalette) : base.get(x, y - 1);
      }
      if (!equal(p, base.get(x, y))) {
        changed++;
        if (!oldMask(x, y) && !newMask(x, y)) throw new Error("Đổi pixel ngoài stencil");
      }
      out.set(row * 64 + x, y, p);
    }
    if (!changed) throw new Error("Pose trùng idle");
    report.push({ row, rawCell: col, rawBounds: rb, changed });
  }
  return { image: out, report };
}

function main() {
  const args = process.argv.slice(2), opt = (name) => args[args.indexOf(name) + 1];
  const id = opt("--id"), rawFile = opt("--raw"), outDir = opt("--out");
  if (!args.includes("--id") || !args.includes("--raw") || !args.includes("--out") || !/^[a-z_]+$/.test(id)) throw new Error("Cần --id <NPC> --raw <RAW.png> --out <thư mục>");
  const record = JSON.parse(readFileSync(path.join(ROOT, "art/src/npc-reply", id, "nguon.json"), "utf8"));
  const sourceFile = path.join(ROOT, record.source);
  if (sha(rawFile) !== record.raw.sha256 || sha(sourceFile) !== record.sourceSha256) throw new Error("Hash RAW / LPC gốc không khớp hồ sơ");
  const source = readPng(sourceFile), raw = readPng(rawFile);
  if (source.w !== 1536 || source.h !== 384 || raw.w !== record.raw.width || raw.h !== record.raw.height) throw new Error("Kích thước nguồn sai hồ sơ");
  const maskFile = record.maskSource && path.join(ROOT, record.maskSource);
  if (maskFile && sha(maskFile) !== record.maskSha256) throw new Error("Hash stencil LPC không khớp");
  const mask = maskFile ? readPng(maskFile) : undefined;
  if (mask && (mask.w !== source.w || mask.h !== source.h)) throw new Error("Stencil sai kích thước");
  const { image, report } = importReply(source, raw, record, mask);
  mkdirSync(outDir, { recursive: true });
  const filename = `${id}.png`, bytes = encodePng(image);
  if (createHash("sha256").update(bytes).digest("hex") !== record.outputSha256) throw new Error("Đầu ra không khớp hash đã soát");
  writeFileSync(path.join(outDir, filename), bytes);
  if (args.includes("--install")) {
    const dir = path.join(SPRITES, "iso/npc-reply"); mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, filename), bytes);
    const text = readFileSync(MANIFEST, "utf8"), key = `npc_reply_${id}`;
    const entry = { key, frame: [64, 64], iso: true, ...(record.lpc ? { replyLpc: record.lpc } : {}) };
    const old = JSON.parse(text).sprites.find((e) => (typeof e === "string" ? e : e.key) === key);
    if (!old) writeFileSync(MANIFEST, appendManifestEntry(text, entry));
    else if (old.replyLpc !== entry.replyLpc) {
      const block = new RegExp(`    \\{\\s*"key": "${key}",[^{}]*?\\n    \\}`);
      if (!block.test(text)) throw new Error("Không tìm thấy khối manifest pose");
      writeFileSync(MANIFEST, text.replace(block, JSON.stringify(entry, null, 2).split("\n").map((s) => `    ${s}`).join("\n")));
    }
  }
  console.log(JSON.stringify({ id, report, sha256: createHash("sha256").update(bytes).digest("hex") }, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
