// Túi đồ dạng lưới (UI-1, #351): phần logic thuần phía client (nhóm lọc, sắp xếp, thứ tự tự xếp, so sánh trang bị). Chỉ hiển thị:
// thao tác thật (gắn, bán, dùng…) vẫn là lệnh gửi server như nút cũ; số liệu chỉ số lấy từ shared/data.ts.
import type { BagItem } from "./net.ts";
import { type CoreStat, type ItemKind, BONE_ITEM, CORE_ITEM, RING_ITEM, CORE_SLOTS, CORE_STAT_IDS, CORE_STATS, ITEM_KINDS, boneStats, coreMainValue, itemDef,
  parseBone, parseBoneSubs, parseCore, tierOfYears } from "../../shared/data.ts";
import type { TipLine } from "./tooltip.ts";

/** Nhóm lọc ở đầu túi: `kinds` = nhóm vật phẩm (ITEM_KINDS) thuộc nhóm (null = tất cả). "Trang bị" gộp hồn cốt và hồn hạch. */
export const BAG_GROUPS: { id: string; name: string; kinds: ItemKind[] | null }[] = [
  { id: "all", name: "Tất cả", kinds: null },
  { id: "trang_bi", name: "Trang bị", kinds: ["hon_cot", "hon_hach"] },
  { id: "hon_hoan", name: "Hồn hoàn", kinds: ["hon_hoan"] },
  { id: "hon_cot", name: "Hồn cốt", kinds: ["hon_cot"] },
  { id: "hon_hach", name: "Hồn hạch", kinds: ["hon_hach"] },
  { id: "vat_lieu", name: "Vật liệu", kinds: ["manh_vo_hon", "tien_thao"] },
  { id: "tieu_hao", name: "Tiêu hao", kinds: ["dan", "phu", "lenh", "ruong"] },
];
/** Cách xếp thứ tự hiển thị (chỉ phía client; nút "Sắp xếp" gộp / xếp thật vẫn do server làm). `tay` = thứ tự server + chỗ tự kéo. */
export const BAG_SORTS: { id: BagSort; name: string }[] = [
  { id: "tay", name: "Mặc định" }, { id: "loai", name: "Theo loại" }, { id: "hiem", name: "Độ hiếm" }, { id: "moi", name: "Mới nhận" },
];
export type BagSort = "tay" | "loai" | "hiem" | "moi";

export const kindOf = (it: Pick<BagItem, "code">): ItemKind | undefined => itemDef(it.code)?.kind;
export const inGroup = (it: BagItem, group: string) => {
  const g = BAG_GROUPS.find((x) => x.id === group);
  if (!g?.kinds) return true;
  const k = kindOf(it);
  return !!k && g.kinds.includes(k);
};

/** Độ hiếm 0..4 theo bậc niên hạn (hồn hoàn, hồn cốt) hoặc theo sao (hồn hạch: 1★ → 0 … 5★+ → 4); −1 = không có bậc (đan, phù, rương…). */
export function rarityOf(it: BagItem): number {
  if ((it.code === BONE_ITEM || it.code === RING_ITEM) && it.years !== null) return tierOfYears(it.years);
  if (it.code === CORE_ITEM) return Math.max(0, Math.min(4, (it.stars ?? 1) - 1));
  return -1;
}

// ---------- Mới nhận ----------
/** Thứ tự thấy lần đầu của từng ô (lần túi đầu tiên theo thứ tự server); ô xuất hiện sau đó có dấu "mới" tới khi được xem. */
const seq = new Map<string, number>(), fresh = new Set<string>();
let counter = 0;
export function noteSeen(items: BagItem[]) {
  const first = seq.size === 0;
  for (const it of items) if (!seq.has(it.id)) { seq.set(it.id, ++counter); if (!first) fresh.add(it.id); }
  for (const id of [...seq.keys()]) if (!items.some((i) => i.id === id)) { seq.delete(id); fresh.delete(id); }
}
export const isNew = (id: string) => fresh.has(id);
export const markSeen = (id: string) => { fresh.delete(id); };

// ---------- Thứ tự tự xếp (kéo thả; lưu ở trình duyệt, không gửi server) ----------
const ORDER_KEY = "soul-bag-order";
let order: string[] = (() => { try { const a = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "[]"); return Array.isArray(a) ? a.filter((x) => typeof x === "string") : []; } catch { return []; } })();
export const hasOrder = () => order.length > 0;
function saveOrder() { try { localStorage.setItem(ORDER_KEY, JSON.stringify(order.slice(0, 1000))); } catch { /* hết chỗ lưu: bỏ qua */ } }
export function clearOrder() { order = []; saveOrder(); }

