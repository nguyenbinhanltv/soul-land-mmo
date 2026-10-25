// Tinh Đấu Ngoại vi (Tinh Đấu Đại Sâm Lâm): rừng sâu thẳm, huyền bí, sương và tiếng vọng. Ngũ cung điệu Vũ trên La (A C D E G),
// 63 BPM, 32 ô (A A' B A), ~122 giây. Tiêu (xiao) hát thấp, rất nhiều khoảng lặng; cổ tranh gảy thưa, cổ cầm ngân gốc trầm;
// nhị hồ ngân dài từ A'; đoạn B nghiêng về bậc 2 và 5 (C, G) cho cảm giác bất định, trống nhỏ như nhịp tim rất khẽ; chuông vọng.
import { buildSong, channels } from "../lib/ngucung.mjs";

const J = (rows) => rows.join(" | ");
const A = J(["-:4 1:4", "3:6 -:2", "2:2 1:2 5,:4", "1:8", "-:2 4:2 3:2 2:2", "1:6 -:2", "2:2 3:2 4:4", "3:4 -:4"]);
const A2 = J(["1:2 3:2 4:4", "5:4 4:2 3:2", "3:2 2:2 1:2 5,:2", "1:6 -:2", "3:2 4:2 5:2 1':2", "5:4 4:2 3:2", "2:2 1:2 5,:4", "1:8"]);
const B = J(["2:6 1:2", "5,:4 -:4", "2:2 3:2 2:2 1:2", "5,:8", "-:2 5:2 4:2 3:2", "2:4 3:4", "4:2 3:2 2:2 1:2", "2:6 -:2"]);
const FOLLOW = (roots) => J(roots.map((d) => `${d}:8`));
const R_A = [1, 1, 4, 4, 3, 3, 4, 1];
const R_B = [5, 5, 3, 3, 2, 2, 4, 4];

const { notes, roots } = buildSong({
  tonic: "A2", mode: "vu", leadBase: 5, erhuBase: 5, leadCh: "lead2", leadVel: 74, padVel: 44, arp: [0, -1, -1, -1, 2, -1, -1, -1], arpVel: 50, bellMid: true,
  sections: [
    { leadCh: "lead2", lead: A, roots: R_A },
    { leadCh: "lead2", lead: A2, erhu: FOLLOW(R_A), erhuVel: 52, roots: R_A },
    { leadCh: "lead2", lead: B, erhu: FOLLOW(R_B), erhuVel: 56, roots: R_B, arp: [0, -1, -1, 1, -1, -1, 2, -1] },
    { leadCh: "lead2", lead: A, roots: R_A },
  ],
  // Nhịp tim rất khẽ ở đoạn B: hai tiếng trống nhỏ mỗi hai ô.
  perc: ({ bar, k, s }) => (s === 2 && k % 2 === 0 ? [{ ch: "mo", t: bar * 4, d: 0.3, p: 68, v: 50 }, { ch: "mo", t: bar * 4 + 0.75, d: 0.3, p: 68, v: 38 }] : []),
});

export default {
  id: "tinh_dau_ngoai_vi",
  title: "Tinh Đấu Ngoại vi",
  kind: "map",
  maps: ["tinh_dau_ngoai_vi"],
  bpm: 63,
  beatsPerBar: 4,
  bars: 32,
  bitrate: "80k",
  ngucung: { tonic: "A2", mode: "vu", roots },
  channels: channels({ lead2: { reverb: 95 }, bell: { volume: 62 } }),
  notes,
};
