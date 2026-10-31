// Thú vương và boss thế giới (GAME_DESIGN.md mục 5.4, docs/design/hon-thu-boss.md), tách khỏi MapRoom.ts (#702, bước 16): tick thú vương, giai đoạn 2,
// cơ chế boss thế giới (nổi giận, điểm yếu hệ, Bá Thể, Du Thủy, ngắt tích lực), rút đi, hạ boss chia thưởng, rương vào túi, mở rương.
// Hàm nhận phòng (`room: MapRoom`) như absorb.ts; nguyên văn từ MapRoom, không đổi số / thứ tự RNG / thứ tự ghi DB qua `room.chain`. MapRoom chỉ chuyển tiếp
// 12 hàm cho `onMessage` / `tick` / hook GM; `spawnKing` / `spawnBeast` / `tickElite` / `addBeast` / `contribOf` / `topContrib` còn ở MapRoom.
import type { PlayerState, BeastState } from "./schema.ts";
import { MAPS, BOSSES, KING, KING_CHEST, WORLD, WORLD_SLAM, WORLD_RING, WORLD_CHEST, BOSS_CLAIM_KING, BOSS_CLAIM_WORLD, HE_IDS, STATUS, VOHON, TIERS, RING_ITEM,
  SUPPORT_CONTRIB, DROP_OWNER_SECS, BONE_SLOTS, CORE_SETS, bossIndex, beastName, chestCode, itemDef, kingYears, kingShardPool, shardCode, boneChance, boneName,
  coreName, rollCore, rollYears, formatHonTe, formatYears, type BossDef, type BeastSkillDef, type ItemDef, type He } from "../../../shared/data.ts";
import { ANNOUNCE_TOPIC } from "../schedule.ts";
import { store, type Item } from "../db.ts";
import { surfaceSpot } from "./worldBoss.ts";
import { achvCount } from "./achv.ts";
import { newItem, bagUsed } from "./items.ts";
import { persistKingSeat, type MapRoom, type PData, type BData, type EliteData, type KingData, type WorldData } from "./MapRoom.ts";
import { kingClaimCache } from "./procState.ts";
import { bossK, claimHeld, uid } from "./common.ts";

/**
 * Mỗi tick của thú vương: hết KING.lifeSecs thì rút đi; máu còn KING.phaseHp thì sang giai đoạn 2; đếm tiếng gầm. Trả true nếu thú
 * vương đã rời bản đồ (tick dừng ở đây).
 */
export function tickKing(room: MapRoom, bid: string, b: BeastState, bd: BData, k: KingData, dt: number) {
  if ((k.life -= dt) <= 0) { kingLeave(room, bid, b, bd); return true; }
  if (k.roar > 0) k.roar = Math.max(0, k.roar - dt);
  if (k.world) tickWorld(room, bid, b, bd, k, k.world, dt);
  else if (k.phase === 1 && k.def.phase2 && b.hp > 0 && b.hp <= b.maxHp * KING.phaseHp) kingPhase2(room, bid, b, bd, k);
  return false;
}

// ---------- Boss thế giới (mục 5.4 "Boss thế giới 100.000 năm", bước BĐ6e) ----------
/**
 * Mỗi tick của boss thế giới (sau tickKing): nổi giận sau WORLD.enrageSecs; điểm yếu hệ ở mỗi mốc WORLD.weakAt; khiên Bá Thể hết giờ
 * thì hồi máu bằng phần còn lại; lặn / nổi lên (Du Thủy); khi đang giao chiến thì tới giờ cơ chế nào chạy cơ chế đó (không chồng
 * lên chiêu đang báo trước, không chạy khi đang Choáng sau lần ngắt tích lực), nổi giận thì thêm Bạo Nộ toàn sàn mỗi WORLD.slamEvery giây.
 */
