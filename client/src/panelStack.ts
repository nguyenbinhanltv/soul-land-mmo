// Ngăn xếp bảng (U1 #754, mục "Quản lý bảng" ở docs/design/giao-dien.md): lớp mỏng theo dõi bảng nào đang mở và bảng nào ở trên cùng.
// Không đọc state game, không gửi tin; từng bảng vẫn tự mở / đóng bằng `hidden` như cũ (hud.ts, charPanel.ts, autoPanel.ts…), module chỉ
// quan sát `hidden` để biết thứ tự mở, nhận "bấm vào bảng" để nâng lên trên cùng, và cho GameScene hỏi "Esc đóng bảng nào".

export type StackPanel = {
  id: string;
  /** Hàm đóng riêng của bảng (đúng hàm các nơi khác đang dùng). */
  close: () => void;
  /** Cửa nhỏ / dải thông báo (người chơi bấm, kênh, tổng kết tự săn): Esc đóng được nhưng không nâng lớp, không nhả phím khi mở. */
  popup?: boolean;
  /** Mở bằng bàn phím thì chuyển tiêu điểm vào bảng (mặc định: bảng không phải cửa nhỏ). Bản đồ lớn là cửa nhỏ về lớp nhưng vẫn cần (#1675). */
  focus?: boolean;
};

const Z0 = 4; // lớp thấp nhất của các bảng giữa màn hình (style.css: `#roster,#bag,…{z-index:4}`); thẻ / chú thích nằm từ 30 trở lên
let list: StackPanel[] = [];
let order: string[] = []; // dưới → trên, chỉ gồm bảng đang mở
let onOpen: (() => void) | null = null;
let kbd = false; // lần nhập gần nhất là bàn phím (chuột / cảm ứng thì không kéo tiêu điểm vào bảng, không bật vòng focus)
const took = new Map<string, HTMLElement | null>(); // bảng đã nhận tiêu điểm lúc mở → phần tử giữ tiêu điểm trước đó (trả lại khi đóng)

const elOf = (id: string) => document.getElementById(id);
const isOpen = (id: string) => { const e = elOf(id); return !!e && !e.hidden; };
const def = (id: string) => list.find((p) => p.id === id);

/** Gán lớp theo thứ tự trong ngăn xếp: bảng trên cùng có lớp cao nhất; bảng đóng trả về lớp CSS gốc. */
function layer() {
  for (const p of list) {
    if (p.popup) continue;
    const e = elOf(p.id), i = order.indexOf(p.id);
    if (e) e.style.zIndex = i < 0 ? "" : String(Z0 + i);
  }
}

/** Đồng bộ với `hidden` hiện tại: bảng mới mở vào đỉnh, bảng vừa đóng ra khỏi ngăn xếp. */
function sync() {
  let opened = false;
  order = order.filter((id) => isOpen(id));
  for (const p of list) if (isOpen(p.id) && !order.includes(p.id)) { order.push(p.id); if (!p.popup) opened = true; }
  layer();
  if (opened) onOpen?.();
  for (const p of list) {
    if (!(p.focus ?? !p.popup)) continue;
    const e = elOf(p.id); if (!e) continue;
    if (isOpen(p.id) && kbd && !took.has(p.id)) enter(p.id, e);
    else if (!isOpen(p.id) && took.has(p.id)) leave(p.id, e);
  }
}

/** Bảng vừa mở bằng phím: tiêu điểm vào nút đầu (không phải ô gõ, để phím tắt còn chạy) hoặc chính khung, để Tab xoay trong bảng (`trapTab`) thay vì đổi mục tiêu game (#1675, cùng cách hubMenu #1636). */
function enter(id: string, root: HTMLElement) {
  const a = document.activeElement as HTMLElement | null;
  if (a && root.contains(a)) return; // bảng đã tự nhận tiêu điểm
  const first = visibleItems(root).find((x) => !x.matches("input,select,textarea"));
  let to = first;
  if (!to) { if (!root.hasAttribute("tabindex")) root.tabIndex = -1; to = root; }
  to.focus({ preventScroll: true });
  took.set(id, a && a !== document.body && a.isConnected ? a : null);
}

/** Bảng đóng: nếu tiêu điểm còn ở trong bảng (hoặc đã rơi về body) thì trả về nơi cũ, không có thì bỏ tiêu điểm để Tab lại là đổi mục tiêu. */
function leave(id: string, root: HTMLElement) {
  const back = took.get(id) ?? null; took.delete(id);
  const a = document.activeElement as HTMLElement | null;
  if (a && a !== document.body && !root.contains(a)) return; // tiêu điểm đã sang chỗ khác (bảng kế)
  if (back?.isConnected && back.getClientRects().length > 0 && !back.closest("[hidden]")) back.focus({ preventScroll: true });
  else a?.blur();
}

