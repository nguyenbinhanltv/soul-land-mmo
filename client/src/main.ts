import "./style.css";
import Phaser from "phaser";
import { Client } from "colyseus.js";
import { GameScene } from "./scenes/GameScene.ts";
import { TIERS, VOHON, HE, vohonIndex, AWAKEN_GIFT, AWAKEN_CHOICES, type He } from "../../shared/data.ts";
import { API, WS, post, storage, type Character } from "./net.ts";
import { ringColor } from "./hud.ts";

const card = document.getElementById("card")!, overlay = document.getElementById("overlay")!;
if (matchMedia("(pointer: coarse)").matches) document.body.classList.add("touch");
let token = storage.get("shh-token") ?? "";

const vohonOf = (c: Character) => VOHON[Math.max(0, vohonIndex(c.vohon))];
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const tiersHtml = () => `<div class="tiers">${TIERS.map((t, i) =>
  `<span><i class="ring" style="color:${ringColor(i)};${i === 3 ? `border-color:${t.col}` : ""}"></i>${t.age}</span>`).join("")}</div>`;

function loginScreen(err = "") {
  overlay.hidden = false; card.classList.remove("wide");
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

// Lễ thức tỉnh: nhận Lam Ngân Thảo và tự chọn 1 võ hồn SSR. Server kiểm tra lựa chọn và roll hồn lực bẩm sinh.
function awakenIntro() {
  const gift = VOHON[vohonIndex(AWAKEN_GIFT)];
  const groups = (Object.keys(HE) as He[]).map((h) => {
    const list = AWAKEN_CHOICES.filter((v) => v.he === h);
    return `<h3>${HE[h].name}</h3><div class="vgrid">${list.map((v) =>
      `<button type="button" class="vcard" data-id="${v.id}" style="--c:${v.col}" aria-pressed="false">
        <i class="dot"></i><b>${v.name}</b><small>${v.owner || "&nbsp;"}</small></button>`).join("")}</div>`;
  }).join("");
  card.classList.add("wide");
  card.innerHTML = `<h1>Lễ thức tỉnh</h1>
    <p>Chấp sự Tố Vân Đào làm lễ thức tỉnh: bạn nhận <b style="color:${gift.col}">${gift.name}</b> và được <b>tự chọn một võ hồn SSR</b>.
      Hồn lực bẩm sinh do trời định. Lễ thức tỉnh chỉ có một lần.</p>
    <div class="picker">${groups}</div>
    <div class="pickinfo" id="info">Chọn một võ hồn để xem chi tiết.</div>
    <div class="btns"><button class="btn primary" id="aw" disabled>Thức tỉnh</button><button class="btn" id="out">Đổi tài khoản</button></div>
    <div class="err" id="err"></div>`;
  let chosen = "";
  const aw = document.getElementById("aw") as HTMLButtonElement, info = document.getElementById("info")!;
  card.querySelectorAll<HTMLButtonElement>(".vcard").forEach((b) => b.addEventListener("click", () => {
    chosen = b.dataset.id!; const v = VOHON[vohonIndex(chosen)];
    card.querySelectorAll(".vcard").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    info.innerHTML = `<b style="color:${v.col}">${v.name}</b> · ${HE[v.he].name}${v.owner ? ` · ${v.owner}` : ""}<br>${v.trait}
      <br><small>Lưu phái: ${v.flows.join(", ")}</small>`;
    aw.disabled = false; aw.textContent = `Thức tỉnh ${v.name}`;
  }));
  aw.onclick = () => { if (chosen) awaken(chosen); };
  document.getElementById("out")!.onclick = () => { storage.del("shh-token"); loginScreen(); };
}

async function awaken(vohon: string) {
  const aw = document.getElementById("aw") as HTMLButtonElement; aw.disabled = true;
  try {
    const r = await post<{ character: Character }>("/api/awaken", { token, vohon });
    const c = r.character, v = vohonOf(c), gift = VOHON[vohonIndex(AWAKEN_GIFT)];
    card.classList.remove("wide");
    card.innerHTML = `<div class="vh" style="color:${v.col}"><div class="orb"></div></div>
      <div class="vh"><h2>${v.name}</h2><div class="k">${v.rarity} · ${HE[v.he].name}${v.owner ? ` · ${v.owner}` : ""}</div>
      <div class="t">${v.trait}<br>Kèm theo võ hồn <b style="color:${gift.col}">${gift.name}</b>.
      <br>Hồn lực bẩm sinh: <b>cấp ${c.level}</b>${c.level === 10 ? " – tiên thiên mãn hồn lực!" : ""}</div></div>
      <div class="btns"><button class="btn primary" id="go">Bước vào rừng</button></div>`;
    document.getElementById("go")!.onclick = () => join();
    document.getElementById("go")!.focus();
  } catch (e) {
    // Đã thức tỉnh (ví dụ ở tab khác) -> về màn hình chào.
    const me = await post<{ character: Character | null }>("/api/me", { token }).catch(() => null);
    if (me?.character) return welcomeScreen(me.character);
    document.getElementById("err")!.textContent = (e as Error).message; aw.disabled = false;
  }
}

function welcomeScreen(c: Character) {
  const v = vohonOf(c);
  card.classList.remove("wide");
  card.innerHTML = `<div class="vh" style="color:${v.col}"><div class="orb"></div></div>
    <div class="vh"><h2>${esc(c.name)}</h2><div class="k">${v.name} ra trận – cấp ${c.level}, ${c.rings.length} hồn hoàn</div>
    <div class="t"><small>Trong rừng, nhấn V hoặc nút “Võ hồn” để chọn võ hồn ra trận.</small></div></div>
    <div class="btns"><button class="btn primary" id="go">Vào rừng</button><button class="btn" id="out">Đổi tài khoản</button></div>`;
  document.getElementById("go")!.onclick = () => join();
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
