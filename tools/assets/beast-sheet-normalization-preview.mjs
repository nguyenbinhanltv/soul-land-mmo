// Bundle kiểm kích thước cutter: dùng RAW cố định, không chứng nhận hướng/pose hay nhập asset vào game.
// node tools/assets/beast-sheet-normalization-preview.mjs --out <thư mục ngoài repo>
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, readPng, encodePng } from "./lib.mjs";
import { DIRS, ANIMS } from "./beast-sheet-lib.mjs";
import { cutSpecies } from "./beast-sheet-cut.mjs";
import { buildPreview } from "./beast-sheet-preview.mjs";

const RAW_COMMIT = "65ac0732c4e59e9babd0553097de7367d0d56425";
const RAW_ROOT = `https://raw.githubusercontent.com/nguyenbinhanltv/soul-land-mmo/${RAW_COMMIT}/art/src/beast-anim/bang_giap_cu_quy`;
const TURTLE_HASHES = {
  A: "7816619a51c15e87d562e6db3d6224d7152e6493af26c0215371b9f2f7c649f0",
  B: "386b0a90b00f1146a9e4416604acd8fc751b1c5eaa1630e26c7b255b447da25a",
};
const TITAN_HASHES = {
  A: "dce40e4ed49f98a93f02abd739adb41fa0126e572080bdd34679fe6b5cd1230d",
  B: "a1bbb5f1525f01bad2b42e576b0a329f6f7e81517820fdd6a5f72108a67b1299",
  C: "a87a8f549be24f057f8e6e399574ca0206b92e0824a6e4ec829086e4aa2c049f",
  D: "8b938c2aac0fae0554beef4d5cdb8ee71f187baa0fcc922ece643b3e9048c451",
  E: "1061007e6a0fa01fc4c51e97d6963e1dce7ba05731b7a831f339100c8e0af553",
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const verify = (bytes, expected, label) => { if (sha256(bytes) !== expected) throw new Error(`SHA256 nguồn không khớp: ${label}`); };
function bounds(im) {
  let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y)) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { width: x1 - x0 + 1, height: y1 - y0 + 1, footBottom: y1 };
}

