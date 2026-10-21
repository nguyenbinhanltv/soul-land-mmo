// Dựng phụ thể tĩnh 5 hướng (đầu vào của `pack --kind vohon --part`) từ ảnh vũ khí / vật / hư ảnh đã vẽ sẵn, theo một file mô tả.
//   node tools/assets/vohon-part.mjs <mô tả.json> --body m:<thân.png>,<áo.png>,<tóc.png> --body f:<…> --out <thư mục>
//
// Mỗi giới (ISO_VH_SEXES) một bộ thân mẫu (m_0, f_0): phụ thể của nửa sheet giới đó đặt theo điểm neo của thân đó, ghi vào
// <out>/<giới>/ (pack --kind vohon đọc lại theo cùng --body). Thiếu một giới thì nửa sheet đó để trống.
//
// Mỗi hướng s, se, e, ne, n là một danh sách mảnh; mỗi mảnh là một ảnh (đường dẫn tính từ thư mục file mô tả) đặt vào khung
// phụ thể 96×96 khớp khung đứng (idle khung 0) của lớp thân hướng đó, sao cho điểm `pivot` của ảnh trùng điểm neo + `off`:
//   { "attach": "hand|head|back|feet",
//     "dirs": { "s": [ { "img": "x_s.png", "pivot": [px, py], "hand": "left|right", "off": [dx, dy],
//                        "flip": false, "rot": 0, "rim": "#rrggbb", "layer": "f" | "b" | { "split": y } } ], … } }
//   - pivot: điểm trong ảnh gốc (trước flip / rot), ví dụ chỗ tay cầm cán búa, đáy tháp, giữa lưng hư ảnh.
//   - hand (attach hand): bàn tay bên trái / phải màn hình (so với giữa người) ở khung đứng, theo frameAnchors của lib.mjs.
//     Cùng mảng tay này là "tay cầm" mà pack.mjs dò theo ở từng khung (pack chọn mảng da gần phụ thể nhất ở khung đứng).
//   - flip: lật ngang; rot: xoay 90 / 180 / 270 độ theo chiều kim đồng hồ (không nội suy); áp trước khi đặt.
//   - rim: viền sáng 1 pixel ở mép trên / trái (điểm có ô trên hoặc ô trái trong suốt) cho võ hồn màu tối (mục 5.11), màu
//     nên là `col` của võ hồn.
//   - layer: "f" trước thân, "b" sau thân, { "split": y } cắt theo dòng y của khung 96 (trên → sau, từ y trở xuống → trước).
//   - "m": { … } / "f": { … }: ghi đè các trường trên cho riêng thân giới đó (ví dụ "f": { "off": [1, 0] }).
// Ghi <out>/<giới>/{hướng}_b.png và {hướng}_f.png (khung 96×96, lớp trống thì bỏ; màu giữ nguyên: chạy `normalize --kind vohon --foot 74` sau để
// đưa màu về bảng và viền #1a1020 mà không dời hình), kèm grip.json (tay đã đặt ở khung đứng từng hướng, tọa độ khung thân) để
// pack.mjs dò đúng tay đó ở các khung khác.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { readPng, encodePng, Img, hex, ISO_DIRS, ISO_HS_FRAME, ISO_VH_FRAME, ANCHORS, isoLayout, frameAnchors, vohonBodies } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const bodies = vohonBodies(args), out = opt("--out", ""), specFile = args[0];
const fail = (m) => { console.error(m); process.exit(1); };
if (!specFile || !bodies.size || !out) fail("Cách dùng: vohon-part.mjs <mô tả.json> --body m:<thân.png>,<áo.png>,<tóc.png> [--body f:…] --out <thư mục>");
const spec = JSON.parse(readFileSync(specFile, "utf8")), base = path.dirname(specFile);
if (!ANCHORS.includes(spec.attach)) fail(`attach: ${ANCHORS.join("|")} (nhận ${spec.attach})`);

const HL = isoLayout("honsu"), [BW, BH] = HL.frame, off = (ISO_VH_FRAME - ISO_HS_FRAME) / 2;

