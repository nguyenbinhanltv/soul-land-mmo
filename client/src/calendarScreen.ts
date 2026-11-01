// UI v2, màn Lịch Hoạt Động (docs/design/lich-hoat-dong.md "Giao diện", Part of #877). Chỉ hiển thị tin riêng `calendar` của server (#1202: `{now, weekStart, items, fixed}`)
// và gửi ý định `calendar {op:"get", week}`; khung giờ, tên boss, giờ "hôm nay" do server quyết, client chỉ so `now` của server với `s` / `e` để chọn trạng thái thẻ.
import { EVENT_DEFS } from "../../shared/data.ts";
import { COUNTDOWN_SOON_MS, countdown, screenFrame, mount, addCloseButton, type PNode } from "./uiParts.ts";
import { mapName } from "./autowalk.ts";
import { hhmmVn, serverNow, syncServerNow } from "./svClock.ts";

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
const slotKey = (it: CalItem) => `${it.id}@${it.s}`;

function slotNode(it: CalItem, st: SlotState): PNode {
  const mark = st === "live" ? "▶ " : st === "soon" ? "◔ " : st === "past" ? "■ " : ""; // dấu hình + chữ: không chỉ màu
  const label = `${it.name}, ${slotRange(it)}${STATE_LABEL[st] ? `, ${STATE_LABEL[st]}` : ""}`;
  // đã qua: thu gọn một dòng (giờ + dấu tick) để bảng ngày không dài vô tận; còn lại đủ tên + boss
  return h("button", `cal-slot cal-${st}${sel === slotKey(it) ? " sel" : ""}`, { attrs: { type: "button", "data-k": slotKey(it), "aria-label": label, title: label }, kids: st === "past" ? [
    h("span", "cal-time", { text: `■ ${hhmmVn(it.s)}` }), h("span", "cal-name cal-short", { text: it.name }),
  ] : [
    h("span", "cal-time", { text: slotRange(it) }),
    st !== "later" ? h("span", "cal-tag", { text: mark + STATE_LABEL[st] }) : null,
    h("span", "cal-name", { text: it.name }),
    it.boss ? h("span", "cal-boss", { text: `Boss: ${it.boss}` }) : null,
  ] });
}

function render() {
  const root = el(); if (!root || root.hidden) return;
  for (const s of stops) s(); stops = [];
  const f = screenFrame({ material: "giay", title: "Lịch Hoạt Động", badge: "曆", info: "Giờ theo giờ Việt Nam. Lịch chỉ đọc từ luật thời gian của máy chủ; mỗi ngày làm mới lúc 00:00." });
  const now = serverNow(), body: PNode[] = [];
  if (status === "error") body.push(h("div", "cal-msg cal-err", { kids: [h("span", "", { text: "Không tải được lịch (mất kết nối hoặc máy chủ chưa trả lời)." }), h("button", "cal-retry", { text: "Thử lại", attrs: { type: "button" } })] }));
  if (!data) { if (status === "loading") body.push(h("div", "cal-skel", { attrs: { "aria-busy": "true", "aria-label": "Đang tải" }, kids: Array.from({ length: 7 }, () => h("span", "cal-skel-c")) })); }
  else {
    const d = data, today = todayIndex(now, d.weekStart), cols = byDay(d.items);
    const always = d.fixed.filter((x) => x.kind === "always"), resets = d.fixed.filter((x) => x.kind === "reset");
    body.push(h("div", "cal-fixed", { kids: [h("span", "cal-fixed-l", { text: "Luôn mở:" }), ...always.map((x) => { const g = fixedGoal(x, mapName); return h("span", "cal-chip", { kids: [
      h("span", "", { text: x.name, attrs: x.note ? { title: x.note } : {} }),
      g ? h("button", "cal-go cal-go-s", { text: "Đến", attrs: { type: "button", "data-map": g.map, "data-npc": g.npc ?? "", "data-mn": g.mapName, "aria-label": `Đến ${x.name} ở ${g.mapName}` } }) : null] }); })] }));
    body.push(h("div", "cal-wk", { kids: [
      h("button", "cal-nav", { text: "◀", attrs: { type: "button", "data-w": "-1", "aria-label": "Tuần trước", ...(week <= -1 ? { disabled: "" } : {}) } }),
      h("span", "cal-wk-l", { text: `${dayDate(d.weekStart, 0)} – ${dayDate(d.weekStart, 6)}${week === 0 ? " · tuần này" : week < 0 ? " · tuần trước" : " · tuần sau"}` }),
      h("button", "cal-nav", { text: "▶", attrs: { type: "button", "data-w": "1", "aria-label": "Tuần sau", ...(week >= 1 ? { disabled: "" } : {}) } }),
      h("span", "cal-resets", { text: resets.map((r) => `${r.name}: ${r.at ?? "00:00"}${r.weekly ? " thứ Hai" : ""}`).join(" · ") }),
    ] }));
    if (!d.items.length) body.push(h("div", "cal-msg", { text: "Tuần này chưa có khung giờ." }));
    else body.push(h("div", "cal-grid", { kids: cols.map((c, i) => h("div", `cal-col${today === i ? " cal-today" : ""}`, { kids: [
      h("div", "cal-dh", { kids: [h("span", "cal-dn", { text: DAY_LABELS[i] }), h("span", "cal-dd", { text: dayDate(d.weekStart, i) }), today === i ? h("span", "cal-now", { text: "Hôm nay" }) : null] }),
      ...(c.length ? c.map((it) => slotNode(it, slotState(it, now))) : [h("span", "cal-empty", { text: "—" })]),
    ] })) }));
    const pick = d.items.find((it) => slotKey(it) === sel);
    if (pick) {
      const st = slotState(pick, now);
      body.push(h("div", "cal-detail", { kids: [
        h("span", "cal-d-t", { text: pick.name }), h("span", "cal-d-s", { text: `${pick.mapName} · ${slotRange(pick)}${pick.boss ? ` · Boss: ${pick.boss}` : ""}` }),
        pick.note ? h("span", "cal-d-s", { text: pick.note }) : null,
        h("button", "cal-go", { text: "Đến", attrs: { type: "button", "data-map": pick.map, "data-mn": pick.mapName, "aria-label": `Đến ${pick.mapName}`, title: `Đi tới ${pick.mapName} (tự đi bằng cờ, không dịch chuyển)` } }),
        st === "live" || st === "soon" ? h("span", "cal-cd", { attrs: { "data-s": String(pick.s), "data-e": String(pick.e), "data-live": st === "live" ? "1" : "" } }) : null,
      ] }));
    }
  }
  const wrap = mount(h("div", "cal-wrap", { kids: body }));
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
}
