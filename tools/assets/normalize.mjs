// Đưa ảnh thô (PixelLab hoặc nguồn khác) về đúng quy cách khung của mục 5.11.
//   node tools/assets/normalize.mjs --kind honsu|vohon|beast<bậc> --out <thư mục> <ảnh...> [tùy chọn]
//
// Mọi ảnh trong một lần chạy dùng CHUNG một hệ số thu. Ảnh được gom nhóm theo tên bỏ số khung cuối
// (down_walk_0..3 → nhóm down_walk); mỗi nhóm đặt chân theo hộp bao chung của nhóm (đáy hộp = dòng chân,
// giữa hộp = tâm ngang), nên các khung trong một animation không rung dù PixelLab đặt mỗi animation lệch nhau. Các bước:
//   1. Xóa nền: ảnh có kênh alpha thì lấy ngưỡng alpha; ảnh nền đặc thì loang từ 4 góc theo màu góc.
//   2. Bỏ phóng to sẵn (ảnh pixel phóng k lần theo khối k×k) và thu bằng nearest-neighbor nếu vẫn quá khung.
//   3. Đặt chân vào gốc: hồn sư (16,30) trong khung 32×32, phụ thể (24,38) trong 48×48, hồn thú chạm đáy khung.
//   4. Đưa màu về bảng: hồn sư chỉ dùng art/palette.gpl (bỏ nhóm máu, mắt hung hăng, lửa; điểm tông da về 3 sắc da);
//      phụ thể và hồn thú thêm col/robe của VOHON (kèm 1 tối, 1 sáng) và màu hồn hoàn, hoặc chỉ của một võ hồn (--vohon).
//      Điểm gần xám (độ bão hòa thấp) về dải 4 xám chuẩn để hoán màu được; điểm rất tối ở mép ngoài thành viền #1a1020.
//
// Tùy chọn:
//   --gray none|auto|all   none: không ép xám; auto (mặc định): điểm bão hòa < --sat về dải xám; all: mọi điểm về dải xám
//                          (dùng cho lớp tóc/áo tách riêng).
//   --sat 0.16             ngưỡng độ bão hòa cho --gray auto.
//   --scale auto|<số>      auto (mặc định): bỏ phóng to sẵn, chỉ thu khi vượt khung; số: hệ số thu cố định (0.5 = thu nửa).
//   --max-h <px>           chiều cao tối đa của hình sau khi thu (mặc định: hồn sư 31 = từ đỉnh khung tới chân, phụ thể và hồn thú = cao khung).
//   --anchor x,y           gốc chân trong khung (mặc định theo --kind).
//   --colors a,b,…         thêm màu được phép (ví dụ col/robe đang dùng cho phụ thể đã có sẵn trong bảng thì không cần).
//   --split                (hồn sư) tách một hình vẽ liền thành 3 lớp theo MÀU KHÓA: tóc vẽ màu lam (sắc độ trong
//                          --hair-hue, mặc định 190-260), áo vẽ xám; ghi vào <out>/body, <out>/hair, <out>/outfit.
//                          Tóc và áo được đưa về dải 4 xám; nét viền thuộc lớp có nhiều điểm kề nhất.
//   --vohon <id>           (phụ thể) chỉ dùng palette.gpl + col/robe của võ hồn <id> (kèm 1 tối, 1 sáng mỗi màu).
//   --halves <y>           (phụ thể) tách theo dòng y: phần trên → <out>/b (sau thân), từ y trở xuống → <out>/f
//                          (trước thân). Hợp với phụ thể nằm dưới đất quanh chân (thảm dây leo, vòng); phụ thể
//                          trên tay/lưng cần tách tay theo từng hướng (xem skill asset-gen).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { decodePng, encodePng, Img, hex, allowedColors, readGpl, paletteGroup, vohonColors, shadesOf, GRAY_RAMP, OUTLINE, HS_FRAME, VH_FRAME, HS_ORIGIN, VH_ORIGIN, BEAST_FRAMES } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const kind = opt("--kind", "honsu"), outDir = opt("--out", "");
const grayMode = opt("--gray", "auto"), sat = +opt("--sat", "0.16"), scaleOpt = opt("--scale", "auto");
const extra = opt("--colors", "");
const [hue0, hue1] = opt("--hair-hue", "190-260").split("-").map(Number);
const splitAt = args.indexOf("--split"), split = splitAt >= 0 && !!args.splice(splitAt, 1);
const vohonId = opt("--vohon", ""), halves = +opt("--halves", "-1");
const anchor = opt("--anchor", ""), maxH = opt("--max-h", "");
// Đọc hết tùy chọn ở trên rồi mới lấy danh sách ảnh (bản sao, không dùng chung mảng args).
const files = [...args];
if (!outDir || !files.length) { console.error("Cách dùng: normalize.mjs --kind honsu|vohon|beast<bậc> --out <thư mục> <ảnh...>"); process.exit(1); }

