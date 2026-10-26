// Miền Đại Đấu Hồn Trường phía phòng bản đồ (GAME_DESIGN.md mục 5.9, bước 7.2, #278): xếp hàng, hủy, vào sân khi ghép được trận, xem trực tiếp, bảng xếp hạng; tách khỏi MapRoom.ts (#702, bước 9).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / shop.ts / tong.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự. Hàng chờ và ghép trận ở arenaQueue.ts, trận đấu ở ArenaRoom.ts.
// MapRoom chỉ chuyển tiếp `arenaAction` (đăng ký `onMessage("arena")` giữ nguyên thứ tự ở đó), `sendArenaQueue` (onLeave gọi) và `arenaTop` (ArenaRoom gọi).
import { ARENA, arenaTeamElo, TEAM_COMBAT_SECS } from "../../../shared/data.ts";
import { store } from "../db.ts";
import * as party from "../party.ts";
import { arenaLiveOpenList, arenaLiveHold, arenaLiveRelease, arenaWatchMax } from "./arenaQueue.ts";
import { arenaEnqueue, arenaDequeue, arenaQueued, arenaQueueSlots, arenaReadElo, arenaReadCancel, arenaReadCancelled, type ArenaTeamEntry } from "./arenaQueue.ts";
import type { PlayerState } from "./schema.ts";
import { strIn, type MapRoom, type PData } from "./MapRoom.ts";

/**
 * Lý do chưa ghép trận được lúc này ("" = được): đang chuyển bản đồ / đi qua cổng, đã gục, đang hấp thụ, đang giao chiến,
 * hoặc tổ đội chưa đủ điều kiện 2 người cùng phòng. Người đang xếp hàng mà rơi vào một trạng thái này thì vòng ghép bỏ qua
 * (vẫn giữ chỗ), trừ khi rời phòng thì cả bên bị bỏ khỏi hàng.
 */
export function arenaAccounts(room: MapRoom, accountId: number) {
  const members = party.partyMembers(accountId);
  return members.length ? [...members] : [accountId];
}

/** Lý do một hồn sư chưa rời bản đồ sang sân được (xếp hàng, xem trận); "" = được. */
export function arenaBusyOne(room: MapRoom, q: PlayerState, x: PData): string {
  if (x.travelling) return "Đang chuyển bản đồ.";
  if (x.travelCast) return "Đang đi qua cổng.";
  if (q.dead) return "Đã gục ngã.";
  if (x.absorbing) return "Đang hấp thụ hồn hoàn.";
  if (x.fight < TEAM_COMBAT_SECS) return "Đang giao chiến.";
  return "";
}
export function arenaBusy(room: MapRoom, id: string): string {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return "Không có hồn sư.";
  const one = (q: PlayerState, x: PData) => arenaBusyOne(room, q, x);
  const own = one(p, d); if (own) return own;
  const pid = party.partyIdOf(d.accountId); if (!pid) return "";
  const members = party.partyMembers(d.accountId);
  if (members.length !== 2) return "Tổ đội Đại Đấu Hồn Trường cần đúng 2 người.";
  if (party.partyLeader(d.accountId) !== d.accountId) return "Chỉ trưởng nhóm được xếp hàng cho tổ đội.";
  if (!party.partyInRoom(d.accountId, room.roomId)) return "Hai thành viên phải ở cùng kênh bản đồ.";
  for (const acc of members) {
    const row = [...room.pdata.entries()].find(([, x]) => x.accountId === acc);
    if (!row) return "Cả hai thành viên phải đang ở cùng kênh bản đồ.";
    const q = room.state.players.get(row[0]); if (!q) return "Cả hai thành viên phải đang ở cùng kênh bản đồ.";
    const why = one(q, row[1]); if (why) return `${why} (thành viên tổ đội).`;
  }
  return "";
}

/** Kiểm tra phiên của cả bên còn nguyên trước khi mở phòng riêng, tránh tạo trận thiếu thành viên. */
export function arenaCanFound(room: MapRoom, rows: [string, PData][]) {
  return rows.every(([sid, d]) => room.clients.getById(sid) && room.state.players.get(sid) && room.pdata.get(sid) === d && !d.travelling);
}

/** Báo và đưa bên còn nguyên về hàng khi đối thủ rời đúng lúc vòng ghép mở phòng. */
export function arenaQueueRetry(room: MapRoom, rows: [string, PData][]) {
  for (const [sid] of rows) {
    if (!room.pdata.has(sid)) continue;
    room.log(sid, "Đối thủ vừa rời hàng chờ, tiếp tục tìm trận.", "#ff9a8a");
    sendArenaQueue(room, sid);
  }
}

