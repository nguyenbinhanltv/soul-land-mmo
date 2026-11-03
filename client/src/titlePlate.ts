// Bảng treo danh hiệu trên đầu hồn sư (docs/design/danh-hieu.md "Cách vẽ"): ảnh thật `danh_hieu_*` (#1792) khi manifest có;
// chưa có ảnh thì khung vẽ bằng code (bước P2). Hai Graphics dùng chung (ánh + vệt quét) xoá và vẽ lại mỗi khung, cộng hồ đối tượng
// ảnh tái dùng (khung nine-patch, hai đầu, clip bậc 5–6, hạt): chỉ cho người đang hiện chữ danh hiệu (trong tầm nhìn, chưa bị thu gọn);
// hạt và vệt quét là hàm thuần của thời gian nên không tạo / huỷ đối tượng mỗi khung. Quá `TITLE_FX.crowd` bảng thì người khác chỉ còn
// khung tĩnh (chính mình luôn đủ hiệu ứng).
// Độ sâu 99983.8: dưới mọi lớp chữ (tên NPC / biển / nhãn boss 99984, chữ hồn sư 99985), trên tele 99983.5.
import type Phaser from "phaser";
import { TITLE_FX, TITLE_TIER_MAX } from "../../shared/data.ts";

/** Bảng màu theo bậc (hướng tiên hiệp rực lửa): nền, viền, ánh, màu chữ, màu hạt. Nền / viền chỉ dùng khi chưa có ảnh khung. */
export const TITLE_PAL = [
  { bg: 0x2a1a10, edge: 0x9a6a3a, glow: 0x000000, text: "#f3ead2", ember: 0xd9a066 },
  { bg: 0x10241a, edge: 0x4fae78, glow: 0x7be0a8, text: "#c4f5d4", ember: 0x9af0bc },
  { bg: 0x0e1a30, edge: 0x4a8ee0, glow: 0x7cc0ff, text: "#b8dcff", ember: 0x8ad0ff },
  { bg: 0x2a1238, edge: 0xd0a24a, glow: 0xc880ff, text: "#f0d2ff", ember: 0xe8b8ff },
  { bg: 0x3a1a08, edge: 0xf2b43a, glow: 0xff8a2a, text: "#ffd98a", ember: 0xff9a3a },
  { bg: 0x4a0a0a, edge: 0xffd24a, glow: 0xff4020, text: "#fff2a8", ember: 0xffd060 },
] as const;
export const titlePal = (tier: number) => TITLE_PAL[Math.min(TITLE_TIER_MAX, Math.max(1, tier | 0 || 1)) - 1];

/** Số thực ổn định 0..1 từ chuỗi + số (chọn pha / chỗ hạt riêng từng người). */
function hash01(s: string, n: number) { let h = 2166136261 ^ n; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return ((h >>> 0) % 10007) / 10007; }

export interface PlateIn { id: string; tier: number; x: number; y: number; w: number; h: number; alpha: number; mine: boolean }

/** Nine-patch của `danh_hieu_khung_*` (128×32): lề trái / phải / trên / dưới; vùng chữ x 8..120, y 11..24 (art/src/danh-hieu-1777/khung/NGUON.md). */
const NP = { l: 8, r: 8, t: 13, b: 11, textTop: 11, textBottom: 8, headLeft: 32, headOver: 4 } as const;
/** Clip lửa bậc 5–6: 4 khung 16×24, neo đáy giữa, 8 khung / giây. */
const CLIP_FPS = 8, CLIP_FROM_TIER = 5;
type Pal = ReturnType<typeof titlePal>;

