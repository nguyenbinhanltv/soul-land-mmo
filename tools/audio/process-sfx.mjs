// Hiệu ứng G2 (#393): cắt / lọc / chuẩn hóa đỉnh từng clip CC0, ghép thành audio sprite theo gói, nén Vorbis + AAC, ghi manifest và CREDITS.
//   node tools/audio/process-sfx.mjs --source-root <thư mục tải về, mỗi nguồn một thư mục con theo sourceId> [--pack <gói>]
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import ffmpegPath from "ffmpeg-static";
import { safeResolve, verifySha256 } from "./lib.mjs";
import { SFX_PACKS, buildSfxManifest, replaceSfxCredits, stableJson, validateSfxCatalog } from "./sfx-lib.mjs";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const option = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
const sourceRoot = path.resolve(option("--source-root", path.join(os.tmpdir(), "soul-land-sfx-sources")));
const catalogPath = path.resolve(option("--catalog", path.join(repoRoot, "tools/audio/sfx-catalog.json")));
const outRoot = path.resolve(option("--out", path.join(repoRoot, "shared/assets/audio")));
const onlyPack = option("--pack", ""); // chỉ dựng lại một gói (cần nguồn của gói đó), giữ nguyên gói khác trong manifest hiện có
const creditsPath = path.resolve(option("--credits", path.join(repoRoot, "art/CREDITS.md")));

const RATE = 44100, PEAK_DB = -3, GAP = 0.05, FADE = 0.015;

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (c) => { stderr += c; });
    child.once("error", reject);
    child.once("close", (code) => (code === 0 ? resolve(stderr) : reject(new Error(`ffmpeg lỗi (${code}): ${stderr.trim().slice(-400)}`))));
  });
}
const probe = async (file) => {
  const err = await run(["-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"]);
  const dur = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(err), max = /max_volume:\s*(-?[\d.]+) dB/.exec(err);
  if (!dur || !max) throw new Error(`Không đo được ${file}`);
  return { duration: +dur[1] * 3600 + +dur[2] * 60 + +dur[3], maxDb: +max[1] };
};

const trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.005";
function chain(c) {
  const f = [`aresample=${RATE}`];
  if (c.startSeconds) f.push(`atrim=start=${c.startSeconds}`, "asetpts=PTS-STARTPTS"); // cắt đoạn giữa bản thu dài (môi trường)
  if (c.pitch) f.push(`asetrate=${Math.round(RATE * c.pitch)}`, `aresample=${RATE}`);
  if (c.highpass) f.push(`highpass=f=${c.highpass}`);
  if (c.lowpass) f.push(`lowpass=f=${c.lowpass}`);
  if (c.echoMs) f.push(`aecho=0.8:0.6:${c.echoMs}:0.35`);
  f.push(trim, "areverse", trim, "areverse");
  if (c.maxSeconds) f.push(`atrim=end=${c.maxSeconds}`, "asetpts=PTS-STARTPTS");
  return f.join(",");
}
const stable = ["-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact"];

