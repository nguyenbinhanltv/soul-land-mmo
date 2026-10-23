// Kiểm hiệu ứng G2: catalog hợp lệ, manifest khớp catalog, tệp đúng byte và đúng thời lượng giải mã, bảng ghi công khớp, tổng < 8 MB.
import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ffmpegPath from "ffmpeg-static";
import { validateSfxCatalog, validateSfxCredits, validateSfxManifest } from "./sfx-lib.mjs";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const assetRoot = path.join(repoRoot, "shared/assets/audio");

function decodedSeconds(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ["-hide_banner", "-i", file, "-f", "null", "-"], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (c) => { err += c; });
    child.once("error", reject);
    child.once("close", (code) => {
      const times = [...err.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)].at(-1);
      if (code !== 0 || !times) return reject(new Error(`Không giải mã được ${file}`));
      resolve(+times[1] * 3600 + +times[2] * 60 + +times[3]);
    });
  });
}

try {
  const [catalog, manifest, credits] = await Promise.all([
    readFile(path.join(repoRoot, "tools/audio/sfx-catalog.json"), "utf8").then(JSON.parse),
    readFile(path.join(assetRoot, "sfx/manifest.json"), "utf8").then(JSON.parse),
    readFile(path.join(repoRoot, "art/CREDITS.md"), "utf8"),
  ]);
  validateSfxCatalog(catalog);
  const { totalBytes } = validateSfxManifest(manifest, catalog);
  validateSfxCredits(credits, manifest);
  for (const [name, pack] of Object.entries(manifest.packs)) {
    for (const format of ["ogg", "m4a"]) {
      const file = path.join(assetRoot, pack.files[format].path);
      if ((await stat(file)).size !== pack.files[format].bytes) throw new Error(`Lệch byte: ${pack.files[format].path}`);
      const sec = await decodedSeconds(file);
      if (Math.abs(sec - pack.duration) > 0.1) throw new Error(`Gói ${name}.${format}: giải mã ${sec.toFixed(2)}s, manifest ${pack.duration}s`);
    }
  }
  console.log(`SFX hợp lệ: ${manifest.clips.length} clip, ${new Set(manifest.clips.map((c) => c.group)).size} nhóm, OGG ${totalBytes} B`);
} catch (error) {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
