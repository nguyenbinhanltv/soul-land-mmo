// Thánh Hồn Thôn: làng quê yên bình, buổi sớm sương mỏng. Ngũ cung điệu Cung trên Rê (D E F# A B), 75 BPM, 32 ô (A A' B A), ~102 giây.
// Sáo trúc (ban-di) hát giai điệu thưa, nhiều khoảng lặng; cổ tranh rải chậm và lướt cuối câu; nhị hồ làm bè từ A' trở đi;
// cổ cầm giữ gốc trầm; nền ngân rất nhỏ, chuông điểm đầu đoạn, mõ gỗ gõ thưa từ A'. Lớp giao chiến `_chien` cùng điệu (xem lib/ngucung.mjs).
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const A = J(["1:4 2:2 3:2", "4:6 -:2", "3:2 2:2 1:2 2:2", "3:8", "-:2 3:2 4:2 5:2", "4:4 3:2 2:2", "1:2 2:2 3:2 2:2", "1:6 -:2"]);
const A2 = J(["1:2 3:2 4:4", "5:4 4:2 3:2", "4:2 3:2 2:2 1:2", "2:6 -:2", "3:2 4:2 5:2 1':2", "5:4 4:2 3:2", "2:2 3:2 2:2 1:2", "1:4 -:4"]);
const B = J(["5:6 4:2", "3:4 2:2 3:2", "4:2 5:2 4:2 3:2", "2:8", "3:2 2:2 1:4", "2:2 3:2 5:4", "4:2 3:2 2:2 3:2", "5:6 -:2"]);
const FOLLOW = (roots) => J(roots.map((d) => `${d === 5 ? "5," : d}:8`));
const R_A = [1, 1, 5, 5, 4, 4, 2, 1];
const R_B = [5, 5, 4, 4, 2, 2, 5, 4];

const { notes, roots } = buildSong({
  tonic: "D3", mode: "cung", leadBase: 10, erhuBase: 5, arp: [0, -1, 1, -1, 2, -1, -1, -1], arpVel: 52,
  sections: [
    { lead: A, roots: R_A },
    { lead: A2, erhu: FOLLOW(R_A), roots: R_A },
    { lead: B, erhu: FOLLOW(R_B), roots: R_B, arp: [0, -1, 2, -1, 1, -1, 3, -1] },
    { lead: A, roots: R_A },
  ],
  // Mõ gỗ nhẹ ở phách 3 các ô chẵn từ A'.
  perc: ({ bar, k, s }) => (s >= 1 && k % 2 === 0 ? [{ ch: "mo", t: bar * 4 + 2, d: 0.25, p: 70, v: 52 }] : []),
});

export default {
  id: "thanh_hon_thon",
  title: "Thánh Hồn Thôn",
  kind: "map",
  maps: ["thanh_hon_thon"],
  bpm: 75,
  beatsPerBar: 4,
  bars: 32,
  ngucung: { tonic: "D3", mode: "cung", roots },
  channels: channels({ mo: { volume: 80 } }),
  notes,
};
