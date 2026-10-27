// Kiểm tra sprite theo quy cách mục 5.11, và đăng ký sprite mới vào manifest + art/CREDITS.md.
//   node tools/assets/validate.mjs                     kiểm mọi key trong shared/assets/sprites/manifest.json
//   node tools/assets/validate.mjs --register <key> --prompt "<mô tả/prompt>" [--tool "<công cụ>"] [--note "<ghi chú>"] [--frame WxH] [--iso] [--map <mapId>] [--nine N]
//        kiểm file của key, thêm key vào manifest (nếu chưa có; --iso ghi "iso": true, --map ghi "map") và ghi/cập nhật
//        một dòng trong art/CREDITS.md.
// Key "iso": true theo bố cục isometric (isoLayout trong lib.mjs: hồn sư 24 × 6, NPC LPC lpc_<tên> 24 × 6 một lớp đã tô màu, phụ thể 24 × 12 hai nửa theo giới, hồn thú 20 × 5); key chưa có cờ
// là bộ 32×32 cũ của client hiện nay. Key có "map": "<mapId>" được dùng thêm bảng nhấn art/palettes/<mapId>.gpl.
// Normal map `<file>_n.png` (normal.mjs) nằm cạnh ảnh của key: phải cùng kích thước ảnh gốc.
// Lỗi (thoát mã 1): kích thước sheet sai bố cục, alpha khác 0/255, màu ngoài bảng (tóc/áo: chỉ dải 4 xám + viền #1a1020),
//       lớp thân thiếu khung bắt buộc, bộ hồn sư giới × kiểu tóc thiếu lớp (phải đủ hs_body/outfit/hair_{giới}_{kiểu}),
//       phụ thể vẽ vào cột 12–15 hoặc hàng 3, hồn thú thiếu khung; chân dung (portrait_{id}) quá PORTRAIT_MAX_COLORS màu
//       (chân dung không theo bảng chung), vật đứng (prop_{vật}) cạnh không chia hết cho ISO_PROP_STEP hoặc màu ngoài
//       bảng chung + bảng nhấn art/palettes/*.gpl; hiệu ứng (fx_{tên}) không phải dải một hàng, có khung trống hoặc quá
//       PORTRAIT_MAX_COLORS màu; chân dung NPC (npc_{mã}) / biểu tượng vật phẩm (item_{mã}) / chân dung hồn thú (thu_{loài}) mã không có trong NPCS / ITEMS / BEASTS. Key isometric (sheetSpec có iso) ghi "iso": true trong manifest.
// Cảnh báo: khung chép tạm (trùng idle khung đầu, do pack --fill); lớp áo/tóc trống khung (bị lớp khác che);
//       chân hồn sư (gộp 3 lớp cùng bộ, idle khung đầu mỗi hướng) không chạm dòng gốc (y = 30; isometric y = 58);
//       isometric: idle cả 4 khung giống nhau (chưa --breathe), chân hồn thú không chạm dòng gốc.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { checkIsoTiles } from "./iso-build.mjs";
import path from "node:path";
import { ROOT, SPRITES, MANIFEST, PT_MAX_COLORS, readPng, toHex, allowedColors, accentColors, readGpl, npcIds, itemIconIds, skillIconIds, statusIds, heIds, beastIds, sheetSpec, GRAY_RAMP, OUTLINE, SHEET_COLS, HS_ANIMS, HS_ORIGIN, HS_LAYERS, PORTRAIT_MAX_COLORS, ISO_PROP_STEP, ISO_DIRS } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const register = opt("--register", ""), prompt = opt("--prompt", ""), tool = opt("--tool", "PixelLab MCP"), note = opt("--note", ""), frameOpt = opt("--frame", "");
const nineOpt = +opt("--nine", "0"), mapOpt = opt("--map", ""), isoAt = args.indexOf("--iso"), isoOpt = isoAt >= 0 && !!args.splice(isoAt, 1);
const staticAt = args.indexOf("--static"), staticOpt = staticAt >= 0 && !!args.splice(staticAt, 1); // hồn thú lai: sheet tĩnh 3 hướng (#386)

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
manifest.sprites ??= [];
const entryKey = (e) => (typeof e === "string" ? e : e.key);
const allowed = allowedColors(), withAccents = new Set([...allowed, ...accentColors()]);
// Tóc/áo: 4 xám để hoán màu + viền ngoài #1a1020 (màu thứ 5, giữ nguyên khi hoán màu).
const grayOnly = new Set([...GRAY_RAMP, OUTLINE]);
let errors = 0, warns = 0, npcIds_, itemIds_, skillIds_, statusIds_, heIds_, beastIds_;
const feet = new Map(); // "bộ:hàng" → { low: dòng thấp nhất của idle khung đầu (3 lớp của bộ giới × kiểu tóc), want: dòng gốc }
const err = (k, m) => { errors++; console.error(`[validate] LỖI ${k}: ${m}`); };
const warn = (k, m) => { warns++; console.warn(`[validate] cảnh báo ${k}: ${m}`); };

