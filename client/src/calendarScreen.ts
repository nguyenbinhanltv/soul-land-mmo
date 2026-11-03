// UI v2, màn Lịch Hoạt Động (docs/design/lich-hoat-dong.md "Giao diện", Part of #877). Chỉ hiển thị tin riêng `calendar` của server (#1202: `{now, weekStart, items, fixed}`)
// và gửi ý định `calendar {op:"get", week}`; khung giờ, tên boss, giờ "hôm nay" do server quyết, client chỉ so `now` của server với `s` / `e` để chọn trạng thái thẻ.
import { EVENT_DEFS } from "../../shared/data.ts";
import { COUNTDOWN_SOON_MS, countdown, screenFrame, mount, addCloseButton, type PNode } from "./uiParts.ts";
import { mapName } from "./autowalk.ts";
import { hhmmVn, serverNow, syncServerNow } from "./svClock.ts";
import { artUrl } from "./uiArt.ts";

export interface CalItem { id: string; name: string; kind: "slot"; s: number; e: number; d: number; map: string; mapName: string; boss: string; note?: string }
export interface CalFixed { id: string; name: string; kind: "reset" | "always"; at?: string; weekly?: boolean; npc?: string; note?: string }
export interface CalendarMsg { now: number; weekStart: number; items: CalItem[]; fixed: CalFixed[] }
export type SlotState = "live" | "soon" | "past" | "later";

const DAY_MS = 86_400_000;
export const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Trạng thái thẻ giờ: đang mở / sắp mở (trong 1 giờ) / đã qua / còn lại. `now` là giờ server. Hàm thuần. */
export function slotState(it: Pick<CalItem, "s" | "e">, now: number): SlotState {
  if (now >= it.e) return "past";
  if (now >= it.s) return "live";
  return it.s - now <= COUNTDOWN_SOON_MS ? "soon" : "later";
}
/** Thứ trong tuần (0 = thứ Hai) của giờ `now` so với `weekStart` (thứ Hai 00:00 giờ Việt Nam); ngoài 0…6 = không thuộc tuần đang xem (null). Việt Nam không đổi giờ mùa hè nên cộng 24 giờ là đủ. */
export function todayIndex(now: number, weekStart: number): number | null {
  const d = Math.floor((now - weekStart) / DAY_MS);
  return d >= 0 && d < 7 ? d : null;
}
/** Chia khung giờ theo cột thứ (theo `d` của server), mỗi cột xếp theo giờ bắt đầu. */
export function byDay(items: CalItem[]): CalItem[][] {
  const cols: CalItem[][] = Array.from({ length: 7 }, () => []);
  for (const it of items) if (it.d >= 0 && it.d < 7) cols[it.d].push(it);
  for (const c of cols) c.sort((a, b) => a.s - b.s || a.id.localeCompare(b.id));
  return cols;
}
/** Các thẻ cùng tên + cùng giờ (vd 5 "Tà hóa thú vương" lúc 20:00 ở 5 bản đồ) gom thành một nhóm có đếm; khoá nhóm = khoá khung giờ nếu chỉ có một thẻ. Giữ thứ tự đầu vào. Hàm thuần. */
export interface CalGroup { key: string; first: CalItem; items: CalItem[] }
export function groupSlots(col: CalItem[]): CalGroup[] {
  const out: CalGroup[] = [], by = new Map<string, CalGroup>();
  for (const it of col) {
    const k = `${it.name}@${it.s}@${it.e}`, g = by.get(k);
    if (g) g.items.push(it); else { const n = { key: k, first: it, items: [it] }; by.set(k, n); out.push(n); }
  }
  for (const g of out) if (g.items.length === 1) g.key = `${g.first.id}@${g.first.s}`;
  return out;
}
/** Ngày thứ `d` đã qua hẳn (hết 24 giờ trước `now`); tuần trước thì cả bảy ngày. Hàm thuần. */
export const dayPast = (weekStart: number, d: number, now: number) => weekStart + (d + 1) * DAY_MS <= now;
/** "dd.mm" của ngày thứ `d` trong tuần bắt đầu ở `weekStart` (giờ Việt Nam). */
export const dayDate = (weekStart: number, d: number) => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit" }).formatToParts(weekStart + d * DAY_MS + 3_600_000);
  return `${p.find((x) => x.type === "day")?.value}.${p.find((x) => x.type === "month")?.value}`;
};
export const slotRange = (it: Pick<CalItem, "s" | "e">) => `${hhmmVn(it.s)} – ${hhmmVn(it.e)}`;
/** Đích của nút "Đến": bản đồ (luôn có) và NPC cần gặp nếu mục gắn với một NPC. Lấy từ `EVENT_DEFS` (bảng luật dùng chung), không tự đặt vị trí. */
export interface CalGoal { map: string; mapName: string; npc?: string }
/** Mục luôn mở có NPC + bản đồ → đích; mục không có `npc` / `map` thì null (không hiện nút). */
export function fixedGoal(f: Pick<CalFixed, "id" | "npc">, mapNameOf: (id: string) => string): CalGoal | null {
  const d = EVENT_DEFS.find((x) => x.id === f.id);
  return d?.map && f.npc ? { map: d.map, mapName: mapNameOf(d.map), npc: f.npc } : null;
}
/** Khung giờ đang mở hoặc sắp mở (trong `COUNTDOWN_SOON_MS`) mà người chơi chưa xem (`seen`: khoá `id@s`): số chấm đỏ của icon Lịch. Hàm thuần. */
export function unseenSoon(items: Pick<CalItem, "id" | "s" | "e">[], now: number, seen: ReadonlySet<string>): number {
  let n = 0;
  for (const it of items) { const st = slotState(it, now); if ((st === "live" || st === "soon") && !seen.has(`${it.id}@${it.s}`)) n++; }
  return n;
}
export const STATE_LABEL: Record<SlotState, string> = { live: "Đang mở", soon: "Sắp mở", past: "Đã qua", later: "" };

