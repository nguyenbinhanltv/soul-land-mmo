// Ghép khung đã chuẩn hóa vào spritesheet isometric bố cục cố định của mục 5.11 (isoLayout trong lib.mjs).
//   node tools/assets/pack.mjs --kind honsu|beast<bậc>|beast --size N --out <sheet.png> <thư mục khung> [--fill] [--breathe <y>]
//   node tools/assets/pack.mjs --kind honsu --set <giới>_<kiểu tóc> <thư mục normalize --split> [--out <thư mục>] [--fill] [--breathe <y>]
//   node tools/assets/pack.mjs --kind vohon --id <võ hồn> --part <thư mục phụ thể> --body m:<thân>,<áo>,<tóc> --body f:<…>
//        --attach hand|head|back|feet [--swing | --angles a,b,c,d] [--out <thư mục>]
//
// Bố cục: hồn sư 24 cột × 6 hàng khung 64×64 (1536×384), phụ thể cùng bố cục cột khung 96×96, hai nửa theo giới 24 × 12 (2304×1152), hồn thú 20 × 5 khung
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
// --code hurt,die,absorb: hồn sư chưa có animation thật (bước 10.4a) thì vẽ các ô này bằng code từ idle khung 0 cùng hàng
//         (absorb từ hướng s), cùng một phép biến đổi cho mọi lớp nên 3 lớp vẫn khớp nét: hurt ngửa người (phần trên dòng
//         --breathe lệch 1 rồi 2 pixel, phần tới --hip lệch 1 pixel), die = hurt khung 2, khuỵu (phần trên --hip hạ
//         ISO_KNEEL pixel), nằm hơi nhấc, nằm (xoay 90°, đầu sang trái, giữa khung, lưng chạm đất); absorb ngồi (hạ
//         ISO_SIT pixel, khung 2 thở). Ô đã có ảnh thật thì giữ nguyên. Cần --breathe; --hip mặc định ISO_HIP.
// --fill: ô bắt buộc còn trống thì chép tạm khung idle đầu cùng hàng (để client không hiện khung rỗng khi mới có vài
//         animation; absorb mượn idle hướng s). validate.mjs cảnh báo các ô chép tạm này.
//
// Phụ thể (--kind vohon): mỗi võ hồn vẽ TĨNH 5 hướng trong khung 96×96, đặt khớp khung đứng (idle khung 0) của lớp thân
// hướng đó (khung thân 64×64 nằm giữa, lệch 16 pixel mỗi phía), tên {hướng}_b.png (sau thân) và {hướng}_f.png (trước thân)
// trong --part/<giới> (vohon-part.mjs dựng; kèm grip.json là tay đã đặt phụ thể ở khung đứng). Mỗi giới một thân mẫu
// (--body m:… --body f:…, bộ m_0 / f_0) ghép vào nửa sheet của giới đó (ISO_VH_SEXES: nam hàng 0–4, nữ hàng 6–10). Với mỗi ô idle / walk / attack / cast của sheet thân, công cụ tìm điểm neo --attach (frameAnchors trong
// lib.mjs) trên khung đó và trên khung đứng cùng hướng rồi dời phụ thể theo độ lệch:
//   hand: mảng da của bàn tay nằm cùng phía (so với giữa người) với mảng tay gần phụ thể nhất ở khung đứng; khung không
//         thấy tay (bị thân che) thì giữ độ lệch của khung trước. --swing: thêm xoay vũ khí quanh tay theo ISO_ATTACK_SWING
//         ở 4 khung attack; --angles a,b,c,d: góc riêng của võ hồn (vũ khí dài vung ít hơn để khỏi ra ngoài khung 96).
//         Xoay kiểu RotSprite (Scale2x ×4 rồi lấy mẫu) nên nét chéo không răng cưa, màu giữ nguyên.
//   head: giữa hàng trên cùng; back: trọng tâm phần thân trên; feet: phụ thể mọc trên đất (thảm cỏ, vòng) đứng yên theo gốc chân.
// Ghi <out>/<id>_b.png và <out>/<id>_f.png (mặc định shared/assets/sprites/vohon). Phụ thể không có ảnh hướng nào thì ô
// hướng đó để trống.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { readPng, encodePng, Img, SPRITES, HS_LAYERS, ISO_DIRS, ISO_FLIP, ISO_BEAST_TIER, ISO_BEAST_SIZES, ISO_HS_FRAME, ISO_HS_ORIGIN, ISO_HS_ROWS, ISO_VH_FRAME, ISO_VH_SEXES, vohonBodies, ISO_ATTACK_SWING, ISO_HIP, ISO_KNEEL, ISO_SIT, ISO_LIE_HALF, ANCHORS, isoLayout, frameAnchors } from "./lib.mjs";

