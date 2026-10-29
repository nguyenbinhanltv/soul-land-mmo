// Trang thử vũ khí cầm tay (#1312; mở bằng `?thu=vukhi`, không cần đăng nhập): sáu hồn sư đứng một hàng nhìn 5 hướng + tây (lật), mỗi người cầm vũ khí của võ hồn đang chọn.
// Dùng ĐÚNG đường client trong game (vukhiSetOf, syncPhuLayers, weaponHidden): có sheet `vkanim_{id}` thật trong manifest (anim.kind "vukhi") thì phát sheet đó;
// chưa có thì không hiện vũ khí; chỉ `anh=gia` mới dựng sheet GIẢ tất định (vukhiFake.ts, KHÔNG phải ảnh model). Tham số URL: vh (võ hồn), trang=idle|walk|attack|cast|hurt,
// chan=1 (đang Chân Thân: vũ khí thu về nếu võ hồn có pháp tướng), diem=1 (chấm điểm cầm `anim.grip`), anh=gia (ép sheet giả), bar=0 (ẩn thanh), zoom.
// `window.__vukhi.at(ms, trang)` đặt đồng hồ giả để chụp khung chính xác; `window.__vukhi.mode()` = "that" | "gia" | "cu" (chưa có sheet vũ khí).
// gioi=m|f dùng thân LPC thật, khac=<id> thêm nhân vật đối chiếu, ms=<mốc> dừng khung, tay=0 chỉ hiện năm hướng vẽ thật.
import Phaser from "phaser";
import { PHAP_TUONG, VOHON, LPC_VIEW, encodeLpc, presetToLpc } from "../../shared/data.ts";
import { LpcRig } from "./lpcRig.ts";
import { SPR } from "./iso.ts";
import type { Dir8 } from "./iso.ts";
import { fitHonsuLayer, fitPhuLayer, setPhuLayout, syncPhuLayers, vukhiSetOf, ISO_HS_ANIMS, ISO_SHEET_COLS, type PhuAnimSet } from "./sprites.ts";
import { PHU_CLIPS, PHU_DIRS, PHU_FRAMES, PHU_ROWS_PER_SEX, parsePhuLayout, phuFaceOf, phuGripAt, weaponHidden, type PhuClip } from "./phutheAnim.ts";
import { fakeGripTable, fakeHalf, fakeSegment } from "./vukhiFake.ts";

const q = new URLSearchParams(location.search);
const STATES: PhuClip[] = ["idle", "walk", "attack", "cast", "hurt"];
/** Hướng thử: hàng thân LPC (se / ne dùng hàng `e`, tây lật), hướng 8 chọn hàng vũ khí 5 hướng. */
const DIRS: { face: Dir8; row: number; flip: boolean; shown: Dir8 }[] = [
  { face: "s", row: 0, flip: false, shown: "s" }, { face: "se", row: 2, flip: false, shown: "e" }, { face: "e", row: 2, flip: false, shown: "e" },
  { face: "ne", row: 2, flip: false, shown: "e" }, { face: "n", row: 4, flip: false, shown: "n" }, { face: "w", row: 2, flip: true, shown: "w" },
];
const FAKE_F = 96;
const GAP = 74;
const animMs = (s: PhuClip) => ISO_HS_ANIMS[s].ms.reduce((a, b) => a + b, 0);
function frameAt(s: PhuClip, age: number, row: number): number {
  const a = ISO_HS_ANIMS[s], total = animMs(s), t = a.loop ? age % total : Math.min(age, total - 1);
  let acc = 0, i = 0;
  for (; i < a.ms.length; i++) { acc += a.ms[i]; if (t < acc) break; }
  return row * ISO_SHEET_COLS + a.col + Math.min(i, a.ms.length - 1);
}

interface Hero { root: Phaser.GameObjects.Container; vb: Phaser.GameObjects.Sprite; body: Phaser.GameObjects.Sprite; vf: Phaser.GameObjects.Sprite; dot: Phaser.GameObjects.Graphics; d: (typeof DIRS)[number]; pa: PhuAnimSet | null; id: string }