/** Chỉ suy loại từ mã server đã gửi; mã lạ giữ nguyên thẻ chữ. */
export function calendarIconKey(id: string): string | null {
  const type = id.startsWith("king:") ? "king" : id.startsWith("world:") ? "world" :
    id === "always:arena" ? "arena" : id === "always:auto" ? "auto" : id === "reset:daily" ? "daily" : id === "reset:tong" ? "weekly" : null;
  return type ? `gi_calendar_${type}` : null;
}

// ---- phần DOM ----
let send: ((type: string, payload: unknown) => void) | null = null;
let data: CalendarMsg | null = null, week = 0, status: "loading" | "ready" | "error" = "loading", sel: string | null = null;
let timer = 0, tick = 0, stops: (() => void)[] = [];
const el = () => document.getElementById("calendar");
const LOAD_TIMEOUT_MS = 6000;

/** Mở đường tới đích: GameScene dùng cờ "Đi tới" (`flagToMap`) / đi bộ tới NPC cùng bản đồ; không gửi gì lên server, không dịch chuyển. */
let goTo: (g: CalGoal) => void = () => {};
let onBadge: (n: number) => void = () => {};
const seen = new Set<string>(); // khung giờ đã xem (mở bảng) trong phiên này
const WATCH_REFRESH_MS = 10 * 60_000, WATCH_TICK_MS = 30_000;
export function bindCalendar(sender: (type: string, payload: unknown) => void, go?: (g: CalGoal) => void, badge?: (n: number) => void) { send = sender; if (go) goTo = go; if (badge) onBadge = badge; }
/** Chấm đỏ: xin lịch tuần này lúc vào phòng và mỗi 10 phút (khi bảng đóng), tính lại mỗi 30 giây từ bản đã có; chỉ dùng tin `calendar` sẵn có, không tin mới. */
/** `blocked`: phòng sân đấu / Bí Cảnh chặn tin `calendar` (BLOCKED ở server), nên không tự xin lịch nền ở đó (#1603: toast "không làm được việc này" ngay khi vào phòng). */
export function watchCalendar(signal: AbortSignal, blocked = false) {
  seen.clear(); data = null;
  if (blocked) return;
  const ask = () => { if (send && !isCalendarOpen()) send("calendar", { op: "get", week: 0 }); };
  const tickBadge = () => { const open = isCalendarOpen(); if (open && data) for (const it of data.items) if (slotState(it, serverNow()) !== "past") seen.add(`${it.id}@${it.s}`); onBadge(data && !open ? unseenSoon(data.items, serverNow(), seen) : 0); };
  const a = window.setTimeout(ask, 1500), r = window.setInterval(ask, WATCH_REFRESH_MS), t = window.setInterval(tickBadge, WATCH_TICK_MS);
  signal.addEventListener("abort", () => { window.clearTimeout(a); window.clearInterval(r); window.clearInterval(t); onBadge(0); });
  watchTick = tickBadge;
}
let watchTick: () => void = () => {};
export const isCalendarOpen = () => { const e = el(); return !!e && !e.hidden; };

