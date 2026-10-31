// Miền đi cổng và truyền tống phía phòng bản đồ (GAME_DESIGN.md mục 5.3 "Truyền tống trận", mục 6 đi cổng, bước 11.2): xin đi cổng, niệm, transaction đi cổng (beginTravel), truyền tống trận, bản đồ thế giới, Hồi Thành Phù; tách khỏi MapRoom.ts (#702, bước 10).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / shop.ts / arena.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.chain`.
// MapRoom chỉ chuyển tiếp `travelDeny` / `travel` / `beginTravel` / `waypointTick` / `waypointAction` / `useRecall` / `finishRecall` / `stopCast` (onMessage, tick, gm.ts, useItem gọi như cũ); `freeze`, `portalHint`, đổi kênh (`switchChannel`) còn ở MapRoom.
import type { Client } from "colyseus";
import { store, type Item } from "../db.ts";
import { MAPS, TRAVEL_CAST, BOAT_CAST, WAYPOINT_CAST, WAYPOINT_COOLDOWN_S, waypointFee, TRAVEL_LEAVE_SECS, CHANNEL_CD, TEAM_COMBAT_SECS, itemDef, formatHonTe } from "../../../shared/data.ts";
import { mapHops, mapLinks, allWaypoints, nearestTown, type Portal } from "../map.ts";
import { presenceBackend, bg } from "../presence.ts";
import type { PlayerState } from "./schema.ts";
import { type MapRoom, type PData, type RecallCast } from "./MapRoom.ts";
import { pickChannel } from "./channel.ts";
import { leftRoom } from "./procState.ts";
import { channelLeftKey, strIn } from "./common.ts";

/** Lý do không được đi cổng `name` lúc này (null = được, "" = bỏ qua im lặng). Server tự kiểm tra, client chỉ gửi tên cổng. */
export function travelDeny(room: MapRoom, id: string, name: string): string | null {
  const p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d) return "";
  const portal = room.map.portals.find((q) => q.name === name);
  if (!portal) return "Cổng không tồn tại.";
  if (room.map.portalAt(p.x, p.y) !== portal) return "Hãy đứng trong cổng rồi mới đi qua được.";
  if (p.dead) return "Đã gục ngã, không thể đi qua cổng.";
  if (d.absorbing) return "Đang hấp thụ hồn hoàn, không thể đi qua cổng.";
  const ctl = room.pctl(d); if (ctl.noMove || ctl.wander) return `Đang bị ${room.ccName(d, true)}: không thể đi qua cổng.`; // #116
  return null;
}

/** Xin đi qua cổng: kiểm tra rồi niệm TRAVEL_CAST giây (bến thuyền BĐ6d: BOAT_CAST; bị đánh hoặc rời cổng thì hủy), xong thì beginTravel. */
export function travel(room: MapRoom, c: Client, name: string) {
  const id = c.sessionId, d = room.pdata.get(id);
  if (!d || d.travelling || d.travelCast) return;
  const why = travelDeny(room, id, name);
  if (why !== null) { if (why) room.log(id, why, "#ffb35c"); return; }
  const portal = room.map.portals.find((q) => q.name === name)!;
  d.travelCast = { portal, t: portal.boat ? BOAT_CAST : TRAVEL_CAST };
  room.log(id, portal.boat ? `Lên thuyền đi ${MAPS[portal.to].name} (${BOAT_CAST} giây)…` : `Đang đi tới ${MAPS[portal.to].name}…`);
}

/**
 * Bước 2–4 của mục 6: đánh dấu đang chuyển bản đồ, nối transaction đi cổng vào chuỗi lưu (chờ mọi lần ghi trước xong rồi
 * mới chụp dữ liệu), commit xong mới gửi riêng `travel {mapId, roomId}`. Lỗi thì bỏ cờ, người chơi ở lại.
 * `to`: phòng (kênh) đích khi đổi kênh; đi cổng thì chọn lúc commit (pickChannel: kênh có đồng đội, không thì ít người nhất
 * còn chỗ; null = mọi kênh đầy, client joinOrCreate để mở kênh mới). `undo`: hoàn tác phần đã trừ trước khi đi (phí truyền tống,
 * Hồi Thành Phù) khi transaction lỗi.
 */
