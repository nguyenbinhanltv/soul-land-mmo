// Tinh Đấu Nội địa: rừng sâu cổ thú vạn năm, tối và nặng hơn Ngoại vi. Ngũ cung điệu Vũ trên Rê (D F G A C), 70 BPM, 32 ô (A A' B A), ~110 giây.
// Tiêu hát thấp, rất thưa; nhị hồ ngân dài từ A'; cổ tranh gảy rất thưa, cổ cầm ngân trầm; nhịp tim trống nhỏ rõ hơn từ A'; chuông vọng xa.
// Khuôn chung ở lib/ngucung.mjs; lớp giao chiến `_chien` cùng điệu (nếu bản đồ có đánh nhau) dựng ở songs/stems.mjs.
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const FOLLOW = (roots) => J(roots.map((d) => `${d === 5 ? "5," : d}:8`));
const A = "-:8 | 1:6 -:2 | 3:4 2:2 1:2 | 5,:8 | -:4 1:2 2:2 | 3:6 4:2 | 3:2 2:2 1:4 | 1:8";
const A2 = "1:2 2:2 3:4 | 4:6 3:2 | 2:4 1:2 5,:2 | 1:8 | 3:4 4:2 5:2 | 4:4 3:4 | 2:2 1:2 5,:4 | 1:4 -:4";
const B = "5:8 | 4:6 3:2 | 4:4 5:2 4:2 | 3:8 | 2:4 1:4 | 2:2 3:2 5:4 | 4:4 3:2 2:2 | 1:6 -:2";
const R_A = [1, 1, 3, 3, 2, 2, 4, 1];
const R_B = [5, 5, 3, 3, 4, 4, 2, 1];

const { notes, roots } = buildSong({
  tonic: "D2", mode: "vu", leadBase: 10, erhuBase: 5, leadCh: "lead2", arp: [0, -1, -1, -1, 2, -1, -1, -1], arpVel: 50, padVel: 44, bellMid: true,
  sections: [
    { lead: A, roots: R_A },
    { lead: A2, erhu: FOLLOW(R_A), erhuVel: 56, roots: R_A },
    { erhu: B, erhuVel: 68, roots: R_B },
    { lead: A, roots: R_A },
  ],
  perc: ({ bar, k, s }) => (s >= 1 && k % 2 === 0 ? [{ ch: "mo", t: bar * 4, d: 0.3, p: 68, v: 56 }, { ch: "mo", t: bar * 4 + 0.75, d: 0.3, p: 68, v: 42 }] : []),
});

export default {
  id: "tinh_dau_noi_dia",
  title: "Tinh Đấu Nội địa",
  kind: "map",
  maps: ["tinh_dau_noi_dia"],
  bpm: 70,
  beatsPerBar: 4,
  bars: 32,
  ngucung: { tonic: "D2", mode: "vu", roots },
  channels: channels({ lead2: { reverb: 95 } }),
  notes,
};
