// Giữ chỗ khi vào phòng (matchmake HTTP, #235; miền D2, #702): bảng chỗ giữ `seats:<acc>` ở presence (`seatAdd` / `seatUsed` / `seatsPending`), bước kiểm chung của `static onAuth`
// (`seatAccount`), tài khoản vào được bản đồ không (`joinableMap`) và `mapId` client gửi (`mapIdIn`). Nguyên văn từ MapRoom (không đổi khóa presence / giới hạn / TTL). `static onAuth` và
// `_reserveSeat` ở lại MapRoom. Module lá: không import MapRoom.
import { randomUUID } from "node:crypto";
import { ServerError } from "colyseus";
import { MAPS, DEFAULT_MAP } from "../../../shared/data.ts";
import { presenceBackend } from "../presence.ts";
import { store } from "../db.ts";

/**
 * Colyseus giữ chỗ (tính vào maxClients, khóa kênh khi đủ) và joinOrCreate mở kênh mới ngay ở bước HTTP, trước khi client mở WebSocket
 * và onAuth của phòng chạy. Vì vậy `static onAuth` (chạy trước khi tìm / mở phòng và giữ chỗ) kiểm token và các điều kiện rẻ, rồi
 * trả SeatPass; `_reserveSeat` của phòng bỏ SeatPass đi để onAuth của phòng vẫn chạy lúc mở WebSocket (nạp DB sau waitOldSession).
 * `mapId`: bản đồ đã kiểm (null: sân đấu, không theo bản đồ); `key`: chỗ tạm trong bảng chỗ giữ (seats:<acc>, presence), ghi ngay khi kiểm xong để các request
 * chạy song song của cùng tài khoản không cùng lọt qua giới hạn; `_reserveSeat` đổi thành sessionId, không tới được thì tự hết hạn.
 */
export interface SeatPass { seatFor: number; mapId: string | null; key: string; }
/** Mỗi tài khoản giữ tối đa bấy nhiêu chỗ chưa dùng cùng lúc (client thật: một, thêm lần dự phòng joinOrCreate / tab khác). */
const SEAT_PENDING_MAX = 3;
/** Chỗ tạm (SeatPass.key) sống tối đa bấy nhiêu mili giây nếu matchmake không tới được bước giữ chỗ (bằng seatReservationTime mặc định). */
const SEAT_PASS_MS = 15_000;
/**
 * Chỗ đã giữ chưa dùng của mỗi tài khoản, ở presence (`seats:<acc>`: sessionId hoặc chỗ tạm SeatPass.key -> hết hạn ms) để tiến trình nhận HTTP
 * (static onAuth ghi chỗ tạm) và tiến trình giữ phòng (_reserveSeat / onAuth xóa) thấy cùng một bảng. onAuth của phòng xóa khi dùng.
 */
const seatsKey = (accountId: number) => `seats:${accountId}`;
const seatsOwner = () => `${presenceBackend.workerId}:seats`;
const SEAT_DOC_TTL_MS = 60_000;
type SeatDoc = Record<string, number>;
const liveSeats = (doc: SeatDoc | null, now: number) => Object.fromEntries(Object.entries(doc ?? {}).filter(([, until]) => until > now));
async function seatsPending(accountId: number) {
  return Object.keys(liveSeats(await presenceBackend.getJson<SeatDoc>(seatsKey(accountId)), Date.now())).length;
}
/** Ghi chỗ `key` (hết hạn `until`) nếu số chỗ đang giữ còn dưới `max` (không giới hạn khi bỏ `max`); kiểm và ghi trong một lần khóa. */
export async function seatAdd(accountId: number, key: string, until: number, max = Infinity) {
  let added = false;
  const ok = await presenceBackend.withLock<SeatDoc>(seatsKey(accountId), seatsOwner(), 5000, (old) => {
    const doc = liveSeats(old, Date.now());
    if (Object.keys(doc).length >= max) return doc;
    doc[key] = until; added = true; return doc;
  }, SEAT_DOC_TTL_MS);
  if (!ok) throw new Error("Không khóa được bảng chỗ giữ của tài khoản.");
  return added;
}
export async function seatUsed(accountId: number, sessionId: string) {
  const ok = await presenceBackend.withLock<SeatDoc>(seatsKey(accountId), seatsOwner(), 5000, (old) => {
    const doc = liveSeats(old, Date.now()); delete doc[sessionId]; return doc;
  }, SEAT_DOC_TTL_MS);
  if (!ok) throw new Error("Không khóa được bảng chỗ giữ của tài khoản.");
}
/**
 * Bước kiểm chung của `static onAuth` (MapRoom, ArenaRoom): token hợp lệ và tài khoản chưa giữ quá SEAT_PENDING_MAX chỗ. Lỗi bất ngờ
 * (DB…) trả câu chung: Colyseus gửi nguyên `message` của lỗi về client.
 */
