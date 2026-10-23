// Nhập ảnh "giả pixel" từ Gemini (hoặc công cụ ảnh AI khác vẽ nhiều vật trên nền đặc) vào dây chuyền asset isometric.
//   node tools/assets/gemini-import.mjs --kind tile|tile-block|honsu|vohon|beast|object|portrait --out <thư mục> <ảnh> [tùy chọn]
//
// Các bước:
//   1. Xóa logo Gemini (ngôi sao trắng mờ ở góc dưới phải): dò phần sao nằm trên nền, dựng lại hình sao và
//      gỡ lớp trắng mờ (tách alpha) cả ở phần đè lên vật; --logo x,y,w,h thì vá vùng đó bằng màu lân cận.
//   2. Xóa nền màu khóa (mặc định màu ở 4 góc, thường #FF00FF) theo ngưỡng, rồi gỡ 2 lớp điểm viền nhiễm hồng.
//   3. Tách vật: thành phần liên thông (mảnh nhỏ gần vật lớn gộp vào vật đó) hoặc lưới --grid cột x hàng.
//   4. Dò cỡ "điểm ảnh giả" theo chu kỳ cạnh (phổ của tổng chênh lệch giữa hai cột / hai hàng kề nhau), cắt lưới
//      thích nghi theo đỉnh cạnh gần nhất (ô AI không đều 5–7 px), mỗi ô lấy màu chủ đạo (medoid: một điểm thật
//      của ô, không nội suy) → ảnh "pixel thật".
//   5. Lượng tử màu: auto-item (mỗi vật một bảng riêng; mặc định cho tile / tile-block vì art/palette.gpl hiện nay
//      thiếu dải đất / đá / nước trầm), art/palette.gpl (mặc định cho sprite), auto (một bảng chung cả lô) hoặc none.
//   6. Đưa về khung đích bằng lấy mẫu 4×4 điểm mỗi pixel đích rồi chọn màu nhiều phiếu nhất (không nội suy):
//      - tile:       mặt trên hình thoi ép về đúng 2:1 rồi đặt vào ảnh ô isoTileImage(W) (mục 5.11): mặc định
//                    xuất cả ô logic (bề ngang ISO_TILE_W; với 32: thoi 32×16 trong ảnh 32×32, tâm (16,19)) và ô lớn
//                    2×2 (bề ngang 2 × ISO_TILE_W; với 64: thoi 64×32 trong ảnh 64×64, tâm (32,37)), mỗi cỡ một thư
//                    mục con <out>/<W>. Đỉnh thoi dò bằng cách khớp đường
//                    thẳng vào mép trên (bỏ ngọn cỏ nhô lên); thu vào --inset điểm để bỏ viền / dải mép; --seamless trộn
//                    (dither có thứ tự) vùng mép với bản dời nửa chu kỳ để ô ghép liền với chính nó. Đáy ô (bị ô phía
//                    trước che khi lát) lấy từ mặt bên của khối gốc, giãn về bề dày quy cách; khối gốc không có mặt bên
//                    thì kéo mép dưới mặt trên xuống, tô tối dần. Ô nền không viền (điểm gần đen ở đáy bị thay).
//      - tile-block: như tile nhưng giữ viền (tối về #1a1020), không làm liền mép, không thu mép (mép vách, bờ nước).
//      - sprite (khung và gốc lấy từ hằng ISO_* trong lib.mjs: honsu ISO_HS_FRAME / ISO_HS_ORIGIN, vohon ISO_VH_FRAME /
//        ISO_VH_ORIGIN; beast cần --size một cỡ trong ISO_BEAST_SIZES, chân cách đáy ISO_BEAST_FOOT; object cần --size,
//        chân cách đáy ISO_PROP_FOOT): mọi vật trong một lần chạy dùng CHUNG hệ số thu (--scale đặt hẳn), chân (đáy hộp bao) đặt
//        vào gốc, viền ngoài tối về #1a1020 và thêm viền nơi còn thiếu.
//      - portrait (mặc định ISO_PORTRAIT): ô là khung nền tối (thẻ võ hồn) → phần đặc của khung cắt từ ảnh gốc, cắt giữa 1:1
//        (lệch cỡ nhiều thì thu / phóng phủ kín), không viền ngoài; ô nền trong suốt thì căn giữa như sprite.
//      - item (mặc định ISO_ITEM_ICON): ô là khung nền tối như portrait, nhưng nền khung được làm trong suốt (clearPanel),
//        mỗi món vừa khung riêng (renderIcon), viền #1a1020.
//   7. Ghi <out>/<tên>.png (ô: <out>/<cỡ>/<tên>.png), _preview.png (phóng --preview, mặc định ×4) và <out>/_report.json
//      (cỡ ô giả, độ phân giải gốc, tỉ lệ thoi, dải mép đã bỏ, điểm lệch mép ghép); bảng auto / auto-item ghi thêm
//      <out>/_palette.gpl.
//
// Tùy chọn:
//   --names a,b,…          tên file theo thứ tự đọc (hàng trên → dưới, trái → phải); thiếu thì <kind>_<i>.
//                          Số tên khác số vật tách được thì dừng (in hộp bao từng vật) để không gán nhầm tên.
//   --grid CxR             tách theo lưới đều C cột × R hàng thay vì thành phần liên thông.
//   --cell auto|<số>       cỡ điểm ảnh giả; số thì dùng lưới đều cỡ đó (1 = ảnh đã là pixel thật).
//   --size WxH|N           khung sprite (N = N×N). Ô: danh sách bề ngang thoi (chia hết cho 4), mặc định ô logic và ô lớn
//                          (ISO_TILE_W, 2 × ISO_TILE_W); --face-only thì chỉ ghi mặt trên W×W/2, không đặt vào ảnh ô.
//   --anchor x,y           gốc chân trong khung sprite.
//   --palette auto-item|gpl|auto|none|<file.gpl>   --colors: số màu mỗi vật với auto-item (mặc định 10, chân dung 32) hoặc của
//                          bảng auto chung cả lô (mặc định 32; tấm nhiều chất liệu thì ô đều màu chỉ còn 1–3 màu).
//   --scale S              (sprite) hệ số thu chung đặt hẳn thay vì vừa vật lớn nhất.
//   --logo auto|off|x,y,w,h|star:cx,cy,R[,alpha]   --key #rrggbb (màu nền; mặc định đọc ở góc ảnh)   --tol 60
//   --cut-base a,b|all     (sprite) cắt đế đất thoi dày dưới chân các vật có tên này (cutBase); --base-tol 1500 độ
//                          sai khác màu (khoảng cách RGB có trọng số) để coi một điểm mặt trên là đất của đế.
//   --gray a,b|all         (sprite) ghi bản xám (độ sáng giữ nguyên) để client tô màu, ví dụ hồn cốt theo niên hạn.
//   --bg-tol 3500          (item) sai khác màu để coi một điểm là nền khung tối khi làm trong suốt.
//   --icon                 (item) vật vẽ trên nền màu khóa / trong suốt (không có khung nền tối): mỗi món vừa khung riêng và căn
//                          giữa như biểu tượng (renderIcon; phóng tối đa ICON_MAX_UP = 1,5 để các lưới / bậc đồng cỡ, vật nhỏ
//                          trong lưới không thành chấm), thay vì đặt chân xuống đáy như sprite. Ảnh nền trong suốt thật
//                          (ChatGPT; điểm alpha ≥ 128 là vật, alpha thấp là nhiễu) tự nhận, không cần --key.
//   --key2 #808080        (sprite, phụ thể võ hồn) ma-nơ-canh xám dùng làm khuôn: xóa nó (--key2-tol 18), căn chân và tâm ngang theo
//                          ma-nơ-canh, hệ số thu chung = --man-h (mặc định 52 điểm, chiều cao người chơi) / chiều cao ma-nơ-canh (trung vị).
//   --kind ui --size WxH   mảnh giao diện lớn (mặc định --grid 1x1: cả ảnh là MỘT mảnh, kể cả phần rời như tia / chữ ngoài vòng) (khung radar tròn, la bàn, nền giấy bản đồ): ảnh nền #FF00FF (tự dò ở góc) hoặc trong suốt thật → nền
//                          trong suốt (lòng khung tròn cũng trong suốt vì xóa theo màu), về pixel thật, vừa khung đích giữ tỉ lệ, căn giữa, bảng màu
//                          riêng (--colors 24), KHÔNG thêm viền. --opaque: ảnh tràn khung không nền (nền giấy), giữ nguyên mọi điểm; logo Gemini
//                          trên nền cùng màu giấy không tự dò được: --logo star:<rộng-98>,<cao-98>,42 (ảnh 2400×1792; tỉ lệ theo cạnh dài).
//   --frame                (item, kèm --icon) vật là khung viền phủ kín ô (khung bậc trang bị): hộp bao vừa khít cả khung đích
//                          bằng cách bớt (hoặc nhân) các cột / hàng chính giữa (lòng khung trong suốt, cạnh thẳng) nên viền và
//                          góc giữ nguyên từng điểm, không lấy mẫu lại; không chừa lề, không thêm viền ngoài. Khung gồm viền 2
//                          khối + 2 nét viền hay bị dò chu kỳ gấp đôi: đặt --cell theo cỡ khối thật (ví dụ 10.4).
//   --fringe 2             số lượt gỡ viền nhiễm màu nền (điểm ảnh gốc); quầng sáng vẽ đè lên nền thì tăng (10–20).
//   --inset auto|<số>      (tile) số điểm ảnh gốc thu vào từ mép thoi để bỏ viền; auto: dò bề rộng dải mép khác màu
//                          bên trong (viền đen, thành "hộp kính" của nước), tối thiểu 1,5, tối đa 12.
//   --seamless on|off      (tile, mặc định on)   --seam-band 0.3 (bề rộng dải trộn, phần của bán kính thoi).
//   --preview 4            hệ số phóng ảnh xem trước (0 = không ghi).
//   --debug                ghi thêm <out>/_native/<tên>.png (ảnh pixel thật trước khi đưa về khung).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { decodePng, encodePng, Img, hex, toHex, readGpl, OUTLINE, ISO_TILE_W, isoTileImage, ISO_HS_FRAME, ISO_HS_ORIGIN, ISO_VH_FRAME, ISO_VH_ORIGIN, ISO_BEAST_SIZES, ISO_BEAST_FOOT, ISO_PORTRAIT, ISO_PROP_FOOT, ISO_ITEM_ICON } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const kind = opt("--kind", "tile"), outDir = opt("--out", ""), names = opt("--names", "").split(",").filter(Boolean);
const gridOpt = opt("--grid", kind === "ui" ? "1x1" : ""), cellOpt = opt("--cell", "auto"), sizeOpt = opt("--size", ""), anchorOpt = opt("--anchor", "");
const paletteOpt = opt("--palette", kind === "tile" || kind === "tile-block" || kind === "portrait" || kind === "item" || kind === "ui" ? "auto-item" : "gpl"), nColors = +opt("--colors", paletteOpt === "auto-item" && kind !== "portrait" ? (kind === "item" || kind === "ui" ? "24" : "10") : "32"), logoOpt = opt("--logo", "auto");
const keyOpt = opt("--key", ""), tol = +opt("--tol", "60"), insetOpt = opt("--inset", "auto"), fringe = +opt("--fringe", "2");
const seamless = opt("--seamless", "on") === "on", seamBand = +opt("--seam-band", "0.3"), previewScale = +opt("--preview", "4");
const scaleOpt = opt("--scale", ""), debug = flag("--debug"), faceOnly = flag("--face-only");
const key2Opt = opt("--key2", ""), key2Tol = +opt("--key2-tol", "18"), manH = +opt("--man-h", "52"), key2 = key2Opt ? hex(key2Opt) : null;
const opaqueMode = flag("--opaque"), frameMode = flag("--frame"), iconMode = flag("--icon") || frameMode, ICON_MAX_UP = 1.5;
const cutBaseOpt = opt("--cut-base", ""), baseTol = +opt("--base-tol", "1500"), grayOpt = opt("--gray", ""), bgTol = +opt("--bg-tol", "3500");
const file = args[0];
const KINDS = ["tile", "tile-block", "honsu", "vohon", "beast", "object", "portrait", "item", "ui"];
if (!outDir || !file || !KINDS.includes(kind)) {
  console.error(`Cách dùng: gemini-import.mjs --kind ${KINDS.join("|")} --out <thư mục> <ảnh> [--names a,b] [--grid CxR] [--cell auto|N] [--size WxH] [--palette gpl|auto|auto-item|none]`);
  process.exit(1);
}
const isTile = kind === "tile" || kind === "tile-block";
// Ô: các bề ngang thoi cần xuất (mặc định mọi cỡ ảnh ô của mục 5.11).
const TILE_WIDTHS = isTile ? (sizeOpt ? sizeOpt.split(",").map((v) => +v.split("x")[0]) : [ISO_TILE_W, 2 * ISO_TILE_W]) : [];
for (const w of TILE_WIDTHS) if (!(w >= 8) || w % 4) { console.error(`--size ${w}: bề ngang thoi phải chia hết cho 4`); process.exit(1); }
// Ô thoi luôn 2:1: chiều cao ghi kèm (WxH) mà khác W/2 thì báo, không lặng lẽ bỏ qua.
if (isTile) for (const [w, h] of (sizeOpt ? sizeOpt.split(",") : []).map((v) => v.split("x").map(Number))) {
  if (h !== undefined && h !== w / 2) console.warn(`[gemini] cảnh báo: ô thoi luôn có mặt trên ${w}×${w / 2} (2:1), bỏ qua chiều cao ${h}`);
}
// Sprite: khung mặc định theo quy cách isometric (hằng ở lib.mjs); hồn thú, vật, chân dung phải chọn cỡ.
const DEFAULT_SIZE = { honsu: [ISO_HS_FRAME, ISO_HS_FRAME], vohon: [ISO_VH_FRAME, ISO_VH_FRAME], portrait: [ISO_PORTRAIT, ISO_PORTRAIT], item: [ISO_ITEM_ICON, ISO_ITEM_ICON] };
const sizeArg = !isTile && sizeOpt ? sizeOpt.split("x").map(Number) : null;
if (!isTile && !sizeArg && !DEFAULT_SIZE[kind]) {
  console.error(`--kind ${kind} cần --size${kind === "beast" ? ` (hồn thú: ${ISO_BEAST_SIZES.join(" / ")})` : ""}`);
  process.exit(1);
}
const [FW, FH] = isTile ? [0, 0] : sizeArg ? (sizeArg.length === 1 ? [sizeArg[0], sizeArg[0]] : sizeArg) : DEFAULT_SIZE[kind];
if (kind === "beast" && !(FW === FH && ISO_BEAST_SIZES.includes(FW))) console.warn(`[gemini] cảnh báo: hồn thú ${FW}×${FH} không thuộc cỡ ${ISO_BEAST_SIZES.join(" / ")}`);
const DEFAULT_ANCHOR = { honsu: ISO_HS_ORIGIN, vohon: ISO_VH_ORIGIN, beast: [FW >> 1, FH - ISO_BEAST_FOOT] };
const [AX, AY] = anchorOpt ? anchorOpt.split(",").map(Number) : DEFAULT_ANCHOR[kind] ?? [FW >> 1, FH - ISO_PROP_FOOT];

