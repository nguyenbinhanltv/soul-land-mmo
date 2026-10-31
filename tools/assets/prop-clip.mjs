// Thí điểm #1498: nhập tờ Codex 4×2, tách thân tĩnh và ghép clip cùng điểm chân.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { ROOT, Img, readPng, encodePng, allowedColors, accentColors, hex } from "./lib.mjs";

const [name, rawFile, sourceDate = new Date().toLocaleDateString("sv-SE")] = process.argv.slice(2);
const lanterns = [[7,22,9,8], [7,30,10,10], [7,40,10,13], [33,17,10,11], [33,29,10,8], [33,37,10,10], [33,48,10,12]];
const specs = { cot_den_do: { region: [6,17,38,43], lanterns }, cot_co_do_vang: { region: [10, 19, 18, 35], cloth: true }, lua_trai: { region: [31, 2, 18, 23] }, dai_phun_nuoc: { region: [34, 0, 13, 12] }, lo_ren_lang: { region: [66, 52, 13, 13], inset: true }, lo_lua_dong: { region: [8, 5, 32, 24], clearFlame: true, coalY: 25 } };
const spec = specs[name];
if (!spec || !rawFile || !/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) throw new Error("prop-clip.mjs lua_trai|dai_phun_nuoc|lo_ren_lang|lo_lua_dong|cot_co_do_vang|cot_den_do <tờ Codex 4×2.png> [ngày nguồn YYYY-MM-DD]");
const fire = name !== "dai_phun_nuoc", dir = path.join(ROOT, "art/src/prop-clip", name);
mkdirSync(dir, { recursive: true });
const raw = readPng(rawFile), originalFile = path.join(ROOT, `shared/assets/sprites/iso/props/${name}.png`), original = readPng(originalFile);
const base = new Img(original.w, original.h, original.data.slice());
// Chỉ lấy lửa, tia nước hoặc vải cờ; giữ nguyên thân và dải nối cờ với cột.
const region = spec.region;
const [rx, ry, rw, rh] = region;
const warm = ([r, , b, a]) => a && r > 125 && r > b * 1.35;
const protectedAt = (x, y) => {
  if (spec.lanterns) {
    const box = lanterns.find(([l,t,w,h]) => x >= l-1 && x < l+w+1 && y >= t && y < t+h);
    // Mặt nạ theo vị trí: không giữ sót màu cam/vàng thuộc thân đèn cũ.
    return !box || y < box[1]+2;
  }

  return spec.cloth ? x >= 26 || y <= 21 : spec.inset && !warm(original.get(x, y));
};
for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
  const [r, g, b, a] = base.get(x, y);
  if (spec.cloth || spec.lanterns) { if (!protectedAt(x, y)) base.set(x, y, [0, 0, 0, 0]); continue; }
  // Lò đồng: bỏ cả viền lửa cũ; miệng bát có lớp than đục nên lửa rút không nhìn xuyên nền.
  if (spec.clearFlame) { base.set(x, y, y >= spec.coalY && a ? [42, 27, 20, 255] : [0, 0, 0, 0]); continue; }
  if (a && (fire ? warm([r, g, b, a]) : b > r * 1.08 && b > g * 0.95)) base.set(x, y, spec.inset ? [26, 16, 32, 255] : [0, 0, 0, 0]);
}
const palette = spec.cloth || spec.lanterns ? [...new Map(Array.from({length: original.w * original.h}, (_, i) => original.get(i % original.w, Math.floor(i / original.w))).filter(c => c[3]).map(c => [c.slice(0,3).join(), c.slice(0,3)])).values()] : [...new Set([...allowedColors(), ...accentColors()])].map(hex);
const nearest = (c) => palette.reduce((best, p) => {
  const d = (q) => q.reduce((s, v, i) => s + (v - c[i]) ** 2, 0);
  return d(p) < d(best) ? p : best;
});
const boxes = [];
for (let n = 0; n < 8; n++) {
  const x0 = Math.floor(n % 4 * raw.w / 4), x1 = Math.floor((n % 4 + 1) * raw.w / 4);
  const y0 = Math.floor(Math.floor(n / 4) * raw.h / 2), y1 = Math.floor((Math.floor(n / 4) + 1) * raw.h / 2);
  let l = x1, t = y1, r = x0, b = y0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (raw.alpha(x, y) >= 160) { l = Math.min(l, x); t = Math.min(t, y); r = Math.max(r, x); b = Math.max(b, y); }
  if (r <= l || b <= t) throw new Error(`Khung trống ${n}`);
  boxes.push([l, t, r, b]);
}
const scale = Math.min(rw / Math.max(...boxes.map(([l,,r]) => r - l + 1)), rh / Math.max(...boxes.map(([,t,,b]) => b - t + 1)));
// Tờ Codex dẫn pha nghiêng của tua; giữ nguyên pixel/màu và dáng đèn đã duyệt.
const sway = spec.lanterns ? boxes.map(([l,t,r,b]) => {
  let sum = 0, count = 0;
  for (let y = Math.floor(t + (b-t)*0.8); y <= b; y++) for (let x = l; x <= r; x++) if (raw.alpha(x,y) >= 160) { sum += x - (l+r)/2; count++; }
  return count ? sum/count : 0;
}) : [];
const amplitude = Math.max(1, ...sway.map(v => Math.abs(v)));
const layers = boxes.map(([l,t,r,b], phase) => {
  const out = new Img(original.w, original.h), cx = (l + r) / 2;
  if (spec.lanterns) {
    for (const [i, [tx,ty,tw,th]] of lanterns.entries()) {
      const start = i % 8;
      const dx = Math.max(-1, Math.min(1, (sway[(phase+start)%8] - sway[start]) / amplitude));
      for (let y = 2; y < th; y++) for (let x = -1; x <= tw; x++) {
        const shift = Math.round(dx * (y-1)/(th-2));
        const c = original.get(tx+x,ty+y);
        if (c[3] && x+shift >= -1 && x+shift <= tw) out.set(tx+x+shift,ty+y,c);
      }
    }
    return out;
  }
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const sx = Math.round(spec.cloth ? r - (rw - 1 - x) / scale : cx + (x - (rw - 1) / 2) / scale), sy = Math.round(spec.cloth ? t + y / scale : b - (rh - 1 - y) / scale);
    if (sx < l || sx > r || sy < t || sy > b) continue;
    const c = raw.get(sx, sy);
    if (c[3] >= 160 && !protectedAt(rx + x, ry + y)) out.set(rx + x, ry + y, [...nearest(c), 255]);
  }
  return out;
});
const sheet = new Img(original.w * 16, original.h), motion = new Img(original.w * 16, original.h);
for (let n = 0; n < 16; n++) {
  const a = layers[Math.floor(n / 2)], b = layers[(Math.floor(n / 2) + 1) % 8];
  for (let y = 0; y < original.h; y++) for (let x = 0; x < original.w; x++) {
    let c = a.get(x, y);
    if (n % 2) {
      const d = b.get(x, y), alpha = (c[3] + d[3]) / 2;
      c = alpha >= (spec.lanterns ? 127.5 : 128) ? [...nearest(c.slice(0, 3).map((v, i) => (v * c[3] + d[i] * d[3]) / (c[3] + d[3]))), 255] : [0,0,0,0];
    }
    motion.set(n * original.w + x, y, c);
    const under = base.get(x, y), k = c[3] / 255;
    const color = k ? [...nearest(c.slice(0,3).map((v,i) => v * k + under[i] * (1-k))), Math.max(under[3], c[3])] : under;
    sheet.set(n * original.w + x, y, color);
  }
}
writeFileSync(path.join(dir, "than-tinh.png"), encodePng(base));
writeFileSync(path.join(dir, "chuyen-dong.png"), encodePng(motion));
const out = path.join(ROOT, `shared/assets/sprites/iso/props/${name}_clip.png`);
writeFileSync(out, encodePng(sheet));
const sha = (f) => createHash("sha256").update(readFileSync(f)).digest("hex");
writeFileSync(path.join(dir, "nguon.json"), JSON.stringify({ tool: "Codex builtin OpenAI image_gen.imagegen", date: sourceDate, license: "Đầu ra OpenAI, không gán CC0; thân gốc giữ giấy phép/nguồn hiện có", rawSHA256: sha(rawFile), originalSHA256: sha(originalFile), clipSHA256: sha(out), region, ...(spec.lanterns ? { mask: "lantern-seams", lanterns, motion: "Codex tassel centroid; original pixels; horizontal shear <= 1px", sway, rawFile: "RAW.png", nativeSize: [raw.w,raw.h] } : {}), ...(spec.cloth ? { mask: "cloth-seam", rawFile: "RAW.png", nativeSize: [raw.w, raw.h] } : {}), ...(spec.inset ? { mask: "warm-interior" } : {}), ...(spec.clearFlame ? { clearZone: [rx, ry, rw, spec.coalY - ry], solidZone: [rx, spec.coalY, rw, ry + rh - spec.coalY] } : {}), frames: 16, ms: 100 }, null, 2) + "\n");
console.log(out);
