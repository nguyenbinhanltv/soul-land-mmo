// Sinh prompt cho tthoadev (ChatGPT / Codex) vẽ tờ hoạt ảnh phụ thể võ hồn v2 (#1022; docs/art/phu-the-hoat-anh.md, skill beast-anim).
//   node tools/assets/phuthe-sheet-prompt.mjs --id ta_hoa_phuong_hoang --stage turnaround|direction [--dir s,se,…] [--out <thư mục>] [--frame 96|128] [--dummy-key #00D0D0]
//   node tools/assets/phuthe-sheet-prompt.mjs --all            (25 võ hồn: mã, nhóm, khung, màu nộm)
// --stage turnaround: 1 ảnh 3:2, 5 cột hướng × 3 hàng (idle, attack đỉnh, hurt) = 15 hình, kèm bảng nộm; ghi `<id>-turnaround.md`.
// --stage direction: mỗi hướng một tờ 1536×1024, 6×4 ô; ghi `<id>-to<A..E>.md` (A–E = s, se, e, ne, n).
// Với --out còn ghi bảng nộm `<id>-nom-turnaround.png`, `<id>-nom-to<A..E>.png` (ảnh tham chiếu số 1 đính kèm khi sinh ảnh).
// Prompt TỰ SINH, không viết tay: khối STYLE + NEGATIVE chèn NGUYÊN VĂN từ docs/art/vo-hon-phong-cach.md mục 6; mô tả riêng lấy từ mục 4 của
// chính file đó (nguồn DUY NHẤT về ngoại hình / màu / motif; giữ tiếng Việt, nhãn đổi sang tiếng Anh); phần kỹ thuật (nộm, lưới, nhóm, khung, số clip)
// từ đặc tả phu-the-hoat-anh.md; bài học từ art/src/phuthe-anim/lessons.md. KHÔNG dùng ảnh phụ thể cũ làm ảnh dẫn hay nguồn mô tả.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DIRS, DIR_VI, CLIPS, CLIP_VI, COLS, BAND_ROWS, BANDS, TURNAROUND, GROUP_VI, CELL, SHEET_W, SHEET_H, BG_KEY,
  framesOf, sheetPlan, sheetCells, checkFrame, phutheInfo, allPhutheIds, styleBlock, frameOrigin, SHEET_ID,
} from "./phuthe-sheet-lib.mjs";
import { lessonsFor, STAGES } from "./phuthe-sheet-lessons.mjs";
import { writeDummies } from "./phuthe-sheet-dummy.mjs";

/** Hướng nhìn của PHỤ THỂ (không phải của nộm). Tây là lật ngang nên mọi hướng nghiêng đều nhìn sang PHẢI. */
const DIR_EN = {
  s: "facing the viewer (front view, three-quarter from above)",
  se: "facing the lower right of the picture (three-quarter front view)",
  e: "facing right (side profile, seen from slightly above)",
  ne: "facing the upper right of the picture (three-quarter back view)",
  n: "facing away from the viewer (back view from above)",
};
/** Hàng thân dùng làm nộm cho từng hướng (thân LPC chỉ có 3 hàng s / e / n): để người vẽ hiểu vì sao nộm ngang mà phụ thể chếch. */
const DUMMY_DIR_EN = { s: "front", se: "side", e: "side", ne: "side", n: "back" };

/** Mô tả chuyển động tổng quát theo nhóm (chi tiết riêng từng võ hồn nằm ở ghi chú clip tiếng Việt lấy từ đặc tả). */
const MOVE = {
  soft: {
    idle: "slow breathing, a gentle sway of the limbs / leaves / flames; frame 1 is the neutral base pose",
    walk: "one full cycle that follows the stride of the mannequin (wing beat, tail sway, bounce); the first and last frames join smoothly",
    attack: "wind up, swing, strike, recover; the limb or weapon makes its swing at the same moment the mannequin swings",
    cast: "spreads, rises or swells larger than the attack; the last frame is a hold pose",
    hurt: "a short recoil backward along the facing line, then recovery; the spirit shrinks or folds a little",
  },
  rigid: {
    idle: "very small hover or tilt; the two frames differ clearly but gently",
    walk: "bobs and tilts with the stride; every frame has a clearly different angle or height",
    attack: "a rigid object swinging or thrusting through four clearly different poses (raise, strike, hit, return)",
    cast: "lifts higher and tilts open; two clearly different poses",
    hurt: "one frame: knocked back a short step along the facing line",
  },
};
const moveOf = (group) => (group === "A" ? MOVE.rigid : MOVE.soft);

