// UI v2, màn Thành Tựu (docs/design/thanh-tuu.md "Giao diện", #1317, Part of #877). Chỉ hiển thị tin riêng `achv` của server và gửi ý định
// `achv {op:"get"|"claim", id}`: chỉ số, điều kiện "đạt", quà đều do server kiểm lại lúc nhận; client chỉ đọc danh mục `ACHV` ở shared/data.ts để vẽ.
import { ACHV, ACHV_GROUPS, achvReached, formatHonTe, itemDef, type AchvDef, type AchvStats } from "../../shared/data.ts";
import { abbrevNumber, screenFrame, stateBox, mount, addCloseButton, type PNode } from "./uiParts.ts";
import { giftNode, bindGiftImages } from "./giftView.ts";
import { artUrl } from "./uiArt.ts";

const GROUP_ICONS: Record<string, string> = { cap: "level", suu_tam: "collect", hunt: "hunt", quest: "quest", arena: "arena", bicanh: "bicanh" };
/** Hai bản ảnh đã duyệt: 24px ở DPR1, 32px ở DPR cao; thiếu ảnh vẫn đọc được nhãn. */
export function achvIconUrl(name: string): string | null {
  const key = `gi_achv_${name}`;
  return (typeof window !== "undefined" && window.devicePixelRatio < 1.5 && artUrl(`${key}_1x`)) || artUrl(key);
}

export interface AchvMsg {
  stats: AchvStats; claimed: string[]; ready: number;
  claimedNow?: { id: string; honTe: number; items: { code: string; qty: number }[] }; err?: string;
}
export type AchvState = "todo" | "ready" | "claimed";
export interface AchvRowView { def: AchvDef; state: AchvState; have: number; pct: number }
export interface AchvGroupView { code: string; name: string; rows: AchvRowView[]; ready: number; done: number }

/** Trạng thái một thành tựu: đã nhận / đạt chưa nhận / chưa đạt (chỉ số thiếu = 0). */
export function achvStateOf(def: AchvDef, m: Pick<AchvMsg, "stats" | "claimed">): AchvState {
  if (m.claimed.includes(def.id)) return "claimed";
  return achvReached(def, m.stats) ? "ready" : "todo";
}
/** Các nhóm theo thứ tự `ACHV_GROUPS`, mỗi nhóm một chuỗi bậc theo thứ tự khai trong `ACHV`; tiến độ kẹp 0..1. Hàm thuần (test). */
export function achvGroups(m: Pick<AchvMsg, "stats" | "claimed">): AchvGroupView[] {
  return ACHV_GROUPS.map((g) => {
    const rows = ACHV.filter((a) => a.group === g.code).map((def): AchvRowView => {
      const have = Math.max(0, m.stats[def.stat] ?? 0);
      return { def, state: achvStateOf(def, m), have: Math.min(have, def.need), pct: Math.max(0, Math.min(1, have / def.need)) };
    });
    return { code: g.code, name: g.name, rows, ready: rows.filter((r) => r.state === "ready").length, done: rows.filter((r) => r.state === "claimed").length };
  });
}
/** Mã thành tựu đang chờ nhận, theo thứ tự danh mục (hàng đợi của nút "Nhận tất cả"). */
export const readyIds = (m: Pick<AchvMsg, "stats" | "claimed">) => achvGroups(m).flatMap((g) => g.rows).filter((r) => r.state === "ready").map((r) => r.def.id);
/** Quà một thành tựu thành các dòng chữ ngắn (số / tên từ `ACHV` và `ITEMS`, không chép số vào client). */
export function achvRewardParts(def: AchvDef): string[] {
  const r = def.reward;
  return [...(r.honTe ? [`${abbrevNumber(r.honTe)} Hồn Tệ`] : []), ...(r.shards ? [`Mảnh võ hồn ×${r.shards}`] : []), ...(r.items ?? []).map((x) => `${itemDef(x.code)?.name ?? x.code} ×${x.qty}`)];
}
/** Số hiện ở chấm đỏ hub = số thành tựu đã đạt chưa nhận (server tính `ready`; client tin số đó, không tự đếm lại để khỏi lệch). */
export const achvBadgeCount = (m: Pick<AchvMsg, "ready">) => Math.max(0, Math.floor(m.ready) || 0);
/** Chưa đạt, chưa nhận gì: chuỗi trống (hiện câu gợi ý). */
export const achvIsBlank = (m: Pick<AchvMsg, "stats" | "claimed">) => m.claimed.length === 0 && achvGroups(m).every((g) => g.ready === 0);
/** Dòng kết quả lần vừa nhận. */
export function claimedLine(c: NonNullable<AchvMsg["claimedNow"]>): string {
  const def = ACHV.find((a) => a.id === c.id), got = [...(c.honTe ? [`${formatHonTe(c.honTe)}`] : []), ...c.items.map((x) => `${itemDef(x.code)?.name ?? x.code} ×${x.qty}`)];
  return `Nhận thành tựu "${def?.name ?? c.id}": ${got.join(", ") || "quà"}.`;
}
/** Nút chính: nhãn, khoá và lý do (nguyên tắc 5 của bộ spec: nút khoá luôn nói vì sao). */
export function achvPrimary(m: AchvMsg | null, busy: boolean): { label: string; disabled: boolean; reason?: string } {
  const label = "Nhận tất cả";
  if (!m) return { label, disabled: true, reason: "Đang tải…" };
  if (busy) return { label, disabled: true, reason: "Đang gửi…" };
  const n = readyIds(m).length;
  return n ? { label: `${label} (${n})`, disabled: false } : { label, disabled: true, reason: "Chưa có thành tựu nào để nhận" };
}

