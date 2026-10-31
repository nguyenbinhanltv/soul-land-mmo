// Sương mù khám phá + bản đồ nhỏ (GAME_DESIGN.md mục 5.17 và 6 "Đồng bộ xuống client"): nạp / mở ô / gửi / ghi bitset sương mù (tin riêng `fog` / `fogd`, bảng `map_fog`),
// tin `mini` (vị trí cả bản đồ cho radar, tính riêng từng client) và `beastsNear` (ứng viên hồn thú theo lưới không gian `interest`). Hàm nhận phòng (`room: MapRoom`)
// như equip.ts / shop.ts / stats.ts; nguyên văn từ MapRoom, không đổi giao thức / tần suất gửi / ai nhận tin / thứ tự ghi DB qua `room.chain`.
// MapRoom chỉ chuyển tiếp (`tick.ts`, `join.ts`, `persist.ts`, `travel.ts`, `gm.ts` và các miền gọi `room.beastsNear` / `room.fogLoad` / `room.fogFlush` như cũ).

import type { BeastState } from "./schema.ts";
import { FOG, RADAR, TILE, BEAST_HALF } from "../../../shared/data.ts";
import { fogDims as sharedFogDims, fogEmpty, fogReveal, fogValid, fogOn as fogMapOn } from "../../../shared/fog.ts";
import { mapFile } from "../map.ts";
import { store } from "../db.ts";
import * as party from "../party.ts";
import type { MapRoom } from "./MapRoom.ts";
import type { PData } from "./types.ts";

/**
 * Hồn thú có thể nằm trong bán kính r quanh (x, y): ứng viên theo lưới không gian (đã cộng nửa cỡ hồn thú lớn nhất), thay cho quét cả
 * bản đồ. Nơi gọi vẫn tự lọc theo khoảng cách thật.
 */
export function beastsNear(room: MapRoom, x: number, y: number, r: number): [string, BeastState][] {
  const out: [string, BeastState][] = [];
  for (const id of room.interest.beasts.near(x, y, r + BEAST_HALF)) { const b = room.state.beasts.get(id); if (b) out.push([id, b]); }
  return out;
}

// ---------- Sương mù khám phá (R8 #435, GAME_DESIGN.md mục 5.17) ----------
/** Bản đồ này có sương mù (bản đồ trong FOG.open mở sẵn; sân đấu nằm trong đó nên không bao giờ có). */
export function fogOn(room: MapRoom) { return fogMapOn(room.state.mapId); }
export function fogDims(room: MapRoom) { return sharedFogDims(room.map.MW, room.map.MH); }

/**
 * Nạp bitset của người chơi ở bản đồ này (chạy trong chuỗi lưu: không chạy chồng lần ghi) rồi mở ô quanh chỗ đứng và gửi cả bitset. Dòng ghi cho
 * file Tiled khác, sai kích thước hoặc có bit thừa (dữ liệu lạ) thì bỏ, bắt đầu từ trống: tài khoản cũ bắt đầu trống và chỉ mở quanh chỗ đứng.
 */
export function fogLoad(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d || !fogOn(room)) return;
  room.chain(d, async () => {
    const dims = fogDims(room), mapId = room.state.mapId;
    let bits: Uint8Array | null = null;
    try { bits = await store.getFog(d.accountId, mapId, mapFile(mapId)); } catch (e) { console.error(`Không đọc được sương mù của #${d.accountId} (${mapId})`, e); }
    if (room.pdata.get(id) !== d) return;
    if (bits && !fogValid(bits, dims)) { console.warn(`[fog] #${d.accountId} ${mapId}: bỏ bitset sai dạng (${bits.length} byte, cần ${dims.bytes})`); bits = null; }
    d.fog = bits ?? fogEmpty(dims);
    if (!bits) d.fogDirty = true;
    fogMarkOne(room, id, d);
    d.fogAdd.length = 0; // cả bitset gửi ngay dưới đây, không cần gửi lại từng ô
    sendFog(room, id);
  });
}

/** Mở ô quanh vị trí thật của một người (server tự lấy từ state, không nhận gì từ client). */
export function fogMarkOne(room: MapRoom, id: string, d: PData) {
  const p = room.state.players.get(id); if (!p || !d.fog || d.travelling) return;
  const add = fogReveal(d.fog, fogDims(room), p.x / TILE, p.y / TILE);
  if (add.length) { d.fogDirty = true; for (const i of add) d.fogAdd.push(i); }
}
export function fogMark(room: MapRoom) { room.pdata.forEach((d, id) => fogMarkOne(room, id, d)); }

