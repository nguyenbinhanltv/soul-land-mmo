// Chủ repo xác nhận: chỉ các mã này được dùng một tay ở attack/cast dọc.
const PRIMARY_ONLY_VERTICAL_WEAPONS = new Set([
  "hao_thien_chuy", "ta_hoa_phuong_hoang", "cuu_tinh_that_sat_kiem", "nguyet_nhan",
  "pha_hon_thuong", "quy_mi",
]);

export function weaponPoseGripPolicy({ id, clip, axisDegrees, primaryDistance, secondaryDistance = 0 }) {
  const verticalDeviation = Math.abs(90 - ((axisDegrees % 180 + 180) % 180));
  const primaryOnly = PRIMARY_ONLY_VERTICAL_WEAPONS.has(id) && ["attack", "cast"].includes(clip) && Number.isFinite(axisDegrees) && verticalDeviation <= 15;
  return { primaryOnly, verticalDeviation, blocked: !Number.isFinite(primaryDistance) || primaryDistance > 2 || (!primaryOnly && (!Number.isFinite(secondaryDistance) || secondaryDistance > 20)) };
}

/** Chỉ lấy góc của đúng giới/hướng/clip/khung, không suy từ khung lân cận. */
export const weaponFrameAxis = (poses, sex, dir, clip, frame) => poses?.find((p) => p.name === `${sex}/${dir}/${clip}/${frame}`)?.axisDegrees;
