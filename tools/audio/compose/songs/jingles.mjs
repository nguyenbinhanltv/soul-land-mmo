// Khúc ngắn chơi một lần theo sự kiện (không lặp), cùng chất giọng với nhạc nền: koto, sáo, shakuhachi, chuông, taiko.
// `event` là tên sự kiện client dùng để phát (xem manifest). Độ dài = số ô, render thêm đuôi vang rồi cắt lặng.
import { bars, chord, grid, midi } from "../lib/theory.mjs";

const n = (ch, t, d, name, v) => ({ ch, t, d, p: midi(name), v });
const tag = (ch, list) => list.map((x) => ({ ...x, ch }));

// Lên cấp: koto chạy móc kép lên ngũ cung Rê, sáo và chuông bung nốt La, dây phồng hợp âm.
const levelUp = {
  id: "jingle_len_cap", title: "Lên cấp", kind: "jingle", event: "level_up", bpm: 120, beatsPerBar: 4, bars: 1,
  channels: [
    { key: "koto", name: "Koto", channel: 1, program: 107, volume: 100, pan: 70, reverb: 70, humanTicks: 1 },
    { key: "flute", name: "Sáo", channel: 2, program: 73, volume: 96, pan: 54, reverb: 80, expr: true, vibrato: 40 },
    { key: "pad", name: "Dây", channel: 3, program: 49, volume: 80, pan: 64, reverb: 90, expr: true },
    { key: "bell", name: "Chuông", channel: 4, program: 14, volume: 80, pan: 80, reverb: 95 },
    { key: "taiko", name: "Taiko", channel: 5, program: 116, volume: 84, pan: 64, reverb: 70, humanTicks: 0 },
  ],
  notes: [
    ...tag("koto", bars("D4:1 E4:1 F#4:1 A4:1 B4:1 D5:1 E5:1 F#5:1 >A5:8", { unit: 0.25, vel: 84, legato: 1.5 })),
    n("flute", 2, 2, "A5", 96),
    ...tag("pad", chord(["D4", "A4", "E5"], { t: 2, d: 2, vel: 70 })),
    n("bell", 2, 2, "A5", 76),
    n("taiko", 2, 0.5, "C3", 90),
  ],
};

// Hấp thụ hồn hoàn / đột phá: chũm chọe ngược nở vào hợp âm, celesta rải lên thang La thứ, hợp xướng và chuông ống, shakuhachi ngân.
const ringAbsorb = {
  id: "jingle_hap_thu_hon_hoan", title: "Hấp thụ hồn hoàn / đột phá", kind: "jingle", event: "ring_absorb", bpm: 70, beatsPerBar: 4, bars: 1,
  channels: [
    { key: "rev", name: "Chũm chọe ngược", channel: 1, program: 119, volume: 80, pan: 64, reverb: 80 },
    { key: "celesta", name: "Celesta", channel: 2, program: 8, volume: 90, pan: 80, reverb: 100 },
    { key: "choir", name: "Hợp xướng", channel: 3, program: 52, volume: 92, pan: 64, reverb: 100, expr: true },
    { key: "bell", name: "Chuông ống", channel: 4, program: 14, volume: 84, pan: 40, reverb: 110 },
    { key: "shaku", name: "Shakuhachi", channel: 5, program: 77, volume: 92, pan: 56, reverb: 100, expr: true, vibrato: 56, bend: 1, bendDepth: 1 },
    { key: "taiko", name: "Taiko", channel: 6, program: 116, volume: 90, pan: 64, reverb: 90, humanTicks: 0 },
  ],
  notes: [
    n("rev", 0, 2, "C4", 80),
    ...tag("celesta", bars("A4:1 C5:1 D5:1 E5:1 G5:1 A5:1 C6:1 D6:1 >E6:8", { unit: 0.25, vel: 72, legato: 2 })),
    ...tag("choir", chord(["A3", "E4", "A4", "C5"], { t: 2, d: 2, vel: 78 })),
    n("bell", 2, 2, "A4", 84),
    n("shaku", 2, 2, "E5", 90),
    n("taiko", 2, 0.5, "A2", 96),
  ],
};

