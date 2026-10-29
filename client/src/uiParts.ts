// UI Kit v2, khung màn chuẩn + thành phần nhỏ (đợt 1 của bộ spec UI, Part of #885; docs/art/ui-kit.md "Khung màn chuẩn và thành phần nhỏ").
// Chỉ trình bày: số liệu, trạng thái, giờ đều do server quyết, client nhận rồi hiển thị. Các thành phần nhỏ (thẻ, công tắc, đồng hồ) là DOM thường, kiểu của chúng nằm dưới `body.ui2` ở ui2-parts.css.
// Cấu trúc dựng bằng hàm thuần (`PNode`, không đụng DOM) để test bằng node và dựng trang xem trước; phần DOM (`mount`, hàm công khai) ở cuối tệp.

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

// ---- tìm / lọc tiếng Việt ----

/** Bỏ dấu để khớp tìm kiếm: "Hồi Huyết Đan" → "hoi huyet dan" (đ → d, chữ thường, gộp khoảng trắng). Hàm thuần. */
export function foldVi(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/\s+/g, " ").trim();
}
/** Khớp khi mọi từ của ô tìm (đã bỏ dấu) nằm trong tên (đã bỏ dấu); ô tìm rỗng khớp hết. Hàm thuần. */
export function matchQuery(name: string, query: string): boolean {
  const q = foldVi(query); if (!q) return true;
  const n = foldVi(name);
  return q.split(" ").every((w) => n.includes(w));
}

