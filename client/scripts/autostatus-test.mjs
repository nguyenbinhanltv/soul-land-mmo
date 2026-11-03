// Chữ trạng thái tự săn (#1713): việc `rest` (chờ nợ nhịp AUTO_PACE / hồi sức) không còn là "Đang nghỉ" (nghe như treo), và không dài hơn dòng dài nhất có sẵn.
import assert from "node:assert/strict";
const { autoStatusText } = await import("../../shared/data.ts");
const rest = autoStatusText({ k: "rest" });
assert.ok(!/nghỉ/i.test(rest) && /nhịp/.test(rest), `chữ việc rest chưa rõ nghĩa: "${rest}"`);
const longest = autoStatusText({ k: "go", n: "Thú vương Kim Cương Hùng", d: 35, w: "loop" });
assert.ok(rest.length <= longest.length, `chữ rest dài ${rest.length} > ${longest.length}`);
console.log("autostatus-test: ok", JSON.stringify(rest));