export function beginTravel(room: MapRoom, id: string, portal: Portal, to?: { roomId: string; ch: number }, undo?: () => void) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!, from = room.state.mapId;
  room.endAva(id, "");
  room.freeze(id);
  room.portalHint(id, p, d);
  let dest: { roomId: string; ch: number } | null = null;
  room.chain(d, async () => {
    // Từ bước 3.1 transaction đi cổng ghi luôn túi đồ và Hồn Tệ chưa lưu (mục 6, bước 3).
    await room.flushAuto(d); // giờ treo tự săn (Auto 1): ghi trước, transaction đi cổng là lần ghi cuối của phòng này
    await room.fogFlush(d); // sương mù khám phá (R8): ghi bitset bản đồ này trước khi rời
    const list = room.unsaved(id), bag = room.unsavedBag(d);
    try {
      await store.saveTravel(d.accountId, list, from, portal.to, portal.ax, portal.ay, bag);
      if (d.testTravelLost) { d.testTravelLost = false; throw new Error("hook travellost: giả lập mất phản hồi sau COMMIT"); }
    } catch (e) {
      // #165: lỗi có thể tới sau khi COMMIT đã xong (mất phản hồi). DB đã ở bản đồ đích thì coi như đã đi (không hoàn phí / phù): ở lại
      // thì mọi lần lưu sau của phòng này bị lớp chặn WHERE map_id bỏ. Đổi kênh (cùng bản đồ) không đổi map_id nên xử như lỗi thường.
      if (portal.to !== from && (await store.getLocation(d.accountId).catch(() => null))?.mapId === portal.to) {
        console.error(`Đi cổng của tài khoản #${d.accountId} báo lỗi nhưng DB đã ở ${portal.to}: coi như đã đi.`, e);
        d.travelled = true;
        return;
      }
      // `undo` (11.2): trả lại phí / Hồi Thành Phù ngay trong chuỗi, trước lần ghi kế tiếp (kể cả lần ghi cuối của onLeave).
      for (const v of list) if (v.rowId !== d.ch.rowId) d.dirty.add(v.rowId);
      if (bag) d.bagDirty = true;
      undo?.(); throw e;
    }
    d.travelled = true;
    // Kênh đích chọn ngay trong chuỗi, trước khi phiên này nhả tài khoản (onLeave nối sau): client, kể cả vừa mất kết nối rồi vào
    // lại, chỉ vào được kênh này CHANNEL_CD giây khi nó còn mở, còn chỗ (leftRoom cờ `travel`; mục 6: client không chọn kênh đích, #164).
    dest = to ?? (await pickChannel(d.accountId, portal.to).catch(() => null));
    // Ghi cả vào presence (có TTL, chờ xong trước khi client nhận `travel`): phòng ở tiến trình khác cũng thấy khóa (#819).
    if (dest) {
      const lock = { mapId: portal.to, roomId: dest.roomId, ch: dest.ch, until: Date.now() + CHANNEL_CD * 1000, travel: true };
      leftRoom.set(d.accountId, lock);
      await presenceBackend.putJson(channelLeftKey(d.accountId), lock, CHANNEL_CD * 1000).catch((e) => console.error("presence travel lock", e));
    } else {
      leftRoom.delete(d.accountId);
      await presenceBackend.delete(channelLeftKey(d.accountId)).catch((e) => console.error("presence travel lock", e));
    }
  }).then(() => {
    const c = room.clients.getById(id); if (!c) return; // client đã rời: onLeave (đang chờ trong chuỗi) xét d.travelled
    if (!d.travelled) {
      d.travelling = false;
      return room.log(id, "Không chuyển được bản đồ, thử lại.", "#ff8a8a");
    }
    c.send("travel", { mapId: portal.to, roomId: dest?.roomId ?? null });
    // Client phải tự rời phòng cũ và vào phòng mới; quá TRAVEL_LEAVE_SECS giây thì server ngắt kết nối.
    room.clock.setTimeout(() => { if (room.clients.getById(id)) c.leave(4003); }, TRAVEL_LEAVE_SECS * 1000);
  });
}

// ---------- Truyền tống trận, bản đồ thế giới, Hồi Thành Phù (mục 5.3 "Truyền tống trận", bước 11.2) ----------
/**
 * Mỗi tick: báo client khi bước lên / rời một truyền tống trận (tin riêng `wp {k: "here"}`: hộp "Bản đồ thế giới [F]"); bước lên trận
 * chưa mở thì mở khóa ngay (RAM), ghi bảng `waypoints` qua chuỗi lưu và báo `wp {k: "unlock"}` (client hiện thông báo).
 */
