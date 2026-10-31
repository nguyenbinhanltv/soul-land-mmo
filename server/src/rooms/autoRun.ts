// Tự săn (Auto 1) và ủy thác offline (Auto 3) phía phòng (GAME_DESIGN.md mục 5.13): tin `auto`, bật / tắt / tổng kết tự săn, giờ treo và Ủy Thác Lệnh, ghi cài đặt, tính thưởng vắng mặt khi vào game; tách khỏi MapRoom.ts (#702).
// Hàm nhận phòng (`room: MapRoom`) như team.ts / bag.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.chain`. Quyết định từng nhịp ở autoHunt.ts.
// MapRoom chỉ chuyển tiếp (onMessage, autoHunt.ts, combat.ts, item.ts, join.ts, persist.ts, travel.ts, gm.ts gọi `room.autoStop` / `room.sendAuto` / `room.flushAuto`... như cũ).

import { store, type AutoRow, type Item } from "../db.ts";
import { loadMap, type Zone } from "../map.ts";
import { bossNow } from "../schedule.ts";
import { BEASTS, MAPS, TIERS, MAX_YEARS, autoHint, OFFLINE, boneChance, AUTO_MSG_RATE, parseAuto, AUTO_DAILY_SECS, autoTimeText, AUTO_MAX_PER_CELL, autoLeft, type AutoSummary, type AutoHint, type ItemDef, AUTO_BONUS_MAX, offlineSplit, offlineFight, beastStats, xpLevelScale, beastLevel, BEAST_COIN, tierOfYears, shardChance, shardCode, SHARD_QTY, itemDef, herbChance, HERBS, rollEquipDrop, BONE_SLOTS, coreChance, rollCore, XP_SHARE_ACTIVE, XP_SHARE_BENCH, formatYears, formatHonTe, rollYears, tierBand } from "../../../shared/data.ts";
import { MOVE_DEAD } from "../../../shared/move.ts";
import { bagUsed } from "./items.ts";
import { AutoHunter } from "./autoHunt.ts";
import type { MapRoom } from "./MapRoom.ts";
import type { PData } from "./types.ts";

/**
 * Tin `auto {op, cfg}`: `on` bật với điểm neo là chỗ đang đứng, `off` tắt, `set` đổi cài đặt (kẹp bằng parseAuto), `get` xin trạng
 * thái. Chỉ ở bản đồ săn, ngoài vùng an toàn, không gục / hấp thụ / đi cổng, còn giờ treo hôm nay, túi còn chỗ, ô lưới chưa đủ
 * AUTO_MAX_PER_CELL người treo. Luôn trả tin riêng `auto`.
 */