function cellEmpty(img, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (img.alpha(x, y)) return false;
  return true;
}
function cellSame(img, a, b, w, h) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = img.get(a[0] + x, a[1] + y), q = img.get(b[0] + x, b[1] + y);
    if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2] || p[3] !== q[3]) return false;
  }
  return true;
}

/** Màu được phép thêm của bảng nhấn vùng art/palettes/<mapId>.gpl. */
function mapColors(key, map) {
  if (!map) return [];
  const f = path.join(ROOT, "art", "palettes", `${map}.gpl`);
  if (!existsSync(f)) { err(key, `"map": không có bảng nhấn ${path.relative(ROOT, f)}`); return []; }
  return readGpl(f);
}

function check(key, frame, iso = false, map = "", nine = 0, stat = false, blank = false) {
  const spec = sheetSpec(key, frame, iso, stat);
  if (!spec) return err(key, iso ? "key / khung sai quy ước isometric (isoLayout, sheetSpec trong tools/assets/lib.mjs)" : "key sai quy ước (xem sheetSpec trong client/src/sprites.ts)");
  const file = path.join(SPRITES, spec.file);
  // "blank": nửa phụ thể (vh_*) không có hình, client không tải (#974): không được còn file ảnh / normal; ngược lại sheet không điểm ảnh phải khai blank.
  if (blank) {
    if (spec.kind !== "vohon" && spec.kind !== "vhanim") return err(key, `"blank": true chỉ cho phụ thể võ hồn (vh_*, vhanim_*)`);
    for (const f of [file, file.replace(/\.png$/, "_n.png")]) if (existsSync(f)) err(key, `"blank": true nhưng còn file ${path.relative(ROOT, f)} (xóa file: nửa trống không đưa vào game, nguồn vẽ giữ ở art/src)`);
    return spec;
  }
  if (!existsSync(file)) return err(key, `thiếu file ${path.relative(ROOT, file)}`);
  let img;
  try { img = readPng(file); } catch (e) { return err(key, `không đọc được PNG: ${e.message}`); }
  if (spec.size && (img.w !== spec.size[0] || img.h !== spec.size[1])) return err(key, `kích thước ${img.w}×${img.h}, cần ${spec.size[0]}×${spec.size[1]}`);
  if (spec.frame && (img.w % spec.frame[0] || img.h % spec.frame[1])) return err(key, `kích thước không chia hết cho khung ${spec.frame.join("×")}`);
  // "nine": chỉ cho mảnh giao diện ui_*, số nguyên dương, hai mép cộng lại phải nhỏ hơn cạnh ngắn (còn phần giữa để kéo giãn).
  if (nine && (!/^ui_/.test(key) || !Number.isInteger(nine) || nine < 1 || 2 * nine >= Math.min(img.w, img.h))) err(key, `"nine": ${nine} không hợp lệ (chỉ ui_*, số nguyên 1…${Math.floor((Math.min(img.w, img.h) - 1) / 2)})`);
  if (spec.kind === "prop" && (img.w % ISO_PROP_STEP || img.h % ISO_PROP_STEP)) return err(key, `kích thước ${img.w}×${img.h} không chia hết cho ${ISO_PROP_STEP}`);

  // Màu và alpha.
  const palette = /^hs_(hair|outfit)_/.test(key) ? grayOnly : spec.kind === "prop" ? withAccents : map ? new Set([...allowed, ...mapColors(key, map)]) : allowed;
  // Chân dung / biểu tượng và hiệu ứng fx_* (màu gốc của gói LPC) không theo bảng chung, chỉ giới hạn số màu.
  const free = spec.kind === "portrait" || spec.kind === "fx" || spec.kind === "phaptuong" || spec.kind === "vhanim" || !!spec.static; // sheet tĩnh ComfyUI: bảng màu riêng từng loài, như chân dung
  const bad = new Map(), used = new Set(); let semi = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.get(x, y);
    if (!p[3]) continue;
    if (p[3] !== 255) semi++;
    const c = toHex(p);
    used.add(c);
    if (!free && !palette.has(c)) bad.set(c, (bad.get(c) ?? 0) + 1);
  }
  if (semi) err(key, `${semi} điểm bán trong suốt (chỉ được alpha 0 hoặc 255)`);
  if (free && !spec.static && spec.kind !== "vhanim" && used.size > (spec.kind === "phaptuong" ? PT_MAX_COLORS : PORTRAIT_MAX_COLORS)) err(key, `${used.size} màu, ${spec.kind === "fx" ? "hiệu ứng" : spec.kind === "phaptuong" ? "pháp tướng" : "chân dung"} tối đa ${spec.kind === "phaptuong" ? PT_MAX_COLORS : PORTRAIT_MAX_COLORS}`);
  if (spec.npc && !(npcIds_ ??= npcIds()).has(spec.npc)) err(key, `không có NPC "${spec.npc}" trong NPCS (shared/data.ts)`);
  if (spec.status && !(statusIds_ ??= statusIds()).has(spec.status)) err(key, `không có trạng thái / buff "${spec.status}" trong STATUS_IDS / BUFF_IDS / BEAST_BUFF_IDS (shared/data.ts)`);
  if (spec.beast && !(beastIds_ ??= beastIds()).has(spec.beast)) err(key, `không có loài "${spec.beast}" trong BEASTS (shared/data.ts)`);
  if (spec.he && !(heIds_ ??= heIds()).has(spec.he)) err(key, `không có hệ "${spec.he}" trong HE_IDS (shared/data.ts)`);
  if (spec.item && !(itemIds_ ??= itemIconIds()).has(spec.item)) err(key, `không có vật phẩm "${spec.item}" trong ITEMS / hồn cốt theo BONE_SLOTS (shared/data.ts)`);
  if (spec.skill && !(skillIds_ ??= skillIconIds()).has(spec.skill)) err(key, `không có võ hồn "${spec.skill}" trong VOHON_SKILLS (shared/data.ts) và không phải "chung"`);
  if (bad.size) err(key, `${bad.size} màu ngoài bảng${palette === grayOnly ? " (tóc/áo chỉ dùng dải 4 xám + viền)" : ""}: ` +
    [...bad].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c, n]) => `${c}×${n}`).join(", "));

  // Normal map cạnh ảnh (normal.mjs).
  const nfile = file.replace(/\.png$/, "_n.png");
  if (existsSync(nfile)) {
    try { const n = readPng(nfile); if (n.w !== img.w || n.h !== img.h) err(key, `normal map ${n.w}×${n.h}, cần ${img.w}×${img.h} (chạy lại normal.mjs)`); }
    catch (e) { err(key, `không đọc được normal map: ${e.message}`); }
  }

  // Khung bắt buộc.
  const [fw, fh] = spec.frame ?? [img.w, img.h];
  const at = (r, c) => [c * fw, r * fh];
  if (spec.layout) return checkIso(key, spec, img, at, fw, fh);
  if (spec.kind === "honsu") {
    const need = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < SHEET_COLS; c++) need.push([r, c]);
    need.push([3, 0], [3, 1]);
    const empty = need.filter(([r, c]) => cellEmpty(img, ...at(r, c), fw, fh));
    // Lớp thân phải đủ khung; lớp áo/tóc có thể trống ở khung bị lớp khác che hết (ví dụ áo sau tóc dài khi quay lưng).
    const report = /^hs_body_/.test(key) ? err : warn;
    if (empty.length) report(key, `${/^hs_body_/.test(key) ? "thiếu" : "trống"} ${empty.length} khung bắt buộc: ` + empty.slice(0, 10).map(([r, c]) => `(${r},${c})`).join(" "));
    const temp = need.filter(([r, c]) => c > 0 && !(r === 3 && c === 0) && !(r === 0 && c === 0) &&
      cellSame(img, at(r, c), r === 3 ? at(0, 0) : at(r, 0), fw, fh) && !cellEmpty(img, ...at(r, c), fw, fh));
    const names = (c) => Object.entries(HS_ANIMS).find(([, [c0, n]]) => c >= c0 && c < c0 + n)?.[0] ?? "absorb";
    if (temp.length) warn(key, `${temp.length} khung trùng idle khung đầu, thường là chép tạm (${[...new Set(temp.map(([r, c]) => (r === 3 ? "absorb" : names(c))))].join(", ")})`);
    // Dòng thấp nhất của idle khung đầu mỗi hướng; gộp 3 lớp cùng bộ rồi kiểm ở cuối (chân có thể thuộc lớp áo).
    for (let r = 0; r < 3; r++) {
      const [x0, y0] = at(r, 0), k = `${spec.set}:${r}`;
      for (let y = 0; y < fh; y++) if (!cellEmpty(img, x0, y0 + y, fw, 1)) feet.set(k, { low: Math.max(feet.get(k)?.low ?? -1, y), want: HS_ORIGIN[1] });
    }
  } else if (spec.kind === "vohon") {
    const stray = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < SHEET_COLS; c++) if ((r === 3 || c >= 12) && !cellEmpty(img, ...at(r, c), fw, fh)) stray.push([r, c]);
    if (stray.length) err(key, `phụ thể vẽ vào ô client không đọc (cột 12–15 hoặc hàng 3): ` + stray.map(([r, c]) => `(${r},${c})`).join(" "));
    if (cellEmpty(img, 0, 0, img.w, img.h)) err(key, `sheet trống hoàn toàn: ghi "blank": true vào manifest và xóa file ảnh + _n (client không tải nửa trống)`);
  } else if (spec.kind === "beast" || spec.kind === "fx") {
    if (spec.kind === "fx" && img.h !== fh) err(key, `hiệu ứng phải là dải một hàng khung ${fw}×${fh}`);
    const empty = [];
    for (let c = 0; c < img.w / fw; c++) if (cellEmpty(img, c * fw, 0, fw, fh)) empty.push(c);
    if (empty.length) err(key, `thiếu khung: cột ${empty.join(", ")}`);
  }
  return spec;
}

