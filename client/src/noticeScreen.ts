// UI v2, hộp "Thông báo" ở rail hub (đợt 4b, Part of #885; kiểm kê UI/UX, thiếu #21): đọc lại 50 toast gần nhất (nhận đồ, nhiệm vụ, boss, tin chung) từ nhật ký
// của `feedback.ts`. Chỉ hiển thị phía client, không có tin server; mọi chữ qua textContent. Dựng lại khi nhật ký đổi lúc hộp đang mở.
import { screenFrame, stateBox, mount, addCloseButton, type PNode } from "./uiParts.ts";
import { notices, onNotices, clearNotices, NOTICE_LABEL, LOG_MAX, type Notice } from "./noticeLog.ts";

const el = () => document.getElementById("notice");
let stop: (() => void) | null = null;

export const isNoticeOpen = () => { const e = el(); return !!e && !e.hidden; };
export function openNotice() { const e = el(); if (!e) return; e.hidden = false; stop?.(); stop = onNotices(render); render(); }
export function closeNotice() { const e = el(); if (e) e.hidden = true; stop?.(); stop = null; }

const pad = (n: number) => String(n).padStart(2, "0");
/** Giờ hiện của một dòng: "HH:MM" theo giờ máy (hộp chỉ để đọc lại, không dùng làm mốc game). */
export const noticeTime = (t: number) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const h = (tag: string, cls: string, o: { text?: string; attrs?: Record<string, string>; kids?: (PNode | null)[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids.filter((k): k is PNode => !!k) } : {}) });

/** Một dòng: giờ, nhãn loại (chữ, không chỉ màu), tiêu đề, "×n" khi gộp, dòng phụ. Hàm thuần (test). */
export function noticeNode(n: Notice): PNode {
  return h("li", "nt-row", { attrs: { "data-k": n.kind }, kids: [
    h("time", "nt-t", { text: noticeTime(n.t) }),
    h("span", "nt-k", { text: NOTICE_LABEL[n.kind] }),
    h("span", "nt-b", { kids: [
      h("b", "nt-title", { text: n.n > 1 ? `${n.title} ×${n.n}` : n.title }),
      n.sub ? h("small", "nt-sub", { text: n.sub }) : null,
    ] }),
  ] });
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  const list = notices(), f = screenFrame({
    material: "giay", title: "Thông báo", badge: "報", info: `Giữ ${LOG_MAX} thông báo gần nhất của phiên này; tải lại trang thì mất. Chỉ để đọc lại.`,
    primary: { label: "Xoá hết", disabled: !list.length, reason: list.length ? undefined : "Chưa có thông báo nào" }, onPrimary: () => clearNotices(),
  });
  if (!f) return;
  if (!list.length) f.body.append(stateBox({ kind: "empty", text: "Chưa có thông báo.", hint: "Nhận đồ, nhiệm vụ, boss… sẽ hiện ở đây." }));
  else f.body.append(mount(h("ol", "nt-list", { attrs: { "aria-label": "Thông báo gần đây, mới nhất ở trên" }, kids: [...list].reverse().map(noticeNode) })));
  addCloseButton(f.root, closeNotice);
  root.replaceChildren(f.root);
}
