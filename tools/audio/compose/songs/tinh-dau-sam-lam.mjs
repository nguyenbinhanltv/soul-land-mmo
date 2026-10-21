// Tinh Đấu Sâm Lâm: rừng sâu huyền bí, căng thẳng nhẹ. 72 BPM, 32 ô (A A' B A''), ~107 giây.
// Đoạn A dùng điệu Vũ trên La (A C D E G); đoạn B chuyển sang thang In của Nhật (A Bb D E F) cho cảm giác bất an
// (quãng nửa cung La - Si giáng), rồi trở về. Shakuhachi dẫn, koto rải ostinato, dây ngân nền trầm,
// taiko như nhịp tim (dày dần ở đoạn B), shamisen gảy ngắn ở đoạn B.
import { bars, midi, pattern } from "../lib/theory.mjs";

const BPB = 4;

// Nền trầm và ostinato koto (8 móc đơn) theo từng hợp âm.
const CHORD = {
  Am: ["A1", ["A2", "E3"], ["A3", "E4", "A4", "E4", "G4", "E4", "D4", "E4"]],
  G: ["G1", ["G2", "D3"], ["G3", "D4", "G4", "D4", "E4", "D4", "C4", "D4"]],
  C: ["C2", ["C3", "G3"], ["C4", "G4", "C5", "G4", "A4", "G4", "E4", "G4"]],
  Em: ["E2", ["E2", "D3"], ["E3", "E4", "G4", "E4", "A4", "E4", "D4", "E4"]],
  // Thang In
  Bb: ["Bb1", ["Bb2", "F3"], ["Bb3", "F4", "A4", "F4", "D4", "E4", "D4", "F4"]],
  Ai: ["A1", ["A2", "E3"], ["A3", "E4", "A4", "E4", "F4", "E4", "D4", "E4"]],
  F: ["F1", ["F2", "F3"], ["F3", "E4", "A4", "E4", "F4", "E4", "D4", "E4"]],
  Ei: ["E2", ["E2", "Bb2"], ["E3", "D4", "E4", "F4", "E4", "D4", "Bb3", "D4"]],
};
const PROG = [
  "Am", "Am", "G", "Am", "Am", "Am", "C", "Em", // A
  "Am", "Am", "G", "Am", "C", "G", "Em", "Am", // A'
  "Bb", "Bb", "Ai", "Ai", "F", "F", "Ei", "Ei", // B
  "Am", "Am", "G", "Am", "Am", "Am", "C", "Em", // A''
];

const MELODY_A = `
  -:4 E5:3 D5:1 | C5:2 D5:2 A4:4 | -:2 G4:2 A4:2 C5:2 | D5:6 -:2 |
  E5:3 G5:1 E5:2 D5:2 | C5:3 D5:1 A4:4 | G4:2 A4:2 C5:2 D5:1 C5:1 | E5:6 -:2`;
const MELODY_A2 = `
  -:2 A5:2 G5:2 E5:2 | D5:3 E5:1 G5:4 | E5:2 D5:2 C5:2 D5:2 | E5:8 |
  G5:3 A5:1 G5:2 E5:2 | D5:2 C5:2 D5:4 | C5:2 A4:2 G4:2 A4:1 C5:1 | A4:6 -:2`;
const MELODY_B = `
  -:8 | -:4 D5:2 E5:2 | >F5:6 E5:2 | D5:4 Bb4:4 |
  A4:3 Bb4:1 D5:4 | E5:4 >F5:2 E5:2 | D5:3 Bb4:1 A4:4 | >E5:6 -:2`;
// A'': nhẹ dần, câu cuối dừng sớm để ostinato tự nối về ô 1.
const MELODY_A3 = `
  -:4 E5:3 D5:1 | C5:2 D5:2 A4:4 | -:2 G4:2 A4:2 C5:2 | D5:6 -:2 |
  E5:3 G5:1 E5:2 D5:2 | C5:3 D5:1 A4:4 | G4:2 A4:2 C5:2 D5:2 | A4:4 -:4`;

