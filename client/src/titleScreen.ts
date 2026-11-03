// Màn Danh Hiệu (GAME_DESIGN.md mục 5.25, docs/design/danh-hieu.md "Giao diện", #1788, Part of #1766). Chỉ hiển thị tin riêng `title` của server và gửi ý định
// `title {op:"get"|"equip", id?}`; quyền đeo / hạn do server kiểm. Danh mục `TITLE_DEFS` đọc từ shared/data.ts để vẽ (không chép tên / số vào client).
import { TITLE_DEFS, TITLE_TIER_MAX, ACHV, BOSSES, RANK_BOARDS, titleDef, type TitleDef, type TitleGroup } from "../../shared/data.ts";
import { screenFrame, stateBox, mount, addCloseButton, guardImgs, type PNode } from "./uiParts.ts";
import { artUrl } from "./uiArt.ts";
import { titlePal } from "./titlePlate.ts";

export const TITLE_GROUP_LABEL: Record<TitleGroup, string> = { cap: "Cấp", thanh_tuu: "Thành Tựu", xep_hang: "Xếp Hạng", su_kien: "Sự Kiện", tong_mon: "Tông Môn", boss: "Săn Boss", bi_an: "Bí Ẩn" };
/** Thứ tự nhóm theo thiết kế (Cấp, Thành Tựu, Xếp Hạng, Sự Kiện, Tông Môn, Săn Boss, Bí Ẩn). */
export const TITLE_GROUP_ORDER: readonly TitleGroup[] = ["cap", "thanh_tuu", "xep_hang", "su_kien", "tong_mon", "boss", "bi_an"];
const GROUP_ICON: Record<TitleGroup, string> = { cap: "cap", thanh_tuu: "thanh_tuu", xep_hang: "xep_hang", su_kien: "su_kien", tong_mon: "tong_mon", boss: "san_boss", bi_an: "bi_an" };
/** Nhãn bậc hiếm bằng chữ (không chỉ màu). */
export const TIER_LABEL = ["Thường", "Lục", "Lam", "Tím", "Cam", "Đỏ"] as const;
export const tierLabel = (t: number) => `Bậc ${t} · ${TIER_LABEL[Math.min(TITLE_TIER_MAX, Math.max(1, t)) - 1]}`;
/** Biểu tượng nhóm `danh_hieu_nhom_*`; chưa nhập ảnh vào manifest thì null (nút nhóm chỉ còn chữ). */
export const titleGroupIcon = (g: TitleGroup) => artUrl(`danh_hieu_nhom_${GROUP_ICON[g]}`);

export interface OwnedTitle { id: string; exp: number | null }
export interface TitleMsg { owned: OwnedTitle[]; equipped: string | null; fresh?: string[]; equippedNow?: string | null; err?: string }
export type TitleRowState = "equipped" | "owned" | "locked";
export interface TitleRowView { def: TitleDef; state: TitleRowState; exp: number | null; cond: string }
export interface Banner { title: string; sub: string }

/** Điều kiện mở khoá bằng chữ, đọc từ nguồn khai ở `TITLE_DEFS` (tên thành tựu / boss / bảng lấy từ danh mục). */
export function titleCondition(def: TitleDef): string {
  const s = def.source;
  switch (s.kind) {
    case "level": return `Đạt cấp ${s.level} (võ hồn cao nhất của tài khoản)`;
    case "achv": return `Nhận thành tựu "${ACHV.find((a) => a.id === s.id)?.name ?? s.id}"`;
    case "rank": return `Đứng top ${s.top} bảng ${RANK_BOARDS.find((b) => b.code === s.board)?.name ?? s.board} trong tuần`;
    case "boss": return `Hạ ${BOSSES.find((b) => b.id === s.id)?.name ?? "boss"} lần đầu của máy chủ`;
    case "tong": return "Thành tích Tông Môn";
    case "event": return "Tham gia sự kiện";
    case "secret": return "Điều kiện ẩn";
  }
}
/** Hạn dùng còn lại: null = vĩnh viễn (chuỗi rỗng); hết rồi thì "Đã hết hạn". `now` truyền vào để test. */
export function expiryText(exp: number | null, now: number): string {
  if (exp == null) return "";
  const ms = exp - now; if (ms <= 0) return "Đã hết hạn";
  const d = Math.floor(ms / 864e5), hr = Math.floor((ms % 864e5) / 36e5), mi = Math.max(1, Math.floor((ms % 36e5) / 6e4));
  return `Còn ${d > 0 ? `${d} ngày ${hr} giờ` : hr > 0 ? `${hr} giờ` : `${mi} phút`}`;
}
/** Các nhóm theo thứ tự thiết kế; mỗi hàng: đang đeo / đã mở (còn hạn) / khoá. Không đeo gì (`equipped` null) thì danh hiệu cấp mặc định `defaultId` tính là đang đeo. Hàm thuần (test). */
export function titleGroups(m: Pick<TitleMsg, "owned" | "equipped">, now: number, defaultId: string | null = null) {
  const own = new Map(m.owned.filter((o) => o.exp == null || o.exp > now).map((o) => [o.id, o.exp]));
  const eq = m.equipped ?? defaultId;
  return TITLE_GROUP_ORDER.map((g) => {
    const rows = TITLE_DEFS.filter((t) => t.group === g).map((def): TitleRowView => {
      const has = own.has(def.id);
      return { def, state: !has ? "locked" : def.id === eq ? "equipped" : "owned", exp: own.get(def.id) ?? null, cond: def.group === "bi_an" ? "Điều kiện ẩn" : titleCondition(def) };
    });
    return { code: g, name: TITLE_GROUP_LABEL[g], rows, owned: rows.filter((r) => r.state !== "locked").length };
  });
}
/** Banner mừng cho danh hiệu mới mở (bỏ mã lạ); null nếu không có gì. */
export function freshBanner(fresh: readonly string[] | undefined): Banner | null {
  const defs = (fresh ?? []).map((id) => titleDef(id)).filter((d): d is TitleDef => !!d);
  if (!defs.length) return null;
  return { title: defs.length === 1 ? `Danh hiệu mới: ${defs[0].name}` : `${defs.length} danh hiệu mới`, sub: defs.length === 1 ? `${tierLabel(defs[0].tier)}. Mở Menu → Danh Hiệu để đeo.` : defs.map((d) => d.name).join(", ") };
}

