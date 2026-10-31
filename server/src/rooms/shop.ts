// Cửa hàng / thương nhân (GAME_DESIGN.md mục 5.7, 9.8): mua, bán, mua lại, đổi mảnh võ hồn, tự bán từ xa, mở rộng túi, tách khỏi MapRoom.ts (#702, bước 5).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / social.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.chain`, `room.saveTrade`.
// MapRoom chỉ chuyển tiếp (đăng ký `onMessage` giữ nguyên ở đó; ArenaRoom vẫn override `forgetBuyback`). `shopFor`, `saveTrade`, `bagRoom` còn ở MapRoom.
import { randomUUID } from "node:crypto";
import { itemDef, formatHonTe, shopOf, SHOP_MAX_QTY, sellPrice, BUYBACK_MAX, AUTO_SELL_BUYBACK, AUTO_SELL_FREE, autoSellable, parseSell, shopExpands, npcDef,
  bagExpandCost, BAG_MAX_SLOTS, BAG_EXPAND, SHARD_BUY, ARENA_SHARDS, VOHON, vohonIndex, shardCode, shardBuyCost } from "../../../shared/data.ts";
import { store, type SoldRow } from "../db.ts";
import { presenceBackend } from "../presence.ts";
import { newItem, bagUsed } from "./items.ts";
import { type MapRoom, type PData } from "./MapRoom.ts";
import { editBuyback, claimBuyback } from "./presenceState.ts";
import { buybacks, type Buyback } from "./procState.ts";
import { buybackKey, CLAIM_BUSY, claimHeld } from "./common.ts";

/**
 * Mua `rawQty` món `rawCode` ở thương nhân (giá đồng mỗi món theo bảng hàng của thương nhân đứng gần, shopOf: SHOP trong thành,
 * CAMP_SHOP ở trại cổng): phải đứng gần thương nhân, mã có trong bảng hàng đó, 1..SHOP_MAX_QTY món, đủ Hồn Tệ và túi đủ chỗ cho cả
 * số món đó (thiếu thì từ chối hết, không trừ tiền). Server tính giá; ghi DB qua chuỗi lưu.
 */
export function buyItem(room: MapRoom, id: string, rawCode: unknown, rawQty: unknown, rawNpc?: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const npc = room.shopFor(id, d, rawNpc, "mua");
  if (typeof npc === "string") return warn(npc);
  const row = shopOf(npc.id).find((s) => s.code === rawCode), def = row && itemDef(row.code);
  if (!row || !def) return warn("Thương nhân không bán món này.");
  const qty = Number.isInteger(rawQty) ? (rawQty as number) : 0;
  if (qty < 1 || qty > SHOP_MAX_QTY) return warn(`Mỗi lần mua từ 1 đến ${SHOP_MAX_QTY} món.`);
  const cost = row.price * qty;
  if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: ${qty} ${def.name} giá ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
  if (room.bagRoom(d, row.code) < qty) return warn(`Túi đồ không đủ chỗ cho ${qty} ${def.name} (${d.bagSlots} ô): bỏ hoặc bán bớt đồ trước.`);
  d.honTe -= cost; d.bagDirty = true;
  room.addItem(d, row.code, qty);
  room.log(id, `Mua ${qty} ${def.name}: −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)}).`, def.col);
  room.sendBag(id);
  room.saveTrade(id, d);
}

/** Số mảnh đã đổi ở Thương hội hôm nay (đã được DB xác nhận); sang ngày mới (giờ Việt Nam) thì về 0 (#282). */
export function shardBuyToday(room: MapRoom, d: PData) {
  if (d.shardBuy.day !== room.today()) { d.shardBuy.day = room.today(); d.shardBuy.n = 0; }
  return d.shardBuy.n;
}
/** Tin riêng "shardinfo" (#282): số mảnh đã đổi hôm nay (kể cả lần đang chờ DB) và trần ngày; client tính giá bằng shardBuyPrice. */
export function sendShardInfo(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d) return;
  room.clients.getById(id)?.send("shardinfo", { n: room.shardBuyToday(d) + d.shardBuy.pend, daily: SHARD_BUY.daily });
}

