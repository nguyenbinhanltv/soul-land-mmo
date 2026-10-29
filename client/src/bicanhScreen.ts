// Bí Cảnh, màn client của Luyện Hồn Cảnh solo (docs/design/bi-canh.md "Giao diện", bước P5, Part of #877). Chỉ hiển thị tin riêng `bicanh` của server và gửi ý định
// `bicanh {op:"get"|"enter"|"buy", id, pay?}`: client không gửi giờ / số lượt / giá; lượt còn lại, giá lượt mua, ngày làm mới (05:00), thưởng đều do server tính, ở đây chỉ vẽ.
// Ba phần: (1) màn danh sách phụ bản (mở từ hub), (2) HUD trong phòng (tin k = ready / fight / wave / clear), (3) bảng kết quả (k = end).
import { BICANH, bicanhRunTomes, formatHonTe, itemDef, type BicanhScene } from "../../shared/data.ts";
import { countdown, screenFrame, mount, addCloseButton, stateBox, formatCountdown, type PNode } from "./uiParts.ts";
import { confirmDialog } from "./confirmDialog.ts";
import { artImg } from "./uiArt.ts";

/** Một dòng phụ bản của tin `bicanh {runs}` (khớp `RunView` ở server/src/rooms/bicanh.ts). */
export interface BiCanhRun { id: string; name: string; left: number; max: number; bought: number; price: number | null }
export interface BiCanhMsg { runs: BiCanhRun[]; resetIn: number; err?: string }
/** Tin vòng phòng `bicanh {k}` (khuôn tin `arena`): ready / fight / wave / clear / end (found do GameScene xử lý, kèm roomId). */
export interface BiCanhRoomMsg {
  k: "found" | "ready" | "fight" | "wave" | "clear" | "end";
  roomId?: string; id?: string; name?: string; waves?: number; secs?: number; wave?: number; of?: number; n?: number; elite?: boolean; tomes?: number;
  win?: boolean; reason?: string; why?: string; cleared?: number; capped?: boolean; full?: boolean; err?: string; refunded?: boolean;
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const resetClock = `${pad2(BICANH.resetHour)}:00`;
export const sceneOf = (id: string): BicanhScene | undefined => BICANH.scenes.find((s) => s.id === id);

/** Còn lượt (chấm đỏ ở hub): có ít nhất một phụ bản `left` > 0. Hàm thuần. */
export const hasRun = (m: Pick<BiCanhMsg, "runs"> | null) => !!m && m.runs.some((r) => r.left > 0);

/** Trạng thái phụ bản bằng chữ (không chỉ màu): Còn N lượt / Đã xong hôm nay. */
export const runStatus = (r: BiCanhRun) => r.left > 0 ? `Còn ${r.left} lượt` : "Đã xong hôm nay";

/** Dòng thưởng của poster: quyển tối đa một lượt và trần quyển mỗi ngày (số từ BICANH, không chép vào client). */
export function rewardLine(s: BicanhScene): string {
  return `${itemDef(BICANH.tome)?.name ?? BICANH.tome} tối đa ×${bicanhRunTomes(s)} mỗi lượt, nhận tối đa ${BICANH.tomeDailyCap} mỗi ngày`;
}
/** Mỗi sóng một dòng "Sóng 1: 4 hồn thú · +1 quyển · tinh anh" (từ `waves`, không chép số). */
export function waveLines(s: BicanhScene): string[] {
  return s.waves.map((w, i) => `Sóng ${i + 1}: ${w.n} hồn thú${w.elite ? " + 1 tinh anh" : ""}${w.tomes ? ` · +${w.tomes} quyển` : ""}`);
}

/** Nút chính "Khiêu Chiến": khoá kèm lý do (nguyên tắc nút khoá luôn nói vì sao). */
export function primaryOf(r: BiCanhRun | null, busy: boolean): { label: string; disabled: boolean; reason?: string } {
  const label = "Khiêu Chiến";
  if (!r) return { label, disabled: true, reason: "Đang tải…" };
  if (busy) return { label, disabled: true, reason: "Đang gửi…" };
  if (r.left <= 0) return { label, disabled: true, reason: `Hết lượt hôm nay: mua thêm hoặc chờ ${resetClock}` };
  return { label, disabled: false };
}
/** Nút "+" mua thêm lượt: nhãn ghi giá (server tính), khoá khi hết lượt mua hoặc đang gửi. */
export function buyOf(r: BiCanhRun | null, busy: boolean): { label: string; disabled: boolean; reason?: string } {
  if (!r) return { label: "+ Mua lượt", disabled: true, reason: "Đang tải…" };
  if (r.price === null) return { label: "+ Mua lượt", disabled: true, reason: `Đã mua đủ ${r.bought}/${r.bought} lượt hôm nay` };
  if (busy) return { label: `+ Mua lượt (${formatHonTe(r.price)})`, disabled: true, reason: "Đang gửi…" };
  return { label: `+ Mua lượt (${formatHonTe(r.price)})`, disabled: false };
}
/** Hộp xác nhận mua lượt: ghi giá, số lượt mua đã dùng và việc mua là chi Hồn Tệ không hoàn lại. */
export function buyConfirm(r: BiCanhRun, buyMax: number) {
  return { title: `Mua thêm lượt ${r.name}`, body: `Tốn ${formatHonTe(r.price ?? 0)} cho 1 lượt (đã mua ${r.bought}/${buyMax} hôm nay). Hồn Tệ đã trả không hoàn lại.`, confirm: "Mua lượt" };
}

// ---- HUD trong phòng (thuần: văn bản theo tin) ----
export interface RoomHud { phase: "none" | "ready" | "fight"; name: string; wave: number; of: number; left: number; elite: boolean; eliteHp: number | null; tomes: number; endAt: number }
export const newRoomHud = (): RoomHud => ({ phase: "none", name: "", wave: 0, of: 0, left: 0, elite: false, eliteHp: null, tomes: 0, endAt: 0 });
/** Gộp một tin vòng phòng vào HUD; `now` là đồng hồ máy khách (ms), đếm lùi từ `secs` của tin. Hàm thuần (trả bản mới). */
export function applyRoomMsg(h: RoomHud, m: BiCanhRoomMsg, now: number): RoomHud {
  const secs = typeof m.secs === "number" ? m.secs : 0;
  switch (m.k) {
    case "ready": return { ...newRoomHud(), phase: "ready", name: m.name ?? "", of: m.waves ?? 0, endAt: now + secs * 1000 };
    case "fight": return { ...h, phase: "fight", of: m.waves ?? h.of, endAt: now + secs * 1000 };
    case "wave": return { ...h, phase: "fight", wave: m.wave ?? h.wave, of: m.of ?? h.of, left: m.n ?? 0, elite: !!m.elite, eliteHp: null };
    case "clear": return { ...h, wave: m.wave ?? h.wave, of: m.of ?? h.of, left: 0, tomes: m.tomes ?? h.tomes, elite: false, eliteHp: null };
    default: return h;
  }
}
/** Dòng chữ chính của HUD theo pha. */
export function hudTitle(h: RoomHud): string {
  if (h.phase === "ready") return `${h.name || "Bí Cảnh"} · chuẩn bị`;
  if (h.phase === "fight") return h.wave > 0 ? `Sóng ${h.wave}/${h.of}` : `${h.of} sóng`;
  return "";
}
/** Dòng phụ: hồn thú còn lại, tinh anh, quyển tạm. */
export function hudSub(h: RoomHud): string {
  if (h.phase !== "fight") return "";
  const bits = [h.left > 0 ? `Còn ${h.left} hồn thú` : h.wave > 0 ? "Sóng đã hạ, nghỉ giữa sóng" : ""];
  if (h.elite) bits.push(h.eliteHp === null ? "Có tinh anh" : `Tinh anh ${h.eliteHp}%`);
  bits.push(`Quyển tạm: ${h.tomes}`);
  return bits.filter(Boolean).join(" · ");
}

// ---- bảng kết quả (thuần) ----
export interface EndView { win: boolean; title: string; lines: { text: string; cls: string }[] }
/** Bảng kết quả từ tin `end`: thắng / thua + lý do, số sóng đã hạ, thưởng quyển (trần ngày / túi đầy), hoàn lượt khi lỗi hệ thống. */
export function endView(m: BiCanhRoomMsg): EndView {
  const win = !!m.win, tomes = m.tomes ?? 0, name = itemDef(BICANH.tome)?.name ?? BICANH.tome, lines: EndView["lines"] = [];
  if (m.err && !(m.refunded && /hoàn/.test(m.err))) lines.push({ text: m.err, cls: "bc-bad" }); // tin lỗi đã nói hoàn lượt thì không in hai lần
  else lines.push({ text: m.why ? `Kết thúc: ${m.why}.` : "Kết thúc.", cls: "" });
  lines.push({ text: `Đã hạ ${m.cleared ?? 0}/${m.of ?? 0} sóng.`, cls: "" });
  if (m.refunded) lines.push({ text: "Lỗi hệ thống: lượt đã được hoàn lại, quyển chưa nhận.", cls: "bc-bad" });
  else if (tomes > 0) lines.push({ text: `Nhận ${name} ×${tomes} vào túi.`, cls: "bc-rew" });
  else lines.push({ text: m.capped ? `Hôm nay đã nhận đủ ${BICANH.tomeDailyCap} ${name}: lượt này không có quyển.` : m.full ? `Túi đầy: chưa nhận được ${name}.` : `Chưa hạ sóng có quyển nên không nhận ${name}.`, cls: "" });
  if (tomes > 0 && m.capped) lines.push({ text: `Chạm trần ${BICANH.tomeDailyCap} quyển mỗi ngày: phần dư không nhận.`, cls: "" });
  if (tomes > 0 && m.full) lines.push({ text: "Túi đầy: chưa nhận hết quyển.", cls: "bc-bad" });
  if (!m.err && !win) lines.push({ text: "Thua không mất đồ; lượt đã dùng không hoàn.", cls: "" });
  return { win, title: m.err ? "Chưa lưu được kết quả" : win ? "Thắng!" : "Thua", lines };
}

// ---- phần DOM: màn danh sách ----
let send: ((type: string, payload: unknown) => void) | null = null;
let onChange: (has: boolean) => void = () => {};
let msg: BiCanhMsg | null = null, selId = "", busy = false, note: { text: string; err: boolean } | null = null, timer = 0, stops: (() => void)[] = [], recvAt = 0, failed = false;
const el = () => document.getElementById("bicanh");
const BUSY_MS = 6000, LOAD_MS = 8000;

export function bindBiCanh(sender: (type: string, payload: unknown) => void, changed: (has: boolean) => void) { send = sender; onChange = changed; }
export const isBiCanhOpen = () => { const e = el(); return !!e && !e.hidden; };
export function openBiCanh() {
  const e = el(); if (!e || !send) return;
  e.hidden = false; failed = false; note = null; send("bicanh", { op: "get" }); render();
  window.clearTimeout(timer); timer = window.setTimeout(() => { if (!msg) { failed = true; render(); } }, LOAD_MS);
}
export function closeBiCanh() { const e = el(); if (e) e.hidden = true; for (const s of stops) s(); stops = []; window.clearTimeout(timer); }

/** Tin `bicanh {runs, resetIn, err?}`. */
export function onBiCanh(m: BiCanhMsg) {
  if (!m || !Array.isArray(m.runs) || typeof m.resetIn !== "number") return;
  msg = m; recvAt = Date.now(); busy = false; failed = false; window.clearTimeout(timer);
  if (!sceneOf(selId)) selId = m.runs[0]?.id ?? "";
  note = m.err ? { text: m.err, err: true } : note?.err ? null : note;
  onChange(hasRun(m)); render();
}

const cur = () => msg?.runs.find((r) => r.id === selId) ?? null;
function act(op: "enter" | "buy", pay?: boolean) {
  if (!send || busy || !selId) return;
  busy = true; note = null;
  send("bicanh", { op, id: selId, ...(pay ? { pay: true } : {}) });
  window.clearTimeout(timer); timer = window.setTimeout(() => { if (busy) { busy = false; note = { text: "Máy chủ chưa trả lời: thử lại sau.", err: true }; render(); } }, BUSY_MS);
  render();
}
/** Bấm "+": mở hộp xác nhận ghi giá, xác nhận mới gửi `pay: true` (server vẫn kiểm giá, trần, Hồn Tệ). */
function askBuy() {
  const r = cur(); if (!r || r.price === null || busy) return;
  confirmDialog(buyConfirm(r, sceneOf(r.id)?.buyMax ?? r.bought), () => act("buy", true));
}

const h = (tag: string, cls: string, o: { text?: string; attrs?: Record<string, string>; kids?: (PNode | null)[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids.filter((k): k is PNode => !!k) } : {}) });

