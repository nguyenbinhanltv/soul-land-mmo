// Sinh prompt + hướng dẫn cho tờ UI (BOARD / F / N / O / T / I / D) để tthoadev / worker vẽ bằng Codex image_gen (#880, theo dõi #877;
// docs/art/ui-kit.md "Luật vẽ AI", skill ui-kit). Bài học đọc từ art/src/ui-kit/lessons.md (ui-sheet-lessons.mjs); spec (tỉ lệ, bố cục,
// tên mảnh) từ art/src/ui-kit/ui-kit.json, nên đổi spec là prompt đổi theo.
//   node tools/assets/ui-sheet-prompt.mjs --kind F [--material muc|giay] [--style ${STYLE_KEYS.join("|")}] [--family "<họ icon>"] [--layout 6|9] [--shape 3:2|2:3] [--out <thư mục>]
//   thêm --style ngoc-kim|thuy-mac|hon-quang cho hướng thử (BOARD chờ duyệt); không có thì giữ hướng B hiện tại.
//   node tools/assets/ui-sheet-prompt.mjs --all --out <thư mục>      (một tệp mỗi loại)
// Không có --out thì in ra màn hình. Ghi `<loại>.md` (hướng dẫn + prompt + chú thích); không viết / sửa tay các tệp này.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadKit, expandKind } from "./ui-kit-lib.mjs";
import { lessonsFor, SHEET_KINDS } from "./ui-sheet-lessons.mjs";

/** Tỉ lệ khung cho model (không đòi số pixel: Codex image_gen chỉ nhận tỉ lệ). */
const ASPECT = { "3:2": ["landscape 3:2 aspect ratio", "3:2, ra 1536×1024"], "2:3": ["portrait 2:3 aspect ratio", "2:3, ra 1024×1536"], "1:1": ["square 1:1 aspect ratio", "1:1, ra 1254×1254 hoặc 1024×1024"] };