/** Báo cho phiên còn lại rằng mục hàng đã hủy vì bên này không còn đủ người vào sân. */
export function arenaQueueAbort(room: MapRoom, rows: [string, PData][]) {
  for (const [sid] of rows) {
    if (!room.pdata.has(sid)) continue;
    room.log(sid, "Không thể vào sân Đại Đấu Hồn Trường, hàng chờ đã hủy.", "#ffb35c");
    sendArenaQueue(room, sid);
  }
}

/** Tin riêng "arena" k = "queue": đang xếp hàng hay không (client hiện / ẩn ô "Đang tìm trận"). */
export function sendArenaQueue(room: MapRoom, id: string) {
  const d = room.pdata.get(id), q = d && arenaQueued(d.accountId);
  room.clients.getById(id)?.send("arena", q ? { k: "queue", on: true, elo: q.elo, members: q.members.map((m) => m.name), secs: (Date.now() - q.since) / 1000 } : { k: "queue", on: false });
}

/**
 * `arena {op}` (7.2): `queue` xếp hàng (phải đứng cạnh NPC Đại Đấu Hồn Trường, NPC_RANGE; không gục, không đi cổng, không hấp thụ,
 * không giao chiến), `cancel` hủy xếp hàng, `top` xin bảng xếp hạng kèm thành tích của mình (ở đâu cũng xem được, cách nhau ARENA.topCd
 * giây). Elo đọc từ DB lúc xếp hàng, hai lần đọc của một tài khoản cách nhau ít nhất ARENA.queueCd giây (arenaQueueSlots; cả bên ghi
 * mốc nguyên tử, xếp rồi hủy
 * liên tục không tạo tải DB đều đặn); `cancel` trong lúc đang đọc thì đọc xong không xếp hàng (#225). Ghép trận ở arenaQueue.ts, trận
 * đấu ở ArenaRoom. Xem trực tiếp (#278): `live` danh sách trận đang đếm ngược / giao đấu, `watch {roomId}` vào xem (arenaWatch).
 */
export function arenaAction(room: MapRoom, id: string, raw: unknown, roomId?: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const op = strIn(raw), warn = (text: string) => { room.log(id, text, "#ffb35c"); sendArenaQueue(room, id); };
  if (op === "top") return arenaTop(room, id);
  if (op === "live") return arenaLiveList(room, id);
  if (op === "watch") return arenaWatch(room, id, strIn(roomId));
  if (op === "cancel") {
    const accounts = arenaAccounts(room, d.accountId), removed = arenaDequeue(d.accountId), cancelled = accounts.some((acc) => arenaReadCancel(acc));
    if (removed || cancelled) {
      // Hủy mục đã vào queue thì mở khóa ngay; hủy lúc đọc Elo chỉ đánh dấu, Promise phải tự hạ cờ khi kết thúc.
      for (const acc of accounts) {
        const row = [...room.pdata.entries()].find(([, x]) => x.accountId === acc);
        if (row) { if (removed) row[1].arenaBusy = false; sendArenaQueue(room, row[0]); }
      }
      room.log(id, "Đã hủy xếp hàng Đại Đấu Hồn Trường.");
    }
    return sendArenaQueue(room, id);
  }
  if (op !== "queue") return warn("Thao tác Đại Đấu Hồn Trường không hợp lệ.");
  if (d.arenaBusy && arenaReadCancelled(d.accountId)) return warn("Thao tác quá nhanh, chờ một chút rồi xếp hàng lại.");
  if (arenaQueued(d.accountId) || d.arenaBusy) return warn("Đang tìm đối thủ rồi.");
  const why = arenaBusy(room, id); if (why) return warn(`${why} Chưa xếp hàng được.`);
  const accounts = arenaAccounts(room, d.accountId);
  const rows = accounts.map((acc) => [...room.pdata.entries()].find(([, x]) => x.accountId === acc)).filter((x): x is [string, PData] => !!x);
  if (rows.length !== accounts.length) return warn("Cả hai thành viên phải đang ở cùng kênh bản đồ.");
  if (!rows.every(([sid]) => room.npcNear(sid, { role: "arena" }))) return warn("Cả hai thành viên phải lại gần Đại Đấu Hồn Trường.");
  if (!arenaQueueSlots(accounts)) return warn("Thao tác quá nhanh, chờ một chút rồi xếp hàng lại.");
  rows.forEach(([, x]) => { x.arenaBusy = true; });
  Promise.all([Promise.all(rows.map(([, x]) => arenaReadElo(x.accountId, () => store.getArena(x.accountId, ARENA.startElo)))),
    Promise.all(rows.map(([, x]) => store.isTestAccount(x.accountId)))]).then(([recs, tests]) => {
    rows.forEach(([, x]) => { x.arenaBusy = false; });
    if (rows.some(([sid, x]) => room.pdata.get(sid) !== x) || recs.some((rec) => !rec)) return;
    // Tổ đội lẫn tài khoản test và người thật không xếp hàng được (#518): đội test chỉ gặp đội test, nên người thật trong đó sẽ bị đổi Elo bởi trận với tài khoản test.
    if (tests.some(Boolean) && !tests.every(Boolean)) return warn("Tổ đội có cả tài khoản test và người thật: không xếp hàng xếp hạng được.");
    const current = arenaAccounts(room, d.accountId);
    if (current.length !== accounts.length || current.some((acc) => !accounts.includes(acc))) return;
    const late = arenaBusy(room, id); if (late) return warn(`${late} Chưa xếp hàng được.`);
    const e: ArenaTeamEntry = { id: party.partyIdOf(d.accountId) ? `party:${party.partyIdOf(d.accountId)}` : `solo:${d.accountId}`,
      members: rows.map(([, x], i) => ({ accountId: x.accountId, name: room.state.players.get(rows[i][0])!.name, rec: recs[i]!, ...(tests[i] ? { test: true } : {}) })),
      elo: arenaTeamElo(recs.map((rec) => rec!.elo)), since: Date.now(),
      ready: () => room.pdata.get(id) === d && arenaAccounts(room, d.accountId).length === accounts.length
        && arenaAccounts(room, d.accountId).every((acc) => accounts.includes(acc)) && !arenaBusy(room, id),
      canFound: () => arenaCanFound(room, rows), found: (roomId, foe) => arenaFound(room, rows, roomId, foe),
      requeue: () => arenaQueueRetry(room, rows), abort: () => arenaQueueAbort(room, rows), rollback: () => arenaFoundRollback(room, rows) };
    return arenaEnqueue(e).then(() => {
      for (const [sid] of rows) { room.log(sid, `Đang tìm đối thủ (Elo đội ${e.elo}): ghép đội Elo gần nhất, chờ càng lâu càng nới rộng.`, "#ff9a8a"); sendArenaQueue(room, sid); }
    }, (err) => { console.error("Không xếp hàng được đội Đại Đấu Hồn Trường", err); rows.forEach(([, x]) => { x.arenaBusy = false; }); warn("Không xếp hàng được, thử lại."); });
  }, (e) => { rows.forEach(([, x]) => { x.arenaBusy = false; }); console.error(`Không đọc được Elo đội Đại Đấu Hồn Trường`, e); warn("Không xếp hàng được, thử lại."); });
}

