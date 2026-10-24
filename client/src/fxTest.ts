// Trang thử hiệu ứng hồn kỹ theo hệ (G3, #394; mở bằng `?thu=fx`, không cần đăng nhập): chọn hệ / kiểu hoặc một hồn kỹ có thật, phát một lần
// hoặc lặp, đổi mức Hiệu ứng / Giảm chuyển động, xem cảnh vòng 7+. Tham số URL cho chụp tự động: he, kieu, tier, zoom, lap=1, auto=1, cine=1.
// Chỉ để chủ repo duyệt phong cách; không đổi luật chơi.
import Phaser from "phaser";
import { TIERS, VOHON, ringSkill, chanThanOf, MAX_RINGS } from "../../shared/data.ts";
import { ELEMENTS, type Element } from "./audio/soundMap.ts";
import { ParticleLayer, fxPrefs, setFxPrefs, type FxLevel } from "./combatFx.ts";
import { SPR } from "./iso.ts";
import { SkillCine } from "./skillCine.ts";
import { ELEMENT_NAME, FX_KINDS, FX_KIND_NAME, FX_TEX_ELEMENTS, SkillFx, skillFxOf, fxTexKey, isCinematic, type FxKind } from "./skillFx.ts";

const q = new URLSearchParams(location.search);
const pick = <T extends string>(v: string | null, all: readonly T[], d: T): T => ((all as readonly string[]).includes(v ?? "") ? (v as T) : d);