// Khung, gốc và chiều cao tối đa theo loại.
let FW, FH, AX, AY, MAXH;
if (kind === "honsu") { FW = FH = HS_FRAME; [AX, AY] = HS_ORIGIN; MAXH = AY + 1; }
else if (kind === "vohon") { FW = FH = VH_FRAME; [AX, AY] = VH_ORIGIN; MAXH = FH; }
else if (/^beast\d$/.test(kind)) { [FW, FH] = BEAST_FRAMES[+kind.slice(5)]; AX = FW >> 1; AY = FH - 1; MAXH = FH; }
else { console.error(`--kind không hợp lệ: ${kind}`); process.exit(1); }
if (anchor) [AX, AY] = anchor.split(",").map(Number);
if (maxH) MAXH = +maxH;

const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
const satOf = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };

/** 1. Xóa nền → ảnh chỉ còn điểm alpha 0 hoặc 255. */
function removeBackground(img) {
  const out = new Img(img.w, img.h, Uint8Array.from(img.data));
  let hasAlpha = false;
  for (let i = 3; i < out.data.length; i += 4) if (out.data[i] < 250) { hasAlpha = true; break; }
  if (hasAlpha) { for (let i = 3; i < out.data.length; i += 4) out.data[i] = out.data[i] >= 128 ? 255 : 0; return out; }
  // Nền đặc: loang từ 4 góc, gộp điểm gần màu góc (sai khác ≤ 24 mỗi kênh).
  const seen = new Uint8Array(img.w * img.h), stack = [];
  for (const [x, y] of [[0, 0], [img.w - 1, 0], [0, img.h - 1], [img.w - 1, img.h - 1]]) stack.push([x, y, img.get(x, y)]);
  while (stack.length) {
    const [x, y, ref] = stack.pop();
    if (x < 0 || y < 0 || x >= img.w || y >= img.h || seen[y * img.w + x]) continue;
    const p = img.get(x, y);
    if (Math.max(...[0, 1, 2].map((i) => Math.abs(p[i] - ref[i]))) > 24) continue;
    seen[y * img.w + x] = 1; out.set(x, y, [0, 0, 0, 0]);
    stack.push([x + 1, y, ref], [x - 1, y, ref], [x, y + 1, ref], [x, y - 1, ref]);
  }
  return out;
}

function bbox(img) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return x1 < 0 ? null : { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** 2a. Hệ số phóng to sẵn: k lớn nhất sao cho ảnh gồm các khối k×k đồng màu (thẳng lưới từ góc bbox). */
function blockFactor(img, b) {
  for (let k = 8; k >= 2; k--) {
    if (b.w % k || b.h % k) continue;
    let ok = true;
    for (let y = b.y0; y <= b.y1 && ok; y++) for (let x = b.x0; x <= b.x1 && ok; x++) {
      const bx = b.x0 + Math.floor((x - b.x0) / k) * k, by = b.y0 + Math.floor((y - b.y0) / k) * k;
      const p = img.get(x, y), q = img.get(bx, by);
      if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2] || p[3] !== q[3]) ok = false;
    }
    if (ok) return k;
  }
  return 1;
}

