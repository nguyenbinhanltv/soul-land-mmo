// Ghép khung đã chuẩn hóa vào spritesheet isometric bố cục cố định của mục 5.11 (isoLayout trong lib.mjs).
//   node tools/assets/pack.mjs --kind honsu|beast<bậc>|beast --size N --out <sheet.png> <thư mục khung> [--fill] [--breathe <y>]
//   node tools/assets/pack.mjs --kind honsu --set <giới>_<kiểu tóc> <thư mục normalize --split> [--out <thư mục>] [--fill] [--breathe <y>]
//   node tools/assets/pack.mjs --kind vohon --id <võ hồn> --part <thư mục phụ thể> --body <sheet thân>[,<sheet áo>,<sheet tóc>]
//        --attach hand|head|back|feet [--swing] [--out <thư mục>]
//
// Bố cục: hồn sư 24 cột × 6 hàng khung 64×64 (1536×384), phụ thể cùng bố cục khung 96×96 (2304×576), hồn thú 20 × 5 khung
// theo bậc. Hàng 0–4 là hướng s, se, e, ne, n (3 hướng còn lại client lật ngang); hồn sư hàng 5 cột 0–1 là `absorb`.
// Tên file khung: {hướng}_{animation}_{i}.png (hồn sư: idle 4, walk 6, attack 4, cast 3, hurt 2, die 4; hồn thú: idle 4,
// walk 6, attack 4, hurt 2, die 4), absorb_{i}.png. PixelLab trả số khung khác (cross-punch 6 khung cho attack 4) thì chọn
// đều khung cho đủ số: khung đầu và khung cuối luôn giữ.
//
// --set m_2: ghép một bộ hồn sư giới × kiểu tóc (mục 5.11) từ 3 thư mục con body/outfit/hair mà `normalize --split`
//         tách ra từ cùng một hình, ghi honsu/{body,outfit,hair}_m_2.png (mặc định vào shared/assets/sprites/honsu,
//         --out đổi thư mục). Cùng --breathe/--fill cho cả 3 lớp để các lớp khớp khung.
// --breathe <y>: idle mỗi hướng chỉ có khung 0 (ảnh rotations của PixelLab) thì tạo đủ 4 khung thở: khung 1, 2 dời mọi điểm
//         có y ≤ <y> xuống 1 pixel (đầu và vai nhích 1 pixel, mục 5.11), khung 3 như khung 0. Hồn sư: dùng cùng <y> cho
//         mọi lớp, ngay dưới vai (khung 64: khoảng 30; validate cảnh báo lớp nào cả 4 khung idle giống nhau). Hồn thú: <y> ngang lưng để đầu và lưng nhích, chân đứng yên.
// --fill: ô bắt buộc còn trống thì chép tạm khung idle đầu cùng hàng (để client không hiện khung rỗng khi mới có vài
//         animation; absorb mượn idle hướng s). validate.mjs cảnh báo các ô chép tạm này.
//
// Phụ thể (--kind vohon): mỗi võ hồn vẽ TĨNH 5 hướng trong khung 96×96, đặt khớp khung đứng (idle khung 0) của lớp thân
// hướng đó (khung thân 64×64 nằm giữa, lệch 16 pixel mỗi phía), tên {hướng}_b.png (sau thân) và {hướng}_f.png (trước thân)
// trong --part. Với mỗi ô idle / walk / attack / cast của sheet thân, công cụ tìm điểm neo --attach (frameAnchors trong
// lib.mjs) trên khung đó và trên khung đứng cùng hướng rồi dời phụ thể theo độ lệch:
//   hand: mảng da của bàn tay nằm cùng phía (so với giữa người) với mảng tay gần phụ thể nhất ở khung đứng; khung không
//         thấy tay (bị thân che) thì giữ độ lệch của khung trước. --swing: thêm xoay vũ khí quanh tay theo ISO_ATTACK_SWING
//         ở 4 khung attack.
//   head: giữa hàng trên cùng; back: trọng tâm phần thân trên; feet: giữa hàng dưới cùng.
// Ghi <out>/<id>_b.png và <out>/<id>_f.png (mặc định shared/assets/sprites/vohon). Phụ thể không có ảnh hướng nào thì ô
// hướng đó để trống.
import { readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { readPng, encodePng, Img, SPRITES, HS_LAYERS, ISO_DIRS, ISO_FLIP, ISO_BEAST_TIER, ISO_BEAST_SIZES, ISO_HS_FRAME, ISO_VH_FRAME, ISO_ATTACK_SWING, ANCHORS, isoLayout, frameAnchors } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const kind = opt("--kind", "honsu"), out = opt("--out", ""), fill = flag("--fill"), breathe = opt("--breathe", ""), set = opt("--set", "");
const size = opt("--size", ""), id = opt("--id", ""), partDir = opt("--part", ""), bodyOpt = opt("--body", ""), attach = opt("--attach", "hand"), swing = flag("--swing");
const dir = args[0];
const usage = "Cách dùng: pack.mjs --kind honsu|beast<bậc>|beast --size N --out <sheet.png> <thư mục khung> [--fill] [--breathe <y>]\n" +
  "          pack.mjs --kind honsu --set <giới>_<kiểu tóc> <thư mục normalize --split> [--out <thư mục>]\n" +
  "          pack.mjs --kind vohon --id <võ hồn> --part <thư mục> --body <sheet thân>[,áo,tóc] --attach hand|head|back|feet [--swing]";
const fail = (m) => { console.error(m); process.exit(1); };
if (kind === "vohon" ? !(id && partDir && bodyOpt) : (!out && !set) || !dir) fail(usage);
if (set && (kind !== "honsu" || !/^[mf]_\d+$/.test(set))) fail(`--set cần --kind honsu và dạng m_0 / f_2 (nhận: ${kind}, ${set})`);
if (kind === "vohon" && !ANCHORS.includes(attach)) fail(`--attach ${ANCHORS.join("|")} (nhận ${attach})`);

let L;
try {
  if (kind === "honsu" || kind === "vohon") L = isoLayout(kind);
  else if (/^beast\d$/.test(kind) && ISO_BEAST_TIER[+kind.slice(5)]) L = isoLayout("beast", ISO_BEAST_TIER[+kind.slice(5)]);
  else if (kind === "beast") L = isoLayout("beast", +size);
  else fail(`--kind không hợp lệ: ${kind} (honsu, vohon, beast0–4, beast --size ${ISO_BEAST_SIZES.join("|")})`);
} catch (e) { fail(e.message); }
const [FW, FH] = L.frame;

/** Chọn đều `n` chỉ số trong `have` khung (giữ khung đầu và cuối; ít khung hơn thì lặp lại). */
const pickEven = (have, n) => Array.from({ length: n }, (_, i) => (n === 1 ? 0 : Math.round((i * (have - 1)) / (n - 1))));

/** Ghép mọi khung trong `dir` thành một sheet và ghi ra `outFile`. */
function pack(dir, outFile) {
  const sheet = new Img(FW * L.cols, FH * L.rows), filled = new Set();
  // Gom khung theo (hướng, animation) rồi mới đặt, để chọn đều khi số khung khác bố cục.
  const groups = new Map();
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".png")).sort()) {
    const cell = L.cellOf(path.basename(f, ".png"));
    if (!cell) {
      const flip = ISO_FLIP[path.basename(f, ".png").split("_")[0]];
      console.warn(`[pack] bỏ qua ${f}: ${flip ? `hướng lật (client lật ${flip}; xem so bằng preview.mjs --dirs8 --raw)` : "tên không đúng quy ước"}`);
      continue;
    }
    const img = readPng(path.join(dir, f));
    if (img.w !== FW || img.h !== FH) fail(`[pack] ${f}: ${img.w}×${img.h}, cần ${FW}×${FH} (chạy normalize trước)`);
    const g = `${cell.row},${cell.col}`;
    if (!groups.has(g)) groups.set(g, { cell, frames: [] });
    groups.get(g).frames.push({ i: cell.i, img });
  }
  for (const { cell, frames } of groups.values()) {
    frames.sort((a, b) => a.i - b.i);
    // Đủ khung đánh số liền 0..n-1 thì đặt đúng chỗ (thiếu khung giữa thì để trống cho --fill); thừa thì chọn đều.
    const exact = frames.every((f) => f.i < cell.n);
    const pick = exact ? frames.map((f) => [f.i, f]) : pickEven(frames.length, cell.n).map((j, i) => [i, frames[j]]);
    if (!exact) console.log(`[pack] ${cell.dir}_${cell.anim}: ${frames.length} khung → ${cell.n} (chọn khung ${pickEven(frames.length, cell.n).join(", ")})`);
    for (const [i, f] of pick) { sheet.blit(f.img, 0, 0, FW, FH, (cell.col + i) * FW, cell.row * FH); filled.add(`${cell.row},${cell.col + i}`); }
  }

  if (breathe && L.anims.idle) {
    const cut = +breathe, [c0, n] = L.anims.idle;
    for (let r = 0; r < ISO_DIRS.length; r++) {
      if (!filled.has(`${r},${c0}`)) continue;
      for (let i = 1; i < n; i++) {
        if (filled.has(`${r},${c0 + i}`)) continue;
        const x = (c0 + i) * FW, y0 = r * FH;
        sheet.blit(sheet, c0 * FW, y0, FW, FH, x, y0);
        if (i < n - 1) { // khung giữa: đầu và vai nhích xuống 1 pixel; khung cuối như khung 0 để vòng lặp êm
          sheet.blit(sheet, c0 * FW, y0, FW, cut + 1, x, y0 + 1); // chép từ khung 0 (không chép chồng trong cùng ô)
          for (let X = 0; X < FW; X++) sheet.set(x + X, y0, [0, 0, 0, 0]);
        }
        filled.add(`${r},${c0 + i}`);
      }
    }
  }
  const missing = L.required.filter((c) => !filled.has(c.join(",")));
  if (fill) {
    for (const [r, c] of missing) {
      // Hàng absorb mượn idle hướng s.
      const src = r >= ISO_DIRS.length ? [0, 0] : [r, 0];
      if (!filled.has(src.join(","))) continue;
      sheet.blit(sheet, src[1] * FW, src[0] * FH, FW, FH, c * FW, r * FH);
    }
  }
  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, encodePng(sheet));
  console.log(`[pack] ${outFile}: ${sheet.w}×${sheet.h}, ${filled.size} khung` +
    (missing.length ? `, thiếu ${missing.length} ô bắt buộc${fill ? " (đã chép tạm idle)" : ""}` : ""));
}

