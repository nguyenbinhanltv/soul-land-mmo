// Lịch tà hóa thú vương (mục 5.4, 6; bước BĐ5) và boss thế giới (BĐ6e): chỉ đếm giờ theo giờ Việt Nam (BOSS_TZ) và phát qua presence của Colyseus.
// Sinh boss, máu, chiêu và thưởng vẫn nằm trong MapRoom: mọi phòng nghe kênh "boss"; phòng của đúng bản đồ sinh thú vương,
// mọi phòng (mọi bản đồ) báo cho người chơi của mình. Chạy nhiều tiến trình thì presence phải là RedisPresence và chỉ một tiến
// trình chạy lịch này (chưa làm: hiện chạy một tiến trình).
import type { Presence } from "colyseus";
import { MAPS, KING, kingNext, vnHHMM, vnAt, WORLD, worldNext, worldBossOn, worldMaps } from "../../shared/data.ts";

/**
 * Đồng hồ của lịch boss (thú vương, boss thế giới) và ngày nhận thưởng. Không bật GAME_TEST: luôn là đồng hồ thật. Bật GAME_TEST=1
 * (bot kiểm thử) thì lượt bot không được phụ thuộc giờ thật (chạy trúng 20:00 / 21:00 / 22:00 thì khung thật chen vào bài thử thú vương /
 * boss thế giới), nên đọc biến môi trường BOSS_CLOCK: chưa đặt = đứng yên ở BOSS_CLOCK_TEST giờ Việt Nam của ngày bật server (không khung
 * nào đang diễn ra hay sắp tới, lịch không phát, ngày nhận thưởng không qua 00:00; bot gọi khung bằng hook `king`); "HH:MM" = chạy từ
 * HH:MM giờ Việt Nam lúc bật server (thử lịch thật, vd 19:54); "real" = đồng hồ thật.
 */
const BOSS_CLOCK_TEST = "12:00";
const CLOCK_START = Date.now();
const clockEnv = process.env.GAME_TEST === "1" ? (process.env.BOSS_CLOCK ?? "").trim() : "real";
const clockHHMM = /^([01]?\d|2[0-3]):[0-5]\d$/.test(clockEnv) ? clockEnv : null;
if (clockEnv && clockEnv !== "real" && !clockHHMM) console.warn(`⚠ BOSS_CLOCK="${clockEnv}" không hợp lệ (cần HH:MM hoặc real): lịch boss đứng yên ở ${BOSS_CLOCK_TEST}.`);
/** Mốc giờ lịch lúc bật server (ms); null = đồng hồ thật. */
const CLOCK_ANCHOR = clockEnv === "real" ? null : vnAt(CLOCK_START, clockHHMM ?? BOSS_CLOCK_TEST);
/**
 * Lệch của đồng hồ lịch boss so với đồng hồ thật lúc `now` (ms): mốc trên lịch − lệch = giờ thật để so với Date.now() (hạn suất, đếm
 * ngược). Chạy từ HH:MM thì lệch cố định, nên mọi phòng đổi cùng một khung ra cùng một `slot`.
 */
export const bossOffset = (now = Date.now()) => CLOCK_ANCHOR === null ? 0 : clockHHMM ? CLOCK_ANCHOR - CLOCK_START : CLOCK_ANCHOR - now;
/** Giờ hiện tại của lịch boss (ms UTC): đồng hồ thật, trừ khi GAME_TEST đặt lại (BOSS_CLOCK). */
export const bossNow = (now = Date.now()) => now + bossOffset(now);
/** Mô tả đồng hồ lịch boss cho log khởi động và hook test. */
export const bossClockMode = () => CLOCK_ANCHOR === null ? "real" : clockHHMM ? `from ${clockHHMM}` : `frozen ${BOSS_CLOCK_TEST}`;

/** Kênh presence của lịch boss và kênh thông báo toàn server (mục 6). */
export const BOSS_TOPIC = "boss";
export const ANNOUNCE_TOPIC = "announce";
/**
 * Tin trên kênh "boss": `warn` báo trước (còn `in` giây nữa thì xuất hiện), `spawn` xuất hiện (`life` giây trước khi rút đi).
 * `slot`: thời điểm (ms UTC) của khung giờ, để một phòng không sinh hai lần cho cùng khung. `test`: do hook kiểm thử gọi.
 * Boss thế giới (BĐ6e) đi cùng kênh: `mapId` là bản đồ có MapDef.world (Lõi Tinh Đấu), `king` là boss của ngày (worldBossOn).
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
  // Mọi mốc trong hai hàm dưới tính trên đồng hồ lịch (bossNow); `slot` phát đi đổi về giờ thật (trừ bossOffset) để phòng so với Date.now().
  if (CLOCK_ANCHOR !== null) console.log(`⏰ GAME_TEST: lịch boss theo đồng hồ riêng (${bossClockMode()}, BOSS_CLOCK), không theo giờ thật.`);
  let warned = 0, spawned = 0;
  const tick = () => {
    const real = Date.now(), off = bossOffset(real), now = real + off, slot = kingNext(now), left = (slot - now) / 1000;
    if (left <= KING.warnSecs && warned !== slot) {
      warned = slot;
      for (const m of kingMaps()) publishBoss(presence, { mapId: m.id, king: m.king!, phase: "warn", slot: slot - off, in: Math.round(left), life: KING.lifeSecs });
      console.log(`⏰ Báo trước tà hóa thú vương lúc ${vnHHMM(slot)} (giờ Việt Nam).`);
    }
    // kingNext trả khung sau `now`: khung vừa tới giờ là khung đã báo trước (warned) mà nay không còn là khung kế tiếp.
    if (warned && warned !== slot && spawned !== warned && now >= warned) {
      spawned = warned;
      for (const m of kingMaps()) publishBoss(presence, { mapId: m.id, king: m.king!, phase: "spawn", slot: warned - off, in: 0, life: KING.lifeSecs });
      console.log(`⏰ Tà hóa thú vương xuất hiện (${vnHHMM(warned)} giờ Việt Nam).`);
    }
  };
  // Boss thế giới (BĐ6e): 1 khung mỗi ngày (worldNext, WORLD_TIME), cùng cách báo trước / xuất hiện, boss luân phiên theo ngày.
  let wWarned = 0, wSpawned = 0;
  const worldTick = () => {
    const real = Date.now(), off = bossOffset(real), now = real + off, slot = worldNext(now), left = (slot - now) / 1000;
    if (left <= WORLD.warnSecs && wWarned !== slot) {
      wWarned = slot;
      for (const m of worldMaps()) publishBoss(presence, { mapId: m.id, king: worldBossOn(m.id, slot)!, phase: "warn", slot: slot - off, in: Math.round(left), life: WORLD.lifeSecs });
      console.log(`⏰ Báo trước boss thế giới lúc ${vnHHMM(slot)} (giờ Việt Nam).`);
    }
    if (wWarned && wWarned !== slot && wSpawned !== wWarned && now >= wWarned) {
      wSpawned = wWarned;
      for (const m of worldMaps()) publishBoss(presence, { mapId: m.id, king: worldBossOn(m.id, wWarned)!, phase: "spawn", slot: wWarned - off, in: 0, life: WORLD.lifeSecs });
      console.log(`⏰ Boss thế giới xuất hiện (${vnHHMM(wWarned)} giờ Việt Nam).`);
    }
  };
  const timer = setInterval(() => { tick(); worldTick(); }, 1000);
  worldTick();
  tick();
  return () => clearInterval(timer);
}
