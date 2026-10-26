// Kiểm ảnh võ hồn v2 (#1087, epic #1020): `npm run vohon:check -- raw|pixel <ảnh.png> --type portrait|icon|phaptuong [--id <võ hồn>]`.
//   raw   : ảnh RAW model trả về (trước chuyển pixel) → mức CHẶN / NHẸ / ĐẸP theo docs/art/vo-hon-phong-cach.md mục 6.1.
//   pixel : ảnh sau vohon-pixelize.mjs → số màu, alpha, viền, điểm sáng (mắt / mỏ / lõi), vùng sáng, độ tương phản.
// Thoát mã 1 nếu có mục CHẶN. Không đoán những gì máy không đo được: sai nhận diện võ hồn, chữ lạ trong ảnh và cảm giác "bá đạo" vẫn do mắt duyệt
// (danh sách "cần mắt" in cuối mỗi báo cáo). Các số đo là hằng công cụ, KHÔNG phải số cân bằng (shared/data.ts).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, hex, vohonColors } from "./lib.mjs";
import { TYPES, TYPE_VI, MAX_COLORS, PORTRAIT_SIZE, ICON_SIZES, PT_FRAMES, PT_DIRS, OUT, luma, sat, dist, borderKey, colorCounts, splitPoses, pixelizeDown, accentBlobs, accentSurvival, squareCrop, crop, hasAlpha, bbox } from "./vohon-pixelize-lib.mjs";

/** Ngưỡng mật độ biên của ảnh pixel nhỏ (chân dung / icon); hằng công cụ. */
export const EDGE_BUSY = 0.3;
const issue = (sev, code, text) => ({ sev, code, text });
export const SEV_VI = { block: "CHẶN", soft: "NHẸ", good: "ĐẸP" };

// ---------- Số đo ảnh RAW ----------
const hue = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return ((h * 60) + 360) % 360; };
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const isGray = (c) => sat(...c) < 0.25;

/** Tỉ lệ điểm sáng (luma ≥ 0,2, không phải nền) có màu cùng họ với `robe` / `col` (cùng sắc ±40° hoặc cùng là màu xám). null nếu không có màu. */
export function paletteMatch(img, colors) {
  if (!colors) return null;
  const T = [colors.robe, colors.col].map((c) => hex(c)); let ok = 0, n = 0;
  const step = Math.max(1, Math.floor(Math.sqrt((img.w * img.h) / 40000)));
  for (let y = 0; y < img.h; y += step) for (let x = 0; x < img.w; x += step) {
    const [r, g, b, a] = img.get(x, y); if (a < 128 || luma(r, g, b) < 0.2) continue; n++;
    const gray = isGray([r, g, b]);
    if (T.some((t) => (gray && isGray(t)) || (!gray && !isGray(t) && hueGap(hue(r, g, b), hue(...t)) <= 40))) ok++;
  }
  return n ? ok / n : 0;
}
/** Độ mềm: tỉ lệ cặp điểm kề ngang chênh nhẹ nhưng khác 0 (1 ≤ chênh ≤ 20) trên mọi cặp khác nhau. Pixel art phóng bằng láng giềng gần nhất cho ~0; ảnh model vẽ mềm cho cao. */
export function softness(img) {
  let soft = 0, diff = 0; const d = img.data;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w - 1; x++) {
    const i = (y * img.w + x) * 4; if (d[i + 3] < 128 || d[i + 7] < 128) continue;
    const m = Math.max(Math.abs(d[i] - d[i + 4]), Math.abs(d[i + 1] - d[i + 5]), Math.abs(d[i + 2] - d[i + 6]));
    if (m > 0) { diff++; if (m <= 20) soft++; }
  }
  return diff ? soft / diff : 0;
}
/** Số màu "đáng kể": màu 4 bit/kênh chiếm ≥ 0,05% điểm đục. */
export function bigColors(img) {
  const m = new Map(); let n = 0;
  for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3] >= 128) { n++; const k = (img.data[i] >> 4) * 256 + (img.data[i + 1] >> 4) * 16 + (img.data[i + 2] >> 4); m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.values()].filter((c) => c >= n * 0.0005).length;
}
/**
 * Độ đều của lưới khối: tỉ số năng lượng biên (cột có chênh lệch lớn) tại chu kỳ tốt nhất so với phần còn lại, chu kỳ 4..40 điểm.
 * Ảnh phóng nguyên khối cho tỉ số lớn (≥ 4); ảnh model "giả pixel" lệch khối cho tỉ số thấp. Trả { period, ratio }.
 */
