// Chỉ số hồn sư (GAME_DESIGN.md mục 4, 5.2, 5.15, 8): tính lại chỉ số võ hồn ra trận (recalc), tin riêng "stats", Sức mạnh đội hình, tổng chỉ số hồn cốt / hồn hạch / trang bị,
// hệ số buff / ràng buộc / hồi máu, công hiện tại. Nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi PlayerState / thứ tự gọi Math.random.
// Phần lớn là hàm thuần trên `PData` (không cần phòng); chỉ `recalc` / `sendStats` nhận `room: MapRoom`. MapRoom chỉ chuyển tiếp (mọi miền khác gọi `room.buffV` /
// `room.atkOf` / `room.recalc` như cũ); `ArenaRoom` vẫn override `healMult` (nên MapRoom giữ phương thức `healMult`).

import {
  VOHON, calcStats, tierOfYears, vohonIndex, herbBonus, xpNeed, xpBlocked, powerScore, teamPowerScore, equipDefTotal, equipWeaponRoll,
  BONE_ITEM, parseBone, boneBonus, parseBoneSubs, boneAddSubs, bonePassive,
  CORE_ITEM, parseCore, coreSlotOf, coreBonus, coreFx, coreSetCounts,
  bondSum, buffBit,
  type CoreStat, type BuffId, type BondKey, type PassiveBuff, type ChanThanStat, type OfflinePower,
} from "../../../shared/data.ts";
import type { Character } from "../db.ts";
import type { PlayerState } from "./schema.ts";
import { coreSetNoteOf, addGearBonus, buffMask } from "./calc.ts";
import type { MapRoom, PData } from "./MapRoom.ts";

export function recalc(room: MapRoom, id: string, full: boolean) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!;
  const cores = coresOn(d, d.ch.rowId);
  const s = calcStats(p.vh, p.level, [...p.rings], d.ch.stars, boneBonusOf(d, d.ch.rowId), withGear(d, coreBonus(cores)), d.res.bonus, herbBonus(d.ch.herbs));
  p.maxHp = s.maxHp; p.maxMp = s.maxMp; d.atk = s.atk; d.speed = s.speed; d.crit = s.crit; d.critMult = s.critMult;
  if (d.ava?.row === d.ch.rowId) p.maxHp = Math.round(s.maxHp * (1 + (d.ava.stats.hp ?? 0))); // Võ Hồn Chân Thân (8.1a)
  d.passive = bonePassive(bonesOn(d, d.ch.rowId)); // bị động hồn cốt (4.3) theo võ hồn ra trận
  d.coreFx = coreFx(cores); // hiệu ứng bộ hồn hạch (5.2) theo võ hồn ra trận
  p.xpNeed = xpBlocked(p.level, p.rings.length) ? 0 : xpNeed(p.level);
  if (full) { d.hpF = p.maxHp; d.mpF = p.maxMp; }
  d.hpF = Math.min(d.hpF, p.maxHp); d.mpF = Math.min(d.mpF, p.maxMp);
  p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
}

export function sendStats(room: MapRoom, id: string, rowId: unknown) {
  const d = room.pdata.get(id), c = room.clients.getById(id); if (!d || !c) return;
  const v = d.owned.find((x) => x.rowId === rowId) ?? d.ch;
  if (v === d.ch) room.syncCh(id);
  const vh = Math.max(0, vohonIndex(v.vohon)), rings = v.rings.map(tierOfYears), herbs = herbBonus(v.herbs);
  const total = calcStats(vh, v.level, rings, v.stars, boneBonusOf(d, v.rowId), coreBonusOf(d, v.rowId), d.res.bonus, herbs);
  const base = calcStats(vh, v.level, rings, v.stars, {}, {}, d.res.bonus, herbs);
  const gear = { bonus: d.gearSt.bonus, weapon: d.gearSt.weapon, red: d.gearSt.red, luck: d.gearSt.luck }; // trang bị hồn sư (5.15): `total` đã gồm phần cộng này
  const power = powerScore(total), teamPower = teamPowerOf(d); // Sức mạnh (X3): trước khi cộng Chân Thân (hiệu ứng trận không tính), cùng hàm với hạng mục `suc_manh`
  if (d.ava?.row === v.rowId) total.maxHp = Math.round(total.maxHp * (1 + (d.ava.stats.hp ?? 0))); // như recalc
  c.send("stats", { rowId: v.rowId, total, base, gear, power, teamPower });
}

