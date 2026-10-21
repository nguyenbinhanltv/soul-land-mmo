import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { access, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MAX_INITIAL_BYTES = 2 * 1024 * 1024;
export const AUDIO_FORMATS = ["ogg", "m4a"];
export const AUDIO_CREDITS_START = "<!-- audio-sfx:start -->";
export const AUDIO_CREDITS_END = "<!-- audio-sfx:end -->";
// Mọi giấy phép đã biết đều dùng được (GAME_DESIGN.md mục 5.11 "Nguồn và giấy phép"); giấy phép lạ, trống hay ND thì dừng.
// Ghi theo mã SPDX (OGA-BY không có mã SPDX).
export const ALLOWED_LICENSES = new Set([
  "CC0-1.0",
  ...["2.0", "2.5", "3.0", "4.0"].flatMap((v) => ["CC-BY", "CC-BY-SA", "CC-BY-NC", "CC-BY-NC-SA"].map((l) => `${l}-${v}`)),
  "OGA-BY-3.0",
  ...["GPL-2.0", "GPL-3.0"].flatMap((l) => [`${l}-only`, `${l}-or-later`]),
]);
/** Cờ nghĩa vụ: SA / GPL (tệp đã sửa, kể cả audio sprite ghép, theo đúng giấy phép đó), NC (chỉ dùng khi game phi thương mại). */
export function licenseFlags(license) {
  return [/-SA-/.test(license) && "SA", /^GPL-/.test(license) && "GPL", /-NC-/.test(license) && "NC"].filter(Boolean);
}
const MAPS_SOURCE = readFileSync(fileURLToPath(new URL("../../shared/data.ts", import.meta.url)), "utf8");
export const GAME_MAP_IDS = new Set(
  [...MAPS_SOURCE.matchAll(/^\s{2}[a-z0-9_]+:\s*\{\s*id:\s*"([a-z0-9_]+)"/gm)].map(([, id]) => id),
);
if (GAME_MAP_IDS.size === 0) throw new Error("Không đọc được MAPS từ shared/data.ts");

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
    throw new Error(`license ${value} is not recognized; use an SPDX id such as CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, CC-BY-NC-4.0, OGA-BY-3.0 or GPL-3.0-or-later`);
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

function uniqueIds(records, label) {
  const ids = new Set();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`duplicate ${label} ${record.id}`);
    ids.add(record.id);
  }
  return ids;
}

export function validateCatalog(catalog) {
  if (!catalog || !Array.isArray(catalog.sources) || !Array.isArray(catalog.tracks)) {
    throw new Error("catalog must contain sources and tracks arrays");
  }
  const sourceIds = uniqueIds(catalog.sources, "catalog source");
  for (const source of catalog.sources) {
    validateSource(source);
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
  uniqueIds(manifest.sources, "manifest source");
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

function durationKey(format, relativePath) {
  return `${format}:${relativePath}`;
}

export function validateManifestDurations(manifest, measuredDurations, tolerance = 0.1) {
  const expectedDurations = new Map();
  for (const item of manifest.items) {
    if (!item.sprite) continue;
    const expected = item.sprite.start + item.sprite.duration;
    for (const format of AUDIO_FORMATS) {
      const key = durationKey(format, item.files[format].path);
      expectedDurations.set(key, Math.max(expectedDurations.get(key) ?? 0, expected));
    }
  }
  for (const [key, expected] of expectedDurations) {
    const actual = measuredDurations.get(key);
    if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) {
      throw new Error(`audio duration mismatch for ${key}: manifest ${expected.toFixed(3)}s, decoded ${Number(actual).toFixed(3)}s`);
    }
  }
  return true;
}

function markdownCell(value) {
  return String(value).replaceAll("|", "\\|");
}

function normalizeNewlines(value) {
  return String(value).replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

export function renderAudioCredits(manifest) {
  const sourceById = new Map(manifest.sources.map((source) => [source.id, source]));
  const outputs = new Map();
  for (const item of manifest.items) {
    const key = `${item.files.ogg.path}|${item.files.m4a.path}`;
    const output = outputs.get(key) ?? {
      files: [item.files.ogg.path, item.files.m4a.path],
      tracks: [],
      sources: new Map(),
    };
    output.tracks.push(item.id);
    const source = sourceById.get(item.sourceId);
    if (!source) throw new Error(`manifest credits references unknown source ${item.sourceId}`);
    output.sources.set(source.id, source);
    outputs.set(key, output);
  }
  const rows = [...outputs.values()].sort((left, right) => left.files[0].localeCompare(right.files[0])).map((output) => {
    const sources = [...output.sources.values()];
    const authors = [...new Set(sources.map((source) => source.author))].join("<br>");
    // Tệp output có nguồn SA / GPL thì cả tệp (kể cả audio sprite ghép nhiều nguồn) theo giấy phép đó: gắn cờ cạnh giấy phép.
    const licenses = [...new Set(sources.map((source) => source.license))].map((license) => {
      const flags = licenseFlags(license);
      return flags.length ? `${license} (cờ ${flags.join(", ")})` : license;
    }).join("<br>");
    const provenance = sources.map((source) => `${source.title} — <${source.url}> — SHA-256 \`${source.archiveSha256}\``).join("<br>");
    const files = output.files.map((file) => `\`shared/assets/${markdownCell(file)}\``).join("<br>");
    return `| ${files} | ${markdownCell(output.tracks.join(", "))} | ${markdownCell(authors)} | ${markdownCell(licenses)} | ${provenance} |`;
  });
  return [
    AUDIO_CREDITS_START,
    "| Tệp output | Track | Tác giả | Giấy phép | Provenance |",
    "|---|---|---|---|---|",
    ...rows,
    AUDIO_CREDITS_END,
  ].join("\n");
}

export function validateAudioCredits({ manifest, creditsText }) {
  const normalizedCredits = normalizeNewlines(creditsText);
  const startIndex = normalizedCredits.indexOf(AUDIO_CREDITS_START);
  const endIndex = normalizedCredits.indexOf(AUDIO_CREDITS_END);
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) throw new Error("audio credits markers are missing");
  const actual = normalizedCredits.slice(startIndex, endIndex + AUDIO_CREDITS_END.length);
  if (actual !== renderAudioCredits(manifest)) throw new Error("audio credits mismatch with manifest");
  return true;
}

export function replaceAudioCredits(creditsText, manifest) {
  const normalizedCredits = normalizeNewlines(creditsText);
  const startIndex = normalizedCredits.indexOf(AUDIO_CREDITS_START);
  const endIndex = normalizedCredits.indexOf(AUDIO_CREDITS_END);
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) throw new Error("audio credits markers are missing");
  return `${normalizedCredits.slice(0, startIndex)}${renderAudioCredits(manifest)}${normalizedCredits.slice(endIndex + AUDIO_CREDITS_END.length)}`;
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
