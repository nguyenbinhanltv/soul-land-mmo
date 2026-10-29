// Thử nghiệm vẽ vũ khí riêng + ghép grip. Chạy từ gốc repo:
// node art/src/phuthe-anim/lam_ngan_thao/vukhi/isolated/compose.mjs <attempt-dir> <s|se|e|ne|n>
// Không nhập shared/assets. RAW model không bị ghi đè; chỉ sinh composed/.
import fs from 'node:fs';
import path from 'node:path';
import { Img, readPng, encodePng } from '../../../../../../tools/assets/lib.mjs';
import { components, medianCut, nearest } from '../../../../../../tools/assets/beast-sheet-cut.mjs';
import { parseLop, layerFn } from '../../../../../../tools/assets/phuthe-sheet-cut-lib.mjs';
import { dummySheet, gripPoints } from '../../../../../../tools/assets/phuthe-sheet-dummy.mjs';
import { sheetCells, bodyStepOf, framesOf, gameAnims, gameRow, frameOrigin } from '../../../../../../tools/assets/phuthe-sheet-lib.mjs';

const [attempt, dir, scaleCap = 'Infinity'] = process.argv.slice(2);
if (!attempt || !['s', 'se', 'e', 'ne', 'n'].includes(dir)) throw Error('Cần thư mục lượt và một hướng hợp lệ');
const raw = readPng(path.join(attempt, 'poses.raw.png')), F = 128, cells = sheetCells('B');
const base = JSON.parse(fs.readFileSync('art/src/phuthe-anim/lam_ngan_thao/vukhi/manifest-entry.json', 'utf8'))[0];
const lop = parseLop(fs.readFileSync('art/src/phuthe-anim/hoa_long/vukhi/lop.json', 'utf8'));
const mask = new Uint8Array(raw.w * raw.h);
const yellow = ([r, g, b]) => r < 110 && g > 150 && b > 170;
for (let i = 0; i < mask.length; i++) {
  const p = raw.get(i % raw.w, Math.floor(i / raw.w));
  mask[i] = p[3] > 127 && Math.hypot(p[0] - 255, p[1], p[2] - 255) > 120 ? 1 : 0;
}
const shapes = components(mask, raw.w, raw.h).filter(c => c.area > 1000);
if (shapes.length !== 6) throw Error(`Cần đúng 6 pose tách rời, thấy ${shapes.length}`);
const poses = Array(6);
for (const c of shapes) {
  const dots = c.px.filter(i => yellow(raw.get(i % raw.w, Math.floor(i / raw.w))));
  if (dots.length < 10) throw Error('Pose thiếu marker gốc dây');
  const root = dots.reduce((s, i) => [s[0] + i % raw.w + 0.5, s[1] + Math.floor(i / raw.w) + 0.5], [0, 0]).map(v => v / dots.length);
  const slot = Math.floor(root[1] / (raw.h / 2)) * 3 + Math.floor(root[0] / (raw.w / 3));
  if (poses[slot]) throw Error('Hai pose cùng một ô gốc');
  const img = new Img(raw.w, raw.h);
  for (const i of c.px) {
    const x = i % raw.w, y = Math.floor(i / raw.w), p = raw.get(x, y);
    // Chỉ trừ marker đăng ký; không cắt theo biên ô tưởng tượng của atlas.
    if (!yellow(p)) img.set(x, y, p);
  }
  poses[slot] = { root, img, box: [c.x0, c.y0, c.x1, c.y1], area: c.area };
}
if (poses.filter(Boolean).length !== 6) throw Error('Thiếu pose theo thứ tự atlas');
const samples = [];
for (const p of poses) for (let y = p.box[1]; y <= p.box[3]; y++) for (let x = p.box[0]; x <= p.box[2]; x++) if (p.img.alpha(x, y)) samples.push(p.img.get(x, y).slice(0, 3));
const palette = medianCut(samples, 32);
for (const p of poses) for (let y = p.box[1]; y <= p.box[3]; y++) for (let x = p.box[0]; x <= p.box[2]; x++) if (p.img.alpha(x, y)) p.img.set(x, y, [...palette[nearest(p.img.get(x, y), palette)], 255]);
const maps = { idle: [0, 0, 0, 0], walk: [0, 0, 0, 0, 0, 0], attack: [0, 1, 2, 3, 2, 0], cast: [4, 4, 5, 5], hurt: [0, 0] };
const angles = { idle: [-2, 0, 2, 0], walk: [-4, 0, 4, 3, 0, -3], attack: [-10, -15, -5, 0, 10, 0], cast: [-5, 0, -5, 5], hurt: [-10, -5] };
const [ox, oy] = frameOrigin(F), plan = [];
for (const sex of ['m', 'f']) for (const c of cells) {
  const name = `${dir}/${c.anim}/${c.frame}`, step = bodyStepOf(c.anim, framesOf('B')[c.anim], c.frame);
  const measured = gripPoints({ sex, dir, clip: c.anim, step, frame: F });
  if (!measured.hands.length) throw Error(`Không đo được grip ${sex}/${name}`);
  const grip = sex === 'm' ? base.anim.grip[name] : measured.hands[0].map((v, i) => v * F / 256 - [ox, oy][i]);
  if (!grip) throw Error(`Thiếu anim.grip ${name}`);
  plan.push({ ...c, name, sex, grip, pose: maps[c.anim][c.frame], angle: angles[c.anim][c.frame] + ({s:45,se:20,e:0,ne:-20,n:-45}[dir]), step });
}
// Một tỉ lệ duy nhất cho toàn bộ pose và cả hai giới. Mọi điểm đều phải nằm trong lề 3px.
let scale = 0.12;
for (const f of plan) {
  const p = poses[f.pose], a = f.angle * Math.PI / 180, co = Math.cos(a), si = Math.sin(a), g = [ox + f.grip[0], oy + f.grip[1]];
  for (let y = p.box[1]; y <= p.box[3]; y++) for (let x = p.box[0]; x <= p.box[2]; x++) if (p.img.alpha(x, y)) {
    const dx = x + 0.5 - p.root[0], dy = y + 0.5 - p.root[1], v = [dx * co - dy * si, dx * si + dy * co];
    for (let k = 0; k < 2; k++) if (Math.abs(v[k]) > 1e-8) scale = Math.min(scale, (v[k] > 0 ? F - 3 - g[k] : g[k] - 3) / Math.abs(v[k]));
  }
}
if (!(scale > 0)) throw Error('Không có tỉ lệ hợp lệ giữ nguyên grip và toàn bộ đầu dây');
scale = Math.min(scale * 0.98, Number(scaleCap));
if (!(scale > 0)) throw Error('Giới hạn tỉ lệ phải dương');
const out = path.join(attempt, 'composed'); fs.mkdirSync(out, { recursive: true });
const halves = { b: new Img(22 * F, 10 * F), f: new Img(22 * F, 10 * F) }, rootDistances = [];
const boards = Object.fromEntries(['m', 'f'].map(sex => [sex, dummySheet({ group: 'B', dir, frame: F, sex, key: '#30D030', guideKey: '#7A5CFF', gripKey: '#FFE000', gripN: 1 }).img]));
for (const f of plan) {
  const p = poses[f.pose], a = f.angle * Math.PI / 180, co = Math.cos(a), si = Math.sin(a), g = [ox + f.grip[0], oy + f.grip[1]], frame = new Img(F, F);
  const chooseLayer = layerFn({ lop, dir, clip: f.anim, frameIdx: f.frame, F, base: new Uint8Array(256 * 256) });
  const layerPixels = { b: 0, f: 0 };
  let near = Infinity, n = 0, edge = 0;
  for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {
    const dx = (x + 0.5 - g[0]) / scale, dy = (y + 0.5 - g[1]) / scale;
    const sx = Math.floor(p.root[0] + co * dx + si * dy), sy = Math.floor(p.root[1] - si * dx + co * dy);
    if (sx < 0 || sy < 0 || sx >= raw.w || sy >= raw.h || !p.img.alpha(sx, sy)) continue;
    const px = p.img.get(sx, sy); frame.set(x, y, px); n++;
    near = Math.min(near, Math.hypot(x + 0.5 - g[0], y + 0.5 - g[1]));
    if (x < 2 || y < 2 || x >= F - 2 || y >= F - 2) edge++;
    // Dùng cùng mặt nạ với cutter: tọa độ vùng tính từ gốc chân, không từ gốc ảnh.
    const side = chooseLayer((x + 0.5) * 256 / F - 0.5, (y + 0.5) * 256 / F - 0.5) === 'sau' ? 'b' : 'f';
    layerPixels[side]++;
    halves[side].set((gameAnims('B')[f.anim][0] + f.frame) * F + x, gameRow(f.sex, dir) * F + y, px);
  }
  if (n < 15 || near > 2 || edge) throw Error(`Khung ${f.sex}/${f.name}: diện tích ${n}, cách grip ${near}, chạm mép ${edge}`);
  if (['ne', 'n'].includes(dir) && f.anim !== 'cast' && !layerPixels.b) throw Error(`Khung quay lưng ${f.sex}/${f.name} không có lớp sau`);
  rootDistances.push({ frame: `${f.sex}/${f.name}`, nearestWeaponPixel: near, edge, pixels: n, layerPixels });
  // Ghép theo pixel art nearest vào nộm gốc, không bao giờ vẽ lại thân bằng model.
  const board = boards[f.sex];
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const px = frame.get(Math.floor(x * F / 256), Math.floor(y * F / 256));
    if (px[3]) board.set(f.col * 256 + x, f.row * 256 + y, px);
  }
}
for (const sex of ['m', 'f']) fs.writeFileSync(path.join(out, sex === 'm' ? `to${{s:'A',se:'B',e:'C',ne:'D',n:'E'}[dir]}.png` : 'female-board.png'), encodePng(boards[sex]));
for (const h of ['b', 'f']) fs.writeFileSync(path.join(out, `vkanim_hoa_long_${h}.png`), encodePng(halves[h]));
const grip = Object.fromEntries(plan.filter(f => f.sex === 'm').map(f => [f.name, f.grip]));
const entries = ['b', 'f'].map(h => ({ ...base, frame: [F, F], key: `vkanim_hoa_long_${h}`, anim: { ...base.anim, origin: [ox, oy], layer: h === 'b' ? 'sau' : 'truoc', dirsOk: [dir], grip } }));
fs.writeFileSync(path.join(out, 'manifest-entry.json'), JSON.stringify(entries, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'compose-plan.json'), JSON.stringify({ dir, F, scale, palette, poses: poses.map(p => ({ root: p.root, box: p.box, area: p.area })), plan, rootDistances, note: 'Tờ có nộm là ảnh ghép code; RAW model là poses.raw.png. Gốc nam dùng anim.grip có sẵn, gốc nữ đo từ LPC; không bù lệch bằng mắt.' }, null, 2) + '\n');
console.log(JSON.stringify({ dir, scale, frames: plan.length, maxRootDistance: Math.max(...rootDistances.map(x => x.nearestWeaponPixel)), edge: 0, out }));
