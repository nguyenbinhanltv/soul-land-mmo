// Nhập kit UI v2 (Mực + Giấy) vào game (#885, theo dõi #877; docs/art/ui-kit.md "Nhập kit vào game").
//   node tools/assets/ui-import.mjs            cắt lại từ ảnh RAW trong art/src/ui-kit (PLAN bên dưới), ghi ảnh vào shared/assets/sprites/iso/ui2/{2x,1x},
//                                              đăng ký khoá ui2_* vào shared/assets/sprites/manifest.json và mảnh vào art/src/ui-kit/ui-kit.json
//   node tools/assets/ui-import.mjs --check    không ghi; lỗi nếu ảnh / manifest trong repo lệch với kết quả cắt (cắt tất định: cùng RAW → cùng byte)
// Không sửa tay manifest: danh sách tờ, tuỳ chọn cắt và mảnh lấy ở PLAN; đổi kit (tờ mới, mảnh vẽ lại) thì sửa PLAN rồi chạy lại.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng } from "./lib.mjs";
import { loadKit, saveKit, KIT_JSON, kindFromName, expandKind } from "./ui-kit-lib.mjs";
import { budgetOf, cutUiSheet, mergeIntoKit } from "./ui-sheet-cut.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const KIT_DIR = "art/src/ui-kit";
const OUT = path.join(ROOT, "shared/assets/sprites/iso/ui2");
const MANIFEST = path.join(ROOT, "shared/assets/sprites/manifest.json");

/**
 * Tờ nào, cắt thế nào, lấy mảnh nào. `keep` là danh sách mảnh nhập (phần còn lại của tờ bị `--skip`). Tên mảnh chỗ đứng `khung_muc_*` /
 * `khung_giay_*` của tờ F chỉ là vị trí: tờ F Mực vẽ cả sáu khung Mực, tờ F Giấy vẽ cả sáu khung Giấy (NGUON.md), nên mỗi tờ chỉ nhập phần đúng chất liệu.
 */
export const PLAN = [
  { sheet: "toF.png", note: "F Mực (= attempt2)", keep: ["khung_muc_lon", "khung_muc_nho", "khung_tooltip"] },
  { sheet: "candidates/dot3/muc/toF-5.png", note: "F Mực attempt5, chỉ toast", keep: ["khung_toast"] },
  { sheet: "candidates/dot3/giay/toF-2.png", note: "F Giấy, chỉ khung lớn / nhỏ", keep: ["khung_giay_lon", "khung_giay_nho"] },
  { sheet: "candidates/toN-attempt6.png", note: "N Mực", keep: ["nut_chinh_thuong", "nut_chinh_ro", "nut_chinh_nhan", "nut_chinh_tat", "nut_chinh_chon", "nut_phu_thuong", "nut_phu_ro", "nut_phu_nhan", "nut_phu_tat", "nut_phu_chon", "tab_thuong", "tab_chon"] },
  { sheet: "candidates/toO-attempt5.png", note: "O Mực", keep: ["o_trong", "o_co", "o_chon", "o_hiem_1", "o_hiem_2", "o_hiem_3", "o_hiem_4", "o_hiem_5", "ky_nang_san_sang", "ky_nang_hoi_chieu", "ky_nang_khoa", "ky_nang_thieu_hon_luc"] },
  { sheet: "candidates/toT-attempt5.png", note: "T Mực", keep: ["thanh_khung_sinh", "thanh_khung_hon", "thanh_khung_kn", "thanh_do_sinh", "thanh_do_hon", "thanh_do_kn", "vach_chia", "thanh_cuon", "o_nhap"] },
];

/** Cắt cả kế hoạch; trả { kit, files } (files: Map `2x/ui2_x.png` → Buffer; kit: ui-kit.json với `pieces` / `groups` dựng lại từ đầu). */
export function cutPlan(plan = PLAN, base = loadKit()) {
  let kit = { ...base, pieces: [], groups: {} };
  const files = new Map();
  for (const job of plan) {
    const file = path.join(ROOT, KIT_DIR, job.sheet);
    if (!existsSync(file)) throw new Error(`không có tờ ${job.sheet}`);
    const name = path.basename(file, ".png"), kindId = kindFromName(name) ?? job.sheet.match(/to([FNOTID])/)?.[1], all = expandKind(base, kindId).pieces.map((p) => p.name);
    for (const k of job.keep) if (!all.includes(k)) throw new Error(`${job.sheet}: loại tờ không có mảnh ${k}`);
    const cut = cutUiSheet({ img: readPng(file), name, kindId, kit: base, soft: true, skip: all.filter((n) => !job.keep.includes(n)) });
    for (const p of cut.pieces) if (!job.keep.includes(p.name)) throw new Error(`${job.sheet}: mảnh ${p.name} ngoài danh sách nhập`);
    kit = mergeIntoKit(kit, cut);
    for (const [f, buf] of cut.files) files.set(f, buf);
  }
  return { kit, files };
}