// ---- phần DOM ----
let send: ((type: string, payload: unknown) => void) | null = null;
let onChange: (n: number) => void = () => {};
let msg: AchvMsg | null = null, group = ACHV_GROUPS[0].code as string, busy = false, loading = false, failed = false, queue: string[] = [], note: { text: string; err: boolean } | null = null, timer = 0;
const el = () => document.getElementById("achv");
const BUSY_MS = 6000;

export function bindAchv(sender: (type: string, payload: unknown) => void, changed: (n: number) => void) { send = sender; onChange = changed; }
export const isAchvOpen = () => { const e = el(); return !!e && !e.hidden; };
/** Chờ get độc lập với cache; dùng chung một timer với thao tác nhận quà. */
function load() {
  if (!send || loading || busy) return;
  loading = true; failed = false;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { loading = false; if (isAchvOpen()) { failed = true; render(); } }, BUSY_MS);
  send("achv", { op: "get" });
}
export function openAchv() { const e = el(); if (!e || !send) return; e.hidden = false; note = null; queue = []; busy = false; loading = false; load(); render(); }
export function closeAchv() { const e = el(); if (e) e.hidden = true; queue = []; loading = false; window.clearTimeout(timer); }

/** Quyết định tiếng thưởng của chuỗi nhận: mỗi mốc nhận xong ghi `won`; chỉ phát khi chuỗi hết (hàng đợi rỗng) hoặc bị lỗi chặn giữa chừng mà đã nhận được ít nhất một mốc,
 *  nên "Nhận tất cả" chỉ một tiếng. Làm mới / nhận lỗi ngay từ đầu thì im. Hàm thuần (test). */
export function achvRewardStep(won: boolean, m: Pick<AchvMsg, "claimedNow" | "err">, queueLeft: number): { won: boolean; play: boolean } {
  const w = won || (!m.err && !!m.claimedNow);
  return m.err || queueLeft === 0 ? { won: false, play: w && (!!m.claimedNow || !!m.err) } : { won: w, play: false };
}
let rewardWon = false;

/** Trả true khi chuỗi nhận quà vừa xong có ít nhất một mốc nhận thật (GameScene phát `reward`). */
export function onAchv(m: AchvMsg): boolean {
  if (!m || typeof m.ready !== "number" || !m.stats || !Array.isArray(m.claimed)) return false;
  msg = m; loading = false; failed = false; window.clearTimeout(timer);
  if (m.err) { note = { text: m.err, err: true }; queue = []; busy = false; }
  else if (m.claimedNow) { note = { text: claimedLine(m.claimedNow), err: false }; busy = false; }
  else if (busy) busy = false;
  onChange(achvBadgeCount(m));
  const step = achvRewardStep(rewardWon, m, m.err ? 0 : queue.length); rewardWon = step.won;
  if (queue.length && !m.err) next(); else render();
  return step.play;
}

/** Gửi một yêu cầu nhận; bộ đếm chờ để màn không treo khi server im (server bỏ tin quá nhịp). */
function claim(id: string) {
  if (!send) return;
  busy = true; loading = false; note = null; send("achv", { op: "claim", id });
  window.clearTimeout(timer); timer = window.setTimeout(() => { if (busy) { busy = false; queue = []; note = { text: "Máy chủ chưa trả lời: thử lại sau.", err: true }; render(); } }, BUSY_MS);
  render();
}
/** Nhận tất cả: lần lượt từng cái (server nhận từng mã một, mỗi lần một transaction); gặp lỗi thì dừng. */
function next() { const id = queue.shift(); if (id && msg && achvStateOf(ACHV.find((a) => a.id === id) ?? ACHV[0], msg) === "ready") claim(id); else if (queue.length) next(); else render(); }

const h = (tag: string, cls: string, o: { text?: string; attrs?: Record<string, string>; kids?: (PNode | null)[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids.filter((k): k is PNode => !!k) } : {}) });
const MARK: Record<AchvState, string> = { todo: "Chưa đạt", ready: "Đạt, chưa nhận", claimed: "■ Đã nhận" };

