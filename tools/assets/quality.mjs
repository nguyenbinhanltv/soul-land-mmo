// Kiểm tra, nén lossless, đóng atlas và tạo preview cho asset theo manifest.
//   node tools/assets/quality.mjs --check [--manifest <file>] [--report <file>]
//   node tools/assets/quality.mjs --compress <thư mục PNG> --out <thư mục> [--report <file>]
//   node tools/assets/quality.mjs --atlas [--out <thư mục>] [--report <file>]
//   node tools/assets/quality.mjs --preview [--out <file>]
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import {
  ROOT, MANIFEST, OUTLINE, Img, readPng, encodePng, sheetSpec, allowedColors, accentColors, readGpl,
} from "./lib.mjs";

const ASSET_ROOT = path.join(ROOT, "shared", "assets");
const QUALITY_CONFIG = { atlasSize: 2048, padding: 2, outline: OUTLINE, palette: "art/palette.gpl" };

const entryKey = (entry) => typeof entry === "string" ? entry : entry?.key;
const rel = (file, root = ROOT) => path.relative(root, file).split(path.sep).join("/");
const assetFile = (file, root = ROOT) => {
  if (path.isAbsolute(file)) return file;
  const candidates = [path.join(root, file), path.join(root, "shared", "assets", "sprites", file)];
  return candidates.find(existsSync) ?? candidates[1];
};
const safe = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function manifestEntries(manifest, root = ROOT) {
  const seen = new Set(), entries = [], errors = [];
  for (const raw of manifest.sprites ?? []) {
    const key = entryKey(raw);
    if (!key) { errors.push("manifest có phần tử không có key"); continue; }
    if (seen.has(key)) errors.push(`${key}: trùng key trong manifest`);
    seen.add(key);
    const entry = typeof raw === "string" ? { key: raw } : raw;
    if (entry.blank) continue; // nửa phụ thể trống: không có file, client không tải (validate.mjs kiểm cờ, #974)
    const spec = sheetSpec(key, entry.frame, !!entry.iso, !!entry.static);
    if (!spec) { errors.push(`${key}: key không khớp sheetSpec`); continue; }
    const file = path.join(root, "shared", "assets", "sprites", spec.file);
    entries.push({
      key,
      entry,
      spec,
      file,
      url: `sprites/${spec.file}`,
      declaredOrigin: entry.origin ?? null,
      expectedOrigin: spec.layout?.origin ?? null,
    });
  }
  return { entries, errors };
}

function expectedPalette(entry, spec) {
  if (spec.kind === "portrait" || spec.kind === "ui2" || spec.kind === "fx" || spec.kind === "phaptuong" || spec.kind === "vhanim" || spec.static) return null;
  if (/^hs_(hair|outfit)_/.test(entry.key)) return new Set(["#3a3a3a", "#6a6a6a", "#9a9a9a", "#cacaca", OUTLINE]);
  const colors = new Set([...allowedColors(), ...accentColors()]);
  if (entry.map) {
    const file = path.join(ROOT, "art", "palettes", `${entry.map}.gpl`);
    if (existsSync(file)) for (const color of readGpl(file)) colors.add(color);
  }
  return colors;
}

/** Đọc thông tin chất lượng của một PNG mà không thay đổi ảnh. */
export function inspectPng(file, options = {}) {
  const bytes = readFileSync(file).length, img = readPng(file), colors = new Set(), badColors = new Set();
  let semiTransparent = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.get(x, y);
    if (!p[3]) continue;
    if (p[3] !== 255) semiTransparent++;
    const color = `#${((1 << 24) | (p[0] << 16) | (p[1] << 8) | p[2]).toString(16).slice(1)}`;
    colors.add(color);
    if (options.palette && !options.palette.has(color)) badColors.add(color);
  }
  return {
    file, bytes, size: [img.w, img.h], frame: options.frame ?? null, origin: options.origin ?? null,
    colors: colors.size, hasOutline: colors.has((options.outline ?? OUTLINE).toLowerCase()),
    badColors: [...badColors].sort(), semiTransparent,
  };
}