export function gridRatio(img) {
  const E = new Float64Array(img.w), d = img.data;
  for (let y = 0; y < img.h; y += 2) for (let x = 1; x < img.w; x++) { const i = (y * img.w + x) * 4; E[x] += Math.abs(d[i] - d[i - 4]) + Math.abs(d[i + 1] - d[i - 3]) + Math.abs(d[i + 2] - d[i - 2]); }
  let best = { period: 0, ratio: 0 };
  for (let p = 4; p <= 40; p++) for (let ph = 0; ph < p; ph++) {
    let on = 0, no = 0, off = 0, nf = 0;
    for (let x = 1; x < img.w; x++) { if (((x - ph) % p + p) % p === 0) { on += E[x]; no++; } else { off += E[x]; nf++; } }
    const r = (on / no) / (off / nf + 1e-9); if (r > best.ratio) best = { period: p, ratio: r };
  }
  return best;
}
/** Khung viền: ≥ 3 / 4 cạnh có một đường một màu chạy suốt (cách mép ≤ 6%) và tương phản với vùng 4 điểm phía trong. */
export function hasFrame(img) {
  const maxIn = Math.max(1, Math.round(Math.min(img.w, img.h) * 0.06)), px = (x, y) => img.get(x, y);
  const side = (get, len, depth) => {
    for (let k = 0; k < maxIn; k++) {
      const line = Array.from({ length: len }, (_, i) => get(i, k)), inner = Array.from({ length: len }, (_, i) => get(i, k + 4 > depth ? depth : k + 4));
      const med = [0, 1, 2].map((c) => line.map((p) => p[c]).sort((a, b) => a - b)[len >> 1]);
      const flat = line.filter((p) => dist(p, med) <= 30).length / len, imed = [0, 1, 2].map((c) => inner.map((p) => p[c]).sort((a, b) => a - b)[len >> 1]);
      if (flat >= 0.9 && dist(med, imed) >= 50) return true;
    }
    return false;
  };
  const W = img.w, H = img.h;
  const n = [side((i, k) => px(i, k), W, H - 1), side((i, k) => px(i, H - 1 - k), W, H - 1), side((i, k) => px(k, i), H, W - 1), side((i, k) => px(W - 1 - k, i), H, W - 1)].filter(Boolean).length;
  return n >= 3;
}

// ---------- RAW ----------
/**
 * Mức theo `docs/art/vo-hon-phong-cach.md` mục 6.1. CHẶN: sai tỉ lệ / số hướng, có khung, nền không tách (icon, pháp tướng), màu lạc hẳn võ hồn
 * (dấu hiệu sai nhận diện). NHẸ: texture mềm, nhiều màu, chưa đúng lưới. ĐẸP: đọc được khi thu nhỏ (32 / 64) và đúng bảng màu mục 4.
 * @returns {{ type, id, issues: {sev, code, text}[], metrics: object, manual: string[] }}
 */
