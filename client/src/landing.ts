// Landing (/): trạng thái máy chủ và đăng nhập Google (#656). Không nạp Phaser / Colyseus; chỉ dùng API, post, storage của net.ts
// (net.ts chỉ có kiểu và hàm nhỏ). Google dùng đúng luồng ID token của game (POST /api/login/google, xem main.ts / google.ts): đã liên kết thì lưu
// `shh-token` rồi vào /choi, chưa có nhân vật thì chuyển vé sang /choi (sessionStorage `shh-gticket`) để game hiện màn chọn tên như luồng SSO hiện có.
import { API, post, storage } from "./net.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const GAME = "/choi";

// ----- Trạng thái máy chủ -----
{
  const s = $("status"), t = $("statusTxt");
  const set = (cls: string, txt: string) => { s.className = `status ${cls}`; t.textContent = txt; };
  fetch(`${API}/health`, { cache: "no-store" }).then((r) => r.json().then((j: { ok?: boolean }) => !!(r.ok && j.ok)))
    .then((up) => (up ? set("up", "Máy chủ: đang mở, vào chơi được") : set("down", "Máy chủ: đang bảo trì, thử lại sau ít phút")))
    .catch(() => set("down", "Máy chủ: chưa kết nối được"));
}

// ----- Đã có phiên đăng nhập: "Vào chơi" thành "Tiếp tục chơi" -----
if (storage.get("shh-token")) document.querySelectorAll<HTMLElement>("a.btn.seal").forEach((a) => { if (a.textContent === "Vào chơi") a.textContent = "Tiếp tục chơi"; else if (a.textContent === "Vào chơi ngay") a.textContent = "Tiếp tục chơi ngay"; });

// ----- Đăng nhập Google -----
type Gsi = { accounts: { id: { initialize(o: object): void; renderButton(el: HTMLElement, o: object): void } } };
type Me = { token: string };
type LoginReply = Me | { needName: true; ticket: string; suggest: string };

const gerr = $("gerr");
const showErr = (m: string) => { gerr.textContent = m; gerr.hidden = !m; };

async function onCredential(credential: string) {
  showErr("");
  try {
    const r = await post<LoginReply>("/api/login/google", { credential });
    if ("needName" in r) { try { sessionStorage.setItem("shh-gticket", JSON.stringify({ ticket: r.ticket, suggest: r.suggest })); } catch { /* vào /choi, đăng nhập lại */ } }
    else storage.set("shh-token", r.token);
    location.href = GAME;
  } catch (e) {
    showErr(e instanceof TypeError ? "Không kết nối được máy chủ, thử lại sau." : (e as Error).message);
  }
}

function loadGsi(): Promise<Gsi> {
  return new Promise((res, rej) => {
    const w = window as unknown as { google?: Gsi };
    if (w.google?.accounts) return res(w.google);
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.defer = true;
    s.onload = () => (w.google?.accounts ? res(w.google) : rej(new Error("gsi")));
    s.onerror = () => rej(new Error("gsi"));
    document.head.appendChild(s);
  });
}

/** Sau khi trang tải xong và rảnh: nạp Google rồi thay nút liên kết bằng nút Google thật (bấm là mở cửa sổ Google). Lỗi thì giữ nút dẫn vào /choi. */
async function setupGoogle() {
  const id: string | null = await fetch(`${API}/api/config`).then((r) => r.json()).then((j: { googleClientId?: string | null }) => j.googleClientId ?? null).catch(() => null);
  if (id === null) return; // server tắt Google: nút "Đăng nhập Google" vẫn dẫn vào /choi
  const host = $("gbtn"), fallback = $("gfallback");
  if (id === "") { // bộ kiểm giả của server GAME_TEST, giống nút thử trong game
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn alt"; b.textContent = "Đăng nhập Google (thử)";
    b.onclick = () => {
      let k = storage.get("shh-gtest") ?? "";
      if (!k) { k = Math.random().toString(36).slice(2, 10); storage.set("shh-gtest", k); }
      void onCredential(`test:${k}:Khách Thử`);
    };
    host.replaceChildren(b); host.hidden = false; fallback.hidden = true;
    return;
  }
  try {
    const g = await loadGsi();
    g.accounts.id.initialize({ client_id: id, callback: (r: { credential?: string }) => { if (r.credential) void onCredential(r.credential); }, use_fedcm_for_prompt: true });
    g.accounts.id.renderButton(host, { type: "standard", theme: "filled_black", size: "large", text: "signin_with", shape: "rectangular", logo_alignment: "left", width: 240, locale: "vi" });
    host.hidden = false; fallback.hidden = true;
  } catch { /* không nạp được Google (mạng, chặn quảng cáo): giữ nút dẫn vào /choi */ }
}

const start = () => { void setupGoogle(); };
const idle = (window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
const later = () => (idle ? idle(start, { timeout: 3000 }) : setTimeout(start, 1500));
if (document.readyState === "complete") later(); else addEventListener("load", later, { once: true });
