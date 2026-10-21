// Chỗ đứng trên sàn đấu boss thế giới (mục 5.4, #118): vòng an toàn của chiêu toàn sàn và chỗ nổi lên của Du Thủy. Hàm của server
// (tung bằng `rnd`, server truyền Math.random); tách khỏi MapRoom.ts để giảm xung đột. Luật dùng các chỗ này nằm trong MapRoom.
import { LAIR_SPOT, type Tele } from "../../../shared/data.ts";
import { PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { type GameMap } from "../map.ts";

/** Hộp va chạm khi xét chỗ đứng: vòng an toàn theo hộp hồn sư; chỗ nổi lên theo hộp boss (như spawnKing, `hits(x, y, 8, 4)`). */
type Box = { hw: number; hh: number };
const PLAYER_BOX: Box = { hw: PLAYER_HW, hh: PLAYER_HH }, BOSS_BOX: Box = { hw: 8, hh: 4 };

/** Đi thẳng từ (ax, ay) tới (bx, by) với hộp `box` không vướng ô chặn (lấy mẫu mỗi 8 pixel). */
function clearLine(map: GameMap, ax: number, ay: number, bx: number, by: number, box: Box) {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 8));
  for (let k = 0; k <= n; k++) if (map.hits(ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, box.hw, box.hh)) return false;
  return true;
}

/**
 * Một chỗ ngẫu nhiên trong sàn đấu (object `boss`), trong dải cột `col` / `cols` theo bề ngang, cách mép sàn `pad`, dọc trong dải
 * LAIR_SPOT.band, đi thẳng từ tâm sàn tới được với hộp `box`, thỏa `ok`. Thử LAIR_SPOT.tries lần; không được thì null.
 */
function lairSpot(map: GameMap, rnd: () => number, col: number, cols: number, pad: number, box: Box, ok: (x: number, y: number) => boolean) {
  const l = map.lair; if (!l) return null;
  const cx = l.x + l.w / 2, cy = l.y + l.h / 2, cw = l.w / cols, [b0, b1] = LAIR_SPOT.band;
  for (let i = 0; i < LAIR_SPOT.tries; i++) {
    const x = Math.min(l.x + l.w - pad, Math.max(l.x + pad, l.x + (col + rnd()) * cw)), y = l.y + l.h * (b0 + (b1 - b0) * rnd());
    if (ok(x, y) && clearLine(map, cx, cy, x, y, box)) return { x: Math.round(x), y: Math.round(y) };
  }
  return null;
}

/**
 * Vòng an toàn của chiêu toàn sàn (BeastSkillDef.safe): `n` vòng bán kính `r`, mỗi vòng một dải cột theo bề ngang sàn (rải đều), tâm
 * tới được từ tâm sàn, hai vòng không chồng nhau. Dải nào không tìm được chỗ thì thử cả bề ngang sàn; vẫn thiếu thì cảnh báo log.
 */
export function floorSafeZones(map: GameMap, n: number, r: number, rnd: () => number): Tele[] {
  const out: Tele[] = [], apart = (x: number, y: number) => out.every((s) => Math.hypot(x - s.x, y - s.y) >= 2 * r);
  for (let k = 0; k < n; k++) {
    const p = lairSpot(map, rnd, k, n, r, PLAYER_BOX, apart) ?? lairSpot(map, rnd, 0, 1, r, PLAYER_BOX, apart);
    if (p) out.push({ shape: "circle", x: p.x, y: p.y, ang: 0, r, w: 0, arc: 0 });
  }
  if (map.lair && out.length < n) console.warn(`[map ${map.mapId}] Chiêu toàn sàn: chỉ đặt được ${out.length}/${n} vòng an toàn.`);
  return out;
}

/**
 * Chỗ nổi lên của Du Thủy: trong sàn, cách (fx, fy) ít nhất `away` pixel nếu được (không thì chỗ bất kỳ trong sàn), boss đứng được;
 * null nếu không có sàn hoặc không tìm được (nơi gọi dùng chỗ sinh của boss).
 */
export function surfaceSpot(map: GameMap, fx: number, fy: number, away: number, rnd: () => number) {
  return lairSpot(map, rnd, 0, 1, LAIR_SPOT.pad, BOSS_BOX, (x, y) => Math.hypot(x - fx, y - fy) >= away)
    ?? lairSpot(map, rnd, 0, 1, LAIR_SPOT.pad, BOSS_BOX, () => true);
}
