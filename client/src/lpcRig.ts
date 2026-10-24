// Bộ ghép lớp lúc chạy cho hồn sư chế độ Tự tạo (L3 #510; GAME_DESIGN.md mục 5.11 "Hồn sư chế độ Tự tạo").
// Mỗi tổ hợp món (chuỗi `PlayerState.lpc`) là MỘT texture đệm `lpcc_<m|f>_<n>` theo bố cục sheet hồn sư isometric (24 cột × 6 hàng
// logic, khung 64), nên honsuAnimKey / createHonsuAnims / syncLayers dùng nguyên như NPC LPC. Người cùng tổ hợp dùng
// chung; sheet từng món tải theo đường dẫn riêng (không qua loader của Phaser), tô màu theo dải LPC_RAMPS rồi dùng chung giữa các
// tổ hợp (cùng sheet + cùng bảng đổi màu); ghép theo (tổ hợp, hoạt ảnh) khi có người cần; hết người dùng thì giải phóng sau LPC_VIEW.graceMs.
// Không tạo texture mỗi khung: mọi việc nặng nằm trong `step`, mỗi khung hình chỉ chạy tới LPC_VIEW.budgetMs.
import Phaser from "phaser";
import { LPC_PARTS, LPC_RAMPS, LPC_SHEET, LPC_VIEW, decodeLpc, type LpcLooks, type LpcPart } from "../../shared/data.ts";
import { ISO_HS_ANIMS, ISO_HS_FRAME, ISO_SHEET_COLS, createHonsuAnims, type HsAnim } from "./sprites.ts";

const F = ISO_HS_FRAME;
const BASE = "lpcparts/";
const byId = new Map<string, LpcPart>(LPC_PARTS.map((p) => [p.id, p]));
const hex = (c: string) => parseInt(c.slice(1), 16);
const OUTLINE = hex(LPC_VIEW.outline);

/** Hàng vật lý trong texture: s, e (se / e / ne dùng chung), n, rồi hàng absorb. Hàng logic của khung (ISO_DIRS + absorb) ánh xạ vào đây. */
const PHYS_DIR_ROW = [0, 1, 1, 1, 2];
const ABSORB_PHYS_ROW = 3, ABSORB_LOGIC_ROW = 5;
/** Cột đầu của hurt / die trên sheet hồn sư (mọi hướng dùng cùng khung hướng xuống). */
const FIRST_DOWN_ONLY_COL = Math.min(ISO_HS_ANIMS.hurt.col, ISO_HS_ANIMS.die.col);
const ANIMS = Object.keys(ISO_HS_ANIMS) as HsAnim[];
/** Hoạt ảnh ghép ngay khi có tổ hợp (đứng, đi, đánh, thi triển, bị đánh); còn lại ghép khi cần. */
const EAGER: HsAnim[] = ["idle", "walk", "attack", "cast", "hurt"];

interface Src { key: string; sheet: string; pairs: [number, number][]; refs: number; state: "wait" | "queued" | "ready" | "fail"; img: CanvasImageSource | null }
interface Raw { refs: number; state: "load" | "ready" | "fail"; img: HTMLImageElement | null; waiting: Src[] }
export interface Spec { sheet: string; z: number; tint: string; pairs: [number, number][]; idle: boolean }
interface Combo {
  id: number; str: string; key: string; sex: "m" | "f"; refs: number; freeAt: number;
  layers: Src[]; idleOk: boolean; want: Set<HsAnim>; done: Set<HsAnim>;
  tex: Phaser.Textures.CanvasTexture; ctx: CanvasRenderingContext2D;
}

