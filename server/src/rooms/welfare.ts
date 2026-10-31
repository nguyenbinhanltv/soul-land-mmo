// Phúc Lợi: Sổ Điểm Danh 21 ngày (GAME_DESIGN.md mục 5.21, docs/design/phuc-loi.md, bước P3). Mọi phép tính nằm ở đây; MapRoom chỉ chuyển tiếp
// `welfare {op: "get" | "sign" | "makeup", day?, pay?}`. Giờ do server quyết (`bossNow()` + dayShift, ngày theo vnDayNum): client không gửi giờ / ngày, chỉ gửi
// chỉ số ô; quà, phí và túi ghi cùng một transaction (`store.checkinClaim`, như đổi mảnh ở Thương hội / thưởng tuần tông), lỗi thì hoàn lại.
import { ARENA_SHARDS, CHECKIN, MSG_GROUP, checkinDay, checkinFee, checkinOpen, formatHonTe, itemDef, shardCode, vnAt, vnDayNum } from "../../../shared/data.ts";
import { store, type CheckinRow } from "../db.ts";
import { bossNow } from "../schedule.ts";
import { takeToken } from "../ratelimit.ts";
import { bagUsed } from "./items.ts";
import { type MapRoom, type PData } from "./MapRoom.ts";
import { CLAIM_BUSY, claimHeld, intIn } from "./common.ts";

const DAY_MS = 86400000;
/** Đồng hồ của Phúc Lợi: đồng hồ lịch boss (bot đẩy bằng `BOSS_CLOCK`) cộng lệch ngày của hook test `day`, như `room.today()`. */
const nowOf = (room: MapRoom) => bossNow() + room.dayShift * DAY_MS;

/** Một phần quà đã chọn loại cụ thể (mảnh võ hồn đã bốc ngẫu nhiên trong ARENA_SHARDS). */
interface Give { code: string; qty: number }
/** Quà ô `i`: vật phẩm theo `CHECKIN.rewards` cộng mảnh võ hồn SR / SSR (loại bốc ngẫu nhiên như thưởng tuần tông). */
export function checkinGives(i: number): { honTe: number; gives: Give[] } {
  const r = CHECKIN.rewards[i], gives: Give[] = (r.items ?? []).map((x) => ({ ...x }));
  if (r.shards) gives.push({ code: shardCode(ARENA_SHARDS[Math.floor(Math.random() * ARENA_SHARDS.length)]), qty: r.shards });
  return { honTe: r.honTe ?? 0, gives };
}

/** Túi có đủ chỗ cho CẢ danh sách quà không (mỗi mã tính phần còn trống trong chồng cũ rồi số ô mới cần; các mã khác nhau không dùng chung ô). */
export function bagFits(d: PData, gives: Give[]) {
  let freeSlots = Math.max(0, d.bagSlots - bagUsed(d.bag));
  for (const g of gives) {
    const def = itemDef(g.code); if (!def) return false;
    const part = d.bag.reduce((a, it) => a + (it.code === g.code && it.vohonId === null && !it.locked ? Math.max(0, def.stack - it.qty) : 0), 0);
    const slots = Math.ceil(Math.max(0, g.qty - part) / def.stack);
    if (slots > freeSlots) return false;
    freeSlots -= slots;
  }
  return true;
}

/** Tin `welfare` gửi client từ dòng DB (chỉ tính, không ghi): `day` -1 khi chưa có chu kỳ đang chạy; `fee` phí ký bù kế tiếp (0 = miễn phí, null = hết lượt). */
export function welfareView(row: CheckinRow | null, now: number) {
  const today = vnDayNum(now), cur = row ? checkinDay(row.startDay, today) : null, running = !!row && !!cur && !cur.over;
  const used = running ? row!.makeupUsed : 0;
  return {
    cycle: row?.cycle ?? 0, day: running ? cur!.i : -1, mask: row?.mask ?? 0, now,
    endsAt: running ? vnAt(now, "00:00", row!.startDay + CHECKIN.days - today) : 0,
    makeupLeft: CHECKIN.makeupMax - used, free: Math.max(0, CHECKIN.makeupFree - used), fee: checkinFee(used),
  };
}

/** Gửi trạng thái Sổ Điểm Danh cho chính chủ (đọc DB một dòng). `extra`: `signed` / `err` của lần vừa làm. Lỗi DB chỉ ghi log. */
export async function sendState(room: MapRoom, id: string, extra: Record<string, unknown> = {}) {
  const d = room.pdata.get(id); if (!d) return;
  try {
    const row = await store.checkinGet(d.accountId);
    room.clients.getById(id)?.send("welfare", { ...welfareView(row, nowOf(room)), ...extra });
  } catch (e) { console.error(`Không đọc được sổ điểm danh tài khoản #${d.accountId}`, e); }
}

/** Qua 00:00 (tick, mỗi giây kiểm tra): người nào chưa được báo ngày mới thì gửi lại trạng thái (chấm đỏ "chưa điểm danh"); không tự nhận hộ. */
export function welfareDayPush(room: MapRoom, day: string) {
  for (const [id, d] of room.pdata) if (!d.travelling && d.welfareDay !== day) { d.welfareDay = day; void sendState(room, id); }
}

/**
 * Tin client `welfare {op, day?, pay?}`. `get`: gửi trạng thái (nhịp `ask`, gộp). `sign`: điểm danh ô hôm nay (mở chu kỳ mới nếu chưa có / đã hết).
 * `makeup`: ký bù ô `day` (0-based, đã qua, chưa ký, trong chu kỳ đang chạy); lượt ngoài mức miễn phí tốn Hồn Tệ và chỉ chạy khi `pay === true` (client đã xác nhận).
 * Quà vào túi ngay trong RAM (`claimBusy` chặn bán / bỏ đồ), tới lượt trong chuỗi lưu mới đọc dòng DB, kiểm lại mọi điều kiện rồi ghi một transaction
 * (túi + sổ); DB báo điều kiện không khớp hoặc lỗi thì trả lại quà / phí, không đổi sổ. Túi không đủ chỗ cho cả phần quà thì từ chối, không mất ô.
 */
