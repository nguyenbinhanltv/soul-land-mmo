import "./style.css";
import "./uiIcons.css";
import { setConnectionLabel } from "./uiIcons.ts";
import { loadGameFonts } from "./fontLoad";
import Phaser from "phaser";
import { ASSET_RETRIES, MAX_PARALLEL } from "./assetUrl.ts";
import { installLoaderRetry } from "./loaderRetry.ts";
import { Client, type Room } from "colyseus.js";
import { GameScene } from "./scenes/GameScene.ts";
import { bufferRoomMessages } from "./roomBuffer.ts";
import { addLag } from "./predict.ts";
import { TIERS, VOHON, HE, MAPS, vohonIndex, AWAKEN_GIFT, AWAKEN_CHOICES, AWAKEN_LEVEL,
  type He } from "../../shared/data.ts";
import { API, WS, post, storage, type Character, type Me } from "./net.ts";
import { ringColor, closeLooks } from "./hud.ts";
import { mountMaker } from "./looksMaker.ts";
import { MAX_LIGHTS } from "./lighting.ts";
import { loadUiArt } from "./uiArt.ts";
import { initTips } from "./tooltip.ts";
import { vohonCard } from "./cards.ts";
import { fontTestScreen } from "./fontTest.ts";
import { audioTestScreen } from "./audioTest.ts";
import { fxTestScreen } from "./fxTest.ts";
import { phapTuongTestScreen } from "./phapTuongTest.ts";
import { phutheTestScreen } from "./phutheTest.ts";
import { sharedAudioContext, stopMusic } from "./audio/music.ts";
import { stopAmbientBed } from "./audio/ambientBed.ts";
import { mountGoogleButton } from "./google.ts";
import { openCredits } from "./credits.ts";
import { isIsoSlice } from "./isoMap.ts";
import { evictStaleTextures } from "./textureLru.ts";

const card = document.getElementById("card")!, overlay = document.getElementById("overlay")!;
if (matchMedia("(pointer: coarse)").matches) document.body.classList.add("touch");
let token = storage.get("shh-token") ?? "";

const vohonOf = (c: Character) => VOHON[Math.max(0, vohonIndex(c.vohon))];
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const tiersHtml = () => `<div class="tiers">${TIERS.map((t, i) =>
  `<span><i class="ring" style="color:${ringColor(i)};${i === 3 ? `border-color:${t.col}` : ""}"></i>${t.age}</span>`).join("")}</div>`;
const overlayScreen = (screen: "login" | "loading" | "welcome") => {
  overlay.dataset.screen = screen;
  overlay.hidden = false;
};

/** Đăng xuất: thu hồi phiên ở server (#999) rồi xóa token cục bộ; lỗi mạng cũng không cản việc xóa cục bộ. */
function logout() {
  const t = token; token = ""; storage.del("shh-token");
  if (t) void post("/api/logout", { token: t }).catch(() => {});
  loginScreen();
}

