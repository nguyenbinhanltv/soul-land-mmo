// Giao diện HTML phủ lên canvas (chữ tiếng Việt hiển thị sắc nét hơn vẽ trong canvas).
import { TIERS, VOHON, HE, type He, ringLimit, tierOfYears, vohonIndex, TEAM_SIZE, SWITCH_CD, TIEN_CO_MAX, skillsOf, tienCoOf, skillPower,
  BUFF_IDS, BUFFS, buffBit, STATUS_IDS, STATUS, statusBit, ITEM_KINDS, DAN_CD, itemDef, honTeParts, RING_ITEM, tierBand, formatYears,
  MAX_RINGS, MAX_LEVEL, atBottleneck, PHONG_LOI, MAX_STARS, SHARD_UNLOCK, starCost, starSkillMult, starCdMult, starTienCoMult, starRing, MAPS, bondsOf, PLAYER_STATUS,
  BEAST_BUFF_IDS, BEAST_BUFFS, beastBuffBit,
  BONE_ITEM, BONE_SLOTS, BONE_STAT_NAMES, boneSlotIndex, boneStats, boneName, parseBone, boneBonus, calcStats, BAG_SLOTS, BAG_PAGE, type BoneStat, type CoreStat,
  CORE_ITEM, CORE_SETS, coreSetIndex, parseCore, coreName, coreMainValue, coreStatText,
  CORE_SLOTS, CORE_SET_2, CORE_SET_4, CORE_STAT_IDS, CORE_STATS, coreSlotOf, coreBonus, coreSetCounts,
  BONE_ACTIVE_SLOTS, boneSkillOf, passiveText, buffPower,
  BONE_MAX_ENHANCE, BONE_FEED_MAX, BONE_FEED_SAME_SLOT, boneXp, boneEnhancePreview, boneEnhanceNeed, boneFeedXp, boneSkillMult, boneMilestones,
  BONE_ENHANCE_MILESTONES, BONE_MAX_SUBS, BONE_SUB_POOL, parseBoneSubs, boneSubsDue, KING, WORLD, NPCS, shopOf, shopExpands, SHOP_MAX_QTY, sellPrice, BUYBACK_MAX, BAG_EXPAND, BAG_MAX_SLOTS, bagExpandCost, formatHonTe, BONE_ENHANCE_FEE, CORE_ENHANCE_FEE, enhanceFee, SHARD_BUY, shardBuyPrice, shardBuyCost, ARENA_SHARDS, shardCode, WAYPOINT_CAST, type NpcDef, type NpcRole,
  CORE_MAX_ENHANCE, CORE_FEED_MAX, CORE_FEED_SAME_SET, CORE_SUB_EVERY, CORE_MAX_SUBS, coreXp, coreEnhancePreview, coreEnhanceNeed, coreFeedXp,
  QUESTS, QUEST_STARTER, QUEST_AFTER, questChain, questRewardText, type QuestStep, DAILY, RESONANCE, RESONANCE_RANK_PAGE_SIZE, resonanceText,
  herbDef, herbBonus, HERB_MAX, HERB_PCT, RES_STAT_NAMES,
  AUTO_SELL_FREE, AUTO_SELL_BUYBACK, AUTO_SELL_GUARD, SELL_DEFAULTS, autoSellable, MAX_YEARS, MAX_CORE_STARS, type SellSettings,

  ringSkill, skillChoices, loadoutOf, LOADOUT_SIZE, HIGH_RINGS, CHAN_THAN_RING, chanThanOf, chanThanStats, CHAN_THAN_SKILL_SLOT, CHAN_THAN_SKILL_CD, FUSION, FUSIONS, fusionsOf, type SkillDef, type ChanThanDef, type ChanThanStat, ARENA, type ArenaRecord } from "../../shared/data.ts";
import { boneSvg } from "./boneIcons.ts";
import { coreSvg } from "./coreIcons.ts";
import { vohonCard } from "./cards.ts";
import { artImg, tintedUrl } from "./uiArt.ts";
import type { OwnedVohons, Squad, PortalInfo, BagMsg, BagItem, BuybackItem, PartyView, QuestMsg, DailyMsg, ResonanceMsg, ResonanceTopMsg, ChannelsMsg, WorldMsg, AutoMsg } from "./net.ts";
import { autoTimeText, TONG_MON, TONG_MIN_LEVEL, TONG_SWITCH_DAYS, WORLD_CHAT } from "../../shared/data.ts";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
export const ringColor = (t: number) => (t === 3 ? "#8a6bff" : TIERS[t].col);
/** Phím hồn kỹ 1–4 (từ bước 2.3a; phím số 1–4 dành cho đổi võ hồn trong đội). Mã phím là `Key` + chữ. */
export const SKILL_KEYS = ["U", "I", "O", "P"];
/** Phím kỹ năng hồn cốt chủ động (từ 4.3, chờ chốt) theo BONE_ACTIVE_SLOTS: Z đầu, X tay trái, C tay phải. */
export const BONE_SKILL_KEYS = ["Z", "X", "C"];

/** Dòng thông báo riêng cho mình (lỗi, đồ rơi, tổ đội…): hiện ở mọi tab của ô chat. */
export function log(text: string, col?: string, who?: string) { chatLine("sys", text, col, who); }

// ---------- Ô chat (mục 4 "Lệnh chat", #188): tab Tất cả / Bản đồ / Tổ đội / Riêng / Thế giới, lịch sử chỉ trong phiên ----------
/** Kênh của một dòng: `sys` = thông báo riêng cho mình (tab nào cũng hiện). */
export type ChatCh = "sys" | "map" | "party" | "whisper" | "world";
export type ChatTab = "all" | "map" | "party" | "whisper" | "world";
/** Màu kênh (thủy mặc, #188): tổ đội xanh lá như chấm đồng đội, tin riêng tím, thế giới vàng. */
export const CHAT_COL: Record<Exclude<ChatCh, "sys">, string> = { map: "#9db3a2", party: "#7dff8a", whisper: "#c58cff", world: "#e9c45a" };
const CHAT_TAG: Partial<Record<ChatCh, string>> = { party: "[Đội]", whisper: "[Riêng]", world: "[Thế giới]" };
const CHAT_TABS: { id: ChatTab; name: string }[] = [
  { id: "all", name: "Tất cả" }, { id: "map", name: "Bản đồ" }, { id: "party", name: "Tổ đội" }, { id: "whisper", name: "Riêng" }, { id: "world", name: "Thế giới" }];
/** Số dòng hiện lúc ô chat đóng (mờ dần sau CHAT_FADE_MS như trước) và lúc mở (không mờ, cuộn được); số dòng giữ trong phiên. */
const CHAT_SHOW = 6, CHAT_SHOW_OPEN = 40, CHAT_FADE_MS = 9000, CHAT_KEEP = 200;
interface ChatLine { ch: ChatCh; text: string; col?: string; who?: string; at: number; }
const chatHist: ChatLine[] = [];
let chatTab: ChatTab = "all", chatPinned = false, chatTyping = false;
/** Người gần nhất nhắn riêng cho mình (`/r`) và người gần nhất mình trò chuyện riêng (tin thường ở tab Riêng gửi cho người này). */
let replyTo = "", whisperTo = "";

const tabShows = (tab: ChatTab, ch: ChatCh) => tab === "all" || ch === "sys" || ch === tab;
const chatOpen = () => chatPinned || chatTyping;

function chatEl(l: ChatLine, fade: boolean) {
  const d = document.createElement("div");
  const tag = chatTab === "all" ? CHAT_TAG[l.ch] : undefined;
  if (tag) { const t = document.createElement("i"); t.textContent = tag; t.style.color = l.col ?? ""; d.appendChild(t); }
  if (l.who) { const b = document.createElement("b"); b.textContent = l.who + ":"; if (tag) b.style.color = l.col ?? ""; d.appendChild(b); }
  d.appendChild(document.createTextNode(l.text));
  if (l.col) d.style.borderLeftColor = l.col;
  if (fade) setTimeout(() => { d.style.opacity = "0"; setTimeout(() => d.remove(), 700); }, Math.max(0, CHAT_FADE_MS - (Date.now() - l.at)));
  return d;
}

/** Vẽ lại khung log theo tab và trạng thái mở / đóng. */
function renderChat() {
  const el = $("#log"); if (!el) return;
  const open = chatOpen(), now = Date.now();
  const lines = chatHist.filter((l) => tabShows(chatTab, l.ch) && (open || now - l.at < CHAT_FADE_MS)).slice(-(open ? CHAT_SHOW_OPEN : CHAT_SHOW));
  el.replaceChildren(...lines.map((l) => chatEl(l, !open)));
  $("#chatbox")?.classList.toggle("open", open);
  if (open) el.scrollTop = el.scrollHeight;
  for (const b of document.querySelectorAll<HTMLElement>("#chattabs button")) {
    const on = b.dataset.tab === chatTab;
    b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on));
    if (on) b.classList.remove("new");
  }
  chatPlaceholder();
}

/** Thêm một dòng vào lịch sử ô chat (chỉ trong phiên, không lưu). Tab khác có tin mới thì hiện chấm. */
export function chatLine(ch: ChatCh, text: string, col?: string, who?: string) {
  const l: ChatLine = { ch, text, col, who, at: Date.now() };
  chatHist.push(l); if (chatHist.length > CHAT_KEEP) chatHist.shift();
  const el = $("#log"); if (!el) return;
  if (ch !== "sys" && ch !== chatTab) document.querySelector(`#chattabs button[data-tab="${ch}"]`)?.classList.add("new");
  if (!tabShows(chatTab, ch)) return;
  const open = chatOpen();
  el.appendChild(chatEl(l, !open));
  while (el.children.length > (open ? CHAT_SHOW_OPEN : CHAT_SHOW)) el.firstElementChild!.remove();
  if (open) el.scrollTop = el.scrollHeight;
}

/** Tin riêng đến / đi: nhớ người để `/r` và tab Riêng gửi tiếp. `mine`: mình gửi, `other` là người nhận; không thì `other` là người gửi. */
export function chatWhisper(other: string, mine: boolean, text: string) {
  if (!mine) replyTo = other;
  whisperTo = other;
  chatLine("whisper", text, CHAT_COL.whisper, mine ? `Tới ${other}` : `Từ ${other}`);
  chatPlaceholder();
}
/** Người để `/r` trả lời ("" = chưa ai nhắn riêng cho mình trong phiên). */
export const chatReplyTo = () => replyTo;
/** Kênh gửi của tin thường (không phải lệnh) theo tab đang chọn; tab Riêng gửi cho người trò chuyện riêng gần nhất. */
export function chatSendCh(): { ch: "map" | "party" | "whisper" | "world"; to?: string } {
  if (chatTab === "party" || chatTab === "world") return { ch: chatTab };
  if (chatTab === "whisper") return { ch: "whisper", to: whisperTo };
  return { ch: "map" };
}

function chatPlaceholder() {
  const inp = $<HTMLInputElement>("#chat"); if (!inp) return;
  inp.placeholder = chatTab === "party" ? "Tổ đội: Enter để gửi (/d)"
    : chatTab === "whisper" ? (whisperTo ? `Riêng tới ${whisperTo}: Enter để gửi` : "Riêng: /t <tên> <tin>")
    : chatTab === "world" ? `Thế giới (từ cấp ${WORLD_CHAT.minLevel}, ${WORLD_CHAT.cdSecs} giây một tin): /tg`
    : "Nhấn Enter để chat (/d, /t, /r, /tg)";
  if (chatTab === "all" || chatTab === "map") inp.style.removeProperty("--c"); else inp.style.setProperty("--c", CHAT_COL[chatTab]);
}

/** Chọn tab và mở khung log để đọc lịch sử; bấm lại tab đang mở thì đóng. */
export function chatSetTab(tab: ChatTab, toggle = false) {
  if (toggle && tab === chatTab && chatPinned) chatPinned = false;
  else { chatTab = tab; chatPinned = true; }
  renderChat();
}
/** Nhắn riêng `name` (nút ở menu hồn sư): sang tab Riêng, đặt người nhận, mở ô gõ. */
export function chatWhisperTo(name: string) {
  whisperTo = name; chatTab = "whisper"; chatPinned = true; renderChat();
  $<HTMLInputElement>("#chat")?.focus();
}
/** Ô gõ được / mất tiêu điểm: khung log mở rộng khi đang gõ. */
export function chatFocus(on: boolean) { chatTyping = on; renderChat(); }
/** Đóng khung log mở rộng (Esc); trả true nếu vừa đóng. */
export function chatClose() { if (!chatPinned) return false; chatPinned = false; renderChat(); return true; }

/** Dựng thanh tab của ô chat (một lần; chuột hoặc chạm, `pointerdown` không lấy mất tiêu điểm của ô gõ). */
export function buildChatTabs() {
  const bar = $("#chattabs"); if (!bar) return;
  if (!bar.childElementCount) for (const t of CHAT_TABS) {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.tab = t.id; b.textContent = t.name; b.setAttribute("role", "tab");
    if (t.id !== "all") b.style.setProperty("--c", CHAT_COL[t.id]);
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); chatSetTab(t.id, true); });
    bar.appendChild(b);
  }
  renderChat();
}

