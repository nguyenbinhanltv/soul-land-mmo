// Dùng chung cho đường làm hoạt ảnh vẽ thật của hồn thú (#688, docs/art/hon-thu-hoat-anh.md): bố cục tờ ảnh
// ChatGPT / Codex, thông tin loài, tên hướng / hoạt ảnh. Công cụ: beast-sheet-prompt / -cut / -preview / -fake.mjs.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT, SPRITES, MANIFEST, ISO_BEAST_SIZES, ISO_DIRS } from "./lib.mjs";

/** 5 hướng vẽ thật (sw / w / nw lật ngang se / e / ne, như ISO_FLIP). */
export const DIRS = ISO_DIRS;
export const DIR_VI = { s: "nam", se: "đông-nam", e: "đông", ne: "đông-bắc", n: "bắc" };
/** Hoạt ảnh và số khung (thứ tự cố định). */
export const ANIMS = [["idle", 4], ["walk", 6], ["attack", 6], ["hurt", 2], ["die", 4]];
export const ANIM_VI = { idle: "đứng", walk: "đi", attack: "đánh", hurt: "trúng đòn", die: "chết" };
export const FRAMES = Object.fromEntries(ANIMS);
/** Số cột của mọi tờ và sheet game (= số khung dài nhất). */
export const COLS = 6;
/** Hàng trong khối một hướng: mỗi dải một hàng; đứng + trúng đòn chung hàng để ô gần vuông. */
export const BANDS = [["idle", "hurt"], ["walk"], ["attack"], ["die"]];
export const BAND_ROWS = BANDS.length;
/** Vị trí (dải, cột đầu) của một hoạt ảnh trong khối hướng. */
export function animSlot(anim) {
  for (let b = 0; b < BANDS.length; b++) {
    let col = 0;
    for (const a of BANDS[b]) { if (a === anim) return { band: b, col }; col += FRAMES[a]; }
  }
  throw new Error(`không có hoạt ảnh ${anim}`);
}
/** Tên bậc theo cỡ khung (ISO_BEAST_SIZES). */
export const FRAME_TIER = ["Trắng / Vàng", "Tím / Đen", "Đỏ", "thú vương", "boss thế giới"];
export const tierNameOfFrame = (f) => FRAME_TIER[ISO_BEAST_SIZES.indexOf(f)] ?? `khung ${f}`;
/** Tờ ảnh ChatGPT chấp nhận 1024×1024, 1536×1024, 1024×1536. */
export const SHEET_SIZES = [[1024, 1024], [1536, 1024], [1024, 1536]];

/** Chia các hướng ra các tờ theo cỡ khung: khung ≤ 96 gộp 3 + 2 hướng (ô ≈ 170×128), khung lớn mỗi hướng một tờ (ô 256×256). */
export function sheetPlan(frame) {
  const mk = (id, dirs, w, h) => ({ id, dirs, w, h, cols: COLS, rows: dirs.length * BAND_ROWS });
  if (frame <= 96) return [mk("A", ["s", "se", "e"], 1024, 1536), mk("B", ["ne", "n"], 1024, 1024)];
  return DIRS.map((d, i) => mk("ABCDE"[i], [d], 1536, 1024));
}

/** Các ô của một tờ: { dir, anim, frame, col, row }; ô nào không thuộc hoạt ảnh nào là ô trống (cột thừa). */
export function sheetCells(sheet) {
  const cells = [];
  sheet.dirs.forEach((dir, di) => {
    for (const [anim, n] of ANIMS) {
      const { band, col } = animSlot(anim);
      for (let f = 0; f < n; f++) cells.push({ dir, anim, frame: f, col: col + f, row: di * BAND_ROWS + band });
    }
  });
  return cells;
}

/** Ô (col,row) của tờ trên ảnh thật cỡ w×h (chia theo cỡ thực, ảnh model hay lệch vài pixel so với đề). */
export function cellRect(sheet, col, row, w, h) {
  const cw = w / sheet.cols, ch = h / sheet.rows;
  return { x0: col * cw, y0: row * ch, x1: (col + 1) * cw, y1: (row + 1) * ch, w: cw, h: ch };
}

/** Mô tả tiếng Anh cho loài chưa có prompt ảnh tĩnh ComfyUI trong art/CREDITS.md (ảnh Gemini của boss). */
const DESC_OVERRIDE = {
  thai_than_cu_vien: "titan giant ape, massive dark grey-brown fur, grey stone armor plates on forearms and shoulders, broad chest, lower tusks like ivory, ancient battle scars",
};

/** Thông tin một loài: tên, họ hoạt ảnh, khung, mô tả (lấy từ prompt ảnh tĩnh ở art/CREDITS.md), có ảnh tĩnh chưa. */
export function speciesInfo(id) {
  const data = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
  const name = data.match(new RegExp(`\\{ id: "${id}",\\s+name: "([^"]+)"`))?.[1];
  if (!name) throw new Error(`loài ${id} không có trong BEASTS`);
  const entry = JSON.parse(readFileSync(MANIFEST, "utf8")).sprites.find((e) => e.key === `beast_${id}`);
  const frame = entry?.frame?.[0] ?? null;
  const sp = readFileSync(path.join(ROOT, "client", "src", "sprites.ts"), "utf8");
  let family = "quad";
  for (const m of sp.matchAll(/^\s+(bird|snake|insect|plant): \[([^\]]*)\]/gm)) if (m[2].includes(`"${id}"`)) family = m[1];
  let desc = DESC_OVERRIDE[id] ?? name;
  const cred = readFileSync(path.join(ROOT, "art", "CREDITS.md"), "utf8").split("\n").find((l) => l.startsWith(`| \`shared/assets/sprites/beast/${id}.png\``));
  const p = cred?.split("|")[4]?.match(/pixel art, (.*?), (?:full body|game creature sprite)/);
  if (p && !DESC_OVERRIDE[id]) desc = p[1].replace(/^one single /, "").replace(/, (?:wolf|[a-z ]*) body proportions/, "");
  const staticFile = path.join(SPRITES, "beast", `${id}.png`);
  return { id, name, family, frame, desc, staticFile: existsSync(staticFile) ? staticFile : null };
}
export const FAMILY_VI = { quad: "thú bốn chân", bird: "chim", snake: "rắn / bò sát", insect: "côn trùng", plant: "cây / hoa" };
