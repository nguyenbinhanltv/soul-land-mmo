// Thành Tựu (GAME_DESIGN.md mục 5.23, docs/design/thanh-tuu.md, bước P3): tin `achv {op: "get" | "claim", id?}`, bộ đếm sự kiện (`achvCount`) và chấm đỏ. Mọi phép tính ở đây;
// MapRoom chỉ chuyển tiếp. Chỉ số suy từ trạng thái server đã nạp (cấp, số võ hồn, sao, chuỗi nhiệm vụ xong), từ `arena_ratings` (trận thắng) và từ bộ đếm `achv_state`.
// Client chỉ gửi `op` và `id`; điều kiện được kiểm lại lúc nhận, quà + Hồn Tệ + đánh dấu "đã nhận" ghi một transaction (`store.achvClaim`).
import { ACHV_COUNTERS, ARENA, ARENA_SHARDS, MSG_GROUP, QUESTS, achvDef, achvReached, achvReady, formatHonTe, itemDef, questStatus, shardCode, type AchvCounter, type AchvDef, type AchvStats } from "../../../shared/data.ts";
import { store, type AchvCounters } from "../db.ts";
import { takeToken } from "../ratelimit.ts";
import { bagFits } from "./welfare.ts";
import { type MapRoom, type PData } from "./MapRoom.ts";
import { CLAIM_BUSY, claimHeld, strIn } from "./common.ts";

/** Chỉ số của người chơi lúc này: phần suy từ RAM đã nạp cộng trận thắng đấu trường (đọc DB) và bộ đếm `counters`. */
export function achvStats(d: PData, counters: AchvCounters, arenaWins: number): AchvStats {
  const quests = [d.quest, ...d.chains].filter((q) => QUESTS.some((c) => c.id === q.chain) && questStatus(q) === "done").length;
  return {
    level: d.owned.reduce((a, v) => Math.max(a, v.level), 0), owned: d.owned.length, stars: d.owned.reduce((a, v) => Math.max(a, v.stars), 0), quests, arenaWins,
    ...Object.fromEntries(ACHV_COUNTERS.map((k) => [k, counters[k] ?? 0])) as Record<AchvCounter, number>,
  };
}

/** Quà của một thành tựu: vật phẩm theo `reward.items` cộng mảnh võ hồn SR / SSR (loại bốc ngẫu nhiên trong ARENA_SHARDS, như Sổ Điểm Danh). */
export function achvGives(def: AchvDef) {
  const r = def.reward, gives = (r.items ?? []).map((x) => ({ ...x }));
  if (r.shards) gives.push({ code: shardCode(ARENA_SHARDS[Math.floor(Math.random() * ARENA_SHARDS.length)]), qty: r.shards });
  return { honTe: r.honTe ?? 0, gives };
}

/** Đọc DB (một dòng + trận thắng) rồi tính chỉ số và trạng thái; không ghi. */
async function load(d: PData) {
  const [row, arena] = await Promise.all([store.achvGet(d.accountId), store.getArena(d.accountId, ARENA.startElo)]);
  const stats = achvStats(d, row.counters, arena.wins);
  return { stats, claimed: row.claimed, ready: achvReady(stats, row.claimed) };
}

/** Gửi trạng thái Thành Tựu cho chính chủ; `extra`: `claimedNow` / `err` của lần vừa làm. Nhớ `ready` để chỉ báo khi đổi (`push`). Lỗi DB chỉ ghi log. */
export async function sendState(room: MapRoom, id: string, extra: Record<string, unknown> = {}) {
  const d = room.pdata.get(id); if (!d) return;
  try {
    const s = await load(d);
    d.achvReady = s.ready;
    room.clients.getById(id)?.send("achv", { ...s, ...extra });
  } catch (e) { console.error(`Không đọc được thành tựu tài khoản #${d.accountId}`, e); }
}

/** Gửi lại khi số thành tựu đã đạt mà chưa nhận đổi so với lần báo trước (chấm đỏ); chạy trong chuỗi lưu sau khi bộ đếm đã ghi. */
async function push(room: MapRoom, id: string, d: PData) {
  try {
    const s = await load(d);
    if (s.ready !== d.achvReady) { d.achvReady = s.ready; room.clients.getById(id)?.send("achv", s); }
  } catch (e) { console.error(`Không đọc được thành tựu tài khoản #${d.accountId}`, e); }
}