function loginScreen(err = "") {
  overlayScreen("login"); card.classList.remove("wide");
  card.innerHTML = `<img class="c6-logo" src="/ui/c6/logo.png" alt="Rừng Săn Hồn">
    <h1 class="c6-title">Rừng Săn Hồn</h1>
    <p>Thức tỉnh võ hồn, săn hồn thú cùng bạn bè và đoạt hồn hoàn. Tên chưa có sẽ được tạo tài khoản mới.</p>
    ${tiersHtml()}
    <form id="f">
      <input id="name" placeholder="Tên nhân vật" maxlength="20" required autocomplete="username">
      <input id="pass" type="password" placeholder="Mật khẩu" minlength="4" required autocomplete="current-password">
      <button class="btn primary" id="go">Vào game</button>
      <div class="err" id="err"></div>
    </form>
    <div class="gsep" id="gsep" hidden><span>hoặc</span></div>
    <div class="gbtn" id="gbtn" hidden></div>
    <button class="c6-credits" id="credits-open" type="button">Ghi công</button>
    <aside class="c6-event" aria-label="Mẹo chơi">
      <img src="/ui/c6/event-banner.png" alt="">
      <div class="c6-event-copy"><small>MẸO SĂN HỒN</small><strong>Né vùng đỏ</strong><span>Chạy ra khỏi vùng đỏ trước khi nó đầy</span></div>
    </aside>`;
  document.getElementById("credits-open")!.addEventListener("click", openCredits);
  const name = document.getElementById("name") as HTMLInputElement, pass = document.getElementById("pass") as HTMLInputElement;
  name.value = storage.get("shh-name") ?? ""; (name.value ? pass : name).focus();
  document.getElementById("err")!.textContent = err;
  const gHost = document.getElementById("gbtn")!, gSep = document.getElementById("gsep")!;
  void mountGoogleButton(gHost, "Đăng nhập bằng Google", googleLogin, (m) => { document.getElementById("err")!.textContent = m; })
    .then((shown) => { gSep.hidden = !shown; });
  document.getElementById("f")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("go") as HTMLButtonElement; btn.disabled = true; btn.textContent = "Đang kết nối…";
    try {
      const r = await post<{ token: string } & Me>("/api/login", { name: name.value.trim(), password: pass.value });
      token = r.token; storage.set("shh-token", token); storage.set("shh-name", name.value.trim());
      route(r);
    } catch (er) {
      document.getElementById("err")!.textContent = er instanceof TypeError ? `Không kết nối được server (${API}).` : (er as Error).message;
      btn.disabled = false; btn.textContent = "Vào game";
    }
  });
}

/** Google trả ID token: đã liên kết thì vào như đăng nhập thường; chưa thì hỏi tên nhân vật (server giữ vé, không giữ email). */
async function googleLogin(credential: string) {
  const err = document.getElementById("err");
  if (err) err.textContent = "";
  try {
    const r = await post<({ token: string } & Me) | { needName: true; ticket: string; suggest: string }>("/api/login/google", { credential });
    if ("needName" in r) return nameScreen(r.ticket, r.suggest);
    token = r.token; storage.set("shh-token", token);
    route(r);
  } catch (er) {
    const m = er instanceof TypeError ? `Không kết nối được server (${API}).` : (er as Error).message;
    if (err) err.textContent = m; else loginScreen(m);
  }
}

/** Vé Google do landing để lại (landing.ts), đọc một lần. */
function takeGoogleTicket(): { ticket: string; suggest: string } | null {
  try {
    const raw = sessionStorage.getItem("shh-gticket"); sessionStorage.removeItem("shh-gticket");
    const j = raw ? JSON.parse(raw) as { ticket?: unknown; suggest?: unknown } : null;
    return j && typeof j.ticket === "string" && j.ticket ? { ticket: j.ticket, suggest: typeof j.suggest === "string" ? j.suggest : "" } : null;
  } catch { return null; }
}

/** Google mới: chọn tên nhân vật (gợi ý từ tên Google) rồi tạo tài khoản, sau đó sang màn tạo ngoại hình như thường. */
function nameScreen(ticket: string, suggest: string) {
  overlay.hidden = false; card.classList.remove("wide");
  card.innerHTML = `<h1>Chọn tên nhân vật</h1>
    <p>Tài khoản Google này chưa có nhân vật. Hãy đặt tên hồn sư (3–20 ký tự: chữ, số, dấu cách hoặc _). Tên không đổi được về sau.</p>
    <form id="nf">
      <input id="gname" placeholder="Tên nhân vật" maxlength="20" required autocomplete="off" value="${esc(suggest)}">
      <button class="btn primary" id="gok">Tạo nhân vật</button>
      <button class="btn" id="gback" type="button">Quay lại</button>
      <div class="err" id="err"></div>
    </form>`;
  const input = document.getElementById("gname") as HTMLInputElement, ok = document.getElementById("gok") as HTMLButtonElement;
  input.focus(); input.select();
  document.getElementById("gback")!.onclick = () => loginScreen();
  document.getElementById("nf")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    ok.disabled = true; ok.textContent = "Đang tạo…";
    try {
      const r = await post<{ token: string } & Me>("/api/login/google/create", { ticket, name: input.value.trim() });
      token = r.token; storage.set("shh-token", token); // không lưu shh-name: tài khoản này chưa có mật khẩu để điền sẵn ở form
      route(r);
    } catch (er) {
      const m = er instanceof TypeError ? `Không kết nối được server (${API}).` : (er as Error).message;
      // Vé hết hạn (10 phút): quay về đăng nhập để bấm Google lại. Lỗi khác (tên trùng, sai luật) thì ở lại sửa tên.
      if (/hết hạn/.test(m)) return loginScreen(m);
      document.getElementById("err")!.textContent = m; ok.disabled = false; ok.textContent = "Tạo nhân vật";
    }
  });
}

