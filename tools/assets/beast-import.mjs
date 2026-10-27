// Nhập hoạt ảnh vẽ thật của hồn thú vào game MỘT BƯỚC (H4, skill beast-anim Phần B bước 5–7).
//   node tools/assets/beast-import.mjs --species a,b,c [--dry-run] [--force] [--scale loài=S]... [--patch loài:A:c,r=c,r]... [--dirs-ok [loài=]s,se,e]... [--dirs-ok-only] [--sprites <thư mục>] [--src <thư mục>]
// Mỗi loài: cutter v2 (beast-sheet-cut) trên art/src/beast-anim/<loài>/to*.png → chép <loài>_anim.png vào <sprites>/beast/
//   → normal.mjs --frame FxF sinh _anim_n.png → thêm / cập nhật entry `beast_<loài>_anim` trong <sprites>/manifest.json
//   (đặt ngay sau entry ảnh tĩnh `beast_<loài>`, chép `map` từ đó; không đụng entry khác; chạy lại không đổi gì)
//   → sau cùng credits.mjs --check (chỉ khi dùng thư mục mặc định) → bảng tóm tắt.
// Loài có khối CHẶN (cảnh báo mức block của cutter: thiếu khung, vượt khung, tờ thiếu…) thì BỎ QUA và báo khối nào; không nhập nửa vời.
// Nhập riêng khối đạt (#869): --dirs-ok s,se,e (mọi loài trong lệnh) hoặc --dirs-ok loài=s,se,e (từng loài, ưu tiên hơn) ghi `anim.dirsOk` vào manifest; client chạy hoạt ảnh ở hướng đạt,
//   hướng còn lại dùng ảnh tĩnh + chuyển động code. --dirs-ok-only: lấy mọi khối cutter KHÔNG chặn (loài chỉ chặn một vài hướng thì nhập phần còn lại).
//   Hướng khai trong --dirs-ok mà cutter chặn thì từ chối (không nhập khối hỏng). Lỗi mắt (công cụ không thấy) do người soát khai qua --dirs-ok. Đủ 5 hướng thì không ghi dirsOk.
// Loài ĐÃ nhập mà bản cắt lại khác thì KHÔNG ghi đè (cutter ở đây không có chỉnh tay của lần nhập trước): cần --force, nên truyền lại --scale / --patch đã dùng.
// --dry-run: cắt và so sánh, KHÔNG ghi gì; báo "giống bản đã nhập" / "khác bản đã nhập" / "sẽ nhập mới".
// --sprites / --src: thư mục khác (thử trong thư mục tạm); manifest.json phải có sẵn entry ảnh tĩnh của loài.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, encodePng } from "./lib.mjs";
import { recutOne } from "./beast-recut-all.mjs";
import { parsePatch } from "./beast-sheet-cut-lib.mjs";

const DEF_SPRITES = path.join(ROOT, "shared", "assets", "sprites");
const DEF_SRC = path.join(ROOT, "art", "src", "beast-anim");
const DIR_RE = /(?:khung |khối |^)(se|ne|s|e|n)(?=\/|:)/;

/** Các khối hướng bị một dòng cảnh báo chặn; không nhận ra hướng thì "cả loài". */
export function blockDirs(issues) {
  const dirs = new Set();
  for (const i of issues) {
    if (i.level !== "block") continue;
    const miss = /^thiếu tờ \w+ \(([^)]+)\)/.exec(i.msg); // tờ thiếu chỉ chặn các hướng của tờ đó
    if (miss) { for (const d of miss[1].split(",")) dirs.add(d.trim()); continue; }
    const m = DIR_RE.exec(i.msg);
    dirs.add(m ? m[1] : "cả loài");
  }
  return [...dirs];
}

const ORDER = ["s", "se", "e", "ne", "n", "cả loài"];
const DIRS5 = ORDER.slice(0, 5);

/** Danh sách hướng đạt khai bằng tay: "s,se,e" → mảng theo thứ tự chuẩn; ném lỗi khi hướng lạ / trùng / rỗng. */
export function parseDirsOk(text) {
  const d = text.split(",").map((x) => x.trim()).filter(Boolean), bad = d.filter((x) => !DIRS5.includes(x));
  if (!d.length || bad.length || new Set(d).size !== d.length) throw new Error(`--dirs-ok sai: "${text}" (hướng hợp lệ ${DIRS5.join(", ")}; mẫu s,se,e hoặc loài=s,se,e)`);
  return DIRS5.filter((x) => d.includes(x));
}

/** Hướng đạt của một loài: khai tay (theo loài rồi chung) > --dirs-ok-only (trừ khối chặn) > undefined (không nhập riêng khối). */
export function pickDirsOk(id, blocked, o) {
  const want = o.dirsOkBy?.[id] ?? o.dirsOk;
  if (want) return { dirs: want, rejected: want.filter((d) => blocked.includes(d)) };
  if (o.dirsOkOnly) return { dirs: DIRS5.filter((d) => !blocked.includes(d)), rejected: [] };
  return undefined;
}
const sortDirs = (d) => [...d].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