const BACKGROUND = "BACKGROUND: one flat solid #FF00FF magenta, no gradient, no texture, no ground, no cast shadow, no glow, no vignette, no frame or border around the image.";
const STYLE = "STYLE: pixel-art game interface with an isometric fantasy mood mixed with Chinese ink-wash xianxia; sharp pixel edges, palette of at most 32 colours, one thick consistent dark outline (#1a1020), pale bronze rim, no blur, no large gradients.";
/** Hướng nghệ thuật tu tiên (NHÁP CHỜ DUYỆT, docs/art/ui-kit.md mục "Hướng nghệ thuật tu tiên"): khối STYLE + AVOID theo hướng; mặc định (không --style) giữ nguyên STYLE cũ (hướng B). */
const COMMON_TX = "pixel-art game interface for a xianxia cultivation MMO (Douluo Dalu setting), sharp pixel edges, palette of at most 32 colours, one consistent dark outline (#1a1020), no blur, no large gradients. Restraint: generous empty space (liu bai), ornament only at the corners, the middle of each side and clasp points, the straight sides stay flat. Exactly one lit accent per piece or screen (spirit power); everything else recedes into dark. Rank by light, never by loud colour: stone grey, jade green, ice blue, violet with gold veins, gold with vermilion qi. At most 3 accent colours.";
const COMMON_AVOID = "long decorative lettering, plastic gradient drop shadows, double or triple borders, oversaturated glaring colours, cartoon-style icons, copying the artwork or symbols of another game";
export const STYLES = {
  "hon-quang": {
    vi: "Hồn Quang Tiên Môn (Thủy mặc làm gốc, ngọc–kim tiết chế, hồn quang và hồn hoàn Đấu La)",
    style: `STYLE: pixel-art xianxia cultivation MMO interface in an original Douluo Dalu setting, sharp pixel edges, at most 32 colours plus consistent dark outline #1a1020, no blur or large gradients. Role assignment: ink-wash architecture, blue-black ink-stone panels, aged ivory rice paper for reading, generous liu bai empty space, flat straight edges, ornament only at corners, side midpoints and clasps. Muted antique bronze metal, buttons like jade pendants or bronze plaques, never plastic pills. Exactly ONE luminous focal area in the entire screen: a thin soul-light accent confined inside the spirit-power bar; all buttons and selected slots stay matte. At most three accent colours outside rank markers. Rank markers ONLY: five small soul rings, white, yellow, violet, black, red in that order, never coloured slot backgrounds; distinguish tiers also by progressively notched corner silhouettes. Black rings need an ivory keyline. Cinnabar blank seals indicate completion. Original simplified martial-soul reliefs only at corners, faint auspicious clouds away from content. A signboard-like empty title plate, no calligraphic glyphs. Future motion: mist dissolve 200–300 ms, slow ring rotation on hover, respect reduced motion; this board is static.`,
    avoid: `AVOID: ${COMMON_AVOID}, rainbow panel fills, glowing rarity rings, multiple luminous focal areas, copied franchise emblems, readable stamp glyphs.`,
    material: {
      muc: { en: "INK material: blue-black ink-stone, matte antique bronze rim, flat uniform interior", vi: "Mực (đá mực lam đen, đồng cổ mờ)" },
      giay: { en: "PAPER material: aged ivory rice paper, restrained rough outer edge, matte antique bronze corners, blank cinnabar seal", vi: "Giấy (giấy dó ngà, góc đồng cổ, dấu chu sa trống)" },
    },
    board: { ink: "blue-black ink-stone with matte antique bronze corners", paper: "aged ivory rice paper with matte antique bronze corners and a blank cinnabar seal", rim: "matte antique bronze rim" },
  },
  "ngoc-kim": {
    vi: "Ngọc – Kim (tiên môn hoàng gia: tím than + lưu ly, vàng đồng chạm vân, nút ngọc bích)",
    style: `STYLE: ${COMMON_TX} Palette: deep indigo-navy and glazed liuli base, aged antique bronze-gold metal (never glaring yellow), jade-green and ice-blue gems, vermilion seal-red only for stamps, warnings and top rank. Materials: dark liuli glass with faint veins; frames of aged bronze-gold with cloud and dragon-scroll relief at corners only; buttons as jade pendants or gold plaques, never flat plastic pills; paper is aged ivory rice paper with torn edges and a vermilion seal. A thin faint qi wisp may trace the rim.`,
    avoid: `AVOID: ${COMMON_AVOID}, bright pure-yellow gold, bright fully saturated blue.`,
    material: {
      muc: { en: "INK material: dark liuli glass with faint veins, aged bronze-gold rim", vi: "Mực (lưu ly tối có vân, viền vàng đồng cổ)" },
      giay: { en: "PAPER material: aged ivory rice paper with torn edges, thin vermilion rim, jade roller ends", vi: "Giấy (giấy dó cổ mép rách, viền son mảnh)" },
    },
    board: { ink: "dark liuli glass, faint veins, aged bronze-gold rim", paper: "aged ivory rice paper, thin vermilion rim, jade roller", rim: "bronze-gold rim" },
  },
  "thuy-mac": {
    vi: "Thủy mặc – Chu sa (ẩn thế cao nhân: mực đen loang, nét cọ, giấy dó, dấu chu sa)",
    style: `STYLE: ${COMMON_TX} Palette: black ink wash base with soft bleeding edges, aged rice paper ivory, vermilion cinnabar (chu sa) seal-red for stamps and warnings, a single jade-green or ice-blue accent. Materials: ink-stone black with brush-stroke edges; thin dry-brush rim lines instead of metal; rice paper with rough torn edges; buttons as ink-stone tablets or jade pendants with a cinnabar seal, never flat plastic pills. Minimal, severe, a hidden-master mood; a faint cloud-wisp may sit in the background, never under text.`,
    avoid: `AVOID: ${COMMON_AVOID}, shiny metal, gold ornament everywhere, dense patterns.`,
    material: {
      muc: { en: "INK material: ink-stone black with brush-stroke edges, thin dry-brush rim line", vi: "Mực (đá mực đen, mép nét cọ, viền cọ khô mảnh)" },
      giay: { en: "PAPER material: rough rice paper with torn edges, thin cinnabar rim, ink-stone roller ends", vi: "Giấy (giấy dó thô mép rách, viền chu sa mảnh)" },
    },
    board: { ink: "ink-stone black, brush-stroke edges, thin dry-brush rim line", paper: "rough rice paper, thin cinnabar rim, ink-stone roller", rim: "dry-brush rim line" },
  },
};
const STYLE_KEYS = Object.keys(STYLES);
/** Khối STYLE (+ AVOID nếu có) theo hướng; không có hướng thì STYLE cũ. */
export const styleBlock = (style) => (style ? `${STYLES[style].style}
${STYLES[style].avoid}` : STYLE);

