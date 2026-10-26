// Sinh NGUON.md và dòng `LỖI:` cho tờ hoạt ảnh hồn thú (#865, theo dõi #861): công cụ viết, người nộp không viết tay.
//   node tools/assets/beast-nguon.mjs --species quy_ho [--dir <thư mục tờ>] [--out <file> | --write] [--force]
//        [--tool image_gen.imagegen] [--model "<tên>"] [--seed <số>] [--attempts toA=2,toB=1] [--agent "<phiên>"]
//        [--eye "toB=hướng — N H7 C2–4 — lộ mặt"]... [--eye-ok toA,toB] [--issue 767]
// Nội dung: mỗi tờ có cỡ thật (IHDR), số byte, SHA256, prompt đi kèm (`toX.prompt.txt`: hash, có / không), nguồn sinh (model, seed, số lượt:
// lấy từ cờ, hoặc `toX.source.json` nếu có, không thì ghi `unknown`: công cụ sinh ảnh không công bố model / seed thì KHÔNG đoán), mức kiểm
// và dòng `LỖI:` do `beast-sheet-check` sinh. Mục xem bằng mắt (`n` / `ne` lộ mặt, hurt, die) khai bằng `--eye` (thành dòng `LỖI: … (mắt)`)
// hoặc `--eye-ok` (đã xem, không lỗi); tờ chưa khai thì NGUON ghi rõ "chưa duyệt bằng mắt". Mặc định in ra màn hình; `--write` ghi
// art/src/beast-anim/<loài>/NGUON.md và từ chối ghi đè file có sẵn (trừ `--force`); `--out <file>` ghi đúng file chỉ định (ghi đè, dùng để sinh bản thử).
// `turnaround.png` (nếu có) cũng được ghi (cỡ, byte, SHA256, `turnaround.prompt.txt` / `turnaround.source.json`, `--eye turnaround=…`), kể cả khi loài
// chưa có tờ toA..toE; mức kiểm cỡ / nền / lưới lấy từ checkSpecies (r.turnaround). Chỉ đọc RAW, không sửa ảnh.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT } from "./lib.mjs";
import { speciesInfo } from "./beast-sheet-lib.mjs";
import { checkSpecies, draftErrorLine, bodyNotes, poseHints } from "./beast-sheet-check.mjs";

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const UNKNOWN = "unknown (công cụ sinh ảnh không công bố)";

/** Nguồn sinh một tờ từ `toX.source.json` (cấu trúc cũ: `upstream_tool_provenance` hoặc trường ngang hàng); trường thiếu → null. */
export function readSourceJson(file) {
  if (!existsSync(file)) return null;
  const j = JSON.parse(readFileSync(file, "utf8")), p = j.upstream_tool_provenance ?? j;
  const pick = (...keys) => {
    const v = keys.map((k) => p[k]).find((x) => x !== undefined && x !== null && x !== "");
    return v === undefined || /^unknown/i.test(String(v)) ? null : String(v);
  };
  return { tool: pick("tool"), model: pick("imageModel", "model"), seed: pick("seed"), attempts: pick("builtinCalls", "attempts") };
}

/** Chuỗi `--attempts toA=2,toB=1` → { toA: "2", … }. */
const parseKv = (s) => Object.fromEntries((s ?? "").split(",").filter(Boolean).map((p) => p.split("=")));