export function qualityCheck(manifest, root = ROOT) {
  const { entries, errors } = manifestEntries(manifest, root), warnings = [], assets = [];
  for (const { key, entry, spec, file, url, declaredOrigin, expectedOrigin } of entries) {
    if (!existsSync(file)) { errors.push(`${key}: thiếu ${rel(file, root)}`); continue; }
    let info;
    try { info = inspectPng(file, { frame: spec.frame ?? entry.frame, origin: expectedOrigin, palette: expectedPalette(entry, spec) }); }
    catch (error) { errors.push(`${key}: không đọc được PNG (${error.message})`); continue; }
    if (spec.size && info.size.some((n, i) => n !== spec.size[i])) errors.push(`${key}: cỡ ${info.size.join("×")}, cần ${spec.size.join("×")}`);
    if (info.semiTransparent) errors.push(`${key}: có ${info.semiTransparent} điểm alpha bán trong suốt`);
    if (info.badColors.length) errors.push(`${key}: màu ngoài bảng ${info.badColors.slice(0, 8).join(", ")}`);
    if (entry.frame && spec.frame && JSON.stringify(entry.frame) !== JSON.stringify(spec.frame)) errors.push(`${key}: manifest.frame lệch quy cách ${spec.frame.join("×")}`);
    if (declaredOrigin && JSON.stringify(declaredOrigin) !== JSON.stringify(expectedOrigin)) errors.push(`${key}: manifest.origin lệch neo ${expectedOrigin?.join(",") ?? "không có"}`);
    if (entry.bytes !== undefined && entry.bytes !== info.bytes) errors.push(`${key}: manifest.bytes ${entry.bytes}, thực tế ${info.bytes}`);
    // Phụ thể võ hồn là hai lớp b/f ghép quanh thân; viền có thể nằm ở thân hoặc lớp đối diện,
    // nên không thể kết luận từ từng PNG riêng. Các asset độc lập phải có viền và làm fail check.
    if (spec.kind === "honsu" || spec.kind === "beast" || spec.kind === "lpc" || spec.kind === "prop") {
      if (!info.hasOutline) errors.push(`${key}: thiếu viền ${OUTLINE}`);
    }
    assets.push({ key, url, ...info, origin: expectedOrigin, declaredOrigin, expectedFrame: spec.frame ?? null, expectedOrigin, kind: spec.kind });
  }
  return { generatedAt: new Date().toISOString(), manifest: rel(path.join(root, "shared/assets/sprites/manifest.json"), root), total: assets.length, errors, warnings, assets };
}

/** Nén lossless bằng bộ mã PNG nội bộ; không ghi đè nếu kết quả lớn hơn. */
export function optimizePng(input, output) {
  const before = readFileSync(input), encoded = encodePng(readPng(input));
  const chosen = encoded.length < before.length ? encoded : before;
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, chosen);
  return { input, output, before: before.length, after: chosen.length, changed: chosen !== before };
}

function pngFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name), stat = statSync(file);
    if (stat.isDirectory()) out.push(...pngFiles(file));
    else if (name.toLowerCase().endsWith(".png")) out.push(file);
  }
  return out;
}

export function compressTree(inputDir, outputDir) {
  const files = pngFiles(inputDir), results = [];
  for (const input of files) {
    const output = path.join(outputDir, path.relative(inputDir, input));
    results.push({ relative: path.relative(inputDir, input).split(path.sep).join("/"), ...optimizePng(input, output) });
  }
  return { input: inputDir, output: outputDir, files: results, before: results.reduce((n, r) => n + r.before, 0), after: results.reduce((n, r) => n + r.after, 0) };
}

function atlasEntries(manifest, root) {
  const { entries } = manifestEntries(manifest, root), byFile = new Map();
  for (const item of entries) if (!byFile.has(item.file)) byFile.set(item.file, item);
  return [...byFile.values()].map((item) => ({ key: item.key, file: item.file, url: item.url, frame: item.spec.frame, origin: item.expectedOrigin }));
}

export function packAtlas(entries, options = {}) {
  const root = options.root ?? ROOT, outDir = options.outDir ?? path.join(root, "shared/assets/sprites/atlas");
  const size = options.size ?? QUALITY_CONFIG.atlasSize, padding = options.padding ?? QUALITY_CONFIG.padding;
  mkdirSync(outDir, { recursive: true });
  const pages = [], sprites = {}, skipped = [];
  let page = null, x = 0, y = 0, rowH = 0;
  const newPage = () => { page = new Img(size, size); pages.push(page); x = 0; y = 0; rowH = 0; };
  const finishPage = (index) => { const image = pages[index]; const used = Object.values(sprites).filter((s) => s.page === index); const w = Math.max(1, ...used.map((s) => s.x + s.width)); const h = Math.max(1, ...used.map((s) => s.y + s.height)); const cropped = new Img(w, h); cropped.blit(image, 0, 0, w, h, 0, 0); const file = `atlas-${index}.png`; writeFileSync(path.join(outDir, file), encodePng(cropped)); return { file, width: w, height: h, bytes: statSync(path.join(outDir, file)).size }; };
  newPage();
  for (const item of entries) {
    const file = assetFile(item.file, root), img = readPng(file);
    if (img.w > size || img.h > size) { skipped.push({ key: item.key, size: [img.w, img.h], reason: `lớn hơn atlas ${size}` }); continue; }
    if (x + img.w > size) { x = 0; y += rowH + padding; rowH = 0; }
    if (y + img.h > size) { x = 0; y = 0; rowH = 0; newPage(); }
    const index = pages.length - 1;
    page.blit(img, 0, 0, img.w, img.h, x, y);
    sprites[item.key] = { page: index, x, y, width: img.w, height: img.h, frame: item.frame ?? [img.w, img.h], origin: item.origin ?? null, bytes: readFileSync(file).length };
    x += img.w + padding; rowH = Math.max(rowH, img.h);
  }
  const pageMeta = pages.map((_, i) => finishPage(i));
  const result = { version: 1, size, padding, pages: pageMeta, skipped, sprites };
  writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(result, null, 2) + "\n");
  return result;
}

