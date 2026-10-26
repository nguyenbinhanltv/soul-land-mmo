// Miền xã hội: chat, bạn bè / chặn, tổ đội (GAME_DESIGN.md mục 4 "Lệnh chat", 5.9), tách khỏi MapRoom.ts (#702, bước 4).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / bones.ts; nguyên văn từ MapRoom, không đổi hành vi. MapRoom chỉ chuyển tiếp (đăng ký `onMessage` giữ
// nguyên ở đó; ArenaRoom vẫn override `partyAction`). Bước 24: phần phát / nhận presence (`friendAfter` / `friendPublish` / `friendNote` / `sendFriends`, `partyPublish` / `partyNote` / `sendParty`, `rallyAction` / `rallyNote`) cũng ở đây, MapRoom chỉ chuyển tiếp.
import { WORLD_CHAT, MAPS, RALLY, TILE } from "../../../shared/data.ts";
import { store } from "../db.ts";
import { chatCheck, chatText, worldWait, worldMark, rallyCheck, inviteCheck, friendCheck, friendNoteOk } from "../ratelimit.ts";
import * as party from "../party.ts";
import { rallyPoint, type RallyMsg } from "../../../shared/rally.ts";
import { friends, FRIEND_TOPIC, type FriendNote, type FriendResult } from "../friends.ts";
import { presenceBackend } from "../presence.ts";
import { arenaQueueLocked, arenaReadActive } from "./arenaQueue.ts";
import { CHAT_TOPIC, FRIEND_COL, accOf, strIn, worldChatKey, type ChatRoute, type MapRoom } from "./MapRoom.ts";

/**
 * Tin chat `chat {text, ch?, to?}`: `ch` thiếu = "map" (mọi người trong phòng, như cũ); "party" = mọi thành viên tổ đội; "whisper" =
 * hồn sư tên `to` đang trong game (kèm bản sao cho người gửi); "world" = mọi phòng, từ cấp WORLD_CHAT.minLevel, 1 tin /
 * WORLD_CHAT.cdSecs giây; "tong" (#198) = mọi thành viên cùng tông đang trong game (chưa thuộc tông thì báo). Tổ đội / riêng / thế
 * giới / tông đi qua presence CHAT_TOPIC tới phòng đang giữ người nhận (có thể ở bản đồ / kênh khác). Kiểm luật kênh trước, rồi mới
 * tính lượt chống spam (riêng từng kênh, ratelimit.chatCheck). Lỗi báo riêng người gửi.
 */
export function chatAction(room: MapRoom, id: string, m: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>;
  const ch = o.ch === undefined ? "map" : strIn(o.ch);
  if (ch !== "map" && ch !== "party" && ch !== "whisper" && ch !== "world" && ch !== "tong") return;
  if (!chatText(o.text)) return;
  const warn = (text: string) => room.log(id, text, "#ffb35c"), acc = d.accountId, now = Date.now();
  let to: number[] | undefined, toName: string | undefined;
  if (ch === "party") {
    to = party.partyMembers(acc);
    if (!to.length) return warn("Bạn không ở trong tổ đội nào: mời bằng /moi <tên> trước.");
  } else if (ch === "whisper") {
    const name = chatText(o.to).slice(0, 40);
    if (!name) return warn("Gõ /t <tên> <tin> để nhắn riêng.");
    const t = party.onlineByName(name);
    if (!t) return warn(`${name} không trong game: tin không được gửi.`);
    if (t.acc === acc) return warn("Không thể tự nhắn riêng cho chính mình.");
    const bw = blockDeny(acc, t.acc, t.name, "tin riêng"); if (bw) return warn(bw);
    to = [acc, t.acc]; toName = t.name;
  } else if (ch === "world") {
    if (p.level < WORLD_CHAT.minLevel) return warn(`Kênh thế giới mở từ cấp ${WORLD_CHAT.minLevel}.`);
    const wait = worldWait(acc, now);
    if (wait) return warn(`Kênh thế giới: mỗi ${WORLD_CHAT.cdSecs} giây một tin, đợi ${wait} giây.`);
  } else if (ch === "tong") {
    if (!d.tong) return warn("Ngươi chưa thuộc tông môn nào: gia nhập ở sứ giả tông môn (Thiên Đấu Thành) rồi mới chat tông (/tm).");
  }
  const r = chatCheck(acc, o.text, now, ch);
  if (!r) return;
  if ("error" in r) return warn(r.error);
  // Chat bản đồ: không gửi tới người trong phòng đã chặn người gửi (#195).
  if (ch === "map") return room.broadcast("chat", { name: p.name, text: r.text }, { except: room.clients.filter((c) => { const a = accOf(c); return a !== undefined && a !== acc && friends.blocked(a, acc); }) });
  if (ch === "world") {
    worldMark(acc, now);
    void presenceBackend.putJson(worldChatKey(acc), now, WORLD_CHAT.cdSecs * 1000).catch((e) => console.error("Không lưu được hồi kênh thế giới trong presence", e));
  }
  const route: ChatRoute = { ...(to ? { to } : {}), ...(ch === "tong" ? { tong: d.tong! } : {}), from: acc, msg: { ch, name: p.name, text: r.text, ...(toName ? { to: toName } : {}) } };
  room.presence.publish(CHAT_TOPIC, route);
}