/** Lọc danh sách theo ô tìm (không dấu, mọi từ phải khớp); `max` cắt bớt kết quả. Ô tìm rỗng trả nguyên danh sách. Hàm thuần dùng cho Bản đồ, Túi, Cửa hàng. */
export function filterByQuery<T>(list: readonly T[], text: (t: T) => string, query: string, max = Infinity): T[] {
  const out: T[] = [];
  for (const t of list) { if (matchQuery(text(t), query)) { out.push(t); if (out.length >= max) break; } }
  return out;
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

// ---- trạng thái tải / rỗng / lỗi + thử lại (rút từ rankScreen; đợt 0b của kế hoạch UI v2, mục 8) ----
export type LoadKind = "loading" | "empty" | "error";
export interface StateOpts {
  kind: LoadKind;
  /** Câu chính; không đặt thì dùng câu mặc định của loại. */
  text?: string;
  /** Hành động gợi ý (rỗng: "Săn hồn thú để nhận"; lỗi: việc người chơi tự xử được). */
  hint?: string;
  /** Số dòng bộ xương khi đang tải. */
  rows?: number;
  retryLabel?: string;
}
export const STATE_TEXT: Record<LoadKind, string> = { loading: "Đang tải…", empty: "Chưa có gì ở đây.", error: "Không tải được (mất kết nối hoặc máy chủ chưa trả lời)." };
export const SKELETON_ROWS = 6;
/** Hộp trạng thái dùng chung cho mọi bảng gọi máy chủ: tải = bộ xương (`aria-busy`), rỗng = câu + gợi ý, lỗi = câu + nút Thử lại (`role="alert"`). Hàm thuần. */
export function stateNode(o: StateOpts): PNode {
  const text = o.text?.trim() || STATE_TEXT[o.kind];
  if (o.kind === "loading") {
    const n = Math.min(12, Math.max(1, Math.trunc(o.rows ?? SKELETON_ROWS)));
    return h("div", "p2-state p2-st-loading", { attrs: { role: "status", "aria-busy": "true", "aria-label": text }, kids: Array.from({ length: n }, () => h("span", "p2-skel")) });
  }
  return h("div", `p2-state p2-st-${o.kind}`, { attrs: { role: o.kind === "error" ? "alert" : "status" }, kids: [
    h("span", "p2-state-t", { text }),
    o.hint ? h("span", "p2-state-h", { text: o.hint }) : null,
    o.kind === "error" ? h("button", "p2-retry f2-nut-phu", { text: o.retryLabel ?? "Thử lại", attrs: { type: "button" } }) : null,
  ] });
}

// ---- hộp xổ ----
export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface SelectOpts { label: string; options: SelectOption[]; value?: string; open?: boolean; disabled?: boolean; placeholder?: string }
/** Mục đang chọn (value không có trong danh sách thì null). */
export const selectedOption = (o: Pick<SelectOpts, "options" | "value">) => o.options.find((x) => x.value === o.value) ?? null;
/** Mục kế bấm được theo hướng +1 / -1 từ `from` (-1 = chưa có mục nào được đánh dấu); không vòng lại, hết đường thì giữ nguyên. */
export function nextEnabled(options: SelectOption[], from: number, dir: 1 | -1): number {
  for (let i = from + dir; i >= 0 && i < options.length; i += dir) if (!options[i].disabled) return i;
  return from;
}
export function selectNode(o: SelectOpts, id = "p2-sel"): PNode {
  const cur = selectedOption(o), open = !!o.open, shown = cur?.label ?? o.placeholder ?? "Chọn…";
  return h("div", `p2-select${open ? " open" : ""}${o.disabled ? " p2-off" : ""}`, { kids: [
    h("button", "p2-sel-btn f2-nut-phu", { attrs: { type: "button", "aria-haspopup": "listbox", "aria-expanded": String(open), "aria-label": `${o.label}: ${shown}`, "aria-controls": id, ...(o.disabled ? { disabled: "" } : {}) }, kids: [
      h("span", "p2-sel-v", { text: shown }),
      h("span", "p2-sel-arrow", { attrs: { "aria-hidden": "true" } }),
    ] }),
    h("ul", "p2-sel-list", { attrs: { id, role: "listbox", "aria-label": o.label, ...(open ? {} : { hidden: "" }) }, kids: o.options.map((x) => h("li", `p2-sel-opt${x.value === o.value ? " sel" : ""}${x.disabled ? " p2-off" : ""}`, {
      text: x.label, attrs: { role: "option", "data-v": x.value, "aria-selected": String(x.value === o.value), ...(x.disabled ? { "aria-disabled": "true" } : {}) } })) }),
  ] });
}

// ---- thanh trượt số lượng ----
export interface QtyOpts { label: string; min?: number; max: number; value?: number; step?: number; disabled?: boolean }
/** Ép số lượng về [min, max] theo bước `step` (mốc tính từ `min`); max < min thì giữ min. Hàm thuần. */
export function clampQty(v: number, min: number, max: number, step = 1): number {
  const lo = Math.trunc(min), hi = Math.max(lo, Math.trunc(max)), st = Math.max(1, Math.trunc(step));
  if (!Number.isFinite(v)) return lo;
  const snapped = lo + Math.round((Math.trunc(v) - lo) / st) * st;
  return Math.min(hi, Math.max(lo, snapped));
}
export function qtyNode(o: QtyOpts): PNode {
  const min = Math.trunc(o.min ?? 1), step = Math.max(1, Math.trunc(o.step ?? 1)), max = Math.max(min, Math.trunc(o.max)), v = clampQty(o.value ?? min, min, max, step);
  const off: Record<string, string> = o.disabled || max <= min ? { disabled: "" } : {};
  return h("div", `p2-qty${o.disabled ? " p2-off" : ""}`, { attrs: { role: "group", "aria-label": o.label }, kids: [
    h("button", "p2-qty-b p2-qty-minus f2-nut-phu", { text: "-", attrs: { type: "button", "aria-label": "Giảm", ...off } }),
    h("input", "p2-qty-r", { attrs: { type: "range", min: String(min), max: String(max), step: String(step), value: String(v), "aria-label": o.label, ...off } }),
    h("button", "p2-qty-b p2-qty-plus f2-nut-phu", { text: "+", attrs: { type: "button", "aria-label": "Tăng", ...off } }),
    h("output", "p2-qty-v", { text: `${v}/${max}`, attrs: { "aria-live": "polite" } }),
    h("button", "p2-qty-max f2-nut-phu", { text: "Tối đa", attrs: { type: "button", ...off } }),
  ] });
}

// ---- tab hình thang (ngang) và tab icon dọc ----
export interface TabItem { id: string; label: string; /** chữ / ký tự có trong phông (icon ảnh do màn gắn sau). */ icon?: string; active?: boolean; dot?: boolean; disabled?: boolean; reason?: string }
export interface TabsOpts { label: string; tabs: TabItem[]; vertical?: boolean }
/** Tab đang chọn: mục `active` đầu tiên không khoá; không có thì mục bấm được đầu tiên. */
export const activeTabId = (tabs: TabItem[]) => (tabs.find((t) => t.active && !t.disabled) ?? tabs.find((t) => !t.disabled))?.id ?? null;
export function tabsNode(o: TabsOpts): PNode {
  const cur = activeTabId(o.tabs);
  return h("div", `p2-tabs ${o.vertical ? "p2-tabs-v" : "p2-tabs-h"}`, { attrs: { role: "tablist", "aria-orientation": o.vertical ? "vertical" : "horizontal", "aria-label": o.label }, kids: o.tabs.map((t) => {
    const sel = t.id === cur, why = t.disabled ? t.reason?.trim() || "Chưa mở" : null;
    return h("button", `p2-tab f2-tab${sel ? " sel" : ""}${o.vertical ? " p2-tab-v" : ""}`, {
      attrs: { type: "button", role: "tab", "data-id": t.id, "aria-selected": String(sel), tabindex: sel ? "0" : "-1", ...(why ? { "aria-disabled": "true" } : {}), ...(o.vertical || why ? { title: why ?? t.label } : {}), "aria-label": [t.label, t.dot ? CARD_MARK_LABEL.new : "", why].filter(Boolean).join(", ") },
      kids: [
        t.icon ? h("span", "p2-tab-i", { text: t.icon, attrs: { "aria-hidden": "true" } }) : null,
        h("span", o.vertical ? "p2-tab-t p2-sr" : "p2-tab-t", { text: t.label }),
        t.dot ? h("span", "p2-mark p2-m-new", { attrs: { role: "img", "aria-label": CARD_MARK_LABEL.new } }) : null,
      ] });
  }) });
}

// ---- ô vật phẩm có nhãn ----
export interface SlotOpts {
  name: string; /** ký tự / chữ viết tắt thay icon khi chưa có ảnh. */ icon?: string; qty?: number;
  state?: CardState; reason?: string; rank?: number; selected?: boolean; empty?: boolean;
}
/** Mô tả ô đã chuẩn hoá: nhãn đọc cho trình đọc màn hình (tên, số lượng, trạng thái, lý do khoá), số lượng hiển thị ("x1,2K"). Hàm thuần. */
export function slotInfo(o: SlotOpts) {
  const c = cardInfo({ title: o.name, state: o.state, reason: o.reason, rank: o.rank });
  const qty = o.qty !== undefined && o.qty > 1 ? `x${abbrevNumber(o.qty)}` : null;
  return { ...c, qty, label: o.empty ? "Ô trống" : [o.name, qty ? `số lượng ${o.qty}` : "", c.state ? CARD_MARK_LABEL[c.state] : "", c.reason].filter(Boolean).join(", ") };
}
export function slotNode(o: SlotOpts, clickable = true): PNode {
  const i = slotInfo(o);
  return h(clickable ? "button" : "div", `p2-slot f2-o${o.empty ? "" : " has"}${o.selected ? " sel" : ""}${i.state ? ` p2-s-${i.state}` : ""}${i.rank !== null ? ` p2-r${i.rank}` : ""}${o.empty ? " p2-slot-empty" : ""}`, {
    attrs: { ...(clickable ? { type: "button" } : {}), "aria-label": i.label, ...(i.rank !== null ? { "data-rank": String(i.rank) } : {}), ...(i.state ? { "data-state": i.state } : {}), ...(o.selected ? { "aria-pressed": "true" } : {}), ...(i.state === "lock" && clickable ? { "aria-disabled": "true" } : {}), ...(i.reason ? { title: i.reason } : {}) },
    kids: o.empty ? [] : [
      h("span", "p2-slot-i", { text: o.icon ?? [...o.name][0] ?? "", attrs: { "aria-hidden": "true" } }),
      i.qty ? h("span", "p2-slot-q", { text: i.qty }) : null,
      i.state ? h("span", `p2-mark p2-m-${i.state}`, { attrs: { role: "img", "aria-label": CARD_MARK_LABEL[i.state] } }) : null,
    ],
  });
}


// ---- hộp xác nhận (mục thiếu #19 của kiểm kê UI/UX: hành động không đảo ngược) ----
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
 * Dựng khung màn chuẩn.
 * Nội dung màn đặt vào `body`; chọn mục điều hướng và bấm nút chính do màn gắn (`onNav`, `onPrimary`), khung không giữ trạng thái.
 */
export function screenFrame(o: FrameOpts & { onNav?: (id: string) => void; onPrimary?: () => void }): Frame {
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

/** Hộp trạng thái (mount): `onRetry` gắn vào nút Thử lại của loại lỗi. */
export function stateBox(o: StateOpts & { onRetry?: () => void }): HTMLElement {
  const e = mount(stateNode(o));
  e.querySelector(".p2-retry")?.addEventListener("click", () => o.onRetry?.());
  return e;
}

let selSeq = 0;
/** Hộp xổ: ↑ ↓ Home End Enter Space, Esc đóng danh sách (không lan lên ngăn xếp bảng khi đang mở), bấm ra ngoài đóng. `onChange` nhận giá trị mới; màn tự quyết giữ hay hoàn lại bằng `set`. */
export function select(o: SelectOpts & { onChange?: (v: string) => void }) {
  const id = `p2-sel-${++selSeq}`, root = mount(selectNode({ ...o, open: false }, id)), btn = root.querySelector<HTMLButtonElement>(".p2-sel-btn")!, list = root.querySelector<HTMLElement>(".p2-sel-list")!;
  let value = o.value, hi = -1;
  const opts = () => [...list.querySelectorAll<HTMLElement>(".p2-sel-opt")];
  const shown = () => selectedOption({ options: o.options, value })?.label ?? o.placeholder ?? "Chọn…";
  const paint = () => {
    opts().forEach((e, i) => { e.id = `${id}-${i}`; e.classList.toggle("hi", i === hi); e.classList.toggle("sel", e.dataset.v === value); e.setAttribute("aria-selected", String(e.dataset.v === value)); });
    if (hi >= 0 && !list.hidden) btn.setAttribute("aria-activedescendant", `${id}-${hi}`); else btn.removeAttribute("aria-activedescendant");
    root.querySelector(".p2-sel-v")!.textContent = shown(); btn.setAttribute("aria-label", `${o.label}: ${shown()}`);
  };
  const away = (e: Event) => { if (!root.contains(e.target as Node)) close(); };
  function close() { list.hidden = true; root.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); document.removeEventListener("pointerdown", away, true); paint(); }
  const openList = () => { if (btn.disabled) return; list.hidden = false; root.classList.add("open"); btn.setAttribute("aria-expanded", "true"); hi = Math.max(0, o.options.findIndex((x) => x.value === value)); paint(); document.addEventListener("pointerdown", away, true); };
  const pick = (i: number) => { const x = o.options[i]; if (!x || x.disabled) return; const ch = x.value !== value; value = x.value; close(); btn.focus(); if (ch) o.onChange?.(x.value); };
  btn.addEventListener("click", () => (list.hidden ? openList() : close()));
  list.addEventListener("click", (e) => { const i = opts().indexOf((e.target as HTMLElement).closest<HTMLElement>(".p2-sel-opt")!); if (i >= 0) pick(i); });
  root.addEventListener("keydown", (e) => {
    const isOpen = !list.hidden;
    if (e.key === "Escape" && isOpen) { e.stopPropagation(); close(); btn.focus(); return; }
    const move = (i: number) => { e.preventDefault(); if (!isOpen) openList(); hi = i; paint(); };
    if (e.key === "ArrowDown") move(nextEnabled(o.options, isOpen ? hi : o.options.findIndex((x) => x.value === value), 1));
    else if (e.key === "ArrowUp") move(nextEnabled(o.options, isOpen ? hi : o.options.findIndex((x) => x.value === value) < 0 ? o.options.length : o.options.findIndex((x) => x.value === value), -1));
    else if (e.key === "Home") move(nextEnabled(o.options, -1, 1));
    else if (e.key === "End") move(nextEnabled(o.options, o.options.length, -1));
    else if ((e.key === "Enter" || e.key === " ") && isOpen) { e.preventDefault(); pick(hi); }
  });
  return { root, set: (v: string) => { value = v; paint(); }, get: () => value };
}

/** Thanh trượt số lượng: kéo, nút - / +, nút Tối đa. `onChange` chỉ phát khi giá trị đổi. `setMax` khi kho đổi (giá trị tự ép lại, có phát nếu đổi). */
export function qty(o: QtyOpts & { onChange?: (n: number) => void }) {
  const root = mount(qtyNode(o)), r = root.querySelector<HTMLInputElement>(".p2-qty-r")!, out = root.querySelector<HTMLElement>(".p2-qty-v")!;
  const min = Math.trunc(o.min ?? 1), step = Math.max(1, Math.trunc(o.step ?? 1));
  let max = Math.max(min, Math.trunc(o.max)), v = clampQty(o.value ?? min, min, max, step);
  const paint = () => { r.max = String(max); r.value = String(v); out.textContent = `${v}/${max}`; };
  const set = (n: number, emit = true) => { const nv = clampQty(n, min, max, step), ch = nv !== v; v = nv; paint(); if (ch && emit) o.onChange?.(v); };
  r.addEventListener("input", () => set(Number(r.value)));
  root.querySelector(".p2-qty-minus")!.addEventListener("click", () => set(v - step));
  root.querySelector(".p2-qty-plus")!.addEventListener("click", () => set(v + step));
  root.querySelector(".p2-qty-max")!.addEventListener("click", () => set(max));
  return { root, get: () => v, set: (n: number) => set(n, false), setMax: (m: number) => { max = Math.max(min, Math.trunc(m)); set(v); } };
}

/** Tab (ngang hình thang hoặc icon dọc): bấm hoặc ← → (↑ ↓ khi dọc), Home / End; tab khoá không phát sự kiện (vẫn đọc được lý do). */
export function tabs(o: TabsOpts & { onSelect?: (id: string) => void }) {
  const root = mount(tabsNode(o));
  const all = () => [...root.querySelectorAll<HTMLElement>(".p2-tab")], ok = (e: HTMLElement) => e.getAttribute("aria-disabled") !== "true";
  const mark = (id: string) => { for (const e of all()) { const on = e.dataset.id === id; e.classList.toggle("sel", on); e.setAttribute("aria-selected", String(on)); e.tabIndex = on ? 0 : -1; } };
  root.addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>(".p2-tab"); if (b?.dataset.id && ok(b) && !b.classList.contains("sel")) { mark(b.dataset.id); o.onSelect?.(b.dataset.id); } });
  root.addEventListener("keydown", (e) => {
    const list = all().filter(ok), i = list.indexOf(document.activeElement as HTMLElement); if (i < 0) return;
    const [prev, next] = o.vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
    const to = e.key === prev ? list[Math.max(0, i - 1)] : e.key === next ? list[Math.min(list.length - 1, i + 1)] : e.key === "Home" ? list[0] : e.key === "End" ? list[list.length - 1] : null;
    if (to) { e.preventDefault(); to.focus(); if (to.dataset.id && !to.classList.contains("sel")) { mark(to.dataset.id); o.onSelect?.(to.dataset.id); } }
  });
  return { root, select: mark };
}

