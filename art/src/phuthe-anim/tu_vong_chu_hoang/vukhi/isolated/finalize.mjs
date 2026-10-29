// Tái tạo bộ thử từ năm atlas đã lưu: node art/src/phuthe-anim/tu_vong_chu_hoang/vukhi/isolated/finalize.mjs
// Chỉ ghi trong isolated/, không nhập game. Preview ghép theo bước thân ở tâm từng khung vũ khí.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Img, readPng, encodePng } from '../../../../../../tools/assets/lib.mjs';
import { medianCut, nearest } from '../../../../../../tools/assets/beast-sheet-cut.mjs';
import { bodyFrame } from '../../../../../../tools/assets/phuthe-sheet-dummy.mjs';
import { encodeGif } from '../../../../../../tools/assets/beast-sheet-preview.mjs';
import { checkPhuThe, writeReport } from '../../../../../../tools/assets/phuthe-sheet-check.mjs';
import { DIRS, CLIPS, gameAnims, gameRow, bodyTotalMs } from '../../../../../../tools/assets/phuthe-sheet-lib.mjs';

const root = 'art/src/phuthe-anim/tu_vong_chu_hoang/vukhi/isolated', F = 128;
const json = f => JSON.parse(fs.readFileSync(f, 'utf8')), sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const attempt = d => path.join(root, d, d === 'e' ? 'attempt2' : 'attempt1'), composed = d => path.join(attempt(d), 'composed');