class VukhiScene extends Phaser.Scene {
  vh = VOHON.some((v) => v.id === q.get("vh")) ? q.get("vh")! : "hao_thien_chuy";
  state: PhuClip = (STATES as string[]).includes(q.get("trang") ?? "") ? (q.get("trang") as PhuClip) : "attack";
  chan = q.get("chan") === "1"; diem = q.get("diem") === "1";
  sex = q.get("gioi") === "f" ? 1 : 0;
  other = VOHON.some(v => v.id === q.get("khac")) ? q.get("khac")! : null;
  lpc!: LpcRig; bodyKey = "";
  heroes: Hero[] = []; pa: PhuAnimSet | null = null; real = false; fake: number | null = null; blank = new Set<string>();
  constructor() { super("vukhi"); }
  preload() {
    this.load.spritesheet("t_body", "sprites/iso/lpc/dan_khach.png", { frameWidth: 64, frameHeight: 64 });
    this.load.json("t_manifest", "sprites/manifest.json");
    this.load.once("filecomplete-json-t_manifest", (_k: string, _t: string, data: { sprites?: ({ key: string; blank?: boolean; frame?: number[]; anim?: unknown } | string)[] }) => {
      for (const e of data.sprites ?? []) {
        if (typeof e === "string" || ![this.vh, this.other].some(id => id && e.key.startsWith(`vkanim_${id}_`))) continue;
        if (e.blank) { this.blank.add(e.key); continue; }
        const L = q.get("anh") === "gia" ? null : parsePhuLayout(e.anim, e.frame); if (!L) continue;
        setPhuLayout(e.key, L); this.load.spritesheet(e.key, `sprites/vukhianim/${e.key.slice(7)}.png`, { frameWidth: L.frame, frameHeight: L.frame });
      }
    });
  }
  /** Sheet GIẢ `vkanim_{id}_{b|f}` (gậy + đầu vật tại điểm cầm giả) cho võ hồn chưa có sheet thật: nửa theo hướng ở fakeHalf, nửa kia trống. */
  buildFake(id: string) {
    const L = parsePhuLayout({ kind: "vukhi", grip: fakeGripTable() }, FAKE_F)!, F = FAKE_F, gy = PHU_FRAMES[F], rows = 2 * PHU_ROWS_PER_SEX;
    for (const h of ["b", "f"] as const) {
      const key = `vkanim_${id}_${h}`, tex = this.textures.createCanvas(key, L.cols * F, rows * F)!, ctx = tex.getContext();
      ctx.lineCap = "round";
      for (let r = 0; r < rows; r++) {
        const dir = PHU_DIRS[r % PHU_ROWS_PER_SEX];
        if (fakeHalf(dir) === h) for (const c of PHU_CLIPS) for (let i = 0; i < L.clips[c].n; i++) {
          const s = fakeSegment(dir, c, i, L.clips[c].n), ox = (L.clips[c].col + i) * F + F / 2, oy = r * F + gy, hx = s.x0 + (s.x1 - s.x0) * 0.72, hy = s.y0 + (s.y1 - s.y0) * 0.72;
          ctx.strokeStyle = "#1a1020"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ox + s.x0, oy + s.y0); ctx.lineTo(ox + s.x1, oy + s.y1); ctx.stroke();
          ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ox + s.x0, oy + s.y0); ctx.lineTo(ox + hx, oy + hy); ctx.stroke();
          ctx.strokeStyle = "#d0d4e8"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ox + hx, oy + hy); ctx.lineTo(ox + s.x1, oy + s.y1); ctx.stroke();
        }
      }
      for (let r = 0; r < rows; r++) for (let c = 0; c < L.cols; c++) tex.add(r * L.cols + c, 0, c * F, r * F, F, F);
      tex.refresh(); setPhuLayout(key, L);
    }
  }
  create() {
    const id = this.vh, z = Number(q.get("zoom") ?? 3);
    this.lpc = new LpcRig(this);
    this.bodyKey = this.lpc.acquire(encodeLpc(presetToLpc({ sex: this.sex, hair: 0, hairCol: 0, outfitCol: 0, skin: 0 })))!;
    this.events.once("shutdown", () => this.lpc.destroy());
    const at = q.get("ms");
    if (at !== null && Number.isFinite(Number(at)) && Number(at) >= 0) this.fake = Number(at);
    this.cameras.main.setZoom(z).setBackgroundColor("#0c1712").setRoundPixels(true).centerOn(0, -14);
    this.pa = vukhiSetOf(this, id, [this.blank.has(`vkanim_${id}_b`), this.blank.has(`vkanim_${id}_f`)]);
    this.real = !!this.pa;
    // Chỉ dựng giả khi người kiểm chọn rõ; thiếu sheet ở chế độ auto phải giữ nhánh không vũ khí.
    if (!this.pa && q.get("anh") === "gia") { this.buildFake(id); this.pa = vukhiSetOf(this, id, [false, false]); }
    const specs = (q.get("tay") === "0" ? DIRS.slice(0, 5) : DIRS).map(d => ({ d, id, pa: this.pa }));
    if (this.other) specs.push({ d: DIRS[2], id: this.other, pa: vukhiSetOf(this, this.other, [this.blank.has(`vkanim_${this.other}_b`), this.blank.has(`vkanim_${this.other}_f`)]) });
    specs.forEach(({ d, id: heroId, pa }, i) => {
      const mk = (key: string, vohon: boolean) => fitHonsuLayer(this.make.sprite({ key, frame: 0 }, false), vohon);
      const vb = mk(pa ? pa.keys[0] : "t_body", true), body = mk(this.bodyKey, false), vf = mk(pa ? pa.keys[1] : "t_body", true), dot = this.make.graphics({}, false);
      if (pa) { fitPhuLayer(vb, pa.layout); fitPhuLayer(vf, pa.layout); }
      const root = this.add.container((i - (specs.length - 1) / 2) * GAP, 0, [this.add.ellipse(0, 0, 22 / SPR, 9 / SPR, 0x000000, 0.4), vb, body, vf, dot]).setScale(SPR).setDepth(0);
      this.heroes.push({ root, vb, body, vf, dot, d, pa, id: heroId });
    });
    (window as unknown as { __vukhi: object }).__vukhi = {
      at: (ms: number, trang?: string) => { if (trang && (STATES as string[]).includes(trang)) this.state = trang as PhuClip; this.fake = ms; this.step(ms); },
      mode: () => (!this.pa ? "cu" : this.real ? "that" : "gia"),
      /** Số sprite vũ khí đang hiện (Chân Thân thu về = 0). */
      shown: () => this.heroes.filter((h) => h.vb.visible || h.vf.visible).length,
      ready: () => this.lpc.ready(this.bodyKey, this.state),
      fallback: () => this.heroes.filter(h => h.id === this.other).every(h => !h.pa && !h.vb.visible && !h.vf.visible),
    };
  }
  /** Đặt khung thân + lớp vũ khí cho mọi hồn sư tại giờ `t` (ms): đánh / thi triển / bị đánh lặp mỗi `dur` + nghỉ 700 ms; đứng / đi lặp liên tục. */
  step(t: number) {
    this.lpc.step();
    const st = this.state, once = st === "attack" || st === "cast" || st === "hurt", dur = animMs(st), cyc = once ? dur + 700 : 1e12, age = t % cyc, doing = !once || age < dur;
    const an: PhuClip = doing ? st : "idle";
    for (const h of this.heroes) {
      const { face, row, flip, shown } = h.d, pa = h.pa;
      const ready = this.lpc.ready(this.bodyKey, an);
      h.body.setVisible(ready);
      if (!ready) { h.vb.setVisible(false); h.vf.setVisible(false); continue; }
      h.body.setFrame(frameAt(an, doing ? age : t, an === "hurt" ? 0 : row)).setFlipX(flip);
      h.dot.clear();
      if (!pa) { h.vb.setVisible(false); h.vf.setVisible(false); continue; }
      const f8 = phuFaceOf(shown, face), clip = syncPhuLayers(h.body, [h.vb, h.vf], pa, an, f8, doing ? age : -1);
      h.vb.x = h.vf.x = flip ? -LPC_VIEW.vohon.dx : LPC_VIEW.vohon.dx;
      h.vb.y = h.vf.y = LPC_VIEW.vohon.dy;
      if (weaponHidden(this.chan ? 1 : 0, !!PHAP_TUONG[h.id])) { h.vb.setVisible(false); h.vf.setVisible(false); continue; } // Chân Thân xét riêng từng võ hồn
      if (this.diem && clip) {
        const L = pa.layout, i = Number(h.vf.frame.name) % L.cols - L.clips[clip].col, g = phuGripAt(L, f8, clip, i);
        if (g) h.dot.fillStyle(0x00ff60, 1).fillCircle(g[0] / SPR, g[1] / SPR, 1.6 / SPR).lineStyle(1 / SPR, 0x1a1020, 1).strokeCircle(g[0] / SPR, g[1] / SPR, 1.6 / SPR);
      }
    }
  }
  update(time: number) { this.step(this.fake ?? time); }
}

