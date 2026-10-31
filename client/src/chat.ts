// Ô chat của HUD (tách nguyên văn từ hud.ts, Part of #885): lịch sử, tab kênh, dòng log; kèm nút menu nhanh dựng cùng buildChatTabs.
import { WORLD_CHAT, formatHonTe } from "../../shared/data.ts";
import { initUiIcons } from "./uiIcons.ts";
import { setTip } from "./tooltip.ts";
import { pbtn } from "./domBtn.ts";
import { sysImportant, canMerge, mergedText, trimHist } from "./chatRoute.ts";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

/** Dòng riêng cho mình: lỗi / cảnh báo hiện mọi tab; dòng thường vào Hệ thống / Tất cả khi bộ lọc bật. */
export function log(text: string, col?: string, who?: string) { chatLine("sys", text, col, who); }
/** Như `log` nhưng đánh dấu QUAN TRỌNG tường minh (tin boss: màu do dữ liệu boss quyết định nên không đoán theo màu được) → hiện ở mọi tab. */
export function logImp(text: string, col?: string, who?: string) { chatLine("sys", text, col, who, undefined, true); }

// ---------- Ô chat (mục 4 "Lệnh chat", #188): tab Tất cả / Bản đồ / Tổ đội / Riêng / Tông / Thế giới, lịch sử chỉ trong phiên ----------
/** Kênh của một dòng: `sys` là thông báo riêng cho mình, không gửi tới người chơi khác. */
export type ChatCh = "sys" | "map" | "party" | "whisper" | "world" | "tong";
export type ChatTab = "all" | "map" | "party" | "whisper" | "world" | "tong" | "sys";
/** Màu kênh (thủy mặc, #188): tổ đội xanh lá như chấm đồng đội, tin riêng tím, thế giới vàng, tông môn (#198) lam ngọc. */
export const CHAT_COL: Record<Exclude<ChatCh, "sys">, string> = { map: "#9db3a2", party: "#7dff8a", whisper: "#c58cff", world: "#e9c45a", tong: "#6fd3e8" };
const CHAT_TAG: Partial<Record<ChatCh, string>> = { party: "[Đội]", whisper: "[Riêng]", world: "[Thế giới]", tong: "[Tông]" };
const CHAT_TABS: { id: ChatTab; name: string }[] = [
  { id: "all", name: "Tất cả" }, { id: "map", name: "Bản đồ" }, { id: "party", name: "Tổ đội" }, { id: "whisper", name: "Riêng" }, { id: "tong", name: "Tông" },
  { id: "world", name: "Thế giới" }, { id: "sys", name: "Hệ thống" }];
/** Màu vạch của tab Hệ thống (không phải kênh chat nên không nằm trong CHAT_COL). */
const SYS_TAB_COL = "#8fa89a";
/** Số dòng hiện lúc ô chat đóng (mờ dần sau CHAT_FADE_MS như trước) và lúc mở (không mờ, cuộn được); số dòng giữ trong phiên. */
const CHAT_SHOW = 6, CHAT_SHOW_OPEN = 40, CHAT_FADE_MS = 9000, CHAT_KEEP = 200;
/** Số dòng hệ thống thường giữ trong phiên (tab Hệ thống): không đẩy mất lịch sử chat. */
const SYS_KEEP = 120;
const LOOT_MERGE_MS = 2000;
interface ChatLine { ch: ChatCh; text: string; col?: string; who?: string; at: number; act?: { label: string; fn: () => void }; imp?: boolean; n?: number; lootKey?: string; }
const chatHist: ChatLine[] = [];
let chatTab: ChatTab = "all", chatPinned = false, chatTyping = false;
let systemOn = true;
/** Người gần nhất nhắn riêng cho mình (`/r`) và người gần nhất mình trò chuyện riêng (tin thường ở tab Riêng gửi cho người này). */
let replyTo = "", whisperTo = "";

/** Bộ lọc bật: dòng hệ thống thường hiện ở Hệ thống / Tất cả; dòng quan trọng luôn hiện ở mọi tab. */
const tabShows = (tab: ChatTab, l: ChatLine) => (l.ch === "sys" ? !!l.imp || systemOn && (tab === "sys" || tab === "all") : tab === "all" || l.ch === tab);
const chatOpen = () => chatPinned || chatTyping;

interface ReadPosition { bottom: boolean; anchors: { line: ChatLine; offset: number }[]; unread: boolean; }
const readPositions = new Map<ChatTab, ReadPosition>();
const lineElements = new WeakMap<Element, ChatLine>();
let renderedTab: ChatTab = "all", renderedOpen = false;
const nearBottom = (el: HTMLElement) => el.scrollHeight - el.clientHeight - el.scrollTop <= 8;

function markOtherTabsUnread(line: ChatLine) {
  for (const [tab, position] of readPositions) {
    if (tab !== chatTab && !position.bottom && tabShows(tab, line)) position.unread = true;
  }
}