/** Màn kế tiếp theo trạng thái tài khoản: tạo nhân vật → lễ thức tỉnh → màn chào. */
function route(me: Me) {
  mapId = me.mapId;
  if (!me.looks.chosen) createScreen(me);
  else if (me.character) welcomeScreen(me.character);
  else awakenIntro();
}

/** Hỏi lại server trạng thái tài khoản rồi chuyển màn; phiên hết hạn thì về đăng nhập. */
async function resume(err = "") {
  try { route(await post<Me>("/api/me", { token })); } catch { loginScreen(err); }
}

// Tạo nhân vật (mục 3, 5.11): bước đầu chọn [Mẫu dựng sẵn] (giới tính, tông da, kiểu tóc, màu tóc, màu áo) hoặc [Tự tạo (LPC)] (ghép từng
// món, looksMaker.ts). Chạy ngay trước bước chọn SSR của lễ thức tỉnh; tài khoản cũ đang mang ngoại hình mặc định thì được chọn lại một
// lần. Lần chọn này miễn phí; đổi về sau phải qua thợ may (có phí từ lần thứ hai). Server kiểm tra mọi giá trị.
function createScreen(me: Me) {
  card.classList.add("wide", "mk");
  const stop = mountMaker({
    host: card, title: "Tạo nhân vật",
    intro: me.character
      ? "Hồn sư của bạn đang mang ngoại hình mặc định. Bạn được chọn lại <b>một lần</b> ở đây (miễn phí). Sau này muốn đổi thì tới thợ may trong thành."
      : "Chọn ngoại hình hồn sư trước lễ thức tỉnh. Lần chọn này <b>miễn phí</b>; sau này muốn đổi (kể cả đổi giữa hai chế độ) thì tới thợ may trong thành: lần đổi đầu miễn phí, các lần sau tốn Hồn Tệ.",
    current: me.looks.chosen || me.character ? me.looks : null,
    okLabel: "Xác nhận ngoại hình",
    async onOk(looks) {
      try {
        const r = await post<{ looks: Me["looks"] }>("/api/looks", { token, ...looks });
        stop(); card.classList.remove("mk");
        route({ ...me, looks: r.looks });
      } catch (e) {
        // Đã chọn ở tab khác, hoặc phiên hết hạn: hỏi lại server.
        const m = (e as Error).message;
        if (/đã chọn|hết hạn/.test(m)) { stop(); card.classList.remove("mk"); return resume(m); }
        throw e;
      }
    },
    cancel: { label: "Đổi tài khoản", fn: () => { stop(); card.classList.remove("mk"); logout(); } },
  });
}

