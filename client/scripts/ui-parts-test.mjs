// UI Kit v2, khung màn chuẩn + thành phần nhỏ (uiParts.ts): số / giờ, thẻ trạng thái, công tắc, đồng hồ, khung, và ui2-parts.css chỉ chạy dưới body.ui2 bằng token.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { abbrevNumber, foldVi, matchQuery, formatCountdown, cardInfo, cardNode, toggleNode, countdownNode, frameNode, toHtml, COUNTDOWN_SOON_MS, CARD_MARK_LABEL, stateNode, STATE_TEXT, selectNode, selectedOption, nextEnabled, qtyNode, clampQty, tabsNode, activeTabId, slotNode, slotInfo } from "../src/uiParts.ts";

// rút gọn số
for (const [n, s] of [[0, "0"], [999, "999"], [1000, "1K"], [1234, "1,2K"], [999_999, "999,9K"], [12_500_000, "12,5M"], [-1500, "-1,5K"], [2_000_000_000, "2B"], [NaN, "0"]]) assert.equal(abbrevNumber(n), s, `abbrevNumber(${n})`);

// tìm / lọc có dấu tiếng Việt
assert.equal(foldVi("Hồi Huyết Đan"), "hoi huyet dan"); assert.equal(foldVi("  Đại   Hồi  "), "dai hoi");
assert.ok(matchQuery("Đại Hồi Huyết Đan", "dai hoi")); assert.ok(matchQuery("Đại Hồi Huyết Đan", "HUYẾT đan")); assert.ok(matchQuery("Hồi Hồn Đan", ""));
assert.ok(!matchQuery("Hồi Hồn Đan", "huyet")); assert.ok(matchQuery("Hồi Hồn Đan", "dan hoi"), "thứ tự từ không quan trọng");

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

