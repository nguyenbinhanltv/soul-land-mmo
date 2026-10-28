// Giao diện HTML phủ lên canvas (chữ tiếng Việt hiển thị sắc nét hơn vẽ trong canvas).
import { closeNpc } from "./hudNpc.ts";
import { itemColor, itemName, toggleBag } from "./hudBag.ts";
import { toggleRoster } from "./hudRoster.ts";
import { VOHON, formatYears, MAPS, formatHonTe, WAYPOINT_CAST, RESONANCE, RESONANCE_RANK_PAGE_SIZE, resonanceText } from "../../shared/data.ts";

import { artUrl } from "./uiArt.ts";
import { toggleChar } from "./charPanel.ts";
import { chatLine, chatWhisperTo } from "./chat.ts";
import { el, pbtn } from "./domBtn.ts";
import type { PortalInfo, BagItem, PartyView, ResonanceMsg, ResonanceTopMsg, ChannelsMsg, WorldMsg, AutoMsg, FriendsMsg } from "./net.ts";
import { autoTimeText, FRIEND_MAX, BLOCK_MAX } from "../../shared/data.ts";

// Ô chat đã tách sang chat.ts (Part of #885); giữ tên cũ ở đây để GameScene vẫn gọi hud.chat*.
export { log, chatLine, chatWhisper, chatReplyTo, chatSendCh, chatSetTab, chatWhisperTo, chatFocus, chatClose, buildChatTabs, CHAT_COL, type ChatCh, type ChatTab } from "./chat.ts";
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
export { dailyMsg, questOf, questTracked, setQuest, renderQuestPage, QUEST_GIVERS, questMarker, dailyMark, setDaily, setTrackerMap, dailyList, renderTongTasks, renderTongRank, renderDailyPage } from "./hudQuest.ts";
// Đại Đấu Hồn Trường đã tách sang hudArena.ts (Part of #885 bước 0a); giữ tên cũ ở đây để nơi gọi vẫn dùng hud.*.
export { type ArenaTopMsg, type ArenaEndMsg, arenaQ, arenaTopMsg, setArenaQueue, updateArenaQueue, type ArenaLiveMsg, arenaLiveAt, arenaLiveAsk, setArenaLive, arenaLiveEl, updateArenaLive, arenaRankEl, setArenaTop, showArena, arenaEnd, updateArenaEnd } from "./hudArena.ts";

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
  if (v.id) head.append(pbtn("Rời đội", "warn", () => act.send("leave"), "Rời tổ đội"));
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

// ---------- Bạn bè và chặn (mục 5.9 "Bạn bè", #195): chỉ chính chủ nhận tin "friends" ----------
let friendsLast: FriendsMsg | null = null;
let friendSend: ((op: string, name?: string) => void) | null = null;
let friendAct: { invite(name: string): void } | null = null;
let friendDraft = "";
/** Gắn hàm gửi `friend {op, name}` và mời tổ đội (GameScene, mỗi lần vào phòng). */
export function bindFriends(send: (op: string, name?: string) => void, invite: (name: string) => void) { friendSend = send; friendAct = { invite }; }
/** Tin "friends" mới: cập nhật bảng (nếu đang mở); `added` thì thêm dòng log, chưa có người đó thì kèm nút "Thêm lại". */
export function setFriends(m: FriendsMsg) {
  friendsLast = m;
  if (m.added) {
    const { name, back } = m.added;
    if (back) chatLine("sys", `${name} đã thêm bạn vào danh sách bạn bè: hai bên đã là bạn bè.`, FRIEND_COL);
    else chatLine("sys", `${name} đã thêm bạn vào danh sách bạn bè. `, FRIEND_COL, undefined, { label: "Thêm lại", fn: () => friendSend?.("add", name) });
  }
  if (!$("#friends").hidden) renderFriends();
}
const FRIEND_COL = "#9fd8ff";
/** Mở / đóng bảng Bạn bè (phím L, nút trong khung tổ đội); cùng chỗ giữa màn hình với các bảng khác. Mở thì xin bảng mới. */
export function toggleFriends(open = $("#friends").hidden) {
  $("#friends").hidden = !open;
  if (open) { toggleRoster(false); toggleBag(false); toggleReso(false); closeNpc(); toggleWorld(false); toggleChar(false); friendSend?.("list"); renderFriends(); }
}
/**
 * Bảng Bạn bè: ô gõ tên (Thêm bạn / Chặn), danh sách bạn (đã thêm nhau và đang online: bản đồ / kênh, nút Mời tổ đội, Nhắn; chưa thêm
 * lại: chỉ ghi chú), nút Xóa / Chặn từng người, danh sách chặn với nút Bỏ chặn.
 */
