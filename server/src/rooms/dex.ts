// Sổ tay hồn thú (docs/design/hon-thu-boss.md "Sổ tay hồn thú", #1720, Part of #1714): server ghi loài hồn thú thường người chơi đã HẠ (kills; #1762: lại gần
// không còn ghi "đã gặp"), lưu bảng `bestiary`; gửi riêng cho chính chủ bằng tin `dex {set, full?}` (không vào state chung).
// Client chỉ hiển thị và gửi `dex {op:"get"}`; không có đường nào để client khai "đã hạ". Tinh anh / thú vương / boss có tên riêng, luôn hiện: không vào sổ.
import { BEASTS } from "../../../shared/data.ts";
import { store } from "../db.ts";
import { type MapRoom } from "./MapRoom.ts";
import type { PData } from "./types.ts";

const send = (room: MapRoom, id: string, set: Record<string, number>, full = false) => room.clients.getById(id)?.send("dex", { set, ...(full ? { full: true } : {}) });

/** Nạp sổ tay từ DB lúc vào phòng (gộp với phần vừa ghi trong RAM, lấy số lớn hơn) rồi gửi đủ cho chủ. Lỗi DB chỉ ghi log (sổ tay trống tới lần vào sau). */
export async function dexLoad(room: MapRoom, id: string, d: PData) {
  try {
    const row = await store.dexGet(d.accountId);
    for (const [k, n] of Object.entries(row)) d.dex.set(k, Math.max(d.dex.get(k) ?? 0, n));
    d.dexLoaded = true;
    send(room, id, Object.fromEntries(d.dex), true);
  } catch (e) { console.error(`Không đọc được sổ tay hồn thú tài khoản #${d.accountId}`, e); }
}

/** Tin client `dex {op:"get"}`: gửi lại đủ sổ tay (nhịp `ask`, gộp). */
export function dexAction(room: MapRoom, id: string, m: { op?: unknown } | null | undefined) {
  const d = room.pdata.get(id); if (!d || d.travelling || m?.op !== "get") return;
  room.ask(id, "dex", () => { if (d.dexLoaded) send(room, id, Object.fromEntries(d.dex), true); });
}

/** Người chơi `id` vừa hạ hồn thú thường loài `species` (chỉ số BEASTS): tăng số lần hạ. Ghi qua chuỗi lưu; lỗi DB chỉ ghi log. */
export function dexKilled(room: MapRoom, id: string, species: number) {
  const d = room.pdata.get(id), sp = BEASTS[species]?.id; if (!d || !sp) return;
  const n = (d.dex.get(sp) ?? 0) + 1;
  d.dex.set(sp, n);
  room.chain(d, () => store.dexKill(d.accountId, sp).catch((e) => console.error(`Không ghi được sổ tay (hạ ${sp}) tài khoản #${d.accountId}`, e)));
  send(room, id, { [sp]: n });
}
