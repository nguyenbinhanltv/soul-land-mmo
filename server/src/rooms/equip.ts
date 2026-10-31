// Trang bị hồn sư và Thợ rèn (GAME_DESIGN.md mục 5.15), tách khỏi MapRoom.ts (#702, bước 2): mặc / tháo, cường hóa, khắc may mắn, hợp thành,
// phân giải, tự phân giải cùng hàng đợi `forgeLane` / khóa món `itemLocked`. Hàm nhận phòng (`room: MapRoom`) như split.ts; nguyên văn từ
// MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.chain`. MapRoom chỉ chuyển tiếp (đăng ký `onMessage` và `tick` giữ nguyên ở đó).
import { itemDef, formatHonTe, AUTO_SELL_FREE,
  EQUIP_ITEM, EQUIP_SLOTS, EQUIP_LUCK_MAX, EQUIP_MAX_ENHANCE, parseEquip, equipTemplate, equipSlotIndex, equipName, equipSlotDef, rollEquip, EQUIP_STONES, EQUIP_CHARM,
  equipEnhanceStep, equipEnhanceResult, EQUIP_TEMPLATES, EQUIP_TIERS, EQUIP_ESSENCE, EQUIP_SOUL, equipLuckStep, EQUIP_SALVAGE_MAX, equipSynthStep, equipSynthOutcome,
  equipSalvage, equipAutoSalvageable, AUTO_SALVAGE_RETRY_MS, type EquipData } from "../../../shared/data.ts";
import { scoreGear } from "./equipBest.ts";
import { store, type Item } from "../db.ts";
import { ItemLockBusy, withItemLocks } from "../itemLock.ts";
import { presenceBackend } from "../presence.ts";
import { newItem, gearStats, gearLook, bagUsed } from "./items.ts";
import { CLAIM_BUSY, claimHeld, type MapRoom, type PData } from "./MapRoom.ts";

/** Tin riêng "gear": các món đang mặc (`slot` = chỉ số trong EQUIP_SLOTS) và chỉ số tổng `st` (equipStats). Chỉ chính chủ; không vào state công khai (riêng bậc áo / mũ đang mặc được đẩy sang `gearAo` / `gearMu`, `gearLook`). */
export function sendGear(room: MapRoom, id: string) {
  const d = room.pdata.get(id), c = room.clients.getById(id); if (!d || !c) return;
  const p = room.state.players.get(id); if (p) gearLook(p, d.gear); // mọi đường đổi d.gear (mặc / tháo / phá huỷ khi cường hóa / hook test) đều gửi tin này
  const before = room.teamPowerOf(d);
  const upgrades = d.bag.filter((it) => {
    const tpl = it.code === EQUIP_ITEM && it.vohonId === null && !it.locked ? equipTemplate(parseEquip(it.stats)?.tpl) : undefined;
    if (!tpl) return false;
    const slot = equipSlotIndex(tpl.slot);
    return scoreGear(room, d, [...d.gear.filter((g) => g.equipSlot !== slot), { ...it, equipSlot: slot }]) > before;
  }).map((it) => it.id);
  c.send("gear", { upgrades, items: d.gear.map((i) => ({ id: i.id, code: i.code, enhance: i.enhance, stats: i.stats, slot: i.equipSlot, ...(i.locked ? { lock: true } : {}) })), st: d.gearSt });
}

/** Sau khi đổi trang bị: tính lại chỉ số, báo client, ghi ngay qua chuỗi lưu (túi + ô mặc cùng một transaction). */
export function afterGear(room: MapRoom, id: string, d: PData) {
  d.gearSt = gearStats(d.gear); d.bagDirty = true;
  room.afterBones(id, d.ch); sendGear(room, id);
  void room.save(id);
}

/**
 * Mặc trang bị `rawItem` (id món trong túi của chính người gửi): ô lấy từ mẫu của món (EQUIP_TEMPLATES; vòng / nhẫn trái phải là mẫu riêng).
 * Ô đã có món thì đổi chỗ, món cũ về túi đúng chỗ món mới rời (số ô túi không đổi). Cùng luật gắn / tháo hồn cốt (boneLock: ngoài giao chiến,
 * không gục, không hấp thụ); trong sân Đại Đấu Hồn Trường bị chặn (ArenaRoom BLOCKED). Thuộc hồn sư nên cộng cho cả đội; chỉ số tính lại ngay.
 */
