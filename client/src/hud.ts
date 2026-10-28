// Giao diện HTML phủ lên canvas (chữ tiếng Việt hiển thị sắc nét hơn vẽ trong canvas).
import { NpcActions, closeNpc, npcDefOpen, npcPage, renderNpc, tongBoardMsg, tongMsg } from "./hudNpc.ts";
import { itemColor, itemName, toggleBag } from "./hudBag.ts";
import { toggleRoster } from "./hudRoster.ts";
import { VOHON, tierOfYears, itemDef, formatYears, MAPS, NPCS, formatHonTe, WAYPOINT_CAST, QUESTS, QUEST_STARTER, QUEST_AFTER, questChain, questRewardText, questBoneText, type QuestReward, type QuestStep, DAILY, RESONANCE, RESONANCE_RANK_PAGE_SIZE, resonanceText, ARENA, type ArenaRecord } from "../../shared/data.ts";

import { artUrl } from "./uiArt.ts";
import { toggleChar } from "./charPanel.ts";
import { chatLine, chatWhisperTo } from "./chat.ts";
import { el, pbtn } from "./domBtn.ts";
import { resolveQuestMarker } from "./nameplate.ts";
import type { PortalInfo, BagItem, PartyView, QuestMsg, DailyMsg, ResonanceMsg, ResonanceTopMsg, ChannelsMsg, WorldMsg, AutoMsg, FriendsMsg } from "./net.ts";
import { autoTimeText, TONG_MON, TONG_POINTS, TONG_WEEK_MIN, TONG_WEEK_REWARD, tongDef, FRIEND_MAX, BLOCK_MAX, type TongRank } from "../../shared/data.ts";
import { ringColor } from "./hudBar.ts";

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
import { mmss } from "./hudBoss.ts";

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



// ---------- Nhiệm vụ: chuỗi cố định (tân thủ của Ngọc Tiểu Cương, chương 2 của Triệu Vô Cực…; mục 5.8, bước 6.2, #190) ----------
let questMsg: QuestMsg | null = null; // tin "quest" gần nhất của chuỗi tân thủ (tiến độ do server giữ)
const questMsgs = new Map<string, QuestMsg>(); // tin "quest" gần nhất của từng chuỗi cố định (kể cả tân thủ)
const questFold = new Set<string>();  // mã chuỗi đang thu gọn trong khung theo dõi
export let dailyMsg: DailyMsg | null = null; // tin "daily" gần nhất (khảo hạch hằng ngày, server giữ tiến độ)
let dailyFold = false;
/** Tiến độ chuỗi mà NPC `id` giao (null = NPC không giao nhiệm vụ, chưa nhận tin "quest", hoặc chuỗi chưa mở theo QUEST_AFTER). */
export const questOf = (id: string) => {
  const q = [...questMsgs.values()].find((m) => questChain(m.chain)?.giver === id), after = q && QUEST_AFTER[q.chain];
  return q && (!after || questMsgs.get(after)?.status === "done") ? q : null;
};
/**
 * Chuỗi cố định đang theo dõi (#190, chung cho mọi chuỗi trong QUESTS): đã có tin "quest", đã mở (chuỗi QUEST_AFTER của nó đã xong),
 * chưa xong cả chuỗi; theo thứ tự QUESTS. Khung theo dõi, dấu NPC và chỉ đường bản đồ nhỏ cùng đọc danh sách này.
 */
export function questTracked(): QuestMsg[] {
  return QUESTS.map((c) => questMsgs.get(c.id)).filter((q): q is QuestMsg => !!q && q.status !== "done" && questOf(questChain(q.chain)?.giver ?? "") === q);
}
/** Tin "quest": vẽ lại khung theo dõi, và hộp thoại nếu đang mở với NPC giao nhiệm vụ. */
export function setQuest(q: QuestMsg) {
  questMsgs.set(q.chain, q);
  if (q.chain === QUEST_STARTER) questMsg = q;
  renderQuestTracker();
  if (npcDefOpen && questOf(npcDefOpen.id)) renderNpc();
}
const giverOf = (chain: string) => { const c = questChain(chain); return { c, npc: NPCS.find((n) => n.id === c?.giver), where: c ? MAPS[c.map]?.name : "" }; };
/** Các mục tiêu của bước `s` kèm tiến độ x/N (`prog` null = chưa nhận: chỉ ghi số cần). */
function questGoals(s: QuestStep, prog: number[] | null) {
  const box = document.createElement("div");
  s.goals.forEach((g, i) => {
    const n = prog ? Math.min(g.n, prog[i] ?? 0) : null, row = document.createElement("div");
    row.className = "qg" + (n !== null && n >= g.n ? " ok" : "");
    row.innerHTML = "<span></span><em></em>";
    row.querySelector("span")!.textContent = (n !== null && n >= g.n ? "√ " : "• ") + g.text;
    row.querySelector("em")!.textContent = n === null ? `×${g.n}` : `${n}/${g.n}`;
    box.appendChild(row);
  });
  return box;
}
/**
 * Khung theo dõi trên màn hình: mỗi chuỗi cố định đang theo dõi một mục (questTracked: tân thủ, rồi chương 2 khi đã mở… tên bài, mục
 * tiêu x/N, gợi ý gặp / quay về NPC giao bài; xong cả chuỗi thì bỏ mục đó), rồi mục "Hằng ngày" (khảo hạch của Phất Lan Đức); bấm /
 * chạm tiêu đề từng mục để thu gọn. Không còn gì để theo dõi thì ẩn.
 */
