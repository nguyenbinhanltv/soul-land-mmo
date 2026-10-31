// Thư hệ thống (GAME_DESIGN.md mục 5.24, docs/design/thu.md, bước P3): tin `mail {op: "get" | "read" | "claim" | "claimAll" | "del", id?}`, chấm đỏ và `mailNotify`.
// Mọi phép tính ở đây; MapRoom chỉ chuyển tiếp. Thư một chiều: chỉ server tạo (store.mailSend, gọi từ nguồn: lệnh GM, sau này Phúc Lợi / Bí Cảnh); client chỉ gửi `op` và `id`.
// Nhận: kiểm hạn / chưa nhận / túi đủ chỗ, đính kèm vào túi ngay trong RAM (`claimBusy` chặn bán / bỏ đồ), tới lượt trong chuỗi lưu mới ghi một transaction
// (túi + dấu "đã nhận", `store.mailClaim`); "đã nhận / hết hạn" hoặc lỗi DB thì trả lại, không đổi gì.
import { MAIL, MAIL_KINDS, MSG_GROUP, formatHonTe, itemDef, type MailItem } from "../../../shared/data.ts";
import { mailHasAttach, store, type MailRow } from "../db.ts";
import { takeToken } from "../ratelimit.ts";
import { bagFits } from "./welfare.ts";
import { type MapRoom, type PData } from "./MapRoom.ts";
import { CLAIM_BUSY, claimHeld } from "./common.ts";

/** Thư gửi xuống client: thêm tên người gửi theo nguồn (`MAIL_KINDS`). */
const view = (m: MailRow) => ({ id: m.id, from: MAIL_KINDS[m.kind] ?? "Hệ thống", title: m.title, body: m.body, honTe: m.honTe, items: m.items, at: m.createdAt, exp: m.expiresAt, read: m.read, claimed: m.claimed });
/** Số thư chưa đọc, số thư còn đính kèm chưa nhận (chấm đỏ ở hub). */
export const mailCounts = (list: MailRow[]) => ({ unread: list.filter((m) => !m.read).length, pending: list.filter((m) => !m.claimed && mailHasAttach(m)).length });

/** Gửi hộp thư cho chính chủ; `extra`: `claimedNow` / `err` của lần vừa làm. Lỗi DB chỉ ghi log. */
export async function sendState(room: MapRoom, id: string, extra: Record<string, unknown> = {}) {
  const d = room.pdata.get(id); if (!d) return;
  try {
    const list = await store.mailList(d.accountId);
    room.clients.getById(id)?.send("mail", { list: list.map(view), ...mailCounts(list), ...extra });
  } catch (e) { console.error(`Không đọc được thư tài khoản #${d.accountId}`, e); }
}

/** Có thư mới tới người đang ở phòng `room` (gọi sau `store.mailSend` thành công): gửi lại hộp thư để hiện chấm đỏ. Người không ở phòng này thì thấy lúc vào phòng. */
export function mailNotify(room: MapRoom, id: string) { void sendState(room, id); }

/** Trả lại quà đã cộng vào RAM (lỗi ghi hoặc thư không còn nhận được). */
function takeBack(room: MapRoom, d: PData, honTe: number, gives: { code: string; qty: number }[]) {
  d.honTe = Math.max(0, d.honTe - honTe); d.bagDirty = true;
  for (const g of gives) {
    let n = g.qty;
    for (const x of d.bag.filter((it) => it.code === g.code && it.vohonId === null).reverse()) { const k = Math.min(n, x.qty); room.takeItem(d, x, k); n -= k; if (!n) break; }
  }
}

/** Nhận đính kèm một thư (trong chuỗi lưu). "full" = túi không đủ chỗ cho cả gói, "gone" = không còn nhận được (đã nhận / hết hạn / xóa). Lỗi DB thì trả lại quà rồi ném. */
async function claimOne(room: MapRoom, d: PData, m: MailRow): Promise<"ok" | "full" | "gone"> {
  const gives: MailItem[] = m.items.map((x) => ({ code: x.code, qty: x.qty }));
  if (!bagFits(d, gives)) return "full";
  room.addCoin(d, m.honTe);
  for (const g of gives) room.addItem(d, g.code, g.qty);
  let res: "ok" | "gone";
  try { res = await store.mailClaim(d.accountId, m.id, room.bagSnapshot(d)); } catch (e) { takeBack(room, d, m.honTe, gives); throw e; }
  if (res !== "ok") { takeBack(room, d, m.honTe, gives); return "gone"; }
  return "ok";
}