export function equipGear(room: MapRoom, id: string, rawItem: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const idx = typeof rawItem === "string" ? d.bag.findIndex((i) => i.id === rawItem && i.vohonId === null && i.code === EQUIP_ITEM) : -1, it = d.bag[idx];
  const e = it ? parseEquip(it.stats) : null, tpl = e ? equipTemplate(e.tpl) : undefined;
  if (!it || !e || !tpl) return warn("Không có trang bị này trong túi đồ.");
  if (claimHeld(d)) return warn(CLAIM_BUSY);
  const lock = room.boneLock(p, d, "trang bị"); if (lock) return warn(lock);
  const slot = equipSlotIndex(tpl.slot), oi = d.gear.findIndex((g) => g.equipSlot === slot), old = d.gear[oi];
  if (old) { d.gear.splice(oi, 1); delete old.equipSlot; }
  it.equipSlot = slot; d.bag.splice(idx, 1, ...(old ? [old] : [])); d.gear.push(it);
  d.lockIds.add(it.id); if (old) d.lockIds.add(old.id);
  room.log(id, `Mặc ${equipName(e.tpl, it.enhance)} (${EQUIP_SLOTS[slot].name}).${old ? ` ${equipName(parseEquip(old.stats)?.tpl, old.enhance)} về túi đồ.` : ""}`, "#e8dcff");
  afterGear(room, id, d);
}

