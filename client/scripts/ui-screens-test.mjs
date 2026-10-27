// UI v2: hub ngăn kéo + ba màn hệ thống mới (Xếp Hạng, Lịch Hoạt Động, Phúc Lợi): phần thuần (bố cục, mô hình hiển thị), không cần DOM / server.
import assert from "node:assert/strict";
import { HUB_ITEMS, hubLayout } from "../src/hubMenu.ts";
import { rankGroups, podiumOf, lineupText, meLine, pageLabel, tongName } from "../src/rankScreen.ts";

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
assert.equal(tongName(undefined), ""); assert.equal(tongName("khong_co"), "");

console.log("ui-screens: ok");
