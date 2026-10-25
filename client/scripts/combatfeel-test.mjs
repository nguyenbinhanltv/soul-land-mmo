import assert from "node:assert/strict";
import { damageTextStyle, footDustCount, HIT_HE_STYLE, rootSnareDiameter, FxGovernor, GOV, FX_DEFAULT_LEVEL, normalizeFxLevel } from "../src/combatFeelRules.ts";

assert.equal(footDustCount("low", false, true), 0);
assert.equal(footDustCount("mid", true, true), 0);
assert.equal(footDustCount("mid", false, true), 3);
assert.equal(footDustCount("mid", false, false), 1);
assert.equal(footDustCount("high", false, true), 5);
assert.notEqual(HIT_HE_STYLE.cuong_cong.shape, HIT_HE_STYLE.man_cong.shape);
assert.notEqual(HIT_HE_STYLE.khong_che.fps, HIT_HE_STYLE.phu_tro.fps);
assert.ok(damageTextStyle("heal", false, undefined).color !== damageTextStyle("damage", false, "fire").color);
assert.ok(damageTextStyle("crit", true, "ice").font > damageTextStyle("damage", false, "ice").font);
assert.equal(damageTextStyle("heal", false, undefined).color, "#7dff8a");
assert.equal(damageTextStyle("shield", false, undefined).color, "#9ad8ff");
assert.equal(damageTextStyle("damage", false, "ice", true).color, "#ff7b72");
assert.equal(damageTextStyle("crit", true, "ice", true).color, "#ff7b72");
assert.equal(damageTextStyle("shield", false, "ice", true).color, "#9ad8ff");
assert.equal(damageTextStyle("damage", false, "fire", false).color, "#ff9a54");
assert.equal(damageTextStyle("crit", true, "ice", false).color, "#ffe14d");
assert.equal(damageTextStyle("damage", false, undefined, false, "#ff7a2a").color, "#ff7a2a");
assert.equal(damageTextStyle("damage", false, undefined, false, "#6ee06a").color, "#6ee06a");
assert.equal(rootSnareDiameter(18, 1, 0.5), 18);
// H8 (#491): bộ điều tốc mức hiệu ứng theo FPS
{
  const run = (g, ms, user, n) => { let ch = 0; for (let t = 0; t < n; t += ms) ch += g.feed(ms, user) ? 1 : 0; return ch; };
  const g = new FxGovernor();
  assert.equal(g.effective("high"), "high");
  run(g, 1000 / 60, "high", 20000);
  assert.equal(g.cap, "high", "60 FPS: không hạ");
  const jitter = (g2, n) => { for (let i = 0; i < n; i++) g2.feed(i % 2 ? 1000 / 60 * 2.8 : 1000 / 60 * 1.2, "high"); };
  const hz30 = new FxGovernor();
  run(hz30, 1000 / 30, "high", 60000);
  assert.equal(hz30.effective("high"), "high", "màn khóa 30 Hz ổn định: giữ nguyên mức, không hạ");
  const slow60 = new FxGovernor();
  run(slow60, 1000 / 60, "high", 2000);
  jitter(slow60, 90);
  assert.equal(slow60.effective("high"), "mid", "30 FPS dao động trên màn 60 Hz: vẫn hạ một bậc");
  const steady30 = new FxGovernor();
  run(steady30, 1000 / 60, "high", 5000);
  run(steady30, 1000 / 30, "high", 3000);
  assert.equal(steady30.effective("high"), "mid", "màn 60 Hz giật đều 30 FPS: hạ một bậc");
  run(steady30, 1000 / 30, "high", 10000);
  assert.equal(steady30.effective("high"), "low", "vẫn giật đều 30 FPS ≥ 10 s: hạ tiếp tới Thấp");
  run(g, 1000 / 20, "high", 2800);
  assert.equal(g.effective("high"), "mid", "20 FPS ổn định: hạ một bậc");
  run(g, 1000 / 20, "high", 8000);
  assert.equal(g.effective("high"), "low", "vẫn chậm: hạ tiếp, sàn là Thấp");
  run(g, 1000 / 20, "high", 8000);
  assert.equal(g.effective("high"), "low", "không hạ dưới Thấp");
  assert.equal(g.effective("low"), "low");
  run(g, 1000 / 60, "high", GOV.RISE_AFTER + 2000);
  assert.equal(g.effective("high"), "mid", "FPS tốt trở lại: nâng một bậc sau độ trễ");
  run(g, 1000 / 60, "high", GOV.RISE_AFTER * 2 + 2000);
  assert.equal(g.effective("high"), "high", "nâng hết về mức người chơi chọn");
  assert.equal(g.effective("mid"), "mid", "không bao giờ nâng quá mức người chơi chọn");
  const h = new FxGovernor();
  run(h, 1000 / 20, "mid", 4000);
  assert.equal(h.effective("mid"), "low", "người chơi chọn Vừa: hạ được về Thấp");
  const s = new FxGovernor();
  for (let i = 0; i < 100; i++) s.feed(GOV.SKIP_MS + 1, "high"); // đổi tab / dừng hình: khung dài bất thường không tính
  assert.equal(s.cap, "high");
  const spike = new FxGovernor();
  for (let i = 0; i < 600; i++) spike.feed(i % 60 === 0 ? 120 : 1000 / 60, "high");
  assert.equal(spike.cap, "high", "thỉnh thoảng một khung chậm không làm hạ mức");
  assert.equal(new FxGovernor().feed(NaN, "high"), false);
}
console.log("combatfeel-test: đạt");