function renderQuestTracker() {
  const el = $("#quest"); el.innerHTML = "";
  let any = false;
  for (const q of questTracked()) any = renderChainTracker(el, q) || any;
  const daily = renderDailyTracker(el);
  el.hidden = !any && !daily;
}
/**
 * Nút bấm / chạm của khung theo dõi (#190): `pointerdown` + preventDefault như thanh hồn kỹ (chạm trên điện thoại không phải lúc nào
 * cũng sinh `click`); `click` không kèm số lần nhấn chuột (detail 0) là Enter / Space từ bàn phím.
 */
function onTap(b: HTMLElement, fn: () => void) {
  b.addEventListener("pointerdown", (e) => { if (e.button === 0) { e.preventDefault(); fn(); } });
  b.addEventListener("click", (e) => { if (e.detail === 0) fn(); });
}
function renderChainTracker(el: HTMLElement, q: QuestMsg) {
  const { c, npc, where } = giverOf(q.chain), s = c?.steps[q.step];
  if (!c || !s) return false;
  const fold = questFold.has(q.chain), sec = document.createElement("div"); sec.className = "qsec"; sec.dataset.chain = q.chain;
  const head = document.createElement("button"); head.type = "button"; head.className = "qhead"; head.setAttribute("aria-expanded", String(!fold));
  head.innerHTML = "<b></b><i></i>";
  head.querySelector("b")!.textContent = `${s.name}${q.status === "offer" ? " !" : q.status === "ready" ? " ?" : ""}`;
  head.querySelector("i")!.textContent = `${q.step + 1}/${c.steps.length} ${fold ? "▸" : "▾"}`;
  head.title = fold ? `Mở mục ${c.name}` : `Thu gọn mục ${c.name}`;
  onTap(head, () => { if (!questFold.delete(q.chain)) questFold.add(q.chain); renderQuestTracker(); });
  sec.appendChild(head);
  const sub = document.createElement("small"); sub.textContent = c.name; sec.appendChild(sub);
  el.appendChild(sec);
  if (fold) return true;
  el = sec;
  const tip = (text: string) => { const t = document.createElement("div"); t.className = "qtip"; t.textContent = text; el.appendChild(t); };
  if (q.status === "offer") { tip(`Gặp ${npc?.name ?? "NPC"} ở ${where} để nhận bài này.`); return true; }
  el.appendChild(questGoals(s, q.prog));
  if (s.reward.bones?.length) el.appendChild(questRewardEl({ honTe: 0, items: [], bones: s.reward.bones }, "Thưởng thêm")); // hồn cốt (#285)
  if (q.status === "ready") tip(`Đã xong: quay về gặp ${npc?.name ?? "NPC"} ở ${where} để nhận thưởng.`);
  else { const d = document.createElement("small"); d.textContent = s.desc; el.appendChild(d); }
  return true;
}
/** Dòng "Phần thưởng: …" của một bài; hồn cốt thưởng (#285) tô màu theo niên hạn như hồn hoàn. */
function questRewardEl(r: QuestReward, label = "Phần thưởng") {
  const el = document.createElement("span"); el.className = "qrew";
  const rest = questRewardText({ ...r, bones: [] });
  el.append(`${label}: ${rest}`);
  (r.bones ?? []).forEach((b, i) => {
    if (rest || i) el.append(", ");
    const c = document.createElement("b"); c.style.color = ringColor(tierOfYears(b.years)); c.textContent = questBoneText(b); el.appendChild(c);
  });
  return el;
}
/** Trang nhiệm vụ trong hộp thoại NPC giao nhiệm vụ: lời giao + mục tiêu + thưởng + "Nhận", tiến độ, lời khi trả + "Trả", lời kết. */
export function renderQuestPage(el: HTMLElement, act: NpcActions) {
  const q = npcDefOpen ? questOf(npcDefOpen.id) : null, c = q && questChain(q.chain);
  const say = (t: string) => { const p = document.createElement("p"); p.className = "nline"; p.textContent = t; el.appendChild(p); };
  if (!q || !c) { say("…"); return; }
  if (q.status === "done") { say(c.finale); const k = document.createElement("small"); k.className = "rnote"; k.textContent = `Đã học xong cả ${c.steps.length} bài của "${c.name}".`; el.appendChild(k); return; }
  const s = c.steps[q.step];
  const box = document.createElement("div"); box.className = "qbox";
  const h = document.createElement("b"); h.textContent = `Bài ${q.step + 1}/${c.steps.length}: ${s.name}`; box.appendChild(h);
  const d = document.createElement("span"); d.textContent = s.desc; box.appendChild(d);
  box.appendChild(questGoals(s, q.status === "offer" ? null : q.prog));
  box.appendChild(questRewardEl(s.reward));
  const lines = q.status === "ready" ? s.done : q.status === "offer" ? s.offer : [s.desc];
  if (q.status !== "active") for (const t of lines) say(t);
  else say("Chưa xong đâu. Làm đủ các mục tiêu rồi quay lại báo ta.");
  el.appendChild(box);
  const row = document.createElement("div"); row.className = "brow";
  const b = document.createElement("button"); b.type = "button"; b.className = "buse " + (q.status === "active" ? "use" : "absorb");
  b.textContent = q.status === "offer" ? "Nhận nhiệm vụ" : q.status === "ready" ? "Trả nhiệm vụ, nhận thưởng" : "Đang làm…";
  b.disabled = q.status === "active";
  b.addEventListener("click", () => { b.blur(); act.quest(q.status === "offer" ? "accept" : "turnin", q.chain === QUEST_STARTER ? undefined : q.chain); });
  row.appendChild(b); el.appendChild(row);
}
/** Mã NPC giao nhiệm vụ (để GameScene vẽ dấu "!" / "?" trên đầu), kể cả người ra khảo hạch hằng ngày. */
export const QUEST_GIVERS = new Set([...QUESTS.map((c) => c.giver), DAILY.giver]);
/**
 * Dấu trên đầu NPC `id`: "offer" có bài mới, "ready" có bài chờ trả, "active" đang làm, null = không có gì (xong hết / không giao).
 * Người ra khảo hạch hằng ngày gộp cả bộ bài: chờ trả trước, rồi bài mới, rồi đang làm.
 */
