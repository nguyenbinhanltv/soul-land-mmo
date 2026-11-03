// Danh Hiệu (GAME_DESIGN.md mục 5.25, docs/design/danh-hieu.md, bước P1): `grantTitle` (CHỈ server gọi), tin `title {op: "get" | "equip", id?}`, trường công khai `PlayerState.titleId`.
// Chỉ trưng bày, một ô đeo. Mọi quyết định ở đây: client chỉ gửi `op` và `id`; `equip` kiểm sở hữu + hạn ngay trong câu ghi DB (`store.titleEquip`), hạn theo đồng hồ server.
// `titleId` rỗng = đang dùng danh hiệu cấp mặc định (client suy ra từ cấp, `titleText`). Danh hiệu đang đeo hết hạn thì tự về rỗng (bộ hẹn giờ + kiểm lại mỗi lần đọc).
import { MSG_GROUP, TITLE_DEFS, titleDef, titleExpiry, type TitleDef } from "../../../shared/data.ts";
import { store } from "../db.ts";
import { takeToken } from "../ratelimit.ts";
import { type MapRoom } from "./MapRoom.ts";
import type { PData } from "./types.ts";
import { strIn } from "./common.ts";

/** setTimeout chỉ nhận tới ~24,8 ngày; hạn xa hơn thì hẹn lại khi tới. */
const TIMER_MAX = 2 ** 31 - 1;

/** Mở danh hiệu cấp cho mọi mốc cấp đã đạt (cấp cao nhất các võ hồn của tài khoản); idempotent. Đọc danh sách MỘT lần và chỉ cấp mã còn thiếu (người đã đủ thì chỉ tốn một lần đọc). Trả các mã MỚI mở. */
async function syncLevelTitles(d: PData): Promise<string[]> {
  const best = d.owned.reduce((a, v) => Math.max(a, v.level), 0), fresh: string[] = [], have = new Set((await store.titleGet(d.accountId)).owned.map((o) => o.id));
  for (const t of TITLE_DEFS) if (t.source.kind === "level" && best >= t.source.level && !have.has(t.id) && await store.titleGrant(d.accountId, t.id, null) === "new") fresh.push(t.id);
  return fresh;
}

/** Đọc DB, đặt `PlayerState.titleId` (rỗng nếu không đeo / hết hạn), hẹn giờ hết hạn của danh hiệu đang đeo và trả trạng thái. Lỗi DB ném lên cho nơi gọi. */
async function refresh(room: MapRoom, id: string, d: PData) {
  const row = await store.titleGet(d.accountId), p = room.state.players.get(id);
  if (room.pdata.get(id) !== d) return row;
  if (p) p.titleId = row.equipped ?? "";
  if (d.titleTimer) { clearTimeout(d.titleTimer); d.titleTimer = null; }
  const exp = row.owned.find((o) => o.id === row.equipped)?.exp;
  if (exp != null) {
    d.titleTimer = setTimeout(() => { d.titleTimer = null; room.chain(d, async () => { try { await refresh(room, id, d); await sendState(room, id, d); } catch (e) { console.error(`Không làm mới danh hiệu tài khoản #${d.accountId}`, e); } }); }, Math.min(TIMER_MAX, Math.max(1000, exp - Date.now() + 500)));
    d.titleTimer.unref?.();
  }
  return row;
}

/** Gửi tin riêng `title` cho chính chủ: danh sách đã mở (còn hạn), mã đang đeo; `extra`: `fresh` (mã mới mở) / `err`. Không bao giờ vào state công khai. */
async function sendState(room: MapRoom, id: string, d: PData, extra: Record<string, unknown> = {}) {
  const row = await store.titleGet(d.accountId);
  room.clients.getById(id)?.send("title", { owned: row.owned, equipped: row.equipped, ...extra });
}

