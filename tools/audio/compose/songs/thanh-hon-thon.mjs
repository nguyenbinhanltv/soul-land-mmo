// Thánh Hồn Thôn: làng quê yên bình. Ngũ cung Rê (cung Rê: D E F# A B), 84 BPM, 32 ô (A A' B A''), ~91 giây.
// Sáo Pan dẫn giai điệu, đàn tranh (koto) rải hợp âm, koto trầm giữ bè, shamisen đối đáp, shakuhachi hát đoạn B,
// dây (strings) đệm rất nhỏ, trống taiko nhẹ và mõ gỗ giữ nhịp.
import { bars, midi, pattern } from "../lib/theory.mjs";

const BPB = 4;

// Hợp âm theo ô (chỉ dùng nốt trong ngũ cung): tên -> [bè trầm, các nốt rải từ thấp lên].
const CHORD = {
  D: ["D2", ["D3", "A3", "D4", "E4", "F#4", "A4"]],
  Bm: ["B1", ["B2", "F#3", "B3", "D4", "E4", "F#4"]],
  E: ["E2", ["E3", "B3", "E4", "F#4", "A4", "B4"]],
  A: ["A1", ["A2", "E3", "A3", "B3", "E4", "F#4"]],
  F: ["F#2", ["F#3", "A3", "B3", "E4", "F#4", "A4"]],
};
const PROG = [
  "D", "Bm", "E", "D", "E", "F", "A", "D", // A
  "D", "A", "Bm", "D", "E", "Bm", "A", "D", // A'
  "Bm", "D", "E", "Bm", "Bm", "F", "E", "A", // B
  "D", "Bm", "E", "D", "E", "F", "A", "D", // A''
];

const MELODY_A = `
  A4:2 B4:1 D5:1 E5:3 D5:1 | B4:2 A4:2 F#4:4 | E4:2 F#4:1 A4:1 B4:2 A4:1 B4:1 | D5:6 -:2 |
  E5:2 F#5:1 E5:1 D5:2 B4:2 | A4:2 B4:1 A4:1 F#4:2 E4:2 | F#4:2 A4:2 B4:1 A4:1 F#4:1 E4:1 | D4:6 -:2`;
const MELODY_A2 = `
  A4:1 B4:1 D5:2 E5:2 F#5:2 | E5:2 D5:1 B4:1 A4:4 | B4:2 D5:1 E5:1 F#5:2 A5:2 | F#5:6 E5:1 D5:1 |
  E5:3 F#5:1 E5:2 D5:2 | B4:2 A4:1 B4:1 D5:4 | E5:2 D5:1 B4:1 A4:2 F#4:1 E4:1 | D4:6 -:2`;
// Đoạn B nghiêng về điệu Vũ (lấy Si làm chủ), shakuhachi hát thấp, trầm lắng hơn.
const MELODY_B = `
  F#4:3 A4:1 B4:4 | A4:2 F#4:2 E4:2 D4:2 | E4:3 F#4:1 A4:2 B4:2 | F#4:8 |
  B4:3 D5:1 E5:2 D5:2 | B4:2 A4:2 F#4:4 | E4:2 F#4:2 A4:2 B4:1 A4:1 | B4:4 A4:4`;
// A'' kết bằng nốt đi lên để nối về ô 1 (vòng lặp).
const MELODY_A3 = `
  A4:2 B4:1 D5:1 E5:3 D5:1 | B4:2 A4:2 F#4:4 | E4:2 F#4:1 A4:1 B4:2 A4:1 B4:1 | D5:6 -:2 |
  E5:2 F#5:1 E5:1 D5:2 B4:2 | A4:2 B4:1 A4:1 F#4:2 E4:2 | F#4:2 A4:2 B4:1 A4:1 F#4:1 E4:1 | D4:4 E4:2 F#4:2`;

// Shamisen đáp lại sau mỗi câu sáo ở A' và A'' (khoảng nghỉ của giai điệu), đoạn B gảy nhịp lệch.
const SHAMISEN_A = `
  -:8 | -:8 | -:8 | -:4 A4:1 B4:1 D5:2 | -:8 | -:8 | -:8 | -:4 F#4:1 E4:1 D4:2`;
const SHAMISEN_B = `
  -:1 B3:1 -:1 B3:1 -:1 D4:1 -:1 B3:1 | -:1 A3:1 -:1 A3:1 -:1 D4:1 -:1 A3:1 |
  -:1 B3:1 -:1 B3:1 -:1 E4:1 -:1 B3:1 | -:1 F#3:1 -:1 B3:1 -:1 D4:1 -:1 F#4:1 |
  -:1 B3:1 -:1 B3:1 -:1 D4:1 -:1 B3:1 | -:1 A3:1 -:1 F#3:1 -:1 A3:1 -:1 B3:1 |
  -:1 B3:1 -:1 E4:1 -:1 B3:1 -:1 E4:1 | -:1 A3:1 -:1 E4:1 -:1 A3:1 -:2`;

