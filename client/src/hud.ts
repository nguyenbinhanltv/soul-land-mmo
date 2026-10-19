// Giao diện HTML phủ lên canvas (chữ tiếng Việt hiển thị sắc nét hơn vẽ trong canvas).
import { TIERS, VOHON, SKILLS, HE, ringLimit, tierOfYears, vohonIndex, TEAM_SIZE, SWITCH_CD, TIEN_CO, TIEN_CO_MAX,
  ITEM_KINDS, DAN_CD, itemDef, honTeParts } from "../../shared/data.ts";
import type { OwnedVohons, Squad, PortalInfo, BagMsg, BagItem } from "./net.ts";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
export const ringColor = (t: number) => (t === 3 ? "#8a6bff" : TIERS[t].col);
/** Phím hồn kỹ 1–4 (từ bước 2.3a; phím số 1–4 dành cho đổi võ hồn trong đội). Mã phím là `Key` + chữ. */
export const SKILL_KEYS = ["U", "I", "O", "P"];

export function log(text: string, col?: string, who?: string) {
  const el = $("#log"), d = document.createElement("div");
  if (who) { const b = document.createElement("b"); b.textContent = who + ":"; d.appendChild(b); }
  d.appendChild(document.createTextNode(text));
  if (col) d.style.borderLeftColor = col;
  el.appendChild(d);
  while (el.children.length > 6) el.firstElementChild!.remove();
  setTimeout(() => { d.style.opacity = "0"; setTimeout(() => d.remove(), 700); }, 9000);
}

let bannerTO: number | undefined;
export function banner(a: string, b: string) {
  const el = $("#banner"); el.querySelector("b")!.textContent = a; el.querySelector("span")!.textContent = b;
  el.style.opacity = "1"; clearTimeout(bannerTO); bannerTO = window.setTimeout(() => (el.style.opacity = "0"), 2400);
}

export function buildSkills(vh: number, rings: number[], act: (k: string) => void) {
  const el = $("#skills"); el.innerHTML = "";
  const mk = (key: string, label: string, name: string, col: string, action: string, locked = false, i?: number) => {
    const b = document.createElement("button"); b.className = "sk" + (locked ? " locked" : "");
    if (i !== undefined) b.dataset.i = String(i);
    b.innerHTML = `<b>${key}</b><span class="ico" style="color:${col}"></span><span></span><div class="cd"></div>`;
    b.querySelectorAll("span")[1].textContent = name;
    b.setAttribute("aria-label", label);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); act(action); });
    el.appendChild(b);
  };
  mk("J", "Đánh thường", "Đánh", VOHON[vh].col, "attack");
  SKILLS.forEach((s, i) => {
    const has = i < rings.length;
    mk(SKILL_KEYS[i], `Hồn kỹ ${i + 1}: ${s.name}`, has ? s.name : "Khóa", has ? ringColor(rings[i]) : "#666", `skill${i}`, !has, i);
  });
  mk("E", "Hấp thụ hồn hoàn", "Hấp thụ", "#ffe08a", "absorb");
}

let ringsKey = "";
export function updateStats(p: any) {
  $("#vhName").textContent = VOHON[p.vh].name; $("#vhName").style.color = VOHON[p.vh].col;
  $("#lvl").textContent = `Cấp ${p.level}`;
  $("#hpFill").style.width = (p.hp / Math.max(1, p.maxHp)) * 100 + "%"; $("#hpTxt").textContent = `Sinh lực ${p.hp} / ${p.maxHp}`;
  $("#mpFill").style.width = (p.mp / Math.max(1, p.maxMp)) * 100 + "%"; $("#mpTxt").textContent = `Hồn lực ${p.mp} / ${p.maxMp}`;
  if (!p.xpNeed) { $("#xpFill").style.width = "100%"; $("#xpTxt").textContent = `Bình cảnh: cần hồn hoàn thứ ${p.rings.length + 1}`; }
  else { $("#xpFill").style.width = (p.xp / p.xpNeed) * 100 + "%"; $("#xpTxt").textContent = `Kinh nghiệm ${p.xp} / ${p.xpNeed}`; }
  const rings: number[] = [...p.rings];
  const key = rings.join(",") + "|" + p.level;
  if (key !== ringsKey) {
    ringsKey = key; const el = $("#rings"); el.innerHTML = "";
    rings.forEach((t) => { const d = document.createElement("div"); d.className = "ring"; d.style.color = ringColor(t);
      if (t === 3) d.style.borderColor = TIERS[3].col; d.title = `Hồn hoàn ${TIERS[t].age}`; el.appendChild(d); });
    const slot = rings.length + 1, e = document.createElement("div"); e.className = "ring empty"; el.appendChild(e);
    const s = document.createElement("small"); s.textContent = `Vòng ${slot}: tối đa ${TIERS[ringLimit(slot)].age}, cấp ${slot * 10}`; el.appendChild(s);
  }
  document.querySelectorAll<HTMLElement>(".sk[data-i]").forEach((b) => {
    const i = Number(b.dataset.i); const cd = i < rings.length ? p.cds[i] / SKILLS[i].cd : 0;
    (b.querySelector(".cd") as HTMLElement).style.height = cd * 100 + "%";
  });
  const ch = $("#channel");
  if (p.absorb > 0) { ch.style.display = "block"; $("#chFill").style.width = p.absorb * 100 + "%"; } else ch.style.display = "none";
}

