import { mkdir, mkdtemp, readFile, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import ffmpegPath from "ffmpeg-static";
import { buildManifest, safeResolve, sha256, stableJson, validateCatalog } from "./lib.mjs";

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const DEFAULT_CATALOG = path.join(repoRoot, "tools/audio/catalog.json");
const DEFAULT_OUT = path.join(repoRoot, "shared/assets");
const DEFAULT_MANIFEST = path.join(DEFAULT_OUT, "audio/manifest.json");

function argsFrom(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith("--")) args.set(argv[index], argv[index + 1] ?? true);
  }
  return args;
}

function run(command, commandArgs, { allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code !== 0 && !allowFailure) {
        reject(new Error(`${path.basename(command)} failed (${code}): ${stderr.trim()}`));
        return;
      }
      resolve({ code, stdout, stderr });
    });
  });
}

async function durationOf(file) {
  const result = await run(ffmpegPath, ["-hide_banner", "-i", file, "-f", "null", "-"], { allowFailure: true });
  const match = result.stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) throw new Error(`Không đọc được thời lượng audio: ${file}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

async function normalize(input, output) {
  await run(ffmpegPath, [
    "-hide_banner", "-loglevel", "error", "-y", "-i", input,
    "-af", "loudnorm=I=-16:LRA=11:TP=-1.5,silenceremove=stop_periods=-1:stop_duration=0.08:stop_threshold=-50dB",
    "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", output,
  ]);
}

async function makeSilence(output) {
  await run(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "0.05", "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact", "-c:a", "pcm_s16le", output]);
}

async function concatWav(files, output) {
  const listPath = `${output}.concat.txt`;
  const lines = files.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n");
  await writeFile(listPath, `${lines}\n`);
  try {
    await run(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c:a", "pcm_s16le", output]);
  } finally {
    await unlink(listPath).catch(() => {});
  }
}

async function encode(input, output, format) {
  const args = ["-hide_banner", "-loglevel", "error", "-y", "-i", input];
  args.push("-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact");
  if (format === "ogg") args.push("-c:a", "libvorbis", "-q:a", "4", "-serial_offset", "0");
  else args.push("-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart");
  args.push(output);
  await run(ffmpegPath, args);
}

function outputPath(group, sprite, tracks) {
  if (sprite === "footsteps" || sprite === "footsteps-kenney") return `audio/sprites/${sprite}.EXT`;
  if (group === "creatures" || group === "events") return `audio/sprites/${sprite}.EXT`;
  const mapId = tracks[0].track.mapId ?? group;
  return `audio/ambient/${mapId}.EXT`;
}

async function main() {
  const args = argsFrom(process.argv.slice(2));
  const sourceRoot = path.resolve(String(args.get("--source-root") ?? path.join(os.tmpdir(), "soul-land-mmo-audio-sources")));
  const catalogPath = path.resolve(String(args.get("--catalog") ?? DEFAULT_CATALOG));
  const outputRoot = path.resolve(String(args.get("--out") ?? DEFAULT_OUT));
  const manifestPath = path.resolve(String(args.get("--manifest") ?? DEFAULT_MANIFEST));
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  validateCatalog(catalog);
  if (!ffmpegPath) throw new Error("ffmpeg-static không cung cấp đường dẫn executable");

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "soul-land-audio-"));
  const silence = path.join(tempRoot, "silence.wav");
  await makeSilence(silence);
  const prepared = new Map();
  for (const track of catalog.tracks) {
    const input = await safeResolve(sourceRoot, track.input);
    if (track.inputSha256 && sha256(await readFile(input)) !== track.inputSha256) {
      throw new Error(`SHA-256 nguồn không khớp cho ${track.id}`);
    }
    const normalized = path.join(tempRoot, `${track.id}.wav`);
    await normalize(input, normalized);
    prepared.set(track.id, { track, file: normalized, duration: await durationOf(normalized) });
  }

  const groups = new Map();
  for (const entry of prepared.values()) {
    if (!groups.has(entry.track.sprite)) groups.set(entry.track.sprite, []);
    groups.get(entry.track.sprite).push(entry);
  }
  const outputs = [];
  await mkdir(outputRoot, { recursive: true });
  for (const [sprite, entries] of groups) {
    const group = entries[0].track.group;
    const concatInput = [];
    let offset = 0;
    const spriteInfo = new Map();
    for (const entry of entries) {
      concatInput.push(entry.file, silence);
      spriteInfo.set(entry.track.id, { start: offset, duration: entry.duration });
      offset += entry.duration + 0.05;
    }
    const combined = path.join(tempRoot, `${sprite}.wav`);
    await concatWav(concatInput, combined);
    const relativeBase = outputPath(group, sprite, entries).replace(".EXT", "");
    const oggRelative = `${relativeBase}.ogg`;
    const m4aRelative = `${relativeBase}.m4a`;
    const ogg = path.join(outputRoot, oggRelative);
    const m4a = path.join(outputRoot, m4aRelative);
    await mkdir(path.dirname(ogg), { recursive: true });
    await encode(combined, ogg, "ogg");
    await encode(combined, m4a, "m4a");
    const [oggStat, m4aStat] = await Promise.all([stat(ogg), stat(m4a)]);
    for (const entry of entries) {
      const info = spriteInfo.get(entry.track.id);
      outputs.push({
        id: entry.track.id,
        mapId: entry.track.mapId,
        preload: entry.track.preload,
        files: { ogg: { path: oggRelative, bytes: oggStat.size }, m4a: { path: m4aRelative, bytes: m4aStat.size } },
        sprite: { name: sprite, start: Number(info.start.toFixed(6)), duration: Number(info.duration.toFixed(6)) },
      });
    }
  }
  const sourceDate = process.env.SOURCE_DATE_EPOCH
    ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
    : `${catalog.sources.map((source) => source.retrievedAt).sort().at(-1)}T00:00:00.000Z`;
  const manifest = buildManifest({ catalog, outputs, generatedAt: sourceDate, pipeline: "tools/audio/process.mjs@1" });
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, stableJson(manifest));
  console.log(`Đã xử lý ${outputs.length} track vào ${outputRoot}`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
