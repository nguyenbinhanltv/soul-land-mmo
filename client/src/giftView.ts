// Quà chỉ để đọc: tái dùng ảnh Túi, tên / số lượng luôn có bằng chữ.
import { itemDef } from "../../shared/data.ts";
import { artUrl, tintedUrl } from "./uiArt.ts";
import { abbrevNumber, type PNode } from "./uiParts.ts";

export interface GiftView { honTe?: number; shards?: number; items?: { code: string; qty: number }[] }
/** Cùng thứ tự dự phòng của Túi: mảnh riêng → mảnh chung; mã vật phẩm → nhóm. */
export function giftItemUrl(code: string): string | null {
  const def = itemDef(code); if (!def) return null;
  if (def.kind === "manh_vo_hon" && def.vohon) return artUrl(`item_manh_${def.vohon}`) ?? tintedUrl("item_manh_vo_hon", def.col);
  if (def.kind === "ruong" || def.kind === "tien_thao") return tintedUrl(`item_${def.kind}`, def.col);
  return artUrl(`item_${code}`) ?? artUrl(`item_${def.kind}`);
}
/** Mảnh thưởng chưa có mã cụ thể vẫn chỉ ghi chữ, không đoán võ hồn server sẽ trao. */
export function giftNode(gift: GiftView): PNode {
  const row = (text: string, src: string | null = null): PNode => ({ tag: "span", cls: "gift-entry", kids: [
    ...(src ? [{ tag: "img", cls: "gift-icon", attrs: { src, alt: "", draggable: "false", "aria-hidden": "true" } }] : []),
    { tag: "span", cls: "gift-label", text },
  ] });
  return { tag: "span", cls: "gift-list", kids: [
    ...(gift.honTe ? [row(`${abbrevNumber(gift.honTe)} Hồn Tệ`)] : []),
    ...(gift.shards ? [row(`Mảnh võ hồn ×${gift.shards}`)] : []),
    ...(gift.items ?? []).map((x) => row(`${itemDef(x.code)?.name ?? x.code} ×${x.qty}`, giftItemUrl(x.code))),
  ] };
}
/** Gắn trên khung mới mỗi lần dựng; lỗi ảnh không làm mất nhãn và không để biểu tượng ảnh vỡ. */
export function bindGiftImages(root: HTMLElement) {
  for (const img of root.querySelectorAll<HTMLImageElement>(".gift-icon")) {
    img.addEventListener("error", () => { img.hidden = true; }, { once: true });
    if (img.complete && !img.naturalWidth) img.hidden = true;
  }
}
