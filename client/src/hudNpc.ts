// Hộp thoại NPC (nói chuyện, trang thương nhân / lò rèn / nhiệm vụ / tông), đổi ngoại hình của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 0a); hud.ts re-export để nơi gọi giữ nguyên.
import { renderQuestOverview, questTracked, dailyMsg } from "./hudQuest.ts";
import { arenaLiveAsk, arenaLiveAt, arenaLiveEl, arenaQ, arenaRankEl, arenaTopMsg, dailyMark, questOf, renderDailyPage, renderForge, renderForgeCores, renderForgeGear, renderForgeLuck, renderForgeSalv, renderForgeSets, renderForgeSynth, renderQuestPage, renderShardShop, renderShopBuy, renderShopBuyback, renderShopSell, renderTongRank, renderTongTasks, toggleFriends, toggleReso, forgeReset } from "./hud.ts";
import { honTeHtml, toggleBag, setBagCap } from "./hudBag.ts";
import { enhClose, setEnhCoin, toggleRoster } from "./hudRoster.ts";
import { NPCS, shopExpands, formatHonTe, SHARD_BUY, LOOKS_CHANGE, looksChangeCost, type Looks, type NpcDef, type NpcRole, questChain, DAILY, ARENA } from "../../shared/data.ts";
import { artImg } from "./uiArt.ts";
import { isUi2 } from "./uiKit.ts";
import { tabs } from "./uiParts.ts";
import { toggleChar } from "./charPanel.ts";
import { openLooksOverlay } from "./looksMaker.ts";
import type { GearMsg } from "./net.ts";
import type { BagMsg } from "./net.ts";
import { TONG_MON, TONG_MIN_LEVEL, TONG_SWITCH_DAYS, TONG_DAILY, type QuestProgress, type QuestStatus, type TongRank } from "../../shared/data.ts";
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;



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
  coreSet(id: string, set: string): void; // Thợ rèn: đổi bộ hồn hạch (#283)
  quest(op: "accept" | "turnin", chain?: string): void; // nhận / trả nhiệm vụ (6.2; `chain` = bài khảo hạch hằng ngày)
  arena(op: "queue" | "cancel" | "top" | "live" | "watch", roomId?: string): void; // Đại Đấu Hồn Trường (7.2): xếp hàng, hủy, xin bảng xếp hạng; xem trận (#280): danh sách, vào xem
  // Tông môn (#196): gia nhập / đổi sang `tong`, rời tông; #197: nhận / trả tông vụ `chain`, xin bảng tông tuần, nhận thưởng tuần.
  tong(op: "join" | "leave" | "accept" | "turnin" | "board" | "claim", tong?: string, chain?: string): void;
  shard(vohon: string, qty: number): void; shardInfo(): void; // Thương hội đổi mảnh võ hồn (#282): đổi, xin số đã đổi hôm nay
  gear(): GearMsg | null; equipEnh(id: string, charm: boolean): void; equipEnhPreview(id: string): void; // Thợ rèn: cường hóa trang bị hồn sư (E3)
  equipLuck(id: string): void; equipLuckPreview(id: string): void; // Thợ rèn: khắc may mắn bằng Thần Hồn
  equipSynth(main: string, sacrifice: string[]): void; equipSalvage(ids: string[]): void; // Thợ rèn: hợp thành 3 → 1, phân giải hàng loạt (E4)
  owned(): string[]; // mã các võ hồn đã sở hữu (trang đổi mảnh ghi "chưa có")
  looks(): Looks | null; changeLooks(looks: Looks): void; // Thợ may (L4 #511): ngoại hình đang mang, gửi lựa chọn mới (server kiểm khoảng cách, tiền)
}
export type NpcPage = "talk" | "buy" | "sell" | "buyback" | "forge" | "forgecore" | "forgeset" | "forgegear" | "forgeluck" | "forgesynth" | "forgesalv" | "quest" | "daily" | "rank" | "shard" | "tongtask" | "tongrank" | "live";
/** Đích nút "Đến" (UI v2 đợt 3a): bản đồ và NPC (nếu có); GameScene gắn một lần, đi bằng cờ "Đi tới" có sẵn. */
export interface NpcGoal { map: string; mapName: string; npc?: string }
let goTo: (g: NpcGoal) => void = () => {};
export const bindNpcGo = (fn: (g: NpcGoal) => void) => { goTo = fn; };
/** Bấm "Đến": đóng hộp thoại (khỏi che màn chơi) rồi tự đi tới đích. */
export function npcGoTo(g: NpcGoal) { closeNpc(); goTo(g); }
const UI2 = isUi2();
export let npcDefOpen: NpcDef | null = null;  // NPC đang mở hộp thoại
export let npcPage: NpcPage = "talk";
let npcLine = 0;                       // câu thoại đang hiện
let npcBagMsg: BagMsg | null = null;   // tin "bag" gần nhất (Hồn Tệ, đồ bán được, hồn cốt cho lò rèn)
let npcAct: NpcActions | null = null;
export let sellConfirm: string | null = null; // "id|số lượng" vừa bấm "Bán" lần đầu với món giá trị (từ 9.8 cả "expand" mở rộng túi): bấm lần nữa mới làm
export const setSellConfirm = (v: string | null) => { sellConfirm = v; };
/** Bán từ ngần này đồng trở lên (hoặc đồ đã cường hóa) thì phải bấm hai lần (chỉ là xác nhận giao diện, không phải số cân bằng). */
export const SELL_CONFIRM_DONG = 100;
const NPC_ROLE_NOTE: Record<NpcRole, string> = { talk: "", shop: "Thương nhân: mua đan dược, bán đồ dư.", forge: "Lò rèn: cường hóa hồn cốt, nâng cấp / đổi bộ hồn hạch, rèn trang bị (cường hóa, hợp thành, phân giải, khắc may mắn).",
  arena: "Đấu đội võ hồn 1v1, xếp hạng Elo. Thua không mất gì.",
  looks: `Thợ may: đổi ngoại hình, kể cả đổi giữa Mẫu dựng sẵn và Tự tạo. ${LOOKS_CHANGE.free === 1 ? "Lần đầu" : `${LOOKS_CHANGE.free} lần đầu`} miễn phí, các lần sau tốn Hồn Tệ.`,
  tong: `Gia nhập cần xong chuỗi tân thủ và võ hồn cấp ${TONG_MIN_LEVEL}; đổi tông sau ${TONG_SWITCH_DAYS} ngày, mất điểm tuần đang có. Tông không cộng chỉ số.` };