const BACKGROUND = `BACKGROUND: one flat solid #FF00FF magenta, no gradient, no texture, no ground, no cast shadow, no vignette, no text, no labels, no numbers, no grid lines, no frame or border. This overrides the line "Transparent background" of the STYLE block: the sheet background is solid magenta, never transparent.`;
const mannequinLine = (info, dir) => `MANNEQUIN: the first attached image already contains the hero's body as a FLAT, single-colored mannequin silhouette (solid ${info.dummyKey}, no shading, no outline) placed in every occupied cell, drawn ${DUMMY_DIR_EN[dir] ?? "side"} on. It is the ONLY human shape allowed in the picture (it overrides "human character" in NEGATIVE) and it is a fixed reference, not something to draw. Keep every mannequin exactly where it is, at the same size and in the same flat color; do not repaint, shade, outline, move, resize or add a face, eyes, hands or clothes to it. Never use ${info.dummyKey} or magenta #FF00FF anywhere in the spirit itself; if the spirit has a similar hue, keep it clearly darker, lighter or less saturated.`;
const spiritBlock = (info) => {
  const c = info.colors, L = info.brief.lines.map((l) => `- ${({ "Bá đạo ở đâu": "Overbearing presence", "Hình mẫu": "Form", "Màu": "Palette", "Motif": "Motifs (use only these)", "Vật đi kèm": "Companion objects" })[l.label] ?? l.label}: ${l.text}`);
  return `SPIRIT: ${info.name} (${info.id}); body type "${info.group}" = ${GROUP_VI[info.group]}. The design brief below comes from the canonical design table and is written in Vietnamese: follow it exactly, keep every hex code as written, and use only the motifs it lists.
${L.join("\n")}${c ? `\n- Base colors in the game data: body (robe) ${c.robe}, accent (col) ${c.col}.` : ""}
Attachment and layering notes (Vietnamese; `sau` = drawn behind the hero's body, `truoc` = drawn in front of it): ${info.attach}
Motion notes (Vietnamese): ${info.motion}`;
};

/** Ảnh đính kèm theo THỨ TỰ CỐ ĐỊNH: { n, en, vi, required }. */
export function referencesFor(stage, info, sheet) {
  const nom = stage === "turnaround" ? `${info.id}-nom-turnaround.png` : `${info.id}-nom-to${sheet.id}.png`;
  const refs = [{ required: true, en: `the MANNEQUIN BOARD of this ${stage === "turnaround" ? "turnaround" : "sheet"}: magenta background with the flat ${info.dummyKey} mannequin already placed in every occupied cell; copy this layout exactly and draw the spirit on top of / around it`, vi: `**bảng nộm** của ${stage === "turnaround" ? "ảnh turnaround" : "tờ này"} (\`${nom}\`, do \`phuthe-sheet-dummy.mjs\` dựng; nộm đã đặt đúng chỗ, đừng bảo model tự vẽ thân)` }];
  if (stage === "direction") {
    refs.push({ required: true, en: `the approved TURNAROUND image of this spirit: five columns of directions (s, se, e, ne, n) by three rows (idle, attack peak, hurt). Copy the form, facing angle, size and colors of the column "${sheet.dirs[0]}"`, vi: "ảnh **turnaround đã duyệt** của võ hồn (5 hướng × idle / attack đỉnh / hurt)" });
    refs.push({ required: false, en: "an approved direction sheet of this spirit (only for matching line weight and palette; never copy its poses)", vi: "(tùy chọn) **một tờ hướng đã qua `npm run phuthe:check` không có khối chặn** của chính võ hồn này, chỉ để khớp nét / bảng màu. **Không** dùng tờ lỗi làm tham chiếu" });
  }
  return refs.map((r, i) => ({ ...r, n: i + 1 }));
}
const refsEn = (refs) => `REFERENCES (attached images, in this fixed order): ${refs.map((r) => `image ${r.n} = ${r.en}${r.required ? "" : " (if attached)"}`).join("; ")}. No other reference is allowed: do not copy any older drawing of this spirit.`;
const refsVi = (refs) => refs.map((r) => `${r.n}. ${r.vi}`).join("\n   ");

