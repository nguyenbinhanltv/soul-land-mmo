// Dựng hình nộm LPC tham chiếu cho tờ vẽ phụ thể v2 (#1022; đặc tả docs/art/phu-the-hoat-anh.md, mục "Hình nộm LPC tham chiếu").
//   node tools/assets/phuthe-sheet-dummy.mjs --id ta_hoa_phuong_hoang --out <thư mục> [--frame 96|128] [--dummy-key #00D0D0] [--guide-key #7A5CFF] [--no-guides] [--sex m|f]
// Ghi `<id>-nom-turnaround.png` và `<id>-nom-toA..E.png`: nền #FF00FF, mỗi ô có hình thân hồn sư (m_0 / f_0, tô MỘT màu khóa phẳng, không viền,
// không sáng tối) đúng khung thân mà bảng ánh xạ của đặc tả chỉ cho khung đó, đặt ở gốc chân của khung phụ thể (96: (48, 74), 128: (64, 90))
// phóng cùng hệ số với ô vẽ (256 / khung). Đây là ảnh tham chiếu đính kèm khi sinh ảnh; nộm KHÔNG vào game.
// Dùng lại trong cutter: `dummyCell` cho mặt nạ nộm danh nghĩa của từng ô (đăng ký vị trí nộm đã bị model dời), `bodyAnchors` cho neo từng giới.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Img, readPng, encodePng, hex, paletteGroup, frameAnchors, ROOT } from "./lib.mjs";
import {
  LPC_SHEET, DIRS, BG_KEY, CELL, SHEET_W, SHEET_H, TURNAROUND, TURNAROUND_STEP,
  framesOf, sheetCells, bodyStepOf, bodyRowKey, bodyColOf, bodyOffset, frameOrigin, checkFrame, phutheInfo, dummyKeyOf, guideKeyOf, SHEET_ID, allPhutheIds,
} from "./phuthe-sheet-lib.mjs";

const PARTS = path.join(ROOT, "shared", "assets", "lpcparts");
const B = LPC_SHEET.frame; // 64
/** Ngoại hình mẫu (như lpc-mannequin.mjs): áo ngắn tay, quần dài, giày ống, tóc ngắn (m) / dài (f); lớp theo (tên tệp không đuôi giới, z). */
const SETS = {
  m: { skin: [["body_body", 10], ["head_male", 100]], cover: [["legs_pants", 20], ["feet_boots_basic", 25], ["torso_shortsleeve", 35], ["hair_plain", 120]] },
  f: { skin: [["body_body", 10], ["head_female", 100]], cover: [["legs_pants", 20], ["feet_boots_basic", 25], ["torso_shortsleeve", 35], ["hair_long_straight", 120]] },
};
const cache = new Map();
function layers(sex) {
  if (!cache.has(sex)) {
    const load = ([n, z]) => {
      const f = path.join(PARTS, `lpcp_${n}_${sex}_${z}.png`);
      if (!existsSync(f)) throw new Error(`thiếu lớp thân LPC ${path.relative(ROOT, f)}`);
      return { z, img: readPng(f), skin: SETS[sex].skin.some(([m]) => m === n) };
    };
    cache.set(sex, [...SETS[sex].skin, ...SETS[sex].cover].map(load).sort((a, b) => a.z - b.z));
  }
  return cache.get(sex);
}
const SKIN = () => hex(paletteGroup("Da ")[1]);

/** Khung thân 64×64 của (giới, hướng, clip, bước thân): { fig: thân + áo + tóc đủ màu, skin: chỉ phần da lộ ra (cho frameAnchors) }. */
export function bodyFrame(sex, dir, clip, step) {
  const row = LPC_SHEET.rows[bodyRowKey(clip, dir)], col = bodyColOf(clip, step), fig = new Img(B, B), skin = new Img(B, B), cover = new Img(B, B), sk = SKIN();
  for (const L of layers(sex)) {
    fig.blit(L.img, col * B, row * B, B, B, 0, 0, true);
    if (L.skin) { const t = new Img(B, B); t.blit(L.img, col * B, row * B, B, B, 0, 0, true); for (let i = 0; i < t.data.length; i += 4) if (t.data[i + 3]) { t.data[i] = sk[0]; t.data[i + 1] = sk[1]; t.data[i + 2] = sk[2]; } skin.blit(t, 0, 0, B, B, 0, 0, true); }
    else cover.blit(L.img, col * B, row * B, B, B, 0, 0, true);
  }
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) if (cover.alpha(x, y)) skin.data[(y * B + x) * 4 + 3] = 0; // da dưới áo / tóc / giày bỏ đi, như lpc-mannequin
  return { fig, skin };
}
/** Điểm neo (frameAnchors: đầu, lưng, chân, tay) của khung thân; dùng dời neo theo giới ở cutter. */
export function bodyAnchors(sex, dir, clip, step) {
  const { fig, skin } = bodyFrame(sex, dir, clip, step);
  return frameAnchors(fig, 0, 0, B, B, skin);
}