function request() {
  if (!send) return;
  status = "loading"; send("calendar", { op: "get", week });
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { if (status === "loading") { status = "error"; render(); } }, LOAD_TIMEOUT_MS);
  render();
}
export function openCalendar() { const e = el(); if (!e || !send) return; e.hidden = false; week = 0; request(); watchTick(); window.clearInterval(tick); tick = window.setInterval(() => { if (data) render(); }, 30_000); } // đổi trạng thái thẻ khi qua giờ
export function closeCalendar() { const e = el(); if (e) e.hidden = true; window.clearTimeout(timer); window.clearInterval(tick); for (const s of stops) s(); stops = []; }
export function onCalendar(m: CalendarMsg) {
  if (!m || !Array.isArray(m.items) || !Array.isArray(m.fixed) || typeof m.weekStart !== "number") return;
  syncServerNow(m.now); data = m; status = "ready"; window.clearTimeout(timer); render(); watchTick();
}

const h = (tag: string, cls: string, o: { text?: string; attrs?: Record<string, string>; kids?: (PNode | null)[] } = {}): PNode =>
  ({ tag, cls, ...(o.attrs ? { attrs: o.attrs } : {}), ...(o.text !== undefined ? { text: o.text } : {}), ...(o.kids ? { kids: o.kids.filter((k): k is PNode => !!k) } : {}) });

function eventIcon(id: string): PNode | null {
  const key = calendarIconKey(id); if (!key) return null;
  const url = (window.devicePixelRatio < 1.5 && artUrl(`${key}_1x`)) || artUrl(key);
  return url ? h("img", "cal-icon", { attrs: { src: url, alt: "", "aria-hidden": "true", draggable: "false", width: "24", height: "24" } }) : null;
}
const eventName = (id: string, name: string, short = false) => h("span", "cal-heading", { kids: [eventIcon(id), h("span", `cal-name${short ? " cal-short" : ""}`, { text: name })] });

/** Tên boss gọn của nhóm: tối đa hai tên, còn lại "+N"; đủ tên ở `title` và bảng chi tiết. */
const bossBrief = (g: CalGroup) => { const n = g.items.map((i) => i.boss).filter(Boolean); return n.length > 2 ? `${n.slice(0, 2).join(", ")} +${n.length - 2}` : n.join(", "); };

