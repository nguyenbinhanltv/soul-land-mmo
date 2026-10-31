// Chế độ "Thế giới" của bản đồ lớn (phím M; docs/design/ban-do-khu-vuc.md mục "Bản đồ lớn", docs/art/ban-do-the-gioi.md): tranh thủy mặc đã duyệt
// (art/src/world-map) làm nền, nút bản đồ / truyền tống trận / đường nối cổng vẽ đè bằng code theo `bo-cuc.json` (toạ độ 0..1 của tranh, chỉ để vẽ,
// KHÔNG gửi lên server). Chỉ hiển thị: trạng thái mở khoá, phí, đang đứng ở đâu đều đọc từ tin riêng `world` của server; luật dịch chuyển ở server.
// Khung màn (tab, nút chính, đóng) do mapview.ts dựng; module này lo phần thân (#world) và báo nút chính cho khung qua `primary()`.
import layout from "../../art/src/world-map/bo-cuc.json";
import { MAPS, formatHonTe, WAYPOINT_CAST } from "../../shared/data.ts";
import type { WorldMsg } from "./net.ts";
import { assetUrl } from "./assetUrl.ts";
import { searchField, filterByQuery, stateBox } from "./uiParts.ts";
import { confirmDialog } from "./confirmDialog.ts";
import "./ui2-worldmap.css";

interface Pt { x: number; y: number }
interface LMap { id: string; name: string; kind: string; position: Pt; entry: string; waypoints: { key: string; name: string; position: Pt }[] }
interface LEdge { id: string; from: string; to: string; kind: string; points: Pt[] }
const L = layout as unknown as { background: { width: number; height: number }; maps: LMap[]; edges: LEdge[] };
const IMG_W = L.background.width, IMG_H = L.background.height;
const BG_URL = "/ui/ban-do-the-gioi/nen-the-gioi.png";
/** Phóng tối đa so với mức vừa khung; chạm vào nút bản đồ thì tự phóng tới `FOCUS_ZOOM` lần mức vừa khung (đủ rộng để thấy các trận của bản đồ đó). */
const MAX_ZOOM = 4, FOCUS_ZOOM = 2.2, WHEEL_STEP = 1.2;
/** Chờ tin `world` quá ngần này thì báo lỗi kèm nút Thử lại (ms). */
const WAIT_MS = 8000;
/** Sau khi bấm Dịch chuyển, dòng `log` của server trong ngần này (ms) được coi là phản hồi cho yêu cầu đó (lý do từ chối). */
const REPLY_MS = 4000;
const KIND_TEXT: Record<string, string> = { town: "Thành an toàn", hunt: "Bãi săn", boss: "Vùng thú vương", arena: "Phòng riêng" };

type Sel = { t: "map" | "wp"; id: string } | null;
/** Nút chính của khung màn ở chế độ Thế giới. */
export interface WorldPrimary { label: string; disabled: boolean; reason: string }
export interface WorldHooks {
  /** "Tự đi tới": đi bộ qua các cổng thật tới bản đồ (không tốn Hồn Tệ). */
  auto: (map: string) => void;
  /** Gửi ý định truyền tống tới trận `key` (`wp {op: "go", key}`): server kiểm mọi điều kiện. */
  go: (key: string) => void;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const svgNs = "http://www.w3.org/2000/svg";

class WorldMap {
  readonly root = document.getElementById("world")!;
  readonly hooks: WorldHooks = { auto: () => {}, go: () => {} };
  /** mapview.ts đăng ký: mở / đóng bản đồ lớn ở chế độ Thế giới. */
  host: { show(open: boolean): boolean; isOpen(): boolean } | null = null;
  /** GameScene đặt: xin server tin `world` mới (mỗi lần chế độ Thế giới hiện ra, và nút Thử lại). */
  onShow: (() => void) | null = null;
  /** mapview.ts đặt: nút chính của khung cần vẽ lại (chọn đổi, tin mới). */
  onChange: (() => void) | null = null;

