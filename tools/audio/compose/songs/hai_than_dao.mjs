// Hải Thần Đảo: đảo và rạn biển của Hải Thần, sóng cuộn, rộng lớn, linh thiêng. Ngũ cung La (A B C# E F#), nhịp 3/4,
// 105 BPM, 64 ô (A B A' C, mỗi đoạn 16 ô), ~110 giây.
// Đàn hạc rải 6 móc đơn lên xuống như sóng, sáo dẫn A / A', dây và hợp xướng hát đoạn B, koto dẫn đoạn C; cello giữ gốc,
// dây ngân phồng từng 2 ô, taiko như sóng vỗ (dồn ở đoạn B), chũm chọe ngược dẫn vào mỗi đoạn.
import { bars, grid, midi, pattern } from "../lib/theory.mjs";

const BPB = 3;
const CHORD = {
  A: ["A1", ["A2", "E3", "A3", "B3", "C#4", "E4"]],
  Fm: ["F#1", ["F#2", "C#3", "F#3", "A3", "B3", "C#4"]],
  E: ["E1", ["E2", "B2", "E3", "F#3", "B3", "E4"]],
  B: ["B1", ["B2", "F#3", "B3", "C#4", "E4", "F#4"]],
  Cs: ["C#2", ["C#3", "E3", "B3", "C#4", "E4", "F#4"]],
};
const PROG_A = ["A", "A", "Fm", "Fm", "E", "E", "A", "A", "A", "A", "Fm", "Fm", "B", "B", "E", "E"];
const PROG_B = ["Fm", "Fm", "Cs", "Cs", "B", "B", "E", "E", "Fm", "Fm", "Cs", "Cs", "B", "B", "E", "E"];
const PROG_C = ["B", "B", "E", "E", "A", "A", "Fm", "Fm", "B", "B", "Cs", "Cs", "E", "E", "E", "E"];
const PROG = [...PROG_A, ...PROG_B, ...PROG_A, ...PROG_C];

const MELODY_A = `
  E5:3 C#5:1 B4:2 | A4:4 B4:2 | C#5:2 E5:2 F#5:2 | E5:6 | B4:3 C#5:1 E5:2 | F#5:2 E5:2 C#5:2 | B4:2 C#5:2 A4:2 | A4:6 |
  E5:3 F#5:1 A5:2 | F#5:4 E5:2 | C#5:2 E5:2 F#5:2 | A5:6 | F#5:3 E5:1 C#5:2 | B4:4 C#5:2 | E5:2 C#5:2 B4:2 | B4:6`;
const MELODY_B = `
  C#5:4 B4:2 | A4:2 B4:2 C#5:2 | E5:4 C#5:2 | B4:6 | F#4:2 B4:2 C#5:2 | E5:4 F#5:2 | E5:3 C#5:1 B4:2 | B4:6 |
  C#5:4 B4:2 | A4:2 B4:2 C#5:2 | E5:4 C#5:2 | B4:6 | F#4:2 B4:2 C#5:2 | E5:4 F#5:2 | E5:3 F#5:1 E5:2 | E5:6`;