// ---------- Tà hóa thú vương (BĐ5, mục 5.4): đếm ngược, thanh máu lớn, bảng xếp hạng sát thương ----------
/** Số giây -> "4:59". */
const mmss = (s: number) => { const t = Math.max(0, Math.ceil(s)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
let bossCd: { name: string; mapName: string; here: boolean; end: number; col: string } | null = null;
/** Đếm ngược thú vương sắp xuất hiện (tin "boss" k = "warn", mọi bản đồ); null = ẩn. `secs`: còn bao nhiêu giây (server tính). */
export function setBossCountdown(c: { name: string; mapName: string; here: boolean; secs: number; col?: string } | null) {
  bossCd = c ? { ...c, end: performance.now() + c.secs * 1000, col: c.col ?? "#ff5a5a" } : null;
  updateBossCd();
}
/** Mỗi lần cập nhật HUD: chữ đếm ngược; hết giờ thì ẩn (tin "spawn" sẽ tới). */
export function updateBossCd() {
  const el = $("#bossCd"); if (!el) return;
  const left = bossCd ? (bossCd.end - performance.now()) / 1000 : 0;
  if (!bossCd || left <= 0) { el.hidden = true; return; }
  el.hidden = false; el.style.setProperty("--c", bossCd.col);
  const txt = `${bossCd.name} xuất hiện sau ${mmss(left)} ở ${bossCd.mapName}${bossCd.here ? " (bản đồ này)" : ""}`;
  if (el.textContent !== txt) el.textContent = txt;
}
let bossLifeEnd = 0;
/** Thời gian còn lại trước khi thú vương rút đi (tin "boss" spawn / here). */
export function setBossLife(secs: number) { bossLifeEnd = performance.now() + secs * 1000; }
/** Đồng hồ nổi giận của boss thế giới (BĐ6e): giây còn lại trước khi nổi giận, theo tin "boss" (spawn / here). */
let bossRageEnd = 0;
export function setBossRage(secs: number) { bossRageEnd = performance.now() + secs * 1000; }
/** Điểm yếu hệ đang hiện của boss thế giới: giây còn lại (đếm ngược trên thanh máu), theo tin "boss" k = "weak". */
let bossWeakEnd = 0;
export function setBossWeak(secs: number) { bossWeakEnd = performance.now() + secs * 1000; }
/**
 * Phần riêng của boss thế giới trên thanh máu lớn (BĐ6e, đọc thẳng BeastState): nổi giận / đồng hồ nổi giận, điểm yếu hệ (hệ võ hồn
 * mình đang ra trận có khớp không), khiên Bá Thể, số lần ngắt tích lực, đang lặn.
 */
export interface BossWorldView { rage: boolean; weak: He | null; myHe: He; shield: number; brk: number; need: number; charging: boolean; dive: boolean; armorHe: He | null; }
/**
 * Thanh máu thú vương lớn ở đầu màn hình (mục 5.4 "Nhận diện"): đọc thẳng BeastState (máu, số người tham gia, giai đoạn). null = ẩn.
 * Khung mục tiêu nhỏ (#target) dời xuống dưới khi thanh này hiện.
 */
export function showBoss(b: { name: string; hp: number; maxHp: number; parts: number; phase: number; title: string; col: string; world?: BossWorldView } | null) {
  const el = $("#bossbar"); document.body.classList.toggle("boss", !!b);
  if (!b) { el.hidden = true; $("#bossRank").hidden = true; return; }
  el.hidden = false; el.style.setProperty("--c", b.col);
  const now = performance.now(), life = (bossLifeEnd - now) / 1000, w = b.world, rageIn = (bossRageEnd - now) / 1000, weakT = (bossWeakEnd - now) / 1000;
  const key = `${b.name}|${b.hp}|${b.maxHp}|${b.parts}|${b.phase}|${b.title}|${Math.ceil(life)}|${w ? `${JSON.stringify(w)}|${Math.ceil(rageIn)}|${Math.ceil(weakT)}` : ""}`;
  if (el.dataset.key === key) return;
  el.dataset.key = key;
  if (!el.firstChild) el.innerHTML = `<div class="bhead"><b></b><span class="ph"></span><span class="bn"></span></div><div class="bar"><i></i><em></em><span></span></div><div class="wl"></div>`;
  el.querySelector("b")!.textContent = b.name;
  // Boss thế giới (BĐ6e): giai đoạn là nổi giận / đồng hồ nổi giận; hết giờ thì "lặn xuống hồ" thay cho "rút đi".
  el.querySelector(".ph")!.textContent = w ? (w.rage ? "NỔI GIẬN" : rageIn > 0 ? `Nổi giận sau ${mmss(rageIn)}` : "") : b.phase === 2 ? `Giai đoạn 2 – ${b.title}` : "Giai đoạn 1";
  el.querySelector(".bn")!.textContent = `${b.parts} người tham gia${life > 0 ? ` · ${w ? "lặn xuống hồ" : "rút đi"} sau ${mmss(life)}` : ""}`;
  (el.querySelector(".bar i") as HTMLElement).style.width = `${(100 * b.hp) / Math.max(1, b.maxHp)}%`;
  // Khiên Bá Thể: dải xanh đè lên thanh máu, dài theo tỉ lệ khiên / máu tối đa.
  (el.querySelector(".bar em") as HTMLElement).style.width = w?.shield ? `${Math.min(100, (100 * w.shield) / Math.max(1, b.maxHp))}%` : "0";
  el.querySelector(".bar span")!.textContent = `${b.hp.toLocaleString("vi-VN")} / ${b.maxHp.toLocaleString("vi-VN")}${w?.shield ? ` · khiên ${w.shield.toLocaleString("vi-VN")}` : ""}`;
  el.classList.toggle("p2", b.phase === 2);
  const wl = el.querySelector(".wl") as HTMLElement;
  wl.hidden = !w; wl.innerHTML = "";
  if (w) {
    const chip = (text: string, cls = "") => { const c = document.createElement("span"); c.className = cls; c.textContent = text; wl.appendChild(c); };
    if (w.weak) chip(`Điểm yếu: ${HE[w.weak].name} ×${String(WORLD.weakMult).replace(".", ",")}${weakT > 0 ? ` (${Math.ceil(weakT)} giây)` : ""} · ${w.myHe === w.weak ? "võ hồn của bạn đúng hệ" : `đổi sang võ hồn ${HE[w.weak].name}!`}`, w.myHe === w.weak ? "ok" : "bad");
    if (w.shield && w.armorHe) chip(`Bá Thể: võ hồn ${HE[w.armorHe].name} phá khiên nhanh gấp 3${w.myHe === w.armorHe ? "" : " – đổi võ hồn!"}`, w.myHe === w.armorHe ? "ok" : "bad");
    if (w.charging && w.need) chip(`Tích lực: ngắt ${w.brk}/${w.need} bằng khống chế của võ hồn Khống chế${w.myHe === "khong_che" ? "" : " – đổi võ hồn!"}`, w.myHe === "khong_che" ? "ok" : "bad");
    if (w.dive) chip("Đang lặn giữa hồ: không nhận sát thương, sẽ nổi lên ở vòng sóng xanh (mẫn công đứng chờ đánh điểm yếu)");
    if (!wl.childElementCount) wl.hidden = true;
  }
  // Khung mục tiêu / đếm ngược nằm ngay dưới thanh máu boss (thanh boss thế giới cao hơn khi có dòng cơ chế).
  document.body.style.setProperty("--bossh", `${el.offsetTop + el.offsetHeight}px`);
}
/**
 * Bảng xếp hạng đóng góp khi đánh thú vương / boss thế giới (tin "boss" k = "rank" / "down"): tối đa 10 dòng, dòng của mình sáng; từ 3%
 * có rương. Từ 9.2 đóng góp = sát thương + hồi máu / khiên cho người tham gia khác; cột "Hỗ trợ" là phần hồi / khiên trong tổng (server tính).
 */
export function bossRank(list: { id: string; name: string; pct: number; sup?: number }[] | null, me: string, final = false, world = false) {
  const el = $("#bossRank");
  if (!list || !list.length) { el.hidden = true; return; }
  el.hidden = false; el.innerHTML = "";
  const h = document.createElement("b"); h.textContent = final ? "Kết quả đóng góp" : "Đóng góp"; el.appendChild(h);
  const pc = (v: number) => `${String(v).replace(".", ",")}%`;
  const head = document.createElement("div"); head.className = "rk hd";
  head.innerHTML = "<span></span><em>Tên</em><s>Hỗ trợ</s><i>Tổng</i>"; el.appendChild(head);
  list.forEach((x, i) => {
    const r = document.createElement("div"); r.className = "rk" + (x.id === me ? " me" : "") + (x.pct / 100 >= KING.share ? "" : " low");
    r.innerHTML = `<span>${i + 1}.</span><em></em><s${x.sup ? "" : ' class="z"'}>${x.sup ? pc(x.sup) : "–"}</s><i>${pc(x.pct)}</i>`;
    r.querySelector("em")!.textContent = x.name;
    el.appendChild(r);
  });
  const K = world ? WORLD : KING;
  const n = document.createElement("small");
  n.textContent = world ? `Đóng góp = sát thương + hồi máu / khiên cho người khác. Từ ${K.share * 100}% nhận hồn hoàn và rương (tối đa ${K.daily} lần/ngày); gây sát thương nhiều nhất nhận hồn hoàn đỏ 100.000 năm.`
    : `Đóng góp = sát thương + hồi máu / khiên cho người khác. Từ ${K.share * 100}% nhận rương (tối đa ${K.daily} lần/ngày).`;
  el.appendChild(n);
}

let bannerTO: number | undefined;
export function banner(a: string, b: string) {
  const el = $("#banner"); el.querySelector("b")!.textContent = a; el.querySelector("span")!.textContent = b;
  el.style.opacity = "1"; clearTimeout(bannerTO); bannerTO = window.setTimeout(() => (el.style.opacity = "0"), 2400);
}

/** Hồi chiêu của hồn kỹ vòng `r` của võ hồn `stars` sao (9.5: vòng 1–4 từ 4★ ngắn hơn; server tính như nhau). */
export const skillCd = (s: SkillDef, r: number, stars: number) => s.cd * (starRing(r) ? starCdMult(stars) : 1);
const cdText = (x: number) => String(Math.round(x * 100) / 100).replace(".", ",");
/** Dòng "Sao: hồn kỹ +x%…" của võ hồn `stars` sao (9.5, mục 5.1); 1★ thì "". */
export function starSkillText(stars: number) {
  if (starSkillMult(stars) <= 1) return "";
  const pct = (m: number) => `+${Math.round((m - 1) * 100)}%`;
  return `Sao: hồn kỹ ${pct(starSkillMult(stars))}` + (starCdMult(stars) < 1 ? `, hồi chiêu −${Math.round((1 - starCdMult(stars)) * 100)}%` : "")
    + `, tiên cơ riêng ${pct(starTienCoMult(stars))}`;
}
/** Chú thích một hồn kỹ của vòng `r` (chỉ số 0..9): tốn / hồi, sức mạnh theo số năm hồn hoàn (kèm sao võ hồn, 9.5), hoặc vòng cần để mở. */
function skillTip(s: SkillDef, r: number, rings: number[], years: number[] | null, stars: number) {
  const has = r < rings.length, y = years?.[r] ?? (has ? TIERS[rings[r]].years : 0), sm = starRing(r) ? starSkillMult(stars) : 1;
  const pow = has ? ` Sức mạnh ×${(skillPower(y) * sm).toFixed(2).replace(".", ",")} (hồn hoàn ${y.toLocaleString("vi-VN")} năm${sm > 1 ? `, sao +${Math.round((sm - 1) * 100)}%` : ""}).` : ` Mở khi có hồn hoàn thứ ${r + 1}.`;
  return `${s.ult ? "Tuyệt kỹ " : ""}${s.name} (vòng ${r + 1}): ${s.desc}. Tốn ${s.cost} hồn lực, hồi ${cdText(skillCd(s, r, stars))} giây.${pow}`;
}
let slotCd: number[] = [];  // hồi chiêu đầy của hồn kỹ ở từng ô (vẽ lớp phủ hồi chiêu trong updateStats)
let avaDef: ChanThanDef | null = null; // Võ Hồn Chân Thân của võ hồn ra trận (nút R), null = võ hồn chưa có
/** Hồn kỹ Chân Thân (9.6) hiện ở nút P khi đang biến hình; null = võ hồn chưa có Chân Thân. */
interface SlotView { name: string; icon: string; col: string; label: string; tip: string; locked?: boolean }
let ctSlot: SlotView | null = null;
let pSlot: SlotView | null = null; // nội dung gốc của nút P (để trả lại khi hết Chân Thân)
/** Tráo nút P giữa hồn kỹ đang mang và hồn kỹ Chân Thân (class `ct`: viền vàng). Chỉ hiển thị; server quyết định ô P tung gì. */
function setCtSlot(b: HTMLElement, on: boolean) {
  const sp = b.querySelectorAll<HTMLElement>("span");
  if (on) pSlot = { name: sp[1].textContent ?? "", icon: sp[0].textContent ?? "", col: sp[0].style.color, label: b.getAttribute("aria-label") ?? "",
    tip: b.title, locked: b.classList.contains("locked") };
  const v = on ? ctSlot : pSlot; if (!v) return;
  b.classList.toggle("ct", on); b.classList.toggle("locked", !on && !!v.locked);
  sp[0].textContent = v.icon; sp[0].style.color = v.col; sp[1].textContent = v.name;
  b.setAttribute("aria-label", v.label); b.title = v.tip;
}
/**
 * Thanh kỹ năng: đánh thường, 4 ô hồn kỹ mang theo của võ hồn ra trận (từ 8.1a theo `loadout`: chỉ số vòng ở từng ô U / I / O / P,
 * -1 = trống; vòng 1–4 riêng nếu có, không thì dùng chung; tên, biểu tượng, chú thích kèm sức mạnh theo số năm hồn hoàn), nút R Võ
 * Hồn Chân Thân (8.1a, chỉ khi võ hồn có dữ liệu; khóa tới vòng 7), hấp thụ. `years`: số năm từng hồn hoàn (tin riêng "vohons");
 * chưa có thì lấy mốc của bậc. `stars`: sao võ hồn ra trận (9.5: sức mạnh và hồi chiêu vòng 1–4). Nút G Võ Hồn Dung Hợp Kỹ (#193)
 * khi võ hồn ra trận có cặp trong FUSIONS và `fusion` (sân đấu cấm dung hợp nên không hiện).
 */
export function buildSkills(vh: number, rings: number[], years: number[] | null, loadout: readonly number[], act: (k: string) => void, stars = 1, fusion = true) {
  const el = $("#skills"); el.innerHTML = ""; slotCd = [];
  const mk = (key: string, label: string, name: string, col: string, action: string, icon = "", locked = false, i?: number, tip = "") => {
    const b = document.createElement("button"); b.className = "sk" + (locked ? " locked" : "");
    if (i !== undefined) b.dataset.i = String(i);
    b.innerHTML = `<b>${key}</b><span class="ico" style="color:${col}"></span><span></span><div class="cd"></div>`;
    const sp = b.querySelectorAll("span"); sp[0].textContent = icon; sp[1].textContent = name;
    b.setAttribute("aria-label", label);
    if (tip) b.title = tip;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); act(action); });
    el.appendChild(b);
  };
  mk("J", "Đánh thường", "Đánh", VOHON[vh].col, "attack");
  const id = VOHON[vh].id;
  loadout.forEach((r, i) => {
    const s = r >= 0 ? ringSkill(id, r) : null; slotCd[i] = s ? skillCd(s, r, stars) : 1;
    if (!s) return mk(SKILL_KEYS[i], `Ô hồn kỹ ${i + 1}: trống`, "Trống", "#666", `skill${i}`, "", true, i, "Ô trống: chọn hồn kỹ mang theo ở bảng đội hình (V).");
    const has = r < rings.length;
    mk(SKILL_KEYS[i], `Ô hồn kỹ ${i + 1}: ${s.name} (vòng ${r + 1})${has ? "" : " (khóa)"}`, has ? s.name : "Khóa", has ? ringColor(rings[r]) : "#666",
      `skill${i}`, s.icon, !has, i, skillTip(s, r, rings, years, stars));
  });
  avaDef = chanThanOf(id); el.classList.toggle("ava", !!avaDef);
  if (avaDef) {
    const ri = CHAN_THAN_RING - 1, has = rings.length > ri, y = years?.[ri] ?? (has ? TIERS[rings[ri]].years : 0);
    const st = has ? chanThanStats(avaDef, y) : avaDef.stats;
    const tip = `Võ Hồn Chân Thân (vòng ${CHAN_THAN_RING}) – ${avaDef.name}: ${avaDef.desc}. Biến hình ${avaDef.secs} giây, tốn ${avaDef.cost} hồn lực, hồi ${avaDef.cd} giây.`
      + ` Khi biến hình, ô ${SKILL_KEYS[CHAN_THAN_SKILL_SLOT]} thành ${avaDef.skill.name}.`
      + (has ? ` Hồn hoàn ${y.toLocaleString("vi-VN")} năm: ${chanThanText(st)}.` : ` Mở khi có hồn hoàn thứ ${CHAN_THAN_RING}.`);
    mk(AVA_KEY, `Võ Hồn Chân Thân: ${avaDef.name}${has ? "" : " (khóa)"}`, has ? "Chân Thân" : "Khóa", has ? ringColor(rings[ri]) : "#666", "chanthan", avaDef.icon, !has, undefined, tip);
    el.lastElementChild!.classList.add("ava");
    // Hồn kỹ Chân Thân (9.6): nút P đổi sang hồn kỹ này khi đang biến hình (updateStats tráo nội dung, viền vàng).
    const s = avaDef.skill;
    ctSlot = { name: s.name, icon: s.icon, col: has ? TIERS[rings[ri]].glow : "#666", label: `Hồn kỹ Chân Thân: ${s.name}`,
      tip: `Hồn kỹ Chân Thân (thay ô ${SKILL_KEYS[CHAN_THAN_SKILL_SLOT]} khi biến hình) – ${s.name}: ${s.desc}. Tốn ${s.cost} hồn lực, hồi ${cdText(s.cd)} giây.`
        + (has ? ` Sức mạnh ×${skillPower(y).toFixed(2).replace(".", ",")} (hồn hoàn vòng ${CHAN_THAN_RING} ${y.toLocaleString("vi-VN")} năm).` : "") };
  } else ctSlot = null;
  // Võ Hồn Dung Hợp Kỹ (#193, mục 5.9): mời đồng đội gần nhất, hoặc hưởng ứng khi được mời; server chọn người và kiểm mọi điều kiện.
  const fus = fusion ? fusionsOf(id) : [];
  el.classList.toggle("fus", fus.length > 0); fusBtn = null;
  if (fus.length) {
    const has = rings.length >= FUSION.minRings, mate = (f: (typeof FUSIONS)[number]) => VOHON[vohonIndex(f.pair[0] === id ? f.pair[1] : f.pair[0])]?.name ?? "";
    const tip = `Võ Hồn Dung Hợp Kỹ (phím ${FUSION_KEY}): ` + fus.map((f) => `${f.name} cùng đồng đội tổ đội ra trận ${mate(f)}: ${f.desc}`).join("; ")
      + `. Bấm để mời đồng đội gần nhất; đồng đội bấm ${FUSION_KEY} trong ${cdText(FUSION.window)} giây thì chiêu nổ ở điểm giữa hai người.`
      + ` Đứng cách nhau dưới ${FUSION.r} pixel, mỗi người tốn ${FUSION.cost} hồn lực, hồi ${FUSION.cd} giây (của hồn sư: đổi võ hồn không làm mới).`
      + (has ? "" : ` Cần ít nhất ${FUSION.minRings} hồn hoàn.`);
    mk(FUSION_KEY, `Võ Hồn Dung Hợp Kỹ: ${fus.map((f) => f.name).join(" / ")}${has ? "" : " (khóa)"}`, has ? "Dung hợp" : "Khóa",
      has ? VOHON[vh].col : "#666", "fusion", fus[0].icon, !has, undefined, tip);
    fusBtn = el.lastElementChild as HTMLElement; fusBtn.classList.add("fus");
    fusCdEl = fusBtn.querySelector(".cd"); fusLabel = fusBtn.querySelectorAll("span")[1]; fusCdPct = -1;
  }
  mk("E", "Nhặt hồn hoàn", "Nhặt", "#ffe08a", "pickup");
}

// ---------- Võ Hồn Dung Hợp Kỹ (#193, mục 5.9): nút G, lời nhắc có đếm ngược, ô hồi chiêu ----------
/** Phím Võ Hồn Dung Hợp Kỹ: mời, hoặc hưởng ứng khi đang được mời. */
export const FUSION_KEY = "G";
let fusCdEnd = 0; // performance.now() lúc hết hồi chiêu dung hợp của hồn sư (theo tin riêng `fusion done` / `vohons.fcd`)
/** Lời mời đang chờ: `ask` = mình được mời (B), `wait` = mình mời, chờ đồng đội; `i` cặp trong FUSIONS, `who` tên người kia. */
let fusPend: { k: "ask" | "wait"; i: number; who: string; end: number; ms: number } | null = null;
let fusTxt = "", fusBtn: HTMLElement | null = null; // nút G hiện tại (buildSkills dựng lại thì đổi)
let fusCdEl: HTMLElement | null = null, fusLabel: HTMLElement | null = null, fusCdPct = -1; // lớp phủ hồi chiêu, nhãn của nút G
/** Đã gửi `join`: chờ server trả `done` / `cancel`, phím G và nút không gửi lại (bấm hai lần không ra lỗi "chưa có lời mời"). */
let fusSent = false;
/** Hồi chiêu dung hợp còn `secs` giây (server gửi; đổi võ hồn không làm mới vì thuộc hồn sư). */
export function setFusionCd(secs: number) { fusCdEnd = performance.now() + Math.max(0, secs) * 1000; }
/**
 * Việc phím G / nút gửi: "join" khi đang được mời, "" khi vừa hưởng ứng và đang chờ server (không gửi lại), không thì "start". Gọi
 * nghĩa là sẽ gửi: "join" thì khóa tới khi server trả `done` / `cancel`. Server vẫn kiểm lại và báo lý do.
 */
export function fusionOp(): "join" | "start" | "" {
  if (fusSent) return "";
  if (fusPend?.k !== "ask") return "start";
  fusSent = true; $("#fusion").querySelector("button")?.setAttribute("disabled", ""); return "join";
}
/**
 * Khung nhắc dung hợp kỹ (tin riêng `fusion`): B thấy "Dung hợp [G]" kèm đếm ngược `t` giây và nút chạm được (gọi `join`); A thấy
 * đang chờ ai hưởng ứng. `null` thì ẩn (xong, hủy, đổi bản đồ). Tên người chơi gán bằng textContent. Đếm ngược và thanh `aria-hidden`
 * để trình đọc màn hình chỉ đọc tên chiêu và nút, không đọc lại mỗi 0,1 giây.
 */
