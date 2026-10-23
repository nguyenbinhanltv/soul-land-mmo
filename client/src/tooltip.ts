/**
 * Tooltip dùng chung (UI-0, #350): một tấm mực `#tip`, một hàm dựng nội dung, một kiểu CSS cho mọi chú thích.
 *
 * Hai cách dùng:
 * 1. Cứ gán `el.title = "Dòng đầu là tiêu đề\nCác dòng sau là nội dung"` như trước: `initTips` ủy quyền ở `document`, lần rê chuột / chạm giữ
 *    đầu tiên chuyển `title` thành chú thích của game (và bỏ `title` để trình duyệt không hiện thêm khung thứ hai), nên mọi chỗ cũ tự đổi kiểu.
 * 2. Chú thích có cấu trúc (tiêu đề màu, dòng chỉ số, tăng / giảm): `setTip(el, { title, color, sub, lines, foot })`.
 *
 * Mọi chữ đi qua `textContent` (tên người chơi, tên vật phẩm không bao giờ vào `innerHTML`). Máy cảm ứng: chạm giữ ~0,4 giây; chú thích tự
 * tắt sau vài giây (7 giây) hoặc khi chạm chỗ khác. Chỉ hiển thị, không đổi trạng thái game.
 */
export type TipLine = string | { k?: string; v: string; tone?: "good" | "bad" | "muted" | "gem" };
export interface TipSpec {
  title?: string;
  /** Màu tiêu đề (chữ trên tấm mực: dùng `--tier-N-glow`, không dùng màu niên hạn thô). */
  color?: string;
  /** Màu viền tấm (mặc định viền ngọc). */
  border?: string;
  sub?: string;
  lines?: TipLine[];
  foot?: string;
}

const specs = new WeakMap<Element, TipSpec>();
const HOVER_MS = 250, LONG_MS = 400, TOUCH_SHOW_MS = 7000   /* chạm: giữ đủ lâu để đọc, tắt khi chạm chỗ khác */;
let tipEl: HTMLElement | null = null, cur: Element | null = null, timer = 0, hideTimer = 0, longPressed = false;

/** Gắn chú thích có cấu trúc (hoặc chữ thường) cho một phần tử; `null` gỡ. */
export function setTip(el: Element, spec: TipSpec | string | null) {
  el.removeAttribute("title");
  if (spec === null || spec === "") { specs.delete(el); el.removeAttribute("data-tipped"); return; }
  specs.set(el, typeof spec === "string" ? parseText(spec) : spec);
  el.setAttribute("data-tipped", "");   // thay cho [title] trong CSS (title đã gỡ để trình duyệt không hiện khung thứ hai)
}

/**
 * Nội dung chú thích hiện tại của phần tử dưới dạng chữ (tiêu đề, dòng phụ, các dòng; dòng `{k, v}` thành "k: v"). Mã cũ cần đọc lại
 * chú thích (ví dụ cất rồi trả lại khi tráo nút) dùng hàm này thay cho `el.title`, vì `title` bị gỡ sau lần rê chuột đầu.
 */
export function tipOf(el: Element): string {
  const attr = el.getAttribute("title");
  if (attr !== null) return attr;                      // vừa gán `title` mới, chưa được ủy quyền chuyển
  const s = specs.get(el); if (!s) return "";
  return [s.title, s.sub, ...(s.lines ?? []).map((l) => (typeof l === "string" ? l : l.k ? `${l.k}: ${l.v}` : l.v)), s.foot].filter(Boolean).join("\n");
}

/** `title` dạng chữ: dòng đầu là tiêu đề nếu có từ hai dòng; một dòng chỉ là nội dung. */
export function parseText(text: string): TipSpec {
  const rows = text.split("\n").map((r) => r.trimEnd()).filter((r) => r !== "");
  if (rows.length <= 1) return { lines: rows };
  return { title: rows[0], lines: rows.slice(1) };
}

/** Dựng nội dung chú thích (mọi chữ qua textContent). Tách riêng để thử / dùng lại. */
export function buildTip(spec: TipSpec): DocumentFragment {
  const f = document.createDocumentFragment();
  const add = (cls: string, text: string) => { const s = document.createElement("span"); s.className = cls; s.textContent = text; f.appendChild(s); return s; };
  if (spec.title) add("t-title", spec.title);
  if (spec.sub) add("t-sub", spec.sub);
  for (const ln of spec.lines ?? []) {
    if (typeof ln === "string") { const d = document.createElement("div"); d.textContent = ln; f.appendChild(d); continue; }
    const d = document.createElement("div"); d.className = "t-row" + (ln.tone && ln.tone !== "gem" ? ` t-${ln.tone}` : "");
    if (ln.k) { const k = document.createElement("span"); k.textContent = ln.k; d.appendChild(k); }
    const v = document.createElement(ln.tone === "gem" ? "b" : "span"); v.textContent = ln.v; d.appendChild(v);
    f.appendChild(d);
  }
  if (spec.foot) add("t-foot", spec.foot);
  return f;
}

