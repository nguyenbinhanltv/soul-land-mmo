// Tiên cơ, năng lượng đồng đội, Phong Lôi Chi Lực (GAME_DESIGN.md mục 5.1, 5.6, 2.5), tách khỏi MapRoom.ts (#702, bước 24): `tienCoSet`, `gainEnergy`, `gainLei`, `leiDong`, `tickEnergy`, `tienCo`.
// Hàm nhận phòng (`room: MapRoom`) như skill.ts; nguyên văn từ MapRoom, không đổi hành vi. MapRoom chỉ chuyển tiếp 6 hàm.
import { BeastState } from "./schema.ts";
import { TIERS, VOHON, TIEN_CO, TIEN_CO_MAX, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY, energyGain, tienCoDmgMult, starTienCoMult, CORE_SET_2, CORE_SET_4, coreSetCounts, skillPower, PHONG_LOI, TIEN_CO_RIENG, chanThanOf, ARENA, MELEE_REACH, TIEN_CO_DASH_INV } from "../../../shared/data.ts";
import { Character } from "../db.ts";
import { type MapRoom, type PData, type Hit } from "./MapRoom.ts";

/** Bộ hồn hạch Tiên Cơ (mục 5.6) gắn trên võ hồn `v` (từ 5.2): 2 món tích năng lượng nhanh hơn (khi ở ngoài), 4 món tiên cơ mạnh hơn. */
export function tienCoSet(room: MapRoom, d: PData, v: Character) {
  const n = coreSetCounts(room.coresOn(d, v.rowId)).get("tien_co") ?? 0;
  return { set2: n >= CORE_SET_2, set4: n >= CORE_SET_4 };
}

/** Võ hồn ra trận đánh trúng: mỗi võ hồn khác trong đội chưa gục tích năng lượng tiên cơ (mục 5.1 "Trong trận"). */
export function gainEnergy(room: MapRoom, id: string, kind: Hit["kind"]) {
  const d = room.pdata.get(id); if (!d) return;
  for (const r of d.team) {
    const v = d.owned.find((o) => o.rowId === r);
    if (!v || v === d.ch || d.down.has(r)) continue;
    d.energy.set(r, Math.min(TIEN_CO_MAX, (d.energy.get(r) ?? 0) + energyGain(kind, room.tienCoSet(d, v).set2)));
  }
  room.sendSquad(id);
}

/**
 * Phong Lôi Chi Lực (PHONG_LOI, 2.5c): Lam Điện Bá Vương Long ra trận đánh trúng thì tích (gấp shockMult nếu hồn thú trúng đầu
 * tiên đang Cảm điện). Đầy thì hẹn tung Lôi Động Minh Thiên ở tick sau (không tung giữa lúc đang tính một đòn).
 * Từ 8.1c: đang Võ Hồn Chân Thân thì tích gấp `ChanThanDef.lei` (Chân Thân thuộc võ hồn ra trận nên chỉ khi Lam Điện đang biến hình).
 */
export function gainLei(room: MapRoom, id: string, kind: Hit["kind"], shocked: boolean) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || VOHON[p.vh].id !== PHONG_LOI.vohon) return;
  const ava = d.ava ? chanThanOf(PHONG_LOI.vohon)?.lei ?? 1 : 1;
  d.lei = Math.min(PHONG_LOI.max, d.lei + PHONG_LOI.gain[kind] * (shocked ? PHONG_LOI.shockMult : 1) * ava); p.lei = Math.floor(d.lei);
  if (d.lei >= PHONG_LOI.max && !d.leiQueued) { d.leiQueued = true; room.later(0, () => room.leiDong(id)); }
}

/** Lôi Động Minh Thiên: chỉ khi Lam Điện vẫn ra trận, còn sống, không trong vùng an toàn / đang chuyển bản đồ (không thì giữ thanh đầy). */
export function leiDong(room: MapRoom, id: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  d.leiQueued = false;
  if (p.dead || d.travelling || VOHON[p.vh].id !== PHONG_LOI.vohon || d.lei < PHONG_LOI.max || room.map.inSafe(p.x, p.y)) return;
  d.lei = 0; p.lei = 0;
  const sk = PHONG_LOI.skill, col = VOHON[p.vh].col, years = Math.max(TIERS[0].years, ...d.ringYears);
  room.broadcast("fx", { k: "bolt", id, x: p.x, y: p.y, r: sk.r, col, name: sk.name });
  room.runSkill(id, sk, skillPower(years), 1, col);
  room.log(id, `${PHONG_LOI.name} đầy: ${sk.name}!`, col);
}

/** Ra khỏi giao chiến quá TIEN_CO_IDLE_SECS giây: năng lượng cả đội (và Phong Lôi Chi Lực) giảm dần mỗi giây. */
export function tickEnergy(room: MapRoom, id: string, dt: number) {
  const d = room.pdata.get(id)!, idle = Math.min(dt, d.fight - TIEN_CO_IDLE_SECS);
  if (idle > 0 && d.lei > 0) { d.lei = Math.max(0, d.lei - idle * PHONG_LOI.decay); room.state.players.get(id)!.lei = Math.floor(d.lei); }
  if (idle <= 0 || !d.energy.size) return;
  for (const [r, e] of d.energy) { if (e - idle * TIEN_CO_DECAY <= 0) d.energy.delete(r); else d.energy.set(r, e - idle * TIEN_CO_DECAY); }
}