const MATERIAL = {
  muc: { en: "INK material: near-black wood with faint ink-wash grain, pale bronze rim", vi: "Mực (nền tối, viền đồng nhạt)" },
  giay: { en: "PAPER material: ivory rice paper, thin vermilion rim, wooden roller ends", vi: "Giấy (giấy dó ngà, viền son mảnh)" },
};
/** Bài học ghi chất liệu hướng B cũ: bỏ khi vẽ theo `--style` để không mâu thuẫn với khối STYLE. */
const OLD_MATERIAL = /bronze rim|near-black wood|wooden roller/;
/** Chất liệu theo hướng (nếu có) rồi mới tới mặc định. */
const materialOf = (o) => (o.style ? STYLES[o.style].material : MATERIAL)[o.material ?? "muc"];
const MATERIAL_KINDS = ["F", "N", "T", "O"];
const NOUN_EN = { F: "panel frame", N: "button and tab", O: "item and skill slot", T: "bar and input widget", I: "icon", D: "loose decoration" };

/** Mô tả tiếng Anh của từng mảnh (theo tên trong ui-kit.json); mảnh không có mô tả thì dùng tên. */
const PIECE_EN = {
  khung_muc_lon: "large ink-material panel frame", khung_muc_nho: "small ink-material panel frame", khung_giay_lon: "large paper-material panel frame",
  khung_giay_nho: "small paper-material panel frame", khung_tooltip: "tooltip frame (compact, ink material)", khung_toast: "toast frame (wide and low, ink material)",
  nut_chinh_thuong: "primary button (vermilion), normal", nut_chinh_ro: "primary button, hover (lighter rim)", nut_chinh_nhan: "primary button, pressed (sunk, darker)",
  nut_chinh_tat: "primary button, disabled (desaturated, flat)", nut_chinh_chon: "primary button, selected (bright jade rim)",
  nut_phu_thuong: "secondary button (dark ink), normal", nut_phu_ro: "secondary button, hover", nut_phu_nhan: "secondary button, pressed", nut_phu_tat: "secondary button, disabled",
  nut_phu_chon: "secondary button, selected", tab_thuong: "tab, not selected (open bottom edge)", tab_chon: "tab, selected (open bottom edge, lit)",
  o_trong: "empty item slot", o_co: "item slot holding an item (a plain neutral gem shape as the item)", o_chon: "selected item slot",
  o_hiem_1: "rarity 1 item slot border (plain)", o_hiem_2: "rarity 2 item slot border", o_hiem_3: "rarity 3 item slot border", o_hiem_4: "rarity 4 item slot border", o_hiem_5: "rarity 5 item slot border (most ornate)",
  ky_nang_san_sang: "skill slot, ready", ky_nang_hoi_chieu: "skill slot, on cooldown", ky_nang_khoa: "skill slot, locked", ky_nang_thieu_hon_luc: "skill slot, not enough spirit power",
  thanh_khung_sinh: "horizontal bar frame for the health bar", thanh_khung_hon: "horizontal bar frame for the spirit-power bar", thanh_khung_kn: "horizontal bar frame for the experience bar",
  thanh_do_sinh: "health bar fill (red, flat)", thanh_do_hon: "spirit-power bar fill (blue, flat)", thanh_do_kn: "experience bar fill (gold, flat)",
  vach_chia: "thin bar divider tick", thanh_cuon: "scrollbar track with a thumb", o_nhap: "empty text input box",
};

