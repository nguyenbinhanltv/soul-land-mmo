// Thử ui-sheet-check / ui-sheet-cut / ui-kit.json (#879): fixture = 7 mảnh C2 + vài khung UI-5 thật (phóng lên tờ giả), cộng khung tổng hợp có lỗi cố ý.
import test from "node:test";
import assert from "node:assert/strict";
import { Img, decodePng } from "./lib.mjs";
import { loadKit, kindFromName, classifyUiShape, suggestNine, nineSliceRender, mirrorFold, buildPalette, quantize, areaDown, edgeFlatness, defringe, flattenEdges, pinkFringe } from "./ui-kit-lib.mjs";
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

// ---------- Cắt mềm (--soft), --skip, mirror theo mảnh ----------
const INK = [26, 16, 32];
const dirtyInk = { ink: [70, 0, 70] }; // mực viền ám tím-hồng như nền ăn vào (kênh r, b hơn g quá 40)

test("edgeFlatness: hàng thân cạnh trong suốt đồng nhất (ngọc nhô ra, tab hở đáy) không bị tính lệch", () => {
  const body = fakeFrame(60, 44, { cap: 0, round: false }), m = new Img(60, 50);
  m.blit(body, 0, 0, 60, 44, 0, 6); // dải mép bắt đầu ở hàng 6; sáu hàng trên là trong suốt
  assert.ok(edgeFlatness(m, 8, 10) < 0.15, `hàng trong suốt đồng nhất phải phẳng: ${edgeFlatness(m, 8, 10)}`);
  m.set(30, 2, [200, 60, 50, 255]); // điểm đặc lẻ loi trong hàng trong suốt vẫn là lệch
  m.set(31, 2, [200, 60, 50, 255]);
  assert.ok(edgeFlatness(m, 8, 10) > 0, "điểm đặc lẻ loi vẫn bị đếm");
});

test("defringe: mực tối ám hồng về #1a1020, hồng sáng bị bỏ, ruột giữ nguyên, tất định", () => {
  const im = new Img(12, 12);
  for (let y = 1; y < 11; y++) for (let x = 1; x < 11; x++) im.set(x, y, [60, 120, 60, 255]);
  for (let i = 1; i < 11; i++) { im.set(i, 1, [70, 0, 70, 255]); im.set(i, 10, [220, 100, 220, 255]); }
  const a = defringe(im, INK), b = defringe(im, INK);
  assert.deepEqual(a.img.get(5, 1), [...INK, 255]);
  assert.equal(a.img.get(5, 10)[3], 0);
  assert.deepEqual(a.img.get(5, 5), [60, 120, 60, 255]);
  assert.equal(a.left, 0);
  assert.ok(a.recolored >= 10 && a.removed >= 10);
  assert.deepEqual(Buffer.from(a.img.data), Buffer.from(b.img.data));
  assert.equal(pinkFringe(im).pink > 0, true);
});

test("flattenEdges: sọc thân cạnh ép phẳng, hoa văn giữa cạnh và góc giữ nguyên", () => {
  const fr = fakeFrame(60, 44, { stripes: true }), s = 8;
  assert.ok(edgeFlatness(fr, s, 4) > 0.15);
  const fx = flattenEdges(fr, s, 4);
  assert.ok(fx.changed > 0 && edgeFlatness(fx.img, s, 4) <= 0.15, `${edgeFlatness(fx.img, s, 4)}`);
  assert.deepEqual(fx.img.get(2, 2), fr.get(2, 2), "góc không đổi");
  assert.deepEqual(fx.img.get(30, 20), fr.get(30, 20), "ruột không đổi");
});

