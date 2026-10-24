// Hợp đồng giao diện Nhân vật + Túi (NV0 của #453, mục 5.16 "Hai cửa sổ Nhân vật + Túi" ở GAME_DESIGN.md): chỉ KIỂU và hàm thuần. Chưa nối vào
// giao diện nào (NV1+ làm); không DOM, không gửi tin, không đọc state toàn cục, nên chạy thẳng bằng Node (client/scripts/charbag-test.mjs).
// Quyết định thật vẫn ở server: `accepts` / `smartTarget` chỉ để tô viền xanh / đỏ và chọn ô, server từ chối thì đồ về chỗ cũ.
import { BONE_ITEM, BONE_SLOTS, CORE_ITEM, CORE_SLOTS, EQUIP_ITEM, coreSlotOf, equipSlotDef, equipSlotIndex, equipTemplate, parseBone, parseEquip } from "../../shared/data.ts";
import type { BagItem, GearItem } from "./net.ts";
import { wornFor } from "./bag.ts";

/** Hai cửa sổ. */
export type PanelId = "char" | "bag";
/** Đang mở cái nào: chỉ túi (B), chỉ nhân vật (C / H), hay cả hai cạnh nhau. */
export type WindowState = "bag" | "char" | "dual";
/** Bốn tab búp bê ở cửa sổ Nhân vật. */
export type DollTab = "equip" | "bone" | "core" | "vohon";

/**
 * Một ô trên búp bê. `slot`: tab `equip` = id ô trong `EQUIP_SLOTS` (chuỗi); `bone` = id ô trong `BONE_SLOTS` (chuỗi); `core` = chỉ số ô
 * 0..CORE_SLOTS−1; `vohon` = chỉ số trong đội 0..TEAM_SIZE−1. `rowId`: võ hồn nhận hồn cốt / hồn hạch; null ở `equip` (thuộc hồn sư) và `vohon`.
 */
export interface SlotRef { tab: DollTab; slot: string | number; rowId: number | null }
/** Kết quả hỏi "ô này nhận món này không": `why` (tiếng Việt, hiện ở chú thích ô đỏ) chỉ có khi `ok` = false. */
export interface AcceptResult { ok: boolean; why?: string }
/** Một ô thả: `el` để tô viền, `accepts` do `acceptsItem` dựng sẵn cho ô này. */
export interface DropTarget { ref: SlotRef; el: HTMLElement; accepts(item: BagItem): AcceptResult }
/** Nguồn nhấc đồ: một ô búp bê (đang mặc / gắn) hoặc ô túi (chỉ số trong danh sách đang hiển thị). */
export type DragFrom = SlotRef | { bagIndex: number };
/** Một lần kéo (chuột hoặc chạm giữ ~150 ms): bóng mờ `ghost` theo con trỏ; thả ngoài mọi `DropTarget` thì trả về `from`. */
export interface DragSession { item: BagItem; from: DragFrom; ghost: HTMLElement }

/** Những gì hàm thuần cần biết: võ hồn đang xem trên búp bê (null = chưa có), túi (món có `vohon` là món đang gắn) và trang bị đang mặc (tin "gear"). */
export interface DollView { rowId: number | null; bag: readonly BagItem[]; gear: readonly GearItem[] }

/** Tin gửi server cho một lần gắn / tháo: tên và nội dung đúng như lệnh có sẵn (`GameScene`: equip, equipcore, equipgear, unequip…). */
export type ServerCommand =
  | { msg: "equip"; data: { itemId: string; vohonId: number; slot: string } }
  | { msg: "equipcore"; data: { itemId: string; vohonId: number; slot: number } }
  | { msg: "equipgear"; data: { id: string } }
  | { msg: "unequip"; data: { itemId: string } }
  | { msg: "unequipcore"; data: { itemId: string } }
  | { msg: "unequipgear"; data: { slot: number } };

/** Món trang bị đang mặc dưới dạng `BagItem` (để dùng chung `accepts`, so sánh, chú thích); `vohon` null vì trang bị thuộc hồn sư. */
export const gearAsBagItem = (g: GearItem): BagItem =>
  ({ id: g.id, kind: "trang_bi", code: g.code, qty: 1, years: null, stars: null, enhance: g.enhance, stats: g.stats, vohon: null, lock: g.lock });

const no = (why: string): AcceptResult => ({ ok: false, why });
const YES: AcceptResult = { ok: true };

/**
 * Ô `ref` có nhận `item` không. Mỗi loại món chỉ vào đúng tab: hồn cốt → đúng vị trí; hồn hạch → mọi ô 0..CORE_SLOTS−1; trang bị →
 * đúng ô của mẫu (vòng / nhẫn trái và phải là hai mẫu riêng nên KHÔNG đổi chéo được). Ô đội (`vohon`) chỉ nhận võ hồn, không nhận đồ.
 */