/** Ảnh đính kèm theo THỨ TỰ CỐ ĐỊNH: { n, en, vi, required }. */
export function referencesFor(kind, style) {
  const board = { required: true, en: "the approved BOARD style image: copy its materials, rim colour, outline weight and mood, never its layout", vi: "**BOARD đã duyệt** (#881): phong cách, chất liệu, viền đồng, độ dày nét" };
  const palette = { required: true, en: "a palette swatch image: use only these colours (plus the outline)", vi: "ảnh **swatch bảng màu** (từ `art/palette.gpl`)" };
  const same = { required: false, en: "an approved sheet of the same family that passed the check: only for matching line weight and palette, never copy its pieces", vi: "(tùy chọn) **một tờ cùng họ đã qua `ui:check` không có mục chặn** (chỉ để khớp nét / bảng màu); **không** dùng tờ lỗi" };
  const c2 = { required: false, en: "the approved ink-material reference pieces (the C2 panels): match their frame, rim and grain", vi: "(tùy chọn) 3 mảnh C2 đã duyệt (`nv6_nen_bup_be`, `thong_bao_len_cap`, `khung_tab_nhan_vat`) làm chuẩn **Mực**" };
  const shot = { required: false, en: "a screenshot of the current game HUD, character panel, bag and dialog, to know which screens the kit must serve (not for style)", vi: "(tùy chọn) ảnh chụp hiện trạng 1366×768 của HUD / Nhân vật / Túi / hộp thoại (`client/scripts/ui-shots.mjs`), chỉ để biết màn nào cần phục vụ" };
  if (style) {
    // Hướng tu tiên: không đính ảnh hướng B (C2, BOARD #881, bảng màu cũ) để khỏi kéo model về hướng cũ; màu do khối STYLE quyết.
    const own = { required: true, en: "the approved BOARD image of this same direction: copy its materials, rim colour, outline weight and mood, never its layout", vi: `**BOARD đã duyệt của hướng \`${style}\`** (sinh bằng \`--kind BOARD --style ${style}\`, chủ repo chọn); chưa có thì dừng, vẽ BOARD của hướng trước; **không** dùng BOARD hướng cũ` };
    const refs2 = kind === "BOARD" ? [shot] : [own, same];
    return refs2.map((r, i) => ({ ...r, n: i + 1 }));
  }
  const refs = kind === "BOARD" ? [palette, c2, shot] : [board, palette, same];
  return refs.map((r, i) => ({ ...r, n: i + 1 }));
}

/** Khối `LESSONS` (từ art/src/ui-kit/lessons.md) cho loại tờ; rỗng nếu không có bài nào. */
export function lessonsBlock(kind, lessons = lessonsFor(kind)) {
  return lessons.length ? `\n\nLESSONS (learned from earlier sheets, follow every line):\n${lessons.map((l) => `- ${l.text}`).join("\n")}` : "";
}

/** Chọn bố cục: --layout là tổng số mảnh (vd D: 6 hoặc 9); mặc định bố cục đầu. */
export function pickKindLayout(kind, total) {
  const l = total ? kind.layouts.find((x) => x.reduce((a, b) => a + b, 0) === total) : kind.layouts[0];
  if (!l) throw new Error(`tờ ${kind.id} không có bố cục ${total} mảnh (có: ${kind.layouts.map((x) => x.reduce((a, b) => a + b, 0)).join(", ")})`);
  return l;
}

/** Mô tả mảnh; tờ F vẽ mọi khung theo chất liệu chọn (tên mảnh chỉ là chỗ đứng: lớn / nhỏ / tooltip / toast), không cố định Mực + Giấy. */
function pieceEn(kindId, name, material) {
  const en = PIECE_EN[name] ?? name.replace(/_/g, " ");
  if (kindId !== "F") return en;
  const mat = material === "giay" ? "paper" : "ink";
  return en.replace(/(ink|paper)-material/, `${mat}-material`).replace(/, ink material\)/, `, ${mat} material)`);
}