/** Sheet isometric: ô bắt buộc, ô ngoài bố cục, khung chép tạm, chân chạm dòng gốc (isoLayout trong lib.mjs). */
function checkIso(key, spec, img, at, fw, fh) {
  const L = spec.layout, filled = (r, c) => !cellEmpty(img, ...at(r, c), fw, fh);
  const stray = [];
  for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) if (!L.cells.has(`${r},${c}`) && filled(r, c)) stray.push([r, c]);
  if (stray.length) err(key, `vẽ vào ô ngoài bố cục (client không đọc): ` + stray.slice(0, 10).map(([r, c]) => `(${r},${c})`).join(" "));
  if (spec.kind === "vohon") { if (cellEmpty(img, 0, 0, img.w, img.h)) err(key, `sheet trống hoàn toàn: ghi "blank": true vào manifest và xóa file ảnh + _n (client không tải nửa trống)`); return spec; }
  // Pháp tướng: đủ mọi khung idle / attack của 5 hướng; khung vẽ không chạm mép (viền sáng 2 điểm không bị cắt).
  if (spec.kind === "phaptuong") {
    const miss = L.required.filter(([r, c]) => !filled(r, c));
    if (miss.length) err(key, `thiếu ${miss.length} khung: ` + miss.slice(0, 10).map(([r, c]) => `(${r},${c})`).join(" "));
    const edge = L.required.filter(([r, c]) => { const [x0, y0] = at(r, c); return !cellEmpty(img, x0, y0, fw, 1) || !cellEmpty(img, x0, y0, 1, fh) || !cellEmpty(img, x0 + fw - 1, y0, 1, fh); });
    if (edge.length) err(key, `${edge.length} khung chạm mép trên / trái / phải (hình bị cắt): ` + edge.slice(0, 6).map(([r, c]) => `(${r},${c})`).join(" "));
    return spec;
  }
  const empty = L.required.filter(([r, c]) => !filled(r, c));
  // Lớp thân, NPC LPC (một lớp) và hồn thú phải đủ khung; lớp áo/tóc có thể trống ở khung bị lớp khác che hết.
  const hard = spec.kind === "beast" || spec.kind === "lpc" || /^hs_body_/.test(key);
  if (empty.length) (hard ? err : warn)(key, `${hard ? "thiếu" : "trống"} ${empty.length} khung bắt buộc: ` + empty.slice(0, 10).map(([r, c]) => `(${r},${c})`).join(" "));
  const [i0, ni] = L.anims.idle, animOf = (r, c) => (r >= ISO_DIRS.length ? "absorb" : Object.entries(L.anims).find(([, [c0, n]]) => c >= c0 && c < c0 + n)?.[0]);
  // Ô ngoài idle trùng idle khung đầu cùng hàng (absorb so với idle hướng s): thường là chép tạm của pack --fill.
  const temp = L.required.filter(([r, c]) => animOf(r, c) !== "idle" && filled(r, c) && cellSame(img, at(r, c), at(r < ISO_DIRS.length ? r : 0, i0), fw, fh));
  if (temp.length) warn(key, `${temp.length} khung trùng idle khung đầu, thường là chép tạm (${[...new Set(temp.map(([r, c]) => animOf(r, c)))].join(", ")})`);
  const still = ISO_DIRS.map((_, r) => r).filter((r) => filled(r, i0) && Array.from({ length: ni - 1 }, (_, i) => i0 + 1 + i).every((c) => cellSame(img, at(r, c), at(r, i0), fw, fh)));
  if (still.length) warn(key, `idle đứng yên ở hướng ${still.map((r) => ISO_DIRS[r]).join(", ")} (cả ${ni} khung giống nhau; pack --breathe)`);
  // Dòng thấp nhất của idle khung đầu mỗi hướng; hồn sư gộp 3 lớp cùng bộ rồi kiểm ở cuối (chân có thể thuộc lớp áo).
  for (let r = 0; r < ISO_DIRS.length; r++) {
    const [x0, y0] = at(r, i0), k = spec.kind === "honsu" ? `${spec.set}:${ISO_DIRS[r]}` : `${key}:${ISO_DIRS[r]}`;
    for (let y = 0; y < fh; y++) if (!cellEmpty(img, x0, y0 + y, fw, 1)) feet.set(k, { low: Math.max(feet.get(k)?.low ?? -1, y), want: L.origin[1], beast: spec.kind === "beast" });
  }
  return spec;
}