// ---------- Màu ----------
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
/** Khoảng cách RGB có trọng số (giống normalize.mjs). */
const dist = (a, b) => { const r = (a[0] + b[0]) / 2, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return (2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db; };
const maxDiff = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
const OUT_RGB = hex(OUTLINE);

// ---------- 1. Logo ----------
/** Màu nền: màu nhiều nhất trong 4 ô 8×8 ở góc ảnh. */
function keyColor(img) {
  if (keyOpt) return hex(keyOpt);
  const votes = new Map();
  for (const [x0, y0] of [[0, 0], [img.w - 8, 0], [0, img.h - 8], [img.w - 8, img.h - 8]])
    for (let y = y0; y < y0 + 8; y++) for (let x = x0; x < x0 + 8; x++) { const p = img.get(x, y), k = `${p[0] >> 3},${p[1] >> 3},${p[2] >> 3}`; votes.set(k, [...(votes.get(k) ?? []), p]); }
  const best = [...votes.values()].sort((a, b) => b.length - a.length)[0];
  return [0, 1, 2].map((i) => Math.round(best.reduce((s, p) => s + p[i], 0) / best.length));
}

/** Alpha nếu điểm là "màu nền trộn trắng" (mọi kênh khớp cùng một alpha 0,15–0,9), không thì −1. */
function paleKey(p, K) {
  const ch = [0, 1, 2].filter((i) => K[i] < 200); // kênh đủ tối để đo alpha (nền #FF00FF: kênh G)
  if (!ch.length) return -1;
  const al = ch.reduce((s, i) => s + (p[i] - K[i]) / (255 - K[i]), 0) / ch.length;
  return al >= 0.15 && al <= 0.9 && [0, 1, 2].every((i) => Math.abs(p[i] - (K[i] + al * (255 - K[i]))) < 22) ? al : -1;
}

/** Hình sao 4 cánh của logo: |dx|^½ + |dy|^½ so với R^½ (≤ 1 là trong sao). */
const starShape = (cx, cy, R) => (x, y) => Math.sqrt(Math.abs(x + 0.5 - cx) / R) + Math.sqrt(Math.abs(y + 0.5 - cy) / R);
/**
 * Gỡ lớp trắng alpha của hình sao: c = (quan sát − 255α) / (1 − α). Lõi sao (v ≤ 0,85) dùng alpha chung; mép sao
 * (khử răng cưa, hình thật hơi lệch mô hình) ước lượng alpha từng điểm so với nền cùng hướng ngay ngoài sao
 * (v = 1,5), chỉ gỡ khi ba kênh cùng một alpha (điểm vật thật bên cạnh sao không bị đổi màu).
 */
function unblendStar(img, cx, cy, R, alpha) {
  const shape = starShape(cx, cy, R), ref = new Img(img.w, img.h, Uint8Array.from(img.data)), E = Math.ceil(R * 2);
  let n = 0;
  for (let y = Math.floor(cy - E); y <= cy + E; y++) for (let x = Math.floor(cx - E); x <= cx + E; x++) {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
    const v = shape(x, y), p = ref.get(x, y);
    if (v > 1.3) continue;
    let a = alpha;
    if (v > 0.85) {
      const k = (1.5 / v) ** 2, bx = Math.round(cx - 0.5 + (x + 0.5 - cx) * k), by = Math.round(cy - 0.5 + (y + 0.5 - cy) * k);
      const bg = ref.get(Math.max(0, Math.min(img.w - 1, bx)), Math.max(0, Math.min(img.h - 1, by)));
      const as = [0, 1, 2].map((i) => (p[i] - bg[i]) / Math.max(1, 255 - bg[i]));
      a = Math.min(alpha, as.reduce((t, q) => t + q, 0) / 3);
      if (a < 0.03 || Math.max(...as) - Math.min(...as) > 0.1) continue;
    }
    img.set(x, y, [0, 1, 2].map((i) => Math.max(0, Math.min(255, Math.round((p[i] - 255 * a) / (1 - a))))).concat(255));
    n++;
  }
  return n;
}
// Logo đo trên ảnh Gemini 2752×1536 (nền magenta, chế độ auto): tâm cách góc dưới phải (112, 112), bán kính 48, alpha 0,51.
const GEMINI_STAR = { dx: 112, dy: 112, R: 48, alpha: 0.51, ref: 2752 };
/**
 * Logo nằm trên vật / khung tối (không có cánh nào trên nền màu khóa, ví dụ chân dung nền tối): dùng vị trí chuẩn
 * của logo (tỉ lệ theo cạnh dài của ảnh) và chỉ gỡ khi khớp lớp trắng mờ: lõi sao mọi kênh ≥ 255α, sáng hơn rõ
 * vành ngay ngoài sao.
 */
function removeStarDefault(img) {
  const k = Math.max(img.w, img.h) / GEMINI_STAR.ref, R = GEMINI_STAR.R * k, alpha = GEMINI_STAR.alpha;
  const cx = img.w - GEMINI_STAR.dx * k, cy = img.h - GEMINI_STAR.dy * k, shape = starShape(cx, cy, R);
  let core = 0, bright = 0, coreLum = 0, ring = 0, ringLum = 0;
  for (let y = Math.floor(cy - R * 1.6); y <= cy + R * 1.6; y++) for (let x = Math.floor(cx - R * 1.6); x <= cx + R * 1.6; x++) {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
    const v = shape(x, y), p = img.get(x, y);
    if (v < 0.75) { core++; coreLum += lum(p); if (Math.min(p[0], p[1], p[2]) >= 255 * alpha - 10) bright++; }
    else if (v > 1.25 && v < 1.6) { ring++; ringLum += lum(p); }
  }
  if (!core || bright < core * 0.95 || coreLum / core < ringLum / Math.max(1, ring) + 40) return null;
  return { mode: "default", center: [Math.round(cx), Math.round(cy)], radius: Math.round(R), alpha, pixels: unblendStar(img, cx, cy, R, alpha) };
}

/**
 * Logo Gemini: ngôi sao 4 cánh trắng, alpha cố định, góc dưới phải. Điểm trên nền = màu nền trộn trắng theo alpha.
 * Dựng hình sao (|dx|^½ + |dy|^½ ≤ R^½) từ cánh trái / phải / dưới nằm trên nền, rồi gỡ trắng: c = (quan sát − 255α) / (1 − α).
 * Không có cánh nào trên nền thì thử vị trí chuẩn (removeStarDefault). --logo star:cx,cy,R[,alpha] gỡ sao ở vị trí cho trước.
 */
function removeLogo(img, K) {
  if (logoOpt === "off") return null;
  if (logoOpt.startsWith("star:")) {
    const [cx, cy, R, alpha = GEMINI_STAR.alpha] = logoOpt.slice(5).split(",").map(Number);
    return { mode: "star", center: [cx, cy], radius: R, alpha, pixels: unblendStar(img, cx, cy, R, alpha) };
  }
  if (logoOpt !== "auto") {
    const [bx, by, bw, bh] = logoOpt.split(",").map(Number);
    return inpaintBox(img, K, bx, by, bw, bh);
  }
  // Chỉ dò khi nền là màu khóa đặc, bão hòa (magenta, xanh lá…): ảnh có alpha hay nền xám thì điểm xám của vật
  // cũng khớp "nền trộn trắng" và bị gỡ nhầm.
  for (let i = 3; i < img.data.length; i += 4) if (img.data[i] < 250) return null;
  if (Math.max(...K) - Math.min(...K) < 100) return null;
  const x0 = Math.floor(img.w * 0.82), y0 = Math.floor(img.h * 0.75), bw = img.w - x0, bh = img.h - y0;
  const overKey = (p) => paleKey(p, K);
  const alphaAt = new Float32Array(bw * bh).fill(-1);
  for (let y = y0; y < img.h; y++) for (let x = x0; x < img.w; x++) alphaAt[(y - y0) * bw + x - x0] = overKey(img.get(x, y));
  // Chỉ lấy mảng liền lớn nhất: viền vật sáng (tuyết, không nét viền) trộn với nền cũng khớp "nền trộn trắng"
  // nhưng là dải mảnh rời, còn ngôi sao là một khối đặc.
  const seen = new Uint8Array(bw * bh);
  let pts = [];
  for (let i = 0; i < bw * bh; i++) {
    if (seen[i] || alphaAt[i] < 0) continue;
    const comp = [], stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop(), x = j % bw, y = (j / bw) | 0;
      comp.push([x + x0, y + y0, alphaAt[j]]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy, k = Y * bw + X;
        if (X >= 0 && Y >= 0 && X < bw && Y < bh && !seen[k] && alphaAt[k] >= 0) { seen[k] = 1; stack.push(k); }
      }
    }
    if (comp.length > pts.length) pts = comp;
  }
  if (pts.length < 40) return removeStarDefault(img);
  const xs = pts.map((p) => p[0]), xL = Math.min(...xs), xR = Math.max(...xs);
  const R = (xR - xL + 1) / 2, cx = (xL + xR + 1) / 2;
  // Sao phần lớn nằm trên vật / khung tối, chỉ một cánh lộ trên nền (khe giữa các ô): mảng dò được nhỏ hơn hẳn logo
  // chuẩn → dùng vị trí chuẩn (vẫn kiểm lớp trắng mờ), nếu không khớp thì mới dùng mảng dò được.
  if (R < GEMINI_STAR.R * (Math.max(img.w, img.h) / GEMINI_STAR.ref) * 0.7) { const d = removeStarDefault(img); if (d) return d; }
  // Tâm dọc: hàng của mũi cánh trái / phải.
  const tips = pts.filter((p) => p[0] <= xL + 2 || p[0] >= xR - 2), cy = tips.reduce((s, p) => s + p[1], 0) / tips.length + 0.5;
  const shape = starShape(cx, cy, R);
  const core = pts.filter((p) => shape(p[0], p[1]) < 0.75).map((p) => p[2]).sort((a, b) => a - b);
  if (core.length < 10) return removeStarDefault(img);
  const alpha = core[core.length >> 1];
  let n = unblendStar(img, cx, cy, R, alpha);
  // Điểm logo trên nền nằm ngoài hình sao dựng lại (mép khử răng cưa, mũi cánh dài hơn) → về màu nền.
  for (let y = Math.floor(cy - R * 1.4); y <= cy + R * 1.4; y++) for (let x = Math.floor(cx - R * 1.4); x <= cx + R * 1.4; x++) {
    if (x >= 0 && y >= 0 && x < img.w && y < img.h && overKey(img.get(x, y)) >= 0) { img.set(x, y, [...K, 255]); n++; }
  }
  return { mode: "auto", center: [Math.round(cx), Math.round(cy)], radius: Math.round(R), alpha: +alpha.toFixed(2), pixels: n };
}

