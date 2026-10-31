// Miền NPC / nhiệm vụ / khảo hạch hằng ngày (NPC 6.1, nhiệm vụ 6.2, khảo hạch hằng ngày mục 5.8): nói chuyện NPC, nhận / trả chuỗi nhiệm vụ, nhận / trả khảo hạch, tách khỏi MapRoom.ts (#702, bước 8).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / shop.ts / tong.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.saveTrade`, `room.save`.
// MapRoom chỉ chuyển tiếp `talkNpc`, `questAction`, `dailyAction` (đăng ký `onMessage("talk")` / `onMessage("quest")` giữ nguyên thứ tự ở đó) và các hàm bộ đếm / tin riêng `sendQuest`, `fixedQuest`, `questOpen`, `questHave`, `questEvent`, `rewardFits`, `grantReward`, `dailyDay`, `dailyOf`, `dailyFresh`, `giveItems`, `dailyGive`, `sendDaily`, `dailyBag` (bước 28, nhiều miền gọi `room.questEvent` / `room.sendDaily` như cũ).
import { itemDef, npcDef, questChain, questStart, questStatus, questRewardText, isDaily, DAILY, dailyIds, MAPS, QUEST_STARTER, QUEST_AFTER, BONE_SLOTS, vnDay,
  type QuestGoal, type QuestReward, type QuestProgress, type QuestEvent } from "../../../shared/data.ts";
import { mapRoute } from "../map.ts";
import { bossNow } from "../schedule.ts";
import { progressFor, giveCandidates } from "./calc.ts";
import { type MapRoom, type PData } from "./MapRoom.ts";
import { CLAIM_BUSY, claimHeld, testShift } from "./common.ts";

/** Nói chuyện với NPC `raw` (mã trong NPCS): đứng đủ gần thì gửi riêng tin `npc {id}` để client mở hộp thoại (lời thoại ở NPCS). */
export function talkNpc(room: MapRoom, id: string, raw: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const def = npcDef(raw), spot = def && room.map.npcs.find((n) => n.id === def.id);
  if (!def || !spot) return room.log(id, "Không có NPC này ở đây.", "#ffb35c");
  if (p.dead) return room.log(id, "Đã gục ngã, không thể nói chuyện.", "#ffb35c");
  if (!room.npcNear(id, { id: def.id })) return room.log(id, `Hãy lại gần ${def.name} hơn để nói chuyện.`, "#ffb35c");
  room.questEvent(id, { k: "talk", npc: def.id, map: room.state.mapId }); // 6.2: trước tin npc để hộp thoại mở ra với tiến độ mới
  if (def.role === "tong") room.sendTong(id); // #196: trước tin npc để hộp thoại có trạng thái tông
  if (def.role === "looks") room.sendLooksInfo(id); // L4 (#511): số lần đã đổi, để hộp thoại hiện giá
  room.clients.getById(id)?.send("npc", { id: def.id });
}

/**
 * Nhận (`accept`) / trả (`turnin`) bước đang làm của chuỗi tân thủ, hoặc xin tiến độ (`get`). Nhận và trả chỉ khi NPC giao nhiệm vụ
 * có ở bản đồ này, người chơi không gục, không đang chuyển bản đồ và đứng trong NPC_RANGE (như 6.1). Nhận: mục tiêu `have` đã đạt
 * sẵn thì tính xong ngay. Trả: đủ mọi mục tiêu và túi đủ chỗ cho cả phần thưởng (không thì từ chối hết), Hồn Tệ, vật phẩm và
 * hồn cốt (grantReward) vào túi, sang bước kế (chưa nhận; bước đã trả không trả lại được); ghi ngay qua chuỗi lưu, cùng một lần ghi
 * với túi đồ.
 */
