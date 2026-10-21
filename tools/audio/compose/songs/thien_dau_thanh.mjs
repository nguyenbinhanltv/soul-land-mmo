// Thiên Đấu Thành: thủ đô, trang trọng, rộng lớn. Ngũ cung Đô (C D E G A), 75 BPM, 32 ô (A A' B A''), ~102 giây.
// Sáo dẫn đoạn A; A' kèn horn hát giai điệu, sáo bay bè cao; B dây hát trữ tình trên Am / E, hợp xướng vào nền;
// A'' cả dàn. Đàn hạc rải, dây ngân hợp âm, cello giữ gốc, timpani và taiko ở phách mạnh, chuông ống đánh đầu mỗi đoạn.
import { bars, grid, midi, pattern, shift } from "../lib/theory.mjs";

const BPB = 4;
const CHORD = {
  C: ["C2", ["C3", "G3", "C4", "D4", "E4", "G4"]],
  Am: ["A1", ["A2", "E3", "A3", "C4", "D4", "E4"]],
  G: ["G1", ["G2", "D3", "G3", "A3", "D4", "E4"]],
  D: ["D2", ["D3", "A3", "D4", "E4", "G4", "A4"]],
  E: ["E2", ["E3", "G3", "D4", "E4", "G4", "A4"]],
};
const PROG = [
  "C", "Am", "G", "C", "Am", "D", "G", "G", // A
  "C", "Am", "G", "C", "Am", "D", "G", "C", // A'
  "Am", "Am", "E", "E", "D", "D", "G", "G", // B
  "C", "Am", "G", "C", "Am", "D", "C", "G", // A''
];

const MELODY_A = `
  G4:2 C5:2 D5:2 E5:2 | D5:3 C5:1 A4:4 | G4:2 A4:2 C5:2 D5:2 | E5:6 D5:1 C5:1 |
  A4:2 C5:2 E5:2 G5:2 | A5:3 G5:1 E5:2 D5:2 | E5:2 D5:2 C5:2 A4:2 | G4:6 -:2`;
const DESCANT = `E5:8 | C5:8 | D5:8 | G5:8 | E5:8 | A5:8 | G5:8 | E5:8`;
const MELODY_B = `
  A4:3 C5:1 E5:4 | D5:2 C5:2 A4:4 | G4:3 A4:1 E4:4 | D4:2 E4:2 G4:4 |
  A4:3 G4:1 A4:2 C5:2 | D5:4 E5:2 D5:2 | C5:2 A4:2 G4:2 A4:1 C5:1 | D5:8`;

function build() {
  const notes = [];
  const add = (ch, list) => notes.push(...list.map((n) => ({ ...n, ch })));

  add("flute", bars(MELODY_A, { startBar: 0, vel: 84 }));
  add("horn", shift(bars(MELODY_A, { startBar: 8, vel: 84 }), -12));
  add("flute", bars(DESCANT, { startBar: 8, vel: 60 }));
  add("strings", bars(MELODY_B, { startBar: 16, vel: 88, legato: 1 }));
  add("flute", bars(MELODY_A, { startBar: 24, vel: 92 }));
  add("horn", shift(bars(MELODY_A, { startBar: 24, vel: 76 }), -12));

  PROG.forEach((c, bar) => {
    const [root, tones] = CHORD[c];
    const sec = Math.floor(bar / 8);
    add("harp", pattern([0, 1, 2, 3, 4, 3, 2, 1].map((i) => tones[i]), { bar, vel: sec === 0 ? 52 : 60, legato: 2.5 }));
    // Dây ngân hợp âm (đoạn B dây đang hát nên chỉ giữ bè thấp).
    for (const n of sec === 2 ? [tones[0]] : [tones[0], tones[1], tones[2], tones[4]]) notes.push({ ch: "pad", t: bar * BPB, d: BPB * 0.98, p: midi(n), v: 54 });
    notes.push({ ch: "cello", t: bar * BPB, d: 1.9, p: midi(root) + 12, v: 74 }, { ch: "cello", t: bar * BPB + 2, d: 1.9, p: midi(tones[1]), v: 64 });
    if (sec >= 2) for (const n of [tones[1], tones[2], tones[4]]) notes.push({ ch: "choir", t: bar * BPB, d: BPB * 0.98, p: midi(n), v: sec === 2 ? 50 : 58 });

    // Timpani phách 1 mỗi ô, cuộn ở ô cuối mỗi đoạn; taiko lớn đầu đoạn; chuông ống đầu đoạn.
    add("timp", grid(bar % 8 === 7 ? "x...o.o.ooooxxxX" : "X.......o.......", { bar, pitch: midi(root) + 12, vel: 64, d: 0.4 }));
    if (bar % 8 === 0) {
      notes.push({ ch: "taiko", t: bar * BPB, d: 1, p: midi("C3"), v: 84 }, { ch: "bell", t: bar * BPB, d: 3, p: midi(tones[2]) + 12, v: 70 });
    }
    if (sec === 3 && bar % 2 === 1) add("taiko", grid("....x.x.", { bar, pitch: "C3", vel: 60, d: 0.5 }));
  });
  return notes;
}

export default {
  id: "thien_dau_thanh",
  title: "Thiên Đấu Thành",
  kind: "map",
  maps: ["thien_dau_thanh"],
  bpm: 75,
  beatsPerBar: BPB,
  bars: 32,
  channels: [
    { key: "flute", name: "Sáo", channel: 1, program: 73, volume: 96, pan: 56, reverb: 70, chorus: 8, humanTicks: 3, expr: true, vibrato: 38, bend: 0.08, phrase: 4 },
    { key: "horn", name: "Kèn horn", channel: 2, program: 60, volume: 78, pan: 44, reverb: 75, expr: true, vibrato: 20, phrase: 4 },
    { key: "strings", name: "Dây hát", channel: 3, program: 48, volume: 90, pan: 70, reverb: 75, expr: true, vibrato: 30, phrase: 4 },
    { key: "harp", name: "Đàn hạc", channel: 4, program: 46, volume: 72, pan: 86, reverb: 65, humanVel: 6, groove: true, phrase: 4, phraseAmt: 8 },
    { key: "pad", name: "Dây ngân", channel: 5, program: 49, volume: 64, pan: 64, reverb: 85, chorus: 25, humanVel: 2, expr: true },
    { key: "cello", name: "Cello", channel: 6, program: 42, volume: 74, pan: 52, reverb: 60, expr: true },
    { key: "choir", name: "Hợp xướng", channel: 7, program: 52, volume: 85, pan: 64, reverb: 90, humanVel: 2, expr: true },
    { key: "timp", name: "Timpani", channel: 8, program: 47, volume: 80, pan: 60, reverb: 60, humanTicks: 1 },
    { key: "bell", name: "Chuông ống", channel: 9, program: 14, volume: 80, pan: 76, reverb: 90 },
    { key: "taiko", name: "Taiko", channel: 11, program: 116, volume: 80, pan: 64, reverb: 65, humanTicks: 0 },
  ],
  notes: build(),
};
