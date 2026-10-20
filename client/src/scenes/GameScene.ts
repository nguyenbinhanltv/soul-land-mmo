import Phaser from "phaser";
import type { Room } from "colyseus.js";
import { TIERS, BEASTS, VOHON, MAPS, TILE, titleOf, DIRS4, TEAM_SIZE, RESPAWN_SECS, vohonIndex, TIEN_CO, type He,
  ringSkill, DEFAULT_LOADOUT, CHAN_THAN_SCALE, tienCoOf, STATUS, statusBit, BUFFS, BUFF_IDS, buffBit, phoenixFieldR, PHONG_LOI,
  tierOfYears, formatYears, PICKUP_RANGE, absorbChance, absorbSecs, atBottleneck, MAX_RINGS, beastLevel, xpLevelScale, parseLevelRange,
  itemDef, PLAYER_STATUS, type Tele, BOSSES, ELITE, beastBase, beastName, BEAST_BUFFS, beastBuffBit,
  BONE_ITEM, BONE_SLOTS, boneName, parseBone, boneSkillOf, BONE_ACTIVE_SLOTS, CORE_ITEM, CORE_SETS, coreName, coreStatText, type CoreSubUp, KING,
  WORLD, HE, HE_IDS,
  npcDef, NPC_RANGE, type NpcDef, questChain, questRewardText, RESONANCE, resonanceText } from "../../../shared/data.ts";
import { makeTextures, looksTextures, vohonTextures, bodyKey, BEAST_ORIGIN } from "../textures.ts";
import { preloadSprites, createSheetAnims, honsuAnimKey, syncLayers, syncBeastSprite, HS_ANIMS, HS_ORIGIN, VH_ORIGIN, type HsAnim } from "../sprites.ts";
import * as hud from "../hud.ts";
import { Predictor, PREDICT, LAG_MS } from "../predict.ts";
import { solidGrid, clampDir } from "../../../shared/move.ts";
import type { OwnedVohons, Squad, PortalInfo, BagMsg, PartyView, QuestMsg, ResonanceMsg, ChannelsMsg } from "../net.ts";

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
  fly: { t0: number; ms: number } | null;   // đang bay (Tà Hỏa Phượng Hoàng, 2.5b): chỉ là hiệu ứng, nhấc hình lên khỏi bóng
}
/** Tổng thời gian một animation hồn sư (ms). */
const animMs = (a: HsAnim) => HS_ANIMS[a].ms.reduce((x, y) => x + y, 0);
/** Vòng thứ i sáng và phình ra trong 300 ms khi tung hồn kỹ của vòng đó (mục 5.11). */
const RING_LIT_MS = 300;
interface Rect { x: number; y: number; w: number; h: number; }
interface Zone extends Rect { name: string; hint: string; }
const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';
/** Mép trên hồn thú (toạ độ y) để đặt thanh máu, sao choáng: sheet ảnh thật `beast_{loài}` (M4) lấy theo khung, sprite vẽ bằng code theo bậc
 *  (tinh anh phóng ELITE.scale, BĐ4; thú vương KING.scale, BĐ5). */
const beastTop = (s: Phaser.GameObjects.Sprite, tier: number) =>
  s.texture.key.startsWith("beast_") ? s.y - s.displayHeight * s.originY : s.y - (TIERS[tier].size + 8) * (s.getData("bscale") ?? 1);
/** Hệ số phóng sprite theo bậc hồn thú: tinh anh ELITE.scale (BĐ4), thú vương KING.scale (khoảng 96×96, BĐ5), boss thế giới WORLD.scale (BĐ6e). */
const rankScale = (rank: number) => (rank === 3 ? WORLD.scale : rank === 2 ? KING.scale : rank === 1 ? ELITE.scale : 1);
/** Màu vùng cảnh báo chiêu báo trước của hồn thú (3.5). */
const TELE_COL = 0xff3b3b;
/** Biểu tượng trạng thái trên đầu hồn thú / hồn sư (thứ tự hiển thị); Choáng, Trói, Mê hoặc vẽ riêng. */
const STATUS_ICONS = ["burn", "shock", "poison", "vuln", "armor", "silence", "allure", "lock", "slow"] as const;

export class GameScene extends Phaser.Scene {
  room!: Room<any>;
  mapId = "";
  me = "";
  players = new Map<string, PView>();
  beasts = new Map<string, Phaser.GameObjects.Sprite>();
  /** Vùng cảnh báo chiêu báo trước đang hiện (3.5), theo mã hồn thú: hình đã khóa (từ BĐ4 có thể nhiều vùng), lúc bắt đầu, thời lượng (ms). */
  teles = new Map<string, { t: Tele[]; t0: number; ms: number }>();
  /** Tên trên đầu tinh anh (BĐ4) và thú vương (BĐ5): "Tinh anh …", "Tà hóa …" màu aura. */
  eliteLabels = new Map<string, Phaser.GameObjects.Text>();
  /** Hang thú vương của bản đồ (object `boss`, BĐ5): vẽ trên bản đồ nhỏ. */
  lair: Rect | null = null;
  /** Bảng xếp hạng sát thương thú vương gần nhất (tin "boss" k = "rank"); hiện khi mình đang tham gia. */
  bossList: { id: string; name: string; pct: number }[] | null = null;
  /** Boss thế giới đang tích lực phải ngắt (Đại Địa Chấn, BĐ6e): từ tin "boss" k = "charge" tới khi bị ngắt / tung. */
  charging = false;
  teleG!: Phaser.GameObjects.Graphics;
  drops = new Map<string, { img: Phaser.GameObjects.Image; txt: Phaser.GameObjects.Text }>(); // hồn hoàn dưới đất kèm số năm
  ov!: Phaser.GameObjects.Graphics;
  vignette!: Phaser.GameObjects.Image;
  zones: Zone[] = [];
  safes: Zone[] = [];   // vùng an toàn (object `safe`)
  campRect = { x: 0, y: 0, w: 0, h: 0 };
  campName = "";
  portals: (Rect & { to: string })[] = [];
  vignetteBase: number | null = null; // thuộc tính `vignette` của bản đồ: tối dần theo độ sâu của rừng, bắt đầu từ mức này (true = 0)
  portal: PortalInfo | null = null;
  /**
   * NPC của bản đồ (object `npc`, bước 6.1): chỗ đứng, định nghĩa trong NPCS (thiếu = mã lạ, chỉ vẽ biển tên), các lớp sprite hồn sư
   * (thân, áo, tóc; null = biển hiệu) và nhãn "Nói chuyện" hiện khi đứng gần.
   */
  npcs: { id: string; x: number; y: number; def: NpcDef | undefined; body: Sprite | null; clothes: Sprite[]; mark: Phaser.GameObjects.Text | null;
    qmark: Phaser.GameObjects.Text | null }[] = []; // qmark: dấu "!" / "?" của NPC giao nhiệm vụ (6.2)
  quest: QuestMsg | null = null; // tiến độ nhiệm vụ tân thủ (tin riêng "quest", 6.2)
  nearNpc: string | null = null;    // NPC trong tầm nói chuyện (NPC_RANGE) lần kiểm tra gần nhất
  onTravel: (mapId: string, roomId: string | null) => void = () => {};
  /** Đại Đấu Hồn Trường (7.2): server đã ghép trận thì vào phòng `roomId`; `onBack` rời sân về bản đồ cũ (đang giao đấu = bỏ trận, thua). */
  onArena: (roomId: string) => void = () => {};
  onBack: () => void = () => {};
  /** Đang ở sân Đại Đấu Hồn Trường (MAPS kind `arena`): vẽ thanh trận đấu, thanh máu trên đầu hai hồn sư. */
  isArena = false;
  /** Gỡ mọi bộ nghe gắn vào window/DOM khi scene bị hủy (đổi bản đồ thì tạo scene mới). */
  ac = new AbortController();
  keys: Record<string, boolean> = {};
  joy = { x: 0, y: 0 };
  lastInput = "";
  dir = { x: 0, y: 0 };             // hướng đi đã gửi gần nhất (đã làm tròn và chuẩn hóa như server đọc)
  pred: Predictor | null = null;    // dự đoán chuyển động của chính mình (mục 6); null khi tắt bằng ?nopredict
  ghost: Phaser.GameObjects.Graphics | null = null; // ?lag: khung đỏ ở vị trí server của chính mình (so với hình vẽ)
  lastZone = "";
  skillsKey = "";
  boneSkKey = "";                   // hồn cốt đang gắn trên võ hồn ra trận lần vẽ thanh kỹ năng hồn cốt gần nhất (4.3)
  hudT = 0;
  mini!: { ctx: CanvasRenderingContext2D; base: HTMLCanvasElement };
  mapW = 0; mapH = 0;
  owned: OwnedVohons | null = null; // tin riêng "vohons" gần nhất (tên võ hồn theo ô khi báo đủ năng lượng tiên cơ)
  bag: BagMsg | null = null;        // tin riêng "bag" gần nhất: vẽ lại túi khi cấp / số hồn hoàn đổi (câu gợi ý hấp thụ)
  bagKey = "";
  combat = false;                   // đang giao chiến (tin riêng "squad"): bảng hấp thụ nhắc rời xa hồn thú
  party: PartyView | null = null;   // tin riêng "party" gần nhất (tổ đội người chơi, 7.1)

  constructor() { super("game"); }
  init(data: { room: Room<any>; mapId: string; onTravel: (mapId: string, roomId: string | null) => void; onArena: (roomId: string) => void; onBack: () => void }) {
    this.room = data.room; this.mapId = data.mapId; this.me = data.room.sessionId; this.onTravel = data.onTravel;
    this.onArena = data.onArena; this.onBack = data.onBack; this.isArena = MAPS[data.mapId]?.kind === "arena";
    hud.resetChannels(); // danh sách kênh của phòng trước không còn đúng
    // Scene tắt (đổi bản đồ, vào / ra sân đấu): bỏ các hộp gắn với bản đồ cũ (cổng, gợi ý / hộp thoại NPC, trường đấu).
    const off = () => {
      this.ac.abort(); hud.showPortal(null, () => {}); hud.showTalk(null, () => {}); hud.closeNpc(); hud.showPlayerMenu(null);
      hud.setArenaQueue(null, () => {}); hud.showArena(null, () => {}); hud.arenaEnd(null, { back() {}, top() {} });
    };
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
    const vg = (map.properties as any[] | undefined)?.find?.((p) => p.name === "vignette")?.value;
    this.vignetteBase = typeof vg === "number" ? Math.max(0, Math.min(1, vg)) : vg ? 0 : null;
    const npcObjs: { x: number; y: number; name: string; id: string }[] = [];
    for (const o of map.getObjectLayer("zones")?.objects ?? []) {
      const prop = (n: string) => (o.properties as any[] | undefined)?.find((p) => p.name === n)?.value;
      const r = { x: o.x!, y: o.y!, w: o.width!, h: o.height! };
      if (o.type === "zone") {
        // Gợi ý vùng kèm cấp tương đương của khoảng niên hạn (mục 5.3, BĐ3), tính bằng hàm dùng chung.
        const yr = parseLevelRange(prop("years")), lv = yr && [beastLevel(yr[0]), beastLevel(yr[1])];
        const hint = [prop("hint") ?? "", lv ? `cấp ${lv[0] === lv[1] ? lv[0] : `${lv[0]}–${lv[1]}`}` : ""].filter(Boolean).join(" · ");
        this.zones.push({ ...r, name: o.name, hint });
      }
      if (o.type === "spawn") { this.campRect = r; this.campName = o.name; }
      if (o.type === "safe") this.safes.push({ ...r, name: o.name, hint: "Vùng an toàn: không có hồn thú, không giao chiến" });
      if (o.type === "portal" && MAPS[prop("to")]) this.portals.push({ ...r, to: prop("to") });
      if (o.type === "npc") npcObjs.push({ x: o.x!, y: o.y!, name: o.name, id: String(prop("npc") ?? "") });
      if (o.type === "boss") this.lair = r;
    }
    this.drawPortals();
    this.buildMinimap(map);
    // Dự đoán chuyển động: cùng lưới ô chặn của file Tiled mà server dùng (shared/move.ts).
    const raw = this.cache.tilemap.get(this.mapId)?.data;
    if (PREDICT && raw) this.pred = new Predictor(solidGrid(raw));
    if (LAG_MS || !PREDICT) {
      // Nhãn chế độ thử ở giữa mép trên (khung chỉ số chiếm góc trái); gỡ khi scene tắt (đổi bản đồ).
      const tag = document.body.appendChild(document.createElement("div"));
      tag.textContent = `Trễ giả lập ${LAG_MS} ms mỗi chiều · dự đoán chuyển động: ${this.pred ? "bật" : "tắt"}`;
      tag.style.cssText = "position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:50;pointer-events:none;font:600 12px 'Be Vietnam Pro',system-ui,sans-serif;color:#ffe9a0;background:#000a;padding:2px 8px;border-radius:4px";
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => tag.remove());
      this.events.once(Phaser.Scenes.Events.DESTROY, () => tag.remove());
      this.ghost = this.add.graphics().setDepth(99989);
      (window as any).__scene = this; // chỉ khi thử trễ: script đo (Chrome headless) đọc vị trí vẽ / vị trí server
    }
    makeTextures(this);
    createSheetAnims(this);
    for (const n of npcObjs) this.drawNpc(n.x, n.y, n.name, n.id); // sprite hồn sư của NPC cần texture / animation ở trên

