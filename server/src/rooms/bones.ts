// Hồn cốt / hồn hạch (GAME_DESIGN.md mục 5.5, 5.6), tách khỏi MapRoom.ts (#702, bước 3): gắn / tháo, cường hóa hồn cốt, nâng cấp hồn hạch, đổi bộ.
// Hàm nhận phòng (`room: MapRoom`) như equip.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.save`. MapRoom chỉ chuyển tiếp
// (đăng ký `onMessage` giữ nguyên ở đó); `afterBones` / `boneLock` nay ở đây (E6a, MapRoom chuyển tiếp); `bonesOn` / `coresOn` ở `stats.ts` (MapRoom chuyển tiếp) vì nhiều miền khác gọi.
import { VOHON, TEAM_COMBAT_SECS, tierOfYears, vohonIndex, formatHonTe, npcDef,
  BONE_ITEM, BONE_SLOTS, parseBone, boneSlotIndex, TIERS,
  BONE_MAX_ENHANCE, BONE_FEED_MAX, boneXp, boneEnhancePreview, parseBoneSubs, boneAddSubs, BONE_ENHANCE_FEE, CORE_ENHANCE_FEE, enhanceFee,
  CORE_ITEM, CORE_SETS, parseCore, coreName, coreSetIndex, coreSetName, coreResetFee, CORE_SLOTS, coreSlotOf,
  coreStatText, CORE_MAX_ENHANCE, CORE_FEED_MAX, coreEnhancePreview, coreXp, coreUpgradeSubs } from "../../../shared/data.ts";
import type { Item, Character } from "../db.ts";
import { bagUsed } from "./items.ts";
import type { PlayerState } from "./schema.ts";
import type { PData } from "./types.ts";
import type { MapRoom } from "./MapRoom.ts";

/**
 * Gắn hồn cốt `rawItem` (id ô trong túi) vào võ hồn `rawVohon` (vohons.id) của chính người gửi (mục 5.5). Hồn cốt chỉ vào ô
 * cùng vị trí: client gửi kèm `rawSlot` (ô được thả vào) thì phải đúng vị trí của hồn cốt. Ô đã có hồn cốt thì đổi chỗ, món cũ
 * về túi (số ô túi không đổi nên không cần chỗ trống). Đổi trong bộ nhớ ngay; túi (cả cột vohon_id) ghi DB cùng lần lưu túi
 * kế tiếp (lưu định kỳ, rời phòng, transaction đi cổng). Võ hồn đang ra trận thì chỉ số đổi ngay.
 */
export function equipBone(room: MapRoom, id: string, rawItem: unknown, rawVohon: unknown, rawSlot: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem) : undefined;
  const bone = it && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
  if (!it || !bone) return warn("Không có hồn cốt này trong túi đồ.");
  const v = Number.isInteger(rawVohon) ? d.owned.find((x) => x.rowId === rawVohon) : undefined;
  if (!v) return warn("Bạn không sở hữu võ hồn này.");
  if (it.vohonId === v.rowId) return room.sendBag(id);
  if (it.vohonId !== null) return warn("Hồn cốt này đang gắn trên võ hồn khác: tháo ra trước.");
  const slot = BONE_SLOTS[boneSlotIndex(bone.slot)];
  if (rawSlot !== undefined && rawSlot !== null && rawSlot !== bone.slot) {
    const to = BONE_SLOTS[boneSlotIndex(rawSlot)];
    return warn(`Hồn cốt ${slot.name} chỉ gắn vào ô ${slot.name}${to ? `, không gắn vào ô ${to.name}` : ""}.`);
  }
  const lock = room.boneLock(p, d); if (lock) return warn(lock);
  const old = room.bonesOn(d, v.rowId).find((b) => b.slot === bone.slot)?.it;
  if (old) old.vohonId = null;
  it.vohonId = v.rowId; d.bagDirty = true;
  const vname = VOHON[Math.max(0, vohonIndex(v.vohon))].name;
  room.log(id, `Gắn ${room.itemLabel(it)} vào ô ${slot.name} của ${vname}.${old ? ` ${room.itemLabel(old)} về túi đồ.` : ""}`, TIERS[tierOfYears(it.years!)].glow);
  room.questEvent(id, { k: "equip" }); // 6.2
  room.afterBones(id, v);
}

