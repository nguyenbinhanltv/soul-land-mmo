// Mặc nhanh: chỉ server chọn món, dùng đúng điểm Sức mạnh đội hình hiện hành.
import { randomUUID } from "node:crypto";
import { ASK_CD, EQUIP_ITEM, EQUIP_SLOTS, equipSlotIndex, equipTemplate, parseEquip } from "../../../shared/data.ts";
import type { Item } from "../db.ts";
import { type MapRoom, type PData } from "./MapRoom.ts";
import { claimHeld } from "./common.ts";
import { afterGear } from "./equip.ts";
import { gearStats } from "./items.ts";

const pending = new WeakMap<PData, { token: string; signature: string }>();
const asked = new WeakMap<PData, number>();
const slotOf = (it: Item) => equipSlotIndex(equipTemplate(parseEquip(it.stats)?.tpl)?.slot ?? "");

/** Hòa điểm giữ món cũ; giữa các ứng viên hòa điểm chọn ID tăng dần. Mỗi bước chọn mức tăng lớn nhất. */
export function chooseBest(bag: readonly Item[], worn: readonly Item[], score: (gear: Item[]) => number, slot?: number) {
  let gear = [...worn], power = score(gear);
  const before = power;
  const candidates = bag.filter((it) => it.code === EQUIP_ITEM && it.vohonId === null && !it.locked && slotOf(it) >= 0)
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const remaining = new Set(slot === undefined ? EQUIP_SLOTS.map((_, i) => i) : [slot]);
  while (remaining.size) {
    let best: Item | undefined, bestPower = power, bestSlot = -1;
    for (const it of candidates) {
      const s = slotOf(it);
      if (!remaining.has(s) || gear.some((g) => g.equipSlot === s && g.locked)) continue;
      const next = [...gear.filter((g) => g.equipSlot !== s), { ...it, equipSlot: s }];
      const n = score(next);
      if (n > bestPower) { best = it; bestPower = n; bestSlot = s; }
    }
    if (!best) break;
    gear = [...gear.filter((g) => g.equipSlot !== bestSlot), { ...best, equipSlot: bestSlot }];
    remaining.delete(bestSlot); power = bestPower;
  }
  const changes = gear.filter((g) => !worn.some((old) => old.id === g.id));
  return { gear, changes, before, after: power };
}

/** Tính trên bản sao PData, không thay chỉ số sống dù hàm chấm điểm ném lỗi. */
export const scoreGear = (room: MapRoom, d: PData, gear: Item[]) => room.teamPowerOf({ ...d, gear, gearSt: gearStats(gear) });

export function equipBest(room: MapRoom, id: string, raw: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id), c = room.clients.getById(id);
  if (!p || !d || !c || d.travelling) return;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
  const m = raw as { slot?: unknown; token?: unknown };
  if (m.slot !== undefined && (typeof m.slot !== "number" || !Number.isInteger(m.slot) || m.slot < 0 || m.slot >= EQUIP_SLOTS.length)) return;
  if (m.token !== undefined && typeof m.token !== "string") return;
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  const lock = room.boneLock(p, d, "trang bị");
  if (lock || claimHeld(d)) { pending.delete(d); return warn(lock || "Đang xử lý vật phẩm, đợi một chút."); }
  // Nhịp riêng bảo vệ vòng chấm điểm; xác nhận không phải chờ thêm một nhịp.
  if (m.token === undefined) {
    const now = Date.now(), last = asked.get(d);
    if (last !== undefined && now - last < ASK_CD * 1000) return;
    asked.set(d, now);
  } else if (pending.get(d)?.token !== m.token) return warn("Bản xem trước không còn hiệu lực. Hãy xem trước lại.");
  const plan = chooseBest(d.bag, d.gear, (gear) => scoreGear(room, d, gear), m.slot as number | undefined);
  const signature = JSON.stringify([m.slot, plan.before, plan.after, plan.gear.map((g) => [g.id, g.equipSlot, g.enhance, g.stats, g.locked])]);
  if (m.token === undefined) {
    const token = randomUUID(); pending.set(d, { token, signature });
    c.send("equipbestp", { token, slot: m.slot, count: plan.changes.length, gain: plan.after - plan.before });
    return;
  }
  const valid = pending.get(d)?.signature === signature; pending.delete(d);
  if (!valid) return warn("Trang bị hoặc đội hình đã đổi. Hãy xem trước lại.");
  if (!plan.changes.length) return warn("Đã mặc tốt nhất theo Sức mạnh đội hình.");
  // Cả bộ đổi đồng bộ rồi lưu một ảnh chụp túi + ô mặc, như equipGear.
  for (const next of plan.changes) {
    const at = d.bag.findIndex((it) => it.id === next.id), it = d.bag[at];
    const oi = d.gear.findIndex((g) => g.equipSlot === next.equipSlot), old = d.gear[oi];
    if (old) { d.gear.splice(oi, 1); delete old.equipSlot; d.lockIds.add(old.id); }
    it.equipSlot = next.equipSlot; d.bag.splice(at, 1, ...(old ? [old] : [])); d.gear.push(it); d.lockIds.add(it.id);
  }
  room.log(id, `Đã đổi ${plan.changes.length} món, Sức mạnh đội hình +${plan.after - plan.before}.`);
  afterGear(room, id, d);
}
