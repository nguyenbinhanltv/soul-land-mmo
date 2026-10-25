// MIDI -> âm thanh trong Node bằng SpessaSynth, xử lý tổng (EQ, mức, limiter), cắt vòng lặp liền mạch, ghi wav rồi ogg / m4a.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";
import { audioToWav, BasicMIDI, SoundBankLoader, SpessaSynthProcessor, SpessaSynthSequencer } from "spessasynth_core";

const BLOCK = 128;

function arrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const bankCache = new Map();
function loadBank(path) {
  if (!bankCache.has(path)) bankCache.set(path, SoundBankLoader.fromArrayBuffer(arrayBuffer(readFileSync(path))));
  return bankCache.get(path);
}

/** Render `total` mẫu stereo của file MIDI. */
async function synthesize({ midiBytes, soundfont, extraBanks = [], sampleRate, total }) {
  const synth = new SpessaSynthProcessor(sampleRate, { effectsEnabled: true, eventsEnabled: false, maxBufferSize: BLOCK });
  synth.soundBankManager.addSoundBank(loadBank(soundfont), "main");
  // Bộ tiếng phụ (nhạc cụ Trung Hoa): xếp ở bank = offset, bài chọn bằng `bank` của kênh.
  extraBanks.forEach(({ path, offset }, i) => synth.soundBankManager.addSoundBank(loadBank(path), `extra${i}`, offset));
  await synth.processorInitialized;
  const seq = new SpessaSynthSequencer(synth);
  seq.skipToFirstNoteOn = false; // giữ đúng thời điểm, không nhảy tới nốt đầu
  seq.loopCount = 0;
  seq.loadNewSongList([BasicMIDI.fromArrayBuffer(arrayBuffer(Buffer.from(midiBytes)))]);
  seq.play();
  const left = new Float32Array(total);
  const right = new Float32Array(total);
  for (let i = 0; i < total; i += BLOCK) {
    seq.processTick();
    synth.process(left, right, i, Math.min(BLOCK, total - i));
  }
  return { left, right };
}

// ---------- Xử lý tổng ----------

/** Bộ lọc biquad (RBJ Audio EQ Cookbook). type: highpass | peak | lowshelf | highshelf. */
function biquad(type, f0, sampleRate, { q = 0.707, gainDb = 0 } = {}) {
  const A = 10 ** (gainDb / 40), w = (2 * Math.PI * f0) / sampleRate, cw = Math.cos(w), sw = Math.sin(w), alpha = sw / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === "highpass") { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
  else if (type === "peak") { b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A; }
  else {
    const s = 2 * Math.sqrt(A) * alpha, sign = type === "lowshelf" ? -1 : 1;
    b0 = A * ((A + 1) + sign * (A - 1) * cw + s); b1 = -2 * sign * A * ((A - 1) + sign * (A + 1) * cw); b2 = A * ((A + 1) + sign * (A - 1) * cw - s);
    a0 = (A + 1) - sign * (A - 1) * cw + s; a1 = 2 * sign * ((A - 1) - sign * (A + 1) * cw); a2 = (A + 1) - sign * (A - 1) * cw - s;
  }
  return (x) => {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const y = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y;
    }
  };
}

/**
 * EQ nhẹ cho bớt tiếng "MIDI": cắt hạ âm dưới 32 Hz, bớt đục quanh 280 Hz, mở chút độ sáng / không khí ở 9 kHz.
 * Chạy trên toàn bộ bản render (trước khi cắt vòng) để trạng thái bộ lọc liền mạch qua chỗ nối.
 */
function eq(audio, sampleRate, { lowCut = 32, mudDb = -2.5, airDb = 2 } = {}) {
  const chain = [
    () => biquad("highpass", lowCut, sampleRate),
    () => biquad("peak", 280, sampleRate, { q: 0.9, gainDb: mudDb }),
    () => biquad("highshelf", 9000, sampleRate, { gainDb: airDb }),
  ];
  for (const ch of [audio.left, audio.right]) for (const make of chain) make()(ch);
}

