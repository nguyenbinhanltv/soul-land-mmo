// UI v2, màn Phúc Lợi / Sổ Điểm Danh 21 ngày (docs/design/phuc-loi.md "Giao diện", Part of #877). Chỉ hiển thị tin riêng `welfare` của server (#1207) và gửi ý định
// `welfare {op:"get"|"sign"|"makeup", day?, pay?}`: client không gửi giờ / ngày, chỉ chỉ số ô; ô nào ký được, phí ký bù, quà đều do server kiểm lại.
import { CHECKIN, checkinCount, formatHonTe, itemDef } from "../../shared/data.ts";
import { abbrevNumber, countdown, screenFrame, mount, addCloseButton, type PNode } from "./uiParts.ts";
import { serverNow, syncServerNow } from "./svClock.ts";
import { artImg, tintedUrl } from "./uiArt.ts";

export interface WelfareMsg {
  cycle: number; day: number; mask: number; now: number; endsAt: number; makeupLeft: number; free: number; fee: number | null;
  signed?: { day: number; makeup: boolean; fee: number; honTe: number; items: { code: string; qty: number }[] }; err?: string;
}
export type CellState = "signed" | "today" | "makeup" | "missed" | "future";

const bit = (mask: number, i: number) => (mask & (1 << i)) !== 0;
/** Hôm nay đã điểm danh (có chu kỳ đang chạy và ô hôm nay đã ký). */
export const signedToday = (m: WelfareMsg) => m.day >= 0 && bit(m.mask, m.day);
/** Cần điểm danh hôm nay (chấm đỏ ở hub): chưa có chu kỳ đang chạy, hoặc ô hôm nay chưa ký. */
export const needsSign = (m: WelfareMsg) => !signedToday(m);

/**
 * Trạng thái ô `i` (0-based): đã ký / hôm nay / ký bù được (đã qua, chưa ký, còn lượt) / bỏ lỡ (đã qua, chưa ký, hết lượt) / tương lai.
 * Chưa có chu kỳ đang chạy (`day` −1): ô 0 là "hôm nay" (điểm danh mở chu kỳ mới), còn lại tương lai.
 */
export function cellState(i: number, m: WelfareMsg): CellState {
  if (bit(m.mask, i) && m.day >= 0) return "signed";
  const day = m.day < 0 ? 0 : m.day;
  if (i === day) return "today";
  if (i > day) return "future";
  return m.makeupLeft > 0 ? "makeup" : "missed";
}
export const isMilestone = (i: number) => (CHECKIN.milestones as readonly number[]).includes(i);

/** Quà ô `i` thành các dòng chữ ngắn (số / tên từ `CHECKIN` và `ITEMS`, không chép số vào client). */
export function rewardParts(i: number): string[] {
  const r = CHECKIN.rewards[i]; if (!r) return [];
  return [...(r.honTe ? [`${abbrevNumber(r.honTe)} Hồn Tệ`] : []), ...(r.shards ? [`Mảnh ×${r.shards}`] : []), ...(r.items ?? []).map((x) => `${itemDef(x.code)?.name ?? x.code} ×${x.qty}`)];
}
/** Mã ảnh chung của mảnh võ hồn (loại mảnh do server chọn ngẫu nhiên nên ô chỉ có một icon chung; ảnh xám tô màu vàng SR / SSR). */
export const SHARD_ITEM = "manh_vo_hon";
const SHARD_COL = "#e0a458";
/** Mã vật phẩm có sẵn trong game để vẽ icon quà ô `i` (vật phẩm của ô, mảnh võ hồn nếu có `shards`); Hồn Tệ không có icon riêng nên chỉ ghi chữ. */
export function rewardIcons(i: number): string[] {
  const r = CHECKIN.rewards[i]; if (!r) return [];
  return [...(r.items ?? []).map((x) => x.code), ...(r.shards ? [SHARD_ITEM] : [])];
}
/** `<img>` icon của một mã vật phẩm: ảnh riêng `item_<mã>`, rồi ảnh chung theo nhóm (mảnh võ hồn là ảnh xám tô theo `col` của món); không có ảnh thì "". */
function iconHtml(code: string): string {
  if (code === SHARD_ITEM) { const u = tintedUrl(`item_${SHARD_ITEM}`, SHARD_COL); return u ? `<img class="wf-img" src="${u}" alt="" draggable="false">` : ""; }
  const kind = itemDef(code)?.kind;
  return artImg(`item_${code}`, "wf-img") || (kind ? artImg(`item_${kind}`, "wf-img") : "");
}
/** Kết quả lần vừa ký (tin `signed`) thành một dòng. */
export function signedLine(s: NonNullable<WelfareMsg["signed"]>): string {
  const got = [...(s.honTe ? [`${s.honTe} Hồn Tệ`] : []), ...s.items.map((x) => `${itemDef(x.code)?.name ?? x.code} ×${x.qty}`)];
  return `${s.makeup ? "Ký bù" : "Điểm danh"} ô ${s.day + 1}${s.fee ? ` (phí ${formatHonTe(s.fee)})` : ""}: nhận ${got.join(", ") || "quà"}.`;
}
/** Nút chính: nhãn, khoá và lý do (nguyên tắc 5 của bộ spec: nút khoá luôn nói vì sao). */
export function primaryOf(m: WelfareMsg | null, busy: boolean): { label: string; disabled: boolean; reason?: string } {
  if (!m) return { label: "Điểm danh hôm nay", disabled: true, reason: "Đang tải…" };
  const label = m.day < 0 ? "Bắt đầu chu kỳ mới" : "Điểm danh hôm nay";
  if (busy) return { label, disabled: true, reason: "Đang gửi…" };
  if (signedToday(m)) return { label: "Đã điểm danh", disabled: true, reason: "Hôm nay đã điểm danh, mai quay lại" };
  return { label, disabled: false };
}
/** 00:00 kế tiếp giờ Việt Nam (UTC+7, không đổi giờ mùa hè) tính từ `now` (ms), chỉ để đếm lùi hiển thị. */
export const nextMidnightVn = (now: number) => (Math.floor((now + 7 * 3_600_000) / 86_400_000) + 1) * 86_400_000 - 7 * 3_600_000;
/** Chữ phí ký bù kế tiếp: miễn phí / số Hồn Tệ / hết lượt. */
export const feeText = (fee: number | null) => fee === null ? "Hết lượt ký bù" : fee === 0 ? "Ký bù miễn phí" : `Ký bù: ${formatHonTe(fee)}`;

