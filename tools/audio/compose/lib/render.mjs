// MIDI -> âm thanh trong Node bằng SpessaSynth, cắt một vòng lặp liền mạch, ghi wav rồi ogg (ffmpeg-static).
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";
import { audioToWav, BasicMIDI, SoundBankLoader, SpessaSynthProcessor, SpessaSynthSequencer } from "spessasynth_core";

const BLOCK = 128;

function arrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

let bankCache = null;
function loadBank(path) {
  if (bankCache?.path !== path) bankCache = { path, bank: SoundBankLoader.fromArrayBuffer(arrayBuffer(readFileSync(path))) };
  return bankCache.bank;
}

/**
 * Render MIDI đã lặp 3 vòng rồi lấy vòng thứ hai [pre + L, pre + 2L): đầu đoạn đã có đuôi vang / nốt ngân
 * của vòng trước, nên khi phát lặp từ cuối về đầu không bị hụt tiếng.
 * Hiệu ứng chạy theo thời gian (chorus, LFO) làm vòng 2 và vòng 3 lệch pha chút ít, nên `crossfade` mẫu đầu
 * được trộn dần từ đầu vòng 3 (nối liền đúng từng mẫu với cuối vòng 2) sang đầu vòng 2: chỗ nối không có bước nhảy.
 * L nên là bội của 128 mẫu để sự kiện các vòng rơi cùng pha khối render.
 * @returns {{left: Float32Array, right: Float32Array}}
 */
export async function renderLoop({ midiBytes, soundfont, sampleRate, preSeconds, loopSeconds, crossfade = 4096 }) {
  const synth = new SpessaSynthProcessor(sampleRate, { effectsEnabled: true, eventsEnabled: false, maxBufferSize: BLOCK });
  synth.soundBankManager.addSoundBank(loadBank(soundfont), "main");
  await synth.processorInitialized;
  const seq = new SpessaSynthSequencer(synth);
  seq.skipToFirstNoteOn = false; // giữ đúng thời điểm, không nhảy tới nốt đầu
  seq.loopCount = 0;
  seq.loadNewSongList([BasicMIDI.fromArrayBuffer(arrayBuffer(Buffer.from(midiBytes)))]);
  seq.play();

  const start = Math.round((preSeconds + loopSeconds) * sampleRate);
  const length = Math.round(loopSeconds * sampleRate);
  const total = start + length + crossfade;
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  for (let i = 0; i < total; i += BLOCK) {
    seq.processTick();
    synth.process(left, right, i, Math.min(BLOCK, total - i));
  }
  const out = { left: left.slice(start, start + length), right: right.slice(start, start + length) };
  for (const [src, dst] of [[left, out.left], [right, out.right]]) {
    for (let i = 0; i < crossfade; i++) {
      const w = i / crossfade;
      dst[i] = dst[i] * w + src[start + length + i] * (1 - w);
    }
  }
  return out;
}

/** Đo đỉnh và RMS (dBFS). */
export function measure({ left, right }) {
  let peak = 0, sum = 0;
  for (let i = 0; i < left.length; i++) {
    const l = Math.abs(left[i]), r = Math.abs(right[i]);
    peak = Math.max(peak, l, r);
    sum += left[i] * left[i] + right[i] * right[i];
  }
  const db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
  return { peakDb: db(peak), rmsDb: db(Math.sqrt(sum / (2 * left.length))) };
}

/** Nhân một hệ số cố định (không nén động) để RMS về `rmsDb` nhưng đỉnh không vượt `peakDb`. Hệ số cố định giữ chỗ nối vòng liền. */
export function normalize(audio, { rmsDb = -20, peakDb = -1 } = {}) {
  const m = measure(audio);
  const gainDb = Math.min(rmsDb - m.rmsDb, peakDb - m.peakDb);
  const g = 10 ** (gainDb / 20);
  for (const ch of [audio.left, audio.right]) for (let i = 0; i < ch.length; i++) ch[i] *= g;
  return { gainDb, ...measure(audio) };
}

export function writeWav(path, { left, right }, sampleRate) {
  writeFileSync(path, Buffer.from(audioToWav([left, right], sampleRate)));
}

export function wavToOgg(wavPath, oggPath, bitrate = "96k") {
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", "-i", wavPath, "-c:a", "libvorbis", "-b:a", bitrate, oggPath], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg lỗi: ${r.stderr}`);
}

/** Đếm số mẫu khi giải mã lại file (kiểm tra ogg không thêm / bớt mẫu làm lệch điểm lặp). */
export function decodedSamples(path) {
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-i", path, "-f", "s16le", "-ac", "1", "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg lỗi: ${r.stderr}`);
  return r.stdout.length / 2;
}
