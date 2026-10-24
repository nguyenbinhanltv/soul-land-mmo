// S1 (#542): bảng hiển thị từng chiêu `SKILL_VISUAL` (chiêu → tầng / sheet / độ nặng) và bộ điều phối tầng T1–T3.
// Chỉ hiển thị ở client. Chiêu CHƯA có mục trong bảng (hoặc mục chưa có sheet) vẫn chạy đúng hiệu ứng G3 của `skillFx.ts` (skillFxOf), không đổi gì.
// S2 / S3 điền bảng này (kèm ảnh sheet cùng khóa); S1 chỉ có 2 chiêu thử + sheet dựng bằng code để chứng minh khung.
import type Phaser from "phaser";
import { ringSkill, chanThanOf } from "../../shared/data.ts";
import type { Element } from "./audio/soundMap.ts";
import { skillFxOf } from "./skillFx.ts";
import { SheetFx, makeCodeSheet, type SheetPlay } from "./fxSheet.ts";
import { fxPrefs } from "./combatFx.ts";
import { SPR } from "./iso.ts";

/** T1 nhẹ (vòng 1–4), T2 vừa (vòng 5, 6, 8, 9 + tiên cơ), T3 trình diễn (vòng 10, hồn kỹ Chân Thân). */
export type FxTier = 1 | 2 | 3;

/** Sheet của một chiêu: chạy ở đâu và thế nào. Bố cục ảnh xem `fxSheet.ts`. */
export interface VisualSheet {
  key: string;
  /** `cast`: ở người tung (hào quang, vung); `target`: ở điểm trúng; `travel`: bay từ người tung tới điểm trúng. */
  at: "cast" | "target" | "travel";
  /** Số hàng hướng của sheet (1 hoặc 8). */
  rows?: 1 | 8;
  /** Cỡ nguyên (bội SPR). */
  scale?: number;
  fps?: number;
  /** Màu nhân vào ảnh (bỏ trống: giữ màu ảnh). */
  tint?: number;
}

export interface SkillVisual {
  tier: FxTier;
  /** Độ nặng đòn 0..3 (khựng, giật lùi, tia lửa mạnh hơn); mặc định theo tầng: T1 0, T2 1, T3 2. */
  heavy: 0 | 1 | 2 | 3;
  /** Lớp báo trước / lấy đà phát trước đòn chính (T2 / T3), ms. */
  windup?: number;
  /** Phát thêm một lần ở điểm trúng sau `aftershock` ms (dư chấn T3). */
  aftershock?: { sheet: VisualSheet; delay: number };
  sheet?: VisualSheet;
  /** true: sheet THAY hiệu ứng G3 (mặc định false: sheet chồng lên G3, an toàn khi ảnh chưa đẹp). */
  replace?: boolean;
  /** Ghi đè hệ (màu hạt, tia lửa); mặc định theo `skillFxOf`. */
  element?: Element;
}

/** Tầng mặc định theo vòng 0..9 (ring 6 = vòng 7 không có hồn kỹ thường; Chân Thân tính T3). */
export const tierOfRing = (ring: number, chanThan: boolean): FxTier => (chanThan || ring >= 9 ? 3 : ring >= 4 ? 2 : 1);
const HEAVY_OF_TIER: Record<FxTier, 0 | 1 | 2> = { 1: 0, 2: 1, 3: 2 };

/** Khóa bảng: `<mã võ hồn>:<vòng 0..9>`, hồn kỹ Chân Thân `<mã>:ct`. */
export const visualKey = (vohonId: string, ring: number, chanThan = false) => `${vohonId}:${chanThan ? "ct" : ring}`;

/**
 * Hai chiêu thử khung (S1). S2 thay bằng sheet vẽ thật cho Lam Điện Bá Vương Long + Hạo Thiên Chùy; các võ hồn khác điền ở S3.
 * `fxs_*` là sheet dựng bằng code (makeCodeSheet, `registerCodeSheets`): thay bằng ảnh thật chỉ cần đổi khóa.
 */
export const SKILL_VISUAL: Readonly<Record<string, Partial<SkillVisual>>> = {
  // T2: sét giáng xuống điểm trúng, lấy đà 180 ms.
  "lam_dien_ba_vuong_long:4": { tier: 2, heavy: 2, windup: 180, sheet: { key: "fxs_loi_giang", at: "target", scale: 2 * SPR, fps: 18 } },
  // T3: chùy nện, nổ ở điểm trúng, dư chấn (dùng sheet nổ G3 có sẵn `fx_no`).
  "hao_thien_chuy:9": { tier: 3, heavy: 3, windup: 260, sheet: { key: "fx_no", at: "target", scale: 3 * SPR, fps: 16, tint: 0xffe08a },
    aftershock: { delay: 380, sheet: { key: "fx_no", at: "target", scale: 2 * SPR, fps: 24, tint: 0xffcf6a } } },
};

