// Thử docs-split: tách / ghép lại trùng từng byte (LF và CRLF), đổi đích bằng aliases, thiếu mỏ neo thì báo lỗi.
//   node --test tools/docs-split.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildOutputs, reassemble } from "./docs-split.mjs";

const SRC = [
  "# Tiêu đề", "", "Lời dẫn.", "",
  "## 1. Một", "Nội dung một.", "",
  "## 2. Hai", "**Mục con** (ghi chú)", "chi tiết", "",
  "**Mục con B:** thêm", "",
  "## 3. Ba", "hết", "",
].join("\n");
const MAP = {
  head: "GAME_DESIGN.md",
  files: { "docs/a.md": { title: "A" }, "docs/b.md": { title: "B" }, "docs/c.md": { title: "C" } },
  aliases: {},
  segments: [
    { a: "# Tiêu đề", to: "GAME_DESIGN.md" },
    { a: "## 1. Một", to: "docs/a.md" },
    { a: "## 2. Hai", to: "docs/b.md" },
    { a: "**Mục con B:**", to: "docs/c.md" },
    { a: "## 3. Ba", to: "docs/a.md" },
  ],
};
const roundtrip = (src, map) => {
  const { segs, outs } = buildOutputs(src, map);
  return { outs, text: reassemble(segs, map, (p) => outs.get(p) ?? null).join("") };
};

test("tách rồi ghép lại trùng từng byte (LF)", () => {
  const { outs, text } = roundtrip(SRC, MAP);
  assert.equal(text, SRC);
  assert.ok(outs.get("GAME_DESIGN.md").includes("| 1 | Một | [docs/a.md](docs/a.md) | 5 |"));
});

test("tách rồi ghép lại trùng từng byte (CRLF)", () => {
  const crlf = SRC.replace(/\n/g, "\r\n");
  assert.equal(roundtrip(crlf, MAP).text, crlf);
});

test("aliases gộp file mới vào file cha chỉ bằng sửa JSON", () => {
  const map = { ...MAP, aliases: { "docs/c.md": "docs/b.md" } };
  const { outs, text } = roundtrip(SRC, map);
  assert.equal(text, SRC);
  assert.ok(!outs.has("docs/c.md") && outs.get("docs/b.md").includes("**Mục con B:**"));
});

test("thiếu mỏ neo thì báo lỗi, không tách bừa", () => {
  const map = { ...MAP, segments: [...MAP.segments, { a: "## 9. Không có", to: "docs/a.md" }] };
  assert.throws(() => buildOutputs(SRC, map), /Không tìm thấy 1 mỏ neo/);
});
