// Trang xem trước phụ thể võ hồn v2 (#1022): GHÉP LÊN THÂN LPC THẬT, từng clip × hướng, cả hai giới, và xoay 5 hướng.
//   node tools/assets/phuthe-sheet-preview.mjs --id ta_hoa_phuong_hoang --dir <thư mục phuthe-sheet-cut> [--scale 3]
// Đọc <dir>/vhanim_<id>_b.png (sau thân) / _f.png (trước thân) + manifest-entry.json (nửa nào cũng có thể vắng nếu rỗng), ghi
// <dir>/preview/index.html, gif/<giới>/<clip>_<hướng>.gif, xoay-vong.html. Mỗi khung GIF: nửa sau → thân LPC (m_0 / f_0, đủ màu) → nửa trước,
// chạy theo THỜI GIAN thân (bodyStepAt) và chọn khung phụ thể bằng đúng quy tắc của đặc tả (clipFrameAt): đây cũng là cách client (P2) sẽ phát clip.
// Hướng tây hiện bằng lật ngang CSS. Nhìn ở đây để thấy điểm gắn trôi, se ≈ e, ne lộ mặt, hurt không lùi, đường cắt giữa hai nửa.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Img, readPng } from "./lib.mjs";
import { encodeGif } from "./beast-sheet-preview.mjs";
import { DIRS, DIR_VI, CLIPS, CLIP_VI, SEXES, HALVES, gameAnims, gameRow, gameKey, bodyOffset, bodyStepAt, bodyTotalMs, clipFrameAt, phutheInfo } from "./phuthe-sheet-lib.mjs";
import { bodyFrame } from "./phuthe-sheet-dummy.mjs";

/** Nhịp khung GIF (ms, xem trước, không phải số cân bằng): đủ mịn để thấy bước thân và khung phụ thể đổi ở đúng chỗ. */
const DT = 40;
const COMPASS = { s: 180, se: 135, e: 90, ne: 45, n: 0 };
const FLIPPED = [["sw", "se"], ["w", "e"], ["nw", "ne"]];
/** Thời điểm đại diện từng clip (ms) khi xoay vòng hướng. */
const POSE_T = { idle: 0, walk: 120, attack: 150, cast: 250, hurt: 100 };

/** Dựng một khung ghép: nửa sau, thân LPC, nửa trước, trên khung F×F. `halves`: { b, f } (Img hoặc null). */
export function composeFrame({ halves, group, F, sex, dir, clip, t }) {
  const out = new Img(F, F), frame = clipFrameAt(group, clip, t), step = bodyStepAt(clip, t), A = gameAnims(group)[clip], [bx, by] = bodyOffset(F);
  const x0 = (A[0] + frame) * F, y0 = gameRow(sex, dir) * F;
  if (halves.b) out.blit(halves.b, x0, y0, F, F, 0, 0, true);
  out.blit(bodyFrame(sex, dir, clip, step).fig, 0, 0, 64, 64, bx, by, true);
  if (halves.f) out.blit(halves.f, x0, y0, F, F, 0, 0, true);
  return out;
}
/** Các khung GIF của một clip × hướng × giới (một vòng của clip thân). */
export function clipFrames(args) {
  const total = bodyTotalMs(args.clip), out = [];
  for (let t = 0; t < total; t += DT) out.push(composeFrame({ ...args, t }));
  return out;
}

const compass = (d) => `<svg viewBox="-12 -12 24 24" width="22" height="22"><circle r="10" fill="none" stroke="#6a5f78"/><path d="M0 -8L4 3L0 1L-4 3Z" fill="#e8c870" transform="rotate(${COMPASS[d]})"/></svg>`;
const CSS = "body{background:#2a2430;color:#e8dfc8;font:13px/1.4 sans-serif;margin:16px}h1{font-size:18px}h2{font-size:15px;margin:18px 0 6px}a{color:#e8c870}table{border-collapse:collapse}th,td{border:1px solid #4a4050;padding:4px;text-align:center;vertical-align:bottom}th{background:#1a1020;font-weight:600}td{background:repeating-conic-gradient(#352d3d 0 25%,#2f2837 0 50%) 0 0/16px 16px}img.g{image-rendering:pixelated;display:block}img.f{transform:scaleX(-1)}figure{margin:0;text-align:center}figcaption{color:#9a8fa8;display:flex;gap:4px;align-items:center;justify-content:center}.r{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end}.n{color:#9a8fa8}";

