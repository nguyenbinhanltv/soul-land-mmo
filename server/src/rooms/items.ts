// Hàm thuần về vật phẩm / túi / đồ đang mặc (GAME_DESIGN.md mục 5.7, 5.15), tách khỏi MapRoom.ts (#702): sinh ô vật phẩm, chỉ số tổng của đồ
// mặc, lớp nhìn LPC, đếm ô túi, thứ tự xếp túi. Không giữ phòng, không ghi DB; MapRoom chỉ gọi. Nguyên văn từ MapRoom, không đổi hành vi.
import { randomUUID } from "node:crypto";
import { itemDef, ITEMS, ITEM_KINDS, lpcGearCode, parseEquip, equipStats, equipTemplate, type ItemDef } from "../../../shared/data.ts";
import type { Item } from "../db.ts";
import type { PlayerState } from "./schema.ts";

// ---------- Vật phẩm (mục 5.7) ----------
let itemClock = 0;
/** Đẩy đồng hồ `created` lên tới `t` (sắp xếp túi giữ nguyên các mốc cũ nên không được để món mới sinh trùng mốc). */
export const bumpItemClock = (t: number) => { itemClock = Math.max(itemClock, t); };
/**
 * Một ô mới chứa `qty` món `def` (id UUID do server sinh). `created` tăng dần để thứ tự ô giữ nguyên khi nạp lại từ DB.
 * `years`: số năm (hồn hoàn).
 */
export function newItem(def: ItemDef, qty: number, years: number | null = null): Item {
  itemClock = Math.max(Date.now(), itemClock + 1);
  return { id: randomUUID(), kind: def.kind, code: def.id, qty, years, stars: null, enhance: 0, stats: null, vohonId: null, created: itemClock };
}
/** `qty` món mã `code` chia thành các ô đầy theo `stack` (ô cuối có thể chưa đầy). */
export function itemStacks(code: string, qty: number): Item[] {
  const def = itemDef(code); if (!def) return [];
  const out: Item[] = [];
  for (let left = qty; left > 0; left -= def.stack) out.push(newItem(def, Math.min(left, def.stack)));
  return out;
}
/** Số ô túi đang dùng: món đang gắn vào võ hồn không tính. */
export type GearStats = ReturnType<typeof equipStats>;
/** Chỉ số tổng của các món đang mặc (mục 5.15): dữ liệu hỏng / mẫu lạ bị bỏ qua. */
export const gearStats = (gear: Item[]): GearStats => equipStats(gear.flatMap((it) => { const e = parseEquip(it.stats); return e ? [{ ...e, enhance: it.enhance }] : []; }));
/** Bậc áo / mũ đang mặc (+1, 0 = không) → PlayerState.gearAo / gearMu để người khác thấy trên lớp LPC (HL4 #573); không đồng bộ chỉ số. */
export function gearLook(p: PlayerState, gear: Item[]) {
  const tier = (slot: string) => { for (const it of gear) { const t = equipTemplate(parseEquip(it.stats)?.tpl); if (t?.slot === slot) return t.tier; } return null; };
  p.gearAo = lpcGearCode(tier("ao")); p.gearMu = lpcGearCode(tier("mu"));
}
/** Số ô túi đang dùng: món đang gắn vào võ hồn không tính. */
export const bagUsed = (bag: Item[]) => bag.filter((i) => i.vohonId === null).length;
/** Thứ tự xếp túi (#215 "Sắp xếp"): nhóm theo ITEM_KINDS, rồi loại theo ITEMS. */
export const KIND_ORDER = Object.keys(ITEM_KINDS), ITEM_ORDER = new Map(ITEMS.map((x, k) => [x.id, k]));
