// Sinh hồn thú và tinh anh (GAME_DESIGN.md mục 5.3, 5.4): `spawnBeast` / `addBeast` (hồn thú thường, tinh anh, thú vương, boss thế giới), `spawnElite`, giao chiến tinh anh
// (`eliteJoin` / `inFight` / `joinFight` / `eliteScale`), `tickForm`, `tickElite`, `eliteReset`, `spawnKing` (suất thú vương), `pickSpecies`, tách khỏi MapRoom.ts (#702, bước 21).
// Hàm nhận phòng (`room: MapRoom`) như loot.ts / tick.ts; nguyên văn từ MapRoom, không đổi số / thứ tự RNG / thứ tự xử lý. MapRoom chỉ chuyển tiếp 13 hàm
// (`setup`, `tick`, `boss.ts`, `gm.ts`, `combat.ts` gọi `room.spawnX` / `room.addBeast` / `room.eliteX` như cũ).
// Còn ở MapRoom: `killBeast`, `dispelBeast`, `beastDmg` / `syncBeastBuff`, `applyStatus` / `applyPStatus`, `beginCast` / `tickCast`, Chân Thân, tiên cơ.
import { tierOfYears, BEASTS, MAPS, RED_BEAST_CHANCE, kingYears, MAX_YEARS, tierBand, rollYears, beastStats, beastSkillOf, BOSSES, bossIndex, ELITE, ELITE_RAGE, bossHpMult, beastName, BEAST_BUFFS, KING, WORLD, worldBossOn, TIERS, type FormDef } from "../../../shared/data.ts";
import { bossOffset } from "../schedule.ts";
import { isRooted, rootedReach, beastDefOf } from "./beastTraits.ts";
import { BOSS_BOX } from "./worldBoss.ts";
import { BeastState, type PlayerState } from "./schema.ts";
import { uid, bossK, newWorld, takeKingSeat, type MapRoom, type BData, type EliteData } from "./MapRoom.ts";
/**
 * Sinh một hồn thú trong vùng `zi`: tuổi ngẫu nhiên trong khoảng `years` của vùng (bảng 5.3; vùng thiếu `years` thì tung bậc
 * theo `weights` rồi tung tuổi trong bậc), loài theo trọng số `beasts` của vùng. Mỗi phòng tối đa 1 hồn thú thường
 * MAX_YEARS năm cùng lúc (mục 5.3, `redFree`): đã có thì tung dưới mức đó. Từ BĐ6d vùng có mức trên MAX_YEARS (Hải Thần Uyên) ra
 * đúng MAX_YEARS với tỉ lệ RED_BEAST_CHANCE (hook test `red` cố định được), còn lại dưới MAX_YEARS. Không sinh trong vùng an toàn,
 * cách người chơi dưới 140 pixel, hay trong SPAWN_CLEAR quanh trại cổng, cổng và điểm xuất hiện (map.nearGate: hồn thú lang thang
 * không tới đánh người vừa tới nơi, vừa hồi sinh, đang niệm cổng).
 */
export function spawnBeast(room: MapRoom, zi: number) {
  const z = room.map.zones[zi], hasRed = !room.redFree();
  let years: number;
  if (z.years) {
    const hi = Math.min(z.years[1], MAX_YEARS - 1);
    const red = z.years[1] >= MAX_YEARS && !hasRed && (room.testRed ?? Math.random()) < RED_BEAST_CHANCE;
    if (!red && hi < z.years[0]) return;
    years = red ? MAX_YEARS : rollYears(z.years[0], hi, Math.random());
  } else {
    let r = Math.random(), tier = 0;
    for (let i = 0; i < z.weights.length; i++) { r -= z.weights[i]; if (r <= 0) { tier = i; break; } }
    if (tier === TIERS.length - 1 && hasRed) tier--;
    const [lo, hi] = tierBand(tier);
    years = rollYears(lo, hi, Math.random());
  }
  const species = room.pickSpecies(zi);
  for (let k = 0; k < 40; k++) {
    const x = z.x0 + 8 + Math.random() * (z.x1 - z.x0 - 16), y = z.y0 + 24 + Math.random() * (z.y1 - z.y0 - 48);
    if (room.map.hits(x, y, 6, 4) || room.map.inSafe(x, y) || room.map.nearGate(x, y)) continue;
    if ([...room.state.players.values()].some((p) => Math.hypot(p.x - x, p.y - y) < 140)) continue;
    room.addBeast(zi, years, species, x, y);
    return;
  }
}

