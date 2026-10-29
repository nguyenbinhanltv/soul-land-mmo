// Giao diện HTML phủ lên canvas (chữ tiếng Việt hiển thị sắc nét hơn vẽ trong canvas).
import { friendSend, friendsLast, toggleFriends } from "./hudMisc.ts";
import { itemColor, itemName } from "./hudBag.ts";
import { VOHON, formatYears, MAPS } from "../../shared/data.ts";

import { artUrl } from "./uiArt.ts";
import { chatWhisperTo } from "./chat.ts";
import { el, pbtn } from "./domBtn.ts";
import { confirmDialog } from "./confirmDialog.ts";
import type { PortalInfo, BagItem, PartyView } from "./net.ts";

// Ô chat đã tách sang chat.ts (Part of #885); giữ tên cũ ở đây để GameScene vẫn gọi hud.chat*.
export { log, logImp, chatLine, chatWhisper, chatReplyTo, chatSendCh, chatSetTab, chatWhisperTo, chatFocus, chatClose, buildChatTabs, CHAT_COL, type ChatCh, type ChatTab } from "./chat.ts";
// Thanh kỹ năng / chỉ số / đội nhỏ đã tách sang hudBar.ts (Part of #885 bước 2); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { ringColor, SKILL_KEYS, BONE_SKILL_KEYS, skillCd, cdText, starSkillText, skillSpec, buildSkills, FUSION_KEY, setFusionCd, fusionOp, setFusionPending, updateFusion, AVA_KEY, chanThanText, boneSkillText, buildBoneSkills, statusText, updateStats, setAbsorbing, buildTeam, setSquad, updateTeam, type WornBone } from "./hudBar.ts";
// Thanh boss / đếm ngược / xếp hạng đóng góp đã tách sang hudBoss.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { setBossCountdown, updateBossCd, setBossLife, setBossRage, setBossWeak, showBoss, bossRank, type BossWorldView } from "./hudBoss.ts";
// Bảng Võ Hồn / đội hình, hồn kỹ, hồn cốt, hồn hạch, cường hóa và mảnh võ hồn của HUD đã tách sang hudRoster.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { toggleRoster, type RosterActions, renderRoster, openBones, openCores, wornCores, coreLines } from "./hudRoster.ts";
// Túi đồ, hồn tệ, thẻ thao tác, so sánh, tự bán của HUD đã tách sang hudBag.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { openBagTieuHao, setBagCap, toggleBag, boneOf, coreOf, coreSet, itemName, boneStatText, boneFullText, subName, yearsShort, itemColor, itemArt, boneIcon, boneEmptyIcon, coreIcon, type AbsorbOption, type HerbOption, type BagActions, type BagFocus, setBagFocus, bagCap, renderBag, updateBag } from "./hudBag.ts";
// Hộp thoại NPC đã tách sang hudNpc.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { showTalk, type NpcActions, type TongMsg, type TongBoardMsg, setShardInfo, setLooksInfo, looksOpen, closeLooks, setTong, setTongBoard, npcOpenId, openNpc, closeNpc, npcBag } from "./hudNpc.ts";
// Cửa hàng NPC đã tách sang hudShop.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { renderShopBuy, renderShardShop, renderShopBuyback, renderShopSell } from "./hudShop.ts";
// Thợ rèn đã tách sang hudForge.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { renderForge, renderForgeCores, equipEnhPreview, equipEnhDone, npcRefresh, renderForgeGear, equipLuckPreview, equipLuckDone, renderForgeLuck, forgeReset, equipSynDone, equipSalvDone, renderForgeSynth, renderForgeSalv, renderForgeSets } from "./hudForge.ts";
// Nhiệm vụ đã tách sang hudQuest.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { dailyMsg, questOf, questTracked, revealQuestTracker, setQuest, renderQuestPage, QUEST_GIVERS, questMarker, dailyMark, setDaily, setTrackerMap, dailyList, renderTongTasks, renderTongRank, renderDailyPage } from "./hudQuest.ts";
// Đại Đấu Hồn Trường đã tách sang hudArena.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { type ArenaTopMsg, type ArenaEndMsg, arenaQ, arenaTopMsg, setArenaQueue, updateArenaQueue, type ArenaLiveMsg, arenaLiveAt, arenaLiveAsk, setArenaLive, arenaLiveEl, updateArenaLive, arenaRankEl, setArenaTop, showArena, arenaEnd, updateArenaEnd } from "./hudArena.ts";
// Bạn bè, cộng minh, kênh, bản đồ thế giới / truyền tống, điểm đánh dấu, tự động và về thành của HUD đã tách sang hudMisc.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { bindFriends, setFriends, toggleFriends, resMsg, setResonance, setResonanceTop, onResonanceTop, toggleReso, setChannel, onChannelPick, toggleChannels, resetChannels, setChannels, onWorldGo, onWorldAuto, worldOpen, toggleWorld, setWorld, showWaypoint, setAuto, setRecall, drawRecall } from "./hudMisc.ts";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;