export function questMarker(id: string) {
  const statuses = questTracked().filter((q) => questChain(q.chain)?.giver === id).map((q) => q.status);
  if (id === DAILY.giver) statuses.push(...(dailyMsg?.list ?? []).map((q) => q.status));
  return resolveQuestMarker(statuses);
}
export function dailyMark(): "offer" | "ready" | "active" | null {
  const l = dailyMsg?.list ?? [];
  return l.some((x) => x.status === "ready") ? "ready" : l.some((x) => x.status === "offer") ? "offer" : l.some((x) => x.status === "active") ? "active" : null;
}

// ---------- Khảo hạch hằng ngày của Phất Lan Đức (mục 5.8 "Nhiệm vụ hằng ngày") ----------
/** Tin "daily": vẽ lại khung theo dõi (mục "Hằng ngày") và hộp thoại nếu đang mở với Phất Lan Đức. */
export function setDaily(m: DailyMsg) {
  dailyMsg = m;
  renderQuestTracker();
  if (npcDefOpen?.id === DAILY.giver) renderNpc();
}
/** Mục "Hằng ngày" hiện trong khung theo dõi khi đã xong chuỗi tân thủ, đã nhận bài hôm nay, hoặc đang ở bản đồ của Phất Lan Đức. */
const dailyShown = (mapId: string) => !!dailyMsg &&
  (questMsg?.status === "done" || dailyMsg.list.some((x) => x.status !== "offer") || mapId === DAILY.map);
let trackerMap = "";
/** Bản đồ đang đứng (GameScene gọi khi vào bản đồ): quyết định có hiện mục "Hằng ngày" khi chưa nhận bài nào. */
export function setTrackerMap(mapId: string) { trackerMap = mapId; renderQuestTracker(); }
/** Khảo hạch hằng ngày gần nhất (GameScene chấm mục tiêu lên bản đồ nhỏ); mục "Hằng ngày" đang ẩn thì chỉ trả bài đã nhận. */
export function dailyList() {
  const l = dailyMsg?.list ?? [];
  return dailyShown(trackerMap) ? l : l.filter((x) => x.status === "active" || x.status === "ready");
}
/** Mục "Hằng ngày" trong khung theo dõi: bài đã nhận (mục tiêu x/N), bài chưa nhận / đã xong tóm một dòng; bấm tiêu đề để thu gọn. */
function renderDailyTracker(el: HTMLElement) {
  const m = dailyMsg; if (!m || !dailyShown(trackerMap)) return false;
  const npc = NPCS.find((n) => n.id === DAILY.giver), where = MAPS[DAILY.map]?.name ?? "";
  const done = m.list.filter((x) => x.status === "done").length, mark = dailyMark();
  const sec = document.createElement("div"); sec.className = "qsec";
  const head = document.createElement("button"); head.type = "button"; head.className = "qhead"; head.setAttribute("aria-expanded", String(!dailyFold));
  head.innerHTML = "<b></b><i></i>";
  head.querySelector("b")!.textContent = `Hằng ngày${mark === "offer" ? " !" : mark === "ready" ? " ?" : ""}`;
  head.querySelector("i")!.textContent = `${done}/${m.list.length} ${dailyFold ? "▸" : "▾"}`;
  head.title = dailyFold ? "Mở mục Hằng ngày" : "Thu gọn mục Hằng ngày";
  onTap(head, () => { dailyFold = !dailyFold; renderQuestTracker(); });
  sec.appendChild(head);
  const sub = document.createElement("small"); sub.textContent = DAILY.name; sec.appendChild(sub);
  el.appendChild(sec);
  if (dailyFold) return true;
  const tip = (text: string) => { const t = document.createElement("div"); t.className = "qtip"; t.textContent = text; sec.appendChild(t); };
  for (const q of m.list) {
    if (q.status !== "active" && q.status !== "ready") continue;
    const s = questChain(q.chain)?.steps[0]; if (!s) continue;
    const n = document.createElement("div"); n.className = "qname"; n.textContent = s.name; sec.appendChild(n);
    sec.appendChild(questGoals(s, q.prog));
  }
  const offer = m.list.filter((x) => x.status === "offer").length, ready = m.list.filter((x) => x.status === "ready").length;
  if (ready) tip(`Đã xong ${ready} bài: gặp ${npc?.name ?? "NPC"} ở ${where} để nhận thưởng.`);
  if (offer) tip(`Còn ${offer} bài chưa nhận: gặp ${npc?.name ?? "NPC"} ở ${where}.`);
  if (done === m.list.length) { const k = document.createElement("small"); k.textContent = "Đã xong khảo hạch hôm nay · bài mới lúc 0:00 (giờ Việt Nam)."; sec.appendChild(k); }
  return true;
}
/** Trang khảo hạch trong hộp thoại Phất Lan Đức: mỗi bài một khung (mục tiêu, thưởng, lời giao / lời trả) và nút nhận / trả riêng. */
/** Trang tông vụ hôm nay (#197) ở sứ giả tông mình: như khảo hạch hằng ngày, thưởng Hồn Tệ và điểm tông. */
export function renderTongTasks(el: HTMLElement, act: NpcActions) {
  const say = (t: string) => { const p = document.createElement("p"); p.className = "nline"; p.textContent = t; el.appendChild(p); };
  const l = tongMsg?.tasks;
  if (!l?.length) { say("…"); return; }
  say(l.every((x) => x.status === "done") ? questChain(l[0].chain)?.finale ?? "" :
    `Tông vụ hôm nay ${l.length} bài, mỗi bài ${TONG_POINTS} điểm tông. Nửa đêm có bài mới, bài dở dang bỏ luôn.`);
  l.forEach((q, i) => {
    const s = questChain(q.chain)?.steps[0]; if (!s) return;
    const box = document.createElement("div"); box.className = "qbox" + (q.status === "done" ? " qdone" : "");
    const h = document.createElement("b"); h.textContent = `Bài ${i + 1}/${l.length}: ${s.name}${q.status === "done" ? " (đã xong)" : ""}`; box.appendChild(h);
    if (q.status !== "done") {
      const d = document.createElement("span"); d.textContent = s.desc; box.appendChild(d);
      box.appendChild(questGoals(s, q.status === "offer" ? null : q.prog));
      const r = document.createElement("span"); r.className = "qrew"; r.textContent = `Phần thưởng: ${questRewardText(s.reward)}, ${TONG_POINTS} điểm tông`; box.appendChild(r);
      const line = q.status === "offer" ? s.offer.at(-1) : q.status === "ready" ? s.done[0] : "";
      if (line) { const p = document.createElement("i"); p.className = "qsay"; p.textContent = line; box.appendChild(p); }
      const b = document.createElement("button"); b.type = "button"; b.className = "buse " + (q.status === "active" ? "use" : "absorb");
      b.textContent = q.status === "offer" ? "Nhận bài" : q.status === "ready" ? "Trả bài, nhận thưởng" : "Đang làm…";
      b.disabled = q.status === "active";
      b.addEventListener("click", () => { b.blur(); act.tong(q.status === "offer" ? "accept" : "turnin", undefined, q.chain); });
      box.appendChild(b);
    }
    el.appendChild(box);
  });
}

