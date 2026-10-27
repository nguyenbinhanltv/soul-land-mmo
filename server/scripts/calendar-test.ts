// Lịch Hoạt Động (mục 5.20, L1 + L2): thuần, không server / DB. Chạy: npm run test:calendar --prefix server
// 1. Lịch suy ra từ hằng có sẵn: mọi khung của kingSlots / worldSlots trong tuần đều có trong eventSlots và ngược lại (chống lệch nguồn).
// 2. Tên boss theo ngày khớp worldBossOn; tin `calendar` (calendarOf): tuần trước / này / sau, `week` lạ bị kẹp.
import assert from "node:assert/strict";
import { EVENT_DEFS, KING, KING_TIMES, MAPS, WORLD, WORLD_TIME, BOSSES, eventSlots, kingSlots, worldSlots, weekdayVn, weekStartVn, vnAt, vnClock, worldBossOn } from "../../shared/data.ts";
import { calWeek, calendarOf } from "../src/rooms/calendar.ts";

const DAY = 86400000;
// Mốc cố định: thứ Tư 2026-10-28 12:00 giờ Việt Nam; thứ Hai của tuần đó là 2026-10-26.
const NOW = vnAt(Date.UTC(2026, 9, 28, 5, 0), "12:00");
const WEEK = weekStartVn(NOW);

// --- weekdayVn / weekStartVn ---
assert.equal(weekdayVn(NOW), 2, "2026-10-28 là thứ Tư (0 = thứ Hai)");
assert.equal(weekdayVn(WEEK), 0);
assert.deepEqual([vnClock(WEEK).y, vnClock(WEEK).mo, vnClock(WEEK).d, vnClock(WEEK).h, vnClock(WEEK).mi], [2026, 10, 26, 0, 0], "tuần bắt đầu 00:00 thứ Hai giờ Việt Nam");
for (let d = 0; d < 7; d++) {
  assert.equal(weekStartVn(WEEK + d * DAY + 23 * 3600000 + 59 * 60000), WEEK, `mọi giờ trong ngày ${d} thuộc cùng một tuần`);
  assert.equal(weekdayVn(WEEK + d * DAY + 3600000), d);
}
assert.equal(weekStartVn(WEEK + 7 * DAY), WEEK + 7 * DAY, "00:00 thứ Hai kế tiếp mở tuần mới");
assert.equal(weekStartVn(NOW, -1), WEEK - 7 * DAY);
assert.equal(weekStartVn(NOW, 1), WEEK + 7 * DAY);

// --- Đối chiếu nguồn: eventSlots == kingSlots / worldSlots ---
const inWeek = (a: number[]) => a.filter((s) => s >= WEEK && s < WEEK + 7 * DAY).sort((x, y) => x - y);
const fromDay = (d: number) => [...new Set([...kingSlots(WEEK + d * DAY + 3600000)])]; // chỉ để gom khung quanh từng ngày
const kingAll = inWeek([...new Set([0, 1, 2, 3, 4, 5, 6].flatMap(fromDay))]);
const worldAll = inWeek([...new Set([0, 1, 2, 3, 4, 5, 6].flatMap((d) => worldSlots(WEEK + d * DAY + 3600000)))]);
assert.equal(kingAll.length, 7 * KING_TIMES.length);
assert.equal(worldAll.length, 7);
const kingDefs = EVENT_DEFS.filter((d) => d.id.startsWith("king:")), worldDefs = EVENT_DEFS.filter((d) => d.id.startsWith("world:"));
assert.ok(kingDefs.length > 0 && worldDefs.length > 0, "có ít nhất một bản đồ thú vương và một bản đồ boss thế giới");
assert.deepEqual(kingDefs.map((d) => d.map).sort(), Object.keys(MAPS).filter((m) => MAPS[m].king).sort(), "mỗi bản đồ có MapDef.king đúng một mục");
assert.deepEqual(worldDefs.map((d) => d.map).sort(), Object.keys(MAPS).filter((m) => MAPS[m].world?.length).sort(), "mỗi bản đồ có MapDef.world đúng một mục");
for (const def of kingDefs) {
  const slots = eventSlots(def, WEEK);
  assert.deepEqual(slots.map((x) => x.s), kingAll, `${def.id}: khung giờ = kingSlots`);
  for (const x of slots) assert.equal(x.e - x.s, KING.lifeSecs * 1000, "độ dài = KING.lifeSecs");
}
for (const def of worldDefs) {
  const slots = eventSlots(def, WEEK);
  assert.deepEqual(slots.map((x) => x.s), worldAll, `${def.id}: khung giờ = worldSlots`);
  for (const x of slots) assert.equal(x.e - x.s, WORLD.lifeSecs * 1000, "độ dài = WORLD.lifeSecs");
}
for (const def of EVENT_DEFS.filter((d) => d.kind !== "slot")) assert.deepEqual(eventSlots(def, WEEK), [], `${def.id}: không phải khung giờ`);
assert.deepEqual(eventSlots(worldDefs[0], WEEK).map((x) => x.d), [0, 1, 2, 3, 4, 5, 6]);

