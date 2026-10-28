// Trang thử chuyển động phụ phụ thể (H7 #490; mở bằng `?thu=phuthe`, không cần đăng nhập): hai hồn sư cạnh nhau, trái "Trước" (đứng yên như bản cũ),
// phải "Sau" (chuyển động phụ bằng code, đúng spiritMotion.ts như trong game). Tham số URL cho chụp tự động: vh, huong=s|e|n|w, trang=idle|walk|attack|cast,
// muc=low|mid|high, giam=1 (Giảm chuyển động), khac=1 (người khác: nhẹ hơn), n=<số người> (đo tải: vòng tròn n hồn sư đủ 25 võ hồn), bar=0 (ẩn thanh), zoom.
// Phụ thể v2 (#1023): võ hồn có sheet `vhanim_{id}` trong manifest thì bên "Sau" phát clip vẽ thật (khung theo giờ hoạt ảnh thân, 5 hướng, trang=hurt xem clip bị đánh);
// chưa có thì `anim=fake` dựng sheet GIẢ lúc chạy từ ảnh tĩnh (phutheFake.ts, không phải ảnh model); `anim=0` ép nhánh cũ; `khung=128` thử khung 128 của sheet giả.
// Neo theo tâm khối thân (phutheAnchor.ts, chỉ clip vẽ thật hoặc `anim=fake`): bên "Sau" dùng `sprites/vohonanim/anchor.json` (`neo=0` tắt = hành vi cũ, thấy ngay trước / sau); thanh trượt dx, dy, scale theo (giới `gioi=m|f`, hướng đang chọn),
// chữ thập = giữa lưng thân LPC (điểm đích), nút "Xuất anchor.json" tải bảng đã chỉnh (mục `manual`: công cụ không ghi đè). Chỉnh giữ trong sessionStorage khi đổi võ hồn; thân thử là nam (`dan_khach`), nên giới f chỉ chỉnh số.
// Màn chỉnh ráp `sua=1` (#1192, GM / dev; trang thử không nằm trong game thường): ba hồn sư cạnh nhau (thân LPC trơn / Trước / Sau), bảng bên phải chỉnh dx, dy, scale từng (giới, hướng) bằng kéo thả, phím mũi tên, ô số, hoàn tác, xem đủ clip, lưu anchor.json (phutheEditor.ts).
// `window.__phuthe.at(ms, trang)` đặt đồng hồ giả để chụp khung chính xác (không phụ thuộc tốc độ máy); `bench()` đo mili giây tính chuyển động mỗi khung.
import Phaser from "phaser";
import { VOHON } from "../../shared/data.ts";
import { fxPrefs, setFxPrefs, type FxLevel } from "./combatFx.ts";
import { SPR } from "./iso.ts";
import { fitHonsuLayer, fitPhuLayer, isIsoSheet, phuAnimSetOf, setPhuLayout, syncPhuLayers, vohonFrame, ISO_HS_ANIMS, ISO_SHEET_COLS, type PhuAnimSet } from "./sprites.ts";
import type { Dir8 } from "./iso.ts";
import { PHU_DEFAULT_CLIPS, PHU_CLIPS, PHU_DIRS, PHU_ROWS_PER_SEX, PHU_FRAMES, parsePhuLayout, phuDirRow, phuFaceOf } from "./phutheAnim.ts";
import { PHU_NO_ANCHOR, PHU_SCALE_RANGE, loadPhuAnchors, parsePhuAnchor, phuAnchorAt, phuAnchorJson, phuAnchorsOf, setPhuAnchors, type PhuAnchorTable } from "./phutheAnchor.ts";
import { fakePose } from "./phutheFake.ts";
import { mountPhutheEditor, PHU_EDITOR_W } from "./phutheEditor.ts";
import { vohonTextures } from "./textures.ts";
import { SPIRIT_FAMILY, SPIRIT_MOTION, clipOscK, spiritPose, spiritScale, spiritPhase, applySpiritPose, newSpiritPose, type SpiritState } from "./spiritMotion.ts";

