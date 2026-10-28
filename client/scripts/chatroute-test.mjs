// Thử phân luồng dòng hệ thống của ô chat (chatRoute.ts, #755): mức quan trọng theo màu / nút (không đọc chữ), gộp lặp, thu lịch sử.
import assert from "node:assert/strict";
import { sysImportant, canMerge, mergedText, trimHist, SYS_MERGE_MS } from "../src/chatRoute.ts";

assert.equal(sysImportant("#ffb35c"), true, "màu cảnh báo = quan trọng");
assert.equal(sysImportant("#FF8A8A"), true, "không phân biệt hoa thường");
assert.equal(sysImportant("#86e0b0"), false, "màu thường (nhận đồ, xong việc) = thường");
assert.equal(sysImportant(undefined), false);
assert.equal(sysImportant("#86e0b0", true), true, "có nút hành động = quan trọng");
// Cùng một chữ nhưng màu khác nhau cho kết quả khác nhau: chứng tỏ không đọc chữ.
assert.notEqual(sysImportant("#ffb35c"), sysImportant("#f2c84b"));

const a = { text: "Nhận 3 Hồn Tệ.", col: "#f2c84b", at: 1000 };
assert.equal(canMerge(a, { ...a, at: 1000 + SYS_MERGE_MS }), true);
assert.equal(canMerge(a, { ...a, at: 1001 + SYS_MERGE_MS }), false, "quá xa thì không gộp");
assert.equal(canMerge(a, { ...a, text: "Khác", at: 1500 }), false);
assert.equal(canMerge(a, { ...a, col: "#ffb35c", at: 1500 }), false);
assert.equal(canMerge(undefined, a), false);
assert.equal(mergedText("Nhặt", 1), "Nhặt");
assert.equal(mergedText("Nhặt", undefined), "Nhặt");
assert.equal(mergedText("Nhặt", 3), "Nhặt ×3");

// Thu lịch sử: dòng thường tối đa keepSys, chat và dòng quan trọng không bị đẩy mất.
const h = [];
for (let i = 0; i < 10; i++) { h.push({ ch: "map", id: `c${i}` }); h.push({ ch: "sys", imp: false, id: `s${i}` }); h.push({ ch: "sys", imp: true, id: `e${i}` }); }
trimHist(h, 100, 4);
assert.equal(h.filter((l) => l.ch === "sys" && !l.imp).length, 4);
assert.equal(h.filter((l) => l.ch === "map").length, 10);
assert.equal(h.filter((l) => l.imp).length, 10);
assert.equal(h.find((l) => l.id === "s9") !== undefined && h.find((l) => l.id === "s0") === undefined, true, "bỏ dòng thường cũ nhất");
trimHist(h, 15, 4);
assert.equal(h.length, 15);
console.log("chatroute-test: đạt");