let bannerTO: number | undefined;
export function banner(a: string, b: string) {
  const el = $("#banner"); el.querySelector("b")!.textContent = a; el.querySelector("span")!.textContent = b;
  el.style.opacity = "1"; clearTimeout(bannerTO); bannerTO = window.setTimeout(() => (el.style.opacity = "0"), 2400);
}



let lastTarget: string | null = null;
/** Khung mục tiêu (gọi mỗi khung hình): chỉ ghi lại DOM khi nội dung đổi, để chân dung không bị tạo lại liên tục. */
export function showTarget(html: string | null) {
  if (html === lastTarget) return;
  const prev = lastTarget; lastTarget = html;
  const t = $("#target");
  if (!html) { t.style.display = "none"; return; }
  // Chỉ đổi thanh máu (.thp) thì cập nhật tại chỗ để transition width chạy, không dựng lại cả khung (chân dung, chip).
  const bar = /<div class="ui-bar thp">.*?<\/div>/, cur = t.querySelector<HTMLElement>(".thp"), m = html.match(bar);
  if (cur && m && prev !== null && prev.replace(bar, "") === html.replace(bar, "")) {
    const w = /width:([\d.]+)%/.exec(m[0])?.[1], tx = />([^<>]*)<\/span><\/div>$/.exec(m[0])?.[1];
    if (w !== undefined && tx !== undefined) {
      (cur.firstElementChild as HTMLElement).style.width = w + "%";
      const sp = cur.querySelector("span")!; if (sp.textContent !== tx) sp.textContent = tx;
      return;
    }
  }
  t.style.display = "block"; t.innerHTML = html;
}
/**
 * Nội dung khung mục tiêu hồn thú (UI-3, #353): dòng tên + chip niên hạn (nền mực, chữ sáng theo bậc) + cấp tương đương, thanh máu có số,
 * dòng trạng thái. `xpNote` là html có sẵn của dòng kinh nghiệm bị cắt (hồn thú thấp cấp hơn võ hồn ra trận).
 */
export function beastTargetHtml(o: { name: string; years: number; tier: number; level: number; hp: number; maxHp: number; status: string; xpNote: string }) {
  const pct = Math.max(0, Math.min(100, (100 * o.hp) / Math.max(1, o.maxHp)));
  return `<div class="tn"><b>${o.name}</b><span class="ui-chip" data-tier="${o.tier}">${formatYears(o.years)}</span><span class="tl">cấp ${o.level}${o.xpNote}</span></div>`
    + `<div class="ui-bar thp"><i style="width:${pct}%"></i><span>${o.hp} / ${o.maxHp}</span></div>` + (o.status ? `<small>${o.status}</small>` : "");
}
/**
 * Chân dung hồn thú `thu_<loài gốc>` cạnh chữ của khung mục tiêu (#339, mục 5.11): tinh anh / thú vương dùng chân dung loài gốc,
 * viền màu `col` (hào quang của bậc, hoặc màu vòng niên hạn với hồn thú thường). Loài chưa có ảnh thì trả nguyên chữ như cũ.
 */
