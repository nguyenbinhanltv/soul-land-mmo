// Bản đồ khu vực toàn màn hình (GAME_DESIGN.md mục 5.17, R3 #430): phím N hoặc bấm radar. Chỉ hiển thị: GameScene gom chấm và nhãn
// (cùng chấm với radar, `DotSink`), phép chiếu / kéo / phóng dùng hàm thuần ở shared/radar.ts, số liệu ở `MAPVIEW` / `RADAR`.
// Không dừng game: lớp phủ chỉ che màn hình, phím di chuyển vẫn chạy. Dữ liệu chỉ là thứ server đã đồng bộ (state trong tầm + tin `mini`).
//
// Chỗ chừa cho các bước sau (chưa làm ở R3):
// - R4 (#431) cờ "Đi tới" (đã làm): `onFlag` nhận ô bấm (chuột) hoặc chạm giữ (điện thoại), cờ vẽ bằng `setMarker("flag", …)`, nút Đi / Xoá cờ ở thanh trên;
// - R6 (#433) "Tập trung ở đây" (đã làm): chuột phải (điện thoại: chạm giữ mở thẻ chọn "Đặt cờ" / "Tập trung ở đây") gọi `onRally`; dấu của đồng đội
//   là chấm mức `rally` (GameScene gom), bấm vào để tự đi tới như cờ;
// - R8 (#435) sương mù (đã làm): fog.ts vẽ ngay trên nền, dưới chấm; nhãn vùng ở chỗ chưa khám phá bị ẩn (cổng, NPC, truyền tống trận vẫn hiện).
import { RADAR, MAPVIEW, AUTOWALK, TILE as _TILE } from "../../shared/data.ts";
import {
  mapviewToScreen, mapviewToTile, mapviewZoomAt, mapviewPan, mapviewClampCenter, mapviewFit, mapviewLayer, radarRotate, radarNorthAngle,
  radarPick, type MapView,
} from "../../shared/radar.ts";
import { drawRadarIcon, strokeRoute, radar, ls, DARK, type DotSink } from "./radar.ts";
import { getFlag } from "./autowalk.ts";
import { fog } from "./fog.ts";
import { screenFrame, addCloseButton, searchField, filterByQuery, type Frame } from "./uiParts.ts";
import { isUi2 } from "./uiKit.ts";
import "./ui2-map.css";

void _TILE;
const LS_HIDDEN = "soul.mapview.hidden";
const LEVEL = new Map(RADAR.levels.map((l) => [l.id, l]));
const PAPER = "#ece2c8";
/** Nền nhãn: mực tối gần đặc, để chữ sáng luôn đạt tương phản ≥ 4,5:1 bất kể nền bản đồ phía sau. */
const LABEL_BG = "rgba(26,16,32,.88)";
/** Thứ tự nhận chỗ khi nhãn đè nhau (nhỏ = trước): cổng > truyền tống > NPC > hang > vùng săn > vùng an toàn. */
const LABEL_PRIO: Record<MapLabel["k"], number> = { gate: 0, wp: 1, npc: 2, lair: 3, zone: 4, safe: 5 };
const FONT = '"Be Vietnam Pro", "Galmuri 11", system-ui, sans-serif';
/** Lề (pixel) chừa quanh bản đồ khi vừa khung. */
const FIT_MARGIN = 20;
/** Lý do nút chính (khung ui2) đang khoá: chưa có cờ để đi tới. */
const NO_FLAG_WHY = "Chưa đặt cờ: bấm vào bản đồ";

/** Nhãn tĩnh của bản đồ (GameScene dựng từ object Tiled): `x`, `y` là tâm (ô); vùng (`zone`, `safe`, `lair`) có thêm `w`, `h` (ô). */
export interface MapLabel {
  k: "zone" | "safe" | "lair" | "npc" | "gate" | "wp";
  x: number; y: number; w?: number; h?: number;
  text: string; sub?: string;
  /** Dòng ngắn hiện khi chưa phóng tới `MAPVIEW.labelZoom.zoneSub` (vùng săn: cấp đề xuất). */
  brief?: string;
  /** Truyền tống trận: đã mở chưa (chưa mở vẽ xám). */
  open?: boolean;
}
/** Dấu người chơi đặt (cờ R4, tập trung R6…): vẽ trên cùng, luôn hiện (không theo bộ lọc). */
export interface MapMarker { tx: number; ty: number; name: string; col: string }
/** Cái nằm dưới điểm bấm: chấm / nhãn có tên (nếu có) kèm ô được bấm (số thực). */
export interface MapTap { tx: number; ty: number; name: string; sub: string }
/** Lớp vẽ chèn thêm, toạ độ ô (đã áp phép chiếu). `fog`: dưới chấm, trên nền; `top`: trên chấm. */
export type MapOverlay = (ctx: CanvasRenderingContext2D, v: MapView, mapW: number, mapH: number) => void;

