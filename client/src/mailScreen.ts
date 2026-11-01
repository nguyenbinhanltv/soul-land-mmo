// UI v2, màn Thư (docs/design/thu.md "Giao diện", #1336, Part of #877). Chỉ hiển thị tin riêng `mail` của server và gửi ý định
// `mail {op:"get"|"read"|"claim"|"claimAll"|"del", id}`: thư, đính kèm, hạn, đã đọc / đã nhận đều do server quyết định; client không tạo thư và không tự cộng quà.
import { MAIL, formatHonTe, itemDef, mailDaysLeft } from "../../shared/data.ts";
import { abbrevNumber, screenFrame, stateBox, mount, addCloseButton, type PNode } from "./uiParts.ts";

export interface MailView {
  id: number; from: string; title: string; body: string; honTe: number; items: { code: string; qty: number }[];
  at: number; exp: number; read: boolean; claimed: boolean;
}
export interface MailMsg {
  list: MailView[]; unread: number; pending: number;
  claimedNow?: { count: number; honTe: number; items: { code: string; qty: number }[] }; err?: string;
}
export type MailFilter = "all" | "unread" | "gift";
export type MailState = "new" | "gift" | "read" | "claimed";

/** Thư có đính kèm (Hồn Tệ hoặc vật phẩm) không. */
export const mailHasGift = (m: Pick<MailView, "honTe" | "items">) => m.honTe > 0 || m.items.length > 0;
/** Trạng thái hiện của một thư: quà chờ nhận thắng "mới"; đã nhận / đã đọc là hai trạng thái còn lại. Hàm thuần (test). */
export function mailStateOf(m: MailView): MailState {
  if (mailHasGift(m) && !m.claimed) return "gift";
  if (!m.read) return "new";
  return m.claimed ? "claimed" : "read";
}
/** Thư theo bộ lọc: tất cả / chưa đọc / còn quà chờ nhận. */
export const mailFilter = (list: MailView[], f: MailFilter) => f === "unread" ? list.filter((m) => !m.read) : f === "gift" ? list.filter((m) => mailHasGift(m) && !m.claimed) : list;
/** Số thư cần chú ý (chưa đọc hoặc còn quà chờ nhận) = số ở chấm đỏ hub; đếm thư, không cộng hai lần thư vừa chưa đọc vừa có quà. */
export const mailBadgeCount = (m: Pick<MailMsg, "list">) => (Array.isArray(m.list) ? m.list : []).filter((x) => !x.read || (mailHasGift(x) && !x.claimed)).length;
/** Mã thư còn quà chờ nhận (số lượng nút "Nhận tất cả"; server nhận tối đa MAIL.claimAllMax mỗi lần). */
export const mailGiftIds = (m: Pick<MailMsg, "list">) => m.list.filter((x) => mailHasGift(x) && !x.claimed).map((x) => x.id);
/** Nhãn hạn của thư tại `now` (ms): số ngày còn lại; `soon` khi ≤ MAIL.warnDays (hiện nhãn cảnh báo bằng chữ, không chỉ màu). */
export function mailExpiry(exp: number, now: number): { days: number; soon: boolean; text: string } {
  const days = mailDaysLeft(exp, now), soon = days <= MAIL.warnDays;
  return { days, soon, text: days <= 0 ? "Hết hạn hôm nay" : soon ? `Sắp hết hạn: còn ${days} ngày` : `Còn ${days} ngày` };
}
/** Đính kèm một thư thành các dòng chữ ngắn (tên / số từ `ITEMS`, không chép số vào client). */
export const mailGiftParts = (m: Pick<MailView, "honTe" | "items">) =>
  [...(m.honTe ? [`${abbrevNumber(m.honTe)} Hồn Tệ`] : []), ...m.items.map((x) => `${itemDef(x.code)?.name ?? x.code} ×${x.qty}`)];
/** Dòng kết quả lần vừa nhận. */
export function mailClaimedLine(c: NonNullable<MailMsg["claimedNow"]>): string {
  const got = [...(c.honTe ? [formatHonTe(c.honTe)] : []), ...c.items.map((x) => `${itemDef(x.code)?.name ?? x.code} ×${x.qty}`)];
  return `Nhận ${c.count} thư: ${got.join(", ") || "quà"}.`;
}
/** Nút chính: nhãn, khoá và lý do (nguyên tắc 5 của bộ spec: nút khoá luôn nói vì sao). */
export function mailPrimary(m: MailMsg | null, busy: boolean): { label: string; disabled: boolean; reason?: string } {
  const label = "Nhận tất cả";
  if (!m) return { label, disabled: true, reason: "Đang tải…" };
  if (busy) return { label, disabled: true, reason: "Đang gửi…" };
  const n = mailGiftIds(m).length;
  return n ? { label: `${label} (${n})`, disabled: false } : { label, disabled: true, reason: "Không có thư nào chờ nhận" };
}

