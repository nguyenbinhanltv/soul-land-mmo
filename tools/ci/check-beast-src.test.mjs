import test from "node:test";
import assert from "node:assert/strict";
import { checkBeastSrc } from "./check-beast-src.mjs";

const P = "art/src/beast-anim/x/";
test("một bản mỗi loài: tờ đúng tên đạt", () => {
  const r = checkBeastSrc([`${P}toA.png`, `${P}toB.png`, `${P}to-ne.png`, `${P}turnaround.png`, `${P}NGUON.md`], () => 1000);
  assert.deepEqual(r.errs, []);
  assert.equal(r.pngBytes, 4000);
});
test("ảnh nháp / legacy / review ở thư mục loài bị chặn", () => {
  for (const n of ["toA-attempt1.png", "toA-legacy.png", "review-884-game.png"]) assert.equal(checkBeastSrc([`${P}${n}`]).errs.length, 1, n);
});
test("candidates: tờ bị chặn giữ đúng một lượt", () => {
  assert.deepEqual(checkBeastSrc([`${P}candidates/toB-attempt2.png`, `${P}candidates/toB-attempt2.prompt.txt`]).errs, []);
  assert.equal(checkBeastSrc([`${P}candidates/toB-attempt1.png`, `${P}candidates/toB-attempt2.png`]).errs.length, 1);
});
test("candidates: đã có toX.png chính thì lượt thử là bản dư; ảnh lạ bị chặn", () => {
  assert.equal(checkBeastSrc([`${P}toB.png`, `${P}candidates/toB-attempt1.png`]).errs.length, 1);
  assert.equal(checkBeastSrc([`${P}candidates/884-guide1/guide.png`]).errs.length, 1);
  assert.equal(checkBeastSrc([`${P}candidates/A82A2.png`]).errs.length, 1);
  assert.equal(checkBeastSrc([`${P}candidates/notes.txt`]).errs.length, 1);
});
