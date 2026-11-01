// Xuất mẫu duyệt #1596 ngoài repo; không nhập manifest hoặc ảnh game.
// node tools/assets/achv-icon-preview.mjs <thư mục đầu ra>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { ROOT, readPng, decodePng, encodePng, Img } from "./lib.mjs";
import { cutUiSheet } from "./ui-sheet-cut.mjs";
import { fitFrame } from "./menu-icon-import.mjs";

export function buildAchvPreview() {
  const dir = path.join(ROOT, "art/src/ui-kit/achv-1596");
  const source = JSON.parse(readFileSync(path.join(dir, "nguon.json"), "utf8"));
  for (const [file, hash] of [[source.raw, source.raw_sha256], [source.prompt, source.prompt_sha256]]) {
    if (createHash("sha256").update(readFileSync(path.join(dir, file))).digest("hex") !== hash) throw new Error(`SHA256 lệch: ${file}`);
  }
  const raw = readPng(path.join(dir, source.raw));
  if (raw.w !== 1254 || raw.h !== 1254) throw new Error("RAW phải giữ native 1254×1254");
  // Cutter chuẩn dùng nền khóa: chỉ đổi bản làm việc trong RAM, giữ nguyên byte RAW.
  const keyed = new Img(raw.w, raw.h);
  for (let y = 0; y < raw.h; y++) for (let x = 0; x < raw.w; x++) {
    const p = raw.get(x, y);
    keyed.set(x, y, p[3] < 128 ? [255, 0, 255, 255] : [...p.slice(0, 3), 255]);
  }
  const cut = cutUiSheet({ img: keyed, name: "achv-1596", kindId: "I", prefix: "achv_", soft: true });
  const files = new Map();
  for (const m of source.mapping) {
    const piece = cut.files.get(`2x/ui2_achv_icon_${String(m.index).padStart(2, "0")}.png`);
    if (!piece) throw new Error(`Thiếu ô ${m.index}`);
    for (const size of [24, 32]) files.set(`${m.key}-${size}.png`, encodePng(fitFrame(decodePng(piece), size)));
  }
  return { files, source, check: cut.check, report: cut.report };
}

function main() {
  if (!process.argv[2]) throw new Error("Cần thư mục đầu ra ngoài repo");
  const out = path.resolve(process.argv[2]);
  const relative = path.relative(ROOT, out);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) throw new Error("Mẫu duyệt phải ở ngoài repo");
  const { files, source, check, report } = buildAchvPreview();
  mkdirSync(out, { recursive: true });
  for (const [name, bytes] of files) writeFileSync(path.join(out, name), bytes);
  // Ảnh so sánh độc lập: hàng đầu là bộ menu đã duyệt; bảy hàng dưới theo mapping.
  const comparison = new Img(900, 8 * 120);
  const backgrounds = [[33, 27, 37, 255], [232, 220, 192, 255], null];
  for (let y = 0; y < comparison.h; y++) for (let x = 0; x < comparison.w; x++) {
    const bg = backgrounds[Math.floor(x / 300)];
    comparison.set(x, y, bg ?? ((Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? [238, 238, 238, 255] : [170, 170, 170, 255]));
  }
  const paint = (img, dx, dy, scale = 1) => {
    for (let y = 0; y < img.h * scale; y++) for (let x = 0; x < img.w * scale; x++) {
      const p = img.get(Math.floor(x / scale), Math.floor(y / scale));
      if (p[3] >= 128) comparison.set(dx + x, dy + y, p);
    }
  };
  for (let bg = 0; bg < 3; bg++) {
    for (const [n, key] of ["achv", "arena", "quest", "bicanh", "bag"].entries()) paint(readPng(path.join(ROOT, `shared/assets/sprites/iso/gi/menu_${key}_1x.png`)), bg * 300 + 20 + n * 52, 48);
    source.mapping.forEach((m, row) => {
      const small = decodePng(files.get(`${m.key}-24.png`)), large = decodePng(files.get(`${m.key}-32.png`));
      paint(small, bg * 300 + 24, (row + 1) * 120 + 48);
      paint(large, bg * 300 + 80, (row + 1) * 120 + 44);
      paint(large, bg * 300 + 160, (row + 1) * 120 + 12, 3);
    });
  }
  writeFileSync(path.join(out, "so-sanh-icon-thanh-tuu.png"), encodePng(comparison));
  const url = (name) => `data:image/png;base64,${readFileSync(path.join(out, name)).toString("base64")}`;
  const samples = source.mapping.map((m) => `<tr><th>${m.label}</th>${["ink", "paper", "checker"].map((bg) => `<td class="${bg}"><img width="24" height="24" src="${url(`${m.key}-24.png`)}"><img width="32" height="32" src="${url(`${m.key}-32.png`)}"><img width="96" height="96" src="${url(`${m.key}-32.png`)}"></td>`).join("")}</tr>`).join("");
  const controls = ["achv", "arena", "quest", "bicanh", "bag"].map((key) => `<img width="24" height="24" src="data:image/png;base64,${readFileSync(path.join(ROOT, `shared/assets/sprites/iso/gi/menu_${key}_1x.png`)).toString("base64")}">`).join("");
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Duyệt icon Thành Tựu #1596</title><style>body{font:16px system-ui;margin:24px;background:#eee6d4;color:#211b25}h1{font-size:24px}p{max-width:900px;line-height:1.5}table{border-collapse:collapse;width:100%}th,td{padding:12px;border:1px solid #b08a4a;text-align:left}img{image-rendering:pixelated;vertical-align:middle;margin:8px}.ink{background:#211b25;color:#e8dcc0}.paper{background:#e8dcc0}.checker{background:repeating-conic-gradient(#aaa 0% 25%,#eee 0% 50%) 0/16px 16px}.scroll{overflow:auto}.controls{padding:12px}.raw{max-width:630px;width:100%;height:auto}small{display:block}</style><h1>Duyệt mỹ thuật · Thành Tựu #1596</h1><p><b>CHƯA NHẬP GAME · PR NHÁP #1625.</b> Bảy mẫu mới cần chủ repo duyệt trước khi đăng ký manifest và nối client. Mỗi ô dưới: 24px thật, 32px thật, phóng 3× bản 32px. Huy hiệu luôn đi kèm chữ “Đã nhận”.</p><p>Bộ menu đã duyệt để so nét, bảng màu và độ lớn:</p><div class="controls ink">${controls}</div><div class="controls paper">${controls}</div><div class="scroll"><table><thead><tr><th>Nhóm / huy hiệu</th><th>Mực</th><th>Giấy</th><th>Trong suốt</th></tr></thead><tbody>${samples}</tbody></table></div><p>RAW native ${source.native.join("×")} giữ nguyên byte. Bảy ô đầu dùng cho mẫu; chín ô cuối chỉ đối chiếu. Công cụ cắt không nới checker, không dùng --force. Đây là trang duyệt asset, chưa phải ảnh chụp màn game sau nhập.</p><details><summary>Xem RAW và nguồn</summary><p>Codex builtin OpenAI image_gen.imagegen · Điều khoản đầu ra OpenAI, không CC0.<small>SHA256 RAW: ${source.raw_sha256}</small><small>SHA256 prompt: ${source.prompt_sha256}</small></p></details></html>`;
  writeFileSync(path.join(out, "duyet-icon-thanh-tuu.html"), html);
  console.log(JSON.stringify({ report, issues: check.issues.map(({ sev, code, msg }) => ({ sev, code, msg })), out }, null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
