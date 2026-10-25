// Chip trạng thái lệnh đang lái nhân vật (M5 #751, docs/design/giao-dien.md mục 5.16 "Điều khiển"): "Đang đánh: <tên> ✕", "Đang đi tới… ✕",
// "Tự đi cờ ✕", "Tự săn ✕"; bấm ✕ huỷ lệnh đó. Khi một lệnh bị lệnh khác thắng thì chip hiện lý do vài giây. Chỉ hiển thị: luật ưu tiên ở
// shared/control.ts, GameScene giữ trạng thái và gọi `setCmdChip` mỗi khung hình.
import type { Cmd } from "../../shared/control.ts";

/** Thời gian chip giữ câu lý do sau khi một lệnh bị huỷ (ms). */
const WHY_MS = 3500;

let onCancel: (c: Cmd) => void = () => {};
let shown = "", cmd: Cmd | null = null, why = "", whyUntil = 0;
const el = () => document.getElementById("cmdChip") as HTMLElement | null;

/** GameScene gắn một lần mỗi cảnh: bấm ✕ trên chip. */
export function bindCmdChip(cancel: (c: Cmd) => void) {
  onCancel = cancel;
  const b = document.getElementById("cmdChipX"); if (!b || b.dataset.bound) return; b.dataset.bound = "1";
  b.addEventListener("click", () => { b.blur(); if (cmd) onCancel(cmd); });
}

/** Báo lý do một lệnh bị huỷ / không bật được (hiện thay chữ chip tới `WHY_MS`). */
export function flashWhy(text: string, now = performance.now()) { why = text; whyUntil = now + WHY_MS; shown = ""; }

/** Vẽ chip: `c` lệnh đang lái (null = không có), `label` chữ của nó. Còn câu lý do thì hiện câu đó (kể cả khi không còn lệnh). Chỉ chạm DOM khi nội dung đổi. */
export function setCmdChip(c: Cmd | null, label: string, now = performance.now()) {
  const root = el(); if (!root) return;
  if (why && now >= whyUntil) { why = ""; shown = ""; }
  cmd = c;
  const key = `${c ?? ""}|${label}|${why}`;
  if (key === shown) return;
  shown = key;
  root.hidden = !c && !why;
  root.classList.toggle("why", !!why);
  root.dataset.cmd = c ?? "";
  root.querySelector<HTMLElement>("#cmdChipText")!.textContent = why || label;
  root.querySelector<HTMLElement>("#cmdChipX")!.hidden = !c;
}
