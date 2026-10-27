// Sinh mẫu prompt cho tthoadev (ChatGPT / Codex) vẽ tờ hoạt ảnh một loài hồn thú (#688, v2 #865; docs/art/hon-thu-hoat-anh.md, skill beast-anim).
//   node tools/assets/beast-sheet-prompt.mjs --species phong_lang [--stage turnaround|direction|sheet] [--dir s,se,…] [--out <thư mục>] [--desc "<mô tả tiếng Anh>"]
//   node tools/assets/beast-sheet-prompt.mjs --all            (mọi loài đã có ảnh tĩnh, chỉ in danh sách)
// --stage turnaround: 1 ảnh 3:2, 5 hướng (cột) × idle / hurt / die (hàng); ghi `<loài>-turnaround.md`.
// --stage direction (v2, khuyên dùng sau khi turnaround duyệt): mỗi hướng một tờ 1536×1024, 6×4, 22 khung; ghi `<loài>-to<A..E>.md` (A–E = s, se, e, ne, n).
// --stage sheet (mặc định, đường v1 / dự phòng): khung ≤ 96 gộp 3 + 2 hướng (tờ A, B); khung lớn mỗi hướng một tờ; ghi `<loài>-to<A|B…>.md`.
// Bài học đọc từ art/src/beast-anim/lessons.md (beast-sheet-lessons.mjs); ảnh tham chiếu theo thứ tự cố định ghi trong prompt và hướng dẫn.
// Tên, mô tả, họ, bậc lấy tự động từ BEASTS (shared/data.ts), manifest, art/CREDITS.md và client/src/sprites.ts.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MANIFEST, ROOT } from "./lib.mjs";
import { DIR_VI, DIRS, ANIMS, ANIM_VI, BANDS, FRAMES, COLS, FAMILY_VI, LEGLESS, TURNAROUND, sheetPlan, speciesInfo, tierNameOfFrame } from "./beast-sheet-lib.mjs";
import { lessonsFor, STAGES } from "./beast-sheet-lessons.mjs";
import { moveFor } from "./beast-sheet-motion.mjs";

/** Hướng nhìn (cho model, góc nhìn isometric từ trên xuống ~30°). Tây là lật ngang nên mọi hướng nghiêng đều nhìn sang PHẢI. */
const DIR_EN = {
  s: "facing the viewer (front view, three-quarter from above)",
  se: "facing the lower right of the picture (three-quarter front view, head toward the viewer's right)",
  e: "facing right (side profile, seen from slightly above)",
  ne: "facing the upper right of the picture (three-quarter back view, head away from the viewer toward the right)",
  n: "facing away from the viewer (back view from above)",
};

