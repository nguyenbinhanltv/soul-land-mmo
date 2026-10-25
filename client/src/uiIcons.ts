import { artUrl } from "./uiArt.ts";

export const MENU_ICON_KEYS = ["char", "roster", "bag", "reso", "settings", "auto", "channel", "area", "world", "friends", "rank", "quest", "chat", "arena", "shop", "forge"].map((key) => `gi_menu_${key}`);
const MENU: Record<string, string> = { charBtn: "char", vhBtn: "roster", bagBtn: "bag", resBtn: "reso", audioBtn: "settings", autoBtn: "auto", chanBtn: "channel", areaBtn: "area", worldBtn: "world" };

/** Nạp ảnh trước khi đổi icon; thiếu key/tải lỗi thì giữ nguyên chữ và ký tự cũ. */
function decorate(el: HTMLElement, key: string) {
  if (el.dataset.c12Key === key) return;
  const url = artUrl(key); if (!url) return;
  el.dataset.c12Key = key;
  const image = new Image(); image.alt = ""; image.draggable = false;
  image.onload = () => {
    if (!el.isConnected || el.dataset.c12Key !== key) return;
    const slot = el.querySelector(".menu-icon");
    if (slot) { image.className = "c12-ui-icon"; slot.replaceChildren(image); }
    else {
      if (el.id === "hudMenuBtn" && el.firstChild?.nodeType === 3) el.firstChild.textContent = el.firstChild.textContent?.replace("☰", "") ?? "";
      el.style.setProperty("--c12-icon", `url("${new URL(url, document.baseURI).href}")`); el.classList.add("c12-with-icon");
    }
  };
  image.onerror = () => { if (el.dataset.c12Key === key) delete el.dataset.c12Key; };
  image.src = url;
}

/** Chỉ gắn vào nút có sẵn; không thêm menu, listener hành động hay thay nhãn/phím. */
export function initUiIcons() {
  for (const [id, key] of Object.entries(MENU)) {
    const el = document.getElementById(id);
    if (el) decorate(el, `gi_menu_${key}`);
  }
  const menu = document.getElementById("hudMenuBtn");
  if (menu) decorate(menu, "gi_ui_menu");
}

/** Kết nối thật của phòng hiện tại; không đo hoặc suy diễn chất lượng mạng. */
export function setConnectionLabel(connected: boolean) {
  const el = document.getElementById("c12Connection"); if (!el) return;
  const state = connected ? "connected" : "disconnected";
  if (el.dataset.state === state) return;
  el.dataset.state = state; el.hidden = false;
  el.classList.remove("c12-with-icon"); el.style.removeProperty("--c12-icon"); delete el.dataset.c12Key;
  el.textContent = connected ? "Đã kết nối" : "Mất kết nối";
  decorate(el, `gi_ui_${state}`);
}