/** Tháo trang bị ở ô `rawSlot` (chỉ số 0..9 hoặc mã ô trong EQUIP_SLOTS) về túi; túi đầy thì từ chối. Giữ nguyên cấp cường hóa và chỉ số. */
export function unequipGear(room: MapRoom, id: string, rawSlot: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const slot = typeof rawSlot === "number" && Number.isInteger(rawSlot) ? rawSlot : typeof rawSlot === "string" ? equipSlotIndex(rawSlot) : -1;
  const gi = d.gear.findIndex((g) => g.equipSlot === slot);
  if (gi < 0) return warn("Ô này chưa mặc trang bị nào.");
  if (claimHeld(d)) return warn(CLAIM_BUSY);
  const lock = room.boneLock(p, d, "trang bị"); if (lock) return warn(lock);
  if (bagUsed(d.bag) >= d.bagSlots) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới tháo được trang bị.`);
  const [it] = d.gear.splice(gi, 1); delete it.equipSlot; d.bag.push(it); d.lockIds.add(it.id);
  room.log(id, `Tháo ${equipName(parseEquip(it.stats)?.tpl, it.enhance)} về túi đồ.`);
  afterGear(room, id, d);
}

/** Món trang bị `raw` của chính chủ, trong túi hoặc đang mặc (undefined nếu không có / không phải trang bị). */
export function equipOf(room: MapRoom, d: PData, raw: unknown) {
  if (typeof raw !== "string") return undefined;
  const it = d.bag.find((i) => i.id === raw && i.vohonId === null && i.code === EQUIP_ITEM) ?? d.gear.find((i) => i.id === raw && i.code === EQUIP_ITEM);
  return it && parseEquip(it.stats) ? it : undefined;
}

/** Số vật phẩm mã `code` trong túi (mọi ô gộp, kể cả ô khóa). */
export function countOf(room: MapRoom, d: PData, code: string) { return d.bag.reduce((n, i) => (i.code === code && i.vohonId === null ? n + i.qty : n), 0); }

/** Trừ `n` vật phẩm mã `code` (đã kiểm đủ); trả hàm hoàn lại đúng ô cũ, dùng khi transaction lưu thất bại (equipEnhance). */
export function spendItem(room: MapRoom, d: PData, code: string, n: number) {
  const undo: { it: Item; n: number; at: number; gone: boolean }[] = [];
  let left = n;
  for (const it of [...d.bag]) {
    if (left <= 0) break;
    if (it.code !== code || it.vohonId !== null) continue;
    const k = Math.min(left, it.qty), at = d.bag.indexOf(it);
    undo.push({ it, n: k, at, gone: k >= it.qty }); room.takeItem(d, it, k); left -= k;
  }
  return () => { for (const u of undo.reverse()) { if (u.gone) { u.it.qty = u.n; d.bag.splice(Math.min(u.at, d.bag.length), 0, u.it); } else u.it.qty += u.n; } d.bagDirty = true; };
}

/**
 * `equipenhpreview {id}` trả "equipenhp" cho bảng Thợ rèn: nấc cường hóa tiếp theo (tỉ lệ, đá, phí, hậu quả khi thất bại) và số đá / bùa /
 * Hồn Tệ đang có. Chỉ đọc, không ghi gì.
 */
export function equipEnhancePreview(room: MapRoom, id: string, rawId: unknown) {
  const d = room.pdata.get(id), c = room.clients.getById(id); if (!d || !c) return;
  const it = equipOf(room, d, rawId); if (!it) return;
  const step = equipEnhanceStep(it.enhance), stone = step ? EQUIP_STONES[step.stone] : null;
  c.send("equipenhp", { id: it.id, enhance: it.enhance, to: step ? it.enhance + 1 : null, p: step?.p ?? 0, fail: step?.fail ?? null,
    stone: stone?.id ?? null, qty: step?.qty ?? 0, have: stone ? countOf(room, d, stone.id) : 0, fee: step?.fee ?? 0, honTe: d.honTe, charm: countOf(room, d, EQUIP_CHARM), busy: d.enhBusy });
}

/**
 * Cường hóa trang bị `rawId` (E3, mục 5.15) ở Thợ rèn: +1 → +15 theo EQUIP_ENHANCE. Đá và phí trừ **trước** khi tung, cả khi thất bại;
 * `charm` (người chơi chọn dùng Bùa Hộ Mệnh) chỉ trừ bùa khi nấc phá hủy và thất bại thật sự xảy ra. Server tung (`testEnh` chỉ có khi GAME_TEST).
 * Chống nhân đồ / đua lệnh: một lệnh đang xử lý (`enhBusy`) thì lệnh tới sau bị từ chối ngay; lệnh chạy trong chuỗi lưu của tài khoản, đổi túi
 * trong bộ nhớ rồi ghi MỘT transaction (saveBag: khóa dòng tài khoản, rồi dòng món theo id tăng dần kèm kiểm cấp lưu, `Bag.lock`); lỗi ghi thì
 * hoàn lại đá, phí, bùa, món về như trước và gửi lại túi. Phá hủy: món bị xóa khỏi túi / ô mặc (DELETE trong transaction). `claimBusy` chặn bán / bỏ đồ
 * trong lúc chờ DB. Món đang mặc cường hóa được, chỉ số tính lại ngay. Ngoài giao chiến và gần Thợ rèn (cùng luật coreset).
 */
export function equipEnhance(room: MapRoom, id: string, rawId: unknown, charm: boolean) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  if (d.enhBusy) return room.log(id, "Đang xử lý lệnh cường hóa trước, đợi một chút.", "#ffb35c");
  d.enhBusy = true; d.claimBusy++;
  room.chain(d, () => itemLocked(room, id, [rawId], async () => {
    const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); equipEnhancePreview(room, id, rawId); };
    if (d.testEnhSlow) await new Promise((r) => setTimeout(r, d.testEnhSlow));
    const it = equipOf(room, d, rawId), e = it ? parseEquip(it.stats) : null; if (!it || !e) return warn("Không có trang bị này để cường hóa.");
    const npc = room.npcNear(id, { role: "forge" }); if (!npc) return warn("Hãy lại gần Thợ rèn hơn để cường hóa trang bị.");
    const lock = room.boneLock(p, d, "trang bị"); if (lock) return warn(lock.replace("gắn / tháo", "cường hóa"));
    const step = equipEnhanceStep(it.enhance); if (!step) return warn(`${room.itemLabel(it)} đã cường hóa tối đa +${EQUIP_MAX_ENHANCE}.`);
    const stone = EQUIP_STONES[step.stone], label = room.itemLabel(it), from = it.enhance, wear = it.equipSlot !== undefined;
    if (countOf(room, d, stone.id) < step.qty) return warn(`Không đủ ${stone.name}: lên +${from + 1} cần ${step.qty}, đang có ${countOf(room, d, stone.id)}.`);
    if (d.honTe < step.fee) return warn(`Không đủ Hồn Tệ: lên +${from + 1} cần phí ${formatHonTe(step.fee)}, đang có ${formatHonTe(d.honTe)}.`);
    if (charm && step.fail.kind === "destroy" && !countOf(room, d, EQUIP_CHARM)) return warn("Không có Bùa Hộ Mệnh trong túi đồ.");
    const undoStone = spendItem(room, d, stone.id, step.qty);
    d.honTe -= step.fee;
    const ok = (d.testEnh ?? Math.random()) < step.p, res = equipEnhanceResult(from, ok, charm)!;
    const undoCharm = res.charmUsed ? spendItem(room, d, EQUIP_CHARM, 1) : () => {};
    const at = (wear ? d.gear : d.bag).indexOf(it);
    if (res.destroyed) (wear ? d.gear : d.bag).splice(at, 1); else it.enhance = res.enhance;
    d.bagDirty = true;
    try { await store.saveBag(d.accountId, { ...room.bagSnapshot(d), lock: [{ id: it.id, enhance: from }] }); }
    catch (err) {
      // Hoàn lại trên d.bag / d.gear / d.honTe HIỆN TẠI (trong lúc chờ DB có thể nhặt thêm đồ / Hồn Tệ): cộng lại đúng phần đã trừ, không gán giá trị cũ.
      undoCharm(); undoStone(); d.honTe += step.fee; it.enhance = from;
      if (res.destroyed) { const home = wear ? d.gear : d.bag; home.splice(Math.min(at, home.length), 0, it); }
      d.bagDirty = true;
      if (wear) { d.gearSt = gearStats(d.gear); room.afterBones(id, d.ch); sendGear(room, id); }
      room.sendBag(id);
      warn("Không lưu được lần cường hóa, đã hoàn lại đá, phí và món đồ. Thử lại sau."); throw err;
    }
    const verb = res.destroyed ? `thất bại, ${label} đã bị PHÁ HỦY` : ok ? `thành công lên +${res.enhance}` : res.charmUsed ? `thất bại, Bùa Hộ Mệnh giữ nguyên +${res.enhance}`
      : res.enhance < from ? `thất bại, tụt xuống +${res.enhance}` : `thất bại, giữ +${res.enhance}`;
    room.log(id, `Cường hóa ${res.destroyed ? label : equipName(e.tpl, from)} → +${from + 1}: ${verb} (−${step.qty} ${stone.name}, phí −${formatHonTe(step.fee)}${res.charmUsed ? ", −1 Bùa Hộ Mệnh" : ""}).`,
      ok ? "#9cff9c" : res.destroyed ? "#ff5a5a" : "#ffb35c");
    room.clients.getById(id)?.send("equipenhd", { id: it.id, from, to: res.destroyed ? null : res.enhance, ok, destroyed: res.destroyed, charmUsed: res.charmUsed, stone: stone.id, qty: step.qty, fee: step.fee });
    if (wear) { d.gearSt = gearStats(d.gear); room.afterBones(id, d.ch); sendGear(room, id); }
    room.sendBag(id);
    if (!res.destroyed) equipEnhancePreview(room, id, it.id);
  })).then(() => { d.enhBusy = false; d.claimBusy--; });
}

/**
 * Khắc may mắn của một món: `luck` hiện tại, bước kế (`equipLuckStep`) và lý do không khắc được (`slot` ô không có may mắn, `max` món đã đạt
 * EQUIP_LUCK_MAX, `worn` tổng hai ô đang mặc đã đạt EQUIP_LUCK_MAX). Món đang mặc tính trần theo tổng hai ô, món trong túi theo chính nó.
 */
export function luckInfo(room: MapRoom, d: PData, it: Item, e: EquipData) {
  const wear = it.equipSlot !== undefined, slotOk = !!equipSlotDef(equipTemplate(e.tpl)?.slot).luck, wornLuck = d.gear.reduce((n, g) => n + (parseEquip(g.stats)?.luck ?? 0), 0);
  const step = slotOk ? equipLuckStep(e.luck, wear ? wornLuck : null) : null;
  return { wear, step, reason: !slotOk ? "slot" : step ? null : e.luck >= EQUIP_LUCK_MAX ? "max" : "worn" };
}

/** `equipluckpreview {id}` trả "equipluckp": tỉ lệ khắc may mắn kế tiếp, số Thần Hồn đang có, lý do bị chặn. Chỉ đọc. `busy`: lệnh sắp xong gửi false (cờ `enhBusy` chưa nhả). */
export function equipLuckPreview(room: MapRoom, id: string, rawId: unknown, busy?: boolean) {
  const d = room.pdata.get(id), c = room.clients.getById(id); if (!d || !c) return;
  const it = equipOf(room, d, rawId), e = it ? parseEquip(it.stats) : null; if (!it || !e) return;
  const { step, reason } = luckInfo(room, d, it, e);
  c.send("equipluckp", { id: it.id, luck: e.luck, to: step?.to ?? null, p: step?.p ?? 0, reason, soul: countOf(room, d, EQUIP_SOUL), max: EQUIP_LUCK_MAX, busy: busy ?? d.enhBusy });
}

/**
 * Khắc may mắn (Thợ rèn): tốn 1 Thần Hồn mỗi lần, may mắn n → n + 1 với tỉ lệ EQUIP_LUCK_UP[n] (server tung; `testEnh` chỉ có khi GAME_TEST). Thất bại
 * mất Thần Hồn, giữ may mắn, KHÔNG phá món, không phí Hồn Tệ. Chỉ vũ khí / dây chuyền (ô `luck`). Chặn khi món đã đạt EQUIP_LUCK_MAX, món đang mặc
 * chặn khi tổng hai ô đã đạt EQUIP_LUCK_MAX. Cùng hàng đợi / khóa / transaction ghi như cường hóa; lỗi ghi thì hoàn lại Thần Hồn và may mắn.
 */
export function equipLuck(room: MapRoom, id: string, rawId: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  if (d.enhBusy) return room.log(id, "Đang xử lý lệnh Thợ rèn trước, đợi một chút.", "#ffb35c");
  d.enhBusy = true; d.claimBusy++;
  room.chain(d, () => itemLocked(room, id, [rawId], async () => {
    const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); equipLuckPreview(room, id, rawId); };
    if (d.testEnhSlow) await new Promise((r) => setTimeout(r, d.testEnhSlow));
    const it = equipOf(room, d, rawId), e = it ? parseEquip(it.stats) : null; if (!it || !e) return warn("Không có trang bị này để khắc may mắn.");
    const npc = room.npcNear(id, { role: "forge" }); if (!npc) return warn("Hãy lại gần Thợ rèn hơn để khắc may mắn.");
    const lock = room.boneLock(p, d, "trang bị"); if (lock) return warn(lock.replace("gắn / tháo", "khắc may mắn"));
    const label = room.itemLabel(it), { wear, step, reason } = luckInfo(room, d, it, e);
    if (!step) return warn(reason === "slot" ? `${label} không khắc may mắn được (chỉ vũ khí và dây chuyền).`
      : reason === "max" ? `${label} đã đạt may mắn tối đa ${EQUIP_LUCK_MAX}.` : `Tổng may mắn hai ô đang mặc đã đạt tối đa ${EQUIP_LUCK_MAX}.`);
    if (countOf(room, d, EQUIP_SOUL) < 1) return warn("Không có Thần Hồn trong túi đồ.");
    const undoSoul = spendItem(room, d, EQUIP_SOUL, 1), from = e.luck;
    const ok = (d.testEnh ?? Math.random()) < step.p, was = it.stats;
    if (ok) it.stats = { tpl: e.tpl, ilvl: e.ilvl, roll: e.roll, affixes: e.affixes.map(([k, v]) => [k, v]), luck: step.to };
    d.bagDirty = true;
    try { await store.saveBag(d.accountId, { ...room.bagSnapshot(d), lock: [{ id: it.id, enhance: it.enhance }] }); }
    catch (err) {
      undoSoul(); it.stats = was; d.bagDirty = true;
      if (wear) { d.gearSt = gearStats(d.gear); room.afterBones(id, d.ch); sendGear(room, id); }
      room.sendBag(id);
      warn("Không lưu được lần khắc may mắn, đã hoàn lại Thần Hồn và món đồ. Thử lại sau."); throw err;
    }
    room.log(id, `Khắc may mắn ${equipName(e.tpl, it.enhance)} M${from} → M${from + 1}: ${ok ? "thành công" : `thất bại, giữ M${from}`} (−1 ${itemDef(EQUIP_SOUL)?.name ?? "Thần Hồn"}).`, ok ? "#9cff9c" : "#ffb35c");
    room.clients.getById(id)?.send("equipluckd", { id: it.id, from, to: ok ? step.to : from, ok });
    if (wear) { d.gearSt = gearStats(d.gear); room.afterBones(id, d.ch); sendGear(room, id); }
    room.sendBag(id);
    equipLuckPreview(room, id, it.id, false);
  })).then(() => { d.enhBusy = false; d.claimBusy--; });
}

/**
 * Thêm `qty` món mã `code` vào túi (addItem) và trả `got` (số đã nhận) cùng hàm hoàn lại ĐÚNG phần vừa thêm trên túi hiện tại (ô mới bị bỏ,
 * ô gộp bớt đúng số vừa cộng): dùng khi transaction lưu thất bại mà trong lúc chờ DB túi có thể đã nhận thêm đồ.
 */
export function addTracked(room: MapRoom, d: PData, code: string, qty: number) {
  const before = new Map(d.bag.filter((i) => i.code === code && i.vohonId === null).map((i) => [i, i.qty] as const));
  const got = room.addItem(d, code, qty);
  const delta = d.bag.filter((i) => i.code === code && i.vohonId === null).map((i) => ({ it: i, n: i.qty - (before.get(i) ?? 0) })).filter((x) => x.n > 0);
  return { got, undo: () => { for (const x of delta) x.it.qty -= x.n; d.bag = d.bag.filter((i) => i.qty > 0); d.bagDirty = true; } };
}

/** Bỏ các món `its` khỏi túi (ghi nhớ vị trí); trả hàm đặt lại đúng chỗ cũ (theo thứ tự ngược). */
export function removeTracked(room: MapRoom, d: PData, its: Item[]) {
  const gone = its.map((it) => { const at = d.bag.indexOf(it); d.bag.splice(at, 1); return { it, at }; });
  d.bagDirty = true;
  return () => { for (const g of [...gone].reverse()) d.bag.splice(Math.min(g.at, d.bag.length), 0, g.it); d.bagDirty = true; };
}

/**
 * Chạy `run` khi giữ khóa Redis `lock:item:<id>` của các món `rawIds` (#559; chỉ khi chạy nhiều tiến trình, `withItemLocks`): món đang bị tiến trình /
 * phiên khác xử lý thì từ chối "đang xử lý" (như claimBusy), Redis lỗi thì từ chối luôn (fail-closed); cả hai trường hợp `run` không chạy nên không đổi gì.
 * Lỗi của chính `run` (vd. ghi DB) vẫn ném lên chuỗi lưu như trước.
 */
export async function itemLocked(room: MapRoom, id: string, rawIds: unknown[], run: () => Promise<void>, quiet = false) {
  const ids = rawIds.filter((x): x is string => typeof x === "string");
  let ran = false;
  try { await withItemLocks(presenceBackend, ids, async () => { ran = true; await run(); }); }
  catch (e) {
    if (ran) throw e;
    if (!quiet) room.log(id, e instanceof ItemLockBusy ? "Trang bị này đang được xử lý, đợi một chút." : "Không khóa được trang bị lúc này, thử lại sau.", "#ffb35c");
    if (!(e instanceof ItemLockBusy)) console.error(`Không lấy được khóa Redis món đồ của tài khoản ${room.pdata.get(id)?.accountId}`, e);
    room.sendBag(id);
  }
}

/**
 * Hàng đợi chung của các lệnh Thợ rèn trang bị mới (hợp thành, phân giải; E4): cờ `enhBusy` như cường hóa (E3), một lệnh đang xử lý thì lệnh tới
 * sau bị từ chối ngay, lệnh chạy trong chuỗi lưu của tài khoản; `claimBusy` chặn bán / bỏ đồ trong lúc chờ DB. `quiet`: lệnh tự động, không báo từ chối.
 */
export function forgeLane(room: MapRoom, id: string, d: PData, run: () => Promise<void>, quiet = false, rawIds: unknown[] = []) {
  if (d.enhBusy) { if (!quiet) room.log(id, "Đang xử lý lệnh Thợ rèn trước, đợi một chút.", "#ffb35c"); return; }
  d.enhBusy = true; d.claimBusy++;
  room.chain(d, async () => {
    if (d.testEnhSlow) await new Promise((r) => setTimeout(r, d.testEnhSlow));
    await itemLocked(room, id, rawIds, run, quiet);
  }).then(() => { d.enhBusy = false; d.claimBusy--; });
}

/** Các món trang bị trong túi (không tính món đang mặc) theo danh sách id, kèm dữ liệu đã đọc; trả chuỗi lỗi nếu có id lạ, trùng, đang mặc hoặc khóa. */
export function equipBagItems(room: MapRoom, d: PData, ids: unknown[]) {
  const out: { it: Item; e: NonNullable<ReturnType<typeof parseEquip>>; tier: number; slot: string }[] = [];
  for (const raw of ids) {
    if (typeof raw !== "string" || out.some((x) => x.it.id === raw)) return "Danh sách trang bị không hợp lệ.";
    if (d.gear.some((g) => g.id === raw)) return "Trang bị đang mặc: hãy tháo về túi trước.";
    const it = d.bag.find((i) => i.id === raw && i.vohonId === null && i.code === EQUIP_ITEM), e = it ? parseEquip(it.stats) : null, tpl = e ? equipTemplate(e.tpl) : undefined;
    if (!it || !e || !tpl) return "Không có trang bị này trong túi đồ.";
    if (it.locked) return `${room.itemLabel(it)} đang khóa.`;
    out.push({ it, e, tier: tpl.tier, slot: tpl.slot });
  }
  return out;
}

/**
 * Hợp thành 3 → 1 (E4, mục 5.15) ở Thợ rèn: món chính `rawMain` + 2 hiến tế `rawSac` (id trong túi) cùng bậc, cùng ô, không khóa, không đang mặc ra
 * 1 món bậc kế (EQUIP_SYNTH). Phí Hồn Tệ và Tinh Hoa trừ trước khi tung, cả khi thất bại. Thành công: mẫu ngẫu nhiên cùng ô, ilvl cao nhất trong ba
 * món, `enhance` = floor(món chính × EQUIP_SYNTH_KEEP). Thất bại theo equipSynthOutcome (mất 2 hiến tế; T3 → T4 món chính −1 cấp; T4 → T5 mất cả
 * ba, hoàn một phần Tinh Hoa). Chống nhân đồ như cường hóa: hàng đợi `forgeLane`, đổi túi trong bộ nhớ rồi ghi MỘT transaction (saveBag + khóa cấp),
 * lỗi ghi thì hoàn lại đúng phần đã đổi và gửi lại túi.
 */
export function equipSynth(room: MapRoom, id: string, rawMain: unknown, rawSac: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  if (!Array.isArray(rawSac) || rawSac.length !== 2) return room.log(id, "Hợp thành cần 1 món chính và đúng 2 món hiến tế.", "#ffb35c");
  forgeLane(room, id, d, async () => {
    const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
    const list = equipBagItems(room, d, [rawMain, ...rawSac]); if (typeof list === "string") return warn(list);
    const [main, ...sac] = list, tier = main.tier, step = equipSynthStep(tier);
    if (list.some((x) => x.tier !== tier || x.slot !== main.slot)) return warn("Ba món phải cùng bậc và cùng ô trang bị.");
    if (!step) return warn(`${EQUIP_TIERS[tier].name} đã là bậc cao nhất, không hợp thành được nữa.`);
    if (!room.npcNear(id, { role: "forge" })) return warn("Hãy lại gần Thợ rèn hơn để hợp thành trang bị.");
    const lock = room.boneLock(p, d, "trang bị"); if (lock) return warn(lock.replace("gắn / tháo", "hợp thành"));
    const next = EQUIP_TEMPLATES.filter((t) => t.slot === main.slot && t.tier === tier + 1 && t.w > 0), wsum = next.reduce((a, t) => a + t.w, 0);
    if (!next.length) return warn("Không có mẫu trang bị bậc kế cho ô này.");
    if (d.honTe < step.fee) return warn(`Không đủ Hồn Tệ: hợp thành cần phí ${formatHonTe(step.fee)}, đang có ${formatHonTe(d.honTe)}.`);
    if (countOf(room, d, EQUIP_ESSENCE) < step.essence) return warn(`Không đủ Tinh Hoa Đường Môn: cần ${step.essence}, đang có ${countOf(room, d, EQUIP_ESSENCE)}.`);
    const undoEss = step.essence ? spendItem(room, d, EQUIP_ESSENCE, step.essence) : () => {};
    d.honTe -= step.fee;
    const ok = (d.testSyn ?? Math.random()) < step.p, res = equipSynthOutcome(tier, main.it.enhance, ok)!, fromEnh = main.it.enhance;
    const label = room.itemLabel(main.it), mainId = main.it.id;
    const redo: (() => void)[] = [undoEss];
    let made: Item | null = null, refund = 0;
    if (res.ok) {
      redo.push(removeTracked(room, d, list.map((x) => x.it)));
      let r = Math.random() * wsum, tpl = next[next.length - 1]; for (const t of next) { if ((r -= t.w) < 0) { tpl = t; break; } }
      made = newItem(itemDef(EQUIP_ITEM)!, 1); made.stats = rollEquip(tpl, Math.max(...list.map((x) => x.e.ilvl)), Math.random); made.enhance = res.enhance; d.bag.push(made);
    } else if (res.main === null) {
      redo.push(removeTracked(room, d, list.map((x) => x.it)));
      if (res.refund > 0) { const t = addTracked(room, d, EQUIP_ESSENCE, res.refund); refund = t.got; redo.push(t.undo); }
    } else {
      redo.push(removeTracked(room, d, sac.map((x) => x.it))); main.it.enhance = res.main; d.bagDirty = true;
    }
    const undoAll = () => { if (made) d.bag = d.bag.filter((i) => i !== made); for (const f of [...redo].reverse()) f(); main.it.enhance = fromEnh; d.honTe += step.fee; d.bagDirty = true; };
    try { await store.saveBag(d.accountId, { ...room.bagSnapshot(d), lock: list.map((x) => ({ id: x.it.id, enhance: x.it === main.it ? fromEnh : x.it.enhance })) }); }
    catch (err) { undoAll(); room.sendBag(id); warn("Không lưu được lần hợp thành, đã hoàn lại món đồ, phí và Tinh Hoa. Thử lại sau."); throw err; }
    const cost = `phí −${formatHonTe(step.fee)}${step.essence ? `, −${step.essence} Tinh Hoa Đường Môn` : ""}`;
    const text = res.ok ? `thành công: ${room.itemLabel(made!)} (+${made!.enhance})`
      : res.main === null ? `thất bại, mất cả 3 món${refund ? `, hoàn ${refund} Tinh Hoa Đường Môn` : ""}` : `thất bại, mất 2 món hiến tế${res.main < fromEnh ? `, ${label} tụt xuống +${res.main}` : ""}`;
    room.log(id, `Hợp thành ${EQUIP_TIERS[tier].name} → ${EQUIP_TIERS[tier + 1].name} ${text} (${cost}).`, res.ok ? "#9cff9c" : "#ffb35c");
    room.clients.getById(id)?.send("equipsynd", { ok: res.ok, from: tier, main: mainId, made: made?.id ?? null, enhance: res.ok ? res.enhance : res.main, fee: step.fee, essence: step.essence, refund });
    room.sendBag(id);
  }, false, [rawMain, ...rawSac]);
}

/**
 * Phân giải hàng loạt (E4, mục 5.15) ở Thợ rèn (hoặc tự phân giải khi `auto`): các món `rawIds` (≤ EQUIP_SALVAGE_MAX, trong túi, không khóa, không đang mặc) →
 * Hồn Tệ và nguyên liệu theo equipSalvage; KHÔNG cho kinh nghiệm. Cả lượt là một transaction (saveBag): túi không đủ chỗ cho nguyên liệu thì từ chối cả lượt,
 * không mất món; lỗi ghi thì hoàn lại. Tự phân giải (tùy chọn, mặc định tắt) chạy im lặng, không cần đứng gần Thợ rèn, không qua `boneLock`.
 */
export function salvageEquip(room: MapRoom, id: string, rawIds: unknown, auto = false) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  if (!Array.isArray(rawIds) || !rawIds.length) return auto ? undefined : room.log(id, "Chưa chọn trang bị nào để phân giải.", "#ffb35c");
  if (rawIds.length > EQUIP_SALVAGE_MAX) return room.log(id, `Mỗi lần phân giải tối đa ${EQUIP_SALVAGE_MAX} món.`, "#ffb35c");
  forgeLane(room, id, d, async () => {
    const warn = (text: string) => { if (auto) return; room.log(id, text, "#ffb35c"); room.sendBag(id); };
    const list = equipBagItems(room, d, rawIds); if (typeof list === "string") return warn(list);
    if (!auto) {
      if (!room.npcNear(id, { role: "forge" })) return warn("Hãy lại gần Thợ rèn hơn để phân giải trang bị.");
      const lock = room.boneLock(p, d, "trang bị"); if (lock) return warn(lock.replace("gắn / tháo", "phân giải"));
    }
    let coin = 0; const mats = new Map<string, number>();
    for (const x of list) {
      const r = equipSalvage(x.tier, x.it.enhance, () => d.testSyn ?? Math.random());
      coin += r.coin; for (const m of r.items) mats.set(m.code, (mats.get(m.code) ?? 0) + m.qty);
    }
    const redo: (() => void)[] = [removeTracked(room, d, list.map((x) => x.it))], honTe0 = d.honTe;
    room.addCoin(d, coin); const gain = d.honTe - honTe0;
    const undoAll = () => { for (const f of [...redo].reverse()) f(); d.honTe -= gain; d.bagDirty = true; };
    for (const [code, qty] of mats) {
      const t = addTracked(room, d, code, qty); redo.push(t.undo);
      if (t.got < qty) { undoAll(); return warn(`Túi đồ không đủ chỗ cho ${itemDef(code)?.name ?? code}: bỏ bớt vật phẩm rồi phân giải lại (không mất món nào).`); }
    }
    try { await store.saveBag(d.accountId, { ...room.bagSnapshot(d), lock: list.map((x) => ({ id: x.it.id, enhance: x.it.enhance })) }); }
    catch (err) { undoAll(); room.sendBag(id); warn("Không lưu được lần phân giải, đã hoàn lại. Thử lại sau."); throw err; }
    const items = [...mats].map(([code, qty]) => ({ code, qty })), what = items.map((m) => `${m.qty} ${itemDef(m.code)?.name ?? m.code}`).join(", ");
    room.log(id, `${auto ? "Tự phân giải" : "Phân giải"} ${list.length} trang bị: +${formatHonTe(gain)}${what ? `, ${what}` : ""}.`, "#f2c84b");
    room.clients.getById(id)?.send("equipsalvd", { n: list.length, coin: gain, items, auto });
    room.sendBag(id);
  }, auto, rawIds);
}

/** Tự phân giải trang bị (E4, tùy chọn, mặc định tắt): túi còn dưới AUTO_SELL_FREE ô trống thì phân giải các món hợp bộ lọc (equipAutoSalvageable). Thử lại không quá 1 lần / AUTO_SALVAGE_RETRY_MS. */
export function autoSalvage(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d || d.sellCfg.salv <= 0 || d.enhBusy || d.travelling || d.travelCast || d.absorbing || claimHeld(d) || d.shardBusy) return;
  if (room.map.kind === "arena" || d.bagSlots - bagUsed(d.bag) >= AUTO_SELL_FREE || Date.now() < d.salvAt) return;
  const ids = d.bag.filter((i) => equipAutoSalvageable({ ...i, vohon: i.vohonId }, d.sellCfg)).slice(0, EQUIP_SALVAGE_MAX).map((i) => i.id);
  if (!ids.length) return;
  d.salvAt = Date.now() + AUTO_SALVAGE_RETRY_MS;
  salvageEquip(room, id, ids, true);
}
