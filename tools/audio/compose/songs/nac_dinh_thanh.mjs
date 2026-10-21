// Nặc Đinh Thành: thành nhỏ có học viện, phố chợ rộn ràng, ấm áp. Ngũ cung Sol (G A B D E), 105 BPM, 32 ô (A B A' C), ~73 giây.
// Sáo dẫn đoạn A, shamisen dẫn đoạn B (sáo đáp), A' sáo và shamisen chơi cùng giai điệu cách quãng tám (kiểu dị âm phương Đông),
// C koto dẫn, sáo ngân bè. Dây pizzicato gõ phách lệch, koto trầm nảy, mõ gỗ / lắc / taiko giữ nhịp chợ.
import { bars, grid, midi, pattern, shift } from "../lib/theory.mjs";

const BPB = 4;
const CHORD = {
  G: ["G2", ["G3", "D4", "G4", "A4", "B4", "D5"]],
  Em: ["E2", ["E3", "B3", "E4", "G4", "A4", "B4"]],
  D: ["D2", ["D3", "A3", "D4", "E4", "A4", "B4"]],
  Am: ["A1", ["A2", "E3", "A3", "B3", "D4", "E4"]],
  Bm: ["B1", ["B2", "D3", "A3", "B3", "D4", "E4"]],
};
const PROG = [
  "G", "D", "Em", "Bm", "G", "Am", "D", "G", // A
  "Em", "Em", "D", "G", "Am", "Em", "D", "D", // B
  "G", "D", "Em", "Bm", "G", "Am", "D", "G", // A'
  "G", "G", "Am", "Am", "Em", "D", "Am", "D", // C
];

const MELODY_A = `
  D5:1 E5:1 G5:2 E5:1 D5:1 B4:2 | A4:1 B4:1 D5:2 A4:4 | B4:1 D5:1 E5:2 G5:1 E5:1 D5:2 | B4:2 A4:1 B4:1 D5:4 |
  G5:1 A5:1 G5:1 E5:1 D5:2 E5:2 | A4:2 B4:1 D5:1 E5:2 D5:2 | B4:1 A4:1 B4:1 D5:1 A4:2 E4:2 | G4:4 -:2 D5:1 E5:1`;
const MELODY_B = `
  E4:1 E4:1 G4:1 A4:1 B4:2 A4:1 G4:1 | E4:2 D4:1 E4:1 G4:4 | A4:1 A4:1 B4:1 D5:1 E5:2 D5:1 B4:1 | D5:2 B4:1 A4:1 G4:4 |
  A4:1 B4:1 A4:1 G4:1 E4:2 G4:2 | B4:1 A4:1 G4:1 E4:1 D4:2 E4:2 | D4:1 E4:1 G4:1 A4:1 B4:1 A4:1 G4:1 A4:1 | D5:6 -:2`;
const FLUTE_B = `-:8 | -:4 B5:2 A5:2 | -:8 | -:4 E5:2 D5:2 | -:8 | -:4 G5:4 | -:8 | -:8`;
const MELODY_C = `
  G4:1 B4:1 D5:1 G5:1 E5:1 D5:1 B4:1 D5:1 | E5:2 D5:1 B4:1 A4:2 G4:2 | A4:1 B4:1 D5:1 E5:1 A5:2 E5:2 | D5:1 B4:1 A4:1 B4:1 E4:4 |
  E4:1 G4:1 A4:1 B4:1 D5:2 B4:2 | A4:2 D5:2 E5:2 D5:2 | B4:1 A4:1 G4:1 A4:1 B4:2 D5:2 | A4:4 D5:1 B4:1 A4:1 B4:1`;