/**
 * Vá một hộp: điểm logo trên nền (nền trộn trắng) về màu nền; điểm nền giữ nguyên làm điểm đã biết (để màu vật
 * không loang ra nền); các điểm còn lại lấy dần màu chủ đạo của điểm kề đã biết (từ ngoài vào trong).
 */
function inpaintBox(img, K, bx, by, bw, bh) {
  const unknown = new Set();
  for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
    const p = img.get(x, y);
    if (paleKey(p, K) >= 0) img.set(x, y, [...K, 255]);
    else if (maxDiff(p, K) > tol) unknown.add(y * img.w + x);
  }
  const total = unknown.size;
  while (unknown.size) {
    const fill = [];
    for (const i of unknown) {
      const x = i % img.w, y = (i / img.w) | 0, nb = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if ((dx || dy) && X >= 0 && Y >= 0 && X < img.w && Y < img.h && !unknown.has(Y * img.w + X)) nb.push(img.get(X, Y));
      }
      if (nb.length >= 2) fill.push([i, medoid(nb)]);
    }
    if (!fill.length) break;
    for (const [i, c] of fill) { img.set(i % img.w, (i / img.w) | 0, c); unknown.delete(i); }
  }
  return { mode: "box", box: [bx, by, bw, bh], pixels: total, key: toHex(K) };
}

// ---------- 2. Nền ----------
/** Trả về ảnh chỉ còn alpha 0 / 255. */
function removeBackground(img, K) {
  const out = new Img(img.w, img.h, Uint8Array.from(img.data));
  let hasAlpha = false;
  for (let i = 3; i < out.data.length; i += 4) if (out.data[i] < 250) { hasAlpha = true; break; }
  if (hasAlpha) { for (let i = 3; i < out.data.length; i += 4) out.data[i] = out.data[i] >= 128 ? 255 : 0; return out; }
  // "Độ khóa" của điểm: với nền magenta là min(R, B) − G; điểm bị nén JPEG hay sáng tối lệch vẫn bắt được.
  const keyAxis = [0, 1, 2].map((i) => (K[i] > 127 ? 1 : -1));
  const keyness = (p) => Math.min(...[0, 1, 2].filter((i) => keyAxis[i] > 0).map((i) => p[i])) - Math.max(...[0, 1, 2].filter((i) => keyAxis[i] < 0).map((i) => p[i]), 0);
  const kRef = keyness(K);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.get(x, y);
    if (maxDiff(p, K) <= tol || keyness(p) > kRef * 0.55) out.set(x, y, [0, 0, 0, 0]);
  }
  // Viền nhiễm màu nền: --fringe lượt (mặc định 2) gỡ điểm còn ánh màu khóa nằm sát nền. Quầng sáng vẽ đè lên nền
  // (nấm, cây phát quang) cần nhiều lượt hơn; lượt gỡ dừng ở viền tối của vật vì viền không ánh màu khóa.
  for (let pass = 0; pass < fringe; pass++) {
    const drop = [];
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      if (!out.alpha(x, y) || keyness(out.get(x, y)) <= kRef * 0.15) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= img.w || Y >= img.h || !out.alpha(X, Y); })) drop.push([x, y]);
    }
    for (const [x, y] of drop) out.set(x, y, [0, 0, 0, 0]);
  }
  return out;
}

// ---------- 3. Tách vật ----------
function components(img) {
  const W = img.w, H = img.h, lab = new Int32Array(W * H).fill(-1), comps = [];
  for (let i = 0; i < W * H; i++) {
    if (lab[i] >= 0 || !img.data[i * 4 + 3]) continue;
    const c = { id: comps.length, n: 0, x0: W, y0: H, x1: -1, y1: -1 }, stack = [i];
    lab[i] = c.id;
    while (stack.length) {
      const j = stack.pop(), x = j % W, y = (j / W) | 0;
      c.n++; c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy, k = Y * W + X;
        if (X >= 0 && Y >= 0 && X < W && Y < H && lab[k] < 0 && img.data[k * 4 + 3]) { lab[k] = c.id; stack.push(k); }
      }
    }
    comps.push(c);
  }
  return { lab, comps };
}