export function welfareAction(room: MapRoom, id: string, m: { op?: unknown; day?: unknown; pay?: unknown } | null | undefined) {
  const d = room.pdata.get(id), p = room.state.players.get(id); if (!d || !p || d.travelling) return;
  if (m?.op === "get") return void room.ask(id, "welfare", () => void sendState(room, id));
  if (m?.op !== "sign" && m?.op !== "makeup") return;
  if (d.msgLimit && !takeToken(d.msgTok.trade, Date.now(), MSG_GROUP.trade.burst, MSG_GROUP.trade.rate)) return; // sign / makeup ghi DB: nhịp nhóm `trade`, hết token thì bỏ tin
  const makeup = m.op === "makeup", rawDay = intIn(m.day), pay = m.pay === true;
  const deny = (err: string) => { room.log(id, err, "#ffb35c"); void sendState(room, id, { err }); };
  if (claimHeld(d)) return deny(CLAIM_BUSY);
  if (makeup && !(rawDay >= 0 && rawDay < CHECKIN.days)) return deny("Ô ký bù không hợp lệ.");
  d.claimBusy++;
  room.chain(d, async () => {
    const now = nowOf(room), row = await store.checkinGet(d.accountId);
    if (row?.lastAt != null && now < row.lastAt) { console.warn(`[phúc lợi] đồng hồ lùi: tài khoản #${d.accountId} ký lúc ${row.lastAt}, nay ${now}: từ chối ${m.op}.`); return deny("Đồng hồ máy chủ bị lùi, tạm thời chưa điểm danh được."); }
    const today = vnDayNum(now), cur = row && !checkinDay(row.startDay, today).over ? row : null;
    let i: number, cycle: number, startDay: number, mask: number, used: number, fee = 0;
    if (!makeup) {
      if (!cur) { i = 0; cycle = (row?.cycle ?? 0) + 1; startDay = today; mask = 0; used = 0; } // chưa có / đã hết chu kỳ: ô 1 mở chu kỳ mới, người nghỉ lâu không bị trừ gì
      else {
        i = today - cur.startDay; ({ cycle, startDay, mask, makeupUsed: used } = cur);
        if (!checkinOpen(mask, i)) return deny("Hôm nay đã điểm danh rồi.");
      }
    } else {
      if (!cur) return deny("Chưa có chu kỳ đang chạy: hãy điểm danh hôm nay trước.");
      i = rawDay; ({ cycle, startDay, mask, makeupUsed: used } = cur);
      if (i >= today - cur.startDay) return deny("Chỉ ký bù được ô của ngày đã qua.");
      if (!checkinOpen(mask, i)) return deny("Ô này đã ký rồi.");
      const f = checkinFee(used);
      if (f === null) return deny(`Hết lượt ký bù chu kỳ này (${CHECKIN.makeupMax}/${CHECKIN.makeupMax}).`);
      if (f > 0 && !pay) return deny(`Ký bù ô này tốn ${formatHonTe(f)}: cần xác nhận.`);
      if (f > d.honTe) return deny(`Không đủ Hồn Tệ ký bù: cần ${formatHonTe(f)}, đang có ${formatHonTe(d.honTe)}.`);
      fee = f; used++;
    }
    const bit = 1 << i, { honTe, gives } = checkinGives(i);
    if (!bagFits(d, gives)) return deny("Túi không đủ chỗ cho phần quà: bỏ hoặc bán bớt đồ rồi thử lại.");
    d.honTe -= fee; room.addCoin(d, honTe);
    for (const g of gives) room.addItem(d, g.code, g.qty);
    const takeBack = () => {
      d.honTe = Math.max(0, d.honTe + fee - honTe); d.bagDirty = true; // hoàn theo hiệu: Hồn Tệ kiếm được trong lúc chờ DB không bị ghi đè
      for (const g of gives) {
        let n = g.qty;
        for (const x of d.bag.filter((it) => it.code === g.code && it.vohonId === null).reverse()) { const k = Math.min(n, x.qty); room.takeItem(d, x, k); n -= k; if (!n) break; }
      }
    };
    let ver: number | null;
    try { ver = await store.checkinClaim(d.accountId, { expect: row?.ver ?? null, cycle, startDay, mask: mask | bit, makeupUsed: used, lastAt: now, bit, makeupMax: CHECKIN.makeupMax, days: CHECKIN.days }, room.bagSnapshot(d)); }
    catch (e) { takeBack(); deny("Không lưu được lần điểm danh, thử lại sau (không mất Hồn Tệ, không mất ô)."); throw e; }
    if (ver === null) { takeBack(); return deny("Sổ điểm danh vừa đổi (ô đã ký ở nơi khác): đã cập nhật lại."); }
    const names = [honTe ? formatHonTe(honTe) : "", ...gives.map((g) => `${g.qty} ${itemDef(g.code)?.name ?? g.code}`)].filter(Boolean).join(", ");
    room.log(id, `${makeup ? "Ký bù" : "Điểm danh"} ô ${i + 1}${CHECKIN.milestones.includes(i) ? " (mốc)" : ""}: ${names}${fee ? ` (phí ${formatHonTe(fee)})` : ""}.`, "#f2c84b");
    void sendState(room, id, { signed: { day: i, makeup, fee, honTe, items: gives } });
  }).then(() => {
    d.claimBusy--;
    if (room.pdata.get(id) === d) room.sendBag(id);
  });
}