// Dịch vụ tạo ảnh ngoài Gemini / ChatGPT / ComfyUI: nhận theo chữ trong --tool, mỗi dịch vụ một mục CREDITS (hậu tố tên file ở hộp thư phẳng).
const EXTRA_SERVICES = [
  { re: /copilot/i, name: "Microsoft Copilot", suffix: "copilot" },
  { re: /qwen/i, name: "Qwen Chat", suffix: "qwen" },
  { re: /leonardo/i, name: "Leonardo AI", suffix: "leonardo" },
  { re: /meta\s*ai|\bmeta\b/i, name: "Meta AI", suffix: "meta" },
  { re: /grok/i, name: "Grok", suffix: "grok" },
];
// ---------- Đăng ký key mới ----------
function upsertCredits(key, file) {
  const credits = path.join(ROOT, "art", "CREDITS.md");
  // Git trên Windows (core.autocrlf) có thể checkout file với CRLF: tách dòng chịu cả hai, ghi lại đúng kiểu xuống dòng của file.
  let md = readFileSync(credits, "utf8");
  const eol = md.includes("\r\n") ? "\r\n" : "\n";
  md = md.replace(/\r\n/g, "\n");
  // Mỗi công cụ AI một mục: --tool có chữ "ComfyUI" / "Gemini" / "ChatGPT" thì ghi vào mục đó, còn lại mục PixelLab.
  const comfy = /comfyui/i.test(tool), chatgpt = !comfy && /chatgpt/i.test(tool), other = !comfy && !chatgpt ? EXTRA_SERVICES.find((x) => x.re.test(tool)) : undefined, gemini = !comfy && !chatgpt && !other && /gemini/i.test(tool);
  const head = comfy ? "## Asset tạo bằng AI (ComfyUI)" : gemini ? "## Asset tạo bằng AI (Gemini)" : chatgpt ? "## Asset tạo bằng AI (ChatGPT)" : other ? `## Asset tạo bằng AI (${other.name})` : "## Asset tạo bằng AI (PixelLab)";
  const intro = comfy
    ? "Ảnh AI tạo bằng ComfyUI tự host (SDXL base 1.0, CreativeML Open RAIL++-M + LoRA pixel-art-xl, CreativeML OpenRAIL-M; VAE sdxl-vae-fp16-fix, MIT), tách nền bằng `tools/assets/comfy-key.mjs`, nhập bằng `gemini-import.mjs` và đăng ký bằng `validate --register`. Quy trình: `.claude/skills/asset-gen/SKILL.md`."
    : gemini
    ? "Người dùng tạo ảnh bằng Gemini (gemini.google.com), rồi nhập bằng `tools/assets/gemini-import.mjs` (gỡ logo, xóa nền, điểm ảnh giả → pixel thật, đưa về khung) và đăng ký bằng `validate --register`. Quy trình: `.claude/skills/asset-gen/SKILL.md`."
    : other
    ? `Người dùng tạo ảnh bằng ${other.name}, rồi nhập bằng \`tools/assets/gemini-import.mjs\` / \`equip-import.mjs\` và đăng ký bằng \`validate --register\`. Hộp thư ảnh: \`anh-inbox/\` (tên file có hậu tố \`-${other.suffix}\`). Quy trình: \`.claude/skills/asset-gen/SKILL.md\`.`
    : chatgpt
    ? "Người dùng tạo ảnh bằng ChatGPT (tạo ảnh, nền trong suốt), rồi nhập bằng `tools/assets/equip-import.mjs` / `gemini-import.mjs` (ngưỡng alpha, điểm ảnh giả → pixel thật, đưa về khung) và đăng ký bằng `validate --register`. Quy trình: `.claude/skills/asset-gen/SKILL.md`."
    : "Tạo bằng PixelLab qua MCP, rồi chuẩn hóa bằng `tools/assets` (normalize → pack → validate). Quy trình: `.claude/skills/asset-gen/SKILL.md`.";
  if (!md.includes(head)) {
    md = md.replace("## Asset bên ngoài", `${head}\n\n${intro}\n\n` +
      "| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |\n|---|---|---|---|---|---|\n\n## Asset bên ngoài");
  }
  const date = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD theo giờ máy
  const cell = (s) => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const row = `| \`${file}\` | \`${key}\` | ${cell(tool)} | ${cell(prompt)} | ${date} | ${cell(note)} |`;
  const lines = md.split("\n"), i = lines.findIndex((l) => l.includes(`| \`${key}\` |`));
  if (i >= 0) lines[i] = row;
  else {
    // Chèn sau dòng cuối của bảng trong mục AI.
    let j = lines.indexOf(head) + 1;
    while (j < lines.length && !lines[j].startsWith("|")) j++;
    while (j < lines.length && lines[j].startsWith("|")) j++;
    lines.splice(j, 0, row);
  }
  writeFileSync(credits, lines.join(eol));
}

