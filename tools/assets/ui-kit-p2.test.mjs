// Thử P2 của UI Kit (#880): bài học, prompt sinh tự động, CI nhẹ, trang bộ component (fixture C2 / UI-5, không cần Chrome).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadKit, expandKind } from "./ui-kit-lib.mjs";
import { parseLessons, lessonsFor, SHEET_KINDS } from "./ui-sheet-lessons.mjs";
import { buildPrompt, buildDoc, referencesFor, pickKindLayout } from "./ui-sheet-prompt.mjs";
import { changedFromFiles, isCiBlocker, summaryMarkdown } from "./ui-sheet-ci.mjs";
import { buildPage, writePreview, sourceFromFixture, BACKGROUNDS, FRAME_SIZES, FONT_SIZES, VI_STRINGS } from "./ui-kit-preview.mjs";

const kit = loadKit();

test("prompt Hub #1580: tái tạo đúng prompt thật, không lẫn thứ tự menu cũ", () => {
  const p = buildPrompt(expandKind(kit, "I"), { family: "hub" });
  assert.equal(p, readFileSync(new URL("../../art/src/ui-kit/hub-1580/prompt.txt", import.meta.url), "utf8"));
  assert.match(p, /achievement medal/);
  assert.match(p, /attendance booklet/);
  assert.match(p, /announcement bronze handbell/);
  assert.doesNotMatch(p, /automatic hunt crossed blades/);
  assert.doesNotMatch(buildPrompt(expandKind(kit, "I"), { family: "menu" }), /attendance booklet/);
});

test("hon-quang: phân vai riêng, BOARD v3 đủ mẫu và không đổi hướng mặc định", () => {
  for (const id of SHEET_KINDS) {
    const p = buildPrompt(expandKind(kit, id), { style: "hon-quang" });
    assert.match(p, /white, yellow, violet, black, red/);
    assert.match(p, /Exactly ONE luminous focal area/);
    assert.doesNotMatch(p, /Rank by light|stone grey, jade green/);
    assert.match(p, /no text|NO text|no text, numbers/i);
  }
  const b = expandKind(kit, "BOARD"), p = buildPrompt(b, { style: "hon-quang" });
  assert.match(p, /BOARD v3/);
  assert.match(p, /exactly five equal-height leaderboard rows/);
  assert.match(p, /exactly eight equal square hotbar slots/);
  assert.match(p, /exactly five identical neutral gem item slots/);
  assert.match(p, /4-pixel logical grid/);
  assert.doesNotMatch(p, /magenta|hinted village|podium hierarchy/);
  assert.doesNotMatch(buildPrompt(b), /BOARD v3/);
  assert.match(buildPrompt(b), /near-black wood/);
  assert.ok(referencesFor("BOARD", "hon-quang").every((r) => !r.required));
  assert.match(buildDoc(b, { style: "hon-quang" }), /Hồn Quang Tiên Môn/);
  const doc = buildDoc(b, { style: "hon-quang" });
  assert.doesNotMatch(doc, /art\/src\/ui-kit\/BOARD\.png/);
  assert.match(doc, /candidates\/hon-quang\/BOARD\.png/);
  assert.match(doc, /candidates\/hon-quang\/BOARD\.prompt\.txt/);
  assert.match(doc, /--kind BOARD --out/);
});

test("lessons.md: parse được, mọi loại tờ có ít nhất một bài, cú pháp sai thì ném lỗi", () => {
  const all = parseLessons(readFileSync(new URL("../../art/src/ui-kit/lessons.md", import.meta.url), "utf8"));
  assert.ok(all.length >= 10);
  for (const k of SHEET_KINDS) assert.ok(lessonsFor(k).length > 0, `loại ${k} không có bài học`);
  assert.ok(lessonsFor("N").some((l) => /pressed/.test(l.text)));
  assert.ok(!lessonsFor("F").some((l) => /skill-slot/.test(l.text)), "bài của O không lọt vào F");
  assert.throws(() => parseLessons("- [Z] x"), /loại tờ lạ/);
  assert.throws(() => parseLessons("- [F]"), /sai cú pháp/);
});

