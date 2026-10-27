// Hai trợ giúp dựng DOM dùng chung cho HUD và ô chat (tách nguyên văn từ hud.ts, Part of #885).

/** Thẻ HTML với nội dung chữ (tên do người chơi đặt: không bao giờ chèn bằng innerHTML). */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") {
  const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e;
}
/** Nút bấm được bằng chuột và chạm (pointerdown, như thanh đội hình). */
export function pbtn(text: string, cls: string, fn: () => void, label?: string) {
  const b = el("button", ("pbtn " + cls).trim(), text); b.type = "button";
  if (label) { b.title = label; b.setAttribute("aria-label", label); }
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  return b;
}