// G8 (#399): mức hiệu ứng mặc định là Vừa; bản lưu hỏng / lạ cũng về Vừa; máy yếu từ mặc định tự hạ xuống Thấp
assert.equal(FX_DEFAULT_LEVEL, "mid");
for (const bad of [undefined, null, "", "max", 2, {}]) assert.equal(normalizeFxLevel(bad), "mid");
for (const ok of ["low", "mid", "high"]) assert.equal(normalizeFxLevel(ok), ok);
{
  const weak = new FxGovernor();
  for (let t = 0; t < 12000; t += 50) weak.feed(50, FX_DEFAULT_LEVEL); // máy yếu: đều 20 FPS
  assert.equal(weak.effective(FX_DEFAULT_LEVEL), "low", "máy yếu bắt đầu từ Vừa thì tự hạ về Thấp");
  const fine = new FxGovernor();
  for (let t = 0; t < 12000; t += 1000 / 60) fine.feed(1000 / 60, FX_DEFAULT_LEVEL);
  assert.equal(fine.effective(FX_DEFAULT_LEVEL), "mid", "máy khỏe giữ nguyên Vừa");
}

// G8 (#399): "Giảm chuyển động" tắt mọi nhịp nhấp nháy vô hạn của giao diện (lớp `reduce-motion` trên <html>, đặt ở combatFx.ts)
{
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");
  const tail = css.slice(css.lastIndexOf("G8 (#399)"));
  const infinite = [...css.matchAll(/([^{}]+)\{[^{}]*animation:[^;}]*infinite[^;}]*[;}]/g)].map((m) => m[1].trim().split(",").map((x) => x.trim())).flat().filter((sel) => !sel.startsWith("#arenaQ .spin") && !sel.startsWith(".alow") && !sel.includes("@"));
  assert.ok(infinite.length >= 8, "tìm được các hoạt ảnh vô hạn của giao diện");
  for (const sel of infinite) assert.ok(tail.includes(`.reduce-motion ${sel}`), `hoạt ảnh vô hạn ${sel} chưa bị tắt khi Giảm chuyển động`);
  assert.ok(readFileSync(new URL("../src/combatFx.ts", import.meta.url), "utf8").includes('classList.toggle("reduce-motion", fxPrefs.reduce)'));
  console.log("combatfeel-test: mặc định Vừa, máy yếu tự hạ, Giảm chuyển động tắt hoạt ảnh vô hạn đạt");
}