const args = process.argv.slice(2);
const bodies = vohonBodies(args); // --kind vohon: --body <giới>:<thân>,<áo>,<tóc> (gỡ khỏi args trước khi đọc tham số khác)
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const kind = opt("--kind", "honsu"), out = opt("--out", ""), fill = flag("--fill"), breathe = opt("--breathe", ""), set = opt("--set", "");
const code = opt("--code", ""), hip = +opt("--hip", ISO_HIP);
const size = opt("--size", ""), id = opt("--id", ""), partDir = opt("--part", ""), attach = opt("--attach", "hand"), anglesOpt = opt("--angles", ""), swing = flag("--swing") || !!anglesOpt;
const swingAngles = anglesOpt ? anglesOpt.split(",").map(Number) : ISO_ATTACK_SWING;
const dir = args[0];
const usage = "Cách dùng: pack.mjs --kind honsu|beast<bậc>|beast --size N --out <sheet.png> <thư mục khung> [--fill] [--breathe <y>]\n" +
  "          pack.mjs --kind honsu --set <giới>_<kiểu tóc> <thư mục normalize --split> [--out <thư mục>]\n" +
  "          pack.mjs --kind vohon --id <võ hồn> --part <thư mục> --body m:<thân>,<áo>,<tóc> [--body f:…] --attach hand|head|back|feet [--swing | --angles a,b,c,d]";
const fail = (m) => { console.error(m); process.exit(1); };
const ISO_ZERO = { x: 0, y: 0 };
if (kind === "vohon" ? !(id && partDir && bodies.size) : (!out && !set) || !dir) fail(usage);
if (set && (kind !== "honsu" || !/^[mf]_\d+$/.test(set))) fail(`--set cần --kind honsu và dạng m_0 / f_2 (nhận: ${kind}, ${set})`);
const CODE_ANIMS = ["hurt", "die", "absorb"], codeList = code ? code.split(",") : [];
if (codeList.some((a) => !CODE_ANIMS.includes(a)) || (code && (kind !== "honsu" || !breathe))) fail(`--code chỉ cho --kind honsu kèm --breathe, gồm ${CODE_ANIMS.join(",")} (nhận ${code})`);
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
  if (codeList.length) codeAnims(sheet, filled);
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

/** Khung `src` (FW × FH) với các dải hàng [y0, y1) dời ngang / dọc; phần dời đè lên phần đứng yên (lớp trên của chính lớp này). */
function shift(src, bands) {
  const dst = new Img(FW, FH), moved = new Set(bands.flatMap(([y0, y1]) => Array.from({ length: y1 - y0 }, (_, i) => y0 + i)));
  for (let y = 0; y < FH; y++) if (!moved.has(y)) dst.blit(src, 0, y, FW, 1, 0, y, true);
  for (const [y0, y1, dx, dy] of bands) dst.blit(src, 0, y0, FW, y1 - y0, dx, y0 + dy, true);
  return dst;
}

/** Xoay 90° ngược chiều kim đồng hồ quanh tâm khung (đầu sang trái), rồi hạ `dy` pixel. Điểm ảnh giữ nguyên, không nội suy. */
function lie(src, dy) {
  const dst = new Img(FW, FH);
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (src.alpha(x, y)) {
    const X = y, Y = FW - 1 - x + dy;
    if (Y >= 0 && Y < FH) dst.set(X, Y, src.get(x, y));
  }
  return dst;
}

