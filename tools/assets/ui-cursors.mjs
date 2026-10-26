// C12: Codex vẽ cursor bằng hình học pixel, không model ảnh hay asset ngoài.
// node tools/assets/ui-cursors.mjs [--register]: PNG32/64, tuỳ chọn append manifest/CREDITS.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Img, encodePng, ROOT, MANIFEST } from "./lib.mjs";

const colors = {
  ink: [26, 16, 32, 255], paper: [236, 226, 200, 255], light: [255, 249, 230, 255],
  gold: [216, 174, 88, 255], red: [230, 94, 96, 255], blue: [108, 195, 210, 255],
};
const kinds = ["default", "attack", "talk", "pickup", "blocked"];

/** Tô đa giác theo tâm pixel, trả ảnh pixel alpha nhị phân. */
function polygon(img, pts, col) {
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[j];
      if ((ay > y + 0.5) !== (by > y + 0.5) && x + 0.5 < (bx - ax) * (y + 0.5 - ay) / (by - ay) + ax) inside = !inside;
    }
    if (inside) img.set(x, y, col);
  }
}

function render(kind) {
  const im = new Img(32, 32), poly = (p, c) => polygon(im, p, colors[c]);
  poly([[2, 2], [2, 25], [8, 19], [12, 29], [17, 27], [12, 17], [22, 17]], "ink");
  poly([[4, 7], [4, 20], [9, 16], [14, 26], [15, 26], [10, 15], [17, 15]], "paper");
  poly([[4, 7], [4, 19], [6, 17], [6, 10]], "light");
  if (kind === "attack") {
    poly([[28, 3], [29, 11], [22, 20], [25, 23], [22, 26], [19, 23], [15, 28], [12, 25], [17, 20], [14, 17], [17, 14], [20, 17]], "ink");
    poly([[27, 6], [27, 10], [20, 19], [18, 17]], "light");
    poly([[16, 17], [18, 16], [23, 23], [22, 24]], "gold");
    poly([[18, 22], [20, 23], [15, 26], [14, 25]], "gold");
  } else if (kind === "talk") {
    poly([[16, 15], [30, 15], [30, 26], [24, 26], [19, 31], [19, 26], [16, 26]], "ink");
    poly([[18, 17], [28, 17], [28, 24], [23, 24], [21, 27], [21, 24], [18, 24]], "paper");
    for (const x of [19, 22, 25]) for (let y = 20; y < 22; y++) im.set(x, y, colors.ink);
  } else if (kind === "pickup") {
    poly([[18, 14], [28, 14], [26, 19], [30, 23], [30, 29], [16, 29], [16, 23], [20, 19]], "ink");
    poly([[20, 16], [26, 16], [24, 20], [28, 24], [28, 27], [18, 27], [18, 24], [22, 20]], "gold");
    poly([[21, 22], [23, 22], [23, 26], [20, 26]], "light");
    poly([[20, 18], [26, 18], [26, 20], [20, 20]], "ink");
  } else if (kind === "blocked") {
    for (let y = 13; y < 31; y++) for (let x = 13; x < 31; x++) {
      const r = Math.hypot(x - 21.5, y - 21.5);
      if (r <= 9 && r >= 4.5) im.set(x, y, r > 7.5 || r < 5.5 ? colors.ink : colors.red);
      if (r < 8 && Math.abs(x - y) <= 2) im.set(x, y, Math.abs(x - y) === 2 ? colors.ink : colors.red);
    }
  }
  return im;
}

for (const kind of kinds) {
  const small = render(kind);
  for (const size of [32, 64]) {
    const im = new Img(size, size), scale = size / 32;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) im.set(x, y, small.get(Math.floor(x / scale), Math.floor(y / scale)));
    writeFileSync(path.join(ROOT, `shared/assets/sprites/iso/ui/cursor_${kind}_${size}.png`), encodePng(im));
  }
}

if (process.argv.includes("--register")) {
  const entries = kinds.flatMap((k) => [32, 64].map((n) => `ui_cursor_${k}_${n}`));
  const raw = readFileSync(MANIFEST, "utf8"), have = new Set(JSON.parse(raw).sprites.map((x) => x.key));
  const added = entries.filter((k) => !have.has(k));
  if (added.length) {
    const at = raw.lastIndexOf("\n  ]");
    if (at < 0) throw new Error("Không tìm thấy cuối mảng manifest; không ghi file.");
    writeFileSync(MANIFEST, raw.slice(0, at) + ",\n" + added.map((k) => `    { "key": "${k}", "iso": true }`).join(",\n") + raw.slice(at));
  }
  const credits = path.join(ROOT, "art/CREDITS.md"), text = readFileSync(credits, "utf8");
  const rows = entries.filter((k) => !text.includes(`\`${k}\``)).map((k) => `| \`shared/assets/sprites/iso/ui/${k.slice(3)}.png\` | \`${k}\` | Codex (tthoadev), vẽ bằng code | Không dùng model ảnh; công cụ \`tools/assets/ui-cursors.mjs\`, hình học pixel gốc | C12 #598; PNG32/64, hotspot logic (2,2); 2026-10-26 |`);
  if (rows.length) {
    const at = text.indexOf("\n## ", text.indexOf("## Asset tự vẽ") + 1);
    if (at < 0) throw new Error("Không tìm thấy nhóm CREDITS; không ghi file.");
    writeFileSync(credits, text.slice(0, at) + "\n" + rows.join("\n") + "\n" + text.slice(at));
  }
}
console.log("C12: đã vẽ 5 cursor PNG32/64 bằng code.");