/** Đọc RAW theo loài, ghi before/after + preview offline; trả số đo/hash, kiểm nguồn không bị ghi lại. */
export function buildComparison(species, sourceFiles, out) {
  const sources = {}, sheets = {};
  for (const [id, file] of Object.entries(sourceFiles)) {
    const bytes = readFileSync(file), im = readPng(file);
    sheets[id] = im; sources[id] = { sha256: sha256(bytes), size: [im.w, im.h] };
  }
  const before = cutSpecies({ species, sheets }), after = cutSpecies({ species, sheets, normalizeSize: true });
  for (const [id, source] of Object.entries(sources)) after.report.sheets[id].sourceSha256 = source.sha256;
  for (const [mode, res] of [["before", before], ["after", after]]) {
    const dir = path.join(out, mode); mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${species}_anim.png`), encodePng(res.sheet));
    json(path.join(dir, "manifest-entry.json"), res.entry); json(path.join(dir, "_report.json"), res.report);
    buildPreview(species, dir, 1);
  }
  for (const [id, file] of Object.entries(sourceFiles)) verify(readFileSync(file), sources[id].sha256, id);
  return {
    species, sources, normalization: after.report.sheets,
    frames: { before: before.report.frames, after: after.report.frames },
    commonScale: { before: before.report.scale, after: after.report.scale },
    pixelBytesEqual: Buffer.from(before.sheet.data).equals(Buffer.from(after.sheet.data)),
    pixelSha256: { before: sha256(before.sheet.data), after: sha256(after.sheet.data) },
    idle: DIRS.map((dir) => ({ dir, before: bounds(before.frames.get(`${dir}/idle/0`)), after: bounds(after.frames.get(`${dir}/idle/0`)) })),
  };
}

function gallery(evidence) {
  const sections = evidence.comparisons.map((r) => {
    const links = ["before", "after"].map((mode) => `<a href="${r.species}/${mode}/preview/index.html">${mode}: trang đầy đủ</a> · <a href="${r.species}/${mode}/${r.species}_anim.png">PNG</a> · <a href="${r.species}/${mode}/_report.json">report</a>`).join("<br>");
    const rows = ANIMS.flatMap(([anim]) => ["before", "after"].map((mode) => `<tr><th>${anim} / ${mode}</th>${DIRS.map((dir) => `<td><img src="${r.species}/${mode}/preview/gif/${anim}_${dir}.gif" alt="${anim} ${dir} ${mode}"></td>`).join("")}</tr>`)).join("");
    return `<h2>${r.species}</h2><p>Common scale ${r.commonScale.before} → ${r.commonScale.after}; số khung ${r.frames.before} / ${r.frames.after}; byte pixel trùng: ${r.pixelBytesEqual}.</p><p>${links}</p><details><summary>Số đo idle 5 hướng</summary><pre>${JSON.stringify(r.idle, null, 2)}</pre></details><div class="scroll"><table><tr><th>Hoạt ảnh</th>${DIRS.map((d) => `<th>${d}</th>`).join("")}</tr>${rows}</table></div>`;
  }).join("");
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kiểm kích thước cutter</title><style>body{font:15px system-ui;margin:24px;background:#f7f3e9;color:#201c28}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:8px;text-align:center}img{image-rendering:pixelated;background:repeating-conic-gradient(#ddd 0% 25%,#eee 0% 50%) 0/12px 12px}a{color:#205690}.scroll{overflow:auto}pre{white-space:pre-wrap}</style><h1>Kiểm kích thước cutter — tải zip và mở index.html</h1><p>Chỉ kiểm canvas/scale; không duyệt hướng N, pose hoặc ảnh game. Pilot N thất bại; orientation của #798 còn mở. Không source override, không sửa RAW.</p><p>RAW A69 1024×1536; B71 1254×1254 với factor 1024/1254. Thái Thản Cự Viên đủ A–E 1536×1024: factor 1. Không có cặp RAW nhỏ đúng cỡ đã xác minh; fixture nhỏ trong test chỉ là hình học giả kiểm công cụ.</p><p>Checkout CI: <code>${evidence.checkoutSha}</code><br>PR head: <code>${evidence.prHeadSha ?? "không có (chạy local)"}</code><br>Base: <code>${evidence.baseSha ?? "không có (chạy local)"}</code>. Checkout merge CI không đồng nghĩa PR head.</p><p><a href="evidence.json">Evidence đầy đủ: SHA nguồn, kích thước thật, mode, factor và số đo</a></p>${sections}</html>`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--out") throw new Error("Dùng: node tools/assets/beast-sheet-normalization-preview.mjs --out <thư mục ngoài repo>");
  const out = path.resolve(args[1]), temp = mkdtempSync(path.join(os.tmpdir(), "beast-normalization-"));
  mkdirSync(out, { recursive: true });
  try {
    const turtle = {}, titan = {};
    for (const [id, expected] of Object.entries(TURTLE_HASHES)) {
      const url = `${RAW_ROOT}/to${id}.png`, response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`Không tải được RAW ${id}: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer()); verify(bytes, expected, url);
      turtle[id] = path.join(temp, `to${id}.png`); writeFileSync(turtle[id], bytes);
    }
    for (const [id, expected] of Object.entries(TITAN_HASHES)) {
      titan[id] = path.join(ROOT, "art/src/beast-anim/thai_than_cu_vien", `to${id}.png`);
      verify(readFileSync(titan[id]), expected, `Thái Thản Cự Viên ${id}`);
    }
    const comparisons = [buildComparison("bang_giap_cu_quy", turtle, path.join(out, "bang_giap_cu_quy")), buildComparison("thai_than_cu_vien", titan, path.join(out, "thai_than_cu_vien"))];
    const evidence = {
      scope: "size-only; không duyệt heading/pose/N; không nhập ảnh game",
      checkoutSha: execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(),
      prHeadSha: process.env.NORMALIZATION_HEAD_SHA ?? null, baseSha: process.env.NORMALIZATION_BASE_SHA ?? null,
      rawSources: { turtleCommit: RAW_COMMIT, turtleBaseUrl: RAW_ROOT, titanCommit: "920f61319aed7e7877f712e116f3f8306837d3a5", titanLocation: "art/src/beast-anim/thai_than_cu_vien" },
      comparisons,
    };
    json(path.join(out, "evidence.json"), evidence); writeFileSync(path.join(out, "index.html"), gallery(evidence));
    if (!comparisons[1].pixelBytesEqual) throw new Error("Hồi quy: Thái Thản Cự Viên factor1 đổi byte pixel");
    if (comparisons.some((r) => r.frames.before !== 110 || r.frames.after !== 110)) throw new Error("Preview thiếu khung; xem report");
    console.log(`Bundle size-only: ${out}/index.html; factor1 byteexact; RAW SHA256 khớp.`);
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exitCode = 1; });