export function withBeastPortrait(html: string, species: string | undefined, col: string) {
  const u = species ? artUrl(`thu_${species}`) : null;
  return u ? `<div class="thu"><img src="${u}" alt="" draggable="false" style="border-color:${col}"><div>${html}</div></div>` : html;
}
/** Hộp đi cổng (mục 5.3): tên bản đồ đích, cấp đề xuất, cảnh báo đỏ khi võ hồn ra trận dưới cấp; nút (hoặc phím F) để đi. */
export function showPortal(info: PortalInfo | null, go: () => void) {
  const el = $("#portal");
  if (!info?.name) { el.hidden = true; el.innerHTML = ""; return; }
  const lv = info.level ? ` (đề xuất cấp ${info.level[0]}–${info.level[1]})` : "";
  const goText = info.boat ? (info.warn ? "Vẫn lên thuyền" : "Lên thuyền") : info.warn ? "Vẫn đi" : "Đi";
  el.innerHTML = `<div></div><small></small>${info.warn ? `<span class="danger">Nguy hiểm: võ hồn ra trận dưới cấp ${info.level?.[0] ?? "đề xuất"}!</span>` : ""}
    <button type="button" class="${info.warn ? "danger" : ""}">${goText}<kbd>F</kbd></button>`;
  el.querySelector("div")!.textContent = `${info.boat ? "Đi thuyền tới" : "Đi tới"} ${info.toName ?? info.to}${lv}`;
  // Bến thuyền (BĐ6d): đi thuyền mất vài giây, bị đánh hoặc rời bến thì hủy như niệm cổng.
  el.querySelector("small")!.textContent = info.boat ? `${info.name} · đi thuyền ${info.boat} giây` : info.name;
  const b = el.querySelector("button")!;
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); go(); });
  el.hidden = false;
}
export function showPrompt(html: string | null) { const t = $("#prompt"); if (html) { t.style.display = "block"; t.innerHTML = html; } else t.style.display = "none"; }

// ---------- Tổ đội người chơi (mục 5.9, bước 7.1): khung tổ đội, lời mời, bảng thao tác khi bấm vào hồn sư ----------
/** Thao tác tổ đội: chỉ gửi ý định `party {op, name?, sid?}`, server kiểm tra mọi thứ. */
export interface PartyActions { send(op: string, name?: string, sid?: string): void; }
let partyAt = 0;             // performance.now() lúc nhận tin "party" gần nhất (đếm ngược lời mời)
let partyInviting = false;   // đang mở ô gõ tên để mời
let partyOpenNow = false;    // vừa bấm "Mời…": lần vẽ này đặt focus vào ô gõ tên
let partyDraft = "";         // chữ đang gõ trong ô mời: giữ lại khi khung vẽ lại (sinh lực đồng đội đổi)
let partyCollapsed = false;
let partyLast: { v: PartyView; act: PartyActions } | null = null;
/** Khung tổ đội gần nhất (null = chưa nhận). */
export const partyNow = () => partyLast?.v ?? null;

/**
 * Khung tổ đội (tin riêng "party"), nằm dưới khung chỉ số: mỗi thành viên một dòng (trưởng nhóm ★, tên, cấp và võ hồn ra trận,
 * thanh sinh lực võ hồn ra trận; ở bản đồ khác thì ghi tên bản đồ, đã rời game thì mờ), trưởng nhóm có nút nhường / mời ra cho
 * từng thành viên, nút "Rời đội"; lời mời đang chờ có nút "Vào đội" / "Từ chối"; nút "Mời…" mở ô gõ tên (như lệnh chat /moi).
 */
