// Rơi đồ và thưởng hạ hồn thú (GAME_DESIGN.md mục 5.1, 5.2, 5.3, 5.15): kinh nghiệm `rewardKill` / `benchXp` / `addXp`, đồ rơi xuống đất `newDrop`, hồn cốt `rollBone`,
// hồn hạch `rollCoreDrop`, mảnh võ hồn `rollShard`, tiên thảo `rollHerb`, trang bị `rollEquipGround`, tách khỏi MapRoom.ts (#702, bước 20).
// Hàm nhận phòng (`room: MapRoom`) như combat.ts / tick.ts; nguyên văn từ MapRoom, không đổi số / thứ tự RNG / thứ tự xử lý. MapRoom chỉ chuyển tiếp 9 hàm
// (`killBeast`, `boss.ts`, `autoHunt.ts`, `gm.ts` gọi `room.rollX` / `room.rewardKill` / `room.addXp` như cũ).
// Còn ở MapRoom: `killBeast`, `useItem` / `pickup` / `useHerb`, `addRing` / `addBone` / `addEquip`, `chestEquip`, `lootNote` / `shardNote` / `canLoot`.
import { TIERS, VOHON, xpNeed, xpBlocked, tierOfYears, vohonIndex, XP_SHARE_ACTIVE, XP_SHARE_BENCH, beastLevel, xpLevelScale, BEASTS, MAPS, itemDef, beastStats, DROP_OWNER_SECS, DROP_TTL_SECS, SHARD_QTY, shardChance, shardCode, BONE_ITEM, BONE_SLOTS, boneChance, boneName, CORE_ITEM, CORE_SETS, coreChance, rollCore, coreName, coreSetIndex, EQUIP_ITEM, equipName, rollEquipDrop, EQUIP_TEMPLATES, EQUIP_TIERS, herbChance, HERBS } from "../../../shared/data.ts";
import type { Character } from "../db.ts";
import * as party from "../party.ts";
import { DropState } from "./schema.ts";
import { uid, type MapRoom } from "./MapRoom.ts";

/**
 * Trang bị khi hạ hồn thú thường / tinh anh (E2, mục 5.15): `rollEquipDrop(rank, bản đồ, rng, rate)`. Đá cường hóa vào thẳng túi người
 * hạ `id` (túi đầy thì phần dư rơi xuống đất như mảnh võ hồn); mỗi món trang bị rơi xuống đất cạnh hồn hoàn, cùng luật ưu tiên `owner`.
 * `rate` = 0 cho tới khi có nguồn sự kiện máy chủ. Bản đồ không có trong EQUIP_MAPS thì không rơi gì.
 */
export function rollEquipGround(room: MapRoom, id: string, owner: string, rank: number, x: number, y: number, why?: string) {
  const d = room.pdata.get(id); if (!d) return;
  const drops = rollEquipDrop(rank, room.state.mapId, room.equipRng(d), 0); if (!drops.length) return;
  const spots = [[x - 16, y], [x, y - 8], [x + 8, y - 8], [x - 8, y + 8], [x + 16, y + 8]];
  let k = 0, bagged = false;
  for (const e of drops) {
    if (e.kind === "stone") {
      const def = itemDef(e.code); if (!def) continue;
      const got = room.addItem(d, e.code, e.qty);
      if (got) { room.log(id, `Nhận ${got} ${def.name}.`, def.col); bagged = true; }
      if (got < e.qty) {
        const drop = room.map.standable(x + 8, y) ? room.newDrop(x + 8, y, id) : room.newDrop(x, y, id);
        drop.item = e.code; drop.qty = e.qty - got;
        room.state.drops.set(uid("d"), drop);
        room.log(id, `Túi đồ đã đầy (${d.bagSlots} ô): ${drop.qty} ${def.name} rơi xuống đất, ${room.lootNote(id, id)}`, "#ffb35c");
      }
      continue;
    }
    const ti = EQUIP_TEMPLATES.findIndex((t) => t.id === e.item.tpl), tpl = EQUIP_TEMPLATES[ti]; if (!tpl) continue;
    const [cx, cy] = spots.slice(k).find(([a, b]) => room.map.standable(a, b)) ?? [x, y]; k = Math.min(spots.length - 1, k + 1);
    const drop = room.newDrop(cx, cy, owner), col = EQUIP_TIERS[tpl.tier].col, did = uid("d");
    drop.item = EQUIP_ITEM; drop.qty = 1; drop.stars = tpl.tier + 1; drop.cset = ti;
    room.equipDrops.set(did, e.item); room.state.drops.set(did, drop);
    room.broadcast("fx", { k: "wave", x: drop.x, y: drop.y, r: 30, col });
    const msg = `${equipName(tpl.id)} (${EQUIP_TIERS[tpl.tier].color}) rơi xuống đất!`;
    room.log(id, `${msg} ${room.lootNote(owner, id, why)}`, col);
    if (owner !== id) room.log(owner, `${msg} ${room.lootNote(owner, owner)}`, col);
  }
  if (bagged) room.sendBag(id);
}

