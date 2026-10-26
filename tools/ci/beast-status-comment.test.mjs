// Thử dựng thân comment sổ trạng thái hồn thú (#973): dấu ẩn, cắt gọn dưới 65536, chỉ nhận comment của bot.
import test from "node:test";
import assert from "node:assert/strict";
import { buildBody, findComment, MARKER, BOT } from "./beast-status-comment.mjs";

test("bảng ngắn: giữ nguyên, bắt đầu bằng dấu ẩn, có link lượt chạy", () => {
  const b = buildBody("# Sổ\n\n| a |\n", { runUrl: "https://x/run/1" });
  assert.ok(b.startsWith(MARKER));
  assert.match(b, /# Sổ/);
  assert.match(b, /\(https:\/\/x\/run\/1\)/);
  assert.doesNotMatch(b, /cắt gọn/);
});

test("bảng quá dài: cắt ở ranh giới dòng, vẫn dưới 65536, ghi rõ đã cắt và trỏ tới bản đầy đủ", () => {
  const md = Array.from({ length: 5000 }, (_, i) => `| dòng ${i} | ${"x".repeat(40)} |`).join("\n");
  const b = buildBody(md, { runUrl: "https://x/run/2" });
  assert.ok(b.length < 65536, String(b.length));
  assert.ok(b.startsWith(MARKER));
  assert.match(b, /đã cắt gọn/);
  assert.match(b, /job summary \/ artifact/);
  const lines = b.split("\n").filter((l) => l.startsWith("| dòng "));
  assert.ok(lines.length > 100 && lines.every((l) => l.endsWith("|")), "không cắt giữa dòng");
});

test("chỉ nhận comment của bot có dấu ẩn ở đầu", () => {
  const cs = [
    { id: 1, user: { login: "tthoadev" }, body: `${MARKER}\ngiả` },
    { id: 2, user: { login: BOT }, body: "không có dấu" },
    { id: 3, user: { login: BOT }, body: `${MARKER}\nthật` },
  ];
  assert.equal(findComment(cs)?.id, 3);
  assert.equal(findComment([]), undefined);
});