function renderFriends() {
  const box = $("#friends"), typing = document.activeElement?.closest("#friends .finp") ? friendDraft : null; box.innerHTML = "";
  const m = friendsLast, head = el("div", "rhead");
  head.append(el("b", "", `Bạn bè ${m?.list.length ?? 0}/${FRIEND_MAX}`));
  const x = el("button", "x", "×"); x.type = "button"; x.setAttribute("aria-label", "Đóng"); x.addEventListener("click", () => toggleFriends(false));
  head.append(x); box.append(head);
  const f = el("form", "pinv finp"), inp = el("input"), add = el("button", "pbtn ok", "Thêm bạn"), blk = pbtn("Chặn", "warn", () => go("block"), "Chặn hồn sư này");
  inp.placeholder = "Tên hồn sư"; inp.maxLength = 40; inp.autocomplete = "off"; inp.value = friendDraft; add.type = "submit";
  const go = (op: string) => { const n = inp.value.trim(); if (!n) return; friendSend?.(op, n); friendDraft = ""; inp.value = ""; };
  inp.addEventListener("input", () => { friendDraft = inp.value; });
  inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") { inp.blur(); toggleFriends(false); } }); // phím khi gõ không điều khiển nhân vật
  f.addEventListener("submit", (e) => { e.preventDefault(); go("add"); });
  f.append(inp, add, blk); box.append(f);
  if (typing !== null) setTimeout(() => inp.focus(), 0);
  box.append(el("small", "phint", "Hai bên đã thêm nhau mới thấy nhau đang online và ở đâu. Chặn: không nhận tin, lời mời tổ đội, lời thêm bạn của người đó."));
  if (!m) { box.append(el("small", "phint", "Đang tải…")); return; }
  const rank = (e: FriendsMsg["list"][number]) => (e.mutual && e.map ? 0 : e.mutual ? 1 : 2);
  for (const e of [...m.list].sort((a, b) => rank(a) - rank(b))) {
    const row = el("div", "pmem frow" + (e.mutual && e.map ? " on" : " off")), top = el("div", "ptop");
    top.append(el("span", "pname", (e.mutual && e.map ? "● " : "") + e.name),
      el("small", "", e.mutual ? (e.map ? `Ở ${MAPS[e.map]?.name ?? e.map}${e.ch ? ` · Kênh ${e.ch}` : ""}` : "Ngoại tuyến") : "Chưa thêm lại bạn"));
    const btns = el("div", "pbtns");
    if (e.mutual && e.map) btns.append(pbtn("Mời tổ đội", "ok", () => friendAct?.invite(e.name), `Mời ${e.name} vào tổ đội`),
      pbtn("Nhắn", "", () => { toggleFriends(false); chatWhisperTo(e.name); }, `Nhắn riêng cho ${e.name} (/t)`));
    btns.append(pbtn("Xóa", "", () => friendSend?.("remove", e.name), `Xóa ${e.name} khỏi danh sách bạn bè`),
      pbtn("Chặn", "warn", () => friendSend?.("block", e.name), `Chặn ${e.name}`));
    row.append(top, btns); box.append(row);
  }
  if (!m.list.length) box.append(el("small", "phint", "Chưa có bạn: gõ tên rồi bấm Thêm bạn, hoặc bấm vào hồn sư khác."));
  const bh = el("div", "fsub"); bh.append(el("b", "", `Đã chặn ${m.blocks.length}/${BLOCK_MAX}`)); box.append(bh);
  for (const n of m.blocks) {
    const row = el("div", "pmem frow off"), top = el("div", "ptop");
    top.append(el("span", "pname", n));
    const btns = el("div", "pbtns"); btns.append(pbtn("Bỏ chặn", "", () => friendSend?.("unblock", n), `Bỏ chặn ${n}`));
    row.append(top, btns); box.append(row);
  }
}




