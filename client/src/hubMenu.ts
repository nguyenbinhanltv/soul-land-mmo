// UI v2, menu hub ngăn kéo bên phải (đợt 1 của bộ spec UI, Part of #877; docs/design/giao-dien.md "Menu hub").
// Chỉ chạy khi cờ `ui2` bật (tắt thì không dựng gì, nút menu cũ giữ nguyên). Hub chỉ MỞ các bảng đã có: bấm một mục là gọi đúng hàm mở của bảng đó
// (GameScene truyền vào `actions`), hub không giữ trạng thái game. Mục chưa có chức năng: thẻ lưới và mục rail hiện mờ kèm lý do "Chưa có".
// Chấm đỏ / mũi tên xanh đọc từ kho `badges.ts` (đợt 4b); hub chỉ vẽ lại khi kho đổi.
import { statusCard, mount, type CardOpts, type PNode } from "./uiParts.ts";
import { isUi2 } from "./uiKit.ts";
import { allBadges, onBadges, type BadgeKind } from "./badges.ts";

export type HubSize = "big" | "mid" | "grid" | "rail";
export interface HubItem { id: string; label: string; size: HubSize; /** phím tắt đã có (chỉ để nhắc, hub không bắt phím). */ key?: string; sub?: string;
  /** lý do khi chưa nối bảng (thẻ khoá luôn nói rõ vì sao + đi đâu); thiếu thì "Chưa có". */ why?: string }

/** Cây menu đã duyệt (bộ spec UI mục 2): 2 thẻ lớn, 2 thẻ vừa, lưới 4 cột, rail dọc. Thêm mục = thêm dòng và truyền hành động cùng `id`. */
export const HUB_ITEMS: HubItem[] = [
  { id: "vohon", label: "Võ Hồn", size: "big", key: "V", sub: "Đội hình, hồn hoàn, hồn cốt" },
  { id: "char", label: "Nhân Vật", size: "big", key: "H", sub: "Chỉ số, trang bị" },
  { id: "tong", label: "Tông Môn", size: "mid", why: "Gặp Sứ giả Tông Môn ở thành" },
  { id: "reso", label: "Cộng Minh", size: "mid", key: "K" },
  { id: "bag", label: "Túi Đồ", size: "grid", key: "B" },
  { id: "shop", label: "Cửa Hàng", size: "grid", why: "Tại NPC" },
  { id: "rank", label: "Xếp Hạng", size: "grid" },
  { id: "achv", label: "Thành Tựu", size: "grid", why: "Sắp có" },
  { id: "quest", label: "Nhiệm Vụ", size: "grid" },
  { id: "world", label: "Bản Đồ", size: "grid", key: "M" },
  { id: "friends", label: "Bạn Bè", size: "grid", key: "L" },
  { id: "auto", label: "Tự Động", size: "grid", key: "T" },
  { id: "forge", label: "Ghép / Rèn", size: "grid", why: "Tại NPC" },
  { id: "guide", label: "Cẩm Nang", size: "grid" },
  { id: "calendar", label: "Lịch HĐ", size: "grid" },
  { id: "welfare", label: "Phúc Lợi", size: "grid" },
  { id: "mail", label: "Thư", size: "rail", why: "Chờ máy chủ" },
  { id: "notice", label: "Thông báo", size: "rail" },
  { id: "settings", label: "Cài đặt", size: "rail" },
  { id: "shot", label: "Chụp ảnh", size: "rail" },
];

export interface HubCell { item: HubItem; card: CardOpts; enabled: boolean }
export interface HubLayout { big: HubCell[]; mid: HubCell[]; grid: HubCell[]; rail: HubCell[] }

/**
 * Bố cục hub từ hành động có thật (`available`: id đã nối với một bảng), chấm đỏ (`dots`: id có việc mới, vd Phúc Lợi chưa điểm danh) và mũi tên xanh
 * (`ups`: id nâng được, vd đủ mảnh lên sao). Hàm thuần để test. Mục chưa có (kể cả rail): thẻ khoá "Chưa có" (mờ); chấm đỏ thắng mũi tên khi trùng id.
 */
export function hubLayout(available: Iterable<string>, dots: Iterable<string> = [], ups: Iterable<string> = []): HubLayout {
  const have = new Set(available), dot = new Set(dots), up = new Set(ups), out: HubLayout = { big: [], mid: [], grid: [], rail: [] };
  for (const item of HUB_ITEMS) {
    const enabled = have.has(item.id), mark = dot.has(item.id) ? ("new" as const) : up.has(item.id) ? ("up" as const) : null;
    const card: CardOpts = { title: item.label, ...(item.sub && enabled ? { sub: item.sub } : {}), ...(enabled ? (mark ? { state: mark } : {}) : { state: "lock" as const, reason: item.why ?? "Chưa có" }) };
    out[item.size].push({ item, card, enabled });
  }
  return out;
}

// ---- phần DOM ----
let actions: Record<string, () => void> = {};
let root: HTMLElement | null = null, badge: HTMLButtonElement | null = null;

const idsOf = (k: BadgeKind) => [...allBadges()].filter(([, b]) => b.kind === k).map(([id]) => id);
/** Nút HUD cũ cùng đọc kho chấm: `data-badge="new|up"` (ui2-hub.css vẽ). */
const HUD_BTN: Record<string, string> = { bag: "bagBtn", vohon: "vhBtn", char: "charBtn", reso: "resBtn" };
const hubIds = new Set(HUB_ITEMS.map((i) => i.id));
const phim = (c: HubCell) => (c.item.key ? ` · ${c.item.key}` : "");

