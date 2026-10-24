// Kiểm bảng SKILL_VISUAL (client/src/skillVisual.ts): mọi khóa trỏ tới chiêu có thật, sheet khai báo có trong manifest hoặc dựng bằng code.
// Đọc nguồn bằng regex (skillVisual.ts kéo Phaser, Node không nạp được). Chạy: npm run test:skillvisual --prefix client
import { readFileSync } from "node:fs";
import { VOHON, ringSkill, chanThanOf, tienCoOf, MAX_RINGS } from "../../shared/data.ts";

let fails = 0;
const ok = (c, msg) => { console.log(`${c ? "✓" : "✗"} ${msg}`); if (!c) fails++; };
const src = readFileSync(new URL("../src/skillVisual.ts", import.meta.url), "utf8");
const body = src.slice(src.indexOf("export const SKILL_VISUAL"), src.indexOf("export function skillVisualOf"));
const keys = [...body.matchAll(/^\s*"([a-z_]+):(\d+|ct|tc)":/gm)].map((m) => [m[1], m[2]]);
ok(keys.length > 0, `bảng có ${keys.length} mục thử`);
for (const [id, r] of keys) {
  const has = VOHON.some((v) => v.id === id) && (r === "tc" ? !!tienCoOf(id) : r === "ct" ? !!chanThanOf(id)?.skill : +r < MAX_RINGS && !!ringSkill(id, +r));
  ok(has, `khóa ${id}:${r} là chiêu có thật`);
}
const manifest = JSON.parse(readFileSync(new URL("../../shared/assets/sprites/manifest.json", import.meta.url), "utf8")).sprites.map((e) => (typeof e === "string" ? e : e.key));
const codeSheets = [...src.matchAll(/makeCodeSheet\(scene, "([a-z_]+)"/g)].map((m) => m[1]);
for (const k of new Set([...body.matchAll(/key: "([a-z_]+)"/g)].map((m) => m[1]))) ok(manifest.includes(k) || codeSheets.includes(k), `sheet ${k} có ảnh (manifest) hoặc dựng bằng code`);
// S2 / S3 (#548, #566): sheet dựng bằng sk("<tên>", …) cần ảnh `fx_sk_<tên>` và lớp sáng `fx_sk_<tên>_g` trong manifest; mỗi võ hồn đã điền đủ 11 chiêu (vòng 1–6, 8, 9, 10, Chân Thân, tiên cơ).
for (const n of new Set([...body.matchAll(/sk\("([a-z0-9_]+)"/g)].map((m) => m[1]))) ok(manifest.includes(`fx_sk_${n}`) && manifest.includes(`fx_sk_${n}_g`), `sheet fx_sk_${n} (+ lớp sáng _g) có trong manifest`);
for (const id of ["lam_dien_ba_vuong_long", "hao_thien_chuy", "cuu_tinh_that_sat_kiem", "nguyet_nhan", "can_khon_hon_nguyen_toa", "xuc_xich", "thien_can_bach_ngoc_dinh", "cuu_bao_luu_ly_thap", "pha_hon_thuong"]) ok(["0", "1", "2", "3", "4", "5", "7", "8", "9", "ct", "tc"].every((r) => keys.some(([i, k]) => i === id && k === r)), `${id} đủ 11 chiêu trong bảng`);
// S3 lô B (#567): 6 thú võ hồn đủ 11 chiêu; dung hợp có sheet trong bảng FUSION_VISUAL.
for (const id of ["u_minh_linh_mieu", "nhu_cot_tho", "kim_vu_mieu_ung", "yeu_ho", "liet_hoa_thuong_lang", "bach_ho"]) ok(["0", "1", "2", "3", "4", "5", "7", "8", "9", "ct", "tc"].every((r) => keys.some(([i, k]) => i === id && k === r)), `${id} đủ 11 chiêu trong bảng`);
for (const [n, k] of [["Hạo Thiên Nhu Cốt", "hn_t3"], ["U Minh Bạch Hổ", "ub_t3"]]) ok(src.includes(`"${n}": {`) && src.includes(`sk("${k}"`), `dung hợp ${n} có sheet (FUSION_VISUAL)`);
// S3 lô C (#568): 5 võ hồn đủ 11 chiêu; dung hợp Băng Hỏa Lưỡng Nghi có sheet.
for (const id of ["ta_hoa_phuong_hoang", "hoa_long", "hoa_anh", "quy_mi", "bang_phuong_hoang"]) ok(["0", "1", "2", "3", "4", "5", "7", "8", "9", "ct", "tc"].every((r) => keys.some(([i, k]) => i === id && k === r)), `${id} đủ 11 chiêu trong bảng`);
ok(src.includes("\"Băng Hỏa Lưỡng Nghi\": {") && src.includes("sk(\"bh_t3\""), "dung hợp Băng Hỏa Lưỡng Nghi có sheet (FUSION_VISUAL)");
if (fails) { console.error(`${fails} lỗi`); process.exit(1); }
