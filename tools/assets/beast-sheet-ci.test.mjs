// Thử CI nhẹ tờ hồn thú (#866): chọn loài từ file PR đổi, phân loại lỗi chặn CI.
import test from "node:test";
import assert from "node:assert/strict";
import { changedFromFiles, isCiBlocker, summaryMarkdown, evaluate } from "./beast-sheet-ci.mjs";

test("changedFromFiles: chỉ tờ toX.png kích hoạt loài; công cụ đánh dấu riêng", () => {
  const r = changedFromFiles(["art/src/beast-anim/phong_lang/toA.png", "art/src/beast-anim/phong_lang/toB.png", "art/src/beast-anim/quy_ho/NGUON.md", "art/src/beast-anim/u_minh_lang/toC.prompt.txt", "README.md"]);
  assert.deepEqual(r, { species: ["phong_lang"], toolsChanged: false });
  assert.equal(changedFromFiles(["tools/assets/beast-sheet-cut.mjs"]).toolsChanged, true);
  assert.equal(changedFromFiles(["tools/assets/lib.mjs"]).toolsChanged, false);
});

test("isCiBlocker: chặn đúng 4 nhóm, còn lại cảnh báo", () => {
  const b = (code, msg = "", sev = "block") => isCiBlocker({ sev, code, msg });
  assert.ok(b("kich-thuoc") && b("nen") && b("luoi") && b("hinh-dinh"));
  assert.ok(b("so-hinh", "dải có 5 hình, cần 6: thiếu khung."));
  assert.ok(!b("so-hinh", "dải có 7 hình, cần 6: thừa hình / mảnh rời."));
  assert.ok(!b("co-than") && !b("kich-thuoc", "", "light") && !b("nen", "", "note"));
});

test("evaluate + summaryMarkdown chạy trên loài thật, không chặn khi loài đạt", () => {
  const x = evaluate("hac_boi_da_tru");
  assert.equal(x.blockers.length, 0);
  const md = summaryMarkdown([x]);
  assert.match(md, /hac_boi_da_tru/);
  assert.match(md, /Không có lỗi chặn CI/);
});