/** Trang bảng tông tuần (#197): điểm trung bình thành viên hoạt động từng tông, top cá nhân tông mình, thưởng tuần trước. */
export function renderTongRank(el: HTMLElement, act: NpcActions) {
  const m = tongBoardMsg, mine = tongMsg?.tong ?? "";
  const say = (t: string) => { const p = document.createElement("p"); p.className = "nline"; p.textContent = t; el.appendChild(p); };
  if (!m) { say("…"); return; }
  const table = (rows: TongRank[], first: string[]) => {
    const tb = document.createElement("div"); tb.className = "qbox";
    const sorted = TONG_MON.map((t) => rows.find((r) => r.tong === t.id) ?? { tong: t.id, active: 0, avg: 0 }).sort((a, b) => b.avg - a.avg);
    for (const r of sorted) {
      const t = tongDef(r.tong), line = document.createElement("span");
      line.textContent = `${first.includes(r.tong) ? "★ " : ""}${t?.name ?? r.tong}: ${r.avg.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} điểm trung bình, ${r.active} người hoạt động`;
      if (t) line.style.color = t.col;
      if (r.tong === mine) line.style.fontWeight = "bold";
      tb.appendChild(line);
    }
    return tb;
  };
  const cur = m.cur.tongs, best = Math.max(0, ...cur.filter((r) => r.active > 0).map((r) => r.avg));
  say(`Tuần này: ngươi có ${m.me} điểm tông (cần ${m.min} điểm để là thành viên hoạt động). Xếp theo điểm trung bình của thành viên hoạt động.`);
  el.appendChild(table(cur, cur.filter((r) => r.active > 0 && r.avg === best).map((r) => r.tong)));
  const top = m.cur.top[mine] ?? [];
  if (top.length) {
    const tb = document.createElement("div"); tb.className = "qbox";
    const h = document.createElement("b"); h.textContent = `Top ${tongDef(mine)?.name ?? ""} tuần này`; tb.appendChild(h);
    top.forEach((x, i) => { const s2 = document.createElement("span"); s2.textContent = `${i + 1}. ${x.name}: ${x.points} điểm`; tb.appendChild(s2); });
    el.appendChild(tb);
  }
  const L = m.last, R = L.reward ? TONG_WEEK_REWARD[L.reward] : null;
  say(`Tuần trước: ${L.first.length ? `hạng nhất ${L.first.map((x) => tongDef(x)?.name ?? x).join(", ")}` : "chưa tông nào có thành viên hoạt động"}; ngươi có ${L.points} điểm${L.tong ? ` ở ${tongDef(L.tong)?.name ?? L.tong}` : ""}.`);
  el.appendChild(table(L.board.tongs, L.first));
  const b = document.createElement("button"); b.type = "button"; b.className = "buse absorb";
  b.textContent = L.claimed ? "Đã nhận thưởng tuần trước" : R ? `Nhận thưởng tuần: ${formatHonTe(R.honTe)} và ${R.shards} mảnh võ hồn` : `Tuần trước chưa đủ ${TONG_WEEK_MIN} điểm: không có thưởng`;
  b.disabled = L.claimed || !R;
  b.addEventListener("click", () => { b.blur(); act.tong("claim"); });
  el.appendChild(b);
}