/** Nâng bảng lên trên cùng (bấm vào bảng, hoặc dualWindow đổi bảng nổi). Bảng chưa mở thì bỏ qua. */
export function raiseStack(id: string) {
  sync(); // bảng vừa mở trong cùng lượt (observer chưa chạy) phải vào ngăn xếp và nhả phím trước khi nâng
  if (!def(id) || !isOpen(id) || order[order.length - 1] === id) return;
  order = order.filter((x) => x !== id); order.push(id); layer();
}

/** Bảng đang ở trên cùng (null khi không có bảng nào mở). */
export function topPanelId(): string | null { sync(); return order[order.length - 1] ?? null; }

/** Đóng đúng một bảng trên cùng. true nếu có bảng để đóng (Esc dừng ở đây, không huỷ khoá mục tiêu). */
export function closeTopPanel(): boolean {
  const id = topPanelId(); if (!id) return false;
  def(id)!.close();
  order = order.filter((x) => x !== id); layer();
  return true;
}

/** Đóng mọi bảng giữa màn hình đang mở (kèm menu người chơi) bằng đúng hàm đóng của từng bảng, trừ `except`: nút Cài đặt / Tự động dùng trước khi mở (#1044). */
export function closeCentrePanels(except?: string) {
  sync();
  for (const p of [...list]) if (p.id !== except && (!p.popup || p.id === "pmenu") && isOpen(p.id)) p.close();
  order = order.filter((x) => isOpen(x)); layer();
}

/** Bảng đang mở chứa phần tử `t` (tiêu điểm bàn phím) hay không; chỉ tính bảng trong ngăn xếp. */
export function panelOf(t: Element | null): string | null {
  for (const p of list) { const e = elOf(p.id); if (e && !e.hidden && t && e.contains(t)) return p.id; }
  return null;
}

const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const visibleItems = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => !x.hidden && x.getClientRects().length > 0 && !x.closest("[hidden]"));

/** Tab / Shift+Tab xoay vòng trong bảng đang giữ tiêu điểm (không thoát ra ngoài bảng, không bị game dùng cho đổi mục tiêu). true nếu đã xử lý. */
export function trapTab(e: KeyboardEvent): boolean {
  let id = panelOf(document.activeElement);
  if (!id) { // bảng mở bằng phím nhưng tiêu điểm rơi mất (bảng dựng lại nội dung khi dữ liệu về): Tab kéo lại vào bảng đó thay vì đổi mục tiêu (#1675)
    id = [...order].reverse().find((x) => took.has(x) && isOpen(x)) ?? null; if (!id) return false;
    const r = elOf(id)!; (visibleItems(r).find((x) => !x.matches("input,select,textarea")) ?? r).focus({ preventScroll: true });
    if (panelOf(document.activeElement) !== id) return false;
    e.preventDefault(); return true;
  }
  const root = elOf(id)!, items = visibleItems(root);
  if (!items.length) return false;
  const i = items.indexOf(document.activeElement as HTMLElement), last = items.length - 1;
  const to = e.shiftKey ? (i <= 0 ? items[last] : null) : (i < 0 || i === last ? items[0] : null);
  if (!to) return true; // giữa bảng: để trình duyệt tự nhảy tới ô kế
  e.preventDefault(); to.focus(); return true;
}

/** Dựng một lần mỗi phòng (GameScene.setupInput). `open` gọi khi một bảng (không phải cửa nhỏ) vừa mở: nhả phím đang giữ. */
export function initPanelStack(panels: StackPanel[], open: () => void, signal: AbortSignal) {
  list = panels; order = []; onOpen = open; kbd = false; took.clear();
  addEventListener("keydown", () => { kbd = true; }, { signal, capture: true });
  addEventListener("pointerdown", () => { kbd = false; }, { signal, capture: true });
  const mo = new MutationObserver(sync), opt = { signal, capture: true };
  // Bảng mở bằng phím dựng lại nội dung (dữ liệu về) làm nút đang giữ tiêu điểm biến mất: kéo tiêu điểm về nút đầu của bảng, không để rơi ra body (#1675).
  const kept = new MutationObserver(() => {
    const a = document.activeElement;
    if (a && a !== document.body) return;
    const id = [...order].reverse().find((x) => took.has(x) && isOpen(x)); if (!id) return;
    const r = elOf(id)!; (visibleItems(r).find((x) => !x.matches("input,select,textarea")) ?? r).focus({ preventScroll: true });
  });
  for (const p of list) {
    const e = elOf(p.id); if (!e) continue;
    mo.observe(e, { attributes: true, attributeFilter: ["hidden"] });
    if (p.focus ?? !p.popup) kept.observe(e, { childList: true, subtree: true });
    e.addEventListener("pointerdown", () => raiseStack(p.id), opt); // bấm vào bảng nào, bảng đó nổi lên (kể cả bấm khe / viền)
  }
  signal.addEventListener("abort", () => { mo.disconnect(); kept.disconnect(); took.clear(); list = []; order = []; onOpen = null; });
  order = list.filter((p) => isOpen(p.id)).map((p) => p.id);
  layer();
}
