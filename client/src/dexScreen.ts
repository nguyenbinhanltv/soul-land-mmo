// Sổ tay hồn thú (docs/design/hon-thu-boss.md "Sổ tay hồn thú", #1720, Part of #1714). Chỉ hiển thị tin riêng `dex` của server và gửi `dex {op:"get"}`:
// loài đã gặp / số lần hạ do server ghi, client không khai được. Danh mục loài đọc từ `BEASTS` (shared/data.ts); loài chưa gặp hiện "???" (không lộ tên).
import { BEASTS } from "../../shared/data.ts";
import { screenFrame, stateBox, mount, addCloseButton, type PNode } from "./uiParts.ts";

export interface DexMsg { set: Record<string, number>; full?: boolean }
export interface DexRowView { id: string; name: string; seen: boolean; kills: number }

const known = new Map<string, number>(); // mã loài (BEASTS[].id) -> số lần hạ; có khóa = đã gặp
let loaded = false, failed = false, timer = 0;
let send: ((type: string, payload: unknown) => void) | null = null;
const el = () => document.getElementById("dex");
const WAIT_MS = 6000;

export function bindDex(sender: (type: string, payload: unknown) => void) { send = sender; }
/** Loài (mã BEASTS) đã có trong sổ tay: tên hiện từ xa trên bản đồ (beastNameSeen). */
export const dexKnown = (id: string | undefined) => !!id && known.has(id);
/** Danh sách dòng theo thứ tự `BEASTS`: loài chưa gặp giấu tên. Hàm thuần theo `known` (test). */
export function dexRows(src: ReadonlyMap<string, number> = known): DexRowView[] {
  return BEASTS.map((b) => { const seen = src.has(b.id); return { id: b.id, name: seen ? b.name : "???", seen, kills: src.get(b.id) ?? 0 }; });
}
/** Tóm tắt: "Đã gặp x / y loài · đã hạ z loài". */
export function dexSummary(rows: readonly DexRowView[]): string {
  return `Đã gặp ${rows.filter((r) => r.seen).length} / ${rows.length} loài · đã hạ ${rows.filter((r) => r.kills > 0).length} loài`;
}

/** Nhận tin `dex` của server: `full` thay hết, không thì gộp từng loài (không bao giờ giảm số lần hạ). */
export function onDex(m: DexMsg) {
  if (!m || typeof m.set !== "object" || !m.set) return;
  if (m.full) known.clear();
  for (const [k, n] of Object.entries(m.set)) if (Number.isFinite(n)) known.set(k, Math.max(known.get(k) ?? 0, Math.floor(n)));
  loaded = true; failed = false; window.clearTimeout(timer);
  render();
}
export const isDexOpen = () => { const e = el(); return !!e && !e.hidden; };
function load() {
  if (!send) return;
  failed = false; window.clearTimeout(timer);
  timer = window.setTimeout(() => { if (!loaded && isDexOpen()) { failed = true; render(); } }, WAIT_MS);
  send("dex", { op: "get" });
}
export function openDex() { const e = el(); if (!e || !send) return; e.hidden = false; load(); render(); }
export function closeDex() { const e = el(); if (e) e.hidden = true; window.clearTimeout(timer); }

const h = (tag: string, cls: string, o: { text?: string; attrs?: Record<string, string>; kids?: PNode[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids } : {}) });
/** Một dòng: tên (hoặc ???), trạng thái bằng chữ (không chỉ màu). Hàm thuần (test). */
export function dexRowNode(r: DexRowView): PNode {
  const st = !r.seen ? "Chưa gặp" : r.kills > 0 ? `Đã hạ ${r.kills.toLocaleString("vi-VN")} lần` : "Đã gặp, chưa hạ";
  return h("li", `av-row av-${r.seen ? (r.kills > 0 ? "claimed" : "ready") : "todo"}`, { attrs: { "data-id": r.id, "data-st": r.seen ? (r.kills > 0 ? "killed" : "seen") : "unseen" }, kids: [
    h("div", "av-main", { kids: [h("b", "av-name", { text: r.name }), h("small", "av-prog", { text: st })] }),
  ] });
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  const rows = dexRows();
  const f = screenFrame({ material: "giay", title: "Sổ Tay Hồn Thú", badge: "獸", info: "Loài hồn thú thường đã gặp (lại gần) hoặc đã hạ thì tên hiện từ xa trên bản đồ. Máy chủ ghi sổ, không khai tay được." });
  if (!loaded) f.body.append(failed
    ? stateBox({ kind: "error", text: "Không tải được sổ tay (mất kết nối hoặc máy chủ chưa trả lời).", hint: "Kiểm tra mạng rồi bấm Thử lại.", onRetry: () => { load(); render(); } })
    : stateBox({ kind: "loading", rows: 5, text: "Đang tải sổ tay…" }));
  else f.body.append(mount(h("div", "av-wrap", { kids: [
    h("div", "av-note", { text: dexSummary(rows), attrs: { role: "status" } }),
    h("ul", "av-list", { attrs: { "aria-label": "Loài hồn thú" }, kids: rows.map(dexRowNode) }),
  ] })));
  addCloseButton(f.root, closeDex);
  root.replaceChildren(f.root);
}