/** Danh sách mảnh theo thứ tự đọc, mỗi dòng `hàng.cột  mô tả`. */
function piecesBlock(kind, layout, material) {
  const lines = [];
  let k = 0;
  layout.forEach((n, r) => {
    for (let c = 0; c < n; c++, k++) { const name = kind.pieces[k].name; lines.push(`  ${r + 1}.${c + 1}  ${pieceEn(kind.id, name, material)}`); }
  });
  return lines.join("\n");
}

/** Prompt tiếng Anh cho model. */
export function buildPrompt(kind, o = {}) {
  const shape = o.shape ?? (kind.board ? "3:2" : kind.shapes[0]), [aspect] = ASPECT[shape], mat = materialOf(o), bd = o.style ? STYLES[o.style].board : { ink: "near-black wood, ink-wash grain, pale bronze rim", paper: "ivory rice paper, thin vermilion rim, wooden roller", rim: "bronze rim" }, selectedLessons = o.lessons ?? lessonsFor(kind.id, undefined, o.family), lessons = lessonsBlock(kind.id, o.style ? selectedLessons.filter((l) => !OLD_MATERIAL.test(l.text)) : selectedLessons);
  if (kind.board) {
    if (o.style === "hon-quang") {
      // BOARD v3 có bố cục và nền riêng; không kéo bài học tờ cắt / BOARD cũ vào.
      const boardLessons = lessonsBlock(kind.id, lessonsFor(kind.id).filter((l) => !OLD_MATERIAL.test(l.text) && !/magenta|attached approved reference|two panels|podium hierarchy|hinted village/.test(l.text)));
      return `One illustration, ${aspect}: BOARD v3, a single approval screen and style reference, not a sheet to cut.
LAYOUT: one aligned 4-pixel logical grid, equal gutters, no overlaps. Left fifth: one HUD stats frame with three bars and exactly six menu buttons in two columns of three. Upper middle: one INK interaction panel with a regular 3 by 2 grid of empty item slots. Upper right: one INK ranking sample screen with an empty title plate, three empty category tabs, exactly five equal-height leaderboard rows; each row has a small blank rank medallion, a blank name bar and a blank score bar, plus a personal-rank footer. Lower middle: one PAPER reading dialog with three blank text bars and two matte buttons. Lower right: one item-slot comparison strip, exactly five identical neutral gem item slots, each showing one small soul ring at its upper-right corner: white, yellow, violet, black with ivory keyline, red, left to right; same item and size, progressively notched corners: slot one has plain square corners, slot two one broad cut corner, slot three two broad cut corners, slot four three broad cut corners, slot five four broad cut corners; make these silhouettes visibly distinct in grayscale while keeping the same outer cell size. Each of these five comparison slots MUST contain a clearly visible identical opaque silver diamond gem centered in the slot, not an empty slot; ring colours must not tint the gem. Bottom: exactly eight equal square hotbar slots in one straight row, all within the screen margin.
INK: ${bd.ink}. PAPER: ${bd.paper}. Shared corner geometry, border thickness and ${bd.rim}; interiors flat and uniform. Decoration only at corners and side midpoints; straight stretchable sides have one or two flat colours.
ABSOLUTELY no text, numbers, letters, logos or readable glyphs; all titles, names, ranks, scores and button labels are empty bars. Rings and original geometric reliefs are pictorial marks only.
${styleBlock(o.style)}
Background: flat dark ink navy, no detailed village or scenery. Keep a generous empty margin around all UI, consistent pixel grid, light and line weight everywhere.${boardLessons}`;
    }
    return `One illustration, ${aspect}: a sample game screen for a pixel-art xianxia MMO user interface, drawn as an approval image and style reference.
Show: (1) a left HUD column with a stats frame and six menu buttons; (2) a "character" panel and a "bag" panel side by side, INK material (${bd.ink}); (3) one PAPER material dialog box (${bd.paper}) at the lower middle; (4) one vermilion primary button and one dark secondary button; (5) a row of skill slots along the bottom edge.
ABSOLUTELY no text, numbers, letters, logos or symbols anywhere; where a label would go draw an empty bar or a flat block of colour.
Frames: ornament only at the four corners and the middle of each side; the straight side between is a flat band of one or two colours with no pattern along it. INK and PAPER share the same corner set, border thickness and ${bd.rim}; they differ only in fill and text colour.
${styleBlock(o.style)}
Outside the screen the background is one flat solid colour. Behind the panels hint a dark old village, only suggested, no detail. Consistent light and line weight in every frame.${lessons}`;
  }
  const layout = pickKindLayout(kind, o.layout), total = layout.reduce((a, b) => a + b, 0);
  const family = kind.id === "I" ? ` The icon family of this sheet: ${o.family ?? "menu (character, bag, formation, alliance, friends, auto-hunt, settings, world map)"}. Draw exactly ${total} different icons of that one family.` : "";
  const mate = !MATERIAL_KINDS.includes(kind.id) ? "" : `\nMATERIAL: ${mat.en}${kind.id === "F" ? "; every frame on this sheet uses this one material" : ""}.`;
  const rows = layout.map((n, i) => `row ${i + 1}: ${n} piece${n > 1 ? "s" : ""}`).join("; ");
  return `A sheet of ${total} separate ${NOUN_EN[kind.id]} pieces for a pixel-art game user interface, ${aspect}. Each piece is its own separate object on the sheet.${family}
LAYOUT: ${layout.length} rows, ${rows}; read left to right, top to bottom, in exactly this order:
${piecesBlock(kind, layout, o.material ?? "muc")}
${kind.stretch ? "Each frame-like piece must stretch cleanly: ornament only at the four corners and the middle of each side, the straight sides are a flat one or two colour band, the inside is a flat uniform fill.\n" : ""}${BACKGROUND}
${styleBlock(o.style)}${mate}
DO NOT DRAW: text, numbers, letters, logos, labels, glow, drop shadow, particles, characters, hands, extra pieces, a border around the sheet.${lessons}`;
}