test("--soft: viền mực ám hồng hạ từ CHẶN xuống nhẹ (đã bù), còn viền hồng sáng dày vẫn CHẶN", () => {
  const dirty = fakeFrame(60, 44, dirtyInk);
  const sheet = buildSheet([[dirty, dirty, dirty], [dirty, dirty, dirty]], { k: 4 });
  const strict = check(sheet), soft = check(sheet, "F", { soft: true });
  assert.ok(codes(strict, "block").includes("vien-hong"), JSON.stringify(strict.issues.map((i) => i.code)));
  assert.ok(!codes(soft, "block").includes("vien-hong"), JSON.stringify(soft.issues));
  const note = soft.issues.find((i) => i.code === "vien-hong");
  assert.equal(note?.sev, "light");
  assert.match(note.msg, /đã bù/);
  assert.ok(soft.soft.fringeBefore > 0.03 && soft.soft.fringeAfter <= 0.01, JSON.stringify(soft.soft));
  const thick = fakeFrame(60, 44, { band: [200, 80, 200], ink: [200, 80, 200], t: 9 });
  const still = check(buildSheet([[thick, thick, thick], [thick, thick, thick]], { k: 4 }), "F", { soft: true });
  assert.ok(codes(still, "block").includes("vien-hong"), "bù không đủ thì vẫn chặn, không che lỗi thật");
});

test("--soft: tờ sạch không đổi kết quả; tờ không bật soft giữ nguyên hành vi cũ", () => {
  const clean = fSheet(), a = check(clean), b = check(clean, "F", { soft: true });
  assert.equal(a.level, "pass");
  assert.equal(b.level, "pass");
  assert.deepEqual(a.pieces.map((p) => Buffer.from(p.master.data).toString("hex")), b.pieces.map((p) => Buffer.from(p.master.data).toString("hex")));
});

test("--skip: bỏ mảnh còn chặn riêng để cắt phần đạt; chặn chung và tên lạ thì từ chối", () => {
  const bad = fakeFrame(60, 44, { stripes: true }), ok = fakeFrame(60, 44);
  const sheet = buildSheet([[bad, ok, ok], [ok, ok, ok]], { k: 4 });
  const r = check(sheet);
  const blocked = r.issues.filter((i) => i.sev === "block").map((i) => i.piece);
  assert.deepEqual(blocked, ["khung_muc_lon"]);
  assert.throws(() => cutUiSheet({ img: sheet, name: "toF", kit }), /CHẶN/);
  const cut = cutUiSheet({ img: sheet, name: "toF", kit, skip: ["khung_muc_lon"] });
  assert.equal(cut.pieces.length, 5);
  assert.ok(!cut.pieces.some((p) => p.name === "khung_muc_lon"));
  assert.deepEqual(cut.report.skipped, ["khung_muc_lon"]);
  assert.throws(() => cutUiSheet({ img: sheet, name: "toF", kit, skip: ["khong_co"] }), /không có mảnh/);
  const dirty = buildSheet([[bad, ok, ok], [ok, ok, ok]], { k: 4, bg: [255, 0, 255, 255], halo: 0 });
  assert.equal(check(dirty).issues.some((i) => i.sev === "block" && !i.piece), false);
});

test("--skip theo tên thật của mảnh: tên ghi đè bằng --names dùng được, tên spec cũ bị từ chối", () => {
  const bad = fakeFrame(60, 44, { stripes: true }), ok = fakeFrame(60, 44);
  const sheet = buildSheet([[bad, ok, ok], [ok, ok, ok]], { k: 4 }), names = ["a1", "a2", "a3", "a4", "a5", "a6"];
  const cut = cutUiSheet({ img: sheet, name: "toF", kit, names, skip: ["a1"] });
  assert.deepEqual(cut.pieces.map((p) => p.name), ["a2", "a3", "a4", "a5", "a6"]);
  assert.throws(() => cutUiSheet({ img: sheet, name: "toF", kit, names, skip: ["khung_muc_lon"] }), /không có mảnh khung_muc_lon/);
});

test("mirror theo mảnh: spec `mirror: false` giữ nguyên hình (tab hở đáy), mảnh khác vẫn dựng gương", () => {
  const k2 = JSON.parse(JSON.stringify(kit));
  k2.kinds.F.pieces[0].mirror = false;
  const f = fakeFrame(60, 44);
  const cut = cutUiSheet({ img: buildSheet([[f, f, f], [f, f, f]], { k: 4 }), name: "toF", kit: k2 });
  assert.equal(cut.pieces[0].mirror, false);
  assert.ok(cut.pieces.slice(1).every((p) => p.mirror === true));
  assert.equal(realKit.kinds.N.pieces.filter((p) => p.mirror === false).map((p) => p.name).join(), "tab_thuong,tab_chon");
});