/** Danh sách vật: { img (cắt theo hộp bao, chỉ điểm của vật), x0, y0 }. */
function splitItems(img) {
  const W = img.w, H = img.h;
  const crop = (x0, y0, x1, y1, keep) => {
    const out = new Img(x1 - x0 + 1, y1 - y0 + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (keep(x, y)) out.set(x - x0, y - y0, img.get(x, y));
    return { img: out, x0, y0, x1, y1 };
  };
  if (gridOpt) {
    const [C, R] = gridOpt.split("x").map(Number), items = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const cx0 = Math.floor((c * W) / C), cx1 = Math.floor(((c + 1) * W) / C) - 1, cy0 = Math.floor((r * H) / R), cy1 = Math.floor(((r + 1) * H) / R) - 1;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) if (img.alpha(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 < 0) { console.warn(`[gemini] ô lưới (${c},${r}) trống, bỏ qua`); continue; }
      items.push(crop(x0, y0, x1, y1, (x, y) => img.alpha(x, y)));
    }
    return items;
  }
  const { lab, comps } = components(img);
  const big = Math.max(...comps.map((c) => c.n));
  // Vật = mảng ≥ 2% mảng lớn nhất (vật nhỏ như viên sỏi cạnh cây vẫn giữ), các mảng nhỏ hơn xét gộp bên dưới.
  const main = comps.filter((c) => c.n >= Math.max(64, big * 0.02));
  // Mảnh nhỏ (ngọn cỏ rời, hạt bụi) nằm trong hộp bao nới rộng của một vật lớn thì gộp vào vật đó, còn lại bỏ.
  const owner = new Int32Array(comps.length).fill(-1);
  for (const m of main) owner[m.id] = m.id;
  for (const c of comps) {
    if (owner[c.id] >= 0) continue;
    const m = main.find((m) => { const px = (m.x1 - m.x0) * 0.08, py = (m.y1 - m.y0) * 0.08; return c.x0 >= m.x0 - px && c.x1 <= m.x1 + px && c.y0 >= m.y0 - py && c.y1 <= m.y1 + py; });
    if (m) { owner[c.id] = m.id; m.x0 = Math.min(m.x0, c.x0); m.x1 = Math.max(m.x1, c.x1); m.y0 = Math.min(m.y0, c.y0); m.y1 = Math.max(m.y1, c.y1); }
  }
  // Thứ tự đọc: gom hàng theo tâm dọc (lệch < nửa chiều cao trung vị), trong hàng xếp trái → phải.
  const medH = main.map((m) => m.y1 - m.y0).sort((a, b) => a - b)[main.length >> 1];
  main.sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);
  const rows = [];
  for (const m of main) { const row = rows.find((r) => Math.abs((r[0].y0 + r[0].y1) / 2 - (m.y0 + m.y1) / 2) < medH / 2); if (row) row.push(m); else rows.push([m]); }
  return rows.flatMap((r) => r.sort((a, b) => a.x0 - b.x0)).map((m) => crop(m.x0, m.y0, m.x1, m.y1, (x, y) => owner[lab[y * W + x]] === m.id));
}

// ---------- 4. Điểm ảnh giả → pixel thật ----------
/** Tổng chênh lệch giữa cột x−1 và x (hoặc hàng) trên các cặp điểm cùng đục. */
function edgeProfile(img, vertical) {
  const n = vertical ? img.h : img.w, m = vertical ? img.w : img.h, sig = new Float64Array(n);
  for (let a = 1; a < n; a++) for (let b = 0; b < m; b++) {
    const [x, y, X, Y] = vertical ? [b, a, b, a - 1] : [a, b, a - 1, b];
    if (!img.alpha(x, y) || !img.alpha(X, Y)) continue;
    sig[a] += maxDiff(img.get(x, y), img.get(X, Y));
  }
  return sig;
}
const PERIODS = Array.from({ length: 441 }, (_, i) => 2 + i * 0.05);
/** Phổ công suất của tín hiệu cạnh theo chu kỳ 2–24 px (chuẩn hóa theo năng lượng để các vật cộng được với nhau). */
function spectrum(sig) {
  const mean = sig.reduce((s, v) => s + v, 0) / sig.length, norm = Math.sqrt(sig.reduce((s, v) => s + (v - mean) ** 2, 0) * sig.length) || 1;
  return PERIODS.map((P) => {
    let re = 0, im = 0;
    for (let i = 0; i < sig.length; i++) { const v = sig[i] - mean, t = (2 * Math.PI * i) / P; re += v * Math.cos(t); im += v * Math.sin(t); }
    return Math.hypot(re, im) / norm;
  });
}
/** Chu kỳ cơ bản: chu kỳ thật P có họa âm ở P/2, P/3…, nên chọn đỉnh mạnh (≥ 45% đỉnh lớn nhất) có chu kỳ lớn nhất. */
function pickPeriod(power) {
  const peaks = PERIODS.map((P, i) => [P, power[i]]).filter(([, v], i) => i > 0 && i < power.length - 1 && v >= power[i - 1] && v >= power[i + 1]);
  const best = Math.max(...peaks.map((p) => p[1]));
  const strong = peaks.filter((p) => p[1] >= best * 0.45 && p[0] >= 3);
  return strong.length ? Math.max(...strong.map((p) => p[0])) : 1;
}
/**
 * Cỡ ô giả chung của cả ảnh (một ảnh AI dùng một cỡ): cộng phổ cột và hàng của mọi vật rồi chọn đỉnh.
 * Vật ít chi tiết (ô tuyết) tự dò riêng hay ra họa âm sai, dò chung thì ổn định.
 */
function commonPeriod(imgs) {
  const sum = PERIODS.map(() => 0);
  for (const img of imgs) for (const v of [false, true]) spectrum(edgeProfile(img, v)).forEach((p, i) => (sum[i] += p));
  return pickPeriod(sum);
}
/**
 * Đường cắt thích nghi: mỗi bước tìm đỉnh cạnh trong [0,7P; 1,35P] kể từ đường cắt trước, ưu tiên đỉnh gần đúng P
 * (trọng số Gauss), không có đỉnh rõ thì đi đúng P. Vùng ít chi tiết nhờ vậy không bị kéo giãn theo nhiễu.
 */
function cuts(sig, P, fixed) {
  const n = sig.length, out = [0];
  if (fixed) { for (let x = P; x < n; x += P) out.push(Math.round(x)); out.push(n); return [...new Set(out)]; }
  const thr = (sig.reduce((s, v) => s + v, 0) / n) * 0.5;
  let x = 0;
  while (x + P * 1.35 < n) {
    const lo = Math.max(x + 1, Math.round(x + 0.7 * P)), hi = Math.min(n - 1, Math.round(x + 1.35 * P));
    let best = -1, bv = -1;
    for (let i = lo; i <= hi; i++) { const v = sig[i] * Math.exp(-(((i - x - P) / (0.3 * P)) ** 2)); if (v > bv) { bv = v; best = i; } }
    x = sig[best] > thr ? best : Math.round(x + P);
    out.push(x);
  }
  out.push(n);
  // Bước trung bình lệch quá 3% so với P (vùng phẳng, nhiễu nén kéo lưới trôi) → dùng lưới đều.
  return Math.abs(n / (out.length - 1) / P - 1) > 0.03 ? cuts(sig, P, true) : out;
}
/** Medoid: điểm có tổng khoảng cách tới các điểm khác nhỏ nhất (màu chủ đạo, là màu thật của ô). */
function medoid(ps) {
  if (ps.length <= 2) return ps[0];
  let best = ps[0], bd = Infinity;
  for (const p of ps) { let d = 0; for (const q of ps) d += Math.sqrt(dist(p, q)); if (d < bd) { bd = d; best = p; } }
  return best;
}
function defake(img, P) {
  const fixed = cellOpt !== "auto";
  if (P <= 1) return { img, cell: [1, 1] };
  const cx = cuts(edgeProfile(img, false), P, fixed), cy = cuts(edgeProfile(img, true), P, fixed);
  const out = new Img(cx.length - 1, cy.length - 1);
  for (let j = 0; j < out.h; j++) for (let i = 0; i < out.w; i++) {
    const x0 = cx[i], x1 = cx[i + 1], y0 = cy[j], y1 = cy[j + 1];
    // Bỏ 1 điểm sát mép ô (vùng nhòe giữa hai ô) khi ô đủ lớn.
    const sx = x1 - x0 >= 4 ? 1 : 0, sy = y1 - y0 >= 4 ? 1 : 0, ps = [];
    let opaque = 0, total = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      total++;
      if (!img.alpha(x, y)) continue;
      opaque++;
      if (x >= x0 + sx && x < x1 - sx && y >= y0 + sy && y < y1 - sy) ps.push(img.get(x, y));
    }
    if (opaque * 2 <= total) continue;
    if (!ps.length) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (img.alpha(x, y)) ps.push(img.get(x, y));
    out.set(i, j, medoid(ps));
  }
  return { img: out, cell: [+(img.w / out.w).toFixed(2), +(img.h / out.h).toFixed(2)] };
}

// ---------- 4b. Cắt đế đất ----------
/**
 * Vật Gemini hay đứng trên một khối đất thoi dày (mặt trên cỏ rêu, hai mặt bên tối). Trên ảnh pixel thật:
 *   - đáy hình bóng của đế là hai cạnh thoi dốc 1:2 gặp nhau ở đỉnh dưới: lấy điểm thấp nhất cột làm đỉnh, đi sang hai
 *     bên tới khi đáy cột lệch đường dốc quá 2 điểm → bề ngang đế W (bỏ qua nếu W < 40% ảnh: vật không có đế);
 *   - bề dày t = bậc sáng lên rõ nhất khi đi ngược từ đáy lên (mặt bên tối hơn mặt trên), trong 4–16 điểm;
 *   - bỏ dải mặt bên (t điểm trên đường đáy), rồi loang từ mép dưới mặt trên qua các điểm cùng màu đất (bảng 8 màu
 *     lấy ở mép, sai khác < --base-tol) trong thoi mặt trên: cỏ rêu của đế mất, vật (đá, lều, bia…) giữ lại;
 *   - mảnh rời nhỏ hơn 8 điểm bỏ đi. Chân vật là đáy phần còn lại (renderSprite đặt vào gốc như thường).
 * Trả về { img, base } với base = { width, thick, removed } hoặc null nếu không dò được đế.
 */