/** Pháp tướng (`pt_<mã>`): cách ghép vào hồn sư (lớp sau / trước theo hướng, tỉ lệ, dời) lấy từ `display` của recipe.json cạnh ảnh nguồn. */
function ptDisplay(key) {
  const m = key.match(/^pt_([a-z_]+)$/), f = m && path.join(ROOT, "art", "src", "pixellab", "phap_tuong", m[1], "recipe.json");
  return f && existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).display : undefined;
}

if (register) {
  if (!prompt) { console.error("--register cần --prompt (ghi vào art/CREDITS.md)"); process.exit(1); }
  const frame = frameOpt ? frameOpt.split("x").map(Number) : undefined;
  const spec = check(register, frame, isoOpt, mapOpt, nineOpt, staticOpt);
  if (errors) process.exit(1);
  const iso = isoOpt || !!spec.iso;
  // --nine N: mảnh giao diện kéo giãn 9 lát, giữ nguyên N điểm ở mỗi mép (hộp thoại, cuộn giấy, khung thanh).
  const entry = frame || iso || mapOpt || nineOpt || staticOpt ? { key: register, ...(frame ? { frame } : {}), ...(iso ? { iso: true } : {}), ...(staticOpt ? { static: true } : {}), ...(mapOpt ? { map: mapOpt } : {}), ...(nineOpt ? { nine: nineOpt } : {}), ...(ptDisplay(register) ? { pt: ptDisplay(register) } : {}) } : register;
  const i = manifest.sprites.findIndex((e) => entryKey(e) === register);
  if (i < 0 || JSON.stringify(manifest.sprites[i]) !== JSON.stringify(entry)) {
    // Đăng ký lại một key (ví dụ bộ 32×32 cũ thay bằng bộ isometric) thì ghi đè dòng cũ.
    if (i >= 0) manifest.sprites.splice(i, 1);
    manifest.sprites.push(entry);
    manifest.sprites.sort((a, b) => entryKey(a).localeCompare(entryKey(b)));
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  }
  upsertCredits(register, `shared/assets/sprites/${spec.file}`);
  console.log(`[validate] đã đăng ký ${register}`);
  process.exit(0);
}