// ---------- Đội hình võ hồn (mục 5.1): thanh 4 ô trong trận và bảng xếp đội ----------
const vohonDef = (id: string) => VOHON[Math.max(0, vohonIndex(id))];
const ownedById = (data: OwnedVohons, rowId: number) => data.list.find((v) => v.rowId === rowId);

/** Thanh đội hình trong trận: mỗi ô một nút (phím 1–4 hoặc chạm) để đổi sang võ hồn đó. */
export function buildTeam(data: OwnedVohons, sw: (slot: number) => void) {
  const el = $("#team"); el.innerHTML = "";
  data.team.forEach((rowId, i) => {
    const v = ownedById(data, rowId), def = v && vohonDef(v.vohon), on = rowId === data.active;
    const b = document.createElement("button"); b.className = "tm" + (on ? " on" : "") + (v ? "" : " locked");
    b.dataset.slot = String(i);
    if (def) b.style.setProperty("--c", def.col);
    if (v) b.dataset.row = String(rowId);
    b.innerHTML = `<b>${i + 1}</b><i class="dot"></i><span></span><small></small><i class="hpb"><i></i></i><i class="enb"><i></i></i><div class="cd"></div>`;
    b.querySelector("span")!.textContent = def ? def.name : "Trống";
    b.dataset.sub = v ? (on ? "Ra trận" : `Cấp ${v.level}`) : "";
    b.querySelector("small")!.textContent = b.dataset.sub;
    b.dataset.label = def ? `Ô ${i + 1}: ${def.name}${on ? ", đang ra trận" : ""}` : `Ô ${i + 1}: trống`;
    if (def) b.dataset.tc = `${TIEN_CO[def.he].name}: ${TIEN_CO[def.he].desc}`;
    b.setAttribute("aria-label", b.dataset.label);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); sw(i); });
    el.appendChild(b);
  });
}

let squad: Squad = { combat: false, list: [] };
/**
 * Nhận tin riêng "squad" (sinh lực, võ hồn đã gục, năng lượng tiên cơ); updateTeam vẽ lại mỗi khung hình. Trả về các võ hồn
 * vừa đầy năng lượng (để báo một lần).
 */
export function setSquad(s: Squad) {
  const filled = s.list.filter((x) => x.en >= TIEN_CO_MAX && (squad.list.find((o) => o.rowId === x.rowId)?.en ?? 0) < TIEN_CO_MAX);
  squad = s;
  return filled.map((x) => x.rowId);
}

/**
 * Mỗi khung hình: thanh sinh lực từng võ hồn trong đội (ô ra trận lấy sinh lực trong state), võ hồn đã gục làm mờ kèm thời gian
 * hồi, thanh năng lượng tiên cơ (ô chưa ra trận đầy năng lượng thì sáng viền, chữ "Tiên cơ!"), và hồi chiêu đổi võ hồn
 * (swCd / SWITCH_CD) phủ lên các ô chưa ra trận.
 */