interface Dot { id: string; layer: string; prio: number; x: number; y: number; wx: number; wy: number; name: string; col: string; ring: string }
interface Box { x: number; y: number; w: number; h: number; col: string }
interface Hit { x: number; y: number; prio: number; name: string; sub: string; wx: number; wy: number }

/** Bấm nút: cảm ứng chạy ngay lúc chạm (một số máy / giả lập không sinh `click`), chuột và bàn phím chạy ở `click`; không chạy hai lần. */
function press(b: HTMLElement, fn: () => void) {
  let touched = 0;
  b.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") return; touched = performance.now(); fn(); });
  b.addEventListener("click", () => { if (performance.now() - touched < 800) return; fn(); });
}
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

class MapViewUi implements DotSink {
  readonly root = el("mapview");
  readonly cv = el<HTMLCanvasElement>("mapviewCv");
  readonly ctx = this.cv.getContext("2d")!;
  readonly tip = el("mapviewTip");
  readonly menu = el("mapviewMenu");
  private menuAt: { x: number; y: number } | null = null;
  readonly title = el("mapviewTitle");
  readonly modeBtn = el("mapviewMode");
  /** Bản đồ đang đứng: cỡ (ô) và khoá (đổi khoá thì đặt lại khung nhìn). */
  mapKey = ""; mapW = 1; mapH = 1;
  view: MapView = { cx: 0, cy: 0, zoom: MAPVIEW.zoomDefault, mode: "iso" };
  /** GameScene đặt: bấm / chạm (không kéo) vào bản đồ. R3 chỉ hiện tên; R4 / R6 gắn đặt cờ / đánh dấu ở đây. */
  onTap: ((t: MapTap) => void) | null = null;
  /** GameScene đặt: bấm chuột (hoặc chạm giữ `AUTOWALK.holdMs` trên điện thoại, chạm ngắn chỉ hiện tên) vào một ô thì đặt cờ (R4). */
  onFlag: ((t: MapTap) => void) | null = null;
  /** GameScene đặt: đặt dấu "Tập trung ở đây" của tổ đội ở ô (chuột phải, hoặc chạm giữ rồi chọn trong thẻ, R6). */
  onRally: ((t: MapTap) => void) | null = null;
  /** GameScene đặt: đang trong tổ đội (có đồng đội) thì chạm giữ mở thẻ chọn thay vì đặt cờ ngay. */
  canRally: (() => boolean) | null = null;
  /** GameScene đặt: nút "Đi tới cờ" / "Dừng tự đi" / "Xoá cờ" trên thanh trên (R4). */
  flagActs: { go: () => void; stop: () => void; clear: () => void } | null = null;
  /** GameScene đặt: đóng các bảng khác trước khi mở bằng nút Vùng. */
  beforeOpen: (() => void) | null = null;
  hidden = new Set<string>((() => { try { return JSON.parse(ls.get(LS_HIDDEN) ?? "[]") as string[]; } catch { return []; } })());
  private pool: Dot[] = []; private n = 0;
  private boxes: Box[] = []; private nb = 0;
  private labels: MapLabel[] = [];
  private markers = new Map<string, MapMarker>();
  private overlays: { at: "fog" | "top"; fn: MapOverlay }[] = [];
  private hits: Hit[] = [];
  private mx = NaN; private my = NaN; /** Mở xong chưa có lượt gom nào: lượt đầu tiên căn khung về chỗ đứng. */ private needCenter = false; private now = 0; private last = 0; private raf = 0;
  private info = "";
  private route: number[] | null = null; private routeCol = "";
  private hold = 0; private held = false;
  private ptrs = new Map<number, { x: number; y: number }>();
  private drag: { x: number; y: number; moved: boolean } | null = null; private pinch = 0;
  private chips = new Map<string, HTMLButtonElement>();

  /** Khung màn chuẩn (chỉ khi cờ ui2 bật; tắt thì null và bản đồ giữ lớp phủ cũ). */
  private frame: Frame | null = null;