function slotNode(g: CalGroup, st: SlotState): PNode {
  const it = g.first, many = g.items.length > 1;
  const mark = st === "live" ? "▶ " : st === "soon" ? "◔ " : st === "past" ? "■ " : ""; // dấu hình + chữ: không chỉ màu
  const where = g.items.map((i) => `${i.mapName}${i.boss ? `: ${i.boss}` : ""}`).join("; ");
  const label = `${it.name}${many ? ` ×${g.items.length}` : ""}, ${slotRange(it)}${STATE_LABEL[st] ? `, ${STATE_LABEL[st]}` : ""}. ${where}`;
  const nm = many ? `${it.name} ×${g.items.length}` : it.name;
  // đã qua: thu gọn một dòng (giờ + dấu tick) để bảng ngày không dài vô tận; còn lại đủ tên + boss
  return h("button", `cal-slot cal-${st}${sel === g.key ? " sel" : ""}`, { attrs: { type: "button", "data-k": g.key, "aria-label": label, title: label }, kids: st === "past" ? [
    h("span", "cal-time", { text: `■ ${hhmmVn(it.s)}` }), eventName(it.id, nm, true),
  ] : [
    h("span", "cal-time", { text: slotRange(it) }),
    st !== "later" ? h("span", "cal-tag", { text: mark + STATE_LABEL[st] }) : null,
    eventName(it.id, nm),
    bossBrief(g) ? h("span", "cal-boss", { text: many ? bossBrief(g) : `Boss: ${it.boss}` }) : null,
  ] });
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  const previousGrid = root.querySelector<HTMLElement>(".cal-grid");
  const previousScroll = previousGrid ? { week: previousGrid.dataset.week, left: previousGrid.scrollLeft, top: previousGrid.scrollTop } : null;
  for (const s of stops) s(); stops = [];
  const f = screenFrame({ material: "giay", title: "Lịch Hoạt Động", badge: "曆", info: "Giờ theo giờ Việt Nam. Lịch chỉ đọc từ luật thời gian của máy chủ; mỗi ngày làm mới lúc 00:00." });
  const now = serverNow(), body: PNode[] = [];
  if (status === "error") body.push(h("div", "cal-msg cal-err", { kids: [h("span", "", { text: "Không tải được lịch (mất kết nối hoặc máy chủ chưa trả lời)." }), h("button", "cal-retry", { text: "Thử lại", attrs: { type: "button" } })] }));
  if (!data) { if (status === "loading") body.push(h("div", "cal-skel", { attrs: { "aria-busy": "true", "aria-label": "Đang tải" }, kids: Array.from({ length: 7 }, () => h("span", "cal-skel-c")) })); }
  else {
    const d = data, today = todayIndex(now, d.weekStart), cols = byDay(d.items);
    const always = d.fixed.filter((x) => x.kind === "always"), resets = d.fixed.filter((x) => x.kind === "reset");
    body.push(h("div", "cal-fixed", { kids: [h("span", "cal-fixed-l", { text: "Luôn mở:" }), ...always.map((x) => { const g = fixedGoal(x, mapName); return h("span", "cal-chip", { kids: [
      eventIcon(x.id),
      h("span", "", { text: x.name, attrs: x.note ? { title: x.note } : {} }),
      g ? h("button", "cal-go cal-go-s", { text: "Đến", attrs: { type: "button", "data-map": g.map, "data-npc": g.npc ?? "", "data-mn": g.mapName, "aria-label": `Đến ${x.name} ở ${g.mapName}` } }) : null] }); })] }));
    body.push(h("div", "cal-wk", { kids: [
      h("button", "cal-nav", { text: "◀", attrs: { type: "button", "data-w": "-1", "aria-label": "Tuần trước", ...(week <= -1 ? { disabled: "" } : {}) } }),
      h("span", "cal-wk-l", { text: `${dayDate(d.weekStart, 0)} – ${dayDate(d.weekStart, 6)}${week === 0 ? " · tuần này" : week < 0 ? " · tuần trước" : " · tuần sau"}` }),
      h("button", "cal-nav", { text: "▶", attrs: { type: "button", "data-w": "1", "aria-label": "Tuần sau", ...(week >= 1 ? { disabled: "" } : {}) } }),
      h("span", "cal-resets", { kids: resets.map((r) => h("span", "cal-reset", { kids: [eventIcon(r.id), h("span", "", { text: `${r.name}: ${r.at ?? "00:00"}${r.weekly ? " thứ Hai" : ""}` })] })) }),
    ] }));
    if (!d.items.length) body.push(h("div", "cal-msg", { text: "Tuần này chưa có khung giờ." }));
    else body.push(h("div", "cal-grid", { attrs: { "data-week": String(d.weekStart) }, kids: cols.map((c, i) => h("div", `cal-col${today === i ? " cal-today" : ""}${dayPast(d.weekStart, i, now) ? " cal-pastday" : ""}`, { kids: [
      h("div", "cal-dh", { kids: [h("span", "cal-dn", { text: DAY_LABELS[i] }), h("span", "cal-dd", { text: dayDate(d.weekStart, i) }), today === i ? h("span", "cal-now", { text: "Hôm nay" }) : null] }),
      ...(c.length ? groupSlots(c).map((g) => slotNode(g, slotState(g.first, now))) : [h("span", "cal-empty", { text: "—" })]),
    ] })) }));
    const pickG = cols.flatMap((c) => groupSlots(c)).find((g) => g.key === sel);
    if (pickG) {
      const first = pickG.first, st = slotState(first, now), many = pickG.items.length > 1;
      body.push(h("div", "cal-detail", { kids: [
        h("span", "cal-d-t", { text: many ? `${first.name} ×${pickG.items.length}` : first.name }), h("span", "cal-d-s", { text: `${many ? "" : `${first.mapName} · `}${slotRange(first)}${!many && first.boss ? ` · Boss: ${first.boss}` : ""}` }),
        first.note ? h("span", "cal-d-s", { text: first.note }) : null,
        ...(many ? pickG.items.map((it) => h("span", "cal-d-r", { kids: [
          h("span", "cal-d-s", { text: `${it.mapName}${it.boss ? ` · Boss: ${it.boss}` : ""}` }),
          h("button", "cal-go cal-go-s", { text: "Đến", attrs: { type: "button", "data-map": it.map, "data-mn": it.mapName, "aria-label": `Đến ${it.mapName}`, title: `Đi tới ${it.mapName} (tự đi bằng cờ, không dịch chuyển)` } }),
        ] })) : [h("button", "cal-go", { text: "Đến", attrs: { type: "button", "data-map": first.map, "data-mn": first.mapName, "aria-label": `Đến ${first.mapName}`, title: `Đi tới ${first.mapName} (tự đi bằng cờ, không dịch chuyển)` } })]),
        st === "live" || st === "soon" ? h("span", "cal-cd", { attrs: { "data-s": String(first.s), "data-e": String(first.e), "data-live": st === "live" ? "1" : "" } }) : null,
      ] }));
    }
  }
  const wrap = mount(h("div", "cal-wrap", { kids: body }));
  for (const img of wrap.querySelectorAll<HTMLImageElement>(".cal-icon")) {
    img.addEventListener("error", () => { img.hidden = true; }, { once: true });
    if (img.complete && !img.naturalWidth) img.hidden = true;
  }
  f.body.append(wrap);
  const cdHost = wrap.querySelector<HTMLElement>(".cal-cd");
  if (cdHost) {
    const live = !!cdHost.dataset.live, c = countdown({ target: Number(live ? cdHost.dataset.e : cdHost.dataset.s), now: serverNow, label: live ? "Kết thúc sau" : "Mở sau", onEnd: () => render() });
    cdHost.append(c.root); stops.push(c.stop);
  }
  wrap.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const nav = t.closest<HTMLElement>(".cal-nav"); if (nav && !(nav as HTMLButtonElement).disabled) { week += Number(nav.dataset.w); sel = null; request(); return; }
    if (t.closest(".cal-retry")) { request(); return; }
    const go = t.closest<HTMLElement>(".cal-go"); if (go?.dataset.map) { goTo({ map: go.dataset.map, mapName: go.dataset.mn ?? go.dataset.map, ...(go.dataset.npc ? { npc: go.dataset.npc } : {}) }); closeCalendar(); return; }
    const sl = t.closest<HTMLElement>(".cal-slot"); if (sl?.dataset.k) { sel = sel === sl.dataset.k ? null : sl.dataset.k; render(); }
  });
  addCloseButton(f.root, closeCalendar);
  root.replaceChildren(f.root);
  const grid = root.querySelector<HTMLElement>(".cal-grid"), today = grid?.querySelector<HTMLElement>(".cal-today");
  if (grid && previousScroll && previousScroll.week === grid.dataset.week) {
    grid.scrollLeft = previousScroll.left; grid.scrollTop = previousScroll.top;
  } else if (grid && today) {
    // Lưới hẹp cuộn ngang: mở đúng cột hôm nay; các lần dựng lại cùng tuần giữ vị trí người chơi đã cuộn.
    grid.scrollLeft = Math.max(0, today.getBoundingClientRect().left - grid.getBoundingClientRect().left - (grid.clientWidth - today.offsetWidth) / 2);
  }
}
