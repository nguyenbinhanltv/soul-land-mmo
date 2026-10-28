// UI Kit v2, khung màn chuẩn + thành phần nhỏ (đợt 1 của bộ spec UI, Part of #885; docs/art/ui-kit.md "Khung màn chuẩn và thành phần nhỏ").
// Chỉ trình bày: số liệu, trạng thái, giờ đều do server quyết, client nhận rồi hiển thị. Chỉ chạy khi cờ `ui2` bật (`screenFrame` trả null khi tắt:
// màn giữ giao diện cũ); các thành phần nhỏ (thẻ, công tắc, đồng hồ) là DOM thường, kiểu của chúng nằm dưới `body.ui2` ở ui2-parts.css.
// Cấu trúc dựng bằng hàm thuần (`PNode`, không đụng DOM) để test bằng node và dựng trang xem trước; phần DOM (`mount`, hàm công khai) ở cuối tệp.
import { isUi2 } from "./uiKit.ts";

/** Nút ảo của cây dựng: thẻ, lớp, thuộc tính, chữ hoặc con. Chữ luôn là text (tên do người chơi đặt không đi qua innerHTML). */
export interface PNode { tag: string; cls: string; attrs?: Record<string, string>; text?: string; kids?: PNode[] }
const h = (tag: string, cls: string, o: { attrs?: Record<string, string>; text?: string; kids?: (PNode | null | undefined)[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids.filter((k): k is PNode => !!k) } : {}) });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const VOID = new Set(["img", "br", "hr", "input"]);
/** Cây → HTML (trang xem trước, test). */
export function toHtml(n: PNode): string {
  const a = Object.entries({ ...(n.cls ? { class: n.cls } : {}), ...n.attrs }).map(([k, v]) => ` ${k}="${esc(v)}"`).join("");
  return VOID.has(n.tag) ? `<${n.tag}${a}>` : `<${n.tag}${a}>${n.text !== undefined ? esc(n.text) : ""}${(n.kids ?? []).map(toHtml).join("")}</${n.tag}>`;
}

// ---- số và giờ ----

/** Rút gọn số: 999 → "999", 1 234 → "1,2K", 12 500 000 → "12,5M" (bảng xếp hạng, tiền tệ). Không làm tròn lên bậc kế (999 999 → "999,9K"). */
export function abbrevNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const sign = n < 0 ? "-" : "", v = Math.abs(Math.trunc(n));
  const f = (x: number, u: string) => `${sign}${(Math.floor(x * 10) / 10).toFixed(1).replace(/\.0$/, "").replace(".", ",")}${u}`;
  return v < 1000 ? `${sign}${v}` : v < 1e6 ? f(v / 1e3, "K") : v < 1e9 ? f(v / 1e6, "M") : f(v / 1e9, "B");
}

/** Dưới ngưỡng này (ms) đồng hồ đếm ngược chuyển sang "sắp hết" (đổi màu, thêm dấu; không chỉ bằng màu). */
export const COUNTDOWN_SOON_MS = 3_600_000;
const pad2 = (n: number) => String(n).padStart(2, "0");
/** Còn lại → chữ: "2 ngày 03:04:05", "01:02:03", hết giờ → "Đã hết". Làm tròn lên giây để không hiện 00:00:00 khi còn nửa giây. */
export function formatCountdown(msLeft: number): string {
  if (!(msLeft > 0)) return "Đã hết";
  const s = Math.ceil(msLeft / 1000), d = Math.floor(s / 86400), r = s % 86400;
  const hms = `${pad2(Math.floor(r / 3600))}:${pad2(Math.floor((r % 3600) / 60))}:${pad2(r % 60)}`;
  return d > 0 ? `${d} ngày ${hms}` : hms;
}

// ---- thẻ có nhãn trạng thái ----

/** Trạng thái thẻ (nguyên tắc 4 của bộ spec): mới = chấm đỏ, nâng được = mũi tên xanh, xong = tick, khoá = xám + lý do. */
export type CardState = "new" | "up" | "done" | "lock";
export interface CardOpts {
  title: string; sub?: string; state?: CardState;
  /** Lý do khoá: khoá mà không có lý do thì hiện "Chưa mở" (nguyên tắc 5: nút / thẻ khoá luôn nói rõ vì sao). */
  reason?: string;
  /** Hạng 0…4 (`--rare-N`, từ `TIERS`): màu nền thẻ và dạng góc, không chỉ màu. */
  rank?: number;
  /** Nhãn giới hạn ở đầu thẻ (vd "Giới hạn 3/ngày"). */
  limit?: string;
}
export const CARD_MARK_LABEL: Record<CardState, string> = { new: "Mới", up: "Nâng được", done: "Đã xong", lock: "Khoá" };
export const CARD_RANK_MAX = 4;