  constructor() {
    this.buildBar();
    this.mountFrame();
    const cv = this.cv;
    cv.addEventListener("wheel", (e) => { e.preventDefault(); const p = this.local(e); this.zoomAt(e.deltaY < 0 ? MAPVIEW.zoomStep : 1 / MAPVIEW.zoomStep, p.x, p.y); }, { passive: false });
    cv.addEventListener("pointerdown", (e) => { this.menu.hidden = true; this.down(e); });
    cv.addEventListener("contextmenu", (e) => { e.preventDefault(); const p = this.local(e); this.rallyAt(p.x, p.y, "mouse"); });
    press(el("mapviewMenuFlag"), () => { this.menu.hidden = true; if (this.menuAt) this.flagAt(this.menuAt.x, this.menuAt.y, "touch"); });
    press(el("mapviewMenuRally"), () => { this.menu.hidden = true; if (this.menuAt) this.rallyAt(this.menuAt.x, this.menuAt.y, "touch"); });
    cv.addEventListener("pointermove", (e) => this.move(e));
    cv.addEventListener("pointerup", (e) => this.up(e));
    cv.addEventListener("pointercancel", (e) => { this.ptrs.delete(e.pointerId); this.drag = null; this.pinch = 0; });
    cv.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") this.tip.hidden = true; });
    const area = document.getElementById("areaBtn"); if (area) press(area, () => { area.blur(); this.beforeOpen?.(); this.toggle(); });
    press(el("mapviewClose"), () => this.close());
    press(el("mapviewIn"), () => this.zoomAt(MAPVIEW.zoomStep, 0, 0));
    press(el("mapviewOut"), () => this.zoomAt(1 / MAPVIEW.zoomStep, 0, 0));
    press(el("mapviewMe"), () => this.recenter());
    press(el("mapviewFit"), () => this.fit());
    press(el("mapviewGo"), () => this.goFlag());
    press(el("mapviewClear"), () => { this.flagActs?.clear(); this.syncFlag(); });
    press(this.modeBtn, () => { radar().setMode(radar().mode === "iso" ? "flat" : "iso"); this.view = { ...this.view, mode: radar().mode }; this.syncUi(); this.redraw(); });
    window.addEventListener("resize", () => { if (this.isOpen) this.redraw(); });
  }

  get isOpen() { return !this.root.hidden; }

  /** Đi tới cờ / dừng tự đi (nút trên thanh công cụ và nút chính của khung ui2 dùng chung). */
  private goFlag() { const f = getFlag(); if (!f) return; if (f.on) this.flagActs?.stop(); else { this.close(); this.flagActs?.go(); } this.syncFlag(); }
  /** Cờ ui2: bọc canvas, thanh công cụ, chú thích vào khung màn chuẩn (Mực); nút "Đi tới cờ" thành nút chính, khoá kèm lý do khi chưa có cờ. */
  private mountFrame() {
    const f = screenFrame({ material: "muc", title: "Bản đồ khu vực", badge: "圖", info: el("mapviewHelp").textContent ?? "",
      primary: { label: "Đi tới cờ", disabled: true, reason: NO_FLAG_WHY }, onPrimary: () => this.goFlag() });
    if (!f) return;
    this.frame = f; f.root.classList.add("mv-frame"); f.body.classList.add("mv-body");
    f.body.append(this.cv, el("mapviewBar"), el("mapviewHelp"), this.tip, this.menu);
    this.root.prepend(f.root); this.root.classList.add("mv-ui2");
    addCloseButton(f.root, () => this.close());
  }

  // ---------- API cho GameScene và các bước sau ----------
  /** Báo bản đồ đang đứng (gọi khi dựng cảnh); đổi bản đồ thì đóng và đặt lại khung nhìn. */
  setMap(key: string, w: number, h: number) {
    if (key !== this.mapKey) { this.close(); this.markers.clear(); this.mx = this.my = NaN; this.view = { ...this.view, cx: w / 2, cy: h / 2 }; }
    this.mapKey = key; this.mapW = w; this.mapH = h;
  }
  /** Đặt / xoá dấu (`null`) theo khoá ("flag", "rally"…). */
  setMarker(id: string, m: MapMarker | null) { if (m) this.markers.set(id, m); else this.markers.delete(id); this.syncFlag(); this.redraw(); }
  /** Nút Đi / Dừng / Xoá cờ theo cờ hiện có (R4). */
  syncFlag() {
    const f = getFlag(), go = el("mapviewGo");
    go.hidden = !f; el("mapviewClear").hidden = !f;
    if (f) go.textContent = f.on ? "Dừng tự đi" : "Đi tới cờ";
    const p = this.frame?.primary; if (!p) return;
    p.disabled = !f; p.textContent = f?.on ? "Dừng tự đi" : "Đi tới cờ";
    const why = p.parentElement!.querySelector(".p2-why");
    if (f) why?.remove(); else if (!why) { const w = document.createElement("span"); w.className = "p2-why"; w.textContent = NO_FLAG_WHY; p.before(w); }
  }
  /** Chèn lớp vẽ (sương mù…); trả hàm gỡ. */
  addOverlay(at: "fog" | "top", fn: MapOverlay) { const o = { at, fn }; this.overlays.push(o); return () => { this.overlays = this.overlays.filter((x) => x !== o); }; }
  /** Đổi bản đồ / cảnh: gỡ lớp vẽ của cảnh cũ. */
  reset() { this.overlays.length = 0; this.markers.clear(); this.onTap = null; }

