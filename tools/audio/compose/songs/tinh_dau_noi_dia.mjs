// Tinh Đấu Nội địa: rừng sâu tối, cổ thú vạn năm, nguy hiểm rình rập (tối hơn Ngoại vi). 75 BPM, 32 ô (A A' B A''), ~102 giây.
// Đoạn A ngũ cung Rê thứ (D F G A C); đoạn B thang In trên Rê (D Eb G A Bb), bè trầm Eb - D nửa cung rồi A - Eb quãng ba cung.
// Shakuhachi hát thấp nhiều khoảng lặng, koto gảy thưa ở quãng trầm, dây tremolo rì rầm ở đoạn B, pad kính kéo vĩ,
// contrabass ngân gốc, taiko nhịp tim, chuông chùa xa xa, sáo Pan vọng ở A'.
import { bars, grid, midi, pattern } from "../lib/theory.mjs";

const BPB = 4;
// Gốc trầm, nốt pad, ostinato koto 8 móc đơn (- là nghỉ).
const CHORD = {
  D: ["D2", ["A3", "D4", "F4"], ["D3", "-", "A3", "D4", "-", "C4", "A3", "-"]],
  C: ["C2", ["G3", "C4", "D4"], ["C3", "-", "G3", "C4", "-", "D4", "G3", "-"]],
  F: ["F1", ["A3", "C4", "F4"], ["F3", "-", "C4", "F4", "-", "G4", "C4", "-"]],
  G: ["G1", ["G3", "D4", "F4"], ["G2", "-", "D3", "G3", "-", "A3", "D3", "-"]],
  A: ["A1", ["G3", "C4", "D4"], ["A2", "-", "G3", "A3", "-", "C4", "G3", "-"]],
  // Thang In
  Eb: ["Eb2", ["G3", "Bb3", "D4"], ["Eb3", "-", "Bb3", "D4", "-", "G4", "Bb3", "-"]],
  Di: ["D2", ["A3", "D4", "Eb4"], ["D3", "-", "A3", "D4", "-", "Eb4", "A3", "-"]],
  Bb: ["Bb1", ["G3", "Bb3", "D4"], ["Bb2", "-", "G3", "Bb3", "-", "D4", "G3", "-"]],
  Ai: ["A1", ["Eb3", "A3", "Bb3"], ["A2", "-", "Eb3", "A3", "-", "Bb3", "Eb3", "-"]],
};
const PROG = [
  "D", "D", "C", "D", "F", "G", "A", "A", // A
  "D", "D", "C", "D", "F", "G", "A", "D", // A'
  "Eb", "Eb", "Di", "Di", "Bb", "Bb", "Ai", "Ai", // B
  "D", "D", "C", "D", "F", "C", "A", "A", // A''
];

const MELODY_A = `
  -:4 A4:3 G4:1 | F4:2 G4:2 D4:4 | -:2 C4:2 D4:2 F4:2 | G4:6 -:2 |
  A4:3 C5:1 A4:2 G4:2 | F4:3 G4:1 A4:4 | C5:2 A4:2 G4:2 F4:1 G4:1 | D4:6 -:2`;
const MELODY_A2 = `
  -:2 D5:2 C5:2 A4:2 | G4:3 A4:1 C5:4 | A4:2 G4:2 F4:2 G4:2 | A4:8 |
  C5:3 D5:1 C5:2 A4:2 | G4:2 F4:2 G4:4 | F4:2 D4:2 C4:2 D4:1 F4:1 | D4:6 -:2`;
const MELODY_B = `
  -:8 | -:4 >Eb5:2 D5:2 | A4:6 Bb4:2 | A4:4 G4:4 |
  >D5:3 Eb5:1 D5:4 | Bb4:4 A4:2 G4:2 | A4:3 Bb4:1 A4:2 Eb4:2 | D4:6 -:2`;