export function questAction(room: MapRoom, id: string, op: unknown, chainId?: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  if (op === "get") return room.askQuest(id);
  if (typeof chainId === "string" && isDaily(chainId)) return room.dailyAction(id, op, chainId);
  const q = room.fixedQuest(d, typeof chainId === "string" ? chainId : QUEST_STARTER), chain = q && questChain(q.chain); if (!q || !chain) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendQuest(id, undefined, undefined, q.chain); };
  if (op !== "accept" && op !== "turnin") return warn("Thao tác nhiệm vụ không hợp lệ.");
  const giver = npcDef(chain.giver)!, verb = op === "accept" ? "nhận" : "trả";
  if (!room.map.npcs.some((n) => n.id === chain.giver)) return warn(`${giver.name} không ở đây: tới ${MAPS[chain.map].name} để ${verb} nhiệm vụ.`);
  if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
  if (!room.npcNear(id, { id: chain.giver })) return warn(`Hãy lại gần ${giver.name} hơn để ${verb} nhiệm vụ.`);
  const st = questStatus(q), step = chain.steps[q.step];
  if (st === "done") return warn(`Đã học xong cả chuỗi "${chain.name}".`);
  if (!room.questOpen(d, chain.id)) return warn(`Chưa mở chuỗi "${chain.name}": hoàn thành chuỗi "${questChain(QUEST_AFTER[chain.id])?.name}" trước.`);
  if (op === "accept") {
    if (st !== "offer") return warn(`Đang làm "${step.name}": xong rồi quay lại trả nhiệm vụ.`);
    Object.assign(q, { accepted: true, prog: step.goals.map((g) => (g.have && room.questHave(d, g) ? g.n : 0)) });
    d.bagDirty = true;
    room.log(id, `Nhận nhiệm vụ "${step.name}" (bài ${q.step + 1}/${chain.steps.length}): ${step.desc}`, giver.col);
    const ready = questStatus(q) === "ready";
    if (ready) room.log(id, `Đã đạt sẵn mục tiêu của "${step.name}": trả nhiệm vụ ngay để nhận thưởng.`, "#86e0b0");
    room.sendQuest(id, ready ? "ready" : "accept", undefined, q.chain);
    room.saveTrade(id, d);
    return;
  }
  if (st === "offer") return warn(`Chưa nhận "${step.name}".`);
  if (st !== "ready") return warn(`Chưa xong "${step.name}": ${step.goals.map((g, i) => `${g.text} ${q.prog[i] ?? 0}/${g.n}`).join(", ")}.`);
  if (!room.rewardFits(d, step.reward))
    return warn(`Túi đồ không đủ chỗ cho phần thưởng (${questRewardText(step.reward)}): bỏ hoặc bán bớt đồ trước.`);
  const got = room.grantReward(d, step.reward);
  Object.assign(q, { step: q.step + 1, accepted: false, prog: [] });
  d.bagDirty = true;
  room.log(id, `Trả nhiệm vụ "${step.name}": nhận ${got}.`, "#f2c84b");
  const finish = questStatus(q) === "done";
  if (finish) room.log(id, `Hoàn thành chuỗi nhiệm vụ "${chain.name}"!`, giver.col);
  room.sendBag(id);
  room.sendQuest(id, finish ? "finish" : "reward", step.id, q.chain);
  room.save(id); // phần thưởng và bước mới ghi ngay, cùng một lần ghi túi đồ
}

/**
 * Nhận / trả bài khảo hạch `chainId` của hôm nay: như questAction (NPC DAILY.giver có ở bản đồ này, không gục, đứng trong NPC_RANGE).
 * Trả bài: đủ mục tiêu; mục tiêu `give` bớt đồ khỏi túi trước (rẻ nhất trước) rồi mới kiểm tra túi đủ chỗ cho phần thưởng (thiếu thì
 * trả lại túi như cũ, giữ tiến độ). Bài của ngày đã qua thì từ chối. Ghi ngay qua chuỗi lưu như questAction.
 */