/** Tháo hồn cốt `rawItem` đang gắn trên một võ hồn của chính người gửi về túi; túi đầy thì từ chối. Giữ nguyên cấp cường hóa. */
export function unequipBone(room: MapRoom, id: string, rawItem: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem && i.vohonId !== null && i.code === BONE_ITEM) : undefined;
  if (!it) return warn("Hồn cốt này không gắn trên võ hồn nào.");
  const lock = room.boneLock(p, d); if (lock) return warn(lock);
  if (bagUsed(d.bag) >= d.bagSlots) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới tháo được hồn cốt.`);
  const v = d.owned.find((x) => x.rowId === it.vohonId);
  it.vohonId = null; d.bagDirty = true;
  room.log(id, `Tháo ${room.itemLabel(it)}${v ? ` khỏi ${VOHON[Math.max(0, vohonIndex(v.vohon))].name}` : ""} về túi đồ (giữ cường hóa +${it.enhance}).`);
  if (v) room.afterBones(id, v); else room.sendBag(id);
}

/**
 * Cường hóa hồn cốt `rawTarget` (id ô của chính người gửi, trong túi hoặc đang gắn) bằng các hồn cốt nguyên liệu `rawMats` (mục
 * 5.5, bước 4.4): nguyên liệu phải là hồn cốt nằm trong túi (không đang gắn), không phải chính nó, không trùng, tối đa
 * BONE_FEED_MAX món. Điểm tính bằng boneEnhancePreview (niên hạn, cùng vị trí +50%, trả lại phần điểm đã nạp vào nguyên liệu),
 * cộng dồn vào `stats.xp`, cấp ở `items.enhance` (tối đa +20, điểm dư bị bỏ). Mỗi mốc BONE_ENHANCE_MILESTONES vượt qua thêm 1 dòng
 * phụ ngẫu nhiên (#187, boneAddSubs, ghi vào `stats.subs`). Phí Hồn Tệ của mọi cấp vừa vượt qua (#281, enhanceFee theo
 * BONE_ENHANCE_FEE) trừ cùng lúc với nguyên liệu; thiếu thì từ chối cả lần, không mất gì. Không bao giờ thất bại, nguyên liệu bị
 * xóa khỏi túi. Cùng luật như gắn / tháo (boneLock: ngoài giao chiến, không gục, không hấp thụ), không đang chuyển bản đồ. Hồn cốt
 * đang gắn thì chỉ số / kỹ năng đổi ngay (afterBones). Ghi DB qua chuỗi lưu (save) như các thay đổi túi đồ khác (túi và Hồn Tệ cùng
 * một transaction); transaction đi cổng cũng mang theo nếu lần lưu này chưa kịp chạy. Lò rèn ở Nặc Đinh Thành
 * (6.1) sẽ mở cùng message này.
 */
export function enhanceBone(room: MapRoom, id: string, rawTarget: unknown, rawMats: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const boneIn = (it: Item | undefined) => (it && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null);
  const it = typeof rawTarget === "string" ? d.bag.find((i) => i.id === rawTarget) : undefined, bone = boneIn(it);
  if (!it || !bone) return warn("Không có hồn cốt này để cường hóa.");
  if (it.enhance >= BONE_MAX_ENHANCE) return warn(`${room.itemLabel(it)} đã cường hóa tối đa +${BONE_MAX_ENHANCE}.`);
  if (!Array.isArray(rawMats) || !rawMats.length) return warn("Chọn ít nhất một hồn cốt làm nguyên liệu.");
  if (rawMats.length > BONE_FEED_MAX) return warn(`Mỗi lần cường hóa tối đa ${BONE_FEED_MAX} nguyên liệu.`);
  if (new Set(rawMats).size !== rawMats.length) return warn("Nguyên liệu bị chọn trùng.");
  const mats: Item[] = [];
  for (const raw of rawMats) {
    if (raw === it.id) return warn("Không dùng chính hồn cốt đang cường hóa làm nguyên liệu.");
    const m = typeof raw === "string" ? d.bag.find((i) => i.id === raw) : undefined;
    if (!m || !boneIn(m)) return warn("Nguyên liệu phải là hồn cốt trong túi đồ.");
    if (m.vohonId !== null) return warn(`${room.itemLabel(m)} đang gắn trên võ hồn: tháo ra trước mới dùng làm nguyên liệu được.`);
    if (m.locked) return warn(`${room.itemLabel(m)} đang khoá: mở khoá rồi mới dùng làm nguyên liệu được.`);
    mats.push(m);
  }
  const lock = room.boneLock(p, d); if (lock) return warn(lock.replace("gắn / tháo", "cường hóa"));
  const r = boneEnhancePreview({ slot: bone.slot, xp: boneXp(it.stats) },
    mats.map((m) => ({ slot: parseBone(m.stats)!.slot, years: m.years!, xp: boneXp(m.stats) })));
  const fee = enhanceFee(BONE_ENHANCE_FEE, r.from, r.level); // #281: phí mỗi cấp vừa vượt qua, thiếu thì từ chối cả lần
  if (d.honTe < fee) return warn(`Không đủ Hồn Tệ: cường hóa lên +${r.level} cần phí ${formatHonTe(fee)}, đang có ${formatHonTe(d.honTe)}.`);
  const sub = boneAddSubs(bone.slot, it.years!, r.level, parseBoneSubs(it.stats), Math.random); // #187: dòng phụ ở mốc
  const drop = new Set(mats);
  d.bag = d.bag.filter((x) => !drop.has(x));
  it.stats = { ...(it.stats as object), xp: r.xp, ...(sub.added.length ? { subs: sub.subs } : {}) }; it.enhance = r.level; d.honTe -= fee; d.bagDirty = true;
  const up = r.level > r.from ? ` lên +${r.level}` : ` (vẫn +${r.level})`;
  room.log(id, `Cường hóa ${room.itemLabel(it)}${up}: ${mats.length} nguyên liệu, +${r.gain.toLocaleString("vi-VN")} điểm`
    + (fee ? `, phí −${formatHonTe(fee)} (còn ${formatHonTe(d.honTe)})` : "")
    + (r.waste ? ` (dư ${r.waste.toLocaleString("vi-VN")} điểm bị bỏ vì đã tối đa)` : "")
    + sub.added.map(([k, v]) => `; thêm dòng phụ ${coreStatText(k, v)}`).join("") + ".", TIERS[tierOfYears(it.years!)].glow);
  room.clients.getById(id)?.send("enhanced", { id: it.id, from: r.from, to: r.level, gain: r.gain, xp: r.xp, used: mats.length, fee,
    subs: sub.added.map(([k, v]) => ({ k, v })) });
  const v = it.vohonId !== null ? d.owned.find((x) => x.rowId === it.vohonId) : undefined;
  if (v) room.afterBones(id, v); else room.sendBag(id);
  room.save(id); // nguyên liệu đã mất: ghi ngay qua chuỗi lưu
}

/**
 * Gắn hồn hạch `rawItem` (id ô trong túi) vào ô `rawSlot` (0..CORE_SLOTS − 1; bỏ trống thì ô trống đầu tiên) của võ hồn `rawVohon`
 * (vohons.id) của chính người gửi (mục 5.6). Ô nào cũng nhận mọi hồn hạch. Ô đã có thì đổi chỗ, món cũ về túi (số ô túi không đổi);
 * hồn hạch đang gắn trên chính võ hồn đó thì chuyển sang ô kia (hai ô đổi chỗ cho nhau). Cùng luật với hồn cốt (boneLock), không
 * đang chuyển bản đồ. Đổi trong bộ nhớ ngay; ghi DB cùng lần lưu túi kế tiếp (ô ở `items.stats.slot`, võ hồn ở `items.vohon_id`;
 * lưu định kỳ, rời phòng, transaction đi cổng). Võ hồn đang ra trận thì chỉ số và hiệu ứng bộ đổi ngay.
 */
export function equipCore(room: MapRoom, id: string, rawItem: unknown, rawVohon: unknown, rawSlot: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem) : undefined;
  const core = it && it.code === CORE_ITEM ? parseCore(it.stats) : null;
  if (!it || !core) return warn("Không có hồn hạch này trong túi đồ.");
  const v = Number.isInteger(rawVohon) ? d.owned.find((x) => x.rowId === rawVohon) : undefined;
  if (!v) return warn("Bạn không sở hữu võ hồn này.");
  if (it.vohonId !== null && it.vohonId !== v.rowId) return warn("Hồn hạch này đang gắn trên võ hồn khác: tháo ra trước.");
  const vname = VOHON[Math.max(0, vohonIndex(v.vohon))].name, worn = room.coresOn(d, v.rowId);
  const full = `${vname} đã đủ ${CORE_SLOTS} hồn hạch: chọn một ô để thay.`;
  let slot: number;
  if (rawSlot === undefined || rawSlot === null) {
    if (it.vohonId === v.rowId) return room.sendBag(id);
    slot = [...Array(CORE_SLOTS).keys()].find((s) => !worn.some((w) => w.slot === s)) ?? -1;
    if (slot < 0) return warn(full);
  } else if (typeof rawSlot === "number" && Number.isInteger(rawSlot) && rawSlot >= 0 && rawSlot < CORE_SLOTS) slot = rawSlot;
  else return warn(`Ô hồn hạch không hợp lệ: chỉ có ô 1–${CORE_SLOTS}.`);
  const lock = room.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock);
  const st = (x: Item) => x.stats as Record<string, unknown>, ow = worn.find((w) => w.slot === slot && w.it !== it), old = ow?.it;
  const oldName = ow ? coreName(ow.data.set, ow.stars, ow.it.enhance) : "";
  if (it.vohonId === v.rowId) {
    // Đổi chỗ trong cùng võ hồn: chỉ số và bộ không đổi.
    const from = coreSlotOf(it.stats); if (from === slot) return room.sendBag(id);
    if (old) { if (from >= 0) st(old).slot = from; else delete st(old).slot; }
    st(it).slot = slot; d.bagDirty = true;
    room.log(id, `Chuyển ${room.itemLabel(it)} sang ô ${slot + 1} của ${vname}.${old && from >= 0 ? ` ${oldName} sang ô ${from + 1}.` : ""}`);
    return room.sendBag(id);
  }
  if (!old && worn.length >= CORE_SLOTS) return warn(full);
  if (old) { old.vohonId = null; delete st(old).slot; }
  it.vohonId = v.rowId; st(it).slot = slot; d.bagDirty = true;
  room.log(id, `Gắn ${room.itemLabel(it)} vào ô ${slot + 1} của ${vname}.${old ? ` ${oldName} về túi đồ.` : ""}${room.coreSetNote(d, v.rowId, core.set)}`,
    CORE_SETS[coreSetIndex(core.set)]?.col);
  room.questEvent(id, { k: "equip" }); // 6.2
  room.afterBones(id, v);
}

/** Tháo hồn hạch `rawItem` đang gắn trên một võ hồn của chính người gửi về túi; túi đầy thì từ chối. Giữ nguyên cấp nâng cấp. */
export function unequipCore(room: MapRoom, id: string, rawItem: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem && i.vohonId !== null && i.code === CORE_ITEM) : undefined;
  if (!it) return warn("Hồn hạch này không gắn trên võ hồn nào.");
  const lock = room.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock);
  if (bagUsed(d.bag) >= d.bagSlots) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới tháo được hồn hạch.`);
  const v = d.owned.find((x) => x.rowId === it.vohonId);
  it.vohonId = null; if (it.stats && typeof it.stats === "object") delete (it.stats as Record<string, unknown>).slot; d.bagDirty = true;
  room.log(id, `Tháo ${room.itemLabel(it)}${v ? ` khỏi ${VOHON[Math.max(0, vohonIndex(v.vohon))].name}` : ""} về túi đồ (giữ nâng cấp +${it.enhance}).`);
  if (v) room.afterBones(id, v); else room.sendBag(id);
}

