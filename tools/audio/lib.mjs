import { createHash } from "node:crypto";
import { access, realpath } from "node:fs/promises";
import path from "node:path";

export const MAX_INITIAL_BYTES = 2 * 1024 * 1024;
export const AUDIO_FORMATS = ["ogg", "m4a"];
export const ALLOWED_LICENSES = new Set([
  "CC0-1.0",
  "CC-BY-3.0",
  "CC-BY-4.0",
]);
export const GAME_MAP_IDS = new Set([
  "thanh_hon_thon",
  "nac_dinh_thanh",
  "tinh_dau_ngoai_vi",
  "tinh_dau_noi_dia",
  "thien_dau_thanh",
  "lac_nhat_sam_lam",
  "cuc_bac_chi_dia",
  "hai_than_dao",
  "loi_tinh_dau",
  "dai_dau_hon_truong",
]);

const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function validateId(value, field) {
  requiredString(value, field);
  if (!SAFE_ID.test(value)) throw new Error(`${field} has an unsafe id`);
}

function validateRelativePath(value, field) {
  requiredString(value, field);
  if (path.isAbsolute(value) || value.split(/[\\/]+/).includes("..")) {
    throw new Error(`${field} must be a safe relative path`);
  }
}

function validateLicense(value) {
  requiredString(value, "license");
  if (!ALLOWED_LICENSES.has(value)) {
    throw new Error(`license ${value} is not allowed; use CC0 or CC-BY`);
  }
}

function validateSource(source) {
  validateId(source.id, "source.id");
  requiredString(source.title, "source.title");
  requiredString(source.author, "source.author");
  requiredString(source.url, "source.url");
  validateLicense(source.license);
  if (!/^[a-f0-9]{64}$/.test(source.archiveSha256)) {
    throw new Error(`source ${source.id} must have a SHA-256 provenance hash`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source.retrievedAt)) {
    throw new Error(`source ${source.id} has an invalid retrievedAt date`);
  }
}

function validateTrack(track, sourceIds) {
  validateId(track.id, "track.id");
  if (!sourceIds.has(track.sourceId)) throw new Error(`track ${track.id} references an unknown source`);
  validateRelativePath(track.input, `track ${track.id}.input`);
  if (!/^[a-f0-9]{64}$/.test(track.inputSha256 ?? "")) {
    throw new Error(`track ${track.id} must have an input SHA-256`);
  }
  validateId(track.group, `track ${track.id}.group`);
  if (track.mapId !== null) {
    requiredString(track.mapId, `track ${track.id}.mapId`);
    if (!GAME_MAP_IDS.has(track.mapId)) throw new Error(`track ${track.id} references unknown game map ${track.mapId}`);
  }
  if (typeof track.preload !== "boolean") throw new Error(`track ${track.id}.preload must be boolean`);
  validateId(track.sprite, `track ${track.id}.sprite`);
}

export function validateCatalog(catalog) {
  if (!catalog || !Array.isArray(catalog.sources) || !Array.isArray(catalog.tracks)) {
    throw new Error("catalog must contain sources and tracks arrays");
  }
  const sourceIds = new Set();
  for (const source of catalog.sources) {
    validateSource(source);
    if (!sourceIds.add(source.id)) throw new Error(`duplicate source ${source.id}`);
  }
  const trackIds = new Set();
  for (const track of catalog.tracks) {
    validateTrack(track, sourceIds);
    if (!trackIds.add(track.id)) throw new Error(`duplicate track ${track.id}`);
  }
  return true;
}

function validateFile(file, field) {
  if (!file || !AUDIO_FORMATS.includes(field)) throw new Error(`${field} output is required`);
  validateRelativePath(file.path, `${field}.path`);
  if (!Number.isInteger(file.bytes) || file.bytes < 0) throw new Error(`${field}.bytes must be a non-negative integer`);
}

export function validateManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1) throw new Error("manifest schemaVersion must be 1");
  if (!Array.isArray(manifest.items)) throw new Error("manifest items must be an array");
  if (!manifest.preload || !manifest.preload.bytes) throw new Error("manifest preload bytes are required");
  for (const format of AUDIO_FORMATS) {
    const bytes = manifest.preload.bytes[format];
    if (!Number.isInteger(bytes) || bytes < 0) throw new Error(`preload.${format} bytes are invalid`);
  }
  const ids = new Set();
  for (const item of manifest.items) {
    validateId(item.id, "manifest item.id");
    if (!ids.add(item.id)) throw new Error(`duplicate manifest item ${item.id}`);
    for (const format of AUDIO_FORMATS) validateFile(item.files?.[format], format);
    if (item.sprite) {
      requiredString(item.sprite.name, "sprite.name");
      if (!Number.isFinite(item.sprite.start) || item.sprite.start < 0) throw new Error("sprite.start is invalid");
      if (!Number.isFinite(item.sprite.duration) || item.sprite.duration <= 0) throw new Error("sprite.duration is invalid");
    }
  }

  const preloadFiles = Object.fromEntries(AUDIO_FORMATS.map((format) => [format, new Map()]));
  for (const item of manifest.items) {
    if (!item.preload) continue;
    for (const format of AUDIO_FORMATS) {
      const file = item.files[format];
      const previousBytes = preloadFiles[format].get(file.path);
      if (previousBytes !== undefined && previousBytes !== file.bytes) {
        throw new Error(`preload file byte mismatch for ${file.path}`);
      }
      preloadFiles[format].set(file.path, file.bytes);
    }
  }
  for (const format of AUDIO_FORMATS) {
    const actualBytes = [...preloadFiles[format].values()].reduce((total, bytes) => total + bytes, 0);
    const declaredBytes = manifest.preload.bytes[format];
    if (declaredBytes !== actualBytes) {
      throw new Error(`preload.${format} bytes do not match item files: declared ${declaredBytes}, actual ${actualBytes}`);
    }
    if (actualBytes > MAX_INITIAL_BYTES) throw new Error(`preload exceeds 2 MiB for ${format}`);
  }
  return true;
}

