// Neo phụ thể theo TÂM KHỐI THÂN (không theo hộp bao): sinh `shared/assets/sprites/vohonanim/anchor.json` cho từng võ hồn × giới × hướng (docs/art/phu-the-hoat-anh.md, mục "Neo khối thân").
//   node tools/assets/phuthe-anchor.mjs --id ta_hoa_phuong_hoang [--source static|anim] [--dir <thư mục phuthe-sheet-cut>] [--ratio 1.3,1.6] [--erode 5] [--grow] [--out <anchor.json>] [--force] [--dry]
// Một mục: { frame, m: { s|se|e|ne|n: { dx, dy, scale, tx, ty } }, f: {…} }. Dựng ảnh = phóng `scale` quanh gốc chân của khung rồi dời (dx, dy) điểm ảnh khung; (tx, ty) là điểm đích
// (giữa lưng thân LPC, tính từ gốc chân) để vẽ chữ thập. Tâm khối thân = trọng tâm thành phần liên thông lớn nhất còn lại sau khi bào mòn mặt nạ alpha `erode` lần (lông lửa mảnh, đuôi,
// tia nhỏ rộng ≤ 2·erode điểm bị bỏ); chiều cao khối thân = cao hộp của thành phần đó + 2·erode. `scale` đưa tỉ lệ (cao khối thân / cao thân LPC) vào dải 1,3–1,6: đã trong dải thì giữ 1, ngoài dải thì
// kéo về mép gần nhất; mặc định KHÔNG phóng to (ảnh đã cắt khung 96 / 128, phóng to chỉ làm cánh bị xén thêm), --grow cho phép.
// Mục `"manual": true` (xuất từ trang xem trước tay) không bị ghi đè trừ khi có --force.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, ROOT } from "./lib.mjs";
import { DIRS, SEXES, HALVES, gameAnims, gameRow, gameKey, bodyOffset, frameOrigin, phutheInfo } from "./phuthe-sheet-lib.mjs";
import { bodyAnchors, bodyFrame } from "./phuthe-sheet-dummy.mjs";

export const ANCHOR_FILE = path.join(ROOT, "shared", "assets", "sprites", "vohonanim", "anchor.json");
/** Dải tỉ lệ đích: chiều cao khối thân phụ thể / chiều cao thân LPC (chủ repo duyệt 1,3–1,6). */
export const RATIO = [1.3, 1.6];
/** Số lần bào mòn mặc định (khung 96); khung 128 nhân theo tỉ lệ. */
export const ERODE = 5;
/** Giới hạn `scale` (tránh phóng / thu quá tay khi ảnh lạ). */
export const SCALE_RANGE = [0.25, 2];
/** Trần `scale` khi tự tính (không phóng to); `--grow` nâng lên SCALE_RANGE[1]. */
export const GROW_MAX = 1;
/** Khung tĩnh cũ `vh_{id}_{b|f}`: 24 cột, mỗi giới 6 hàng (s, se, e, ne, n, +1), khung 96, gốc (48, 74); khung đứng = cột 0 của clip idle. */
export const STATIC = { cols: 24, rowsPerSex: 6, frame: 96 };
const r2 = (v) => Math.round(v * 100) / 100;

/** Mặt nạ alpha ≥ 128 của khung (x0, y0, F) trong ảnh; nhiều ảnh (nửa sau + nửa trước) thì hợp lại. */
function frameMask(imgs, x0, y0, F) {
  const m = new Uint8Array(F * F);
  for (const im of imgs) if (im) for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) if (im.alpha(x0 + x, y0 + y) >= 128) m[y * F + x] = 1;
  return m;
}
/** Bào mòn `r` lần (láng giềng 4 hướng). */
export function erode(mask, w, h, r) {
  let cur = mask;
  for (let k = 0; k < r; k++) {
    const nx = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (cur[i] && cur[i - 1] && cur[i + 1] && cur[i - w] && cur[i + w]) nx[i] = 1;
    }
    cur = nx;
  }
  return cur;
}
/** Thành phần liên thông (8 láng giềng) lớn nhất của mặt nạ: danh sách chỉ số điểm. */
function largestComponent(mask, w, h) {
  const seen = new Uint8Array(w * h); let best = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    const st = [s], pts = []; seen[s] = 1;
    while (st.length) {
      const i = st.pop(); pts.push(i);
      const x = i % w, y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const j = Y * w + X;
        if (mask[j] && !seen[j]) { seen[j] = 1; st.push(j); }
      }
    }
    if (pts.length > best.length) best = pts;
  }
  return best;
}
/**
 * Khối thân của một khung: { cx, cy, h, area } (tọa độ khung, điểm ảnh) hoặc null khi trống. Bào mòn `r`; nếu mất sạch thì giảm dần `r` (vật mảnh vẫn có tâm).
 */
