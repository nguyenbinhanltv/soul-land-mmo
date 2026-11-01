// Luyện Hồn Cảnh — Tĩnh tâm luyện hồn (#1553): chủ repo đã nghe A/B và duyệt nhập runtime.
// La điệu Vũ (A C D E G), 75 BPM, 32 ô 4/4 = 102,4 giây, 4.515.840 mẫu.
// Tiêu và cổ tranh đối đáp, mỗi câu có khoảng nghỉ; không trống, chuông, bè giao chiến.
// Giai điệu viết riêng bằng code; dùng bộ tiếng miễn phí đã ghi công của dự án.
import { channels, degreeNote, melody } from "../lib/ngucung.mjs";

const tonic = "A2", mode = "vu";
const phrases = [
  "-:4 1:2 3:2 | 4:4 -:4 | 3:2 2:2 1:4 | -:8 | 2:2 3:2 5:4 | 4:4 -:4 | 3:2 2:2 1:2 -:2 | -:8",
  "-:4 3:2 4:2 | 5:4 -:4 | 4:2 3:2 2:4 | -:8 | 1:4 2:2 3:2 | 2:4 -:4 | 1:4 -:4 | -:8",
  "-:8 | 5,:2 1:2 2:4 | 3:4 -:4 | 2:2 1:2 5,:4 | -:8 | 1:2 3:2 4:4 | 3:4 2:4 | 1:4 -:4",
  "-:4 1:2 3:2 | 4:4 -:4 | 3:2 2:2 1:4 | -:8 | 2:4 3:4 | 2:4 -:4 | 1:4 -:4 | -:8",
];
const notes = phrases.flatMap((phrase, i) => melody(phrase, {
  tonic, mode, base: i === 2 ? 5 : 10, startBar: i * 8, vel: 58, legato: 0.86,
}).map((n) => ({ ...n, ch: i === 2 ? "tranh" : "lead2" })));
const roots = [0, 0, 3, 3, 2, 2, 0, 0];
for (let bar = 0; bar < 32; bar++) {
  const root = roots[bar % 8], t = bar * 4;
  // Hai tiếng gảy cách nhau rộng; tránh nền hợp âm kín và tránh dải trầm quá dày.
  notes.push({ ch: "qin", t, d: 2.4, p: degreeNote(tonic, mode, root + 5), v: 50 });
  if (bar % 2 === 0) notes.push({ ch: "tranh", t: t + 2.5, d: 1.3, p: degreeNote(tonic, mode, root + 8), v: 43 });
}
export default {
  id: "luyen_hon_canh", title: "Luyện Hồn Cảnh — Tĩnh tâm luyện hồn", kind: "map", maps: ["luyen_hon_canh"],
  bpm: 75, beatsPerBar: 4, bars: 32, mix: { lufs: -21, eqOpts: { airDb: 0 } },
  channels: channels({ lead2: { volume: 78, vibrato: 18 }, tranh: { volume: 72 }, qin: { volume: 68 } })
    .filter((c) => ["lead2", "tranh", "qin"].includes(c.key)),
  notes,
};
