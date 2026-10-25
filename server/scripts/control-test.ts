// Kiểm thử thứ tự ưu tiên lệnh điều khiển (M5 #751): phím / cần > bấm nền > khoá mục tiêu > cờ tự đi > tự săn. Hàm thuần, không cần server.
// Chạy: npm run test:control --prefix server
import assert from "node:assert/strict";
import { CMD_ORDER, startCmd, topCmd, stoppedText, deniedText, type Cmd } from "../../shared/control.ts";

function test(title: string, fn: () => void) { fn(); console.log(`✓ ${title}`); }

test("thứ tự ưu tiên đúng như thiết kế", () => assert.deepEqual([...CMD_ORDER], ["keys", "click", "lock", "flag", "hunt"]));
test("phím / cần thắng mọi lệnh đang chạy", () => assert.deepEqual(startCmd(["click", "lock", "flag", "hunt"], "keys"), { cancel: ["click", "lock", "flag", "hunt"] }));
test("bấm nền huỷ khoá, cờ, tự săn", () => assert.deepEqual(startCmd(["lock", "flag", "hunt"], "click"), { cancel: ["lock", "flag", "hunt"] }));
test("bấm hồn thú (khoá) thay điểm bấm cũ, huỷ cờ và tự săn", () => assert.deepEqual(startCmd(["click", "flag"], "lock"), { cancel: ["click", "flag"] }));
test("bấm lại cùng lệnh không tự huỷ chính nó", () => assert.deepEqual(startCmd(["lock"], "lock"), { cancel: [] }));
test("cờ tự đi thắng tự săn", () => assert.deepEqual(startCmd(["hunt"], "flag"), { cancel: ["hunt"] }));
test("cờ tự đi không bật được khi đang khoá / đang đi bấm", () => {
  assert.deepEqual(startCmd(["lock"], "flag"), { cancel: [], deny: "lock" });
  assert.deepEqual(startCmd(["click"], "flag"), { cancel: [], deny: "click" });
});
test("tự săn không bật được khi có lệnh cao hơn; báo lệnh cao nhất", () => {
  assert.deepEqual(startCmd(["flag"], "hunt"), { cancel: [], deny: "flag" });
  assert.deepEqual(startCmd(["lock", "flag"], "hunt"), { cancel: [], deny: "lock" });
  assert.deepEqual(startCmd(["click", "lock"], "hunt"), { cancel: [], deny: "click" });
});
test("không có lệnh nào chạy thì lệnh nào cũng bật được", () => { for (const c of CMD_ORDER) assert.deepEqual(startCmd([], c), { cancel: [] }); });
test("với mọi cặp (đang chạy a, bật b): bên thắng luôn là bên ưu tiên cao hơn, trừ khi b là thao tác bấm / phím", () => {
  for (const a of CMD_ORDER) for (const b of CMD_ORDER) {
    if (a === b) continue;
    const r = startCmd([a], b), rb = CMD_ORDER.indexOf(b), ra = CMD_ORDER.indexOf(a);
    if (rb <= 2) assert.deepEqual(r.cancel, [a], `${b} thắng ${a}`);
    else if (ra < rb) assert.equal(r.deny, a, `${a} chặn ${b}`); else assert.deepEqual(r.cancel, [a], `${b} thắng ${a}`);
  }
});
test("topCmd: lệnh ưu tiên cao nhất đang lái", () => {
  assert.equal(topCmd([]), null);
  assert.equal(topCmd(["hunt", "flag"] as Cmd[]), "flag");
  assert.equal(topCmd(["flag", "lock", "hunt"] as Cmd[]), "lock");
});
test("câu báo lý do có tên lệnh và nguyên nhân", () => {
  assert.match(stoppedText("flag", "lock"), /tự đi cờ.*khoá mục tiêu/);
  assert.match(deniedText("hunt", "lock"), /tự săn.*khoá mục tiêu/);
});