/** Mô tả thẻ đã chuẩn hoá: dấu hiệu, lý do, hạng hợp lệ, nhãn đọc cho trình đọc màn hình. Hàm thuần. */
export function cardInfo(o: CardOpts) {
  const state = o.state ?? null;
  const rank = o.rank === undefined ? null : Math.min(CARD_RANK_MAX, Math.max(0, Math.trunc(o.rank)));
  const reason = state === "lock" ? (o.reason?.trim() || "Chưa mở") : null;
  const label = [o.limit, o.title, state ? CARD_MARK_LABEL[state] : "", reason].filter(Boolean).join(", ");
  return { state, rank, reason, limit: o.limit?.trim() || null, label };
}

export function cardNode(o: CardOpts, clickable = false): PNode {
  const i = cardInfo(o);
  return h(clickable ? "button" : "div", `p2-card${i.state ? ` p2-s-${i.state}` : ""}${i.rank !== null ? ` p2-r${i.rank}` : ""}`, {
    attrs: { ...(clickable ? { type: "button" } : {}), ...(i.rank !== null ? { "data-rank": String(i.rank) } : {}), ...(i.state ? { "data-state": i.state } : {}), ...(i.state === "lock" && clickable ? { "aria-disabled": "true" } : {}), "aria-label": i.label },
    kids: [
      i.limit ? h("span", "p2-limit", { text: i.limit }) : null,
      i.state ? h("span", `p2-mark p2-m-${i.state}`, { attrs: { role: "img", "aria-label": CARD_MARK_LABEL[i.state] } }) : null,
      h("span", "p2-card-t", { text: o.title }),
      o.sub ? h("span", "p2-card-s", { text: o.sub }) : null,
      i.reason ? h("span", "p2-why", { text: i.reason }) : null,
    ],
  });
}

// ---- công tắc ----
export interface ToggleOpts { label: string; on?: boolean; disabled?: boolean }
export function toggleNode(o: ToggleOpts): PNode {
  const on = !!o.on;
  return h("label", `p2-sw-row${o.disabled ? " p2-off" : ""}`, { kids: [
    h("span", "p2-sw-l", { text: o.label }),
    h("button", "p2-sw", { attrs: { type: "button", role: "switch", "aria-checked": String(on), ...(o.disabled ? { disabled: "" } : {}) }, kids: [h("span", "p2-sw-k")] }),
  ] });
}

// ---- đồng hồ đếm ngược ----
export interface CountdownOpts { target: number; now?: () => number; label?: string }
export function countdownNode(o: CountdownOpts, now = o.now ?? Date.now): PNode {
  const left = o.target - now();
  return h("span", `p2-cd${left > 0 && left < COUNTDOWN_SOON_MS ? " p2-soon" : ""}${left > 0 ? "" : " p2-end"}`, {
    attrs: { role: "timer", ...(o.label ? { "aria-label": o.label } : {}) },
    kids: [o.label ? h("span", "p2-cd-l", { text: o.label }) : null, h("span", "p2-cd-v", { text: formatCountdown(left) })],
  });
}

// ---- khung màn chuẩn ----
export type Material = "muc" | "giay";
export interface NavItem { id: string; label: string; active?: boolean; /** chấm đỏ báo mới. */ dot?: boolean }
export interface CurrencyItem { label: string; value: string }
export interface FrameOpts {
  material?: Material; title: string;
  /** Huy hiệu trái-trên: chữ ngắn (vd tên hệ) hoặc để trống dùng chữ cái đầu của tên. */
  badge?: string;
  /** Lời giải thích sau dấu "i" (tooltip; đoạn dài > 2 dòng không đặt ở đáy bảng). */
  info?: string;
  currency?: CurrencyItem[]; nav?: NavItem[];
  primary?: { label: string; disabled?: boolean; /** lý do hiện cạnh nút khi khoá. */ reason?: string };
}

/** Bố cục "một khung màn" (nguyên tắc 1): huy hiệu + tên + i (trái-trên), tiền tệ ngữ cảnh (phải-trên), cột điều hướng trái, một nút chính phải-dưới. */
export function frameNode(o: FrameOpts): PNode {
  const mat: Material = o.material ?? "muc", p = o.primary;
  return h("section", `p2-man p2-man-${mat} ${mat === "muc" ? "f2-muc-lon" : "f2-giay-lon"}`, { attrs: { "aria-label": o.title, "data-material": mat }, kids: [
    h("header", "p2-hd", { kids: [
      h("div", "p2-id", { kids: [
        h("span", "p2-badge", { text: (o.badge ?? [...o.title][0] ?? "").slice(0, 4), attrs: { "aria-hidden": "true" } }),
        h("h2", "p2-title", { text: o.title }),
        o.info ? h("button", "p2-info", { text: "i", attrs: { type: "button", title: o.info, "aria-label": `Giải thích: ${o.info}` } }) : null,
      ] }),
      h("div", "p2-cur", { kids: (o.currency ?? []).map((c) => h("span", "p2-cur-i", { kids: [h("span", "p2-cur-l", { text: c.label }), h("span", "p2-cur-v", { text: c.value })] })) }),
    ] }),
    h("nav", "p2-nav", { attrs: { "aria-label": "Điều hướng" }, kids: (o.nav ?? []).map((n) => h("button", `p2-nav-i${n.active ? " sel" : ""}`, {
      attrs: { type: "button", "data-id": n.id, ...(n.active ? { "aria-current": "page" } : {}) },
      kids: [h("span", "p2-nav-t", { text: n.label }), n.dot ? h("span", "p2-mark p2-m-new", { attrs: { role: "img", "aria-label": CARD_MARK_LABEL.new } }) : null] })) }),
    h("div", "p2-body"),
    h("footer", "p2-ft", { kids: p ? [
      p.disabled && p.reason ? h("span", "p2-why", { text: p.reason }) : null,
      h("button", "p2-primary f2-nut-chinh", { text: p.label, attrs: { type: "button", ...(p.disabled ? { disabled: "" } : {}) } }),
    ] : [] }),
  ] });
}