/** --code: vẽ hurt / die / absorb từ idle khung 0 vào các ô còn trống (xem đầu file). */
function codeAnims(sheet, filled) {
  const cut = +breathe + 1, [i0] = L.anims.idle, put = (img, r, c) => {
    if (filled.has(`${r},${c}`)) return;
    sheet.blit(img, 0, 0, FW, FH, c * FW, r * FH); filled.add(`${r},${c}`);
  };
  const lean = (src, k) => shift(src, k === 1 ? [[0, cut, -1, 0]] : [[0, cut, -2, 0], [cut, hip, -1, 0]]);
  for (let r = 0; r < ISO_DIRS.length; r++) {
    if (!filled.has(`${r},${i0}`)) continue;
    const idle = new Img(FW, FH); idle.blit(sheet, i0 * FW, r * FH, FW, FH, 0, 0);
    if (codeList.includes("hurt")) { const [c0] = L.anims.hurt; put(lean(idle, 1), r, c0); put(lean(idle, 2), r, c0 + 1); }
    if (codeList.includes("die")) {
      // Người đứng rộng khoảng 2 × ISO_LIE_HALF quanh giữa khung; xoay xong hạ cho mép lưng chạm dòng gốc.
      const [c0] = L.anims.die, flat = ISO_HS_ORIGIN[1] - (FW >> 1) + 1 - ISO_LIE_HALF;
      put(lean(idle, 2), r, c0); put(shift(idle, [[0, hip, 0, ISO_KNEEL]]), r, c0 + 1);
      put(lie(idle, flat - 3), r, c0 + 2); put(lie(idle, flat), r, c0 + 3);
    }
    if (codeList.includes("absorb") && r === 0) {
      put(shift(idle, [[0, hip, 0, ISO_SIT]]), ISO_DIRS.length, 0);
      put(shift(idle, [[0, cut, 0, ISO_SIT + 1], [cut, hip, 0, ISO_SIT]]), ISO_DIRS.length, 1);
    }
  }
}

/** Scale2x (EPX): phóng đôi ảnh pixel, nét chéo được làm mượt mà không thêm màu mới. */
function scale2x(src) {
  const dst = new Img(src.w * 2, src.h * 2), at = (x, y) => (x < 0 || y < 0 || x >= src.w || y >= src.h ? null : src.get(x, y));
  const eq = (p, q) => (p === null || q === null ? p === q : p[3] === 0 && q[3] === 0 ? true : p[0] === q[0] && p[1] === q[1] && p[2] === q[2] && p[3] === q[3]);
  const T = [0, 0, 0, 0];
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const P = src.get(x, y), A = at(x, y - 1) ?? T, B = at(x + 1, y) ?? T, C = at(x - 1, y) ?? T, D = at(x, y + 1) ?? T;
    dst.set(2 * x, 2 * y, eq(C, A) && !eq(C, D) && !eq(A, B) ? A : P);
    dst.set(2 * x + 1, 2 * y, eq(A, B) && !eq(A, C) && !eq(B, D) ? B : P);
    dst.set(2 * x, 2 * y + 1, eq(D, C) && !eq(D, B) && !eq(C, A) ? C : P);
    dst.set(2 * x + 1, 2 * y + 1, eq(B, D) && !eq(B, A) && !eq(D, C) ? D : P);
  }
  return dst;
}

/**
 * Xoay ảnh `src` quanh (cx, cy) góc `deg` theo cách RotSprite: phóng Scale2x hai lần (×4) rồi lấy mẫu nearest-neighbor ngược ở
 * độ phân giải ×4, nên nét chéo không răng cưa như xoay thẳng mà vẫn giữ pixel nguyên màu (không nội suy).
 */
function rotate(src, cx, cy, deg) {
  if (!deg) return src;
  const big = scale2x(scale2x(src)), K = 4;
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), dst = new Img(src.w, src.h);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const u = Math.floor((cx + c * dx + s * dy) * K), v = Math.floor((cy - s * dx + c * dy) * K);
    if (u >= 0 && v >= 0 && u < big.w && v < big.h && big.alpha(u, v)) dst.set(x, y, big.get(u, v));
  }
  return dst;
}

