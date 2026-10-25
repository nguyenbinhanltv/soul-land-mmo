// Nặc Đinh Thành (Sử Lai Khắc Học Viện): trang nghiêm, tĩnh tu luyện. Ngũ cung điệu Thương trên Sol (G A C D F), 70 BPM,
// 32 ô (A A' B A), ~110 giây. Tiêu hát chậm, nốt dài; A' thêm sáo trúc cao; B nhị hồ lên dẫn; cổ tranh rải đều, cổ cầm ngân gốc,
// mõ gỗ gõ đều như tụng kinh suốt bài, khánh điểm đầu và giữa đoạn.
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const A = J(["1:8", "2:4 3:4", "4:6 3:2", "2:8", "1:4 2:2 3:2", "4:4 5:4", "4:2 3:2 2:2 1:2", "1:6 -:2"]);
const A2 = J(["3:4 4:4", "5:6 4:2", "3:4 2:2 1:2", "2:8", "4:4 5:2 1':2", "2':4 1':4", "5:2 4:2 3:2 2:2", "1:4 -:4"]);
const B = J(["-:4 5,:4", "1:4 2:4", "3:6 2:2", "1:8", "2:4 3:4", "5:6 4:2", "3:4 2:2 1:2", "5,:8"]);
const R_A = [1, 1, 3, 1, 4, 4, 2, 1];
const R_B = [5, 5, 3, 3, 4, 4, 2, 2];

const { notes, roots } = buildSong({
  tonic: "G2", mode: "thuong", leadBase: 5, erhuBase: 10, leadCh: "lead2", leadVel: 78, padVel: 42, arp: [0, -1, 1, -1, 2, -1, 1, -1], arpVel: 52, bellMid: true,
  sections: [
    { leadCh: "lead2", lead: A, roots: R_A },
    { leadCh: "lead", leadBase: 10, lead: A2, roots: R_A },
    { erhu: B, erhuVel: 70, roots: R_B, arp: [0, -1, 2, -1, 1, -1, 3, -1] },
    { leadCh: "lead2", lead: A, roots: R_A },
  ],
  // Mõ gỗ đều như tụng kinh: phách 1 và 3 mỗi ô, nhẹ dần ở đoạn B.
  perc: ({ bar, s }) => [{ ch: "mo", t: bar * 4, d: 0.25, p: 69, v: s === 2 ? 46 : 62 }, { ch: "mo", t: bar * 4 + 2, d: 0.25, p: 69, v: s === 2 ? 38 : 50 }],
});

export default {
  id: "nac_dinh_thanh",
  title: "Nặc Đinh Thành",
  kind: "map",
  maps: ["nac_dinh_thanh"],
  bpm: 70,
  beatsPerBar: 4,
  bars: 32,
  ngucung: { tonic: "G2", mode: "thuong", roots },
  channels: channels({ mo: { volume: 66 } }),
  notes,
};