// ---- phần DOM ----
let send: ((type: string, payload: unknown) => void) | null = null;
let onChange: (needs: boolean) => void = () => {};
let msg: WelfareMsg | null = null, busy = false, confirmDay: number | null = null, note: { text: string; err: boolean } | null = null, timer = 0, stops: (() => void)[] = [];
const el = () => document.getElementById("welfare");
const BUSY_MS = 6000;

export function bindWelfare(sender: (type: string, payload: unknown) => void, changed: (needs: boolean) => void) { send = sender; onChange = changed; }
export const isWelfareOpen = () => { const e = el(); return !!e && !e.hidden; };
export function openWelfare() { const e = el(); if (!e || !send) return; e.hidden = false; confirmDay = null; send("welfare", { op: "get" }); render(); }
export function closeWelfare() { const e = el(); if (e) e.hidden = true; confirmDay = null; for (const s of stops) s(); stops = []; }

export function onWelfare(m: WelfareMsg) {
  if (!m || typeof m.mask !== "number" || typeof m.day !== "number") return;
  syncServerNow(m.now); msg = m; busy = false; confirmDay = null; window.clearTimeout(timer);
  if (m.err) note = { text: m.err, err: true }; else if (m.signed) note = { text: signedLine(m.signed), err: false };
  onChange(needsSign(m)); render();
}

function act(op: "sign" | "makeup", day?: number, pay?: boolean) {
  if (!send || busy) return;
  busy = true; note = null; confirmDay = null;
  send("welfare", { op, ...(day !== undefined ? { day } : {}), ...(pay ? { pay: true } : {}) });
  window.clearTimeout(timer); timer = window.setTimeout(() => { if (busy) { busy = false; note = { text: "Máy chủ chưa trả lời: thử lại sau.", err: true }; render(); } }, BUSY_MS);
}

const h = (tag: string, cls: string, o: { text?: string; attrs?: Record<string, string>; kids?: (PNode | null)[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids.filter((k): k is PNode => !!k) } : {}) });
const MARK: Record<CellState, string> = { signed: "■ Đã ký", today: "▶ Hôm nay", makeup: "Ký bù được", missed: "Bỏ lỡ", future: "" };