const BACKGROUND = "BACKGROUND: one flat solid #FF00FF magenta, no gradient, no texture, no ground, no cast shadow, no vignette, no text, no labels, no numbers, no grid lines, no frame or border.";
const STYLE = "STYLE: hand-painted dark ink-wash fantasy illustration with a clean pixel-art feel, muted slightly desaturated natural colors, soft light from the top left, one thick consistent dark outline (#1a1020, not pure black) around every creature, three shades per color area, crisp edges with no soft glow or halo against the magenta, no anti-aliased pink fringe.";
const DONT_BASE = "DO NOT DRAW: glowing eyes, aura, magic effects, particles, ground, shadow, weapons, riders, other creatures, text, extra frames, speech bubbles, cute chibi proportions.";
const dont = (info) => [DONT_BASE, legless(info) ? LEGLESS_NOTE : NOTE[info.family]].filter(Boolean).join(" ");
/** Họ không chân (sứa, cá…): câu cấm vẽ chân / rễ / mặt đất, thay cho "feet" ở lưới và luật hướng (#1049). */
export const LEGLESS_NOTE = "This creature has NO legs, feet, paws, roots or ground contact: never draw any, and never draw water, waves or bubbles either.";
const legless = (info) => LEGLESS.has(info.family);
/** Câu cấm giải phẫu riêng của họ có chân bị thay bằng thân khác (#1097): rắn trườn, cây / dây leo cắm rễ, côn trùng bay. */
export const NOTE = {
  snake: "This creature is a snake: it has NO legs, feet, paws, claws or limbs of any kind; never draw any, and never draw it standing or stomping. Its long body rests and slithers directly on the ground along its belly.",
  vine: "This creature is a vine plant rooted in the ground: it has NO human or animal legs, feet, paws, hands or walking limbs; never draw any. Its base is a mass of roots and tendrils planted in the soil, and it moves by creeping them along the ground.",
  plant: "This creature is a plant: it has no animal feet, paws or shoes; its base is made of roots planted in the ground.",
  worm: "This creature is a caterpillar-like worm: a row of soft segments crawling along the ground, its many tiny legs hidden under the body; never draw it standing upright on a few big feet.",
  fly: "This creature flies: never draw it standing on its feet; in idle, moving and hurt frames it hovers in the air with its wings, and it only rests on the ground after dying.",
};
/** Tư thế theo họ cho luật hướng / lưới / nhất quán: nền (điểm thấp nhất), từ chỉ đứng yên, hurt, die. Họ không có ở đây là có chân đứng trên đất. */
const POSE = {
  snake: { base: "the lowest point of its body (the belly lying on the ground) on the same invisible ground line", rest: "resting", still: "resting, slithering and hurt", hurt: "the creature keeps its normal posture (body low on the ground, head raised), never flips onto its back, never shows its pale belly, never turns its head toward the viewer", die: "DIE goes slack and slides down onto the ground along the facing line, ending stretched out limp with the head in the same direction as idle" },
  vine: { base: "the root base on the same invisible ground line", rest: "rooted", still: "rooted, creeping and hurt", hurt: "the creature stays rooted: the root base never moves, it only whips and leans back, never flips over, never turns toward the viewer", die: "DIE wilts and slumps along the facing line with the root base staying where it is, ending limp with the same body axis as idle" },
  plant: { base: "its root base on the same invisible ground line", rest: "rooted", still: "rooted, creeping and hurt", hurt: "the creature stays rooted and only shakes and leans back, never flips over, never turns toward the viewer", die: "DIE wilts and sinks limp along the facing line, ending with the same body axis as idle" },
  worm: { base: "the underside of its body lying on the same invisible ground line", rest: "resting", still: "resting, crawling and hurt", hurt: "the creature stays low on the ground: the segments scrunch up and it is pushed back a little, never rears up on legs, never flips onto its back, never shows its underside", die: "DIE goes limp and flattens onto the ground along the facing line, ending with the same body axis as idle" },
  fly: { base: "the lowest point of its body on the same invisible baseline (nothing is drawn there)", rest: "hovering", still: "hovering, moving and hurt", hurt: "the creature keeps hovering in the same upright posture, never flips over, never shows its underside, never turns toward the viewer", die: "DIE sinks along the facing line and ends resting on the ground with the wings folded and the same body axis as idle" },
};
const pose = (info) => POSE[info.family];

function directionRules(info) {
  const tail = `In the "ne" and "n" blocks the creature is seen from behind: no eyes, nose, mouth or face is visible in any frame of those blocks, hurt and die included.`;
  if (legless(info)) return `DIRECTION RULES (every frame of a block, including HURT and DIE, keeps the block's direction): the body axis never rotates and the creature never turns to face the viewer. HURT keeps its own 2 animated frames but is only a short recoil backward along the facing line: the creature keeps its normal posture (${info.family === "swim" ? "level, as when swimming" : "floating upright, the body on top and the tentacles hanging below"}), never flips over, never shows its underside, never turns toward the viewer. DIE sinks slowly along the facing line and ends limp with the same body axis as idle; it never rotates the body 90 degrees to lie sideways across the view. ${tail}`;
  if (pose(info)) return `DIRECTION RULES (every frame of a block, including HURT and DIE, keeps the block's direction): the body axis never rotates and the creature never turns to face the viewer. HURT keeps its own 2 animated frames but is only a short recoil backward along the facing line: ${pose(info).hurt}. ${pose(info).die}; it never rotates the body 90 degrees to lie sideways across the view. ${tail}`;
  return `DIRECTION RULES (every frame of a block, including HURT and DIE, keeps the block's direction): the body axis never rotates and the creature never turns to face the viewer. HURT keeps its own 2 animated frames but is only a short recoil backward along the facing line: the creature stays upright on its feet, never flips onto its back or belly, never shows its belly, never turns its head toward the viewer. DIE sinks or topples along the facing line and ends lying with the spine parallel to that line; it never rotates the body 90 degrees to lie sideways across the view. ${tail}`;
}

