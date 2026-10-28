// UI v2: hub ngăn kéo + ba màn hệ thống mới (Xếp Hạng, Lịch Hoạt Động, Phúc Lợi): phần thuần (bố cục, mô hình hiển thị), không cần DOM / server.
import assert from "node:assert/strict";
import { HUB_ITEMS, hubLayout } from "../src/hubMenu.ts";
import { slotState, todayIndex, byDay, dayDate, slotRange, STATE_LABEL } from "../src/calendarScreen.ts";
import { COUNTDOWN_SOON_MS } from "../src/uiParts.ts";
import { cellState, signedToday, needsSign, isMilestone, rewardParts, signedLine, primaryOf, nextMidnightVn, feeText } from "../src/welfareScreen.ts";
import { CHECKIN } from "../../shared/data.ts";
import { rankGroups, podiumOf, lineupText, meLine, pageLabel, tongName, sendDelay } from "../src/rankScreen.ts";

// ---- hub ----
const ids = HUB_ITEMS.map((i) => i.id);
assert.equal(new Set(ids).size, ids.length, "id mục hub không trùng");
const sizes = (l) => ({ big: l.big.length, mid: l.mid.length, grid: l.grid.length, rail: l.rail.length });
assert.deepEqual(sizes(hubLayout([])), { big: 2, mid: 2, grid: 12, rail: 0 }, "không có hành động: thẻ lớn / vừa / lưới đủ, rail ẩn hết");
const L = hubLayout(["char", "bag", "rank", "settings"], ["rank"]);
const cell = (l, id) => [...l.big, ...l.mid, ...l.grid, ...l.rail].find((c) => c.item.id === id);
assert.equal(cell(L, "char").enabled, true);
assert.equal(cell(L, "shop").enabled, false); assert.equal(cell(L, "shop").card.state, "lock"); assert.equal(cell(L, "shop").card.reason, "Chưa có");
assert.equal(cell(L, "rank").card.state, "new", "chấm đỏ cho mục có việc mới");
assert.equal(cell(L, "bag").card.state, undefined, "mục có chức năng, không việc mới: thẻ thường");
assert.deepEqual(L.rail.map((c) => c.item.id), ["settings"], "rail chỉ giữ mục đã nối");
assert.equal(cell(hubLayout(["shop"], ["shop"]), "shop").card.state, "new");
assert.equal(cell(hubLayout([], ["rank"]), "rank").card.state, "lock", "mục chưa nối không thể có chấm đỏ");

// ---- Xếp Hạng ----
const bs = [{ board: "cap", group: "Người chơi", name: "Cấp", period: 0 }, { board: "elo", group: "Đấu trường", name: "Elo", period: 0 }, { board: "suu_tam", group: "Người chơi", name: "Sưu tầm", period: 0 }];
assert.deepEqual(rankGroups(bs).map((g) => [g.group, g.boards.map((b) => b.board)]), [["Người chơi", ["cap", "suu_tam"]], ["Đấu trường", ["elo"]]]);
const rows = [1, 2, 3, 4].map((r) => ({ rank: r, name: "n" + r, score: 100 - r }));
assert.deepEqual(podiumOf(1, rows).map((r) => r.rank), [2, 1, 3], "bục: 2 trái, 1 giữa, 3 phải");
assert.deepEqual(podiumOf(2, rows), [], "trang sau không có bục");
assert.deepEqual(podiumOf(1, rows.slice(0, 1)).map((r) => r.rank), [1], "bảng chỉ có một người vẫn hiện bục thiếu");
assert.match(lineupText([{ vohon: "ma_don_khong_co", level: 12, stars: 3 }])[0], /ma_don_khong_co Lv\.12 ★3/, "mã lạ hiện nguyên mã");
assert.equal(meLine(null, "Cấp").ranked, false); assert.equal(meLine(null, "Cấp").text, "Chưa có hạng");
assert.deepEqual([meLine({ rank: 1234, score: 2_600_000 }, "Cấp").text, meLine({ rank: 1, score: 5 }, "x").ranked], ["Hạng 1.234 · 2,6M", true]);
assert.equal(pageLabel(1, 0, 10), "Trang 1/1"); assert.equal(pageLabel(2, 25, 10), "Trang 2/3"); assert.equal(pageLabel(1, 5, 0), "Trang 1/5");
assert.equal(sendDelay(1000, 1500, 2), 1550); assert.equal(sendDelay(1000, 3050, 2), 0); assert.equal(sendDelay(0, 99999, 2), 0); // chờ hết nhịp RANK_CD rồi mới gửi
assert.equal(tongName(undefined), ""); assert.equal(tongName("khong_co"), "");

