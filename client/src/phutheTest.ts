// Trang thử chuyển động phụ phụ thể (H7 #490; mở bằng `?thu=phuthe`, không cần đăng nhập): hai hồn sư cạnh nhau, trái "Trước" (đứng yên như bản cũ),
// phải "Sau" (chuyển động phụ bằng code, đúng spiritMotion.ts như trong game). Tham số URL cho chụp tự động: vh, huong=s|e|n|w, trang=idle|walk|attack|cast,
// muc=low|mid|high, giam=1 (Giảm chuyển động), khac=1 (người khác: nhẹ hơn), n=<số người> (đo tải: vòng tròn n hồn sư đủ 25 võ hồn), bar=0 (ẩn thanh), zoom.
// `window.__phuthe.at(ms, trang)` đặt đồng hồ giả để chụp khung chính xác (không phụ thuộc tốc độ máy); `bench()` đo mili giây tính chuyển động mỗi khung.
import Phaser from "phaser";
import { VOHON } from "../../shared/data.ts";
import { fxPrefs, setFxPrefs, type FxLevel } from "./combatFx.ts";
import { SPR } from "./iso.ts";
import { fitHonsuLayer, isIsoSheet, vohonFrame, ISO_HS_ANIMS, ISO_SHEET_COLS } from "./sprites.ts";
import { vohonTextures } from "./textures.ts";
import { SPIRIT_FAMILY, SPIRIT_MOTION, spiritPose, spiritScale, spiritPhase, applySpiritPose, newSpiritPose, type SpiritState } from "./spiritMotion.ts";

const q = new URLSearchParams(location.search);
if (q.get("muc") === "low" || q.get("muc") === "mid" || q.get("muc") === "high") fxPrefs.level = q.get("muc") as FxLevel; // chỉ phiên này, không lưu
if (q.get("giam") === "1") fxPrefs.reduce = true;
const DIR_ROW: Record<string, { row: number; flip: boolean }> = { s: { row: 0, flip: false }, e: { row: 2, flip: false }, n: { row: 4, flip: false }, w: { row: 2, flip: true } };
const STATES: SpiritState[] = ["idle", "walk", "attack", "cast"];
const animMs = (s: SpiritState) => ISO_HS_ANIMS[s].ms.reduce((a, b) => a + b, 0);

/** Khung thân theo (trạng thái, tuổi ms): cùng bảng thời gian của hoạt ảnh trong game. */
function frameAt(s: SpiritState, age: number, row: number): number {
  const a = ISO_HS_ANIMS[s], total = animMs(s), t = a.loop ? age % total : Math.min(age, total - 1);
  let acc = 0, i = 0;
  for (; i < a.ms.length; i++) { acc += a.ms[i]; if (t < acc) break; }
  return row * ISO_SHEET_COLS + a.col + Math.min(i, a.ms.length - 1);
}

interface Hero { root: Phaser.GameObjects.Container; vb: Phaser.GameObjects.Sprite; body: Phaser.GameObjects.Sprite; vf: Phaser.GameObjects.Sprite; fam: string; phase: number; on: boolean; id: string; iso: boolean }

