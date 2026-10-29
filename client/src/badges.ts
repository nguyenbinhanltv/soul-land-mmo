// UI v2, kho chấm đỏ / mũi tên xanh toàn hệ (đợt 4b, Part of #885; kiểm kê UI/UX, thiếu #2). Một kho `badges` ở client, suy ra từ tin server có sẵn
// (túi, võ hồn, nhiệm vụ, điểm danh): KHÔNG có tin mới, không đổi hành vi game. Hub, nút HUD và thẻ cùng đọc kho này; ai biết việc mới thì `setBadge`, ai mở
// bảng thì xoá. Id trùng id mục hub (`bag`, `vohon`, `quest`, `welfare`...). Phần dưới là hàm thuần suy ra số chấm để test bằng node.
import { MAX_RINGS, RING_ITEM, SHARD_UNLOCK, ringLimit, starCost } from "../../shared/data.ts";

/** `new` = chấm đỏ (có thứ mới / việc chờ), `up` = mũi tên xanh (nâng được). `n` = số việc, hiện ở huy hiệu nhỏ. */
export type BadgeKind = "new" | "up";
export interface Badge { kind: BadgeKind; n: number }

const store = new Map<string, Badge>();
const subs = new Set<() => void>();

/** Đặt chấm của `id`; `kind` null hoặc `n` ≤ 0 là xoá. Không đổi thì không báo người nghe. */
export function setBadge(id: string, kind: BadgeKind | null, n = 1) {
  const cur = store.get(id), count = Math.max(0, Math.floor(n));
  if (!kind || count <= 0) { if (!cur) return; store.delete(id); }
  else { if (cur && cur.kind === kind && cur.n === count) return; store.set(id, { kind, n: count }); }
  for (const f of [...subs]) f();
}
export const clearBadge = (id: string) => setBadge(id, null);
export const badgeOf = (id: string): Badge | null => store.get(id) ?? null;
export const allBadges = (): ReadonlyMap<string, Badge> => store;
/** Nghe mọi thay đổi; trả hàm bỏ nghe. */
export function onBadges(fn: () => void): () => void { subs.add(fn); return () => { subs.delete(fn); }; }
/** Xoá hết (vào lại phòng / test). Báo người nghe một lần nếu có gì để xoá. */
export function resetBadges() { if (!store.size) return; store.clear(); for (const f of [...subs]) f(); }

// ---- suy ra từ tin có sẵn (hàm thuần) ----

/** Mảnh võ hồn đủ để mở võ hồn chưa có (`SHARD_UNLOCK`) hoặc lên sao (`starCost`): số võ hồn làm được. `have`: võ hồn → số mảnh trong túi. */
export function starReadyCount(owned: { vohon: string; stars: number }[], have: ReadonlyMap<string, number>): number {
  const mine = new Map(owned.map((o) => [o.vohon, o.stars]));
  let n = 0;
  for (const [id, qty] of have) {
    const stars = mine.get(id), need = stars === undefined ? SHARD_UNLOCK : starCost(stars);
    if (need !== null && qty >= need) n++;
  }
  return n;
}

/**
 * Có hồn hoàn trong túi (chưa gắn) mà võ hồn đang ra trận còn ô vòng và niên hạn không vượt giới hạn ô kế tiếp (`ringLimit`): hấp thụ được không
 * quá hạn. Chỉ gợi ý; server vẫn kiểm xác suất, hồi chiêu, điều kiện cấp.
 */
export function ringReady(rings: number, items: { code: string; vohon: number | null; years?: number | null }[]): boolean {
  if (rings >= MAX_RINGS) return false;
  const limit = ringLimit(rings + 1);
  return items.some((it) => it.code === RING_ITEM && it.vohon === null && typeof it.years === "number" && it.years > 0 && it.years <= limit);
}

/** Đếm việc nhiệm vụ cần người chơi động tay: bài mới nhận được (`offer`) và bài hoàn thành chờ trả (`ready`). */
export const questActionable = (statuses: Iterable<string>): number => { let n = 0; for (const s of statuses) if (s === "offer" || s === "ready") n++; return n; };
