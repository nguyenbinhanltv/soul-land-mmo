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

type Pt = { x: number; y: number };
type HpPt = Pt & { hp: number; maxHp: number };

/** Id gần `p` nhất trong bán kính `r` (xét từng ứng viên `[id, điểm]`); không có thì undefined. */
export function pickNearest(p: Pt, r: number, cands: Iterable<[string, Pt]>) {
  let best: string | undefined, bd = r;
  for (const [bid, b] of cands) { const dd = Math.hypot(b.x - p.x, b.y - p.y); if (dd < bd) { bd = dd; best = bid; } }
  return best;
}

/** Id còn ít sinh lực nhất (theo tỉ lệ) trong bán kính `r`; bằng nhau thì con gần hơn. */
export function pickWeakest(p: Pt, r: number, cands: Iterable<[string, HpPt]>) {
  let best: string | undefined, bf = 2, bd = r;
  for (const [bid, b] of cands) {
    const dd = Math.hypot(b.x - p.x, b.y - p.y), f = b.hp / Math.max(1, b.maxHp);
    if (dd < r && (f < bf - 1e-6 || (Math.abs(f - bf) <= 1e-6 && dd < bd))) { bf = f; bd = dd; best = bid; }
  }
  return best;
}

/** Điểm hiệu ứng của một tin client: (x, y), rồi (x1, y1), rồi người chơi `id` / `to`, rồi hồn thú `bid`; không có thì null. */
export function fxPoint(m: Record<string, unknown>, player: (id: string) => Pt | undefined, beast: (id: string) => Pt | undefined): Pt | null {
  const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  if (num(m.x) && num(m.y)) return { x: m.x as number, y: m.y as number };
  if (num(m.x1) && num(m.y1)) return { x: m.x1 as number, y: m.y1 as number };
  const sid = typeof m.id === "string" ? m.id : typeof m.to === "string" ? m.to : null, p = sid ? player(sid) : undefined;
  if (p) return p;
  const b = typeof m.bid === "string" ? beast(m.bid) : undefined;
  return b ?? null;
}

/** Điểm xuất hiện ngẫu nhiên trong ô `spawn` (chừa lề 8), thử tối đa 30 lần tránh vật cản; không được thì lấy tâm ô. */
export function spawnPointIn(spawn: { x: number; y: number; w: number; h: number }, blocked: (x: number, y: number) => boolean, rnd: () => number) {
  for (let k = 0; k < 30; k++) {
    const x = spawn.x + 8 + rnd() * (spawn.w - 16), y = spawn.y + 8 + rnd() * (spawn.h - 16);
    if (!blocked(x, y)) return { x, y };
  }
  return { x: spawn.x + spawn.w / 2, y: spawn.y + spawn.h / 2 };
}

/** Lướt từ (x, y) theo `dir` tối đa `dist` pixel, mỗi bước 2, dừng khi bước kế vướng vật cản. Trả vị trí mới và quãng đã lướt. */
export function dashPath(x: number, y: number, dir: Pt, dist: number, blocked: (x: number, y: number) => boolean) {
  let moved = 0;
  while (moved < dist && !blocked(x + dir.x * 2, y + dir.y * 2)) { x += dir.x * 2; y += dir.y * 2; moved += 2; }
  return { x, y, moved };
}