export function renderDailyPage(el: HTMLElement, act: NpcActions) {
  const m = dailyMsg;
  const say = (t: string, to: HTMLElement = el) => { const p = document.createElement("p"); p.className = "nline"; p.textContent = t; to.appendChild(p); };
  if (!m) { say("…"); return; }
  const done = m.list.filter((x) => x.status === "done").length;
  say(done === m.list.length ? questChain(m.list[0]?.chain ?? "")?.finale ?? "" : `Khảo hạch hôm nay ${m.list.length} bài, làm bài nào trước cũng được. Nửa đêm ta đổi bài mới, bài dở dang bỏ luôn!`);
  m.list.forEach((q, i) => {
    const s = questChain(q.chain)?.steps[0]; if (!s) return;
    const box = document.createElement("div"); box.className = "qbox" + (q.status === "done" ? " qdone" : "");
    const h = document.createElement("b"); h.textContent = `Bài ${i + 1}/${m.list.length}: ${s.name}${q.status === "done" ? " (đã xong)" : ""}`; box.appendChild(h);
    if (q.status !== "done") {
      const d = document.createElement("span"); d.textContent = s.desc; box.appendChild(d);
      box.appendChild(questGoals(s, q.status === "offer" ? null : q.prog));
      box.appendChild(questRewardEl(s.reward));
      const line = q.status === "offer" ? s.offer.at(-1) : q.status === "ready" ? s.done[0] : "";
      if (line) { const p = document.createElement("i"); p.className = "qsay"; p.textContent = line; box.appendChild(p); }
      const b = document.createElement("button"); b.type = "button"; b.className = "buse " + (q.status === "active" ? "use" : "absorb");
      b.textContent = q.status === "offer" ? "Nhận bài" : q.status === "ready" ? "Trả bài, nhận thưởng" : "Đang làm…";
      b.disabled = q.status === "active";
      b.addEventListener("click", () => { b.blur(); act.quest(q.status === "offer" ? "accept" : "turnin", q.chain); });
      box.appendChild(b);
    }
    el.appendChild(box);
  });
}

// ---------- Đại Đấu Hồn Trường (mục 5.9, bước 7.2): đang tìm trận, thanh trận đấu, kết quả, bảng xếp hạng ----------
/** Tin riêng "arenaTop": ARENA.topN dòng đầu (dòng của mình có `me`), hạng của mình, lượt thắng có thưởng còn lại hôm nay. */
export interface ArenaTopMsg {
  list: { name: string; elo: number; wins: number; losses: number; draws: number; me: boolean }[];
  me: (ArenaRecord & { rank: number }) | null; start: number; left: number; queued: boolean;
}
/**
 * Tin "arena" k = "end": kết quả trận của mình (score 1 thắng, 0,5 hòa, 0 thua), Elo trước / sau, phần thưởng (null = không có).
 * `friendly` (9.7): cặp đã đấu đủ ARENA.pairDaily trận tính Elo hôm nay, trận này giao hữu (không đổi Elo, không thưởng, không mất lượt);
 * cũng đặt cho bên thắng trận bỏ cuộc (`reason` "noshow", #790). `eloCapped` (#791): hôm nay đã cộng đủ ARENA.eloDaily Elo, trận không cộng Elo / thưởng.
 */
export interface ArenaEndMsg {
  score: number; reason: string; why: string; foe: string; elo0: number; elo1: number; rec: ArenaRecord;
  reward: { honTe: number; code: string; qty: number; coin: number } | null; left: number; secs: number; friendly?: boolean; eloCapped?: boolean;
}
export let arenaQ: { elo: number; t0: number } | null = null;   // đang xếp hàng: Elo, lúc bắt đầu chờ (performance.now)
export let arenaTopMsg: ArenaTopMsg | null = null;
let arenaEndMsg: (ArenaEndMsg & { end: number; act: { back(): void; top(): void } }) | null = null;
let arenaLeaveAt = 0;                                    // bấm "Rời sân" lần đầu (giữa trận phải bấm hai lần: rời = thua)
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "±0");

/** Ô "Đang tìm đối thủ…" (tin "arena" k = "queue"): Elo, thời gian chờ, nút Hủy (chuột / chạm). null = ẩn. */
export function setArenaQueue(q: { elo: number; secs: number } | null, cancel: () => void) {
  arenaQ = q ? { elo: q.elo, t0: performance.now() - q.secs * 1000 } : null;
  const el = $("#arenaQ");
  if (!arenaQ) { el.hidden = true; el.innerHTML = ""; }
  else {
    el.innerHTML = `<span class="spin"></span><div><b>Đang tìm đối thủ…</b><small></small></div><button type="button">Hủy</button>`;
    el.querySelector("button")!.addEventListener("pointerdown", (e) => { e.preventDefault(); cancel(); });
    el.hidden = false; updateArenaQueue();
  }
  if (npcDefOpen?.role === "arena") renderNpc();
}
/** Mỗi lần cập nhật HUD: thời gian đã chờ. */
export function updateArenaQueue() {
  const s = arenaQ && $("#arenaQ small"); if (!s || !arenaQ) return;
  const txt = `Elo ${arenaQ.elo} · đã chờ ${mmss((performance.now() - arenaQ.t0) / 1000)}`;
  if (s.textContent !== txt) s.textContent = txt;
}

