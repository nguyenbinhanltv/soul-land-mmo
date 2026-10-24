// Trang thử hiệu ứng hồn kỹ theo hệ (G3, #394; mở bằng `?thu=fx`, không cần đăng nhập): chọn hệ / kiểu hoặc một hồn kỹ có thật, phát một lần
// hoặc lặp, đổi mức Hiệu ứng / Giảm chuyển động, xem cảnh vòng 7+. Tham số URL cho chụp tự động: he, kieu, tier, zoom, lap=1, auto=1, cine=1.
// S1 (#542): chọn hồn kỹ thì phát cả sheet theo SKILL_VISUAL (nếu có), nút "Đánh thử" cho cảm giác đánh (khựng / tia lửa theo chất liệu / số theo hệ,
// giật lùi), `stress=P&sheets=0` tắt phần mới để so FPS trước / sau. Tham số thêm: mat, nang (0..3), crit=1.
// Chỉ để chủ repo duyệt phong cách; không đổi luật chơi.
import Phaser from "phaser";
import { TIERS, VOHON, ringSkill, chanThanOf, tienCoOf, MAX_RINGS } from "../../shared/data.ts";
import { ELEMENTS, type Element } from "./audio/soundMap.ts";
import { ParticleLayer, fxPrefs, setFxPrefs, hitstopMs, type FxLevel } from "./combatFx.ts";
import { SheetFx } from "./fxSheet.ts";
import { SkillVisualPlayer, skillVisualOf, registerCodeSheets, SKILL_VISUAL, FUSION_VISUAL, visualKey } from "./skillVisual.ts";
import { HIT_HES, KNOCK_PX, damageStyle, hitWeight, materialSparks, playHitFeelSheets, registerHitFeelSheets } from "./hitFeel.ts";
import { COMBAT_MATERIALS, type Material } from "./audio/soundMap.ts";
import type { He } from "../../shared/data.ts";
import { SPR, RX } from "./iso.ts";
import { footDustCount } from "./combatFeelRules.ts";
import { SkillCine } from "./skillCine.ts";
import { ELEMENT_NAME, FX_KINDS, FX_KIND_NAME, FX_TEX_ELEMENTS, SkillFx, skillFxOf, fxTexKey, isCinematic, type FxKind } from "./skillFx.ts";

const q = new URLSearchParams(location.search);
const pick = <T extends string>(v: string | null, all: readonly T[], d: T): T => ((all as readonly string[]).includes(v ?? "") ? (v as T) : d);

