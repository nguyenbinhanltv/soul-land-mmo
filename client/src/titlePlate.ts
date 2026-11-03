// Bảng treo danh hiệu trên đầu hồn sư, vẽ bằng code (docs/design/danh-hieu.md "Cách vẽ", bước P2; ảnh thật thay ở P4).
// MỘT Graphics dùng chung cho mọi bảng: xoá và vẽ lại mỗi khung, chỉ cho người đang hiện chữ danh hiệu (trong tầm nhìn, chưa bị
// thu gọn); hạt và vệt quét là hàm thuần của thời gian nên không tạo / huỷ đối tượng nào. Quá `TITLE_FX.crowd` bảng thì
// người khác chỉ còn khung tĩnh (chính mình luôn đủ hiệu ứng).
// Độ sâu 99983.8: dưới mọi lớp chữ (tên NPC / biển / nhãn boss 99984, chữ hồn sư 99985), trên tele 99983.5.
import type Phaser from "phaser";
import { TITLE_FX, TITLE_TIER_MAX } from "../../shared/data.ts";

/** Bảng màu tạm theo bậc (hướng tiên hiệp rực lửa): nền, viền, ánh, màu chữ, màu hạt. */
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

export class TitlePlates {
  private g: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, depth = 99983.8) { this.g = scene.add.graphics().setDepth(depth); }
  /** `plates`: chữ danh hiệu đang hiện (x, y = giữa-đáy chữ; w, h đã nhân tỉ lệ chữ K). */
  draw(plates: readonly PlateIn[], time: number, K: number) {
    const g = this.g; g.clear();
    if (!plates.length) return;
    const calm = plates.length > TITLE_FX.crowd;
    for (const p of plates) {
      const t = Math.min(TITLE_TIER_MAX, Math.max(1, p.tier | 0 || 1)), pal = titlePal(t), ph = hash01(p.id, 1) * 6.28;
      const full = p.mine || !calm, a = p.alpha, padX = (4 + t) * K, padY = 1.2 * K;
      const l = p.x - p.w / 2 - padX, r = p.x + p.w / 2 + padX, top = p.y - p.h - padY, bot = p.y + padY, w = r - l, h = bot - top;
      const flick = full && t >= 2 ? 0.75 + 0.25 * Math.sin(time / (330 - t * 24) + ph) : 1;
      if (t >= 4) { g.fillStyle(pal.glow, (0.1 + 0.03 * t) * a * flick); g.fillRoundedRect(l - 2 * K, top - 2 * K, w + 4 * K, h + 4 * K, 3 * K); }
      g.fillStyle(pal.bg, 0.8 * a); g.fillRoundedRect(l, top, w, h, 2 * K);
      g.lineStyle(Math.max(1, K), pal.edge, a * flick); g.strokeRoundedRect(l, top, w, h, 2 * K);
      if (t >= 4) { g.lineStyle(Math.max(1, 0.6 * K), pal.glow, 0.5 * a * flick); g.strokeRoundedRect(l + K, top + K, w - 2 * K, h - 2 * K, K); }
      // họa tiết hai đầu: thoi nhỏ từ bậc 2 (đối xứng, hai đầu cùng một hình)
      if (t >= 2) {
        const s = (1.4 + 0.25 * t) * K, cy = top + h / 2;
        g.fillStyle(pal.edge, a);
        for (const cx of [l, r]) g.fillTriangle(cx - s, cy, cx, cy - s, cx, cy + s).fillTriangle(cx + s, cy, cx, cy - s, cx, cy + s);
      }
      if (!full) continue;
      // vệt quét sáng chạy ngang (cắt trong khung), nghỉ giữa hai lượt
      const sw = TITLE_FX.sweep[t - 1];
      if (sw > 0) {
        const per = 3200 - t * 250, u = ((time + ph * 400) % per) / (per * 0.45);
        if (u < 1) {
          const bw = Math.max(5 * K, w * 0.16), x0 = l + (w + bw) * u - bw, cl = Math.max(l, x0), cr = Math.min(r, x0 + bw);
          if (cr > cl) { g.fillStyle(0xffffff, sw * a * Math.sin(Math.PI * u)); g.fillRect(cl, top + K * 0.5, cr - cl, h - K); }
        }
      }
      // hạt lửa / tia sáng bốc lên từ mép trên, mờ dần
      const n = TITLE_FX.sparks[t - 1];
      for (let i = 0; i < n; i++) {
        const life = 1100 + hash01(p.id, 10 + i) * 900, u = ((time + hash01(p.id, 30 + i) * life) % life) / life;
        const x = l + (0.08 + 0.84 * hash01(p.id, 50 + i)) * w + Math.sin(time / 280 + i * 2 + ph) * 1.2 * K, y = top + h * 0.3 - u * (6 + t * 1.5) * K, sz = Math.max(1, (1.4 - u) * K);
        g.fillStyle(i % 2 ? 0xffffff : pal.ember, (1 - u) * a); g.fillRect(x, y, sz, sz);
      }
    }
  }
  destroy() { this.g.destroy(); }
}