/**
 * Kinh nghiệm hạ hồn thú `years` năm (mục 5.1, 5.3; tăng theo số năm, beastStats): giảm theo chênh cấp giữa võ hồn ra trận và
 * cấp tương đương của số năm (beastLevel, từ BĐ3) một lần, rồi chia cho đội:
 * võ hồn ra trận XP_SHARE_ACTIVE, mỗi võ hồn khác trong đội XP_SHARE_BENCH (kể cả võ hồn đã gục). Ô trống và võ hồn
 * ở bình cảnh không nhận, phần đó không chia lại. `mult`: hệ số theo bậc hồn thú (tinh anh ELITE.xp, BĐ4).
 */
export function rewardKill(room: MapRoom, id: string, years: number, mult = 1) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  const base = beastStats(years).xp * mult * xpLevelScale(p.level, beastLevel(years));
  for (const r of d.team) {
    const v = d.owned.find((o) => o.rowId === r); if (!v) continue;
    if (v === d.ch) room.addXp(id, Math.round(base * XP_SHARE_ACTIVE));
    else room.benchXp(id, v, Math.round(base * XP_SHARE_BENCH));
  }
}

/** Kinh nghiệm cho võ hồn trong đội đang không ra trận (cùng luật lên cấp, bình cảnh như addXp). */
export function benchXp(room: MapRoom, id: string, v: Character, n: number) {
  if (n <= 0 || xpBlocked(v.level, v.rings.length)) return;
  const d = room.pdata.get(id)!, name = VOHON[Math.max(0, vohonIndex(v.vohon))].name, lv0 = v.level;
  v.xp += n; d.dirty.add(v.rowId);
  while (!xpBlocked(v.level, v.rings.length) && v.xp >= xpNeed(v.level)) {
    v.xp -= xpNeed(v.level); v.level++;
    if (!d.down.has(v.rowId)) d.benchHp.delete(v.rowId); // lên cấp thì hồi đầy, như võ hồn ra trận
    if (xpBlocked(v.level, v.rings.length)) {
      v.xp = 0;
      room.log(id, `${name} đạt cấp ${v.level}: bình cảnh! Cần hấp thụ hồn hoàn thứ ${v.rings.length + 1}.`, "#ffe08a");
    } else room.log(id, `${name} lên cấp ${v.level}.`);
  }
  if (v.level !== lv0) room.resCheck(id); // cộng minh (8.2)
}

export function addXp(room: MapRoom, id: string, n: number) {
  const p = room.state.players.get(id)!, lv0 = p.level;
  if (n <= 0 || xpBlocked(p.level, p.rings.length)) return;
  p.xp += n;
  while (!xpBlocked(p.level, p.rings.length) && p.xp >= xpNeed(p.level)) {
    p.xp -= xpNeed(p.level); p.level++;
    room.recalc(id, false); room.pdata.get(id)!.hpF = p.maxHp;
    room.broadcast("fx", { k: "wave", x: p.x, y: p.y, r: 30, col: "#ffe9a0" });
    if (xpBlocked(p.level, p.rings.length)) {
      p.xp = 0;
      room.log(id, `Đạt cấp ${p.level}: bình cảnh! Hãy săn hồn thú và hấp thụ hồn hoàn thứ ${p.rings.length + 1}.`, "#ffe08a");
    } else room.log(id, `Lên cấp ${p.level}.`);
  }
  room.recalc(id, false);
  if (p.level !== lv0) room.resCheck(id); // cộng minh (8.2): võ hồn cấp 30+
}

/**
 * Hồn hạch (bước 5.1, bảng rơi 5.3): hạ hồn thú `years` năm thì tung coreChance (tinh anh `sure`: chắc chắn rơi, mục 5.4); trúng thì
 * một hồn hạch sao theo niên hạn, bộ đặc trưng của bản đồ (MapDef.cores) hoặc bộ bất kỳ, chỉ số chính / phụ tung ngay lúc rơi
 * (giữ trong coreDrops). Rơi xuống đất cạnh hồn hoàn, cùng luật đồ rơi: `owner` ưu tiên DROP_OWNER_SECS giây, nhặt (E) vào túi,
 * túi đầy thì báo. Hook test `core` của người hạ `id` cố định được số ngẫu nhiên, sao và bộ.
 * Rương tà hóa thú vương (BĐ5, openChest) cho hồn hạch thẳng vào túi bằng `rollCore(..., { high: true })` rồi `addCore`.
 */