/** `anim.dirsOk` (#869): hướng vẽ thật đạt duyệt của hoạt ảnh hồn thú; hướng ngoài danh sách client dùng ảnh tĩnh. Phải là tập con thật sự, không trùng, và các hướng đó đủ khung. */
function checkDirsOk(key, e, spec) {
  const a = e.anim, ok = a.dirsOk;
  if (spec.kind !== "beast" || !/^beast_[a-z_]+_anim$/.test(key)) return err(key, `"anim.dirsOk" chỉ cho hoạt ảnh hồn thú beast_*_anim`);
  if (!Array.isArray(a.dirs)) return err(key, `"anim.dirsOk" cần "anim.dirs"`);
  if (!Array.isArray(ok) || !ok.length) return err(key, `"anim.dirsOk" phải là danh sách hướng đạt không rỗng (không có hướng đạt thì đừng nhập hoạt ảnh)`);
  if (ok.some((d) => !a.dirs.includes(d)) || new Set(ok).size !== ok.length) return err(key, `"anim.dirsOk" ${JSON.stringify(ok)} có hướng ngoài "anim.dirs" hoặc trùng`);
  if (ok.length >= a.dirs.length) return err(key, `"anim.dirsOk" liệt kê đủ mọi hướng: bỏ trường này`);
  if (ok.some((d, i) => i && a.dirs.indexOf(d) < a.dirs.indexOf(ok[i - 1]))) return err(key, `"anim.dirsOk" ${JSON.stringify(ok)} không theo thứ tự "anim.dirs"`);
  const img = readPng(path.join(SPRITES, spec.file)), [fw, fh] = e.frame, rows = a.rowsPerDir ?? 4;
  const lost = [];
  for (const d of ok) for (const [name, s] of Object.entries(a.anims ?? {})) for (let i = 0; i < s.n; i++)
    if (cellEmpty(img, (s.col + i) * fw, ((a.dirs.indexOf(d) * rows) + s.band) * fh, fw, fh)) lost.push(`${d}/${name}/${i}`);
  if (lost.length) err(key, `hướng đạt (dirsOk) mà thiếu ${lost.length} khung: ${lost.slice(0, 8).join(" ")}`);
}