export function setFusionPending(p: { k: "ask" | "wait"; i: number; who: string; t: number } | null, join?: () => void) {
  const el = $("#fusion"); fusTxt = ""; fusSent = false;
  fusPend = p && FUSIONS[p.i] ? { k: p.k, i: p.i, who: p.who, end: performance.now() + p.t * 1000, ms: Math.max(1, p.t * 1000) } : null;
  if (!fusPend) { el.hidden = true; el.innerHTML = ""; return; }
  const ask = fusPend.k === "ask";
  el.classList.toggle("ask", ask);
  el.innerHTML = `<div class="ft"></div><small class="left" aria-hidden="true"></small><div class="bar" aria-hidden="true"><i></i></div>${ask ? `<button type="button">Dung hợp<kbd>${FUSION_KEY}</kbd></button>` : ""}`;
  const f = FUSIONS[fusPend.i];
  el.querySelector(".ft")!.textContent = `${f.icon} Dung hợp kỹ ${f.name}`;
  el.querySelector(".ft")!.appendChild(document.createElement("small")).textContent = ask ? `${fusPend.who} mời hưởng ứng` : `Chờ ${fusPend.who} hưởng ứng`;
  el.querySelector("button")?.addEventListener("pointerdown", (e) => { e.preventDefault(); join?.(); });
  el.hidden = false;
  updateFusion();
}
/** Mỗi khung hình: đếm ngược lời nhắc, ô hồi chiêu và nhãn của nút G. */
export function updateFusion() {
  const now = performance.now(), b = fusBtn;
  if (b && fusCdEl && fusLabel) {
    const locked = b.classList.contains("locked"), cd = Math.max(0, fusCdEnd - now) / 1000;
    const pct = locked ? 0 : Math.round(Math.min(1, cd / FUSION.cd) * 1000) / 10;
    if (pct !== fusCdPct) { fusCdPct = pct; fusCdEl.style.height = pct + "%"; }
    const ask = !locked && fusPend?.k === "ask" && !fusSent;
    if (b.classList.contains("ask") !== ask) b.classList.toggle("ask", ask);
    const txt = locked ? "Khóa" : ask ? "Hưởng ứng" : fusPend ? "Đang chờ" : "Dung hợp";
    if (fusLabel.textContent !== txt) fusLabel.textContent = txt;
  }
  if (!fusPend) return;
  const left = Math.max(0, fusPend.end - now), sec = (left / 1000).toFixed(1).replace(".", ",");
  const txt = `còn ${sec} giây`;
  if (txt === fusTxt) return;
  fusTxt = txt; const el = $("#fusion");
  el.querySelector("small.left")!.textContent = txt;
  (el.querySelector(".bar i") as HTMLElement).style.width = (left / fusPend.ms) * 100 + "%";
}
/** Phím Võ Hồn Chân Thân (8.1a, chờ chốt): R, không trùng phím nào đang dùng. */
export const AVA_KEY = "R";
const CT_NAMES: Record<ChanThanStat, string> = { atk: "công", def: "giảm sát thương nhận", spd: "tốc độ", crit: "chí mạng", mp: "giảm tiêu hao hồn lực", hp: "sinh lực tối đa" };
/** "công +47%, sinh lực tối đa +28%…" cho chỉ số Chân Thân. */
export const chanThanText = (st: Partial<Record<ChanThanStat, number>>) =>
  (Object.entries(st) as [ChanThanStat, number][]).map(([k, v]) => `${CT_NAMES[k]} +${Math.round(v * 100)}%`).join(", ");

/** Hồn cốt đang gắn trên võ hồn ra trận (từ tin riêng "bag"): loài, vị trí, số năm, cấp cường hóa (4.4). */
export interface WornBone { beast: string; slot: string; years: number; enhance?: number; }
const pow2 = (x: number) => x.toFixed(2).replace(".", ",");
/**
 * Mô tả kỹ năng hồn cốt (tooltip, bảng hồn cốt): chủ động kèm tiêu hao / hồi chiêu / sức mạnh, bị động kèm số thật theo số năm;
 * từ 4.4 nhân hệ số mốc cường hóa (boneSkillMult).
 */
export function boneSkillText(beast: string, slot: string, years: number, enhance = 0) {
  const k = boneSkillOf(beast, slot); if (!k) return "";
  const m = boneSkillMult(enhance), up = m > 1 ? ` (mốc cường hóa ×${pow2(m)})` : "";
  if (k.active) return `${k.sk.name} (chủ động): ${k.sk.desc}. Tốn ${k.sk.cost} hồn lực, hồi ${String(k.sk.cd).replace(".", ",")} giây, sức mạnh ×${pow2(skillPower(years) * m)}${up}.`;
  return `${k.ps.name} (bị động): ${passiveText(k.ps, buffPower(years) * m)}${up}.`;
}
let boneCd: number[] = [];
/**
 * Kỹ năng hồn cốt của võ hồn ra trận (bước 4.3): 3 nút chủ động (Z / X / C: đầu, tay trái, tay phải; biểu tượng vị trí vẽ bằng
 * điểm ảnh, màu theo niên hạn) cạnh thanh hồn kỹ, và ô bị động (thân, hai chân) viền nét đứt cạnh hiệu ứng có lợi. Ô chưa gắn
 * hồn cốt thì mờ. Chỉ hiển thị; server kiểm tra lại mọi thứ.
 */
export function buildBoneSkills(worn: WornBone[], act: (k: string) => void) {
  const el = $("#bskills"); el.innerHTML = ""; boneCd = [];
  BONE_ACTIVE_SLOTS.forEach((slot, i) => {
    const s = BONE_SLOTS[boneSlotIndex(slot)], w = worn.find((x) => x.slot === slot), k = w ? boneSkillOf(w.beast, slot) : null;
    const sk = k?.active ? k.sk : null, col = w ? ringColor(tierOfYears(w.years)) : "#666";
    boneCd[i] = sk?.cd ?? 1;
    const b = document.createElement("button"); b.className = "sk bsk" + (sk ? "" : " locked"); b.dataset.b = String(i);
    b.style.setProperty("--c", col);
    b.innerHTML = `<b>${BONE_SKILL_KEYS[i]}</b><i></i><span class="ico" style="color:${col}">${boneSvg(slot, "bico")}</span><span></span><div class="cd"></div>`;
    b.querySelector("i")!.textContent = sk?.icon ?? "";
    b.querySelectorAll("span")[1].textContent = sk?.name ?? s.name;
    b.setAttribute("aria-label", sk ? `Kỹ năng hồn cốt ${s.name}: ${sk.name}` : `Kỹ năng hồn cốt ${s.name}: chưa có`);
    b.title = w && sk ? `${boneName(w.beast, slot, w.years, w.enhance)}\n${boneSkillText(w.beast, slot, w.years, w.enhance)}`
      : `Ô ${s.name} chưa gắn hồn cốt: gắn ở bảng đội hình (V) để có kỹ năng chủ động.`;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); act(`bone${i}`); });
    el.appendChild(b);
  });
  const pas = $("#bpas"); pas.innerHTML = "";
  for (const w of worn) {
    const k = boneSkillOf(w.beast, w.slot); if (!k || k.active) continue;
    const c = document.createElement("span"); c.className = "passive"; c.textContent = k.ps.name;
    c.style.color = ringColor(tierOfYears(w.years));
    c.title = `${boneName(w.beast, w.slot, w.years, w.enhance)}\n${boneSkillText(w.beast, w.slot, w.years, w.enhance)}`;
    pas.appendChild(c);
  }
}

/** Tên các trạng thái đang có trên hồn thú (khung mục tiêu), kèm số tầng nếu cộng dồn. */
export function statusText(b: { st: number; burn: number; poison: number; armor: number; allure: number; lock: number; buff?: number }) {
  const n: Record<string, number> = { burn: b.burn, poison: b.poison, armor: b.armor, allure: b.allure, lock: b.lock };
  // Hiệu ứng có lợi của hồn thú (Cuồng nộ của tinh anh, BĐ4) đứng trước, in đậm.
  const buffs = BEAST_BUFF_IDS.filter((k) => (b.buff ?? 0) & beastBuffBit(k)).map((k) => `<b style="color:${BEAST_BUFFS[k].col}">${BEAST_BUFFS[k].name}</b>`);
  return [...buffs, ...STATUS_IDS.filter((s) => b.st & statusBit(s))
    .map((s) => `<span style="color:${STATUS[s].col}">${STATUS[s].name}${n[s] > 1 ? ` ×${n[s]}` : ""}</span>`)].join(" · ");
}

let ringsKey = "", buffKey = "";
/** Một ô trên thanh hiệu ứng: biểu tượng status_<mã> 24×24 (10.8) kèm tên khi rê chuột / đọc màn hình; mã chưa có ảnh thì ghi tên. */
function statusChip(id: string, name: string, col: string, cls = "") {
  const c = document.createElement("span"); c.className = cls; c.style.color = col;
  const img = artImg(`status_${id}`, "sti");
  if (img) { c.classList.add("art"); c.innerHTML = img; c.title = name; c.setAttribute("aria-label", name); } else c.textContent = name;
  return c;
}
export function updateStats(p: any) {
  $("#vhName").textContent = VOHON[p.vh].name; $("#vhName").style.color = VOHON[p.vh].col;
  $("#lvl").textContent = `Cấp ${p.level}`;
  $("#hpFill").style.width = (p.hp / Math.max(1, p.maxHp)) * 100 + "%"; $("#hpTxt").textContent = `Sinh lực ${p.hp} / ${p.maxHp}`;
  $("#mpFill").style.width = (p.mp / Math.max(1, p.maxMp)) * 100 + "%"; $("#mpTxt").textContent = `Hồn lực ${p.mp} / ${p.maxMp}`;
  if (!p.xpNeed) {
    $("#xpFill").style.width = "100%";
    $("#xpTxt").textContent = atBottleneck(p.level, p.rings.length) ? `Bình cảnh: cần hồn hoàn thứ ${p.rings.length + 1}` : `Cấp tối đa ${MAX_LEVEL}`;
  }
  else { $("#xpFill").style.width = (p.xp / p.xpNeed) * 100 + "%"; $("#xpTxt").textContent = `Kinh nghiệm ${p.xp} / ${p.xpNeed}`; }
  // Phong Lôi Chi Lực (2.5c): chỉ hiện khi Lam Điện Bá Vương Long ra trận; đầy thì sáng viền (tự tung Lôi Động Minh Thiên khi đánh trúng).
  const lei = VOHON[p.vh].id === PHONG_LOI.vohon, bar = $("#leiBar");
  bar.hidden = !lei; bar.title = PHONG_LOI.skill.desc;
  if (lei) {
    $("#leiFill").style.width = (p.lei / PHONG_LOI.max) * 100 + "%"; bar.classList.toggle("full", p.lei >= PHONG_LOI.max);
    $("#leiTxt").textContent = `${PHONG_LOI.name} ${p.lei} / ${PHONG_LOI.max}`;
  }
  const rings: number[] = [...p.rings];
  const key = rings.join(",") + "|" + p.level;
  if (key !== ringsKey) {
    ringsKey = key; const el = $("#rings"); el.innerHTML = "";
    rings.forEach((t) => { const d = document.createElement("div"); d.className = "ring"; d.style.color = ringColor(t);
      if (t === 3) d.style.borderColor = TIERS[3].col; d.title = `Hồn hoàn ${TIERS[t].age}`; el.appendChild(d); });
    const slot = rings.length + 1, s = document.createElement("small");
    if (slot <= MAX_RINGS) {
      const e = document.createElement("div"); e.className = "ring empty"; el.appendChild(e);
      s.textContent = `Vòng ${slot}: giới hạn ${formatYears(ringLimit(slot))}, cấp ${slot * 10}`;
    } else s.textContent = `Đủ ${MAX_RINGS} hồn hoàn`;
    el.appendChild(s);
  }
  // Hiệu ứng có lợi, rồi trạng thái bất lợi do chiêu báo trước của hồn thú gây (từ 3.5, viền đỏ).
  const buffs = BUFF_IDS.filter((b) => p.buff & buffBit(b)).join(",") + "|" + p.st + "|" + (p.han ?? 0);
  if (buffs !== buffKey) {
    buffKey = buffs; const el = $("#buffs"); el.innerHTML = "";
    for (const b of BUFF_IDS) if (p.buff & buffBit(b)) el.appendChild(statusChip(b, BUFFS[b].name, BUFFS[b].col));
    // Tầng Hàn (#163, Cực Hàn): ô ghi số tầng / số tầng thì đóng băng.
    for (const s of PLAYER_STATUS) if (p.st & statusBit(s))
      el.appendChild(statusChip(s, s === "chill" ? `${STATUS[s].name} ${p.han ?? 0}/${STATUS[s].max}` : STATUS[s].name, STATUS[s].col, "debuff"));
  }
  // Hồn kỹ Chân Thân (9.6): đang biến hình thì nút P mang hồn kỹ Chân Thân, hồi chiêu riêng `ctCd`; hết thì trả nút P cũ.
  const pb = document.querySelector<HTMLElement>(`.sk[data-i="${CHAN_THAN_SKILL_SLOT}"]`), ctOn = !!ctSlot && p.ava > 0;
  if (pb && pb.classList.contains("ct") !== ctOn) setCtSlot(pb, ctOn);
  document.querySelectorAll<HTMLElement>(".sk[data-i]").forEach((b) => {
    const i = Number(b.dataset.i), ct = b.classList.contains("ct");
    const cd = b.classList.contains("locked") ? 0 : Math.min(1, ct ? (p.ctCd ?? 0) / CHAN_THAN_SKILL_CD : p.cds[i] / (slotCd[i] || 1));
    (b.querySelector(".cd") as HTMLElement).style.height = cd * 100 + "%";
  });
  // Võ Hồn Chân Thân (8.1a): đang biến hình thì nút sáng kèm giây còn lại, xong thì hiện hồi chiêu.
  const av = document.querySelector<HTMLElement>(".sk.ava");
  if (av && avaDef) {
    av.classList.toggle("on", p.ava > 0);
    (av.querySelector(".cd") as HTMLElement).style.height = (p.ava > 0 ? 0 : Math.min(1, (p.avaCd ?? 0) / avaDef.cd) * 100) + "%";
    const label = av.querySelectorAll("span")[1], txt = av.classList.contains("locked") ? "Khóa" : p.ava > 0 ? `${Math.ceil(p.ava)} giây` : "Chân Thân";
    if (label.textContent !== txt) label.textContent = txt;
  }
  document.querySelectorAll<HTMLElement>(".sk[data-b]").forEach((b) => {
    const i = Number(b.dataset.b); (b.querySelector(".cd") as HTMLElement).style.height = Math.min(1, (p.bcds?.[i] ?? 0) / (boneCd[i] || 1)) * 100 + "%";
  });
  const ch = $("#channel");
  if (p.absorb > 0) {
    ch.style.display = "block"; $("#chFill").style.width = p.absorb * 100 + "%";
    const a = absorbing, sec = (x: number) => x.toFixed(1).replace(".", ",");
    const txt = a ? `${a.label} · ${sec(Math.min(a.secs, p.absorb * a.secs))} / ${sec(a.secs)} giây` : "Đang hấp thụ hồn hoàn…";
    const lb = ch.querySelector<HTMLElement>(".label")!;
    if (lb.textContent !== txt) lb.textContent = txt;
    ch.classList.toggle("risk", !!a?.risk);
    if (a) ch.style.setProperty("--c", a.col);
  } else if (!drawRecall(ch)) ch.style.display = "none"; // 11.2: thanh niệm truyền tống dùng chung chỗ
}

