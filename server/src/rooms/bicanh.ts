// Bí Cảnh (GAME_DESIGN.md mục 5.22, docs/design/bi-canh.md, bước P2): lượt theo ngày làm mới 05:00 giờ Việt Nam và mua thêm lượt. Mọi phép tính nằm ở đây; MapRoom chỉ chuyển tiếp
// `bicanh {op: "get" | "enter" | "buy", id, pay?}`. Giờ do server quyết (`bossNow()` + dayShift, khóa ngày `bicanhDay`): client không gửi giờ / ngày, chỉ gửi mã phụ bản (kiểm theo
// BICANH.scenes). Lượt đã vào và lượt đã mua nằm ở `boss_claims` (kind `bicanhRunKind` / `bicanhBuyKind`), không cần bảng mới; phí mua và túi ghi MỘT transaction (`store.claimBoss`
// với trần `buyMax` kiểm ngay trong câu ghi), lỗi thì hoàn lại. P3: `enter` trừ lượt nguyên tử (claimBoss, trần = lượt miễn phí + đã mua) rồi mở phòng riêng `BiCanhRoom` bằng vé giữ chỗ
// (`Ticket`, dùng một lần); lỗi hệ thống (không mở được phòng, phòng đóng khi chưa chốt) thì hoàn lượt bằng `store.releaseBoss`. Thưởng quyển tính và ghi ở BiCanhRoom.ts.
import { matchMaker } from "colyseus";
import { randomUUID } from "node:crypto";
import { BICANH, MSG_GROUP, bicanhBuyKind, bicanhDay, bicanhResetIn, bicanhRunKind, bicanhRunPrice, bicanhRunTomes, bicanhScene, bicanhTomeKind, formatHonTe, type BicanhScene } from "../../../shared/data.ts";
import { store } from "../db.ts";
import { bossNow } from "../schedule.ts";
import { takeToken } from "../ratelimit.ts";
import { arenaBusyOne } from "./arena.ts";
import { arenaQueued } from "./arenaQueue.ts";
import { type MapRoom, type PData } from "./MapRoom.ts";
import { CLAIM_BUSY, claimHeld } from "./common.ts";

const DAY_MS = 86400000;
/** Đồng hồ của Bí Cảnh: đồng hồ lịch boss (bot đẩy bằng `BOSS_CLOCK`) cộng lệch ngày của hook test `day`, như `room.today()`. */
export const nowOf = (room: MapRoom) => bossNow() + room.dayShift * DAY_MS;

/**
 * Vé giữ chỗ vào một phòng Bí Cảnh (một người, một lần): tài khoản, phụ bản, ngày Bí Cảnh đã trừ lượt, phòng đã mở. `joined`: người chơi đã vào phòng; `settled`: lượt đã chốt (thưởng đã ghi hoặc đã hoàn),
 * nên thưởng / hoàn chỉ xảy ra một lần cho mỗi vé. Bộ nhớ của tiến trình mở phòng (như `arenaMatches`); số vé còn sống = số phòng đồng thời (BICANH.maxRooms).
 */
export interface Ticket { id: string; accountId: number; scene: BicanhScene; day: string; roomId: string; joined: boolean; settled: boolean }
export const bicanhTickets = new Map<string, Ticket>();
/** Ngày Bí Cảnh lớn nhất tài khoản đã vào ở tiến trình này: đồng hồ máy chủ bị lùi (ngày nhỏ hơn) thì từ chối `enter`. */
const lastEnterDay = new Map<number, string>();

