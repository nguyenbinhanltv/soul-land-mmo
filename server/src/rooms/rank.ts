// Bảng Xếp Hạng nhiều hạng mục (GAME_DESIGN.md mục 5.19, docs/design/xep-hang.md, bước X2): ghi điểm Cấp / Sưu tầm / Sức mạnh vào `rank_scores` ở mốc ổn định
// và trả bảng cho client (tin `rank`). Hàm nhận phòng (`room: MapRoom`) như team.ts / tong.ts; MapRoom chỉ chuyển tiếp. Điểm do server suy ra từ
// võ hồn đã nạp / đã lưu (`rankScores`), client không gửi điểm; không đổi bất kỳ hành vi game nào.

import { RANK_BOARDS, RANK_CD, RANK_PAGE_MAX, RANK_PAGE_SIZE, RANK_SYNC_CD, TEAM_COMBAT_SECS, rankBoardOf, rankScores } from "../../../shared/data.ts";
import { store } from "../db.ts";
import { type MapRoom, type PData } from "./MapRoom.ts";
import { intIn } from "./common.ts";

/**
 * Ghi điểm xếp hạng của người chơi nếu đổi (chỉ gọi trong chuỗi lưu của người đó: `room.chain`, sau lần ghi DB thành công, lúc vào phòng).
 * Chỉ ở mốc ổn định: không giữa trận (`d.fight`), cách nhau tối thiểu RANK_SYNC_CD giây; `final` (rời phòng / vào phòng) không chờ nhịp
 * và không xét giao chiến. Lỗi DB chỉ ghi log (giữ dấu vết cũ để lần sau ghi lại), không làm hỏng lần lưu đang chạy.
 */
export async function rankSync(room: MapRoom, id: string, d: PData, final = false): Promise<void> {
  if (!room.state.players.get(id) || d.gmReset) return;
  if (!final && d.fight < TEAM_COMBAT_SECS) return;
  room.syncCh(id);
  const rows = rankScores(d.owned, d.team, room.teamPowerOf(d)), sig = JSON.stringify(rows);
  if (sig === d.rankSig) return;
  const now = Date.now();
  if (!final && now - d.rankAt < RANK_SYNC_CD * 1000) return;
  try {
    await store.rankPut(d.accountId, rows.map((r) => ({ board: r.board, period: 0, score: r.score, tie: r.tie, extra: r.lineup })));
    d.rankSig = sig; d.rankAt = now;
  } catch (e) { console.error(`Không ghi được điểm xếp hạng tài khoản #${d.accountId}`, e); }
}

/**
 * Tin client `rank {op, board, page, pageSize}`: `boards` trả danh mục hạng mục (tin riêng `rank {k:"boards"}`), `top` trả một trang (tin riêng `rankTop`,
 * kèm dòng của mình `me` và đội hình công khai của từng dòng). Nhịp RANK_CD giây mỗi người; hạng mục lạ bị từ chối bằng tin `log`.
 */
export function rankAction(room: MapRoom, id: string, m: { op?: unknown; board?: unknown; page?: unknown; pageSize?: unknown } | undefined) {
  const d = room.pdata.get(id); if (!d) return;
  const now = Date.now(); if (now - d.rankTopAt < RANK_CD * 1000) return;
  d.rankTopAt = now;
  if (m?.op === "boards") return void room.clients.getById(id)?.send("rank", { k: "boards", list: RANK_BOARDS.map((b) => ({ board: b.code, group: b.group, name: b.name, period: b.period })) });
  if (m?.op !== "top") return room.log(id, "Tin xếp hạng không hợp lệ.", "#ffb35c");
  const def = rankBoardOf(m.board); if (!def) return room.log(id, "Hạng mục xếp hạng không có.", "#ffb35c");
  const page = Math.max(1, intIn(m.page) || 1), pageSize = Math.max(1, Math.min(RANK_PAGE_MAX, intIn(m.pageSize) || RANK_PAGE_SIZE));
  Promise.all([store.rankTop(def.code, def.period, page, pageSize), store.rankMe(def.code, def.period, d.accountId)]).then(([t, me]) => {
    room.clients.getById(id)?.send("rankTop", {
      board: def.code, period: def.period, page: t.page, pageSize: t.pageSize, total: t.total, hasNext: t.hasNext, asOf: t.asOf,
      rows: t.rows.map((r) => ({ rank: r.rank, name: r.name, score: r.score, ...(r.tong ? { tong: r.tong } : {}), lineup: r.lineup, me: r.accountId === d.accountId })),
      me: me ? { rank: me.rank, score: me.score, at: me.at } : null,
    });
  }, (e) => console.error("Không đọc được bảng xếp hạng", e));
}