// Thắng đấu trường: kèn horn và sáo thổi hiệu lệnh ngũ cung Đô, taiko và timpani giục, kết hợp âm Đô sáng.
const arenaWin = {
  id: "jingle_thang", title: "Thắng đấu trường", kind: "jingle", event: "arena_win", bpm: 120, beatsPerBar: 4, bars: 2,
  channels: [
    { key: "horn", name: "Kèn horn", channel: 1, program: 60, volume: 96, pan: 46, reverb: 70, expr: true },
    { key: "flute", name: "Sáo", channel: 2, program: 73, volume: 90, pan: 70, reverb: 75, expr: true, vibrato: 36 },
    { key: "strings", name: "Dây", channel: 3, program: 48, volume: 84, pan: 64, reverb: 75, expr: true },
    { key: "timp", name: "Timpani", channel: 4, program: 47, volume: 86, pan: 58, reverb: 65, humanTicks: 0 },
    { key: "taiko", name: "Taiko", channel: 5, program: 116, volume: 92, pan: 64, reverb: 65, humanTicks: 0 },
    { key: "perc", name: "Chũm chọe", channel: 10, program: 0, volume: 80, pan: 70, reverb: 70, humanTicks: 0 },
  ],
  notes: [
    ...tag("horn", bars("G4:1 G4:1 C5:2 E5:2 D5:1 E5:1 | >G5:8", { vel: 90, legato: 0.9 })),
    ...tag("flute", bars("G5:1 G5:1 C6:2 E6:2 D6:1 E6:1 | >G6:8", { vel: 78, legato: 0.9 })),
    ...tag("strings", [...chord(["C4", "G4", "E5"], { t: 0, d: 3.8, vel: 66 }), ...chord(["C4", "G4", "A4", "E5"], { t: 4, d: 4, vel: 80 })]),
    ...tag("timp", grid("X.x.X.x.|X.......", { pitch: "C3", vel: 70, d: 0.4 })),
    ...tag("taiko", grid("x.x.x.xx|X.......", { pitch: "C3", vel: 70, d: 0.4 })),
    n("perc", 4, 2, "C#3", 84),
  ],
};

// Thua đấu trường: shakuhachi rơi xuống ngũ cung La thứ, koto trầm và một tiếng taiko nhỏ.
const arenaLose = {
  id: "jingle_thua", title: "Thua đấu trường", kind: "jingle", event: "arena_lose", bpm: 70, beatsPerBar: 4, bars: 2,
  channels: [
    { key: "shaku", name: "Shakuhachi", channel: 1, program: 77, volume: 96, pan: 56, reverb: 95, expr: true, vibrato: 50, bend: 0.6, bendDepth: 1 },
    { key: "koto", name: "Koto", channel: 2, program: 107, volume: 92, pan: 72, reverb: 80 },
    { key: "pad", name: "Dây", channel: 3, program: 49, volume: 74, pan: 64, reverb: 90, expr: true },
    { key: "taiko", name: "Taiko", channel: 4, program: 116, volume: 76, pan: 64, reverb: 90, humanTicks: 0 },
  ],
  notes: [
    ...tag("shaku", bars("E5:2 D5:2 C5:2 A4:2 | G4:3 A4:5", { vel: 82, legato: 0.98 })),
    ...tag("koto", bars("A2:4 E3:4 | D3:4 A2:4", { vel: 74, legato: 1.8 })),
    ...tag("pad", [...chord(["A3", "E4"], { t: 0, d: 3.9, vel: 56 }), ...chord(["G3", "D4"], { t: 4, d: 2, vel: 54 }), ...chord(["A3", "E4"], { t: 6, d: 2, vel: 50 })]),
    n("taiko", 4, 0.5, "A2", 70),
  ],
};

// Nhận nhiệm vụ: hai nốt koto hỏi, mõ gỗ gõ hai tiếng.
const questAccept = {
  id: "jingle_nhan_nhiem_vu", title: "Nhận nhiệm vụ", kind: "jingle", event: "quest_accept", bpm: 100, beatsPerBar: 4, bars: 1,
  channels: [
    { key: "koto", name: "Koto", channel: 1, program: 107, volume: 100, pan: 64, reverb: 70 },
    { key: "perc", name: "Mõ gỗ", channel: 10, program: 0, volume: 90, pan: 70, reverb: 50, humanTicks: 0 },
  ],
  notes: [
    ...tag("koto", bars("A4:1 E5:1 D5:1 >A5:5", { vel: 84, legato: 1.6 })),
    ...tag("perc", grid("X.x.....", { pitch: 76, vel: 70 })),
  ],
};

