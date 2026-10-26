// Thử ui-sheet-check / ui-sheet-cut / ui-kit.json (#879): fixture = 7 mảnh C2 + vài khung UI-5 thật (phóng lên tờ giả), cộng khung tổng hợp có lỗi cố ý.
import test from "node:test";
import assert from "node:assert/strict";
import { Img, decodePng } from "./lib.mjs";
import { loadKit, kindFromName, classifyUiShape, suggestNine, nineSliceRender, mirrorFold, buildPalette, quantize, areaDown } from "./ui-kit-lib.mjs";
import { analyzeUiSheet, draftErrorLine, toJson } from "./ui-sheet-check.mjs";
import { cutUiSheet, budgetOf, mergeIntoKit } from "./ui-sheet-cut.mjs";
import { c2Sheet, C2_KIND, ui5Sheet, buildSheet, fakeFrame, readUi } from "./ui-sheet-fixture.mjs";

const realKit = loadKit();
// luật (shapes, kinds, budget) lấy từ manifest thật; mảnh / nhóm để rỗng để test không phụ thuộc mảnh đã commit sau này
const kit = { ...realKit, pieces: [], groups: {} };
const codes = (r, sev) => r.issues.filter((i) => i.sev === sev).map((i) => i.code);
const frames = (n, o = {}) => Array.from({ length: n }, () => fakeFrame(60, 44, o));
const fSheet = (o = {}, sheetOpt = {}) => buildSheet([frames(3, o), frames(3, o)], { k: 4, ...sheetOpt });
const check = (img, kindId = "F", extra = {}) => analyzeUiSheet(img, { kit, kindId, name: `to${kindId}`, ...extra });

test("manifest: bố cục khớp số tên mảnh, tên file → loại tờ, tỉ lệ ∈ tập Codex, ngân sách", () => {
  for (const [id, k] of Object.entries(kit.kinds)) {
    if (k.board) continue;
    for (const l of k.layouts) assert.ok(l.reduce((a, b) => a + b, 0) <= k.pieces.length, `${id} bố cục ${l}`);
  }
  assert.equal(kindFromName("a/b/toF.png"), "F");
  assert.equal(kindFromName("N-2.png"), "N");
  assert.equal(kindFromName("BOARD.png"), "BOARD");
  assert.equal(kindFromName("anh.png"), null);
  assert.equal(classifyUiShape(kit, 1536, 1024).id, "3:2");
  assert.equal(classifyUiShape(kit, 1254, 1254).exact, true);
  assert.equal(classifyUiShape(kit, 1024, 1024).exact, true);
  assert.equal(classifyUiShape(kit, 1020, 1024).id, "1:1");
  assert.equal(classifyUiShape(kit, 1200, 1000), null);
  assert.deepEqual(kit.budget, { kit: 256000, icon: 153600 });
});

test("vạch 9-slice đo từ ảnh khớp số manifest: nút UI-5 = 7, hộp thoại = 14", () => {
  assert.equal(suggestNine(readUi("nut_thuong")).nine, 7);
  assert.ok([14, 15].includes(suggestNine(readUi("hop_thoai")).nine));
});

test("tờ C2 (7 mảnh thật, bố cục 3+2+2): dò đủ 7 mảnh, không có mục chặn", () => {
  const r = analyzeUiSheet(c2Sheet(), { kit, kind: C2_KIND, name: "c2" });
  assert.equal(r.pieces.length, 7);
  assert.deepEqual(r.bands.map((b) => b.figures.length), [3, 2, 2]);
  assert.equal(codes(r, "block").length, 0, JSON.stringify(r.issues));
});

test("mảnh C2 tranh vẽ tay coi là khung 9-slice thì bị chặn (cạnh có hoa văn)", () => {
  const asFrame = { ...C2_KIND, pieces: C2_KIND.pieces.map((p) => ({ ...p, stretch: p.name === "nv6_nen_bup_be" })) };
  const r = analyzeUiSheet(c2Sheet(), { kit, kind: asFrame, name: "c2" });
  assert.ok(codes(r, "block").includes("canh-phang"));
});

test("viền ám hồng quanh mảnh được gỡ khi khoá nền; dải viền hồng dày thì chặn", () => {
  const thin = analyzeUiSheet(c2Sheet({ halo: 2 }), { kit, kind: C2_KIND, name: "c2" });
  assert.ok(!codes(thin, "block").includes("vien-hong"));
  const frame = fakeFrame(60, 44, { band: [200, 80, 200], ink: [200, 80, 200], t: 9 }); // dải viền dày 9 điểm ngả hồng: gỡ 3 lớp vẫn còn
  const thick = check(buildSheet([[frame, frame, frame], [frame, frame, frame]], { k: 4 }));
  assert.ok(codes(thick, "block").includes("vien-hong"), JSON.stringify(thick.issues.map((i) => i.code)));
});