/**
 * Chiêu tiên cơ của võ hồn vừa đổi vào. Võ hồn có tiên cơ riêng (TIEN_CO_RIENG, bước 2.5a) chạy bằng bộ máy hồn kỹ với sức
 * mạnh tienCoDmgMult. Còn lại dùng tiên cơ chung theo hệ (bảng TIEN_CO, bước 2.4): cường công nổ diện rộng, mẫn công lướt tới
 * hồn thú gần nhất và chém mạnh, khống chế choáng diện rộng, phụ trợ hồi sinh lực cả đội và tạo khiên. Không tốn hồn lực,
 * không tạo năng lượng.
 */
export function tienCo(room: MapRoom, id: string) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!, def = VOHON[p.vh], he = def.he, tc = TIEN_CO[he];
  const mult = tienCoDmgMult(room.tienCoSet(d, d.ch).set4), dmg = room.atkOf(d) * tc.dmg * mult, col = def.col, x0 = p.x, y0 = p.y;
  const own = TIEN_CO_RIENG[def.id];
  room.unhide(p, d); // tung tiên cơ cũng hiện hình như đánh thường / hồn kỹ
  room.questEvent(id, { k: "tienco" }); // 6.2
  if (own) {
    room.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, vh: p.vh, own: true });
    // Sao võ hồn (9.5): sát thương và mức hiệu ứng tiên cơ riêng × starTienCoMult (6★ thêm STAR_TIEN_CO).
    const sm = starTienCoMult(d.ch.stars);
    room.runSkill(id, own, mult * sm, sm, col, undefined, room.shareOf(p, def.id)); // 9.1: tiên cơ của võ hồn Phụ trợ lan cho tổ đội
    room.log(id, `Tiên cơ – ${def.name}: ${own.name}, ${own.desc}!`, col);
    room.sendSquad(id);
    return;
  }
  if (he === "man_cong") {
    // Lướt về hồn thú gần nhất trong tầm (không có thì lướt theo hướng đang nhìn), dừng sát mục tiêu hoặc khi vướng vật cản.
    let tgt: string | undefined, b: BeastState | undefined, best = tc.range;
    for (const [bid, o] of room.beastsNear(p.x, p.y, tc.range)) { const dd = Math.hypot(o.x - p.x, o.y - p.y); if (dd < best) { best = dd; tgt = bid; b = o; } }
    // Không có hồn thú trong tầm thì lướt tới đối thủ gần nhất (Đại Đấu Hồn Trường, 7.2).
    const fid = b ? undefined : room.nearestFoe(id, tc.range), f = fid ? room.state.players.get(fid) : undefined;
    if (b) room.dashTo(p, d, b, tc.dash, TIERS[b.tier].size); else if (f) room.dashTo(p, d, f, tc.dash, ARENA.body * 2); else room.dashStep(p, d, tc.dash);
    d.inv = Math.max(d.inv, TIEN_CO_DASH_INV);
    room.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, x0, y0 });
    // Lướt vào vùng an toàn thì không chém (không giao chiến trong vùng an toàn).
    if (tgt && b && !room.map.inSafe(p.x, p.y) && Math.hypot(b.x - p.x, b.y - p.y) < MELEE_REACH + TIERS[b.tier].size) room.damageBeast(tgt, dmg, id, col);
    if (fid && f && Math.hypot(f.x - p.x, f.y - p.y) < MELEE_REACH + ARENA.body * 2) room.damageFoe(fid, dmg, id, col);
  } else if (he === "phu_tro") {
    const hm = room.healMult(d); // bộ hồn hạch Lưu Ly 2 món (5.2), ràng buộc Lam Ngân Hoàng (9.4)
    room.healTeam(id, tc.heal * hm);
    d.shield = Math.max(d.shield, Math.round(p.maxHp * tc.shield * hm)); d.shieldT = tc.shieldSecs; p.shield = d.shield;
    room.partyShare(id, { heal: tc.heal, shield: tc.shield, secs: tc.shieldSecs }, 1, hm, col, def.id); // 9.1: lan cho tổ đội
    room.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y });
  } else {
    room.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, r: tc.r });
    const near = room.beastsNear(p.x, p.y, tc.r).filter(([, b]) => Math.hypot(b.x - p.x, b.y - p.y) < tc.r + TIERS[b.tier].size / 2);
    for (const [bid] of near) {
      if (tc.stun) room.applyStatus(bid, { s: "stun", secs: tc.stun }, id);
      room.damageBeast(bid, dmg, id, col);
    }
    for (const fid of room.foesNear(id, tc.r + ARENA.body, p.x, p.y)) {
      if (room.damageFoe(fid, dmg, id, col) && tc.stun) room.applyPStatus(fid, { s: "stun", secs: tc.stun }, 0, id);
    }
  }
  room.log(id, `Tiên cơ – ${def.name}: ${tc.name}, ${tc.desc}!`, col);
  room.sendSquad(id);
}
