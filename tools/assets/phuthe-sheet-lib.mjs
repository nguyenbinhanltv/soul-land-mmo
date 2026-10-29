// Dùng chung cho đường làm hoạt ảnh vẽ thật của phụ thể võ hồn v2 (#1022, đặc tả docs/art/phu-the-hoat-anh.md, epic #1020):
// số khung, bố cục tờ 5 hướng, bố cục sheet game, khung 96 / 128, ánh xạ clip phụ thể sang khung thân, thông tin từng võ hồn.
// Fork từ beast-sheet-lib.mjs. Công cụ: phuthe-sheet-dummy / -prompt / -check / -cut / -preview / -status.mjs.
// Mọi hằng ở đây là hằng công cụ, KHÔNG phải số cân bằng (shared/data.ts). Bảng "Ánh xạ clip phụ thể sang khung thân" được tính từ
// LPC_SHEET (thân hồn sư) theo đúng quy tắc của đặc tả và có test đối chiếu; client (P2) dùng lại đúng các hàm này.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.mjs";
import { DIRS, DIR_VI, ratioNear, canonFactor } from "./beast-sheet-lib.mjs";

const { LPC_SHEET } = await import("../../shared/data.ts");
export { DIRS, DIR_VI, LPC_SHEET, ratioNear, canonFactor };

export const DOC_SPEC = path.join(ROOT, "docs", "art", "phu-the-hoat-anh.md");
export const DOC_STYLE = path.join(ROOT, "docs", "art", "vo-hon-phong-cach.md");
/** Phụ thể v2 = vũ khí cầm tay (#1307, #1312; phu-the-vu-khi.md (thư mục docs/art)): bảng 25 dòng "dạng vũ khí" + kế hoạch kỹ thuật. */
export const DOC_VUKHI = path.join(ROOT, "docs", "art", "phu-the-vu-khi.md");
/** Kiểu tờ: `phuthe` (phụ thể cũ, sheet `vhanim_*`) và `vukhi` (vũ khí cầm tay, sheet `vkanim_*`, thêm marker điểm cầm). */
export const KINDS = ["phuthe", "vukhi"];
export const checkKind = (k = "phuthe") => { if (!KINDS.includes(k)) throw new Error(`kiểu tờ chỉ ${KINDS.join(" / ")} (nhận ${k})`); return k; };
export const ANIM_ROOT = path.join(ROOT, "art", "src", "phuthe-anim");
export const LESSONS_FILE = path.join(ANIM_ROOT, "lessons.md");

// ---------- Clip, nhóm, số khung ----------
/** Thứ tự clip cố định (cũng là thứ tự cột trong sheet game). `die` / `absorb` không có clip phụ thể (phụ thể ẩn / mờ). */
export const CLIPS = ["idle", "walk", "attack", "cast", "hurt"];
export const CLIP_VI = { idle: "đứng", walk: "đi", attack: "đánh", cast: "thi triển hồn kỹ", hurt: "trúng đòn" };
/** Số khung mỗi clip: nhóm B / C (sinh vật, thực vật, hư ảnh) và nhóm A (vật cứng, ít pose). */
export const FRAMES_SOFT = { idle: 4, walk: 6, attack: 6, cast: 4, hurt: 2 };
export const FRAMES_RIGID = { idle: 2, walk: 4, attack: 4, cast: 2, hurt: 1 };
export const GROUPS = ["A", "B", "C"];
export const GROUP_VI = { A: "vật cứng", B: "chi thể sinh vật", C: "thực vật / hư ảnh" };
export const framesOf = (group) => (group === "A" ? FRAMES_RIGID : FRAMES_SOFT);
export const totalFrames = (group) => Object.values(framesOf(group)).reduce((a, b) => a + b, 0);

