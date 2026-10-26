// Lưu người chơi (GAME_DESIGN.md mục 6 "Lưu của mỗi người chơi chạy nối tiếp"): chuỗi lưu `chain` / `chainLatest`, lưu định kỳ `save`, chụp tiến độ chưa lưu `unsaved`, ghi DB `write` / `writeNow`; tách khỏi MapRoom.ts (#702, bước 13).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / shop.ts / team.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB / mọi `await`.
// MapRoom chỉ chuyển tiếp (mọi miền, `autoHunt.ts`, `gm.ts` gọi `room.chain` / `room.save` như cũ; `ArenaRoom` vẫn override `write`).

import { store } from "../db.ts";
import { MAPS } from "../../../shared/data.ts";
import { ItemLockBusy, withItemLocks } from "../itemLock.ts";
import { presenceBackend } from "../presence.ts";
import { saveStats, type MapRoom, type PData } from "./MapRoom.ts";

/** Lần ghi cuối chờ khóa món tối đa FINAL_LOCK_TRIES × FINAL_LOCK_WAIT_MS (#559). */
const FINAL_LOCK_TRIES = 10, FINAL_LOCK_WAIT_MS = 300;

/**
 * Nối một lần ghi DB vào chuỗi lưu của người chơi (mục 6 "Lưu của mỗi người chơi chạy nối tiếp"). Lỗi được ghi log và
 * không làm gãy chuỗi; promise trả về luôn resolve.
 */
export function chain(room: MapRoom, d: PData, fn: () => unknown) {
  // Sau `/gm preset` (gmReset) mọi lần ghi xếp thêm bị bỏ: chụp túi / Hồn Tệ cũ trong RAM sẽ đè mức vừa áp (#518).
  d.saving = d.saving.then(() => (d.gmReset ? undefined : fn())).then(() => {}, (e) => { saveStats.failed++; console.error(`Lưu dữ liệu tài khoản #${d.accountId} thất bại`, e); });
  return d.saving;
}

/**
 * Như chain, nhưng gộp theo khóa `key`: đã có một lần ghi `key` đang chờ trong chuỗi thì chỉ thay hàm của nó bằng `fn` mới nhất,
 * không nối thêm. Message gửi dồn (xếp ô hồn kỹ, đổi võ hồn ra trận qua đội hình) không làm chuỗi lưu và số lần ghi DB tăng theo
 * số message (#164).
 */
export function chainLatest(room: MapRoom, d: PData, key: string, fn: () => unknown) {
  const queued = d.latest.has(key);
  d.latest.set(key, fn);
  if (!queued) room.chain(d, () => { const f = d.latest.get(key)!; d.latest.delete(key); return f(); });
}

/** Lưu định kỳ / sau sự kiện quan trọng: xếp vào chuỗi lưu, chụp dữ liệu lúc tới lượt. */
export function save(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d) return Promise.resolve();
  return room.chain(d, () => room.write(id));
}

/** Chụp tiến độ chưa lưu: võ hồn ra trận và các võ hồn khác vừa nhận kinh nghiệm chia cho đội (xóa đánh dấu `dirty`). */
export function unsaved(room: MapRoom, id: string) {
  const d = room.pdata.get(id)!;
  room.syncCh(id);
  d.dirty.delete(d.ch.rowId);
  const list = [d.ch, ...d.owned.filter((v) => d.dirty.has(v.rowId))].map((v) => ({ ...v, rings: [...v.rings] }));
  d.dirty.clear();
  return list;
}


/**
 * Ghi tiến độ võ hồn, vị trí và túi đồ (chỉ gọi trong chuỗi lưu). Vị trí có lớp chặn: chỉ ghi khi DB vẫn ở bản đồ của phòng này.
 * Ghi lỗi thì đánh dấu lại võ hồn không ra trận / túi đồ để lần sau ghi tiếp.
 * `final`: lần ghi cuối khi rời phòng (onLeave / onDispose, không qua cổng / đổi kênh). Bản đồ có MapDef.exit (Lõi Tinh Đấu, BĐ6e):
 * "đăng xuất" ở đây thì ghi như đi cổng (một transaction saveTravel) về điểm `arrive` của cổng tới bản đồ `exit`, lần sau vào ở đó.
 */
