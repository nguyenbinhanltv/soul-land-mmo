// S1 (#542): bảng hiển thị từng chiêu `SKILL_VISUAL` (chiêu → tầng / sheet / độ nặng) và bộ điều phối tầng T1–T3.
// Chỉ hiển thị ở client. Chiêu CHƯA có mục trong bảng (hoặc mục chưa có sheet) vẫn chạy đúng hiệu ứng G3 của `skillFx.ts` (skillFxOf), không đổi gì.
// S2 / S3 điền bảng này (kèm ảnh sheet cùng khóa); S1 chỉ có 2 chiêu thử + sheet dựng bằng code để chứng minh khung.
import type Phaser from "phaser";
import { ringSkill, chanThanOf } from "../../shared/data.ts";
import type { Element } from "./audio/soundMap.ts";
import { skillFxOf } from "./skillFx.ts";
import { SheetFx, makeCodeSheet, type SheetPlay } from "./fxSheet.ts";
import { fxPrefs } from "./combatFx.ts";
import { SPR } from "./iso.ts";

/** T1 nhẹ (vòng 1–4), T2 vừa (vòng 5, 6, 8, 9 + tiên cơ), T3 trình diễn (vòng 10, hồn kỹ Chân Thân). */
export type FxTier = 1 | 2 | 3;

/** Sheet của một chiêu: chạy ở đâu và thế nào. Bố cục ảnh xem `fxSheet.ts`. */
export interface VisualSheet {
  key: string;
  /** `cast`: ở người tung (hào quang, vung); `target`: ở điểm trúng; `travel`: bay từ người tung tới điểm trúng. */
  at: "cast" | "target" | "travel";
  /** Số hàng hướng của sheet (1 hoặc 8). */
  rows?: 1 | 8;
  /** Cỡ nguyên (bội SPR). */
  scale?: number;
  fps?: number;
  /** Màu nhân vào ảnh (bỏ trống: giữ màu ảnh). */
  tint?: number;
  /** Lớp cộng sáng riêng cùng bố cục (`fx_sk_<tên>_g`): Thấp không vẽ, Vừa mờ, Cao đủ; chiêu của người khác không có. */
  glow?: string;
  /** Vẽ thường thay vì cộng sáng (bụi, đá, chùy: màu tối và viền không bị mất). */
  normal?: boolean;
  /** Bù độ cao (px màn hình, dương = lên): vùng trên mặt đất đặt -8 * SPR (tâm gốc là ngang ngực). */
  lift?: number;
  /** Đạn (travel): xoay ảnh theo hướng bay (sheet vẽ hướng sang phải) thay cho lật ngang. */
  rotate?: boolean;
  /** Vừa bán kính chiêu: bề ngang = 2 × bán kính × hệ số (bỏ `scale`). */
  fit?: number;
}

export interface SkillVisual {
  tier: FxTier;
  /** Độ nặng đòn 0..3 (khựng, giật lùi, tia lửa mạnh hơn); mặc định theo tầng: T1 0, T2 1, T3 2. */
  heavy: 0 | 1 | 2 | 3;
  /** Lớp báo trước / lấy đà (T2 / T3): phát ở người tung ngay khi tin `fx` tới, chạy trong `windup` ms. Sheet chính vẫn phát ngay (khớp số sát thương / tia lửa / khựng, không bị trễ). Chỉ người tung chiêu thấy. */
  windupSheet?: VisualSheet;
  windup?: number;
  /** Phát thêm một lần ở điểm trúng sau `delay` ms kể từ lúc tung (dư chấn T3, chính mình thấy). */
  aftershock?: { sheet: VisualSheet; delay: number };
  sheet?: VisualSheet;
  /** Chiêu trúng nhiều lần / nhiều đợt (`n`, `every` ở data.ts): phát lại sheet theo nhịp đó (tối đa `REPEAT_MAX` theo mức hiệu ứng). */
  repeat?: boolean;
  /** true: sheet THAY hiệu ứng G3 (mặc định false: sheet chồng lên G3, an toàn khi ảnh chưa đẹp). */
  replace?: boolean;
  /** Ghi đè hệ (màu hạt, tia lửa); mặc định theo `skillFxOf`. */
  element?: Element;
}

/** Tầng mặc định theo vòng 0..9 (ring 6 = vòng 7 không có hồn kỹ thường; Chân Thân tính T3). */
export const tierOfRing = (ring: number, chanThan: boolean): FxTier => (chanThan || ring >= 9 ? 3 : ring >= 4 ? 2 : 1);
const HEAVY_OF_TIER: Record<FxTier, 0 | 1 | 2> = { 1: 0, 2: 1, 3: 2 };

/** Khóa bảng: `<mã võ hồn>:<vòng 0..9>`, hồn kỹ Chân Thân `<mã>:ct`. */
export const visualKey = (vohonId: string, ring: number | "tc", chanThan = false) => `${vohonId}:${chanThan ? "ct" : ring}`;
/** Số lần phát lại tối đa của chiêu nhiều lần theo mức hiệu ứng (chiêu của người khác tối đa 2). */
const REPEAT_MAX: Record<"low" | "mid" | "high", number> = { low: 1, mid: 4, high: 6 };
/** Độ đục lớp cộng sáng theo mức. */
const GLOW_ALPHA = { low: 0, mid: 0.3, high: 0.5 } as const;

