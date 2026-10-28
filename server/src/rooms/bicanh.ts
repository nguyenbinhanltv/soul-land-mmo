// Bí Cảnh (GAME_DESIGN.md mục 5.22, docs/design/bi-canh.md, bước P2): lượt theo ngày làm mới 05:00 giờ Việt Nam và mua thêm lượt. Mọi phép tính nằm ở đây; MapRoom chỉ chuyển tiếp
// `bicanh {op: "get" | "enter" | "buy", id, pay?}`. Giờ do server quyết (`bossNow()` + dayShift, khóa ngày `bicanhDay`): client không gửi giờ / ngày, chỉ gửi mã phụ bản (kiểm theo
// BICANH.scenes). Lượt đã vào và lượt đã mua nằm ở `boss_claims` (kind `bicanhRunKind` / `bicanhBuyKind`), không cần bảng mới; phí mua và túi ghi MỘT transaction (`store.claimBoss`
// với trần `buyMax` kiểm ngay trong câu ghi), lỗi thì hoàn lại. Chưa có phòng (P3): `enter` chỉ trả lời "chưa mở", không trừ lượt.
import { BICANH, MSG_GROUP, bicanhBuyKind, bicanhDay, bicanhResetIn, bicanhRunKind, bicanhRunPrice, bicanhScene, formatHonTe, type BicanhScene } from "../../../shared/data.ts";
import { store } from "../db.ts";
import { bossNow } from "../schedule.ts";
import { takeToken } from "../ratelimit.ts";
import { CLAIM_BUSY, claimHeld, type MapRoom } from "./MapRoom.ts";

const DAY_MS = 86400000;
/** Đồng hồ của Bí Cảnh: đồng hồ lịch boss (bot đẩy bằng `BOSS_CLOCK`) cộng lệch ngày của hook test `day`, như `room.today()`. */
export const nowOf = (room: MapRoom) => bossNow() + room.dayShift * DAY_MS;

/** Một dòng trạng thái phụ bản gửi client: `left` lượt còn lại, `max` tổng lượt hôm nay (miễn phí + đã mua), `bought` đã mua, `price` giá lượt mua kế tiếp (null = hết lượt mua). */
export interface RunView { id: string; name: string; left: number; max: number; bought: number; price: number | null }

/** Dòng trạng thái từ số lượt đã vào (`used`) và đã mua (`bought`), có kẹp `bought` ≤ buyMax như DB bảo đảm. Hàm thuần. */
export function runView(scene: BicanhScene, used: number, bought: number): RunView {
  const b = Math.max(0, Math.min(scene.buyMax, bought)), max = scene.runs + b;
  return { id: scene.id, name: scene.name, left: Math.max(0, max - used), max, bought: b, price: b < scene.buyMax ? bicanhRunPrice(scene, b) : null };
}

/** Đọc lượt các phụ bản của tài khoản trong ngày Bí Cảnh `day` (hai dòng `boss_claims` mỗi phụ bản). */
async function readRuns(accountId: number, day: string) {
  return Promise.all(BICANH.scenes.map(async (s) => runView(s, ...(await Promise.all([store.bossClaims(accountId, day, bicanhRunKind(s.id)), store.bossClaims(accountId, day, bicanhBuyKind(s.id))])) as [number, number])));
}

/** Gửi trạng thái Bí Cảnh cho chính chủ (đọc DB). `extra`: `err` của lần vừa làm. Lỗi DB chỉ ghi log. */
export async function sendState(room: MapRoom, id: string, extra: Record<string, unknown> = {}) {
  const d = room.pdata.get(id); if (!d) return;
  try {
    const now = nowOf(room), runs = await readRuns(d.accountId, bicanhDay(now));
    room.clients.getById(id)?.send("bicanh", { runs, resetIn: bicanhResetIn(now), ...extra });
  } catch (e) { console.error(`Không đọc được lượt Bí Cảnh tài khoản #${d.accountId}`, e); }
}