/** Danh sách lớp của một ngoại hình LPC theo thứ tự vẽ (zPos tăng dần): sheet, bảng đổi màu dải gốc → dải chọn. */
export function layerSpecs(l: LpcLooks): Spec[] {
  const sx = l.body === 0 ? "m" : "f", out: Spec[] = [];
  for (const slot of Object.keys(l.parts)) {
    const part = byId.get(l.parts[slot]); if (!part) continue;
    const pick = l.colors[slot], color = part.colors.length ? (part.colors.includes(pick) ? pick : part.colors[0]) : "";
    const pairs: [number, number][] = [];
    for (const mat of part.mats) {
      const [fam, base] = mat.split(":"), R = LPC_RAMPS[fam]; if (!R) continue;
      // Da và mắt theo màu chung của thân; tóc / mày / râu theo màu của ô, thiếu thì theo màu tóc; còn lại theo màu của ô.
      const name = fam === "body" ? l.colors.skin : fam === "eye" ? l.colors.eye : fam === "hair" ? (pick ?? l.colors.hair) : pick;
      const from = R.ramps[base], to = (name ? R.ramps[name] : undefined) ?? from;
      if (from && to !== from) from.forEach((c, i) => pairs.push([hex(c), hex(to[Math.min(i, to.length - 1)])]));
    }
    const tint = pairs.map(([a, b]) => `${a.toString(16)}>${b.toString(16)}`).join(",");
    const idle = part.idle.includes(sx);
    for (const z of part.z) out.push({ sheet: `lpcp_${part.id.replace(".", "_")}_${sx}_${z}${color ? `_${color}` : ""}`, z, tint, pairs, idle });
  }
  return out.sort((a, b) => a.z - b.z);
}

/** Tô màu một sheet: đổi từng sắc dải gốc sang sắc dải chọn (`pairs`: [từ, sang] dạng 0xRRGGBB); trả canvas mới. */
export function tintImage(img: HTMLImageElement, pairs: [number, number][]): HTMLCanvasElement {
  const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, cv.width, cv.height), d = px.data, map = new Map(pairs);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const to = map.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    if (to !== undefined) { d[i] = to >> 16; d[i + 1] = (to >> 8) & 255; d[i + 2] = to & 255; }
  }
  ctx.putImageData(px, 0, 0);
  return cv;
}

/** Ghép một khung từ các lớp (đã sắp theo zPos; lớp null chưa tải thì bỏ) vào `t` (khung F×F), rồi viền ngoài như hồn sư. Dùng chung bộ ghép trong game và màn tạo nhân vật. */
export function flattenFrame(t: CanvasRenderingContext2D, layers: (CanvasImageSource | null)[], srcCol: number, srcRow: number) {
  t.clearRect(0, 0, F, F);
  for (const img of layers) if (img) t.drawImage(img, srcCol * F, srcRow * F, F, F, 0, 0, F, F);
  const px = t.getImageData(0, 0, F, F), d = px.data;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < F && y < F && d[(y * F + x) * 4 + 3] >= 128;
  const edge = new Uint8Array(F * F);
  for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {
    const i = (y * F + x) * 4;
    if (d[i + 3] < 128) continue;
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    edge[y * F + x] = !(solid(x - 1, y) && solid(x + 1, y) && solid(x, y - 1) && solid(x, y + 1)) || lum < 0.12 * 255 ? 1 : 0;
  }
  for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {
    const i = (y * F + x) * 4;
    if (d[i + 3] < 128) { d[i + 3] = 0; continue; }
    d[i + 3] = 255;
    if (edge[y * F + x]) { d[i] = OUTLINE >> 16; d[i + 1] = (OUTLINE >> 8) & 255; d[i + 2] = OUTLINE & 255; }
  }
  t.putImageData(px, 0, 0);
}

export class LpcRig {
  private raw = new Map<string, Raw>();
  private tinted = new Map<string, Src>();
  private queue: Src[] = [];
  private combos = new Map<string, Combo>();
  private byKey = new Map<string, Combo>();
  private dirty = new Set<Combo>();
  private seq = 0;
  private gcAt = 0;
  private tmp = document.createElement("canvas");
  private tctx: CanvasRenderingContext2D;

  constructor(private scene: Phaser.Scene) {
    this.tmp.width = this.tmp.height = F;
    this.tctx = this.tmp.getContext("2d", { willReadFrequently: true })!;
  }

  /** Lấy (hoặc dựng) tổ hợp của chuỗi `lpc`: trả key texture (tăng số người dùng), chuỗi hỏng thì null. Gọi `release` khi hết dùng. */
  acquire(str: string): string | null {
    let c = this.combos.get(str);
    if (!c) {
      const l = decodeLpc(str); if (!l) return null;
      c = this.build(str, l);
    }
    c.refs++;
    for (const a of EAGER) this.want(c, a);
    return c.key;
  }

