// Chuyển động phụ của phụ thể võ hồn vẽ bằng CODE (H7 #490, mục 5.11): cánh vỗ, đuôi vẫy, vũ khí lắc / vung, vật bay bồng bềnh, hư ảnh thở,
// cây uốn, chân / rắn trườn; chỉ client, không ảnh mới. Hàm thuần (không Phaser, không tạo object mỗi khung): GameScene.animatePlayer đọc
// `spiritPose` rồi đặt xoay / co giãn / lệch lên hai lớp phụ thể (lớp sau và lớp trước dùng chung một tư thế nên hai nửa ảnh không rách nhau).
// Đơn vị: góc rad, co giãn là phần trăm lệch khỏi 1, độ dời là pixel ảnh (khung 96×96), chu kỳ giây. Phép biến đổi quanh điểm `SPIRIT_PIVOT`
// (pixel phía trên gót) nên cánh / đuôi xoay quanh lưng chứ không quanh chân.

export type SpiritFamily = "wing" | "tail" | "weapon" | "float" | "ghost" | "plant" | "limb";
export type SpiritState = "idle" | "walk" | "attack" | "cast";

/** Họ chuyển động của 25 võ hồn (bảng "Dạng phụ thể" ở tools/assets/README.md). Thêm võ hồn thì thêm dòng (bot kiểm đủ). */
export const SPIRIT_FAMILY: Readonly<Record<string, SpiritFamily>> = {
  ta_hoa_phuong_hoang: "wing", kim_vu_mieu_ung: "wing", bang_phuong_hoang: "wing",
  u_minh_linh_mieu: "tail", nhu_cot_tho: "tail", yeu_ho: "tail", liet_hoa_thuong_lang: "tail", bach_ho: "tail",
  cuu_tinh_that_sat_kiem: "weapon", nguyet_nhan: "weapon", hao_thien_chuy: "weapon", pha_hon_thuong: "weapon", xuc_xich: "weapon",
  thien_can_bach_ngoc_dinh: "float", cuu_bao_luu_ly_thap: "float", can_khon_hon_nguyen_toa: "float",
  lam_dien_ba_vuong_long: "ghost", hoa_long: "ghost", hoa_anh: "ghost", quy_mi: "ghost",
  ky_nhung_thong_thien_cuc: "plant", lam_ngan_thao: "plant", a_ngan: "plant",
  bich_lan_xa_hoang: "limb", tu_vong_chu_hoang: "limb",
};

/** Điểm xoay / co giãn (pixel phía trên gót, trục dọc): cánh, đuôi, hư ảnh ở lưng; vũ khí ở tay; vật bay ở ngực. */
export const SPIRIT_PIVOT: Readonly<Record<SpiritFamily, number>> = { wing: 30, tail: 16, weapon: 22, float: 34, ghost: 26, plant: 8, limb: 24 };

/** Dao động liên tục (đứng thở, đi): biên độ xoay `rot`, co giãn `sx` / `sy`, độ dời `dx` / `dy`. */
interface Osc { period: number; rot: number; sx: number; sy: number; dx: number; dy: number }
/** Cú một lần (đánh, thi triển): cùng các biên độ, nhân với đường cong `kickEnvelope` theo thời gian của hoạt ảnh. */
interface Kick { rot: number; sx: number; sy: number; dx: number; dy: number }