export function checkRaw(img, { type, id } = {}) {
  if (!TYPES.includes(type)) throw new Error(`--type phải là ${TYPES.join(" | ")}`);
  const issues = [], m = { w: img.w, h: img.h }, colors = id ? vohonColors(id) && (() => { const [col, robe] = vohonColors(id); return { col, robe }; })() : null;
  const ratio = img.w / img.h; m.ratio = +ratio.toFixed(3);
  if (type === "phaptuong") { if (ratio < 1.6 || ratio > 3.6) issues.push(issue("block", "ti-le", `tờ pháp tướng tỉ lệ ${m.ratio}, cần một hàng 5 hướng (khoảng 1,8–3,2:1)`)); }
  else if (Math.abs(ratio - 1) > 0.08) issues.push(issue("block", "ti-le", `${TYPE_VI[type]} cần ảnh vuông, nhận ${img.w}×${img.h}`));

  const bk = borderKey(img); m.border = { clear: +bk.clear.toFixed(2), flat70: +bk.near70.toFixed(2) };
  const flatBg = bk.clear >= 0.5 || bk.near70 >= 0.85;
  if (type !== "portrait") { if (!flatBg) issues.push(issue("block", "nen", "nền không tách: viền ảnh không trong suốt và không một màu phẳng (cần nền trong suốt hoặc #FF00FF)")); }
  else if (!flatBg && luma(...bk.key) > 0.35) issues.push(issue("soft", "nen-sang", "chân dung nền sáng / lẫn lộn; cần nền tối có quầng màu võ hồn"));

  if (hasFrame(img)) issues.push(issue("block", "khung", "có khung / viền chạy quanh ảnh (cấm khung, thẻ)"));

  // Phần dưới đây đo trên vùng hình (bỏ nền phẳng nếu có).
  const body = (() => { if (!flatBg) return img; const c = new img.constructor(img.w, img.h, Uint8Array.from(img.data)); for (let i = 0; i < c.data.length; i += 4) if (c.data[i + 3] < 128 || dist([c.data[i], c.data[i + 1], c.data[i + 2]], bk.key) <= 40) c.data[i + 3] = 0; return c; })();
  if (type === "phaptuong") {
    const poses = splitPoses(body); m.poses = poses.length;
    if (poses.length !== PT_DIRS.length) issues.push(issue("block", "huong", `tách được ${poses.length} hướng, cần ${PT_DIRS.length} (s, se, e, ne, n) cách nhau bằng khoảng trống`));
    else { const hs = poses.map((p) => p.box.h), ws = poses.map((p) => p.box.w); m.poseSpread = +(Math.max(...hs) / Math.min(...hs)).toFixed(2); if (Math.max(...hs) / Math.min(...hs) > 1.45 || Math.max(...ws) / Math.min(...ws) > 2.2) issues.push(issue("block", "ti-le", `năm hướng lệch cỡ quá (cao ${m.poseSpread}×): không phải cùng một hình`)); }
  } else { const bb = bbox(body); m.fill = bb ? +((bb.w * bb.h) / (img.w * img.h)).toFixed(2) : 0; if (type === "icon" && bb && m.fill < 0.12) issues.push(issue("block", "ti-le", `icon chiếm ${m.fill * 100 | 0}% khung, quá nhỏ để đọc ở 24×24`)); }

  m.softness = +softness(body).toFixed(3); m.bigColors = bigColors(body); const g = gridRatio(img); m.grid = { period: g.period, ratio: +g.ratio.toFixed(2) };
  if (m.softness > 0.35) issues.push(issue("soft", "mem", `texture mềm: ${(m.softness * 100) | 0}% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất`));
  if (m.bigColors > 160) issues.push(issue("soft", "nhieu-mau", `${m.bigColors} màu đáng kể (nên ≤ 160 để ép về ≤ ${MAX_COLORS[type]} mà không bệt)`));
  if (g.ratio < 3) issues.push(issue("soft", "luoi", `chưa đúng lưới khối: tỉ số biên ${m.grid.ratio} ở chu kỳ ${g.period} (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)`));

  m.paletteMatch = paletteMatch(body, colors); if (m.paletteMatch != null) m.paletteMatch = +m.paletteMatch.toFixed(2);
  if (m.paletteMatch != null && m.paletteMatch < 0.2) issues.push(issue("block", "sai-mau", `chỉ ${(m.paletteMatch * 100) | 0}% điểm sáng cùng họ màu robe / col của ${id}: nhiều khả năng sai võ hồn`));
  else if (m.paletteMatch != null && m.paletteMatch < 0.5) issues.push(issue("soft", "lech-mau", `${(m.paletteMatch * 100) | 0}% điểm sáng cùng họ màu robe / col của ${id} (mục 4 cần ≥ 50%)`));

  // Đọc được khi thu nhỏ: chạy thử chuyển pixel nhỏ và xem điểm sáng còn không.
  if (type !== "phaptuong" && !issues.some((i) => i.code === "ti-le")) {
    const S = type === "portrait" ? PORTRAIT_SIZE : ICON_SIZES[0], region = type === "portrait" ? crop(body, squareCrop(body)) : crop(body, bbox(body) ?? { x: 0, y: 0, w: img.w, h: img.h });
    const blobs = accentBlobs(region), small = pixelizeDown(region, S, S, { accent: 1.5 }), surv = accentSurvival(blobs, small);
    m.smallAccent = `${surv.kept}/${surv.total}`;
    if (surv.total && surv.kept / surv.total < 0.5) issues.push(issue("soft", "thu-nho", `thu về ${S}×${S} chỉ giữ ${surv.kept}/${surv.total} điểm sáng (mắt, lõi): hình quá nhiều chi tiết, cần bản đơn giản hơn`));
  }
  const soft = issues.some((i) => i.sev === "soft"), blocked = issues.some((i) => i.sev === "block");
  if (!blocked && !soft && m.paletteMatch != null && m.paletteMatch >= 0.6) issues.push(issue("good", "dep", `đạt đẹp: không có mục chặn / nhẹ, đúng bảng màu mục 4 (${(m.paletteMatch * 100) | 0}%), đọc được khi thu nhỏ`));
  return { type, id, issues, metrics: m, manual: manualList(type) };
}
const manualList = (type) => ["đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi)", "không có chữ, ký hiệu đọc được, logo, chữ ký", ...(type === "phaptuong" ? ["5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng", "thân đặc, không trong suốt"] : ["đọc được cả ở cỡ thật 1× (nhìn lướt)"])];