// ---------- Cộng minh (mục 5.10, bước 8.2): chỉ hiển thị số server gửi (tin riêng "resonance") ----------
export let resMsg: ResonanceMsg | null = null;
let resTopMsg: ResonanceTopMsg | null = null;
let resTab = 0; // tab trụ cột đang xem (chỉ số theo RESONANCE)
let resTopRequest: (page: number, pageSize: number) => void = () => {};
/** Tin "resonance" mới: vẽ lại bảng nếu đang mở. */
export function setResonance(m: ResonanceMsg) { resMsg = m; if (!$("#reso").hidden) renderReso(); }
/** Tin "resonanceTop" mới: bảng công khai chỉ hiển thị tên / điểm và dòng riêng của mình. */
export function setResonanceTop(m: ResonanceTopMsg) { resTopMsg = m; if (!$("#reso").hidden) renderReso(); }
export function onResonanceTop(fn: (page: number, pageSize: number) => void) { resTopRequest = fn; }
/** Mở / đóng bảng Cộng minh (phím K, nút trong khung chỉ số và trong bảng đội hình); cùng chỗ giữa màn hình với các bảng khác. */
export function toggleReso(open = $("#reso").hidden) {
  $("#reso").hidden = !open; $("#resBtn").setAttribute("aria-expanded", String(open));
  if (open) { toggleRoster(false); toggleBag(false); closeNpc(); toggleWorld(false); toggleFriends(false); toggleChar(false); renderReso(); }
}
/**
 * Bảng Cộng minh: tổng % đang cộng cho mọi võ hồn, tab theo trụ cột (RESONANCE): tiến độ x/mốc kế tiếp kèm thanh, các mốc (đã đạt √,
 * mốc kế nổi bật, còn lại khoá) và phần cộng của từng mốc; bảng xếp hạng ở cuối.
 */