export function dailyAction(room: MapRoom, id: string, op: unknown, chainId: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendDaily(id); };
  if (room.dailyFresh(d)) room.sendDaily(id, "reset");
  const i = d.daily.findIndex((q) => q.chain === chainId);
  if (i < 0) return warn(`Bài khảo hạch đó đã hết hạn: hôm nay ${npcDef(DAILY.giver)?.name} ra bài mới.`);
  if (op !== "accept" && op !== "turnin") return warn("Thao tác nhiệm vụ không hợp lệ.");
  const giver = npcDef(DAILY.giver)!, verb = op === "accept" ? "nhận" : "trả";
  if (!room.map.npcs.some((n) => n.id === DAILY.giver)) return warn(`${giver.name} không ở đây: tới ${MAPS[DAILY.map].name} để ${verb} khảo hạch.`);
  if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
  if (!room.npcNear(id, { id: DAILY.giver })) return warn(`Hãy lại gần ${giver.name} hơn để ${verb} khảo hạch.`);
  const step = questChain(chainId)!.steps[0];
  room.dailyGive(d);
  const st = questStatus(d.daily[i]);
  if (st === "done") return warn(`Đã xong "${step.name}" hôm nay: mai có bài mới.`);
  if (op === "accept") {
    if (st !== "offer") return warn(`Đang làm "${step.name}": xong rồi quay lại trả bài.`);
    d.daily[i] = { chain: chainId, step: 0, accepted: true, prog: step.goals.map(() => 0) };
    d.bagDirty = true;
    room.dailyGive(d);
    room.log(id, `Nhận khảo hạch "${step.name}": ${step.desc}`, giver.col);
    const ready = questStatus(d.daily[i]) === "ready";
    if (ready) room.log(id, `Đã đạt sẵn mục tiêu của "${step.name}": trả bài ngay để nhận thưởng.`, "#86e0b0");
    room.sendDaily(id, ready ? "ready" : "accept", i);
    room.saveTrade(id, d);
    return;
  }
  if (st === "offer") return warn(`Chưa nhận "${step.name}".`);
  if (st !== "ready") return warn(`Chưa xong "${step.name}": ${step.goals.map((g, k) => `${g.text} ${d.daily[i].prog[k] ?? 0}/${g.n}`).join(", ")}.`);
  const gives = step.goals.some((g) => g.k === "give");
  if (gives && claimHeld(d)) return warn(CLAIM_BUSY); // #165: như bán / bỏ đồ
  // Nộp vật phẩm trên bản sao túi: túi không đủ chỗ cho phần thưởng thì trả lại túi cũ. Bài không nộp đồ thì không chép túi (#165:
  // các món đang chờ DB xác nhận, như phần thưởng boss, giữ nguyên đối tượng).
  const keep = d.bag, dirty = d.bagDirty;
  if (gives) d.bag = d.bag.map((it) => ({ ...it }));
  for (const g of step.goals) {
    if (g.k !== "give" || !g.item) continue;
    let left = g.n;
    for (const it of room.giveItems(d, g.item)) { if (left <= 0) break; const n = Math.min(left, it.qty); room.takeItem(d, it, n); left -= n; }
  }
  if (!room.rewardFits(d, step.reward)) {
    d.bag = keep; d.bagDirty = dirty;
    return warn(`Túi đồ không đủ chỗ cho phần thưởng (${questRewardText(step.reward)}): bỏ hoặc bán bớt đồ trước.`);
  }
  const got = room.grantReward(d, step.reward);
  d.daily[i] = { chain: chainId, step: 1, accepted: false, prog: [] };
  d.bagDirty = true;
  const given = step.goals.filter((g) => g.k === "give").map((g) => `${g.n} ${itemDef(g.item ?? "")?.name ?? g.item}`).join(", ");
  room.log(id, `Trả khảo hạch "${step.name}"${given ? ` (nộp ${given})` : ""}: nhận ${got}.`, "#f2c84b");
  room.sendBag(id);
  room.sendDaily(id, "reward", i);
  room.save(id); // phần thưởng, đồ đã nộp và bài đã xong ghi ngay, cùng một lần ghi túi đồ
}