  open() {
    if (this.isOpen) return;
    this.root.hidden = false; this.last = 0; this.n = 0; this.nb = 0; this.syncUi(); this.syncFlag(); this.needCenter = true; this.mx = this.my = NaN;
    document.getElementById("areaBtn")?.setAttribute("aria-expanded", "true");
  }
  close() {
    if (!this.root.hidden) this.root.hidden = true;
    this.tip.hidden = true; this.menu.hidden = true; this.ptrs.clear(); this.drag = null; this.pinch = 0; window.clearTimeout(this.hold);
    document.getElementById("areaBtn")?.setAttribute("aria-expanded", "false");
  }
  toggle() { if (this.isOpen) this.close(); else this.open(); }

  /** Tới lượt gom chấm chưa (đang mở và đủ `RADAR.hz` lần mỗi giây). */
  due(now: number) { return this.isOpen && now - this.last >= 1000 / RADAR.hz; }
  /** Bắt đầu một lượt gom: mình ở (tx, ty) ô, nhãn tĩnh của bản đồ, tiêu đề (tên bản đồ · toạ độ · kênh). */
  begin(tx: number, ty: number, now: number, labels: MapLabel[], title: string) {
    this.last = now; this.now = now; this.mx = tx; this.my = ty; this.n = 0; this.nb = 0; this.labels = labels; this.route = null;
    if (this.needCenter) { this.needCenter = false; this.fit(); }
    if (title !== this.info) { this.info = title; this.title.textContent = title; }
  }
  dot(id: string, tx: number, ty: number, name: string, col = "", ring = "", layer = "") {
    const lv = LEVEL.get(id); if (!lv) return;
    let d = this.pool[this.n]; if (!d) d = this.pool[this.n] = { id: "", layer: "", prio: 0, x: 0, y: 0, wx: 0, wy: 0, name: "", col: "", ring: "" };
    this.n++; d.id = id; d.layer = mapviewLayer(id, layer); d.prio = lv.prio; d.wx = tx; d.wy = ty; d.name = name; d.col = col || lv.col; d.ring = ring;
  }
  rect(tx: number, ty: number, w: number, h: number, col: string) {
    let b = this.boxes[this.nb]; if (!b) b = this.boxes[this.nb] = { x: 0, y: 0, w: 0, h: 0, col: "" };
    this.nb++; b.x = tx; b.y = ty; b.w = w; b.h = h; b.col = col;
  }
  line(pts: number[], col: string) { this.route = pts; this.routeCol = col; }
  end() { this.redraw(); }

  // ---------- Khung nhìn ----------
  private recenter() {
    this.view = mapviewClampCenter({ ...this.view, cx: Number.isFinite(this.mx) ? this.mx : this.mapW / 2, cy: Number.isFinite(this.my) ? this.my : this.mapH / 2, mode: radar().mode }, this.mapW, this.mapH);
    this.redraw();
  }
  /** Vừa khung: cả bản đồ nằm gọn trong khung vẽ (dưới thanh công cụ), mở ra lần nào cũng vậy. */
  private fit() {
    const W = this.cv.clientWidth, H = this.cv.clientHeight; if (!W || !H) { this.recenter(); return; }
    this.view = mapviewFit(this.mapW, this.mapH, W, H, radar().mode, FIT_MARGIN, el("mapviewBar").offsetHeight); this.syncUi(); this.redraw();
  }
  private zoomAt(f: number, sx: number, sy: number) {
    this.view = mapviewClampCenter(mapviewZoomAt(this.view, f, sx, sy), this.mapW, this.mapH); this.syncUi(); this.redraw();
  }
  private syncUi() {
    const flat = radar().mode === "flat";
    this.modeBtn.setAttribute("aria-pressed", String(flat));
    this.modeBtn.textContent = flat ? "Xoay theo màn hình" : "Nhìn thẳng";
    (el("mapviewIn") as HTMLButtonElement).disabled = this.view.zoom >= MAPVIEW.zoomMax;
    (el("mapviewOut") as HTMLButtonElement).disabled = this.view.zoom <= MAPVIEW.zoomMin;
  }
  /** Toạ độ con trỏ so với tâm khung vẽ (pixel CSS). */
  private local(e: { clientX: number; clientY: number }) {
    const r = this.cv.getBoundingClientRect(); return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  }