const refsVi = (refs) => refs.map((r) => `(${r.n}) ${r.vi}`).join("\n   ");

/** Tài liệu Markdown (hướng dẫn tiếng Việt + prompt) cho một loại tờ. */
export function buildDoc(kind, o = {}) {
  const shape = o.shape ?? (kind.board ? "3:2" : kind.shapes[0]), [, aspectVi] = ASPECT[shape], refs = referencesFor(kind.id, o.style), mat = materialOf(o);
  const layout = kind.board ? null : pickKindLayout(kind, o.layout), total = layout?.reduce((a, b) => a + b, 0);
  const file = kind.board ? (o.style ? `candidates/${o.style}/BOARD` : "BOARD") : `to${kind.id}`;
  return `# Tờ ${kind.id}: ${kind.title}${o.family && kind.id === "I" ? ` (họ ${o.family})` : ""}

Quy trình: skill \`ui-kit\` (\`.claude/skills/ui-kit/SKILL.md\`), luật vẽ \`docs/art/ui-kit.md\`. File này sinh tự động bằng \`node tools/assets/ui-sheet-prompt.mjs --kind ${kind.id}\`; **không sửa tay** (thiếu ý thì thêm bài học vào \`art/src/ui-kit/lessons.md\` hoặc sửa mẫu \`ui-sheet-prompt.mjs\`, rồi sinh lại).

| Mục | Giá trị |
|---|---|
| Loại | ${kind.id}: ${kind.title} |
| Ảnh | tỉ lệ **${aspectVi}** (không đòi số pixel; công cụ Codex không có ô chọn cỡ, cỡ nào hợp tỉ lệ cũng nhận) |
| Bố cục | ${layout ? `${layout.length} hàng: ${layout.join(" + ")} = ${total} mảnh, đọc trái → phải, trên → dưới` : "một ảnh, **không cắt** (chỉ để duyệt và làm tham chiếu)"} |
| Chất liệu | ${kind.board ? "Mực + Giấy" : MATERIAL_KINDS.includes(kind.id) ? mat.vi : "–"} |
| Hướng | ${o.style ? `**${o.style}**: ${STYLES[o.style].vi} (**nháp chờ duyệt**, docs/art/ui-kit.md mục "Hướng nghệ thuật tu tiên")` : "mặc định (hướng B hiện tại)"} |
| Nền | ${kind.board && o.style === "hon-quang" ? "mực lam đen phẳng (BOARD mẫu màn, không cắt)" : "#FF00FF phẳng, không chữ, không bóng"} |

## Cách làm
1. Mở cuộc trò chuyện **mới** cho mỗi tờ; đính ảnh tham chiếu **theo đúng thứ tự**:
   ${refsVi(refs)}
2. Dán khối prompt dưới đây. Không chọn cỡ ảnh.
3. Lưu ảnh gốc **nguyên byte** (không resize) vào \`art/src/ui-kit/${file}.png\`${kind.board && o.style ? ` và prompt thật đã gửi vào \`art/src/ui-kit/${file}.prompt.txt\`; không ghi đè BOARD đã duyệt. Chạy \`npm run ui:check -- art/src/ui-kit/${file}.png --kind BOARD --out <thư mục ngoài repo>\` (BOARD chỉ kiểm cỡ; tự soát lưới, chất liệu và chữ bằng mắt)` : kind.board ? "" : ` rồi chạy \`npm run ui:check -- art/src/ui-kit/${file}.png --out <thư mục ngoài repo>\``}. Mở **tờ liên hệ** (xanh đạt, vàng nhẹ, đỏ chặn).
4. Chỉ tờ này hỏng thì vẽ lại **chỉ tờ này**, tối đa **3 lượt**; chọn lượt ít mục chặn / nhẹ nhất rồi mắt. Mỗi lượt đổi **một** thứ. **Không** dùng tờ hỏng làm tham chiếu.
5. Đưa orchestrator đường dẫn tờ + prompt thật đã gửi.