// Shamisen đoạn B: nốt ngắn lặp, nhịp lệch, tạo bất an.
const SHAMISEN_B = `
  >A3:1 A3:1 -:2 A3:1 Bb3:1 -:2 | >A3:1 A3:1 -:2 D4:1 Bb3:1 -:1 A3:1 |
  >A3:1 A3:1 -:2 A3:1 Bb3:1 -:2 | >A3:1 A3:1 -:2 E4:1 D4:1 -:1 Bb3:1 |
  >F3:1 F3:1 -:2 F3:1 A3:1 -:2 | >F3:1 F3:1 -:2 A3:1 Bb3:1 -:1 A3:1 |
  >E3:1 E3:1 -:1 E3:1 F3:1 E3:1 -:1 Bb3:1 | >E3:1 E3:1 F3:1 E3:1 >Bb3:1 A3:1 F3:1 E3:1`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("shaku", bars(MELODY_A, { startBar: 0, vel: 82, legato: 0.98 }));
  add("shaku", bars(MELODY_A2, { startBar: 8, vel: 88, legato: 0.98 }));
  add("shaku", bars(MELODY_B, { startBar: 16, vel: 90, legato: 0.98 }));
  add("shaku", bars(MELODY_A3, { startBar: 24, vel: 80, legato: 0.98 }));
  add("shami", bars(SHAMISEN_B, { startBar: 16, vel: 70, legato: 0.5 }));
  // Sáo Pan vọng lại xa xa ở A' (bè cao, rất nhỏ), như tiếng gọi trong rừng.
  add("flute", bars(`-:8 | -:8 | -:8 | -:4 A5:2 G5:2 | -:8 | -:8 | -:8 | -:4 E5:2 D5:2`, { startBar: 8, vel: 64 }));

  PROG.forEach((c, bar) => {
    const [, drone, ost] = CHORD[c];
    const inB = bar >= 16 && bar < 24;
    // Đoạn A thưa ostinato ở 2 ô đầu (chỉ nửa đầu ô) để mở bài nhẹ; còn lại rải đủ 8 nốt.
    const names = bar < 2 ? ost.map((n, i) => (i < 4 ? n : "-")) : ost;
    add("koto", pattern(names, { bar, vel: inB ? 64 : 58, legato: 2.2 }));
    for (const n of drone) notes.push({ ch: "pad", t: bar * BPB, d: BPB * 0.99, p: midi(n), v: inB ? 60 : 50 });
    // Koto trầm: gốc ở phách 1, nhắc lại ở phách 3 khi vào đoạn B.
    notes.push({ ch: "bass", t: bar * BPB, d: 3, p: midi(CHORD[c][0]) + 12, v: 72 });
    if (inB) notes.push({ ch: "bass", t: bar * BPB + 2, d: 1.5, p: midi(CHORD[c][0]) + 12, v: 58 });

    // Taiko nhịp tim "thình-thịch": A thưa (2 ô một lần), A' mỗi ô, B dày dần và dồn ở 2 ô cuối.
    const heart = (v) => {
      notes.push({ ch: "taiko", t: bar * BPB, d: 0.5, p: midi("A2"), v });
      notes.push({ ch: "taiko", t: bar * BPB + 0.5, d: 0.5, p: midi("A2"), v: v - 16 });
    };
    if (bar < 8 || bar >= 24) { if (bar % 2 === 0) heart(bar >= 24 ? 58 : 62); }
    else if (bar < 16) heart(68);
    else {
      heart(74 + (bar - 16) * 2);
      notes.push({ ch: "taiko", t: bar * BPB + 2, d: 0.5, p: midi("C3"), v: 56 });
      if (bar >= 22) for (let s = 0; s < 4; s++) notes.push({ ch: "taiko", t: bar * BPB + 3 + s * 0.25, d: 0.25, p: midi("C3"), v: 50 + s * 6 + (bar - 22) * 8 });
    }
    // Lắc rất nhỏ ở đoạn B cho tiếng côn trùng rừng; tam giác lẻ loi đầu mỗi 4 ô ở đoạn A.
    if (inB) for (let s = 0; s < 8; s++) notes.push({ ch: "perc", t: bar * BPB + s * 0.5, d: 0.25, p: 70, v: s % 2 ? 48 : 60 });
    else if (bar % 4 === 0) notes.push({ ch: "perc", t: bar * BPB + 2, d: 1, p: 81, v: 70 });
  });
  return notes;
}

export default {
  id: "tinh-dau-sam-lam",
  title: "Tinh Đấu Sâm Lâm",
  bpm: 72,
  beatsPerBar: BPB,
  bars: 32,
  channels: [
    { key: "shaku", name: "Shakuhachi", channel: 1, program: 77, volume: 100, pan: 58, reverb: 90, chorus: 0, humanTicks: 4 },
    { key: "koto", name: "Đàn tranh (koto)", channel: 2, program: 107, volume: 96, pan: 78, reverb: 70, humanVel: 7 },
    { key: "bass", name: "Koto trầm", channel: 3, program: 107, volume: 90, pan: 54, reverb: 50 },
    { key: "shami", name: "Shamisen", channel: 4, program: 106, volume: 100, pan: 36, reverb: 55, humanTicks: 2 },
    { key: "flute", name: "Sáo Pan vọng", channel: 5, program: 75, volume: 100, pan: 96, reverb: 110 },
    { key: "pad", name: "Dây ngân nền", channel: 6, program: 49, volume: 56, pan: 64, reverb: 90, chorus: 40, humanVel: 2 },
    { key: "taiko", name: "Taiko", channel: 7, program: 116, volume: 84, pan: 64, reverb: 70, humanTicks: 0 },
    { key: "perc", name: "Lắc / tam giác", channel: 10, program: 0, volume: 120, pan: 30, reverb: 70, humanTicks: 1 },
  ],
  notes: build(),
};