/** Điểm Sức mạnh của đội hình đang lưu (`teamPowerScore`, bước X3): chỉ số thật của từng võ hồn trong ô đội, không buff tạm / Chân Thân; dùng cho bảng Nhân vật và hạng mục `suc_manh`. */
export function teamPowerOf(d: PData) {
  const seen = new Set<number>(), stats: ReturnType<typeof calcStats>[] = [];
  for (const r of d.team) {
    const v = r && !seen.has(r) ? d.owned.find((o) => o.rowId === r) : undefined; if (!v) continue; seen.add(r);
    stats.push(calcStats(Math.max(0, vohonIndex(v.vohon)), v.level, v.rings.map(tierOfYears), v.stars, boneBonusOf(d, r), coreBonusOf(d, r), d.res.bonus, herbBonus(v.herbs)));
  }
  return teamPowerScore(stats);
}
/** Sinh lực tối đa của một võ hồn sở hữu (dù đang ra trận hay không), kể cả hồn cốt (4.2), hồn hạch (5.2) đang gắn, cộng minh (8.2) và tiên thảo (BĐ6b). */
export function maxHpOf(d: PData, v: Character) {
  return calcStats(Math.max(0, vohonIndex(v.vohon)), v.level, v.rings.map(tierOfYears), v.stars, boneBonusOf(d, v.rowId), coreBonusOf(d, v.rowId),
    d.res.bonus, herbBonus(v.herbs)).maxHp;
}

/** Độ lớn hiệu ứng có lợi `b` đang có trên hồn sư (0 = không có), cộng cả bị động hồn cốt cùng tên (4.3) của võ hồn ra trận. */
export function buffV(d: PData, b: BuffId) {
  const resonance = b === "def" ? (d.res.bonus.def ?? 0) / 100 : 0;
  // Giảm sát thương: bị động hồn cốt cộng giảm của trang bị dưới cùng một trần BONE_PASSIVE_CAP.def (mục 5.15).
  const passive = b === "def" ? equipDefTotal(d.passive.buff.def ?? 0, d.gearSt.red) : d.passive.buff[b as PassiveBuff] ?? 0;
  return resonance + (d.buffs.get(b)?.v ?? 0) + passive + (d.ava ? d.ava.stats[b as ChanThanStat] ?? 0 : 0); // + cộng minh Sao võ hồn và Chân Thân (8.1a)
}
/** Công hiện tại của võ hồn ra trận, tính cả hiệu ứng tăng công. */
export function atkOf(d: PData, bond = true, weapon: "roll" | "mid" | "none" = "roll") {
  // Công vũ khí (5.15) cộng vào công một đòn trước hệ số: "roll" = đòn trực tiếp (tung trong [min, max], may mắn), "mid" = công giữa (sát thương theo thời gian, hiển thị), "none" = không (dung hợp).
  const w = d.gearSt.weapon, add = !w || weapon === "none" ? 0 : weapon === "mid" ? (w.min + w.max) / 2 : equipWeaponRoll(w, d.gearSt.luck, Math.random);
  return (d.atk + add) * (1 + buffV(d, "atk") + (bond ? bondV(d, "atk") : 0));
} // + ràng buộc Thất Bảo Lưu Ly Tông (9.4); dung hợp kỹ không nhận (#192)
/** Chỉ số võ hồn ra trận cho công thức tự đánh (offlineFight): ủy thác offline và trần tốc độ tự săn (AUTO_PACE). */
export function offlinePower(d: PData, p: PlayerState): OfflinePower { return { atk: atkOf(d, true, "mid"), crit: d.crit, critMult: d.critMult, maxHp: p.maxHp, def: VOHON[p.vh].def }; }
/** Đồng bộ PlayerState.buff (bit theo BUFF_IDS) để mọi người thấy hào quang. */
export function syncBuffs(p: PlayerState, d: PData) { p.buff = buffMask(d.buffs.keys(), buffBit); }
/**
 * Ràng buộc (BONDS, 2.5d, đủ bảng ở 9.4): tổng hiệu ứng `k` của các cặp võ hồn cùng trong đội của hồn sư (ô bất kỳ, kể cả đang
 * gục), võ hồn nào ra trận cũng hưởng; cùng loại từ nhiều cặp thì cộng.
 */