/** Xoay ảnh `src` quanh (cx, cy) góc `deg` (nearest-neighbor ngược, giữ pixel nguyên màu). */
function rotate(src, cx, cy, deg) {
  if (!deg) return src;
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), dst = new Img(src.w, src.h);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const u = Math.floor(cx + c * dx + s * dy), v = Math.floor(cy - s * dx + c * dy);
    if (u >= 0 && v >= 0 && u < src.w && v < src.h && src.alpha(u, v)) dst.set(x, y, src.get(u, v));
  }
  return dst;
}

/** Phụ thể: ghép phụ thể tĩnh 5 hướng vào sheet theo điểm neo của từng khung thân. */
function packVohon() {
  const sheets = bodyOpt.split(",").map((f) => readPng(f));
  const HL = isoLayout("honsu"), [BW, BH] = HL.frame;
  if (sheets.some((s) => s.w !== BW * HL.cols || s.h !== BH * HL.rows)) fail(`[pack] --body cần sheet hồn sư isometric ${BW * HL.cols}×${BH * HL.rows}`);
  const fig = new Img(sheets[0].w, sheets[0].h);
  for (const s of sheets) fig.blit(s, 0, 0, s.w, s.h, 0, 0, true);
  const off = (ISO_VH_FRAME - ISO_HS_FRAME) / 2; // khung thân nằm giữa khung phụ thể
  const outB = new Img(FW * L.cols, FH * L.rows), outF = new Img(FW * L.cols, FH * L.rows);
  let placed = 0;
  for (const [r, d] of ISO_DIRS.entries()) {
    const parts = ["b", "f"].map((h) => path.join(partDir, `${d}_${h}.png`)).map((f) => (existsSync(f) ? readPng(f) : null));
    if (!parts[0] && !parts[1]) { console.warn(`[pack] ${d}: không có ${d}_b.png / ${d}_f.png trong --part, để trống`); continue; }
    for (const p of parts) if (p && (p.w !== FW || p.h !== FH)) fail(`[pack] phụ thể ${d}: ${p.w}×${p.h}, cần ${FW}×${FH}`);
    const at = (c) => frameAnchors(fig, c * BW, r * BH, BW, BH, sheets[0]);
    const ref = at(HL.anims.idle[0]);
    if (!ref) { console.warn(`[pack] ${d}: lớp thân trống ở khung đứng, bỏ qua hướng này`); continue; }
    // Tay cầm phụ thể ở khung đứng: mảng da gần điểm phụ thể nhất (tọa độ khung thân).
    let grip = null;
    if (attach === "hand") {
      const pts = [];
      for (const p of parts) if (p) for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (p.alpha(x, y)) pts.push([x - off + 0.5, y - off + 0.5]);
      const dist = (h) => Math.min(...pts.map(([x, y]) => Math.hypot(x - h.x, y - h.y)));
      grip = ref.hands.length ? ref.hands.reduce((a, b) => (dist(b) < dist(a) ? b : a)) : null;
      if (!grip) console.warn(`[pack] ${d}: khung đứng không thấy tay, phụ thể đứng yên theo thân`);
    }
    const side = grip ? Math.sign(grip.x - ref.mid) : 0;
    for (const a of ["idle", "walk", "attack", "cast"]) {
      const [c0, n] = HL.anims[a];
      let last = { dx: 0, dy: 0 };
      for (let i = 0; i < n; i++) {
        const c = c0 + i, cur = at(c);
        if (!cur) continue; // ô thân trống: phụ thể cũng trống
        let pt = null, base = null;
        if (attach === "hand" && grip) {
          // Tay cùng phía với tay cầm ở khung đứng; nhiều mảng thì lấy mảng gần vị trí trước đó nhất.
          const prev = { x: grip.x + last.dx, y: grip.y + last.dy };
          const same = cur.hands.filter((h) => !side || Math.sign(h.x - cur.mid) === side || Math.abs(h.x - cur.mid) < 1);
          pt = same.length ? same.reduce((p, q) => (Math.hypot(q.x - prev.x, q.y - prev.y) < Math.hypot(p.x - prev.x, p.y - prev.y) ? q : p)) : null;
          base = grip;
        } else if (attach !== "hand") { pt = cur[attach]; base = ref[attach]; }
        const dxy = pt && base ? { dx: Math.round(pt.x - base.x), dy: Math.round(pt.y - base.y) } : last;
        last = dxy;
        const deg = swing && a === "attack" && attach === "hand" ? ISO_ATTACK_SWING[i] ?? 0 : 0;
        for (const [h, p] of parts.entries()) {
          if (!p) continue;
          const src = grip ? rotate(p, grip.x + off, grip.y + off, deg) : p, cell = new Img(FW, FH);
          cell.blit(src, 0, 0, FW, FH, dxy.dx, dxy.dy, true); // dời trong ô, phần ra ngoài ô bị cắt
          (h ? outF : outB).blit(cell, 0, 0, FW, FH, c * FW, r * FH, true);
        }
        placed++;
      }
    }
  }
  const dst = out || path.join(SPRITES, "vohon");
  mkdirSync(dst, { recursive: true });
  for (const [h, img] of [["b", outB], ["f", outF]]) writeFileSync(path.join(dst, `${id}_${h}.png`), encodePng(img));
  console.log(`[pack] ${path.join(dst, `${id}_{b,f}.png`)}: ${outB.w}×${outB.h}, ${placed} khung, neo ${attach}${swing ? " + vung" : ""}`);
}

if (kind === "vohon") packVohon();
else if (set) for (const layer of HS_LAYERS) pack(path.join(dir, layer), path.join(out || path.join(SPRITES, "honsu"), `${layer}_${set}.png`));
else pack(dir, out);
