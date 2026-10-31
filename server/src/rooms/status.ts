// Trạng thái dùng chung (GAME_DESIGN.md mục 5.1, 2.5; docs/design/trang-thai-buff.md), tách khỏi MapRoom.ts (#702, bước 22):
// trạng thái trên hồn thú (`applyStatus`, `syncStatus`, `detonateBurn`, `tickStatus`) và trên hồn sư (`applyPStatus`, `syncPStatus`, `clearPStatus`, `pctl`, `ccName`, `charmDir`, `tickPStatus`).
// Hàm nhận phòng (`room: MapRoom`) như combat.ts; nguyên văn từ MapRoom, không đổi số / thứ tự RNG / thứ tự xử lý trong tick. MapRoom chỉ chuyển tiếp 11 hàm
// (`damageBeast`, `hurtPlayer`, `skill.ts`, `tick.ts`, `arena.ts`, `autoHunt.ts`, `gm.ts` gọi `room.applyStatus` / `room.pctl` ... như cũ).
import { PlayerState, BeastState } from "./schema.ts";
import { VOHON, isCcStatus, type CoreFx, STATUS, STATUS_TICK, CC_TIER_MULT, statusBit, SLOW_CAP, type StatusId, type StatusApply, PLAYER_STATUS, ARENA, ARENA_HE_DMG, RESIST_AS, PLAYER_CHARM } from "../../../shared/data.ts";
import type { MapRoom } from "./MapRoom.ts";
import type { BData, PData, FusHit, SInst } from "./types.ts";

/**
 * Gây trạng thái `a` lên hồn thú `bid`, người gây `by`, sức mạnh hồn kỹ `power`. Cộng dồn tầng tới STATUS.max, thời gian lấy
 * phần còn lại dài hơn, độ lớn lấy giá trị mạnh hơn. Khống chế ngắn hơn với hồn thú bậc cao (CC_TIER_MULT).
 * `fus` (#192): gây bởi Võ Hồn Dung Hợp Kỹ: công `fus.atk` thay công của `by`, không nhận ràng buộc, sát thương theo thời gian chia
 * đôi đóng góp với đồng đội `fus.pair`.
 */
export function applyStatus(room: MapRoom, bid: string, a: StatusApply, by: string, power = 1, fus?: FusHit) {
  const pair = fus?.pair;
  const b = room.state.beasts.get(bid), bd = room.bdata.get(bid), pd = room.pdata.get(by), p = room.state.players.get(by);
  // Như damageBeast: đang chuyển bản đồ hoặc đứng trong vùng an toàn thì không gây trạng thái.
  if (!b || !bd || b.hp <= 0 || !pd || !p || pd.travelling || room.map.inSafe(p.x, p.y)) return;
  const def = STATUS[a.s], fx = pd.coreFx, w = bd.elite?.king?.world, cc = def.noMove || def.noAtk || def.noSkill || def.wander;
  // Thú vương đang gầm chuyển giai đoạn (BĐ5): không nhận khống chế.
  if (bd.elite?.king?.roar && cc) return;
  // Boss thế giới (BĐ6e): đang lặn thì không nhận gì; không nhận khống chế (bá thể), chỉ tính lần ngắt tích lực của võ hồn Khống chế.
  if (w && (w.dive > 0 || cc)) { if (cc && w.dive <= 0) room.worldBreak(bid, b, bd, w, by); return; }
  if (a.s === "allure" && bd.st.has("charm")) return; // đang Mê hoặc thì không cộng Mị hoặc (không khống chế nối liền)
  // Bộ hồn hạch Lam Ngân 2 món (5.2): khống chế do hồn sư gây kéo dài hơn.
  const secs = (a.secs ?? def.secs) * (def.noMove || def.noAtk ? CC_TIER_MULT[b.tier] ?? 1 : 1) * (isCcStatus(a.s) ? 1 + (fx.cc ?? 0) : 1);
  // Ràng buộc Tà Hỏa – Hỏa Ảnh (2.5d), bộ hồn hạch Phượng Hoàng / Xà Hoàng 2 món (5.2): Thiêu đốt / Trúng độc của hồn sư mạnh
  // thêm, tính lúc gây như tăng công.
  const amp = a.s === "burn" ? (pair ? 0 : room.bondV(pd, "burn")) + (fx.burn ?? 0) : a.s === "poison" ? fx.poison ?? 0 : 0;
  const v = def.dot ? (fus ? fus.atk : room.atkOf(pd, true, "mid")) * def.dot * power * (1 + amp) : def.amp;
  // Bộ Phượng Hoàng 4 món: Thiêu đốt của hồn sư thêm tầng tối đa (người khác gây tiếp không làm giảm số tầng đang có).
  const max = def.max + (a.s === "burn" ? fx.burnMax ?? 0 : 0);
  const cur = bd.st.get(a.s), n = a.n ?? 1;
  if (cur) { cur.n = Math.max(cur.n, Math.min(max, cur.n + n)); cur.t = Math.max(cur.t, secs); cur.v = Math.max(cur.v, v); cur.src = by; cur.pair = pair; }
  else bd.st.set(a.s, { t: secs, n: Math.min(max, n), v, src: by, pair });
  if (def.noMove) { bd.kx = 0; bd.ky = 0; }
  // Đủ tầng thì bùng phát (2.5c): Mị hoặc thành Mê hoặc, Phong ấn thành Dễ thương 6,8 giây; tầng về 0.
  if (def.burst && bd.st.get(a.s)!.n >= def.max) {
    bd.st.delete(a.s);
    room.applyStatus(bid, { s: def.burst.s, ...(def.burst.secs ? { secs: def.burst.secs } : {}) }, by, power, fus);
    if (STATUS[def.burst.s].wander) { bd.target = null; b.aggro = false; }
  }
  room.syncStatus(b, bd);
}

