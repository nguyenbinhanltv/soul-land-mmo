// Giá trị / hàm nhỏ dùng chung của các miền trong `rooms/`, tách khỏi MapRoom.ts (#702, gỡ vòng import): khóa chờ phần thưởng (`CLAIM_BUSY` / `claimHeld`),
// ép kiểu giá trị client gửi (`intIn` / `strIn`), id thực thể (`uid`), tài khoản của phiên (`accOf`), màu / chủ đề chat, đối tượng lệch giờ của hook test (`testShift`),
// bộ đếm lỗi lưu (`saveStats`). Nguyên văn từ MapRoom; module lá: KHÔNG import MapRoom (chỉ type của thư viện), để file miền không tạo vòng import runtime.
// Trạng thái mức tiến trình (`let nextId`, `testShift`, `saveStats`) chỉ có MỘT thể hiện ở đây; MapRoom và các miền import từ file này.
import type { Client } from "colyseus";
import { WORLD, KING, MSG_GROUP, MSG_HARD, type BossDef, type MsgGroup } from "../../../shared/data.ts";
import type { TokenBucket } from "../ratelimit.ts";
import type { KingData, WorldData } from "./MapRoom.ts"; // chỉ type: bị xóa lúc biên dịch, không tạo vòng import runtime

let nextId = 1;
export const uid = (p: string) => p + (nextId++).toString(36);
/**
 * Chat xuyên phòng (#188, mục 6 "Xã hội"): tổ đội, tin riêng, thế giới, tông môn phát lên chủ đề presence này; mọi phòng nghe và gửi
 * tin `chat` cho người chơi của mình có trong `to`, hoặc thuộc tông `tong` (#198); không có cả hai: mọi người (kênh thế giới). Không
 * lưu lịch sử.
 */
export const CHAT_TOPIC = "chatx";
/** Màu dòng log của bạn bè / chặn (#195). */
export const FRIEND_COL = "#9fd8ff";
/** Tài khoản của phiên (client.auth; cả người xem trận, #278). */
export const accOf = (c: Client) => (c.auth as { accountId?: number } | undefined)?.accountId;
/** Lý do từ chối bán / bỏ / hấp thụ / nộp đồ trong lúc phần thưởng boss đang chờ DB xác nhận lượt (claimBusy, #165). */
export const CLAIM_BUSY = "Đang lưu phần thưởng boss / mảnh vừa đổi, đợi một chút."; // claimBusy: rương, thưởng boss, đổi mảnh ở Thương hội (#282)
/** Đang chờ DB ghi phần thưởng boss (grantChest) hoặc hook test `claimhold` giữ: chặn mở rương, bán / bỏ / hấp thụ / nộp / sắp xếp / tự bán. */
export const claimHeld = (d: { claimBusy: number; testClaimHold: boolean }) => d.claimBusy > 0 || d.testClaimHold;
/** Phiên mới chờ phiên cũ lưu xong tối đa bấy nhiêu mili giây; quá thì từ chối vào phòng (không nạp dữ liệu cũ). */
export const HOLD_WAIT_MS = 8000;
/** Số nguyên client gửi; khác thì NaN (hàm nhận tự từ chối). */
export const intIn = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : NaN);
/** Chuỗi client gửi; khác thì "". */
export const strIn = (v: unknown) => (typeof v === "string" ? v : "");
/**
 * Số lần lưu bị lỗi từ lúc bật server: lần ghi trong chuỗi lưu (chain), và lỗi trong onLeave / onDispose (có thể ném trước khi tới lần
 * ghi cuối). index.ts so trước / sau khi tắt để biết lần lưu cuối có trót lọt (#270).
 */
export const saveStats = { failed: 0 };
/**
 * Hook test `daily {shift}` (`daily`): lệch ngày của khảo hạch hằng ngày cho cả tiến trình (MapRoom.dailyDay); `tweek {shift}` #197 (`tong`): lệch số ngày
 * của tuần tông (tongNow, tongWeek) cho cả tiến trình. Chỉ đổi khi GAME_TEST=1 (hook ở gm.ts, nên là đối tượng chung thay cho hai biến `let`).
 */
export const testShift = { daily: 0, tong: 0 };
/** Trạng thái boss thế giới lúc mới sinh / bỏ giao chiến: các cơ chế chờ `every` × WORLD.firstMech giây mới chạy lần đầu. */
export function newWorld(def: BossDef): WorldData {
  const m = def.world ?? {}, first = (e?: number) => (e ?? 0) * WORLD.firstMech;
  return { rage: false, slamT: WORLD.slamEvery, weakNext: 0, weak: null, weakT: 0, chargeT: first(m.charge?.every), armorT: first(m.armor?.every),
    miasmaT: first(m.miasma?.every), diveT: first(m.dive?.every), brk: 0, brkAt: new Map(), shield: 0, shieldT: 0, dive: 0, surf: null };
}
/** Bộ hằng số theo bậc của boss có lịch: thú vương KING, boss thế giới WORLD (người tham gia, thưởng, lượt mỗi ngày). */
export const bossK = (k: KingData | null | undefined) => (k?.world ? WORLD : KING);
/** Bộ đếm token đầy cho mọi nhóm tin của một kết nối (#734). */
export const newMsgBuckets = (): Record<MsgGroup | "hard", TokenBucket> => {
  const t = Date.now(), b = { hard: { n: MSG_HARD.burst, t } } as Record<MsgGroup | "hard", TokenBucket>;
  for (const g of Object.keys(MSG_GROUP) as MsgGroup[]) b[g] = { n: MSG_GROUP[g].burst, t };
  return b;
};
export const fusionKey = (accountId: number) => `fusion:${accountId}`;
export const worldChatKey = (accountId: number) => `world-chat:${accountId}`;
export const channelSwitchKey = (accountId: number) => `channel-switch:${accountId}`;
export const channelLeftKey = (accountId: number) => `channel-left:${accountId}`;
export const buybackKey = (accountId: number) => `buyback:${accountId}`;
