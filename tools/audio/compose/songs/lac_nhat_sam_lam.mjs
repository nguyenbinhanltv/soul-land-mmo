// Lạc Nhật Sâm Lâm: rừng hoa độc ráng chiều quanh suối Băng Hỏa Lưỡng Nghi Nhãn, đẹp mà nguy hiểm, uốn lượn như rắn.
// Thang Hirajoshi trên Mi (E F# G B C), 90 BPM, 32 ô (A A' B A''), ~85 giây, nhịp 3+3+2 lệch.
// Shamisen dẫn đoạn A, shakuhachi nhắc lại quãng tám trên ở A'; đoạn B vibraphone lấp lánh (băng - hỏa), quãng ba cung F# - C
// tạo căng; kalimba sủi bọt như đầm độc, sitar quét nền, pad kính, trống conga / cabasa.
import { bars, grid, midi, pattern, shift } from "../lib/theory.mjs";

const BPB = 4;
const CHORD = {
  Em: ["E2", ["E3", "B3", "E4", "F#4", "G4", "B4"]],
  C: ["C2", ["C3", "G3", "B3", "C4", "E4", "G4"]],
  Bs: ["B1", ["B2", "F#3", "B3", "E4", "F#4", "B4"]],
  G: ["G1", ["G2", "B2", "F#3", "G3", "B3", "E4"]],
  Fs: ["F#1", ["F#2", "C3", "E3", "F#3", "B3", "C4"]],
};
const PROG = [
  "Em", "Em", "C", "C", "Em", "Em", "Bs", "Bs", // A
  "Em", "Em", "C", "C", "G", "G", "Bs", "Em", // A'
  "C", "C", "G", "G", "Fs", "Fs", "Bs", "Bs", // B
  "Em", "Em", "C", "C", "Em", "G", "Bs", "Bs", // A''
];

const MELODY_A = `
  E4:1 F#4:1 G4:2 B4:2 G4:1 F#4:1 | E4:2 F#4:1 E4:1 B3:4 | C4:1 E4:1 G4:2 F#4:1 G4:1 E4:2 | C4:4 -:2 B3:1 C4:1 |
  E4:1 G4:1 B4:2 C5:2 B4:1 G4:1 | F#4:2 G4:1 F#4:1 E4:4 | B3:1 C4:1 E4:1 F#4:1 G4:2 F#4:2 | B3:6 -:2`;
const MELODY_B = `
  G4:3 B4:1 C5:4 | B4:2 G4:2 E4:4 | F#4:3 G4:1 B4:4 | G4:2 F#4:2 E4:2 B3:2 |
  >C5:6 B4:2 | F#4:4 G4:2 F#4:2 | E4:3 F#4:1 B4:4 | B4:2 C5:1 B4:1 F#4:4`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("shami", bars(MELODY_A, { startBar: 0, vel: 86, legato: 0.8 }));
  add("shaku", shift(bars(MELODY_A, { startBar: 8, vel: 84, legato: 0.98 }), 12));
  add("shaku", bars(MELODY_B, { startBar: 16, vel: 88, legato: 0.98 }));
  add("shami", bars(MELODY_A, { startBar: 24, vel: 90, legato: 0.8 }));

  PROG.forEach((c, bar) => {
    const [root, tones] = CHORD[c];
    const sec = Math.floor(bar / 8);
    add("kalimba", pattern([2, 3, 4, 5, 4, 3, 4, 2].map((i) => tones[i]), { bar, vel: sec === 2 ? 50 : 58, legato: 1.2 }));
    // Shamisen gảy phách lệch khi không dẫn (A', B).
    if (sec === 1 || sec === 2) add("shami", grid("..x..x.x", { bar, pitch: midi(tones[1]), vel: 56, d: 0.3 }));
    if (bar % 2 === 0) for (const n of [tones[0], tones[1]]) notes.push({ ch: "sitar", t: bar * BPB, d: BPB * 1.9, p: midi(n), v: 56 });
    for (const n of [tones[1], tones[3]]) notes.push({ ch: "pad", t: bar * BPB, d: BPB * 0.99, p: midi(n), v: 52 });
    notes.push({ ch: "bass", t: bar * BPB, d: 1.4, p: midi(root) + 12, v: 74 }, { ch: "bass", t: bar * BPB + 1.5, d: 1.4, p: midi(root) + 12, v: 60 }, { ch: "bass", t: bar * BPB + 3, d: 0.9, p: midi(tones[1]), v: 58 });
    // Vibraphone lấp lánh đoạn B: hợp âm rải chậm hai nốt mỗi phách.
    if (sec === 2) for (let b = 0; b < 4; b++) notes.push({ ch: "vibe", t: bar * BPB + b, d: 1.5, p: midi(tones[3 + (b % 3)]) + 12, v: 52 });

    // Trống 3+3+2: conga trầm / cao, cabasa ở A' và B.
    add("perc", grid("X..x..x.", { bar, pitch: 64, vel: 70 }));
    add("perc", grid(".o..o.oo", { bar, pitch: 62, vel: 66 }));
    if (sec === 1 || sec === 2) add("perc", grid("oxoxoxox", { bar, pitch: 69, vel: 46 }));
    if (bar % 4 === 0) add("taiko", grid("x.......", { bar, pitch: "C3", vel: 62, d: 0.5 }));
  });
  return notes;
}

export default {
  id: "lac_nhat_sam_lam",
  title: "Lạc Nhật Sâm Lâm",
  kind: "map",
  maps: ["lac_nhat_sam_lam"],
  bpm: 90,
  beatsPerBar: BPB,
  bars: 32,
  channels: [
    { key: "shami", name: "Shamisen", channel: 1, program: 106, volume: 100, pan: 50, reverb: 60, humanTicks: 3, groove: true, phrase: 4 },
    { key: "shaku", name: "Shakuhachi", channel: 2, program: 77, volume: 92, pan: 70, reverb: 85, humanTicks: 4, expr: true, vibrato: 46, bend: 0.4, bendDepth: 0.8, phrase: 4 },
    { key: "kalimba", name: "Kalimba", channel: 3, program: 108, volume: 60, pan: 88, reverb: 70, humanVel: 8, groove: true, phrase: 2, phraseAmt: 10 },
    { key: "sitar", name: "Sitar quét nền", channel: 4, program: 104, volume: 72, pan: 30, reverb: 80 },
    { key: "pad", name: "Pad kính", channel: 5, program: 92, volume: 85, pan: 64, reverb: 90, chorus: 40, humanVel: 2, expr: true },
    { key: "bass", name: "Koto trầm", channel: 6, program: 107, volume: 70, pan: 58, reverb: 45, groove: true },
    { key: "vibe", name: "Vibraphone", channel: 7, program: 11, volume: 70, pan: 96, reverb: 90 },
    { key: "taiko", name: "Taiko", channel: 8, program: 116, volume: 74, pan: 64, reverb: 65, humanTicks: 0 },
    { key: "perc", name: "Conga / cabasa", channel: 10, program: 0, volume: 72, pan: 74, reverb: 50, humanTicks: 2, groove: true },
  ],
  notes: build(),
};
