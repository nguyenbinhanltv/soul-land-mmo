// Neo phụ thể theo tâm khối thân (docs/art/phu-the-hoat-anh.md, mục "Neo khối thân"): `sprites/vohonanim/anchor.json` do `tools/assets/phuthe-anchor.mjs` sinh hoặc xuất từ trang thử `?thu=phuthe`.
// Mỗi võ hồn × giới (m / f) × hướng (s, se, e, ne, n): phóng `scale` quanh gốc chân khung rồi dời (dx, dy) điểm ảnh khung (+x theo hướng nhìn, tây lật dấu); (tx, ty) là giữa lưng thân LPC tính từ gốc chân
// (chữ thập ở trang thử). Thiếu / hỏng thì không có neo = hành vi cũ (dời 0, phóng 1). Module thuần (trừ `loadPhuAnchors`), kiểm bằng node.
import { PHU_DIRS } from "./phutheAnim.ts";

export interface PhuAnchor { dx: number; dy: number; scale: number; tx: number; ty: number }
export type PhuAnchorSex = "m" | "f";
export interface PhuAnchorTable { frame: 96 | 128; m: PhuAnchor[]; f: PhuAnchor[]; manual: boolean }

/** Không neo: hành vi cũ. Chữ thập mặc định cao ngang lưng thân. */
export const PHU_NO_ANCHOR: PhuAnchor = { dx: 0, dy: 0, scale: 1, tx: 0, ty: -26 };
/** Khoảng `scale` nhận được (như công cụ: SCALE_RANGE). */
export const PHU_SCALE_RANGE = [0.25, 2] as const;
const ok = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** Đọc một mục anchor.json; đủ 2 giới × 5 hướng với dx, dy, scale hợp lệ thì trả bảng (mảng theo hàng hướng `phuDirRow`), không thì null. */
export function parsePhuAnchor(e: unknown): PhuAnchorTable | null {
  const o = e as { frame?: unknown; manual?: unknown; m?: Record<string, Partial<PhuAnchor>>; f?: Record<string, Partial<PhuAnchor>> } | null;
  if (!o || typeof o !== "object" || (o.frame !== 96 && o.frame !== 128)) return null;
  const t: PhuAnchorTable = { frame: o.frame, m: [], f: [], manual: o.manual === true };
  for (const sex of ["m", "f"] as const) for (const d of PHU_DIRS) {
    const a = o[sex]?.[d];
    if (!a || !ok(a.dx) || !ok(a.dy) || !ok(a.scale) || a.scale < PHU_SCALE_RANGE[0] || a.scale > PHU_SCALE_RANGE[1]) return null;
    t[sex].push({ dx: a.dx, dy: a.dy, scale: a.scale, tx: ok(a.tx) ? a.tx : PHU_NO_ANCHOR.tx, ty: ok(a.ty) ? a.ty : PHU_NO_ANCHOR.ty });
  }
  return t;
}
/** Neo của (giới, hàng hướng 0–4); thiếu bảng thì PHU_NO_ANCHOR. */
export const phuAnchorAt = (t: PhuAnchorTable | undefined, female: boolean, row: number): PhuAnchor => t?.[female ? "f" : "m"][row] ?? PHU_NO_ANCHOR;
/** Tệp anchor.json dạng văn bản từ một bảng (xuất ở trang thử; `manual: true` để công cụ không ghi đè). Số làm tròn 0,01. */
export function phuAnchorJson(t: PhuAnchorTable, manual = true): Record<string, unknown> {
  const r = (v: number) => Math.round(v * 100) / 100, out: Record<string, unknown> = { frame: t.frame };
  for (const sex of ["m", "f"] as const) out[sex] = Object.fromEntries(PHU_DIRS.map((d, i) => { const a = t[sex][i]; return [d, { dx: r(a.dx), dy: r(a.dy), scale: r(a.scale), tx: r(a.tx), ty: r(a.ty) }]; }));
  if (manual) out.manual = true;
  return out;
}

const TABLES = new Map<string, PhuAnchorTable>();
/** Bảng neo của võ hồn `id` đã tải; chưa tải / không có thì undefined. */
export const phuAnchorsOf = (id: string): PhuAnchorTable | undefined => TABLES.get(id);
/** Đặt tay một bảng (trang thử chỉnh trực tiếp). */
export const setPhuAnchors = (id: string, t: PhuAnchorTable) => { TABLES.set(id, t); };
let loading: Promise<void> | null = null;
/** Tải anchor.json một lần (không chặn game; lỗi mạng / 404 / JSON hỏng thì bỏ, võ hồn chạy hành vi cũ); mục hỏng bị bỏ riêng từng mục. */
export function loadPhuAnchors(url: string): Promise<void> {
  loading ??= fetch(url).then((r) => (r.ok ? r.json() : {})).then((j: Record<string, unknown>) => {
    for (const [id, e] of Object.entries(j ?? {})) { const t = parsePhuAnchor(e); if (t) TABLES.set(id, t); }
  }).catch(() => { /* không có neo */ });
  return loading;
}
