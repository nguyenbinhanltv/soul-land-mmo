// UI v2: hub ngăn kéo + ba màn hệ thống mới (Xếp Hạng, Lịch Hoạt Động, Phúc Lợi): phần thuần (bố cục, mô hình hiển thị), không cần DOM / server.
import assert from "node:assert/strict";
import { HUB_ITEMS, hubLayout } from "../src/hubMenu.ts";

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

console.log("ui-screens: ok");