/** Hình đặc của khung thân: điểm đục, cộng lỗ nhỏ trong thân (mắt, kẽ tóc: ≥ 3 / 4 điểm kề đục) để nộm là một mảng màu liền, không lủng nền. */
function solidMask(fig) {
  const on = (x, y) => x >= 0 && y >= 0 && x < B && y < B && fig.alpha(x, y) >= 128, m = new Uint8Array(B * B);
  for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) m[y * B + x] = on(x, y) || (on(x - 1, y) + on(x + 1, y) + on(x, y - 1) + on(x, y + 1) >= 3) ? 1 : 0;
  return m;
}

/**
 * Nộm của một ô vẽ cỡ `cw`×`ch`: khung phụ thể F×F (gốc chân (F/2, F/2 + 26)) phóng đều `CELL / F` rồi đặt giữa ô.
 * @returns {{ mask: Uint8Array, w: number, h: number, foot: [number, number], x0: number, y0: number, k: number, box: object | null }}
 *   mask 1 = điểm nộm (toạ độ ô); foot = gốc chân trong ô (theo điểm ảnh ô); box = hộp bao nộm.
 */
export function dummyCell({ sex = "m", dir, clip, step, frame, cw = CELL, ch = CELL }) {
  const F = checkFrame(frame), k = CELL / F, { fig } = bodyFrame(sex, dir, clip, step), [bx, by] = bodyOffset(F), [ox, oy] = frameOrigin(F);
  const x0 = Math.round((cw - CELL) / 2), y0 = Math.round((ch - CELL) / 2), mask = new Uint8Array(cw * ch), solid = solidMask(fig);
  let a = cw, b = ch, c = -1, d = -1;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const u = Math.floor(((x + 0.5) / k) - bx), v = Math.floor(((y + 0.5) / k) - by);
    if (u < 0 || v < 0 || u >= B || v >= B || !solid[v * B + u]) continue;
    mask[(y0 + y) * cw + x0 + x] = 1;
    if (x0 + x < a) a = x0 + x; if (x0 + x > c) c = x0 + x; if (y0 + y < b) b = y0 + y; if (y0 + y > d) d = y0 + y;
  }
  return { mask, w: cw, h: ch, x0, y0, k, foot: [x0 + ox * k, y0 + oy * k], box: c < 0 ? null : { x0: a, y0: b, x1: c, y1: d } };
}

/**
 * Vạch tham chiếu của một ô (toạ độ ô 256×256, danh sách hộp đặc [x, y, w, h, over]; `over` = vẽ ĐÈ lên nộm (trục, tâm ngực), còn lại vẽ dưới nộm): đường chân (đứt nét ngang qua gốc chân),
 * trục dọc qua gốc chân lên tới đỉnh đầu nộm, dấu cộng ở tâm ngực (điểm neo `back` của thân), thước chiều cao thân (bên trái, từ chân tới đỉnh đầu)
 * và bốn góc khung phụ thể (mép khung game: phụ thể vẽ vượt mép bị cắt). Toàn bộ theo đúng hệ số thu `CELL / khung` của nộm.
 */
export function guideCell({ sex = "m", dir, clip, step, frame }) {
  const d = dummyCell({ sex, dir, clip, step, frame }), { box, foot: [fx, fy], k } = d, out = [];
  if (!box) return out;
  const R = (x, y, w, h, over = false) => out.push([Math.round(x), Math.round(y), w, h, over]), top = box.y0, I = 2, L = 16, T = 3;
  for (let x = 10; x < CELL - 10; x += 14) R(x, fy, 8, T);                 // đường chân (baseline)
  for (let y = top; y < fy; y += 10) R(fx - 1, y, 2, 6, true);              // trục dọc qua gốc chân (vẽ ĐÈ lên nộm để thấy trên thân)
  const a = bodyAnchors(sex, dir, clip, step)?.back;
  if (a) { const [bx, by] = bodyOffset(checkFrame(frame)), cx = (bx + a.x) * k, cy = (by + a.y) * k; R(cx - 10, cy - 1, 21, 2, true); R(cx - 1, cy - 10, 2, 21, true); } // tâm ngực
  const rx = 14; R(rx, top, 2, fy - top + T); R(rx - 6, top, 14, 2); R(rx - 6, fy, 14, 2); // thước chiều cao thân
  for (const [cx, cy, sx, sy] of [[I, I, 1, 1], [CELL - I, I, -1, 1], [I, CELL - I, 1, -1], [CELL - I, CELL - I, -1, -1]]) { // góc khung
    R(sx > 0 ? cx : cx - L, sy > 0 ? cy : cy - T, L, T); R(sx > 0 ? cx : cx - T, sy > 0 ? cy : cy - L, T, L);
  }
  return out;
}
function paintGuides(img, rect, guides, key, over) { for (const [x, y, w, h, o] of guides) if (o === over) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.set(rect.x + x + i, rect.y + y + j, [...key, 255]); }