/** Ảnh sau lật ngang rồi xoay `rot` độ (bội 90, chiều kim đồng hồ), kèm điểm pivot tương ứng. */
function transform(img, [px, py], flip, rot) {
  let cur = img, p = [px, py];
  if (flip) {
    const d = new Img(cur.w, cur.h);
    for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) if (cur.alpha(x, y)) d.set(cur.w - 1 - x, y, cur.get(x, y));
    cur = d; p = [cur.w - p[0], p[1]];
  }
  for (let k = 0; k < (((rot ?? 0) / 90) % 4 + 4) % 4; k++) {
    const d = new Img(cur.h, cur.w); // 90° kim đồng hồ: (x, y) → (h − 1 − y, x)
    for (let y = 0; y < cur.h; y++) for (let x = 0; x < cur.w; x++) if (cur.alpha(x, y)) d.set(cur.h - 1 - y, x, cur.get(x, y));
    p = [cur.h - p[1], p[0]]; cur = d;
  }
  return { img: cur, pivot: p };
}

for (const [sex, { fig, skin }] of bodies) {
const dst = path.join(out, sex), grips = {};
mkdirSync(dst, { recursive: true });
for (const [r, d] of ISO_DIRS.entries()) {
  const pieces = spec.dirs?.[d];
  if (!pieces?.length) { console.warn(`[vohon-part] ${d}: không có mảnh, để trống`); continue; }
  const A = frameAnchors(fig, HL.anims.idle[0] * BW, r * BH, BW, BH, skin);
  if (!A) fail(`[vohon-part] ${sex} ${d}: lớp thân trống ở khung đứng`);
  const layers = { b: new Img(ISO_VH_FRAME, ISO_VH_FRAME), f: new Img(ISO_VH_FRAME, ISO_VH_FRAME) };
  for (const raw of pieces) {
    const pc = { ...raw, ...raw[sex] };
    let at;
    if (spec.attach === "hand") {
      const side = pc.hand === "left" ? -1 : 1, hs = A.hands.filter((h) => Math.sign(h.x - A.mid) === side);
      // Bàn tay bên đó: mảng thấp nhất (mảng da ngực / cổ của áo hở nằm cao hơn và gần giữa người).
      at = hs.length ? hs.reduce((a, b) => (b.y > a.y ? b : a)) : null;
      if (at) grips[d] = { x: +at.x.toFixed(2), y: +at.y.toFixed(2) };
      if (!at) fail(`[vohon-part] ${sex} ${d}: khung đứng không thấy tay bên ${pc.hand}`);
    } else at = A[spec.attach];
    const { img, pivot } = transform(readPng(path.join(base, pc.img)), pc.pivot, pc.flip, pc.rot);
    if (pc.rim) {
      const rim = [...hex(pc.rim), 255], edge = [];
      for (let v = 0; v < img.h; v++) for (let u = 0; u < img.w; u++)
        if (img.alpha(u, v) && (v === 0 || !img.alpha(u, v - 1) || u === 0 || !img.alpha(u - 1, v))) edge.push([u, v]);
      for (const [u, v] of edge) img.set(u, v, rim);
    }
    const x = Math.round(at.x + off + (pc.off?.[0] ?? 0) - pivot[0]), y = Math.round(at.y + off + (pc.off?.[1] ?? 0) - pivot[1]);
    const split = typeof pc.layer === "object" ? pc.layer.split : pc.layer === "b" ? Infinity : -Infinity;
    for (let v = 0; v < img.h; v++) for (let u = 0; u < img.w; u++) {
      const X = x + u, Y = y + v;
      if (!img.alpha(u, v) || X < 0 || Y < 0 || X >= ISO_VH_FRAME || Y >= ISO_VH_FRAME) continue;
      (Y < split ? layers.b : layers.f).set(X, Y, img.get(u, v));
    }
    console.log(`[vohon-part] ${sex} ${d}: ${pc.img} pivot → (${(at.x + off).toFixed(1)}, ${(at.y + off).toFixed(1)}) ${spec.attach}${pc.hand ? " " + pc.hand : ""}`);
  }
  // Lớp trống thì không ghi (pack nhận hướng chỉ có một nửa).
  for (const h of ["b", "f"]) if (layers[h].data.some((v, i) => i % 4 === 3 && v)) writeFileSync(path.join(dst, `${d}_${h}.png`), encodePng(layers[h]));
}
if (spec.attach === "hand") writeFileSync(path.join(dst, "grip.json"), JSON.stringify(grips, null, 1) + "\n");
}
