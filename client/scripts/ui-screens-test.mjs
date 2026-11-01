// UI v2: hub ngăn kéo + ba màn hệ thống mới (Xếp Hạng, Lịch Hoạt Động, Phúc Lợi): phần thuần (bố cục, mô hình hiển thị), không cần DOM / server.
import assert from "node:assert/strict";
import { HUB_ITEMS, hubLayout } from "../src/hubMenu.ts";
import { setBadge, clearBadge, badgeOf, allBadges, onBadges, resetBadges, starReadyCount, ringReady, questActionable } from "../src/badges.ts";
import { logNotice, notices, clearNotices, LOG_MAX } from "../src/noticeLog.ts";
import { noticeNode, noticeTime } from "../src/noticeScreen.ts";
import { toHtml } from "../src/uiParts.ts";
import { giftNode, giftItemUrl } from "../src/giftView.ts";

// Quà dùng chữ làm nghĩa chính; chưa tải manifest vẫn đọc đủ và mã lạ không tạo ảnh.
const giftHtml = toHtml(giftNode({ honTe: 120, shards: 2, items: [{ code: "hoi_huyet_dan", qty: 3 }, { code: '<img src=x onerror="alert(1)">', qty: 4 }] }));
assert.match(giftHtml, /120 Hồn Tệ/);
assert.match(giftHtml, /Mảnh võ hồn ×2/);
assert.match(giftHtml, /Hồi Huyết Đan ×3/);
assert.match(giftHtml, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; ×4/);
assert.doesNotMatch(giftHtml, /<(?:button|a|img)\b/);
assert.equal(giftItemUrl("ma_la"), null);
assert.deepEqual(giftNode({}).kids, []);
import { fixedGoal, unseenSoon, slotState, todayIndex, byDay, dayDate, slotRange, STATE_LABEL } from "../src/calendarScreen.ts";
import { COUNTDOWN_SOON_MS } from "../src/uiParts.ts";
import { rewardIcons, cellState, signedToday, needsSign, welfareBadgeCount, isMilestone, rewardParts, signedLine, primaryOf, nextMidnightVn, feeText } from "../src/welfareScreen.ts";
import { CHECKIN } from "../../shared/data.ts";
import { playerCard, rankGroups, podiumOf, lineupText, meLine, pageLabel, tongName, sendDelay } from "../src/rankScreen.ts";