    this.ov = this.add.graphics().setDepth(99990);
    this.teleG = this.add.graphics().setDepth(2); // vùng cảnh báo nằm trên mặt đất, dưới hồn sư và hồn thú
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
      // Cổng sát mép trên bản đồ (cổng bắc Nặc Đinh Thành, BĐ6a): tên ghi dưới cổng, không thì khuất ngoài bản đồ.
      const top = r.y < TILE;
      this.add.text(r.x + r.w / 2, top ? r.y + r.h + 2 : r.y - 2, `➜ ${MAPS[r.to].name}`, {
        fontFamily: FONT, fontSize: "7px", fontStyle: "700", color: "#c8ffe0", stroke: "#000", strokeThickness: 2, resolution: 8,
      }).setOrigin(0.5, top ? 0 : 1).setDepth(99984);
    }
  }

  /**
   * NPC (object `npc`, bước 6.1): NPC có `looks` trong NPCS vẽ bằng sprite hồn sư đứng yên nhìn xuống; không có (Đại Đấu Hồn Trường)
   * hoặc mã lạ thì vẽ biển hiệu. Tên (màu NPC) và chức danh trên đầu; bấm / chạm vào NPC để nói chuyện (server kiểm tra khoảng cách).
   */
  drawNpc(x: number, y: number, name: string, id: string) {
    const def = npcDef(id);
    let body: Sprite | null = null, clothes: Sprite[] = [], top = y - 16;
    if (def?.looks) {
      const t = looksTextures(this, def.looks), mk = (k: string) => this.make.sprite({ key: k }, false).setOrigin(HS_ORIGIN.x, HS_ORIGIN.y);
      body = mk(t.body); clothes = [mk(t.outfit), mk(t.hair)];
      body.play(honsuAnimKey(bodyKey(def.looks), "idle", "down").key);
      this.add.container(x, y, [this.make.image({ key: "hs_shadow" }, false), body, ...clothes]).setDepth(y);
      top = y - 30;
    } else {
      const g = this.add.graphics().setDepth(y);
      g.fillStyle(0x000000, 0.35).fillEllipse(x, y + 1, 10, 4);
      g.fillStyle(0xf2c84b, 1).fillTriangle(x - 3, y - 10, x + 3, y - 10, x, y - 4);
      g.fillStyle(0xfff2b0, 1).fillCircle(x, y - 12, 2.5);
    }
    const style = { fontFamily: FONT, fontStyle: "700", stroke: "#000", strokeThickness: 2, resolution: 8 };
    this.add.text(x, top, def?.name ?? name, { ...style, fontSize: "7px", color: def?.col ?? "#f2c84b" }).setOrigin(0.5, 1).setDepth(99984);
    if (def) this.add.text(x, top - 8, def.title, { ...style, fontSize: "5.5px", fontStyle: "600", color: "#d8d2c0" }).setOrigin(0.5, 1).setDepth(99984);
    let mark: Phaser.GameObjects.Text | null = null;
    if (def) {
      mark = this.add.text(x, top - 16, document.body.classList.contains("touch") ? "Chạm để nói chuyện" : "Nói chuyện [F]", {
        ...style, fontSize: "6px", color: "#fff2b0", backgroundColor: "#000000aa", padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1).setDepth(99986).setVisible(false);
      this.tweens.add({ targets: mark, y: mark.y - 2, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      // Vùng bấm phủ cả hình và tên: chuột hoặc chạm đều được.
      this.add.zone(x, (top + y) / 2, 22, y - top + 12).setInteractive({ useHandCursor: true }).on("pointerdown", () => this.talk(def.id));
    }
    // 6.2: NPC giao nhiệm vụ có dấu "!" (bài mới) / "?" (chờ trả, xám khi đang làm) phía trên nhãn "Nói chuyện".
    let qmark: Phaser.GameObjects.Text | null = null;
    if (def && hud.QUEST_GIVERS.has(def.id)) {
      qmark = this.add.text(x, top - 25, "", { ...style, fontSize: "12px", fontStyle: "800", color: "#ffd84a", strokeThickness: 3 })
        .setOrigin(0.5, 1).setDepth(99987).setVisible(false);
      this.tweens.add({ targets: qmark, y: qmark.y - 3, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    this.npcs.push({ id, x, y, def, body, clothes, mark, qmark });
    this.updateQuestMarks();
  }

  /** Dấu nhiệm vụ trên đầu NPC giao nhiệm vụ theo tiến độ (6.2): "!" có bài mới, "?" vàng đủ mục tiêu chờ trả, "?" xám đang làm. */
  updateQuestMarks() {
    for (const n of this.npcs) {
      if (!n.qmark) continue;
      const q = hud.questOf(n.id), st = q?.status;
      n.qmark.setVisible(!!st && st !== "done");
      if (st === "offer") n.qmark.setText("!").setColor("#ffd84a");
      else if (st === "ready") n.qmark.setText("?").setColor("#ffd84a");
      else if (st === "active") n.qmark.setText("?").setColor("#a8a8a8");
    }
  }

  /** Xin nói chuyện với NPC `id`: server kiểm tra khoảng cách rồi gửi riêng tin `npc` để mở hộp thoại (6.1). */
  talk(id: string) { this.room.send("talk", { npc: id }); }

  /**
   * Mỗi lần cập nhật HUD: NPC gần nhất trong NPC_RANGE hiện nhãn "Nói chuyện" và hộp gợi ý (nút bấm / phím F; cổng được ưu tiên),
   * đi xa NPC đang mở hộp thoại thì đóng (server vẫn kiểm tra lại mỗi lần mua / bán).
   */
  updateNpcs(me: any) {
    let near: (typeof this.npcs)[number] | null = null, nd = NPC_RANGE;
    for (const n of this.npcs) { const k = Math.hypot(n.x - me.x, n.y - me.y); if (n.def && k <= nd && !me.dead) { nd = k; near = n; } }
    const id = near && !this.portal ? near.id : null;
    if (id !== this.nearNpc) {
      this.nearNpc = id;
      for (const n of this.npcs) n.mark?.setVisible(n.id === id);
      hud.showTalk(id ? near!.def! : null, () => id && this.talk(id));
    }
    const open = hud.npcOpenId(), on = open && this.npcs.find((n) => n.id === open);
    if (on && Math.hypot(on.x - me.x, on.y - me.y) > NPC_RANGE + 12) hud.closeNpc();
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
        if (e.key === "Enter") { const t = chat.value.trim(); if (t && !this.chatCommand(t)) this.room.send("chat", { text: t }); chat.value = ""; chat.blur(); }
        if (e.key === "Escape") chat.blur();
        return;
      }
      if (e.key === "Enter") { chat.focus(); e.preventDefault(); return; }
      if (e.code === "KeyV" && !e.repeat) { hud.toggleRoster(); return; }
      if (e.code === "KeyB" && !e.repeat) { hud.toggleBag(); return; }
      if (e.code === "KeyK" && !e.repeat) { hud.toggleReso(); return; } // cộng minh (8.2)
      if (e.code === "Escape") { hud.toggleRoster(false); hud.toggleBag(false); hud.toggleReso(false); hud.closeNpc(); hud.showPlayerMenu(null); hud.toggleChannels(false); return; }
      if (e.code === "KeyF" && !e.repeat) { if (this.portal?.name) this.goPortal(); else if (this.nearNpc) this.talk(this.nearNpc); return; }
      this.keys[e.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.repeat && e.code !== "KeyJ" && e.code !== "Space") return;
      // Phím số 1–4: đổi sang võ hồn ở ô tương ứng của đội; hồn kỹ dùng U, I, O, P (hud.SKILL_KEYS).
      const sk = hud.SKILL_KEYS.findIndex((k) => e.code === "Key" + k);
      const bk = hud.BONE_SKILL_KEYS.findIndex((k) => e.code === "Key" + k); // kỹ năng hồn cốt Z / X / C (4.3)
      if (e.code === "Key" + hud.AVA_KEY) return this.act("chanthan"); // Võ Hồn Chân Thân (8.1a)
      const slot = /^Digit\d$/.test(e.code) ? Number(e.code.slice(5)) - 1 : -1;
      if (e.code === "KeyJ" || e.code === "Space") this.act("attack");
      else if (e.code === "KeyE") this.act("pickup");
      else if (sk >= 0) this.act("skill" + sk);
      else if (bk >= 0) this.act("bone" + bk);
      else if (slot >= 0 && slot < TEAM_SIZE) this.act("switch" + slot);
    }, on);
    addEventListener("keyup", (e) => { this.keys[e.code] = false; }, on);
    addEventListener("blur", () => { this.keys = {}; }, on);
    chat.addEventListener("focus", () => { this.keys = {}; }, on);
    document.getElementById("vhBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); hud.toggleRoster(); }, on);
    document.getElementById("bagBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); hud.toggleBag(); }, on);
    document.getElementById("resBtn")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); hud.toggleReso(); }, on);
    // Chọn kênh (mục 6 "Nhiều kênh"): mở danh sách thì xin server số người từng kênh; bấm một kênh thì gửi ý định đổi kênh.
    document.getElementById("chanBtn")!.addEventListener("click", (e) => {
      (e.currentTarget as HTMLElement).blur();
      if (hud.toggleChannels()) this.room.send("channels");
    }, on);
    hud.onChannelPick((ch) => { this.room.send("channel", { ch }); hud.toggleChannels(false); });

    // Bấm / chạm vào hồn sư khác (7.1): mở bảng mời vào tổ đội. Chọn hồn sư gần điểm bấm nhất (thân cao khoảng 30 pixel trên chân).
    this.input.on("pointerdown", (ptr: Phaser.Input.Pointer) => {
      let best: { sid: string; name: string; level: number } | null = null, bd = 14;
      this.room.state.players.forEach((p: any, id: string) => {
        if (id === this.me) return;
        const v = this.players.get(id), x = v?.root.x ?? p.x, y = (v?.root.y ?? p.y) - 12, k = Math.hypot(ptr.worldX - x, (ptr.worldY - y) * 0.7);
        if (k < bd) { bd = k; best = { sid: id, name: p.name, level: p.level }; }
      });
      hud.showPlayerMenu(best);
    });

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

  /**
   * Lệnh trong ô chat (7.1): `/moi <tên>` mời vào tổ đội, `/roi` rời tổ đội. Trả true nếu là lệnh (không gửi lên kênh chat chung).
   */
  chatCommand(t: string) {
    const m = /^\/(\S+)\s*(.*)$/u.exec(t); if (!m) return false;
    const cmd = m[1].toLowerCase(), arg = m[2].trim();
    if (cmd === "moi" || cmd === "mời") {
      if (arg) this.partySend("invite", arg); else hud.log("Gõ /moi <tên hồn sư> để mời vào tổ đội.", "#ffb35c");
    } else if (cmd === "roi" || cmd === "rời") this.partySend("leave");
    else hud.log("Lệnh: /moi <tên> (mời vào tổ đội), /roi (rời tổ đội).", "#ffb35c");
    return true;
  }

  /** Thao tác tổ đội: chỉ gửi ý định, server kiểm tra (7.1). */
  partySend(op: string, name?: string, sid?: string) { this.room.send("party", { op, ...(name ? { name } : {}), ...(sid ? { sid } : {}) }); }

  /** Xin đi qua cổng đang đứng: chỉ gửi tên cổng, server kiểm tra vị trí và chọn bản đồ đích. */
  goPortal() { if (this.portal?.name) this.room.send("travel", { portal: this.portal.name }); }

  act(a: string) {
    if (a === "attack") this.room.send("attack");
    else if (a === "pickup") this.room.send("pickup");
    else if (a.startsWith("skill")) this.room.send("skill", { i: Number(a.slice(5)) });
    else if (a.startsWith("bone")) this.room.send("boneskill", { i: Number(a.slice(4)) });
    else if (a.startsWith("switch")) this.room.send("switch", { slot: Number(a.slice(6)) });
    else if (a === "chanthan") this.room.send("chanthan");
  }

  sendInput() {
    const k = this.keys;
    let x = (k.ArrowRight || k.KeyD ? 1 : 0) - (k.ArrowLeft || k.KeyA ? 1 : 0) + this.joy.x;
    let y = (k.ArrowDown || k.KeyS ? 1 : 0) - (k.ArrowUp || k.KeyW ? 1 : 0) + this.joy.y;
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    const key = `${x.toFixed(2)},${y.toFixed(2)}`;
    if (this.pred?.resend) this.lastInput = ""; // server đã tự dừng hướng đi (hook thử goto): gửi lại hướng đang giữ với số mới
    if (key !== this.lastInput) {
      this.lastInput = key; x = +x.toFixed(2); y = +y.toFixed(2);
      this.dir = clampDir(x, y);
      // Có dự đoán thì đánh số input để server trả lại số cuối đã nhận (PlayerState.seq / seqT) cho bước đối chiếu.
      this.room.send("input", this.pred ? { x, y, s: this.pred.next() } : { x, y });
    }
  }

  // ---------- Tin nhắn từ server ----------
  setupMessages() {
    this.room.onMessage("log", (m: { text: string; col?: string }) => hud.log(m.text, m.col));
    // Tinh anh xuất hiện / bị hạ trong bản đồ này (BĐ4): báo cả phòng.
    this.room.onMessage("elite", (m: { k: string; name: string; zone?: string; by?: string; col?: string }) => {
      if (m.k === "spawn") { hud.banner(`${m.name} xuất hiện`, m.zone ?? ""); hud.log(`${m.name} đã xuất hiện ở ${m.zone}!`, m.col); }
      else if (m.k === "down") hud.log(`${m.name} đã bị ${m.by} hạ.`, m.col);
    });
    // Tà hóa thú vương (BĐ5): báo toàn server trước 5 phút (đếm ngược) và lúc xuất hiện; trong bản đồ có thú vương thì thêm giai đoạn 2,
    // bảng xếp hạng sát thương, bị hạ / rút đi / bỏ giao chiến.
    this.room.onMessage("boss", (m: any) => {
      const col = m.col ?? "#ff5a5a";
      if (this.worldBossMsg(m, col)) return; // boss thế giới (BĐ6e): cơ chế riêng
      if (m.k === "warn") {
        hud.setBossCountdown({ name: m.name, mapName: m.mapName, here: m.here, secs: m.in, col });
        hud.log(`${m.name} sẽ xuất hiện ở ${m.mapName} sau ${Math.max(1, Math.round(m.in / 60))} phút!`, col, "Hệ thống");
        hud.banner(`${m.name} sắp xuất hiện`, `${m.mapName} · ${Math.max(1, Math.round(m.in / 60))} phút nữa`);
      } else if (m.k === "spawn" || m.k === "here") {
        hud.setBossCountdown(null);
        if (m.here) hud.setBossLife(m.life);
        // Boss thế giới (BĐ6e): đồng hồ nổi giận, điểm yếu đang hiện (người vào giữa trận).
        if (m.here && m.world) { hud.setBossRage(m.k === "spawn" ? WORLD.enrageSecs : m.rageIn ?? 0); if (m.weak) hud.setBossWeak(m.weakT ?? 0); }
        if (m.k === "spawn" && m.world) {
          hud.log(`${m.name} đã xuất hiện ở ${m.mapName}${m.here ? ": sàn đấu bên hồ trung tâm" : " (cổng ở bờ hồ cuối Hắc Ám Lâm, Nội địa)"}!`, col, "Hệ thống");
          hud.banner(`${m.name} xuất hiện`, m.here ? `Sàn đấu bên hồ · nổi giận sau ${Math.round(WORLD.enrageSecs / 60)} phút` : m.mapName);
        } else if (m.k === "spawn") {
          hud.log(`${m.name} đã xuất hiện ở ${m.mapName}${m.here ? ": vào hang ở vùng sâu nhất (chấm đỏ trên bản đồ nhỏ)" : ""}!`, col, "Hệ thống");
          hud.banner(`${m.name} xuất hiện`, m.here ? `Hang ở vùng sâu nhất · rút đi sau ${Math.round(m.life / 60)} phút` : m.mapName);
        }
      } else if (m.k === "phase") {
        hud.banner(`${m.name}: giai đoạn 2`, `${m.title} – ${m.desc}`);
        hud.log(`${m.name} chuyển sang giai đoạn 2 – ${m.title}: ${m.desc}.`, col);
      } else if (m.k === "rank") { this.bossList = m.list; hud.bossRank(m.list, this.me, false, this.worldBossHere()); }
      else if (m.k === "down") {
        // Kết quả cuối chỉ hiện cho người tham gia (đang nhận bảng xếp hạng, hoặc có tên trong danh sách).
        if (this.bossList || m.list?.some((x: { id: string }) => x.id === this.me)) hud.bossRank(m.list, this.me, true, !!MAPS[this.room.state.mapId]?.world?.length);
        this.bossList = null;
        setTimeout(() => { if (!this.bossList) hud.bossRank(null, this.me); }, 12000);
        hud.banner(`Đã hạ ${m.name}`, `${m.top} đóng góp nhiều nhất`);
      } else if (m.k === "leave") { this.bossList = null; hud.bossRank(null, this.me); hud.banner(`${m.name} đã ${m.world ? "lặn xuống hồ" : "rút đi"}`, `Không ai hạ được trong ${m.mins ?? 15} phút`); }
      else if (m.k === "reset") { this.bossList = null; hud.bossRank(null, this.me); hud.log(`${m.name} bỏ giao chiến: về hang, hồi đầy máu.`, col); }
    });
    this.room.onMessage("chat", (m: { name: string; text: string }) => hud.log(m.text, m.name === "Hệ thống" ? "#86e0b0" : "#9db3a2", m.name));
    this.room.onMessage("dmg", (m: { x: number; y: number; v: number; crit?: boolean; c: string; id?: string; immune?: boolean }) => {
      if (m.id) { const v = this.players.get(m.id); if (v) { v.hurtT = this.time.now; this.playAct(m.id, "hurt"); } }
      const t = this.add.text(m.x, m.y, m.immune ? "Miễn" : String(Math.abs(m.v)), {
        fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: m.crit ? "10px" : "8px", fontStyle: "800",
        color: m.c, stroke: "#000", strokeThickness: 2, resolution: 8,
      }).setOrigin(0.5).setDepth(99999);
      this.tweens.add({ targets: t, y: m.y - 16, alpha: 0, delay: 350, duration: 550, onComplete: () => t.destroy() });
    });
    this.room.onMessage("fx", (m: any) => this.fx(m));
    // Cổng: server báo riêng khi bước vào / ra khỏi cổng, và khi đã lưu xong thì cho chuyển bản đồ (mục 6).
    this.room.onMessage("portal", (m: PortalInfo) => { this.portal = m?.name ? m : null; hud.showPortal(this.portal, () => this.goPortal()); });
    // NPC (6.1): server đã kiểm tra khoảng cách; lời thoại, cửa hàng và lò rèn lấy từ NPCS. Mua / bán / rèn chỉ gửi ý định.
    this.room.onMessage("npc", (m: { id: string }) => {
      if (!npcDef(m?.id)) return;
      hud.openNpc(m.id, this.bag, {
        buy: (code, qty) => this.room.send("buy", { code, qty }),
        sell: (id, qty) => this.room.send("sell", { id, qty }),
        enhance: (targetId, materialIds) => this.room.send("enhance", { targetId, materialIds }),
        enhanceCore: (targetId, materialIds) => this.room.send("enhancecore", { targetId, materialIds }), // lò rèn: nâng cấp hồn hạch (5.3)
        combat: () => this.combat,
        quest: (op) => this.room.send("quest", { op }),
        arena: (op) => this.room.send("arena", { op }), // 7.2: xếp hàng / hủy / bảng xếp hạng
      });
    });
    // Đại Đấu Hồn Trường (7.2): server báo đang xếp hàng, đã ghép trận (vào phòng sân đấu), các pha của trận và kết quả.
    this.room.onMessage("arena", (m: any) => {
      if (m?.k === "queue") hud.setArenaQueue(m.on ? { elo: m.elo, secs: m.secs } : null, () => this.room.send("arena", { op: "cancel" }));
      else if (m?.k === "found" && typeof m.roomId === "string") {
        hud.setArenaQueue(null, () => {}); hud.closeNpc();
        hud.log(`Đã tìm thấy đối thủ: ${m.foe} (Elo ${m.elo}). Vào Đại Đấu Hồn Trường…`, "#ff9a8a");
        this.onArena(m.roomId);
      } else if (m?.k === "ready") hud.banner("Đại Đấu Hồn Trường", `Trận đấu bắt đầu sau ${m.secs} giây`);
      else if (m?.k === "fight") hud.banner("Giao đấu!", `Hạ hết đội võ hồn đối thủ trong ${Math.round(m.secs / 60)} phút; hết giờ thì so sinh lực cả đội`);
      else if (m?.k === "end") {
        hud.arenaEnd(m, { back: () => this.onBack(), top: () => this.room.send("arena", { op: "top" }) });
        this.room.send("arena", { op: "top" });
      }
    });
    this.room.onMessage("arenaTop", (m: hud.ArenaTopMsg) => { if (m && Array.isArray(m.list)) hud.setArenaTop(m); });
    // Nhiệm vụ tân thủ (6.2): tiến độ do server đếm theo sự kiện thật; client vẽ khung theo dõi, dấu trên đầu NPC và thông báo.
    this.room.onMessage("quest", (m: QuestMsg) => {
      if (!m || typeof m.chain !== "string") return;
      this.quest = m; hud.setQuest(m); this.updateQuestMarks();
      const c = questChain(m.chain), s = c?.steps[m.step], giver = c && npcDef(c.giver);
      if (!c) return;
      if (m.ev === "accept" && s) hud.banner(`Nhận nhiệm vụ: ${s.name}`, s.goals.map((g) => g.text).join(" · "));
      else if (m.ev === "ready" && s) hud.banner(`Hoàn thành: ${s.name}`, `Quay về gặp ${giver?.name} ở ${MAPS[c.map].name} để nhận thưởng`);
      else if (m.ev === "reward" || m.ev === "finish") {
        const d = c.steps.find((x) => x.id === m.done);
        if (m.ev === "finish") hud.banner(`Hoàn thành chuỗi: ${c.name}`, d ? `Nhận ${questRewardText(d.reward)}` : "");
        else hud.banner(`Trả nhiệm vụ: ${d?.name ?? ""}`, d ? `Nhận ${questRewardText(d.reward)}` : "");
      }
    });
    // Đi cổng / đổi kênh: server đã lưu xong và chọn phòng (kênh) đích (`roomId`, null = để Colyseus chọn / mở kênh mới).
    this.room.onMessage("travel", (m: { mapId: string; roomId?: string | null }) => {
      if (typeof m?.mapId === "string") this.onTravel(m.mapId, typeof m.roomId === "string" ? m.roomId : null);
    });
    this.room.onMessage("channels", (m: ChannelsMsg) => hud.setChannels(m)); // danh sách kênh của bản đồ (mục 6 "Nhiều kênh")
    // Cộng minh (8.2): tiến độ 4 trụ cột và % cộng cho mọi võ hồn do server tính; mốc mới đạt thì báo lớn.
    this.room.onMessage("resonance", (m: ResonanceMsg) => {
      if (!m || !Array.isArray(m.prog)) return;
      hud.setResonance(m); this.renderRoster(); // chỉ số trong mục hồn cốt của bảng đội hình có phần cộng minh
      for (const e of m.ev ?? []) {
        const r = RESONANCE[e.pillar], s = r?.steps[e.step];
        if (r && s && e.up) hud.banner(`Cộng minh ${r.name}: mốc ${e.step + 1}`, `${s.need} ${r.what} · mọi võ hồn ${resonanceText(s.bonus)}`);
      }
    });
    // Tổ đội người chơi (7.1): khung tổ đội và lời mời, chỉ gửi riêng cho mình.
    this.room.onMessage("party", (m: PartyView) => { this.party = m; hud.renderParty(m, { send: (op, name, sid) => this.partySend(op, name, sid) }); });
    // Võ hồn sở hữu và đội hình: server chỉ gửi riêng cho mình. Xin lần đầu sau khi đã đăng ký nhận.
    this.room.onMessage("vohons", (m: OwnedVohons) => {
      this.owned = m;
      this.renderBag(); // bảng chọn võ hồn để hấp thụ dùng cấp / số hồn hoàn mới nhất
      this.renderRoster();
      hud.buildTeam(m, (slot) => this.act("switch" + slot));
    });
    // Sinh lực từng võ hồn trong đội và võ hồn đã gục (luật gục từng võ hồn, bước 2.3b): cũng chỉ gửi riêng cho mình.
    // Năng lượng tiên cơ cũng đi trong tin này: võ hồn nào vừa đầy thì báo một lần.
    this.room.onMessage("squad", (m: Squad) => {
      // Bảng hồn cốt nhắc "đang giao chiến" (4.2): vẽ lại khi trạng thái giao chiến đổi.
      if (m.combat !== this.combat) { this.combat = m.combat; this.renderRoster(); }
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
      else if (this.isArena) hud.banner("Cả đội đã gục", "Thua trận đấu hồn, không mất kinh nghiệm hay đồ");
      else hud.banner("Cả đội đã gục", `Về doanh trại sau ${String(RESPAWN_SECS).replace(".", ",")} giây, không mất kinh nghiệm hay đồ`);
    });
    // Túi đồ và Hồn Tệ (bước 3.1): chỉ gửi riêng cho mình; client chỉ gửi id ô muốn dùng / hấp thụ / bỏ, server kiểm tra.
    // Mảnh võ hồn trong túi (3.4): bảng đội hình hiện tiến độ mở / lên sao nên vẽ lại cùng túi.
    this.room.onMessage("bag", (m: BagMsg) => { this.bag = m; this.renderBag(); this.renderRoster(); hud.npcBag(m); });
    // Cường hóa hồn cốt (bước 4.4): kết quả do server tính (luôn thành công); túi mới đến ngay sau bằng tin "bag".
    this.room.onMessage("enhanced", (m: { id: string; from: number; to: number; gain: number; used: number }) => {
      const pts = `+${m.gain.toLocaleString("vi-VN")} điểm từ ${m.used} nguyên liệu`;
      if (m.to > m.from) hud.banner(`Cường hóa hồn cốt +${m.to}`, `+${m.from} → +${m.to} · ${pts}`);
      else hud.banner(`Cường hóa hồn cốt +${m.to}`, `${pts}, chưa đủ lên cấp`);
    });
    // Nâng cấp hồn hạch (bước 5.3): kết quả và các dòng phụ vừa tăng do server tung; túi mới đến ngay sau bằng tin "bag".
    this.room.onMessage("enhancedcore", (m: { from: number; to: number; gain: number; used: number; subs: CoreSubUp[] }) => {
      const pts = `+${m.gain.toLocaleString("vi-VN")} điểm từ ${m.used} nguyên liệu`;
      const subs = m.subs.map((u) => (u.add ? `dòng phụ mới ${coreStatText(u.k, u.v)}` : `${coreStatText(u.k, u.to)} (tăng)`)).join(" · ");
      hud.banner(`Nâng cấp hồn hạch +${m.to}`, m.to > m.from ? `+${m.from} → +${m.to} · ${subs || pts}` : `${pts}, chưa đủ lên cấp`);
    });
    // Hấp thụ hồn hoàn (bước 3.3): server báo riêng lúc bắt đầu (thanh tiến độ) và kết quả; thành công / thất bại do server quyết định.
    this.room.onMessage("absorbing", (m: { on: boolean; rowId: number; years: number; slot?: number; secs?: number; fail?: number; result?: string; level?: number }) => {
      const v = this.owned?.list.find((o) => o.rowId === m.rowId), def = VOHON[Math.max(0, vohonIndex(v?.vohon ?? ""))];
      const name = v ? def.name : "võ hồn", age = formatYears(m.years), col = TIERS[tierOfYears(m.years)].glow;
      if (m.on) {
        const risk = m.fail ? ` (${Math.round(m.fail * 100)}% thất bại)` : "";
        hud.setAbsorbing({ label: `Hấp thụ hồn hoàn ${age} vào ${name}${risk}`, secs: m.secs ?? 1, risk: !!m.fail, col });
        return;
      }
      hud.setAbsorbing(null);
      if (m.result === "ok") hud.banner(`Hấp thụ thành công: hồn hoàn thứ ${m.slot}`, `${name} · ${age} · cấp ${m.level}`);
      else if (m.result === "fail") hud.banner("Hấp thụ thất bại", `Hồn hoàn ${age} vỡ tan; ${name} không bị tổn hại`);
    });
    this.room.send("vohons");
    this.room.send("bag");
    this.room.send("party", { op: "get" });
    this.room.send("quest", { op: "get" });
    this.room.send("resonance");
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
      // Vòng 10 mũi (Hồn Tiễn) hoặc `n` mũi tỏa `spread` độ quanh hướng a0 (hồn kỹ riêng).
      const n = m.n ?? 10, ring = !m.spread || m.spread >= 360, sp = ((m.spread ?? 0) * Math.PI) / 180, R = m.r ?? 110;
      for (let k = 0; k < n; k++) {
        const a = ring ? (k / n) * Math.PI * 2 : m.a0 + (n > 1 ? (k / (n - 1) - 0.5) * sp : 0), r = this.add.rectangle(m.x, m.y, 4, 4, hex(m.col)).setDepth(99980);
        this.tweens.add({ targets: r, x: m.x + Math.cos(a) * R, y: m.y + Math.sin(a) * R, duration: (R / 170) * 1000, onComplete: () => r.destroy() });
      }
    } else if (m.k === "soulring") {
      this.playAct(m.id, "cast");
      const v = this.players.get(m.id); if (v && Number.isInteger(m.i)) v.lit = { i: m.i, t0: this.time.now };
      this.soulRingFx(m.id, m.tier, 700);
      // Tên hồn kỹ (riêng hoặc dùng chung) bay lên trên đầu, màu hào quang hồn hoàn của vòng đó.
      const sk = v && VOHON[m.vh] ? ringSkill(VOHON[m.vh].id, m.i) : undefined; // m.i: chỉ số vòng (từ 8.1a có vòng 5–10)
      if (v && sk) this.floatText(v.root.x, v.root.y - 48, sk.name, TIERS[m.tier]?.glow ?? "#ffffff");
    }
    else if (m.k === "ult" || m.k === "avatar") {
      // Tuyệt kỹ vòng 10 / Võ Hồn Chân Thân (8.1a): hai vòng sáng, chớp màn hình khi ở gần; chính mình thấy banner, người khác thấy tên lớn bay lên.
      const v = this.players.get(m.id); if (!v || (m.k === "avatar" && !m.on)) return;
      const { x, y } = v.root, col = m.col ?? "#ffffff";
      if (m.id !== this.me) {
        const t = this.add.text(x, y - 62, m.name, { fontFamily: FONT, fontSize: "11px", fontStyle: "800", color: col, stroke: "#000", strokeThickness: 3, resolution: 8 })
          .setOrigin(0.5).setDepth(99990).setScale(0.5);
        this.tweens.add({ targets: t, scale: 1.15, y: y - 74, duration: 450, ease: "Back.out" });
        this.tweens.add({ targets: t, alpha: 0, delay: 1300, duration: 500, onComplete: () => t.destroy() });
      }
      this.ringFx(x, y - 6, 6, m.k === "ult" ? 150 : 90, col, 650); this.ringFx(x, y - 6, 4, m.k === "ult" ? 110 : 60, "#ffffff", 550, 150);
      const me = this.players.get(this.me);
      if (me && Math.hypot(me.root.x - x, me.root.y - y) < 220) {
        const c = Phaser.Display.Color.HexStringToColor(col);
        this.cameras.main.flash(m.k === "ult" ? 260 : 180, c.red, c.green, c.blue); this.cameras.main.shake(300, m.k === "ult" ? 0.006 : 0.003);
      }
      if (m.id === this.me) hud.banner(m.name, m.k === "ult" ? "Tuyệt kỹ" : "Võ Hồn Chân Thân");
    }
    else if (m.k === "bone") {
      // Kỹ năng hồn cốt chủ động (4.3): vòng sáng màu niên hạn hồn cốt, tên kỹ năng bay lên (tra theo loài và nút).
      this.playAct(m.id, "cast");
      const v = this.players.get(m.id), col = TIERS[m.tier]?.glow ?? "#ffffff", k = boneSkillOf(BEASTS[m.sp]?.id ?? "", BONE_ACTIVE_SLOTS[m.i]);
      if (v) { this.ringFx(v.root.x, v.root.y - 6, 4, 22, col, 420); if (k?.active) this.floatText(v.root.x, v.root.y - 48, k.sk.name, col); }
    }
    else if (m.k === "combo") {
      // Bộ hồn hạch Hạo Thiên 4 món (5.2): đòn thường thứ 3 liên tiếp, chữ bay lên màu bộ.
      const v = this.players.get(m.id); if (v) this.floatText(v.root.x, v.root.y - 48, "Hạo Thiên liên kích!", m.col ?? "#b9a3ff");
    }
    else if (m.k === "pull") {
      // Gom quái: vòng thu từ bán kính r về thân, kèm dây kéo.
      this.ringFx(m.x, m.y, m.r, 6, m.col, 380);
      const g = this.add.graphics().setDepth(99980);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.lineStyle(1, hex(m.col), 0.8).lineBetween(m.x, m.y, m.x + Math.cos(a) * m.r, m.y + Math.sin(a) * m.r * 0.6); }
      this.tweens.add({ targets: g, alpha: 0, duration: 380, onComplete: () => g.destroy() });
    } else if (m.k === "arc") {
      // Đòn nửa trước mặt: cung rộng dày.
      if (this.players.has(m.id)) this.playAct(m.id, "attack");
      const g = this.add.graphics().setDepth(99980), a = Math.atan2(m.dy, m.dx);
      g.lineStyle(4, hex(m.col), 1); g.beginPath(); g.arc(m.x, m.y, m.r, a - 1.2, a + 1.2); g.strokePath();
      g.lineStyle(1, 0xffffff, 0.8); g.beginPath(); g.arc(m.x, m.y, m.r - 4, a - 1, a + 1); g.strokePath();
      this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
    } else if (m.k === "claw") {
      // Một nhát vào mục tiêu (cào / nện liên hoàn): 3 vệt chéo, đổi hướng theo nhát.
      const g = this.add.graphics().setDepth(99981), dir = m.i % 2 ? -1 : 1;
      for (let j = -1; j <= 1; j++) g.lineStyle(2, hex(m.col), 1).lineBetween(m.x - 6 * dir + j * 3, m.y - 6, m.x + 6 * dir + j * 3, m.y + 6);
      this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
    } else if (m.k === "buff") {
      // Hiệu ứng có lợi lên bản thân: vòng sáng và hạt bay lên.
      const v = this.players.get(m.id); if (!v) return;
      this.playAct(m.id, "cast");
      this.ringFx(v.root.x, v.root.y - 2, 4, 22, m.col, 450);
      for (let k = 0; k < 8; k++) {
        const q = this.add.rectangle(v.root.x + (k - 3.5) * 3, v.root.y - 2, 2, 2, hex(m.col)).setDepth(99980);
        this.tweens.add({ targets: q, y: v.root.y - 26 - (k % 3) * 5, alpha: 0, duration: 600, delay: k * 25, onComplete: () => q.destroy() });
      }
    }
    else if (m.k === "fly") {
      // Bay (chỉ hiệu ứng): nhấc hồn sư lên, đôi cánh lửa và tàn lửa rơi xuống bóng.
      const v = this.players.get(m.id); if (!v) return;
      v.fly = { t0: this.time.now, ms: (m.t ?? 0.5) * 1000 };
      for (let k = 0; k < 10; k++) {
        const q = this.add.rectangle(v.root.x + (k - 4.5) * 3, v.root.y - 14, 2, 2, hex(k % 2 ? m.col : "#ffe08a")).setDepth(99980);
        this.tweens.add({ targets: q, y: v.root.y, alpha: 0, duration: v.fly.ms, delay: k * 20, onComplete: () => q.destroy() });
      }
    }
    else if (m.k === "zone") {
      // Vùng cố định (2.5c): vùng phong tỏa của Càn Khôn Hỗn Nguyên Tỏa, lãnh vực Yêu Hồ; giữ `t` giây ở chỗ đặt, mờ dần lúc cuối.
      const g = this.add.graphics().setDepth(5), c = hex(m.col), t0 = this.time.now, ms = (m.t ?? 1) * 1000;
      const ev = this.time.addEvent({ delay: 50, loop: true, callback: () => {
        const k = (this.time.now - t0) / ms, al = k > 0.8 ? (1 - k) * 5 : 1; g.clear();
        if (k >= 1) { ev.remove(); g.destroy(); return; }
        g.fillStyle(c, 0.12 * al).fillEllipse(m.x, m.y, m.r * 2, m.r * 1.2);
        g.lineStyle(2, c, 0.8 * al).strokeEllipse(m.x, m.y, m.r * 2, m.r * 1.2);
        for (let j = 0; j < 8; j++) { const a = this.time.now / 700 + (j / 8) * Math.PI * 2; g.fillStyle(c, al).fillRect(m.x + Math.cos(a) * m.r - 1.5, m.y + Math.sin(a) * m.r * 0.6 - 1.5, 3, 3); }
      } });
    } else if (m.k === "bolt") {
      // Lôi Động Minh Thiên (Phong Lôi Chi Lực đầy, 2.5c): nhiều tia sét giáng xuống quanh hồn sư, chớp sáng, tên chiêu bay lên.
      const g = this.add.graphics().setDepth(99982), c = hex(m.col);
      for (let j = 0; j < 7; j++) {
        const a = (j / 7) * Math.PI * 2, d = j ? m.r * (0.4 + 0.5 * ((j * 37) % 10) / 10) : 0, x = m.x + Math.cos(a) * d, y = m.y + Math.sin(a) * d * 0.6;
        let px = x + 6, py = y - 70; g.lineStyle(2, j % 2 ? 0xffffff : c, 1);
        for (let s = 1; s <= 5; s++) { const nx = x + (s === 5 ? 0 : (s % 2 ? -5 : 5)), ny = y - 70 + s * 14; g.lineBetween(px, py, nx, ny); px = nx; py = ny; }
      }
      this.tweens.add({ targets: g, alpha: 0, duration: 450, onComplete: () => g.destroy() });
      this.ringFx(m.x, m.y - 4, 6, m.r, m.col, 450); this.cameras.main.flash(120, 200, 230, 255);
      const v = this.players.get(m.id); if (v) this.floatText(v.root.x, v.root.y - 48, m.name ?? PHONG_LOI.skill.name, "#e8f6ff");
    } else if (m.k === "zap") {
      // Sét tìm mục tiêu Cảm điện ở xa (SkillDef.shockR, tuyệt kỹ Lam Điện Bá Vương Long, 8.1c): tia sét gấp khúc từ tâm vùng tới từng mục tiêu.
      const g = this.add.graphics().setDepth(99981), c = hex(m.col);
      for (const t of (m.to ?? []) as { x: number; y: number }[]) {
        const dx = t.x - m.x, dy = t.y - 6 - m.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, seg = Math.max(3, Math.round(L / 18));
        let px = m.x, py = m.y;
        for (let s = 1; s <= seg; s++) {
          const j = s === seg ? 0 : (s % 2 ? 6 : -6), x = m.x + (dx * s) / seg + nx * j, y = m.y + (dy * s) / seg + ny * j;
          g.lineStyle(3, c, 0.9).lineBetween(px, py, x, y); g.lineStyle(1, 0xffffff, 1).lineBetween(px, py, x, y); px = x; py = y;
        }
        this.ringFx(t.x, t.y - 6, 3, 16, m.col, 300);
      }
      this.tweens.add({ targets: g, alpha: 0, duration: 380, onComplete: () => g.destroy() });
    }
    else if (m.k === "tele") {
      // Chiêu báo trước của hồn thú (3.5): vùng đỏ hiện `t` giây, đầy dần; tên chiêu đỏ trên đầu hồn thú.
      this.teles.set(m.bid, { t: [m, ...(m.parts ?? [])], t0: this.time.now, ms: (m.t ?? 0.8) * 1000 });
      const s = this.beasts.get(m.bid), b = this.room.state.beasts.get(m.bid);
      if (s && b) this.floatText(s.x, beastTop(s, b.tier) - 10, m.name, "#ff6b6b");
    }
    else if (m.k === "teleEnd") this.teles.delete(m.bid); // bị ngắt chiêu (Choáng, Câm lặng, Mê hoặc)
    else if (m.k === "teleHit") this.teleHitFx(m);
    else if (m.k === "rage" || m.k === "dispel") {
      // Tinh anh nổi Cuồng nộ (máu dưới một nửa) / bị xóa hiệu ứng có lợi (Thiên Càn Trấn Áp), BĐ4.
      const s = this.beasts.get(m.bid), b = this.room.state.beasts.get(m.bid); if (!s || !b) return;
      const rage = m.k === "rage", col = rage ? BEAST_BUFFS.rage.col : "#f0e0a0";
      this.floatText(s.x, beastTop(s, b.tier) - 10, rage ? `${m.name}!` : "Xóa hiệu ứng", col);
      this.ringFx(s.x, s.y - 6, 6, rage ? 40 : 30, col, 450);
      if (rage) this.cameras.main.shake(120, 0.003);
    }
    else if (m.k === "roar") {
      // Thú vương chuyển giai đoạn 2 (BĐ5): gầm lên, sóng đỏ lan ra, rung màn hình.
      const s = this.beasts.get(m.bid), b = this.room.state.beasts.get(m.bid); if (!s || !b) return;
      this.floatText(s.x, beastTop(s, b.tier) - 12, `${m.name}!`, m.col ?? "#ff5a5a");
      for (let k = 0; k < 3; k++) this.ringFx(s.x, s.y - 8, 10, 90 + k * 30, m.col ?? "#ff5a5a", 700, k * 250);
      this.cameras.main.shake(400, 0.006);
    }
    else if (m.k === "tienco") this.tienCoFx(m);
    else if (m.k === "absorbed") {
      const v = this.players.get(m.id); if (!v) return; const t = TIERS[m.tier];
      for (let k = 0; k < 3; k++) this.ringFx(v.root.x, v.root.y - 6, 4 + k * 6, 60 + k * 20, t.glow, 700, k * 120);
      this.soulRingFx(m.id, m.tier, 1400);
      if (m.id === this.me) this.cameras.main.shake(400, 0.006); // chữ thông báo đến qua tin riêng "absorbing"
    }
  }

  /** Vẽ một vùng chiêu báo trước: `k` (0..1) là phần đã đầy tính từ gốc (vệt, nón) hoặc từ tâm (vòng). */
  teleShape(g: Phaser.GameObjects.Graphics, t: Tele, k: number) {
    const r = t.r * k;
    if (t.shape === "circle") { g.fillCircle(t.x, t.y, r); return; }
    if (t.shape === "line") {
      const c = Math.cos(t.ang), sn = Math.sin(t.ang), h = t.w / 2;
      g.fillPoints([{ x: t.x - sn * h, y: t.y + c * h }, { x: t.x + sn * h, y: t.y - c * h },
        { x: t.x + c * r + sn * h, y: t.y + sn * r - c * h }, { x: t.x + c * r - sn * h, y: t.y + sn * r + c * h }], true);
      return;
    }
    const half = (t.arc * Math.PI) / 360;
    g.beginPath(); g.slice(t.x, t.y, r, t.ang - half, t.ang + half, false); g.closePath(); g.fillPath();
  }
  teleOutline(g: Phaser.GameObjects.Graphics, t: Tele) {
    if (t.shape === "circle") { g.strokeCircle(t.x, t.y, t.r); return; }
    if (t.shape === "line") {
      const c = Math.cos(t.ang), sn = Math.sin(t.ang), h = t.w / 2, r = t.r;
      g.strokePoints([{ x: t.x - sn * h, y: t.y + c * h }, { x: t.x + sn * h, y: t.y - c * h },
        { x: t.x + c * r + sn * h, y: t.y + sn * r - c * h }, { x: t.x + c * r - sn * h, y: t.y + sn * r + c * h }], true, true);
      return;
    }
    const half = (t.arc * Math.PI) / 360;
    g.beginPath(); g.slice(t.x, t.y, t.r, t.ang - half, t.ang + half, false); g.closePath(); g.strokePath();
  }
  /** Mọi vùng cảnh báo đang hiện: nền đỏ mờ cả vùng, phần đỏ đậm đầy dần theo thời gian, viền nhấp nháy nhanh dần lúc sắp tung. */
  drawTeles(time: number) {
    const g = this.teleG; g.clear();
    for (const [bid, x] of this.teles) {
      const k = Math.min(1, (time - x.t0) / x.ms);
      // Hồn thú đã bị hạ hoặc server không gửi kết quả (mất gói): bỏ vùng.
      if (!this.room.state.beasts.has(bid) || time - x.t0 > x.ms + 1000) { this.teles.delete(bid); continue; }
      const blink = 0.55 + 0.45 * Math.sin(time / (k > 0.6 ? 45 : 90));
      for (const t of x.t) {
        g.fillStyle(TELE_COL, 0.16); this.teleShape(g, t, 1);
        g.fillStyle(TELE_COL, 0.2 + 0.25 * k); this.teleShape(g, t, k);
        g.lineStyle(1, k > 0.6 ? 0xffd0d0 : TELE_COL, blink); this.teleOutline(g, t);
      }
    }
  }
  /**
   * Aura tinh anh (BĐ4, mục 5.4 / 5.11, vẽ bằng code): vầng sáng màu riêng dưới chân (lớp mặt đất `teleG`, vẽ sau vùng cảnh báo) và
   * đốm sáng bay lên quanh thân (lớp phủ). Cuồng nộ thì vầng sáng đỏ, đập nhanh hơn.
   */
  drawAuras(g: Phaser.GameObjects.Graphics, st: any, time: number) {
    st.beasts.forEach((b: any, id: string) => {
      if (!b.rank) return; const s = this.beasts.get(id); if (!s) return;
      // Thú vương (BĐ5) ở giai đoạn 2 cũng đập nhanh như Cuồng nộ.
      const rage = (b.buff & beastBuffBit("rage")) !== 0 || b.phase === 2, c = hex(rage && b.rank === 1 ? BEAST_BUFFS.rage.col : BOSSES[b.species]?.aura ?? "#ffffff");
      const w = Math.max(24, s.displayWidth * 0.9), pulse = 0.5 + 0.5 * Math.sin(time / (rage ? 110 : 260));
      this.teleG.fillStyle(c, 0.3 + 0.15 * pulse).fillEllipse(s.x, s.y, w + 12, (w + 12) * 0.4);
      this.teleG.fillStyle(c, 0.35).fillEllipse(s.x, s.y, w * 0.6, w * 0.24);
      this.teleG.lineStyle(2, c, 0.7 + 0.3 * pulse).strokeEllipse(s.x, s.y, w + 6 + pulse * 6, (w + 6 + pulse * 6) * 0.4);
      const top = beastTop(s, b.tier), h = Math.max(8, s.y - top);
      for (let j = 0; j < 6; j++) {
        const f = ((time / (rage ? 500 : 900) + j / 6) % 1), x = s.x + Math.sin(j * 2.4 + time / 700) * w * 0.45;
        g.fillStyle(c, 1 - f).fillRect(x - 1, s.y - f * h * 1.1 - 1, 2, 2);
      }
    });
  }

  /** Chiêu báo trước tung ra: vùng chớp sáng rồi tắt, vệt lao của hồn thú (Vồ Lao, Xung Phong…), rung nếu mình trúng. */
  teleHitFx(m: Tele & { bid: string; hit: string[]; x0: number; y0: number; x1: number; y1: number; parts?: Tele[] }) {
    this.teles.delete(m.bid);
    const g = this.add.graphics().setDepth(3);
    for (const t of [m, ...(m.parts ?? [])]) {
      g.fillStyle(0xffe0d0, 0.55); this.teleShape(g, t, 1);
      g.lineStyle(2, TELE_COL, 1); this.teleOutline(g, t);
      if (t.shape === "circle") this.ringFx(t.x, t.y, t.r * 0.6, t.r * 1.15, "#ff6b6b", 300);
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 280, onComplete: () => g.destroy() });
    if (Math.hypot(m.x1 - m.x0, m.y1 - m.y0) > 4) {
      const tr = this.add.graphics().setDepth(99980);
      tr.lineStyle(5, TELE_COL, 0.4).lineBetween(m.x0, m.y0 - 4, m.x1, m.y1 - 4);
      tr.lineStyle(1, 0xffffff, 0.9).lineBetween(m.x0, m.y0 - 4, m.x1, m.y1 - 4);
      this.tweens.add({ targets: tr, alpha: 0, duration: 300, onComplete: () => tr.destroy() });
    }
    if (m.hit.includes(this.me)) this.cameras.main.shake(180, 0.006);
  }

  /** Chiêu tiên cơ (bước 2.4): hiệu ứng chung theo hệ và chữ "Tiên cơ" bay lên trên đầu hồn sư. */
  tienCoFx(m: { id: string; he: He; col: string; x: number; y: number; r?: number; x0?: number; y0?: number; vh?: number; own?: boolean }) {
    const c = hex(m.col), gold = 0xffe08a;
    this.playAct(m.id, "cast");
    if (m.own) {
      // Tiên cơ riêng (bước 2.5a): hiệu ứng vùng do server gửi riêng (wave, pull, claw, buff…); ở đây thêm vòng vàng và rung nhẹ.
      this.ringFx(m.x, m.y - 4, 4, 36, "#ffe08a", 420); this.cameras.main.shake(160, 0.004);
    } else if (m.he === "cuong_cong") {
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
    const name = m.vh !== undefined && VOHON[m.vh] ? tienCoOf(VOHON[m.vh].id).name : TIEN_CO[m.he]?.name ?? "";
    this.floatText(m.x, m.y - 56, `Tiên cơ · ${name}`, "#ffe08a");
  }

  /** Chữ bay lên rồi mờ dần (tên hồn kỹ, tên tiên cơ); đặt trên danh hiệu để không đè tên hồn sư. */
  floatText(x: number, y: number, text: string, col: string) {
    const t = this.add.text(x, y, text, {
      fontFamily: '"Be Vietnam Pro", system-ui, sans-serif', fontSize: "8px", fontStyle: "800",
      color: col, stroke: "#000", strokeThickness: 2, resolution: 8,
    }).setOrigin(0.5).setDepth(99999);
    this.tweens.add({ targets: t, y: y - 14, alpha: 0, delay: 500, duration: 600, onComplete: () => t.destroy() });
  }

  /**
   * Trạng thái: vòng khiên và hào quang hiệu ứng có lợi quanh hồn sư (Miễn sát thương là vòm sáng); trên hồn thú: biểu tượng
   * trạng thái dùng chung (mỗi tầng một chấm), màu phủ khi Thiêu đốt / Trúng độc / Cảm điện, dây trói dưới chân, sao choáng.
   */
  drawStatus(g: Phaser.GameObjects.Graphics, st: any, time: number) {
    st.players.forEach((p: any, id: string) => {
      const v = this.players.get(id); if (!v || p.dead) return;
      if (p.ava > 0) {
        // Võ Hồn Chân Thân (8.1a): quầng sáng màu võ hồn, vòng dưới chân và hạt sáng bay lên (ai cũng thấy).
        const c = hex(VOHON[p.vh]?.col ?? "#ffffff"), k = 0.5 + 0.5 * Math.sin(time / 150), { x, y } = v.root;
        g.fillStyle(c, 0.1 + 0.08 * k).fillEllipse(x, y - 16, 42, 54);
        g.lineStyle(2, c, 0.55 + 0.35 * k).strokeEllipse(x, y, 38 + 4 * k, 11);
        for (let j = 0; j < 8; j++) {
          const a = time / 380 + j * 0.79, h = (time / 22 + j * 13) % 44;
          g.fillStyle(j % 2 ? 0xffffff : c, 1 - h / 44).fillRect(x + Math.cos(a) * 15 - 1, y - h, 2, 2);
        }
      }
      if (p.shield > 0) { g.lineStyle(1, 0x9ad8ff, 0.55 + 0.25 * Math.sin(time / 200)); g.strokeEllipse(v.root.x, v.root.y - 12, 26, 30); }
      if (p.lei > 0) {
        const k = p.lei / PHONG_LOI.max, n = 1 + Math.floor(k * 4);
        for (let j = 0; j < n; j++) {
          const a = time / 260 + j * 1.9, x = v.root.x + Math.cos(a) * 10, y = v.root.y - 10 + Math.sin(a) * 9;
          g.lineStyle(1, j % 2 ? 0xe8f6ff : 0x5ab8ff, 0.4 + 0.5 * k); g.lineBetween(x, y, x + 2, y + 3); g.lineBetween(x + 2, y + 3, x, y + 5);
        }
      }
      if (p.buff & buffBit("inv")) {
        g.fillStyle(0xfff2b0, 0.18 + 0.08 * Math.sin(time / 120)).fillEllipse(v.root.x, v.root.y - 12, 32, 36);
        g.lineStyle(2, 0xfff2b0, 0.9).strokeEllipse(v.root.x, v.root.y - 12, 32, 36);
      }
      // Trạng thái do chiêu báo trước của hồn thú gây (3.5): dây trói dưới chân, sao choáng và biểu tượng trên danh hiệu.
      if (p.st) {
        const ph = (x: (typeof PLAYER_STATUS)[number]) => (p.st & statusBit(x)) !== 0;
        if (ph("root")) {
          g.lineStyle(1, hex(STATUS.root.col), 0.9).strokeEllipse(v.root.x, v.root.y, 18, 5);
          for (let j = 0; j < 4; j++) { const x = v.root.x - 8 + j * 5.3; g.lineBetween(x, v.root.y + 1, x + 1, v.root.y - 5 - (j % 2) * 2); }
        }
        const icons = STATUS_ICONS.filter((x) => PLAYER_STATUS.includes(x) && ph(x));
        this.statusIcons(g, v.root.x, v.root.y - 54, icons, {});
        if (ph("stun")) this.stunStars(g, v.root.x, v.root.y - 26, time);
      }
      let k = 0;
      for (const b of BUFF_IDS) {
        if (b === "inv" || !(p.buff & buffBit(b))) continue;
        if (b === "phoenix") {
          // Lãnh vực phượng hoàng: vòng lửa bán kính phoenixFieldR đi theo hồn sư (rộng hơn khi Tà Hỏa Phượng Hoàng Chân Thân, 8.1b),
          // tàn lửa xoay quanh mép.
          const c = hex(BUFFS.phoenix.col), R = phoenixFieldR(VOHON[p.vh]?.id ?? "", p.ava > 0);
          g.fillStyle(c, 0.07).fillEllipse(v.root.x, v.root.y - 2, R * 2, R * 1.2);
          g.lineStyle(1, c, 0.45 + 0.2 * Math.sin(time / 180)).strokeEllipse(v.root.x, v.root.y - 2, R * 2, R * 1.2);
          for (let j = 0; j < 6; j++) { const a = time / 900 + (j / 6) * Math.PI * 2; g.fillStyle(j % 2 ? 0xffe08a : c, 0.9).fillRect(v.root.x + Math.cos(a) * R - 1, v.root.y - 2 + Math.sin(a) * R * 0.6 - 1, 2, 2); }
          continue;
        }
        const a = time / 400 + k * 1.6, c = hex(BUFFS[b].col); k++;
        g.fillStyle(c, 0.9).fillRect(v.root.x + Math.cos(a) * 11 - 1, v.root.y - 8 + Math.sin(a) * 4 - 1, 2, 2);
        g.lineStyle(1, c, 0.35).strokeEllipse(v.root.x, v.root.y - 1, 18 + k * 3, 6 + k);
      }
    });
    st.beasts.forEach((b: any, id: string) => {
      const s = this.beasts.get(id); if (!s) return;
      const has = (x: keyof typeof STATUS) => (b.st & statusBit(x)) !== 0, size = TIERS[b.tier].size, top = beastTop(s, b.tier);
      // Màu phủ lên hồn thú: Cảm điện nháy lam, Thiêu đốt cam, Trúng độc lục. Hết trạng thái thì bỏ màu đã phủ
      // (sprite theo loài tự đặt lại màu hung hăng mỗi khung trong syncBeastSprite).
      const tint = has("shock") && Math.floor(time / 150) % 3 === 0 ? 0x7fd0ff : has("burn") ? (Math.floor(time / 200) % 2 ? 0xffa060 : 0xff7a2a) : has("poison") ? 0x8ef08a : 0;
      if (tint) { s.setTint(tint); s.setData("stTint", true); } else if (s.getData("stTint")) { s.clearTint(); s.setData("stTint", false); }
      if (has("root")) {
        g.lineStyle(1, hex(STATUS.root.col), 0.9).strokeEllipse(s.x, s.y, size + 8, 5);
        for (let k = 0; k < 4; k++) { const x = s.x - size / 2 - 2 + (k * (size + 4)) / 3; g.lineBetween(x, s.y + 1, x + 1, s.y - 4 - (k % 2) * 2); }
      }
      // Biểu tượng trạng thái hàng ngang trên thanh máu: hình riêng mỗi loại, số tầng là chấm nhỏ bên dưới.
      const icons = STATUS_ICONS.filter(has);
      this.statusIcons(g, s.x, top - 13, icons, { burn: b.burn, poison: b.poison, armor: b.armor, allure: b.allure, lock: b.lock });
      // Mê hoặc (2.5c): tim hồng xoay trên đầu, hồn thú đi lung tung.
      if (has("charm")) {
        const y = top - 6 - (icons.length ? 9 : 0);
        for (let k = 0; k < 3; k++) {
          const a = time / 220 + k * 2.1, x = s.x + Math.cos(a) * 8, sy = y + Math.sin(a) * 2.5;
          g.fillStyle(hex(STATUS.charm.col), 1).fillCircle(x - 1, sy - 1, 1.3).fillCircle(x + 1, sy - 1, 1.3).fillTriangle(x - 2.3, sy - 0.6, x + 2.3, sy - 0.6, x, sy + 2);
        }
      }
      if (has("stun")) this.stunStars(g, s.x, top - 6 - (icons.length ? 9 : 0), time);
    });
  }

  /** Sao choáng xoay quanh đầu (hồn thú, và hồn sư từ 3.5). */
  stunStars(g: Phaser.GameObjects.Graphics, cx: number, y: number, time: number) {
    g.lineStyle(1, 0xffe08a, 0.7); g.strokeEllipse(cx, y, 16, 5);
    for (let k = 0; k < 3; k++) {
      const a = time / 180 + k * 2.1, x = cx + Math.cos(a) * 8, sy = y + Math.sin(a) * 2.5;
      g.fillStyle(0x1a1020, 1).fillRect(x - 2, sy - 2, 4, 4); g.fillStyle(0xffe08a, 1).fillRect(x - 1, sy - 1, 2, 2);
    }
  }

  /** Hàng biểu tượng trạng thái căn giữa `cx`, mép trên `y0`: hình riêng mỗi loại, số tầng là chấm nhỏ bên dưới. */
  statusIcons(g: Phaser.GameObjects.Graphics, cx: number, y0: number, icons: readonly string[], stacks: Record<string, number>) {
    let x = cx - (icons.length * 7 - 2) / 2;
    for (const k of icons) {
      const c = hex(STATUS[k as keyof typeof STATUS].col);
      g.fillStyle(0x1a1020, 0.85).fillRect(x - 1, y0 - 1, 7, 7);
      g.fillStyle(c, 1);
      if (k === "burn") g.fillTriangle(x, y0 + 5, x + 5, y0 + 5, x + 2.5, y0);
      else if (k === "shock") { g.lineStyle(1, c, 1); g.lineBetween(x + 3, y0, x + 1, y0 + 3); g.lineBetween(x + 1, y0 + 3, x + 4, y0 + 2); g.lineBetween(x + 4, y0 + 2, x + 2, y0 + 5); }
      else if (k === "poison") { g.fillCircle(x + 2.5, y0 + 3.2, 2); g.fillRect(x + 2, y0, 1, 2); }
      else if (k === "vuln") g.fillTriangle(x, y0 + 1, x + 5, y0 + 1, x + 2.5, y0 + 5);
      else if (k === "armor") { g.fillRect(x, y0, 5, 3); g.fillRect(x + 1, y0 + 3, 3, 2); g.fillStyle(0x1a1020, 1).fillRect(x + 2, y0, 1, 4); }
      else if (k === "allure") { g.fillCircle(x + 1.5, y0 + 1.8, 1.4); g.fillCircle(x + 3.5, y0 + 1.8, 1.4); g.fillTriangle(x, y0 + 2.3, x + 5, y0 + 2.3, x + 2.5, y0 + 5); }
      else if (k === "lock") { g.lineStyle(1, c, 1); g.strokeRect(x + 0.5, y0 + 2.5, 4, 2.5); g.strokeCircle(x + 2.5, y0 + 2, 1.5); }
      else if (k === "slow") { g.fillRect(x, y0 + 4, 5, 1); g.fillTriangle(x + 1, y0, x + 4, y0, x + 2.5, y0 + 3); }
      else { g.lineStyle(1, c, 1); g.strokeCircle(x + 2.5, y0 + 2.5, 2.2); g.lineBetween(x + 1, y0 + 4, x + 4, y0 + 1); }
      for (let n = 0; n < (stacks[k] ?? 0) && n < 5; n++) g.fillStyle(c, 1).fillRect(x + n * 1.2, y0 + 6.5, 1, 1);
      x += 7;
    }
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
    st.beasts.forEach((b: any) => { if (b.tier >= 3 && !b.rank) { ctx.fillStyle = b.tier === 4 ? "#ff3b3b" : "#8a6bff"; ctx.fillRect((b.x / TILE) | 0, (b.y / TILE) | 0, 1, 1); } });
    // Hang thú vương (BĐ5): khung đỏ sẫm.
    if (this.lair) { ctx.strokeStyle = "#7a1f2a"; ctx.lineWidth = 1; ctx.strokeRect((this.lair.x / TILE | 0) + 0.5, (this.lair.y / TILE | 0) + 0.5, this.lair.w / TILE | 0, this.lair.h / TILE | 0); }
    // Tinh anh (BĐ4): chấm sáng 3×3 màu aura, viền tối, nhấp nháy, khi còn sống (mục 5.4). Thú vương (BĐ5): chấm 5×5.
    const on = Math.floor(this.time.now / 400) % 2 === 0;
    st.beasts.forEach((b: any) => {
      if (!b.rank) return; const x = (b.x / TILE) | 0, y = (b.y / TILE) | 0, r = b.rank >= 2 ? 2 : 1;
      ctx.fillStyle = "#1a1020"; ctx.fillRect(x - r - 1, y - r - 1, 2 * r + 3, 2 * r + 3);
      ctx.fillStyle = on ? BOSSES[b.species]?.aura ?? "#ffffff" : "#ffffff"; ctx.fillRect(x - r, y - r, 2 * r + 1, 2 * r + 1);
    });
    // Đồng đội trong tổ đội (7.1): chấm xanh lá 3×3 viền tối, vẽ sau người khác cho nổi lên.
    const mates = new Set((this.party?.members ?? []).filter((m) => !m.me && m.sid).map((m) => m.sid));
    st.players.forEach((p: any, id: string) => {
      if (id === this.me || mates.has(id)) return; ctx.fillStyle = "#7fd0ff"; ctx.fillRect(((p.x / TILE) | 0) - 1, ((p.y / TILE) | 0) - 1, 2, 2);
    });
    st.players.forEach((p: any, id: string) => {
      if (!mates.has(id)) return; const x = (p.x / TILE) | 0, y = (p.y / TILE) | 0;
      ctx.fillStyle = "#0c2a12"; ctx.fillRect(x - 2, y - 2, 5, 5); ctx.fillStyle = "#7dff8a"; ctx.fillRect(x - 1, y - 1, 3, 3);
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
        const layer = (o: { x: number; y: number }) => this.make.sprite({ key: "hs_body_m_0" }, false).setOrigin(o.x, o.y);
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
        v = { root, body, outfit, hair, vb, vf, ringsB, ringsF, label, title, looks: "", vh: -1, rings: "", playing: "", act: null, hurtT: -1e9, lit: null, fly: null };
        this.players.set(id, v);
        if (id === this.me) this.cameras.main.startFollow(root, true, 0.2, 0.2);
      }
      const { root, label, title } = v;
      const mine = id === this.me && this.pred;
      if (mine) { const at = this.pred!.update(p, this.dir, dt); root.setPosition(at.x, at.y); }
      else if (Math.hypot(p.x - root.x, p.y - root.y) > 64) root.setPosition(p.x, p.y);
      else root.setPosition(root.x + (p.x - root.x) * lerp, root.y + (p.y - root.y) * lerp);
      root.setDepth(root.y);
      // Ngoại hình hồn sư (sex, hair, hairCol, outfitCol) và võ hồn ra trận đồng bộ từ server, ai cũng thấy.
      const looks = `${p.sex}|${p.hair}|${p.hairCol}|${p.outfitCol}`;
      if (looks !== v.looks) { v.looks = looks; v.playing = ""; const t = looksTextures(this, p); v.outfit.setTexture(t.outfit); v.hair.setTexture(t.hair); }
      if (p.vh !== v.vh) { v.vh = p.vh; const [kb, kf] = vohonTextures(this, p.vh); v.vb.setTexture(kb); v.vf.setTexture(kf); }
      const rings = [...p.rings].join(",");
      if (rings !== v.rings) { v.rings = rings; this.buildRings(v, [...p.rings]); }
      // Chính mình khi dự đoán: chạy animation đi và quay hướng ngay theo phím, không chờ cờ `moving` của server.
      const own = mine ? { walk: this.pred!.walking(p, this.dir), dir: this.pred!.look(p, this.dir) } : undefined;
      this.animatePlayer(v, p, time, own);
      // Tàng hình (Yêu Hồ, 2.5c): người khác thấy mờ hẳn, chính mình thấy nửa trong suốt.
      const hidden = (p.buff & buffBit("hide")) !== 0, a = hidden ? (id === this.me ? 0.5 : 0.22) : 1;
      if (v.root.alpha !== a) { v.root.setAlpha(a); label.setAlpha(a); title.setAlpha(a); }
      // Võ Hồn Chân Thân (8.1a): phóng to dần (bộ sprite riêng làm sau, mục 5.11); hào quang vẽ trong drawStatus.
      const sc = p.ava > 0 && !p.dead ? CHAN_THAN_SCALE : 1;
      if (root.scale !== sc) root.setScale(Math.abs(sc - root.scale) < 0.01 ? sc : root.scale + (sc - root.scale) * lerp);
      const up = (root.scale - 1) * 30;
      label.setPosition(root.x, root.y - (this.isArena ? 31 : 30) - up).setVisible(!p.dead).setText(`${p.name} (${p.level})`);
      // Đồng đội trong tổ đội (7.1): tên màu xanh lá.
      const col = id === this.me ? "#ffe9a0" : this.party?.members.some((m) => !m.me && m.sid === id) ? "#7dff8a" : "#ffffff";
      if (label.style.color !== col) label.setColor(col);
      // Danh hiệu theo cấp võ hồn đang ra trận (mục 5.1).
      title.setPosition(root.x, root.y - 38 - up).setVisible(!p.dead).setText(titleOf(p.level));
    });
    for (const [id, v] of this.players) if (!seenP.has(id)) { v.root.destroy(); v.label.destroy(); v.title.destroy(); this.players.delete(id); }
    const meS = this.ghost && st.players.get(this.me);
    if (meS) this.ghost!.clear().lineStyle(1, 0xff4040, 1).strokeRect(meS.x - 6, meS.y - 22, 12, 24);

    // hồn thú
    const seenB = new Set<string>();
    st.beasts.forEach((b: any, id: string) => {
      seenB.add(id);
      let s = this.beasts.get(id);
      if (!s) { s = this.add.sprite(b.x, b.y, `b${b.tier}_0`).setOrigin(BEAST_ORIGIN.x, BEAST_ORIGIN.y); this.beasts.set(id, s); }
      s.setPosition(s.x + (b.x - s.x) * lerp, s.y + (b.y - s.y) * lerp);
      // Loài đã có ảnh thật (M4) thì dùng sheet beast_{loài}; chưa có thì vẽ bằng code theo bậc.
      // Báo trước chiêu (3.5): sheet theo loài giữ khung đầu `attack`; sprite vẽ bằng code thì phồng lên co lại.
      // Tinh anh (BĐ4): sprite của loài gốc (BOSSES.species) phóng ELITE.scale.
      const k = rankScale(b.rank);
      if (!syncBeastSprite(s, beastBase(b.rank, b.species)?.id, b.moving, b.aggro, b.cast)) {
        s.setTexture(`b${b.tier}_${b.moving ? step : 0}${b.aggro ? "a" : ""}`);
        s.setScale(k * (b.cast ? 1.08 + 0.06 * Math.sin(time / 60) : 1));
      } else if (s.scale !== k) s.setScale(k);
      // Cuồng nộ: nháy đỏ (đè màu hung hăng; sprite theo loài tự đặt lại màu hung hăng mỗi khung).
      if (b.buff & beastBuffBit("rage") && Math.floor(time / 160) % 2) { s.setTint(0xff7050); s.setData("rgTint", true); }
      else if (s.getData("rgTint")) { s.clearTint(); s.setData("rgTint", false); }
      if (b.rank && s.getData("bscale") !== k) s.setData("bscale", k);
      // Boss thế giới đang lặn (Du Thủy, BĐ6e): chỉ còn bóng mờ dưới nước.
      s.setAlpha(b.dive ? 0.2 : 1);
      s.setFlipX(b.face < 0).setDepth(s.y);
      if (b.rank) {
        let lb = this.eliteLabels.get(id);
        if (!lb) {
          lb = this.add.text(s.x, s.y, beastName(b.rank, b.species), { fontFamily: FONT, fontSize: b.rank >= 2 ? "9px" : "7px", fontStyle: "800",
            color: BOSSES[b.species]?.aura ?? "#ffffff", stroke: "#000", strokeThickness: 2, resolution: 8 }).setOrigin(0.5, 1);
          this.eliteLabels.set(id, lb);
        }
        // Boss thế giới (BĐ6e): điểm yếu hệ đang hiện ghi ngay dưới tên.
        const txt = beastName(b.rank, b.species) + (b.rank === 3 && b.weak ? `\nĐiểm yếu: ${HE[HE_IDS[b.weak - 1]].name}` : "");
        if (lb.text !== txt) lb.setText(txt);
        lb.setPosition(s.x, beastTop(s, b.tier) - (b.hp < b.maxHp ? 5 : 2)).setDepth(99984);
      }
    });
    for (const [id, s] of this.beasts) if (!seenB.has(id)) { s.destroy(); this.beasts.delete(id); }
    for (const [id, lb] of this.eliteLabels) if (!seenB.has(id)) { lb.destroy(); this.eliteLabels.delete(id); }

    // hồn hoàn rơi
    const seenD = new Set<string>();
    st.drops.forEach((d: any, id: string) => {
      seenD.add(id);
      let v = this.drops.get(id);
      if (!v) {
        // Màu hồn hoàn theo số năm (bậc suy từ số năm), số năm ghi ngay dưới. Mảnh võ hồn (3.4): tinh thể màu võ hồn, tên ghi dưới.
        // Hồn cốt (4.1): biểu tượng vị trí màu theo số năm, ghi "Hồn cốt Tay phải".
        // Hồn hạch (5.1): viên hạch màu bộ (texture `core_<bộ>`), ghi "Hồn hạch Bộ N★".
        const bone = d.item === BONE_ITEM ? BONE_SLOTS[d.slot] : undefined, core = d.item === CORE_ITEM ? CORE_SETS[d.cset] : undefined;
        const it = d.item ? itemDef(d.item) : undefined, col = core ? core.col : it && !bone ? it.col : hud.ringColor(d.tier);
        const img = this.add.image(d.x, d.y - 4, core ? `core_${core.id}` : bone ? `bone_${bone.id}` : it ? "shard" : `ring${d.tier}`).setDepth(d.y - 1);
        if (it && !core) img.setTint(hex(col));
        if (bone) img.setScale(2); // biểu tượng 9×9 điểm ảnh: phóng đôi cho dễ thấy giữa cỏ
        if (core) img.setScale(1.3);
        const name = core ? coreName(core.id, d.stars) : bone ? `Hồn cốt ${bone.name}` : it ? `${d.qty > 1 ? `${d.qty} ` : ""}${it.name}` : d.item ? "Vật phẩm lạ" : formatYears(d.years);
        const txt = this.add.text(d.x, d.y + (core ? 18 : bone ? 12 : 4), name, { // hồn cốt, hồn hạch: dưới nhãn số năm của hồn hoàn (và hồn cốt) nằm cạnh
          fontFamily: FONT, fontSize: "6px", fontStyle: "700", color: col, stroke: "#000", strokeThickness: 2, resolution: 8,
        }).setOrigin(0.5, 0).setDepth(d.y - 1);
        v = { img, txt }; this.drops.set(id, v);
      }
      v.img.y = d.y - 4 - (0.5 + 0.5 * Math.sin(time / 250)) * 2;
      const a = d.ttl < 8 ? (Math.floor(time / 160) % 2 ? 0.4 : 1) : 1;
      v.img.setAlpha(a); v.txt.setAlpha(a);
    });
    for (const [id, v] of this.drops) if (!seenD.has(id)) { v.img.destroy(); v.txt.destroy(); this.drops.delete(id); }

    // vẽ phủ: thanh máu, vòng uy áp, hiệu ứng hấp thụ
    const g = this.ov; g.clear();
    st.beasts.forEach((b: any, id: string) => {
      const s = this.beasts.get(id)!, t = TIERS[b.tier];
      if (b.tier >= 1) { g.lineStyle(1, hex(t.glow), 0.4 + 0.2 * Math.sin(time / 300)); g.strokeEllipse(s.x, s.y, t.size + 6, 6); }
      if (b.hp < b.maxHp) {
        const w = Math.max(14, t.size + 4);
        const y = beastTop(s, b.tier) - 2;
        g.fillStyle(0x000000, 0.6).fillRect(s.x - w / 2, y, w, 2);
        g.fillStyle(b.tier === 0 ? 0xe0525a : hex(t.glow), 1).fillRect(s.x - w / 2, y, w * Math.max(0, b.hp / b.maxHp), 2);
      }
    });
    // Sân đấu (7.2): thanh sinh lực võ hồn ra trận trên đầu cả hai hồn sư (mình xanh, đối thủ đỏ).
    if (this.isArena) st.players.forEach((p: any, id: string) => {
      const v = this.players.get(id); if (!v || p.dead) return;
      const w = 22, x = v.root.x - w / 2, y = v.root.y - 29;
      g.fillStyle(0x000000, 0.65).fillRect(x - 1, y - 1, w + 2, 4);
      g.fillStyle(id === this.me ? 0x5fd08a : 0xe0525a, 1).fillRect(x, y, w * Math.max(0, Math.min(1, p.hp / Math.max(1, p.maxHp))), 2);
    });
    st.players.forEach((p: any, id: string) => {
      if (p.absorb <= 0) return; const v = this.players.get(id)!, t = TIERS[p.absorbTier], k = p.absorb, { x, y } = v.root;
      g.lineStyle(3, hex(t.col), 0.9); g.strokeEllipse(x, y - 4 - k * 6, 24 - k * 6, 8);
      for (let i = 0; i < 3; i++) { const a = time / 330 + i * 2.1; g.fillStyle(hex(t.glow), 1).fillRect(x + Math.cos(a) * (16 - k * 10) - 1, y - 8 + Math.sin(a) * (8 - k * 5) - 1, 2, 2); }
    });

    this.drawStatus(g, st, time);
    for (const n of this.npcs) if (n.body) syncLayers(n.body, n.clothes, []); // NPC (6.1): áo, tóc theo khung thân
    this.drawTeles(time);
    this.drawAuras(g, st, time);

    // độ tối theo độ sâu của rừng
    const me = st.players.get(this.me);
    if (me) {
      const vb = this.vignetteBase, depth = Math.max(0, Math.min(1, (me.x / TILE - 18) / 60));
      this.vignette.setAlpha(vb === null ? 0 : (vb + (1 - vb) * depth) * 0.75);
      this.hudT -= dt;
      if (this.hudT <= 0) { this.hudT = 0.08; this.updateHud(me); this.updateNpcs(me); }
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
   * `own` (chính mình khi dự đoán chuyển động): đang tự đi không và hướng nhìn theo phím; thiếu thì đọc `moving` / `dir` của server.
   */
  animatePlayer(v: PView, p: any, time: number, own?: { walk: boolean; dir: number }) {
    if (v.act && time >= v.act.t0 + animMs(v.act.anim)) v.act = null;
    const moving = own ? own.walk : p.moving;
    const anim: HsAnim = p.dead ? "die" : p.absorb > 0 ? "absorb" : v.act?.anim ?? (moving ? "walk" : "idle");
    const { key, flip } = honsuAnimKey(bodyKey(p), anim, DIRS4[own ? own.dir : p.dir] ?? "down");
    const tag = `${key}|${v.act?.anim === anim ? v.act.t0 : ""}`; // đánh liên tiếp thì phát lại từ đầu
    if (tag !== v.playing) { v.playing = tag; v.body.play(key); }
    v.body.setFlipX(flip);
    syncLayers(v.body, [v.outfit, v.hair], [v.vb, v.vf]);
    // Bay (2.5b): nhấc mọi lớp trừ bóng lên tối đa 10 pixel theo nửa sóng sin.
    const fe = v.fly ? (time - v.fly.t0) / v.fly.ms : 1; if (fe >= 1) v.fly = null;
    const lift = fe < 1 ? -Math.round(Math.sin(Math.PI * Math.max(0, fe)) * 10) : 0;
    for (const s of [v.body, v.outfit, v.hair, v.vb, v.vf, v.ringsB, v.ringsF]) s.y = lift;
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

  /**
   * Bảng đội hình kèm hồn cốt (bước 4.2), hồn hạch (bước 5.2) và mảnh võ hồn (bước 3.4): số mảnh, hồn cốt và hồn hạch (đang gắn /
   * trong túi) từ tin riêng "bag",
   * võ hồn từ tin riêng "vohons".
   */
  renderRoster() {
    if (!this.owned) return;
    const shards = new Map<string, number>();
    for (const it of this.bag?.items ?? []) {
      const vh = it.vohon === null ? itemDef(it.code)?.vohon : undefined;
      if (vh) shards.set(vh, (shards.get(vh) ?? 0) + it.qty);
    }
    hud.renderRoster(this.owned, {
      setTeam: (slots) => this.room.send("team", { slots }),
      unlock: (vohon) => this.room.send("unlock", { vohon }),
      starUp: (vohon) => this.room.send("starup", { vohon }),
      equip: (itemId, vohonId, slot) => this.room.send("equip", { itemId, vohonId, slot }),
      unequip: (itemId) => this.room.send("unequip", { itemId }),
      equipCore: (itemId, vohonId, slot) => this.room.send("equipcore", { itemId, vohonId, slot }),
      unequipCore: (itemId) => this.room.send("unequipcore", { itemId }),
      enhance: (targetId, materialIds) => this.room.send("enhance", { targetId, materialIds }),
      enhanceCore: (targetId, materialIds) => this.room.send("enhancecore", { targetId, materialIds }), // nâng cấp hồn hạch (5.3)
      portrait: (vohon) => this.portrait(vohon),
      combat: () => this.combat,
      loadout: (rowId, skills) => this.room.send("loadout", { rowId, skills }), // 4 ô hồn kỹ mang theo (8.1a)
    }, shards, this.bag?.items ?? []);
  }

  portraits = new Map<string, string>(); // ảnh võ hồn trong bảng hồn cốt theo mã võ hồn (data URL), của ngoại hình `portraitLooks`
  portraitLooks = "";
  /**
   * Ảnh 48×48 hồn sư của mình phóng thích võ hồn `vohon` (khung đứng yên hướng xuống: phụ thể sau, thân, áo, tóc, phụ thể trước),
   * ghép từ đúng các texture trên bản đồ, cho khung hồn cốt (4.2). Chưa có hồn sư trong state thì "".
   */
  portrait(vohon: string) {
    const me = this.room.state.players.get(this.me); if (!me) return "";
    const looks = `${me.sex}|${me.hair}|${me.hairCol}|${me.outfitCol}`;
    if (looks !== this.portraitLooks) { this.portraits.clear(); this.portraitLooks = looks; } // đổi ngoại hình: ảnh cũ bỏ đi
    const hit = this.portraits.get(vohon);
    if (hit) return hit;
    const t = looksTextures(this, me), [kb, kf] = vohonTextures(this, Math.max(0, vohonIndex(vohon)));
    const cv = document.createElement("canvas"); cv.width = 48; cv.height = 48;
    const ctx = cv.getContext("2d")!;
    // Chân ở (24, 40): thân 32×32 gốc HS_ORIGIN (16, 30), phụ thể 48×48 gốc VH_ORIGIN (24, 38).
    const draw = (k: string, o: { x: number; y: number }) => {
      if (!this.textures.exists(k)) return;
      const f = this.textures.getFrame(k, 0);
      ctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, f.cutWidth, f.cutHeight,
        24 - f.cutWidth * o.x, 40 - f.cutHeight * o.y, f.cutWidth, f.cutHeight);
    };
    draw(kb, VH_ORIGIN); draw(t.body, HS_ORIGIN); draw(t.outfit, HS_ORIGIN); draw(t.hair, HS_ORIGIN); draw(kf, VH_ORIGIN);
    const url = cv.toDataURL();
    this.portraits.set(vohon, url);
    return url;
  }

  renderBag() {
    if (!this.bag) return;
    hud.renderBag(this.bag, {
      use: (id) => this.room.send("use", { id }),
      absorb: (id, vohonId) => this.room.send("absorb", { itemId: id, vohonId }),
      discard: (id) => this.room.send("discard", { id }),
      open: (id) => this.room.send("open", { id }), // rương thú vương (BĐ5): server tung phần thưởng
      absorbOptions: (years) => this.absorbOptions(years),
      herb: (id, vohonId) => this.room.send("use", { id, vohonId }), // tiên thảo (BĐ6b): dùng cho võ hồn đã chọn
      herbOptions: (code) => (this.owned?.list ?? []).map((v) => {
        const def = VOHON[Math.max(0, vohonIndex(v.vohon))];
        return { rowId: v.rowId, name: def.name, col: def.col, level: v.level, active: v.rowId === this.owned?.active, n: v.herbs?.[code] ?? 0 };
      }),
      combat: () => this.combat,
      refresh: () => this.room.send("vohons"),
      enhance: (targetId, materialIds) => this.room.send("enhance", { targetId, materialIds }),
      enhanceCore: (targetId, materialIds) => this.room.send("enhancecore", { targetId, materialIds }), // nâng cấp hồn hạch (5.3)
    });
  }

  /**
   * Các võ hồn sở hữu và rủi ro khi hấp thụ hồn hoàn `years` năm (mục 5.2; chỉ hiển thị, server kiểm tra lại). Võ hồn đang ra
   * trận lấy cấp / số hồn hoàn từ state (mới nhất), võ hồn khác từ tin riêng "vohons".
   */
  absorbOptions(years: number): hud.AbsorbOption[] {
    const me = this.room.state.players.get(this.me);
    return (this.owned?.list ?? []).map((v) => {
      const active = v.rowId === this.owned?.active, def = VOHON[Math.max(0, vohonIndex(v.vohon))];
      const level = active && me ? me.level : v.level, rings = active && me ? me.rings.length : v.rings.length, slot = rings + 1;
      const ch = absorbChance(years, slot);
      const reason = rings >= MAX_RINGS ? `Đã đủ ${MAX_RINGS} hồn hoàn`
        : !atBottleneck(level, rings) ? `Chưa tới bình cảnh (cần cấp ${slot * 10})`
        : ch.fail === null ? `Vượt giới hạn ${ch.over}%: không thể hấp thụ` : "";
      return { rowId: v.rowId, name: def.name, col: def.col, level, slot, limit: ch.limit, over: ch.over, fail: ch.fail, secs: absorbSecs(years), active, reason };
    });
  }

  /** Bản đồ đang đứng có boss thế giới (Lõi Tinh Đấu, BĐ6e). */
  worldBossHere() { return !!MAPS[this.room.state.mapId]?.world?.length; }

  /**
   * Tin "boss" riêng của boss thế giới (BĐ6e): báo trước / bị hạ toàn server có chữ "Boss thế giới"; trong Lõi Tinh Đấu thêm các cơ chế
   * buộc đổi võ hồn (điểm yếu hệ, Bá Thể, tích lực phải ngắt, Du Thủy, độc toàn sàn, nổi giận). Trả true nếu đã xử lý xong tin này.
   */
  worldBossMsg(m: any, col: string) {
    if (m.k === "warn" && m.world) {
      hud.setBossCountdown({ name: m.name, mapName: m.mapName, here: m.here, secs: m.in, col });
      hud.log(`${m.name} sẽ xuất hiện ở ${m.mapName} sau ${Math.max(1, Math.round(m.in / 60))} phút!`, col, "Hệ thống");
      hud.banner(`${m.name} sắp xuất hiện`, `${m.mapName} · ${Math.max(1, Math.round(m.in / 60))} phút nữa`);
      return true;
    }
    const he = (id: string) => HE[id as keyof typeof HE]?.name ?? id;
    switch (m.k) {
      case "weak":
        hud.setBossWeak(m.secs);
        hud.banner(`Điểm yếu: ${he(m.he)}`, `Võ hồn ${he(m.he)} gây x${String(m.mult).replace(".", ",")}, hệ khác x${String(m.off).replace(".", ",")} trong ${m.secs} giây: đổi võ hồn (phím 1–4)!`);
        hud.log(`Boss lộ điểm yếu hệ ${he(m.he)} trong ${m.secs} giây.`, "#ffe08a");
        return true;
      case "weakEnd": return true;
      case "charge":
        this.charging = true;
        hud.banner(`${m.name}: tích lực ${m.secs} giây!`, `Cần ${m.need} lần khống chế của võ hồn Khống chế để ngắt`);
        hud.log(`Boss tích lực ${m.name}: cần ${m.need} lần khống chế (Choáng, Trói, Câm lặng…) của võ hồn Khống chế để ngắt.`, "#ff8a6a");
        return true;
      case "brk": hud.log(`${m.by} khống chế trúng: ngắt ${m.n}/${m.need}.`, "#9ad8ff"); return true;
      case "broken":
        this.charging = false;
        hud.banner(`Đã ngắt ${m.name}!`, `${m.by} ngắt chiêu · boss Choáng ${m.secs} giây`);
        return true;
      case "chargeHit":
        this.charging = false;
        hud.log(`${m.name} không bị ngắt: cả sàn trúng Vết thương sâu (Phá giáp nặng). Chỉ thanh tẩy của võ hồn phụ trợ giải được.`, "#ff6a5a");
        return true;
      case "floor":
        hud.banner(m.name, m.name === "Bạo Nộ" ? "Chiêu toàn sàn: không né được!" : "Độc toàn sàn: Vết thương sâu, nhờ võ hồn phụ trợ thanh tẩy");
        return true;
      case "armor":
        hud.banner(`${m.name}!`, `Khiên ${m.secs} giây: võ hồn ${he(m.he)} phá khiên nhanh gấp ${m.mult}`);
        hud.log(`Boss khoác ${m.name}: võ hồn ${he(m.he)} phá khiên nhanh gấp ${m.mult}; không phá kịp thì boss hồi máu.`, "#9ad8ff");
        return true;
      case "armorBreak": hud.log(`${m.by} phá vỡ ${m.name}!`, "#9ad8ff"); return true;
      case "armorEnd": if (m.heal > 0) hud.log(`${m.name} không bị phá: boss hồi ${Number(m.heal).toLocaleString("vi-VN")} máu.`, "#ff8a6a"); return true;
      case "dive": hud.banner(`${m.name}!`, `Boss lặn xuống hồ ${m.secs} giây: chờ nổi lên, mẫn công lướt tới trước`); return true;
      case "surface": return true;
      case "rage":
        hud.setBossLife(m.life); hud.setBossRage(0);
        hud.banner("NỔI GIẬN!", `Sát thương x${m.dmg}, chiêu toàn sàn mỗi ${m.every} giây`);
        hud.log(`${m.name} nổi giận: sát thương x${m.dmg}, đánh nhanh hơn, chiêu toàn sàn mỗi ${m.every} giây.`, col);
        return true;
    }
    if (m.k === "reset" || m.k === "down" || m.k === "leave") this.charging = false;
    return false;
  }

  updateHud(me: any) {
    const st = this.room.state;
    // Câu gợi ý hấp thụ trong túi phụ thuộc cấp và số hồn hoàn: đổi thì vẽ lại túi.
    const bagKey = `${me.vh}|${me.level}|${me.rings.length}`;
    if (bagKey !== this.bagKey) { this.bagKey = bagKey; this.renderBag(); }
    // Số năm từng hồn hoàn (chú thích sức mạnh hồn kỹ) lấy từ tin riêng "vohons" khi đúng võ hồn đang ra trận.
    const own = this.owned?.list.find((v) => v.rowId === this.owned?.active), years = own && VOHON[me.vh]?.id === own.vohon ? own.rings : null;
    // Từ 8.1a: 4 ô hồn kỹ mang theo của võ hồn ra trận (tin riêng "vohons"; chưa có thì mặc định vòng 1–4).
    const loadout = own && VOHON[me.vh]?.id === own.vohon ? own.skills : DEFAULT_LOADOUT;
    const skKey = `${me.vh}|${me.rings.length}|${years?.join(",") ?? ""}|${loadout.join(",")}`;
    if (skKey !== this.skillsKey) { this.skillsKey = skKey; hud.buildSkills(me.vh, [...me.rings], years, loadout, (a) => this.act(a)); }
    // Kỹ năng hồn cốt (4.3): hồn cốt đang gắn trên võ hồn ra trận, lấy từ tin riêng "bag" (trường `vohon`) khi đúng võ hồn ra trận.
    const worn: hud.WornBone[] = own && VOHON[me.vh]?.id === own.vohon ? (this.bag?.items ?? []).flatMap((it) => {
      const b = it.vohon === own.rowId && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
      return b ? [{ beast: b.beast, slot: b.slot, years: it.years!, enhance: it.enhance }] : [];
    }) : [];
    const bKey = JSON.stringify(worn);
    if (bKey !== this.boneSkKey) { this.boneSkKey = bKey; hud.buildBoneSkills(worn, (a) => this.act(a)); }
    hud.updateStats(me);
    hud.updateTeam(me);
    hud.updateBag();
    hud.updateParty();
    // Thú vương (BĐ5): thanh máu lớn đọc thẳng BeastState; bảng xếp hạng khi mình đang tham gia (có trong danh sách đóng góp).
    let kb: any = null; st.beasts.forEach((b: any) => { if (b.rank >= 2) kb = b; });
    // Boss thế giới (BĐ6e): thêm điểm yếu hệ, khiên, ngắt tích lực, lặn; so với hệ võ hồn mình đang ra trận.
    const wdef = kb?.rank === 3 ? BOSSES[kb.species]?.world : undefined, myHe = VOHON[me?.vh ?? 0]?.he ?? "cuong_cong";
    hud.showBoss(kb && { name: beastName(kb.rank, kb.species), hp: kb.hp, maxHp: kb.maxHp, parts: kb.parts, phase: kb.phase,
      title: BOSSES[kb.species]?.phase2?.name ?? "", col: BOSSES[kb.species]?.aura ?? "#ff5a5a",
      world: kb.rank === 3 ? { rage: kb.phase === 2, weak: kb.weak ? HE_IDS[kb.weak - 1] : null, myHe, shield: kb.shield, brk: kb.brk,
        need: wdef?.charge?.need ?? 0, charging: !!this.charging, dive: kb.dive, armorHe: wdef?.armor?.he ?? null } : undefined });
    if (!kb && this.bossList) { this.bossList = null; hud.bossRank(null, this.me); }
    hud.updateBossCd();
    hud.updateArenaQueue();
    // Sân đấu (7.2): thanh trận đấu đọc thẳng ArenaState (pha, giây còn lại, hai bên).
    if (this.isArena && st.sides) {
      hud.showArena({ phase: st.phase, time: st.time, me: this.me, sides: [...st.sides].map((s: any) => ({ sid: s.sid, name: s.name, elo: s.elo, pct: s.pct, alive: s.alive, total: s.total })) },
        () => this.onBack());
      hud.updateArenaEnd();
    }
    // Tên vùng: vùng an toàn > vùng săn > điểm hồi sinh > tên bản đồ. Vừa vào bản đồ thì hiện tên bản đồ.
    const area = this.safes.find((z) => inRect(z, me.x, me.y)) ?? this.zones.find((z) => inRect(z, me.x, me.y));
    const mapName = MAPS[this.mapId]?.name ?? this.mapId;
    const zname = area?.name ?? (this.campName && inRect(this.campRect, me.x, me.y) ? this.campName : mapName);
    document.getElementById("zoneName")!.textContent = zname;
    if (zname !== this.lastZone) {
      if (!this.lastZone) hud.banner(st.channel ? `${mapName} · Kênh ${st.channel}` : mapName, area && area.name !== mapName ? area.name : "");
      else if (area) hud.banner(area.name, area.hint);
      this.lastZone = zname;
    }
    document.getElementById("online")!.textContent = `${st.players.size} người ở ${mapName}`;
    hud.setChannel(st.channel ?? 0);

    let tb: any = null, td = 90;
    st.beasts.forEach((b: any) => { const d = Math.hypot(b.x - me.x, b.y - me.y); if (d < td) { td = d; tb = b; } });
    const sts = tb ? hud.statusText(tb) : "";
    // Cấp tương đương theo số năm (BĐ3) và mức kinh nghiệm còn nhận khi hồn thú thấp hơn võ hồn ra trận (mục 5.3).
    const tLv = tb ? beastLevel(tb.years) : 0, xpk = tb ? xpLevelScale(me.level, tLv) : 1;
    const xpNote = xpk < 1 ? ` <em class="xpcut">kinh nghiệm ${Math.round(xpk * 100)}%</em>` : "";
    hud.showTarget(tb ? `<span class="dot" style="color:${hud.ringColor(tb.tier)}"></span>${beastName(tb.rank, tb.species)} · ${formatYears(tb.years)} · cấp ${tLv}${xpNote} – ${tb.hp}/${tb.maxHp}` + (sts ? `<small>${sts}</small>` : "") : null);

    // Hồn hoàn dưới đất trong tầm nhặt: nhấn E (hoặc nút "Nhặt") để cho vào túi; hấp thụ trong túi đồ.
    let dr: any = null, dd = PICKUP_RANGE;
    st.drops.forEach((d: any) => { const k = Math.hypot(d.x - me.x, d.y - me.y); if (k < dd) { dd = k; dr = d; } });
    if (dr && me.absorb <= 0) {
      // Từ 7.1 đồ rơi của tổ đội mình (DropState.party) cũng nhặt được ngay.
      const mine = !dr.owner || dr.owner === this.me || dr.ownerTtl <= 0 || (!!dr.party && dr.party === this.party?.id);
      const msg = mine ? "nhấn E để nhặt vào túi" : `<em>của ${dr.party ? "tổ đội " : ""}người hạ hồn thú, còn ${Math.ceil(dr.ownerTtl)} giây</em>`;
      const it = dr.item ? itemDef(dr.item) : undefined;
      if (dr.item === CORE_ITEM) hud.showPrompt(`<span class="dot" style="color:${CORE_SETS[dr.cset]?.col ?? "#d9b8ff"}"></span>${coreName(CORE_SETS[dr.cset]?.id ?? "", dr.stars)}: ${msg}`);
      else if (dr.item === BONE_ITEM) hud.showPrompt(`<span class="dot" style="color:${hud.ringColor(dr.tier)}"></span>Hồn cốt ${boneName(BEASTS[dr.species]?.id ?? "", BONE_SLOTS[dr.slot]?.id, dr.years)}: ${msg}`);
      else hud.showPrompt(dr.item ? `<span class="dot" style="color:${it?.col ?? "#9db3a2"}"></span>${dr.qty} ${it?.name ?? "vật phẩm lạ"}: ${msg}`
        : `<span class="dot" style="color:${hud.ringColor(dr.tier)}"></span>Hồn hoàn ${formatYears(dr.years)} (${TIERS[dr.tier].color}): ${msg}`);
    } else hud.showPrompt(null);
    this.drawMinimap();
  }
}
