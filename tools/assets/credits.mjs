// Sinh dữ liệu màn "Ghi công" (#629) từ art/CREDITS.md (+ tools/assets/private-packs.json nếu có) ra shared/assets/credits/credits.json.
//   node tools/assets/credits.mjs           -> ghi shared/assets/credits/credits.json (commit kèm file; npm run check chạy --check nên CREDITS.md đổi mà quên sinh lại thì lỗi)
//   node tools/assets/credits.mjs --check   -> không ghi; lỗi nếu CREDITS.md có mục lạ / dòng thiếu tác giả hoặc giấy phép / file credits.json cũ
// Không sửa tay credits.json. Mỗi dòng bảng trong CREDITS.md phải rơi vào đúng một nhóm; mục mới (## …) chưa được khai ở SECTIONS thì check lỗi,
// để asset mới không lọt khỏi màn Ghi công. Tên gốc trong gói kho riêng (private-rename.json) KHÔNG vào đây.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const CREDITS_MD = path.join(root, "art/CREDITS.md");
const PACKS_JSON = path.join(root, "tools/assets/private-packs.json");
export const OUT = path.join(root, "shared/assets/credits/credits.json");

/** Nhóm hiển thị, theo thứ tự trên màn hình. */
const GROUPS = {
  rieng: { title: "Hiệu ứng và asset từ gói ngoài", note: "Gói đã mua / tải miễn phí, dùng đúng giấy phép của từng gói; ảnh thuộc kho riêng của dự án." },
  gi: { title: "Biểu tượng (game-icons.net)", note: "Icons made by Lorc, Delapouite, Faithtoken from https://game-icons.net, CC BY 3.0. Dự án chỉ tô màu, viền và khung lại." },
  lpc: { title: "Nhân vật, hồn thú, vật phẩm (LPC / OpenGameArt)", note: "Universal LPC Spritesheet Character Generator và gói OpenGameArt. Mỗi tác giả kèm giấy phép game dùng; ảnh ghép theo giấy phép nghiêm nhất của các lớp." },
  am: { title: "Âm thanh", note: "Âm thanh chỉ dùng thư viện CC0 / miễn phí bản quyền, không AI; nhạc nền do nhóm viết MIDI bằng code." },
  font: { title: "Phông chữ", note: "" },
  khac: { title: "Asset ngoài khác", note: "" },
  nhom: { title: "Hình do nhóm làm", note: "Vẽ tay, sinh bằng mã, hoặc tạo với công cụ AI rồi hậu kỳ pixel theo bảng màu của dự án; dùng theo điều khoản của từng công cụ." },
};

/** Tiêu đề mục ## -> cách đọc. `skip`: không phải asset đang dùng (lịch sử, giới thiệu); `doc`: mô tả, dữ liệu lấy từ nơi khác. */
const SECTIONS = [
  [/^Nguồn gốc và giấy phép/, "skip"],
  [/^game-icons\.net/, "gi"],
  [/^C6 /, "own:Codex (imagegen): màn đăng nhập, logo, banner"],
  [/^Asset tự vẽ/, "own:Nhóm tự vẽ / sinh bằng mã"],
  [/^Asset tạo bằng AI \((.+)\)/, "ai"],
  [/^Asset bên ngoài/, "external"],
  [/^Asset LPC/, "lpc"],
  [/^Hồn thú: hình tạm/, "oga"],
  [/^Biểu tượng vật phẩm/, "oga"],
  [/^Âm thanh/, "audio"],
  [/^Hiệu ứng âm thanh/, "audio"],
  [/^Lịch sử/, "skip"],
  [/^Asset kho riêng/, "doc"],
];

/** Tách một dòng bảng Markdown thành ô; `|` trong cặp dấu huyền hoặc `\|` không tính. */
function cells(line) {
  const out = []; let cur = "", tick = false;
  const s = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && s[i + 1] === "|") { cur += "|"; i++; continue; }
    if (c === "`") tick = !tick;
    if (c === "|" && !tick) { out.push(cur.trim()); cur = ""; } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