  private msg: WorldMsg | null = null;
  private sel: Sel = null;
  private onlyOpen = false; private allWps = false;
  private view = { s: 1, x: 0, y: 0 }; private fitS = 1; private vw = 0; private vh = 0;
  /** Người dùng đã kéo / phóng: đổi cỡ khung thì chỉ kẹp lại, không ép về vừa khung. */
  private touched = false;
  private waitTimer = 0; private waitErr = false; private imgErr = false;
  /** Lúc (ms) vừa gửi yêu cầu dịch chuyển (0 = không chờ phản hồi); lý do server vừa trả; lúc nhận tin `world` (đếm lùi hồi); hẹn giờ đếm lùi. */
  private pending = 0; private reply = ""; private cdAt = 0; private cdTimer = 0;
  private ptrs = new Map<number, Pt>(); private drag: { x: number; y: number; vx: number; vy: number; moved: boolean } | null = null; private pinch = 0;

  private readonly viewEl = el("div", "wm-view"); private readonly stage = el("div", "wm-stage");
  private readonly img = el("img", "wm-bg"); private readonly svg = document.createElementNS(svgNs, "svg");
  private readonly layer = el("div", "wm-layer"); private readonly side = el("aside", "wm-card");
  private readonly list = el("ul", "wm-find"); private readonly notice = el("div", "wm-notice");
  private nodes = new Map<string, HTMLElement>(); private me = el("div", "wm-me"); private cdEl: HTMLElement = el("span", "v");
  private readonly chips: Record<"open" | "all", HTMLButtonElement> = { open: el("button", "wm-chip"), all: el("button", "wm-chip") };
  private zoomBtns: { in: HTMLButtonElement; out: HTMLButtonElement } | null = null;
  private findReset: (() => void) | null = null;

  constructor() {
    this.root.classList.add("wm"); this.root.setAttribute("aria-label", "Bản đồ thế giới");
    this.build();
    new ResizeObserver(() => this.measure()).observe(this.viewEl);
  }