// Hoàn thành nhiệm vụ: koto chạy lên ngũ cung Đô, chuông và sáo kết nốt La, taiko nhẹ.
const questComplete = {
  id: "jingle_hoan_thanh_nhiem_vu", title: "Hoàn thành nhiệm vụ", kind: "jingle", event: "quest_complete", bpm: 110, beatsPerBar: 4, bars: 1,
  channels: [
    { key: "koto", name: "Koto", channel: 1, program: 107, volume: 100, pan: 70, reverb: 70 },
    { key: "flute", name: "Sáo", channel: 2, program: 73, volume: 90, pan: 54, reverb: 80, expr: true, vibrato: 36 },
    { key: "bell", name: "Chuông", channel: 3, program: 14, volume: 76, pan: 80, reverb: 95 },
    { key: "taiko", name: "Taiko", channel: 4, program: 116, volume: 78, pan: 64, reverb: 70, humanTicks: 0 },
  ],
  notes: [
    ...tag("koto", bars("C5:1 D5:1 E5:1 G5:1 >A5:4", { vel: 84, legato: 1.6 })),
    n("flute", 2, 2, "A5", 88),
    n("bell", 2, 2, "E5", 72),
    n("taiko", 2, 0.5, "C3", 80),
  ],
};

// Stinger chí mạng lớn (G5, #396): một nhát taiko + kèn đồng chặt + chũm chọe, ngắn, dứt khoát.
const critBig = {
  id: "stinger_chi_mang", title: "Chí mạng lớn", kind: "jingle", event: "crit_big", bpm: 140, beatsPerBar: 4, bars: 1,
  channels: [
    { key: "brass", name: "Kèn đồng", channel: 1, program: 61, volume: 100, pan: 60, reverb: 60, expr: true },
    { key: "taiko", name: "Taiko", channel: 2, program: 116, volume: 100, pan: 64, reverb: 70, humanTicks: 0 },
    { key: "perc", name: "Chũm chọe", channel: 10, program: 0, volume: 90, pan: 70, reverb: 70, humanTicks: 0 },
  ],
  notes: [
    ...chord(["A3", "E4", "A4"], { t: 0, d: 1.2, vel: 100 }).map((x) => ({ ...x, ch: "brass" })),
    n("taiko", 0, 0.3, "A2", 110), n("taiko", 0.5, 0.3, "A2", 90),
    ...tag("perc", grid("X.......", { pitch: 49, vel: 96 })),
  ],
};

// Stinger hạ boss (G5, #396): kèn horn hiệu lệnh đi lên ngũ cung Rê, timpani cuộn, hợp xướng và chuông ngân hợp âm Rê.
const bossDown = {
  id: "stinger_ha_boss", title: "Hạ boss", kind: "jingle", event: "boss_down", bpm: 100, beatsPerBar: 4, bars: 2,
  channels: [
    { key: "horn", name: "Kèn horn", channel: 1, program: 60, volume: 100, pan: 46, reverb: 80, expr: true },
    { key: "choir", name: "Hợp xướng", channel: 2, program: 52, volume: 92, pan: 64, reverb: 100, expr: true },
    { key: "timp", name: "Timpani", channel: 3, program: 47, volume: 92, pan: 58, reverb: 70, humanTicks: 0 },
    { key: "bell", name: "Chuông ống", channel: 4, program: 14, volume: 84, pan: 76, reverb: 110 },
    { key: "taiko", name: "Taiko", channel: 5, program: 116, volume: 92, pan: 64, reverb: 75, humanTicks: 0 },
  ],
  notes: [
    ...tag("horn", bars("D4:1 A4:1 D5:2 E5:2 F#5:2 | >A5:8", { vel: 92, legato: 0.95 })),
    ...tag("choir", chord(["D3", "A3", "D4", "F#4"], { t: 4, d: 4, vel: 84 })),
    ...grid("o.o.o.o.xxxxXXXX", { bar: 0, pitch: midi("D3"), vel: 70, d: 0.3 }).map((x) => ({ ...x, ch: "timp" })),
    n("bell", 4, 4, "D5", 80),
    n("taiko", 4, 0.5, "D2", 110),
  ],
};

export default [levelUp, ringAbsorb, arenaWin, arenaLose, questAccept, questComplete, critBig, bossDown];