  // ---------- Chuột, chạm, chụm hai ngón ----------
  private down(e: PointerEvent) {
    this.cv.setPointerCapture?.(e.pointerId);
    const p = this.local(e); this.ptrs.set(e.pointerId, p);
    window.clearTimeout(this.hold); this.held = false;
    if (this.ptrs.size === 1) {
      this.drag = { x: p.x, y: p.y, moved: false };
      // Điện thoại: chạm giữ không kéo thì đặt cờ (chuột đặt cờ lúc nhả, `up`).
      if (e.pointerType !== "mouse") this.hold = window.setTimeout(() => {
        const g = this.drag; if (!g || g.moved || this.ptrs.size !== 1) return;
        this.held = true; navigator.vibrate?.(30);
        if (this.canRally?.()) this.openMenu(g.x, g.y); else this.flagAt(g.x, g.y, "touch");
      }, AUTOWALK.holdMs);
    } else { this.drag = null; this.pinch = this.span(); }
  }
  private span() { const [a, b] = [...this.ptrs.values()]; return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0; }
  private move(e: PointerEvent) {
    const prev = this.ptrs.get(e.pointerId), p = this.local(e);
    if (!prev) { if (e.pointerType === "mouse") this.showTip(p.x, p.y, e.pointerType); return; }
    this.ptrs.set(e.pointerId, p);
    if (this.ptrs.size >= 2) {
      const d = this.span(); if (this.pinch > 0 && d > 0) { const [a, b] = [...this.ptrs.values()]; this.zoomAt(d / this.pinch, (a.x + b.x) / 2, (a.y + b.y) / 2); }
      this.pinch = d; return;
    }
    const g = this.drag; if (!g) return;
    if (!g.moved && Math.hypot(p.x - g.x, p.y - g.y) <= MAPVIEW.dragPx) return;
    g.moved = true; this.tip.hidden = true; window.clearTimeout(this.hold);
    this.view = mapviewClampCenter(mapviewPan(this.view, p.x - prev.x, p.y - prev.y), this.mapW, this.mapH); this.redraw();
  }
  private up(e: PointerEvent) {
    const g = this.drag, p = this.local(e); this.ptrs.delete(e.pointerId); window.clearTimeout(this.hold);
    if (this.ptrs.size < 2) this.pinch = 0;
    if (this.held) { this.held = false; this.drag = null; return; } // chạm giữ đã đặt cờ rồi
    if (!g || g.moved || this.ptrs.size > 0) { if (this.ptrs.size === 0) this.drag = null; return; }
    this.drag = null;
    const t = this.showTip(p.x, p.y, e.pointerType), ti = mapviewToTile(this.view, p.x, p.y);
    if (ti.x < 0 || ti.y < 0 || ti.x >= this.mapW || ti.y >= this.mapH) return;
    this.onTap?.({ tx: ti.x, ty: ti.y, name: t?.name ?? "", sub: t?.sub ?? "" });
    if (e.pointerType === "mouse" && e.button === 0) this.flagAt(p.x, p.y, "mouse");
    if (e.pointerType !== "mouse") window.setTimeout(() => { this.tip.hidden = true; }, 2500);
  }

  /** Đặt cờ ở điểm (x, y) (so với tâm khung vẽ): gọi `onFlag` kèm tên chấm / nhãn dưới ngón tay. */
  private flagAt(x: number, y: number, kind: string) {
    const ti = mapviewToTile(this.view, x, y);
    if (ti.x < 0 || ti.y < 0 || ti.x >= this.mapW || ti.y >= this.mapH) return;
    const t = this.showTip(x, y, kind);
    this.onFlag?.({ tx: ti.x, ty: ti.y, name: t?.name ?? "", sub: t?.sub ?? "" });
    if (kind !== "mouse") window.setTimeout(() => { this.tip.hidden = true; }, 2500);
  }

  /** Đặt dấu "Tập trung ở đây" ở điểm (x, y) (so với tâm khung vẽ): gọi `onRally` kèm tên chấm / nhãn dưới con trỏ. */
  private rallyAt(x: number, y: number, kind: string) {
    const ti = mapviewToTile(this.view, x, y);
    if (ti.x < 0 || ti.y < 0 || ti.x >= this.mapW || ti.y >= this.mapH) return;
    const t = this.showTip(x, y, kind);
    this.onRally?.({ tx: ti.x, ty: ti.y, name: t?.name ?? "", sub: t?.sub ?? "" });
    if (kind !== "mouse") window.setTimeout(() => { this.tip.hidden = true; }, 2500);
  }
  /** Thẻ chọn sau khi chạm giữ (trong tổ đội): "Đặt cờ" hoặc "Tập trung ở đây" ở ô vừa giữ. */
  private openMenu(x: number, y: number) {
    this.menuAt = { x, y };
    const r = this.cv.getBoundingClientRect(), left = Math.min(Math.max(r.width / 2 + x, 110), r.width - 110), top = r.height / 2 + y;
    this.menu.style.left = `${left}px`; this.menu.style.top = `${top + 70 > r.height ? top - 56 : top + 14}px`; this.menu.hidden = false;
  }