export function preparePreview(report, options = {}) {
  const root = options.root ?? ROOT, outputFile = path.resolve(options.outputFile ?? path.join(root, "tools/assets/quality-preview.html"));
  const assets = (report.assets ?? []).map((asset) => {
    if (!asset.url?.startsWith("sprites/")) return asset;
    const source = path.join(root, "shared", "assets", asset.url);
    let url = path.relative(path.dirname(outputFile), source).split(path.sep).join("/");
    if (!url.startsWith(".")) url = `./${url}`;
    return { ...asset, url };
  });
  return { ...report, assets };
}

export function renderPreview(report, options = {}) {
  const title = safe(options.title ?? "Preview asset Đấu La Đại Lục"), assets = report.assets ?? [];
  const cards = assets.map((a) => `<article data-key="${safe(a.key)}"><img src="${safe(a.url)}" alt=""><div><strong>${safe(a.key)}</strong><small>${safe(a.kind ?? "asset")} · ${a.size?.join("×") ?? "?"} · ${a.bytes ?? "?"} B · neo ${a.origin?.join(",") ?? "—"}</small></div></article>`).join("\n");
  return `<!doctype html><meta charset="utf-8"><title>${title}</title><style>body{margin:0;background:#17131b;color:#f2e8d5;font:14px system-ui}header{position:sticky;top:0;padding:16px;background:#241c29;z-index:1}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;padding:16px}article{background:#2b2230;border:1px solid #514157;border-radius:8px;padding:8px}img{display:block;width:100%;height:160px;object-fit:contain;image-rendering:pixelated;background:repeating-conic-gradient(#3b3141 0 25%,#302738 0 50%) 0/16px 16px}strong,small{display:block;margin-top:6px;overflow-wrap:anywhere}small{color:#cbbbd0;font-size:12px}</style><header><h1>${title}</h1><div>${assets.length} asset · tổng ${(assets.reduce((n, a) => n + (a.bytes ?? 0), 0) / 1024).toFixed(1)} KB</div></header><main>${cards}</main>`;
}

export function writePreview(report, outputFile) {
  mkdirSync(path.dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, renderPreview(preparePreview(report, { outputFile })));
}

function writeReport(file, report) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(report, null, 2) + "\n"); }
function option(name, fallback = "") { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; }
function has(name) { return process.argv.includes(name); }

async function main() {
  const manifestFile = option("--manifest", MANIFEST), manifest = JSON.parse(readFileSync(manifestFile, "utf8")), reportFile = option("--report", "");
  if (has("--check")) {
    const report = qualityCheck(manifest), actualReport = reportFile || path.join(tmpdir(), "soul-land-mmo-quality-report.json");
    writeReport(actualReport, report);
    console.log(`[quality] ${report.total} asset, ${report.errors.length} lỗi, ${report.warnings.length} cảnh báo; báo cáo ${rel(actualReport)}`);
    if (report.errors.length) process.exitCode = 1;
    return;
  }
  if (has("--compress")) {
    const result = compressTree(option("--compress"), option("--out", path.join(ROOT, "tmp", "assets-compressed")));
    if (reportFile) writeReport(reportFile, result);
    console.log(`[quality] nén ${result.files.length} PNG: ${(result.before / 1024).toFixed(1)} KB → ${(result.after / 1024).toFixed(1)} KB`);
    return;
  }
  if (has("--atlas")) {
    const result = packAtlas(atlasEntries(manifest, ROOT), { root: ROOT, outDir: option("--out", path.join(ROOT, "shared/assets/sprites/atlas")) });
    if (reportFile) writeReport(reportFile, result);
    console.log(`[quality] atlas ${result.pages.length} trang, ${Object.keys(result.sprites).length} asset`);
    return;
  }
  if (has("--preview")) {
    const report = qualityCheck(manifest), out = option("--out", path.join(ROOT, "tools/assets/quality-preview.html"));
    writePreview(report, out);
    console.log(`[quality] preview ${rel(out)}`);
    return;
  }
  console.error("Cách dùng: quality.mjs --check | --compress <dir> --out <dir> | --atlas --out <dir> | --preview --out <file>");
  process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