/** Qua 05:00 (tick, mỗi giây kiểm tra): người nào chưa được báo ngày Bí Cảnh mới thì gửi lại trạng thái (chấm đỏ "còn lượt"); không tự vào hộ. */
export function bicanhDayPush(room: MapRoom) {
  const day = bicanhDay(nowOf(room));
  for (const [id, d] of room.pdata) if (!d.travelling && d.bicanhDay !== day) { d.bicanhDay = day; void sendState(room, id); }
}

/**
 * Tin client `bicanh {op, id, pay?}`. `get`: gửi trạng thái (nhịp `ask`, gộp). `buy`: mua thêm một lượt của phụ bản `id` bằng Hồn Tệ lũy tiến (bicanhRunPrice), tối đa `buyMax` lượt
 * mỗi ngày Bí Cảnh; chỉ chạy khi `pay === true` (client đã xác nhận giá). `enter`: chưa mở (P3). Mã phụ bản lạ bị từ chối. Giữ chỗ ngay trong RAM (`claimBusy` chặn bán / bỏ đồ), tới lượt
 * trong chuỗi lưu mới đọc số lượt đã mua từ DB, kiểm lại, trừ Hồn Tệ rồi ghi túi + lượt mua trong một transaction; DB báo hết lượt mua hoặc lỗi thì trả lại Hồn Tệ.
 */
export function bicanhAction(room: MapRoom, id: string, m: { op?: unknown; id?: unknown; pay?: unknown } | null | undefined) {
  const d = room.pdata.get(id), p = room.state.players.get(id); if (!d || !p || d.travelling) return;
  if (m?.op === "get") return void room.ask(id, "bicanh", () => void sendState(room, id));
  if (m?.op !== "enter" && m?.op !== "buy") return;
  if (d.msgLimit && !takeToken(d.msgTok.trade, Date.now(), MSG_GROUP.trade.burst, MSG_GROUP.trade.rate)) return; // enter / buy ghi DB: nhịp nhóm `trade`, hết token thì bỏ tin
  const deny = (err: string) => { room.log(id, err, "#ffb35c"); void sendState(room, id, { err }); };
  const scene = bicanhScene(m.id);
  if (!scene) return deny("Phụ bản Bí Cảnh không hợp lệ.");
  if (m.op === "enter") return deny("Phòng Bí Cảnh chưa mở: sắp có.");
  if (claimHeld(d)) return deny(CLAIM_BUSY);
  const pay = m.pay === true;
  d.claimBusy++;
  room.chain(d, async () => {
    const day = bicanhDay(nowOf(room)), bought = await store.bossClaims(d.accountId, day, bicanhBuyKind(scene.id));
    if (bought >= scene.buyMax) return deny(`Hôm nay đã mua đủ ${scene.buyMax}/${scene.buyMax} lượt ${scene.name}. Làm mới lúc ${String(BICANH.resetHour).padStart(2, "0")}:00 giờ Việt Nam.`);
    const price = bicanhRunPrice(scene, bought);
    if (!pay) return deny(`Mua thêm 1 lượt ${scene.name} tốn ${formatHonTe(price)}: cần xác nhận.`);
    if (d.honTe < price) return deny(`Không đủ Hồn Tệ mua lượt: cần ${formatHonTe(price)}, đang có ${formatHonTe(d.honTe)}.`);
    d.honTe -= price; d.bagDirty = true;
    const takeBack = () => { d.honTe += price; d.bagDirty = true; };
    let n: number | null;
    try { n = await store.claimBoss(d.accountId, day, bicanhBuyKind(scene.id), scene.buyMax, room.bagSnapshot(d), 1); }
    catch (e) { takeBack(); deny("Không lưu được lần mua lượt, thử lại sau (không mất Hồn Tệ)."); throw e; }
    if (n === null) { takeBack(); return deny(`Hôm nay đã mua đủ ${scene.buyMax}/${scene.buyMax} lượt ${scene.name}.`); }
    room.log(id, `Mua thêm 1 lượt ${scene.name}: −${formatHonTe(price)} (còn ${formatHonTe(d.honTe)}), hôm nay đã mua ${n}/${scene.buyMax}.`, "#f2c84b");
    void sendState(room, id);
  }).then(() => {
    d.claimBusy--;
    if (room.pdata.get(id) === d) room.sendBag(id);
  });
}
