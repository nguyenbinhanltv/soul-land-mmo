// Bảng Võ Hồn / đội hình, hồn kỹ, hồn cốt, hồn hạch, cường hóa và mảnh võ hồn của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 0a); hud.ts re-export để nơi gọi giữ nguyên.
import { bagCap, boneEmptyIcon, boneFullText, boneIcon, boneOf, boneStatText, closeNpc, coreIcon, coreOf, coreSet, itemColor, itemName, resMsg, subName, toggleBag, toggleFriends, toggleReso, toggleWorld, yearsShort } from "./hud.ts";
import { VOHON, HE, tierOfYears, vohonIndex, TEAM_SIZE, MAX_RINGS, MAX_STARS, SHARD_UNLOCK, starCost, MAPS, bondsOf, BONE_SLOTS, BONE_STAT_NAMES, boneSlotIndex, boneBonus, calcStats, type BoneStat, coreSetIndex, coreMainValue, coreStatText, CORE_SLOTS, CORE_SET_2, CORE_SET_4, CORE_STAT_IDS, CORE_STATS, coreSlotOf, coreBonus, coreSetCounts, BONE_ACTIVE_SLOTS, boneSkillOf, BONE_MAX_ENHANCE, BONE_FEED_MAX, BONE_FEED_SAME_SLOT, boneXp, boneEnhancePreview, boneEnhanceNeed, boneFeedXp, boneSkillMult, boneMilestones, BONE_ENHANCE_MILESTONES, BONE_MAX_SUBS, BONE_SUB_POOL, parseBoneSubs, boneSubsDue, formatHonTe, BONE_ENHANCE_FEE, CORE_ENHANCE_FEE, enhanceFee, CORE_MAX_ENHANCE, CORE_FEED_MAX, CORE_FEED_SAME_SET, CORE_SUB_EVERY, CORE_MAX_SUBS, coreXp, coreEnhancePreview, coreEnhanceNeed, coreFeedXp, herbBonus, ringSkill, skillChoices, loadoutOf, LOADOUT_SIZE, HIGH_RINGS, CHAN_THAN_RING, chanThanOf, CHAN_THAN_SKILL_SLOT } from "../../shared/data.ts";


import { vohonCard } from "./cards.ts";
import { artUrl, chanThanImg, skillImg } from "./uiArt.ts";
import { toggleChar } from "./charPanel.ts";
import { isUi2 } from "./uiKit.ts";



import type { OwnedVohons, BagItem } from "./net.ts";
import { ringColor, SKILL_KEYS, BONE_SKILL_KEYS, skillCd, cdText, starSkillText, AVA_KEY, boneSkillText, pow2, vohonDef, ownedById } from "./hudBar.ts";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

export function toggleRoster(open = $("#roster").hidden) {
  $("#roster").hidden = !open; $("#vhBtn").setAttribute("aria-expanded", String(open));
  if (!open) rosterSel = null;
  else { toggleBag(false); closeNpc(); toggleReso(false); toggleWorld(false); toggleFriends(false); toggleChar(false); } // các bảng cùng chỗ giữa màn hình: mở bảng này thì đóng bảng kia
}

/** UI v2 (đợt 2b-1, ui2-vohon.css): bảng chia 5 tab ở đáy; tắt cờ thì giữ một cột cuộn như cũ (UI2 = false: mọi mục hiện). */
const UI2 = isUi2();
const K = (cls: string) => (UI2 ? ` ${cls}` : "");
type RosterTab = "doi" | "ky" | "bone" | "core" | "manh";
const ROSTER_TABS: { id: RosterTab; name: string }[] = [{ id: "doi", name: "Đội hình" }, { id: "ky", name: "Hồn kỹ" }, { id: "bone", name: "Hồn cốt" }, { id: "core", name: "Hồn hạch" }, { id: "manh", name: "Mảnh" }];
let rosterTab: RosterTab = "doi";
const showTab = (t: RosterTab) => !UI2 || rosterTab === t;
let rosterSel: number | null = null;   // ô đội hình đang chọn để thay võ hồn
let rosterHint = "";

/**
 * Thao tác của bảng đội hình: client chỉ gửi ý định (đội mới, mã võ hồn muốn mở / lên sao, hồn cốt muốn gắn / tháo), server kiểm
 * tra rồi gửi lại. `portrait`: ảnh hồn sư của mình phóng thích võ hồn đó (data URL; "" nếu chưa vẽ được);
 * `combat`: đang giao chiến (tin "squad").
 */
export interface RosterActions {
  setTeam(team: number[]): void; unlock(vohon: string): void; starUp(vohon: string): void;
  equip(itemId: string, vohonId: number, slot?: string): void; unequip(itemId: string): void;
  equipCore(itemId: string, vohonId: number, slot?: number): void; unequipCore(itemId: string): void;
  enhance(targetId: string, materialIds: string[]): void; enhanceCore(targetId: string, materialIds: string[]): void;
  portrait(vohon: string): string; combat(): boolean;
  loadout(rowId: number, skills: number[]): void; // 8.1a: 4 ô hồn kỹ mang theo
}

/**
 * Bảng xếp đội hình: 4 ô ở trên, bộ sưu tập ở dưới. Chọn một ô rồi chọn võ hồn để đặt vào ô đó (võ hồn đã ở ô khác thì
 * đổi chỗ); không chọn ô thì võ hồn vào ô trống đầu tiên. Gửi cả đội lên server, server kiểm tra và gửi lại đội đã lưu.
 * Cuối bảng là mảnh võ hồn (bước 3.4): `shards` = số mảnh trong túi theo mã võ hồn; tiến độ mở (x/SHARD_UNLOCK) hoặc lên sao
 * kế tiếp (x/STAR_COST), nút Mở / Lên sao (server kiểm tra lại số mảnh).
 */
