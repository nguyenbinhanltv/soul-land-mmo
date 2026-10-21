import { cp, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { safeResolve, validateManifest } from "./lib.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const assetRoot = path.resolve(option("--asset-root", path.join(repoRoot, "shared/assets")));
const manifestPath = path.resolve(option("--manifest", path.join(assetRoot, "audio/manifest.json")));
const outputPath = path.resolve(option("--out", path.join(repoRoot, "artifact/audio-preview/index.html")));

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
validateManifest(manifest);
await mkdir(path.dirname(outputPath), { recursive: true });
const realAssetRoot = await realpath(assetRoot);
const previewRoot = path.dirname(outputPath);
const realPreviewRoot = await realpath(previewRoot);
const resolveWithinRoot = (root, relative, field) => {
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${field} escapes its root: ${relative}`);
  }
  return resolved;
};
const copied = new Set();
for (const item of manifest.items) {
  for (const format of ["ogg", "m4a"]) {
    const relative = item.files[format].path;
    if (copied.has(relative)) continue;
    copied.add(relative);
    const source = await safeResolve(realAssetRoot, relative);
    const target = resolveWithinRoot(realPreviewRoot, relative, "preview target");
    await mkdir(path.dirname(target), { recursive: true });
    const realTargetParent = await realpath(path.dirname(target));
    resolveWithinRoot(realPreviewRoot, path.relative(realPreviewRoot, realTargetParent), "preview target parent");
    await cp(source, target, { force: true });
  }
}
const rows = manifest.items.map((item) => {
  const source = manifest.sources.find((entry) => entry.id === item.sourceId);
  const label = `${item.id} · ${item.group}${item.mapId ? ` · ${item.mapId}` : ""}`;
  return `<article><h2>${escapeHtml(label)}</h2><p>${escapeHtml(source?.author ?? "Không rõ tác giả")} · ${escapeHtml(source?.license ?? "Không rõ license")} · ${item.preload ? "preload" : "lazy theo map/sự kiện"}</p><audio controls preload="none"><source src="${escapeHtml(item.files.ogg.path)}" type="audio/ogg"><source src="${escapeHtml(item.files.m4a.path)}" type="audio/mp4">Trình duyệt không hỗ trợ audio.</audio></article>`;
}).join("\n");
const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nghe thử SFX #133</title><style>body{font:16px system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;background:#10151d;color:#e8eef6}article{border:1px solid #344253;border-radius:10px;padding:1rem;margin:1rem 0}audio{width:min(100%,640px)}small{color:#aebdcb}</style></head>
<body><h1>Nghe thử âm thanh #133</h1><p><small>Manifest ${escapeHtml(manifest.generatedAt)} · OGG preload ${manifest.preload.bytes.ogg} B · M4A preload ${manifest.preload.bytes.m4a} B</small></p>${rows}</body></html>
`;
await writeFile(outputPath, html);
console.log(`Artifact nghe thử: ${outputPath}`);
