// Miền tông môn (GAME_DESIGN.md mục 5.8 / tông môn #196, #197): gia nhập / rời tông, tông vụ hằng ngày, bảng tuần, thưởng tuần, tách khỏi MapRoom.ts (#702, bước 7).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / shop.ts / gm.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.chain`, `room.saveTrade`.
// MapRoom chỉ chuyển tiếp `tongAction` (đăng ký `onMessage("tong")` giữ nguyên thứ tự ở đó) và `sendTong`, `tongNow`, `tongTasksOf`, `tongFresh` (bước 28, nhiều nơi gọi `room.sendTong`).
import { itemDef, formatHonTe, npcDef, TONG_MON, TONG_MIN_LEVEL, TONG_SWITCH_DAYS, TONG_POINTS, TONG_BOARD_CD, TONG_WEEK_MIN, TONG_TOP_N, TONG_WEEK_KIND, TONG_WEEK_REWARD,
  tongDef, tongWeek, tongWeekDay, tongTop, tongTaskIds, questChain, questStatus, ARENA_SHARDS, shardCode, type QuestProgress } from "../../../shared/data.ts";
import { store } from "../db.ts";
import { progressFor } from "./calc.ts";
import { type MapRoom } from "./MapRoom.ts";
import type { PData } from "./types.ts";
import { CLAIM_BUSY, claimHeld, testShift } from "./common.ts";

/**
 * Tin client `tong {op, tong}`: `join` gia nhập hoặc đổi sang tông `tong` (đứng gần sứ giả của tông đó; xong chuỗi tân thủ, võ hồn
 * cao nhất từ TONG_MIN_LEVEL, từ lần gia nhập trước đủ TONG_SWITCH_DAYS ngày; xoá điểm tuần hiện tại), `leave` rời tông (đứng gần
 * một sứ giả; giữ `tongAt` nên không rời rồi vào tông khác để lách thời gian chờ). Ghi DB qua chuỗi lưu. Từ #197: `accept` / `turnin`
 * tông vụ `chain` (tongTaskAction), `board` xin bảng tông tuần (tongBoard), `claim` nhận thưởng tuần trước (tongClaim), `get` xin lại tin.
 */
export function tongAction(room: MapRoom, id: string, op: unknown, raw: unknown, chain?: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendTong(id); };
  if (op === "get") return room.sendTong(id);
  if (op === "accept" || op === "turnin") return tongTaskAction(room, id, op, chain);
  if (op === "board") return tongBoard(room, id);
  if (op === "claim") return tongClaim(room, id);
  if (op !== "join" && op !== "leave") return warn("Thao tác tông môn không hợp lệ.");
  if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
  if (op === "leave") {
    if (!d.tong) return warn("Ngươi chưa thuộc tông môn nào.");
    if (!room.npcNear(id, { role: "tong" })) return warn("Hãy lại gần sứ giả tông môn để rời tông.");
    if (d.tongBusy) return warn("Đang xử lý lệnh tông môn trước, đợi một chút.");
    const old = tongDef(d.tong)!;
    tongWrite(room, id, d, () => store.setTong(d.accountId, null, null, tongWeek(room.tongNow())), () => {
      d.tong = null; p.tong = 0; d.tongPend = [];
      room.log(id, `Ngươi đã rời ${old.name}; điểm tuần này đã bỏ.`, old.col);
      room.sendTong(id);
    });
    return;
  }
  const t = tongDef(raw);
  if (!t) return warn("Tông môn không tồn tại.");
  const npc = npcDef(t.npc)!;
  if (!room.npcNear(id, { id: t.npc })) return warn(`Hãy lại gần ${npc.name} hơn để gia nhập.`);
  if (d.tong === t.id) return warn(`Ngươi đã là người của ${t.name}.`);
  if (questStatus(d.quest) !== "done") return warn(`Hãy hoàn thành chuỗi "Bài học của Đại Sư" trước khi gia nhập tông môn.`);
  if (Math.max(p.level, ...d.owned.map((v) => v.level)) < TONG_MIN_LEVEL) return warn(`Cần võ hồn cấp ${TONG_MIN_LEVEL} trở lên để gia nhập tông môn.`);
  const now = Date.now();
  if (d.tongAt !== null && now < d.tongAt + TONG_SWITCH_DAYS * 86400000)
    return warn(`Mới gia nhập gần đây: còn ${Math.ceil((d.tongAt + TONG_SWITCH_DAYS * 86400000 - now) / 86400000)} ngày nữa mới đổi được tông.`);
  if (d.tongBusy) return warn("Đang xử lý lệnh tông môn trước, đợi một chút.");
  const from = d.tong ? tongDef(d.tong) : null;
  tongWrite(room, id, d, () => store.setTong(d.accountId, t.id, now, tongWeek(room.tongNow())), () => {
    d.tong = t.id; d.tongAt = now; d.tongPend = []; p.tong = TONG_MON.findIndex((x) => x.id === t.id) + 1;
    room.log(id, from ? `Ngươi đã rời ${from.name} và gia nhập ${t.name}; điểm tuần này đã bỏ.` : `Chúc mừng, ngươi đã gia nhập ${t.name}!`, t.col);
    room.questEvent(id, { k: "tong" }); // #286: gia nhập hoặc đổi tông
    room.sendTong(id);
  });
}