export async function seatAccount(token: unknown, mapId: string | null, check?: (accountId: number) => Promise<unknown>): Promise<SeatPass> {
  const full = new ServerError(429, "Đang vào phòng ở nơi khác, hãy thử lại sau giây lát.");
  // Redis mất (#561): không nhận phiên mới (fail-closed); người chơi thử lại sau giây lát, server tự phục vụ lại khi Redis có lại.
  if (!presenceBackend.healthy()) throw new ServerError(503, "Máy chủ đang bảo trì kết nối, hãy thử lại sau giây lát.");
  try {
    const acc = await store.accountFromToken(token);
    if (!acc) throw new ServerError(401, "Phiên đăng nhập không hợp lệ.");
    if (await seatsPending(acc.accountId) >= SEAT_PENDING_MAX) throw full;
    await check?.(acc.accountId);
    // Kiểm lại và ghi chỗ tạm trong một lần khóa: request song song của cùng tài khoản không cùng lọt qua giới hạn.
    const key = `pass:${randomUUID()}`;
    if (!await seatAdd(acc.accountId, key, Date.now() + SEAT_PASS_MS, SEAT_PENDING_MAX)) throw full;
    return { seatFor: acc.accountId, mapId, key };
  } catch (e) {
    if (e instanceof ServerError) throw e;
    console.error("Lỗi kiểm tra trước khi giữ chỗ (matchmake):", e);
    throw new ServerError(500, "Máy chủ gặp lỗi, vui lòng thử lại sau.");
  }
}
/** Tài khoản vào được bản đồ `mapId` không: đã tạo nhân vật, đã thức tỉnh, đang đứng ở bản đồ đó (DB). */
export async function joinableMap(accountId: number, mapId: string) {
  const [ch, looks, loc] = await Promise.all([store.getCharacter(accountId), store.getLooks(accountId), store.getLocation(accountId)]);
  // Tạo nhân vật trước (tài khoản cũ cũng phải chọn một lần), rồi mới đến lễ thức tỉnh.
  if (!looks.chosen) throw new ServerError(403, "Chưa tạo nhân vật.");
  if (!ch) throw new ServerError(403, "Chưa thức tỉnh võ hồn.");
  // Chỉ vào được phòng của bản đồ đang lưu trong DB; sai thì client hỏi lại /api/me (trả mapId) rồi vào đúng phòng.
  if (loc.mapId !== mapId) throw new ServerError(409, `Sai bản đồ: hồn sư đang ở ${MAPS[loc.mapId].name}.`);
  return { ch, looks, loc };
}
/** mapId client gửi khi vào phòng bản đồ (thiếu thì bản đồ mặc định); không phải bản đồ thường thì null. */
export function mapIdIn(v: unknown) {
  const mapId = v ?? DEFAULT_MAP;
  return typeof mapId === "string" && Object.hasOwn(MAPS, mapId) && MAPS[mapId].kind !== "arena" ? mapId : null;
}
