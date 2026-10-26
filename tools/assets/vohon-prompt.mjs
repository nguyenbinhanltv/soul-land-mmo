// Sinh prompt cho tthoadev (ChatGPT / Codex) vẽ chân dung / icon / pháp tướng của võ hồn v2 (#1087, epic #1020; docs/art/vo-hon-phong-cach.md mục 6.1).
//   node tools/assets/vohon-prompt.mjs --type portrait|icon|phaptuong --id <võ hồn> [--style-ref <ảnh đã duyệt>] [--out <thư mục>]
//   node tools/assets/vohon-prompt.mjs --all          (25 võ hồn: mã, tên, có vẽ pháp tướng mới không)
// Prompt TỰ SINH, không viết tay: khối STYLE + NEGATIVE chèn NGUYÊN VĂN từ mục 6; mô tả riêng lấy từ mục 4 (nguồn DUY NHẤT; giữ tiếng Việt, nhãn đổi sang
// tiếng Anh, như phuthe-sheet-prompt). KHÔNG yêu cầu lưới 64×64 hay số màu (model không tuân thủ, #1083): thay bằng "chunky low-resolution pixel look…";
// lưới, bảng màu, viền do `vohon-pixelize.mjs` làm sau. Ảnh dẫn chỉ nhận ảnh MỚI đã duyệt, không nhận ảnh cũ (PixelLab, Gemini, phụ thể / chân dung / icon đang chạy).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT } from "./lib.mjs";
import { TYPES, TYPE_VI, PT_DIRS } from "./vohon-pixelize-lib.mjs";
import { styleBlock, parseStyleBrief, vohonColors, LABEL_EN } from "./phuthe-sheet-lib.mjs";

/** 11 võ hồn vẽ pháp tướng MỚI (docs/art/vo-hon-phong-cach.md mục 1; 14 võ hồn còn lại giữ pháp tướng PixelLab). Test đối chiếu với bảng mục 4. */
export const PHAP_TUONG_MOI = ["cuu_tinh_that_sat_kiem", "ky_nhung_thong_thien_cuc", "nguyet_nhan", "can_khon_hon_nguyen_toa", "xuc_xich", "thien_can_bach_ngoc_dinh", "lam_ngan_thao", "hao_thien_chuy", "cuu_bao_luu_ly_thap", "pha_hon_thuong", "a_ngan"];
/** Ảnh cũ: không được làm ảnh dẫn (ảnh PixelLab, Gemini, phụ thể cũ, pháp tướng / chân dung / icon đang chạy). */
const OLD_REF = /(^|[\\/])(art[\\/]src[\\/](pixellab|gemini|lpc)|shared[\\/]assets[\\/]sprites[\\/](vohon|phaptuong|iso[\\/](portrait|item|skill|npc|thu)))([\\/]|$)/i;

/** Mô tả cho từng hướng của tờ pháp tướng (hướng nhìn của hình; tây là lật ngang nên mọi hướng nghiêng nhìn sang PHẢI). */
const DIR_EN = { s: "facing the viewer (front view)", se: "facing the lower right (three-quarter front view)", e: "facing right (side view)", ne: "facing the upper right (three-quarter back view)", n: "seen from behind (back view)" };

const LOOK = `LOOK (this replaces any request for a pixel grid, pixel count or color limit): chunky low-resolution pixel look, flat color clusters, simple shapes readable when shrunk. Large deliberate clusters of flat color with hard square edges; few broad color regions; no microtexture, no fine hatching, no tiny decorative marks, no fur or feather strands, no noise. Do not try to count pixels or colors: a post-processing tool converts your image to the final pixel grid and palette, so give it bold, simple shapes.`;

const TYPE_FORBID = {
  portrait: "border, frame, card, text, full body, extra scenery",
  icon: "tiny whole animal, full body, frame, card, text, background scenery",
  phaptuong: "solid opaque body is required: no translucent ghost look, no text, no frame, no human character, no ground, no cast shadow",
};
const BACKGROUND = {
  portrait: "BACKGROUND (overrides the line \"Transparent background\" of the STYLE block): a dark background (near #1a1020) with ONE restrained hard-edged aura of the spirit's accent color behind the spirit; no gradient glow, no outer border, no frame.",
  icon: "BACKGROUND: transparent (real alpha). If your tool cannot output alpha, use one flat solid #FF00FF magenta, with no gradient, no texture, no shadow.",
  phaptuong: "BACKGROUND: transparent (real alpha). If your tool cannot output alpha, use one flat solid #FF00FF magenta, with no gradient, no texture, no ground, no cast shadow, no labels. Leave a clear empty gap between neighboring views so none of them touch.",
};