/** Hấp thụ đang chạy (tin riêng "absorbing" từ server): chữ trên thanh tiến độ, tổng số giây, có rủi ro thất bại không. */
let absorbing: { label: string; secs: number; risk: boolean; col: string } | null = null;
export function setAbsorbing(a: typeof absorbing) { absorbing = a; }

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
    if (def) b.dataset.tc = `${tienCoOf(def.id).name}: ${tienCoOf(def.id).desc}`;
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
  else { toggleBag(false); closeNpc(); toggleReso(false); toggleWorld(false); } // các bảng cùng chỗ giữa màn hình: mở bảng này thì đóng bảng kia
}

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
  const members = data.team.filter((r) => r > 0).length;
  const head = document.createElement("div"); head.className = "rhead";
  head.innerHTML = `<b>Đội hình (${members}/${TEAM_SIZE})</b><span><button class="rlink">Cộng minh</button><button class="x" aria-label="Đóng">×</button></span>`;
  head.querySelector(".x")!.addEventListener("click", () => toggleRoster(false));
  head.querySelector(".rlink")!.addEventListener("click", () => toggleReso(true)); // cộng minh (8.2): cộng cho mọi võ hồn
  el.appendChild(head);
  const send = (team: number[]) => { rosterSel = null; rosterHint = ""; act.setTeam(team); };

  // 4 ô đội hình là 4 thẻ võ hồn (10.8): chọn thẻ để đặt võ hồn khác vào ô đó; ô trống là thẻ giấy để trống.
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
  el.appendChild(slots);

  // Ràng buộc (mục 5.1, từ 2.5d; 9.4 mỗi cặp một dòng): cặp võ hồn cùng trong đội thì cả đội có thêm hiệu ứng (server tự tính lại).
  const bonds = bondsOf(data.team.map((r) => ownedById(data, r)?.vohon ?? ""));
  if (bonds.length) {
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
  el.appendChild(sub);

  // Bộ sưu tập (10.8): lưới thẻ võ hồn; võ hồn đã trong đội mang ấn son số ô. Hiệu ứng hồn kỹ theo sao (9.5) ghi thành dòng chữ nhỏ
  // dưới thẻ (đọc được trên màn chạm) và nối vào nhãn đọc màn hình của thẻ.
  const grid = document.createElement("div"); grid.className = "cgrid rgrid"; el.appendChild(grid);
  for (const v of data.list) {
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
  el.appendChild(note);
  rosterAgain = () => renderRoster(data, act, shards, items);
  renderLoadout(el, data, act, rosterAgain);
  renderBones(el, data, act, items, rosterAgain);
  renderCores(el, data, act, items, rosterAgain);
  renderShards(el, data, act, shards);
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
  el.appendChild(slots);

  const hint = document.createElement("small"); hint.className = "rnote";
  hint.textContent = skSlot === null ? "Chọn hồn kỹ để đưa vào ô trống, hoặc chọn một ô trước rồi chọn hồn kỹ." : `Chọn hồn kỹ để đặt vào ô ${SKILL_KEYS[skSlot]}.`;
  el.appendChild(hint);
  const list = document.createElement("div"); list.className = "klist";
  for (let r = 0; r < MAX_RINGS; r++) {
    const s = ringSkill(id, r), ct = r + 1 === CHAN_THAN_RING ? chanThanOf(id) : null;
    if (!s && !ct) continue;
    const open = r < v.rings.length, at = cur.indexOf(r);
    const b = document.createElement("button"); b.type = "button"; b.className = "kcard" + (at >= 0 ? " on" : "") + (open ? "" : " locked") + (ct ? " ava" : "");
    b.style.setProperty("--c", open ? ringColor(tiers[r]) : "#666");
    b.innerHTML = `<i class="ico"></i><span><b></b><small></small></span>`;
    b.querySelector("i")!.textContent = (s ?? ct)!.icon;
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

// ---------- Hồn cốt gắn trên võ hồn (mục 5.5, bước 4.2) ----------
let boneVh: number | null = null;     // võ hồn đang xem 6 ô hồn cốt (null = võ hồn ra trận)
let boneCell: string | null = null;    // ô (mã vị trí) đang chọn: xem hồn cốt đang gắn, lọc hồn cốt trong túi
let boneFocus: string | null = null;   // hồn cốt trong túi vừa bấm "Gắn…" ở túi đồ: tô sáng
let rosterAgain: (() => void) | null = null; // vẽ lại bảng đội hình bằng dữ liệu lần vẽ gần nhất (null = chưa vẽ lần nào)
/** Vị trí từng ô quanh hình võ hồn (grid-area trong .bfig: hàng / cột). */
const BONE_AREA: Record<string, string> = { dau: "1 / 2", tay_trai: "2 / 1", tay_phai: "2 / 3", than: "3 / 2", chan_trai: "3 / 1", chan_phai: "3 / 3" };

/** Mở bảng đội hình ở mục hồn cốt, chọn sẵn ô của hồn cốt `itemId` (nút "Gắn…" trong túi đồ). */
export function openBones(itemId: string, slot: string) {
  boneFocus = itemId; boneCell = slot; boneVh = null; // xem võ hồn đang ra trận
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
    b.innerHTML = `${it ? boneIcon(s.id, itemColor(it)) : boneSvg(s.id)}<span>${s.name}</span>${it ? `<small>${yearsShort(it.years)}</small>` : ""}${it?.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}${kname ? `<em></em>` : ""}`;
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
export function openCores(itemId: string) {
  coreFocus = itemId; coreCell = null; boneVh = null; // võ hồn đang ra trận (dùng chung lựa chọn với mục hồn cốt)
  rosterAgain?.();
  toggleRoster(true);
  requestAnimationFrame(() => document.querySelector("#roster .cfig")?.scrollIntoView({ block: "start" }));
}
/** Hồn hạch (sao, dữ liệu) trong danh sách món, để tính coreBonus / coreSetCounts như server (chỉ hiển thị). */
const wornCores = (list: BagItem[]) => list.flatMap((it) => { const c = coreOf(it); return c ? [{ stars: it.stars ?? 1, data: c, enhance: it.enhance }] : []; });
/** Dòng chỉ số của một hồn hạch: chỉ số chính (theo sao và cấp nâng cấp) rồi các dòng phụ. */
const coreLines = (it: BagItem) => {
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
    b.innerHTML = `${coreSvg(c?.set ?? "")}<span>Ô ${s + 1}</span>${it ? `<small>${it.stars ?? 1}★</small><em></em>` : ""}${it?.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}`;
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
    row.innerHTML = `${coreSvg(set)}<span><b></b><small></small><small></small></span>`;
    row.querySelector("b")!.textContent = `${cs ? `${cs.name} (${cs.tag})` : "Bộ lạ"} · ${n} món`;
    const [s2, s4] = row.querySelectorAll("small");
    s2.textContent = `${n >= CORE_SET_2 ? "✓" : `${n}/${CORE_SET_2}`} 2 món: ${cs?.set2 ?? "không rõ"}`; s2.classList.toggle("on", n >= CORE_SET_2);
    s4.textContent = `${n >= CORE_SET_4 ? "✓" : `${n}/${CORE_SET_4}`} 4 món: ${cs?.set4 ?? "không rõ"}`; s4.classList.toggle("on", n >= CORE_SET_4);
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
    row.innerHTML = `${coreSvg(c.set)}<span><b></b><small></small></span><button type="button" class="sbtn">Gắn</button>`;
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
let enhTarget: string | null = null;  // hồn cốt đang mở bảng cường hóa (trong túi hoặc đang gắn)
const enhMats = new Set<string>();    // nguyên liệu đang chọn (id ô trong túi)
let enhJump = false;                 // vừa mở bảng: cuộn tới bảng một lần (chọn nguyên liệu thì không cuộn)
let enhCoin = 0;                     // Hồn Tệ đang có (tin "bag" gần nhất): bảng cường hóa / nâng cấp so với phí (#281)
function enhOpen(id: string) { enhTarget = id; enhMats.clear(); enhJump = true; }
function enhClose() { enhTarget = null; enhMats.clear(); }
const num = (n: number) => n.toLocaleString("vi-VN");
/** Điểm cường hóa tới cấp kế tiếp: "25 / 45 điểm tới +2"; ở +20 thì "tối đa". */
function enhProgress(xp: number, level: number) {
  if (level >= BONE_MAX_ENHANCE) return `+${BONE_MAX_ENHANCE} (tối đa)`;
  return `${num(xp)} / ${num(boneEnhanceNeed(level + 1))} điểm tới +${level + 1}`;
}
/** Cấp cường hóa kèm tiến độ: "+1 (25 / 45 điểm tới +2)". */
const enhText = (it: BagItem) => (it.enhance >= BONE_MAX_ENHANCE ? `+${BONE_MAX_ENHANCE} (tối đa)` : `+${it.enhance} (${enhProgress(boneXp(it.stats), it.enhance)})`);
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
function enhancePicker(target: BagItem & { years: number }, items: BagItem[], act: { enhance(t: string, m: string[]): void; combat(): boolean }, again: () => void) {
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
const coreEnhText = (it: BagItem) => (it.enhance >= CORE_MAX_ENHANCE ? `+${CORE_MAX_ENHANCE} (tối đa)` : `+${it.enhance} (${coreProgress(coreXp(it.stats), it.enhance)})`);
/** Mốc tăng dòng phụ: +3, +6, +9, +12, +15. */
const CORE_SUB_MARKS = Array.from({ length: Math.floor(CORE_MAX_ENHANCE / CORE_SUB_EVERY) }, (_, i) => (i + 1) * CORE_SUB_EVERY);

/**
 * Bảng nâng cấp hồn hạch `target` (mục 5.6): chọn nhiều hồn hạch trong túi làm nguyên liệu (chạm / bấm để chọn; sao càng cao càng
 * nhiều điểm, cùng bộ được thêm), xem trước điểm, cấp, chỉ số chính và số lần tăng dòng phụ sẽ đạt (coreEnhancePreview của
 * shared/data.ts, chỉ để hiển thị; dòng phụ nào tăng do server tung), rồi xác nhận vì nguyên liệu mất hẳn. Server kiểm tra và tính
 * lại. Mở từ NPC Thợ rèn ở Nặc Đinh Thành (6.1, renderForgeCores), hoặc nút "Nâng cấp…" ở túi đồ và mục hồn hạch.
 */
function corePicker(target: BagItem, items: BagItem[], act: { enhanceCore(t: string, m: string[]): void; combat(): boolean }, again: () => void) {
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

export function showTarget(html: string | null) { const t = $("#target"); if (html) { t.style.display = "block"; t.innerHTML = html; } else t.style.display = "none"; }
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
/** Thẻ HTML với nội dung chữ (tên do người chơi đặt: không bao giờ chèn bằng innerHTML). */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = "") {
  const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e;
}
/** Nút bấm được bằng chuột và chạm (pointerdown, như thanh đội hình). */
function pbtn(text: string, cls: string, fn: () => void, label?: string) {
  const b = el("button", ("pbtn " + cls).trim(), text); b.type = "button";
  if (label) { b.title = label; b.setAttribute("aria-label", label); }
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  return b;
}
let partyAt = 0;             // performance.now() lúc nhận tin "party" gần nhất (đếm ngược lời mời)
let partyInviting = false;   // đang mở ô gõ tên để mời
let partyOpenNow = false;    // vừa bấm "Mời…": lần vẽ này đặt focus vào ô gõ tên
let partyDraft = "";         // chữ đang gõ trong ô mời: giữ lại khi khung vẽ lại (sinh lực đồng đội đổi)
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
  box.append(head);
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
  const head = el("div", "phead"); head.append(el("b", "", `${t.name} (cấp ${t.level})`), pbtn("✕", "", close, "Đóng"));
  const btns = el("div", "pbtns");
  if (!mem) btns.append(pbtn("Mời vào tổ đội", "ok", () => { act.send("invite", undefined, t.sid); close(); }, `Mời ${t.name} vào tổ đội`));
  else if (me?.leader) btns.append(pbtn("Nhường trưởng nhóm", "", () => { act.send("lead", t.name); close(); }),
    pbtn("Mời ra khỏi đội", "warn", () => { act.send("kick", t.name); close(); }));
  else btns.append(el("small", "phint", "Đồng đội trong tổ đội của bạn."));
  btns.append(pbtn("Nhắn riêng", "", () => { close(); chatWhisperTo(t.name); }, `Nhắn riêng cho ${t.name} (/t)`));
  box.append(head, btns);
  box.hidden = false;
}

// ---------- Túi đồ và Hồn Tệ (mục 5.7, bước 3.1): chỉ chính chủ nhận tin "bag" ----------
export function toggleBag(open = $("#bag").hidden) {
  $("#bag").hidden = !open; $("#bagBtn").setAttribute("aria-expanded", String(open));
  if (open) { toggleRoster(false); closeNpc(); toggleReso(false); toggleWorld(false); }
}

let bagSel: string | null = null;  // id ô đang chọn để xem chi tiết / dùng
let bagCdEnd = 0;                  // performance.now() lúc hết hồi chiêu chung đan (server gửi số giây còn lại)

/** Hồn Tệ dạng HTML: mỗi phần kim / ngân / đồng một màu. */
function honTeHtml(dong: number) {
  return honTeParts(dong).map((p) => `<span class="ht ${p.unit === "kim" ? "kim" : p.unit === "ngân" ? "ngan" : "dong"}">${p.n.toLocaleString("vi-VN")} ${p.unit}</span>`).join(" ");
}

/** Hồn cốt trong túi (bước 4.1): số năm, loài và vị trí; dữ liệu hỏng thì null (hiện như vật phẩm thường). */
const boneOf = (it: BagItem) => (it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null);
/** Hồn hạch trong túi (bước 5.1): bộ, chỉ số chính, dòng phụ; dữ liệu hỏng thì null (hiện như vật phẩm thường). */
const coreOf = (it: BagItem) => (it.code === CORE_ITEM ? parseCore(it.stats) : null);
/** Bộ hồn hạch theo mã (bộ lạ: undefined). */
const coreSet = (set: string) => CORE_SETS[coreSetIndex(set)];
/** Tên hiển thị một ô (mã không còn trong ITEMS: "Vật phẩm lạ"); hồn hoàn kèm số năm; hồn cốt "Loài – Vị trí, N năm"; hồn hạch "Hồn hạch Bộ N★". */
function itemName(it: BagItem) {
  const bone = boneOf(it);
  if (bone) return boneName(bone.beast, bone.slot, it.years!, it.enhance);
  const core = coreOf(it);
  if (core) return coreName(core.set, it.stars ?? 1, it.enhance);
  return (itemDef(it.code)?.name ?? "Vật phẩm lạ") + (it.years !== null ? ` ${formatYears(it.years)}` : "");
}
/** Hồn hoàn trong túi: có số năm thì màu theo số năm (bảng 5.2). */
const isRing = (it: BagItem): it is BagItem & { years: number } => it.code === RING_ITEM && it.years !== null;
/** Đồ có màu theo số năm: hồn hoàn và hồn cốt. */
const hasYears = (it: BagItem): it is BagItem & { years: number } => (it.code === RING_ITEM || it.code === BONE_ITEM) && it.years !== null;
/** "Công +30", "Sinh lực +316": chỉ số chính của hồn cốt (boneStats, kèm cường hóa từ 4.4). */
const boneStatText = (slot: string, years: number, enhance = 0) =>
  Object.entries(boneStats(slot, years, enhance)).map(([k, v]) => `${BONE_STAT_NAMES[k as BoneStat]} +${v}`).join(", ");
/** Chỉ số chính kèm các dòng phụ đã tung của một hồn cốt (#187, `stats.subs` do server tung): "Công +30, Chí mạng +2,1%". */
const boneFullText = (it: BagItem & { years: number }) => {
  const b = boneOf(it); if (!b) return "";
  return [boneStatText(b.slot, it.years, it.enhance), ...parseBoneSubs(it.stats).map(([k, v]) => coreStatText(k, v))].join(", ");
};
/** Tên một mã dòng phụ trong danh sách có thể tung: dòng % ghi thêm "%" ("Công %"), để phân biệt với dòng phẳng cùng tên. */
const subName = (k: CoreStat) => `${CORE_STATS[k].name}${CORE_STATS[k].pct && k.endsWith("_pct") ? " %" : ""}`;
/** Số năm gọn để ghi ở góc ô: "437", "1.760", "2,5v" (vạn năm). */
const yearsShort = (y: number) => (y < 10000 ? y.toLocaleString("vi-VN") : `${(y / 10000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}v`);
/** Màu một ô: hồn hoàn, hồn cốt theo số năm; hồn hạch theo bộ; vật phẩm khác theo ITEMS. */
const itemColor = (it: BagItem) => {
  const core = coreOf(it);
  return hasYears(it) ? ringColor(tierOfYears(it.years)) : (core && coreSet(core.set)?.col) || (itemDef(it.code)?.col ?? "#9db3a2");
};
/**
 * Biểu tượng ảnh 32×32 của một món (10.8, key item_*): hồn cốt là bản xám tô màu niên hạn theo vị trí (item_hon_cot_<vị trí>); món khác
 * theo mã trong ITEMS rồi theo nhóm ITEM_KINDS. Chưa có ảnh thì "" (nơi gọi vẽ biểu tượng CSS / SVG cũ).
 */
function itemArt(it: Pick<BagItem, "code" | "years" | "stats">) {
  const bone = it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
  if (bone) { const u = tintedUrl(`item_hon_cot_${bone.slot}`, ringColor(tierOfYears(it.years!))); return u ? `<img class="ico art" src="${u}" alt="" draggable="false">` : ""; }
  const def = itemDef(it.code), kind = def?.kind;
  // Hồn hoàn tô theo màu niên hạn; mảnh võ hồn, rương (màu hào quang thú vương / boss), tiên thảo theo `col` của món (ảnh chung
  // của nhóm, uiArt.tintedUrl lấy độ sáng rồi nhân màu; rương và tiên thảo là bản xám, #170).
  const tint = it.code === RING_ITEM && it.years !== null ? ringColor(tierOfYears(it.years))
    : kind === "manh_vo_hon" || kind === "ruong" || kind === "tien_thao" ? def!.col : null;
  if (tint) { const u = tintedUrl(`item_${kind}`, tint); if (u) return `<img class="ico art" src="${u}" alt="" draggable="false">`; }
  return artImg(`item_${it.code}`, "ico art") || (kind ? artImg(`item_${kind}`, "ico art") : "");
}
/** Biểu tượng hồn cốt ở vị trí `slot` tô màu `col` (ảnh xám item_hon_cot_*), không có ảnh thì SVG điểm ảnh cũ. */
const boneIcon = (slot: string, col: string) => {
  const u = tintedUrl(`item_hon_cot_${slot}`, col);
  return u ? `<img class="ico art bone" src="${u}" alt="" draggable="false">` : boneSvg(slot);
};

/**
 * Một võ hồn trong bộ sưu tập khi chọn nơi hấp thụ hồn hoàn (GameScene tính bằng absorbChance / absorbSecs của shared/data.ts,
 * chỉ để hiển thị; server quyết định). `reason` khác rỗng: không chọn được (chưa bình cảnh, đủ 10 vòng, vượt quá 100%).
 */
export interface AbsorbOption { rowId: number; name: string; col: string; level: number; slot: number; limit: number; over: number; fail: number | null; secs: number; active: boolean; reason: string; }
/** Một võ hồn sở hữu trong bảng chọn dùng tiên thảo (BĐ6b): số cây loại này đã dùng `n` (tối đa HERB_MAX). */
export interface HerbOption { rowId: number; name: string; col: string; level: number; active: boolean; n: number; }
/**
 * Thao tác trên túi đồ: client chỉ gửi id ô (và võ hồn được chọn để hấp thụ), server kiểm tra rồi gửi lại túi mới.
 * `absorbOptions`: các võ hồn và rủi ro khi hấp thụ hồn hoàn `years` năm; `combat`: đang giao chiến (tin "squad");
 * `refresh`: xin lại danh sách võ hồn (cấp võ hồn không ra trận có thể đã đổi).
 */
export interface BagActions {
  use(id: string): void; absorb(id: string, vohonId: number): void; discard(id: string): void; open(id: string): void;
  sort(): void; // sắp xếp + gộp chồng cả túi (#215), server làm
  lock(id: string): void; autoSell(cfg: SellSettings): void; // khoá / mở khoá ô, bộ lọc tự bán (#216)
  absorbOptions(years: number): AbsorbOption[]; combat(): boolean; refresh(): void;
  herb(id: string, vohonId: number): void; herbOptions(code: string): HerbOption[]; // tiên thảo (BĐ6b)
  enhance(targetId: string, materialIds: string[]): void; enhanceCore(targetId: string, materialIds: string[]): void;
}
let bagConfirm: string | null = null; // id ô vừa bấm "Bỏ" lần đầu: bấm lần nữa mới bỏ hẳn
let pickRing: string | null = null;   // id hồn hoàn đang mở bảng chọn võ hồn để hấp thụ
let pickVh: number | null = null;     // võ hồn đang chọn trong bảng đó (chờ xác nhận)
let pickHerb: string | null = null;   // id ô tiên thảo đang mở bảng chọn võ hồn (BĐ6b); võ hồn đang chọn dùng chung pickVh
const pct = (x: number) => `${Math.round(x * 100)}%`;
const secTxt = (x: number) => `${String(x).replace(".", ",")} giây`;

/**
 * Bảng chọn võ hồn để dùng tiên thảo `it` (BĐ6b, mục 5.7): mỗi võ hồn sở hữu một dòng ghi số cây loại này đã dùng; đủ HERB_MAX thì
 * không chọn được. Chọn một dòng rồi bấm xác nhận (tiên thảo mất khi dùng, chỉ số tăng vĩnh viễn); server kiểm tra lại.
 */
function herbPicker(it: BagItem, act: BagActions, again: () => void) {
  const box = document.createElement("div"); box.className = "apick";
  const h = herbDef(it.code), opts = act.herbOptions(it.code).sort((a, b) => Number(a.n >= HERB_MAX) - Number(b.n >= HERB_MAX) || Number(b.active) - Number(a.active));
  if (pickVh !== null && !opts.some((o) => o.rowId === pickVh && o.n < HERB_MAX)) pickVh = null;
  if (pickVh === null) pickVh = opts.find((o) => o.n < HERB_MAX)?.rowId ?? null;
  const head = document.createElement("small");
  head.textContent = `Chọn võ hồn dùng ${h?.name ?? "tiên thảo"} (+${HERB_PCT}% ${h ? RES_STAT_NAMES[h.stat].toLowerCase() : "chỉ số"} vĩnh viễn, tối đa ${HERB_MAX} cây mỗi võ hồn):`;
  box.appendChild(head);
  for (const o of opts) {
    const b = document.createElement("button"); b.className = "aopt" + (o.rowId === pickVh ? " sel" : "");
    b.disabled = o.n >= HERB_MAX;
    b.innerHTML = `<b style="color:${o.col}"></b><span>Cấp ${o.level}${o.active ? " · đang ra trận" : ""}</span><i>${o.n >= HERB_MAX ? "đã đủ" : "đã dùng"} ${o.n}/${HERB_MAX} cây</i>`;
    b.querySelector("b")!.textContent = o.name;
    b.addEventListener("click", () => { b.blur(); pickVh = o.rowId; again(); });
    box.appendChild(b);
  }
  const o = opts.find((x) => x.rowId === pickVh && x.n < HERB_MAX);
  const row = document.createElement("div"); row.className = "brow";
  if (o && h) {
    const ok = document.createElement("button"); ok.className = "buse absorb"; ok.textContent = `Dùng cho ${o.name}`;
    ok.addEventListener("click", () => { ok.blur(); act.herb(it.id, o.rowId); if (it.qty <= 1) { pickHerb = null; pickVh = null; } });
    row.appendChild(ok);
  }
  const no = document.createElement("button"); no.className = "buse drop"; no.textContent = "Thôi";
  no.addEventListener("click", () => { no.blur(); pickHerb = null; pickVh = null; again(); });
  row.appendChild(no);
  box.appendChild(row);
  return box;
}

/**
 * Bảng chọn võ hồn để hấp thụ hồn hoàn `ring` (mục 5.2): mỗi võ hồn một dòng ghi vòng kế tiếp, giới hạn, % vượt và tỉ lệ thất bại;
 * chọn một dòng thì hiện ô xác nhận, cảnh báo đỏ khi có rủi ro mất hồn hoàn.
 */
function absorbPicker(ring: BagItem & { years: number }, act: BagActions, again: () => void) {
  const box = document.createElement("div"); box.className = "apick";
  const opts = act.absorbOptions(ring.years).sort((a, b) => Number(!!a.reason) - Number(!!b.reason) || Number(b.active) - Number(a.active));
  if (pickVh !== null && !opts.some((o) => o.rowId === pickVh && !o.reason)) pickVh = null;
  if (pickVh === null) pickVh = opts.find((o) => !o.reason)?.rowId ?? null;
  const head = document.createElement("small");
  head.textContent = `Chọn võ hồn hấp thụ hồn hoàn ${formatYears(ring.years)} (chỉ võ hồn đang ở bình cảnh):`;
  box.appendChild(head);
  for (const o of opts) {
    const b = document.createElement("button"); b.className = "aopt" + (o.rowId === pickVh ? " sel" : "") + (o.fail ? " risk" : "");
    b.disabled = !!o.reason;
    const st = o.reason || (o.fail ? `vượt ${o.over}% · <em>${pct(o.fail)} thất bại</em>` : "trong giới hạn · chắc chắn thành công");
    b.innerHTML = `<b style="color:${o.col}"></b><span>Cấp ${o.level}${o.active ? " · đang ra trận" : ""}${o.slot <= MAX_RINGS ? ` · vòng ${o.slot}: giới hạn ${formatYears(o.limit)}` : ""}</span><i>${st}</i>`;
    b.querySelector("b")!.textContent = o.name;
    b.addEventListener("click", () => { b.blur(); pickVh = o.rowId; again(); });
    box.appendChild(b);
  }
  if (!opts.some((o) => !o.reason)) {
    const n = document.createElement("p"); n.textContent = "Chưa có võ hồn nào ở bình cảnh hấp thụ được hồn hoàn này. Săn hồn thú để lên cấp 10, 20, 30…";
    box.appendChild(n);
  }
  const o = opts.find((x) => x.rowId === pickVh && !x.reason);
  const row = document.createElement("div"); row.className = "brow";
  if (o) {
    const c = document.createElement("div"); c.className = "aconf" + (o.fail ? " risk" : "");
    const w = o.fail
      ? `⚠ Vượt giới hạn vòng ${o.slot} (${formatYears(o.limit)}) ${o.over}%: ${pct(o.fail)} thất bại. Thất bại thì MẤT hồn hoàn này, ngoài ra không bị phạt gì.`
      : `Trong giới hạn vòng ${o.slot} (tối đa ${formatYears(o.limit)}): chắc chắn thành công, ${o.name} lên cấp ${Math.min(MAX_LEVEL, o.level + 1)}.`;
    c.innerHTML = `<b></b><small></small>`;
    c.querySelector("b")!.textContent = w;
    c.querySelector("small")!.textContent = `Hấp thụ mất ${secTxt(o.secs)}: đứng yên, không giao chiến; di chuyển hoặc bị đánh thì hủy, không mất gì.`
      + (act.combat() ? " Đang giao chiến: rời xa hồn thú vài giây rồi hấp thụ." : "");
    box.appendChild(c);
    const ok = document.createElement("button"); ok.className = "buse absorb" + (o.fail ? " risk" : "");
    ok.textContent = o.fail ? `Chấp nhận ${pct(o.fail)} rủi ro, hấp thụ` : "Xác nhận hấp thụ";
    ok.addEventListener("click", () => { ok.blur(); act.absorb(ring.id, o.rowId); pickRing = null; pickVh = null; toggleBag(false); });
    row.appendChild(ok);
  }
  const no = document.createElement("button"); no.className = "buse drop"; no.textContent = "Thôi";
  no.addEventListener("click", () => { no.blur(); pickRing = null; pickVh = null; again(); });
  row.appendChild(no);
  box.appendChild(row);
  requestAnimationFrame(() => row.scrollIntoView({ block: "nearest" })); // túi cao: cuộn tới nút xác nhận
  return box;
}

/** Số ô túi của tài khoản theo tin "bag" gần nhất (từ 9.8 mở rộng được; trước tin đầu tiên là mức khởi đầu). */
let bagCap = BAG_SLOTS;
let bagPage = 0; // trang túi đang xem (#215: mỗi trang BAG_PAGE ô)
/**
 * Bảng túi đồ: Hồn Tệ, các trang BAG_PAGE ô (#215; tab trang có vạch mức đầy, trang đầy viền đỏ), lưới ô của trang đang xem (số
 * lượng ở góc ô, đồ cùng loại đã được server gộp), nút "Sắp xếp" (server sắp và gộp chồng trên cả túi), chi tiết ô đang chọn và nút
 * "Dùng". Client chỉ gửi id ô muốn dùng; server kiểm tra và gửi lại túi mới.
 */
export function renderBag(bag: BagMsg, act: BagActions) {
  bagCap = bag.slots; enhCoin = bag.honTe;
  bagCdEnd = performance.now() + Math.max(0, bag.cd) * 1000;
  const el = $("#bag"); el.innerHTML = "";
  const items = bag.items.filter((i) => i.vohon === null);
  if (bagSel && !items.some((i) => i.id === bagSel)) bagSel = null;
  if (bagConfirm !== bagSel) bagConfirm = null;
  if (pickRing !== bagSel) { pickRing = null; pickVh = null; }
  const again = () => renderBag({ ...bag, cd: Math.max(0, (bagCdEnd - performance.now()) / 1000) }, act);
  const head = document.createElement("div"); head.className = "rhead";
  head.innerHTML = `<b>Túi đồ (${items.length}/${bag.slots})</b><button class="x" aria-label="Đóng">×</button>`;
  head.querySelector("button")!.addEventListener("click", () => toggleBag(false));
  el.appendChild(head);
  const coin = document.createElement("div"); coin.className = "coin";
  coin.innerHTML = `<i class="coinico"></i><span>Hồn Tệ:</span> ${honTeHtml(bag.honTe)}`;
  coin.title = `${bag.honTe.toLocaleString("vi-VN")} đồng (1 ngân = 100 đồng, 1 kim = 100 ngân)`;
  el.appendChild(coin);

  const pages = Math.max(1, Math.ceil(bag.slots / BAG_PAGE));
  bagPage = Math.max(0, Math.min(pages - 1, bagPage));
  const bar = document.createElement("div"); bar.className = "bpages";
  for (let p = 0; p < pages; p++) {
    const cap = Math.min(BAG_PAGE, bag.slots - p * BAG_PAGE), n = Math.max(0, Math.min(cap, items.length - p * BAG_PAGE));
    const b = document.createElement("button"); b.className = "bpg" + (p === bagPage ? " cur" : "") + (n >= cap ? " full" : n === 0 ? " none" : "");
    b.innerHTML = `<b>${p + 1}</b><i style="--f:${n / cap}"></i>`;
    b.title = `Trang ${p + 1}: ${n}/${cap} ô${n >= cap ? " (đầy)" : ""}`; b.setAttribute("aria-label", b.title);
    b.setAttribute("aria-pressed", String(p === bagPage));
    b.addEventListener("click", () => { b.blur(); bagPage = p; again(); });
    bar.appendChild(b);
  }
  // Tự bán từ xa (#216): nút mở bộ lọc (thay chỗ chi tiết ô), chữ ghi đang bật hay tắt.
  const sell = { ...SELL_DEFAULTS, ...(bag.sell ?? {}) }, sb = document.createElement("button");
  sb.className = "buse bsellbtn" + (sell.on ? " on" : ""); sb.textContent = sell.on ? "Tự bán: bật" : "Tự bán: tắt";
  sb.title = "Bộ lọc tự bán từ xa khi túi gần đầy"; sb.setAttribute("aria-pressed", String(sellOpen));
  sb.addEventListener("click", () => { sb.blur(); sellOpen = !sellOpen; if (sellOpen) bagSel = null; again(); });
  bar.appendChild(sb);
  const sort = document.createElement("button"); sort.className = "buse bsort"; sort.textContent = "Sắp xếp";
  sort.title = "Gộp đồ cùng loại chưa đầy ô và xếp lại cả túi (mọi trang) theo loại, số năm, sao.";
  sort.disabled = items.length < 2;
  sort.addEventListener("click", () => { sort.blur(); act.sort(); });
  bar.appendChild(sort);
  el.appendChild(bar);

  const grid = document.createElement("div"); grid.className = "bgrid";
  for (let k = bagPage * BAG_PAGE; k < Math.min(bag.slots, (bagPage + 1) * BAG_PAGE); k++) {
    const it = items[k], b = document.createElement("button");
    b.className = "bslot" + (it ? "" : " empty") + (it && it.id === bagSel ? " sel" : "");
    if (it) {
      const def = itemDef(it.code);
      b.dataset.id = it.id; if (def?.cd) b.dataset.cd = def.cd;
      b.style.setProperty("--c", itemColor(it));
      const core = coreOf(it), corner = hasYears(it) ? yearsShort(it.years) : core ? `${it.stars ?? 1}★` : it.qty > 1 ? String(it.qty) : "";
      const bone = boneOf(it), icon = itemArt(it) || (bone ? boneSvg(bone.slot) : core ? coreSvg(core.set) : `<i class="ico ${def?.kind ?? "unknown"}"></i>`);
      b.innerHTML = `${icon}${corner ? `<small>${corner}</small>` : ""}${(bone || core) && it.enhance ? `<b class="enh">+${it.enhance}</b>` : ""}${it.lock ? `<i class="lk" aria-hidden="true"></i>` : ""}<div class="cd"></div>`;
      b.setAttribute("aria-label", (hasYears(it) ? `${bone ? "Hồn cốt " : ""}${itemName(it)} (${TIERS[tierOfYears(it.years)].color})` : core ? itemName(it) : `${itemName(it)}, ${it.qty} món`)
        + (it.lock ? ", đang khoá" : ""));
      b.title = itemName(it) + (it.lock ? " (khoá)" : "");
      b.addEventListener("click", () => { b.blur(); bagSel = bagSel === it.id ? null : it.id; sellOpen = false; enhClose(); again(); });
    } else { b.disabled = true; b.setAttribute("aria-label", "Ô trống"); }
    grid.appendChild(b);
  }
  el.appendChild(grid);

  if (sellOpen) { el.appendChild(sellBox(bag, sell, act)); return finishBag(el); }
  const info = document.createElement("div"); info.className = "binfo";
  const sel = items.find((i) => i.id === bagSel), def = sel && itemDef(sel.code);
  if (sel) {
    info.innerHTML = `<b></b><small></small><p></p>`;
    info.querySelector("b")!.textContent = `${itemName(sel)}${sel.qty > 1 ? ` ×${sel.qty}` : ""}${sel.lock ? " · đang khoá" : ""}`;
    info.querySelector("b")!.style.color = def ? itemColor(sel) : "";
    const band = hasYears(sel) ? tierBand(tierOfYears(sel.years)) : null, bone = boneOf(sel), slot = bone ? BONE_SLOTS[boneSlotIndex(bone.slot)] : null;
    const core = coreOf(sel), cset = core ? coreSet(core.set) : undefined;
    info.querySelector("small")!.textContent = !def ? "Không rõ loại" : ITEM_KINDS[def.kind].name
      + (slot && bone ? ` · ${slot.name} (kỹ năng ${slot.active ? "chủ động" : "bị động"}${(() => { const k = boneSkillOf(bone.beast, bone.slot); return k ? ` ${k.active ? k.sk.name : k.ps.name}` : ""; })()})` : "")
      + (core ? ` · Bộ ${cset ? `${cset.name} (${cset.tag})` : "lạ"}` : "")
      + (hasYears(sel) && band ? ` · ${TIERS[tierOfYears(sel.years)].color} (${band[0].toLocaleString("vi-VN")} – ${band[1].toLocaleString("vi-VN")} năm)` : "")
      + (def.cd ? ` · hồi chiêu chung ${DAN_CD} giây` : "");
    // Hồn cốt (4.1): chỉ số gốc theo số năm, dòng phụ đã tung ở các mốc (#187), cấp cường hóa, đang gắn hay chưa.
    if (bone && slot) {
      const st = document.createElement("div"), subs = parseBoneSubs(sel.stats); st.className = "bstat";
      const rows: [string, string][] = [["Chỉ số chính", boneStatText(bone.slot, sel.years!, sel.enhance)]];
      subs.forEach(([k, v], i) => rows.push([`Dòng phụ ${i + 1}`, coreStatText(k, v)]));
      if (!subs.length) rows.push(["Dòng phụ", `Chưa có: mỗi mốc ${BONE_ENHANCE_MILESTONES.map((x) => `+${x}`).join(", ")} thêm 1 dòng ngẫu nhiên`]);
      rows.push(["Kỹ năng", boneSkillText(bone.beast, bone.slot, sel.years!, sel.enhance) || "Không có"], ["Cường hóa", enhText(sel)], ["Đang gắn", "Chưa gắn"]);
      for (const [k, v] of rows) { const a = document.createElement("span"), b = document.createElement("b"); a.textContent = k; b.textContent = v; st.append(a, b); }
      info.insertBefore(st, info.querySelector("p"));
    }
    // Hồn hạch (5.1): sao, chỉ số chính (theo sao), dòng phụ đã tung, nâng cấp, đang gắn hay chưa, hiệu ứng bộ (có tác dụng từ 5.2,
    // gắn bằng nút "Gắn…").
    if (core) {
      const stars = sel.stars ?? 1, st = document.createElement("div"); st.className = "bstat";
      const rows: [string, string][] = [["Sao", "★".repeat(stars) + ` (${core.subs.length}/${CORE_MAX_SUBS} dòng phụ)`], ["Chỉ số chính", coreStatText(core.main, coreMainValue(core.main, stars, sel.enhance))]];
      core.subs.forEach(([k, v], i) => rows.push([`Dòng phụ ${i + 1}`, coreStatText(k, v)]));
      if (!core.subs.length) rows.push(["Dòng phụ", "Không có"]);
      rows.push(["Nâng cấp", coreEnhText(sel)], ["Đang gắn", "Chưa gắn"]);
      if (cset) rows.push(["Bộ 2 món", cset.set2], ["Bộ 4 món", cset.set4]);
      for (const [k, v] of rows) {
        const a = document.createElement("span"), b = document.createElement("b"); a.textContent = k; b.textContent = v;
        if (k === "Chỉ số chính") b.style.color = cset?.col ?? ""; st.append(a, b);
      }
      st.classList.add("core");
      info.insertBefore(st, info.querySelector("p"));
    }
    const ready = isRing(sel) ? act.absorbOptions(sel.years).filter((o) => !o.reason).length : 0;
    info.querySelector("p")!.textContent = (def?.desc ?? "Vật phẩm không còn trong trò chơi, vẫn được giữ trong túi.")
      + (isRing(sel) ? (ready ? ` Có ${ready} võ hồn ở bình cảnh hấp thụ được.` : " Chưa có võ hồn nào ở bình cảnh hấp thụ được hồn hoàn này.") : "");
    const row = document.createElement("div"); row.className = "brow";
    const btn = (text: string, cls: string, fn: () => void) => {
      const b = document.createElement("button"); b.className = "buse " + cls; b.textContent = text;
      b.addEventListener("click", () => { b.blur(); fn(); }); row.appendChild(b); return b;
    };
    if (def && (def.hp || def.mp)) btn("Dùng", "use", () => act.use(sel.id)).dataset.cd = def.cd ?? "";
    if (def?.recall) btn("Dùng", "absorb", () => { act.use(sel.id); toggleBag(false); }); // Hồi Thành Phù (11.2): niệm rồi về thành
    if (def?.auto) btn("Dùng", "absorb", () => act.use(sel.id)); // Ủy Thác Lệnh (Auto 2): cộng giờ treo tự săn
    if (isRing(sel) && pickRing === sel.id) { info.appendChild(absorbPicker(sel, act, again)); el.appendChild(info); return finishBag(el); }
    if (isRing(sel)) btn("Hấp thụ…", "absorb", () => { pickRing = sel.id; pickVh = null; act.refresh(); again(); });
    if (def?.vohon) btn("Mở / lên sao…", "use", () => toggleRoster(true)); // mảnh võ hồn (3.4): nút ở bảng đội hình
    if (def?.kind === "ruong") btn("Mở rương", "absorb", () => act.open(sel.id)); // rương thú vương (BĐ5): server tung phần thưởng
    if (def?.kind === "tien_thao" && pickHerb === sel.id) { info.appendChild(herbPicker(sel, act, again)); el.appendChild(info); return finishBag(el); }
    if (def?.kind === "tien_thao") btn("Dùng cho…", "absorb", () => { pickHerb = sel.id; pickVh = null; act.refresh(); again(); }); // BĐ6b
    if (bone && hasYears(sel) && enhTarget === sel.id) { info.appendChild(enhancePicker(sel, bag.items, act, again)); el.appendChild(info); return finishBag(el); }
    if (bone) btn("Gắn…", "use", () => openBones(sel.id, bone.slot)); // hồn cốt (4.2): gắn ở bảng đội hình
    if (bone && sel.enhance < BONE_MAX_ENHANCE) btn("Cường hóa…", "use", () => { enhOpen(sel.id); again(); }); // 4.4
    if (core && enhTarget === sel.id) { info.appendChild(corePicker(sel, bag.items, act, again)); el.appendChild(info); return finishBag(el); }
    if (core) btn("Gắn…", "use", () => openCores(sel.id)); // hồn hạch (5.2): gắn ở bảng đội hình
    if (core && sel.enhance < CORE_MAX_ENHANCE) btn("Nâng cấp…", "use", () => { enhOpen(sel.id); again(); }); // 5.3
    // Khoá (#216): món khoá không bị bán (tay hay tự bán), bỏ, làm nguyên liệu; server kiểm tra lại.
    btn(sel.lock ? "Mở khoá" : "Khoá", "use", () => act.lock(sel.id)).title = sel.lock ? "Mở khoá để bán / bỏ được" : "Khoá: không bán, bỏ hay làm nguyên liệu";
    if (!sel.lock) btn(bagConfirm === sel.id ? "Bỏ hẳn?" : "Bỏ", "drop", () => {
      if (bagConfirm === sel.id) { bagConfirm = null; act.discard(sel.id); } else { bagConfirm = sel.id; again(); }
    });
    info.appendChild(row);
  } else info.innerHTML = `<small>Chọn một ô để xem, dùng, hấp thụ hoặc bỏ vật phẩm.</small>`;
  el.appendChild(info);
  finishBag(el);
}

let sellOpen = false; // đang mở bộ lọc tự bán thay cho chi tiết ô (#216)
/** Mức chọn của bộ lọc tự bán (chỉ là lựa chọn giao diện; server kẹp bằng parseSell). */
const SELL_RING: [number, string][] = [[0, "Không bán"], [100, "Dưới 100 năm"], [1000, "Dưới 1.000 năm"], [10000, "Dưới 10.000 năm"],
  [100000, "Dưới 100.000 năm"], [MAX_YEARS + 1, "Mọi niên hạn"]];
const SELL_BONE: [number, string][] = [[0, "Không bán"], [1, "Chưa cường hóa (+0)"], [5, "Dưới +5"], [10, "Dưới +10"]];
const SELL_CORE: [number, string][] = [[1, "Không bán"],
  ...Array.from({ length: MAX_CORE_STARS - 2 }, (_, i): [number, string] => [i + 2, i ? `1★ – ${i + 1}★` : "1★"])];
/**
 * Bộ lọc tự bán từ xa (#216, mục 5.7 "Tự bán"): bật / tắt, hồn hoàn dưới X năm, cho bán vạn năm, hồn cốt dưới mức cường hóa, hồn hạch
 * dưới N sao, mảnh võ hồn; xem trước số ô đang hợp bộ lọc (autoSellable, chỉ để hiển thị). Đổi gì thì gửi ngay `autosell {cfg}`.
 */
function sellBox(bag: BagMsg, cfg: SellSettings, act: BagActions) {
  const box = document.createElement("div"); box.className = "binfo bsell";
  const send = (patch: Partial<SellSettings>) => act.autoSell({ ...cfg, ...patch });
  const head = document.createElement("b"); head.textContent = "Tự bán từ xa"; box.appendChild(head);
  const tg = document.createElement("button"); tg.type = "button"; tg.className = "buse " + (cfg.on ? "drop" : "absorb");
  tg.textContent = cfg.on ? "Tắt tự bán" : "Bật tự bán"; tg.setAttribute("aria-pressed", String(cfg.on));
  tg.addEventListener("click", () => { tg.blur(); send({ on: !cfg.on }); });
  box.appendChild(tg);
  const pick = (label: string, list: [number, string][], v: number, key: "ring" | "bone" | "core") => {
    const l = document.createElement("label"); l.className = "achk"; l.textContent = label + " ";
    const s = document.createElement("select");
    for (const [n, t] of list) { const o = document.createElement("option"); o.value = String(n); o.textContent = t; o.selected = n === v; s.appendChild(o); }
    if (!list.some(([n]) => n === v)) { const o = document.createElement("option"); o.value = String(v); o.textContent = `(${v})`; o.selected = true; s.appendChild(o); }
    s.addEventListener("change", () => send({ [key]: Number(s.value) }));
    l.appendChild(s); box.appendChild(l);
  };
  const check = (label: string, v: boolean, key: "high" | "shard") => {
    const l = document.createElement("label"); l.className = "achk";
    const c = document.createElement("input"); c.type = "checkbox"; c.checked = v;
    c.addEventListener("change", () => { c.blur(); send({ [key]: c.checked }); });
    l.append(c, ` ${label}`); box.appendChild(l);
  };
  pick("Hồn hoàn", SELL_RING, cfg.ring, "ring");
  pick("Hồn cốt", SELL_BONE, cfg.bone, "bone");
  pick("Hồn hạch chưa nâng cấp", SELL_CORE, cfg.core, "core");
  check("Mảnh võ hồn", cfg.shard, "shard");
  check(`Cho bán cả hồn hoàn, hồn cốt từ ${AUTO_SELL_GUARD.toLocaleString("vi-VN")} năm (vạn năm) trở lên`, cfg.high, "high");
  const now = bag.items.filter((i) => autoSellable({ ...i, locked: i.lock }, cfg));
  const gain = now.reduce((a, i) => a + (sellPrice(i) ?? 0) * i.qty, 0);
  const pv = document.createElement("small");
  pv.textContent = now.length ? `Lúc này túi có ${now.length} ô hợp bộ lọc (≈ +${formatHonTe(gain)}).` : "Lúc này không có ô nào hợp bộ lọc.";
  box.appendChild(pv);
  const n = document.createElement("small");
  n.textContent = `Bật thì khi túi còn dưới ${AUTO_SELL_FREE} ô trống (hoặc tự săn thấy túi đầy), đồ hợp bộ lọc được bán từ xa đúng giá thương nhân trong thành. `
    + "Không bao giờ bán món khoá, món đang gắn, hồn hoàn đang hấp thụ. Đan, phù chú, lệnh bài, rương, tiên thảo thương nhân không mua nên không bán. "
    + `${AUTO_SELL_BUYBACK} món tự bán gần nhất mua lại được đúng giá ở thương nhân (về túi ở trạng thái khoá). Ủy thác offline không tự bán.`;
  box.appendChild(n);
  return box;
}

function finishBag(el: HTMLElement) {
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Đồ cùng loại tự gộp vào một ô; mỗi hồn hoàn, hồn cốt, hồn hạch một ô (góc ô: số năm hoặc số sao). Mỗi trang ${BAG_PAGE} ô, mở rộng túi ở thương nhân trong thành. Hồi Huyết Đan và Hồi Hồn Đan dùng chung hồi chiêu. Phím B để mở/đóng.`;
  el.appendChild(note);
  updateBag();
}

/** Mỗi lần cập nhật HUD: lớp phủ hồi chiêu chung trên ô đan và chữ trên nút "Dùng". */
export function updateBag() {
  if ($("#bag").hidden) return;
  const left = Math.max(0, (bagCdEnd - performance.now()) / 1000), k = Math.min(1, left / DAN_CD);
  document.querySelectorAll<HTMLElement>("#bag .bslot[data-cd]").forEach((b) => { (b.querySelector(".cd") as HTMLElement).style.height = k * 100 + "%"; });
  const btn = document.querySelector<HTMLButtonElement>("#bag .buse.use");
  if (btn && btn.dataset.cd) {
    const txt = left > 0 ? `Đang hồi · ${Math.ceil(left)}s` : "Dùng";
    if (btn.textContent !== txt) { btn.textContent = txt; btn.disabled = left > 0; }
  }
}

// ---------- NPC, thương nhân, lò rèn (mục 5.8, bước 6.1) ----------
/** Hộp gợi ý khi đứng gần NPC (cổng được ưu tiên): tên, chức danh và nút "Nói chuyện" (phím F, chuột hoặc chạm). */
export function showTalk(def: NpcDef | null, go: () => void) {
  const el = $("#talk");
  if (!def) { el.hidden = true; el.innerHTML = ""; return; }
  el.innerHTML = `<div></div><small></small><button type="button">Nói chuyện<kbd>F</kbd></button>`;
  el.querySelector("div")!.textContent = def.name;
  (el.querySelector("div") as HTMLElement).style.color = def.col;
  el.querySelector("small")!.textContent = def.title;
  el.querySelector("button")!.addEventListener("pointerdown", (e) => { e.preventDefault(); go(); });
  el.hidden = false;
}

/**
 * Thao tác ở NPC: client chỉ gửi ý định (mã đan và số lượng, id ô muốn bán, hồn cốt muốn cường hóa, hồn hạch muốn nâng cấp từ 5.3);
 * server kiểm tra rồi gửi lại túi.
 */
export interface NpcActions {
  buy(code: string, qty: number): void; sell(id: string, qty?: number): void;
  buyback(key: string): void; expand(): void; // mua lại đồ vừa bán, mở rộng túi (9.8)
  enhance(targetId: string, materialIds: string[]): void;
  enhanceCore(targetId: string, materialIds: string[]): void; combat(): boolean;
  quest(op: "accept" | "turnin", chain?: string): void; // nhận / trả nhiệm vụ (6.2; `chain` = bài khảo hạch hằng ngày)
  arena(op: "queue" | "cancel" | "top"): void; // Đại Đấu Hồn Trường (7.2): xếp hàng, hủy, xin bảng xếp hạng
  tong(op: "join" | "leave", tong?: string): void; // tông môn (#196): gia nhập / đổi sang `tong`, rời tông
  shard(vohon: string, qty: number): void; shardInfo(): void; // Thương hội đổi mảnh võ hồn (#282): đổi, xin số đã đổi hôm nay
  owned(): string[]; // mã các võ hồn đã sở hữu (trang đổi mảnh ghi "chưa có")
}
type NpcPage = "talk" | "buy" | "sell" | "buyback" | "forge" | "forgecore" | "quest" | "daily" | "rank" | "shard";
let npcDefOpen: NpcDef | null = null;  // NPC đang mở hộp thoại
let npcPage: NpcPage = "talk";
let npcLine = 0;                       // câu thoại đang hiện
let npcBagMsg: BagMsg | null = null;   // tin "bag" gần nhất (Hồn Tệ, đồ bán được, hồn cốt cho lò rèn)
let npcAct: NpcActions | null = null;
let sellConfirm: string | null = null; // "id|số lượng" vừa bấm "Bán" lần đầu với món giá trị (từ 9.8 cả "expand" mở rộng túi): bấm lần nữa mới làm
/** Bán từ ngần này đồng trở lên (hoặc đồ đã cường hóa) thì phải bấm hai lần (chỉ là xác nhận giao diện, không phải số cân bằng). */
const SELL_CONFIRM_DONG = 100;
const NPC_ROLE_NOTE: Record<NpcRole, string> = { talk: "", shop: "Thương nhân: mua đan dược, bán đồ dư.", forge: "Lò rèn: cường hóa hồn cốt, nâng cấp hồn hạch.",
  arena: "Đấu đội võ hồn 1v1, xếp hạng Elo. Thua không mất gì.",
  tong: `Gia nhập cần xong chuỗi tân thủ và võ hồn cấp ${TONG_MIN_LEVEL}; đổi tông sau ${TONG_SWITCH_DAYS} ngày, mất điểm tuần đang có. Tông không cộng chỉ số.` };
let tongMsg: { tong: string; wait: number } | null = null; // tin "tong" gần nhất: tông đang thuộc ("" = không), giây còn chờ
let shardMsg: { n: number; daily: number } | null = null; // tin "shardinfo" gần nhất (#282): số mảnh đã đổi hôm nay ở Thương hội
/** Tin "shardinfo" (#282): vẽ lại hộp thoại Chưởng quỹ nếu đang mở. */
export function setShardInfo(m: { n: number; daily: number }) { shardMsg = m; if (npcDefOpen?.id === SHARD_BUY.npc) renderNpc(); }
/** Tin "tong" (#196): vẽ lại hộp thoại sứ giả nếu đang mở. */
export function setTong(m: { tong: string; wait: number }) { tongMsg = m; if (npcDefOpen?.role === "tong") renderNpc(); }

/** NPC đang mở hộp thoại (null = đóng). */
export const npcOpenId = () => npcDefOpen?.id ?? null;
/** Mở hộp thoại NPC `id` (server đã cho phép): bắt đầu từ câu thoại đầu tiên; đóng túi đồ và bảng đội hình (cùng chỗ giữa màn hình). */
export function openNpc(id: string, bag: BagMsg | null, act: NpcActions) {
  const def = NPCS.find((n) => n.id === id); if (!def) return;
  // NPC giao nhiệm vụ (6.2) đang có bài mới / chờ trả thì mở thẳng trang nhiệm vụ.
  if (npcDefOpen?.id !== id) {
    const qs = questOf(id)?.status, ds = id === DAILY.giver ? dailyMark() : null;
    npcPage = qs === "offer" || qs === "ready" ? "quest" : ds === "offer" || ds === "ready" ? "daily" : "talk"; npcLine = 0;
  }
  npcDefOpen = def; npcBagMsg = bag; npcAct = act; sellConfirm = null; enhClose();
  toggleBag(false); toggleRoster(false); toggleReso(false);
  $("#npc").hidden = false;
  renderNpc();
}
export function closeNpc() {
  if (!npcDefOpen) return;
  npcDefOpen = null; npcAct = null; sellConfirm = null; enhClose();
  const el = $("#npc"); el.hidden = true; el.innerHTML = "";
}
/** Túi đổi (mua, bán, cường hóa): vẽ lại hộp thoại đang mở với Hồn Tệ và đồ mới. */
export function npcBag(bag: BagMsg) { npcBagMsg = bag; bagCap = bag.slots; enhCoin = bag.honTe; if (npcDefOpen) renderNpc(); }

function renderNpc() {
  const def = npcDefOpen, act = npcAct, el = $("#npc"); if (!def || !act) return;
  el.innerHTML = "";
  el.style.setProperty("--c", def.col);
  // 10.8: chân dung NPC 112×112 (npc_<mã>) bên trái tên, chức danh (chưa có ảnh thì chỉ có tên).
  const head = document.createElement("div"); head.className = "rhead nhead";
  head.innerHTML = `${artImg(`npc_${def.id}`, "nface")}<div class="nname"><b></b><small></small></div><button class="x" aria-label="Đóng">×</button>`;
  head.querySelector("b")!.textContent = def.name;
  head.querySelector("small")!.textContent = def.title;
  head.querySelector("button")!.addEventListener("click", () => closeNpc());
  el.appendChild(head);
  const row = document.createElement("div"); row.className = "brow";
  const btn = (text: string, cls: string, fn: () => void, disabled = false) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "buse " + cls; b.textContent = text; b.disabled = disabled;
    b.addEventListener("click", () => { b.blur(); fn(); }); row.appendChild(b); return b;
  };
  const go = (page: NpcPage) => { npcPage = page; sellConfirm = null; enhClose(); renderNpc(); };
  const bag = npcBagMsg;
  if (npcPage === "quest" || npcPage === "daily") {
    if (npcPage === "daily") renderDailyPage(el, act); else renderQuestPage(el, act);
    btn(`‹ Lời ${def.name}`, "drop", () => go("talk"));
    el.appendChild(row);
    return;
  }
  if (npcPage === "rank") { // bảng xếp hạng Đại Đấu Hồn Trường (7.2)
    el.appendChild(arenaRankEl(arenaTopMsg));
    btn(arenaQ ? "Hủy xếp hàng" : "Xếp hàng đấu hồn", arenaQ ? "drop" : "absorb", () => act.arena(arenaQ ? "cancel" : "queue"));
    btn("‹ Quay lại", "drop", () => go("talk"));
    el.appendChild(row);
    return;
  }
  if (npcPage !== "talk" && bag) {
    const coin = document.createElement("div"); coin.className = "coin";
    coin.innerHTML = `<i class="coinico"></i><span>Hồn Tệ:</span> ${honTeHtml(bag.honTe)}`;
    coin.title = `${bag.honTe.toLocaleString("vi-VN")} đồng (1 ngân = 100 đồng, 1 kim = 100 ngân)`;
    el.appendChild(coin);
  }
  if (npcPage === "talk" || !bag) {
    const n = def.lines.length, i = Math.min(npcLine, n - 1);
    const p = document.createElement("p"); p.className = "nline"; p.textContent = def.lines[i];
    if (i < n - 1) { p.title = "Bấm để nghe tiếp"; p.addEventListener("click", () => { npcLine = i + 1; renderNpc(); }); }
    el.appendChild(p);
    if (n > 1) { const k = document.createElement("small"); k.className = "rnote"; k.textContent = `${i + 1}/${n}`; el.appendChild(k); }
    if (i < n - 1) btn("Tiếp ›", "use", () => { npcLine = i + 1; renderNpc(); });
    const q = questOf(def.id), qc = q && questChain(q.chain);
    if (q && qc) btn(q.status === "done" ? `Nhiệm vụ: ${qc.name} (đã xong)` : `Nhiệm vụ: ${qc.steps[q.step].name}${q.status === "offer" ? " !" : q.status === "ready" ? " ?" : ""}`,
      "absorb", () => go("quest"));
    if (def.id === DAILY.giver && dailyMsg) { // khảo hạch hằng ngày
      const done = dailyMsg.list.filter((x) => x.status === "done").length, m = dailyMark();
      btn(`Khảo hạch hằng ngày (${done}/${dailyMsg.list.length})${m === "offer" ? " !" : m === "ready" ? " ?" : ""}`, "absorb", () => go("daily"));
    }
    if (def.role === "shop") {
      btn(shopExpands(def.id) ? "Mua đan dược, mở rộng túi" : "Mua đan dược, phù chú", "absorb", () => go("buy"), !bag); // #111: trại cổng không mở rộng túi
      btn("Bán đồ dư", "absorb", () => go("sell"), !bag);
      btn(`Mua lại đồ đã bán (${(bag?.buyback?.length ?? 0) + (bag?.sold?.length ?? 0)})`, "absorb", () => go("buyback"), !bag); // 9.8, đồ tự bán #216
      if (def.id === SHARD_BUY.npc) btn(`Đổi mảnh võ hồn${shardMsg ? ` (${shardMsg.n}/${shardMsg.daily} hôm nay)` : ""}`, "absorb", () => { act.shardInfo(); go("shard"); }, !bag); // #282
    }
    if (def.role === "forge") {
      btn("Cường hóa hồn cốt", "absorb", () => go("forge"), !bag);
      btn("Nâng cấp hồn hạch", "absorb", () => go("forgecore"), !bag); // 5.3
    }
    if (def.role === "arena") { // 7.2: server kiểm tra lại khoảng cách và trạng thái khi xếp hàng
      btn(arenaQ ? "Hủy xếp hàng" : "Xếp hàng đấu hồn", arenaQ ? "drop" : "absorb", () => act.arena(arenaQ ? "cancel" : "queue"));
      btn("Bảng xếp hạng", "absorb", () => { act.arena("top"); go("rank"); });
    }
    if (def.role === "tong") {
      const t = TONG_MON.find((x) => x.npc === def.id), cur = TONG_MON.find((x) => x.id === tongMsg?.tong);
      if (t && t.id === cur?.id) btn(`Đã là người của ${t.name}`, "absorb", () => {}, true);
      else if (t) btn(cur ? `Đổi sang ${t.name}` : `Gia nhập ${t.name}`, "absorb", () => act.tong("join", t.id));
      if (cur) btn(`Rời ${cur.name}`, "drop", () => act.tong("leave"));
      if (tongMsg && tongMsg.wait > 0) { const k = document.createElement("small"); k.className = "rnote"; k.textContent = `Còn ${Math.ceil(tongMsg.wait / 86400)} ngày nữa mới đổi được tông.`; el.appendChild(k); }
    }
    btn("Tạm biệt", "drop", () => closeNpc());
    el.appendChild(row);
    if (NPC_ROLE_NOTE[def.role]) { const k = document.createElement("small"); k.className = "rnote"; k.textContent = NPC_ROLE_NOTE[def.role]; el.appendChild(k); }
    return;
  }
  if (npcPage === "buy") renderShopBuy(el, bag, act, def.id);
  else if (npcPage === "sell") renderShopSell(el, bag, act);
  else if (npcPage === "buyback") renderShopBuyback(el, bag, act);
  else if (npcPage === "shard") renderShardShop(el, bag, act);
  else { const box = npcPage === "forgecore" ? renderForgeCores(bag, act) : renderForge(bag, act); el.appendChild(box); if (box.classList.contains("epick")) return; }
  btn("‹ Quay lại", "drop", () => go("talk"));
  el.appendChild(row);
}

/**
 * Cửa hàng của thương nhân `npcId`: mỗi món trong bảng hàng (shopOf: SHOP trong thành, CAMP_SHOP ở trại cổng) một dòng (giá, đang có),
 * nút mua 1 / 5 / 10; thiếu Hồn Tệ thì mờ nút (server vẫn kiểm tra lại). Mở rộng túi chỉ ở thương nhân trong thành (shopExpands).
 */
function renderShopBuy(el: HTMLElement, bag: BagMsg, act: NpcActions, npcId: string) {
  const used = bag.items.filter((i) => i.vohon === null).length, shop = shopOf(npcId);
  for (const r of shop) {
    const def = itemDef(r.code); if (!def) continue;
    const have = bag.items.filter((i) => i.code === r.code && i.vohon === null).reduce((a, i) => a + i.qty, 0);
    const o = document.createElement("div"); o.className = "shoprow"; o.style.setProperty("--c", def.col);
    o.innerHTML = `${artImg(`item_${def.id}`, "ico art") || `<i class="ico ${def.kind}"></i>`}<div><b></b><small></small></div><div class="brow"></div>`;
    o.querySelector("b")!.textContent = def.name;
    o.querySelector("small")!.textContent = `${formatHonTe(r.price)} mỗi viên · đang có ${have} · ${def.desc}`;
    const row = o.querySelector(".brow")!;
    for (const q of [1, 5, 10].filter((x) => x <= SHOP_MAX_QTY)) {
      const b = document.createElement("button"); b.type = "button"; b.className = "buse use";
      b.textContent = `Mua ${q}`; b.disabled = bag.honTe < r.price * q;
      b.title = `${q} ${def.name}: ${formatHonTe(r.price * q)}`;
      b.setAttribute("aria-label", `Mua ${q} ${def.name}, giá ${formatHonTe(r.price * q)}`);
      b.addEventListener("click", () => { b.blur(); act.buy(r.code, q); });
      row.appendChild(b);
    }
    el.appendChild(o);
  }
  // Mở rộng túi (9.8): +BAG_EXPAND ô mỗi lần tới BAG_MAX_SLOTS, giá tăng dần (bagExpandCost); bấm hai lần. Server kiểm tra lại.
  if (shopExpands(npcId)) {
    const cost = bagExpandCost(bag.slots);
    const o = document.createElement("div"); o.className = "shoprow"; o.style.setProperty("--c", "#f2c84b");
    o.innerHTML = `<i class="ico ruong"></i><div><b>Mở rộng túi</b><small></small></div><div class="brow"></div>`;
    o.querySelector("small")!.textContent = cost === null ? `Túi đã tối đa ${BAG_MAX_SLOTS} ô.`
      : `+${BAG_EXPAND} ô (${bag.slots} → ${Math.min(BAG_MAX_SLOTS, bag.slots + BAG_EXPAND)} ô), tối đa ${BAG_MAX_SLOTS} ô · ${formatHonTe(cost)}`;
    if (cost !== null) {
      const b = document.createElement("button"); b.type = "button"; b.className = "buse " + (sellConfirm === "expand" ? "eok" : "use");
      b.textContent = sellConfirm === "expand" ? `Mở rộng thật? −${formatHonTe(cost)}` : `Mở rộng · ${formatHonTe(cost)}`;
      b.disabled = bag.honTe < cost;
      b.setAttribute("aria-label", `Mở rộng túi thêm ${BAG_EXPAND} ô, giá ${formatHonTe(cost)}`);
      b.addEventListener("click", () => {
        b.blur();
        if (sellConfirm !== "expand") { sellConfirm = "expand"; renderNpc(); return; }
        sellConfirm = null; act.expand();
      });
      o.querySelector(".brow")!.appendChild(b);
    }
    el.appendChild(o);
  }
  const n = document.createElement("small"); n.className = "rnote";
  n.textContent = `Túi đồ ${used}/${bag.slots} ô; đan cùng loại tự gộp tối đa ${itemDef(shop[0]?.code ?? "")?.stack ?? 99} viên một ô. Túi không đủ chỗ hoặc thiếu Hồn Tệ thì không mua được.`
    + (shopExpands(npcId) ? "" : " Mở rộng túi, đan lớn: về thương nhân trong thành.");
  el.appendChild(n);
}

/**
 * Thương hội đổi mảnh võ hồn (#282): mỗi võ hồn SR / SSR trong ARENA_SHARDS một dòng (mảnh đang có, đã có võ hồn chưa), nút đổi 1 /
 * 5 / hết lượt hôm nay với tổng giá (shardBuyCost theo số đã đổi hôm nay, tin "shardinfo"); thiếu Hồn Tệ thì mờ nút. Server tính giá
 * và kiểm lại lượt, tiền, chỗ trống.
 */
function renderShardShop(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const K = SHARD_BUY, n = shardMsg?.n ?? 0, left = Math.max(0, K.daily - n), owned = new Set(act.owned());
  const head = document.createElement("small"); head.className = "rnote";
  head.textContent = !shardMsg ? "Đang hỏi Chưởng quỹ số mảnh đã đổi hôm nay…"
    : left ? `Hôm nay đã đổi ${n}/${K.daily} mảnh · mảnh kế tiếp ${formatHonTe(shardBuyPrice(n))}.`
    : `Hôm nay đã đổi đủ ${K.daily}/${K.daily} mảnh. Lượt mới lúc 00:00 giờ Việt Nam.`;
  el.appendChild(head);
  const qs = shardMsg ? [...new Set([1, 5, left])].filter((q) => q >= 1 && q <= left).sort((a, b) => a - b) : [];
  for (const id of ARENA_SHARDS) {
    const v = VOHON[vohonIndex(id)], def = itemDef(shardCode(id)); if (!v || !def) continue;
    const have = bag.items.filter((i) => i.code === def.id && i.vohon === null).reduce((a, i) => a + i.qty, 0);
    const o = document.createElement("div"); o.className = "shoprow"; o.style.setProperty("--c", v.col);
    o.innerHTML = `<i class="ico ${def.kind}"></i><div><b></b><small></small></div><div class="brow"></div>`;
    o.querySelector("b")!.textContent = `${v.name} (${v.rarity})`;
    o.querySelector("small")!.textContent = `đang có ${have} mảnh · ${owned.has(id) ? "đã có võ hồn" : `chưa có (mở bằng ${SHARD_UNLOCK} mảnh)`}`;
    for (const q of qs) {
      const cost = shardBuyCost(n, q), b = document.createElement("button"); b.type = "button"; b.className = "buse use";
      b.textContent = `Đổi ${q} · ${formatHonTe(cost)}`; b.disabled = bag.honTe < cost;
      b.setAttribute("aria-label", `Đổi ${q} mảnh ${v.name}, giá ${formatHonTe(cost)}`);
      b.addEventListener("click", () => { b.blur(); act.shard(id, q); });
      o.querySelector(".brow")!.appendChild(b);
    }
    el.appendChild(o);
  }
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = `Giá tăng dần theo số mảnh đã đổi trong ngày, tính chung mọi võ hồn: ${Array.from({ length: K.daily }, (_, i) => formatHonTe(shardBuyPrice(i))).join(" → ")}. `
    + `Tối đa ${K.daily} mảnh mỗi ngày, đặt lại 00:00 giờ Việt Nam. Thương hội không bán mảnh UR. Túi phải đủ chỗ cho cả số mảnh.`;
  el.appendChild(note);
}

/**
 * Mua lại (9.8): BUYBACK_MAX món bán gần nhất (mới nhất trước) với đúng giá đã bán; món về túi đúng như lúc bán (chỉ số, cấp cường
 * hóa). Thiếu Hồn Tệ thì mờ nút; server kiểm tra lại tiền và chỗ trống.
 */
function renderShopBuyback(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const list = bag.buyback ?? [], sold = bag.sold ?? [];
  if (!list.length && !sold.length) {
    const p = document.createElement("p"); p.className = "nline"; p.textContent = "Ngươi chưa bán gì cho ta từ lúc tới đây. Bán nhầm thì quay lại, ta trả lại đúng món, đúng giá.";
    el.appendChild(p);
  }
  buybackRows(el, bag, act, list);
  const n = document.createElement("small"); n.className = "rnote";
  n.textContent = `Thương nhân giữ ${BUYBACK_MAX} món bán gần nhất (cả hai thành), mua lại đúng giá đã bán; rời game thì mất. Cần ô trống trong túi.`;
  el.appendChild(n);
  // Đồ tự bán từ xa (#216): AUTO_SELL_BUYBACK món gần nhất, lưu theo tài khoản (không mất khi rời game), cùng nút mua lại.
  if (!sold.length) return;
  const h = document.createElement("p"); h.className = "nline"; h.textContent = `Đồ tự bán gần đây (${sold.length}/${AUTO_SELL_BUYBACK}):`;
  el.appendChild(h);
  buybackRows(el, bag, act, sold);
}

/** Các dòng mua lại (đồ bán tay hoặc đồ tự bán): tên, giá đã bán, nút "Mua lại" (thiếu Hồn Tệ thì mờ). */
function buybackRows(el: HTMLElement, bag: BagMsg, act: NpcActions, list: BuybackItem[]) {
  for (const e of list) {
    const it: BagItem = { ...e, id: e.key, vohon: null }, def = itemDef(e.code), cost = e.price * e.qty;
    const o = document.createElement("div"); o.className = "shoprow"; o.style.setProperty("--c", itemColor(it));
    o.innerHTML = `${itemArt(it) || `<i class="ico ${def?.kind ?? "unknown"}"></i>`}<div><b></b><small></small></div><div class="brow"></div>`;
    o.querySelector("b")!.textContent = `${itemName(it)}${e.qty > 1 ? ` ×${e.qty}` : ""}`;
    o.querySelector("small")!.textContent = `${def ? ITEM_KINDS[def.kind].name : "Vật phẩm lạ"} · đã bán ${formatHonTe(cost)}${e.enhance && boneOf(it) ? ` · cường hóa +${e.enhance}` : ""}`;
    const b = document.createElement("button"); b.type = "button"; b.className = "buse use";
    b.textContent = `Mua lại · −${formatHonTe(cost)}`; b.disabled = bag.honTe < cost;
    b.setAttribute("aria-label", `Mua lại ${itemName(it)}, giá ${formatHonTe(cost)}`);
    b.addEventListener("click", () => { b.blur(); act.buyback(e.key); });
    o.querySelector(".brow")!.appendChild(b);
    el.appendChild(o);
  }
}

/**
 * Bán đồ dư: mọi ô trong túi mà thương nhân mua (sellPrice khác null: hồn hoàn, hồn cốt, hồn hạch, mảnh võ hồn), giá theo niên hạn
 * / sao / độ hiếm (chỉ để hiển thị, server tính lại). Đồ đang gắn không nằm trong danh sách. Món giá trị phải bấm hai lần.
 */
function renderShopSell(el: HTMLElement, bag: BagMsg, act: NpcActions) {
  const list = bag.items.filter((i) => i.vohon === null && !i.lock && sellPrice(i) !== null); // món khoá (#216) không bán
  const kindOrder = ["hon_hoan", "hon_cot", "hon_hach", "manh_vo_hon"];
  list.sort((a, b) => kindOrder.indexOf(itemDef(a.code)?.kind ?? "") - kindOrder.indexOf(itemDef(b.code)?.kind ?? "") || (sellPrice(b) ?? 0) - (sellPrice(a) ?? 0));
  if (!list.length) {
    const p = document.createElement("p"); p.className = "nline"; p.textContent = "Túi không có đồ nào ta mua: mang hồn hoàn, hồn cốt, hồn hạch hay mảnh võ hồn dư tới đây.";
    el.appendChild(p);
  }
  for (const it of list) {
    const price = sellPrice(it)!, def = itemDef(it.code);
    const o = document.createElement("div"); o.className = "shoprow"; o.style.setProperty("--c", itemColor(it));
    o.innerHTML = `${itemArt(it) || `<i class="ico ${def?.kind ?? "unknown"}"></i>`}<div><b></b><small></small></div><div class="brow"></div>`;
    o.querySelector("b")!.textContent = `${itemName(it)}${it.qty > 1 ? ` ×${it.qty}` : ""}`;
    o.querySelector("small")!.textContent = `${ITEM_KINDS[def!.kind].name} · ${formatHonTe(price)}${it.qty > 1 ? " mỗi món" : ""}${it.enhance && boneOf(it) ? ` · cường hóa +${it.enhance}` : ""}`;
    const row = o.querySelector(".brow")!;
    const sell = (qty: number, label: string) => {
      const key = `${it.id}|${qty}`, gain = price * qty, ask = gain >= SELL_CONFIRM_DONG || it.enhance > 0;
      const b = document.createElement("button"); b.type = "button"; b.className = "buse " + (sellConfirm === key ? "eok" : "use");
      b.textContent = sellConfirm === key ? `Bán thật? +${formatHonTe(gain)}` : `${label} · +${formatHonTe(gain)}`;
      b.setAttribute("aria-label", `${label} ${itemName(it)}, nhận ${formatHonTe(gain)}`);
      b.addEventListener("click", () => {
        b.blur();
        if (ask && sellConfirm !== key) { sellConfirm = key; renderNpc(); return; }
        sellConfirm = null; act.sell(it.id, qty);
      });
      row.appendChild(b);
    };
    if (it.qty > 1) { sell(1, "Bán 1"); sell(it.qty, "Bán hết"); } else sell(1, "Bán");
    el.appendChild(o);
  }
  const worn = bag.items.filter((i) => i.vohon !== null).length, locked = bag.items.filter((i) => i.vohon === null && i.lock).length;
  const n = document.createElement("small"); n.className = "rnote";
  n.textContent = (worn ? `${worn} món đang gắn trên võ hồn không hiện ở đây (tháo ra trước mới bán được). ` : "")
    + (locked ? `${locked} ô đang khoá không hiện ở đây (mở khoá ở túi đồ). ` : "")
    + `Thương nhân không mua đan dược và rương. Bán nhầm thì mua lại được đúng giá (${BUYBACK_MAX} món gần nhất, mất khi rời game).`;
  el.appendChild(n);
}

/**
 * Lò rèn: chọn một hồn cốt (đang gắn hoặc trong túi) để mở bảng cường hóa của bước 4.4 (enhancePicker, message `enhance` giữ
 * nguyên); nâng cấp hồn hạch ở trang riêng (renderForgeCores, 5.3). Bảng cường hóa vẫn mở được từ túi đồ / bảng hồn cốt như trước.
 */
function renderForge(bag: BagMsg, act: NpcActions): HTMLElement {
  const again = () => renderNpc();
  const target = enhTarget ? bag.items.find((i) => i.id === enhTarget) : undefined;
  if (target && boneOf(target) && target.years !== null) {
    return enhancePicker(target as BagItem & { years: number }, bag.items, act, again); // nút "Đóng" của bảng về danh sách hồn cốt
  }
  if (enhTarget) enhClose();
  const box = document.createElement("div"); box.className = "forge";
  const h = document.createElement("b"); h.className = "shead"; h.textContent = "Cường hóa hồn cốt"; box.appendChild(h);
  const bones = bag.items.filter((i) => boneOf(i) && i.years !== null) as (BagItem & { years: number })[];
  bones.sort((a, b) => Number(b.vohon !== null) - Number(a.vohon !== null) || b.enhance - a.enhance || b.years - a.years);
  if (!bones.length) { const p = document.createElement("small"); p.textContent = "Chưa có hồn cốt nào. Hồn cốt rơi khi hạ hồn thú; hồn cốt dư dùng làm nguyên liệu."; box.appendChild(p); }
  for (const it of bones) {
    const b = document.createElement("button"); b.type = "button"; b.className = "aopt eopt"; b.style.setProperty("--c", itemColor(it));
    b.disabled = it.enhance >= BONE_MAX_ENHANCE;
    b.innerHTML = `<b></b><i></i><span></span>`;
    b.querySelector("b")!.textContent = itemName(it);
    b.querySelector("i")!.textContent = it.vohon !== null ? "đang gắn" : "trong túi";
    b.querySelector("span")!.textContent = enhText(it);
    b.addEventListener("click", () => { b.blur(); enhOpen(it.id); again(); });
    box.appendChild(b);
  }
  return box;
}

/**
 * Lò rèn, trang nâng cấp hồn hạch (bước 5.3): chọn một hồn hạch (đang gắn trước, rồi cấp cao, sao cao) để mở bảng nâng cấp
 * (corePicker, message `enhancecore`); nút "Đóng" của bảng về danh sách. Bảng vẫn mở được từ túi đồ / mục hồn hạch như hồn cốt.
 */
function renderForgeCores(bag: BagMsg, act: NpcActions): HTMLElement {
  const again = () => renderNpc();
  const target = enhTarget ? bag.items.find((i) => i.id === enhTarget) : undefined;
  if (target && coreOf(target)) return corePicker(target, bag.items, act, again);
  if (enhTarget) enhClose();
  const box = document.createElement("div"); box.className = "forge";
  const h = document.createElement("b"); h.className = "shead"; h.textContent = "Nâng cấp hồn hạch"; box.appendChild(h);
  const cores = bag.items.filter((i) => coreOf(i));
  cores.sort((a, b) => Number(b.vohon !== null) - Number(a.vohon !== null) || b.enhance - a.enhance || (b.stars ?? 1) - (a.stars ?? 1));
  if (!cores.length) { const p = document.createElement("small"); p.textContent = "Chưa có hồn hạch nào. Hồn hạch rơi khi hạ hồn thú; hồn hạch dư dùng làm nguyên liệu."; box.appendChild(p); }
  for (const it of cores) {
    const b = document.createElement("button"); b.type = "button"; b.className = "aopt eopt"; b.style.setProperty("--c", itemColor(it));
    b.disabled = it.enhance >= CORE_MAX_ENHANCE;
    b.innerHTML = `<b></b><i></i><span></span>`;
    b.querySelector("b")!.textContent = itemName(it);
    b.querySelector("i")!.textContent = it.vohon !== null ? "đang gắn" : "trong túi";
    b.querySelector("span")!.textContent = `${coreEnhText(it)} · ${coreOf(it)!.subs.length}/${CORE_MAX_SUBS} dòng phụ`;
    b.addEventListener("click", () => { b.blur(); enhOpen(it.id); again(); });
    box.appendChild(b);
  }
  return box;
}

// ---------- Nhiệm vụ: chuỗi tân thủ của Ngọc Tiểu Cương (mục 5.8, bước 6.2) ----------
let questMsg: QuestMsg | null = null; // tin "quest" gần nhất của chuỗi tân thủ (tiến độ do server giữ; khung theo dõi chỉ vẽ chuỗi này, chương 2 ở #190)
const questMsgs = new Map<string, QuestMsg>(); // tin "quest" gần nhất của từng chuỗi cố định (kể cả tân thủ)
let questFold = false;                // khung theo dõi đang thu gọn
let dailyMsg: DailyMsg | null = null; // tin "daily" gần nhất (khảo hạch hằng ngày, server giữ tiến độ)
let dailyFold = false;
/** Tiến độ chuỗi mà NPC `id` giao (null = NPC không giao nhiệm vụ, chưa nhận tin "quest", hoặc chuỗi chưa mở theo QUEST_AFTER). */
export const questOf = (id: string) => {
  const q = [...questMsgs.values()].find((m) => questChain(m.chain)?.giver === id), after = q && QUEST_AFTER[q.chain];
  return q && (!after || questMsgs.get(after)?.status === "done") ? q : null;
};
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
    row.querySelector("span")!.textContent = (n !== null && n >= g.n ? "✓ " : "• ") + g.text;
    row.querySelector("em")!.textContent = n === null ? `×${g.n}` : `${n}/${g.n}`;
    box.appendChild(row);
  });
  return box;
}
/**
 * Khung theo dõi trên màn hình: chuỗi tân thủ (tên bài, mục tiêu x/N, gợi ý quay về NPC; xong cả chuỗi thì bỏ phần này) rồi mục
 * "Hằng ngày" (khảo hạch của Phất Lan Đức); bấm / chạm tiêu đề từng phần để thu gọn. Không còn gì để theo dõi thì ẩn.
 */
function renderQuestTracker() {
  const el = $("#quest"); el.innerHTML = "";
  const starter = renderStarterTracker(el), daily = renderDailyTracker(el);
  el.hidden = !starter && !daily;
}
function renderStarterTracker(el: HTMLElement) {
  const q = questMsg, { c, npc, where } = q ? giverOf(q.chain) : { c: undefined, npc: undefined, where: "" };
  if (!q || !c || q.status === "done") return false;
  const s = c.steps[q.step];
  const head = document.createElement("button"); head.type = "button"; head.className = "qhead"; head.setAttribute("aria-expanded", String(!questFold));
  head.innerHTML = "<b></b><i></i>";
  head.querySelector("b")!.textContent = `${s.name}${q.status === "offer" ? " !" : q.status === "ready" ? " ?" : ""}`;
  head.querySelector("i")!.textContent = `${q.step + 1}/${c.steps.length} ${questFold ? "▸" : "▾"}`;
  head.title = questFold ? "Mở khung nhiệm vụ" : "Thu gọn khung nhiệm vụ";
  head.addEventListener("click", () => { questFold = !questFold; renderQuestTracker(); }); // chuột, chạm và bàn phím
  el.appendChild(head);
  const sub = document.createElement("small"); sub.textContent = c.name; el.appendChild(sub);
  if (questFold) return true;
  const tip = (text: string) => { const t = document.createElement("div"); t.className = "qtip"; t.textContent = text; el.appendChild(t); };
  if (q.status === "offer") { tip(`Gặp ${npc?.name ?? "NPC"} ở ${where} để nhận bài này.`); return true; }
  el.appendChild(questGoals(s, q.prog));
  if (q.status === "ready") tip(`Đã xong: quay về gặp ${npc?.name ?? "NPC"} ở ${where} để nhận thưởng.`);
  else { const d = document.createElement("small"); d.textContent = s.desc; el.appendChild(d); }
  return true;
}
/** Trang nhiệm vụ trong hộp thoại NPC giao nhiệm vụ: lời giao + mục tiêu + thưởng + "Nhận", tiến độ, lời khi trả + "Trả", lời kết. */
function renderQuestPage(el: HTMLElement, act: NpcActions) {
  const q = npcDefOpen ? questOf(npcDefOpen.id) : null, c = q && questChain(q.chain);
  const say = (t: string) => { const p = document.createElement("p"); p.className = "nline"; p.textContent = t; el.appendChild(p); };
  if (!q || !c) { say("…"); return; }
  if (q.status === "done") { say(c.finale); const k = document.createElement("small"); k.className = "rnote"; k.textContent = `Đã học xong cả ${c.steps.length} bài của "${c.name}".`; el.appendChild(k); return; }
  const s = c.steps[q.step];
  const box = document.createElement("div"); box.className = "qbox";
  const h = document.createElement("b"); h.textContent = `Bài ${q.step + 1}/${c.steps.length}: ${s.name}`; box.appendChild(h);
  const d = document.createElement("span"); d.textContent = s.desc; box.appendChild(d);
  box.appendChild(questGoals(s, q.status === "offer" ? null : q.prog));
  const r = document.createElement("span"); r.className = "qrew"; r.textContent = `Phần thưởng: ${questRewardText(s.reward)}`; box.appendChild(r);
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
export function questMark(id: string): "offer" | "ready" | "active" | null {
  const st = questOf(id)?.status;
  if (st === "offer" || st === "ready" || st === "active") return st;
  return id === DAILY.giver ? dailyMark() : null;
}
function dailyMark(): "offer" | "ready" | "active" | null {
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
  head.addEventListener("click", () => { dailyFold = !dailyFold; renderQuestTracker(); });
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
function renderDailyPage(el: HTMLElement, act: NpcActions) {
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
      const r = document.createElement("span"); r.className = "qrew"; r.textContent = `Phần thưởng: ${questRewardText(s.reward)}`; box.appendChild(r);
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
 * `friendly` (9.7): cặp đã đấu đủ ARENA.pairDaily trận tính Elo hôm nay, trận này giao hữu (không đổi Elo, không thưởng, không mất lượt).
 */
export interface ArenaEndMsg {
  score: number; reason: string; why: string; foe: string; elo0: number; elo1: number; rec: ArenaRecord;
  reward: { honTe: number; code: string; qty: number; coin: number } | null; left: number; secs: number; friendly?: boolean;
}
let arenaQ: { elo: number; t0: number } | null = null;   // đang xếp hàng: Elo, lúc bắt đầu chờ (performance.now)
let arenaTopMsg: ArenaTopMsg | null = null;
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

/** Bảng xếp hạng (top ARENA.topN, dòng của mình sáng) kèm hạng / thành tích của mình và lượt thắng có thưởng còn lại. */
function arenaRankEl(m: ArenaTopMsg | null) {
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
export function showArena(a: { phase: string; time: number; me: string; friendly: boolean; sides: { sid: string; name: string; elo: number; pct: number; alive: number; total: number }[] } | null,
  leave: () => void) {
  const el = $("#arenaBar"); document.body.classList.toggle("arena", !!a);
  if (!a) { el.hidden = true; el.innerHTML = ""; return; }
  if (!el.firstChild) {
    el.innerHTML = `<div class="aside a0"><b></b><small></small><div class="bar"><i></i><span></span></div></div>
      <div class="aclock"><b></b><small></small><button type="button" class="aleave">Rời sân</button></div>
      <div class="aside a1"><b></b><small></small><div class="bar"><i></i><span></span></div></div>`;
    el.querySelector(".aleave")!.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const fight = el.dataset.phase === "fight" || el.dataset.phase === "ready";
      if (fight && performance.now() - arenaLeaveAt > 3000) { arenaLeaveAt = performance.now(); el.querySelector(".aleave")!.textContent = "Rời = thua?"; return; }
      leave();
    });
  }
  el.hidden = false; el.dataset.phase = a.phase;
  a.sides.forEach((s, i) => {
    const box = el.querySelector(`.a${i}`) as HTMLElement; if (!box) return;
    const me = s.sid.split(",").includes(a.me);
    box.classList.toggle("me", me);
    const name = `${s.name || "…"}${me ? " (đội của bạn)" : ""}`;
    if (box.querySelector("b")!.textContent !== name) box.querySelector("b")!.textContent = name;
    box.querySelector("small")!.textContent = `Elo ${s.elo}${s.sid ? "" : " · chưa vào sân"}`;
    (box.querySelector(".bar i") as HTMLElement).style.width = `${Math.round(s.pct * 1000) / 10}%`;
    box.querySelector(".bar span")!.textContent = `${Math.round(s.pct * 100)}% · ${s.alive}/${s.total} võ hồn`;
  });
  const ph = a.phase === "wait" ? "Chờ đối thủ vào sân" : a.phase === "ready" ? "Chuẩn bị" : a.phase === "fight" ? "Giao đấu" : "Kết thúc";
  el.querySelector(".aclock b")!.textContent = a.phase === "end" ? "–" : mmss(a.time);
  el.querySelector(".aclock small")!.textContent = a.friendly ? `${ph} · giao hữu` : ph;
  el.classList.toggle("friendly", a.friendly);
  el.title = a.friendly ? `Giao hữu: hai bạn đã đấu đủ ${ARENA.pairDaily} trận tính Elo hôm nay, trận này không đổi Elo, không thưởng.` : "";
  const lb = el.querySelector(".aleave")!;
  if (performance.now() - arenaLeaveAt > 3000 && lb.textContent !== "Rời sân") lb.textContent = "Rời sân";
}

/** Bảng kết quả trận (tin "arena" k = "end"): thắng / thua / hòa, lý do, Elo trước → sau, phần thưởng, bảng xếp hạng, nút về bản đồ. */
export function arenaEnd(m: ArenaEndMsg | null, act: { back(): void; top(): void }) {
  arenaEndMsg = m ? { ...m, end: performance.now() + m.secs * 1000, act } : null;
  if (!m) { const el = $("#arenaEnd"); el.hidden = true; el.innerHTML = ""; return; }
  renderArenaEnd();
}
function renderArenaEnd() {
  const m = arenaEndMsg, el = $("#arenaEnd"); if (!m) return;
  el.hidden = false; el.innerHTML = "";
  el.className = "panel " + (m.score === 1 ? "win" : m.score === 0 ? "lose" : "draw");
  const h = document.createElement("h2"); h.textContent = m.score === 1 ? "Thắng!" : m.score === 0 ? "Thua" : "Hòa"; el.appendChild(h);
  const line = (text: string, cls = "") => { const p = document.createElement("div"); p.className = "aline " + cls; p.textContent = text; el.appendChild(p); };
  if (m.friendly) line(`Trận giao hữu: hai bạn đã đấu đủ ${ARENA.pairDaily} trận tính Elo hôm nay (đặt lại 00:00 giờ Việt Nam).`, "afriend");
  line(`Đối thủ ${m.foe}: ${m.why}.`);
  line(m.friendly ? `Elo giữ nguyên: ${m.elo1}` : `Elo ${m.elo0} → ${m.elo1} (${signed(m.elo1 - m.elo0)})`, "aelo");
  line(`Thành tích: ${m.rec.wins} thắng · ${m.rec.losses} thua · ${m.rec.draws} hòa`);
  if (m.friendly) line("Giao hữu không thưởng, không tính thành tích, không mất lượt thắng có thưởng.");
  else if (m.reward) {
    const shard = m.reward.qty ? ` + ${m.reward.qty} ${itemDef(m.reward.code)?.name ?? m.reward.code}` : "";
    line(`Thưởng: ${formatHonTe(m.reward.honTe)}${shard}${m.reward.coin ? " (túi đầy: mảnh đổi ra Hồn Tệ)" : ""}`, "arew");
  } else if (m.score === 1) line("Hết lượt thắng có thưởng hôm nay (Elo vẫn tính).");
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
let resMsg: ResonanceMsg | null = null;
let resTopMsg: ResonanceTopMsg | null = null;
let resTopRequest: (page: number, pageSize: number) => void = () => {};
/** Tin "resonance" mới: vẽ lại bảng nếu đang mở. */
export function setResonance(m: ResonanceMsg) { resMsg = m; if (!$("#reso").hidden) renderReso(); }
/** Tin "resonanceTop" mới: bảng công khai chỉ hiển thị tên / điểm và dòng riêng của mình. */
export function setResonanceTop(m: ResonanceTopMsg) { resTopMsg = m; if (!$("#reso").hidden) renderReso(); }
export function onResonanceTop(fn: (page: number, pageSize: number) => void) { resTopRequest = fn; }
/** Mở / đóng bảng Cộng minh (phím K, nút trong khung chỉ số và trong bảng đội hình); cùng chỗ giữa màn hình với các bảng khác. */
export function toggleReso(open = $("#reso").hidden) {
  $("#reso").hidden = !open; $("#resBtn").setAttribute("aria-expanded", String(open));
  if (open) { toggleRoster(false); toggleBag(false); closeNpc(); toggleWorld(false); renderReso(); }
}
/**
 * Bảng Cộng minh: tổng % đang cộng cho mọi võ hồn, rồi 5 trụ cột (RESONANCE): tiến độ x/mốc kế tiếp kèm thanh, các mốc (đã đạt
 * sáng màu trụ cột, chưa đạt mờ) và phần cộng của từng mốc.
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
  RESONANCE.forEach((r, i) => {
    const have = resMsg?.prog[i] ?? 0, lv = resMsg?.lv[i] ?? 0, next = r.steps[lv];
    const box = document.createElement("section"); box.className = "respil"; box.style.setProperty("--c", r.col);
    const top = document.createElement("div"); top.className = "restop";
    const name = document.createElement("b"); name.textContent = `${r.name} · ${lv}/${r.steps.length} mốc`;
    const prog = document.createElement("span");
    prog.textContent = next ? `${have}/${next.need} ${r.what}` : `${have} ${r.what} · đã đạt mọi mốc`;
    top.append(name, prog);
    const bar = document.createElement("span"); bar.className = "sbar";
    const fill = document.createElement("i"); fill.style.width = `${next ? Math.min(100, (have / next.need) * 100) : 100}%`; bar.appendChild(fill);
    const steps = document.createElement("div"); steps.className = "ressteps";
    r.steps.forEach((s, k) => {
      const st = document.createElement("span"); st.className = "resstep" + (k < lv ? " on" : "");
      st.textContent = `${k < lv ? "✓ " : ""}${s.need}: ${resonanceText(s.bonus)}`;
      st.setAttribute("aria-label", `Mốc ${k + 1}: ${s.need} ${r.what}, ${resonanceText(s.bonus)}${k < lv ? ", đã đạt" : ", chưa đạt"}`);
      steps.appendChild(st);
    });
    box.append(top, bar, steps);
    el.appendChild(box);
  });
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
export const worldOpen = () => !$("#world").hidden;
/** Mở / đóng bảng bản đồ thế giới (phím M, nút "Thế giới", F khi đứng trên trận). Mở thì GameScene xin tin `world` mới. */
export function toggleWorld(open = $("#world").hidden) {
  $("#world").hidden = !open; $("#worldBtn")?.setAttribute("aria-expanded", String(open));
  if (open) { toggleRoster(false); toggleBag(false); toggleReso(false); closeNpc(); renderWorld(); $("#world").scrollTop = 0; } else worldPick = null;
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
    const lv = document.createElement("span"); lv.textContent = def.kind === "town" ? "Thành" : def.level ? `cấp ${def.level[0]}–${def.level[1]}` : "";
    top.append(name, lv); sec.appendChild(top);
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
  b.firstChild!.textContent = m.on ? "Đang tự động " : "Tự động ";
  b.title = `${m.on ? "Đang tự săn: tự đi / đánh hoặc phím T để tắt" : "Bảng Tự động: cài đặt và bật tự săn quanh chỗ đang đứng (phím T bật / tắt ngay)"}. Còn ${autoTimeText(m.left)} treo (mỗi ngày ${autoTimeText(m.max)} miễn phí).`;
}
export function setRecall(r: { label: string; secs: number } | null) { recall = r ? { ...r, t0: performance.now() } : null; }
/** Thanh niệm truyền tống (gọi trong updateStats khi không hấp thụ). Trả về true nếu đang hiện. */
function drawRecall(ch: HTMLElement) {
  if (!recall) return false;
  const t = Math.min(recall.secs, (performance.now() - recall.t0) / 1000), sec = (x: number) => x.toFixed(1).replace(".", ",");
  ch.style.display = "block"; $("#chFill").style.width = (t / recall.secs) * 100 + "%";
  const txt = `Truyền tống tới ${recall.label} · ${sec(t)} / ${sec(recall.secs)} giây`;
  const lb = ch.querySelector<HTMLElement>(".label")!;
  if (lb.textContent !== txt) lb.textContent = txt;
  ch.classList.remove("risk"); ch.style.setProperty("--c", "#8fe0ff");
  return true;
}