export function tickWorld(room: MapRoom, bid: string, b: BeastState, bd: BData, k: KingData, w: WorldData, dt: number) {
  const m = k.def.world ?? {};
  if (!w.rage && k.life <= WORLD.lifeSecs - WORLD.enrageSecs) worldEnrage(room, bid, b, bd, k, w);
  if (w.weak && (w.weakT -= dt) <= 0) { w.weak = null; w.weakT = 0; b.weak = 0; room.broadcast("boss", { k: "weakEnd", bid }); }
  while (w.weakNext < WORLD.weakAt.length && b.hp > 0 && b.hp <= b.maxHp * WORLD.weakAt[w.weakNext]) { w.weakNext++; worldWeak(room, bid, b, w, null, WORLD.weakSecs); }
  if (w.shield > 0 && (w.shieldT -= dt) <= 0) {
    const add = Math.min(b.maxHp - b.hp, Math.round(w.shield));
    w.shield = 0; w.shieldT = 0; b.shield = 0;
    if (add > 0 && b.hp > 0) { b.hp += add; room.broadcast("dmg", { x: b.x, y: b.y - 10, v: add, c: "#7dff8a" }); }
    room.broadcast("boss", { k: "armorEnd", bid, name: m.armor?.name ?? "", heal: add });
  }
  if (w.dive > 0) { if ((w.dive -= dt) <= 0) worldSurface(room, bid, b, bd, k, w); return; }
  if (!bd.elite?.engaged || b.hp <= 0) return;
  w.chargeT -= dt; w.armorT -= dt; w.miasmaT -= dt; w.diveT -= dt; if (w.rage) w.slamT -= dt;
  if (bd.cast || k.roar > 0 || bd.st.has("stun")) return;
  if (w.rage && w.slamT <= 0) { w.slamT = WORLD.slamEvery; return worldCast(room, bid, b, bd, WORLD_SLAM, false); }
  if (m.charge && w.chargeT <= 0) { w.chargeT = m.charge.every; return worldCast(room, bid, b, bd, m.charge.skill, true); }
  if (m.miasma && w.miasmaT <= 0) { w.miasmaT = m.miasma.every; return worldCast(room, bid, b, bd, m.miasma.skill, false); }
  if (m.armor && w.armorT <= 0 && w.shield <= 0) { w.armorT = m.armor.every; return worldArmor(room, bid, b, w, m.armor); }
  if (m.dive && w.diveT <= 0) { w.diveT = m.dive.every; return worldDive(room, bid, b, bd, w, m.dive); }
}

/** Tung một chiêu cơ chế (toàn sàn) của boss thế giới; `charge`: tích lực phải ngắt (đếm khống chế từ 0, báo cả phòng). */
export function worldCast(room: MapRoom, bid: string, b: BeastState, bd: BData, def: BeastSkillDef, charge: boolean) {
  const pid = bd.target ?? [...(bd.elite?.parts.keys() ?? [])][0]; const tgt = pid ? room.state.players.get(pid) : undefined;
  room.beginCast(bid, b, bd, { def, cd: 0 }, pid ?? "", tgt ?? b);
  const w = bd.elite!.king!.world!, need = bd.elite!.king!.def.world?.charge?.need ?? 0;
  if (charge) { bd.cast!.charge = true; w.brk = 0; w.brkAt.clear(); b.brk = 0; b.chg = true; }
  room.broadcast("boss", { k: charge ? "charge" : "floor", bid, name: def.name, secs: def.warn, need });
}

/**
 * Khống chế (Choáng, Trói, Câm lặng, Mê hoặc…) trúng boss thế giới: boss không nhận, nhưng nếu đang tích lực (cast.charge) và người
 * gây đang cho võ hồn hệ Khống chế ra trận thì tính một lần ngắt (mỗi người tối đa một lần trong 0,3 giây: một hồn kỹ gây nhiều khống
 * chế chỉ tính một). Đủ `need` lần thì ngắt chiêu, boss Choáng `stun` giây.
 */
export function worldBreak(room: MapRoom, bid: string, b: BeastState, bd: BData, w: WorldData, by: string) {
  const ch = bd.elite?.king?.def.world?.charge, p = room.state.players.get(by), now = Date.now();
  if (!ch || !bd.cast?.charge || !p || VOHON[p.vh]?.he !== "khong_che" || now - (w.brkAt.get(by) ?? 0) < 300) return;
  w.brkAt.set(by, now); w.brk++; b.brk = w.brk;
  room.broadcast("boss", { k: "brk", bid, n: w.brk, need: ch.need, by: p.name });
  if (w.brk < ch.need) return;
  room.cancelCast(bid, b, bd);
  bd.st.set("stun", { t: ch.stun, n: 1, v: 0, src: by }); room.syncStatus(b, bd);
  bd.kx = 0; bd.ky = 0;
  room.broadcast("boss", { k: "broken", bid, name: ch.skill.name, by: p.name, secs: ch.stun });
}

