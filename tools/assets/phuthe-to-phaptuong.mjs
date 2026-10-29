// Đóng gói phụ thể cũ thành pháp tướng (#1306, epic #1020): vh_<id>_b/_f (và clip vhanim_<id>_b/_f nếu có) → sheet pt_<id> (khung 160, 16 cột = 8 thở + 8 đánh,
// hàng = hướng s, se, e, ne, n; phóng nguyên giữ lưới pixel: ×2 nếu lọt khung 160, không thì ×1). Võ hồn chỉ có ảnh tĩnh thì thở / đánh nội suy bằng code tất định.
//   node tools/assets/phuthe-to-phaptuong.mjs --id <mã võ hồn> [--out <file.png>] [--preview <file.png>] [--fill <điểm lấp chỗ rỗng hình người, mặc định 0>] [--scale 1|2] [--tinh]
//   node tools/assets/phuthe-to-phaptuong.mjs --all --duyet-mau      (25 võ hồn: chỉ chạy sau khi chủ repo duyệt 3 mẫu, mặc định từ chối)
// Quyết định chủ repo 2026-10-29 (epic #1020): phụ thể v2 là vũ khí cầm tay; phụ thể CŨ thành pháp tướng bay sau lưng, chỉ hiện khi Chân Thân.
// Nguồn: ưu tiên `vohonanim/<id>_{b,f}.png` (clip vẽ thật, cột / khung theo `anim` ở manifest), không có thì `vohon/<id>_{b,f}.png` (tĩnh, khung đứng cột 0);
// hàng thân nam (0..4 = s, se, e, ne, n). `--tinh` ép dùng ảnh tĩnh. Lớp: nửa sau và nửa trước ghép thành một lớp (luật lớp theo hướng do client:
// s / se / e sau thân, ne / n trước thân mờ PT_FRONT_ALPHA). Cách ghép (scale / dx / dy) ở PHAP_TUONG của shared/data.ts, không ở sheet.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, SPRITES, MANIFEST, Img, readPng, encodePng, ISO_DIRS, PT_FRAME } from "./lib.mjs";
import { SAMPLES, buildSheet, cell } from "./phuthe-to-phaptuong-lib.mjs";

const { PHAP_TUONG, VOHON } = await import("../../shared/data.ts");
const fail = (m) => { console.error(`[phuthe-to-phaptuong] ${m}`); process.exit(1); };

/** Đọc nguồn một võ hồn: { F, anim, dirs: { <hướng>: { idle: [{ back, front }], attack: [...] } } } hoặc null nếu không có ảnh nào. */
export function loadSource(id, { manifest, forceStatic = false, sprites = SPRITES } = {}) {
  const entries = new Map(manifest.sprites.filter((e) => typeof e !== "string").map((e) => [e.key, e]));
  const half = (dir, k) => { const f = path.join(sprites, dir, `${id}_${k}.png`); return existsSync(f) ? readPng(f) : null; };
  const ea = entries.get(`vhanim_${id}_b`), ef = entries.get(`vhanim_${id}_f`);
  const clips = (ea ?? ef)?.anim?.clips, F = (ea ?? ef)?.frame?.[0];
  const aB = ea?.blank ? null : half("vohonanim", "b"), aF = ef?.blank ? null : half("vohonanim", "f");
  const useAnim = !forceStatic && !!clips?.idle && !!clips?.attack && (aB || aF);
  const slice = (b, f, c0, n, row, size) => Array.from({ length: n }, (_, i) => ({ back: b && cell(b, size, c0 + i, row), front: f && cell(f, size, c0 + i, row) }));
  if (useAnim) {
    const dirs = {};
    ISO_DIRS.forEach((d, row) => { dirs[d] = { idle: slice(aB, aF, clips.idle.col, clips.idle.n, row, F), attack: slice(aB, aF, clips.attack.col, clips.attack.n, row, F) }; });
    return { F, anim: true, dirs };
  }
  const sB = half("vohon", "b"), sF = half("vohon", "f");
  if (!sB && !sF) return null;
  const dirs = {};
  ISO_DIRS.forEach((d, row) => { dirs[d] = { idle: slice(sB, sF, 0, 1, row, 96), attack: [] }; });
  return { F: 96, anim: false, dirs };
}