/** Sheet PixelLab `fx_sk_<tên>` (S2 #548, `tools/assets/skill-vfx/pilot.json`): `s` thân + lớp cộng sáng `_g` cùng tên. `fit` vừa bán kính chiêu (vùng), hoặc `scale` cố định (đòn trúng, vệt chém). */
const sk = (n: string, o: Omit<VisualSheet, "key" | "glow">): VisualSheet => ({ key: `fx_sk_${n}`, glow: `fx_sk_${n}_g`, normal: true, ...o });
/** Lấy đà T2 (2 khung ở người tung) và báo trước T3 (0,4 giây): sheet tụ khí dựng bằng code, nhuộm màu võ hồn. */
const wind = (tint: number, big = false): Pick<SkillVisual, "windup" | "windupSheet"> => big
  ? { windup: 400, windupSheet: { key: "fxs_tu_khi", at: "cast", scale: 4 * SPR, fps: 15, tint, lift: -4 * SPR } }
  : { windup: 150, windupSheet: { key: "fxs_tu_khi", at: "cast", scale: 2 * SPR, fps: 40, tint } };
const GROUND = -8 * SPR; // tâm khung ở ngang ngực (CastCtx.y): kéo xuống mặt đất cho hiệu ứng vùng
const LD = 0x8ac8ff, HT = 0xd0d4e4;
// S3 lô A (#566): màu lấy đà / báo trước theo bảng màu võ hồn
const CS = 0xcfe3ff, NN = 0xe6e6f0, CK = 0xffe08a, XX = 0xffd9a0, TD = 0xfff6d0, CB = 0xbff4ff, PH = 0xc0fff4;
// S3 lô C (#568): màu lấy đà / báo trước theo bảng màu võ hồn
const TP = 0xffb347, HL = 0xffb347, HA = 0xff9a5a, QM = 0xc0c0ff, BP = 0xeafcff;

/**
 * Bảng chiêu → sheet. S2 điền Lam Điện Bá Vương Long (`lam_dien_ba_vuong_long`) và Hạo Thiên Chùy (`hao_thien_chuy`): 11 chiêu mỗi võ hồn
 * (vòng 1–6, 8, 9, 10 → khóa 0–5, 7, 8, 9; Chân Thân `ct`; tiên cơ `tc`). Võ hồn khác điền ở S3 theo cùng mẫu (T1 nhẹ không lấy đà, T2 lấy đà + khựng 3,
 * T3 báo trước + sheet 12 khung + `pt.strike`). `fxs_*` là sheet dựng bằng code (makeCodeSheet, `registerCodeSheets`).
 */
