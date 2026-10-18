import Phaser from "phaser";
import type { Room } from "colyseus.js";
import { TIERS, BEASTS, ringLimit, TILE, titleOf } from "../../../shared/data.ts";
import { makeTextures, honsuTexture, PLAYER_ORIGIN, BEAST_ORIGIN } from "../textures.ts";
import { preloadSprites, createSheetAnims } from "../sprites.ts";
import * as hud from "../hud.ts";
import type { OwnedVohons } from "../net.ts";

const hex = (c: string) => parseInt(c.slice(1), 16);
interface PView { spr: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text; title: Phaser.GameObjects.Text; }
interface Zone { name: string; hint: string; x0: number; x1: number; }

export class GameScene extends Phaser.Scene {
  room!: Room<any>;
  mapId = "";
  me = "";
  players = new Map<string, PView>();
  beasts = new Map<string, Phaser.GameObjects.Sprite>();
  drops = new Map<string, Phaser.GameObjects.Image>();
  ov!: Phaser.GameObjects.Graphics;
  vignette!: Phaser.GameObjects.Image;
  zones: Zone[] = [];
  campRect = { x: 0, y: 0, w: 0, h: 0 };
  keys: Record<string, boolean> = {};
  joy = { x: 0, y: 0 };
  lastInput = "";
  lastZone = "";
  skillsKey = "";
  hudT = 0;
  mini!: { ctx: CanvasRenderingContext2D; base: HTMLCanvasElement };
  mapW = 0; mapH = 0;

  constructor() { super("game"); }
  init(data: { room: Room<any>; mapId: string }) { this.room = data.room; this.mapId = data.mapId; this.me = data.room.sessionId; }

  preload() {
    // Mỗi bản đồ một file Tiled: shared/assets/<mapId>.json (vite phục vụ shared/assets làm thư mục public).
    this.load.tilemapTiledJSON(this.mapId, `${this.mapId}.json`);
    this.load.image("tiles", "tiles.png");
    preloadSprites(this);
  }

  create() {
    const map = this.make.tilemap({ key: this.mapId });
    const ts = map.addTilesetImage("tiles", "tiles")!;
    map.createLayer("ground", ts, 0, 0)!.setDepth(-10);
    map.createLayer("trees", ts, 0, 0)!.setDepth(-5);
    map.createLayer("canopy", ts, 0, 0)!.setDepth(100000);
    this.mapW = map.widthInPixels; this.mapH = map.heightInPixels;
    for (const o of map.getObjectLayer("zones")?.objects ?? []) {
      const hint = (o.properties as any[] | undefined)?.find((p) => p.name === "hint")?.value ?? "";
      if (o.type === "zone") this.zones.push({ name: o.name, hint, x0: o.x!, x1: o.x! + o.width! });
      if (o.type === "spawn") this.campRect = { x: o.x!, y: o.y!, w: o.width!, h: o.height! };
    }
    this.buildMinimap(map);
    makeTextures(this);
    createSheetAnims(this);

    this.ov = this.add.graphics().setDepth(99990);
    this.vignette = this.add.image(0, 0, "vignette").setScrollFactor(0).setDepth(99995).setAlpha(0);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.mapW, this.mapH).setRoundPixels(true);
    this.fitZoom();
    this.scale.on("resize", () => this.fitZoom());

