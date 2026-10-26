// Võ Hồn Chân Thân (GAME_DESIGN.md mục 5.2, vòng 7, 8.1a), tách khỏi MapRoom.ts (#702, bước 24): `chanThan` (biến hình, phím R), `endAva` (kết thúc), `tickAva` (trôi giờ + hồi chiêu).
// Hàm nhận phòng (`room: MapRoom`) như skill.ts; nguyên văn từ MapRoom, không đổi hành vi. MapRoom chỉ chuyển tiếp 3 hàm (`onMessage("chanthan")`, `tick`, đổi võ hồn / gục / đi cổng vẫn gọi `endAva`).
import { Client } from "colyseus";
import { TIERS, VOHON, skillPower, buffPower, CHAN_THAN_RING, chanThanOf, chanThanStats } from "../../../shared/data.ts";
import { type MapRoom } from "./MapRoom.ts";

/**
 * Võ Hồn Chân Thân (vòng 7, 8.1a, mục 5.2): võ hồn ra trận có hồn hoàn thứ CHAN_THAN_RING và dữ liệu CHAN_THAN thì biến hình `secs`
 * giây: chỉ số cộng thêm (chanThanStats theo số năm vòng 7; atk / def / spd / crit / mp qua buffV, sinh lực tối đa trong recalc,
 * phần sinh lực tối đa tăng thêm được hồi luôn), tung `burst` ngay lúc biến hình. Tốn hồn lực, hồi chiêu riêng từng võ hồn.
 * Cùng luật chặn với hồn kỹ (gục, hấp thụ, đi cổng, vùng an toàn, Choáng / Câm lặng).
 */
export function chanThan(room: MapRoom, c: Client) {
  const id = c.sessionId, p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d || p.dead || d.absorbing || d.travelling) return;
  const def = chanThanOf(d.ch.vohon), name = VOHON[p.vh].name;
  if (!def) return room.log(id, `${name} chưa có Võ Hồn Chân Thân (bản sau).`);
  if (p.rings.length < CHAN_THAN_RING) return room.log(id, `Võ Hồn Chân Thân cần hồn hoàn thứ ${CHAN_THAN_RING}.`);
  if (d.ava) return room.log(id, `${def.name} còn ${Math.ceil(d.ava.t)} giây.`);
  if (room.map.inSafe(p.x, p.y)) return room.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c");
  if ((d.avaCd.get(d.ch.rowId) ?? 0) > 0) return;
  if (room.pctl(d).noSkill) return room.log(id, `Đang bị ${room.ccName(d)}: không biến hình được.`, "#ffb35c");
  const cost = def.cost * (1 - Math.min(0.9, room.buffV(d, "mp")));
  if (d.mpF < cost) return room.log(id, "Không đủ hồn lực.");
  d.mpF -= cost; p.mp = Math.floor(d.mpF);
  const ri = CHAN_THAN_RING - 1, tier = p.rings[ri], years = d.ringYears[ri] ?? TIERS[tier].years, col = VOHON[p.vh].col;
  d.avaCd.set(d.ch.rowId, def.cd); p.avaCd = def.cd;
  const hp0 = p.maxHp;
  d.ava = { row: d.ch.rowId, t: def.secs, stats: chanThanStats(def, years) }; p.ava = def.secs;
  room.unhide(p, d);
  room.recalc(id, false);
  d.hpF = Math.min(p.maxHp, d.hpF + Math.max(0, p.maxHp - hp0)); p.hp = Math.ceil(d.hpF);
  // av: chỉ cho client biết đây là biến hình Chân Thân (hiển thị), không phải tung hồn kỹ vòng 7 (G3, #394)
  room.broadcast("fx", { k: "soulring", id, tier, i: ri, vh: p.vh, av: 1 });
  room.broadcast("fx", { k: "avatar", id, name: def.name, col, on: true });
  if (def.burst) room.runSkill(id, def.burst, skillPower(years), buffPower(years), TIERS[tier].glow, { kind: "skill", done: false }, room.shareOf(p, d.ch.vohon));
  room.log(id, `${def.name}: ${def.secs} giây.`, col);
}

/** Hết Võ Hồn Chân Thân (hết giờ, đổi võ hồn, cả đội gục, đi cổng): bỏ chỉ số cộng thêm; `why` = "" thì không báo. */
export function endAva(room: MapRoom, id: string, why: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d?.ava) return;
  d.ava = null; p.ava = 0;
  room.recalc(id, false);
  room.broadcast("fx", { k: "avatar", id, on: false });
  if (why) room.log(id, why, VOHON[p.vh].col);
}

/** Trôi `dt` giây cho Võ Hồn Chân Thân và hồi chiêu Chân Thân của từng võ hồn (tick, hook `rest`). */
export function tickAva(room: MapRoom, id: string, dt: number) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  for (const [r, t] of d.avaCd) if (t - dt <= 0) d.avaCd.delete(r); else d.avaCd.set(r, t - dt);
  p.avaCd = d.avaCd.get(d.ch.rowId) ?? 0;
  if (d.ava) {
    d.ava.t -= dt; p.ava = Math.max(0, d.ava.t);
    if (d.ava.t <= 0) room.endAva(id, `${chanThanOf(d.ch.vohon)?.name ?? "Võ Hồn Chân Thân"} đã hết.`);
  }
}
