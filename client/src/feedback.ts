// Thông báo dạng toast (UI-4, #354): đồ nhận được, lên cấp, nhiệm vụ, boss, thông tin chung. Chồng ở góc dưới phải (không che giữa màn
// hình, khác `hud.banner` chỉ dành cho sự kiện lớn). Chỉ hiển thị; mọi chữ qua textContent. Kiểu ở `feedback.css`.
import "./feedback.css";
import type { BagItem } from "./net.ts";
import { bagItemInfo } from "./hud.ts";
import { rarityOf } from "./bag.ts";
import { RING_ITEM } from "../../shared/data.ts";
import { RARE_LOOT_MIN } from "./audio/soundMap.ts";
import "./ui2-feedback.css";
import { logNotice, NOTICE_LABEL, type ToastKind } from "./noticeLog.ts";
export { notices, onNotices, clearNotices, LOG_MAX, type Notice, type ToastKind } from "./noticeLog.ts";

// Banner nhận khung Mực của kit (chip lệnh do cmdChip.ts, tooltip do tooltip.ts). Luật vẽ ở ui2-feedback.css.
document.getElementById("banner")?.classList.add("f2-muc-nho");

/** Loại toast: nhãn nhỏ ở đầu dòng và màu vạch trái (đặt ở CSS theo `data-k`, màu niên hạn của đồ rơi theo `--c`). */
type ToastFrame = "rare-ring";
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
export function toast(kind: ToastKind, title: string, sub = "", color?: string, frame?: ToastFrame) {
  const el0 = root();
  for (const t of Array.from(el0.children) as HTMLElement[]) {
    if (t.dataset.k !== kind || t.dataset.title !== title || t.classList.contains("out")) continue;
    if (kind === "loot" && frame) t.dataset.frame = frame;
    const n = Number(t.dataset.n ?? "1") + 1; t.dataset.n = String(n);
    (t.querySelector(".tn") as HTMLElement).textContent = `×${n}`;
    logNotice(kind, title, sub, true);
    arm(t); return;
  }
  const t = document.createElement("div"); t.className = "toast f2-toast"; t.dataset.k = kind; t.dataset.title = title;
  if (kind === "loot" && frame) t.dataset.frame = frame;
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

const stackKey = (it: BagItem) => `${it.code}|${it.years ?? ""}|${it.stars ?? ""}`;
/** Đồ nhận thêm giữa hai lần túi (cộng theo mã, năm, sao; cả đồ đang mang lẫn trong túi): `n` là số lượng tăng. Dùng chung cho toast và chữ bay. */
export function lootGained(prev: BagItem[], next: BagItem[]): { it: BagItem; n: number }[] {
  const sum = (a: BagItem[]) => { const m = new Map<string, { it: BagItem; n: number }>(); for (const it of a) { const k = stackKey(it), e = m.get(k); if (e) e.n += it.qty; else m.set(k, { it, n: it.qty }); } return m; };
  const before = sum(prev), after = sum(next), gained: { it: BagItem; n: number }[] = [];
  for (const [k, e] of after) { const d = e.n - (before.get(k)?.n ?? 0); if (d > 0) gained.push({ it: e.it, n: d }); }
  return gained;
}
/**
 * So túi mới với túi cũ và báo đồ nhận thêm (tối đa 3 dòng, còn lại gộp "+N món khác"). Cộng theo (mã, năm, sao; không tính cường hóa, vì cường hóa / nâng cấp đổi cấp tại chỗ) cả đồ đang
 * mang lẫn trong túi, nên xếp lại túi, gắn / tháo, gộp ô không báo nhầm; mua, nhặt, nhận thưởng thì báo.
 */
export function lootToasts(prev: BagItem[] | null, next: BagItem[]): number {
  if (!prev) return -1;
  const gained = lootGained(prev, next);
  gained.slice(0, 3).forEach(({ it, n }) => {
    const info = bagItemInfo(it), frame = it.code === RING_ITEM && rarityOf(it) >= RARE_LOOT_MIN ? "rare-ring" : undefined;
    toast("loot", n > 1 ? `${info.name} ×${n}` : info.name, "", info.color, frame);
  });
  if (gained.length > 3) toast("loot", `+${gained.length - 3} món khác`, "Xem trong túi đồ (phím B)");
  return gained.reduce((best, g) => Math.max(best, rarityOf(g.it)), -1); // độ hiếm cao nhất vừa nhận, cho tiếng đồ hiếm
}