function cutBase(img) {
  const W0 = img.w, H0 = img.h, bot = new Int32Array(W0).fill(-1);
  for (let x = 0; x < W0; x++) for (let y = H0 - 1; y >= 0; y--) if (img.alpha(x, y)) { bot[x] = y; break; }
  const yb = Math.max(...bot), low = [...bot.keys()].filter((x) => bot[x] === yb), cx = (low[0] + low[low.length - 1]) / 2;
  const line = (x) => yb - Math.abs(x - cx) / 2;
  const walk = (dir) => {
    let x = Math.round(cx), miss = 0, last = x;
    for (; x >= 0 && x < W0; x += dir) {
      if (bot[x] >= 0 && Math.abs(bot[x] - line(x)) <= 2) { last = x; miss = 0; } else if (++miss > 3) break;
    }
    return last;
  };
  const xL = walk(-1), xR = walk(1), Wb = xR - xL;
  if (Wb < W0 * 0.4) return { img, base: null };
  // Bề dày: bậc sáng lên (đi từ dưới lên) mạnh nhất, trung bình trên các cột của đế.
  let t = 0, best = -Infinity;
  for (let k = 4; k <= 16; k++) {
    let sum = 0, n = 0;
    for (let x = xL + 2; x <= xR - 2; x++) {
      const y1 = Math.round(line(x)) - k, y0 = y1 + 1;
      if (y1 < 0 || !img.alpha(x, y1) || !img.alpha(x, y0)) continue;
      sum += lum(img.get(x, y1)) - lum(img.get(x, y0)); n++;
    }
    if (n && sum / n > best) { best = sum / n; t = k; }
  }
  const out = new Img(W0, H0, Uint8Array.from(img.data)), clear = (x, y) => out.set(x, y, [0, 0, 0, 0]);
  let removed = 0;
  // Mặt bên: t điểm ngay trên đường đáy (cả phần vật nhô ra trước đế trong dải này).
  for (let x = Math.max(0, xL - 1); x <= Math.min(W0 - 1, xR + 1); x++) for (let y = Math.max(0, Math.round(line(x)) - t + 1); y < H0; y++) if (out.alpha(x, y)) { clear(x, y); removed++; }
  // Mặt trên: thoi bán trục a = W/2, b = W/4, đỉnh dưới tại yb − t. Màu đất lấy ở 3 hàng ngay trên mép dưới.
  const a = Wb / 2, b = Wb / 4, yc = yb - t - b, inTop = (x, y) => Math.abs(x - cx) / a + Math.abs(y - yc) / b <= 1.08;
  const seeds = [], samples = [];
  for (let x = xL; x <= xR; x++) for (let k = 1; k <= 3; k++) {
    const y = Math.round(line(x)) - t - k + 1;
    if (y >= 0 && out.alpha(x, y)) { seeds.push([x, y]); samples.push(out.get(x, y).slice(0, 3)); }
  }
  if (samples.length) {
    const ground = medianCut(samples, 8), seen = new Uint8Array(W0 * H0);
    // Điểm rất tối (nét viền của vật) không tính là đất để phép loang dừng ở viền vật.
    const isGround = (p) => lum(p) >= 35 && dist(p, ground[nearestIdx(p, ground)]) < baseTol;
    const stack = seeds.filter(([x, y]) => isGround(out.get(x, y)));
    for (const [x, y] of stack) seen[y * W0 + x] = 1;
    while (stack.length) {
      const [x, y] = stack.pop();
      clear(x, y); removed++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy, k = Y * W0 + X;
        if (X < 0 || Y < 0 || X >= W0 || Y >= H0 || seen[k] || !out.alpha(X, Y) || !inTop(X, Y)) continue;
        seen[k] = 1;
        if (isGround(out.get(X, Y))) stack.push([X, Y]);
      }
    }
  }
  // Mảnh rời nhỏ (lá cỏ, hạt sáng còn sót trên đế).
  const { lab, comps } = components(out);
  for (let i = 0; i < W0 * H0; i++) if (lab[i] >= 0 && comps[lab[i]].n < 8) { out.data[i * 4 + 3] = 0; removed++; }
  return { img: out, base: { width: Wb, thick: t, removed } };
}

// ---------- 5. Bảng màu ----------
/** Median cut (có trọng số số điểm) rồi tinh chỉnh k-means 6 vòng. */
function medianCut(pixels, n) {
  let boxes = [pixels];
  while (boxes.length < n) {
    // Tách hộp có (khoảng màu × √số điểm) lớn nhất: chỉ xét khoảng màu thì vùng rộng mà đều màu (cỏ, nước sâu)
    // chỉ còn 1–2 màu trong khi vài điểm hoa / lá sặc sỡ chiếm hết bảng.
    let bi = -1, bc = 0, br = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; const w = Math.sqrt(b.length); for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; for (const p of b) { lo = Math.min(lo, p[c]); hi = Math.max(hi, p[c]); } if ((hi - lo) * w > br) { br = (hi - lo) * w; bi = i; bc = c; } } });
    if (bi < 0) break;
    const b = boxes[bi].sort((p, q) => p[bc] - q[bc]), mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  let cents = boxes.map((b) => [0, 1, 2].map((c) => Math.round(b.reduce((s, p) => s + p[c], 0) / b.length)));
  for (let it = 0; it < 6; it++) {
    const acc = cents.map(() => [0, 0, 0, 0]);
    for (const p of pixels) { const k = nearestIdx(p, cents); acc[k][0] += p[0]; acc[k][1] += p[1]; acc[k][2] += p[2]; acc[k][3]++; }
    cents = cents.map((c, k) => (acc[k][3] ? [0, 1, 2].map((i) => Math.round(acc[k][i] / acc[k][3])) : c));
  }
  return cents;
}
function nearestIdx(p, pal) { let bi = 0, bd = Infinity; for (let i = 0; i < pal.length; i++) { const d = dist(p, pal[i]); if (d < bd) { bd = d; bi = i; } } return bi; }
/** Bảng màu của từng vật: auto = một bảng chung cả lô; auto-item = mỗi vật một bảng --colors màu; gpl / file = bảng cố định. */
function buildPalettes(natives) {
  if (paletteOpt === "none") return natives.map(() => null);
  const pixelsOf = (imgs) => { const px = []; for (const img of imgs) for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3]) px.push([img.data[i], img.data[i + 1], img.data[i + 2]]); return px; };
  const withOutline = (pal) => ((!isTile && kind !== "portrait") || kind === "tile-block" ? [...pal, OUT_RGB] : pal);
  if (paletteOpt === "auto") { const pal = withOutline(medianCut(pixelsOf(natives), nColors)); return natives.map(() => pal); }
  if (paletteOpt === "auto-item") return natives.map((img) => withOutline(medianCut(pixelsOf([img]), nColors)));
  const pal = (paletteOpt === "gpl" ? readGpl() : readGpl(paletteOpt)).map(hex);
  return natives.map(() => pal);
}
function quantize(img, pal) {
  if (!pal) return img;
  const out = new Img(img.w, img.h), memo = new Map();
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!img.alpha(x, y)) continue;
    const p = img.get(x, y), k = (p[0] << 16) | (p[1] << 8) | p[2];
    if (!memo.has(k)) memo.set(k, pal[nearestIdx(p, pal)]);
    out.set(x, y, [...memo.get(k), 255]);
  }
  return out;
}

// ---------- 6. Đưa về khung ----------
const SS = 4; // lấy mẫu 4×4 điểm mỗi pixel đích
/** Màu nhiều phiếu nhất trong vùng nguồn của pixel đích; `map(u, v)` → điểm nguồn (số thực). */
function voteSample(src, u0, v0, map, needOpaque) {
  const votes = new Map();
  let clear = 0;
  for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) {
    const [sx, sy] = map(u0 + (i + 0.5) / SS, v0 + (j + 0.5) / SS), X = Math.floor(sx), Y = Math.floor(sy);
    if (X < 0 || Y < 0 || X >= src.w || Y >= src.h || !src.alpha(X, Y)) { clear++; continue; }
    const p = src.get(X, Y), k = (p[0] << 16) | (p[1] << 8) | p[2];
    votes.set(k, (votes.get(k) ?? 0) + 1);
  }
  if (!votes.size || (!needOpaque && clear * 2 > SS * SS)) return null;
  const k = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return [k >> 16, (k >> 8) & 255, k & 255, 255];
}

/** Mặt trên thoi: khớp đường thẳng vào mép trên hai nửa (bỏ ngọn cỏ nhô lên), suy ra 4 đỉnh và bề dày khối. */
function tileGeometry(img) {
  const top = [], bot = [];
  let xmin = img.w, xmax = -1;
  for (let x = 0; x < img.w; x++) {
    let t = -1, b = -1;
    for (let y = 0; y < img.h; y++) if (img.alpha(x, y)) { if (t < 0) t = y; b = y; }
    top.push(t); bot.push(b);
    if (t >= 0) { xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); }
  }
  const half = (xmax + 1 - xmin) / 2, xc = xmin + half;
  const fit = (x0, x1, prof, above) => {
    let pts = [];
    for (let x = Math.ceil(x0); x <= x1; x++) if (prof[x] >= 0) pts.push([x + 0.5, prof[x] + (above ? 0 : 1)]);
    if (pts.length < 4) throw new Error(`mép trên chỉ có ${pts.length} điểm (vật quá nhỏ hoặc không phải ô thoi)`);
    let m = 0, c = 0;
    for (let it = 0; it < 5; it++) {
      const n = pts.length, sx = pts.reduce((s, p) => s + p[0], 0), sy = pts.reduce((s, p) => s + p[1], 0);
      const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0), sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
      m = (n * sxy - sx * sy) / (n * sxx - sx * sx); c = (sy - m * sx) / n;
      // Ngọn cỏ / đá nhô ra khỏi mép (trên mép trên, dưới mép dưới) là điểm ngoại lai.
      const keep = pts.filter(([x, y]) => { const r = (y - (m * x + c)) * (above ? 1 : -1); return r > -1.2 && r < 2.5; });
      if (keep.length < 4 || keep.length === pts.length) break;
      pts = keep;
    }
    return [m, c];
  };
  const [mL, cL] = fit(xmin + 0.15 * half, xc - 0.15 * half, top, true), [mR, cR] = fit(xc + 0.15 * half, xmax - 0.15 * half, top, true);
  const tx = (cR - cL) / (mL - mR), T = [tx, mL * tx + cL];
  if (!Number.isFinite(tx) || !(mL < 0 && mR > 0)) throw new Error("không dò được hai cạnh trên của thoi");
  const L = [xmin, mL * xmin + cL], R = [xmax + 1, mR * (xmax + 1) + cR], B = [L[0] + R[0] - T[0], L[1] + R[1] - T[1]];
  // Bề dày: mép dưới khối so với cạnh dưới mặt trên (L→B và B→R), lấy trung vị trên cả hai nửa.
  const th = [];
  for (let x = Math.ceil(xmin + 0.15 * half); x <= xmax - 0.15 * half; x++) {
    if (bot[x] < 0 || (x > xc - 0.15 * half && x < xc + 0.15 * half)) continue;
    const X = x + 0.5, edge = X < B[0] ? L[1] + ((B[1] - L[1]) * (X - L[0])) / (B[0] - L[0]) : B[1] + ((R[1] - B[1]) * (X - B[0])) / (R[0] - B[0]);
    th.push(bot[x] + 1 - edge);
  }
  th.sort((a, b) => a - b);
  return { L, T, R, B, thick: Math.max(0, th[th.length >> 1] ?? 0) };
}