function render() {
  const root = el(); if (!root || root.hidden) return;
  for (const s of stops) s(); stops = [];
  const r = cur(), pr = primaryOf(r, busy);
  const f = screenFrame({
    material: "muc", title: "Bí Cảnh", badge: "境", info: `Phụ bản nâng cấp võ hồn, chơi có lượt theo ngày. Lượt làm mới lúc ${resetClock} giờ Việt Nam (không phải 00:00) do máy chủ tính.`,
    nav: msg ? msg.runs.map((x) => ({ id: x.id, label: x.name, active: x.id === selId, dot: x.left > 0 })) : [], primary: pr, onPrimary: () => act("enter"),
    onNav: (id) => { selId = id; note = null; render(); },
  });
  if (!f) return;
  const body: PNode[] = [];
  if (!msg) body.push(failed ? h("div", "bc-state", { attrs: { "data-k": "error" } }) : h("div", "bc-state", { attrs: { "data-k": "loading" } }));
  else if (!r) body.push(h("div", "bc-state", { attrs: { "data-k": "empty" } }));
  else {
    const s = sceneOf(r.id), b = buyOf(r, busy);
    body.push(h("div", "bc-poster", { kids: [
      h("div", "bc-art", { attrs: { "data-art": `bicanh_${r.id}`, "aria-hidden": "true" } }),
      h("div", "bc-info", { kids: [
        h("div", "bc-name", { text: r.name }),
        s ? h("div", "bc-rew", { text: `Thưởng: ${rewardLine(s)}` }) : null,
        h("div", "bc-foot", { kids: [
      h("span", `bc-st${r.left > 0 ? " bc-has" : " bc-none"}`, { text: `${r.left > 0 ? "● " : "○ "}${runStatus(r)}` }),
      h("span", "bc-runs", { text: `Lượt ${r.left}/${r.max}` }),
      h("button", "bc-buy f2-nut-phu", { text: b.label, attrs: { type: "button", ...(b.disabled ? { disabled: "" } : {}), ...(b.reason ? { title: b.reason } : {}) } }),
      b.disabled && b.reason ? h("span", "bc-why", { text: b.reason }) : null,
      h("span", "bc-cd", {}),
        ] }),
        h("ul", "bc-waves", { attrs: { "aria-label": "Các sóng" }, kids: (s ? waveLines(s) : []).map((t) => h("li", "", { text: t })) }), // cuối cột: màn thấp (cỡ chữ lớn) cuộn phần này, nút Mua lượt vẫn thấy
      ] }),
    ] }));
    if (note) body.push(h("div", `bc-note${note.err ? " bc-bad" : ""}`, { text: note.text, attrs: { role: note.err ? "alert" : "status" } }));
  }
  const wrap = mount(h("div", "bc-wrap", { kids: body }));
  f.body.append(wrap);
  const st = wrap.querySelector<HTMLElement>(".bc-state");
  if (st) {
    const k = st.dataset.k as "loading" | "empty" | "error";
    st.replaceWith(stateBox({ kind: k, text: k === "empty" ? "Chưa có phụ bản nào mở." : k === "error" ? "Không tải được Bí Cảnh (mất kết nối hoặc máy chủ chưa trả lời)." : undefined, onRetry: () => openBiCanh() }));
  }
  const art = wrap.querySelector<HTMLElement>(".bc-art");
  if (art) { const img = artImg(art.dataset.art ?? "", "bc-img"); if (img) art.innerHTML = img; else art.textContent = "境"; } // chưa có poster: chữ 境 thay hình (ảnh poster làm theo asset-gen)
  const host = wrap.querySelector<HTMLElement>(".bc-cd");
  if (host && msg) {
    const target = recvAt + msg.resetIn, c = countdown({ target, label: `Làm mới sau (${resetClock})`, onEnd: () => { if (isBiCanhOpen()) send?.("bicanh", { op: "get" }); } });
    host.append(c.root); stops.push(c.stop);
  }
  wrap.querySelector(".bc-buy")?.addEventListener("click", askBuy);
  addCloseButton(f.root, closeBiCanh);
  root.replaceChildren(f.root);
}