// ---------- Bố cục tờ RAW (mỗi hướng một tờ 3:2) ----------
/** Mỗi dải một hàng: hàng 1 = đứng + trúng đòn (chung hàng để ô gần vuông), rồi đi, đánh, thi triển. */
export const BANDS = [["idle", "hurt"], ["walk"], ["attack"], ["cast"]];
export const BAND_ROWS = BANDS.length;
/** Tờ 6 × 4 ô, ảnh canonical 1536×1024; ô ≈ 256 × 256. Tờ nhận mọi cỡ 3:2 (cutter chuẩn hóa theo tỉ lệ). */
export const COLS = 6;
export const SHEET_W = 1536, SHEET_H = 1024, CELL = 256;
/** Mã tờ theo hướng (như `beast-sheet-prompt --stage direction`): A–E = s, se, e, ne, n. */
export const SHEET_ID = Object.fromEntries(DIRS.map((d, i) => [d, "ABCDE"[i]]));
export const DIR_OF_SHEET = Object.fromEntries(DIRS.map((d, i) => ["ABCDE"[i], d]));

/** Vị trí (dải, cột đầu) của một clip trong tờ. */
export function clipSlot(group, clip) {
  const fr = framesOf(group);
  for (let b = 0; b < BANDS.length; b++) {
    let col = 0;
    for (const a of BANDS[b]) { if (a === clip) return { band: b, col }; col += fr[a]; }
  }
  throw new Error(`không có clip ${clip}`);
}
/** Các ô có hình của một tờ: [{ anim, frame, col, row }]; ô khác là ô trống (không nộm, không phụ thể). */
export function sheetCells(group) {
  const fr = framesOf(group), cells = [];
  for (const anim of CLIPS) {
    const { band, col } = clipSlot(group, anim);
    for (let f = 0; f < fr[anim]; f++) cells.push({ anim, frame: f, col: col + f, row: band });
  }
  return cells;
}
/** Số hình mỗi dải hàng của tờ (để kiểm lưới): B / C [6, 6, 6, 4], A [3, 4, 4, 2]. */
export const figuresPerBand = (group) => { const n = Array(BAND_ROWS).fill(0); for (const c of sheetCells(group)) n[c.row]++; return n; };
/** Kế hoạch 5 tờ của một nhóm; `cells` cho gapLayout của beast-sheet-cut-lib dùng được. */
export function sheetPlan(group) {
  const cells = sheetCells(group).map((c) => ({ ...c }));
  return DIRS.map((d) => ({ id: SHEET_ID[d], dirs: [d], w: SHEET_W, h: SHEET_H, cols: COLS, rows: BAND_ROWS, cells }));
}
/** Cỡ ảnh hợp lệ theo tỉ lệ 3:2 (±1%): 1536×1024 và mọi cỡ cùng tỉ lệ. */
export const sheetFits = (w, h) => ratioNear(w, h, SHEET_W, SHEET_H);

/** Ảnh turnaround: 1 ảnh 3:2, 5 cột hướng × 3 hàng (idle, attack đỉnh, hurt) = 15 hình. */
export const TURNAROUND = { w: SHEET_W, h: SHEET_H, cols: DIRS.length, rows: 3, poses: ["idle", "attack", "hurt"] };
/** Bước thân của mỗi hàng turnaround (attack: bước 2, khung thân đang chém xuống; hurt: bước 1). */
export const TURNAROUND_STEP = { idle: 0, attack: 2, hurt: 1 };