/** Khối `LESSONS` (từ art/src/phuthe-anim/lessons.md) cho giai đoạn và nhóm; rỗng nếu không có bài nào. */
export function lessonsBlock(stage, group, lessons = lessonsFor(stage, group)) {
  return lessons.length ? `\n\nLESSONS (learned from earlier sheets, follow every line):\n${lessons.map((l) => `- ${l.text}`).join("\n")}` : "";
}

const cellPx = (sheet) => [Math.round(sheet.w / sheet.cols), Math.round(sheet.h / sheet.rows)];

/** Mô tả khối bố cục 4 hàng của một tờ (số khung theo nhóm). */
function layoutText(group, dir) {
  const fr = framesOf(group), mv = moveOf(group), cells = sheetCells(group);
  const rows = BANDS.map((band, r) => {
    const parts = []; let at = 1;
    for (const a of band) { parts.push(`${fr[a] > 1 ? `frames ${at}-${at + fr[a] - 1}` : `frame ${at}`} = ${a.toUpperCase()} (${mv[a]})`); at += fr[a]; }
    const used = cells.filter((c) => c.row === r).length;
    return `  row ${r + 1}: ${parts.join("; ")}${used < COLS ? `; the last ${COLS - used} cell${COLS - used > 1 ? "s" : ""} of this row stay empty magenta, with no mannequin` : ""}.`;
  });
  return `LAYOUT (top to bottom; every frame shows the spirit in direction "${dir}" = ${DIR_EN[dir]}; the mannequin is drawn ${DUMMY_DIR_EN[dir]} on in the pose of the hero's body at that frame):\n${rows.join("\n")}`;
}

const gridText = (sheet, group) => {
  const [cw, ch] = cellPx(sheet);
  return `GRID: ${sheet.cols} columns x ${sheet.rows} rows of equal invisible cells (${cw}x${ch} px each), exactly the layout of the mannequin board. Exactly one figure (mannequin + spirit) per occupied cell, one animation frame per cell, left to right in time order (${totalCells(group)} occupied cells). Each mannequin stays exactly where the board puts it, and the spirit is drawn around and over it. No part of any figure may cross a cell edge or touch another cell; keep clear magenta space between cells. Empty cells stay solid magenta.`;
};
const totalCells = (group) => sheetCells(group).length;

const CONSISTENCY = "CONSISTENCY: the spirit keeps exactly the same size, proportions, palette and line weight in all frames, only the pose changes. Consecutive frames differ by small, smooth pose changes so idle and walk loop cleanly. Every attachment point (wing root, hand grip, shoulder, head, feet) stays glued to the same place of the mannequin in every frame. Directions e, se and ne must all face to the RIGHT of the picture (the game mirrors them for the left side).";
const RULES = `DRAWING RULES: draw ONLY the spirit. Never redraw the hero's body, face, hands or feet; the mannequin does that job. In the "ne" and "n" blocks show no face anywhere. Paint the spirit with hard-edged pixels and the dark outline of the STYLE block; no glow, halo, particles, soft shadow, ground or magic circle in the picture (the game adds them).`;

/** Prompt `--stage direction`: một hướng một tờ 1536×1024, 6×4. `sheet` từ sheetPlan(group). */
export function buildDirectionPrompt(info, sheet, { lessons, style = styleBlock() } = {}) {
  const dir = sheet.dirs[0], refs = referencesFor("direction", info, sheet);
  return `${style}

TASK: Create ONE image (landscape 3:2 aspect ratio; the exact pixel size does not matter): an animation sprite sheet of a martial-soul spirit attached to a hero, ONE direction only, for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game. Draw only the spirit; the hero is the flat mannequin already placed in the first reference image.

${spiritBlock(info)}
${refsEn(refs)}

${mannequinLine(info, dir)}

${BACKGROUND}

${gridText(sheet, info.group)}

${layoutText(info.group, dir)}

${CONSISTENCY}

${RULES}${lessonsBlock("direction", info.group, lessons)}`;
}