// ---- hub ----
const ids = HUB_ITEMS.map((i) => i.id);
assert.equal(new Set(ids).size, ids.length, "id mục hub không trùng");
const sizes = (l) => ({ big: l.big.length, mid: l.mid.length, grid: l.grid.length, rail: l.rail.length });
assert.deepEqual(sizes(hubLayout([])), { big: 2, mid: 2, grid: 13, rail: 4 }, "không có hành động: thẻ lớn / vừa / lưới đủ, rail đủ 4 mục (mờ)");
const L = hubLayout(["char", "bag", "rank", "settings"], ["rank"]);
const cell = (l, id) => [...l.big, ...l.mid, ...l.grid, ...l.rail].find((c) => c.item.id === id);
assert.equal(cell(L, "char").enabled, true);
assert.equal(cell(L, "shop").enabled, false); assert.equal(cell(L, "shop").card.state, "lock"); assert.equal(cell(L, "shop").card.reason, "Tại NPC", "lý do khoá riêng từng mục, nói nơi dùng");
assert.equal(cell(hubLayout([]), "achv").card.reason, "Chưa có", "Thành Tựu đã nối bảng: chưa nối thì thẻ khoá nói \"Chưa có\" (không còn \"Sắp có\")");
assert.equal(cell(hubLayout(["achv"], ["achv"]), "achv").card.state, "new", "chấm đỏ cho Thành Tựu có mốc nhận được");
assert.equal(cell(L, "rank").card.state, "new", "chấm đỏ cho mục có việc mới");
assert.equal(cell(L, "bag").card.state, undefined, "mục có chức năng, không việc mới: thẻ thường");
assert.deepEqual(L.rail.map((c) => [c.item.id, c.enabled]), [["mail", false], ["notice", false], ["settings", true], ["shot", false]], "rail đủ mục, chưa nối thì mờ");
assert.equal(cell(L, "mail").card.state, "lock"); assert.equal(cell(L, "mail").card.reason, "Chưa có", "Thư đã nối bảng: chưa nối thì thẻ khoá nói \"Chưa có\" (không còn \"Chờ máy chủ\")");
assert.equal(cell(hubLayout(["mail"], ["mail"]), "mail").card.state, "new", "chấm đỏ cho Thư có thư chưa đọc / quà chờ nhận");
// icon menu có sẵn (#1579): đúng 12 mục, khóa gi_menu_*; mục chưa có ảnh thì không icon giả
assert.deepEqual(HUB_ITEMS.filter((i) => i.icon).map((i) => i.id).sort(), ["auto","bag","char","forge","friends","quest","rank","reso","settings","shop","vohon","world"]);
assert.ok(HUB_ITEMS.every((i) => !i.icon || /^gi_menu_[a-z]+$/.test(i.icon)));
assert.equal(cell(hubLayout(["bag"], [], ["bag"]), "bag").card.state, "up", "mũi tên xanh cho mục nâng được");
assert.equal(cell(hubLayout(["bag"], ["bag"], ["bag"]), "bag").card.state, "new", "chấm đỏ thắng mũi tên");
assert.equal(cell(hubLayout([], [], ["bag"]), "bag").card.state, "lock", "mục chưa nối không có mũi tên");
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
// chấm đỏ Lịch: khung đang mở / sắp mở chưa xem
const NS = [it(WS + 20 * H, WS + 21 * H), it(WS + 22 * H, WS + 23 * H), it(WS + 10 * H, WS + 11 * H)].map((x, i) => ({ id: `e${i}`, ...x }));
assert.equal(unseenSoon(NS, WS + 19.5 * H, new Set()), 1, "chỉ khung sắp mở trong 1 giờ");
assert.equal(unseenSoon(NS, WS + 20.5 * H, new Set()), 1, "đang mở; khung đã qua không tính");
assert.equal(unseenSoon(NS, WS + 20.5 * H, new Set([`e0@${WS + 20 * H}`])), 0, "đã xem thì hết chấm");
assert.equal(unseenSoon(NS, WS + 21.5 * H, new Set()), 1, "khung 20h đã qua, khung 22h sắp mở");
assert.equal(unseenSoon([], WS, new Set()), 0);
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
// chấm đỏ hub: hôm nay chưa ký + mốc đã lỡ còn ký bù được
assert.equal(welfareBadgeCount(m), 1, "chỉ hôm nay chưa ký");
assert.equal(welfareBadgeCount(W({ day: 8, mask: 0b1 })), 1 + 1, "hôm nay chưa ký + mốc ngày 7 (ô 6) lỡ còn ký bù");
assert.equal(welfareBadgeCount(W({ day: 8, mask: 0b101000000 | 1 << 8 })), 0, "đã ký mốc + hôm nay: hết chấm");
assert.equal(welfareBadgeCount(W({ day: 8, mask: 0b1, makeupLeft: 0 })), 1, "hết lượt ký bù: mốc lỡ không tính");
assert.equal(welfareBadgeCount(fresh), 1, "chưa có chu kỳ: chỉ việc mở chu kỳ");
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

// ---- Thẻ nhỏ Xếp Hạng / nút Đến / icon quà Phúc Lợi ----
const pc = playerCard({ rank: 3, name: "A", score: 1234567, tong: "hao_thien_tong", lineup: [{ vohon: "x_la", level: 5, stars: 1 }] }, "Cấp");
assert.equal(pc.canFriend, true); assert.equal(pc.tong, "Hạo Thiên Tông"); assert.equal(pc.rank, "Hạng 3 · Cấp"); assert.equal(pc.lineup.length, 1);
assert.equal(playerCard({ rank: 1, name: "Tôi", score: 1, me: true }, "Cấp").canFriend, false, "chính mình không tự kết bạn");
assert.equal(playerCard({ rank: 1, name: "B", score: 1 }, "Cấp").tong, ""); assert.deepEqual(playerCard({ rank: 1, name: "B", score: 1 }, "Cấp").lineup, []);
assert.deepEqual(fixedGoal({ id: "always:arena", npc: "dau_hon_truong" }, (id) => id), { map: "thien_dau_thanh", mapName: "thien_dau_thanh", npc: "dau_hon_truong" });
assert.equal(fixedGoal({ id: "always:auto" }, (id) => id), null, "mục không có NPC thì không có nút Đến");
assert.equal(fixedGoal({ id: "khong_co", npc: "x" }, (id) => id), null);
assert.deepEqual(rewardIcons(0), [], "ô chỉ Hồn Tệ: không icon");
assert.deepEqual(rewardIcons(1), ["hoi_huyet_dan"]); assert.deepEqual(rewardIcons(6), ["manh_vo_hon"]);
assert.equal(rewardIcons(13)[0], CHECKIN.rewards[13].items[0].code); assert.equal(rewardIcons(13).at(-1), "manh_vo_hon"); assert.deepEqual(rewardIcons(99), []);
console.log("ui-screens: thẻ nhỏ / Đến / icon quà OK");