const ECHO = `-:8 | -:8 | -:8 | -:4 A5:2 G5:2 | -:8 | -:8 | -:8 | -:4 D5:2 C5:2`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("shaku", bars(MELODY_A, { startBar: 0, vel: 80, legato: 0.98 }));
  add("shaku", bars(MELODY_A2, { startBar: 8, vel: 88, legato: 0.98 }));
  add("shaku", bars(MELODY_B, { startBar: 16, vel: 90, legato: 0.98 }));
  add("shaku", bars(MELODY_A, { startBar: 24, vel: 78, legato: 0.98 }));
  add("flute", bars(ECHO, { startBar: 8, vel: 62 }));

  PROG.forEach((c, bar) => {
    const [root, padTones, ost] = CHORD[c];
    const sec = Math.floor(bar / 8);
    add("koto", pattern(ost, { bar, vel: sec === 2 ? 66 : 58, legato: 2.6 }));
    for (const n of padTones) notes.push({ ch: "pad", t: bar * BPB, d: BPB * 0.99, p: midi(n), v: sec === 2 ? 60 : 50 });
    notes.push({ ch: "bass", t: bar * BPB, d: BPB * 0.98, p: midi(root) + 12, v: 70 });
    // Dây tremolo: thì thầm ở A', lớn dần qua đoạn B.
    if (sec === 1 || sec === 2) {
      const v = sec === 1 ? 40 : 48 + (bar - 16) * 3;
      for (const n of [padTones[0], padTones[1]]) notes.push({ ch: "trem", t: bar * BPB, d: BPB * 0.98, p: midi(n) - 12, v });
    }
    // Taiko nhịp tim: A / A'' mỗi 2 ô, A' mỗi ô, B mỗi ô thêm hai tiếng dồn cuối ô.
    const heart = (v) => add("taiko", grid("Xx......", { bar, pitch: "A2", vel: v, d: 0.5 }));
    if (sec === 0 || sec === 3) { if (bar % 2 === 0) heart(56); }
    else if (sec === 1) heart(62);
    else { heart(68 + (bar - 16) * 2); add("taiko", grid(bar >= 22 ? "......xX" : "......o.", { bar, pitch: "C3", vel: 56, d: 0.5 })); }
    // Chuông chùa xa đầu đoạn A và B; tom trầm lẻ loi.
    if (bar === 0 || bar === 16) notes.push({ ch: "bell", t: bar * BPB, d: 4, p: midi(bar === 0 ? "D4" : "Eb4"), v: 66 });
    if (sec !== 2 && bar % 4 === 3) add("perc", grid("......x.", { bar, pitch: 41, vel: 72 }));
  });
  return notes;
}

export default {
  id: "tinh_dau_noi_dia",
  title: "Tinh Đấu Nội địa",
  kind: "map",
  maps: ["tinh_dau_noi_dia"],
  bpm: 75,
  beatsPerBar: BPB,
  bars: 32,
  channels: [
    { key: "shaku", name: "Shakuhachi", channel: 1, program: 77, volume: 100, pan: 56, reverb: 95, humanTicks: 4, expr: true, vibrato: 50, bend: 0.45, bendDepth: 0.9, phrase: 4 },
    { key: "koto", name: "Đàn tranh (koto)", channel: 2, program: 107, volume: 90, pan: 78, reverb: 75, humanVel: 7, groove: true, phrase: 4, phraseAmt: 8 },
    { key: "pad", name: "Pad kính kéo vĩ", channel: 3, program: 92, volume: 92, pan: 64, reverb: 95, chorus: 40, humanVel: 2, expr: true },
    { key: "bass", name: "Contrabass", channel: 4, program: 43, volume: 70, pan: 60, reverb: 60, humanVel: 3, expr: true },
    { key: "trem", name: "Dây tremolo", channel: 5, program: 44, volume: 88, pan: 40, reverb: 80, humanVel: 2, expr: true },
    { key: "flute", name: "Sáo Pan vọng", channel: 6, program: 75, volume: 92, pan: 100, reverb: 115, expr: true, vibrato: 30 },
    { key: "taiko", name: "Taiko", channel: 7, program: 116, volume: 72, pan: 64, reverb: 70, humanTicks: 0 },
    { key: "bell", name: "Chuông chùa", channel: 8, program: 14, volume: 90, pan: 30, reverb: 110 },
    { key: "perc", name: "Tom trầm", channel: 10, program: 0, volume: 120, pan: 80, reverb: 80, humanTicks: 1 },
  ],
  notes: build(),
};
