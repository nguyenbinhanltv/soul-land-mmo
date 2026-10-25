// Ghép phụ thể nhiều nhóm neo (tay, đầu, lưng, chân) thành MỘT cặp sheet `vh_<id>_b` / `_f` (pack chỉ nhận một --attach mỗi lần chạy,
// nên mỗi nhóm chạy riêng rồi chồng các sheet lại). Đầu vào: art/src/vh_nho/<id>/spec.json (do vohon-chi-tiet.mjs ghi):
//   { "base": ["../../pixellab/vh_iso/x.json"],   // mô tả vohon-part có sẵn (có "attach" riêng), chạy như một nhóm
//     "groups": { "<tên nhóm>": { "attach": "hand|head|back|feet", "dirs": { … } } } }   // mỗi nhóm = một mô tả vohon-part
//   node tools/assets/vohon-multi.mjs build <id…> [--body <thư mục thân mẫu LPC>] [--tmp <thư mục>]
// Thân mẫu (m_0 / f_0, ba lớp body / outfit / hair) mặc định dựng bằng lpc-mannequin.mjs, tức đúng lớp thân LPC mà client ghép.
// Mỗi nhóm: vohon-part → normalize --kind vohon --foot 74 → pack --kind vohon --attach <neo>; cuối cùng chồng các nhóm (nhóm sau đè
// nhóm trước, mỗi nửa b / f riêng) rồi chạy normal.mjs.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, unlinkSync } from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { readPng, encodePng, Img, ROOT } from "./lib.mjs";

const [cmd, ...rest] = process.argv.slice(2);
const opt = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest.splice(i, 2)[1] : ""; };
const tmp = opt("--tmp") || mkdtempSync(path.join(os.tmpdir(), "vohon-multi-"));
let body = opt("--body");
if (cmd !== "build" || !rest.length) { console.error("Cách dùng: vohon-multi.mjs build <id…> [--body <thư mục>] [--tmp <thư mục>]"); process.exit(1); }
const node = (...a) => execFileSync(process.execPath, a, { cwd: ROOT, stdio: "inherit" });
if (!body) { body = path.join(tmp, "man"); node("tools/assets/lpc-mannequin.mjs", "--out", body); }
const SEXES = ["m", "f"], bp = (s) => ["body", "outfit", "hair"].map((l) => path.join(body, `${l}_${s}_0.png`)).join(",");
const bodyArgs = SEXES.flatMap((s) => ["--body", `${s}:${bp(s)}`]);
const SRC = path.join(ROOT, "art/src/vh_nho"), DST = path.join(ROOT, "shared/assets/sprites/vohon");

for (const id of rest) {
  const specFile = path.join(SRC, id, "spec.json"), S = JSON.parse(readFileSync(specFile, "utf8"));
  const jobs = [...(S.base ?? []).map((b, i) => ({ name: `base${i}`, file: path.resolve(path.dirname(specFile), b) }))];
  for (const [name, g] of Object.entries(S.groups ?? {})) { const f = path.join(path.dirname(specFile), `.${name}.tmp.json`); writeFileSync(f, JSON.stringify(g)); jobs.push({ name, file: f }); }
  const outB = [], outF = [];
  for (const { name, file } of jobs) {
    const raw = path.join(tmp, id, name, "raw"), part = path.join(tmp, id, name, "part"), sheet = path.join(tmp, id, name, "sheet");
    const attach = JSON.parse(readFileSync(file, "utf8")).attach;
    node("tools/assets/vohon-part.mjs", file, ...bodyArgs, "--out", raw);
    for (const s of SEXES) {
      const files = ["s", "se", "e", "ne", "n"].flatMap((d) => ["b", "f"].map((h) => path.join(raw, s, `${d}_${h}.png`))).filter(existsSync);
      if (files.length) node("tools/assets/normalize.mjs", "--kind", "vohon", "--vohon", id, "--gray", "none", "--foot", "74", "--out", path.join(part, s), ...files);
      const grip = path.join(raw, s, "grip.json");
      if (existsSync(grip)) { mkdirSync(path.join(part, s), { recursive: true }); writeFileSync(path.join(part, s, "grip.json"), readFileSync(grip)); }
    }
    node("tools/assets/pack.mjs", "--kind", "vohon", "--id", id, "--part", part, ...bodyArgs, "--attach", attach, "--out", sheet);
    if (file.endsWith(".tmp.json")) unlinkSync(file);
    outB.push(readPng(path.join(sheet, `${id}_b.png`))); outF.push(readPng(path.join(sheet, `${id}_f.png`)));
  }
  mkdirSync(DST, { recursive: true });
  for (const [h, list] of [["b", outB], ["f", outF]]) {
    const o = new Img(list[0].w, list[0].h);
    for (const im of list) o.blit(im, 0, 0, im.w, im.h, 0, 0, true);
    writeFileSync(path.join(DST, `${id}_${h}.png`), encodePng(o));
  }
  node("tools/assets/normal.mjs", path.join(DST, `${id}_b.png`), path.join(DST, `${id}_f.png`));
  console.log(`[vohon-multi] ${id}: ${jobs.length} nhóm → ${path.relative(ROOT, DST)}`);
}
