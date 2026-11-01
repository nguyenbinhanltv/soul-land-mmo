// Sáng tác nhạc nền và khúc ngắn bằng code (#134): bài trong songs/ -> MIDI -> SpessaSynth -> wav -> ogg + m4a.
//   node compose.mjs --soundfont <file .sf2/.sf3> [--out <thư mục>] [--song <id>[,<id>…]] [--midi <thư mục>] [--bitrate 96k]
// --out mặc định shared/assets/audio/music: ghi <id>.ogg, <id>.m4a và manifest.json (đường dẫn tính từ shared/assets).
// --midi (ngoài repo) ghi thêm <id>.mid (một vòng) và <id>.json (thông số) để xem lại / nghe bằng phần mềm khác.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import SONGS from "./songs/index.mjs";
import luyenHonCanh from "./candidates/luyen_hon_canh.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, "../../../shared/assets");
const SAMPLE_RATE = 44100;
const PRE_BEATS = 1;
const MAX_BYTES = 1.5 * 1024 * 1024;

const { values: args } = parseArgs({
  options: {
    soundfont: { type: "string" },
    "extra-soundfont": { type: "string" },
    out: { type: "string", default: path.join(ASSETS, "audio/music") },
    song: { type: "string" },
    midi: { type: "string" },
    bitrate: { type: "string", default: "96k" },
    candidate: { type: "boolean", default: false },
  },
});
if (!args.soundfont) {
  console.error("Cần --soundfont <file .sf2>. Xem tools/audio/compose/README.md.");
  process.exit(1);
}
if (!existsSync(args.soundfont)) throw new Error(`Không thấy soundfont: ${args.soundfont}`);
const extraBanks = args["extra-soundfont"] ? [{ path: args["extra-soundfont"], offset: 1 }] : [];
if (extraBanks.some((b) => !existsSync(b.path))) throw new Error(`Không thấy soundfont phụ: ${args["extra-soundfont"]}`);
const out = path.resolve(args.out);
const relativeOut = path.relative(ASSETS, out);
const outsideAssets = path.isAbsolute(relativeOut) || relativeOut === ".." || relativeOut.startsWith(`..${path.sep}`);
if (args.candidate && !outsideAssets) throw new Error("Bản nghe thử phải xuất ngoài shared/assets; chưa được thay manifest đang chạy.");
// Kiểm đầu ra trước khi nạp thư viện dựng nhạc: test an toàn chạy được trên CI không cài bộ sáng tác.
const { buildMidi, loopSeconds, PPQ } = await import("./lib/midi.mjs");
const { decodedSamples, encode, renderLoop, renderOnce, writeWav } = await import("./lib/render.mjs");
mkdirSync(out, { recursive: true });
if (args.midi) mkdirSync(args.midi, { recursive: true });

const wanted = args.song?.split(",");
const catalog = args.candidate ? [luyenHonCanh] : SONGS;
const list = wanted ? catalog.filter((s) => wanted.includes(s.id)) : catalog;
if (wanted && list.length !== wanted.length) throw new Error(`Không có bài: ${wanted.filter((w) => !catalog.some((s) => s.id === w)).join(", ")}. Có: ${catalog.map((s) => s.id).join(", ")}`);

// Đường dẫn trong manifest tính từ shared/assets nếu --out nằm trong đó (như manifest của tools/audio, #133).
const rel = (file) => {
  const r = path.relative(ASSETS, file).split(path.sep).join("/");
  return r.startsWith("..") ? path.basename(file) : r;
};
const manifestPath = path.join(out, "manifest.json");
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")).tracks : [];
const tracks = new Map(previous.filter((t) => catalog.some((s) => s.id === t.id)).map((t) => [t.id, t]));
const tmp = mkdtempSync(path.join(os.tmpdir(), "soul-land-compose-"));
let failed = false;

try {
  for (const song of list) {
    const t0 = Date.now();
    const loop = song.kind !== "jingle";
    const L = loopSeconds(song);
    // Bội của 1024 mẫu: khung AAC (m4a) khớp đúng độ dài, không thêm mẫu đệm cuối làm hở chỗ nối; cũng là bội của khối render 128.
    if (loop && (!Number.isInteger(L * SAMPLE_RATE) || (L * SAMPLE_RATE) % 1024 !== 0)) {
      console.error(`[${song.id}] Vòng ${L * SAMPLE_RATE} mẫu không là bội của 1024: đổi bpm / số ô (xem README).`);
      failed = true;
    }
    const render = { soundfont: args.soundfont, extraBanks, sampleRate: SAMPLE_RATE, preSeconds: (PRE_BEATS * 60) / song.bpm, mix: song.mix };
    const audio = loop
      ? await renderLoop({ ...render, midiBytes: buildMidi(song, { repeats: 3, preBeats: PRE_BEATS }), loopSeconds: L })
      : await renderOnce({ ...render, midiBytes: buildMidi(song, { repeats: 1, preBeats: PRE_BEATS }), seconds: L });
    const wav = path.join(tmp, `${song.id}.wav`);
    writeWav(wav, audio, SAMPLE_RATE);
    const files = {};
    for (const format of ["ogg", "m4a"]) {
      const file = path.join(out, `${song.id}.${format}`);
      encode(wav, file, format, song.bitrate ?? args.bitrate, song.mono);
      files[format] = { path: rel(file), bytes: statSync(file).size };
    }
    const samples = audio.left.length;
    for (const format of loop ? ["ogg", "m4a"] : []) {
      const got = decodedSamples(path.join(out, `${song.id}.${format}`));
      if (got !== samples) { console.error(`[${song.id}] ${format} giải mã ra ${got} mẫu, cần ${samples}: điểm lặp sẽ lệch.`); failed = true; }
    }
    if (files.ogg.bytes > MAX_BYTES || files.m4a.bytes > MAX_BYTES) { console.error(`[${song.id}] vượt 1,5 MB.`); failed = true; }

    const entry = {
      id: song.id,
      title: song.title,
      kind: song.kind,
      ...(song.maps ? { maps: song.maps } : {}),
      ...(song.event ? { event: song.event } : {}),
      ...(song.of ? { of: song.of } : {}),
      ...(song.phase ? { phase: song.phase } : {}),
      loop,
      seconds: Number((samples / SAMPLE_RATE).toFixed(3)),
      files,
    };
    tracks.set(song.id, entry);
    if (args.midi) {
      writeFileSync(path.join(args.midi, `${song.id}.mid`), buildMidi(song, { repeats: 1, preBeats: 1 / PPQ }));
      writeFileSync(path.join(args.midi, `${song.id}.json`), JSON.stringify({
        ...entry, bpm: song.bpm, bars: song.bars, samples, gainDb: Number(audio.gainDb.toFixed(2)),
        instruments: song.channels.map((c) => `${c.name} (GM ${c.channel === 10 ? "trống kênh 10" : c.program})`),
      }, null, 2) + "\n");
    }
    console.log(`[${song.id}] ${entry.seconds} s${loop ? " lặp" : ""}, ogg ${(files.ogg.bytes / 1024).toFixed(0)} KB, m4a ${(files.m4a.bytes / 1024).toFixed(0)} KB, ` +
      `tăng ${audio.gainDb.toFixed(1)} dB, render ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const sorted = [...tracks.values()].sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(manifestPath, JSON.stringify({ generatedBy: "tools/audio/compose/compose.mjs", soundfont: path.basename(args.soundfont), tracks: sorted }, null, 2) + "\n");
console.log(`manifest: ${sorted.length} bài -> ${manifestPath}`);
if (failed) process.exit(1);