/** Tin "arena" k = "live" (#280): trận đang đếm ngược / giao đấu; `secs` tính lúc server trả lời. */
export interface ArenaLiveMsg {
  list: { roomId: string; mode: string; sides: { name: string; elo: number }[]; phase: string; secs: number; watchers: number; max: number }[];
}
let arenaLiveMsg: (ArenaLiveMsg & { t0: number }) | null = null;
export let arenaLiveAt = -1e9;                                 // lần xin danh sách gần nhất (performance.now), server chỉ trả mỗi ARENA.topCd giây
export function arenaLiveAsk(act: NpcActions) { arenaLiveAt = performance.now(); act.arena("live"); }
/** Tin "arena" k = "live": lưu và vẽ lại trang danh sách nếu đang mở. */
export function setArenaLive(m: ArenaLiveMsg) {
  arenaLiveMsg = { list: Array.isArray(m.list) ? m.list : [], t0: performance.now() };
  if (npcDefOpen?.role === "arena" && npcPage === "live") renderNpc();
}
const liveSecs = (l: ArenaLiveMsg["list"][number], t0: number) => Math.max(0, l.secs - Math.floor((performance.now() - t0) / 1000));
const liveClock = (l: ArenaLiveMsg["list"][number], t0: number) => `${l.phase === "ready" ? "đếm ngược" : "còn"} ${mmss(liveSecs(l, t0))}`;
export function arenaLiveEl(act: NpcActions) {
  const box = document.createElement("div"); box.className = "alive";
  const m = arenaLiveMsg;
  if (!m) { const p = document.createElement("div"); p.className = "rnote"; p.textContent = "Đang xin danh sách…"; box.appendChild(p); return box; }
  if (!m.list.length) { const p = document.createElement("div"); p.className = "rnote"; p.textContent = "Chưa có trận nào đang diễn ra."; box.appendChild(p); return box; }
  for (const l of m.list) {
    const row = document.createElement("div"); row.className = "arow";
    const info = document.createElement("div"); info.className = "ainfo";
    const t = document.createElement("b"); t.textContent = `${l.mode} · ${l.sides.map((x) => `${x.name} (${x.elo})`).join("  ⚔  ")}`;
    const s = document.createElement("small"); s.textContent = `${l.phase === "ready" ? "Chuẩn bị" : "Giao đấu"} · `;
    const c = document.createElement("span"); c.className = "alvc"; c.dataset.i = String(m.list.indexOf(l)); c.textContent = liveClock(l, m.t0);
    s.append(c, ` · ${l.watchers}/${l.max} người xem`);
    info.append(t, s);
    const b = document.createElement("button"); b.type = "button"; b.className = "buse absorb"; b.textContent = "Xem"; b.disabled = l.watchers >= l.max;
    b.addEventListener("click", () => { b.blur(); act.arena("watch", l.roomId); });
    row.append(info, b); box.appendChild(row);
  }
  return box;
}
/** Mỗi lần cập nhật HUD: đồng hồ từng dòng của danh sách xem trận chạy tiếp giữa hai lần làm mới. */
export function updateArenaLive() {
  const m = arenaLiveMsg; if (!m || !$("#npc") || $("#npc").hidden) return;
  $("#npc").querySelectorAll<HTMLElement>(".alvc").forEach((e) => {
    const l = m.list[Number(e.dataset.i)], txt = l && liveClock(l, m.t0); if (txt && e.textContent !== txt) e.textContent = txt;
  });
}
/** Bảng xếp hạng (top ARENA.topN, dòng của mình sáng) kèm hạng / thành tích của mình và lượt thắng có thưởng còn lại. */
export function arenaRankEl(m: ArenaTopMsg | null) {
  const box = document.createElement("div"); box.className = "arank";
  if (!m) { box.textContent = "Đang tải bảng xếp hạng…"; return box; }
  const me = document.createElement("div"); me.className = "ame";
  me.textContent = m.me ? `Hạng ${m.me.rank} · Elo ${m.me.elo} · ${m.me.wins} thắng, ${m.me.losses} thua, ${m.me.draws} hòa`
    : `Chưa đấu trận nào (Elo khởi đầu ${m.start}).`;
  box.appendChild(me);
  const note = document.createElement("small");
  note.textContent = `Còn ${m.left}/${ARENA.dailyWins} trận thắng có thưởng hôm nay: ${formatHonTe(ARENA.winHonTe)} + ${ARENA.winShards} mảnh võ hồn mỗi trận.`;
  box.appendChild(note);
  const t = document.createElement("div"); t.className = "atable";
  t.innerHTML = `<div class="ar ah"><span>#</span><em>Hồn sư</em><i>Elo</i><i>T – B – H</i></div>`;
  m.list.forEach((r, i) => {
    const row = document.createElement("div"); row.className = "ar" + (r.me ? " me" : "");
    row.innerHTML = `<span>${i + 1}</span><em></em><i>${r.elo}</i><i>${r.wins} – ${r.losses} – ${r.draws}</i>`;
    row.querySelector("em")!.textContent = r.name;
    t.appendChild(row);
  });
  if (!m.list.length) { const e = document.createElement("small"); e.textContent = "Chưa ai đấu trận nào."; t.appendChild(e); }
  box.appendChild(t);
  return box;
}
/** Tin "arenaTop": vẽ lại trang xếp hạng trong hộp thoại NPC và bảng kết quả trận nếu đang mở. */
export function setArenaTop(m: ArenaTopMsg) {
  arenaTopMsg = m;
  if (npcDefOpen?.role === "arena") renderNpc();
  if (arenaEndMsg) renderArenaEnd();
}

