import "./style.css";
import Phaser from "phaser";
import { Client } from "colyseus.js";
import { GameScene } from "./scenes/GameScene.ts";
import { TIERS, VOHON } from "../../shared/data.ts";
import { API, WS, post, storage, type Character } from "./net.ts";
import { ringColor } from "./hud.ts";

const card = document.getElementById("card")!, overlay = document.getElementById("overlay")!;
if (matchMedia("(pointer: coarse)").matches) document.body.classList.add("touch");
let token = storage.get("shh-token") ?? "";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const tiersHtml = () => `<div class="tiers">${TIERS.map((t, i) =>
  `<span><i class="ring" style="color:${ringColor(i)};${i === 3 ? `border-color:${t.col}` : ""}"></i>${t.age}</span>`).join("")}</div>`;

function loginScreen(err = "") {
  overlay.hidden = false;
  card.innerHTML = `<h1>Rừng Săn Hồn</h1>
    <p>Thức tỉnh võ hồn, săn hồn thú cùng bạn bè và đoạt hồn hoàn. Tên chưa có sẽ được tạo tài khoản mới.</p>
    ${tiersHtml()}
    <form id="f">
      <input id="name" placeholder="Tên nhân vật" maxlength="20" required autocomplete="username">
      <input id="pass" type="password" placeholder="Mật khẩu" minlength="4" required autocomplete="current-password">
      <button class="btn primary" id="go">Vào game</button>
      <div class="err" id="err"></div>
    </form>`;
  const name = document.getElementById("name") as HTMLInputElement, pass = document.getElementById("pass") as HTMLInputElement;
  name.value = storage.get("shh-name") ?? ""; (name.value ? pass : name).focus();
  document.getElementById("err")!.textContent = err;
  document.getElementById("f")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("go") as HTMLButtonElement; btn.disabled = true; btn.textContent = "Đang kết nối…";
    try {
      const r = await post<{ token: string; character: Character | null }>("/api/login", { name: name.value.trim(), password: pass.value });
      token = r.token; storage.set("shh-token", token); storage.set("shh-name", name.value.trim());
      r.character ? welcomeScreen(r.character) : awakenIntro();
    } catch (er) {
      document.getElementById("err")!.textContent = er instanceof TypeError ? `Không kết nối được server (${API}).` : (er as Error).message;
      btn.disabled = false; btn.textContent = "Vào game";
    }
  });
}

function awakenIntro() {
  card.innerHTML = `<h1>Thức tỉnh</h1><p>Võ hồn và hồn lực bẩm sinh do trời định – server sẽ quyết định, không ai chọn được.</p>
    <div class="btns"><button class="btn primary" id="aw">Thức tỉnh võ hồn</button></div>`;
  document.getElementById("aw")!.onclick = () => awaken(false);
  document.getElementById("aw")!.focus();
}

async function awaken(reset: boolean) {
  try {
    const r = await post<{ character: Character }>("/api/awaken", { token, reset });
    const c = r.character, v = VOHON[c.vohon];
    card.innerHTML = `<div class="vh" style="color:${v.col}"><div class="orb"></div></div>
      <div class="vh"><h2>${v.name}</h2><div class="k">${v.kind}</div>
      <div class="t">${v.trait}<br>Hồn lực bẩm sinh: <b>cấp ${c.innate}</b>${c.innate === 10 ? " – tiên thiên mãn hồn lực!" : ""}</div></div>
      <div class="btns"><button class="btn primary" id="go">Bước vào rừng</button><button class="btn" id="re">Thức tỉnh lại</button></div>`;
    document.getElementById("go")!.onclick = () => join();
    document.getElementById("re")!.onclick = () => awaken(true);
    document.getElementById("go")!.focus();
  } catch (e) { loginScreen((e as Error).message); }
}

function welcomeScreen(c: Character) {
  const v = VOHON[c.vohon];
  card.innerHTML = `<div class="vh" style="color:${v.col}"><div class="orb"></div></div>
    <div class="vh"><h2>${esc(c.name)}</h2><div class="k">${v.name} – cấp ${c.level}, ${c.rings.length} hồn hoàn</div></div>
    <div class="btns"><button class="btn primary" id="go">Vào rừng</button><button class="btn" id="re">Thức tỉnh lại từ đầu</button><button class="btn" id="out">Đổi tài khoản</button></div>`;
  document.getElementById("go")!.onclick = () => join();
  document.getElementById("re")!.onclick = () => { if (confirm("Xóa nhân vật hiện tại và thức tỉnh lại?")) awaken(true); };
  document.getElementById("out")!.onclick = () => { storage.del("shh-token"); loginScreen(); };
  document.getElementById("go")!.focus();
}

let game: Phaser.Game | null = null;
async function join() {
  card.innerHTML = `<h1>Đang vào rừng…</h1>`;
  try {
    const client = new Client(WS);
    const room = await client.joinOrCreate("forest", { token });
    overlay.hidden = true;
    room.onLeave((code) => {
      document.body.classList.remove("playing"); overlay.hidden = false;
      const msg = code === 4001 ? "Tài khoản vừa đăng nhập ở nơi khác." : "Mất kết nối với server.";
      card.innerHTML = `<h1>Đã rời rừng</h1><p>${msg}</p><div class="btns"><button class="btn primary" onclick="location.reload()">Vào lại</button></div>`;
    });
    game = new Phaser.Game({
      type: Phaser.AUTO, parent: "game", backgroundColor: "#0c1712", pixelArt: true,
      scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight },
    });
    game.scene.add("game", GameScene, true, { room });
  } catch (e) {
    const m = (e as Error).message ?? "";
    if (/401|403|không hợp lệ|Chưa thức tỉnh/.test(m)) loginScreen(m); else loginScreen(`Không vào được phòng: ${m}`);
  }
}

// Có phiên cũ -> thử tải nhân vật luôn.
(async () => {
  if (!token) return loginScreen();
  try { const r = await post<{ character: Character | null }>("/api/me", { token }); r.character ? welcomeScreen(r.character) : awakenIntro(); }
  catch { loginScreen(); }
})();