export function updateTeam(me: { swCd: number; hp: number; maxHp: number }) {
  const k = Math.max(0, Math.min(1, me.swCd / SWITCH_CD));
  document.querySelectorAll<HTMLElement>(".tm").forEach((b) => {
    const on = b.classList.contains("on"), s = squad.list.find((x) => String(x.rowId) === b.dataset.row);
    const down = !!s?.down, hp = on ? me.hp : s?.hp ?? 0, max = on ? me.maxHp : s?.maxHp ?? 0, en = s?.en ?? 0;
    const full = !on && !down && en >= TIEN_CO_MAX;
    b.classList.toggle("down", down);
    b.classList.toggle("full", full);
    const enFill = b.querySelector(".enb i") as HTMLElement | null;
    if (enFill) enFill.style.width = Math.max(0, Math.min(1, en / TIEN_CO_MAX)) * 100 + "%";
    b.classList.toggle("paused", down && squad.combat);
    const fill = b.querySelector(".hpb i") as HTMLElement | null;
    if (fill) fill.style.width = (max ? Math.max(0, Math.min(1, hp / max)) * 100 : 100) + "%";
    const sub = down ? `Gục · ${s!.down}s` : full ? "Tiên cơ!" : b.dataset.sub ?? "";
    const small = b.querySelector("small")!;
    if (small.textContent !== sub) {
      small.textContent = sub;
      b.title = down ? `Đã gục: hồi lại sau ${s!.down} giây ngoài trận (đang giao chiến thì đồng hồ dừng) hoặc khi về doanh trại.`
        : b.dataset.tc ? `Thanh vàng là năng lượng tiên cơ: tích khi võ hồn ra trận đánh trúng, đầy thì đổi vào sẽ tung ${b.dataset.tc}.` : "";
      if (b.dataset.label) b.setAttribute("aria-label", b.dataset.label + (full ? ", đủ năng lượng tiên cơ" : ""));
    }
    (b.querySelector(".cd") as HTMLElement).style.height = (on || down || b.classList.contains("locked") ? 0 : k * 100) + "%";
  });
}

export function toggleRoster(open = $("#roster").hidden) {
  $("#roster").hidden = !open; $("#vhBtn").setAttribute("aria-expanded", String(open));
  if (!open) rosterSel = null;
  else toggleBag(false); // hai bảng cùng chỗ giữa màn hình: mở bảng này thì đóng bảng kia
}

let rosterSel: number | null = null;   // ô đội hình đang chọn để thay võ hồn
let rosterHint = "";

/**
 * Bảng xếp đội hình: 4 ô ở trên, bộ sưu tập ở dưới. Chọn một ô rồi chọn võ hồn để đặt vào ô đó (võ hồn đã ở ô khác thì
 * đổi chỗ); không chọn ô thì võ hồn vào ô trống đầu tiên. Gửi cả đội lên server, server kiểm tra và gửi lại đội đã lưu.
 */