    this.setupInput();
    this.setupMessages();
    document.getElementById("hud")!.hidden = false;
    document.body.classList.add("playing");
  }

  fitZoom() {
    const w = this.scale.width, h = this.scale.height;
    const z = Math.max(2, Math.min(6, Math.floor(Math.min(w / 420, h / 240))));
    this.cameras.main.setZoom(z);
    this.vignette.setPosition(w / 2, h / 2).setDisplaySize(w / z + 40, h / z + 40);
  }

  // ---------- Điều khiển ----------
  setupInput() {
    const chat = document.getElementById("chat") as HTMLInputElement;
    const typing = () => document.activeElement === chat;
    addEventListener("keydown", (e) => {
      if (typing()) {
        if (e.key === "Enter") { const t = chat.value.trim(); if (t) this.room.send("chat", { text: t }); chat.value = ""; chat.blur(); }
        if (e.key === "Escape") chat.blur();
        return;
      }
      if (e.key === "Enter") { chat.focus(); e.preventDefault(); return; }
      if (e.code === "KeyV" && !e.repeat) { hud.toggleRoster(); return; }
      if (e.code === "Escape") { hud.toggleRoster(false); return; }
      this.keys[e.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.repeat && e.code !== "KeyJ" && e.code !== "Space") return;
      if (e.code === "KeyJ" || e.code === "Space") this.act("attack");
      else if (e.code === "KeyE") this.act("absorb");
      else if (/^Digit[1-4]$/.test(e.code)) this.act("skill" + (Number(e.code.slice(5)) - 1));
    });
    addEventListener("keyup", (e) => { this.keys[e.code] = false; });
    addEventListener("blur", () => { this.keys = {}; });
    chat.addEventListener("focus", () => { this.keys = {}; });
    document.getElementById("vhBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); hud.toggleRoster(); });

    const joyEl = document.getElementById("joy")!, knob = document.getElementById("knob")!;
    let jid: number | null = null;
    const mv = (e: PointerEvent) => {
      const r = joyEl.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy), m = 48; if (d > m) { dx *= m / d; dy *= m / d; }
      this.joy = { x: dx / m, y: dy / m }; knob.style.transform = `translate(${dx}px,${dy}px)`;
    };
    joyEl.addEventListener("pointerdown", (e) => { jid = e.pointerId; joyEl.setPointerCapture(e.pointerId); mv(e); });
    joyEl.addEventListener("pointermove", (e) => { if (e.pointerId === jid) mv(e); });
    const end = (e: PointerEvent) => { if (e.pointerId !== jid) return; jid = null; this.joy = { x: 0, y: 0 }; knob.style.transform = ""; };
    joyEl.addEventListener("pointerup", end); joyEl.addEventListener("pointercancel", end);
  }

  act(a: string) {
    if (a === "attack") this.room.send("attack");
    else if (a === "absorb") this.room.send("absorb");
    else if (a.startsWith("skill")) this.room.send("skill", { i: Number(a.slice(5)) });
  }

  sendInput() {
    const k = this.keys;
    let x = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0) + this.joy.x;
    let y = (k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0) + this.joy.y;
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    const key = `${x.toFixed(2)},${y.toFixed(2)}`;
    if (key !== this.lastInput) { this.lastInput = key; this.room.send("input", { x: +x.toFixed(2), y: +y.toFixed(2) }); }
  }

  // ---------- Tin nhắn từ server ----------
  setupMessages() {
    this.room.onMessage("log", (m: { text: string; col?: string }) => hud.log(m.text, m.col));
    this.room.onMessage("chat", (m: { name: string; text: string }) => hud.log(m.text, m.name === "Hệ thống" ? "#86e0b0" : "#9db3a2", m.name));
    this.room.onMessage("dmg", (m: { x: number; y: number; v: number; crit?: boolean; c: string }) => {
      const t = this.add.text(m.x, m.y, String(Math.abs(m.v)), {
        fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: m.crit ? "10px" : "8px", fontStyle: "800",
        color: m.c, stroke: "#000", strokeThickness: 2, resolution: 8,
      }).setOrigin(0.5).setDepth(99999);
      this.tweens.add({ targets: t, y: m.y - 16, alpha: 0, delay: 350, duration: 550, onComplete: () => t.destroy() });
    });
    this.room.onMessage("fx", (m: any) => this.fx(m));
    // Danh sách võ hồn sở hữu: server chỉ gửi riêng cho mình. Xin lần đầu sau khi đã đăng ký nhận.
    this.room.onMessage("vohons", (m: OwnedVohons) => hud.renderRoster(m, (rowId) => this.room.send("pick", { rowId })));
    this.room.send("vohons");
  }

  ringFx(x: number, y: number, r0: number, r1: number, col: string, dur: number, delay = 0) {
    const g = this.add.graphics().setDepth(99980); const o = { k: 0 };
    this.tweens.add({ targets: o, k: 1, duration: dur, delay, onUpdate: () => {
      const r = r0 + (r1 - r0) * o.k; g.clear(); g.lineStyle(2, hex(col), 1 - o.k); g.strokeEllipse(x, y, r * 2, r * 1.2);
    }, onComplete: () => g.destroy() });
  }

  soulRingFx(id: string, tier: number, dur: number) {
    const v = this.players.get(id); if (!v) return;
    const g = this.add.graphics().setDepth(99981); const o = { k: 0 }, t = TIERS[tier];
    this.tweens.add({ targets: o, k: 1, duration: dur, onUpdate: () => {
      const x = v.spr.x, y = v.spr.y - o.k * 20; g.clear();
      g.lineStyle(3, hex(t.col), 1 - o.k * 0.8); g.strokeEllipse(x, y, 22, 8);
      g.lineStyle(1, hex(t.glow), 1 - o.k * 0.8); g.strokeEllipse(x, y, 24, 9);
    }, onComplete: () => g.destroy() });
  }

  fx(m: any) {
    if (m.k === "wave") { this.ringFx(m.x, m.y, 4, m.r, m.col, 400); if (m.shake) this.cameras.main.shake(300, 0.004); }
    else if (m.k === "slash") {
      const v = this.players.get(m.id); if (!v) return;
      const g = this.add.graphics().setDepth(99980), a = Math.atan2(m.dy, m.dx);
      g.lineStyle(2, hex(m.col), 1); g.beginPath(); g.arc(v.spr.x, v.spr.y - 6, 15, a - 1.1, a + 1.1); g.strokePath();
      this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
    } else if (m.k === "trail") {
      const g = this.add.graphics().setDepth(99980); g.lineStyle(4, hex(m.col), 1); g.lineBetween(m.x0, m.y0 - 6, m.x1, m.y1 - 6);
      this.tweens.add({ targets: g, alpha: 0, duration: 350, onComplete: () => g.destroy() });
    } else if (m.k === "burst") {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2, r = this.add.rectangle(m.x, m.y, 4, 4, hex(m.col)).setDepth(99980);
        this.tweens.add({ targets: r, x: m.x + Math.cos(a) * 110, y: m.y + Math.sin(a) * 110, duration: 650, onComplete: () => r.destroy() });
      }
    } else if (m.k === "soulring") this.soulRingFx(m.id, m.tier, 700);
    else if (m.k === "absorbed") {
      const v = this.players.get(m.id); if (!v) return; const t = TIERS[m.tier];
      for (let k = 0; k < 3; k++) this.ringFx(v.spr.x, v.spr.y - 6, 4 + k * 6, 60 + k * 20, t.glow, 700, k * 120);
      this.soulRingFx(m.id, m.tier, 1400);
      if (m.id === this.me) { this.cameras.main.shake(400, 0.006); hud.banner(`Hồn hoàn thứ ${this.room.state.players.get(this.me)?.rings.length ?? ""}`, t.age); }
    }
  }

  // ---------- Bản đồ nhỏ ----------
  buildMinimap(map: Phaser.Tilemaps.Tilemap) {
    const base = document.createElement("canvas"); base.width = map.width; base.height = map.height;
    const b = base.getContext("2d")!;
    const colorOf: Record<number, string> = { 1: "#5a9440", 2: "#467e38", 3: "#335f35", 4: "#27453a", 5: "#5a9440", 6: "#467e38", 7: "#a08a63", 8: "#7d6b55", 9: "#2d6a96", 10: "#d8b678" };
    const ground = map.getLayer("ground")!.data, trees = map.getLayer("trees")!.data;
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
      const t = trees[y][x].index, g = ground[y][x].index;
      b.fillStyle = t >= 17 ? ["#24612a", "#1d5024", "#163a22", "#1f2240"][t - 17] : t > 0 ? "#d8b678" : colorOf[g] ?? "#335f35";
      b.fillRect(x, y, 1, 1);
    }
    const mc = document.getElementById("mini") as HTMLCanvasElement; mc.width = map.width; mc.height = map.height;
    this.mini = { ctx: mc.getContext("2d")!, base };
  }

  drawMinimap() {
    const { ctx, base } = this.mini; const st = this.room.state;
    ctx.imageSmoothingEnabled = false; ctx.drawImage(base, 0, 0);
    st.drops.forEach((d: any) => { ctx.fillStyle = TIERS[d.tier].glow; ctx.fillRect((d.x / TILE) | 0, (d.y / TILE) | 0, 1, 1); });
    st.beasts.forEach((b: any) => { if (b.tier >= 3) { ctx.fillStyle = b.tier === 4 ? "#ff3b3b" : "#8a6bff"; ctx.fillRect((b.x / TILE) | 0, (b.y / TILE) | 0, 1, 1); } });
    st.players.forEach((p: any, id: string) => {
      if (id === this.me) return; ctx.fillStyle = "#7fd0ff"; ctx.fillRect(((p.x / TILE) | 0) - 1, ((p.y / TILE) | 0) - 1, 2, 2);
    });
    const me = st.players.get(this.me);
    if (me) { ctx.fillStyle = "#fff"; ctx.fillRect(((me.x / TILE) | 0) - 1, ((me.y / TILE) | 0) - 1, 3, 3); ctx.fillStyle = "#ff4040"; ctx.fillRect((me.x / TILE) | 0, (me.y / TILE) | 0, 1, 1); }
  }

  // ---------- Đồng bộ trạng thái mỗi khung hình ----------
  update(time: number, delta: number) {
    const dt = delta / 1000, st = this.room.state; if (!st?.players) return;
    this.sendInput();
    const lerp = Math.min(1, dt * 14);
    const step = Math.floor(time / 125) % 2;

    // người chơi
    const seenP = new Set<string>();
    st.players.forEach((p: any, id: string) => {
      seenP.add(id);
      let v = this.players.get(id);
      if (!v) {
        const spr = this.add.sprite(p.x, p.y, honsuTexture(this, p.vh, 0, p)).setOrigin(PLAYER_ORIGIN.x, PLAYER_ORIGIN.y);
        const label = this.add.text(p.x, p.y - 22, p.name, {
          fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "7px", fontStyle: "600",
          color: id === this.me ? "#ffe9a0" : "#ffffff", stroke: "#000", strokeThickness: 2, resolution: 8,
        }).setOrigin(0.5, 1).setDepth(99985);
        const title = this.add.text(p.x, p.y - 30, "", {
          fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "6px", fontStyle: "700",
          color: "#f2c84b", stroke: "#000", strokeThickness: 2, resolution: 8,
        }).setOrigin(0.5, 1).setDepth(99985);
        v = { spr, label, title }; this.players.set(id, v);
        if (id === this.me) this.cameras.main.startFollow(spr, true, 0.2, 0.2);
      }
      const { spr, label, title } = v;
      if (Math.hypot(p.x - spr.x, p.y - spr.y) > 64) spr.setPosition(p.x, p.y);
      else spr.setPosition(spr.x + (p.x - spr.x) * lerp, spr.y + (p.y - spr.y) * lerp);
      // Ngoại hình hồn sư (sex, hair, hairCol, outfitCol) đồng bộ từ server, ai cũng thấy.
      spr.setTexture(honsuTexture(this, p.vh, p.moving ? step : 0, p)).setFlipX(p.face < 0).setDepth(spr.y).setVisible(!p.dead);
      label.setPosition(spr.x, spr.y - 21).setVisible(!p.dead).setText(`${p.name} (${p.level})`);
      // Danh hiệu theo cấp võ hồn đang ra trận (mục 5.1).
      title.setPosition(spr.x, spr.y - 29).setVisible(!p.dead).setText(titleOf(p.level));
    });
    for (const [id, v] of this.players) if (!seenP.has(id)) { v.spr.destroy(); v.label.destroy(); v.title.destroy(); this.players.delete(id); }

    // hồn thú
    const seenB = new Set<string>();
    st.beasts.forEach((b: any, id: string) => {
      seenB.add(id);
      let s = this.beasts.get(id);
      if (!s) { s = this.add.sprite(b.x, b.y, `b${b.tier}_0`).setOrigin(BEAST_ORIGIN.x, BEAST_ORIGIN.y); this.beasts.set(id, s); }
      s.setPosition(s.x + (b.x - s.x) * lerp, s.y + (b.y - s.y) * lerp);
      s.setTexture(`b${b.tier}_${b.moving ? step : 0}${b.aggro ? "a" : ""}`).setFlipX(b.face < 0).setDepth(s.y);
    });
    for (const [id, s] of this.beasts) if (!seenB.has(id)) { s.destroy(); this.beasts.delete(id); }

    // hồn hoàn rơi
    const seenD = new Set<string>();
    st.drops.forEach((d: any, id: string) => {
      seenD.add(id);
      let img = this.drops.get(id);
      if (!img) { img = this.add.image(d.x, d.y - 4, `ring${d.tier}`).setDepth(d.y - 1); this.drops.set(id, img); }
      img.y = d.y - 4 - (0.5 + 0.5 * Math.sin(time / 250)) * 2;
      img.setAlpha(d.ttl < 8 ? (Math.floor(time / 160) % 2 ? 0.4 : 1) : 1);
    });
    for (const [id, img] of this.drops) if (!seenD.has(id)) { img.destroy(); this.drops.delete(id); }

    // vẽ phủ: thanh máu, vòng uy áp, hiệu ứng hấp thụ
    const g = this.ov; g.clear();
    st.beasts.forEach((b: any, id: string) => {
      const s = this.beasts.get(id)!, t = TIERS[b.tier];
      if (b.tier >= 1) { g.lineStyle(1, hex(t.glow), 0.4 + 0.2 * Math.sin(time / 300)); g.strokeEllipse(s.x, s.y, t.size + 6, 6); }
      if (b.hp < b.maxHp) {
        const w = Math.max(14, t.size + 4);
        g.fillStyle(0x000000, 0.6).fillRect(s.x - w / 2, s.y - t.size - 10, w, 2);
        g.fillStyle(b.tier === 0 ? 0xe0525a : hex(t.glow), 1).fillRect(s.x - w / 2, s.y - t.size - 10, w * Math.max(0, b.hp / b.maxHp), 2);
      }
    });
    st.players.forEach((p: any, id: string) => {
      if (p.absorb <= 0) return; const v = this.players.get(id)!, t = TIERS[p.absorbTier], k = p.absorb;
      g.lineStyle(3, hex(t.col), 0.9); g.strokeEllipse(v.spr.x, v.spr.y - 4 - k * 6, 24 - k * 6, 8);
      for (let i = 0; i < 3; i++) { const a = time / 330 + i * 2.1; g.fillStyle(hex(t.glow), 1).fillRect(v.spr.x + Math.cos(a) * (16 - k * 10) - 1, v.spr.y - 8 + Math.sin(a) * (8 - k * 5) - 1, 2, 2); }
    });

    // độ tối theo độ sâu của rừng
    const me = st.players.get(this.me);
    if (me) {
      this.vignette.setAlpha(Math.max(0, Math.min(1, (me.x / TILE - 18) / 60)) * 0.75);
      this.hudT -= dt;
      if (this.hudT <= 0) { this.hudT = 0.08; this.updateHud(me); }
    }
  }

  updateHud(me: any) {
    const st = this.room.state;
    const skKey = `${me.vh}|${me.rings.length}`;
    if (skKey !== this.skillsKey) { this.skillsKey = skKey; hud.buildSkills(me.vh, [...me.rings], (a) => this.act(a)); }
    hud.updateStats(me);
    const inCamp = me.x >= this.campRect.x && me.x <= this.campRect.x + this.campRect.w && me.y >= this.campRect.y && me.y <= this.campRect.y + this.campRect.h;
    const zone = this.zones.find((z) => me.x >= z.x0 && me.x < z.x1);
    const zname = inCamp || !zone ? "Doanh trại" : zone.name;
    document.getElementById("zoneName")!.textContent = zname;
    if (zname !== this.lastZone) { if (this.lastZone && zone && !inCamp) hud.banner(zone.name, zone.hint); this.lastZone = zname; }
    document.getElementById("online")!.textContent = `${st.players.size} người đang săn hồn`;

    let tb: any = null, td = 90;
    st.beasts.forEach((b: any) => { const d = Math.hypot(b.x - me.x, b.y - me.y); if (d < td) { td = d; tb = b; } });
    hud.showTarget(tb ? `<span class="dot" style="color:${hud.ringColor(tb.tier)}"></span>${BEASTS[tb.species]?.name ?? "Hồn thú"} (${TIERS[tb.tier].age}) – ${tb.hp}/${tb.maxHp}` : null);

    let dr: any = null, dd = 22;
    st.drops.forEach((d: any) => { const k = Math.hypot(d.x - me.x, d.y - me.y); if (k < dd) { dd = k; dr = d; } });
    if (dr && me.absorb <= 0) {
      const t = TIERS[dr.tier], slot = me.rings.length + 1, over = dr.tier - ringLimit(slot);
      let msg = "nhấn E để hấp thụ";
      if (dr.owner && dr.owner !== this.me && dr.ownerTtl > 0) msg = `<em>của người khác, còn ${Math.ceil(dr.ownerTtl)} giây</em>`;
      else if (me.level < slot * 10) msg = `<em>cần cấp ${slot * 10} mới hấp thụ được</em>`;
      else if (over >= 2) msg = "<em>quá mạnh, không thể hấp thụ</em>";
      else if (over === 1) msg = "nhấn E để hấp thụ <em>(vượt giới hạn, 60% thất bại)</em>";
      hud.showPrompt(`<span class="dot" style="color:${hud.ringColor(dr.tier)}"></span>Hồn hoàn ${t.age}: ${msg}`);
    } else hud.showPrompt(null);
    this.drawMinimap();
  }
}