/** Ô vật phẩm; có `onClick` thì là nút (ô khoá không phát sự kiện, vẫn đọc được lý do). */
export function itemSlot(o: SlotOpts & { onClick?: () => void }): HTMLElement {
  const e = mount(slotNode(o, !!o.onClick));
  if (o.onClick) e.addEventListener("click", () => { if (o.state !== "lock") o.onClick!(); });
  return e;
}

/** Nút đóng ở góc phải-trên của khung màn (Esc cũng đóng qua ngăn xếp bảng, `panelStack.ts`). */
export function addCloseButton(frame: HTMLElement, close: () => void) {
  const b = document.createElement("button"); b.type = "button"; b.className = "scr-x"; b.textContent = "×"; b.setAttribute("aria-label", "Đóng (Esc)"); b.title = "Đóng · Esc";
  b.addEventListener("click", close); frame.querySelector(".p2-hd")?.append(b);
}

export interface SearchOpts { label: string; value?: string; placeholder?: string; maxLength?: number; onInput: (q: string) => void }
/** Ô tìm dùng chung (UI v2): `type=search`, gõ chữ không kích phím tắt game, Esc xoá chữ trước (hết chữ mới để Esc đóng bảng). Khớp không dấu do `matchQuery` / `filterByQuery`. */
export function searchField(o: SearchOpts) {
  const root = document.createElement("label"); root.className = "p2-search";
  const input = document.createElement("input"); input.type = "search"; input.value = o.value ?? ""; input.placeholder = o.placeholder ?? "Tìm theo tên (không cần dấu)";
  input.setAttribute("aria-label", o.label); input.autocomplete = "off"; input.maxLength = o.maxLength ?? 32;
  // bộ gõ composition (macOS / Gboard / iOS): đang dựng chữ thì không báo (bên nhận có thể vẽ lại ô và cắt chữ), xong mới báo một lần
  input.addEventListener("input", (e) => { if (!(e as InputEvent).isComposing) o.onInput(input.value); });
  input.addEventListener("compositionend", () => o.onInput(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !input.value) return;   // hết chữ: để Esc đóng bảng như thường
    e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); input.value = ""; o.onInput(""); }
  });
  root.append(input);
  return { root, input };
}

let whySeq = 0;
/**
 * Nút chính đang khoá thì nói rõ vì sao (nguyên tắc 5 của bộ spec; kiểm kê #24): chèn dòng `.p2-why` ngay trước nút và nối `aria-describedby`.
 * Chỉ chạy khi nút đã nằm trong cây, đang `disabled` và có lý do; không đổi gì khác. Trả dòng lý do (hoặc null).
 */
export function lockWhy(b: HTMLButtonElement, reason: string | null | undefined): HTMLElement | null {
  if (!b.disabled || !reason?.trim() || !b.parentElement) return null;
  const w = document.createElement("span"); w.className = "p2-why p2-why-btn"; w.id = `p2-why-${++whySeq}`; w.textContent = reason.trim();
  b.setAttribute("aria-describedby", w.id); b.before(w);
  return w;
}