// ---- kho chấm đỏ / mũi tên xanh (đợt 4b) ----
{
  let calls = 0; const off = onBadges(() => { calls++; });
  setBadge("bag", "new", 2); assert.deepEqual(badgeOf("bag"), { kind: "new", n: 2 });
  setBadge("bag", "new", 2); assert.equal(calls, 1, "không đổi thì không báo");
  setBadge("bag", "up", 1); assert.equal(badgeOf("bag").kind, "up"); assert.equal(calls, 2);
  setBadge("bag", "new", 0); assert.equal(badgeOf("bag"), null, "n ≤ 0 là xoá"); assert.equal(calls, 3);
  clearBadge("bag"); assert.equal(calls, 3, "xoá cái không có thì không báo");
  setBadge("vohon", "up", 1); setBadge("quest", "new", 1); assert.equal(allBadges().size, 2);
  resetBadges(); assert.equal(allBadges().size, 0); off(); setBadge("quest", "new"); assert.equal(calls, 6, "bỏ nghe rồi thì không báo"); resetBadges();
}
{
  const have = new Map([["thanh_long", 5]]);
  assert.equal(starReadyCount([], new Map([["thanh_long", 1]])), 0, "chưa đủ mảnh mở: không chấm");
  assert.equal(starReadyCount([], new Map([["thanh_long", 9999]])), 1, "đủ mảnh mở võ hồn chưa có");
  assert.equal(starReadyCount([{ vohon: "thanh_long", stars: 1 }], new Map([["thanh_long", 0]])), 0);
  assert.equal(starReadyCount([{ vohon: "thanh_long", stars: 1 }], new Map([["thanh_long", 9999]])), 1, "đủ mảnh lên sao");
  assert.equal(starReadyCount([{ vohon: "thanh_long", stars: 99 }], new Map([["thanh_long", 9999]])), 0, "sao tối đa (starCost null) không chấm");
  void have;
}
{
  const ring = (years, vohon = null) => ({ code: "hon_hoan", vohon, years });
  assert.equal(ringReady(0, [ring(10)]), true, "vòng 1 còn trống, hồn hoàn 10 năm vừa giới hạn");
  assert.equal(ringReady(0, [ring(10_000_000)]), false, "vượt giới hạn ô kế tiếp");
  assert.equal(ringReady(0, [ring(10, 7)]), false, "hồn hoàn đang gắn không tính");
  assert.equal(ringReady(0, [ring(null)]), false); assert.equal(ringReady(0, [{ code: "hoi_huyet_dan", vohon: null, years: 10 }]), false);
  assert.equal(ringReady(9, [ring(10)]), true, "còn ô thứ 10");
  assert.equal(ringReady(10, [ring(10)]), false, "đủ 10 hồn hoàn");
}
assert.equal(questActionable(["active", "done"]), 0); assert.equal(questActionable(["offer", "ready", "active"]), 2);