// ---- phần DOM ----
type Ctx = { name: string; defaultId: string };
let send: ((type: string, payload: unknown) => void) | null = null;
let onUnseen: (n: number) => void = () => {};
let ctx: () => Ctx = () => ({ name: "Hồn sư", defaultId: "cap_1" });
let msg: TitleMsg | null = null, group: TitleGroup = "cap", sel: string | null = null, busy = false, loading = false, failed = false, note: { text: string; err: boolean } | null = null, timer = 0;
let unseen: string[] = [];
const el = () => document.getElementById("titles");
const BUSY_MS = 6000;

/** `unseenCb(n)`: số danh hiệu mới mở chưa xem (chấm đỏ Hub); `getCtx`: tên hồn sư và mã danh hiệu cấp mặc định hiện tại. */
export function bindTitles(sender: (type: string, payload: unknown) => void, unseenCb: (n: number) => void, getCtx: () => Ctx) { send = sender; onUnseen = unseenCb; ctx = getCtx; }
export const isTitlesOpen = () => { const e = el(); return !!e && !e.hidden; };
function load() {
  if (!send || loading || busy) return;
  loading = true; failed = false; window.clearTimeout(timer);
  timer = window.setTimeout(() => { loading = false; if (isTitlesOpen()) { failed = true; render(); } }, BUSY_MS);
  send("title", { op: "get" });
}
export function openTitles() {
  const e = el(); if (!e || !send) return;
  e.hidden = false; note = null; busy = false; loading = false; sel = null;
  unseen = []; onUnseen(0); // mở màn = đã xem: tắt chấm đỏ
  load(); render();
}
export function closeTitles() { const e = el(); if (e) e.hidden = true; loading = false; busy = false; window.clearTimeout(timer); }

/** Nhận tin `title`; trả banner (nếu có danh hiệu mới mở) để GameScene hiện toast. */
export function onTitle(m: TitleMsg): Banner | null {
  if (!m || !Array.isArray(m.owned)) return null;
  msg = m; loading = false; failed = false; busy = false; window.clearTimeout(timer);
  if (m.err) note = { text: m.err, err: true };
  else if (m.equippedNow !== undefined) note = { text: m.equippedNow ? `Đang đeo "${titleDef(m.equippedNow)?.name ?? m.equippedNow}".` : "Đã về danh hiệu mặc định theo cấp.", err: false };
  const fresh = (m.fresh ?? []).filter((id) => titleDef(id));
  if (!isTitlesOpen() && fresh.length) { unseen = [...new Set([...unseen, ...fresh])]; onUnseen(unseen.length); }
  render();
  return freshBanner(m.fresh);
}

function equip(id: string | null) {
  if (!send || busy) return;
  busy = true; note = null; send("title", { op: "equip", id: id ?? "" });
  window.clearTimeout(timer); timer = window.setTimeout(() => { if (busy) { busy = false; note = { text: "Máy chủ chưa trả lời: thử lại sau.", err: true }; render(); } }, BUSY_MS);
  render();
}

const h = (tag: string, cls: string, o: { text?: string; attrs?: Record<string, string>; kids?: (PNode | null)[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids.filter((k): k is PNode => !!k) } : {}) });
const MARK: Record<TitleRowState, string> = { equipped: "■ Đang đeo", owned: "Đã mở", locked: "Chưa mở" };
const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

/** Bảng xem thử: cùng bảng màu `titlePal` với bảng treo trong game, kèm tên hồn sư. Hàm thuần (test). */
export function previewNode(def: TitleDef | null, name: string, fallback: string, hide = false): PNode {
  const t = def?.tier ?? 1, pal = titlePal(t);
  return h("div", "tt-preview", { attrs: { "aria-label": "Xem thử trên nhân vật" }, kids: [
    h("span", "tt-plate", { text: hide ? "？？？" : def?.name ?? fallback, attrs: { "data-tier": String(t), style: `background:${hex(pal.bg)};border-color:${hex(pal.edge)};color:${pal.text};${t >= 4 ? `box-shadow:0 0 8px ${hex(pal.glow)}` : ""}` } }),
    h("span", "tt-name", { text: name }),
  ] });
}

