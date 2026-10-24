// Đánh dấu "Tập trung ở đây" của tổ đội (GAME_DESIGN.md mục 5.17, R6): hàm thuần dùng chung server (kiểm tra điểm) và client (giữ danh sách
// dấu, hết hạn). Không phụ thuộc Phaser / DOM. Số liệu ở `RALLY` (data.ts).
import { RALLY } from "./data.ts";

/** Tin riêng `rally` server gửi cho từng thành viên tổ đội: người đặt (`from` = tên), bản đồ, kênh, ô đích và số giây còn hiệu lực. */
export interface RallyMsg { from: string; map: string; ch: number; tx: number; ty: number; secs: number }
/** Một dấu client đang giữ: `until` là mốc hết hạn (ms theo đồng hồ client, tính từ lúc nhận). */
export interface Rally { from: string; map: string; ch: number; tx: number; ty: number; until: number }

/** Ô đích hợp lệ trong bản đồ `w`×`h` ô: số hữu hạn, nằm trong bản đồ. Làm tròn về tâm ô (x.5) để dấu không lệch khỏi ô đi được. */
export function rallyPoint(tx: unknown, ty: unknown, w: number, h: number): { tx: number; ty: number } | null {
  if (typeof tx !== "number" || typeof ty !== "number" || !Number.isFinite(tx) || !Number.isFinite(ty)) return null;
  if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
  return { tx: Math.floor(tx) + 0.5, ty: Math.floor(ty) + 0.5 };
}

/** Đọc tin `rally` từ server (dữ liệu lạ → null). Số giây bị kẹp vào 1…`RALLY.secs` (không tin số lớn hơn luật). */
export function rallyRead(m: unknown): RallyMsg | null {
  const o = (typeof m === "object" && m !== null ? m : null) as Record<string, unknown> | null; if (!o) return null;
  const { from, map, ch, tx, ty, secs } = o;
  if (typeof from !== "string" || !from || typeof map !== "string" || !map || typeof ch !== "number" || typeof tx !== "number" || typeof ty !== "number" || typeof secs !== "number") return null;
  if (![ch, tx, ty, secs].every(Number.isFinite)) return null;
  return { from: from.slice(0, RALLY.nameMax), map, ch, tx, ty, secs: Math.min(RALLY.secs, Math.max(1, secs)) };
}

/** Thêm dấu mới: mỗi người một dấu (dấu cũ cùng người bị thay). Không sửa mảng cũ. */
export function rallyUpsert(list: readonly Rally[], m: RallyMsg, now: number): Rally[] {
  return [...list.filter((r) => r.from !== m.from), { from: m.from, map: m.map, ch: m.ch, tx: m.tx, ty: m.ty, until: now + m.secs * 1000 }];
}

/** Bỏ dấu hết hạn và dấu của người không còn trong tổ đội (`members` = tên các thành viên; null = không lọc theo thành viên). */
export function rallyPrune(list: readonly Rally[], now: number, members: ReadonlySet<string> | null): Rally[] {
  return list.filter((r) => r.until > now && (!members || members.has(r.from)));
}

/** Số giây còn lại (làm tròn lên) của dấu. */
export const rallyLeft = (r: Rally, now: number) => Math.max(0, Math.ceil((r.until - now) / 1000));