export function acceptsItem(ref: SlotRef, item: BagItem, view: Pick<DollView, "rowId">): AcceptResult {
  if (ref.tab === "vohon") return no("Ô đội nhận võ hồn, không nhận đồ.");
  const bone = item.code === BONE_ITEM && item.years !== null ? parseBone(item.stats) : null;
  if (ref.tab === "bone") {
    if (!bone) return no("Chỉ hồn cốt mới gắn vào ô này.");
    if (view.rowId === null) return no("Chưa có võ hồn để gắn.");
    if (bone.slot !== ref.slot) return no(`Hồn cốt này chỉ gắn ô ${BONE_SLOTS.find((s) => s.id === bone.slot)?.name ?? "khác"}.`);
    return YES;
  }
  if (ref.tab === "core") {
    if (item.code !== CORE_ITEM) return no("Chỉ hồn hạch mới gắn vào ô này.");
    if (view.rowId === null) return no("Chưa có võ hồn để gắn.");
    if (!Number.isInteger(ref.slot) || (ref.slot as number) < 0 || (ref.slot as number) >= CORE_SLOTS) return no("Ô hồn hạch không tồn tại.");
    return YES;
  }
  // equip
  if (item.code !== EQUIP_ITEM) return no("Chỉ trang bị hồn sư mới mặc vào ô này.");
  const eq = parseEquip(item.stats), tpl = eq && equipTemplate(eq.tpl);
  if (!tpl) return no("Trang bị hỏng, không đọc được mẫu.");
  if (tpl.slot !== ref.slot) return no(`Món này chỉ mặc ở ô ${equipSlotDef(tpl.slot)?.name ?? "khác"}.`);
  return YES;
}

/** Dựng `accepts` cho một ô (gắn vào `DropTarget`): đọc `view` mỗi lần gọi, nên đưa hàm lấy view mới nhất. */
export const acceptsFor = (ref: SlotRef, view: () => Pick<DollView, "rowId">) => (item: BagItem): AcceptResult => acceptsItem(ref, item, view());

/**
 * Bấm đúp = mặc thông minh: ô đúng của món, hoặc null nếu món không mặc được / đã đang mặc (bấm đúp món đang mặc là tháo, việc của
 * NV3) / chưa có võ hồn để gắn hồn cốt, hồn hạch. Hồn cốt: đúng vị trí, món cũ bị thay. Hồn hạch: ô trống thấp nhất, đủ ô thì ô của món
 * yếu nhất (cùng luật `wornFor` của so sánh). Trang bị: ô của mẫu (ô đã có món thì server đổi chỗ, món cũ về túi).
 */
export function smartTarget(item: BagItem, view: DollView): SlotRef | null {
  if (view.gear.some((g) => g.id === item.id)) return null;
  if (item.code === EQUIP_ITEM) {
    const tpl = equipTemplate(parseEquip(item.stats)?.tpl);
    return tpl ? { tab: "equip", slot: tpl.slot, rowId: null } : null;
  }
  if (item.vohon !== null || view.rowId === null) return null;
  const bone = item.code === BONE_ITEM && item.years !== null ? parseBone(item.stats) : null;
  if (bone) return { tab: "bone", slot: bone.slot, rowId: view.rowId };
  if (item.code !== CORE_ITEM) return null;
  const w = wornFor(item, view.bag as BagItem[], view.rowId);
  if (!w) return null;
  if (w.cur) { const s = coreSlotOf(w.cur.stats); return s >= 0 ? { tab: "core", slot: s, rowId: view.rowId } : null; }
  const used = new Set<number>();
  for (const i of view.bag) if (i.vohon === view.rowId && i.code === CORE_ITEM) used.add(coreSlotOf(i.stats));
  for (let s = 0; s < CORE_SLOTS; s++) if (!used.has(s)) return { tab: "core", slot: s, rowId: view.rowId };
  return null;
}

/** Ánh xạ "gắn `item` vào `ref`" sang lệnh server có sẵn (một chỗ duy nhất); `ref` không nhận `item` thì null. */
export function mountCommand(item: BagItem, ref: SlotRef, view: Pick<DollView, "rowId">): ServerCommand | null {
  if (!acceptsItem(ref, item, view).ok) return null;
  if (ref.tab === "bone" && ref.rowId !== null) return { msg: "equip", data: { itemId: item.id, vohonId: ref.rowId, slot: ref.slot as string } };
  if (ref.tab === "core" && ref.rowId !== null) return { msg: "equipcore", data: { itemId: item.id, vohonId: ref.rowId, slot: ref.slot as number } };
  if (ref.tab === "equip") return { msg: "equipgear", data: { id: item.id } };
  return null;
}

/** Lệnh "tháo" món đang ở `from` (kéo ra túi): hồn cốt, hồn hạch theo id món; trang bị theo chỉ số ô. Ô túi / ô đội thì null. */
export function unmountCommand(item: BagItem, from: SlotRef): ServerCommand | null {
  if (from.tab === "bone") return { msg: "unequip", data: { itemId: item.id } };
  if (from.tab === "core") return { msg: "unequipcore", data: { itemId: item.id } };
  if (from.tab === "equip") { const i = equipSlotIndex(from.slot); return i >= 0 ? { msg: "unequipgear", data: { slot: i } } : null; }
  return null;
}

/** Hai ô cùng một chỗ (so sánh cả `rowId`): dùng khi thả lại đúng ô cũ thì không gửi gì. */
export const sameSlot = (a: SlotRef, b: SlotRef) => a.tab === b.tab && a.slot === b.slot && a.rowId === b.rowId;
