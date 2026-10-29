// Chi tiết cho chú thích vật phẩm (UI v2, kiểm kê UI/UX #885, thiếu #12 / #13): dùng để làm gì, nguồn, giá, nhãn khoá / ràng buộc, và cột "đang mặc" song song
// khi giữ Shift. Hàm thuần, chỉ trình bày: giá lấy từ `sellPrice` / `SHOP` (shared/data.ts), chỉ số từ `compareRows`; không đổi luật, không gửi tin.
import { ITEM_KINDS, SHOP, CAMP_SHOP, formatHonTe, itemDef, sellPrice, type ItemKind } from "../../shared/data.ts";
import { compareRows } from "./bag.ts";
import type { BagItem } from "./net.ts";
import type { TipLine, TipSpec } from "./tooltip.ts";

/** Dùng để làm gì, theo loại (câu ngắn một dòng). */
export const ITEM_USE: Record<ItemKind, string> = {
  dan: "Dùng để hồi sinh lực / hồn lực",
  hon_hoan: "Hấp thụ cho võ hồn để thêm vòng hồn hoàn",
  hon_cot: "Gắn vào ô hồn cốt của võ hồn, mở kỹ năng",
  hon_hach: "Gắn vào ô hồn hạch; đủ bộ có hiệu ứng",
  manh_vo_hon: "Gom đủ mảnh để mở hoặc lên sao võ hồn",
  tien_thao: "Dùng cho một võ hồn để cộng chỉ số vĩnh viễn",
  ruong: "Mở rương để nhận phần thưởng",
  phu: "Dùng để về thành",
  lenh: "Dùng để cộng giờ treo tự săn",
  trang_bi: "Mặc vào ô trang bị hồn sư, dùng chung cả đội",
  nguyen_lieu: "Nguyên liệu cường hóa / hợp thành ở thợ rèn",
  kinh_quyen: "Cộng kinh nghiệm cho một võ hồn",
};
/** Nguồn rơi theo loại (đúng theo tài liệu thiết kế hồn hoàn / hồn cốt / hồn hạch / trang bị); loại không có nguồn cố định thì không ghi. */
export const ITEM_SOURCE: Partial<Record<ItemKind, string>> = {
  hon_hoan: "Rơi khi hạ hồn thú",
  hon_cot: "Rơi khi hạ hồn thú (cùng loài, cùng số năm)",
  hon_hach: "Rơi khi hạ hồn thú (bộ theo bản đồ)",
  trang_bi: "Hồn thú rơi; thú vương / boss qua rương",
  nguyen_lieu: "Hồn thú rơi",
  ruong: "Thú vương / boss thế giới",
};

const f = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const shopPrice = (code: string) => [...SHOP, ...CAMP_SHOP].find((r) => r.code === code)?.price ?? null;

/** Dòng giá: giá thương nhân thu mua một món (null = không thu); kèm giá mua nếu cửa hàng có bán. */
export function priceLines(it: Pick<BagItem, "code" | "years" | "stars" | "enhance">): TipLine[] {
  const out: TipLine[] = [], buy = shopPrice(it.code), sell = sellPrice(it);
  if (buy !== null) out.push({ k: "Mua ở thương nhân", v: formatHonTe(buy), tone: "gem" });
  out.push(sell !== null ? { k: "Bán được", v: formatHonTe(sell), tone: "gem" } : { k: "Bán", v: "Thương nhân không thu mua", tone: "muted" });
  return out;
}

/** Nhãn khoá / ràng buộc: khoá luôn kèm lý do (không bán, bỏ, phân giải được); đang gắn thì nói rõ vì sao không bán. */
export function lockLines(it: Pick<BagItem, "lock" | "vohon">): TipLine[] {
  const out: TipLine[] = [];
  if (it.lock) out.push({ k: "Khoá", v: "Không bán, bỏ hay phân giải được. Mở khoá ở thẻ thao tác.", tone: "bad" });
  if (it.vohon !== null && it.vohon !== undefined) out.push({ k: "Ràng buộc", v: "Đang gắn trên võ hồn, tháo ra mới bán được", tone: "muted" });
  return out;
}

/** Mọi dòng chi tiết thêm của một món (dùng, nguồn, giá, khoá). */
export function itemInfoLines(it: BagItem): TipLine[] {
  const def = itemDef(it.code), kind = def?.kind;
  const out: TipLine[] = [];
  if (kind) out.push({ v: `Dùng: ${ITEM_USE[kind]}`, tone: "muted" });
  if (kind && ITEM_SOURCE[kind]) out.push({ v: `Nguồn: ${ITEM_SOURCE[kind]!}`, tone: "muted" });
  out.push(...priceLines(it), ...lockLines(it));
  return out;
}

/** Chú thích gọn của món đang mặc / gắn, đặt song song khi giữ Shift: tên, nhóm, từng chỉ số (cùng `compareRows` với bảng so sánh), cường hóa. */
export function wornSideSpec(cur: BagItem, name: string, color: string): TipSpec {
  const lines: TipLine[] = (compareRows(cur, null) ?? []).map((r) => ({ k: r.k, v: r.newText ?? `${f(r.neu)}${r.pct ? "%" : ""}`, tone: "good" as const }));
  if (cur.enhance) lines.unshift({ k: "Cường hóa", v: `+${cur.enhance}`, tone: "good" });
  const kind = itemDef(cur.code)?.kind;
  return { title: name, color, border: color, sub: `Đang mặc${kind ? ` · ${ITEM_KINDS[kind].name}` : ""}`, lines };
}

/** Phần Shift của chú thích: dòng so sánh ▲▼ (đã dựng sẵn ở `compareLines`) + cột món đang mặc; không có gì để so thì không có phần Shift. */
export const SHIFT_HINT = "Giữ Shift: so sánh với đang mặc";
export function shiftPart(cmp: TipLine[] | null, cur: BagItem | null, name: string | null, color: string): TipSpec["shift"] | undefined {
  if (!cmp?.length) return undefined;
  return { lines: cmp, hint: SHIFT_HINT, ...(cur && name ? { beside: wornSideSpec(cur, name, color) } : {}) };
}