// ---- nhật ký thông báo (hộp Thông báo) ----
{
  clearNotices();
  logNotice("loot", "Hồi Huyết Đan", "", false, 1000); logNotice("loot", "Hồi Huyết Đan", "", true, 2000);
  assert.equal(notices().length, 1, "toast gộp ×n cộng vào dòng cũ"); assert.equal(notices()[0].n, 2); assert.equal(notices()[0].t, 2000);
  logNotice("quest", "Nhận nhiệm vụ", "sub", false);
  assert.equal(notices().length, 2); assert.equal(notices()[1].title, "Nhận nhiệm vụ", "mới nhất ở cuối");
  for (let i = 0; i < 80; i++) logNotice("info", `tin ${i}`, "", false);
  assert.equal(notices().length, LOG_MAX, "giữ đúng 50 dòng gần nhất"); assert.equal(notices()[LOG_MAX - 1].title, "tin 79"); assert.equal(notices()[0].title, "tin 30");
  const html = toHtml(noticeNode({ kind: "loot", title: "<b>x</b>", sub: "", t: 0, n: 3 }));
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt; ×3/, "chữ được escape, kèm ×n"); assert.match(html, /Nhận/, "nhãn loại bằng chữ");
  assert.match(noticeTime(new Date(2026, 0, 1, 7, 5).getTime()), /^07:05$/);
  clearNotices(); assert.equal(notices().length, 0);
}

