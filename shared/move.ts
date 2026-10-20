// Va chạm ô và bước di chuyển dùng chung cho server (map.ts) và client (dự đoán chuyển động, GameScene).
// Cùng file Tiled, cùng hàm: client tự mô phỏng bước đi của chính mình giống hệt server, server vẫn là nguồn sự thật (mục 6).
import { TILE } from "./data.ts";

/** Hộp va chạm của hồn sư quanh chân: nửa rộng, nửa cao (pixel). */
export const PLAYER_HW = 5, PLAYER_HH = 4;
/** Độ dài hướng đi tối thiểu để tính là đang đi (cần điều khiển chạm lệch nhẹ không làm nhân vật trôi). */
export const MOVE_DEAD = 0.15;

/** Lưới ô chặn của một bản đồ: `solid[ty * MW + tx] = 1` là ô chặn. */
export interface SolidGrid { MW: number; MH: number; solid: Uint8Array; }

/** Đọc lưới ô chặn từ file Tiled thô: ô nào trong tileset có thuộc tính `collides` = true thì chặn đường. */
export function solidGrid(raw: any): SolidGrid {
  const MW: number = raw.width, MH: number = raw.height;
  const solidGids = new Set<number>();
  for (const ts of raw.tilesets) for (const t of ts.tiles ?? [])
    if ((t.properties ?? []).some((p: any) => p.name === "collides" && p.value)) solidGids.add(ts.firstgid + t.id);
  const solid = new Uint8Array(MW * MH);
  for (const layer of raw.layers) if (layer.type === "tilelayer")
    layer.data.forEach((gid: number, i: number) => { if (solidGids.has(gid)) solid[i] = 1; });
  return { MW, MH, solid };
}

/** Ô (tx, ty) chặn đường; ngoài bản đồ cũng tính là chặn. */
export const isSolidTile = (g: SolidGrid, tx: number, ty: number) => tx < 0 || ty < 0 || tx >= g.MW || ty >= g.MH || g.solid[ty * g.MW + tx] === 1;

/** Hộp (x ± hw, y ± hh) chạm ô chặn nào không. */
export function hits(g: SolidGrid, x: number, y: number, hw: number, hh: number): boolean {
  const x0 = Math.floor((x - hw) / TILE), x1 = Math.floor((x + hw) / TILE);
  const y0 = Math.floor((y - hh) / TILE), y1 = Math.floor((y + hh) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolidTile(g, tx, ty)) return true;
  return false;
}

/** Dời `e` thêm (dx, dy), từng trục một: trục nào vướng ô chặn thì đứng yên theo trục đó (trượt dọc tường). */
export function moveEnt(g: SolidGrid, e: { x: number; y: number }, dx: number, dy: number, hw: number, hh: number) {
  if (!hits(g, e.x + dx, e.y, hw, hh)) e.x += dx;
  if (!hits(g, e.x, e.y + dy, hw, hh)) e.y += dy;
}

/** Chuẩn hóa hướng đi client gửi (độ dài ≤ 1), như server đọc message `input`. */
export function clampDir(x: number, y: number): { x: number; y: number } {
  const l = Math.hypot(x, y);
  return l > 1 ? { x: x / l, y: y / l } : { x, y };
}