export function autoAction(room: MapRoom, id: string, op: unknown, cfg: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  // Nhịp riêng theo người chơi (F2 báo cáo soát): vượt thì bỏ tin, không ghi DB / duyệt pdata.
  const now = Date.now(), scale = process.env.GAME_TEST === "1" && !d.autoRealRate ? 1000 : 1; // bot bật / tắt dồn dập: GAME_TEST nới nhịp (hook `test auto {rate}` trả về nhịp thật)
  d.autoTok = Math.min(AUTO_MSG_RATE.burst * scale, d.autoTok + (now - d.autoTokAt) / 1000 * AUTO_MSG_RATE.perSec * scale); d.autoTokAt = now;
  if (d.autoTok < 1) {
    // `set` vượt nhịp: giữ cấu hình cuối, áp một lần khi có token (không để cài đặt cuối bị mất, không tốn DB); tin khác bỏ, trả lại trạng thái thật.
    if (op === "set") {
      const wait = !d.autoSetPend;
      d.autoSetPend = { cfg };
      if (wait) room.clock.setTimeout(() => {
        const pend = d.autoSetPend; d.autoSetPend = null;
        if (pend && room.pdata.get(id) === d) autoAction(room, id, "set", pend.cfg);
      }, Math.ceil((1 - d.autoTok) / AUTO_MSG_RATE.perSec * 1000) + 20);
    } else sendAuto(room, id);
    return;
  }
  d.autoTok -= 1;
  if (op === "set") d.autoSetPend = null; // `set` mới áp ngay thì bỏ cấu hình chờ cũ hơn
  const day = room.today(); if (day !== d.autoDay) { d.autoDay = day; d.autoUsed = 0; d.autoDirty = true; }
  if (op === "off") { if (d.auto) autoStop(room, id, "đã tắt."); else sendAuto(room, id); return; }
  if (op === "set") {
    d.autoCfg = parseAuto(cfg); if (d.auto) d.auto.cfg = d.autoCfg;
    d.autoDirty = true; room.chainLatest(d, "auto", () => flushAuto(room, d)); // gửi dồn: ghi một lần (#164)
    return sendAuto(room, id);
  }
  if (op !== "on" || d.auto) return sendAuto(room, id);
  const deny = (t: string) => { room.log(id, `Không bật được tự động: ${t}`, "#ffb35c"); sendAuto(room, id, t); };
  // #218: cả bản đồ boss (Lõi Tinh Đấu: không có hồn thú thường, tự săn chỉ để đánh boss thế giới).
  if (room.map.kind !== "hunt" && room.map.kind !== "boss") return deny("chỉ tự săn được ở bản đồ săn hoặc bản đồ boss.");
  if (p.dead) return deny("đã gục ngã.");
  if (d.absorbing) return deny("đang hấp thụ hồn hoàn.");
  if (d.travelCast) return deny("đang đi cổng / truyền tống.");
  if (room.map.inSafe(p.x, p.y)) return deny("đang ở vùng an toàn, ra bãi săn rồi bật.");
  if (d.target) return deny("đang khoá mục tiêu (bấm × hoặc Esc để bỏ khoá; khoá ưu tiên hơn tự săn).");
  if (d.autoUsed >= AUTO_DAILY_SECS && d.autoBonus <= 0) return deny(`hôm nay đã treo đủ ${autoTimeText(AUTO_DAILY_SECS)}.`);
  if (bagUsed(d.bag) >= d.bagSlots && !room.autoSell(id)) return deny(`túi đồ đã đầy (${d.bagSlots} ô)${d.sellCfg.on ? ", không còn món nào hợp bộ lọc tự bán" : ""}.`);
  const grid = room.interest.players, cell = grid.cellOf(p.x, p.y);
  let n = 0; for (const o of room.pdata.values()) if (o.auto && grid.cellOf(o.auto.anchor.x, o.auto.anchor.y) === cell) n++;
  if (n >= AUTO_MAX_PER_CELL) return deny(`chỗ này đã có ${n} người treo, hãy sang chỗ khác.`);
  d.auto = new AutoHunter(room, id, { x: p.x, y: p.y }, d.autoCfg); p.auto = true;
  // Nợ nhịp (AUTO_PACE) còn lại của lượt trước, giảm theo thời gian thật: tắt rồi bật lại không xóa nợ (lách trần tốc độ tự săn).
  d.auto.pace = Math.max(0, d.autoPace[0] - (Date.now() - d.autoPace[1]) / 1000); d.autoSold0 = [d.soldN, d.soldCoins];
  // Đang giữ phím đi thì bỏ hướng đó và tăng `seq` (như hook goto) để client đang dự đoán biết input của nó đã bị bỏ và gửi lại;
  // gửi lại hướng khác 0 là tự di chuyển nên tự săn tắt ngay (tay ưu tiên).
  if (Math.hypot(d.input.x, d.input.y) > MOVE_DEAD) { p.seq = (p.seq + 1) >>> 0; p.seqT = 0; }
  room.applyInput(d, 0, 0, false);
  const where = d.autoCfg.scope === "near" ? `quanh đây (${d.autoCfg.radius} ô)` : "khắp bản đồ";
  room.log(id, `Bật tự động: săn ${where}, còn ${autoTimeText(autoLeft(d.autoUsed, d.autoBonus))} treo. Tự đi / đánh hoặc phím T để tắt.`, "#86e0b0");
  // #218: bản đồ boss không có hồn thú thường: chưa có boss thì chỉ đi dạo chờ, vẫn tính giờ treo.
  if (room.map.kind === "boss" && !room.autoBosses().length)
    room.log(id, "Bản đồ này chưa có boss: tự động chỉ đi dạo chờ boss xuất hiện, vẫn tính giờ treo.", "#ffb35c");
  sendAuto(room, id);
}