/** Một thẻ danh hiệu: tên, bậc (chữ + viền), điều kiện khi khoá, hạn, nút Đeo / dấu "Đang đeo". Hàm thuần (test). */
export function titleRowNode(r: TitleRowView, now: number, busyNow = false, selected = false): PNode {
  const { def } = r, pal = titlePal(def.tier), ex = r.state === "locked" ? "" : expiryText(r.exp, now);
  return h("li", `tt-row tt-${r.state}${selected ? " tt-sel" : ""}`, { attrs: { "data-id": def.id, "data-st": r.state, style: `border-left-color:${hex(pal.edge)}` }, kids: [
    h("button", "tt-main", { attrs: { type: "button", "data-pick": def.id, "aria-pressed": String(selected) }, kids: [
      h("b", "tt-nm", { text: r.state === "locked" && def.group === "bi_an" ? "？？？" : def.name }),
      h("small", "tt-tier", { text: tierLabel(def.tier) }),
      r.state === "locked" ? h("small", "tt-cond", { text: r.cond }) : null,
      ex ? h("small", "tt-exp", { text: ex }) : null,
    ] }),
    r.state === "owned" ? h("button", "tt-eq f2-nut-phu", { text: "Đeo", attrs: { type: "button", "data-eq": def.id, ...(busyNow ? { disabled: "", title: "Đang gửi…" } : {}) } })
      : h("span", "tt-st", { text: MARK[r.state] }),
  ] });
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  const now = Date.now(), c = ctx(), groups = titleGroups(msg ?? { owned: [], equipped: null }, now, msg ? c.defaultId : null), cur = groups.find((g) => g.code === group) ?? groups[0];
  const f = screenFrame({
    material: "giay", title: "Danh Hiệu", badge: "號", info: "Danh hiệu chỉ để trưng bày, không cộng sức mạnh, không mua bán hay tặng. Mở khoá do máy chủ quyết định; chỉ một danh hiệu được đeo.",
    nav: groups.map((g) => ({ id: g.code, icon: titleGroupIcon(g.code) ?? undefined, label: `${g.name} ${g.owned}/${g.rows.length}`, active: g.code === cur.code, dot: !!msg && g.rows.some((r) => unseen.includes(r.def.id)) })),
    onNav: (id) => { group = id as TitleGroup; note = null; render(); },
  });
  if (!msg) f.body.append(failed
    ? stateBox({ kind: "error", text: "Không tải được danh hiệu (mất kết nối hoặc máy chủ chưa trả lời).", hint: "Kiểm tra mạng rồi bấm Thử lại.", onRetry: () => { load(); render(); } })
    : stateBox({ kind: "loading", rows: 5, text: "Đang tải danh hiệu…" }));
  else {
    const mine = msg.equipped ?? c.defaultId, shown = sel ?? mine, shownDef = titleDef(shown) ?? null, hide = !!shownDef && shownDef.group === "bi_an" && groups.some((g) => g.rows.some((r) => r.def.id === shown && r.state === "locked")), kids: PNode[] = [previewNode(shownDef, c.name, c.defaultId, hide)];
    if (note) kids.push(h("div", `av-note${note.err ? " av-bad" : ""}`, { text: note.text, attrs: { role: note.err ? "alert" : "status" } }));
    const noReset = msg.equipped === null || busy;
    kids.push(h("div", "tt-bar", { kids: [h("button", "tt-reset f2-nut-phu", { text: "Về mặc định (theo cấp)", attrs: { type: "button", ...(noReset ? { disabled: "", title: msg.equipped === null ? "Đang dùng danh hiệu theo cấp" : "Đang gửi…" } : {}) } })] }));
    kids.push(h("ul", "tt-list", { attrs: { "aria-label": `Danh hiệu nhóm ${cur.name}` }, kids: cur.rows.map((r) => titleRowNode(r, now, busy, shown === r.def.id)) }));
    f.body.append(mount(h("div", "tt-wrap", { kids })));
    f.body.querySelector(".tt-list")?.addEventListener("click", (e) => {
      const t = e.target as HTMLElement, eq = t.closest<HTMLElement>("[data-eq]"), pk = t.closest<HTMLElement>("[data-pick]");
      if (eq?.dataset.eq) return equip(eq.dataset.eq);
      if (pk?.dataset.pick) { sel = pk.dataset.pick; render(); }
    });
    f.body.querySelector(".tt-reset")?.addEventListener("click", () => equip(null));
  }
  addCloseButton(f.root, closeTitles);
  root.replaceChildren(f.root);
  if (f.nav.scrollWidth > f.nav.clientWidth) f.nav.querySelector<HTMLElement>(".sel")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  guardImgs(root, ".p2-nav-ico");
}