/** Điểm yếu hệ `he` (null = ngẫu nhiên, khác hệ đang hiện) trong `secs` giây: võ hồn hệ đó gây x WORLD.weakMult, hệ khác x WORLD.offMult. */
export function worldWeak(room: MapRoom, bid: string, b: BeastState, w: WorldData, he: He | null, secs: number) {
  const pool = HE_IDS.filter((x) => x !== w.weak), pick = he ?? pool[Math.floor(Math.random() * pool.length)];
  w.weak = pick; w.weakT = secs; b.weak = 1 + HE_IDS.indexOf(pick);
  room.broadcast("boss", { k: "weak", bid, he: pick, secs, mult: WORLD.weakMult, off: WORLD.offMult });
}

/** Nổi giận (mục 5.4): sát thương x WORLD.rageDmg, tốc độ x WORLD.rageSpd, hồi chiêu nhanh hơn, Bạo Nộ toàn sàn mỗi WORLD.slamEvery giây. */
export function worldEnrage(room: MapRoom, bid: string, b: BeastState, bd: BData, k: KingData, w: WorldData) {
  w.rage = true; w.slamT = WORLD.slamEvery; k.phase = 2; b.phase = 2; k.spd = WORLD.rageSpd; k.roar = KING.roarSecs;
  room.cancelCast(bid, b, bd); bd.kx = 0; bd.ky = 0;
  const name = beastName(b.rank, b.species);
  room.broadcast("fx", { k: "roar", bid, name: "Nổi giận", col: k.def.aura, secs: KING.roarSecs });
  room.broadcast("boss", { k: "rage", bid, name, dmg: WORLD.rageDmg, every: WORLD.slamEvery, col: k.def.aura, life: k.life });
}

/** Bá Thể (Thái Thản Cự Viên): khiên `pct` máu tối đa trong `secs` giây; võ hồn hệ `he` phá nhanh gấp `mult`. */
export function worldArmor(room: MapRoom, bid: string, b: BeastState, w: WorldData, a: NonNullable<NonNullable<BossDef["world"]>["armor"]>) {
  w.shield = Math.round(b.maxHp * a.pct); w.shieldT = a.secs; b.shield = w.shield;
  room.broadcast("fx", { k: "buff", x: b.x, y: b.y, col: "#9ad8ff" });
  room.broadcast("boss", { k: "armor", bid, name: a.name, he: a.he, mult: a.mult, secs: a.secs, shield: w.shield });
}

/**
 * Du Thủy (Thiên Thanh Ngưu Mãng): lặn ra giữa hồ (object `lake`; bản đồ không có thì lặn tại chỗ) `secs` giây (không nhận sát thương,
 * không đánh, bỏ chiêu đang báo trước). Chỗ nổi lên (cách chỗ lặn ít nhất `away` pixel) chọn ngay và báo trước cho cả phòng (#118).
 */
export function worldDive(room: MapRoom, bid: string, b: BeastState, bd: BData, w: WorldData, dv: NonNullable<NonNullable<BossDef["world"]>["dive"]>) {
  room.cancelCast(bid, b, bd);
  // Sàn không tìm được chỗ nổi lên thì nổi lại đúng chỗ lặn (trong sàn), không kẹt lại giữa hồ.
  w.dive = dv.secs; w.surf = surfaceSpot(room.map, { x: bd.hx, y: bd.hy }, b.x, b.y, dv.away, Math.random) ?? { x: b.x, y: b.y }; b.dive = true; b.moving = false; bd.kx = 0; bd.ky = 0;
  room.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 50, col: "#4ab0ff" });
  const lake = room.map.lake;
  if (lake) { b.x = lake.x; b.y = lake.y; room.interest.beasts.put(bid, b.x, b.y); room.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 50, col: "#4ab0ff" }); }
  room.broadcast("boss", { k: "dive", bid, name: dv.name, secs: dv.secs, sx: w.surf.x, sy: w.surf.y });
}

/** Nổi lên đúng chỗ đã báo trước lúc lặn (WorldData.surf), lộ điểm yếu hệ của Du Thủy `weakSecs` giây. */
export function worldSurface(room: MapRoom, bid: string, b: BeastState, bd: BData, k: KingData, w: WorldData) {
  const dv = k.def.world?.dive;
  if (w.surf) { b.x = w.surf.x; b.y = w.surf.y; room.interest.beasts.put(bid, b.x, b.y); } // dời xa hơn lề lưới (11.4): cập nhật ngay
  w.dive = 0; w.surf = null; b.dive = false;
  bd.skT = Math.max(bd.skT, 1);
  room.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 60, col: "#4ab0ff" });
  if (dv) worldWeak(room, bid, b, w, dv.he, dv.weakSecs);
  room.broadcast("boss", { k: "surface", bid, name: dv?.name ?? "" });
}