function cellButton(c: HubCell, cls: string): HTMLElement {
  const el = statusCard({ ...c.card, sub: [c.card.sub, c.item.key ? `Phím ${c.item.key}` : ""].filter(Boolean).join(" · ") || undefined, onClick: c.enabled ? () => run(c.item.id) : undefined });
  el.classList.add(cls); el.dataset.hub = c.item.id;
  if (!c.enabled && el.tagName !== "BUTTON") el.setAttribute("aria-disabled", "true");
  return el;
}

function run(id: string) {
  setHubOpen(false);
  actions[id]?.();
}

/** Dựng lại nội dung ngăn kéo theo hành động và chấm đỏ hiện có. */
function render() {
  if (!root) return;
  const L = hubLayout(Object.keys(actions), idsOf("new"), idsOf("up"));
  const sec = (cls: string, cells: HubCell[], cellCls: string) => {
    const d = document.createElement("div"); d.className = cls;
    for (const c of cells) d.append(cellButton(c, cellCls));
    return d;
  };
  const head: PNode = { tag: "header", cls: "hub-hd", kids: [{ tag: "h2", cls: "hub-title", text: "Menu" }, { tag: "button", cls: "hub-x", text: "×", attrs: { type: "button", "aria-label": "Đóng menu (Esc)", title: "Đóng menu · Esc" } }] };
  const main = document.createElement("div"); main.className = "hub-main";
  main.append(sec("hub-big", L.big, "hub-c-big"), sec("hub-mid", L.mid, "hub-c-mid"), sec("hub-grid", L.grid, "hub-c-grid"));
  const rail = document.createElement("nav"); rail.className = "hub-rail"; rail.setAttribute("aria-label", "Tiện ích");
  for (const c of L.rail) {
    const b = document.createElement("button"); b.type = "button"; b.className = "hub-r"; b.dataset.hub = c.item.id; b.textContent = c.item.label;
    if (c.card.state === "new" || c.card.state === "up") b.dataset.badge = c.card.state;
    if (c.enabled) { b.title = c.item.label + phim(c); b.addEventListener("click", () => run(c.item.id)); }
    else { b.title = `${c.item.label}: ${c.card.reason}`; b.setAttribute("aria-disabled", "true"); b.classList.add("lock"); }
    rail.append(b);
  }
  const hd = mount(head);
  hd.querySelector(".hub-x")!.addEventListener("click", () => setHubOpen(false));
  const legend = document.createElement("footer"); legend.className = "hub-legend"; legend.setAttribute("aria-label", "Chú giải dấu");
  for (const [k, t] of [["new", "Mới"], ["up", "Nâng được"], ["lock", "Khoá: đọc lý do trên thẻ"]]) { const s = document.createElement("span"); s.dataset.k = k; s.textContent = t; legend.append(s); }
  root.replaceChildren(hd, main, rail, legend);
  syncBadges();
}

/** Chấm của huy hiệu menu (bất kỳ mục hub nào có việc) và của nút HUD cũ; gọi mỗi khi kho đổi. */
function syncBadges() {
  badge?.classList.toggle("has-dot", [...allBadges().keys()].some((id) => hubIds.has(id)));
  for (const [id, btn] of Object.entries(HUD_BTN)) {
    const el = document.getElementById(btn), b = allBadges().get(id);
    if (!el) continue;
    if (b) el.dataset.badge = b.kind; else delete el.dataset.badge;
  }
}

export const isHubOpen = () => !!root && !root.hidden;
export function setHubOpen(open: boolean) {
  if (!root) return;
  if (open === !root.hidden) return;
  if (open) render();
  root.hidden = !open;
  badge?.setAttribute("aria-expanded", String(open));
}
export const toggleHub = () => setHubOpen(!isHubOpen());

/**
 * Dựng ngăn kéo `#hub` (có sẵn trong choi/index.html) và huy hiệu mở menu. Trả false (không làm gì) khi cờ `ui2` tắt.
 * `acts`: id → hàm mở bảng; id không có ở đây thì mục hiện mờ.
 */
export function initHub(acts: Record<string, () => void>, signal: AbortSignal): boolean {
  if (!isUi2()) return false;
  root = document.getElementById("hub");
  if (!root) return false;
  actions = acts;
  badge = document.getElementById("hubBtn") as HTMLButtonElement | null;
  if (!badge) {
    badge = document.createElement("button"); badge.id = "hubBtn"; badge.type = "button"; badge.className = "hub-badge"; badge.textContent = "魂";
    badge.setAttribute("aria-controls", "hub"); badge.setAttribute("aria-expanded", "false"); badge.setAttribute("aria-label", "Mở menu (Esc)"); badge.title = "Menu · Esc";
    document.body.append(badge);
  }
  badge.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); toggleHub(); }, { signal });
  const stop = onBadges(() => { if (isHubOpen()) render(); else syncBadges(); });
  signal.addEventListener("abort", () => { stop(); root = null; badge?.remove(); badge = null; actions = {}; });
  root.hidden = true;
  syncBadges();
  return true;
}
