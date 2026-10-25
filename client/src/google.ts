// Đăng nhập Google (SSO2 #612): Google Identity Services (luồng ID token, không redirect, không client secret). Client ID đọc từ GET /api/config
// (server đặt GOOGLE_CLIENT_ID); thiếu thì ẩn mọi nút Google. Server xác minh credential; client không tin gì từ token.
import { API } from "./net.ts";

const GSI_SRC = "https://accounts.google.com/gsi/client";
/** googleClientId: null = tắt (ẩn nút); "" = server chỉ có bộ kiểm giả (GAME_TEST), dùng nút thử thay cho nút Google. */
let cfg: Promise<string | null> | undefined;
export function googleConfig(): Promise<string | null> {
  cfg ??= fetch(`${API}/api/config`).then((r) => r.json()).then((j: { googleClientId?: string | null }) => j.googleClientId ?? null).catch(() => null);
  return cfg;
}

type Gsi = { accounts: { id: { initialize(o: object): void; renderButton(el: HTMLElement, o: object): void } } };
let gsi: Promise<Gsi> | undefined;
function loadGsi(): Promise<Gsi> {
  gsi ??= new Promise<Gsi>((res, rej) => {
    const w = window as unknown as { google?: Gsi };
    if (w.google?.accounts) return res(w.google);
    const s = document.createElement("script");
    s.src = GSI_SRC; s.async = true; s.defer = true;
    s.onload = () => { if (w.google?.accounts) res(w.google); else { gsi = undefined; rej(new Error("Không nạp được Google.")); } };
    s.onerror = () => { gsi = undefined; rej(new Error("Không nạp được Google (kiểm tra mạng).")); };
    document.head.appendChild(s);
  });
  return gsi;
}

// GSI chỉ có một callback toàn trang (initialize); mỗi lần vẽ nút đặt lại `current` cho nơi đang dùng.
let current: ((credential: string) => void) | null = null;
let initedFor = "";

/**
 * Vẽ nút "Đăng nhập bằng Google" vào `host` và gọi `onCredential` với ID token khi người chơi chọn tài khoản. Không có Client ID (server tắt)
 * thì không vẽ gì, trả false. Bộ kiểm giả (Client ID rỗng, chỉ khi server GAME_TEST): nút thử đăng nhập bằng mã `test:<id>` lưu trong localStorage.
 */
export async function mountGoogleButton(host: HTMLElement, label: string, onCredential: (credential: string) => void, onError: (msg: string) => void): Promise<boolean> {
  const id = await googleConfig();
  if (id === null) return false;
  host.hidden = false;
  if (id === "") {
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn gfake"; b.textContent = `${label} (thử)`;
    b.onclick = () => {
      let k = ""; try { k = localStorage.getItem("shh-gtest") ?? ""; } catch { /* bỏ qua */ }
      if (!k) { k = Math.random().toString(36).slice(2, 10); try { localStorage.setItem("shh-gtest", k); } catch { /* bỏ qua */ } }
      onCredential(`test:${k}:Khách Thử`);
    };
    host.replaceChildren(b);
    return true;
  }
  try {
    const g = await loadGsi();
    current = onCredential;
    if (initedFor !== id) {
      g.accounts.id.initialize({ client_id: id, callback: (r: { credential?: string }) => { if (r.credential) current?.(r.credential); }, use_fedcm_for_prompt: true });
      initedFor = id;
    }
    host.replaceChildren();
    g.accounts.id.renderButton(host, { type: "standard", theme: "filled_black", size: "large", text: "signin_with", shape: "rectangular", logo_alignment: "left", width: 240, locale: "vi" });
    return true;
  } catch (e) { onError((e as Error).message); host.hidden = true; return false; }
}