// Lễ thức tỉnh: nhận Lam Ngân Thảo và tự chọn 1 võ hồn SSR. Server kiểm tra lựa chọn và roll hồn lực bẩm sinh.
function awakenIntro() {
  const gift = VOHON[vohonIndex(AWAKEN_GIFT)];
  const groups = (Object.keys(HE) as He[]).map((h) => `<h3>${HE[h].name}</h3><div class="cgrid vgrid" data-he="${h}"></div>`).join("");
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
  for (const v of AWAKEN_CHOICES) {
    const b = vohonCard(v, {}, "button");
    b.classList.add("awk-pick"); b.dataset.id = v.id; b.setAttribute("aria-pressed", "false"); b.title = v.owner ? `${v.name} · ${v.owner}` : v.name;
    card.querySelector(`.vgrid[data-he="${v.he}"]`)!.appendChild(b);
  }
  card.querySelectorAll<HTMLButtonElement>(".awk-pick").forEach((b) => b.addEventListener("click", () => {
    chosen = b.dataset.id!; const v = VOHON[vohonIndex(chosen)];
    card.querySelectorAll(".awk-pick").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    info.innerHTML = `<b style="color:${v.col}">${v.name}</b> · ${HE[v.he].name}${v.owner ? ` · ${v.owner}` : ""}<br>${v.trait}
      <br><small>Lưu phái: ${v.flows.join(", ")}</small>`;
    aw.disabled = false; aw.textContent = `Thức tỉnh ${v.name}`;
  }));
  aw.onclick = () => { if (chosen) awaken(chosen); };
  document.getElementById("out")!.onclick = () => { logout(); };
}

async function awaken(vohon: string) {
  const aw = document.getElementById("aw") as HTMLButtonElement; aw.disabled = true;
  try {
    const r = await post<{ character: Character }>("/api/awaken", { token, vohon });
    const c = r.character, v = vohonOf(c), gift = VOHON[vohonIndex(AWAKEN_GIFT)];
    card.classList.remove("wide");
    card.innerHTML = `<div class="vh bigcard"></div>
      <div class="vh"><h2>${v.name}</h2><div class="k">${v.rarity} · ${HE[v.he].name}${v.owner ? ` · ${v.owner}` : ""}</div>
      <div class="t">${v.trait}<br>Kèm theo võ hồn <b style="color:${gift.col}">${gift.name}</b>.
      <br>Hồn lực bẩm sinh: <b>cấp ${c.level}</b>${c.level === AWAKEN_LEVEL.max ? " – tiên thiên mãn hồn lực!" : ""}</div></div>
      <div class="btns"><button class="btn primary" id="go">Tới ${esc(MAPS[mapId]?.name ?? "bản đồ")}</button></div>`;
    card.querySelector(".bigcard")!.appendChild(vohonCard(v, { level: c.level, stars: c.stars, rings: c.rings }));
    document.getElementById("go")!.onclick = () => join();
    document.getElementById("go")!.focus();
  } catch (e) {
    // Đã thức tỉnh (ví dụ ở tab khác) -> về màn hình chào; chưa tạo nhân vật -> về màn tạo nhân vật.
    const me = await post<Me>("/api/me", { token }).catch(() => null);
    if (me && (me.character || !me.looks.chosen)) return route(me);
    document.getElementById("err")!.textContent = (e as Error).message; aw.disabled = false;
  }
}

function welcomeScreen(c: Character) {
  const v = vohonOf(c);
  overlayScreen("welcome"); card.classList.remove("wide");
  card.innerHTML = `<div class="vh bigcard"></div>
    <div class="vh"><h2>${esc(c.name)}</h2><div class="k">${v.name} ra trận – cấp ${c.level}, ${c.rings.length} hồn hoàn</div>
    <div class="t"><small>Trong game, nhấn V hoặc nút “Đội hình” để xếp đội 4 võ hồn; nhấn 1–4 để đổi võ hồn ngay khi đang đánh.</small></div></div>
    <div class="btns"><button class="btn primary" id="go">Vào ${esc(MAPS[mapId]?.name ?? "game")}</button><button class="btn" id="out">Đổi tài khoản</button></div>`;
  card.querySelector(".bigcard")!.appendChild(vohonCard(v, { level: c.level, stars: c.stars, rings: c.rings }));
  document.getElementById("go")!.onclick = () => join();
  document.getElementById("out")!.onclick = () => { logout(); };
  document.getElementById("go")!.focus();
}