async function main() {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  validateSfxCatalog(catalog);
  if (!ffmpegPath) throw new Error("ffmpeg-static không có đường dẫn executable");
  const tmp = await mkdtemp(path.join(os.tmpdir(), "soul-sfx-"));
  try {
    const silence = path.join(tmp, "gap.wav");
    await run(["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", `anullsrc=r=${RATE}:cl=mono`, "-t", String(GAP), ...stable, "-c:a", "pcm_s16le", silence]);
    const byPack = new Map(SFX_PACKS.map((p) => [p, []]));
    for (const c of catalog.clips) {
      if (onlyPack && c.pack !== onlyPack) continue;
      const input = await safeResolve(sourceRoot, c.input);
      verifySha256(await readFile(input), c.inputSha256, `Nguồn ${c.id}`);
      const rough = path.join(tmp, `${c.id}.rough.wav`), done = path.join(tmp, `${c.id}.wav`);
      await run(["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-af", chain(c), "-ac", "1", ...stable, "-c:a", "pcm_s16le", rough]);
      const m = await probe(rough);
      if (m.duration < 0.03 || !Number.isFinite(m.maxDb)) throw new Error(`Clip ${c.id} rỗng sau khi cắt`);
      const gain = (PEAK_DB + (c.gainDb ?? 0) - m.maxDb).toFixed(2);
      const fadeOut = c.fadeOut ?? FADE, fadeStart = Math.max(0, m.duration - fadeOut).toFixed(4);
      const fadeIn = c.fadeIn ? `afade=t=in:st=0:d=${c.fadeIn},` : "";
      await run(["-hide_banner", "-loglevel", "error", "-y", "-i", rough, "-af", `volume=${gain}dB,${fadeIn}afade=t=out:st=${fadeStart}:d=${fadeOut}`, ...stable, "-c:a", "pcm_s16le", done]);
      byPack.get(c.pack).push({ clip: c, file: done, duration: (await probe(done)).duration });
    }
    const packs = {}, clips = [];
    await mkdir(path.join(outRoot, "sfx"), { recursive: true });
    for (const [name, entries] of byPack) {
      if (!entries.length) continue;
      const list = [], placed = [];
      let offset = 0;
      for (const e of entries) {
        list.push(e.file, silence);
        placed.push({ id: e.clip.id, group: e.clip.group, pack: name, sourceId: e.clip.sourceId, start: Number(offset.toFixed(4)), duration: Number(e.duration.toFixed(4)) });
        offset += e.duration + GAP;
      }
      const listPath = path.join(tmp, `${name}.txt`), combined = path.join(tmp, `${name}.all.wav`);
      await writeFile(listPath, `${list.map((f) => `file '${f.replaceAll("\\", "/")}'`).join("\n")}\n`);
      await run(["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c:a", "pcm_s16le", combined]);
      const files = {};
      for (const f of ["ogg", "m4a"]) {
        const rel = `sfx/${name}.${f}`, target = path.join(outRoot, rel);
        const codec = f === "ogg" ? ["-c:a", "libvorbis", "-q:a", "3", "-serial_offset", "0"] : ["-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart"];
        await run(["-hide_banner", "-loglevel", "error", "-y", "-i", combined, ...stable, ...codec, target]);
        files[f] = { path: rel, bytes: (await stat(target)).size };
      }
      packs[name] = { files, duration: Number(offset.toFixed(4)) };
      clips.push(...placed);
    }
    const generatedAt = `${catalog.sources.map((s) => s.retrievedAt).sort().at(-1)}T00:00:00.000Z`;
    if (onlyPack) {
      const old = JSON.parse(await readFile(path.join(outRoot, "sfx/manifest.json"), "utf8"));
      Object.assign(packs, Object.fromEntries(Object.entries(old.packs).filter(([n]) => n !== onlyPack)));
      const at = old.clips.findIndex((c) => c.pack === onlyPack); // clip của gói dựng lại thế chỗ clip cũ cùng gói, thứ tự các gói khác giữ nguyên
      const rest = old.clips.filter((c) => c.pack !== onlyPack);
      clips.splice(0, clips.length, ...rest.slice(0, at < 0 ? rest.length : at), ...clips, ...rest.slice(at < 0 ? rest.length : at));
    }
    const manifest = buildSfxManifest({ catalog, packs, clips, generatedAt });
    await writeFile(path.join(outRoot, "sfx/manifest.json"), stableJson(manifest));
    await writeFile(creditsPath, replaceSfxCredits(await readFile(creditsPath, "utf8"), manifest));
    const bytes = Object.values(packs).reduce((n, p) => n + p.files.ogg.bytes, 0), m4a = Object.values(packs).reduce((n, p) => n + p.files.m4a.bytes, 0);
    console.log(`Đã xử lý ${clips.length} clip / ${new Set(clips.map((c) => c.group)).size} nhóm vào ${outRoot}/sfx (OGG ${bytes} B, M4A ${m4a} B)`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e.stack ?? e.message); process.exitCode = 1; });
