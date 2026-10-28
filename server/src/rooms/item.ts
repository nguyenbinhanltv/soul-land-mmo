// Dùng vật phẩm và nhặt đồ (GAME_DESIGN.md mục 5.1, 5.2, 5.13; docs/design/kinh-te-tui-do.md), tách khỏi MapRoom.ts (#702, bước 23):
// `pickup` (nhặt hồn hoàn / hồn cốt / hồn hạch / trang bị / mảnh dưới đất), `useItem` (dùng món trong túi: đan, Hồi Thành Phù, Ủy Thác Lệnh) và `useHerb` (tiên thảo cho võ hồn).
// Hàm nhận phòng (`room: MapRoom`) như loot.ts / bag.ts; nguyên văn từ MapRoom, không đổi số / thứ tự xử lý / thứ tự ghi DB qua `room.chain`. MapRoom chỉ chuyển tiếp 3 hàm
// (`onMessage("pickup" / "use")`, `autoHunt.ts` gọi `room.pickup` như cũ). Còn ở MapRoom: `addItem` / `addRing` / `addBone` / `addEquip`, `takeItem`, `canLoot`, `lootNote` / `shardNote`, `useAutoToken`.
import type { MapRoom, PData } from "./MapRoom.ts";
import { DropState } from "./schema.ts";
import { TIERS, VOHON, vohonIndex, BEASTS, itemDef, DAN_CD, formatYears, PICKUP_RANGE, BONE_ITEM, BONE_SLOTS, boneName, CORE_ITEM, CORE_SETS, coreName, EQUIP_ITEM, equipName, EQUIP_TEMPLATES, EQUIP_TIERS, HERB_MAX, herbDef, herbText, BICANH, xpBlocked } from "../../../shared/data.ts";
import { store, type Item } from "../db.ts";

/**
 * Nhặt hồn hoàn gần nhất (cách dưới PICKUP_RANGE) vào túi đồ (mục 5.2 "Hồn hoàn là vật phẩm"): DROP_OWNER_SECS giây đầu chỉ
 * người hạ hồn thú nhặt được; túi đầy thì báo và hồn hoàn ở lại dưới đất. Client chỉ gửi ý định, server chọn theo vị trí.
 * Đồ rơi chồng nhau thì chọn món gần nhất mà người này được nhặt (của mình hoặc đã hết ưu tiên), để đồ của người khác nằm
 * trên không chặn đồ của mình; không có món nào được nhặt thì báo theo món gần nhất.
 * `only` (tự săn, mục 5.13): chỉ xét đúng món đó (vẫn kiểm PICKUP_RANGE, quyền nhặt, túi đầy như trên), để món bị bộ lọc nhặt bỏ qua
 * nằm gần hơn không bị nhặt thay. Tin `pickup` của người chơi không có `did`.
 */
