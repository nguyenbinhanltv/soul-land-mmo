// Túi đồ, vật phẩm và Hồn Tệ (GAME_DESIGN.md mục 5.7, bước 3.1): gửi túi (bag / bagd), thêm / bớt món, cộng đồng, sắp xếp, khoá / bỏ món, ảnh chụp túi để lưu, tách khỏi MapRoom.ts (#702, bước 11).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / shop.ts / travel.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.chain`, `room.saveTrade`.
// MapRoom chỉ chuyển tiếp (onMessage, tick, các miền khác gọi `room.sendBag` / `room.addItem` như cũ). `useItem`, `pickup`, `addRing` / `addBone` / `addEquip`, `rewardFits`, `giveItems` còn ở MapRoom.
import { itemDef, BEAST_COIN, STARTER_ITEMS } from "../../../shared/data.ts";
import { bagDiff } from "../../../shared/bagSync.ts";
import type { Item, Bag } from "../db.ts";
import { newItem, bagUsed, bumpItemClock, KIND_ORDER, ITEM_ORDER } from "./items.ts";
import { CLAIM_BUSY, claimHeld, buybacks, type MapRoom, type PData } from "./MapRoom.ts";

/** Ảnh chụp túi đồ và Hồn Tệ chưa lưu (bỏ đánh dấu `bagDirty`); undefined nếu không đổi gì từ lần lưu trước. */
export function unsavedBag(room: MapRoom, d: PData): Bag | undefined {
  const bag = d.bagDirty || d.tongPend.length ? room.bagSnapshot(d) : undefined;
  if (bag && d.tongPend.length) bag.tongPts = d.tongPend.map((t) => ({ ...t }));
  return bag;
}

/** Ảnh chụp cả túi đồ, Hồn Tệ và tiến độ nhiệm vụ (6.2; bỏ đánh dấu `bagDirty`), dù có đổi hay không. */
export function bagSnapshot(room: MapRoom, d: PData): Bag {
  d.bagDirty = false;
  return { honTe: d.honTe, slots: d.bagSlots, items: [...d.bag, ...d.gear].map((i) => ({ ...i, stats: i.stats == null ? null : structuredClone(i.stats) })),
    quests: [d.quest, ...d.chains, ...d.daily, ...d.tongTasks].map((q) => ({ ...q, prog: [...q.prog] })),
    sell: { ...d.sellCfg }, sold: d.sold.map((r) => ({ ...r, item: { ...r.item, stats: r.item.stats == null ? null : structuredClone(r.item.stats) } })) };
}

/**
 * Tin riêng "bag": mọi ô túi đồ, số ô tối đa, Hồn Tệ (đồng) và giây còn lại của hồi chiêu chung đan. Chỉ gửi cho chính chủ
 * (mục 6), không nằm trong state đồng bộ. Gửi khi client xin (`full`) và mỗi khi túi đổi; từ #215 lần đổi chỉ gửi tin "bagd" gồm
 * số ô, Hồn Tệ, hồi chiêu và phần túi đổi so với bản đã gửi (bagDiff), danh sách mua lại chỉ khi đổi.
 */
export function sendBag(room: MapRoom, id: string, full = false) {
  const d = room.pdata.get(id), c = room.clients.getById(id); if (!d || !c) return;
  room.sendGear(id, full || !d.bagSent);
  const items = d.bag.map((i) => ({ id: i.id, kind: i.kind, code: i.code, qty: i.qty, years: i.years, stars: i.stars, enhance: i.enhance, stats: i.stats, vohon: i.vohonId,
    ...(i.locked ? { lock: true } : {}) }));
  // Đồ vừa bán cho thương nhân, mua lại được (9.8): `price` là giá mỗi món đã nhận lúc bán.
  const buyback = (buybacks.get(d.accountId) ?? []).map(({ key, item: i, price }) => ({ key, kind: i.kind, code: i.code, qty: i.qty, years: i.years, stars: i.stars,
    enhance: i.enhance, stats: i.stats, price }));
  const head = { slots: d.bagSlots, honTe: d.honTe, cd: d.danCd }, bb = JSON.stringify(buyback);
  // Tự bán (#216): bộ lọc và các món tự bán gần nhất (mua lại ở thương nhân), chỉ gửi khi đổi như danh sách mua lại.
  const sold = d.sold.map(({ key, item: i, price, at }) => ({ key, kind: i.kind, code: i.code, qty: i.qty, years: i.years, stars: i.stars,
    enhance: i.enhance, stats: i.stats, price, at }));
  const auto = { sell: d.sellCfg, sold }, as = JSON.stringify(auto);
  if (full || !d.bagSent) {
    c.send("bag", { ...head, items, buyback, ...auto });
    d.bagSent = bagDiff(new Map(), items).next;
  } else {
    const { delta, next } = bagDiff(d.bagSent, items);
    c.send("bagd", { ...head, ...delta, ...(bb !== d.bagBuyback ? { buyback } : {}), ...(as !== d.sellSent ? auto : {}) });
    d.bagSent = next;
  }
  d.bagBuyback = bb; d.sellSent = as;
  if (d.sellCfg.on || d.sellCfg.salv > 0) d.sellCheck = true; // túi vừa đổi: nhịp tới xét tự bán (autoSell) và tự phân giải trang bị (autoSalvage)
  if (d.starterNote) {
    d.starterNote = false;
    const gift = STARTER_ITEMS.map((s) => `${s.qty} ${itemDef(s.code)?.name ?? s.code}`).join(", ");
    room.log(id, `Quà khởi đầu đã vào túi đồ: ${gift}. Nhấn B để mở túi.`, "#86e0b0");
  }
  room.dailyBag(id); // khảo hạch hằng ngày: mục tiêu nộp vật phẩm đếm theo túi
}

