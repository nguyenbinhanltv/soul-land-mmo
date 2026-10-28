// Trang xem trước bộ khung màn + thành phần nhỏ của UI Kit v2 (#885): mọi trạng thái × 3 nền × 3 cỡ khung × Mực / Giấy × bản kit 1× / 2×.
//   node --experimental-strip-types tools/assets/ui-parts-preview.mjs --out <thư mục ngoài repo>
// Dùng đúng uiParts.ts (cây dựng, hàm thuần), ui2.css, ui2-parts.css và kit đã nhập (shared/assets/sprites/iso/ui2, manifest); tự chứa (ảnh và phông nhúng
// vào HTML) nên mở thẳng `index.html`. Đồng hồ trên trang là tĩnh (giờ cố định) để ảnh chụp lặp lại; nút "Kit 2×" đổi bản kit như client làm khi --u × DPR ≥ 2.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cardNode, countdownNode, frameNode, toggleNode, toHtml, abbrevNumber, stateNode, selectNode, qtyNode, tabsNode, slotNode } from "../../client/src/uiParts.ts";
import { kitClasses, kitTokens } from "../../client/src/uiKit.ts";
import { TIERS } from "../../shared/data.ts";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (p) => readFileSync(path.join(ROOT, p));
export const BACKGROUNDS = [["sang", "#e8dcc0"], ["toi", "#14101c"], ["trang", "#ffffff"]];
export const SIZES = [[360, 240], [520, 320], [760, 420]];
const NOW = 1_000_000;

const dataUrl = (key, scale) => `data:image/png;base64,${read(`shared/assets/sprites/iso/ui2/${scale}x/${key}.png`).toString("base64")}`;
const entries = JSON.parse(read("shared/assets/sprites/manifest.json").toString()).sprites.filter((e) => typeof e !== "string" && /^ui2_/.test(e.key));
const rootBlock = () => /:root\{[\s\S]*?\n\}/.exec(read("client/src/style.css").toString())?.[0] ?? "";

/** Nội dung mẫu của một khung: đủ trạng thái thẻ, hạng, công tắc, đồng hồ. */
function sample(mat, [w]) {
  const small = w < 400;
  const cards = [
    { title: "Hồn hoàn", sub: "10 000 năm", state: "new", rank: 2 },
    { title: "Hồn cốt", sub: "Nâng được", state: "up", rank: 3 },
    { title: "Nhiệm vụ", sub: "Đã nhận", state: "done", rank: 1 },
    { title: "Hồn hạch", sub: "Chưa đủ cấp", state: "lock", reason: "Cần cấp 30", rank: 4 },
    { title: "Gói quà", sub: "Mua mỗi ngày", limit: "Giới hạn 3/ngày", rank: 0 },
  ].slice(0, small ? 2 : 5);
  return [
    `<div class="pv-grid">${cards.map((c) => toHtml(cardNode(c))).join("")}</div>`,
    `<div class="pv-row">${toHtml(toggleNode({ label: "Âm thanh", on: true }))}${small ? "" : toHtml(toggleNode({ label: "Rung", on: false }))}${small ? "" : toHtml(toggleNode({ label: "Khoá", on: true, disabled: true }))}</div>`,
    `<div class="pv-row">${small ? "" : toHtml(countdownNode({ target: NOW + 93_784_000, label: "Mở sau" }, () => NOW))}${toHtml(countdownNode({ target: NOW + 754_000, label: "Hết hạn" }, () => NOW))}${small ? "" : toHtml(countdownNode({ target: NOW - 1 }, () => NOW))}</div>`,
  ].join("");
}