// ---------- Kiểm toàn bộ manifest ----------
const seen = new Set();
for (const e of manifest.sprites) {
  const key = entryKey(e);
  if (seen.has(key)) err(key, "trùng key trong manifest");
  seen.add(key);
  const spec = typeof e === "string" ? check(key) : check(key, e.frame, !!e.iso, e.map ?? "", e.nine ?? 0, !!e.static, !!e.blank);
  if (spec) { seen.add(spec.file); seen.add(spec.file.replace(/\.png$/, "_n.png")); }
  if (spec && typeof e !== "string" && e.anim?.dirsOk !== undefined) checkDirsOk(key, e, spec);
}
// Bộ hồn sư giới × kiểu tóc phải đủ 3 lớp tách từ cùng một hình: thiếu lớp nào thì client vẽ lớp đó bằng code, lệch nét.
const sets = new Map();
for (const e of manifest.sprites) { const k = entryKey(e), set = sheetSpec(k)?.set; if (set) sets.set(set, [...(sets.get(set) ?? []), e]); }
for (const [set, entries] of sets) {
  const keys = entries.map(entryKey), miss = HS_LAYERS.map((l) => `hs_${l}_${set}`).filter((k) => !keys.includes(k));
  if (miss.length) err(`hs_*_${set}`, `bộ giới × kiểu tóc thiếu lớp ${miss.join(", ")} (mỗi bộ đủ thân, áo, tóc tách từ cùng một hình)`);
  // Cả 3 lớp cùng bố cục: không trộn lớp isometric với lớp 32×32 cũ.
  if (new Set(entries.map((e) => typeof e !== "string" && !!e.iso)).size > 1) err(`hs_*_${set}`, `bộ giới × kiểu tóc trộn lớp "iso": true với lớp 32×32 cũ`);
}
// Chân hồn sư (gộp thân, áo, tóc cùng bộ) phải chạm dòng gốc ở idle mỗi hướng (32×32: y = 30, isometric: y = 58).
// Hồn thú dùng một dòng chân chung cho mọi hướng (normalize.mjs), nên chỉ cần dòng gốc nằm giữa chân thấp nhất và cao nhất các hướng.
const beastFeet = new Map();
for (const [k, { low, want, beast }] of feet) {
  if (beast) { const b = beastFeet.get(k.split(":")[0]) ?? { lows: [], want }; b.lows.push(low); beastFeet.set(k.split(":")[0], b); }
  else if (low !== want) warn(/^lpc_/.test(k) ? k.split(":")[0] : `hs_*_${k.split(":")[0]}`, `hàng ${k.split(":")[1]}: chân ở y = ${low}, gốc là y = ${want}`);
}
for (const [k, { lows, want }] of beastFeet) if (want < Math.min(...lows) - 1 || want > Math.max(...lows)) warn(k, `chân idle các hướng ở y = ${Math.min(...lows)}–${Math.max(...lows)}, gốc là y = ${want}`);
// Ảnh nằm trong thư mục sprites mà manifest không nhắc tới thì client sẽ không tải.
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(path.join(d, f.name)) : [path.join(d, f.name)]));
for (const f of walk(SPRITES).filter((f) => f.endsWith(".png"))) {
  const rel = path.relative(SPRITES, f).split(path.sep).join("/");
  if (!seen.has(rel)) warn(rel, "có ảnh nhưng không có key trong manifest.json");
}
// Bản đồ isometric (10.2): shared/assets/iso/tiles.json phủ mọi gid của 10 bản đồ, ảnh ô / vật đúng cỡ, vật đã đăng ký, có kiểu nhà.
errors += checkIsoTiles((m) => console.error(m));
console.log(`[validate] ${manifest.sprites.length} key, ${errors} lỗi, ${warns} cảnh báo`);
process.exit(errors ? 1 : 0);