/** Tin "tong": tông đang thuộc ("" = không), giây còn chờ đổi tông; từ #197 tông vụ hôm nay (tiến độ do server giữ). */
export interface TongMsg { tong: string; wait: number; day?: string; tasks?: (QuestProgress & { status: QuestStatus })[]; }
/** Tin "tongBoard" (#197): bảng tông tuần này (`cur`, điểm của mình `me`) và tuần trước (`last`: tông hạng nhất, phần thưởng của mình). */
export interface TongBoardMsg {
  week: number; min: number; me: number; cur: { tongs: TongRank[]; top: Record<string, { name: string; points: number }[]> };
  last: { week: number; board: { tongs: TongRank[] }; first: string[]; tong: string; points: number; reward: "top" | "rest" | null; claimed: boolean };
}
export let tongMsg: TongMsg | null = null; // tin "tong" gần nhất
export let tongBoardMsg: TongBoardMsg | null = null; // tin "tongBoard" gần nhất
export let shardMsg: { n: number; daily: number } | null = null; // tin "shardinfo" gần nhất (#282): số mảnh đã đổi hôm nay ở Thương hội
/** Tin "shardinfo" (#282): vẽ lại hộp thoại Chưởng quỹ nếu đang mở. */
export function setShardInfo(m: { n: number; daily: number }) { shardMsg = m; if (npcDefOpen?.id === SHARD_BUY.npc) renderNpc(); }
let looksMsg: { n: number; err?: string } | null = null; // tin "looksinfo" gần nhất (L4 #511): số lần đã đổi ngoại hình
let looksWait: ((m: { n: number; err?: string }) => void) | null = null; // đang chờ server trả lời lần đổi vừa gửi
/** Tin "looksinfo" (L4 #511): số lần đã đổi, hoặc lý do từ chối; vẽ lại hộp thoại thợ may nếu đang mở. */
export function setLooksInfo(m: { n: number; err?: string }) { looksMsg = m; looksWait?.(m); if (npcDefOpen?.role === "looks") renderNpc(); }
/** Mở màn đổi ngoại hình của thợ may đang mở hộp thoại; xong (server xác nhận) thì đóng màn và hộp thoại. */
function openLooksChange(def: NpcDef, act: NpcActions) {
  const n0 = looksMsg?.n ?? 0, cost = looksChangeCost(n0), have = npcBagMsg?.honTe ?? 0;
  closeNpc(); // màn đổi ngoại hình phủ lên game; xong thì nói chuyện lại với thợ may nếu muốn đổi tiếp
  closeLooks();
  looksClose = openLooksOverlay({
    title: "Đổi ngoại hình", current: act.looks(),
    intro: cost ? `Lần đổi này tốn <b>${formatHonTe(cost)}</b> Hồn Tệ (bạn có ${formatHonTe(have)}). Có thể đổi giữa Mẫu dựng sẵn và Tự tạo.`
      : `Lần đổi này <b>miễn phí</b>; các lần sau tốn ${formatHonTe(LOOKS_CHANGE.cost)} Hồn Tệ mỗi lần. Có thể đổi giữa Mẫu dựng sẵn và Tự tạo.`,
    okLabel: cost ? `Đổi ngoại hình (−${formatHonTe(cost)})` : "Đổi ngoại hình (miễn phí)",
    onOk: (looks) => new Promise<void>((ok, no) => {
      const t = setTimeout(() => { looksWait = null; no(new Error("Máy chủ không trả lời, thử lại sau.")); }, 10000);
      looksWait = (m) => {
        if (m.err) { clearTimeout(t); looksWait = null; no(new Error(m.err)); }
        else if (m.n > n0) { clearTimeout(t); looksWait = null; ok(); }
      };
      act.changeLooks(looks);
    }),
    onClose: () => { looksWait = null; looksClose = null; },
  });
}
let looksClose: (() => void) | null = null; // đóng màn đổi ngoại hình đang mở
/** Màn đổi ngoại hình (thợ may) đang mở: phím tắt game phải tắt trong lúc đó. */
export const looksOpen = () => looksClose !== null;
/** Đóng màn đổi ngoại hình nếu đang mở (Esc, đi cổng / đổi kênh / vào sân đấu, mất kết nối): dừng xem trước, trả #card về như cũ. */
export function closeLooks() { looksClose?.(); looksClose = null; }
/** Tin "tong" (#196): vẽ lại hộp thoại sứ giả nếu đang mở. */
export function setTong(m: TongMsg) { tongMsg = m; if (npcDefOpen?.role === "tong") renderNpc(); }
/** Tin "tongBoard" (#197): vẽ lại hộp thoại sứ giả nếu đang mở. */
export function setTongBoard(m: TongBoardMsg) { tongBoardMsg = m; if (npcDefOpen?.role === "tong") renderNpc(); }

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
  toggleBag(false); toggleRoster(false); toggleReso(false); toggleFriends(false); toggleChar(false);
  $("#npc").hidden = false;
  renderNpc();
}
export function closeNpc() {
  if (!npcDefOpen) return;
  npcDefOpen = null; npcAct = null; sellConfirm = null; enhClose();
  const el = $("#npc"); el.hidden = true; el.innerHTML = "";
  delete el.dataset.c16Page;
}
/** Túi đổi (mua, bán, cường hóa): vẽ lại hộp thoại đang mở với Hồn Tệ và đồ mới. */
export function npcBag(bag: BagMsg) { npcBagMsg = bag; setBagCap(bag.slots); setEnhCoin(bag.honTe); if (npcDefOpen) renderNpc(); }

