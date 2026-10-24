// Hàm thuần của sương mù khám phá (GAME_DESIGN.md mục 5.17, R8 #435): bitset ô thô, đánh dấu quanh một điểm, kiểm dữ liệu. Dùng chung
// server (đánh dấu, lưu) và client (hiển thị, nhận bản vá); không phụ thuộc Phaser / DOM. Số liệu ở `FOG` (data.ts).
// Ô thô số `i = cy * cw + cx` ứng bit `i & 7` của byte `i >> 3` (bit thấp trước). Bit thừa cuối cùng luôn 0.
import { FOG } from "./data.ts";

export interface FogDims { cw: number; ch: number; cells: number; bytes: number }

/** Kích thước lưới ô thô của bản đồ `w`×`h` ô lưới. */
export function fogDims(w: number, h: number): FogDims {
  const cw = Math.max(1, Math.ceil(w / FOG.cell)), ch = Math.max(1, Math.ceil(h / FOG.cell)), cells = cw * ch;
  return { cw, ch, cells, bytes: (cells + 7) >> 3 };
}
/** Bitset trống (chưa khám phá ô nào). */
export const fogEmpty = (d: FogDims) => new Uint8Array(d.bytes);
export const fogGet = (bits: Uint8Array, i: number) => i >= 0 && i >> 3 < bits.length && (bits[i >> 3] & (1 << (i & 7))) !== 0;
/** Bật ô `i`; true nếu ô vừa đổi từ chưa sang đã khám phá. Ngoài lưới thì không làm gì. */
export function fogSet(bits: Uint8Array, d: FogDims, i: number): boolean {
  if (!Number.isInteger(i) || i < 0 || i >= d.cells || fogGet(bits, i)) return false;
  bits[i >> 3] |= 1 << (i & 7); return true;
}
/** Mở cả bản đồ (đúng `cells` bit đầu, bit thừa giữ 0). */
export function fogFill(d: FogDims): Uint8Array {
  const b = new Uint8Array(d.bytes).fill(0xff), extra = d.bytes * 8 - d.cells;
  if (extra > 0) b[d.bytes - 1] = 0xff >> extra;
  return b;
}
/** Số ô đã khám phá. */
export function fogCount(bits: Uint8Array): number {
  let n = 0; for (const v of bits) { let x = v; while (x) { n += x & 1; x >>= 1; } } return n;
}
/** Ô thô chứa điểm (tx, ty) (ô lưới, số thực); -1 nếu ngoài bản đồ. */
export function fogCellOf(d: FogDims, tx: number, ty: number): number {
  const cx = Math.floor(tx / FOG.cell), cy = Math.floor(ty / FOG.cell);
  return cx < 0 || cy < 0 || cx >= d.cw || cy >= d.ch ? -1 : cy * d.cw + cx;
}
/**
 * Đánh dấu mọi ô thô chạm đĩa bán kính `FOG.sight` ô quanh (tx, ty) (ô lưới, số thực). Trả danh sách số ô VỪA mở (không gồm ô đã mở trước đó)
 * để gửi bản vá; ô nào có điểm gần tâm nhất trong bán kính thì tính (cạnh ô chạm đĩa là đủ).
 */
export function fogReveal(bits: Uint8Array, d: FogDims, tx: number, ty: number, sight: number = FOG.sight): number[] {
  const out: number[] = [], c = FOG.cell;
  if (!Number.isFinite(tx) || !Number.isFinite(ty)) return out;
  const x0 = Math.max(0, Math.floor((tx - sight) / c)), x1 = Math.min(d.cw - 1, Math.floor((tx + sight) / c));
  const y0 = Math.max(0, Math.floor((ty - sight) / c)), y1 = Math.min(d.ch - 1, Math.floor((ty + sight) / c));
  const r2 = sight * sight;
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    const nx = Math.min(Math.max(tx, cx * c), cx * c + c), ny = Math.min(Math.max(ty, cy * c), cy * c + c);
    if ((nx - tx) ** 2 + (ny - ty) ** 2 > r2) continue;
    const i = cy * d.cw + cx; if (fogSet(bits, d, i)) out.push(i);
  }
  return out;
}
/** Bitset đọc từ DB / mạng có hợp lệ với lưới `d` không: đúng kiểu, đúng số byte, bit thừa cuối bằng 0, lưới không vượt `FOG.maxCells`. */
export function fogValid(raw: unknown, d: FogDims): boolean {
  if (!(raw instanceof Uint8Array) || d.cells > FOG.maxCells || raw.length !== d.bytes) return false;
  const extra = d.bytes * 8 - d.cells;
  return extra === 0 || (raw[d.bytes - 1] >> (8 - extra)) === 0;
}
/** Đổi dữ liệu nhận qua mạng (Uint8Array, ArrayBuffer hoặc mảng số) thành Uint8Array; kiểu lạ thì null. */
export function fogBytes(raw: unknown): Uint8Array | null {
  if (raw instanceof Uint8Array) return new Uint8Array(raw);
  if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
  if (ArrayBuffer.isView(raw)) return new Uint8Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  if (Array.isArray(raw) && raw.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) return Uint8Array.from(raw as number[]);
  return null;
}
/** Danh sách số ô nhận qua mạng: chỉ giữ số nguyên trong lưới, tối đa `FOG.maxAdd` phần tử đầu; không phải mảng thì rỗng. */
export function fogCells(raw: unknown, d: FogDims): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  for (const v of raw) { if (out.length >= FOG.maxAdd) break; if (Number.isInteger(v) && v >= 0 && v < d.cells) out.push(v as number); }
  return out;
}
/** Bản đồ `mapId` có sương mù không (bản đồ trong `FOG.open` mở sẵn). */
export const fogOn = (mapId: string) => !FOG.open.includes(mapId);
