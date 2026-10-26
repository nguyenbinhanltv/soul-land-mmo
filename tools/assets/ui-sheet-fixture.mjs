// Dựng tờ UI GIẢ LẬP để thử ui-sheet-check / ui-sheet-cut (#879): KHÔNG phải ảnh model.
// Hai nguồn: (1) mảnh thật đã có ở shared/assets/sprites/iso/ui (7 mảnh C2 đã duyệt #811, khung UI-5) phóng nearest ×k đặt lên nền #FF00FF;
// (2) khung tổng hợp `fakeFrame` (viền phẳng, góc / đầu giữa cạnh có hoa văn) kèm các lỗi cố ý (cạnh sọc, chữ lạc, viền ám hồng, nền sai).
import path from "node:path";
import { ROOT, Img, readPng } from "./lib.mjs";
import { drawText } from "./beast-sheet-contact.mjs";

export const UI_DIR = path.join(ROOT, "shared", "assets", "sprites", "iso", "ui");
export const C2_PIECES = ["nv6_nen_bup_be", "nv6_luc_giac", "nv6_dan_dien", "thong_bao_len_cap", "thong_bao_hon_hoan", "khung_tab_nhan_vat", "tho_ren_nang_cap"];
export const UI5_FRAMES = ["hop_thoai", "cuon_giay", "nut_thuong", "nut_ro", "nut_nhan", "nut_tat"];
export const readUi = (n) => readPng(path.join(UI_DIR, `${n}.png`));

const KEY = [255, 0, 255, 255];
export const scaled = (im, k) => { const o = new Img(im.w * k, im.h * k); for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.set(x, y, im.get((x / k) | 0, (y / k) | 0)); return o; };

/** Khung tổng hợp w×h: viền ngoài 1 điểm mực, dải viền dày t, ruột. cap = hoa văn vuông ở bốn góc và giữa cạnh; stripes = viền sọc (lỗi); text = chữ trong ruột (lỗi). */
export function fakeFrame(w, h, { t = 4, cap = 8, stripes = false, text = null, inner = [60, 40, 70], band = [176, 138, 74], ink = [26, 16, 32], capColor = [200, 60, 50], round = true } = {}) {
  const im = new Img(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.min(x, y, w - 1 - x, h - 1 - y);
    let c = d === 0 ? ink : d < t ? band : inner;
    if (stripes && d > 0 && d < t && (x + y) % 6 < 3) c = [120, 200, 120];
    im.set(x, y, [...c, 255]);
  }
  const block = (x0, y0, n) => { for (let y = y0; y < y0 + n; y++) for (let x = x0; x < x0 + n; x++) if (x >= 0 && y >= 0 && x < w && y < h) im.set(x, y, [...capColor, 255]); };
  if (cap) for (const [x, y] of [[0, 0], [w - cap, 0], [0, h - cap], [w - cap, h - cap], [(w - cap) >> 1, 0], [(w - cap) >> 1, h - cap], [0, (h - cap) >> 1], [w - cap, (h - cap) >> 1]]) block(x, y, cap);
  if (round) for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) im.set(x, y, [0, 0, 0, 0]);
  if (text) drawText(im, t + 4, (h >> 1) - 3, text, 1, [250, 250, 250, 255]);
  return im;
}

/**
 * Tờ giả lập: `rows` = mảng các hàng, mỗi hàng là mảng ảnh (đã ở lưới master); phóng ×`k`, đặt giữa ô lưới đều trên nền khoá.
 * @param {{ w?: number, h?: number, k?: number, bg?: number[], halo?: number }} o halo: độ dày (điểm sheet) vòng ám hồng quanh mảnh (lỗi viền)
 */
export function buildSheet(rows, { w = 1536, h = 1024, k = 4, bg = KEY, halo = 0 } = {}) {
  const sheet = new Img(w, h);
  for (let i = 0; i < w * h; i++) { sheet.data[i * 4] = bg[0]; sheet.data[i * 4 + 1] = bg[1]; sheet.data[i * 4 + 2] = bg[2]; sheet.data[i * 4 + 3] = 255; }
  rows.forEach((row, r) => row.forEach((piece, c) => {
    const big = scaled(piece, k), cx = Math.round((w * (c + 0.5)) / row.length), cy = Math.round((h * (r + 0.5)) / rows.length);
    const x0 = cx - (big.w >> 1), y0 = cy - (big.h >> 1);
    if (halo) for (let y = -halo; y < big.h + halo; y++) for (let x = -halo; x < big.w + halo; x++) {
      const inside = x >= 0 && y >= 0 && x < big.w && y < big.h && big.alpha(x, y) > 0;
      if (!inside && x + x0 >= 0 && y + y0 >= 0 && x + x0 < w && y + y0 < h) {
        const near = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => { for (let s = 1; s <= halo; s++) { const u = x + dx * s, v = y + dy * s; if (u >= 0 && v >= 0 && u < big.w && v < big.h && big.alpha(u, v) > 0) return true; } return false; });
        if (near) sheet.set(x + x0, y + y0, [220, 90, 220, 255]);
      }
    }
    for (let y = 0; y < big.h; y++) for (let x = 0; x < big.w; x++) if (big.alpha(x, y) > 0) sheet.set(x0 + x, y0 + y, big.get(x, y));
  }));
  return sheet;
}

/** Tờ C2: 7 mảnh C2 phóng ×2, bố cục 3 + 2 + 2, dùng kèm `C2_KIND`. */
export function c2Sheet(o = {}) {
  const p = C2_PIECES.map(readUi);
  return buildSheet([p.slice(0, 3), p.slice(3, 5), p.slice(5, 7)], { k: 2, ...o });
}
/** Loại tờ riêng cho tờ C2 (khung đã sạch nên không dựng gương). */
export const C2_KIND = {
  id: "C2", title: "7 mảnh C2", shapes: ["3:2"], layouts: [[3, 2, 2]], div: 2, group: "kit", stretch: true, mirror: false, text: true,
  // cả bảy mảnh là tranh vẽ tay (dây leo, hoa văn bất đối xứng), KHÔNG phải khung 9-slice: để stretch=false; ca nen_bup_be bị chặn khi coi là khung nằm ở test.
  pieces: C2_PIECES.map((name) => ({ name, stretch: false, text: false })),
};
/** Tờ UI-5: 6 khung cũ (58 px) phóng ×4, bố cục 3 + 3, loại F. */
export function ui5Sheet(o = {}) {
  const p = UI5_FRAMES.map(readUi);
  return buildSheet([p.slice(0, 3), p.slice(3, 6)], { k: 4, ...o });
}