class FxTestScene extends Phaser.Scene {
  fxp!: ParticleLayer; skfx!: SkillFx; cine = new SkillCine();
  el: Element = pick(q.get("he"), ELEMENTS, "fire"); kind: FxKind = pick(q.get("kieu"), FX_KINDS, "proj");
  tier = Math.max(0, Math.min(4, Number(q.get("tier") ?? 2) | 0));
  hero!: Phaser.GameObjects.Container; dummy!: Phaser.GameObjects.Container;
  constructor() { super("fxtest"); }
  preload() {
    this.load.json("m", "sprites/manifest.json");
    this.load.once("filecomplete-json-m", (_k: string, _t: string, d: { sprites?: ({ key: string; frame?: [number, number] } | string)[] }) => {
      for (const e of d?.sprites ?? []) if (typeof e !== "string" && /^fx_/.test(e.key) && e.frame) this.load.spritesheet(e.key, `sprites/iso/fx/${e.key.slice(3)}.png`, { frameWidth: e.frame[0], frameHeight: e.frame[1] });
    });
    for (const l of ["body", "outfit", "hair"]) this.load.spritesheet(`t_${l}`, `sprites/honsu/${l}_m_0.png`, { frameWidth: 64, frameHeight: 64 });
  }
  create() {
    const z = Number(q.get("zoom") ?? 2);
    this.cameras.main.setZoom(z).setBackgroundColor("#0c1712").setRoundPixels(true).centerOn(0, 0);
    this.drawGround();
    this.fxp = new ParticleLayer(this, 99979, SPR);
    this.skfx = new SkillFx(this, this.fxp);
    this.hero = this.person(-70, 12, 0x9fb4e8); this.dummy = this.person(70, 12, 0xd8b090);
    this.events.on("update", (_t: number, dt: number) => this.fxp.update(dt / 1000));
    // `stress=P`: P người chơi, mỗi người tung một hồn kỹ ngẫu nhiên mỗi ~2,5 s (đo FPS 40–60 người, docs/hieu-nang-soak.md).
    const P = Number(q.get("stress") ?? 0);
    if (P > 0) this.time.addEvent({ delay: 2500 / P, loop: true, callback: () => {
      const el = ELEMENTS[(Math.random() * ELEMENTS.length) | 0], kind = FX_KINDS[(Math.random() * FX_KINDS.length) | 0];
      const x = (Math.random() - 0.5) * 360, y = (Math.random() - 0.5) * 150, tc = parseInt(TIERS[(Math.random() * 5) | 0].glow.slice(1), 16);
      this.skfx.play(kind, el, { x, y, ang: Math.random() * 6.28, r: 40 + Math.random() * 40, tierCol: tc, dist: 120 });
    } });
    (window as unknown as { __fx: object }).__fx = { fps: () => this.game.loop.actualFps, sprites: () => this.skfx.active, parts: () => this.fxp.count };
    if (q.get("auto") === "1") this.time.delayedCall(500, () => this.fire());
  }
  drawGround() {
    const g = this.add.graphics().setDepth(0);
    for (let i = -9; i <= 9; i++) for (let j = -9; j <= 9; j++) {
      const x = (i - j) * 16, y = (i + j) * 8;
      if (Math.abs(x) > 280 || Math.abs(y) > 150) continue;
      g.fillStyle((i + j) & 1 ? 0x1b2a22 : 0x20332a, 1).fillPoints([{ x, y: y - 8 }, { x: x + 16, y }, { x, y: y + 8 }, { x: x - 16, y }], true);
    }
  }
  person(x: number, y: number, tint: number) {
    const c = this.add.container(x, y).setDepth(10);
    c.add(this.add.ellipse(0, 0, 22, 9, 0x000000, 0.4));
    // khung 64×64, chân ở (32, 58): dời lên cho chân trùng gốc container
    c.add(this.add.sprite(0, -26, "t_body", 0)); c.add(this.add.sprite(0, -26, "t_outfit", 0).setTint(tint)); c.add(this.add.sprite(0, -26, "t_hair", 0).setTint(0x6a4a3a));
    return c;
  }
  /** Phát lần lượt cả 5 kiểu của hệ đang chọn (xem nhanh một hệ). */
  fireAll(el = this.el) {
    FX_KINDS.forEach((k, i) => this.time.delayedCall([0, 250, 500, 800, 1100][i], () => this.fire(k, el)));
  }
  /** Phát một kiểu từ người trái sang mục tiêu phải, màu niên hạn theo `tier`. */
  fire(kind = this.kind, el = this.el) {
    const tc = parseInt(TIERS[this.tier].glow.slice(1), 16), x = this.hero.x, y = this.hero.y, base = { x, y, ang: 0, tierCol: tc };
    if (kind === "proj") this.skfx.play("proj", el, { ...base, dist: this.dummy.x - x });
    else if (kind === "zone") this.skfx.play("zone", el, { ...base, x: this.dummy.x, y: this.dummy.y, r: 60 });
    else if (kind === "slash") this.skfx.play("slash", el, { ...base, r: 28 });
    else if (kind === "aura") this.skfx.play("aura", el, base);
    else this.skfx.play("hit", el, { ...base, x: this.dummy.x, y: this.dummy.y });
  }
}

