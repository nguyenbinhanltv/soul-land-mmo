// Miền NPC / nhiệm vụ / khảo hạch hằng ngày (NPC 6.1, nhiệm vụ 6.2, khảo hạch hằng ngày mục 5.8): nói chuyện NPC, nhận / trả chuỗi nhiệm vụ, nhận / trả khảo hạch, tách khỏi MapRoom.ts (#702, bước 8).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / shop.ts / tong.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.saveTrade`, `room.save`.
// MapRoom chỉ chuyển tiếp `talkNpc`, `questAction`, `dailyAction` (đăng ký `onMessage("talk")` / `onMessage("quest")` giữ nguyên thứ tự ở đó). Bộ đếm `questEvent` / `questBump`, `sendQuest`, `sendDaily`, `dailyGive`... còn ở MapRoom (nhiều nơi gọi).
import { itemDef, npcDef, questChain, questStatus, questRewardText, isDaily, DAILY, MAPS, QUEST_STARTER, QUEST_AFTER, questStart } from "../../../shared/data.ts";
import { CLAIM_BUSY, claimHeld, type MapRoom } from "./MapRoom.ts";

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
