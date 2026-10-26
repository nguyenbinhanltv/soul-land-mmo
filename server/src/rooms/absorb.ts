// Hấp thụ hồn hoàn (GAME_DESIGN.md mục 5.2, docs/design/hon-hoan.md), tách khỏi MapRoom.ts (#702, bước 15): bắt đầu, hủy, tung kết quả.
// Hàm nhận phòng (`room: MapRoom`) như bones.ts; nguyên văn từ MapRoom, không đổi số / thứ tự RNG / thứ tự ghi DB qua `room.save`. MapRoom chỉ chuyển tiếp
// (đăng ký `onMessage("absorb")` và vòng `tick` giữ nguyên ở đó).
import type { Client } from "colyseus";
import { VOHON, TIERS, atBottleneck, MAX_LEVEL, tierOfYears, vohonIndex, absorbSecs, absorbChance, formatYears, MAX_RINGS, RING_ITEM,
  TEAM_COMBAT_SECS, ringSkill, chanThanOf, CHAN_THAN_RING, LOADOUT_SIZE } from "../../../shared/data.ts";
import { CLAIM_BUSY, claimHeld, type MapRoom } from "./MapRoom.ts";

/**
 * Hấp thụ hồn hoàn trong túi vào một võ hồn (mục 5.2 "Hấp thụ", bước 3.3). Client gửi id ô và `vohonId` (vohons.id; thiếu thì
 * võ hồn đang ra trận); server kiểm tra ô thuộc túi và võ hồn thuộc bộ sưu tập của chính người gửi. Chỉ khi võ hồn ở bình cảnh
 * và không giao chiến; vượt giới hạn của vòng (RING_LIMIT) thì thất bại theo bảng ABSORB_FAIL, vượt > 100% thì không cho.
 * Hồn hoàn nằm trong túi suốt lúc hấp thụ (absorbSecs theo số năm): di chuyển hoặc bị đánh thì hủy, không mất gì.
 */
export function tryAbsorb(room: MapRoom, c: Client, raw: unknown, rawVohon: unknown) {
  const id = c.sessionId, p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d || p.dead || d.absorbing || d.travelling) return;
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  if (d.travelCast) return warn("Đang đi qua cổng, không thể hấp thụ.");
  if (claimHeld(d)) return warn(CLAIM_BUSY); // #165: hồn hoàn boss thế giới vào túi trước khi DB xác nhận lượt
  const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
  if (!it || it.code !== RING_ITEM || it.years === null) return warn("Hãy chọn một hồn hoàn trong túi đồ để hấp thụ (phím B).");
  const v = rawVohon === undefined || rawVohon === null ? d.ch : d.owned.find((x) => x.rowId === rawVohon);
  if (!v) return warn("Bạn không sở hữu võ hồn này.");
  if (v === d.ch) room.syncCh(id);
  const name = VOHON[Math.max(0, vohonIndex(v.vohon))].name, slot = v.rings.length + 1, years = it.years;
  if (v.rings.length >= MAX_RINGS) return warn(`${name} đã đủ ${MAX_RINGS} hồn hoàn, không hấp thụ thêm được.`);
  if (!atBottleneck(v.level, v.rings.length)) return warn(`${name} cần đạt cấp ${slot * 10} (bình cảnh) mới hấp thụ được hồn hoàn thứ ${slot}.`);
  if (d.fight < TEAM_COMBAT_SECS) return warn(`Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới hấp thụ được.`);
  const ch = absorbChance(years, slot);
  if (ch.fail === null) return warn(`Hồn hoàn ${formatYears(years)} vượt giới hạn vòng thứ ${slot} (${formatYears(ch.limit)}) tới ${ch.over}%: cơ thể không chịu nổi, không thể hấp thụ.`);
  const dur = absorbSecs(years);
  d.absorbing = { itemId: it.id, rowId: v.rowId, slot, years, t: 0, dur, fail: ch.fail };
  p.absorbTier = tierOfYears(years); p.absorb = 0.001;
  c.send("absorbing", { on: true, rowId: v.rowId, years, slot, secs: dur, over: ch.over, fail: ch.fail });
  const secs = `${String(dur).replace(".", ",")} giây`;
  if (ch.fail) room.log(id, `Bắt đầu hấp thụ hồn hoàn ${formatYears(years)} vào ${name}: vượt giới hạn ${ch.over}%, ${Math.round(ch.fail * 100)}% thất bại (mất hồn hoàn). Cần ${secs}.`, "#ffb35c");
  else room.log(id, `Bắt đầu hấp thụ hồn hoàn ${formatYears(years)} vào ${name} (${secs}). Đừng di chuyển và đừng để bị tấn công.`);
  room.dailyBag(id); // #165: hồn hoàn đang hấp thụ không còn tính cho bài khảo hạch nộp hồn hoàn
}

