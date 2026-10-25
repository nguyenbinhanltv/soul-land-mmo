// Ảnh đồ rơi dưới đất (#693): dùng ảnh item_* của túi / bảng thay viên "shard" vẽ bằng code.
// Nạp lười: lần đầu thấy một ảnh thì tải nền (không chặn khung hình), xong mới thành texture Phaser; trong lúc chờ (hoặc ảnh lỗi /
// chưa có trong manifest) nơi gọi giữ texture vẽ bằng code. Màu theo độ hiếm: cùng cách tô với tintedUrl của giao diện (độ sáng × màu).
import Phaser from "phaser";
import { equipIconChain, type EquipTemplate } from "../../shared/data.ts";
import { artUrl } from "./uiArt.ts";

/** Cỡ ảnh item_* 32×32 so với SPR khi nằm dưới đất (to hơn viên shard 10×12 nhưng không át nhãn). */
export const DROP_ART_SCALE = 0.6;
/** Ảnh xám / ảnh chung của nhóm được tô theo màu: giống danh sách TINTED của uiArt. */
const TINT_KINDS = ["manh_vo_hon", "ruong", "tien_thao"];

/**
 * Ảnh item_* (và màu tô) cho một món rơi, null nếu không có ảnh nào trong manifest (giữ texture vẽ bằng code).
 * Hồn hoàn / hồn cốt tô theo màu `col` đã tính ở nơi gọi (niên hạn); hồn hạch dùng ảnh riêng của bộ; trang bị theo chuỗi mẫu → ô → ảnh chung.
 */
export function dropArtSpec(d: { item?: string }, bone: { id: string } | undefined, core: { id: string } | undefined, eq: EquipTemplate | undefined,
  it: { id: string; kind: string } | undefined, col: string): { key: string; tint?: string } | null {
  if (eq) { const key = equipIconChain(eq.id).find((k) => artUrl(k)); return key ? { key } : null; }
  if (bone) return { key: `item_hon_cot_${bone.id}`, tint: col };
  if (core) return artUrl(`item_hon_hach_${core.id}`) ? { key: `item_hon_hach_${core.id}` } : { key: "item_hon_hach", tint: col }; // màu bộ vẽ sẵn (#696)
  if (!d.item) return { key: "item_hon_hoan", tint: col };
  if (!it) return null;
  const key = [`item_${it.id}`, `item_${it.kind}`].find((k) => artUrl(k));
  return key ? { key, tint: TINT_KINDS.includes(it.kind) ? col : undefined } : null;
}

const pending = new Set<string>(), failed = new Set<string>();

/**
 * Khóa texture Phaser của ảnh `key` (item_*) tô màu `tint` (#rrggbb, bỏ trống = giữ ảnh gốc); null nếu chưa sẵn sàng hoặc không có ảnh.
 * Gọi lại mỗi khung hình cho tới khi có kết quả; gọi nhiều lần không tải trùng.
 */
export function dropTexture(scene: Phaser.Scene, key: string, tint?: string): string | null {
  const id = `drop_${key}${tint ? `_${tint.slice(1)}` : ""}`;
  if (scene.textures.exists(id)) return id;
  if (failed.has(id) || pending.has(id)) return null;
  const url = artUrl(key); if (!url) { failed.add(id); return null; }
  pending.add(id);
  const img = new Image();
  img.onload = () => {
    pending.delete(id);
    if (!scene.textures || scene.textures.exists(id)) return; // cảnh đã đóng
    const cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const ctx = cv.getContext("2d")!; ctx.drawImage(img, 0, 0);
    if (tint) {
      const d = ctx.getImageData(0, 0, cv.width, cv.height), n = parseInt(tint.slice(1), 16);
      const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.min(255, (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) * 1.15);
        d.data[i] = (v * r) / 255; d.data[i + 1] = (v * g) / 255; d.data[i + 2] = (v * b) / 255;
      }
      ctx.putImageData(d, 0, 0);
    }
    scene.textures.addCanvas(id, cv);
  };
  img.onerror = () => { pending.delete(id); failed.add(id); };
  img.src = url;
  return null;
}
