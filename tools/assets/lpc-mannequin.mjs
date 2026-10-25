// Dựng thân mẫu LPC (nam, nữ) theo đúng bố cục sheet hồn sư isometric (24 × 6, khung 64) để làm đầu vào `--body` của
// vohon-part / pack khi vẽ phụ thể: điểm neo (đầu, lưng, chân, tay) lấy từ chính lớp thân LPC mà client ghép (lpcRig.ts),
// nên phụ thể khớp từng khung đi / đánh / thi triển của hồn sư thật. Ra ba lớp mỗi giới như bộ cũ: body (da), outfit (áo + quần + giày), hair.
//   node tools/assets/lpc-mannequin.mjs --out <thư mục>      ghi <thư mục>/{body,outfit,hair}_{m,f}_0.png
// Ánh xạ khung theo LPC_SHEET (strips, anims, dir8): hàng s / se / e / ne / n → hàng vật lý s, e, e, e, n của sheet món (se, e, ne cùng
// hàng phải, như PHYS_DIR_ROW của lpcRig). Da của lớp body đưa về một sắc da của bảng để frameAnchors nhận ra mảng tay.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readPng, encodePng, Img, hex, paletteGroup, isoLayout, ISO_HS_FRAME, ROOT } from "./lib.mjs";
const { LPC_SHEET } = await import("../../shared/data.ts");

const args = process.argv.slice(2), oi = args.indexOf("--out"), out = oi >= 0 ? args[oi + 1] : "";
if (!out) { console.error("Cách dùng: lpc-mannequin.mjs --out <thư mục>"); process.exit(1); }
const P = path.join(ROOT, "shared", "assets", "lpcparts"), F = ISO_HS_FRAME, HL = isoLayout("honsu");
// Ngoại hình mẫu: áo ngắn tay, quần dài, giày ống, tóc ngắn (nam) / dài (nữ); lớp theo (nhóm, tên tệp không đuôi giới, z).
const SETS = {
  m: { body: [["body_body", 10]], head: [["head_male", 100]], outfit: [["legs_pants", 20], ["feet_boots_basic", 25], ["torso_shortsleeve", 35]], hair: [["hair_plain", 120]] },
  f: { body: [["body_body", 10]], head: [["head_female", 100]], outfit: [["legs_pants", 20], ["feet_boots_basic", 25], ["torso_shortsleeve", 35]], hair: [["hair_long_straight", 120]] },
};
const skin = hex(paletteGroup("Da ")[1]);
const PHYS_ROW = [0, 1, 1, 1, 2]; // s, se, e, ne, n → hàng vật lý
const SRC_ROW = [LPC_SHEET.rows.s, LPC_SHEET.rows.e, LPC_SHEET.rows.n];

mkdirSync(out, { recursive: true });
for (const sx of ["m", "f"]) {
  const layers = (list, flat) => list.map(([n, z]) => {
    const im = readPng(path.join(P, `lpcp_${n}_${sx}_${z}.png`));
    if (flat) for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3]) { im.data[i] = skin[0]; im.data[i + 1] = skin[1]; im.data[i + 2] = skin[2]; }
    return im;
  });
  const groups = { body: layers([...SETS[sx].body, ...SETS[sx].head], true), outfit: layers(SETS[sx].outfit, false), hair: layers(SETS[sx].hair, false) };
  const sheets = {};
  for (const [name, ims] of Object.entries(groups)) {
    const sheet = new Img(HL.cols * F, HL.rows * F);
    for (const [anim, A] of Object.entries(LPC_SHEET.anims)) {
      if (A.dirs !== "all") continue; // hurt / die / absorb không có phụ thể riêng
      const st = LPC_SHEET.strips[A.strip], [c0, n] = HL.anims[anim];
      for (let i = 0; i < n; i++) for (let r = 0; r < 5; r++) {
        const sc = st.col + A.idx[i], sr = SRC_ROW[PHYS_ROW[r]];
        for (const im of ims) sheet.blit(im, sc * F, sr * F, F, F, (c0 + i) * F, r * F, true);
      }
    }
    sheets[name] = sheet;
  }
  // Lớp body chỉ giữ da lộ ra (đầu, cẳng tay, bàn tay): da dưới áo / tóc / giày bỏ đi, nếu không mảng da liền cả người và frameAnchors không tách được tay.
  const cover = new Img(sheets.body.w, sheets.body.h);
  for (const g of ["outfit", "hair"]) cover.blit(sheets[g], 0, 0, sheets[g].w, sheets[g].h, 0, 0, true);
  for (let y = 0; y < cover.h; y++) for (let x = 0; x < cover.w; x++) if (cover.alpha(x, y)) sheets.body.data[(y * sheets.body.w + x) * 4 + 3] = 0;
  for (const [name, sheet] of Object.entries(sheets)) {
    writeFileSync(path.join(out, `${name}_${sx}_0.png`), encodePng(sheet));
  }
}
console.log(`[lpc-mannequin] ghi 6 sheet ${HL.cols * F}×${HL.rows * F} vào ${out}`);
