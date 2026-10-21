// Lõi Tinh Đấu: hồ trung tâm Tinh Đấu Đại Sâm Lâm, nơi boss thế giới ngự, u uẩn, linh thiêng, đè nặng. 98 BPM nhưng trống
// nửa nhịp (cảm giác 49), 32 ô (A A' B A''), ~78 giây. Đoạn A ngũ cung Đô thứ (C Eb F G Bb), đoạn B thang In trên Đô
// (C Db F G Ab). Shakuhachi gào ở quãng cao, dây trầm chạy ostinato, hợp xướng nam ngân, kèn đồng trầm hát A',
// contrabass, chuông ống điểm hồi, taiko lớn và timpani cuộn cuối đoạn.
import { bars, grid, midi, pattern, shift } from "../lib/theory.mjs";

const BPB = 4;
// Gốc trầm, ba nốt hợp âm (thấp lên cao).
const CHORD = {
  Cm: ["C2", ["C3", "G3", "Eb4"]],
  Bb: ["Bb1", ["Bb2", "F3", "Bb3"]],
  Eb: ["Eb2", ["Eb3", "G3", "Bb3"]],
  F: ["F1", ["F2", "C3", "G3"]],
  G: ["G1", ["G2", "F3", "Bb3"]],
  // Thang In
  Db: ["Db2", ["Db3", "F3", "Ab3"]],
  Ci: ["C2", ["C3", "G3", "Db4"]],
  Ab: ["Ab1", ["Ab2", "C3", "G3"]],
  Fm: ["F1", ["F2", "Ab2", "C3"]],
  Gi: ["G1", ["G2", "Db3", "F3"]],
};
const PROG = [
  "Cm", "Cm", "Bb", "Cm", "Eb", "F", "G", "Cm", // A
  "Cm", "Cm", "Bb", "Cm", "Eb", "F", "G", "G", // A'
  "Db", "Db", "Ci", "Ci", "Ab", "Ab", "Fm", "Gi", // B
  "Cm", "Cm", "Bb", "Cm", "Eb", "F", "G", "G", // A''
];

const MELODY_A = `
  -:4 G5:3 F5:1 | Eb5:4 C5:4 | -:2 Bb4:2 C5:2 Eb5:2 | F5:6 -:2 |
  G5:3 Bb5:1 G5:2 F5:2 | Eb5:3 F5:1 C5:4 | Bb4:2 C5:2 Eb5:2 F5:1 Eb5:1 | C5:6 -:2`;
const CRIES = `-:8 | -:4 >C6:4 | -:8 | -:4 Bb5:4 | -:8 | -:4 G5:4 | -:8 | -:8`;
const MELODY_B = `
  >Db5:6 C5:2 | Ab4:4 G4:4 | -:2 C5:2 Db5:2 F5:2 | G5:6 F5:2 |
  >Ab5:4 G5:2 F5:2 | Db5:4 C5:4 | Ab4:3 G4:1 F4:2 Ab4:2 | G4:8`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("shaku", bars(MELODY_A, { startBar: 0, vel: 86, legato: 0.98 }));
  add("brass", shift(bars(MELODY_A, { startBar: 8, vel: 80, legato: 0.98 }), -24));
  add("shaku", bars(CRIES, { startBar: 8, vel: 90, legato: 0.98 }));
  add("shaku", bars(MELODY_B, { startBar: 16, vel: 94, legato: 0.98 }));
  add("shaku", bars(MELODY_A, { startBar: 24, vel: 92, legato: 0.98 }));
  add("brass", shift(bars(MELODY_A, { startBar: 24, vel: 70, legato: 0.98 }), -24));

  PROG.forEach((c, bar) => {
    const [root, [a, b, cc]] = CHORD[c];
    const sec = Math.floor(bar / 8);
    add("strings", pattern([a, a, b, a, cc, a, b, a], { bar, vel: sec === 2 ? 70 : 62, legato: 0.8 }));
    notes.push({ ch: "bass", t: bar * BPB, d: BPB * 0.98, p: midi(root) + 12, v: 74 });
    for (const n of [a, b]) notes.push({ ch: "choir", t: bar * BPB, d: BPB * 0.98, p: midi(n) + 12, v: sec === 0 ? 50 : 60 });
    if (bar % 2 === 0) notes.push({ ch: "bell", t: bar * BPB, d: 3, p: midi(a) + 24, v: sec === 2 ? 70 : 60 });

    // Taiko nửa nhịp; đoạn B dày hơn; timpani cuộn ô cuối mỗi đoạn.
    add("taiko", grid(sec === 2 ? "X...o...X.o.x.o." : "X.......x.o.....", { bar, pitch: "A2", vel: 72, d: 0.5 }));
    if (sec >= 1) add("taiko", grid("....x.......x...", { bar, pitch: "C3", vel: 54, d: 0.5 }));
    if (bar % 8 === 7) add("timp", grid("o.o.o.o.ooooxxxX", { bar, pitch: midi(root) + 12, vel: 62, d: 0.3 }));
    else if (bar % 2 === 0) add("timp", grid("x...............", { bar, pitch: midi(root) + 12, vel: 64, d: 0.8 }));
  });
  return notes;
}

export default {
  id: "loi_tinh_dau",
  title: "Lõi Tinh Đấu",
  kind: "map",
  maps: ["loi_tinh_dau"],
  bpm: 98,
  beatsPerBar: BPB,
  bars: 32,
  channels: [
    { key: "shaku", name: "Shakuhachi", channel: 1, program: 77, volume: 100, pan: 60, reverb: 100, humanTicks: 3, expr: true, vibrato: 56, bend: 0.5, bendDepth: 1, phrase: 4 },
    { key: "strings", name: "Dây trầm ostinato", channel: 2, program: 48, volume: 84, pan: 44, reverb: 70, humanVel: 5, groove: true, phrase: 2, phraseAmt: 10 },
    { key: "choir", name: "Hợp xướng", channel: 3, program: 52, volume: 84, pan: 64, reverb: 100, humanVel: 2, expr: true },
    { key: "brass", name: "Kèn đồng trầm", channel: 4, program: 57, volume: 88, pan: 72, reverb: 85, expr: true, vibrato: 16 },
    { key: "bass", name: "Contrabass", channel: 5, program: 43, volume: 74, pan: 56, reverb: 70, humanVel: 2, expr: true },
    { key: "bell", name: "Chuông ống", channel: 6, program: 14, volume: 90, pan: 84, reverb: 110 },
    { key: "taiko", name: "Taiko", channel: 7, program: 116, volume: 78, pan: 64, reverb: 80, humanTicks: 0 },
    { key: "timp", name: "Timpani", channel: 8, program: 47, volume: 70, pan: 58, reverb: 70, humanTicks: 1 },
  ],
  notes: build(),
};