/** Lúc vào phòng: mở danh hiệu cấp đạt mốc, đặt `titleId` công khai, gửi danh sách riêng. Lỗi DB chỉ ghi log. */
export function titleJoin(room: MapRoom, id: string) {
  const d = room.pdata.get(id); if (!d) return;
  room.chain(d, async () => {
    try { const fresh = await syncLevelTitles(d); await refresh(room, id, d); await sendState(room, id, d, fresh.length ? { fresh } : {}); }
    catch (e) { console.error(`Không đọc được danh hiệu tài khoản #${d.accountId}`, e); }
  });
}

/** Rời phòng: dọn bộ hẹn giờ hết hạn. */
export function titleLeave(d: PData) { if (d.titleTimer) { clearTimeout(d.titleTimer); d.titleTimer = null; } }

/**
 * Mở danh hiệu `titleId` cho người chơi `id` (cùng phòng). CHỈ server gọi, từ sự kiện / trạng thái server đã quyết định (không có tin client nào cấp). Idempotent: đang có và còn hạn thì không đổi gì.
 * `eventEnd`: mốc hết hạn (ms) cho danh hiệu `ttl: "event"`. Mới mở thì gửi tin riêng `title` kèm `fresh` (banner mừng). Mã lạ / thiếu mốc hạn thì ném (lỗi lập trình); lỗi DB chỉ ghi log.
 */
export function grantTitle(room: MapRoom, id: string, titleId: string, eventEnd?: number) {
  const def: TitleDef | undefined = titleDef(titleId); if (!def) throw new Error(`Danh hiệu không có: ${titleId}`);
  const exp = titleExpiry(def, Date.now(), eventEnd);
  const d = room.pdata.get(id); if (!d) return;
  room.chain(d, async () => {
    try {
      const r = await store.titleGrant(d.accountId, def.id, exp);
      if (r === "new") await sendState(room, id, d, { fresh: [def.id] });
    } catch (e) { console.error(`Không mở được danh hiệu ${def.id} tài khoản #${d.accountId}`, e); }
  });
}

/**
 * Tin client `title {op, id?}`. `get`: gửi danh sách riêng (nhịp `ask`, gộp; cũng mở bù danh hiệu cấp). `equip`: đeo `id` (mã rỗng / thiếu = về mặc định theo cấp); phải đang sở hữu và còn hạn,
 * kiểm trong câu ghi DB; sai thì từ chối và gửi lại trạng thái thật. Ghi DB nên có nhịp nhóm `trade` và đi qua chuỗi lưu của người chơi.
 */
export function titleAction(room: MapRoom, id: string, m: { op?: unknown; id?: unknown } | null | undefined) {
  const d = room.pdata.get(id), p = room.state.players.get(id); if (!d || !p || d.travelling) return;
  if (m?.op === "get") return void room.ask(id, "title", () => titleJoin(room, id));
  if (m?.op !== "equip") return;
  if (d.msgLimit && !takeToken(d.msgTok.trade, Date.now(), MSG_GROUP.trade.burst, MSG_GROUP.trade.rate)) return;
  const raw = m.id == null || m.id === "" ? null : strIn(m.id), def = raw === null ? null : titleDef(raw);
  const deny = (err: string) => { room.log(id, err, "#ffb35c"); void sendState(room, id, d, { err }).catch((e) => console.error(`Không gửi được lý do từ chối danh hiệu tài khoản #${d.accountId}`, e)); };
  if (raw !== null && !def) return deny("Danh hiệu không có.");
  room.chain(d, async () => {
    try {
      if (def) await syncLevelTitles(d); // danh hiệu cấp đạt mốc mà chưa mở (lên cấp sau lúc vào phòng) vẫn đeo được
      const ok = await store.titleEquip(d.accountId, def?.id ?? null);
      await refresh(room, id, d);
      if (!ok) return deny("Chưa mở danh hiệu này hoặc đã hết hạn.");
      await sendState(room, id, d, { equippedNow: def?.id ?? null });
    } catch (e) { console.error(`Không đổi được danh hiệu tài khoản #${d.accountId}`, e); deny("Không lưu được danh hiệu, thử lại sau."); }
  });
}