// ---------- Khung 96 / 128 và sheet game ----------
export const FRAME_SIZES = [96, 128];
/** Gốc chân trong khung phụ thể: giữa ngang, thân mở rộng đều (96: (48, 74); 128: (64, 90) = gốc thân (32, 58) + 32 mỗi trục). */
export const frameOrigin = (F) => [F / 2, F / 2 + 26];
/** Khung thân (64×64, gốc (32, 58)) nằm ở góc (F/2 − 32, F/2 − 32) của khung phụ thể. */
export const bodyOffset = (F) => [F / 2 - 32, F / 2 - 32];
export const checkFrame = (F) => { if (!FRAME_SIZES.includes(F)) throw new Error(`khung phụ thể chỉ ${FRAME_SIZES.join(" / ")} (nhận ${F})`); return F; };
/** Cột của từng clip trong sheet game: { idle: [cột đầu, số khung], … }; B / C 22 cột, A 13 cột. */
export function gameAnims(group) {
  const fr = framesOf(group), out = {}; let col = 0;
  for (const a of CLIPS) { out[a] = [col, fr[a]]; col += fr[a]; }
  return out;
}
export const gameCols = totalFrames;
export const SEXES = ["m", "f"];
/** Hàng sheet game: giới trước, hướng sau (m: 0–4, f: 5–9). */
export const GAME_ROWS = SEXES.length * DIRS.length;
export const gameRow = (sex, dir) => SEXES.indexOf(sex) * DIRS.length + DIRS.indexOf(dir);
/** Hai nửa: `b` = sau thân (`sau`), `f` = trước thân (`truoc`); tên theo sheet phụ thể cũ `vh_{id}_b` / `_f`. */
export const HALVES = { sau: "b", truoc: "f" };
export const GAME_PREFIX = { phuthe: "vhanim", vukhi: "vkanim" };
export const gameKey = (id, half, kind = "phuthe") => `${GAME_PREFIX[checkKind(kind)]}_${id}_${half}`;
/** Thư mục tờ RAW của một võ hồn: phụ thể cũ ở `<id>/`, vũ khí ở `<id>/vukhi/` (cùng toA–toE, lop.json). */
export const animDir = (id, kind = "phuthe", root = ANIM_ROOT) => (checkKind(kind) === "vukhi" ? path.join(root, id, "vukhi") : path.join(root, id));

// ---------- Ánh xạ clip phụ thể sang khung thân (đặc tả, mục "Ánh xạ clip phụ thể sang khung thân") ----------
const LPC_ANIM = { idle: "idle", walk: "walk", attack: "attack", cast: "cast", hurt: "hurt" };
export const bodyAnim = (clip) => LPC_SHEET.anims[LPC_ANIM[clip]];
export const bodyTotalMs = (clip) => bodyAnim(clip).ms.reduce((a, b) => a + b, 0);
/** Bước thân đang hiển thị tại thời điểm `t` ms của hoạt ảnh thân (ranh giới thì lấy bước sau; quá cuối thì bước cuối). */
export function bodyStepAt(clip, t) {
  const ms = bodyAnim(clip).ms; let end = 0;
  for (let s = 0; s < ms.length; s++) { end += ms[s]; if (t < end) return s; }
  return ms.length - 1;
}
/** Bước thân dùng làm neo / nộm cho khung `i` của clip có `n` khung: bước thân ở tâm thời gian đoạn `[i/n, (i+1)/n)`. */
export const bodyStepOf = (clip, n, i) => bodyStepAt(clip, ((i + 0.5) / n) * bodyTotalMs(clip));
/** Bảng bước thân của mọi khung: { idle: [0, 1, 2, 3], … } theo nhóm. */
export function bodySteps(group) {
  const fr = framesOf(group);
  return Object.fromEntries(CLIPS.map((a) => [a, Array.from({ length: fr[a] }, (_, i) => bodyStepOf(a, fr[a], i))]));
}
/** Khung của clip phụ thể đang hiển thị tại thời điểm `t` ms (vòng lặp nếu clip thân lặp; không thì giữ khung cuối). */
export function clipFrameAt(group, clip, t) {
  const n = framesOf(group)[clip], total = bodyTotalMs(clip), loop = bodyAnim(clip).loop;
  const tt = loop ? ((t % total) + total) % total : Math.min(Math.max(t, 0), total - 1e-6);
  return Math.min(n - 1, Math.floor((tt / total) * n));
}
/** Hàng thân (khóa `rows` của LPC_SHEET) cho hướng phụ thể: `se` / `ne` dùng hàng `e`; `hurt` mọi hướng dùng hàng hurt (hướng xuống). */
export function bodyRowKey(clip, dir) {
  if (clip === "hurt") return "hurt";
  return LPC_SHEET.dir8[dir][0];
}
/** Cột khung thân trong sheet lớp LPC (`lpcparts`) của bước thân `step` của clip. */
export function bodyColOf(clip, step) {
  const A = bodyAnim(clip);
  return LPC_SHEET.strips[A.strip].col + A.idx[step];
}