/** 4. Bộ ánh xạ màu: gần nhất theo khoảng cách RGB có trọng số. */
// Hồn sư chỉ dùng bảng chung palette.gpl (màu col/robe là của phụ thể võ hồn), trừ màu máu, mắt hung hăng, lửa
// dành cho hồn thú: bóng tối ám đỏ ở mép tóc hay rơi vào đó.
const banned = new Set(kind === "honsu" ? ["Máu", "Mắt hung hăng", "Lửa"].flatMap(paletteGroup) : []);
// Phụ thể có --vohon <id>: chỉ palette.gpl + col/robe của đúng võ hồn đó (kèm 1 tối, 1 sáng mỗi màu).
const own = vohonId ? vohonColors(vohonId) : null;
if (vohonId && !own) { console.error(`--vohon: không có võ hồn ${vohonId} trong shared/data.ts`); process.exit(1); }
const base = kind === "honsu" ? readGpl() : own ? [...readGpl(), ...own.flatMap((c) => [c, ...shadesOf(c)])] : [...allowedColors()];
const allowed = [...base, ...extra.split(",").filter(Boolean)].filter((c) => !banned.has(c)).map((c) => [c, hex(c)]);
const gray = GRAY_RAMP.map((c) => [c, hex(c)]);
const dist = (a, b) => { const r = (a[0] + b[0]) / 2, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return (2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db; };
const nearest = (p, set) => set.reduce((best, c) => (dist(p, c[1]) < dist(p, best[1]) ? c : best))[1];
const toGray = (l) => gray.reduce((best, c) => (Math.abs(lum(c[1]) - l) < Math.abs(lum(best[1]) - l) ? c : best))[1];
function mapColor(p, edge, mode = grayMode) {
  const l = lum(p);
  if (edge && l < 70) return hex(OUTLINE);       // viền ngoài tối → #1a1020
  if (l < 40) return hex(OUTLINE);                // gần đen ở trong cũng là nét viền
  if (mode === "all" || (mode === "auto" && satOf(p) < sat)) return toGray(l); // xám theo độ sáng
  // Hồn sư: điểm tông da (đỏ cam, kể cả bóng da đỏ dưới tóc và cổ mà PixelLab hay vẽ) về 3 sắc da theo độ sáng.
  // Lấy màu gần nhất thì bóng da thành mảng màu má/máu rất chói ở 32×32.
  const h = hueOf(p);
  // Giày nâu (cam đậm, sắc > 33°) và mắt đỏ rực (bão hòa > 0,6) không tính là da.
  if (kind === "honsu" && l >= 70 && h >= 0 && (h <= 33 || h >= 345 || (h <= 45 && satOf(p) < 0.5)) && satOf(p) >= 0.15 && satOf(p) <= 0.6) return toSkin(l);
  return nearest(p, allowed);
}
const SKIN = paletteGroup("Da ").map(hex); // tối, gốc, sáng
const toSkin = (l) => SKIN.reduce((best, c) => (Math.abs(lum(c) - l) < Math.abs(lum(best) - l) ? c : best));
const hueOf = ([r, g, b]) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return -1;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
/** Loại lớp của một điểm theo màu khóa: 0 thân, 1 tóc (lam), 2 áo (xám), -1 nét viền (quyết sau). */
function layerOf(p) {
  const l = lum(p), h = hueOf(p);
  // Tóc xét trước ngưỡng tối: lam đậm vẫn là tóc chứ không phải nét viền (viền #1a1020-ish có sắc tím, ngoài dải lam).
  // Ánh sáng trên tóc lam nhạt gần trắng nên cho phép bão hòa thấp hơn khi rất sáng.
  if (l >= 35 && h >= hue0 && h <= hue1 && (satOf(p) >= 0.25 || (satOf(p) >= 0.12 && l >= 180))) return 1;
  if (l < 70) return -1;
  // Da rất nhạt (hồng phấn) có độ bão hòa thấp, phải giữ ở lớp thân chứ không thành áo xám.
  if ((h <= 45 || h >= 340) && h >= 0 && satOf(p) >= 0.08) return 0;
  if (satOf(p) < sat) return 2;
  return 0;
}
/** Tách khung đã đặt vào khung chuẩn thành 3 ảnh thân/tóc/áo. */
function splitLayers(out) {
  const W = out.w, H = out.h, cls = new Int8Array(W * H).fill(-2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (out.alpha(x, y)) cls[y * W + x] = layerOf(out.get(x, y));
  // Ánh sáng trên tóc gần trắng/xám bị xếp nhầm vào áo: điểm "áo" mà phần lớn điểm kề là tóc thì trả về tóc.
  const near = (x, y, k) => {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy;
      if ((dx || dy) && X >= 0 && Y >= 0 && X < W && Y < H && cls[Y * W + X] === k) n++;
    }
    return n;
  };
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (cls[y * W + x] === 2 && near(x, y, 1) >= 3 && near(x, y, 1) > near(x, y, 2)) cls[y * W + x] = 1;
  }
  // Bóng xanh tím trên quần áo (PixelLab hay dùng ở khung animation) cũng rơi vào dải lam: mảng tóc liền (8 hướng)
  // nhỏ hơn 1/4 mảng lớn nhất VÀ nằm hẳn dưới đáy mảng lớn nhất thì trả về lớp thân (lọn tóc rời cạnh mặt vẫn giữ).
  const comp = new Int32Array(W * H).fill(-1), sizes = [], tops = [], bottoms = [];
  for (let i = 0; i < W * H; i++) {
    if (cls[i] !== 1 || comp[i] >= 0) continue;
    const id = sizes.length, stack = [i]; let n = 0, top = H, bottom = -1; comp[i] = id;
    while (stack.length) {
      const j = stack.pop(), x = j % W, y = (j / W) | 0; n++; top = Math.min(top, y); bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy, k = Y * W + X;
        if (X >= 0 && Y >= 0 && X < W && Y < H && cls[k] === 1 && comp[k] < 0) { comp[k] = id; stack.push(k); }
      }
    }
    sizes.push(n); tops.push(top); bottoms.push(bottom);
  }
  const main = sizes.indexOf(Math.max(0, ...sizes));
  for (let i = 0; i < W * H; i++) {
    const c = comp[i];
    if (cls[i] === 1 && c !== main && sizes[c] * 4 < sizes[main] && tops[c] > bottoms[main]) cls[i] = 0;
  }
  // Nét viền thuộc lớp có nhiều điểm kề (8 hướng) nhất; hòa thì ưu tiên tóc > áo > thân (lớp vẽ sau che lớp trước).
  const fixed = Int8Array.from(cls);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (cls[y * W + x] !== -1) continue;
    const n = [0, 0, 0];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < W && Y < H && cls[Y * W + X] >= 0) n[cls[Y * W + X]]++;
    }
    fixed[y * W + x] = n[1] && n[1] >= n[0] && n[1] >= n[2] ? 1 : n[2] && n[2] >= n[0] ? 2 : 0;
  }
  return [0, 1, 2].map((k) => {
    const img = new Img(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (fixed[y * W + x] === k) img.set(x, y, out.get(x, y));
    return img;
  });
}