export function renderRoster(data: OwnedVohons, setTeam: (team: number[]) => void) {
  const el = $("#roster"); el.innerHTML = "";
  const members = data.team.filter((r) => r > 0).length;
  const head = document.createElement("div"); head.className = "rhead";
  head.innerHTML = `<b>Đội hình (${members}/${TEAM_SIZE})</b><button class="x" aria-label="Đóng">×</button>`;
  head.querySelector("button")!.addEventListener("click", () => toggleRoster(false));
  el.appendChild(head);
  const send = (team: number[]) => { rosterSel = null; rosterHint = ""; setTeam(team); };

  const slots = document.createElement("div"); slots.className = "tslots";
  data.team.forEach((rowId, i) => {
    const v = ownedById(data, rowId), def = v && vohonDef(v.vohon), on = rowId === data.active;
    const s = document.createElement("div"); s.className = "tslot" + (rosterSel === i ? " sel" : "") + (v ? "" : " empty");
    if (def) s.style.setProperty("--c", def.col);
    const pick = document.createElement("button"); pick.className = "tpick";
    pick.setAttribute("aria-pressed", String(rosterSel === i));
    pick.innerHTML = `<b>${i + 1}</b><i class="dot"></i><span></span><small></small>`;
    pick.querySelector("span")!.textContent = def ? def.name : "Ô trống";
    pick.querySelector("small")!.textContent = v ? `Cấp ${v.level}${on ? " · ra trận" : ""}` : "Chọn để thêm";
    pick.addEventListener("click", () => { pick.blur(); rosterSel = rosterSel === i ? null : i; rosterHint = ""; renderRoster(data, setTeam); });
    s.appendChild(pick);
    if (v) {
      const rm = document.createElement("button"); rm.className = "trm"; rm.textContent = "Bỏ";
      rm.setAttribute("aria-label", `Bỏ ${def!.name} khỏi đội`);
      rm.disabled = members <= 1; // đội phải còn ít nhất một võ hồn
      rm.addEventListener("click", () => { rm.blur(); const t = [...data.team]; t[i] = 0; send(t); });
      s.appendChild(rm);
    }
    slots.appendChild(s);
  });
  el.appendChild(slots);

  const sub = document.createElement("small"); sub.className = "rnote";
  sub.textContent = rosterHint || (rosterSel === null ? `Bộ sưu tập (${data.list.length}): chọn võ hồn để đưa vào ô trống, hoặc chọn một ô trước.`
    : `Chọn võ hồn để đặt vào ô ${rosterSel + 1}.`);
  el.appendChild(sub);

  for (const v of data.list) {
    const def = vohonDef(v.vohon), at = data.team.indexOf(v.rowId);
    const b = document.createElement("button"); b.className = "rcard" + (at >= 0 ? " on" : "");
    b.style.setProperty("--c", def.col);
    b.innerHTML = `<i class="dot"></i><span><b></b><small></small></span><span class="rr"></span>`;
    b.querySelector("b")!.textContent = def.name;
    b.querySelector("small")!.textContent = `${def.rarity} · ${HE[def.he].name} · cấp ${v.level}` + (at >= 0 ? ` · ô ${at + 1}` : "");
    const rr = b.querySelector(".rr")!;
    v.rings.forEach((y) => { const t = tierOfYears(y), r = document.createElement("i"); r.className = "ring"; r.style.color = ringColor(t); rr.appendChild(r); });
    b.addEventListener("click", () => {
      b.blur(); // bỏ focus: phím Space là đánh, không bấm lại nút
      const t = [...data.team], to = rosterSel ?? t.indexOf(0);
      if (to < 0) { rosterHint = `Đội đã đủ ${TEAM_SIZE} võ hồn: chọn một ô để thay.`; return renderRoster(data, setTeam); }
      if (at === to) { rosterSel = null; return renderRoster(data, setTeam); }
      if (at >= 0) t[at] = t[to]; // võ hồn đã trong đội: đổi chỗ hai ô
      t[to] = v.rowId;
      send(t);
    });
    el.appendChild(b);
  }
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Chỉ xếp đội khi không giao chiến và không hấp thụ. Trong trận nhấn 1–${TEAM_SIZE} (hoặc chạm ô đội hình) để đổi võ hồn. Phím V để mở/đóng.`;
  el.appendChild(note);
}

export function showTarget(html: string | null) { const t = $("#target"); if (html) { t.style.display = "block"; t.innerHTML = html; } else t.style.display = "none"; }
/** Hộp đi cổng (mục 5.3): tên bản đồ đích, cấp đề xuất, cảnh báo đỏ khi võ hồn ra trận dưới cấp; nút (hoặc phím F) để đi. */
export function showPortal(info: PortalInfo | null, go: () => void) {
  const el = $("#portal");
  if (!info?.name) { el.hidden = true; el.innerHTML = ""; return; }
  const lv = info.level ? ` (đề xuất cấp ${info.level[0]}–${info.level[1]})` : "";
  el.innerHTML = `<div></div><small></small>${info.warn ? `<span class="danger">Nguy hiểm: võ hồn ra trận dưới cấp đề xuất!</span>` : ""}
    <button type="button" class="${info.warn ? "danger" : ""}">${info.warn ? "Vẫn đi" : "Đi"}<kbd>F</kbd></button>`;
  el.querySelector("div")!.textContent = `Đi tới ${info.toName ?? info.to}${lv}`;
  el.querySelector("small")!.textContent = info.name;
  const b = el.querySelector("button")!;
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); go(); });
  el.hidden = false;
}
export function showPrompt(html: string | null) { const t = $("#prompt"); if (html) { t.style.display = "block"; t.innerHTML = html; } else t.style.display = "none"; }

// ---------- Túi đồ và Hồn Tệ (mục 5.7, bước 3.1): chỉ chính chủ nhận tin "bag" ----------
export function toggleBag(open = $("#bag").hidden) {
  $("#bag").hidden = !open; $("#bagBtn").setAttribute("aria-expanded", String(open));
  if (open) toggleRoster(false);
}

let bagSel: string | null = null;  // id ô đang chọn để xem chi tiết / dùng
let bagCdEnd = 0;                  // performance.now() lúc hết hồi chiêu chung đan (server gửi số giây còn lại)

/** Hồn Tệ dạng HTML: mỗi phần kim / ngân / đồng một màu. */
function honTeHtml(dong: number) {
  return honTeParts(dong).map((p) => `<span class="ht ${p.unit === "kim" ? "kim" : p.unit === "ngân" ? "ngan" : "dong"}">${p.n.toLocaleString("vi-VN")} ${p.unit}</span>`).join(" ");
}

/** Tên hiển thị một ô (mã không còn trong ITEMS: "Vật phẩm lạ"). */
const itemName = (it: BagItem) => itemDef(it.code)?.name ?? "Vật phẩm lạ";

/**
 * Bảng túi đồ: Hồn Tệ, lưới BAG_SLOTS ô (số lượng ở góc ô, đồ cùng loại đã được server gộp), chi tiết ô đang chọn và nút "Dùng".
 * Client chỉ gửi id ô muốn dùng; server kiểm tra và gửi lại túi mới.
 */
export function renderBag(bag: BagMsg, use: (id: string) => void) {
  bagCdEnd = performance.now() + Math.max(0, bag.cd) * 1000;
  const el = $("#bag"); el.innerHTML = "";
  const items = bag.items.filter((i) => i.vohon === null);
  if (bagSel && !items.some((i) => i.id === bagSel)) bagSel = null;
  const head = document.createElement("div"); head.className = "rhead";
  head.innerHTML = `<b>Túi đồ (${items.length}/${bag.slots})</b><button class="x" aria-label="Đóng">×</button>`;
  head.querySelector("button")!.addEventListener("click", () => toggleBag(false));
  el.appendChild(head);
  const coin = document.createElement("div"); coin.className = "coin";
  coin.innerHTML = `<i class="coinico"></i><span>Hồn Tệ:</span> ${honTeHtml(bag.honTe)}`;
  coin.title = `${bag.honTe.toLocaleString("vi-VN")} đồng (1 ngân = 100 đồng, 1 kim = 100 ngân)`;
  el.appendChild(coin);

  const grid = document.createElement("div"); grid.className = "bgrid";
  for (let k = 0; k < bag.slots; k++) {
    const it = items[k], b = document.createElement("button");
    b.className = "bslot" + (it ? "" : " empty") + (it && it.id === bagSel ? " sel" : "");
    if (it) {
      const def = itemDef(it.code);
      b.dataset.id = it.id; if (def?.cd) b.dataset.cd = def.cd;
      b.style.setProperty("--c", def?.col ?? "#9db3a2");
      b.innerHTML = `<i class="ico ${def?.kind ?? "unknown"}"></i>${it.qty > 1 ? `<small>${it.qty}</small>` : ""}<div class="cd"></div>`;
      b.setAttribute("aria-label", `${itemName(it)}, ${it.qty} món`);
      b.title = itemName(it);
      b.addEventListener("click", () => { b.blur(); bagSel = bagSel === it.id ? null : it.id; renderBag({ ...bag, cd: Math.max(0, (bagCdEnd - performance.now()) / 1000) }, use); });
    } else { b.disabled = true; b.setAttribute("aria-label", "Ô trống"); }
    grid.appendChild(b);
  }
  el.appendChild(grid);

  const info = document.createElement("div"); info.className = "binfo";
  const sel = items.find((i) => i.id === bagSel), def = sel && itemDef(sel.code);
  if (sel) {
    info.innerHTML = `<b></b><small></small><p></p>`;
    info.querySelector("b")!.textContent = `${itemName(sel)}${sel.qty > 1 ? ` ×${sel.qty}` : ""}`;
    info.querySelector("b")!.style.color = def?.col ?? "";
    info.querySelector("small")!.textContent = def ? ITEM_KINDS[def.kind].name + (def.cd ? ` · hồi chiêu chung ${DAN_CD} giây` : "") : "Không rõ loại";
    info.querySelector("p")!.textContent = def?.desc ?? "Vật phẩm không còn trong trò chơi, vẫn được giữ trong túi.";
    if (def && (def.hp || def.mp)) {
      const btn = document.createElement("button"); btn.className = "buse"; btn.dataset.cd = def.cd ?? "";
      btn.textContent = "Dùng";
      btn.addEventListener("click", () => { btn.blur(); use(sel.id); });
      info.appendChild(btn);
    }
  } else info.innerHTML = `<small>Chọn một ô để xem và dùng vật phẩm.</small>`;
  el.appendChild(info);
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = "Đồ cùng loại tự gộp vào một ô. Hồi Huyết Đan và Hồi Hồn Đan dùng chung hồi chiêu. Phím B để mở/đóng.";
  el.appendChild(note);
  updateBag();
}

/** Mỗi lần cập nhật HUD: lớp phủ hồi chiêu chung trên ô đan và chữ trên nút "Dùng". */
export function updateBag() {
  if ($("#bag").hidden) return;
  const left = Math.max(0, (bagCdEnd - performance.now()) / 1000), k = Math.min(1, left / DAN_CD);
  document.querySelectorAll<HTMLElement>("#bag .bslot[data-cd]").forEach((b) => { (b.querySelector(".cd") as HTMLElement).style.height = k * 100 + "%"; });
  const btn = document.querySelector<HTMLButtonElement>("#bag .buse");
  if (btn && btn.dataset.cd) {
    const txt = left > 0 ? `Đang hồi · ${Math.ceil(left)}s` : "Dùng";
    if (btn.textContent !== txt) { btn.textContent = txt; btn.disabled = left > 0; }
  }
}