/** Thông tin boss thế giới gửi kèm tin "boss" k = "here" cho người mới vào (đồng hồ nổi giận, điểm yếu đang hiện). */
export function worldInfo(room: MapRoom, k: KingData) {
  const w = k.world; if (!w) return {};
  return { world: true, rageIn: Math.max(0, k.life - (WORLD.lifeSecs - WORLD.enrageSecs)), rage: w.rage, weak: w.weak, weakT: w.weakT,
    ...(w.dive > 0 && w.surf ? { dive: w.dive, diveSecs: k.def.world?.dive?.secs ?? w.dive, sx: w.surf.x, sy: w.surf.y } : {}) }; // đang lặn (#118): chỗ nổi lên đã báo
}

/**
 * Giai đoạn 2 (mục 5.4): gầm lên, đứng yên KING.roarSecs giây (không nhận khống chế, mất khống chế đang có, ngắt chiêu đang báo trước),
 * rồi thêm chiêu của BossDef.phase2 và nhanh hơn (phase2.spd). Cả phòng được báo.
 */
export function kingPhase2(room: MapRoom, bid: string, b: BeastState, bd: BData, k: KingData) {
  const ph = k.def.phase2!;
  k.phase = 2; b.phase = 2; k.roar = KING.roarSecs; k.spd = ph.spd;
  room.cancelCast(bid, b, bd);
  let cc = false;
  for (const s of [...bd.st.keys()]) { const def = STATUS[s]; if (def.noMove || def.noAtk || def.noSkill || def.wander) { bd.st.delete(s); cc = true; } }
  if (cc) room.syncStatus(b, bd);
  bd.skills.push(...ph.skills.map((def) => ({ def, cd: KING.roarSecs + 1 })));
  bd.skT = Math.max(bd.skT, KING.roarSecs);
  bd.kx = 0; bd.ky = 0;
  const name = beastName(2, b.species);
  room.broadcast("fx", { k: "roar", bid, name: ph.name, col: k.def.aura, secs: KING.roarSecs });
  room.broadcast("boss", { k: "phase", bid, name, phase: 2, title: ph.name, desc: ph.desc, col: k.def.aura });
}

/**
 * Bảng xếp hạng đóng góp lên thú vương: tối đa 10 người (sessionId, tên, `pct` % đóng góp tổng, từ 9.2 `sup` % phần hỗ trợ trong
 * tổng), tổng đóng góp (sát thương + hỗ trợ × SUPPORT_CONTRIB) và số người tham gia; xếp theo đóng góp tổng.
 */
export function kingRank(room: MapRoom, e: EliteData) {
  const all = room.contributors(e).map((id) => [id, room.contribOf(e, id), (e.supBy.get(id) ?? 0) * SUPPORT_CONTRIB] as const);
  const total = all.reduce((a, x) => a + x[1], 0), pc = (v: number) => (total ? +(v / total * 100).toFixed(1) : 0);
  const list = all.sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, v, s]) => ({ id, name: room.state.players.get(id)?.name ?? "(đã rời)", pct: pc(v), sup: pc(s) }));
  return { list, total, n: e.n };
}

/** Không ai hạ trong KING.lifeSecs giây: thú vương rút đi, không ai nhận thưởng; cả phòng và toàn server được báo. */
export function kingLeave(room: MapRoom, bid: string, b: BeastState, bd: BData) {
  room.cancelCast(bid, b, bd);
  const world = !!bd.elite?.king?.world, K = world ? WORLD : KING, name = beastName(b.rank, b.species), map = MAPS[room.state.mapId].name;
  room.state.beasts.delete(bid); room.bdata.delete(bid);
  if (room.king?.bid === bid) { room.king.bid = null; room.king.seat.state = "gone"; void persistKingSeat(room.state.mapId, room.king.slot, room.king.seat, room.king.claimed); }
  room.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 60, col: BOSSES[b.species]?.aura });
  room.broadcast("boss", { k: "leave", bid, name, mapName: map, world, mins: K.lifeSecs / 60 });
  room.presence.publish(ANNOUNCE_TOPIC, { text: world ? `${name} ở ${map} đã lặn xuống hồ: không ai hạ được trong ${K.lifeSecs / 60} phút.`
    : `${name} ở ${map} đã rút đi: không ai hạ được trong ${K.lifeSecs / 60} phút.` });
}