/** Bộ phận đợt 0b: trạng thái tải / rỗng / lỗi, hộp xổ (mở), thanh trượt số lượng, tab hình thang + tab icon dọc, ô vật phẩm có nhãn. */
export function partsHtml(mat, [w]) {
  const small = w < 400;
  const opts = [{ value: "a", label: "Tất cả" }, { value: "b", label: "Hồn hoàn", disabled: true }, { value: "c", label: "Hồn cốt" }];
  const tabs = [{ id: "a", label: "Vật phẩm" }, { id: "b", label: "Hồn hoàn", active: true, dot: true }, { id: "c", label: "Hồn cốt" }, { id: "d", label: "Mảnh", disabled: true, reason: "Cần cấp 30" }].slice(0, small ? 3 : 4);
  const vtabs = [{ id: "a", label: "Âm thanh", icon: "A" }, { id: "b", label: "Hiệu ứng", icon: "H", active: true }, { id: "c", label: "Phím", icon: "P", dot: true }, { id: "d", label: "Khoá", icon: "K", disabled: true, reason: "Chưa mở" }];
  const slots = [
    { name: "Hồn hoàn", qty: 12, rank: 0 }, { name: "Hồn cốt", qty: 1500, rank: 2, state: "new" }, { name: "Hồn hạch", rank: 3, state: "up", selected: true },
    { name: "Mảnh võ hồn", qty: 3, rank: 4, state: "lock", reason: "Cần cấp 30" }, { name: "", empty: true },
  ].slice(0, small ? 4 : 5);
  const st = (o) => `<div class="pv-st">${toHtml(stateNode(o))}</div>`;
  return [
    `<div class="pv-row">${st({ kind: "loading", rows: 3 })}${st({ kind: "empty", text: "Chưa có hồn cốt", hint: "Săn hồn thú để nhận" })}${small ? "" : st({ kind: "error" })}</div>`,
    `<div class="pv-row">${toHtml(qtyNode({ label: "Số lượng bán", max: 12, value: 5 }))}</div>`,
    `<div class="pv-row pv-top-row">${toHtml(selectNode({ label: "Lọc", options: opts, value: "c", open: true }, "pv-sel-" + mat))}</div>`,
    `<div class="pv-row">${toHtml(tabsNode({ label: "Túi", tabs }))}</div>`,
    `<div class="pv-row" style="align-items:flex-start">${toHtml(tabsNode({ label: "Cài đặt", tabs: vtabs, vertical: true }))}<div class="pv-row">${slots.map((x) => toHtml(slotNode(x))).join("")}</div></div>`,
  ].join("");
}

export function frameHtml(mat, size) {
  const [w, hgt] = size;
  const f = toHtml(frameNode({ material: mat, title: mat === "muc" ? "Túi" : "Thư", info: "Giải thích ngắn sau dấu i",
    currency: [{ label: "Vàng", value: abbrevNumber(12_500) }, { label: "Ngọc", value: abbrevNumber(1_200_000) }],
    nav: [{ id: "a", label: "Tất cả", active: true }, { id: "b", label: "Hồn hoàn", dot: true }, { id: "c", label: "Nhiệm vụ" }],
    primary: { label: "Nhận hết" } }));
  const locked = toHtml(frameNode({ material: mat, title: "Cửa hàng", primary: { label: "Mua", disabled: true, reason: "Chưa chọn vật phẩm" } }));
  // nội dung mẫu đặt vào .p2-body của khung đầu
  const body = sample(mat, size);
  return { main: f.replace('<div class="p2-body"></div>', `<div class="p2-body">${body}</div>`), locked, w, h: hgt };
}

const partsFrame = (mat, size) => toHtml(frameNode({ material: mat, title: mat === "muc" ? "Bộ phận" : "Bộ phận (Giấy)" })).replace('<div class="p2-body"></div>', `<div class="p2-body">${partsHtml(mat, size)}</div>`);