/** Thoi pixel đích: tâm điểm ảnh (x+0,5; y+0,5) nằm hẳn trong thoi W×H (không bao giờ nằm đúng mép nên các ô lát kín không chồng). */
const inDiamond = (x, y, W, H) => Math.abs(x + 0.5 - W / 2) / (W / 2) + Math.abs(y + 0.5 - H / 2) / (H / 2) < 1;
/** Tọa độ thoi (a: trục xuống phải, b: trục xuống trái), mỗi trục −1…1. */
const isoAB = (x, y, W, H) => { const dx = (x + 0.5 - W / 2) / (W / 2), dy = (y + 0.5 - H / 2) / (H / 2); return [dx + dy, dy - dx]; };
/** Lấy điểm (x,y) trên mặt phẳng lát kín bằng chính ô (gói a, b về −1…1). */
function wrapGet(t, x, y) {
  const W = t.w, H = W / 2;
  let [a, b] = isoAB(x, y, W, H);
  a = ((((a + 1) % 2) + 2) % 2) - 1; b = ((((b + 1) % 2) + 2) % 2) - 1;
  const X = Math.floor(W / 2 + ((a - b) * W) / 4), Y = Math.floor(H / 2 + ((a + b) * H) / 4);
  return t.get(Math.max(0, Math.min(W - 1, X)), Math.max(0, Math.min(H - 1, Y)));
}
/** Độ lệch mép ghép: chênh màu trung bình qua mép ô (lát với chính nó) chia cho chênh màu giữa hai điểm kề bên trong. */
function seamScore(t) {
  const W = t.w, H = W / 2;
  let se = 0, sn = 0, ie = 0, iN = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inDiamond(x, y, W, H)) continue;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const X = x + dx, Y = y + dy, d = Math.sqrt(dist(t.get(x, y), inDiamond(X, Y, W, H) ? t.get(X, Y) : wrapGet(t, X, Y)));
      if (inDiamond(X, Y, W, H)) { ie += d; iN++; } else { se += d; sn++; }
    }
  }
  return +((se / sn) / (ie / iN || 1)).toFixed(2);
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
/**
 * Làm liền mép: mỗi trục (a rồi b) trộn ô với bản dời nửa chu kỳ theo trục đó; dải sát mép lấy bản dời (liền
 * qua mép vì đó là phần giữa ô), vào trong lấy dần ô gốc theo dither Bayer 4×4 (không tạo màu mới).
 * Hợp với vân nhiễu (cỏ, cát, nước); hoa văn có cấu trúc (phiến đá) sẽ gãy ở dải trộn.
 */
function makeSeamless(t) {
  const W = t.w, H = W / 2;
  for (const axis of [0, 1]) {
    const src = new Img(W, H, Uint8Array.from(t.data));
    // Dời nửa chu kỳ theo trục a là (W/4, H/4), theo trục b là (−W/4, H/4).
    const ox = axis ? -W / 4 : W / 4, oy = H / 4;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inDiamond(x, y, W, H)) continue;
      // 1/4 ngoài cùng của dải lấy hẳn bản dời: mép sáng / tối Gemini hay vẽ sát cạnh thoi không còn lốm đốm.
      const v = Math.abs(isoAB(x, y, W, H)[axis]), w = Math.min(1, Math.max(0, (v - (1 - seamBand)) / (seamBand * 0.75)));
      if (w > BAYER[(y & 3) * 4 + (x & 3)]) t.set(x, y, wrapGet(src, x + ox, y + oy));
    }
  }
}
/** Điểm rất tối sát mép thoi (sót viền đen) lấy màu nhiều nhất của điểm kề không tối. */
function scrubOutline(t) {
  const W = t.w, H = t.h, med = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (t.alpha(x, y)) med.push(lum(t.get(x, y)));
  med.sort((a, b) => a - b);
  const dark = Math.min(50, med[med.length >> 1] * 0.45);
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!t.alpha(x, y) || lum(t.get(x, y)) >= dark) continue;
    const [a, b] = isoAB(x, y, W, H);
    if (Math.max(Math.abs(a), Math.abs(b)) < 0.85) continue;
    const nb = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && t.alpha(X, Y) && lum(t.get(X, Y)) >= dark) nb.push(t.get(X, Y)); }
    if (nb.length) t.set(x, y, medoid(nb));
  }
}

/**
 * Bề rộng dải mép (điểm ảnh gốc): độ sáng trung bình theo khoảng cách tới cạnh mặt trên (gộp cả 4 cạnh, nên sáng
 * trên trái / tối dưới phải tự triệt nhau); dải là các vòng ngoài cùng lệch hẳn so với phần trong (cách mép 16–30).
 */
function autoInset(nat, g) {
  const C = [(g.L[0] + g.R[0]) / 2, (g.L[1] + g.R[1]) / 2], hw = (g.R[0] - g.L[0]) / 2, hh = (g.B[1] - g.T[1]) / 2, edge = (hw * hh) / Math.hypot(hw, hh);
  const bins = Array.from({ length: 31 }, () => [0, 0]), inner = [];
  for (let y = 0; y < nat.h; y++) for (let x = 0; x < nat.w; x++) {
    if (!nat.alpha(x, y)) continue;
    const dx = (x + 0.5 - C[0]) / hw, dy = (y + 0.5 - C[1]) / hh, m = Math.max(Math.abs(dx + dy), Math.abs(dy - dx));
    if (m >= 1) continue;
    const k = Math.floor((1 - m) * edge), l = lum(nat.get(x, y));
    if (k > 30) continue;
    bins[k][0] += l; bins[k][1]++;
    if (k >= 16) inner.push(l);
  }
  if (inner.length < 20) return 1.5;
  const ref = inner.reduce((s, v) => s + v, 0) / inner.length, sd = Math.sqrt(inner.reduce((s, v) => s + (v - ref) ** 2, 0) / inner.length);
  const off = (k) => (bins[k][1] ? Math.abs(bins[k][0] / bins[k][1] - ref) : 0), lim = Math.max(5, 0.35 * sd);
  let k = 15;
  while (k > 0 && off(k - 1) < lim) k--;
  return Math.min(12, Math.max(1.5, k + 0.5));
}

/**
 * Ô bề ngang W: mặt trên thoi W×W/2 (ép affine từ L, T, R của khối gốc) rồi, trừ khi --face-only, đặt vào ảnh ô
 * isoTileImage(W) và thêm đáy dày `thick` điểm bên dưới hai cạnh dưới của thoi.
 */
function renderTile(nat, g, W, pal) {
  const C = [(g.L[0] + g.R[0]) / 2, (g.L[1] + g.R[1]) / 2];
  // Thu vào `inset` điểm theo khoảng cách vuông góc từ tâm tới cạnh thoi.
  const hw = (g.R[0] - g.L[0]) / 2, hh = (g.B[1] - g.T[1]) / 2, edge = (hw * hh) / Math.hypot(hw, hh);
  const inset = kind !== "tile" ? 0 : insetOpt === "auto" ? autoInset(nat, g) : +insetOpt;
  const H = W / 2;
  // Điểm đích (u, v) = L + α(T − L) + β(R − T), với α = u/W − (v − H/2)/H, β = u/W + (v − H/2)/H.
  const affine = (k) => {
    const [L, T, R] = [g.L, g.T, g.R].map((v) => [C[0] + (v[0] - C[0]) * k, C[1] + (v[1] - C[1]) * k]);
    return (u, v) => { const al = u / W - (v - H / 2) / H, be = u / W + (v - H / 2) / H; return [L[0] + al * (T[0] - L[0]) + be * (R[0] - T[0]), L[1] + al * (T[1] - L[1]) + be * (R[1] - T[1])]; };
  };
  const map = affine(1 - inset / edge), full = affine(1);
  const face = new Img(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inDiamond(x, y, W, H)) { const c = voteSample(nat, x, y, map, true); if (c) face.set(x, y, c); }
  fillHoles(face);
  let seam;
  if (kind === "tile") {
    scrubOutline(face);
    const before = seamScore(face);
    if (seamless) makeSeamless(face);
    seam = { before, after: seamless ? seamScore(face) : before };
  } else {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (face.alpha(x, y) && lum(face.get(x, y)) < 40) face.set(x, y, [...OUT_RGB, 255]);
  }
  if (faceOnly) return { out: face, inset, seam };
  // Ảnh ô: mặt trên đặt tại tâm quy cách; đáy dưới mỗi cột lấy từ mặt bên khối gốc (giãn `g.thick` điểm gốc về `thick`).
  const spec = isoTileImage(W), out = new Img(...spec.size), oy = spec.center[1] - H / 2, ox = spec.center[0] - W / 2;
  out.blit(face, 0, 0, W, H, ox, oy, true);
  const darken = (c, k) => { const d = [0, 1, 2].map((i) => Math.round(c[i] * k)); return [...(pal ? pal[nearestIdx(d, pal)] : d), 255]; };
  for (let x = 0; x < W; x++) {
    let yb = -1;
    for (let y = 0; y < H; y++) if (inDiamond(x, y, W, H)) yb = y;
    if (yb < 0) continue;
    const top = face.get(x, yb), left = x < W / 2;
    let prev = darken(top, left ? 0.72 : 0.56);
    for (let t = 1; t <= spec.thick; t++) {
      const Y = oy + yb + t;
      if (Y >= out.h) break;
      let c = null;
      if (g.thick >= 1.5) {
        // Điểm mép dưới thoi (chưa thu mép) trên khối gốc, đi xuống theo chiều dọc của ảnh gốc.
        const [sx, sy] = full(x + 0.5, yb + 1), X = Math.floor(sx), Yn = Math.floor(sy + ((t - 0.5) * g.thick) / spec.thick);
        if (X >= 0 && Yn >= 0 && X < nat.w && Yn < nat.h && nat.alpha(X, Yn)) c = nat.get(X, Yn);
      }
      if (!c) c = prev;
      else if (lum(c) < 40) c = kind === "tile" ? prev : [...OUT_RGB, 255]; // ô nền không viền
      out.set(ox + x, Y, c);
      prev = c;
    }
  }
  return { out, inset, seam, thickPx: spec.thick };
}
/** Điểm trống trong thoi (lấy mẫu rơi vào lỗ) lấy màu nhiều nhất của điểm kề. */
function fillHoles(t) {
  const W = t.w, H = t.h;
  for (let pass = 0; pass < 4; pass++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (t.alpha(x, y) || !inDiamond(x, y, W, H)) continue;
    const nb = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && t.alpha(X, Y)) nb.push(t.get(X, Y)); }
    if (nb.length) t.set(x, y, medoid(nb));
  }
}

function bboxOf(img) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
/**
 * Chân dung khung nền tối: hộp bao của ô → hình chữ nhật đặc của khung (hàng / cột đục quá nửa; bỏ phần nhô ra
 * nền như tia sét, lửa), thu vào 0,5% mỗi cạnh (tối thiểu 2 điểm) để bỏ mép nhòe với nền. Điểm ảnh lấy
 * từ ảnh gốc `src` (đã gỡ logo, chưa xóa nền) nên ánh hồng tím bên trong khung không bị xóa nhầm thành nền.
 * Khung đục dưới 85% hoặc góc khung trong suốt (chân dung nền trong suốt, biểu tượng tròn) thì trả null: giữ cách
 * căn giữa trong hộp bao.
 */