function cellNode(i: number, m: WelfareMsg): PNode {
  const st = cellState(i, m), ms = isMilestone(i), clickable = st === "makeup" || (st === "today" && !signedToday(m));
  return h("button", `wf-cell wf-${st}${ms ? " wf-ms" : ""}${confirmDay === i ? " sel" : ""}`, {
    attrs: { type: "button", "data-i": String(i), "data-st": st, "aria-label": `Ngày ${i + 1}${ms ? ", mốc" : ""}, ${MARK[st] || "chưa tới"}: ${rewardParts(i).join(", ")}`,
      title: st === "makeup" ? `${feeText(m.fee)} · còn ${m.makeupLeft} lượt` : st === "missed" ? "Hết lượt ký bù chu kỳ này" : rewardParts(i).join(", "), ...(clickable ? {} : { "aria-disabled": "true" }) },
    kids: [
      h("span", "wf-n", { text: String(i + 1) }),
      rewardIcons(i).length ? h("span", "wf-ic", { attrs: { "data-ic": rewardIcons(i).join(",") } }) : null, // icon gắn sau khi dựng (ảnh qua uiArt)
      ms ? h("span", "wf-mk", { text: "Mốc" }) : null, // dạng + chữ, không chỉ màu vàng
      h("span", "wf-r", { text: rewardParts(i).join(" · ") }),
      MARK[st] ? h("span", "wf-st", { text: MARK[st] }) : null,
    ] });
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  for (const s of stops) s(); stops = [];
  const pr = primaryOf(msg, busy);
  const f = screenFrame({
    material: "muc", title: "Phúc Lợi", badge: "福", info: `Sổ Điểm Danh ${CHECKIN.days} ngày: mỗi ngày một ô, quà lấy từ vật phẩm đã có. Ngày đổi lúc 00:00 giờ Việt Nam do máy chủ tính.`,
    nav: [{ id: "checkin", label: "Điểm danh", active: true, dot: !!msg && needsSign(msg) }], primary: pr, onPrimary: () => act("sign"),
  });
  if (!f) return;
  const body: PNode[] = [];
  if (!msg) body.push(h("div", "wf-msg", { text: "Đang tải sổ điểm danh…", attrs: { "aria-busy": "true" } }));
  else {
    const m = msg, running = m.day >= 0;
    body.push(h("div", "wf-head", { kids: [
      h("span", "wf-t", { text: `Sổ Điểm Danh · chu kỳ ${CHECKIN.days} ngày` }),
      running ? h("span", "wf-s", { text: `Đã ký ${checkinCount(m.mask)} / ${CHECKIN.days}` }) : null,
      running ? h("span", "wf-s", { text: `Lượt ký bù còn: ${m.makeupLeft}` }) : null,
      running ? h("span", "wf-cdh", { attrs: { "data-k": "end" } }) : null,
      running ? h("span", "wf-cdh", { attrs: { "data-k": "day" } }) : null,
    ] }));
    if (!running) body.push(h("div", "wf-hint", { text: m.cycle ? "Chu kỳ trước đã hết. Điểm danh để bắt đầu chu kỳ mới." : "Điểm danh để bắt đầu chu kỳ mới." }));
    body.push(h("div", "wf-paper", { kids: [h("div", "wf-grid", { attrs: { role: "grid", "aria-label": "Lưới ngày điểm danh" }, kids: Array.from({ length: CHECKIN.days }, (_, i) => cellNode(i, m)) })] }));
    if (confirmDay !== null) body.push(h("div", "wf-confirm", { attrs: { role: "alertdialog" }, kids: [
      h("span", "", { text: `Ký bù ô ${confirmDay + 1}: ${m.fee ? `tốn ${formatHonTe(m.fee)}` : "miễn phí"}. Xác nhận?` }),
      h("button", "wf-ok", { text: "Xác nhận", attrs: { type: "button" } }), h("button", "wf-no", { text: "Huỷ", attrs: { type: "button" } }),
    ] }));
    if (note) body.push(h("div", `wf-note${note.err ? " wf-bad" : ""}`, { text: note.text, attrs: { role: note.err ? "alert" : "status" } }));
  }
  const wrap = mount(h("div", "wf-wrap", { kids: body }));
  f.body.append(wrap);
  for (const ic of wrap.querySelectorAll<HTMLElement>(".wf-ic")) ic.innerHTML = (ic.dataset.ic ?? "").split(",").map(iconHtml).join(""); // chỉ URL ảnh của game, không có chữ người chơi
  if (msg && msg.day >= 0) {
    const m = msg;
    for (const host of wrap.querySelectorAll<HTMLElement>(".wf-cdh")) {
      const end = host.dataset.k === "end", c = countdown({ target: end ? m.endsAt : nextMidnightVn(serverNow()), now: serverNow, label: end ? "Hết chu kỳ" : "Đổi ngày sau", onEnd: () => { if (!end && isWelfareOpen()) send?.("welfare", { op: "get" }); } });
      host.append(c.root); stops.push(c.stop);
    }
  }
  wrap.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest(".wf-no")) { confirmDay = null; render(); return; }
    if (t.closest(".wf-ok") && confirmDay !== null && msg) { act("makeup", confirmDay, !!msg.fee); return; }
    const c = t.closest<HTMLElement>(".wf-cell"); if (!c || !msg || busy) return;
    const i = Number(c.dataset.i), st = c.dataset.st;
    if (st === "today" && !signedToday(msg)) act("sign");
    else if (st === "makeup") { if (msg.fee) { confirmDay = i; render(); } else act("makeup", i, false); } // tốn phí: xác nhận 2 bước; miễn phí: gửi ngay
  });
  addCloseButton(f.root, closeWelfare);
  root.replaceChildren(f.root);
}