// ---- phần DOM: HUD trong phòng + bảng kết quả ----
let room = newRoomHud(), hudTimer = 0, onLeave: () => void = () => {}, onBack: () => void = () => {}, lastHud = "";
const hudEl = () => document.getElementById("bicanhHud");
const endEl = () => document.getElementById("bicanhEnd");
/** Đang ở phòng Bí Cảnh (đã nhận tin `ready`), để GameScene nhận biết và đọc state hồn thú. */
export const inBiCanhRoom = () => room.phase !== "none";

/** `leave`: rời phòng giữa chừng (thua, giữ sóng đã hạ), `back`: về bản đồ cũ sau kết quả. GameScene truyền vào khi dựng scene. */
export function bindBiCanhRoom(leave: () => void, back: () => void) { onLeave = leave; onBack = back; }
/** Dọn khi đổi phòng / bản đồ (scene mới). */
export function resetBiCanhRoom() {
  room = newRoomHud(); lastHud = ""; window.clearInterval(hudTimer); hudTimer = 0;
  for (const e of [hudEl(), endEl()]) if (e) { e.hidden = true; e.replaceChildren(); }
}

function clockText(): string { return room.endAt ? formatCountdown(room.endAt - Date.now()).replace("Đã hết", "00:00:00") : ""; }
function renderHud() {
  const e = hudEl(); if (!e) return;
  if (room.phase === "none") { e.hidden = true; return; }
  if (!e.firstChild) {
    e.replaceChildren(mount(h("div", "bc-h-main", { kids: [h("b", "bc-h-t", {}), h("small", "bc-h-s", {})] })), mount(h("div", "bc-h-clock", { attrs: { role: "timer", "aria-label": "Thời gian còn lại" } })),
      mount(h("button", "bc-h-leave f2-nut-phu", { text: "Rời phòng", attrs: { type: "button" } })));
    e.querySelector(".bc-h-leave")!.addEventListener("click", () => {
      confirmDialog({ title: "Rời Bí Cảnh?", body: "Rời giữa chừng là thua: giữ quyển của các sóng đã hạ, lượt đã dùng không hoàn.", confirm: "Rời phòng", cancel: "Ở lại", danger: true }, () => onLeave());
    });
  }
  e.hidden = false;
  const t = e.querySelector<HTMLElement>(".bc-h-t")!, s = e.querySelector<HTMLElement>(".bc-h-s")!, c = e.querySelector<HTMLElement>(".bc-h-clock")!;
  const title = hudTitle(room), sub = hudSub(room), clock = clockText(), key = `${title}|${sub}|${clock}`;
  if (key === lastHud) return; lastHud = key;
  t.textContent = title; s.textContent = sub; s.hidden = !sub; c.textContent = clock;
  e.dataset.phase = room.phase; e.dataset.elite = room.elite ? "1" : "";
}
/** Mỗi khung hình (GameScene.update): máu tinh anh và số hồn thú còn lại đọc từ state hồn thú; không đổi gì thì không đụng DOM. */
export function tickBiCanhHud(beasts: { forEach(fn: (b: { rank: number; hp: number; maxHp: number }) => void): void }) {
  if (room.phase !== "fight") return;
  let n = 0, hp: number | null = null;
  beasts.forEach((b) => { n++; if (b.rank === 1 && b.maxHp > 0) hp = Math.max(0, Math.ceil((b.hp / b.maxHp) * 100)); });
  if (n !== room.left || hp !== room.eliteHp) { room = { ...room, left: n, eliteHp: room.elite ? hp : null }; renderHud(); }
}