export function bodyCore(mask, F, r = ERODE) {
  for (let k = r; k >= 0; k--) {
    const comp = largestComponent(erode(mask, F, F, k), F, F);
    if (!comp.length) continue;
    let sx = 0, sy = 0, top = F, bottom = -1;
    for (const i of comp) { const x = i % F, y = (i / F) | 0; sx += x + 0.5; sy += y + 0.5; top = Math.min(top, y); bottom = Math.max(bottom, y); }
    return { cx: sx / comp.length, cy: sy / comp.length, h: bottom - top + 1 + 2 * k, area: comp.length, erode: k };
  }
  return null;
}
const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };

/** Khối thân của một (giới, hướng): trung vị tâm / cao qua các khung `frames` = [{ x0, y0 }] của các ảnh `imgs`. */
export function coreOf(imgs, frames, F, r = ERODE) {
  const cs = frames.map((f) => bodyCore(frameMask(imgs, f.x0, f.y0, F), F, r)).filter(Boolean);
  return cs.length ? { cx: median(cs.map((c) => c.cx)), cy: median(cs.map((c) => c.cy)), h: median(cs.map((c) => c.h)), n: cs.length } : null;
}

/** Thân LPC của (giới, hướng) ở khung idle: điểm đích (giữa lưng) và chiều cao, tính từ gốc chân khung F. Se / ne dùng hàng `e` như neo của đặc tả. */
export function bodyTarget(sex, dir, F) {
  const row = dir === "se" || dir === "ne" ? "e" : dir, a = bodyAnchors(sex, row, "idle", 0), { fig } = bodyFrame(sex, row, "idle", 0), [bx, by] = bodyOffset(F), [ox, oy] = frameOrigin(F);
  let top = 64, bottom = -1;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (fig.alpha(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  if (!a || bottom < 0) throw new Error(`không đo được thân LPC ${sex}/${dir}`);
  return { tx: a.back.x + bx - ox, ty: a.back.y + by - oy, bodyH: bottom - top + 1 };
}

/**
 * Neo của một (giới, hướng): scale đưa tỉ lệ cao khối thân / cao thân vào dải `ratio` (đã trong dải: 1; không vượt `growMax`); (dx, dy) đưa tâm khối thân (sau phóng quanh gốc chân) về giữa lưng thân.
 * @returns {{dx:number, dy:number, scale:number, tx:number, ty:number}}
 */
export function solveAnchor(core, target, F, ratio = RATIO, growMax = GROW_MAX) {
  const [ox, oy] = frameOrigin(F), now = core.h / target.bodyH, want = Math.max(ratio[0], Math.min(ratio[1], now)), k = Math.max(SCALE_RANGE[0], Math.min(growMax, want / now));
  return { dx: r2(target.tx + ox - (ox + (core.cx - ox) * k)), dy: r2(target.ty + oy - (oy + (core.cy - oy) * k)), scale: r2(k), tx: r2(target.tx), ty: r2(target.ty) };
}

/**
 * Bảng neo của một võ hồn từ sheet: `layout.frames(sex, dir)` trả các khung đo (x0, y0 trong ảnh). `imgs` = [nửa sau, nửa trước].
 */
export function buildAnchors(imgs, layout, F, { ratio = RATIO, erodeN = ERODE, growMax = GROW_MAX, dirsOk = DIRS } = {}) {
  const out = { frame: F }, r = Math.max(1, Math.round(erodeN * F / 96));
  for (const sex of SEXES) {
    out[sex] = {};
    for (const dir of DIRS) {
      // hướng chưa nhập (cutter --partial): client dùng phụ thể tĩnh cũ, không đọc neo; ghi neo đơn vị cho đủ bảng 2 giới × 5 hướng
      if (!dirsOk.includes(dir)) { out[sex][dir] = { dx: 0, dy: 0, scale: 1, tx: 0, ty: 0 }; continue; }
      const core = coreOf(imgs, layout.frames(sex, dir), F, r);
      if (!core) continue;
      out[sex][dir] = solveAnchor(core, bodyTarget(sex, dir, F), F, ratio, growMax);
    }
  }
  return out;
}
/** Bố cục sheet tĩnh cũ `vh_{id}_{b|f}`. */
export const staticLayout = () => ({ frames: (sex, dir) => [{ x0: 0, y0: (SEXES.indexOf(sex) * STATIC.rowsPerSex + DIRS.indexOf(dir)) * STATIC.frame }] });
/** Bố cục sheet hoạt ảnh `vhanim_{id}_{b|f}`: mọi khung của clip idle. */
export const animLayout = (group, F) => ({ frames: (sex, dir) => { const [c0, n] = gameAnims(group).idle; return Array.from({ length: n }, (_, i) => ({ x0: (c0 + i) * F, y0: gameRow(sex, dir) * F })); } });

/** Kiểm một bảng neo đọc từ tệp: số hữu hạn, scale trong khoảng; trả danh sách lỗi (rỗng = tốt). */
export function checkAnchors(id, e) {
  const bad = [];
  if (!e || (e.frame !== 96 && e.frame !== 128)) return [`${id}: frame phải 96 / 128`];
  for (const sex of SEXES) for (const dir of DIRS) {
    const a = e[sex]?.[dir];
    if (!a) { bad.push(`${id}: thiếu ${sex}/${dir}`); continue; }
    for (const k of ["dx", "dy", "scale"]) if (!Number.isFinite(a[k])) bad.push(`${id}: ${sex}/${dir}.${k} không phải số`);
    if (a.scale < SCALE_RANGE[0] || a.scale > SCALE_RANGE[1]) bad.push(`${id}: ${sex}/${dir}.scale ${a.scale} ngoài ${SCALE_RANGE.join("–")}`);
  }
  return bad;
}
export function readAnchors(file = ANCHOR_FILE) { return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {}; }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  const id = val("--id");
  if (!id) { console.error("Dùng: node tools/assets/phuthe-anchor.mjs --id <võ hồn> [--source static|anim] [--dir <thư mục phuthe-sheet-cut>] [--ratio 1.3,1.6] [--erode 5] [--grow] [--out <anchor.json>] [--force] [--dry]"); process.exit(2); }
  try {
    const source = val("--source") ?? "static", ratio = val("--ratio") ? val("--ratio").split(",").map(Number) : RATIO, growMax = a.includes("--grow") ? SCALE_RANGE[1] : GROW_MAX, erodeN = +(val("--erode") ?? ERODE), file = val("--out") ?? ANCHOR_FILE;
    let imgs, layout, F, dirsOk = DIRS;
    if (source === "anim") {
      const dir = val("--dir"); if (!dir) throw new Error("--source anim cần --dir <thư mục phuthe-sheet-cut>");
      const info = phutheInfo(id); F = info.frame; layout = animLayout(info.group, F);
      const me = path.join(dir, "manifest-entry.json");
      if (existsSync(me)) dirsOk = JSON.parse(readFileSync(me, "utf8")).find((x) => x.anim?.dirsOk)?.anim.dirsOk ?? DIRS;
      imgs = Object.values(HALVES).map((h) => { const f = path.join(dir, `${gameKey(id, h)}.png`); return existsSync(f) ? readPng(f) : null; });
    } else {
      F = STATIC.frame; layout = staticLayout();
      imgs = ["b", "f"].map((h) => readPng(path.join(ROOT, "shared", "assets", "sprites", "vohon", `${id}_${h}.png`)));
    }
    const entry = buildAnchors(imgs, layout, F, { ratio, erodeN, growMax, dirsOk }), all = readAnchors(file);
    if (all[id]?.manual && !a.includes("--force")) { console.error(`${id}: mục chỉnh tay (manual), dùng --force để ghi đè`); process.exit(1); }
    const bad = checkAnchors(id, entry);
    if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
    for (const sex of SEXES) console.log(`${id} ${sex}: ` + DIRS.map((d) => `${d} ×${entry[sex][d].scale} (${entry[sex][d].dx}, ${entry[sex][d].dy})`).join("  "));
    if (!a.includes("--dry")) { all[id] = entry; mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, JSON.stringify(Object.fromEntries(Object.entries(all).sort(([x], [y]) => (x < y ? -1 : 1))), null, 1) + "\n"); console.log(`ghi ${path.relative(ROOT, file)}`); }
  } catch (e) { console.error(e.message); process.exit(2); }
}