export function buildPage() {
  const tok = (scale) => kitTokens(entries, scale, dataUrl);
  const cls = ["ui2", ...kitClasses(entries)].join(" ");
  const tiers = TIERS.map((t, i) => `--tier-${i}:${t.col};--tier-${i}-glow:${t.glow};--rare-${i}:${t.col};--rare-${i}-glow:${t.glow};`).join("");
  const vars = (scale) => Object.entries(tok(scale)).map(([k, v]) => `${k}:${v};`).join("");
  const sections = BACKGROUNDS.map(([bn, bc]) => `<section class="pv-bg" style="background:${bc}"><h2 class="pv-h" style="color:${bn === "toi" ? "#ece2c8" : "#1a1020"}">Nền ${bn}</h2>${SIZES.map((s) => {
    const m = frameHtml("muc", s), g = frameHtml("giay", s), pm = partsFrame("muc", s), pg = partsFrame("giay", s);
    return `<div class="pv-cell"><div class="pv-cap">${s[0]}×${s[1]}</div><div class="pv-pair"><div class="pv-fr" style="width:${s[0]}px;height:${s[1]}px">${m.main}</div><div class="pv-fr" style="width:${s[0]}px;height:${s[1]}px">${g.main}</div><div class="pv-fr" style="width:${Math.min(s[0], 360)}px;height:150px">${m.locked}</div></div><div class="pv-parts"><div class="pv-cap">đợt 0b: tải / rỗng / lỗi, hộp xổ, số lượng, tab, ô vật phẩm</div><div class="pv-pair"><div class="pv-fr pv-fr-tall" style="width:${s[0]}px">${pm}</div><div class="pv-fr pv-fr-tall" style="width:${s[0]}px">${pg}</div></div></div></div>`;
  }).join("")}</section>`).join("");
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>UI Kit v2: khung màn + thành phần nhỏ</title>
<style>
@font-face{font-family:"Galmuri 11";src:url(data:font/woff2;base64,${read("client/src/fonts/galmuri-11.woff2").toString("base64")}) format("woff2");font-display:block}
@font-face{font-family:"Galmuri 9";src:url(data:font/woff2;base64,${read("client/src/fonts/galmuri-9.woff2").toString("base64")}) format("woff2");font-display:block}
${rootBlock().replace(":root{", `:root{${tiers}`)}
:root{${vars(1)}}
body.k2{${vars(2)}}
${read("client/src/ui2.css")}
${read("client/src/ui2-parts.css")}
body{margin:0;font:12px/1.4 var(--f12)}
.pv-top{position:sticky;top:0;z-index:5;display:flex;gap:12px;align-items:center;padding:8px 16px;background:#14101c;color:#ece2c8}
.pv-top button{font:12px var(--f12);padding:4px 10px;cursor:pointer}
.pv-bg{padding:16px 24px 32px}.pv-h{font:24px/1.2 var(--f12);margin:0 0 12px}
.pv-cell{margin-bottom:20px}.pv-cap{font:10px var(--f10);margin-bottom:4px;opacity:.7}
.pv-pair{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}.pv-fr{display:flex;overflow:hidden}.pv-fr>.p2-man{flex:1}
.pv-fr .p2-nav:empty{display:none}.pv-fr .p2-man{grid-template-columns:1fr}.only-parts .pv-cell>*:not(.pv-parts),.only-parts .pv-h{display:none}.pv-fr-tall{height:auto;min-height:240px}.pv-st{flex:1 1 140px;min-width:120px}.pv-top-row{align-items:flex-start;min-height:128px}.pv-top-row .p2-select{min-width:140px}.pv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px;margin-bottom:12px}.pv-row{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:8px}
</style></head><body class="${cls}"><div class="pv-top"><b>UI Kit v2: khung màn + thành phần nhỏ</b><button id="k">Kit 2×</button><span>Mực / Giấy × 3 nền × 3 cỡ. Đồng hồ tĩnh. Bàn phím: Tab để thấy focus.</span></div>${sections}
<script>if(location.hash==="#parts")document.body.classList.add("only-parts");const b=document.getElementById("k");b.onclick=()=>{const on=document.body.classList.toggle("k2");b.textContent=on?"Kit 1×":"Kit 2×"};document.addEventListener("click",e=>{const s=e.target.closest(".p2-sw");if(s&&!s.disabled)s.setAttribute("aria-checked",s.getAttribute("aria-checked")!=="true")})</script></body></html>`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--out");
  if (i < 0 || !process.argv[i + 1]) { console.error("Dùng: node --experimental-strip-types tools/assets/ui-parts-preview.mjs --out <thư mục ngoài repo>"); process.exit(2); }
  mkdirSync(process.argv[i + 1], { recursive: true });
  const file = path.join(process.argv[i + 1], "index.html");
  writeFileSync(file, buildPage());
  console.log(`đã ghi ${file}`);
}
