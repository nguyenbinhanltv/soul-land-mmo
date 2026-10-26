// Trang xem trước BỘ COMPONENT của UI Kit (#880, theo dõi #877; skill ui-kit phần DUYỆT, docs/art/ui-kit.md): mọi mảnh × mọi trạng thái,
// 3 nền (sáng / tối / trắng), 3 cỡ khung (thấy 9-slice kéo giãn), chuỗi tiếng Việt đủ dấu ở 10 / 12 / 24 px, DPR 1 / 2, hover / focus thật.
//   node tools/assets/ui-kit-preview.mjs --dir <thư mục ui-sheet-cut> [--dir …] --out <thư mục>
//   node tools/assets/ui-kit-preview.mjs --fixture c2,ui5 --out <thư mục>      (tờ giả lập từ 7 mảnh C2 + 6 khung UI-5 có sẵn: thử công cụ, KHÔNG phải ảnh model)
// Đọc <dir>/manifest-entry.json + 2x/ + 1x/ (kết quả `npm run ui:cut`), ghi <out>/index.html và bản chép ảnh (trang tự chứa, đẩy lên artifact được).
// Không cần Chrome / server / thư viện ngoài; nút trên trang là <button> thật nên hover / nhấn / focus-visible (Tab) là của trình duyệt.
// DPR: trang không ép được DPR của máy. "DPR 1" dùng ảnh 1× đúng cỡ; "DPR 2" dùng ảnh 2× hiển thị bằng một nửa cỡ (đúng điểm khi máy là DPR 2;
// ở máy DPR 1 là trường hợp ảnh 2× bị hạ nửa mà ui-kit.md "Kit 1× hay 2×" đã đo). Số DPR thật của máy hiện ở đầu trang.
import { mkdirSync, writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, decodePng } from "./lib.mjs";
import { loadKit } from "./ui-kit-lib.mjs";

export const BACKGROUNDS = [["sang", "#e8dcc0"], ["toi", "#14101c"], ["trang", "#ffffff"]];
export const FRAME_SIZES = [[200, 60], [360, 120], [520, 320]];
export const FONT_SIZES = [10, 12, 24];
/** Chuỗi thử: đủ các dấu tiếng Việt (mũ, móc, râu, sắc / huyền / hỏi / ngã / nặng, đ). */
export const VI_STRINGS = ["Hồn hoàn", "Cộng minh", "Đăng nhập bằng Google", "Quỷ ảnh mị ẩu ỡ ữ ệ ợ", "Võ hồn Lam Ngân Thảo"];
const STATE_VI = { thuong: "thường", ro: "hover", nhan: "nhấn", tat: "tắt", chon: "chọn" };
const PSEUDO = { ro: ":hover", nhan: ":active", tat: ":disabled", chon: '[aria-pressed="true"]' };

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const kb = (n) => (n / 1000).toFixed(1);
const cssId = (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, "_");
const sizeOf = (p, v) => p.size[v === 2 ? "x2" : "x1"];

/** Thông số hiển thị theo biến thể: v=1 (ảnh 1×, đúng cỡ) hoặc v=2 (ảnh 2×, hiển thị một nửa cỡ). */
const variant = (p, v) => {
  const [w, h] = sizeOf(p, v), k = v === 2 ? 2 : 1, nine = p.nine ? p.nine[v === 2 ? "x2" : "x1"] : null;
  return { w, h, cssW: w / k, cssH: h / k, nine, bw: nine == null ? null : nine / k };
};
const src = (label, p, v) => `${esc(label)}/${v}x/${esc(p.key)}.png`;

/** CSS border-image cho một mảnh co giãn ở biến thể v (đường dẫn tương đối so với index.html). */
const borderRule = (label, p, v) => {
  const t = variant(p, v);
  return `border-style:solid;border-width:${t.bw}px;border-image-source:url('${src(label, p, v)}');border-image-slice:${t.nine} fill;border-image-width:${t.bw}px;border-image-repeat:stretch;`;
};

