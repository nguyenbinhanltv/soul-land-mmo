// Giao diện HTML phủ lên canvas (chữ tiếng Việt hiển thị sắc nét hơn vẽ trong canvas).
import { TIERS, VOHON, SKILLS, HE, ringLimit, tierOfYears, vohonIndex, TEAM_SIZE, SWITCH_CD } from "../../shared/data.ts";
import type { OwnedVohons } from "./net.ts";

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
    b.innerHTML = `<b>${i + 1}</b><i class="dot"></i><span></span><small></small><div class="cd"></div>`;
    b.querySelector("span")!.textContent = def ? def.name : "Trống";
    b.querySelector("small")!.textContent = v ? (on ? "Ra trận" : `Cấp ${v.level}`) : "";
    b.setAttribute("aria-label", def ? `Ô ${i + 1}: ${def.name}${on ? ", đang ra trận" : ""}` : `Ô ${i + 1}: trống`);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); sw(i); });
    el.appendChild(b);
  });
}

/** Hồi chiêu đổi võ hồn (swCd / SWITCH_CD) phủ lên các ô chưa ra trận. */
export function updateTeam(swCd: number) {
  const k = Math.max(0, Math.min(1, swCd / SWITCH_CD));
  document.querySelectorAll<HTMLElement>(".tm").forEach((b) => {
    (b.querySelector(".cd") as HTMLElement).style.height = (b.classList.contains("on") || b.classList.contains("locked") ? 0 : k * 100) + "%";
  });
}

export function toggleRoster(open = $("#roster").hidden) {
  $("#roster").hidden = !open; $("#vhBtn").setAttribute("aria-expanded", String(open));
  if (!open) rosterSel = null;
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
export function showPrompt(html: string | null) { const t = $("#prompt"); if (html) { t.style.display = "block"; t.innerHTML = html; } else t.style.display = "none"; }