export function pickup(room: MapRoom, id: string, only?: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || p.dead || d.travelling) return;
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  const mine = (dr: DropState) => room.canLoot(dr, id);
  // Chưa được nhặt: còn bao lâu, của ai (người hạ hay tổ đội của người hạ, 7.1).
  const lock = (dr: DropState, what: string) => `${what} thuộc về ${dr.party ? "tổ đội của " : ""}người hạ hồn thú: còn ${Math.ceil(dr.ownerTtl)} giây nữa mới nhặt được.`;
  let best: [string, DropState] | undefined, bd = PICKUP_RANGE;
  const pool: Iterable<[string, DropState]> = only === undefined ? room.state.drops.entries()
    : room.state.drops.has(only) ? [[only, room.state.drops.get(only)!]] : [];
  for (const [did, dr] of pool) {
    const dd = Math.hypot(dr.x - p.x, dr.y - p.y);
    if (dd < PICKUP_RANGE && (!best || (mine(dr) && !mine(best[1])) || (mine(dr) === mine(best[1]) && dd < bd))) { bd = dd; best = [did, dr]; }
  }
  if (!best) return warn("Không có hồn hoàn hay vật phẩm nào ở gần để nhặt.");
  const [did, dr] = best, label = formatYears(dr.years);
  // Từ 4.1: hồn cốt dưới đất, cùng luật ưu tiên người hạ như hồn hoàn; túi đầy thì báo và hồn cốt ở lại.
  if (dr.item === BONE_ITEM) {
    const beast = BEASTS[dr.species]?.id ?? "", slot = BONE_SLOTS[dr.slot]?.id ?? BONE_SLOTS[0].id, name = `hồn cốt ${boneName(beast, slot, dr.years)}`;
    if (!mine(dr)) return warn(lock(dr, "Hồn cốt"));
    if (!room.addBone(d, dr.years, beast, slot)) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
    room.state.drops.delete(did);
    room.log(id, `Nhặt ${name} vào túi đồ (B để xem chỉ số).`, TIERS[dr.tier].glow);
    room.sendBag(id);
    return;
  }
  // Từ 5.1: hồn hạch dưới đất, cùng luật ưu tiên người hạ như hồn hoàn; túi đầy thì báo và hồn hạch ở lại.
  if (dr.item === CORE_ITEM) {
    const core = room.coreDrops.get(did), name = coreName(CORE_SETS[dr.cset]?.id ?? "", dr.stars);
    if (!mine(dr)) return warn(lock(dr, name));
    if (!core) { room.state.drops.delete(did); return warn(`${name} đã tan biến.`); } // không xảy ra: mọi hồn hạch rơi đều có trong coreDrops
    if (!room.addCore(d, core.stars, core.data)) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
    room.state.drops.delete(did); room.coreDrops.delete(did);
    room.log(id, `Nhặt ${name} vào túi đồ (B để xem chỉ số).`, CORE_SETS[dr.cset]?.col);
    room.sendBag(id);
    return;
  }
  // E2: trang bị dưới đất, cùng luật ưu tiên người hạ; túi đầy thì báo và món ở lại.
  if (dr.item === EQUIP_ITEM) {
    const eq = room.equipDrops.get(did), tpl = EQUIP_TEMPLATES[dr.cset], name = equipName(tpl?.id);
    if (!mine(dr)) return warn(lock(dr, name));
    if (!eq) { room.state.drops.delete(did); return warn(`${name} đã tan biến.`); } // không xảy ra: mọi trang bị rơi đều có trong equipDrops
    if (!room.addEquip(d, eq)) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
    room.state.drops.delete(did); room.equipDrops.delete(did);
    room.log(id, `Nhặt ${name} vào túi đồ (B để xem chỉ số).`, EQUIP_TIERS[tpl?.tier ?? 0]?.col);
    room.sendBag(id);
    return;
  }
  // Từ 3.4: mảnh võ hồn rơi xuống đất (túi người hạ đã đầy), cùng luật ưu tiên; túi chỉ nhận một phần thì phần còn lại ở lại.
  if (dr.item) {
    const def = itemDef(dr.item), name = def?.name ?? "vật phẩm lạ";
    if (!mine(dr)) return warn(lock(dr, name));
    const got = room.addItem(d, dr.item, dr.qty);
    if (!got) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
    if (got < dr.qty) dr.qty -= got; else room.state.drops.delete(did);
    room.log(id, `Nhặt ${got} ${name} vào túi đồ${room.shardNote(d, dr.item)}.`, def?.col);
    room.sendBag(id);
    return;
  }
  if (!mine(dr)) return warn(lock(dr, `Hồn hoàn ${label}`));
  if (!room.addRing(d, dr.years)) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được hồn hoàn ${label}.`);
  room.state.drops.delete(did);
  room.log(id, `Nhặt hồn hoàn ${label} (${TIERS[dr.tier].color}) vào túi đồ. Mở túi (B) để hấp thụ.`, TIERS[dr.tier].glow);
  room.sendBag(id);
}

/**
 * Dùng một món trong túi theo id (client chỉ gửi id ô). Server kiểm tra món đó nằm trong túi của chính người gửi, dùng được,
 * người chơi không gục / không hấp thụ / không đang chuyển bản đồ, hết hồi chiêu chung đan, và không phí đan khi đã đầy.
 * Đan dùng được cả khi giao chiến và trong vùng an toàn. Từ BĐ6b tiên thảo cũng qua đây, kèm `vohonId` (useHerb).
 */
export function useItem(room: MapRoom, id: string, raw: unknown, vohonId?: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
  if (!it) return warn("Không có vật phẩm này trong túi đồ.");
  const def = itemDef(it.code);
  if (def?.kind === "tien_thao") return useHerb(room, id, d, it, vohonId);
  if (def?.kind === "kinh_quyen") return useTome(room, id, d, it, vohonId); // Hồn Kinh Quyển (Bí Cảnh, 5.22)
  if (def?.recall) return room.useRecall(id, it); // Hồi Thành Phù (11.2)
  if (def?.auto) return room.useAutoToken(id, d, it, def); // Ủy Thác Lệnh (Auto 2)
  if (!def || !(def.hp || def.mp)) return warn(`${def?.name ?? "Vật phẩm này"} không dùng trực tiếp được.`);
  if (p.dead) return warn("Đã gục ngã, không thể dùng đan dược.");
  if (d.absorbing) return warn("Đang hấp thụ hồn hoàn, không thể dùng đan dược.");
  if (def.cd && d.danCd > 0) return warn(`Đan dược đang hồi: còn ${Math.ceil(d.danCd)} giây.`);
  if ((!def.hp || d.hpF >= p.maxHp) && (!def.mp || d.mpF >= p.maxMp)) return warn(def.hp ? "Sinh lực đang đầy." : "Hồn lực đang đầy.");
  const hp0 = p.hp, mp0 = p.mp;
  if (def.hp) d.hpF = Math.min(p.maxHp, d.hpF + p.maxHp * def.hp);
  if (def.mp) d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * def.mp);
  p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
  if (def.cd) d.danCd = DAN_CD;
  room.takeItem(d, it, 1);
  room.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 22, col: def.col });
  const gain = [def.hp ? `+${p.hp - hp0} sinh lực` : "", def.mp ? `+${p.mp - mp0} hồn lực` : ""].filter(Boolean).join(", ");
  room.log(id, `Dùng ${def.name}: ${gain}.`, def.col);
  room.sendBag(id);
}

/**
 * Dùng tiên thảo `it` cho võ hồn `raw` (vohons.id, phải là võ hồn của chính người gửi): võ hồn đó +HERB_PCT % chỉ số của loại tiên
 * thảo, vĩnh viễn, mỗi loại tối đa HERB_MAX cây mỗi võ hồn. Dùng được cả khi giao chiến (như lên sao); trong sân đấu thì `use` bị chặn.
 * Bớt 1 cây và ghi số cây trên võ hồn ngay, rồi trong chuỗi lưu ghi võ hồn và túi trong MỘT transaction (store.saveVohonsBag, như
 * lên sao); lỗi thì đánh dấu để lần lưu sau ghi tiếp.
 */
export function useHerb(room: MapRoom, id: string, d: PData, it: Item, raw: unknown) {
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  const h = herbDef(it.code), v = d.owned.find((x) => x.rowId === raw); if (!h) return warn("Vật phẩm này không dùng trực tiếp được.");
  if (!v) return warn(`Chọn võ hồn để dùng ${h.name}.`);
  const name = VOHON[Math.max(0, vohonIndex(v.vohon))].name, n = v.herbs[h.id] ?? 0;
  if (n >= HERB_MAX) return warn(`${name} đã dùng đủ ${HERB_MAX} cây ${h.name}.`);
  room.takeItem(d, it, 1);
  v.herbs = { ...v.herbs, [h.id]: n + 1 };
  if (v === d.ch) room.recalc(id, false); else d.dirty.add(v.rowId);
  const p = room.state.players.get(id);
  if (p) room.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 24, col: h.col });
  room.log(id, `${name} dùng ${h.name} (${n + 1}/${HERB_MAX}): tiên thảo đã dùng ${herbText(v.herbs)}.`, h.col);
  const c = room.clients.getById(id); if (c) room.sendVohons(c);
  room.sendBag(id);
  room.chain(d, async () => {
    const list = room.unsaved(id), bag = room.bagSnapshot(d);
    if (!list.some((x) => x.rowId === v.rowId)) list.push({ ...v, rings: [...v.rings], skills: [...v.skills], herbs: { ...v.herbs } });
    try { await store.saveVohonsBag(d.accountId, list, bag); }
    catch (e) { for (const x of list) if (x.rowId !== d.ch.rowId) d.dirty.add(x.rowId); d.bagDirty = true; throw e; }
  });
}

/**
 * Dùng Hồn Kinh Quyển `it` (Bí Cảnh, mục 5.22) cho võ hồn `raw` (vohons.id, mọi võ hồn trong bộ sưu tập của chính người gửi, kể cả dự bị): +BICANH.tomeXp kinh nghiệm qua
 * đúng đường cộng của hạ hồn thú (`addXp` cho võ hồn ra trận, `benchXp` cho võ hồn khác) nên vẫn dừng ở bình cảnh; võ hồn đang ở bình cảnh / cấp tối đa thì từ chối, không mất quyển.
 * Dùng được cả khi giao chiến (như tiên thảo), không dùng khi đang hấp thụ; trong sân đấu `use` bị chặn. Bớt 1 quyển và cộng kinh nghiệm ngay, rồi trong chuỗi lưu ghi võ hồn và túi
 * trong MỘT transaction (store.saveVohonsBag); lỗi thì đánh dấu để lần lưu sau ghi tiếp.
 */
export function useTome(room: MapRoom, id: string, d: PData, it: Item, raw: unknown) {
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  const def = itemDef(it.code), v = d.owned.find((x) => x.rowId === raw);
  if (!def) return warn("Vật phẩm này không dùng trực tiếp được.");
  if (!v) return warn(`Chọn võ hồn để dùng ${def.name}.`);
  if (d.absorbing) return warn("Đang hấp thụ hồn hoàn, không dùng được kinh quyển.");
  if (v === d.ch) room.syncCh(id); // võ hồn ra trận: cấp / vòng thật ở PlayerState, chép về d.ch trước khi kiểm bình cảnh (như absorb.ts)
  const name = VOHON[Math.max(0, vohonIndex(v.vohon))].name;
  if (xpBlocked(v.level, v.rings.length)) return warn(`${name} đang ở bình cảnh (cấp ${v.level}): hãy hấp thụ hồn hoàn kế tiếp rồi dùng ${def.name}.`);
  room.takeItem(d, it, 1);
  const p = room.state.players.get(id);
  if (v === d.ch) room.addXp(id, BICANH.tomeXp); else room.benchXp(id, v, BICANH.tomeXp);
  if (p) room.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 24, col: def.col });
  room.log(id, `${name} đọc ${def.name}: +${BICANH.tomeXp} kinh nghiệm.`, def.col);
  const c = room.clients.getById(id); if (c) room.sendVohons(c);
  room.sendBag(id);
  room.chain(d, async () => {
    const list = room.unsaved(id), bag = room.bagSnapshot(d);
    try { await store.saveVohonsBag(d.accountId, list, bag); }
    catch (e) { for (const x of list) if (x.rowId !== d.ch.rowId) d.dirty.add(x.rowId); d.bagDirty = true; throw e; }
  });
}