class PhutheScene extends Phaser.Scene {
  vh = VOHON.some((v) => v.id === q.get("vh")) ? q.get("vh")! : "ta_hoa_phuong_hoang";
  dir = DIR_ROW[q.get("huong") ?? ""] ? q.get("huong")! : "e";
  state: SpiritState = (STATES as string[]).includes(q.get("trang") ?? "") ? (q.get("trang") as SpiritState) : "walk";
  heroes: Hero[] = []; pose = newSpiritPose(); shift = { x: 0, y: 0 };
  blank = new Set<string>();
  fake: number | null = null; stateT0 = 0; other = q.get("khac") === "1"; spentMs = 0; spentN = 0;
  constructor() { super("phuthe"); }
  preload() {
    this.load.spritesheet("t_body", "sprites/iso/lpc/dan_khach.png", { frameWidth: 64, frameHeight: 64 });
    // Nửa phụ thể `"blank": true` trong manifest không có file (#974): không tải, hero() mượn texture nửa kia và ẩn lớp đó.
    this.load.json("t_manifest", "sprites/manifest.json");
    this.load.once("filecomplete-json-t_manifest", (_k: string, _t: string, data: { sprites?: ({ key: string; blank?: boolean } | string)[] }) => {
      for (const e of data.sprites ?? []) if (typeof e !== "string" && e.blank && e.key.startsWith("vh_")) this.blank.add(e.key);
      for (const v of VOHON) for (const h of ["b", "f"]) if (!this.blank.has(`vh_${v.id}_${h}`)) this.load.spritesheet(`vh_${v.id}_${h}`, `sprites/vohon/${v.id}_${h}.png`, { frameWidth: 96, frameHeight: 96 });
    });
  }
  hero(x: number, y: number, id: string, on: boolean): Hero {
    // chưa có ảnh phụ thể thật (hoa_long, liet_hoa_thuong_lang): dùng hình tạm vẽ bằng code 48×48 như trong game (textures.ts)
    const [bb, fb] = [this.blank.has(`vh_${id}_b`), this.blank.has(`vh_${id}_f`)], real = (k: string) => this.textures.exists(k) && this.textures.get(k).key !== "__MISSING";
    const [kb, kf] = real(`vh_${id}_${bb ? "f" : "b"}`) ? [`vh_${id}_${bb ? "f" : "b"}`, `vh_${id}_${fb ? "b" : "f"}`] : vohonTextures(this, VOHON.findIndex((v) => v.id === id));
    const mk = (key: string, vohon: boolean) => fitHonsuLayer(this.make.sprite({ key, frame: 0 }, false), vohon);
    const vb = mk(kb, true), body = mk("t_body", false), vf = mk(kf, true);
    const root = this.add.container(x, y, [this.add.ellipse(0, 0, 22 / SPR, 9 / SPR, 0x000000, 0.4), vb, body, vf]).setScale(SPR).setDepth(y);
    const h: Hero = { root, vb, body, vf, fam: SPIRIT_FAMILY[id] ?? "", phase: spiritPhase(id + x), on, id, iso: isIsoSheet(this, kb) };
    if (bb) vb.setAlpha(0);
    if (fb) vf.setAlpha(0);
    this.heroes.push(h); return h;
  }
  create() {
    const n = Math.max(0, Math.min(200, Number(q.get("n") ?? 0) | 0)), z = Number(q.get("zoom") ?? (n ? 1 : 4));
    this.cameras.main.setZoom(z).setBackgroundColor("#0c1712").setRoundPixels(true);
    if (n) { // đo tải: n hồn sư rải đều, mỗi người một võ hồn
      const ids = VOHON.map((v) => v.id), cols = Math.ceil(Math.sqrt(n * 1.6));
      for (let i = 0; i < n; i++) this.hero((i % cols - cols / 2) * 46, (Math.floor(i / cols) - n / cols / 2) * 40, ids[i % ids.length], q.get("tat") !== "1");
      this.cameras.main.centerOn(0, 0);
    } else {
      this.cameras.main.centerOn(0, -28 * SPR / 2);
      this.hero(-34, 0, this.vh, false); this.hero(34, 0, this.vh, true);
    }
    (window as unknown as { __phuthe: object }).__phuthe = {
      at: (ms: number, trang?: string) => { if (trang && (STATES as string[]).includes(trang)) this.state = trang as SpiritState; this.fake = ms; this.stateT0 = 0; this.step(ms); },
      bench: () => ({ avgMs: this.spentN ? this.spentMs / this.spentN : 0, frames: this.spentN, players: this.heroes.length, fps: this.game.loop.actualFps }),
      reset: () => { this.spentMs = 0; this.spentN = 0; },
    };
  }
  /** Đặt khung thân + tư thế phụ thể cho mọi hồn sư tại giờ `t` (ms). */
  step(t: number) {
    const st = this.state, once = st === "attack" || st === "cast", dur = animMs(st);
    // đánh / thi triển: lặp mỗi `dur` + nghỉ 700 ms để thấy rõ từng cú; đứng / đi lặp liên tục
    const cyc = once ? dur + 700 : 1e12, age = t % cyc, doing = !once || age < dur;
    const k = spiritScale(this.fakeLevel(), fxPrefs.reduce, !this.other), { row, flip } = DIR_ROW[this.dir];
    const t0 = performance.now();
    for (const h of this.heroes) {
      const f = frameAt(doing ? st : "idle", doing ? age : t, row);
      const vf = h.iso ? f : vohonFrame(f, true, false)?.frame ?? 0;
      h.body.setFrame(f).setFlipX(flip); h.vb.setFrame(vf).setFlipX(flip); h.vf.setFrame(vf).setFlipX(flip);
      const kk = h.on ? k : 0;
      if (!h.fam) continue;
      applySpiritPose([h.vb, h.vf], spiritPose(this.pose, SPIRIT_FAMILY[h.id], once && doing ? st : st === "walk" ? "walk" : "idle", t, age, dur, flip ? -1 : 1, -1, kk, h.phase), this.shift, 0, 0, h.iso ? 1 / SPR : 1, 1 / SPR);
    }
    this.spentMs += performance.now() - t0; this.spentN++;
  }
  fakeLevel(): FxLevel { return fxPrefs.level; }
  update(time: number) { if (this.fake === null) this.step(time); if (!this.heroes.length || this.heroes.length > 2) return; this.cameras.main.centerOn(0, -14); }
}