export function validateManifestMatchesCatalog({ catalog, manifest }) {
  validateCatalog(catalog);
  validateManifest(manifest);

  if (!Array.isArray(manifest.sources)) throw new Error("manifest sources must be an array");
  const sourceFields = ["id", "title", "author", "url", "license", "archiveSha256", "retrievedAt"];
  const canonicalSource = (source) => Object.fromEntries(sourceFields.map((field) => [field, source[field]]));
  const catalogSources = new Map(catalog.sources.map((source) => [source.id, source]));
  const manifestSources = new Map(manifest.sources.map((source) => [source.id, source]));
  const catalogTracks = new Map(catalog.tracks.map((track) => [track.id, track]));
  const manifestItems = new Map(manifest.items.map((item) => [item.id, item]));

  for (const source of catalog.sources) {
    const manifestSource = manifestSources.get(source.id);
    if (!manifestSource) throw new Error(`manifest is missing catalog source ${source.id}`);
    if (JSON.stringify(canonicalSource(manifestSource)) !== JSON.stringify(canonicalSource(source))) {
      throw new Error(`manifest source metadata mismatch for ${source.id}`);
    }
  }

  for (const source of manifest.sources) {
    if (!catalogSources.has(source.id)) throw new Error(`manifest has an extra source ${source.id}`);
  }

  for (const track of catalog.tracks) {
    const item = manifestItems.get(track.id);
    if (!item) throw new Error(`manifest is missing catalog track ${track.id}`);

    for (const field of ["sourceId", "group", "mapId", "preload"]) {
      if (item[field] !== track[field]) {
        throw new Error(`manifest metadata mismatch for ${track.id}.${field}`);
      }
    }
  }

  for (const item of manifest.items) {
    if (!catalogTracks.has(item.id)) throw new Error(`manifest has an extra track ${item.id}`);
  }

  return true;
}

export function buildManifest({ catalog, outputs, generatedAt = new Date().toISOString(), pipeline = "tools/audio" }) {
  validateCatalog(catalog);
  const sourceById = new Map(catalog.sources.map((source) => [source.id, source]));
  const trackById = new Map(catalog.tracks.map((track) => [track.id, track]));
  const items = outputs.map((output) => {
    const track = trackById.get(output.id);
    if (!track) throw new Error(`output references unknown track ${output.id}`);
    if (!sourceById.has(track.sourceId)) throw new Error(`track ${track.id} references unknown source`);
    return {
      id: output.id,
      sourceId: track.sourceId,
      group: track.group,
      mapId: output.mapId ?? track.mapId,
      preload: output.preload ?? track.preload,
      files: output.files,
      ...(output.sprite ? { sprite: output.sprite } : {}),
    };
  });
  const preload = { bytes: Object.fromEntries(AUDIO_FORMATS.map((format) => [format, 0])) };
  const preloadPaths = Object.fromEntries(AUDIO_FORMATS.map((format) => [format, new Set()]));
  for (const item of items) {
    if (item.preload) {
      for (const format of AUDIO_FORMATS) {
        const file = item.files[format];
        if (preloadPaths[format].has(file.path)) continue;
        preloadPaths[format].add(file.path);
        preload.bytes[format] += file.bytes;
      }
    }
  }
  return {
    schemaVersion: 1,
    generatedAt,
    pipeline,
    sources: catalog.sources,
    items,
    preload,
  };
}

export async function safeResolve(root, relativePath) {
  validateRelativePath(relativePath, "source path");
  const rootPath = path.resolve(root);
  const realRoot = await realpath(rootPath);
  const candidate = path.resolve(rootPath, relativePath);
  const realCandidate = await realpath(candidate);
  if (realCandidate !== realRoot && !realCandidate.startsWith(`${realRoot}${path.sep}`)) {
    throw new Error("source path escapes the selected source root");
  }
  await access(realCandidate);
  return candidate;
}

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function verifySha256(buffer, expected, label) {
  if (!/^[a-f0-9]{64}$/.test(expected ?? "")) throw new Error(`${label} must have a valid SHA-256`);
  const actual = sha256(buffer);
  if (actual !== expected) throw new Error(`${label} SHA-256 mismatch`);
  return true;
}

export function stableJson(value) {
  const sort = (current) => {
    if (Array.isArray(current)) return current.map(sort);
    if (current && typeof current === "object") {
      return Object.fromEntries(Object.keys(current).sort().map((key) => [key, sort(current[key])]));
    }
    return current;
  };
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}