/**
 * Đổi `rawQty` mảnh võ hồn `rawVohon` ở Thương hội Thiên Đấu (#282, mục 5.7): phải đứng cạnh đúng NPC SHARD_BUY.npc, ngoài giao
 * chiến (shopFor), võ hồn trong ARENA_SHARDS (không bao giờ bán mảnh UR), không vượt SHARD_BUY.daily mảnh hôm nay, đủ Hồn Tệ và
 * túi đủ chỗ cho cả số mảnh (thiếu thì từ chối hết). Giá tăng dần theo số mảnh đã đổi trong ngày (shardBuyCost). Như rương thú
 * vương (grantChest): giữ chỗ ngay (`pend`, claimBusy chặn bán / bỏ đồ), tới lượt trong chuỗi lưu mới kiểm lại, trừ tiền, cho mảnh
 * vào túi và ngay đó tăng lượt cùng ghi túi (cả Hồn Tệ) trong một transaction (store.claimBoss). Giá tính theo số lượt đã được DB
 * xác nhận lúc tới lượt, nên bấm dồn không sai giá hay vượt trần. DB báo hết lượt hoặc lỗi thì trả lại tiền và lấy lại mảnh.
 */
export function buyShards(room: MapRoom, id: string, rawVohon: unknown, rawQty: unknown, rawNpc: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); room.sendShardInfo(id); };
  const npc = room.shopFor(id, d, rawNpc, "đổi mảnh");
  if (typeof npc === "string") return warn(npc);
  if (npc.id !== SHARD_BUY.npc) return warn("Chỉ Chưởng quỹ Thương hội Thiên Đấu (Thiên Đấu Thành) đổi mảnh võ hồn.");
  const vh = typeof rawVohon === "string" && ARENA_SHARDS.includes(rawVohon) ? VOHON[vohonIndex(rawVohon)] : undefined;
  const def = vh && itemDef(shardCode(vh.id));
  if (!vh || !def) return warn("Thương hội chỉ đổi mảnh võ hồn SR / SSR (không có mảnh UR).");
  const K = SHARD_BUY, left = K.daily - room.shardBuyToday(d) - d.shardBuy.pend;
  if (left <= 0) return warn(`Hôm nay đã đổi đủ ${K.daily}/${K.daily} mảnh ở Thương hội. Lượt mới lúc 00:00 giờ Việt Nam.`);
  const qty = Number.isInteger(rawQty) ? (rawQty as number) : 0;
  if (qty < 1 || qty > left) return warn(`Mỗi lần đổi từ 1 đến ${left} mảnh (hôm nay còn ${left}/${K.daily}).`);
  const need = shardBuyCost(K.daily - left, qty);
  if (d.honTe < need) return warn(`Không đủ Hồn Tệ: ${qty} ${def.name} giá ${formatHonTe(need)}, đang có ${formatHonTe(d.honTe)}.`);
  if (room.bagRoom(d, def.id) < qty) return warn(`Túi đồ không đủ chỗ cho ${qty} ${def.name} (${d.bagSlots} ô): bỏ hoặc bán bớt đồ trước.`);
  const day = room.today();
  d.shardBuy.pend += qty; d.claimBusy++;
  room.chain(d, async () => {
    // Tới lượt: kiểm lại theo số lượt DB đã xác nhận (các lần đổi trước đã xong), rồi trừ tiền + cho mảnh ngay trước khi chụp túi.
    if (room.today() !== day) return warn("Đã sang ngày mới: mở lại trang Thương hội để xem giá.");
    const done = room.shardBuyToday(d), cost = shardBuyCost(done, qty);
    if (done + qty > K.daily) return warn(`Hôm nay chỉ còn ${Math.max(0, K.daily - done)}/${K.daily} mảnh ở Thương hội.`);
    if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: ${qty} ${def.name} giá ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
    if (room.bagRoom(d, def.id) < qty) return warn(`Túi đồ không đủ chỗ cho ${qty} ${def.name} (${d.bagSlots} ô): bỏ hoặc bán bớt đồ trước.`);
    d.honTe -= cost; d.bagDirty = true; room.addItem(d, def.id, qty);
    const takeBack = () => {
      d.honTe += cost; d.bagDirty = true;
      let n = qty;
      for (const x of d.bag.filter((i) => i.code === def.id && i.vohonId === null).reverse()) { // cả ô vừa khoá trong lúc chờ
        const k = Math.min(n, x.qty); room.takeItem(d, x, k); n -= k; if (!n) break;
      }
    };
    let n: number | null;
    try { n = await store.claimBoss(d.accountId, day, K.claimKind, K.daily, room.bagSnapshot(d), qty); }
    catch (e) { takeBack(); warn(`Không lưu được lần đổi ${def.name}, thử lại sau (không mất Hồn Tệ).`); throw e; }
    if (n === null) {
      takeBack(); d.shardBuy.n = await store.bossClaims(d.accountId, day, K.claimKind).catch(() => K.daily);
      return warn(`Hôm nay đã đổi đủ ${K.daily}/${K.daily} mảnh ở Thương hội.`);
    }
    if (d.shardBuy.day === day) d.shardBuy.n = n;
    room.log(id, `Đổi ${qty} ${def.name} ở Thương hội: −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)}), hôm nay ${n}/${K.daily} mảnh.`, vh.col);
  }).then(() => {
    d.shardBuy.pend -= qty; d.claimBusy--;
    if (room.pdata.get(id) === d) { room.sendBag(id); room.sendShardInfo(id); }
  });
}

