// Chú thích vật phẩm UI v2 (itemTip.ts): dùng / nguồn / giá / khoá, phần Shift (so sánh + món đang mặc), ô tìm lọc không dấu, ui2-tooltip.css chỉ dưới body.ui2.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { itemInfoLines, lockLines, priceLines, shiftPart, wornSideSpec, SHIFT_HINT, ITEM_USE, ITEM_SOURCE } from "../src/itemTip.ts";
import { filterByQuery, searchField } from "../src/uiParts.ts";
import { ITEM_KINDS, ITEMS, SHOP, formatHonTe, sellPrice } from "../../shared/data.ts";

const bag = (o) => ({ id: "i1", code: "hoi_huyet_dan", qty: 1, years: null, stars: null, enhance: 0, stats: "", lock: false, vohon: null, ...o });
const txt = (l) => (typeof l === "string" ? l : `${l.k ?? ""}|${l.v}`);

// mọi loại đều có câu "dùng để làm gì"; nguồn chỉ cho loại có nguồn rơi cố định
for (const k of Object.keys(ITEM_KINDS)) assert.ok(ITEM_USE[k], `thiếu câu dùng cho loại ${k}`);
for (const k of Object.keys(ITEM_SOURCE)) assert.ok(ITEM_KINDS[k], `nguồn cho loại không có: ${k}`);

// giá: món cửa hàng bán có "Mua ở thương nhân" đúng giá SHOP; món không thu mua ghi rõ
const sold = SHOP[0], pl = priceLines(bag({ code: sold.code })).map(txt);
assert.ok(pl.some((l) => l === `Mua ở thương nhân|${formatHonTe(sold.price)}`), "giá mua đúng SHOP");
assert.ok(pl.some((l) => l.startsWith("Bán")), "luôn có dòng bán / không thu mua");
const ring = ITEMS.find((i) => i.kind === "hon_hoan"); const rb = bag({ code: ring.id, years: 1000 });
if (sellPrice(rb) !== null) assert.ok(priceLines(rb).map(txt).includes(`Bán được|${formatHonTe(sellPrice(rb))}`));

// khoá / ràng buộc luôn nói lý do
assert.deepEqual(lockLines({ lock: false, vohon: null }), []);
assert.match(txt(lockLines({ lock: true, vohon: null })[0]), /^Khoá\|.*(bán|phân giải)/);
assert.match(txt(lockLines({ lock: false, vohon: 2 })[0]), /^Ràng buộc\|.*gắn/);
assert.match(itemInfoLines(bag({ lock: true })).map(txt).join("\n"), /Khoá\|/);
assert.match(itemInfoLines(bag()).map(txt)[0], /^\|Dùng: /);

// phần Shift: không có dòng so sánh thì không có phần Shift; có thì kèm gợi ý, và cột đang mặc khi có món
assert.equal(shiftPart(null, null, null, ""), undefined); assert.equal(shiftPart([], null, null, ""), undefined);
const cmp = [{ v: "So với đang gắn: A", tone: "muted" }, { k: "Sinh lực", v: "10 → 12  ▲ +2", tone: "good" }];
const a = shiftPart(cmp, null, null, "");
assert.equal(a.hint, SHIFT_HINT); assert.equal(a.beside, undefined); assert.deepEqual(a.lines, cmp);
const b = shiftPart(cmp, bag({ code: "hoi_huyet_dan", enhance: 3 }), "Món A", "#fff");
assert.equal(b.beside.title, "Món A"); assert.match(b.beside.sub, /^Đang mặc/); assert.deepEqual(b.beside.lines[0], { k: "Cường hóa", v: "+3", tone: "good" });
assert.equal(wornSideSpec(bag(), "X", "#000").lines.length, 0, "món không có chỉ số: không dòng thừa");

// ô tìm lọc không dấu, giữ thứ tự, cắt theo max
const names = ["Hồi Huyết Đan", "Hồi Hồn Đan", "Đại Hồi Đan", "Phù Hồi Thành"];
assert.deepEqual(filterByQuery(names, (n) => n, "hoi dan"), ["Hồi Huyết Đan", "Hồi Hồn Đan", "Đại Hồi Đan"]);
assert.deepEqual(filterByQuery(names, (n) => n, "HỒI huyết"), ["Hồi Huyết Đan"]);
assert.equal(filterByQuery(names, (n) => n, "", 2).length, 2); assert.equal(filterByQuery(names, (n) => n, "xyz").length, 0);

// CSS: mọi luật dưới body.ui2, màu qua token, cỡ chữ theo thang
const css = readFileSync(new URL("../src/ui2-tooltip.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
for (const m of css.matchAll(/(^|\})\s*([^{}@]+)\{/g)) for (const sel of m[2].split(/,(?![^(]*\))/)) assert.ok(/^body.ui2[ .]/.test(sel.trim()), `luật không nằm dưới body.ui2: ${sel.trim()}`);
assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(css), "màu chỉ qua token");
assert.ok(!/font(-size)?\s*:[^;}]*\b\d+px/.test(css), "cỡ chữ chỉ qua --fs-*");
console.log("item-tip: ok");

// searchField: đang dựng chữ (composition) không báo onInput, xong (compositionend) mới báo một lần
{
  const mk = () => { const ls = {}; return { style: {}, classList: { add() {} }, addEventListener: (t, f) => { ls[t] = f; }, setAttribute() {}, append() {}, ls }; };
  const input = mk(); globalThis.document = { createElement: (t) => (t === "input" ? input : mk()) };
  const got = []; searchField({ label: "x", onInput: (q) => got.push(q) });
  input.value = "tr"; input.ls.input({ isComposing: true }); assert.deepEqual(got, [], "đang composition thì bỏ qua");
  input.value = "trà"; input.ls.compositionend(); assert.deepEqual(got, ["trà"]);
  input.ls.input({ isComposing: false }); assert.deepEqual(got, ["trà", "trà"], "gõ thường vẫn báo");
  delete globalThis.document;
}