/**
 * Gia nhập / rời tông (#796): ghi DB trong chuỗi lưu TRƯỚC, chỉ khi ghi xong mới chạy `apply` (đổi bộ nhớ, báo, gửi tin). Ghi lỗi thì bộ nhớ giữ nguyên,
 * báo lỗi và gửi lại tin tông (không lệch DB, không báo "đã gia nhập" khi chưa lưu). `tongBusy` chặn lệnh tông thứ hai trong lúc chờ (kể cả khi
 * chuỗi bị bỏ qua sau `/gm preset`: cờ nhả ở `.then`).
 */
export function tongWrite(room: MapRoom, id: string, d: PData, write: () => Promise<void>, apply: () => void) {
  d.tongBusy = true;
  room.chain(d, async () => {
    try { await write(); }
    catch (err) { room.log(id, "Không lưu được thay đổi tông môn, hãy thử lại sau.", "#ffb35c"); room.sendTong(id); throw err; }
    if (room.pdata.get(id) === d && room.state.players.get(id)) apply();
  }).then(() => { d.tongBusy = false; });
}

/**
 * Nhận / trả tông vụ `chainId` hôm nay (#197): phải thuộc một tông, đứng trong NPC_RANGE của sứ giả **tông mình**, không gục. Như
 * dailyAction: mục tiêu `give` bớt đồ khỏi túi lúc trả (rẻ nhất trước). Trả bài: Hồn Tệ của mẫu, rồi trong chuỗi lưu ghi túi (bài đã
 * xong, Hồn Tệ, đồ đã nộp) và **chỉ khi đã ghi** mới cộng TONG_POINTS điểm vào tuần hiện tại của tông đang thuộc (tong_points), nên ghi
 * lỗi thì không có điểm, bài vẫn trả lại được.
 */