function fillBg(img) { for (let i = 0; i < img.data.length; i += 4) { img.data[i] = BG_KEY[0]; img.data[i + 1] = BG_KEY[1]; img.data[i + 2] = BG_KEY[2]; img.data[i + 3] = 255; } }
function paint(img, cell, rect, key) {
  for (let y = 0; y < cell.h; y++) for (let x = 0; x < cell.w; x++) if (cell.mask[y * cell.w + x]) img.set(rect.x + x, rect.y + y, [...key, 255]);
}

/** Tờ nộm của một hướng (ảnh 1536×1024, 6×4 ô; ô nào không có khung thì chỉ nền). `group`: A / B / C. */
export function dummySheet({ group, dir, frame, key = dummyKeyOf(""), sex = "m", guideKey = null }) {
  const img = new Img(SHEET_W, SHEET_H), kc = typeof key === "string" ? hex(key) : key, fr = framesOf(group), gc = guideKey && (typeof guideKey === "string" ? hex(guideKey) : guideKey);
  fillBg(img);
  const cells = [];
  for (const c of sheetCells(group)) {
    const step = bodyStepOf(c.anim, fr[c.anim], c.frame), cell = dummyCell({ sex, dir, clip: c.anim, step, frame });
    const at = { x: c.col * CELL, y: c.row * CELL }, gd = gc ? guideCell({ sex, dir, clip: c.anim, step, frame }) : [];
    if (gc) paintGuides(img, at, gd, gc, false);
    paint(img, cell, at, kc);
    if (gc) paintGuides(img, at, gd, gc, true);
    cells.push({ ...c, step, cell });
  }
  return { img, cells };
}
/** Bảng nộm turnaround: 5 cột hướng × 3 hàng (idle, attack đỉnh, hurt), 1536×1024; nộm giữa ô. */
export function dummyTurnaround({ frame, key, sex = "m", guideKey = null }) {
  const T = TURNAROUND, img = new Img(T.w, T.h), kc = typeof key === "string" ? hex(key) : key, gc = guideKey && (typeof guideKey === "string" ? hex(guideKey) : guideKey), cw = Math.round(T.w / T.cols), ch = Math.round(T.h / T.rows);
  fillBg(img);
  T.poses.forEach((pose, r) => DIRS.forEach((dir, c) => {
    const clip = pose, step = TURNAROUND_STEP[pose], cell = dummyCell({ sex, dir, clip, step, frame, cw, ch });
    const at = { x: c * cw + cell.x0, y: r * ch + cell.y0 }, gd = gc ? guideCell({ sex, dir, clip, step, frame }) : [];
    if (gc) paintGuides(img, at, gd, gc, false);
    paint(img, cell, { x: c * cw, y: r * ch }, kc);
    if (gc) paintGuides(img, at, gd, gc, true);
  }));
  return img;
}

/** Ghi bảng nộm của một võ hồn vào `out`; trả danh sách file. */
export function writeDummies(id, out, { frame, key, sex = "m", guideKey, guides = true, turnaround = true } = {}) {
  const info = phutheInfo(id), F = frame ?? info.frame, k = key ?? info.dummyKey, g = guides ? (guideKey ?? guideKeyOf(id, k)) : null;
  mkdirSync(out, { recursive: true });
  const files = [];
  const put = (name, img) => { const f = path.join(out, name); writeFileSync(f, encodePng(img)); files.push(f); };
  if (turnaround) put(`${id}-nom-turnaround.png`, dummyTurnaround({ frame: F, key: k, sex, guideKey: g }));
  for (const dir of DIRS) put(`${id}-nom-to${SHEET_ID[dir]}.png`, dummySheet({ group: info.group, dir, frame: F, key: k, sex, guideKey: g }).img);
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  const id = val("--id"), out = val("--out"), all = a.includes("--all"), turnaround = !a.includes("--no-turnaround");
  if ((!id && !all) || !out) { console.error("Dùng: node tools/assets/phuthe-sheet-dummy.mjs --id <võ hồn> --out <thư mục> [--frame 96|128] [--dummy-key #00D0D0] [--guide-key #7A5CFF] [--no-guides] [--no-turnaround] [--sex m|f]\n  hoặc --all --out <art/src/phuthe-anim> [--skip id,id]: mọi võ hồn vào <out>/<id>/references (khung, màu nộm, màu vạch theo công cụ)"); process.exit(2); }
  try {
    if (all) {
      const skip = new Set(val("--skip")?.split(",") ?? []);
      for (const k of allPhutheIds().filter((x) => !skip.has(x))) for (const f of writeDummies(k, path.join(out, k, "references"), { sex: val("--sex") ?? "m", turnaround })) console.log(`ghi ${f}`);
    } else for (const f of writeDummies(id, out, { frame: val("--frame") && +val("--frame"), key: val("--dummy-key"), sex: val("--sex") ?? "m", guideKey: val("--guide-key"), guides: !a.includes("--no-guides"), turnaround })) console.log(`ghi ${f}`);
  } catch (e) { console.error(e.message); process.exit(2); }
}