// ---------- Màu khóa nộm ----------
export const BG_KEY = [255, 0, 255];
export const DUMMY_KEY = "#00D0D0";
/** Võ hồn có màu chủ đạo gần cyan đổi nộm sang xanh lá / vàng chanh (đặc tả, mục "Hình nộm LPC tham chiếu" ý 3). Ghi màu thật dùng vào NGUON.md. */
export const DUMMY_KEY_ALT = {
  bang_phuong_hoang: "#30D030", lam_ngan_thao: "#30D030", a_ngan: "#30D030", lam_dien_ba_vuong_long: "#30D030",
  cuu_bao_luu_ly_thap: "#D0D000", pha_hon_thuong: "#D0D000",
};
export const dummyKeyOf = (id) => DUMMY_KEY_ALT[id] ?? DUMMY_KEY;

// ---------- Màu khóa vạch tham chiếu (#1171) ----------
/** Vạch tham chiếu (đường chân, trục, tâm ngực, chiều cao thân, góc khung) vẽ cùng nộm bằng MỘT màu khóa riêng, khác nền, khác nộm; cutter trừ như nộm. */
export const GUIDE_KEY = "#7A5CFF";
/** Ứng viên đổi màu vạch khi võ hồn có màu gần màu vạch (tím / xanh tím gần #7A5CFF; cam / đỏ gần #FF8C00). */
export const GUIDE_KEY_CANDIDATES = [GUIDE_KEY, "#FF8C00", "#80C000"];
const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbDist = (a, b) => Math.hypot(...rgbOf(a).map((v, i) => v - rgbOf(b)[i]));
/** Màu vạch của võ hồn: ứng viên đầu tiên cách xa (≥ 90) màu thân + màu nhấn của võ hồn trong VOHON và (≥ 120) màu khóa nộm. */
export function guideKeyOf(id, dummyKey = dummyKeyOf(id), colors = vohonColors(id)) {
  const far = (g) => rgbDist(g, dummyKey) >= 120 && (!colors || [colors.col, colors.robe].every((c) => rgbDist(g, c) >= 90));
  return GUIDE_KEY_CANDIDATES.find(far) ?? GUIDE_KEY;
}

// ---------- Màu khóa marker điểm cầm (kiểu vũ khí) ----------
/** Marker điểm cầm: chấm / vòng nhỏ đè đúng chỗ bàn tay của nộm, MỘT màu khóa riêng khác nền, nộm, vạch (đặc tả vũ khí, mục "Điểm cầm trên nộm"). Cutter trừ như vạch, KHÔNG vào sheet game. */
export const GRIP_KEY = "#00FF60";
/** Ứng viên đổi màu marker khi võ hồn có màu gần lục chói (cutter dùng cùng cách chọn như màu vạch). */
export const GRIP_KEY_CANDIDATES = [GRIP_KEY, "#FFE000", "#FF3030"];
/** Bán kính marker theo điểm ảnh ô canonical 256: chấm đặc (tay thuận `A`) và vòng (tay kia `B`, hở giữa); hai bên khác nhau bằng HÌNH, không thêm màu. */
export const GRIP_R = 6, GRIP_RING_IN = 3;
/** Điểm đeo `vai` = `back` dời lên theo tỉ lệ chiều cao thân (hằng công cụ, không ở shared/data.ts). */
export const SHOULDER_UP = 0.12;
/** Số marker điểm cầm của một vũ khí theo cột "Tay": `1 tay` → 1 (chỉ tay thuận A), `2 tay` / `đôi` / `găng` → 2 (A chấm, B vòng). */
export const gripCount = (hands) => (/^1 tay/.test(hands ?? "") ? 1 : 2);
/** Màu khóa marker: ứng viên đầu tiên cách xa (≥ 90) màu thân + nhấn của võ hồn, màu nộm, màu vạch (≥ 120). */
export function gripKeyOf(id, dummyKey = dummyKeyOf(id), guideKey = guideKeyOf(id, dummyKey), colors = vohonColors(id)) {
  const far = (g) => [dummyKey, guideKey].every((c) => rgbDist(g, c) >= 120) && (!colors || [colors.col, colors.robe].every((c) => rgbDist(g, c) >= 90));
  return GRIP_KEY_CANDIDATES.find(far) ?? GRIP_KEY;
}

