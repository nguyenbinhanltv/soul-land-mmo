// Lạc Nhật Sâm Lâm: rừng hoa độc ráng chiều quanh suối Băng Hỏa Lưỡng Nghi Nhãn, đẹp mà nguy hiểm, uốn lượn. Ngũ cung điệu Giốc trên Mi (E G A C D), 70 BPM, 32 ô (A A' B A), ~110 giây.
// Sáo trúc uốn lượn, cổ tranh rải dày hơn và lướt nhiều, nhị hồ lên dẫn ở đoạn B, mõ gỗ nhẹ lệch nhịp.
// Khuôn chung ở lib/ngucung.mjs; lớp giao chiến `_chien` cùng điệu (nếu bản đồ có đánh nhau) dựng ở songs/stems.mjs.
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const FOLLOW = (roots) => J(roots.map((d) => `${d === 5 ? "5," : d}:8`));
const A = "1:2 2:2 3:2 2:2 | 1:4 5,:4 | 2:2 3:2 4:4 | 3:6 2:2 | 1:2 2:2 3:2 5:2 | 4:4 3:2 2:2 | 1:2 5,:2 1:4 | 2:8";
const A2 = "3:2 4:2 5:2 4:2 | 3:4 2:4 | 4:2 5:2 1':4 | 5:6 4:2 | 3:2 4:2 5:2 1':2 | 5:4 4:2 3:2 | 2:2 1:2 5,:4 | 1:8";
const B = "5,:4 1:4 | 2:2 3:2 4:4 | 3:4 2:2 1:2 | 2:8 | 4:4 5:4 | 4:2 3:2 2:4 | 1:2 2:2 3:2 5:2 | 4:4 -:4";
const R_A = [1, 1, 3, 3, 4, 4, 5, 1];
const R_B = [4, 4, 5, 5, 2, 2, 3, 3];

const { notes, roots } = buildSong({
  tonic: "E3", mode: "gioc", leadBase: 10, erhuBase: 5, leadCh: "lead", arp: [0, 1, -1, 2, -1, 1, 2, -1], arpVel: 54, sweepK: [1, 3, 5, 7],
  sections: [
    { lead: A, roots: R_A },
    { lead: A2, erhu: FOLLOW(R_A), erhuVel: 56, roots: R_A },
    { erhu: B, erhuVel: 68, roots: R_B },
    { lead: A, roots: R_A },
  ],
  perc: ({ bar, k, s }) => (s >= 1 ? [{ ch: "mo", t: bar * 4 + 1.5, d: 0.25, p: 70, v: 50 }, { ch: "mo", t: bar * 4 + 3, d: 0.25, p: 70, v: 42 }] : []),
});

export default {
  id: "lac_nhat_sam_lam",
  title: "Lạc Nhật Sâm Lâm",
  kind: "map",
  maps: ["lac_nhat_sam_lam"],
  bpm: 70,
  beatsPerBar: 4,
  bars: 32,
  ngucung: { tonic: "E3", mode: "gioc", roots },
  channels: channels(),
  notes,
};
