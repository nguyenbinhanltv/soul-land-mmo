// Danh Hiệu xếp hạng tuần (GAME_DESIGN.md mục 5.25, docs/design/danh-hieu.md, P5): chốt tuần đã kết thúc, mở danh hiệu top 1 / 3 / 10 mỗi bảng `RANK_BOARDS`.
// Chạy trên tiến trình giữ lease lịch (schedule.ts), nhưng KHÔNG dựa vào lease để chống cấp trùng: mỗi (tuần, bảng) ghi dấu `title_week_close` cùng transaction với các dòng
// `title_owned` (db.ts `titleCloseWeek`), nên khởi động lại hay hai pod cùng chốt vẫn chỉ cấp một lần. Hạn: hết khi qua tuần kế (`weekStartVn(now, 1)`).
// Chỉ chốt tuần VỪA kết thúc: server tắt qua cả tuần kế thì tuần đó bỏ (danh hiệu sẽ đã hết hạn).
import { RANK_BOARDS, TITLE_RANK_TIERS, tongWeek, tongWeekDay, weekStartVn } from "../../shared/data.ts";
import { store } from "./db.ts";

/** Chốt tuần vừa kết thúc cho mọi bảng chưa chốt. Trả số danh hiệu đã cấp (0 nếu đã chốt hết). Lỗi DB ném lên (nơi gọi ghi log, lần sau thử lại). */
export async function closeTitleWeek(now = Date.now()): Promise<number> {
  const weekDay = tongWeekDay(tongWeek(now) - 7), expiresAt = weekStartVn(now, 1);
  let n = 0;
  for (const b of RANK_BOARDS) {
    const tiers = TITLE_RANK_TIERS.map((t) => ({ top: t.top, id: `rank_${b.code}_top${t.top}` }));
    const r = await store.titleCloseWeek(b.code, b.period, weekDay, tiers, expiresAt);
    if (r) { n += r.length; console.log(`🏅 Chốt tuần ${weekDay} bảng ${b.name}: cấp ${r.length} danh hiệu.`); }
  }
  return n;
}

/** Hẹn chốt: một lần lúc bật rồi mỗi `everyMs`; chỉ gọi ở tiến trình leader (kiểm bằng `isLeader`). Trả hàm dừng. */
export function startTitleWeek(isLeader: () => boolean, everyMs = 10 * 60_000) {
  let busy = false;
  const run = async () => {
    if (busy || !isLeader()) return; busy = true;
    try { await closeTitleWeek(); } catch (e) { console.error("Không chốt được danh hiệu tuần", e); } finally { busy = false; }
  };
  const t = setInterval(() => { void run(); }, everyMs); t.unref?.();
  setTimeout(() => { void run(); }, 15_000).unref?.();
  return () => clearInterval(t);
}