/** Đọc CREDITS.md thành danh sách bảng: { section, sub, head[], rows[][] }. */
export function parseTables(md) {
  const tables = []; let section = "", sub = "", cur = null;
  for (const line of md.split(/\r?\n/)) {
    const h = /^(#{2,3}) (.+)$/.exec(line);
    if (h) { if (h[1] === "##") { section = h[2].trim(); sub = ""; } else sub = h[2].trim(); cur = null; continue; }
    if (!line.startsWith("|")) { cur = null; continue; }
    const c = cells(line);
    if (c.every((x) => /^:?-{2,}:?$/.test(x))) continue; // dòng kẻ
    if (!cur) { cur = { section, sub, head: c, rows: [] }; tables.push(cur); } else cur.rows.push(c);
  }
  return tables;
}

const clean = (s) => s.replace(/`/g, "").replace(/\*\*/g, "").replace(/<br>/g, ", ").replace(/\s+/g, " ").trim();
const urls = (s) => [...new Set((s.match(/https?:\/\/[^\s<>)\]|`]+/g) ?? []).map((u) => u.replace(/[.,;]+$/, "")))];
/** Tách danh sách tác giả; bỏ ghi chú vai trò "(gốc)" / ", sửa" và chỗ trống "??" (CREDITS.csv của LPC chưa biết tác giả). */
const splitAuthors = (s) => clean(s.replace(/<br>/g, ", ")).split(/,\s*(?![^()]*\))/)
  .map((a) => a.replace(/\s*\((?:gốc|sửa)\)/g, "").replace(/,\s*sửa\)/, ")").trim()).filter((a) => a && !/^\?+$/.test(a));
const col = (head, re) => head.findIndex((h) => re.test(h));
const slugTitle = (u) => decodeURIComponent(u.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() ?? u).replace(/[-_+]+/g, " ");

/** Gộp theo khóa (tác giả / công cụ): đếm dòng, hợp giấy phép và link. */
class Bag {
  constructor(onIds = () => {}) { this.m = new Map(); this.onIds = onIds; }
  add(name, { license = "", url = "", count = 1, ids = [] } = {}) {
    const k = name.toLowerCase();
    let e = this.m.get(k);
    if (!e) this.m.set(k, e = { name, licenses: new Set(), urls: new Set(), count: 0, ids: new Set() });
    if (license) e.licenses.add(license);
    if (url) e.urls.add(url);
    e.count += count; ids.forEach((i) => { e.ids.add(i); this.onIds(i); });
  }
}
const finish = (bag, extra = {}) => [...bag.m.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)).map((e) => ({
  name: e.name,
  ...(e.licenses.size ? { license: [...e.licenses].join(", ") } : {}),
  ...(e.urls.size ? { urls: [...e.urls] } : {}),
  count: e.count,
  ...extra,
}));

/** Giấy phép game dùng: ưu tiên phần in đậm (cột "Giấy phép của gói"), bỏ chú thích cờ. */
const usedLicense = (s) => { const b = /\*\*([^*]+)\*\*/.exec(s); return clean(b ? b[1] : s).replace(/\s*\(cờ [^)]*\)/g, ""); };

