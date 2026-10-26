// Sổ trạng thái hoạt ảnh phụ thể võ hồn v2, tự sinh (#1022; fork từ beast-status.mjs).
//   npm run phuthe:status                       ghi art/src/phuthe-anim/_status.json + _status.md cho 25 võ hồn (file cục bộ, .gitignore, KHÔNG commit)
//   npm run phuthe:status -- --out <thư mục>    ghi chỗ khác;  --id a,b  chỉ vài võ hồn
// Mỗi võ hồn: nhóm (A / B / C), khung 96 / 128, màu khóa nộm, có turnaround chưa, tờ (cỡ, byte, SHA256, mức kiểm), mức theo khối hướng (s, se, e, ne, n),
// tờ còn thiếu, đã nhập vào game chưa (manifest có `vhanim_<id>_b` hoặc `_f`), dòng `LỖI:` do phuthe:check sinh. Kết quả chỉ phụ thuộc file trong repo.
// Không thay mắt người (nhận diện, mặt, nộm bị vẽ lại, hurt đúng hướng); xem docs/art/phu-the-hoat-anh.md "Tiêu chí duyệt".
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MANIFEST } from "./lib.mjs";
import { DIRS, ANIM_ROOT, SHEET_ID, allPhutheIds, phutheInfo, gameKey, HALVES } from "./phuthe-sheet-lib.mjs";
import { checkPhuThe, draftErrorLine } from "./phuthe-sheet-check.mjs";

export { ANIM_ROOT };
const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const count = (s, sev) => s.issues.filter((i) => i.sev === sev).length;

/** Võ hồn đã nhập vào game: manifest có `vhanim_<id>_b` hoặc `vhanim_<id>_f`. */
export function importedSet() {
  const keys = new Set(JSON.parse(readFileSync(MANIFEST, "utf8")).sprites.map((e) => e.key));
  return new Set(allPhutheIds().filter((id) => Object.values(HALVES).some((h) => keys.has(gameKey(id, h)))));
}

/** Trạng thái một võ hồn: tờ, khối hướng, thiếu, nhập game, dòng LỖI. */
export function phutheStatus(id, { root = ANIM_ROOT, imported = importedSet() } = {}) {
  const dir = path.join(root, id), info = phutheInfo(id);
  const hasSheets = DIRS.some((d) => existsSync(path.join(dir, `to${SHEET_ID[d]}.png`)));
  const out = { id, name: info.name, group: info.group, frame: info.frame, dummyKey: info.dummyKey, imported: imported.has(id), turnaround: existsSync(path.join(dir, "turnaround.png")) };
  if (!hasSheets) return { ...out, state: "chua-co-to", sheets: [], blocks: {}, missing: DIRS.map((d) => `to${SHEET_ID[d]}`), errorLines: [] };
  const r = checkPhuThe(id, { dir });
  const have = new Set(r.sheets.map((s) => s.sheet)), missing = DIRS.map((d) => `to${SHEET_ID[d]}`).filter((n) => !have.has(n));
  const blocks = Object.fromEntries(DIRS.map((d) => [d, r.blockLevel[d] ?? "thiếu"])), levels = Object.values(blocks);
  const state = levels.includes("chặn") ? "chan" : levels.includes("thiếu") ? "thieu-to" : "san-sang-nhap";
  const sheets = r.sheets.map((s) => ({ sheet: s.sheet, file: `art/src/phuthe-anim/${id}/${s.sheet}.png`, size: s.size, bytes: readFileSync(s.file).length, sha256: sha256(s.file), level: s.level, block: count(s, "block"), light: count(s, "light"), note: count(s, "note") }));
  return { ...out, state, sheets, blocks, missing, errorLines: r.sheets.map(draftErrorLine).filter(Boolean) };
}

/** Sổ cho 25 võ hồn (hoặc `only`). */
export function buildStatus({ root = ANIM_ROOT, only } = {}) {
  const imported = importedSet(), ids = only ?? allPhutheIds();
  const items = ids.map((id) => phutheStatus(id, { root, imported })), tally = {};
  for (const s of items) tally[s.state] = (tally[s.state] ?? 0) + 1;
  return { schema: 1, generatedBy: "tools/assets/phuthe-sheet-status.mjs", phuthe: items.length, imported: items.filter((s) => s.imported).length, tally, items };
}

const STATE_VI = { "san-sang-nhap": "sẵn sàng nhập", chan: "có khối chặn", "thieu-to": "thiếu tờ", "chua-co-to": "chưa có tờ" };
const LEVEL_MARK = { pass: "đạt", "nhẹ": "nhẹ", "chặn": "**chặn**", "thiếu": "thiếu" };

/** Bảng Markdown của sổ. */
export function statusMarkdown(st) {
  const L = ["# Sổ trạng thái hoạt ảnh phụ thể võ hồn", "",
    "Sổ này **tự sinh** bằng `npm run phuthe:status` (`tools/assets/phuthe-sheet-status.mjs`); **không sửa tay**, không commit file sinh ra. Mức theo khối hướng do `phuthe:check` tính; chỗ cần mắt người (nhận diện, mặt, nộm bị vẽ lại, hurt đúng hướng) không có trong sổ. Võ hồn có khối chặn thì **giữ nhánh cũ cả võ hồn** (đặc tả, mục \"Fallback nhánh cũ\").", "",
    `${st.phuthe} võ hồn · ${st.imported} đã nhập vào game · ` + Object.entries(st.tally).map(([k, v]) => `${v} ${STATE_VI[k] ?? k}`).join(" · "), "",
    "| Võ hồn | Mã | Nhóm | Khung | Nộm | Tờ (cỡ, mức) | s | se | e | ne | n | Thiếu | Nhập game | Trạng thái |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"];
  for (const s of st.items) {
    const sheets = s.sheets.map((x) => `${x.sheet.replace(/^to/, "")} ${x.size.join("×")} ${LEVEL_MARK[x.level]}`).join("<br>") || "-";
    const cells = DIRS.map((d) => (s.blocks[d] ? LEVEL_MARK[s.blocks[d]] : "-"));
    L.push(`| ${s.name} | \`${s.id}\` | ${s.group} | ${s.frame} | \`${s.dummyKey}\` | ${sheets} | ${cells.join(" | ")} | ${s.missing.join(", ") || "-"} | ${s.imported ? "đã nhập" : "chưa"} | ${STATE_VI[s.state]} |`);
  }
  const bad = st.items.filter((s) => s.errorLines.length);
  L.push("", "## Dòng `LỖI:` do công cụ sinh", "", "Chỉ mục nhẹ và chặn do `phuthe:check` phát hiện (soát bằng mắt trước khi dán vào NGUON.md).", "");
  for (const s of bad) L.push(`### ${s.name} (\`${s.id}\`)`, "", "```", ...s.errorLines, "```", "");
  if (!bad.length) L.push("Không có.", "");
  return L.join("\n");
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") o.out = argv[++i];
    else if (a === "--id") o.only = argv[++i].split(",");
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
    console.log(`ghi ${fj} và ${fm}: ${st.phuthe} võ hồn, ${st.imported} đã nhập, ` + Object.entries(st.tally).map(([k, v]) => `${v} ${k}`).join(", "));
  } catch (e) { console.error(e.message); process.exit(2); }
}
