// Đọc bản đồ Tiled dùng chung với client để server tự kiểm tra va chạm.
// Ô nào có thuộc tính "collides" = true trong tileset sẽ chặn đường.
import { readFileSync } from "node:fs";
import { TILE } from "../../shared/data.ts";

export interface Zone { name: string; hint: string; x0: number; x1: number; y0: number; y1: number; weights: number[]; count: number; }

const raw = JSON.parse(readFileSync(new URL("../../shared/assets/forest.json", import.meta.url), "utf8"));
export const MW: number = raw.width, MH: number = raw.height;

const solidGids = new Set<number>();
for (const ts of raw.tilesets) for (const t of ts.tiles ?? [])
  if ((t.properties ?? []).some((p: any) => p.name === "collides" && p.value)) solidGids.add(ts.firstgid + t.id);

export const solid = new Uint8Array(MW * MH);
for (const layer of raw.layers) if (layer.type === "tilelayer")
  layer.data.forEach((gid: number, i: number) => { if (solidGids.has(gid)) solid[i] = 1; });

export const zones: Zone[] = [];
export let spawn = { x: 3 * TILE, y: 28 * TILE, w: 4 * TILE, h: 4 * TILE };
for (const layer of raw.layers) if (layer.type === "objectgroup") for (const o of layer.objects) {
  const prop = (n: string) => (o.properties ?? []).find((p: any) => p.name === n)?.value;
  if (o.type === "zone") zones.push({
    name: o.name, hint: prop("hint") ?? "", x0: o.x, x1: o.x + o.width, y0: o.y, y1: o.y + o.height,
    weights: String(prop("weights") ?? "1").split(",").map(Number), count: Number(prop("count") ?? 8),
  });
  if (o.type === "spawn") spawn = { x: o.x, y: o.y, w: o.width, h: o.height };
}

export const isSolidTile = (tx: number, ty: number) => tx < 0 || ty < 0 || tx >= MW || ty >= MH || solid[ty * MW + tx] === 1;

export function hits(x: number, y: number, hw: number, hh: number) {
  const x0 = Math.floor((x - hw) / TILE), x1 = Math.floor((x + hw) / TILE);
  const y0 = Math.floor((y - hh) / TILE), y1 = Math.floor((y + hh) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolidTile(tx, ty)) return true;
  return false;
}

export function moveEnt(e: { x: number; y: number }, dx: number, dy: number, hw: number, hh: number) {
  if (!hits(e.x + dx, e.y, hw, hh)) e.x += dx;
  if (!hits(e.x, e.y + dy, hw, hh)) e.y += dy;
}

export function inSpawn(x: number, y: number) {
  return x >= spawn.x && x <= spawn.x + spawn.w && y >= spawn.y && y <= spawn.y + spawn.h;
}