/** Một dòng: tên, điều kiện + thanh tiến độ, quà, nút Nhận / dấu trạng thái (chữ, không chỉ màu). Hàm thuần (test). */
export function achvRowNode(r: AchvRowView, busyNow = false): PNode {
  const { def } = r;
  return h("li", `av-row av-${r.state}`, { attrs: { "data-id": def.id, "data-st": r.state }, kids: [
    h("div", "av-main", { kids: [
      h("b", "av-name", { text: def.name }),
      h("span", "av-bar", { attrs: { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(def.need), "aria-valuenow": String(r.have), "aria-label": `${def.name}: ${r.have} / ${def.need}` },
        kids: [h("i", "av-fill", { attrs: { style: `width:${Math.round(r.pct * 100)}%` } })] }),
      h("small", "av-prog", { text: `${abbrevNumber(r.have)} / ${abbrevNumber(def.need)}` }),
    ] }),
    h("span", "av-rw", { kids: [giftNode(def.reward)] }),
    r.state === "ready"
      ? h("button", "av-claim f2-nut-phu", { text: "Nhận", attrs: { type: "button", "data-id": def.id, ...(busyNow ? { disabled: "", title: "Đang gửi…" } : {}) } })
      : h("span", "av-st", { kids: [
        r.state === "claimed" && achvIconUrl("claimed") ? h("img", "av-icon", { attrs: { src: achvIconUrl("claimed")!, alt: "", "aria-hidden": "true", draggable: "false", width: "24", height: "24" } }) : null,
        h("span", "", { text: MARK[r.state] }),
      ] }),
  ] });
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  const groups = msg ? achvGroups(msg) : [], cur = groups.find((g) => g.code === group) ?? groups[0];
  const f = screenFrame({
    material: "giay", title: "Thành Tựu", badge: "績", info: "Mốc đã đạt ở cấp, sưu tầm, săn, nhiệm vụ, đấu trường và Bí Cảnh. Mỗi thành tựu nhận một lần; chỉ số và quà do máy chủ tính.",
    nav: ACHV_GROUPS.map((g) => { const v = groups.find((x) => x.code === g.code); return { id: g.code, icon: GROUP_ICONS[g.code] ? achvIconUrl(GROUP_ICONS[g.code]) ?? undefined : undefined, label: v ? `${g.name} ${v.done}/${v.rows.length}` : g.name, active: cur ? cur.code === g.code : g.code === group, dot: !!v?.ready }; }),
    primary: achvPrimary(msg, busy), onPrimary: () => { if (msg && !busy) { queue = readyIds(msg); next(); } }, onNav: (id) => { group = id; note = null; render(); },
  });
  if (!msg) f.body.append(failed
    ? stateBox({ kind: "error", text: "Không tải được thành tựu (mất kết nối hoặc máy chủ chưa trả lời).", hint: "Kiểm tra mạng rồi bấm Thử lại.", onRetry: () => { load(); render(); } })
    : stateBox({ kind: "loading", rows: 5, text: "Đang tải thành tựu…" }));
  else {
    if (loading) f.body.append(mount(h("div", "av-note", { text: "Đang cập nhật thành tựu… Dữ liệu cũ vẫn hiển thị để đọc.", attrs: { role: "status", "aria-busy": "true" } })));
    else if (failed) {
      const error = stateBox({ kind: "error", text: "Cập nhật thất bại.", hint: "Dữ liệu cũ · Máy chủ chưa trả lời.", onRetry: () => { load(); render(); } });
      error.classList.add("refresh-error"); f.body.append(error);
    }
    const kids: PNode[] = [];
    if (achvIsBlank(msg)) kids.push(h("div", "av-blank", { text: "Chưa đạt thành tựu nào. Săn hồn thú, làm nhiệm vụ, đấu trường hay Bí Cảnh để lên mốc đầu tiên.", attrs: { role: "status" } }));
    if (note) kids.push(h("div", `av-note${note.err ? " av-bad" : ""}`, { text: note.text, attrs: { role: note.err ? "alert" : "status" } }));
    if (cur) kids.push(h("ul", "av-list", { attrs: { "aria-label": `Thành tựu nhóm ${cur.name}` }, kids: cur.rows.map((r) => achvRowNode(r, busy)) }));
    f.body.append(mount(h("div", "av-wrap", { kids })));
    f.body.querySelector(".av-list")?.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".av-claim"); if (b?.dataset.id && !busy) { queue = []; claim(b.dataset.id); }
    });
  }
  addCloseButton(f.root, closeAchv);
  root.replaceChildren(f.root);
  if (f.nav.scrollWidth > f.nav.clientWidth) f.nav.querySelector<HTMLElement>(".sel")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  for (const img of root.querySelectorAll<HTMLImageElement>(".av-icon")) img.addEventListener("error", () => { img.hidden = true; });
  bindGiftImages(f.root);
}