const text = (honTe: number, items: MailItem[]) => [honTe ? formatHonTe(honTe) : "", ...items.map((g) => `${g.qty} ${itemDef(g.code)?.name ?? g.code}`)].filter(Boolean).join(", ");

/**
 * Tin client `mail {op, id?}`. `get`: gửi hộp thư (nhịp `ask`, gộp). `read`: đánh dấu đã đọc. `claim`: nhận đính kèm thư `id`. `claimAll`: nhận lần lượt tối đa MAIL.claimAllMax thư
 * còn đính kèm, dừng ở thư đầu tiên túi không đủ chỗ. `del`: xóa thư đã nhận / không đính kèm. Mọi thư do `store` ràng theo tài khoản: `id` của người khác là "thư lạ".
 */
export function mailAction(room: MapRoom, id: string, m: { op?: unknown; id?: unknown } | null | undefined) {
  const d = room.pdata.get(id), p = room.state.players.get(id); if (!d || !p || d.travelling) return;
  const op = m?.op;
  if (op === "get") return void room.ask(id, "mail", () => void sendState(room, id));
  if (op !== "read" && op !== "claim" && op !== "claimAll" && op !== "del") return;
  if (d.msgLimit && !takeToken(d.msgTok.trade, Date.now(), MSG_GROUP.trade.burst, MSG_GROUP.trade.rate)) return; // ghi DB: nhịp nhóm `trade`
  const mid = m?.id, deny = (err: string) => { room.log(id, err, "#ffb35c"); void sendState(room, id, { err }); };
  if (op !== "claimAll" && (typeof mid !== "number" || !Number.isSafeInteger(mid) || mid < 1)) return deny("Thư không có.");
  if (op === "read" || op === "del") {
    void room.chain(d, async () => { // `chain` nuốt lỗi (chỉ ghi log), nên bắt ở đây để báo người chơi
      try {
        if (op === "read") await store.mailRead(d.accountId, mid as number);
        else if (!await store.mailDelete(d.accountId, mid as number)) return deny("Chưa xóa được thư này (còn đính kèm chưa nhận, hoặc không có).");
        void sendState(room, id);
      } catch (e) { console.error(`Lỗi thư tài khoản #${d.accountId}`, e); deny("Không lưu được, thử lại sau."); }
    });
    return;
  }
  if (claimHeld(d)) return deny(CLAIM_BUSY);
  d.claimBusy++;
  room.chain(d, async () => {
    try { await claimRun(d); } catch (e) { console.error(`Lỗi nhận thư tài khoản #${d.accountId}`, e); deny("Không lưu được thư, thử lại sau (không mất gì)."); }
  }).then(() => { d.claimBusy--; if (room.pdata.get(id) === d) room.sendBag(id); });
  async function claimRun(d: PData) {
    const list = await store.mailList(d.accountId); // đọc lại ngay lượt này: hạn / đã nhận tính theo DB, không tin lần xem trước
    const pick = op === "claim" ? list.filter((x) => x.id === mid) : list.filter((x) => !x.claimed && mailHasAttach(x)).reverse().slice(0, MAIL.claimAllMax); // nhận từ thư cũ nhất
    if (!pick.length) return deny(op === "claim" ? "Thư không còn." : "Không có thư nào để nhận.");
    let honTe = 0, items: MailItem[] = [], got = 0, err = "";
    for (const row of pick) {
      if (row.claimed) { err ||= "Đã nhận thư này rồi."; continue; }
      if (!mailHasAttach(row)) { err ||= "Thư này không có đính kèm."; continue; }
      const r = await claimOne(room, d, row);
      if (r === "full") { err = "Túi không đủ chỗ cho phần đính kèm: bỏ hoặc bán bớt đồ rồi thử lại."; break; }
      if (r === "gone") { err ||= "Thư vừa được nhận ở nơi khác hoặc đã hết hạn: đã cập nhật lại."; continue; }
      got++; honTe += row.honTe; items = [...items, ...row.items];
    }
    if (got) room.log(id, `Thư: nhận ${text(honTe, items)}.`, "#f2c84b");
    void sendState(room, id, { ...(got ? { claimedNow: { count: got, honTe, items } } : {}), ...(err ? { err } : {}) });
    if (err && !got) room.log(id, err, "#ffb35c");
  }
}