// ---- Bí Cảnh (P5): phần thuần của màn danh sách, HUD trong phòng và bảng kết quả ----
{
  const bc = await import("../src/bicanhScreen.ts");
  const { BICANH, bicanhRunTomes } = await import("../../shared/data.ts");
  const run = (o = {}) => ({ id: "luyen_hon", name: "Luyện Hồn Cảnh", left: 2, max: 3, bought: 0, price: 3000, ...o });
  assert.ok(ids.includes("bicanh"), "hub có mục Bí Cảnh");
  assert.equal(cell(hubLayout(["bicanh"], ["bicanh"]), "bicanh").card.state, "new", "còn lượt: chấm đỏ trên thẻ hub");
  assert.equal(cell(hubLayout([]), "bicanh").card.state, "lock", "chưa nối: khoá có lý do");
  // danh sách
  assert.equal(bc.hasRun({ runs: [run({ left: 0 }), run({ id: "x" })] }), true); assert.equal(bc.hasRun({ runs: [run({ left: 0 })] }), false); assert.equal(bc.hasRun(null), false);
  assert.equal(bc.runStatus(run()), "Còn 2 lượt"); assert.equal(bc.runStatus(run({ left: 0 })), "Đã xong hôm nay");
  assert.equal(bc.primaryOf(null, false).disabled, true); assert.match(bc.primaryOf(null, false).reason, /Đang tải/);
  assert.equal(bc.primaryOf(run(), false).disabled, false);
  assert.match(bc.primaryOf(run(), true).reason, /Đang gửi/, "đang gửi: nút tắt, không bấm đôi");
  const none = bc.primaryOf(run({ left: 0 }), false); assert.equal(none.disabled, true); assert.match(none.reason, /Hết lượt/); assert.match(none.reason, /05:00/, "lý do ghi giờ làm mới của Bí Cảnh");
  assert.equal(bc.buyOf(run(), false).disabled, false); assert.match(bc.buyOf(run(), false).label, /Hồn Tệ|3/);
  assert.equal(bc.buyOf(run({ price: null, bought: 3 }), false).disabled, true); assert.match(bc.buyOf(run({ price: null, bought: 3 }), false).reason, /đủ/);
  assert.equal(bc.buyOf(run(), true).disabled, true);
  assert.match(bc.buyConfirm(run({ bought: 1 }), 3).body, /1\/3/, "hộp xác nhận ghi số lượt đã mua / trần");
  const sc = bc.sceneOf("luyen_hon"); assert.ok(sc); assert.equal(bc.sceneOf("la"), undefined);
  assert.match(bc.rewardLine(sc), new RegExp(`×${bicanhRunTomes(sc)}`)); assert.match(bc.rewardLine(sc), new RegExp(String(BICANH.tomeDailyCap)));
  assert.equal(bc.waveLines(sc).length, sc.waves.length); assert.match(bc.waveLines(sc).at(-1), /tinh anh/);
  // HUD trong phòng
  let hud = bc.newRoomHud();
  hud = bc.applyRoomMsg(hud, { k: "ready", name: "Luyện Hồn Cảnh", waves: 3, secs: 4 }, 1000);
  assert.equal(hud.phase, "ready"); assert.equal(hud.endAt, 5000); assert.match(bc.hudTitle(hud), /chuẩn bị/);
  hud = bc.applyRoomMsg(hud, { k: "fight", secs: 300, waves: 3 }, 6000); assert.equal(hud.endAt, 306000); assert.equal(hud.phase, "fight");
  hud = bc.applyRoomMsg(hud, { k: "wave", wave: 1, of: 3, n: 4, elite: false }, 6000);
  assert.equal(bc.hudTitle(hud), "Sóng 1/3"); assert.match(bc.hudSub(hud), /Còn 4 hồn thú/); assert.match(bc.hudSub(hud), /Quyển tạm: 0/);
  hud = bc.applyRoomMsg(hud, { k: "clear", wave: 1, of: 3, tomes: 1 }, 7000); assert.match(bc.hudSub(hud), /Quyển tạm: 1/); assert.match(bc.hudSub(hud), /nghỉ/);
  hud = bc.applyRoomMsg(hud, { k: "wave", wave: 3, of: 3, n: 5, elite: true }, 8000); assert.match(bc.hudSub(hud), /Có tinh anh/);
  assert.match(bc.hudSub({ ...hud, eliteHp: 40 }), /Tinh anh 40%/, "máu tinh anh đọc từ state hồn thú");
  assert.equal(bc.hudSub(bc.newRoomHud()), "");
  // kết quả
  const txt = (v) => v.lines.map((l) => l.text).join("\n");
  // Khúc hết phòng (#1578): thắng / thua có khúc; hoàn lượt, lỗi, thiếu win, tin không phải end thì im lặng
  assert.equal(bc.endJingle({ k: "end", win: true }), "arena_win");
  assert.equal(bc.endJingle({ k: "end", win: false }), "arena_lose");
  assert.equal(bc.endJingle({ k: "end", win: false, refunded: true, err: "Lỗi hệ thống: đã hoàn lượt" }), null);
  assert.equal(bc.endJingle({ k: "end", win: true, err: "x" }), null);
  assert.equal(bc.endJingle({ k: "end" }), null);
  assert.equal(bc.endJingle({ k: "wave", win: true }), null);
  const win = bc.endView({ k: "end", win: true, reason: "win", why: "hạ hết các sóng", cleared: 3, of: 3, tomes: 2 });
  assert.equal(win.title, "Thắng!"); assert.match(txt(win), /Đã hạ 3\/3 sóng/); assert.match(txt(win), /×2 vào túi/);
  const lose = bc.endView({ k: "end", win: false, reason: "dead", why: "đội võ hồn gục hết", cleared: 1, of: 3, tomes: 1 });
  assert.equal(lose.title, "Thua"); assert.match(txt(lose), /giữ|không hoàn/); assert.match(txt(lose), /gục hết/);
  assert.match(txt(bc.endView({ k: "end", win: false, reason: "dead", why: "x", cleared: 0, of: 3, tomes: 0 })), /Chưa hạ sóng có quyển/);
  assert.match(txt(bc.endView({ k: "end", win: true, reason: "win", why: "x", cleared: 3, of: 3, tomes: 0, capped: true })), /nhận đủ/, "chạm trần quyển ngày");
  assert.match(txt(bc.endView({ k: "end", win: true, reason: "win", why: "x", cleared: 3, of: 3, tomes: 0, full: true })), /Túi đầy/);
  const bad = bc.endView({ k: "end", win: true, reason: "win", why: "x", cleared: 3, of: 3, tomes: 0, err: "Không lưu được kết quả.", refunded: true });
  assert.equal(bad.title, "Chưa lưu được kết quả"); assert.match(txt(bad), /hoàn lại/); assert.ok(!/Nhận /.test(txt(bad)), "lỗi hệ thống: không báo đã nhận quyển");
}