const FLUTE_C = `D5:8 | B4:8 | E5:8 | B4:8 | B4:8 | A4:8 | D5:4 B4:4 | A4:8`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("flute", bars(MELODY_A, { startBar: 0, vel: 86 }));
  add("shami", bars(MELODY_B, { startBar: 8, vel: 84, legato: 0.7 }));
  add("flute", bars(FLUTE_B, { startBar: 8, vel: 70 }));
  add("flute", bars(MELODY_A, { startBar: 16, vel: 92 }));
  add("shami", shift(bars(MELODY_A, { startBar: 16, vel: 70, legato: 0.55 }), -12));
  add("koto", bars(MELODY_C, { startBar: 24, vel: 84, legato: 1.3 }));
  add("flute", bars(FLUTE_C, { startBar: 24, vel: 58 }));

  PROG.forEach((c, bar) => {
    const [root, tones] = CHORD[c];
    const r = midi(root) + 12;
    // Koto rải ở A / A' (đoạn B rải thưa, đoạn C koto đang dẫn nên không rải).
    if (bar < 8 || (bar >= 16 && bar < 24)) add("koto", pattern([0, 2, 1, 3, 2, 4, 3, 5].map((i) => tones[i]), { bar, vel: 56 }));
    else if (bar < 16) add("koto", pattern([0, "-", 2, "-", 1, "-", 3, "-"].map((i) => (i === "-" ? "-" : tones[i])), { bar, vel: 54 }));
    // Koto trầm nảy: gốc - năm - gốc - năm.
    for (const [t, p, d, v] of [[0, r, 0.9, 80], [1.5, midi(tones[1]) - 12, 0.4, 62], [2, r, 0.9, 74], [3.5, midi(tones[1]) - 12, 0.4, 60]]) {
      notes.push({ ch: "bass", t: bar * BPB + t, d, p, v });
    }
    // Dây pizzicato gõ phách lệch.
    for (const t of [0.5, 1.5, 2.5, 3.5]) for (const n of [tones[2], tones[3]]) notes.push({ ch: "chop", t: bar * BPB + t, d: 0.3, p: midi(n), v: 58 });
    for (const n of [tones[0], tones[1], tones[4]]) notes.push({ ch: "pad", t: bar * BPB, d: BPB * 0.98, p: midi(n), v: 44 });

    // Trống chợ: mõ gỗ cao, lắc móc đơn, taiko phách 1 và 3, trống lục lạc phách 2 / 4 ở A' và C.
    add("perc", grid("X.o.x.oo", { bar, pitch: 76, vel: 70 }));
    add("perc", grid("oxoxoxox", { bar, pitch: 70, vel: 56 }));
    if (bar >= 16) add("perc", grid("..x...x.", { bar, pitch: 54, vel: 54 }));
    add("taiko", grid(bar % 8 === 7 ? "X...x.xx" : "x...o...", { bar, pitch: "C3", vel: 66, d: 0.5 }));
  });
  return notes;
}

export default {
  id: "nac_dinh_thanh",
  title: "Nặc Đinh Thành",
  kind: "map",
  maps: ["nac_dinh_thanh"],
  bpm: 105,
  beatsPerBar: BPB,
  bars: 32,
  channels: [
    { key: "flute", name: "Sáo trúc", channel: 1, program: 73, volume: 96, pan: 58, reverb: 62, chorus: 8, humanTicks: 3, expr: true, vibrato: 34, bend: 0.1, phrase: 4 },
    { key: "koto", name: "Đàn tranh (koto)", channel: 2, program: 107, volume: 96, pan: 82, reverb: 50, humanVel: 7, groove: true, phrase: 4, phraseAmt: 8 },
    { key: "bass", name: "Koto trầm", channel: 3, program: 107, volume: 82, pan: 60, reverb: 35, groove: true },
    { key: "shami", name: "Shamisen", channel: 4, program: 106, volume: 100, pan: 40, reverb: 45, humanTicks: 3, groove: true, phrase: 4 },
    { key: "chop", name: "Dây pizzicato", channel: 5, program: 45, volume: 64, pan: 92, reverb: 45, groove: true },
    { key: "pad", name: "Pad ấm", channel: 6, program: 89, volume: 72, pan: 64, reverb: 80, chorus: 30, humanVel: 2, expr: true },
    { key: "taiko", name: "Taiko", channel: 7, program: 116, volume: 74, pan: 64, reverb: 50, humanTicks: 0 },
    { key: "perc", name: "Mõ gỗ / lắc / lục lạc", channel: 10, program: 0, volume: 92, pan: 70, reverb: 40, humanTicks: 1, groove: true },
  ],
  notes: build(),
};