/** Mục manifest ảnh cho một mảnh: `nine` { x2, x1 } do cutter đo (uiKit.ts đọc); mảnh không kéo giãn thì không có `nine`. */
export const manifestEntry = (p) => ({ key: p.key, iso: true, ...(p.nine ? { nine: p.nine } : {}) });

const eol = (o) => JSON.stringify(o, null, 2) + "\n";

/**
 * Thay các mục `ui2_*` trong manifest ảnh bằng `entries` (mỗi mục một dòng), mọi mục khác giữ nguyên từng byte: manifest có chỗ viết gọn
 * bằng tay, ghi lại bằng JSON.stringify sẽ xếp lại cả tệp. Bỏ các dòng ui2 cũ, nối mục mới trước dấu đóng mảng.
 */
export function spliceManifest(text, entries) {
  const nl = text.includes("\r\n") ? "\r\n" : "\n"; // Git trên Windows (autocrlf) checkout CRLF: giữ đúng kiểu xuống dòng của tệp
  const lines = text.replaceAll("\r\n", "\n").split("\n").filter((l) => !/^\s*\{ "key": "ui2_[a-z0-9_]+",.*\},?$/.test(l));
  const end = lines.lastIndexOf("  ]");
  if (end < 1) throw new Error("manifest.json: không thấy dấu đóng mảng sprites");
  const one = (e) => "    { " + Object.entries(e).map(([k, v]) => `"${k}": ${JSON.stringify(v).replace(/([,:])(?=[^ ])/g, "$1 ")}`).join(", ") + " }";
  const rows = entries.map((e, i) => one(e) + (i < entries.length - 1 ? "," : ""));
  const prev = lines[end - 1].trimEnd().replace(/,$/, "");
  lines[end - 1] = rows.length ? prev + "," : prev;
  lines.splice(end, 0, ...rows);
  return lines.join(nl);
}

function main() {
  const check = process.argv.includes("--check");
  const { kit, files } = cutPlan();
  const next = spliceManifest(readFileSync(MANIFEST, "utf8"), kit.pieces.map(manifestEntry));
  const diff = [];
  for (const [f, buf] of files) { const dst = path.join(OUT, f); if (!existsSync(dst) || !readFileSync(dst).equals(buf)) diff.push(f); }
  for (const sub of ["2x", "1x"]) if (existsSync(path.join(OUT, sub))) for (const f of readdirSync(path.join(OUT, sub))) if (!files.has(`${sub}/${f}`)) diff.push(`${sub}/${f} (thừa)`);
  if (next !== readFileSync(MANIFEST, "utf8")) diff.push("sprites/manifest.json");
  if (eol(kit) !== readFileSync(KIT_JSON, "utf8").replaceAll("\r\n", "\n")) diff.push(`${KIT_DIR}/ui-kit.json`);
  if (check) {
    if (diff.length) { console.error(`[ui:import] lệch ${diff.length} mục (chạy npm run ui:import): ${diff.slice(0, 8).join(", ")}`); process.exit(1); }
    console.log(`[ui:import] ${kit.pieces.length} mảnh khớp kết quả cắt`);
    return;
  }
  rmSync(OUT, { recursive: true, force: true });
  for (const sub of ["2x", "1x"]) mkdirSync(path.join(OUT, sub), { recursive: true });
  for (const [f, buf] of files) writeFileSync(path.join(OUT, f), buf);
  writeFileSync(MANIFEST, next);
  saveKit(kit, KIT_JSON);
  const b = budgetOf(kit);
  console.log(`[ui:import] ${kit.pieces.length} mảnh → shared/assets/sprites/iso/ui2, manifest + ui-kit.json đã ghi`);
  for (const [g, t] of Object.entries(b.groups)) if (t.count) console.log(`  ${g}: ${t.count} mảnh · 2× ${(t.x2 / 1000).toFixed(1)} KB · 1× ${(t.x1 / 1000).toFixed(1)} KB · ngân sách ${(t.limit / 1000).toFixed(1)} KB`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(e.message); process.exit(2); }
}