// ---------- Chạy ----------
const imgs = files.map((f) => removeBackground(decodePng(readFileSync(f))));
const ref = bbox(imgs[0]);
if (!ref) { console.error(`${files[0]}: ảnh trống sau khi xóa nền`); process.exit(1); }
// Hộp bao chung của mọi khung (cùng canvas gốc) để biết chiều cao thật khi chuyển động.
const all = imgs.map(bbox).filter(Boolean).reduce((a, b) => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }));
let k = scaleOpt === "auto" ? blockFactor(imgs[0], ref) : 1;
let s = scaleOpt === "auto" ? 1 / k : +scaleOpt;
const tallest = (all.y1 - all.y0 + 1) * s;
if (scaleOpt === "auto" && tallest > MAXH) s *= MAXH / tallest;
// Mỗi nhóm animation: chân = đáy hộp bao chung, tâm ngang = giữa hộp bao chung.
const groupOf = (f) => path.basename(f, ".png").replace(/_\d+$/, "");
const anchors = new Map();
for (const [n, img] of imgs.entries()) {
  const b = bbox(img), g = groupOf(files[n]), a = anchors.get(g);
  if (b) anchors.set(g, a ? { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) } : b);
}

// Đặt mọi khung vào khung chuẩn (nearest-neighbor ngược: điểm đích (X,Y) ← điểm nguồn tương ứng).
const placed = imgs.map((img, n) => {
  const a = anchors.get(groupOf(files[n])) ?? ref, footY = a.y1, cx = (a.x0 + a.x1 + 1) / 2;
  const out = new Img(FW, FH);
  for (let Y = 0; Y < FH; Y++) for (let X = 0; X < FW; X++) {
    const sx = Math.floor(cx + (X + 0.5 - AX) / s), sy = Math.floor(footY + 1 + (Y + 0.5 - AY - 1) / s);
    if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h || !img.alpha(sx, sy)) continue;
    out.set(X, Y, img.get(sx, sy));
  }
  // Hình tràn khỏi khung thì báo để người làm biết mà chỉnh --anchor/--max-h.
  const b = bbox(img);
  const lost = b && (AX + (b.x0 - cx) * s < 0 || AX + (b.x1 + 1 - cx) * s > FW || AY + 1 + (b.y0 - footY - 1) * s < 0);
  return { out, lost, layers: split ? splitLayers(out) : [out] };
});

