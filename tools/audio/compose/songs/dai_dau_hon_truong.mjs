// Đại Đấu Hồn Trường: sân đấu, khí thế nhưng vẫn nhẹ nhàng để còn nghe tiếng đánh. Ngũ cung điệu Chủy trên Rê (D E G A B), 105 BPM (nhanh nhất bộ, vẫn thưa), 32 ô (A A' B A), ~73 giây.
// Sáo trúc dẫn giai điệu khí thế, cổ tranh rải dày, nhị hồ làm bè đoạn B, mõ gỗ và trống nhỏ giữ nhịp đều.
// Khuôn chung ở lib/ngucung.mjs; lớp giao chiến `_chien` cùng điệu (nếu bản đồ có đánh nhau) dựng ở songs/stems.mjs.
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const FOLLOW = (roots) => J(roots.map((d) => `${d === 5 ? "5," : d}:8`));
const A = "1:2 1:2 3:2 5:2 | 4:4 3:2 2:2 | 1:2 3:2 5:4 | 1':8 | 5:2 4:2 3:2 2:2 | 3:4 5:4 | 4:2 3:2 2:2 1:2 | 1:8";
const A2 = "5:2 5:2 1':2 2':2 | 1':4 5:2 4:2 | 3:2 4:2 5:4 | 4:8 | 3:2 2:2 1:2 2:2 | 3:4 4:4 | 5:2 4:2 3:2 2:2 | 1:4 -:4";
const B = "1:4 3:4 | 5:4 4:4 | 3:4 2:2 1:2 | 2:8 | 4:4 5:4 | 1':4 5:4 | 4:2 3:2 2:2 1:2 | 5,:8";
const R_A = [1, 1, 3, 3, 4, 4, 2, 1];
const R_B = [5, 5, 3, 3, 4, 4, 2, 2];

const { notes, roots } = buildSong({
  tonic: "D3", mode: "chuy", leadBase: 10, erhuBase: 5, leadCh: "lead", arp: [0, 1, 2, 1, 3, 2, 1, 2], arpVel: 56,
  sections: [
    { lead: A, roots: R_A },
    { lead: A2, erhu: FOLLOW(R_A), erhuVel: 56, roots: R_A },
    { erhu: B, erhuVel: 68, roots: R_B },
    { lead: A, roots: R_A },
  ],
  perc: ({ bar, k, s }) => ([{ ch: "mo", t: bar * 4, d: 0.25, p: 69, v: 66 }, { ch: "mo", t: bar * 4 + 1, d: 0.25, p: 70, v: 46 }, { ch: "mo", t: bar * 4 + 2, d: 0.25, p: 69, v: 56 }, { ch: "mo", t: bar * 4 + 3, d: 0.25, p: 70, v: 46 }, { ch: "mo", t: bar * 4 + 2.5, d: 0.25, p: 68, v: 50 }]),
});

export default {
  id: "dai_dau_hon_truong",
  title: "Đại Đấu Hồn Trường",
  kind: "map",
  maps: ["dai_dau_hon_truong"],
  bpm: 105,
  beatsPerBar: 4,
  bars: 32,
  ngucung: { tonic: "D3", mode: "chuy", roots },
  channels: channels({ mo: { volume: 70 } }),
  notes,
};