/**
 * Tin riêng "quest": tiến độ chuỗi tân thủ (bước, đã nhận, số đếm từng mục tiêu) và trạng thái (questStatus). Nội dung bài, mục
 * tiêu, phần thưởng client đọc từ QUESTS. `ev`: vừa nhận (`accept`), vừa đủ mục tiêu (`ready`), vừa trả (`reward`, kèm `done` = mã
 * bước vừa trả), vừa xong cả chuỗi (`finish`); client hiện thông báo theo `ev`.
 */
export function sendQuest(room: MapRoom, id: string, ev?: "accept" | "ready" | "reward" | "finish", done?: string, chain = QUEST_STARTER) {
  const d = room.pdata.get(id), q = d && fixedQuest(d, chain); if (!q) return;
  room.clients.getById(id)?.send("quest", { ...q, prog: [...q.prog], status: questStatus(q), ev, done });
}
/** Tiến độ chuỗi cố định `chain` (tân thủ hoặc chương sau) của người chơi; undefined nếu không phải chuỗi cố định. */
export function fixedQuest(d: PData, chain: string) { return d.quest.chain === chain ? d.quest : d.chains.find((q) => q.chain === chain); }
/** Chuỗi `chain` đã mở cho người chơi chưa: chuỗi không có điều kiện, hoặc chuỗi `QUEST_AFTER` của nó đã xong. */
export function questOpen(d: PData, chain: string) { const a = QUEST_AFTER[chain]; return !a || questStatus(fixedQuest(d, a) ?? questStart(a)) === "done"; }
/**
 * Mục tiêu `have` đã đạt sẵn chưa (lúc nhận nhiệm vụ): võ hồn nào đã có hồn hoàn, đang gắn hồn cốt / hồn hạch, đang ở bản đồ đó,
 * đang thuộc một tông môn (#286).
 */
export function questHave(room: MapRoom, d: PData, g: QuestGoal) {
  if (g.k === "absorb") return d.ringYears.length > 0 || d.owned.some((v) => v !== d.ch && v.rings.length > 0);
  if (g.k === "equip") return d.bag.some((i) => i.vohonId !== null);
  if (g.k === "map") return g.map === room.state.mapId;
  if (g.k === "tong") return d.tong !== null;
  return false;
}
/**
 * Sự kiện thật cho bộ đếm nhiệm vụ (hạ hồn thú, đổi tay trong trận, tiên cơ, hấp thụ trong giới hạn, gắn đồ, nói chuyện với NPC,
 * vào bản đồ; từ khảo hạch hằng ngày thêm hồn thú hợp cấp `fit`, trận đấu hồn `arena`; #286 thêm dung hợp kỹ `fusion`, gia nhập tông
 * `tong`): chỉ tính khi đã nhận bước đang làm; mỗi mục tiêu khớp `ev` cộng 1 (kẹp ở `n`), cho chuỗi tân thủ và từng bài khảo hạch.
 * Đủ mọi mục tiêu thì báo quay về NPC.
 * Tiến độ ghi DB cùng túi đồ (bagDirty -> lưu định kỳ, rời phòng, transaction đi cổng).
 */
