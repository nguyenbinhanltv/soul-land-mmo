import { randomUUID } from "node:crypto";
import type { PresenceBackend } from "./presence.ts";

/** Hạn khóa mỗi món (ms): ngắn, đủ cho một transaction; hết hạn mà chưa nhả thì `held()` báo mất khóa và lệnh hủy (fencing). */
export const ITEM_LOCK_TTL_MS = 8_000;
export const itemLockKey = (itemId: string) => `lock:item:${itemId}`;

/** Khóa món đang có người giữ (tiến trình / phiên khác đang thao tác): từ chối "đang xử lý", như claimBusy. */
export class ItemLockBusy extends Error { constructor(readonly itemId: string) { super(`Món ${itemId} đang được xử lý ở nơi khác.`); } }

/** Trạng thái khóa trong lúc chạy: `fence[id]` là fencing token của từng món; `held()` kiểm mọi khóa còn của mình (gọi ngay trước commit). */
export interface ItemLockGrant { fence: Record<string, number>; held(): Promise<boolean>; }

/**
 * Giữ khóa Redis `lock:item:<id>` của các món `ids` (khóa theo id tăng dần, bỏ trùng) trong lúc chạy `run`, nhả sau. Chỉ có tác dụng khi
 * presence là Redis (nhiều tiến trình, #120); chế độ RAM chạy thẳng `run` (một tiến trình, chuỗi lưu + khóa dòng PostgreSQL là đủ).
 * Khóa đang có người giữ thì ném ItemLockBusy (không chờ); Redis lỗi thì ném lỗi gốc (fail-closed: không có khóa thì không đụng món).
 */
export async function withItemLocks<T>(backend: PresenceBackend, ids: readonly string[], run: (grant: ItemLockGrant) => Promise<T>, ttlMs = ITEM_LOCK_TTL_MS): Promise<T> {
  const sorted = [...new Set(ids)].sort();
  if (backend.mode !== "redis" || !sorted.length) return run({ fence: {}, held: async () => true });
  const owner = `${backend.workerId}:${randomUUID()}`, fence: Record<string, number> = {}, taken: string[] = [];
  const release = () => Promise.allSettled(taken.map((id) => backend.releaseLease(itemLockKey(id), owner)));
  try {
    for (const id of sorted) {
      const token = await backend.acquireFenced(itemLockKey(id), owner, ttlMs);
      if (!token) throw new ItemLockBusy(id);
      fence[id] = token; taken.push(id);
    }
    const held = async () => (await Promise.all(taken.map((id) => backend.renewLease(itemLockKey(id), owner, ttlMs)))).every(Boolean);
    return await run({ fence, held });
  } finally { await release(); }
}
