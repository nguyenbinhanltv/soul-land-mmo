// Sinh mẫu prompt cho tthoadev (ChatGPT / Codex) vẽ tờ hoạt ảnh một loài hồn thú (#688, docs/art/hon-thu-hoat-anh.md).
//   node tools/assets/beast-sheet-prompt.mjs --species phong_lang [--out <thư mục>] [--desc "<mô tả tiếng Anh>"]
//   node tools/assets/beast-sheet-prompt.mjs --all            (mọi loài đã có ảnh tĩnh, chỉ in danh sách)
// Mỗi tờ một file `<loài>-to<A|B…>.md`: hướng dẫn tiếng Việt, khối prompt tiếng Anh, danh sách ảnh đính kèm và lệnh cắt.
// Tên, mô tả, họ, bậc lấy tự động từ BEASTS (shared/data.ts), manifest, art/CREDITS.md và client/src/sprites.ts.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MANIFEST } from "./lib.mjs";
import { DIR_VI, ANIMS, ANIM_VI, BANDS, FRAMES, COLS, FAMILY_VI, sheetPlan, speciesInfo, tierNameOfFrame } from "./beast-sheet-lib.mjs";

/** Hướng nhìn (cho model, góc nhìn isometric từ trên xuống ~30°). Tây là lật ngang nên mọi hướng nghiêng đều nhìn sang PHẢI. */
const DIR_EN = {
  s: "facing the viewer (front view, three-quarter from above)",
  se: "facing the lower right of the picture (three-quarter front view, head toward the viewer's right)",
  e: "facing right (side profile, seen from slightly above)",
  ne: "facing the upper right of the picture (three-quarter back view, head away from the viewer toward the right)",
  n: "facing away from the viewer (back view from above)",
};

/** Gợi ý chuyển động theo họ (khớp họ ở client/src/sprites.ts: beastFamily). */
const MOVE = {
  quad: { idle: "slow breathing, weight shifts subtly, head and tail sway", walk: "four-legged trot cycle, diagonal legs in step, body bobbing", attack: "crouch back, then lunge forward with a bite or claw swipe, then recover", hurt: "recoils a short step backward along its facing line, head dips, all four legs stay planted and the spine stays on the same axis", die: "staggers, then sinks down in place along its facing line, finally lying with the spine parallel to that line" },
  bird: { idle: "folded wings, small head bobs and pecks at the ground", walk: "hopping and strutting on two talons", attack: "wings flare up, then dive forward with talons and beak extended, then recover", hurt: "wings jerk, body recoils a short way backward along its facing line, talons stay on the ground", die: "staggers, wings go limp, sinks down along its facing line, finally lying with the spine parallel to that line" },
  snake: { idle: "coiled body swaying, head raised", walk: "slithering S-curve, body flowing forward", attack: "pull back into an S-shape, then strike fast with open jaws, then retract", hurt: "body recoils backward along its facing line and coils tighter", die: "body goes slack, finally stretched out limp along its facing line" },
  insect: { idle: "hovering in place, wings blur, body bobbing", walk: "flying forward with fast wing beats", attack: "pull back, then dart forward with the stinger or mandibles, then recover", hurt: "knocked back along its facing line, wings stutter", die: "wings stop, sinks down along its facing line, finally resting on the ground with legs curled, body axis unchanged" },
  plant: { idle: "stems and leaves sway gently", walk: "creeping forward on roots, body swaying", attack: "sways back, then lashes forward with vines or petals, then recovers", hurt: "shakes and leans back along its facing line, roots stay put", die: "wilts and sinks limp along its facing line" },
};

/** Tỉ lệ khung cho model (không đòi số pixel: Codex image_gen chỉ chọn tỉ lệ, 1:1 ra 1254x1254). */
const aspectEn = (sheet) => sheet.w === sheet.h ? "square 1:1 aspect ratio" : sheet.h > sheet.w ? "portrait 2:3 aspect ratio" : "landscape 3:2 aspect ratio";