/**
 * Lý do không gửi được `what` (tin riêng, lời mời tổ đội) từ `acc` tới `target` (tên `name`) vì chặn: `acc` đang chặn người đó, hoặc
 * người đó đã chặn `acc`. Không chặn thì null.
 */
export function blockDeny(acc: number, target: number, name: string, what: string) {
  if (friends.blocked(acc, target)) return `Bạn đang chặn ${name}: bỏ chặn trước khi gửi ${what}.`;
  if (friends.blocked(target, acc)) return `Không gửi được: ${name} không nhận ${what} của bạn.`;
  return null;
}

/**
 * Thao tác bạn bè từ client `friend {op, name?}` (#195): `list` (xin bảng), `add` / `block` (theo tên, kể cả người ngoại tuyến: tra
 * danh sách của mình, người đang trong game rồi mới tới DB), `remove` / `unblock` (tên trong danh sách của mình). Luật ở friends.ts.
 * Mỗi thao tác có tên (kể cả bị từ chối, vì tra tên có thể tốn một lần đọc DB) tính một lượt chống spam (ratelimit.friendCheck);
 * thao tác hợp lệ ghi DB phần của chính người gửi qua chuỗi lưu, lỗi ghi thì báo người gửi.
 */
export async function friendAction(room: MapRoom, id: string, m: unknown) {
  const d = room.pdata.get(id); if (!d || d.travelling) return;
  const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, op = strIn(o.op);
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  if (op === "list") return room.ask(id, "friends", () => room.sendFriends(id)); // theo nhịp ASK_CD như các tin xin lại dữ liệu riêng
  if (op !== "add" && op !== "remove" && op !== "block" && op !== "unblock") return;
  const name = strIn(o.name).replace(/\s+/g, " ").trim().slice(0, 40), acc = d.accountId;
  if (!name) return warn("Gõ tên hồn sư.");
  const rl = friendCheck(acc, Date.now()); if (rl) return warn(rl.error);
  let r: FriendResult;
  if (op === "remove") r = friends.remove(acc, name);
  else if (op === "unblock") r = friends.unblock(acc, name);
  else {
    const on = party.onlineByName(name);
    const t = friends.known(acc, name) ?? (on ? { id: on.acc, name: on.name } : await store.findAccount(name).catch((e) => {
      console.error(`Không tra được hồn sư "${name}" (bạn bè)`, e); return undefined;
    }));
    if (room.pdata.get(id) !== d || d.travelling) return; // rời phòng / đi cổng trong lúc tra DB
    if (t === undefined) return warn("Chưa tra được tên hồn sư, thử lại sau.");
    if (!t) return warn(`Không có hồn sư nào tên "${name}".`);
    r = op === "add" ? friends.add(acc, t) : friends.block(acc, t);
  }
  if ("error" in r) return warn(r.error);
  // Lời "đã thêm bạn" tới cùng một người chỉ gửi lại sau một lúc (xóa rồi thêm lại liên tục không làm ngập log người kia).
  for (const n of r.notes) if (n.added && !friendNoteOk(acc, n.to[0], Date.now())) delete n.added;
  const w = r.write;
  if (w.block) { // lời mời tổ đội giữa hai người có từ trước khi chặn cũng bỏ (cả hai chiều; qua presence như mọi thao tác tổ đội, #149)
    void party.dropInvite(acc, w.other).then((had) => { if (had) room.sendParty(id, true); })
      .catch((e) => console.error("Không bỏ được lời mời tổ đội trong presence", e));
    room.partyPublish(party.dropInvite(w.other, acc).then((had): party.PartyNote[] => (had ? [{ to: [w.other] }] : [])));
  }
  room.chain(d, () => (w.block !== undefined ? store.setBlock(acc, w.other, w.block) : store.setFriend(acc, w.other, !!w.friend)).catch((e) => {
    room.log(id, "Không lưu được danh sách bạn bè / chặn: thao tác vừa rồi có thể mất khi vào lại game.", "#ff6b6b");
    throw e; // chuỗi lưu ghi log và giữ chuỗi
  }));
  room.friendPublish(r.notes);
}