const q = new URLSearchParams(location.search);
if (q.get("muc") === "low" || q.get("muc") === "mid" || q.get("muc") === "high") fxPrefs.level = q.get("muc") as FxLevel; // chỉ phiên này, không lưu
if (q.get("giam") === "1") fxPrefs.reduce = true;
/** Hàng thân (như trong game: se / ne dùng hàng `e`, tây lật) và hướng 8 để chọn hàng phụ thể 5 hướng. */
const DIR_ROW: Record<string, { row: number; flip: boolean; face: Dir8 }> = {
  s: { row: 0, flip: false, face: "s" }, se: { row: 2, flip: false, face: "se" }, e: { row: 2, flip: false, face: "e" }, ne: { row: 2, flip: false, face: "ne" }, n: { row: 4, flip: false, face: "n" },
  sw: { row: 2, flip: true, face: "sw" }, w: { row: 2, flip: true, face: "w" }, nw: { row: 2, flip: true, face: "nw" },
};
type PState = SpiritState | "hurt";
const STATES: PState[] = ["idle", "walk", "attack", "cast", "hurt"];
const animMs = (s: PState) => ISO_HS_ANIMS[s].ms.reduce((a, b) => a + b, 0);
const ANIM_MODE = q.get("anim") === "fake" ? "fake" : q.get("anim") === "0" ? "off" : "auto";
const FAKE_FRAME = q.get("khung") === "128" ? 128 : 96;
const USE_ANCHOR = q.get("neo") !== "0";
const EDITOR = q.get("sua") === "1" && USE_ANCHOR && !q.get("n");
const EDIT_KEY = "phutheAnchor";
/** Bảng neo đang chỉnh của một võ hồn: bản chỉnh trong sessionStorage nếu có, không thì bản tải từ anchor.json, không thì bảng trống (dời 0, phóng 1). */
function editTable(id: string, frame: 96 | 128): PhuAnchorTable {
  const saved = (() => { try { return parsePhuAnchor(JSON.parse(sessionStorage.getItem(EDIT_KEY) ?? "{}")[id]); } catch { return null; } })();
  if (saved && !phuAnchorsOf(id)?.manual) setPhuAnchors(id, saved); // bản chỉnh lần trước thắng bản tải; đã nạp rồi (manual) thì giữ
  let t = phuAnchorsOf(id);
  if (!t) { t = { frame, m: PHU_DIRS.map(() => ({ ...PHU_NO_ANCHOR })), f: PHU_DIRS.map(() => ({ ...PHU_NO_ANCHOR })), manual: true }; setPhuAnchors(id, t); }
  return t;
}
const saveEdit = (id: string, t: PhuAnchorTable) => { try { const all = JSON.parse(sessionStorage.getItem(EDIT_KEY) ?? "{}"); all[id] = phuAnchorJson(t); sessionStorage.setItem(EDIT_KEY, JSON.stringify(all)); } catch { /* không lưu được: bỏ */ } };

/** Khung thân theo (trạng thái, tuổi ms): cùng bảng thời gian của hoạt ảnh trong game. */
function frameAt(s: PState, age: number, row: number): number {
  const a = ISO_HS_ANIMS[s], total = animMs(s), t = a.loop ? age % total : Math.min(age, total - 1);
  let acc = 0, i = 0;
  for (; i < a.ms.length; i++) { acc += a.ms[i]; if (t < acc) break; }
  return row * ISO_SHEET_COLS + a.col + Math.min(i, a.ms.length - 1);
}

interface Hero { root: Phaser.GameObjects.Container; vb: Phaser.GameObjects.Sprite; body: Phaser.GameObjects.Sprite; vf: Phaser.GameObjects.Sprite; fam: string; phase: number; on: boolean; id: string; iso: boolean; pa: PhuAnimSet | null; only: boolean }