  // ---------- API cho mapview.ts / hudMisc.ts ----------
  setMsg(m: WorldMsg) {
    this.msg = m; this.waitErr = false; clearTimeout(this.waitTimer); this.waitTimer = 0; this.cdAt = performance.now();
    if (this.sel?.t === "wp" && !this.wp(this.sel.id)) this.sel = null;
    this.render();
  }
  /** Chế độ Thế giới vừa hiện: xin tin mới, đặt khung nhìn (lần đầu / bản đồ lạ), chờ tin trong WAIT_MS. */
  show() {
    // Tranh nặng (vài MB): chỉ tải khi chế độ Thế giới hiện lần đầu.
    if (!this.img.getAttribute("src")) this.img.src = assetUrl(BG_URL);
    this.waitErr = false; this.onShow?.(); this.arm(); this.measure(true); this.render();
    clearInterval(this.cdTimer); this.cdTimer = window.setInterval(() => this.tickCd(), 1000);
  }
  /** Mỗi giây: cập nhật đếm lùi hồi ở thẻ và nút chính (chỉ hiển thị). */
  private tickCd() {
    if (!this.msg?.remoteCd) return;
    this.cdEl.textContent = this.cdText(); this.onChange?.();
    if (this.cdLeft() <= 0) this.paintCard();
  }
  private cdText() { const left = this.cdLeft(); return left > 0 ? `Còn ${left} giây` : "Dùng được"; }
  hide() { clearTimeout(this.waitTimer); this.waitTimer = 0; clearInterval(this.cdTimer); this.cdTimer = 0; this.pending = 0; this.reply = ""; }
  /**
   * Nút chính của khung: "Dịch chuyển" tới trận đang chọn. Chỉ chặn theo thứ server đã báo trong tin `world` (đã mở, tới được, đủ Hồn Tệ, còn hồi);
   * mọi điều kiện khác (giao chiến, tự săn, sân đấu…) do server kiểm và trả lý do bằng dòng `log`, hiện ở thẻ chi tiết.
   * Server cũ chưa có phí từ xa thì khi không đứng trên trận nút khoá kèm lý do "Chỉ dùng khi đứng trên trận".
   */
  primary(): WorldPrimary {
    const g = this.goState();
    return { label: g.fee !== null && !g.reason ? `Dịch chuyển · ${formatHonTe(g.fee)}` : "Dịch chuyển", disabled: !!g.reason, reason: g.reason };
  }
  /** Phản hồi mới của server cho yêu cầu vừa gửi (dòng `log`): hiện ở thẻ chi tiết. */
  note(text: string) {
    if (!this.pending || performance.now() - this.pending > REPLY_MS) return;
    this.pending = 0; this.reply = text; this.paintCard(); this.onChange?.();
  }
  /** Server đã bắt đầu niệm (tin `recall`): đóng bản đồ để thấy thanh niệm. */
  recallStarted() { this.pending = 0; this.reply = ""; if (this.host?.isOpen()) this.host.show(false); }
  /** Server đã gửi phí từ xa (tin `world` mới); server cũ không có: nút từ xa khoá với lý do "Chỉ dùng khi đứng trên trận". */
  private remoteOk() { const m = this.msg; return !!m && (m.remoteCdMax !== undefined || m.list.some((w) => w.feeRemote !== undefined)); }
  /** Điều kiện nút Dịch chuyển theo tin `world`: lý do khoá ("" = bấm được), phí áp dụng (null = không tới được / chưa chọn), từ xa hay không. */
  private goState(): { reason: string; fee: number | null; remote: boolean; key: string } {
    const m = this.msg, none = (reason: string) => ({ reason, fee: null, remote: false, key: "" });
    if (!m) return none("Đang tải trạng thái truyền tống trận");
    if (this.sel?.t !== "wp") return none(this.sel ? "Chọn một truyền tống trận cụ thể" : "Chọn một truyền tống trận đã mở");
    const w = this.wp(this.sel.id); if (!w) return none("Truyền tống trận không còn trong danh sách");
    const remote = m.cur === "", fee = remote ? (this.remoteOk() ? w.feeRemote ?? null : null) : w.fee, key = w.key;
    const no = (reason: string) => ({ reason, fee, remote, key });
    if (!w.open) return no("Chưa mở khoá: bước lên trận này một lần");
    if (m.cur === w.key) return no("Bạn đang đứng trên trận này");
    if (remote && !this.remoteOk()) return no("Chỉ dùng khi đứng trên trận");
    if (fee === null) return no("Không tới được từ đây");
    if (fee > m.honTe) return no("Không đủ Hồn Tệ");
    if (remote && this.cdLeft() > 0) return no(`Đang hồi: còn ${this.cdLeft()} giây`);
    return { reason: "", fee, remote, key };
  }
  /** Giây còn hồi của dịch chuyển từ xa: số server gửi lúc nhận tin trừ thời gian đã trôi (chỉ để hiển thị đếm lùi). */
  private cdLeft() { const m = this.msg; return m?.remoteCd ? Math.max(0, Math.ceil(m.remoteCd - (performance.now() - this.cdAt) / 1000)) : 0; }
  /** Bấm Dịch chuyển: từ xa thì hỏi xác nhận một lần (tốn phụ phí và vào thời gian hồi), rồi gửi ý định `wp go`; server quyết định mọi thứ. */
  runPrimary() {
    const g = this.goState(); if (g.reason || g.fee === null) return;
    const w = this.wp(g.key)!, send = () => { this.pending = performance.now(); this.reply = ""; this.hooks.go(g.key); this.paintCard(); this.onChange?.(); };
    if (!g.remote) return send();
    const cd = this.msg?.remoteCdMax;
    confirmDialog({ title: "Dịch chuyển từ xa", confirm: "Dịch chuyển",
      body: `Tới ${w.label} (${MAPS[w.map]?.name ?? w.map}): phí ${formatHonTe(g.fee)} (đã gồm phụ phí), niệm ${WAYPOINT_CAST} giây${cd ? `, sau đó hồi ${cd} giây trước lần dịch chuyển từ xa kế` : ""}. Di chuyển hoặc bị đánh khi niệm thì hủy.` }, send);
  }
  private runWalk() { const id = this.selMap(); if (id && this.walkable(id)) { this.host?.show(false); this.hooks.auto(id); } }
  /** "Tự đi tới": bản đồ đã chọn khác chỗ đang đứng và có đường bộ (không phải phòng riêng). */
  private walkable(id: string) { return !!this.msg && id !== this.msg.map && MAPS[id]?.kind !== "arena"; }

  // ---------- Dữ liệu ----------
  private selMap() { return !this.sel ? null : this.sel.t === "map" ? this.sel.id : this.wp(this.sel.id)?.map ?? null; }
  private wp(key: string) { return this.msg?.list.find((w) => w.key === key); }
  private lmap(id: string) { return L.maps.find((m) => m.id === id); }
  private wpPos(key: string): Pt | undefined { for (const m of L.maps) { const w = m.waypoints.find((x) => x.key === key); if (w) return w.position; } return undefined; }
  private mapOpen(id: string) { return !!this.msg?.list.some((w) => w.map === id && w.open); }
  /** Chỗ đang đứng trên tranh: tâm bản đồ đang ở (trận đang đứng ghi ở thẻ chi tiết). */
  private here(): Pt | undefined { return this.msg ? this.lmap(this.msg.map)?.position : undefined; }
  private arm() {
    clearTimeout(this.waitTimer);
    if (!this.msg) this.waitTimer = window.setTimeout(() => { this.waitTimer = 0; if (!this.msg) { this.waitErr = true; this.render(); } }, WAIT_MS);
  }