/** Kênh này chưa có hồn thú THƯỜNG nào MAX_YEARS năm (mục 5.3: tối đa 1 con; tinh anh, thú vương, boss không tính). */
export function redFree(room: MapRoom) { for (const b of room.state.beasts.values()) if (!b.rank && b.years >= MAX_YEARS) return false; return true; }

/**
 * Thêm hồn thú `years` năm: bậc (màu, kích thước) suy từ số năm, máu và sát thương tăng liên tục theo số năm (beastStats).
 * `rank` 1 (tinh anh, BĐ4): `species` là chỉ số trong BOSSES; máu x ELITE.hp, sát thương x ELITE.dmg so với loài gốc cùng năm,
 * 2 chiêu báo trước của BOSSES (không phụ thuộc mốc 1.000 năm).
 * `rank` 2 (tà hóa thú vương, BĐ5): máu x BossDef.hp, sát thương x KING.dmg; chiêu giai đoạn 1 của BOSSES, giai đoạn 2 thêm khi
 * còn KING.phaseHp máu; `slot` / `life`: khung giờ đã sinh và số giây trước khi rút đi.
 */
export function addBeast(room: MapRoom, zi: number, years: number, species: number, x: number, y: number, rank = 0, slot = 0, life: number = KING.lifeSecs) {
  // Từ BĐ6e `rank` 3 (boss thế giới): máu x WORLD.hp, sát thương x WORLD.dmg, dùng bộ máy thú vương (KingData.world).
  const st = beastStats(years), b = new BeastState(), boss = rank >= 1 && rank <= 3 ? BOSSES[species] : undefined;
  const world = boss?.rank === 3, king = boss?.rank === 2 || world;
  const hp = Math.round(st.hp * (!boss ? 1 : world ? WORLD.hp : king ? boss.hp ?? 6 : ELITE.hp));
  b.x = x; b.y = y; b.years = years; b.tier = tierOfYears(years); b.species = species; b.rank = boss ? boss.rank : 0; b.hp = b.maxHp = hp;
  b.phase = king ? 1 : 0; b.parts = boss ? 1 : 0;
  const id = uid("b"); room.state.beasts.set(id, b); room.interest.beasts.put(id, x, y);
  const sk = boss ? null : beastSkillOf(BEASTS[species]?.id ?? "", years);
  room.bdata.set(id, { zone: zi, hx: x, hy: y, tx: x, ty: y, wt: 0, cd: 0, kx: 0, ky: 0, target: null, hitBy: null, anim: 0, ret: 0, rooted: isRooted(b.rank, species), reach: 0,
    st: new Map(), dotT: 0, calm: 99, regen: 0, dmg: st.dmg * (!boss ? 1 : world ? WORLD.dmg : king ? KING.dmg : ELITE.dmg), def: beastDefOf(b.rank, species, years),
    skills: boss ? boss.skills.map((def) => ({ def, cd: 0 })) : sk ? [{ def: sk, cd: 0 }] : [], skT: 0, cast: null,
    buffs: new Map(), minions: new Set(),
    elite: boss ? { base: hp, n: 1, engaged: false, parts: new Map(), lonely: 0, dropT: 0, dmgBy: new Map(), supBy: new Map(), acc: new Map(), rageCd: 0,
      form: boss.forms ? Math.floor(Math.random() * boss.forms.forms.length) : 0, formT: boss.forms?.every ?? 0,
      king: king ? { def: boss, slot, life, phase: 1, roar: 0, spd: 1, noted: new Set(), rankT: 0, world: world ? newWorld(boss) : null } : null } : null });
  const bd = room.bdata.get(id)!; if (bd.rooted) bd.reach = rootedReach(b.tier, bd.skills.map((s) => s.def));
  if (boss?.forms) b.form = bd.elite!.form + 1;
  return id;
}

/**
 * Sinh tinh anh của ô `i` ở điểm ngẫu nhiên trong chữ nhật `elite`: niên hạn = mức trên của vùng (mục 5.4), không sinh trong vùng an
 * toàn, quanh trại cổng / cổng / điểm xuất hiện (SPAWN_CLEAR) hay sát người chơi (thử lại sau 5 giây). `announce`: báo cả bản đồ.
 */