/** Dừng tự săn của `id` (nếu đang chạy) với lý do `why`: đứng yên, lưu giờ treo trong chuỗi lưu, báo người chơi kèm tổng kết (Auto 2). */
export function autoStop(room: MapRoom, id: string, why: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!d?.auto) return;
  const sum = d.auto.summary(d), sold: [number, number] = [d.soldN - d.autoSold0[0], d.soldCoins - d.autoSold0[1]];
  if (sold[0] > 0) sum.sold = sold; // tự bán trong lượt (#216); Hồn Tệ đã nằm trong sum.coins
  d.autoPace = [d.auto.pace, Date.now()]; d.auto = null; if (p) p.auto = false;
  room.applyInput(d, 0, 0, false);
  d.autoDirty = true; room.chain(d, () => flushAuto(room, d));
  room.log(id, `Đã dừng tự động: ${why}`, "#ffb35c");
  sendAuto(room, id, why, sum);
}

/**
 * Tin riêng `auto`: đang bật không, giây treo còn lại (phần còn của hôm nay cộng quỹ Ủy Thác Lệnh), tối đa mỗi ngày, quỹ cộng thêm,
 * cài đặt, lý do vừa dừng / từ chối và tổng kết lượt vừa dừng (nếu có).
 */
export function sendAuto(room: MapRoom, id: string, why?: string, sum?: AutoSummary) {
  const d = room.pdata.get(id); if (!d) return;
  room.clients.getById(id)?.send("auto", { on: !!d.auto, left: autoLeft(d.autoUsed, d.autoBonus), max: AUTO_DAILY_SECS, bonus: Math.floor(d.autoBonus),
    cfg: d.autoCfg, ...(why ? { why } : {}), ...(sum ? { sum } : {}), ...(room.map.kind === "hunt" ? { hint: autoHintOf(room, id) } : {}) });
}
/** Gợi ý vùng / khoảng niên hạn hợp sức (AH4, #611) cho võ hồn ra trận của `id` ở bản đồ này (mọi vùng săn có khai báo niên hạn). */
export function autoHintOf(room: MapRoom, id: string): AutoHint | undefined {
  const d = room.pdata.get(id), p = room.state.players.get(id); if (!d || !p) return undefined;
  // Cùng chỉ số võ hồn thì giữ kết quả lần trước: tin `auto` vượt nhịp vẫn được trả lời (sendAuto), không để mỗi tin chạy lại offlineFight (vùng × loài × tìm nhị phân).
  const pw = room.offlinePower(d, p), key = `${pw.atk}|${pw.crit}|${pw.critMult}|${pw.maxHp}|${pw.def}`;
  if (d.autoHintC?.key === key) return d.autoHintC.hint;
  const all = BEASTS.map((b) => b.id);
  const hint = autoHint(pw, room.map.zones.filter((z) => z.years).map((z) =>
    ({ name: z.name, years: z.years!, species: z.beasts.length ? z.beasts.map((b) => BEASTS[b.species].id) : all })));
  d.autoHintC = { key, hint };
  return hint;
}

/** Dòng tự săn để lưu (cài đặt, ngày, giờ đã treo, quỹ cộng thêm; làm tròn 0,1 giây). */
export function autoRow(d: PData): AutoRow {
  return { settings: d.autoCfg, day: d.autoDay, used: Math.round(d.autoUsed * 10) / 10, bonus: Math.round(d.autoBonus * 10) / 10 };
}

/**
 * Dùng Ủy Thác Lệnh (Auto 2): cộng `def.auto` giây vào quỹ giờ treo cộng thêm, tối đa AUTO_BONUS_MAX (đầy thì không dùng, lệnh còn).
 * Túi đã bớt lệnh và quỹ mới ghi cùng một transaction (saveAutoBag) trong chuỗi lưu.
 */