/**
 * Thanh tab trang nhiệm vụ (UI v2 đợt 3a): Đang làm / Hằng ngày / Tông, đọc từ tin có sẵn (không phụ thuộc NPC đang mở: nhận / trả chỉ bấm được
 * ở đúng NPC, chỗ khác nút khoá kèm lý do và có nút Đến). Chấm "mới" khi có bài mới / chờ trả. Dưới 2 tab thì không vẽ thanh.
 */
function questTabs(go: (p: NpcPage) => void): HTMLElement | null {
  const tl = tongMsg?.tasks ?? [], dm = dailyMark(), qs = questTracked();
  const list: { id: NpcPage; label: string; dot: boolean }[] = [];
  if (qs.length || (npcDefOpen && questOf(npcDefOpen.id))) list.push({ id: "quest", label: "Đang làm", dot: qs.some((x) => x.status === "offer" || x.status === "ready") });
  if (dailyMsg) list.push({ id: "daily", label: "Hằng ngày", dot: dm === "offer" || dm === "ready" });
  if (tl.length) list.push({ id: "tongtask", label: "Tông", dot: tl.some((x) => x.status === "offer" || x.status === "ready") });
  if (list.length < 2) return null;
  return tabs({ label: "Loại nhiệm vụ", tabs: list.map((t) => ({ id: t.id, label: t.label, dot: t.dot, active: t.id === npcPage })), onSelect: (id) => go(id as NpcPage) }).root;
}

