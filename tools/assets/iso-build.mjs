// Đưa ô nền (shared/assets/iso) và vật đứng (shared/assets/sprites/iso/props) isometric vào game (bước 10.2, GAME_DESIGN.md mục 5.11), và kiểm tra tiles.json.
//   node tools/assets/iso-build.mjs ground <tên> <ô 32.png> [<ô lớn 64.png>]
//        chép ô (ảnh isoTileImage: 32×32 thoi 32×16 tâm (16,19); 64×64 thoi 64×32 tâm (32,37)) thành ground/<tên>_0.png
//        (+ ground/<tên>_0_lon.png) và sinh biến thể ground/<tên>_1… : mặt trên dời nửa chu kỳ theo trục thoi (ô Gemini / PixelLab đã
//        liền mép nên bản dời vẫn lát kín với chính nó, đáy giữ nguyên). --variants N (mặc định 2).
//   node tools/assets/iso-build.mjs prop <tên> <ảnh.png> [--map a,b] [--drop "#rrggbb,…"|--drop-water|--drop-base N] [--lift 3] [--foot-x X]
//        vật đứng (ảnh PixelLab create_map_object) → shared/assets/sprites/iso/props/<tên>.png (key prop_<tên>, mục 5.11): màu gần đen
//        (độ sáng < 12%) → viền #1a1020, thêm viền ngoài nếu thiếu, màu về art/palette.gpl + bảng nhấn art/palettes/<mapId>.gpl của
//        các vùng dùng vật (--map), khung bội ISO_PROP_STEP với chân ở giữa ngang;
//        --drop-base N xóa đế cỏ dưới gốc cây ở N hàng cuối (đế tròn lộ thành đĩa khi cây đứng thành hàng);
//        --drop-water xóa đế nước / bọt lam nhạt PixelLab hay vẽ dưới vật (đá ngầm). Chân: giữa đáy (hoặc --foot-x trong ảnh nguồn),
//        cao hơn đáy --lift điểm; in ra để ghi vào tiles.json (`foot`), soát bằng mắt. Rồi validate.mjs --register prop_<tên> --iso.
//   node tools/assets/iso-build.mjs check
//        tiles.json phủ mọi gid đang dùng ở lớp `ground` / `trees` của 10 bản đồ (bộ "*" + bộ riêng), ảnh tồn tại và đúng cỡ.
//        validate.mjs (npm run check) gọi phần này.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { ROOT, SPRITES, MANIFEST, readPng, encodePng, Img, hex, isoTileImage, readGpl, ISO_PROP_STEP, ISO_PROP_FOOT } from "./lib.mjs";

export const ISO = path.join(ROOT, "shared", "assets", "iso");
const OUT_RGB = hex("#1a1020");
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Điểm (x, y) trong ảnh ô bề ngang W có thuộc mặt trên thoi không; kèm tọa độ thoi (a, b) mỗi trục −1…1. */
function faceAB(x, y, W) {
  const { center } = isoTileImage(W), H = W / 2;
  const dx = (x + 0.5 - center[0]) / (W / 2), dy = (y + 0.5 - center[1]) / (H / 2);
  return { a: dx + dy, b: dy - dx, inside: Math.abs(dx) + Math.abs(dy) < 1 };
}
/** Điểm mặt trên tại tọa độ thoi (a, b) gói về −1…1 (lát kín bằng chính ô). */
function faceAt(img, a, b) {
  const W = img.w, { center } = isoTileImage(W), H = W / 2, wrap = (v) => ((((v + 1) % 2) + 2) % 2) - 1;
  a = wrap(a); b = wrap(b);
  const x = Math.floor(center[0] + ((a - b) * W) / 4), y = Math.floor(center[1] + ((a + b) * H) / 4);
  return img.get(Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(img.h - 1, y)));
}
/** Biến thể k: mặt trên dời (k / n) chu kỳ theo trục a và nửa số đó theo trục b. */
function shifted(img, k, n) {
  const out = new Img(img.w, img.h, Uint8Array.from(img.data)), da = (2 * k) / n, db = k / n;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const f = faceAB(x, y, img.w);
    if (f.inside && img.alpha(x, y)) out.set(x, y, faceAt(img, f.a + da, f.b + db));
  }
  return out;
}

