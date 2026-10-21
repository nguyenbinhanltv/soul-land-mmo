// Đại Đấu Hồn Trường: sân đấu, khí thế, dồn dập nhưng không hỗn loạn (để còn nghe tiếng đánh). Ngũ cung La thứ (A C D E G),
// 135 BPM, 48 ô (A riff 8 ô, B giai điệu 16 ô, C trống 8 ô, D giai điệu 16 ô), ~85 giây.
// Shamisen chạy riff suốt bài, shakuhachi hát giai điệu anh hùng (D thêm sáo cách quãng tám), dây marcato chặt hợp âm,
// bass gảy móc đơn, taiko 16 nốt móc kép + trống cao phách 2 / 4, tom dồn cuối mỗi 4 ô.
import { bars, grid, midi, pattern, shift } from "../lib/theory.mjs";

const BPB = 4;
// Gốc, hợp âm (3 nốt), riff shamisen 8 móc đơn.
const CHORD = {
  Am: ["A1", ["A3", "C4", "E4"], ["A3", "A3", "C4", "A3", "D4", "A3", "E4", "D4"]],
  G: ["G1", ["G3", "D4", "E4"], ["G3", "G3", "A3", "G3", "C4", "G3", "D4", "C4"]],
  C: ["C2", ["G3", "C4", "E4"], ["C4", "C4", "D4", "C4", "E4", "C4", "G4", "E4"]],
  D: ["D2", ["A3", "D4", "E4"], ["D4", "D4", "E4", "D4", "G4", "D4", "A4", "G4"]],
  Em: ["E2", ["G3", "D4", "E4"], ["E3", "E3", "G3", "E3", "A3", "E3", "D4", "C4"]],
};
const PROG_M = ["Am", "G", "C", "D", "Am", "G", "Em", "Am", "C", "Am", "G", "C", "Am", "Em", "G", "Am"];
const PROG = [...PROG_M.slice(0, 8), ...PROG_M, "Am", "Am", "G", "G", "Am", "Am", "Em", "Em", ...PROG_M];

const MELODY = `
  E5:2 D5:1 C5:1 D5:2 E5:2 | G5:3 E5:1 D5:4 | C5:2 D5:1 E5:1 G5:2 E5:2 | D5:6 -:2 |
  A5:2 G5:1 E5:1 G5:2 A5:2 | G5:3 E5:1 D5:2 C5:2 | D5:2 E5:2 G5:1 E5:1 D5:1 C5:1 | A4:6 -:2 |
  C5:2 D5:2 E5:2 G5:2 | A5:4 G5:2 E5:2 | G5:2 E5:1 D5:1 C5:2 D5:2 | E5:8 |
  A5:2 C6:2 A5:2 G5:2 | E5:3 G5:1 E5:2 D5:2 | C5:2 D5:2 E5:1 D5:1 C5:1 D5:1 | A4:4 -:4`;
// Đoạn C: shamisen gọi, taiko đáp.
const CALL = `>A4:1 A4:1 -:2 G4:1 A4:1 -:2 | -:8 | >C5:1 C5:1 -:2 D5:1 C5:1 -:2 | -:8 | >E5:1 E5:1 -:2 D5:1 E5:1 -:2 | -:8 | >G5:1 E5:1 D5:1 C5:1 D5:2 E5:2 | -:8`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("shaku", bars(MELODY, { startBar: 8, vel: 92, legato: 0.92 }));
  add("shami", bars(CALL, { startBar: 24, vel: 92, legato: 0.6 }));
  add("shaku", bars(MELODY, { startBar: 32, vel: 96, legato: 0.92 }));
  add("flute", shift(bars(MELODY, { startBar: 32, vel: 72, legato: 0.92 }), -12));

  PROG.forEach((c, bar) => {
    const [root, tones, riff] = CHORD[c];
    const sec = bar < 8 ? 0 : bar < 24 ? 1 : bar < 32 ? 2 : 3;
    if (sec !== 2) add("shami", pattern(riff, { bar, vel: sec === 0 ? 76 : 66, legato: 0.7 }));
    if (sec !== 2) for (const n of tones) add("strings", grid("X..x..x...x.x...", { bar, pitch: midi(n), vel: sec === 3 ? 74 : 66, d: 0.3 }));
    else for (const n of tones) notes.push({ ch: "strings", t: bar * BPB, d: BPB * 0.98, p: midi(n) - 12, v: 54 + (bar - 24) * 3 });
    add("bass", grid(sec === 2 ? "X.......x......." : "X.x.x.x.X.x.x.xx", { bar, pitch: midi(root) + 12, vel: 76, d: 0.4 }));

    // Taiko: lớn móc kép, trống cao phách 2 / 4; đoạn C taiko dẫn; tom dồn ô cuối mỗi 4 ô.
    add("taiko", grid(sec === 2 ? (bar % 2 ? "X..xX..xX.x.Xxxx" : "X...x..xX...x.x.") : "X.x.o.x.X.x.o.xx", { bar, pitch: "A2", vel: 70, d: 0.25 }));
    if (sec !== 2) add("taiko", grid("....X.......X...", { bar, pitch: "C3", vel: 62, d: 0.25 }));
    if (bar % 4 === 3) add("perc", grid("........o.x.xXxX", { bar, pitch: bar % 8 === 7 ? 45 : 47, vel: 72 }));
    if (bar % 8 === 0) add("perc", grid("X...............", { bar, pitch: 49, vel: 64, d: 1 }));
  });
  return notes;
}

export default {
  id: "dai_dau_hon_truong",
  title: "Đại Đấu Hồn Trường",
  kind: "map",
  maps: ["dai_dau_hon_truong"],
  bpm: 135,
  beatsPerBar: BPB,
  bars: 48,
  channels: [
    { key: "shaku", name: "Shakuhachi", channel: 1, program: 77, volume: 100, pan: 58, reverb: 70, humanTicks: 2, expr: true, vibrato: 40, bend: 0.3, bendDepth: 0.7, phrase: 4 },
    { key: "flute", name: "Sáo", channel: 2, program: 73, volume: 88, pan: 70, reverb: 70, humanTicks: 2, expr: true, vibrato: 30 },
    { key: "shami", name: "Shamisen", channel: 3, program: 106, volume: 92, pan: 38, reverb: 40, humanTicks: 2, groove: true, phrase: 2, phraseAmt: 8 },
    { key: "strings", name: "Dây marcato", channel: 4, program: 48, volume: 70, pan: 84, reverb: 55, humanVel: 4, groove: true },
    { key: "bass", name: "Bass gảy", channel: 5, program: 32, volume: 66, pan: 60, reverb: 25, humanVel: 5, groove: true },
    { key: "taiko", name: "Taiko", channel: 6, program: 116, volume: 76, pan: 64, reverb: 50, humanTicks: 1, groove: true },
    { key: "perc", name: "Tom / chũm chọe", channel: 10, program: 0, volume: 88, pan: 70, reverb: 50, humanTicks: 1 },
  ],
  notes: build(),
};