const scale = 0.09;
for (const d of DIRS) execFileSync(process.execPath, [path.join(root, 'compose.mjs'), attempt(d), d, String(scale)], { stdio: 'inherit' });
const result = path.join(root, 'result'); fs.mkdirSync(result, { recursive: true });
const halves = { b: new Img(22 * F, 10 * F), f: new Img(22 * F, 10 * F) }, grip = {}, plans = [];
for (const [i, d] of DIRS.entries()) {
  const c = composed(d), p = json(path.join(c, 'compose-plan.json')); plans.push(p);
  for (const h of ['b', 'f']) {
    const im = readPng(path.join(c, `vkanim_tu_vong_chu_hoang_${h}.png`));
    for (const sex of ['m', 'f']) halves[h].blit(im, 0, gameRow(sex, d) * F, 22 * F, F, 0, gameRow(sex, d) * F);
  }
  Object.assign(grip, json(path.join(c, 'manifest-entry.json'))[0].anim.grip);
  const male = checkPhuThe('tu_vong_chu_hoang', { kind: 'vukhi', frame: F, dummyKey:'#30D030', guideKey:'#7A5CFF', gripKey:'#FFE000', dir: c });
  writeReport(male, path.join(c, 'review-m'));
  const femaleDir = fs.mkdtempSync(path.join(os.tmpdir(), `lam-ngan-${d}-female-`));
  fs.copyFileSync(path.join(c, 'female-board.png'), path.join(femaleDir, `to${'ABCDE'[i]}.png`));
  const female = checkPhuThe('tu_vong_chu_hoang', { kind: 'vukhi', frame: F, dummyKey:'#30D030', guideKey:'#7A5CFF', gripKey:'#FFE000', sex: 'f', dir: femaleDir });
  writeReport(female, path.join(c, 'review-f'));
  if (male.level === 'chặn' || female.level === 'chặn') throw Error(`${d}: kiểm có lỗi chặn`);
  const source = { date: '2026-10-30', experiment: 'Vẽ vũ khí riêng + ghép grip', direction: d, attempt: d === 'e' ? 2 : 1, tool: 'Codex / OpenAI image_gen tích hợp', model: null, seed: null, references: [], rawUnmodified: true,
    image: { path: 'poses.raw.png', sha256: sha(path.join(attempt(d), 'poses.raw.png')) }, prompt: { path: 'poses.prompt.txt', sha256: sha(path.join(attempt(d), 'poses.prompt.txt')) },
    compositor: { path: '../../compose.mjs', sha256: sha(path.join(root, 'compose.mjs')) }, gripSource: { path: '../../../../../lam_ngan_thao/vukhi/manifest-entry.json', sha256: sha('art/src/phuthe-anim/lam_ngan_thao/vukhi/manifest-entry.json') },
    layerSource: { path: '../../../lop.json', sha256: sha(path.join(root, '../lop.json')) },
    result: 'composed/compose-plan.json', checks: { male: 'composed/review-m/tu_vong_chu_hoang-check.json', female: 'composed/review-f/tu_vong_chu_hoang-check.json' }, license: 'Đầu ra OpenAI theo điều khoản dịch vụ; không gán CC0. LPC theo giấy phép hiện có.' };
  fs.writeFileSync(path.join(attempt(d), 'poses.source.json'), JSON.stringify(source, null, 2) + '\n');
}
// Một bảng 32 màu chung cho sheet kết quả đủ năm hướng.
const samples = [];
for (const im of Object.values(halves)) for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3]) samples.push([...im.data.slice(i, i + 3)]);
const palette = medianCut(samples, 32);
for (const [h, im] of Object.entries(halves)) {
  for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3]) im.data.set(palette[nearest([...im.data.slice(i, i + 3)], palette)], i);
  fs.writeFileSync(path.join(result, `vkanim_tu_vong_chu_hoang_${h}.png`), encodePng(im));
}
const entries = json(path.join(composed('e'), 'manifest-entry.json')).map(e => { const anim = { ...e.anim, grip }; delete anim.dirsOk; return { ...e, anim }; });
fs.writeFileSync(path.join(result, 'manifest-entry.json'), JSON.stringify(entries, null, 2) + '\n');
const rearFrames = plans.filter(p => ['ne', 'n'].includes(p.dir)).flatMap(p => p.rootDistances.filter(f => !f.frame.includes('/cast/')));
if (rearFrames.length !== 72 || rearFrames.some(f => !f.layerPixels.b)) throw Error('Kiểm lớp quay lưng không đạt');
const report = { frame: F, scale, palette, framesPerSex: 110, totalFrames: 220, maxRootDistance: Math.max(...plans.flatMap(p => p.rootDistances.map(x => x.nearestWeaponPixel))), edgePixels: 0, directions: DIRS, rearNonCastFramesWithBackLayer: rearFrames.length, scripts: { compose: sha(path.join(root, 'compose.mjs')), finalize: sha(path.join(root, 'finalize.mjs')) }, note: 'Kiểm máy và hình học của đầu ra ghép, không coi tờ có nộm là RAW model. Trạng thái nhập và ảnh runtime ở NGUON.md / ingame/index.html.' };
fs.writeFileSync(path.join(result, 'report.json'), JSON.stringify(report, null, 2) + '\n');
const preview = path.join(root, 'preview'); fs.mkdirSync(preview, { recursive: true });
const contact = new Img(5 * F, 6 * F);
for (const sex of ['m', 'f']) for (const clip of CLIPS) for (const d of DIRS) {
  const seq = [], p = plans.find(p => p.dir === d);
  for (const f of p.plan.filter(f => f.sex === sex && f.anim === clip)) {
    const im = new Img(F, F), x = (gameAnims('B')[clip][0] + f.frame) * F, y = gameRow(sex, d) * F;
    im.blit(halves.b, x, y, F, F, 0, 0, true); im.blit(bodyFrame(sex, d, clip, f.step).fig, 0, 0, 64, 64, F / 2 - 32, F / 2 - 32, true); im.blit(halves.f, x, y, F, F, 0, 0, true); seq.push(im);
  }
  fs.writeFileSync(path.join(preview, `${sex}-${clip}-${d}.gif`), encodeGif(seq, Math.round(bodyTotalMs(clip) / seq.length), 3, 0));
  const r = ['idle', 'attack', 'cast'].indexOf(clip);
  if (r >= 0) contact.blit(seq[Math.min(2, seq.length - 1)], 0, 0, F, F, DIRS.indexOf(d) * F, ((sex === 'm' ? 0 : 3) + r) * F, true);
}
fs.writeFileSync(path.join(preview, 'contact.png'), encodePng(contact));
const table = sex => `<h2>LPC ${sex === 'm' ? 'nam' : 'nữ'}</h2><div class="scroll"><table><tr><th>Clip</th>${DIRS.map(d => `<th>${d}</th>`).join('')}</tr>${CLIPS.map(c => `<tr><th>${c}</th>${DIRS.map(d => `<td><img src="preview/${sex}-${c}-${d}.gif" alt="${sex} ${c} ${d}"></td>`).join('')}</tr>`).join('')}</table></div>`;
const rawLinks = DIRS.map(d => `<details><summary>Atlas ${d}: RAW riêng không nộm, prompt, nguồn và kiểm</summary><p><a href="${d}/${d === 'e' ? 'attempt2' : 'attempt1'}/poses.prompt.txt">Prompt</a> · <a href="${d}/${d === 'e' ? 'attempt2' : 'attempt1'}/poses.source.json">Nguồn/hash</a> · <a href="${d}/${d === 'e' ? 'attempt2' : 'attempt1'}/composed/compose-plan.json">Kế hoạch ghép + grip</a> · <a href="${d}/${d === 'e' ? 'attempt2' : 'attempt1'}/composed/review-m/tu_vong_chu_hoang-check.md">Kiểm nam</a> · <a href="${d}/${d === 'e' ? 'attempt2' : 'attempt1'}/composed/review-f/tu_vong_chu_hoang-check.md">Kiểm nữ</a></p><img class="raw" src="${d}/${d === 'e' ? 'attempt2' : 'attempt1'}/poses.raw.png" alt="RAW model ${d}"></details>`).join('');
fs.writeFileSync(path.join(root, 'index.html'), `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Tử Vong Chu Hoàng — vẽ riêng + ghép grip</title><style>body{background:#28232e;color:#eee3d2;font:16px/1.5 system-ui;margin:24px}a{color:#9dd7ff}table{border-collapse:collapse}th,td{border:1px solid #5b5265;padding:5px}td{background:repeating-conic-gradient(#393240 0 25%,#302938 0 50%) 0/16px 16px}td img{width:256px;image-rendering:pixelated}.scroll{overflow:auto}.raw{max-width:100%}summary{cursor:pointer;margin:18px 0}</style><h1>Tử Vong Chu Hoàng: vẽ vũ khí riêng + ghép grip</h1><p><b>Bộ ghép vũ khí Tử Vong Chu Hoàng — PR #1342.</b> <a href="../ingame/index.html">Ảnh kiểm trong game</a>. Năm atlas không nộm, e dùng 2 lượt, bốn hướng còn lại 1 lượt, 6 pose chính. E đạt kiểm máy và ba lỗi mục tiêu trước khi mở rộng. Thân LPC giữ nguyên; gốc bó dây đặt theo anim.grip từng khung. Khung 128, một tỉ lệ chung ${scale.toFixed(5)}, 32 màu chung cho sheet cuối, 220 khung nam/nữ. Không xén để vừa khung.</p><p>Preview lấy bước thân ở tâm từng khung vũ khí (bodyStepOf); chưa chứng nhận tích hợp runtime ở mọi thời điểm. Phần mềm dùng đúng pose đã vẽ, code chỉ xoay/dịch và thu theo một tỉ lệ cố định; không uốn dây bằng code. Mặt nạ đọc từ lop.json: ne/n mặc định sau, vùng cầm trước; cast dùng vùng riêng từng khung, cần duyệt đường chuyển lớp. Độ dài/nét giữa atlas chưa hoàn toàn đồng nhất; cảnh báo nếu có xem trong báo cáo từng hướng.</p><p><a href="../NGUON.md">Nguồn</a> · <a href="result/report.json">Kiểm hình học</a> · <a href="result/manifest-entry.json">Manifest đủ 110 grip</a> · <a href="result/vkanim_tu_vong_chu_hoang_b.png">Sheet sau</a> · <a href="result/vkanim_tu_vong_chu_hoang_f.png">Sheet trước</a> · <a href="compose.mjs">Code ghép</a> · <a href="finalize.mjs">Code tái tạo bộ</a></p>${table('m')}${table('f')}${rawLinks}</html>`);
console.log(report);