/**
 * Sự kiện server đã quyết định (hạ tinh anh / thú vương / boss thế giới, thắng Bí Cảnh): tăng bộ đếm `key` của người chơi `id` (cùng phòng với `room`).
 * Ghi qua chuỗi lưu của người đó; lỗi DB chỉ ghi log (mất một lần đếm, không có đường cộng bù). Không bao giờ nhận hộ.
 */
export function achvCount(room: MapRoom, id: string, key: AchvCounter) {
  const d = room.pdata.get(id); if (!d) return;
  room.chain(d, async () => {
    try { await store.achvBump(d.accountId, key, 1); } catch (e) { console.error(`Không ghi được bộ đếm thành tựu ${key} tài khoản #${d.accountId}`, e); return; }
    await push(room, id, d);
  });
}

/**
 * Tin client `achv {op, id?}`. `get`: gửi trạng thái (nhịp `ask`, gộp). `claim`: nhận thành tựu `id` (phải thuộc ACHV, đã đạt, chưa nhận). Quà vào túi ngay trong RAM
 * (`claimBusy` chặn bán / bỏ đồ), tới lượt trong chuỗi lưu mới kiểm lại điều kiện bằng chỉ số đọc lúc đó và ghi một transaction (túi + dòng `achv_state`);
 * "đã nhận" / "chưa đạt" / lỗi DB thì trả lại quà, không đổi gì. Túi không đủ chỗ cho cả phần quà thì từ chối, không đánh dấu đã nhận.
 */
export function achvAction(room: MapRoom, id: string, m: { op?: unknown; id?: unknown } | null | undefined) {
  const d = room.pdata.get(id), p = room.state.players.get(id); if (!d || !p || d.travelling) return;
  if (m?.op === "get") return void room.ask(id, "achv", () => void sendState(room, id));
  if (m?.op !== "claim") return;
  if (d.msgLimit && !takeToken(d.msgTok.trade, Date.now(), MSG_GROUP.trade.burst, MSG_GROUP.trade.rate)) return; // claim ghi DB: nhịp nhóm `trade`
  const def = achvDef(strIn(m.id)), deny = (err: string) => { room.log(id, err, "#ffb35c"); void sendState(room, id, { err }); };
  if (!def) return deny("Thành tựu không có.");
  if (claimHeld(d)) return deny(CLAIM_BUSY);
  d.claimBusy++;
  room.chain(d, async () => {
    const s = await load(d);
    if (s.claimed.includes(def.id)) return deny("Đã nhận thành tựu này rồi.");
    if (!achvReached(def, s.stats)) return deny("Chưa đạt điều kiện thành tựu này.");
    const { honTe, gives } = achvGives(def);
    if (!bagFits(d, gives)) return deny("Túi không đủ chỗ cho phần thưởng: bỏ hoặc bán bớt đồ rồi thử lại.");
    room.addCoin(d, honTe);
    for (const g of gives) room.addItem(d, g.code, g.qty);
    const takeBack = () => {
      d.honTe = Math.max(0, d.honTe - honTe); d.bagDirty = true;
      for (const g of gives) {
        let n = g.qty;
        for (const x of d.bag.filter((it) => it.code === g.code && it.vohonId === null).reverse()) { const k = Math.min(n, x.qty); room.takeItem(d, x, k); n -= k; if (!n) break; }
      }
    };
    let res: "ok" | "dup" | "low";
    // Kiểm lại bằng bộ đếm đọc TRONG transaction; chỉ số suy từ RAM / đấu trường lấy từ lần đọc ngay trên (cùng lượt trong chuỗi lưu).
    try { res = await store.achvClaim(d.accountId, def.id, (c) => achvReached(def, achvStats(d, c, s.stats.arenaWins)), room.bagSnapshot(d)); }
    catch (e) { takeBack(); deny("Không lưu được thành tựu, thử lại sau (không mất gì)."); throw e; }
    if (res !== "ok") { takeBack(); return deny(res === "dup" ? "Thành tựu vừa nhận ở nơi khác: đã cập nhật lại." : "Chưa đạt điều kiện thành tựu này."); }
    const names = [honTe ? formatHonTe(honTe) : "", ...gives.map((g) => `${g.qty} ${itemDef(g.code)?.name ?? g.code}`)].filter(Boolean).join(", ");
    room.log(id, `Thành tựu "${def.name}": ${names}.`, "#f2c84b");
    void sendState(room, id, { claimedNow: { id: def.id, honTe, items: gives } });
  }).then(() => {
    d.claimBusy--;
    if (room.pdata.get(id) === d) room.sendBag(id);
  });
}