/**
 * Người tham gia ngẫu nhiên trong tầm `range` của thú vương để đánh dấu (BeastSkillDef.mark, Huyết Cuồng); `weak` (BĐ6d, Huyết Khí):
 * người có tỉ lệ sinh lực thấp nhất thay vì ngẫu nhiên. Không có thì null.
 */
export function markTarget(room: MapRoom, b: BeastState, bd: BData, range: number, weak = false): [string, PlayerState] | null {
  const list: [string, PlayerState][] = [];
  for (const pid of bd.elite?.parts.keys() ?? []) {
    const p = room.state.players.get(pid), pd = room.pdata.get(pid);
    if (p && pd && !p.dead && !pd.travelling && !pd.buffs.has("hide") && !room.map.inSafe(p.x, p.y) && Math.hypot(p.x - b.x, p.y - b.y) <= range) list.push([pid, p]);
  }
  if (weak) return list.reduce<[string, PlayerState] | null>((a, x) => (!a || x[1].hp / x[1].maxHp < a[1].hp / a[1].maxHp ? x : a), null);
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

/**
 * Hạ thú vương (mục 5.4 "Chia thưởng theo đóng góp"): đóng góp = sát thương + hồi máu / khiên cho người tham gia khác (9.2,
 * contribOf). Mọi người đóng góp còn trong phòng nhận kinh nghiệm x KING.xp; người hạ nhận Hồn Tệ; hồn hoàn rơi ưu tiên người đóng
 * góp nhiều nhất DROP_OWNER_SECS giây (boss thế giới: hồn hoàn đỏ cho người gây sát thương nhiều nhất); ai từ KING.share (3%) nhận
 * rương vào túi (giới hạn KING.daily lần/ngày, grantChest). Cả phòng nhận bảng xếp hạng cuối, toàn server được báo.
 */
export function killKing(room: MapRoom, bid: string, b: BeastState, e: EliteData, by: string) {
  const k = e.king!, name = beastName(b.rank, b.species), map = MAPS[room.state.mapId].name, rank = kingRank(room, e), K = bossK(k), world = !!k.world;
  // Tài khoản đã nhận rương của khung giờ này (ở kênh nào cũng vậy): mỗi khung một rương, đổi kênh không nhân thưởng (mục 6).
  const cached = room.king?.bid === bid ? kingClaimCache.get(`${room.state.mapId}:${room.king.slot}`) : undefined;
  if (cached && room.king) for (const accountId of cached) room.king.claimed.add(accountId);
  const claimed = room.king?.bid === bid ? room.king.claimed : undefined;
  if (room.king?.bid === bid) { room.king.bid = null; room.king.seat.state = "down"; void persistKingSeat(room.state.mapId, room.king.slot, room.king.seat, room.king.claimed); }
  const p = room.state.players.get(by)!; p.kills++;
  const total = rank.total || 1;
  // 9.2: ưu tiên hồn hoàn thú vương theo đóng góp tổng; hồn hoàn đỏ boss thế giới vẫn cho người gây sát thương nhiều nhất.
  const owner = room.topContrib(e, by, world);
  const coin = room.rewardCoin(by, b.tier);
  // Boss thế giới (BĐ6e): hồn hoàn vào thẳng túi cùng rương (WORLD_RING), không rơi xuống đất.
  if (!world) { const drop = room.newDrop(b.x, b.y, owner); drop.tier = b.tier; drop.years = b.years; room.state.drops.set(uid("d"), drop); }
  room.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 80, col: k.def.aura });
  const ownerName = room.state.players.get(owner)!.name, age = formatYears(b.years);
  for (const pid of room.contributors(e)) {
    const v = room.contribOf(e, pid), d = room.pdata.get(pid); if (!d || !room.state.players.has(pid) || d.travelling) continue;
    const pct = v / total, pctTxt = `${(pct * 100).toFixed(1).replace(".", ",")}%`;
    room.rewardKill(pid, b.years, K.xp);
    room.questEvent(pid, { k: "king", map: room.state.mapId }); // #256: mọi người có đóng góp còn trong phòng (boss thế giới cũng tính)
    if (world) room.questEvent(pid, { k: "world", map: room.state.mapId }); // #284: chương 3 "Thủ hộ của Tiểu Vũ"
    const ring = world ? "" : pid === owner ? ` Hồn hoàn ${age} ưu tiên bạn nhặt ${DROP_OWNER_SECS} giây đầu (phím E).` : "";
    const coinTxt = pid === by ? ` Nhận ${formatHonTe(coin)} Hồn Tệ.` : "";
    // Hồn hoàn boss thế giới: người nhiều nhất hồn hoàn đỏ 100.000 năm; người khác WORLD_RING.red cơ hội đỏ, còn lại đen.
    const ry = !world ? undefined : pid === owner || Math.random() < WORLD_RING.red ? WORLD_RING.top : rollYears(WORLD_RING.black[0], WORLD_RING.black[1], Math.random());
    if (pct >= K.share && claimed?.has(d.accountId))
      room.log(pid, `Hạ ${name}! Đóng góp ${pctTxt}: đã nhận ${world ? "thưởng" : "rương"} của khung giờ này ở kênh khác, không nhận thêm.${coinTxt}${ring}`, "#ffb35c");
    else if (pct >= K.share) { achvCount(room, pid, world ? "world" : "king"); room.log(pid, `Hạ ${name}! Đóng góp ${pctTxt}.${coinTxt}${ring}`, k.def.aura); grantChest(room, pid, k.def, claimed, ry); }
    else room.log(pid, `Hạ ${name}! Đóng góp ${pctTxt}: cần từ ${K.share * 100}% mới nhận ${world ? "thưởng" : "rương"}.${coinTxt}${ring}`, "#ffb35c");
  }
  if (!e.dmgBy.has(by) && !e.supBy.has(by)) room.log(by, `Hạ ${name}, nhận ${formatHonTe(coin)} Hồn Tệ.`, k.def.aura);
  room.broadcast("boss", { k: "down", bid, name, by: p.name, top: ownerName, topDmg: world, mapName: map, ...rank });
  room.presence.publish(ANNOUNCE_TOPIC, { text: `${name} ở ${map} đã bị hạ! ${ownerName} ${world ? "gây sát thương" : "đóng góp"} nhiều nhất, ${p.name} ra đòn cuối.` });
}

