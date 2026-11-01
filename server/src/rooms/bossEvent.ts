// Sự kiện boss / lịch (GAME_DESIGN.md mục 5.4, 6 "Thông báo toàn server và lịch boss"; docs/tech/presence-redis.md; #702, miền E7): báo trước / xuất hiện thú vương qua presence (`onBossEvent`, khóa
// `king-warn:<mapId>`), tin `boss` gửi client (`bossMsg`, `sendBossJoin`), mục tiêu chung của tự săn (`autoBosses` / `autoBossOk`) và lượt nhận rương hôm nay (`claimsToday`). Hàm nhận phòng
// (`room: MapRoom`) như stats.ts / support.ts; nguyên văn từ MapRoom, không đổi khóa presence / kênh pub-sub / thứ tự phát / TTL. `kingWarns` (Map mức tiến trình) ở `procState.ts`. `tickDowns`
// và `today` ở lại MapRoom (`ArenaRoom` / `BiCanhRoom` override `tickDowns`; `today` nhiều miền gọi). `bossSub` (đăng ký / hủy `BOSS_TOPIC`) vẫn ở `setup` / `onDispose`.
import type { Client } from "colyseus";
import { beastName, bossIndex, BOSSES, MAPS, KING, WORLD } from "../../../shared/data.ts";
import { bg, presenceBackend } from "../presence.ts";
import type { BossEvent } from "../schedule.ts";
import type { BeastState } from "./schema.ts";
import type { MapRoom } from "./MapRoom.ts";
import type { PData } from "./types.ts";
import { eliteKey, eliteLockLeft, kingWarns } from "./procState.ts";

/**
 * Boss cho người vừa vào (BĐ5, #118): client xin bằng tin `boss` sau khi dựng cảnh (tin gửi ngay lúc onJoin tới trước khi client nghe
 * nên bị bỏ). Người vào giữa lúc chờ thì nhận đếm ngược còn lại (`join`: client không lặp log / banner); thú vương / boss thế giới
 * đang ở bản đồ này thì nhận thời gian trước khi rút đi, đồng hồ nổi giận, điểm yếu, chỗ nổi lên của Du Thủy và chiêu toàn sàn đang
 * báo trước (`t` giây còn lại, `warn` cả chiêu).
 */
export function sendBossJoin(room: MapRoom, client: Client) {
  const w = room.bossWarn;
  if (w && w.at > Date.now()) client.send("boss", { ...bossMsg(room, w, "warn", (w.at - Date.now()) / 1000), join: true });
  const bid = room.king?.bid, kb = bid ? room.state.beasts.get(bid) : undefined, bd = bid ? room.bdata.get(bid) : undefined, kd = bd?.elite?.king;
  // `here`: client chỉ đặt đồng hồ / điểm yếu / chỗ nổi lên của Du Thủy khi có cờ này (như tin "spawn" ở đúng bản đồ).
  if (kb && kd) client.send("boss", { k: "here", here: true, bid, name: beastName(kb.rank, kb.species), mapId: room.state.mapId, mapName: MAPS[room.state.mapId].name, life: kd.life,
    phase: kd.phase, title: kd.phase === 2 ? (kd.world ? "Nổi giận" : kd.def.phase2?.name) : "", ...room.worldInfo(kd) });
  // Chiêu toàn sàn đang báo trước (#118): người vừa vào cũng thấy vùng và vòng an toàn (thời gian còn lại) để kịp né.
  const kc = kb && kd?.world ? bd?.cast : undefined;
  if (kc?.def.floor) client.send("fx", { k: "tele", bid, name: kc.def.name, ...kc.teles[0], parts: kc.teles.slice(1), t: kc.t, warn: kc.def.warn, ...(kc.safe ? { safe: kc.safe } : {}) });
}

/** Tinh anh (theo ô tinh anh) và thú vương / boss thế giới đang sống của phòng: mục tiêu chung của tự săn (#218). */
export function autoBosses(room: MapRoom): [string, BeastState][] {
  const out: [string, BeastState][] = [];
  for (const bid of [...room.elites.map((s) => s.bid), room.king?.bid]) { const b = bid ? room.state.beasts.get(bid) : undefined; if (b && b.hp > 0) out.push([bid!, b]); }
  return out;
}

/**
 * Tài khoản của `d` còn nhận được thưởng của tinh anh / thú vương / boss thế giới `b` không (#218, mục 5.4): tinh anh chưa bị khóa
 * ELITE.lock; thú vương / boss thế giới còn lượt hôm nay và chưa nhận rương của khung giờ này ở kênh nào. Tự săn chỉ nhắm con còn nhận
 * được thưởng (người hết lượt vào đánh chỉ làm boss nhiều máu hơn cho người khác).
 */
export function autoBossOk(room: MapRoom, d: PData, b: BeastState) {
  if (b.rank === 1) return eliteLockLeft(eliteKey(room.state.mapId, b), d.accountId) <= 0;
  const world = b.rank === 3;
  return claimsToday(room, d, world) < (world ? WORLD : KING).daily && !room.king?.claimed.has(d.accountId);
}

/** Lượt nhận rương thú vương (hoặc boss thế giới khi `world`, BĐ6e) hôm nay của người chơi (sang ngày mới thì về 0). */
export function claimsToday(room: MapRoom, d: PData, world = false) {
  const c = world ? d.wclaims : d.claims;
  if (c.day !== room.today()) { c.day = room.today(); c.n = 0; }
  return c.n;
}

/** Tin "boss" gửi client cho một sự kiện lịch: tên, bản đồ, còn bao nhiêu giây, thú vương có ở bản đồ của phòng này không. */
export function bossMsg(room: MapRoom, ev: BossEvent, k: string, secs: number) {
  const bi = bossIndex(ev.king), m = MAPS[ev.mapId], rank = BOSSES[bi]?.rank ?? 2;
  return { k, name: beastName(rank, bi), mapId: ev.mapId, mapName: m?.name ?? ev.mapId, in: Math.max(0, Math.round(secs)), life: ev.life,
    here: ev.mapId === room.state.mapId, col: BOSSES[bi]?.aura, world: rank === 3 };
}

/**
 * Sự kiện lịch boss trên presence (schedule.ts hoặc hook test): mọi phòng báo cho người chơi của mình (đếm ngược / xuất hiện); phòng
 * của đúng bản đồ sinh thú vương khi `spawn` (mỗi khung giờ một lần, mỗi kênh một con).
 */
export function onBossEvent(room: MapRoom, ev: BossEvent) {
  if (!ev || !Object.hasOwn(MAPS, ev.mapId) || bossIndex(ev.king) < 0) return;
  if (ev.phase === "warn") {
    room.bossWarn = { ...ev, at: Date.now() + ev.in * 1000 };
    kingWarns.set(ev.mapId, room.bossWarn);
    bg(presenceBackend.putJson(`king-warn:${ev.mapId}`, room.bossWarn, (ev.in + ev.life + 60) * 1000), "presence");
    room.broadcast("boss", bossMsg(room, ev, "warn", ev.in));
  } else if (ev.phase === "spawn") {
    if (room.bossWarn?.mapId === ev.mapId) room.bossWarn = null;
    kingWarns.delete(ev.mapId);
    bg(presenceBackend.delete(`king-warn:${ev.mapId}`), "presence");
    room.broadcast("boss", bossMsg(room, ev, "spawn", 0));
    if (ev.mapId === room.state.mapId) void room.spawnKing(ev.slot, ev.life, ev.king).catch((e) => console.error("Lỗi sinh thú vương", e));
  }
}
