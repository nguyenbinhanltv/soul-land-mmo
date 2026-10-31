// #1465: bộ chọn và chốt server; không cần DB / phòng chạy thật.
import assert from "node:assert/strict";
import { mock } from "node:test";
import { sendGear } from "../src/rooms/equip.ts";
import { chooseBest, equipBest } from "../src/rooms/equipBest.ts";
import { ASK_CD, EQUIP_ITEM, EQUIP_TEMPLATES, EQUIP_SLOTS, rollEquip, equipSlotIndex } from "../../shared/data.ts";
import type { Item } from "../src/db.ts";
import type { MapRoom, PData } from "../src/rooms/MapRoom.ts";
const tpl = EQUIP_TEMPLATES[0], slot = equipSlotIndex(tpl.slot);
const mk = (id: string, enhance: number, locked = false): Item => ({ id, kind: "trang_bi", code: EQUIP_ITEM, qty: 1, years: null, stars: null,
  enhance, stats: rollEquip(tpl, 1, () => 0.5), vohonId: null, created: 0, locked });
const score = (gear: Item[]) => gear.reduce((n, g) => n + g.enhance, 0);
const old = { ...mk("old", 3), equipSlot: slot };
assert.equal(chooseBest([mk("a", 3)], [old], score).changes.length, 0, "Hòa điểm giữ món cũ");
assert.equal(chooseBest([mk("b", 5), mk("a", 5)], [old], score).changes[0].id, "a", "Ứng viên hòa điểm chọn ID tăng dần");
assert.equal(chooseBest([], [old], score).changes.length, 0, "Thiếu món giữ nguyên");
assert.equal(chooseBest([mk("a", 9, true)], [old], score).changes.length, 0, "Không tự mặc món khóa");
assert.equal(chooseBest([mk("a", 9)], [{ ...old, locked: true }], score).changes.length, 0, "Không thay ô đang khóa");
assert.equal(chooseBest([mk("a", 9)], [], score, (slot + 1) % EQUIP_SLOTS.length).changes.length, 0, "Chỉ chọn đúng ô");
assert.equal(chooseBest([mk("a", 9)], [], score).after, 9, "Ô trống nhận món tăng điểm");
assert.equal(old.equipSlot, slot, "Không sửa đầu vào");
function fixture() {
  const sent: { type: string; msg: any }[] = [], logs: string[] = [];
  const d = { bag: [mk("a", 9)], gear: [old], travelling: false, claimBusy: 0, lockIds: new Set() } as unknown as PData;
  let combat = false;
  const room = { pdata: new Map([["me", d]]), state: { players: new Map([["me", {}]]) },
    clients: { getById: () => ({ send: (type: string, msg: unknown) => sent.push({ type, msg }) }) },
    boneLock: () => combat ? "Đang giao chiến" : "", log: (_: string, text: string) => logs.push(text),
    teamPowerOf: (data: PData) => score(data.gear),
  } as unknown as MapRoom;
  return { room, d, sent, logs, combat: () => { combat = true; } };
}
{
  const f = fixture(); equipBest(f.room, "me", {});
  assert.equal(f.sent[0].msg.count, 1); assert.equal(f.sent[0].msg.gain, 6);
  assert.equal(f.d.gear[0].id, "old", "Xem trước chưa đổi đồ");
  f.combat(); equipBest(f.room, "me", { token: f.sent[0].msg.token });
  assert.equal(f.d.gear[0].id, "old", "Giao chiến chặn xác nhận");
}
{
  const f = fixture(); equipBest(f.room, "me", {}); f.d.bag[0].locked = true;
  equipBest(f.room, "me", { token: f.sent[0].msg.token });
  assert.match(f.logs.at(-1)!, /đã đổi/); assert.equal(f.d.gear[0].id, "old", "Khóa sau xem trước làm hết hiệu lực");
  equipBest(f.room, "me", { token: f.sent[0].msg.token }); assert.match(f.logs.at(-1)!, /hiệu lực/, "Token chỉ dùng một lần");
}
{
  const f = fixture(); f.d.claimBusy = 1; equipBest(f.room, "me", {}); assert.equal(f.sent.length, 0, "Chờ ghi DB không nhận lệnh");
}
{
  const f = fixture();
  for (const raw of [null, [], { slot: [] }, { slot: -1 }, { slot: Infinity }, { token: {} }, { token: "giả" }]) equipBest(f.room, "me", raw);
  assert.equal(f.sent.length, 0); assert.equal(f.d.gear[0].id, "old", "Payload sai không đổi đồ");
  // Không để CI bị ngắt lịch làm trôi qua cửa sổ ASK_CD giữa hai lệnh.
  let now = 1_000_000;
  const clock = mock.method(Date, "now", () => now);
  try {
    equipBest(f.room, "me", {}); equipBest(f.room, "me", {});
    assert.equal(f.sent.length, 1, "Giới hạn nhịp xem trước");
    now += ASK_CD - 1;
    equipBest(f.room, "me", {});
    assert.equal(f.sent.length, 1, "Chưa đủ ASK_CD vẫn chặn xem trước");
    now += 1;
    equipBest(f.room, "me", {});
    assert.equal(f.sent.length, 2, "Đúng ASK_CD cho xem trước lại; lệnh bị chặn không dời mốc");
  } finally {
    clock.mock.restore();
  }
}
{
  const f = fixture(); let scored = 0;
  Object.assign(f.d, { team: [], owned: [], res: { bonus: {} }, gearSt: { bonus: {}, weapon: null, red: 0, luck: 0 } });
  f.room.teamPowerOf = (d) => { scored++; return score(d.gear); };
  sendGear(f.room, "me"); const n = scored;
  assert.ok(n > 0); assert.equal(f.sent.length, 1);
  f.d.bag.push({ ...mk("dan", 0), code: "hoi_huyet_dan" });
  sendGear(f.room, "me"); assert.equal(scored, n, "Đồ tiêu hao không làm tính lại điểm");
  assert.equal(f.sent.length, 1, "Không gửi lại gear khi nội dung không đổi");
  sendGear(f.room, "me", true); assert.equal(scored, n, "Xin cả túi dùng cache điểm");
  assert.equal(f.sent.length, 2, "Xin cả túi vẫn nhận gear");
  f.d.bag[0].locked = true; sendGear(f.room, "me");
  assert.ok(scored > n); assert.equal(f.sent.length, 3, "Khóa trang bị cập nhật danh sách tăng điểm");
}
console.log("✓ Mặc tốt nhất: mọi kiểm tra đều qua, gồm cache điểm / tin gear");
