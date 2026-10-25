// Bài viết bằng code -> file MIDI (midi-writer-js). Mỗi kênh nhạc cụ một track nốt, kênh có biểu cảm thêm một track
// điều khiển (CC11 phồng / lặng hơi, CC1 rung, uốn cao độ khi vào nốt) để tiếng sáo, shakuhachi, dây đỡ "MIDI".
import MidiWriter from "midi-writer-js";
import { rng } from "./theory.mjs";

export const PPQ = 128; // midi-writer-js mặc định 128 tick mỗi phách

/**
 * Tùy chọn kênh (ngoài số nhạc cụ, âm lượng, pan, reverb, chorus):
 * - `humanVel`, `humanTicks`: lệch lực / nhịp ngẫu nhiên (mặc định 5 / 2).
 * - `phrase`: số ô một câu; lực nốt nhô lên giữa câu, lắng ở đầu và cuối câu (`phraseAmt`, mặc định 12).
 * - `groove`: nhấn phách mạnh, nhẹ phách lệch (rải, gảy, trống).
 * - `expr`: phồng hơi đầu nốt, lặng dần cuối nốt (CC11), cho kèn sáo / dây / pad. `vibrato`: độ rung CC1 ở nốt dài.
 * - `bank`: số bank của bộ tiếng phụ (nhạc cụ Trung Hoa, `--extra-soundfont`), mặc định bank 0 của bộ chính.
 * - `bend`: xác suất uốn từ dưới lên khi vào nốt (shakuhachi, sáo), `bendDepth` phần nửa cung (mặc định 0.5).
 */
export function buildMidi(song, { repeats = 1, preBeats = 1 } = {}) {
  const loopBeats = song.bars * song.beatsPerBar;
  const loopTicks = Math.round(loopBeats * PPQ);
  const meta = new MidiWriter.Track();
  meta.addTrackName(song.title);
  meta.setTempo(song.bpm);
  meta.setTimeSignature(song.beatsPerBar, 4, 24, 8);

  const tracks = [meta];
  for (const ch of song.channels) {
    const tr = new MidiWriter.Track();
    tr.addTrackName(ch.name);
    // ProgramChangeEvent / PitchBendEvent đánh số kênh từ 0, ControllerChangeEvent / NoteEvent đánh từ 1.
    if (ch.bank !== undefined) tr.addEvent(new MidiWriter.ControllerChangeEvent({ channel: ch.channel, controllerNumber: 0, controllerValue: ch.bank, delta: 0 }));
    if (ch.channel !== 10) tr.addEvent(new MidiWriter.ProgramChangeEvent({ channel: ch.channel - 1, instrument: ch.program, delta: 0 }));
    const cc = { 7: ch.volume ?? 100, 10: ch.pan ?? 64, 91: ch.reverb ?? 40, 93: ch.chorus ?? 0, 11: ch.expr ? 100 : 127, 1: 0 };
    for (const [num, val] of Object.entries(cc)) {
      tr.addEvent(new MidiWriter.ControllerChangeEvent({ channel: ch.channel, controllerNumber: Number(num), controllerValue: val, delta: 0 }));
    }

    const notes = humanize(song, ch);
    const base = (r) => Math.round(preBeats * PPQ) + r * loopTicks;
    for (let r = 0; r < repeats; r++) {
      for (const n of notes) {
        tr.addEvent(new MidiWriter.NoteEvent({
          pitch: [n.p],
          duration: `T${n.dur}`,
          startTick: base(r) + n.tick,
          velocity: Math.max(1, Math.round((n.v / 127) * 100)), // midi-writer-js nhận lực 1-100
          channel: ch.channel,
        }));
      }
    }
    tracks.push(tr);

    if (ch.expr || ch.bend) {
      const auto = automation(notes, ch, song);
      const at = new MidiWriter.Track();
      at.addTrackName(`${ch.name} (biểu cảm)`);
      let last = 0;
      for (let r = 0; r < repeats; r++) {
        for (const e of auto) {
          const tick = base(r) + e.tick;
          const delta = Math.max(0, tick - last);
          last = Math.max(last, tick);
          at.addEvent(e.bend !== undefined
            ? new MidiWriter.PitchBendEvent({ channel: ch.channel - 1, bend: e.bend, delta })
            : new MidiWriter.ControllerChangeEvent({ channel: ch.channel, controllerNumber: e.cc, controllerValue: e.val, delta }));
        }
      }
      tracks.push(at);
    }
  }
  return dropDuplicateEndOfTrack(new MidiWriter.Writer(tracks).buildFile());
}