/**
 * Đã ghép trận (arenaQueue.ts): dừng mọi hành động như lúc đi cổng (freeze), báo client vào phòng ArenaRoom `roomId`. Client rời
 * phòng này (onLeave lưu vị trí như thường: sau trận quay về đúng chỗ cũ); không rời trong ARENA.joinSecs giây thì server ngắt kết
 * nối. Trả false nếu một thành viên đã rời phòng; arenaQueue sẽ hủy trận và trả bên còn nguyên về hàng.
 */
export function arenaFound(room: MapRoom, rows: [string, PData][], roomId: string, foe: ArenaTeamEntry) {
  if (!arenaCanFound(room, rows)) return false;
  for (const [id, d] of rows) {
    const c = room.clients.getById(id)!, p = room.state.players.get(id)!;
    room.freeze(id); room.portalHint(id, p, d); d.arenaGone = true;
    c.send("arena", { k: "found", roomId, foe: foe.members.map((m) => m.name).join(" / "), elo: foe.elo, members: foe.members.map((m) => m.name) });
    room.clock.setTimeout(() => { if (d.arenaGone && room.clients.getById(id)) c.leave(4006); }, ARENA.joinSecs * 1000);
  }
  return true;
}

/**
 * Tin riêng "arena" k = "live" (#278): tối đa ARENA.liveN trận đang đếm ngược / giao đấu (giao đấu trước, rồi ít thời gian còn lại
 * hơn): mã phòng, 1v1 / 2v2, tên và Elo hai bên, pha, giây còn lại, số người xem / tối đa. Xin lại cách nhau ARENA.topCd giây.
 */
export function arenaLiveList(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d) return;
  const now = Date.now(); if (now - d.arenaLiveAt < ARENA.topCd * 1000) return;
  d.arenaLiveAt = now;
  arenaLiveOpenList().then((all) => {
    const list = all.sort((a, b) => (a.phase === "fight" ? 0 : 1) - (b.phase === "fight" ? 0 : 1) || a.secs - b.secs).slice(0, ARENA.liveN)
      .map((l) => ({ ...l, secs: Math.ceil(l.secs), max: arenaWatchMax() }));
    room.clients.getById(id)?.send("arena", { k: "live", list });
  }, (e) => console.error("Không đọc được sổ xem trận", e));
}