function panelRect(it, src) {
  const { img } = it, rowN = [], colN = new Array(img.w).fill(0);
  for (let y = 0; y < img.h; y++) { let n = 0; for (let x = 0; x < img.w; x++) if (img.alpha(x, y)) n++; rowN.push(n); }
  const rows = rowN.map((n, y) => (n >= img.w / 2 ? y : -1)).filter((y) => y >= 0);
  if (!rows.length) return null;
  const y0 = rows[0], y1 = rows[rows.length - 1];
  for (let y = y0; y <= y1; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y)) colN[x]++;
  const cols = colN.map((n, x) => (n >= (y1 - y0 + 1) / 2 ? x : -1)).filter((x) => x >= 0);
  const x0 = cols[0], x1 = cols[cols.length - 1];
  let opaque = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (img.alpha(x, y)) opaque++;
  if (opaque < (x1 - x0 + 1) * (y1 - y0 + 1) * 0.85) return null;
  const dx = Math.round((x1 - x0) * 0.03), dy = Math.round((y1 - y0) * 0.03);
  if (![[x0 + dx, y0 + dy], [x1 - dx, y0 + dy], [x0 + dx, y1 - dy], [x1 - dx, y1 - dy]].every(([x, y]) => img.alpha(x, y))) return null;
  const inset = Math.max(2, Math.round(Math.min(x1 - x0, y1 - y0) * 0.005)), sx = it.x0 + x0 + inset, sy = it.y0 + y0 + inset;
  const out = new Img(x1 - x0 + 1 - 2 * inset, y1 - y0 + 1 - 2 * inset);
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) out.set(x, y, src.get(sx + x, sy + y));
  return { img: out, x0: sx, y0: sy, x1: sx + out.w - 1, y1: sy + out.h - 1, panel: true };
}
/**
 * Chân dung khung → khung đích, không viền ngoài. Ảnh pixel thật đủ cỡ (thiếu tối đa 4 điểm) thì lấy phần giữa
 * 1:1, chỗ thiếu chép điểm mép (nằm dưới khung thẻ); nhỏ hơn nữa hoặc quá lớn thì lấy hình vuông giữa, thu / phóng phủ kín.
 */
function renderPanel(nat) {
  const t = new Img(FW, FH), direct = nat.w >= FW - 4 && nat.h >= FH - 4 && Math.min(nat.w, nat.h) <= Math.max(FW, FH) * 1.25;
  const clamp = (v, n) => Math.max(0, Math.min(n - 1, v));
  if (direct) {
    const ox = Math.floor((nat.w - FW) / 2), oy = Math.floor((nat.h - FH) / 2);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) t.set(x, y, nat.get(clamp(x + ox, nat.w), clamp(y + oy, nat.h)));
    return { out: t, lost: false, mode: "1:1" };
  }
  const side = Math.min(nat.w, nat.h), ox = (nat.w - side) / 2, oy = (nat.h - side) / 2;
  const map = (u, v) => [ox + (u * side) / FW, oy + (v * side) / FH];
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) t.set(x, y, voteSample(nat, x, y, map, true) ?? [...OUT_RGB, 255]);
  return { out: t, lost: false, mode: `×${(FW / side).toFixed(2)}` };
}
/**
 * Biểu tượng vật phẩm (--kind item): ô Gemini là khung nền tối. Bỏ 8% mép (viền khung), lấy màu nền là màu nhiều nhất
 * ở vành ngoài, loang từ vành vào qua các điểm gần màu nền (< --bg-tol) để làm trong suốt; phần sáng của quầng quanh vật
 * được giữ. Mảnh rời nhỏ hơn 4 điểm và dải viền khung còn sót (mảnh, chạm mép) bỏ đi.
 */
function clearPanel(img) {
  const ix = Math.round(img.w * 0.08), iy = Math.round(img.h * 0.08), W = img.w - 2 * ix, H = img.h - 2 * iy, out = new Img(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out.set(x, y, img.get(x + ix, y + iy));
  const ring = [];
  for (let x = 0; x < W; x++) ring.push([x, 0], [x, H - 1]);
  for (let y = 1; y < H - 1; y++) ring.push([0, y], [W - 1, y]);
  const bins = new Map();
  for (const [x, y] of ring) { const p = out.get(x, y), k = ((p[0] >> 4) << 8) | ((p[1] >> 4) << 4) | (p[2] >> 4); bins.set(k, [...(bins.get(k) ?? []), p]); }
  const bg = medoid([...bins.values()].sort((a, b) => b.length - a.length)[0]);
  const seen = new Uint8Array(W * H), stack = ring.filter(([x, y]) => dist(out.get(x, y), bg) < bgTol);
  for (const [x, y] of stack) seen[y * W + x] = 1;
  while (stack.length) {
    const [x, y] = stack.pop();
    out.set(x, y, [0, 0, 0, 0]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy, k = Y * W + X;
      if (X < 0 || Y < 0 || X >= W || Y >= H || seen[k]) continue;
      seen[k] = 1;
      if (dist(out.get(X, Y), bg) < bgTol) stack.push([X, Y]);
    }
  }
  const { lab, comps } = components(out);
  // Mảnh rời nhỏ, và dải mảnh (≤ 3 điểm bề ngang) chạm mép: phần viền khung còn sót.
  const frame = (c) => (c.x0 === 0 || c.y0 === 0 || c.x1 === W - 1 || c.y1 === H - 1) && Math.min(c.x1 - c.x0, c.y1 - c.y0) < 3;
  for (let i = 0; i < W * H; i++) if (lab[i] >= 0 && (comps[lab[i]].n < 4 || frame(comps[lab[i]]))) out.data[i * 4 + 3] = 0;
  return out;
}
/** Biểu tượng: mỗi món vừa khung riêng (chừa 1 điểm mỗi bên), căn giữa, thêm viền #1a1020. Không phóng to (--icon: tối đa ICON_MAX_UP). */
function renderIcon(nat) {
  const b = bboxOf(nat), t = new Img(FW, FH), s = Math.min(iconMode ? ICON_MAX_UP : 1, (FW - 2) / b.w, (FH - 2) / b.h);
  const cx = (b.x0 + b.x1 + 1) / 2, cy = (b.y0 + b.y1 + 1) / 2, map = (u, v) => [cx + (u - FW / 2) / s, cy + (v - FH / 2) / s];
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = voteSample(nat, x, y, map, false); if (c) t.set(x, y, c); }
  addOutline(t);
  return { out: t, lost: false, mode: `×${s.toFixed(2)}` };
}
/**
 * Khung viền phủ kín ô: hộp bao đưa về đúng FW×FH bằng cách bớt (hoặc nhân) các cột / hàng chính giữa, nơi lòng khung trong suốt và
 * hai cạnh là đường thẳng: viền và góc giữ nguyên từng điểm (lấy mẫu lại thì viền 1–2 điểm bị đứt nét). Viền sẵn có nên không thêm.
 */
function renderFrame(nat) {
  const b = bboxOf(nat), t = new Img(FW, FH), at = (i, n, F) => (i < F >> 1 ? i : n - (F - i));
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const X = at(x, b.w, FW), Y = at(y, b.h, FH);
    if (X >= 0 && Y >= 0 && X < b.w && Y < b.h && nat.alpha(b.x0 + X, b.y0 + Y)) t.set(x, y, nat.get(b.x0 + X, b.y0 + Y));
  }
  return { out: t, lost: false, mode: `khung ${b.w}×${b.h} → ${FW}×${FH}` };
}
/**
 * Khóa kép (--key2): ma-nơ-canh xám phẳng đứng làm khuôn cho phụ thể vẽ quanh người. Điểm gần màu key2 (mọi kênh lệch ≤ --key2-tol) là
 * ma-nơ-canh: xóa khỏi ảnh và trả hộp bao của chúng (chân, tâm ngang, chiều cao) để căn phụ thể theo người chơi.
 */
function takeMannequin(img) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!img.alpha(x, y) || maxDiff(img.get(x, y), key2) > key2Tol) continue;
    img.set(x, y, [0, 0, 0, 0]);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return x1 < 0 ? null : { x0, y0, x1, y1, h: y1 - y0 + 1 };
}
/**
 * Mảnh giao diện (--kind ui, --size WxH): khung, la bàn, nền giấy. Hộp bao của ảnh (ảnh nền #FF00FF / trong suốt: hộp bao của vật; --opaque: cả ảnh)
 * vừa khung đích, giữ tỉ lệ, căn giữa, lấy mẫu theo phiếu nhiều nhất (không nội suy), giữ alpha, không thêm viền (ảnh đã có viền).
 */
function renderUi(nat) {
  const b = bboxOf(nat), t = new Img(FW, FH), s = Math.min(FW / b.w, FH / b.h), cx = (b.x0 + b.x1 + 1) / 2, cy = (b.y0 + b.y1 + 1) / 2, map = (u, v) => [cx + (u - FW / 2) / s, cy + (v - FH / 2) / s];
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = voteSample(nat, x, y, map, false); if (c) t.set(x, y, c); }
  return { out: t, lost: false, mode: `×${s.toFixed(2)}`, ...(s > 1 ? { warning: "phóng to ảnh giả pixel: đặt --size nhỏ hơn hoặc bằng cỡ gốc" } : {}) };
}
/** Bản xám để client tô màu (hồn cốt theo niên hạn): độ sáng giữ nguyên, viền #1a1020 giữ nguyên. */
function toGray(t) {
  for (let i = 0; i < t.data.length; i += 4) {
    if (!t.data[i + 3]) continue;
    const p = [t.data[i], t.data[i + 1], t.data[i + 2]];
    if (toHex(p) === OUTLINE) continue;
    const l = Math.round(lum(p));
    t.data[i] = t.data[i + 1] = t.data[i + 2] = l;
  }
}
/** Sprite: chân (đáy hộp bao, giữa ngang) vào gốc, hệ số thu `s` chung cả lô; portrait căn giữa khung. */
function renderSprite(nat, s, man) {
  const b = bboxOf(nat), t = new Img(FW, FH);
  const portrait = kind === "portrait";
  // Có ma-nơ-canh (--key2): chân và tâm ngang là của ma-nơ-canh (vị trí người chơi), không phải hộp bao của phụ thể.
  const cx = man ? (man.x0 + man.x1 + 1) / 2 : (b.x0 + b.x1 + 1) / 2, cy = man ? man.y1 + 1 : portrait ? (b.y0 + b.y1 + 1) / 2 : b.y1 + 1, ax = portrait ? FW / 2 : AX, ay = portrait ? FH / 2 : AY + 1;
  const map = (u, v) => [cx + (u - ax) / s, cy + (v - ay) / s];
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = voteSample(nat, x, y, map, false); if (c) t.set(x, y, c); }
  addOutline(t);
  const lost = cx - (ax / s) > b.x0 + 0.5 || cx + (FW - ax) / s < b.x1 + 0.5 || cy - ay / s > b.y0 + 0.5;
  return { out: t, lost };
}
/** Điểm tối ở mép ngoài → #1a1020; mép ngoài còn sáng thì thêm viền #1a1020 ra ngoài 1 điểm. */
function addOutline(t) {
  const W = t.w, H = t.h, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const clear = (x, y) => x < 0 || y < 0 || x >= W || y >= H || !t.alpha(x, y);
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (clear(x, y) || !N4.some(([dx, dy]) => clear(x + dx, y + dy))) continue;
    if (lum(t.get(x, y)) < 70) { t.set(x, y, [...OUT_RGB, 255]); continue; }
    for (const [dx, dy] of N4) if (clear(x + dx, y + dy) && x + dx >= 0 && y + dy >= 0 && x + dx < W && y + dy < H) add.push([x + dx, y + dy]);
  }
  for (const [x, y] of add) t.set(x, y, [...OUT_RGB, 255]);
}

