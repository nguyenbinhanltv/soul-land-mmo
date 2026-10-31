// Bộ nối chỉ chiếu dữ liệu công khai đã nhận; không tính điểm hay suy đoán hạng ngoài top.
import { ARENA, RANK_CD, RANK_PAGE_SIZE, RESONANCE_RANK_CD, RESONANCE_RANK_PAGE_SIZE, TONG_BOARD_CD, TONG_MON } from "../../shared/data.ts";
import type { ResonanceTopMsg } from "./net.ts";
import type { ArenaTopMsg } from "./hudArena.ts";
import type { TongBoardMsg } from "./hudNpc.ts";
import type { RankTopMsg } from "./rankScreen.ts";

export const legacyBoards = [
  { board: "cong_minh", group: "Người chơi", name: "Cộng minh", period: 0 },
  { board: "elo", group: "Đấu trường", name: "Elo", period: 0 },
  { board: "tong_tuan", group: "Tông môn", name: "Tông tuần", period: 0 },
];
export function rankSource(board: string | null) {
  if (board === "cong_minh") return { type: "resonance", cd: RESONANCE_RANK_CD, size: RESONANCE_RANK_PAGE_SIZE, op: "top" };
  if (board === "elo") return { type: "arena", cd: ARENA.topCd, size: RANK_PAGE_SIZE, op: "top" };
  if (board === "tong_tuan") return { type: "tong", cd: TONG_BOARD_CD, size: RANK_PAGE_SIZE, op: "board" };
  return { type: "rank", cd: RANK_CD, size: RANK_PAGE_SIZE, op: "top" };
}
export function resonanceRank(m: ResonanceTopMsg, receivedAt: number): RankTopMsg {
  return { board: "cong_minh", period: 0, page: m.page, pageSize: m.pageSize, total: m.total, hasNext: m.hasNext, asOf: receivedAt, received: true,
    rows: m.list.map((r, i) => ({ rank: (m.page - 1) * m.pageSize + i + 1, name: r.name, score: r.score, me: r.me })),
    me: m.me ? { rank: m.me.rank, score: m.me.score } : null, meHint: "Đạt ít nhất một mốc cộng minh để lên bảng." };
}
export function arenaRank(m: ArenaTopMsg, page: number, receivedAt: number): RankTopMsg {
  const start = (page - 1) * RANK_PAGE_SIZE;
  return { board: "elo", period: 0, page, pageSize: RANK_PAGE_SIZE, total: m.list.length, hasNext: start + RANK_PAGE_SIZE < m.list.length, asOf: receivedAt, received: true,
    rows: m.list.slice(start, start + RANK_PAGE_SIZE).map((r, i) => ({ rank: start + i + 1, name: r.name, score: r.elo, me: r.me })),
    me: m.me ? { rank: m.me.rank, score: m.me.elo } : null, note: "Chỉ phân trang trong danh sách top máy chủ đã gửi.", meHint: "Đấu một trận tại Đại Đấu Hồn Trường để có hạng Elo." };
}
export function tongRank(m: TongBoardMsg, page: number, receivedAt: number): RankTopMsg {
  // Thứ tự cá nhân chỉ có nghĩa trong từng tông, không gộp thành một bảng toàn server.
  const sections = Object.entries(m.cur.top).map(([tong, list]) => ({ tong, rows: list.map((r, i) => ({ rank: i + 1, name: r.name, score: r.points, tong })) }));
  const start = (page - 1) * RANK_PAGE_SIZE;
  return { board: "tong_tuan", period: m.week, page, pageSize: RANK_PAGE_SIZE, total: Math.max(0, ...sections.map((s) => s.rows.length)),
    hasNext: sections.some((s) => s.rows.length > start + RANK_PAGE_SIZE), rows: [], me: null, asOf: receivedAt, received: true,
    sections: sections.map((s) => ({ ...s, rows: s.rows.slice(start, start + RANK_PAGE_SIZE) })),
    summary: [...m.cur.tongs].sort((a, b) => b.avg - a.avg).map((r) => `${TONG_MON.find((t) => t.id === r.tong)?.name ?? r.tong}: ${r.avg.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} điểm trung bình · ${r.active} người hoạt động`),
    note: `Tuần ${m.week} · Top cá nhân trong từng tông; không có hạng cá nhân toàn server trong tin hiện hành.`,
    meText: `${m.me.toLocaleString("vi-VN")} điểm tông · chưa có dữ liệu hạng cá nhân`, meHint: `Cần ${m.min} điểm để là thành viên hoạt động.` };
}
