// Sổ tay hồn thú (docs/design/hon-thu-boss.md "Sổ tay hồn thú", #1720, Part of #1714): server ghi loài hồn thú thường người chơi đã gặp (lại gần trong
// BEAST_REVEAL.r) và đã hạ (kills), lưu bảng `bestiary`; gửi riêng cho chính chủ bằng tin `dex {set, full?}` (không vào state chung).
// Client chỉ hiển thị và gửi `dex {op:"get"}`; không có đường nào để client khai "đã gặp". Tinh anh / thú vương / boss có tên riêng, luôn hiện: không vào sổ.
import { BEASTS, BEAST_REVEAL, DEX } from "../../../shared/data.ts";
import { store } from "../db.ts";
import { type MapRoom } from "./MapRoom.ts";
import type { PData } from "./types.ts";
import type { PlayerState } from "./schema.ts";

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

/** Mỗi nhịp tick của người chơi: cứ DEX.scanSecs giây xét hồn thú thường trong BEAST_REVEAL.r quanh người đó, loài chưa có thì ghi "đã gặp". */
export function dexScan(room: MapRoom, id: string, p: PlayerState, d: PData, dt: number) {
  if ((d.dexT -= dt) > 0) return;
  d.dexT = DEX.scanSecs;
  if (!d.dexLoaded || p.dead) return;
  const add: Record<string, number> = {};
  for (const [, b] of room.beastsNear(p.x, p.y, BEAST_REVEAL.r)) {
    const sp = !b.rank && !b.egg && !b.dive && b.hp > 0 ? BEASTS[b.species]?.id : undefined;
    if (sp && !d.dex.has(sp) && !(sp in add)) add[sp] = 0;
  }
  const names = Object.keys(add); if (!names.length) return;
  for (const sp of names) { d.dex.set(sp, 0); room.chain(d, () => store.dexSee(d.accountId, sp).catch((e) => console.error(`Không ghi được sổ tay (gặp ${sp}) tài khoản #${d.accountId}`, e))); }
  send(room, id, add);
}

/** Người chơi `id` vừa hạ hồn thú thường loài `species` (chỉ số BEASTS): tăng số lần hạ. Ghi qua chuỗi lưu; lỗi DB chỉ ghi log. */
export function dexKilled(room: MapRoom, id: string, species: number) {
  const d = room.pdata.get(id), sp = BEASTS[species]?.id; if (!d || !sp) return;
  const n = (d.dex.get(sp) ?? 0) + 1;
  d.dex.set(sp, n);
  room.chain(d, () => store.dexKill(d.accountId, sp).catch((e) => console.error(`Không ghi được sổ tay (hạ ${sp}) tài khoản #${d.accountId}`, e)));
  send(room, id, { [sp]: n });
}