function renderReso() {
  const el = $("#reso"); el.innerHTML = "";
  const head = document.createElement("div"); head.className = "rhead";
  head.innerHTML = `<b>Cộng minh</b><button class="x" aria-label="Đóng">×</button>`;
  head.querySelector("button")!.addEventListener("click", () => toggleReso(false));
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = "Đạt mốc ở từng trụ cột thì mọi võ hồn (kể cả võ hồn mở sau) được cộng chỉ số. Nuôi đều các võ hồn để mở thêm mốc.";
  const total = document.createElement("div"); total.className = "restotal";
  const txt = resMsg ? resonanceText(resMsg.bonus) : "";
  total.textContent = !resMsg ? "Đang tải…" : txt ? `Mọi võ hồn: ${txt}` : "Chưa đạt mốc nào.";
  el.append(head, note, total);
  const rank = document.createElement("section"); rank.className = "resrank";
  const rankHead = document.createElement("div"); rankHead.className = "resrankhead";
  const rankTitle = document.createElement("b"); rankTitle.textContent = "Bảng xếp hạng cộng minh";
  const rankBtn = document.createElement("button"); rankBtn.type = "button"; rankBtn.textContent = resTopMsg ? "Làm mới" : "Xem bảng";
  rankBtn.addEventListener("click", () => resTopRequest(1, resTopMsg?.pageSize ?? RESONANCE_RANK_PAGE_SIZE));
  rankHead.append(rankTitle, rankBtn); rank.appendChild(rankHead);
  if (!resTopMsg) {
    const hint = document.createElement("small"); hint.textContent = "Chỉ tài khoản đã đạt ít nhất một mốc được xếp hạng."; rank.appendChild(hint);
  } else {
    const mine = document.createElement("small");
    mine.textContent = resTopMsg.me ? `Hạng ${resTopMsg.me.rank} · ${resTopMsg.me.score} điểm · ${resTopMsg.me.milestones} mốc · tiến độ ${Math.floor(resTopMsg.me.progressBp / 100)}% · sao thêm ${resTopMsg.me.extraStars}` : "Chưa đạt mốc để xếp hạng.";
    rank.appendChild(mine);
    const table = document.createElement("div"); table.className = "resranktable";
    resTopMsg.list.forEach((r, i) => { const row = document.createElement("div"); row.className = "resrankrow" + (r.me ? " me" : "");
      const n = document.createElement("span"); n.textContent = `#${(resTopMsg!.page - 1) * resTopMsg!.pageSize + i + 1}`;
      const name = document.createElement("em"); name.textContent = r.name;
      const score = document.createElement("i"); score.textContent = `${r.score} điểm · ${r.milestones} mốc`;
      row.append(n, name, score); table.appendChild(row); });
    if (!resTopMsg.list.length) { const empty = document.createElement("small"); empty.textContent = "Chưa có tài khoản đạt mốc."; table.appendChild(empty); }
    rank.appendChild(table);
    const pages = document.createElement("div"); pages.className = "respages";
    const prev = document.createElement("button"); prev.type = "button"; prev.textContent = "‹ Trước"; prev.disabled = resTopMsg.page <= 1;
    prev.addEventListener("click", () => resTopRequest(resTopMsg!.page - 1, resTopMsg!.pageSize));
    const page = document.createElement("span"); page.textContent = `Trang ${resTopMsg.page}`;
    const next = document.createElement("button"); next.type = "button"; next.textContent = "Sau ›"; next.disabled = !resTopMsg.hasNext;
    next.addEventListener("click", () => resTopRequest(resTopMsg!.page + 1, resTopMsg!.pageSize));
    pages.append(prev, page, next); rank.appendChild(pages);
  }
  el.appendChild(rank);
  // 5 tab sinh từ RESONANCE (không hardcode số nhánh): tên + x/y mốc + chấm màu; trong tab: thanh tiến độ, mốc đã đạt / mốc kế / mốc khoá
  if (resTab >= RESONANCE.length) resTab = 0;
  const tabs = document.createElement("div"); tabs.className = "restabs"; tabs.setAttribute("role", "tablist");
  RESONANCE.forEach((r, i) => {
    const lv = resMsg?.lv[i] ?? 0, t = document.createElement("button"); t.type = "button"; t.className = "restab" + (i === resTab ? " on" : "");
    t.setAttribute("role", "tab"); t.setAttribute("aria-selected", String(i === resTab)); t.style.setProperty("--c", r.col);
    const n = document.createElement("span"); n.textContent = r.name;
    const c = document.createElement("small"); c.textContent = `${lv}/${r.steps.length}`;
    const dot = document.createElement("i");
    t.append(n, c, dot); t.setAttribute("aria-label", `${r.name}: ${lv}/${r.steps.length} mốc`);
    t.addEventListener("click", () => { resTab = i; renderReso(); });
    tabs.appendChild(t);
  });
  el.insertBefore(tabs, total.nextSibling);
  const r = RESONANCE[resTab], have = resMsg?.prog[resTab] ?? 0, lv = resMsg?.lv[resTab] ?? 0, next = r.steps[lv];
  const box = document.createElement("section"); box.className = "respil"; box.setAttribute("role", "tabpanel"); box.style.setProperty("--c", r.col);
  const top = document.createElement("div"); top.className = "restop";
  const name = document.createElement("b"); name.textContent = `${r.name} · ${lv}/${r.steps.length} mốc`;
  const prog = document.createElement("span");
  prog.textContent = next ? `${have}/${next.need} ${r.what}` : `${have} ${r.what} · đã đạt mọi mốc`;
  top.append(name, prog);
  const bar = document.createElement("span"); bar.className = "sbar";
  const fill = document.createElement("i"); fill.style.width = `${next ? Math.min(100, (have / next.need) * 100) : 100}%`; bar.appendChild(fill);
  const steps = document.createElement("div"); steps.className = "ressteps";
  r.steps.forEach((s, k) => {
    const state = k < lv ? "on" : k === lv ? "next" : "lock";
    const st = document.createElement("div"); st.className = `resstep ${state}`;
    const label = document.createElement("b"); label.textContent = `${state === "on" ? "√ " : state === "lock" ? "Khoá · " : ""}${k === lv ? "Mốc kế · " : ""}${s.need} · ${resonanceText(s.bonus)}`;
    st.appendChild(label);
    if (state === "next") { const left = document.createElement("span"); left.textContent = `còn ${Math.max(0, s.need - have)}`; st.appendChild(left); }
    st.setAttribute("aria-label", `Mốc ${k + 1}: ${s.need} ${r.what}, ${resonanceText(s.bonus)}, ${state === "on" ? "đã đạt" : state === "next" ? `mốc kế, còn ${Math.max(0, s.need - have)}` : "chưa mở"}`);
    steps.appendChild(st);
  });
  const auto = document.createElement("small"); auto.className = "resauto"; auto.textContent = "Mốc tự kích hoạt khi đủ điều kiện, không cần nhận.";
  box.append(top, bar, steps, auto);
  el.insertBefore(box, rank);
}

