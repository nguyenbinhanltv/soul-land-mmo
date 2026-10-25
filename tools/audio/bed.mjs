// Nền môi trường vòng lặp (#622): cắt nguồn CC0 thành vòng lặp liền mạch (crossfade đầu–đuôi, cân công suất),
// chuẩn hóa về cùng độ to với ambient/*.ogg (-16 LUFS), xuất OGG + M4A theo cấu hình pipeline (process.mjs).
// Chạy: node tools/audio/bed.mjs --source-root <am-moi-truong> --out <thư mục> [--only <mapId>]
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

/** Độ to đích (LUFS tích hợp) = trung bình ambient/*.ogg hiện có; đỉnh không vượt TRUE_PEAK. */
export const TARGET_LUFS = -16;
export const TRUE_PEAK = -1.5;

/**
 * Mỗi nền: các đoạn nguồn (file, cắt từ `from` tới `to` giây; thiếu = cả file) ghép nối tiếp bằng crossfade `join` giây,
 * (tùy chọn `fx`: bộ lọc nén bớt đỉnh để đạt độ to đích mà không vượt trần đỉnh), sau đó cả chuỗi được khép vòng bằng crossfade `loop` giây. Tên theo quy ước game: amb_nen_<mapId>.
 */
export const BEDS = [
  {
    mapId: "hai_than_dao", title: "Sóng biển", source: "beach-ocean-waves", join: 0.45, loop: 0.8,
    // Bốn đoạn sóng ngắn (2,3–4 s) xáo thứ tự hai vòng để vòng dài ~25 s, tai khó nhận ra lặp.
    parts: ["wave_01", "wave_03", "wave_02", "wave_04", "wave_02", "wave_01", "wave_04", "wave_03"].map((id) => ({ file: `${id}_cc0-18363__jasinski__alkaibeach.flac` })),
  },
  {
    mapId: "loi_tinh_dau", title: "Hang tối", source: "dark-cavern-ambient", join: 0, loop: 5,
    fx: "acompressor=threshold=0.05:ratio=4:attack=10:release=200",
    parts: [{ file: "dark_cavern_ambient_001.ogg", from: 8, to: 68 }],
  },
  {
    mapId: "dai_dau_hon_truong", title: "Hầm ngục", source: "loopable-dungeon-ambience", join: 0, loop: 4,
    fx: "acompressor=threshold=0.02:ratio=8:attack=5:release=150",
    parts: [{ file: "dungeon_ambient_1_0.ogg", from: 4, to: 64 }],
  },
];

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (c) => { err += c; });
    child.once("error", reject);
    child.once("close", (code) => (code === 0 ? resolve(err) : reject(new Error(`ffmpeg ${code}: ${err.slice(-600)}`))));
  });
}

const base = (ff) => (args) => run(ff, ["-hide_banner", "-nostats", "-y", ...args]);

/** Chuỗi lọc: cắt từng đoạn, ghép bằng acrossfade (curve qsin = cân công suất), 48 kHz stereo. */
function chainFilter(parts, join) {
  const lines = parts.map((p, i) => {
    const trim = p.from !== undefined ? `atrim=${p.from}:${p.to},asetpts=PTS-STARTPTS,` : "";
    return `[${i}:a]${trim}aresample=48000,aformat=channel_layouts=stereo[p${i}]`;
  });
  let last = "p0";
  for (let i = 1; i < parts.length; i += 1) {
    const out = `j${i}`;
    lines.push(join > 0 ? `[${last}][p${i}]acrossfade=d=${join}:c1=qsin:c2=qsin[${out}]` : `[${last}][p${i}]concat=n=2:v=0:a=1[${out}]`);
    last = out;
  }
  return { filter: lines.join(";"), last };
}

/** Khép vòng: [đuôi mờ ra + đầu mờ vào] đặt ở đầu rồi tới phần giữa; cuối vòng nối thẳng vào đầu vòng không nghe thấy mối. */
function loopFilter(total, loop) {
  const t = total.toFixed(6), mid = (total - loop).toFixed(6), c = loop;
  return [
    `[0:a]anull[a]`,
    `[1:a]anull[b]`,
    `[2:a]anull[m]`,
    `[a]atrim=0:${c},asetpts=PTS-STARTPTS,afade=t=in:d=${c}:curve=qsin[h]`,
    `[b]atrim=${(total - loop).toFixed(6)}:${t},asetpts=PTS-STARTPTS,afade=t=out:d=${c}:curve=qsin[t]`,
    `[h][t]amix=inputs=2:normalize=0:duration=longest[x]`,
    `[m]atrim=${c}:${mid},asetpts=PTS-STARTPTS[mm]`,
    `[x][mm]concat=n=2:v=0:a=1[out]`,
  ].join(";");
}

