// #1815 lô B nhóm 3: hiệu ứng pixelfx cho trạng thái (burn, freeze, ...) bám thân hồn sư / hồn thú. Phần thuần (không Phaser) để kiểm thử;
// lớp vẽ ở statusPfxLayer.ts. Chỉ hiển thị, không đổi state, luật hay số cân bằng (docs/design/trang-thai-buff.md).
import type { StatusId } from "../../shared/data.ts";

/** Trạng thái → sheet pixelfx (`fx_pfx_*`, nhập bằng tools/assets/pixelfx/lo-b3.json). Trạng thái không có mục thì giữ hình cũ (biểu tượng, vẽ bằng code). */
export const STATUS_PFX: Readonly<Partial<Record<StatusId, string>>> = {
  freeze: "fx_pfx_st_frozen", stun: "fx_pfx_st_stunned", charm: "fx_pfx_st_charmed", burn: "fx_pfx_st_burning",
  poison: "fx_pfx_st_poisoned", vuln: "fx_pfx_st_cursed_dark",
};
/** Thứ tự ưu tiên khi một thân dính nhiều trạng thái (khống chế trước, rồi sát thương theo thời gian, rồi giảm / yếu đi). */
export const STATUS_PFX_ORDER: readonly StatusId[] = ["freeze", "stun", "charm", "burn", "poison", "vuln"];
/** Trần số sprite trạng thái cùng lúc theo mức (Thấp: không có lớp này, giữ biểu tượng cũ). */
export const STATUS_PFX_CAP: Record<"low" | "mid" | "high", number> = { low: 0, mid: 5, high: 10 };
/** Mỗi thân hiện tối đa ngần này sheet (còn lại chỉ có biểu tượng cũ). */
export const STATUS_PFX_PER_BODY = 2;

/** `?stpfx=0`: tắt lớp này (quay ảnh trước / sau trong game thật). */
const STPFX_OFF = typeof location !== "undefined" && /[?&]stpfx=0/.test(location.search);

/** Các khóa sheet cho một thân đang có trạng thái `has`; mức Thấp trả rỗng. */
export function statusPfxKeys(has: (s: StatusId) => boolean, level: "low" | "mid" | "high"): string[] {
  if (STPFX_OFF || STATUS_PFX_CAP[level] <= 0) return [];
  const out: string[] = [];
  for (const s of STATUS_PFX_ORDER) { const k = STATUS_PFX[s]; if (k && has(s)) { out.push(k); if (out.length >= STATUS_PFX_PER_BODY) break; } }
  return out;
}