/**
 * Thao tác tổ đội từ client `party {op, name?, sid?}` (7.1): `invite` (theo tên, hoặc `sid` của người cùng phòng khi bấm vào hồn sư),
 * `accept` / `decline` (tên người mời), `leave`, `kick` / `lead` (trưởng nhóm, tên thành viên), `get` (xin khung tổ đội). Server kiểm
 * tra mọi thứ trong party.ts; lời mời hợp lệ mới tính vào giới hạn tốc độ (ratelimit.inviteCheck, như chat). Lỗi báo riêng.
 */
export async function partyAction(room: MapRoom, id: string, m: unknown) {
  const d = room.pdata.get(id); if (!d) return;
  const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, op = strIn(o.op);
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  let name = strIn(o.name).replace(/\s+/g, " ").trim().slice(0, 40);
  const now = Date.now(), acc = d.accountId;
  if (["invite", "accept", "leave", "kick", "lead"].includes(op)) {
    const locked = arenaQueueLocked(acc) || party.partyMembers(acc).some((member) => arenaQueueLocked(member));
    if (locked || d.arenaBusy) return warn("Tổ đội đang xếp hàng Đại Đấu Hồn Trường: chờ ghép hoặc hủy trước.");
  }
  let r: party.PartyResult;
  if (op === "get") return room.sendParty(id, true);
  if (op === "invite") {
    if (typeof o.sid === "string" && o.sid) {
      // Chỉ hồn sư client đang thấy (bấm vào trên màn hình): `sid` ở xa (lấy từ tin `mini`) không được đổi ra tên (11.4).
      const t = room.state.players.get(o.sid);
      if (!t || !room.interest.sees(id, "p", o.sid)) return warn("Hồn sư này không còn ở đây.");
      name = t.name;
    }
    if (!name) return warn("Gõ tên hồn sư muốn mời, ví dụ /moi Đường Tam.");
    // #195: kiểm chặn trước, để người bị chặn không đọc được tình trạng tổ đội của người chặn qua lỗi của inviteDeny.
    const on = party.onlineByName(name), bw = on && blockDeny(acc, on.acc, on.name, "lời mời tổ đội"); if (bw) return warn(bw);
    const ok = party.inviteDeny(acc, name, now);
    if ("error" in ok) return warn(ok.error);
    const rl = inviteCheck(acc, ok.target, now);
    if (rl) return warn(rl.error);
    r = { notes: await party.addInvite(acc, ok.target, now) };
  }
  else if (op === "accept") {
    // Lời mời được tạo trước khi người mời xếp đơn cũng phải bị chặn; nếu không tổ đội mới sẽ làm mục solo cũ sai thành phần.
    const inviter = party.inviteFrom(acc, name, now);
    if (inviter !== null && (arenaQueueLocked(inviter) || arenaReadActive(inviter))) return warn("Người mời đang xếp hàng Đại Đấu Hồn Trường: chờ ghép hoặc hủy trước.");
    const bw = inviter !== null && blockDeny(acc, inviter, name, "lời mời tổ đội"); if (bw) return warn(bw); // #195
    r = await party.accept(acc, name, now);
  }
  else if (op === "decline") r = await party.decline(acc, name, now);
  else if (op === "leave") r = await party.leave(acc);
  else if (op === "kick") r = await party.kick(acc, name);
  else if (op === "lead") r = await party.promote(acc, name);
  else return;
  if ("error" in r) { warn(r.error); return room.sendParty(id, true); }
  room.partyPublish(r.notes);
}

