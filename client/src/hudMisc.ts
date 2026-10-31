// Bạn bè, cộng minh, kênh, bản đồ thế giới / truyền tống, điểm đánh dấu, tự động và về thành của HUD (tách nguyên văn từ hud.ts, Part of #885 bước 0a); hud.ts re-export để nơi gọi giữ nguyên.
import { closeNpc } from "./hudNpc.ts";
import { toggleBag } from "./hudBag.ts";
import { toggleRoster } from "./hudRoster.ts";
import { MAPS, RESONANCE, RESONANCE_RANK_PAGE_SIZE, RESONANCE_RANK_CD, resonanceText } from "../../shared/data.ts";
import { toggleChar } from "./charPanel.ts";
import { chatLine, chatWhisperTo } from "./chat.ts";
import { el, pbtn } from "./domBtn.ts";
import type { ResonanceMsg, ResonanceTopMsg, ChannelsMsg, WorldMsg, AutoMsg, FriendsMsg } from "./net.ts";
import { autoTimeText, FRIEND_MAX, BLOCK_MAX } from "../../shared/data.ts";
import { stateBox } from "./uiParts.ts";
import { confirmDialog } from "./confirmDialog.ts";
import { worldMap } from "./worldmap.ts";
import "./ui2-social.css";
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

// ---------- Bạn bè và chặn (mục 5.9 "Bạn bè", #195): chỉ chính chủ nhận tin "friends" ----------
export let friendsLast: FriendsMsg | null = null;
export let friendSend: ((op: string, name?: string) => void) | null = null;
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
/** Việc không đảo ngược (xóa bạn, chặn): hỏi bằng hộp xác nhận nêu hậu quả (nút an toàn lấy tiêu điểm). */
export function askThen(title: string, body: string, confirmLabel: string, fn: () => void) {
  confirmDialog({ title, body, confirm: confirmLabel, danger: true }, fn);
}
// Bảng Bạn bè nhận khung Mực của kit (index.html giữ nguyên). Luật vẽ ở ui2-social.css.
document.getElementById("friends")?.classList.add("f2-muc-nho");
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
  if (!m) { box.append(stateBox({ kind: "loading", text: "Đang tải danh sách bạn bè…", rows: 3 })); return; }
  const rank = (e: FriendsMsg["list"][number]) => (e.mutual && e.map ? 0 : e.mutual ? 1 : 2);
  const sorted = [...m.list].sort((a, b) => rank(a) - rank(b)), onN = sorted.filter((e) => rank(e) === 0).length;
  if (sorted.length) box.append(el("div", "fsum", `${onN} trực tuyến · ${sorted.length - onN} ngoại tuyến hoặc chưa thêm lại`));
  for (const e of sorted) {
    const row = el("div", "pmem frow" + (e.mutual && e.map ? " on" : " off")), top = el("div", "ptop");
    // chấm trạng thái là hình (đặc = trực tuyến, rỗng = không) kèm chữ, không chỉ màu.
    top.append(el("span", "pname", e.name),
      el("small", "", e.mutual ? (e.map ? `Ở ${MAPS[e.map]?.name ?? e.map}${e.ch ? ` · Kênh ${e.ch}` : ""}` : "Ngoại tuyến") : "Chưa thêm lại bạn"));
    row.dataset.st = rank(e) === 0 ? "on" : rank(e) === 1 ? "off" : "pend";
    const btns = el("div", "pbtns");
    if (e.mutual && e.map) btns.append(pbtn("Mời tổ đội", "ok", () => friendAct?.invite(e.name), `Mời ${e.name} vào tổ đội`),
      pbtn("Nhắn", "", () => { toggleFriends(false); chatWhisperTo(e.name); }, `Nhắn riêng cho ${e.name} (/t)`));
    btns.append(pbtn("Xóa", "", () => askThen("Xóa bạn", `Xóa ${e.name} khỏi danh sách bạn bè? Người đó không còn thấy bạn đang ở đâu.`, "Xóa", () => friendSend?.("remove", e.name)), `Xóa ${e.name} khỏi danh sách bạn bè`),
      pbtn("Chặn", "warn", () => askThen("Chặn hồn sư", `Chặn ${e.name}? Không nhận tin, lời mời tổ đội, lời thêm bạn của người đó, tin của họ ở mọi kênh. Bỏ chặn được sau.`, "Chặn", () => friendSend?.("block", e.name)), `Chặn ${e.name}`));
    row.append(top, btns); box.append(row);
  }
  if (!m.list.length) {
    box.append(stateBox({ kind: "empty", text: "Chưa có bạn bè.", hint: "Gõ tên hồn sư rồi bấm Thêm bạn, hoặc bấm vào hồn sư khác ngoài bản đồ." }));
  }
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
let resTopWait: "idle" | "wait" | "err" = "idle"; // đang chờ bảng xếp hạng / quá hạn (chỉ để hiển thị trạng thái tải / lỗi)
let resTopWanted = { page: 1, size: RESONANCE_RANK_PAGE_SIZE }; // tách trang yêu cầu khỏi trang đã nhận
const RESO_TOP_WAIT_MS = 8000;
let resTopTimer = 0, resTopSentAt = 0; // một hẹn giờ duy nhất; server bỏ im yêu cầu trong RESONANCE_RANK_CD nên không gửi (không chuyển sang "wait") khi chưa qua nhịp
const askResTop = (page: number, size: number) => {
  const now = performance.now(); if (now - resTopSentAt < RESONANCE_RANK_CD * 1000) return;
  resTopWanted = { page, size };
  resTopSentAt = now; resTopRequest(page, size);
  clearTimeout(resTopTimer); resTopWait = "wait"; renderReso();
  resTopTimer = window.setTimeout(() => { resTopTimer = 0; if (resTopWait === "wait") { resTopWait = "err"; if (!$("#reso").hidden) renderReso(); } }, RESO_TOP_WAIT_MS);
};
/** Tin "resonance" mới: vẽ lại bảng nếu đang mở. */
export function setResonance(m: ResonanceMsg) { resMsg = m; if (!$("#reso").hidden) renderReso(); }
/** Tin "resonanceTop" mới: bảng công khai chỉ hiển thị tên / điểm và dòng riêng của mình. */
export function setResonanceTop(m: ResonanceTopMsg) { resTopMsg = m; resTopWait = "idle"; clearTimeout(resTopTimer); resTopTimer = 0; if (!$("#reso").hidden) renderReso(); }
export function onResonanceTop(fn: (page: number, pageSize: number) => void) { resTopRequest = fn; }
/** Mở / đóng bảng Cộng minh (phím K, nút trong khung chỉ số và trong bảng đội hình); cùng chỗ giữa màn hình với các bảng khác. */
export function toggleReso(open = $("#reso").hidden) {
  $("#reso").hidden = !open;
  if (open) { toggleRoster(false); toggleBag(false); closeNpc(); toggleWorld(false); toggleFriends(false); toggleChar(false); renderReso(); }
}
/**
 * Bảng Cộng minh: tổng % đang cộng cho mọi võ hồn, tab theo trụ cột (RESONANCE): tiến độ x/mốc kế tiếp kèm thanh, các mốc (đã đạt √,
 * mốc kế nổi bật, còn lại khoá) và phần cộng của từng mốc; bảng xếp hạng ở cuối.
 */