const spirit = (id) => {
  const brief = parseStyleBrief(id); if (!brief) throw new Error(`võ hồn ${id} không có mô tả ở mục 4 của docs/art/vo-hon-phong-cach.md`);
  const c = vohonColors(id), L = brief.lines.map((l) => `- ${LABEL_EN[l.label] ?? l.label}: ${l.text}`);
  return { name: brief.name, text: `SPIRIT: ${brief.name} (${id}). The design brief below comes from the canonical design table and is written in Vietnamese: follow it exactly, keep every hex code as written, and use only the motifs listed in it (do not add any other motif).\n${L.join("\n")}${c ? `\n- Base colors in the game data: accent (col) ${c.col}, body (robe) ${c.robe}.` : ""}` };
};
const typeBlock = (type) => ({
  portrait: `ASSET TYPE: spirit portrait source for a small game UI portrait (the final art is a tiny square, so only a few big shapes survive). Square 1:1 image. Close-up of the spirit's FACE (eyes and beak / head, or the single most identifying feature), centered, filling about 70% of the frame, facing the viewer as if confronting them. Keep the key lit points (eyes, beak edge, core) LARGE and clearly separated from the rest; use at most two or three motif marks and make them thick. Not a full body; no wing / body sprawl filling the corners.`,
  icon: `ASSET TYPE: spirit icon source for a menu icon (final art 32x32 and 24x24). Square 1:1 image. ONE emblem: the single most identifying shape of the spirit (head, blade, hammer head, flower, flame core...), centered, filling about 80% of the frame, strong silhouette, 2 or 3 flat tones plus one bright accent. No scenery, no full-body animal, no motif other than the one that defines the silhouette.`,
  phaptuong: `ASSET TYPE: turnaround source for the spirit's colossal "Chân Thân" apparition (final art about 110 pixels tall per view). ONE image, wide landscape (about 5:2), containing FIVE views of the SAME spirit in one horizontal row, left to right: ${PT_DIRS.map((d, i) => `${i + 1} = ${d} (${DIR_EN[d]})`).join("; ")}. All five views have the same height and scale, stand on the same invisible ground line, and keep the same colors and details. Each view sits inside its own fifth of the width with an empty margin, so no two views touch. The spirit alone: no hero, no mannequin, no ground. Solid and heavy, rendered with hard-edged flat color regions.`,
})[type];

/** Hướng dẫn ảnh dẫn: chỉ nhận ảnh mới đã duyệt. Trả đoạn tiếng Anh, hoặc ném lỗi nếu ảnh cũ / không tồn tại. */
export function styleRefBlock(ref) {
  if (!ref) return "";
  const abs = path.resolve(ref);
  if (OLD_REF.test(abs.replace(ROOT, "")) || OLD_REF.test(ref)) throw new Error(`--style-ref ${ref} là ảnh cũ (PixelLab / Gemini / phụ thể, chân dung, icon, pháp tướng đang chạy): chỉ dùng ảnh MỚI đã được duyệt`);
  if (!existsSync(abs)) throw new Error(`--style-ref ${ref} không tồn tại`);
  return `STYLE REFERENCE: image 1 (attached) is an APPROVED image of this project's new art direction. Match only its line weight, how few and how large its color clusters are, and its overall mood. Do not copy its subject, pose, composition or any detail of it.`;
}

/** Prompt đầy đủ (tiếng Anh) cho `type` + `id`. `styleRef` = đường dẫn ảnh dẫn đã duyệt (tùy chọn). */
export function buildPrompt(type, id, { styleRef } = {}) {
  if (!TYPES.includes(type)) throw new Error(`--type phải là ${TYPES.join(" | ")}`);
  const sp = spirit(id), ref = styleRefBlock(styleRef);
  return [styleBlock(), `ADDITIONAL FORBIDDEN (this asset type): ${TYPE_FORBID[type]}.`, sp.text, typeBlock(type), BACKGROUND[type], LOOK, ref].filter(Boolean).join("\n\n");
}