export function tongTaskAction(room: MapRoom, id: string, op: "accept" | "turnin", chainId: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendTong(id); };
  room.tongFresh(d);
  const t = d.tong ? tongDef(d.tong) : undefined;
  if (!t) return warn("Chỉ người trong tông môn mới nhận được tông vụ.");
  const i = typeof chainId === "string" ? d.tongTasks.findIndex((q) => q.chain === chainId) : -1;
  if (i < 0) return warn("Tông vụ đó đã hết hạn: hôm nay có bài mới.");
  const npc = npcDef(t.npc)!, verb = op === "accept" ? "nhận" : "trả";
  if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
  if (!room.npcNear(id, { id: t.npc })) return warn(`Hãy lại gần ${npc.name} (sứ giả ${t.name}) để ${verb} tông vụ.`);
  const step = questChain(d.tongTasks[i].chain)!.steps[0];
  room.dailyGive(d, d.tongTasks);
  const st = questStatus(d.tongTasks[i]);
  if (st === "done") return warn(`Đã xong "${step.name}" hôm nay: mai có tông vụ mới.`);
  if (op === "accept") {
    if (st !== "offer") return warn(`Đang làm "${step.name}": xong rồi quay lại trả bài.`);
    d.tongTasks[i] = { chain: d.tongTasks[i].chain, step: 0, accepted: true, prog: step.goals.map(() => 0) };
    d.bagDirty = true;
    room.dailyGive(d, d.tongTasks);
    room.log(id, `Nhận tông vụ "${step.name}": ${step.desc}`, t.col);
    if (questStatus(d.tongTasks[i]) === "ready") room.log(id, `Đã đạt sẵn mục tiêu của "${step.name}": trả bài ngay để nhận thưởng.`, "#86e0b0");
    room.sendTong(id);
    room.saveTrade(id, d);
    return;
  }
  if (st === "offer") return warn(`Chưa nhận "${step.name}".`);
  if (st !== "ready") return warn(`Chưa xong "${step.name}": ${step.goals.map((g, k) => `${g.text} ${d.tongTasks[i].prog[k] ?? 0}/${g.n}`).join(", ")}.`);
  const gives = step.goals.some((g) => g.k === "give");
  if (gives && claimHeld(d)) return warn(CLAIM_BUSY); // #165: như bán / bỏ đồ
  if (gives) d.bag = d.bag.map((it) => ({ ...it }));
  for (const g of step.goals) {
    if (g.k !== "give" || !g.item) continue;
    let left = g.n;
    for (const it of room.giveItems(d, g.item)) { if (left <= 0) break; const n = Math.min(left, it.qty); room.takeItem(d, it, n); left -= n; }
  }
  room.addCoin(d, step.reward.honTe);
  d.tongTasks[i] = { chain: d.tongTasks[i].chain, step: 1, accepted: false, prog: [] };
  d.bagDirty = true;
  const week = tongWeek(room.tongNow()), tong = t.id;
  const given = step.goals.filter((g) => g.k === "give").map((g) => `${g.n} ${itemDef(g.item ?? "")?.name ?? g.item}`).join(", ");
  room.log(id, `Trả tông vụ "${step.name}"${given ? ` (nộp ${given})` : ""}: nhận ${formatHonTe(step.reward.honTe)} và ${TONG_POINTS} điểm ${t.name}.`, "#f2c84b");
  room.sendBag(id);
  room.sendTong(id);
  d.tongPend.push({ week, tong, n: TONG_POINTS });
  room.saveTrade(id, d);
}

/**
 * Tin riêng `tongBoard` (#197), cách nhau TONG_BOARD_CD giây: tuần hiện tại (`week`, bảng `cur`: điểm trung bình thành viên hoạt động
 * từng tông và top TONG_TOP_N cá nhân mỗi tông, điểm của mình `me`), và tuần trước (`last`: bảng, tông hạng 1, điểm của mình, phần
 * thưởng `reward` top / rest / null = không hoạt động, đã nhận `claimed`).
 */
export function tongBoard(room: MapRoom, id: string, force = false) {
  const d = room.pdata.get(id); if (!d) return;
  const now = Date.now(); if (!force && now - d.tongBoardAt < TONG_BOARD_CD * 1000) return;
  d.tongBoardAt = now;
  const week = tongWeek(room.tongNow()), last = week - 7;
  Promise.all([store.tongBoard(week, TONG_WEEK_MIN, TONG_TOP_N), store.tongBoard(last, TONG_WEEK_MIN, TONG_TOP_N), store.tongPoints(d.accountId, week),
    store.tongPoints(d.accountId, last), store.bossClaims(d.accountId, tongWeekDay(last), TONG_WEEK_KIND)]).then(([cur, prev, mine, mineLast, claimed]) => {
    const first = tongTop(prev.tongs), active = !!mineLast && mineLast.points >= TONG_WEEK_MIN;
    room.clients.getById(id)?.send("tongBoard", { week, min: TONG_WEEK_MIN, cur, me: mine && mine.tong === d.tong ? mine.points : 0,
      last: { week: last, board: prev, first, tong: mineLast?.tong ?? "", points: mineLast?.points ?? 0,
        reward: active ? (first.includes(mineLast!.tong) ? "top" : "rest") : null, claimed: claimed > 0 } });
  }, (e) => console.error("Không đọc được bảng tông môn", e));
}

/**
 * Nhận thưởng tuần trước (#197) ở một sứ giả tông môn, đúng một lần: thành viên hoạt động tuần trước (từ TONG_WEEK_MIN điểm ở tông khi
 * đó) nhận TONG_WEEK_REWARD.top nếu tông đó hạng 1 tuần trước (tongTop), không thì `rest`. Như đổi mảnh ở Thương hội (#282): trong
 * chuỗi lưu, cộng thưởng vào túi rồi ghi lượt (boss_claims loại TONG_WEEK_KIND, ngày thứ Hai của tuần được thưởng) cùng túi trong một
 * transaction (claimBoss); đã nhận / lỗi thì trả lại túi như cũ. Túi không đủ chỗ cho mảnh thì từ chối (không mất lượt).
 */