export function spawnElite(room: MapRoom, i: number, announce: boolean) {
  const slot = room.elites[i], { spot } = slot, z = room.map.zones[spot.zone], def = BOSSES[spot.boss];
  const years = z.years ? z.years[1] : tierBand(z.weights.reduce((t, w, k) => (w > 0 ? k : t), 0))[1];
  for (let k = 0; k < 40; k++) {
    const x = spot.x + 6 + Math.random() * Math.max(0, spot.w - 12), y = spot.y + 6 + Math.random() * Math.max(0, spot.h - 12);
    if (room.map.hits(x, y, 6, 4) || room.map.inSafe(x, y) || room.map.nearGate(x, y)) continue;
    if ([...room.state.players.values()].some((p) => Math.hypot(p.x - x, p.y - y) < 140)) continue;
    slot.bid = room.addBeast(spot.zone, years, spot.boss, x, y, 1);
    if (announce) room.broadcast("elite", { k: "spawn", name: beastName(1, spot.boss), zone: z.name, x, y, col: def.aura });
    return;
  }
  slot.t = 5;
}

/**
 * Hồn sư `by` sắp gây sát thương lên tinh anh (mục 5.4 "Máu tăng theo số người tham gia"): lần đầu bị đánh thì bắt đầu giao chiến,
 * mọi hồn sư trong ELITE.radius thành người tham gia; sau đó ai gây sát thương cũng thành người tham gia. Số người tăng thì máu tối
 * đa tăng ngay, máu hiện tại giữ tỉ lệ. Hồi máu / tạo khiên cho người tham gia khác chưa tính: hồi máu và khiên hiện chỉ cho đội võ
 * hồn của chính hồn sư.
 */
export function eliteJoin(room: MapRoom, b: BeastState, bd: BData, by: string) {
  const e = bd.elite!;
  if (!e.engaged) {
    e.engaged = true; e.lonely = 0;
    room.state.players.forEach((p, pid) => {
      if (!room.pdata.get(pid)?.travelling && room.inFight(b, e, p)) room.joinFight(e, pid);
    });
  }
  room.joinFight(e, by);
  room.eliteScale(b, e);
}

/** Bán kính giao chiến (mục 5.4): tinh anh ELITE.radius pixel quanh thân, thú vương cả hang (object `boss`). */
export function inFight(room: MapRoom, b: BeastState, e: EliteData, p: PlayerState) {
  return e.king ? room.map.inLair(p.x, p.y) : Math.hypot(p.x - b.x, p.y - b.y) <= ELITE.radius;
}

/** Thêm người tham gia; thú vương: người đã hết lượt nhận thưởng hôm nay được nhắc một lần mỗi trận (mục 5.4). */
export function joinFight(room: MapRoom, e: EliteData, pid: string) {
  if (e.parts.has(pid)) return;
  e.parts.set(pid, 0);
  const d = room.pdata.get(pid); if (d) e.acc.set(pid, d.accountId); // #119: vào lại thì lần nhắc hết lượt (noted) cũng chuyển sang phiên mới
  const world = !!e.king?.world, K = bossK(e.king), what = world ? "boss thế giới" : "thú vương";
  if (e.king && d && !e.king.noted.has(pid) && room.claimsToday(d, world) >= K.daily) {
    e.king.noted.add(pid);
    room.log(pid, `Hôm nay đã hết lượt nhận thưởng ${what} (${K.daily}/${K.daily}): vẫn đánh và nhận kinh nghiệm được, nhưng không nhận ${world ? "hồn hoàn và rương" : "rương"}. Lượt mới lúc 00:00 giờ Việt Nam.`, "#ffb35c");
  }
}

/** Áp số người tham gia vào máu: tăng thì ngay, giảm tối đa 1 mỗi ELITE.dropEvery giây; máu hiện tại giữ tỉ lệ phần trăm. */
export function eliteScale(room: MapRoom, b: BeastState, e: EliteData) {
  const want = Math.max(1, e.parts.size);
  let n = e.n;
  if (want > n) n = want;
  else if (want < n && e.dropT <= 0) { n--; e.dropT = e.king ? bossK(e.king).dropEvery : ELITE.dropEvery; }
  if (n === e.n) return;
  const ratio = b.hp / Math.max(1, b.maxHp);
  e.n = n; b.parts = n; b.maxHp = Math.round(e.base * bossHpMult(n));
  if (b.hp > 0) b.hp = Math.max(1, Math.min(b.maxHp, Math.round(ratio * b.maxHp)));
}