/** Giữ mốc dòng và offset; nếu dòng bị bỏ do giới hạn lịch sử thì dùng dòng còn lại kế tiếp. */
function saveReadPosition() {
  const el = $("#log"); if (!el || !renderedOpen) return;
  const top = el.getBoundingClientRect().top;
  const bottom = nearBottom(el);
  const anchors = [...el.children].filter((row) => row.getBoundingClientRect().bottom > top).map((row) => ({ line: lineElements.get(row)!, offset: row.getBoundingClientRect().top - top }));
  readPositions.set(renderedTab, { bottom, anchors, unread: !bottom && !!readPositions.get(renderedTab)?.unread });
}

function updateNewButton() {
  const b = $("#chat-new");
  if (b) b.hidden = !chatOpen() || !readPositions.get(chatTab)?.unread;
}

function readToEnd() {
  const el = $("#log"); if (!el) return;
  el.scrollTop = el.scrollHeight;
  readPositions.set(chatTab, { bottom: true, anchors: [], unread: false });
  document.querySelector(`#chattabs button[data-tab="${chatTab}"]`)?.classList.remove("new");
  updateNewButton();
}

function chatEl(l: ChatLine, fade: boolean) {
  const d = document.createElement("div");
  lineElements.set(d, l);
  const tag = chatTab === "all" ? CHAT_TAG[l.ch] : undefined;
  if (tag) { const t = document.createElement("i"); t.textContent = tag; t.style.color = l.col ?? ""; d.appendChild(t); }
  if (l.who) { const b = document.createElement("b"); b.textContent = l.who + ":"; if (tag) b.style.color = l.col ?? ""; d.appendChild(b); }
  d.appendChild(document.createTextNode(l.lootKey === "coin" ? `Nhận ${formatHonTe(l.n ?? 1)} Hồn Tệ` : mergedText(l.text, l.n)));
  if (l.act) { const { label, fn } = l.act; d.appendChild(pbtn(label, "ok chatact", fn, label)); } // nút trong dòng (Thêm lại, #195)
  if (l.col) d.style.borderLeftColor = l.col;
  if (l.lootKey) { d.classList.add("chat-loot"); d.style.setProperty("--c", l.col ?? "var(--plate-text)"); }
  if (fade) setTimeout(() => { d.style.opacity = "0"; setTimeout(() => d.remove(), 700); }, Math.max(0, CHAT_FADE_MS - (Date.now() - l.at)));
  return d;
}

/** Vẽ lại khung log theo tab và trạng thái mở / đóng. */
function renderChat(updated?: ChatLine) {
  const el = $("#log"); if (!el) return;
  saveReadPosition();
  const position = readPositions.get(chatTab);
  if (updated && tabShows(chatTab, updated) && position && !position.bottom) position.unread = true;
  const open = chatOpen(), now = Date.now();
  const lines = chatHist.filter((l) => tabShows(chatTab, l) && (open || now - l.at < CHAT_FADE_MS)).slice(-(open ? CHAT_SHOW_OPEN : CHAT_SHOW));
  el.replaceChildren(...lines.map((l) => chatEl(l, !open)));
  $("#chatbox")?.classList.toggle("open", open);
  const expand = $("#chat-expand");
  if (expand) { expand.textContent = open ? "Thu nhỏ" : "Mở chat"; expand.setAttribute("aria-expanded", String(open)); }
  renderedTab = chatTab; renderedOpen = open;
  if (open) {
    if (!position || position.bottom) readToEnd();
    else {
      const anchor = position.anchors.find((a) => [...el.children].some((row) => lineElements.get(row) === a.line));
      const row = anchor && [...el.children].find((row) => lineElements.get(row) === anchor.line);
      if (row) el.scrollTop += row.getBoundingClientRect().top - el.getBoundingClientRect().top - anchor!.offset;
      else el.scrollTop = 0;
    }
  }
  updateNewButton();
  for (const b of document.querySelectorAll<HTMLElement>("#chattabs button")) {
    const on = b.dataset.tab === chatTab;
    b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on));
    if (on && open && nearBottom(el)) b.classList.remove("new");
  }
  chatPlaceholder();
}

/** Thêm dòng trong phiên. `imp` tường minh thắng màu; bỏ trống thì suy từ màu / nút. Tab khác có tin mới thì hiện chấm. */
export function chatLine(ch: ChatCh, text: string, col?: string, who?: string, act?: ChatLine["act"], imp?: boolean) {
  const l: ChatLine = { ch, text, col, who, at: Date.now(), act, imp: ch === "sys" ? (imp ?? sysImportant(col, !!act)) : undefined };
  markOtherTabsUnread(l);
  if (ch === "sys") { // gộp dòng hệ thống lặp ("×n") thay vì xếp thêm
    let last: ChatLine | undefined; for (let i = chatHist.length - 1; i >= 0 && !last; i--) if (chatHist[i].ch === "sys") last = chatHist[i];
    if (last && !last.lootKey && !last.act && !act && !!last.imp === !!l.imp && canMerge(last, l)) { last.n = (last.n ?? 1) + 1; last.at = l.at; if (tabShows(chatTab, last)) renderChat(last); return; }
  }
  chatHist.push(l); trimHist(chatHist, CHAT_KEEP, SYS_KEEP);
  const el = $("#log"); if (!el) return;
  if (ch !== "sys" && ch !== chatTab) document.querySelector(`#chattabs button[data-tab="${ch}"]`)?.classList.add("new");
  if (!tabShows(chatTab, l)) return;
  renderChat(l);
}