  release(key: string) {
    const c = this.byKey.get(key); if (!c || c.refs <= 0) return;
    if (--c.refs === 0) c.freeAt = performance.now();
  }

  /** Hoạt ảnh `anim` của texture đã ghép xong chưa (chưa thì xin ghép; nơi gọi tạm dùng hoạt ảnh khác). */
  ready(key: string, anim: HsAnim): boolean {
    const c = this.byKey.get(key); if (!c) return false;
    if (c.done.has(anim)) return true;
    this.want(c, anim);
    return false;
  }

  private want(c: Combo, anim: HsAnim) {
    if (c.done.has(anim) || c.want.has(anim)) return;
    c.want.add(anim); this.dirty.add(c);
  }

  private build(str: string, l: LpcLooks): Combo {
    const specs = layerSpecs(l), id = ++this.seq, sex = l.body === 0 ? "m" : "f", key = `lpcc_${sex}_${id}`;
    const tex = this.scene.textures.createCanvas(key, ISO_SHEET_COLS * F, 4 * F)!;
    for (let row = 0; row <= ABSORB_LOGIC_ROW; row++) for (let col = 0; col < ISO_SHEET_COLS; col++) {
      const prow = col >= FIRST_DOWN_ONLY_COL && row < ABSORB_LOGIC_ROW ? 0 : row === ABSORB_LOGIC_ROW ? ABSORB_PHYS_ROW : PHYS_DIR_ROW[row];
      tex.add(row * ISO_SHEET_COLS + col, 0, col * F, prow * F, F, F);
    }
    const c: Combo = { id, str, key, sex, refs: 0, freeAt: 0, layers: specs.map((s) => this.src(s)), idleOk: specs.every((s) => s.idle),
      want: new Set(), done: new Set(), tex, ctx: tex.getContext() };
    this.combos.set(str, c); this.byKey.set(key, c);
    createHonsuAnims(this.scene, key);
    return c;
  }

  // ---------- Sheet từng món: tải, tô màu, dùng chung ----------
  private src(s: Spec): Src {
    const k = `${s.sheet}#${s.tint}`;
    let a = this.tinted.get(k);
    if (a) { a.refs++; return a; }
    a = { key: k, sheet: s.sheet, pairs: s.pairs, refs: 1, state: "wait", img: null };
    this.tinted.set(k, a);
    let r = this.raw.get(s.sheet);
    if (!r) {
      const img = new Image();
      r = { refs: 0, state: "load", img, waiting: [] };
      this.raw.set(s.sheet, r);
      const rr = r;
      img.onload = () => { rr.state = "ready"; for (const w of rr.waiting.splice(0)) this.queueSrc(w); };
      img.onerror = () => { rr.state = "fail"; for (const w of rr.waiting.splice(0)) w.state = "fail"; };
      img.src = `${BASE}${s.sheet}.png`;
    }
    r.refs++;
    if (r.state === "ready") this.queueSrc(a); else if (r.state === "fail") a.state = "fail"; else r.waiting.push(a);
    return a;
  }

  private queueSrc(a: Src) {
    if (!a.pairs.length) { a.img = this.raw.get(a.sheet)!.img; a.state = "ready"; } // không đổi màu: dùng thẳng ảnh gốc
    else { a.state = "queued"; this.queue.push(a); }
  }

  private tint(a: Src) {
    const img = this.raw.get(a.sheet)?.img;
    if (!img) { a.state = "fail"; return; }
    const cv = tintImage(img, a.pairs);
    a.img = cv; a.state = "ready";
  }

  private freeSrc(a: Src) {
    if (--a.refs > 0) return;
    this.tinted.delete(a.key);
    if (a.img instanceof HTMLCanvasElement) { a.img.width = 0; a.img.height = 0; }
    const qi = this.queue.indexOf(a); if (qi >= 0) this.queue.splice(qi, 1);
    const r = this.raw.get(a.sheet);
    if (r) {
      const wi = r.waiting.indexOf(a); if (wi >= 0) r.waiting.splice(wi, 1);
      if (--r.refs <= 0) { if (r.img) { r.img.onload = r.img.onerror = null; r.img.src = ""; } this.raw.delete(a.sheet); }
    }
  }