/** Trả true khi dữ liệu đã được ghi (tông vụ #197 chỉ cộng điểm sau lần ghi bài đã trả); lỗi DB thì ném. */
export async function write(room: MapRoom, id: string, final = false): Promise<boolean> {
  const d = room.pdata.get(id), ids = d ? [...d.lockIds] : [];
  if (!d || !ids.length) return room.writeNow(id, final);
  d.lockIds.clear();
  // Khóa Redis theo món (#559): không lấy được thì ném lỗi, chuỗi lưu ghi log; túi vẫn đang bẩn nên lần ghi sau thử lại (món chưa chụp, chưa mất).
  // Lần ghi cuối (`final`: rời phòng / đóng phòng) không có lần sau: chờ khóa có hạn, rồi vẫn ghi không khóa (ghi cảnh báo) để không mất tiến độ;
  // ghi chồng vẫn bị chặn bởi khóa dòng PostgreSQL, `ver` và `Bag.lock`.
  const lockedWrite = () => withItemLocks(presenceBackend, ids, async (g) => { if (!(await g.held())) throw new ItemLockBusy(ids[0]); return room.writeNow(id, final); });
  if (final) {
    for (let k = 0; k < FINAL_LOCK_TRIES; k++) {
      let ran = false;
      try { return await withItemLocks(presenceBackend, ids, async (g) => { if (!(await g.held())) throw new ItemLockBusy(ids[0]); ran = true; return room.writeNow(id, final); }); }
      catch (e) { if (ran) throw e; if (!(e instanceof ItemLockBusy)) break; await new Promise((r) => setTimeout(r, FINAL_LOCK_WAIT_MS)); }
    }
    console.error(`Lần ghi cuối tài khoản #${d.accountId}: không lấy được khóa món, ghi không khóa để không mất tiến độ.`);
    return room.writeNow(id, final);
  }
  try { return await lockedWrite(); }
  catch (e) { for (const i of ids) d.lockIds.add(i); throw e; }
}
export async function writeNow(room: MapRoom, id: string, final = false): Promise<boolean> {
  // Đã đi cổng / đổi kênh (transaction đi cổng là lần ghi cuối của phòng này): không ghi gì nữa.
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelled || d.gmReset) return false;
  await room.flushAuto(d);
  await room.fogFlush(d);
  const exit = final ? MAPS[room.state.mapId].exit : undefined, out = exit ? room.map.portals.find((q) => q.to === exit) : undefined;
  if (out) {
    const list = room.unsaved(id), bag = room.unsavedBag(d);
    try { await store.saveTravel(d.accountId, list, room.state.mapId, out.to, out.ax, out.ay, bag); }
    catch (e) { for (const v of list) if (v.rowId !== d.ch.rowId) d.dirty.add(v.rowId); if (bag) d.bagDirty = true; throw e; }
    d.tongPend.splice(0, bag?.tongPts?.length ?? 0);
    return true;
  }
  // Vị trí, võ hồn và túi trong một transaction có lớp chặn WHERE map_id (#165): DB đã ở bản đồ khác thì không ghi gì, kể cả túi.
  const t0 = room.perfOn ? performance.now() : 0;
  const list = room.unsaved(id), x = p.x, y = p.y, bag = room.unsavedBag(d);
  const t1 = room.perfOn ? performance.now() : 0;
  let saved: boolean;
  try {
    const pr = store.saveProgress(d.accountId, list, room.state.mapId, x, y, d.testLocFile, bag);
    if (room.perfOn) { const f = room.perfSave; f.n++; f.snap += t1 - t0; f.store += performance.now() - t1; f.items += bag?.items.length ?? 0; }
    saved = await pr;
  }
  catch (e) { for (const v of list) if (v.rowId !== d.ch.rowId) d.dirty.add(v.rowId); if (bag) d.bagDirty = true; throw e; }
  if (saved) { d.tongPend.splice(0, bag?.tongPts?.length ?? 0); return true; }
  // Lưới an toàn: beginTravel đã đọc lại DB khi đi cổng báo lỗi nên đường thường không tới đây. Nếu tới thì ngắt client để vào lại đúng
  // bản đồ trong DB (/api/me), thay vì ở lại phòng mà mọi lần lưu sau đều bị bỏ.
  console.error(`Bỏ lần lưu tài khoản #${d.accountId}: DB không còn ở bản đồ ${room.state.mapId}; ngắt kết nối để vào lại.`);
  room.log(id, "Dữ liệu nhân vật đã ở bản đồ khác: hãy vào lại game.", "#ff8a8a");
  room.clients.getById(id)?.leave(4003);
  return false;
}
