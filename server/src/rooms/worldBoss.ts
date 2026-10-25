// Chỗ đứng trên sàn đấu boss thế giới (mục 5.4, #118): vòng an toàn của chiêu toàn sàn và chỗ nổi lên của Du Thủy (lairSpot dùng cả cho
// vùng ngập Thủy Triều Dâng trong hang thú vương, tide.ts, #174). Hàm của server
// (tung bằng `rnd`, server truyền Math.random); tách khỏi MapRoom.ts để giảm xung đột. Luật dùng các chỗ này nằm trong MapRoom.
import { LAIR_SPOT, type Tele } from "../../../shared/data.ts";
import { PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { type GameMap } from "../map.ts";

/** Hộp va chạm khi xét chỗ đứng: vòng an toàn theo hộp hồn sư; chỗ nổi lên và chỗ sinh của boss (spawnKing) theo hộp boss. */
type Box = { hw: number; hh: number };
export const PLAYER_BOX: Box = { hw: PLAYER_HW, hh: PLAYER_HH };
export const BOSS_BOX: Box = { hw: 8, hh: 4 };

/** Đi thẳng từ (ax, ay) tới (bx, by) với hộp `box` không vướng ô chặn (lấy mẫu mỗi 8 pixel). */
function clearLine(map: GameMap, ax: number, ay: number, bx: number, by: number, box: Box) {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 8));
  for (let k = 0; k <= n; k++) if (map.hits(ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, box.hw, box.hh)) return false;
  return true;
}

/** Gốc để xét đi thẳng tới được: chỗ sinh của boss trong sàn; chỗ đó vướng ô chặn (theo hộp `box`) thì dùng tâm sàn. */
export type Anchor = { x: number; y: number };
const anchorOf = (map: GameMap, at: Anchor, box: Box): Anchor => {
  const l = map.lair; return !l || !map.hits(at.x, at.y, box.hw, box.hh) ? at : { x: l.x + l.w / 2, y: l.y + l.h / 2 };
};
/** Bản đồ đã cảnh báo thiếu vòng an toàn (chỉ cảnh báo một lần mỗi bản đồ, Bạo Nộ lặp mỗi WORLD.slamEvery giây). */
const warned = new Set<string>(); // map-co-dinh: khóa theo mapId (số bản đồ cố định)

/**
 * Một chỗ ngẫu nhiên (tọa độ nguyên) trong sàn đấu (object `boss`), trong dải cột `col` / `cols` theo bề ngang, cách mép sàn `pad`,
 * dọc trong dải LAIR_SPOT.band, đi thẳng từ `at` tới được với hộp `box`, thỏa `ok`. Thử LAIR_SPOT.tries lần; không được thì null.
 */
export function lairSpot(map: GameMap, rnd: () => number, at: Anchor, col: number, cols: number, pad: number, box: Box, ok: (x: number, y: number) => boolean) {
  const l = map.lair; if (!l) return null;
  const cw = l.w / cols, [b0, b1] = LAIR_SPOT.band, o = anchorOf(map, at, box);
  // Lấy mẫu đều trong phần cột / dải nằm cách mép sàn `pad` (không kẹp: kẹp dồn nhiều mẫu về đúng mép).
  const x0 = Math.max(l.x + pad, l.x + col * cw), x1 = Math.min(l.x + l.w - pad, l.x + (col + 1) * cw);
  const y0 = Math.max(l.y + pad, l.y + l.h * b0), y1 = Math.min(l.y + l.h - pad, l.y + l.h * b1); if (x1 < x0 || y1 < y0) return null;
  for (let i = 0; i < LAIR_SPOT.tries; i++) {
    const x = Math.round(x0 + (x1 - x0) * rnd()), y = Math.round(y0 + (y1 - y0) * rnd());
    if (ok(x, y) && clearLine(map, o.x, o.y, x, y, box)) return { x, y };
  }
  return null;
}

/**
 * Phần lớn vòng bán kính `r` tâm (x, y) đứng được: hồn sư đứng được ở 8 hướng cách tâm LAIR_SPOT.open × `r` (vòng an toàn, vùng ngập
 * Thủy Triều Dâng #174).
 */
export function openRing(map: GameMap, r: number) {
  const ring = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => [Math.cos((k * Math.PI) / 4) * r * LAIR_SPOT.open, Math.sin((k * Math.PI) / 4) * r * LAIR_SPOT.open]);
  return (x: number, y: number) => ring.every(([dx, dy]) => !map.hits(x + dx, y + dy, PLAYER_HW, PLAYER_HH));
}

/**
 * Vòng an toàn của chiêu toàn sàn (BeastSkillDef.safe): `n` vòng bán kính `r`, mỗi vòng một dải cột theo bề ngang sàn (rải đều), tâm
 * đi thẳng tới được từ chỗ sinh của boss `at`, phần lớn trong vòng đứng được (8 hướng cách tâm LAIR_SPOT.open × bán kính), hai vòng không chồng nhau. Dải nào không tìm được
 * chỗ thì thử cả bề ngang sàn; vẫn thiếu thì cảnh báo log.
 */
export function floorSafeZones(map: GameMap, at: Anchor, n: number, r: number, rnd: () => number): Tele[] {
  const out: Tele[] = [], open = openRing(map, r);
  const apart = (x: number, y: number) => out.every((s) => Math.hypot(x - s.x, y - s.y) >= 2 * r) && open(x, y);
  for (let k = 0; k < n; k++) {
    const p = lairSpot(map, rnd, at, k, n, r, PLAYER_BOX, apart) ?? lairSpot(map, rnd, at, 0, 1, r, PLAYER_BOX, apart);
    if (p) out.push({ shape: "circle", x: p.x, y: p.y, ang: 0, r, w: 0, arc: 0 });
  }
  if (map.lair && out.length < n && !warned.has(map.mapId) && warned.add(map.mapId)) console.warn(`[map ${map.mapId}] Chiêu toàn sàn: chỉ đặt được ${out.length}/${n} vòng an toàn.`);
  return out;
}

/**
 * Chỗ nổi lên của Du Thủy: trong sàn, đi thẳng tới được từ chỗ sinh `at`, cách (fx, fy) ít nhất `away` pixel nếu được (không thì chỗ
 * bất kỳ trong sàn), boss đứng được; null nếu không có sàn hoặc không tìm được (nơi gọi cho nổi lên ở chỗ lặn).
 */
export function surfaceSpot(map: GameMap, at: Anchor, fx: number, fy: number, away: number, rnd: () => number) {
  return lairSpot(map, rnd, at, 0, 1, LAIR_SPOT.pad, BOSS_BOX, (x, y) => Math.hypot(x - fx, y - fy) >= away)
    ?? lairSpot(map, rnd, at, 0, 1, LAIR_SPOT.pad, BOSS_BOX, () => true);
}
