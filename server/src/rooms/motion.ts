// Di chuyển cưỡng bức và hồi phục (GAME_DESIGN.md mục 4, 5.1, 7; #702, miền E3): lướt của hồn sư (`dashStep` / `dashTo`), kéo / đẩy hồn thú (`pullBeast` / `pushBeast`), hồi sinh lực / hồn lực của
// hồn sư (`regenPlayer`, vùng an toàn hồi nhanh hơn), hồi máu hồn thú (`regenBeast`), lãnh vực Phượng Hoàng (`phoenixAmp`). Hàm nhận phòng (`room: MapRoom`) như stats.ts / fog.ts / contrib.ts
// (`regenBeast` là hàm thuần, không nhận phòng); nguyên văn từ MapRoom, không đổi hằng / tốc độ / thứ tự ghi `PlayerState` / `BeastState`. MapRoom chỉ chuyển tiếp (`skill.ts` / `tienco.ts` /
// `tick.ts` / `gm.ts` / `combat.ts` gọi `room.dashStep` / `room.regenPlayer`... như cũ; thứ tự trong `tick` giữ nguyên); `moveBeast` ở `tick.ts`. `ArenaRoom` / `BiCanhRoom` không override hàm nào ở đây.
import { TIERS, VOHON, STATUS, BEAST_REGEN, CC_TIER_MULT, dir4, hpRegen, mpRegen, phoenixFieldR } from "../../../shared/data.ts";
import type { PlayerState, BeastState } from "./schema.ts";
import { dashPath, dashAim, regenStep } from "./calc.ts";
import type { MapRoom } from "./MapRoom.ts";
import type { PData, BData } from "./types.ts";

/** Lướt theo d.dir tối đa `dist` pixel, dừng khi vướng vật cản. Trả về quãng đã lướt. */
export function dashStep(room: MapRoom, p: PlayerState, d: PData, dist: number) {
  const r = dashPath(p.x, p.y, d.dir, dist, (x, y) => room.map.hits(x, y, 5, 4));
  p.x = r.x; p.y = r.y;
  return r.moved;
}

/** Quay mặt về mục tiêu `b` (hồn thú, hoặc đối thủ ở 7.2) cỡ `size` pixel rồi lướt tới sát nó (tối đa `dist`). */
export function dashTo(room: MapRoom, p: PlayerState, d: PData, b: { x: number; y: number }, dist: number, size: number) {
  const aim = dashAim(p, b, dist, size);
  d.dir = aim.dir; p.dir = dir4(d.dir.x, d.dir.y);
  return dashStep(room, p, d, aim.dist);
}

/** Kéo hồn thú về sát hồn sư (gom quái), từng bước nhỏ để không xuyên vật cản. */
export function pullBeast(room: MapRoom, bid: string, p: PlayerState) {
  const b = room.state.beasts.get(bid), bd = room.bdata.get(bid); if (!b || !bd || bd.rooted) return; // thú thực vật cắm rễ (#116)
  const hw = Math.max(3, TIERS[b.tier].size / 3);
  for (let k = 0; k < 40; k++) {
    const dx = p.x - b.x, dy = p.y - b.y, dd = Math.hypot(dx, dy), stop = TIERS[b.tier].size / 2 + 8;
    if (dd <= stop) break;
    const s = Math.min(4, dd - stop), x0 = b.x, y0 = b.y;
    room.moveBeast(b, (dx / dd) * s, (dy / dd) * s, hw); // không kéo vào vùng an toàn
    if (b.x === x0 && b.y === y0) break;
  }
  bd.kx = 0; bd.ky = 0;
}

/**
 * Đẩy lùi hồn thú ra xa hồn sư `dist` pixel (nhân CC_TIER_MULT theo bậc), từng bước nhỏ để không xuyên vật cản. Hồn thú đang
 * Choáng / Trói và thú thực vật đứng yên (#116) không bị đẩy (mục 5.1), và không bị đẩy vào vùng an toàn (moveBeast).
 */
export function pushBeast(room: MapRoom, bid: string, p: PlayerState, dist: number) {
  const b = room.state.beasts.get(bid), bd = room.bdata.get(bid); if (!b || !bd || bd.st.has("stun") || bd.st.has("root") || bd.rooted) return;
  const hw = Math.max(3, TIERS[b.tier].size / 3), dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1;
  let left = dist * (CC_TIER_MULT[b.tier] ?? 1);
  while (left > 0) {
    const s = Math.min(4, left), x0 = b.x, y0 = b.y;
    room.moveBeast(b, (dx / dd) * s, (dy / dd) * s, hw); left -= s;
    if (b.x === x0 && b.y === y0) break;
  }
}

/**
 * Hồi sinh lực / hồn lực của hồn sư trong `dt` giây (mục 4, hpRegen / mpRegen); vùng an toàn hồi nhanh hơn (SAFE_REGEN_MULT).
 * Võ hồn khác trong đội (chưa gục) hồi sinh lực cùng nhịp với võ hồn ra trận. Trả về có đang ở vùng an toàn không.
 */
export function regenPlayer(room: MapRoom, p: PlayerState, d: PData, dt: number): boolean {
  const safe = room.map.inSafe(p.x, p.y), regen = (max: number) => hpRegen(max, d.lastHit, safe) * dt;
  d.mpF = Math.min(p.maxMp, d.mpF + mpRegen(p.level, VOHON[p.vh].mp, safe) * dt);
  d.hpF = Math.min(p.maxHp, d.hpF + regen(p.maxHp));
  p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
  for (const [r, hp] of d.benchHp) {
    const v = d.owned.find((o) => o.rowId === r), max = v ? room.maxHpOf(d, v) : 0;
    const nv = hp + regen(max);
    if (!v || nv >= max) d.benchHp.delete(r); else d.benchHp.set(r, nv);
  }
  return safe;
}

/** Hồn thú không mục tiêu, không bị đánh BEAST_REGEN.delay giây thì hồi máu; Trúng độc giảm hồi máu (healCut). */
export function regenBeast(b: BeastState, bd: BData, dt: number, pct = BEAST_REGEN.pct) {
  regenStep(b, bd, bd.st.has("poison") ? 1 - STATUS.poison.healCut : 1, pct, dt);
}

/**
 * Lãnh vực phượng hoàng (Tà Hỏa Phượng Hoàng, 2.5b): hồn thú trong PHOENIX_FIELD_R quanh một hồn sư đang có lãnh vực nhận thêm
 * sát thương từ mọi nguồn (lấy lãnh vực mạnh nhất, không cộng nhiều lãnh vực). Hồn sư đã gục, đang chuyển bản đồ hoặc đứng
 * trong vùng an toàn thì lãnh vực không có tác dụng. Từ 8.1b bán kính theo phoenixFieldR: võ hồn ra trận đang Chân Thân có
 * `field` (Tà Hỏa Phượng Hoàng Chân Thân) thì lãnh vực rộng hơn.
 */
export function phoenixAmp(room: MapRoom, b: BeastState) {
  let a = 0;
  for (const [pid, pd] of room.pdata) {
    const v = pd.buffs.get("phoenix")?.v ?? 0, pp = room.state.players.get(pid);
    if (v <= a || !pp || pp.dead || pd.travelling || room.map.inSafe(pp.x, pp.y)) continue;
    if (Math.hypot(b.x - pp.x, b.y - pp.y) < phoenixFieldR(pd.ch.vohon, !!pd.ava)) a = v;
  }
  return a;
}