// ---------- Kênh (mục 6 "Nhiều kênh"): chỉ hiển thị số server gửi (PlayerState của phòng: MapState.channel; tin riêng "channels") ----------
let chanNow = 0, chanMsg: ChannelsMsg | null = null, chanPick: (ch: number) => void = () => {};
/** Số kênh của phòng đang ở (MapState.channel): ghi lên nhãn "Kênh N" ở góc bản đồ nhỏ; 0 (sân đấu) thì ẩn nhãn. */
export function setChannel(ch: number) {
  if (ch === chanNow) return;
  chanNow = ch; $("#chanBtn").textContent = `Kênh ${ch} ▾`;
  $("#chanBtn").hidden = !ch; // 0: phòng không chia kênh (sân Đại Đấu Hồn Trường)
  if (!ch) toggleChannels(false);
  if (!$("#chans").hidden) renderChannels();
}
/** Bấm một kênh trong danh sách: GameScene gửi `channel {ch}` (server kiểm tra rồi mới cho đổi). */
export function onChannelPick(fn: (ch: number) => void) { chanPick = fn; }
/** Mở / đóng danh sách kênh; trả true nếu vừa mở (GameScene xin server danh sách mới, trong lúc chờ vẫn hiện danh sách cũ nếu có). */
export function toggleChannels(open = $("#chans").hidden) {
  $("#chans").hidden = !open; $("#chanBtn").setAttribute("aria-expanded", String(open));
  if (open) renderChannels();
  return open;
}
/** Vào phòng mới (đi cổng, đổi kênh): bỏ danh sách kênh của phòng cũ và đóng bảng. */
export function resetChannels() { chanMsg = null; chanNow = -1; toggleChannels(false); }
/** Tin "channels": vẽ lại danh sách nếu đang mở. */
export function setChannels(m: ChannelsMsg) { chanMsg = m; if (!$("#chans").hidden) renderChannels(); }
function renderChannels() {
  const box = $("#chans"); box.innerHTML = "";
  if (!chanMsg) { box.appendChild(el("small", "", "Đang tải…")); return; } // chỉ khi chưa từng có danh sách
  for (const c of chanMsg.list) {
    const cur = c.ch === chanNow, b = el("button", cur ? "cur" : "") as HTMLButtonElement;
    b.append(el("span", "", `Kênh ${c.ch}${cur ? " (đang ở)" : ""}`), el("span", "", `${c.n}/${c.max}`));
    b.disabled = cur || c.full;
    b.title = cur ? "Bạn đang ở kênh này" : c.full ? "Kênh đã đầy" : `Chuyển sang kênh ${c.ch}`;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); if (!b.disabled) chanPick(c.ch); });
    box.appendChild(b);
  }
  box.appendChild(el("small", "", "Đổi kênh khi ngoài giao chiến."));
}

// ---------- Truyền tống trận và bản đồ thế giới (mục 5.3 "Truyền tống trận", bước 11.2) ----------
/**
 * Chỗ đặt từng bản đồ trên sơ đồ bản đồ thế giới (phần trăm khung, chỉ để vẽ, không phải số cân bằng): gần đúng hướng địa lý trong
 * truyện (Tinh Đấu Đại Sâm Lâm phía đông nam, Thiên Đấu Thành ở giữa, Cực Bắc phía bắc, Hải Thần Đảo ngoài biển phía đông).
 * Bản đồ chưa có chỗ thì xếp ở hàng dưới cùng.
 */
