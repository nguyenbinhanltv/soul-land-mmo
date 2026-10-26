// Gom ảnh nhỏ của từng bản đồ isometric thành vài trang atlas (#716 bước 6), để vào bản đồ lần đầu tải ~4 file thay vì ~65.
//   node tools/assets/iso-atlas.mjs            ghi shared/assets/iso/atlas/<bản đồ>-<trang>.png (+ `_n` normal map) và index.json
//   node tools/assets/iso-atlas.mjs --check    kiểm index.json còn khớp ảnh nguồn (chạy trong `npm run check`; lệch thì chạy lại lệnh trên)
// Chọn ảnh theo đúng cách preloadIso (client/src/isoMap.ts): ô nền (img + big) của bộ ô bản đồ, sân cung uyển, vật đứng công khai
// (bỏ vật kho riêng `private`). Mỗi ảnh xếp nguyên khối (không phóng, không viền) và cắt lại đúng hình chữ nhật lúc chạy, nên hình hiển
// thị không đổi. Ảnh ô / vật gốc vẫn ở chỗ cũ: bản đồ không có trong index, ảnh thiếu trong atlas, hay atlas hỏng thì client tải từng
// file như trước.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { ROOT, decodePng, encodePng, Img } from "./lib.mjs";

const ISO = path.join(ROOT, "shared", "assets", "iso"), PROPS = path.join(ROOT, "shared", "assets", "sprites", "iso", "props"), OUT = path.join(ISO, "atlas");
const PAGE_W = 1024, PAGE_MAX_H = 2048;
const data = JSON.parse(readFileSync(path.join(ISO, "tiles.json"), "utf8"));

const parseRef = (ref) => ref.split("~")[0];
const alts = (ref) => ref.split("|");
const mapSet = (id) => { const all = data.maps["*"] ?? {}, own = data.maps[id] ?? {}; return { ground: { ...all.ground, ...own.ground }, props: { ...all.props, ...own.props }, build: own.build ?? all.build }; };

/** Ảnh (key texture → { file màu, file normal }) mà preloadIso xin cho bản đồ `id`. */
function wanted(id) {
  const set = mapSet(id), out = new Map();
  const add = (key, file) => { if (existsSync(file)) out.set(key, { file, n: file.replace(/\.png$/, "_n.png") }); };
  const ground = (name) => { const g = data.ground[name]; for (const f of [...(g?.img ?? []), ...(g?.big ?? [])]) add(`iso:${f}`, path.join(ISO, f)); };
  for (const ref of Object.values(set.ground)) ground(parseRef(ref));
  const compounds = Object.values(set.build?.compounds ?? {});
  for (const c of compounds) if (c.floor) ground(parseRef(c.floor));
  const comp = compounds.flatMap((c) => [...c.main, ...(c.gate ? [c.gate] : []), ...(c.deco ?? [])]);
  for (const v of [...Object.values(set.props), ...(set.build?.tower ? [set.build.tower] : []), ...comp]) {
    for (const ref of [].concat(v).flatMap(alts)) {
      const p = data.props[parseRef(ref)];
      if (p && !p.private) add(p.key, path.join(PROPS, `${p.key.replace(/^prop_/, "")}.png`));
    }
  }
  return out;
}

/** Xếp kệ (ảnh cao trước) vào các trang rộng PAGE_W; trả { pages: [{w,h}], frames: {key: [trang,x,y,w,h]} }. */
function pack(items) {
  const list = [...items].sort((a, b) => b.h - a.h || a.key.localeCompare(b.key));
  const pages = [], frames = {};
  let x = 0, y = 0, rowH = 0, page = 0;
  const closePage = () => { pages.push({ w: PAGE_W, h: y + rowH }); page++; x = 0; y = 0; rowH = 0; };
  for (const it of list) {
    if (it.w > PAGE_W) throw new Error(`${it.key} rộng ${it.w} > ${PAGE_W}`);
    if (x + it.w > PAGE_W) { y += rowH; x = 0; rowH = 0; }
    if (y + it.h > PAGE_MAX_H) { closePage(); }
    frames[it.key] = [page, x, y, it.w, it.h];
    x += it.w; rowH = Math.max(rowH, it.h);
  }
  if (list.length) closePage();
  return { pages, frames };
}

const sha = (bufs) => { const h = createHash("sha1"); for (const b of bufs) h.update(b); return h.digest("hex").slice(0, 16); };

const index = {};
const files = [];
for (const id of Object.keys(data.maps).filter((m) => m !== "*").sort()) {
  const want = wanted(id), items = [];
  for (const [key, f] of want) {
    const img = decodePng(readFileSync(f.file));
    const nImg = existsSync(f.n) ? decodePng(readFileSync(f.n)) : null;
    if (nImg && (nImg.w !== img.w || nImg.h !== img.h)) throw new Error(`${f.n} khác cỡ ảnh màu`);
    items.push({ key, w: img.w, h: img.h, img, nImg, src: [readFileSync(f.file), existsSync(f.n) ? readFileSync(f.n) : Buffer.alloc(0)] });
  }
  if (!items.length) continue;
  const { pages, frames } = pack(items);
  const hash = sha(items.sort((a, b) => a.key.localeCompare(b.key)).flatMap((it) => [Buffer.from(it.key), ...it.src]));
  index[id] = { hash, pages, frames };
  pages.forEach((pg, i) => {
    const color = new Img(pg.w, pg.h), norm = new Img(pg.w, pg.h);
    for (const it of items) {
      const [p, x, y, w, h] = frames[it.key];
      if (p !== i) continue;
      color.blit(it.img, 0, 0, w, h, x, y);
      if (it.nImg) norm.blit(it.nImg, 0, 0, w, h, x, y);
      else for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) norm.set(x + xx, y + yy, [128, 128, 255, 255]);
    }
    files.push([`${id}-${i}.png`, color], [`${id}-${i}_n.png`, norm]);
  });
}

const json = JSON.stringify(index) + "\n";
if (process.argv.includes("--check")) {
  const cur = existsSync(path.join(OUT, "index.json")) ? JSON.parse(readFileSync(path.join(OUT, "index.json"), "utf8")) : {};
  const bad = Object.keys(index).filter((id) => cur[id]?.hash !== index[id].hash || JSON.stringify(cur[id]?.frames) !== JSON.stringify(index[id].frames));
  for (const id of Object.keys(index)) index[id].pages.forEach((_, i) => { for (const f of [`${id}-${i}.png`, `${id}-${i}_n.png`]) if (!existsSync(path.join(OUT, f)) && !bad.includes(id)) bad.push(id); });
  const extra = Object.keys(cur).filter((id) => !index[id]);
  if (bad.length || extra.length) { console.error(`✗ atlas ô / vật cũ (${[...bad, ...extra].join(", ")}): chạy node tools/assets/iso-atlas.mjs rồi commit shared/assets/iso/atlas/`); process.exit(1); }
  console.log(`✓ atlas ô / vật khớp ảnh nguồn: ${Object.keys(index).length} bản đồ`);
} else {
  rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
  for (const [name, img] of files) writeFileSync(path.join(OUT, name), encodePng(img));
  writeFileSync(path.join(OUT, "index.json"), json);
  for (const [id, e] of Object.entries(index)) console.log(`${id}: ${Object.keys(e.frames).length} ảnh → ${e.pages.length} trang (${e.pages.map((p) => `${p.w}×${p.h}`).join(", ")})`);
  console.log(`ghi ${files.length} PNG + index.json vào ${path.relative(ROOT, OUT)}`);
}