function renderReso() {
  const el = $("#reso"); el.innerHTML = "";
  el.classList.add("f2-muc-lon");
  const head = document.createElement("div"); head.className = "rhead";
  head.innerHTML = `<b>Cộng minh</b><button class="x" aria-label="Đóng">×</button>`;
  head.querySelector("button")!.addEventListener("click", () => toggleReso(false));
  const note = document.createElement("small"); note.className = "rnote";
  note.textContent = "Đạt mốc ở từng trụ cột thì mọi võ hồn (kể cả võ hồn mở sau) được cộng chỉ số. Nuôi đều các võ hồn để mở thêm mốc.";
  const txt = resMsg ? resonanceText(resMsg.bonus) : "";
  const total: HTMLElement = !resMsg ? stateBox({ kind: "loading", text: "Đang tải cộng minh…", rows: 2 }) : document.createElement("div");
  if (resMsg) { total.className = "restotal"; total.textContent = txt ? `Mọi võ hồn: ${txt}` : "Chưa đạt mốc nào."; }
  el.append(head, note, total);
  const rank = document.createElement("section"); rank.className = "resrank";
  const rankHead = document.createElement("div"); rankHead.className = "resrankhead";
  const rankTitle = document.createElement("b"); rankTitle.textContent = "Bảng xếp hạng cộng minh";
  const rankBtn = document.createElement("button"); rankBtn.type = "button"; rankBtn.textContent = resTopMsg ? "Làm mới" : "Xem bảng";
  rankBtn.addEventListener("click", () => askResTop(1, resTopMsg?.pageSize ?? RESONANCE_RANK_PAGE_SIZE));
  rankHead.append(rankTitle, rankBtn); rank.appendChild(rankHead);
  if (resTopWait === "wait") rank.appendChild(stateBox({ kind: "loading", text: `Đang tải bảng xếp hạng · Trang ${resTopWanted.page}…`, rows: 3 }));
  else if (resTopWait === "err") rank.appendChild(stateBox({ kind: "error", text: resTopMsg ? `Cập nhật thất bại · Chưa nhận được trang ${resTopWanted.page}.` : "Chưa nhận được bảng xếp hạng.", hint: "Kiểm tra kết nối rồi thử lại.", onRetry: () => askResTop(resTopWanted.page, resTopWanted.size) }));
  if (resTopMsg && resTopWait !== "idle") {
    const stale = document.createElement("small"); stale.textContent = `Dữ liệu cũ · Trang ${resTopMsg.page} chưa cập nhật.`; rank.appendChild(stale);
  }
  if (!resTopMsg && resTopWait === "idle") {
    const hint = document.createElement("small"); hint.textContent = "Chỉ tài khoản đã đạt ít nhất một mốc được xếp hạng."; rank.appendChild(hint);
  } else if (resTopMsg) {
    const mine = document.createElement("small");
    mine.textContent = resTopMsg.me ? `Hạng ${resTopMsg.me.rank} · ${resTopMsg.me.score} điểm · ${resTopMsg.me.milestones} mốc · tiến độ ${Math.floor(resTopMsg.me.progressBp / 100)}% · sao thêm ${resTopMsg.me.extraStars}` : "Chưa đạt mốc để xếp hạng.";
    rank.appendChild(mine);
    const table = document.createElement("div"); table.className = "resranktable";
    resTopMsg.list.forEach((r, i) => { const row = document.createElement("div"); row.className = "resrankrow" + (r.me ? " me" : "");
      const n = document.createElement("span"); n.textContent = `#${(resTopMsg!.page - 1) * resTopMsg!.pageSize + i + 1}`;
      const name = document.createElement("em"); name.textContent = r.name;
      const score = document.createElement("i"); score.textContent = `${r.score} điểm · ${r.milestones} mốc`;
      row.append(n, name, score); table.appendChild(row); });
    if (!resTopMsg.list.length) { table.appendChild(stateBox({ kind: "empty", text: "Chưa có tài khoản đạt mốc.", hint: "Đạt một mốc cộng minh để lên bảng." })); }
    rank.appendChild(table);
    const pages = document.createElement("div"); pages.className = "respages";
    const prev = document.createElement("button"); prev.type = "button"; prev.textContent = "‹ Trước"; prev.disabled = resTopMsg.page <= 1;
    prev.addEventListener("click", () => askResTop(resTopMsg!.page - 1, resTopMsg!.pageSize));
    const page = document.createElement("span"); page.textContent = `Trang ${resTopMsg.page}`;
    const next = document.createElement("button"); next.type = "button"; next.textContent = "Sau ›"; next.disabled = !resTopMsg.hasNext;
    next.addEventListener("click", () => askResTop(resTopMsg!.page + 1, resTopMsg!.pageSize));
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
  box.classList.add("f2-muc-nho");
  if (!chanMsg) { box.appendChild(stateBox({ kind: "loading", text: "Đang tải danh sách kênh…", rows: 3 })); return; } // chỉ khi chưa từng có danh sách
  if (!chanMsg.list.length) { box.appendChild(stateBox({ kind: "empty", text: "Chưa có kênh nào." })); return; }
  for (const c of chanMsg.list) {
    const cur = c.ch === chanNow, b = el("button", cur ? "cur" : "") as HTMLButtonElement;
    b.append(el("span", "", `Kênh ${c.ch}${cur ? " (đang ở)" : ""}`), el("span", "", `${c.n}/${c.max}${c.full ? " · Đầy" : ""}`));
    { const bar = el("i", "chbar"); bar.style.setProperty("--p", `${Math.min(100, Math.round((c.n / Math.max(1, c.max)) * 100))}%`); b.append(bar); b.dataset.st = cur ? "cur" : c.full ? "full" : "open"; }
    b.disabled = cur || c.full;
    b.title = cur ? "Bạn đang ở kênh này" : c.full ? "Kênh đã đầy" : `Chuyển sang kênh ${c.ch}`;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); if (!b.disabled) chanPick(c.ch); });
    box.appendChild(b);
  }
  box.appendChild(el("small", "", "Đổi kênh khi ngoài giao chiến."));
}

