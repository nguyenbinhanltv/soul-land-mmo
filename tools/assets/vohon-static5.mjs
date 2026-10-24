// Ghép phụ thể võ hồn vẽ tĩnh 5 hướng (art/src/gemini/phuthe_5huong/<id>/{s,se,e,ne,n}.png, 96×96 đã đặt quanh thân khung đứng)
// vào sheet `vh_<id>_b` / `_f` cho cả hai giới, qua vohon-part → normalize → pack → normal.
//   node tools/assets/vohon-static5.mjs spec <id…>   ghi art/src/gemini/vh_iso/<id>.json (mô tả vohon-part)
//   node tools/assets/vohon-static5.mjs build <id…> [--tmp <thư mục>]   chạy cả dây chuyền, ghi shared/assets/sprites/vohon/<id>_{b,f}[_n].png
//
// Ảnh nguồn vẽ quanh ma-nơ-canh nên đặt NGUYÊN VỊ TRÍ ở khung đứng: pivot của mỗi giới là điểm neo của thân mẫu ở khung đứng,
// off [0, 0]; pack dời theo điểm neo từng khung thân (idle / walk / attack / cast). Nửa sau / trước theo hướng: LAYERS bên dưới.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, ISO_DIRS, ISO_VH_FRAME, ISO_HS_FRAME, isoLayout, frameAnchors } from "./lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "art/src/gemini/phuthe_5huong"), SPEC = path.join(ROOT, "art/src/gemini/vh_iso"), B = path.join(ROOT, "shared/assets/sprites/honsu");
const SEXES = ["m", "f"];

// attach: điểm neo của thân; layer: nửa sheet theo hướng (b sau thân, f trước thân, { split: y } cắt ở dòng y của khung 96).
// Quay mặt ra người xem (s, se, e) cánh / hoa / chân nhện / hư ảnh ở sau lưng → b; quay lưng (ne, n) cánh ở nửa trước; đồ ở đầu, tay, vai luôn trước.
const BACK = { s: "b", se: "b", e: "b", ne: "f", n: "f" }, FRONT = { s: "f", se: "f", e: "f", ne: "f", n: "f" };
const LAYERS = {
  lam_dien_ba_vuong_long: BACK, ky_nhung_thong_thien_cuc: BACK, ta_hoa_phuong_hoang: BACK, kim_vu_mieu_ung: BACK, tu_vong_chu_hoang: BACK,
  hoa_anh: BACK, quy_mi: BACK, bang_phuong_hoang: BACK, a_ngan: BACK, yeu_ho: BACK,
  nhu_cot_tho: FRONT, bich_lan_xa_hoang: FRONT, bach_ho: FRONT,
};
const OVERRIDE = JSON.parse(existsSync(path.join(SPEC, "layers.json")) ? readFileSync(path.join(SPEC, "layers.json"), "utf8") : "{}");

const [cmd, ...rest] = process.argv.slice(2);
const ti = rest.indexOf("--tmp"), tmp = ti >= 0 ? rest.splice(ti, 2)[1] : path.join(ROOT, ".tmp-vohon5");
const ids = rest.length ? rest : Object.keys(LAYERS);
const bodyPath = (s) => ["body", "outfit", "hair"].map((l) => path.join(B, `${l}_${s}_0.png`));
const node = (...a) => execFileSync(process.execPath, a, { cwd: ROOT, stdio: "inherit" });

function anchors() {
  const HL = isoLayout("honsu"), [BW, BH] = HL.frame, out = {};
  for (const s of SEXES) {
    const [body, outfit, hair] = bodyPath(s).map((f) => readPng(f));
    const merged = new body.constructor(body.w, body.h);
    for (const l of [body, outfit, hair]) merged.blit(l, 0, 0, l.w, l.h, 0, 0, true);
    out[s] = ISO_DIRS.map((d, r) => frameAnchors(merged, HL.anims.idle[0] * BW, r * BH, BW, BH, body));
  }
  return out;
}

if (cmd === "spec") {
  const A = anchors(), off = (ISO_VH_FRAME - ISO_HS_FRAME) / 2;
  mkdirSync(SPEC, { recursive: true });
  for (const id of ids) {
    const lay = { ...LAYERS[id], ...OVERRIDE[id] }, dirs = {};
    ISO_DIRS.forEach((d, r) => {
      const pv = (s) => [Math.round(A[s][r].back.x + off), Math.round(A[s][r].back.y + off)];
      dirs[d] = [{ img: `../phuthe_5huong/${id}/${d}.png`, pivot: pv("m"), off: [0, 0], layer: lay[d], f: { pivot: pv("f") } }];
    });
    const rows = ISO_DIRS.map((d) => `  ${JSON.stringify(d)}: ${JSON.stringify(dirs[d])}`).join(",\n");
    writeFileSync(path.join(SPEC, `${id}.json`), `{\n "attach": "back",\n "dirs": {\n${rows}\n }\n}\n`);
    console.log(`[vohon-static5] ${id}.json`);
  }
} else if (cmd === "build") {
  const body = (s) => `${s}:${bodyPath(s).join(",")}`;
  for (const id of ids) {
    const raw = path.join(tmp, id, "raw"), part = path.join(tmp, id, "part");
    node("tools/assets/vohon-part.mjs", path.join(SPEC, `${id}.json`), ...SEXES.flatMap((s) => ["--body", body(s)]), "--out", raw);
    for (const s of SEXES) {
      const files = ["s", "se", "e", "ne", "n"].flatMap((d) => ["b", "f"].map((h) => path.join(raw, s, `${d}_${h}.png`))).filter(existsSync);
      node("tools/assets/normalize.mjs", "--kind", "vohon", "--vohon", id, "--gray", "none", "--foot", "74", "--out", path.join(part, s), ...files);
    }
    node("tools/assets/pack.mjs", "--kind", "vohon", "--id", id, "--part", part, ...SEXES.flatMap((s) => ["--body", body(s)]), "--attach", "back");
    const sp = (h) => `shared/assets/sprites/vohon/${id}_${h}.png`;
    node("tools/assets/normal.mjs", sp("b"), sp("f"));
  }
} else { console.error("Cách dùng: vohon-static5.mjs spec|build [id…] [--tmp <thư mục>]"); process.exit(1); }