/** Tỉ lệ khung cho model (không đòi số pixel: Codex image_gen chỉ chọn tỉ lệ, 1:1 ra 1254x1254). */
const aspectEn = (sheet) => sheet.w === sheet.h ? "square 1:1 aspect ratio" : sheet.h > sheet.w ? "portrait 2:3 aspect ratio" : "landscape 3:2 aspect ratio";
const aspectVi = (sheet) => sheet.w === sheet.h ? "1:1, ra 1254×1254 hoặc 1024×1024" : sheet.h > sheet.w ? "2:3, ra 1024×1536" : "3:2, ra 1536×1024";
const cellPx = (sheet) => [Math.round(sheet.w / sheet.cols), Math.round(sheet.h / sheet.rows)];

/** Khối `LESSONS` (từ art/src/beast-anim/lessons.md) cho giai đoạn và họ; rỗng nếu không có bài nào. */
export function lessonsBlock(stage, family, lessons = lessonsFor(stage, family)) {
  return lessons.length ? `\n\nLESSONS (learned from earlier sheets of other creatures, follow every line):\n${lessons.map((l) => `- ${l.text}`).join("\n")}` : "";
}

/** Ảnh đính kèm theo THỨ TỰ CỐ ĐỊNH của từng giai đoạn: { n, en, vi, required }. */
export function referencesFor(stage, info, sheet) {
  const staticRef = { required: true, en: "the static reference of this exact creature in three views (front, side, back): the identity, design, colors and overall size", vi: `ảnh tĩnh loài (${info.staticFile ? `\`shared/assets/sprites/beast/${info.id}.png\`` : "chưa có: ảnh Gemini / ComfyUI đã duyệt của loài"}, 3 khung nam / đông / bắc; phóng ×4 nếu ChatGPT làm mờ)` };
  const refs = [staticRef];
  if (stage === "direction") {
    refs.push({ required: true, en: `the approved TURNAROUND image of this creature: five columns of directions (s, se, e, ne, n) by three rows (idle, hurt, die). Copy the pose, facing angle and body size of the column "${sheet.dirs[0]}" for the idle, hurt and die frames of this sheet`, vi: "ảnh **turnaround đã duyệt** của loài (5 hướng × idle / hurt / die)" });
    refs.push({ required: false, en: "an approved direction sheet of this creature (only for matching line weight and palette; never copy its poses)", vi: "(tùy chọn) **một tờ hướng đã qua `beast:check` không có khối chặn** của chính loài này, chỉ để khớp nét / bảng màu. **Không** dùng tờ lỗi làm tham chiếu" });
  } else if (stage === "sheet" && sheet.id !== "A") {
    refs.push({ required: true, en: "the approved first sheet (A) of this creature: match its design, colors, size and line weight exactly, but never copy its poses", vi: "**tờ A đã duyệt** của loài (khớp phong cách; không dùng tờ lỗi)" });
  }
  return refs.map((r, i) => ({ ...r, n: i + 1 }));
}
const refsEn = (refs) => `REFERENCES (attached images, in this fixed order): ${refs.map((r) => `image ${r.n} = ${r.en}${r.required ? "" : " (if attached)"}`).join("; ")}.`;
const refsVi = (refs) => refs.map((r) => `${r.n}. ${r.vi}`).join("\n   ");

/** Mô tả một khối hướng (4 hàng) cho tờ v1 / v2. */
function blockText(d, i, mv, label = `Block ${i + 1}`) {
  const r0 = i * BANDS.length + 1;
  return `${label} (rows ${r0}-${r0 + BANDS.length - 1}): direction "${d}" = ${DIR_EN[d]}.
  row ${r0}: frames 1-${FRAMES.idle} = IDLE (${mv.idle}); frames ${FRAMES.idle + 1}-${FRAMES.idle + FRAMES.hurt} = HURT (${mv.hurt}).
  row ${r0 + 1}: frames 1-${FRAMES.walk} = WALK (${mv.walk}).
  row ${r0 + 2}: frames 1-${FRAMES.attack} = ATTACK (${mv.attack}).
  row ${r0 + 3}: frames 1-${FRAMES.die} = DIE (${mv.die}); the last ${COLS - FRAMES.die} cells of this row stay empty magenta.`;
}

function gridText(sheet, info) {
  const [cw, ch] = cellPx(sheet);
  return `GRID: ${sheet.cols} columns x ${sheet.rows} rows of equal invisible cells (${cw}x${ch} px each). Exactly one creature per cell, one animation frame per cell, drawn left to right in time order. Every creature is centered horizontally in its cell with ${legless(info) ? "the lowest point of its body (tentacle tips, belly or fins) on the same invisible baseline (nothing is drawn there)" : pose(info) ? pose(info).base : "its feet (or lowest body point) standing on the same invisible ground line"} about 12% above the cell bottom, and keeps at least 8% empty magenta margin on all sides. No part of any creature may cross a cell edge or touch another creature. Empty cells stay solid magenta.`;
}

const consistency = (info) => `CONSISTENCY: the creature keeps exactly the same size, proportions, palette and line weight in all frames, only the pose changes between frames. In the same direction, ${legless(info) ? "idle, moving and hurt frames keep the body at the same scale and the same baseline" : `${pose(info)?.still ?? "standing, walking and hurt"} frames keep the body at the same scale and the same ${info.family === "fly" ? "baseline" : "ground line"}`}. Consecutive frames differ by small, smooth pose changes so they loop cleanly (idle and walk loop). Directions e, se and ne must all face to the RIGHT of the picture (the game mirrors them for the left side).`;

const creatureLine = (info, desc) => `CREATURE: ${info.name} - ${desc}. Body type: ${FAMILY_VI[info.family]}. Size class: ${tierNameOfFrame(info.frame)}. Keep the SAME design, proportions, colors, markings and overall size as the references in every frame. Do not redesign it.`;

/** Prompt v1 / dự phòng (`--stage sheet`): tờ gộp 3 + 2 hướng hoặc một hướng. Chữ ký cũ giữ nguyên. */
export function buildPrompt(info, sheet, desc, { lessons } = {}) {
  const mv = moveFor(info), refs = referencesFor("sheet", info, sheet);
  const blocks = sheet.dirs.map((d, i) => blockText(d, i, mv)).join("\n");
  return `Create ONE image (${aspectEn(sheet)}; the exact pixel size does not matter): an animation sprite sheet of a single fantasy creature for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game.

