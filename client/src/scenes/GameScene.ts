import Phaser from "phaser";
import type { Room } from "colyseus.js";
import { TIERS, BEASTS, VOHON, MAPS, ringLimit, TILE, titleOf, DIRS4, TEAM_SIZE, RESPAWN_SECS, vohonIndex, TIEN_CO, type He } from "../../../shared/data.ts";
import { makeTextures, looksTextures, vohonTextures, sexKey, BEAST_ORIGIN } from "../textures.ts";
import { preloadSprites, createSheetAnims, honsuAnimKey, syncLayers, HS_ANIMS, HS_ORIGIN, VH_ORIGIN, type HsAnim } from "../sprites.ts";
import * as hud from "../hud.ts";
import type { OwnedVohons, Squad, PortalInfo } from "../net.ts";

const hex = (c: string) => parseInt(c.slice(1), 16);
type Sprite = Phaser.GameObjects.Sprite;
/** Hồn sư ghép lớp (mục 5.11). Thứ tự con của `root` là thứ tự vẽ: bóng, vòng sau, phụ thể sau, thân, áo, tóc, phụ thể trước, vòng trước. */
interface PView {
  root: Phaser.GameObjects.Container;
  body: Sprite; outfit: Sprite; hair: Sprite; vb: Sprite; vf: Sprite;
  ringsB: Phaser.GameObjects.Container; ringsF: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text; title: Phaser.GameObjects.Text;
  looks: string; vh: number; rings: string; playing: string;
  act: { anim: HsAnim; t0: number } | null; // animation chạy một lần: attack, cast, hurt
  hurtT: number;                            // lúc bị đánh gần nhất, để nháy trắng
  lit: { i: number; t0: number } | null;    // vòng hồn hoàn đang sáng khi tung hồn kỹ
}
/** Tổng thời gian một animation hồn sư (ms). */
const animMs = (a: HsAnim) => HS_ANIMS[a].ms.reduce((x, y) => x + y, 0);
/** Vòng thứ i sáng và phình ra trong 300 ms khi tung hồn kỹ của vòng đó (mục 5.11). */
const RING_LIT_MS = 300;
interface Rect { x: number; y: number; w: number; h: number; }
interface Zone extends Rect { name: string; hint: string; }
const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';

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
  safes: Zone[] = [];   // vùng an toàn (object `safe`)
  campRect = { x: 0, y: 0, w: 0, h: 0 };
  campName = "";
  portals: (Rect & { to: string })[] = [];
  vignetteOn = false;   // thuộc tính `vignette` của bản đồ: tối dần theo độ sâu của rừng
  portal: PortalInfo | null = null;
  onTravel: (mapId: string) => void = () => {};
  /** Gỡ mọi bộ nghe gắn vào window/DOM khi scene bị hủy (đổi bản đồ thì tạo scene mới). */
  ac = new AbortController();
  keys: Record<string, boolean> = {};
  joy = { x: 0, y: 0 };
  lastInput = "";
  lastZone = "";
  skillsKey = "";
  hudT = 0;
  mini!: { ctx: CanvasRenderingContext2D; base: HTMLCanvasElement };
  mapW = 0; mapH = 0;
  owned: OwnedVohons | null = null; // tin riêng "vohons" gần nhất (tên võ hồn theo ô khi báo đủ năng lượng tiên cơ)

  constructor() { super("game"); }
  init(data: { room: Room<any>; mapId: string; onTravel: (mapId: string) => void }) {
    this.room = data.room; this.mapId = data.mapId; this.me = data.room.sessionId; this.onTravel = data.onTravel;
    const off = () => { this.ac.abort(); hud.showPortal(null, () => {}); };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.events.once(Phaser.Scenes.Events.DESTROY, off);
  }

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
    this.vignetteOn = !!(map.properties as any[] | undefined)?.find?.((p) => p.name === "vignette")?.value;
    for (const o of map.getObjectLayer("zones")?.objects ?? []) {
      const prop = (n: string) => (o.properties as any[] | undefined)?.find((p) => p.name === n)?.value;
      const r = { x: o.x!, y: o.y!, w: o.width!, h: o.height! };
      if (o.type === "zone") this.zones.push({ ...r, name: o.name, hint: prop("hint") ?? "" });
      if (o.type === "spawn") { this.campRect = r; this.campName = o.name; }
      if (o.type === "safe") this.safes.push({ ...r, name: o.name, hint: "Vùng an toàn: không có hồn thú, không giao chiến" });
      if (o.type === "portal" && MAPS[prop("to")]) this.portals.push({ ...r, to: prop("to") });
      if (o.type === "npc") this.drawNpc(o.x!, o.y!, o.name);
    }
    this.drawPortals();
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

  /** Cổng: khung sáng nhấp nháy và tên bản đồ đích (server mới quyết định có cho đi hay không). */
  drawPortals() {
    for (const r of this.portals) {
      const g = this.add.graphics().setDepth(r.y + r.h);
      g.fillStyle(0x86e0b0, 0.22).fillRect(r.x, r.y, r.w, r.h);
      g.lineStyle(1, 0xc8ffe0, 0.9).strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      this.tweens.add({ targets: g, alpha: 0.45, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.add.text(r.x + r.w / 2, r.y - 2, `➜ ${MAPS[r.to].name}`, {
        fontFamily: FONT, fontSize: "7px", fontStyle: "700", color: "#c8ffe0", stroke: "#000", strokeThickness: 2, resolution: 8,
      }).setOrigin(0.5, 1).setDepth(99984);
    }
  }

  /** NPC (object `npc`): đến bước 6.1 chỉ là biển tên đứng yên. */
  drawNpc(x: number, y: number, name: string) {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x000000, 0.35).fillEllipse(x, y + 1, 10, 4);
    g.fillStyle(0xf2c84b, 1).fillTriangle(x - 3, y - 10, x + 3, y - 10, x, y - 4);
    g.fillStyle(0xfff2b0, 1).fillCircle(x, y - 12, 2.5);
    this.add.text(x, y - 16, name, {
      fontFamily: FONT, fontSize: "6.5px", fontStyle: "700", color: "#f2c84b", stroke: "#000", strokeThickness: 2, resolution: 8,
    }).setOrigin(0.5, 1).setDepth(99984);
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
    const on = { signal: this.ac.signal };
    addEventListener("keydown", (e) => {
      if (typing()) {
        if (e.key === "Enter") { const t = chat.value.trim(); if (t) this.room.send("chat", { text: t }); chat.value = ""; chat.blur(); }
        if (e.key === "Escape") chat.blur();
        return;
      }
      if (e.key === "Enter") { chat.focus(); e.preventDefault(); return; }
      if (e.code === "KeyV" && !e.repeat) { hud.toggleRoster(); return; }
      if (e.code === "Escape") { hud.toggleRoster(false); return; }
      if (e.code === "KeyF" && !e.repeat) { this.goPortal(); return; }
      this.keys[e.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.repeat && e.code !== "KeyJ" && e.code !== "Space") return;
      // Phím số 1–4: đổi sang võ hồn ở ô tương ứng của đội; hồn kỹ dùng U, I, O, P (hud.SKILL_KEYS).
      const sk = hud.SKILL_KEYS.findIndex((k) => e.code === "Key" + k);
      const slot = /^Digit\d$/.test(e.code) ? Number(e.code.slice(5)) - 1 : -1;
      if (e.code === "KeyJ" || e.code === "Space") this.act("attack");
      else if (e.code === "KeyE") this.act("absorb");
      else if (sk >= 0) this.act("skill" + sk);
      else if (slot >= 0 && slot < TEAM_SIZE) this.act("switch" + slot);
    }, on);
    addEventListener("keyup", (e) => { this.keys[e.code] = false; }, on);
    addEventListener("blur", () => { this.keys = {}; }, on);
    chat.addEventListener("focus", () => { this.keys = {}; }, on);
    document.getElementById("vhBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); hud.toggleRoster(); }, on);

    const joyEl = document.getElementById("joy")!, knob = document.getElementById("knob")!;
    let jid: number | null = null;
    const mv = (e: PointerEvent) => {
      const r = joyEl.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy), m = 48; if (d > m) { dx *= m / d; dy *= m / d; }
      this.joy = { x: dx / m, y: dy / m }; knob.style.transform = `translate(${dx}px,${dy}px)`;
    };
    joyEl.addEventListener("pointerdown", (e) => { jid = e.pointerId; joyEl.setPointerCapture(e.pointerId); mv(e); }, on);
    joyEl.addEventListener("pointermove", (e) => { if (e.pointerId === jid) mv(e); }, on);
    const end = (e: PointerEvent) => { if (e.pointerId !== jid) return; jid = null; this.joy = { x: 0, y: 0 }; knob.style.transform = ""; };
    joyEl.addEventListener("pointerup", end, on); joyEl.addEventListener("pointercancel", end, on);
  }

  /** Xin đi qua cổng đang đứng: chỉ gửi tên cổng, server kiểm tra vị trí và chọn bản đồ đích. */
  goPortal() { if (this.portal?.name) this.room.send("travel", { portal: this.portal.name }); }

  act(a: string) {
    if (a === "attack") this.room.send("attack");
    else if (a === "absorb") this.room.send("absorb");
    else if (a.startsWith("skill")) this.room.send("skill", { i: Number(a.slice(5)) });
    else if (a.startsWith("switch")) this.room.send("switch", { slot: Number(a.slice(6)) });
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
    this.room.onMessage("dmg", (m: { x: number; y: number; v: number; crit?: boolean; c: string; id?: string }) => {
      if (m.id) { const v = this.players.get(m.id); if (v) { v.hurtT = this.time.now; this.playAct(m.id, "hurt"); } }
      const t = this.add.text(m.x, m.y, String(Math.abs(m.v)), {
        fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: m.crit ? "10px" : "8px", fontStyle: "800",
        color: m.c, stroke: "#000", strokeThickness: 2, resolution: 8,
      }).setOrigin(0.5).setDepth(99999);
      this.tweens.add({ targets: t, y: m.y - 16, alpha: 0, delay: 350, duration: 550, onComplete: () => t.destroy() });
    });
    this.room.onMessage("fx", (m: any) => this.fx(m));
    // Cổng: server báo riêng khi bước vào / ra khỏi cổng, và khi đã lưu xong thì cho chuyển bản đồ (mục 6).
    this.room.onMessage("portal", (m: PortalInfo) => { this.portal = m?.name ? m : null; hud.showPortal(this.portal, () => this.goPortal()); });
    this.room.onMessage("travel", (m: { mapId: string }) => { if (typeof m?.mapId === "string") this.onTravel(m.mapId); });
    // Võ hồn sở hữu và đội hình: server chỉ gửi riêng cho mình. Xin lần đầu sau khi đã đăng ký nhận.
    this.room.onMessage("vohons", (m: OwnedVohons) => {
      this.owned = m;
      hud.renderRoster(m, (slots) => this.room.send("team", { slots }));
      hud.buildTeam(m, (slot) => this.act("switch" + slot));
    });
    // Sinh lực từng võ hồn trong đội và võ hồn đã gục (luật gục từng võ hồn, bước 2.3b): cũng chỉ gửi riêng cho mình.
    // Năng lượng tiên cơ cũng đi trong tin này: võ hồn nào vừa đầy thì báo một lần.
    this.room.onMessage("squad", (m: Squad) => {
      for (const r of hud.setSquad(m)) {
        const slot = this.owned?.team.indexOf(r) ?? -1, v = this.owned?.list.find((o) => o.rowId === r);
        if (!v || slot < 0 || r === this.owned?.active) continue;
        const def = VOHON[Math.max(0, vohonIndex(v.vohon))];
        hud.log(`${def.name} đủ năng lượng tiên cơ: nhấn ${slot + 1} để đổi vào và tung ${TIEN_CO[def.he].name}.`, "#e9c45a");
      }
    });
    this.room.onMessage("ko", (m: { fallen: string; next: string | null }) => {
      const name = (id: string) => VOHON[Math.max(0, vohonIndex(id))].name;
      if (m.next) hud.banner(`${name(m.fallen)} đã gục`, `${name(m.next)} tự động ra trận`);
      else hud.banner("Cả đội đã gục", `Về doanh trại sau ${String(RESPAWN_SECS).replace(".", ",")} giây, không mất kinh nghiệm hay đồ`);
    });
    this.room.send("vohons");
  }

  ringFx(x: number, y: number, r0: number, r1: number, col: string, dur: number, delay = 0) {
    const g = this.add.graphics().setDepth(99980); const o = { k: 0 };
    this.tweens.add({ targets: o, k: 1, duration: dur, delay, onUpdate: () => {
      const r = r0 + (r1 - r0) * o.k; g.clear(); g.lineStyle(2, hex(col), 1 - o.k); g.strokeEllipse(x, y, r * 2, r * 1.2);
    }, onComplete: () => g.destroy() });
  }

  /** Animation chạy một lần của lớp thân (attack, cast, hurt); các lớp khác tự theo khung thân. */
  playAct(id: string, anim: HsAnim) {
    const v = this.players.get(id); if (v) v.act = { anim, t0: this.time.now };
  }

  soulRingFx(id: string, tier: number, dur: number) {
    const v = this.players.get(id); if (!v) return;
    const g = this.add.graphics().setDepth(99981); const o = { k: 0 }, t = TIERS[tier];
    this.tweens.add({ targets: o, k: 1, duration: dur, onUpdate: () => {
      const x = v.root.x, y = v.root.y - o.k * 20; g.clear();
      g.lineStyle(3, hex(t.col), 1 - o.k * 0.8); g.strokeEllipse(x, y, 22, 8);
      g.lineStyle(1, hex(t.glow), 1 - o.k * 0.8); g.strokeEllipse(x, y, 24, 9);
    }, onComplete: () => g.destroy() });
  }

  fx(m: any) {
    if (m.k === "wave") { this.ringFx(m.x, m.y, 4, m.r, m.col, 400); if (m.shake) this.cameras.main.shake(300, 0.004); }
    else if (m.k === "slash") {
      const v = this.players.get(m.id); if (!v) return;
      this.playAct(m.id, "attack");
      const g = this.add.graphics().setDepth(99980), a = Math.atan2(m.dy, m.dx);
      g.lineStyle(2, hex(m.col), 1); g.beginPath(); g.arc(v.root.x, v.root.y - 6, 15, a - 1.1, a + 1.1); g.strokePath();
      this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
    } else if (m.k === "trail") {
      const g = this.add.graphics().setDepth(99980); g.lineStyle(4, hex(m.col), 1); g.lineBetween(m.x0, m.y0 - 6, m.x1, m.y1 - 6);
      this.tweens.add({ targets: g, alpha: 0, duration: 350, onComplete: () => g.destroy() });
    } else if (m.k === "burst") {
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2, r = this.add.rectangle(m.x, m.y, 4, 4, hex(m.col)).setDepth(99980);
        this.tweens.add({ targets: r, x: m.x + Math.cos(a) * 110, y: m.y + Math.sin(a) * 110, duration: 650, onComplete: () => r.destroy() });
      }
    } else if (m.k === "soulring") {
      this.playAct(m.id, "cast");
      const v = this.players.get(m.id); if (v && Number.isInteger(m.i)) v.lit = { i: m.i, t0: this.time.now };
      this.soulRingFx(m.id, m.tier, 700);
    }
    else if (m.k === "tienco") this.tienCoFx(m);
    else if (m.k === "absorbed") {
      const v = this.players.get(m.id); if (!v) return; const t = TIERS[m.tier];
      for (let k = 0; k < 3; k++) this.ringFx(v.root.x, v.root.y - 6, 4 + k * 6, 60 + k * 20, t.glow, 700, k * 120);
      this.soulRingFx(m.id, m.tier, 1400);
      if (m.id === this.me) { this.cameras.main.shake(400, 0.006); hud.banner(`Hồn hoàn thứ ${this.room.state.players.get(this.me)?.rings.length ?? ""}`, t.age); }
    }
  }

  /** Chiêu tiên cơ (bước 2.4): hiệu ứng chung theo hệ và chữ "Tiên cơ" bay lên trên đầu hồn sư. */
  tienCoFx(m: { id: string; he: He; col: string; x: number; y: number; r?: number; x0?: number; y0?: number }) {
    const c = hex(m.col), gold = 0xffe08a;
    this.playAct(m.id, "cast");
    if (m.he === "cuong_cong") {
      // Nổ diện rộng: hai vòng sóng, chớp sáng, rung màn hình.
      this.ringFx(m.x, m.y - 4, 6, m.r ?? 56, m.col, 450); this.ringFx(m.x, m.y - 4, 4, (m.r ?? 56) * 0.7, "#ffe08a", 380, 80);
      const f = this.add.circle(m.x, m.y - 6, m.r ?? 56, c, 0.35).setDepth(99979).setScale(1, 0.6);
      this.tweens.add({ targets: f, alpha: 0, duration: 320, onComplete: () => f.destroy() });
      this.cameras.main.shake(260, 0.006);
    } else if (m.he === "man_cong") {
      // Lướt: vệt dài từ chỗ cũ, rồi dấu chém chữ X ở chỗ dừng.
      const g = this.add.graphics().setDepth(99980);
      g.lineStyle(6, c, 0.45).lineBetween(m.x0 ?? m.x, (m.y0 ?? m.y) - 6, m.x, m.y - 6);
      g.lineStyle(2, gold, 1).lineBetween(m.x0 ?? m.x, (m.y0 ?? m.y) - 6, m.x, m.y - 6);
      for (const a of [0.8, -0.8]) g.lineStyle(3, gold, 1).lineBetween(m.x - 14 * Math.cos(a), m.y - 6 - 14 * Math.sin(a), m.x + 14 * Math.cos(a), m.y - 6 + 14 * Math.sin(a));
      this.tweens.add({ targets: g, alpha: 0, duration: 420, delay: 80, onComplete: () => g.destroy() });
      this.cameras.main.shake(140, 0.004);
    } else if (m.he === "khong_che") {
      // Phong tỏa: vòng thu hẹp lại và các mắt xích quay quanh.
      const r = m.r ?? 64;
      this.ringFx(m.x, m.y - 4, r, 6, m.col, 500);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2, q = this.add.rectangle(m.x + Math.cos(a) * r, m.y - 4 + Math.sin(a) * r * 0.6, 4, 4, c).setDepth(99980);
        this.tweens.add({ targets: q, x: m.x + Math.cos(a + 1) * 10, y: m.y - 4 + Math.sin(a + 1) * 6, alpha: 0.2, duration: 500, onComplete: () => q.destroy() });
      }
    } else {
      // Hộ thể: vòng xanh lá hồi phục và hạt sáng bay lên.
      this.ringFx(m.x, m.y - 4, 4, 30, "#86e0b0", 500);
      for (let k = 0; k < 10; k++) {
        const q = this.add.rectangle(m.x + (k - 4.5) * 3, m.y - 2, 2, 2, k % 2 ? 0x86e0b0 : gold).setDepth(99980);
        this.tweens.add({ targets: q, y: m.y - 30 - (k % 3) * 6, alpha: 0, duration: 650, delay: k * 30, onComplete: () => q.destroy() });
      }
    }
    // Trên danh hiệu (y - 38) để không đè tên hồn sư.
    const t = this.add.text(m.x, m.y - 56, `Tiên cơ · ${TIEN_CO[m.he]?.name ?? ""}`, {
      fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "8px", fontStyle: "800",
      color: "#ffe08a", stroke: "#000", strokeThickness: 2, resolution: 8,
    }).setOrigin(0.5).setDepth(99999);
    this.tweens.add({ targets: t, y: m.y - 70, alpha: 0, delay: 500, duration: 600, onComplete: () => t.destroy() });
  }

  /** Trạng thái từ tiên cơ: vòng khiên quanh hồn sư có khiên, sao quay trên đầu hồn thú bị choáng. */
  drawStatus(g: Phaser.GameObjects.Graphics, st: any, time: number) {
    st.players.forEach((p: any, id: string) => {
      const v = this.players.get(id); if (!v || p.shield <= 0 || p.dead) return;
      g.lineStyle(1, 0x9ad8ff, 0.55 + 0.25 * Math.sin(time / 200)); g.strokeEllipse(v.root.x, v.root.y - 12, 26, 30);
    });
    st.beasts.forEach((b: any, id: string) => {
      const s = this.beasts.get(id); if (!s || !b.stun) return;
      const y = s.y - TIERS[b.tier].size - 14;
      g.lineStyle(1, 0xffe08a, 0.7); g.strokeEllipse(s.x, y, 16, 5);
      for (let k = 0; k < 3; k++) {
        const a = time / 180 + k * 2.1, x = s.x + Math.cos(a) * 8, sy = y + Math.sin(a) * 2.5;
        g.fillStyle(0x1a1020, 1).fillRect(x - 2, sy - 2, 4, 4); g.fillStyle(0xffe08a, 1).fillRect(x - 1, sy - 1, 2, 2);
      }
    });
  }

  // ---------- Bản đồ nhỏ ----------
  buildMinimap(map: Phaser.Tilemaps.Tilemap) {
    const base = document.createElement("canvas"); base.width = map.width; base.height = map.height;
    const b = base.getContext("2d")!;
    const colorOf: Record<number, string> = { 1: "#5a9440", 2: "#467e38", 3: "#335f35", 4: "#27453a", 5: "#5a9440", 6: "#467e38", 7: "#a08a63", 8: "#7d6b55", 9: "#2d6a96", 10: "#d8b678",
      13: "#a39f94", 14: "#8f3b2e", 15: "#d8c8a2", 16: "#c9b84a" };
    const ground = map.getLayer("ground")!.data, trees = map.getLayer("trees")!.data;
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
      const t = trees[y][x].index, g = ground[y][x].index;
      b.fillStyle = t >= 17 ? ["#24612a", "#1d5024", "#163a22", "#1f2240"][t - 17] : t > 0 ? colorOf[t] ?? "#d8b678" : colorOf[g] ?? "#335f35";
      b.fillRect(x, y, 1, 1);
    }
    b.fillStyle = "#86e0b0";
    for (const r of this.portals) b.fillRect(Math.floor(r.x / TILE), Math.floor(r.y / TILE), Math.max(1, Math.round(r.w / TILE)), Math.max(1, Math.round(r.h / TILE)));
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
        const layer = (o: { x: number; y: number }) => this.make.sprite({ key: "hs_body_m" }, false).setOrigin(o.x, o.y);
        const vb = layer(VH_ORIGIN), body = layer(HS_ORIGIN), outfit = layer(HS_ORIGIN), hair = layer(HS_ORIGIN), vf = layer(VH_ORIGIN);
        const ringsB = this.make.container({}, false), ringsF = this.make.container({}, false);
        const root = this.add.container(p.x, p.y, [this.make.image({ key: "hs_shadow" }, false), ringsB, vb, body, outfit, hair, vf, ringsF]);
        const label = this.add.text(p.x, p.y - 30, p.name, {
          fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "7px", fontStyle: "600",
          color: id === this.me ? "#ffe9a0" : "#ffffff", stroke: "#000", strokeThickness: 2, resolution: 8,
        }).setOrigin(0.5, 1).setDepth(99985);
        const title = this.add.text(p.x, p.y - 38, "", {
          fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "6px", fontStyle: "700",
          color: "#f2c84b", stroke: "#000", strokeThickness: 2, resolution: 8,
        }).setOrigin(0.5, 1).setDepth(99985);
        v = { root, body, outfit, hair, vb, vf, ringsB, ringsF, label, title, looks: "", vh: -1, rings: "", playing: "", act: null, hurtT: -1e9, lit: null };
        this.players.set(id, v);
        if (id === this.me) this.cameras.main.startFollow(root, true, 0.2, 0.2);
      }
      const { root, label, title } = v;
      if (Math.hypot(p.x - root.x, p.y - root.y) > 64) root.setPosition(p.x, p.y);
      else root.setPosition(root.x + (p.x - root.x) * lerp, root.y + (p.y - root.y) * lerp);
      root.setDepth(root.y);
      // Ngoại hình hồn sư (sex, hair, hairCol, outfitCol) và võ hồn ra trận đồng bộ từ server, ai cũng thấy.
      const looks = `${p.sex}|${p.hair}|${p.hairCol}|${p.outfitCol}`;
      if (looks !== v.looks) { v.looks = looks; v.playing = ""; const t = looksTextures(this, p); v.outfit.setTexture(t.outfit); v.hair.setTexture(t.hair); }
      if (p.vh !== v.vh) { v.vh = p.vh; const [kb, kf] = vohonTextures(this, p.vh); v.vb.setTexture(kb); v.vf.setTexture(kf); }
      const rings = [...p.rings].join(",");
      if (rings !== v.rings) { v.rings = rings; this.buildRings(v, [...p.rings]); }
      this.animatePlayer(v, p, time);
      label.setPosition(root.x, root.y - 30).setVisible(!p.dead).setText(`${p.name} (${p.level})`);
      // Danh hiệu theo cấp võ hồn đang ra trận (mục 5.1).
      title.setPosition(root.x, root.y - 38).setVisible(!p.dead).setText(titleOf(p.level));
    });
    for (const [id, v] of this.players) if (!seenP.has(id)) { v.root.destroy(); v.label.destroy(); v.title.destroy(); this.players.delete(id); }

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
      if (p.absorb <= 0) return; const v = this.players.get(id)!, t = TIERS[p.absorbTier], k = p.absorb, { x, y } = v.root;
      g.lineStyle(3, hex(t.col), 0.9); g.strokeEllipse(x, y - 4 - k * 6, 24 - k * 6, 8);
      for (let i = 0; i < 3; i++) { const a = time / 330 + i * 2.1; g.fillStyle(hex(t.glow), 1).fillRect(x + Math.cos(a) * (16 - k * 10) - 1, y - 8 + Math.sin(a) * (8 - k * 5) - 1, 2, 2); }
    });

    this.drawStatus(g, st, time);

    // độ tối theo độ sâu của rừng
    const me = st.players.get(this.me);
    if (me) {
      this.vignette.setAlpha(this.vignetteOn ? Math.max(0, Math.min(1, (me.x / TILE - 18) / 60)) * 0.75 : 0);
      this.hudT -= dt;
      if (this.hudT <= 0) { this.hudT = 0.08; this.updateHud(me); }
    }
  }

  /** Một cặp ảnh cho mỗi hồn hoàn của võ hồn ra trận: cung trên (sau thân) và cung dưới (trước thân). */
  buildRings(v: PView, tiers: number[]) {
    v.ringsB.removeAll(true); v.ringsF.removeAll(true);
    for (const t of tiers) {
      v.ringsB.add(this.make.image({ key: `halo${t}`, frame: 0 }, false));
      v.ringsF.add(this.make.image({ key: `halo${t}`, frame: 1 }, false));
    }
  }

  /**
   * Chọn animation lớp thân theo state (gục > hấp thụ > đánh / tung hồn kỹ / bị đánh > đi / đứng) và hướng nhìn 4 phía,
   * rồi đặt khung tương ứng cho áo, tóc, phụ thể (bảng ánh xạ 5.11) và vị trí các vòng hồn hoàn.
   */
  animatePlayer(v: PView, p: any, time: number) {
    if (v.act && time >= v.act.t0 + animMs(v.act.anim)) v.act = null;
    const anim: HsAnim = p.dead ? "die" : p.absorb > 0 ? "absorb" : v.act?.anim ?? (p.moving ? "walk" : "idle");
    const { key, flip } = honsuAnimKey(`hs_body_${sexKey(p.sex)}`, anim, DIRS4[p.dir] ?? "down");
    const tag = `${key}|${v.act?.anim === anim ? v.act.t0 : ""}`; // đánh liên tiếp thì phát lại từ đầu
    if (tag !== v.playing) { v.playing = tag; v.body.play(key); }
    v.body.setFlipX(flip);
    syncLayers(v.body, [v.outfit, v.hair], [v.vb, v.vf]);
    // Bị đánh: nháy trắng 2 lần.
    const e = time - v.hurtT, white = e < 70 || (e >= 140 && e < 210);
    for (const s of [v.body, v.outfit, v.hair, v.vb, v.vf]) if (white) s.setTintFill(0xffffff); else s.clearTint();
    // Vòng hồn hoàn: vòng 1 sát chân, mỗi vòng sau cao hơn 2 pixel, nhấp nhô chậm lệch pha; ẩn khi gục.
    v.ringsB.setVisible(!p.dead); v.ringsF.setVisible(!p.dead);
    const lit = v.lit && time < v.lit.t0 + RING_LIT_MS ? v.lit.i : -1;
    for (let k = 0; k < v.ringsB.length; k++) {
      const y = -2 * k + Math.round(Math.sin(time / 700 + k * 1.1) * 0.6), tex = k === lit ? `halo${p.rings[k]}_lit` : `halo${p.rings[k]}`;
      (v.ringsB.list[k] as Phaser.GameObjects.Image).setTexture(tex, 0).setY(y);
      (v.ringsF.list[k] as Phaser.GameObjects.Image).setTexture(tex, 1).setY(y);
    }
  }

  updateHud(me: any) {
    const st = this.room.state;
    const skKey = `${me.vh}|${me.rings.length}`;
    if (skKey !== this.skillsKey) { this.skillsKey = skKey; hud.buildSkills(me.vh, [...me.rings], (a) => this.act(a)); }
    hud.updateStats(me);
    hud.updateTeam(me);
    // Tên vùng: vùng an toàn > vùng săn > điểm hồi sinh > tên bản đồ. Vừa vào bản đồ thì hiện tên bản đồ.
    const area = this.safes.find((z) => inRect(z, me.x, me.y)) ?? this.zones.find((z) => inRect(z, me.x, me.y));
    const mapName = MAPS[this.mapId]?.name ?? this.mapId;
    const zname = area?.name ?? (this.campName && inRect(this.campRect, me.x, me.y) ? this.campName : mapName);
    document.getElementById("zoneName")!.textContent = zname;
    if (zname !== this.lastZone) {
      if (!this.lastZone) hud.banner(mapName, area && area.name !== mapName ? area.name : "");
      else if (area) hud.banner(area.name, area.hint);
      this.lastZone = zname;
    }
    document.getElementById("online")!.textContent = `${st.players.size} người ở ${mapName}`;

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