const MELODY_C = `
  F#4:2 B4:2 C#5:2 | E5:4 B4:2 | E5:2 F#5:2 E5:2 | C#5:6 | A4:2 C#5:2 E5:2 | F#5:4 E5:2 | C#5:2 B4:2 A4:2 | F#4:6 |
  F#4:2 B4:2 C#5:2 | E5:4 F#5:2 | E5:2 C#5:2 B4:2 | C#5:6 | B4:3 C#5:1 E5:2 | B4:6 | E5:2 F#5:2 E5:2 | B4:4 C#5:2`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));
  const opt = (startBar, vel, legato = 0.95) => ({ startBar, vel, legato, beatsPerBar: BPB });

  add("flute", bars(MELODY_A, opt(0, 84)));
  add("strings", bars(MELODY_B, opt(16, 86, 1)));
  add("flute", bars(MELODY_A, opt(32, 90)));
  add("koto", bars(MELODY_C, opt(48, 86, 1.3)));

  PROG.forEach((c, bar) => {
    const [root, tones] = CHORD[c];
    const sec = Math.floor(bar / 16);
    add("harp", pattern([0, 1, 2, 3, 2, 1].map((i) => tones[i]), { bar, beatsPerBar: BPB, vel: sec === 1 ? 62 : 56, legato: 2.4 }));
    if (sec === 2) add("koto", pattern([3, 4, 5, 4, 3, 2].map((i) => tones[i]), { bar, beatsPerBar: BPB, vel: 50, legato: 1.6 }));
    notes.push({ ch: "cello", t: bar * BPB, d: BPB * 0.97, p: midi(root) + 12, v: 70 });
    if (bar % 2 === 0) for (const n of [tones[1], tones[2], tones[4]]) notes.push({ ch: "pad", t: bar * BPB, d: BPB * 1.97, p: midi(n), v: 52 });
    if ((sec === 1 || sec === 2) && bar % 2 === 0) for (const n of [tones[2], tones[4]]) notes.push({ ch: "choir", t: bar * BPB, d: BPB * 1.97, p: midi(n), v: sec === 1 ? 60 : 52 });

    // Taiko sóng vỗ: phách 1 mỗi 2 ô; đoạn B dồn lên ở ô thứ 4 mỗi cụm.
    if (bar % 2 === 0) add("taiko", grid("x.....", { bar, beatsPerBar: BPB, pitch: "A2", vel: 60, d: 0.5 }));
    if (sec === 1 && bar % 4 === 3) add("taiko", grid("o.x.Xx", { bar, beatsPerBar: BPB, pitch: "C3", vel: 58, d: 0.5 }));
    // Chũm chọe ngược ở ô cuối mỗi đoạn, nở ra đúng phách 1 của đoạn sau.
    if (bar % 16 === 15) notes.push({ ch: "rev", t: bar * BPB, d: 3, p: midi("C4"), v: 64 });
  });
  return notes;
}

export default {
  id: "hai_than_dao",
  title: "Hải Thần Đảo",
  kind: "map",
  maps: ["hai_than_dao"],
  bpm: 105,
  beatsPerBar: BPB,
  bars: 64,
  channels: [
    { key: "flute", name: "Sáo", channel: 1, program: 73, volume: 96, pan: 56, reverb: 80, chorus: 10, humanTicks: 3, expr: true, vibrato: 38, bend: 0.1, phrase: 4 },
    { key: "harp", name: "Đàn hạc", channel: 2, program: 46, volume: 66, pan: 84, reverb: 75, humanVel: 6, groove: true, phrase: 2, phraseAmt: 10 },
    { key: "strings", name: "Dây hát", channel: 3, program: 48, volume: 90, pan: 66, reverb: 80, expr: true, vibrato: 30, phrase: 4 },
    { key: "koto", name: "Đàn tranh (koto)", channel: 4, program: 107, volume: 92, pan: 40, reverb: 70, humanVel: 6, phrase: 4 },
    { key: "pad", name: "Dây ngân", channel: 5, program: 49, volume: 68, pan: 64, reverb: 90, chorus: 30, humanVel: 2, expr: true },
    { key: "cello", name: "Cello", channel: 6, program: 42, volume: 72, pan: 52, reverb: 65, expr: true },
    { key: "choir", name: "Hợp xướng", channel: 7, program: 52, volume: 82, pan: 64, reverb: 100, humanVel: 2, expr: true },
    { key: "taiko", name: "Taiko", channel: 8, program: 116, volume: 82, pan: 64, reverb: 80, humanTicks: 0 },
    { key: "rev", name: "Chũm chọe ngược", channel: 9, program: 119, volume: 90, pan: 64, reverb: 80 },
  ],
  notes: build(),
};
