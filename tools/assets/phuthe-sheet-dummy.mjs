// Dựng hình nộm LPC tham chiếu cho tờ vẽ phụ thể v2 (#1022; đặc tả docs/art/phu-the-hoat-anh.md, mục "Hình nộm LPC tham chiếu").
//   node tools/assets/phuthe-sheet-dummy.mjs --id ta_hoa_phuong_hoang --out <thư mục> [--frame 96|128] [--dummy-key #00D0D0] [--guide-key #7A5CFF] [--no-guides] [--kind phuthe|vukhi] [--grip-key #00FF60] [--sex m|f]
// Ghi `<id>-nom-turnaround.png` và `<id>-nom-toA..E.png`: nền #FF00FF, mỗi ô có hình thân hồn sư (m_0 / f_0, tô MỘT màu khóa phẳng, không viền,
// không sáng tối) đúng khung thân mà bảng ánh xạ của đặc tả chỉ cho khung đó, đặt ở gốc chân của khung phụ thể (96: (48, 74), 128: (64, 90))
// phóng cùng hệ số với ô vẽ (256 / khung). Đây là ảnh tham chiếu đính kèm khi sinh ảnh; nộm KHÔNG vào game.
// --kind vukhi (#1312): thêm marker điểm cầm (GRIP_KEY, chấm = tay thuận A, vòng = tay B) đè đúng chỗ bàn tay, đo từ `frameAnchors` (xem `gripPoints`); ghi vào `<out>` như cũ.
// Dùng lại trong cutter: `dummyCell` cho mặt nạ nộm danh nghĩa của từng ô (đăng ký vị trí nộm đã bị model dời), `bodyAnchors` cho neo từng giới.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Img, readPng, encodePng, hex, paletteGroup, frameAnchors, ROOT } from "./lib.mjs";
import {
  LPC_SHEET, DIRS, BG_KEY, CELL, SHEET_W, SHEET_H, TURNAROUND, TURNAROUND_STEP,
  framesOf, sheetCells, bodyStepOf, bodyRowKey, bodyColOf, bodyOffset, frameOrigin, checkFrame, phutheInfo, dummyKeyOf, guideKeyOf, SHEET_ID, allPhutheIds, allVukhiIds,
  gripKeyOf, gripCounts, gripCountAt, GRIP_R, GRIP_RING_IN, SHOULDER_UP, checkKind, CLIPS, bodyAnim,
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
// ---------- Marker điểm cầm (kiểu vũ khí; đặc tả vũ khí, mục "Điểm cầm trên nộm") ----------
/** Ngưỡng của tay nghỉ; cặp tay attack/cast có ngoại lệ được kiểm vị trí trong gripPoints. */
const HAND_MIN_PX = 10, HAND_BELOW_BACK = 4;
const ACTIVE_HAND_MIN_PX = 8, ACTIVE_HAND_SIDE = 6;
/** Thứ tự bước thân thay thế khi khung thân đo không ra tay (cẳng tay bị áo che): bước kề trước, rồi bước 0. */
const stepsNear = (clip, step) => { const n = bodyAnim(clip).ms.length, out = [step]; for (let d = 1; d < n; d++) for (const s of [step - d, step + d]) if (s >= 0 && s < n) out.push(s); return out; };
/** Tay thuận trước: nhìn hướng `s` tay phải của hồn sư ở bên TRÁI ảnh (x nhỏ); hướng `n` ở bên phải ảnh; hướng nghiêng lấy tay gần người xem hơn (y lớn). */
const handOrder = (dir, hands) => [...hands].sort((a, b) => (dir === "s" ? a.x - b.x : dir === "n" ? b.x - a.x : b.y - a.y || b.x - a.x));
/**
 * Điểm cầm của một khung thân, đo bằng `frameAnchors` (`hands[]`: đầu mút xa lưng nhất của mảng da cẳng tay; `back`: giữa lưng) rồi đổi sang toạ độ ô canonical 256
 * (cùng hệ với `dummyCell` / `guideCell`): { hands: [[x, y], …] (tay thuận trước), back, shoulder, steps: bước thân đã dùng, fallback: có phải dùng bước lân cận }.
 * Khung nào đo không ra tay thì dùng bước thân lân cận của cùng clip (`fallback: true`; kiểm tờ báo lên).
 * `count` là số tay tối thiểu cần tìm; marker/cutter giới hạn số tay theo clip. Cặp tay attack/cast được nâng ngang lưng,
 * mảng tay nhỏ chỉ nhận nếu nằm rõ ra hai bên trục thân; không đổi ảnh LPC hoặc suy ra tay từ giới khác.
 */
export function gripPoints({ sex = "m", dir, clip, step, frame, count = 1 }) {
  const F = checkFrame(frame), k = CELL / F, [bx, by] = bodyOffset(F), to = (p) => [(bx + p.x) * k, (by + p.y) * k];
  // Tay nện/thi triển có thể nâng ngang lưng; không áp ngưỡng của tay đang nghỉ.
  const activePair = count > 1 && ["attack", "cast"].includes(clip), belowBack = activePair ? 0 : HAND_BELOW_BACK;
  let partial = null;
  for (const s of stepsNear(clip, step)) {
    const a = bodyAnchors(sex, dir, clip, s);
    // Tay nhỏ lộ ít da chỉ nhận nếu ở xa trục lưng, tránh nhận nhầm mảng cổ áo.
    const hands = a ? a.hands.filter((h) => (h.n >= HAND_MIN_PX || (activePair && h.n >= ACTIVE_HAND_MIN_PX && Math.abs(h.x - a.back.x) >= ACTIVE_HAND_SIDE)) && h.y > a.back.y + belowBack) : [];
    if (!hands.length) continue;
    const head = a.head.y, feet = a.feet.y, back = to(a.back);
    const result = { hands: handOrder(dir, hands).slice(0, 2).map(to), back, shoulder: [back[0], back[1] - (feet - head) * SHOULDER_UP * k], step: s, fallback: s !== step };
    if (hands.length >= count) return result;
    partial ??= result;
  }
  if (partial) return { ...partial, fallback: true };
  const a = bodyAnchors(sex, dir, clip, step), back = a ? to(a.back) : [CELL / 2, CELL / 2];
  return { hands: [], back, shoulder: [back[0], back[1] - 20], step, fallback: true };
}
/** Marker một ô: danh sách điểm [x, y] (toạ độ ô): tay thuận `A` = chấm đặc, tay kia `B` = vòng (hở giữa); hai bên khác nhau bằng hình, cùng một màu khóa. */
export function gripMarker(opt) {
  const g = gripPoints(opt), pts = [];
  if (opt.count) g.hands = g.hands.slice(0, opt.count); // vũ khí 1 tay: chỉ marker A
  g.hands.forEach(([cx, cy], i) => {
    for (let y = Math.floor(cy - GRIP_R); y <= Math.ceil(cy + GRIP_R); y++) for (let x = Math.floor(cx - GRIP_R); x <= Math.ceil(cx + GRIP_R); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= GRIP_R && (i === 0 || d >= GRIP_RING_IN)) pts.push([x, y]);
    }
  });
  return { ...g, pts };
}
function paintGrip(img, rect, pts, key) { for (const [x, y] of pts) if (x >= 0 && y >= 0 && x < CELL && y < CELL) img.set(rect.x + x, rect.y + y, [...key, 255]); }