/**
 * Vào xem trực tiếp trận `roomId` (#278, mục 5.9): đứng gần Đại Đấu Hồn Trường, cùng điều kiện như xếp hàng (arenaBusyOne), không đang
 * xếp hàng / xem trận khác; trận còn đếm ngược / giao đấu và còn chỗ (arenaWatchMax, gồm chỗ đang giữ). Giữ chỗ cho tài khoản
 * ARENA.joinSecs giây rồi đi đúng đường vào sân như người đấu (freeze, tin `arena {k: "watch"}`, không rời kịp thì ngắt kết nối).
 */
export function arenaWatch(room: MapRoom, id: string, roomId: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id), c = room.clients.getById(id); if (!p || !d || !c) return;
  const no = (text: string) => room.log(id, `${text} Chưa vào xem được.`, "#ffb35c");
  // L1 #789: nhịp ARENA.topCd như top / live, và mã phòng sai dạng bị bỏ trước khi chạm sổ presence dùng chung.
  const now = Date.now(); if (now - d.arenaWatchAt < ARENA.topCd * 1000) return;
  d.arenaWatchAt = now;
  if (!roomId || roomId.length > 64) return no("Mã trận không hợp lệ.");
  if (!room.npcNear(id, { role: "arena" })) return no("Hãy lại gần Đại Đấu Hồn Trường.");
  const why = arenaBusyOne(room, p, d); if (why) return no(why);
  if (arenaQueued(d.accountId) || d.arenaBusy) return no("Đang xếp hàng: hủy hàng trước khi xem trận.");
  const until = Date.now() + ARENA.joinSecs * 1000;
  arenaLiveHold(roomId, d.accountId, until, arenaWatchMax()).then((r) => {
    if (r === "other") return no("Đang xem một trận khác.");
    if (r === "gone") return no("Trận đấu không còn diễn ra.");
    if (r === "full") return no(`Trận đã đủ ${arenaWatchMax()} người xem.`);
    const p2 = room.state.players.get(id);
    // Trong lúc chờ sổ presence người chơi có thể đã rời / đi cổng / xếp hàng: nhả chỗ giữ, không freeze.
    if (!p2 || room.pdata.get(id) !== d || d.travelling || arenaQueued(d.accountId) || d.arenaBusy || !room.clients.getById(id)) {
      void arenaLiveRelease(roomId, d.accountId).catch((e) => console.error("Không nhả chỗ giữ xem trận", e)); return;
    }
    room.freeze(id); room.portalHint(id, p2, d); d.arenaGone = true;
    c.send("arena", { k: "watch", roomId, sides: r.sides });
    room.clock.setTimeout(() => { if (d.arenaGone && room.clients.getById(id)) c.leave(4006); }, ARENA.joinSecs * 1000);
  }, (e) => { console.error("Không giữ được chỗ xem trận", e); no("Hệ thống bận."); });
}

/** Hoàn tác freeze nếu bên kia mất phiên ngay sau khi matchMaker mở phòng nhưng trước khi cả hai nhận mã. */
export function arenaFoundRollback(room: MapRoom, rows: [string, PData][]) {
  for (const [sid, d] of rows) {
    const p = room.state.players.get(sid);
    if (!p || room.pdata.get(sid) !== d) continue;
    d.travelling = false; d.arenaGone = false; room.portalHint(sid, p, d);
  }
}

/** Tin riêng "arenaTop": ARENA.topN dòng đầu bảng xếp hạng (dòng của mình có `me`), hạng / thành tích của mình, lượt thắng có thưởng còn lại hôm nay. */
export function arenaTop(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d) return;
  const now = Date.now(); if (now - d.arenaTopAt < ARENA.topCd * 1000) return;
  d.arenaTopAt = now;
  Promise.all([store.arenaTop(ARENA.topN, d.accountId), store.bossClaims(d.accountId, room.today(), ARENA.claimKind)]).then(([t, n]) => {
    room.clients.getById(id)?.send("arenaTop", { list: t.list.map((r) => ({ name: r.name, elo: r.elo, wins: r.wins, losses: r.losses, draws: r.draws, me: r.accountId === d.accountId })),
      me: t.me, start: ARENA.startElo, left: Math.max(0, ARENA.dailyWins - n), queued: !!arenaQueued(d.accountId) });
  }, (e) => console.error("Không đọc được bảng xếp hạng Đại Đấu Hồn Trường", e));
}
