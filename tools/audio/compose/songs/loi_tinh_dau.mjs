// Lõi Tinh Đấu: hồ trung tâm Tinh Đấu, nơi boss thế giới ngự, u uẩn, linh thiêng, đè nặng. Ngũ cung điệu Vũ trên Đô (C Eb F G Bb), 70 BPM, 32 ô (A A' B A), ~110 giây.
// Tiêu trầm hát chậm, nhị hồ nặng nề dẫn đoạn B, cổ tranh gảy thưa, nhịp tim trống nhỏ suốt bài, chuông trầm vọng mỗi 4 ô.
// Khuôn chung ở lib/ngucung.mjs; lớp giao chiến `_chien` cùng điệu (nếu bản đồ có đánh nhau) dựng ở songs/stems.mjs.
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const FOLLOW = (roots) => J(roots.map((d) => `${d === 5 ? "5," : d}:8`));
const A = "-:4 1:2 3:2 | 2:6 -:2 | 5,:4 1:2 2:2 | 3:8 | -:2 3:2 4:2 5:2 | 4:6 3:2 | 2:2 1:2 5,:4 | 1:6 -:2";
const A2 = "1:4 3:4 | 4:6 3:2 | 5:4 4:2 3:2 | 3:8 | 5:2 1':2 2':4 | 1':6 5:2 | 4:2 3:2 2:2 1:2 | 1:4 -:4";
const B = "1:8 | 3:6 2:2 | 4:4 3:4 | 2:8 | 5,:4 1:4 | 2:6 3:2 | 4:4 5:2 4:2 | 3:8";
const R_A = [1, 1, 3, 3, 2, 2, 4, 1];
const R_B = [5, 5, 3, 3, 4, 4, 2, 2];

const { notes, roots } = buildSong({
  tonic: "C3", mode: "vu", leadBase: 5, erhuBase: 5, leadCh: "lead2", arp: [0, -1, -1, -1, 2, -1, -1, -1], arpVel: 50, padVel: 46, bellMid: true,
  sections: [
    { lead: A, roots: R_A },
    { lead: A2, erhu: FOLLOW(R_A), erhuVel: 56, roots: R_A },
    { erhu: B, erhuVel: 68, roots: R_B },
    { lead: A, roots: R_A },
  ],
  perc: ({ bar, k, s }) => ([{ ch: "mo", t: bar * 4, d: 0.3, p: 68, v: 60 }, { ch: "mo", t: bar * 4 + 0.75, d: 0.3, p: 68, v: 44 }, { ch: "mo", t: bar * 4 + 2, d: 0.3, p: 68, v: 48 }]),
});

export default {
  id: "loi_tinh_dau",
  title: "Lõi Tinh Đấu",
  kind: "map",
  maps: ["loi_tinh_dau"],
  bpm: 70,
  beatsPerBar: 4,
  bars: 32,
  ngucung: { tonic: "C3", mode: "vu", roots },
  channels: channels({ lead2: { reverb: 95, volume: 92 }, bell: { volume: 78 }, mo: { volume: 56 } }),
  notes,
};