/**
 * Rương thú vương cho người chơi `id` (đóng góp từ KING.share): hôm nay còn lượt (KING.daily, tính chung mọi bản đồ, đặt lại 00:00 giờ
 * Việt Nam) thì tới lượt trong chuỗi lưu mới cho rương vào túi và ngay đó tăng lượt cùng ghi cả túi trong một transaction
 * (store.claimBoss). Không lần ghi nào khác chụp được túi có rương trước transaction này (mọi lần ghi nối tiếp trong chuỗi), nên DB
 * không bao giờ có rương mà chưa trừ lượt. DB báo hết lượt hoặc lỗi thì lấy lại rương. Túi đầy thì rương vẫn vào (ô tạm vượt
 * số ô túi, như trả mảnh ở 3.4) để không mất thưởng. `claimed`: tài khoản đã nhận rương của khung giờ (mọi kênh); ghi ngay khi
 * cho rương, bỏ ra nếu không nhận được.
 */
export function grantChest(room: MapRoom, id: string, def: BossDef, claimed?: Set<number>, ringYears?: number) {
  const d = room.pdata.get(id), it = itemDef(chestCode(def.id)), ri = itemDef(RING_ITEM); if (!d || !it || !ri) return;
  // Boss thế giới (BĐ6e): lượt riêng (BOSS_CLAIM_WORLD, WORLD.daily), thêm hồn hoàn `ringYears` vào túi cùng transaction với rương.
  const world = def.rank === 3, K = world ? WORLD : KING, kind = world ? BOSS_CLAIM_WORLD : BOSS_CLAIM_KING, what = world ? "boss thế giới" : "thú vương";
  const day = room.today(), warn = (text: string) => room.log(id, text, "#ffb35c"), rec = () => (world ? d.wclaims : d.claims);
  if (room.claimsToday(d, world) >= K.daily) return warn(`Hôm nay đã hết lượt nhận thưởng ${what} (${K.daily}/${K.daily}): không nhận ${world ? "hồn hoàn và rương" : "rương"}. Lượt mới lúc 00:00 giờ Việt Nam.`);
  let ring: Item | null = null;
  const takeBack = () => {
    const x = d.bag.find((i) => i.code === it.id && i.vohonId === null); if (x) room.takeItem(d, x, 1);
    // Theo id (#165): túi có thể đã được chép sang đối tượng mới trong lúc chờ DB.
    const ri = ring ? d.bag.findIndex((i) => i.id === ring!.id) : -1;
    if (ri >= 0) { d.bag.splice(ri, 1); d.bagDirty = true; }
    claimed?.delete(d.accountId);
    if (claimed && room.king) void persistKingSeat(room.state.mapId, room.king.slot, room.king.seat, claimed);
  };
  claimed?.add(d.accountId);
  if (claimed && room.king) void persistKingSeat(room.state.mapId, room.king.slot, room.king.seat, claimed);
  d.claimBusy++;
  room.chain(d, async () => {
    // Rương vào túi ngay trước khi chụp túi cho transaction (không có await xen giữa); chặn mở / bỏ rương tới khi xong (claimBusy).
    const full = !room.addItem(d, it.id, 1);
    if (full) { d.bag.push(newItem(it, 1)); d.bagDirty = true; }
    // Hồn hoàn mỗi chiếc một ô; túi đầy thì vẫn vào (ô tạm vượt số ô túi) như rương, để không mất thưởng.
    if (ringYears) { ring = newItem(ri, 1, ringYears); d.bag.push(ring); d.bagDirty = true; }
    let n: number | null;
    try { n = await store.claimBoss(d.accountId, day, kind, K.daily, room.bagSnapshot(d)); }
    catch (e) { takeBack(); warn(`Không lưu được ${it.name}, thử lại sau.`); throw e; }
    if (n === null) { takeBack(); Object.assign(rec(), { day, n: K.daily }); return warn(`Hôm nay đã hết lượt nhận thưởng ${what} (${K.daily}/${K.daily}): không nhận ${world ? "hồn hoàn và rương" : "rương"}.`); }
    Object.assign(rec(), { day, n });
    const rtxt = ringYears ? `hồn hoàn ${formatYears(ringYears)} và ` : "";
    room.log(id, `Nhận ${rtxt}${it.name} vào túi đồ (lượt ${n}/${K.daily} hôm nay). Mở rương trong túi đồ (B).`, it.col);
    if (full || bagUsed(d.bag) > d.bagSlots) warn(`Túi đồ đã đầy: phần thưởng vẫn vào túi, bỏ bớt đồ để mở được rương (cần ${world ? WORLD_CHEST.slots : KING_CHEST.slots} ô trống).`);
  }).then(() => { d.claimBusy--; if (room.pdata.get(id) === d) room.sendBag(id); });
}