/**
 * Thêm `qty` món mã `code` vào túi: gộp vào ô cùng mã chưa đầy trước (đồ gộp được), rồi mở ô mới khi còn chỗ (`d.bagSlots`, từ 9.8 theo tài khoản).
 * Trả về số món đã nhận; phần dư khi túi đầy thì không nhận (nơi gọi quyết định báo gì). Không tự gửi tin "bag".
 * `locked` (#216): chỉ gộp vào ô cùng trạng thái khoá, ô mới mang trạng thái đó (đồ mới nhặt không gộp vào ô người chơi đã khoá).
 */
export function addItem(room: MapRoom, d: PData, code: string, qty: number, locked = false) {
  const def = itemDef(code); if (!def || !(qty > 0)) return 0;
  let left = qty;
  for (const it of d.bag) {
    if (left <= 0) break;
    if (it.code !== code || it.vohonId !== null || it.qty >= def.stack || !!it.locked !== locked) continue;
    const n = Math.min(left, def.stack - it.qty); it.qty += n; left -= n;
  }
  while (left > 0 && bagUsed(d.bag) < d.bagSlots) {
    const n = Math.min(left, def.stack), it = newItem(def, n); if (locked) it.locked = true;
    d.bag.push(it); left -= n;
  }
  if (left < qty) d.bagDirty = true;
  return qty - left;
}

/** Bớt `n` món ở ô `it`; hết thì bỏ ô. */
export function takeItem(room: MapRoom, d: PData, it: Item, n: number) {
  it.qty -= n;
  if (it.qty <= 0) d.bag = d.bag.filter((x) => x !== it);
  d.bagDirty = true;
}

/** Cộng `n` đồng Hồn Tệ vào túi của `d`, kẹp ở Number.MAX_SAFE_INTEGER (bagOk trong db.ts từ chối số lớn hơn); mọi chỗ cộng tiền đi qua đây (#165). */
export function addCoin(room: MapRoom, d: PData, n: number) {
  d.honTe = Math.min(Number.MAX_SAFE_INTEGER, d.honTe + n); d.bagDirty = true;
}

/**
 * Sắp xếp túi (#215, nút "Sắp xếp" trên cả túi, mọi trang): gộp các ô gộp được (ItemDef.stack) cùng loại chưa đầy vào các ô đầu, ô
 * thừa bỏ đi; rồi xếp theo nhóm (ITEM_KINDS), loại (ITEMS), số năm / sao / cường hóa giảm dần. Món đang gắn vào võ hồn không đổi.
 * Thứ tự lưu DB bằng `created` (nạp túi theo items.created_at): các ô nhận lại chính các mốc thời gian cũ theo thứ tự mới.
 */
export function sortBag(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d || d.travelling) return;
  if (claimHeld(d) || d.shardBusy) return room.log(id, "Đang xử lý vật phẩm, đợi một chút rồi sắp xếp.", "#ffb35c");
  const loose = d.bag.filter((i) => i.vohonId === null), worn = d.bag.filter((i) => i.vohonId !== null);
  const times = loose.map((i) => i.created).sort((a, b) => a - b);
  const groups = new Map<string, Item[]>();
  for (const it of loose) {
    if ((itemDef(it.code)?.stack ?? 1) <= 1 || d.absorbing?.itemId === it.id) continue;
    const k = [it.code, it.years, it.stars, it.enhance, JSON.stringify(it.stats), !!it.locked].join("|"); // ô khoá (#216) không gộp với ô thường
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }
  const gone = new Set<Item>();
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const stack = itemDef(list[0].code)!.stack;
    let left = list.reduce((a, i) => a + i.qty, 0);
    for (const it of list) { if (left > 0) { it.qty = Math.min(stack, left); left -= it.qty; } else gone.add(it); }
  }
  const rank = (it: Item) => { const def = itemDef(it.code); return def ? KIND_ORDER.indexOf(def.kind) * 1e4 + (ITEM_ORDER.get(def.id) ?? 0) : 1e9; };
  const kept = loose.filter((i) => !gone.has(i)).sort((a, b) => rank(a) - rank(b) || (b.years ?? 0) - (a.years ?? 0) || (b.stars ?? 0) - (a.stars ?? 0)
    || b.enhance - a.enhance || b.qty - a.qty || a.created - b.created);
  let prev = -Infinity;
  kept.forEach((it, k) => { it.created = prev = Math.max(times[k], prev + 1); });
  bumpItemClock(prev);
  d.bag = [...kept, ...worn]; d.bagDirty = true;
  room.log(id, `Đã sắp xếp túi đồ${gone.size ? `, gộp bớt ${gone.size} ô` : ""}.`);
  room.sendBag(id);
}