/**
 * Thanh trận đấu ở đầu màn hình (phòng ArenaRoom): hai bên (tên, Elo, sinh lực cả đội theo %, số võ hồn còn đứng), đồng hồ của pha
 * (chờ vào sân, chuẩn bị, giao đấu), nút "Rời sân" (giữa trận bấm hai lần: rời = thua). null = ẩn.
 */
export function showArena(a: { phase: string; time: number; me: string; friendly: boolean; watchers: number; sides: { sid: string; name: string; elo: number; pct: number; alive: number; total: number }[];
    watch?: { follow: number; who: string; winner: number; pick(side: number): void } } | null,
  leave: () => void) {
  const el = $("#arenaBar"); document.body.classList.toggle("arena", !!a);
  if (!a) { el.hidden = true; el.innerHTML = ""; document.body.classList.remove("watching"); return; }
  if (!el.firstChild) {
    el.innerHTML = `<div class="aside a0"><b></b><small></small><div class="bar"><i></i><span></span></div></div>
      <div class="aclock"><b></b><small></small><em class="awatch" hidden></em><button type="button" class="aleave">Rời sân</button></div>
      <div class="aside a1"><b></b><small></small><div class="bar"><i></i><span></span></div></div>`;
    el.querySelector(".aleave")!.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (el.classList.contains("watching")) return leave();
      const fight = el.dataset.phase === "fight" || el.dataset.phase === "ready";
      if (fight && performance.now() - arenaLeaveAt > 3000) { arenaLeaveAt = performance.now(); el.querySelector(".aleave")!.textContent = "Rời = thua?"; return; }
      leave();
    });
  }
  el.hidden = false; el.dataset.phase = a.phase;
  const w = a.watch; el.classList.toggle("watching", !!w); document.body.classList.toggle("watching", !!w);
  a.sides.forEach((s, i) => {
    const box = el.querySelector(`.a${i}`) as HTMLElement; if (!box) return;
    const me = !w && s.sid.split(",").includes(a.me);
    box.classList.toggle("me", me);
    box.classList.toggle("follow", !!w && w.follow === i);
    if (w && !(box as HTMLElement & { _p?: boolean })._p) { (box as HTMLElement & { _p?: boolean })._p = true; box.addEventListener("pointerdown", (e) => { e.preventDefault(); arenaPick(i); }); }
    const name = `${s.name || "…"}${me ? " (đội của bạn)" : ""}`;
    if (box.querySelector("b")!.textContent !== name) box.querySelector("b")!.textContent = name;
    box.querySelector("small")!.textContent = `Elo ${s.elo}${s.sid ? "" : " · chưa vào sân"}${w && w.follow === i && w.who ? ` · theo dõi ${w.who}` : ""}`;
    (box.querySelector(".bar i") as HTMLElement).style.width = `${Math.round(s.pct * 1000) / 10}%`;
    box.querySelector(".bar span")!.textContent = `${Math.round(s.pct * 100)}% · ${s.alive}/${s.total} võ hồn`;
  });
  const ph = a.phase === "wait" ? "Chờ đối thủ vào sân" : a.phase === "ready" ? "Chuẩn bị" : a.phase === "fight" ? "Giao đấu" : "Kết thúc";
  el.querySelector(".aclock b")!.textContent = a.phase === "end" ? "–" : mmss(a.time);
  el.querySelector(".aclock small")!.textContent = a.friendly ? `${ph} · giao hữu` : ph;
  el.classList.toggle("friendly", a.friendly);
  el.title = a.friendly ? `Giao hữu: hai bạn đã đấu đủ ${ARENA.pairDaily} trận tính Elo hôm nay, trận này không đổi Elo, không thưởng.` : "";
  const lb = el.querySelector(".aleave")!, aw = el.querySelector(".awatch") as HTMLElement;
  aw.hidden = !w && !a.watchers; aw.textContent = w ? `Đang xem · ${a.watchers} người xem` : `${a.watchers} người xem`;
  arenaPick = w?.pick ?? (() => {});
  el.title = w ? "Bấm tên một bên để đổi người theo dõi (bên có hai người thì bấm lần nữa để đổi sang đồng đội)." : el.title;
  if (w) { lb.textContent = "Rời xem"; renderWatchEnd(a.phase === "end" ? a : null, a.sides, w.winner, leave); return; }
  renderWatchEnd(null, a.sides, -1, leave);
  if (performance.now() - arenaLeaveAt > 3000 && lb.textContent !== "Rời sân") lb.textContent = "Rời sân";
}
let arenaPick: (side: number) => void = () => {};
/** Bảng kết quả của người xem (không có dòng Elo / thưởng của mình): bên thắng, sinh lực / số võ hồn còn đứng mỗi bên, nút về bản đồ cũ. null = ẩn. */
function renderWatchEnd(a: { time: number } | null, sides: { name: string; elo: number; pct: number; alive: number; total: number }[], winner: number, back: () => void) {
  const el = $("#arenaEnd");
  if (!a) { if (el.dataset.w) { el.dataset.w = ""; el.hidden = true; el.innerHTML = ""; } return; }
  if (!el.dataset.w) {
    el.dataset.w = "1"; el.hidden = false; el.className = "panel watchend"; el.innerHTML = "";
    const h = document.createElement("h2"); el.appendChild(h);
    for (let i = 0; i < 2; i++) { const l = document.createElement("div"); l.className = "aline"; el.appendChild(l); }
    const row = document.createElement("div"); row.className = "brow";
    const b = document.createElement("button"); b.type = "button"; b.className = "buse absorb"; b.textContent = "Về bản đồ cũ";
    b.addEventListener("click", () => { b.blur(); back(); }); row.appendChild(b); el.appendChild(row);
    const k = document.createElement("small"); k.className = "rnote"; el.appendChild(k);
  }
  const set = (e: Element | null, t: string) => { if (e && e.textContent !== t) e.textContent = t; };
  const win = winner === 0 || winner === 1 ? sides[winner] : null;
  set(el.querySelector("h2"), win ? `${win.name} thắng` : "Hòa");
  el.querySelectorAll(".aline").forEach((l, i) => { const s = sides[i]; if (s) set(l, `${s.name} (Elo ${s.elo}): ${Math.round(s.pct * 100)}% sinh lực · ${s.alive}/${s.total} võ hồn còn đứng`); });
  set(el.querySelector("small"), `Tự về bản đồ cũ sau ${Math.max(0, Math.ceil(a.time))} giây.`);
}

