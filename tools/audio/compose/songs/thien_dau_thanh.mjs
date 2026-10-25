// Thiên Đấu Thành: thủ đô trang trọng, rộng lớn. Ngũ cung điệu Cung trên Đô (C D E G A), 75 BPM, 32 ô (A A' B A), ~102 giây.
// Sáo trúc dẫn giai điệu rộng, nhị hồ hát đoạn B, cổ tranh rải, cổ cầm giữ gốc, chuông đầu đoạn, mõ gỗ rất nhẹ.
// Khuôn chung ở lib/ngucung.mjs; lớp giao chiến `_chien` cùng điệu (nếu bản đồ có đánh nhau) dựng ở songs/stems.mjs.
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const FOLLOW = (roots) => J(roots.map((d) => `${d === 5 ? "5," : d}:8`));
const A = "1:6 -:2 | 3:4 5:4 | 4:4 3:2 2:2 | 1:8 | 5:4 4:2 3:2 | 2:4 3:2 4:2 | 3:6 2:2 | 1:8";
const A2 = "3:4 5:4 | 1':6 5:2 | 4:4 5:2 4:2 | 3:8 | 2:2 3:2 4:2 5:2 | 1':4 5:4 | 4:2 3:2 2:2 3:2 | 1:4 -:4";
const B = "5,:4 1:4 | 2:6 3:2 | 4:4 3:2 2:2 | 3:8 | 5:4 4:4 | 3:4 2:2 1:2 | 2:6 5,:2 | 1:8";
const R_A = [1, 1, 4, 4, 5, 5, 2, 1];
const R_B = [5, 5, 4, 4, 2, 2, 4, 1];

const { notes, roots } = buildSong({
  tonic: "C3", mode: "cung", leadBase: 10, erhuBase: 5, leadCh: "lead", arp: [0, -1, 1, -1, 2, -1, -1, -1],
  sections: [
    { lead: A, roots: R_A },
    { lead: A2, erhu: FOLLOW(R_A), erhuVel: 56, roots: R_A },
    { erhu: B, erhuVel: 68, roots: R_B },
    { lead: A, roots: R_A },
  ],
  perc: ({ bar, k, s }) => (s >= 1 && k % 4 === 0 ? [{ ch: "mo", t: bar * 4 + 2, d: 0.25, p: 70, v: 48 }] : []),
});

export default {
  id: "thien_dau_thanh",
  title: "Thiên Đấu Thành",
  kind: "map",
  maps: ["thien_dau_thanh"],
  bpm: 75,
  beatsPerBar: 4,
  bars: 32,
  ngucung: { tonic: "C3", mode: "cung", roots },
  channels: channels(),
  notes,
};
