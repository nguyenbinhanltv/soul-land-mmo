import "./style.css";
import Phaser from "phaser";
import { Client, type Room } from "colyseus.js";
import { GameScene } from "./scenes/GameScene.ts";
import { addLag } from "./predict.ts";
import { TIERS, VOHON, HE, MAPS, vohonIndex, AWAKEN_GIFT, AWAKEN_CHOICES, SEXES, HAIR_STYLES, HAIR_COLORS, OUTFIT_COLORS, SKIN_TONES,
  type He, type Looks } from "../../shared/data.ts";
import { API, WS, post, storage, type Character, type Me } from "./net.ts";
import { ringColor } from "./hud.ts";
import { paintHonsuPreview } from "./honsuArt.ts";
import { MAX_LIGHTS } from "./lighting.ts";

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
      const r = await post<{ token: string } & Me>("/api/login", { name: name.value.trim(), password: pass.value });
      token = r.token; storage.set("shh-token", token); storage.set("shh-name", name.value.trim());
      route(r);
    } catch (er) {
      document.getElementById("err")!.textContent = er instanceof TypeError ? `Không kết nối được server (${API}).` : (er as Error).message;
      btn.disabled = false; btn.textContent = "Vào game";
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

/** Vẽ hồn sư xem trước lên canvas 32×32 (CSS phóng to, pixelated), cùng hình vẽ với trong game. */
function paintPreview(cv: HTMLCanvasElement, L: Looks) {
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, cv.width, cv.height);
  paintHonsuPreview(ctx, L, 16, 30);
}