  // ---------- Dựng khung ----------
  private build() {
    const bar = el("div", "wm-bar");
    const { root: search, input } = searchField({ label: "Tìm bản đồ hoặc truyền tống trận", placeholder: "Tìm nơi (không cần dấu)", onInput: (q) => this.paintFind(q) });
    search.classList.add("wm-search");
    this.findReset = () => { input.value = ""; this.list.replaceChildren(); this.list.hidden = true; };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") (this.list.querySelector("li:not(.none)") as HTMLElement | null)?.click(); });
    this.list.hidden = true; this.list.setAttribute("role", "listbox"); this.list.setAttribute("aria-label", "Kết quả tìm");
    const chip = (b: HTMLButtonElement, text: string, tip: string, on: () => void) => { b.type = "button"; b.textContent = text; b.title = tip; b.setAttribute("aria-pressed", "false"); b.addEventListener("click", () => { on(); this.render(); }); return b; };
    const tools = el("div", "wm-tools");
    const mk = (text: string, label: string, fn: () => void) => { const b = el("button", "wm-btn", text); b.type = "button"; b.title = label; b.setAttribute("aria-label", label); b.addEventListener("click", () => fn()); return b; };
    const zin = mk("+", "Phóng to", () => this.zoomBy(WHEEL_STEP, this.vw / 2, this.vh / 2)), zout = mk("−", "Thu nhỏ", () => this.zoomBy(1 / WHEEL_STEP, this.vw / 2, this.vh / 2));
    this.zoomBtns = { in: zin, out: zout };
    tools.append(
      chip(this.chips.open, "Chỉ trận đã mở", "Ẩn truyền tống trận chưa mở khoá", () => { this.onlyOpen = !this.onlyOpen; }),
      chip(this.chips.all, "Hiện mọi trận", "Hiện truyền tống trận của mọi bản đồ (mặc định chỉ hiện khi phóng to hoặc chọn bản đồ)", () => { this.allWps = !this.allWps; }),
      mk("Về chỗ tôi", "Đưa khung về chỗ bạn đang đứng", () => this.focusHere()), mk("Vừa khung", "Đặt lại: vừa khung cả tranh", () => { this.touched = false; this.measure(true); }), zin, zout);
    bar.append(search, this.list, tools);

    this.img.alt = ""; this.img.draggable = false; this.img.decoding = "async";
    this.img.addEventListener("error", () => { this.imgErr = true; this.render(); });
    this.img.addEventListener("load", () => { this.imgErr = false; this.render(); });
    this.svg.setAttribute("viewBox", "0 0 1 1"); this.svg.setAttribute("preserveAspectRatio", "none"); this.svg.setAttribute("class", "wm-links"); this.svg.setAttribute("aria-hidden", "true");
    for (const e of L.edges) {
      const pl = document.createElementNS(svgNs, "polyline");
      pl.setAttribute("points", e.points.map((p) => `${p.x},${p.y}`).join(" ")); pl.setAttribute("class", `wm-edge${e.kind === "thuyen" ? " boat" : ""}`); pl.dataset.a = e.from; pl.dataset.b = e.to;
      this.svg.append(pl);
    }
    this.stage.style.width = `${IMG_W}px`; this.stage.style.height = `${IMG_H}px`;
    this.stage.append(this.img, this.svg);
    this.notice.hidden = true; this.notice.setAttribute("role", "status");
    this.viewEl.append(this.stage, this.layer, this.notice);
    this.me.className = "wm-me"; this.me.setAttribute("role", "img");
    this.viewEl.addEventListener("wheel", (e) => { e.preventDefault(); const r = this.viewEl.getBoundingClientRect(); this.zoomBy(e.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    this.viewEl.addEventListener("pointerdown", (e) => this.down(e));
    this.viewEl.addEventListener("pointermove", (e) => this.move(e));
    this.viewEl.addEventListener("pointerup", (e) => this.up(e));
    this.viewEl.addEventListener("pointercancel", (e) => { this.ptrs.delete(e.pointerId); this.drag = null; this.pinch = 0; });
    const body = el("div", "wm-main"); body.append(this.viewEl, this.side);
    this.root.replaceChildren(bar, body);
  }

  // ---------- Khung nhìn ----------
  private measure(refit = false) {
    const r = this.viewEl.getBoundingClientRect(); if (!r.width || !r.height) return;
    const first = !this.vw; this.vw = r.width; this.vh = r.height;
    this.fitS = Math.min(this.vw / IMG_W, this.vh / IMG_H);
    if (refit || first || !this.touched) {
      // Màn dọc: tranh chỉ cắt trang trí ở mép, không để thu nhỏ tới mức không bấm được nút; tâm (0,5; 0,5), kéo ngang để xem nhánh khác.
      const s = this.vh > this.vw * 1.1 ? this.fitS * 2 : this.fitS;
      this.view = { s, x: this.vw / 2 - 0.5 * IMG_W * s, y: this.vh / 2 - 0.5 * IMG_H * s };
    }
    this.clamp(); this.place();
  }
  private clamp() {
    const v = this.view, min = this.fitS, max = Math.max(this.fitS * MAX_ZOOM, 1.2);
    v.s = Math.min(max, Math.max(min, v.s));
    const cw = IMG_W * v.s, ch = IMG_H * v.s;
    v.x = cw <= this.vw ? (this.vw - cw) / 2 : Math.min(0, Math.max(this.vw - cw, v.x));
    v.y = ch <= this.vh ? (this.vh - ch) / 2 : Math.min(0, Math.max(this.vh - ch, v.y));
  }
  private zoomBy(f: number, cx: number, cy: number) {
    const v = this.view, ns = v.s * f, k = Math.min(Math.max(ns, this.fitS), Math.max(this.fitS * MAX_ZOOM, 1.2)) / v.s;
    v.x = cx - (cx - v.x) * k; v.y = cy - (cy - v.y) * k; v.s *= k; this.touched = true; this.clamp(); this.place(); this.render();
  }
  /** Đưa điểm `p` (0..1 của tranh) vào giữa khung, phóng tới ít nhất `zoom` lần mức vừa khung. */
  private focus(p: Pt, zoom = 1) {
    const s = Math.max(this.view.s, this.fitS * zoom);
    this.view = { s, x: this.vw / 2 - p.x * IMG_W * s, y: this.vh / 2 - p.y * IMG_H * s }; this.touched = true; this.clamp(); this.place(); this.render();
  }
  private focusHere() { const p = this.here(); if (p) this.focus(p, FOCUS_ZOOM); }
  /** Đặt tranh, nét nối và nút theo khung nhìn hiện tại (nút không co theo tranh: vùng bấm giữ cỡ kit). */
  private place() {
    const v = this.view;
    this.stage.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.s})`;
    this.viewEl.dataset.z = v.s >= this.fitS * 2.6 ? "hi" : "lo"; // đủ lớn thì nhãn trận hiện luôn
    const at = (p: Pt) => `translate(${Math.round(v.x + p.x * IMG_W * v.s)}px,${Math.round(v.y + p.y * IMG_H * v.s)}px)`;
    for (const [id, n] of this.nodes) {
      const p = id.startsWith("m:") ? this.lmap(id.slice(2))?.position : this.wpPos(id.slice(2));
      if (p) n.style.transform = at(p);
    }
    const h = this.here(); if (h && this.me.isConnected) this.me.style.transform = at(h);
    if (this.zoomBtns) { this.zoomBtns.in.disabled = v.s >= Math.max(this.fitS * MAX_ZOOM, 1.2) - 1e-3; this.zoomBtns.out.disabled = v.s <= this.fitS + 1e-3; }
  }

  // ---------- Chuột, chạm, chụm ----------
  private down(e: PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return; // bấm nút thì để `click` lo, không bắt kéo
    this.viewEl.setPointerCapture?.(e.pointerId);
    const r = this.viewEl.getBoundingClientRect(), p = { x: e.clientX - r.left, y: e.clientY - r.top }; this.ptrs.set(e.pointerId, p);
    if (this.ptrs.size === 1) this.drag = { x: p.x, y: p.y, vx: this.view.x, vy: this.view.y, moved: false };
    else { this.drag = null; this.pinch = this.span(); }
  }
  private span() { const [a, b] = [...this.ptrs.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; }
  private move(e: PointerEvent) {
    if (!this.ptrs.has(e.pointerId)) return;
    const r = this.viewEl.getBoundingClientRect(), p = { x: e.clientX - r.left, y: e.clientY - r.top }; this.ptrs.set(e.pointerId, p);
    if (this.ptrs.size >= 2) {
      const d = this.span(), [a, b] = [...this.ptrs.values()];
      if (this.pinch > 0 && d > 0) this.zoomBy(d / this.pinch, (a.x + b.x) / 2, (a.y + b.y) / 2);
      this.pinch = d; return;
    }
    const g = this.drag; if (!g) return;
    if (!g.moved && Math.hypot(p.x - g.x, p.y - g.y) <= 6) return;
    g.moved = true; this.touched = true; this.view.x = g.vx + p.x - g.x; this.view.y = g.vy + p.y - g.y; this.clamp(); this.place();
  }
  private up(e: PointerEvent) {
    const g = this.drag; this.ptrs.delete(e.pointerId); if (this.ptrs.size < 2) this.pinch = 0;
    if (this.ptrs.size === 0) this.drag = null;
    if (g && !g.moved && this.ptrs.size === 0 && this.sel) { this.sel = null; this.render(); this.onChange?.(); } // bấm nền trống: bỏ chọn
  }

  // ---------- Chọn, tìm ----------
  private select(s: Sel, zoom = true) {
    this.sel = s; this.list.hidden = true;
    if (s && zoom) { const p = s.t === "map" ? this.lmap(s.id)?.position : this.wpPos(s.id); if (p) this.focus(p, FOCUS_ZOOM); else this.render(); } else this.render();
    this.onChange?.();
  }
  private paintFind(q: string) {
    this.list.replaceChildren();
    if (!q.trim()) { this.list.hidden = true; return; }
    const items: { t: "map" | "wp"; id: string; text: string; sub: string }[] = [];
    for (const m of L.maps) items.push({ t: "map", id: m.id, text: m.name, sub: KIND_TEXT[m.kind] ?? "" });
    for (const w of this.msg?.list ?? []) items.push({ t: "wp", id: w.key, text: w.label, sub: `${MAPS[w.map]?.name ?? w.map} · ${w.open ? "đã mở" : "chưa mở"}` });
    const hit = filterByQuery(items, (i) => `${i.text} ${i.sub}`, q, 7);
    for (const i of hit) {
      const li = el("li"); li.setAttribute("role", "option"); li.tabIndex = 0; li.append(el("b", "", i.text)); if (i.sub) li.append(el("small", "", i.sub));
      const go = () => { this.select({ t: i.t, id: i.id }); this.findReset?.(); };
      li.addEventListener("click", go); li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      this.list.append(li);
    }
    if (!hit.length) this.list.append(el("li", "none", "Không có nơi nào khớp. Xoá bớt chữ để xem lại."));
    this.list.hidden = false;
  }

  // ---------- Vẽ ----------
  private render() {
    const m = this.msg, selMap = this.selMap(), cur = m?.map ?? "";
    this.chips.open.setAttribute("aria-pressed", String(this.onlyOpen)); this.chips.all.setAttribute("aria-pressed", String(this.allWps));
    // Nét nối: sáng lên khi một đầu là bản đồ đang chọn.
    for (const pl of this.svg.querySelectorAll<SVGElement>(".wm-edge")) pl.classList.toggle("hl", !!selMap && (pl.dataset.a === selMap || pl.dataset.b === selMap));
    // Nút: dựng lại theo trạng thái (vài chục phần tử).
    this.nodes.clear(); const frag: HTMLElement[] = [];
    const wpShown = (mapId: string) => this.allWps || this.view.s >= this.fitS * 1.8 || mapId === selMap;
    for (const lm of L.maps) {
      const id = lm.id, open = this.mapOpen(id), room = lm.entry === "phong-rieng", def = MAPS[id], here = id === cur;
      const st = room ? "room" : open ? "open" : "locked";
      const b = el("button", `wm-node ${st}${here ? " cur" : ""}${selMap === id && this.sel?.t === "map" ? " sel" : ""}`); b.type = "button"; b.dataset.id = id;
      const lv = def?.level ? `cấp ${def.level[0]}–${def.level[1]}` : def?.kind === "town" ? "an toàn" : "";
      b.setAttribute("aria-label", `${lm.name}: ${KIND_TEXT[lm.kind] ?? ""}${lv ? `, ${lv}` : ""}, ${room ? "phòng riêng, chỉ xem" : open ? "đã mở truyền tống trận" : "chưa mở truyền tống trận"}${here ? ", bạn đang ở đây" : ""}`);
      b.append(el("i", "wm-seal"), el("span", "wm-name", lm.name));
      b.addEventListener("click", () => this.select({ t: "map", id }));
      this.nodes.set(`m:${id}`, b); frag.push(b);
      if (room || !wpShown(id)) continue;
      for (const lw of lm.waypoints) {
        const w = this.wp(lw.key), wopen = !!w?.open; if (this.onlyOpen && !wopen) continue;
        const wb = el("button", `wm-wp ${wopen ? "open" : "locked"}${m?.cur === lw.key ? " cur" : ""}${this.sel?.t === "wp" && this.sel.id === lw.key ? " sel" : ""}`); wb.type = "button"; wb.dataset.key = lw.key;
        wb.setAttribute("aria-label", `Truyền tống trận ${w?.label ?? lw.name}, ${lm.name}, ${wopen ? "đã mở" : "chưa mở"}${m?.cur === lw.key ? ", bạn đang đứng ở đây" : ""}`);
        wb.title = `${w?.label ?? lw.name} · ${wopen ? "đã mở" : "chưa mở"}`;
        wb.append(el("i", "wm-dia"), el("span", "wm-wname", w?.label ?? lw.name));
        wb.addEventListener("click", () => this.select({ t: "wp", id: lw.key }));
        this.nodes.set(`w:${lw.key}`, wb); frag.push(wb);
      }
    }
    // Dấu "Bạn ở đây": hình cờ kèm chữ (không chỉ màu), đặt ở trận đang đứng hoặc tâm bản đồ đang ở.
    this.me.replaceChildren(el("i", "wm-pin"), el("span", "", "Bạn ở đây")); this.me.setAttribute("aria-label", `Bạn ở đây: ${MAPS[cur]?.name ?? ""}`);
    this.layer.replaceChildren(...frag, ...(m ? [this.me] : []));
    this.paintNotice(); this.paintCard(); this.place();
  }
  private paintNotice() {
    const n = this.notice, retry = () => { this.waitErr = false; this.imgErr = false; this.img.src = assetUrl(`${BG_URL}?r=${Date.now()}`); this.arm(); this.onShow?.(); this.render(); };
    n.replaceChildren();
    if (this.imgErr) n.append(stateBox({ kind: "error", text: "Chưa tải được tranh bản đồ.", hint: "Các nút vẫn dùng được. Kiểm tra kết nối rồi thử lại.", onRetry: retry }));
    else if (this.waitErr) n.append(stateBox({ kind: "error", text: "Chưa nhận được trạng thái truyền tống trận.", hint: "Kiểm tra kết nối rồi thử lại.", onRetry: retry }));
    else if (!this.msg) n.append(stateBox({ kind: "loading", text: "Đang tải trạng thái truyền tống trận…", rows: 1 }));
    n.hidden = !n.childElementCount;
  }

  /** Thẻ chi tiết: gợi ý khi chưa chọn; bản đồ (cấp, các trận); trận (trạng thái, phí). Phí và hồi do server tính, ở đây chỉ hiện. */
  private paintCard() {
    const c = this.side, m = this.msg; c.replaceChildren();
    const row = (k: string, v: string, cls = "") => { const r = el("div", `wm-row${cls ? ` ${cls}` : ""}`); r.append(el("span", "k", k), el("span", "v", v)); return r; };
    if (m) c.append(row("Hồn Tệ", formatHonTe(m.honTe), "coin"));
    if (!this.sel) {
      c.append(el("h3", "wm-t", "Bản đồ thế giới"), el("p", "wm-hint", "Chọn một bản đồ hoặc truyền tống trận trên tranh để xem cấp đề xuất, trạng thái mở khoá và phí."),
        el("p", "wm-hint", "Nét đứt: đường cổng nối hai bản đồ. Nét chấm: đi thuyền. Nút sáng: đã mở truyền tống trận; xám: chưa mở."));
      return;
    }
    const id = this.selMap()!, lm = this.lmap(id), def = MAPS[id];
    if (this.sel.t === "map") {
      c.append(el("h3", "wm-t", lm?.name ?? def?.name ?? id));
      c.append(row("Loại", KIND_TEXT[lm?.kind ?? ""] ?? ""), row("Cấp đề xuất", def?.level ? `${def.level[0]}–${def.level[1]}` : def?.kind === "town" ? "Không cần (an toàn)" : "Không có"));
      if (lm?.entry === "phong-rieng") { c.append(el("p", "wm-hint", "Phòng riêng: vào qua NPC, không có cổng hay truyền tống trận. Chỉ để xem thông tin.")); return; }
      if (id === m?.map) c.append(row("Vị trí", "Bạn đang ở bản đồ này", "here"));
      const wl = (m?.list ?? []).filter((w) => w.map === id && (!this.onlyOpen || w.open));
      if (!wl.length) c.append(el("p", "wm-hint", this.onlyOpen ? "Chưa có trận nào ở đây được mở khoá." : "Đang chờ danh sách truyền tống trận…"));
      for (const w of wl) {
        const b = el("button", `wm-li ${w.open ? "open" : "locked"}`); b.type = "button";
        b.append(el("i", "wm-dia"), el("span", "t", w.label), el("em", "", w.open ? "Đã mở" : "Chưa mở"));
        b.addEventListener("click", () => this.select({ t: "wp", id: w.key })); c.append(b);
      }
      this.walkBtn(c, id);
      return;
    }
    const w = this.wp(this.sel.id), isHere = m?.cur === this.sel.id;
    c.append(el("h3", "wm-t", w?.label ?? this.sel.id), row("Bản đồ", lm?.name ?? def?.name ?? id), row("Cấp đề xuất", def?.level ? `${def.level[0]}–${def.level[1]}` : "Không cần (an toàn)"));
    c.append(row("Trạng thái", w?.open ? "√ Đã mở khoá" : "Chưa mở khoá", w?.open ? "ok" : "lock"));
    if (!w?.open) c.append(el("p", "wm-hint", "Chưa mở: bước lên trận này một lần để mở khoá."));
    if (!m || !w) return;
    if (isHere) c.append(row("Vị trí", "Bạn đang đứng trên trận này", "here"));
    else if (w.open) {
      const g = this.goState(), standing = !g.remote;
      c.append(row(standing ? "Phí dịch chuyển" : "Phí từ xa (gồm phụ phí)", g.fee === null ? (standing || this.remoteOk() ? "Không tới được" : "Chỉ dùng khi đứng trên trận") : formatHonTe(g.fee), g.fee !== null && g.fee > m.honTe ? "poor" : ""));
      c.append(row("Thời gian niệm", `${WAYPOINT_CAST} giây (di chuyển hoặc bị đánh thì hủy)`));
      if (standing) c.append(row("Thời gian hồi", "Không hồi khi đứng trên trận"));
      else if (m.remoteCdMax !== undefined) {
        const r = row("Hồi dịch chuyển từ xa", this.cdText(), this.cdLeft() > 0 ? "poor" : ""); this.cdEl = r.querySelector(".v") as HTMLElement; c.append(r);
        c.append(el("p", "wm-hint", `Hai lần dịch chuyển từ xa cách nhau ${m.remoteCdMax} giây.`));
      }
    }
    if (this.pending) c.append(el("p", "wm-hint wm-wait", "Đã gửi yêu cầu, đang chờ server…"));
    if (this.reply) { const r = el("p", "wm-reply", this.reply); r.setAttribute("role", "alert"); c.append(r); }
    this.walkBtn(c, id);
  }
  /** Nút phụ "Tự đi tới <bản đồ>" của mục đang chọn (đi bộ qua các cổng thật, không tốn Hồn Tệ). */
  private walkBtn(c: HTMLElement, id: string) {
    if (!this.walkable(id)) return;
    const b = el("button", "wm-walk f2-nut-phu", `Tự đi tới ${MAPS[id]?.name ?? id}`); b.type = "button"; b.title = `Đi bộ qua các cổng tới ${MAPS[id]?.name ?? id}, không tốn Hồn Tệ`;
    b.addEventListener("click", () => this.runWalk()); c.append(b);
  }
}

let inst: WorldMap | null = null;
/** Bảng bản đồ thế giới duy nhất (DOM #world nằm trong khung #mapview); dựng lần đầu khi cần. */
export const worldMap = () => inst ??= new WorldMap();
