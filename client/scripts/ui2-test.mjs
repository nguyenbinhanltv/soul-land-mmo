// UI Kit v2, lớp token (P5 #883): cờ ui2, biến kit theo bản 1× / 2×, kiểm 9-slice (vạch ≤ nửa cạnh, độ dày viền = vạch / hệ số kit),
// ui2.css chỉ đi qua token (không số slice / border-width rải rác) và mọi mảnh helper dùng đều có trong spec kit (ui-kit.json).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { kitClasses, kitName, kitNine, kitPath, kitScale, kitTokens, ui2FromSearch } from "../src/uiKit.ts";

// cờ
assert.equal(ui2FromSearch("?ui=2"), true);
assert.equal(ui2FromSearch("?a=1&ui=2"), true);
assert.equal(ui2FromSearch("?ui=0"), false);
assert.equal(ui2FromSearch(""), null, "không có tham số thì giữ giá trị đã lưu");
assert.equal(ui2FromSearch("?ui=1"), null);

// bản kit theo --u × DPR
assert.equal(kitScale(1, 1), 1); assert.equal(kitScale(1, 2), 2); assert.equal(kitScale(2, 1), 2);
assert.equal(kitScale(1.5, 1), 1); assert.equal(kitScale(1.25, 1), 1); assert.equal(kitScale(1.5, 2), 2);

// khoá → tên
assert.equal(kitName("ui2_khung_muc_lon"), "khung-muc-lon");
assert.equal(kitName("ui_nut_thuong"), null, "mảnh giao diện cũ không thuộc kit");

assert.ok(kitPath("ui2_khung_muc_lon", 2).endsWith("/2x/ui2_khung_muc_lon.png"), "khớp đầu ra ui:cut");
assert.ok(kitPath("ui2_khung_muc_lon", 1).endsWith("/1x/ui2_khung_muc_lon.png"));

// token từ manifest giả
const toUrl = (k, s) => `/k/${s}x/${k}.png`;
const entries = [
  { key: "ui2_khung_muc_lon", iso: true, nine: { x2: 14, x1: 7 } },
  { key: "ui2_icon_01", iso: true, nine: null },
  { key: "ui2_d_01", iso: false, nine: 4 },       // không iso: bỏ
  { key: "ui_nut_thuong", iso: true, nine: 7 },   // ngoài kit: bỏ
];
const t2 = kitTokens(entries, 2, toUrl), t1 = kitTokens(entries, 1, toUrl);
assert.deepEqual(Object.keys(t2).sort(), ["--ui2-icon-01", "--ui2-khung-muc-lon", "--ui2-khung-muc-lon-bw", "--ui2-khung-muc-lon-nine"]);
assert.equal(t2["--ui2-khung-muc-lon"], 'url("/k/2x/ui2_khung_muc_lon.png")');
assert.equal(t2["--ui2-khung-muc-lon-nine"], "14"); assert.equal(t2["--ui2-khung-muc-lon-bw"], "7px");
assert.equal(t1["--ui2-khung-muc-lon-nine"], "7"); assert.equal(t1["--ui2-khung-muc-lon-bw"], "7px");
assert.ok(!("--ui2-icon-01-nine" in t2), "mảnh không kéo giãn không có vạch");
assert.deepEqual(kitClasses(entries), ["ui2-k-khung-muc-lon", "ui2-k-icon-01"]);
assert.deepEqual(kitTokens([], 2), {}, "chưa có mảnh nào thì không đặt biến (giữ giao diện cũ)");

// 9-slice trên manifest thật của kit (rỗng tới khi P4 nhập mảnh; có mảnh thì kiểm thật)
const kit = JSON.parse(readFileSync(new URL("../../art/src/ui-kit/ui-kit.json", import.meta.url), "utf8"));
for (const p of kit.pieces ?? []) {
  if (!p.nine) continue;
  for (const [s, k] of [[2, "x2"], [1, "x1"]]) {
    const [w, h] = p.size[k], n = kitNine({ key: `ui2_${p.name}`, nine: p.nine }, s);
    assert.ok(n > 0 && n * 2 < Math.min(w, h), `${p.name} ${k}: vạch ${n} phải nhỏ hơn nửa cạnh ${w}×${h}`);
    assert.equal(kitTokens([{ key: `ui2_${p.name}`, iso: true, nine: p.nine }], s)[`--ui2-${p.name.replace(/_/g, "-")}-bw`], `${n / s}px`);
  }
  assert.equal(p.nine.x1, Math.ceil(p.nine.x2 / 2), `${p.name}: vạch 1× = ⌈vạch 2× / 2⌉`);
}

// ui2.css: chỉ qua token, không số rải rác; mọi mảnh dùng đều có trong spec
const css = readFileSync(new URL("../src/ui2.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
assert.ok(!/border-image(-slice|-width)?\s*:[^;}]*\b\d/.test(css.replace(/var\([^)]*\)/g, "")), "border-image trong ui2.css chỉ đi qua --frame-*");
assert.ok(!/border-width\s*:\s*\d/.test(css), "border-width trong ui2.css chỉ đi qua --frame-bw");
assert.ok(!/(^|[^-\w])\.(?!f2-)[a-z]/.test(css.replace(/body\.ui2(\.ui2-k-[a-z0-9-]+)*/g, "").replace(/:[a-z-]+(\([^)]*\))?/g, "").replace(/\[[^\]]*\]/g, "").replace(/\.f2-[a-z-]+/g, "").replace(/\{[^}]*\}/g, "")), "helper chỉ chọn lớp f2-*");
const spec = new Set(Object.values(kit.kinds).flatMap((k) => (k.pieces ?? []).map((p) => p.name.replace(/_/g, "-"))));
const used = new Set([...css.matchAll(/--ui2-([a-z0-9-]+?)(?:-nine|-bw)?[,)]/g)].map((m) => m[1]));
assert.ok(used.size > 10);
for (const n of used) assert.ok(spec.has(n), `ui2.css dùng mảnh "${n}" không có trong art/src/ui-kit/ui-kit.json`);
for (const m of css.matchAll(/ui2-k-([a-z0-9-]+)/g)) assert.ok(spec.has(m[1]), `lớp ui2-k-${m[1]} không ứng với mảnh trong spec`);
// khung nào cũng có đủ ba biến (ảnh, vạch, độ dày)
for (const m of css.matchAll(/\{([^}]*--frame-img:var\(--ui2-([a-z0-9-]+)[,)][^}]*)\}/g)) {
  if (!m[1].includes("--frame-nine")) continue; // luật trạng thái chỉ đổi ảnh, dùng chung vạch của trạng thái thường
  assert.ok(m[1].includes(`--ui2-${m[2]}-nine`) && m[1].includes(`--ui2-${m[2]}-bw`), `${m[2]}: thiếu vạch / độ dày`);
}
// luật trạng thái (nút, tab chọn, ô): mọi var(--ui2-…) phải có fallback về trạng thái thường, thiếu mảnh không làm mất khung
for (const m of css.matchAll(/^(body\.ui2 \.f2-(?:nut-chinh|nut-phu|tab|o)[^{]*(?::hover|:active|:disabled|\.sel|\.has|aria-selected|aria-pressed)[^{]*)\{([^}]*)\}/gm)) {
  for (const v of m[2].matchAll(/:var\(--ui2-[a-z0-9-]+(,|\))/g)) assert.equal(v[1], ",", `thiếu fallback ở luật trạng thái: ${m[1]}`);
}
console.log("ui2: ok");