export function fxTestScreen(card: HTMLElement, overlay: HTMLElement): void {
  void card; overlay.hidden = true;
  const bar = document.createElement("div");
  bar.id = "fxbar"; bar.style.cssText = "position:fixed;left:8px;top:8px;z-index:50;display:flex;flex-wrap:wrap;gap:6px;max-width:92vw;font:12px system-ui;background:#000a;padding:6px;color:#fff";
  if (q.get("bar") === "0") bar.hidden = true;
  const opt = (a: [string, string][], cur: string) => a.map(([v, t]) => `<option value="${v}"${v === cur ? " selected" : ""}>${t}</option>`).join("");
  const sks: [string, string][] = [];
  for (const v of VOHON) for (let r = 0; r < MAX_RINGS; r++) { const s = ringSkill(v.id, r); if (s) sks.push([`${v.id}:${r}`, `${v.name} · vòng ${r + 1} · ${s.name}`]); }
  for (const v of VOHON) { const c = chanThanOf(v.id); if (c) sks.push([`${v.id}:ct`, `${v.name} · Chân Thân · ${c.skill.name}`]); }
  bar.innerHTML = `
    <label>Hệ <select id="fe">${opt(ELEMENTS.map((e) => [e, ELEMENT_NAME[e] + (FX_TEX_ELEMENTS.includes(e) ? " ✓ảnh" : "")]), q.get("he") ?? "fire")}</select></label>
    <label>Kiểu <select id="fk">${opt(FX_KINDS.map((k) => [k, FX_KIND_NAME[k]]), q.get("kieu") ?? "proj")}</select></label>
    <label>Niên hạn <select id="ft">${opt(TIERS.map((t, i) => [String(i), t.age]), q.get("tier") ?? "2")}</select></label>
    <label>Hiệu ứng <select id="fl">${opt([["low", "Thấp"], ["mid", "Vừa"], ["high", "Cao"]], fxPrefs.level)}</select></label>
    <label><input type="checkbox" id="fr"${fxPrefs.reduce ? " checked" : ""}> Giảm chuyển động</label>
    <label><input type="checkbox" id="fp"${q.get("lap") === "1" ? " checked" : ""}> Lặp</label>
    <button id="fgo">Phát</button> <button id="fa">Cả 5 kiểu</button>
    <label>Hồn kỹ <select id="fs"><option value="">— chọn hồn kỹ —</option>${opt(sks, "")}</select></label>
    <button id="fc">Cảnh vòng 7+</button> <span id="fn"></span>`;
  document.body.appendChild(bar);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: "game", backgroundColor: "#0c1712", pixelArt: true, roundPixels: true, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight }, scene: FxTestScene });
  const $ = <T extends HTMLElement>(id: string) => bar.querySelector<T>(`#${id}`)!;
  const sc = () => game.scene.getScene("fxtest") as FxTestScene;
  let timer = 0;
  const setLoop = (on: boolean) => { window.clearInterval(timer); if (on) timer = window.setInterval(() => sc().fire(), 1400); };
  $("fe").onchange = () => { sc().el = $<HTMLSelectElement>("fe").value as Element; };
  $("fk").onchange = () => { sc().kind = $<HTMLSelectElement>("fk").value as FxKind; };
  $("ft").onchange = () => { sc().tier = +$<HTMLSelectElement>("ft").value; };
  $("fl").onchange = () => setFxPrefs({ level: $<HTMLSelectElement>("fl").value as FxLevel });
  $("fr").onchange = () => setFxPrefs({ reduce: $<HTMLInputElement>("fr").checked });
  $("fp").onchange = () => setLoop($<HTMLInputElement>("fp").checked);
  $("fgo").onclick = () => sc().fire();
  $("fa").onclick = () => sc().fireAll();
  $("fs").onchange = () => {
    const v = $<HTMLSelectElement>("fs").value; if (!v) return;
    const [id, r] = v.split(":"), ct = r === "ct", ring = ct ? 6 : +r, d = skillFxOf(id, ring, ct);
    sc().el = d.element; sc().kind = d.kind; $<HTMLSelectElement>("fe").value = d.element; $<HTMLSelectElement>("fk").value = d.kind;
    $("fn").textContent = `→ ${ELEMENT_NAME[d.element]} · ${FX_KIND_NAME[d.kind]} · ${fxTexKey(d.element, d.kind)}${FX_TEX_ELEMENTS.includes(d.element) ? "" : " (chưa có ảnh: chỉ hạt)"}`;
    sc().fire(d.kind, d.element);
    if (isCinematic(ring, ct)) sc().cine.show(id, (ct ? chanThanOf(id)?.skill : ringSkill(id, ring))?.name ?? "", TIERS[sc().tier].glow, true);
  };
  $("fc").onclick = () => sc().cine.show(VOHON[0].id, "Vô Ngã Kiếm Trận", TIERS[sc().tier].glow, true);
  if (q.get("lap") === "1") setLoop(true);
  if (q.get("cine") === "1") setTimeout(() => $("fc").click(), 1200);
}