export function buildPrompt(info, sheet, desc) {
  const F = info.frame, cw = Math.round(sheet.w / sheet.cols), ch = Math.round(sheet.h / sheet.rows), mv = MOVE[info.family];
  const blocks = sheet.dirs.map((d, i) => {
    const r0 = i * BANDS.length + 1;
    return `Block ${i + 1} (rows ${r0}-${r0 + BANDS.length - 1}): direction "${d}" = ${DIR_EN[d]}.
  row ${r0}: frames 1-${FRAMES.idle} = IDLE (${mv.idle}); frames ${FRAMES.idle + 1}-${FRAMES.idle + FRAMES.hurt} = HURT (${mv.hurt}).
  row ${r0 + 1}: frames 1-${FRAMES.walk} = WALK (${mv.walk}).
  row ${r0 + 2}: frames 1-${FRAMES.attack} = ATTACK (${mv.attack}).
  row ${r0 + 3}: frames 1-${FRAMES.die} = DIE (${mv.die}); the last ${COLS - FRAMES.die} cells of this row stay empty magenta.`;
  }).join("\n");
  return `Create ONE image (${aspectEn(sheet)}; the exact pixel size does not matter): an animation sprite sheet of a single fantasy creature for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game.

CREATURE: ${info.name} - ${desc}. Body type: ${FAMILY_VI[info.family]}. Size class: ${tierNameOfFrame(F)}. The attached reference image shows this exact creature in three static views (front, side, back): keep the SAME design, proportions, colors, markings and overall size in every frame of the sheet. Do not redesign it.

BACKGROUND: one flat solid #FF00FF magenta, no gradient, no texture, no ground, no cast shadow, no vignette, no text, no labels, no numbers, no grid lines, no frame or border.

GRID: ${sheet.cols} columns x ${sheet.rows} rows of equal invisible cells (${cw}x${ch} px each). Exactly one creature per cell, one animation frame per cell, drawn left to right in time order. Every creature is centered horizontally in its cell with its feet (or lowest body point) standing on the same invisible ground line about 12% above the cell bottom, and keeps at least 8% empty magenta margin on all sides. No part of any creature may cross a cell edge or touch another creature. Empty cells stay solid magenta.

LAYOUT (top to bottom):
${blocks}

CONSISTENCY: the creature keeps exactly the same size, proportions, palette and line weight in all frames, only the pose changes between frames. In the same direction, standing, walking and hurt frames keep the body at the same scale and the same ground line. Consecutive frames differ by small, smooth pose changes so they loop cleanly (idle and walk loop). Directions e, se and ne must all face to the RIGHT of the picture (the game mirrors them for the left side).

DIRECTION RULES (every frame of a block, including HURT and DIE, keeps the block's direction): the body axis never rotates and the creature never turns to face the viewer. HURT keeps its own 2 animated frames but is only a short recoil backward along the facing line: the creature stays upright on its feet, never flips onto its back or belly, never shows its belly, never turns its head toward the viewer. DIE sinks or topples along the facing line and ends lying with the spine parallel to that line; it never rotates the body 90 degrees to lie sideways across the view. In the "ne" and "n" blocks the creature is seen from behind: no eyes, nose, mouth or face is visible in any frame of those blocks, hurt and die included.

STYLE: hand-painted dark ink-wash fantasy illustration with a clean pixel-art feel, muted slightly desaturated natural colors, soft light from the top left, one thick consistent dark outline (#1a1020, not pure black) around every creature, three shades per color area, crisp edges with no soft glow or halo against the magenta, no anti-aliased pink fringe.

DO NOT DRAW: glowing eyes, aura, magic effects, particles, ground, shadow, weapons, riders, other creatures, text, extra frames, speech bubbles, cute chibi proportions.`;
}

const aspectVi = (sheet) => sheet.w === sheet.h ? "1:1, ra 1254×1254 hoặc 1024×1024" : sheet.h > sheet.w ? "2:3, ra 1024×1536" : "3:2, ra 1536×1024";