// ---------- Presence bạn bè / tổ đội / dấu tập trung (bước 24) ----------
/**
 * Sau khi tổ đội ghi `acc` vào / rời phòng (`party.goOnline` / `goOffline`, có thể chờ presence, #149): báo những người đã thêm nhau
 * với `acc` đang trong game gửi lại bảng bạn bè. `leaveSid`: phiên vừa rời, bỏ danh sách của nó khỏi RAM ngay (danh sách người cần báo
 * chụp trước khi bỏ). Tổ đội lỗi presence thì vẫn báo.
 */
export function friendAfter(room: MapRoom, done: Promise<unknown>, acc: number, leaveSid?: string) {
  const mates = friends.mutualOnline(acc);
  if (leaveSid !== undefined) friends.leave(acc, leaveSid);
  const ping = () => room.friendPublish([{ to: leaveSid === undefined ? friends.mutualOnline(acc) : mates }]);
  void done.then(ping, ping);
}

/** Phát các thông báo bạn bè lên presence: phòng đang giữ người nhận (có thể ở bản đồ khác) gửi lại bảng bạn bè và dòng log. */
export function friendPublish(room: MapRoom, notes: FriendNote[]) { for (const n of notes) if (n.to.length) room.presence.publish(FRIEND_TOPIC, n); }

/** Thông báo bạn bè trên presence: người của phòng này có trong `to` nhận dòng log (nếu có) và bảng bạn bè mới. */
export function friendNote(room: MapRoom, n: FriendNote) {
  if (!Array.isArray(n?.to)) return;
  for (const [id, d] of room.pdata) {
    if (!n.to.includes(d.accountId)) continue;
    if (n.text) room.log(id, n.text, FRIEND_COL);
    // Lời thêm bạn của người mình đã chặn không được gửi (mục 5.9).
    const add = n.added && !friends.blocked(d.accountId, n.added.acc) ? n.added : undefined;
    room.sendFriends(id, add && { name: add.name, back: friends.has(d.accountId, add.acc) });
  }
}

/**
 * Tin riêng "friends" (bảng bạn bè của chính chủ): danh sách bạn (đã thêm nhau chưa; bản đồ / kênh chỉ khi đã thêm nhau và đang trong
 * game), danh sách chặn. `added`: người vừa thêm mình (`back`: mình đã có người đó, tức hai bên đã là bạn bè; không thì client hiện
 * nút "Thêm lại").
 */
export function sendFriends(room: MapRoom, id: string, added?: { name: string; back: boolean }) {
  const d = room.pdata.get(id); if (!d) return;
  room.clients.getById(id)?.send("friends", { ...friends.view(d.accountId, party.whereIs), ...(added ? { added } : {}) });
}

/** Phát các thông báo tổ đội lên presence: phòng đang giữ người nhận (có thể ở bản đồ khác) gửi lại khung tổ đội và dòng log. */
export function partyPublish(room: MapRoom, notes: party.PartyNote[] | Promise<party.PartyNote[]>) {
  void Promise.resolve(notes).then((list) => { for (const n of list) void room.presence.publish(party.PARTY_TOPIC, n); })
    .catch((e) => console.error("Không cập nhật được tổ đội trong presence", e));
}