  /** Tên chấm / nhãn gần điểm (x, y) (so với tâm khung vẽ): chấm ưu tiên cao nhất trước, rồi vùng chứa ô đó. Hiện chú thích tại chỗ. */
  private showTip(x: number, y: number, kind: string): Hit | undefined {
    const hit = radarPick(this.hits, x, y, MAPVIEW.hitPx * (kind === "touch" ? 1.8 : 1)) ?? this.zoneAt(x, y);
    if (!hit) { this.tip.hidden = true; return undefined; }
    this.tip.textContent = hit.sub ? `${hit.name} · ${hit.sub}` : hit.name; this.tip.hidden = false;
    const r = this.cv.getBoundingClientRect(), left = Math.min(Math.max(r.width / 2 + x, 60), r.width - 60), top = r.height / 2 + y;
    this.tip.style.left = `${left}px`; this.tip.style.top = `${top + 18 > r.height - 30 ? top - 26 : top + 16}px`;
    return hit;
  }
  private zoneAt(x: number, y: number): Hit | undefined {
    const t = mapviewToTile(this.view, x, y);
    for (const l of this.labels) {
      if (!l.w || !l.h || l.k === "lair" || !this.known(l) || t.x < l.x - l.w / 2 || t.x > l.x + l.w / 2 || t.y < l.y - l.h / 2 || t.y > l.y + l.h / 2) continue;
      return { x, y, prio: 0, name: l.text, sub: l.sub ?? "", wx: t.x, wy: t.y };
    }
    return undefined;
  }