// ---- Thành Tựu (achvScreen.ts, #1317): hàm thuần ----
{
  const { ACHV, ACHV_GROUPS } = await import("../../shared/data.ts");
  const { achvGroups, achvStateOf, readyIds, achvBadgeCount, achvIsBlank, achvPrimary, achvRowNode, achvRewardParts, claimedLine } = await import("../src/achvScreen.ts");
  const z = { level: 1, owned: 2, stars: 1, quests: 0, arenaWins: 0, elite: 0, king: 0, world: 0, bicanh: 0 };
  const m0 = { stats: z, claimed: [], ready: 0 };
  assert.deepEqual(achvGroups(m0).map((g) => g.code), ACHV_GROUPS.map((g) => g.code), "đủ nhóm, đúng thứ tự");
  assert.equal(achvGroups(m0).reduce((a, g) => a + g.rows.length, 0), ACHV.length, "mọi thành tựu thuộc một nhóm");
  assert.equal(achvIsBlank(m0), true); assert.deepEqual(readyIds(m0), []); assert.equal(achvPrimary(m0, false).disabled, true); assert.match(achvPrimary(m0, false).reason, /Chưa có/);
  const m1 = { stats: { ...z, elite: 12 }, claimed: [], ready: 2 };
  assert.deepEqual(readyIds(m1), ["elite_t1", "elite_t2"], "elite 12: hai bậc đầu đạt");
  const r1 = achvGroups(m1).flatMap((g) => g.rows).filter((r) => r.def.stat === "elite");
  assert.deepEqual(r1.map((r) => r.state), ["ready", "ready", "todo"]); assert.equal(r1[2].have, 12); assert.ok(r1[2].pct > 0 && r1[2].pct < 1, "bậc 3 chưa đạt: tiến độ giữa 0 và 1"); assert.equal(r1[0].pct, 1, "tiến độ kẹp 1");
  assert.equal(achvStateOf(ACHV.find((a) => a.id === "elite_t1"), { stats: m1.stats, claimed: ["elite_t1"] }), "claimed", "đã nhận thắng đã đạt");
  assert.equal(achvPrimary(m1, false).label, "Nhận tất cả (2)"); assert.equal(achvPrimary(m1, true).disabled, true); assert.equal(achvPrimary(m1, true).reason, "Đang gửi…"); assert.equal(achvPrimary(null, false).reason, "Đang tải…");
  assert.equal(achvBadgeCount({ ready: 3 }), 3); assert.equal(achvBadgeCount({ ready: -1 }), 0); assert.equal(achvBadgeCount({ ready: NaN }), 0);
  assert.equal(achvGroups(m1).find((g) => g.code === "hunt").ready, 2, "chấm nhóm theo số bậc đạt");
  const row = JSON.stringify(achvRowNode(r1[0])), rowDone = JSON.stringify(achvRowNode({ ...r1[0], state: "claimed" })), rowTodo = JSON.stringify(achvRowNode(r1[2]));
  assert.match(row, /av-claim f2-nut-phu/); assert.doesNotMatch(rowDone, /av-claim f2-nut-phu/); assert.match(rowDone, /Đã nhận/); assert.doesNotMatch(rowTodo, /av-claim f2-nut-phu/); assert.match(rowTodo, /Chưa đạt/);
  assert.match(row, /progressbar/, "thanh tiến độ có vai trò + giá trị cho đọc màn hình");
  assert.ok(ACHV.every((a) => achvRewardParts(a).length > 0), "mọi thành tựu có dòng quà");
  assert.match(claimedLine({ id: "elite_t1", honTe: 30, items: [] }), /Hạ 1 tinh anh/); assert.match(claimedLine({ id: "khong_co", honTe: 0, items: [] }), /khong_co/, "mã lạ không làm vỡ");
}