// ---- Lịch Hoạt Động ----
const H = 3_600_000, D = 24 * H;
const WS = Date.UTC(2026, 9, 25, 17, 0, 0); // thứ Hai 26/10/2026 00:00 giờ Việt Nam
const it = (s, e) => ({ s, e });
assert.equal(slotState(it(WS + 20 * H, WS + 21 * H), WS + 19.5 * H), "soon", "trong 1 giờ trước giờ mở");
assert.equal(slotState(it(WS + 20 * H, WS + 21 * H), WS + 20 * H), "live", "đúng giờ mở là đang mở");
assert.equal(slotState(it(WS + 20 * H, WS + 21 * H), WS + 21 * H), "past", "đúng giờ đóng là đã qua");
assert.equal(slotState(it(WS + 20 * H, WS + 21 * H), WS + 20 * H - COUNTDOWN_SOON_MS - 1), "later");
assert.equal(STATE_LABEL.later, "", "thẻ thường không có nhãn");
assert.equal(todayIndex(WS, WS), 0); assert.equal(todayIndex(WS + 6 * D + 23 * H, WS), 6); assert.equal(todayIndex(WS + 7 * D, WS), null, "tuần khác: không tô cột hôm nay"); assert.equal(todayIndex(WS - 1, WS), null);
const cal = [{ id: "b", d: 2, s: 5, e: 6 }, { id: "a", d: 2, s: 5, e: 6 }, { id: "c", d: 2, s: 1, e: 2 }, { id: "x", d: 9, s: 0, e: 1 }];
const cols = byDay(cal);
assert.equal(cols.length, 7); assert.deepEqual(cols[2].map((x) => x.id), ["c", "a", "b"], "xếp theo giờ bắt đầu rồi mã"); assert.equal(cols.flat().length, 3, "cột ngoài 0..6 bị bỏ");
assert.equal(dayDate(WS, 0), "26.10"); assert.equal(dayDate(WS, 6), "01.11");
assert.equal(slotRange(it(WS + 20 * H, WS + 20.25 * H)), "20:00 – 20:15");

// ---- Phúc Lợi ----
const W = (o) => ({ cycle: 1, day: 5, mask: 0b11011, now: 0, endsAt: 0, makeupLeft: 5, free: 2, fee: 0, ...o });
const m = W({});
assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map((i) => cellState(i, m)), ["signed", "signed", "makeup", "signed", "signed", "today", "future"]);
assert.equal(cellState(2, W({ makeupLeft: 0 })), "missed", "hết lượt ký bù: ô bỏ lỡ không bấm được");
assert.equal(cellState(5, W({ mask: 0b111011 })), "signed", "hôm nay đã ký");
const fresh = W({ day: -1, mask: 0, cycle: 0 });
assert.deepEqual([0, 1, 20].map((i) => cellState(i, fresh)), ["today", "future", "future"], "chưa có chu kỳ: ô 1 mở chu kỳ mới");
assert.equal(cellState(0, W({ day: -1, mask: 1, cycle: 2 })), "today", "chu kỳ cũ đã hết: mask cũ không làm ô 1 'đã ký'");
assert.equal(signedToday(m), false); assert.equal(signedToday(W({ mask: 0b111011 })), true); assert.equal(signedToday(fresh), false);
assert.equal(needsSign(fresh), true); assert.equal(needsSign(W({ mask: 0b111011 })), false, "đã ký hôm nay thì hết chấm đỏ");
assert.deepEqual(CHECKIN.milestones.map(isMilestone), [true, true, true]); assert.equal(isMilestone(0), false);
assert.equal(CHECKIN.days, 21, "lưới 7 x 3");
for (let i = 0; i < CHECKIN.days; i++) assert.ok(rewardParts(i).length > 0, `ô ${i + 1} có quà để hiện`);
assert.match(signedLine({ day: 6, makeup: true, fee: 12000, honTe: 60, items: [] }), /^Ký bù ô 7 \(phí .+\): nhận 60 Hồn Tệ\.$/);
assert.equal(primaryOf(null, false).disabled, true);
assert.deepEqual([primaryOf(m, false).disabled, primaryOf(m, true).reason, primaryOf(W({ mask: 0b111011 }), false).reason], [false, "Đang gửi…", "Hôm nay đã điểm danh, mai quay lại"]);
assert.equal(primaryOf(fresh, false).label, "Bắt đầu chu kỳ mới");
const t0 = Date.UTC(2026, 9, 28, 16, 59, 0); // 23:59 ngày 28 giờ Việt Nam
assert.equal(nextMidnightVn(t0), Date.UTC(2026, 9, 28, 17, 0, 0)); assert.equal(nextMidnightVn(t0 + 60_000), Date.UTC(2026, 9, 29, 17, 0, 0), "đúng 00:00 thì sang ngày kế");
assert.equal(feeText(null), "Hết lượt ký bù"); assert.equal(feeText(0), "Ký bù miễn phí"); assert.match(feeText(12000), /^Ký bù: /);

console.log("ui-screens: ok");