export function buildCredits({ md = readFileSync(CREDITS_MD, "utf8"), packs } = {}) {
  if (packs === undefined) packs = existsSync(PACKS_JSON) ? JSON.parse(readFileSync(PACKS_JSON, "utf8")) : null;
  const covered = new Set();
  const bags = Object.fromEntries(Object.keys(GROUPS).map((k) => [k, new Bag((i) => covered.add(i))]));
  const links = Object.fromEntries(Object.keys(GROUPS).map((k) => [k, new Map()]));
  const problems = [], seenAuthors = new Set(), rowIds = [];
  const take = (id) => { rowIds.push(id); return id; };
  const knownSections = new Set();

  for (const t of parseTables(md)) {
    const rule = SECTIONS.find(([re]) => re.test(t.section));
    if (!rule) { problems.push(`Mục "## ${t.section}" có bảng nhưng chưa khai ở SECTIONS (tools/assets/credits.mjs): asset sẽ không hiện ở màn Ghi công.`); continue; }
    knownSections.add(t.section);
    const kind = rule[1];
    if (kind === "skip" || kind === "doc") continue;
    const m = rule[0].exec(t.section);
    const where = `${t.section}${t.sub ? ` / ${t.sub}` : ""}`;
    const head = t.head;

    for (const r of t.rows) {
      const id0 = clean(r[0] ?? "");
      if (!id0) { problems.push(`${where}: dòng trống cột đầu.`); continue; }
      const id = take(`${where}: ${id0}`);

      if (kind === "gi") {
        const a = /^(.+?) \((https?:\/\/[^)]+)\), (CC BY [\d.]+)/.exec(r[2] ?? "");
        if (!a) { problems.push(`${id}: không đọc được "tác giả (link), giấy phép" ở cột 3.`); continue; }
        bags.gi.add(a[1], { license: a[3], url: a[2], ids: [id] }); seenAuthors.add(a[1]);
        links.gi.set("https://game-icons.net", "game-icons.net");
      } else if (kind.startsWith("own:") || kind === "ai") {
        const tool = kind === "ai" ? ({ PixelLab: "PixelLab (ảnh cũ, đã ngừng dùng)", Gemini: "Gemini (Google)", ComfyUI: "ComfyUI (model mở, tự host)", ChatGPT: "ChatGPT / Codex imagegen", "Microsoft Copilot": "Microsoft Copilot" }[m[1]] ?? `${m[1]} (AI)`) : kind.slice(4);
        bags.nhom.add(tool, { license: kind === "ai" ? "Theo điều khoản của công cụ" : "Của dự án", ids: [id] });
      } else if (kind === "external") {
        const author = clean(r[1] ?? ""), license = clean((r[3] ?? "").replace(/\s*\(`[^)]*\)/g, ""));
        if (!author || !license) { problems.push(`${id}: thiếu tác giả hoặc giấy phép.`); continue; }
        const font = /font|woff2/i.test(r[0]);
        const quoted = [...(/font ((?:"[^"]+"(?: \/ )?)+)/.exec(r[0])?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1]);
        const name = quoted.length ? quoted.join(" / ") : clean(r[0]).replace(/^\(font\)\s*/, "");
        const g = font ? "font" : "khac";
        bags[g].add(`${name} — ${author}`, { license, url: urls(r[2] ?? "")[0] ?? "", ids: [id] });
        splitAuthors(author).forEach((a) => seenAuthors.add(a));
      } else if (kind === "lpc" || kind === "oga") {
        const ia = col(head, /Tác giả/), il = kind === "lpc" ? (col(head, /Game dùng theo/) >= 0 ? col(head, /Game dùng theo/) : col(head, /Giấy phép/)) : col(head, /Giấy phép/);
        const is = col(head, /Nguồn/);
        if (ia < 0 || il < 0) { problems.push(`${where}: bảng thiếu cột Tác giả / Giấy phép.`); break; }
        const authors = splitAuthors(r[ia] ?? ""), license = usedLicense(r[il] ?? ""), src = urls(r[is] ?? "");
        if (!authors.length || !license) { problems.push(`${id}: thiếu tác giả hoặc giấy phép.`); continue; }
        for (const a of authors) { bags.lpc.add(a, { license, ids: [id] }); seenAuthors.add(a); }
        for (const u of src) links.lpc.set(u, slugTitle(u));
      } else if (kind === "audio") {
        const ia = col(head, /Tác giả/), il = col(head, /Giấy phép/), ip = col(head, /Provenance/);
        if (ia < 0 || il < 0 || ip < 0) { problems.push(`${where}: bảng thiếu cột Tác giả / Giấy phép / Provenance.`); break; }
        const authors = splitAuthors(r[ia] ?? ""), license = clean(r[il] ?? "");
        const srcs = (r[ip] ?? "").split("<br>").map((p) => /^(.*?) — <?(https?:\/\/[^\s>]+)>?/.exec(p.trim())).filter(Boolean).map((x) => [x[2], clean(x[1])]);
        if (!authors.length || !license) { problems.push(`${id}: thiếu tác giả hoặc giấy phép.`); continue; }
        // Ghép tác giả với nguồn theo thứ tự khi cùng số lượng hoặc chỉ một nguồn; còn lại để nguồn ở mức nhóm (không gán sai tác giả).
        const pair = srcs.length === authors.length ? srcs.map((s) => [s]) : srcs.length === 1 ? authors.map(() => [srcs[0]]) : authors.map(() => []);
        authors.forEach((a, i) => { bags.am.add(a, { license, url: pair[i][0]?.[0] ?? "", ids: [id] }); seenAuthors.add(a); });
        for (const [u, title] of srcs) links.am.set(u, title);
      } else problems.push(`${where}: kiểu mục "${kind}" chưa hỗ trợ.`);
    }
  }

  // Gói kho riêng: ảnh không nằm trong repo công khai nhưng tác giả vẫn phải được ghi công (Gigapack bắt buộc).
  const packList = [];
  if (packs?.packs) {
    for (const [key, p] of Object.entries(packs.packs)) {
      const credit = clean(p.credit ?? ""), name = clean(p.name ?? key), author = clean(p.author ?? "");
      if (!credit || !author) { problems.push(`private-packs.json gói "${key}": thiếu credit hoặc author.`); continue; }
      const license = /CC BY [\d.]+/.exec(p.license ?? "")?.[0] ?? "Giấy phép riêng của gói";
      packList.push({ name, author, license, credit, ...(p.source ? { urls: [p.source] } : {}) });
      seenAuthors.add(author);
    }
    packList.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  const groups = [];
  for (const [id, g] of Object.entries(GROUPS)) {
    let entries = id === "rieng" ? packList : finish(bags[id]);
    if (!entries.length) continue;
    const lk = [...links[id]].sort(([a], [b]) => (a < b ? -1 : 1)).map(([url, name]) => ({ name, url }));
    groups.push({ id, title: g.title, ...(g.note ? { note: g.note } : {}), entries, ...(lk.length ? { links: lk } : {}) });
  }
  const data = { v: 1, groups };
  return { data, problems, seenAuthors, rowIds, covered, packList };
}

/** Kiểm tra: không lỗi đọc, mọi tác giả / dòng bảng đã vào dữ liệu, các dòng ghi công bắt buộc có mặt. */
export function validate({ data, problems, seenAuthors, rowIds, covered, packList }) {
  const errs = [...problems];
  const text = JSON.stringify(data);
  const dec = (s) => JSON.stringify(s).slice(1, -1);
  const names = new Set(data.groups.flatMap((g) => g.entries.flatMap((e) => [e.name, e.author].filter(Boolean).flatMap((n) => n.split(" — ")).map((n) => n.toLowerCase()))));
  const inAnyEntry = (a) => names.has(a.toLowerCase()) || [...names].some((n) => splitAuthors(n).includes(a.toLowerCase()));
  for (const a of seenAuthors) if (!inAnyEntry(a)) errs.push(`Tác giả "${a}" có trong CREDITS.md nhưng không có trong màn Ghi công.`);
  for (const id of rowIds) if (!covered.has(id)) errs.push(`Dòng "${id}" không được tính vào nhóm nào.`);
  for (const p of packList) if (!text.includes(dec(p.credit))) errs.push(`Dòng ghi công bắt buộc "${p.credit}" thiếu.`);
  if (packList.some((p) => /Super Pixel Effects Gigapack/.test(p.name)) && !text.includes("Super Pixel Effects Gigapack - Will Tice / unTied Games"))
    errs.push('Thiếu dòng "Super Pixel Effects Gigapack - Will Tice / unTied Games".');
  for (const g of data.groups) for (const e of g.entries) if (!e.name?.trim()) errs.push(`Nhóm "${g.id}" có mục không tên.`);
  if (!data.groups.length) errs.push("Không có nhóm nào.");
  return errs;
}

function main() {
  const check = process.argv.includes("--check");
  const res = buildCredits();
  const errs = validate(res);
  const json = JSON.stringify(res.data) + "\n";
  if (check) {
    if (!existsSync(OUT)) errs.push("Chưa có shared/assets/credits/credits.json: chạy node tools/assets/credits.mjs.");
    else if (readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") !== json) errs.push("shared/assets/credits/credits.json cũ so với art/CREDITS.md: chạy node tools/assets/credits.mjs rồi commit.");
  }
  if (errs.length) { console.error(`[credits] ${errs.length} lỗi:\n- ${errs.slice(0, 30).join("\n- ")}`); process.exit(1); }
  if (!check) writeFileSync(OUT, json);
  const n = res.data.groups.reduce((s, g) => s + g.entries.length, 0);
  console.log(`[credits] ${check ? "OK" : "đã ghi"} ${res.data.groups.length} nhóm, ${n} mục (${res.rowIds.length} dòng CREDITS.md${res.packList.length ? `, ${res.packList.length} gói kho riêng` : ""}).`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