const WORLD_POS: Record<string, [number, number]> = {
  thanh_hon_thon: [15, 88], nac_dinh_thanh: [30, 70], tinh_dau_ngoai_vi: [54, 82], tinh_dau_noi_dia: [74, 70], loi_tinh_dau: [86, 50],
  thien_dau_thanh: [38, 42], lac_nhat_sam_lam: [16, 34], cuc_bac_chi_dia: [40, 12], hai_than_dao: [72, 26],
};
let worldMsg: WorldMsg | null = null;
let worldPick: string | null = null;   // trận đích đang chọn (chờ bấm xác nhận)
let worldGo: (key: string) => void = () => {};
/** Gắn hàm gửi ý định truyền tống (`wp {op: "go", key}`); GameScene gọi mỗi lần vào phòng. */
export function onWorldGo(fn: (key: string) => void) { worldGo = fn; }
/** Nút "Tự đi tới" của từng bản đồ trong bảng thế giới (R4): đi bộ qua các cổng thật tới bản đồ đó, không tốn Hồn Tệ. */
let worldAuto: (map: string) => void = () => {};
export function onWorldAuto(fn: (map: string) => void) { worldAuto = fn; }
export const worldOpen = () => !$("#world").hidden;
/** Mở / đóng bảng bản đồ thế giới (phím M, nút "Thế giới", F khi đứng trên trận). Mở thì GameScene xin tin `world` mới. */
export function toggleWorld(open = $("#world").hidden) {
  $("#world").hidden = !open; $("#worldBtn")?.setAttribute("aria-expanded", String(open));
  if (open) { toggleRoster(false); toggleBag(false); toggleReso(false); closeNpc(); toggleFriends(false); toggleChar(false); renderWorld(); $("#world").scrollTop = 0; } else worldPick = null;
  return open;
}
/** Tin `world` mới (server gửi khi xin): vẽ lại nếu bảng đang mở. */
export function setWorld(m: WorldMsg) {
  worldMsg = m;
  if (worldPick && !m.list.some((w) => w.key === worldPick && w.open && w.fee !== null && w.key !== m.cur)) worldPick = null;
  if (worldOpen()) renderWorld();
}

/**
 * Bảng bản đồ thế giới (cuộn giấy thủy mặc): sơ đồ các bản đồ nối bằng nét mực (cổng), bản đồ có trận đã mở tô mực đậm, bản đồ đang ở
 * có ấn son; dưới là danh sách theo bản đồ (cấp đề xuất) với từng truyền tống trận đã mở / chưa mở và phí. Đứng trên một trận thì chọn
 * trận đích rồi bấm ấn son để niệm; không đứng trên trận thì chỉ xem. Server kiểm tra lại mọi thứ.
 */