/** Limiter nhìn trước 5 ms, nhả 120 ms: giữ đỉnh ≤ `ceilingDb` khi đẩy mức chung lên. Chạy trên toàn bản render như EQ. */
function limit(audio, sampleRate, ceilingDb = -1) {
  const ceil = 10 ** (ceilingDb / 20), look = Math.round(0.005 * sampleRate), rel = Math.exp(-1 / (0.12 * sampleRate));
  const n = audio.left.length, need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(audio.left[i]), Math.abs(audio.right[i]));
    need[i] = p > ceil ? ceil / p : 1;
  }
  // Giảm sớm trước đỉnh `look` mẫu: g[i] = min(need[i .. i + look]) bằng hàng đợi đơn điệu, rồi nhả dần.
  const g = new Float32Array(n);
  const dq = new Int32Array(n);
  let head = 0, tail = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (tail > head && need[dq[tail - 1]] >= need[i]) tail--;
    dq[tail++] = i;
    while (dq[head] > i + look) head++;
    g[i] = need[dq[head]];
  }
  let gain = 1;
  for (let i = 0; i < n; i++) {
    gain = g[i] < gain ? g[i] : g[i] + (gain - g[i]) * rel;
    audio.left[i] *= gain; audio.right[i] *= gain;
  }
}

/** Đo đỉnh và RMS (dBFS) trên đoạn [from, to). */
export function measure({ left, right }, from = 0, to = left.length) {
  let peak = 0, sum = 0;
  for (let i = from; i < to; i++) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
    sum += left[i] * left[i] + right[i] * right[i];
  }
  const db = (x) => 20 * Math.log10(Math.max(x, 1e-9));
  return { peakDb: db(peak), rmsDb: db(Math.sqrt(sum / (2 * Math.max(1, to - from)))) };
}

/**
 * Độ to cảm nhận (LUFS, xấp xỉ ITU-R BS.1770: lọc K rồi trung bình bình phương, không cổng) trên đoạn [from, to).
 * Dùng để mọi bài cùng độ to dù phối khác nhau (trống dày hay sáo thưa).
 */
export function loudness({ left, right }, sampleRate, from = 0, to = left.length) {
  let sum = 0;
  for (const src of [left, right]) {
    const x = src.slice(from, to);
    biquad("highshelf", 1681, sampleRate, { gainDb: 4, q: 0.71 })(x);
    biquad("highpass", 38, sampleRate, { q: 0.5 })(x);
    let ms = 0;
    for (let i = 0; i < x.length; i++) ms += x[i] * x[i];
    sum += ms / x.length;
  }
  return -0.691 + 10 * Math.log10(Math.max(sum, 1e-12));
}

function gain(audio, db) {
  const g = 10 ** (db / 20);
  for (const ch of [audio.left, audio.right]) for (let i = 0; i < ch.length; i++) ch[i] *= g;
}

/** EQ -> đưa độ to đoạn [from, to) về `lufs` -> limiter -1 dBFS. */
function master(audio, sampleRate, from, to, { lufs = -16, maxLimitDb = 6, eqOpts } = {}) {
  eq(audio, sampleRate, eqOpts);
  const m = measure(audio, from, to);
  // Limiter chỉ được nén tối đa `maxLimitDb` ở đỉnh, tránh bóp méo đoạn có trống mạnh.
  const g = Math.min(lufs - loudness(audio, sampleRate, from, to), -1 - m.peakDb + maxLimitDb);
  gain(audio, g);
  limit(audio, sampleRate, -1);
  return g;
}

/**
 * Render MIDI đã lặp 3 vòng rồi lấy vòng giữa [pre + L, pre + 2L): đầu đoạn đã có đuôi vang / nốt ngân của vòng trước.
 * Hiệu ứng chạy theo thời gian (chorus, LFO) làm các vòng lệch pha chút ít, nên `crossfade` mẫu đầu được trộn dần từ đầu
 * vòng sau (nối liền đúng từng mẫu với cuối vòng giữa) sang đầu vòng giữa: chỗ nối không có bước nhảy.
 * L nên là bội của 128 mẫu để sự kiện các vòng rơi cùng pha khối render.
 */
