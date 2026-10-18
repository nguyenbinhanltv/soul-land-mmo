// Giao diện HTML phủ lên canvas (chữ tiếng Việt hiển thị sắc nét hơn vẽ trong canvas).
import { TIERS, VOHON, SKILLS, ringLimit } from "../../shared/data.ts";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
export const ringColor = (t: number) => (t === 3 ? "#8a6bff" : TIERS[t].col);

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
    mk(String(i + 1), `Hồn kỹ ${i + 1}: ${s.name}`, has ? s.name : "Khóa", has ? ringColor(rings[i]) : "#666", `skill${i}`, !has, i);
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

export function showTarget(html: string | null) { const t = $("#target"); if (html) { t.style.display = "block"; t.innerHTML = html; } else t.style.display = "none"; }
export function showPrompt(html: string | null) { const t = $("#prompt"); if (html) { t.style.display = "block"; t.innerHTML = html; } else t.style.display = "none"; }