// ---- phần DOM ----
/** Cây ảo → phần tử thật. */
export function mount(n: PNode): HTMLElement {
  const e = document.createElement(n.tag);
  if (n.cls) e.className = n.cls;
  for (const [k, v] of Object.entries(n.attrs ?? {})) e.setAttribute(k, v);
  if (n.text !== undefined) e.textContent = n.text;
  for (const k of n.kids ?? []) e.append(mount(k));
  return e;
}

export interface Frame { root: HTMLElement; body: HTMLElement; nav: HTMLElement; primary: HTMLButtonElement | null }
/**
 * Dựng khung màn chuẩn. Cờ `ui2` tắt thì trả null và màn giữ bảng cũ (không đổi gì ở giao diện hiện tại); `force` chỉ cho trang xem trước / thử.
 * Nội dung màn đặt vào `body`; chọn mục điều hướng và bấm nút chính do màn gắn (`onNav`, `onPrimary`), khung không giữ trạng thái.
 */
export function screenFrame(o: FrameOpts & { onNav?: (id: string) => void; onPrimary?: () => void; force?: boolean }): Frame | null {
  if (!o.force && !isUi2()) return null;
  const root = mount(frameNode(o)), nav = root.querySelector<HTMLElement>(".p2-nav")!, primary = root.querySelector<HTMLButtonElement>(".p2-primary");
  nav.addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>(".p2-nav-i"); if (b?.dataset.id) o.onNav?.(b.dataset.id); });
  primary?.addEventListener("click", () => { if (!primary.disabled) o.onPrimary?.(); });
  return { root, body: root.querySelector<HTMLElement>(".p2-body")!, nav, primary };
}

/** Thẻ có nhãn trạng thái; có `onClick` thì là nút (thẻ khoá không phát sự kiện, vẫn đọc được lý do). */
export function statusCard(o: CardOpts & { onClick?: () => void }): HTMLElement {
  const e = mount(cardNode(o, !!o.onClick));
  if (o.onClick) e.addEventListener("click", () => { if (o.state !== "lock") o.onClick!(); });
  return e;
}

/** Công tắc bật / tắt (role=switch, Space / Enter của nút gốc). `onChange` nhận giá trị muốn đặt; màn gửi lên server rồi gọi `set` nếu bị từ chối. */
export function toggle(o: ToggleOpts & { onChange?: (on: boolean) => void }) {
  const root = mount(toggleNode(o)), btn = root.querySelector<HTMLButtonElement>(".p2-sw")!;
  const set = (on: boolean) => btn.setAttribute("aria-checked", String(on));
  btn.addEventListener("click", () => { const next = btn.getAttribute("aria-checked") !== "true"; set(next); o.onChange?.(next); });
  return { root, set, get: () => btn.getAttribute("aria-checked") === "true" };
}

/** Đồng hồ đếm ngược tới `target` (ms, đồng hồ máy chủ nếu `now` được truyền); tự dừng khi hết giờ hoặc phần tử rời cây. */
export function countdown(o: CountdownOpts & { onEnd?: () => void }) {
  const now = o.now ?? Date.now, root = mount(countdownNode(o, now)), val = root.querySelector<HTMLElement>(".p2-cd-v")!;
  let timer = 0;
  const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };
  const tick = () => {
    const left = o.target - now();
    val.textContent = formatCountdown(left);
    root.classList.toggle("p2-soon", left > 0 && left < COUNTDOWN_SOON_MS);
    if (left <= 0) { root.classList.add("p2-end"); stop(); o.onEnd?.(); } else if (!root.isConnected && timer) stop();
  };
  if (o.target - now() > 0) timer = window.setInterval(tick, 1000);
  return { root, stop };
}

/** Nút đóng ở góc phải-trên của khung màn (Esc cũng đóng qua ngăn xếp bảng, `panelStack.ts`). */
export function addCloseButton(frame: HTMLElement, close: () => void) {
  const b = document.createElement("button"); b.type = "button"; b.className = "scr-x"; b.textContent = "×"; b.setAttribute("aria-label", "Đóng (Esc)"); b.title = "Đóng · Esc";
  b.addEventListener("click", close); frame.querySelector(".p2-hd")?.append(b);
}