// ---------- Thông tin từng võ hồn ----------
const read = (f) => readFileSync(f, "utf8");
/** Bảng "Bảng phần riêng của phụ thể" trong đặc tả → [{ n, name, id, group, frame, frameNote, attach, motion }]. */
export function parseSpecTable(md = read(DOC_SPEC)) {
  const out = [];
  for (const line of md.split(/\r?\n/)) {
    const c = line.split("|").map((s) => s.trim());
    if (c.length < 8 || !/^\d+$/.test(c[1])) continue;
    const id = /`([a-z_]+)`/.exec(c[2])?.[1], group = c[3], frame = /^\d+/.exec(c[4])?.[0];
    if (!id || !GROUPS.includes(group) || !frame) continue;
    out.push({ n: +c[1], name: c[2].replace(/\s*\(`[a-z_]+`\)/, ""), id, group, frame: +frame, frameNote: c[4], attach: c[5], motion: c[6] });
  }
  return out;
}
export const LABEL_EN = { "Bá đạo ở đâu": "Overbearing presence", "Hình mẫu": "Form", "Màu": "Palette", "Motif": "Motifs (use only these)", "Vật đi kèm": "Companion objects" };
/** Mô tả ngoại hình từ `vo-hon-phong-cach.md` mục 4 (nguồn DUY NHẤT): { name, lines: [{ label, text }] } hoặc null. */
export function parseStyleBrief(id, md = read(DOC_STYLE)) {
  const lines = md.split(/\r?\n/), start = lines.findIndex((l) => new RegExp(`^\\*\\*\\d+\\. .+\\*\\* \\(\`${id}\`\\)`).test(l));
  if (start < 0) return null;
  const name = /^\*\*\d+\. (.+?)\*\*/.exec(lines[start])[1], out = [];
  for (let i = start + 1; i < lines.length && !/^\*\*\d+\. |^#{1,3} /.test(lines[i]); i++) {
    const m = /^- \*\*(.+?):\*\* (.*)$/.exec(lines[i]);
    if (m) out.push({ label: m[1], text: m[2].trim() });
  }
  return { name, lines: out };
}
/** Khối STYLE + NEGATIVE nguyên văn ở mục 6 của `vo-hon-phong-cach.md` (hàng rào ``` đầu tiên sau tiêu đề "## 6."). */
export function styleBlock(md = read(DOC_STYLE)) {
  const at = md.search(/^## 6\./m);
  if (at < 0) throw new Error("vo-hon-phong-cach.md không có mục 6");
  const m = /```[a-z]*\r?\n([\s\S]*?)```/.exec(md.slice(at));
  if (!m || !/STYLE \(apply to every image\)/.test(m[1]) || !/NEGATIVE \(forbidden\)/.test(m[1])) throw new Error("mục 6 thiếu khối STYLE / NEGATIVE");
  return m[1].trimEnd();
}
/** `robe` (thân) và `col` (nhấn) của võ hồn trong VOHON (shared/data.ts). */
export function vohonColors(id) {
  const m = new RegExp(`vh\\("${id}",[\\s\\S]*?"(#[0-9a-fA-F]{6})",\\s*"(#[0-9a-fA-F]{6})"`).exec(read(path.join(ROOT, "shared", "data.ts")));
  return m ? { col: m[1], robe: m[2] } : null;
}

/** Khung 128 mặc định cho vũ khí dài / to (đặc tả vũ khí, bước 3 và 7); mọi vũ khí khác khung 96. Đổi bằng `--frame`. */
export const VUKHI_FRAME_128 = new Set(["hao_thien_chuy"]);
/** Nhóm vũ khí theo cột "Nhóm" của bảng: cứng → A (clip ít pose); mềm / găng-vuốt → B (clip đủ pose). */
export const VUKHI_GROUP = { "cứng": "A", "mềm": "B", "găng-vuốt": "B" };
/**
 * Bảng 25 vũ khí trong `phu-the-vu-khi.md` → [{ n, name, id, shape, type, group, frame, hands, attach, motion }]:
 * `shape` = dạng vũ khí, `type` = cứng | mềm | găng-vuốt, `hands` = 1 tay | 2 tay | đôi | găng, `attach` = điểm cầm, `motion` = ghi chú attack / cast.
 */
export function parseVukhiTable(md = read(DOC_VUKHI)) {
  const out = [];
  for (const line of md.split(/\r?\n/)) {
    const c = line.split("|").map((s) => s.trim());
    if (c.length < 9 || !/^\d+$/.test(c[1])) continue;
    const id = /`([a-z_]+)`/.exec(c[2])?.[1], type = c[4], group = VUKHI_GROUP[type];
    if (!id || !group) continue;
    out.push({ n: +c[1], name: c[2].replace(/\s*\(`[a-z_]+`\)/, ""), id, shape: c[3], type, group, frame: VUKHI_FRAME_128.has(id) ? 128 : 96, hands: c[5], attach: c[6], motion: c[7] });
  }
  return out;
}
export const allVukhiIds = (md) => parseVukhiTable(md).map((r) => r.id);

/** Thông tin một phụ thể: bảng đặc tả + mô tả mục 4 + màu VOHON + màu khóa nộm. Ném lỗi nếu thiếu ở đâu đó. */
export function phutheInfo(id, kind = "phuthe", md) {
  checkKind(kind);
  const vk = kind === "vukhi", doc = vk ? DOC_VUKHI : DOC_SPEC, row = (vk ? parseVukhiTable(md) : parseSpecTable(md)).find((r) => r.id === id);
  if (!row) throw new Error(`võ hồn ${id} không có trong bảng ${vk ? "25 vũ khí" : "phần riêng của phụ thể"} (${path.relative(ROOT, doc)})`);
  const brief = parseStyleBrief(id);
  if (!brief) throw new Error(`võ hồn ${id} không có mô tả ở mục 4 của ${path.relative(ROOT, DOC_STYLE)}`);
  const colors = vohonColors(id), dummyKey = dummyKeyOf(id), guideKey = guideKeyOf(id, dummyKey, colors);
  return { ...row, kind, brief, colors, dummyKey, guideKey, ...(vk ? { gripKey: gripKeyOf(id, dummyKey, guideKey, colors) } : {}), groupVi: GROUP_VI[row.group] };
}
export const allPhutheIds = () => parseSpecTable().map((r) => r.id);

// ---------- Nhãn lớp (mặt nạ nửa sau / trước) ----------
export const LAYER_LABELS = ["sau", "truoc"];
/** Nhãn mặc định điểm ngoài mọi vùng và ngoài hình bao nộm: nửa sau thân; hướng quay lưng cánh / đuôi / hư ảnh đổi sang `truoc` (đặc tả). */
export const DEFAULT_LAYER = { s: "sau", se: "sau", e: "sau", ne: "truoc", n: "truoc" };