${creatureLine(info, desc)}
${refsEn(refs)}

${BACKGROUND}

${gridText(sheet, info)}

LAYOUT (top to bottom):
${blocks}

${consistency(info)}

${directionRules(info)}

${STYLE}

${dont(info)}${lessonsBlock("sheet", info.family, lessons)}`;
}

/** Prompt `--stage direction`: một hướng một tờ 1536×1024, 6×4, 22 khung; `sheet` từ sheetPlan(frame, "direction"). */
export function buildDirectionPrompt(info, sheet, desc, { lessons } = {}) {
  const mv = moveFor(info), refs = referencesFor("direction", info, sheet), d = sheet.dirs[0];
  return `Create ONE image (${aspectEn(sheet)}; the exact pixel size does not matter): an animation sprite sheet of a single fantasy creature, ONE direction only, for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game.

${creatureLine(info, desc)}
${refsEn(refs)}

${BACKGROUND}

${gridText(sheet, info)}

LAYOUT (top to bottom; every frame faces the same direction "${d}" = ${DIR_EN[d]}):
${blockText(d, 0, mv, "Block 1")}

${consistency(info)}

${directionRules(info)}

${STYLE}

${dont(info)}${lessonsBlock("direction", info.family, lessons)}`;
}

/** Prompt `--stage turnaround`: 1 ảnh 3:2, 5 cột hướng × 3 hàng (idle, hurt, die). */
export function buildTurnaroundPrompt(info, desc, { lessons } = {}) {
  const T = TURNAROUND, mv = moveFor(info), refs = referencesFor("turnaround", info, { id: "T", dirs: DIRS });
  const [cw, ch] = cellPx({ ...T, w: T.w, h: T.h });
  const cols = DIRS.map((d, i) => `  column ${i + 1}: direction "${d}" = ${DIR_EN[d]}.`).join("\n");
  return `Create ONE image (landscape 3:2 aspect ratio; the exact pixel size does not matter): a turnaround reference sheet of a single fantasy creature for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game. It is a model sheet: it fixes how the creature looks from each of five directions and how it reacts to a hit and to dying.

${creatureLine(info, desc)}
${refsEn(refs)}

${BACKGROUND}

GRID: ${T.cols} columns x ${T.rows} rows of equal invisible cells (${cw}x${ch} px each). Exactly one creature per cell, centered horizontally, ${legless(info) ? "with the lowest point of its body on the same invisible baseline (nothing is drawn there)" : pose(info) ? `with ${pose(info).base}` : "standing on the same invisible ground line"} about 12% above the cell bottom${legless(info) || info.family === "fly" ? "" : " (lying creatures rest on it)"}, with at least 8% empty magenta margin on all sides. No part of any creature may cross a cell edge or touch another creature.

