// Khung gộp ở cột trái, ngay dưới khối thông tin nhân vật: hai tab "Nhiệm vụ | Tổ đội" (tối ưu HUD, PR2; docs/design/giao-dien.md "Khung Nhiệm vụ | Tổ đội").
// Chỉ là lớp vỏ: nội dung từng tab vẫn do hudQuest.ts (`#quest`) và hud.ts (`#party`) vẽ như cũ, không đọc state game, không gửi gì lên server.
// Chấm đỏ mỗi tab: Nhiệm vụ = kho `badges.ts` (có bài nhận được / chờ trả), Tổ đội = có lời mời đang chờ. Có lời mời MỚI thì tự nhảy sang tab Tổ đội
// (và mở khung nếu đang thu gọn). Nút Gọn thu cả khung thành hai chip nhỏ (Nhiệm vụ, Tổ đội, mỗi chip có chấm); bấm một chip để mở khung ở tab đó.
// Màn thấp / nhỏ (ui-h560, ui-w640) mặc định thu gọn. Chiều cao do cột trái (#lcol, chừa chỗ cho chat / đội hình) giới hạn; thân cuộn trong khung.
import { badgeOf, onBadges } from "./badges.ts";

export type SideTab = "quest" | "party";
const TAB_NAME: Record<SideTab, string> = { quest: "Nhiệm vụ", party: "Tổ đội" };
let tab: SideTab = "quest", collapsed = false, invites = 0, inParty = false, hasQuest = false, wired = false;

const root = () => document.getElementById("sideBox");

function wire(el: HTMLElement) {
  if (wired) return; wired = true;
  const cls = document.body.classList;
  if (cls.contains("ui-h560") || cls.contains("ui-w640")) collapsed = true; // màn thấp / nhỏ: mặc định hai chip nhỏ, bấm để mở
  el.querySelectorAll<HTMLButtonElement>(".sb-tab").forEach((b) => b.addEventListener("click", () => { b.blur(); showSideTab(b.dataset.tab as SideTab); }));
  el.querySelector<HTMLButtonElement>("#sbFold")!.addEventListener("click", (e) => { (e.currentTarget as HTMLElement).blur(); collapsed = true; paint(); });
  onBadges(paint);
  addEventListener("resize", fitSoon);
  const ro = new ResizeObserver(fitSoon); ro.observe(document.body); const mb = document.querySelector(".mapbox"); if (mb) ro.observe(mb); // đổi cỡ chữ trợ năng / tỉ lệ giao diện đổi cỡ thân → đo lại
}

/** Vật cản ở dưới: đội hình 1–4 và các nhóm thanh kỹ năng (khung không được kéo xuống đè lên). */
const BELOW = "#team,#actrow .action-group";
let fitRaf = 0;
function fitSoon() { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fit); }
/**
 * Đặt khung và giới hạn chiều cao thân theo chỗ còn trống (toạ độ màn hình chia cho hệ số `zoom` của HUD; offsetHeight là cỡ chưa phóng).
 * - Màn thấp (position absolute, `ui-h560` không cảm ứng): khung đứng ngay phải cột chỉ số trái như khung Tổ đội cũ, hẹp lại để không chạm huy hiệu menu;
 *   lúc đó `#hud.sb-left` bật để dải boss / mục tiêu / đếm ngược dời qua phải huy hiệu (ui2-hud-side.css), không bị khung đè.
 * - Mọi cỡ màn: thân cao tới mép trên của vật cản gần nhất bên dưới có chồng ngang (đội hình, nhóm kỹ năng) trừ lề; thừa thì cuộn trong khung.
 */
function fit() {
  const el = root(), body = el?.querySelector<HTMLElement>(".sb-body"), hud = document.getElementById("hud");
  if (!el || !body) return;
  body.style.maxHeight = ""; el.style.maxWidth = ""; el.style.left = ""; el.style.right = "";
  const shown = el.getClientRects().length > 0, lane = shown && getComputedStyle(el).position === "absolute";
  hud?.classList.toggle("sb-left", lane);
  if (!shown) return;
  let r = el.getBoundingClientRect(), k = el.offsetHeight ? r.height / el.offsetHeight : 1;
  const hub = document.getElementById("hubBtn"), col = document.getElementById("rcol"), lcol = document.getElementById("lcol");
  if (lane && hub && col && lcol) {
    const x0 = lcol.getBoundingClientRect().right + MARGIN * k, room = (hub.getBoundingClientRect().left - x0) / k - MARGIN;
    el.style.right = "auto"; el.style.left = Math.round((x0 - col.getBoundingClientRect().left) / k) + "px";
    el.style.maxWidth = Math.max(MIN_W, Math.floor(room)) + "px";
    r = el.getBoundingClientRect(); k = el.offsetHeight ? r.height / el.offsetHeight : 1;
  }
  if (el.classList.contains("collapsed")) return;
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
    const t = b.dataset.tab as SideTab, on = t === tab && !collapsed;
    b.setAttribute("aria-selected", String(on)); b.tabIndex = collapsed || t === tab ? 0 : -1;
    b.setAttribute("aria-expanded", String(!collapsed));
    if (dots[t]) b.dataset.dot = "1"; else delete b.dataset.dot;
    b.setAttribute("aria-label", `${TAB_NAME[t]}${dots[t] ? ": có việc mới" : ""}${collapsed ? " (bấm để mở)" : ""}`);
  });
  const fold = el.querySelector<HTMLElement>("#sbFold")!;
  fold.hidden = collapsed; // thu gọn: chỉ còn hai chip (hai tab)
  fold.setAttribute("aria-expanded", String(!collapsed));
  const empty = el.querySelector<HTMLElement>("#sbQuestEmpty"); if (empty) empty.hidden = tab !== "quest" || hasQuest;
  fitSoon();
}

/** Chọn tab (mở khung nếu đang thu gọn). */
export function showSideTab(t: SideTab) { tab = t; collapsed = false; paint(); }
/** hudQuest.ts báo có gì để theo dõi không (hiện dòng gợi ý khi rỗng). */
export function sideBoxQuest(any: boolean) { hasQuest = any; paint(); }
/** hud.ts báo số lời mời đang chờ; tăng thì nhảy sang tab Tổ đội (người chơi đổi lại được, không bị kéo về nữa cho tới lời mời mới). */
export function sideBoxInvites(n: number, inTeam = false) { const more = n > invites; invites = n; inParty = inTeam; if (more) { tab = "party"; collapsed = false; } paint(); }