/**
 * Đổi dạng (#173, BossDef.forms; tinh anh Song Sắc Mãng): mỗi `every` giây sang dạng kế tiếp (báo cả vùng gần bằng `fx form`), `warn`
 * giây cuối của dạng thì `formWarn` (client nhấp nháy màu dạng sắp tới). Chạy cả khi chưa giao chiến để người tới gần thấy dạng thật.
 */
export function tickForm(room: MapRoom, bid: string, b: BeastState, e: EliteData, fd: FormDef, dt: number) {
  if ((e.formT -= dt) <= 0) {
    e.form = (e.form + 1) % fd.forms.length; e.formT += fd.every; if (e.formT <= 0) e.formT = fd.every;
    b.form = e.form + 1;
    const f = fd.forms[e.form]; room.broadcast("fx", { k: "form", bid, name: f.name, col: f.col, x: b.x, y: b.y });
  }
  const warn = e.formT <= fd.warn; if (b.formWarn !== warn) b.formWarn = warn;
}

/**
 * Mỗi tick của tinh anh: Cuồng nộ (máu dưới ELITE_RAGE.hp), loại người tham gia đã rời phòng / ở ngoài bán kính ELITE.outSecs giây
 * liên tục, bỏ giao chiến sau ELITE.idleSecs giây không còn người tham gia nào trong bán kính. Hook test `etick` gọi với `dt` lớn.
 */
export function tickElite(room: MapRoom, bid: string, b: BeastState, bd: BData, dt: number) {
  const e = bd.elite!, k = e.king;
  e.rageCd = Math.max(0, e.rageCd - dt); e.dropT = Math.max(0, e.dropT - dt);
  const rage = bd.buffs.get("rage"), forms = BOSSES[b.species]?.forms;
  if (forms) room.tickForm(bid, b, e, forms, dt);
  if (k) { if (room.tickKing(bid, b, bd, k, dt)) return; } // thú vương: rút đi, giai đoạn 2 (không có Cuồng nộ)
  else if (rage !== undefined) {
    if (rage - dt <= 0) { bd.buffs.delete("rage"); e.rageCd = ELITE_RAGE.cd; room.syncBeastBuff(b, bd); } else bd.buffs.set("rage", rage - dt);
  } else if (e.rageCd <= 0 && b.hp > 0 && b.hp < b.maxHp * ELITE_RAGE.hp) {
    bd.buffs.set("rage", ELITE_RAGE.secs); room.syncBeastBuff(b, bd);
    room.broadcast("fx", { k: "rage", bid, name: BEAST_BUFFS.rage.name });
  }
  if (!e.engaged) return;
  let near = false;
  const outSecs = k ? bossK(k).outSecs : ELITE.outSecs, idleSecs = k ? bossK(k).idleSecs : ELITE.idleSecs;
  for (const [pid, out] of e.parts) {
    const p = room.state.players.get(pid);
    if (!p || room.pdata.get(pid)?.travelling) { e.parts.delete(pid); continue; } // rời phòng, mất kết nối, đi cổng
    if (room.inFight(b, e, p)) { near = true; e.parts.set(pid, 0); }
    else if (out + dt >= outSecs) e.parts.delete(pid);
    else e.parts.set(pid, out + dt);
  }
  if (near) e.lonely = 0;
  else if ((e.lonely += dt) >= idleSecs) return room.eliteReset(bid, b, bd);
  room.eliteScale(b, e);
  // Bảng xếp hạng sát thương chỉ gửi cho người tham gia (đang áp vào máu hoặc đã có đóng góp), không phủ màn hình người đứng xem.
  if (k && (k.rankT -= dt) <= 0) {
    k.rankT = 1;
    const msg = { k: "rank", bid, ...room.kingRank(e) };
    for (const pid of new Set([...e.parts.keys(), ...room.contributors(e)])) room.clients.getById(pid)?.send("boss", msg);
  }
}

