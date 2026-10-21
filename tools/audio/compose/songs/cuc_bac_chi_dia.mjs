// Cực Bắc Chi Địa: băng nguyên phương bắc, lạnh, trong, mênh mông, thưa. Ngũ cung Fa# thứ (F# A B C# E), 70 BPM,
// 32 ô (A A' B A''), ~110 giây. Hợp âm đổi mỗi 2 ô cho cảm giác đứng lặng.
// Sáo Pan dẫn ở quãng cao, celesta và hộp nhạc rải như tinh thể băng, pad "giọng không gian" lạnh, koto hát đoạn B ở quãng trầm,
// contrabass ngân rất nhỏ, tam giác / chuông thanh và taiko trầm thỉnh thoảng như băng nứt.
import { bars, midi } from "../lib/theory.mjs";

const BPB = 4;
// Gốc trầm, nốt pad, nốt celesta (quãng cao).
const CHORD = {
  Fm: ["F#1", ["C#4", "F#4", "A4"], ["F#5", "A5", "C#6", "E6"]],
  E: ["E1", ["B3", "E4", "A4"], ["E5", "B5", "E6", "F#6"]],
  A: ["A1", ["C#4", "E4", "A4"], ["A5", "C#6", "E6", "B5"]],
  B: ["B1", ["F#3", "B3", "E4"], ["B5", "E6", "F#6", "C#6"]],
  Cs: ["C#2", ["B3", "E4", "F#4"], ["C#6", "E6", "F#6", "B5"]],
};
const PROG = [
  "Fm", "Fm", "E", "E", "A", "A", "B", "B", // A
  "Fm", "Fm", "A", "A", "E", "E", "Cs", "Cs", // A'
  "B", "B", "E", "E", "Fm", "Fm", "Cs", "Cs", // B
  "Fm", "Fm", "E", "E", "A", "A", "Cs", "Cs", // A''
];

const MELODY_A = `
  -:4 C#5:2 E5:2 | F#5:6 E5:2 | C#5:4 B4:2 A4:2 | B4:8 |
  -:4 A4:2 C#5:2 | E5:6 F#5:2 | E5:3 C#5:1 B4:4 | -:8`;
const MELODY_A2 = `
  -:2 F#5:2 A5:2 B5:2 | A5:4 F#5:4 | E5:3 F#5:1 E5:2 C#5:2 | B4:8 |
  -:2 C#5:2 E5:2 F#5:2 | E5:4 C#5:4 | B4:3 C#5:1 B4:2 A4:2 | C#5:8`;
const KOTO_B = `
  B3:2 C#4:2 E4:4 | E4:2 F#4:2 B3:4 | F#4:3 E4:1 C#4:4 | A3:4 B3:4 |
  B3:2 E4:2 F#4:4 | E4:2 C#4:2 B3:4 | C#4:2 E4:2 F#4:2 A4:2 | C#4:8`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("flute", bars(MELODY_A, { startBar: 0, vel: 78 }));
  add("flute", bars(MELODY_A2, { startBar: 8, vel: 84 }));
  add("koto", bars(KOTO_B, { startBar: 16, vel: 80, legato: 1.4 }));
  add("flute", bars(MELODY_A, { startBar: 24, vel: 76 }));

  PROG.forEach((c, bar) => {
    const [root, padTones, ice] = CHORD[c];
    const sec = Math.floor(bar / 8);
    // Celesta: ba nốt thưa mỗi ô, đổi chỗ theo ô chẵn / lẻ; hộp nhạc nhắc một nốt ở phách lệch mỗi 2 ô.
    const steps = bar % 2 ? [[0.5, 1], [2, 3], [3, 0]] : [[0, 0], [1.5, 2], [2.5, 1]];
    for (const [t, i] of steps) notes.push({ ch: "celesta", t: bar * BPB + t, d: 1.5, p: midi(ice[i]), v: sec === 1 ? 60 : 52 });
    if (bar % 2 === 1) notes.push({ ch: "box", t: bar * BPB + 1.5, d: 2, p: midi(ice[3]), v: 50 });
    if (bar % 2 === 0) {
      for (const n of padTones) notes.push({ ch: "pad", t: bar * BPB, d: BPB * 1.98, p: midi(n), v: sec === 2 ? 62 : 54 });
      notes.push({ ch: "bass", t: bar * BPB, d: BPB * 1.98, p: midi(root) + 12, v: 58 });
    }
    // Tam giác đầu mỗi 4 ô, chuông thanh cuối mỗi đoạn, taiko trầm như băng nứt giữa đoạn.
    if (bar % 4 === 0) notes.push({ ch: "perc", t: bar * BPB, d: 1, p: 81, v: 56 });
    if (bar % 8 === 7) notes.push({ ch: "perc", t: bar * BPB + 2, d: 2, p: 84, v: 60 });
    if (bar % 8 === 4) notes.push({ ch: "taiko", t: bar * BPB, d: 1, p: midi("A2"), v: 58 });
  });
  return notes;
}

export default {
  id: "cuc_bac_chi_dia",
  title: "Cực Bắc Chi Địa",
  kind: "map",
  maps: ["cuc_bac_chi_dia"],
  bpm: 70,
  beatsPerBar: BPB,
  bars: 32,
  channels: [
    { key: "flute", name: "Sáo Pan", channel: 1, program: 75, volume: 92, pan: 58, reverb: 105, chorus: 12, humanTicks: 3, expr: true, vibrato: 32, bend: 0.1, phrase: 4 },
    { key: "celesta", name: "Celesta", channel: 2, program: 8, volume: 78, pan: 84, reverb: 100, humanVel: 6 },
    { key: "box", name: "Hộp nhạc", channel: 3, program: 10, volume: 95, pan: 30, reverb: 110 },
    { key: "pad", name: "Giọng không gian", channel: 4, program: 91, volume: 70, pan: 64, reverb: 100, chorus: 50, humanVel: 2, expr: true },
    { key: "koto", name: "Đàn tranh (koto)", channel: 5, program: 107, volume: 92, pan: 70, reverb: 90, humanVel: 6, phrase: 4 },
    { key: "bass", name: "Contrabass", channel: 6, program: 43, volume: 56, pan: 60, reverb: 70, humanVel: 2, expr: true },
    { key: "taiko", name: "Taiko", channel: 7, program: 116, volume: 70, pan: 50, reverb: 100, humanTicks: 0 },
    { key: "perc", name: "Tam giác / chuông thanh", channel: 10, program: 0, volume: 110, pan: 76, reverb: 100, humanTicks: 1 },
  ],
  notes: build(),
};