// ---------- Sau chuyển đổi ----------
/** Kiểm ảnh pixel. `info` = { size?, frame?, report? } (report là JSON do vohon-pixelize.mjs ghi). `img` pháp tướng là dải 5 khung ngang. */
export function checkPixel(img, { type, id, report } = {}) {
  if (!TYPES.includes(type)) throw new Error(`--type phải là ${TYPES.join(" | ")}`);
  const issues = [], m = { w: img.w, h: img.h }, cnt = colorCounts(img).size, max = MAX_COLORS[type]; m.colors = cnt;
  const size = report?.size, F = report?.frame ?? (type === "phaptuong" ? img.h : 0);
  if (type === "portrait" && (img.w !== img.h || (size ? img.w !== size : img.w !== PORTRAIT_SIZE))) issues.push(issue("block", "co", `chân dung ${img.w}×${img.h}, cần ${size ?? PORTRAIT_SIZE}×${size ?? PORTRAIT_SIZE}`));
  if (type === "icon" && (img.w !== img.h || !ICON_SIZES.includes(img.w))) issues.push(issue("block", "co", `icon ${img.w}×${img.h}, cần ${ICON_SIZES.join(" hoặc ")} vuông`));
  if (type === "phaptuong" && (!PT_FRAMES[F] || img.w !== F * PT_DIRS.length)) issues.push(issue("block", "co", `dải pháp tướng ${img.w}×${img.h}, cần ${PT_DIRS.length} khung ${Object.keys(PT_FRAMES).join(" / ")} ngang`));
  if (cnt > max) issues.push(issue("block", "mau", `${cnt} màu, tối đa ${max}`));
  let bad = 0; for (let i = 3; i < img.data.length; i += 4) if (img.data[i] !== 0 && img.data[i] !== 255) bad++;
  if (bad) issues.push(issue("block", "alpha", `${bad} điểm alpha không phải 0 / 255`));
  const transparent = hasAlpha(img);
  if (type !== "portrait" && !transparent) issues.push(issue("block", "nen", "ảnh không có điểm trong suốt: nền chưa tách"));
  if (transparent) {
    let edge = 0, out = 0;
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      if (img.alpha(x, y) < 128) continue;
      if ([[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => a < 0 || b < 0 || a >= img.w || b >= img.h || img.alpha(a, b) < 128)) { edge++; const p = img.get(x, y); if (p[0] === OUT[0] && p[1] === OUT[1] && p[2] === OUT[2]) out++; }
    }
    m.outline = edge ? +(out / edge).toFixed(2) : 0;
    if (edge && out / edge < 0.9) issues.push(issue("soft", "vien", `chỉ ${(m.outline * 100) | 0}% điểm rìa là viền #1a1020`));
    let touch = 0; for (let x = 0; x < img.w; x++) { if (img.alpha(x, 0) >= 128) touch++; if (img.alpha(x, img.h - 1) >= 128) touch++; } for (let y = 0; y < img.h; y++) { if (img.alpha(0, y) >= 128) touch++; if (img.alpha(img.w - 1, y) >= 128) touch++; }
    if (touch && type !== "phaptuong") issues.push(issue("soft", "cham-mep", `hình chạm mép ảnh (${touch} điểm): viền ngoài bị cắt`));
  }
  // Vùng sáng và tương phản (bỏ điểm trong suốt).
  let n = 0, hot = 0, sum = 0, sum2 = 0;
  for (let i = 0; i < img.data.length; i += 4) { if (img.data[i + 3] < 128) continue; const l = luma(img.data[i], img.data[i + 1], img.data[i + 2]); n++; sum += l; sum2 += l * l; if (l >= 0.55) hot++; }
  m.hot = n ? +(hot / n).toFixed(3) : 0; m.contrast = n ? +Math.sqrt(Math.max(0, sum2 / n - (sum / n) ** 2)).toFixed(3) : 0;
  if (n && m.hot < 0.005) issues.push(issue("soft", "mat-sang", `vùng sáng chỉ ${(m.hot * 100).toFixed(1)}%: mất điểm sáng (mắt, lõi, lưỡi), hình sẽ tối đặc`));
  if (n && m.hot > 0.3) issues.push(issue("soft", "sang-tran", `vùng sáng ${(m.hot * 100) | 0}%: sáng tràn, mất đối lập tối / sáng của phong cách mực tối`));
  if (n && m.contrast < 0.1) issues.push(issue("soft", "phang", `tương phản thấp (độ lệch luma ${m.contrast}): hình phẳng, khó đọc khi thu nhỏ`));
  // Mật độ biên: tỉ lệ cặp điểm kề (cả hai đục) khác màu. Cao = hình nát thành nhiều mảng nhỏ, mất đọc ở cỡ nhỏ (đo trên chân dung Tà Hỏa #1083: cả khung 0,36, cắt sát mặt 0,34).
  if (type !== "phaptuong") {
    let pairs = 0, diff = 0;
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) for (const [a, b] of [[x + 1, y], [x, y + 1]]) { if (a >= img.w || b >= img.h || img.alpha(x, y) < 128 || img.alpha(a, b) < 128) continue; pairs++; if (img.get(x, y).join() !== img.get(a, b).join()) diff++; }
    m.edge = pairs ? +(diff / pairs).toFixed(3) : 0;
    if (m.edge > EDGE_BUSY) issues.push(issue("soft", "nhieu-chi-tiet", `mật độ biên ${m.edge} (> ${EDGE_BUSY}): còn nhiều mảng nhỏ ở cỡ ${img.w}×${img.h}, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn`));
  }
  const acc = report?.accent; if (acc?.total) {
    m.accent = `${acc.kept}/${acc.total}`;
    if (acc.kept / acc.total < 0.5) issues.push(issue("soft", "mat-mat-mo", `chỉ còn ${acc.kept}/${acc.total} điểm sáng của ảnh nguồn (mắt, mỏ, lõi): có thể mất mắt / mỏ ở cỡ này; thử cắt gần hơn (--zoom / --crop) hoặc bản đơn giản hơn`));
  } else if (!report && type !== "phaptuong") issues.push(issue("soft", "khong-nguon", "không có báo cáo điểm sáng của ảnh nguồn (--report): chưa kiểm được mắt / mỏ"));
  if (!issues.length || issues.every((i) => i.sev === "good")) issues.push(issue("good", "dep", `đạt đẹp: ${cnt} / ${max} màu, viền đúng, còn đủ điểm sáng, tương phản ${m.contrast}`));
  return { type, id, issues, metrics: m, manual: ["mắt / mỏ (hoặc lõi, lưỡi) còn đọc ra ở cỡ thật 1×; xem trang `vohon-preview`", "so với RAW: vẫn là cùng một võ hồn"] };
}