test("tờ UI-5 (6 khung thật): đủ 6 mảnh, vạch 9-slice khớp, không chặn", () => {
  const r = check(ui5Sheet(), "F");
  assert.equal(codes(r, "block").length, 0, JSON.stringify(r.issues));
  assert.deepEqual(r.pieces.map((p) => p.nine), [14, 14, 7, 7, 7, 7]);
});

test("khung tổng hợp sạch: đạt; cạnh sọc bị chặn; chữ trong ruột chỉ cảnh báo", () => {
  const ok = check(fSheet());
  assert.equal(ok.level, "pass", JSON.stringify(ok.issues));
  assert.ok(ok.pieces.every((p) => p.nine >= 8 && p.flat < 0.15));
  const striped = check(fSheet({ stripes: true }));
  assert.equal(striped.level, "chặn");
  assert.ok(codes(striped, "block").includes("canh-phang"));
  const text = check(buildSheet([frames(3), [fakeFrame(60, 44, { text: "ABCD" }), ...frames(2)]], { k: 4 }));
  assert.ok(codes(text, "warn").includes("chu-lac"), JSON.stringify(text.issues));
  assert.ok(!codes(text, "block").length);
  assert.match(draftErrorLine(text), /^LỖI: toF — nghi chữ trong ảnh/);
});

test("ruột không đồng nhất (dốc màu) làm vạch 9-slice chạm trần: nhẹ chia-9", () => {
  const r = check(fSheet({ gradient: true }));
  assert.ok(codes(r, "light").includes("chia-9"), JSON.stringify(r.issues.map((i) => i.code)));
  assert.ok(!codes(check(fSheet()), "light").includes("chia-9"));
});

test("nền, cỡ, số mảnh, trạng thái: chặn đúng mã", () => {
  assert.ok(codes(check(fSheet({}, { bg: [255, 255, 255] })), "block").includes("nen"));
  assert.ok(codes(check(new Img(1200, 1000)), "block").includes("kich-thuoc"));
  assert.ok(codes(check(new Img(1024, 1536)), "block").includes("kich-thuoc"), "F cần 3:2");
  const five = check(buildSheet([frames(3), frames(2)], { k: 4 }));
  assert.ok(codes(five, "block").includes("so-hinh"));
  assert.equal(five.pieces.length, 0);
  const twoRows = check(buildSheet([frames(5), frames(5)], { k: 4 }), "N");
  assert.ok(codes(twoRows, "block").includes("luoi"));
  const few = check(buildSheet([frames(5), frames(4), frames(2)], { k: 4 }), "N");
  const bad = codes(few, "block");
  assert.ok(bad.includes("so-hinh") && bad.includes("trang-thai"), JSON.stringify(few.issues));
  assert.match(few.issues.find((i) => i.code === "trang-thai").msg, /nut_phu_chon/);
});

test("tờ nút đủ 12 mảnh (5+5+2): đạt, trạng thái trùng nhau bị nhắc", () => {
  const btn = (c) => fakeFrame(56, 28, { t: 3, cap: 5, inner: c });
  const a = [90, 30, 30], b = [30, 90, 60];
  const row = (c) => Array.from({ length: 5 }, () => btn(c));
  const r = check(buildSheet([row(a), row(b), [btn(a), btn(b)]], { k: 4 }), "N");
  assert.equal(codes(r, "block").length, 0, JSON.stringify(r.issues));
  assert.equal(r.pieces.length, 12);
  assert.ok(codes(r, "light").includes("trang-thai-giong"));
  assert.equal(toJson(r).pieces[0].name, "nut_chinh_thuong");
});

test("BOARD chỉ kiểm cỡ", () => {
  assert.equal(analyzeUiSheet(new Img(1024, 1536), { kit, kindId: "BOARD", name: "BOARD" }).level, "pass");
  assert.equal(analyzeUiSheet(new Img(1254, 1254), { kit, kindId: "BOARD", name: "BOARD" }).level, "chặn");
});

test("9-slice kéo giữ nguyên góc; gương cho đối xứng tuyệt đối", () => {
  const m = fakeFrame(40, 30, { t: 3, cap: 6 }), big = nineSliceRender(m, 6, 120, 90);
  assert.deepEqual(big.get(2, 2), m.get(2, 2));
  assert.deepEqual(big.get(117, 87), m.get(37, 27));
  const f = mirrorFold(readUi("hop_thoai"));
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) assert.deepEqual(f.get(x, y), f.get(f.w - 1 - x, y));
});