/**
 * Nâng cấp hồn hạch `rawTarget` (id ô của chính người gửi, trong túi hoặc đang gắn) bằng các hồn hạch nguyên liệu `rawMats` (mục
 * 5.6, bước 5.3): nguyên liệu phải là hồn hạch nằm trong túi (không đang gắn), không phải chính nó, không trùng, tối đa
 * CORE_FEED_MAX món; một món sai thì cả lần bị từ chối, không mất gì. Điểm tính bằng coreEnhancePreview (theo sao, cùng bộ thêm,
 * trả lại phần điểm đã nạp vào nguyên liệu), cộng dồn vào `stats.xp`, cấp ở `items.enhance` (tối đa +15, điểm dư bị bỏ). Mỗi mốc
 * +3 / +6 / +9 / +12 / +15 vượt qua thì tăng 1 dòng phụ ngẫu nhiên (coreUpgradeSubs, ghi vào `stats.subs`). Phí Hồn Tệ như hồn
 * cốt (#281, CORE_ENHANCE_FEE): thiếu thì từ chối cả lần. Không bao giờ thất bại, nguyên liệu bị xóa khỏi túi. Cùng luật như gắn
 * / tháo (boneLock), không đang chuyển bản đồ. Đang gắn thì chỉ số đổi ngay (afterBones). Ghi DB qua chuỗi lưu (save) như cường hóa hồn cốt; transaction đi cổng cũng mang theo nếu lần lưu chưa kịp chạy.
 */