export class TitlePlates {
  private g: Phaser.GameObjects.Graphics; // ánh (dưới ảnh)
  private gt: Phaser.GameObjects.Graphics; // vệt quét + hạt vẽ bằng code (trên khung)
  private slices: Phaser.GameObjects.NineSlice[] = [];
  private heads: Phaser.GameObjects.Image[] = [];
  private clips: Phaser.GameObjects.Sprite[] = [];
  private dots: Phaser.GameObjects.Sprite[] = [];
  private used = { slice: 0, head: 0, clip: 0, dot: 0 };
  constructor(private scene: Phaser.Scene, private depth = 99983.8) {
    this.g = scene.add.graphics().setDepth(depth);
    this.gt = scene.add.graphics().setDepth(depth + 0.02);
  }
  /** Có đủ ảnh khung + đầu của bậc `t` trong texture không (chưa nhập thì rơi về khung vẽ bằng code). */
  private art(t: number) { const tx = this.scene.textures; return tx.exists(`danh_hieu_khung_${t}`) && tx.exists(`danh_hieu_dau_${t}`); }
  private take<T>(pool: T[], i: number, make: () => T): T { return pool[i] ?? (pool[i] = make()); }
  /** `plates`: chữ danh hiệu đang hiện (x, y = giữa-đáy chữ; w, h đã nhân tỉ lệ chữ K). */
  draw(plates: readonly PlateIn[], time: number, K: number) {
    const u = this.used; this.g.clear(); this.gt.clear(); u.slice = u.head = u.clip = u.dot = 0;
    if (plates.length) this.drawAll(plates, time, K);
    const hide = (pool: Phaser.GameObjects.Components.Visible[], n: number) => { for (let i = n; i < pool.length; i++) pool[i].setVisible(false); };
    hide(this.slices, u.slice); hide(this.heads, u.head); hide(this.clips, u.clip); hide(this.dots, u.dot);
  }
  private drawAll(plates: readonly PlateIn[], time: number, K: number) {
    const g = this.g, gt = this.gt, u = this.used, sc = this.scene, d = this.depth, tex = sc.textures;
    const calm = plates.length > TITLE_FX.crowd;
    for (const p of plates) {
      const t = Math.min(TITLE_TIER_MAX, Math.max(1, p.tier | 0 || 1)), pal = titlePal(t), ph = hash01(p.id, 1) * 6.28;
      const full = p.mine || !calm, a = p.alpha, art = this.art(t);
      const flick = full && t >= 2 ? 0.75 + 0.25 * Math.sin(time / (330 - t * 24) + ph) : 1;
      let l: number, r: number, top: number, bot: number;
      if (art) {
        // Ảnh thật: điểm ảnh gốc phóng K lần; khung chỉ kéo ngang theo chữ (tối thiểu 32×25 điểm gốc); đầu phủ 4 điểm lên khung, đầu phải = đầu trái lật ngang.
        const fw = Math.max(32 * K, p.w + (NP.l + NP.r) * K), fh = Math.max(25 * K, p.h + (NP.textTop + NP.textBottom) * K);
        l = p.x - fw / 2; r = l + fw; bot = p.y + NP.textBottom * K; top = bot - fh;
        const key = `danh_hieu_khung_${t}`;
        const sl = this.take(this.slices, u.slice++, () => sc.add.nineslice(0, 0, key, undefined, 128, 32, NP.l, NP.r, NP.t, NP.b).setOrigin(0, 0).setDepth(d));
        if (sl.texture.key !== key) sl.setTexture(key); // đổi bậc mới dựng lại 9 lát
        sl.setPosition(l, top).setSize(fw / K, fh / K).setScale(K).setAlpha(a).setVisible(true);
        for (const right of [false, true]) {
          const hk = `danh_hieu_dau_${t}`, h = this.take(this.heads, u.head++, () => sc.add.image(0, 0, hk).setOrigin(0, 0).setDepth(d + 0.005));
          h.setTexture(hk).setFlipX(right).setScale(K).setPosition(right ? r - NP.headOver * K : l - NP.headLeft * K, top).setAlpha(a).setVisible(true);
        }
      } else {
        const padX = (4 + t) * K, padY = 1.2 * K;
        l = p.x - p.w / 2 - padX; r = p.x + p.w / 2 + padX; top = p.y - p.h - padY; bot = p.y + padY;
        const w = r - l, h = bot - top;
        g.fillStyle(pal.bg, 0.8 * a); g.fillRoundedRect(l, top, w, h, 2 * K);
        g.lineStyle(Math.max(1, K), pal.edge, a * flick); g.strokeRoundedRect(l, top, w, h, 2 * K);
        if (t >= 2) { // họa tiết hai đầu: thoi nhỏ từ bậc 2
          const sz = (1.4 + 0.25 * t) * K, cy = top + h / 2;
          g.fillStyle(pal.edge, a);
          for (const cx of [l, r]) g.fillTriangle(cx - sz, cy, cx, cy - sz, cx, cy + sz).fillTriangle(cx + sz, cy, cx, cy - sz, cx, cy + sz);
        }
      }
      const w = r - l, h = bot - top;
      if (t >= 4) { g.fillStyle(pal.glow, (0.1 + 0.03 * t) * a * flick); g.fillRoundedRect(l - 2 * K, top - 2 * K, w + 4 * K, h + 4 * K, 3 * K); }
      if (!full) continue;
      // vệt quét sáng chạy ngang (cắt trong khung), nghỉ giữa hai lượt
      const sw = TITLE_FX.sweep[t - 1];
      if (sw > 0) {
        const per = 3200 - t * 250, uu = ((time + ph * 400) % per) / (per * 0.45);
        if (uu < 1) {
          const bw = Math.max(5 * K, w * 0.16), x0 = l + (w + bw) * uu - bw, cl = Math.max(l, x0), cr = Math.min(r, x0 + bw);
          if (cr > cl) { gt.fillStyle(0xffffff, sw * a * Math.sin(Math.PI * uu)); gt.fillRect(cl, top + K * 0.5, cr - cl, h - K); }
        }
      }
      // clip lửa hai bậc cao: hai ngọn trên đỉnh hai đầu, neo đáy giữa, 4 pha lặp
      const clipKey = `danh_hieu_clip_${t}`;
      if (art && t >= CLIP_FROM_TIER && tex.exists(clipKey)) {
        const f = Math.floor(time / (1000 / CLIP_FPS) + ph) % 4;
        for (const cx of [l - 16 * K, r + 16 * K]) {
          const c = this.take(this.clips, u.clip++, () => sc.add.sprite(0, 0, clipKey, 0).setOrigin(0.5, 1).setDepth(d + 0.01));
          c.setTexture(clipKey, f).setScale(K).setPosition(cx, top + 6 * K).setAlpha(a).setVisible(true);
        }
      }
      // hạt bốc lên từ mép trên, mờ dần: ảnh `danh_hieu_hat_lua` / `_tia` xen kẽ; chưa có ảnh thì ô vuông vẽ bằng code như P2
      const n = TITLE_FX.sparks[t - 1];
      for (let i = 0; i < n; i++) {
        const key = i % 2 ? "danh_hieu_hat_tia" : "danh_hieu_hat_lua";
        const life = 1100 + hash01(p.id, 10 + i) * 900, uu = ((time + hash01(p.id, 30 + i) * life) % life) / life;
        const x = l + (0.08 + 0.84 * hash01(p.id, 50 + i)) * w + Math.sin(time / 280 + i * 2 + ph) * 1.2 * K, y = top + h * 0.3 - uu * (6 + t * 1.5) * K;
        if (!tex.exists(key)) { this.codeSpark(i, pal, uu, x, y, a, K); continue; }
        const dot = this.take(this.dots, u.dot++, () => sc.add.sprite(0, 0, key, 0).setDepth(d + 0.015));
        dot.setTexture(key, Math.floor(hash01(p.id, 70 + i) * 4)).setScale(Math.max(0.5, 1 - uu * 0.5) * K).setPosition(x, y).setAlpha((1 - uu) * a).setVisible(true);
      }
    }
  }
  /** Hạt vẽ bằng code khi chưa có ảnh `danh_hieu_hat_*`. */
  private codeSpark(i: number, pal: Pal, uu: number, x: number, y: number, a: number, K: number) {
    const sz = Math.max(1, (1.4 - uu) * K);
    this.gt.fillStyle(i % 2 ? 0xffffff : pal.ember, (1 - uu) * a); this.gt.fillRect(x, y, sz, sz);
  }
  destroy() { this.g.destroy(); this.gt.destroy(); for (const o of [...this.slices, ...this.heads, ...this.clips, ...this.dots]) o.destroy(); }
}
