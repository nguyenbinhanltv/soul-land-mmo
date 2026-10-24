// Radar tròn góc màn hình (GAME_DESIGN.md mục 5.17, R2 #429): thay bản đồ nhỏ. Chỉ hiển thị: GameScene.drawMinimap đưa chấm vào
// (`begin` → `dot` / `rect` → `end`), phép chiếu / kẹp mép / xếp ưu tiên dùng hàm thuần ở shared/radar.ts, số liệu ở `RADAR`.
// Vẽ `RADAR.hz` lần mỗi giây; chấm lấy từ bể đối tượng dùng lại nên mỗi lần vẽ không dựng đối tượng chấm mới.
import { RADAR, RADAR_ART, TILE } from "../../shared/data.ts";
import { radarPlace, radarRotate, radarNorthAngle, radarCompassRotation, radarZoomStep, radarPick, type RadarMode } from "../../shared/radar.ts";
import { artUrl } from "./uiArt.ts";

const LS_MODE = "soul.radar.mode", LS_ZOOM = "soul.radar.zoom";
export const ls = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* chế độ riêng tư: bỏ qua */ } },
};
export const DARK = "#1a1020";
/** Đầu lâu 9×9 của mức boss / thú vương. */
const SKULL = ["..#####..", ".#######.", "##.###.##", "##.###.##", ".#######.", "..#####..", "..#.#.#..", "..#####..", "........."];
const SKULL_CELLS: [number, number][] = [];
SKULL.forEach((row, y) => [...row].forEach((c, x) => { if (c === "#") SKULL_CELLS.push([x, y]); }));
/** Chữ la bàn: Bắc, Đông, Nam, Tây và hướng (thế giới, −y là Bắc). */
const CARDINALS: { t: string; dx: number; dy: number }[] = [{ t: "B", dx: 0, dy: -1 }, { t: "Đ", dx: 1, dy: 0 }, { t: "N", dx: 0, dy: 1 }, { t: "T", dx: -1, dy: 0 }];

interface Dot { id: string; prio: number; x: number; y: number; wx: number; wy: number; name: string; col: string; ring: string; outside: boolean; tiles: number; angle: number; arrow: boolean; }
interface Box { x: number; y: number; w: number; h: number; col: string; }
const LEVEL = new Map(RADAR.levels.map((l) => [l.id, l]));

/** Biểu tượng pixel của từng mức, tâm (d.x, d.y), làm tròn xuống số nguyên cho nét sắc. Dùng chung radar và bản đồ khu vực (mapview.ts). */
export function drawRadarIcon(ctx: CanvasRenderingContext2D, d: { id: string; x: number; y: number; col: string; ring: string }, size: number, dim: boolean) {
  const x = Math.round(d.x), y = Math.round(d.y), h = size >> 1; ctx.globalAlpha = dim ? 0.45 : 1;
  switch (d.id) {
    case "beast": ctx.fillStyle = DARK; ctx.fillRect(x - h, y - h, size, size); ctx.fillStyle = d.col; ctx.fillRect(x - h + 1, y - h + 1, size - 2, size - 2); break;
    case "player": ctx.fillStyle = DARK; ctx.fillRect(x - h, y - h + 1, size, size - 2); ctx.fillRect(x - h + 1, y - h, size - 2, size); ctx.fillStyle = d.col; ctx.fillRect(x - h + 1, y - h + 1, size - 2, size - 2); break;
    case "poi": // thoi
      for (let i = -h; i <= h; i++) { const w = h - Math.abs(i); ctx.fillStyle = DARK; ctx.fillRect(x - w - 1, y + i, 2 * w + 3, 1); }
      for (let i = -h + 1; i < h; i++) { const w = h - 1 - Math.abs(i); ctx.fillStyle = d.col; ctx.fillRect(x - w, y + i, 2 * w + 1, 1); }
      break;
    case "quest": // dấu cộng dày (ngôi sao bốn cánh)
      ctx.fillStyle = DARK; ctx.fillRect(x - h, y - 2, size, 5); ctx.fillRect(x - 2, y - h, 5, size);
      ctx.fillStyle = d.col; ctx.fillRect(x - h + 1, y - 1, size - 2, 3); ctx.fillRect(x - 1, y - h + 1, 3, size - 2); break;
    case "ally": ctx.fillStyle = DARK; ctx.fillRect(x - h, y - h, size, size); ctx.fillStyle = d.ring || d.col; ctx.fillRect(x - h + 1, y - h + 1, size - 2, size - 2);
      ctx.fillStyle = d.col; ctx.fillRect(x - h + 2, y - h + 2, size - 4, size - 4); break;
    case "elite": // chữ X sáng màu aura
      ctx.fillStyle = DARK; for (let i = -h; i <= h; i++) { ctx.fillRect(x + i - 1, y + i - 1, 3, 3); ctx.fillRect(x + i - 1, y - i - 1, 3, 3); }
      ctx.fillStyle = d.col; for (let i = -h; i <= h; i++) { ctx.fillRect(x + i, y + i, 1, 1); ctx.fillRect(x + i, y - i, 1, 1); } break;
    default: // boss: đầu lâu
      ctx.fillStyle = DARK; ctx.fillRect(x - 5, y - 5, 11, 11); ctx.fillStyle = d.col; for (const [cx, cy] of SKULL_CELLS) ctx.fillRect(x - 4 + cx, y - 4 + cy, 1, 1);
  }
  ctx.globalAlpha = 1;
}