// ---- Thư (mailScreen.ts, #1336): hàm thuần ----
{
  const { mailRewardClaimed } = await import("../src/mailScreen.ts");
  const { achvRewardStep } = await import("../src/achvScreen.ts");
  const { welfareRewardClaimed } = await import("../src/welfareScreen.ts");
  // Tiếng thưởng (#1577): chỉ khi server xác nhận nhận thật, đúng một lần.
  assert.equal(mailRewardClaimed({ claimedNow: { count: 2, honTe: 5, items: [] } }), true, "thư: nhận thật thì có tiếng");
  assert.equal(mailRewardClaimed({}), false, "thư: làm mới thì im"); assert.equal(mailRewardClaimed({ err: "x", claimedNow: { count: 1, honTe: 0, items: [] } }), true, "thư: nhận một phần rồi lỗi vẫn có tiếng"); assert.equal(mailRewardClaimed({ err: "x" }), false, "thư: lỗi không nhận gì thì im"); assert.equal(mailRewardClaimed({ claimedNow: { count: 0, honTe: 0, items: [] } }), false, "thư: nhận 0 thì im");
  assert.equal(welfareRewardClaimed({ signed: { day: 1, makeup: false, fee: 0, honTe: 1, items: [] } }), true, "ký thành công có tiếng"); assert.equal(welfareRewardClaimed({}), false); assert.equal(welfareRewardClaimed({ err: "x" }), false);
  const cn = { claimedNow: { id: "a", honTe: 1, items: [] } };
  assert.deepEqual(achvRewardStep(false, cn, 0), { won: false, play: true }, "thành tựu: nhận một mốc → một tiếng");
  assert.deepEqual(achvRewardStep(false, cn, 2), { won: true, play: false }, "nhận tất cả: chưa hết hàng đợi thì chưa phát");
  assert.deepEqual(achvRewardStep(true, cn, 0), { won: false, play: true }, "nhận tất cả: mốc cuối → đúng một tiếng");
  assert.deepEqual(achvRewardStep(true, { err: "x" }, 0), { won: false, play: true }, "lỗi giữa chừng sau khi đã nhận → vẫn một tiếng");
  assert.deepEqual(achvRewardStep(false, { err: "x" }, 0), { won: false, play: false }, "lỗi ngay từ đầu → im");
  assert.deepEqual(achvRewardStep(false, {}, 0), { won: false, play: false }, "làm mới → im");
  const { MAIL } = await import("../../shared/data.ts");
  const { mailStateOf, mailFilter, mailBadgeCount, mailGiftIds, mailExpiry, mailGiftParts, mailClaimedLine, mailPrimary, mailRowNode, mailDetailNode } = await import("../src/mailScreen.ts");
  const DAY = 86_400_000, now = 1_000_000_000_000;
  const mk = (id, o = {}) => ({ id, from: "Quản trị", title: `Thư ${id}`, body: "", honTe: 0, items: [], at: now - DAY, exp: now + 20 * DAY, read: true, claimed: false, ...o });
  const a = mk(1, { read: false }), b = mk(2, { honTe: 50, read: false }), c = mk(3, { honTe: 20, read: true, claimed: true }), d = mk(4), e = mk(5, { items: [{ code: "khong_co", qty: 2 }] });
  assert.deepEqual([a, b, c, d, e].map(mailStateOf), ["new", "gift", "claimed", "read", "gift"], "quà chờ nhận thắng 'mới'; đã nhận / đã đọc tách nhau");
  assert.deepEqual(mailFilter([a, b, c, d, e], "unread").map((m) => m.id), [1, 2]); assert.deepEqual(mailFilter([a, b, c, d, e], "gift").map((m) => m.id), [2, 5]); assert.equal(mailFilter([a, b], "all").length, 2);
  assert.equal(mailBadgeCount({ list: [a, b, c, d, e] }), 3, "đếm thư cần chú ý (1, 2, 5), thư vừa chưa đọc vừa có quà chỉ tính một lần"); assert.equal(mailBadgeCount({ list: [] }), 0); assert.equal(mailBadgeCount({}), 0);
  assert.deepEqual(mailGiftIds({ list: [a, b, c, d, e] }), [2, 5]);
  assert.equal(mailExpiry(now + 20 * DAY, now).soon, false); assert.equal(mailExpiry(now + 20 * DAY, now).text, "Còn 20 ngày");
  assert.equal(mailExpiry(now + MAIL.warnDays * DAY, now).soon, true); assert.match(mailExpiry(now + 2 * DAY, now).text, /Sắp hết hạn: còn 2 ngày/); assert.equal(mailExpiry(now - 5, now).text, "Hết hạn hôm nay");
  assert.deepEqual(mailGiftParts(e), ["khong_co ×2"], "mã lạ không làm vỡ"); assert.match(mailClaimedLine({ count: 2, honTe: 30, items: [] }), /Nhận 2 thư/);
  assert.equal(mailPrimary(null, false).reason, "Đang tải…"); assert.equal(mailPrimary({ list: [a], unread: 1, pending: 0 }, false).disabled, true); assert.match(mailPrimary({ list: [a], unread: 1, pending: 0 }, false).reason, /Không có thư/);
  assert.equal(mailPrimary({ list: [b, e], unread: 1, pending: 2 }, false).label, "Nhận tất cả (2)"); assert.equal(mailPrimary({ list: [b], unread: 1, pending: 1 }, true).reason, "Đang gửi…");
  const rowNew = JSON.stringify(mailRowNode(a, false, now)), rowGift = JSON.stringify(mailRowNode(b, true, now)), rowSoon = JSON.stringify(mailRowNode(mk(6, { exp: now + DAY }), false, now));
  assert.match(rowNew, /Mới/); assert.match(rowGift, /Có quà/); assert.match(rowGift, /"aria-pressed":"true"/); assert.match(rowSoon, /Sắp hết hạn/, "nhãn hạn bằng chữ"); assert.doesNotMatch(rowNew, /Sắp hết hạn/);
  const dGift = JSON.stringify(mailDetailNode(b, false, now)), dDone = JSON.stringify(mailDetailNode(c, false, now)), dBusy = JSON.stringify(mailDetailNode(b, true, now));
  assert.match(dGift, /ml-claim f2-nut-phu/); assert.doesNotMatch(dGift, /ml-del/, "thư còn quà chưa nhận: không có nút Xóa, có gợi ý"); assert.match(dGift, /Nhận quà rồi mới xóa/);
  assert.doesNotMatch(dDone, /ml-claim/); assert.match(dDone, /ml-del/); assert.match(dBusy, /disabled/); assert.match(JSON.stringify(mailDetailNode(null, false, now)), /Chọn một thư/);
}

