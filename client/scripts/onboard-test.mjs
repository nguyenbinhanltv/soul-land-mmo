// UI v2: làm quen (onboard.ts), chấm ping (pingMeter.ts), mũi tên mục tiêu nhiệm vụ (questArrow.ts): phần thuần + khớp HTML / CSS / phím thật.
// Chạy: node --experimental-strip-types client/scripts/onboard-test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OB_STEPS, parseSaved, obKey } from "../src/onboard.ts";
import { PING_BAD_MS, PING_MARK, PING_STALE_MS, PING_TEXT, PING_WARN_MS, RttMeter, pingLevel, pingText } from "../src/pingMeter.ts";
import { arrowText, inView, pickArrow, rimPoint } from "../src/questArrow.ts";

const src = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const html = readFileSync(new URL("../choi/index.html", import.meta.url), "utf8");

// ---- chuỗi bước ----
assert.ok(OB_STEPS.length >= 6 && OB_STEPS.length <= 8, "6–8 bước");
assert.deepEqual(OB_STEPS.map((s) => s.id).slice(0, 5), ["vohon", "quest", "bag", "ring", "map"], "thứ tự: võ hồn → nhiệm vụ → túi → hồn hoàn → bản đồ");
assert.equal(new Set(OB_STEPS.map((s) => s.id)).size, OB_STEPS.length);
for (const s of OB_STEPS) {
  assert.ok(s.title && s.body && s.target.length, `${s.id}: đủ chữ và nút cần sáng`);
  assert.ok(s.open || s.event || s.tap, `${s.id}: có điều kiện xong`);
  // mọi bộ chọn đầu danh sách là id có thật trong choi/index.html (hoặc do hubMenu / bảng dựng: #bag .buse)
  for (const sel of [...s.target, ...(s.open ?? []), ...(s.tap ? [s.tap] : [])]) {
    const m = /^#([A-Za-z0-9_]+)/.exec(sel); assert.ok(m, `${s.id}: bộ chọn ${sel} phải bắt đầu bằng #id`);
    assert.ok(html.includes(`id="${m[1]}"`) || src("hubMenu.ts").includes(`"${m[1]}"`), `${s.id}: ${sel} không có trong giao diện`);
  }
  assert.ok(s.body.length <= 130, `${s.id}: thẻ ngắn (≤ 130 ký tự), có ${s.body.length}`);
}
// phím nhắc trong chữ phải là phím thật (hub / GameScene): V, B, N, M, Esc
const scene = src("scenes/GameScene.ts");
for (const [step, code] of [["vohon", "KeyV"], ["bag", "KeyB"], ["map", "KeyN"], ["map", "KeyM"]]) assert.ok(scene.includes(`"${code}"`), `${step}: GameScene không xử lý ${code}`);
assert.ok(OB_STEPS.find((s) => s.id === "ring").event === "absorb" && scene.includes('onboardEvent("absorb")'), "bước hồn hoàn nghe sự kiện hấp thụ");

// ---- lưu tiến độ ----
assert.equal(obKey("An"), "soul-onboard-v1:An");
assert.equal(parseSaved(null), null); assert.equal(parseSaved("không phải json"), null); assert.equal(parseSaved('{"st":"lạ"}'), null);
assert.deepEqual(parseSaved('{"s":2,"st":"run"}'), { s: 2, st: "run" });
assert.deepEqual(parseSaved('{"s":99,"st":"run"}'), { s: OB_STEPS.length - 1, st: "run" }, "bước quá lớn thì kẹp lại");
assert.deepEqual(parseSaved('{"s":-4,"st":"skip"}'), { s: 0, st: "skip" });
assert.deepEqual(parseSaved('{"s":1.5,"st":"done"}'), { s: 0, st: "done" });

// ---- ping ----
assert.equal(pingLevel(null), "none"); assert.equal(pingLevel(NaN), "none");
assert.equal(pingLevel(PING_WARN_MS - 1), "good"); assert.equal(pingLevel(PING_WARN_MS), "warn");
assert.equal(pingLevel(PING_BAD_MS - 1), "warn"); assert.equal(pingLevel(PING_BAD_MS), "bad");
assert.equal(new Set(Object.values(PING_MARK)).size, 4, "mỗi mức một hình riêng (mù màu)");
assert.equal(new Set(Object.values(PING_TEXT)).size, 4, "mỗi mức một chữ riêng");
assert.equal(pingText(45), "Tốt 45 ms"); assert.equal(pingText(null), "Chưa đo"); assert.equal(pingText(45, false), "Mất kết nối");
{
  const m = new RttMeter();
  assert.equal(m.value(0), null);
  m.sent(1, 1000); m.sent(2, 1100);
  assert.equal(m.acked(2, 1180), true, "mẫu từ đúng input được báo");
  assert.equal(m.value(1200), 80, "mẫu đầu tiên = RTT");
  assert.equal(m.acked(1, 1300), false, "input cũ hơn đã bị bỏ, không thành mẫu");
  m.sent(3, 2000); m.acked(3, 2100);
  assert.ok(Math.abs(m.value(2100) - (80 * 0.6 + 100 * 0.4)) < 1e-9, "làm mượt EMA");
  assert.equal(m.value(2100 + PING_STALE_MS + 1), null, "mẫu cũ thì Chưa đo");
  m.sent(9, 5000); assert.equal(m.acked(8, 5100), false, "số chưa gửi không thành mẫu");
  m.reset(); assert.equal(m.value(2100), null);
  for (let i = 0; i < 100; i++) m.sent(i, i); assert.equal(m.acked(0, 500), false, "hàng chờ bị cắt: input quá cũ không còn");
}