/** Nơi nhận chấm của một lượt gom (radar và bản đồ khu vực): GameScene gom một lần cho cả hai. `layer` rỗng thì lớp lọc theo loại chấm (MAPVIEW.layerOf). */
export interface DotSink {
  dot(id: string, tx: number, ty: number, name: string, col?: string, ring?: string, layer?: string): void;
  rect(tx: number, ty: number, w: number, h: number, col: string): void;
  /** Đường đi tới cờ (R4): dãy toạ độ ô phẳng [x0, y0, x1, y1, …] (không sao chép: nơi nhận chỉ giữ tham chiếu tới hết lượt vẽ). */
  line(pts: number[], col: string): void;
}

/** Vẽ đường đi (toạ độ ô, đã áp phép chiếu của canvas): nét đứt màu `col` có viền mực cho dễ thấy trên mọi nền. `k` = pixel mỗi ô. */
export function strokeRoute(ctx: CanvasRenderingContext2D, pts: number[], col: string, k: number) {
  if (pts.length < 4) return;
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  for (const [w, c, dash] of [[3.5, DARK, false], [2, col, true]] as const) {
    ctx.lineWidth = w / k; ctx.strokeStyle = c; ctx.setLineDash(dash ? [5 / k, 4 / k] : []);
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i + 1 < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke();
  }
  ctx.restore();
}

class Radar implements DotSink {
  readonly wrap = document.getElementById("radar")!;
  readonly cv = document.getElementById("mini") as HTMLCanvasElement;
  readonly ctx = this.cv.getContext("2d")!;
  readonly tip = document.getElementById("radarTip")!;
  readonly frame = document.getElementById("radarFrame") as HTMLImageElement;
  readonly modeBtn = document.getElementById("radarMode")!;
  readonly infoEl = document.getElementById("radarInfo")!;
  base: CanvasImageSource | null = null;
  /** Số điểm ảnh của nền trên mỗi ô (1 với nền vẽ từ ô, `MINI_BASE.px` với ảnh R1). */
  baseScale = 1;
  /** Bản đồ của nền hiện tại, để ảnh tải muộn của bản đồ cũ không đè nền bản đồ mới. */
  baseKey = "";
  mode: RadarMode = ls.get(LS_MODE) === "flat" ? "flat" : "iso";
  zoom = (() => { const z = Number(ls.get(LS_ZOOM)); return Number.isInteger(z) && z >= 0 && z < RADAR.zooms.length ? z : RADAR.zoomDefault; })();
  private pool: Dot[] = []; private n = 0; private live: Dot[] = [];
  private boxes: Box[] = []; private nb = 0;
  private route: number[] | null = null; private routeCol = "";
  private last = 0; private px = 0; private py = 0; private now = 0;
  private size = RADAR.size.desktop; private scale = 1;
  private hover: { x: number; y: number } | null = null; private tipTimer = 0;
  private info = ""; private compass: HTMLImageElement | null = null; private frameDone = false;
  private compassTried = false;
  /** Bấm vào radar (chuột; cảm ứng thì chạm chỗ không có chấm) mở bản đồ khu vực: GameScene đặt. */
  onOpen: (() => void) | null = null;