export function questEvent(room: MapRoom, id: string, ev: QuestEvent) {
  const d = room.pdata.get(id); if (!d || d.travelling) return;
  for (const q of [d.quest, ...d.chains]) {
    const r = room.questBump(q, ev), chain = questChain(q.chain);
    if (!r || !chain) continue;
    d.bagDirty = true;
    if (r === "ready") room.log(id, `Hoàn thành "${chain.steps[q.step].name}": quay về gặp ${npcDef(chain.giver)?.name} ở ${MAPS[chain.map].name} để nhận thưởng.`, "#86e0b0");
    sendQuest(room, id, r === "ready" ? "ready" : undefined, undefined, q.chain);
  }
  // Khảo hạch hằng ngày: cùng sự kiện, từng bài đã nhận (sang ngày mới thì bộ bài cũ bỏ trước).
  if (dailyFresh(room, d)) sendDaily(room, id, "reset");
  let hit = false, ready = -1;
  d.daily.forEach((q, i) => {
    const x = room.questBump(q, ev); if (!x) return;
    hit = true;
    if (x === "ready") { ready = i; room.log(id, `Hoàn thành khảo hạch "${questChain(q.chain)?.steps[0].name}": quay về gặp ${npcDef(DAILY.giver)?.name} ở ${MAPS[DAILY.map].name} để nhận thưởng.`, "#86e0b0"); }
  });
  if (hit) { d.bagDirty = true; sendDaily(room, id, ready >= 0 ? "ready" : undefined, ready); }
  // Tông vụ (#197): cùng sự kiện, từng bài đã nhận.
  if (room.tongFresh(d)) room.sendTong(id);
  let tHit = false;
  for (const q of d.tongTasks) {
    const x = room.questBump(q, ev); if (!x) continue;
    tHit = true;
    if (x === "ready") room.log(id, `Hoàn thành tông vụ "${questChain(q.chain)?.steps[0].name}": quay về sứ giả tông môn để nhận thưởng.`, "#86e0b0");
  }
  if (tHit) { d.bagDirty = true; room.sendTong(id); }
}
/** Túi đủ chỗ cho cả phần thưởng nhiệm vụ `r` không: vật phẩm như bagFits, mỗi hồn cốt (`bones`, #285) thêm một ô. */
export function rewardFits(room: MapRoom, d: PData, r: QuestReward) { return room.bagFits(d, r.items, r.bones?.length ?? 0); }
/**
 * Trao phần thưởng nhiệm vụ đã qua rewardFits: Hồn Tệ, vật phẩm, rồi mỗi hồn cốt (#285) đúng loài và số năm, vị trí tung đều trong
 * BONE_SLOTS, +0, chưa có dòng phụ như hồn cốt rơi (addBone). Trả văn bản để báo log (hồn cốt ghi vị trí đã tung). Không gửi "bag".
 */
export function grantReward(room: MapRoom, d: PData, r: QuestReward) {
  room.addCoin(d, r.honTe);
  for (const it of r.items) room.addItem(d, it.code, it.qty);
  const bones = (r.bones ?? []).flatMap((b) => {
    const it = room.addBone(d, b.years, b.beast, BONE_SLOTS[Math.floor(Math.random() * BONE_SLOTS.length)].id);
    return it ? [room.itemLabel(it)] : [];
  });
  return [questRewardText({ ...r, bones: [] }), ...bones].filter(Boolean).join(", ");
}
/**
 * Ngày của bộ khảo hạch (vnDay, đổi lúc 00:00 giờ Việt Nam): như `today` (hook `day` của phòng lệch được), cộng độ lệch toàn tiến
 * trình `testShift.daily` của hook `daily {shift}` (để bot chọn ngày có bộ bài cần thử và mang cùng ngày đó sang phòng sân đấu).
 */
export function dailyDay(room: MapRoom) { return vnDay(bossNow() + (room.dayShift + testShift.daily) * 86400000); }
/** Bộ khảo hạch hôm nay (dailyIds) từ các dòng `quests` đã lưu; bài chưa có dòng thì chưa nhận. Dòng của ngày khác bỏ qua. */
export function dailyOf(room: MapRoom, saved: QuestProgress[] | undefined, day = dailyDay(room)) {
  return { dailyDay: day, daily: progressFor(dailyIds(day), saved) };
}
/**
 * Sang ngày mới (00:00 giờ Việt Nam, dailyDay) thì thay bằng bộ bài mới chưa nhận; bài cũ dở dang bỏ luôn (dòng cũ trong bảng `quests`
 * bị xóa ở lần ghi túi kế tiếp, writeBag). Trả true khi vừa đặt lại (nơi gọi gửi tin "daily").
 */