/** Prompt `--stage turnaround`: 1 ảnh 3:2, 5 cột hướng × 3 hàng (idle, attack đỉnh, hurt). */
export function buildTurnaroundPrompt(info, { lessons, style = styleBlock() } = {}) {
  const T = TURNAROUND, refs = referencesFor("turnaround", info, { id: "T", dirs: DIRS }), cw = Math.round(T.w / T.cols), ch = Math.round(T.h / T.rows);
  const cols = DIRS.map((d, i) => `  column ${i + 1}: spirit direction "${d}" = ${DIR_EN[d]}; mannequin drawn ${DUMMY_DIR_EN[d]} on.`).join("\n");
  const mv = moveOf(info.group);
  return `${style}

TASK: Create ONE image (landscape 3:2 aspect ratio; the exact pixel size does not matter): a turnaround reference sheet of a martial-soul spirit attached to a hero, for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game. It is a model sheet: it fixes how the spirit looks from each of five directions, at the peak of an attack and when hit. Draw only the spirit; the hero is the flat mannequin already placed in the first reference image.

${spiritBlock(info)}
${refsEn(refs)}

${mannequinLine(info, "e")}

${BACKGROUND}

GRID: ${T.cols} columns x ${T.rows} rows of equal invisible cells (${cw}x${ch} px each), exactly the layout of the mannequin board. Exactly one figure (mannequin + spirit) per cell, each mannequin exactly where the board puts it, spirit drawn around and over it. No part of any figure may cross a cell edge or touch another cell.

COLUMNS (left to right, one direction per column):
${cols}

ROWS (top to bottom, the same pose type in every column):
  row 1 = IDLE: the neutral base pose (${mv.idle}).
  row 2 = ATTACK: the peak of the attack, the moment of the strongest strike (${mv.attack}).
  row 3 = HURT: the moment of the strongest reaction to a hit (${mv.hurt}).
Directions e, se and ne face the RIGHT side of the picture.

CONSISTENCY: the same size, proportions, palette and line weight in all ${T.cols * T.rows} cells; only the direction and the pose change. Every attachment point stays glued to the same place of the mannequin.

${RULES}${lessonsBlock("turnaround", info.group, lessons)}`;
}

const COMMON_TAIL = (stage) => `
- **Không vẽ** hào quang, hạt, bóng, pháp trận, thân / mặt / tay chân người: client và code tự thêm (\`docs/art/vo-hon-phong-cach.md\` mục 3.4).
- **Bài học** chèn trong prompt lấy từ \`art/src/phuthe-anim/lessons.md\` (một nguồn duy nhất); lượt vẽ hỏng cho bài học mới thì thêm vào file đó, không viết tay vào prompt.
- **Không** dùng ảnh phụ thể cũ (\`art/src/gemini/phuthe_5huong/…\`, \`vh_{id}_b/_f\`) và **không** dùng tờ / ảnh bị lỗi làm tham chiếu: tham chiếu chỉ là bảng nộm, turnaround đã duyệt và tờ đã qua \`phuthe:check\` không có khối chặn.
- Giới hạn: **tối đa 3 lượt** cho mỗi ${stage === "turnaround" ? "ảnh turnaround" : "tờ"}; quá 3 lượt thì dừng và báo orchestrator (skill \`beast-anim\`, mục "Quá 3 lượt"; võ hồn giữ nhánh cũ nếu còn khối chặn).`;

const infoRows = (info, F) => `| Võ hồn | ${info.name} (\`${info.id}\`), nhóm **${info.group}** (${info.groupVi}), khung phụ thể **${F}×${F}** (gốc chân (${frameOrigin(F).join(", ")})) |
| Nộm | màu khóa **${info.dummyKey}** (đổi bằng \`--dummy-key\` nếu đổi; ghi màu thật dùng vào \`NGUON.md\`) |
| Nền | #FF00FF phẳng, không chữ / nhãn / lưới |`;

const HEAD = (id, stage) => `Quy trình: skill \`beast-anim\` (đường đi giống hồn thú), đặc tả \`docs/art/phu-the-hoat-anh.md\`. File này sinh tự động bằng \`node tools/assets/phuthe-sheet-prompt.mjs --id ${id} --stage ${stage}\`; **không sửa tay**, sửa mẫu ở \`tools/assets/phuthe-sheet-prompt.mjs\` và bài học ở \`art/src/phuthe-anim/lessons.md\`. Ngoại hình lấy từ \`docs/art/vo-hon-phong-cach.md\` mục 4 (nguồn duy nhất).`;

