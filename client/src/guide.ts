// Hướng dẫn điều khiển lần đầu (M6 #752): 4 bước (đi / khoá quái / kỹ năng / nhặt + hấp thụ hồn hoàn), nút Bỏ qua, nút "?" xem lại,
// và gợi ý một lần theo tình huống (lần đầu bị đánh, lần đầu có hồn hoàn rơi, lần đầu túi gần đầy). Chỉ hiển thị: bước tiến lên theo
// ý định client đã gửi (đi, khoá, dùng kỹ năng, bắt đầu hấp thụ), không quyết định gì của luật chơi. Trạng thái "đã xem" lưu ở
// localStorage theo tên hồn sư (không cần server / migration). Chữ phải khớp phím thật ở GameScene.setupInput và hud.SKILL_KEYS.
import "./guide.css";
import { storage } from "./net.ts";
import { SKILL_KEYS } from "./hud.ts";
import { GUIDE_BAG_FREE } from "../../shared/data.ts";
import { onboardAttach, onboardBegin, onboardReview } from "./onboard.ts";

/** Đoạn chữ: chuỗi thường hoặc phím (vẽ thành <kbd>). */
type Seg = string | { k: string };
export type GuideEvent = "move" | "lock" | "skill" | "absorb";
export type GuideHint = "hit" | "ring" | "bag";

interface Step { id: GuideEvent; title: string; body: Seg[]; }
const k = (x: string): Seg => ({ k: x });
const STEPS: Step[] = [
  { id: "move", title: "Di chuyển", body: ["Giữ ", k("W"), k("A"), k("S"), k("D"), " (hoặc phím mũi tên) để đi, hoặc bấm vào nền đất: nhân vật tự đi tới chỗ đó."] },
  { id: "lock", title: "Khoá hồn thú và tự đánh", body: ["Bấm vào hồn thú để khoá mục tiêu: nhân vật tự đi tới và đánh thường liên tục. ", k("Tab"), " đổi mục tiêu, ", k("Esc"), " bỏ khoá, ", k("Space"), " khi chưa khoá thì quay về con gần nhất."] },
  { id: "skill", title: "Dùng hồn kỹ", body: ["Bấm ", ...SKILL_KEYS.map(k), " hoặc bấm ô trên thanh kỹ năng. Hồn kỹ tốn hồn lực và có thời gian hồi; ", k("1"), "–", k("4"), " đổi võ hồn trong đội."] },
  { id: "absorb", title: "Nhặt và hấp thụ hồn hoàn", body: ["Hạ hồn thú sẽ rơi hồn hoàn: đứng gần, nhấn ", k("E"), " để nhặt. Mở Túi đồ (", k("B"), "), chọn hồn hoàn, bấm Hấp thụ… rồi đứng yên chờ thanh tiến độ."] },
];
const HINTS: Record<GuideHint, { title: string; body: Seg[] }> = {
  hit: { title: "Bạn bị đánh", body: ["Thanh máu ở góc trên trái. Lùi lại bằng ", k("W"), k("A"), k("S"), k("D"), " hoặc đổi võ hồn bằng ", k("1"), "–", k("4"), " (đội hình: ", k("V"), ")."] },
  ring: { title: "Có hồn hoàn rơi", body: ["Đứng gần và nhấn ", k("E"), " để nhặt vào túi (đồ rơi biến mất sau ít giây). Hấp thụ trong Túi đồ (", k("B"), ")."] },
  bag: { title: "Túi gần đầy", body: [`Còn không quá ${GUIDE_BAG_FREE} ô trống. Mở Túi đồ (`, k("B"), ") để sắp xếp, bỏ bớt hoặc bán; bảng Tự động (", k("T"), ") có mục tự bán đồ."] },
};
const HINT_MS = 12000;

interface Saved { tour?: "done" | "skip"; hints?: GuideHint[]; }
let who = "";
let saved: Saved = {};
let card: HTMLElement | null = null;
let mode: "off" | "tour" | "review" | "hint" = "off";
let step = 0, hintTimer = 0;

const keyOf = () => `soul-guide-v1:${who}`;
function load() { try { const j = JSON.parse(storage.get(keyOf()) ?? "{}"); saved = j && typeof j === "object" ? j : {}; } catch { saved = {}; } }
function save() { storage.set(keyOf(), JSON.stringify(saved)); }

function fill(el: HTMLElement, segs: Seg[]) {
  el.textContent = "";
  for (const s of segs) {
    if (typeof s === "string") el.appendChild(document.createTextNode(s));
    else { const e = document.createElement("kbd"); e.textContent = s.k; el.appendChild(e); }
  }
}
const q = (c: HTMLElement, sel: string) => c.querySelector(sel) as HTMLElement;