/** Bảng kết quả trận (tin "arena" k = "end"): thắng / thua / hòa, lý do, Elo trước → sau, phần thưởng, bảng xếp hạng, nút về bản đồ. */
export function arenaEnd(m: ArenaEndMsg | null, act: { back(): void; top(): void }) {
  arenaEndMsg = m ? { ...m, end: performance.now() + m.secs * 1000, act } : null;
  if (!m) { const el = $("#arenaEnd"); el.hidden = true; el.innerHTML = ""; el.dataset.w = ""; return; }
  $("#arenaEnd").dataset.w = "";
  renderArenaEnd();
}
function renderArenaEnd() {
  const m = arenaEndMsg, el = $("#arenaEnd"); if (!m) return;
  el.hidden = false; el.innerHTML = "";
  el.className = "panel " + (m.score === 1 ? "win" : m.score === 0 ? "lose" : "draw");
  const h = document.createElement("h2"); h.textContent = m.score === 1 ? "Thắng!" : m.score === 0 ? "Thua" : "Hòa"; el.appendChild(h);
  const line = (text: string, cls = "") => { const p = document.createElement("div"); p.className = "aline " + cls; p.textContent = text; el.appendChild(p); };
  const noshow = m.reason === "noshow";
  if (m.friendly) line(noshow ? "Đối thủ bỏ cuộc: trận không tính Elo, không thưởng." : `Trận giao hữu: hai bạn đã đấu đủ ${ARENA.pairDaily} trận tính Elo hôm nay (đặt lại 00:00 giờ Việt Nam).`, "afriend");
  else if (m.eloCapped) line(`Hôm nay bạn đã cộng đủ ${ARENA.eloDaily} Elo: trận này không cộng Elo, không thưởng (đặt lại 00:00 giờ Việt Nam).`, "afriend");
  line(`Đối thủ ${m.foe}: ${m.why}.`);
  line(m.friendly ? `Elo giữ nguyên: ${m.elo1}` : `Elo ${m.elo0} → ${m.elo1} (${signed(m.elo1 - m.elo0)})`, "aelo");
  line(`Thành tích: ${m.rec.wins} thắng · ${m.rec.losses} thua · ${m.rec.draws} hòa`);
  if (m.friendly) line(noshow ? "Không thưởng, không tính thành tích, không mất lượt thắng có thưởng." : "Giao hữu không thưởng, không tính thành tích, không mất lượt thắng có thưởng.");
  else if (m.reward) {
    const shard = m.reward.qty ? ` + ${m.reward.qty} ${itemDef(m.reward.code)?.name ?? m.reward.code}` : "";
    line(`Thưởng: ${formatHonTe(m.reward.honTe)}${shard}${m.reward.coin ? " (túi đầy: mảnh đổi ra Hồn Tệ)" : ""}`, "arew");
  } else if (m.score === 1 && !m.eloCapped) line("Hết lượt thắng có thưởng hôm nay (Elo vẫn tính).");
  else if (m.score === 0 && noshow) line("Bỏ cuộc bị tính như thua: trừ Elo, không mất kinh nghiệm hay đồ.");
  else line("Thua không mất gì: không mất kinh nghiệm hay đồ.");
  line(`Còn ${m.left}/${ARENA.dailyWins} trận thắng có thưởng hôm nay.`);
  el.appendChild(arenaRankEl(arenaTopMsg));
  const row = document.createElement("div"); row.className = "brow";
  const b = document.createElement("button"); b.type = "button"; b.className = "buse absorb"; b.textContent = "Về bản đồ cũ";
  b.addEventListener("click", () => { b.blur(); m.act.back(); }); row.appendChild(b);
  const t = document.createElement("button"); t.type = "button"; t.className = "buse use"; t.textContent = "Xem lại bảng xếp hạng";
  t.addEventListener("click", () => { t.blur(); m.act.top(); }); row.appendChild(t);
  el.appendChild(row);
  const k = document.createElement("small"); k.className = "rnote acd"; el.appendChild(k);
  updateArenaEnd();
}
/** Mỗi lần cập nhật HUD: số giây trước khi tự về bản đồ cũ. */
export function updateArenaEnd() {
  const m = arenaEndMsg, k = m && $("#arenaEnd .acd"); if (!m || !k) return;
  const txt = `Tự về bản đồ cũ sau ${Math.max(0, Math.ceil((m.end - performance.now()) / 1000))} giây.`;
  if (k.textContent !== txt) k.textContent = txt;
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