/** Tài liệu Markdown cho `--stage turnaround`. */
export function buildTurnaroundDoc(info, F) {
  const T = TURNAROUND, refs = referencesFor("turnaround", info, { id: "T" });
  return `# ${info.name} (\`${info.id}\`) - phụ thể: ảnh turnaround (5 hướng × idle / attack đỉnh / hurt)

${HEAD(info.id, "turnaround")}

| Mục | Giá trị |
|---|---|
${infoRows(info, F)}
| Ảnh này | 1 ảnh tỉ lệ **3:2, ra 1536×1024**; lưới ${T.cols} cột (hướng ${DIRS.join(", ")}) × ${T.rows} hàng (idle, attack đỉnh, hurt) = ${T.cols * T.rows} hình, mỗi ô một nộm + phụ thể |

## Cách làm
1. Mở cuộc trò chuyện **mới**; đính ảnh tham chiếu **theo đúng thứ tự**:
   ${refsVi(refs)}
2. Dán khối prompt dưới đây. Không chọn cỡ ảnh (công cụ chỉ nhận tỉ lệ).
3. Soát bằng mắt: nộm còn nguyên (cùng màu, cùng chỗ, không thêm mặt / tay); mỗi ô một phụ thể; cột \`se\` chếch xuống, cột \`ne\` chếch lên (khác \`e\`); cột \`n\` không có mặt; điểm gắn (cánh, tay cầm, đầu) dính vào nộm; cùng cỡ ở mọi ô; **không có thân người / mặt do model vẽ**.
4. Hỏng thì vẽ lại **cả ảnh** (chỉ ${T.cols * T.rows} hình, rẻ). Tối đa 3 lượt; **không** dùng ảnh hỏng làm tham chiếu cho lượt sau.
5. Ảnh turnaround đã duyệt là tham chiếu hướng cho 5 tờ \`--stage direction\`. Lưu ảnh gốc nguyên byte (không resize) vào \`art/src/phuthe-anim/${info.id}/turnaround.png\` kèm \`turnaround.prompt.txt\` (prompt thật đã gửi).

## Prompt (tiếng Anh cho model)
\`\`\`text
${buildTurnaroundPrompt(info)}
\`\`\`

## Chú thích (tiếng Việt)
- **Bố cục:** cột = hướng nhìn của phụ thể (s, se, e, ne, n), hàng = tư thế (đứng, đỉnh cú đánh, trúng đòn). Nộm dựng từ thân LPC theo hàng \`s\` / \`e\` / \`n\` (\`se\`, \`ne\` dùng hàng \`e\`). Đây là ảnh mẫu, không cắt vào game.${COMMON_TAIL("turnaround")}
`;
}