function renderWorld() {
  const el = $("#world"), m = worldMsg; el.innerHTML = "";
  const head = document.createElement("div"); head.className = "rhead";
  head.innerHTML = `<b>Bản đồ thế giới</b><button class="x" aria-label="Đóng">×</button>`;
  head.querySelector("button")!.addEventListener("click", () => toggleWorld(false));
  el.appendChild(head);
  if (!m) { el.insertAdjacentHTML("beforeend", "<small class=\"rnote\">Đang tải…</small>"); return; }
  const here = m.list.find((w) => w.key === m.cur);
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = here
    ? `Đang đứng trên truyền tống trận ${here.label}. Chọn trận đích đã mở, niệm ${WAYPOINT_CAST} giây (di chuyển hoặc bị đánh thì hủy, không dùng khi giao chiến).`
    : `Chỉ xem: hãy đứng trên một truyền tống trận rồi mở bảng này (F) để dịch chuyển. Bước lên trận lần đầu thì mở khóa.`;
  const coin = document.createElement("div"); coin.className = "restotal"; coin.textContent = `Hồn Tệ: ${formatHonTe(m.honTe)}`;
  el.append(note, coin);

  // Sơ đồ: nét mực nối bản đồ kề nhau, mỗi bản đồ một ấn (thành vuông, bãi săn tròn).
  const ids = Object.keys(MAPS).filter((id) => MAPS[id].kind !== "arena");
  const extra = ids.filter((id) => !WORLD_POS[id]);
  const pos = (id: string): [number, number] => WORLD_POS[id] ?? [10 + 80 * (extra.indexOf(id) + 0.5) / Math.max(1, extra.length), 96];
  const W = 300, H = 170, X = (p: number) => (p / 100) * W, Y = (p: number) => (p / 100) * H;
  const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("class", "wmap"); svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Sơ đồ các bản đồ");
  const mk = (tag: string, at: Record<string, string | number>) => { const e = document.createElementNS(ns, tag); for (const k in at) e.setAttribute(k, String(at[k])); return e; };
  for (const [a, b] of m.links) {
    if (!MAPS[a] || !MAPS[b]) continue;
    const [x1, y1] = pos(a), [x2, y2] = pos(b);
    svg.appendChild(mk("line", { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), class: "wlink" }));
  }
  for (const id of ids) {
    const [px, py] = pos(id), x = X(px), y = Y(py), def = MAPS[id], wps = m.list.filter((w) => w.map === id);
    const open = wps.some((w) => w.open), cur = id === m.map;
    const g = mk("g", { class: `wnode${open ? " open" : ""}${cur ? " cur" : ""}`, tabindex: 0 });
    if (cur) g.appendChild(mk("circle", { cx: x, cy: y, r: 9, class: "wseal" }));
    g.appendChild(def.kind === "town" ? mk("rect", { x: x - 4.5, y: y - 4.5, width: 9, height: 9, class: "wdot" }) : mk("circle", { cx: x, cy: y, r: 4.5, class: "wdot" }));
    const t = mk("text", { x, y: y - 8, "text-anchor": "middle", class: "wname" }); t.textContent = def.name; g.appendChild(t);
    g.addEventListener("click", () => el.querySelector<HTMLElement>(`.wsec[data-map="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    svg.appendChild(g);
  }
  el.appendChild(svg);

  // Danh sách theo bản đồ.
  for (const id of ids) {
    const def = MAPS[id], wps = m.list.filter((w) => w.map === id); if (!wps.length) continue;
    const sec = document.createElement("section"); sec.className = "wsec" + (id === m.map ? " cur" : ""); sec.dataset.map = id;
    const top = document.createElement("div"); top.className = "restop";
    const name = document.createElement("b"); name.textContent = def.name + (id === m.map ? " · đang ở đây" : "");
    const lv = document.createElement("span"); lv.textContent = def.kind === "town" ? "an toàn" : def.level ? `cấp ${def.level[0]}–${def.level[1]}` : "";
    top.append(name, lv);
    if (id !== m.map) {
      const walk = document.createElement("button"); walk.type = "button"; walk.className = "wwalk"; walk.textContent = "Tự đi tới";
      walk.title = `Đi bộ qua các cổng tới ${def.name}`; walk.addEventListener("click", () => { walk.blur(); toggleWorld(false); worldAuto(id); });
      top.appendChild(walk);
    }
    sec.appendChild(top);
    for (const w of wps) {
      const b = document.createElement("button"); b.type = "button";
      const isHere = w.key === m.cur, can = !!here && w.open && !isHere && w.fee !== null;
      b.className = "wrow" + (w.open ? " open" : " locked") + (isHere ? " here" : "") + (worldPick === w.key ? " sel" : "");
      b.disabled = !can;
      b.innerHTML = `<i></i><span></span><em></em>`;
      b.querySelector("span")!.textContent = w.label;
      b.querySelector("em")!.textContent = isHere ? "Đang đứng" : !w.open ? "Chưa mở" : w.fee === null ? "Không tới được" : formatHonTe(w.fee);
      if (w.open && w.fee !== null && w.fee > m.honTe && !isHere) b.classList.add("poor");
      b.addEventListener("click", () => { b.blur(); worldPick = w.key; renderWorld(); });
      sec.appendChild(b);
    }
    el.appendChild(sec);
  }
  const pick = worldPick ? m.list.find((w) => w.key === worldPick) : undefined;
  if (pick && here && pick.fee !== null) {
    const row = document.createElement("div"); row.className = "brow wgo";
    const ok = document.createElement("button"); ok.className = "buse absorb";
    ok.textContent = `Truyền tống tới ${pick.label} · ${formatHonTe(pick.fee)}`;
    ok.disabled = pick.fee > m.honTe;
    ok.addEventListener("click", () => { ok.blur(); worldGo(pick.key); toggleWorld(false); });
    const no = document.createElement("button"); no.className = "buse drop"; no.textContent = "Thôi";
    no.addEventListener("click", () => { no.blur(); worldPick = null; renderWorld(); });
    row.append(ok, no);
    if (pick.fee > m.honTe) { const s = document.createElement("small"); s.className = "danger"; s.textContent = "Không đủ Hồn Tệ."; row.appendChild(s); }
    el.appendChild(row);
  }
}

/** Hộp khi đứng trên truyền tống trận (tin riêng `wp {k: "here"}`): tên trận, nút (hoặc phím F) mở bản đồ thế giới. */
export function showWaypoint(label: string | null, open: () => void) {
  const el = $("#wpbox");
  if (!label) { el.hidden = true; el.innerHTML = ""; return; }
  el.innerHTML = `<div></div><small>Mở bản đồ thế giới để dịch chuyển tới trận đã mở</small><button type="button">Bản đồ thế giới<kbd>F</kbd></button>`;
  el.querySelector("div")!.textContent = `Truyền tống trận · ${label}`;
  el.querySelector("button")!.addEventListener("pointerdown", (e) => { e.preventDefault(); open(); });
  el.hidden = false;
}

/** Niệm truyền tống / Hồi Thành Phù đang chạy (tin riêng `recall`): chữ trên thanh niệm (dùng chung chỗ thanh hấp thụ), tổng giây, lúc bắt đầu. */
let recall: { label: string; secs: number; t0: number } | null = null;
/**
 * Nút "Tự động" (mục 5.13): sáng khi đang tự săn theo tin riêng `auto` của server, chú thích giờ treo còn lại. Bấm thì mở bảng Tự
 * động (client/src/autoPanel.ts, Auto 2); lý do dừng server báo bằng dòng log và bảng tổng kết.
 */
export function setAuto(m: AutoMsg) {
  const b = $("#autoBtn"); if (!b) return;
  b.setAttribute("aria-pressed", String(m.on));
  b.querySelector(".menu-label")!.textContent = m.on ? "Đang tự động" : "Tự động";
  b.title = `${m.on ? "Đang tự săn: tự đi / đánh hoặc phím T để tắt" : "Bảng Tự động: cài đặt và bật tự săn quanh chỗ đang đứng (phím T bật / tắt ngay)"}. Còn ${autoTimeText(m.left)} treo (mỗi ngày ${autoTimeText(m.max)} miễn phí).`;
}
export function setRecall(r: { label: string; secs: number } | null) { recall = r ? { ...r, t0: performance.now() } : null; }
/** Thanh niệm truyền tống (gọi trong updateStats khi không hấp thụ). Trả về true nếu đang hiện. */
export function drawRecall(ch: HTMLElement) {
  if (!recall) return false;
  const t = Math.min(recall.secs, (performance.now() - recall.t0) / 1000), sec = (x: number) => x.toFixed(1).replace(".", ",");
  ch.style.display = "block"; $("#chFill").style.width = (t / recall.secs) * 100 + "%";
  const txt = `Truyền tống tới ${recall.label} · ${sec(t)} / ${sec(recall.secs)} giây`;
  const lb = ch.querySelector<HTMLElement>(".label")!;
  if (lb.textContent !== txt) lb.textContent = txt;
  ch.classList.remove("risk"); ch.style.setProperty("--c", "#8fe0ff");
  return true;
}

/** Tên và màu một món trong túi (cho toast đồ nhận được, feedback.ts). */
export const bagItemInfo = (it: BagItem) => ({ name: itemName(it), color: itemColor(it) });
