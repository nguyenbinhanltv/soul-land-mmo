// Trang xem trước để DUYỆT BẰNG MẮT ảnh võ hồn v2 sau khi chuyển pixel (#1087, epic #1020): RAW cạnh bản pixel + thẻ SR / SSR / UR (chân dung),
// icon ở nhiều cỡ trên nền tối / sáng, pháp tướng 5 hướng (cả 3 hướng tây lật ngang). Ghi `index.html` và `so-sanh.png` vào thư mục ra.
//   node tools/assets/vohon-preview.mjs --type portrait --id <võ hồn> --raw <raw.png> --pixel <64.png> --out <thư mục>
//   node tools/assets/vohon-preview.mjs --type icon --id <võ hồn> --raw <raw.png> --pixel <32.png>,<24.png> --out <thư mục>
//   node tools/assets/vohon-preview.mjs --type phaptuong --id <võ hồn> --raw <tờ.png> --pixel <dải 5 khung.png> --out <thư mục>
// Khung thẻ thật (`card_sr/ssr/ur` ở shared/assets/sprites/iso/ui/) dùng nếu có trong repo; chưa có thì vẽ khung giả đơn sắc (ghi rõ trên trang).
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, readPng, encodePng, Img, hex, vohonColors, OUTLINE } from "./lib.mjs";
import { TYPES, TYPE_VI, PT_DIRS } from "./vohon-pixelize-lib.mjs";

const CARD = [96, 152], WINDOW = [16, 20], RARITY = { sr: "#7a8fa6", ssr: "#d8a838", ur: "#d8484f" };
const FRAME_DIR = path.join(ROOT, "shared", "assets", "sprites", "iso", "ui");

/** Thu hộp-trung-bình về cạnh dài `side` (chỉ để xem, giữ nền). */
export function shrink(img, side) {
  const k = Math.max(img.w, img.h) / side, W = Math.max(1, Math.round(img.w / k)), H = Math.max(1, Math.round(img.h / k)), o = new Img(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const x0 = Math.floor(x * k), x1 = Math.max(x0 + 1, Math.floor((x + 1) * k)), y0 = Math.floor(y * k), y1 = Math.max(y0 + 1, Math.floor((y + 1) * k)); let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let j = y0; j < Math.min(y1, img.h); j++) for (let i = x0; i < Math.min(x1, img.w); i++) { const p = img.get(i, j); r += p[0] * p[3]; g += p[1] * p[3]; b += p[2] * p[3]; a += p[3]; n++; }
    o.set(x, y, a ? [r / a, g / a, b / a, a / n].map(Math.round) : [0, 0, 0, 0]);
  }
  return o;
}
/** Phóng nguyên khối ×k, đặt lên nền `bg` (chỉ để xem). */
export function scaleUp(img, k, bg = null) {
  const o = new Img(img.w * k, img.h * k);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const p = img.get((x / k) | 0, (y / k) | 0); o.set(x, y, p[3] < 128 ? (bg ? [...bg, 255] : [0, 0, 0, 0]) : p); }
  return o;
}
/** Thẻ giả 96×152: nền tối quầng màu võ hồn, cửa sổ chân dung, viền màu độ hiếm, tấm biển tên. Khung thật thì thay ở trang HTML. */
export function fakeCard(portrait, rarity, col) {
  const c = new Img(...CARD), bg = hex(OUTLINE), tint = hex(col), rim = hex(RARITY[rarity]);
  for (let y = 0; y < CARD[1]; y++) for (let x = 0; x < CARD[0]; x++) { const t = Math.max(0, 1 - Math.hypot(x - 48, y - 55) / 60) * 0.5; c.set(x, y, [0, 1, 2].map((i) => Math.round(bg[i] + (tint[i] - bg[i]) * t)).concat(255)); }
  const bd = (x, y, w) => x < w || y < w || x >= CARD[0] - w || y >= CARD[1] - w;
  c.blit(portrait, 0, 0, portrait.w, portrait.h, ...WINDOW, true);
  for (let y = 0; y < CARD[1]; y++) for (let x = 0; x < CARD[0]; x++) if (bd(x, y, 2) || (y > 132 && y < 146 && x > 10 && x < 86)) c.set(x, y, bd(x, y, 2) ? [...rim, 255] : [...bg.map((v) => v + 10), 255]);
  return c;
}
const pngUrl = (img) => `data:image/png;base64,${encodePng(img).toString("base64")}`;

