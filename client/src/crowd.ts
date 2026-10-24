// Dân thường, lính gác trang trí ở thành / làng / Đại Đấu Hồn Trường (GAME_DESIGN.md mục 5.11 "NPC phụ và dân thường").
// Chỉ phía client: server không biết tới, không đồng bộ, không chặn đường, không bấm được, không ảnh hưởng luật. Mỗi máy tự sinh
// từ hạt giống theo mapId nên chỗ đứng như nhau ở mọi máy (bước đi lại tính theo đồng hồ từng máy nên có thể lệch nhau).
// Hình là sheet `lpc_<tên>` ghép từ LPC (tools/assets/lpc-compose.mjs --game), cùng bố cục sheet hồn sư isometric.
import Phaser from "phaser";
import { TILE, CAMP_MERCHANT } from "../../shared/data.ts";
import { campMerchantSpot } from "../../shared/camp.ts";
import { hits, isSolidTile, type SolidGrid } from "../../shared/move.ts";
import { worldToScreen, dir8, SPR, type Dir8 } from "./iso.ts";
import { honsuAnimKey, fitHonsuLayer, loadSpriteKey, type HsAnim } from "./sprites.ts";

interface CrowdDef {
  /** Dân đi lại chậm quanh chỗ của mình (tên sheet `lpc_<tên>`, mỗi tên một người). */
  walk: string[];
  /** Dân đứng yên (bán hàng, xem đấu); khán giả (`cheer`) nhìn vào giữa bản đồ và thỉnh thoảng giơ tay reo. */
  stand: string[];
  /** Lính gác: hai người đứng hai bên mỗi cổng (object `portal`, trừ bến thuyền). */
  guard?: string;
  /** Chỉ đứng trong vùng an toàn (object `safe`): làng nằm giữa các bãi săn. */
  inSafe?: boolean;
  /** Chỉ đứng ngoài khung `spawn` (Đại Đấu Hồn Trường: khán giả đứng quanh sân đấu). */
  outSpawn?: boolean;
  cheer?: boolean;
}

/** Lặp danh sách `n` lần (bản ×8 rộng hơn nên nhiều dân hơn, 11.5; cùng sheet, mỗi người một chỗ). */
const times = (n: number, list: string[]) => Array.from({ length: n }, () => list).flat();
/** Dân thường theo bản đồ (mã trong MAPS); bản đồ không có ở đây thì không có dân. */
export const CROWD: Record<string, CrowdDef> = {
  // Làng: nông dân vác cuốc, thôn nữ tóc tết, lão nhân râu bạc (#201).
  thanh_hon_thon: { inSafe: true, walk: times(2, ["dan_nong_phu", "dan_thon_nu", "dan_lao_ba", "dan_nong_phu_cuoc", "dan_thon_nu_toc_tet", "dan_lao_nhan"]), stand: times(2, ["dan_ban_rong"]) },
  nac_dinh_thanh: { walk: times(3, ["dan_nong_phu", "dan_thon_nu", "dan_khach", "dan_lao_ba", "dan_thu_sinh", "dan_lao_nhan", "dan_nu_duoi_ngua"]), stand: times(3, ["dan_ban_rong", "dan_khach"]), guard: "linh_gac" },
  // Kinh thành: lính gác cầm giáo ở cổng, nho sinh tóc dài, thiếu nữ buộc tóc đuôi ngựa (#201).
  thien_dau_thanh: { walk: times(3, ["dan_thu_sinh", "dan_tieu_thu", "dan_khach", "dan_thon_nu", "dan_nho_sinh", "dan_nu_duoi_ngua"]), stand: times(3, ["dan_ban_rong", "dan_lao_ba"]), guard: "linh_gac_giao" },
  dai_dau_hon_truong: { outSpawn: true, cheer: true, walk: [],
    stand: ["dan_khach", "dan_thu_sinh", "dan_tieu_thu", "dan_nong_phu", "dan_thon_nu", "dan_khach", "dan_ban_rong", "dan_nho_sinh", "linh_gac", "linh_gac_giao"] },
};

/** Tốc độ đi (pixel thế giới / giây; hồn sư khoảng 58) và hệ số nhịp animation đi cho khớp bước chậm. */
const WALK_SPEED = 14, WALK_ANIM = 0.55;
/** Bán kính đi lại quanh chỗ của mình, thời gian đứng nghỉ giữa hai lượt đi (giây). */
const WANDER = 40, REST: [number, number] = [2.5, 7];
/** Khoảng cách tối thiểu tới NPC / điểm tới / cổng và giữa hai người dân (pixel thế giới). */
const NPC_GAP = 36, GATE_GAP = 20, PEOPLE_GAP = 40;
/** Khán giả giơ tay reo (animation cast) trung bình mỗi chừng này giây. */
const CHEER_EVERY = 9;