/** Phụ thể: ghép phụ thể tĩnh 5 hướng vào sheet theo điểm neo của từng khung thân. */
function packVohon() {
  const HL = isoLayout("honsu"), [BW, BH] = HL.frame;
  for (const { w, h } of bodies.values()) if (w !== BW * HL.cols || h !== BH * HL.rows) fail(`[pack] --body cần sheet hồn sư isometric ${BW * HL.cols}×${BH * HL.rows}`);
  const off = (ISO_VH_FRAME - ISO_HS_FRAME) / 2; // khung thân nằm giữa khung phụ thể
  const outB = new Img(FW * L.cols, FH * L.rows), outF = new Img(FW * L.cols, FH * L.rows);
  let placed = 0;
  for (const [sex, { fig, skin }] of bodies) {
  // Một giới duy nhất và --part không có thư mục con theo giới thì đọc thẳng --part.
  const dir = existsSync(path.join(partDir, sex)) ? path.join(partDir, sex) : partDir, r0 = ISO_VH_SEXES.indexOf(sex) * ISO_HS_ROWS;
  const grips = existsSync(path.join(dir, "grip.json")) ? JSON.parse(readFileSync(path.join(dir, "grip.json"), "utf8")) : {};
  for (const [r, d] of ISO_DIRS.entries()) {
    const parts = ["b", "f"].map((h) => path.join(dir, `${d}_${h}.png`)).map((f) => (existsSync(f) ? readPng(f) : null));
    if (!parts[0] && !parts[1]) { console.warn(`[pack] ${sex} ${d}: không có ${d}_b.png / ${d}_f.png trong ${dir}, để trống`); continue; }
    for (const p of parts) if (p && (p.w !== FW || p.h !== FH)) fail(`[pack] phụ thể ${sex} ${d}: ${p.w}×${p.h}, cần ${FW}×${FH}`);
    const at = (c) => frameAnchors(fig, c * BW, r * BH, BW, BH, skin);
    const ref = at(HL.anims.idle[0]);
    if (!ref) { console.warn(`[pack] ${sex} ${d}: lớp thân trống ở khung đứng, bỏ qua hướng này`); continue; }
    // Tay cầm phụ thể ở khung đứng: mảng da gần tay vohon-part đã đặt (grip.json), không có thì gần điểm phụ thể nhất (tọa độ khung thân).
    let grip = null;
    if (attach === "hand") {
      const pts = [];
      if (grips[d]) pts.push([grips[d].x, grips[d].y]);
      else for (const p of parts) if (p) for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (p.alpha(x, y)) pts.push([x - off + 0.5, y - off + 0.5]);
      const dist = (h) => Math.min(...pts.map(([x, y]) => Math.hypot(x - h.x, y - h.y)));
      grip = ref.hands.length ? ref.hands.reduce((a, b) => (dist(b) < dist(a) ? b : a)) : null;
      if (!grip) console.warn(`[pack] ${sex} ${d}: khung đứng không thấy tay, phụ thể đứng yên theo thân`);
    }
    const side = grip && !grips[d]?.free ? Math.sign(grip.x - ref.mid) : 0;
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
        } else if (attach === "feet") { pt = base = ISO_ZERO; // mọc trên đất: đứng yên theo gốc chân, không rung theo bước
        } else if (attach !== "hand") { pt = cur[attach]; base = ref[attach]; }
        const dxy = pt && base ? { dx: Math.round(pt.x - base.x), dy: Math.round(pt.y - base.y) } : last;
        last = dxy;
        const deg = swing && a === "attack" && attach === "hand" ? swingAngles[i] ?? 0 : 0;
        for (const [h, p] of parts.entries()) {
          if (!p) continue;
          const src = grip ? rotate(p, grip.x + off, grip.y + off, deg) : p, cell = new Img(FW, FH);
          cell.blit(src, 0, 0, FW, FH, dxy.dx, dxy.dy, true); // dời trong ô, phần ra ngoài ô bị cắt
          (h ? outF : outB).blit(cell, 0, 0, FW, FH, c * FW, (r0 + r) * FH, true);
        }
        placed++;
      }
    }
  }
  }
  const dst = out || path.join(SPRITES, "vohon");
  mkdirSync(dst, { recursive: true });
  // Nửa không có điểm ảnh nào (phụ thể neo sau lưng chỉ vẽ một nửa) không ghi ra file: client không tải nửa trống (#974); ghi "blank": true ở manifest.
  for (const [h, img] of [["b", outB], ["f", outF]]) {
    const f = path.join(dst, `${id}_${h}.png`);
    if (img.data.every((v, i) => i % 4 !== 3 || !v)) {
      for (const g of [f, f.replace(/\.png$/, "_n.png")]) rmSync(g, { force: true });
      console.log(`[pack] ${id}_${h}: nửa trống, không ghi file; thêm "blank": true cho key vh_${id}_${h} trong manifest.json`);
    } else writeFileSync(f, encodePng(img));
  }
  console.log(`[pack] ${path.join(dst, `${id}_{b,f}.png`)}: ${outB.w}×${outB.h}, ${placed} khung, neo ${attach}${swing ? " + vung" : ""}`);
}

if (kind === "vohon") packVohon();
else if (set) for (const layer of HS_LAYERS) pack(path.join(dir, layer), path.join(out || path.join(SPRITES, "honsu"), `${layer}_${set}.png`));
else pack(dir, out);