export function renderParty(v: PartyView, act: PartyActions) {
  partyLast = { v, act }; partyAt = performance.now();
  const box = $("#party"), typing = !!document.activeElement?.closest("#party .pinv"); box.innerHTML = "";
  const head = el("div", "phead");
  head.append(el("b", "", v.id ? `Tổ đội ${v.members.length}/${v.max}` : "Tổ đội"));
  const me = v.members.find((m) => m.me), lead = !!me?.leader;
  if (!v.id || v.members.length < v.max)
    head.append(pbtn(partyInviting ? "Đóng" : "Mời…", "", () => { partyInviting = !partyInviting; partyOpenNow = partyInviting; renderParty(v, act); }, "Mời hồn sư vào tổ đội"));
  if (v.id) head.append(pbtn("Rời đội", "warn", () => confirmDialog({ title: "Rời tổ đội?", body: `Bạn rời tổ đội ${v.members.length}/${v.max} người; muốn quay lại phải được mời lại.`, confirm: "Rời đội", danger: true }, () => act.send("leave")), "Rời tổ đội"));
  head.append(pbtn("Bạn bè", "", () => toggleFriends(), "Bảng bạn bè (phím L)"));
  head.append(pbtn(partyCollapsed ? "Mở" : "Gọn", "", () => { partyCollapsed = !partyCollapsed; renderParty(v, act); }, partyCollapsed ? "Mở bảng tổ đội" : "Thu gọn bảng tổ đội"));
  box.append(head);
  if (partyCollapsed) { box.classList.add("collapsed"); placeParty(); return; }
  box.classList.remove("collapsed");
  if (partyInviting) {
    const f = el("form", "pinv"), inp = el("input"), go = el("button", "pbtn", "Mời");
    inp.placeholder = "Tên hồn sư"; inp.maxLength = 20; inp.autocomplete = "off"; go.type = "submit";
    f.append(inp, go);
    inp.value = partyDraft;
    inp.addEventListener("input", () => { partyDraft = inp.value; });
    const done = () => { partyInviting = false; partyDraft = ""; inp.blur(); renderParty(v, act); };
    f.addEventListener("submit", (e) => { e.preventDefault(); const n = inp.value.trim(); if (n) act.send("invite", n); done(); });
    // Phím khi đang gõ tên không được điều khiển nhân vật (như ô chat).
    inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") done(); });
    box.append(f);
    if (typing || partyOpenNow) setTimeout(() => inp.focus(), 0); // chỉ lấy focus lúc vừa mở hoặc khi đang gõ dở
    partyOpenNow = false;
  }
  for (const m of v.members) {
    const row = el("div", "pmem" + (m.me ? " me" : "") + (m.off ? " off" : "") + (m.dead ? " dead" : ""));
    const top = el("div", "ptop"), nm = el("span", "pname", (m.leader ? "★ " : "") + m.name), def = VOHON[m.vh];
    if (m.leader) nm.title = "Trưởng nhóm";
    top.append(nm, el("small", "", m.level ? `Cấp ${m.level}${def ? ` · ${def.name}` : ""}` : ""));
    const bar = el("div", "bar hp"), fill = el("i"), txt = el("span", "", m.off ? "Rời game / đang qua cổng" : m.dead ? "Đã gục" : `${m.hp}/${m.maxHp}`);
    fill.style.width = (m.maxHp && !m.off ? Math.max(0, Math.min(1, m.hp / m.maxHp)) * 100 : 0) + "%";
    bar.append(fill, txt);
    row.append(top, bar);
    if (!m.me && !m.sid && !m.off && m.map) row.append(el("small", "pmap", `Ở ${MAPS[m.map]?.name ?? m.map}${m.ch ? ` · Kênh ${m.ch}` : ""}`));
    if (lead && !m.me) {
      const btns = el("div", "pbtns");
      btns.append(pbtn("Nhường trưởng nhóm", "", () => act.send("lead", m.name), `Nhường trưởng nhóm cho ${m.name}`),
        pbtn("Mời ra", "warn", () => act.send("kick", m.name), `Mời ${m.name} ra khỏi tổ đội`));
      row.append(btns);
    }
    box.append(row);
  }
  for (const i of v.invites) {
    const row = el("div", "pinvite"), t = el("div"), btns = el("div", "pbtns");
    t.append(el("b", "", i.name), document.createTextNode(" mời bạn vào tổ đội "), el("small", "psecs", `(${i.secs}s)`));
    row.dataset.secs = String(i.secs);
    btns.append(pbtn("Vào đội", "ok", () => act.send("accept", i.name), `Vào tổ đội của ${i.name}`),
      pbtn("Từ chối", "", () => act.send("decline", i.name), `Từ chối lời mời của ${i.name}`));
    row.append(t, btns); box.append(row);
  }
  if (!v.id && !v.invites.length && !partyInviting) box.append(el("small", "phint", "Bấm vào hồn sư khác hoặc gõ /moi <tên> để mời."));
  placeParty();
}