// ---- mũi tên mục tiêu ----
const V = { x: 0, y: 0, w: 640, h: 360 };
assert.equal(inView({ x: 320, y: 180 }, V), true); assert.equal(inView({ x: 700, y: 180 }, V), false); assert.equal(inView({ x: 638, y: 180 }, V), false, "sát mép coi như ngoài");
const near = (a, b) => Math.abs(a - b) < 1e-9;
let r = rimPoint(10, 0); assert.ok(near(r.x, 1) && near(r.y, 0.5) && near(r.deg, 90), "phải");
r = rimPoint(0, -3); assert.ok(near(r.x, 0.5) && near(r.y, 0) && near(r.deg, 0), "lên");
r = rimPoint(-5, 0); assert.ok(near(r.x, 0) && near(r.deg, 270), "trái");
r = rimPoint(0, 4); assert.ok(near(r.y, 1) && near(r.deg, 180), "xuống");
r = rimPoint(7, -7); assert.ok(near(r.x, 1) && near(r.y, 0) && near(r.deg, 45), "góc trên phải");
r = rimPoint(0, 0); assert.deepEqual(r, { x: 0.5, y: 0, deg: 0 }, "không hướng thì chỉ lên, không NaN");
r = rimPoint(Infinity, 3); assert.ok(Number.isFinite(r.x) && Number.isFinite(r.y));
const P = (x, y, tiles, label = "NPC") => ({ x, y, tiles, label });
assert.equal(pickArrow([], V), null);
assert.equal(pickArrow([P(320, 180, 3)], V), null, "mục tiêu đang trong màn thì không có mũi tên");
assert.equal(pickArrow([P(320, 180, 3), P(2000, 180, 40)], V), null, "một mục tiêu trong màn là đủ");
const a = pickArrow([P(2000, 180, 40, "Xa"), P(900, 180, 12, "Gần")], V);
assert.equal(a.label, "Gần", "chọn mục tiêu gần nhất"); assert.ok(near(a.x, 1) && near(a.deg, 90));
assert.equal(arrowText({ label: "Cổng", tiles: 23.6 }), "Cổng · 24 ô"); assert.equal(arrowText({ label: "NPC", tiles: 0.2 }), "NPC · 1 ô");

// ---- CSS ----
const css = src("ui2-onboard.css").replace(/\/\*[\s\S]*?\*\//g, "");
for (const rule of css.split("}").map((s) => s.trim()).filter((s) => s && !s.startsWith("@") && !s.startsWith("50%"))) {
  const sel = rule.split("{")[0]; if (!sel || /^\s*(50%|to|from)/.test(sel)) continue;
  assert.ok(!/body\.ui2(?![\w-])/.test(sel), `đợt 5c-b: không còn tiền tố body.ui2: ${sel.slice(0, 60)}`);
}
assert.ok(/prefers-reduced-motion:reduce/.test(css) && /reduce-motion/.test(css), "giảm chuyển động: cả media query lẫn lớp");
assert.ok(/min-height:44px/.test(css), "nút thẻ ≥ 44 px");
assert.ok(!/font(-size)?:[^;]*\b\d+px/.test(css.replace(/var\([^)]*\)/g, "")), "cỡ chữ chỉ qua token --fs-*");
assert.ok(src("main.ts").includes('import "./ui2-onboard.css"'));
// đợt 5c: đã gỡ cờ ui2, các tệp này không còn đọc isUi2
for (const f of ["onboard.ts", "pingMeter.ts", "questArrow.ts"]) assert.ok(!src(f).includes("isUi2"), `${f}: không còn nhánh theo cờ`);
console.log("onboard: ok");