/** Gửi các ô vừa mở (tối đa FOG.maxAdd mỗi tin, dư để nhịp sau) cho từng người, tin `fogd {add}`; số ô thô theo thứ tự hàng. */
export function fogSend(room: MapRoom) {
  room.pdata.forEach((d, id) => {
    if (!d.fog || !d.fogAdd.length) return;
    const c = room.clients.getById(id); if (!c) return;
    c.send("fogd", { add: d.fogAdd.splice(0, FOG.maxAdd) });
  });
}

/** Tin riêng `fog {bits}`: cả bitset ô thô của chính người đó ở bản đồ này (cỡ lưới client tự tính từ cỡ bản đồ). Chưa nạp xong thì chưa gửi. */
export function sendFog(room: MapRoom, id: string) {
  const d = room.pdata.get(id), c = room.clients.getById(id); if (!d?.fog || !c) return;
  d.fogAdd.length = 0;
  c.send("fog", { bits: d.fog });
}

/** Ghi bitset nếu đổi từ lần ghi trước (chỉ gọi trong chuỗi lưu). Lỗi ghi: đánh dấu lại để lần sau ghi tiếp, không làm hỏng lần lưu khác. */
export async function fogFlush(room: MapRoom, d: PData) {
  if (!d.fog || !d.fogDirty) return;
  d.fogDirty = false;
  const mapId = room.state.mapId;
  try { await store.saveFog(d.accountId, mapId, mapFile(mapId), d.fog); }
  catch (e) { d.fogDirty = true; console.error(`Lưu sương mù của #${d.accountId} (${mapId}) thất bại`, e); }
}

/**
 * Bản đồ nhỏ (tin `mini`, mỗi SYNC_VIEW.mini giây): `p` vị trí theo ô `[sid, x, y]` của hồn sư, hồn thú thường từ nghìn năm `b`
 * `[x, y, bậc]` và đồ rơi `d` `[x, y, bậc]` cả bản đồ, vì `players` / `beasts` / `drops` trong state chỉ còn thực thể ở gần. Tinh anh,
 * thú vương luôn có trong state. Hồn sư tính RIÊNG cho từng client (R5, `RADAR.far`): người lạ ngoài `RADAR.far` ô không có trong
 * tin (không lộ vị trí); đồng đội tổ đội cùng kênh và người cùng tông môn luôn có. Hồn thú / đồ rơi dùng chung một bản.
 */
export function sendMini(room: MapRoom) {
  const t = (v: number) => Math.floor(v / TILE), b: number[] = [], d: number[] = [];
  room.state.beasts.forEach((q) => { if (q.tier >= 3 && !q.rank) b.push(t(q.x), t(q.y), q.tier); });
  room.state.drops.forEach((q) => { d.push(t(q.x), t(q.y), q.tier); });
  // Đồng đội: tài khoản -> sid trong phòng; cùng tông: tông -> các sid.
  const sidOf = new Map<number, string>(), clan = new Map<number, string[]>();
  for (const [sid, x] of room.pdata) {
    sidOf.set(x.accountId, sid);
    const tg = room.state.players.get(sid)?.tong ?? 0;
    if (tg > 0) { const l = clan.get(tg); if (l) l.push(sid); else clan.set(tg, [sid]); }
  }
  const far = RADAR.far * TILE, far2 = far * far;
  for (const c of room.clients) {
    const me = room.state.players.get(c.sessionId), mx = room.pdata.get(c.sessionId);
    if (!me || !mx) continue;
    const ids = new Set<string>(), p: (string | number)[] = [];
    const put = (id: string) => { if (ids.has(id)) return; const q = room.state.players.get(id); if (!q) return; ids.add(id); p.push(id, t(q.x), t(q.y)); };
    put(c.sessionId);
    for (const id of room.interest.players.near(me.x, me.y, far)) {
      const q = room.state.players.get(id);
      if (q && (q.x - me.x) ** 2 + (q.y - me.y) ** 2 <= far2) put(id);
    }
    for (const acc of party.partyMembers(mx.accountId)) { const id = sidOf.get(acc); if (id) put(id); }
    if (me.tong > 0) for (const id of clan.get(me.tong) ?? []) put(id);
    c.send("mini", { p, b, d });
  }
}