/**
 * Bán cho thương nhân `rawQty` món (thiếu: cả ô) ở ô `rawId` trong túi của chính người gửi: phải đứng gần thương nhân; không bán
 * đồ đang gắn trên võ hồn (hồn cốt, hồn hạch), hồn hoàn đang hấp thụ, đan và rương (sellPrice null). Giá do
 * server tính (sellPrice theo niên hạn / sao / độ hiếm); ghi DB qua chuỗi lưu.
 */
export function sellItem(room: MapRoom, id: string, rawId: unknown, rawQty: unknown, rawNpc?: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const npc = room.shopFor(id, d, rawNpc, "bán");
  if (typeof npc === "string") return warn(npc);
  const it = typeof rawId === "string" ? d.bag.find((i) => i.id === rawId) : undefined;
  if (!it) return warn("Không có vật phẩm này trong túi đồ.");
  if (it.vohonId !== null) return warn(`${room.itemLabel(it)} đang gắn trên võ hồn: tháo ra trước mới bán được.`);
  if (it.locked) return warn(`${room.itemLabel(it)} đang khoá: mở khoá ở túi đồ rồi mới bán được.`);
  if (d.absorbing?.itemId === it.id) return warn("Đang hấp thụ hồn hoàn này, không bán được.");
  if (claimHeld(d)) return warn(CLAIM_BUSY); // #165: phần thưởng boss đang chờ DB xác nhận lượt
  const price = sellPrice(it);
  if (price === null) return warn(`Thương nhân không mua ${itemDef(it.code)?.name ?? "vật phẩm lạ"}.`);
  const qty = rawQty === undefined || rawQty === null ? it.qty : Number.isInteger(rawQty) ? (rawQty as number) : 0;
  if (qty < 1 || qty > it.qty) return warn(`Số lượng bán phải từ 1 đến ${it.qty}.`);
  const label = room.itemLabel({ ...it, qty }), gain = price * qty;
  // Thương nhân giữ bản sao đúng món vừa bán (chỉ số, cấp cường hóa, số lượng) để mua lại (9.8); mới nhất trước, tối đa BUYBACK_MAX.
  const entry: Buyback = { key: randomUUID(), item: { ...it, qty, vohonId: null, stats: it.stats == null ? null : structuredClone(it.stats) }, price };
  editBuyback(d.accountId, (cur) => [entry, ...cur].slice(0, BUYBACK_MAX)).then(() => room.sendBag(id), (err) => console.error("Không lưu được món bán vào danh sách mua lại", err));
  room.takeItem(d, it, qty); d.lockIds.add(it.id);
  room.addCoin(d, gain);
  room.log(id, `Bán ${label}: +${formatHonTe(gain)} (còn ${formatHonTe(d.honTe)}).`, "#f2c84b");
  room.sendBag(id);
  room.saveTrade(id, d);
}

/**
 * Mua lại đồ vừa bán nhầm (bước 9.8): món `rawKey` trong danh sách mua lại của chính tài khoản (buybacks), phải đứng gần thương
 * nhân, đủ Hồn Tệ cho đúng giá đã bán và túi đủ chỗ (đồ không gộp cần một ô trống). Món về túi đúng như lúc bán (chỉ số, cấp
 * cường hóa) với id mới; ghi DB qua chuỗi lưu như mua / bán. Tự bán đang bật mà bộ lọc sẽ bán món này thì món về túi ở trạng thái
 * khoá (#216), để nhịp sau không tự bán lại ngay khi túi vẫn dưới AUTO_SELL_FREE ô trống.
 */