/** Dựng NGUON.md (chuỗi) từ kết quả kiểm + khai báo. `o`: { tool, model, seed, attempts, agent, eye: [{sheet, text}], eyeOk: Set, issue }. */
export function buildNguon(id, r, o = {}) {
  const dir = o.dir ?? path.join(ROOT, "art", "src", "beast-anim", id);
  const info = speciesInfo(id), attempts = parseKv(o.attempts), eyeOk = new Set(o.eyeOk ?? []);
  const eye = o.eye ?? [];
  const L = [`# ${info.name} — RAW hoạt ảnh${o.issue ? ` (#${o.issue})` : ""}`, "",
    `File này **tự sinh** bằng \`node tools/assets/beast-nguon.mjs --species ${id}\`; không sửa tay (sửa khai báo rồi sinh lại). Dòng \`LỖI:\` đến từ \`beast-sheet-check.mjs\` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo \`--eye\` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng \`Ghi chú kỹ thuật\` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.`, "",
    `Loài \`${id}\` (${info.name}), họ \`${info.family}\`, khung game ${info.frame}×${info.frame}. Mức kiểm chung: **${r.level}**.`, ""];
  const errors = [];
  // turnaround.png (ảnh mẫu hướng, không cắt) nằm ở r.turnaround (#972): kiểm cỡ / nền / lưới như tờ khác, không có khối hướng; mục xem bằng mắt qua --eye turnaround=…
  const items = [...(r.turnaround ? [r.turnaround] : []), ...r.sheets].map((s) => ({ name: s.sheet, file: s.file, size: s.size, level: s.sheet === "turnaround" ? `**${s.level}** (ảnh mẫu 5 hướng, không có khối hướng)` : `**${s.level}** (khối hướng: ${(s.dirs ?? []).map((d) => `${d} ${r.blockLevel[d] ?? "?"}`).join(", ") || "?"})`, auto: draftErrorLine(s), body: bodyNotes(s), pose: poseHints(s) }));
  for (const s of items) {
    const buf = readFileSync(s.file), src = readSourceJson(path.join(path.dirname(s.file), `${s.name}.source.json`)) ?? {};
    const promptFile = path.join(path.dirname(s.file), `${s.name}.prompt.txt`), prompt = existsSync(promptFile) ? `\`${s.name}.prompt.txt\` (SHA256 \`${sha(readFileSync(promptFile))}\`)` : "không có file prompt (không biết prompt thật đã gửi)";
    const val = (flag, fromSrc) => flag ?? fromSrc ?? UNKNOWN;
    L.push(`## ${s.name}`, "",
      `- File: \`${s.name}.png\`, **${s.size.join("×")}**, ${buf.length} byte, SHA256 \`${sha(buf)}\`.`,
      `- Công cụ: ${val(o.tool, src.tool)}; model: ${val(o.model, src.model)}; seed: ${val(o.seed, src.seed)}; số lượt: ${attempts[s.name] ?? src.attempts ?? "chưa khai báo"}${o.agent ? `; phiên: ${o.agent}` : ""}.`,
      `- Prompt: ${prompt}.`,
      `- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.`,
      `- Mức kiểm: ${s.level}.`,
      ...s.body.map((b) => `- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): ${b}`));
    const mine = eye.filter((e) => e.sheet === s.name);
    if (s.auto) errors.push(s.auto);
    // nghi tư thế (#1080: die nằm ngang / hurt ngửa bụng, mức nhẹ): chỉ gợi ý ra stderr, KHÔNG ghi `LỖI:`; người xem ảnh liên hệ rồi tự khai --eye / --eye-ok
    if (s.pose.length && !mine.length && !eyeOk.has(s.name)) console.error(`Gợi ý (${s.name}, chưa phải lỗi; xem tờ liên hệ rồi mới khai): ${s.pose.join(" ")}`);
    for (const e of mine) errors.push(`LỖI: ${s.name} — ${e.text} (mắt)`);
    L.push(mine.length || eyeOk.has(s.name) ? `- Duyệt bằng mắt: ${mine.length ? `${mine.length} mục lỗi (dòng \`LỖI:\` bên dưới)` : "đã xem, không thấy lỗi"}.` : "- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).", "");
  }
  L.push("## Lỗi", "");
  if (errors.length) L.push("```text", ...errors, "```"); else L.push("Không có dòng `LỖI:`.");
  L.push("");
  // Bảng ghi công của loài (#973): `tools/assets/credits.mjs` gom vào màn Ghi công; thay cho việc nối dòng vào art/CREDITS.md (PR song song xung đột)
  // Sinh lại (--write --force) giữ nguyên mục `## Ghi công` đã có (người nộp / công cụ chuyển từ CREDITS.md): chỉ loài chưa có mới sinh dòng mặc định
  const old = existsSync(path.join(dir, "NGUON.md")) ? /^## Ghi công\n[\s\S]*?(?=^## |(?![\s\S]))/m.exec(readFileSync(path.join(dir, "NGUON.md"), "utf8"))?.[0] : null;
  if (old) { L.push(old.trimEnd(), ""); return L.join("\n"); }
  const srcTool = (items.map((s) => readSourceJson(path.join(path.dirname(s.file), `${s.name}.source.json`))?.tool).find(Boolean)) ?? UNKNOWN;
  L.push("## Ghi công", "", "Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.", "",
    "| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |", "|---|---|---|---|---|---|",
    `| \`art/src/beast-anim/${id}/\` | - | ${o.tool ?? srcTool} | RAW hoạt ảnh ${info.name}: ${items.map((s) => `${s.name} ${s.size.join("×")}`).join(", ")}; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |`, "");
  return L.join("\n");
}

function parseArgs(argv) {
  const o = { eye: [], eyeOk: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], next = () => argv[++i];
    if (a === "--species") o.species = next();
    else if (a === "--dir") o.dir = next();
    else if (a === "--out") o.out = next();
    else if (a === "--write") o.write = true;
    else if (a === "--force") o.force = true;
    else if (a === "--tool") o.tool = next();
    else if (a === "--model") o.model = next();
    else if (a === "--seed") o.seed = next();
    else if (a === "--attempts") o.attempts = next();
    else if (a === "--agent") o.agent = next();
    else if (a === "--issue") o.issue = next();
    else if (a === "--eye") { const v = next(), k = v.indexOf("="); if (k < 0) throw new Error("--eye cần dạng toA=<loại> — <vị trí> — <ghi chú>"); o.eye.push({ sheet: v.slice(0, k), text: v.slice(k + 1) }); }
    else if (a === "--eye-ok") o.eyeOk.push(...next().split(","));
    else throw new Error(`tùy chọn lạ: ${a}`);
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (!o.species) { console.error("Dùng: node tools/assets/beast-nguon.mjs --species <loài> [--dir <thư mục>] [--out <file> | --write [--force]] [--tool T] [--model M] [--seed S] [--attempts toA=2] [--agent X] [--eye 'toB=loại — vị trí — ghi chú'] [--eye-ok toA,toB] [--issue N]"); process.exit(2); }
    const dir = o.dir ?? path.join(ROOT, "art", "src", "beast-anim", o.species);
    const r = checkSpecies(o.species, { dir }); // ném "không có tờ" khi chưa có cả tờ lẫn turnaround
    const md = buildNguon(o.species, r, { ...o, dir });
    const target = o.out ?? (o.write ? path.join(dir, "NGUON.md") : null);
    if (!target) console.log(md);
    else if (existsSync(target) && !o.force && !o.out) { console.error(`${target} đã có: thêm --force để ghi đè hoặc --out <file> để ghi chỗ khác`); process.exit(1); }
    else { writeFileSync(target, md); console.log(`ghi ${target}`); }
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