  // ---------- Ghép khung ----------
  /** Ghép một khung: vẽ các lớp theo zPos vào ảnh tạm, viền ngoài, rồi đặt vào ô (tx, ty) của texture. `breathe`: nhích phần trên 1 điểm. */
  private frame(c: Combo, srcCol: number, srcRow: number, tx: number, ty: number, breathe: boolean) {
    flattenFrame(this.tctx, c.layers.map((L) => (L.state === "ready" ? L.img : null)), srcCol, srcRow);
    const o = c.ctx, Y = LPC_VIEW.breatheY;
    o.clearRect(tx, ty, F, F);
    if (breathe) { o.drawImage(this.tmp, 0, 0, F, Y, tx, ty + 1, F, Y); o.drawImage(this.tmp, 0, Y, F, F - Y, tx, ty + Y, F, F - Y); }
    else o.drawImage(this.tmp, 0, 0, F, F, tx, ty, F, F);
  }

  /** Ghép cả hoạt ảnh `anim` (mọi hướng vẽ được) vào texture của tổ hợp. */
  private compose(c: Combo, anim: HsAnim) {
    const A = LPC_SHEET.anims[anim], strip = LPC_SHEET.strips[A.strip as keyof typeof LPC_SHEET.strips], iso = ISO_HS_ANIMS[anim];
    const rows = LPC_SHEET.rows;
    // Bộ thiếu idle: đứng bằng khung đi đầu tiên, phần trên nhích 1 điểm ở nửa sau chu kỳ (thở bằng code).
    const fallback = anim === "idle" && !c.idleOk, st = fallback ? LPC_SHEET.strips.walk : strip;
    const targets: [number, number][] = A.dirs === "all"
      ? [[0, rows.s], [1, rows.e], [2, rows.n]] // hàng vật lý → hàng của sheet món
      : [[anim === "absorb" ? ABSORB_PHYS_ROW : 0, A.strip === "hurt" ? rows.hurt : rows.s]];
    for (const [prow, srow] of targets) for (let i = 0; i < iso.ms.length; i++) {
      const col = st.col + (fallback ? 0 : A.idx[i]);
      this.frame(c, col, srow, (iso.col + i) * F, prow * F, fallback && i >= iso.ms.length / 2);
    }
    c.tex.refresh();
  }

  /** Mỗi khung hình: tô màu sheet đã tải, ghép hoạt ảnh được xin (chỉ khi mọi lớp của tổ hợp đã tải xong), dọn tổ hợp hết người dùng. */
  step(budgetMs = LPC_VIEW.budgetMs) {
    const t0 = performance.now(), over = () => performance.now() - t0 >= budgetMs;
    while (this.queue.length && !over()) this.tint(this.queue.shift()!);
    for (const c of this.dirty) {
      if (!c.want.size) { this.dirty.delete(c); continue; }
      if (c.layers.some((L) => L.state === "wait" || L.state === "queued")) continue;
      for (const a of [...c.want]) {
        if (over()) return;
        this.compose(c, a); c.want.delete(a); c.done.add(a);
      }
      this.dirty.delete(c);
    }
    if (t0 - this.gcAt < 1000) return;
    this.gcAt = t0;
    for (const c of [...this.combos.values()]) if (c.refs === 0 && t0 - c.freeAt > LPC_VIEW.graceMs) this.drop(c);
  }

  private drop(c: Combo) {
    this.combos.delete(c.str); this.byKey.delete(c.key); this.dirty.delete(c);
    for (const L of c.layers) this.freeSrc(L);
    for (const name of ANIMS) for (const k of [`${c.key}:${name}_s`, ...["se", "e", "ne", "n"].map((d) => `${c.key}:${name}_${d}`)]) if (this.scene.anims.exists(k)) this.scene.anims.remove(k);
    this.scene.textures.remove(c.key);
  }

  /** Số tổ hợp / sheet đang giữ (để đo và kiểm). */
  stats() { return { combos: this.combos.size, sheets: this.tinted.size, raw: this.raw.size }; }

  /** Bỏ mọi thứ (scene tắt). */
  destroy() {
    for (const c of [...this.combos.values()]) this.drop(c);
    this.queue.length = 0;
  }
}
