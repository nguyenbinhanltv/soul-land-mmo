// Trang thử pháp tướng (#486; mở bằng `?thu=phaptuong`, không cần đăng nhập): chọn võ hồn, hướng, số vòng (tiến hóa), mức hiệu ứng; thử biến hình,
// đánh, bùng, tan, hai pháp tướng cùng lúc. Tham số URL cho chụp tự động: vh, huong, vong, duo=<mã võ hồn thứ hai>, auto=1 (biến hình sau 0,4 s),
// danh=1 (đánh lặp), bar=0 (ẩn thanh), zoom, kieu=halo|feet|old (vòng hồn hoàn khi Chân Thân, #535), hk=1 (tung hồn kỹ lặp: vòng lóe sáng). Dùng đúng PhapTuongSystem như trong game; chưa có ảnh thì dùng hình tạm vẽ bằng code.
import Phaser from "phaser";
import { VOHON, PHAP_TUONG, HAO_QUANG_MODES, type HaoQuangMode } from "../../shared/data.ts";
import { ParticleLayer, fxPrefs, setFxPrefs, type FxLevel } from "./combatFx.ts";
import { SPR, type Dir8 } from "./iso.ts";
import { PhapTuongSystem, PhapTuongCutIn } from "./phapTuong.ts";
import { buildRings, animateRings, type RingHost } from "./soulRings.ts";

const q = new URLSearchParams(location.search);
if (q.get("kieu") === "halo" || q.get("kieu") === "feet" || q.get("kieu") === "old") fxPrefs.halo = q.get("kieu") as HaoQuangMode; // chỉ phiên này, không lưu
const FACES: Dir8[] = ["s", "se", "e", "ne", "n", "nw", "w", "sw"];

class PtTestScene extends Phaser.Scene {
  fxp!: ParticleLayer; pt!: PhapTuongSystem; cut = new PhapTuongCutIn(); aura!: Phaser.GameObjects.Graphics;
  vh = VOHON.some((v) => v.id === q.get("vh")) ? q.get("vh")! : "lam_dien_ba_vuong_long";
  face: Dir8 = (FACES as string[]).includes(q.get("huong") ?? "") ? (q.get("huong") as Dir8) : "se";
  rings = Math.max(7, Math.min(10, Number(q.get("vong") ?? 9) | 0));
  ava = 0; hero!: Phaser.GameObjects.Container; host!: RingHost; builtRings = 0;
  /** Niên hạn từng vòng của hồn sư thử (vòng 7 = đen), đủ 10 vòng. */
  static TIERS = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  constructor() { super("pttest"); }
  preload() {
    this.load.json("m", "sprites/manifest.json");
    this.load.once("filecomplete-json-m", (_k: string, _t: string, d: { sprites?: ({ key: string } | string)[] }) => {
      for (const e of d?.sprites ?? []) if (typeof e !== "string" && /^pt_/.test(e.key)) this.load.spritesheet(e.key, `sprites/phaptuong/${e.key.slice(3)}.png`, { frameWidth: 160, frameHeight: 160 });
    });
    for (const l of ["body", "outfit", "hair"]) this.load.spritesheet(`t_${l}`, `sprites/honsu/${l}_m_0.png`, { frameWidth: 64, frameHeight: 64 });
  }
  create() {
    this.cameras.main.setZoom(Number(q.get("zoom") ?? 2)).setBackgroundColor("#0c1712").setRoundPixels(true).centerOn(0, -30);
    const g = this.add.graphics().setDepth(0);
    for (let i = -9; i <= 9; i++) for (let j = -9; j <= 9; j++) {
      const x = (i - j) * 16, y = (i + j) * 8; if (Math.abs(x) > 280 || Math.abs(y) > 150) continue;
      g.fillStyle((i + j) & 1 ? 0x1b2a22 : 0x20332a, 1).fillPoints([{ x, y: y - 8 }, { x: x + 16, y }, { x, y: y + 8 }, { x: x - 16, y }], true);
    }
    this.fxp = new ParticleLayer(this, 99979, SPR);
    this.pt = new PhapTuongSystem(this, this.fxp);
    // đúng cách dựng của GameScene: khung chứa phóng SPR, mỗi lớp ảnh phóng 1 / SPR (khung 64×64, chân ở (32, 58))
    const lay = (key: string, tint?: number) => { const sp = this.make.sprite({ x: 0, y: -26 / SPR, key, frame: 0 }, false).setScale(1 / SPR); if (tint) sp.setTint(tint); return sp; };
    const ringsB = this.make.container({}, false), ringsF = this.make.container({}, false);
    this.hero = this.add.container(0, 20, [this.add.ellipse(0, 0, 22 / SPR, 9 / SPR, 0x000000, 0.4), ringsB, lay("t_body"), lay("t_outfit", 0x9fb4e8), lay("t_hair", 0x6a4a3a), ringsF]).setScale(SPR).setDepth(20);
    this.host = { root: this.hero, ringsB, ringsF, ringY: [], lit: null, halo: null };
    this.aura = this.add.graphics().setDepth(19);
    if (q.get("hk") === "1") this.time.addEvent({ delay: 2000, loop: true, callback: () => this.cast() });
    (window as unknown as { __pt: object }).__pt = { pool: () => this.pt.pooled, active: () => this.pt.active, parts: () => this.fxp.count, fps: () => this.game.loop.actualFps };
    if (q.get("auto") === "1") this.time.delayedCall(400, () => this.morph());
    if (q.get("danh") === "1") this.time.addEvent({ delay: 1500, loop: true, callback: () => this.pt.strike("hero", this.time.now) });
  }
  cast() { this.host.lit = { i: (this.host.lit ? this.host.lit.i + 3 : 1) % this.rings, t0: this.time.now }; }
  morph() {
    this.ava = 1; this.pt.begin("hero", this.time.now);
    this.cut.show(this, this.vh, VOHON.find((v) => v.id === this.vh)!.col);
    const d = q.get("duo"); this.pt.setExtra("hero", d && PHAP_TUONG[d] ? d : null);
  }
  update(time: number, delta: number) {
    const dt = delta / 1000; this.fxp.update(dt);
    this.pt.sync("hero", { x: this.hero.x, y: this.hero.y, depth: this.hero.depth, face: this.face, alpha: 1 }, { ava: this.ava, dead: false, rings: this.rings, vohonId: this.vh }, true, time, dt);
    const tiers = PtTestScene.TIERS.slice(0, this.rings);
    if (this.builtRings !== this.rings) { this.builtRings = this.rings; buildRings(this, this.host, tiers); }
    animateRings(this, this.host, { ava: this.ava, dead: false, rings: tiers }, time, { mine: true, formAge: this.pt.formAge("hero", time), lift: 0, delta });
    this.aura.clear();
    this.pt.auraFx(this.aura, "hero", this.hero.x, this.hero.y, this.rings, parseInt(VOHON.find((v) => v.id === this.vh)!.col.slice(1), 16), true, time, SPR);
  }
}