/** Xếp `items` theo cách `mode`: `tay` theo thứ tự tự kéo (ô chưa có chỗ giữ thứ tự server, nối sau); ổn định, không đổi mảng gốc. */
export function sortView(items: BagItem[], mode: BagSort): BagItem[] {
  const idx = new Map(items.map((it, i) => [it.id, i]));
  const by = (cmp: (a: BagItem, b: BagItem) => number) => [...items].sort((a, b) => cmp(a, b) || idx.get(a.id)! - idx.get(b.id)!);
  if (mode === "moi") return by((a, b) => (seq.get(b.id) ?? 0) - (seq.get(a.id) ?? 0));
  if (mode === "hiem") return by((a, b) => rarityOf(b) - rarityOf(a) || (b.years ?? 0) - (a.years ?? 0) || (b.stars ?? 0) - (a.stars ?? 0) || b.enhance - a.enhance);
  if (mode === "loai") {
    const kinds = Object.keys(ITEM_KINDS);
    return by((a, b) => kinds.indexOf(kindOf(a) ?? "") - kinds.indexOf(kindOf(b) ?? "") || a.code.localeCompare(b.code) || (b.years ?? 0) - (a.years ?? 0)
      || (b.stars ?? 0) - (a.stars ?? 0) || b.enhance - a.enhance);
  }
  if (!order.length) return [...items];
  const pos = new Map(order.map((id, i) => [id, i]));
  return by((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9));
}

/** Kéo món `id` tới vị trí `to` của danh sách đang hiển thị `view` (cả túi, chưa lọc): thứ tự mới được nhớ ở trình duyệt. */
export function moveItem(view: BagItem[], id: string, to: number) {
  const ids = view.map((i) => i.id), from = ids.indexOf(id);
  if (from < 0) return;
  ids.splice(from, 1); ids.splice(Math.max(0, Math.min(ids.length, to)), 0, id);
  order = ids; saveOrder();
}

// ---------- So sánh trang bị ----------
type Stats = Partial<Record<CoreStat, number>>;
const add = (o: Stats, k: CoreStat, v: number) => { o[k] = (o[k] ?? 0) + v; };
/** Chỉ số cộng của một hồn cốt / hồn hạch (chính + dòng phụ, cả cường hóa / nâng cấp); món khác null. */
export function statsOf(it: BagItem): Stats | null {
  const o: Stats = {};
  const bone = it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
  if (bone) {
    for (const [k, v] of Object.entries(boneStats(bone.slot, it.years!, it.enhance))) add(o, k as CoreStat, v as number);
    for (const [k, v] of parseBoneSubs(it.stats)) add(o, k, v);
    return o;
  }
  const core = it.code === CORE_ITEM ? parseCore(it.stats) : null;
  if (core) {
    add(o, core.main, coreMainValue(core.main, it.stars ?? 1, it.enhance));
    for (const [k, v] of core.subs) add(o, k, v);
    return o;
  }
  return null;
}

const fmt = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const statName = (k: CoreStat) => CORE_STATS[k].name + (k.endsWith("_pct") ? " %" : "");

/**
 * Món đang gắn cùng chỗ trên võ hồn ra trận `active` (rowId) mà `it` sẽ thay: hồn cốt cùng vị trí; hồn hạch: còn ô trống thì không thay ai
 * (`cur` null), đủ ô thì món yếu nhất (ít sao, ít nâng cấp). Món không gắn được / chưa có võ hồn ra trận: null.
 */
export function wornFor(it: BagItem, items: BagItem[], active: number | null): { cur: BagItem | null; full: boolean } | null {
  if (active === null) return null;
  const mine = items.filter((i) => i.vohon === active);
  const bone = it.code === BONE_ITEM ? parseBone(it.stats) : null;
  if (bone) return { cur: mine.find((i) => i.code === BONE_ITEM && parseBone(i.stats)?.slot === bone.slot) ?? null, full: true };
  if (it.code !== CORE_ITEM) return null;
  const cores = mine.filter((i) => i.code === CORE_ITEM);
  if (cores.length < CORE_SLOTS) return { cur: null, full: false };
  return { cur: [...cores].sort((a, b) => (a.stars ?? 1) - (b.stars ?? 1) || a.enhance - b.enhance)[0], full: true };
}

/**
 * Dòng so sánh cho chú thích: từng chỉ số "cũ → mới" kèm ▲ xanh (tăng) / ▼ đỏ (giảm) / = (không đổi); cần đủ cả chữ và mũi tên, không chỉ màu.
 * `curName`: tên món bị thay (null = gắn vào ô trống / vị trí chưa có món).
 */
export function compareLines(it: BagItem, w: { cur: BagItem | null; full: boolean }, curName: string | null): TipLine[] | null {
  const a = statsOf(it); if (!a) return null;
  const b = w.cur ? statsOf(w.cur) ?? {} : {};
  const lines: TipLine[] = [{ v: w.cur ? `So với đang gắn: ${curName}` : w.full ? "Vị trí này đang trống: gắn là cộng thêm" : "Còn ô trống: gắn là cộng thêm", tone: "muted" }];
  for (const k of CORE_STAT_IDS) {
    const n = a[k] ?? 0, o = b[k] ?? 0;
    if (!n && !o) continue;
    const d = Math.round((n - o) * 10) / 10, pct = CORE_STATS[k].pct ? "%" : "";
    lines.push({ k: statName(k), v: `${fmt(o)}${pct} → ${fmt(n)}${pct}  ${d > 0 ? "▲ +" : d < 0 ? "▼ −" : "= "}${fmt(Math.abs(d))}${d ? pct : ""}`, tone: d > 0 ? "good" : d < 0 ? "bad" : "muted" });
  }
  return lines;
}
