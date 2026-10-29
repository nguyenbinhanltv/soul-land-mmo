// Thẻ thao tác nhanh và bảng so sánh hai cột (NV3 của #453, mục 5.16 ở GAME_DESIGN.md). Chỉ DOM: nút nào có và gửi lệnh gì do nơi gọi quyết
// (`cardActions` / `quickCommand` ở charBagContract.ts); số liệu so sánh từ `compareRows` (bag.ts, số ở shared/data.ts). Server vẫn quyết định.
import type { CardAction, CardActionId } from "./charBagContract.ts";
import { type CmpRow, rowTone } from "./bag.ts";

const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => {
  const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e;
};
const host = () => document.body; // position: fixed theo cửa sổ, không theo #stage (có thể bị biến đổi)

let card: HTMLElement | null = null, cardOff: (() => void) | null = null, cardId: string | null = null;
/** Đóng thẻ thao tác (nếu đang mở). */
export function hideCard() { card?.remove(); card = null; cardId = null; cardOff?.(); cardOff = null; }
export const cardOpen = () => card !== null;
/** Id món mà thẻ / bảng so sánh đang mở cho (null = không mở): bảng vẽ lại thấy món biến mất thì đóng, không để nút chạy với món cũ. */
export const cardFor = () => cardId;

/**
 * Mở thẻ bên cạnh ô `anchor`: tiêu đề tô `color`, mỗi `CardAction` một nút (nút chính tô nổi); bấm nút thì đóng thẻ rồi gọi `run(id)`.
 * Đóng khi bấm ra ngoài, Esc, cuộn. Nút đầu tiên được focus để Enter chạy ngay (phím: Enter mở thẻ, Enter lần nữa = nút chính).
 */
export function showCard(anchor: HTMLElement, title: string, color: string, sub: string, actions: CardAction[], run: (id: CardActionId) => void, itemId: string | null = null) {
  hideCard(); cardId = itemId;
  const c = mk("div", "acard f2-muc-nho"); c.setAttribute("role", "dialog"); c.setAttribute("aria-label", `Thao tác: ${title}`);
  c.style.setProperty("--c", color);
  const h = mk("b", "", title); c.appendChild(h);
  if (sub) c.appendChild(mk("small", "", sub));
  const row = mk("div", "arow");
  for (const a of actions) {
    const b = mk("button", "buse" + (a.primary ? " absorb" : a.id === "salvage" ? " drop" : " use") + (a.primary ? " f2-nut-chinh" : " f2-nut-phu"), a.label); b.type = "button"; b.dataset.act = a.id;
    b.addEventListener("click", () => { b.blur(); hideCard(); run(a.id); });
    row.appendChild(b);
  }
  c.appendChild(row);
  host().appendChild(c); card = c;
  const r = anchor.getBoundingClientRect(), w = c.offsetWidth, hgt = c.offsetHeight, vw = innerWidth, vh = innerHeight;
  const left = Math.max(4, Math.min(vw - w - 4, r.left + r.width / 2 - w / 2));
  const top = r.bottom + 6 + hgt <= vh ? r.bottom + 6 : Math.max(4, r.top - hgt - 6); // hết chỗ phía dưới thì mở lên trên
  c.style.left = `${left}px`; c.style.top = `${top}px`;
  (row.querySelector("button") as HTMLElement | null)?.focus({ preventScroll: true });
  const away = (e: Event) => { if (!c.contains(e.target as Node)) hideCard(); };
  const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); hideCard(); anchor.isConnected && anchor.focus({ preventScroll: true }); } };
  setTimeout(() => document.addEventListener("pointerdown", away, true), 0); // không bắt chính cú bấm vừa mở thẻ
  document.addEventListener("keydown", key, true); document.addEventListener("scroll", hideCard, true);
  cardOff = () => { document.removeEventListener("pointerdown", away, true); document.removeEventListener("keydown", key, true); document.removeEventListener("scroll", hideCard, true); };
}

let dlg: HTMLElement | null = null, dlgOff: (() => void) | null = null, dlgId: string | null = null;
/** Đóng bảng so sánh (nếu đang mở), gỡ luôn nghe phím Esc. */
export function hideCompare() { dlg?.remove(); dlg = null; dlgId = null; dlgOff?.(); dlgOff = null; }
export const compareOpen = () => dlg !== null;
export const compareFor = () => dlgId;

export interface CompareSpec {
  /** tên + màu món đang mặc (null = ô trống) và món mới */
  cur: { name: string; color: string } | null; neu: { name: string; color: string };
  itemId: string; rows: CmpRow[]; /** nhãn nút gắn ("Mặc" / "Gắn"), null = không có nút */ mount: string | null; onMount(): void;
}
/**
 * Bảng so sánh hai cột [Đang mặc] | [Món mới]: mỗi chỉ số một hàng, cột mới có ▲ xanh (tăng) / ▼ đỏ (giảm) / = (không đổi) kèm chữ, không chỉ màu.
 * Số do `compareRows` đưa; bảng không tự tính.
 */
export function showCompare(sp: CompareSpec) {
  hideCompare(); dlgId = sp.itemId;
  const d = mk("div", "cmpdlg f2-giay-nho"); d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "So sánh trang bị");
  const head = mk("div", "chead");
  head.innerHTML = `<b>So sánh</b><button class="x" type="button" aria-label="Đóng">×</button>`;
  head.querySelector(".x")!.addEventListener("click", hideCompare);
  d.appendChild(head);
  const grid = mk("div", "cgrid");
  const th = (label: string, who: { name: string; color: string } | null) => {
    const c = mk("div", "cth"); c.appendChild(mk("small", "", label));
    const n = mk("b", "", who?.name ?? "Ô trống"); if (who) n.style.color = who.color; c.appendChild(n); return c;
  };
  grid.append(mk("div", "cth"), th("Đang mặc", sp.cur), th("Món mới", sp.neu));
  for (const r of sp.rows) {
    const u = r.pct ? "%" : "", f = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
    const tone = rowTone(r), arrow = r.d > 0 ? "▲ +" : r.d < 0 ? "▼ −" : "=";
    const neu = mk("div", `cnew t-${tone}`);
    neu.append(mk("span", "", r.newText ?? `${f(r.neu)}${u}`), mk("em", "", r.d ? `${arrow}${f(Math.abs(r.d))}${u}` : "="));
    grid.append(mk("div", "ck", r.k), mk("div", "cold", r.oldText ?? (r.old || sp.cur ? `${f(r.old)}${u}` : "—")), neu);
  }
  if (!sp.rows.length) grid.appendChild(mk("small", "cnone", "Không có chỉ số để so sánh."));
  d.appendChild(grid);
  const foot = mk("div", "brow");
  if (sp.mount) { const b = mk("button", "buse absorb f2-nut-chinh", sp.mount); b.type = "button"; b.addEventListener("click", () => { b.blur(); hideCompare(); sp.onMount(); }); foot.appendChild(b); }
  const x = mk("button", "buse f2-nut-phu", "Đóng"); x.type = "button"; x.addEventListener("click", hideCompare); foot.appendChild(x);
  d.appendChild(foot);
  host().appendChild(d); dlg = d;
  (foot.querySelector("button") as HTMLElement).focus({ preventScroll: true });
  const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); hideCompare(); } };
  document.addEventListener("keydown", key, true); dlgOff = () => document.removeEventListener("keydown", key, true);
}