class PhutheScene extends Phaser.Scene {
  vh = VOHON.some((v) => v.id === q.get("vh")) ? q.get("vh")! : "ta_hoa_phuong_hoang";
  dir = DIR_ROW[q.get("huong") ?? ""] ? q.get("huong")! : "e";
  state: PState = (STATES as string[]).includes(q.get("trang") ?? "") ? (q.get("trang") as PState) : "walk";
  heroes: Hero[] = []; pose = newSpiritPose(); shift = { x: 0, y: 0 };
  blank = new Set<string>();
  sex: "m" | "f" = q.get("gioi") === "f" ? "f" : "m"; cross: Phaser.GameObjects.Graphics | null = null; shownDir: Dir8 = "e";
  lastT = 0; fake: number | null = null; stateT0 = 0; other = q.get("khac") === "1"; spentMs = 0; spentN = 0;
  constructor() { super("phuthe"); }
  preload() {
    this.load.spritesheet("t_body", "sprites/iso/lpc/dan_khach.png", { frameWidth: 64, frameHeight: 64 });
    // Nửa phụ thể `"blank": true` trong manifest không có file (#974): không tải, hero() mượn texture nửa kia và ẩn lớp đó.
    this.load.json("t_manifest", "sprites/manifest.json");
    this.load.once("filecomplete-json-t_manifest", (_k: string, _t: string, data: { sprites?: ({ key: string; blank?: boolean; frame?: number[]; anim?: unknown } | string)[] }) => {
      for (const e of data.sprites ?? []) if (typeof e !== "string" && e.blank && /^vh(anim)?_/.test(e.key)) this.blank.add(e.key);
      if (ANIM_MODE !== "off") for (const e of data.sprites ?? []) { // sheet hoạt ảnh thật (nếu có): tải kèm bố cục từ manifest
        if (typeof e === "string" || e.blank || !/^vhanim_[a-z_]+_[bf]$/.test(e.key)) continue;
        const L = parsePhuLayout(e.anim, e.frame); if (!L) continue;
        setPhuLayout(e.key, L); this.load.spritesheet(e.key, `sprites/vohonanim/${e.key.slice(7)}.png`, { frameWidth: L.frame, frameHeight: L.frame });
      }
      for (const v of VOHON) for (const h of ["b", "f"]) if (!this.blank.has(`vh_${v.id}_${h}`)) this.load.spritesheet(`vh_${v.id}_${h}`, `sprites/vohon/${v.id}_${h}.png`, { frameWidth: 96, frameHeight: 96 });
    });
  }
  /** Sheet GIẢ `vhanim_{id}_{b|f}` dựng từ ảnh phụ thể tĩnh (khung đứng từng hướng, mỗi giới một nửa) cho võ hồn chưa có sheet thật; thiếu ảnh tĩnh thì bỏ. */
  buildFake(id: string, [kb, kf]: [string, string]) {
    const F = FAKE_FRAME, L = parsePhuLayout(undefined, F)!, rows = 2 * PHU_ROWS_PER_SEX, gy = PHU_FRAMES[F], pose = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
    for (const [h, srcKey] of [["b", kb], ["f", kf]] as const) {
      const key = `vhanim_${id}_${h}`;
      if (this.textures.exists(key) || !this.textures.exists(srcKey) || !isIsoSheet(this, srcKey)) continue;
      const src = this.textures.get(srcKey).source[0], tex = this.textures.createCanvas(key, L.cols * F, rows * F)!, ctx = tex.getContext();
      const twoHalves = src.height >= 2 * 6 * 96;
      for (let half = 0; half < 2; half++) for (let d = 0; d < PHU_ROWS_PER_SEX; d++) {
        const sf = this.textures.getFrame(srcKey, ((twoHalves ? half * 6 : 0) + d) * ISO_SHEET_COLS), y = (half * PHU_ROWS_PER_SEX + d) * F;
        for (const c of PHU_CLIPS) for (let i = 0; i < PHU_DEFAULT_CLIPS[c].n; i++) {
          const p = fakePose(c, i, PHU_DEFAULT_CLIPS[c].n, pose), x = (PHU_DEFAULT_CLIPS[c].col + i) * F;
          ctx.save(); ctx.beginPath(); ctx.rect(x, y, F, F); ctx.clip();
          ctx.translate(x + F / 2 + p.dx, y + gy + p.dy); ctx.rotate(p.rot); ctx.scale(p.sx, p.sy);
          ctx.drawImage(src.image as CanvasImageSource, sf.cutX, sf.cutY, 96, 96, -48, -74, 96, 96);
          ctx.restore();
        }
      }
      for (let r = 0; r < rows; r++) for (let c = 0; c < L.cols; c++) tex.add(r * L.cols + c, 0, c * F, r * F, F, F);
      tex.refresh(); setPhuLayout(key, L);
    }
  }
  hero(x: number, y: number, id: string, on: boolean, only = false): Hero {
    // chưa có ảnh phụ thể thật (hoa_long, liet_hoa_thuong_lang): dùng hình tạm vẽ bằng code 48×48 như trong game (textures.ts)
    const [bb, fb] = [this.blank.has(`vh_${id}_b`), this.blank.has(`vh_${id}_f`)], real = (k: string) => this.textures.exists(k) && this.textures.get(k).key !== "__MISSING";
    const [kb, kf] = real(`vh_${id}_${bb ? "f" : "b"}`) ? [`vh_${id}_${bb ? "f" : "b"}`, `vh_${id}_${fb ? "b" : "f"}`] : vohonTextures(this, VOHON.findIndex((v) => v.id === id));
    // phụ thể hoạt ảnh vẽ thật (thật trong manifest, hoặc giả dựng từ ảnh tĩnh khi anim=fake); chỉ bên "Sau" (on) dùng
    if (on && ANIM_MODE === "fake") this.buildFake(id, [kb, kf]);
    const pa = on && ANIM_MODE !== "off" ? phuAnimSetOf(this, id, [false, false]) : null;
    const mk = (key: string, vohon: boolean) => fitHonsuLayer(this.make.sprite({ key, frame: 0 }, false), vohon);
    const vb = mk(pa ? pa.keys[0] : kb, true), body = mk("t_body", false), vf = mk(pa ? pa.keys[1] : kf, true);
    if (pa) { fitPhuLayer(vb, pa.layout); fitPhuLayer(vf, pa.layout); }
    const root = this.add.container(x, y, [this.add.ellipse(0, 0, 22 / SPR, 9 / SPR, 0x000000, 0.4), vb, body, vf]).setScale(SPR).setDepth(y);
    const h: Hero = { root, vb, body, vf, fam: SPIRIT_FAMILY[id] ?? "", phase: spiritPhase(id + x), on, id, iso: isIsoSheet(this, kb), pa, only };
    if (bb || only) vb.setAlpha(0);
    if (fb || only) vf.setAlpha(0);
    if (on && USE_ANCHOR && !q.get("n")) { this.cross = this.add.graphics(); root.add(this.cross); }
    this.heroes.push(h); return h;
  }
  create() {
    const n = Math.max(0, Math.min(200, Number(q.get("n") ?? 0) | 0)), z = Number(q.get("zoom") ?? (n ? 1 : 4));
    this.cameras.main.setZoom(EDITOR && !q.get("zoom") ? 3 : z).setBackgroundColor("#0c1712").setRoundPixels(true);
    if (n) { // đo tải: n hồn sư rải đều, mỗi người một võ hồn
      const ids = VOHON.map((v) => v.id), cols = Math.ceil(Math.sqrt(n * 1.6));
      for (let i = 0; i < n; i++) this.hero((i % cols - cols / 2) * 46, (Math.floor(i / cols) - n / cols / 2) * 40, ids[i % ids.length], q.get("tat") !== "1");
      this.cameras.main.centerOn(0, 0);
    } else {
      this.cameras.main.centerOn(0, -28 * SPR / 2);
      if (EDITOR) { this.hero(-66, 0, this.vh, false, true); this.hero(0, 0, this.vh, false); this.hero(66, 0, this.vh, true); }
      else { this.hero(-34, 0, this.vh, false); this.hero(34, 0, this.vh, true); }
    }
    (window as unknown as { __phuthe: object }).__phuthe = {
      at: (ms: number, trang?: string) => { if (trang && (STATES as string[]).includes(trang)) this.state = trang as PState; this.fake = ms; this.stateT0 = 0; this.step(ms); },
      bench: () => ({ avgMs: this.spentN ? this.spentMs / this.spentN : 0, frames: this.spentN, players: this.heroes.length, fps: this.game.loop.actualFps }),
      /** "clip" nếu bên Sau đang phát clip vẽ thật (thật hoặc giả), "cu" nếu nhánh cũ. */
      mode: () => (this.heroes.some((h) => h.pa) ? "clip" : "cu"),
      reset: () => { this.spentMs = 0; this.spentN = 0; },
    };
  }
  /** Đặt khung thân + khung / tư thế phụ thể cho mọi hồn sư tại giờ `t` (ms). */
  step(t: number) {
    const st = this.state, once = st === "attack" || st === "cast" || st === "hurt", dur = animMs(st);
    // đánh / thi triển / bị đánh: lặp mỗi `dur` + nghỉ 700 ms để thấy rõ từng cú; đứng / đi lặp liên tục
    const cyc = once ? dur + 700 : 1e12, age = t % cyc, doing = !once || age < dur;
    const k = spiritScale(this.fakeLevel(), fxPrefs.reduce, !this.other), { row, flip, face } = DIR_ROW[this.dir];
    const an: PState = doing ? st : "idle", bodyRow = an === "hurt" ? 0 : row; // hurt: thân chỉ vẽ hướng xuống (như game)
    const shown: Dir8 = this.dir === "s" || this.dir === "n" ? face : flip ? "w" : "e"; // hướng thân LPC đang hiện (4 hướng), phụ thể chọn se / ne theo hướng thật
    const t0 = performance.now();
    for (const h of this.heroes) {
      const f = frameAt(an, doing ? age : t, bodyRow);
      h.body.setFrame(f).setFlipX(flip);
      let ox = 0, oy = 0, sk = 1;
      if (h.pa) {
        const clip = syncPhuLayers(h.body, [h.vb, h.vf], h.pa, an, phuFaceOf(shown, face), doing ? age : -1);
        if (clip) { ox = (flip ? -1 : 1) * h.pa.layout.offset[clip][0]; oy = h.pa.layout.offset[clip][1]; }
      } else { const vf = h.iso ? f : vohonFrame(f, true, false)?.frame ?? 0; h.vb.setFrame(vf).setFlipX(flip); h.vf.setFrame(vf).setFlipX(flip); }
      if (h.on && h.pa && USE_ANCHOR) { // neo khối thân, chỉ clip vẽ thật (cả sheet giả); bên "Trước" và nhánh cũ giữ như cũ để so
        const fc = phuFaceOf(shown, face), a = phuAnchorAt(phuAnchorsOf(h.id), this.sex === "f", phuDirRow(fc));
        ox += (flip ? -a.dx : a.dx) / SPR; oy += a.dy / SPR; sk = a.scale;
        this.shownDir = fc; this.drawCross(h, flip, a.tx, a.ty);
      }
      if (!h.fam) continue;
      const kk = h.on ? k : 0, sp: SpiritState = once && doing && st !== "hurt" ? (st as SpiritState) : st === "walk" ? "walk" : "idle";
      applySpiritPose([h.vb, h.vf], spiritPose(this.pose, SPIRIT_FAMILY[h.id], sp, t, age, dur, flip ? -1 : 1, st === "hurt" && doing ? age : -1, kk, h.phase, h.pa ? clipOscK(SPIRIT_FAMILY[h.id]) : 1), this.shift, ox, oy, (h.iso || h.pa ? 1 / SPR : 1) * sk, 1 / SPR);
    }
    this.spentMs += performance.now() - t0; this.spentN++;
  }
  /** Chữ thập giữa lưng thân LPC (điểm đích của neo) + gốc chân, trong hình chứa của hồn sư (đơn vị 1 / SPR điểm ảnh khung). */
  drawCross(h: Hero, flip: boolean, tx: number, ty: number) {
    const g = this.cross; if (!g || h.root.list.indexOf(g) < 0) return;
    const x = (flip ? -tx : tx) / SPR, y = ty / SPR, r = 6 / SPR;
    g.clear().lineStyle(1 / SPR, 0x40ffff, 0.95).lineBetween(x - r, y, x + r, y).lineBetween(x, y - r, x, y + r).strokeCircle(x, y, r * 0.55)
      .lineStyle(1 / SPR, 0xffff40, 0.8).lineBetween(-r * 0.6, 0, r * 0.6, 0);
  }
  fakeLevel(): FxLevel { return fxPrefs.level; }
  /** Dừng / chạy tiếp hoạt ảnh (màn chỉnh ráp: dừng ở khung đang xem để kéo cho chuẩn). */
  setPaused(p: boolean) { if (p) { this.fake = this.lastT; this.step(this.lastT); } else this.fake = null; }
  update(time: number) {
    this.lastT = time; if (this.fake === null) this.step(time);
    if (!this.heroes.length || this.heroes.length > (EDITOR ? 3 : 2)) return;
    this.cameras.main.centerOn(EDITOR ? PHU_EDITOR_W / 2 / this.cameras.main.zoom : 0, -14); // màn chỉnh ráp: dời sang trái nhường bảng bên phải
  }
}