COLUMNS (left to right, one direction per column):
${cols}

ROWS (top to bottom, the same pose type in every column):
  row 1 = IDLE: neutral ${legless(info) ? "resting" : pose(info)?.rest ?? "standing"} pose (${mv.idle}), one calm frame.
  row 2 = HURT: the moment of the strongest reaction to a hit (${mv.hurt}).
  row 3 = DIE: the FINAL resting pose after dying (${mv.die}).
In every cell the body keeps the direction of its column: the axis never rotates and the creature never turns to face the viewer. In columns "ne" and "n" no eyes, nose, mouth or face are visible in any row, hurt and die included. Directions e, se and ne face the RIGHT side of the picture.

CONSISTENCY: the same size, proportions, palette and line weight in all ${T.cols * T.rows} cells; only the direction and the pose change.

${STYLE}

${dont(info)}${lessonsBlock("turnaround", info.family, lessons)}`;
}

const COMMON_TAIL = (stage, prereq = false) => `
- **Không vẽ** mắt phát sáng, hào quang, bóng, hiệu ứng: client tự tô (\`docs/art/quy-cach-isometric.md\`).
- **Bài học** chèn trong prompt lấy từ \`art/src/beast-anim/lessons.md\` (một nguồn duy nhất); lượt vẽ hỏng cho bài học mới thì thêm vào file đó, không viết tay vào prompt.
- **Không** dùng tờ / ảnh bị lỗi làm tham chiếu (lỗi lan sang tờ sau): tham chiếu chỉ là ảnh tĩnh, turnaround đã duyệt và tờ đã qua \`beast:check\` không có khối chặn.
- Giới hạn: ${prereq ? "turnaround làm tham chiếu trước 5 tờ hướng được **2 lượt riêng** (quyết định chủ repo, #1049), **không tính** vào giới hạn lượt của các tờ hướng; hết 2 lượt chưa đạt thì dừng và báo orchestrator" : `**tối đa 3 lượt** cho mỗi ${stage === "turnaround" ? "ảnh turnaround" : "tờ"}; quá 3 lượt thì dừng và báo orchestrator (skill \`beast-anim\`, mục "Quá 3 lượt")`}.`;

const infoRow = (info) => `| Loài | ${info.name} (\`${info.id}\`), họ **${FAMILY_VI[info.family]}** (\`${info.family}\`), bậc **${tierNameOfFrame(info.frame)}**, khung game ${info.frame}×${info.frame} |`;

/** Tài liệu Markdown cho `--stage turnaround`. */
export function buildTurnaroundDoc(info, desc, { prereq = false } = {}) {
  const T = TURNAROUND, refs = referencesFor("turnaround", info, { id: "T", dirs: DIRS });
  return `# ${info.name} (\`${info.id}\`) - ảnh turnaround (5 hướng × idle / hurt / die)

Quy trình: skill \`beast-anim\` (\`.claude/skills/beast-anim/SKILL.md\`), đặc tả \`docs/art/hon-thu-hoat-anh.md\`. File này sinh tự động bằng \`node tools/assets/beast-sheet-prompt.mjs --species ${info.id} --stage turnaround\`; **không sửa tay**, sửa mẫu ở \`tools/assets/beast-sheet-prompt.mjs\` và bài học ở \`art/src/beast-anim/lessons.md\`.

| Mục | Giá trị |
|---|---|
${infoRow(info)}
| Ảnh này | 1 ảnh tỉ lệ **3:2, ra 1536×1024**; lưới ${T.cols} cột (hướng ${DIRS.join(", ")}) × ${T.rows} hàng (idle, hurt, die) = ${T.cols * T.rows} hình |
| Nền | #FF00FF phẳng, không chữ / nhãn / lưới |

${prereq ? `> **Loài này chưa có turnaround đã duyệt** (\`art/src/beast-anim/${info.id}/turnaround.png\` chưa có) nên chưa vẽ được 5 tờ hướng (tờ hướng đòi turnaround làm tham chiếu 2): làm ảnh này trước. Duyệt xong, đặt ảnh vào đường dẫn trên rồi chạy lại \`--stage direction\` để lấy 5 tờ.\n\n` : ""}## Cách làm
1. Mở cuộc trò chuyện **mới**; đính ảnh tham chiếu **theo đúng thứ tự**:
   ${refsVi(refs)}
2. Dán khối prompt dưới đây. Không chọn cỡ ảnh (công cụ chỉ nhận tỉ lệ).
3. Soát bằng mắt: mỗi ô một con thú; cột \`se\` thấy mặt chếch xuống, thân chéo 45° (khác \`e\`); cột \`ne\` thấy lưng chéo (khác \`e\`); cột \`n\` không thấy mặt; hàng hurt lùi dọc theo hướng, không ngửa bụng, không quay mặt; hàng die nằm dọc theo hướng; cùng cỡ thân ở mọi ô.
4. Hỏng thì vẽ lại **cả ảnh** (chỉ ${T.cols * T.rows} hình, rẻ). Tối đa ${prereq ? "2 lượt riêng (xem Giới hạn bên dưới)" : "3 lượt"}; **không** dùng ảnh hỏng làm tham chiếu cho lượt sau.
5. Ảnh turnaround đã duyệt là tham chiếu hướng cho 5 tờ \`--stage direction\`. Lưu ảnh gốc nguyên byte (không resize), đặt \`art/src/beast-anim/${info.id}/turnaround.png\` khi nộp; ghi model, seed, prompt thật bằng \`node tools/assets/beast-nguon.mjs\`.

## Prompt (tiếng Anh cho model)
\`\`\`text
${buildTurnaroundPrompt(info, desc)}
\`\`\`

## Chú thích (tiếng Việt)
- **Bố cục:** cột = hướng nhìn (s, se, e, ne, n), hàng = tư thế (đứng, đỉnh cú trúng đòn, tư thế chết cuối). Đây là ảnh mẫu, không cắt vào game.${COMMON_TAIL("turnaround", prereq)}
`;
}

/** Tài liệu Markdown cho `--stage direction` (một tờ một hướng). */
export function buildDirectionDoc(info, sheet, plan, desc) {
  const d = sheet.dirs[0], [cw, ch] = cellPx(sheet), refs = referencesFor("direction", info, sheet);
  return `# ${info.name} (\`${info.id}\`) - tờ ${sheet.id} / ${plan.length}: hướng ${d} (${DIR_VI[d]})

Quy trình: skill \`beast-anim\` (\`.claude/skills/beast-anim/SKILL.md\`), đặc tả \`docs/art/hon-thu-hoat-anh.md\`. File này sinh tự động bằng \`node tools/assets/beast-sheet-prompt.mjs --species ${info.id} --stage direction\`; **không sửa tay**, sửa mẫu ở \`tools/assets/beast-sheet-prompt.mjs\` và bài học ở \`art/src/beast-anim/lessons.md\`.

| Mục | Giá trị |
|---|---|
${infoRow(info)}
| Tờ này | ${sheet.id}: hướng **${d}** (${DIR_VI[d]}); ảnh tỉ lệ **${aspectVi(sheet)}** (chuẩn ${sheet.w}×${sheet.h}); lưới ${sheet.cols} cột × ${sheet.rows} hàng, ô khoảng ${cw}×${ch}; 22 khung |
| Nền | #FF00FF phẳng, không chữ / nhãn / lưới |

## Cách làm
1. Mở cuộc trò chuyện **mới** cho mỗi tờ; đính ảnh tham chiếu **theo đúng thứ tự**:
   ${refsVi(refs)}
2. Dán khối prompt dưới đây. Không chọn cỡ ảnh (công cụ chỉ nhận tỉ lệ).
3. Lưu ảnh gốc **nguyên byte** (không resize) vào \`art/src/beast-anim/${info.id}/to${sheet.id}.png\` rồi chạy \`npm run beast:check -- ${info.id}\`. Đối chiếu **tờ liên hệ có nhãn**: \`n\` / \`ne\` không thấy mặt (kể cả hurt), \`se\` khác \`e\`, hurt lùi dọc hướng (không ngửa bụng / quay mặt), die giữ hướng, cùng cỡ với tờ chuẩn. NGUON và dòng \`LỖI:\` do \`beast-nguon.mjs\` sinh, không viết tay.
4. Chỉ tờ này hỏng thì vẽ lại **chỉ tờ này** (22 hình), tối đa 3 lượt; chọn lượt có điểm kiểm thấp nhất + mắt. **Không** dùng tờ hỏng làm tham chiếu.
5. Cắt: \`node tools/assets/beast-sheet-cut.mjs --species ${info.id} ${plan.map((s) => `--sheet ${s.id}=<ảnh-tờ-${s.id}.png>`).join(" ")} --out <thư mục>\` (nhận ra tờ 3:2 nên tự dùng bố cục theo hướng; ép bằng \`--layout direction\`).

## Prompt (tiếng Anh cho model)
\`\`\`text
${buildDirectionPrompt(info, sheet, desc)}
\`\`\`

## Chú thích (tiếng Việt)
- **Bố cục:** một khối ${BANDS.length} hàng: hàng 1 = đứng (${FRAMES.idle} khung) + trúng đòn (${FRAMES.hurt}), hàng 2 = đi (${FRAMES.walk}), hàng 3 = đánh (${FRAMES.attack}), hàng 4 = chết (${FRAMES.die}, hai ô cuối trống).
- **Hướng:** chỉ vẽ nam, đông-nam, đông, đông-bắc, bắc; tây là lật ngang nên mọi hướng nghiêng nhìn sang phải.${COMMON_TAIL("direction")}
`;
}

/** Tài liệu Markdown cho `--stage sheet` (đường v1 / dự phòng). */
export function buildDoc(info, sheet, plan, desc) {
  const [cw, ch] = cellPx(sheet), dirs = sheet.dirs.map((d) => `${d} (${DIR_VI[d]})`).join(", "), refs = referencesFor("sheet", info, sheet);
  return `# ${info.name} (\`${info.id}\`) - tờ ${sheet.id} / ${plan.length}: hướng ${dirs}

Đặc tả: \`docs/art/hon-thu-hoat-anh.md\`; skill \`beast-anim\`. File này sinh tự động bằng \`node tools/assets/beast-sheet-prompt.mjs --species ${info.id}\` (\`--stage sheet\`, đường v1 / dự phòng: khuyên dùng \`--stage turnaround\` rồi \`--stage direction\`); **không sửa tay**, sửa mẫu ở \`tools/assets/beast-sheet-prompt.mjs\` và bài học ở \`art/src/beast-anim/lessons.md\`.

| Mục | Giá trị |
|---|---|
${infoRow(info)}
| Tờ này | ${sheet.id}: ${dirs}; ảnh tỉ lệ **${aspectVi(sheet)}** (chuẩn ${sheet.w}×${sheet.h}); lưới ${sheet.cols} cột × ${sheet.rows} hàng, ô khoảng ${cw}×${ch} |
| Nền | #FF00FF phẳng, không chữ / nhãn / lưới (ChatGPT cho nền trong suốt thật thì cũng được: công cụ nhận cả hai) |

## Cách làm (tthoadev)
1. Mở cuộc trò chuyện **mới** cho mỗi tờ; đính ảnh tham chiếu **theo đúng thứ tự**:
   ${refsVi(refs)}
2. Dán khối prompt dưới đây. **Không** cần chọn cỡ ảnh: công cụ (Codex image_gen) chỉ nhận tỉ lệ (${aspectVi(sheet)}). Cỡ ra khác ${sheet.w}×${sheet.h} (vd tờ 1:1 ra 1254×1254) vẫn **hợp lệ**, cutter tự chuẩn hóa.
3. Soát bằng mắt: mỗi ô đúng một con thú, đủ số khung theo hàng, đúng hướng nhìn, cùng cỡ, ô trống để trống, không chữ. Hỏng một hai khung thì bảo model vẽ lại **cả tờ** (vẽ lại từng ô làm lệch phong cách); đừng sửa tay trừ vết nhỏ.
4. Lưu ảnh gốc, giữ nguyên cỡ ra (không resize), đặt vào \`art/src/beast-anim/${info.id}/to${sheet.id}.png\` rồi chạy \`npm run beast:check -- ${info.id}\`. NGUON và dòng \`LỖI:\` do \`node tools/assets/beast-nguon.mjs\` sinh (không viết tay); ghi vào \`art/CREDITS.md\` khi ảnh được duyệt vào game.
5. Đưa orchestrator đường dẫn tờ; cắt bằng:
   \`node tools/assets/beast-sheet-cut.mjs --species ${info.id} ${plan.map((s) => `--sheet ${s.id}=<ảnh-tờ-${s.id}.png>`).join(" ")} --out <thư mục>\`

## Prompt (tiếng Anh cho model)
\`\`\`text
${buildPrompt(info, sheet, desc)}
\`\`\`

## Chú thích (tiếng Việt)
- **Bố cục:** mỗi hướng một khối ${BANDS.length} hàng: hàng 1 = đứng (${FRAMES.idle} khung) + trúng đòn (${FRAMES.hurt}), hàng 2 = đi (${FRAMES.walk}), hàng 3 = đánh (${FRAMES.attack}), hàng 4 = chết (${FRAMES.die}, hai ô cuối trống). Ô lưới chia đều theo kích thước ảnh nên model lệch vài pixel vẫn cắt đúng.
- **Hướng:** chỉ vẽ nam, đông-nam, đông, đông-bắc, bắc; tây là lật ngang đông-nam / đông / đông-bắc nên mọi hướng nghiêng phải nhìn sang phải.
- **Chân thẳng hàng:** mỗi hoạt ảnh đều để chân trên cùng một đường nền ẩn; công cụ căn chân theo đáy hình của từng khung (khung nhảy / bay mất độ cao, chấp nhận).
- **Nhất quán:** cùng cỡ, bảng màu, nét viền; chỉ đổi tư thế. Công cụ báo khung lệch cỡ / chân / vượt ô; báo nhiều thì vẽ lại tờ.${COMMON_TAIL("sheet")}
`;
}

/** Loài đã có turnaround duyệt trong repo (art/src/beast-anim/<loài>/turnaround.png, cùng tiêu chí với beast-status.mjs). */
export const hasTurnaround = (id) => existsSync(path.join(ROOT, "art", "src", "beast-anim", id, "turnaround.png"));

/**
 * Các file `[tên, nội dung]` của một loài theo giai đoạn. `dirs` lọc hướng (chỉ cho `direction` / `sheet`).
 * `--stage direction` mà chưa có turnaround đã duyệt (`opts.hasTurnaround` ghi đè kiểm tra file) thì trả hướng dẫn turnaround trước
 * (`prereq`), không đòi ảnh tham chiếu chưa tồn tại (#1049).
 */
export function stageDocs(info, stage, desc, dirs = DIRS, opts = {}) {
  if (stage === "turnaround") return [[`${info.id}-turnaround.md`, buildTurnaroundDoc(info, desc)]];
  if (stage === "direction" && !(opts.hasTurnaround ?? hasTurnaround(info.id))) return [[`${info.id}-turnaround.md`, buildTurnaroundDoc(info, desc, { prereq: true })]];
  const plan = sheetPlan(info.frame, stage === "direction" ? "direction" : "auto");
  return plan.filter((sh) => sh.dirs.some((d) => dirs.includes(d)))
    .map((sh) => [`${info.id}-to${sh.id}.md`, stage === "direction" ? buildDirectionDoc(info, sh, plan, desc) : buildDoc(info, sh, plan, desc)]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  if (a.includes("--all")) {
    const keys = JSON.parse(readFileSync(MANIFEST, "utf8")).sprites.filter((e) => e.static && e.key.startsWith("beast_")).map((e) => e.key.slice(6));
    for (const id of keys) { const i = speciesInfo(id); console.log(`${id}\t${i.family}\t${i.frame}\t${tierNameOfFrame(i.frame)}`); }
  } else {
    const species = val("--species"), stage = val("--stage") ?? "sheet", dirs = val("--dir")?.split(",") ?? DIRS;
    if (!species || !STAGES.includes(stage) || dirs.some((d) => !DIRS.includes(d))) { console.error("Dùng: node tools/assets/beast-sheet-prompt.mjs --species <loài> [--stage turnaround|direction|sheet] [--dir s,se,e,ne,n] [--out <thư mục>] [--desc \"<mô tả tiếng Anh>\"] | --all"); process.exit(2); }
    const info = speciesInfo(species);
    if (!info.frame) { console.error(`loài ${species} chưa có khung trong manifest`); process.exit(2); }
    const out = val("--out"), desc = val("--desc") ?? info.desc;
    if (out) mkdirSync(out, { recursive: true });
    if (stage === "direction" && !hasTurnaround(info.id)) console.error(`${species}: chưa có turnaround đã duyệt (art/src/beast-anim/${species}/turnaround.png): sinh hướng dẫn turnaround trước, 5 tờ hướng sau khi có ảnh.`);
    for (const [name, md] of stageDocs(info, stage, desc, dirs)) {
      if (out) { writeFileSync(path.join(out, name), md); console.log(`ghi ${path.join(out, name)}`); } else console.log(md);
    }
  }
}
