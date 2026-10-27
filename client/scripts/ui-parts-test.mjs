// UI Kit v2, khung màn chuẩn + thành phần nhỏ (uiParts.ts): số / giờ, thẻ trạng thái, công tắc, đồng hồ, khung, và ui2-parts.css chỉ chạy dưới body.ui2 bằng token.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { abbrevNumber, formatCountdown, cardInfo, cardNode, toggleNode, countdownNode, frameNode, toHtml, COUNTDOWN_SOON_MS, CARD_MARK_LABEL } from "../src/uiParts.ts";

// rút gọn số
for (const [n, s] of [[0, "0"], [999, "999"], [1000, "1K"], [1234, "1,2K"], [999_999, "999,9K"], [12_500_000, "12,5M"], [-1500, "-1,5K"], [2_000_000_000, "2B"], [NaN, "0"]]) assert.equal(abbrevNumber(n), s, `abbrevNumber(${n})`);

// đếm ngược
assert.equal(formatCountdown(0), "Đã hết"); assert.equal(formatCountdown(-5), "Đã hết"); assert.equal(formatCountdown(NaN), "Đã hết");
assert.equal(formatCountdown(500), "00:00:01", "còn nửa giây vẫn hiện 1 giây");
assert.equal(formatCountdown(3_723_000), "01:02:03");
assert.equal(formatCountdown(86_400_000 + 3_661_000), "1 ngày 01:01:01");
const now = () => 1_000_000;
assert.match(toHtml(countdownNode({ target: 1_000_000 + 60_000 }, now)), /p2-soon/);
assert.doesNotMatch(toHtml(countdownNode({ target: 1_000_000 + COUNTDOWN_SOON_MS + 1000 }, now)), /p2-soon/);
assert.match(toHtml(countdownNode({ target: 999_000 }, now)), /p2-end/);
assert.match(toHtml(countdownNode({ target: 2_000_000, label: "Mở sau" }, now)), /role="timer"/);

// thẻ
assert.deepEqual(cardInfo({ title: "A" }), { state: null, rank: null, reason: null, limit: null, label: "A" });
assert.equal(cardInfo({ title: "A", state: "lock" }).reason, "Chưa mở", "khoá luôn có lý do");
assert.equal(cardInfo({ title: "A", state: "lock", reason: "Cần cấp 30" }).reason, "Cần cấp 30");
assert.equal(cardInfo({ title: "A", state: "new", reason: "bỏ qua" }).reason, null, "lý do chỉ cho thẻ khoá");
assert.equal(cardInfo({ title: "A", rank: 9 }).rank, 4); assert.equal(cardInfo({ title: "A", rank: -2 }).rank, 0);
assert.equal(cardInfo({ title: "A", state: "up", limit: "3/ngày" }).label, "3/ngày, A, Nâng được");
for (const s of Object.keys(CARD_MARK_LABEL)) assert.match(toHtml(cardNode({ title: "x", state: s, reason: "y" })), new RegExp(`p2-m-${s}`));
const evil = toHtml(cardNode({ title: '<img src=x onerror=alert(1)>', sub: "&" }));
assert.ok(!evil.includes("<img"), "tên không qua innerHTML"); assert.match(evil, /&lt;img/);
assert.equal(cardNode({ title: "x" }, true).tag, "button");
assert.equal(cardNode({ title: "x", state: "lock" }, true).attrs["aria-disabled"], "true");

// công tắc
const sw = toggleNode({ label: "Âm thanh", on: true }).kids[1];
assert.equal(sw.attrs.role, "switch"); assert.equal(sw.attrs["aria-checked"], "true");
assert.equal(toggleNode({ label: "x" }).kids[1].attrs["aria-checked"], "false");
assert.ok("disabled" in toggleNode({ label: "x", disabled: true }).kids[1].attrs);

// khung: huy hiệu + tên + i trái-trên, tiền tệ phải-trên, cột trái, nút chính phải-dưới
const f = frameNode({ title: "Túi", info: "Kéo vật phẩm để dùng", currency: [{ label: "Vàng", value: "1,2K" }], nav: [{ id: "a", label: "Tất cả", active: true }, { id: "b", label: "Hồn hoàn", dot: true }], primary: { label: "Bán", disabled: true, reason: "Chưa chọn vật" } });
const html = toHtml(f);
assert.match(html, /^<section class="p2-man p2-man-muc f2-muc-lon"/);
assert.ok(html.indexOf("p2-badge") < html.indexOf("p2-title") && html.indexOf("p2-title") < html.indexOf("p2-info") && html.indexOf("p2-info") < html.indexOf("p2-cur"), "thứ tự trái → phải");
assert.ok(html.indexOf("p2-hd") < html.indexOf("p2-nav") && html.indexOf("p2-nav") < html.indexOf("p2-body") && html.indexOf("p2-body") < html.indexOf("p2-ft"));
assert.match(html, /aria-current="page"/); assert.match(html, /p2-m-new/);
assert.match(html, /p2-why">Chưa chọn vật<\/span><button class="p2-primary f2-nut-chinh"[^>]*disabled/, "nút khoá vẫn hiện lý do");
assert.equal((html.match(/p2-primary/g) ?? []).length, 1, "một nút chính");
assert.match(toHtml(frameNode({ title: "Thư", material: "giay" })), /f2-giay-lon/);
assert.match(toHtml(frameNode({ title: "Thư" })), /p2-badge" aria-hidden="true">T</);
assert.doesNotMatch(toHtml(frameNode({ title: "Thư" })), /p2-info|p2-primary/);

// CSS: mọi luật dưới body.ui2, màu chỉ qua token, cỡ chữ theo thang
const css = readFileSync(new URL("../src/ui2-parts.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
for (const m of css.matchAll(/(^|\})\s*([^{}@]+)\{/g)) for (const sel of m[2].split(/,(?![^(]*\))/)) assert.ok(sel.trim().startsWith("body.ui2 "), `luật không nằm dưới body.ui2: ${sel.trim()}`);
assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(css), "màu chỉ qua token");
assert.ok(!/font(-size)?\s*:[^;}]*\b(11|13|14|16|18)px/.test(css), "cỡ chữ ngoài thang 10 / 12 / 24");
assert.ok(!/border-image/.test(css), "border-image chỉ ở ui2.css");
for (const m of css.matchAll(/var\(--([a-z0-9-]+)/g)) {
  const v = m[1]; if (/^(p2-|rare-)/.test(v)) continue;
  assert.ok(new RegExp(`--${v}\s*:`).test(readFileSync(new URL("../src/style.css", import.meta.url), "utf8")), `token --${v} chưa khai ở style.css`);
}
assert.ok(existsSync(new URL("../src/ui2-parts.css", import.meta.url)));
console.log("ui-parts: ok");
