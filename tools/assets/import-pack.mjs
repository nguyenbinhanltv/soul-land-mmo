// Nhập gói asset ngoài giấy phép hạn chế (cấm phân phối lại file) vào KHO RIÊNG, không vào repo công khai (#623, docs/asset-rieng.md).
//   node tools/assets/import-pack.mjs --out <thư mục ngoài repo> [--giga <thư mục gói>] [--holy <…>] [--forest <…>] [--only key,key]
//        [--manifest shared/assets/sprites/private-manifest.json] [--credits art/CREDITS.md]
//   node tools/assets/import-pack.mjs --list <ảnh.png>        liệt kê các mảnh rời (hộp bao) của một ảnh lớn, để chọn `rect` cho vật đứng
// Đọc `tools/assets/private-packs.json` (mô tả, không có ảnh). Với mỗi mục:
//   fx   dải một hàng (Gigapack: sheet + .txt cạnh bên; Holy: Spritesheet + `fw`) → nhuộm theo độ sáng vào `ramp` 4 màu của bảng màu game
//        (posterize, alpha 4 mức), viền #1a1020 nếu `outline`, cắt viền trống chung mọi khung (giữ tâm), tách lớp sáng `_glow` nếu `glow`.
//   prop cắt `rect` [x, y, w, h] từ ảnh lớn, bỏ viền trống, tô lại về bảng màu game (màu gần nhất), ghi kèm điểm chân.
// Ra (cấu trúc của kho riêng): <out>/packs/<gói>/<tên>.png (+ _glow), <out>/present.json (file có thật; client chỉ tải những file này),
// <out>/licenses/<gói>.md, <out>/CREDITS-private.md, <out>/preview.html. Không nhúng ảnh gói vào bất cứ file nào của repo.
// --manifest ghi private-manifest.json (chỉ siêu dữ liệu: key, file, khung, fps, đánh dấu "private"); --credits cập nhật khối riêng trong art/CREDITS.md.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { Img, decodePng, encodePng, hex, toHex, readGpl, ROOT, OUTLINE } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d = "") => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const only = opt("--only") ? new Set(opt("--only").split(",")) : null;
const outDir = opt("--out"), manifestOut = opt("--manifest"), creditsOut = opt("--credits"), listFile = opt("--list");
const roots = { giga: opt("--giga"), holy: opt("--holy"), forest: opt("--forest") };
const SPEC = JSON.parse(readFileSync(path.join(ROOT, "tools", "assets", "private-packs.json"), "utf8"));

const lum = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
const A_LEVELS = [0, 96, 176, 255];
const qa = (a) => A_LEVELS.reduce((b, v) => (Math.abs(v - a) < Math.abs(b - a) ? v : b), 0);

/** Hộp bao các mảnh rời (nối 8 hướng, bỏ qua mảnh dưới 6 điểm). */
function components(img) {
  const seen = new Uint8Array(img.w * img.h), out = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (seen[y * img.w + x] || !img.alpha(x, y)) continue;
    const st = [[x, y]]; seen[y * img.w + x] = 1; let x0 = x, x1 = x, y0 = y, y1 = y, n = 0;
    while (st.length) {
      const [cx, cy] = st.pop(); n++; x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const X = cx + dx, Y = cy + dy;
        if (X < 0 || Y < 0 || X >= img.w || Y >= img.h || seen[Y * img.w + X] || !img.alpha(X, Y)) continue;
        seen[Y * img.w + X] = 1; st.push([X, Y]);
      }
    }
    if (n >= 6) out.push([x0, y0, x1 - x0 + 1, y1 - y0 + 1]);
  }
  return out.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
if (listFile) {
  const img = decodePng(readFileSync(listFile));
  components(img).forEach((r, i) => console.log(`${i}\t[${r.join(", ")}]`));
  process.exit(0);
}
if (!outDir) { console.error("Cách dùng: import-pack.mjs --out <thư mục> [--giga d] [--holy d] [--forest d] [--only k,k] [--manifest f] [--credits f] | --list <png>"); process.exit(1); }
if (path.resolve(outDir).startsWith(ROOT + path.sep)) { console.error(`--out nằm trong repo game (${ROOT}): ảnh gói giấy phép hạn chế không được vào repo công khai. Dùng thư mục ngoài repo.`); process.exit(1); }

const palette = readGpl(path.join(ROOT, "art", "palette.gpl")).map(hex);
const nearest = (r, g, b) => { let best = palette[0], bd = 1e9; for (const p of palette) { const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2; if (d < bd) { bd = d; best = p; } } return best; };

/** Đọc khung đầu của file .txt cạnh sheet Gigapack ("đường dẫn = x y w h"); null nếu không có. */
function sheetFrameW(file) {
  const t = file.replace(/\.png$/, ".txt");
  if (!existsSync(t)) return null;
  const m = readFileSync(t, "utf8").match(/=\s*\d+\s+\d+\s+(\d+)\s+(\d+)/);
  return m ? +m[1] : null;
}

