// #1802 P2: phát sheet hiệu ứng pixelfx (`fx_pfx_*`, nhập bằng tools/assets/pixelfx-import.mjs) qua SheetFx. Chỉ hiển thị, không đổi luật hay số cân bằng.
// Meta (fps, ô, chân) lấy từ sprites/pixelfx.json. Thiếu meta / texture / quá SHEET_CAP thì không phát (nơi gọi không mất gì). Giảm chuyển động và
// bản `light` do SheetFx xử lý (một khung giữa mờ vào ra; nhỏ và mờ hơn).
import type { SheetFx, SheetPlay } from "./fxSheet.ts";
import { SPR } from "./iso.ts";
import { fetchAsset } from "./assetUrl.ts";

export interface PfxMeta { fps: number; frame: [number, number]; pivot: [number, number]; loop?: boolean }
let metas: Record<string, PfxMeta> = {};
let started: Promise<void> | null = null;
/** Tải meta một lần (không chặn vào game; lỗi thì im lặng, không có hiệu ứng pixelfx). */
export function loadPixelfx(): Promise<void> {
  started ??= fetchAsset("sprites/pixelfx.json").then((r) => (r.ok ? r.json() : {})).then((j) => { metas = j as Record<string, PfxMeta>; }).catch(() => {});
  return started;
}
export const setPixelfxMeta = (m: Record<string, PfxMeta>) => { metas = m; started = Promise.resolve(); }; // kiểm thử

/** Cách vẽ từng khóa: `normal` = vẽ thường (khói giữ màu tối), mặc định cộng sáng (ánh sáng). */
export const PFX_STYLE: Record<string, { normal?: boolean; alpha?: number }> = {
  fx_pfx_poof: { normal: true },
  fx_pfx_soul_rise_light: { alpha: 0.9 },
  fx_pfx_respawn_beam_light: { alpha: 0.9 },
  fx_pfx_collect_burst: { normal: true },
  fx_pfx_power_star_light: { alpha: 0.9 },
};

/** Kế hoạch phát (hàm thuần): chân hiệu ứng đặt đúng (x, y); SheetFx vẽ ảnh theo tâm ô nên bù độ cao từ chân tới tâm. */
export function pfxPlan(key: string, o: { x: number; y: number; light?: boolean; delay?: number }): SheetPlay | null {
  const m = metas[key]; if (!m) return null;
  const st = PFX_STYLE[key] ?? {};
  return { key, x: o.x, y: o.y, scale: SPR, fps: m.fps, normal: st.normal, alpha: st.alpha, light: o.light, delay: o.delay, lift: (m.pivot[1] - m.frame[1] / 2) * SPR };
}

/** Phát một hiệu ứng pixelfx; false khi chưa có meta / texture hoặc quá trần. */
export function playPfx(sheets: SheetFx, key: string, o: { x: number; y: number; light?: boolean; delay?: number }): boolean {
  const p = pfxPlan(key, o);
  return !!p && sheets.has(key) && sheets.play(p);
}

/** Nhặt đồ: `rare` = độ hiếm cao nhất vừa nhận (lootToasts: -1 chưa biết / không có). Đồ hiếm (≥ RARE_LOOT_MIN) dùng sao sáng, đồ thường dùng chùm sáng nhỏ; mức Thấp chỉ đồ hiếm. */
export function lootKey(rare: number, rareMin: number, level: "low" | "mid" | "high"): string | null {
  if (rare < 0) return null;
  if (rare >= rareMin) return "fx_pfx_power_star_light";
  return level === "low" ? null : "fx_pfx_collect_burst";
}

/**
 * Hồn thú bị hạ (`rank` BeastState: 0 thường, 1 tinh anh, 2 thú vương, 3 boss): tinh anh nổ khói (poof), thú vương / boss thêm hồn bay lên (soul_rise).
 * Hồn thú thường giữ hiệu ứng bụi cũ (đông, nhỏ: sheet đầu tiên vẫn lớn hơn thân chúng). Mức Thấp chỉ thú vương / boss.
 */
export function deathKeys(rank: number, level: "low" | "mid" | "high"): string[] {
  if (rank >= 2) return level === "low" ? ["fx_pfx_soul_rise_light"] : ["fx_pfx_poof", "fx_pfx_soul_rise_light"];
  return rank >= 1 && level !== "low" ? ["fx_pfx_poof"] : [];
}
/** Trứng nở (hồn thú xuất hiện): khói nhẹ ở mức Vừa trở lên. */
export const hatchKey = (level: "low" | "mid" | "high"): string | null => (level === "low" ? null : "fx_pfx_poof");