export function useAutoToken(room: MapRoom, id: string, d: PData, it: Item, def: ItemDef) {
  const add = def.auto ?? 0;
  if (d.autoBonus + add > AUTO_BONUS_MAX)
    return room.log(id, `Giờ treo cộng thêm đã có ${autoTimeText(d.autoBonus)}, tối đa ${autoTimeText(AUTO_BONUS_MAX)}: dùng bớt rồi hãy dùng ${def.name}.`, "#ffb35c");
  const day = room.today(); if (day !== d.autoDay) { d.autoDay = day; d.autoUsed = 0; }
  room.takeItem(d, it, 1);
  d.autoBonus += add;
  const p = room.state.players.get(id);
  if (p) room.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 22, col: def.col });
  room.log(id, `Dùng ${def.name}: +${autoTimeText(add)} treo tự săn (cộng thêm còn ${autoTimeText(d.autoBonus)}; tổng còn ${autoTimeText(autoLeft(d.autoUsed, d.autoBonus))}).`, def.col);
  room.sendBag(id); sendAuto(room, id);
  room.chain(d, async () => {
    d.autoDirty = false;
    try { await store.saveAutoBag(d.accountId, autoRow(d), room.bagSnapshot(d)); }
    catch (e) { d.autoDirty = true; d.bagDirty = true; throw e; }
  });
}

/** Ghi cài đặt và giờ treo tự săn nếu đổi từ lần trước (chỉ gọi trong chuỗi lưu). Lỗi thì ghi log, đánh dấu để lần sau ghi lại. */
export async function flushAuto(room: MapRoom, d: PData) {
  if (!d.autoDirty) return;
  d.autoDirty = false;
  try { await store.saveAuto(d.accountId, autoRow(d)); }
  catch (e) { d.autoDirty = true; console.error(`Lưu tự săn của tài khoản #${d.accountId} thất bại`, e); }
}

// ---------- Ủy thác offline (Auto 3, mục 5.13 "Ủy thác offline"; công thức ở shared/data.ts, mục "Ủy thác offline") ----------
/** Vùng săn nơi hồn sư `id` đang đứng, nếu thoát ở đây thì được ủy thác: bản đồ săn, ngoài vùng an toàn, không gục, vùng có hồn thú. */
export function offlineZone(room: MapRoom, id: string): Zone | null {
  const p = room.state.players.get(id); if (!p || p.dead || room.map.kind !== "hunt" || room.map.inSafe(p.x, p.y)) return null;
  return room.map.zones.find((z) => z.count > 0 && p.x >= z.x0 && p.x < z.x1 && p.y >= z.y0 && p.y < z.y1) ?? null;
}

/**
 * Vào game: lấy và xóa lần ủy thác offline của tài khoản (store.takeOffline, nên một lần thoát chỉ nhận một lần), rồi tính thưởng
 * theo thời gian vắng mặt (đồng hồ server) bằng công thức, không đụng thế giới: giây được tính chia theo ngày giờ Việt Nam, mỗi ngày
 * trong phần còn lại của quỹ AUTO_DAILY_SECS (chung với tự săn online), hết thì dùng tiếp quỹ giờ cộng thêm của Ủy Thác Lệnh (Auto 2),
 * tổng tối đa OFFLINE.maxSecs (offlineSplit). Mỗi con: niên hạn và
 * loài tung như hồn thú của vùng, thời gian hạ theo offlineFight (chỉ số võ hồn ra trận lúc vào); kinh nghiệm, Hồn Tệ, mảnh, tiên thảo,
 * hồn cốt / hồn hạch (theo bộ lọc tự săn `bone` / `core`), hồn hoàn (từ `ring` năm, tối đa OFFLINE.rings) như hạ tay. Túi đầy thì dừng
 * như tự săn (riêng trang bị rơi vào túi đầy thì bị bỏ, không dừng); quỹ hôm nay chỉ trừ phần đã săn. Chỉ gọi trong chuỗi lưu (onJoin xếp vào); ghi DB bằng write() ngay sau đó, gửi tin riêng
 * `offline` (bảng nhận thưởng). Vắng dưới OFFLINE.minSecs hoặc vùng không còn (đổi bản đồ) thì bỏ.
 */