/** Đồng bộ trạng thái hồn thú cho client: bit theo STATUS_IDS và số tầng Thiêu đốt / Trúng độc / Phá giáp / Mị hoặc / Phong ấn. */
export function syncStatus(room: MapRoom, b: BeastState, bd: BData) {
  let m = 0; for (const s of bd.st.keys()) m |= statusBit(s);
  b.st = m; b.burn = bd.st.get("burn")?.n ?? 0; b.poison = bd.st.get("poison")?.n ?? 0; b.armor = bd.st.get("armor")?.n ?? 0;
  b.allure = bd.st.get("allure")?.n ?? 0; b.lock = bd.st.get("lock")?.n ?? 0;
}

/**
 * Viêm bạo: kích nổ mọi tầng Thiêu đốt còn lại cùng lúc (sát thương còn lại × boom), xóa Thiêu đốt. Hỏa Long dùng (SkillDef.boom, 2.5b).
 * `by`: người kích nổ; bộ hồn hạch Phượng Hoàng 4 món của người đó (không có `by` thì của người gây Thiêu đốt) thêm sát thương (5.2).
 * `extra`: hồn kỹ nổ mạnh thêm (SkillDef.boom.mult, tuyệt kỹ Hỏa Long 8.1b), cộng với bộ hồn hạch.
 */
export function detonateBurn(room: MapRoom, bid: string, by?: string, extra = 0) {
  const bd = room.bdata.get(bid), s = bd?.st.get("burn"); if (!bd || !s) return;
  bd.st.delete("burn"); room.syncStatus(room.state.beasts.get(bid)!, bd);
  const boom = 1 + (room.pdata.get(by ?? s.src)?.coreFx.boom ?? 0) + extra;
  room.damageBeast(bid, s.v * s.n * s.t * STATUS.burn.boom * boom, s.src, STATUS.burn.col, undefined, { direct: false, pair: s.pair });
}