async function duration(ff, file) {
  const log = await run(ff, ["-hide_banner", "-i", file, "-f", "null", "-"]).catch((e) => e.message);
  const m = String(log).match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) throw new Error(`Không đọc được thời lượng: ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

async function integrated(ff, file) {
  const log = await run(ff, ["-hide_banner", "-nostats", "-i", file, "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
  const m = log.match(/"input_i"\s*:\s*"(-?[\d.]+)"/);
  if (!m) throw new Error("Không đo được LUFS");
  return Number(m[1]);
}

async function peakDb(ff, file) {
  const log = await run(ff, ["-hide_banner", "-nostats", "-i", file, "-af", "volumedetect", "-f", "null", "-"]);
  const m = log.match(/max_volume:\s*(-?[\d.]+) dB/);
  if (!m) throw new Error("Không đo được đỉnh");
  return Number(m[1]);
}

export async function buildBed(ff, bed, sourceRoot, outDir, tmp) {
  const ffm = base(ff);
  const inputs = bed.parts.flatMap((p) => ["-i", path.join(sourceRoot, bed.source, p.file)]);
  const chain = chainFilter(bed.parts, bed.join);
  const chained = path.join(tmp, `${bed.mapId}.chain.wav`);
  const fx = bed.fx ? `;[${chain.last}]${bed.fx}[fx]` : "";
  await ffm([...inputs, "-filter_complex", `${chain.filter}${fx}`, "-map", `[${bed.fx ? "fx" : chain.last}]`, "-c:a", "pcm_s16le", chained]);
  const total = await duration(ff, chained);
  const looped = path.join(tmp, `${bed.mapId}.loop.wav`);
  await ffm(["-i", chained, "-i", chained, "-i", chained, "-filter_complex", loopFilter(total, bed.loop), "-map", "[out]", "-c:a", "pcm_s16le", looped]);
  // Chỉ tăng / giảm đều (không limiter: limiter làm trễ và chèn khoảng lặng ở đầu vòng, phá mối nối); trần đỉnh khống chế độ tăng.
  const peak = await peakDb(ff, looped);
  const gain = Math.min(TARGET_LUFS - (await integrated(ff, looped)), TRUE_PEAK - peak);
  const leveled = path.join(tmp, `${bed.mapId}.lvl.wav`);
  await ffm(["-i", looped, "-af", `volume=${gain.toFixed(3)}dB`, "-c:a", "pcm_s16le", leveled]);
  const name = `amb_nen_${bed.mapId}`;
  const bitexact = ["-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact"];
  await ffm(["-i", leveled, ...bitexact, "-c:a", "libvorbis", "-q:a", "4", "-serial_offset", "0", path.join(outDir, `${name}.ogg`)]);
  await ffm(["-i", leveled, ...bitexact, "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", path.join(outDir, `${name}.m4a`)]);
  return { name, mapId: bed.mapId, seconds: await duration(ff, leveled), lufs: await integrated(ff, leveled), gainDb: gain };
}

async function main() {
  const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
  const sourceRoot = path.resolve(arg("--source-root", ""));
  const outDir = path.resolve(arg("--out", ""));
  const only = arg("--only", null);
  const ff = process.env.FFMPEG ?? (await import("ffmpeg-static")).default;
  await mkdir(outDir, { recursive: true });
  const tmp = await mkdtemp(path.join(os.tmpdir(), "soul-bed-"));
  try {
    for (const bed of BEDS.filter((b) => !only || b.mapId === only)) {
      const r = await buildBed(ff, bed, sourceRoot, outDir, tmp);
      console.log(`${r.name}: ${r.seconds.toFixed(2)} s, ${r.lufs} LUFS (gain ${r.gainDb.toFixed(1)} dB)`);
    }
  } finally {
    if (!process.env.KEEP_TMP) await rm(tmp, { recursive: true, force: true });
  }
}

if (import.meta.url === `file:///${process.argv[1]?.replaceAll("\\", "/")}`) main().catch((e) => { console.error(e.message); process.exitCode = 1; });
