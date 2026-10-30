// Hàm thuần tính toán nhỏ tách khỏi MapRoom.ts (#702): không giữ phòng, không ghi DB. Nguyên văn, không đổi hành vi.
import { CORE_SETS, CORE_SET_2, CORE_SET_4, coreSetIndex, ELITE_RAGE, WORLD, SUPPORT_CONTRIB } from "../../../shared/data.ts";

/** Câu báo khi bộ `set` có `n` món đang gắn trên một võ hồn và vừa đủ 2 / 4 món ("" nếu không). */
export function coreSetNoteOf(n: number, set: string) {
  const cs = CORE_SETS[coreSetIndex(set)];
  if (!cs || (n !== CORE_SET_2 && n !== CORE_SET_4)) return "";
  return ` Kích hoạt bộ ${cs.name} ${n} món: ${n === CORE_SET_4 ? cs.set4 : cs.set2}.`;
}

/** Sát thương đòn thường hiện tại của hồn thú: Cuồng nộ cộng thêm ELITE_RAGE.dmg, boss thế giới nổi giận nhân WORLD.rageDmg. */
export const beastDmgOf = (base: number, rage: boolean, worldRage: boolean) => base * (rage ? 1 + ELITE_RAGE.dmg : 1) * (worldRage ? WORLD.rageDmg : 1);

/** Gộp các hiệu ứng đang có thành mặt nạ bit để đồng bộ state (`bit` = buffBit / beastBuffBit). */
export function buffMask<K>(keys: Iterable<K>, bit: (k: K) => number) { let m = 0; for (const k of keys) m |= bit(k); return m; }

/** Đóng góp của `pid` vào một trận tinh anh / boss: sát thương gây + hỗ trợ nhân SUPPORT_CONTRIB. */
export const contribOf = (dmgBy: ReadonlyMap<string, number>, supBy: ReadonlyMap<string, number>, pid: string) => (dmgBy.get(pid) ?? 0) + (supBy.get(pid) ?? 0) * SUPPORT_CONTRIB;

/** Mọi người có đóng góp (gây sát thương hoặc hỗ trợ), không trùng. */
export const contributors = (dmgBy: ReadonlyMap<string, number>, supBy: ReadonlyMap<string, number>) => [...new Set([...dmgBy.keys(), ...supBy.keys()])];
