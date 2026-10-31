// Đệm lề nguyên cụm, không co giãn/vẽ thêm; chạy từ gốc repo.
// node art/src/phap-tuong/tu_vong_chu_hoang/padding-s.mjs <thư-mục-ra>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { Img, decodePng, encodePng } from '../../../../tools/assets/lib.mjs';
import { backgroundMask } from '../../../../tools/assets/phaptuong-sheet-cut.mjs';
const src = 'art/src/phap-tuong/tu_vong_chu_hoang';
const out = process.argv[2];
if (!out) throw new Error('Cần thư mục đầu ra trung gian');
mkdirSync(out, { recursive: true });
const raw = readFileSync(path.join(src, 's.png')), im = decodePng(raw);
const mask = backgroundMask(im, { despill: false });
const seen = new Uint8Array(mask.length), parts = [];
for (let i = 0; i < mask.length; i++) {
  if (mask[i] || seen[i]) continue;
  const points = [i]; seen[i] = 1;
  let l = im.w, r = 0, t = im.h, b = 0;
  for (let k = 0; k < points.length; k++) {
    const p = points[k], x = p % im.w, y = Math.floor(p / im.w);
    l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy, n = Y * im.w + X;
      if (X >= 0 && X < im.w && Y >= 0 && Y < im.h && !mask[n] && !seen[n]) {
        seen[n] = 1; points.push(n);
      }
    }
  }
  parts.push({ points, l, r, t, b });
}
const bodies = parts.filter(p => p.points.length > 100);
if (bodies.length !== 16) throw new Error('Cần đúng 16 cụm hình lớn tách rời');
const cell = 384, pad = 32, sourceCell = im.w / 4;
const used = new Set();
for (const p of bodies) {
  p.col = Math.floor((p.l + p.r) / 2 / sourceCell);
  p.row = Math.floor((p.t + p.b) / 2 / sourceCell);
  const id = p.row * 4 + p.col;
  if (used.has(id) || p.l === 0 || p.r === im.w - 1 || p.t === 0 || p.b === im.h - 1) throw new Error('Cụm bị cắt hoặc trùng ô');
  used.add(id);
}
const dest = new Img(cell * 4, cell * 4);
for (let y = 0; y < dest.h; y++) for (let x = 0; x < dest.w; x++) dest.set(x, y, [255, 0, 255, 255]);
const occupied = new Uint8Array(dest.w * dest.h);
let moved = 0;
for (const p of parts) {
  const distance = q => Math.max(q.l - p.r, p.l - q.r, 0) ** 2 + Math.max(q.t - p.b, p.t - q.b, 0) ** 2;
  const body = p.points.length > 100 ? p : [...bodies].sort((a, b) => distance(a) - distance(b))[0];
  const dx = body.col * cell + pad - Math.round(body.col * sourceCell);
  const dy = body.row * cell + pad - Math.round(body.row * sourceCell);
  for (const pos of p.points) {
    const x = pos % im.w, y = Math.floor(pos / im.w), X = x + dx, Y = y + dy;
    if (X < body.col * cell + 4 || X >= (body.col + 1) * cell - 4 || Y < body.row * cell + 4 || Y >= (body.row + 1) * cell - 4) throw new Error('Điểm hình vượt ô đệm');
    const n = Y * dest.w + X;
    if (occupied[n]) throw new Error('Dịch gây chồng điểm hình');
    occupied[n] = 1; dest.set(X, Y, im.get(x, y)); moved++;
  }
}
const expected = mask.reduce((n, bg) => n + !bg, 0);
if (moved !== expected) throw new Error('Mất điểm hình');
const png = encodePng(dest);
writeFileSync(path.join(out, 's.png'), png);
for (const dir of ['se', 'e', 'ne', 'n']) copyFileSync(path.join(src, dir + '.png'), path.join(out, dir + '.png'));
const sha = b => createHash('sha256').update(b).digest('hex');
const report = { raw: { size: [im.w, im.h], sha256: sha(raw) }, intermediate: { size: [dest.w, dest.h], sha256: sha(png) }, cell, pad, components: bodies.length, foregroundPixels: expected, preservedPixels: moved, scaling: false, drawing: false };
writeFileSync(path.join(out, 'padding-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