/** Hủy hấp thụ (di chuyển, bị đánh): không mất gì, hồn hoàn vẫn trong túi. */
export function cancelAbsorb(room: MapRoom, id: string, text: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d?.absorbing) return;
  const a = d.absorbing; d.absorbing = null; p.absorb = 0;
  room.clients.getById(id)?.send("absorbing", { on: false, result: "cancel", rowId: a.rowId, years: a.years });
  room.log(id, text, "#ffb35c");
  room.dailyBag(id); // hồn hoàn lại tính cho bài khảo hạch nộp hồn hoàn
}

/**
 * Hết thời gian hấp thụ: server tung kết quả (hook test `roll` cố định được số ngẫu nhiên). Thành công hay thất bại hồn hoàn đều
 * rời túi; thất bại không phạt gì thêm. Thành công: lưu số năm vào vòng, lên 1 cấp (tối đa MAX_LEVEL). Hồn kỹ vòng 5–10 chưa có
 * (bước 8.1): vòng 5+ chỉ tăng chỉ số qua calcStats.
 */
export function finishAbsorb(room: MapRoom, id: string) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!, a = d.absorbing!, c = room.clients.getById(id);
  d.absorbing = null; p.absorb = 0;
  const it = d.bag.find((i) => i.id === a.itemId), v = d.owned.find((x) => x.rowId === a.rowId);
  if (v === d.ch) room.syncCh(id);
  // Hồn hoàn hoặc võ hồn không còn đúng như lúc bắt đầu: bỏ qua, không mất gì.
  if (!it || it.years !== a.years || !v || v.rings.length + 1 !== a.slot || !atBottleneck(v.level, v.rings.length)) {
    c?.send("absorbing", { on: false, result: "cancel", rowId: a.rowId, years: a.years });
    room.dailyBag(id);
    return;
  }
  const years = a.years, tier = tierOfYears(years), age = formatYears(years), name = VOHON[Math.max(0, vohonIndex(v.vohon))].name;
  // Thành công hay thất bại hồn hoàn đều rời túi (thất bại là vỡ tan).
  room.takeItem(d, it, 1); room.sendBag(id);
  const roll = d.testRoll ?? Math.random();
  if (roll < a.fail) {
    c?.send("absorbing", { on: false, result: "fail", rowId: v.rowId, years, slot: a.slot });
    room.log(id, `Thất bại! Hồn hoàn ${age} vỡ tan (vượt giới hạn vòng thứ ${a.slot}). ${name} không bị tổn hại gì thêm.`, "#ff8a8a");
    room.save(id); return;
  }
  v.rings.push(years); v.level = Math.min(MAX_LEVEL, v.level + 1); v.xp = 0;
  const n = v.rings.length;
  if (v === d.ch) {
    room.showVohon(p, v); d.ringYears = [...v.rings];
    room.recalc(id, true);
    room.broadcast("fx", { k: "absorbed", id, tier });
  } else {
    d.dirty.add(v.rowId);
    if (!d.down.has(v.rowId)) d.benchHp.delete(v.rowId); // lên cấp thì hồi đầy, như benchXp
  }
  c?.send("absorbing", { on: false, result: "ok", rowId: v.rowId, years, slot: n, level: v.level });
  if (!a.fail) room.questEvent(id, { k: "absorb" }); // 6.2: chỉ hồn hoàn không vượt giới hạn của vòng
  // Từ 8.1a: vòng 5–10 mở hồn kỹ / Chân Thân nếu võ hồn đã có dữ liệu; chưa có thì vòng này chỉ tăng chỉ số.
  const nk = ringSkill(v.vohon, n - 1), ct = n === CHAN_THAN_RING ? chanThanOf(v.vohon) : null;
  const sk = nk ? ` Nhận Hồn kỹ vòng ${n}: ${nk.name}${n > LOADOUT_SIZE ? " (xếp vào 4 ô mang theo ở bảng đội hình, phím V)" : ""}.`
    : ct ? ` Mở Võ Hồn Chân Thân: ${ct.name} (phím R).` : " Võ hồn này chưa có hồn kỹ vòng này (bản sau); vòng này tăng chỉ số.";
  const lv = n >= MAX_RINGS ? ` Đủ ${MAX_RINGS} hồn hoàn, cấp tối đa ${v.level}.` : ` Lên cấp ${v.level}.`;
  room.log(id, `Hấp thụ thành công hồn hoàn ${age} vào ${name} (vòng ${n})!${lv}${sk}`, TIERS[tier].glow);
  room.broadcast("chat", { sys: true, name: "Hệ thống", text: `${p.name} đã hấp thụ hồn hoàn thứ ${n} (${age}) cho ${name}.` });
  if (c) room.sendVohons(c);
  room.resCheck(id); // cộng minh (8.2): tổng hồn hoàn, võ hồn cấp 30+
  room.save(id);
}