// ---------- 7. Xuất ----------
function contactSheet(imgs, scale) {
  const gap = 4, cols = Math.min(imgs.length, isTile ? 4 : 8);
  const cw = Math.max(...imgs.map((i) => i.w)), chh = Math.max(...imgs.map((i) => i.h)), rows = Math.ceil(imgs.length / cols);
  const W = (cols * (cw + gap) + gap) * scale, H = (rows * (chh + gap) + gap) * scale, out = new Img(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out.set(x, y, (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? [200, 200, 200, 255] : [235, 235, 235, 255]);
  imgs.forEach((img, n) => {
    const ox = gap + (n % cols) * (cw + gap), oy = gap + Math.floor(n / cols) * (chh + gap);
    for (let y = 0; y < img.h * scale; y++) for (let x = 0; x < img.w * scale; x++) {
      const p = img.get(Math.floor(x / scale), Math.floor(y / scale));
      if (p[3]) out.set(ox * scale + x, oy * scale + y, p);
    }
  });
  return out;
}

// ---------- Chạy ----------
const raw = decodePng(readFileSync(file));
const K = keyColor(raw);
const logo = removeLogo(raw, K);
const clean = opaqueMode ? (() => { const o = new Img(raw.w, raw.h, Uint8Array.from(raw.data)); for (let i = 3; i < o.data.length; i += 4) o.data[i] = 255; return o; })() : removeBackground(raw, K);
// Chân dung khung nền tối: thay mỗi vật bằng phần đặc của khung, cắt từ ảnh gốc.
const items = splitItems(clean).map((it) => ((kind === "portrait" || kind === "item") && !iconMode && panelRect(it, raw)) || it);
if (!items.length) { console.error(`${file}: không tìm thấy vật nào sau khi xóa nền`); process.exit(1); }
if (names.length && names.length !== items.length) {
  // Gán tên theo chỉ số khi số vật lệch thì mọi ô phía sau mang tên sai mà không ai biết → dừng.
  console.error(`${file}: tách được ${items.length} vật nhưng --names có ${names.length} tên. Hộp bao (x,y,rộng×cao) theo thứ tự đọc:`);
  items.forEach((it, i) => console.error(`  ${i}: ${it.x0},${it.y0} ${it.x1 - it.x0 + 1}×${it.y1 - it.y0 + 1}`));
  console.error("Dùng --grid CxR nếu các vật dính nhau hoặc có mảnh rời bị tách thành vật riêng.");
  process.exit(1);
}
const P = cellOpt === "auto" ? commonPeriod(items.map((it) => it.img)) : +cellOpt;
const cutNames = cutBaseOpt.split(",").filter(Boolean);
const nat = items.map((it, i) => {
  const n = { ...it, ...defake(it.img, P) }, name = names[i] ?? `${kind}_${i}`;
  if (key2) n.man = takeMannequin(n.img);
  if (kind === "item" && n.panel) return { ...n, img: clearPanel(n.img), panel: false, icon: true };
  if (kind === "item" && iconMode) return { ...n, icon: true };
  return !isTile && (cutNames.includes("all") || cutNames.includes(name)) ? { ...n, ...cutBase(n.img), cut: true } : n;
});
const pals = buildPalettes(nat.map((n) => n.img));
const q = nat.map((n, i) => quantize(n.img, pals[i]));
// Mọi màu đã dùng (bảng auto / auto-item gộp lại, bỏ trùng) để ghi _palette.gpl.
const pal = [...new Map(pals.flat().filter(Boolean).map((c) => [toHex(c), c])).values()];

// Sprite: hệ số thu chung = vừa vật lớn nhất (cao tới đỉnh khung trừ 2 điểm, rộng trừ 2 điểm mỗi bên); không phóng to.
let s = 1;
if (scaleOpt) s = +scaleOpt;
else if (key2 && nat.some((n) => n.man)) s = manH / [...nat.filter((n) => n.man).map((n) => n.man.h)].sort((a, b) => a - b)[nat.filter((n) => n.man).length >> 1];
else if (!isTile) {
  const bs = q.filter((_, n) => !nat[n].panel).map(bboxOf), maxW = Math.max(...bs.map((b) => b.w)), maxH = Math.max(...bs.map((b) => b.h));
  const room = kind === "portrait" ? FH - 4 : AY + 1 - 2;
  if (bs.length) s = Math.min(1, room / maxH, (FW - 4) / maxW);
}

mkdirSync(outDir, { recursive: true });
const report = { source: path.resolve(file), kind, size: isTile ? TILE_WIDTHS : [FW, FH], key: toHex(K), logo, period: +P.toFixed(2), palette: paletteOpt.startsWith("auto") ? `${paletteOpt} ${pal.length} màu` : paletteOpt, items: [] };
const outs = new Map(); // thư mục ra → ảnh (cho _preview.png)
const save = (dir, name, img) => { mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, `${name}.png`), encodePng(img)); outs.set(dir, [...(outs.get(dir) ?? []), img]); };
const colorCount = (img) => { const c = new Set(); for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3]) c.add((img.data[i] << 16) | (img.data[i + 1] << 8) | img.data[i + 2]); return c.size; };
q.forEach((img, n) => {
  const name = names[n] ?? `${kind}_${n}`, it = nat[n];
  const info = { name, box: [it.x0, it.y0, it.x1 - it.x0 + 1, it.y1 - it.y0 + 1], cell: it.cell, native: [img.w, img.h] };
  if (debug) { mkdirSync(path.join(outDir, "_native"), { recursive: true }); writeFileSync(path.join(outDir, "_native", `${name}.png`), encodePng(img)); }
  let line = "";
  if (isTile) {
    let g;
    try { g = tileGeometry(img); } catch (e) { console.warn(`[gemini] bỏ qua ${name} (hộp ${info.box.join(",")}): ${e.message}`); return; }
    info.face = { width: +(g.R[0] - g.L[0]).toFixed(1), height: +(g.B[1] - g.T[1]).toFixed(1), ratio: +((g.R[0] - g.L[0]) / (g.B[1] - g.T[1])).toFixed(2), thick: +g.thick.toFixed(1) };
    info.sizes = {};
    for (const W of TILE_WIDTHS) {
      const res = renderTile(img, g, W, pals[n]);
      save(TILE_WIDTHS.length > 1 || !faceOnly ? path.join(outDir, String(W)) : outDir, name, res.out);
      info.inset = res.inset;
      info.sizes[W] = { colors: colorCount(res.out), ...(res.seam ? { seam: res.seam } : {}) };
      line += `  [${W}: ${res.seam ? `mép ghép ${res.seam.before}→${res.seam.after}, ` : ""}${info.sizes[W].colors} màu]`;
    }
    line = `  mặt trên ${info.face.width}×${info.face.height} (tỉ lệ ${info.face.ratio}:1), dày ${info.face.thick}${kind === "tile" ? `, bỏ mép ${info.inset}` : ""}` + line;
  } else {
    const res = kind === "ui" ? renderUi(img) : nat[n].panel ? renderPanel(img) : nat[n].icon ? (frameMode ? renderFrame(img) : renderIcon(img)) : renderSprite(img, s, nat[n].man);
    if (grayOpt.split(",").some((g) => g === "all" || g === name)) toGray(res.out);
    if (res.lost) info.warning = "hình tràn khung, bị cắt";
    if (res.warning) info.warning = res.warning;
    if (res.mode) info.fit = res.mode;
    if (it.cut) info.base = it.base ?? "không dò được đế";
    save(outDir, name, res.out);
    info.colors = colorCount(res.out);
    line = `${info.fit ? ` → khung ${info.fit}` : ""}${it.cut ? (it.base ? `, cắt đế rộng ${it.base.width} dày ${it.base.thick} (bỏ ${it.base.removed} điểm)` : ", KHÔNG dò được đế") : ""}, ${info.colors} màu${info.warning ? `  (CẢNH BÁO: ${info.warning})` : ""}`;
  }
  report.items.push(info);
  console.log(`[gemini] ${name}: ô giả ${it.cell.join("×")} px → gốc ${img.w}×${img.h}${line}`);
});
if (!isTile) report.scale = +s.toFixed(3);
writeFileSync(path.join(outDir, "_report.json"), JSON.stringify(report, null, 2) + "\n");
// Bảng auto ghi ra .gpl để duyệt và chọn màu bổ sung cho art/palette.gpl.
if (paletteOpt.startsWith("auto")) writeFileSync(path.join(outDir, "_palette.gpl"), `GIMP Palette\nName: ${path.basename(file)} auto\nColumns: 8\n#\n` + pal.map((c) => `${c.map((v) => String(v).padStart(3)).join(" ")}\t${toHex(c)}`).join("\n") + "\n");
if (previewScale > 0) for (const [dir, imgs] of outs) writeFileSync(path.join(dir, "_preview.png"), encodePng(contactSheet(imgs, previewScale)));
console.log(`[gemini] ${report.items.length} vật → ${[...outs.keys()].join(", ")}${logo ? `; logo đã gỡ (${logo.mode}, ${logo.pixels} điểm)` : ""}${isTile ? "" : `; hệ số thu ${s.toFixed(3)}`}`);