/** Dựng trang từ danh sách nguồn [{ label, pieces, groups }]; trả HTML. */
export function buildPage(sources, { kit = loadKit(), title = "Bộ component UI Kit" } = {}) {
  const all = sources.flatMap((s) => s.pieces.map((p) => ({ ...p, label: s.label })));
  const groups = sources.flatMap((s) => Object.entries(s.groups ?? {}).map(([name, g]) => ({ name, g, label: s.label })));
  const byKey = new Map(all.map((p) => [`${p.label}/${p.key}`, p]));
  const css = [], body = [];

  // ----- A. tóm tắt
  const budget = {};
  for (const p of all) { const b = budget[p.budget] ?? (budget[p.budget] = { x2: 0, x1: 0, n: 0 }); b.x2 += p.bytes.x2; b.x1 += p.bytes.x1; b.n++; }
  body.push(`<h2>A. Tóm tắt</h2><p>${all.length} mảnh, ${groups.length} bộ trạng thái. Ngân sách KB (kit khung + nút + ô + thanh, icon riêng; mỗi bản 2× / 1× tính riêng): ${
    Object.entries(budget).map(([g, b]) => `<b>${esc(g)}</b> ${b.n} mảnh · 2× ${kb(b.x2)} KB · 1× ${kb(b.x1)} KB / ${kb(kit.budget[g] ?? 0)} KB`).join("; ")}.</p>`);
  body.push(`<table><tr><th>Mảnh</th><th>Loại</th><th>Cỡ 2×</th><th>Cỡ 1×</th><th>Vạch 9-slice (2× / 1×)</th><th>KB (2× / 1×)</th><th>Băm</th></tr>${all.map((p) =>
    `<tr><td>${esc(p.key)}</td><td>${esc(p.kind)}</td><td>${p.size.x2.join("×")}</td><td>${p.size.x1.join("×")}</td><td>${p.nine ? `${p.nine.x2} / ${p.nine.x1}` : "– (không co giãn)"}</td><td>${kb(p.bytes.x2)} / ${kb(p.bytes.x1)}</td><td>${esc(p.hash)}</td></tr>`).join("")}</table>`);

  // ----- B. mọi mảnh × 3 nền × DPR 1 / 2
  body.push(`<h2>B. Mọi mảnh × 3 nền × DPR 1 / 2</h2><p class="m">Hàng "DPR 1" = ảnh 1× đúng cỡ; hàng "DPR 2" = ảnh 2× hiển thị một nửa cỡ. Mép hồng, viền răng cưa, quầng sáng ở nền trắng / sáng là lỗi cần xem bằng mắt.</p>`);
  for (const p of all) {
    body.push(`<div class="piece"><div class="name">${esc(p.key)} <span class="m">${esc(p.set ? `${p.set} · ${STATE_VI[p.state] ?? p.state}` : p.kind)}</span></div><table class="bg">`);
    for (const v of [1, 2]) {
      const t = variant(p, v);
      body.push(`<tr><th>DPR ${v}</th>${BACKGROUNDS.map(([id, c]) => `<td style="background:${c}"><img class="px" src="${src(p.label, p, v)}" width="${t.cssW}" height="${t.cssH}" alt="${esc(p.key)} ${id}"></td>`).join("")}</tr>`);
    }
    body.push("</table></div>");
  }

  // ----- C. 9-slice × 3 cỡ khung
  const stretch = all.filter((p) => p.nine);
  body.push(`<h2 id="c">C. 9-slice × 3 cỡ khung</h2>`);
  if (!stretch.length) body.push(`<p class="m">Không có mảnh co giãn (nine = null) trong nguồn này.</p>`);
  else body.push(`<p class="m">Mỗi mảnh co giãn kéo về ${FRAME_SIZES.map((s) => s.join("×")).join(", ")} px (cỡ CSS). Cạnh lộ hoa văn lặp, góc méo, ruột có vệt sáng là lỗi chia 9. Khung nhỏ hơn hai lần vạch cắt được đánh dấu "quá nhỏ".</p>`);
  stretch.forEach((p, i) => {
    body.push(`<div class="piece"><div class="name">${esc(p.key)} <span class="m">vạch ${p.nine.x2} (2×) / ${p.nine.x1} (1×)</span></div><div class="row">`);
    for (const v of [1, 2]) for (const [w, h] of FRAME_SIZES) {
      const t = variant(p, v), small = w < 2 * t.bw || h < 2 * t.bw, cls = `s${i}v${v}`;
      if (!css.some((r) => r.startsWith(`.${cls}{`))) css.push(`.${cls}{${borderRule(p.label, p, v)}}`);
      body.push(`<div class="cell"><div class="${cls} box" style="width:${w}px;height:${h}px;box-sizing:border-box;background-color:transparent"></div><div class="m">DPR ${v} · ${w}×${h}${small ? " · quá nhỏ" : ""}</div></div>`);
    }
    body.push("</div></div>");
  });

  // ----- D. bộ trạng thái, hover / focus thật
  body.push(`<h2 id="d">D. Bộ trạng thái (hover / nhấn / focus thật)</h2><p class="m">Nút dưới đây là &lt;button&gt; thật: rê chuột = hover, giữ chuột = nhấn, Tab = focus-visible (viền ngoài 2 px), "chọn" bật / tắt bằng nhấp. Hàng "tĩnh" bày đủ từng trạng thái cạnh nhau để so.</p>`);
  const usable = groups.filter((x) => x.g.states.thuong && x.g.nine);
  if (!usable.length) body.push(`<p class="m">Không có bộ trạng thái co giãn (cần trạng thái "thường" và vạch cắt).</p>`);
  usable.forEach(({ name, g, label }, gi) => {
    const piece = (st) => byKey.get(`${label}/${g.states[st]}`), base = piece("thuong");
    if (!base) return;
    body.push(`<div class="piece"><div class="name">${esc(name)} <span class="m">${Object.keys(g.states).map((s) => STATE_VI[s] ?? s).join(" · ")}</span></div>`);
    for (const v of [1, 2]) {
      const cls = `g${gi}v${v}`;
      css.push(`.${cls}{${borderRule(label, base, v)}font:12px/1.4 "Galmuri 11",sans-serif;color:${base.ink ?? "#f4ead0"};background:transparent;cursor:pointer;min-width:${variant(base, v).bw * 2 + 40}px;padding:${Math.max(4, variant(base, v).bw / 2)}px 8px;outline-offset:2px;image-rendering:pixelated}`);
      for (const [st, pseudo] of Object.entries(PSEUDO)) {
        const q = piece(st);
        if (q) css.push(`.${cls}${pseudo}{border-image-source:url("${src(label, q, v)}")}`);
      }
      css.push(`.${cls}:focus-visible{outline:2px solid #5fd6a0}`);
      const stat = Object.keys(g.states).map((st) => {
        const q = piece(st), t = variant(q, v);
        return `<div class="cell"><div class="box" style="${borderRule(label, q, v)}width:${Math.max(110, t.bw * 2 + 70)}px;height:${Math.max(40, t.bw * 2 + 20)}px;box-sizing:border-box"></div><div class="m">${STATE_VI[st] ?? st}</div></div>`;
      }).join("");
      body.push(`<div class="row"><div class="m lab">DPR ${v} · thật</div><button class="${cls}">Hồn hoàn</button><button class="${cls}" aria-pressed="false" onclick="this.setAttribute('aria-pressed',this.getAttribute('aria-pressed')==='true'?'false':'true')">Chọn tôi</button><button class="${cls}" disabled>Bị tắt</button></div><div class="row"><div class="m lab">DPR ${v} · tĩnh</div>${stat}</div>`);
    }
    body.push("</div>");
  });

  // ----- E. chuỗi tiếng Việt đủ dấu 10 / 12 / 24 px
  body.push(`<h2 id="e">E. Chữ Việt đủ dấu 10 / 12 / 24 px trong khung</h2><p class="m">Nút / khung thật bao quanh chữ (padding tối thiểu = vạch cắt + 2 px). Dấu bị cắt, chữ tràn, đệm trên không đủ chỗ cho dấu ở 12 px là lỗi. Phông Galmuri 11 nếu có (chép từ client), không thì phông dự phòng của trình duyệt.</p>`);
  const host = usable[0] ? { ...usable[0], base: byKey.get(`${usable[0].label}/${usable[0].g.states.thuong}`) } : stretch[0] ? { label: stretch[0].label, base: stretch[0] } : null;
  if (!host) body.push(`<p class="m">Không có mảnh co giãn để chứa chữ.</p>`);
  else for (const v of [1, 2]) {
    const t = variant(host.base, v);
    for (const [bgId, bgc] of BACKGROUNDS) {
      body.push(`<div class="textbg" style="background:${bgc}"><div class="m lab">${esc(host.base.key)} · DPR ${v} · nền ${bgId}</div>`);
      for (const fs of FONT_SIZES) {
        body.push(`<div class="row">${VI_STRINGS.map((s) => `<span class="t" style="${borderRule(host.label, host.base, v)}font:${fs}px/1.3 'Galmuri 11',sans-serif;color:${host.base.ink ?? "#f4ead0"};padding:${Math.ceil(t.bw + 2)}px ${Math.ceil(t.bw + 6)}px;display:inline-block;image-rendering:pixelated">${esc(s)}</span>`).join("")}<span class="m">${fs} px</span></div>`);
      }
      body.push("</div>");
    }
  }

  const head = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>
@font-face{font-family:"Galmuri 11";src:url("fonts/galmuri-11.woff2") format("woff2");font-display:block}
body{margin:0;padding:16px 24px;background:#2a2433;color:#eee;font:14px/1.5 system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px;border-bottom:1px solid #554a66;padding-bottom:4px}
table{border-collapse:collapse;font-size:12px}th,td{border:1px solid #554a66;padding:3px 8px;text-align:left}
.m{color:#a99dbd;font-size:12px}.name{font-weight:600;margin:10px 0 4px}.piece{margin-bottom:8px}
.px,.box,.t,button{image-rendering:pixelated}.row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin:6px 0}
.cell{display:flex;flex-direction:column;gap:2px}.lab{width:110px}.bg td{padding:10px;text-align:center}.textbg{padding:8px 12px;margin:6px 0;border:1px solid #554a66}.textbg .m{color:#777}
${css.join("\n")}
</style></head><body><h1>${esc(title)}</h1><p class="m">Tạo bởi <code>tools/assets/ui-kit-preview.mjs</code>. DPR thật của máy này: <b id="dpr">?</b>. Nguồn: ${sources.map((s) => esc(s.label)).join(", ")}.</p>
<script>document.getElementById("dpr").textContent=String(window.devicePixelRatio)</script>`;
  return `${head}${body.join("\n")}</body></html>\n`;
}

/** Ghi trang + bản chép ảnh vào `out`. `sources`: [{ label, pieces, groups, read(rel) → Buffer }]. Trả về { file, pieces }. */
export function writePreview(sources, out, opt = {}) {
  mkdirSync(out, { recursive: true });
  for (const s of sources) for (const p of s.pieces) for (const v of [1, 2]) {
    const rel = `${v}x/${p.key}.png`, dst = path.join(out, s.label, rel);
    mkdirSync(path.dirname(dst), { recursive: true });
    const buf = s.read(rel);
    writeFileSync(dst, buf);
    if (v === 2) { const m = decodePng(buf), c = m.get(m.w >> 1, m.h >> 1); p.ink = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] > 140 ? "#1a1020" : "#f4ead0"; }
  }
  const font = path.join(ROOT, "client", "src", "fonts", "galmuri-11.woff2");
  if (existsSync(font)) { mkdirSync(path.join(out, "fonts"), { recursive: true }); copyFileSync(font, path.join(out, "fonts", "galmuri-11.woff2")); }
  const file = path.join(out, "index.html");
  writeFileSync(file, buildPage(sources, opt));
  return { file, pieces: sources.reduce((n, s) => n + s.pieces.length, 0) };
}

/** Nguồn từ thư mục `ui-sheet-cut` (manifest-entry.json + 1x/ + 2x/). */
export function sourceFromDir(dir, label = path.basename(path.resolve(dir))) {
  const m = JSON.parse(readFileSync(path.join(dir, "manifest-entry.json"), "utf8"));
  return { label: cssId(label), pieces: m.pieces, groups: m.groups, read: (rel) => readFileSync(path.join(dir, rel)) };
}

/** Nguồn từ tờ giả lập (C2 / UI-5): cắt bằng `cutUiSheet`, KHÔNG phải ảnh model. */
export async function sourceFromFixture(id) {
  const { cutUiSheet } = await import("./ui-sheet-cut.mjs");
  const fx = await import("./ui-sheet-fixture.mjs"), kit = { ...loadKit(), pieces: [], groups: {} };
  let cut;
  if (id === "c2") cut = cutUiSheet({ img: fx.c2Sheet(), name: "c2", kindId: "C2", kit: { ...kit, kinds: { ...kit.kinds, C2: fx.C2_KIND } }, mirror: false });
  else if (id === "ui5") {
    // 2 khung + bộ nút 4 trạng thái (cùng bộ) để thử mục D (hover / focus thật).
    const ui5 = { ...kit.kinds.F, id: "UI5", pieces: fx.UI5_FRAMES.map((name) => (name.startsWith("nut_") ? { name, set: "nut", state: name.slice(4) } : { name })) };
    cut = cutUiSheet({ img: fx.ui5Sheet(), name: "ui5", kindId: "UI5", kit: { ...kit, kinds: { ...kit.kinds, UI5: ui5 } }, mirror: false });
  }
  else throw new Error(`fixture lạ: ${id} (có: c2, ui5)`);
  return { label: id, pieces: cut.pieces, groups: cut.groups, read: (rel) => cut.files.get(rel) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const a = process.argv.slice(2), dirs = [], fixtures = [];
    let out;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === "--dir") dirs.push(a[++i]);
      else if (a[i] === "--out") out = a[++i];
      else if (a[i] === "--fixture") fixtures.push(...a[++i].split(",").filter(Boolean));
      else throw new Error(`tùy chọn lạ: ${a[i]}`);
    }
    if (!out || (!dirs.length && !fixtures.length)) {
      console.error("Dùng: node tools/assets/ui-kit-preview.mjs (--dir <thư mục ui:cut> … | --fixture c2,ui5) --out <thư mục>");
      process.exit(2);
    }
    const sources = [];
    for (const d of dirs) { if (!existsSync(path.join(d, "manifest-entry.json"))) throw new Error(`${d} không có manifest-entry.json (chạy npm run ui:cut trước)`); sources.push(sourceFromDir(d)); }
    for (const f of fixtures) sources.push(await sourceFromFixture(f));
    const r = writePreview(sources, out, { title: fixtures.length && !dirs.length ? "Bộ component UI Kit (tờ giả lập, không phải ảnh model)" : "Bộ component UI Kit" });
    console.log(`Đã ghi ${r.file} (${r.pieces} mảnh)`);
  } catch (e) { console.error(e.message); process.exit(2); }
}