export function vukhiTestScreen(card: HTMLElement, overlay: HTMLElement): void {
  void card; overlay.hidden = true;
  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;left:8px;top:8px;z-index:50;display:flex;flex-wrap:wrap;gap:6px;max-width:92vw;font:12px system-ui;background:#000a;padding:6px;color:#fff";
  if (q.get("bar") === "0") bar.hidden = true;
  const opt = (a: [string, string][], cur: string) => a.map(([v, t]) => `<option value="${v}"${v === cur ? " selected" : ""}>${t}</option>`).join("");
  bar.innerHTML = `
    <label>Võ hồn <select id="vv">${opt(VOHON.map((v) => [v.id, v.name]), q.get("vh") ?? "hao_thien_chuy")}</select></label>
    <label>Trạng thái <select id="vs">${opt([["idle", "Đứng"], ["walk", "Đi"], ["attack", "Đánh"], ["cast", "Thi triển"], ["hurt", "Bị đánh"]], q.get("trang") ?? "attack")}</select></label>
    <label>Giới <select id="vg">${opt([["m", "Nam"], ["f", "Nữ"]], q.get("gioi") ?? "m")}</select></label>
    <label>Mốc ms <input id="vt" type="number" min="0" value="${Number(q.get("ms") ?? 0)}" style="width:70px"></label><button id="vr">Chạy</button>
    <label><input type="checkbox" id="vc"${q.get("chan") === "1" ? " checked" : ""}> Chân Thân (thu vũ khí)</label>
    <label><input type="checkbox" id="vd"${q.get("diem") === "1" ? " checked" : ""}> Điểm cầm</label>
    <label>Ảnh <select id="va">${opt([["auto", "Thật nếu có"], ["gia", "Sheet giả"]], q.get("anh") === "gia" ? "gia" : "auto")}</select></label>
    <span id="vm"></span>`;
  document.body.appendChild(bar);
  const tag = document.createElement("div");
  tag.style.cssText = "position:fixed;left:0;right:0;bottom:10px;text-align:center;font:700 14px system-ui;color:#fff;text-shadow:0 0 3px #000;z-index:40;display:flex;justify-content:center";
  const labels = [...(q.get("tay") === "0" ? DIRS.slice(0, 5) : DIRS).map(d => d.face as string), ...(VOHON.some(v => v.id === q.get("khac")) ? [`${VOHON.find(v => v.id === q.get("khac"))!.name} (dự phòng)`] : [])];
  tag.innerHTML = labels.map(d => `<span style="width:${GAP * Number(q.get("zoom") ?? 3)}px">${d}</span>`).join("");
  if (q.get("bar") !== "0") document.body.appendChild(tag);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: "game", backgroundColor: "#0c1712", pixelArt: true, roundPixels: true, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight }, scene: VukhiScene });
  const $ = <T extends HTMLElement>(id: string) => bar.querySelector<T>(`#${id}`)!, sc = () => game.scene.getScene("vukhi") as VukhiScene;
  const reload = (k: string, v: string) => { const u = new URL(location.href); u.searchParams.set(k, v); location.href = u.href; };
  $("vv").onchange = () => reload("vh", $<HTMLSelectElement>("vv").value);
  $("va").onchange = () => reload("anh", $<HTMLSelectElement>("va").value);
  $("vg").onchange = () => reload("gioi", $<HTMLSelectElement>("vg").value);
  $("vt").oninput = () => { const ms = Number($<HTMLInputElement>("vt").value); if (Number.isFinite(ms) && ms >= 0) sc().fake = ms; };
  $("vr").onclick = () => { sc().fake = null; };
  $("vs").onchange = () => { sc().state = $<HTMLSelectElement>("vs").value as PhuClip; };
  $("vc").onchange = () => { sc().chan = $<HTMLInputElement>("vc").checked; };
  $("vd").onchange = () => { sc().diem = $<HTMLInputElement>("vd").checked; };
  setInterval(() => { const w = (window as unknown as { __vukhi?: { mode(): string; ready(): boolean; fallback(): boolean } }).__vukhi; if (w) $("vm").textContent = ({ that: "ảnh thật", gia: "sheet GIẢ", cu: "không có sheet vũ khí" } as Record<string, string>)[w.mode()] + (w.ready() ? ` · LPC ${sc().sex ? "nữ" : "nam"} sẵn sàng` : " · đang tải LPC") + (sc().other ? ` · dự phòng: ${w.fallback() ? "không vũ khí" : "có sheet"}` : ""); }, 300);
}