// ---- phần DOM ----
let send: ((type: string, payload: unknown) => void) | null = null;
let onChange: (n: number) => void = () => {};
let msg: MailMsg | null = null, filter: MailFilter = "all", sel = 0, busy = false, failed = false, note: { text: string; err: boolean } | null = null, timer = 0;
const el = () => document.getElementById("mail");
const BUSY_MS = 6000;
// Giữ dòng vừa mở trong Chưa đọc để nội dung không biến mất khi read được xác nhận.
let reading = 0;
const visibleList = () => !msg ? [] : filter === "unread" && reading
  ? msg.list.filter((m) => !m.read || m.id === reading) : mailFilter(msg.list, filter);

export function bindMail(sender: (type: string, payload: unknown) => void, changed: (n: number) => void) { send = sender; onChange = changed; }
export const isMailOpen = () => { const e = el(); return !!e && !e.hidden; };
function load() { failed = false; send?.("mail", { op: "get" }); window.clearTimeout(timer); timer = window.setTimeout(() => { if (!msg && isMailOpen()) { failed = true; render(); } }, BUSY_MS); }
export function openMail() { const e = el(); if (!e || !send) return; e.hidden = false; note = null; busy = false; load(); render(); }
export function closeMail() { const e = el(); if (e) e.hidden = true; reading = 0; window.clearTimeout(timer); }

export function onMail(m: MailMsg) {
  if (!m || !Array.isArray(m.list) || typeof m.pending !== "number") return;
  msg = m; failed = false; window.clearTimeout(timer); busy = false;
  if (m.err) note = { text: m.err, err: true }; else if (m.claimedNow) note = { text: mailClaimedLine(m.claimedNow), err: false };
  if (sel && !m.list.some((x) => x.id === sel)) { sel = 0; reading = 0; }
  onChange(mailBadgeCount(m));
  render();
}

/** Gửi một yêu cầu ghi; bộ đếm chờ để màn không treo khi server im (server bỏ tin quá nhịp). */
function act(op: "claim" | "claimAll" | "del", id?: number) {
  if (!send || busy) return;
  busy = true; note = null; send("mail", id === undefined ? { op } : { op, id });
  window.clearTimeout(timer); timer = window.setTimeout(() => { if (busy) { busy = false; note = { text: "Máy chủ chưa trả lời: thử lại sau.", err: true }; render(); } }, BUSY_MS);
  render();
}
/** Mở một thư: chọn, và đánh dấu đã đọc (cập nhật ngay trên màn; server là nguồn đúng, tin trả về ghi đè). */
function select(id: number) {
  const m = visibleList().find((x) => x.id === id);
  if (!m) return;
  reading = filter === "unread" && (!m.read || reading === id) ? id : 0;
  sel = id; note = null;
  if (m && !m.read) { m.read = true; send?.("mail", { op: "read", id }); if (msg) onChange(mailBadgeCount(msg)); }
  render();
}

const h = (tag: string, cls: string, o: { text?: string; attrs?: Record<string, string>; kids?: (PNode | null)[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids.filter((k): k is PNode => !!k) } : {}) });
const MARK: Record<MailState, string> = { new: "Mới", gift: "Có quà", read: "Đã đọc", claimed: "■ Đã nhận" };
const dayText = (t: number) => new Date(t).toLocaleDateString("vi-VN");

