// Nhận đồ chỉ vào chat (#1462); toast (UI-4, #354) dành cho lên cấp, nhiệm vụ, boss, lỗi và thông tin chung. Chồng ở góc dưới phải (không che giữa màn
// hình, khác `hud.banner` chỉ dành cho sự kiện lớn). Chỉ hiển thị; mọi chữ qua textContent. Kiểu ở `feedback.css`.
import "./feedback.css";
import type { BagItem } from "./net.ts";
import { bagItemInfo } from "./hud.ts";
import { rarityOf } from "./bag.ts";
import { BONE_ITEM, CORE_ITEM, EQUIP_ITEM, parseBone, parseCore, parseEquip } from "../../shared/data.ts";
import { chatLoot } from "./chat.ts";
import "./ui2-feedback.css";
import { logNotice, NOTICE_LABEL, type ToastKind } from "./noticeLog.ts";
export { notices, onNotices, clearNotices, LOG_MAX, type Notice, type ToastKind } from "./noticeLog.ts";

// Banner nhận khung Mực của kit (chip lệnh do cmdChip.ts, tooltip do tooltip.ts). Luật vẽ ở ui2-feedback.css.
document.getElementById("banner")?.classList.add("f2-muc-nho");

/** Loại toast: nhãn nhỏ ở đầu dòng và màu vạch trái (đặt ở CSS theo `data-k`, màu niên hạn của đồ rơi theo `--c`). */
const LABEL = NOTICE_LABEL;
/** Số toast hiện cùng lúc (cũ nhất bị đẩy đi) và thời gian sống (ms). */
const MAX = 4, LIFE_MS = 4200, FADE_MS = 400;

/** Nơi khác (GameScene) nghe toast MỚI (không phải lần gộp ×n) để phát tiếng giao diện; feedback.ts không biết âm thanh. */
let onNew: (kind: ToastKind) => void = () => {};
export function onToastNew(fn: (kind: ToastKind) => void) { onNew = fn; }

let box: HTMLElement | null = null;
function root() {
  if (box?.isConnected) return box;
  box = document.createElement("div"); box.id = "toasts"; box.setAttribute("aria-live", "polite");
  (document.getElementById("banner")?.parentElement ?? document.body).appendChild(box);
  return box;
}

/** Hiện một toast; cùng loại và cùng tiêu đề đang hiện thì gộp ("×2") thay vì xếp thêm. `color` = màu vạch trái / nhãn (mặc định theo loại). */
export function toast(kind: Exclude<ToastKind, "loot">, title: string, sub = "", color?: string) {
  const el0 = root();
  for (const t of Array.from(el0.children) as HTMLElement[]) {
    if (t.dataset.k !== kind || t.dataset.title !== title || t.classList.contains("out")) continue;
    const n = Number(t.dataset.n ?? "1") + 1; t.dataset.n = String(n);
    (t.querySelector(".tn") as HTMLElement).textContent = `×${n}`;
    logNotice(kind, title, sub, true);
    arm(t); return;
  }
  const t = document.createElement("div"); t.className = "toast f2-toast"; t.dataset.k = kind; t.dataset.title = title;
  if (color) t.style.setProperty("--c", color);
  t.innerHTML = `<i class="tk"></i><div><b></b><small></small></div><em class="tn"></em>`;
  t.querySelector(".tk")!.textContent = LABEL[kind];
  t.querySelector("b")!.textContent = title;
  const s = t.querySelector("small") as HTMLElement; s.textContent = sub; s.hidden = !sub;
  t.addEventListener("click", () => dismiss(t));
  el0.appendChild(t);
  while (el0.querySelectorAll(".toast:not(.out)").length > MAX) dismiss(el0.querySelector(".toast:not(.out)") as HTMLElement);
  logNotice(kind, title, sub, false);
  arm(t); onNew(kind);
}
function arm(t: HTMLElement) {
  clearTimeout(Number(t.dataset.to)); t.dataset.to = String(window.setTimeout(() => dismiss(t), LIFE_MS));
}
function dismiss(t: HTMLElement) {
  if (t.classList.contains("out")) return;
  clearTimeout(Number(t.dataset.to)); t.classList.add("out"); window.setTimeout(() => t.remove(), FADE_MS);
}

const stackKey = (it: BagItem) => {
  const bone = it.code === BONE_ITEM ? parseBone(it.stats) : null;
  const core = it.code === CORE_ITEM ? parseCore(it.stats) : null;
  const equip = it.code === EQUIP_ITEM ? parseEquip(it.stats) : null;
  return JSON.stringify([it.code, it.years, it.stars, bone?.beast, bone?.slot, core?.set, core?.main, equip?.tpl, equip?.ilvl]);
};
/** Đồ nhận thêm giữa hai lần túi (cả đồ đang mang lẫn trong túi): `n` là số lượng tăng, dùng cho chat / dấu đồ mới / âm thanh. */
export function lootGained(prev: BagItem[], next: BagItem[]): { it: BagItem; n: number }[] {
  const sum = (a: BagItem[]) => { const m = new Map<string, { it: BagItem; n: number }>(); for (const it of a) { const k = stackKey(it), e = m.get(k); if (e) e.n += it.qty; else m.set(k, { it, n: it.qty }); } return m; };
  // Cùng id chỉ đổi thuộc tính (đổi bộ, nâng cấp…) không phải món mới. Giữ lượng cũ khi so theo loại mới.
  const byId = new Map(next.map((it) => [it.id, it]));
  const normalized = prev.map((it) => ({ ...(byId.get(it.id) ?? it), qty: it.qty }));
  const before = sum(normalized), after = sum(next), gained: { it: BagItem; n: number }[] = [];
  // Đổi chỗ trang bị có thể trả một mẫu khác về túi: giữ điều kiện tăng ròng theo mã / năm / sao như luồng cũ.
  const groupKey = (it: BagItem) => JSON.stringify([it.code, it.years, it.stars]);
  const budget = new Map<string, number>();
  for (const it of next) { const k = groupKey(it); budget.set(k, (budget.get(k) ?? 0) + it.qty); }
  for (const it of normalized) { const k = groupKey(it); budget.set(k, (budget.get(k) ?? 0) - it.qty); }
  for (const [k, e] of after) {
    const group = groupKey(e.it), n = Math.min(e.n - (before.get(k)?.n ?? 0), budget.get(group) ?? 0);
    if (n > 0) { gained.push({ it: e.it, n }); budget.set(group, budget.get(group)! - n); }
  }
  return gained;
}
/**
 * So túi mới với túi cũ và ghi mọi đồ nhận thêm vào chat, kể cả đồ hiếm; giữ tên hàm cũ cho nơi gọi. Cộng theo (mã, năm, sao; không tính cường hóa, vì cường hóa / nâng cấp đổi cấp tại chỗ) cả đồ đang
 * mang lẫn trong túi, nên xếp lại túi, gắn / tháo, gộp ô không báo nhầm; mua, nhặt, nhận thưởng thì báo.
 */
export function lootToasts(prev: BagItem[] | null, next: BagItem[]): number {
  if (!prev) return -1;
  const gained = lootGained(prev, next);
  gained.forEach(({ it, n }) => {
    const info = bagItemInfo(it);
    const rare = rarityOf(it);
    if (it.code === CORE_ITEM && rare >= 0) info.color = `var(--rare-${rare})`;
    chatLoot(stackKey(it), info.name, n, info.color);
  });
  return gained.reduce((best, g) => Math.max(best, rarityOf(g.it)), -1); // độ hiếm cao nhất vừa nhận, cho tiếng đồ hiếm
}