export async function claimOffline(room: MapRoom, id: string) {
  const d0 = room.pdata.get(id); if (!d0 || room.map.kind === "arena") return;
  const row = await store.takeOffline(d0.accountId);
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!row || !p || !d) return;
  const away = Math.max(0, Math.floor((Date.now() - row.at) / 1000)), def = MAPS[row.mapId];
  const zone = def?.kind === "hunt" ? loadMap(row.mapId).zones.find((z) => z.name === row.zone && z.count > 0) : undefined;
  if (away < OFFLINE.minSecs || !zone) return;
  const today = room.today(); if (today !== d.autoDay) { d.autoDay = today; d.autoUsed = 0; d.autoDirty = true; }
  // Auto 2: hết quỹ miễn phí của ngày thì dùng tiếp quỹ giờ cộng thêm (Ủy Thác Lệnh) còn lại lúc nhận (đã trừ phần tự săn online tiêu).
  const parts = offlineSplit(bossNow() + room.dayShift * 86400000, away, row.day, row.used, d.autoBonus);
  const secs = Math.floor(parts.reduce((a, x) => a + x.secs, 0));
  const pw = room.offlinePower(d, p);
  const cfg = d.autoCfg, lv = p.level, got = new Map<string, number>(), rings: number[] = [];
  const add = (name: string, n: number) => got.set(name, (got.get(name) ?? 0) + n);
  let t = 0, kills = 0, weak = 0, xp = 0, coins = 0, full = false, equipLost = 0;
  // Mỗi vòng một con; mỗi con tốn ít nhất OFFLINE.seek giây nên vòng lặp tối đa secs / seek lần.
  while (!full) {
    const years = offlineYears(zone), species = offlineSpecies(zone), beast = BEASTS[species]?.id ?? "";
    const f = offlineFight(pw, years, beast);
    if (t + f.secs > secs) break;
    t += f.secs;
    if (!f.ok) { weak++; continue; }
    kills++;
    xp += beastStats(years).xp * xpLevelScale(lv, beastLevel(years));
    const [lo, hi] = BEAST_COIN[tierOfYears(years)] ?? BEAST_COIN[0]; coins += lo + Math.floor(Math.random() * (hi - lo + 1));
    // Mảnh, tiên thảo vào thẳng túi như khi hạ tay; hồn cốt, hồn hạch, hồn hoàn theo bộ lọc nhặt của tự săn.
    if (def.shards.length && Math.random() < shardChance(years)) {
      const code = shardCode(def.shards[Math.floor(Math.random() * def.shards.length)]), n = room.addItem(d, code, SHARD_QTY);
      if (n) add(itemDef(code)?.name ?? code, n);
      if (n < SHARD_QTY) full = true;
    }
    const hc = herbChance(row.mapId, zone.name);
    if (hc > 0 && Math.random() < hc) {
      const h = HERBS[Math.floor(Math.random() * HERBS.length)];
      if (room.addItem(d, h.id, 1)) add(h.name, 1); else full = true;
    }
    // E2: đá vào túi (đầy thì dừng như mảnh), trang bị vào túi (không rơi đất khi vắng mặt); trang bị chưa có bộ lọc, bán hay phân giải
    // nên túi đầy thì bỏ món đó (đếm ở `equipLost`), không dừng cả lượt săn.
    for (const e of rollEquipDrop(0, row.mapId, room.equipRng(d), 0)) {
      if (e.kind === "stone") { const n = room.addItem(d, e.code, e.qty); if (n) add(itemDef(e.code)?.name ?? e.code, n); if (n < e.qty) full = true; }
      else { const it = room.addEquip(d, e.item); if (it) add(room.itemLabel(it), 1); else equipLost++; }
    }
    if (cfg.bone && Math.random() < boneChance(years)) {
      const it = room.addBone(d, years, beast, BONE_SLOTS[Math.floor(Math.random() * BONE_SLOTS.length)].id);
      if (it) add(room.itemLabel(it), 1); else full = true;
    }
    if (cfg.core && Math.random() < coreChance(years)) {
      const c = rollCore(years, def.cores, Math.random);
      if (c.stars >= cfg.coreStar) { const it = room.addCore(d, c.stars, c.data); if (it) add(room.itemLabel(it), 1); else full = true; } // Auto 2: lọc theo sao
    }
    if (cfg.ring >= 0 && years >= cfg.ring && rings.length < OFFLINE.rings) { if (room.addRing(d, years)) rings.push(years); else full = true; }
  }
  // Trừ đúng phần đã săn theo thứ tự thời gian (offlineSplit xếp từ cũ tới mới): phần miễn phí của hôm nay vào quỹ hôm nay (quỹ các
  // ngày trước không còn dùng), phần lấy từ quỹ cộng thêm (Auto 2) vào quỹ cộng thêm; dừng sớm thì trừ ít hơn.
  let rest = t, charge = 0, bonusUsed = 0;
  for (const x of parts) {
    const n = Math.max(0, Math.min(x.secs, rest)); rest -= n;
    if (x.bonus) bonusUsed += n; else if (x.day === today) charge += n;
  }
  if (charge > 0) { d.autoUsed = Math.min(AUTO_DAILY_SECS, d.autoUsed + charge); d.autoDirty = true; }
  if (bonusUsed > 0) { d.autoBonus = Math.max(0, d.autoBonus - bonusUsed); d.autoDirty = true; }
  if (coins) room.addCoin(d, coins);
  p.kills += kills;
  // Kinh nghiệm chia cho đội như rewardKill (so cấp lúc vào, một lần cho cả quãng); bình cảnh thì dừng như khi săn tay.
  if (xp > 0) for (const r of d.team) {
    const v = d.owned.find((o) => o.rowId === r); if (!v) continue;
    if (v === d.ch) room.addXp(id, Math.round(xp * XP_SHARE_ACTIVE)); else room.benchXp(id, v, Math.round(xp * XP_SHARE_BENCH));
  }
  const items = [...(rings.length ? [{ name: `Hồn hoàn (cao nhất ${formatYears(Math.max(...rings))})`, qty: rings.length }] : []),
    ...[...got].map(([name, qty]) => ({ name, qty }))];
  const stop = full ? "túi đầy" : !kills && weak ? "vùng quá sức" : !secs ? "hết giờ treo" : undefined;
  await room.write(id);
  const c = room.clients.getById(id); if (!c) return;
  room.sendBag(id); room.sendVohons(c); room.sendSquad(id, true); sendAuto(room, id);
  d.offMsg = { away, secs, used: Math.round(t), map: def.name, zone: zone.name, kills, weak, xp: Math.round(xp), coins,
    items, left: autoLeft(d.autoUsed, d.autoBonus), max: AUTO_DAILY_SECS, bonus: Math.floor(d.autoBonus), bonusUsed: Math.round(bonusUsed),
    ...(equipLost ? { equipLost } : {}), ...(stop ? { stop } : {}) };
  sendOffline(room, id);
  room.log(id, `Ủy thác ở ${zone.name} (${def.name}): vắng ${autoTimeText(away)}, tính ${autoTimeText(secs)}, hạ ${kills} hồn thú, ` +
    `${formatHonTe(coins)} Hồn Tệ${stop ? ` (dừng: ${stop})` : ""}.`, "#86e0b0");
}