/** Hoàn một lượt đã trừ cho vé (lỗi hệ thống, không phải lỗi người chơi), không điều kiện; lỗi DB chỉ ghi log (lượt mất, cần GM bù). */
export async function releaseRun(t: Ticket, why: string) {
  try { await store.releaseBoss(t.accountId, t.day, bicanhRunKind(t.scene.id), 1); console.warn(`[bí cảnh] hoàn 1 lượt ${t.scene.id} cho tài khoản #${t.accountId} (${why}).`); }
  catch (e) { console.error(`[bí cảnh] KHÔNG hoàn được lượt ${t.scene.id} của tài khoản #${t.accountId} (${why})`, e); }
}
/** Như releaseRun nhưng chỉ khi vé chưa chốt, và chốt vé (một lần cho mỗi vé: không hoàn hai lần, không hoàn sau khi đã thưởng). */
export async function refundRun(t: Ticket, why: string) {
  if (t.settled) return;
  t.settled = true;
  await releaseRun(t, why);
}

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
 * mỗi ngày Bí Cảnh; chỉ chạy khi `pay === true` (client đã xác nhận giá). `enter`: vào phòng (enterRun). Mã phụ bản lạ bị từ chối. Giữ chỗ ngay trong RAM (`claimBusy` chặn bán / bỏ đồ), tới lượt
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
  if (m.op === "enter") return enterRun(room, id, d, scene, deny);
  if (claimHeld(d)) return deny(CLAIM_BUSY);
  const pay = m.pay === true;
  d.claimBusy++;
  room.chain(d, async () => {
    const day = bicanhDay(nowOf(room)), [bought, tomeGot] = await Promise.all([store.bossClaims(d.accountId, day, bicanhBuyKind(scene.id)), store.bossClaims(d.accountId, day, bicanhTomeKind)]);
    // Thưởng duy nhất là quyển và quyển đã chạm trần ngày: lượt mua thêm không còn thưởng gì (P6), không thu phí.
    if (tomeGot >= BICANH.tomeDailyCap) return deny(`Hôm nay đã nhận đủ ${BICANH.tomeDailyCap}/${BICANH.tomeDailyCap} Hồn Kinh Quyển: mua thêm lượt ${scene.name} cũng không có thưởng. Làm mới lúc ${String(BICANH.resetHour).padStart(2, "0")}:00 giờ Việt Nam.`);
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

/**
 * `bicanh {op: "enter", id}` (P3): điều kiện vào (ngoài giao chiến, không gục / hấp thụ / đi cổng, không xếp hàng đấu trường, không tác vụ ghi DB chờ, chưa có phòng Bí Cảnh nào, còn chỗ phòng,
 * túi đủ chỗ cho quyển thưởng) kiểm TRƯỚC khi trừ lượt; trừ lượt nguyên tử bằng claimBoss (trần = lượt miễn phí + số đã mua đọc từ DB trong chuỗi lưu), rồi mở phòng riêng bằng vé và
 * đóng băng người chơi như đi cổng (`bicanh {k: "found", roomId}`, khuôn `arena`). Không mở được phòng thì hoàn lượt. Giữ chỗ trong RAM (`claimBusy`, `arenaBusy`, vé) tới khi xong.
 */
function enterRun(room: MapRoom, id: string, d: PData, scene: BicanhScene, deny: (err: string) => void) {
  const p = room.state.players.get(id), c = room.clients.getById(id); if (!p || !c) return;
  const busy = arenaBusyOne(room, p, d) || (arenaQueued(d.accountId) || d.arenaBusy ? "Đang xếp hàng Đại Đấu Hồn Trường." : "");
  if (busy) return deny(`${busy} Chưa vào ${scene.name} được.`);
  if (claimHeld(d)) return deny(CLAIM_BUSY);
  if ([...bicanhTickets.values()].some((t) => t.accountId === d.accountId)) return deny("Đang có một phòng Bí Cảnh của bạn: hoàn thành hoặc chờ đóng phòng.");
  if (bicanhTickets.size >= BICANH.maxRooms) return deny("Bí Cảnh đang đông, thử lại sau giây lát (lượt chưa bị trừ).");
  const t: Ticket = { id: randomUUID(), accountId: d.accountId, scene, day: "", roomId: "", joined: false, settled: false };
  bicanhTickets.set(t.id, t); d.claimBusy++; d.arenaBusy = true;
  let claimed = false;
  const fail = async (err: string, e?: unknown) => {
    bicanhTickets.delete(t.id);
    if (claimed) await refundRun(t, "không mở được phòng");
    deny(err); if (e) console.error(`[bí cảnh] vào phòng lỗi (tài khoản #${d.accountId})`, e);
  };
  room.chain(d, async () => {
    try {
      const now = nowOf(room), day = bicanhDay(now), last = lastEnterDay.get(d.accountId);
      if (last !== undefined && day < last) { console.warn(`[bí cảnh] đồng hồ lùi: tài khoản #${d.accountId} đã vào ngày ${last}, nay ${day}: từ chối enter.`); return fail("Đồng hồ máy chủ bị lùi, tạm thời chưa vào Bí Cảnh được."); }
      const [bought, tomeGot] = await Promise.all([store.bossClaims(d.accountId, day, bicanhBuyKind(scene.id)), store.bossClaims(d.accountId, day, bicanhTomeKind)]);
      const need = Math.min(bicanhRunTomes(scene), Math.max(0, BICANH.tomeDailyCap - tomeGot));
      if (need > 0 && !room.bagFits(d, [{ code: BICANH.tome, qty: need }])) return fail("Túi không đủ chỗ nhận Hồn Kinh Quyển: dọn túi rồi vào lại (lượt chưa bị trừ).");
      const n = await store.claimBoss(d.accountId, day, bicanhRunKind(scene.id), scene.runs + bought, room.bagSnapshot(d), 1);
      if (n === null) return fail(`Hôm nay đã hết lượt ${scene.name}. Làm mới lúc ${String(BICANH.resetHour).padStart(2, "0")}:00 giờ Việt Nam.`);
      claimed = true; t.day = day;
      if (lastEnterDay.size >= 5000) lastEnterDay.clear(); // không để Map lớn dần theo số tài khoản (mất dấu thì chỉ bỏ lần kiểm lùi đồng hồ)
      lastEnterDay.set(d.accountId, day);
      const r = await matchMaker.createRoom("bicanh", { ticket: t.id });
      t.roomId = r.roomId;
      // Trong lúc mở phòng người chơi có thể đã rời: phòng tự đóng sau BICANH.joinSecs (chưa ai vào = hoàn lượt, BiCanhRoom.tick), không đóng băng ai.
      const p2 = room.state.players.get(id), c2 = room.clients.getById(id);
      if (room.pdata.get(id) !== d || !p2 || !c2 || d.travelling) return;
      room.freeze(id); room.portalHint(id, p2, d); d.arenaGone = true;
      c2.send("bicanh", { k: "found", roomId: r.roomId, id: scene.id, name: scene.name, waves: scene.waves.length, secs: BICANH.joinSecs });
      room.clock.setTimeout(() => { if (d.arenaGone && room.clients.getById(id)) c2.leave(4006); }, BICANH.joinSecs * 1000);
    } catch (e) { await fail("Không mở được phòng Bí Cảnh, thử lại sau (lượt không bị trừ).", e); }
  }).then(() => { d.claimBusy--; d.arenaBusy = false; });
}