export function waypointTick(room: MapRoom, id: string, p: PlayerState, d: PData) {
  const w = room.map.waypointAt(p.x, p.y), key = w?.key ?? "", c = room.clients.getById(id);
  if (key !== d.wpKey) { d.wpKey = key; c?.send("wp", { k: "here", key, label: w?.label ?? "" }); }
  if (!w || d.wps.has(w.key)) return;
  d.wps.add(w.key);
  room.chain(d, () => store.unlockWaypoint(d.accountId, w.key));
  // Không gửi `log` (dòng chữ do client tự thêm khi nhận tin này): bước lên trận xảy ra bất kỳ lúc nào, kể cả lúc hồi sinh ở trại.
  c?.send("wp", { k: "unlock", key: w.key, label: w.label, map: MAPS[w.map].name });
  room.broadcast("fx", { k: "wpopen", x: w.cx, y: w.cy });
}

/** Presence (có TTL = thời gian hồi): giờ hết hồi (ms) dịch chuyển từ bất kỳ đâu của tài khoản; theo tài khoản nên không mất khi đổi bản đồ / kênh / vào lại. */
export const wpCooldownKey = (accountId: number) => `wp-cd:${accountId}`;
export async function remoteCdLeft(accountId: number) {
  const until = await presenceBackend.getJson<number>(wpCooldownKey(accountId)).catch(() => null);
  return typeof until === "number" ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0;
}

/** `wp {op}`: `list` gửi bản đồ thế giới, `go {key}` niệm truyền tống tới trận `key`, `cancel` thôi niệm. */
export function waypointAction(room: MapRoom, id: string, op: unknown, key: unknown) {
  if (op === "list") return sendWorld(room, id);
  if (op === "go") return startWaypoint(room, id, strIn(key));
  if (op === "cancel" && room.pdata.get(id)?.travelCast?.wp) return stopCast(room, id, "Đã thôi truyền tống.");
}

/**
 * Tin riêng `world` (bảng bản đồ thế giới): bản đồ đang ở, trận đang đứng (`cur`, "" = không đứng trên trận nào: chỉ xem), Hồn Tệ,
 * các cặp bản đồ nối bằng cổng (`links`), mọi truyền tống trận theo thứ tự MAPS với tên, đã mở chưa, phí từ bản đồ này (null = không tới được bằng cổng).
 */
export async function sendWorld(room: MapRoom, id: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id), c = room.clients.getById(id); if (!p || !d || !c) return;
  const cd = await remoteCdLeft(d.accountId); // giây còn hồi của dịch chuyển từ bất kỳ đâu (0 = dùng được); chỉ thêm trường, client cũ bỏ qua
  if (!room.state.players.get(id) || !room.clients.getById(id)) return;
  const hops = mapHops(room.state.mapId), here = room.map.waypointAt(p.x, p.y);
  c.send("world", { map: room.state.mapId, cur: here?.key ?? "", honTe: d.honTe, links: mapLinks(), remoteCd: cd, remoteCdMax: WAYPOINT_COOLDOWN_S,
    list: allWaypoints().map((w) => ({ key: w.key, map: w.map, label: w.label, open: d.wps.has(w.key), fee: hops[w.map] === undefined ? null : waypointFee(hops[w.map]),
      feeRemote: hops[w.map] === undefined ? null : waypointFee(hops[w.map], true) })) });
}

/** Lý do không niệm truyền tống / Hồi Thành Phù được lúc này (null = được, "" = bỏ qua im lặng). Kiểm lại lúc niệm xong. Bản đồ `kind: "boss"` (Lõi Tinh Đấu) cấm cả hai (cùng cơ chế niệm), dù đứng trên trận hay từ xa. */
export function recallDeny(room: MapRoom, id: string): string | null {
  const p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d || d.travelling) return "";
  if (d.travelCast) return d.travelCast.wp ? "Đang niệm truyền tống." : "Đang đi qua cổng.";
  if (p.dead) return "Đã gục ngã, không truyền tống được.";
  if (MAPS[room.state.mapId].kind === "boss") return `${MAPS[room.state.mapId].name} cấm truyền tống: muốn rời đi hãy tới cổng.`; // chủ repo 2026-10-31: cấm Ở TRONG và RỜI KHỎI; tới đây (đích) vẫn theo luật thường
  if (d.absorbing) return "Đang hấp thụ hồn hoàn, không truyền tống được.";
  const ctl = room.pctl(d); if (ctl.noMove || ctl.wander) return `Đang bị ${room.ccName(d, true)}: không truyền tống được.`; // #116
  if (d.fight < TEAM_COMBAT_SECS) return `Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới truyền tống được.`;
  return null;
}

