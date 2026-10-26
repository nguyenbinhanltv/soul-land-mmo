// Dữ liệu riêng của chính chủ (#949): kinh nghiệm, hồn lực, hồi chiêu. Không nằm trong `PlayerState` (state công khai cho mọi client
// ở gần, đối thủ Đại Đấu Hồn Trường đọc được), mà đi bằng tin riêng `vit` tới đúng một client. Hàm thuần, dùng chung cho server (quyết
// định khi nào gửi), client (HUD) và bot (đọc lại như trường state cũ). Hằng ở `SYNC_VIEW` (data.ts).
import { SYNC_VIEW } from "./data.ts";

/** Số ô hồn kỹ (`cds`) và ô kỹ năng hồn cốt chủ động (`bcds`): đúng độ dài mảng cũ của `PlayerState`. */
export const VITALS_CDS = 4;
export const VITALS_BCDS = 3;

export interface Vitals {
  xp: number; xpNeed: number; mp: number; maxMp: number;
  /** Hồi chiêu (giây còn lại): hồn kỹ theo ô, kỹ năng hồn cốt, đổi võ hồn, Chân Thân (nút R), hồn kỹ Chân Thân (ô P khi biến hình). */
  cds: number[]; bcds: number[]; swCd: number; avaCd: number; ctCd: number;
}

export const emptyVitals = (): Vitals => ({
  xp: 0, xpNeed: 0, mp: 0, maxMp: 0, cds: new Array(VITALS_CDS).fill(0), bcds: new Array(VITALS_BCDS).fill(0), swCd: 0, avaCd: 0, ctCd: 0,
});

const dec = (x: number, dt: number) => Math.max(0, x - dt);

/** Giá trị sau `dt` giây kể từ lúc nhận (hồi chiêu đếm lùi, các số khác giữ nguyên). Client / bot đếm giữa hai tin. */
export function vitalsAfter(v: Vitals, dt: number): Vitals {
  if (dt <= 0) return v;
  return { ...v, cds: v.cds.map((c) => dec(c, dt)), bcds: v.bcds.map((c) => dec(c, dt)), swCd: dec(v.swCd, dt), avaCd: dec(v.avaCd, dt), ctCd: dec(v.ctCd, dt) };
}

/** Làm tròn hồi chiêu tới 0,01 giây cho gọn tin; hợp lệ thì trả nguyên số. */
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Bản gửi đi: hồi chiêu làm tròn, mảng sao chép (không giữ tham chiếu tới state). */
export function vitalsPack(v: Vitals): Vitals {
  return { ...v, cds: v.cds.map(r2), bcds: v.bcds.map(r2), swCd: r2(v.swCd), avaCd: r2(v.avaCd), ctCd: r2(v.ctCd) };
}

/** Tin `vit` từ server: số hợp lệ mới nhận, thiếu / lạ thì null (client không tin dữ liệu hỏng). */
export function vitalsParse(m: unknown): Vitals | null {
  const o = m as Partial<Vitals> | null;
  const n = (x: unknown) => typeof x === "number" && Number.isFinite(x);
  const arr = (a: unknown, len: number) => Array.isArray(a) && a.length === len && a.every(n);
  if (!o || !n(o.xp) || !n(o.xpNeed) || !n(o.mp) || !n(o.maxMp) || !n(o.swCd) || !n(o.avaCd) || !n(o.ctCd) || !arr(o.cds, VITALS_CDS) || !arr(o.bcds, VITALS_BCDS)) return null;
  return { xp: o.xp!, xpNeed: o.xpNeed!, mp: o.mp!, maxMp: o.maxMp!, cds: [...o.cds!], bcds: [...o.bcds!], swCd: o.swCd!, avaCd: o.avaCd!, ctCd: o.ctCd! };
}

/**
 * Server: có phải gửi `cur` không, biết bản `sent` đã gửi cách đây `dt` giây (null = chưa gửi lần nào)?
 * - Gửi ngay khi kinh nghiệm / hồn lực tối đa đổi, hồn lực giảm (tốn khi tung chiêu), hoặc một hồi chiêu lệch số client đang tự đếm lùi
 *   quá `SYNC_VIEW.vitCd` giây (vừa tung chiêu, bị làm mới, hoặc trôi giờ).
 * - Hồn lực chỉ tăng (hồi dần) thì gửi tối đa mỗi `SYNC_VIEW.vitGap` giây.
 */
export function vitalsDue(sent: Vitals | null, cur: Vitals, dt: number): boolean {
  if (!sent) return true;
  if (cur.xp !== sent.xp || cur.xpNeed !== sent.xpNeed || cur.maxMp !== sent.maxMp || cur.mp < sent.mp) return true;
  const exp = vitalsAfter(sent, dt), tol = SYNC_VIEW.vitCd;
  const off = (a: number, b: number) => Math.abs(a - b) > tol;
  if (off(cur.swCd, exp.swCd) || off(cur.avaCd, exp.avaCd) || off(cur.ctCd, exp.ctCd)) return true;
  if (cur.cds.some((c, i) => off(c, exp.cds[i])) || cur.bcds.some((c, i) => off(c, exp.bcds[i]))) return true;
  return cur.mp > sent.mp && dt >= SYNC_VIEW.vitGap;
}
