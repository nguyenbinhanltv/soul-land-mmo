import { access, readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ffmpegPath from "ffmpeg-static";
import { validateAudioCredits, validateManifestDurations, validateManifestMatchesCatalog } from "./lib.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const assetRoot = path.resolve(option("--asset-root", path.join(repoRoot, "shared/assets")));
const manifestPath = path.resolve(option("--manifest", path.join(assetRoot, "audio/manifest.json")));
const catalogPath = path.resolve(option("--catalog", path.join(repoRoot, "tools/audio/catalog.json")));
const creditsPath = path.resolve(option("--credits", path.join(repoRoot, "art/CREDITS.md")));

function durationOf(file) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg-static không cung cấp đường dẫn executable"));
      return;
    }
    const child = spawn(ffmpegPath, ["-hide_banner", "-i", file, "-f", "null", "-"], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (code !== 0 || !match) {
        reject(new Error(`Không đọc được thời lượng audio: ${file}`));
        return;
      }
      resolve(Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]));
    });
  });
}

try {
  const [catalog, manifest] = await Promise.all([
    readFile(catalogPath, "utf8").then(JSON.parse),
    readFile(manifestPath, "utf8").then(JSON.parse),
  ]);
  validateManifestMatchesCatalog({ catalog, manifest });
  const checked = new Set();
  const measuredDurations = new Map();
  for (const item of manifest.items) {
    for (const format of ["ogg", "m4a"]) {
      const relative = item.files[format].path;
      const target = path.resolve(assetRoot, relative);
      if (target !== assetRoot && !target.startsWith(`${assetRoot}${path.sep}`)) throw new Error(`manifest path escapes asset root: ${relative}`);
      if (!checked.has(target)) {
        await access(target);
        checked.add(target);
      }
      const bytes = (await stat(target)).size;
      if (bytes !== item.files[format].bytes) throw new Error(`byte mismatch for ${relative}`);
      const key = `${format}:${relative}`;
      if (!measuredDurations.has(key)) measuredDurations.set(key, await durationOf(target));
    }
  }
  validateManifestDurations(manifest, measuredDurations);
  validateAudioCredits({ manifest, creditsText: await readFile(creditsPath, "utf8") });
  console.log(`Audio manifest hợp lệ: ${manifest.items.length} item, ${checked.size} file, preload OGG ${manifest.preload.bytes.ogg} B / M4A ${manifest.preload.bytes.m4a} B`);
} catch (error) {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