// Tạo nhân vật (mục 3, 5.11): chọn giới tính, tông da (9.9), kiểu tóc, màu tóc, màu áo. Chạy ngay trước bước chọn SSR của lễ thức tỉnh;
// tài khoản cũ đang mang ngoại hình mặc định thì được chọn lại một lần. Server kiểm tra mọi giá trị.
function createScreen(me: Me) {
  const L: Looks = { sex: me.looks.sex, hair: me.looks.hair, hairCol: me.looks.hairCol, outfitCol: me.looks.outfitCol, skin: me.looks.skin };
  card.classList.add("wide");
  card.innerHTML = `<h1>Tạo nhân vật</h1>
    <p>${me.character
      ? "Hồn sư của bạn đang mang ngoại hình mặc định. Bạn được chọn lại <b>một lần</b>; sau khi xác nhận sẽ không đổi được nữa."
      : "Chọn ngoại hình hồn sư trước lễ thức tỉnh. Ngoại hình chỉ chọn được <b>một lần</b>."}</p>
    <div class="maker">
      <div class="pv"><canvas id="pv" width="32" height="32" aria-label="Xem trước hồn sư"></canvas><div id="pvTxt"></div></div>
      <div class="opts" id="opts"></div>
    </div>
    <div class="btns"><button class="btn primary" id="ok">Xác nhận ngoại hình</button><button class="btn" id="out">Đổi tài khoản</button></div>
    <div class="err" id="err"></div>`;
  const opts = document.getElementById("opts")!, cv = document.getElementById("pv") as HTMLCanvasElement;
  const seg = (k: keyof Looks, names: readonly string[]) => names.map((n, i) =>
    `<button type="button" class="opt" data-k="${k}" data-i="${i}" aria-pressed="${L[k] === i}">${n}</button>`).join("");
  // Ô màu vẽ 3 sắc sáng nhất của dải (tóc / áo 4 sắc, da 3 sắc).
  const sw = (k: keyof Looks, list: readonly { name: string; ramp: readonly string[] }[]) => list.map((c, i) => {
    const [a, b, d] = c.ramp.slice(-3);
    return `<button type="button" class="sw" data-k="${k}" data-i="${i}" aria-pressed="${L[k] === i}" title="${c.name}" aria-label="${c.name}"
      style="--a:${a};--b:${b};--c:${d}"></button>`;
  }).join("");
  const render = () => {
    opts.innerHTML = `<h3>Giới tính</h3><div class="seg">${seg("sex", SEXES)}</div>
      <h3>Tông da · ${SKIN_TONES[L.skin].name}</h3><div class="sws">${sw("skin", SKIN_TONES)}</div>
      <h3>Kiểu tóc</h3><div class="seg">${seg("hair", HAIR_STYLES[L.sex])}</div>
      <h3>Màu tóc · ${HAIR_COLORS[L.hairCol].name}</h3><div class="sws">${sw("hairCol", HAIR_COLORS)}</div>
      <h3>Màu áo · ${OUTFIT_COLORS[L.outfitCol].name}</h3><div class="sws">${sw("outfitCol", OUTFIT_COLORS)}</div>`;
    paintPreview(cv, L);
    document.getElementById("pvTxt")!.textContent = `${SEXES[L.sex]} · ${HAIR_STYLES[L.sex][L.hair]}`;
  };
  // Một bộ nghe chung cho mọi nút (click chạy cả với chuột và chạm).
  opts.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-k]"); if (!b) return;
    const k = b.dataset.k as keyof Looks, i = Number(b.dataset.i);
    if (L[k] === i) return;
    L[k] = i; render();
    opts.querySelector<HTMLButtonElement>(`button[data-k="${k}"][data-i="${i}"]`)?.focus();
  });
  render();
  const ok = document.getElementById("ok") as HTMLButtonElement;
  ok.onclick = async () => {
    ok.disabled = true;
    try {
      const r = await post<{ looks: Me["looks"] }>("/api/looks", { token, ...L });
      route({ ...me, looks: r.looks });
    } catch (e) {
      // Đã chọn ở tab khác, hoặc phiên hết hạn: hỏi lại server.
      const m = (e as Error).message;
      if (/đã chọn|hết hạn/.test(m)) return resume(m);
      document.getElementById("err")!.textContent = m; ok.disabled = false;
    }
  };
  document.getElementById("out")!.onclick = () => { storage.del("shh-token"); loginScreen(); };
  ok.focus();
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
      <div class="btns"><button class="btn primary" id="go">Tới ${esc(MAPS[mapId]?.name ?? "bản đồ")}</button></div>`;
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
  card.classList.remove("wide");
  card.innerHTML = `<div class="vh" style="color:${v.col}"><div class="orb"></div></div>
    <div class="vh"><h2>${esc(c.name)}</h2><div class="k">${v.name} ra trận – cấp ${c.level}, ${c.rings.length} hồn hoàn</div>
    <div class="t"><small>Trong game, nhấn V hoặc nút “Đội hình” để xếp đội 4 võ hồn; nhấn 1–4 để đổi võ hồn ngay khi đang đánh.</small></div></div>
    <div class="btns"><button class="btn primary" id="go">Vào ${esc(MAPS[mapId]?.name ?? "game")}</button><button class="btn" id="out">Đổi tài khoản</button></div>`;
  document.getElementById("go")!.onclick = () => join();
  document.getElementById("out")!.onclick = () => { storage.del("shh-token"); loginScreen(); };
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
  overlay.hidden = false; card.classList.remove("wide");
  card.innerHTML = `<h1>Đang tới ${esc(MAPS[mapId]?.name ?? "bản đồ")}…</h1>`;
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
    const roomMap = await waitMapId(room).catch((e) => { room.leave().catch(() => {}); throw e; });
    play(room, roomMap);
  } catch (e) {
    const m = (e as Error).message ?? "";
    // Bản đồ trong DB khác bản đồ vừa xin vào (vd vừa đi cổng ở tab khác): hỏi lại /api/me rồi vào đúng phòng một lần.
    if (retry && /Sai bản đồ/.test(m)) {
      const me = await post<Me>("/api/me", { token }).catch(() => null);
      if (me) { mapId = me.mapId; return join(false); }
    }
    // Chưa tạo nhân vật hoặc chưa thức tỉnh (ví dụ tab khác vừa đổi): hỏi lại server để mở đúng màn.
    if (/Chưa tạo nhân vật|Chưa thức tỉnh/.test(m)) resume(m);
    else if (/401|403|không hợp lệ/.test(m)) loginScreen(m); else loginScreen(`Không vào được phòng: ${m}`);
  }
}

/**
 * Vào phòng sân đấu Đại Đấu Hồn Trường bằng mã phòng server gửi khi ghép trận (7.2; phòng riêng, không ghép theo mapId). Không vào
 * được (trận đã hủy, quá giờ) thì quay về bản đồ đang đứng.
 */
async function joinArena(roomId: string) {
  overlay.hidden = false; card.classList.remove("wide");
  card.innerHTML = `<h1>Đang vào Đại Đấu Hồn Trường…</h1>`;
  try {
    const room = await new Client(WS).joinById(roomId, { token });
    const roomMap = await waitMapId(room).catch((e) => { room.leave().catch(() => {}); throw e; });
    play(room, roomMap);
  } catch (e) {
    card.innerHTML = `<h1>Không vào được trận đấu</h1><p>${esc((e as Error).message ?? "")}</p>`;
    setTimeout(() => join(), 1500);
  }
}

/** Mã đóng kết nối của ArenaRoom khi trận đã xong (ARENA_END_CODE ở server): tự về bản đồ cũ. */
const ARENA_END_CODE = 4005;

/**
 * Mở Phaser cho phòng vừa vào. Server cho đi cổng hoặc đổi kênh (`travel {mapId, roomId}`) thì rời phòng cũ, hủy scene và vào phòng
 * (kênh) server đã chọn ở bản đồ đích.
 * Từ 7.2: ghép được trận thì rời bản đồ, vào phòng sân đấu; xong trận (hoặc bấm rời sân) thì về lại bản đồ đang đứng (`mapId` không đổi
 * khi vào sân, server giữ vị trí cũ; kênh chọn lại qua /api/channel).
 */
function play(room: Room, roomMap: string) {
  overlay.hidden = true;
  addLag(room); // ?lag=<ms>: giả lập ping cao để thử dự đoán chuyển động
  let travelling = false, left = false;
  const isArena = MAPS[roomMap]?.kind === "arena";
  room.onLeave((code) => {
    left = true;
    if (travelling) return;
    if (isArena && code === ARENA_END_CODE) { onTravel(mapId); return; }
    document.body.classList.remove("playing"); overlay.hidden = false;
    const msg = code === 4001 ? "Tài khoản vừa đăng nhập ở nơi khác." : "Mất kết nối với server.";
    card.innerHTML = `<h1>Đã rời ${esc(MAPS[roomMap]?.name ?? "bản đồ")}</h1><p>${msg}</p><div class="btns"><button class="btn primary" onclick="location.reload()">Vào lại</button></div>`;
  });
  /** Rời phòng hiện tại, hủy scene rồi `next()` (vào phòng mới). */
  const leaveThen = async (next: () => void) => {
    if (travelling) return;
    travelling = true;
    // Kết nối đã đóng (server đưa ra khỏi sân, mã 4005) thì không gửi rời phòng nữa: leave() của colyseus.js sẽ không bao giờ xong.
    if (!left) await room.leave().catch(() => {});
    game?.destroy(true); game = null;
    document.body.classList.remove("playing"); document.getElementById("hud")!.hidden = true;
    next();
  };
  // `roomId`: kênh server đã chọn (tin `travel`); không có (về từ sân đấu) thì join hỏi /api/channel.
  const onTravel = (to: string, roomId?: string | null) => leaveThen(() => { mapId = to; join(true, roomId); });
  const onArena = (roomId: string) => leaveThen(() => joinArena(roomId));
  const onBack = () => onTravel(mapId);
  game = new Phaser.Game({
    // `?canvas`: ép Canvas để thử đường lùi không có WebGL (ánh sáng tắt hẳn, 10.7). maxLights: số đèn Light2D (lighting.ts).
    type: new URLSearchParams(location.search).has("canvas") ? Phaser.CANVAS : Phaser.AUTO, parent: "game", backgroundColor: "#0c1712", pixelArt: true, roundPixels: true,
    maxLights: MAX_LIGHTS,
    scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight },
  });
  game.scene.add("game", GameScene, true, { room, mapId: roomMap, onTravel, onArena, onBack });
}

// Có phiên cũ -> thử tải nhân vật luôn.
(async () => {
  if (!token) return loginScreen();
  await resume();
})();