// Bộ nối X4: giữ điểm, thứ tự và giới hạn trường công khai.
const { resonanceRank, arenaRank, tongRank, rankSource } = await import("../src/rankAdapters.ts");
const { RANK_PAGE_SIZE } = await import("../../shared/data.ts");
const res = resonanceRank({ page: 2, pageSize: 10, total: 25, hasNext: true, list: [{ name: "<b>Hồn sư</b>", score: 123, me: true, milestones: 2, bag: ["bí mật"], x: 7 }], me: { rank: 11, score: 123, extraStars: 99 } }, 42);
assert.deepEqual(res.rows, [{ rank: 11, name: "<b>Hồn sư</b>", score: 123, me: true }]);
assert.deepEqual(res.me, { rank: 11, score: 123 }); assert.equal(res.asOf, 42);
const arena = { list: Array.from({ length: RANK_PAGE_SIZE + 2 }, (_, i) => ({ name: `Hồn sư ${i}`, elo: 2000 - i, me: false, wins: 10, losses: 3, draws: 1 })), me: { rank: 123, elo: 888, accountId: 4 }, start: 1000, left: 5 };
const ar = arenaRank(arena, 2, 43);
assert.equal(ar.rows[0].rank, RANK_PAGE_SIZE + 1); assert.equal(ar.rows.length, 2); assert.equal(ar.hasNext, false);
assert.deepEqual(ar.me, { rank: 123, score: 888 }); assert.equal(arenaRank({ ...arena, list: [], me: null }, 1, 0).me, null);
const tg = tongRank({ week: 123, min: 10, me: 7, cur: { tongs: [{ tong: "hao_thien", avg: 12.5, active: 2 }], top: { hao_thien: [{ name: "A", points: 30, bag: [] }], that_bao: [{ name: "B", points: 50 }] } }, last: { reward: "top" } }, 1, 44);
assert.deepEqual(tg.rows, []); assert.equal(tg.me, null); assert.equal(tg.sections[0].rows[0].rank, 1); assert.equal(tg.sections[1].rows[0].rank, 1);
assert.equal(tg.sections[0].rows[0].score, 30); assert.equal(JSON.stringify(tg).includes('"bag"'), false); assert.equal(JSON.stringify(tg).includes('"reward"'), false);
assert.match(tg.meText, /7 điểm tông/); assert.match(tg.note, /không có hạng cá nhân toàn server/);
assert.equal(rankSource("cong_minh").type, "resonance"); assert.equal(rankSource("elo").type, "arena"); assert.equal(rankSource("tong_tuan").op, "board");
console.log("✓ Bộ nối Xếp Hạng: điểm, trang, quyền riêng tư");
