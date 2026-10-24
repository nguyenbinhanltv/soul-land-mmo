// Kéo thả bằng con trỏ cho Túi + búp bê (NV3 của #453, mục 5.16 ở GAME_DESIGN.md): một engine dùng chung cho chuột và chạm (giữ ~150 ms mới nhấc đồ,
// để cuộn danh sách bằng ngón tay vẫn được). Chỉ lo phần "cảm giác": bóng mờ theo con trỏ, ô thả xanh / đỏ, bay về ô cũ. KHÔNG biết luật chơi:
// ô nào nhận món nào do `Zone.test` quyết (dựng từ `acceptsItem` ở charBagContract.ts), thả hợp lệ thì `Zone.drop` gửi lệnh server có sẵn.
// Server quyết định: engine không đổi gì trên màn hình sau khi thả, đồ chỉ chuyển chỗ khi tin "bag" / "gear" mới về.
import type { AcceptResult, DragFrom, DragSession } from "./charBagContract.ts";
import type { BagItem } from "./net.ts";
import { hideTip } from "./tooltip.ts";

/** Một ô / vùng nhận thả. `test` chạy lại mỗi nhịp khi đang kéo (ô vẽ lại thì dựng Zone mới, cái cũ tự bị bỏ khi phần tử rời khỏi trang). */
export interface Zone {
  el: HTMLElement;
  /** `kind`: "slot" = ô búp bê / dải gắn nhanh (tô xanh / đỏ ngay khi bắt đầu kéo); "area" = vùng lớn như Túi (chỉ tô khi con trỏ ở trong); "cell" = ô túi (đổi chỗ). */
  kind: "slot" | "area" | "cell";
  /** null = ô này không liên quan tới lần kéo (không tô, thả vào thì coi như thả trượt). */
  test(s: DragSession): AcceptResult | null;
  drop(s: DragSession): void;
}

/** Thời gian giữ trước khi nhấc đồ trên màn cảm ứng; chuột bắt đầu sau khi dịch MOUSE_SLOP px. */
export const HOLD_MS = 150, MOUSE_SLOP = 5, TOUCH_SLOP = 10, GHOST_ALPHA = 0.8, FLY_MS = 200;

const zones = new Map<HTMLElement, Zone>();
let cur: { s: DragSession; origin: DOMRect; pid: number; over: Zone | null; x: number; y: number; raf: number; last: Map<HTMLElement, string> } | null = null;
let clickBlockUntil = 0;

/** Đăng ký ô nhận thả (gọi mỗi lần vẽ lại bảng); phần tử đã rời trang tự bị dọn. */
export function addZone(z: Zone) {
  if (zones.size > 400) prune();
  zones.set(z.el, z);
}
const prune = () => { for (const el of [...zones.keys()]) if (!el.isConnected) zones.delete(el); };
export const isDragging = () => cur !== null;
/** Món đang kéo (null nếu không): bảng dùng để biết đang kéo gì khi vẽ lại. */
export const dragItem = (): BagItem | null => cur?.s.item ?? null;

/** Ô nhận thả dưới con trỏ: phần tử trong cùng nhất có đăng ký (bóng kéo có pointer-events: none). */
function zoneAt(x: number, y: number): Zone | null {
  for (let n = document.elementFromPoint(x, y) as HTMLElement | null; n; n = n.parentElement) {
    const z = zones.get(n); if (z) return z;
  }
  return null;
}

/** Tô lại mọi ô theo món đang kéo: ô "slot" luôn xanh / đỏ, ô đang ở dưới con trỏ thêm viền sáng; chỉ ghi DOM khi giá trị đổi. */
function mark() {
  if (!cur) return;
  prune();
  const { s } = cur, over = zoneAt(cur.x, cur.y);
  cur.over = over;
  for (const z of zones.values()) {
    const r = z.kind === "slot" || z === over ? z.test(s) : null, v = r ? `${r.ok ? "ok" : "bad"}${z === over ? " over" : ""}` : "";
    if (cur.last.get(z.el) === v) continue;
    cur.last.set(z.el, v);
    z.el.classList.toggle("dd-ok", !!r?.ok); z.el.classList.toggle("dd-bad", !!r && !r.ok); z.el.classList.toggle("dd-over", z === over && !!r);
    if (r && !r.ok && r.why) z.el.dataset.why = r.why; else delete z.el.dataset.why;
  }
  const ro = over?.test(s), why = ro && !ro.ok ? ro.why ?? "" : undefined; // lý do ô đỏ dưới con trỏ, hiện cạnh bóng (CSS .dd-ghost[data-why])
  cur.s.ghost.dataset.why = why ?? "";
  cur.s.ghost.classList.toggle("dd-no", why !== undefined);
}
const unmarkAll = () => {
  for (const el of document.querySelectorAll(".dd-ok,.dd-bad,.dd-over")) { el.classList.remove("dd-ok", "dd-bad", "dd-over"); delete (el as HTMLElement).dataset.why; }
};

const place = (g: HTMLElement, x: number, y: number) => { g.style.transform = `translate3d(${x - g.offsetWidth / 2}px,${y - g.offsetHeight / 2}px,0)`; };

function loop() {
  if (!cur) return;
  place(cur.s.ghost, cur.x, cur.y); mark();
  cur.raf = requestAnimationFrame(loop);
}