export function rollCoreDrop(room: MapRoom, id: string, owner: string, years: number, x: number, y: number, sure = false, why?: string) {
  const d = room.pdata.get(id); if (!d) return;
  const t = d.testCore;
  if ((t ? t.r : Math.random()) >= (sure ? 1 : coreChance(years))) return;
  const core = rollCore(years, MAPS[room.state.mapId]?.cores ?? [], Math.random, t ? { stars: t.stars, set: t.set >= 0 ? t.set : undefined } : {});
  // Bên phải hồn hoàn (hồn cốt nằm bên trái, mảnh võ hồn khi túi đầy sát bên phải) để biểu tượng và nhãn không chồng lên nhau.
  // Không chỗ nào đứng được (hồn thú gục sát vật cản) thì nằm đúng chỗ hồn hoàn, như hồn hoàn.
  const [cx, cy] = [[x + 16, y], [x, y + 8]].find(([a, b]) => room.map.standable(a, b)) ?? [x, y];
  const drop = room.newDrop(cx, cy, owner);
  const si = Math.max(0, coreSetIndex(core.data.set)), col = CORE_SETS[si].col;
  drop.item = CORE_ITEM; drop.qty = 1; drop.tier = tierOfYears(years); drop.years = years; drop.stars = core.stars; drop.cset = si;
  const did = uid("d");
  room.coreDrops.set(did, core); room.state.drops.set(did, drop);
  room.broadcast("fx", { k: "wave", x: drop.x, y: drop.y, r: 30, col });
  const msg = `${coreName(core.data.set, core.stars)} rơi xuống đất!`;
  room.log(id, `${msg} ${room.lootNote(owner, id, why)}`, col);
  if (owner !== id) room.log(owner, `${msg} ${room.lootNote(owner, owner)}`, col);
}

/**
 * Hồn cốt (bước 4.1, bảng rơi 5.3): hạ hồn thú `years` năm thì tung boneChance; trúng thì một hồn cốt cùng loài, cùng số năm, vị
 * trí ngẫu nhiên trong 6 vị trí, rơi xuống đất cạnh hồn hoàn. Cùng luật đồ rơi như hồn hoàn: người hạ ưu tiên DROP_OWNER_SECS
 * giây, nhặt (E) vào túi, túi đầy thì báo. Hook test `bone` của người hạ `id` cố định được số ngẫu nhiên và vị trí.
 * Tinh anh (BĐ4): `mult` = ELITE.bone, quyền ưu tiên thuộc `owner` (người đóng góp nhiều nhất, như hồn hoàn).
 */
export function rollBone(room: MapRoom, id: string, owner: string, species: number, years: number, tier: number, x: number, y: number, mult = 1, why?: string) {
  const d = room.pdata.get(id); if (!d) return;
  const t = d.testBone;
  if ((t ? t.r : Math.random()) >= boneChance(years, mult)) return;
  const slot = t && t.s >= 0 ? t.s % BONE_SLOTS.length : Math.floor(Math.random() * BONE_SLOTS.length);
  const drop = room.map.standable(x - 8, y) ? room.newDrop(x - 8, y, owner) : room.newDrop(x, y, owner);
  drop.item = BONE_ITEM; drop.qty = 1; drop.tier = tier; drop.years = years; drop.species = species; drop.slot = slot;
  room.state.drops.set(uid("d"), drop);
  room.broadcast("fx", { k: "wave", x: drop.x, y: drop.y, r: 30, col: TIERS[tier].glow });
  const bone = `Hồn cốt ${boneName(BEASTS[species]?.id ?? "", BONE_SLOTS[slot].id, years)} rơi xuống đất!`;
  room.log(id, `${bone} ${room.lootNote(owner, id, why)}`, TIERS[tier].glow);
  if (owner !== id) room.log(owner, `${bone} ${room.lootNote(owner, owner)}`, TIERS[tier].glow);
}

/**
 * Đồ rơi tại (x, y): người hạ `owner` được ưu tiên nhặt DROP_OWNER_SECS giây, tồn tại DROP_TTL_SECS giây (mục 4, 5.2). Từ 7.1 chụp
 * tổ đội của `owner` lúc rơi: cả tổ đội cùng được ưu tiên (người vào đội sau lúc rơi thì không, người rời đội thì mất quyền).
 */