interface Rect { x: number; y: number; w: number; h: number }
/** Những gì của bản đồ dùng để chọn chỗ đứng (object Tiled đã đọc trong GameScene.create). */
export interface CrowdMap { safes: Rect[]; portals: (Rect & { boat?: boolean })[]; spawn: Rect | null; npcs: { x: number; y: number }[]; arrives: { x: number; y: number }[]; mapW: number; mapH: number }

/** Tên các sheet dân thường bản đồ cần (để tải trước). */
export const crowdNames = (mapId: string): string[] => {
  const c = CROWD[mapId];
  return c ? [...c.walk, ...c.stand, ...(c.guard ? [c.guard] : [])] : [];
};

/**
 * Hàm cho `preloadSprites(scene, …)`: khi đã biết tên sheet LPC có trong manifest và danh sách NPC trong file Tiled của bản đồ,
 * chỉ xếp hàng tải sheet `lpc_<tên>` của NPC bản đồ đó (mã trong NPCS) và của dân thường (CROWD).
 */
export function lpcPreloader(scene: Phaser.Scene, mapId: string) {
  let have: Set<string> | null = null, npcs: string[] | null = null;
  const go = () => {
    if (!have || !npcs) return;
    for (const n of new Set([...npcs, ...crowdNames(mapId)])) if (have.has(n)) loadSpriteKey(scene, `lpc_${n}`);
  };
  scene.load.once(`filecomplete-tilemapJSON-${mapId}`, (_k: string, _t: string, data: any) => {
    npcs = [];
    for (const l of data?.layers ?? []) if (l.type === "objectgroup") for (const o of l.objects ?? [])
      if (o.type === "npc") { const v = o.properties?.find((p: any) => p.name === "npc")?.value; if (typeof v === "string") npcs.push(v); }
    if (data && campMerchantSpot(data, mapId)) npcs.push(CAMP_MERCHANT); // #111: thương nhân lưu động không có object `npc`
    go();
  });
  return (names: Set<string>) => { have = names; go(); };
}

/** Số ngẫu nhiên ổn định theo hạt giống (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hashStr = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

interface Person {
  key: string; root: Phaser.GameObjects.Container; spr: Phaser.GameObjects.Sprite;
  x: number; y: number; hx: number; hy: number; tx: number; ty: number; rest: number; dir: Dir8; anim: string;
  walker: boolean; cheer: boolean; rnd: () => number;
}

/** Dân thường của một bản đồ: tạo trong GameScene.create (sau createSheetAnims), gọi update(dt) mỗi khung. */
export class Crowd {
  readonly people: Person[] = []; // GameScene đặt pipeline ánh sáng thực thể cho `spr` (10.7)

  constructor(private scene: Phaser.Scene, mapId: string, private grid: SolidGrid, m: CrowdMap) {
    const def = CROWD[mapId];
    if (!def) return;
    const rnd = rng(hashStr(mapId)), taken: { x: number; y: number }[] = [];
    const inRect = (r: Rect, x: number, y: number, pad = 0) => x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
    const far = (x: number, y: number, list: { x: number; y: number }[], d: number) => list.every((p) => Math.hypot(p.x - x, p.y - y) >= d);
    /** Chỗ đứng được: ô không chặn (đi lại thì cả 3×3 ô quanh), xa NPC / cổng / điểm tới / người khác, đúng vùng của bản đồ. */
    const ok = (x: number, y: number, roomy: boolean) => {
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      if (isSolidTile(grid, tx, ty) || (roomy && hits(grid, x, y, TILE, TILE))) return false;
      if (def.inSafe && !m.safes.some((r) => inRect(r, x, y, -TILE))) return false;
      if (def.outSpawn && m.spawn && inRect(m.spawn, x, y)) return false;
      if (m.portals.some((r) => inRect(r, x, y, GATE_GAP))) return false;
      return far(x, y, m.npcs, NPC_GAP) && far(x, y, m.arrives, GATE_GAP) && far(x, y, taken, PEOPLE_GAP);
    };
    const pick = (roomy: boolean) => {
      for (let i = 0; i < 400; i++) {
        const x = (Math.floor(rnd() * (grid.MW - 4)) + 2) * TILE + TILE / 2, y = (Math.floor(rnd() * (grid.MH - 4)) + 2) * TILE + TILE / 2;
        if (ok(x, y, roomy)) return { x, y };
      }
      return null;
    };
    const cx = m.mapW / 2, cy = m.mapH / 2;
    const add = (name: string, x: number, y: number, walker: boolean, dir: Dir8 | null, cheer = false) => {
      const key = `lpc_${name}`;
      if (!scene.textures.exists(key)) return;
      taken.push({ x, y });
      const spr = fitHonsuLayer(scene.make.sprite({ key }, false));
      const root = scene.add.container(0, 0, [scene.make.image({ key: "hs_shadow" }, false), spr]).setScale(SPR);
      const p: Person = { key, root, spr, x, y, hx: x, hy: y, tx: x, ty: y, rest: 0.5 + rnd() * REST[1], dir: dir ?? (["s", "se", "sw"] as const)[Math.floor(rnd() * 3)],
        anim: "", walker, cheer, rnd: rng(hashStr(`${mapId}:${taken.length}`)) };
      this.people.push(p);
      this.place(p); this.play(p, "idle");
    };
    // Lính gác: hai bên mỗi cổng, lùi vào trong thành, nhìn vào trong.
    if (def.guard) for (const r of m.portals) {
      if (r.boat) continue;
      const pcx = r.x + r.w / 2, pcy = r.y + r.h / 2, horiz = Math.abs(cx - pcx) / m.mapW > Math.abs(cy - pcy) / m.mapH;
      const nx = horiz ? Math.sign(cx - pcx) : 0, ny = horiz ? 0 : Math.sign(cy - pcy);
      for (const side of [-1, 1]) for (let step = 0; step < 5; step++) {
        const inward = (horiz ? r.w : r.h) / 2 + TILE / 2 + step * TILE, across = (horiz ? r.h : r.w) / 2 + TILE;
        const x = pcx + nx * inward + (horiz ? 0 : side * across), y = pcy + ny * inward + (horiz ? side * across : 0);
        const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
        if (!isSolidTile(grid, tx, ty) && far(x, y, taken, TILE)) { add(def.guard, x, y, false, dir8(nx, ny)); break; }
      }
    }
    for (const n of def.stand) {
      const at = pick(false);
      if (at) add(n, at.x, at.y, false, def.cheer ? dir8(cx - at.x, cy - at.y) : null, !!def.cheer);
    }
    for (const n of def.walk) { const at = pick(true); if (at) add(n, at.x, at.y, true, null); }
  }

