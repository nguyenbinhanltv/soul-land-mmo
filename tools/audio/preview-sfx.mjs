// Tạo trang nghe thử toàn bộ audio sprite SFX, gồm các nhóm T3 riêng của C4.
import { cp, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const assetRoot = path.resolve(option("--asset-root", path.join(repoRoot, "shared/assets/audio")));
const manifestPath = path.resolve(option("--manifest", path.join(assetRoot, "sfx/manifest.json")));
const outputPath = path.resolve(option("--out", path.join(os.tmpdir(), "soul-land-sfx-preview/index.html")));
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
const within = (root, relative, field) => {
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error(`${field} vượt thư mục: ${relative}`);
  return resolved;
};

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const outputRoot = path.dirname(outputPath);
await mkdir(outputRoot, { recursive: true });
const realAssetRoot = await realpath(assetRoot);
const realOutputRoot = await realpath(outputRoot);
const formats = ["ogg", "m4a"];
const copied = new Set();
for (const pack of Object.values(manifest.packs)) {
  for (const format of formats) {
    const relative = pack.files[format].path;
    if (copied.has(relative)) continue;
    copied.add(relative);
    const source = within(realAssetRoot, relative, "nguồn preview");
    const target = within(realOutputRoot, relative, "đích preview");
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target, { force: true });
  }
}
const sourceById = new Map((manifest.sources ?? []).map((source) => [source.id, source]));
const rows = manifest.clips.map((clip) => {
  const source = sourceById.get(clip.sourceId);
  const label = `${clip.group} · ${clip.id}`;
  const pack = manifest.packs[clip.pack];
  const fragment = `#t=${clip.start.toFixed(4)},${(clip.start + clip.duration).toFixed(4)}`;
  const sources = formats.map((format) => `<source src="${escapeHtml(`${pack.files[format].path}${fragment}`)}" type="${format === "ogg" ? "audio/ogg" : "audio/mp4"}">`).join("");
  return `<article><h2>${escapeHtml(label)}</h2><p>${escapeHtml(source?.author ?? "Không rõ tác giả")} · ${escapeHtml(source?.license ?? "Không rõ giấy phép")} · ${clip.t3 ? "T3 C4" : "SFX dùng chung"}</p><audio controls preload="none">${sources}Trình duyệt không hỗ trợ audio.</audio></article>`;
}).join("\n");
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nghe thử SFX C4</title><style>body{font:15px system-ui,sans-serif;max-width:1000px;margin:2rem auto;padding:0 1rem;background:#10151d;color:#e8eef6}article{border:1px solid #344253;border-radius:10px;padding:1rem;margin:1rem 0}h2{font-size:1rem;margin:0 0 .45rem}p{color:#aebdcb;margin:.3rem 0 .8rem}audio{width:min(100%,640px)}</style></head><body><h1>Nghe thử âm thanh SFX C4</h1><p>Đã xử lý ${manifest.clips.length} clip; chỉ nguồn CC0 / miễn phí bản quyền, không tiếng hô, không AI.</p>${rows}</body></html>`;
await writeFile(outputPath, html);
console.log(`Artifact nghe thử SFX: ${outputPath}`);