function paintGuides(img, rect, guides, key, over) { for (const [x, y, w, h, o] of guides) if (o === over) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.set(rect.x + x + i, rect.y + y + j, [...key, 255]); }

function fillBg(img) { for (let i = 0; i < img.data.length; i += 4) { img.data[i] = BG_KEY[0]; img.data[i + 1] = BG_KEY[1]; img.data[i + 2] = BG_KEY[2]; img.data[i + 3] = 255; } }
function paint(img, cell, rect, key) {
  for (let y = 0; y < cell.h; y++) for (let x = 0; x < cell.w; x++) if (cell.mask[y * cell.w + x]) img.set(rect.x + x, rect.y + y, [...key, 255]);
}

/** Tờ nộm của một hướng (ảnh 1536×1024, 6×4 ô; ô nào không có khung thì chỉ nền). `group`: A / B / C. */
export function dummySheet({ group, dir, frame, key = dummyKeyOf(""), sex = "m", guideKey = null, gripKey = null, gripN = 2 }) {
  const img = new Img(SHEET_W, SHEET_H), kc = typeof key === "string" ? hex(key) : key, fr = framesOf(group), gc = guideKey && (typeof guideKey === "string" ? hex(guideKey) : guideKey), pc = gripKey && (typeof gripKey === "string" ? hex(gripKey) : gripKey);
  fillBg(img);
  const cells = [];
  for (const c of sheetCells(group)) {
    const step = bodyStepOf(c.anim, fr[c.anim], c.frame), cell = dummyCell({ sex, dir, clip: c.anim, step, frame });
    const at = { x: c.col * CELL, y: c.row * CELL }, gd = gc ? guideCell({ sex, dir, clip: c.anim, step, frame }) : [];
    if (gc) paintGuides(img, at, gd, gc, false);
    paint(img, cell, at, kc);
    if (gc) paintGuides(img, at, gd, gc, true);
    const grip = pc ? gripMarker({ sex, dir, clip: c.anim, step, frame, count: gripCountAt(gripN, c.anim) }) : null;
    if (grip) paintGrip(img, at, grip.pts, pc); // marker điểm cầm đè lên nộm
    cells.push({ ...c, step, cell, ...(grip ? { grip } : {}) });
  }
  return { img, cells };
}
/** Bảng nộm turnaround: 5 cột hướng × 3 hàng (idle, attack đỉnh, hurt), 1536×1024; nộm giữa ô. */
export function dummyTurnaround({ frame, key, sex = "m", guideKey = null, gripKey = null, gripN = 2 }) {
  const T = TURNAROUND, img = new Img(T.w, T.h), kc = typeof key === "string" ? hex(key) : key, gc = guideKey && (typeof guideKey === "string" ? hex(guideKey) : guideKey), pc = gripKey && (typeof gripKey === "string" ? hex(gripKey) : gripKey), cw = Math.round(T.w / T.cols), ch = Math.round(T.h / T.rows);
  fillBg(img);
  T.poses.forEach((pose, r) => DIRS.forEach((dir, c) => {
    const clip = pose, step = TURNAROUND_STEP[pose], cell = dummyCell({ sex, dir, clip, step, frame, cw, ch });
    const at = { x: c * cw + cell.x0, y: r * ch + cell.y0 }, gd = gc ? guideCell({ sex, dir, clip, step, frame }) : [];
    if (gc) paintGuides(img, at, gd, gc, false);
    paint(img, cell, { x: c * cw, y: r * ch }, kc);
    if (gc) paintGuides(img, at, gd, gc, true);
    if (pc) paintGrip(img, at, gripMarker({ sex, dir, clip, step, frame, count: gripCountAt(gripN, clip) }).pts, pc);
  }));
  return img;
}