/** Lệch lực / nhịp, nhấn theo câu và theo phách; tính một lần nên mọi vòng lặp giống hệt nhau. */
function humanize(song, ch) {
  const rand = rng(ch.seed ?? ch.channel * 7919);
  const bpb = song.beatsPerBar;
  return song.notes.filter((n) => n.ch === ch.key).sort((a, b) => a.t - b.t || a.p - b.p).map((n) => {
    let v = n.v + (rand() * 2 - 1) * (ch.humanVel ?? 5);
    if (ch.phrase) {
      const x = (n.t % (ch.phrase * bpb)) / (ch.phrase * bpb);
      v += (ch.phraseAmt ?? 12) * (Math.sin(Math.PI * x) - 0.5);
    }
    if (ch.groove) {
      const pos = n.t % bpb;
      v += pos === 0 ? 6 : Number.isInteger(pos) ? (pos === bpb / 2 ? 3 : 0) : Number.isInteger(pos * 2) ? -4 : -7;
    }
    const jt = Math.round((rand() * 2 - 1) * (ch.humanTicks ?? 2));
    return {
      ...n,
      v: Math.max(1, Math.min(127, Math.round(v))),
      tick: Math.max(0, Math.round(n.t * PPQ) + jt),
      dur: Math.max(1, Math.round(n.d * PPQ)),
      bendRoll: rand(),
    };
  });
}

/** Sự kiện điều khiển theo thời gian (tick trong một vòng), đã sắp xếp. */
function automation(notes, ch, song) {
  const STEP = 8; // 1/16 phách
  const starts = [...new Map(notes.map((n) => [n.tick, n])).values()]; // hợp âm: một đường cong cho mỗi lần bấm
  const loopTicks = Math.round(song.bars * song.beatsPerBar * PPQ);
  const out = [];
  starts.forEach((n, i) => {
    const longest = Math.max(...notes.filter((m) => m.tick === n.tick).map((m) => m.dur));
    const next = i + 1 < starts.length ? starts[i + 1].tick : loopTicks + starts[0].tick;
    const end = Math.min(n.tick + longest, next);
    const push = (tick, e) => { if (tick < next) out.push({ tick, ...e }); };
    if (ch.bend && n.bendRoll < ch.bend && longest >= PPQ / 2) {
      const depth = -(ch.bendDepth ?? 0.5) / 4; // tầm uốn mặc định ±2 cung: nửa cung = 0.25
      for (let k = 0; k <= 5; k++) push(n.tick + k * 6, { bend: depth * (1 - k / 5) ** 2 });
    } else if (ch.bend) push(n.tick, { bend: 0 });
    if (ch.expr) {
      const peak = Math.min(127, 96 + Math.round(n.v / 6));
      const attack = Math.min(PPQ / 2, Math.max(STEP * 2, Math.round(longest * 0.25)));
      for (let t = 0; t <= attack; t += STEP) push(n.tick + t, { cc: 11, val: Math.round(peak * (0.7 + 0.3 * (t / attack))) });
      const decayFrom = n.tick + Math.round(longest * 0.6);
      for (let t = decayFrom; t <= end; t += STEP * 2) {
        push(t, { cc: 11, val: Math.round(peak * (1 - 0.22 * ((t - decayFrom) / Math.max(1, end - decayFrom)))) });
      }
      if (ch.vibrato && longest >= PPQ * 1.25) {
        push(n.tick, { cc: 1, val: 0 });
        const v0 = n.tick + Math.round(longest * 0.35), v1 = n.tick + Math.round(longest * 0.7);
        for (let t = v0; t <= v1; t += STEP * 2) push(t, { cc: 1, val: Math.round(ch.vibrato * ((t - v0) / Math.max(1, v1 - v0))) });
      } else if (ch.vibrato) push(n.tick, { cc: 1, val: 0 });
    }
  });
  // Mọi sự kiện phải nằm trong vòng [0, loopTicks) để các vòng nối nhau không chồng.
  return out.filter((e) => e.tick < loopTicks).sort((a, b) => a.tick - b.tick);
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
