// Cực Bắc Chi Địa: băng nguyên phương bắc, lạnh, trong, mênh mông, thưa. Ngũ cung điệu Cung trên Fa# (F# G# A# C# D#), 63 BPM, 32 ô (A A' B A), ~122 giây.
// Sáo trúc ở quãng cao, cổ tranh gảy thưa như tinh thể băng, nhị hồ ngân lạnh ở đoạn B, chuông điểm nhiều, không trống.
// Khuôn chung ở lib/ngucung.mjs; lớp giao chiến `_chien` cùng điệu (nếu bản đồ có đánh nhau) dựng ở songs/stems.mjs.
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const FOLLOW = (roots) => J(roots.map((d) => `${d === 5 ? "5," : d}:8`));
const A = "-:4 1:4 | 3:8 | -:2 5:2 3:4 | 2:8 | 1:6 -:2 | 3:4 4:4 | 3:2 2:2 1:4 | 1:8";
const A2 = "5:6 -:2 | 4:4 3:4 | 2:2 3:2 4:4 | 3:8 | 5:4 4:2 3:2 | 2:8 | 1:4 2:2 3:2 | 1:6 -:2";
const B = "1:8 | 3:6 2:2 | 5,:8 | 1:4 2:4 | 3:8 | 4:6 3:2 | 2:4 1:4 | 5,:8";
const R_A = [1, 1, 4, 4, 2, 2, 3, 1];
const R_B = [5, 5, 3, 3, 4, 4, 2, 2];

const { notes, roots } = buildSong({
  tonic: "F#3", mode: "cung", leadBase: 10, erhuBase: 5, leadCh: "lead", arp: [0, -1, -1, -1, 2, -1, -1, -1], arpVel: 48, padVel: 40, bellMid: true,
  sections: [
    { lead: A, roots: R_A },
    { lead: A2, erhu: FOLLOW(R_A), erhuVel: 56, roots: R_A },
    { erhu: B, erhuVel: 68, roots: R_B },
    { lead: A, roots: R_A },
  ],
});

export default {
  id: "cuc_bac_chi_dia",
  title: "Cực Bắc Chi Địa",
  kind: "map",
  maps: ["cuc_bac_chi_dia"],
  bpm: 63,
  beatsPerBar: 4,
  bars: 32,
  bitrate: "80k",
  ngucung: { tonic: "F#3", mode: "cung", roots },
  channels: channels({ bell: { volume: 78 } }),
  notes,
};