function importFx(e, root) {
  const file = path.join(root, e.src), sheet = decodePng(readFileSync(file));
  const fw = e.fw ?? sheetFrameW(file) ?? sheet.h, fh = sheet.h, n = Math.round(sheet.w / fw);
  if (n * fw !== sheet.w) throw new Error(`${e.key}: bề ngang ${sheet.w} không chia hết cho khung ${fw}`);
  const ramp = SPEC.ramps[e.ramp].map(hex), K = ramp.length;
  // Độ sáng chuẩn hóa theo cả sheet: điểm sáng nhất = màu sáng nhất của dải.
  let maxL = 0.001;
  for (let i = 0; i < sheet.w * sheet.h; i++) if (sheet.data[i * 4 + 3] > 40) maxL = Math.max(maxL, lum(sheet.data[i * 4], sheet.data[i * 4 + 1], sheet.data[i * 4 + 2]));
  // Tìm vùng có hình chung mọi khung (đối xứng quanh tâm khung) để cắt viền trống.
  let hx = 0, hy = 0;
  for (let f = 0; f < n; f++) for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (sheet.alpha(f * fw + x, y) > 20) { hx = Math.max(hx, Math.abs(x + 0.5 - fw / 2)); hy = Math.max(hy, Math.abs(y + 0.5 - fh / 2)); }
  const pad = e.outline ? 2 : 1, ow = Math.min(fw, 2 * Math.ceil(hx + pad)), oh = Math.min(fh, 2 * Math.ceil(hy + pad));
  const body = new Img(ow * n, oh), glow = new Img(ow * n, oh), ox = (fw - ow) / 2, oy = (fh - oh) / 2;
  for (let f = 0; f < n; f++) for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const sx = f * fw + x + ox, sy = y + oy, [r, g, b, a] = sheet.get(sx, sy);
    const qaa = qa(a);
    if (!qaa) continue;
    const l = Math.min(1, lum(r, g, b) / maxL), idx = Math.min(K - 1, Math.floor(Math.pow(l, e.gamma ?? 0.9) * K)), c = ramp[idx];
    body.set(f * ow + x, y, [...c, qaa]);
    if (e.glow && idx === K - 1) glow.set(f * ow + x, y, [...c, 120]);
  }
  if (e.outline) {
    const o = hex(OUTLINE), src = new Img(body.w, body.h, body.data.slice());
    for (let f = 0; f < n; f++) for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      const X = f * ow + x;
      if (src.alpha(X, y) >= 96) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const u = x + dx, v = y + dy; if (u >= 0 && v >= 0 && u < ow && v < oh && src.alpha(f * ow + u, v) >= 176) { body.set(X, y, [...o, 255]); break; } }
    }
  }
  if (e.glow) {
    // Lớp sáng nở thêm 1 điểm để vầng mềm hơn khi cộng sáng.
    const src = new Img(glow.w, glow.h, glow.data.slice());
    for (let f = 0; f < n; f++) for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
      if (src.alpha(f * ow + x, y)) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const u = x + dx, v = y + dy; if (u >= 0 && v >= 0 && u < ow && v < oh && src.alpha(f * ow + u, v)) { const c = src.get(f * ow + u, v); glow.set(f * ow + x, y, [c[0], c[1], c[2], 60]); break; } }
    }
  }
  return { files: { "": body, ...(e.glow ? { _glow: glow } : {}) }, frame: [ow, oh], frames: n };
}

function importProp(e, root) {
  const src = decodePng(readFileSync(path.join(root, e.src))), [rx, ry, rw, rh] = e.rect;
  const out = new Img(rw, rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const [r, g, b, a] = src.get(rx + x, ry + y);
    if (a < 128) continue;
    out.set(x, y, e.snap === false ? [r, g, b, 255] : [...nearest(r, g, b), 255]);
  }
  return { files: { "": out }, frame: [rw, rh], frames: 1, foot: [Math.round(rw / 2), rh - 1] };
}

mkdirSync(outDir, { recursive: true });
const present = [], manifest = [], used = new Set(), done = [];
for (const e of SPEC.entries) {
  if (only && !only.has(e.key)) continue;
  const root = roots[e.pack];
  if (!root) { console.log(`bỏ qua ${e.key}: thiếu --${e.pack}`); continue; }
  const r = e.kind === "prop" ? importProp(e, root) : importFx(e, root);
  const name = e.key.replace(/^pfx_/, "");
  mkdirSync(path.join(outDir, "packs", e.pack), { recursive: true });
  const rec = { key: e.key, kind: e.kind, private: true, pack: e.pack, file: `packs/${e.pack}/${name}.png`, frame: r.frame, frames: r.frames, ...(e.kind === "fx" ? { fps: e.fps, normal: !!e.normal } : { foot: r.foot }), ...(r.files._glow ? { glow: `packs/${e.pack}/${name}_glow.png` } : {}), use: e.use };
  for (const [suf, img] of Object.entries(r.files)) { writeFileSync(path.join(outDir, "packs", e.pack, `${name}${suf}.png`), encodePng(img)); present.push(`packs/${e.pack}/${name}${suf}.png`); }
  manifest.push(rec); used.add(e.pack); done.push(rec);
  console.log(`✓ ${e.key}: ${r.frames} khung ${r.frame.join("×")}${r.files._glow ? " + lớp sáng" : ""}`);
}
writeFileSync(path.join(outDir, "present.json"), JSON.stringify({ about: "File có thật trong kho riêng; client chỉ tải những file này (client/src/privateAssets.ts).", files: present.sort() }, null, 1) + "\n");