// --- Tin lịch ---
const cur = calendarOf(NOW, 0);
assert.equal(cur.now, NOW);
assert.equal(cur.weekStart, WEEK);
assert.equal(cur.items.length, 7 * (kingDefs.length * KING_TIMES.length + worldDefs.length));
for (let i = 1; i < cur.items.length; i++) assert.ok(cur.items[i - 1].s <= cur.items[i].s, "items tăng dần theo giờ bắt đầu");
for (const it of cur.items) {
  assert.ok(it.s >= WEEK && it.e > it.s && it.d === weekdayVn(it.s) && it.boss, `${it.id}: có giờ, thứ và tên boss`);
  assert.equal(it.map, MAPS[it.map].id);
}
// Tên boss theo ngày: boss thế giới luân phiên đúng worldBossOn; thú vương = MapDef.king.
for (const it of cur.items.filter((x) => x.id.startsWith("world:"))) assert.equal(it.boss, BOSSES.find((b) => b.id === worldBossOn(it.map, it.s))!.name);
for (const it of cur.items.filter((x) => x.id.startsWith("king:"))) assert.equal(it.boss, BOSSES.find((b) => b.id === MAPS[it.map].king)!.name);
const worldNames = new Set(cur.items.filter((x) => x.id.startsWith("world:")).map((x) => x.boss));
assert.ok(worldNames.size >= 2, "boss thế giới đổi theo ngày trong tuần");
// Giờ hiển thị khớp hằng: 21:00 cho boss thế giới, KING_TIMES cho thú vương.
const hhmm = (ms: number) => `${String(vnClock(ms).h).padStart(2, "0")}:${String(vnClock(ms).mi).padStart(2, "0")}`;
assert.deepEqual([...new Set(cur.items.filter((x) => x.id.startsWith("world:")).map((x) => hhmm(x.s)))], [WORLD_TIME]);
assert.deepEqual([...new Set(cur.items.filter((x) => x.id.startsWith("king:")).map((x) => hhmm(x.s)))].sort(), [...KING_TIMES].sort());
// Mốc đặt lại và mục luôn mở.
assert.deepEqual(cur.fixed.map((f) => f.id), EVENT_DEFS.filter((d) => d.kind !== "slot").map((d) => d.id));
assert.ok(cur.fixed.filter((f) => f.kind === "reset").every((f) => f.at === "00:00"));
assert.equal(cur.fixed.find((f) => f.id === "reset:tong")?.weekly, true);
assert.equal(cur.fixed.find((f) => f.id === "reset:daily")?.weekly, undefined);
assert.ok(cur.fixed.some((f) => f.kind === "always" && f.id === "always:arena"));

// Tuần trước / sau lệch đúng 7 ngày, cùng số mục; `now` vẫn là giờ server.
const prev = calendarOf(NOW, -1), next = calendarOf(NOW, 1);
assert.equal(prev.weekStart, WEEK - 7 * DAY);
assert.equal(next.weekStart, WEEK + 7 * DAY);
assert.equal(prev.now, NOW);
assert.equal(prev.items.length, cur.items.length);
assert.equal(next.items[0].s - cur.items[0].s, 7 * DAY, "giờ mở giống nhau, lệch đúng một tuần");
// Tên boss của ngày đổi theo ngày: 7 ngày liên tiếp, boss thế giới theo worldBossOn từng ngày (đẩy đồng hồ sang ngày khác thì tên đổi đúng).
for (let d = 0; d < 7; d++) {
  const day = calendarOf(NOW + d * DAY, 0);
  for (const it of day.items.filter((x) => x.id.startsWith("world:") && x.d === weekdayVn(NOW + d * DAY))) {
    assert.equal(it.boss, BOSSES.find((b) => b.id === worldBossOn(it.map, NOW + d * DAY))!.name);
  }
}
// Trong tuần, giờ `now` nào cũng cho cùng dữ liệu (cache theo tuần): mặc dù `now` khác.
assert.deepEqual(calendarOf(NOW + 2 * DAY, 0).items, cur.items);
assert.equal(calendarOf(NOW + 2 * DAY, 0).now, NOW + 2 * DAY);

// `week` lạ bị kẹp về -1 / 0 / 1 (số nguyên) hoặc 0 (không phải số nguyên).
for (const [raw, want] of [[0, 0], [-1, -1], [1, 1], [5, 1], [-9, -1], [1e9, 1], [0.5, 0], [NaN, 0], [Infinity, 0], ["1", 0], [undefined, 0], [null, 0], [{}, 0], [[1], 0]] as const) {
  assert.equal(calWeek(raw), want, `calWeek(${String(raw)})`);
}
assert.equal(calendarOf(NOW, 99).weekStart, WEEK + 7 * DAY);
assert.equal(calendarOf(NOW, "x").weekStart, WEEK);

console.log("calendar-test: OK");