/** Hồn Tệ khi hạ hồn thú bậc `tier` (BEAST_COIN): người hạ nhận thẳng vào túi. Trả về số đồng nhận được. */
export function rewardCoin(room: MapRoom, id: string, tier: number) {
  const d = room.pdata.get(id); if (!d) return 0;
  const [lo, hi] = BEAST_COIN[tier] ?? BEAST_COIN[0], n = lo + Math.floor(Math.random() * (hi - lo + 1));
  room.addCoin(d, n);
  room.sendBag(id);
  return n;
}

/**
 * Túi còn đủ chỗ cho mọi vật phẩm `items` cùng lúc không (gộp vào ô cùng mã chưa đầy, không khoá, trước, rồi mở ô mới như addItem),
 * cộng thêm `extra` ô riêng (mỗi hồn cốt một ô).
 */
export function bagFits(room: MapRoom, d: PData, items: { code: string; qty: number }[], extra = 0) {
  const need = new Map<string, number>();
  for (const it of items) need.set(it.code, (need.get(it.code) ?? 0) + it.qty);
  let slots = 0;
  for (const [code, qty] of need) {
    const def = itemDef(code); if (!def) return false;
    const part = d.bag.reduce((a, it) => a + (it.code === code && it.vohonId === null && !it.locked ? Math.max(0, def.stack - it.qty) : 0), 0);
    slots += Math.ceil(Math.max(0, qty - part) / def.stack);
  }
  return bagUsed(d.bag) + slots + extra <= d.bagSlots;
}

/** Số món mã `code` túi còn nhận được: chỗ trống trong ô cùng mã (cùng trạng thái khoá `locked`) chưa đầy và các ô trống (như addItem). */
export function bagRoom(room: MapRoom, d: PData, code: string, locked = false) {
  const def = itemDef(code); if (!def) return 0;
  const part = d.bag.reduce((a, it) => a + (it.code === code && it.vohonId === null && !!it.locked === locked ? Math.max(0, def.stack - it.qty) : 0), 0);
  return part + Math.max(0, d.bagSlots - bagUsed(d.bag)) * def.stack;
}

/**
 * Bỏ hẳn một ô trong túi (cả chồng), ví dụ hồn hoàn không dùng tới để nhường chỗ. Không bỏ được hồn hoàn đang hấp thụ, và không bỏ
 * gì trong lúc đang ghi phần thưởng boss (claimBusy, #165: phần thưởng vào túi trước khi DB xác nhận lượt, lỗi thì lấy lại).
 */
export function discardItem(room: MapRoom, id: string, raw: unknown) {
  const d = room.pdata.get(id); if (!d || d.travelling) return;
  const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
  if (!it) return room.log(id, "Không có vật phẩm này trong túi đồ.", "#ffb35c");
  if (d.absorbing?.itemId === it.id) return room.log(id, "Đang hấp thụ hồn hoàn này, không bỏ được.", "#ffb35c");
  if (it.locked) return room.log(id, `${room.itemLabel(it)} đang khoá: mở khoá rồi mới bỏ được.`, "#ffb35c");
  if (claimHeld(d)) return room.log(id, CLAIM_BUSY, "#ffb35c");
  room.takeItem(d, it, it.qty);
  room.log(id, `Đã bỏ ${room.itemLabel(it)}.`);
  room.sendBag(id);
}

/** Khoá / mở khoá một ô trong túi của chính người gửi: món khoá không bị bán (tay hay tự bán), bỏ, hay làm nguyên liệu. */
export function lockItem(room: MapRoom, id: string, raw: unknown) {
  const d = room.pdata.get(id); if (!d || d.travelling) return; // #165: như mọi thao tác túi đồ, không đổi sau khi đã chụp túi để đi cổng
  const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw) : undefined;
  if (!it) return room.log(id, "Không có vật phẩm này trong túi đồ.", "#ffb35c");
  it.locked = !it.locked; d.bagDirty = true; d.lockIds.add(it.id);
  room.log(id, `${it.locked ? "Đã khoá" : "Đã mở khoá"} ${room.itemLabel(it)}${it.locked ? ": không bán, bỏ hay làm nguyên liệu được" : ""}.`);
  room.sendBag(id);
  room.saveTrade(id, d);
}