/** Nhận từ chênh lệch túi của chính mình; cộng lượng thật, gộp cả khi có món khác xen giữa trong cửa sổ hai giây. */
export function chatLoot(key: string, name: string, n: number, col?: string) {
  const at = Date.now();
  const prev = [...chatHist].reverse().find((l) => l.lootKey === key && at - l.at <= LOOT_MERGE_MS);
  let updated = prev;
  if (prev) {
    prev.n = (prev.n ?? 1) + n;
    // Khi đang đọc giữ thứ tự dòng; chat thu nhỏ đưa món mới nhất xuống cuối. Không kéo dài cửa sổ gộp.
    if (!chatOpen()) { chatHist.splice(chatHist.indexOf(prev), 1); chatHist.push(prev); }
  } else {
    updated = { ch: "sys", text: `Nhận ${name}`, n, col, at, lootKey: key };
    chatHist.push(updated);
  }
  trimHist(chatHist, CHAT_KEEP, SYS_KEEP);
  if (updated) markOtherTabsUnread(updated);
  if (updated && tabShows(chatTab, updated)) renderChat(updated);
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
export function chatSendCh(): { ch: "map" | "party" | "whisper" | "world" | "tong"; to?: string } {
  if (chatTab === "party" || chatTab === "world" || chatTab === "tong") return { ch: chatTab };
  if (chatTab === "whisper") return { ch: "whisper", to: whisperTo };
  return { ch: "map" };
}

function chatPlaceholder() {
  const inp = $<HTMLInputElement>("#chat"); if (!inp) return;
  inp.placeholder = chatTab === "party" ? "Tổ đội: Enter để gửi (/d)"
    : chatTab === "whisper" ? (whisperTo ? `Riêng tới ${whisperTo}: Enter để gửi` : "Riêng: /t <tên> <tin>")
    : chatTab === "world" ? `Thế giới (từ cấp ${WORLD_CHAT.minLevel}, ${WORLD_CHAT.cdSecs} giây một tin): /tg`
    : chatTab === "tong" ? "Tông môn: Enter để gửi (/tm)"
    : chatTab === "sys" ? "Tin hệ thống: Enter để chat bản đồ"
    : "Nhấn Enter để chat (/d, /t, /r, /tm, /tg)";
  if (chatTab === "all" || chatTab === "map" || chatTab === "sys") inp.style.removeProperty("--c"); else inp.style.setProperty("--c", CHAT_COL[chatTab]);
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
  initUiIcons();
  const bar = $("#chattabs"); if (!bar) return;
  if (!bar.childElementCount) for (const t of CHAT_TABS) {
    const b = document.createElement("button");
    b.type = "button"; b.dataset.tab = t.id; b.textContent = t.name; b.setAttribute("role", "tab");
    if (t.id !== "all") b.style.setProperty("--c", t.id === "sys" ? SYS_TAB_COL : CHAT_COL[t.id]);
    if (t.id === "sys") setTip(b, { title: "Tin hệ thống", foot: "Lịch sử nhặt đồ, kinh nghiệm, thông báo" });
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); chatSetTab(t.id, true); });
    bar.appendChild(b);
  }
  if (!document.getElementById("chat-system-filter")) {
    $("#log")?.addEventListener("scroll", () => {
      saveReadPosition();
      if (renderedOpen && nearBottom($("#log"))) readToEnd();
      updateNewButton();
    });
    const controls = document.createElement("div"); controls.id = "chat-controls";
    const b = document.createElement("button"); b.id = "chat-system-filter"; b.type = "button";
    b.textContent = "Hệ thống"; b.setAttribute("aria-label", "Lọc thông báo Hệ thống");
    b.setAttribute("aria-pressed", String(systemOn));
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); systemOn = !systemOn; b.setAttribute("aria-pressed", String(systemOn)); renderChat(); });
    controls.appendChild(b);
    const expand = document.createElement("button"); expand.id = "chat-expand"; expand.type = "button";
    expand.addEventListener("pointerdown", (e) => { e.preventDefault(); chatPinned = !chatOpen(); renderChat(); });
    controls.appendChild(expand);
    const latest = pbtn("Tin mới", "", readToEnd, "Về cuối lịch sử chat"); latest.id = "chat-new"; latest.hidden = true;
    latest.addEventListener("click", (e) => { if (e.detail === 0) readToEnd(); });
    controls.appendChild(latest);
    bar.parentElement?.insertBefore(controls, bar);
  }
  renderChat();
}