/** Kết thúc lần kéo: `commit` = đã thả vào ô hợp lệ (bóng tan dần); ngược lại bay về ô cũ rồi mất. */
function finish(commit: boolean) {
  if (!cur) return;
  const c = cur; cur = null;
  cancelAnimationFrame(c.raf);
  window.removeEventListener("pointermove", onMove, true); window.removeEventListener("pointerup", onUp, true);
  window.removeEventListener("pointercancel", onCancel, true); window.removeEventListener("keydown", onKey, true);
  window.removeEventListener("touchmove", blockScroll, true);
  unmarkAll();
  document.body.classList.remove("dd-active");
  clickBlockUntil = performance.now() + 60; // cú nhấp sinh ra sau khi thả không được kích hoạt ô vừa thả lên
  const g = c.s.ghost;
  g.style.transition = `transform ${FLY_MS}ms cubic-bezier(.2,.8,.2,1), opacity ${FLY_MS}ms`;
  if (commit) { g.style.opacity = "0"; g.style.transform += " scale(.6)"; }
  else {
    const o = c.origin;
    g.style.transform = `translate3d(${o.left + o.width / 2 - g.offsetWidth / 2}px,${o.top + o.height / 2 - g.offsetHeight / 2}px,0)`;
    g.style.opacity = "0.15";
  }
  const done = () => g.remove();
  g.addEventListener("transitionend", done, { once: true }); setTimeout(done, FLY_MS + 80);
}

const onMove = (e: PointerEvent) => { if (cur && e.pointerId === cur.pid) { cur.x = e.clientX; cur.y = e.clientY; e.preventDefault(); } };
const onUp = (e: PointerEvent) => {
  if (!cur || e.pointerId !== cur.pid) return;
  cur.x = e.clientX; cur.y = e.clientY;
  const z = zoneAt(e.clientX, e.clientY), s = cur.s;
  if (z && z.test(s)?.ok) { finish(true); z.drop(s); } else finish(false);
};
const onCancel = (e: PointerEvent) => { if (cur && e.pointerId === cur.pid) finish(false); };
const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); finish(false); } };
const blockScroll = (e: Event) => { if (cur && e.cancelable) e.preventDefault(); };

function begin(item: BagItem, from: DragFrom, srcEl: HTMLElement, e: PointerEvent) {
  hideTip();
  const r = srcEl.getBoundingClientRect(), g = srcEl.cloneNode(true) as HTMLElement;
  g.removeAttribute("id"); g.classList.add("dd-ghost"); g.classList.remove("sel", "hint", "dim");
  g.style.width = `${r.width}px`; g.style.height = `${r.height}px`; g.style.opacity = String(GHOST_ALPHA);
  g.setAttribute("aria-hidden", "true"); (g as HTMLButtonElement).disabled = false; g.tabIndex = -1;
  document.body.appendChild(g);
  cur = { s: { item, from, ghost: g }, origin: r, pid: e.pointerId, over: null, x: e.clientX, y: e.clientY, raf: 0, last: new Map() };
  document.body.classList.add("dd-active");
  window.addEventListener("pointermove", onMove, true); window.addEventListener("pointerup", onUp, true);
  window.addEventListener("pointercancel", onCancel, true); window.addEventListener("keydown", onKey, true);
  window.addEventListener("touchmove", blockScroll, { capture: true, passive: false });
  if (e.pointerType === "touch") { navigator.vibrate?.(8); try { srcEl.releasePointerCapture(e.pointerId); } catch { /* chưa bắt */ } } // phần tử nguồn bị vẽ lại giữa chừng thì sự kiện vẫn tới window
  loop();
}

/**
 * Cho phần tử `el` thành nguồn kéo: `get()` trả món + nơi nhấc lúc bắt đầu (null = ô trống, không kéo). Chuột: kéo sau khi dịch MOUSE_SLOP px;
 * chạm: giữ HOLD_MS không dịch quá TOUCH_SLOP px thì nhấc (dịch trước đó là cuộn, bỏ). Cú nhấp sau khi kéo bị nuốt.
 */
export function dragSource(el: HTMLElement, get: () => { item: BagItem; from: DragFrom } | null) {
  el.style.touchAction = "manipulation";
  el.addEventListener("dragstart", (e) => e.preventDefault()); // tắt kéo-thả gốc của trình duyệt (ảnh, văn bản)
  el.addEventListener("contextmenu", (e) => { if ((e as PointerEvent).pointerType === "touch" || document.body.classList.contains("dd-active")) e.preventDefault(); });
  el.addEventListener("pointerdown", (e) => {
    if (cur || e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY, touch = e.pointerType === "touch", pid = e.pointerId;
    let timer = 0;
    const start = (x: number, y: number) => { cleanup(); const g = get(); if (g) { begin(g.item, g.from, el, e); cur!.x = x; cur!.y = y; } };
    const move = (m: PointerEvent) => {
      if (m.pointerId !== pid) return;
      const d = Math.hypot(m.clientX - sx, m.clientY - sy);
      if (touch) { if (d > TOUCH_SLOP) cleanup(); } else if (d > MOUSE_SLOP) start(m.clientX, m.clientY);
    };
    const up = (m: PointerEvent) => { if (m.pointerId === pid) cleanup(); };
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", move, true); window.removeEventListener("pointerup", up, true); window.removeEventListener("pointercancel", up, true);
    };
    window.addEventListener("pointermove", move, true); window.addEventListener("pointerup", up, true); window.addEventListener("pointercancel", up, true);
    if (touch) timer = window.setTimeout(() => start(sx, sy), HOLD_MS);
  });
}

// Nuốt cú nhấp ngay sau một lần kéo (thả lên chính ô nguồn sẽ sinh click).
window.addEventListener("click", (e) => { if (performance.now() < clickBlockUntil) { e.stopPropagation(); e.preventDefault(); } }, true);