  constructor() {
    const cv = this.cv;
    cv.addEventListener("wheel", (e) => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1 : -1); }, { passive: false });
    cv.addEventListener("pointermove", (e) => this.point(e));
    cv.addEventListener("pointerdown", (e) => {
      this.point(e);
      if (e.pointerType !== "mouse") { clearTimeout(this.tipTimer); this.tipTimer = window.setTimeout(() => this.point(null), 2500); if (this.tip.hidden) this.onOpen?.(); }
    });
    cv.addEventListener("click", (e) => { if ((e as PointerEvent).pointerType === "mouse") this.onOpen?.(); });
    cv.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") this.point(null); });
    document.getElementById("radarIn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); this.zoomBy(1); });
    document.getElementById("radarOut")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); this.zoomBy(-1); });
    this.modeBtn.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); this.setMode(this.mode === "iso" ? "flat" : "iso"); });
    this.syncUi();
  }

  setBase(base: CanvasImageSource, scale = 1, key = this.baseKey) { this.base = base; this.baseScale = scale; this.baseKey = key; this.last = 0; }
  zoomBy(dir: 1 | -1) { this.zoom = radarZoomStep(this.zoom, dir); ls.set(LS_ZOOM, String(this.zoom)); this.syncUi(); this.last = 0; }
  setMode(m: RadarMode) { this.mode = m; ls.set(LS_MODE, m); this.syncUi(); this.last = 0; }
  private syncUi() {
    const flat = this.mode === "flat";
    this.modeBtn.setAttribute("aria-pressed", String(flat));
    this.modeBtn.title = flat ? "Nhìn thẳng (Bắc lên): bấm để xoay theo màn hình" : "Xoay theo màn hình isometric: bấm để nhìn thẳng";
    this.modeBtn.textContent = flat ? "⬆" : "◈";
    (document.getElementById("radarIn") as HTMLButtonElement).disabled = this.zoom === 0;
    (document.getElementById("radarOut") as HTMLButtonElement).disabled = this.zoom === RADAR.zooms.length - 1;
  }

  /** Tới lượt vẽ chưa (RADAR.hz lần mỗi giây). */
  due(now: number) { return now - this.last >= 1000 / RADAR.hz; }

  /** Bắt đầu một lượt: tâm radar ở (tx, ty) tính theo ô (số thực). */
  begin(tx: number, ty: number, now: number) { this.last = now; this.now = now; this.px = tx; this.py = ty; this.n = 0; this.nb = 0; this.route = null; }

  /** Thêm một chấm mức `id` (RADAR.levels) ở vị trí ô (tx, ty). `col` / `ring` đè màu của mức. */
  dot(id: string, tx: number, ty: number, name: string, col = "", ring = "", _layer = "") {
    const lv = LEVEL.get(id); if (!lv) return;
    let d = this.pool[this.n]; if (!d) d = this.pool[this.n] = { id: "", prio: 0, x: 0, y: 0, wx: 0, wy: 0, name: "", col: "", ring: "", outside: false, tiles: 0, angle: 0, arrow: false };
    this.n++; d.id = id; d.prio = lv.prio; d.wx = tx; d.wy = ty; d.name = name; d.col = col || lv.col; d.ring = ring; d.arrow = lv.arrow;
  }
  /** Khung vùng (ô) vẽ trên nền: hang thú vương, vùng săn của nhiệm vụ. */
  rect(tx: number, ty: number, w: number, h: number, col: string) {
    let b = this.boxes[this.nb]; if (!b) b = this.boxes[this.nb] = { x: 0, y: 0, w: 0, h: 0, col: "" };
    this.nb++; b.x = tx; b.y = ty; b.w = w; b.h = h; b.col = col;
  }

  line(pts: number[], col: string) { this.route = pts; this.routeCol = col; }

  /** Vẽ lượt vừa gom; `info` là dòng "tên bản đồ · tọa độ · Kênh N". */
  end(info: string) {
    if (info !== this.info) { this.info = info; this.infoEl.textContent = info; }
    this.artCheck();
    const cv = this.cv, css = cv.clientWidth || RADAR.size.desktop, dpr = Math.min(2, window.devicePixelRatio || 1), px = Math.round(css * dpr);
    if (cv.width !== px) { cv.width = px; cv.height = px; }
    this.size = css; this.scale = px / css;
    const ctx = this.ctx, S = css, c = S / 2, rPx = c - 2, rTiles = RADAR.zooms[this.zoom] ?? RADAR.r, k = rPx / rTiles, mode = this.mode;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, S, S);
    ctx.save(); ctx.beginPath(); ctx.arc(c, c, rPx, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#10201a"; ctx.fillRect(0, 0, S, S);
    // Nền: ảnh bản đồ (1 hoặc `baseScale` điểm / ô, vẽ về đơn vị ô), tịnh tiến về tâm mình rồi xoay (iso: 45°, không ép dọc) và phóng.
    ctx.translate(c, c); if (mode === "iso") ctx.rotate(Math.PI / 4); ctx.scale(k, k); ctx.translate(-this.px, -this.py);
    if (this.base) { const b = this.base as HTMLCanvasElement | HTMLImageElement; ctx.drawImage(b, 0, 0, b.width / this.baseScale, b.height / this.baseScale); }
    ctx.lineWidth = 1.5 / k;
    for (let i = 0; i < this.nb; i++) { const b = this.boxes[i]; ctx.strokeStyle = b.col; ctx.strokeRect(b.x, b.y, b.w, b.h); }
    if (this.route) strokeRoute(ctx, this.route, this.routeCol, k);
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(c, c, rPx, 0, Math.PI * 2); ctx.clip(); ctx.translate(c, c);
    this.drawCompass(ctx, rPx);

    // Chấm: tính chỗ đặt, xếp thấp → cao (đè), vẽ. Ngoài tầm chỉ giữ mức có `arrow` (mũi tên ở mép).
    const live = this.live; live.length = 0;
    for (let i = 0; i < this.n; i++) {
      const d = this.pool[i], p = radarPlace((d.wx - this.px) * TILE, (d.wy - this.py) * TILE, mode, rTiles, rPx);
      if (p.outside && !d.arrow) continue;
      d.x = p.x; d.y = p.y; d.outside = p.outside; d.tiles = p.tiles; d.angle = p.angle; live.push(d);
    }
    live.sort((a, b) => a.prio - b.prio);
    const on = Math.floor(this.now / 400) % 2 === 0; let arrows = 0;
    for (const d of live) {
      const lv = LEVEL.get(d.id)!;
      if (d.outside) { if (arrows++ < 12) this.drawArrow(ctx, d, lv.size); continue; }
      if (lv.blink && !on) { drawRadarIcon(ctx, d, lv.size, true); continue; }
      drawRadarIcon(ctx, d, lv.size, false);
    }
    // Mình: chấm trắng tâm đỏ ở giữa.
    ctx.fillStyle = DARK; ctx.fillRect(-3, -3, 7, 7); ctx.fillStyle = "#fff"; ctx.fillRect(-2, -2, 5, 5); ctx.fillStyle = "#ff4040"; ctx.fillRect(-1, -1, 3, 3);
    ctx.restore();
    // Viền gỗ tạm (CSS khi có ảnh khung thì ảnh phủ lên).
    ctx.lineWidth = 3; ctx.strokeStyle = "#5a3d22"; ctx.beginPath(); ctx.arc(c, c, c - 1.5, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = "#c9a45a"; ctx.beginPath(); ctx.arc(c, c, rPx + 0.5, 0, Math.PI * 2); ctx.stroke();
    this.showTip();
  }

  /** La bàn: có ảnh `ui_radar_compass` thì vẽ ảnh xoay theo `radarCompassRotation`; chưa có thì chữ B Đ N T quanh viền. Bắc luôn tô đỏ + chữ B bằng code. */
  private drawCompass(ctx: CanvasRenderingContext2D, rPx: number) {
    const mode = this.mode, img = this.compass, ok = img && img.complete && img.naturalWidth > 0;
    const sz = this.size * RADAR_ART.compass.w / RADAR.size.desktop, na = radarNorthAngle(mode);
    if (ok) {
      ctx.save(); ctx.globalAlpha = 0.38; ctx.rotate(radarCompassRotation(mode)); ctx.drawImage(img!, -sz / 2, -sz / 2, sz, sz); ctx.restore();
      // Đầu mũi Bắc (ảnh không có chữ, hai mũi Bắc / Nam dài bằng nhau): tam giác đỏ ở đầu mũi và chữ "B" ngay ngoài.
      const tip = sz * 0.46;
      ctx.save(); ctx.rotate(na); ctx.fillStyle = "#d8262c"; ctx.strokeStyle = DARK; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tip, 0); ctx.lineTo(tip - 12, -4); ctx.lineTo(tip - 12, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      this.letter(ctx, "B", Math.cos(na) * (rPx - 7), Math.sin(na) * (rPx - 7), "#ff5a5a");
      return;
    }
    ctx.strokeStyle = "rgba(236,226,200,.18)"; ctx.lineWidth = 1; ctx.beginPath();
    for (const q of CARDINALS) { const v = radarRotate(q.dx, q.dy, mode); ctx.moveTo(0, 0); ctx.lineTo(v.x * rPx, v.y * rPx); }
    ctx.stroke();
    for (const q of CARDINALS) { const v = radarRotate(q.dx, q.dy, mode); this.letter(ctx, q.t, v.x * (rPx - 7), v.y * (rPx - 7), q.t === "B" ? "#ff5a5a" : "#ece2c8"); }
  }
  private letter(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, col: string) {
    ctx.font = 'bold 10px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 3; ctx.strokeStyle = DARK; ctx.strokeText(t, x, y); ctx.fillStyle = col; ctx.fillText(t, x, y);
  }

  /** Mũi tên ở mép hướng về mục tiêu ngoài tầm, kèm khoảng cách (ô). */
  private drawArrow(ctx: CanvasRenderingContext2D, d: Dot, size: number) {
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.angle);
    ctx.fillStyle = d.col; ctx.strokeStyle = DARK; ctx.lineWidth = 1.5; const s = Math.max(5, size - 1);
    ctx.beginPath(); ctx.moveTo(s * 0.7, 0); ctx.lineTo(-s * 0.5, -s * 0.6); ctx.lineTo(-s * 0.5, s * 0.6); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
    const len = Math.hypot(d.x, d.y) || 1, ix = d.x - (d.x / len) * 11, iy = d.y - (d.y / len) * 11;
    ctx.font = '9px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 2.5; ctx.strokeStyle = DARK; const t = String(Math.floor(d.tiles)); ctx.strokeText(t, ix, iy); ctx.fillStyle = "#fff"; ctx.fillText(t, ix, iy);
  }

  // ---------- Tên khi rê chuột / chạm ----------
  private point(e: PointerEvent | null) {
    if (!e) { this.hover = null; this.tip.hidden = true; return; }
    const r = this.cv.getBoundingClientRect(), f = this.size / (r.width || this.size);
    this.hover = { x: (e.clientX - r.left) * f - this.size / 2, y: (e.clientY - r.top) * f - this.size / 2 };
    this.showTip();
  }
  private showTip() {
    const h = this.hover; if (!h) return;
    const d = radarPick(this.live, h.x, h.y);
    if (!d) { this.tip.hidden = true; return; }
    this.tip.textContent = d.outside ? `${d.name} · ${Math.floor(d.tiles)} ô` : d.name;
    this.tip.hidden = false;
    const w = this.size, left = Math.min(Math.max(w / 2 + d.x, 30), w - 30), top = w / 2 + d.y;
    this.tip.style.left = `${left}px`; this.tip.style.top = `${top + 12 > w - 14 ? top - 16 : top + 12}px`;
  }

  /** Ảnh khung / la bàn của R7 (#434): có trong manifest thì dùng, chưa có thì giữ viền CSS và chữ vẽ bằng code. */
  private artCheck() {
    if (!this.frameDone) {
      const u = artUrl(RADAR_ART.frame.key);
      if (u) { this.frame.style.width = `${RADAR_ART.frame.w / RADAR.size.desktop * 100}%`; this.frame.src = u; this.frame.hidden = false; this.wrap.classList.add("art"); this.frameDone = true; }
    }
    if (!this.compassTried) {
      const u = artUrl(RADAR_ART.compass.key);
      if (u) { this.compassTried = true; this.compass = new Image(); this.compass.src = u; }
    }
  }
}

let inst: Radar | null = null;
/** Radar duy nhất của trang (DOM #radar nằm trong index.html); dựng lần đầu khi cần. */
export const radar = () => inst ??= new Radar();