// Dải xám theo khoảng sáng của từng lớp trên MỌI khung (tối nhất → #3a3a3a, sáng nhất → #cacaca),
// để tóc lam hay áo xám nhạt đều trải đủ 4 sắc độ và các khung dùng cùng một ánh xạ.
const ranges = (split ? [0, 1, 2] : [0]).map((k) => {
  let lo = 255, hi = 0;
  for (const p of placed) {
    const img = p.layers[k];
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      if (!img.alpha(x, y)) continue;
      const p = img.get(x, y), l = lum(p);
      if (split ? layerOf(p) === k : l >= 70) { lo = Math.min(lo, l); hi = Math.max(hi, l); }
    }
  }
  return [lo, hi];
});
const rampOf = (l, [lo, hi]) => hex(GRAY_RAMP[hi > lo ? Math.max(0, Math.min(3, Math.round(((l - lo) / (hi - lo)) * 3))) : 2]);

mkdirSync(outDir, { recursive: true });
for (const [n, { out, lost, layers }] of placed.entries()) {
  // Mép ngoài tính theo cả hình (kể cả khi tách lớp) để nét viền ngoài luôn là #1a1020.
  const edgeOf = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= FW || Y >= FH || !out.alpha(X, Y); });
  const recolor = (img, mode, range) => {
    const m = new Img(FW, FH);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      if (!img.alpha(x, y)) continue;
      const p = img.get(x, y), e = edgeOf(x, y), l = lum(p);
      const fill = split ? layerOf(p) >= 1 : l >= 40 && !(e && l < 70); // điểm tô (không phải nét viền)
      const c = mode === "all" && fill ? rampOf(l, range) : mapColor(p, e, mode);
      m.set(x, y, [...c, 255]);
    }
    return m;
  };
  const name = path.basename(files[n]), warnLost = lost ? "  (CẢNH BÁO: hình tràn khung, bị cắt)" : "";
  if (split) {
    for (const [i, sub, mode] of [[0, "body", "none"], [1, "hair", "all"], [2, "outfit", "all"]]) {
      mkdirSync(path.join(outDir, sub), { recursive: true });
      writeFileSync(path.join(outDir, sub, name), encodePng(recolor(layers[i], mode, ranges[i])));
    }
    console.log(`[normalize] ${path.join(outDir, "{body,hair,outfit}", name)}${warnLost}`);
  } else if (halves >= 0) {
    // Phụ thể: điểm trên dòng --halves nằm sau thân (b), từ dòng đó trở xuống nằm trước thân (f).
    const all = recolor(out, grayMode, ranges[0]);
    for (const [sub, keep] of [["b", (y) => y < halves], ["f", (y) => y >= halves]]) {
      const img = new Img(FW, FH);
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (keep(y) && all.alpha(x, y)) img.set(x, y, all.get(x, y));
      mkdirSync(path.join(outDir, sub), { recursive: true });
      writeFileSync(path.join(outDir, sub, name), encodePng(img));
    }
    console.log(`[normalize] ${path.join(outDir, "{b,f}", name)}${warnLost}`);
  } else {
    const dst = path.join(outDir, name);
    writeFileSync(dst, encodePng(recolor(out, grayMode, ranges[0])));
    console.log(`[normalize] ${dst}${warnLost}`);
  }
}
console.log(`[normalize] ${imgs.length} ảnh, khung ${FW}×${FH}, gốc (${AX},${AY}), hệ số ${s === 1 ? "1" : s.toFixed(3)}${k > 1 ? ` (bỏ phóng to ×${k})` : ""}`);