export function dailyFresh(room: MapRoom, d: PData, day = dailyDay(room)) {
  if (d.dailyDay === day) return false;
  Object.assign(d, dailyOf(room, undefined, day));
  d.bagDirty = true;
  return true;
}
/**
 * Các món mã `code` nộp được cho mục tiêu `give`: nằm trong túi (không gắn), chưa cường hóa / nâng cấp, không phải hồn hoàn đang hấp
 * thụ (#165: đồ đang dùng không làm nguyên liệu đồng thời); rẻ nhất trước.
 */
export function giveItems(d: PData, code: string) {
  return giveCandidates(d.bag, code, d.absorbing?.itemId);
}
/**
 * Số đếm của mục tiêu `give` = số món đang có trong túi (kẹp ở `n`), tính lại mỗi khi túi đổi. Trả chỉ số bài vừa đủ mục tiêu
 * (-1 = không có) và có đổi số đếm nào không.
 */
export function dailyGive(d: PData, list: QuestProgress[] = d.daily) {
  let changed = false, ready = -1;
  list.forEach((q, i) => {
    const step = q.accepted ? questChain(q.chain)?.steps[q.step] : undefined; if (!step) return;
    const was = questStatus(q);
    step.goals.forEach((g, k) => {
      if (g.k !== "give" || !g.item) return;
      const n = Math.min(g.n, giveItems(d, g.item).reduce((a, it) => a + it.qty, 0));
      if (q.prog[k] !== n) { q.prog[k] = n; changed = true; }
    });
    if (was !== "ready" && questStatus(q) === "ready") ready = i;
  });
  return { changed, ready };
}
/**
 * Tin riêng "daily": ngày (vnDay), DAILY.count bài (tiến độ như tin "quest" và trạng thái), `ev` vừa nhận / vừa đủ / vừa trả /
 * vừa đặt lại sang ngày mới (`reset`) kèm `i` = bài đó, và `route` chỉ đường từ bản đồ này (mapRoute) để client chấm mục tiêu
 * ở bản đồ khác lên cổng đúng hướng. Nội dung bài client tự suy từ mã (questChain).
 */
export function sendDaily(room: MapRoom, id: string, ev?: "accept" | "ready" | "reward" | "reset", i = -1) {
  const d = room.pdata.get(id), c = room.clients.getById(id); if (!d || !c) return;
  if (dailyFresh(room, d)) ev = "reset";
  dailyGive(d);
  c.send("daily", { day: d.dailyDay, list: d.daily.map((q) => ({ ...q, prog: [...q.prog], status: questStatus(q) })), ev, i, route: mapRoute(room.state.mapId) });
}
/** Túi vừa đổi: mục tiêu nộp vật phẩm có thể vừa đủ / vừa thiếu, gửi lại tin "daily" khi đổi số đếm. */
export function dailyBag(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d) return;
  const t = dailyGive(d, d.tongTasks); // tông vụ nộp vật phẩm (#197)
  if (t.changed) {
    if (t.ready >= 0) room.log(id, `Đã đủ đồ cho tông vụ "${questChain(d.tongTasks[t.ready].chain)?.steps[0].name}": mang tới nộp cho sứ giả tông môn.`, "#86e0b0");
    room.sendTong(id);
  }
  const { changed, ready } = dailyGive(d); if (!changed) return;
  if (ready >= 0) room.log(id, `Đã đủ đồ cho khảo hạch "${questChain(d.daily[ready].chain)?.steps[0].name}": mang tới nộp cho ${npcDef(DAILY.giver)?.name} ở ${MAPS[DAILY.map].name}.`, "#86e0b0");
  sendDaily(room, id, ready >= 0 ? "ready" : undefined, ready);
}