/** Tài liệu Markdown cho `--stage direction` (một tờ một hướng). */
export function buildDirectionDoc(info, sheet, plan, F) {
  const d = sheet.dirs[0], [cw, ch] = cellPx(sheet), refs = referencesFor("direction", info, sheet), fr = framesOf(info.group), n = Object.values(fr).reduce((a, b) => a + b, 0);
  return `# ${info.name} (\`${info.id}\`) - phụ thể, tờ ${sheet.id} / ${plan.length}: hướng ${d} (${DIR_VI[d]})

${HEAD(info.id, "direction")}

| Mục | Giá trị |
|---|---|
${infoRows(info, F)}
| Tờ này | ${sheet.id}: hướng **${d}** (${DIR_VI[d]}); ảnh tỉ lệ **3:2** (chuẩn ${sheet.w}×${sheet.h}); lưới ${sheet.cols} cột × ${sheet.rows} hàng, ô khoảng ${cw}×${ch}; **${n} khung** (${CLIPS.map((c) => `${c} ${fr[c]}`).join(", ")}) |

## Cách làm
1. Mở cuộc trò chuyện **mới** cho mỗi tờ; đính ảnh tham chiếu **theo đúng thứ tự**:
   ${refsVi(refs)}
2. Dán khối prompt dưới đây. Không chọn cỡ ảnh (công cụ chỉ nhận tỉ lệ 3:2; cỡ khác 1536×1024 vẫn hợp lệ nếu lưới đúng, cutter chuẩn hóa).
3. Lưu ảnh gốc **nguyên byte** (không resize) vào \`art/src/phuthe-anim/${info.id}/to${sheet.id}.png\` (kèm \`to${sheet.id}.prompt.txt\`) rồi chạy \`npm run phuthe:check -- ${info.id}\`. Đối chiếu **tờ liên hệ có nhãn**: nộm còn nguyên, điểm gắn không trôi, \`se\` / \`ne\` khác \`e\`, hurt lùi đúng hướng, không vẽ lại thân / mặt người.
4. Chỉ tờ này hỏng thì vẽ lại **chỉ tờ này**, tối đa 3 lượt; chọn lượt có điểm kiểm thấp nhất + mắt. **Không** dùng tờ hỏng làm tham chiếu.
5. Cắt: \`node tools/assets/phuthe-sheet-cut.mjs --id ${info.id} ${plan.map((s) => `--sheet ${s.id}=<ảnh-tờ-${s.id}.png>`).join(" ")} --out <thư mục>\`.

## Prompt (tiếng Anh cho model)
\`\`\`text
${buildDirectionPrompt(info, sheet)}
\`\`\`

## Chú thích (tiếng Việt)
- **Bố cục:** ${BANDS.map((b, r) => `hàng ${r + 1} = ${b.map((a) => `${CLIP_VI[a]} (${fr[a]})`).join(" + ")}`).join(", ")}; ô thừa để trống, **không có nộm**.
- **Hướng:** chỉ vẽ nam, đông-nam, đông, đông-bắc, bắc; tây là lật ngang nên mọi hướng nghiêng nhìn sang phải. Nộm chỉ có 3 dáng (\`s\`, \`e\`, \`n\`): \`se\` / \`ne\` dùng dáng \`e\`, phụ thể vẽ chếch 3/4 nhưng điểm gắn vẫn trùng nộm.${COMMON_TAIL("direction")}
`;
}

/** Các file `[tên, nội dung]` của một võ hồn theo giai đoạn. `dirs` lọc hướng (chỉ cho `direction`). */
export function stageDocs(info, stage, { dirs = DIRS, frame } = {}) {
  const F = checkFrame(frame ?? info.frame);
  if (stage === "turnaround") return [[`${info.id}-turnaround.md`, buildTurnaroundDoc(info, F)]];
  const plan = sheetPlan(info.group);
  return plan.filter((sh) => sh.dirs.some((d) => dirs.includes(d))).map((sh) => [`${info.id}-to${sh.id}.md`, buildDirectionDoc(info, sh, plan, F)]);
}

/** Thông tin cho prompt, cho phép ghi đè khung / màu nộm bằng tùy chọn. */
export function infoWith(id, { frame, dummyKey } = {}) {
  const info = phutheInfo(id);
  return { ...info, frame: checkFrame(frame ?? info.frame), dummyKey: dummyKey ?? info.dummyKey };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  try {
    if (a.includes("--all")) {
      for (const id of allPhutheIds()) { const i = phutheInfo(id); console.log(`${id}\t${i.group}\t${i.frame}\t${i.dummyKey}`); }
    } else {
      const id = val("--id"), stage = val("--stage") ?? "direction", dirs = val("--dir")?.split(",") ?? DIRS;
      if (!id || !STAGES.includes(stage) || dirs.some((d) => !DIRS.includes(d))) { console.error("Dùng: node tools/assets/phuthe-sheet-prompt.mjs --id <võ hồn> [--stage turnaround|direction] [--dir s,se,e,ne,n] [--out <thư mục>] [--frame 96|128] [--dummy-key #00D0D0] | --all"); process.exit(2); }
      const frame = val("--frame") && +val("--frame"), dummyKey = val("--dummy-key"), info = infoWith(id, { frame, dummyKey }), out = val("--out");
      if (out) mkdirSync(out, { recursive: true });
      for (const [name, md] of stageDocs(info, stage, { dirs, frame: info.frame })) {
        if (out) { writeFileSync(path.join(out, name), md); console.log(`ghi ${path.join(out, name)}`); } else console.log(md);
      }
      if (out) for (const f of writeDummies(id, out, { frame: info.frame, key: info.dummyKey })) console.log(`ghi ${f}`);
    }
  } catch (e) { console.error(e.message); process.exit(2); }
}