export function tongClaim(room: MapRoom, id: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); tongBoard(room, id, true); };
  if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
  if (!room.npcNear(id, { role: "tong" })) return warn("Hãy lại gần sứ giả tông môn để nhận thưởng tuần.");
  if (claimHeld(d)) return warn(CLAIM_BUSY);
  d.claimBusy++;
  room.chain(d, async () => {
    const last = tongWeek(room.tongNow()) - 7, day = tongWeekDay(last);
    const mine = await store.tongPoints(d.accountId, last);
    if (!mine || mine.points < TONG_WEEK_MIN) return warn(`Tuần trước ngươi chưa đủ ${TONG_WEEK_MIN} điểm tông (có ${mine?.points ?? 0}): không có thưởng tuần.`);
    const t = tongDef(mine.tong), board = await store.tongBoard(last, TONG_WEEK_MIN, 0);
    const top = tongTop(board.tongs).includes(mine.tong), R = top ? TONG_WEEK_REWARD.top : TONG_WEEK_REWARD.rest;
    const code = shardCode(ARENA_SHARDS[Math.floor(Math.random() * ARENA_SHARDS.length)]), def = itemDef(code)!;
    if (room.bagRoom(d, code) < R.shards) return warn(`Túi đồ không đủ chỗ cho ${R.shards} ${def.name}: bỏ hoặc bán bớt đồ rồi nhận lại.`);
    const coin0 = d.honTe;
    room.addCoin(d, R.honTe); room.addItem(d, code, R.shards); d.bagDirty = true;
    const takeBack = () => {
      d.honTe = coin0; d.bagDirty = true;
      let n = R.shards;
      for (const x of d.bag.filter((i) => i.code === code && i.vohonId === null).reverse()) { const k = Math.min(n, x.qty); room.takeItem(d, x, k); n -= k; if (!n) break; }
    };
    let n: number | null;
    try { n = await store.claimBoss(d.accountId, day, TONG_WEEK_KIND, 1, room.bagSnapshot(d)); }
    catch (e) { takeBack(); warn("Không lưu được lần nhận thưởng tuần, thử lại sau."); throw e; }
    if (n === null) { takeBack(); return warn("Đã nhận thưởng tuần trước rồi."); }
    room.log(id, `Thưởng tuần ${t?.name ?? mine.tong}${top ? " (tông hạng nhất)" : ""}: ${formatHonTe(R.honTe)} và ${R.shards} ${def.name}.`, t?.col ?? "#f2c84b");
    tongBoard(room, id, true);
  }).then(() => {
    d.claimBusy--;
    if (room.pdata.get(id) === d) room.sendBag(id);
  });
}

/**
 * Tin riêng `tong {tong, wait, day, tasks}`: tông đang thuộc ("" = không), số giây còn phải chờ mới gia nhập / đổi được (0 = được), và
 * TONG_DAILY.count tông vụ hôm nay (#197: tiến độ như tin "daily" kèm trạng thái; nội dung bài client tự suy từ mã, questChain).
 */
export function sendTong(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d) return;
  tongFresh(room, d); room.dailyGive(d, d.tongTasks);
  const wait = d.tongAt === null ? 0 : Math.max(0, Math.ceil((d.tongAt + TONG_SWITCH_DAYS * 86400000 - Date.now()) / 1000));
  room.clients.getById(id)?.send("tong", { tong: d.tong ?? "", wait, day: d.tongDay,
    tasks: d.tongTasks.map((q) => ({ ...q, prog: [...q.prog], status: questStatus(q) })) });
}
/** Giờ của tuần tông (ms): giờ thật, hook test `tweek` lệch được (#197). */
export function tongNow() { return Date.now() + testShift.tong * 86400000; }
/** Bộ tông vụ hôm nay từ các dòng `quests` đã lưu (như dailyOf); bài chưa có dòng thì chưa nhận. */
export function tongTasksOf(room: MapRoom, saved: QuestProgress[] | undefined, day = room.dailyDay()) {
  return { tongDay: day, tongTasks: progressFor(tongTaskIds(day), saved) };
}
/** Sang ngày mới thì thay bằng bộ tông vụ mới chưa nhận (như dailyFresh); trả true khi vừa đặt lại. */
export function tongFresh(room: MapRoom, d: PData, day = room.dailyDay()) {
  if (d.tongDay === day) return false;
  Object.assign(d, tongTasksOf(room, undefined, day));
  d.bagDirty = true;
  return true;
}
