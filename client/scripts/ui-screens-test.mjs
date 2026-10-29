// UI v2: hub ngăn kéo + ba màn hệ thống mới (Xếp Hạng, Lịch Hoạt Động, Phúc Lợi): phần thuần (bố cục, mô hình hiển thị), không cần DOM / server.
import assert from "node:assert/strict";
import { HUB_ITEMS, hubLayout } from "../src/hubMenu.ts";
import { setBadge, clearBadge, badgeOf, allBadges, onBadges, resetBadges, starReadyCount, ringReady, questActionable } from "../src/badges.ts";
import { logNotice, notices, clearNotices, LOG_MAX } from "../src/noticeLog.ts";
import { noticeNode, noticeTime } from "../src/noticeScreen.ts";
import { toHtml } from "../src/uiParts.ts";
import { fixedGoal, slotState, todayIndex, byDay, dayDate, slotRange, STATE_LABEL } from "../src/calendarScreen.ts";
import { COUNTDOWN_SOON_MS } from "../src/uiParts.ts";
import { rewardIcons, cellState, signedToday, needsSign, isMilestone, rewardParts, signedLine, primaryOf, nextMidnightVn, feeText } from "../src/welfareScreen.ts";
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
assert.equal(cell(hubLayout([]), "achv").card.reason, "Sắp có");
assert.equal(cell(L, "rank").card.state, "new", "chấm đỏ cho mục có việc mới");
assert.equal(cell(L, "bag").card.state, undefined, "mục có chức năng, không việc mới: thẻ thường");
assert.deepEqual(L.rail.map((c) => [c.item.id, c.enabled]), [["mail", false], ["notice", false], ["settings", true], ["shot", false]], "rail đủ mục, chưa nối thì mờ");
assert.equal(cell(L, "mail").card.state, "lock"); assert.equal(cell(L, "mail").card.reason, "Chờ máy chủ");
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