/** Xem trước: nền tối, 5 hàng × (4 khung thở + 4 khung đánh cách quãng), phóng ×1. */
export function previewOf(sheet) {
  const cols = [0, 2, 4, 6, 8, 10, 12, 14], pv = new Img(PT_FRAME * cols.length, sheet.h);
  for (let i = 0; i < pv.data.length; i += 4) { pv.data[i] = 58; pv.data[i + 1] = 62; pv.data[i + 2] = 74; pv.data[i + 3] = 255; }
  cols.forEach((c, k) => { for (let y = 0; y < sheet.h; y++) for (let x = 0; x < PT_FRAME; x++) { const p = sheet.get(c * PT_FRAME + x, y); if (p[3]) pv.set(k * PT_FRAME + x, y, p); } });
  return pv;
}

export function convert(id, opt = {}) {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  if (!VOHON.some((v) => v.id === id)) throw new Error(`không có võ hồn "${id}" trong VOHON`);
  const src = loadSource(id, { manifest, forceStatic: opt.forceStatic });
  if (!src) throw new Error(`${id}: không có ảnh phụ thể cũ (vohon/${id}_b|f.png, vohonanim/${id}_b|f.png)`);
  const group = PHAP_TUONG[id]?.group ?? "B";
  return { ...buildSheet(src, { group, fill: opt.fill, scale: opt.scale }), src, group };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  const args = process.argv.slice(2);
  const flag = (n) => { const i = args.indexOf(n); if (i >= 0) args.splice(i, 1); return i >= 0; };
  const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
  const all = flag("--all"), approved = flag("--duyet-mau"), forceStatic = flag("--tinh");
  const id = opt("--id", ""), outOpt = opt("--out", ""), previewOut = opt("--preview", ""), fillOpt = opt("--fill", ""), scaleOpt = opt("--scale", "");
  if (all && !approved) fail(`--all chỉ chạy sau khi chủ repo duyệt 3 mẫu (${SAMPLES.join(", ")}); đã duyệt thì thêm --duyet-mau`);
  if (!all && !id) fail("Cách dùng: phuthe-to-phaptuong.mjs --id <mã võ hồn> [--out <file.png>] [--preview <file.png>] [--fill <điểm>] [--tinh]");
  if (all && (outOpt || previewOut)) fail("--all ghi đúng chỗ mặc định (shared/assets/sprites/phaptuong/<id>.png), không nhận --out / --preview");
  let bad = 0;
  for (const v of all ? VOHON.map((x) => x.id) : [id]) {
    let r;
    try { r = convert(v, { forceStatic, fill: fillOpt === "" ? undefined : +fillOpt, scale: scaleOpt === "" ? undefined : +scaleOpt }); } catch (e) { if (all) { console.warn(`[phuthe-to-phaptuong] bỏ ${v}: ${e.message}`); continue; } fail(e.message); }
    const out = outOpt || path.join(SPRITES, "phaptuong", `${v}.png`);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, encodePng(r.sheet));
    if (previewOut) writeFileSync(previewOut, encodePng(previewOf(r.sheet)));
    console.log(`[phuthe-to-phaptuong] ${v}: ${path.relative(ROOT, out)} (${r.sheet.w}×${r.sheet.h}, ${r.colors} màu, nguồn ${r.src.anim ? `vhanim khung ${r.src.F}` : "tĩnh vh_"}, phóng ×${r.scale}, nhóm ${r.group}${r.clipped ? `, ⚠ cắt ${r.clipped} điểm ngoài khung 160` : ""})`);
    if (r.clipped) bad++;
  }
  if (bad) console.warn(`[phuthe-to-phaptuong] ${bad} võ hồn bị cắt khỏi khung 160: chỉnh --scale / --fill hoặc xem docs/art/phap-tuong.md mục "Đóng gói từ phụ thể cũ"`);
}
