// Ghép năm tờ pháp tướng Lam Ngân Thảo độc lập 4×4: không đăng ký nộm.
// node tools/assets/phaptuong-sheet-cut.mjs <thư-mục-s,se,e,ne,n.png> <sheet.png>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Img, decodePng, encodePng, ISO_DIRS, PT_FRAME, PT_ORIGIN, PT_COLS } from "./lib.mjs";
import { quantize } from "./phuthe-to-phaptuong-lib.mjs";

// Viền nội suy giữa nền hồng và thân xanh không phải màu của cây.
const key = ([r, g, b, a]) => a < 128 || (r - 255) ** 2 + g ** 2 + (b - 255) ** 2 <= 60 ** 2 || (r > 30 && r > g * 1.5 && b > g * 1.5);

export function cutSheets(sheets) {
  const frames = [];
  for (const dir of ISO_DIRS) {
    const im = sheets[dir];
    if (!im || im.w !== im.h) throw new Error(`${dir}: cần tờ vuông 4×4`);
    const cell = im.w / 4;
    for (let f = 0; f < 16; f++) {
      const pixels = [], cx = (f % 4) * cell, cy = Math.floor(f / 4) * cell;
      let left = 256, right = -1, top = 256, bottom = -1;
      for (let y = Math.ceil(cy); y < cy + cell; y++) for (let x = Math.ceil(cx); x < cx + cell; x++) {
        const color = im.get(x, y);
        if (key(color)) continue;
        const u = (x - cx) * 256 / cell, v = (y - cy) * 256 / cell;
        pixels.push([u, v, color]);
        left = Math.min(left, u); right = Math.max(right, u); top = Math.min(top, v); bottom = Math.max(bottom, v);
      }
      if (!pixels.length) throw new Error(`${dir}/${f}: ô rỗng`);
      if (left < 2 || right > 253 || top < 2 || bottom > 253) throw new Error(`${dir}/${f}: hình chạm mép ô`);
      frames.push({ dir, f, pixels, left, right, top, bottom });
    }
  }
  // Chuẩn hóa chiều cao thở theo hướng (model có thể đổi khoảng trống của tờ).
  // Giữ một hệ số trong mỗi hướng, không tự co giãn từng pose đánh.
  const anchors = Object.fromEntries(ISO_DIRS.map((dir) => {
    const f = frames.find((x) => x.dir === dir);
    return [dir, [(f.left + f.right) / 2, f.bottom]];
  }));
  const factors = Object.fromEntries(ISO_DIRS.map((dir) => {
    const heights = frames.filter((f) => f.dir === dir && f.f < 8).map((f) => f.bottom - f.top).sort((a, b) => a - b);
    return [dir, 110 / ((heights[3] + heights[4]) / 2)];
  }));
  let scale = 1;
  for (const f of frames) {
    const [ax] = anchors[f.dir], k = factors[f.dir];
    scale = Math.min(scale, 76 / (Math.max(ax - f.left, f.right - ax) * k), 118 / ((f.bottom - f.top) * k));
  }
  const sheet = new Img(PT_FRAME * PT_COLS, PT_FRAME * ISO_DIRS.length);
  for (const f of frames) {
    const votes = new Map(), [ax] = anchors[f.dir], ay = f.bottom, k = scale * factors[f.dir];
    for (const [u, v, c] of f.pixels) {
      const x = Math.round(PT_ORIGIN[0] + (u - ax) * k), y = Math.round(PT_ORIGIN[1] + (v - ay) * k);
      if (x < 2 || x >= 158 || y < 2 || y >= 158) throw new Error(`${f.dir}/${f.f}: vượt khung 160`);
      const pos = y * PT_FRAME + x, colors = votes.get(pos) ?? new Map(), rgb = c.slice(0, 3).join(",");
      colors.set(rgb, (colors.get(rgb) ?? 0) + 1); votes.set(pos, colors);
    }
    for (const [pos, colors] of votes) {
      const rgb = [...colors].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0].split(",").map(Number);
      sheet.set(f.f * PT_FRAME + pos % PT_FRAME, ISO_DIRS.indexOf(f.dir) * PT_FRAME + Math.floor(pos / PT_FRAME), [...rgb, 255]);
    }
  }
  // RAW nhiều màu nội suy: giới hạn bảng trung gian để median-cut không trải
  // hàng trăm nghìn đối số vào Math.max. Giữ màu viền chuẩn nguyên vẹn.
  for (let i = 0; i < sheet.data.length; i += 4) {
    const d = sheet.data;
    if (!d[i + 3] || (d[i] === 26 && d[i + 1] === 16 && d[i + 2] === 32)) continue;
    for (let c = 0; c < 3; c++) d[i + c] = (d[i + c] >> 3) << 3;
  }
  return { sheet, scale, colors: quantize(sheet) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [src, out] = process.argv.slice(2);
  if (!src || !out) throw new Error("Cần thư mục năm tờ và đường dẫn sheet đầu ra");
  const sheets = Object.fromEntries(ISO_DIRS.map((dir) => [dir, decodePng(readFileSync(path.join(src, `${dir}.png`)))]));
  const result = cutSheets(sheets);
  writeFileSync(out, encodePng(result.sheet));
  console.log(`Đã ghép 80 khung, ${result.colors} màu, hệ số ${result.scale.toFixed(4)}`);
}