// ---------- Sửa manifest theo văn bản (file có định dạng tay, không tuần tự hóa lại cả file) ----------
const entryText = (e) => JSON.stringify(e, null, 2).split("\n").map((l) => "    " + l).join("\n");
function findEntry(text, key) {
  const head = `    {\n      "key": ${JSON.stringify(key)},`, at = text.indexOf(head);
  if (at < 0) return null;
  const close = text.indexOf("\n    }", at), end = close + "\n    }".length;
  return { start: at, end, obj: JSON.parse(text.slice(at, end).trim()) };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Trả về { text, action: "mới" | "cập nhật" | "giữ" } hoặc ném lỗi khi thiếu entry ảnh tĩnh. */
export function upsertEntry(text, id, entry) {
  const stat = findEntry(text, `beast_${id}`);
  if (!stat) throw new Error(`manifest chưa có entry ảnh tĩnh beast_${id} (cần ảnh tĩnh trước, lấy map từ đó)`);
  const full = { ...entry, ...(stat.obj.map ? { map: stat.obj.map } : {}) };
  const old = findEntry(text, entry.key);
  if (old) {
    if (same(old.obj, full)) return { text, action: "giữ" };
    return { text: text.slice(0, old.start) + entryText(full) + text.slice(old.end), action: "cập nhật" };
  }
  const comma = text[stat.end] === ","; // entry tĩnh cuối mảng thì không có dấu phẩy sau
  const at = comma ? stat.end + 1 : stat.end;
  return { text: text.slice(0, at) + (comma ? "\n" + entryText(full) + "," : ",\n" + entryText(full)) + text.slice(at), action: "mới" };
}

// ---------- Nhập một loài ----------
function importOne(id, o) {
  const row = { id };
  const r = recutOne(id, { ...(o.scales[id] ? { scale: o.scales[id] } : {}), ...(o.patches[id] ? { patches: o.patches[id] } : {}) }, o.src);
  if (r.error) return { ...row, status: "lỗi", note: r.error };
  const rep = r.rep, s = rep.summary;
  Object.assign(row, { frames: rep.frames, block: s.block, warn: s.warn, info: s.info, scale: rep.scaleInfo?.used });
  const blocked = blockDirs(rep.issues), pick = pickDirsOk(id, blocked, o);
  if (pick && !blocked.includes("cả loài")) {
    if (pick.rejected.length) return { ...row, status: "bỏ qua (chặn)", blocked: sortDirs(blocked), note: `--dirs-ok có khối cutter chặn: ${pick.rejected.join(", ")}` };
    if (!pick.dirs.length) return { ...row, status: "bỏ qua (chặn)", blocked: sortDirs(blocked), note: "không còn khối nào đạt" };
    row.dirsOk = pick.dirs;
    if (pick.dirs.length < DIRS5.length) r.res.entry.anim.dirsOk = pick.dirs;
  } else if (blocked.length) return { ...row, status: "bỏ qua (chặn)", blocked: sortDirs(blocked), note: rep.issues.filter((i) => i.level === "block").slice(0, 3).map((i) => i.msg).join(" · ") };

  const png = path.join(o.sprites, "beast", `${id}_anim.png`), buf = Buffer.from(encodePng(r.res.sheet));
  const manifestPath = path.join(o.sprites, "manifest.json"), text = readFileSync(manifestPath, "utf8");
  const up = upsertEntry(text, id, r.res.entry);
  const pngSame = existsSync(png) && Buffer.compare(readFileSync(png), buf) === 0;
  row.png = pngSame ? "giữ" : existsSync(png) ? "cập nhật" : "mới";
  row.manifest = up.action;
  const nPng = png.replace(/\.png$/, "_n.png"), needNormal = !pngSame || !existsSync(nPng);
  const nothing = !needNormal && up.action === "giữ";
  if (o.dryRun) return { ...row, status: nothing ? "giống bản đã nhập" : up.action === "mới" || !existsSync(png) ? "sẽ nhập mới" : "khác bản đã nhập" };
  if (nothing) return { ...row, status: "không đổi" };
  // Bản đã nhập mà khác bản cắt lại: không ghi đè trừ khi --force (cắt lại ở đây không có chỉnh tay của lần nhập trước như --patch / --scale).
  if ((row.png === "cập nhật" || up.action === "cập nhật") && !o.force) return { ...row, status: "bỏ qua (khác bản đã nhập, cần --force)", note: "đã có bản nhập khác kết quả cắt lại; nếu lần trước dùng --scale / --patch thì truyền lại, rồi chạy --force" };
  mkdirSync(path.dirname(png), { recursive: true });
  if (!pngSame) writeFileSync(png, buf);
  if (needNormal) {
    const n = spawnSync(process.execPath, [path.join(ROOT, "tools", "assets", "normal.mjs"), png, "--frame", `${r.res.entry.frame[0]}x${r.res.entry.frame[1]}`], { encoding: "utf8" });
    if (n.status !== 0) return { ...row, status: "lỗi", note: `normal.mjs: ${(n.stderr || n.stdout).trim().split("\n").pop()}` };
  }
  if (up.action !== "giữ") writeFileSync(manifestPath, up.text);
  return { ...row, status: up.action === "mới" || row.png === "mới" ? "đã nhập mới" : "đã cập nhật" };
}

export function toTable(rows) {
  const L = ["| Loài | Kết quả | Khung | block / warn / info | Hệ số | Hướng đạt | Khối chặn | Ghi chú |", "|---|---|---|---|---|---|---|---|"];
  for (const r of rows) L.push(`| ${r.id} | ${r.status} | ${r.frames ?? "—"} | ${r.block ?? "—"} / ${r.warn ?? "—"} / ${r.info ?? "—"} | ${r.scale ?? "—"} | ${r.dirsOk ? (r.dirsOk.length === 5 ? "đủ 5" : r.dirsOk.join(", ")) : "—"} | ${r.blocked?.join(", ") ?? "—"} | ${r.note ?? (r.png ? `png ${r.png}, manifest ${r.manifest}` : "")} |`);
  return L.join("\n");
}

function parseArgs(argv) {
  const o = { scales: {}, patches: {}, sprites: DEF_SPRITES, src: DEF_SRC };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--species") o.species = argv[++i].split(",").map((x) => x.trim()).filter(Boolean);
    else if (a === "--dry-run") o.dryRun = true;
    else if (a === "--scale") { const [id, v] = argv[++i].split("="); if (!id || !(+v > 0)) throw new Error(`--scale sai: ${id}=${v} (mẫu loài=0.55)`); o.scales[id] = +v; }
    else if (a === "--patch") { const spec = argv[++i], k = spec.indexOf(":"); if (k < 1) throw new Error(`--patch sai: ${spec} (mẫu loài:A:5,3=4,3)`); (o.patches[spec.slice(0, k)] ??= []).push(parsePatch(spec.slice(k + 1))); }
    else if (a === "--dirs-ok") { const v = argv[++i], k = v.indexOf("="); if (k < 0) o.dirsOk = parseDirsOk(v); else (o.dirsOkBy ??= {})[v.slice(0, k)] = parseDirsOk(v.slice(k + 1)); }
    else if (a === "--dirs-ok-only") o.dirsOkOnly = true;
    else if (a === "--force") o.force = true;
    else if (a === "--sprites") o.sprites = path.resolve(argv[++i]);
    else if (a === "--src") o.src = path.resolve(argv[++i]);
    else throw new Error(`tùy chọn lạ: ${a}`);
  }
  return o;
}

