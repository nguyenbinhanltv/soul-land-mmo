// Giao chiến boss / thú vương: dồn dập, nguy hiểm, phát thay nhạc bản đồ khi đang đánh boss thế giới hoặc tà hóa thú vương.
// Thang In trên Mi (E F A B C), 147 BPM, 48 ô (A dựng 8 ô, B giai điệu 16 ô, C leo căng 8 ô, D giai điệu + hợp xướng 16 ô), ~78 giây.
// Dây trầm chạy móc kép không nghỉ, taiko dày, kèn đồng chặt hợp âm, shakuhachi gào giai điệu (uốn mạnh), shamisen vê ở đoạn C,
// timpani phách mạnh, tom dồn và chũm chọe đầu đoạn.
import { bars, grid, midi, pattern } from "../lib/theory.mjs";

const BPB = 4;
// Gốc, hợp âm 3 nốt (thấp lên).
const CHORD = {
  E: ["E1", ["E3", "B3", "E4"]],
  F: ["F1", ["F3", "A3", "C4"]],
  A: ["A1", ["A3", "C4", "E4"]],
  C: ["C2", ["C3", "E3", "A3"]],
  B: ["B1", ["B2", "F3", "B3"]],
};
// Nốt thứ hai của ostinato (nửa cung tính từ gốc), chỉ lấy nốt trong thang In: Đô dùng Mi, Si dùng Fa (quãng ba cung).
const FIFTH = { E: 7, F: 7, A: 7, C: 4, B: 6 };
const PROG_M = ["E", "E", "F", "F", "E", "E", "B", "B", "A", "A", "C", "C", "F", "F", "B", "B"];
const PROG = [...PROG_M.slice(0, 8), ...PROG_M, "E", "F", "E", "F", "A", "B", "C", "B", ...PROG_M];

const MELODY = `
  B4:2 C5:2 E5:4 | F5:3 E5:1 C5:4 | A4:2 C5:2 F5:2 E5:2 | C5:6 B4:2 |
  E5:2 F5:2 A5:2 B5:2 | A5:3 F5:1 E5:4 | F5:2 E5:2 C5:2 B4:2 | B4:8 |
  A4:2 B4:2 C5:2 E5:2 | F5:4 E5:4 | E5:2 F5:2 A5:4 | B5:6 A5:2 |
  >C6:4 B5:2 A5:2 | F5:3 E5:1 C5:4 | B4:2 C5:2 F5:2 E5:2 | B4:4 -:4`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("shaku", bars(MELODY, { startBar: 8, vel: 96, legato: 0.95 }));
  add("shaku", bars(MELODY, { startBar: 32, vel: 100, legato: 0.95 }));

  PROG.forEach((c, bar) => {
    const [root, [a, b, cc]] = CHORD[c];
    const sec = bar < 8 ? 0 : bar < 24 ? 1 : bar < 32 ? 2 : 3;
    const r = midi(root) + 12, o = midi(root) + 24, f = r + FIFTH[c];
    // Dây trầm móc kép: gốc - gốc - quãng tám - gốc ... (đoạn A lớn dần).
    const ost = [r, r, o, r, r, o, r, r, f, r, o, r, r, f, o, r];
    ost.forEach((p, i) => notes.push({ ch: "strings", t: bar * BPB + i * 0.25, d: 0.22, p, v: (sec === 0 ? 52 + bar * 3 : 70) + (i % 4 === 0 ? 8 : 0) }));
    if (sec === 1 || sec === 3) for (const n of [a, b, cc]) add("brass", grid("X.....x.X...x...", { bar, pitch: midi(n), vel: sec === 3 ? 76 : 68, d: 0.35 }));
    if (sec === 2) add("shami", pattern(Array(16).fill(0).map((_, i) => (i % 2 ? cc : a)), { bar, step: 0.25, vel: 56 + (bar - 24) * 4, legato: 0.9, accentFirst: 6 }));
    if (sec === 3) for (const n of [a, b, cc]) notes.push({ ch: "choir", t: bar * BPB, d: BPB * 0.98, p: midi(n) + 12, v: 64 });
    if (sec === 2) for (const n of [a, b, cc]) notes.push({ ch: "choir", t: bar * BPB, d: BPB * 0.98, p: midi(n), v: 52 + (bar - 24) * 3 });

    add("taiko", grid(sec === 0 && bar < 4 ? "X.......X......." : "XxoxX.xoXxo.XxXo", { bar, pitch: "A2", vel: 72, d: 0.25 }));
    if (sec !== 0 || bar >= 4) add("taiko", grid("....X.......X...", { bar, pitch: "C3", vel: 70, d: 0.25 }));
    add("timp", grid("X.......x.......", { bar, pitch: r, vel: 70, d: 0.6 }));
    if (bar % 4 === 3) add("perc", grid("........x.x.XxXX", { bar, pitch: bar % 8 === 7 ? 43 : 47, vel: 74 }));
    if (bar % 8 === 0) add("perc", grid("X...............", { bar, pitch: 49, vel: 70, d: 1 }));
  });
  return notes;
}

export default {
  id: "giao_chien_boss",
  title: "Giao chiến boss / thú vương",
  kind: "battle",
  bpm: 147,
  beatsPerBar: BPB,
  bars: 48,
  channels: [
    { key: "shaku", name: "Shakuhachi", channel: 1, program: 77, volume: 100, pan: 60, reverb: 65, humanTicks: 2, expr: true, vibrato: 50, bend: 0.5, bendDepth: 1, phrase: 4 },
    { key: "strings", name: "Dây trầm móc kép", channel: 2, program: 48, volume: 92, pan: 44, reverb: 45, humanVel: 4 },
    { key: "brass", name: "Kèn đồng", channel: 3, program: 61, volume: 74, pan: 80, reverb: 55, humanVel: 4, groove: true },
    { key: "shami", name: "Shamisen vê", channel: 4, program: 106, volume: 96, pan: 30, reverb: 40, humanTicks: 1 },
    { key: "choir", name: "Hợp xướng", channel: 5, program: 52, volume: 84, pan: 64, reverb: 85, humanVel: 2, expr: true },
    { key: "taiko", name: "Taiko", channel: 6, program: 116, volume: 80, pan: 64, reverb: 50, humanTicks: 1, groove: true },
    { key: "timp", name: "Timpani", channel: 7, program: 47, volume: 72, pan: 56, reverb: 55, humanTicks: 1 },
    { key: "perc", name: "Tom / chũm chọe", channel: 10, program: 0, volume: 90, pan: 70, reverb: 50, humanTicks: 1 },
  ],
  notes: build(),
};