/** Đặt khung tổ đội ngay dưới khung chỉ số (khung chỉ số cao thấp theo số hồn hoàn, hiệu ứng). */
function placeParty() {
  const st = document.querySelector<HTMLElement>(".stats"), box = $("#party");
  if (st && box) box.style.top = st.offsetTop + st.offsetHeight + 8 + "px";
}

/** Mỗi lần cập nhật HUD: đếm ngược lời mời, giữ khung tổ đội dưới khung chỉ số. */
export function updateParty() {
  const dt = (performance.now() - partyAt) / 1000;
  document.querySelectorAll<HTMLElement>("#party .pinvite").forEach((r) => {
    const s = Math.max(0, Math.ceil(Number(r.dataset.secs) - dt)), t = r.querySelector(".psecs");
    if (t) t.textContent = `(${s}s)`;
    r.classList.toggle("gone", s <= 0);
  });
  placeParty();
}

/**
 * Bảng thao tác khi bấm / chạm vào hồn sư khác (7.1): mời vào tổ đội; nếu người đó trong tổ đội của mình và mình là trưởng nhóm thì
 * nhường trưởng nhóm / mời ra. `null` đóng bảng.
 */
export function showPlayerMenu(t: { sid: string; name: string; level: number } | null) {
  const box = $("#pmenu"); box.innerHTML = "";
  if (!t || !partyLast) { box.hidden = true; return; }
  const { v, act } = partyLast, me = v.members.find((m) => m.me), mem = v.members.find((m) => !m.me && m.name === t.name);
  const close = () => showPlayerMenu(null);
  const head = el("div", "phead"); head.append(el("b", "", `${t.name} (cấp ${t.level})`), pbtn("×", "", close, "Đóng"));
  const btns = el("div", "pbtns");
  if (!mem) btns.append(pbtn("Mời vào tổ đội", "ok", () => { act.send("invite", undefined, t.sid); close(); }, `Mời ${t.name} vào tổ đội`));
  else if (me?.leader) btns.append(pbtn("Nhường trưởng nhóm", "", () => { act.send("lead", t.name); close(); }),
    pbtn("Mời ra khỏi đội", "warn", () => { act.send("kick", t.name); close(); }));
  else btns.append(el("small", "phint", "Đồng đội trong tổ đội của bạn."));
  btns.append(pbtn("Nhắn riêng", "", () => { close(); chatWhisperTo(t.name); }, `Nhắn riêng cho ${t.name} (/t)`));
  // Bạn bè và chặn (#195): theo bảng bạn bè gần nhất của chính mình.
  const fr = friendsLast?.list.some((f) => f.name === t.name), bl = friendsLast?.blocks.includes(t.name);
  if (friendSend && !fr && !bl) btns.append(pbtn("Kết bạn", "ok", () => { friendSend!("add", t.name); close(); }, `Thêm ${t.name} vào danh sách bạn bè`));
  if (friendSend) btns.append(bl ? pbtn("Bỏ chặn", "", () => { friendSend!("unblock", t.name); close(); }, `Bỏ chặn ${t.name}`)
    : pbtn("Chặn", "warn", () => { friendSend!("block", t.name); close(); }, `Chặn ${t.name}: không nhận tin, lời mời, lời thêm bạn`));
  box.append(head, btns);
  box.hidden = false;
}

export const bagItemInfo = (it: BagItem) => ({ name: itemName(it), color: itemColor(it) });
