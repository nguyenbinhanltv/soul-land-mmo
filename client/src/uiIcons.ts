import { artUrl } from "./uiArt.ts";
import { pingOnline } from "./pingMeter.ts";

export const MENU_ICON_KEYS = ["char", "roster", "bag", "reso", "settings", "auto", "channel", "area", "world", "friends", "rank", "quest", "chat", "arena", "shop", "forge"].map((key) => `gi_menu_${key}`);
const MENU: Record<string, string> = { charBtn: "char", vhBtn: "roster", bagBtn: "bag", resBtn: "reso", audioBtn: "settings", autoBtn: "auto", chanBtn: "channel", areaBtn: "area", worldBtn: "world" };

/** Nạp ảnh trước khi đổi icon; thiếu key/tải lỗi thì giữ nguyên chữ và ký tự cũ. */
function decorate(el: HTMLElement, key: string) {
  if (el.dataset.c12Key === key) return;
  const url = (key.startsWith("gi_menu_") && window.devicePixelRatio < 1.5 && artUrl(`${key}_1x`)) || artUrl(key); if (!url) return; // icon menu có bản 1× (24 px) cho màn DPR 1
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
  pingOnline(connected); // UI v2: chấm ping HUD (pingMeter.ts) hiện "Mất kết nối" khi phòng đóng
  const el = document.getElementById("c12Connection"); if (!el) return;
  const state = connected ? "connected" : "disconnected";
  if (el.dataset.state === state) return;
  el.dataset.state = state; el.hidden = false;
  el.classList.remove("c12-with-icon"); el.style.removeProperty("--c12-icon"); delete el.dataset.c12Key;
  const label = connected ? "Đã kết nối" : "Mất kết nối";
  el.setAttribute("aria-label", label); el.title = label;
  const fallback = document.createElement("span"); fallback.className = "c12-status-fallback"; fallback.setAttribute("aria-hidden", "true"); fallback.textContent = connected ? "·" : "×";
  const name = document.createElement("span"); name.className = "c12-status-name"; name.textContent = label;
  el.replaceChildren(fallback, name);
  decorate(el, `gi_ui_${state}`);
}
