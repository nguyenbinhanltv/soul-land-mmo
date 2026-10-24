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
const UM = 0xb06bff, NC = 0xffc2e2, KM = 0xffd54a, YH = 0xff9ad5, LH = 0xff7a3a, BH = 0xf2f2f6;

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

  // S3 lô B (#567): 6 thú võ hồn, cùng công thức S2 (tools/assets/skill-vfx/lo-b.json).
  // --- U Minh Linh Miêu (hệ Ám, cộng sáng) ---
  "u_minh_linh_mieu:0": { tier: 1, heavy: 0, replace: true, sheet: sk("um_slash1", { at: "target", scale: 2, fps: 16 }) },
  "u_minh_linh_mieu:1": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("um_hit2", { at: "target", scale: 2, fps: 12, lift: -4 * SPR }) },
  "u_minh_linh_mieu:2": { tier: 1, heavy: 0, replace: true, sheet: sk("um_aura3", { at: "cast", scale: 2, fps: 10, lift: -6 * SPR }) },
  "u_minh_linh_mieu:3": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("um_hit4", { at: "target", scale: 2, fps: 14, lift: -4 * SPR }) },
  "u_minh_linh_mieu:4": { tier: 2, heavy: 1, ...wind(UM), replace: true, sheet: sk("um_slash5", { at: "target", fit: 0.9, fps: 12 }) },
  "u_minh_linh_mieu:5": { tier: 2, heavy: 1, repeat: true, ...wind(UM), replace: true, sheet: sk("um_hit6", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "u_minh_linh_mieu:7": { tier: 2, heavy: 1, repeat: true, ...wind(UM), replace: true, sheet: sk("um_zone8", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "u_minh_linh_mieu:8": { tier: 2, heavy: 1, repeat: true, ...wind(UM), replace: true, sheet: sk("um_hit9", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "u_minh_linh_mieu:9": { tier: 3, heavy: 2, ...wind(UM, true), replace: true, sheet: sk("um_t3a", { at: "target", scale: 2, fps: 9, lift: GROUND }) },
  "u_minh_linh_mieu:ct": { tier: 3, heavy: 2, ...wind(UM, true), replace: true, sheet: sk("um_t3b", { at: "target", scale: 2, fps: 9, lift: GROUND }) },
  "u_minh_linh_mieu:tc": { tier: 2, heavy: 1, repeat: true, ...wind(UM), replace: true, sheet: sk("um_hit_tc", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  // --- Nhu Cốt Thố (hệ Phong, mềm, quật +1 nặng) ---
  "nhu_cot_tho:0": { tier: 1, heavy: 0, replace: true, sheet: sk("nc_hit1", { at: "target", scale: 2, fps: 12, lift: -4 * SPR }) },
  "nhu_cot_tho:1": { tier: 1, heavy: 0, replace: true, sheet: sk("nc_slash2", { at: "target", scale: 2, fps: 14 }) },
  "nhu_cot_tho:2": { tier: 1, heavy: 0, replace: true, sheet: sk("nc_aura3", { at: "cast", scale: 2, fps: 10, lift: -6 * SPR }) },
  "nhu_cot_tho:3": { tier: 1, heavy: 1, repeat: true, replace: true, sheet: sk("nc_hit4", { at: "target", scale: 2, fps: 12, lift: -4 * SPR }) },
  "nhu_cot_tho:4": { tier: 2, heavy: 1, ...wind(NC), replace: true, sheet: sk("nc_slash5", { at: "target", fit: 0.9, fps: 12 }) },
  "nhu_cot_tho:5": { tier: 2, heavy: 1, ...wind(NC), replace: true, sheet: sk("nc_slash6", { at: "target", fit: 0.9, fps: 12 }) },
  "nhu_cot_tho:7": { tier: 2, heavy: 2, repeat: true, ...wind(NC), replace: true, sheet: sk("nc_hit8", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "nhu_cot_tho:8": { tier: 2, heavy: 1, replace: true, sheet: sk("nc_aura9", { at: "cast", scale: 2, fps: 10, lift: -6 * SPR }) },
  "nhu_cot_tho:9": { tier: 3, heavy: 3, ...wind(NC, true), replace: true, sheet: sk("nc_t3a", { at: "target", scale: 2, fps: 9, lift: GROUND }) },
  "nhu_cot_tho:ct": { tier: 3, heavy: 3, ...wind(NC, true), replace: true, sheet: sk("nc_t3b", { at: "target", scale: 2, fps: 9, lift: GROUND }) },
  "nhu_cot_tho:tc": { tier: 2, heavy: 2, repeat: true, ...wind(NC), replace: true, sheet: sk("nc_hit_tc", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  // --- Kim Vũ Miêu Ưng (hệ Lôi, nhanh) ---
  "kim_vu_mieu_ung:0": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("km_hit1", { at: "target", scale: 2, fps: 14, lift: -4 * SPR }) },
  "kim_vu_mieu_ung:1": { tier: 1, heavy: 0, replace: true, sheet: sk("km_hit2", { at: "target", scale: 2, fps: 14, lift: -4 * SPR }) },
  "kim_vu_mieu_ung:2": { tier: 1, heavy: 0, replace: true, sheet: sk("km_slash3", { at: "target", scale: 2, fps: 16 }) },
  "kim_vu_mieu_ung:3": { tier: 1, heavy: 0, replace: true, sheet: sk("km_zone4", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "kim_vu_mieu_ung:4": { tier: 2, heavy: 1, repeat: true, ...wind(KM), replace: true, sheet: sk("km_hit5", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "kim_vu_mieu_ung:5": { tier: 2, heavy: 1, ...wind(KM), replace: true, sheet: sk("km_slash6", { at: "target", fit: 0.9, fps: 12 }) },
  "kim_vu_mieu_ung:7": { tier: 2, heavy: 1, repeat: true, ...wind(KM), replace: true, sheet: sk("km_hit8", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "kim_vu_mieu_ung:8": { tier: 2, heavy: 1, ...wind(KM), replace: true, sheet: sk("km_burst9", { at: "cast", scale: 2, fps: 12, lift: -6 * SPR }) },
  "kim_vu_mieu_ung:9": { tier: 3, heavy: 2, repeat: true, ...wind(KM, true), replace: true, sheet: sk("km_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "kim_vu_mieu_ung:ct": { tier: 3, heavy: 2, ...wind(KM, true), replace: true, sheet: sk("km_t3b", { at: "cast", scale: 2, fps: 9, lift: -6 * SPR }) },
  "kim_vu_mieu_ung:tc": { tier: 2, heavy: 1, ...wind(KM), replace: true, sheet: sk("km_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  // --- Yêu Hồ (hệ Lôi, mị hoặc) ---
  "yeu_ho:0": { tier: 1, heavy: 0, replace: true, sheet: sk("yh_slash1", { at: "target", scale: 2, fps: 14 }) },
  "yeu_ho:1": { tier: 1, heavy: 0, replace: true, sheet: sk("yh_zone2", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "yeu_ho:2": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("yh_zone3", { at: "cast", fit: 1, lift: GROUND, fps: 10 }) },
  "yeu_ho:3": { tier: 1, heavy: 0, replace: true, sheet: sk("yh_zone4", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "yeu_ho:4": { tier: 2, heavy: 1, ...wind(YH), replace: true, sheet: sk("yh_slash5", { at: "target", fit: 0.9, fps: 12 }) },
  "yeu_ho:5": { tier: 2, heavy: 1, ...wind(YH), replace: true, sheet: sk("yh_zone6", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "yeu_ho:7": { tier: 2, heavy: 1, repeat: true, ...wind(YH), replace: true, sheet: sk("yh_zone8", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "yeu_ho:8": { tier: 2, heavy: 1, ...wind(YH), replace: true, sheet: sk("yh_hit9", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "yeu_ho:9": { tier: 3, heavy: 2, ...wind(YH, true), replace: true, sheet: sk("yh_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "yeu_ho:ct": { tier: 3, heavy: 2, ...wind(YH, true), replace: true, sheet: sk("yh_t3b", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "yeu_ho:tc": { tier: 2, heavy: 1, ...wind(YH), replace: true, sheet: sk("yh_zone_tc", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  // --- Liệt Hỏa Thương Lang (hệ Hỏa) ---
  "liet_hoa_thuong_lang:0": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("lh_hit1", { at: "target", scale: 2, fps: 14, lift: -4 * SPR }) },
  "liet_hoa_thuong_lang:1": { tier: 1, heavy: 0, replace: true, sheet: sk("lh_slash2", { at: "target", scale: 2, fps: 14 }) },
  "liet_hoa_thuong_lang:2": { tier: 1, heavy: 0, replace: true, sheet: sk("lh_zone3", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "liet_hoa_thuong_lang:3": { tier: 1, heavy: 0, repeat: true, replace: true, sheet: sk("lh_hit4", { at: "target", scale: 2, fps: 14, lift: -4 * SPR }) },
  "liet_hoa_thuong_lang:4": { tier: 2, heavy: 1, ...wind(LH), replace: true, sheet: sk("lh_slash5", { at: "target", fit: 0.9, fps: 12 }) },
  "liet_hoa_thuong_lang:5": { tier: 2, heavy: 1, ...wind(LH), replace: true, sheet: sk("lh_slash6", { at: "target", fit: 0.9, fps: 12 }) },
  "liet_hoa_thuong_lang:7": { tier: 2, heavy: 1, ...wind(LH), replace: true, sheet: sk("lh_burst8", { at: "cast", scale: 2, fps: 12, lift: -6 * SPR }) },
  "liet_hoa_thuong_lang:8": { tier: 2, heavy: 1, repeat: true, ...wind(LH), replace: true, sheet: sk("lh_hit9", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  "liet_hoa_thuong_lang:9": { tier: 3, heavy: 2, ...wind(LH, true), replace: true, sheet: sk("lh_t3a", { at: "target", scale: 2, fps: 9, lift: GROUND }) },
  "liet_hoa_thuong_lang:ct": { tier: 3, heavy: 2, ...wind(LH, true), replace: true, sheet: sk("lh_t3b", { at: "target", scale: 2, fps: 9, lift: GROUND }) },
  "liet_hoa_thuong_lang:tc": { tier: 2, heavy: 1, repeat: true, ...wind(LH), replace: true, sheet: sk("lh_hit_tc", { at: "target", scale: 2, fps: 12, lift: -6 * SPR }) },
  // --- Bạch Hổ (hệ Phong, đòn trúng +1 nặng) ---
  "bach_ho:0": { tier: 1, heavy: 1, replace: true, sheet: sk("bh_zone1", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "bach_ho:1": { tier: 1, heavy: 1, replace: true, sheet: sk("bh_slash2", { at: "target", scale: 2, fps: 14 }) },
  "bach_ho:2": { tier: 1, heavy: 0, replace: true, sheet: sk("bh_aura3", { at: "cast", scale: 2, fps: 10, lift: -6 * SPR }) },
  "bach_ho:3": { tier: 1, heavy: 1, repeat: true, replace: true, sheet: sk("bh_hit4", { at: "target", scale: 2, fps: 12, lift: -4 * SPR }) },
  "bach_ho:4": { tier: 2, heavy: 2, ...wind(BH), replace: true, sheet: sk("bh_slash5", { at: "target", fit: 0.9, fps: 12 }) },
  "bach_ho:5": { tier: 2, heavy: 1, replace: true, sheet: sk("bh_aura6", { at: "cast", scale: 2, fps: 10, lift: -6 * SPR }) },
  "bach_ho:7": { tier: 2, heavy: 1, ...wind(BH), replace: true, sheet: sk("bh_burst8", { at: "cast", scale: 2, fps: 12, lift: -6 * SPR }) },
  "bach_ho:8": { tier: 2, heavy: 2, ...wind(BH), replace: true, sheet: sk("bh_zone9", { at: "cast", fit: 1, lift: GROUND, fps: 12 }) },
  "bach_ho:9": { tier: 3, heavy: 3, ...wind(BH, true), replace: true, sheet: sk("bh_t3a", { at: "cast", fit: 1, lift: GROUND, fps: 9 }) },
  "bach_ho:ct": { tier: 3, heavy: 3, ...wind(BH, true), replace: true, sheet: sk("bh_t3b", { at: "target", scale: 2, fps: 9, lift: GROUND }) },
  "bach_ho:tc": { tier: 2, heavy: 2, ...wind(BH), replace: true, sheet: sk("bh_slash_tc", { at: "target", fit: 0.9, fps: 12 }) },
};

/** Sheet Võ Hồn Dung Hợp Kỹ (S3 lô B #567), khóa theo tên chiêu ở `FUSIONS`: phát ở điểm giữa hai người, bề ngang theo bán kính chiêu, thay đóa kính lưu ly của `fusionFx` (luồng sáng hai người nhập vào vẫn có). Chưa có ảnh thì `fusionFx` giữ hình cũ. */
export const FUSION_VISUAL: Readonly<Record<string, { sheet: VisualSheet }>> = {
  "Hạo Thiên Nhu Cốt": { sheet: sk("hn_t3", { at: "cast", fit: 1, fps: 9 }) },
  "U Minh Bạch Hổ": { sheet: sk("ub_t3", { at: "cast", fit: 1, fps: 9 }) },
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
export interface CastCtx { x: number; y: number; ang: number; tx: number; ty: number; mine: boolean; tierCol?: number; delayBase?: number; /** bán kính chiêu trên màn hình (px) */ r?: number; /** số lần / nhịp (ms) của chiêu nhiều lần */ n?: number; everyMs?: number }

/** Điều phối T1–T3 trên một `SheetFx`: sheet chính, lấy đà, dư chấn. Trả true nếu sheet thay hiệu ứng G3 (nơi gọi bỏ G3). */
export class SkillVisualPlayer {
  constructor(readonly sheets: SheetFx) {}
  private mk(s: VisualSheet, c: CastCtx, extra: Partial<SheetPlay> = {}): SheetPlay {
    const at = s.at === "cast" ? { x: c.x, y: c.y } : { x: c.tx, y: c.ty };
    return { key: s.key, rows: s.rows, scale: s.scale, fps: s.fps, tint: s.tint, ang: c.ang, light: !c.mine, lift: s.lift, normal: s.normal, fitW: s.fit && c.r ? 2 * c.r * s.fit : undefined, ...at, ...(s.at === "travel" ? { x: c.x, y: c.y, to: { x: c.tx, y: c.ty } } : {}), ...extra };
  }
  /** Một lần phát: thân + lớp cộng sáng (không có ở bản nhẹ của người khác và mức Thấp). */
  private play1(s: VisualSheet, c: CastCtx, delay: number): boolean {
    const ok = this.sheets.play(this.mk(s, c, { delay }));
    const ga = GLOW_ALPHA[fxPrefs.level];
    if (ok && s.glow && c.mine && ga > 0 && !fxPrefs.reduce && this.sheets.has(s.glow)) this.sheets.play(this.mk({ ...s, key: s.glow, normal: false }, c, { delay, alpha: ga }));
    return ok;
  }
  /** Dung hợp: phát sheet của chiêu `name` ở điểm giữa (tọa độ màn hình, mặt đất); `r` bán kính chiêu trên màn hình. Trả true nếu đã phát (nơi gọi bỏ hình cũ). */
  fusion(name: string, c: { x: number; y: number; r: number; mine: boolean }): boolean {
    const s = FUSION_VISUAL[name]?.sheet; if (!s || !this.sheets.has(s.key)) return false;
    return this.play1(s, { x: c.x, y: c.y, ang: 0, tx: c.x, ty: c.y, mine: c.mine, r: c.r }, 0);
  }
  /** `vis.sheet` có và đã tải: phát ngay. Người tung còn thấy lớp lấy đà (`windupSheet`) và dư chấn; người khác chỉ thấy bản nhẹ của sheet chính. */
  cast(vis: SkillVisual, c: CastCtx): boolean {
    const s = vis.sheet; if (!s || !this.sheets.has(s.key)) return false;
    const reps = vis.repeat && c.n && c.n > 1 ? Math.min(c.n, c.mine ? REPEAT_MAX[fxPrefs.level] : Math.min(2, REPEAT_MAX[fxPrefs.level])) : 1;
    let ok = false;
    for (let i = 0; i < reps; i++) ok = this.play1(s, c, i * (c.everyMs ?? 0)) || ok;
    if (ok && c.mine && !fxPrefs.reduce && fxPrefs.level !== "low") {
      const w = vis.windupSheet;
      if (w && this.sheets.has(w.key)) this.sheets.play(this.mk(w, { ...c, tx: c.x, ty: c.y }));
      if (vis.aftershock && this.sheets.has(vis.aftershock.sheet.key)) this.sheets.play(this.mk(vis.aftershock.sheet, c, { delay: vis.aftershock.delay }));
    }
    return ok && !!vis.replace;
  }
}