/** Tài liệu Markdown (tiếng Việt) gồm cách làm + prompt cho `--out`. */
export function buildDoc(type, id, opt = {}) {
  const sp = spirit(id), prompt = buildPrompt(type, id, opt), dir = `art/src/${type === "phaptuong" ? "phap-tuong" : "vohon-v2"}/${id}`, stem = type === "phaptuong" ? "concept-turnaround" : type;
  const note = type === "phaptuong" && !PHAP_TUONG_MOI.includes(id) ? `\n> **Chú ý:** ${sp.name} KHÔNG nằm trong 11 võ hồn vẽ pháp tướng mới (\`vo-hon-phong-cach.md\` mục 1): pháp tướng PixelLab hiện có giữ nguyên. Chỉ vẽ nếu chủ repo đã giao.\n` : "";
  return `# ${sp.name} (\`${id}\`) - ${TYPE_VI[type]}: prompt vẽ RAW
${note}
File sinh tự động bằng \`node tools/assets/vohon-prompt.mjs --type ${type} --id ${id}${opt.styleRef ? " --style-ref <ảnh>" : ""}\`; **không sửa tay** (sửa \`docs/art/vo-hon-phong-cach.md\` rồi sinh lại).

## Cách làm
1. Mở cuộc trò chuyện **mới**. ${opt.styleRef ? "Đính ảnh dẫn đã duyệt (ảnh 1)." : "Không đính ảnh nào (không dùng ảnh cũ làm ảnh dẫn)."} Dán khối prompt dưới đây.
2. **Không** đòi model vẽ lưới pixel hay đếm màu: lưới, bảng màu và viền do công cụ làm.
3. Lưu RAW **nguyên byte** vào \`${dir}/${stem}-attemptN.png\` kèm \`${stem}-attemptN.prompt.txt\` (prompt thật đã gửi) và ghi \`NGUON.md\`.
4. Chạy \`npm run vohon:check -- raw <ảnh> --type ${type} --id ${id}\`. Có mục **CHẶN** thì vẽ lại; **NHẸ** vẫn chuyển được (xem \`docs/art/vo-hon-phong-cach.md\` mục 6.1).
5. Chuyển pixel: \`node tools/assets/vohon-pixelize.mjs --type ${type} --id ${id} --in <ảnh> --out <thư mục>\`; xem trước: \`node tools/assets/vohon-preview.mjs …\`.
6. **Tối đa 3 lượt** cho mỗi ảnh; mỗi lượt chỉ đổi MỘT thứ (vật chính, góc nhìn hoặc độ đơn giản), không dùng ảnh hỏng làm ảnh dẫn cho lượt sau. Quá 3 lượt thì dừng và báo orchestrator.

## Prompt (tiếng Anh cho model)
\`\`\`text
${prompt}
\`\`\`
`;
}

/** 25 võ hồn của bảng mục 4: [{ n, id, name }]. */
export function allIds(md = readFileSync(path.join(ROOT, "docs", "art", "vo-hon-phong-cach.md"), "utf8")) {
  const re = /^\*\*(\d+)\. (.+?)\*\* \(`([a-z_]+)`\)/;
  return md.split(/\r?\n/).map((l) => re.exec(l)).filter(Boolean).map((m) => ({ n: +m[1], name: m[2], id: m[3] }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  try {
    if (a.includes("--all")) for (const r of allIds()) console.log(`${r.n}\t${r.id}\t${r.name}\t${PHAP_TUONG_MOI.includes(r.id) ? "pháp tướng mới" : ""}`);
    else {
      const type = val("--type"), id = val("--id"), styleRef = val("--style-ref"), out = val("--out");
      if (!TYPES.includes(type) || !id) { console.error("Dùng: node tools/assets/vohon-prompt.mjs --type portrait|icon|phaptuong --id <võ hồn> [--style-ref <ảnh đã duyệt>] [--out <thư mục>]  |  --all"); process.exit(2); }
      if (out) { mkdirSync(out, { recursive: true }); const f = path.join(out, `${id}-${type}.md`); writeFileSync(f, buildDoc(type, id, { styleRef })); console.log(`ghi ${f}`); }
      else console.log(buildPrompt(type, id, { styleRef }));
    }
  } catch (e) { console.error(e.message); process.exit(2); }
}
