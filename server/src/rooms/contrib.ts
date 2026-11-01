// Đóng góp sát thương / hỗ trợ lên tinh anh, thú vương, boss thế giới (GAME_DESIGN.md mục 5.4, 9.2; #119): cộng đóng góp (`credit`), đóng góp hỗ trợ (`supportCredit`), chuyển đóng góp sang phiên mới
// của cùng tài khoản (`rebindContrib`), người nhận hồn hoàn / thưởng (`topContrib`). Hàm nhận phòng (`room: MapRoom`) như stats.ts / fog.ts; nguyên văn từ MapRoom, không đổi hành vi.
// MapRoom chỉ chuyển tiếp (`combat.ts` gọi `room.credit`, `kill.ts` / `boss.ts` gọi `room.topContrib`, `join.ts` gọi `room.rebindContrib`, `MapRoom` gọi `supportCredit` như cũ); `contribOf` / `contributors`
// (chuyển tiếp 1 dòng sang calc.ts) ở lại MapRoom. `ArenaRoom` / `BiCanhRoom` không override hàm nào ở đây.
import type { MapRoom } from "./MapRoom.ts";
import type { EliteData } from "./types.ts";

/**
 * Đóng góp hỗ trợ (9.2, mục 5.4): `id` vừa hồi thực / tạo thêm khiên `v` cho người khác `qid`. Mỗi tinh anh / thú vương / boss thế
 * giới đang giao chiến mà `qid` đang là người tham gia thì cộng `v` vào `supBy` của `id`, và `id` thành người tham gia (mục 5.4 "Người
 * tham gia", điều kiện 2; máu tăng theo số người, giữ tỉ lệ). Hồi / khiên cho chính mình không bao giờ tới đây (chống tự buff lấy rương).
 */
export function supportCredit(room: MapRoom, id: string, qid: string, v: number) {
  const pd = room.pdata.get(id);
  if (id === qid || v <= 0 || !pd || pd.travelling) return;
  for (const [bid, bd] of room.bdata) {
    const e = bd.elite, b = room.state.beasts.get(bid);
    if (!e || !b || b.hp <= 0 || !e.engaged || !e.parts.has(qid)) continue;
    credit(room, e, "supBy", id, v);
    room.joinFight(e, id); room.eliteScale(b, e);
  }
}

/** Cộng `v` vào đóng góp `kind` của `pid` và ghi tài khoản của phiên (#119, `EliteData.acc`). */
export function credit(room: MapRoom, e: EliteData, kind: "dmgBy" | "supBy", pid: string, v: number) {
  e[kind].set(pid, (e[kind].get(pid) ?? 0) + v);
  const d = room.pdata.get(pid); if (d) e.acc.set(pid, d.accountId);
}

/**
 * Đóng góp theo tài khoản (mục 5.4, #119): tài khoản `acc` vừa vào phòng với phiên `sid`; mọi tinh anh / thú vương / boss thế giới
 * còn giữ đóng góp của phiên cũ cùng tài khoản (thoát rồi vào lại, đổi kênh rồi quay về khi boss chưa bỏ giao chiến) thì chuyển đóng
 * góp và lần nhắc hết lượt sang phiên mới. Không thành người tham gia lại: phải đánh / hỗ trợ lại như người vào giữa trận.
 */
export function rebindContrib(room: MapRoom, sid: string, acc: number) {
  for (const bd of room.bdata.values()) {
    const e = bd.elite; if (!e) continue;
    for (const [old, a] of [...e.acc]) {
      if (a !== acc || old === sid) continue;
      for (const m of [e.dmgBy, e.supBy]) { const v = m.get(old); m.delete(old); if (v !== undefined) m.set(sid, (m.get(sid) ?? 0) + v); }
      e.acc.delete(old); e.acc.set(sid, acc);
      if (e.king?.noted.delete(old)) e.king.noted.add(sid);
    }
  }
}

/**
 * Người đóng góp nhiều nhất còn trong phòng (không thì `by`): ưu tiên hồn hoàn của tinh anh / thú vương theo đóng góp tổng;
 * `dmgOnly` (hồn hoàn đỏ boss thế giới, 9.2) chỉ xếp theo sát thương. `ok` (#119): chỉ xét người thỏa (tinh anh: chưa bị khóa nhận
 * thưởng); không ai thỏa thì null.
 */
export function topContrib(room: MapRoom, e: EliteData, by: string, dmgOnly?: boolean): string;
export function topContrib(room: MapRoom, e: EliteData, by: string, dmgOnly: boolean, ok: (pid: string) => boolean): string | null;
export function topContrib(room: MapRoom, e: EliteData, by: string, dmgOnly = false, ok: (pid: string) => boolean = () => true) {
  const val = (pid: string) => (dmgOnly ? e.dmgBy.get(pid) ?? 0 : room.contribOf(e, pid));
  let owner: string | null = ok(by) ? by : null;
  for (const pid of dmgOnly ? e.dmgBy.keys() : room.contributors(e))
    if (room.state.players.has(pid) && ok(pid) && (owner === null || val(pid) > val(owner))) owner = pid;
  return owner;
}