// ---- đợt 0b ----
// trạng thái tải / rỗng / lỗi
const stLoad = stateNode({ kind: "loading", rows: 99 });
assert.equal(stLoad.attrs["aria-busy"], "true"); assert.equal(stLoad.kids.length, 12, "bộ xương tối đa 12 dòng"); assert.equal(stateNode({ kind: "loading", rows: 0 }).kids.length, 1);
assert.equal(stLoad.attrs["aria-label"], "Đang tải…", "tải có chữ cho trình đọc màn hình");
const stEmpty = toHtml(stateNode({ kind: "empty", text: "Chưa có hồn cốt", hint: "Săn hồn thú để nhận" }));
assert.match(stEmpty, /Chưa có hồn cốt/); assert.match(stEmpty, /p2-state-h">Săn hồn thú để nhận/); assert.doesNotMatch(stEmpty, /p2-retry/, "rỗng không có nút Thử lại");
const stErr = stateNode({ kind: "error" });
assert.equal(stErr.attrs.role, "alert"); assert.match(toHtml(stErr), /p2-retry[^>]*>Thử lại</); assert.match(toHtml(stErr), /Không tải được/);
assert.match(toHtml(stateNode({ kind: "error", retryLabel: "Tải lại" })), />Tải lại</);
assert.equal(stateNode({ kind: "empty", text: "   " }).kids[0].text, STATE_TEXT.empty, "chữ trống dùng câu mặc định");
assert.match(toHtml(stateNode({ kind: "empty", text: '<b>x</b>' })), /&lt;b&gt;/, "chữ không qua innerHTML");

// hộp xổ
const opts3 = [{ value: "a", label: "Tất cả" }, { value: "b", label: "Hồn hoàn", disabled: true }, { value: "c", label: "Hồn cốt" }];
assert.equal(selectedOption({ options: opts3, value: "c" }).label, "Hồn cốt"); assert.equal(selectedOption({ options: opts3, value: "z" }), null);
assert.equal(nextEnabled(opts3, 0, 1), 2, "bỏ qua mục khoá"); assert.equal(nextEnabled(opts3, 2, -1), 0); assert.equal(nextEnabled(opts3, 2, 1), 2, "hết đường thì giữ nguyên"); assert.equal(nextEnabled(opts3, -1, 1), 0);
const sel = toHtml(selectNode({ label: "Lọc", options: opts3, value: "c" }, "x1"));
assert.match(sel, /aria-haspopup="listbox"[^>]*aria-expanded="false"/); assert.match(sel, /<ul[^>]*role="listbox"[^>]*hidden=""/, "đóng thì danh sách ẩn");
assert.match(sel, /aria-label="Lọc: Hồn cốt"/); assert.match(sel, /aria-selected="true"[^>]*data-v="c"|data-v="c"[^>]*aria-selected="true"/); assert.match(sel, /aria-disabled="true"/);
assert.doesNotMatch(toHtml(selectNode({ label: "Lọc", options: opts3, value: "c", open: true })), / hidden=/);
assert.match(toHtml(selectNode({ label: "Lọc", options: [], placeholder: "Chọn loại" })), /Chọn loại/);
assert.ok("disabled" in selectNode({ label: "L", options: opts3, disabled: true }).kids[0].attrs);

// thanh trượt số lượng
for (const [v, min, max, step, want] of [[5, 1, 10, 1, 5], [0, 1, 10, 1, 1], [99, 1, 10, 1, 10], [NaN, 1, 10, 1, 1], [7, 1, 10, 5, 6], [8, 1, 10, 5, 6], [5, 3, 1, 1, 3], [4.9, 1, 10, 1, 4], [3, 0, 100, 10, 0]]) assert.equal(clampQty(v, min, max, step), want, `clampQty(${v},${min},${max},${step})`);
const q = qtyNode({ label: "Số lượng bán", max: 12, value: 50 }), qh = toHtml(q);
assert.match(qh, /type="range"[^>]*max="12"[^>]*value="12"/, "giá trị ép về max"); assert.match(qh, /p2-qty-v"[^>]*>12\/12</); assert.match(qh, /role="group"/);
assert.ok(!/disabled/.test(qh), "còn khoảng để trượt thì không khoá");
assert.match(toHtml(qtyNode({ label: "x", max: 1 })), /disabled/, "một mức duy nhất: khoá cả thanh");
assert.match(toHtml(qtyNode({ label: "x", max: 0 })), /value="1"/, "max < min giữ min");

// tab
const tb = [{ id: "a", label: "Vật phẩm", icon: "V" }, { id: "b", label: "Hồn hoàn", active: true, dot: true }, { id: "c", label: "Hồn cốt", disabled: true, reason: "Cần cấp 30" }];
assert.equal(activeTabId(tb), "b"); assert.equal(activeTabId([{ id: "c", label: "x", disabled: true }, { id: "d", label: "y" }]), "d", "không có active: mục bấm được đầu"); assert.equal(activeTabId([{ id: "c", label: "x", active: true, disabled: true }]), null);
const th = toHtml(tabsNode({ label: "Túi", tabs: tb }));
assert.match(th, /role="tablist"[^>]*aria-orientation="horizontal"/); assert.equal((th.match(/aria-selected="true"/g) ?? []).length, 1, "đúng một tab chọn");
assert.match(th, /tabindex="0"[^>]*>|tabindex="0"/); assert.match(th, /aria-label="Hồn cốt, Cần cấp 30"/); assert.match(th, /p2-m-new/);
assert.match(toHtml(tabsNode({ label: "Túi", tabs: [{ id: "c", label: "Cốt", disabled: true }] })), /title="Chưa mở"/, "khoá không lý do vẫn nói 'Chưa mở'");
const tv = toHtml(tabsNode({ label: "Cài đặt", tabs: tb, vertical: true }));
assert.match(tv, /aria-orientation="vertical"/); assert.match(tv, /p2-tab-t p2-sr">Vật phẩm/, "tab dọc: chữ chỉ cho trình đọc"); assert.match(tv, /title="Vật phẩm"/, "tab dọc có chú thích khi rê");

// ô vật phẩm
const si = slotInfo({ name: "Hồn hoàn", qty: 1500, state: "up", rank: 9 });
assert.equal(si.qty, "x1,5K"); assert.equal(si.rank, 4); assert.equal(si.label, "Hồn hoàn, số lượng 1500, Nâng được");
assert.equal(slotInfo({ name: "A", qty: 1 }).qty, null, "1 món không hiện số lượng"); assert.equal(slotInfo({ name: "A", qty: 0 }).qty, null);
assert.equal(slotInfo({ name: "A", state: "lock" }).reason, "Chưa mở"); assert.equal(slotInfo({ name: "A", state: "lock", reason: "Cần cấp 30" }).label, "A, Khoá, Cần cấp 30");
assert.equal(slotInfo({ name: "A", empty: true }).label, "Ô trống");
for (const s of ["new", "up", "lock"]) assert.match(toHtml(slotNode({ name: "x", state: s })), new RegExp(`p2-m-${s}`), `nhãn ${s}`);
const sl = slotNode({ name: "Hồn cốt", qty: 3, state: "lock", reason: "Cần cấp 30", rank: 2, selected: true });
assert.equal(sl.tag, "button"); assert.equal(sl.attrs["aria-disabled"], "true"); assert.equal(sl.attrs["aria-pressed"], "true"); assert.equal(sl.attrs.title, "Cần cấp 30"); assert.match(sl.cls, /p2-r2/); assert.match(sl.cls, /f2-o/);
assert.equal(slotNode({ name: "x" }, false).tag, "div"); assert.equal(slotNode({ name: "x", empty: true }).kids.length, 0, "ô trống không có nội dung");
assert.match(toHtml(slotNode({ name: '<img src=x onerror=alert(1)>' })), /&lt;img/, "tên không qua innerHTML");

// CSS: mọi luật dưới body.ui2, màu chỉ qua token, cỡ chữ theo thang
const css = readFileSync(new URL("../src/ui2-parts.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
for (const m of css.matchAll(/(^|\})\s*([^{}@]+)\{/g)) for (const sel of m[2].split(/,(?![^(]*\))/)) assert.ok(/^body.ui2[ .]/.test(sel.trim()), `luật không nằm dưới body.ui2: ${sel.trim()}`);
assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(css), "màu chỉ qua token");
assert.ok(!/font(-size)?\s*:[^;}]*\b(11|13|14|16|18)px/.test(css), "cỡ chữ ngoài thang 10 / 12 / 24");
assert.ok(!/border-image/.test(css), "border-image chỉ ở ui2.css");
for (const m of css.matchAll(/var\(--([a-z0-9-]+)/g)) {
  const v = m[1]; if (/^(p2-|rare-)/.test(v)) continue;
  assert.ok(new RegExp(`--${v}\s*:`).test(readFileSync(new URL("../src/style.css", import.meta.url), "utf8")), `token --${v} chưa khai ở style.css`);
}
assert.ok(existsSync(new URL("../src/ui2-parts.css", import.meta.url)));
console.log("ui-parts: ok");