/** Mục đã điền đủ mặc định cho chiêu; không có mục thì chỉ tầng + độ nặng theo vòng (hành vi cũ). */
export function skillVisualOf(vohonId: string, ring: number, chanThan = false): SkillVisual & { element: Element } {
  const own = SKILL_VISUAL[visualKey(vohonId, ring, chanThan)], tier = own?.tier ?? tierOfRing(ring, chanThan);
  return { ...own, tier, heavy: own?.heavy ?? HEAVY_OF_TIER[tier], element: own?.element ?? skillFxOf(vohonId, ring, chanThan).element };
}
/** Chiêu có thật (kiểm bảng không trỏ vào chiêu không tồn tại). */
export const skillExists = (vohonId: string, ring: number, chanThan = false) => !!(chanThan ? chanThanOf(vohonId)?.skill : ringSkill(vohonId, ring));

/** Dựng sheet bằng code cần cho bảng (gọi một lần khi cảnh khởi tạo; có ảnh thật cùng khóa thì bỏ qua). */
export function registerCodeSheets(scene: Phaser.Scene) {
  // Sét giáng: cột sét zíc-zắc từ trên xuống rồi vòng sóng lan, 8 khung 48×48, vẽ theo ô pixel 2.
  makeCodeSheet(scene, "fxs_loi_giang", 8, 48, (c, k, S) => {
    const px = 2, bolt = Math.min(1, k * 3), fade = k < 0.4 ? 1 : 1 - (k - 0.4) / 0.6;
    c.globalAlpha = fade;
    let x = S / 2;
    for (let y = 0; y < S * 0.8 * bolt; y += px) {
      x += ((Math.sin(y * 1.3) * 3) | 0) * 0.5; // dáng zíc-zắc cố định (không ngẫu nhiên: khung nào cũng cùng dáng)
      c.fillStyle = "#6ab4ff"; c.fillRect(Math.round(x / px) * px - px, S * 0.1 + y, px * 3, px);
      c.fillStyle = "#ffffff"; c.fillRect(Math.round(x / px) * px, S * 0.1 + y, px, px);
    }
    if (k > 0.25) { // vòng sóng dưới chân sét
      const r = (k - 0.25) / 0.75 * (S * 0.42);
      c.strokeStyle = "#8ac8ff"; c.lineWidth = px; c.beginPath(); c.ellipse(S / 2, S * 0.88, r, r * 0.4, 0, 0, Math.PI * 2); c.stroke();
    }
    c.globalAlpha = 1;
  });
}

/** Ngữ cảnh một lần tung chiêu. Tọa độ màn hình. */
export interface CastCtx { x: number; y: number; ang: number; tx: number; ty: number; mine: boolean; tierCol?: number; delayBase?: number }

/** Điều phối T1–T3 trên một `SheetFx`: sheet chính, lấy đà, dư chấn. Trả true nếu sheet thay hiệu ứng G3 (nơi gọi bỏ G3). */
export class SkillVisualPlayer {
  constructor(readonly sheets: SheetFx) {}
  private mk(s: VisualSheet, c: CastCtx, extra: Partial<SheetPlay> = {}): SheetPlay {
    const at = s.at === "cast" ? { x: c.x, y: c.y } : { x: c.tx, y: c.ty };
    return { key: s.key, rows: s.rows, scale: s.scale, fps: s.fps, tint: s.tint, ang: c.ang, light: !c.mine, ...at, ...(s.at === "travel" ? { x: c.x, y: c.y, to: { x: c.tx, y: c.ty } } : {}), ...extra };
  }
  /** `vis.sheet` có và đã tải: phát. Người khác (`!mine`) chỉ thấy bản nhẹ: bỏ lấy đà và dư chấn. */
  cast(vis: SkillVisual, c: CastCtx): boolean {
    const s = vis.sheet; if (!s || !this.sheets.has(s.key)) return false;
    const wait = fxPrefs.reduce || !c.mine ? 0 : vis.windup ?? 0;
    const ok = this.sheets.play(this.mk(s, c, { delay: wait }));
    if (ok && c.mine && vis.aftershock && fxPrefs.level !== "low" && !fxPrefs.reduce && this.sheets.has(vis.aftershock.sheet.key))
      this.sheets.play(this.mk(vis.aftershock.sheet, c, { delay: wait + vis.aftershock.delay }));
    return ok && !!vis.replace;
  }
}