export function newDrop(room: MapRoom, x: number, y: number, owner: string) {
  const drop = new DropState(), od = room.pdata.get(owner);
  drop.x = x; drop.y = y; drop.owner = owner; drop.ownerTtl = DROP_OWNER_SECS; drop.ttl = DROP_TTL_SECS;
  drop.party = od ? party.partyIdOf(od.accountId) : 0;
  return drop;
}

// ---------- Mảnh võ hồn, mở võ hồn, lên sao (mục 5.1 "Sưu tầm võ hồn", 5.3 "Rơi đặc trưng", bước 3.4) ----------
/**
 * Hạ hồn thú `years` năm: tung tỉ lệ rơi mảnh (shardChance, bảng rơi 5.3); trúng thì SHARD_QTY mảnh của một võ hồn ngẫu nhiên
 * trong MAPS[bản đồ].shards vào thẳng túi người hạ. Túi đầy thì phần không nhận rơi xuống đất cạnh hồn hoàn, cùng luật ưu tiên
 * người hạ như hồn hoàn (3.2). Hook test `shard` cố định được số ngẫu nhiên và võ hồn được chọn.
 */
export function rollShard(room: MapRoom, id: string, years: number, x: number, y: number) {
  const d = room.pdata.get(id), list = MAPS[room.state.mapId].shards; if (!d || !list.length) return;
  const t = d.testShard;
  if ((t ? t.r : Math.random()) >= shardChance(years)) return;
  const vohon = list[t && t.i >= 0 ? t.i % list.length : Math.floor(Math.random() * list.length)], code = shardCode(vohon), def = itemDef(code);
  if (!def) return;
  const got = room.addItem(d, code, SHARD_QTY);
  if (got) { room.log(id, `Nhận ${got} ${def.name}${room.shardNote(d, code)}.`, def.col); room.sendBag(id); }
  if (got < SHARD_QTY) {
    // Cạnh hồn hoàn nếu chỗ đó đứng được (không thì chồng lên hồn hoàn; nhấn E lần nữa để nhặt nốt).
    const drop = room.map.standable(x + 8, y) ? room.newDrop(x + 8, y, id) : room.newDrop(x, y, id);
    drop.item = code; drop.qty = SHARD_QTY - got;
    room.state.drops.set(uid("d"), drop);
    room.log(id, `Túi đồ đã đầy (${d.bagSlots} ô): ${drop.qty} ${def.name} rơi xuống đất, ${room.lootNote(id, id)}`, "#ffb35c");
  }
}

// ---------- Tiên thảo (mục 5.3 "Lạc Nhật Sâm Lâm", 5.7; bước BĐ6b) ----------
/**
 * Hạ hồn thú ở vùng `zone` (tên vùng nơi hồn thú bị hạ): bản đồ có MapDef.herbs thì tung herbChance (tinh anh x HERB_ELITE); trúng
 * thì 1 tiên thảo ngẫu nhiên trong HERBS vào thẳng túi người hạ như mảnh võ hồn; túi đầy thì rơi xuống đất cạnh hồn hoàn, người hạ ưu
 * tiên nhặt. Hook test `herb` của người hạ cố định được số ngẫu nhiên và loại.
 */
export function rollHerb(room: MapRoom, id: string, zone: string | undefined, x: number, y: number, elite: boolean) {
  const d = room.pdata.get(id), chance = herbChance(room.state.mapId, zone, elite); if (!d || chance <= 0) return;
  const t = d.testHerb;
  if ((t ? t.r : Math.random()) >= chance) return;
  const h = HERBS[t && t.i >= 0 ? t.i % HERBS.length : Math.floor(Math.random() * HERBS.length)], def = itemDef(h.id); if (!def) return;
  room.broadcast("fx", { k: "wave", x, y: y - 6, r: 26, col: h.col });
  if (room.addItem(d, h.id, 1)) { room.log(id, `Tìm được tiên thảo ${h.name}! (túi đồ: dùng cho một võ hồn)`, h.col); room.sendBag(id); return; }
  const drop = room.map.standable(x, y + 8) ? room.newDrop(x, y + 8, id) : room.newDrop(x, y, id);
  drop.item = h.id; drop.qty = 1;
  room.state.drops.set(uid("d"), drop);
  room.log(id, `Túi đồ đã đầy (${d.bagSlots} ô): tiên thảo ${h.name} rơi xuống đất, ${room.lootNote(id, id)}`, "#ffb35c");
}