export async function buybackItem(room: MapRoom, id: string, rawKey: unknown, rawNpc?: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const npc = room.shopFor(id, d, rawNpc, "mua lại");
  if (typeof npc === "string") return warn(npc);
  // Đồ bán tay (RAM, BUYBACK_MAX món) hoặc đồ tự bán (#216, lưu DB, AUTO_SELL_BUYBACK món): cùng một nút mua lại, cùng giá đã nhận.
  const list = buybacks.get(d.accountId) ?? [], key = typeof rawKey === "string" ? rawKey : undefined;
  const e = key === undefined ? undefined : list.find((x) => x.key === key) ?? d.sold.find((x) => x.key === key);
  if (!e) return warn(`Thương nhân không còn giữ món này (chỉ giữ ${BUYBACK_MAX} món bán gần nhất, mất khi rời game; ${AUTO_SELL_BUYBACK} món tự bán gần nhất).`);
  const def = itemDef(e.item.code), label = room.itemLabel(e.item), cost = e.price * e.item.qty;
  if (!def) return warn("Vật phẩm không tồn tại.");
  if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: mua lại ${label} giá ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
  const lock = d.sellCfg.on && autoSellable({ ...e.item, locked: false, vohon: null }, d.sellCfg);
  if (def.stack > 1 ? room.bagRoom(d, def.id, lock) < e.item.qty : bagUsed(d.bag) >= d.bagSlots)
    return warn(`Túi đồ không đủ chỗ để mua lại ${label} (${d.bagSlots} ô): bỏ hoặc bán bớt đồ trước.`);
  if (list.includes(e)) {
    // Đồ bán tay: lấy khỏi danh sách ở presence trước khi trao (hai tiến trình / hai lần bấm không cùng nhận một món); sau await kiểm lại.
    const claimed = await claimBuyback(d.accountId, e.key).catch((err) => { console.error("Không lấy được món mua lại trong presence", err); return null; });
    if (!claimed) return warn(`Thương nhân không còn giữ món này (chỉ giữ ${BUYBACK_MAX} món bán gần nhất, mất khi rời game; ${AUTO_SELL_BUYBACK} món tự bán gần nhất).`);
    const fits = def.stack > 1 ? room.bagRoom(d, def.id, lock) >= e.item.qty : bagUsed(d.bag) < d.bagSlots;
    if (room.pdata.get(id) !== d || d.travelling || d.honTe < cost || !fits) {
      await editBuyback(d.accountId, (cur) => [claimed, ...cur.filter((x) => x.key !== claimed.key)].slice(0, BUYBACK_MAX)).catch((err) => console.error("Không trả món mua lại về presence", err));
      return warn("Không mua lại được lúc này, thử lại.");
    }
  }
  d.sold = d.sold.filter((x) => x !== e);
  d.honTe -= cost; d.bagDirty = true;
  if (def.stack > 1) room.addItem(d, def.id, e.item.qty, lock);
  else {
    const it = newItem(def, 1, e.item.years);
    it.stars = e.item.stars; it.enhance = e.item.enhance; it.stats = e.item.stats == null ? null : structuredClone(e.item.stats);
    if (lock) it.locked = true;
    d.bag.push(it);
  }
  room.log(id, `Mua lại ${label}: −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)})${lock ? ", đã khoá để không bị tự bán lại" : ""}.`, def.col);
  room.sendBag(id);
  room.saveTrade(id, d);
}

/** Xóa danh sách mua lại của tài khoản khi rời game (9.8). ArenaRoom không xóa: rời sân là về bản đồ cũ. */
export function forgetBuyback(accountId: number) { buybacks.delete(accountId); void presenceBackend.delete(buybackKey(accountId)).catch((e) => console.error(`Không xóa được danh sách mua lại của #${accountId}`, e)); }