mkdirSync(path.join(outDir, "licenses"), { recursive: true });
for (const p of used) {
  const k = SPEC.packs[p];
  writeFileSync(path.join(outDir, "licenses", `${p}.md`), `# ${k.name}\n\n- Tác giả: ${k.author}\n- Nguồn: ${k.source}\n- Giấy phép: ${k.license}\n- Ghi công: ${k.credit}\n${k.noAI ? "- CẤM đưa vào model AI / làm ảnh tham chiếu.\n" : ""}`);
}
const creditBlock = () => {
  const rows = [...used].map((p) => { const k = SPEC.packs[p], n = done.filter((d) => d.pack === p).length; return `| ${k.name} | ${k.author} | ${k.license} | ${k.source} | ${n} mục (\`${done.filter((d) => d.pack === p).map((d) => d.key).join("`, `")}\`) |`; });
  return `<!-- private-assets:start -->\n## Asset kho riêng (không nằm trong repo công khai)\n\nẢnh các gói dưới đây nằm ở kho riêng \`nguyenbinhanltv/soul-land-assets-private\` (docs/asset-rieng.md), CI kéo về lúc build image; repo này chỉ giữ mô tả (\`tools/assets/private-packs.json\`, \`shared/assets/sprites/private-manifest.json\`), không nhúng file. Bản đã xử lý: nhuộm về bảng màu game, cắt viền, đóng sheet, viền #1a1020 (\`tools/assets/import-pack.mjs\`).\n\n| Gói | Tác giả | Giấy phép | Nguồn | Dùng |\n|---|---|---|---|---|\n${rows.join("\n")}\n<!-- private-assets:end -->\n`;
};
writeFileSync(path.join(outDir, "CREDITS-private.md"), creditBlock());
if (manifestOut) {
  const f = path.resolve(manifestOut), prev = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : { sprites: [] };
  const keep = (prev.sprites ?? []).filter((s) => !manifest.some((m) => m.key === s.key));
  writeFileSync(f, JSON.stringify({ about: "Asset kho riêng (docs/asset-rieng.md): chỉ siêu dữ liệu, ảnh không nằm trong repo. Client tải theo private/present.json; thiếu file thì bỏ qua và giữ hình cũ. Sinh bởi tools/assets/import-pack.mjs.", sprites: [...keep, ...manifest].sort((a, b) => a.key.localeCompare(b.key)) }, null, 2) + "\n");
}
if (creditsOut) {
  const f = path.resolve(creditsOut);
  let t = readFileSync(f, "utf8"); const b = creditBlock(), re = /<!-- private-assets:start -->[\s\S]*?<!-- private-assets:end -->\n?/;
  t = re.test(t) ? t.replace(re, b) : t.replace(/\s*$/, "\n\n") + b;
  writeFileSync(f, t);
}

// Trang xem trước: mỗi mục chạy lặp trên nền tối (×3, nearest).
const cell = (d, p) => { const w = d.frame[0], h = d.frame[1], dur = (d.frames / (d.fps ?? 8)).toFixed(2);
  return `<div class=c><div class=s style="width:${w * 3}px;height:${h * 3}px;background:url(${d.file}) 0 0/${w * 3 * d.frames}px ${h * 3}px;animation:k_${d.key} ${dur}s steps(${d.frames}) infinite"></div><b>${d.key}</b><small>${d.pack} · ${d.frames} khung ${w}×${h}${d.glow ? " · +sáng" : ""}</small></div>`; };
writeFileSync(path.join(outDir, "preview.html"), `<!doctype html><meta charset=utf-8><title>Xem trước kho riêng</title><style>body{background:#0c1712;color:#ddd;font:13px sans-serif;display:flex;flex-wrap:wrap;gap:16px;padding:16px}.c{background:#1c2230;padding:10px;text-align:center}.s{image-rendering:pixelated;margin:auto}small{display:block;color:#889}${done.filter((d) => d.kind === "fx").map((d) => `@keyframes k_${d.key}{to{background-position-x:-${d.frame[0] * 3 * d.frames}px}}`).join("")}</style>${done.filter((d) => d.kind === "fx").map(cell).join("")}`);
console.log(`xong: ${done.length} mục → ${outDir}`);