export const SKILL_VISUAL: Readonly<Record<string, Partial<SkillVisual>>> = {
  // --- Lam Điện Bá Vương Long (hệ Lôi, cộng sáng) ---
  "lam_dien_ba_vuong_long:0": { tier: 1, heavy: 0, replace: true, sheet: sk("ld_slash1", { at: "target", scale: 2, fps: 16 }) },
  "lam_dien_ba_vuong_long:1": { tier: 1, heavy: 0, replace: true, sheet: sk("ld_zone1", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "lam_dien_ba_vuong_long:2": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("ld_hit1", { at: "target", scale: 2, fps: 14, lift: -4 * SPR }) },
  "lam_dien_ba_vuong_long:3": { tier: 1, heavy: 0, replace: true, sheet: sk("ld_zone4", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "lam_dien_ba_vuong_long:4": { tier: 2, heavy: 1, ...wind(LD), replace: true, sheet: sk("ld_slash5", { at: "target", fit: 0.9, fps: 12 }) },
  "lam_dien_ba_vuong_long:5": { tier: 2, heavy: 1, repeat: true, ...wind(LD), replace: true, sheet: sk("ld_hit6", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "lam_dien_ba_vuong_long:7": { tier: 2, heavy: 1, repeat: true, ...wind(LD), replace: true, sheet: sk("ld_zone8", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "lam_dien_ba_vuong_long:8": { tier: 2, heavy: 1, ...wind(LD), replace: true, sheet: sk("ld_zone9", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "lam_dien_ba_vuong_long:9": { tier: 3, heavy: 2, ...wind(LD, true), replace: true, sheet: sk("ld_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "lam_dien_ba_vuong_long:ct": { tier: 3, heavy: 2, ...wind(LD, true), replace: true, sheet: sk("ld_t3b", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "lam_dien_ba_vuong_long:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("ld_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  // --- Hạo Thiên Chùy (hệ Quang, vẽ thường: bụi và đá giữ màu tối, nhịp chậm) ---
  "hao_thien_chuy:0": { tier: 1, heavy: 1, replace: true, sheet: sk("ht_slash1", { at: "target", scale: 2, fps: 10 }) },
  "hao_thien_chuy:1": { tier: 1, heavy: 1, replace: true, sheet: sk("ht_zone1", { at: "cast", fit: 1, lift: GROUND, fps: 10 }) },
  "hao_thien_chuy:2": { tier: 1, heavy: 1, repeat: true, replace: true, sheet: sk("ht_hit1", { at: "target", scale: 2, fps: 12, lift: GROUND }) },
  "hao_thien_chuy:3": { tier: 1, heavy: 1, replace: true, sheet: sk("ht_zone4", { at: "cast", fit: 1, lift: GROUND, fps: 10 }) },
  "hao_thien_chuy:4": { tier: 2, heavy: 2, ...wind(HT), replace: true, sheet: sk("ht_zone5", { at: "cast", fit: 1, lift: GROUND, fps: 10 }) },
  "hao_thien_chuy:5": { tier: 2, heavy: 2, ...wind(HT), replace: true, sheet: sk("ht_slash6", { at: "target", fit: 0.9, fps: 10 }) },
  "hao_thien_chuy:7": { tier: 2, heavy: 2, repeat: true, ...wind(HT), replace: true, sheet: sk("ht_zone8", { at: "cast", fit: 1, lift: GROUND, fps: 10 }) },
  "hao_thien_chuy:8": { tier: 2, heavy: 2, ...wind(HT), replace: true, sheet: sk("ht_hit9", { at: "target", scale: 2, fps: 12, lift: GROUND }) },
  "hao_thien_chuy:9": { tier: 3, heavy: 3, ...wind(HT, true), replace: true, sheet: sk("ht_t3a", { at: "target", fit: 1, fps: 9, lift: GROUND }) },
  "hao_thien_chuy:ct": { tier: 3, heavy: 3, ...wind(HT, true), replace: true, sheet: sk("ht_t3b", { at: "target", fit: 1, fps: 9, lift: GROUND }) },
  "hao_thien_chuy:tc": { tier: 2, heavy: 2, replace: true, sheet: sk("ht_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 10 }) },
  // --- Cửu Tinh Thất Sát Kiếm (hệ Quang, kiếm khí bạc: vẽ thường, lớp sáng cộng) ---
  "cuu_tinh_that_sat_kiem:0": { tier: 1, heavy: 0, replace: true, sheet: sk("cs_slash1", { at: "target", scale: 2, fps: 16 }) },
  "cuu_tinh_that_sat_kiem:1": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("cs_proj2", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "cuu_tinh_that_sat_kiem:2": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("cs_zone3", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "cuu_tinh_that_sat_kiem:3": { tier: 1, heavy: 0, replace: true, sheet: sk("cs_slash4", { at: "target", scale: 2, fps: 16 }) },
  "cuu_tinh_that_sat_kiem:4": { tier: 2, heavy: 1, ...wind(CS), replace: true, sheet: sk("cs_slash5", { at: "target", fit: 0.9, fps: 12 }) },
  "cuu_tinh_that_sat_kiem:5": { tier: 2, heavy: 1, repeat: true, ...wind(CS), replace: true, sheet: sk("cs_zone6", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "cuu_tinh_that_sat_kiem:7": { tier: 2, heavy: 1, repeat: true, ...wind(CS), replace: true, sheet: sk("cs_proj8", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "cuu_tinh_that_sat_kiem:8": { tier: 2, heavy: 1, ...wind(CS), replace: true, sheet: sk("cs_hit9", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "cuu_tinh_that_sat_kiem:9": { tier: 3, heavy: 2, ...wind(CS, true), replace: true, sheet: sk("cs_t3a", { at: "target", fit: 1, fps: 9, lift: GROUND }) },
  "cuu_tinh_that_sat_kiem:ct": { tier: 3, heavy: 2, ...wind(CS, true), replace: true, sheet: sk("cs_t3b", { at: "target", fit: 1, fps: 9, lift: GROUND }) },
  "cuu_tinh_that_sat_kiem:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("cs_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  // --- Nguyệt Nhận (hệ Hỏa, trăng khuyết bạc viền đỏ) ---
  "nguyet_nhan:0": { tier: 1, heavy: 0, replace: true, sheet: sk("nn_dash1", { at: "target", scale: 2, fps: 16 }) },
  "nguyet_nhan:1": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("nn_hit2", { at: "target", scale: 2, fps: 14, lift: -4 * SPR }) },
  "nguyet_nhan:2": { tier: 1, heavy: 0, replace: true, sheet: sk("nn_slash3", { at: "target", scale: 2, fps: 16 }) },
  "nguyet_nhan:3": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("nn_hit4", { at: "target", scale: 2, fps: 14, lift: -4 * SPR }) },
  "nguyet_nhan:4": { tier: 2, heavy: 1, ...wind(NN), replace: true, sheet: sk("nn_dash5", { at: "target", fit: 0.9, fps: 12 }) },
  "nguyet_nhan:5": { tier: 2, heavy: 1, repeat: true, ...wind(NN), replace: true, sheet: sk("nn_hit6", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "nguyet_nhan:7": { tier: 2, heavy: 1, ...wind(NN), replace: true, sheet: sk("nn_slash8", { at: "target", fit: 0.9, fps: 12 }) },
  "nguyet_nhan:8": { tier: 2, heavy: 1, repeat: true, ...wind(NN), replace: true, sheet: sk("nn_hit9", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "nguyet_nhan:9": { tier: 3, heavy: 2, ...wind(NN, true), replace: true, sheet: sk("nn_t3a", { at: "target", fit: 1, fps: 9, lift: GROUND }) },
  "nguyet_nhan:ct": { tier: 3, heavy: 2, ...wind(NN, true), replace: true, sheet: sk("nn_t3b", { at: "target", fit: 1, fps: 9, lift: GROUND }) },
  "nguyet_nhan:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("nn_hit_tc", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  // --- Càn Khôn Hỗn Nguyên Tỏa (hệ Lôi, xích và ổ khóa vàng) ---
  "can_khon_hon_nguyen_toa:0": { tier: 1, heavy: 0, replace: true, sheet: sk("ck_hit1", { at: "target", scale: 2, fps: 12, lift: -4 * SPR }) },
  "can_khon_hon_nguyen_toa:1": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("ck_zone2", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "can_khon_hon_nguyen_toa:2": { tier: 1, heavy: 0, replace: true, sheet: sk("ck_zone3", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "can_khon_hon_nguyen_toa:3": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("ck_zone4", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "can_khon_hon_nguyen_toa:4": { tier: 2, heavy: 1, repeat: true, ...wind(CK), replace: true, sheet: sk("ck_hit5", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "can_khon_hon_nguyen_toa:5": { tier: 2, heavy: 1, repeat: true, ...wind(CK), replace: true, sheet: sk("ck_zone6", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "can_khon_hon_nguyen_toa:7": { tier: 2, heavy: 1, ...wind(CK), replace: true, sheet: sk("ck_zone8", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "can_khon_hon_nguyen_toa:8": { tier: 2, heavy: 1, ...wind(CK), replace: true, sheet: sk("ck_hit9", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "can_khon_hon_nguyen_toa:9": { tier: 3, heavy: 2, ...wind(CK, true), replace: true, sheet: sk("ck_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "can_khon_hon_nguyen_toa:ct": { tier: 3, heavy: 2, ...wind(CK, true), replace: true, sheet: sk("ck_t3b", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "can_khon_hon_nguyen_toa:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("ck_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  // --- Xúc Xích (hệ Lôi, phụ trợ: hào quang quanh người tung) ---
  "xuc_xich:0": { tier: 1, heavy: 0, replace: true, sheet: sk("xx_aura1", { at: "cast", scale: 2, fps: 12 }) },
  "xuc_xich:1": { tier: 1, heavy: 0, replace: true, sheet: sk("xx_aura2", { at: "cast", scale: 2, fps: 12 }) },
  "xuc_xich:2": { tier: 1, heavy: 0, replace: true, sheet: sk("xx_aura3", { at: "cast", scale: 2, fps: 12 }) },
  "xuc_xich:3": { tier: 1, heavy: 0, replace: true, sheet: sk("xx_aura4", { at: "cast", scale: 2, fps: 12 }) },
  "xuc_xich:4": { tier: 2, heavy: 1, ...wind(XX), replace: true, sheet: sk("xx_aura5", { at: "cast", scale: 2, fps: 12 }) },
  "xuc_xich:5": { tier: 2, heavy: 1, repeat: true, ...wind(XX), replace: true, sheet: sk("xx_proj6", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "xuc_xich:7": { tier: 2, heavy: 1, ...wind(XX), replace: true, sheet: sk("xx_aura8", { at: "cast", scale: 2, fps: 12 }) },
  "xuc_xich:8": { tier: 2, heavy: 1, ...wind(XX), replace: true, sheet: sk("xx_aura9", { at: "cast", scale: 2, fps: 12 }) },
  "xuc_xich:9": { tier: 3, heavy: 2, ...wind(XX, true), replace: true, sheet: sk("xx_t3a", { at: "cast", scale: 2, fps: 9, lift: GROUND }) },
  "xuc_xich:ct": { tier: 3, heavy: 2, ...wind(XX, true), replace: true, sheet: sk("xx_t3b", { at: "cast", scale: 2, fps: 9, lift: GROUND }) },
  "xuc_xich:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("xx_aura_tc", { at: "cast", scale: 2, fps: 12 }) },
  // --- Thiên Càn Bạch Ngọc Đỉnh (hệ Mộc, ngọc trắng: hào quang và vùng trấn) ---
  "thien_can_bach_ngoc_dinh:0": { tier: 1, heavy: 0, replace: true, sheet: sk("td_aura1", { at: "cast", scale: 2, fps: 12 }) },
  "thien_can_bach_ngoc_dinh:1": { tier: 1, heavy: 0, replace: true, sheet: sk("td_aura2", { at: "cast", scale: 2, fps: 12 }) },
  "thien_can_bach_ngoc_dinh:2": { tier: 1, heavy: 0, replace: true, sheet: sk("td_zone3", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "thien_can_bach_ngoc_dinh:3": { tier: 1, heavy: 0, replace: true, sheet: sk("td_aura4", { at: "cast", scale: 2, fps: 12 }) },
  "thien_can_bach_ngoc_dinh:4": { tier: 2, heavy: 1, ...wind(TD), replace: true, sheet: sk("td_zone5", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "thien_can_bach_ngoc_dinh:5": { tier: 2, heavy: 1, ...wind(TD), replace: true, sheet: sk("td_aura6", { at: "cast", scale: 2, fps: 12 }) },
  "thien_can_bach_ngoc_dinh:7": { tier: 2, heavy: 1, ...wind(TD), replace: true, sheet: sk("td_zone8", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "thien_can_bach_ngoc_dinh:8": { tier: 2, heavy: 1, ...wind(TD), replace: true, sheet: sk("td_aura9", { at: "cast", scale: 2, fps: 12 }) },
  "thien_can_bach_ngoc_dinh:9": { tier: 3, heavy: 2, ...wind(TD, true), replace: true, sheet: sk("td_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "thien_can_bach_ngoc_dinh:ct": { tier: 3, heavy: 2, ...wind(TD, true), replace: true, sheet: sk("td_t3b", { at: "cast", scale: 2, fps: 9, lift: GROUND }) },
  "thien_can_bach_ngoc_dinh:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("td_aura_tc", { at: "cast", scale: 2, fps: 12 }) },
  // --- Cửu Bảo Lưu Ly Tháp (hệ Hỏa, lưu ly bảy sắc: hào quang quanh người) ---
  "cuu_bao_luu_ly_thap:0": { tier: 1, heavy: 0, replace: true, sheet: sk("cb_aura1", { at: "cast", scale: 2, fps: 12 }) },
  "cuu_bao_luu_ly_thap:1": { tier: 1, heavy: 0, replace: true, sheet: sk("cb_aura2", { at: "cast", scale: 2, fps: 12 }) },
  "cuu_bao_luu_ly_thap:2": { tier: 1, heavy: 0, replace: true, sheet: sk("cb_aura3", { at: "cast", scale: 2, fps: 12 }) },
  "cuu_bao_luu_ly_thap:3": { tier: 1, heavy: 0, replace: true, sheet: sk("cb_aura4", { at: "cast", scale: 2, fps: 12 }) },
  "cuu_bao_luu_ly_thap:4": { tier: 2, heavy: 1, ...wind(CB), replace: true, sheet: sk("cb_zone5", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "cuu_bao_luu_ly_thap:5": { tier: 2, heavy: 1, ...wind(CB), replace: true, sheet: sk("cb_aura6", { at: "cast", scale: 2, fps: 12 }) },
  "cuu_bao_luu_ly_thap:7": { tier: 2, heavy: 1, ...wind(CB), replace: true, sheet: sk("cb_aura8", { at: "cast", scale: 2, fps: 12 }) },
  "cuu_bao_luu_ly_thap:8": { tier: 2, heavy: 1, ...wind(CB), replace: true, sheet: sk("cb_aura9", { at: "cast", scale: 2, fps: 12 }) },
  "cuu_bao_luu_ly_thap:9": { tier: 3, heavy: 2, ...wind(CB, true), replace: true, sheet: sk("cb_t3a", { at: "cast", scale: 2, fps: 9, lift: GROUND }) },
  "cuu_bao_luu_ly_thap:ct": { tier: 3, heavy: 2, ...wind(CB, true), replace: true, sheet: sk("cb_t3b", { at: "cast", scale: 2, fps: 9, lift: GROUND }) },
  "cuu_bao_luu_ly_thap:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("cb_aura_tc", { at: "cast", scale: 2, fps: 12 }) },
  // --- Phá Hồn Thương (hệ Quang, thương ngọc: tua đỏ chỉ ở nét vẽ) ---
  "pha_hon_thuong:0": { tier: 1, heavy: 0, replace: true, sheet: sk("ph_slash1", { at: "target", scale: 2, fps: 16 }) },
  "pha_hon_thuong:1": { tier: 1, heavy: 0, replace: true, sheet: sk("ph_dash2", { at: "target", scale: 2, fps: 16 }) },
  "pha_hon_thuong:2": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("ph_hit3", { at: "target", scale: 2, fps: 14, lift: -4 * SPR }) },
  "pha_hon_thuong:3": { tier: 1, heavy: 0, replace: true, sheet: sk("ph_slash4", { at: "target", scale: 2, fps: 16 }) },
  "pha_hon_thuong:4": { tier: 2, heavy: 1, repeat: true, ...wind(PH), replace: true, sheet: sk("ph_hit5", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "pha_hon_thuong:5": { tier: 2, heavy: 1, repeat: true, ...wind(PH), replace: true, sheet: sk("ph_proj6", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "pha_hon_thuong:7": { tier: 2, heavy: 1, ...wind(PH), replace: true, sheet: sk("ph_slash8", { at: "target", fit: 0.9, fps: 12 }) },
  "pha_hon_thuong:8": { tier: 2, heavy: 1, ...wind(PH), replace: true, sheet: sk("ph_dash9", { at: "target", fit: 0.9, fps: 12 }) },
  "pha_hon_thuong:9": { tier: 3, heavy: 2, ...wind(PH, true), replace: true, sheet: sk("ph_t3a", { at: "target", fit: 1, fps: 9, lift: GROUND }) },
  "pha_hon_thuong:ct": { tier: 3, heavy: 2, ...wind(PH, true), replace: true, sheet: sk("ph_t3b", { at: "target", fit: 1, fps: 9, lift: GROUND }) },
  "pha_hon_thuong:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("ph_dash_tc", { at: "target", fit: 0.9, fps: 12 }) },
  // --- Tà Hỏa Phượng Hoàng (hệ Hỏa, lửa tím đỏ, lông vũ cháy) ---
  "ta_hoa_phuong_hoang:0": { tier: 1, heavy: 0, replace: true, sheet: sk("tp_slash1", { at: "target", scale: 2, fps: 16 }) },
  "ta_hoa_phuong_hoang:1": { tier: 1, heavy: 0, replace: true, sheet: sk("tp_zone2", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "ta_hoa_phuong_hoang:2": { tier: 1, heavy: 0, replace: true, sheet: sk("tp_dash3", { at: "target", scale: 2, fps: 14 }) },
  "ta_hoa_phuong_hoang:3": { tier: 1, heavy: 0, replace: true, sheet: sk("tp_zone4", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "ta_hoa_phuong_hoang:4": { tier: 2, heavy: 1, repeat: true, ...wind(TP), replace: true, sheet: sk("tp_proj5", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "ta_hoa_phuong_hoang:5": { tier: 2, heavy: 1, ...wind(TP), replace: true, sheet: sk("tp_dash6", { at: "target", fit: 0.9, fps: 12 }) },
  "ta_hoa_phuong_hoang:7": { tier: 2, heavy: 1, repeat: true, ...wind(TP), replace: true, sheet: sk("tp_zone8", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "ta_hoa_phuong_hoang:8": { tier: 2, heavy: 1, ...wind(TP), replace: true, sheet: sk("tp_zone9", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "ta_hoa_phuong_hoang:9": { tier: 3, heavy: 2, ...wind(TP, true), replace: true, sheet: sk("tp_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "ta_hoa_phuong_hoang:ct": { tier: 3, heavy: 2, ...wind(TP, true), replace: true, sheet: sk("tp_t3b", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "ta_hoa_phuong_hoang:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("tp_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  // --- Hỏa Long (hệ Hỏa, cầu lửa vảy cháy, mặt rồng) ---
  "hoa_long:0": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("hl_proj1", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "hoa_long:1": { tier: 1, heavy: 0, replace: true, sheet: sk("hl_hit2", { at: "target", scale: 2, fps: 12, lift: -4 * SPR }) },
  "hoa_long:2": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("hl_proj3", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "hoa_long:3": { tier: 1, heavy: 0, replace: true, sheet: sk("hl_zone4", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "hoa_long:4": { tier: 2, heavy: 1, repeat: true, ...wind(HL), replace: true, sheet: sk("hl_proj5", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "hoa_long:5": { tier: 2, heavy: 1, repeat: true, ...wind(HL), replace: true, sheet: sk("hl_hit6", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "hoa_long:7": { tier: 2, heavy: 1, repeat: true, ...wind(HL), replace: true, sheet: sk("hl_proj8", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "hoa_long:8": { tier: 2, heavy: 1, ...wind(HL), replace: true, sheet: sk("hl_zone9", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "hoa_long:9": { tier: 3, heavy: 2, ...wind(HL, true), replace: true, sheet: sk("hl_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "hoa_long:ct": { tier: 3, heavy: 2, ...wind(HL, true), replace: true, sheet: sk("hl_t3b", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "hoa_long:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("hl_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  // --- Hỏa Ảnh (hệ Hỏa, chưởng lửa đỏ thẫm, dấu bàn tay) ---
  "hoa_anh:0": { tier: 1, heavy: 0, replace: true, sheet: sk("ha_slash1", { at: "target", scale: 2, fps: 16 }) },
  "hoa_anh:1": { tier: 1, heavy: 0, replace: true, sheet: sk("ha_hit2", { at: "target", scale: 2, fps: 12, lift: -4 * SPR }) },
  "hoa_anh:2": { tier: 1, heavy: 0, replace: true, sheet: sk("ha_zone3", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "hoa_anh:3": { tier: 1, heavy: 0, replace: true, sheet: sk("ha_zone4", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "hoa_anh:4": { tier: 2, heavy: 1, ...wind(HA), replace: true, sheet: sk("ha_slash5", { at: "target", fit: 0.9, fps: 12 }) },
  "hoa_anh:5": { tier: 2, heavy: 1, repeat: true, ...wind(HA), replace: true, sheet: sk("ha_zone6", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "hoa_anh:7": { tier: 2, heavy: 1, ...wind(HA), replace: true, sheet: sk("ha_zone8", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "hoa_anh:8": { tier: 2, heavy: 1, ...wind(HA), replace: true, sheet: sk("ha_hit9", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "hoa_anh:9": { tier: 3, heavy: 2, ...wind(HA, true), replace: true, sheet: sk("ha_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "hoa_anh:ct": { tier: 3, heavy: 2, ...wind(HA, true), replace: true, sheet: sk("ha_t3b", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "hoa_anh:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("ha_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  // --- Quỷ Mị (hệ Ám, phụ trợ: hào quang khói tím xanh quanh người tung) ---
  "quy_mi:0": { tier: 1, heavy: 0, replace: true, sheet: sk("qm_hit1", { at: "target", scale: 2, fps: 12, lift: -4 * SPR }) },
  "quy_mi:1": { tier: 1, heavy: 0, replace: true, sheet: sk("qm_aura2", { at: "cast", scale: 2, fps: 12 }) },
  "quy_mi:2": { tier: 1, heavy: 0, replace: true, sheet: sk("qm_aura3", { at: "cast", scale: 2, fps: 12 }) },
  "quy_mi:3": { tier: 1, heavy: 0, replace: true, sheet: sk("qm_aura4", { at: "cast", scale: 2, fps: 12 }) },
  "quy_mi:4": { tier: 2, heavy: 1, ...wind(QM), replace: true, sheet: sk("qm_zone5", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "quy_mi:5": { tier: 2, heavy: 1, ...wind(QM), replace: true, sheet: sk("qm_aura6", { at: "cast", scale: 2, fps: 12 }) },
  "quy_mi:7": { tier: 2, heavy: 1, ...wind(QM), replace: true, sheet: sk("qm_aura8", { at: "cast", scale: 2, fps: 12 }) },
  "quy_mi:8": { tier: 2, heavy: 1, ...wind(QM), replace: true, sheet: sk("qm_zone9", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "quy_mi:9": { tier: 3, heavy: 2, ...wind(QM, true), replace: true, sheet: sk("qm_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "quy_mi:ct": { tier: 3, heavy: 2, ...wind(QM, true), replace: true, sheet: sk("qm_t3b", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "quy_mi:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("qm_aura_tc", { at: "cast", scale: 2, fps: 12 }) },
  // --- Băng Phượng Hoàng (hệ Băng, lông vũ tinh thể, bông tuyết) ---
  "bang_phuong_hoang:0": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("bp_proj1", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "bang_phuong_hoang:1": { tier: 1, heavy: 0, replace: true, sheet: sk("bp_slash2", { at: "target", scale: 2, fps: 14 }) },
  "bang_phuong_hoang:2": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("bp_zone3", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "bang_phuong_hoang:3": { tier: 1, heavy: 0, replace: true, sheet: sk("bp_zone4", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "bang_phuong_hoang:4": { tier: 2, heavy: 1, ...wind(BP), replace: true, sheet: sk("bp_dash5", { at: "target", fit: 0.9, fps: 12 }) },
  "bang_phuong_hoang:5": { tier: 2, heavy: 1, repeat: true, ...wind(BP), replace: true, sheet: sk("bp_zone6", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "bang_phuong_hoang:7": { tier: 2, heavy: 1, repeat: true, ...wind(BP), replace: true, sheet: sk("bp_proj8", { at: "travel", rotate: true, scale: 2, fps: 12 }) },
  "bang_phuong_hoang:8": { tier: 2, heavy: 1, ...wind(BP), replace: true, sheet: sk("bp_zone9", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "bang_phuong_hoang:9": { tier: 3, heavy: 2, ...wind(BP, true), replace: true, sheet: sk("bp_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "bang_phuong_hoang:ct": { tier: 3, heavy: 2, ...wind(BP, true), replace: true, sheet: sk("bp_t3b", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "bang_phuong_hoang:tc": { tier: 2, heavy: 1, replace: true, sheet: sk("bp_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
};

/** Dung hợp (S3 #566): sheet bùng ở điểm giữa hai người, khóa theo tên `FUSIONS[i].name`; chưa có thì giữ đóa kính lưu ly dựng bằng code. */
export const FUSION_VISUAL: Readonly<Record<string, Partial<SkillVisual>>> = {
  "Yêu Nguyệt": { tier: 3, heavy: 2, replace: true, sheet: sk("yn_t3", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "Băng Hỏa Lưỡng Nghi": { tier: 3, heavy: 2, replace: true, sheet: sk("bh_t3", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
};

/** Mục đã điền đủ mặc định cho chiêu; không có mục thì chỉ tầng + độ nặng theo vòng (hành vi cũ). */
export function skillVisualOf(vohonId: string, ring: number | "tc", chanThan = false): SkillVisual & { element: Element } {
  const own = SKILL_VISUAL[visualKey(vohonId, ring, chanThan)], tier = own?.tier ?? tierOfRing(ring === "tc" ? 4 : ring, chanThan);
  return { ...own, tier, heavy: own?.heavy ?? HEAVY_OF_TIER[tier], element: own?.element ?? skillFxOf(vohonId, ring === "tc" ? 0 : ring, chanThan).element };
}
/** Chiêu có thật (kiểm bảng không trỏ vào chiêu không tồn tại). */
export const skillExists = (vohonId: string, ring: number, chanThan = false) => !!(chanThan ? chanThanOf(vohonId)?.skill : ringSkill(vohonId, ring));

/** Dựng sheet bằng code cần cho bảng (gọi một lần khi cảnh khởi tạo; có ảnh thật cùng khóa thì bỏ qua). */
export function registerCodeSheets(scene: Phaser.Scene) {
  tuKhi(scene);
  // Sét giáng: cột sét zíc-zắc từ trên xuống rồi vòng sóng lan, 8 khung 48×48, vẽ theo ô pixel 2.
  makeCodeSheet(scene, "fxs_loi_giang", 8, 48, (c, k, S) => {
    const px = 2, bolt = Math.min(1, k * 3), fade = k < 0.4 ? 1 : 1 - (k - 0.4) / 0.6;
    c.globalAlpha = fade;
    let x = S / 2;
    for (let y = 0; y < S * 0.8 * bolt; y += px) {
      x += ((Math.sin(y * 1.3) * 3) | 0) * 0.5; // dáng zíc-zắc cố định (không ngẫu nhiên: khung nào cũng cùng dáng)
      c.fillStyle = "#6ab4ff"; c.fillRect(Math.round(x / px) * px - px, S * 0.1 + y, px * 3, px);
      c.fillStyle = "#ffffff"; c.fillRect(Math.round(x / px) * px, S * 0.1 + y, px, px);
    }
    if (k > 0.25) { // vòng sóng dưới chân sét
      const r = (k - 0.25) / 0.75 * (S * 0.42);
      c.strokeStyle = "#8ac8ff"; c.lineWidth = px; c.beginPath(); c.ellipse(S / 2, S * 0.88, r, r * 0.4, 0, 0, Math.PI * 2); c.stroke();
    }
    c.globalAlpha = 1;
  });
}

/** Sheet tụ khí (lấy đà) dựng bằng code: vòng sáng thu nhỏ vào tâm, 6 khung 32×32. */
function tuKhi(scene: Phaser.Scene) {
  makeCodeSheet(scene, "fxs_tu_khi", 6, 32, (c, k, S) => {
    const r = (1 - k) * S * 0.45 + 2;
    c.strokeStyle = "#ffffff"; c.lineWidth = 2; c.globalAlpha = 0.35 + 0.65 * k;
    c.beginPath(); c.ellipse(S / 2, S / 2, r, r * 0.55, 0, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = "#ffffff"; c.fillRect(S / 2 - 1, S / 2 - 1, 2, 2);
  });
}

/** Ngữ cảnh một lần tung chiêu. Tọa độ màn hình. */
export interface CastCtx { x: number; y: number; ang: number; tx: number; ty: number; mine: boolean; tierCol?: number; delayBase?: number; /** bán kính chiêu trên màn hình (px) */ r?: number; /** số lần / nhịp (ms) của chiêu nhiều lần */ n?: number; everyMs?: number; /** độ xòe của loạt đạn (rad; từ 2π là vòng tròn) */ spread?: number }

/** Điều phối T1–T3 trên một `SheetFx`: sheet chính, lấy đà, dư chấn. Trả true nếu sheet thay hiệu ứng G3 (nơi gọi bỏ G3). */
export class SkillVisualPlayer {
  constructor(readonly sheets: SheetFx) {}
  private mk(s: VisualSheet, c: CastCtx, extra: Partial<SheetPlay> = {}): SheetPlay {
    const at = s.at === "cast" ? { x: c.x, y: c.y } : { x: c.tx, y: c.ty };
    return { key: s.key, rows: s.rows, scale: s.scale, fps: s.fps, tint: s.tint, ang: c.ang, light: !c.mine, lift: s.lift, normal: s.normal, rotate: s.rotate, fitW: s.fit && c.r ? 2 * c.r * s.fit : undefined, ...at, ...(s.at === "travel" ? { x: c.x, y: c.y, to: { x: c.tx, y: c.ty } } : {}), ...extra };
  }
  /** Viên thứ `i` / `n` của loạt đạn xòe: lệch hướng theo quạt (hoặc vòng tròn), cùng quãng bay (chiều dọc màn hình ép 1/2 như `tl` ở GameScene). */
  private fan(c: CastCtx, i: number, n: number): CastCtx {
    const sp = c.spread ?? 0, ang = c.ang + (sp >= Math.PI * 2 - 0.01 ? (i / n) * Math.PI * 2 : (i / (n - 1) - 0.5) * sp), L = Math.hypot(c.tx - c.x, (c.ty - c.y) * 2);
    return { ...c, ang, tx: c.x + Math.cos(ang) * L, ty: c.y + Math.sin(ang) * L * 0.5 };
  }
  /** Một lần phát: thân + lớp cộng sáng (không có ở bản nhẹ của người khác và mức Thấp). */
  private play1(s: VisualSheet, c: CastCtx, delay: number): boolean {
    const ok = this.sheets.play(this.mk(s, c, { delay }));
    const ga = GLOW_ALPHA[fxPrefs.level];
    if (ok && s.glow && c.mine && ga > 0 && !fxPrefs.reduce && this.sheets.has(s.glow)) this.sheets.play(this.mk({ ...s, key: s.glow, normal: false }, c, { delay, alpha: ga }));
    return ok;
  }
  /** `vis.sheet` có và đã tải: phát ngay. Người tung còn thấy lớp lấy đà (`windupSheet`) và dư chấn; người khác chỉ thấy bản nhẹ của sheet chính. */
  cast(vis: SkillVisual, c: CastCtx): boolean {
    const s = vis.sheet; if (!s || !this.sheets.has(s.key)) return false;
    const reps = vis.repeat && c.n && c.n > 1 ? Math.min(c.n, c.mine ? REPEAT_MAX[fxPrefs.level] : Math.min(2, REPEAT_MAX[fxPrefs.level])) : 1;
    let ok = false;
    for (let i = 0; i < reps; i++) ok = this.play1(s, s.at === "travel" && reps > 1 && c.spread ? this.fan(c, i, reps) : c, i * (c.everyMs ?? 0)) || ok;
    if (ok && c.mine && !fxPrefs.reduce && fxPrefs.level !== "low") {
      const w = vis.windupSheet;
      if (w && this.sheets.has(w.key)) this.sheets.play(this.mk(w, { ...c, tx: c.x, ty: c.y }));
      if (vis.aftershock && this.sheets.has(vis.aftershock.sheet.key)) this.sheets.play(this.mk(vis.aftershock.sheet, c, { delay: vis.aftershock.delay }));
    }
    return ok && !!vis.replace;
  }
}
