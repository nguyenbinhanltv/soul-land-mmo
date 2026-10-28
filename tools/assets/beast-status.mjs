// Sổ trạng thái hoạt ảnh hồn thú, tự sinh (#865, theo dõi #861; thay bảng tay ở #766).
//   npm run beast:status                      ghi art/src/beast-anim/_status.json + _status.md cho mọi loài (file cục bộ, .gitignore, KHÔNG commit: #973)
//   npm run beast:status -- --out <thư mục>   ghi chỗ khác (workflow beast-status.yml dùng để dựng comment ghim ở #766)
// Bản chung của cả đội là comment có dấu `<!-- beast-status -->` ở issue #766, do workflow beast-status.yml sửa sau mỗi lần main đổi art/src/beast-anim/**.
// Mỗi tờ: tên file, cỡ (IHDR), số byte, SHA256, mức kiểm (pass / nhẹ / chặn) và số mục chặn / nhẹ / lưu ý; mỗi loài: mức theo khối hướng
// (s, se, e, ne, n), bố cục (sheet / direction), tờ còn thiếu, có turnaround chưa, đã nhập vào game chưa (manifest `beast_<loài>_anim`) và
// dòng `LỖI:` do công cụ kiểm sinh. Kết quả chỉ phụ thuộc file trong repo (không giờ, không đường dẫn máy) nên so được giữa các máy.
// Không thay mắt người: `n` / `ne` lộ mặt, hurt ngửa bụng, die xoay không có trong sổ (xem docs/art/hon-thu-hoat-anh.md).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, MANIFEST } from "./lib.mjs";
import { DIRS, sheetPlan, mixedPlan, speciesInfo } from "./beast-sheet-lib.mjs";
import { checkSpecies, draftErrorLine } from "./beast-sheet-check.mjs";

export const ANIM_ROOT = path.join(ROOT, "art", "src", "beast-anim");
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const count = (s, sev) => s.issues.filter((i) => i.sev === sev).length;