export function run(o) {
  const rows = o.species.map((id) => { try { return importOne(id, o); } catch (e) { return { id, status: "lỗi", note: e.message }; } });
  console.log(toTable(rows));
  const imported = rows.filter((r) => /^đã /.test(r.status)).length;
  if (!o.dryRun && imported && o.sprites === DEF_SPRITES) {
    const c = spawnSync(process.execPath, [path.join(ROOT, "tools", "assets", "credits.mjs"), "--check"], { encoding: "utf8" });
    process.stdout.write(c.stdout ?? ""); process.stderr.write(c.stderr ?? "");
    if (c.status !== 0) { console.error("credits.mjs --check lỗi (loài mới có tờ mà NGUON.md thiếu bảng ## Ghi công? chạy npm run beast:nguon)"); return 1; }
  }
  console.log(`\n${o.dryRun ? "[dry-run, không ghi gì] " : ""}${rows.length} loài: ${imported} nhập, ${rows.filter((r) => r.status.startsWith("bỏ qua")).length} bỏ qua, ${rows.filter((r) => r.status === "lỗi").length} lỗi.`);
  if (!o.dryRun && imported) console.log("Tiếp: kiểm GIF (beast-sheet-preview), chạy npm run check, rồi commit.");
  return rows.some((r) => r.status === "lỗi") ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    if (!o.species?.length) { console.error("Dùng: node tools/assets/beast-import.mjs --species a,b,c [--dry-run] [--force] [--scale loài=S]... [--patch loài:A:c,r=c,r]... [--dirs-ok [loài=]s,se,e]... [--dirs-ok-only] [--sprites <thư mục>] [--src <thư mục>]"); process.exit(2); }
    process.exit(run(o));
  } catch (e) { console.error(e.message); process.exit(2); }
}