function root(): HTMLElement {
  if (card?.isConnected) return card;
  card = document.createElement("section"); card.id = "guide"; card.className = "panel guide"; card.hidden = true;
  card.setAttribute("role", "dialog"); card.setAttribute("aria-label", "Hướng dẫn điều khiển"); card.setAttribute("aria-live", "polite");
  card.innerHTML = `<div class="g-main"><div class="g-head"><b></b><span class="g-dots" aria-hidden="true"></span></div><h4></h4><p></p></div>
    <div class="g-foot"><button type="button" class="g-next"></button><button type="button" class="g-skip"></button><button type="button" class="g-onboard" hidden>Xem lại hướng dẫn</button></div>`;
  q(card, ".g-onboard").addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); close(); onboardReview(); });
  q(card, ".g-skip").addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); close(mode === "tour" ? "skip" : ""); });
  q(card, ".g-next").addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); if (mode === "hint") close(); else next(); });
  (document.getElementById("hud") ?? document.body).appendChild(card);
  return card;
}

function render() {
  const c = root(), s = STEPS[step];
  c.hidden = false; c.dataset.mode = mode;
  q(c, ".g-head b").textContent = `Hướng dẫn · bước ${step + 1}/${STEPS.length}`;
  q(c, ".g-dots").textContent = STEPS.map((_, i) => (i < step ? "●" : i === step ? "◉" : "○")).join(" ");
  q(c, "h4").textContent = s.title;
  fill(q(c, "p"), s.body);
  q(c, ".g-skip").hidden = false; q(c, ".g-skip").textContent = mode === "tour" ? "Bỏ qua" : "Đóng";
  q(c, ".g-next").textContent = step === STEPS.length - 1 ? "Xong" : "Tiếp";
  q(c, ".g-onboard").hidden = mode !== "review";
  q(c, ".g-onboard").title = "Xem lại 6 bước Làm quen: võ hồn, nhiệm vụ, Túi đồ, hồn hoàn, bản đồ và menu.";
}

function close(result: "" | "skip" | "done" = "") {
  clearTimeout(hintTimer);
  if (card) card.hidden = true;
  const ended = mode === "tour" && !!result;
  if (ended) { saved.tour = result as "done" | "skip"; save(); }
  mode = "off";
  if (ended) onboardBegin(); // làm quen (onboard.ts) nối tiếp sau chuỗi điều khiển
}

function next() {
  if (step >= STEPS.length - 1) return close(mode === "tour" ? "done" : "");
  step++; render();
}

/** Gắn vào một hồn sư: nạp "đã xem" theo tên. `starterDone`: chuỗi tân thủ đã xong (tài khoản cũ) thì không tự hiện (nút "?" vẫn xem được). */
export function guideStart(name: string, starterDone: boolean) {
  who = name; load();
  if (!saved.tour && starterDone) { saved.tour = "done"; save(); }
  onboardAttach(name); // UI v2: nạp tiến độ làm quen (tiếp tục nếu đang làm dở)
  if (!saved.tour) { if (mode !== "tour") step = 0; mode = "tour"; render(); } // đổi bản đồ giữa chừng (GameScene dựng lại): giữ bước đang làm
}

/** Nút "?": xem lại từ bước 1 (bấm lần nữa thì đóng); không đổi trạng thái đã xem. */
export function guideReview() {
  if (!who || mode === "tour") return;
  if (mode === "review") return close();
  clearTimeout(hintTimer); mode = "review"; step = 0; render();
}

/** Việc người chơi vừa làm: bước đang chờ đúng việc này thì tiến lên. */
export function guideEvent(ev: GuideEvent) {
  if ((mode !== "tour" && mode !== "review") || STEPS[step].id !== ev) return;
  next();
}

/** Gợi ý một lần theo tình huống (tự tắt sau ít giây); không hiện khi đang có hướng dẫn / gợi ý khác (lần sau gặp lại tình huống thì hiện). */
export function guideHint(h: GuideHint) {
  if (!who || mode !== "off" || saved.hints?.includes(h)) return;
  const c = root(), t = HINTS[h];
  c.hidden = false; c.dataset.mode = "hint";
  if (getComputedStyle(c).display === "none") { c.hidden = true; return; } // CSS đang ẩn thẻ (hộp NPC mở, đấu trường): chưa tính là đã thấy, lần sau gặp lại thì hiện
  (saved.hints ??= []).push(h); save();
  mode = "hint";
  q(c, ".g-head b").textContent = "Gợi ý";
  q(c, ".g-dots").textContent = "";
  q(c, "h4").textContent = t.title;
  fill(q(c, "p"), t.body);
  q(c, ".g-skip").hidden = true;
  q(c, ".g-onboard").hidden = true;
  q(c, ".g-next").textContent = "Đã hiểu";
  hintTimer = window.setTimeout(() => close(), HINT_MS);
}