class FxTestScene extends Phaser.Scene {
  fxp!: ParticleLayer; skfx!: SkillFx; svp!: SkillVisualPlayer; cine = new SkillCine(); sheets = q.get("sheets") !== "0";
  el: Element = pick(q.get("he"), ELEMENTS, "fire"); kind: FxKind = pick(q.get("kieu"), FX_KINDS, "proj");
  he: He = pick(q.get("he_danh"), HIT_HES, "cuong_cong");
  lastStep = 0;
  tier = Math.max(0, Math.min(4, Number(q.get("tier") ?? 2) | 0));
  rr = 60; hero!: Phaser.GameObjects.Container; dummy!: Phaser.GameObjects.Container;
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
    registerCodeSheets(this); registerHitFeelSheets(this); this.svp = new SkillVisualPlayer(new SheetFx(this));
    this.hero = this.person(-70, 12, 0x9fb4e8); this.dummy = this.person(70, 12, 0xd8b090);
    this.events.on("update", (time: number, dt: number) => {
      this.fxp.update(dt / 1000); this.svp.sheets.update(dt);
      if (q.get("steps") === "1" && time - this.lastStep >= (q.get("run") === "1" ? 300 : 480)) {
        this.lastStep = time; const n = footDustCount(fxPrefs.level, fxPrefs.reduce, true);
        if (n) this.fxp.footDust(this.hero.x, this.hero.y + 4 * SPR, 0x9a8b68, n, q.get("run") !== "1");
      }
    });
    // `stress=P`: P người chơi, mỗi người tung một hồn kỹ ngẫu nhiên mỗi ~2,5 s (đo FPS 40–60 người, docs/hieu-nang-soak.md).
    const P = Number(q.get("stress") ?? 0);
    if (P > 0) this.time.addEvent({ delay: 2500 / P, loop: true, callback: () => {
      const el = ELEMENTS[(Math.random() * ELEMENTS.length) | 0], kind = FX_KINDS[(Math.random() * FX_KINDS.length) | 0];
      const x = (Math.random() - 0.5) * 360, y = (Math.random() - 0.5) * 150, tc = parseInt(TIERS[(Math.random() * 5) | 0].glow.slice(1), 16);
      this.skfx.play(kind, el, { x, y, ang: Math.random() * 6.28, r: 40 + Math.random() * 40, tierCol: tc, dist: 120 });
      if (this.sheets) { // phần mới của S1/C1: sheet theo bảng (nửa số lần là người khác: bản nhẹ) + tia lửa theo chất liệu
        const keys = Object.keys(SKILL_VISUAL), [vid, vr] = keys[(Math.random() * keys.length) | 0].split(":"); // S2: cả 22 chiêu đã có sheet
        const vis = skillVisualOf(vid, vr === "ct" ? 6 : vr === "tc" ? "tc" : +vr, vr === "ct"), vsk = vr === "tc" ? undefined : vr === "ct" ? chanThanOf(vid)?.skill : ringSkill(vid, +vr);
        this.svp.cast(vis, { x, y: y - 8 * SPR, ang: 0, tx: x + 40, ty: y - 8 * SPR, mine: Math.random() < 0.5, r: (vsk?.r ?? 56) * RX, n: vsk?.n, everyMs: (vsk?.every ?? 0) * 1000, spread: ((vsk?.spread ?? 0) * Math.PI) / 180 });
        const mat = COMBAT_MATERIALS[(Math.random() * COMBAT_MATERIALS.length) | 0];
        materialSparks(this.fxp, mat, el, x + 40, y - 8 * SPR, (Math.random() * 3) | 0, SPR);
        playHitFeelSheets(this.svp.sheets, mat, HIT_HES[(Math.random() * HIT_HES.length) | 0], x + 40, y - 8 * SPR, Math.random() < 0.5, 1);
      }
    } });
    (window as unknown as { __fx: object }).__fx = { fps: () => this.game.loop.actualFps, sprites: () => this.skfx.active, parts: () => this.fxp.count, sheets: () => this.svp.sheets.active, pooled: () => this.svp.sheets.pooled };
    if (q.get("hit") === "1") this.time.delayedCall(500, () => this.hit(pick(q.get("mat"), COMBAT_MATERIALS, "thit"), Number(q.get("nang") ?? 0), q.get("crit") === "1"));
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
  /** Cảm giác đánh thử: tia lửa theo chất liệu + hệ, số sát thương, giật lùi mục tiêu, khựng (chỉ báo thời gian). `nang`: độ nặng khai báo 0..3. */
  hit(mat: Material, nang: number, crit: boolean) {
    const w = hitWeight(0.03, crit, false, nang), d = this.dummy, x = d.x, y = d.y - 26;
    materialSparks(this.fxp, mat, this.el, x, y, w, SPR);
    playHitFeelSheets(this.svp.sheets, mat, this.he, x, y, true, w);
    const ds = damageStyle(this.el, crit, true), t = this.add.text(x, y - 10, crit ? "1.280!" : "420", { fontFamily: "system-ui", fontSize: `${ds.font}px`, fontStyle: "bold", color: "#fff2c0", stroke: "#" + ds.stroke.toString(16).padStart(6, "0"), strokeThickness: 3 }).setOrigin(0.5).setDepth(50).setScale(0.5);
    this.tweens.add({ targets: t, y: y - 36, alpha: 0, delay: 350, duration: 550, onComplete: () => t.destroy() });
    const ms = hitstopMs(0.03, crit, false, nang), dx = KNOCK_PX[w] * SPR;
    this.tweens.add({ targets: d, x: x + dx, duration: 55, yoyo: true, ease: "Sine.easeOut" });
    const el = document.getElementById("fn"); if (el) el.textContent = `→ nặng ${w} · khựng ${ms} ms · giật lùi ${KNOCK_PX[w]} px · chất liệu ${mat}`;
    if (!fxPrefs.reduce && fxPrefs.level !== "low") { this.tweens.timeScale = 0.06; window.setTimeout(() => { this.tweens.timeScale = 1; }, ms); }
  }
  /** Phát lần lượt cả 5 kiểu của hệ đang chọn (xem nhanh một hệ). */
  fireAll(el = this.el) {
    FX_KINDS.forEach((k, i) => this.time.delayedCall([0, 250, 500, 800, 1100][i], () => this.fire(k, el)));
  }
  /** Phát một kiểu từ người trái sang mục tiêu phải, màu niên hạn theo `tier`. */
  fire(kind = this.kind, el = this.el, partsOnly = false, atHero = false) {
    const tc = parseInt(TIERS[this.tier].glow.slice(1), 16), x = this.hero.x, y = this.hero.y, base = { x, y, ang: 0, tierCol: tc, partsOnly };
    if (atHero && kind === "zone") { this.skfx.play("zone", el, { ...base, r: this.rr }); return; }
    if (kind === "proj") this.skfx.play("proj", el, { ...base, dist: this.dummy.x - x });
    else if (kind === "zone") this.skfx.play("zone", el, { ...base, x: this.dummy.x, y: this.dummy.y, r: 60 });
    else if (kind === "slash") this.skfx.play("slash", el, { ...base, r: 28 });
    else if (kind === "aura") this.skfx.play("aura", el, base);
    else this.skfx.play("hit", el, { ...base, x: this.dummy.x, y: this.dummy.y });
  }
}