## Prompt (tiếng Anh cho model)
\`\`\`text
${buildPrompt(kind, o)}
\`\`\`

## Chú thích (tiếng Việt)
- **Không chữ, số, logo** trong ảnh (lỗi chặn nếu đọc được); chữ do phông game vẽ.
- Mảnh cách nhau ≥ 5% cạnh tờ, không sát mép, không đổ bóng ra nền.
- Số mảnh và số hình mỗi hàng phải **đúng** bố cục; hình dính nhau hoặc thiếu mảnh là lỗi chặn.
`;
}

/** Các tệp `[tên, nội dung]` cho các loại tờ. */
export function sheetDocs(kit, kindIds, o = {}) {
  return kindIds.map((id) => [`${id}.md`, buildDoc(expandKind(kit, id), o)]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
    const kit = loadKit(), kind = val("--kind")?.toUpperCase(), all = a.includes("--all"), material = val("--material") ?? "muc", style = val("--style");
    if ((!kind && !all) || (kind && !SHEET_KINDS.includes(kind)) || !MATERIAL[material] || (style && !STYLES[style])) {
      console.error(`Dùng: node tools/assets/ui-sheet-prompt.mjs (--kind ${SHEET_KINDS.join("|")} | --all) [--material muc|giay] [--style ${STYLE_KEYS.join("|")}] [--family "<họ icon>"] [--layout 6|9] [--shape 3:2|2:3] [--out <thư mục>]`);
      process.exit(2);
    }
    const o = { material, style, family: val("--family"), layout: val("--layout") ? +val("--layout") : undefined, shape: val("--shape") };
    const out = val("--out");
    if (out) mkdirSync(out, { recursive: true });
    for (const [name, md] of sheetDocs(kit, all ? SHEET_KINDS : [kind], o)) {
      if (out) { writeFileSync(path.join(out, name), md); console.log(`ghi ${path.join(out, name)}`); } else console.log(md);
    }
  } catch (e) { console.error(e.message); process.exit(2); }
}