/** Bắt đầu niệm WAYPOINT_CAST giây tới `dest` (cổng ẩn: bản đồ đích và tọa độ); client nhận `recall {on, label, secs}` để vẽ thanh niệm. */
export function beginRecall(room: MapRoom, id: string, dest: Portal, wp: Omit<RecallCast, "x0" | "y0" | "dur">) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!;
  d.travelCast = { portal: dest, t: WAYPOINT_CAST, wp: { ...wp, x0: p.x, y0: p.y, dur: WAYPOINT_CAST } };
  room.clients.getById(id)?.send("recall", { on: true, label: wp.label, secs: WAYPOINT_CAST, item: !!wp.itemId });
  room.broadcast("fx", { k: "wpcast", id, x: p.x, y: p.y, t: WAYPOINT_CAST });
}

/** Thôi niệm (đi cổng hoặc truyền tống) và báo lý do. */
export function stopCast(room: MapRoom, id: string, why: string) {
  const d = room.pdata.get(id); if (!d?.travelCast) return;
  const wp = !!d.travelCast.wp;
  d.travelCast = null;
  room.log(id, why, "#ffb35c");
  if (wp) { room.clients.getById(id)?.send("recall", { on: false }); room.broadcast("fx", { k: "wpcast", id, t: 0 }); }
}

/**
 * Xin truyền tống tới trận `key`: trận đích đã mở khóa, đủ Hồn Tệ, ngoài giao chiến. Đứng trên một trận khác thì phí thường, không hồi;
 * KHÔNG đứng trên trận (từ bất kỳ đâu): thêm phụ phí WAYPOINT_FEE.remote, hồi WAYPOINT_COOLDOWN_S giây, và không dùng khi đang tự săn /
 * ủy thác treo hay trong sân đấu / Bí Cảnh. Client chỉ gửi `key`; mọi điều kiện kiểm ở đây, kiểm lại lúc niệm xong (finishRecall).
 */
export function startWaypoint(room: MapRoom, id: string, key: string) {
  const why = recallDeny(room, id);
  if (why !== null) { if (why) room.log(id, why, "#ffb35c"); return; }
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!, warn = (t: string) => room.log(id, t, "#ffb35c");
  const here = room.map.waypointAt(p.x, p.y), remote = !here;
  if (remote) {
    if (MAPS[room.state.mapId].kind === "arena") return warn("Trong sân đấu không dịch chuyển được."); // phòng thủ thêm: ArenaRoom / BiCanhRoom đã chặn tin `wp`
    if (d.auto) return warn("Đang tự săn: hãy tắt tự săn rồi mới dịch chuyển được.");
  }
  const to = allWaypoints().find((w) => w.key === key);
  if (!to) return warn("Truyền tống trận không tồn tại.");
  if (!d.wps.has(to.key)) return warn(`Chưa mở khóa truyền tống trận ${to.label}: hãy tới đó bước lên trận một lần.`);
  if (to.key === here?.key) return warn("Đang đứng ở chính trận này.");
  const hops = mapHops(room.state.mapId)[to.map];
  if (hops === undefined) return warn(`Không tới được ${MAPS[to.map].name} từ đây.`);
  const fee = waypointFee(hops, remote);
  if (d.honTe < fee) return warn(`Không đủ Hồn Tệ: truyền tống tới ${to.label} cần ${formatHonTe(fee)}.`);
  const begin = () => {
    beginRecall(room, id, recallDest(room, to.map, to.cx, to.cy), { label: `${to.label} (${MAPS[to.map].name})`, fee, remote });
    room.log(id, `Đang niệm truyền tống${remote ? " từ xa" : ""} tới ${to.label} (${WAYPOINT_CAST} giây, ${formatHonTe(fee)})…`, "#8fe0ff");
  };
  if (!remote) return begin();
  // Thời gian hồi đọc từ presence (bất đồng bộ): sau khi chờ, kiểm lại toàn bộ (người chơi có thể đã đổi trạng thái / đã niệm bản khác).
  void remoteCdLeft(d.accountId).then((left) => {
    if (room.pdata.get(id) !== d) return;
    if (left > 0) return warn(`Dịch chuyển từ xa đang hồi: còn ${left} giây (đứng trên truyền tống trận thì không bị hồi).`);
    const again = recallDeny(room, id);
    if (again !== null) { if (again) warn(again); return; }
    const p2 = room.state.players.get(id), here2 = p2 && room.map.waypointAt(p2.x, p2.y);
    if (!p2 || here2 || d.honTe < fee || d.auto) return;
    begin();
  });
}