/** Tin vòng phòng `bicanh {k}`: cập nhật HUD (ready / fight / wave / clear) hoặc dựng bảng kết quả (end). */
export function onBiCanhRoom(m: BiCanhRoomMsg, now = Date.now()) {
  if (!m || typeof m.k !== "string") return;
  if (m.k === "end") { showEnd(m); return; }
  room = applyRoomMsg(room, m, now); lastHud = ""; renderHud();
  if (!hudTimer) hudTimer = window.setInterval(() => { if (room.phase === "none") { window.clearInterval(hudTimer); hudTimer = 0; } else renderHud(); }, 1000);
}
function showEnd(m: BiCanhRoomMsg) {
  const e = endEl(); if (!e) return;
  const v = endView(m); window.clearInterval(hudTimer); hudTimer = 0; room = newRoomHud(); const hu = hudEl(); if (hu) hu.hidden = true;
  e.className = `bc-end f2-muc-nho ${v.win ? "win" : "lose"}`;
  const endAt = Date.now() + (m.secs ?? 0) * 1000;
  e.replaceChildren(mount(h("h2", "bc-e-t", { text: v.title })), ...v.lines.map((l) => mount(h("div", `bc-e-l ${l.cls}`, { text: l.text }))),
    mount(h("div", "bc-e-row", { kids: [h("button", "bc-e-back f2-nut-chinh", { text: "Về bản đồ cũ", attrs: { type: "button" } })] })), mount(h("small", "bc-e-cd", { attrs: { role: "timer" } })));
  e.hidden = false; e.setAttribute("role", "dialog"); e.setAttribute("aria-label", "Kết quả Bí Cảnh");
  e.querySelector(".bc-e-back")!.addEventListener("click", () => onBack());
  const cd = e.querySelector<HTMLElement>(".bc-e-cd")!;
  const tick = () => { cd.textContent = `Tự về bản đồ cũ sau ${Math.max(0, Math.ceil((endAt - Date.now()) / 1000))} giây.`; };
  tick(); const id = window.setInterval(() => { if (e.hidden || !e.isConnected) return window.clearInterval(id); tick(); }, 1000);
  e.querySelector<HTMLElement>(".bc-e-back")!.focus({ preventScroll: true });
}