export function formatResult(r, label = "") {
  const by = (s) => r.issues.filter((i) => i.sev === s);
  const lines = [`${label} ${TYPE_VI[r.type]}${r.id ? ` (${r.id})` : ""}: ${by("block").length ? "CHẶN" : by("soft").length ? "NHẸ" : "ĐẸP"}`];
  for (const s of ["block", "soft", "good"]) for (const i of by(s)) lines.push(`  [${SEV_VI[s]}] ${i.code}: ${i.text}`);
  lines.push(`  số đo: ${JSON.stringify(r.metrics)}`, `  cần mắt duyệt: ${r.manual.join("; ")}`);
  return lines.join("\n");
}
export const verdict = (r) => (r.issues.some((i) => i.sev === "block") ? "block" : r.issues.some((i) => i.sev === "soft") ? "soft" : "good");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  const [mode, file] = a, type = val("--type");
  if (!["raw", "pixel"].includes(mode) || !file || !type) { console.error("Dùng: npm run vohon:check -- raw|pixel <ảnh.png> --type portrait|icon|phaptuong [--id <võ hồn>] [--report <json>] [--json <ra.json>]"); process.exit(2); }
  try {
    const img = readPng(file), report = val("--report") && JSON.parse(readFileSync(val("--report"), "utf8"));
    const r = mode === "raw" ? checkRaw(img, { type, id: val("--id") }) : checkPixel(img, { type, id: val("--id"), report });
    console.log(formatResult(r, `${mode} ${path.basename(file)}`));
    if (val("--json")) writeFileSync(val("--json"), JSON.stringify(r, null, 2));
    process.exit(verdict(r) === "block" ? 1 : 0);
  } catch (e) { console.error(e.message); process.exit(2); }
}