/** Dùng Hồi Thành Phù `it`: niệm WAYPOINT_CAST giây về thành gần nhất (nearestTown), cùng luật cấm / hủy như truyền tống trận. */
export function useRecall(room: MapRoom, id: string, it: Item) {
  const why = recallDeny(room, id);
  if (why !== null) { if (why) room.log(id, why, "#ffb35c"); return; }
  const town = nearestTown(room.state.mapId);
  if (!town) return room.log(id, "Không có thành nào để về.", "#ffb35c");
  beginRecall(room, id, recallDest(room, town.mapId, town.x, town.y), { label: MAPS[town.mapId].name, fee: 0, itemId: it.id });
  room.log(id, `Đang niệm Hồi Thành Phù về ${MAPS[town.mapId].name} (${WAYPOINT_CAST} giây)…`, itemDef(it.code)?.col);
}

/** Cổng ẩn tới (x, y) ở bản đồ `to` (đi bằng beginTravel như hook `warp`). */
export function recallDest(room: MapRoom, to: string, x: number, y: number): Portal {
  return { name: "", to, arrive: "", ax: x, ay: y, level: null, boat: false, x: 0, y: 0, w: 0, h: 0 };
}

/**
 * Niệm xong: kiểm lại (gục, hấp thụ, giao chiến, còn đủ Hồn Tệ / còn phù) rồi trừ phí hoặc một Hồi Thành Phù và dịch chuyển. Cùng
 * bản đồ thì đặt thẳng vị trí (không đổi phòng) và lưu túi qua chuỗi lưu; bản đồ khác thì đi đúng transaction đi cổng (beginTravel,
 * an toàn với tổ đội và lần ghi cuối), lỗi thì trả lại phí / phù.
 */
export function finishRecall(room: MapRoom, id: string, dest: Portal, wp: RecallCast) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!;
  room.clients.getById(id)?.send("recall", { on: false });
  const why = recallDeny(room, id);
  if (why !== null) { if (why) room.log(id, why, "#ffb35c"); return; }
  const it = wp.itemId ? d.bag.find((i) => i.id === wp.itemId && i.vohonId === null) : undefined;
  if (wp.itemId && !it) return room.log(id, "Hồi Thành Phù không còn trong túi đồ.", "#ffb35c");
  if (d.honTe < wp.fee) return room.log(id, `Không đủ Hồn Tệ: cần ${formatHonTe(wp.fee)}.`, "#ffb35c");
  if (wp.remote) { // hồi tính từ lúc dịch chuyển xong; hủy niệm không tính. Lưu lỗi (undo bên dưới) thì xóa hồi.
    if (d.auto) return room.log(id, "Đang tự săn: hãy tắt tự săn rồi mới dịch chuyển được.", "#ffb35c");
    bg(presenceBackend.putJson(wpCooldownKey(d.accountId), Date.now() + WAYPOINT_COOLDOWN_S * 1000, WAYPOINT_COOLDOWN_S * 1000), "presence wp-cd");
  }
  d.honTe -= wp.fee; d.bagDirty = true;
  const code = it?.code;
  if (it) room.takeItem(d, it, 1);
  room.sendBag(id);
  room.broadcast("fx", { k: "wpgo", x: p.x, y: p.y });
  const done = `Truyền tống tới ${wp.label}${wp.fee ? ` (−${formatHonTe(wp.fee)})` : ""}.`;
  room.log(id, done, "#8fe0ff");
  if (dest.to === room.state.mapId) {
    // Cùng bản đồ: như hook `goto`, tăng `seq` để client đang dự đoán chuyển động đặt thẳng vị trí mới (mục 6).
    p.x = dest.ax; p.y = dest.ay; d.input = { x: 0, y: 0 }; p.moving = false; p.seq = (p.seq + 1) >>> 0; p.seqT = 0;
    room.bdata.forEach((bd) => { if (bd.target === id) bd.target = null; });
    room.broadcast("fx", { k: "wpgo", x: p.x, y: p.y });
    room.saveTrade(id, d);
    return;
  }
  beginTravel(room, id, dest, undefined, () => {
    room.addCoin(d, wp.fee);
    if (wp.remote) bg(presenceBackend.delete(wpCooldownKey(d.accountId)), "presence wp-cd");
    if (code) room.addItem(d, code, 1);
    room.sendBag(id);
  });
}
