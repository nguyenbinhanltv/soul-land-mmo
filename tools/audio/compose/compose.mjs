// Sáng tác nhạc nền ngũ cung bằng code (#134): bài trong songs/ -> MIDI -> SpessaSynth -> wav -> ogg lặp liền mạch.
//   node compose.mjs --soundfont <file .sf2/.sf3> --out <thư mục ngoài repo> [--song <id>] [--bitrate 96k] [--keep-wav]
// Mỗi bài ghi ra <id>.mid (một vòng), <id>.ogg và <id>.json (thông số, điểm lặp); --keep-wav giữ cả <id>.wav.
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildMidi, loopSeconds, PPQ } from "./lib/midi.mjs";
import { decodedSamples, normalize, renderLoop, wavToOgg, writeWav } from "./lib/render.mjs";
import thanhHonThon from "./songs/thanh-hon-thon.mjs";
import tinhDauSamLam from "./songs/tinh-dau-sam-lam.mjs";

const SONGS = [thanhHonThon, tinhDauSamLam];
const SAMPLE_RATE = 44100;
const PRE_BEATS = 1;

const { values: args } = parseArgs({
  options: {
    soundfont: { type: "string" },
    out: { type: "string" },
    song: { type: "string" },
    bitrate: { type: "string", default: "96k" },
    "keep-wav": { type: "boolean", default: false },
  },
});
if (!args.soundfont || !args.out) {
  console.error("Cần --soundfont <file> và --out <thư mục>. Xem tools/audio/compose/README.md.");
  process.exit(1);
}
if (!existsSync(args.soundfont)) throw new Error(`Không thấy soundfont: ${args.soundfont}`);
mkdirSync(args.out, { recursive: true });

const list = args.song ? SONGS.filter((s) => s.id === args.song) : SONGS;
if (!list.length) throw new Error(`Không có bài "${args.song}". Có: ${SONGS.map((s) => s.id).join(", ")}`);

for (const song of list) {
  const L = loopSeconds(song);
  const samples = L * SAMPLE_RATE;
  if (!Number.isInteger(samples) || samples % 128 !== 0) {
    console.warn(`[${song.id}] Vòng ${samples} mẫu không là bội của 128, chỗ nối có thể lệch < 3 ms.`);
  }
  const base = path.join(args.out, song.id);
  writeFileSync(`${base}.mid`, buildMidi(song, { repeats: 1, preBeats: 1 / PPQ }));

  const t0 = Date.now();
  const audio = await renderLoop({
    midiBytes: buildMidi(song, { repeats: 3, preBeats: PRE_BEATS }),
    soundfont: args.soundfont,
    sampleRate: SAMPLE_RATE,
    preSeconds: (PRE_BEATS * 60) / song.bpm,
    loopSeconds: L,
  });
  const level = normalize(audio);
  writeWav(`${base}.wav`, audio, SAMPLE_RATE);
  wavToOgg(`${base}.wav`, `${base}.ogg`, args.bitrate);
  if (!args["keep-wav"]) rmSync(`${base}.wav`);
  const oggSamples = decodedSamples(`${base}.ogg`);
  const info = {
    id: song.id,
    title: song.title,
    bpm: song.bpm,
    bars: song.bars,
    seconds: Number(L.toFixed(3)),
    loopSamples: audio.left.length,
    oggSamples,
    loop: "toàn bộ file (0 -> hết)",
    gainDb: Number(level.gainDb.toFixed(2)),
    peakDb: Number(level.peakDb.toFixed(2)),
    rmsDb: Number(level.rmsDb.toFixed(2)),
    oggBytes: statSync(`${base}.ogg`).size,
    instruments: song.channels.map((c) => `${c.name} (GM ${c.channel === 10 ? "trống kênh 10" : c.program})`),
  };
  writeFileSync(`${base}.json`, JSON.stringify(info, null, 2) + "\n");
  console.log(`[${song.id}] ${L.toFixed(1)} s, ogg ${(info.oggBytes / 1024).toFixed(0)} KB, đỉnh ${info.peakDb} dB, RMS ${info.rmsDb} dB, ` +
    `mẫu ${info.loopSamples} -> ogg ${oggSamples}${oggSamples === info.loopSamples ? "" : " (LỆCH)"}, render ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