function ground(name, small, big, n) {
  const dir = path.join(ISO, "ground"); mkdirSync(dir, { recursive: true });
  for (const [file, suffix, W] of [[small, "", 32], [big, "_lon", 64]]) {
    if (!file) continue;
    const img = readPng(file);
    if (img.w !== W || img.h !== W) throw new Error(`${file}: ${img.w}×${img.h}, cần ${W}×${W} (isoTileImage)`);
    for (let k = 0; k < n; k++) {
      const out = path.join(dir, `${name}_${k}${suffix}.png`);
      writeFileSync(out, encodePng(k ? shifted(img, k, n) : img));
      console.log(`[iso-build] ${path.relative(ROOT, out)}`);
    }
  }
}

function prop(name, file, { drop, dropWater, dropBase, maps, lift, footX }) {
  const src = readPng(file), img = new Img(src.w, src.h, Uint8Array.from(src.data));
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.get(x, y);
    if (!p[3]) continue;
    if (p[3] < 128) { img.set(x, y, [0, 0, 0, 0]); continue; }
    const c = "#" + p.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");
    // Nước / bọt: lam nhạt, lục lam (b và g cao hơn hẳn r).
    const water = dropWater && p[2] > p[0] + 25 && p[1] > p[0] + 10;
    if (drop.includes(c) || water) { img.set(x, y, [0, 0, 0, 0]); continue; }
    img.set(x, y, lum(p) < 0.12 * 255 ? [...OUT_RGB, 255] : [p[0], p[1], p[2], 255]);
  }
  // --drop-base N: xóa đế cỏ (điểm lục / vàng lục) ở N hàng cuối dưới gốc cây, kèm viền tối của đế; viền thân cây vẽ lại ở dưới.
  if (dropBase) {
    const y0 = img.h - dropBase, gone = new Set();
    for (let y = y0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      const p = img.get(x, y);
      if (p[3] && p[1] > 0.84 * p[0] && p[1] > p[2] + 15) { img.set(x, y, [0, 0, 0, 0]); gone.add(y * img.w + x); }
    }
    for (let pass = 0; pass < 2; pass++) for (let y = y0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      const p = img.get(x, y);
      if (p[3] && lum(p) < 0.12 * 255 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => gone.has((y + dy) * img.w + x + dx))) { img.set(x, y, [0, 0, 0, 0]); gone.add(y * img.w + x); }
    }
  }
  // Viền ngoài #1a1020 ở điểm trống kề điểm đặc (PixelLab "single color outline" thường đã có; xóa đế nước thì cần thêm).
  const a = (x, y) => x >= 0 && y >= 0 && x < img.w && y < img.h && img.alpha(x, y) > 0;
  const add = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++)
    if (!a(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => a(x + dx, y + dy) && lum(img.get(x + dx, y + dy)) > 0.12 * 255)) add.push([x, y]);
  for (const [x, y] of add) img.set(x, y, [...OUT_RGB, 255]);
  // Màu về bảng chung + bảng nhấn các vùng dùng vật (--map), gần nhất theo khoảng cách "redmean"; viền giữ #1a1020.
  const pal = [...new Set([...readGpl(), ...maps.flatMap((m) => readGpl(path.join(ROOT, "art", "palettes", `${m}.gpl`)))])].map(hex);
  const near = (p) => {
    let best = pal[0], bd = Infinity;
    for (const q of pal) { const r = (p[0] + q[0]) / 2, d = (2 + r / 256) * (p[0] - q[0]) ** 2 + 4 * (p[1] - q[1]) ** 2 + (2 + (255 - r) / 256) * (p[2] - q[2]) ** 2; if (d < bd) { bd = d; best = q; } }
    return best;
  };
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const p = img.get(x, y); if (p[3]) img.set(x, y, [...near(p), 255]); }
  // Khung bao phần đặc; chân: giữa các điểm đặc ở 4 hàng cuối, cao hơn đáy --lift điểm (mặc định 3).
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) throw new Error(`${file}: ảnh trống`);
  const xs = [];
  for (let y = y1 - 3; y <= y1; y++) for (let x = x0; x <= x1; x++) if (img.alpha(x, y)) xs.push(x);
  const fx = footX ?? Math.floor((Math.min(...xs) + Math.max(...xs) + 1) / 2), fy = y1 - lift;
  // Khung bội ISO_PROP_STEP, chân ở giữa ngang (lật ngang không xê dịch) và cách mép dưới ít nhất ISO_PROP_FOOT.
  const half = Math.max(fx - x0, x1 + 1 - fx), below = Math.max(ISO_PROP_FOOT, y1 + 1 - fy);
  const W = Math.ceil((2 * half) / ISO_PROP_STEP) * ISO_PROP_STEP, H = Math.ceil((fy - y0 + below) / ISO_PROP_STEP) * ISO_PROP_STEP;
  const out = new Img(W, H), ox = W / 2 - fx, oy = H - below - fy;
  out.blit(img, 0, 0, img.w, img.h, ox, oy);
  const dir = path.join(SPRITES, "iso", "props"); mkdirSync(dir, { recursive: true });
  const dst = path.join(dir, `${name}.png`);
  writeFileSync(dst, encodePng(out));
  console.log(`[iso-build] ${path.relative(ROOT, dst)} ${W}×${H}, chân [${W / 2}, ${H - below}] (prop_${name}, ghi vào tiles.json)`);
}