export function fxTestScreen(card: HTMLElement, overlay: HTMLElement): void {
  void card; overlay.hidden = true;
  // Tham số cho quay hình / đo FPS: `lv=low|mid|high`, `reduce=1` (Giảm chuyển động).
  const lv = q.get("lv"); if (lv === "low" || lv === "mid" || lv === "high") setFxPrefs({ level: lv });
  if (q.get("reduce") === "1") setFxPrefs({ reduce: true });
  const bar = document.createElement("div");
  bar.id = "fxbar"; bar.style.cssText = "position:fixed;left:8px;top:8px;z-index:50;display:flex;flex-wrap:wrap;gap:6px;max-width:92vw;font:12px system-ui;background:#000a;padding:6px;color:#fff";
  if (q.get("bar") === "0") bar.hidden = true;
  const opt = (a: [string, string][], cur: string) => a.map(([v, t]) => `<option value="${v}"${v === cur ? " selected" : ""}>${t}</option>`).join("");
  const sks: [string, string][] = [];
  for (const v of VOHON) for (let r = 0; r < MAX_RINGS; r++) { const s = ringSkill(v.id, r); if (s) sks.push([`${v.id}:${r}`, `${v.name} · vòng ${r + 1} · ${s.name}`]); }
  for (const v of VOHON) { const c = chanThanOf(v.id); if (c) sks.push([`${v.id}:ct`, `${v.name} · Chân Thân · ${c.skill.name}`]); }
  for (const v of VOHON) sks.push([`${v.id}:tc`, `${v.name} · Tiên cơ · ${tienCoOf(v.id).name}`]);
  bar.innerHTML = `
    <label>Hệ <select id="fe">${opt(ELEMENTS.map((e) => [e, ELEMENT_NAME[e] + (FX_TEX_ELEMENTS.includes(e) ? " ✓ảnh" : "")]), q.get("he") ?? "fire")}</select></label>
    <label>Kiểu <select id="fk">${opt(FX_KINDS.map((k) => [k, FX_KIND_NAME[k]]), q.get("kieu") ?? "proj")}</select></label>
    <label>Niên hạn <select id="ft">${opt(TIERS.map((t, i) => [String(i), t.age]), q.get("tier") ?? "2")}</select></label>
    <label>Hiệu ứng <select id="fl">${opt([["low", "Thấp"], ["mid", "Vừa"], ["high", "Cao"]], fxPrefs.level)}</select></label>
    <label><input type="checkbox" id="fr"${fxPrefs.reduce ? " checked" : ""}> Giảm chuyển động</label>
    <label><input type="checkbox" id="fp"${q.get("lap") === "1" ? " checked" : ""}> Lặp</label>
    <button id="fgo">Phát</button> <button id="fa">Cả 5 kiểu</button>
    <label>Hồn kỹ <select id="fs"><option value="">— chọn hồn kỹ —</option>${opt(sks, "")}</select></label>
    <button id="fc">Cảnh vòng 7+</button>
    <label>Hệ đánh <select id="fhệ">${opt(HIT_HES.map((h) => [h, h]), q.get("he_danh") ?? "cuong_cong")}</select></label>
    <label>Chất liệu <select id="fm">${opt(COMBAT_MATERIALS.map((m) => [m, m]), q.get("mat") ?? "thit")}</select></label>
    <label>Nặng <select id="fh">${opt([["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"]], q.get("nang") ?? "0")}</select></label>
    <label><input type="checkbox" id="fx"${q.get("crit") === "1" ? " checked" : ""}> Chí mạng</label> <button id="fhit">Đánh thử</button> <span id="fn"></span>`;
  document.body.appendChild(bar);
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: "game", backgroundColor: "#0c1712", pixelArt: true, roundPixels: true, audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight }, scene: FxTestScene });
  const $ = <T extends HTMLElement>(id: string) => bar.querySelector<T>(`#${id}`)!;
  const sc = () => game.scene.getScene("fxtest") as FxTestScene;
  let timer = 0;
  const setLoop = (on: boolean) => { window.clearInterval(timer); if (on) timer = window.setInterval(() => (lastSkill ? runSkill(lastSkill) : sc().fire()), +(q.get("gap") ?? 1400)); };
  $("fe").onchange = () => { sc().el = $<HTMLSelectElement>("fe").value as Element; };
  $("fk").onchange = () => { sc().kind = $<HTMLSelectElement>("fk").value as FxKind; };
  $("ft").onchange = () => { sc().tier = +$<HTMLSelectElement>("ft").value; };
  $("fl").onchange = () => setFxPrefs({ level: $<HTMLSelectElement>("fl").value as FxLevel });
  $("fr").onchange = () => setFxPrefs({ reduce: $<HTMLInputElement>("fr").checked });
  $("fhệ").onchange = () => { sc().he = $<HTMLSelectElement>("fhệ").value as He; };
  $("fp").onchange = () => setLoop($<HTMLInputElement>("fp").checked);
  $("fgo").onclick = () => sc().fire();
  $("fa").onclick = () => sc().fireAll();
  $("fhit").onclick = () => sc().hit($<HTMLSelectElement>("fm").value as Material, +$<HTMLSelectElement>("fh").value, $<HTMLInputElement>("fx").checked);
  /** Phát một hồn kỹ theo khóa `<mã>:<vòng 0..9 | ct | tc>`: hiệu ứng G3 + sheet SKILL_VISUAL (trừ `sv=0`) + cảnh vòng 7+ + đánh thử lên mục tiêu (khựng, tia lửa, số). */
  const runSkill = (v: string) => {
    const [id, r] = v.split(":");
    if (id === "fusion") { // S3 (#566): dung hợp `fusion:<tên chiêu>`: sheet ở điểm giữa (trang thử không có đóa kính dựng bằng code của GameScene)
      const fv = FUSION_VISUAL[r], s = sc(); lastSkill = v; (window as unknown as { __t0: number }).__t0 = performance.now();
      if (fv && q.get("sv") !== "0") s.svp.cast({ tier: 3, heavy: 2, ...fv }, { x: s.hero.x, y: s.hero.y - 8 * SPR, ang: 0, tx: s.hero.x, ty: s.hero.y - 8 * SPR, mine: q.get("others") !== "1", r: 100 * RX });
      return;
    }
    const ct = r === "ct", tc = r === "tc", ring = ct || tc ? 6 : +r, d = skillFxOf(id, tc ? 0 : ring, ct);
    const sk = tc ? undefined : (ct ? chanThanOf(id)?.skill : ringSkill(id, ring));
    sc().el = d.element; sc().kind = d.kind; $<HTMLSelectElement>("fe").value = d.element; $<HTMLSelectElement>("fk").value = d.kind;
    $("fn").textContent = `→ ${ELEMENT_NAME[d.element]} · ${FX_KIND_NAME[d.kind]} · ${fxTexKey(d.element, d.kind)}${FX_TEX_ELEMENTS.includes(d.element) ? "" : " (chưa có ảnh: chỉ hạt)"}`;
    const vk = tc ? "tc" as const : ring, vis = skillVisualOf(id, vk, ct), s = sc(), hy = s.hero.y - 8 * SPR, own = q.get("others") !== "1";
    const area = sk?.area ?? "around", rr = (sk?.r ?? (tc ? tienCoOf(id).r : 56)) * RX, tl = vis.sheet?.at === "cast" ? 0 : Math.max(rr, 24 * SPR) * (area === "proj" ? 0.9 : 0.5);
    // Cùng cách tính điểm trúng với GameScene.skillFx; trang thử đặt mục tiêu cố định ở bên phải.
    const tx = area === "target" || area === "front" || area === "dash" || area === "proj" ? s.dummy.x : s.hero.x + tl;
    s.rr = rr; (window as unknown as { __t0: number }).__t0 = performance.now(); // mốc phát chiêu cho script quay hình
    const withSheet = q.get("sv") !== "0";
    s.fire(d.kind, d.element, withSheet && !!vis.replace && !!vis.sheet && s.svp.sheets.has(vis.sheet.key), area === "around" || area === "self");
    if (withSheet) s.svp.cast(vis, { x: s.hero.x, y: hy, ang: 0, tx, ty: s.dummy.y - 8 * SPR, mine: own, r: rr, n: sk?.n, everyMs: (sk?.every ?? 0) * 1000, spread: ((sk?.spread ?? 0) * Math.PI) / 180 });
    const key = visualKey(id, vk, ct);
    $("fn").textContent += ` · T${vis.tier} nặng ${vis.heavy}${SKILL_VISUAL[key]?.sheet ? " · sheet " + SKILL_VISUAL[key]!.sheet!.key : " · (chưa có sheet: G3)"}`;
    if (!tc && isCinematic(ring, ct) && q.get("cine") !== "0") sc().cine.show(id, sk?.name ?? "", TIERS[sc().tier].glow, true);
    if (q.get("hit") !== "0") window.setTimeout(() => sc().hit(pick(q.get("mat"), COMBAT_MATERIALS, "thit"), vis.heavy, false), 160);
    lastSkill = v;
  };
  let lastSkill = "";
  $("fs").onchange = () => { const v = $<HTMLSelectElement>("fs").value; if (v) runSkill(v); };
  $("fc").onclick = () => sc().cine.show(VOHON[0].id, "Vô Ngã Kiếm Trận", TIERS[sc().tier].glow, true);
  (window as unknown as { __runSkill: (v: string) => void }).__runSkill = runSkill;
  const pre = q.get("skill"); if (pre) { $<HTMLSelectElement>("fs").value = pre; window.setTimeout(() => runSkill(pre), +(q.get("wait") ?? 900)); }
  if (q.get("lap") === "1") setLoop(true);
  if (q.get("cine") === "1") setTimeout(() => $("fc").click(), 1200);
}
