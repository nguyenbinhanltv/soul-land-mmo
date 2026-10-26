// Sổ trạng thái hoạt ảnh hồn thú, tự sinh (#865, theo dõi #861; thay bảng tay ở #766).
//   npm run beast:status                      ghi art/src/beast-anim/_status.json + _status.md cho mọi loài
//   npm run beast:status -- --check           so với file đang có; lệch thì thoát mã 1 (chạy lại lệnh trên để cập nhật)
//   npm run beast:status -- --out <thư mục>   ghi chỗ khác (không đụng repo)
// Mỗi tờ: tên file, cỡ (IHDR), số byte, SHA256, mức kiểm (pass / nhẹ / chặn) và số mục chặn / nhẹ / lưu ý; mỗi loài: mức theo khối hướng
// (s, se, e, ne, n), bố cục (sheet / direction), tờ còn thiếu, có turnaround chưa, đã nhập vào game chưa (manifest `beast_<loài>_anim`) và
// dòng `LỖI:` do công cụ kiểm sinh. Kết quả chỉ phụ thuộc file trong repo (không giờ, không đường dẫn máy) nên so được giữa các máy.
// Không thay mắt người: `n` / `ne` lộ mặt, hurt ngửa bụng, die xoay không có trong sổ (xem docs/art/hon-thu-hoat-anh.md).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, MANIFEST } from "./lib.mjs";
import { DIRS, sheetPlan, speciesInfo } from "./beast-sheet-lib.mjs";
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
  // tờ 3:2 của loài khung ≤ 96 là bố cục theo hướng (v2); ngoài ra theo cỡ khung (sheetPlan auto)
  const layout = r.sheets.length && r.sheets.every((s) => s.kind === "boss") ? "direction" : "sheet";
  const plan = sheetPlan(info.frame, layout === "direction" ? "direction" : "auto"), have = new Set(r.sheets.map((s) => s.sheet.replace(/^to/, "")));
  const missing = plan.filter((p) => !have.has(p.id)).map((p) => `to${p.id}`);
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
    "File này **tự sinh** bằng `npm run beast:status` (`tools/assets/beast-status.mjs`); **không sửa tay**, không dán bảng tay vào issue. Mức theo khối hướng là kết quả `beast:check` (cỡ, nền, lưới, số hình, chân, cỡ thân, khung chết); `n` / `ne` lộ mặt, hurt ngửa bụng, die xoay chỉ xem bằng mắt (tờ liên hệ).", "",
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
    if (a === "--check") o.check = true;
    else if (a === "--out") o.out = argv[++i];
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
    if (o.check) {
      const same = existsSync(fj) && existsSync(fm) && readFileSync(fj, "utf8") === json && readFileSync(fm, "utf8") === md;
      console.log(same ? "sổ trạng thái đã mới" : "sổ trạng thái lệch: chạy `npm run beast:status` để cập nhật");
      process.exit(same ? 0 : 1);
    }
    mkdirSync(dir, { recursive: true });
    writeFileSync(fj, json); writeFileSync(fm, md);
    console.log(`ghi ${fj} và ${fm}: ${st.species} loài, ${st.imported} đã nhập, ` + Object.entries(st.tally).map(([k, v]) => `${v} ${k}`).join(", "));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