/**
 * Mở rương thú vương `raw` (id ô trong túi; KING_CHEST, mục 5.3): cần KING_CHEST.slots ô trống. Server tung: hồn cốt (boneChance theo
 * năm thú vương x KING_CHEST.bone, loài gốc, vị trí ngẫu nhiên), mảnh võ hồn (kingShardPool của bản đồ thú vương), mảnh UR
 * (KING_CHEST.ur), và luôn 1 hồn hạch sao cao nhất theo năm thú vương, bộ theo bản đồ thú vương (rollCore `high`, 5.1). Hook test
 * `chest` cố định được các số ngẫu nhiên.
 */
export function openChest(room: MapRoom, id: string, raw: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined, def = it && itemDef(it.code);
  if (!it || !def) return warn("Không có vật phẩm này trong túi đồ.");
  const boss = BOSSES[bossIndex(def.boss ?? "")];
  if (def.kind !== "ruong" || !boss) return warn(`${def.name} không mở được.`);
  if (claimHeld(d)) return warn("Đang nhận rương, đợi một chút.");
  if (boss.rank === 3) return openWorldChest(room, id, p, d, it, def, boss);
  if (d.bagSlots - bagUsed(d.bag) < KING_CHEST.slots) return warn(`Cần ${KING_CHEST.slots} ô trống trong túi đồ để mở ${def.name}.`);
  const mapId = Object.values(MAPS).find((m) => m.king === boss.id)?.id ?? room.state.mapId, years = kingYears(mapId) ?? TIERS[0].years;
  const t = d.testChest, r = (v: number | undefined) => (v !== undefined && v >= 0 ? v : Math.random());
  room.takeItem(d, it, 1);
  const got: string[] = [];
  if (r(t?.bone) < boneChance(years, KING_CHEST.bone)) {
    const slot = BONE_SLOTS[t && t.s >= 0 ? t.s % BONE_SLOTS.length : Math.floor(Math.random() * BONE_SLOTS.length)].id;
    if (room.addBone(d, years, boss.species, slot)) got.push(`hồn cốt ${boneName(boss.species, slot, years)}`);
  }
  const pool = kingShardPool(mapId), wsum = pool.reduce((a, x) => a + x.w, 0);
  let pick = pool[0];
  if (t && t.i >= 0) pick = pool[t.i % pool.length];
  else { let x = Math.random() * wsum; for (const q of pool) { x -= q.w; if (x <= 0) { pick = q; break; } } }
  const [lo, hi] = KING_CHEST.shards, qty = t && t.n > 0 ? t.n : lo + Math.floor(Math.random() * (hi - lo + 1));
  const sc = shardCode(pick.vohon), sd = itemDef(sc), n1 = sd ? room.addItem(d, sc, qty) : 0;
  if (sd && n1) got.push(`${n1} ${sd.name}${room.shardNote(d, sc)}`);
  let ur = "";
  if (r(t?.ur) < KING_CHEST.ur) {
    const u = KING_CHEST.urShards[Math.floor(Math.random() * KING_CHEST.urShards.length)], uc = shardCode(u), ud = itemDef(uc);
    if (ud && room.addItem(d, uc, 1)) { got.push(`1 ${ud.name} (UR)${room.shardNote(d, uc)}`); ur = ud.name; }
  }
  const core = rollCore(years, MAPS[mapId].cores, Math.random, { high: true });
  if (room.addCore(d, core.stars, core.data)) got.push(coreName(core.data.set, core.stars).replace("Hồn hạch", "hồn hạch"));
  room.chestEquip(d, 2, mapId, got);
  room.sendBag(id);
  room.log(id, `Mở ${def.name}: ${got.join(", ")}.`, def.col);
  if (ur) room.broadcast("chat", { sys: true, name: "Hệ thống", text: `${p.name} mở ${def.name} nhận được ${ur}!` });
  room.save(id);
}