test("bảng màu: ít màu hơn ngưỡng thì giữ nguyên; nhiều màu thì ≤ ngưỡng và có viền mực", () => {
  const im = readUi("hop_thoai"), pal = buildPalette([im], 64, "#1a1020");
  const q = quantize(im, pal);
  for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3] >= 128) assert.deepEqual([...q.data.slice(i, i + 4)], [...im.data.slice(i, i + 3), 255]);
  const noisy = new Img(32, 32);
  for (let i = 0; i < 1024; i++) noisy.set(i % 32, (i / 32) | 0, [(i * 37) & 255, (i * 91) & 255, (i * 53) & 255, 255]);
  const p2 = buildPalette([noisy], 16, "#1a1020");
  assert.ok(p2.length <= 16);
  assert.ok(p2.some((c) => c[0] === 26 && c[1] === 16 && c[2] === 32));
  assert.equal(areaDown(noisy, 2).w, 16);
});

test("cắt tờ UI-5: 2× + 1×, vạch chung theo bộ, giữ byte khi cắt lại cùng đầu vào", () => {
  const names = ["khung_a", "khung_b", "nut_a", "nut_b", "nut_c", "nut_d"];
  const run = () => cutUiSheet({ img: ui5Sheet(), name: "toF", kindId: "F", kit, names, mirror: false });
  const a = run(), b = run();
  assert.deepEqual([...a.files.keys()], [...b.files.keys()]);
  for (const [k, buf] of a.files) assert.ok(buf.equals(b.files.get(k)), k);
  assert.equal(a.pieces.length, 6);
  const p = a.pieces[2];
  assert.equal(p.key, "ui2_nut_a");
  assert.deepEqual(p.size.x1, [p.size.x2[0] / 2, p.size.x2[1] / 2]);
  assert.deepEqual(p.nine, { x2: 7, x1: 4 });
  assert.equal(p.grid.master, 2);
  assert.ok(a.report.palette <= kit.colors);
  assert.ok(a.pieces.every((x) => x.bytes.x2 > 0 && x.bytes.x1 > 0 && x.hash.length === 16));
});

test("cắt dựng gương: bốn góc đối xứng đúng từng điểm, cắt lại ra đúng byte", () => {
  const cut = cutUiSheet({ img: fSheet({ cap: 8 }), name: "toF", kindId: "F", kit });
  assert.equal(cut.pieces.length, 6);
  assert.ok(cut.pieces.every((p) => p.mirror && p.nine && p.nine.x2 >= 8));
  for (const [k, buf] of cut.files) {
    if (!k.startsWith("2x/")) continue;
    const im = decodePng(buf);
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) assert.deepEqual(im.get(x, y), im.get(im.w - 1 - x, y), k);
  }
  const again = cutUiSheet({ img: fSheet({ cap: 8 }), name: "toF", kindId: "F", kit });
  for (const [k, buf] of cut.files) assert.ok(buf.equals(again.files.get(k)), k);
});

test("tờ có mục chặn thì không cắt; BOARD không cắt", () => {
  assert.throws(() => cutUiSheet({ img: fSheet({ stripes: true }), name: "toF", kindId: "F", kit }), /CHẶN[\s\S]*canh-phang/);
  assert.throws(() => cutUiSheet({ img: new Img(1024, 1536), name: "BOARD", kindId: "BOARD", kit }), /BOARD/);
});

test("manifest: gộp mảnh, trùng khoá khác tờ báo lỗi, vượt ngân sách KB thì không ghi", () => {
  const cut = cutUiSheet({ img: ui5Sheet(), name: "toF", kindId: "F", kit, names: ["a", "b", "c", "d", "e", "f"], mirror: false });
  const merged = mergeIntoKit(kit, cut);
  assert.equal(merged.pieces.length, 6);
  assert.deepEqual(Object.keys(merged.pieces[0]).sort(), ["budget", "bytes", "grid", "hash", "key", "kind", "mirror", "name", "nine", "set", "sheet", "size", "state"]);
  assert.equal(kit.pieces.length, 0, "không đổi kit gốc");
  const other = { ...cut, pieces: cut.pieces.map((p) => ({ ...p, sheet: "toX" })) };
  assert.throws(() => mergeIntoKit(merged, other), /--prefix/);
  assert.throws(() => mergeIntoKit({ ...kit, budget: { kit: 100, icon: 100 } }, cut), /vượt ngân sách/);
  const b = budgetOf(merged);
  assert.equal(b.groups.kit.count, 6);
  assert.deepEqual(b.over, []);
  assert.ok(budgetOf({ ...kit, budget: { kit: 1, icon: 1 } }, merged.pieces).over.length >= 2);
});

test("cắt lại mảnh đã cắt (đã ở lưới master, bảng màu có sẵn) ra đúng byte của chính nó", () => {
  const first = cutUiSheet({ img: fSheet({ cap: 8 }), name: "toF", kindId: "F", kit });
  const pieces = [...first.files].filter(([k]) => k.startsWith("2x/")).map(([, buf]) => decodePng(buf));
  assert.equal(pieces.length, 6);
  const again = cutUiSheet({ img: buildSheet([pieces.slice(0, 3), pieces.slice(3, 6)], { k: 4 }), name: "toF", kindId: "F", kit });
  for (const [k, buf] of first.files) assert.ok(buf.equals(again.files.get(k)), k);
});