test("prompt: mỗi loại có bố cục đúng số mảnh, nền, LESSONS, không tự mâu thuẫn (không chữ)", () => {
  for (const id of SHEET_KINDS) {
    const kind = expandKind(kit, id), p = buildPrompt(kind);
    assert.match(p, /LESSONS/);
    assert.match(p, /no text|NO text|no text, numbers/i);
    if (kind.board) { assert.match(p, /3:2/); continue; }
    const layout = pickKindLayout(kind), total = layout.reduce((a, b) => a + b, 0);
    assert.match(p, new RegExp(`sheet of ${total} separate`));
    assert.match(p, /#FF00FF/);
    assert.equal((p.match(/^ {2}\d+\.\d+ {2}/gm) ?? []).length, total, `${id}: số dòng mảnh`);
    assert.ok(!/caption|label each|write the name/i.test(p.replace(/LESSONS[\s\S]*/, "").replace(/DO NOT DRAW:.*/, "")), `${id}: prompt không đòi nhãn`);
  }
  assert.match(buildPrompt(expandKind(kit, "I"), { family: "status" }), /icon family of this sheet: status/);
  assert.equal(pickKindLayout(expandKind(kit, "D"), 9).length, 3);
  assert.throws(() => pickKindLayout(expandKind(kit, "D"), 7), /không có bố cục 7/);
});

test("prompt tờ F: mọi khung theo --material, không cố định 2 khung Giấy", () => {
  const f = expandKind(kit, "F"), muc = buildPrompt(f, { material: "muc" }), giay = buildPrompt(f, { material: "giay" });
  assert.ok(!/paper[- ]material/i.test(muc.replace(/LESSONS[\s\S]*/, "")), "F Mực không nhắc Giấy");
  assert.match(muc, /INK material/);
  assert.equal((muc.match(/ink-material/g) ?? []).length, 4);
  assert.ok(!/ink[- ]material/i.test(giay.replace(/LESSONS[\s\S]*/, "")), "F Giấy không nhắc Mực");
  assert.match(giay, /PAPER material/);
  assert.equal((giay.match(/paper-material/g) ?? []).length, 4);
  assert.match(buildDoc(f, { material: "giay" }), /Giấy \(/);
});

test("tài liệu prompt: tham chiếu theo thứ tự cố định, không dùng tờ lỗi, tối đa 3 lượt", () => {
  const refs = referencesFor("F");
  assert.deepEqual(refs.map((r) => r.n), [1, 2, 3]);
  assert.ok(refs[0].required && /BOARD/.test(refs[0].vi));
  const doc = buildDoc(expandKind(kit, "N"));
  assert.match(doc, /3 lượt/);
  assert.match(doc, /\*\*Không\*\* dùng tờ hỏng làm tham chiếu/);
  assert.match(doc, /npm run ui:check -- art\/src\/ui-kit\/toN\.png/);
});

test("CI nhẹ: nhận tờ đổi, nhận công cụ, chỉ chặn cỡ / nền / thiếu mảnh / lưới", () => {
  const ch = changedFromFiles(["art/src/ui-kit/toF.png", "art/src/ui-kit/toF.prompt.txt", "art/src/ui-kit/BOARD.png", "art/src/ui-kit/x/N-2.png", "art/src/ui-kit/random.png", "README.md"]);
  assert.deepEqual(ch.sheets, ["art/src/ui-kit/BOARD.png", "art/src/ui-kit/toF.png", "art/src/ui-kit/x/N-2.png"]);
  assert.equal(ch.toolsChanged, false);
  assert.equal(changedFromFiles(["tools/assets/ui-sheet-cut.mjs"]).toolsChanged, true);
  assert.equal(changedFromFiles(["art/src/ui-kit/ui-kit.json"]).toolsChanged, true);
  assert.equal(changedFromFiles(["art/src/ui-kit/lessons.md"]).toolsChanged, true);
  assert.equal(changedFromFiles(["tools/assets/beast-sheet-cut.mjs"]).toolsChanged, false);
  const b = (code, msg = "") => isCiBlocker({ sev: "block", code, msg });
  for (const c of ["kich-thuoc", "nen", "luoi", "hinh-dinh", "trang-thai"]) assert.ok(b(c), c);
  assert.ok(b("so-hinh", "có 4 mảnh, cần 5: thiếu mảnh."));
  assert.ok(!b("so-hinh", "có 7 mảnh, cần 6: thừa mảnh rời."));
  for (const c of ["vien-hong", "canh-phang", "mau"]) assert.ok(!b(c), `${c} chỉ cảnh báo ở CI`);
  assert.ok(!isCiBlocker({ sev: "light", code: "nen", msg: "" }));
  assert.match(summaryMarkdown([], {}), /Không có tờ nào để kiểm/);
});

test("trang bộ component: đủ mục A–E, 3 nền, 3 cỡ khung, 10/12/24 px, DPR 1/2, nút thật, chuỗi Việt", async () => {
  const sources = [await sourceFromFixture("c2"), await sourceFromFixture("ui5")];
  const dir = mkdtempSync(path.join(os.tmpdir(), "ui-preview-"));
  try {
    const r = writePreview(sources, dir, {});
    assert.equal(r.pieces, 13);
    const html = readFileSync(r.file, "utf8");
    for (const h of ["A. Tóm tắt", "B. Mọi mảnh", "C. 9-slice", "D. Bộ trạng thái", "E. Chữ Việt"]) assert.ok(html.includes(h), h);
    for (const [, c] of BACKGROUNDS) assert.ok(html.includes(c), `nền ${c}`);
    for (const [w, h] of FRAME_SIZES) assert.ok(html.includes(`${w}×${h}`), `cỡ ${w}×${h}`);
    for (const fs of FONT_SIZES) assert.ok(html.includes(`font:${fs}px`), `${fs} px`);
    for (const s of VI_STRINGS) assert.ok(html.includes(s), s);
    assert.ok(html.includes("DPR 1") && html.includes("DPR 2"));
    assert.match(html, /<button class="g0v1">/);
    assert.match(html, /:hover\{border-image-source/);
    assert.match(html, /:disabled\{border-image-source/);
    assert.match(html, /:focus-visible/);
    assert.ok(!/style="[^"]*url\("/.test(html), "url trong thuộc tính style phải dùng nháy đơn");
    for (const s of sources) for (const p of s.pieces) for (const v of [1, 2]) assert.ok(existsSync(path.join(dir, s.label, `${v}x`, `${p.key}.png`)));
    // vạch 9-slice của biến thể 2× hiển thị bằng một nửa (border-width = vạch / 2)
    const nut = sources[1].pieces.find((p) => p.key === "ui2_nut_thuong");
    assert.ok(html.includes(`border-image-slice:${nut.nine.x2} fill;border-image-width:${nut.nine.x2 / 2}px`));
    // tất định
    assert.equal(buildPage(sources), buildPage(sources));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
