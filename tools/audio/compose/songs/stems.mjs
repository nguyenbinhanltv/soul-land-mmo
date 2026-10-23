// Lớp giao chiến (G5, #396): mỗi bài nền ở bản đồ có thể đánh nhau (hunt / boss / arena) có một "stem" cùng tông, cùng nhịp, cùng số ô,
// chỉ có phần dồn dập: dây trầm chạy móc đơn theo gốc hợp âm của bài, taiko và trống đập dày, kèn đồng chặt hợp âm, timpani cuộn cuối mỗi 8 ô.
// Client phát stem đồng bộ với bài nền (cùng thời điểm bắt đầu, cùng độ dài vòng) và chỉ kéo âm lượng: vào giao chiến thì stem lên,
// bài nền hạ nhẹ; ra giao chiến 8 s thì về. Stem sinh từ nốt của bài gốc (gốc hợp âm lấy từ kênh bass / cello / dây) nên không cần chép lại giai điệu.
// `giao_chien_boss_nang` là lớp nâng cấp cho pha 2 của boss thế giới (nổi giận): chồng lên bài giao chiến boss, đặc hơn một nấc.
import cucBacChiDia from "./cuc_bac_chi_dia.mjs";
import daiDauHonTruong from "./dai_dau_hon_truong.mjs";
import giaoChienBoss from "./giao_chien_boss.mjs";
import haiThanDao from "./hai_than_dao.mjs";
import lacNhatSamLam from "./lac_nhat_sam_lam.mjs";
import loiTinhDau from "./loi_tinh_dau.mjs";
import thanhHonThon from "./thanh_hon_thon.mjs";
import tinhDauNgoaiVi from "./tinh_dau_ngoai_vi.mjs";
import tinhDauNoiDia from "./tinh_dau_noi_dia.mjs";

const clampLow = (p) => { let q = p; while (q < 33) q += 12; while (q > 50) q -= 12; return q; };

/** Gốc hợp âm theo ô: [{ p }] từ kênh bass / cello (nốt thấp nhất trong ô) hoặc nốt thấp nhất của dây; ô trống lấy ô trước (hoặc sau). */
function rootsOf(base) {
  const bpb = base.beatsPerBar, key = ["bass", "cello", "strings"].find((k) => base.notes.some((n) => n.ch === k));
  if (!key) throw new Error(`${base.id}: không có kênh bass / cello / strings để lấy gốc hợp âm`);
  const roots = [];
  for (let bar = 0; bar < base.bars; bar++) {
    const inBar = base.notes.filter((n) => n.ch === key && n.t >= bar * bpb && n.t < (bar + 1) * bpb);
    roots.push(inBar.length ? clampLow(Math.min(...inBar.map((n) => n.p))) : null);
  }
  return roots.map((r, i) => r ?? roots.slice(0, i).reverse().find(Boolean) ?? roots.slice(i).find(Boolean) ?? null);
}

const STEPS = "X.o.x.o.X.o.x.xo"; // taiko 16 bước: nhấn phách 1 và 3, dồn cuối ô
const STEPS_HEAVY = "XxoxXxoxXxoxXxxx";

function build(base, { heavy }) {
  const notes = [], bpb = base.beatsPerBar;
  const add = (ch, t, d, p, v) => notes.push({ ch, t, d, p, v });
  rootsOf(base).forEach((root, bar) => {
    if (root === null) return;
    const t0 = bar * bpb;
    for (let k = 0; k < bpb * 2; k++) add("drive", t0 + k * 0.5, 0.42, root + (k % 8 === 7 ? 7 : 0), (k % 2 === 0 ? 72 : 58) + (k === 0 ? 14 : 0));
    add("brass", t0, 1.6, root + 24, bar % 2 === 0 ? 92 : 80);
    add("brass", t0, 1.6, root + 31, bar % 2 === 0 ? 84 : 72);
    if (heavy || bar % 2 === 1) add("brass", t0 + 2.5, 0.8, root + 24, 82);
    (heavy ? STEPS_HEAVY : STEPS).split("").forEach((c, i) => {
      if (c !== ".") add("taiko", t0 + (i * bpb) / 16, 0.2, root, c === "X" ? 100 : c === "x" ? 78 : 56);
    });
    for (let k = 0; k < bpb; k++) if (k % 2 === 0 || heavy) add("kick", t0 + k, 0.2, 36, k === 0 ? 100 : 80);
    if (bar % 8 === 7) for (let i = 0; i < 8; i++) add("timp", t0 + 2 + i * 0.25, 0.25, root + 12, 50 + i * 7);
    if (bar % 8 === 0) add("kick", t0, 1, 49, 84); // chũm chọe đầu đoạn
    if (heavy) add("choir", t0, bpb * 0.98, root + 24, 70);
  });
  return notes;
}

function stem(base, { id, title, of, phase, heavy = false, lufs = -21 }) {
  const channels = [
    { key: "drive", name: "Dây trầm dồn", channel: 1, program: 45, volume: 96, pan: 52, reverb: 40, humanVel: 4, groove: true },
    { key: "brass", name: "Kèn đồng chặt", channel: 2, program: 61, volume: 92, pan: 70, reverb: 70, humanVel: 3 },
    { key: "taiko", name: "Taiko dồn", channel: 3, program: 116, volume: 100, pan: 64, reverb: 75, humanTicks: 0 },
    { key: "timp", name: "Timpani", channel: 4, program: 47, volume: 84, pan: 58, reverb: 65, humanTicks: 1 },
    { key: "kick", name: "Trống / chũm chọe", channel: 10, program: 0, volume: 96, pan: 64, reverb: 55, humanTicks: 0 },
    ...(heavy ? [{ key: "choir", name: "Hợp xướng", channel: 5, program: 52, volume: 80, pan: 64, reverb: 100, expr: true }] : []),
  ];
  return {
    id, title, kind: "stem", of, ...(phase ? { phase } : {}),
    bpm: base.bpm, beatsPerBar: base.beatsPerBar, bars: base.bars, mono: true, bitrate: "40k", mix: { lufs },
    channels, notes: build(base, { heavy }),
  };
}

const LAYERS = [
  [thanhHonThon, "Thánh Hồn Thôn"], [tinhDauNgoaiVi, "Tinh Đấu Ngoại vi"], [tinhDauNoiDia, "Tinh Đấu Nội địa"], [lacNhatSamLam, "Lạc Nhật Sâm Lâm"],
  [cucBacChiDia, "Cực Bắc Chi Địa"], [haiThanDao, "Hải Thần Đảo"], [loiTinhDau, "Lõi Tinh Đấu"], [daiDauHonTruong, "Đại Đấu Hồn Trường"],
];

export default [
  ...LAYERS.map(([base, name]) => stem(base, { id: `${base.id}_chien`, title: `${name} (lớp giao chiến)`, of: base.id })),
  stem(giaoChienBoss, { id: "giao_chien_boss_nang", title: "Giao chiến boss (pha 2, nâng một nấc)", of: "giao_chien_boss", phase: 2, heavy: true, lufs: -20 }),
];