// ---------- Truyền tống trận và bản đồ thế giới (mục 5.3 "Truyền tống trận", bước 11.2) ----------
// Bản đồ thế giới là chế độ "Thế giới" của bản đồ lớn (phím M, client/src/mapview.ts + worldmap.ts); các hàm dưới đây giữ tên cũ để nơi gọi không đổi.
/** Gắn hàm gửi ý định truyền tống (`wp {op: "go", key}`); GameScene gọi mỗi lần vào phòng. */
export function onWorldGo(fn: (key: string) => void) { worldMap().hooks.go = fn; }
/** Nút "Tự đi tới" của bản đồ thế giới (R4): đi bộ qua các cổng thật tới bản đồ đó, không tốn Hồn Tệ. */
export function onWorldAuto(fn: (map: string) => void) { worldMap().hooks.auto = fn; }
/** Gắn hàm xin server tin `world` mới (mỗi lần chế độ Thế giới hiện ra); GameScene gọi mỗi lần vào phòng. */
export function onWorldShow(fn: () => void) { worldMap().onShow = fn; }
export const worldOpen = () => worldMap().host?.isOpen() ?? false;
/** Mở / đóng bản đồ thế giới (phím M, nút Bản đồ, F khi đứng trên trận). Mở thì đóng các bảng cùng chỗ; không mở được (chưa dựng khung) trả false. */
export function toggleWorld(open = !worldOpen()) {
  if (open) { toggleRoster(false); toggleBag(false); toggleReso(false); closeNpc(); toggleFriends(false); toggleChar(false); }
  return worldMap().host?.show(open) ?? false;
}
/** Dòng `log` của server: nếu vừa bấm Dịch chuyển thì đó là lý do bị từ chối, bản đồ thế giới hiện ở thẻ chi tiết. */
export function worldNote(text: string) { worldMap().note(text); }
/** Đứng lên / rời truyền tống trận (tin `wp {k: "here"}`): bản đồ thế giới đang mở thì làm tươi. */
export function worldHere() { worldMap().hereChanged(); }
/** Tin `world` mới (server gửi khi xin): bản đồ thế giới vẽ lại. */
export function setWorld(m: WorldMsg) { worldMap().setMsg(m); }

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
  const b = $("#autoChip"); if (!b) return;
  b.hidden = !m.on; // chip chỉ hiện khi đang tự săn; bấm mở bảng Tự động
  $("#autoChipTxt").textContent = `Tự động · còn ${autoTimeText(m.left)}`; // quỹ giờ treo còn lại (gồm Ủy Thác Lệnh nếu có)
  b.title = `${m.on ? "Đang tự săn: tự đi / đánh hoặc phím T để tắt" : "Bảng Tự động: cài đặt và bật tự săn quanh chỗ đang đứng (phím T bật / tắt ngay)"}. Còn ${autoTimeText(m.left)} treo${m.bonus > 0 ? ` (gồm ${autoTimeText(m.bonus)} từ Ủy Thác Lệnh)` : ""} (mỗi ngày ${autoTimeText(m.max)} miễn phí).`;
}
export function setRecall(r: { label: string; secs: number } | null) { recall = r ? { ...r, t0: performance.now() } : null; if (r) worldMap().recallStarted(); }
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