export function renderNpc() {
  const def = npcDefOpen, act = npcAct, el = $("#npc"); if (!def || !act) return;
  if (npcPage === "forge" || npcPage === "forgecore" || npcPage === "forgesynth") el.dataset.c16Page = npcPage;
  else delete el.dataset.c16Page;
  el.innerHTML = "";
  if (UI2) el.classList.add("f2-giay-lon", "n2");
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
    if (UI2) b.classList.add(cls.includes("absorb") && npcPage !== "talk" ? "f2-nut-chinh" : "f2-nut-phu");
    b.addEventListener("click", () => { b.blur(); fn(); }); row.appendChild(b); return b;
  };
  const go = (page: NpcPage) => { npcPage = page; sellConfirm = null; enhClose(); renderNpc(); };
  const qt = UI2 && (npcPage === "quest" || npcPage === "daily" || npcPage === "tongtask") ? questTabs(go) : null; if (qt) el.appendChild(qt);
  if (UI2 && npcPage === "talk") row.classList.add("n2-choices");
  const bag = npcBagMsg;
  if (npcPage === "tongtask" || npcPage === "tongrank") { // #197: tông vụ hôm nay, bảng tông tuần
    if (npcPage === "tongtask") renderTongTasks(el, act); else renderTongRank(el, act);
    btn(`‹ Lời ${def.name}`, "drop", () => go("talk"));
    el.appendChild(row);
    return;
  }
  if (npcPage === "quest" || npcPage === "daily") {
    if (npcPage === "daily") renderDailyPage(el, act); else if (UI2 && !questOf(def.id)) renderQuestOverview(el); else renderQuestPage(el, act);
    btn(`‹ Lời ${def.name}`, "drop", () => go("talk"));
    el.appendChild(row);
    return;
  }
  if (npcPage === "live") { // #280: danh sách trận đang diễn ra
    el.appendChild(arenaLiveEl(act));
    const rf = btn("Làm mới", "use", () => { arenaLiveAsk(act); renderNpc(); }, performance.now() - arenaLiveAt < ARENA.topCd * 1000);
    if (rf.disabled) setTimeout(() => { if (npcDefOpen && npcPage === "live") renderNpc(); }, ARENA.topCd * 1000);
    btn("‹ Quay lại", "drop", () => go("talk"));
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
    if (UI2 && !questOf(def.id) && def.id !== DAILY.giver && (questTracked().length || tongMsg?.tasks?.length)) btn("Sổ nhiệm vụ", "absorb", () => go("quest")); // đọc tiến độ + nút Đến từ bất kỳ NPC
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
      btn("Đổi bộ hồn hạch", "absorb", () => go("forgeset"), !bag); // #283
      btn("Cường hóa trang bị hồn sư", "absorb", () => { forgeReset.gear(); go("forgegear"); }, !bag); // E3
      btn("Khắc may mắn", "absorb", () => { forgeReset.luck(); go("forgeluck"); }, !bag);
      btn("Hợp thành trang bị (3 → 1)", "absorb", () => { forgeReset.synth(); go("forgesynth"); }, !bag); // E4
      btn("Phân giải trang bị", "absorb", () => { forgeReset.salv(); go("forgesalv"); }, !bag); // E4
    }
    if (def.role === "looks") { // L4 #511: giá lần đổi kế tiếp tính từ số lần đã đổi (server gửi `looksinfo` khi mở hộp thoại)
      const cost = looksChangeCost(looksMsg?.n ?? 0), poor = !!bag && bag.honTe < cost;
      btn(cost ? `Đổi ngoại hình (${formatHonTe(cost)})` : "Đổi ngoại hình (miễn phí)", "absorb", () => openLooksChange(def, act), !looksMsg || poor);
      if (poor) { const k = document.createElement("small"); k.className = "rnote"; k.textContent = `Không đủ Hồn Tệ: cần ${formatHonTe(cost)}.`; el.appendChild(k); }
    }
    if (def.role === "arena") { // 7.2: server kiểm tra lại khoảng cách và trạng thái khi xếp hàng
      btn(arenaQ ? "Hủy xếp hàng" : "Xếp hàng đấu hồn", arenaQ ? "drop" : "absorb", () => act.arena(arenaQ ? "cancel" : "queue"));
      btn("Bảng xếp hạng", "absorb", () => { act.arena("top"); go("rank"); });
      btn("Trận đang diễn ra", "absorb", () => { arenaLiveAsk(act); go("live"); });
    }
    if (def.role === "tong") {
      const t = TONG_MON.find((x) => x.npc === def.id), cur = TONG_MON.find((x) => x.id === tongMsg?.tong);
      if (t && t.id === cur?.id) btn(`Đã là người của ${t.name}`, "absorb", () => {}, true);
      else if (t) btn(cur ? `Đổi sang ${t.name}` : `Gia nhập ${t.name}`, "absorb", () => act.tong("join", t.id));
      if (t && t.id === cur?.id) { // #197: tông vụ chỉ ở sứ giả tông mình
        const l = tongMsg?.tasks ?? [], done = l.filter((x) => x.status === "done").length;
        const mark = l.some((x) => x.status === "ready") ? " ?" : l.some((x) => x.status === "offer") ? " !" : "";
        btn(`Tông vụ hôm nay (${done}/${l.length || TONG_DAILY.count})${mark}`, "absorb", () => go("tongtask"));
      }
      if (cur) btn("Bảng tông tuần, thưởng tuần", "absorb", () => { act.tong("board"); go("tongrank"); });
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
  else if (npcPage === "forgeset") renderForgeSets(el, bag, act);
  else if (npcPage === "forgegear") renderForgeGear(el, bag, act);
  else if (npcPage === "forgeluck") renderForgeLuck(el, bag, act);
  else if (npcPage === "forgesynth") renderForgeSynth(el, bag, act);
  else if (npcPage === "forgesalv") renderForgeSalv(el, bag, act);
  else { const box = npcPage === "forgecore" ? renderForgeCores(bag, act) : renderForge(bag, act); el.appendChild(box); if (box.classList.contains("epick")) return; }
  btn("‹ Quay lại", "drop", () => go("talk"));
  el.appendChild(row);
}
