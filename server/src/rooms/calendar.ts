// Miền Lịch Hoạt Động (GAME_DESIGN.md mục 5.20, #877): bản đọc của các luật thời gian đã có. Không tạo sự kiện, không ghi DB, không đổi hành vi
// server; giờ mở suy ra từ EVENT_DEFS (shared/data.ts) trên đồng hồ lịch boss (`bossNow`, nên bot đẩy được bằng `bossOffset` / `BOSS_CLOCK`).
// MapRoom chỉ chuyển tiếp `calendar {op: "get", week?}` (nhóm `read`, nhịp `ask`); ArenaRoom chặn tin này.
import { BOSSES, EVENT_DEFS, MAPS, eventSlots, weekStartVn, worldBossOn } from "../../../shared/data.ts";
import { bossNow } from "../schedule.ts";
import type { MapRoom } from "./MapRoom.ts";

/** Một khung giờ trong bảng tuần: `s` / `e` ms UTC (đồng hồ lịch), `d` thứ trong tuần (0 = thứ Hai), `boss` tên boss của khung (thú vương / boss theo ngày). */
export interface CalItem { id: string; name: string; kind: "slot"; s: number; e: number; d: number; map: string; mapName: string; boss: string; note?: string; }
/** Mốc đặt lại và mục luôn mở (không theo khung giờ). */
export interface CalFixed { id: string; name: string; kind: "reset" | "always"; at?: string; weekly?: boolean; npc?: string; note?: string; }
export interface CalendarMsg { now: number; weekStart: number; items: CalItem[]; fixed: CalFixed[]; }

const bossName = (id: string | null | undefined) => BOSSES.find((b) => b.id === id)?.name ?? "";
/** `week` từ client: số nguyên kẹp về -1 / 0 / 1, giá trị lạ thì 0 (tuần này). */
export const calWeek = (v: unknown) => typeof v === "number" && Number.isInteger(v) ? Math.max(-1, Math.min(1, v)) : 0;

const CACHE_MAX = 8;
const cache = new Map<number, Omit<CalendarMsg, "now">>();
/** Dữ liệu lịch của tuần bắt đầu ở `weekStart` (không đổi trong tuần nên cache theo mốc này; bản đồ nhỏ, bỏ mục cũ nhất khi đầy). */
function weekData(weekStart: number) {
  let r = cache.get(weekStart);
  if (!r) {
    const items: CalItem[] = [];
    for (const def of EVENT_DEFS) {
      if (def.kind !== "slot" || !def.map) continue;
      for (const { s, e, d } of eventSlots(def, weekStart)) {
        const boss = def.world ? bossName(worldBossOn(def.map, s)) : bossName(MAPS[def.map].king);
        items.push({ id: def.id, name: def.name, kind: "slot", s, e, d, map: def.map, mapName: MAPS[def.map].name, boss, ...(def.note ? { note: def.note } : {}) });
      }
    }
    items.sort((a, b) => a.s - b.s || a.id.localeCompare(b.id));
    const fixed: CalFixed[] = EVENT_DEFS.filter((x) => x.kind !== "slot").map((x) => ({ id: x.id, name: x.name, kind: x.kind as "reset" | "always",
      ...(x.kind === "reset" ? { at: "00:00", ...(x.weekly ? { weekly: true } : {}) } : {}), ...(x.npc ? { npc: x.npc } : {}), ...(x.note ? { note: x.note } : {}) }));
    r = { weekStart, items, fixed };
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
    cache.set(weekStart, r);
  }
  return r;
}
/** Lịch tuần `week` (-1 / 0 / 1) so với tuần chứa `ms` (đồng hồ lịch). */
export const calendarOf = (ms: number, week: unknown): CalendarMsg => ({ now: ms, ...weekData(weekStartVn(ms, calWeek(week))) });

/** `calendar {op: "get", week?}`: gửi lịch tuần cho chính người xin theo nhịp `ask` (xin dồn thì gộp). Chỉ đọc, không ghi gì. */
export function calendarAction(room: MapRoom, id: string, m: { op?: unknown; week?: unknown } | null | undefined) {
  if (m?.op !== "get") return;
  const w = calWeek(m.week);
  room.ask(id, `calendar:${w}`, () => room.clients.getById(id)?.send("calendar", calendarOf(bossNow() + room.dayShift * 86400000, w)));
}
