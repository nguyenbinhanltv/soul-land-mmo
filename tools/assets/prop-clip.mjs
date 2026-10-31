// Thí điểm #1498: nhập tờ Codex 4×2, tách thân tĩnh và ghép clip cùng điểm chân.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { ROOT, Img, readPng, encodePng, allowedColors, accentColors, hex } from "./lib.mjs";

const [name, rawFile, sourceDate = new Date().toLocaleDateString("sv-SE")] = process.argv.slice(2);
const specs = { lua_trai: { region: [31, 2, 18, 23] }, dai_phun_nuoc: { region: [34, 0, 13, 12] }, lo_ren_lang: { region: [66, 52, 13, 13], inset: true }, lo_lua_dong: { region: [8, 5, 32, 24], clearFlame: true, coalY: 25 } };
const spec = specs[name];
if (!spec || !rawFile || !/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) throw new Error("prop-clip.mjs lua_trai|dai_phun_nuoc|lo_ren_lang|lo_lua_dong <tờ Codex 4×2.png> [ngày nguồn YYYY-MM-DD]");
const fire = name !== "dai_phun_nuoc", dir = path.join(ROOT, "art/src/prop-clip", name);
mkdirSync(dir, { recursive: true });
const raw = readPng(rawFile), originalFile = path.join(ROOT, `shared/assets/sprites/iso/props/${name}.png`), original = readPng(originalFile);
const base = new Img(original.w, original.h, original.data.slice());
// Chỉ lấy ngọn lửa, hoặc tia nước trên đỉnh; giữ nguyên củi/đá, trụ và thành bể.
const region = spec.region;
const [rx, ry, rw, rh] = region;
const warm = ([r, , b, a]) => a && r > 125 && r > b * 1.35;
const protectedAt = (x, y) => spec.inset && !warm(original.get(x, y));
for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) {
  const [r, g, b, a] = base.get(x, y);
  // Lò đồng: bỏ cả viền lửa cũ; miệng bát có lớp than đục nên lửa rút không nhìn xuyên nền.
  if (spec.clearFlame) { base.set(x, y, y >= spec.coalY && a ? [42, 27, 20, 255] : [0, 0, 0, 0]); continue; }
  if (a && (fire ? warm([r, g, b, a]) : b > r * 1.08 && b > g * 0.95)) base.set(x, y, spec.inset ? [26, 16, 32, 255] : [0, 0, 0, 0]);
}
const palette = [...new Set([...allowedColors(), ...accentColors()])].map(hex);
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
const layers = boxes.map(([l,t,r,b]) => {
  const out = new Img(original.w, original.h), cx = (l + r) / 2;
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const sx = Math.round(cx + (x - (rw - 1) / 2) / scale), sy = Math.round(b - (rh - 1 - y) / scale);
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
      c = alpha >= 128 ? [...nearest(c.slice(0, 3).map((v, i) => (v * c[3] + d[i] * d[3]) / (c[3] + d[3]))), 255] : [0,0,0,0];
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
writeFileSync(path.join(dir, "nguon.json"), JSON.stringify({ tool: "Codex builtin OpenAI image_gen.imagegen", date: sourceDate, license: "Đầu ra OpenAI, không gán CC0; thân gốc giữ giấy phép/nguồn hiện có", rawSHA256: sha(rawFile), originalSHA256: sha(originalFile), clipSHA256: sha(out), region, ...(spec.inset ? { mask: "warm-interior" } : {}), ...(spec.clearFlame ? { clearZone: [rx, ry, rw, spec.coalY - ry], solidZone: [rx, spec.coalY, rw, ry + rh - spec.coalY] } : {}), frames: 16, ms: 100 }, null, 2) + "\n");
console.log(out);