/** Kiểm tra tiles.json; trả số lỗi (in ra từng lỗi). */
export function checkIsoTiles(log = console.error) {
  const file = path.join(ISO, "tiles.json");
  if (!existsSync(file)) { log(`[iso] thiếu ${path.relative(ROOT, file)}`); return 1; }
  let errors = 0; const err = (m) => { errors++; log(`[iso] LỖI ${m}`); };
  const data = JSON.parse(readFileSync(file, "utf8"));
  // Từ 10.7 client tải normal map `<ảnh>_n.png` của mọi ô nền và vật đứng khi ánh sáng bật: phải có, cùng cỡ.
  const size = (f, edge = "") => {
    const p = path.join(ISO, f); if (!existsSync(p)) { err(`thiếu ảnh ${f}`); return null; }
    const i = readPng(p), n = p.replace(/\.png$/, "_n.png");
    if (!existsSync(n)) err(`thiếu normal map ${path.relative(ROOT, n)} (node tools/assets/normal.mjs ${path.relative(ROOT, p)}${edge})`);
    else { const k = readPng(n); if (k.w !== i.w || k.h !== i.h) err(`normal map ${path.relative(ROOT, n)} ${k.w}×${k.h}, cần ${i.w}×${i.h}`); }
    return [i.w, i.h];
  };
  for (const [name, g] of Object.entries(data.ground ?? {})) {
    if (!g.img?.length) err(`ô ${name} không có ảnh`);
    for (const f of g.img ?? []) { const s = size(f, " --edge 0"); if (s && (s[0] !== 32 || s[1] !== 32)) err(`ô ${name}: ${f} ${s.join("×")}, cần 32×32`); }
    for (const f of g.big ?? []) { const s = size(f, " --edge 0"); if (s && (s[0] !== 64 || s[1] !== 64)) err(`ô ${name}: ${f} ${s.join("×")}, cần 64×64`); }
    if (typeof g.edge !== "number") err(`ô ${name} thiếu edge`);
  }
  // Vật đứng: key prop_{vật} phải có trong manifest ("iso": true), ảnh ở sprites/iso/props.
  const keys = new Set(JSON.parse(readFileSync(MANIFEST, "utf8")).sprites.map((e) => (typeof e === "string" ? e : e.key)));
  for (const [name, p] of Object.entries(data.props ?? {})) {
    if (!/^prop_[a-z_]+$/.test(p.key ?? "")) { err(`vật ${name}: key "${p.key}" sai quy ước prop_{vật}`); continue; }
    if (!keys.has(p.key)) err(`vật ${name}: ${p.key} chưa đăng ký trong manifest (validate.mjs --register ${p.key} --iso)`);
    const s = size(path.join("..", "sprites", "iso", "props", `${p.key.slice(5)}.png`));
    if (s && (!Array.isArray(p.foot) || p.foot[0] < 0 || p.foot[1] < 0 || p.foot[0] > s[0] || p.foot[1] > s[1])) err(`vật ${name}: chân ${JSON.stringify(p.foot)} ngoài ảnh ${s.join("×")}`);
  }
  const ref = (r) => r.split("~")[0];
  const maps = readdirSync(path.join(ROOT, "shared", "assets")).filter((f) => f.endsWith(".json"));
  for (const f of maps) {
    const id = f.replace(/\.json$/, ""), m = JSON.parse(readFileSync(path.join(ROOT, "shared", "assets", f), "utf8"));
    const set = { ground: { ...data.maps?.["*"]?.ground, ...data.maps?.[id]?.ground }, props: { ...data.maps?.["*"]?.props, ...data.maps?.[id]?.props } };
    const build = data.maps?.[id]?.build ?? data.maps?.["*"]?.build;
    if (build?.tower && !data.props?.[ref(build.tower)]) err(`${id}: build.tower trỏ tới vật "${ref(build.tower)}" không có`);
    for (const [at, c] of Object.entries(build?.compounds ?? {})) {
      for (const r of [...(c.main ?? []), ...(c.gate ? [c.gate] : []), ...(c.deco ?? [])]) if (!data.props?.[ref(r)]) err(`${id}: cung uyển ${at} trỏ tới vật "${ref(r)}" không có`);
      if (c.floor && !data.ground?.[ref(c.floor)]) err(`${id}: cung uyển ${at} trỏ tới ô nền "${ref(c.floor)}" không có`);
      if (!c.main?.length) err(`${id}: cung uyển ${at} thiếu công trình main`);
    }
    const used = (n) => new Set(m.layers.find((l) => l.type === "tilelayer" && l.name === n)?.data.filter((g) => g > 0) ?? []);
    for (const gid of used("ground")) {
      const r = set.ground[gid];
      if (!r) err(`${id}: gid nền ${gid} chưa có trong tiles.json`); else if (!data.ground?.[ref(r)]) err(`${id}: gid ${gid} trỏ tới ô "${ref(r)}" không có`);
    }
    for (const gid of used("trees")) {
      if (gid === 14 || gid === 15) { if (!build) err(`${id}: có nhà / tường (gid ${gid}) nhưng thiếu kiểu nhà "build"`); continue; }
      const r = set.props[gid];
      if (!r) err(`${id}: gid vật ${gid} chưa có trong tiles.json`);
      else for (const x of [].concat(r)) if (!data.props?.[ref(x)]) err(`${id}: gid ${gid} trỏ tới vật "${ref(x)}" không có`);
    }
  }
  return errors;
}

// Chạy trực tiếp (validate.mjs chỉ nhập checkIsoTiles).
if (process.argv[1]?.endsWith("iso-build.mjs")) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
  const flag = (n) => { const i = args.indexOf(n); if (i >= 0) args.splice(i, 1); return i >= 0; };
  const cmd = args[0];
  if (cmd === "ground" && args[2]) ground(args[1], args[2], args[3], +opt("--variants", "2"));
  else if (cmd === "prop" && args[2]) { const drop = opt("--drop", "").split(",").filter(Boolean).map((c) => c.toLowerCase()); const maps = opt("--map", "").split(",").filter(Boolean), fx = opt("--foot-x", ""); prop(args[1], args[2], { drop, dropWater: flag("--drop-water"), dropBase: +opt("--drop-base", "0"), maps, lift: +opt("--lift", "3"), footX: fx === "" ? undefined : +fx }); }
  else if (cmd === "check") { const n = checkIsoTiles(); console.log(n ? `[iso] ${n} lỗi` : "[iso] tiles.json: OK"); process.exit(n ? 1 : 0); }
  else { console.error("Cách dùng: iso-build.mjs ground <tên> <32.png> [<64.png>] | prop <tên> <ảnh.png> [--drop-water] | check"); process.exit(1); }
}
