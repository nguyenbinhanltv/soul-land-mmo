// #717: atlas ánh sáng nhiều trang; xếp kệ không chồng nhau, tràn trang đầu thì mở trang kế, hết trang thì null.
import assert from "node:assert/strict";
import { ATLAS_MAX_PAGES, ATLAS_PAD, ATLAS_SIZE, ShelfPacker } from "../src/isoPack.ts";

// 40 nhà 300×400 (vượt một trang 2048²: 6 cột × 5 kệ = 30) vẫn lọt hết ở trang 2
const p = new ShelfPacker(), spots = [];
for (let i = 0; i < 40; i++) { const s = p.place(300, 400); assert.ok(s, `ảnh ${i} phải có chỗ`); spots.push(s); }
assert.ok(spots.some((s) => s.page === 1), "phải mở trang thứ hai");
assert.equal(p.pageCount, 2);
// không chồng nhau, không ra ngoài trang
for (const s of spots) assert.ok(s.x >= 0 && s.y >= 0 && s.x + 300 <= ATLAS_SIZE && s.y + 400 <= ATLAS_SIZE);
for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) {
  const a = spots[i], b = spots[j];
  if (a.page !== b.page) continue;
  assert.ok(a.x + 300 + ATLAS_PAD <= b.x || b.x + 300 + ATLAS_PAD <= a.x || a.y + 400 + ATLAS_PAD <= b.y || b.y + 400 + ATLAS_PAD <= a.y, `chồng ${i}/${j}`);
}
// ảnh quá lớn → null; hết trang → null, không ném lỗi
assert.equal(new ShelfPacker().place(ATLAS_SIZE + 1, 10), null);
const f = new ShelfPacker(); let n = 0;
while (f.place(ATLAS_SIZE, ATLAS_SIZE)) n++;
assert.equal(n, ATLAS_MAX_PAGES);
console.log("isopack-test: ok");