export function phapTuongTestScreen(card: HTMLElement, overlay: HTMLElement): void {
  void card; overlay.hidden = true;
  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;left:8px;top:8px;z-index:50;display:flex;flex-wrap:wrap;gap:6px;max-width:92vw;font:12px system-ui;background:#000a;padding:6px;color:#fff";
  if (q.get("bar") === "0") bar.hidden = true;
  const opt = (a: [string, string][], cur: string) => a.map(([v, t]) => `<option value="${v}"${v === cur ? " selected" : ""}>${t}</option>`).join("");
  bar.innerHTML = `
    <label>Võ hồn <select id="pv">${opt(VOHON.map((v) => [v.id, v.name]), q.get("vh") ?? "lam_dien_ba_vuong_long")}</select></label>
    <label>Hướng <select id="pd">${opt(FACES.map((f) => [f, f]), q.get("huong") ?? "se")}</select></label>
    <label>Vòng <select id="pr">${opt([7, 8, 9, 10].map((n) => [String(n), `Vòng ${n}`]), q.get("vong") ?? "9")}</select></label>
    <label>Hiệu ứng <select id="pl">${opt([["low", "Thấp"], ["mid", "Vừa"], ["high", "Cao"]], fxPrefs.level)}</select></label>
    <label>Vòng hồn hoàn <select id="pk">${opt(HAO_QUANG_MODES.map(([v, t]) => [v, t]), fxPrefs.halo)}</select></label>
    <label><input type="checkbox" id="px"${fxPrefs.reduce ? " checked" : ""}> Giảm chuyển động</label>
    <label><input type="checkbox" id="pc"${fxPrefs.cutin ? " checked" : ""}> Cut-in</label>
    <button id="pm">Biến hình</button> <button id="ph">Hồn kỹ</button> <button id="ps">Đánh</button> <button id="pb">Bùng</button> <button id="pt">Tan</button> <button id="p2">Hai pháp tướng</button>`;
  document.body.appendChild(bar);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: "game", backgroundColor: "#0c1712", pixelArt: true, roundPixels: true, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight }, scene: PtTestScene });
  const $ = <T extends HTMLElement>(id: string) => bar.querySelector<T>(`#${id}`)!;
  const sc = () => game.scene.getScene("pttest") as PtTestScene;
  $("pv").onchange = () => { sc().vh = $<HTMLSelectElement>("pv").value; sc().pt.drop("hero"); };
  $("pd").onchange = () => { sc().face = $<HTMLSelectElement>("pd").value as Dir8; };
  $("pr").onchange = () => { sc().rings = +$<HTMLSelectElement>("pr").value; };
  $("pl").onchange = () => setFxPrefs({ level: $<HTMLSelectElement>("pl").value as FxLevel });
  $("px").onchange = () => setFxPrefs({ reduce: $<HTMLInputElement>("px").checked });
  $("pc").onchange = () => setFxPrefs({ cutin: $<HTMLInputElement>("pc").checked });
  $("pk").onchange = () => setFxPrefs({ halo: $<HTMLSelectElement>("pk").value as HaoQuangMode });
  $("ph").onclick = () => sc().cast();
  $("pm").onclick = () => sc().morph();
  $("ps").onclick = () => sc().pt.strike("hero", sc().time.now);
  $("pb").onclick = () => sc().pt.burst("hero", sc().time.now);
  $("pt").onclick = () => { sc().ava = 0; };
  $("p2").onclick = () => sc().pt.setExtra("hero", sc().vh === "hao_thien_chuy" ? "lam_dien_ba_vuong_long" : "hao_thien_chuy");
}