/** Mỗi tick: trạng thái hết giờ thì bỏ; mỗi STATUS_TICK giây Thiêu đốt / Trúng độc gây sát thương (người gây đã rời thì bỏ). */
export function tickStatus(room: MapRoom, bid: string, dt: number) {
  const b = room.state.beasts.get(bid), bd = room.bdata.get(bid); if (!b || !bd || !bd.st.size) return;
  bd.dotT += dt;
  const dots: [StatusId, SInst][] = [];
  if (bd.dotT >= STATUS_TICK) { bd.dotT -= STATUS_TICK; for (const [s, x] of bd.st) if (STATUS[s].dot) dots.push([s, { ...x }]); }
  let changed = false;
  for (const [s, x] of bd.st) { x.t -= dt; if (x.t <= 0) { bd.st.delete(s); changed = true; } }
  if (changed) room.syncStatus(b, bd);
  for (const [s, x] of dots) {
    if (!room.state.players.has(x.src)) { bd.st.delete(s); room.syncStatus(b, bd); continue; }
    if (!room.state.beasts.has(bid)) return;
    room.damageBeast(bid, x.v * x.n, x.src, STATUS[s].col, undefined, { direct: false, pair: x.pair });
  }
  if (!bd.st.size) bd.dotT = 0;
}

/**
 * Gây trạng thái `a` lên hồn sư `id` (do chiêu báo trước, `base`: sát thương đòn thường của hồn thú, nhân `dot` thành sát thương
 * mỗi giây mỗi tầng). Cùng luật cộng tầng với hồn thú (applyStatus). Không gây cho người đã gục, đang chuyển bản đồ, trong vùng an toàn.
 * `src`: đối thủ gây (Đại Đấu Hồn Trường, #277; `base` đã × ARENA.dmgMult): khống chế × ARENA.ccMult sau kháng; Thiêu đốt / Trúng độc ×
 * ARENA_HE_DMG theo hệ người gây × (1 + bộ Phượng Hoàng / Xà Hoàng 2 món + ràng buộc Tà Hỏa – Hỏa Ảnh), tính một lần lúc gây; bộ
 * Phượng Hoàng 4 món thêm tầng Thiêu đốt tối đa; Trúng độc ghi người gây (Xà Hoàng 4 món, hurtPlayer).
 */
export function applyPStatus(room: MapRoom, id: string, a: StatusApply, base: number, src?: string): void {
  const p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d || p.dead || d.travelling || room.map.inSafe(p.x, p.y) || !PLAYER_STATUS.includes(a.s)) return;
  // Kháng trạng thái của bị động hồn cốt (4.3): thời gian ngắn đi theo tỉ lệ.
  // Đóng băng / Mê hoặc (#116) dùng kháng Choáng khi bị động không ghi riêng (RESIST_AS).
  const res = d.passive.resist[a.s] ?? (RESIST_AS[a.s] ? d.passive.resist[RESIST_AS[a.s]!] ?? 0 : 0);
  const sd = src ? room.pdata.get(src) : undefined, sp = src ? room.state.players.get(src) : undefined, fx: CoreFx = sd?.coreFx ?? {};
  const def = STATUS[a.s], secs = (a.secs ?? def.secs) * (1 - res) * (sd && isCcStatus(a.s) ? ARENA.ccMult : 1);
  const amp = !sd ? 0 : a.s === "burn" ? room.bondV(sd, "burn") + (fx.burn ?? 0) : a.s === "poison" ? fx.poison ?? 0 : 0;
  const he = sp ? VOHON[sp.vh]?.he : undefined, pvp = he ? ARENA_HE_DMG[he] * (1 + amp) : 1;
  const v = def.dot ? base * def.dot * pvp : def.amp, max = def.max + (sd && a.s === "burn" ? fx.burnMax ?? 0 : 0), cur = d.st.get(a.s), n = a.n ?? 1;
  if (cur) { cur.n = Math.max(cur.n, Math.min(max, cur.n + n)); cur.t = Math.max(cur.t, secs); cur.v = Math.max(cur.v, v); if (src) cur.src = src; }
  else d.st.set(a.s, { t: secs, n: Math.min(max, n), v, src: src ?? "" });
  if (def.wander) d.charm = null; // Mê hoặc mới (#116): đi lung tung quanh chỗ đang đứng lúc trúng
  // Đủ tầng thì bùng phát (#163, tầng Hàn thành Đóng băng): bỏ trạng thái này, gây trạng thái `burst.s` (qua kháng như mọi lần gây).
  if (def.burst && d.st.get(a.s)!.n >= def.max) {
    d.st.delete(a.s); room.syncPStatus(p, d);
    return room.applyPStatus(id, { s: def.burst.s, secs: def.burst.secs }, base, src);
  }
  room.syncPStatus(p, d); // Trói / Choáng: tick bỏ qua input (giữ nguyên hướng phím, hết khống chế thì đi tiếp)
}