// Kiểu rải koto (chỉ số vào danh sách nốt của hợp âm), đổi theo đoạn cho đỡ lặp.
const ARP = {
  A: [0, 1, 2, 3, 4, 3, 2, 1],
  A2: [0, 2, 1, 3, 2, 4, 3, 5],
  B: [0, 1, 2, 1, 3, -1, 2, 1],
};

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("flute", bars(MELODY_A, { startBar: 0, vel: 84 }));
  add("flute", bars(MELODY_A2, { startBar: 8, vel: 90 }));
  add("shaku", bars(MELODY_B, { startBar: 16, vel: 86, legato: 0.98 }));
  add("flute", bars(MELODY_A3, { startBar: 24, vel: 86 }));
  // A'': shakuhachi ngân nốt dài dưới sáo (bè thứ hai), mỗi ô một nốt gốc của hợp âm.
  PROG.slice(24).forEach((c, i) => {
    notes.push({ ch: "shaku", t: (24 + i) * BPB, d: BPB * 0.95, p: midi(CHORD[c][1][0]) + 12, v: 50 });
  });

  add("shami", bars(SHAMISEN_A, { startBar: 8, vel: 74 }));
  add("shami", bars(SHAMISEN_B, { startBar: 16, vel: 66, legato: 0.6 }));
  add("shami", bars(SHAMISEN_A, { startBar: 24, vel: 74 }));

  PROG.forEach((c, bar) => {
    const [bass, tones] = CHORD[c];
    const section = bar < 8 ? "A" : bar < 16 ? "A2" : bar < 24 ? "B" : bar < 28 ? "A" : "A2";
    const names = ARP[section].map((i) => (i < 0 ? "-" : tones[i]));
    add("koto", pattern(names, { bar, vel: 58 }));
    // Koto trầm: gốc ở phách 1, quãng năm ở phách 3,5.
    notes.push({ ch: "bass", t: bar * BPB, d: 2.5, p: midi(bass) + 12, v: 76 });
    notes.push({ ch: "bass", t: bar * BPB + 2.5, d: 1.4, p: midi(tones[1]), v: 60 });
    // Dây đệm: gốc + quãng năm + nốt thứ 3 của danh sách, rất nhỏ.
    for (const n of [tones[0], tones[1], tones[3]]) notes.push({ ch: "pad", t: bar * BPB, d: BPB * 0.98, p: midi(n), v: 46 });

    // Trống: taiko nhẹ đầu mỗi 2 ô; mõ gỗ "tóc . tóc . . tóc . ." từ A' trở đi, đoạn B thêm lắc nhẹ.
    if (bar % 2 === 0) notes.push({ ch: "taiko", t: bar * BPB, d: 1, p: midi("C3"), v: bar % 8 === 0 ? 70 : 54 });
    if (bar % 8 === 7) notes.push({ ch: "taiko", t: bar * BPB + 3.5, d: 0.5, p: midi("C3"), v: 44 });
    if (bar >= 8) {
      for (const [step, v] of [[0, 84], [1.5, 66], [3, 72]]) notes.push({ ch: "perc", t: bar * BPB + step, d: 0.25, p: 77, v });
    }
    if (bar >= 16 && bar < 24) {
      for (let s = 0; s < 8; s++) notes.push({ ch: "perc", t: bar * BPB + s * 0.5, d: 0.25, p: 70, v: s % 2 ? 50 : 64 });
    }
  });
  return notes;
}

export default {
  id: "thanh-hon-thon",
  title: "Thánh Hồn Thôn",
  bpm: 84,
  beatsPerBar: BPB,
  bars: 32,
  channels: [
    { key: "flute", name: "Sáo Pan", channel: 1, program: 75, volume: 100, pan: 60, reverb: 70, chorus: 10, humanTicks: 3 },
    { key: "koto", name: "Đàn tranh (koto)", channel: 2, program: 107, volume: 100, pan: 80, reverb: 55, humanVel: 8 },
    { key: "bass", name: "Koto trầm", channel: 3, program: 107, volume: 84, pan: 58, reverb: 40 },
    { key: "shami", name: "Shamisen", channel: 4, program: 106, volume: 100, pan: 40, reverb: 50, humanTicks: 3 },
    { key: "shaku", name: "Shakuhachi", channel: 5, program: 77, volume: 90, pan: 70, reverb: 75 },
    { key: "pad", name: "Dây đệm", channel: 6, program: 49, volume: 58, pan: 64, reverb: 80, chorus: 30, humanVel: 2 },
    { key: "taiko", name: "Taiko", channel: 7, program: 116, volume: 80, pan: 64, reverb: 60, humanTicks: 0 },
    { key: "perc", name: "Mõ gỗ / lắc", channel: 10, program: 0, volume: 100, pan: 72, reverb: 45, humanTicks: 1 },
  ],
  notes: build(),
};