export function bondV(d: PData, k: BondKey) {
  return bondSum(d.team.map((r) => d.owned.find((v) => v.rowId === r)?.vohon ?? ""), k);
}
/** Hệ số hồi máu và khiên do hồn sư tạo: bộ hồn hạch Lưu Ly 2 món (5.2) + ràng buộc Lam Ngân Hoàng (9.4), cộng nhau. */
export function healMult(d: PData) { return 1 + (d.coreFx.heal ?? 0) + bondV(d, "heal"); }

/** Hồn cốt đang gắn trên võ hồn `rowId` (món của chính người chơi trong `d.bag`, `vohonId` = rowId); dữ liệu hỏng thì bỏ qua. */
export function bonesOn(d: PData, rowId: number) {
  return d.bag.flatMap((it) => {
    const b = it.vohonId === rowId && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
    return b ? [{ it, beast: b.beast, slot: b.slot, years: it.years!, enhance: it.enhance }] : [];
  });
}
/** Tổng chỉ số hồn cốt đang gắn trên võ hồn `rowId` (boneBonus: chỉ số chính và dòng phụ), cộng vào calcStats. */
export function boneBonusOf(d: PData, rowId: number) { return boneBonus(bonesOn(d, rowId).map((b) => ({ ...b, subs: parseBoneSubs(b.it.stats) }))); }
/**
 * Tung bù dòng phụ hồn cốt (#187) khi nạp túi đồ lúc vào phòng: hồn cốt +N có ít dòng hơn số mốc đã đạt (cường hóa trước khi có
 * dòng phụ, hoặc tạo bằng hook test) được tung phần còn thiếu (boneAddSubs), đánh dấu `bagDirty`; nơi gọi ghi ngay qua chuỗi lưu.
 * Đã đủ dòng thì lần vào sau không tung thêm. Trả số dòng đã thêm.
 */
export function fillBoneSubs(d: PData) {
  let n = 0;
  for (const it of d.bag) {
    const bone = it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null; if (!bone) continue;
    const r = boneAddSubs(bone.slot, it.years!, it.enhance, parseBoneSubs(it.stats), Math.random);
    if (r.added.length) { it.stats = { ...(it.stats as object), subs: r.subs }; n += r.added.length; }
  }
  if (n) d.bagDirty = true;
  return n;
}

/** Hồn hạch đang gắn trên võ hồn `rowId` (món của chính người chơi, `vohonId` = rowId), kèm ô (coreSlotOf); dữ liệu hỏng thì bỏ qua. */
export function coresOn(d: PData, rowId: number) {
  return d.bag.flatMap((it) => {
    const c = it.vohonId === rowId && it.code === CORE_ITEM ? parseCore(it.stats) : null;
    return c ? [{ it, stars: it.stars ?? 1, data: c, enhance: it.enhance, slot: coreSlotOf(it.stats) }] : [];
  });
}
/** Tổng chỉ số hồn hạch đang gắn trên võ hồn `rowId` (coreBonus, kèm phần chỉ số của bộ), cộng vào calcStats. */
export function coreBonusOf(d: PData, rowId: number) { return withGear(d, coreBonus(coresOn(d, rowId))); }
/** Cộng chỉ số trang bị hồn sư đang mặc (thuộc hồn sư, dùng chung mọi võ hồn) vào bảng chỉ số kiểu hồn hạch; cùng đơn vị với coreBonus. */
export function withGear(d: PData, b: Record<CoreStat, number>) {
  return addGearBonus(b, d.gearSt.bonus);
}
/** Câu báo khi bộ `set` trên võ hồn `rowId` vừa đủ 2 / 4 món ("" nếu không). */
export function coreSetNote(d: PData, rowId: number, set: string) { return coreSetNoteOf(coreSetCounts(coresOn(d, rowId)).get(set) ?? 0, set); }
