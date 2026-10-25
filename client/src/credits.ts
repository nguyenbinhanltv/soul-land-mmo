// Màn "Ghi công" (#629): đọc credits.json (tools/assets/credits.mjs sinh từ art/CREDITS.md) rồi liệt kê tác giả, giấy phép, nguồn theo nhóm.
// Mở từ màn đăng nhập (main.ts) và Cài đặt (audio/settingsPanel.ts). Chỉ hiển thị; chữ lấy từ file qua textContent.
import { fetchAsset } from "./assetUrl.ts";

interface Entry { name: string; author?: string; license?: string; credit?: string; urls?: string[]; count?: number }
interface Group { id: string; title: string; note?: string; entries: Entry[]; links?: { name: string; url: string }[] }
interface CreditsData { v: number; groups: Group[] }

let loaded: Promise<CreditsData> | null = null;
/** Tải một lần; lỗi thì bỏ cache để lần mở sau thử lại. */
function load(): Promise<CreditsData> {
  loaded ??= fetchAsset("/credits/credits.json").then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<CreditsData>;
  }).catch((e) => { loaded = null; throw e; });
  return loaded;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
/** Chỉ cho http(s): dữ liệu đến từ file nhưng vẫn không dựng link giả (javascript:, data:). */
const link = (url: string, text: string) => {
  const a = el("a", "cr-link", text);
  if (/^https?:\/\//i.test(url)) { a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; }
  return a;
};
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

function entryRow(e: Entry): HTMLElement {
  const row = el("li", "cr-entry");
  // Dòng ghi công bắt buộc của gói (ví dụ Gigapack) in nguyên văn, đứng đầu; tên gói và tác giả nằm ở dòng phụ.
  row.append(el("b", "cr-name", e.credit ?? e.name));
  const meta = el("span", "cr-meta");
  if (e.credit && e.credit !== e.name) meta.append(el("span", "", `${e.name} · ${e.author ?? ""}`));
  if (e.license) meta.append(el("span", "cr-lic", e.license));
  if (e.count && e.count > 1) meta.append(el("span", "", `${e.count} mục`));
  for (const u of e.urls ?? []) meta.append(link(u, host(u)));
  row.append(meta);
  return row;
}

function groupBlock(g: Group): HTMLElement {
  const d = el("details", "cr-group"); d.open = true;
  d.append(el("summary", "", `${g.title} (${g.entries.length})`));
  if (g.note) d.append(el("p", "cr-note", g.note));
  const ul = el("ul", "cr-list");
  for (const e of g.entries) ul.append(entryRow(e));
  d.append(ul);
  if (g.links?.length) {
    const more = el("details", "cr-src");
    more.append(el("summary", "", `Nguồn gói (${g.links.length})`));
    const ls = el("div", "cr-links");
    for (const l of g.links) ls.append(link(l.url, l.name));
    more.append(ls); d.append(more);
  }
  return d;
}

let current: HTMLElement | null = null;

/** Mở màn Ghi công; đang mở thì bỏ qua. Đóng bằng nút ×, phím Esc hoặc chạm nền. */
export function openCredits(): void {
  if (current) return;
  const back = document.activeElement as HTMLElement | null;
  const root = el("div"); root.id = "credits"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Ghi công");
  const box = el("div", "panel cr-box");
  const head = el("div", "cr-head");
  const title = el("div"); title.append(el("b", "", "Ghi công"), el("small", "", "Rừng Săn Hồn dùng asset của những tác giả dưới đây. Cảm ơn họ."));
  const x = el("button", "panel-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Đóng Ghi công");
  head.append(title, x);
  const body = el("div", "cr-body"); body.tabIndex = 0;
  body.append(el("p", "cr-note", "Đang tải…"));
  box.append(head, body); root.append(box);
  (document.getElementById("stage") ?? document.body).append(root);
  current = root;

  const close = () => { root.remove(); current = null; back?.focus?.(); };
  x.addEventListener("click", close);
  root.addEventListener("pointerdown", (ev) => { if (ev.target === root) close(); });
  // Giữ phím trong màn này: Esc đóng, các phím khác không lọt xuống game (đi bộ, chat).
  root.addEventListener("keydown", (ev) => { ev.stopPropagation(); if (ev.key === "Escape") { ev.preventDefault(); close(); } });
  x.focus();

  load().then((data) => {
    if (current !== root) return;
    body.replaceChildren(...data.groups.map(groupBlock));
  }, (e) => {
    if (current !== root) return;
    const retry = el("button", "btn", "Thử lại"); retry.type = "button";
    retry.addEventListener("click", () => { close(); openCredits(); });
    body.replaceChildren(el("p", "cr-note", `Không tải được danh sách ghi công (${(e as Error).message}).`), retry);
  });
}