  // ---------- Vẽ ----------
  private redraw() {
    if (!this.isOpen || this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; if (this.isOpen) this.paint(); });
  }
  private visible(layer: string) { return !layer || !this.hidden.has(layer); }

  private paint() {
    const cv = this.cv, W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const ctx = this.ctx, v = { ...this.view, mode: radar().mode }, z = v.zoom, c = { x: W / 2, y: H / 2 }, iso = v.mode === "iso";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0e1612"; ctx.fillRect(0, 0, W, H);
    // Thế giới: nền ảnh bản đồ (R1 / nền vẽ từ ô của radar), khung vùng, lớp chèn.
    ctx.save(); ctx.translate(c.x, c.y); if (iso) ctx.rotate(Math.PI / 4); ctx.scale(z, z); ctx.translate(-v.cx, -v.cy);
    const R = radar(), base = R.base as HTMLCanvasElement | HTMLImageElement | null;
    if (base) ctx.drawImage(base, 0, 0, base.width / R.baseScale, base.height / R.baseScale);
    const F = fog(); F.draw(ctx, this.now);
    ctx.lineWidth = 1 / z;
    for (const l of this.labels) {
      if (!l.w || !l.h || !this.known(l)) continue;
      const x = l.x - l.w / 2, y = l.y - l.h / 2;
      if (l.k === "zone") { ctx.fillStyle = "rgba(255,240,180,.07)"; ctx.fillRect(x, y, l.w, l.h); ctx.strokeStyle = "rgba(255,230,150,.55)"; }
      else if (l.k === "safe") { ctx.fillStyle = "rgba(120,220,170,.10)"; ctx.fillRect(x, y, l.w, l.h); ctx.strokeStyle = "rgba(140,230,190,.6)"; }
      else ctx.strokeStyle = "#a0303c";
      ctx.strokeRect(x, y, l.w, l.h);
    }
    ctx.lineWidth = 1.5 / z;
    for (let i = 0; i < this.nb; i++) { const b = this.boxes[i]; ctx.strokeStyle = b.col; ctx.strokeRect(b.x, b.y, b.w, b.h); }
    for (const o of this.overlays) if (o.at === "fog") o.fn(ctx, v, this.mapW, this.mapH);
    if (this.route) strokeRoute(ctx, this.route, this.routeCol, z);
    ctx.restore();

    // Mặt phẳng màn hình: chấm (thấp → cao), nhãn, dấu, mình.
    const at = (tx: number, ty: number) => { const p = mapviewToScreen(v, tx, ty); return { x: c.x + p.x, y: c.y + p.y }; };
    this.hits.length = 0;
    const live: Dot[] = [];
    for (let i = 0; i < this.n; i++) { const d = this.pool[i]; if (!this.visible(d.layer)) continue; const p = at(d.wx, d.wy); d.x = p.x; d.y = p.y; if (p.x > -12 && p.y > -12 && p.x < W + 12 && p.y < H + 12) live.push(d); }
    live.sort((a, b) => a.prio - b.prio);
    const on = Math.floor(this.now / 400) % 2 === 0;
    for (const d of live) {
      const lv = LEVEL.get(d.id)!; drawRadarIcon(ctx, d, lv.size, lv.blink && !on);
      this.hits.push({ x: d.x - c.x, y: d.y - c.y, prio: d.prio, name: d.name, sub: "", wx: d.wx, wy: d.wy });
    }
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    this.drawLabels(ctx, at, c, z);
    for (const o of this.overlays) if (o.at === "top") { ctx.save(); ctx.translate(c.x, c.y); if (iso) ctx.rotate(Math.PI / 4); ctx.scale(z, z); ctx.translate(-v.cx, -v.cy); o.fn(ctx, v, this.mapW, this.mapH); ctx.restore(); }
    for (const [, m] of this.markers) { const p = at(m.tx, m.ty); this.flag(ctx, p.x, p.y, m.col); this.hits.push({ x: p.x - c.x, y: p.y - c.y, prio: 8, name: m.name, sub: "", wx: m.tx, wy: m.ty }); }
    if (Number.isFinite(this.mx)) {
      const me = at(this.mx, this.my);
      ctx.fillStyle = DARK; ctx.fillRect(me.x - 4, me.y - 4, 9, 9); ctx.fillStyle = "#fff"; ctx.fillRect(me.x - 3, me.y - 3, 7, 7); ctx.fillStyle = "#ff4040"; ctx.fillRect(me.x - 1, me.y - 1, 3, 3);
    }
    this.compass(ctx, 34, H - 34, v);
  }

  /** Nhãn vùng (săn, an toàn, hang) có tâm ở chỗ chưa khám phá thì ẩn; cổng, NPC, truyền tống trận luôn hiện (R8). */
  private known(l: MapLabel) {
    return !(l.k === "zone" || l.k === "safe" || l.k === "lair") || !l.w || !l.h || fog().explored(l.x, l.y);
  }

  /** Có hiện nhãn này ở mức phóng `z` không (theo `MAPVIEW.labelZoom`, lớp lọc, sương mù). */
  private shows(l: MapLabel, z: number) {
    const lz = MAPVIEW.labelZoom;
    if (!this.known(l)) return false;
    if (l.k === "npc" && z < lz.npc) return false;
    if (l.k === "gate" && z < lz.gate) return false;
    if (l.k === "wp" && z < lz.wp) return false;
    if (l.k === "safe" && z < lz.safe) return false;
    return !((l.k === "npc" || l.k === "gate" || l.k === "wp") && !this.visible("npc"));
  }

  /** Vẽ nhãn theo thứ tự ưu tiên; nhãn nào đè lên nhãn đã đặt thì thử dịch lên / xuống, vẫn đè thì bỏ (phóng to sẽ thấy). */
  private drawLabels(ctx: CanvasRenderingContext2D, at: (tx: number, ty: number) => { x: number; y: number }, c: { x: number; y: number }, z: number) {
    const W = c.x * 2, H = c.y * 2, lz = MAPVIEW.labelZoom, placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const list = this.labels.filter((l) => this.shows(l, z)).sort((a, b) => LABEL_PRIO[a.k] - LABEL_PRIO[b.k]);
    for (const l of list) {
      const p = at(l.x, l.y);
      if (p.x < -80 || p.y < -30 || p.x > W + 80 || p.y > H + 30) continue;
      const big = l.k === "zone" || l.k === "lair", sub = z >= lz.zoneSub ? l.sub : l.brief, two = !!(sub && big);
      const col = l.k === "zone" ? "#ffe9a0" : l.k === "safe" ? "#9ae8c4" : l.k === "lair" ? "#ff8a92" : l.k === "gate" ? "#86e0b0" : l.k === "wp" ? (l.open ? "#8fe0ff" : "#b4b4c2") : PAPER;
      ctx.font = `${big ? "bold 13px" : "12px"} ${FONT}`; const w1 = ctx.measureText(l.text).width;
      let w2 = 0; if (two) { ctx.font = `12px ${FONT}`; w2 = ctx.measureText(sub!).width; }
      const bw = Math.max(w1, w2) + 12, bh = two ? 36 : 20, bx = p.x - bw / 2, by0 = p.y - (big ? bh / 2 : bh + 4);
      let by = by0, ok = false;
      for (const d of [0, -bh - 2, bh + 2, -2 * bh - 4, 2 * bh + 4]) {
        by = by0 + d; if (!placed.some((r) => bx < r.x1 + 2 && bx + bw > r.x0 - 2 && by < r.y1 + 2 && by + bh > r.y0 - 2)) { ok = true; break; }
      }
      if (!ok) continue;
      placed.push({ x0: bx, y0: by, x1: bx + bw, y1: by + bh });
      ctx.fillStyle = LABEL_BG; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = col; ctx.globalAlpha = 0.55; ctx.lineWidth = 1; ctx.strokeRect(bx + .5, by + .5, bw - 1, bh - 1); ctx.globalAlpha = 1;
      ctx.fillStyle = col; ctx.font = `${big ? "bold 13px" : "12px"} ${FONT}`; ctx.fillText(l.text, p.x, by + (two ? 11 : bh / 2 + 1));
      if (two) { ctx.font = `12px ${FONT}`; ctx.fillStyle = PAPER; ctx.fillText(sub!, p.x, by + 27); }
      if (!big || l.k === "lair") this.hits.push({ x: p.x - c.x, y: p.y - c.y, prio: 3, name: l.text, sub: l.sub ?? "", wx: l.x, wy: l.y });
    }
  }

  /** Cờ nhỏ: cọc + lá cờ màu `col`, chân cọc ở (x, y). */
  private flag(ctx: CanvasRenderingContext2D, x: number, y: number, col: string) {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = DARK; ctx.fillRect(x - 1, y - 14, 3, 15); ctx.fillRect(x, y - 15, 10, 8);
    ctx.fillStyle = "#e8e0d0"; ctx.fillRect(x, y - 13, 1, 13); ctx.fillStyle = col; ctx.fillRect(x + 1, y - 14, 8, 6);
  }

  /** La bàn ở góc: chữ B Đ N T theo hướng chiếu hiện tại, Bắc tô đỏ. */
  private compass(ctx: CanvasRenderingContext2D, x: number, y: number, v: MapView) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(26,16,32,.6)"; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#c9a45a"; ctx.lineWidth = 1; ctx.stroke();
    const na = radarNorthAngle(v.mode); ctx.fillStyle = "#d8262c"; ctx.rotate(na); ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(8, -4); ctx.lineTo(8, 4); ctx.closePath(); ctx.fill(); ctx.rotate(-na);
    ctx.font = 'bold 10px "Be Vietnam Pro", "Galmuri 11", system-ui, sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const q of [{ t: "B", dx: 0, dy: -1 }, { t: "Đ", dx: 1, dy: 0 }, { t: "N", dx: 0, dy: 1 }, { t: "T", dx: -1, dy: 0 }]) {
      const p = radarRotate(q.dx, q.dy, v.mode); ctx.fillStyle = q.t === "B" ? "#ff5a5a" : PAPER; ctx.fillText(q.t, p.x * 15, p.y * 15);
    }
    ctx.restore();
  }

  // ---------- Tìm nơi (UI v2) ----------
  /** Kết quả tìm tối đa; chọn một dòng thì căn bản đồ vào nhãn (phóng tới mức hiện được nhãn NPC / cổng). */
  private static readonly FIND_MAX = 6;
  private findBox() {
    const list = document.createElement("ul"); list.className = "mv-find"; list.setAttribute("role", "listbox"); list.setAttribute("aria-label", "Kết quả tìm"); list.hidden = true;
    const paint = (q: string) => {
      list.replaceChildren();
      if (!q.trim()) { list.hidden = true; return; }
      const hit = filterByQuery(this.labels, (l) => `${l.text} ${l.sub ?? ""}`, q, MapViewUi.FIND_MAX);
      for (const l of hit) {
        const li = document.createElement("li"); li.setAttribute("role", "option"); li.tabIndex = 0;
        const t = document.createElement("b"); t.textContent = l.text; li.append(t);
        if (l.sub) { const sub = document.createElement("small"); sub.textContent = l.sub; li.append(sub); }
        const go = () => { this.focusOn(l); list.hidden = true; };
        li.addEventListener("click", go); li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
        list.append(li);
      }
      if (!hit.length) { const li = document.createElement("li"); li.className = "none"; li.textContent = "Không có nơi nào khớp. Xoá bớt chữ để xem lại."; list.append(li); }
      list.hidden = false;
    };
    const { root, input } = searchField({ label: "Tìm nơi trên bản đồ", placeholder: "Tìm nơi / NPC (không cần dấu)", onInput: paint });
    root.classList.add("mv-search");
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") (list.querySelector("li:not(.none)") as HTMLElement | null)?.click(); });
    return [root, list];
  }
  /** Căn khung nhìn vào một nhãn; phóng tới mức nhìn rõ nhãn nhưng không thu nhỏ nếu đang gần hơn. */
  private focusOn(l: MapLabel) {
    this.view = mapviewClampCenter({ ...this.view, cx: l.x, cy: l.y, zoom: Math.max(this.view.zoom, MAPVIEW.labelZoom.npc), mode: radar().mode }, this.mapW, this.mapH);
    this.syncUi(); this.redraw();
  }

  // ---------- Thanh công cụ ----------
  private buildBar() {
    if (isUi2()) el("mapviewBar").append(...this.findBox());
    const box = el("mapviewLayers");
    for (const l of MAPVIEW.layers) {
      const b = document.createElement("button"); b.type = "button"; b.className = "mvchip"; b.textContent = l.name; b.dataset.layer = l.id;
      b.setAttribute("aria-pressed", String(!this.hidden.has(l.id)));
      press(b, () => {
        if (this.hidden.has(l.id)) this.hidden.delete(l.id); else this.hidden.add(l.id);
        b.setAttribute("aria-pressed", String(!this.hidden.has(l.id))); ls.set(LS_HIDDEN, JSON.stringify([...this.hidden])); this.redraw();
      });
      this.chips.set(l.id, b); box.appendChild(b);
    }
  }
}

let inst: MapViewUi | null = null;
/** Bản đồ khu vực duy nhất của trang (DOM #mapview nằm trong index.html); dựng lần đầu khi cần. */
export const mapview = () => inst ??= new MapViewUi();