/** Chờ state đầu tiên của phòng để biết mapId; quá hạn hoặc bị rời phòng thì báo lỗi. */
function waitMapId(room: Room, ms = 8000) {
  return new Promise<string>((res, rej) => {
    if (room.state?.mapId) return res(room.state.mapId);
    const to = setTimeout(() => rej(new Error("Server không gửi thông tin bản đồ, hãy thử lại.")), ms);
    room.onStateChange.once((s: any) => {
      clearTimeout(to);
      s?.mapId ? res(s.mapId) : rej(new Error("Server không gửi thông tin bản đồ, hãy thử lại."));
    });
    room.onLeave.once(() => { clearTimeout(to); rej(new Error("Mất kết nối với server khi đang vào bản đồ.")); });
  });
}

let game: Phaser.Game | null = null;
/** Bản đồ đang đứng do server lưu (/api/login, /api/me trả `mapId`); client chỉ chuyển nó để Colyseus ghép đúng phòng. */
let mapId = "";
/**
 * Vào phòng của bản đồ đang lưu. `roomId`: phòng (kênh) server đã chọn trong tin `travel` (đi cổng, đổi kênh; null = mọi kênh đầy);
 * không có thì hỏi /api/channel (kênh có đồng đội tổ đội, không thì kênh ít người nhất còn chỗ). Kênh vừa đầy hoặc vừa đóng thì
 * joinOrCreate: Colyseus chọn kênh còn chỗ, hết chỗ thì mở kênh mới.
 */
async function join(retry = true, roomId?: string | null) {
  overlayScreen("loading"); card.classList.remove("wide");
  card.innerHTML = `<img class="c6-loading-mark" src="/ui/c6/logo.png" alt="" aria-hidden="true">
    <h1>Đang tới ${esc(MAPS[mapId]?.name ?? "bản đồ")}…</h1>
    <p class="c6-loading-note">Bản đồ đang được mở, xin giữ kết nối.</p><div class="c6-loader" role="progressbar" aria-label="Đang tải"><i></i></div>`;
  try {
    const client = new Client(WS);
    if (roomId === undefined) {
      const r = await post<{ mapId: string; roomId: string | null }>("/api/channel", { token }).catch(() => null);
      if (r) { mapId = r.mapId; roomId = r.roomId; }
    }
    const opts = { token, mapId };
    const room = roomId
      ? await client.joinById(roomId, opts).catch((e) => {
        if (/not found|locked|full/i.test((e as Error)?.message ?? "")) return client.joinOrCreate("map", opts);
        throw e;
      })
      : await client.joinOrCreate("map", opts);
    bufferRoomMessages(room);
    const roomMap = await waitMapId(room).catch((e) => { room.leave().catch(() => {}); throw e; });
    play(room, roomMap);
  } catch (e) {
    const m = (e as Error).message ?? "";
    // Bản đồ trong DB khác bản đồ vừa xin vào (vd vừa đi cổng ở tab khác): hỏi lại /api/me rồi vào đúng phòng một lần.
    if (retry && /Sai bản đồ/.test(m)) {
      const me = await post<Me>("/api/me", { token }).catch(() => null);
      if (me) { mapId = me.mapId; return join(false); }
    }
    // Đang bị giữ ở một kênh (vừa rời / kênh server đã chọn khi chuyển, mục 6) mà lần dự phòng joinOrCreate rơi vào kênh khác: hỏi lại
    // /api/channel (trả đúng kênh đó) rồi vào một lần.
    if (retry && /Hãy vào kênh|Vừa rời kênh/.test(m)) return join(false);
    // Chưa tạo nhân vật hoặc chưa thức tỉnh (ví dụ tab khác vừa đổi): hỏi lại server để mở đúng màn.
    if (/Chưa tạo nhân vật|Chưa thức tỉnh/.test(m)) resume(m);
    else if (/401|403|không hợp lệ/.test(m)) loginScreen(m); else loginScreen(`Không vào được phòng: ${m}`);
  }
}

