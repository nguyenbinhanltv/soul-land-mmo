import assert from "node:assert/strict";
import { fadeDamageText } from "../src/damageTextMotion.ts";

for (const [name, self, crit, plus, delay, duration] of [
  ["bị đánh", true, false, false, 450, 550],
  ["bị chí mạng", true, true, false, 450, 550],
  ["chí mạng", false, true, false, 500, 650],
  ["hồi máu", false, false, true, 600, 700],
  ["khiên", false, false, true, 600, 700],
  ["miễn", false, false, false, 350, 550],
  ["DoT", true, false, false, 450, 550],
  ["DoT mục tiêu", false, false, false, 350, 550],
]) {
  let destroyed = 0;
  const text = { x: 100, y: 200, scaleX: 0.8, scaleY: 0.8, alpha: 1, destroy() { destroyed++; } };
  const calls = [];
  fadeDamageText({ add(config) { calls.push(config); } }, text, self, crit, plus);
  assert.equal(calls.length, 1, name);
  const config = calls[0];
  assert.equal(config.targets, text);
  assert.equal(config.delay, delay, name);
  assert.equal(config.duration, duration, name);
  assert.equal(config.alpha, 0);
  assert.deepEqual(Object.keys(config).sort(), ["targets", "alpha", "delay", "duration", "onComplete", ...(self ? ["ease"] : [])].sort(), `${name}: chỉ mờ, không đổi vị trí / scale / lặp`);
  assert.equal(destroyed, 0, `${name}: còn nguyên trong thời gian đọc`);
  config.onComplete();
  assert.equal(destroyed, 1, `${name}: hủy khi hết tween`);
  assert.deepEqual([text.x, text.y, text.scaleX, text.scaleY, text.alpha], [100, 200, 0.8, 0.8, 1]);
}
console.log("damage-text-motion-test: đạt");