export function enhanceCore(room: MapRoom, id: string, rawTarget: unknown, rawMats: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const coreIn = (it: Item | undefined) => (it && it.code === CORE_ITEM ? parseCore(it.stats) : null);
  const it = typeof rawTarget === "string" ? d.bag.find((i) => i.id === rawTarget) : undefined, core = coreIn(it);
  if (!it || !core) return warn("Không có hồn hạch này để nâng cấp.");
  if (it.enhance >= CORE_MAX_ENHANCE) return warn(`${room.itemLabel(it)} đã nâng cấp tối đa +${CORE_MAX_ENHANCE}.`);
  if (!Array.isArray(rawMats) || !rawMats.length) return warn("Chọn ít nhất một hồn hạch làm nguyên liệu.");
  if (rawMats.length > CORE_FEED_MAX) return warn(`Mỗi lần nâng cấp tối đa ${CORE_FEED_MAX} nguyên liệu.`);
  if (new Set(rawMats).size !== rawMats.length) return warn("Nguyên liệu bị chọn trùng.");
  const mats: Item[] = [];
  for (const raw of rawMats) {
    if (raw === it.id) return warn("Không dùng chính hồn hạch đang nâng cấp làm nguyên liệu.");
    const m = typeof raw === "string" ? d.bag.find((i) => i.id === raw) : undefined;
    if (!m || !coreIn(m)) return warn("Nguyên liệu phải là hồn hạch trong túi đồ.");
    if (m.vohonId !== null) return warn(`${room.itemLabel(m)} đang gắn trên võ hồn: tháo ra trước mới dùng làm nguyên liệu được.`);
    if (m.locked) return warn(`${room.itemLabel(m)} đang khoá: mở khoá rồi mới dùng làm nguyên liệu được.`);
    mats.push(m);
  }
  const lock = room.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock.replace("gắn / tháo", "nâng cấp"));
  const stars = it.stars ?? 1, r = coreEnhancePreview({ set: core.set, xp: coreXp(it.stats), subs: core.subs.length },
    mats.map((m) => ({ set: parseCore(m.stats)!.set, stars: m.stars ?? 1, xp: coreXp(m.stats) })));
  const fee = enhanceFee(CORE_ENHANCE_FEE, r.from, r.level); // #281: như hồn cốt
  if (d.honTe < fee) return warn(`Không đủ Hồn Tệ: nâng cấp lên +${r.level} cần phí ${formatHonTe(fee)}, đang có ${formatHonTe(d.honTe)}.`);
  const up = coreUpgradeSubs(core, stars, r.rolls, Math.random), label = room.itemLabel(it); // tên trước khi lên cấp
  const drop = new Set(mats);
  d.bag = d.bag.filter((x) => !drop.has(x));
  it.stats = { ...(it.stats as object), subs: up.data.subs, xp: r.xp }; it.enhance = r.level; d.honTe -= fee; d.bagDirty = true;
  const lv = r.level > r.from ? ` lên +${r.level}` : ` (vẫn +${r.level})`;
  // "thêm dòng phụ Công +3,2%" / "dòng phụ Sinh lực +150 (tăng +62)"
  const subs = up.ups.map((u) => (u.add ? `thêm dòng phụ ${coreStatText(u.k, u.v)}`
    : `dòng phụ ${coreStatText(u.k, u.to)} (tăng +${coreStatText(u.k, u.v).split(" +").pop()})`));
  room.log(id, `Nâng cấp ${label}${lv}: ${mats.length} nguyên liệu, +${r.gain.toLocaleString("vi-VN")} điểm`
    + (fee ? `, phí −${formatHonTe(fee)} (còn ${formatHonTe(d.honTe)})` : "")
    + (r.waste ? ` (dư ${r.waste.toLocaleString("vi-VN")} điểm bị bỏ vì đã tối đa)` : "") + (subs.length ? `; ${subs.join("; ")}` : "") + ".",
    CORE_SETS[coreSetIndex(core.set)]?.col);
  room.clients.getById(id)?.send("enhancedcore", { id: it.id, from: r.from, to: r.level, gain: r.gain, xp: r.xp, used: mats.length, fee, subs: up.ups });
  const v = it.vohonId !== null ? d.owned.find((x) => x.rowId === it.vohonId) : undefined;
  if (v) room.afterBones(id, v); else room.sendBag(id);
  room.save(id); // nguyên liệu đã mất: ghi ngay qua chuỗi lưu
}

