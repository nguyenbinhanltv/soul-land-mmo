// Hải Thần Đảo: đảo và rạn biển của Hải Thần, sóng cuộn, rộng lớn, linh thiêng. Ngũ cung điệu Chủy trên La (A B D E F#), 75 BPM, 32 ô (A A' B A), ~102 giây.
// Sáo trúc dẫn, cổ tranh rải và lướt như sóng vỗ (hai ô một lần), nhị hồ hát đoạn B, cổ cầm ngân gốc, chuông đầu đoạn.
// Khuôn chung ở lib/ngucung.mjs; lớp giao chiến `_chien` cùng điệu (nếu bản đồ có đánh nhau) dựng ở songs/stems.mjs.
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const FOLLOW = (roots) => J(roots.map((d) => `${d === 5 ? "5," : d}:8`));
const A = "1:4 2:2 3:2 | 4:6 3:2 | 5:4 4:2 3:2 | 2:8 | 3:2 4:2 5:4 | 1':6 5:2 | 4:2 3:2 2:2 1:2 | 2:8";
const A2 = "5:4 1':4 | 2':6 1':2 | 5:4 4:2 3:2 | 4:8 | 3:2 4:2 5:2 1':2 | 5:4 4:4 | 3:2 2:2 1:4 | 1:8";
const B = "1:6 2:2 | 3:4 4:4 | 5:8 | 4:4 3:2 2:2 | 1:4 2:4 | 3:6 2:2 | 1:2 2:2 5,:4 | 1:8";
const R_A = [1, 1, 4, 4, 3, 3, 2, 1];
const R_B = [4, 4, 5, 5, 3, 3, 2, 2];

const { notes, roots } = buildSong({
  tonic: "A3", mode: "chuy", leadBase: 5, erhuBase: 0, leadCh: "lead", arp: [0, 1, 2, 3, 2, 1, 0, -1], arpVel: 52, sweepK: [1, 3, 5, 7],
  sections: [
    { lead: A, roots: R_A },
    { lead: A2, erhu: FOLLOW(R_A), erhuVel: 56, roots: R_A },
    { erhu: B, erhuVel: 68, roots: R_B },
    { lead: A, roots: R_A },
  ],
});

export default {
  id: "hai_than_dao",
  title: "Hải Thần Đảo",
  kind: "map",
  maps: ["hai_than_dao"],
  bpm: 75,
  beatsPerBar: 4,
  bars: 32,
  ngucung: { tonic: "A3", mode: "chuy", roots },
  channels: channels(),
  notes,
};