/** Một dòng danh sách: dấu trạng thái bằng chữ, tiêu đề, người gửi + ngày, nhãn hạn. Hàm thuần (test). */
export function mailRowNode(m: MailView, selected: boolean, now: number): PNode {
  const st = mailStateOf(m), ex = mailExpiry(m.exp, now);
  return h("li", "", { kids: [h("button", `ml-row ml-${st}${selected ? " ml-sel" : ""}`, { attrs: { type: "button", "data-id": String(m.id), "data-st": st, "aria-pressed": selected ? "true" : "false" }, kids: [
    h("span", "ml-mark", { text: MARK[st] }),
    h("b", "ml-title", { text: m.title }),
    h("small", "ml-meta", { text: `${m.from} · ${dayText(m.at)}` }),
    ex.soon && !m.claimed ? h("small", "ml-exp", { text: ex.text }) : null,
  ] })] });
}
/** Khung đọc thư: tiêu đề, người gửi, nội dung, đính kèm, hạn, nút Nhận / Xóa. Hàm thuần (test). */
export function mailDetailNode(m: MailView | null, busyNow: boolean, now: number): PNode {
  if (!m) return h("div", "ml-detail ml-empty", { text: "Chọn một thư ở bên trái để đọc.", attrs: { role: "status" } });
  const gift = mailGiftParts(m), ex = mailExpiry(m.exp, now), canDel = m.claimed || !mailHasGift(m);
  return h("article", "ml-detail", { attrs: { "aria-label": `Thư: ${m.title}` }, kids: [
    h("h3", "ml-dt", { text: m.title }),
    h("small", "ml-meta", { text: `Từ ${m.from} · ${dayText(m.at)} · ${ex.text}` }),
    m.body ? h("p", "ml-body", { text: m.body }) : null,
    gift.length ? h("div", "ml-att", { kids: [h("b", "", { text: m.claimed ? "Đính kèm (đã nhận)" : "Đính kèm" }), h("span", "", { text: gift.join(" · ") })] }) : null,
    h("div", "ml-act", { kids: [
      mailHasGift(m) && !m.claimed ? h("button", "ml-claim f2-nut-phu", { text: "Nhận", attrs: { type: "button", "data-id": String(m.id), ...(busyNow ? { disabled: "", title: "Đang gửi…" } : {}) } }) : null,
      canDel ? h("button", "ml-del f2-nut-phu", { text: "Xóa", attrs: { type: "button", "data-id": String(m.id), ...(busyNow ? { disabled: "", title: "Đang gửi…" } : {}) } }) : h("small", "ml-hint", { text: "Nhận quà rồi mới xóa được thư này." }),
    ] }),
  ] });
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  const list = visibleList(), now = Date.now(), cur = list.find((x) => x.id === sel) ?? null;
  if (!cur) { sel = 0; reading = 0; }
  const dots: Record<MailFilter, boolean> = { all: false, unread: !!msg?.list.some((x) => !x.read), gift: !!msg && mailGiftIds(msg).length > 0 };
  const f = screenFrame({
    material: "giay", title: "Thư", badge: "信", info: `Thư do hệ thống gửi (Phúc Lợi, Bí Cảnh, quản trị). Quà đính kèm nhận một lần, thư giữ ${MAIL.ttlDays} ngày; chỉ máy chủ tạo và kiểm thư.`,
    nav: ([["all", "Tất cả"], ["unread", "Chưa đọc"], ["gift", "Có quà"]] as const).map(([id, label]) => ({ id, label, active: filter === id, dot: dots[id] })),
    primary: mailPrimary(msg, busy), onPrimary: () => act("claimAll"), onNav: (id) => { if (filter !== id) reading = 0; filter = id as MailFilter; note = null; render(); },
  });
  if (!msg) f.body.append(failed
    ? stateBox({ kind: "error", text: "Không tải được thư (mất kết nối hoặc máy chủ chưa trả lời).", hint: "Kiểm tra mạng rồi bấm Thử lại.", onRetry: () => { load(); render(); } })
    : stateBox({ kind: "loading", rows: 5, text: "Đang tải thư…" }));
  else {
    const kids: PNode[] = [];
    if (note) kids.push(h("div", `ml-note${note.err ? " ml-bad" : ""}`, { text: note.text, attrs: { role: note.err ? "alert" : "status" } }));
    if (!msg.list.length) kids.push(h("div", "ml-blank", { text: "Hộp thư trống. Phần thưởng Phúc Lợi, Bí Cảnh hoặc quà từ quản trị sẽ về đây.", attrs: { role: "status" } }));
    else kids.push(h("div", "ml-cols", { kids: [
      list.length ? h("ul", "ml-list", { attrs: { "aria-label": "Danh sách thư" }, kids: list.map((m) => mailRowNode(m, m.id === sel, now)) }) : h("div", "ml-blank", { text: "Không có thư nào trong mục này.", attrs: { role: "status" } }),
      mailDetailNode(cur, busy, now),
    ] }));
    f.body.append(mount(h("div", "ml-wrap", { kids })));
    f.body.querySelector(".ml-list")?.addEventListener("click", (e) => { const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".ml-row"); if (b?.dataset.id) select(Number(b.dataset.id)); });
    f.body.querySelector(".ml-claim")?.addEventListener("click", (e) => { const id = Number((e.currentTarget as HTMLElement).dataset.id); if (id) act("claim", id); });
    f.body.querySelector(".ml-del")?.addEventListener("click", (e) => { const id = Number((e.currentTarget as HTMLElement).dataset.id); if (id) act("del", id); });
  }
  addCloseButton(f.root, closeMail);
  root.replaceChildren(f.root);
}
