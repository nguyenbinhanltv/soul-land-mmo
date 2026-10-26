import assert from 'node:assert/strict';
import { test } from 'node:test';
import { insideScrollport } from './c16-contrast.mjs';

test('không đo chữ nằm trong viền dưới của panel C2 như chữ đang nhìn thấy', () => {
  const panel = { top: 30, bottom: 358 };
  assert.equal(insideScrollport({ top: 337, bottom: 349 }, panel, 24, 280), false);
});
test('đo được nhãn sau khi cuộn vào phần nội dung', () => {
  assert.equal(insideScrollport({ top: 200, bottom: 212 }, { top: 30, bottom: 358 }, 24, 280), true);
});
test('không đo phần chữ bị cắt ở mép trên scrollport', () => {
  assert.equal(insideScrollport({ top: 50, bottom: 62 }, { top: 30, bottom: 358 }, 24, 280), false);
});