export const SPIRIT_MOTION = {
  /** Đứng: thở / chao nhẹ (cánh phồng, đuôi lắc, vật bay bồng bềnh, hư ảnh phập phồng). */
  idle: {
    wing: { period: 1.9, rot: 0, sx: 0.035, sy: 0.025, dx: 0, dy: 0.6 },
    tail: { period: 1.5, rot: 0.06, sx: 0, sy: 0.01, dx: 0, dy: 0 },
    weapon: { period: 2.1, rot: 0.035, sx: 0, sy: 0.01, dx: 0, dy: 0.5 },
    float: { period: 1.7, rot: 0.03, sx: 0.01, sy: 0.01, dx: 0, dy: 1.4 },
    ghost: { period: 2.4, rot: 0, sx: 0.02, sy: 0.03, dx: 0.6, dy: 0.4 },
    plant: { period: 2.2, rot: 0.045, sx: 0.01, sy: 0.015, dx: 0, dy: 0 },
    limb: { period: 1.3, rot: 0.05, sx: 0.015, sy: 0.01, dx: 0.3, dy: 0.3 },
  },
  /** Đi: nhịp nhanh hơn, theo chu kỳ bước (cánh vỗ, đuôi vẫy mạnh, vũ khí lắc, vật bay nảy theo bước). */
  walk: {
    wing: { period: 0.45, rot: 0.03, sx: 0.09, sy: 0.04, dx: 0, dy: 1.2 },
    tail: { period: 0.45, rot: 0.15, sx: 0.02, sy: 0.01, dx: 0.6, dy: 0 },
    weapon: { period: 0.45, rot: 0.1, sx: 0, sy: 0.015, dx: 0.5, dy: 0.8 },
    float: { period: 0.6, rot: 0.06, sx: 0.015, sy: 0.015, dx: 0, dy: 2 },
    ghost: { period: 0.5, rot: 0.03, sx: 0.04, sy: 0.04, dx: 1, dy: 0.8 },
    plant: { period: 0.55, rot: 0.1, sx: 0.015, sy: 0.02, dx: 0.4, dy: 0 },
    limb: { period: 0.4, rot: 0.12, sx: 0.04, sy: 0.02, dx: 0.8, dy: 0.6 },
  },
  /** Đánh thường (giật theo cú vung của thân): vũ khí vung, đuôi quất, cánh xòe, hư ảnh lao theo. `dx` theo hướng nhìn (đổi dấu khi lật). */
  attack: {
    wing: { rot: -0.05, sx: 0.12, sy: 0.1, dx: 0, dy: -2 },
    tail: { rot: 0.35, sx: 0.04, sy: 0, dx: 1, dy: 0 },
    weapon: { rot: 0.22, sx: 0, sy: 0.04, dx: 2.5, dy: 0 },
    float: { rot: 0.1, sx: 0.03, sy: 0.03, dx: 2, dy: -3 },
    ghost: { rot: 0, sx: 0.1, sy: 0.08, dx: 3, dy: 0 },
    plant: { rot: 0.25, sx: 0.05, sy: 0.06, dx: 1.5, dy: -1 },
    limb: { rot: 0.3, sx: 0.08, sy: 0.02, dx: 2.5, dy: -1 },
  },
  /** Thi triển hồn kỹ: mạnh hơn, hướng lên (cánh dang cao, vật bay nâng, hư ảnh phình). */
  cast: {
    wing: { rot: 0, sx: 0.16, sy: 0.14, dx: 0, dy: -3 },
    tail: { rot: 0.3, sx: 0.05, sy: 0.04, dx: 0.5, dy: -1 },
    weapon: { rot: -0.2, sx: 0.02, sy: 0.08, dx: 1, dy: -3 },
    float: { rot: 0.16, sx: 0.08, sy: 0.08, dx: 0, dy: -5 },
    ghost: { rot: 0, sx: 0.14, sy: 0.12, dx: 1, dy: -2 },
    plant: { rot: -0.2, sx: 0.08, sy: 0.12, dx: 0, dy: -2 },
    limb: { rot: -0.25, sx: 0.1, sy: 0.08, dx: 1, dy: -2 },
  },
  /** Bị đánh: giật lùi `ms` mili giây (mọi họ), nhân với mức chuyển động. */
  hurt: { ms: 160, rot: -0.08, dx: -1.5, dy: 0.8 },
  /** Cú đánh / thi triển: `wind` là phần đầu lấy đà ngược chiều (0..1 của thời lượng), `back` biên độ lấy đà so với cú chính. */
  kick: { wind: 0.3, back: 0.35 },
  /** Mỗi người lệch pha một khoảng ngẫu nhiên theo mã, để 40 người không vỗ cánh đồng loạt (giây, tối đa). */
  phaseSpread: 6,
} as const;

/** Mức chuyển động theo mức hiệu ứng (fxLevel, đã gồm trần FPS của bộ điều tốc): Thấp nhẹ, Vừa chuẩn, Cao rõ. Giảm chuyển động: tắt hẳn. */
export const SPIRIT_LEVEL_K = { low: 0.5, mid: 1, high: 1.25 } as const;
/** Người khác thấy nhẹ hơn chính mình (đỡ rối mắt khi đông người). */
export const SPIRIT_OTHER_K = 0.6;

export interface SpiritPose { rot: number; sx: number; sy: number; dx: number; dy: number; pivot: number; active: boolean }
export const newSpiritPose = (): SpiritPose => ({ rot: 0, sx: 1, sy: 1, dx: 0, dy: 0, pivot: 0, active: false });

/** Hệ số mức chuyển động (0 = tắt) cho một người: `level` đã qua fxLevel(), `reduce` = Giảm chuyển động, `mine` = chính mình. */
export function spiritScale(level: keyof typeof SPIRIT_LEVEL_K, reduce: boolean, mine: boolean): number {
  if (reduce) return 0;
  return SPIRIT_LEVEL_K[level] * (mine ? 1 : SPIRIT_OTHER_K);
}

/** Lệch pha riêng theo mã người chơi (giây, ổn định giữa các khung). */
export function spiritPhase(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000 * SPIRIT_MOTION.phaseSpread;
}