export async function renderLoop({ midiBytes, soundfont, extraBanks, sampleRate, preSeconds, loopSeconds, crossfade = 4096, mix = {} }) {
  const start = Math.round((preSeconds + loopSeconds) * sampleRate);
  const length = Math.round(loopSeconds * sampleRate);
  const full = await synthesize({ midiBytes, soundfont, extraBanks, sampleRate, total: start + length + crossfade });
  // mix === false: bỏ xử lý tổng (đo mức thô từng nhạc cụ khi cân mix).
  const gainDb = mix === false ? 0 : master(full, sampleRate, start, start + length, mix);
  const out = { left: full.left.slice(start, start + length), right: full.right.slice(start, start + length), gainDb };
  for (const [src, dst] of [[full.left, out.left], [full.right, out.right]]) {
    for (let i = 0; i < crossfade; i++) {
      const w = i / crossfade;
      dst[i] = dst[i] * w + src[start + length + i] * (1 - w);
    }
  }
  return out;
}

/** Khúc ngắn chơi một lần: render tới hết đuôi vang, cắt lặng cuối, mờ 60 ms cuối. */
export async function renderOnce({ midiBytes, soundfont, extraBanks, sampleRate, preSeconds, seconds, tailSeconds = 2.5, mix = {} }) {
  const start = Math.round(preSeconds * sampleRate);
  const full = await synthesize({ midiBytes, soundfont, extraBanks, sampleRate, total: start + Math.round((seconds + tailSeconds) * sampleRate) });
  // Đo độ to trên phần có nốt (không tính đuôi vang lặng, nếu không khúc ngắn bị đẩy quá to).
  const gainDb = master(full, sampleRate, start, start + Math.round(seconds * sampleRate), { lufs: -16, ...mix });
  let end = full.left.length;
  const floor = 10 ** (-60 / 20);
  while (end > start + sampleRate * seconds && Math.max(Math.abs(full.left[end - 1]), Math.abs(full.right[end - 1])) < floor) end--;
  const out = { left: full.left.slice(start, end), right: full.right.slice(start, end), gainDb };
  const fade = Math.min(out.left.length, Math.round(0.06 * sampleRate));
  for (const ch of [out.left, out.right]) for (let i = 0; i < fade; i++) ch[ch.length - 1 - i] *= i / fade;
  return out;
}

export function writeWav(path, { left, right }, sampleRate) {
  // audioToWav mặc định chuẩn hóa đỉnh về 0 dBFS: tắt để giữ độ to và limiter đã chỉnh ở master().
  writeFileSync(path, Buffer.from(audioToWav([left, right], sampleRate, { normalizeAudio: false })));
}

/** wav -> ogg Vorbis hoặc m4a AAC (dự phòng cho Safari, như dây chuyền #133). Bỏ metadata, bitexact để chạy lại ra cùng file. */
export function encode(wavPath, outPath, format, bitrate = "96k", mono = false) {
  const codec = format === "ogg" ? ["-c:a", "libvorbis", "-b:a", bitrate, "-serial_offset", "0"] : ["-c:a", "aac", "-b:a", bitrate, "-movflags", "+faststart"];
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", "-i", wavPath, "-map_metadata", "-1", ...(mono ? ["-ac", "1"] : []),
    "-fflags", "+bitexact", "-flags:a", "+bitexact", ...codec, outPath], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg lỗi: ${r.stderr}`);
}

/** Đếm số mẫu khi giải mã lại file (kiểm tra ogg không thêm / bớt mẫu làm lệch điểm lặp). */
export function decodedSamples(path) {
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-i", path, "-f", "s16le", "-ac", "1", "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg lỗi: ${r.stderr}`);
  return r.stdout.length / 2;
}