/** Dựng trang xem trước vào `<dir>/preview`; trả đường dẫn index.html. */
export function buildPreview(id, dir, scaleArg) {
  const entries = JSON.parse(readFileSync(path.join(dir, "manifest-entry.json"), "utf8"));
  if (!entries.length) throw new Error("manifest-entry.json rỗng: cả hai nửa đều rỗng, không có gì để xem");
  const kind = entries[0].anim.kind ?? "phuthe", info = phutheInfo(id, kind);
  const F = entries[0].frame[0], group = entries[0].anim.group ?? info.group, k = scaleArg ?? Math.max(1, Math.round(300 / F)), halves = {};
  for (const h of Object.values(HALVES)) { const f = path.join(dir, `${gameKey(id, h, kind)}.png`); halves[h] = existsSync(f) ? readPng(f) : null; }
  const root = path.join(dir, "preview");
  for (const sex of SEXES) mkdirSync(path.join(root, "gif", sex), { recursive: true });
  for (const sex of SEXES) for (const clip of CLIPS) for (const d of DIRS) {
    const fr = clipFrames({ halves, group, F, sex, dir: d, clip });
    writeFileSync(path.join(root, "gif", sex, `${clip}_${d}.gif`), encodeGif(fr, DT, k, clip === "hurt" ? 500 : 0));
  }
  for (const sex of SEXES) for (const clip of CLIPS) {
    const fr = DIRS.map((d) => composeFrame({ halves, group, F, sex, dir: d, clip, t: POSE_T[clip] }));
    writeFileSync(path.join(root, "gif", sex, `xoay_${clip}.gif`), encodeGif(fr, 700, k, 300));
  }
  const cols = [...DIRS.map((d) => [d, d, false]), ...FLIPPED.map(([d, src]) => [d, src, true])], px = F * k;
  const cell = (sex, clip, [d, src, flip]) => `<td><img class="g${flip ? " f" : ""}" src="gif/${sex}/${clip}_${src}.gif" width="${px}" height="${px}" alt="${clip} ${d}"></td>`;
  const table = (sex) => `<h2>Thân LPC ${sex === "m" ? "nam (m_0)" : "nữ (f_0)"}</h2><table><tr><th></th>${cols.map(([d]) => `<th>${DIR_VI[d] ?? { sw: "tây-nam", w: "tây", nw: "tây-bắc" }[d]} <small>(${d})</small></th>`).join("")}</tr>
${CLIPS.map((clip) => `<tr><th>${CLIP_VI[clip]}<br><small>${clip}</small></th>${cols.map((c) => cell(sex, clip, c)).join("")}</tr>`).join("\n")}</table>`;
  writeFileSync(path.join(root, "index.html"), `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Phụ thể ${info.name}</title><style>${CSS}</style>
<h1>${info.name} <small>(${id}, nhóm ${info.group}, khung ${F}×${F}, phóng ×${k})</small></h1>
<p class="n"><a href="xoay-vong.html">Trang xoay vòng hướng →</a>. Mỗi ô: nửa sau → thân LPC → nửa trước, chạy theo nhịp thân thật; khung phụ thể chọn theo thời gian (đặc tả "Ánh xạ clip phụ thể sang khung thân"). Cột: 5 hướng vẽ thật rồi 3 hướng tây (lật ngang). Nhìn: điểm gắn có trôi khỏi thân không, se ≈ e, ne / n lộ mặt, hurt không lùi, đường cắt giữa hai nửa, lộ viền nộm. Nửa ${halves.b ? "sau có" : "sau RỖNG"}, nửa ${halves.f ? "trước có" : "trước RỖNG"}.</p>
${SEXES.map(table).join("\n")}</html>
`);
  const row = (sex, clip) => `<h2>${CLIP_VI[clip]} <small>(${clip}, ${sex})</small></h2><div class="r"><figure><img class="g" src="gif/${sex}/xoay_${clip}.gif" width="${px}" height="${px}" alt="xoay ${clip}"><figcaption>xoay vòng s→se→e→ne→n</figcaption></figure>${DIRS.map((d) => `<figure><img class="g" src="gif/${sex}/${clip}_${d}.gif" width="${px}" height="${px}" alt="${clip} ${d}"><figcaption>${compass(d)} ${d} · ${DIR_VI[d]}</figcaption></figure>`).join("")}</div>`;
  writeFileSync(path.join(root, "xoay-vong.html"), `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Xoay vòng hướng ${info.name}</title><style>${CSS}</style>
<h1>${info.name} <small>(${id}, khung ${F}×${F}, phóng ×${k})</small>: xoay vòng hướng</h1>
<p class="n"><a href="index.html">← Trang đủ 8 hướng</a>. Khung xoay qua 5 hướng vẽ thật: nếu <b>se</b> ≈ <b>e</b> thì hình gần như đứng yên giữa hai nhịp; <b>n</b> / <b>ne</b> phải quay lưng; thân luôn là dáng LPC (thân chỉ có 3 hàng, <b>se</b> / <b>ne</b> dùng hàng <b>e</b>) nên chỉ phụ thể đổi góc.</p>
${SEXES.map((sex) => CLIPS.map((clip) => row(sex, clip)).join("\n")).join("\n")}</html>
`);
  return path.join(root, "index.html");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  if (!val("--id") || !val("--dir")) { console.error("Dùng: node tools/assets/phuthe-sheet-preview.mjs --id <võ hồn> --dir <thư mục phuthe-sheet-cut> [--scale 3]"); process.exit(2); }
  try { console.log(buildPreview(val("--id"), val("--dir"), val("--scale") && +val("--scale"))); } catch (e) { console.error(e.message); process.exit(2); }
}