// Vòng đời DOM: xem lại không ghi tiến độ, gắn lại cùng tên giữ bước, đổi tên dừng lần xem cũ.
{
  const { onboardAttach, onboardBegin, onboardReview, onboardActive, onboardQuestLink } = await import('../src/onboard.ts');
  const values = new Map(), elements = new Map();
  class El {
    hidden = true; isConnected = true; dataset = {}; style = {}; textContent = ''; listeners = new Map(); children = new Map();
    set innerHTML(_) { for (const s of ['.ob-quest', '.ob-skip', '.ob-next', '.ob-head b', '.ob-dots', 'h4', 'p']) this.children.set(s, new El()); }
    querySelector(s) { return this.children.get(s) ?? null; }
    setAttribute() {} appendChild(e) { elements.set(e.id, e); } remove() { this.isConnected = false; }
    addEventListener(s, f) { this.listeners.set(s, f); } removeEventListener(s) { this.listeners.delete(s); }
    getClientRects() { return []; } blur() {} focus() {}
    click(s) { const e = this.children.get(s); e.listeners.get('click')({ currentTarget: e }); }
  }
  const hud = new El(); elements.set('hud', hud);
  globalThis.document = { createElement: () => new El(), getElementById: (id) => elements.get(id), querySelector: () => null, body: hud };
  globalThis.localStorage = { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
  globalThis.window = { setInterval: () => 1, clearInterval() {}, setTimeout: () => 1 };
  for (const st of ['skip', 'done', 'run']) {
    const name = `Thu ${st}`, raw = JSON.stringify({ s: 3, st }); values.set(obKey(name), raw);
    onboardAttach(name); onboardReview();
    const card = elements.get('onboard');
    assert.match(card.children.get('.ob-head b').textContent, /bước 1\/6/);
    card.click('.ob-next'); onboardAttach(name);
    assert.match(card.children.get('.ob-head b').textContent, /bước 2\/6/, 'đổi bản đồ giữ bước xem lại');
    card.click('.ob-skip');
    assert.equal(values.get(obKey(name)), raw, 'Bỏ qua xem lại giữ bản ghi');
    assert.equal(onboardActive(), st === 'run');
    if (st === 'run') assert.match(card.children.get('.ob-head b').textContent, /bước 4\/6/);
    onboardReview();
    for (let i = 0; i < 6; i++) card.click('.ob-next');
    assert.equal(values.get(obKey(name)), raw, 'Xong xem lại giữ bản ghi');
  }
  onboardAttach('Cu'); assert.equal(onboardActive(), false, 'tài khoản cũ không tự hiện');
  onboardReview(); onboardAttach('Moi'); assert.equal(onboardActive(), false, 'đổi hồn sư dừng xem lại');
  onboardBegin(); assert.equal(parseSaved(values.get(obKey('Moi'))).st, 'run');
  elements.get('onboard').click('.ob-skip');
  assert.equal(parseSaved(values.get(obKey('Moi'))).st, 'skip');
  let opened = 0;
  const ac = new AbortController();
  onboardQuestLink(() => opened++, ac.signal);
  onboardAttach('Lan dau'); onboardBegin();
  const card = elements.get('onboard');
  assert.equal(card.children.get('.ob-quest').hidden, true, 'CTA chỉ ở thẻ xong');
  for (let i = 0; i < 6; i++) card.click('.ob-next');
  assert.equal(card.dataset.mode, 'done');
  assert.equal(card.children.get('.ob-quest').hidden, false);
  let blocked = false;
  card.listeners.get('keydown')({ code: 'KeyW', stopPropagation: () => { blocked = true; } });
  assert.equal(blocked, false, 'phím di chuyển vẫn tới cảnh');
  card.listeners.get('keydown')({ code: 'Enter', stopPropagation: () => { blocked = true; } });
  assert.equal(blocked, true, 'Enter thuộc nút đang chọn');
  const done = values.get(obKey('Lan dau'));
  assert.equal(parseSaved(done).st, 'done');
  card.click('.ob-quest');
  assert.equal(opened, 1); assert.equal(card.hidden, true);
  assert.equal(values.get(obKey('Lan dau')), done, 'CTA không sửa tiến độ Làm quen');
  onboardAttach('Lan dau'); onboardBegin();
  assert.equal(card.hidden, true, 'không spam lại thẻ xong');
  onboardReview();
  for (let i = 0; i < 6; i++) card.click('.ob-next');
  assert.equal(card.hidden, true, 'xem lại không mở thẻ xong hoặc nhiệm vụ');
  assert.equal(opened, 1);
  ac.abort();
  onboardAttach('Canh moi'); onboardBegin();
  for (let i = 0; i < 6; i++) card.click('.ob-next');
  card.click('.ob-quest'); assert.equal(opened, 1, 'không gọi cảnh đã hủy');
  blocked = false;
  card.listeners.get('keydown')({ code: 'Escape', stopPropagation: () => { blocked = true; } });
  assert.equal(blocked, false, 'Esc vẫn tới cảnh');
  assert.equal(card.hidden, true, 'Esc đóng thẻ xong');
  console.log('onboard: vòng đời run/skip/done/review và đổi hồn sư đạt');
}