export function syncPStatus(room: MapRoom, p: PlayerState, d: PData) { let m = 0; for (const s of d.st.keys()) m |= statusBit(s); p.st = m; p.han = d.st.get("chill")?.n ?? 0; }

export function clearPStatus(room: MapRoom, p: PlayerState, d: PData) { d.hanT = 0; if (d.st.size) { d.st.clear(); d.dotT = 0; d.charm = null; room.syncPStatus(p, d); } }

/**
 * Khống chế đang có trên hồn sư: không đi (Choáng, Đóng băng, Trói), không đánh (Choáng, Đóng băng, Mê hoặc), không dùng hồn kỹ (thêm
 * Câm lặng), đi lung tung (Mê hoặc, #116), làm chậm.
 */
export function pctl(room: MapRoom, d: PData) {
  let noMove = false, noAtk = false, noSkill = false, wander = false, slow = 0;
  for (const [s, x] of d.st) { const def = STATUS[s]; noMove ||= def.noMove; noAtk ||= def.noAtk; noSkill ||= def.noAtk || def.noSkill; wander ||= def.wander; slow += def.slow * x.n; }
  return { noMove, noAtk, noSkill, wander, slow: Math.min(SLOW_CAP, slow) };
}

/** Tên khống chế đang chặn hồn kỹ (`move`: đang chặn đi, cho đi cổng / truyền tống) của hồn sư, cho tin từ chối. */
export function ccName(room: MapRoom, d: PData, move = false) {
  const order = move ? (["freeze", "stun", "charm", "root"] as const) : (["freeze", "stun", "charm", "silence"] as const);
  return STATUS[order.find((s) => d.st.has(s)) ?? order[order.length - 1]].name;
}

/**
 * Hồn sư đang Mê hoặc (#116, PLAYER_CHARM): hướng đi server tự chọn tới một điểm ngẫu nhiên quanh chỗ bị Mê hoặc, đổi điểm mỗi
 * `turn` giây; tới nơi thì đứng.
 */
export function charmDir(room: MapRoom, p: PlayerState, d: PData, dt: number) {
  const c = d.charm ??= { ox: p.x, oy: p.y, tx: p.x, ty: p.y, t: 0 }, [t0, t1] = PLAYER_CHARM.turn;
  if ((c.t -= dt) <= 0) {
    c.t = t0 + Math.random() * (t1 - t0);
    c.tx = c.ox + (Math.random() * 2 - 1) * PLAYER_CHARM.r; c.ty = c.oy + (Math.random() * 2 - 1) * PLAYER_CHARM.r;
  }
  const dx = c.tx - p.x, dy = c.ty - p.y, dd = Math.hypot(dx, dy);
  return dd > 2 ? { x: dx / dd, y: dy / dd } : { x: 0, y: 0 };
}

/** Mỗi tick: vào vùng an toàn thì hết mọi trạng thái; hết giờ thì bỏ; mỗi STATUS_TICK giây Trúng độc / Thiêu đốt gây sát thương. */
export function tickPStatus(room: MapRoom, id: string, p: PlayerState, d: PData, dt: number) {
  if (!d.st.size) return;
  if (room.map.inSafe(p.x, p.y)) return room.clearPStatus(p, d);
  d.dotT += dt;
  let dot = 0;
  if (d.dotT >= STATUS_TICK) { d.dotT -= STATUS_TICK; for (const [s, x] of d.st) if (STATUS[s].dot) dot += x.v * x.n; }
  let changed = false;
  for (const [s, x] of d.st) { x.t -= dt; if (x.t <= 0) { d.st.delete(s); changed = true; } }
  if (changed) room.syncPStatus(p, d);
  if (!d.st.size) d.dotT = 0;
  if (dot > 0) room.hurtPlayer(id, dot, { dot: true });
}
