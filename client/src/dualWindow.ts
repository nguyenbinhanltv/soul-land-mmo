// DualWindowManager (NV1 của #453, mục 5.16 "Hai cửa sổ Nhân vật + Túi" ở GAME_DESIGN.md): chỉ lo bảng Nhân vật (#char) và Túi (#bag) mở độc lập
// hoặc cạnh nhau, lớp nổi, thẻ chuyển ở màn hẹp. Không đọc state game, không gửi tin; bố cục nằm ở style.css theo lớp `dual-win` /
// `data-pick` trên <body>. Các bảng khác (Đội hình, Bạn bè, Thế giới…) vẫn tự đóng nhau như cũ ở hud.ts.
import type { PanelId, WindowState } from "./charBagContract.ts";
import { hideCard, hideCompare } from "./actionCard.ts";
import { raiseStack } from "./panelStack.ts";

const EL: Record<PanelId, string> = { char: "char", bag: "bag" };
const el = (p: PanelId) => document.getElementById(EL[p])!;
const other = (p: PanelId): PanelId => (p === "char" ? "bag" : "char");
const LABEL: Record<PanelId, string> = { char: "Nhân vật", bag: "Túi" };

/** Bảng đang nổi trên cùng, và ở màn hẹp là bảng đang hiện. */
let front: PanelId = "char";

export const isPanelOpen = (p: PanelId) => !el(p).hidden;

/** Trạng thái hiện tại; null khi cả hai đều đóng. */
export function windowState(): WindowState | null {
  const c = isPanelOpen("char"), b = isPanelOpen("bag");
  return c && b ? "dual" : c ? "char" : b ? "bag" : null;
}

/** Nhãn nút ⇆ theo trạng thái hiện tại (đang hai bảng thì bấm sẽ về một bảng `p`). */
function setSwapLabel(b: HTMLElement, p: PanelId) {
  const t = windowState() === "dual" ? `Chỉ ${LABEL[p].toLowerCase()}` : "Mở cả Nhân vật và Túi";
  b.title = t;
  b.setAttribute("aria-label", t);
}

/** Cập nhật lớp trên <body> và lớp `front` trên hai bảng sau mỗi lần mở / đóng / bấm nổi. */
function sync() {
  const st = windowState(), cl = document.body.classList;
  const wasDual = cl.contains("dual-win");
  cl.toggle("dual-win", st === "dual");
  if (wasDual !== (st === "dual")) document.dispatchEvent(new Event("dual-layout"));
  document.body.dataset.pick = front;
  for (const p of ["char", "bag"] as const) el(p).classList.toggle("front", p === front);
  // Đầu bảng không vẽ lại khi bảng kia mở / đóng, nên nhãn nút ⇆ phải cập nhật ở đây.
  document.querySelectorAll<HTMLElement>("button.swap").forEach((b) => setSwapLabel(b, b.dataset.p as PanelId));
  const tabs = document.getElementById("dualTabs");
  if (tabs) {
    tabs.hidden = st !== "dual";
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.p === front));
  }
}

/** Bảng được chọn nổi lên (bấm vào bảng, hoặc vừa mở). */
export function raisePanel(p: PanelId) { front = p; raiseStack(EL[p]); sync(); } // cả ngăn xếp bảng (Esc đóng bảng trên cùng) lẫn lớp `front`

/** Gọi sau khi hud / charPanel đã đặt `hidden`: giữ lớp và thẻ chuyển khớp. Mở bảng thì bảng đó nổi lên. */
export function panelChanged(p: PanelId, open: boolean) {
  if (!open) { hideCard(); hideCompare(); } // thẻ / bảng so sánh gắn vào <body>: đóng cùng bảng, không để nổi lơ lửng
  if (open) front = p; else if (front === p && isPanelOpen(other(p))) front = other(p);
  sync();
}

/** Mở cả hai (nút ⇆ khi đang một bảng) hoặc về một bảng `p` (nút ⇆ khi đang hai bảng). `open(p, on)` là hàm đóng / mở của từng bảng. */
export function swapWindows(p: PanelId, open: (p: PanelId, on: boolean) => void) {
  if (windowState() === "dual") open(other(p), false); else open(other(p), true);
  raisePanel(p);
}

/** Nút ⇆ đặt ở đầu mỗi bảng (renderer gọi mỗi lần vẽ lại đầu bảng). */
export function swapButton(p: PanelId, open: (p: PanelId, on: boolean) => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button"; b.className = "swap"; b.textContent = "⇆";
  b.dataset.p = p;
  setSwapLabel(b, p);
  b.addEventListener("click", () => { b.blur(); swapWindows(p, open); });
  return b;
}

/** Dựng một lần: thẻ chuyển Nhân vật / Túi (chỉ hiện ở màn hẹp khi mở cả hai) và bấm-nổi-lên trên hai bảng. */
export function initDualWindows() {
  for (const p of ["char", "bag"] as const) el(p).addEventListener("pointerdown", () => { if (front !== p) raisePanel(p); }, true);
  // Nơi khác (autoPanel, cài đặt âm thanh…) ẩn bảng trực tiếp bằng `hidden`: theo dõi để lớp và thẻ chuyển luôn khớp.
  const mo = new MutationObserver(() => { if (!isPanelOpen("char") || !isPanelOpen("bag")) { hideCard(); hideCompare(); } if (!isPanelOpen(front) && isPanelOpen(other(front))) front = other(front); sync(); });
  for (const p of ["char", "bag"] as const) mo.observe(el(p), { attributes: true, attributeFilter: ["hidden"] });
  const tabs = document.getElementById("dualTabs");
  if (tabs) {
    tabs.innerHTML = "";
    for (const p of ["char", "bag"] as const) {
      const b = document.createElement("button"); b.type = "button"; b.dataset.p = p; b.textContent = LABEL[p];
      b.addEventListener("click", () => { b.blur(); raisePanel(p); });
      tabs.append(b);
    }
  }
  sync();
}