export function buildDoc(info, sheet, plan, desc) {
  const F = info.frame, cw = Math.round(sheet.w / sheet.cols), ch = Math.round(sheet.h / sheet.rows);
  const dirs = sheet.dirs.map((d) => `${d} (${DIR_VI[d]})`).join(", ");
  const ref = info.staticFile ? `shared/assets/sprites/beast/${info.id}.png` : "(chưa có ảnh tĩnh: dùng ảnh Gemini / ComfyUI đã duyệt của loài)";
  return `# ${info.name} (\`${info.id}\`) - tờ ${sheet.id} / ${plan.length}: hướng ${dirs}

Đặc tả: \`docs/art/hon-thu-hoat-anh.md\`. File này sinh tự động bằng \`node tools/assets/beast-sheet-prompt.mjs --species ${info.id}\`; **không sửa tay**, sửa mẫu ở \`tools/assets/beast-sheet-prompt.mjs\`.

| Mục | Giá trị |
|---|---|
| Loài | ${info.name} (\`${info.id}\`), họ **${FAMILY_VI[info.family]}** (\`${info.family}\`), bậc **${tierNameOfFrame(F)}**, khung game ${F}×${F} |
| Tờ này | ${sheet.id}: ${dirs}; ảnh tỉ lệ **${aspectVi(sheet)}** (chuẩn ${sheet.w}×${sheet.h}); lưới ${sheet.cols} cột × ${sheet.rows} hàng, ô khoảng ${cw}×${ch} |
| Đính kèm | \`${ref}\` (ảnh tham chiếu nhân vật: 3 khung nam / đông / bắc) |
| Nền | #FF00FF phẳng, không chữ / nhãn / lưới (ChatGPT cho nền trong suốt thật thì cũng được: công cụ nhận cả hai) |

## Cách làm (tthoadev)
1. Mở cuộc trò chuyện ChatGPT **mới** cho mỗi tờ; đính kèm ảnh tham chiếu ở bảng trên (phóng ×4 nếu ChatGPT làm mờ ảnh nhỏ).${sheet.id === plan[0].id ? "" : `
   Tờ ${sheet.id} đính thêm **tờ ${plan[0].id} đã duyệt** làm tham chiếu phong cách, và thêm vào prompt câu: "Match the creature design, colors, size and line weight of the second attached sheet exactly."`}
2. Dán khối prompt dưới đây. **Không** cần chọn cỡ ảnh: công cụ (Codex image_gen) chỉ nhận tỉ lệ (${aspectVi(sheet)}). Cỡ ra khác ${sheet.w}×${sheet.h} (vd tờ 1:1 ra 1254×1254) vẫn **hợp lệ**, cutter tự chuẩn hóa.
3. Soát bằng mắt: mỗi ô đúng một con thú, đủ số khung theo hàng, đúng hướng nhìn, cùng cỡ, ô trống để trống, không chữ. Hỏng một hai khung thì bảo model vẽ lại **cả tờ** (vẽ lại từng ô làm lệch phong cách); đừng sửa tay trừ vết nhỏ.
4. Lưu ảnh gốc, giữ nguyên cỡ ra (không resize), vào thư mục artifact của phiên (không vào repo). Ghi model + prompt vào \`art/CREDITS.md\` khi ảnh được duyệt vào game.
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
- **Không vẽ** mắt phát sáng, hào quang, bóng, hiệu ứng: client tự tô (\`docs/art/quy-cach-isometric.md\`).
- **Nhất quán:** cùng cỡ, bảng màu, nét viền; chỉ đổi tư thế. Công cụ báo khung lệch cỡ / chân / vượt ô; báo nhiều thì vẽ lại tờ.
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  if (a.includes("--all")) {
    const keys = JSON.parse(readFileSync(MANIFEST, "utf8")).sprites.filter((e) => e.static && e.key.startsWith("beast_")).map((e) => e.key.slice(6));
    for (const id of keys) { const i = speciesInfo(id); console.log(`${id}\t${i.family}\t${i.frame}\t${tierNameOfFrame(i.frame)}`); }
  } else {
    const species = val("--species");
    if (!species) { console.error("Dùng: node tools/assets/beast-sheet-prompt.mjs --species <loài> [--out <thư mục>] [--desc \"<mô tả tiếng Anh>\"] | --all"); process.exit(2); }
    const info = speciesInfo(species);
    if (!info.frame) { console.error(`loài ${species} chưa có khung trong manifest`); process.exit(2); }
    const plan = sheetPlan(info.frame), out = val("--out"), desc = val("--desc") ?? info.desc;
    if (out) mkdirSync(out, { recursive: true });
    for (const sh of plan) {
      const md = buildDoc(info, sh, plan, desc), file = path.join(out ?? ".", `${species}-to${sh.id}.md`);
      if (out) { writeFileSync(file, md); console.log(`ghi ${file}`); } else console.log(md);
    }
  }
}