/** Tên các loài có thư mục trong art/src/beast-anim (có hoặc chưa có tờ), theo thứ tự chữ cái. */
export function speciesDirs(root = ANIM_ROOT) {
  return readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

/** Trạng thái một loài: tờ, khối hướng, thiếu, nhập game, dòng LỖI. */
export function speciesStatus(id, { root = ANIM_ROOT, imported = importedSet() } = {}) {
  const dir = path.join(root, id), info = speciesInfo(id);
  const hasSheets = ["A", "B", "C", "D", "E"].some((l) => existsSync(path.join(dir, `to${l}.png`)));
  const out = { id, name: info.name, family: info.family, frame: info.frame, imported: imported.has(id), turnaround: existsSync(path.join(dir, "turnaround.png")) };
  if (!hasSheets) return { ...out, layout: null, state: "chua-co-to", sheets: [], blocks: {}, missing: [], errorLines: [] };
  const r = checkSpecies(id, { dir });
  // `direction` chỉ khi loài khung ≤ 96 nộp tờ 3:2 (v2); khung lớn vốn đã mỗi hướng một tờ (sheetPlan auto) nên vẫn gọi `sheet`
  // Trộn theo hướng (#861): tờ 3:2 override hướng của tờ legacy; bố cục báo `hon-hop`, thiếu tính theo hướng chưa ai phủ
  const kinds = r.sheets.map((s) => s.kind === "boss");
  const layout = info.frame <= 96 && kinds.length && kinds.every(Boolean) ? "direction" : info.frame <= 96 && kinds.some(Boolean) ? "hon-hop" : "sheet";
  const plan = layout === "sheet" ? sheetPlan(info.frame, "auto") : layout === "direction" ? sheetPlan(info.frame, "direction") : mixedPlan(info.frame, Object.fromEntries(r.sheets.map((s) => [s.sheet.replace(/^to/, ""), { w: s.size[0], h: s.size[1] }]))), have = new Set(r.sheets.map((s) => s.sheet.replace(/^to/, "")));
  const missing = plan.filter((p) => p.absent || !have.has(p.id)).map((p) => `to${p.id}`);
  const blocks = Object.fromEntries(DIRS.map((d) => [d, r.blockLevel[d] ?? "thiếu"]));
  const levels = Object.values(blocks);
  const state = levels.includes("chặn") ? "chan" : levels.includes("thiếu") ? "thieu-to" : "san-sang-nhap";
  const sheets = r.sheets.map((s) => ({
    sheet: s.sheet, file: `art/src/beast-anim/${id}/${s.sheet}.png`, size: s.size, bytes: readFileSync(s.file).length, sha256: sha256(s.file),
    level: s.level, block: count(s, "block"), light: count(s, "light"), note: count(s, "note"),
  }));
  const errorLines = r.sheets.map(draftErrorLine).filter(Boolean);
  return { ...out, layout, state, sheets, blocks, missing, errorLines };
}

/** Loài đã nhập vào game: manifest có `beast_<loài>_anim`. */
export function importedSet() {
  return new Set(JSON.parse(readFileSync(MANIFEST, "utf8")).sprites.map((e) => /^beast_(.+)_anim$/.exec(e.key)?.[1]).filter(Boolean));
}

/** Sổ cho mọi loài (hoặc `only`). */
export function buildStatus({ root = ANIM_ROOT, only } = {}) {
  const imported = importedSet(), ids = only ?? speciesDirs(root);
  const species = ids.map((id) => speciesStatus(id, { root, imported }));
  const tally = {};
  for (const s of species) tally[s.state] = (tally[s.state] ?? 0) + 1;
  return { schema: 1, generatedBy: "tools/assets/beast-status.mjs", species: species.length, imported: species.filter((s) => s.imported).length, tally, items: species };
}

const STATE_VI = { "san-sang-nhap": "sẵn sàng nhập", chan: "có khối chặn", "thieu-to": "thiếu tờ", "chua-co-to": "chưa có tờ" };
const LEVEL_MARK = { pass: "đạt", "nhẹ": "nhẹ", "chặn": "**chặn**", "thiếu": "thiếu" };

/** Bảng Markdown của sổ. */
export function statusMarkdown(st) {
  const L = ["# Sổ trạng thái hoạt ảnh hồn thú", "",
    "Sổ này **tự sinh** bằng `npm run beast:status` (`tools/assets/beast-status.mjs`; workflow `beast-status.yml` đăng lên comment ghim ở #766 sau mỗi lần `main` đổi `art/src/beast-anim/**`); **không sửa tay**, không commit file sinh ra, không dán bảng tay vào issue. Mức theo khối hướng là kết quả `beast:check` (cỡ, nền, lưới, số hình, chân, khung chết; cỡ thân lệch chỉ là nhẹ, không chặn: quyết định chủ repo 2026-10-26 mục 4); `n` / `ne` lộ mặt, hurt ngửa bụng, die xoay chỉ xem bằng mắt (tờ liên hệ).", "",
    `${st.species} loài có thư mục · ${st.imported} đã nhập vào game · ` + Object.entries(st.tally).map(([k, v]) => `${v} ${STATE_VI[k] ?? k}`).join(" · "), "",
    "| Loài | Mã | Bố cục | Tờ (cỡ, mức) | s | se | e | ne | n | Thiếu | Nhập game | Trạng thái |", "|---|---|---|---|---|---|---|---|---|---|---|---|"];
  for (const s of st.items) {
    const sheets = s.sheets.map((x) => `${x.sheet.replace(/^to/, "")} ${x.size.join("×")} ${LEVEL_MARK[x.level]}`).join("<br>") || "-";
    const cells = DIRS.map((d) => (s.blocks[d] ? LEVEL_MARK[s.blocks[d]] : "-"));
    L.push(`| ${s.name} | \`${s.id}\` | ${s.layout ?? "-"} | ${sheets} | ${cells.join(" | ")} | ${s.missing.join(", ") || "-"} | ${s.imported ? "đã nhập" : "chưa"} | ${STATE_VI[s.state]} |`);
  }
  const bad = st.items.filter((s) => s.errorLines.length);
  L.push("", "## Dòng `LỖI:` do công cụ sinh", "", "Chỉ mục nhẹ và chặn do `beast:check` phát hiện (soát bằng mắt trước khi dán vào NGUON.md bằng `beast-nguon.mjs`).", "");
  for (const s of bad) L.push(`### ${s.name} (\`${s.id}\`)`, "", "```", ...s.errorLines, "```", "");
  if (!bad.length) L.push("Không có.", "");
  return L.join("\n");
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") o.out = argv[++i];
    else if (a === "--species") o.only = argv[++i].split(",");
    else throw new Error(`tùy chọn lạ: ${a}`);
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    const st = buildStatus({ only: o.only }), json = JSON.stringify(st, null, 2) + "\n", md = statusMarkdown(st) + "\n";
    const dir = o.out ?? ANIM_ROOT, fj = path.join(dir, "_status.json"), fm = path.join(dir, "_status.md");
    mkdirSync(dir, { recursive: true });
    writeFileSync(fj, json); writeFileSync(fm, md);
    console.log(`ghi ${fj} và ${fm}: ${st.species} loài, ${st.imported} đã nhập, ` + Object.entries(st.tally).map(([k, v]) => `${v} ${k}`).join(", "));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
