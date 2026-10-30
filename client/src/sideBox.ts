// Khung gộp góc phải: hai tab "Nhiệm vụ | Tổ đội" (tối ưu HUD, PR2; docs/design/giao-dien.md "Khung Nhiệm vụ | Tổ đội").
// Chỉ là lớp vỏ: nội dung từng tab vẫn do hudQuest.ts (`#quest`) và hud.ts (`#party`) vẽ như cũ, không đọc state game, không gửi gì lên server.
// Chấm đỏ mỗi tab: Nhiệm vụ = kho `badges.ts` (có bài nhận được / chờ trả), Tổ đội = có lời mời đang chờ. Có lời mời MỚI thì tự nhảy sang tab Tổ đội
// (và mở khung nếu đang thu gọn). Nút Gọn thu cả khung thành một chip, chip bấm để mở lại.
import { badgeOf, onBadges } from "./badges.ts";

export type SideTab = "quest" | "party";
const TAB_NAME: Record<SideTab, string> = { quest: "Nhiệm vụ", party: "Tổ đội" };
let tab: SideTab = "quest", collapsed = false, invites = 0, inParty = false, hasQuest = false, wired = false;

const root = () => document.getElementById("sideBox");

function wire(el: HTMLElement) {
  if (wired) return; wired = true;
  el.querySelectorAll<HTMLButtonElement>(".sb-tab").forEach((b) => b.addEventListener("click", () => { b.blur(); showSideTab(b.dataset.tab as SideTab); }));
  el.querySelector<HTMLButtonElement>("#sbFold")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); collapsed = !collapsed; paint(); });
  onBadges(paint);
  addEventListener("resize", fitSoon);
  const ro = new ResizeObserver(fitSoon); ro.observe(document.body); const mb = document.querySelector(".mapbox"); if (mb) ro.observe(mb); // đổi cỡ chữ trợ năng / tỉ lệ giao diện đổi cỡ thân → đo lại
}

/** Vật cản ở dưới: đội hình 1–4 và các nhóm thanh kỹ năng (khung không được kéo xuống đè lên). */
const BELOW = "#team,#actrow .action-group";
let fitRaf = 0;
function fitSoon() { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fit); }
/**
 * Giới hạn chiều cao thân khung theo chỗ còn trống: từ mép trên của thân tới mép trên của vật cản gần nhất bên dưới có chồng ngang với khung (trừ lề);
 * thừa thì cuộn trong khung. Đo bằng toạ độ màn hình rồi chia cho hệ số `zoom` của HUD (offsetHeight là cỡ chưa phóng).
 */
function fit() {
  const el = root(), body = el?.querySelector<HTMLElement>(".sb-body");
  if (!el || !body || el.classList.contains("collapsed") || !el.getClientRects().length) return;
  body.style.maxHeight = ""; el.style.maxWidth = "";
  let r = el.getBoundingClientRect(), k = el.offsetHeight ? r.height / el.offsetHeight : 1;
  // Màn thấp: khung nằm bên trái cột radar (position absolute); hẹp lại để không chạm huy hiệu menu giữa trên (cỡ chữ lớn làm radar rộng ra, đẩy khung sang trái).
  const hub = document.getElementById("hubBtn"), col = document.getElementById("rcol");
  if (hub && col && getComputedStyle(el).position === "absolute") {
    const room = (col.getBoundingClientRect().left - hub.getBoundingClientRect().right) / k - 2 * MARGIN;
    if (r.width / k > room) { el.style.maxWidth = Math.max(MIN_W, Math.floor(room)) + "px"; r = el.getBoundingClientRect(); k = el.offsetHeight ? r.height / el.offsetHeight : 1; }
  }
  const b = body.getBoundingClientRect();
  let floor = Infinity;
  document.querySelectorAll<HTMLElement>(BELOW).forEach((o) => {
    const q = o.getBoundingClientRect();
    if (q.height && q.top > r.top && q.left < r.right && q.right > r.left) floor = Math.min(floor, q.top);
  });
  if (!Number.isFinite(floor)) return;
  const avail = Math.floor((floor - b.top) / k) - MARGIN;
  if (body.offsetHeight > avail) body.style.maxHeight = Math.max(MIN_BODY, avail) + "px";
}
const MARGIN = 8, MIN_BODY = 36, MIN_W = 120;

/** Vẽ lại vỏ khung: tab đang chọn, chấm đỏ từng tab, trạng thái thu gọn, dòng "chưa có nhiệm vụ". */
export function paint() {
  const el = root(); if (!el) return;
  wire(el);
  const dots: Record<SideTab, boolean> = { quest: !!badgeOf("quest"), party: invites > 0 };
  el.dataset.tab = tab; el.classList.toggle("collapsed", collapsed); el.classList.toggle("inv", invites > 0); el.classList.toggle("inparty", inParty);
  el.querySelectorAll<HTMLElement>(".sb-tab").forEach((b) => {
    const t = b.dataset.tab as SideTab, on = t === tab;
    b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1;
    if (dots[t]) b.dataset.dot = "1"; else delete b.dataset.dot;
    b.setAttribute("aria-label", dots[t] ? `${TAB_NAME[t]}: có việc mới` : TAB_NAME[t]);
  });
  const fold = el.querySelector<HTMLElement>("#sbFold")!, any = dots.quest || dots.party;
  fold.setAttribute("aria-expanded", String(!collapsed));
  fold.textContent = collapsed ? "▸ Nhiệm vụ · Tổ đội" : "Gọn";
  fold.title = collapsed ? "Mở khung Nhiệm vụ / Tổ đội" : "Thu gọn khung thành một chip";
  fold.setAttribute("aria-label", collapsed ? `Mở khung Nhiệm vụ và Tổ đội${any ? " (có việc mới)" : ""}` : "Thu gọn khung Nhiệm vụ và Tổ đội");
  if (any) fold.dataset.dot = "1"; else delete fold.dataset.dot;
  const empty = el.querySelector<HTMLElement>("#sbQuestEmpty"); if (empty) empty.hidden = tab !== "quest" || hasQuest;
  fitSoon();
}

/** Chọn tab (mở khung nếu đang thu gọn). */
export function showSideTab(t: SideTab) { tab = t; collapsed = false; paint(); }
/** hudQuest.ts báo có gì để theo dõi không (hiện dòng gợi ý khi rỗng). */
export function sideBoxQuest(any: boolean) { hasQuest = any; paint(); }
/** hud.ts báo số lời mời đang chờ; tăng thì nhảy sang tab Tổ đội (người chơi đổi lại được, không bị kéo về nữa cho tới lời mời mới). */
export function sideBoxInvites(n: number, inTeam = false) { const more = n > invites; invites = n; inParty = inTeam; if (more) { tab = "party"; collapsed = false; } paint(); }