/** Ghi bảng nộm của một võ hồn vào `out`; trả danh sách file. */
export function writeDummies(id, out, { frame, key, sex = "m", guideKey, gripKey, guides = true, turnaround = true, kind = "phuthe", specMd } = {}) {
  const info = phutheInfo(id, kind, specMd), F = frame ?? info.frame, k = key ?? info.dummyKey, g = guides ? (guideKey ?? guideKeyOf(id, k)) : null, pk = checkKind(kind) === "vukhi" ? (gripKey ?? gripKeyOf(id, k, g ?? guideKeyOf(id, k))) : null;
  mkdirSync(out, { recursive: true });
  const files = [];
  const put = (name, img) => { const f = path.join(out, name); writeFileSync(f, encodePng(img)); files.push(f); };
  if (turnaround) put(`${id}-nom-turnaround.png`, dummyTurnaround({ frame: F, key: k, sex, guideKey: g, gripKey: pk, gripN: info.hands ? gripCounts(info.hands) : 2 }));
  for (const dir of DIRS) put(`${id}-nom-to${SHEET_ID[dir]}.png`, dummySheet({ group: info.group, dir, frame: F, key: k, sex, guideKey: g, gripKey: pk, gripN: info.hands ? gripCounts(info.hands) : 2 }).img);
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  const id = val("--id"), out = val("--out"), all = a.includes("--all"), turnaround = !a.includes("--no-turnaround"), kind = val("--kind") ?? "phuthe";
  if ((!id && !all) || !out) { console.error("Dùng: node tools/assets/phuthe-sheet-dummy.mjs --id <võ hồn> --out <thư mục> [--frame 96|128] [--dummy-key #00D0D0] [--guide-key #7A5CFF] [--no-guides] [--no-turnaround] [--sex m|f]\n  hoặc --all --out <art/src/phuthe-anim> [--skip id,id]: mọi võ hồn vào <out>/<id>/references (khung, màu nộm, màu vạch theo công cụ)"); process.exit(2); }
  try {
    if (all) {
      const skip = new Set(val("--skip")?.split(",") ?? []);
      for (const k of (checkKind(kind) === "vukhi" ? allVukhiIds() : allPhutheIds()).filter((x) => !skip.has(x))) for (const f of writeDummies(k, path.join(out, k, ...(kind === "vukhi" ? ["vukhi"] : []), "references"), { sex: val("--sex") ?? "m", turnaround, kind })) console.log(`ghi ${f}`);
    } else for (const f of writeDummies(id, out, { frame: val("--frame") && +val("--frame"), key: val("--dummy-key"), sex: val("--sex") ?? "m", guideKey: val("--guide-key"), gripKey: val("--grip-key"), guides: !a.includes("--no-guides"), turnaround, kind })) console.log(`ghi ${f}`);
  } catch (e) { console.error(e.message); process.exit(2); }
}