export function phutheTestScreen(card: HTMLElement, overlay: HTMLElement): void {
  void card; overlay.hidden = true;
  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;left:8px;top:8px;z-index:50;display:flex;flex-wrap:wrap;gap:6px;max-width:92vw;font:12px system-ui;background:#000a;padding:6px;color:#fff";
  if (q.get("bar") === "0") bar.hidden = true;
  if (EDITOR) bar.style.maxWidth = `calc(100vw - ${PHU_EDITOR_W + 24}px)`;
  const opt = (a: [string, string][], cur: string) => a.map(([v, t]) => `<option value="${v}"${v === cur ? " selected" : ""}>${t}</option>`).join("");
  bar.innerHTML = `
    <label>Võ hồn <select id="pv">${opt(VOHON.map((v) => [v.id, v.name]), q.get("vh") ?? "ta_hoa_phuong_hoang")}</select></label>
    <label>Hướng <select id="pd">${opt(Object.keys(DIR_ROW).map((d) => [d, d] as [string, string]), q.get("huong") ?? "e")}</select></label>
    <label>Trạng thái <select id="ps">${opt([["idle", "Đứng"], ["walk", "Đi"], ["attack", "Đánh"], ["cast", "Thi triển"], ["hurt", "Bị đánh"]], q.get("trang") ?? "walk")}</select></label>
    <label>Hiệu ứng <select id="pl">${opt([["low", "Thấp"], ["mid", "Vừa"], ["high", "Cao"]], fxPrefs.level)}</select></label>
    <label>Phụ thể <select id="pa">${opt([["auto", "Thật nếu có"], ["fake", "Sheet giả"], ["0", "Nhánh cũ"]], q.get("anim") ?? "auto")}</select></label>
    <label><input type="checkbox" id="px"${fxPrefs.reduce ? " checked" : ""}> Giảm chuyển động</label>
    <label>Giới <select id="pg">${opt([["m", "Nam"], ["f", "Nữ"]], q.get("gioi") === "f" ? "f" : "m")}</select></label>
    <label><input type="checkbox" id="pn"${USE_ANCHOR ? " checked" : ""}> Neo khối thân</label>
    <span id="pe" style="display:${USE_ANCHOR && !EDITOR ? "flex" : "none"};gap:8px;align-items:center;flex-wrap:wrap">
      <b id="phd">hướng</b>
      <label>dx <input type="range" id="edx" min="-48" max="48" step="0.5" style="width:110px"> <output id="odx"></output></label>
      <label>dy <input type="range" id="edy" min="-48" max="48" step="0.5" style="width:110px"> <output id="ody"></output></label>
      <label>scale <input type="range" id="esc" min="${PHU_SCALE_RANGE[0]}" max="${PHU_SCALE_RANGE[1]}" step="0.01" style="width:110px"> <output id="osc"></output></label>
      <button id="erst">Đặt lại hướng này</button> <button id="eout">Xuất anchor.json</button>
    </span>`;
  document.body.appendChild(bar);
  const tag = document.createElement("div");
  tag.style.cssText = "position:fixed;left:0;right:0;bottom:10px;text-align:center;font:700 18px system-ui;color:#fff;text-shadow:0 0 3px #000;z-index:40;display:flex;justify-content:center;gap:0;";
  if (EDITOR) { tag.style.right = `${PHU_EDITOR_W}px`; tag.innerHTML = ["Thân LPC (không phụ thể)", "Trước (cũ)", "Sau (đang chỉnh)"].map((t) => `<span style="width:198px;font-size:15px">${t}</span>`).join(""); document.body.appendChild(tag); }
  else if (!q.get("n")) { tag.innerHTML = '<span style="width:272px">Trước</span><span style="width:272px">Sau</span>'; document.body.appendChild(tag); }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: "game", backgroundColor: "#0c1712", pixelArt: true, roundPixels: true, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight }, scene: PhutheScene });
  const $ = <T extends HTMLElement>(id: string) => bar.querySelector<T>(`#${id}`)!;
  const sc = () => game.scene.getScene("phuthe") as PhutheScene;
  if (USE_ANCHOR) void loadPhuAnchors("sprites/vohonanim/anchor.json").then(() => {
    editTable(sc().vh, FAKE_FRAME);
    if (EDITOR) mountPhutheEditor({ id: () => sc().vh, table: () => editTable(sc().vh, FAKE_FRAME), sex: () => sc().sex, setSex: (v) => { sc().sex = v; $<HTMLSelectElement>("pg").value = v; }, row: () => phuDirRow(sc().shownDir),
      flip: () => DIR_ROW[sc().dir].flip, zoom: () => sc().cameras.main.zoom, state: () => sc().state, setState: (v) => { sc().state = v as PState; $<HTMLSelectElement>("ps").value = v; }, setPaused: (p) => sc().setPaused(p),
      canvas: () => game.canvas, save: () => saveEdit(sc().vh, editTable(sc().vh, FAKE_FRAME)) });
  });
  const reload = (k: string, v: string) => { const u = new URL(location.href); u.searchParams.set(k, v); location.href = u.href; };
  $("pv").onchange = () => reload("vh", $<HTMLSelectElement>("pv").value);
  const row = () => phuDirRow(sc().shownDir);
  const tbl = () => editTable(sc().vh, FAKE_FRAME);
  const cur = () => tbl()[sc().sex][row()];
  const show = () => { // đưa giá trị neo của (giới, hướng) hiện tại lên thanh trượt
    const a = cur(); $("phd").textContent = `${PHU_DIRS[row()]} (${sc().sex === "f" ? "nữ" : "nam"})`;
    for (const [k, v] of [["dx", a.dx], ["dy", a.dy], ["sc", a.scale]] as const) { $<HTMLInputElement>(`e${k}`).value = String(v); $(`o${k}`).textContent = String(Math.round(v * 100) / 100); }
  };
  const edit = () => { const a = cur(); a.dx = +$<HTMLInputElement>("edx").value; a.dy = +$<HTMLInputElement>("edy").value; a.scale = +$<HTMLInputElement>("esc").value; tbl().manual = true; saveEdit(sc().vh, tbl()); show(); };
  for (const k of ["edx", "edy", "esc"]) $(k).oninput = edit;
  $("erst").onclick = () => { Object.assign(cur(), { dx: 0, dy: 0, scale: 1 }); saveEdit(sc().vh, tbl()); show(); };
  $("eout").onclick = () => {
    const blob = new Blob([JSON.stringify({ [sc().vh]: phuAnchorJson(tbl()) }, null, 1) + "\n"], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "anchor.json"; a.click(); URL.revokeObjectURL(a.href);
  };
  $("pg").onchange = () => { sc().sex = $<HTMLSelectElement>("pg").value as "m" | "f"; show(); };
  $("pn").onchange = () => reload("neo", $<HTMLInputElement>("pn").checked ? "1" : "0");
  let lastRow = -1;
  setInterval(() => { if (USE_ANCHOR && game.scene.isActive("phuthe") && (row() !== lastRow)) { lastRow = row(); show(); } }, 200); // hướng đổi (chọn tay hoặc xoay) thì thanh trượt theo
  $("pd").onchange = () => { const d = $<HTMLSelectElement>("pd").value; sc().dir = d; };
  $("pa").onchange = () => reload("anim", $<HTMLSelectElement>("pa").value);
  $("ps").onchange = () => { sc().state = $<HTMLSelectElement>("ps").value as PState; };
  $("pl").onchange = () => setFxPrefs({ level: $<HTMLSelectElement>("pl").value as FxLevel });
  $("px").onchange = () => setFxPrefs({ reduce: $<HTMLInputElement>("px").checked });
  void SPIRIT_MOTION;
}