/** Đường cong cú đánh: lấy đà ngược chiều ở `kick.wind` đầu, rồi vung ra và thu về (sin) tới hết thời lượng. k ∈ [0,1]. */
export function kickEnvelope(k: number): number {
  const { wind, back } = SPIRIT_MOTION.kick;
  if (k <= 0 || k >= 1) return 0;
  if (k < wind) return -back * Math.sin((k / wind) * Math.PI / 2);
  const u = (k - wind) / (1 - wind);
  return (1 + back) * Math.sin(u * Math.PI) - back * (1 - u); // liền mạch: -back ở u=0, đỉnh giữa, 0 ở u=1
}

/**
 * Tính tư thế (ghi vào `out`, không tạo object): `t` giờ trò chơi (ms), `state` đứng / đi / đánh / thi triển, `age` ms từ lúc hoạt ảnh một lần bắt
 * đầu và `dur` thời lượng của nó (chỉ dùng cho attack / cast), `side` +1 / -1 theo hướng nhìn (lật ngang), `hurtAge` ms từ lúc bị đánh,
 * `k` mức chuyển động (spiritScale), `phase` lệch pha (spiritPhase). `k` ≤ 0: tắt, `out.active` = false (giữ nguyên ảnh gốc).
 */
export function spiritPose(out: SpiritPose, fam: SpiritFamily, state: SpiritState, t: number, age: number, dur: number, side: number, hurtAge: number, k: number, phase: number): SpiritPose {
  out.rot = 0; out.sx = 1; out.sy = 1; out.dx = 0; out.dy = 0; out.pivot = SPIRIT_PIVOT[fam]; out.active = false;
  if (!(k > 0)) return out;
  out.active = true;
  const sec = t / 1000 + phase, M = SPIRIT_MOTION;
  if (state === "attack" || state === "cast") {
    const K: Kick = M[state][fam], e = kickEnvelope(dur > 0 ? age / dur : 1) * k;
    out.rot = K.rot * e * side; out.sx = 1 + K.sx * e; out.sy = 1 + K.sy * e; out.dx = K.dx * e * side; out.dy = K.dy * e;
  } else {
    const O: Osc = M[state][fam], s = Math.sin(sec * 2 * Math.PI / O.period) * k;
    out.rot = O.rot * s * side; out.sx = 1 + O.sx * s; out.sy = 1 + O.sy * Math.cos(sec * 2 * Math.PI / O.period) * k; out.dx = O.dx * s * side;
    out.dy = -Math.abs(O.dy * s);
  }
  if (hurtAge >= 0 && hurtAge < M.hurt.ms) {
    const h = (1 - hurtAge / M.hurt.ms) * k;
    out.rot += M.hurt.rot * h * side; out.dx += M.hurt.dx * h * side; out.dy += M.hurt.dy * h;
  }
  return out;
}

/**
 * Dời gốc ảnh để phép xoay `rot` quanh điểm cách gót `pivot` pixel (phía trên) không làm ảnh trượt khỏi chỗ: trả độ lệch (x, y) pixel ảnh
 * cộng vào vị trí lớp (cùng độ dời `dx`, `dy` của tư thế). Ghi vào `out` để không tạo object.
 */
export function pivotShift(out: { x: number; y: number }, pose: SpiritPose): { x: number; y: number } {
  const h = pose.pivot, s = Math.sin(pose.rot), c = Math.cos(pose.rot);
  // điểm xoay p = (0, -h) so với gốc (gót); Phaser xoay quanh gốc ảnh nên cộng p - R·p = (-h·sin, -h(1-cos))
  out.x = pose.dx - h * s; out.y = pose.dy - h * (1 - c);
  return out;
}

/** Lớp ảnh nhận tư thế (Phaser.GameObjects.Sprite thỏa cấu trúc này). */
export interface PoseLayer { x: number; y: number; setRotation(r: number): unknown; setScale(x: number, y: number): unknown }

/**
 * Đặt tư thế lên các lớp phụ thể: `base` là hệ số phóng gốc của lớp (isometric 96×96: 1 / SPR; phụ thể 48×48 cũ vẽ bằng code: 1), nên độ dời
 * pixel ảnh nhân `base` khi cộng vào vị trí trong khung chứa phóng SPR. `(ox, oy)` là vị trí gốc của lớp (độ lệch LPC_VIEW.vohon + nhấc bay).
 * Dùng chung cho GameScene và trang xem trước.
 */
export function applySpiritPose(layers: readonly PoseLayer[], pose: SpiritPose, shift: { x: number; y: number }, ox: number, oy: number, base: number): void {
  pivotShift(shift, pose);
  for (const s of layers) {
    s.setRotation(pose.rot); s.setScale(pose.sx * base, pose.sy * base);
    s.x = ox + shift.x * base; s.y = oy + shift.y * base;
  }
}