export function renderRoster(data: OwnedVohons, act: RosterActions, shards: Map<string, number>, items: BagItem[] = []) {
  const el = $("#roster"); el.innerHTML = "";
  if (UI2) el.classList.add("f2-muc-lon");
  const members = data.team.filter((r) => r > 0).length;
  const head = document.createElement("div"); head.className = "rhead";
  head.innerHTML = `<b>Đội hình (${members}/${TEAM_SIZE})</b><span><button class="rlink">Cộng minh</button><button class="x" aria-label="Đóng">×</button></span>`;
  head.querySelector(".x")!.addEventListener("click", () => toggleRoster(false));
  head.querySelector(".rlink")!.addEventListener("click", () => toggleReso(true)); // cộng minh (8.2): cộng cho mọi võ hồn
  el.appendChild(head);
  const send = (team: number[]) => { rosterSel = null; rosterHint = ""; act.setTeam(team); };

  // 4 ô đội hình là 4 thẻ võ hồn (10.8): chọn thẻ để đặt võ hồn khác vào ô đó; ô trống là thẻ giấy để trống.
  const doi = showTab("doi");
  const slots = document.createElement("div"); slots.className = "tslots cgrid";
  data.team.forEach((rowId, i) => {
    const v = ownedById(data, rowId), def = v && vohonDef(v.vohon), on = rowId === data.active;
    const s = document.createElement("div"); s.className = "tslot" + (rosterSel === i ? " sel" : "") + (v ? "" : " empty");
    if (def) s.style.setProperty("--c", def.col);
    let pick: HTMLButtonElement;
    if (v && def) pick = vohonCard(def, { level: v.level, stars: v.stars, rings: v.rings, slot: i + 1, active: on }, "button") as HTMLButtonElement;
    else {
      pick = document.createElement("button"); pick.className = "vcardx cempty";
      pick.innerHTML = `<i class="csl">${i + 1}</i><span>Ô trống</span><small>Chọn để thêm</small>`;
      pick.setAttribute("aria-label", `Ô ${i + 1}: trống`);
    }
    pick.setAttribute("aria-pressed", String(rosterSel === i));
    pick.addEventListener("click", () => { pick.blur(); rosterSel = rosterSel === i ? null : i; rosterHint = ""; renderRoster(data, act, shards, items); });
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
  if (doi) el.appendChild(slots);

  // Ràng buộc (mục 5.1, từ 2.5d; 9.4 mỗi cặp một dòng): cặp võ hồn cùng trong đội thì cả đội có thêm hiệu ứng (server tự tính lại).
  const bonds = bondsOf(data.team.map((r) => ownedById(data, r)?.vohon ?? ""));
  if (doi && bonds.length) {
    const box = document.createElement("div"); box.className = "rbonds";
    for (const b of bonds) {
      const bd = document.createElement("small"); bd.className = "rnote rbond";
      const pair = b.pair.map((v) => VOHON[Math.max(0, vohonIndex(v))].name).join(" + ");
      bd.textContent = `Ràng buộc ${b.name} (${pair}): ${b.desc}`;
      box.appendChild(bd);
    }
    el.appendChild(box);
  }

  const sub = document.createElement("small"); sub.className = "rnote";
  sub.textContent = rosterHint || (rosterSel === null ? `Bộ sưu tập (${data.list.length}): chọn võ hồn để đưa vào ô trống, hoặc chọn một ô trước.`
    : `Chọn võ hồn để đặt vào ô ${rosterSel + 1}.`);
  if (doi) el.appendChild(sub);

  // Bộ sưu tập (10.8): lưới thẻ võ hồn; võ hồn đã trong đội mang ấn son số ô. Hiệu ứng hồn kỹ theo sao (9.5) ghi thành dòng chữ nhỏ
  // dưới thẻ (đọc được trên màn chạm) và nối vào nhãn đọc màn hình của thẻ.
  const grid = document.createElement("div"); grid.className = "cgrid rgrid"; if (doi) el.appendChild(grid);
  for (const v of doi ? data.list : []) {
    const def = vohonDef(v.vohon), at = data.team.indexOf(v.rowId);
    const b = vohonCard(def, { level: v.level, stars: v.stars, rings: v.rings, slot: at >= 0 ? at + 1 : undefined, active: v.rowId === data.active }, "button");
    const stx = starSkillText(v.stars);
    b.title = `${def.name} · ${def.rarity} · ${HE[def.he].name} · cấp ${v.level}` + (at >= 0 ? ` · ô ${at + 1}` : "") + (stx ? `\n${stx}` : "");
    if (stx) b.setAttribute("aria-label", `${b.getAttribute("aria-label")}. ${stx}`);
    b.addEventListener("click", () => {
      b.blur(); // bỏ focus: phím Space là đánh, không bấm lại nút
      const t = [...data.team], to = rosterSel ?? t.indexOf(0);
      if (to < 0) { rosterHint = `Đội đã đủ ${TEAM_SIZE} võ hồn: chọn một ô để thay.`; return renderRoster(data, act, shards, items); }
      if (at === to) { rosterSel = null; return renderRoster(data, act, shards, items); }
      if (at >= 0) t[at] = t[to]; // võ hồn đã trong đội: đổi chỗ hai ô
      t[to] = v.rowId;
      send(t);
    });
    const cell = document.createElement("div"); cell.className = "ccol"; cell.appendChild(b);
    if (stx) { const t = document.createElement("small"); t.className = "rstar"; t.textContent = stx; t.setAttribute("aria-hidden", "true"); cell.appendChild(t); }
    grid.appendChild(cell);
  }
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Chỉ xếp đội khi không giao chiến và không hấp thụ. Trong trận nhấn 1–${TEAM_SIZE} (hoặc chạm ô đội hình) để đổi võ hồn. Phím V để mở/đóng.`;
  if (doi) el.appendChild(note);
  rosterAgain = () => renderRoster(data, act, shards, items);
  if (showTab("ky")) renderLoadout(el, data, act, rosterAgain);
  if (showTab("bone")) renderBones(el, data, act, items, rosterAgain);
  if (showTab("core")) renderCores(el, data, act, items, rosterAgain);
  if (showTab("manh")) renderShards(el, data, act, shards);
  if (UI2) el.appendChild(rosterTabs(members, rosterAgain));
}

/** Tab dưới của bảng (UI v2): 5 mục, mục đang xem có vạch dưới chân; cuộn về đầu khi đổi mục. Chỉ đổi cách hiện, không gửi gì lên server. */
function rosterTabs(members: number, again: () => void) {
  const nav = document.createElement("div"); nav.className = "rtabs"; nav.setAttribute("role", "tablist"); nav.setAttribute("aria-label", "Mục của bảng Võ Hồn");
  for (const t of ROSTER_TABS) {
    const b = document.createElement("button"); b.type = "button"; b.className = "ui-tab f2-tab"; b.dataset.tab = t.id;
    b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(rosterTab === t.id));
    b.textContent = t.name; if (t.id === "doi") b.title = `Đội hình ${members}/${TEAM_SIZE}`;
    b.addEventListener("click", () => { b.blur(); if (rosterTab === t.id) return; rosterTab = t.id; rosterSel = null; again(); $("#roster").scrollTop = 0; });
    nav.appendChild(b);
  }
  return nav;
}

// ---------- 4 ô hồn kỹ mang theo (mục 5.2, bước 8.1a) ----------
let skVh: number | null = null;        // võ hồn đang xếp ô hồn kỹ (null = võ hồn ra trận)
let skSlot: number | null = null;      // ô U / I / O / P đang chọn để đặt hồn kỹ vào
/**
 * Chọn 4 hồn kỹ mang theo (phím U / I / O / P) từ các hồn kỹ đã mở của một võ hồn: chọn ô rồi chọn hồn kỹ (hồn kỹ đang ở ô khác thì đổi
 * chỗ); không chọn ô thì hồn kỹ vào ô trống đầu tiên. Nút "Bỏ" để trống ô. Võ Hồn Chân Thân (vòng 7) dùng phím riêng nên chỉ hiện để
 * xem. Gửi `loadout {rowId, skills}`; server kiểm tra (vòng đã mở, ngoài giao chiến) rồi gửi lại danh sách võ hồn. Chuột và chạm như nhau.
 */
function renderLoadout(el: HTMLElement, data: OwnedVohons, act: RosterActions, again: () => void) {
  const head = document.createElement("b"); head.className = "shead"; head.textContent = "Hồn kỹ mang theo";
  el.appendChild(head);
  if (skVh === null || !data.list.some((v) => v.rowId === skVh)) skVh = data.active;
  const v = data.list.find((x) => x.rowId === skVh) ?? data.list[0]; if (!v) return;
  const id = v.vohon, cur = loadoutOf(id, v.skills), choices = skillChoices(id, v.rings.length), tiers = v.rings.map(tierOfYears);

  const pickRow = document.createElement("label"); pickRow.className = "bvh";
  pickRow.innerHTML = `<span>Võ hồn</span><select></select>`;
  const sel = pickRow.querySelector("select")!;
  for (const o of data.list) {
    const opt = document.createElement("option"); opt.value = String(o.rowId);
    opt.textContent = `${vohonDef(o.vohon).name} · ${o.rings.length} hồn hoàn${o.rowId === data.active ? " · ra trận" : ""}`;
    opt.selected = o.rowId === v.rowId; sel.appendChild(opt);
  }
  sel.addEventListener("change", () => { skVh = Number(sel.value); skSlot = null; again(); });
  el.appendChild(pickRow);

  const send = (l: number[]) => { skSlot = null; act.loadout(v.rowId, l); };
  if (UI2) renderWheel(el, v, cur, tiers, send, again);
  const slots = document.createElement("div"); slots.className = "tslots kslots";
  cur.forEach((r, i) => {
    const s = r >= 0 ? ringSkill(id, r) : null, open = s && r < v.rings.length;
    const box = document.createElement("div"); box.className = "tslot" + (skSlot === i ? " sel" : "") + (s ? "" : " empty");
    if (open) box.style.setProperty("--c", ringColor(tiers[r]));
    const pick = document.createElement("button"); pick.className = "tpick"; pick.setAttribute("aria-pressed", String(skSlot === i));
    pick.innerHTML = `<b></b><i class="dot"></i><span></span><small></small>`;
    pick.querySelector("b")!.textContent = SKILL_KEYS[i];
    pick.querySelector("span")!.textContent = s ? s.name : "Ô trống";
    pick.querySelector("small")!.textContent = s ? `Vòng ${r + 1}${open ? "" : " · chưa mở"}${s.ult ? " · tuyệt kỹ" : ""}` : "Chọn để thêm";
    pick.addEventListener("click", () => { pick.blur(); skSlot = skSlot === i ? null : i; again(); });
    box.appendChild(pick);
    if (s) {
      const rm = document.createElement("button"); rm.className = "trm"; rm.textContent = "Bỏ"; rm.setAttribute("aria-label", `Bỏ ${s.name} khỏi ô ${SKILL_KEYS[i]}`);
      rm.addEventListener("click", () => { rm.blur(); const l = [...cur]; l[i] = -1; send(l); });
      box.appendChild(rm);
    }
    slots.appendChild(box);
  });
  // Vòng 7 là Võ Hồn Chân Thân (phím riêng, không xếp vào 4 ô): hiện thêm một ô cố định, không chọn / bỏ được.
  const ct7 = chanThanOf(id);
  if (ct7) {
    const open = v.rings.length >= CHAN_THAN_RING, box = document.createElement("div"); box.className = "tslot ava" + (open ? "" : " locked");
    if (open) box.style.setProperty("--c", ringColor(tiers[CHAN_THAN_RING - 1]));
    box.title = `${ct7.name}: ${ct7.desc}. Khi biến hình, ô ${SKILL_KEYS[CHAN_THAN_SKILL_SLOT]} thành ${ct7.skill.name}.`;
    box.innerHTML = `<div class="tpick"><b></b><i class="dot"></i><span></span><small></small></div>`;
    box.querySelector("b")!.textContent = AVA_KEY;
    box.querySelector("span")!.textContent = ct7.name;
    box.querySelector("small")!.textContent = `Vòng ${CHAN_THAN_RING} · Võ Hồn Chân Thân${open ? "" : " · chưa mở"} · cố định`;
    slots.appendChild(box);
  }
  if (!UI2) el.appendChild(slots);

  const hint = document.createElement("small"); hint.className = "rnote";
  hint.textContent = skSlot === null ? "Chọn hồn kỹ để đưa vào ô trống, hoặc chọn một ô trước rồi chọn hồn kỹ." : `Chọn hồn kỹ để đặt vào ô ${SKILL_KEYS[skSlot]}.`;
  el.appendChild(hint);
  const list = document.createElement("div"); list.className = "klist";
  for (let r = 0; r < MAX_RINGS; r++) {
    const s = ringSkill(id, r), ct = r + 1 === CHAN_THAN_RING ? chanThanOf(id) : null;
    if (!s && !ct) continue;
    const open = r < v.rings.length, at = cur.indexOf(r);
    const b = document.createElement("button"); b.type = "button"; b.className = "kcard" + K("f2-nut-phu") + (at >= 0 ? " on" : "") + (open ? "" : " locked") + (ct ? " ava" : "");
    b.style.setProperty("--c", open ? ringColor(tiers[r]) : "#666");
    b.innerHTML = `<i class="ico"></i><span><b></b><small></small></span>`;
    const kart = s ? skillImg(id, r) : chanThanImg(id);
    if (kart) { b.querySelector("i")!.insertAdjacentHTML("afterbegin", kart); b.classList.add("skart"); } else b.querySelector("i")!.textContent = (s ?? ct)!.icon;
    b.querySelector("b")!.textContent = `${r + 1}. ${(s ?? ct)!.name}`;
    b.querySelector("small")!.textContent = ct ? `Võ Hồn Chân Thân · phím ${AVA_KEY}${open ? "" : ` · cần hồn hoàn thứ ${r + 1}`}`
      : `${s!.ult ? "Tuyệt kỹ · " : ""}${s!.cost} hồn lực · hồi ${cdText(skillCd(s!, r, v.stars))} giây${at >= 0 ? ` · ô ${SKILL_KEYS[at]}` : ""}${open ? "" : ` · cần hồn hoàn thứ ${r + 1}`}`;
    b.title = ct ? `${ct.name}: ${ct.desc}.` : `${s!.name}: ${s!.desc}.`;
    b.disabled = !open || !!ct || !choices.includes(r);
    b.addEventListener("click", () => {
      b.blur();
      const l = [...cur], to = skSlot ?? l.indexOf(-1);
      if (to < 0) { hint.textContent = `Đủ ${LOADOUT_SIZE} ô: chọn một ô để thay.`; return; }
      if (at === to) { skSlot = null; return again(); }
      if (at >= 0) l[at] = l[to]; // đang ở ô khác: đổi chỗ hai ô
      l[to] = r;
      send(l);
    });
    list.appendChild(b);
  }
  el.appendChild(list);
  if (v.rings.length > LOADOUT_SIZE && !HIGH_RINGS.some((n) => ringSkill(id, n - 1))) {
    const n = document.createElement("small"); n.className = "rnote";
    n.textContent = `${vohonDef(id).name} chưa có hồn kỹ vòng 5–10 (bản sau): các vòng này chỉ tăng chỉ số.`;
    el.appendChild(n);
  }
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = "Chỉ xếp ô khi không giao chiến. Hồi chiêu đi theo hồn kỹ khi đổi chỗ.";
  el.appendChild(note);
}

/** Vị trí 4 ô trên bánh xe (độ, 0 = trên, theo chiều kim đồng hồ): U trên, I phải, O dưới, P trái. */
const WHEEL_DEG = [0, 90, 180, 270];
/**
 * Bánh xe hồn kỹ (UI v2, đợt 2b-1): 4 ô tròn quanh chân dung võ hồn, thay hàng ô chữ nhật. Cùng trạng thái `skSlot` / cùng `send` như hàng cũ
 * (chọn ô rồi chọn hồn kỹ ở danh sách dưới; "Bỏ" để trống ô); Võ Hồn Chân Thân (vòng 7) là ô nhỏ cố định ở góc, chỉ để xem. Chỉ hiển thị.
 */
function renderWheel(el: HTMLElement, v: OwnedVohons["list"][number], cur: number[], tiers: number[], send: (l: number[]) => void, again: () => void) {
  const id = v.vohon, def = vohonDef(id), wheel = document.createElement("div"); wheel.className = "vh-wheel"; wheel.style.setProperty("--c", def.col);
  wheel.setAttribute("role", "group"); wheel.setAttribute("aria-label", `Bánh xe hồn kỹ của ${def.name}`);
  const pic = artUrl(`portrait_${id}`), mid = document.createElement("div"); mid.className = "vh-mid";
  mid.innerHTML = pic ? `<img src="${pic}" alt="" draggable="false">` : "<i></i>";
  wheel.appendChild(mid);
  const circle = (cls: string, key: string, art: string, icon: string, deg: number | null) => {
    const b = document.createElement("button"); b.type = "button"; b.className = `vh-slot${cls}`;
    if (deg !== null) { b.style.setProperty("--x", `${(50 + 38 * Math.sin((deg * Math.PI) / 180)).toFixed(1)}%`); b.style.setProperty("--y", `${(50 - 38 * Math.cos((deg * Math.PI) / 180)).toFixed(1)}%`); }
    b.innerHTML = `${art || `<span class="vh-ic"></span>`}<b></b>`;
    b.querySelector("b")!.textContent = key; const ic = b.querySelector(".vh-ic"); if (ic) ic.textContent = icon;
    return b;
  };
  cur.forEach((r, i) => {
    const s = r >= 0 ? ringSkill(id, r) : null, open = !!s && r < v.rings.length;
    const b = circle((skSlot === i ? " sel" : "") + (s ? " has" : " empty") + (open || !s ? "" : " locked"), SKILL_KEYS[i], s ? skillImg(id, r) : "", s ? s.name.slice(0, 1) : "+", WHEEL_DEG[i]);
    if (open) b.style.setProperty("--c", ringColor(tiers[r]));
    b.dataset.slot = String(i); b.setAttribute("aria-pressed", String(skSlot === i));
    b.setAttribute("aria-label", s ? `Ô ${SKILL_KEYS[i]}: ${s.name}, vòng ${r + 1}${s.ult ? ", tuyệt kỹ" : ""}${open ? "" : ", chưa mở"}` : `Ô ${SKILL_KEYS[i]}: trống`);
    b.title = s ? `${s.name}: ${s.desc}.` : `Ô ${SKILL_KEYS[i]}: trống, chọn để thêm`;
    b.addEventListener("click", () => { b.blur(); skSlot = skSlot === i ? null : i; again(); });
    wheel.appendChild(b);
  });
  const ct = chanThanOf(id);
  if (ct) {
    const open = v.rings.length >= CHAN_THAN_RING;
    const b = circle(" ava" + (open ? "" : " locked"), AVA_KEY, chanThanImg(id), ct.name.slice(0, 1), null); b.disabled = true;
    if (open) b.style.setProperty("--c", ringColor(tiers[CHAN_THAN_RING - 1]));
    b.setAttribute("aria-label", `${ct.name}, Võ Hồn Chân Thân, phím ${AVA_KEY}, vòng ${CHAN_THAN_RING}${open ? "" : ", chưa mở"}, cố định`);
    b.title = `${ct.name}: ${ct.desc}. Khi biến hình, ô ${SKILL_KEYS[CHAN_THAN_SKILL_SLOT]} thành ${ct.skill.name}.`;
    wheel.appendChild(b);
  }
  el.appendChild(wheel);
  // Dòng chi tiết của ô đang chọn (hoặc gợi ý), kèm nút "Bỏ" để trống ô.
  const sel = skSlot !== null && skSlot >= 0 ? skSlot : null, r = sel !== null ? cur[sel] : -1, s = r >= 0 ? ringSkill(id, r) : null;
  const info = document.createElement("div"); info.className = "vh-info";
  if (sel !== null && s) {
    info.innerHTML = `<span><b></b><small></small></span><button type="button" class="buse f2-nut-phu"></button>`;
    info.querySelector("b")!.textContent = `${SKILL_KEYS[sel]} · ${s.name}`;
    info.querySelector("small")!.textContent = `Vòng ${r + 1} · ${s.cost} hồn lực · hồi ${cdText(skillCd(s, r, v.stars))} giây${s.ult ? " · tuyệt kỹ" : ""}`;
    const rm = info.querySelector("button")!; rm.textContent = "Bỏ";
    rm.setAttribute("aria-label", `Bỏ ${s.name} khỏi ô ${SKILL_KEYS[sel]}`);
    rm.addEventListener("click", () => { rm.blur(); const l = [...cur]; l[sel] = -1; send(l); });
  } else info.innerHTML = "<small></small>", info.querySelector("small")!.textContent = sel !== null ? `Ô ${SKILL_KEYS[sel]} trống: chọn hồn kỹ bên dưới để thêm.` : "Chọn một ô trên bánh xe để xem hoặc thay hồn kỹ.";
  el.appendChild(info);
}

// ---------- Hồn cốt gắn trên võ hồn (mục 5.5, bước 4.2) ----------
let boneVh: number | null = null;     // võ hồn đang xem 6 ô hồn cốt (null = võ hồn ra trận)
let boneCell: string | null = null;    // ô (mã vị trí) đang chọn: xem hồn cốt đang gắn, lọc hồn cốt trong túi
let boneFocus: string | null = null;   // hồn cốt trong túi vừa bấm "Gắn…" ở túi đồ: tô sáng
let rosterAgain: (() => void) | null = null; // vẽ lại bảng đội hình bằng dữ liệu lần vẽ gần nhất (null = chưa vẽ lần nào)
/** Vị trí từng ô quanh hình võ hồn (grid-area trong .bfig: hàng / cột). */
const BONE_AREA: Record<string, string> = { dau: "1 / 2", tay_trai: "2 / 1", tay_phai: "2 / 3", than: "3 / 2", chan_trai: "3 / 1", chan_phai: "3 / 3" };

/** Mở bảng đội hình ở mục hồn cốt, chọn sẵn ô của hồn cốt `itemId` (nút "Gắn…" trong túi đồ). */
export function openBones(itemId: string, slot: string, rowId: number | null = null) {
  rosterTab = "bone"; boneFocus = itemId || null; boneCell = slot; boneVh = rowId; // xem võ hồn đang ra trận (hoặc võ hồn `rowId` từ bảng nhân vật)
  rosterAgain?.(); // vẽ ngay: ô chọn sẵn, món tô sáng, danh sách lọc theo vị trí (không chờ tin bag/vohons/squad kế tiếp)
  toggleRoster(true);
  requestAnimationFrame(() => document.querySelector("#roster .bfig")?.scrollIntoView({ block: "start" }));
}

/**
 * Khung 6 ô hồn cốt quanh hình võ hồn (đầu, thân, tay trái, tay phải, chân trái, chân phải). Chọn võ hồn ở danh sách thả xuống;
 * chọn một ô để xem hồn cốt đang gắn (nút Tháo) và lọc hồn cốt cùng vị trí trong túi (nút Gắn, dùng được cả chuột lẫn chạm).
 * Chuột kéo hồn cốt trong túi thả vào ô cũng gắn được (sai vị trí thì server từ chối và báo). Chỉ hiển thị; server kiểm tra
 * quyền sở hữu, vị trí, giao chiến, túi đầy.
 */
function renderBones(el: HTMLElement, data: OwnedVohons, act: RosterActions, items: BagItem[], again: () => void) {
  const head = document.createElement("b"); head.className = "shead"; head.textContent = "Hồn cốt";
  el.appendChild(head);
  if (boneVh === null || !data.list.some((v) => v.rowId === boneVh)) boneVh = data.active;
  const v = data.list.find((x) => x.rowId === boneVh) ?? data.list[0]; if (!v) return;
  const def = vohonDef(v.vohon);

  const pickRow = document.createElement("label"); pickRow.className = "bvh";
  pickRow.innerHTML = `<span>Võ hồn</span><select></select>`;
  const sel = pickRow.querySelector("select")!;
  for (const o of data.list) {
    const opt = document.createElement("option"), n = items.filter((i) => i.vohon === o.rowId && boneOf(i)).length;
    opt.value = String(o.rowId);
    opt.textContent = `${vohonDef(o.vohon).name} · cấp ${o.level}${o.rowId === data.active ? " · ra trận" : ""}${n ? ` · ${n}/${BONE_SLOTS.length} hồn cốt` : ""}`;
    opt.selected = o.rowId === v.rowId;
    sel.appendChild(opt);
  }
  sel.addEventListener("change", () => { boneVh = Number(sel.value); again(); });
  el.appendChild(pickRow);

  const worn = new Map<string, BagItem & { years: number }>();
  for (const it of items) { const b = boneOf(it); if (b && it.vohon === v.rowId) worn.set(b.slot, it as BagItem & { years: number }); }
  const loose = items.filter((i) => i.vohon === null && boneOf(i)) as (BagItem & { years: number })[];

  const fig = document.createElement("div"); fig.className = "bfig"; fig.style.setProperty("--c", def.col);
  const mid = document.createElement("div"); mid.className = "bmid"; mid.style.gridArea = "2 / 2";
  const src = act.portrait(v.vohon);
  mid.innerHTML = src ? `<img alt="" src="${src}">` : `<i class="dot"></i>`;
  const cap = document.createElement("small"); cap.textContent = def.name; mid.appendChild(cap);
  fig.appendChild(mid);
  for (const s of BONE_SLOTS) {
    const it = worn.get(s.id), b = document.createElement("button");
    b.type = "button"; b.className = "bcell" + (it ? "" : " empty") + (boneCell === s.id ? " sel" : "");
    b.dataset.slot = s.id; b.style.gridArea = BONE_AREA[s.id];
    if (it) b.style.setProperty("--c", itemColor(it));
    // Từ 4.3: tên kỹ năng hồn cốt (chủ động / bị động) hiện trong ô.
    const kb = it ? boneOf(it) : null, k = kb ? boneSkillOf(kb.beast, s.id) : null, kname = k ? (k.active ? k.sk.name : k.ps.name) : "";
    b.innerHTML = `${it ? boneIcon(s.id, itemColor(it)) : boneEmptyIcon(s.id)}<span>${s.name}</span>${it ? `<small>${yearsShort(it.years)}</small>` : ""}${it?.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}${kname ? `<em></em>` : ""}`;
    if (kname) b.querySelector("em")!.textContent = kname;
    b.setAttribute("aria-label", `Ô ${s.name}: ${it ? itemName(it) : "trống"}${kname ? `, kỹ năng ${kname}` : ""}`);
    b.setAttribute("aria-pressed", String(boneCell === s.id));
    b.title = it && kb ? `${itemName(it)} (${boneFullText(it)})\n${boneSkillText(kb.beast, s.id, it.years, it.enhance)}` : `Ô ${s.name} trống`;
    b.addEventListener("click", () => { b.blur(); boneCell = boneCell === s.id ? null : s.id; enhClose(); again(); });
    // Kéo-thả bằng chuột: thả hồn cốt trong túi vào ô, gửi kèm ô được thả để server kiểm tra đúng vị trí.
    b.addEventListener("dragover", (e) => { e.preventDefault(); b.classList.add("over"); });
    b.addEventListener("dragleave", () => b.classList.remove("over"));
    b.addEventListener("drop", (e) => {
      e.preventDefault(); b.classList.remove("over");
      const id = e.dataTransfer?.getData("text/plain"); if (id) { boneCell = s.id; boneFocus = null; act.equip(id, v.rowId, s.id); }
    });
    fig.appendChild(b);
  }
  el.appendChild(fig);

  // Chỉ số của võ hồn kèm phần hồn cốt cộng thêm (calcStats của shared/data.ts, chỉ để hiển thị; server tự tính).
  const bonus = boneBonus([...worn.entries()].map(([slot, it]) => ({ slot, years: it.years, enhance: it.enhance, subs: parseBoneSubs(it.stats) })));
  const st = calcStats(Math.max(0, vohonIndex(v.vohon)), v.level, v.rings.map(tierOfYears), v.stars, bonus,
    coreBonus(wornCores(items.filter((i) => i.vohon === v.rowId))), resMsg?.bonus, herbBonus(v.herbs)); // từ 5.2 cả hồn hạch đang gắn, từ 8.2 cộng minh, BĐ6b tiên thảo
  const hb = herbBonus(v.herbs);
  const sum = document.createElement("div"); sum.className = "bsum";
  sum.innerHTML = (["hp", "mp", "atk"] as BoneStat[]).map((k) => {
    const val = k === "hp" ? st.maxHp : k === "mp" ? st.maxMp : Math.round(st.atk), rp = resMsg?.bonus[k] ?? 0;
    const bp = bonus[`${k}_pct`]; // dòng phụ % của hồn cốt (#187)
    return `<span>${BONE_STAT_NAMES[k]}</span><b>${val.toLocaleString("vi-VN")}${bonus[k] ? `<em>+${bonus[k]} hồn cốt</em>` : ""}${bp ? `<em>+${bp.toLocaleString("vi-VN")}% hồn cốt</em>` : ""}${rp ? `<em>+${rp}% cộng minh</em>` : ""}${hb[k] ? `<em>+${hb[k]}% tiên thảo</em>` : ""}</b>`;
  }).join("") + (bonus.crit || bonus.crit_dmg ? `<span>Chí mạng</span><b>${(st.crit * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`
    + `${bonus.crit ? `<em>+${bonus.crit.toLocaleString("vi-VN")}% tỉ lệ hồn cốt</em>` : ""}${bonus.crit_dmg ? `<em>+${bonus.crit_dmg.toLocaleString("vi-VN")}% sát thương hồn cốt</em>` : ""}</b>` : ""); // dòng phụ chí mạng (#187)
  el.appendChild(sum);

  const info = document.createElement("div"); info.className = "binfo bpick";
  const cs = boneCell ? BONE_SLOTS[boneSlotIndex(boneCell)] : null, cur = cs ? worn.get(cs.id) : undefined;
  if (cur && cs) {
    const t = document.createElement("b"); t.textContent = itemName(cur); t.style.color = itemColor(cur);
    const d = document.createElement("small"); d.textContent = `Đang gắn ở ô ${cs.name} · kỹ năng ${cs.active ? `chủ động (phím ${BONE_SKILL_KEYS[BONE_ACTIVE_SLOTS.indexOf(cs.id)]} khi võ hồn này ra trận)` : "bị động khi võ hồn này ra trận"} · cường hóa ${enhText(cur)}`;
    const p = document.createElement("p"); p.textContent = `Cộng: ${boneFullText(cur)}.`;
    const kb = boneOf(cur), ks = document.createElement("p"); ks.className = "bskill"; ks.textContent = kb ? boneSkillText(kb.beast, cs.id, cur.years, cur.enhance) : "";
    info.append(t, d, p, ks);
    // Cường hóa (4.4): hồn cốt đang gắn cũng cường hóa được, chỉ số / kỹ năng đổi ngay.
    if (enhTarget === cur.id) { info.appendChild(enhancePicker(cur, items, act, again)); el.appendChild(info); return; }
    const row = document.createElement("div"); row.className = "brow";
    const off = document.createElement("button"); off.type = "button"; off.className = "buse drop"; off.textContent = "Tháo về túi";
    off.setAttribute("aria-label", `Tháo ${itemName(cur)} về túi đồ`);
    off.addEventListener("click", () => { off.blur(); act.unequip(cur.id); });
    const up = document.createElement("button"); up.type = "button"; up.className = "buse use"; up.textContent = "Cường hóa…";
    up.disabled = cur.enhance >= BONE_MAX_ENHANCE;
    up.setAttribute("aria-label", `Cường hóa ${itemName(cur)}`);
    up.addEventListener("click", () => { up.blur(); enhOpen(cur.id); again(); });
    row.append(up, off);
    info.appendChild(row);
    if (items.filter((i) => i.vohon === null).length >= bagCap) {
      const w = document.createElement("small"); w.className = "warn"; w.textContent = `Túi đồ đầy (${bagCap} ô): bỏ bớt vật phẩm rồi mới tháo được.`;
      info.appendChild(w);
    }
  }
  // Hồn cốt trong túi: lọc theo ô đang chọn (không chọn ô thì mọi vị trí), cùng vị trí thì niên hạn cao trước.
  const list = loose.filter((i) => !cs || boneOf(i)!.slot === cs.id)
    .sort((a, b) => boneSlotIndex(boneOf(a)!.slot) - boneSlotIndex(boneOf(b)!.slot) || b.years - a.years);
  const lh = document.createElement("small");
  lh.textContent = list.length
    ? `Hồn cốt${cs ? ` ${cs.name}` : ""} trong túi: bấm "Gắn" (hoặc kéo thả vào ô) để gắn vào ${def.name}${cur ? ", món đang gắn về túi" : ""}.`
    : `Túi không có hồn cốt${cs ? ` ${cs.name}` : ""} nào. Hạ hồn thú từ 1.000 năm để có hồn cốt.`;
  info.appendChild(lh);
  for (const it of list) {
    const b = boneOf(it)!, s = BONE_SLOTS[boneSlotIndex(b.slot)];
    const row = document.createElement("div"); row.className = "bitem" + (it.id === boneFocus ? " sel" : "");
    row.draggable = true; row.style.setProperty("--c", itemColor(it));
    row.innerHTML = `${boneIcon(b.slot, itemColor(it))}<span><b></b><small></small></span><button type="button" class="sbtn">Gắn</button>`;
    row.querySelector("b")!.textContent = itemName(it);
    const kn = boneSkillOf(b.beast, b.slot);
    const ns = parseBoneSubs(it.stats).length;
    row.querySelector("small")!.textContent = `${s.name} · ${boneStatText(b.slot, it.years, it.enhance)}${ns ? ` · ${ns} dòng phụ` : ""}${kn ? ` · ${kn.active ? kn.sk.name : kn.ps.name}` : ""}`;
    row.title = `${boneFullText(it)}\n${boneSkillText(b.beast, b.slot, it.years, it.enhance)}`;
    const go = row.querySelector("button")!;
    go.setAttribute("aria-label", `Gắn ${itemName(it)} vào ô ${s.name} của ${def.name}`);
    go.addEventListener("click", () => { go.blur(); boneCell = b.slot; boneFocus = null; act.equip(it.id, v.rowId); });
    row.addEventListener("dragstart", (e) => { e.dataTransfer?.setData("text/plain", it.id); if (e.dataTransfer) e.dataTransfer.effectAllowed = "move"; });
    info.appendChild(row);
  }
  el.appendChild(info);
  if (act.combat()) {
    const w = document.createElement("small"); w.className = "rnote warn";
    w.textContent = "Đang giao chiến: rời xa hồn thú vài giây rồi mới gắn / tháo hồn cốt được.";
    el.appendChild(w);
  }
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Mỗi võ hồn ${BONE_SLOTS.length} ô hồn cốt; hồn cốt chỉ gắn vào ô cùng vị trí và cộng chỉ số gốc cho võ hồn đó. Gắn / tháo khi không giao chiến; tháo ra vẫn giữ cường hóa; thua không bao giờ mất hồn cốt.`;
  el.appendChild(note);
}

// ---------- Hồn hạch gắn trên võ hồn (mục 5.6, bước 5.2) ----------
let coreCell: number | null = null;   // ô hồn hạch đang chọn (0..CORE_SLOTS − 1): xem món đang gắn, "Gắn" vào đúng ô này
let coreFocus: string | null = null;  // hồn hạch trong túi vừa bấm "Gắn…" ở túi đồ: tô sáng

/** Mở bảng đội hình ở mục hồn hạch của võ hồn ra trận, tô sáng hồn hạch `itemId` (nút "Gắn…" trong túi đồ). */
export function openCores(itemId: string, rowId: number | null = null, slot: number | null = null) {
  rosterTab = "core"; coreFocus = itemId || null; coreCell = slot; boneVh = rowId; // võ hồn đang ra trận (dùng chung lựa chọn với mục hồn cốt)
  rosterAgain?.();
  toggleRoster(true);
  requestAnimationFrame(() => document.querySelector("#roster .cfig")?.scrollIntoView({ block: "start" }));
}
/** Hồn hạch (sao, dữ liệu) trong danh sách món, để tính coreBonus / coreSetCounts như server (chỉ hiển thị). */
export const wornCores = (list: BagItem[]) => list.flatMap((it) => { const c = coreOf(it); return c ? [{ stars: it.stars ?? 1, data: c, enhance: it.enhance }] : []; });
/** Dòng chỉ số của một hồn hạch: chỉ số chính (theo sao và cấp nâng cấp) rồi các dòng phụ. */
export const coreLines = (it: BagItem) => {
  const c = coreOf(it); if (!c) return [];
  return [`Chính: ${coreStatText(c.main, coreMainValue(c.main, it.stars ?? 1, it.enhance))}`, ...c.subs.map(([k, x]) => `Phụ: ${coreStatText(k, x)}`)];
};

/**
 * Khung 6 ô hồn hạch của võ hồn đang chọn ở mục hồn cốt (cùng danh sách thả xuống), ô nào cũng nhận mọi hồn hạch. Chọn một ô để
 * xem món đang gắn (nút Tháo) và gắn món trong túi vào đúng ô đó (nút Gắn; không chọn ô thì vào ô trống đầu tiên); chuột kéo hồn
 * hạch trong túi thả vào ô cũng gắn, kéo giữa hai ô thì đổi chỗ. Dưới là các bộ đang có (2 / 4 món kích hoạt, mô tả hiệu ứng) và
 * chỉ số hồn hạch cộng thêm. Chỉ hiển thị; server kiểm tra quyền sở hữu, giao chiến, túi đầy.
 */
function renderCores(el: HTMLElement, data: OwnedVohons, act: RosterActions, items: BagItem[], again: () => void) {
  const v = data.list.find((x) => x.rowId === boneVh) ?? data.list[0]; if (!v) return;
  const def = vohonDef(v.vohon);
  const head = document.createElement("b"); head.className = "shead"; head.textContent = `Hồn hạch · ${def.name}`;
  el.appendChild(head);
  const mine = items.filter((i) => i.vohon === v.rowId && coreOf(i)), bySlot = new Map<number, BagItem>();
  for (const it of mine) { const s = coreSlotOf(it.stats); if (s >= 0) bySlot.set(s, it); }
  if (coreCell !== null && coreCell >= CORE_SLOTS) coreCell = null;

  const fig = document.createElement("div"); fig.className = "cfig"; fig.style.setProperty("--c", def.col);
  for (let s = 0; s < CORE_SLOTS; s++) {
    const it = bySlot.get(s), c = it ? coreOf(it) : null, cs = c ? coreSet(c.set) : undefined, b = document.createElement("button");
    b.type = "button"; b.className = "bcell ccell" + (it ? "" : " empty") + (coreCell === s ? " sel" : "");
    if (it) b.style.setProperty("--c", itemColor(it));
    b.innerHTML = `${coreIcon(c?.set ?? "")}<span>Ô ${s + 1}</span>${it ? `<small>${it.stars ?? 1}★</small><em></em>` : ""}${it?.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}`;
    if (it) b.querySelector("em")!.textContent = cs?.name ?? "Bộ lạ";
    b.setAttribute("aria-label", `Ô hồn hạch ${s + 1}: ${it ? itemName(it) : "trống"}`);
    b.setAttribute("aria-pressed", String(coreCell === s));
    b.title = it ? `${itemName(it)}\n${coreLines(it).join("\n")}` : `Ô ${s + 1} trống: gắn được mọi hồn hạch`;
    b.addEventListener("click", () => { b.blur(); coreCell = coreCell === s ? null : s; again(); });
    // Chuột: kéo hồn hạch trong túi (hoặc ô khác của võ hồn này) thả vào ô; server đổi chỗ khi ô đã có.
    if (it) {
      b.draggable = true;
      b.addEventListener("dragstart", (e) => { e.dataTransfer?.setData("text/plain", it.id); if (e.dataTransfer) e.dataTransfer.effectAllowed = "move"; });
    }
    b.addEventListener("dragover", (e) => { e.preventDefault(); b.classList.add("over"); });
    b.addEventListener("dragleave", () => b.classList.remove("over"));
    b.addEventListener("drop", (e) => {
      e.preventDefault(); b.classList.remove("over");
      const id = e.dataTransfer?.getData("text/plain"); if (id) { coreCell = s; coreFocus = null; act.equipCore(id, v.rowId, s); }
    });
    fig.appendChild(b);
  }
  el.appendChild(fig);

  // Bộ đang có trên võ hồn này: đủ 2 món thì hiệu ứng 2 món sáng, đủ 4 món thêm hiệu ứng 4 món (cùng số với server: coreSetCounts).
  const counts = coreSetCounts(wornCores(mine)), sets = document.createElement("div"); sets.className = "csets";
  if (!counts.size) {
    const s = document.createElement("small");
    s.textContent = `Chưa gắn hồn hạch. ${CORE_SET_2} món cùng bộ nhận hiệu ứng 2 món, ${CORE_SET_4} món nhận thêm hiệu ứng 4 món.`;
    sets.appendChild(s);
  }
  for (const [set, n] of [...counts].sort((a, b) => b[1] - a[1] || coreSetIndex(a[0]) - coreSetIndex(b[0]))) {
    const cs = coreSet(set), row = document.createElement("div");
    row.className = "cset" + (n >= CORE_SET_2 ? " on" : "");
    if (cs) row.style.setProperty("--c", cs.col);
    row.innerHTML = `${coreIcon(set)}<span><b></b><small></small><small></small></span>`;
    row.querySelector("b")!.textContent = `${cs ? `${cs.name} (${cs.tag})` : "Bộ lạ"} · ${n} món`;
    const [s2, s4] = row.querySelectorAll("small");
    s2.textContent = `${n >= CORE_SET_2 ? "√" : `${n}/${CORE_SET_2}`} 2 món: ${cs?.set2 ?? "không rõ"}`; s2.classList.toggle("on", n >= CORE_SET_2);
    s4.textContent = `${n >= CORE_SET_4 ? "√" : `${n}/${CORE_SET_4}`} 4 món: ${cs?.set4 ?? "không rõ"}`; s4.classList.toggle("on", n >= CORE_SET_4);
    row.setAttribute("aria-label", `Bộ ${cs?.name ?? "lạ"}: ${n} món${n >= CORE_SET_4 ? ", kích hoạt 2 và 4 món" : n >= CORE_SET_2 ? ", kích hoạt 2 món" : ", chưa kích hoạt"}`);
    sets.appendChild(row);
  }
  el.appendChild(sets);

  // Chỉ số hồn hạch cộng thêm (kèm +công / +chí mạng của bộ) và chí mạng sau khi cộng (calcStats, chỉ để hiển thị).
  const bonus = coreBonus(wornCores(mine)), st = calcStats(Math.max(0, vohonIndex(v.vohon)), v.level, v.rings.map(tierOfYears), v.stars, {}, bonus);
  const add = CORE_STAT_IDS.filter((k) => bonus[k] > 0).map((k) => coreStatText(k, bonus[k]));
  const sum = document.createElement("small"); sum.className = "rnote csum";
  const pctTxt = (x: number) => `${(x * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
  sum.textContent = `Hồn hạch cộng: ${add.length ? add.join(", ") : "chưa có"}. ${CORE_STATS.crit.name} ${pctTxt(st.crit)}, ${CORE_STATS.crit_dmg.name.toLowerCase()} ${pctTxt(st.critMult)}.`;
  el.appendChild(sum);

  const info = document.createElement("div"); info.className = "binfo bpick";
  const cur = coreCell !== null ? bySlot.get(coreCell) : undefined;
  if (cur && coreCell !== null) {
    const c = coreOf(cur)!, cs = coreSet(c.set);
    const t = document.createElement("b"); t.textContent = itemName(cur); t.style.color = itemColor(cur);
    const d = document.createElement("small"); d.textContent = `Đang gắn ở ô ${coreCell + 1} · bộ ${cs ? `${cs.name} (${cs.tag})` : "lạ"} · nâng cấp ${coreEnhText(cur)}`;
    const p = document.createElement("p"); p.textContent = coreLines(cur).join(" · ");
    info.append(t, d, p);
    // Nâng cấp (5.3): hồn hạch đang gắn cũng nâng cấp được, chỉ số đổi ngay.
    if (enhTarget === cur.id) { info.appendChild(corePicker(cur, items, act, again)); el.appendChild(info); return; }
    const row = document.createElement("div"); row.className = "brow";
    const off = document.createElement("button"); off.type = "button"; off.className = "buse drop"; off.textContent = "Tháo về túi";
    off.setAttribute("aria-label", `Tháo ${itemName(cur)} về túi đồ`);
    off.addEventListener("click", () => { off.blur(); act.unequipCore(cur.id); });
    const up = document.createElement("button"); up.type = "button"; up.className = "buse use"; up.textContent = "Nâng cấp…";
    up.disabled = cur.enhance >= CORE_MAX_ENHANCE;
    up.setAttribute("aria-label", `Nâng cấp ${itemName(cur)}`);
    up.addEventListener("click", () => { up.blur(); enhOpen(cur.id); again(); });
    row.append(up, off);
    info.appendChild(row);
    if (items.filter((i) => i.vohon === null).length >= bagCap) {
      const w = document.createElement("small"); w.className = "warn"; w.textContent = `Túi đồ đầy (${bagCap} ô): bỏ bớt vật phẩm rồi mới tháo được.`;
      info.appendChild(w);
    }
  }
  // Hồn hạch trong túi: bộ đang có trên võ hồn này trước (để ghép đủ bộ), rồi theo thứ tự bộ, sao cao trước.
  const list = items.filter((i) => i.vohon === null && coreOf(i)).sort((a, b) => {
    const ca = coreOf(a)!, cb = coreOf(b)!;
    return (counts.get(cb.set) ?? 0) - (counts.get(ca.set) ?? 0) || coreSetIndex(ca.set) - coreSetIndex(cb.set) || (b.stars ?? 1) - (a.stars ?? 1);
  });
  const where = coreCell !== null ? `ô ${coreCell + 1}` : "ô trống đầu tiên";
  const lh = document.createElement("small");
  lh.textContent = list.length
    ? `Hồn hạch trong túi: bấm "Gắn" (hoặc kéo thả vào ô) để gắn vào ${where} của ${def.name}${cur ? ", món đang gắn về túi" : ""}.`
    : "Túi không có hồn hạch nào. Hạ hồn thú để có hồn hạch (sao theo niên hạn, bộ theo bản đồ).";
  info.appendChild(lh);
  for (const it of list) {
    const c = coreOf(it)!, row = document.createElement("div");
    row.className = "bitem" + (it.id === coreFocus ? " sel" : "");
    row.draggable = true; row.style.setProperty("--c", itemColor(it));
    row.innerHTML = `${coreIcon(c.set)}<span><b></b><small></small></span><button type="button" class="sbtn">Gắn</button>`;
    row.querySelector("b")!.textContent = itemName(it);
    row.querySelector("small")!.textContent = `${coreStatText(c.main, coreMainValue(c.main, it.stars ?? 1, it.enhance))} · ${c.subs.length} dòng phụ`;
    row.title = coreLines(it).join("\n");
    const go = row.querySelector("button")!;
    go.setAttribute("aria-label", `Gắn ${itemName(it)} vào ${where} của ${def.name}`);
    go.addEventListener("click", () => { go.blur(); coreFocus = null; act.equipCore(it.id, v.rowId, coreCell ?? undefined); });
    row.addEventListener("dragstart", (e) => { e.dataTransfer?.setData("text/plain", it.id); if (e.dataTransfer) e.dataTransfer.effectAllowed = "move"; });
    info.appendChild(row);
  }
  el.appendChild(info);
  if (act.combat()) {
    const w = document.createElement("small"); w.className = "rnote warn";
    w.textContent = "Đang giao chiến: rời xa hồn thú vài giây rồi mới gắn / tháo hồn hạch được.";
    el.appendChild(w);
  }
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Mỗi võ hồn ${CORE_SLOTS} ô hồn hạch, ô nào cũng gắn được mọi bộ; ghép 4 + 2 hoặc 2 + 2 + 2. Chỉ số cộng cho võ hồn đó; hiệu ứng bộ có tác dụng khi võ hồn này ra trận (Tiên Cơ 2 món: tích năng lượng khi ở ngoài). Gắn / tháo khi không giao chiến; thua không bao giờ mất hồn hạch.`;
  el.appendChild(note);
}

// ---------- Cường hóa hồn cốt (mục 5.5, bước 4.4) ----------
export let enhTarget: string | null = null;  // hồn cốt đang mở bảng cường hóa (trong túi hoặc đang gắn)
const enhMats = new Set<string>();    // nguyên liệu đang chọn (id ô trong túi)
let enhJump = false;                 // vừa mở bảng: cuộn tới bảng một lần (chọn nguyên liệu thì không cuộn)
export let enhCoin = 0;                     // Hồn Tệ đang có (tin "bag" gần nhất): bảng cường hóa / nâng cấp so với phí (#281)
export const setEnhCoin = (n: number) => { enhCoin = n; };
export function enhOpen(id: string) { enhTarget = id; enhMats.clear(); enhJump = true; }
export function enhClose() { enhTarget = null; enhMats.clear(); }
const num = (n: number) => n.toLocaleString("vi-VN");
/** Điểm cường hóa tới cấp kế tiếp: "25 / 45 điểm tới +2"; ở +20 thì "tối đa". */
function enhProgress(xp: number, level: number) {
  if (level >= BONE_MAX_ENHANCE) return `+${BONE_MAX_ENHANCE} (tối đa)`;
  return `${num(xp)} / ${num(boneEnhanceNeed(level + 1))} điểm tới +${level + 1}`;
}
/** Cấp cường hóa kèm tiến độ: "+1 (25 / 45 điểm tới +2)". */
export const enhText = (it: BagItem) => (it.enhance >= BONE_MAX_ENHANCE ? `+${BONE_MAX_ENHANCE} (tối đa)` : `+${it.enhance} (${enhProgress(boneXp(it.stats), it.enhance)})`);
/** Bảng phí theo cấp cho dòng ghi chú (#281): "+1…+5 miễn phí, +6…+10 10 ngân mỗi cấp, …". */
function feeBands(table: readonly number[]) {
  const out: string[] = [];
  for (let i = 0; i < table.length;) {
    let j = i; while (j + 1 < table.length && table[j + 1] === table[i]) j++;
    out.push(`+${i + 1}${j > i ? `…+${j + 1}` : ""} ${table[i] ? `${formatHonTe(table[i])} mỗi cấp` : "miễn phí"}`);
    i = j + 1;
  }
  return out.join(", ");
}
/**
 * Phí của lần cường hóa / nâng cấp đang xem trước (#281, enhanceFee như server): chữ ghép cạnh cấp sẽ đạt, chữ cho nút xác nhận,
 * và lý do khi không đủ Hồn Tệ ("" nếu đủ; nút bị khóa). Server vẫn kiểm lại.
 */
function feeView(table: readonly number[], from: number, to: number) {
  const fee = enhanceFee(table, from, to);
  return { fee, head: to > from ? ` · Phí: ${fee ? formatHonTe(fee) : "miễn phí"}` : "", btn: fee ? `, phí ${formatHonTe(fee)}` : "",
    poor: fee > enhCoin ? `Không đủ Hồn Tệ: cần ${formatHonTe(fee)}, đang có ${formatHonTe(enhCoin)}.` : "" };
}

/**
 * Bảng cường hóa hồn cốt `target` (mục 5.5): chọn nhiều hồn cốt trong túi làm nguyên liệu (chạm / bấm để chọn, cùng vị trí được
 * thêm 50%), xem trước điểm, cấp, chỉ số chính, mốc nâng kỹ năng và dòng phụ sẽ thêm (#187) (boneEnhancePreview của shared/data.ts, chỉ để hiển
 * thị), rồi xác nhận vì nguyên liệu mất hẳn. Server kiểm tra và tính lại. Mở từ NPC Thợ rèn ở Nặc Đinh Thành (6.1, renderForge),
 * và vẫn mở được bằng nút "Cường hóa…" ở túi đồ và bảng hồn cốt (chờ chốt: có giới hạn ở lò rèn không, mục 8).
 */
export function enhancePicker(target: BagItem & { years: number }, items: BagItem[], act: { enhance(t: string, m: string[]): void; combat(): boolean }, again: () => void) {
  const tb = boneOf(target)!, xp0 = boneXp(target.stats), lv0 = target.enhance;
  const box = document.createElement("div"); box.className = "apick epick";
  const loose = items.filter((i) => i.vohon === null && !i.lock && i.id !== target.id && boneOf(i)) as (BagItem & { years: number })[];
  for (const id of [...enhMats]) if (!loose.some((i) => i.id === id)) enhMats.delete(id); // nguyên liệu đã mất / đã gắn
  const matOf = (i: BagItem & { years: number }) => ({ slot: boneOf(i)!.slot, years: i.years, xp: boneXp(i.stats) });
  const head = document.createElement("small");
  head.innerHTML = `<b></b> · <span></span><i class="sbar"><i></i></i>`;
  head.querySelector("b")!.textContent = `Cường hóa ${itemName(target)}`;
  head.querySelector("span")!.textContent = enhProgress(xp0, lv0);
  const lo = boneEnhanceNeed(lv0), hi = boneEnhanceNeed(lv0 + 1);
  (head.querySelector(".sbar i") as HTMLElement).style.width = (lv0 >= BONE_MAX_ENHANCE ? 1 : (xp0 - lo) / Math.max(1, hi - lo)) * 100 + "%";
  head.style.setProperty("--c", itemColor(target));
  box.appendChild(head);
  // Dòng phụ (#187): các dòng đã có và mốc kế tiếp; dòng mới do server tung trong bộ của vị trí (BONE_SUB_POOL).
  const subs0 = parseBoneSubs(target.stats), main0 = BONE_SLOTS[boneSlotIndex(tb.slot)]?.stat;
  const pool = BONE_SUB_POOL[tb.slot].filter((k) => k !== main0 && !subs0.some(([x]) => x === k)), next0 = BONE_ENHANCE_MILESTONES.find((x) => x > lv0);
  const sl = document.createElement("small");
  sl.textContent = `Dòng phụ ${subs0.length}/${BONE_MAX_SUBS}${subs0.length ? `: ${subs0.map(([k, v]) => coreStatText(k, v)).join(", ")}` : ""}.`
    + (next0 ? ` Mốc kế tiếp +${next0}: nâng kỹ năng và 1 dòng phụ ngẫu nhiên${pool.length ? ` (${pool.map(subName).join(" / ")})` : ""}.` : "");
  box.appendChild(sl);
  const row = document.createElement("div"); row.className = "brow";
  const btn = (text: string, cls: string, fn: () => void) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "buse " + cls; b.textContent = text;
    b.addEventListener("click", () => { b.blur(); fn(); }); row.appendChild(b); return b;
  };
  if (lv0 < BONE_MAX_ENHANCE) {
    const hint = document.createElement("small");
    hint.textContent = loose.length
      ? `Chọn hồn cốt trong túi làm nguyên liệu (tối đa ${BONE_FEED_MAX}): niên hạn càng cao càng nhiều điểm, cùng vị trí ${tb.slot ? BONE_SLOTS[boneSlotIndex(tb.slot)].name : ""} được thêm ${Math.round((BONE_FEED_SAME_SLOT - 1) * 100)}%.`
      : "Túi không có hồn cốt nào khác để làm nguyên liệu (hồn cốt đang gắn phải tháo ra trước).";
    box.appendChild(hint);
    // Cùng vị trí trước, rồi niên hạn cao trước.
    const list = [...loose].sort((a, b) => Number(boneOf(b)!.slot === tb.slot) - Number(boneOf(a)!.slot === tb.slot) || b.years - a.years);
    for (const m of list) {
      const mb = boneOf(m)!, on = enhMats.has(m.id), same = mb.slot === tb.slot, pts = boneFeedXp(matOf(m), tb.slot);
      const o = document.createElement("button"); o.type = "button"; o.className = "aopt eopt" + (on ? " sel" : "");
      o.disabled = !on && enhMats.size >= BONE_FEED_MAX;
      o.setAttribute("aria-pressed", String(on));
      o.style.setProperty("--c", itemColor(m));
      o.innerHTML = `<b></b><i></i><span></span>`;
      o.querySelector("b")!.textContent = `${on ? "☑" : "☐"} ${itemName(m)}`;
      o.querySelector("i")!.textContent = `+${num(pts)} điểm`;
      o.querySelector("span")!.textContent = `${BONE_SLOTS[boneSlotIndex(mb.slot)].name}${same ? ` · cùng vị trí +${Math.round((BONE_FEED_SAME_SLOT - 1) * 100)}%` : ""}${m.enhance ? ` · đã cường hóa +${m.enhance}, trả lại một phần điểm` : ""}`;
      o.setAttribute("aria-label", `${on ? "Bỏ chọn" : "Chọn"} nguyên liệu ${itemName(m)}, ${pts} điểm`);
      o.addEventListener("click", () => { o.blur(); if (on) enhMats.delete(m.id); else enhMats.add(m.id); again(); });
      box.appendChild(o);
    }
    const mats = list.filter((i) => enhMats.has(i.id));
    if (mats.length) {
      const r = boneEnhancePreview({ slot: tb.slot, xp: xp0 }, mats.map(matOf));
      const c = document.createElement("div"); c.className = "aconf risk";
      c.innerHTML = `<b></b><small></small><small></small><small class="warn"></small><small class="poor"></small>`;
      const sm = c.querySelectorAll("small"), fv = feeView(BONE_ENHANCE_FEE, r.from, r.level);
      c.querySelector("b")!.textContent = `+${lv0} → +${r.level}${r.level > lv0 ? "" : " (chưa lên cấp)"} · ${boneStatText(tb.slot, target.years, lv0)} → ${boneStatText(tb.slot, target.years, r.level)}${fv.head}`;
      sm[3].textContent = fv.poor;
      sm[0].textContent = `+${num(r.gain)} điểm từ ${mats.length} nguyên liệu · ${enhProgress(r.xp, r.level)}`
        + (r.waste ? ` · dư ${num(r.waste)} điểm bị bỏ (đã tối đa)` : "");
      const reach = BONE_ENHANCE_MILESTONES.filter((x) => x > lv0 && x <= r.level);
      const adds = Math.max(0, boneSubsDue(r.level) - subs0.length), next = BONE_ENHANCE_MILESTONES.find((x) => x > r.level);
      const addTxt = adds ? `thêm ${adds} dòng phụ ngẫu nhiên (${subs0.length + adds}/${BONE_MAX_SUBS} dòng)` : "";
      sm[1].textContent = reach.length
        ? `Đạt mốc ${reach.map((x) => `+${x}`).join(", ")}: kỹ năng hồn cốt mạnh ×${pow2(boneSkillMult(r.level))} (trước ×${pow2(boneSkillMult(lv0))})${addTxt ? ` và ${addTxt}` : ""}.`
        : `Mốc kế tiếp ${next ? `+${next}` : "đã đủ"}: mỗi mốc nâng kỹ năng và 1 dòng phụ ngẫu nhiên (đang ×${pow2(boneSkillMult(r.level))}, ${boneMilestones(r.level)}/${BONE_ENHANCE_MILESTONES.length} mốc, ${subs0.length}/${BONE_MAX_SUBS} dòng phụ).`
          + (addTxt ? ` Bù dòng còn thiếu: ${addTxt}.` : "");
      const rare = mats.filter((i) => i.enhance > 0 || tierOfYears(i.years) >= 3).length;
      sm[2].textContent = `⚠ ${mats.length} hồn cốt nguyên liệu sẽ bị tiêu hao (mất hẳn)${rare ? `, trong đó ${rare} món đã cường hóa hoặc từ 10.000 năm` : ""}. Cường hóa không bao giờ thất bại.`
        + (act.combat() ? " Đang giao chiến: rời xa hồn thú vài giây rồi mới cường hóa được." : "");
      box.appendChild(c);
      btn(`Xác nhận: dùng ${mats.length} hồn cốt${fv.btn}`, "eok", () => { act.enhance(target.id, mats.map((i) => i.id)); enhMats.clear(); }).disabled = !!fv.poor;
      btn("Bỏ chọn hết", "drop", () => { enhMats.clear(); again(); });
    }
  } else {
    const n = document.createElement("small"); n.textContent = `Đã cường hóa tối đa +${BONE_MAX_ENHANCE}.`; box.appendChild(n);
  }
  btn("Đóng", "drop", () => { enhClose(); again(); });
  box.appendChild(row);
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Cấp +0 đến +${BONE_MAX_ENHANCE}: mỗi cấp tăng chỉ số chính; mốc ${BONE_ENHANCE_MILESTONES.map((x) => `+${x}`).join(", ")} nâng kỹ năng hồn cốt và thêm 1 dòng phụ ngẫu nhiên theo vị trí (tối đa ${BONE_MAX_SUBS} dòng). Tháo ra vẫn giữ cấp và dòng phụ. Phí Hồn Tệ mỗi cấp vượt qua: ${feeBands(BONE_ENHANCE_FEE)}. Thợ rèn ở Nặc Đinh Thành và Thiên Đấu Thành cũng mở bảng này.`;
  box.appendChild(note);
  if (enhJump) { enhJump = false; requestAnimationFrame(() => head.scrollIntoView({ block: "nearest" })); }
  return box;
}

// ---------- Nâng cấp hồn hạch (mục 5.6, bước 5.3) ----------
/** Điểm nâng cấp tới cấp kế tiếp: "40 / 50 điểm tới +2"; ở +15 thì "tối đa". */
function coreProgress(xp: number, level: number) {
  if (level >= CORE_MAX_ENHANCE) return `+${CORE_MAX_ENHANCE} (tối đa)`;
  return `${num(xp)} / ${num(coreEnhanceNeed(level + 1))} điểm tới +${level + 1}`;
}
/** Cấp nâng cấp kèm tiến độ: "+1 (40 / 50 điểm tới +2)". */
export const coreEnhText = (it: BagItem) => (it.enhance >= CORE_MAX_ENHANCE ? `+${CORE_MAX_ENHANCE} (tối đa)` : `+${it.enhance} (${coreProgress(coreXp(it.stats), it.enhance)})`);
/** Mốc tăng dòng phụ: +3, +6, +9, +12, +15. */
const CORE_SUB_MARKS = Array.from({ length: Math.floor(CORE_MAX_ENHANCE / CORE_SUB_EVERY) }, (_, i) => (i + 1) * CORE_SUB_EVERY);

/**
 * Bảng nâng cấp hồn hạch `target` (mục 5.6): chọn nhiều hồn hạch trong túi làm nguyên liệu (chạm / bấm để chọn; sao càng cao càng
 * nhiều điểm, cùng bộ được thêm), xem trước điểm, cấp, chỉ số chính và số lần tăng dòng phụ sẽ đạt (coreEnhancePreview của
 * shared/data.ts, chỉ để hiển thị; dòng phụ nào tăng do server tung), rồi xác nhận vì nguyên liệu mất hẳn. Server kiểm tra và tính
 * lại. Mở từ NPC Thợ rèn ở Nặc Đinh Thành (6.1, renderForgeCores), hoặc nút "Nâng cấp…" ở túi đồ và mục hồn hạch.
 */
export function corePicker(target: BagItem, items: BagItem[], act: { enhanceCore(t: string, m: string[]): void; combat(): boolean }, again: () => void) {
  const tc = coreOf(target)!, xp0 = coreXp(target.stats), lv0 = target.enhance, stars = target.stars ?? 1, cs = coreSet(tc.set);
  const box = document.createElement("div"); box.className = "apick epick";
  const loose = items.filter((i) => i.vohon === null && !i.lock && i.id !== target.id && coreOf(i));
  for (const id of [...enhMats]) if (!loose.some((i) => i.id === id)) enhMats.delete(id); // nguyên liệu đã mất / đã gắn
  const matOf = (i: BagItem) => ({ set: coreOf(i)!.set, stars: i.stars ?? 1, xp: coreXp(i.stats) });
  const mainAt = (lv: number) => coreStatText(tc.main, coreMainValue(tc.main, stars, lv));
  const head = document.createElement("small");
  head.innerHTML = `<b></b> · <span></span><i class="sbar"><i></i></i>`;
  head.querySelector("b")!.textContent = `Nâng cấp ${itemName(target)}`;
  head.querySelector("span")!.textContent = coreProgress(xp0, lv0);
  const lo = coreEnhanceNeed(lv0), hi = coreEnhanceNeed(lv0 + 1);
  (head.querySelector(".sbar i") as HTMLElement).style.width = (lv0 >= CORE_MAX_ENHANCE ? 1 : (xp0 - lo) / Math.max(1, hi - lo)) * 100 + "%";
  head.style.setProperty("--c", itemColor(target));
  box.appendChild(head);
  const row = document.createElement("div"); row.className = "brow";
  const btn = (text: string, cls: string, fn: () => void) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "buse " + cls; b.textContent = text;
    b.addEventListener("click", () => { b.blur(); fn(); }); row.appendChild(b); return b;
  };
  const sameTxt = `cùng bộ +${Math.round((CORE_FEED_SAME_SET - 1) * 100)}%`;
  if (lv0 < CORE_MAX_ENHANCE) {
    const hint = document.createElement("small");
    hint.textContent = loose.length
      ? `Chọn hồn hạch trong túi làm nguyên liệu (tối đa ${CORE_FEED_MAX}): sao càng cao càng nhiều điểm, ${sameTxt.replace("cùng bộ", `cùng bộ ${cs?.name ?? ""}`)}.`
      : "Túi không có hồn hạch nào khác để làm nguyên liệu (hồn hạch đang gắn phải tháo ra trước).";
    box.appendChild(hint);
    // Cùng bộ trước, rồi sao cao trước.
    const list = [...loose].sort((a, b) => Number(coreOf(b)!.set === tc.set) - Number(coreOf(a)!.set === tc.set) || (b.stars ?? 1) - (a.stars ?? 1));
    for (const m of list) {
      const mc = coreOf(m)!, on = enhMats.has(m.id), same = mc.set === tc.set, pts = coreFeedXp(matOf(m), tc.set);
      const o = document.createElement("button"); o.type = "button"; o.className = "aopt eopt" + (on ? " sel" : "");
      o.disabled = !on && enhMats.size >= CORE_FEED_MAX;
      o.setAttribute("aria-pressed", String(on));
      o.style.setProperty("--c", itemColor(m));
      o.innerHTML = `<b></b><i></i><span></span>`;
      o.querySelector("b")!.textContent = `${on ? "☑" : "☐"} ${itemName(m)}`;
      o.querySelector("i")!.textContent = `+${num(pts)} điểm`;
      o.querySelector("span")!.textContent = `${coreStatText(mc.main, coreMainValue(mc.main, m.stars ?? 1, m.enhance))} · ${mc.subs.length} dòng phụ${same ? ` · ${sameTxt}` : ""}${m.enhance ? ` · đã nâng cấp +${m.enhance}, trả lại một phần điểm` : ""}`;
      o.setAttribute("aria-label", `${on ? "Bỏ chọn" : "Chọn"} nguyên liệu ${itemName(m)}, ${pts} điểm`);
      o.addEventListener("click", () => { o.blur(); if (on) enhMats.delete(m.id); else enhMats.add(m.id); again(); });
      box.appendChild(o);
    }
    const mats = list.filter((i) => enhMats.has(i.id));
    if (mats.length) {
      const r = coreEnhancePreview({ set: tc.set, xp: xp0, subs: tc.subs.length }, mats.map(matOf));
      const c = document.createElement("div"); c.className = "aconf risk";
      c.innerHTML = `<b></b><small></small><small></small><small class="warn"></small><small class="poor"></small>`;
      const sm = c.querySelectorAll("small"), fv = feeView(CORE_ENHANCE_FEE, r.from, r.level);
      c.querySelector("b")!.textContent = `+${lv0} → +${r.level}${r.level > lv0 ? "" : " (chưa lên cấp)"} · Chính: ${mainAt(lv0)} → ${mainAt(r.level)}${fv.head}`;
      sm[3].textContent = fv.poor;
      sm[0].textContent = `+${num(r.gain)} điểm từ ${mats.length} nguyên liệu · ${coreProgress(r.xp, r.level)}`
        + (r.waste ? ` · dư ${num(r.waste)} điểm bị bỏ (đã tối đa)` : "");
      const reach = CORE_SUB_MARKS.filter((x) => x > lv0 && x <= r.level), next = CORE_SUB_MARKS.find((x) => x > r.level);
      sm[1].textContent = r.rolls
        ? `Đạt mốc ${reach.map((x) => `+${x}`).join(", ")}: ${r.adds ? `thêm ${r.adds} dòng phụ mới ngẫu nhiên` : ""}${r.adds && r.rolls > r.adds ? ", " : ""}${r.rolls > r.adds ? `tăng ${r.rolls - r.adds} lần một dòng phụ có sẵn ngẫu nhiên` : ""}.`
        : `Mốc kế tiếp ${next ? `+${next}` : "đã đủ"}: mỗi ${CORE_SUB_EVERY} cấp tăng 1 dòng phụ ngẫu nhiên (đang có ${tc.subs.length}/${CORE_MAX_SUBS} dòng).`;
      const rare = mats.filter((i) => i.enhance > 0 || (i.stars ?? 1) >= 4).length;
      sm[2].textContent = `⚠ ${mats.length} hồn hạch nguyên liệu sẽ bị tiêu hao (mất hẳn)${rare ? `, trong đó ${rare} món đã nâng cấp hoặc từ 4★` : ""}. Nâng cấp không bao giờ thất bại.`
        + (act.combat() ? " Đang giao chiến: rời xa hồn thú vài giây rồi mới nâng cấp được." : "");
      box.appendChild(c);
      btn(`Xác nhận: dùng ${mats.length} hồn hạch${fv.btn}`, "eok", () => { act.enhanceCore(target.id, mats.map((i) => i.id)); enhMats.clear(); }).disabled = !!fv.poor;
      btn("Bỏ chọn hết", "drop", () => { enhMats.clear(); again(); });
    }
  } else {
    const n = document.createElement("small"); n.textContent = `Đã nâng cấp tối đa +${CORE_MAX_ENHANCE}.`; box.appendChild(n);
  }
  btn("Đóng", "drop", () => { enhClose(); again(); });
  box.appendChild(row);
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Cấp +0 đến +${CORE_MAX_ENHANCE}: mỗi cấp tăng chỉ số chính; mốc ${CORE_SUB_MARKS.map((x) => `+${x}`).join(", ")} tăng 1 dòng phụ ngẫu nhiên (chưa đủ ${CORE_MAX_SUBS} dòng thì thêm dòng mới). Tháo ra vẫn giữ cấp. Phí Hồn Tệ mỗi cấp vượt qua: ${feeBands(CORE_ENHANCE_FEE)}. Thợ rèn ở Nặc Đinh Thành và Thiên Đấu Thành cũng mở bảng này.`;
  box.appendChild(note);
  if (enhJump) { enhJump = false; requestAnimationFrame(() => head.scrollIntoView({ block: "nearest" })); }
  return box;
}

/**
 * Mảnh võ hồn trong bảng đội hình (bước 3.4): mỗi võ hồn đã sở hữu hoặc đang có mảnh một dòng (sao, thanh tiến độ, nút), nút
 * bấm được khi đủ mảnh; cuối là bản đồ nào rơi mảnh của võ hồn nào (MAPS[].shards). Chỉ hiển thị, server kiểm tra lại.
 */
function renderShards(el: HTMLElement, data: OwnedVohons, act: RosterActions, shards: Map<string, number>) {
  const head = document.createElement("b"); head.className = "shead"; head.textContent = "Mảnh võ hồn";
  el.appendChild(head);
  const rows = VOHON.map((def) => {
    const v = data.list.find((x) => x.vohon === def.id), have = shards.get(def.id) ?? 0;
    const need = v ? starCost(v.stars) : SHARD_UNLOCK;
    return { def, v, have, need, ready: need !== null && have >= need };
  }).filter((r) => r.v || r.have > 0)
    .sort((a, b) => Number(b.ready) - Number(a.ready) || Number(!b.v) - Number(!a.v) || b.have - a.have);
  const grid = document.createElement("div"); grid.className = "cgrid sgrid"; el.appendChild(grid);
  for (const { def, v, have, need, ready } of rows) {
    const row = document.createElement("div"); row.className = "srow" + (ready ? " ready" : "");
    row.style.setProperty("--c", def.col);
    row.append(vohonCard(def, v ? { level: v.level, stars: v.stars, rings: v.rings } : { locked: true, plate: "Chưa mở" }));
    row.insertAdjacentHTML("beforeend", `<small></small><i class="sbar"><i></i></i><button type="button" class="sbtn"></button>`);
    const sm = row.querySelector("small")!, btn = row.querySelector("button")!;
    sm.textContent = !v ? `${have}/${SHARD_UNLOCK} mảnh` : need === null ? `Tối đa · dư ${have}` : `${have}/${need} lên ${v.stars + 1}★`;
    (row.querySelector(".sbar i") as HTMLElement).style.width = (need ? Math.min(1, have / need) : 1) * 100 + "%";
    btn.textContent = !v ? "Mở" : need === null ? "Tối đa" : "Lên sao";
    btn.disabled = !ready;
    btn.setAttribute("aria-label", !v ? `Mở ${def.name} bằng ${SHARD_UNLOCK} mảnh` : `Lên sao ${def.name}`);
    btn.addEventListener("click", () => { btn.blur(); btn.disabled = true; if (!v) act.unlock(def.id); else act.starUp(def.id); });
    grid.appendChild(row);
  }
  const where = Object.values(MAPS).filter((m) => m.shards.length)
    .map((m) => `${m.name}: ${m.shards.map((id) => vohonDef(id).name).join(", ")}`).join("; ");
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Hạ hồn thú có thể rơi mảnh vào túi đồ. Đủ ${SHARD_UNLOCK} mảnh thì mở võ hồn; mảnh dư lên sao (tới ${MAX_STARS}★, mỗi sao tăng chỉ số gốc). Nơi rơi: ${where}.`;
  el.appendChild(note);
}