/** Thông báo tổ đội trên presence: người của phòng này có trong `to` nhận dòng log (nếu có) và khung tổ đội mới. */
export function partyNote(room: MapRoom, n: party.PartyNote) {
  if (!Array.isArray(n?.to)) return;
  for (const [id, d] of room.pdata) {
    if (!n.to.includes(d.accountId)) continue;
    if (n.text) room.log(id, n.text, n.col);
    room.sendParty(id, true);
  }
}

/** Tin riêng "party" (khung tổ đội, party.partyView): chỉ gửi khi nội dung đổi, trừ khi `force`. */
export function sendParty(room: MapRoom, id: string, force = false) {
  const d = room.pdata.get(id); if (!d) return;
  const { view, key } = party.partyView(d.accountId, room.roomId, Date.now());
  if (!force && key === d.partyKey) return;
  d.partyKey = key;
  room.clients.getById(id)?.send("party", view);
}

/**
 * Tin `rally {tx, ty}` (R6 #433): thành viên tổ đội đặt dấu "Tập trung ở đây" ở ô (tx, ty) của bản đồ đang đứng. Server kiểm: có ở trong
 * tổ đội, không ở Đại Đấu Hồn Trường / đang đổi bản đồ, ô nằm trong bản đồ và đi được, rồi mới tính giới hạn tốc độ (ratelimit.rallyCheck).
 * Bản đồ và kênh lấy từ chính phòng này (client không gửi). Hợp lệ thì phát `RALLY_TOPIC` tới thành viên tổ đội (kể cả tiến trình khác);
 * server không giữ dấu, mỗi nơi nhận tự đếm `RALLY.secs`. Lỗi báo riêng người đặt.
 */
export function rallyAction(room: MapRoom, id: string, m: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, warn = (text: string) => room.log(id, text, "#ffb35c");
  if (room.map.kind === "arena") return warn("Đại Đấu Hồn Trường không có dấu tập trung.");
  const acc = d.accountId, members = party.partyMembers(acc);
  if (members.length < 2) return warn("Cần ở trong tổ đội để đặt dấu Tập trung ở đây.");
  const pt = rallyPoint(o.tx, o.ty, room.map.MW, room.map.MH);
  if (!pt || !room.map.standable(pt.tx * TILE, pt.ty * TILE)) return warn("Chỗ đó không đi được, hãy đặt dấu ở chỗ trống.");
  const rl = rallyCheck(acc, Date.now()); if (rl) return warn(rl.error);
  const msg: RallyMsg = { from: p.name, map: room.state.mapId, ch: room.state.channel, tx: pt.tx, ty: pt.ty, secs: RALLY.secs };
  void room.presence.publish(party.RALLY_TOPIC, { to: members, pid: party.partyIdOf(acc), from: acc, msg, map: MAPS[room.state.mapId]?.name ?? room.state.mapId } satisfies party.RallyRoute);
}

/** Dấu tập trung trên presence: người của phòng này có trong `to` (và còn trong đúng tổ đội đó, không chặn người đặt) nhận tin riêng `rally` kèm một dòng chat hệ thống. */
export function rallyNote(room: MapRoom, r: party.RallyRoute) {
  if (!Array.isArray(r?.to) || !r.msg) return;
  const here = r.msg.map === room.state.mapId && r.msg.ch === room.state.channel;
  for (const [id, d] of room.pdata) {
    if (!r.to.includes(d.accountId) || party.partyIdOf(d.accountId) !== r.pid || d.travelling) continue;
    if (d.accountId !== r.from && friends.blocked(d.accountId, r.from)) continue;
    const c = room.clients.getById(id); if (!c) continue;
    c.send("rally", r.msg);
    const at = here ? "" : ` (${r.map}${r.msg.ch ? ` · Kênh ${r.msg.ch}` : ""})`;
    c.send("chat", { ch: "party", sys: true, name: "Hệ thống", text: `${r.msg.from} đánh dấu Tập trung ở đây${at}.` });
  }
}
