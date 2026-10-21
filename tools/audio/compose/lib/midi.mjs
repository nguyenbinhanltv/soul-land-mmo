// Bài viết bằng code -> file MIDI (midi-writer-js). Một track cho mỗi kênh nhạc cụ.
import MidiWriter from "midi-writer-js";
import { rng } from "./theory.mjs";

export const PPQ = 128; // midi-writer-js mặc định 128 tick mỗi phách

/**
 * @param song bài (xem songs/*.mjs): bpm, beatsPerBar, bars, channels[], notes[] với t, d tính bằng phách.
 * @param repeats số lần lặp cả bài liền nhau (render dùng 3: lấy vòng giữa, có sẵn đuôi vang vòng trước và đầu vòng sau để trộn chỗ nối).
 * @param preBeats số phách chờ ở đầu để synth nhận đổi nhạc cụ / âm lượng; tick 0 của midi-writer-js
 *   lại bị coi là "không đặt tick" nên nốt đầu không được nằm ở 0.
 */
export function buildMidi(song, { repeats = 1, preBeats = 1 } = {}) {
  const loopBeats = song.bars * song.beatsPerBar;
  const meta = new MidiWriter.Track();
  meta.addTrackName(song.title);
  meta.setTempo(song.bpm);
  meta.setTimeSignature(song.beatsPerBar, 4, 24, 8);

  const tracks = [meta];
  for (const ch of song.channels) {
    const tr = new MidiWriter.Track();
    tr.addTrackName(ch.name);
    // ProgramChangeEvent đánh số kênh từ 0, ControllerChangeEvent / NoteEvent đánh từ 1.
    if (ch.channel !== 10) tr.addEvent(new MidiWriter.ProgramChangeEvent({ channel: ch.channel - 1, instrument: ch.program, delta: 0 }));
    const cc = { 7: ch.volume ?? 100, 10: ch.pan ?? 64, 91: ch.reverb ?? 40, 93: ch.chorus ?? 0, 11: 127 };
    for (const [num, val] of Object.entries(cc)) {
      tr.addEvent(new MidiWriter.ControllerChangeEvent({ channel: ch.channel, controllerNumber: Number(num), controllerValue: val, delta: 0 }));
    }

    // Làm "người thật" một chút: lệch lực / nhịp nhẹ, tính một lần nên mọi vòng lặp giống hệt nhau.
    const rand = rng(ch.seed ?? ch.channel * 7919);
    const notes = song.notes.filter((n) => n.ch === ch.key).sort((a, b) => a.t - b.t || a.p - b.p).map((n) => {
      const jv = Math.round((rand() * 2 - 1) * (ch.humanVel ?? 5));
      const jt = Math.round((rand() * 2 - 1) * (ch.humanTicks ?? 2));
      return { ...n, v: Math.max(1, Math.min(127, n.v + jv)), tick: Math.max(0, Math.round(n.t * PPQ) + jt) };
    });
    for (let r = 0; r < repeats; r++) {
      const base = Math.round((preBeats + r * loopBeats) * PPQ);
      for (const n of notes) {
        tr.addEvent(new MidiWriter.NoteEvent({
          pitch: [n.p],
          duration: `T${Math.max(1, Math.round(n.d * PPQ))}`,
          startTick: base + n.tick,
          velocity: Math.max(1, Math.round((n.v / 127) * 100)), // midi-writer-js nhận lực 1-100
          channel: ch.channel,
        }));
      }
    }
    tracks.push(tr);
  }
  return dropDuplicateEndOfTrack(new MidiWriter.Writer(tracks).buildFile());
}

/** midi-writer-js 3.2.1 dựng lại track khi có nốt đặt tick nên ghi EndOfTrack (00 FF 2F 00) hai lần ở cuối; bỏ bản thừa. */
function dropDuplicateEndOfTrack(bytes) {
  const EOT = [0x00, 0xff, 0x2f, 0x00];
  const out = [...bytes.subarray(0, 14)];
  for (let p = 14; p < bytes.length;) {
    const len = new DataView(bytes.buffer, bytes.byteOffset + p + 4, 4).getUint32(0);
    let data = bytes.subarray(p + 8, p + 8 + len);
    const endsWith = (d) => EOT.every((b, i) => d[d.length - 4 + i] === b);
    while (data.length >= 8 && endsWith(data) && endsWith(data.subarray(0, data.length - 4))) data = data.subarray(0, data.length - 4);
    out.push(...bytes.subarray(p, p + 4), (data.length >>> 24) & 255, (data.length >>> 16) & 255, (data.length >>> 8) & 255, data.length & 255, ...data);
    p += 8 + len;
  }
  return new Uint8Array(out);
}

/** Độ dài một vòng bài, giây. */
export function loopSeconds(song) {
  return (song.bars * song.beatsPerBar * 60) / song.bpm;
}