/** Gửi bảng nhận thưởng ủy thác (tin riêng `offline`) một lần, khi đã tính xong và client đã xin. */
export function sendOffline(room: MapRoom, id: string) {
  const d = room.pdata.get(id), c = room.clients.getById(id); if (!d?.offMsg || !d.offAsk || !c) return;
  c.send("offline", d.offMsg); d.offMsg = null;
}

/** Niên hạn một hồn thú thường của vùng `z` khi ủy thác (như spawnBeast, không có hồn thú 10 vạn năm). */
export function offlineYears(z: Zone) {
  if (z.years) return rollYears(z.years[0], Math.max(z.years[0], Math.min(z.years[1], MAX_YEARS - 1)), Math.random());
  let r = Math.random(), tier = 0;
  for (let i = 0; i < z.weights.length; i++) { r -= z.weights[i]; if (r <= 0) { tier = i; break; } }
  const [lo, hi] = tierBand(Math.min(tier, TIERS.length - 2));
  return rollYears(lo, hi, Math.random());
}

/** Loài (chỉ số BEASTS) một hồn thú của vùng `z` theo trọng số `beasts` (như pickSpecies). */
export function offlineSpecies(z: Zone) {
  const list = z.beasts.length ? z.beasts : BEASTS.map((_, i) => ({ species: i, w: 1 }));
  let r = Math.random() * list.reduce((a, b) => a + b.w, 0);
  for (const b of list) { r -= b.w; if (r <= 0) return b.species; }
  return list[list.length - 1].species;
}