/**
 * Mở rương boss thế giới (WORLD_CHEST, BĐ6e): cần WORLD_CHEST.slots ô trống. Hồn cốt boneChance(100.000 năm, WORLD_CHEST.bone) của
 * loài gốc boss; WORLD_CHEST.ur mảnh UR của một võ hồn trong KING_CHEST.urShards; luôn 1 hồn hạch sao trong WORLD_CHEST.stars, bộ bất
 * kỳ. Hook test `chest`: `bone` (0..100), `i` (võ hồn UR), `n` (số mảnh UR), `s` (vị trí hồn cốt).
 */
export function openWorldChest(room: MapRoom, id: string, p: PlayerState, d: PData, it: Item, def: ItemDef, boss: BossDef) {
  if (d.bagSlots - bagUsed(d.bag) < WORLD_CHEST.slots) return room.log(id, `Cần ${WORLD_CHEST.slots} ô trống trong túi đồ để mở ${def.name}.`, "#ffb35c");
  const years = MAPS[Object.values(MAPS).find((m) => m.world?.includes(boss.id))?.id ?? ""]?.years?.[1] ?? WORLD_RING.top;
  const t = d.testChest, r = (v: number | undefined) => (v !== undefined && v >= 0 ? v : Math.random());
  room.takeItem(d, it, 1);
  const got: string[] = [];
  if (r(t?.bone) < boneChance(years, WORLD_CHEST.bone)) {
    const slot = BONE_SLOTS[t && t.s >= 0 ? t.s % BONE_SLOTS.length : Math.floor(Math.random() * BONE_SLOTS.length)].id;
    if (room.addBone(d, years, boss.species, slot)) got.push(`hồn cốt ${boneName(boss.species, slot, years)}`);
  }
  const urs = KING_CHEST.urShards, u = urs[t && t.i >= 0 ? t.i % urs.length : Math.floor(Math.random() * urs.length)];
  const [lo, hi] = WORLD_CHEST.ur, qty = t && t.n > 0 ? t.n : lo + Math.floor(Math.random() * (hi - lo + 1)), uc = shardCode(u), ud = itemDef(uc);
  const nu = ud ? room.addItem(d, uc, qty) : 0;
  if (ud && nu) got.push(`${nu} ${ud.name} (UR)${room.shardNote(d, uc)}`);
  const [s0, s1] = WORLD_CHEST.stars, stars = s0 + Math.floor(Math.random() * (s1 - s0 + 1));
  const core = rollCore(years, CORE_SETS.map((c) => c.id), Math.random, { stars });
  if (room.addCore(d, core.stars, core.data)) got.push(coreName(core.data.set, core.stars).replace("Hồn hạch", "hồn hạch"));
  room.chestEquip(d, 3, Object.values(MAPS).find((m) => m.world?.includes(boss.id))?.id ?? "", got);
  room.sendBag(id);
  room.log(id, `Mở ${def.name}: ${got.join(", ")}.`, def.col);
  if (nu) room.broadcast("chat", { sys: true, name: "Hệ thống", text: `${p.name} mở ${def.name} nhận được ${nu} ${ud!.name}!` });
  room.save(id);
}