/**
 * Vào phòng sân đấu Đại Đấu Hồn Trường bằng mã phòng server gửi khi ghép trận (7.2; phòng riêng, không ghép theo mapId). Không vào
 * được (trận đã hủy, quá giờ) thì quay về bản đồ đang đứng.
 */
async function joinArena(roomId: string, watch = false) {
  overlay.hidden = false; card.classList.remove("wide");
  card.innerHTML = `<h1>${watch ? "Đang vào xem trận…" : "Đang vào Đại Đấu Hồn Trường…"}</h1>`;
  try {
    const room = await new Client(WS).joinById(roomId, { token });
    bufferRoomMessages(room);
    const roomMap = await waitMapId(room).catch((e) => { room.leave().catch(() => {}); throw e; });
    play(room, roomMap, watch);
  } catch (e) {
    card.innerHTML = `<h1>Không vào được trận đấu</h1><p>${esc((e as Error).message ?? "")}</p>`;
    setTimeout(() => join(), 1500);
  }
}

/** Mã đóng kết nối của ArenaRoom khi trận đã xong (ARENA_END_CODE ở server): tự về bản đồ cũ. */
const ARENA_END_CODE = 4005;

/**
 * Đổi bản đồ giữ Game (#716 bước 5): texture nạp từ file (hồn sư, pháp tướng, fx, ô nền, vật đứng đã ghé) giữ lại, không giải mã lại.
 * Texture vẽ bằng code (canvas: khối nung, nhà, thời tiết, lpc, fx dải...) do scene dựng nên bỏ theo scene như khi huỷ Game; hoạt ảnh
 * tham chiếu khung của chúng nên bỏ hết (dựng lại có kiểm `exists`).
 */
function dropSceneTextures(g: Phaser.Game) {
  for (const k of g.textures.getTextureKeys()) if (g.textures.get(k).source[0]?.isCanvas && !isIsoSlice(k)) g.textures.remove(k);
  for (const a of g.anims.toJSON().anims) g.anims.remove(a.key);
}

/**
 * Mở Phaser cho phòng vừa vào. Server cho đi cổng hoặc đổi kênh (`travel {mapId, roomId}`) thì rời phòng cũ, hủy scene và vào phòng
 * (kênh) server đã chọn ở bản đồ đích.
 * Từ 7.2: ghép được trận thì rời bản đồ, vào phòng sân đấu; xong trận (hoặc bấm rời sân) thì về lại bản đồ đang đứng (`mapId` không đổi
 * khi vào sân, server giữ vị trí cũ; kênh chọn lại qua /api/channel).
 */
