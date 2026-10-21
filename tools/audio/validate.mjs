import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { validateCatalog, validateManifest } from "./lib.mjs";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const assetRoot = path.resolve(option("--asset-root", path.join(repoRoot, "shared/assets")));
const manifestPath = path.resolve(option("--manifest", path.join(assetRoot, "audio/manifest.json")));
const catalogPath = path.resolve(option("--catalog", path.join(repoRoot, "tools/audio/catalog.json")));

try {
  const [catalog, manifest] = await Promise.all([
    readFile(catalogPath, "utf8").then(JSON.parse),
    readFile(manifestPath, "utf8").then(JSON.parse),
  ]);
  validateCatalog(catalog);
  validateManifest(manifest);
  const checked = new Set();
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
    }
  }
  console.log(`Audio manifest hợp lệ: ${manifest.items.length} item, ${checked.size} file, preload OGG ${manifest.preload.bytes.ogg} B / M4A ${manifest.preload.bytes.m4a} B`);
} catch (error) {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
}