export function buildPreview({ type, id, raw, pixels, out }) {
  if (!TYPES.includes(type)) throw new Error(`--type phải là ${TYPES.join(" | ")}`);
  mkdirSync(out, { recursive: true });
  const col = (id && vohonColors(id)?.[0]) ?? "#cc6633", rawImg = readPng(raw), px = pixels.map((f) => ({ name: path.basename(f), img: readPng(f) })), rawView = shrink(rawImg, 192);
  for (const p of px) copyFileSync(pixels[px.indexOf(p)], path.join(out, p.name));
  writeFileSync(path.join(out, "raw-thu-nho.png"), encodePng(rawView));
  const bgs = [[26, 16, 32], [200, 190, 170]], cells = [];
  let compare;
  if (type === "portrait") {
    const p = px[0].img, big = scaleUp(p, 3, [26, 16, 32]), cards = Object.keys(RARITY).map((r) => fakeCard(p, r, col));
    const W = 192 + 8 + 192 + 8 + 64 + 8 + cards.length * (CARD[0] + 4), H = Math.max(192, CARD[1]); compare = new Img(W, H);
    let x = 0; compare.blit(scaleUp(rawView, 1, [26, 16, 32]), 0, 0, rawView.w, rawView.h, x, 0); x += 200; compare.blit(big, 0, 0, big.w, big.h, x, 0); x += 200; compare.blit(scaleUp(p, 1, [26, 16, 32]), 0, 0, 64, 64, x, 0); x += 72;
    for (const c of cards) { compare.blit(c, 0, 0, c.w, c.h, x, 0); x += CARD[0] + 4; }
    const real = Object.keys(RARITY).every((r) => existsSync(path.join(FRAME_DIR, `card_${r}.png`)));
    for (const r of Object.keys(RARITY)) { if (real) copyFileSync(path.join(FRAME_DIR, `card_${r}.png`), path.join(out, `khung-${r}.png`)); }
    cells.push(`<h2>RAW → pixel ${p.w}×${p.h} (phóng ×3)</h2><div class="r"><figure><img src="raw-thu-nho.png" width="192" height="192"><figcaption>RAW (thu nhỏ để xem)</figcaption></figure><figure><img class="g" src="${px[0].name}" width="192" height="192"><figcaption>pixel ×3</figcaption></figure><figure><img class="g" src="${px[0].name}" width="64" height="64"><figcaption>cỡ thật 1×</figcaption></figure></div>`);
    cells.push(`<h2>Thẻ SR / SSR / UR</h2><p class="n">${real ? "Khung thật `card_*` trong repo." : "Khung GIẢ đơn sắc (ảnh `card_sr/ssr/ur` chưa có trong repo): chỉ để xem chân dung nằm trong cửa sổ thẻ 96×152; nền, bố cục thật theo `cards.ts`."} Phóng ×2.</p><div class="r">${Object.keys(RARITY).map((r) => `<figure class="card" style="--c:${col};--rim:${RARITY[r]}"><div class="cw"><i class="cbg"></i><img class="g cpt" src="${px[0].name}" width="64" height="64">${real ? `<img class="g cfr" src="khung-${r}.png">` : `<i class="cfk"></i>`}</div><figcaption>${r.toUpperCase()}</figcaption></figure>`).join("")}</div>`);
  } else if (type === "icon") {
    const items = px.sort((a, b) => b.img.w - a.img.w), W = 192 + 8 + items.length * 200, H = 192 + 8 + 96; compare = new Img(W, H);
    compare.blit(scaleUp(rawView, 1, [26, 16, 32]), 0, 0, rawView.w, rawView.h, 0, 0);
    items.forEach((p, i) => { const k = Math.floor(192 / p.img.w); compare.blit(scaleUp(p.img, k, bgs[i % 2]), 0, 0, p.img.w * k, p.img.w * k, 200 + i * 200, 0); compare.blit(scaleUp(p.img, 1, bgs[0]), 0, 0, p.img.w, p.img.w, 200 + i * 200, 200); compare.blit(scaleUp(p.img, 3, bgs[1]), 0, 0, p.img.w * 3, p.img.w * 3, 200 + i * 200 + 40, 200); });
    cells.push(`<h2>RAW → icon</h2><div class="r"><figure><img src="raw-thu-nho.png" width="192" height="192"><figcaption>RAW (thu nhỏ để xem)</figcaption></figure>${items.map((p) => `<figure><img class="g" src="${p.name}" width="${p.img.w * Math.floor(192 / p.img.w)}" height="${p.img.w * Math.floor(192 / p.img.w)}"><figcaption>${p.img.w}×${p.img.w} phóng ×${Math.floor(192 / p.img.w)}</figcaption></figure>`).join("")}</div>`);
    cells.push(`<h2>Cỡ thật và nền tối / sáng</h2><div class="r">${items.map((p) => [1, 2, 3].map((k) => `<span class="sw" style="background:${k === 3 ? "#c8beaa" : "#1a1020"}"><img class="g" src="${p.name}" width="${p.img.w * k}" height="${p.img.w * k}"></span>`).join("")).join("")}</div>`);
  } else {
    const strip = px[0].img, F = strip.h, n = strip.w / F;
    const big = scaleUp(strip, 2, [26, 16, 32]), rv = shrink(rawImg, strip.w * 2); compare = new Img(big.w, rv.h + 8 + big.h); compare.blit(scaleUp(rv, 1, [26, 16, 32]), 0, 0, rv.w, rv.h, 0, 0); compare.blit(big, 0, 0, big.w, big.h, 0, rv.h + 8);
    cells.push(`<h2>RAW (thu nhỏ) và dải ${n} hướng ${F}×${F}</h2><div class="r"><figure><img src="raw-thu-nho.png" width="${rawView.w}" height="${rawView.h}"></figure></div>`);
    const lab = [...PT_DIRS.map((d) => [d, false]), ["sw", true, "se"], ["w", true, "e"], ["nw", true, "ne"]];
    cells.push(`<h2>5 hướng vẽ thật + 3 hướng tây (lật ngang)</h2><div class="r">${lab.map(([d, flip, src], i) => { const j = PT_DIRS.indexOf(src ?? d); return `<figure><span class="sw"><canvas class="g" data-j="${j}" data-flip="${flip ? 1 : 0}" width="${F}" height="${F}" style="width:${F * 2}px;height:${F * 2}px"></canvas></span><figcaption>${d}</figcaption></figure>`; }).join("")}</div><img id="strip" class="g" src="${px[0].name}" hidden><script>const s=document.getElementById("strip");const go=()=>document.querySelectorAll("canvas").forEach(c=>{const F=c.width,x=c.getContext("2d");x.imageSmoothingEnabled=false;if(+c.dataset.flip){x.translate(F,0);x.scale(-1,1)}x.drawImage(s,+c.dataset.j*F,0,F,F,0,0,F,F)});s.complete?go():s.onload=go;</script>`);
  }
  writeFileSync(path.join(out, "so-sanh.png"), encodePng(compare));
  const css = "body{background:#2a2430;color:#e8dfc8;font:13px/1.4 sans-serif;margin:16px}h1{font-size:18px}h2{font-size:15px;margin:18px 0 6px}.n{color:#9a8fa8}.r{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}figure{margin:0;text-align:center}figcaption{color:#9a8fa8}img.g,canvas.g{image-rendering:pixelated}.sw{display:inline-block;padding:6px;background:repeating-conic-gradient(#352d3d 0 25%,#2f2837 0 50%) 0 0/16px 16px;line-height:0}"
    + `.card .cw{position:relative;width:96px;height:152px;transform:scale(2);transform-origin:0 0}.card{width:192px;height:${152 * 2 + 24}px}.card figcaption{margin-top:${152 + 8}px}.cw>*{position:absolute}.cbg{left:0;top:0;width:96px;height:152px;background:radial-gradient(circle at 50% 36%,color-mix(in srgb,var(--c) 55%,#1a1020) 0,#1a1020 70%)}.cpt{left:16px;top:20px}.cfr{left:0;top:0;width:96px;height:152px}.cfk{left:0;top:0;width:92px;height:148px;border:2px solid var(--rim)}`;
  writeFileSync(path.join(out, "index.html"), `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Xem trước ${id ?? ""} ${TYPE_VI[type]}</title><style>${css}</style><h1>${id ?? ""} <small>(${TYPE_VI[type]})</small></h1><p class="n">Duyệt bằng mắt: đúng võ hồn; mắt / mỏ (hoặc lõi, lưỡi) còn đọc ra ở cỡ thật 1×; không chữ, không khung; hình đậm, mực tối, không "mềm". Ảnh phóng bằng láng giềng gần nhất. <a href="so-sanh.png">so-sanh.png</a></p>${cells.join("\n")}</html>\n`);
  return path.join(out, "index.html");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  if (!val("--type") || !val("--raw") || !val("--pixel") || !val("--out")) { console.error("Dùng: node tools/assets/vohon-preview.mjs --type portrait|icon|phaptuong --id <võ hồn> --raw <raw.png> --pixel <ảnh.png[,ảnh.png]> --out <thư mục>"); process.exit(2); }
  try { console.log(buildPreview({ type: val("--type"), id: val("--id"), raw: val("--raw"), pixels: val("--pixel").split(","), out: val("--out") })); } catch (e) { console.error(e.message); process.exit(2); }
}