/** Tỉ lệ giao diện hiện tại (biến CSS --u do uiArt.ts đặt, 0,75–2…). */
const uiU = () => Math.max(0.5, Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--u")) || 1);

function place(target: Element) {
  const tip = tipEl!, u = uiU();
  tip.style.transform = `scale(${u})`;
  const r = target.getBoundingClientRect(), w = tip.offsetWidth * u, h = tip.offsetHeight * u, gap = 6 * u, vw = innerWidth, vh = innerHeight;
  let x = r.left + r.width / 2 - w / 2, y = r.top - h - gap;
  if (y < 4) y = r.bottom + gap;                    // không đủ chỗ phía trên: đặt dưới
  if (y + h > vh - 4) y = Math.max(4, vh - h - 4);  // vẫn tràn: kẹp trong màn hình
  x = Math.max(4, Math.min(vw - w - 4, x));
  tip.style.left = `${Math.round(x)}px`; tip.style.top = `${Math.round(y)}px`; tip.style.transform = `scale(${u})`;
}

function show(target: Element) {
  const spec = specs.get(target);
  if (!spec || !tipEl) return;
  tipEl.replaceChildren(buildTip(spec));
  tipEl.style.setProperty("--tip-c", spec.border ?? "");
  if (spec.color) tipEl.style.setProperty("--tip-cg", spec.color); else tipEl.style.removeProperty("--tip-cg");
  if (!spec.border) tipEl.style.removeProperty("--tip-c");
  tipEl.hidden = false; cur = target;
  place(target);
}

export function hideTip() {
  clearTimeout(timer); clearTimeout(hideTimer);
  if (tipEl) tipEl.hidden = true;
  cur = null;
}

/** Chuyển `title` của phần tử (nếu có) thành chú thích của game. */
function adopt(el: Element) {
  const t = el.getAttribute("title");
  if (t === null) return;
  el.removeAttribute("title");
  if (t === "") { specs.delete(el); el.removeAttribute("data-tipped"); return; }   // title rỗng = xóa chú thích (mã cũ dùng để tắt)
  if (!el.hasAttribute("aria-label") && !el.textContent?.trim()) el.setAttribute("aria-label", t.split("\n")[0]);
  specs.set(el, parseText(t)); el.setAttribute("data-tipped", "");
}
const findTarget = (n: EventTarget | null) => {
  for (let e = n instanceof Element ? n : null; e; e = e.parentElement) {
    if (e.id === "tip") return null;
    if (e.hasAttribute("title")) adopt(e);
    if (specs.has(e)) return e;
  }
  return null;
};

/** Gọi một lần (main.ts): tạo `#tip` nếu trang chưa có và bật ủy quyền sự kiện. */
export function initTips() {
  if (tipEl) return;
  tipEl = document.getElementById("tip") ?? Object.assign(document.createElement("div"), { id: "tip" });
  tipEl.setAttribute("role", "tooltip"); tipEl.hidden = true;
  if (!tipEl.parentElement) (document.getElementById("stage") ?? document.body).appendChild(tipEl);
  const opt = { capture: true } as const;
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const t = findTarget(e.target);
    if (!t || t === cur) return;
    clearTimeout(timer);
    if (cur) show(t); else timer = window.setTimeout(() => show(t), HOVER_MS);   // đang hiện chú thích khác thì đổi ngay
  }, opt);
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType === "touch") return;
    const to = e.relatedTarget instanceof Node ? e.relatedTarget : null;
    if (cur && (!to || !cur.contains(to))) hideTip(); else if (!cur) clearTimeout(timer);
  }, opt);
  document.addEventListener("pointerdown", (e) => {
    longPressed = false;
    if (e.pointerType !== "touch") { hideTip(); return; }
    hideTip();
    const t = findTarget(e.target);
    if (t) timer = window.setTimeout(() => { longPressed = true; show(t); hideTimer = window.setTimeout(hideTip, TOUCH_SHOW_MS); }, LONG_MS);
  }, opt);
  const cancelTouch = (e: PointerEvent) => { if (e.pointerType === "touch") clearTimeout(timer); };
  document.addEventListener("pointerup", cancelTouch, opt); document.addEventListener("pointercancel", cancelTouch, opt);
  // Chạm giữ vừa hiện chú thích thì nuốt cú nhấp theo sau (không kích hoạt nút).
  document.addEventListener("click", (e) => { if (longPressed) { longPressed = false; e.preventDefault(); e.stopPropagation(); } }, opt);
  document.addEventListener("scroll", hideTip, opt); document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTip(); }, opt);
  addEventListener("resize", hideTip); addEventListener("blur", hideTip);
  setInterval(() => { if (cur && !cur.isConnected) hideTip(); }, 400);   // bảng vẽ lại làm mất phần tử đang chỉ vào
}