/** Bộ lọc tự bán (bảng Túi đồ): server kẹp bằng parseSell, lưu cùng túi đồ qua chuỗi lưu; bật thì xét tự bán ngay ở nhịp tới. */
export function setAutoSell(room: MapRoom, id: string, raw: unknown) {
  const d = room.pdata.get(id); if (!d || d.travelling) return;
  const was = d.sellCfg.on;
  d.sellCfg = parseSell(raw); d.bagDirty = true;
  if (was !== d.sellCfg.on) room.log(id, d.sellCfg.on
    ? `Bật tự bán: túi còn dưới ${AUTO_SELL_FREE} ô trống thì bán từ xa đồ hợp bộ lọc, đúng giá thương nhân trong thành.` : "Tắt tự bán.", "#86e0b0");
  room.sendBag(id);
  room.saveTrade(id, d);
}

/**
 * Tự bán từ xa (#216): bật tự bán và túi còn dưới AUTO_SELL_FREE ô trống thì bán mọi món hợp bộ lọc
 * (autoSellable) với đúng giá thương nhân trong thành (sellPrice, 100%), không cần đứng gần thương nhân. Không bán khi đang đi cổng /
 * truyền tống, đang hấp thụ, đang chờ DB xử lý vật phẩm, trong sân đấu. Món đã bán vào danh sách mua lại AUTO_SELL_BUYBACK món (lưu DB
 * cùng túi). Trả về số ô đã giải phóng.
 */
export function autoSell(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d || !d.sellCfg.on || d.travelling || d.travelCast || d.absorbing || claimHeld(d) || d.shardBusy) return 0;
  if (room.map.kind === "arena" || d.bagSlots - bagUsed(d.bag) >= AUTO_SELL_FREE) return 0;
  const sold: SoldRow[] = [];
  let coins = 0, n = 0;
  for (const it of d.bag) {
    if (!autoSellable({ ...it, vohon: it.vohonId }, d.sellCfg)) continue;
    const price = sellPrice(it)!;
    sold.push({ key: randomUUID(), item: { ...it, vohonId: null, locked: false, stats: it.stats == null ? null : structuredClone(it.stats) }, price, at: Date.now() });
    coins += price * it.qty; n += it.qty;
  }
  if (!sold.length) return 0;
  const gone = new Set(sold.map((r) => r.item.id));
  d.bag = d.bag.filter((i) => !gone.has(i.id));
  d.sold = [...sold.reverse(), ...d.sold].slice(0, AUTO_SELL_BUYBACK);
  room.addCoin(d, coins);
  d.soldN += n; d.soldCoins += coins;
  console.log(`[tự bán] tài khoản #${d.accountId} ở ${room.state.mapId}: ${n} món (${gone.size} ô), +${coins} đồng`);
  const text = `Đã tự bán ${n.toLocaleString("vi-VN")} món, +${formatHonTe(coins)}`;
  room.log(id, `${text} (còn ${formatHonTe(d.honTe)}). Mua lại ${AUTO_SELL_BUYBACK} món gần nhất ở thương nhân.`, "#f2c84b");
  room.clients.getById(id)?.send("autosold", { n, coins, slots: gone.size });
  room.sendBag(id);
  room.saveTrade(id, d);
  return gone.size;
}

/**
 * Mở rộng túi ở thương nhân (bước 9.8): +BAG_EXPAND ô, tối đa BAG_MAX_SLOTS, giá theo lần mở (bagExpandCost). Phải đứng gần thương
 * nhân trong thành (shopExpands: thương nhân lưu động ở trại cổng không mở rộng túi) và đủ Hồn Tệ. Số ô lưu cùng túi đồ (`accounts.bag_slots`) qua chuỗi lưu.
 */
export function expandBag(room: MapRoom, id: string, rawNpc?: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const npc = room.shopFor(id, d, rawNpc, "mở rộng túi");
  if (typeof npc === "string") return warn(npc);
  if (!shopExpands(npc.id)) return warn(`${npcDef(npc.id)?.name ?? "Thương nhân"} không mở rộng túi: về thương nhân trong thành.`);
  const cost = bagExpandCost(d.bagSlots);
  if (cost === null) return warn(`Túi đồ đã mở rộng tối đa (${BAG_MAX_SLOTS} ô).`);
  if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: mở rộng túi giá ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
  const from = d.bagSlots;
  d.bagSlots = Math.min(BAG_MAX_SLOTS, d.bagSlots + BAG_EXPAND);
  d.honTe -= cost; d.bagDirty = true;
  room.log(id, `Mở rộng túi đồ: ${from} → ${d.bagSlots} ô, −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)}).`, "#f2c84b");
  room.sendBag(id);
  room.saveTrade(id, d);
}