/** Bỏ giao chiến (mục 5.4): về chỗ sinh, hồi đầy máu (1 người), xóa người tham gia, đóng góp, trạng thái và hiệu ứng có lợi. */
export function eliteReset(room: MapRoom, bid: string, b: BeastState, bd: BData) {
  const e = bd.elite!;
  room.cancelCast(bid, b, bd);
  e.engaged = false; e.parts.clear(); e.dmgBy.clear(); e.supBy.clear(); e.acc.clear(); e.lonely = 0; e.n = 1; b.parts = 1; e.dropT = 0; e.rageCd = 0;
  bd.st.clear(); bd.buffs.clear(); room.syncStatus(b, bd); room.syncBeastBuff(b, bd);
  // Thú vương (BĐ5): về giai đoạn 1, bỏ chiêu giai đoạn 2; cả phòng được báo (thanh máu và bảng xếp hạng đặt lại).
  if (e.king) {
    const k = e.king; k.phase = 1; b.phase = 1; k.roar = 0; k.spd = 1; k.noted.clear(); k.rankT = 0;
    bd.skills = k.def.skills.map((def) => ({ def, cd: 0 }));
    // Boss thế giới (BĐ6e): cơ chế, điểm yếu, khiên, lặn về như lúc mới sinh; đã quá giờ nổi giận thì tick sau nổi giận lại.
    if (k.world) { k.world = newWorld(k.def); b.weak = 0; b.shield = 0; b.brk = 0; b.dive = false; }
    room.broadcast("boss", { k: "reset", bid, name: beastName(b.rank, b.species) });
  }
  bd.target = null; b.aggro = false; bd.kx = 0; bd.ky = 0; bd.ret = 0; b.x = bd.hx; b.y = bd.hy; bd.tx = bd.hx; bd.ty = bd.hy;
  b.maxHp = e.base; b.hp = e.base; bd.regen = 0;
}

/**
 * Sinh thú vương của bản đồ trong hang (object `boss`) cho khung giờ `slot`, rút đi sau `life` giây. Niên hạn = mức trên của bản đồ
 * (mục 5.4). Mỗi phòng lấy một suất mỗi khung giờ (takeKingSeat); suất của phòng cũ đã hủy mà đã hạ / rút đi thì không sinh, còn sống
 * thì sinh lại đầy máu ở giai đoạn 1 (phòng trống là không ai trong hang: như bỏ giao chiến) với thời gian còn lại của suất. Đang có
 * thú vương sống thì bỏ qua. Thú vương không tính vào `count` của vùng.
 */
export async function spawnKing(room: MapRoom, slot: number, life: number, want?: string) {
  const lair = room.map.lair, mid = room.state.mapId, years = kingYears(mid), now = Date.now();
  if (!lair || !years || life <= 0 || room.king?.slot === slot) return;
  if (room.king?.bid && room.state.beasts.has(room.king.bid)) return;
  if (room.kingTaking === slot) return;
  // Boss của khung: thú vương theo hang; boss thế giới (BĐ6e) theo lịch luân phiên (hoặc hook test), giữ theo khung ở kingSeats.
  const world = MAPS[mid].world ?? [], pick = world.length ? (want && world.includes(want) ? want : worldBossOn(mid, slot + bossOffset(now))!) : BOSSES[lair.boss].id;
  room.kingTaking = slot;
  let taken: Awaited<ReturnType<typeof takeKingSeat>>;
  try { taken = await takeKingSeat(mid, slot, now + life * 1000, room.roomId, pick); } catch (e) { room.kingTaking = 0; throw e; }
  const { seat, claimed, boss } = taken;
  room.king = { slot, bid: null, seat, claimed };
  if (seat.state === "alive" && seat.leaveAt <= now) seat.state = "gone";
  if (seat.state !== "alive") return;
  life = (seat.leaveAt - now) / 1000;
  const cx = lair.x + lair.w / 2, cy = lair.y + lair.h / 2;
  let x = cx, y = cy;
  for (let k = 0; k < 40 && room.map.hits(x, y, BOSS_BOX.hw, BOSS_BOX.hh); k++) { x = cx + (Math.random() - 0.5) * lair.w * 0.6; y = cy + (Math.random() - 0.5) * lair.h * 0.6; }
  const bi = bossIndex(boss);
  room.king.bid = room.addBeast(lair.zone, years, bi, x, y, BOSSES[bi].rank, slot, life);
}

/** Chọn loài theo trọng số trong số loài khai báo ở vùng; vùng không có loài hợp lệ thì lấy loài bất kỳ. */
export function pickSpecies(room: MapRoom, zi: number) {
  let list = room.map.zones[zi].beasts;
  if (!list.length) list = BEASTS.map((_, i) => ({ species: i, w: 1 }));
  let r = Math.random() * list.reduce((a, b) => a + b.w, 0);
  for (const b of list) { r -= b.w; if (r <= 0) return b.species; }
  return list[list.length - 1].species;
}