function play(room: Room, roomMap: string, watch = false) {
  setConnectionLabel(true);
  overlay.hidden = true;
  addLag(room); // ?lag=<ms>: giả lập ping cao để thử dự đoán chuyển động
  let travelling = false, left = false;
  const isArena = MAPS[roomMap]?.kind === "arena";
  room.onLeave((code) => {
    left = true;
    setConnectionLabel(false);
    if (travelling) return;
    if (isArena && code === ARENA_END_CODE) { onTravel(mapId); return; }
    closeLooks(); document.body.classList.remove("playing"); overlay.hidden = false; stopMusic(); stopAmbientBed();
    const msg = code === 4001 ? "Tài khoản vừa đăng nhập ở nơi khác." : "Mất kết nối với server.";
    card.innerHTML = `<h1>Đã rời ${esc(MAPS[roomMap]?.name ?? "bản đồ")}</h1><p>${msg}</p><div class="btns"><button class="btn primary" onclick="location.reload()">Vào lại</button></div>`;
  });
  /** Rời phòng hiện tại, hủy scene rồi `next()` (vào phòng mới). */
  const leaveThen = async (next: () => void) => {
    if (travelling) return;
    travelling = true;
    // Kết nối đã đóng (server đưa ra khỏi sân, mã 4005) thì không gửi rời phòng nữa: leave() của colyseus.js sẽ không bao giờ xong.
    if (!left) await room.leave().catch(() => {});
    // Giữ Phaser.Game (#716 bước 5): chỉ tắt scene, texture dùng chung (hồn sư, pháp tướng, fx, UI, bản đồ đã ghé) không phải giải mã lại.
    if (game) { game.scene.stop("game"); game.scene.remove("game"); dropSceneTextures(game); evictStaleTextures(game); game.canvas.style.visibility = "hidden"; }
    document.body.classList.remove("playing"); document.getElementById("hud")!.hidden = true;
    next();
  };
  // `roomId`: kênh server đã chọn (tin `travel`); không có (về từ sân đấu) thì join hỏi /api/channel.
  const onTravel = (to: string, roomId?: string | null) => leaveThen(() => { mapId = to; join(true, roomId); });
  const onArena = (roomId: string, w = false) => leaveThen(() => joinArena(roomId, w));
  const onBack = () => onTravel(mapId);
  installLoaderRetry();
  if (game) game.canvas.style.visibility = "";
  else game = new Phaser.Game({
    // `?canvas`: ép Canvas để thử đường lùi không có WebGL (ánh sáng tắt hẳn, 10.7). maxLights: số đèn Light2D (lighting.ts).
    type: new URLSearchParams(location.search).has("canvas") ? Phaser.CANVAS : Phaser.AUTO, parent: "game", backgroundColor: "#0c1712", pixelArt: true, roundPixels: true,
    maxLights: MAX_LIGHTS,
    // AudioContext dùng chung qua các lần tạo lại game (music.ts): Phaser chỉ treo chứ không đóng, nhạc nền mờ chéo được khi đổi bản đồ.
    audio: { context: sharedAudioContext() },
    scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight },
    // Tải tối đa MAX_PARALLEL file cùng lúc (Phaser mặc định 32), lỗi thì thử lại ASSET_RETRIES lần có backoff (assetUrl.ts).
    loader: { maxParallelDownloads: MAX_PARALLEL, maxRetries: ASSET_RETRIES },
  });
  game.scene.add("game", GameScene, true, { room, mapId: roomMap, onTravel, onArena, onBack, watch });
}

// Có phiên cũ -> thử tải nhân vật luôn. Trước đó đọc manifest cho ảnh giao diện (10.8; lỗi thì giao diện vẽ bằng CSS như cũ).
// `?thu=font`: trang thử font tiếng Việt và bộ giao diện thủy mặc / thẻ võ hồn; `?thu=am`: trang nghe thử âm thanh (không cần đăng nhập).
(async () => {
  initTips(); // chú thích dùng chung (UI-0): ủy quyền `title` của mọi phần tử HUD / bảng
  await Promise.all([loadUiArt(), loadGameFonts()]);
  const thu = new URLSearchParams(location.search).get("thu");
  if (thu === "font") return fontTestScreen(card, overlay);
  if (thu === "am") return audioTestScreen(card, overlay); // `?thu=am`: nghe thử tiếng mẫu CC0 (G2, #393)
  if (thu === "fx") return fxTestScreen(card, overlay); // `?thu=fx`: thử hiệu ứng hồn kỹ theo hệ (G3, #394)
  if (thu === "phuthe") return phutheTestScreen(card, overlay); // `?thu=phuthe`: thử chuyển động phụ phụ thể, trước / sau (H7, #490)
  if (thu === "phaptuong") return phapTuongTestScreen(card, overlay); // `?thu=phaptuong`: thử pháp tướng Võ Hồn Chân Thân (#486)
  // Landing (/) đã cho đăng nhập Google nhưng tài khoản chưa có nhân vật: nó chuyển vé sang đây, hiện luôn màn chọn tên (vé hết hạn thì server báo, nameScreen về đăng nhập).
  const gt = takeGoogleTicket();
  if (gt) return nameScreen(gt.ticket, gt.suggest);
  if (!token) return loginScreen();
  await resume();
})();