export function phutheTestScreen(card: HTMLElement, overlay: HTMLElement): void {
  void card; overlay.hidden = true;
  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;left:8px;top:8px;z-index:50;display:flex;flex-wrap:wrap;gap:6px;max-width:92vw;font:12px system-ui;background:#000a;padding:6px;color:#fff";
  if (q.get("bar") === "0") bar.hidden = true;
  const opt = (a: [string, string][], cur: string) => a.map(([v, t]) => `<option value="${v}"${v === cur ? " selected" : ""}>${t}</option>`).join("");
  bar.innerHTML = `
    <label>Võ hồn <select id="pv">${opt(VOHON.map((v) => [v.id, v.name]), q.get("vh") ?? "ta_hoa_phuong_hoang")}</select></label>
    <label>Hướng <select id="pd">${opt([["s", "s"], ["e", "e"], ["n", "n"], ["w", "w"]], q.get("huong") ?? "e")}</select></label>
    <label>Trạng thái <select id="ps">${opt([["idle", "Đứng"], ["walk", "Đi"], ["attack", "Đánh"], ["cast", "Thi triển"]], q.get("trang") ?? "walk")}</select></label>
    <label>Hiệu ứng <select id="pl">${opt([["low", "Thấp"], ["mid", "Vừa"], ["high", "Cao"]], fxPrefs.level)}</select></label>
    <label><input type="checkbox" id="px"${fxPrefs.reduce ? " checked" : ""}> Giảm chuyển động</label>`;
  document.body.appendChild(bar);
  const tag = document.createElement("div");
  tag.style.cssText = "position:fixed;left:0;right:0;bottom:10px;text-align:center;font:700 18px system-ui;color:#fff;text-shadow:0 0 3px #000;z-index:40;display:flex;justify-content:center;gap:0;";
  if (!q.get("n")) { tag.innerHTML = '<span style="width:272px">Trước</span><span style="width:272px">Sau</span>'; document.body.appendChild(tag); }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: "game", backgroundColor: "#0c1712", pixelArt: true, roundPixels: true, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight }, scene: PhutheScene });
  const $ = <T extends HTMLElement>(id: string) => bar.querySelector<T>(`#${id}`)!;
  const sc = () => game.scene.getScene("phuthe") as PhutheScene;
  const reload = (k: string, v: string) => { const u = new URL(location.href); u.searchParams.set(k, v); location.href = u.href; };
  $("pv").onchange = () => reload("vh", $<HTMLSelectElement>("pv").value);
  $("pd").onchange = () => reload("huong", $<HTMLSelectElement>("pd").value);
  $("ps").onchange = () => { sc().state = $<HTMLSelectElement>("ps").value as SpiritState; };
  $("pl").onchange = () => setFxPrefs({ level: $<HTMLSelectElement>("pl").value as FxLevel });
  $("px").onchange = () => setFxPrefs({ reduce: $<HTMLInputElement>("px").checked });
  void SPIRIT_MOTION;
}
