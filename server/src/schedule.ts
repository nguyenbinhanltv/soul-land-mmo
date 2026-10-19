// Lịch tà hóa thú vương (mục 5.4, 6; bước BĐ5): chỉ đếm giờ theo giờ Việt Nam (BOSS_TZ) và phát qua presence của Colyseus.
// Sinh boss, máu, chiêu và thưởng vẫn nằm trong MapRoom: mọi phòng nghe kênh "boss"; phòng của đúng bản đồ sinh thú vương,
// mọi phòng (mọi bản đồ) báo cho người chơi của mình. Chạy nhiều tiến trình thì presence phải là RedisPresence và chỉ một tiến
// trình chạy lịch này (chưa làm: hiện chạy một tiến trình).
import type { Presence } from "colyseus";
import { MAPS, KING, kingNext, vnHHMM } from "../../shared/data.ts";

/** Kênh presence của lịch boss và kênh thông báo toàn server (mục 6). */
export const BOSS_TOPIC = "boss";
export const ANNOUNCE_TOPIC = "announce";
/**
 * Tin trên kênh "boss": `warn` báo trước (còn `in` giây nữa thì xuất hiện), `spawn` xuất hiện (`life` giây trước khi rút đi).
 * `slot`: thời điểm (ms UTC) của khung giờ, để một phòng không sinh hai lần cho cùng khung. `test`: do hook kiểm thử gọi.
 */
export interface BossEvent { mapId: string; king: string; phase: "warn" | "spawn"; slot: number; in: number; life: number; test?: boolean; }

/** Phát một sự kiện boss cho mọi phòng (lịch và hook test dùng chung). */
export function publishBoss(presence: Presence, ev: BossEvent) { presence.publish(BOSS_TOPIC, ev); }

/** Mọi bản đồ có thú vương (MAPS.king). */
const kingMaps = () => Object.values(MAPS).filter((m) => m.king);

/**
 * Bật lịch: mỗi giây xem khung giờ kế tiếp (kingNext); tới mốc trước KING.warnSecs giây thì phát `warn`, tới giờ thì phát `spawn` cho
 * mọi bản đồ có thú vương. Server bật giữa khung giờ thì không phát lại `spawn`: phòng tự sinh khi mở ra (kingActive trong onCreate).
 */
export function startSchedule(presence: Presence) {
  let warned = 0, spawned = 0;
  const tick = () => {
    const now = Date.now(), slot = kingNext(now), left = (slot - now) / 1000;
    if (left <= KING.warnSecs && warned !== slot) {
      warned = slot;
      for (const m of kingMaps()) publishBoss(presence, { mapId: m.id, king: m.king!, phase: "warn", slot, in: Math.round(left), life: KING.lifeSecs });
      console.log(`⏰ Báo trước tà hóa thú vương lúc ${vnHHMM(slot)} (giờ Việt Nam).`);
    }
    // kingNext trả khung sau `now`: khung vừa tới giờ là khung đã báo trước (warned) mà nay không còn là khung kế tiếp.
    if (warned && warned !== slot && spawned !== warned && now >= warned) {
      spawned = warned;
      for (const m of kingMaps()) publishBoss(presence, { mapId: m.id, king: m.king!, phase: "spawn", slot: warned, in: 0, life: KING.lifeSecs });
      console.log(`⏰ Tà hóa thú vương xuất hiện (${vnHHMM(warned)} giờ Việt Nam).`);
    }
  };
  const timer = setInterval(tick, 1000);
  tick();
  return () => clearInterval(timer);
}