/**
 * Đổi bộ hồn hạch `rawItem` (id ô của chính người gửi, trong túi hoặc đang gắn) sang bộ `rawSet` ở Thợ rèn (mục 5.6 "Đổi bộ",
 * #283): phải đứng trong NPC_RANGE của Thợ rèn (`rawNpc` = mã Thợ rèn đang mở hộp thoại, thiếu thì Thợ rèn gần nhất), ngoài giao
 * chiến (boneLock); bộ đích phải có trong CORE_SETS và khác bộ hiện tại; phí coreResetFee(sao) mỗi lần, thiếu thì từ chối.
 * Chỉ đổi `stats.set` (giữ sao, cấp, điểm, chỉ số chính, dòng phụ, khoá). Đang gắn thì tính lại hiệu ứng bộ ngay (afterBones).
 * Ghi món và Hồn Tệ cùng một lần qua chuỗi lưu (save).
 */
export function resetCoreSet(room: MapRoom, id: string, rawItem: unknown, rawSet: unknown, rawNpc: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => { room.log(id, text, "#ffb35c"); room.sendBag(id); };
  const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem) : undefined, core = it && it.code === CORE_ITEM ? parseCore(it.stats) : null;
  if (!it || !core) return warn("Không có hồn hạch này để đổi bộ.");
  const npc = typeof rawNpc === "string" ? room.npcNear(id, { id: rawNpc }) : room.npcNear(id, { role: "forge" });
  if (!npc || npcDef(npc.id)?.role !== "forge") return warn("Hãy lại gần Thợ rèn hơn để đổi bộ hồn hạch.");
  const lock = room.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock.replace("gắn / tháo", "đổi bộ"));
  if (typeof rawSet !== "string" || coreSetIndex(rawSet) < 0) return warn("Bộ hồn hạch không hợp lệ.");
  if (rawSet === core.set) return warn(`${room.itemLabel(it)} đã thuộc ${coreSetName(rawSet)}.`);
  const fee = coreResetFee(it.stars ?? 1);
  if (d.honTe < fee) return warn(`Không đủ Hồn Tệ: đổi bộ cần phí ${formatHonTe(fee)}, đang có ${formatHonTe(d.honTe)}.`);
  const from = coreSetName(core.set), label = room.itemLabel(it);
  it.stats = { ...(it.stats as object), set: rawSet }; d.honTe -= fee; d.bagDirty = true;
  room.log(id, `Đổi bộ ${label}: ${from} → ${coreSetName(rawSet)}, phí −${formatHonTe(fee)} (còn ${formatHonTe(d.honTe)}).`, CORE_SETS[coreSetIndex(rawSet)].col);
  const v = it.vohonId !== null ? d.owned.find((x) => x.rowId === it.vohonId) : undefined;
  if (v) room.afterBones(id, v); else room.sendBag(id);
  room.save(id);
}

/** Luật chung khi gắn / tháo hồn cốt (từ 5.2 cả hồn hạch: `what`), như xếp đội hình: không gục, không hấp thụ, ngoài giao chiến. "" = được. */
export function boneLock(p: PlayerState, d: PData, what = "hồn cốt") {
  if (p.dead) return `Đã gục ngã, không thể gắn / tháo ${what}.`;
  if (d.absorbing) return `Đang hấp thụ hồn hoàn, không thể gắn / tháo ${what}.`;
  if (d.fight < TEAM_COMBAT_SECS) return `Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới gắn / tháo ${what} được.`;
  return "";
}

/**
 * Sau khi gắn / tháo hồn cốt hoặc hồn hạch (5.2) trên võ hồn `v`: võ hồn ra trận thì tính lại chỉ số (và hiệu ứng bộ) ngay; gửi lại
 * túi và sinh lực đội (sinh lực tối đa đổi).
 */
export function afterBones(room: MapRoom, id: string, v: Character) {
  const d = room.pdata.get(id)!;
  if (v === d.ch) room.recalc(id, false);
  room.resCheck(id); // cộng minh (8.2): hồn cốt +10 / hồn hạch 5★ đang gắn
  room.sendBag(id);
  room.sendSquad(id, true);
}