  /** Đặt hình theo vị trí thế giới; độ sâu = tung độ màn hình của chân (như hồn sư, NPC). */
  private place(p: Person) {
    const s = worldToScreen(p.x, p.y);
    p.root.setPosition(Math.round(s.x), Math.round(s.y)).setDepth(s.y);
  }

  private play(p: Person, anim: HsAnim) {
    const { key, flip } = honsuAnimKey(p.key, anim, p.dir);
    if (p.anim === key) return;
    p.anim = key;
    p.spr.setFlipX(flip);
    if (this.scene.anims.exists(key)) p.spr.play(key);
    p.spr.anims.timeScale = anim === "walk" ? WALK_ANIM : 1;
  }

  /** Đường thẳng từ (x0, y0) tới (x1, y1) không vướng ô chặn (thân rộng như hồn sư nhỏ). */
  private clear(x0: number, y0: number, x1: number, y1: number) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4);
    for (let i = 1; i <= n; i++) if (hits(this.grid, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, 4, 3)) return false;
    return true;
  }

  update(dt: number) {
    for (const p of this.people) {
      if (!p.walker) {
        // Khán giả: thỉnh thoảng giơ tay reo (cast chạy một lần rồi về idle).
        if (p.cheer && p.anim.includes(":cast_") && !p.spr.anims.isPlaying) this.play(p, "idle");
        else if (p.cheer && p.rnd() < dt / CHEER_EVERY) { p.anim = ""; this.play(p, "cast"); }
        continue;
      }
      if (p.rest > 0) {
        p.rest -= dt;
        if (p.rest <= 0) {
          // Chọn chỗ mới quanh nhà, đường đi thẳng không vướng; không được thì nghỉ tiếp.
          for (let i = 0; i < 8; i++) {
            const a = p.rnd() * Math.PI * 2, d = WANDER * (0.4 + 0.6 * p.rnd()), tx = p.hx + Math.cos(a) * d, ty = p.hy + Math.sin(a) * d;
            if (this.clear(p.x, p.y, tx, ty)) { p.tx = tx; p.ty = ty; break; }
          }
          if (p.tx === p.x && p.ty === p.y) p.rest = REST[0];
        }
        continue;
      }
      const dx = p.tx - p.x, dy = p.ty - p.y, k = Math.hypot(dx, dy), step = WALK_SPEED * dt;
      if (k <= step) {
        p.x = p.tx; p.y = p.ty; p.rest = REST[0] + p.rnd() * (REST[1] - REST[0]);
        this.play(p, "idle");
      } else {
        p.x += (dx / k) * step; p.y += (dy / k) * step;
        p.dir = dir8(dx, dy) ?? p.dir;
        this.play(p, "walk");
      }
      this.place(p);
    }
  }
}
