// Hộp xác nhận chung + khóa chống bấm đôi (kiểm kê UI/UX #885, mục "hộp thoại xác nhận" và "khóa nút"; docs/design/giao-dien.md).
// Chỉ DOM, không gửi tin: nơi gọi truyền `onYes` (đúng lệnh cũ). Mặc định tập trung nút an toàn (Hủy); nút nguy hiểm tách riêng, chữ nêu hậu quả.
import { isUi2 } from "./uiKit.ts";

export interface ConfirmOpts {
  title: string;
  /** Hậu quả cụ thể (mất món nào, nhận bao nhiêu), không viết chung chung. */
  body: string;
  confirm: string;
  cancel?: string;
  /** Hành động không đảo ngược: nút xác nhận tô đỏ. */
  danger?: boolean;
}

/** Thời gian khóa nút sau khi bấm; tin về thường vẽ lại bảng và nút mới thay nút cũ nên hiếm khi chạy hết. */
export const LOCK_MS = 1200;

const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") => {
  const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e;
};

let open: { root: HTMLElement; close: () => void } | null = null;
export const confirmOpen = () => open !== null;
/** Đóng hộp xác nhận đang mở (không chạy `onYes`). */
export function closeConfirm() { open?.close(); }

/** Vô hiệu nút ngay sau bấm để không gửi đôi; trả `false` nếu nút đang khóa (nơi gọi bỏ qua lượt này). */
export function lockButton(b: HTMLButtonElement, ms = LOCK_MS): boolean {
  if (b.disabled || b.dataset.locked === "1") return false;
  b.dataset.locked = "1"; b.disabled = true; b.classList.add("busy");
  setTimeout(() => { b.dataset.locked = ""; b.disabled = false; b.classList.remove("busy"); }, ms);
  return true;
}

/** Bọc một hàm gửi lệnh: lần gọi thứ hai trong `ms` bị bỏ (cho nơi không có nút để khóa, vd lệnh chat). */
export function guardOnce<A extends unknown[]>(fn: (...a: A) => void, ms = LOCK_MS, now: () => number = Date.now): (...a: A) => void {
  let last = -Infinity;
  return (...a: A) => { const t = now(); if (t - last < ms) return; last = t; fn(...a); };
}

/** Mở hộp xác nhận. Hủy / Esc / bấm nền = không làm gì; Xác nhận = đóng hộp rồi gọi `onYes` đúng một lần. */
export function confirmDialog(o: ConfirmOpts, onYes: () => void): void {
  closeConfirm();
  const ui2 = isUi2(), prev = document.activeElement as HTMLElement | null;
  const root = mk("div", "cfm-back"), box = mk("div", "cfm" + (ui2 ? " f2-muc-nho" : ""));
  box.setAttribute("role", "alertdialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", o.title);
  const cancel = mk("button", "buse use cfm-no" + (ui2 ? " f2-nut-phu" : ""), o.cancel ?? "Hủy"); cancel.type = "button";
  const yes = mk("button", "buse cfm-yes " + (o.danger ? "drop" : "absorb") + (ui2 ? " f2-nut-chinh" : ""), o.confirm); yes.type = "button";
  const row = mk("div", "cfm-row"); row.append(cancel, yes);
  box.append(mk("b", "", o.title), mk("p", "", o.body), row); root.append(box);
  let done = false;
  const close = () => { if (done) return; done = true; document.removeEventListener("keydown", key, true); root.remove(); open = null; prev?.isConnected && prev.focus({ preventScroll: true }); };
  const key = (e: KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "Tab") { e.preventDefault(); e.stopPropagation(); (document.activeElement === cancel ? yes : cancel).focus(); } // bẫy focus giữa hai nút
    else e.stopPropagation(); // mọi phím khác (kể cả Enter: để nút tự bấm, không lọt sang ô chat của game) không xuống game khi hộp mở
  };
  cancel.addEventListener("click", close);
  yes.addEventListener("click", () => { if (!lockButton(yes)) return; close(); onYes(); });
  root.addEventListener("pointerdown", (e) => { if (e.target === root) close(); });
  document.addEventListener("keydown", key, true);
  document.body.appendChild(root); open = { root, close };
  cancel.focus({ preventScroll: true }); // nút an toàn, tránh Enter xóa nhầm
}
