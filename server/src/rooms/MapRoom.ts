// Phòng của một bản đồ (mapId): toàn bộ logic game chạy ở đây (server-authoritative).
// Mỗi bản đồ có thể có nhiều phòng (kênh); mọi phòng dùng chung một lớp, khác nhau ở dữ liệu bản đồ.
// Client chỉ gửi ý định (hướng di chuyển, bấm đánh...), server quyết định kết quả.
import { Room, Client, ServerError, matchMaker, OnMessageException, type RoomException } from "colyseus";
import { randomUUID } from "node:crypto";
import { MapState, PlayerState, BeastState, DropState } from "./schema.ts";
import { TIERS, VOHON, xpNeed, atBottleneck, xpBlocked, MAX_LEVEL, calcStats, TICK_RATE, tierOfYears, vohonIndex,
  AWAKEN_GIFT, AWAKEN_CHOICES, TEAM_SIZE, SWITCH_CD, TEAM_COMBAT_SECS, REVIVE_SECS, RESPAWN_SECS, XP_SHARE_ACTIVE, XP_SHARE_BENCH,
  beastLevel, xpLevelScale, MAX_RINGS, parseTeam, BEASTS, beastIndex, MAPS, MAP_MOVED, DEFAULT_MAP, parseNewLooks, encodeLpc, dir4, type Looks,
  TRAVEL_CAST, BOAT_CAST, WAYPOINT_CAST, waypointFee, RED_BEAST_CHANCE, kingYears, TRAVEL_LEAVE_SECS, CHANNEL_MAX, CHANNEL_CD,
  TIEN_CO, TIEN_CO_MAX, TIEN_CO_IDLE_SECS, TIEN_CO_DECAY, energyGain, tienCoDmgMult, TILE, RALLY,
  itemDef, BAG_EXPAND, BAG_MAX_SLOTS, bagSlotsOf, BUYBACK_MAX, bagExpandCost, DAN_CD, STARTER_ITEMS, BEAST_COIN, formatHonTe, type ItemDef,
  MAX_YEARS, tierBand, rollYears, beastStats, formatYears, RING_ITEM, DROP_OWNER_SECS, DROP_TTL_SECS, PICKUP_RANGE,
  absorbSecs, absorbChance, SHARD_UNLOCK, SHARD_QTY, MAX_STARS, starCost, shardChance, shardCode, starSkillMult, starCdMult, starTienCoMult, starRing,
  BONE_ITEM, BONE_SLOTS, boneChance, boneName, parseBone, boneBonus, boneSlotIndex,
  CORE_ITEM, CORE_SETS, coreChance, rollCore, rollCoreStats, parseCore, coreName, coreSetIndex, coreSetName, coreResetFee, MAX_CORE_STARS, type CoreData,
  CORE_STAT_IDS, type CoreStat, EQUIP_ITEM, EQUIP_SLOTS, EQUIP_LUCK_MAX, EQUIP_MAX_ENHANCE, EQUIP_ROLL, parseEquip, equipStats, equipDefTotal, equipWeaponRoll, equipTemplate, equipSlotIndex, equipName, equipSlotDef, rollEquip, rollEquipDrop, rollEquipCharm, EQUIP_STONES, EQUIP_CHARM, equipEnhanceStep, equipEnhanceResult, EQUIP_TEMPLATES, EQUIP_TIERS, EQUIP_ESSENCE, EQUIP_SOUL, equipLuckStep, EQUIP_SALVAGE_MAX, equipSynthStep, equipSynthOutcome, equipSalvage, equipAutoSalvageable, type EquipData, type EquipDrop,
  CORE_SLOTS, CORE_SET_2, CORE_SET_4, CORE_FX_RULE, coreSlotOf, coreBonus, coreFx, coreSetCounts, isCcStatus, ATTACK_CD, ATTACK_REACH, atkRoll, type CoreFx,
  BONE_ACTIVE_SLOTS, boneSkillOf, bonePassive, type BonePassive, type PassiveBuff,
  BONE_MAX_ENHANCE, BONE_FEED_MAX, boneXp, boneEnhancePreview, boneSkillMult, boneEnhanceNeed, parseBoneSubs, boneAddSubs, BONE_ENHANCE_FEE, CORE_ENHANCE_FEE, enhanceFee, SHARD_BUY, shardBuyCost, ARENA_SHARDS,
  CORE_MAX_ENHANCE, CORE_FEED_MAX, coreXp, coreEnhanceNeed, coreEnhancePreview, coreUpgradeSubs, coreStatText,
  STATUS, STATUS_IDS, STATUS_TICK, CC_TIER_MULT, BEAST_REGEN, BEAST_AGGRO_R, BEAST_WANDER, BEAST_GAIT, BEAST_LEASH, RUN_MULT, statusBit, BUFF_IDS, buffBit, skillPower, buffPower, PCT_HP_CAP,
  PROJ_SPEED, SLOW_CAP, PHONG_LOI, skillsOf, TIEN_CO_RIENG, bondSum, BOND_KEYS, FUSION, FUSIONS, fusionIndex, fusionsOf,
  ringSkill, loadoutOf, parseLoadout, LOADOUT_SIZE, CHAN_THAN_RING, chanThanOf, chanThanStats, phoenixFieldR, CHAN_THAN_SKILL_SLOT, type ChanThanStat, type BondKey, type SkillDef, type StatusId, type StatusApply, type BuffId,
  beastSkillOf, teleHits, teleSafe, TELE_FIRST, PLAYER_STATUS, type BeastSkillDef, type Tele,
  teleZones, BOSSES, bossIndex, ELITE, ELITE_RAGE, bossHpMult, beastName, beastBuffBit, BEAST_BUFFS, type BeastBuffId,
  KING, KING_CHEST, BOSS_CLAIM_KING, kingActive, kingNext, kingShardPool, vnDay, chestCode, type BossDef, type FormDef,
  WORLD, WORLD_SLAM, WORLD_RING, WORLD_CHEST, BOSS_CLAIM_WORLD, worldActive, worldNext, worldBossOn, HE_IDS, type He,
  npcDef, NPC_RANGE, looksChangeCost, TONG_MON, TONG_MIN_LEVEL, TONG_SWITCH_DAYS, tongDef, tongWeek, shopOf, shopExpands, SHOP_MAX_QTY, sellPrice, type NpcRole,
  QUEST_STARTER, QUESTS, QUEST_AFTER, questChain, questStart, parseQuest, questStatus, questGoalHit, questRewardText, type QuestReward, type QuestProgress, type QuestEvent, type QuestGoal,
  DAILY, dailyIds, isDaily, fitBeast, TONG_DAILY, TONG_POINTS, TONG_WEEK_MIN, TONG_WEEK_REWARD, TONG_WEEK_KIND, TONG_TOP_N, TONG_BOARD_CD,
  tongTaskIds, tongWeekDay, tongTop,
  PARTY_XP_RANGE, partyXpShare, PARTY_BUFF_R, PARTY_BUFF_MULT, PARTY_BUFF_SKIP, SUPPORT_CONTRIB, COPY_R, COPY_WINDOW, BUFFS,
  RESONANCE, RESONANCE_RANK_PAGE_SIZE, RESONANCE_RANK_PAGE_MAX, RESONANCE_RANK_CD, resonanceProgress, resonanceLevels, resonanceBonus, resonanceText, type ResEffect,
  HERB_MAX, HERB_PCT, herbDef, herbChance, herbBonus, herbText, HERBS,
  ARENA, ARENA_HE_DMG, arenaTeamElo, SYNC_VIEW, RADAR, AUTO_DAILY_SECS, AUTO_STUCK, AUTO_MAX_PER_CELL, AUTO_MSG_RATE, AUTO_BONUS_MAX, parseAuto, autoLeft, autoHint, type AutoHint, autoTimeText, type AutoSettings, type AutoSummary,
  BEAST_ATK_CD, OFFLINE, offlineFight, offlineSplit, type OfflinePower,
  BEAST_DEF, defMult, beastMelee, PLAYER_STATUS_PVE, RESIST_AS, PLAYER_CHARM,
  AUTO_SELL_FREE, AUTO_SELL_BUYBACK, parseSell, autoSellable, type SellSettings } from "../../../shared/data.ts";
import { hpRegen, mpRegen } from "../../../shared/data.ts"; // hồi sinh lực / hồn lực (mục 4), regenPlayer
import { FOG, moveNudge } from "../../../shared/data.ts"; // sương mù khám phá (R8)
import { fogDims, fogEmpty, fogFill, fogReveal, fogValid, fogOn as fogMapOn } from "../../../shared/fog.ts";
import { ASK_CD, MSG_GROUP, MSG_HARD, MSG_FLOOD_CODE, type MsgGroup } from "../../../shared/data.ts"; // nhịp tin client xin lại dữ liệu riêng (#165)
import { WORLD_CHAT } from "../../../shared/data.ts"; // kênh thế giới (#188)
import { clampDir, MOVE_DEAD, PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { loadMap, mapFile, mapRoute, mapHops, mapLinks, allWaypoints, nearestTown, type GameMap, type Portal, type EliteSpot, type NpcSpot, type Zone } from "../map.ts";
import { BOSS_TOPIC, ANNOUNCE_TOPIC, publishBoss, bossOffset, bossNow, bossClockMode, type BossEvent } from "../schedule.ts";
import { store, Character, type AccountLooks, type Location, type Item, type Bag, type AutoRow, type SoldRow, type TongRow, type SocialRow } from "../db.ts";
import { chatCheck, chatText, chatReset, worldWait, worldMark, inviteCheck, inviteReset, rallyCheck, rallyReset, friendCheck, friendReset, friendNoteOk, takeToken, type TokenBucket, type ChatChannel } from "../ratelimit.ts";
import { isRooted, rootedReach, beastDefOf } from "./beastTraits.ts";
import { SpiderEggs } from "./eggs.ts";
import * as party from "../party.ts";
import { rallyPoint, type RallyMsg } from "../../../shared/rally.ts";
import { friends, FRIEND_TOPIC, type FriendNote, type FriendResult } from "../friends.ts";
import { watchGc, gcIn, cpuMs, clock } from "../perf.ts";
import { arenaLiveOpenList, arenaLiveHold, arenaLiveRelease, arenaWatchMax, setTestWatchMax } from "./arenaQueue.ts";
import { arenaEnqueue, arenaDequeue, arenaQueued, arenaQueueLocked, arenaQueueSlots, arenaReadActive, arenaReadElo, arenaReadCancel, arenaReadCancelled, arenaTestSlow, type ArenaTeamEntry } from "./arenaQueue.ts";
import { floorSafeZones, surfaceSpot, BOSS_BOX } from "./worldBoss.ts";
import { Interest } from "./interest.ts";
import { AutoHunter } from "./autoHunt.ts";
import { bagDiff, type BagSent } from "../../../shared/bagSync.ts";
import { Grounds } from "./ground.ts";
import { ItemLockBusy, itemLockKey, withItemLocks } from "../itemLock.ts";
import { PRESENCE_HEARTBEAT_MS, PRESENCE_TTL_MS, presenceBackend, accountLeaseKey, bg } from "../presence.ts";
import { ColdStacks } from "./cold.ts";
import { gmAllow, gmEnabled, isAdmin, parseGm, _gmSetAdmin, type GmCmd } from "../gm.ts"; // lệnh GM của admin (#518)
import { buildPreset } from "../testPreset.ts";
import { ringLimit, coreSubRolls, ARENA_MAP } from "../../../shared/data.ts";
import { Tide } from "./tide.ts";
import { LairSplit } from "./split.ts";
import { newItem, itemStacks, gearStats, gearLook, bagUsed, bumpItemClock, KIND_ORDER, ITEM_ORDER, type GearStats } from "./items.ts";
import { targetMsg, tickLock, setLock, manualAttack } from "./lock.ts";

export interface PData {
  /** Hồn thú đang khoá (M3 #750, rooms/lock.ts); "" = không khoá. */
  target: string;
  accountId: number;
  leaseOwner: string;
  leaseT: number;
  owned: Character[];   // mọi võ hồn sở hữu (chỉ gửi cho chính chủ)
  team: number[];       // đội hình: rowId võ hồn theo ô (TEAM_SIZE ô, 0 = trống); chỉ gửi cho chính chủ
  ch: Character;        // võ hồn đang ra trận, là một phần tử của owned và luôn nằm trong team
  ringYears: number[];  // niên hạn thật của từng hồn hoàn (số năm); p.rings chỉ là bậc để hiển thị
  input: { x: number; y: number }; dir: { x: number; y: number };
  walk: boolean;        // 11.1: input cuối có `w` (giữ Shift): đi bộ cả khi ngoài giao chiến
  atk: number; speed: number; atkCd: number; inv: number; lastHit: number; deadT: number;
  // Hấp thụ hồn hoàn trong túi (từ 3.2) vào võ hồn `rowId` (từ 3.3 chọn được võ hồn bất kỳ đang ở bình cảnh), vòng thứ `slot`.
  absorbing: { itemId: string; rowId: number; slot: number; years: number; t: number; dur: number; fail: number } | null;
  testRoll: number | null; // hook test `roll` (chỉ khi GAME_TEST=1): cố định số ngẫu nhiên 0..1 cho lần quyết định hấp thụ
  testShard: { r: number; i: number } | null; // hook test `shard`: cố định số ngẫu nhiên rơi mảnh (0..1) và võ hồn được chọn (-1 = ngẫu nhiên)
  testBone: { r: number; s: number } | null;   // hook test `bone` (4.1): cố định số ngẫu nhiên rơi hồn cốt (0..1) và vị trí (-1 = ngẫu nhiên)
  // hook test `core` (5.1): cố định số ngẫu nhiên rơi hồn hạch (0..1), sao (0 = ngẫu nhiên trong khoảng) và bộ (-1 = ngẫu nhiên)
  testCore: { r: number; stars: number; set: number } | null;
  testHerb: { r: number; i: number } | null; // hook test `herb` (BĐ6b): cố định số ngẫu nhiên rơi tiên thảo (0..1) và loại (-1 = ngẫu nhiên)
  testLocFile?: string | null; // hook test `locfile` (11.5): file Tiled ghi kèm vị trí thay cho file đang dùng (null = như dòng trước 11.5)
  looksN: number;       // số lần đã đổi ngoại hình ở thợ may (accounts.looks_changes, L4 #511); chỉ cập nhật sau khi DB xác nhận
  looksBusy: boolean;   // đang chờ DB đổi ngoại hình: chặn lần đổi thứ hai chồng lên
  shardBusy: boolean;   // đang chờ DB mở võ hồn bằng mảnh (bước 3.4): chặn lần mở thứ hai cho tới khi xong
  mpF: number; hpF: number; // hpF: sinh lực của võ hồn ra trận
  benchHp: Map<number, number>; // sinh lực các võ hồn khác (rowId -> sinh lực; không có = đầy). Không lưu DB: vào lại thì hồi đầy
  down: Map<number, number>;    // võ hồn đã gục: rowId -> số giây ngoài trận còn lại trước khi hồi (REVIVE_SECS)
  dirty: Set<number>;           // võ hồn không ra trận có tiến độ chưa lưu (kinh nghiệm chia cho đội)
  squadKey: string; squadT: number; // tin riêng "squad": nội dung lần gửi trước, đếm giờ kiểm tra lại
  fight: number;        // số giây kể từ lần cuối đánh trúng hoặc bị đánh
  // Mọi lần ghi DB về người chơi này nối tiếp nhau trong một chuỗi (mục 6): tối đa một lần ghi đang chạy, commit đúng thứ tự.
  saving: Promise<void>;
  teamQueued: boolean;  // đã có một lần lưu đội hình đang chờ trong chuỗi (lần đó ghi bản mới nhất lúc chạy)
  tradeQueued: boolean; // đã có một lần lưu sau mua / bán ở thương nhân đang chờ trong chuỗi (6.1; lần đó chụp túi mới nhất lúc chạy)
  latest: Map<string, () => unknown>; // lần ghi gộp đang chờ trong chuỗi theo khóa (chainLatest, #164): hàm ghi mới nhất của khóa đó
  portalKey: string;    // hộp đi cổng đã gửi cho client ("" = không đứng ở cổng)
  // Đang niệm đi qua cổng (TRAVEL_CAST giây, bến thuyền BOAT_CAST; bị đánh thì hủy). Từ 11.2 cũng là niệm truyền tống / Hồi Thành Phù
  // (`wp`, WAYPOINT_CAST giây; di chuyển hoặc bị đánh thì hủy): `portal` là cổng ẩn tới đích, mọi chỗ chặn "đang đi cổng" áp như nhau.
  travelCast: { portal: Portal; t: number; wp?: RecallCast } | null;
  wps: Set<string>;     // truyền tống trận đã mở khóa (11.2, bảng `waypoints`; mã `<mapId>:<tên>`)
  wpKey: string;        // truyền tống trận đang đứng đã báo cho client ("" = không đứng trên trận)
  // Sương mù khám phá (R8, bảng `map_fog`, chỉ bản đồ này): bitset ô thô (null = chưa nạp xong hoặc bản đồ mở sẵn), các ô vừa mở chưa gửi
  // client, và cờ bitset đổi từ lần ghi trước (ghi gộp theo lần lưu định kỳ / đi cổng / rời phòng, không ghi mỗi bước).
  fog: Uint8Array | null; fogAdd: number[]; fogDirty: boolean;
  travelling: boolean;  // cờ đang chuyển bản đồ (bước 2) hoặc client đã rời phòng: bỏ qua mọi hành động, lưu định kỳ bỏ qua người này
  travelled: boolean;   // transaction đi cổng đã commit: onLeave không ghi gì nữa
  gmReset: boolean;     // lệnh GM `preset` đã ghi đè DB (#518): mọi lần ghi sau của phiên này (kể cả lúc thoát) bị bỏ, không ghi đè mức vừa áp
  gmMarked: boolean;    // đã bật is_test cho tài khoản admin trong phiên này (#518)
  chListAt: number;     // lần gửi danh sách kênh gần nhất (ms): tin "channels" tối đa 1 lần / giây
  bossAskAt: number;    // lần trả tin boss lúc vào phòng gần nhất (ms, #118): tin "boss" tối đa 1 lần / giây
  chListQueued: boolean; // đã hẹn gửi lại danh sách kênh khi hết 1 giây (client xin dồn)
  msgLimit: boolean; msgTok: Record<MsgGroup | "hard", TokenBucket>; msgOver: number; msgOverAt: number; msgGone: boolean; // giới hạn tin theo nhóm + trần tuyệt đối (#677, #734)
  statsRow: unknown; askAt: Map<string, number>; askQueued: Set<string>; // tin client xin lại dữ liệu riêng (bag, vohons, quest): lần gửi gần nhất (ms), đã hẹn gửi (#165, ask)
  energy: Map<number, number>;  // năng lượng tiên cơ từng võ hồn trong đội (rowId -> 0..TIEN_CO_MAX; không có = 0). Không lưu DB
  shield: number; shieldT: number; // khiên của hồn sư (tiên cơ phụ trợ) và số giây còn lại
  buffs: Map<BuffId, { t: number; v: number }>; // hiệu ứng có lợi của hồn sư (hồn kỹ phụ trợ): giây còn lại, độ lớn; đổi võ hồn vẫn còn
  lei: number; leiQueued: boolean; // Phong Lôi Chi Lực (PHONG_LOI, 2.5c) và cờ đã hẹn tung Lôi Động Minh Thiên. Không lưu DB
  // Hồn kỹ gần nhất của võ hồn không có Phục Chế (Xúc Xích sao chép, 2.5c; từ 9.3 đồng đội tổ đội cũng chép được): định nghĩa, võ hồn
  // tung (rowId, mã võ hồn), thời điểm (ms, Date.now; hook `rest` lùi lại). Không lưu DB.
  lastSkill: { sk: SkillDef; row: number; vh: string; t: number } | null;
  // Túi đồ (mục 5.7, bước 3.1): chỉ gửi riêng cho chính chủ qua tin "bag". Lưu cùng lần lưu định kỳ, khi rời phòng và khi đi cổng.
  bag: Item[];          // mọi ô (thứ tự hiển thị); món đang gắn vào võ hồn (vohonId) không chiếm ô túi
  honTe: number;        // Hồn Tệ (đồng)
  bagSlots: number;     // số ô túi của tài khoản (khởi đầu BAG_SLOTS, mở rộng ở thương nhân từ 9.8; accounts.bag_slots)
  bagDirty: boolean;    // túi hoặc Hồn Tệ đổi từ lần lưu trước
  // Bản túi đã gửi cho client (#215, shared/bagSync.ts): null = lần gửi tới là cả túi (tin "bag"), sau đó chỉ gửi thay đổi (tin "bagd").
  bagSent: BagSent | null; bagBuyback: string;
  // Tự bán từ xa (#216, mục 5.7 "Tự bán"): bộ lọc, AUTO_SELL_BUYBACK món tự bán gần nhất (mới nhất trước; cả hai lưu cùng túi đồ),
  // cờ cần xét tự bán ở nhịp tới (đặt khi túi đổi), chuỗi JSON bộ lọc + danh sách đã gửi client, tổng số món / Hồn Tệ đã tự bán trong
  // phiên và mốc lúc bật tự săn (tổng kết Auto 2).
  sellCfg: SellSettings; sold: SoldRow[]; sellCheck: boolean; sellSent: string; soldN: number; soldCoins: number; autoSold0: [number, number];
  danCd: number;        // giây còn lại của hồi chiêu chung các đan (DAN_CD)
  starterNote: boolean; // vừa nhận vật phẩm khởi đầu: báo một lần khi client xin túi đồ
  // Trạng thái trên hồn sư (từ 3.5, PLAYER_STATUS): do chiêu báo trước của hồn thú gây; `src` là mã hồn thú. Không lưu DB.
  st: Map<StatusId, SInst>; dotT: number;
  hanT: number; // #163 Cực Hàn: số giây đã tích về tầng Hàn kế tiếp (cold.ts); thanh tẩy / clearPStatus đặt về 0
  // Mê hoặc trên hồn sư (#116, PLAYER_CHARM): chỗ bị Mê hoặc (ox, oy), điểm đang đi tới (tx, ty), giây còn lại trước khi đổi điểm.
  charm: { ox: number; oy: number; tx: number; ty: number; t: number } | null;
  // Lượt nhận rương thú vương hôm nay (BĐ5, bảng boss_claims; `day` theo giờ Việt Nam): nạp lúc vào phòng, DB là nguồn chính khi nhận.
  claims: { day: string; n: number };
  wclaims: { day: string; n: number }; // lượt nhận thưởng boss thế giới hôm nay (BĐ6e, loại BOSS_CLAIM_WORLD), như `claims`
  // Mảnh đã đổi ở Thương hội hôm nay (#282, loại SHARD_BUY.claimKind), như `claims`; `pend`: số mảnh của các lần đổi đang chờ DB.
  shardBuy: { day: string; n: number; pend: number };
  // Trang bị hồn sư đang mặc (E1, mục 5.15; `items.equip_slot`): không nằm trong `bag` (không chiếm ô túi, không bán / bỏ), ghi DB cùng túi (bagSnapshot).
  // `gearSt` tính lại mỗi lần đổi (gearStats): cộng vào calcStats (recalc), công vũ khí theo đòn (atkOf), giảm sát thương (buffV "def").
  gear: Item[]; gearSt: GearStats;
  lockIds: Set<string>; // món vừa đổi bằng mặc / tháo / bán / khóa, chờ lần ghi kế: write() giữ khóa Redis lock:item của các món này trong lúc ghi (#559)
  enhBusy: boolean;     // đang xử lý một lệnh cường hóa trang bị (E3): lệnh tới sau bị từ chối ngay ("đang xử lý"), chống đua lệnh / nhân đồ
  salvAt: number;       // mốc (ms) sớm nhất cho lần tự phân giải kế (autoSalvage)
  testSyn: number | null; // hook test `synroll` (ép số tung hợp thành / phân giải 0..1); `enhBusy` dùng chung cho cả cường hóa, hợp thành và phân giải (E4)
  testEnh: number | null; testEnhSlow: number; // hook test `enhroll` (ép số tung 0..1) và `enhslow` (ms chờ trong chuỗi lưu, để bot dồn lệnh khi MemoryStore ghi xong ngay)
  claimBusy: number;    // số lần nhận phần thưởng boss đang chờ DB: chặn mở rương, bán / bỏ / hấp thụ / nộp đồ cho tới khi xong (#165)
  testClaimHold: boolean; // hook test `claimhold` (#165): như đang chờ DB ghi phần thưởng boss, cờ riêng để không đụng bộ đếm claimBusy thật
  testTravelLost: boolean; // hook test `travellost` (#165): lần đi cổng kế tiếp commit xong rồi mới báo lỗi, như mất phản hồi sau COMMIT
  testEquip: (() => number) | null; // hook test `edrop`: RNG có hạt cho mọi lần tung rơi trang bị của người này
  testChest: { bone: number; ur: number; i: number; n: number; s: number } | null; // hook test `chest`: cố định số ngẫu nhiên khi mở rương (−1 = ngẫu nhiên)
  // Kỹ năng bị động của hồn cốt thân / chân trên võ hồn ra trận (từ 4.3, bonePassive): tính lại trong recalc. Không lưu DB.
  passive: BonePassive;
  // Hồn hạch (từ 5.2): hiệu ứng bộ của võ hồn ra trận (coreFx, tính lại trong recalc), tỉ lệ / hệ số chí mạng (calcStats), số đòn
  // thường trúng liên tiếp và số giây từ đòn trước (bộ Hạo Thiên 4 món), giây còn lại của tăng tốc đánh (Linh Miêu 4 món), chờ
  // trước lần hồi hồn lực kế tiếp (Bá Vương Long 4 món). Không lưu DB.
  coreFx: CoreFx; crit: number; critMult: number; combo: number; comboT: number; haste: number; shockMpCd: number;
  partyKey: string;     // khung tổ đội (tin riêng "party", 7.1) lần gửi trước: chỉ gửi lại khi đổi
  // Nhiệm vụ tân thủ (6.2, chuỗi QUEST_STARTER): chỉ gửi riêng cho chính chủ (tin "quest"); lưu cùng túi đồ (bagSnapshot, bảng quests).
  quest: QuestProgress;
  // Chuỗi cố định khác chuỗi tân thủ (QUESTS, chương 2 trở đi; #189): tiến độ từng chuỗi, tin riêng "quest" kèm mã chuỗi.
  chains: QuestProgress[];
  // Khảo hạch hằng ngày của Phất Lan Đức (DAILY): DAILY.count bài của ngày `dailyDay` (vnDay), tin riêng "daily"; lưu cùng túi đồ như `quest`.
  daily: QuestProgress[]; dailyDay: string;
  // Tông vụ hằng ngày (#197, TONG_DAILY): TONG_DAILY.count bài của ngày `tongDay` ở sứ giả tông mình, gửi trong tin riêng "tong"; lưu cùng
  // túi đồ như khảo hạch. `tongBoardAt`: lúc xin bảng tông tuần gần nhất (ms, TONG_BOARD_CD).
  tongTasks: QuestProgress[]; tongDay: string; tongBoardAt: number;
  tongPend: { week: number; tong: string; n: number }[]; // điểm tông vụ chờ ghi cùng túi (#320): chỉ bỏ khỏi hàng sau khi lần ghi thành công
  // Đại Đấu Hồn Trường (7.2): đang chờ DB đọc Elo trước khi vào hàng chờ; lúc xin bảng xếp hạng gần nhất (ms, chống xin dồn dập).
  arenaBusy: boolean; arenaTopAt: number; arenaLiveAt: number; arenaWatchAt: number; resonanceTopAt: number;
  arenaGone: boolean;   // đã được ghép trận và rời phòng sang sân đấu (7.2): rời phòng lúc đó không phải rời game (giữ danh sách mua lại, 9.8)
  // Võ Hồn Chân Thân (vòng 7, từ 8.1a): võ hồn đang biến hình (`row`), giây còn lại, chỉ số đang cộng (chanThanStats, đọc trong buffV
  // và recalc); `avaCd`: hồi chiêu Chân Thân còn lại của từng võ hồn (rowId -> giây). Không lưu DB.
  ava: { row: number; t: number; stats: Partial<Record<ChanThanStat, number>> } | null;
  avaCd: Map<number, number>;
  // Võ Hồn Dung Hợp Kỹ (#192, FUSION): lời mời đang chờ: đồng đội `with`, giây còn lại `t`, `init` = mình là người mời (A), chỉ số cặp
  // `fi` trong FUSIONS. Hồi chiêu ở `fusionReady` (theo tài khoản, mức tiến trình). Không lưu DB.
  fus: { with: string; t: number; init: boolean; fi: number } | null;
  // Hồi chiêu còn lại theo hồn kỹ (`rowId:vòng`, từ 8.1a): hồi chiêu đồng bộ vẫn theo ô (`p.cds`), nhưng khi xếp lại ô hay đổi võ hồn
  // thì ô mang hồn kỹ đó nhận ít nhất phần còn lại này, để bỏ ra rồi xếp lại (hoặc sửa ô của võ hồn đang nghỉ) không làm mới hồi chiêu.
  skCd: Map<string, number>;
  // Cộng minh (8.2, mục 5.10): tiến độ và số mốc đã đạt từng trụ cột (thứ tự RESONANCE), tổng % cộng cho mọi võ hồn. Không lưu DB:
  // tính lại từ võ hồn và đồ đang gắn (resCheck) khi nạp tài khoản và mỗi khi dữ liệu liên quan đổi. `resKey`: tin "resonance" lần trước.
  res: { prog: number[]; lv: number[]; bonus: Record<ResEffect, number> }; resKey: string;
  // Tự săn (Auto 1, mục 5.13): đang chạy (null = tắt), cài đặt, ngày (giờ Việt Nam) và số giây đã treo trong ngày đó, cờ chưa lưu
  // (bảng auto_hunt; flushAuto ghi trong chuỗi lưu cùng lần lưu thường, trước transaction đi cổng và khi dừng). `autoBonus`: giây
  // treo cộng thêm còn lại từ Ủy Thác Lệnh (Auto 2), chỉ tiêu khi đã treo hết AUTO_DAILY_SECS của hôm nay.
  auto: AutoHunter | null; autoCfg: AutoSettings; autoDay: string; autoUsed: number; autoBonus: number; autoDirty: boolean; autoTok: number; autoTokAt: number; autoSetPend: { cfg: unknown } | null; autoRealRate: boolean; autoPace: [number, number]; autoHintC: { key: string; hint: AutoHint } | null;
  // Ủy thác offline (Auto 3): bảng nhận thưởng đã tính chờ gửi (client xin bằng tin `offline` sau khi đăng ký handler, vì claimOffline
  // có thể xong trước khi client sẵn sàng nhận) và client đã xin chưa.
  offMsg: Record<string, unknown> | null; offAsk: boolean;
  tong: string | null; tongAt: number | null; // #196: tông môn (mã trong TONG_MON) và lúc gia nhập gần nhất (ms; giữ khi rời); bảng accounts
}
/** Một đòn đánh thường / một lần tung hồn kỹ: năng lượng tiên cơ chỉ tính một lần dù trúng nhiều hồn thú hay nhiều mũi đạn. */
interface Hit { kind: "attack" | "skill"; done: boolean; onHit?: () => void; } // onHit: gọi một lần khi trúng lần đầu (5.2, bộ Lam Ngân)
export interface AuthData { accountId: number; ch: Character; owned: Character[]; team: number[]; looks: AccountLooks; loc: Location; bag: Bag; starter: boolean;
  claims: { day: string; n: number }; wclaims: { day: string; n: number }; shardBuy: { day: string; n: number }; wps: string[]; auto: AutoRow; tong: TongRow; social: SocialRow; }
/**
 * Niệm truyền tống (11.2): tên nơi đến, phí (đồng, trừ lúc dịch chuyển), ô Hồi Thành Phù sẽ dùng (không có = truyền tống trận), chỗ
 * đứng lúc bắt đầu (lệch quá 2 pixel thì hủy: di chuyển, bị đẩy / kéo), tổng số giây (thanh niệm của client).
 */
interface RecallCast { label: string; fee: number; itemId?: string; x0: number; y0: number; dur: number; }
/** Một trạng thái trên hồn thú: giây còn lại, số tầng, độ lớn mỗi tầng (sát thương mỗi giây hoặc tỉ lệ), người gây. */
interface SInst { t: number; n: number; v: number; src: string; pair?: string; } // pair (#192): đồng đội dung hợp chia đôi đóng góp
export interface BData {
  zone: number; hx: number; hy: number; tx: number; ty: number; wt: number; cd: number; kx: number; ky: number; target: string | null; hitBy: string | null; anim: number;
  ret: number;              // 11.1: > 0 là đang bỏ đuổi, chạy về chỗ sinh (còn ngần ấy giây, BEAST_LEASH)
  rooted: boolean;          // #116: thú thực vật đứng yên (BEAST_ROOTED): không đi, không bị đẩy / kéo
  reach: number;            // #116: tầm với của thú đứng yên (rootedReach): nhận / giữ mục tiêu trong tầm này; 0 với hồn thú khác
  st: Map<StatusId, SInst>; // trạng thái dùng chung (mục 5.1) đang có
  dotT: number;             // đếm giờ tới lần gây sát thương theo thời gian kế tiếp (STATUS_TICK)
  calm: number;             // số giây kể từ lần cuối bị đánh (hồi máu khi không có mục tiêu, BEAST_REGEN)
  regen: number;            // phần lẻ sinh lực hồi chưa cộng (sinh lực đồng bộ là số nguyên)
  dmg: number;              // sát thương đòn thường theo số năm (beastStats, bước 3.2)
  def: number;              // #116: thủ (BEAST_DEF, beastDef theo loài gốc và số năm): phần sát thương đòn trực tiếp đỡ được
  // Chiêu báo trước (bước 3.5): hồn thú thường từ 1.000 năm có 1 chiêu (beastSkillOf), tinh anh (BĐ4) có 2 (BOSSES). `cd` từng chiêu,
  // `skT`: chờ trước lần tung kế tiếp (mọi chiêu); `cast`: chiêu đang báo trước (các vùng đã khóa, còn `t` giây).
  skills: { def: BeastSkillDef; cd: number }[];
  skT: number;
  // charge: tích lực phải ngắt (BĐ6e); safe: vòng an toàn của chiêu toàn sàn (BeastSkillDef.safe, #118)
  // status (#173): trạng thái theo dạng lúc bắt đầu báo trước (BeastSkillDef.forms), thay cho def.status
  cast: { def: BeastSkillDef; teles: Tele[]; t: number; target: string; charge?: boolean; safe?: Tele[]; status?: StatusApply[] } | null;
  buffs: Map<BeastBuffId, number>; // từ BĐ4: hiệu ứng có lợi của hồn thú (giây còn lại), ví dụ Cuồng nộ của tinh anh
  minions: Set<string>;     // hồn thú do chiêu gọi bầy (BeastSkillDef.summon) của con này gọi ra
  elite: EliteData | null;  // tinh anh (BĐ4); null với hồn thú thường
}
/**
 * Tinh anh (mục 5.4, BĐ4). `base`: máu tối đa khi 1 người (đã nhân ELITE.hp); `n`: số người đang áp vào máu (bossHpMult);
 * `parts`: người tham gia -> số giây liên tục ở ngoài bán kính ELITE.radius; `lonely`: số giây không còn người tham gia nào trong
 * bán kính; `dropT`: chờ trước lần giảm `n` kế tiếp; `dmgBy`: sát thương đã gây; `supBy` (9.2): sinh lực hồi thực / khiên tạo cho
 * người tham gia khác (đóng góp tổng = dmgBy + supBy × SUPPORT_CONTRIB, `contribOf`); `rageCd`: chờ trước lần Cuồng nộ kế tiếp.
 * `acc` (#119): sessionId -> accountId của mọi người có đóng góp hoặc đã là người tham gia; cùng tài khoản vào lại phòng (thoát rồi vào lại, đổi kênh rồi quay về)
 * thì đóng góp chuyển sang phiên mới (`rebindContrib`), nên đóng góp gắn theo tài khoản.
 */
interface EliteData {
  base: number; n: number; engaged: boolean; parts: Map<string, number>; lonely: number; dropT: number;
  dmgBy: Map<string, number>; supBy: Map<string, number>; acc: Map<string, number>; rageCd: number;
  form: number; formT: number; // #173: dạng đang có (chỉ số trong BossDef.forms) và giây còn lại của dạng; không đổi dạng thì 0
  king: KingData | null; // tà hóa thú vương (BĐ5): cùng bộ máy người tham gia / máu theo số người, bán kính là cả hang
}
/**
 * Tà hóa thú vương (mục 5.4, BĐ5). `slot`: khung giờ đã sinh ra nó; `life`: số giây còn lại trước khi rút đi (KING.lifeSecs);
 * `phase`: giai đoạn (2 khi máu còn KING.phaseHp); `roar`: giây còn lại của tiếng gầm chuyển giai đoạn (đứng yên, không nhận khống chế);
 * `spd`: hệ số tốc độ (BossDef.phase2.spd ở giai đoạn 2); `noted`: người đã được nhắc hết lượt nhận thưởng trong trận này;
 * `rankT`: chờ trước lần gửi bảng xếp hạng sát thương kế tiếp.
 */
interface KingData { def: BossDef; slot: number; life: number; phase: 1 | 2; roar: number; spd: number; noted: Set<string>; rankT: number;
  world: WorldData | null; } // world: boss thế giới (BĐ6e), cùng bộ máy thú vương
/**
 * Boss thế giới (mục 5.4, BĐ6e): `rage` đã nổi giận (sau WORLD.enrageSecs), `slamT` chờ trước Bạo Nộ kế tiếp; `weakNext` mốc máu
 * WORLD.weakAt kế tiếp, `weak` / `weakT` điểm yếu hệ đang hiện và giây còn lại; `chargeT` / `armorT` / `miasmaT` / `diveT` chờ trước
 * lần cơ chế kế tiếp (BossDef.world); `brk` số lần khống chế đã trúng khi đang tích lực, `brkAt` lần tính gần nhất theo người (một
 * hồn kỹ gây nhiều khống chế chỉ tính một lần); `shield` / `shieldT` khiên Bá Thể; `dive` giây lặn còn lại (> 0 = đang lặn), `surf` chỗ
 * nổi lên đã báo trước (#118).
 */
interface WorldData {
  rage: boolean; slamT: number; weakNext: number; weak: He | null; weakT: number;
  chargeT: number; armorT: number; miasmaT: number; diveT: number;
  brk: number; brkAt: Map<string, number>; shield: number; shieldT: number; dive: number; surf: { x: number; y: number } | null;
}
/** Trạng thái boss thế giới lúc mới sinh / bỏ giao chiến: các cơ chế chờ `every` × WORLD.firstMech giây mới chạy lần đầu. */
function newWorld(def: BossDef): WorldData {
  const m = def.world ?? {}, first = (e?: number) => (e ?? 0) * WORLD.firstMech;
  return { rage: false, slamT: WORLD.slamEvery, weakNext: 0, weak: null, weakT: 0, chargeT: first(m.charge?.every), armorT: first(m.armor?.every),
    miasmaT: first(m.miasma?.every), diveT: first(m.dive?.every), brk: 0, brkAt: new Map(), shield: 0, shieldT: 0, dive: 0, surf: null };
}
/** Bộ hằng số theo bậc của boss có lịch: thú vương KING, boss thế giới WORLD (người tham gia, thưởng, lượt mỗi ngày). */
const bossK = (k: KingData | null | undefined) => (k?.world ? WORLD : KING);
/** Mũi hồn kỹ đang bay của hồn sư `owner`: chạm hồn thú đầu tiên thì gọi `fire` (sát thương và trạng thái của hồn kỹ). */
interface Proj { x: number; y: number; vx: number; vy: number; life: number; owner: string; fire: (bid: string) => void; foe?: (pid: string) => void; } // foe: trúng đối thủ (7.2)
/** Tùy chọn của một lần gây sát thương lên hồn thú. `direct` = false: sát thương theo thời gian (không chí mạng, không đẩy lùi,
 *  không tính Phá giáp, không lan Cảm điện). `chain`: sát thương lan của Cảm điện (không chí mạng, không lan tiếp).
 *  `pair` (#192): đòn của Võ Hồn Dung Hợp Kỹ, phiên đồng đội dung hợp: không nhận ràng buộc, đóng góp tinh anh / thú vương / boss chia đôi. */
interface DmgOpt { crit?: number; lifesteal?: number; direct?: boolean; chain?: boolean; pair?: string; }
/** Một đòn của Võ Hồn Dung Hợp Kỹ (#192): đồng đội dung hợp và công trung bình của hai người (không ràng buộc). */
interface FusHit { pair: string; atk: number; }

let nextId = 1;
const uid = (p: string) => p + (nextId++).toString(36);

// ---------- Phiên giữ tài khoản (mục 6 "Mỗi tài khoản một phiên") ----------
/** Phiên giữ tài khoản: lease `account:<acc>` trong presence, từ onJoin tới khi lần ghi DB cuối của phiên đó xong (accountLeaseKey). */
/**
 * Chat xuyên phòng (#188, mục 6 "Xã hội"): tổ đội, tin riêng, thế giới, tông môn phát lên chủ đề presence này; mọi phòng nghe và gửi
 * tin `chat` cho người chơi của mình có trong `to`, hoặc thuộc tông `tong` (#198); không có cả hai: mọi người (kênh thế giới). Không
 * lưu lịch sử.
 */
const CHAT_TOPIC = "chatx";
/** Màu dòng log của bạn bè / chặn (#195). */
const FRIEND_COL = "#9fd8ff";
interface ChatRoute { to?: number[]; tong?: string; from?: number; msg: { ch: ChatChannel; name: string; text: string; to?: string } }
/** Tài khoản của phiên (client.auth; cả người xem trận, #278). */
const accOf = (c: Client) => (c.auth as { accountId?: number } | undefined)?.accountId;
/** PERF_LOG=1 (#273): nhịp chậm khi từ đầu tick tới hết bản vá quá ngần này ms (= một nhịp TICK_RATE), hoặc từ đầu nhịp trước quá PERF_GAP_MS. */
const PERF_SLOW_MS = 50, PERF_GAP_MS = 100;
/** Lý do từ chối bán / bỏ / hấp thụ / nộp đồ trong lúc phần thưởng boss đang chờ DB xác nhận lượt (claimBusy, #165). */
const CLAIM_BUSY = "Đang lưu phần thưởng boss / mảnh vừa đổi, đợi một chút."; // claimBusy: rương, thưởng boss, đổi mảnh ở Thương hội (#282)
/** Đang chờ DB ghi phần thưởng boss (grantChest) hoặc hook test `claimhold` giữ: chặn mở rương, bán / bỏ / hấp thụ / nộp / sắp xếp / tự bán. */
/** Lần ghi cuối chờ khóa món tối đa FINAL_LOCK_TRIES × FINAL_LOCK_WAIT_MS (#559). */
const FINAL_LOCK_TRIES = 10, FINAL_LOCK_WAIT_MS = 300;
const claimHeld = (d: { claimBusy: number; testClaimHold: boolean }) => d.claimBusy > 0 || d.testClaimHold;
/** Phiên mới chờ phiên cũ lưu xong tối đa bấy nhiêu mili giây; quá thì từ chối vào phòng (không nạp dữ liệu cũ). */
const HOLD_WAIT_MS = 8000;

// ---------- Giá trị client gửi (mục 6 "Mỗi message: ép kiểu và kẹp giá trị", #164) ----------
// Chỉ kiểm `typeof`, không Number() / String() / phép so sánh trên giá trị thô: msgpack giải ra object tùy ý, đổi kiểu một object
// có thể ném lỗi.
/** Số hữu hạn client gửi; khác (chuỗi, object, NaN, Infinity…) thì 0. */
const numIn = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
/** Bộ đếm token đầy cho mọi nhóm tin của một kết nối (#734). */
const newMsgBuckets = (): Record<MsgGroup | "hard", TokenBucket> => {
  const t = Date.now(), b = { hard: { n: MSG_HARD.burst, t } } as Record<MsgGroup | "hard", TokenBucket>;
  for (const g of Object.keys(MSG_GROUP) as MsgGroup[]) b[g] = { n: MSG_GROUP[g].burst, t };
  return b;
};
/** Số nguyên client gửi; khác thì NaN (hàm nhận tự từ chối). */
const intIn = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : NaN);
/** Chuỗi client gửi; khác thì "". */
const strIn = (v: unknown) => (typeof v === "string" ? v : "");
/** Cùng một lỗi bất ngờ ở cùng một chỗ (onUncaughtException) chỉ ghi log tối đa một lần mỗi bấy nhiêu mili giây. */
const ERR_LOG_MS = 10_000;
/**
 * Số lần lưu bị lỗi từ lúc bật server: lần ghi trong chuỗi lưu (chain), và lỗi trong onLeave / onDispose (có thể ném trước khi tới lần
 * ghi cuối). index.ts so trước / sau khi tắt để biết lần lưu cuối có trót lọt (#270).
 */
export const saveStats = { failed: 0 };

// ---------- Thú vương theo bản đồ, mức tiến trình (mục 6; bước BĐ5) ----------
/**
 * Một "suất" thú vương của một khung giờ: mỗi kênh đang mở của bản đồ giữ tối đa một suất (`owner` = roomId, null = phòng giữ suất đã
 * bị hủy). `state`: còn sống / đã bị hạ / đã rút đi; `leaveAt`: lúc rút đi (ms).
 */
interface KingSeat { id: string; owner: string | null; state: "alive" | "down" | "gone"; leaveAt: number; }
/**
 * Thú vương theo bản đồ, sống lâu hơn phòng (Colyseus tự hủy phòng trống): mỗi khung giờ đã sinh (`slot`, hết lúc `until`) và các suất
 * của khung đó. Phòng mở lại trong cùng khung nhận lại suất không chủ thay vì sinh con mới, nên hạ thú vương rồi rời bản đồ cho phòng
 * hủy, quay lại cũng không có con mới. Khung hết hạn thì bỏ. Chạy nhiều tiến trình thì phải chuyển sang presence (Redis), như lịch.
 */
const kingSeats = new Map<string, Map<number, KingSlot>>(); // map-co-dinh: khóa theo mapId; khung hết hạn bị kingRecs / applyKingDoc bỏ
const kingClaimCache = new Map<string, Set<number>>();
/** Bỏ bộ nhớ đệm người đã nhận rương của khung `slot` (khung hết hạn / không còn trong tài liệu): không có thì Map chỉ tăng theo uptime (#739). */
const dropKingClaims = (mapId: string, slot: number) => { kingClaimCache.delete(`${mapId}:${slot}`); };
type KingSlotDoc = { slot: number; until: number; boss: string; seats: KingSeat[]; claimed: number[] };
type KingDoc = Record<string, KingSlotDoc>;
const kingKey = (mapId: string) => `king:${mapId}`;
/**
 * Một khung giờ đã sinh của bản đồ: các suất (mỗi kênh tối đa một) và các tài khoản đã nhận rương của khung này ở bất kỳ kênh nào
 * (`claimed`): đổi kênh rồi hạ thú vương của kênh khác trong cùng khung thì không nhận thêm rương (mục 6 "Nhiều kênh").
 */
interface KingSlot { slot: number; until: number; seats: KingSeat[]; claimed: Set<number>; boss: string; } // boss: mã BOSSES của khung (BĐ6e: boss thế giới luân phiên)
const KING_STATE_TTL_MS = (Math.max(KING.lifeSecs, WORLD.lifeSecs) + 120) * 1000;
// ---------- Giới hạn săn tinh anh nhiều kênh, mức tiến trình (mục 5.4; #119) ----------
/**
 * `${mapId}|${mã tinh anh}` -> accountId -> lúc (ms) được nhận lại thưởng tinh anh đó (ELITE.lock giây sau lần nhận). Theo bản đồ, không
 * theo phòng: mỗi kênh có tinh anh hồi sinh riêng, nên đổi kênh liên tục không nhân thưởng. Mất khi khởi động lại server (lâu nhất
 * ELITE.lock giây, chấp nhận được). Chạy nhiều tiến trình thì phải chuyển sang presence (Redis), như kingSeats.
 */
const eliteLocks = new Map<string, Map<number, number>>();
const ELITE_LOCK_TOPIC = "presence:elite-lock";
const ELITE_STATE_TTL_MS = (ELITE.lock + 60) * 1000;
function applyEliteLock(key: string, values: Record<string, number>) {
  const m = new Map(Object.entries(values).map(([acc, until]) => [Number(acc), Number(until)]));
  if (m.size) eliteLocks.set(key, m); else eliteLocks.delete(key);
}
/** Nạp khóa thưởng tinh anh của bản đồ từ presence (phòng mới mở / tiến trình mới bật chưa nghe tin nào), gộp giữ mốc muộn hơn. */
async function loadEliteLocks(mapId: string) {
  const keys = BOSSES.map((b) => `${mapId}|${b.id}`);
  const docs = await presenceBackend.getJsonMany<Record<string, number>>(keys.map((k) => `elite:${k}`));
  docs.forEach((doc, i) => {
    if (!doc) return;
    const m = eliteLocks.get(keys[i]) ?? new Map<number, number>();
    for (const [acc, until] of Object.entries(doc)) m.set(Number(acc), Math.max(m.get(Number(acc)) ?? 0, Number(until)));
    if (m.size) eliteLocks.set(keys[i], m);
  });
}
async function persistEliteLock(key: string, changes: Map<number, number>) {
  const owner = `${presenceBackend.workerId}:elite:${key}`;
  let merged: Record<string, number> = {};
  await presenceBackend.withLock<Record<string, number>>(`elite:${key}`, owner, 5000, (old) => {
    merged = { ...(old ?? {}) };
    for (const [acc, until] of changes) merged[String(acc)] = until;
    return merged;
  }, ELITE_STATE_TTL_MS);
  void presenceBackend.presence.publish(ELITE_LOCK_TOPIC, { key, values: merged });
}
/**
 * Hồi chiêu Võ Hồn Dung Hợp Kỹ (#192, FUSION.cd) theo tài khoản, mức tiến trình: accountId -> lúc (ms) dùng lại được. Thuộc hồn sư nên đổi
 * võ hồn, đổi kênh, đi cổng, thoát vào lại đều không làm mới. Mất khi khởi động lại server; ghi cả vào presence (`fusion:<acc>`, TTL = FUSION.cd), nạp lại lúc vào phòng (#120).
 */
const fusionReady = new Map<number, number>();
const fusionKey = (accountId: number) => `fusion:${accountId}`;
const worldChatKey = (accountId: number) => `world-chat:${accountId}`;
/** Số giây hồi chiêu dung hợp kỹ còn lại của tài khoản `acc` (0 = dùng được); bỏ mục đã hết hạn. */
function fusionCdLeft(acc: number) {
  const t = fusionReady.get(acc); if (t === undefined) return 0;
  const left = (t - Date.now()) / 1000; if (left <= 0) fusionReady.delete(acc);
  return Math.max(0, left);
}
/** Khóa nhận thưởng của tinh anh `b` trên bản đồ `mapId` (khóa của eliteLocks): theo loài tinh anh (mã BOSSES). */
const eliteKey = (mapId: string, b: BeastState) => `${mapId}|${BOSSES[b.species]?.id ?? b.species}`;
/** Số giây còn lại trước khi tài khoản `acc` nhận lại thưởng tinh anh `key` (0 = nhận được); bỏ các mục đã hết hạn của `key`. */
function eliteLockLeft(key: string, acc: number, now = Date.now()): number {
  const m = eliteLocks.get(key); if (!m) return 0;
  for (const [a, until] of m) if (until <= now) m.delete(a);
  if (!m.size) eliteLocks.delete(key);
  return Math.max(0, ((m.get(acc) ?? now) - now) / 1000);
}
/** Các khung còn hạn của bản đồ `mapId` (bỏ khung đã hết). */
function kingRecs(mapId: string, now: number) {
  let recs = kingSeats.get(mapId);
  if (!recs) { recs = new Map(); kingSeats.set(mapId, recs); }
  for (const [slot, r] of recs) if (r.until <= now) { recs.delete(slot); dropKingClaims(mapId, slot); }
  return recs;
}
/**
 * Khung giờ thú vương đang diễn ra của bản đồ `mapId`: khung muộn nhất trong lịch (kingActive) và các khung đã sinh còn hạn (kể cả do
 * hook test).
 */
function kingSlotNow(mapId: string, now: number): { slot: number; until: number } | null {
  // Bản đồ boss thế giới (BĐ6e): lịch WORLD_TIME, sống WORLD.lifeSecs.
  // Lịch tính trên đồng hồ lịch boss (bossNow: giờ thật, trừ khi GAME_TEST đặt lại), khung trả về đổi lại giờ thật.
  const world = !!MAPS[mapId].world?.length, off = bossOffset(now), at = world ? worldActive(now + off) : kingActive(now + off), recs = kingRecs(mapId, now);
  const active = at === null ? null : at - off;
  let best = active === null ? null : recs.get(active) ?? { slot: active, until: active + (world ? WORLD.lifeSecs : KING.lifeSecs) * 1000 };
  for (const r of recs.values()) if (!best || r.slot > best.slot) best = r;
  return best;
}
/**
 * Lấy suất thú vương cho phòng `roomId` trong khung `slot` của bản đồ `mapId`: suất không chủ trước (phòng cũ đã hủy), không còn thì
 * thêm suất mới còn sống tới `until`.
 */
function applyKingDoc(mapId: string, doc: KingDoc | null) {
  if (!doc) return;
  const recs = new Map<number, KingSlot>(), now = Date.now();
  for (const value of Object.values(doc)) {
    const cacheKey = `${mapId}:${value.slot}`, cached = kingClaimCache.get(cacheKey) ?? new Set<number>();
    for (const accountId of value.claimed) cached.add(accountId);
    if (value.until > now) kingClaimCache.set(cacheKey, cached); else dropKingClaims(mapId, value.slot);
    recs.set(value.slot, { slot: value.slot, until: value.until, boss: value.boss, seats: value.seats, claimed: new Set(cached) });
  }
  for (const slot of kingSeats.get(mapId)?.keys() ?? []) if (!recs.has(slot)) dropKingClaims(mapId, slot);
  kingSeats.set(mapId, recs);
}
/** Hook kiểm thử (server/scripts/map-leak-test.ts): nạp tài liệu khung, lấy các khung còn hạn, đếm / hỏi bộ nhớ đệm rương. */
export const kingClaimTest = { apply: applyKingDoc, recs: kingRecs, size: () => kingClaimCache.size, has: (mapId: string, slot: number) => kingClaimCache.has(`${mapId}:${slot}`) };
async function loadKingState(mapId: string) { applyKingDoc(mapId, await presenceBackend.getJson<KingDoc>(kingKey(mapId))); }
async function persistKingSeat(mapId: string, slot: number, seat: KingSeat, claimed: Set<number>) {
  const cacheKey = `${mapId}:${slot}`, cached = kingClaimCache.get(cacheKey) ?? new Set<number>();
  for (const accountId of claimed) cached.add(accountId);
  if (kingSeats.get(mapId)?.has(slot)) kingClaimCache.set(cacheKey, cached); // khung đã bị bỏ (hết hạn) thì không tạo lại khóa mồ côi
  const owner = `${presenceBackend.workerId}:king:${mapId}:${slot}:${seat.id}`;
  await presenceBackend.withLock<KingDoc>(kingKey(mapId), owner, 5000, (old) => {
    const next = old ?? {}, rec = next[String(slot)];
    if (!rec) return next;
    const found = rec.seats.findIndex((s) => s.id === seat.id);
    if (found >= 0) rec.seats[found] = { ...seat };
    rec.claimed = [...new Set([...rec.claimed, ...cached])];
    return next;
  }, KING_STATE_TTL_MS);
}
async function takeKingSeat(mapId: string, slot: number, until: number, roomId: string, boss: string): Promise<{ seat: KingSeat; claimed: Set<number>; boss: string }> {
  const owner = `${presenceBackend.workerId}:king:${mapId}:${slot}:${roomId}`;
  let result!: { seat: KingSeat; claimed: Set<number>; boss: string };
  const ok = await presenceBackend.withLock<KingDoc>(kingKey(mapId), owner, 5000, (old) => {
    const now = Date.now(), next = old ?? {};
    for (const [key, value] of Object.entries(next)) if (value.until <= now) { delete next[key]; dropKingClaims(mapId, value.slot); }
    let rec = next[String(slot)];
    if (!rec) { rec = { slot, until, seats: [], claimed: [], boss }; next[String(slot)] = rec; }
    let seat = rec.seats.find((s) => s.owner === null);
    if (!seat) { seat = { id: randomUUID(), owner: null, state: "alive", leaveAt: until }; rec.seats.push(seat); }
    seat.owner = roomId;
    const cacheKey = `${mapId}:${slot}`, cached = kingClaimCache.get(cacheKey) ?? new Set<number>();
    for (const accountId of rec.claimed) cached.add(accountId);
    kingClaimCache.set(cacheKey, cached);
    result = { seat: { ...seat }, claimed: new Set(cached), boss: rec.boss };
    return next;
  }, KING_STATE_TTL_MS);
  if (!ok || !result) throw new ServerError(503, "Không lấy được suất thú vương, hãy thử lại sau.");
  await loadKingState(mapId);
  const local = kingSeats.get(mapId)?.get(slot), seat = local?.seats.find((s) => s.id === result.seat.id) ?? result.seat;
  return { seat, claimed: local?.claimed ?? result.claimed, boss: local?.boss ?? result.boss };
}
/**
 * Báo trước thú vương gần nhất theo bản đồ (kênh "boss", `at` = giờ xuất hiện, ms): phòng mở ra trong lúc chờ (kể cả báo trước của
 * hook test) vẫn có đếm ngược. Xóa khi thú vương của bản đồ đó xuất hiện.
 */
const kingWarns = new Map<string, BossEvent & { at: number }>();
/** Nửa cỡ hồn thú lớn nhất (TIERS.size): cộng vào bán kính khi lấy ứng viên từ lưới không gian (beastsNear, 11.4). */
const BEAST_HALF = Math.max(...TIERS.map((t) => t.size)) / 2;

// ---------- Kênh (mục 6 "Nhiều kênh") ----------
/** Số người tối đa mỗi kênh: CHANNEL_MAX; chỉ khi bật GAME_TEST=1 mới hạ được bằng biến môi trường CHANNEL_MAX (bot thử kênh 2). */
export const CHANNEL_CAP = (() => {
  const n = Math.floor(Number(process.env.CHANNEL_MAX));
  return process.env.GAME_TEST === "1" && n >= 1 ? Math.min(n, CHANNEL_MAX) : CHANNEL_MAX;
})();
/** Registry kênh dùng chung: TTL tự dọn số của phòng chết, lock chống hai tiến trình cùng cấp một số. */
const CHANNEL_TTL_MS = 60_000;
type ChannelLease = { roomId: string; owner: string; ch: number; expiresAt: number };
type ChannelRegistry = Record<string, ChannelLease>;
const channelKey = (mapId: string) => `channels:${mapId}`;
async function takeChannel(mapId: string, roomId: string) {
  const owner = `${presenceBackend.workerId}:${roomId}`;
  let chosen = 0;
  const ok = await presenceBackend.withLock<ChannelRegistry>(channelKey(mapId), owner, 5000, (old) => {
    const now = Date.now(), next = old ?? {};
    for (const [ch, lease] of Object.entries(next)) if (lease.expiresAt <= now) delete next[ch];
    const used = new Set(Object.keys(next).map(Number));
    chosen = 1; while (used.has(chosen)) chosen++;
    next[String(chosen)] = { roomId, owner, ch: chosen, expiresAt: now + CHANNEL_TTL_MS };
    return next;
  }, CHANNEL_TTL_MS);
  if (!ok || !chosen) throw new ServerError(503, "Không cấp được kênh, hãy thử lại sau.");
  return chosen;
}
async function touchChannel(mapId: string, roomId: string, ch: number) {
  const owner = `${presenceBackend.workerId}:${roomId}`;
  await presenceBackend.withLock<ChannelRegistry>(channelKey(mapId), owner, 5000, (old) => {
    const next = old ?? {}, found = next[String(ch)];
    if (found?.roomId === roomId && found.owner === owner) found.expiresAt = Date.now() + CHANNEL_TTL_MS;
    return next;
  }, CHANNEL_TTL_MS);
}
async function releaseChannel(mapId: string, roomId: string, ch: number) {
  const owner = `${presenceBackend.workerId}:${roomId}`;
  await presenceBackend.withLock<ChannelRegistry>(channelKey(mapId), owner, 5000, (old) => {
    const next = old ?? {}, found = next[String(ch)];
    if (found?.roomId === roomId && found.owner === owner) delete next[String(ch)];
    return next;
  }, CHANNEL_TTL_MS);
}
/** Lần đổi kênh gần nhất của mỗi tài khoản (ms): đổi kênh là đổi phòng (đổi sessionId) nên khóa theo tài khoản (CHANNEL_CD). */
const channelSwitchAt = new Map<number, number>();
const channelSwitchKey = (accountId: number) => `channel-switch:${accountId}`;
/**
 * Kênh vừa rời không qua đường server duyệt (đóng tab, mất mạng, client tự rời; onLeave không ghi khi đi cổng / đổi kênh đã commit): trong
 * CHANNEL_CD giây tài khoản chỉ được vào lại đúng kênh đó của bản đồ (onAuth từ chối kênh khác khi kênh cũ còn mở và còn chỗ;
 * pickChannel đưa về kênh cũ). Không có lớp này thì client tự rời rồi joinById kênh khác là né được luật đổi kênh (giao chiến, chờ).
 * Từ #164 (`travel`): đi cổng / đổi kênh / truyền tống sang bản đồ khác commit xong cũng ghi kênh server đã chọn ở bản đồ đích, để
 * client vào đúng kênh đó (mục 6: client không chọn kênh đích) chứ không tự joinById kênh khác.
 */
const leftRoom = new Map<number, { mapId: string; roomId: string; ch: number; until: number; travel?: boolean }>();
const channelLeftKey = (accountId: number) => `channel-left:${accountId}`;
/** Hook test `chan {nolock}`: lần rời phòng kế tiếp của tài khoản không ghi leftRoom (bot thử chọn kênh khi vào game). */
const testNoLeaveLock = new Set<number>();
/**
 * Hook test `offline {ago}` (Auto 3, chỉ GAME_TEST): lần ủy thác offline kế tiếp của tài khoản ghi thời điểm bắt đầu lùi `ago` giây,
 * như đã thoát từ `ago` giây trước (giả lập thời gian trôi: bot vào lại ngay mà vẫn nhận thưởng theo quãng vắng mặt đó).
 */
const testOfflineAgo = new Map<number, number>();
/** Kênh vừa rời của tài khoản ở bản đồ `mapId` nếu còn khóa và kênh đó còn mở, còn chỗ (trong `list`). */
async function leftLock(accountId: number, mapId: string, list: ChannelInfo[]) {
  const l = (await presenceBackend.getJson<{ mapId: string; roomId: string; ch: number; until: number; travel?: boolean }>(channelLeftKey(accountId))) ?? leftRoom.get(accountId);
  if (!l || l.until <= Date.now()) { leftRoom.delete(accountId); bg(presenceBackend.delete(channelLeftKey(accountId)), "presence"); return null; }
  leftRoom.set(accountId, l);
  return l.mapId === mapId ? list.find((c) => c.roomId === l.roomId && !c.full) ?? null : null;
}
/** Một kênh đang mở: phòng, số kênh, số người (gồm chỗ đã giữ cho người đang vào), tối đa, đầy chưa. */
export interface ChannelInfo { roomId: string; ch: number; n: number; max: number; full: boolean; }
/** Các kênh đang mở của bản đồ `mapId` (danh sách phòng của matchMaker), theo số kênh. */
export async function listChannels(mapId: string): Promise<ChannelInfo[]> {
  const rooms = await matchMaker.query({ name: "map", mapId } as Parameters<typeof matchMaker.query>[0]);
  return rooms.map((r) => ({ roomId: r.roomId, ch: Number(r.metadata?.channel) || 0, n: r.clients, max: r.maxClients, full: r.locked || r.clients >= r.maxClients }))
    .filter((c) => c.ch > 0).sort((a, b) => a.ch - b.ch);
}
/**
 * Kênh để vào bản đồ `mapId` (vào game, đi cổng): vừa rời một kênh của bản đồ này chưa quá CHANNEL_CD giây thì về đúng kênh đó
 * (leftLock); không thì kênh còn chỗ có nhiều đồng đội tổ đội nhất, rồi kênh còn chỗ ít người nhất (bằng nhau thì số kênh nhỏ hơn).
 * Mọi kênh đều đầy thì null: client joinOrCreate và Colyseus mở kênh mới.
 */
export async function pickChannel(accountId: number, mapId: string): Promise<ChannelInfo | null> {
  const list = await listChannels(mapId), back = await leftLock(accountId, mapId, list);
  if (back) return back;
  const open = list.filter((c) => !c.full), mates = party.mateRooms(accountId, mapId);
  open.sort((a, b) => (mates.get(b.roomId) ?? 0) - (mates.get(a.roomId) ?? 0) || a.n - b.n || a.ch - b.ch);
  return open[0] ?? null;
}

// ---------- Giữ chỗ khi vào phòng (matchmake HTTP, #235) ----------
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
async function seatAdd(accountId: number, key: string, until: number, max = Infinity) {
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
async function joinableMap(accountId: number, mapId: string) {
  const [ch, looks, loc] = await Promise.all([store.getCharacter(accountId), store.getLooks(accountId), store.getLocation(accountId)]);
  // Tạo nhân vật trước (tài khoản cũ cũng phải chọn một lần), rồi mới đến lễ thức tỉnh.
  if (!looks.chosen) throw new ServerError(403, "Chưa tạo nhân vật.");
  if (!ch) throw new ServerError(403, "Chưa thức tỉnh võ hồn.");
  // Chỉ vào được phòng của bản đồ đang lưu trong DB; sai thì client hỏi lại /api/me (trả mapId) rồi vào đúng phòng.
  if (loc.mapId !== mapId) throw new ServerError(409, `Sai bản đồ: hồn sư đang ở ${MAPS[loc.mapId].name}.`);
  return { ch, looks, loc };
}
/** mapId client gửi khi vào phòng bản đồ (thiếu thì bản đồ mặc định); không phải bản đồ thường thì null. */
function mapIdIn(v: unknown) {
  const mapId = v ?? DEFAULT_MAP;
  return typeof mapId === "string" && Object.hasOwn(MAPS, mapId) && MAPS[mapId].kind !== "arena" ? mapId : null;
}

/**
 * Mua lại đồ bán nhầm (bước 9.8): BUYBACK_MAX lần bán gần nhất của mỗi tài khoản (mới nhất trước), mức tiến trình theo tài khoản để
 * đi cổng / đổi kênh / vào sân đấu vẫn còn; ghi cả vào presence (`buyback:<acc>`, TTL BUYBACK_TTL_MS, nạp lại lúc vào phòng) để sang phòng ở tiến trình khác vẫn còn; xóa khi người chơi rời game (onLeave không qua đi cổng, forgetBuyback).
 * `item`: bản sao món đã bán (số lượng đã bán, giữ chỉ số / cấp cường hóa), `price`: giá đã nhận mỗi món.
 */
interface Buyback { key: string; item: Item; price: number; }
const buybacks = new Map<number, Buyback[]>();
const BUYBACK_TTL_MS = 6 * 3600 * 1000;
const buybackKey = (accountId: number) => `buyback:${accountId}`;
/** Đọc-sửa-ghi danh sách mua lại ở presence trong một lần khóa (presence là nguồn đúng); cập nhật bản cục bộ theo kết quả. */
export async function editBuyback(accountId: number, edit: (list: Buyback[]) => Buyback[]) {
  let next: Buyback[] = [];
  const ok = await presenceBackend.withLock<Buyback[]>(buybackKey(accountId), `${presenceBackend.workerId}:buyback`, 5000, (old) => { next = edit(old ?? []); return next; }, BUYBACK_TTL_MS);
  if (!ok) throw new Error("Không khóa được danh sách mua lại trong presence.");
  if (next.length) buybacks.set(accountId, next); else buybacks.delete(accountId);
}
/** Lấy món `key` ra khỏi danh sách mua lại ở presence (chỉ một lần gọi nhận được món); null nếu không còn. */
export async function claimBuyback(accountId: number, key: string) {
  let got: Buyback | null = null;
  await editBuyback(accountId, (list) => { got = list.find((x) => x.key === key) ?? null; return list.filter((x) => x.key !== key); });
  return got as Buyback | null;
}


/** Hook test `daily {shift}`: lệch ngày của khảo hạch hằng ngày cho cả tiến trình (MapRoom.dailyDay); chỉ đổi khi GAME_TEST=1. */
let dailyShift = 0;
/** Hook test `tweek {shift}` (#197): lệch số ngày của tuần tông (tongNow, tongWeek) cho cả tiến trình; chỉ đổi khi GAME_TEST=1. */
let tongShift = 0;

export class MapRoom extends Room<MapState> {
  maxClients = CHANNEL_CAP;
  state = new MapState();
  map!: GameMap;
  pdata = new Map<string, PData>();
  bdata = new Map<string, BData>();
  /** Bọc trứng của chiêu có `eggs` (#162, Vạn Chu Phệ; eggs.ts). */
  eggs = new SpiderEggs(this);
  /** Hồn hạch đang nằm dưới đất (bước 5.1): id đồ rơi -> sao và chỉ số đã tung lúc rơi (DropState chỉ đồng bộ sao và bộ). */
  coreDrops = new Map<string, { stars: number; data: CoreData }>();
  /** Chỉ số đã tung của trang bị rơi dưới đất (E2, mục 5.15): khóa = id đồ rơi; `DropState.cset` chỉ giữ chỉ số mẫu trong EQUIP_TEMPLATES. */
  equipDrops = new Map<string, EquipData>();
  projs: Proj[] = [];
  timers: { t: number; fn: () => void }[] = []; // việc hẹn giờ (các nhát của hồn kỹ liên hoàn), chạy trong tick
  /** Lưới không gian và lọc đồng bộ theo vùng gần (11.4, interest.ts). */
  interest!: Interest;
  /** Vùng lưu lại trên mặt đất do chiêu hồn thú để lại (#161, ground.ts). */
  grounds = new Grounds(this);
  /** Hồn thú có thể đang báo trước chiêu (thêm ở beginCast; activeCasts bỏ dần mục đã tung / bị ngắt / hồn thú đã mất). Tự săn né (#218). */
  casting = new Set<string>();
  /** Tầng Hàn của Cực Hàn và Hỏa Đàn (#163, cold.ts). */
  cold = new ColdStacks(this);
  /** Vùng ngập luân phiên và xoáy nước của Thủy Triều Dâng (#174, tide.ts; vùng là vùng lưu lại của ground.ts). */
  tide = new Tide(this);
  /** Hang chia phần luân phiên của Lưỡng Nghi Luân Chuyển / tơ Vạn Chu Phệ (#173, split.ts; phần đang hóa là vùng lưu lại của ground.ts). */
  split = new LairSplit(this);
  /** Giây tới lần gửi tin `mini` (bản đồ nhỏ, SYNC_VIEW.mini) kế tiếp. */
  miniT = 0; fogT = 0; fogSendT = 0;
  /** PERF_LOG=1: đo thời gian tick / bản vá, ghi log mỗi 10 giây (đo hiệu năng 11.4). */
  perf = { n: 0, tick: 0, patch: 0, max: 0, at: Date.now() };
  /**
   * PERF_LOG=1: cộng dồn như `perf` từ lần đặt lại gần nhất của hook test `perf` (#218: bot đo từng pha); `auto`: phần trong AutoHunter.tick
   * (gồm cả lệnh đánh / hồn kỹ nó phát, như người chơi bấm).
   */
  perfAll = { n: 0, tick: 0, patch: 0, max: 0, auto: 0 };
  perfOn = !!process.env.PERF_LOG;
  /** PERF_LOG=1 (#664): lần lưu định kỳ trong 10 giây: số lần, ms chụp túi (đồng bộ), ms phần đồng bộ của ghi DB, tổng số món túi + trang bị đã chụp. */
  perfSave = { n: 0, snap: 0, store: 0, items: 0 };
  /**
   * PERF_LOG=1, nhịp chậm (#273): mốc thời gian các đoạn của tick (đầu, trước vòng người chơi, trước vòng hồn thú, trước thế giới,
   * trước sinh lại, cuối), CPU luồng chính và mốc của nhịp trước; nhịp chậm chờ in ở nhịp sau (bản ghi GC tới muộn một vòng lặp).
   */
  perfT = [0, 0, 0, 0, 0, 0];
  perfPrev = { t0: 0, t2: 0, c2: 0 };
  perfSlowN = 0;
  /** Nhịp hiện tại (#375): từng lần AutoHunter.tick `[người, ms]` và từng lần tìm đường `[người, ms, số nút/loại]`. */
  perfAuto: [string, number][] = [];
  perfPlan: [string, number, string][] = [];
  /** Nhịp chậm chờ in (cần bản ghi GC của chính nhịp đó). */
  perfPend: { at: string; t0: number; t2: number; wall: number; cpu: number; parts: string; gap: number; gapCpu: number }[] = [];
  /** Lần ghi log gần nhất của mỗi chỗ + lỗi bất ngờ và số lần đã bỏ qua từ đó (onUncaughtException). */
  errLog = new Map<string, { at: number; n: number }>();
  spawnT = 0;
  testRed: number | null = null; // hook test `red` (BĐ6d): cố định số ngẫu nhiên ra hồn thú MAX_YEARS năm ở vùng có mức trên MAX_YEARS
  saveT = 0;
  /** Ô tinh anh (object `elite` của bản đồ, BĐ4): hồn thú đang sống (`bid`), hoặc số giây còn lại trước khi hồi sinh (`t`). */
  elites: { spot: EliteSpot; bid: string | null; t: number }[] = [];
  /**
   * Thú vương của phòng (BĐ5): khung giờ đã lấy suất (không lấy lại trong cùng khung), hồn thú đang sống (null = đã hạ / rút đi) và
   * suất của bản đồ ở mức tiến trình (kingSeats: còn đúng khi phòng bị hủy rồi mở lại).
   */
  king: { slot: number; bid: string | null; seat: KingSeat; claimed: Set<number> } | null = null;
  /** Lần báo trước thú vương gần nhất trên kênh "boss" (mọi bản đồ): gửi lại cho người vào phòng trong lúc chờ, `at` = giờ xuất hiện (ms). */
  bossWarn: (BossEvent & { at: number }) | null = null;
  /** Hook test `day {shift}`: lệch ngày nhận thưởng (ngày) để thử đặt lại lượt lúc 00:00; luôn 0 khi không bật GAME_TEST. */
  dayShift = 0;
  /** Giây tới lần kiểm tra sang ngày mới kế tiếp (đặt lại khảo hạch hằng ngày, tick). */
  dayT = 0;
  /** Lịch boss trên presence (schedule.ts, mục 6): mọi phòng báo cho người chơi của mình; phòng của đúng bản đồ sinh thú vương. */
  bossSub = (ev: BossEvent) => this.onBossEvent(ev);
  /** Thông báo toàn server (presence "announce", mục 6): hiện như tin hệ thống trong chat. */
  announceSub = (m: { text: string }) => this.broadcast("chat", { name: "Hệ thống", text: String(m?.text ?? "") });
  eliteLockSub = (m: { key: string; values: Record<string, number> }) => { if (m?.key && m.values) applyEliteLock(m.key, m.values); };
  /** Đá phiên trùng tài khoản ở mọi phòng (presence, mục 6). */
  /** Tổ đội người chơi (presence PARTY_TOPIC, 7.1): gửi lại khung tổ đội và thông báo cho người của phòng này có trong `to`. */
  partySub = (n: party.PartyNote) => this.partyNote(n);
  /** Đồng bộ snapshot tổ đội giữa các tiến trình; dữ liệu chỉ dùng để dựng khung riêng cho đúng người. */
  partyStateSub = (s: party.PartySnapshot) => party.applySnapshot(s);
  /** Dấu "Tập trung ở đây" (presence RALLY_TOPIC, R6): gửi tin riêng `rally` và một dòng chat hệ thống cho thành viên tổ đội của phòng này. */
  rallySub = (r: party.RallyRoute) => this.rallyNote(r);
  /**
   * Chat xuyên phòng (presence CHAT_TOPIC, #188): gửi tin cho người của phòng này có trong `to`, hoặc đang thuộc tông `tong` (#198,
   * đọc tông lúc nhận nên vừa rời / đổi tông là thôi nhận); không có cả hai thì mọi người. Lọc chặn (#195) đặt ở đây cho mọi kênh.
   */
  chatSub = (r: ChatRoute) => {
    if (!r?.msg) return;
    // Người nhận đã chặn người gửi thì server không gửi (#195), trừ bản sao của chính người gửi.
    const cut = (acc: number | undefined) => acc !== undefined && r.from !== undefined && acc !== r.from && friends.blocked(acc, r.from);
    if (typeof r.tong === "string") {
      for (const c of this.clients) if (this.chatTong(c) === r.tong && !cut(accOf(c))) c.send("chat", r.msg);
      return;
    }
    const to = Array.isArray(r.to) ? r.to : null;
    if (!to) return this.broadcast("chat", r.msg, { except: this.clients.filter((c) => cut(accOf(c))) }); // kênh thế giới
    // Theo tài khoản của phiên (client.auth): cả người xem trận (#278, không có pdata) vẫn nhận tin riêng / tổ đội.
    for (const c of this.clients) {
      const acc = accOf(c);
      if (acc === undefined || !to.includes(acc) || cut(acc)) continue;
      c.send("chat", r.msg);
    }
  };
  /** Bạn bè (presence FRIEND_TOPIC, #195): gửi lại bảng bạn bè và thông báo cho người của phòng này có trong `to`. */
  friendSub = (n: FriendNote) => this.friendNote(n);
  /** Tông môn của phiên `c` cho chat tông (#198): hồn sư trong phòng đọc `pdata` (đổi tông có hiệu lực ngay); người xem trận không có
   *  pdata (#278) thì theo tông lúc vào phòng (client.auth). */
  chatTong(c: Client): string | null {
    const d = this.pdata.get(c.sessionId);
    return d ? d.tong : tongDef((c.auth as AuthData | undefined)?.tong?.tong)?.id ?? null;
  }
  partyT = 0;
  /** Khung giờ đang lấy suất thú vương (đặt trước `await takeKingSeat`): tin `spawn` tới trùng không lấy thêm suất / sinh thêm thú vương. */
  kingTaking = 0;
  channelT = 0;
  kickSub = (m: { accountId: number; sessionId: string }) => {
    for (const other of this.clients) if (other.sessionId !== m.sessionId && (other.auth as AuthData)?.accountId === m.accountId) other.leave(4001);
  };

  /**
   * Đá phiên cũ của tài khoản (ở mọi phòng) và chờ nó nhả tài khoản, tức là lần ghi cuối của nó (onLeave nối vào chuỗi lưu) đã
   * xong, rồi mới cho onAuth nạp DB. Không chờ thì phiên mới nạp bản cũ, phiên cũ lưu sau, và lần lưu kế tiếp của phiên mới
   * ghi đè làm mất tiến độ (mục 6).
   */
  async waitOldSession(accountId: number, sessionId: string) {
    const key = accountLeaseKey(accountId), old = await presenceBackend.get(key);
    if (!old) return;
    this.presence.publish("kick", { accountId, sessionId });
    for (let t = 0; t < HOLD_WAIT_MS; t += 50) {
      await new Promise((r) => setTimeout(r, 50));
      if ((await presenceBackend.get(key)) !== old) return;
    }
    throw new ServerError(503, "Phiên trước của tài khoản chưa lưu xong, hãy thử lại sau giây lát.");
  }

  /** Phiên `sessionId` giữ tài khoản (lease `account:<acc>` trong presence) và đá phiên khác của tài khoản ở mọi phòng (mục 6). */
  holdAccount(accountId: number, sessionId: string) {
    const leave = (code: number) => this.clients.getById(sessionId)?.leave(code);
    void presenceBackend.acquireLease(accountLeaseKey(accountId), this.leaseOwner(sessionId), PRESENCE_TTL_MS).then((ok) => {
      if (!ok) leave(4001);
    }).catch((e) => { console.error(`Không ghi được phiên giữ tài khoản #${accountId}`, e); leave(1011); });
    this.presence.publish("kick", { accountId, sessionId });
  }

  /** Nhả tài khoản sau lần ghi cuối của phiên `sessionId` (chỉ khi phiên đó vẫn đang giữ). */
  async releaseAccount(accountId: number, sessionId: string) {
    // Redis mất thì không chặn onLeave / onDispose (lần ghi cuối đã xong, tắt server vẫn phải thoát): lease tự hết TTL, phiên mới chờ qua waitOldSession.
    try { await presenceBackend.releaseLease(accountLeaseKey(accountId), this.leaseOwner(sessionId)); }
    catch (e) { console.error(`Không nhả được phiên giữ tài khoản #${accountId} (lease tự hết hạn sau ${PRESENCE_TTL_MS / 1000} giây)`, e); }
  }

  leaseOwner(sessionId: string) { return `${this.roomId}:${sessionId}`; }

  /** Đọc võ hồn ra trận, ngoại hình, vị trí; từ chối nếu chưa được vào phòng này. */
  checkJoin(accountId: number) { return joinableMap(accountId, this.state.mapId); }

  /**
   * Trước khi Colyseus tìm / mở kênh và giữ chỗ (joinOrCreate, joinById; #235): token hợp lệ, chưa giữ quá SEAT_PENDING_MAX chỗ, bản đồ
   * xin vào có thật và đúng bản đồ đang lưu, đã có hồn sư. Client chưa xác thực không chiếm chỗ, không mở được kênh mới. onAuth của
   * phòng vẫn kiểm lại tất cả lúc mở WebSocket (token có thể vừa hết hạn, phiên cũ vừa đi cổng).
   */
  static async onAuth(_token: string, options: { token?: unknown; mapId?: unknown }) {
    const mapId = mapIdIn(options?.mapId);
    return seatAccount(options?.token, mapId, (id) => {
      if (!mapId) throw new ServerError(400, "Bản đồ không tồn tại.");
      return joinableMap(id, mapId);
    });
  }

  /**
   * SeatPass được giữ chỗ ở phòng này không: bản đồ đã kiểm ở static onAuth phải là bản đồ của phòng (joinById vào kênh bản đồ khác thì
   * không). ArenaRoom: chỉ thành viên của trận.
   */
  seatAllowed(pass: SeatPass): boolean | Promise<boolean> { return pass.mapId === this.state.mapId; }

  /**
   * Giữ chỗ từ matchmake: bỏ SeatPass (authData của static onAuth) để onAuth của phòng chạy lúc mở WebSocket (Colyseus bỏ qua onAuth của
   * phòng khi chỗ giữ có authData), và đổi chỗ tạm của SeatPass thành sessionId trong bảng chỗ giữ (giữ không được thì bỏ cả hai).
   */
  protected override async _reserveSeat(sessionId: string, joinOptions?: unknown, authData?: unknown, seconds = this.seatReservationTime,
    allowReconnection?: boolean, devModeReconnection?: boolean) {
    const pass = authData as Partial<SeatPass> | undefined;
    if (typeof pass?.seatFor !== "number" || typeof pass.key !== "string") {
      return super._reserveSeat(sessionId, joinOptions, authData, seconds, allowReconnection, devModeReconnection);
    }
    const acc = pass.seatFor;
    await seatUsed(acc, pass.key);
    if (!await this.seatAllowed(pass as SeatPass)) return false;
    await seatAdd(acc, sessionId, Date.now() + seconds * 1000);
    const ok = await super._reserveSeat(sessionId, joinOptions, undefined, seconds, allowReconnection, devModeReconnection);
    if (!ok) await seatUsed(acc, sessionId);
    return ok;
  }

  async onAuth(client: Client, options: { token?: string }) {
    const acc = options?.token ? await store.accountFromToken(options.token) : null;
    if (!acc) throw new ServerError(401, "Phiên đăng nhập không hợp lệ.");
    await seatUsed(acc.accountId, client.sessionId);
    // Kiểm tra trước khi đá phiên cũ: lần vào bị từ chối không được đá phiên đang chơi. Chờ xong thì đọc và kiểm tra lại
    // (phiên cũ có thể vừa đi cổng xong, đổi map_id).
    await this.checkJoin(acc.accountId);
    await this.waitOldSession(acc.accountId, client.sessionId);
    const [{ ch, looks, loc }, owned] = await Promise.all([this.checkJoin(acc.accountId), store.listVohons(acc.accountId)]);
    // Vừa tự rời một kênh khác của bản đồ này (không qua đổi kênh), hoặc vừa đi cổng / đổi kênh tới kênh server chọn: chỉ được vào kênh
    // đó tới hết CHANNEL_CD giây (leftRoom).
    const back = this.state.channel ? await leftLock(acc.accountId, this.state.mapId, await listChannels(this.state.mapId)) : null;
    if (back && back.roomId !== this.roomId) {
      const l = leftRoom.get(acc.accountId)!, wait = Math.ceil((l.until - Date.now()) / 1000);
      throw new ServerError(409, l.travel ? `Hãy vào kênh ${back.ch} (kênh server đã chọn) hoặc chờ ${wait} giây.` : `Vừa rời kênh ${back.ch}: vào lại kênh ${back.ch} hoặc chờ ${wait} giây.`);
    }
    const auth: AuthData = { accountId: acc.accountId, ch: owned.find((v) => v.rowId === ch.rowId) ?? ch, owned, team: [], looks, loc,
      bag: { items: [], honTe: 0 }, starter: false, claims: { day: this.today(), n: 0 }, wclaims: { day: this.today(), n: 0 }, shardBuy: { day: this.today(), n: 0 }, wps: [],
      auto: { settings: null, day: "", used: 0, bonus: 0 }, tong: { tong: null, at: null }, social: { friends: [], blocks: [], fans: [] } };
    if (!owned.includes(auth.ch)) owned.push(auth.ch);
    // Đội hình (tài khoản cũ được tự xếp trong store). Bỏ ô trỏ tới võ hồn không còn sở hữu; võ hồn ra trận luôn nằm trong đội.
    const team = (await store.getTeam(acc.accountId)).map((r) => (owned.some((v) => v.rowId === r) ? r : 0));
    if (!team.includes(auth.ch.rowId)) {
      const first = owned.find((v) => team.includes(v.rowId));
      if (first) auth.ch = first; else team[0] = auth.ch.rowId;
    }
    auth.team = team;
    // Túi đồ nạp sau mọi bước kiểm tra; tài khoản chưa nhận vật phẩm khởi đầu thì nhận ngay trong lần nạp này (một lần, ghi DB).
    const loaded = await store.loadBag(acc.accountId, STARTER_ITEMS.flatMap((s) => itemStacks(s.code, s.qty)));
    auth.bag = loaded.bag; auth.starter = loaded.starter;
    // Lượt nhận rương thú vương hôm nay (BĐ5): để nhắc "hết lượt" khi vào giao chiến; lúc nhận thì DB kiểm tra lại.
    auth.claims.n = await store.bossClaims(acc.accountId, auth.claims.day, BOSS_CLAIM_KING);
    auth.wclaims.n = await store.bossClaims(acc.accountId, auth.wclaims.day, BOSS_CLAIM_WORLD); // boss thế giới (BĐ6e)
    auth.shardBuy.n = await store.bossClaims(acc.accountId, auth.shardBuy.day, SHARD_BUY.claimKind); // Thương hội đổi mảnh (#282)
    auth.wps = await store.getWaypoints(acc.accountId); // truyền tống trận đã mở (11.2)
    auth.auto = await store.getAuto(acc.accountId); // cài đặt và giờ treo tự săn (Auto 1)
    // tông môn (#196); bạn bè và chặn (#195)
    [auth.tong, auth.social] = await Promise.all([store.getTong(acc.accountId), store.getSocial(acc.accountId)]);
    return auth;
  }

  async onCreate(options: { mapId?: unknown }) {
    // Client gửi mapId lấy từ /api/me (bản đồ đang lưu); thiếu thì dùng bản đồ mặc định. onAuth đối chiếu với DB.
    // Sân Đại Đấu Hồn Trường (kind `arena`, 7.2) chỉ phòng ArenaRoom mở.
    const mapId = mapIdIn(options?.mapId);
    if (!mapId) throw new ServerError(400, "Bản đồ không tồn tại.");
    // Số kênh (1, 2, 3…) của phòng trong bản đồ: đồng bộ cho client ("Kênh N") và ghi vào metadata để liệt kê / chọn kênh. Chỉ phòng
    // bản đồ mới là kênh; sân Đại Đấu Hồn Trường (ArenaRoom, gọi thẳng setup) giữ `channel` = 0: không chia kênh, không khóa kênh.
    this.state.channel = await takeChannel(mapId, this.roomId);
    this.setMetadata({ channel: this.state.channel });
    await this.setup(mapId);
  }

  /**
   * Lỗi bất ngờ trong handler message, hẹn giờ của clock, vòng tick, onAuth / onJoin / onLeave (Colyseus tự bọc khi phòng có hàm
   * này): chỉ ghi log, không để lỗi lọt ra uncaughtException của tiến trình (@pm2/io, phụ thuộc gián tiếp của @colyseus/core, thoát
   * tiến trình khi có lỗi đó; #164). Từ chối bằng ServerError (onAuth / onCreate) là bình thường, không ghi. Cùng một chỗ, cùng dòng
   * mã ném lỗi chỉ ghi tối đa một lần mỗi ERR_LOG_MS (lỗi lặp lại không làm ngập log).
   */
  onUncaughtException(err: RoomException, method: string) {
    if (err.cause instanceof ServerError) return;
    if (method === "onLeave" || method === "onDispose") saveStats.failed++;
    const where = err instanceof OnMessageException ? `${method} "${err.type}"` : method, now = Date.now();
    // Cùng chỗ, cùng dòng mã ném lỗi (khung đầu của stack; nội dung lỗi có thể chứa giá trị thay đổi theo từng lần).
    const frame = (err.cause instanceof Error ? err.cause : err).stack?.split("\n")[1]?.trim() ?? err.message;
    const key = `${where}|${frame}`, last = this.errLog.get(key);
    if (last && now - last.at < ERR_LOG_MS) { last.n++; return; }
    if (this.errLog.size >= 100) this.errLog.clear(); // không để Map lớn dần theo số loại lỗi
    this.errLog.set(key, { at: now, n: 0 });
    const who = err instanceof OnMessageException ? ` từ ${err.client.sessionId}` : "";
    console.error(`Lỗi ở ${where}${who} (phòng ${this.roomId}${last?.n ? `, bỏ ${last.n} lần ghi trước` : ""}):`, err.cause ?? err);
  }

  /** Nạp bản đồ, sinh hồn thú / tinh anh / thú vương, bật vòng lặp, nghe presence và đăng ký message (ArenaRoom dùng lại, 7.2). */
  async setup(mapId: string) {
    await loadKingState(mapId);
    await loadEliteLocks(mapId);
    this.map = loadMap(mapId);
    this.state.mapId = mapId;
    const file = mapFile(mapId); if (file !== mapId) this.state.mapFile = file; // 11.3 / 11.5: bản dựng bằng tools/maps (mặc định, trừ MAP_V1)
    // Ghi mapId vào listing để filterBy(["mapId"]) ghép đúng phòng cả khi phòng được mở mà không có mapId trong tham số.
    this.listing.mapId = mapId;
    this.interest = new Interest(this.state, this.map.MW * TILE, this.map.MH * TILE);
    const { zones } = this.map;
    // Thành không có hồn thú (mục 5.3).
    if (this.map.kind !== "town") for (let z = 0; z < zones.length; z++) for (let i = 0; i < zones[z].count; i++) this.spawnBeast(z);
    // Mỗi vùng 1 tinh anh (mục 5.4): sinh ngay khi mở phòng, không báo (chưa có ai trong phòng).
    if (this.map.kind !== "town") { this.elites = this.map.elites.map((spot) => ({ spot, bid: null, t: 0 })); this.elites.forEach((_, i) => this.spawnElite(i, false)); }
    // Bản vá state gửi ngay sau mỗi nhịp (11.1), không theo hẹn giờ riêng: hai hẹn giờ lệch pha làm input chờ thêm gần một chu kỳ
    // mới tới client (đo được khoảng 107 ms → còn khoảng nửa nhịp), và mỗi bản vá luôn mang đúng một bước mô phỏng.
    this.patchRate = 0; // 0 = Colyseus không tự gửi bản vá
    // Lọc đồng bộ theo vùng gần (11.4): cập nhật view từng client sau tick, ngay trước bản vá.
    if (this.perfOn) watchGc();
    this.setSimulationInterval((ms) => {
      const t0 = performance.now(), c0 = this.perfOn ? cpuMs() : 0;
      this.tick(Math.min(ms, 100) / 1000);
      const ti = this.perfOn ? performance.now() : 0;
      this.interest.update(this.clients);
      const t1 = performance.now();
      this.broadcastPatch();
      if (this.perfOn) this.perfLog(t0, t1, performance.now(), c0, ti);
    }, 1000 / TICK_RATE);
    this.presence.subscribe("kick", this.kickSub);
    this.presence.subscribe(BOSS_TOPIC, this.bossSub);
    this.presence.subscribe(ANNOUNCE_TOPIC, this.announceSub);
    this.presence.subscribe(ELITE_LOCK_TOPIC, this.eliteLockSub);
    this.presence.subscribe(party.PARTY_TOPIC, this.partySub);
    this.presence.subscribe(party.PARTY_STATE_TOPIC, this.partyStateSub);
    this.presence.subscribe(party.RALLY_TOPIC, this.rallySub);
    this.presence.subscribe(CHAT_TOPIC, this.chatSub);
    this.presence.subscribe(FRIEND_TOPIC, this.friendSub);
    // Phòng mở ra trong lúc khung giờ thú vương đang diễn ra (mục 6): nhận lại suất của phòng cũ đã hủy (đã hạ / rút đi thì không có
    // con mới; còn sống thì về với thời gian còn lại), không thì sinh con mới với thời gian còn lại của khung.
    const now = Date.now(), active = kingSlotNow(mapId, now);
    if (active) await this.spawnKing(active.slot, (active.until - now) / 1000);
    // Phòng mở ra trong 5 phút chờ cũng có đếm ngược: báo trước đã phát (kể cả hook test), không có thì tính từ lịch (kingNext).
    const off = bossOffset(now), next = kingNext(now + off) - off;
    const remoteWarn = await presenceBackend.getJson<BossEvent & { at: number }>(`king-warn:${mapId}`);
    if (remoteWarn) kingWarns.set(mapId, remoteWarn);
    this.bossWarn = kingWarns.get(mapId) ?? [...kingWarns.values()].at(-1) ?? null;
    if (this.bossWarn && this.bossWarn.at <= now) this.bossWarn = null;
    if (!this.bossWarn && next - now <= KING.warnSecs * 1000) {
      const m = MAPS[mapId].king ? MAPS[mapId] : Object.values(MAPS).filter((x) => x.king).at(-1);
      if (m?.king) this.bossWarn = { mapId: m.id, king: m.king, phase: "warn", slot: next, in: (next - now) / 1000, life: KING.lifeSecs, at: next };
    }
    // Boss thế giới (BĐ6e): 5 phút trước 21:00 mọi phòng mới mở cũng có đếm ngược (không trùng giờ thú vương).
    const wNext = worldNext(now + off) - off, wm = MAPS[mapId].world?.length ? MAPS[mapId] : Object.values(MAPS).find((x) => x.world?.length);
    if (!this.bossWarn && wm && wNext - now <= WORLD.warnSecs * 1000)
      this.bossWarn = { mapId: wm.id, king: worldBossOn(wm.id, wNext + off)!, phase: "warn", slot: wNext, in: (wNext - now) / 1000, life: WORLD.lifeSecs, at: wNext };

    this.onMessage("input", (c, m: { x: number; y: number; s?: number; w?: unknown }) => {
      const d = this.pdata.get(c.sessionId); if (!d || d.travelling) return;
      const x = numIn(m?.x), y = numIn(m?.y);
      // Tự săn (mục 5.13): tay luôn được ưu tiên, bấm đi thì tắt tự động; hướng 0 (nhả phím, client gửi lại) thì bỏ qua để tự săn đi tiếp.
      if (d.auto && Math.hypot(x, y) > MOVE_DEAD) this.autoStop(c.sessionId, "bạn tự di chuyển.");
      if (!d.auto) this.applyInput(d, x, y, !!m?.w); // 11.1: giữ Shift thì đi bộ cả khi ngoài giao chiến
      // Số thứ tự input của client đang dự đoán chuyển động (mục 6): chỉ để client đối chiếu, vị trí vẫn do tick() tính.
      const p = this.state.players.get(c.sessionId), s = Math.floor(numIn(m?.s));
      if (p) { if (s > 0 && s <= 0xffffffff) p.seq = s; p.seqT = 0; }
    });
    // Đánh, hồn kỹ, Chân Thân, kỹ năng hồn cốt do người chơi tự bấm thì tắt tự săn trước (tay ưu tiên); tự săn gọi thẳng các hàm này.
    this.onMessage("attack", (c) => { this.autoHand(c.sessionId); manualAttack(this, c.sessionId); });
    this.onMessage("target", (c, m: { id?: unknown }) => targetMsg(this, c.sessionId, m?.id)); // khoá mục tiêu (M3 #750)
    this.onMessage("skill", (c, m: { i: number }) => { this.autoHand(c.sessionId); this.skill(c, intIn(m?.i)); });
    this.onLimitedMsg("social", "loadout", (c, m: { rowId: number; skills: unknown }) => this.setLoadout(c, intIn(m?.rowId), m?.skills)); // 8.1a
    this.onMessage("chanthan", (c) => { this.autoHand(c.sessionId); this.chanThan(c); }); // 8.1a: Võ Hồn Chân Thân (phím R)
    this.onMessage("boneskill", (c, m: { i: number }) => { this.autoHand(c.sessionId); this.boneSkill(c, intIn(m?.i)); });
    this.onMessage("fusion", (c, m: { op: unknown }) => { this.autoHand(c.sessionId); this.fusionAction(c.sessionId, strIn(m?.op)); }); // Võ Hồn Dung Hợp Kỹ (#192)
    this.onMessage("auto", (c, m: { op?: unknown; cfg?: unknown }) => this.autoAction(c.sessionId, m?.op, m?.cfg)); // tự săn (Auto 1)
    this.onLimitedMsg("read", "offline", (c) => { const d = this.pdata.get(c.sessionId); if (d) { d.offAsk = true; this.sendOffline(c.sessionId); } }); // Auto 3
    this.onBagMsg("absorb", (c, m: { itemId: unknown; vohonId: unknown }) => this.tryAbsorb(c, m?.itemId, m?.vohonId));
    this.onBagMsg("pickup", (c) => this.pickup(c.sessionId));
    this.onBagMsg("discard", (c, m: { id: unknown }) => this.discardItem(c.sessionId, m?.id));
    this.onBagMsg("sortbag", (c) => this.sortBag(c.sessionId)); // sắp xếp + gộp chồng cả túi (#215)
    this.onBagMsg("lock", (c, m: { id: unknown }) => this.lockItem(c.sessionId, m?.id)); // khoá / mở khoá một ô (#216)
    this.onBagMsg("autosell", (c, m: { cfg: unknown }) => this.setAutoSell(c.sessionId, m?.cfg)); // bộ lọc tự bán (#216)
    this.onLimitedMsg("read", "vohons", (c) => this.ask(c.sessionId, "vohons", () => this.sendVohons(c)));
    this.onLimitedMsg("read", "fog", (c) => this.ask(c.sessionId, "fog", () => this.sendFog(c.sessionId))); // client xin lại cả bitset (R8); nội dung tin bị bỏ, server tự quyết ô nào đã khám phá
    this.onLimitedMsg("read", "stats", (c, m: { rowId?: unknown }) => { const d = this.pdata.get(c.sessionId); if (d) d.statsRow = m?.rowId; this.ask(c.sessionId, "stats", () => this.sendStats(c.sessionId, this.pdata.get(c.sessionId)?.statsRow)); }); // lần xin dồn trong ASK_CD: gửi võ hồn xin gần nhất // bảng nhân vật (UI-2): chỉ số tổng hợp do server tính
    this.onLimitedMsg("read", "boss", (c) => { // #118: client xin tin boss lúc vào phòng (sau khi đã nghe tin); tối đa 1 lần / giây, xin dồn thì bỏ
      const d = this.pdata.get(c.sessionId), now = Date.now();
      if (!d || now - d.bossAskAt < 1000) return;
      d.bossAskAt = now; this.sendBossJoin(c);
    });
    this.onLimitedMsg("social", "team", (c, m: { slots: unknown }) => this.setTeam(c, m?.slots));
    this.onLimitedMsg("social", "switch", (c, m: { slot: number }) => { // tự đổi võ hồn khi đang tự săn: tự săn thôi đổi về võ hồn cũ
      const a = this.pdata.get(c.sessionId)?.auto; if (a) a.home = null;
      this.switchSlot(c, intIn(m?.slot));
    });
    this.onMessage("test", (c, m: unknown) => this.testHook(c, m));
    this.onMessage("gm", (c, m: { cmd?: unknown }) => this.gmAction(c.sessionId, m?.cmd)); // lệnh GM của tài khoản admin (#518)
    this.onLimitedMsg("social", "travel", (c, m: { portal: string }) => this.travel(c, strIn(m?.portal)));
    this.onLimitedMsg("social", "wp", (c, m: { op: unknown; key: unknown }) => this.waypointAction(c.sessionId, m?.op, m?.key)); // truyền tống trận (11.2)
    this.onLimitedMsg("social", "channels", (c) => this.sendChannels(c)); // danh sách kênh của bản đồ (mục 6 "Nhiều kênh")
    this.onLimitedMsg("social", "channel", (c, m: { ch: unknown }) => this.switchChannel(c, m?.ch)); // đổi kênh trong cùng bản đồ
    this.onMessage("bag", (c) => this.ask(c.sessionId, "bag", () => this.sendBag(c.sessionId, true))); // client xin: cả túi, theo nhịp ASK_CD (#165)
    this.onBagMsg("use", (c, m: { id: unknown; vohonId?: unknown }) => this.useItem(c.sessionId, m?.id, m?.vohonId));
    this.onBagMsg("open", (c, m: { id: unknown }) => this.openChest(c.sessionId, m?.id)); // mở rương thú vương (BĐ5)
    this.onBagMsg("unlock", (c, m: { vohon: unknown }) => this.unlockVohon(c.sessionId, m?.vohon));
    this.onBagMsg("starup", (c, m: { vohon: unknown }) => this.starUp(c.sessionId, m?.vohon));
    this.onBagMsg("equip", (c, m: { itemId: unknown; vohonId: unknown; slot: unknown }) => this.equipBone(c.sessionId, m?.itemId, m?.vohonId, m?.slot));
    this.onBagMsg("unequip", (c, m: { itemId: unknown }) => this.unequipBone(c.sessionId, m?.itemId));
    this.onBagMsg("equipgear", (c, m: { id: unknown }) => this.equipGear(c.sessionId, m?.id));
    this.onBagMsg("unequipgear", (c, m: { slot: unknown }) => this.unequipGear(c.sessionId, m?.slot));
    this.onBagMsg("equipenh", (c, m: { id: unknown; charm: unknown }) => this.equipEnhance(c.sessionId, m?.id, m?.charm === true)); // cường hóa trang bị ở Thợ rèn (E3)
    this.onBagMsg("equipsynth", (c, m: { main: unknown; sacrifice: unknown }) => this.equipSynth(c.sessionId, m?.main, m?.sacrifice)); // hợp thành 3 → 1 (E4)
    this.onBagMsg("equipsalvage", (c, m: { ids: unknown }) => this.salvageEquip(c.sessionId, m?.ids)); // phân giải hàng loạt (E4)
    this.onBagMsg("equipenhpreview", (c, m: { id: unknown }) => this.equipEnhancePreview(c.sessionId, m?.id));
    this.onBagMsg("equipluck", (c, m: { id: unknown }) => this.equipLuck(c.sessionId, m?.id)); // khắc may mắn bằng Thần Hồn ở Thợ rèn
    this.onBagMsg("equipluckpreview", (c, m: { id: unknown }) => this.equipLuckPreview(c.sessionId, m?.id));
    this.onBagMsg("equipcore", (c, m: { itemId: unknown; vohonId: unknown; slot: unknown }) => this.equipCore(c.sessionId, m?.itemId, m?.vohonId, m?.slot));
    this.onBagMsg("unequipcore", (c, m: { itemId: unknown }) => this.unequipCore(c.sessionId, m?.itemId));
    this.onBagMsg("enhance", (c, m: { targetId: unknown; materialIds: unknown }) => this.enhanceBone(c.sessionId, m?.targetId, m?.materialIds));
    this.onBagMsg("enhancecore", (c, m: { targetId: unknown; materialIds: unknown }) => this.enhanceCore(c.sessionId, m?.targetId, m?.materialIds));
    this.onBagMsg("coreset", (c, m: { id: unknown; set: unknown; npc: unknown }) => this.resetCoreSet(c.sessionId, m?.id, m?.set, m?.npc));
    this.onLimitedMsg("read", "talk", (c, m: { npc: unknown }) => this.talkNpc(c.sessionId, m?.npc)); // NPC (6.1)
    this.onLimitedMsg("social", "tong", (c, m: { op: unknown; tong: unknown; chain?: unknown }) => this.tongAction(c.sessionId, m?.op, m?.tong, m?.chain)); // tông môn (#196, #197)
    // `npc` (#111): mã thương nhân client đang mở hộp thoại (thiếu thì thương nhân gần nhất).
    this.onLimitedMsg("trade", "buy", (c, m: { code: unknown; qty: unknown; npc: unknown }) => this.buyItem(c.sessionId, m?.code, m?.qty, m?.npc));
    this.onLimitedMsg("trade", "sell", (c, m: { id: unknown; qty: unknown; npc: unknown }) => this.sellItem(c.sessionId, m?.id, m?.qty, m?.npc));
    this.onLimitedMsg("trade", "shardbuy", (c, m: { vohon: unknown; qty: unknown; npc: unknown }) => this.buyShards(c.sessionId, m?.vohon, m?.qty, m?.npc)); // #282
    this.onLimitedMsg("trade", "looks", (c, m: { looks: unknown; npc?: unknown }) => this.changeLooks(c.sessionId, m?.looks, m?.npc)); // đổi ngoại hình ở thợ may (L4 #511)
    this.onLimitedMsg("read", "shardinfo", (c) => this.sendShardInfo(c.sessionId)); // #282: số mảnh đã đổi hôm nay cho trang Thương hội
    this.onLimitedMsg("trade", "buyback", (c, m: { key: unknown; npc: unknown }) => { void this.buybackItem(c.sessionId, m?.key, m?.npc).catch((e) => console.error("Lỗi mua lại", e)); }); // mua lại đồ vừa bán (9.8)
    this.onLimitedMsg("trade", "expand", (c, m: { npc: unknown }) => this.expandBag(c.sessionId, m?.npc)); // mở rộng túi (9.8)
    this.onLimitedMsg("social", "party", (c, m: unknown) => { void this.partyAction(c.sessionId, m); }); // tổ đội người chơi (7.1)
    this.onLimitedMsg("social", "rally", (c, m: unknown) => this.rallyAction(c.sessionId, m)); // đánh dấu "Tập trung ở đây" cho tổ đội (R6 #433)
    this.onLimitedMsg("social", "quest", (c, m: { op: unknown; chain: unknown }) => this.questAction(c.sessionId, m?.op, m?.chain)); // nhiệm vụ (6.2; `chain` = khảo hạch hằng ngày)
    this.onLimitedMsg("social", "arena", (c, m: { op: unknown; roomId?: unknown }) => this.arenaAction(c.sessionId, m?.op, m?.roomId)); // Đại Đấu Hồn Trường (7.2)
    this.onLimitedMsg("read", "resonance", (c, m: { op?: unknown; page?: unknown; pageSize?: unknown }) => {
      if (m?.op === "top") return this.resonanceTop(c.sessionId, m.page, m.pageSize);
      this.sendRes(c.sessionId, [], true);
    }); // cộng minh (8.2): bảng tiến độ riêng; op=top là bảng xếp hạng
    this.onMessage("chat", (c, m: unknown) => this.chatAction(c.sessionId, m)); // chat bản đồ / tổ đội / riêng / thế giới (#188)
    this.onMessage("friend", (c, m: unknown) => this.friendAction(c.sessionId, m)); // bạn bè và chặn (#195)
  }

  onJoin(client: Client, _o: unknown, auth: AuthData) {
    const { ch, owned, team, looks, loc, bag } = auth;
    // Một tài khoản chỉ được vào một lần: giữ tài khoản cho phiên này, đá phiên cũ ở mọi phòng (kể cả phòng này). onAuth đã
    // chờ phiên cũ lưu xong; lần đá này chặn hai lần vào gần như cùng lúc.
    if (this.state.channel) { leftRoom.delete(auth.accountId); bg(presenceBackend.delete(channelLeftKey(auth.accountId)), "presence"); } // đã vào được (đúng kênh vừa rời, hoặc qua đường server duyệt): bỏ khóa kênh
    const leaseOwner = this.leaseOwner(client.sessionId);
    this.holdAccount(auth.accountId, client.sessionId);
    void presenceBackend.getJson<Buyback[]>(buybackKey(auth.accountId)).then((list) => { if (list?.length) buybacks.set(auth.accountId, list); else buybacks.delete(auth.accountId); })
      .catch((e) => console.error(`Không đọc được danh sách mua lại của #${auth.accountId}`, e));
    void presenceBackend.getJson<number>(fusionKey(auth.accountId)).then((t) => { if (t && t > Date.now()) fusionReady.set(auth.accountId, t); })
      .catch((e) => console.error(`Không đọc được hồi chiêu dung hợp của #${auth.accountId}`, e));
    void presenceBackend.getJson<number>(worldChatKey(auth.accountId)).then((t) => { if (t) worldMark(auth.accountId, t); })
      .catch((e) => console.error(`Không đọc được hồi kênh thế giới của #${auth.accountId}`, e));
    const p = new PlayerState();
    p.name = ch.name; this.showVohon(p, ch);
    p.sex = looks.sex; p.hair = looks.hair; p.hairCol = looks.hairCol; p.outfitCol = looks.outfitCol; p.skin = looks.skin; p.lpc = looks.lpc ? encodeLpc(looks.lpc) : "";
    gearLook(p, bag.items.filter((i) => i.equipSlot !== undefined));
    // Vị trí đã lưu; chưa có, kẹt trong ô chặn hoặc ngoài bản đồ thì về `spawn` (mục 6).
    const pos = loc.x !== null && loc.y !== null && this.map.standable(loc.x, loc.y) ? { x: loc.x, y: loc.y } : this.spawnPoint();
    p.x = pos.x; p.y = pos.y;
    const d: PData = { accountId: auth.accountId, leaseOwner, leaseT: PRESENCE_HEARTBEAT_MS, owned, team, ch, ringYears: [...ch.rings], input: { x: 0, y: 0 }, dir: { x: 1, y: 0 }, walk: false,
      target: "", atk: 0, speed: 0, atkCd: 0, inv: 1.5, lastHit: 99, deadT: 0, absorbing: null, testRoll: null, testShard: null, testBone: null, testCore: null, testHerb: null, looksN: looks.changes, looksBusy: false, shardBusy: false, mpF: 0, hpF: 0, fight: 99,
      benchHp: new Map(), down: new Map(), dirty: new Set(), squadKey: "", squadT: 0,
      saving: Promise.resolve(), teamQueued: false, tradeQueued: false, latest: new Map(), portalKey: "", travelCast: null, travelling: false, travelled: false, gmReset: false, gmMarked: false, chListAt: 0, chListQueued: false, bossAskAt: 0, msgLimit: process.env.GAME_TEST !== "1", msgTok: newMsgBuckets(), msgOver: 0, msgOverAt: 0, msgGone: false, statsRow: undefined, askAt: new Map(), askQueued: new Set(),
      wps: new Set(auth.wps), wpKey: "", fog: null, fogAdd: [], fogDirty: false,
      energy: new Map(), shield: 0, shieldT: 0, buffs: new Map(), lei: 0, leiQueued: false, lastSkill: null,
      bag: bag.items.filter((i) => i.equipSlot === undefined), gear: bag.items.filter((i) => i.equipSlot !== undefined), gearSt: gearStats(bag.items.filter((i) => i.equipSlot !== undefined)), honTe: bag.honTe, bagSlots: bagSlotsOf(bag.slots), bagDirty: false, bagSent: null, bagBuyback: "",
      sellCfg: parseSell(bag.sell), sold: bag.sold ?? [], sellCheck: true, sellSent: "", soldN: 0, soldCoins: 0, autoSold0: [0, 0], danCd: 0, starterNote: auth.starter, st: new Map(), dotT: 0, hanT: 0, charm: null,
      claims: auth.claims, wclaims: auth.wclaims, shardBuy: { ...auth.shardBuy, pend: 0 }, claimBusy: 0, lockIds: new Set(), enhBusy: false, salvAt: 0, testSyn: null, testEnh: null, testEnhSlow: 0, testEquip: null, testClaimHold: false, testTravelLost: false, testChest: null, passive: { buff: {}, resist: {} },
      coreFx: {}, crit: 0, critMult: 1, combo: 0, comboT: 99, haste: 0, shockMpCd: 0, partyKey: "",
      quest: bag.quests?.find((q) => q.chain === QUEST_STARTER) ?? questStart(QUEST_STARTER),
      chains: QUESTS.filter((c) => c.id !== QUEST_STARTER).map((c) => bag.quests?.find((q) => q.chain === c.id) ?? questStart(c.id)), ...this.dailyOf(bag.quests), ...this.tongTasksOf(bag.quests), tongBoardAt: 0, tongPend: [],
      res: { prog: [], lv: [], bonus: resonanceBonus([]) }, resKey: "", ava: null, avaCd: new Map(), fus: null, skCd: new Map(), arenaBusy: false, arenaTopAt: 0, arenaLiveAt: 0, arenaWatchAt: 0, resonanceTopAt: 0, arenaGone: false,
      auto: null, autoCfg: parseAuto(auth.auto.settings), autoDay: this.today(), autoUsed: auth.auto.day === this.today() ? auth.auto.used : 0,
      autoBonus: auth.auto.bonus, autoDirty: false, autoTok: AUTO_MSG_RATE.burst, autoTokAt: Date.now(), autoSetPend: null, autoRealRate: false, autoPace: [0, 0], autoHintC: null, offMsg: null, offAsk: false,
      tong: tongDef(auth.tong.tong)?.id ?? null, tongAt: auth.tong.at };
    p.tong = d.tong ? TONG_MON.findIndex((t) => t.id === d.tong) + 1 : 0;
    this.pdata.set(client.sessionId, d);
    this.state.players.set(client.sessionId, p);
    this.state.online = this.state.players.size;
    this.rebindContrib(client.sessionId, auth.accountId); // #119: đóng góp boss theo tài khoản, vào lại không mất
    this.interest.join(client, p); // 11.4: view riêng, chỉ thực thể ở gần (state đầy đủ đầu tiên gửi sau onJoin)
    const filled = this.fillBoneSubs(d); // #187: tung bù dòng phụ hồn cốt cũ một lần (trước khi tính chỉ số)
    this.resCheck(client.sessionId, false); // cộng minh (8.2) tính trước chỉ số ban đầu, không báo mốc
    this.recalc(client.sessionId, true);
    if (filled) this.save(client.sessionId); // ghi ngay qua chuỗi lưu để lần vào sau không tung lại
    this.fogLoad(client.sessionId); // sương mù khám phá (R8): nạp bitset của bản đồ này rồi mở quanh chỗ đứng
    this.chain(d, () => this.claimOffline(client.sessionId)); // ủy thác offline (Auto 3): nhận thưởng thời gian vắng mặt
    this.questEvent(client.sessionId, { k: "map", map: this.state.mapId }); // 6.2: mục tiêu "đặt chân tới bản đồ"
    this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã tới ${MAPS[this.state.mapId].name}.` }, { except: client });
    // Tổ đội (7.1): có mặt trong game (tổ đội giữ nguyên khi đi cổng); đồng đội ở mọi bản đồ thấy đổi bản đồ / vào lại.
    const online = party.goOnline({ acc: auth.accountId, name: p.name, sid: client.sessionId, mapId: this.state.mapId, roomId: this.roomId,
      ch: this.state.channel, level: p.level, vh: p.vh, hp: p.hp, maxHp: p.maxHp, dead: p.dead });
    this.partyPublish(online);
    this.sendParty(client.sessionId, true);
    // Bạn bè (#195): giữ danh sách vừa nạp; người đã thêm nhau đang trong game thấy mình online / đổi bản đồ, kênh (báo sau khi bảng
    // `Live` của tổ đội đã ghi chỗ mới, vì bảng bạn bè đọc vị trí ở đó).
    friends.enter(auth.accountId, client.sessionId, p.name, auth.social);
    this.friendAfter(online, auth.accountId);
  }

  /**
   * Boss cho người vừa vào (BĐ5, #118): client xin bằng tin `boss` sau khi dựng cảnh (tin gửi ngay lúc onJoin tới trước khi client nghe
   * nên bị bỏ). Người vào giữa lúc chờ thì nhận đếm ngược còn lại (`join`: client không lặp log / banner); thú vương / boss thế giới
   * đang ở bản đồ này thì nhận thời gian trước khi rút đi, đồng hồ nổi giận, điểm yếu, chỗ nổi lên của Du Thủy và chiêu toàn sàn đang
   * báo trước (`t` giây còn lại, `warn` cả chiêu).
   */
  sendBossJoin(client: Client) {
    const w = this.bossWarn;
    if (w && w.at > Date.now()) client.send("boss", { ...this.bossMsg(w, "warn", (w.at - Date.now()) / 1000), join: true });
    const bid = this.king?.bid, kb = bid ? this.state.beasts.get(bid) : undefined, bd = bid ? this.bdata.get(bid) : undefined, kd = bd?.elite?.king;
    // `here`: client chỉ đặt đồng hồ / điểm yếu / chỗ nổi lên của Du Thủy khi có cờ này (như tin "spawn" ở đúng bản đồ).
    if (kb && kd) client.send("boss", { k: "here", here: true, bid, name: beastName(kb.rank, kb.species), mapId: this.state.mapId, mapName: MAPS[this.state.mapId].name, life: kd.life,
      phase: kd.phase, title: kd.phase === 2 ? (kd.world ? "Nổi giận" : kd.def.phase2?.name) : "", ...this.worldInfo(kd) });
    // Chiêu toàn sàn đang báo trước (#118): người vừa vào cũng thấy vùng và vòng an toàn (thời gian còn lại) để kịp né.
    const kc = kb && kd?.world ? bd?.cast : undefined;
    if (kc?.def.floor) client.send("fx", { k: "tele", bid, name: kc.def.name, ...kc.teles[0], parts: kc.teles.slice(1), t: kc.t, warn: kc.def.warn, ...(kc.safe ? { safe: kc.safe } : {}) });
  }

  async onLeave(client: Client) {
    const id = client.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    this.interest.leave(id);
    if (p && d) {
      // Client đã đi: dừng mọi tiến độ ngay (hấp thụ dở bị hủy). Không dừng thì trong lúc chờ ghi DB, tick vẫn có thể hấp thụ
      // xong hay đạn còn bay hạ hồn thú, cộng vào nhân vật sau khi write() đã chụp dữ liệu, rồi mất khi pdata bị xóa.
      if (d.absorbing) { d.absorbing = null; p.absorb = 0; }
      const zone = this.offlineZone(id); // ủy thác offline (Auto 3): chụp chỗ đứng trước khi freeze
      this.freeze(id);
      // Tổ đội (7.1): vẫn trong đội PARTY_OFFLINE_SECS giây (đi cổng, vào lại); quá thì party.sweep cho ra khỏi đội.
      const offline = party.goOffline(d.accountId, id, Date.now());
      this.partyPublish(offline);
      // Bạn bè (#195): người đã thêm nhau thấy mình rời phòng (đi cổng / đổi kênh thì onJoin của phòng mới báo bản đồ / kênh mới;
      // không tới được phòng mới thì vẫn đúng là ngoại tuyến), sau khi `Live` đã ghi rời phòng. Lần ghi bạn bè còn trong chuỗi lưu.
      this.friendAfter(offline, d.accountId, id);
      // Nối vào chuỗi lưu: chờ mọi lần ghi trước (kể cả transaction đi cổng) rồi mới xét. Đã đi cổng thành công thì
      // không ghi gì nữa; transaction lỗi hoặc chưa đi cổng thì lưu như thường (có lớp chặn WHERE map_id).
      await this.chain(d, async () => {
        if (d.travelled || d.gmReset) return;
        await this.write(id, true);
        // Ủy thác offline (Auto 3, mục 5.13): rời game (không qua cổng / đổi kênh / vào sân đấu) khi đứng trong vùng săn thì ghi vùng và
        // thời điểm (đồng hồ server; hook test `offline` lùi thời điểm), sau lần ghi cuối để giờ treo trong ngày đã lưu.
        if (!zone || d.arenaGone) return;
        const ago = testOfflineAgo.get(d.accountId) ?? 0; testOfflineAgo.delete(d.accountId);
        await store.startOffline(d.accountId, { mapId: this.state.mapId, zone: zone.name, at: Date.now() - ago * 1000, day: d.autoDay, used: d.autoUsed });
      });
      if (!d.travelled) this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã rời ${MAPS[this.state.mapId].name}.` });
      if (!d.travelled && !d.arenaGone) this.forgetBuyback(d.accountId); else buybacks.delete(d.accountId); // rời game: thương nhân quên đồ vừa bán (9.8); sang phòng khác (có thể tiến trình khác): bản ở presence là bản đúng, nạp lại lúc vào
      // Rời không qua đi cổng / đổi kênh: khóa vào lại đúng kênh này CHANNEL_CD giây (trước khi nhả tài khoản cho phiên mới).
      if (this.state.channel && !d.travelled && !testNoLeaveLock.delete(d.accountId)) {
        const lock = { mapId: this.state.mapId, roomId: this.roomId, ch: this.state.channel, until: Date.now() + CHANNEL_CD * 1000 };
        leftRoom.set(d.accountId, lock); bg(presenceBackend.putJson(channelLeftKey(d.accountId), lock, CHANNEL_CD * 1000), "presence");
      }
    }
    this.state.players.delete(id);
    this.state.online = this.state.players.size;
    this.pdata.delete(id);
    // Lần ghi cuối đã xong: phiên mới của tài khoản (đang chờ trong onAuth) được nạp DB.
    const accountId = d?.accountId ?? (client.auth as AuthData | undefined)?.accountId;
    if (!d && accountId !== undefined) friends.leave(accountId, id); // người xem trận (#278) không có pdata
    if (accountId !== undefined) await this.releaseAccount(accountId, id);
  }

  async onDispose() {
    this.presence.unsubscribe("kick", this.kickSub);
    this.presence.unsubscribe(BOSS_TOPIC, this.bossSub);
    this.presence.unsubscribe(ANNOUNCE_TOPIC, this.announceSub);
    this.presence.unsubscribe(ELITE_LOCK_TOPIC, this.eliteLockSub);
    this.presence.unsubscribe(party.PARTY_TOPIC, this.partySub);
    this.presence.unsubscribe(party.PARTY_STATE_TOPIC, this.partyStateSub);
    this.presence.unsubscribe(party.RALLY_TOPIC, this.rallySub);
    this.presence.unsubscribe(CHAT_TOPIC, this.chatSub);
    this.presence.unsubscribe(FRIEND_TOPIC, this.friendSub);
    // Redis lỗi không được bỏ qua lần ghi DB cuối của người còn trong phòng: lỗi presence chỉ ghi log.
    if (this.state.channel) await releaseChannel(this.state.mapId, this.roomId, this.state.channel).catch((e) => console.error("Không trả kênh trong presence", e));
    for (const [id, d] of this.pdata) { const offline = party.goOffline(d.accountId, id, Date.now()); this.partyPublish(offline); this.friendAfter(offline, d.accountId, id); }
    // Trả suất thú vương (BĐ5): phòng mở lại trong cùng khung giờ nhận lại đúng trạng thái (đã hạ / rút đi / còn sống tới lúc rút đi).
    const ks = this.king?.seat;
    if (ks?.owner === this.roomId) {
      const kd = this.king?.bid ? this.bdata.get(this.king.bid)?.elite?.king : undefined;
      if (ks.state === "alive" && kd) ks.leaveAt = Date.now() + kd.life * 1000;
      ks.owner = null;
      await persistKingSeat(this.state.mapId, this.king!.slot, ks, this.king!.claimed).catch((e) => console.error("Không trả suất thú vương trong presence", e));
    }
    await Promise.all([...this.pdata.entries()].map(async ([id, d]) => {
      await this.chain(d, () => (d.travelled ? undefined : this.write(id, true)));
      await this.releaseAccount(d.accountId, id);
    }));
  }

  // ---------- Nhân vật ----------
  spawnPoint() {
    const { spawn } = this.map;
    for (let k = 0; k < 30; k++) {
      const x = spawn.x + 8 + Math.random() * (spawn.w - 16), y = spawn.y + 8 + Math.random() * (spawn.h - 16);
      if (!this.map.hits(x, y, 5, 4)) return { x, y };
    }
    return { x: spawn.x + spawn.w / 2, y: spawn.y + spawn.h / 2 };
  }

  recalc(id: string, full: boolean) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    const cores = this.coresOn(d, d.ch.rowId);
    const s = calcStats(p.vh, p.level, [...p.rings], d.ch.stars, this.boneBonusOf(d, d.ch.rowId), this.withGear(d, coreBonus(cores)), d.res.bonus, herbBonus(d.ch.herbs));
    p.maxHp = s.maxHp; p.maxMp = s.maxMp; d.atk = s.atk; d.speed = s.speed; d.crit = s.crit; d.critMult = s.critMult;
    if (d.ava?.row === d.ch.rowId) p.maxHp = Math.round(s.maxHp * (1 + (d.ava.stats.hp ?? 0))); // Võ Hồn Chân Thân (8.1a)
    d.passive = bonePassive(this.bonesOn(d, d.ch.rowId)); // bị động hồn cốt (4.3) theo võ hồn ra trận
    d.coreFx = coreFx(cores); // hiệu ứng bộ hồn hạch (5.2) theo võ hồn ra trận
    p.xpNeed = xpBlocked(p.level, p.rings.length) ? 0 : xpNeed(p.level);
    if (full) { d.hpF = p.maxHp; d.mpF = p.maxMp; }
    d.hpF = Math.min(d.hpF, p.maxHp); d.mpF = Math.min(d.mpF, p.maxMp);
    p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
  }

  /** Hiện võ hồn `ch` lên trạng thái đồng bộ (người khác thấy võ hồn ra trận, cấp, hồn hoàn). */
  showVohon(p: PlayerState, ch: Character) {
    p.vh = Math.max(0, vohonIndex(ch.vohon)); p.level = ch.level; p.xp = ch.xp; p.kills = ch.kills;
    p.rings.clear(); ch.rings.forEach((y) => p.rings.push(tierOfYears(y)));
  }

  /** Chép tiến độ đang chơi vào võ hồn ra trận (d.ch). */
  syncCh(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    Object.assign(d.ch, { level: p.level, xp: p.xp, rings: [...d.ringYears], kills: p.kills });
  }

  /**
   * Nối một lần ghi DB vào chuỗi lưu của người chơi (mục 6 "Lưu của mỗi người chơi chạy nối tiếp"). Lỗi được ghi log và
   * không làm gãy chuỗi; promise trả về luôn resolve.
   */
  chain(d: PData, fn: () => unknown) {
    // Sau `/gm preset` (gmReset) mọi lần ghi xếp thêm bị bỏ: chụp túi / Hồn Tệ cũ trong RAM sẽ đè mức vừa áp (#518).
    d.saving = d.saving.then(() => (d.gmReset ? undefined : fn())).then(() => {}, (e) => { saveStats.failed++; console.error(`Lưu dữ liệu tài khoản #${d.accountId} thất bại`, e); });
    return d.saving;
  }

  /**
   * Như chain, nhưng gộp theo khóa `key`: đã có một lần ghi `key` đang chờ trong chuỗi thì chỉ thay hàm của nó bằng `fn` mới nhất,
   * không nối thêm. Message gửi dồn (xếp ô hồn kỹ, đổi võ hồn ra trận qua đội hình) không làm chuỗi lưu và số lần ghi DB tăng theo
   * số message (#164).
   */
  chainLatest(d: PData, key: string, fn: () => unknown) {
    const queued = d.latest.has(key);
    d.latest.set(key, fn);
    if (!queued) this.chain(d, () => { const f = d.latest.get(key)!; d.latest.delete(key); return f(); });
  }

  /** Lưu định kỳ / sau sự kiện quan trọng: xếp vào chuỗi lưu, chụp dữ liệu lúc tới lượt. */
  save(id: string) {
    const d = this.pdata.get(id); if (!d) return Promise.resolve();
    return this.chain(d, () => this.write(id));
  }

  /** Chụp tiến độ chưa lưu: võ hồn ra trận và các võ hồn khác vừa nhận kinh nghiệm chia cho đội (xóa đánh dấu `dirty`). */
  unsaved(id: string) {
    const d = this.pdata.get(id)!;
    this.syncCh(id);
    d.dirty.delete(d.ch.rowId);
    const list = [d.ch, ...d.owned.filter((v) => d.dirty.has(v.rowId))].map((v) => ({ ...v, rings: [...v.rings] }));
    d.dirty.clear();
    return list;
  }

  /** Ảnh chụp túi đồ và Hồn Tệ chưa lưu (bỏ đánh dấu `bagDirty`); undefined nếu không đổi gì từ lần lưu trước. */
  unsavedBag(d: PData): Bag | undefined {
    const bag = d.bagDirty || d.tongPend.length ? this.bagSnapshot(d) : undefined;
    if (bag && d.tongPend.length) bag.tongPts = d.tongPend.map((t) => ({ ...t }));
    return bag;
  }
  /** Ảnh chụp cả túi đồ, Hồn Tệ và tiến độ nhiệm vụ (6.2; bỏ đánh dấu `bagDirty`), dù có đổi hay không. */
  bagSnapshot(d: PData): Bag {
    d.bagDirty = false;
    return { honTe: d.honTe, slots: d.bagSlots, items: [...d.bag, ...d.gear].map((i) => ({ ...i, stats: i.stats == null ? null : structuredClone(i.stats) })),
      quests: [d.quest, ...d.chains, ...d.daily, ...d.tongTasks].map((q) => ({ ...q, prog: [...q.prog] })),
      sell: { ...d.sellCfg }, sold: d.sold.map((r) => ({ ...r, item: { ...r.item, stats: r.item.stats == null ? null : structuredClone(r.item.stats) } })) };
  }

  /**
   * Ghi tiến độ võ hồn, vị trí và túi đồ (chỉ gọi trong chuỗi lưu). Vị trí có lớp chặn: chỉ ghi khi DB vẫn ở bản đồ của phòng này.
   * Ghi lỗi thì đánh dấu lại võ hồn không ra trận / túi đồ để lần sau ghi tiếp.
   * `final`: lần ghi cuối khi rời phòng (onLeave / onDispose, không qua cổng / đổi kênh). Bản đồ có MapDef.exit (Lõi Tinh Đấu, BĐ6e):
   * "đăng xuất" ở đây thì ghi như đi cổng (một transaction saveTravel) về điểm `arrive` của cổng tới bản đồ `exit`, lần sau vào ở đó.
   */
  /** Trả true khi dữ liệu đã được ghi (tông vụ #197 chỉ cộng điểm sau lần ghi bài đã trả); lỗi DB thì ném. */
  async write(id: string, final = false): Promise<boolean> {
    const d = this.pdata.get(id), ids = d ? [...d.lockIds] : [];
    if (!d || !ids.length) return this.writeNow(id, final);
    d.lockIds.clear();
    // Khóa Redis theo món (#559): không lấy được thì ném lỗi, chuỗi lưu ghi log; túi vẫn đang bẩn nên lần ghi sau thử lại (món chưa chụp, chưa mất).
    // Lần ghi cuối (`final`: rời phòng / đóng phòng) không có lần sau: chờ khóa có hạn, rồi vẫn ghi không khóa (ghi cảnh báo) để không mất tiến độ;
    // ghi chồng vẫn bị chặn bởi khóa dòng PostgreSQL, `ver` và `Bag.lock`.
    const lockedWrite = () => withItemLocks(presenceBackend, ids, async (g) => { if (!(await g.held())) throw new ItemLockBusy(ids[0]); return this.writeNow(id, final); });
    if (final) {
      for (let k = 0; k < FINAL_LOCK_TRIES; k++) {
        let ran = false;
        try { return await withItemLocks(presenceBackend, ids, async (g) => { if (!(await g.held())) throw new ItemLockBusy(ids[0]); ran = true; return this.writeNow(id, final); }); }
        catch (e) { if (ran) throw e; if (!(e instanceof ItemLockBusy)) break; await new Promise((r) => setTimeout(r, FINAL_LOCK_WAIT_MS)); }
      }
      console.error(`Lần ghi cuối tài khoản #${d.accountId}: không lấy được khóa món, ghi không khóa để không mất tiến độ.`);
      return this.writeNow(id, final);
    }
    try { return await lockedWrite(); }
    catch (e) { for (const i of ids) d.lockIds.add(i); throw e; }
  }
  async writeNow(id: string, final = false): Promise<boolean> {
    // Đã đi cổng / đổi kênh (transaction đi cổng là lần ghi cuối của phòng này): không ghi gì nữa.
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelled || d.gmReset) return false;
    await this.flushAuto(d);
    await this.fogFlush(d);
    const exit = final ? MAPS[this.state.mapId].exit : undefined, out = exit ? this.map.portals.find((q) => q.to === exit) : undefined;
    if (out) {
      const list = this.unsaved(id), bag = this.unsavedBag(d);
      try { await store.saveTravel(d.accountId, list, this.state.mapId, out.to, out.ax, out.ay, bag); }
      catch (e) { for (const v of list) if (v.rowId !== d.ch.rowId) d.dirty.add(v.rowId); if (bag) d.bagDirty = true; throw e; }
      d.tongPend.splice(0, bag?.tongPts?.length ?? 0);
      return true;
    }
    // Vị trí, võ hồn và túi trong một transaction có lớp chặn WHERE map_id (#165): DB đã ở bản đồ khác thì không ghi gì, kể cả túi.
    const t0 = this.perfOn ? performance.now() : 0;
    const list = this.unsaved(id), x = p.x, y = p.y, bag = this.unsavedBag(d);
    const t1 = this.perfOn ? performance.now() : 0;
    let saved: boolean;
    try {
      const pr = store.saveProgress(d.accountId, list, this.state.mapId, x, y, d.testLocFile, bag);
      if (this.perfOn) { const f = this.perfSave; f.n++; f.snap += t1 - t0; f.store += performance.now() - t1; f.items += bag?.items.length ?? 0; }
      saved = await pr;
    }
    catch (e) { for (const v of list) if (v.rowId !== d.ch.rowId) d.dirty.add(v.rowId); if (bag) d.bagDirty = true; throw e; }
    if (saved) { d.tongPend.splice(0, bag?.tongPts?.length ?? 0); return true; }
    // Lưới an toàn: beginTravel đã đọc lại DB khi đi cổng báo lỗi nên đường thường không tới đây. Nếu tới thì ngắt client để vào lại đúng
    // bản đồ trong DB (/api/me), thay vì ở lại phòng mà mọi lần lưu sau đều bị bỏ.
    console.error(`Bỏ lần lưu tài khoản #${d.accountId}: DB không còn ở bản đồ ${this.state.mapId}; ngắt kết nối để vào lại.`);
    this.log(id, "Dữ liệu nhân vật đã ở bản đồ khác: hãy vào lại game.", "#ff8a8a");
    this.clients.getById(id)?.leave(4003);
    return false;
  }

  /**
   * Tin riêng "stats" (bảng nhân vật, UI-2): chỉ số tổng hợp của võ hồn `rowId` của mình (thiếu / lạ: võ hồn ra trận), đúng công thức
   * server dùng khi đánh (calcStats với hồn cốt, hồn hạch, cộng minh, tiên thảo gắn trên võ hồn đó; võ hồn ra trận đang hóa Chân Thân
   * thì sinh lực nhân thêm như recalc). `base`: chỉ số khi không gắn hồn cốt / hồn hạch, để client hiện phần cộng thêm. Client chỉ hiển thị.
   */
  sendStats(id: string, rowId: unknown) {
    const d = this.pdata.get(id), c = this.clients.getById(id); if (!d || !c) return;
    const v = d.owned.find((x) => x.rowId === rowId) ?? d.ch;
    if (v === d.ch) this.syncCh(id);
    const vh = Math.max(0, vohonIndex(v.vohon)), rings = v.rings.map(tierOfYears), herbs = herbBonus(v.herbs);
    const total = calcStats(vh, v.level, rings, v.stars, this.boneBonusOf(d, v.rowId), this.coreBonusOf(d, v.rowId), d.res.bonus, herbs);
    const base = calcStats(vh, v.level, rings, v.stars, {}, {}, d.res.bonus, herbs);
    const gear = { bonus: d.gearSt.bonus, weapon: d.gearSt.weapon, red: d.gearSt.red, luck: d.gearSt.luck }; // trang bị hồn sư (5.15): `total` đã gồm phần cộng này
    if (d.ava?.row === v.rowId) total.maxHp = Math.round(total.maxHp * (1 + (d.ava.stats.hp ?? 0))); // như recalc
    c.send("stats", { rowId: v.rowId, total, base, gear });
  }

  /** Sinh lực tối đa của một võ hồn sở hữu (dù đang ra trận hay không), kể cả hồn cốt (4.2), hồn hạch (5.2) đang gắn, cộng minh (8.2) và tiên thảo (BĐ6b). */
  maxHpOf(d: PData, v: Character) {
    return calcStats(Math.max(0, vohonIndex(v.vohon)), v.level, v.rings.map(tierOfYears), v.stars, this.boneBonusOf(d, v.rowId), this.coreBonusOf(d, v.rowId),
      d.res.bonus, herbBonus(v.herbs)).maxHp;
  }

  /**
   * Cộng minh (bước 8.2, mục 5.10): tính lại tiến độ 5 trụ cột từ dữ liệu sẵn có của tài khoản (mọi võ hồn sở hữu: cấp, số hồn
   * hoàn; hồn cốt / hồn hạch đang gắn trên võ hồn của mình). Võ hồn ra trận đọc tiến độ đang chơi (p.level, d.ringYears). Số mốc
   * đổi thì tính lại chỉ số võ hồn ra trận (võ hồn khác tính khi cần qua maxHpOf / calcStats nên đổi vào sau cũng đúng), gửi lại
   * sinh lực đội; `announce` thì báo từng mốc mới đạt (log + `ev` trong tin riêng "resonance") và mốc bị mất (tháo đồ). Tiến độ đổi
   * thì gửi lại tin "resonance". Gọi khi nạp tài khoản và sau mọi thay đổi liên quan: lên cấp (ra trận / trong đội), hấp thụ, mở
   * võ hồn, gắn / tháo / cường hóa / nâng cấp đồ đang gắn (afterBones), hook test.
   */
  resCheck(id: string, announce = true) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const mine = new Set(d.owned.map((v) => v.rowId)), worn = d.bag.filter((i) => i.vohonId !== null && mine.has(i.vohonId));
    const prog = resonanceProgress({
      vohons: d.owned.map((v) => (v === d.ch ? { level: p.level, rings: d.ringYears.length, stars: v.stars } : { level: v.level, rings: v.rings.length, stars: v.stars })),
      bones: worn.filter((i) => i.code === BONE_ITEM).map((i) => ({ enhance: i.enhance })),
      cores: worn.filter((i) => i.code === CORE_ITEM).map((i) => ({ stars: i.stars ?? 1 })) });
    const lv = resonanceLevels(prog), old = d.res.lv, changed = lv.some((x, i) => x !== (old[i] ?? 0));
    d.res = { prog, lv, bonus: resonanceBonus(lv) };
    const ev: { pillar: number; step: number; up: boolean }[] = [];
    if (changed) {
      if (d.hpF > 0) { this.recalc(id, false); this.sendSquad(id, true); } // lúc vào phòng (chưa có sinh lực) onJoin tự recalc
      if (announce) RESONANCE.forEach((r, i) => {
        const a = old[i] ?? 0, b = lv[i];
        for (let s = a; s < b; s++) {
          ev.push({ pillar: i, step: s, up: true });
          this.log(id, `Cộng minh ${r.name} đạt mốc ${s + 1}/${r.steps.length} (${r.steps[s].need} ${r.what}): mọi võ hồn ${resonanceText(r.steps[s].bonus)}.`, r.col);
        }
        if (b < a) {
          ev.push({ pillar: i, step: b, up: false });
          this.log(id, `Cộng minh ${r.name} còn ${b}/${r.steps.length} mốc (${prog[i]} ${r.what}): mất phần cộng của mốc ${b + 1}${a - b > 1 ? `–${a}` : ""}.`, "#ffb35c");
        }
      });
    }
    this.sendRes(id, ev);
  }

  /** Tin riêng "resonance" (8.2): tiến độ, số mốc đã đạt từng trụ cột, tổng % đang cộng; chỉ gửi khi đổi, có `ev` hoặc `force`. */
  sendRes(id: string, ev: { pillar: number; step: number; up: boolean }[] = [], force = false) {
    const d = this.pdata.get(id); if (!d) return;
    const msg = { prog: d.res.prog, lv: d.res.lv, bonus: d.res.bonus }, key = JSON.stringify(msg);
    if (!force && !ev.length && key === d.resKey) return;
    d.resKey = key;
    this.clients.getById(id)?.send("resonance", ev.length ? { ...msg, ev } : msg);
  }

  /** Tin riêng "resonanceTop": xếp hạng công khai chỉ có tên hiển thị / điểm; chi tiết tiến độ và hiệu ứng chỉ trả ở `me`. */
  resonanceTop(id: string, rawPage: unknown, rawPageSize: unknown) {
    const d = this.pdata.get(id); if (!d) return;
    const now = Date.now(); if (now - d.resonanceTopAt < RESONANCE_RANK_CD * 1000) return;
    d.resonanceTopAt = now;
    const page = Math.max(1, intIn(rawPage) || 1);
    const pageSize = Math.max(1, Math.min(RESONANCE_RANK_PAGE_MAX, intIn(rawPageSize) || RESONANCE_RANK_PAGE_SIZE));
    store.resonanceTop(page, pageSize, d.accountId).then((t) => {
      this.clients.getById(id)?.send("resonanceTop", {
        page: t.page, pageSize: t.pageSize, total: t.total, hasNext: t.hasNext,
        list: t.list.map((r) => ({ name: r.name, score: r.score, milestones: r.milestones, me: r.accountId === d.accountId })),
        me: t.me,
      });
    }, (e) => console.error("Không đọc được bảng xếp hạng cộng minh", e));
  }

  // ---------- Võ hồn sở hữu và đội hình ----------
  /**
   * Danh sách võ hồn và đội hình chỉ gửi riêng cho chính chủ, không nằm trong state đồng bộ (mục 6). `fcd`: giây hồi chiêu Võ Hồn Dung
   * Hợp Kỹ còn lại của hồn sư (#193; chỉ khi > 0), để ô hồi chiêu đúng sau khi đổi kênh / đi cổng / vào lại.
   */
  sendVohons(c: Client) {
    const d = this.pdata.get(c.sessionId); if (!d) return;
    this.syncCh(c.sessionId);
    const fcd = Math.round(fusionCdLeft(d.accountId) * 10) / 10;
    c.send("vohons", { active: d.ch.rowId, team: [...d.team],
      list: d.owned.map((v) => ({ rowId: v.rowId, vohon: v.vohon, level: v.level, xp: v.xp, stars: v.stars, rings: [...v.rings],
        skills: loadoutOf(v.vohon, v.skills), herbs: { ...v.herbs } })), ...(fcd > 0 ? { fcd } : {}) });
    this.sendSquad(c.sessionId, true);
  }

  /**
   * Tin riêng "squad": sinh lực từng võ hồn trong đội, võ hồn đã gục và số giây còn lại trước khi hồi, năng lượng tiên cơ `en`,
   * có đang giao chiến không (đồng hồ hồi chỉ chạy ngoài trận). Chỉ gửi khi nội dung đổi (`force` thì gửi luôn); tick kiểm tra định kỳ.
   */
  sendSquad(id: string, force = false) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const list = d.team.flatMap((r) => {
      const v = d.owned.find((o) => o.rowId === r); if (!v) return [];
      const maxHp = v === d.ch ? p.maxHp : this.maxHpOf(d, v), down = d.down.get(r);
      const hp = v === d.ch ? p.hp : down !== undefined ? 0 : Math.ceil(Math.min(maxHp, d.benchHp.get(r) ?? maxHp));
      return [{ rowId: r, hp, maxHp, down: down !== undefined ? Math.max(1, Math.ceil(down)) : 0, en: Math.floor(d.energy.get(r) ?? 0) }];
    });
    const msg = { combat: d.fight < TEAM_COMBAT_SECS, list }, key = JSON.stringify(msg);
    if (!force && key === d.squadKey) return;
    d.squadKey = key;
    this.clients.getById(id)?.send("squad", msg);
  }

  /** Xếp đội hình (thay võ hồn khác vào đội, đổi chỗ, bỏ ra): chỉ khi ngoài giao chiến. Client gửi đủ TEAM_SIZE ô. */
  setTeam(c: Client, slots: unknown) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    // Từ chối thì gửi lại đội hình đang lưu để client bỏ thay đổi vừa làm.
    const deny = (text: string) => { this.log(id, text, "#ffb35c"); this.sendVohons(c); };
    const team = parseTeam(slots);
    if (!team) return deny("Đội hình không hợp lệ.");
    if (team.some((r) => r && !d.owned.some((v) => v.rowId === r))) return deny("Bạn không sở hữu võ hồn này.");
    if (team.every((r, i) => r === d.team[i])) return this.sendVohons(c);
    if (p.dead) return deny("Đã gục ngã, không thể đổi đội hình.");
    if (d.absorbing) return deny("Đang hấp thụ hồn hoàn, không thể đổi đội hình.");
    if (d.fight < TEAM_COMBAT_SECS) return deny(`Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới đổi đội hình được.`);
    // Võ hồn ra trận bị bỏ khỏi đội thì võ hồn chưa gục ở ô đầu tiên còn lại ra trận.
    const nextId = team.includes(d.ch.rowId) ? d.ch.rowId : team.find((r) => r > 0 && !d.down.has(r));
    if (!nextId) return deny("Đội phải còn ít nhất một võ hồn chưa gục.");
    d.team = team;
    for (const r of d.energy.keys()) if (!team.includes(r)) d.energy.delete(r); // rời đội thì mất năng lượng tiên cơ
    if (nextId !== d.ch.rowId) this.activate(id, d.owned.find((v) => v.rowId === nextId)!);
    this.persistTeam(d);
    this.sendVohons(c);
  }

  /** Đổi sang võ hồn ở ô `slot` của đội, được cả khi đang đánh (mục 5.1 "Trong trận"); mỗi lần đổi hồi SWITCH_CD giây. */
  switchSlot(c: Client, slot: number) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || d.travelling || !(Number.isInteger(slot) && slot >= 0 && slot < TEAM_SIZE)) return;
    const next = d.owned.find((v) => v.rowId === d.team[slot]);
    if (!next) return this.log(id, `Ô ${slot + 1} của đội đang trống. Nhấn V để xếp đội hình.`, "#ffb35c");
    if (next === d.ch) return;
    if (p.dead) return this.log(id, "Đã gục ngã, không thể đổi võ hồn.", "#ffb35c");
    if (d.absorbing) return this.log(id, "Đang hấp thụ hồn hoàn, không thể đổi võ hồn.", "#ffb35c");
    const down = d.down.get(next.rowId);
    if (down !== undefined) return this.log(id, `${VOHON[Math.max(0, vohonIndex(next.vohon))].name} đã gục: hồi lại sau ${Math.ceil(down)} giây ngoài trận hoặc khi về doanh trại.`, "#ffb35c");
    if (p.swCd > 0) return; // client hiện hồi chiêu đổi trên thanh đội hình
    this.activate(id, next);
    p.swCd = SWITCH_CD;
    if (d.fight < TEAM_COMBAT_SECS) this.questEvent(id, { k: "switch" }); // 6.2: đổi tay khi đang giao chiến
    // Bộ hồn hạch Lưu Ly 4 món (5.2): đổi tay võ hồn mang bộ vào thì cả đội tăng công (hiệu ứng có lợi của hồn sư) một lúc.
    // Đọc lại bộ của võ hồn vừa vào trận để hiệu ứng vẫn đúng ngay cả khi recalc trước đó chưa cập nhật cache coreFx.
    const sa = coreFx(this.coresOn(d, next.rowId)).swapAtk;
    if (sa) {
      const cur = d.buffs.get("atk"), col = CORE_SETS[coreSetIndex("luu_ly")].col;
      d.buffs.set("atk", { t: Math.max(cur?.t ?? 0, CORE_FX_RULE.swapSecs), v: Math.max(cur?.v ?? 0, sa) });
      this.syncBuffs(p, d); this.broadcast("fx", { k: "buff", id, col });
      this.log(id, `Bộ Lưu Ly: cả đội tăng ${Math.round(sa * 100)}% công trong ${CORE_FX_RULE.swapSecs} giây.`, col);
      if (!this.map.inSafe(p.x, p.y)) this.partyShare(id, { buff: { atk: sa }, secs: CORE_FX_RULE.swapSecs }, 1, 1, col, d.ch.vohon);
    }
    // Đủ năng lượng thì tung chiêu tiên cơ ngay lúc xuất hiện (chỉ khi đổi tay; tự đổi lúc gục thì giữ năng lượng).
    // Vùng an toàn không giao chiến (mục 5.3): đổi vẫn được nhưng không tung, giữ năng lượng.
    if ((d.energy.get(next.rowId) ?? 0) >= TIEN_CO_MAX) {
      if (this.map.inSafe(p.x, p.y)) this.log(id, "Vùng an toàn: không tung tiên cơ.", "#ffb35c");
      else { d.energy.set(next.rowId, 0); this.tienCo(id); }
    }
    this.persistTeam(d);
    this.sendVohons(c);
  }

  /**
   * Cho võ hồn `next` (trong đội, chưa gục) ra trận: đổi chỉ số, hồn hoàn, phụ thể hiển thị; lưu tiến độ võ hồn vừa rút về.
   * Từ 2.3b mỗi võ hồn giữ sinh lực riêng. Hồn lực thuộc về hồn sư (thiết kế chưa tách theo võ hồn) nên vẫn giữ tỉ lệ như bước 2.2.
   * `text`: thông báo thay câu mặc định.
   */
  activate(id: string, next: Character, text?: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    this.syncCh(id);
    this.endAva(id, ""); // đổi võ hồn (cả khi tự đổi lúc gục) thì Võ Hồn Chân Thân của võ hồn cũ hết (8.1a)
    const prev = d.ch, mpR = d.mpF / Math.max(1, p.maxMp);
    if (d.down.has(prev.rowId)) d.benchHp.delete(prev.rowId); else d.benchHp.set(prev.rowId, d.hpF);
    d.ch = next; d.ringYears = [...next.rings]; d.dirty.delete(next.rowId);
    this.showVohon(p, next);
    this.carrySkillCds(p, d); // 8.1a: hồn kỹ của võ hồn vào trận vẫn giữ hồi chiêu còn lại của nó
    this.recalc(id, false);
    d.hpF = Math.min(p.maxHp, d.benchHp.get(next.rowId) ?? p.maxHp); d.benchHp.delete(next.rowId);
    d.mpF = mpR * p.maxMp; this.recalc(id, false);
    this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 34, col: VOHON[p.vh].col });
    this.log(id, text ?? `${VOHON[p.vh].name} ra trận (cấp ${p.level}, ${p.rings.length} hồn hoàn).`, VOHON[p.vh].col);
    const old = { ...prev, rings: [...prev.rings] };
    this.chainLatest(d, `ch:${old.rowId}`, () => store.saveCharacter(old)); // đổi qua lại dồn dập (đội hình): ghi một lần, bản mới nhất
  }

  /** Lưu đội hình cùng võ hồn ra trận qua chuỗi lưu. Đổi dồn dập thì không ghi chồng: đã có một lần chờ thì lần đó ghi bản mới nhất. */
  persistTeam(d: PData) {
    if (d.teamQueued) return;
    d.teamQueued = true;
    this.chain(d, async () => {
      d.teamQueued = false;
      const ok = await store.saveTeam(d.accountId, [...d.team], d.ch.rowId);
      if (!ok) console.error(`Đội hình của tài khoản #${d.accountId} không hợp lệ, không lưu:`, d.team, d.ch.rowId);
    });
  }

  // ---------- Tự săn (Auto 1, mục 5.13; quyết định ở autoHunt.ts) ----------
  /** Hướng đi của hồn sư như tin `input` (người chơi gửi, hoặc tự săn đặt): kẹp độ dài, cờ đi bộ. Vị trí vẫn do tick() tính. */
  applyInput(d: PData, x: number, y: number, walk: boolean) { d.input = clampDir(x, y); d.walk = walk; }

  /** Người chơi tự bấm đánh / hồn kỹ / Chân Thân / kỹ năng hồn cốt: tay luôn được ưu tiên, tắt tự săn trước. */
  autoHand(id: string) { if (this.pdata.get(id)?.auto) this.autoStop(id, "bạn tự ra đòn."); }

  /**
   * Tin `auto {op, cfg}`: `on` bật với điểm neo là chỗ đang đứng, `off` tắt, `set` đổi cài đặt (kẹp bằng parseAuto), `get` xin trạng
   * thái. Chỉ ở bản đồ săn, ngoài vùng an toàn, không gục / hấp thụ / đi cổng, còn giờ treo hôm nay, túi còn chỗ, ô lưới chưa đủ
   * AUTO_MAX_PER_CELL người treo. Luôn trả tin riêng `auto`.
   */
  autoAction(id: string, op: unknown, cfg: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    // Nhịp riêng theo người chơi (F2 báo cáo soát): vượt thì bỏ tin, không ghi DB / duyệt pdata.
    const now = Date.now(), scale = process.env.GAME_TEST === "1" && !d.autoRealRate ? 1000 : 1; // bot bật / tắt dồn dập: GAME_TEST nới nhịp (hook `test auto {rate}` trả về nhịp thật)
    d.autoTok = Math.min(AUTO_MSG_RATE.burst * scale, d.autoTok + (now - d.autoTokAt) / 1000 * AUTO_MSG_RATE.perSec * scale); d.autoTokAt = now;
    if (d.autoTok < 1) {
      // `set` vượt nhịp: giữ cấu hình cuối, áp một lần khi có token (không để cài đặt cuối bị mất, không tốn DB); tin khác bỏ, trả lại trạng thái thật.
      if (op === "set") {
        const wait = !d.autoSetPend;
        d.autoSetPend = { cfg };
        if (wait) this.clock.setTimeout(() => {
          const pend = d.autoSetPend; d.autoSetPend = null;
          if (pend && this.pdata.get(id) === d) this.autoAction(id, "set", pend.cfg);
        }, Math.ceil((1 - d.autoTok) / AUTO_MSG_RATE.perSec * 1000) + 20);
      } else this.sendAuto(id);
      return;
    }
    d.autoTok -= 1;
    if (op === "set") d.autoSetPend = null; // `set` mới áp ngay thì bỏ cấu hình chờ cũ hơn
    const day = this.today(); if (day !== d.autoDay) { d.autoDay = day; d.autoUsed = 0; d.autoDirty = true; }
    if (op === "off") { if (d.auto) this.autoStop(id, "đã tắt."); else this.sendAuto(id); return; }
    if (op === "set") {
      d.autoCfg = parseAuto(cfg); if (d.auto) d.auto.cfg = d.autoCfg;
      d.autoDirty = true; this.chainLatest(d, "auto", () => this.flushAuto(d)); // gửi dồn: ghi một lần (#164)
      return this.sendAuto(id);
    }
    if (op !== "on" || d.auto) return this.sendAuto(id);
    const deny = (t: string) => { this.log(id, `Không bật được tự động: ${t}`, "#ffb35c"); this.sendAuto(id, t); };
    // #218: cả bản đồ boss (Lõi Tinh Đấu: không có hồn thú thường, tự săn chỉ để đánh boss thế giới).
    if (this.map.kind !== "hunt" && this.map.kind !== "boss") return deny("chỉ tự săn được ở bản đồ săn hoặc bản đồ boss.");
    if (p.dead) return deny("đã gục ngã.");
    if (d.absorbing) return deny("đang hấp thụ hồn hoàn.");
    if (d.travelCast) return deny("đang đi cổng / truyền tống.");
    if (this.map.inSafe(p.x, p.y)) return deny("đang ở vùng an toàn, ra bãi săn rồi bật.");
    if (d.autoUsed >= AUTO_DAILY_SECS && d.autoBonus <= 0) return deny(`hôm nay đã treo đủ ${autoTimeText(AUTO_DAILY_SECS)}.`);
    if (bagUsed(d.bag) >= d.bagSlots && !this.autoSell(id)) return deny(`túi đồ đã đầy (${d.bagSlots} ô)${d.sellCfg.on ? ", không còn món nào hợp bộ lọc tự bán" : ""}.`);
    const grid = this.interest.players, cell = grid.cellOf(p.x, p.y);
    let n = 0; for (const o of this.pdata.values()) if (o.auto && grid.cellOf(o.auto.anchor.x, o.auto.anchor.y) === cell) n++;
    if (n >= AUTO_MAX_PER_CELL) return deny(`chỗ này đã có ${n} người treo, hãy sang chỗ khác.`);
    d.auto = new AutoHunter(this, id, { x: p.x, y: p.y }, d.autoCfg); p.auto = true;
    // Nợ nhịp (AUTO_PACE) còn lại của lượt trước, giảm theo thời gian thật: tắt rồi bật lại không xóa nợ (lách trần tốc độ tự săn).
    d.auto.pace = Math.max(0, d.autoPace[0] - (Date.now() - d.autoPace[1]) / 1000); d.autoSold0 = [d.soldN, d.soldCoins];
    // Đang giữ phím đi thì bỏ hướng đó và tăng `seq` (như hook goto) để client đang dự đoán biết input của nó đã bị bỏ và gửi lại;
    // gửi lại hướng khác 0 là tự di chuyển nên tự săn tắt ngay (tay ưu tiên).
    if (Math.hypot(d.input.x, d.input.y) > MOVE_DEAD) { p.seq = (p.seq + 1) >>> 0; p.seqT = 0; }
    this.applyInput(d, 0, 0, false);
    const where = d.autoCfg.scope === "near" ? `quanh đây (${d.autoCfg.radius} ô)` : "khắp bản đồ";
    this.log(id, `Bật tự động: săn ${where}, còn ${autoTimeText(autoLeft(d.autoUsed, d.autoBonus))} treo. Tự đi / đánh hoặc phím T để tắt.`, "#86e0b0");
    // #218: bản đồ boss không có hồn thú thường: chưa có boss thì chỉ đi dạo chờ, vẫn tính giờ treo.
    if (this.map.kind === "boss" && !this.autoBosses().length)
      this.log(id, "Bản đồ này chưa có boss: tự động chỉ đi dạo chờ boss xuất hiện, vẫn tính giờ treo.", "#ffb35c");
    this.sendAuto(id);
  }

  /** Dừng tự săn của `id` (nếu đang chạy) với lý do `why`: đứng yên, lưu giờ treo trong chuỗi lưu, báo người chơi kèm tổng kết (Auto 2). */
  autoStop(id: string, why: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!d?.auto) return;
    const sum = d.auto.summary(d), sold: [number, number] = [d.soldN - d.autoSold0[0], d.soldCoins - d.autoSold0[1]];
    if (sold[0] > 0) sum.sold = sold; // tự bán trong lượt (#216); Hồn Tệ đã nằm trong sum.coins
    d.autoPace = [d.auto.pace, Date.now()]; d.auto = null; if (p) p.auto = false;
    this.applyInput(d, 0, 0, false);
    d.autoDirty = true; this.chain(d, () => this.flushAuto(d));
    this.log(id, `Đã dừng tự động: ${why}`, "#ffb35c");
    this.sendAuto(id, why, sum);
  }

  /**
   * Tin riêng `auto`: đang bật không, giây treo còn lại (phần còn của hôm nay cộng quỹ Ủy Thác Lệnh), tối đa mỗi ngày, quỹ cộng thêm,
   * cài đặt, lý do vừa dừng / từ chối và tổng kết lượt vừa dừng (nếu có).
   */
  sendAuto(id: string, why?: string, sum?: AutoSummary) {
    const d = this.pdata.get(id); if (!d) return;
    this.clients.getById(id)?.send("auto", { on: !!d.auto, left: autoLeft(d.autoUsed, d.autoBonus), max: AUTO_DAILY_SECS, bonus: Math.floor(d.autoBonus),
      cfg: d.autoCfg, ...(why ? { why } : {}), ...(sum ? { sum } : {}), ...(this.map.kind === "hunt" ? { hint: this.autoHintOf(id) } : {}) });
  }
  /** Gợi ý vùng / khoảng niên hạn hợp sức (AH4, #611) cho võ hồn ra trận của `id` ở bản đồ này (mọi vùng săn có khai báo niên hạn). */
  autoHintOf(id: string): AutoHint | undefined {
    const d = this.pdata.get(id), p = this.state.players.get(id); if (!d || !p) return undefined;
    // Cùng chỉ số võ hồn thì giữ kết quả lần trước: tin `auto` vượt nhịp vẫn được trả lời (sendAuto), không để mỗi tin chạy lại offlineFight (vùng × loài × tìm nhị phân).
    const pw = this.offlinePower(d, p), key = `${pw.atk}|${pw.crit}|${pw.critMult}|${pw.maxHp}|${pw.def}`;
    if (d.autoHintC?.key === key) return d.autoHintC.hint;
    const all = BEASTS.map((b) => b.id);
    const hint = autoHint(pw, this.map.zones.filter((z) => z.years).map((z) =>
      ({ name: z.name, years: z.years!, species: z.beasts.length ? z.beasts.map((b) => BEASTS[b.species].id) : all })));
    d.autoHintC = { key, hint };
    return hint;
  }

  /** Dòng tự săn để lưu (cài đặt, ngày, giờ đã treo, quỹ cộng thêm; làm tròn 0,1 giây). */
  autoRow(d: PData): AutoRow {
    return { settings: d.autoCfg, day: d.autoDay, used: Math.round(d.autoUsed * 10) / 10, bonus: Math.round(d.autoBonus * 10) / 10 };
  }

  /**
   * Dùng Ủy Thác Lệnh (Auto 2): cộng `def.auto` giây vào quỹ giờ treo cộng thêm, tối đa AUTO_BONUS_MAX (đầy thì không dùng, lệnh còn).
   * Túi đã bớt lệnh và quỹ mới ghi cùng một transaction (saveAutoBag) trong chuỗi lưu.
   */
  useAutoToken(id: string, d: PData, it: Item, def: ItemDef) {
    const add = def.auto ?? 0;
    if (d.autoBonus + add > AUTO_BONUS_MAX)
      return this.log(id, `Giờ treo cộng thêm đã có ${autoTimeText(d.autoBonus)}, tối đa ${autoTimeText(AUTO_BONUS_MAX)}: dùng bớt rồi hãy dùng ${def.name}.`, "#ffb35c");
    const day = this.today(); if (day !== d.autoDay) { d.autoDay = day; d.autoUsed = 0; }
    this.takeItem(d, it, 1);
    d.autoBonus += add;
    const p = this.state.players.get(id);
    if (p) this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 22, col: def.col });
    this.log(id, `Dùng ${def.name}: +${autoTimeText(add)} treo tự săn (cộng thêm còn ${autoTimeText(d.autoBonus)}; tổng còn ${autoTimeText(autoLeft(d.autoUsed, d.autoBonus))}).`, def.col);
    this.sendBag(id); this.sendAuto(id);
    this.chain(d, async () => {
      d.autoDirty = false;
      try { await store.saveAutoBag(d.accountId, this.autoRow(d), this.bagSnapshot(d)); }
      catch (e) { d.autoDirty = true; d.bagDirty = true; throw e; }
    });
  }

  /** Ghi cài đặt và giờ treo tự săn nếu đổi từ lần trước (chỉ gọi trong chuỗi lưu). Lỗi thì ghi log, đánh dấu để lần sau ghi lại. */
  async flushAuto(d: PData) {
    if (!d.autoDirty) return;
    d.autoDirty = false;
    try { await store.saveAuto(d.accountId, this.autoRow(d)); }
    catch (e) { d.autoDirty = true; console.error(`Lưu tự săn của tài khoản #${d.accountId} thất bại`, e); }
  }

  // ---------- Ủy thác offline (Auto 3, mục 5.13 "Ủy thác offline"; công thức ở shared/data.ts, mục "Ủy thác offline") ----------
  /** Vùng săn nơi hồn sư `id` đang đứng, nếu thoát ở đây thì được ủy thác: bản đồ săn, ngoài vùng an toàn, không gục, vùng có hồn thú. */
  offlineZone(id: string): Zone | null {
    const p = this.state.players.get(id); if (!p || p.dead || this.map.kind !== "hunt" || this.map.inSafe(p.x, p.y)) return null;
    return this.map.zones.find((z) => z.count > 0 && p.x >= z.x0 && p.x < z.x1 && p.y >= z.y0 && p.y < z.y1) ?? null;
  }

  /**
   * Vào game: lấy và xóa lần ủy thác offline của tài khoản (store.takeOffline, nên một lần thoát chỉ nhận một lần), rồi tính thưởng
   * theo thời gian vắng mặt (đồng hồ server) bằng công thức, không đụng thế giới: giây được tính chia theo ngày giờ Việt Nam, mỗi ngày
   * trong phần còn lại của quỹ AUTO_DAILY_SECS (chung với tự săn online), hết thì dùng tiếp quỹ giờ cộng thêm của Ủy Thác Lệnh (Auto 2),
   * tổng tối đa OFFLINE.maxSecs (offlineSplit). Mỗi con: niên hạn và
   * loài tung như hồn thú của vùng, thời gian hạ theo offlineFight (chỉ số võ hồn ra trận lúc vào); kinh nghiệm, Hồn Tệ, mảnh, tiên thảo,
   * hồn cốt / hồn hạch (theo bộ lọc tự săn `bone` / `core`), hồn hoàn (từ `ring` năm, tối đa OFFLINE.rings) như hạ tay. Túi đầy thì dừng
   * như tự săn (riêng trang bị rơi vào túi đầy thì bị bỏ, không dừng); quỹ hôm nay chỉ trừ phần đã săn. Chỉ gọi trong chuỗi lưu (onJoin xếp vào); ghi DB bằng write() ngay sau đó, gửi tin riêng
   * `offline` (bảng nhận thưởng). Vắng dưới OFFLINE.minSecs hoặc vùng không còn (đổi bản đồ) thì bỏ.
   */
  async claimOffline(id: string) {
    const d0 = this.pdata.get(id); if (!d0 || this.map.kind === "arena") return;
    const row = await store.takeOffline(d0.accountId);
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!row || !p || !d) return;
    const away = Math.max(0, Math.floor((Date.now() - row.at) / 1000)), def = MAPS[row.mapId];
    const zone = def?.kind === "hunt" ? loadMap(row.mapId).zones.find((z) => z.name === row.zone && z.count > 0) : undefined;
    if (away < OFFLINE.minSecs || !zone) return;
    const today = this.today(); if (today !== d.autoDay) { d.autoDay = today; d.autoUsed = 0; d.autoDirty = true; }
    // Auto 2: hết quỹ miễn phí của ngày thì dùng tiếp quỹ giờ cộng thêm (Ủy Thác Lệnh) còn lại lúc nhận (đã trừ phần tự săn online tiêu).
    const parts = offlineSplit(bossNow() + this.dayShift * 86400000, away, row.day, row.used, d.autoBonus);
    const secs = Math.floor(parts.reduce((a, x) => a + x.secs, 0));
    const pw = this.offlinePower(d, p);
    const cfg = d.autoCfg, lv = p.level, got = new Map<string, number>(), rings: number[] = [];
    const add = (name: string, n: number) => got.set(name, (got.get(name) ?? 0) + n);
    let t = 0, kills = 0, weak = 0, xp = 0, coins = 0, full = false, equipLost = 0;
    // Mỗi vòng một con; mỗi con tốn ít nhất OFFLINE.seek giây nên vòng lặp tối đa secs / seek lần.
    while (!full) {
      const years = this.offlineYears(zone), species = this.offlineSpecies(zone), beast = BEASTS[species]?.id ?? "";
      const f = offlineFight(pw, years, beast);
      if (t + f.secs > secs) break;
      t += f.secs;
      if (!f.ok) { weak++; continue; }
      kills++;
      xp += beastStats(years).xp * xpLevelScale(lv, beastLevel(years));
      const [lo, hi] = BEAST_COIN[tierOfYears(years)] ?? BEAST_COIN[0]; coins += lo + Math.floor(Math.random() * (hi - lo + 1));
      // Mảnh, tiên thảo vào thẳng túi như khi hạ tay; hồn cốt, hồn hạch, hồn hoàn theo bộ lọc nhặt của tự săn.
      if (def.shards.length && Math.random() < shardChance(years)) {
        const code = shardCode(def.shards[Math.floor(Math.random() * def.shards.length)]), n = this.addItem(d, code, SHARD_QTY);
        if (n) add(itemDef(code)?.name ?? code, n);
        if (n < SHARD_QTY) full = true;
      }
      const hc = herbChance(row.mapId, zone.name);
      if (hc > 0 && Math.random() < hc) {
        const h = HERBS[Math.floor(Math.random() * HERBS.length)];
        if (this.addItem(d, h.id, 1)) add(h.name, 1); else full = true;
      }
      // E2: đá vào túi (đầy thì dừng như mảnh), trang bị vào túi (không rơi đất khi vắng mặt); trang bị chưa có bộ lọc, bán hay phân giải
      // nên túi đầy thì bỏ món đó (đếm ở `equipLost`), không dừng cả lượt săn.
      for (const e of rollEquipDrop(0, row.mapId, this.equipRng(d), 0)) {
        if (e.kind === "stone") { const n = this.addItem(d, e.code, e.qty); if (n) add(itemDef(e.code)?.name ?? e.code, n); if (n < e.qty) full = true; }
        else { const it = this.addEquip(d, e.item); if (it) add(this.itemLabel(it), 1); else equipLost++; }
      }
      if (cfg.bone && Math.random() < boneChance(years)) {
        const it = this.addBone(d, years, beast, BONE_SLOTS[Math.floor(Math.random() * BONE_SLOTS.length)].id);
        if (it) add(this.itemLabel(it), 1); else full = true;
      }
      if (cfg.core && Math.random() < coreChance(years)) {
        const c = rollCore(years, def.cores, Math.random);
        if (c.stars >= cfg.coreStar) { const it = this.addCore(d, c.stars, c.data); if (it) add(this.itemLabel(it), 1); else full = true; } // Auto 2: lọc theo sao
      }
      if (cfg.ring >= 0 && years >= cfg.ring && rings.length < OFFLINE.rings) { if (this.addRing(d, years)) rings.push(years); else full = true; }
    }
    // Trừ đúng phần đã săn theo thứ tự thời gian (offlineSplit xếp từ cũ tới mới): phần miễn phí của hôm nay vào quỹ hôm nay (quỹ các
    // ngày trước không còn dùng), phần lấy từ quỹ cộng thêm (Auto 2) vào quỹ cộng thêm; dừng sớm thì trừ ít hơn.
    let rest = t, charge = 0, bonusUsed = 0;
    for (const x of parts) {
      const n = Math.max(0, Math.min(x.secs, rest)); rest -= n;
      if (x.bonus) bonusUsed += n; else if (x.day === today) charge += n;
    }
    if (charge > 0) { d.autoUsed = Math.min(AUTO_DAILY_SECS, d.autoUsed + charge); d.autoDirty = true; }
    if (bonusUsed > 0) { d.autoBonus = Math.max(0, d.autoBonus - bonusUsed); d.autoDirty = true; }
    if (coins) this.addCoin(d, coins);
    p.kills += kills;
    // Kinh nghiệm chia cho đội như rewardKill (so cấp lúc vào, một lần cho cả quãng); bình cảnh thì dừng như khi săn tay.
    if (xp > 0) for (const r of d.team) {
      const v = d.owned.find((o) => o.rowId === r); if (!v) continue;
      if (v === d.ch) this.addXp(id, Math.round(xp * XP_SHARE_ACTIVE)); else this.benchXp(id, v, Math.round(xp * XP_SHARE_BENCH));
    }
    const items = [...(rings.length ? [{ name: `Hồn hoàn (cao nhất ${formatYears(Math.max(...rings))})`, qty: rings.length }] : []),
      ...[...got].map(([name, qty]) => ({ name, qty }))];
    const stop = full ? "túi đầy" : !kills && weak ? "vùng quá sức" : !secs ? "hết giờ treo" : undefined;
    await this.write(id);
    const c = this.clients.getById(id); if (!c) return;
    this.sendBag(id); this.sendVohons(c); this.sendSquad(id, true); this.sendAuto(id);
    d.offMsg = { away, secs, used: Math.round(t), map: def.name, zone: zone.name, kills, weak, xp: Math.round(xp), coins,
      items, left: autoLeft(d.autoUsed, d.autoBonus), max: AUTO_DAILY_SECS, bonus: Math.floor(d.autoBonus), bonusUsed: Math.round(bonusUsed),
      ...(equipLost ? { equipLost } : {}), ...(stop ? { stop } : {}) };
    this.sendOffline(id);
    this.log(id, `Ủy thác ở ${zone.name} (${def.name}): vắng ${autoTimeText(away)}, tính ${autoTimeText(secs)}, hạ ${kills} hồn thú, ` +
      `${formatHonTe(coins)} Hồn Tệ${stop ? ` (dừng: ${stop})` : ""}.`, "#86e0b0");
  }

  /** Gửi bảng nhận thưởng ủy thác (tin riêng `offline`) một lần, khi đã tính xong và client đã xin. */
  sendOffline(id: string) {
    const d = this.pdata.get(id), c = this.clients.getById(id); if (!d?.offMsg || !d.offAsk || !c) return;
    c.send("offline", d.offMsg); d.offMsg = null;
  }

  /** Niên hạn một hồn thú thường của vùng `z` khi ủy thác (như spawnBeast, không có hồn thú 10 vạn năm). */
  offlineYears(z: Zone) {
    if (z.years) return rollYears(z.years[0], Math.max(z.years[0], Math.min(z.years[1], MAX_YEARS - 1)), Math.random());
    let r = Math.random(), tier = 0;
    for (let i = 0; i < z.weights.length; i++) { r -= z.weights[i]; if (r <= 0) { tier = i; break; } }
    const [lo, hi] = tierBand(Math.min(tier, TIERS.length - 2));
    return rollYears(lo, hi, Math.random());
  }

  /** Loài (chỉ số BEASTS) một hồn thú của vùng `z` theo trọng số `beasts` (như pickSpecies). */
  offlineSpecies(z: Zone) {
    const list = z.beasts.length ? z.beasts : BEASTS.map((_, i) => ({ species: i, w: 1 }));
    let r = Math.random() * list.reduce((a, b) => a + b.w, 0);
    for (const b of list) { r -= b.w; if (r <= 0) return b.species; }
    return list[list.length - 1].species;
  }

  // ---------- Cổng (mục 5.3 "Cổng và chặn mềm", mục 6 "Đi qua cổng và lưu vị trí") ----------
  /**
   * Hộp đi cổng gửi riêng: tên cổng, bản đồ đích, cấp đề xuất và cảnh báo khi võ hồn ra trận dưới cấp tối thiểu (chặn mềm). Bến thuyền
   * (BĐ6d) kèm `boat` = số giây đi thuyền.
   */
  portalHint(id: string, p: PlayerState, d: PData) {
    const portal = d.travelling || p.dead ? undefined : this.map.portalAt(p.x, p.y);
    const warn = !!portal?.level && p.level < portal.level[0];
    const key = portal ? `${portal.name}|${warn}` : "";
    if (key === d.portalKey) return;
    d.portalKey = key;
    this.clients.getById(id)?.send("portal", portal
      ? { name: portal.name, to: portal.to, toName: MAPS[portal.to].name, level: portal.level, warn, ...(portal.boat ? { boat: BOAT_CAST } : {}) }
      : { name: "" });
  }

  /** Lý do không được đi cổng `name` lúc này (null = được, "" = bỏ qua im lặng). Server tự kiểm tra, client chỉ gửi tên cổng. */
  travelDeny(id: string, name: string): string | null {
    const p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d) return "";
    const portal = this.map.portals.find((q) => q.name === name);
    if (!portal) return "Cổng không tồn tại.";
    if (this.map.portalAt(p.x, p.y) !== portal) return "Hãy đứng trong cổng rồi mới đi qua được.";
    if (p.dead) return "Đã gục ngã, không thể đi qua cổng.";
    if (d.absorbing) return "Đang hấp thụ hồn hoàn, không thể đi qua cổng.";
    const ctl = this.pctl(d); if (ctl.noMove || ctl.wander) return `Đang bị ${this.ccName(d, true)}: không thể đi qua cổng.`; // #116
    return null;
  }

  /** Xin đi qua cổng: kiểm tra rồi niệm TRAVEL_CAST giây (bến thuyền BĐ6d: BOAT_CAST; bị đánh hoặc rời cổng thì hủy), xong thì beginTravel. */
  travel(c: Client, name: string) {
    const id = c.sessionId, d = this.pdata.get(id);
    if (!d || d.travelling || d.travelCast) return;
    const why = this.travelDeny(id, name);
    if (why !== null) { if (why) this.log(id, why, "#ffb35c"); return; }
    const portal = this.map.portals.find((q) => q.name === name)!;
    d.travelCast = { portal, t: portal.boat ? BOAT_CAST : TRAVEL_CAST };
    this.log(id, portal.boat ? `Lên thuyền đi ${MAPS[portal.to].name} (${BOAT_CAST} giây)…` : `Đang đi tới ${MAPS[portal.to].name}…`);
  }

  /**
   * Bật cờ `travelling` (đi cổng bước 2, hoặc client vừa rời phòng): từ đây người chơi không còn tiến độ mới nào trước lần ghi
   * cuối. Tick bỏ qua người này (không di chuyển, không hấp thụ tiếp), hồn thú bỏ mục tiêu, và đạn hồn kỹ còn bay bị bỏ để
   * không hạ được hồn thú sau khi đã chụp dữ liệu (mục 6).
   */
  freeze(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    this.autoStop(id, "rời bản đồ."); // tự săn (Auto 1): đi cổng, truyền tống sang bản đồ khác, vào sân đấu, mất kết nối
    d.travelling = true; d.input = { x: 0, y: 0 }; p.moving = false;
    // Rời bản đồ thì bỏ cả bên. Báo cho thành viên còn ở phòng để ô hàng chờ và khóa tổ đội không bị treo.
    const q = arenaQueued(d.accountId);
    if (q && arenaDequeue(d.accountId)) {
      for (const member of q.members) {
        const row = [...this.pdata.entries()].find(([, x]) => x.accountId === member.accountId);
        if (!row) continue;
        this.sendArenaQueue(row[0]);
        if (row[0] !== id) this.log(row[0], "Đồng đội đã rời phòng, hàng chờ Đại Đấu Hồn Trường đã hủy.", "#ffb35c");
      }
    }
    // Nếu còn ở pha đọc Elo, đánh dấu hủy nhưng giữ arenaBusy tới khi Promise kết thúc (#225/#227).
    const accounts = party.partyIdOf(d.accountId) ? party.partyMembers(d.accountId) : [d.accountId];
    accounts.forEach((acc) => arenaReadCancel(acc));
    this.bdata.forEach((bd) => { if (bd.target === id) bd.target = null; });
    this.projs = this.projs.filter((pr) => pr.owner !== id);
  }

  /**
   * Bước 2–4 của mục 6: đánh dấu đang chuyển bản đồ, nối transaction đi cổng vào chuỗi lưu (chờ mọi lần ghi trước xong rồi
   * mới chụp dữ liệu), commit xong mới gửi riêng `travel {mapId, roomId}`. Lỗi thì bỏ cờ, người chơi ở lại.
   * `to`: phòng (kênh) đích khi đổi kênh; đi cổng thì chọn lúc commit (pickChannel: kênh có đồng đội, không thì ít người nhất
   * còn chỗ; null = mọi kênh đầy, client joinOrCreate để mở kênh mới). `undo`: hoàn tác phần đã trừ trước khi đi (phí truyền tống,
   * Hồi Thành Phù) khi transaction lỗi.
   */
  beginTravel(id: string, portal: Portal, to?: { roomId: string; ch: number }, undo?: () => void) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, from = this.state.mapId;
    this.endAva(id, "");
    this.freeze(id);
    this.portalHint(id, p, d);
    let dest: { roomId: string; ch: number } | null = null;
    this.chain(d, async () => {
      // Từ bước 3.1 transaction đi cổng ghi luôn túi đồ và Hồn Tệ chưa lưu (mục 6, bước 3).
      await this.flushAuto(d); // giờ treo tự săn (Auto 1): ghi trước, transaction đi cổng là lần ghi cuối của phòng này
      await this.fogFlush(d); // sương mù khám phá (R8): ghi bitset bản đồ này trước khi rời
      const list = this.unsaved(id), bag = this.unsavedBag(d);
      try {
        await store.saveTravel(d.accountId, list, from, portal.to, portal.ax, portal.ay, bag);
        if (d.testTravelLost) { d.testTravelLost = false; throw new Error("hook travellost: giả lập mất phản hồi sau COMMIT"); }
      } catch (e) {
        // #165: lỗi có thể tới sau khi COMMIT đã xong (mất phản hồi). DB đã ở bản đồ đích thì coi như đã đi (không hoàn phí / phù): ở lại
        // thì mọi lần lưu sau của phòng này bị lớp chặn WHERE map_id bỏ. Đổi kênh (cùng bản đồ) không đổi map_id nên xử như lỗi thường.
        if (portal.to !== from && (await store.getLocation(d.accountId).catch(() => null))?.mapId === portal.to) {
          console.error(`Đi cổng của tài khoản #${d.accountId} báo lỗi nhưng DB đã ở ${portal.to}: coi như đã đi.`, e);
          d.travelled = true;
          return;
        }
        // `undo` (11.2): trả lại phí / Hồi Thành Phù ngay trong chuỗi, trước lần ghi kế tiếp (kể cả lần ghi cuối của onLeave).
        for (const v of list) if (v.rowId !== d.ch.rowId) d.dirty.add(v.rowId);
        if (bag) d.bagDirty = true;
        undo?.(); throw e;
      }
      d.travelled = true;
      // Kênh đích chọn ngay trong chuỗi, trước khi phiên này nhả tài khoản (onLeave nối sau): client, kể cả vừa mất kết nối rồi vào
      // lại, chỉ vào được kênh này CHANNEL_CD giây khi nó còn mở, còn chỗ (leftRoom cờ `travel`; mục 6: client không chọn kênh đích, #164).
      dest = to ?? (await pickChannel(d.accountId, portal.to).catch(() => null));
      if (dest) leftRoom.set(d.accountId, { mapId: portal.to, roomId: dest.roomId, ch: dest.ch, until: Date.now() + CHANNEL_CD * 1000, travel: true });
      else leftRoom.delete(d.accountId);
    }).then(() => {
      const c = this.clients.getById(id); if (!c) return; // client đã rời: onLeave (đang chờ trong chuỗi) xét d.travelled
      if (!d.travelled) {
        d.travelling = false;
        return this.log(id, "Không chuyển được bản đồ, thử lại.", "#ff8a8a");
      }
      c.send("travel", { mapId: portal.to, roomId: dest?.roomId ?? null });
      // Client phải tự rời phòng cũ và vào phòng mới; quá TRAVEL_LEAVE_SECS giây thì server ngắt kết nối.
      this.clock.setTimeout(() => { if (this.clients.getById(id)) c.leave(4003); }, TRAVEL_LEAVE_SECS * 1000);
    });
  }

  // ---------- Kênh (mục 6 "Nhiều kênh") ----------
  /**
   * Tin riêng "channels": các kênh đang mở của bản đồ (số kênh, số người, tối đa, đầy) và kênh hiện tại; tối đa 1 lần / giây. Xin
   * dồn trong 1 giây thì không bỏ mà hẹn gửi một lần khi hết giây đó (client đang chờ danh sách mới).
   */
  async sendChannels(c: Client) {
    const d = this.pdata.get(c.sessionId), now = Date.now();
    if (!d) return;
    if (!this.state.channel) return c.send("channels", { cur: 0, list: [] }); // sân đấu (7.2) không có kênh
    const wait = d.chListAt + 1000 - now;
    if (wait > 0) {
      if (!d.chListQueued) {
        d.chListQueued = true;
        this.clock.setTimeout(() => { d.chListQueued = false; if (this.pdata.get(c.sessionId) === d) this.sendChannels(c); }, wait);
      }
      return;
    }
    d.chListAt = now;
    const list = await listChannels(this.state.mapId);
    if (!this.clients.getById(c.sessionId)) return;
    c.send("channels", { cur: this.state.channel, list: list.map(({ ch, n, max, full }) => ({ ch, n, max, full })) });
  }

  /**
   * Đổi sang kênh `raw` của cùng bản đồ: kênh phải đang mở và còn chỗ; người chơi ngoài giao chiến, chưa gục, không hấp thụ, không
   * đang đi cổng, cách lần đổi trước CHANNEL_CD giây. Lưu đúng như đi cổng (beginTravel: một transaction nối vào chuỗi lưu, đích là
   * chính bản đồ này tại vị trí đang đứng); commit xong mới gửi `travel {mapId, roomId}` để client vào đúng phòng của kênh đó.
   * Đóng góp lên tinh anh / thú vương tính theo phiên nên không theo sang kênh mới.
   */
  async switchChannel(c: Client, raw: unknown) {
    const id = c.sessionId, warn = (t: string) => this.log(id, t, "#ffb35c");
    const deny = () => {
      const p = this.state.players.get(id), d = this.pdata.get(id);
      if (!p || !d || d.travelling || d.travelCast) return "";
      if (p.dead) return "Đã gục ngã, không đổi kênh được.";
      if (d.absorbing) return "Đang hấp thụ hồn hoàn, không đổi kênh được.";
      if (d.fight < TEAM_COMBAT_SECS) return `Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới đổi kênh được.`;
      return null;
    };
    if (!this.state.channel) return warn("Ở đây không có kênh để đổi."); // sân đấu (7.2)
    let why = deny();
    if (why !== null) { if (why) warn(why); return; }
    const d = this.pdata.get(id)!, ch = intIn(raw);
    if (!Number.isInteger(ch) || ch < 1) return warn("Kênh không hợp lệ.");
    if (ch === this.state.channel) return warn(`Đang ở kênh ${ch}.`);
    const switchedAt = (await presenceBackend.getJson<number>(channelSwitchKey(d.accountId))) ?? channelSwitchAt.get(d.accountId) ?? 0;
    const left = switchedAt + CHANNEL_CD * 1000 - Date.now();
    if (left > 0) return warn(`Vừa đổi kênh: chờ ${Math.ceil(left / 1000)} giây nữa.`);
    const to = (await listChannels(this.state.mapId)).find((x) => x.ch === ch);
    // Trong lúc chờ danh sách, người chơi có thể đã rời, gục hay đã xin đổi kênh lần nữa: kiểm tra lại.
    if (this.pdata.get(id) !== d) return;
    why = deny();
    if (why !== null) { if (why) warn(why); return; }
    if (!to) return warn(`Kênh ${ch} không còn mở.`);
    if (to.full) return warn(`Kênh ${ch} đã đầy (${to.n}/${to.max}).`);
    const switched = Date.now(); channelSwitchAt.set(d.accountId, switched); bg(presenceBackend.putJson(channelSwitchKey(d.accountId), switched, CHANNEL_CD * 1000), "presence");
    const p = this.state.players.get(id)!;
    this.log(id, `Đang chuyển sang kênh ${ch}…`);
    this.beginTravel(id, { name: "", to: this.state.mapId, arrive: "", ax: p.x, ay: p.y, level: null, boat: false, x: 0, y: 0, w: 0, h: 0 }, to);
  }

  // ---------- Truyền tống trận, bản đồ thế giới, Hồi Thành Phù (mục 5.3 "Truyền tống trận", bước 11.2) ----------
  /**
   * Mỗi tick: báo client khi bước lên / rời một truyền tống trận (tin riêng `wp {k: "here"}`: hộp "Bản đồ thế giới [F]"); bước lên trận
   * chưa mở thì mở khóa ngay (RAM), ghi bảng `waypoints` qua chuỗi lưu và báo `wp {k: "unlock"}` (client hiện thông báo).
   */
  waypointTick(id: string, p: PlayerState, d: PData) {
    const w = this.map.waypointAt(p.x, p.y), key = w?.key ?? "", c = this.clients.getById(id);
    if (key !== d.wpKey) { d.wpKey = key; c?.send("wp", { k: "here", key, label: w?.label ?? "" }); }
    if (!w || d.wps.has(w.key)) return;
    d.wps.add(w.key);
    this.chain(d, () => store.unlockWaypoint(d.accountId, w.key));
    // Không gửi `log` (dòng chữ do client tự thêm khi nhận tin này): bước lên trận xảy ra bất kỳ lúc nào, kể cả lúc hồi sinh ở trại.
    c?.send("wp", { k: "unlock", key: w.key, label: w.label, map: MAPS[w.map].name });
    this.broadcast("fx", { k: "wpopen", x: w.cx, y: w.cy });
  }

  /** `wp {op}`: `list` gửi bản đồ thế giới, `go {key}` niệm truyền tống tới trận `key`, `cancel` thôi niệm. */
  waypointAction(id: string, op: unknown, key: unknown) {
    if (op === "list") return this.sendWorld(id);
    if (op === "go") return this.startWaypoint(id, strIn(key));
    if (op === "cancel" && this.pdata.get(id)?.travelCast?.wp) return this.stopCast(id, "Đã thôi truyền tống.");
  }

  /**
   * Tin riêng `world` (bảng bản đồ thế giới): bản đồ đang ở, trận đang đứng (`cur`, "" = không đứng trên trận nào: chỉ xem), Hồn Tệ,
   * các cặp bản đồ nối bằng cổng (`links`), mọi truyền tống trận theo thứ tự MAPS với tên, đã mở chưa, phí từ bản đồ này (null = không tới được bằng cổng).
   */
  sendWorld(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id), c = this.clients.getById(id); if (!p || !d || !c) return;
    const hops = mapHops(this.state.mapId), here = this.map.waypointAt(p.x, p.y);
    c.send("world", { map: this.state.mapId, cur: here?.key ?? "", honTe: d.honTe, links: mapLinks(),
      list: allWaypoints().map((w) => ({ key: w.key, map: w.map, label: w.label, open: d.wps.has(w.key), fee: hops[w.map] === undefined ? null : waypointFee(hops[w.map]) })) });
  }

  /** Lý do không niệm truyền tống / Hồi Thành Phù được lúc này (null = được, "" = bỏ qua im lặng). Kiểm lại lúc niệm xong. */
  recallDeny(id: string): string | null {
    const p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || d.travelling) return "";
    if (d.travelCast) return d.travelCast.wp ? "Đang niệm truyền tống." : "Đang đi qua cổng.";
    if (p.dead) return "Đã gục ngã, không truyền tống được.";
    if (d.absorbing) return "Đang hấp thụ hồn hoàn, không truyền tống được.";
    const ctl = this.pctl(d); if (ctl.noMove || ctl.wander) return `Đang bị ${this.ccName(d, true)}: không truyền tống được.`; // #116
    if (d.fight < TEAM_COMBAT_SECS) return `Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới truyền tống được.`;
    return null;
  }

  /** Bắt đầu niệm WAYPOINT_CAST giây tới `dest` (cổng ẩn: bản đồ đích và tọa độ); client nhận `recall {on, label, secs}` để vẽ thanh niệm. */
  beginRecall(id: string, dest: Portal, wp: Omit<RecallCast, "x0" | "y0" | "dur">) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    d.travelCast = { portal: dest, t: WAYPOINT_CAST, wp: { ...wp, x0: p.x, y0: p.y, dur: WAYPOINT_CAST } };
    this.clients.getById(id)?.send("recall", { on: true, label: wp.label, secs: WAYPOINT_CAST, item: !!wp.itemId });
    this.broadcast("fx", { k: "wpcast", id, x: p.x, y: p.y, t: WAYPOINT_CAST });
  }

  /** Thôi niệm (đi cổng hoặc truyền tống) và báo lý do. */
  stopCast(id: string, why: string) {
    const d = this.pdata.get(id); if (!d?.travelCast) return;
    const wp = !!d.travelCast.wp;
    d.travelCast = null;
    this.log(id, why, "#ffb35c");
    if (wp) { this.clients.getById(id)?.send("recall", { on: false }); this.broadcast("fx", { k: "wpcast", id, t: 0 }); }
  }

  /** Xin truyền tống tới trận `key`: đứng trên một truyền tống trận, trận đích đã mở khóa, khác trận đang đứng, đủ Hồn Tệ, ngoài giao chiến. */
  startWaypoint(id: string, key: string) {
    const why = this.recallDeny(id);
    if (why !== null) { if (why) this.log(id, why, "#ffb35c"); return; }
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, warn = (t: string) => this.log(id, t, "#ffb35c");
    const here = this.map.waypointAt(p.x, p.y);
    if (!here) return warn("Hãy đứng trên một truyền tống trận rồi mới dịch chuyển được (phím M chỉ để xem bản đồ).");
    const to = allWaypoints().find((w) => w.key === key);
    if (!to) return warn("Truyền tống trận không tồn tại.");
    if (!d.wps.has(to.key)) return warn(`Chưa mở khóa truyền tống trận ${to.label}: hãy tới đó bước lên trận một lần.`);
    if (to.key === here.key) return warn("Đang đứng ở chính trận này.");
    const hops = mapHops(this.state.mapId)[to.map];
    if (hops === undefined) return warn(`Không tới được ${MAPS[to.map].name} từ đây.`);
    const fee = waypointFee(hops);
    if (d.honTe < fee) return warn(`Không đủ Hồn Tệ: truyền tống tới ${to.label} cần ${formatHonTe(fee)}.`);
    this.beginRecall(id, this.recallDest(to.map, to.cx, to.cy), { label: `${to.label} (${MAPS[to.map].name})`, fee });
    this.log(id, `Đang niệm truyền tống tới ${to.label} (${WAYPOINT_CAST} giây, ${formatHonTe(fee)})…`, "#8fe0ff");
  }

  /** Dùng Hồi Thành Phù `it`: niệm WAYPOINT_CAST giây về thành gần nhất (nearestTown), cùng luật cấm / hủy như truyền tống trận. */
  useRecall(id: string, it: Item) {
    const why = this.recallDeny(id);
    if (why !== null) { if (why) this.log(id, why, "#ffb35c"); return; }
    const town = nearestTown(this.state.mapId);
    if (!town) return this.log(id, "Không có thành nào để về.", "#ffb35c");
    this.beginRecall(id, this.recallDest(town.mapId, town.x, town.y), { label: MAPS[town.mapId].name, fee: 0, itemId: it.id });
    this.log(id, `Đang niệm Hồi Thành Phù về ${MAPS[town.mapId].name} (${WAYPOINT_CAST} giây)…`, itemDef(it.code)?.col);
  }

  /** Cổng ẩn tới (x, y) ở bản đồ `to` (đi bằng beginTravel như hook `warp`). */
  recallDest(to: string, x: number, y: number): Portal {
    return { name: "", to, arrive: "", ax: x, ay: y, level: null, boat: false, x: 0, y: 0, w: 0, h: 0 };
  }

  /**
   * Niệm xong: kiểm lại (gục, hấp thụ, giao chiến, còn đủ Hồn Tệ / còn phù) rồi trừ phí hoặc một Hồi Thành Phù và dịch chuyển. Cùng
   * bản đồ thì đặt thẳng vị trí (không đổi phòng) và lưu túi qua chuỗi lưu; bản đồ khác thì đi đúng transaction đi cổng (beginTravel,
   * an toàn với tổ đội và lần ghi cuối), lỗi thì trả lại phí / phù.
   */
  finishRecall(id: string, dest: Portal, wp: RecallCast) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    this.clients.getById(id)?.send("recall", { on: false });
    const why = this.recallDeny(id);
    if (why !== null) { if (why) this.log(id, why, "#ffb35c"); return; }
    const it = wp.itemId ? d.bag.find((i) => i.id === wp.itemId && i.vohonId === null) : undefined;
    if (wp.itemId && !it) return this.log(id, "Hồi Thành Phù không còn trong túi đồ.", "#ffb35c");
    if (d.honTe < wp.fee) return this.log(id, `Không đủ Hồn Tệ: cần ${formatHonTe(wp.fee)}.`, "#ffb35c");
    d.honTe -= wp.fee; d.bagDirty = true;
    const code = it?.code;
    if (it) this.takeItem(d, it, 1);
    this.sendBag(id);
    this.broadcast("fx", { k: "wpgo", x: p.x, y: p.y });
    const done = `Truyền tống tới ${wp.label}${wp.fee ? ` (−${formatHonTe(wp.fee)})` : ""}.`;
    this.log(id, done, "#8fe0ff");
    if (dest.to === this.state.mapId) {
      // Cùng bản đồ: như hook `goto`, tăng `seq` để client đang dự đoán chuyển động đặt thẳng vị trí mới (mục 6).
      p.x = dest.ax; p.y = dest.ay; d.input = { x: 0, y: 0 }; p.moving = false; p.seq = (p.seq + 1) >>> 0; p.seqT = 0;
      this.bdata.forEach((bd) => { if (bd.target === id) bd.target = null; });
      this.broadcast("fx", { k: "wpgo", x: p.x, y: p.y });
      this.saveTrade(id, d);
      return;
    }
    this.beginTravel(id, dest, undefined, () => {
      this.addCoin(d, wp.fee);
      if (code) this.addItem(d, code, 1);
      this.sendBag(id);
    });
  }

  // ---------- Giới hạn tin theo kết nối (#677, #734) ----------
  /**
   * Mọi tin của phòng đi qua trần tuyệt đối MSG_HARD (Colyseus 0.16 không có `maxMessagesPerSecond`): hết token thì bỏ tin (trừ `input`), vượt
   * `maxOver` tin trong một giây thì ngắt kết nối. Tin `test` (chỉ GAME_TEST) và `*` không đếm.
   */
  override onMessage<T = any>(type: "*", callback: (c: Client, type: string | number, message: T) => void): any;
  override onMessage<T = any>(type: string | number, callback: (c: Client, message: T) => void, validate?: (message: unknown) => T): any;
  override onMessage(type: string | number, callback: (c: Client, ...a: any[]) => void, validate?: (message: unknown) => unknown) {
    if (type === "*" || type === "test") return super.onMessage(type as string, callback as (c: Client, m: unknown) => void, validate);
    return super.onMessage(type, (c: Client, m: unknown) => {
      const d = this.pdata.get(c.sessionId);
      if (d?.msgLimit) {
        if (d.msgGone) return;
        const now = Date.now();
        if (!takeToken(d.msgTok.hard, now, MSG_HARD.burst, MSG_HARD.rate)) {
          if (now - d.msgOverAt >= 1000) { d.msgOverAt = now; d.msgOver = 0; }
          if (++d.msgOver > MSG_HARD.maxOver) { d.msgGone = true; c.leave(MSG_FLOOD_CODE); return; }
          if (type !== "input") return;
        }
      }
      callback(c, m);
    }, validate);
  }

  /**
   * Đăng ký tin thuộc một nhóm (`MSG_GROUP`: ghi túi, mua bán, xã hội, đọc dữ liệu): mỗi nhóm một bộ đếm token theo kết nối. Hết token thì
   * BỎ tin, không ngắt (người chơi thật bấm nhanh chỉ mất vài lần bấm thừa; mất tin client xin lại bằng `bag`…).
   */
  onLimitedMsg<T = unknown>(group: MsgGroup, type: string, cb: (c: Client, m: T) => void) {
    const { burst, rate } = MSG_GROUP[group];
    this.onMessage(type, (c, m: T) => {
      const d = this.pdata.get(c.sessionId); if (!d) return;
      if (d.msgLimit && !takeToken(d.msgTok[group], Date.now(), burst, rate)) return;
      cb(c, m);
    });
  }

  /** Nhóm ghi túi (sắp xếp, trang bị, bỏ, khóa, dùng, cường hóa…): mỗi tin có thể gộp / sắp xếp lại và gửi lại cả túi. */
  onBagMsg<T = unknown>(type: string, cb: (c: Client, m: T) => void) { this.onLimitedMsg("bag", type, cb); }

  // ---------- Tin client xin lại dữ liệu riêng (#165) ----------
  /**
   * Client xin lại dữ liệu riêng loại `kind` (`bag`, `vohons`, `quest`): gửi ngay nếu lần trước cách ASK_CD giây; xin dồn trong khoảng đó
   * thì hẹn đúng một lần gửi khi hết khoảng (như `channels`), để gửi dồn không làm tốn CPU / băng thông. Lần server tự gửi khi dữ liệu
   * đổi không qua đây.
   */
  ask(id: string, kind: string, send: () => void) {
    const d = this.pdata.get(id); if (!d) return;
    const now = Date.now(), wait = (d.askAt.get(kind) ?? 0) + ASK_CD * 1000 - now;
    if (wait <= 0) { d.askAt.set(kind, now); return send(); }
    if (d.askQueued.has(kind)) return;
    d.askQueued.add(kind);
    this.clock.setTimeout(() => {
      d.askQueued.delete(kind);
      if (this.pdata.get(id) !== d) return;
      d.askAt.set(kind, Date.now()); send();
    }, wait);
  }
  /** `quest {op: "get"}`: tiến độ chuỗi tân thủ và khảo hạch hằng ngày, theo nhịp `ask`. */
  askQuest(id: string) { this.ask(id, "quest", () => { for (const c of [QUEST_STARTER, ...this.pdata.get(id)?.chains.map((q) => q.chain) ?? []]) this.sendQuest(id, undefined, undefined, c); this.sendDaily(id); this.sendTong(id); }); }

  // ---------- Túi đồ, vật phẩm và Hồn Tệ (mục 5.7, bước 3.1) ----------
  /**
   * Tin riêng "bag": mọi ô túi đồ, số ô tối đa, Hồn Tệ (đồng) và giây còn lại của hồi chiêu chung đan. Chỉ gửi cho chính chủ
   * (mục 6), không nằm trong state đồng bộ. Gửi khi client xin (`full`) và mỗi khi túi đổi; từ #215 lần đổi chỉ gửi tin "bagd" gồm
   * số ô, Hồn Tệ, hồi chiêu và phần túi đổi so với bản đã gửi (bagDiff), danh sách mua lại chỉ khi đổi.
   */
  sendBag(id: string, full = false) {
    const d = this.pdata.get(id), c = this.clients.getById(id); if (!d || !c) return;
    const items = d.bag.map((i) => ({ id: i.id, kind: i.kind, code: i.code, qty: i.qty, years: i.years, stars: i.stars, enhance: i.enhance, stats: i.stats, vohon: i.vohonId,
      ...(i.locked ? { lock: true } : {}) }));
    // Đồ vừa bán cho thương nhân, mua lại được (9.8): `price` là giá mỗi món đã nhận lúc bán.
    const buyback = (buybacks.get(d.accountId) ?? []).map(({ key, item: i, price }) => ({ key, kind: i.kind, code: i.code, qty: i.qty, years: i.years, stars: i.stars,
      enhance: i.enhance, stats: i.stats, price }));
    const head = { slots: d.bagSlots, honTe: d.honTe, cd: d.danCd }, bb = JSON.stringify(buyback);
    // Tự bán (#216): bộ lọc và các món tự bán gần nhất (mua lại ở thương nhân), chỉ gửi khi đổi như danh sách mua lại.
    const sold = d.sold.map(({ key, item: i, price, at }) => ({ key, kind: i.kind, code: i.code, qty: i.qty, years: i.years, stars: i.stars,
      enhance: i.enhance, stats: i.stats, price, at }));
    const auto = { sell: d.sellCfg, sold }, as = JSON.stringify(auto);
    if (full || !d.bagSent) {
      this.sendGear(id);
      c.send("bag", { ...head, items, buyback, ...auto });
      d.bagSent = bagDiff(new Map(), items).next;
    } else {
      const { delta, next } = bagDiff(d.bagSent, items);
      c.send("bagd", { ...head, ...delta, ...(bb !== d.bagBuyback ? { buyback } : {}), ...(as !== d.sellSent ? auto : {}) });
      d.bagSent = next;
    }
    d.bagBuyback = bb; d.sellSent = as;
    if (d.sellCfg.on || d.sellCfg.salv > 0) d.sellCheck = true; // túi vừa đổi: nhịp tới xét tự bán (autoSell) và tự phân giải trang bị (autoSalvage)
    if (d.starterNote) {
      d.starterNote = false;
      const gift = STARTER_ITEMS.map((s) => `${s.qty} ${itemDef(s.code)?.name ?? s.code}`).join(", ");
      this.log(id, `Quà khởi đầu đã vào túi đồ: ${gift}. Nhấn B để mở túi.`, "#86e0b0");
    }
    this.dailyBag(id); // khảo hạch hằng ngày: mục tiêu nộp vật phẩm đếm theo túi
  }

  /**
   * Thêm `qty` món mã `code` vào túi: gộp vào ô cùng mã chưa đầy trước (đồ gộp được), rồi mở ô mới khi còn chỗ (`d.bagSlots`, từ 9.8 theo tài khoản).
   * Trả về số món đã nhận; phần dư khi túi đầy thì không nhận (nơi gọi quyết định báo gì). Không tự gửi tin "bag".
   * `locked` (#216): chỉ gộp vào ô cùng trạng thái khoá, ô mới mang trạng thái đó (đồ mới nhặt không gộp vào ô người chơi đã khoá).
   */
  addItem(d: PData, code: string, qty: number, locked = false) {
    const def = itemDef(code); if (!def || !(qty > 0)) return 0;
    let left = qty;
    for (const it of d.bag) {
      if (left <= 0) break;
      if (it.code !== code || it.vohonId !== null || it.qty >= def.stack || !!it.locked !== locked) continue;
      const n = Math.min(left, def.stack - it.qty); it.qty += n; left -= n;
    }
    while (left > 0 && bagUsed(d.bag) < d.bagSlots) {
      const n = Math.min(left, def.stack), it = newItem(def, n); if (locked) it.locked = true;
      d.bag.push(it); left -= n;
    }
    if (left < qty) d.bagDirty = true;
    return qty - left;
  }

  /** Bớt `n` món ở ô `it`; hết thì bỏ ô. */
  takeItem(d: PData, it: Item, n: number) {
    it.qty -= n;
    if (it.qty <= 0) d.bag = d.bag.filter((x) => x !== it);
    d.bagDirty = true;
  }

  /** Thêm một hồn hoàn `years` năm vào túi (mỗi chiếc một ô, không gộp). Túi đầy thì false. Không tự gửi tin "bag". */
  addRing(d: PData, years: number) {
    const def = itemDef(RING_ITEM); if (!def || bagUsed(d.bag) >= d.bagSlots) return false;
    d.bag.push(newItem(def, 1, years)); d.bagDirty = true;
    return true;
  }

  /**
   * Thêm một hồn cốt vào túi (bước 4.1, mỗi món một ô): số năm `years`, loài `beast` (mã trong BEASTS), vị trí `slot` (mã trong
   * BONE_SLOTS), cường hóa +0, chưa gắn. Túi đầy thì null. Không tự gửi tin "bag".
   */
  addBone(d: PData, years: number, beast: string, slot: string) {
    const def = itemDef(BONE_ITEM); if (!def || bagUsed(d.bag) >= d.bagSlots) return null;
    const it = newItem(def, 1, years); it.stats = { beast, slot };
    d.bag.push(it); d.bagDirty = true;
    return it;
  }

  /**
   * Thêm một hồn hạch vào túi (bước 5.1, mỗi món một ô): `stars` sao, bộ / chỉ số chính / dòng phụ `data` (đã tung), nâng cấp +0,
   * chưa gắn. Túi đầy thì null. Không tự gửi tin "bag".
   */
  addCore(d: PData, stars: number, data: CoreData) {
    const def = itemDef(CORE_ITEM); if (!def || bagUsed(d.bag) >= d.bagSlots) return null;
    const it = newItem(def, 1); it.stars = stars; it.stats = { set: data.set, main: data.main, subs: data.subs.map(([k, v]) => [k, v]) };
    d.bag.push(it); d.bagDirty = true;
    return it;
  }

  /** Thêm một món trang bị hồn sư (E2, mỗi món một ô, `stats` = EquipData). Túi đầy thì null, trừ `force` (ô tạm vượt túi, như rương). Không tự gửi tin "bag". */
  addEquip(d: PData, data: EquipData, force = false) {
    const def = itemDef(EQUIP_ITEM); if (!def || (!force && bagUsed(d.bag) >= d.bagSlots)) return null;
    const it = newItem(def, 1); it.stats = { tpl: data.tpl, ilvl: data.ilvl, roll: data.roll, affixes: data.affixes.map(([k, v]) => [k, v]), luck: data.luck };
    d.bag.push(it); d.bagDirty = true;
    return it;
  }

  /** RNG cho rơi trang bị của `d`: hook test `edrop` đặt RNG có hạt, thường là Math.random. */
  equipRng(d: PData) { return d.testEquip ?? Math.random; }

  /**
   * Trang bị khi hạ hồn thú thường / tinh anh (E2, mục 5.15): `rollEquipDrop(rank, bản đồ, rng, rate)`. Đá cường hóa vào thẳng túi người
   * hạ `id` (túi đầy thì phần dư rơi xuống đất như mảnh võ hồn); mỗi món trang bị rơi xuống đất cạnh hồn hoàn, cùng luật ưu tiên `owner`.
   * `rate` = 0 cho tới khi có nguồn sự kiện máy chủ. Bản đồ không có trong EQUIP_MAPS thì không rơi gì.
   */
  rollEquipGround(id: string, owner: string, rank: number, x: number, y: number, why?: string) {
    const d = this.pdata.get(id); if (!d) return;
    const drops = rollEquipDrop(rank, this.state.mapId, this.equipRng(d), 0); if (!drops.length) return;
    const spots = [[x - 16, y], [x, y - 8], [x + 8, y - 8], [x - 8, y + 8], [x + 16, y + 8]];
    let k = 0, bagged = false;
    for (const e of drops) {
      if (e.kind === "stone") {
        const def = itemDef(e.code); if (!def) continue;
        const got = this.addItem(d, e.code, e.qty);
        if (got) { this.log(id, `Nhận ${got} ${def.name}.`, def.col); bagged = true; }
        if (got < e.qty) {
          const drop = this.map.standable(x + 8, y) ? this.newDrop(x + 8, y, id) : this.newDrop(x, y, id);
          drop.item = e.code; drop.qty = e.qty - got;
          this.state.drops.set(uid("d"), drop);
          this.log(id, `Túi đồ đã đầy (${d.bagSlots} ô): ${drop.qty} ${def.name} rơi xuống đất, ${this.lootNote(id, id)}`, "#ffb35c");
        }
        continue;
      }
      const ti = EQUIP_TEMPLATES.findIndex((t) => t.id === e.item.tpl), tpl = EQUIP_TEMPLATES[ti]; if (!tpl) continue;
      const [cx, cy] = spots.slice(k).find(([a, b]) => this.map.standable(a, b)) ?? [x, y]; k = Math.min(spots.length - 1, k + 1);
      const drop = this.newDrop(cx, cy, owner), col = EQUIP_TIERS[tpl.tier].col, did = uid("d");
      drop.item = EQUIP_ITEM; drop.qty = 1; drop.stars = tpl.tier + 1; drop.cset = ti;
      this.equipDrops.set(did, e.item); this.state.drops.set(did, drop);
      this.broadcast("fx", { k: "wave", x: drop.x, y: drop.y, r: 30, col });
      const msg = `${equipName(tpl.id)} (${EQUIP_TIERS[tpl.tier].color}) rơi xuống đất!`;
      this.log(id, `${msg} ${this.lootNote(owner, id, why)}`, col);
      if (owner !== id) this.log(owner, `${msg} ${this.lootNote(owner, owner)}`, col);
    }
    if (bagged) this.sendBag(id);
  }

  /**
   * Phần trang bị của rương thú vương / boss thế giới (E2): tung rollEquipDrop(bậc, bản đồ) và cộng Bùa Hộ Mệnh (rollEquipCharm) ngay
   * lúc mở. Vào thẳng túi, vượt số ô túi nếu cần (cần KING_CHEST.slots / WORLD_CHEST.slots ô trống từ trước nên thường không vượt;
   * nhiều hơn chỉ khi `rate` > 0). Thêm mô tả vào `got`.
   */
  chestEquip(d: PData, rank: number, mapId: string, got: string[]) {
    const rng = this.equipRng(d), drops: EquipDrop[] = rollEquipDrop(rank, mapId, rng, 0), charm = rollEquipCharm(rank, rng);
    const stones = new Map<string, number>();
    for (const e of drops) {
      if (e.kind === "stone") { stones.set(e.code, (stones.get(e.code) ?? 0) + e.qty); continue; }
      if (this.addEquip(d, e.item, true)) got.push(equipName(e.item.tpl));
    }
    const give = (code: string, qty: number) => {
      const def = itemDef(code); if (!def) return;
      const n = this.addItem(d, code, qty);
      if (n < qty) { let left = qty - n; while (left > 0) { const q = Math.min(left, def.stack); d.bag.push(newItem(def, q)); left -= q; d.bagDirty = true; } } // vượt ô túi, không mất thưởng
      got.push(`${qty} ${def.name}`);
    };
    for (const [code, qty] of stones) give(code, qty);
    if (charm) give(EQUIP_CHARM, charm);
  }

  /** Tên một ô để báo trong log: "Hồn hoàn 437 năm", "3 Hồi Huyết Đan", "hồn cốt Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm". */
  itemLabel(it: Item) {
    const bone = it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
    if (bone) return `hồn cốt ${boneName(bone.beast, bone.slot, it.years!, it.enhance)}`;
    const core = it.code === CORE_ITEM ? parseCore(it.stats) : null;
    if (core) return coreName(core.set, it.stars ?? 1, it.enhance).replace("Hồn hạch", "hồn hạch");
    const eq = it.code === EQUIP_ITEM ? parseEquip(it.stats) : null;
    if (eq) return equipName(eq.tpl, it.enhance);
    const name = itemDef(it.code)?.name ?? "vật phẩm lạ";
    return it.years !== null ? `${name} ${formatYears(it.years)}` : it.qty > 1 ? `${it.qty} ${name}` : name;
  }

  /**
   * Nhặt hồn hoàn gần nhất (cách dưới PICKUP_RANGE) vào túi đồ (mục 5.2 "Hồn hoàn là vật phẩm"): DROP_OWNER_SECS giây đầu chỉ
   * người hạ hồn thú nhặt được; túi đầy thì báo và hồn hoàn ở lại dưới đất. Client chỉ gửi ý định, server chọn theo vị trí.
   * Đồ rơi chồng nhau thì chọn món gần nhất mà người này được nhặt (của mình hoặc đã hết ưu tiên), để đồ của người khác nằm
   * trên không chặn đồ của mình; không có món nào được nhặt thì báo theo món gần nhất.
   * `only` (tự săn, mục 5.13): chỉ xét đúng món đó (vẫn kiểm PICKUP_RANGE, quyền nhặt, túi đầy như trên), để món bị bộ lọc nhặt bỏ qua
   * nằm gần hơn không bị nhặt thay. Tin `pickup` của người chơi không có `did`.
   */
  pickup(id: string, only?: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || p.dead || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const mine = (dr: DropState) => this.canLoot(dr, id);
    // Chưa được nhặt: còn bao lâu, của ai (người hạ hay tổ đội của người hạ, 7.1).
    const lock = (dr: DropState, what: string) => `${what} thuộc về ${dr.party ? "tổ đội của " : ""}người hạ hồn thú: còn ${Math.ceil(dr.ownerTtl)} giây nữa mới nhặt được.`;
    let best: [string, DropState] | undefined, bd = PICKUP_RANGE;
    const pool: Iterable<[string, DropState]> = only === undefined ? this.state.drops.entries()
      : this.state.drops.has(only) ? [[only, this.state.drops.get(only)!]] : [];
    for (const [did, dr] of pool) {
      const dd = Math.hypot(dr.x - p.x, dr.y - p.y);
      if (dd < PICKUP_RANGE && (!best || (mine(dr) && !mine(best[1])) || (mine(dr) === mine(best[1]) && dd < bd))) { bd = dd; best = [did, dr]; }
    }
    if (!best) return warn("Không có hồn hoàn hay vật phẩm nào ở gần để nhặt.");
    const [did, dr] = best, label = formatYears(dr.years);
    // Từ 4.1: hồn cốt dưới đất, cùng luật ưu tiên người hạ như hồn hoàn; túi đầy thì báo và hồn cốt ở lại.
    if (dr.item === BONE_ITEM) {
      const beast = BEASTS[dr.species]?.id ?? "", slot = BONE_SLOTS[dr.slot]?.id ?? BONE_SLOTS[0].id, name = `hồn cốt ${boneName(beast, slot, dr.years)}`;
      if (!mine(dr)) return warn(lock(dr, "Hồn cốt"));
      if (!this.addBone(d, dr.years, beast, slot)) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
      this.state.drops.delete(did);
      this.log(id, `Nhặt ${name} vào túi đồ (B để xem chỉ số).`, TIERS[dr.tier].glow);
      this.sendBag(id);
      return;
    }
    // Từ 5.1: hồn hạch dưới đất, cùng luật ưu tiên người hạ như hồn hoàn; túi đầy thì báo và hồn hạch ở lại.
    if (dr.item === CORE_ITEM) {
      const core = this.coreDrops.get(did), name = coreName(CORE_SETS[dr.cset]?.id ?? "", dr.stars);
      if (!mine(dr)) return warn(lock(dr, name));
      if (!core) { this.state.drops.delete(did); return warn(`${name} đã tan biến.`); } // không xảy ra: mọi hồn hạch rơi đều có trong coreDrops
      if (!this.addCore(d, core.stars, core.data)) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
      this.state.drops.delete(did); this.coreDrops.delete(did);
      this.log(id, `Nhặt ${name} vào túi đồ (B để xem chỉ số).`, CORE_SETS[dr.cset]?.col);
      this.sendBag(id);
      return;
    }
    // E2: trang bị dưới đất, cùng luật ưu tiên người hạ; túi đầy thì báo và món ở lại.
    if (dr.item === EQUIP_ITEM) {
      const eq = this.equipDrops.get(did), tpl = EQUIP_TEMPLATES[dr.cset], name = equipName(tpl?.id);
      if (!mine(dr)) return warn(lock(dr, name));
      if (!eq) { this.state.drops.delete(did); return warn(`${name} đã tan biến.`); } // không xảy ra: mọi trang bị rơi đều có trong equipDrops
      if (!this.addEquip(d, eq)) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
      this.state.drops.delete(did); this.equipDrops.delete(did);
      this.log(id, `Nhặt ${name} vào túi đồ (B để xem chỉ số).`, EQUIP_TIERS[tpl?.tier ?? 0]?.col);
      this.sendBag(id);
      return;
    }
    // Từ 3.4: mảnh võ hồn rơi xuống đất (túi người hạ đã đầy), cùng luật ưu tiên; túi chỉ nhận một phần thì phần còn lại ở lại.
    if (dr.item) {
      const def = itemDef(dr.item), name = def?.name ?? "vật phẩm lạ";
      if (!mine(dr)) return warn(lock(dr, name));
      const got = this.addItem(d, dr.item, dr.qty);
      if (!got) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được ${name}.`);
      if (got < dr.qty) dr.qty -= got; else this.state.drops.delete(did);
      this.log(id, `Nhặt ${got} ${name} vào túi đồ${this.shardNote(d, dr.item)}.`, def?.col);
      this.sendBag(id);
      return;
    }
    if (!mine(dr)) return warn(lock(dr, `Hồn hoàn ${label}`));
    if (!this.addRing(d, dr.years)) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới nhặt được hồn hoàn ${label}.`);
    this.state.drops.delete(did);
    this.log(id, `Nhặt hồn hoàn ${label} (${TIERS[dr.tier].color}) vào túi đồ. Mở túi (B) để hấp thụ.`, TIERS[dr.tier].glow);
    this.sendBag(id);
  }

  /**
   * Bỏ hẳn một ô trong túi (cả chồng), ví dụ hồn hoàn không dùng tới để nhường chỗ. Không bỏ được hồn hoàn đang hấp thụ, và không bỏ
   * gì trong lúc đang ghi phần thưởng boss (claimBusy, #165: phần thưởng vào túi trước khi DB xác nhận lượt, lỗi thì lấy lại).
   */
  discardItem(id: string, raw: unknown) {
    const d = this.pdata.get(id); if (!d || d.travelling) return;
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
    if (!it) return this.log(id, "Không có vật phẩm này trong túi đồ.", "#ffb35c");
    if (d.absorbing?.itemId === it.id) return this.log(id, "Đang hấp thụ hồn hoàn này, không bỏ được.", "#ffb35c");
    if (it.locked) return this.log(id, `${this.itemLabel(it)} đang khoá: mở khoá rồi mới bỏ được.`, "#ffb35c");
    if (claimHeld(d)) return this.log(id, CLAIM_BUSY, "#ffb35c");
    this.takeItem(d, it, it.qty);
    this.log(id, `Đã bỏ ${this.itemLabel(it)}.`);
    this.sendBag(id);
  }

  /** Cộng `n` đồng Hồn Tệ vào túi của `d`, kẹp ở Number.MAX_SAFE_INTEGER (bagOk trong db.ts từ chối số lớn hơn); mọi chỗ cộng tiền đi qua đây (#165). */
  addCoin(d: PData, n: number) {
    d.honTe = Math.min(Number.MAX_SAFE_INTEGER, d.honTe + n); d.bagDirty = true;
  }

  /**
   * Sắp xếp túi (#215, nút "Sắp xếp" trên cả túi, mọi trang): gộp các ô gộp được (ItemDef.stack) cùng loại chưa đầy vào các ô đầu, ô
   * thừa bỏ đi; rồi xếp theo nhóm (ITEM_KINDS), loại (ITEMS), số năm / sao / cường hóa giảm dần. Món đang gắn vào võ hồn không đổi.
   * Thứ tự lưu DB bằng `created` (nạp túi theo items.created_at): các ô nhận lại chính các mốc thời gian cũ theo thứ tự mới.
   */
  sortBag(id: string) {
    const d = this.pdata.get(id); if (!d || d.travelling) return;
    if (claimHeld(d) || d.shardBusy) return this.log(id, "Đang xử lý vật phẩm, đợi một chút rồi sắp xếp.", "#ffb35c");
    const loose = d.bag.filter((i) => i.vohonId === null), worn = d.bag.filter((i) => i.vohonId !== null);
    const times = loose.map((i) => i.created).sort((a, b) => a - b);
    const groups = new Map<string, Item[]>();
    for (const it of loose) {
      if ((itemDef(it.code)?.stack ?? 1) <= 1 || d.absorbing?.itemId === it.id) continue;
      const k = [it.code, it.years, it.stars, it.enhance, JSON.stringify(it.stats), !!it.locked].join("|"); // ô khoá (#216) không gộp với ô thường
      groups.set(k, [...(groups.get(k) ?? []), it]);
    }
    const gone = new Set<Item>();
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      const stack = itemDef(list[0].code)!.stack;
      let left = list.reduce((a, i) => a + i.qty, 0);
      for (const it of list) { if (left > 0) { it.qty = Math.min(stack, left); left -= it.qty; } else gone.add(it); }
    }
    const rank = (it: Item) => { const def = itemDef(it.code); return def ? KIND_ORDER.indexOf(def.kind) * 1e4 + (ITEM_ORDER.get(def.id) ?? 0) : 1e9; };
    const kept = loose.filter((i) => !gone.has(i)).sort((a, b) => rank(a) - rank(b) || (b.years ?? 0) - (a.years ?? 0) || (b.stars ?? 0) - (a.stars ?? 0)
      || b.enhance - a.enhance || b.qty - a.qty || a.created - b.created);
    let prev = -Infinity;
    kept.forEach((it, k) => { it.created = prev = Math.max(times[k], prev + 1); });
    bumpItemClock(prev);
    d.bag = [...kept, ...worn]; d.bagDirty = true;
    this.log(id, `Đã sắp xếp túi đồ${gone.size ? `, gộp bớt ${gone.size} ô` : ""}.`);
    this.sendBag(id);
  }

  /** Hồn Tệ khi hạ hồn thú bậc `tier` (BEAST_COIN): người hạ nhận thẳng vào túi. Trả về số đồng nhận được. */
  rewardCoin(id: string, tier: number) {
    const d = this.pdata.get(id); if (!d) return 0;
    const [lo, hi] = BEAST_COIN[tier] ?? BEAST_COIN[0], n = lo + Math.floor(Math.random() * (hi - lo + 1));
    this.addCoin(d, n);
    this.sendBag(id);
    return n;
  }

  /**
   * Dùng một món trong túi theo id (client chỉ gửi id ô). Server kiểm tra món đó nằm trong túi của chính người gửi, dùng được,
   * người chơi không gục / không hấp thụ / không đang chuyển bản đồ, hết hồi chiêu chung đan, và không phí đan khi đã đầy.
   * Đan dùng được cả khi giao chiến và trong vùng an toàn. Từ BĐ6b tiên thảo cũng qua đây, kèm `vohonId` (useHerb).
   */
  useItem(id: string, raw: unknown, vohonId?: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
    if (!it) return warn("Không có vật phẩm này trong túi đồ.");
    const def = itemDef(it.code);
    if (def?.kind === "tien_thao") return this.useHerb(id, d, it, vohonId);
    if (def?.recall) return this.useRecall(id, it); // Hồi Thành Phù (11.2)
    if (def?.auto) return this.useAutoToken(id, d, it, def); // Ủy Thác Lệnh (Auto 2)
    if (!def || !(def.hp || def.mp)) return warn(`${def?.name ?? "Vật phẩm này"} không dùng trực tiếp được.`);
    if (p.dead) return warn("Đã gục ngã, không thể dùng đan dược.");
    if (d.absorbing) return warn("Đang hấp thụ hồn hoàn, không thể dùng đan dược.");
    if (def.cd && d.danCd > 0) return warn(`Đan dược đang hồi: còn ${Math.ceil(d.danCd)} giây.`);
    if ((!def.hp || d.hpF >= p.maxHp) && (!def.mp || d.mpF >= p.maxMp)) return warn(def.hp ? "Sinh lực đang đầy." : "Hồn lực đang đầy.");
    const hp0 = p.hp, mp0 = p.mp;
    if (def.hp) d.hpF = Math.min(p.maxHp, d.hpF + p.maxHp * def.hp);
    if (def.mp) d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * def.mp);
    p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
    if (def.cd) d.danCd = DAN_CD;
    this.takeItem(d, it, 1);
    this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 22, col: def.col });
    const gain = [def.hp ? `+${p.hp - hp0} sinh lực` : "", def.mp ? `+${p.mp - mp0} hồn lực` : ""].filter(Boolean).join(", ");
    this.log(id, `Dùng ${def.name}: ${gain}.`, def.col);
    this.sendBag(id);
  }

  // ---------- NPC, thương nhân, lò rèn (mục 5.8, bước 6.1) ----------
  /**
   * NPC trong tầm NPC_RANGE của người chơi: đúng mã `id` (nói chuyện), hoặc NPC gần nhất có vai trò `role` (mua bán ở thương nhân).
   * Người đã gục / đang chuyển bản đồ thì không có. Client chỉ gửi ý định, vị trí do server giữ.
   */
  npcNear(id: string, want: { id?: string; role?: NpcRole }): NpcSpot | undefined {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || p.dead || d.travelling) return undefined;
    let best: NpcSpot | undefined, bd = NPC_RANGE;
    for (const n of this.map.npcs) {
      if ((want.id && n.id !== want.id) || (want.role && npcDef(n.id)?.role !== want.role)) continue;
      const k = Math.hypot(n.x - p.x, n.y - p.y);
      if (k <= bd) { bd = k; best = n; }
    }
    return best;
  }

  /** Nói chuyện với NPC `raw` (mã trong NPCS): đứng đủ gần thì gửi riêng tin `npc {id}` để client mở hộp thoại (lời thoại ở NPCS). */
  talkNpc(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const def = npcDef(raw), spot = def && this.map.npcs.find((n) => n.id === def.id);
    if (!def || !spot) return this.log(id, "Không có NPC này ở đây.", "#ffb35c");
    if (p.dead) return this.log(id, "Đã gục ngã, không thể nói chuyện.", "#ffb35c");
    if (!this.npcNear(id, { id: def.id })) return this.log(id, `Hãy lại gần ${def.name} hơn để nói chuyện.`, "#ffb35c");
    this.questEvent(id, { k: "talk", npc: def.id, map: this.state.mapId }); // 6.2: trước tin npc để hộp thoại mở ra với tiến độ mới
    if (def.role === "tong") this.sendTong(id); // #196: trước tin npc để hộp thoại có trạng thái tông
    if (def.role === "looks") this.sendLooksInfo(id); // L4 (#511): số lần đã đổi, để hộp thoại hiện giá
    this.clients.getById(id)?.send("npc", { id: def.id });
  }

  // ---------- Đổi ngoại hình ở thợ may (L4 #511, mục 5.11) ----------
  /** Tin riêng `looksinfo`: số lần đã đổi (giá lần kế tiếp client tính bằng looksChangeCost, số ở shared/data.ts); `err` = lý do từ chối lần đổi vừa gửi. */
  sendLooksInfo(id: string, err?: string) {
    const d = this.pdata.get(id); if (!d) return;
    this.clients.getById(id)?.send("looksinfo", err ? { n: d.looksN, err } : { n: d.looksN });
  }

  /**
   * `looks {looks, npc}` (L4 #511): đổi ngoại hình, kể cả qua lại giữa Mẫu dựng sẵn và Tự tạo. Phải đứng trong NPC_RANGE của thợ may
   * (role "looks"; `npc` là mã thợ may đang mở hộp thoại, thiếu thì thợ may gần nhất), không gục, không đang đi cổng, `looks` qua
   * parseLooks và khác ngoại hình hiện tại. Lần đổi thứ `LOOKS_CHANGE.free` đầu miễn phí, sau đó tốn LOOKS_CHANGE.cost Hồn Tệ
   * (looksChangeCost). Tới lượt trong chuỗi lưu mới kiểm lại số lần đổi / Hồn Tệ, trừ tiền, rồi ghi ngoại hình + tăng số lần đổi + ghi túi
   * trong một transaction (store.changeLooks, điều kiện looks_changes khớp nên bấm dồn hay hai tab chỉ một lần được tính); DB lỗi thì trả lại tiền.
   * Chỉ sau khi DB xác nhận mới đổi PlayerState (người xung quanh thấy ngay).
   */
  changeLooks(id: string, raw: unknown, rawNpc?: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendLooksInfo(id, text); };
    if (p.dead || d.travelling) return warn("Lúc này không đổi ngoại hình được.");
    const npc = typeof rawNpc === "string" ? this.npcNear(id, { id: rawNpc }) : this.npcNear(id, { role: "looks" });
    if (!npc || npcDef(npc.id)?.role !== "looks") return warn("Hãy lại gần thợ may hơn để đổi ngoại hình.");
    const looks = parseNewLooks(raw);
    if (!looks) return warn("Ngoại hình không hợp lệ.");
    const key = (l: { sex: number; hair: number; hairCol: number; outfitCol: number; skin: number; lpc?: string }) => l.lpc ? `L${l.lpc}` : `${l.sex}|${l.hair}|${l.hairCol}|${l.outfitCol}|${l.skin}`;
    if (key({ ...looks, lpc: looks.lpc ? encodeLpc(looks.lpc) : "" }) === key(p)) return warn("Ngoại hình này giống hiện tại, không cần đổi.");
    if (d.looksBusy) return warn("Đang đổi ngoại hình, đợi một chút.");
    const need = looksChangeCost(d.looksN);
    if (d.honTe < need) return warn(`Không đủ Hồn Tệ: đổi ngoại hình tốn ${formatHonTe(need)}, đang có ${formatHonTe(d.honTe)}.`);
    d.looksBusy = true;
    const done = d.looksN;
    this.chain(d, async () => {
      if (d.looksN !== done) return warn("Số lần đổi ngoại hình đã thay đổi, hãy mở lại hộp thoại.");
      const cost = looksChangeCost(done);
      if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: đổi ngoại hình tốn ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
      d.honTe -= cost; d.bagDirty = true;
      let n: number | null;
      try { n = await store.changeLooks(d.accountId, looks, done, this.bagSnapshot(d)); }
      catch (e) { d.honTe += cost; d.bagDirty = true; warn("Không lưu được ngoại hình mới, thử lại sau (không mất Hồn Tệ)."); throw e; }
      if (n === null) { d.honTe += cost; d.bagDirty = true; return warn("Không đổi được ngoại hình (đã đổi ở nơi khác?), hãy mở lại hộp thoại."); }
      d.looksN = n;
      p.sex = looks.sex; p.hair = looks.hair; p.hairCol = looks.hairCol; p.outfitCol = looks.outfitCol; p.skin = looks.skin; p.lpc = looks.lpc ? encodeLpc(looks.lpc) : "";
      this.log(id, cost ? `Đổi ngoại hình xong: −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)}).` : "Đổi ngoại hình xong (lần đầu miễn phí).", "#e08cc8");
    }).then(() => { d.looksBusy = false; if (this.pdata.get(id) === d) { this.sendBag(id); this.sendLooksInfo(id); } });
  }

  // ---------- Tông môn (#196, mục 5.14) ----------
  /**
   * Tin riêng `tong {tong, wait, day, tasks}`: tông đang thuộc ("" = không), số giây còn phải chờ mới gia nhập / đổi được (0 = được), và
   * TONG_DAILY.count tông vụ hôm nay (#197: tiến độ như tin "daily" kèm trạng thái; nội dung bài client tự suy từ mã, questChain).
   */
  sendTong(id: string) {
    const d = this.pdata.get(id); if (!d) return;
    this.tongFresh(d); this.dailyGive(d, d.tongTasks);
    const wait = d.tongAt === null ? 0 : Math.max(0, Math.ceil((d.tongAt + TONG_SWITCH_DAYS * 86400000 - Date.now()) / 1000));
    this.clients.getById(id)?.send("tong", { tong: d.tong ?? "", wait, day: d.tongDay,
      tasks: d.tongTasks.map((q) => ({ ...q, prog: [...q.prog], status: questStatus(q) })) });
  }
  /** Giờ của tuần tông (ms): giờ thật, hook test `tweek` lệch được (#197). */
  tongNow() { return Date.now() + tongShift * 86400000; }
  /** Bộ tông vụ hôm nay từ các dòng `quests` đã lưu (như dailyOf); bài chưa có dòng thì chưa nhận. */
  tongTasksOf(saved: QuestProgress[] | undefined, day = this.dailyDay()) {
    return { tongDay: day, tongTasks: tongTaskIds(day).map((id) => saved?.find((q) => q.chain === id) ?? questStart(id)) };
  }
  /** Sang ngày mới thì thay bằng bộ tông vụ mới chưa nhận (như dailyFresh); trả true khi vừa đặt lại. */
  tongFresh(d: PData, day = this.dailyDay()) {
    if (d.tongDay === day) return false;
    Object.assign(d, this.tongTasksOf(undefined, day));
    d.bagDirty = true;
    return true;
  }

  /**
   * Tin client `tong {op, tong}`: `join` gia nhập hoặc đổi sang tông `tong` (đứng gần sứ giả của tông đó; xong chuỗi tân thủ, võ hồn
   * cao nhất từ TONG_MIN_LEVEL, từ lần gia nhập trước đủ TONG_SWITCH_DAYS ngày; xoá điểm tuần hiện tại), `leave` rời tông (đứng gần
   * một sứ giả; giữ `tongAt` nên không rời rồi vào tông khác để lách thời gian chờ). Ghi DB qua chuỗi lưu. Từ #197: `accept` / `turnin`
   * tông vụ `chain` (tongTaskAction), `board` xin bảng tông tuần (tongBoard), `claim` nhận thưởng tuần trước (tongClaim), `get` xin lại tin.
   */
  tongAction(id: string, op: unknown, raw: unknown, chain?: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendTong(id); };
    if (op === "get") return this.sendTong(id);
    if (op === "accept" || op === "turnin") return this.tongTaskAction(id, op, chain);
    if (op === "board") return this.tongBoard(id);
    if (op === "claim") return this.tongClaim(id);
    if (op !== "join" && op !== "leave") return warn("Thao tác tông môn không hợp lệ.");
    if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
    if (op === "leave") {
      if (!d.tong) return warn("Ngươi chưa thuộc tông môn nào.");
      if (!this.npcNear(id, { role: "tong" })) return warn("Hãy lại gần sứ giả tông môn để rời tông.");
      const old = tongDef(d.tong)!;
      d.tong = null; p.tong = 0; d.tongPend = [];
      this.chain(d, () => store.setTong(d.accountId, null, null, tongWeek(this.tongNow())));
      this.log(id, `Ngươi đã rời ${old.name}; điểm tuần này đã bỏ.`, old.col);
      return this.sendTong(id);
    }
    const t = tongDef(raw);
    if (!t) return warn("Tông môn không tồn tại.");
    const npc = npcDef(t.npc)!;
    if (!this.npcNear(id, { id: t.npc })) return warn(`Hãy lại gần ${npc.name} hơn để gia nhập.`);
    if (d.tong === t.id) return warn(`Ngươi đã là người của ${t.name}.`);
    if (questStatus(d.quest) !== "done") return warn(`Hãy hoàn thành chuỗi "Bài học của Đại Sư" trước khi gia nhập tông môn.`);
    if (Math.max(p.level, ...d.owned.map((v) => v.level)) < TONG_MIN_LEVEL) return warn(`Cần võ hồn cấp ${TONG_MIN_LEVEL} trở lên để gia nhập tông môn.`);
    const now = Date.now();
    if (d.tongAt !== null && now < d.tongAt + TONG_SWITCH_DAYS * 86400000)
      return warn(`Mới gia nhập gần đây: còn ${Math.ceil((d.tongAt + TONG_SWITCH_DAYS * 86400000 - now) / 86400000)} ngày nữa mới đổi được tông.`);
    const from = d.tong ? tongDef(d.tong) : null;
    d.tong = t.id; d.tongAt = now; d.tongPend = []; p.tong = TONG_MON.findIndex((x) => x.id === t.id) + 1;
    this.chain(d, () => store.setTong(d.accountId, t.id, now, tongWeek(this.tongNow())));
    this.log(id, from ? `Ngươi đã rời ${from.name} và gia nhập ${t.name}; điểm tuần này đã bỏ.` : `Chúc mừng, ngươi đã gia nhập ${t.name}!`, t.col);
    this.questEvent(id, { k: "tong" }); // #286: gia nhập hoặc đổi tông
    this.sendTong(id);
  }

  /**
   * Nhận / trả tông vụ `chainId` hôm nay (#197): phải thuộc một tông, đứng trong NPC_RANGE của sứ giả **tông mình**, không gục. Như
   * dailyAction: mục tiêu `give` bớt đồ khỏi túi lúc trả (rẻ nhất trước). Trả bài: Hồn Tệ của mẫu, rồi trong chuỗi lưu ghi túi (bài đã
   * xong, Hồn Tệ, đồ đã nộp) và **chỉ khi đã ghi** mới cộng TONG_POINTS điểm vào tuần hiện tại của tông đang thuộc (tong_points), nên ghi
   * lỗi thì không có điểm, bài vẫn trả lại được.
   */
  tongTaskAction(id: string, op: "accept" | "turnin", chainId: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendTong(id); };
    this.tongFresh(d);
    const t = d.tong ? tongDef(d.tong) : undefined;
    if (!t) return warn("Chỉ người trong tông môn mới nhận được tông vụ.");
    const i = typeof chainId === "string" ? d.tongTasks.findIndex((q) => q.chain === chainId) : -1;
    if (i < 0) return warn("Tông vụ đó đã hết hạn: hôm nay có bài mới.");
    const npc = npcDef(t.npc)!, verb = op === "accept" ? "nhận" : "trả";
    if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
    if (!this.npcNear(id, { id: t.npc })) return warn(`Hãy lại gần ${npc.name} (sứ giả ${t.name}) để ${verb} tông vụ.`);
    const step = questChain(d.tongTasks[i].chain)!.steps[0];
    this.dailyGive(d, d.tongTasks);
    const st = questStatus(d.tongTasks[i]);
    if (st === "done") return warn(`Đã xong "${step.name}" hôm nay: mai có tông vụ mới.`);
    if (op === "accept") {
      if (st !== "offer") return warn(`Đang làm "${step.name}": xong rồi quay lại trả bài.`);
      d.tongTasks[i] = { chain: d.tongTasks[i].chain, step: 0, accepted: true, prog: step.goals.map(() => 0) };
      d.bagDirty = true;
      this.dailyGive(d, d.tongTasks);
      this.log(id, `Nhận tông vụ "${step.name}": ${step.desc}`, t.col);
      if (questStatus(d.tongTasks[i]) === "ready") this.log(id, `Đã đạt sẵn mục tiêu của "${step.name}": trả bài ngay để nhận thưởng.`, "#86e0b0");
      this.sendTong(id);
      this.saveTrade(id, d);
      return;
    }
    if (st === "offer") return warn(`Chưa nhận "${step.name}".`);
    if (st !== "ready") return warn(`Chưa xong "${step.name}": ${step.goals.map((g, k) => `${g.text} ${d.tongTasks[i].prog[k] ?? 0}/${g.n}`).join(", ")}.`);
    const gives = step.goals.some((g) => g.k === "give");
    if (gives && claimHeld(d)) return warn(CLAIM_BUSY); // #165: như bán / bỏ đồ
    if (gives) d.bag = d.bag.map((it) => ({ ...it }));
    for (const g of step.goals) {
      if (g.k !== "give" || !g.item) continue;
      let left = g.n;
      for (const it of this.giveItems(d, g.item)) { if (left <= 0) break; const n = Math.min(left, it.qty); this.takeItem(d, it, n); left -= n; }
    }
    this.addCoin(d, step.reward.honTe);
    d.tongTasks[i] = { chain: d.tongTasks[i].chain, step: 1, accepted: false, prog: [] };
    d.bagDirty = true;
    const week = tongWeek(this.tongNow()), tong = t.id;
    const given = step.goals.filter((g) => g.k === "give").map((g) => `${g.n} ${itemDef(g.item ?? "")?.name ?? g.item}`).join(", ");
    this.log(id, `Trả tông vụ "${step.name}"${given ? ` (nộp ${given})` : ""}: nhận ${formatHonTe(step.reward.honTe)} và ${TONG_POINTS} điểm ${t.name}.`, "#f2c84b");
    this.sendBag(id);
    this.sendTong(id);
    d.tongPend.push({ week, tong, n: TONG_POINTS });
    this.saveTrade(id, d);
  }

  /**
   * Tin riêng `tongBoard` (#197), cách nhau TONG_BOARD_CD giây: tuần hiện tại (`week`, bảng `cur`: điểm trung bình thành viên hoạt động
   * từng tông và top TONG_TOP_N cá nhân mỗi tông, điểm của mình `me`), và tuần trước (`last`: bảng, tông hạng 1, điểm của mình, phần
   * thưởng `reward` top / rest / null = không hoạt động, đã nhận `claimed`).
   */
  tongBoard(id: string, force = false) {
    const d = this.pdata.get(id); if (!d) return;
    const now = Date.now(); if (!force && now - d.tongBoardAt < TONG_BOARD_CD * 1000) return;
    d.tongBoardAt = now;
    const week = tongWeek(this.tongNow()), last = week - 7;
    Promise.all([store.tongBoard(week, TONG_WEEK_MIN, TONG_TOP_N), store.tongBoard(last, TONG_WEEK_MIN, TONG_TOP_N), store.tongPoints(d.accountId, week),
      store.tongPoints(d.accountId, last), store.bossClaims(d.accountId, tongWeekDay(last), TONG_WEEK_KIND)]).then(([cur, prev, mine, mineLast, claimed]) => {
      const first = tongTop(prev.tongs), active = !!mineLast && mineLast.points >= TONG_WEEK_MIN;
      this.clients.getById(id)?.send("tongBoard", { week, min: TONG_WEEK_MIN, cur, me: mine && mine.tong === d.tong ? mine.points : 0,
        last: { week: last, board: prev, first, tong: mineLast?.tong ?? "", points: mineLast?.points ?? 0,
          reward: active ? (first.includes(mineLast!.tong) ? "top" : "rest") : null, claimed: claimed > 0 } });
    }, (e) => console.error("Không đọc được bảng tông môn", e));
  }

  /**
   * Nhận thưởng tuần trước (#197) ở một sứ giả tông môn, đúng một lần: thành viên hoạt động tuần trước (từ TONG_WEEK_MIN điểm ở tông khi
   * đó) nhận TONG_WEEK_REWARD.top nếu tông đó hạng 1 tuần trước (tongTop), không thì `rest`. Như đổi mảnh ở Thương hội (#282): trong
   * chuỗi lưu, cộng thưởng vào túi rồi ghi lượt (boss_claims loại TONG_WEEK_KIND, ngày thứ Hai của tuần được thưởng) cùng túi trong một
   * transaction (claimBoss); đã nhận / lỗi thì trả lại túi như cũ. Túi không đủ chỗ cho mảnh thì từ chối (không mất lượt).
   */
  tongClaim(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.tongBoard(id, true); };
    if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
    if (!this.npcNear(id, { role: "tong" })) return warn("Hãy lại gần sứ giả tông môn để nhận thưởng tuần.");
    if (claimHeld(d)) return warn(CLAIM_BUSY);
    d.claimBusy++;
    this.chain(d, async () => {
      const last = tongWeek(this.tongNow()) - 7, day = tongWeekDay(last);
      const mine = await store.tongPoints(d.accountId, last);
      if (!mine || mine.points < TONG_WEEK_MIN) return warn(`Tuần trước ngươi chưa đủ ${TONG_WEEK_MIN} điểm tông (có ${mine?.points ?? 0}): không có thưởng tuần.`);
      const t = tongDef(mine.tong), board = await store.tongBoard(last, TONG_WEEK_MIN, 0);
      const top = tongTop(board.tongs).includes(mine.tong), R = top ? TONG_WEEK_REWARD.top : TONG_WEEK_REWARD.rest;
      const code = shardCode(ARENA_SHARDS[Math.floor(Math.random() * ARENA_SHARDS.length)]), def = itemDef(code)!;
      if (this.bagRoom(d, code) < R.shards) return warn(`Túi đồ không đủ chỗ cho ${R.shards} ${def.name}: bỏ hoặc bán bớt đồ rồi nhận lại.`);
      const coin0 = d.honTe;
      this.addCoin(d, R.honTe); this.addItem(d, code, R.shards); d.bagDirty = true;
      const takeBack = () => {
        d.honTe = coin0; d.bagDirty = true;
        let n = R.shards;
        for (const x of d.bag.filter((i) => i.code === code && i.vohonId === null).reverse()) { const k = Math.min(n, x.qty); this.takeItem(d, x, k); n -= k; if (!n) break; }
      };
      let n: number | null;
      try { n = await store.claimBoss(d.accountId, day, TONG_WEEK_KIND, 1, this.bagSnapshot(d)); }
      catch (e) { takeBack(); warn("Không lưu được lần nhận thưởng tuần, thử lại sau."); throw e; }
      if (n === null) { takeBack(); return warn("Đã nhận thưởng tuần trước rồi."); }
      this.log(id, `Thưởng tuần ${t?.name ?? mine.tong}${top ? " (tông hạng nhất)" : ""}: ${formatHonTe(R.honTe)} và ${R.shards} ${def.name}.`, t?.col ?? "#f2c84b");
      this.tongBoard(id, true);
    }).then(() => {
      d.claimBusy--;
      if (this.pdata.get(id) === d) this.sendBag(id);
    });
  }

  /**
   * Thương nhân để mua / bán / mua lại / mở rộng túi (#111): `rawNpc` là mã thương nhân client đang mở hộp thoại (thiếu thì thương nhân
   * gần nhất, như bot / client cũ), phải là thương nhân và đứng trong NPC_RANGE. Thương nhân lưu động đứng ở trại cổng (không phải vùng
   * an toàn) nên ngoài vùng an toàn, đang giao chiến thì không giao dịch. Trả NPC, hoặc lý do từ chối (`verb`: "mua", "bán"…).
   */
  shopFor(id: string, d: PData, rawNpc: unknown, verb: string): NpcSpot | string {
    const p = this.state.players.get(id);
    const npc = typeof rawNpc === "string" ? this.npcNear(id, { id: rawNpc }) : this.npcNear(id, { role: "shop" });
    if (!p || !npc || npcDef(npc.id)?.role !== "shop") return `Hãy đứng cạnh thương nhân rồi mới ${verb} được.`;
    if (!this.map.inSafe(p.x, p.y) && d.fight < TEAM_COMBAT_SECS) return `Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới ${verb} được.`;
    return npc;
  }

  // ---------- Nhiệm vụ: chuỗi tân thủ của Ngọc Tiểu Cương (mục 5.8, bước 6.2) ----------
  /**
   * Tin riêng "quest": tiến độ chuỗi tân thủ (bước, đã nhận, số đếm từng mục tiêu) và trạng thái (questStatus). Nội dung bài, mục
   * tiêu, phần thưởng client đọc từ QUESTS. `ev`: vừa nhận (`accept`), vừa đủ mục tiêu (`ready`), vừa trả (`reward`, kèm `done` = mã
   * bước vừa trả), vừa xong cả chuỗi (`finish`); client hiện thông báo theo `ev`.
   */
  sendQuest(id: string, ev?: "accept" | "ready" | "reward" | "finish", done?: string, chain = QUEST_STARTER) {
    const d = this.pdata.get(id), q = d && this.fixedQuest(d, chain); if (!q) return;
    this.clients.getById(id)?.send("quest", { ...q, prog: [...q.prog], status: questStatus(q), ev, done });
  }
  /** Tiến độ chuỗi cố định `chain` (tân thủ hoặc chương sau) của người chơi; undefined nếu không phải chuỗi cố định. */
  fixedQuest(d: PData, chain: string) { return d.quest.chain === chain ? d.quest : d.chains.find((q) => q.chain === chain); }
  /** Chuỗi `chain` đã mở cho người chơi chưa: chuỗi không có điều kiện, hoặc chuỗi `QUEST_AFTER` của nó đã xong. */
  questOpen(d: PData, chain: string) { const a = QUEST_AFTER[chain]; return !a || questStatus(this.fixedQuest(d, a) ?? questStart(a)) === "done"; }

  /**
   * Mục tiêu `have` đã đạt sẵn chưa (lúc nhận nhiệm vụ): võ hồn nào đã có hồn hoàn, đang gắn hồn cốt / hồn hạch, đang ở bản đồ đó,
   * đang thuộc một tông môn (#286).
   */
  questHave(d: PData, g: QuestGoal) {
    if (g.k === "absorb") return d.ringYears.length > 0 || d.owned.some((v) => v !== d.ch && v.rings.length > 0);
    if (g.k === "equip") return d.bag.some((i) => i.vohonId !== null);
    if (g.k === "map") return g.map === this.state.mapId;
    if (g.k === "tong") return d.tong !== null;
    return false;
  }

  /**
   * Sự kiện thật cho bộ đếm nhiệm vụ (hạ hồn thú, đổi tay trong trận, tiên cơ, hấp thụ trong giới hạn, gắn đồ, nói chuyện với NPC,
   * vào bản đồ; từ khảo hạch hằng ngày thêm hồn thú hợp cấp `fit`, trận đấu hồn `arena`; #286 thêm dung hợp kỹ `fusion`, gia nhập tông
   * `tong`): chỉ tính khi đã nhận bước đang làm; mỗi mục tiêu khớp `ev` cộng 1 (kẹp ở `n`), cho chuỗi tân thủ và từng bài khảo hạch.
   * Đủ mọi mục tiêu thì báo quay về NPC.
   * Tiến độ ghi DB cùng túi đồ (bagDirty -> lưu định kỳ, rời phòng, transaction đi cổng).
   */
  questEvent(id: string, ev: QuestEvent) {
    const d = this.pdata.get(id); if (!d || d.travelling) return;
    for (const q of [d.quest, ...d.chains]) {
      const r = this.questBump(q, ev), chain = questChain(q.chain);
      if (!r || !chain) continue;
      d.bagDirty = true;
      if (r === "ready") this.log(id, `Hoàn thành "${chain.steps[q.step].name}": quay về gặp ${npcDef(chain.giver)?.name} ở ${MAPS[chain.map].name} để nhận thưởng.`, "#86e0b0");
      this.sendQuest(id, r === "ready" ? "ready" : undefined, undefined, q.chain);
    }
    // Khảo hạch hằng ngày: cùng sự kiện, từng bài đã nhận (sang ngày mới thì bộ bài cũ bỏ trước).
    if (this.dailyFresh(d)) this.sendDaily(id, "reset");
    let hit = false, ready = -1;
    d.daily.forEach((q, i) => {
      const x = this.questBump(q, ev); if (!x) return;
      hit = true;
      if (x === "ready") { ready = i; this.log(id, `Hoàn thành khảo hạch "${questChain(q.chain)?.steps[0].name}": quay về gặp ${npcDef(DAILY.giver)?.name} ở ${MAPS[DAILY.map].name} để nhận thưởng.`, "#86e0b0"); }
    });
    if (hit) { d.bagDirty = true; this.sendDaily(id, ready >= 0 ? "ready" : undefined, ready); }
    // Tông vụ (#197): cùng sự kiện, từng bài đã nhận.
    if (this.tongFresh(d)) this.sendTong(id);
    let tHit = false;
    for (const q of d.tongTasks) {
      const x = this.questBump(q, ev); if (!x) continue;
      tHit = true;
      if (x === "ready") this.log(id, `Hoàn thành tông vụ "${questChain(q.chain)?.steps[0].name}": quay về sứ giả tông môn để nhận thưởng.`, "#86e0b0");
    }
    if (tHit) { d.bagDirty = true; this.sendTong(id); }
  }
  /** Cộng sự kiện `ev` vào bước đang làm (đã nhận) của tiến độ `q`: null = không mục tiêu nào khớp, "ready" = vừa đủ mọi mục tiêu. */
  questBump(q: QuestProgress, ev: QuestEvent): "hit" | "ready" | null {
    const step = q.accepted ? questChain(q.chain)?.steps[q.step] : undefined; if (!step) return null;
    const was = questStatus(q);
    let hit = false;
    step.goals.forEach((g, i) => {
      if (questGoalHit(g, ev) && (q.prog[i] ?? 0) < g.n) { q.prog[i] = (q.prog[i] ?? 0) + 1; hit = true; }
    });
    return !hit ? null : was !== "ready" && questStatus(q) === "ready" ? "ready" : "hit";
  }

  /**
   * Túi còn đủ chỗ cho mọi vật phẩm `items` cùng lúc không (gộp vào ô cùng mã chưa đầy, không khoá, trước, rồi mở ô mới như addItem),
   * cộng thêm `extra` ô riêng (mỗi hồn cốt một ô).
   */
  bagFits(d: PData, items: { code: string; qty: number }[], extra = 0) {
    const need = new Map<string, number>();
    for (const it of items) need.set(it.code, (need.get(it.code) ?? 0) + it.qty);
    let slots = 0;
    for (const [code, qty] of need) {
      const def = itemDef(code); if (!def) return false;
      const part = d.bag.reduce((a, it) => a + (it.code === code && it.vohonId === null && !it.locked ? Math.max(0, def.stack - it.qty) : 0), 0);
      slots += Math.ceil(Math.max(0, qty - part) / def.stack);
    }
    return bagUsed(d.bag) + slots + extra <= d.bagSlots;
  }

  /** Túi đủ chỗ cho cả phần thưởng nhiệm vụ `r` không: vật phẩm như bagFits, mỗi hồn cốt (`bones`, #285) thêm một ô. */
  rewardFits(d: PData, r: QuestReward) { return this.bagFits(d, r.items, r.bones?.length ?? 0); }

  /**
   * Trao phần thưởng nhiệm vụ đã qua rewardFits: Hồn Tệ, vật phẩm, rồi mỗi hồn cốt (#285) đúng loài và số năm, vị trí tung đều trong
   * BONE_SLOTS, +0, chưa có dòng phụ như hồn cốt rơi (addBone). Trả văn bản để báo log (hồn cốt ghi vị trí đã tung). Không gửi "bag".
   */
  grantReward(d: PData, r: QuestReward) {
    this.addCoin(d, r.honTe);
    for (const it of r.items) this.addItem(d, it.code, it.qty);
    const bones = (r.bones ?? []).flatMap((b) => {
      const it = this.addBone(d, b.years, b.beast, BONE_SLOTS[Math.floor(Math.random() * BONE_SLOTS.length)].id);
      return it ? [this.itemLabel(it)] : [];
    });
    return [questRewardText({ ...r, bones: [] }), ...bones].filter(Boolean).join(", ");
  }

  /**
   * Nhận (`accept`) / trả (`turnin`) bước đang làm của chuỗi tân thủ, hoặc xin tiến độ (`get`). Nhận và trả chỉ khi NPC giao nhiệm vụ
   * có ở bản đồ này, người chơi không gục, không đang chuyển bản đồ và đứng trong NPC_RANGE (như 6.1). Nhận: mục tiêu `have` đã đạt
   * sẵn thì tính xong ngay. Trả: đủ mọi mục tiêu và túi đủ chỗ cho cả phần thưởng (không thì từ chối hết), Hồn Tệ, vật phẩm và
   * hồn cốt (grantReward) vào túi, sang bước kế (chưa nhận; bước đã trả không trả lại được); ghi ngay qua chuỗi lưu, cùng một lần ghi
   * với túi đồ.
   */
  questAction(id: string, op: unknown, chainId?: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    if (op === "get") return this.askQuest(id);
    if (typeof chainId === "string" && isDaily(chainId)) return this.dailyAction(id, op, chainId);
    const q = this.fixedQuest(d, typeof chainId === "string" ? chainId : QUEST_STARTER), chain = q && questChain(q.chain); if (!q || !chain) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendQuest(id, undefined, undefined, q.chain); };
    if (op !== "accept" && op !== "turnin") return warn("Thao tác nhiệm vụ không hợp lệ.");
    const giver = npcDef(chain.giver)!, verb = op === "accept" ? "nhận" : "trả";
    if (!this.map.npcs.some((n) => n.id === chain.giver)) return warn(`${giver.name} không ở đây: tới ${MAPS[chain.map].name} để ${verb} nhiệm vụ.`);
    if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
    if (!this.npcNear(id, { id: chain.giver })) return warn(`Hãy lại gần ${giver.name} hơn để ${verb} nhiệm vụ.`);
    const st = questStatus(q), step = chain.steps[q.step];
    if (st === "done") return warn(`Đã học xong cả chuỗi "${chain.name}".`);
    if (!this.questOpen(d, chain.id)) return warn(`Chưa mở chuỗi "${chain.name}": hoàn thành chuỗi "${questChain(QUEST_AFTER[chain.id])?.name}" trước.`);
    if (op === "accept") {
      if (st !== "offer") return warn(`Đang làm "${step.name}": xong rồi quay lại trả nhiệm vụ.`);
      Object.assign(q, { accepted: true, prog: step.goals.map((g) => (g.have && this.questHave(d, g) ? g.n : 0)) });
      d.bagDirty = true;
      this.log(id, `Nhận nhiệm vụ "${step.name}" (bài ${q.step + 1}/${chain.steps.length}): ${step.desc}`, giver.col);
      const ready = questStatus(q) === "ready";
      if (ready) this.log(id, `Đã đạt sẵn mục tiêu của "${step.name}": trả nhiệm vụ ngay để nhận thưởng.`, "#86e0b0");
      this.sendQuest(id, ready ? "ready" : "accept", undefined, q.chain);
      this.saveTrade(id, d);
      return;
    }
    if (st === "offer") return warn(`Chưa nhận "${step.name}".`);
    if (st !== "ready") return warn(`Chưa xong "${step.name}": ${step.goals.map((g, i) => `${g.text} ${q.prog[i] ?? 0}/${g.n}`).join(", ")}.`);
    if (!this.rewardFits(d, step.reward))
      return warn(`Túi đồ không đủ chỗ cho phần thưởng (${questRewardText(step.reward)}): bỏ hoặc bán bớt đồ trước.`);
    const got = this.grantReward(d, step.reward);
    Object.assign(q, { step: q.step + 1, accepted: false, prog: [] });
    d.bagDirty = true;
    this.log(id, `Trả nhiệm vụ "${step.name}": nhận ${got}.`, "#f2c84b");
    const finish = questStatus(q) === "done";
    if (finish) this.log(id, `Hoàn thành chuỗi nhiệm vụ "${chain.name}"!`, giver.col);
    this.sendBag(id);
    this.sendQuest(id, finish ? "finish" : "reward", step.id, q.chain);
    this.save(id); // phần thưởng và bước mới ghi ngay, cùng một lần ghi túi đồ
  }

  // ---------- Khảo hạch hằng ngày của Phất Lan Đức (mục 5.8 "Nhiệm vụ hằng ngày") ----------
  /**
   * Ngày của bộ khảo hạch (vnDay, đổi lúc 00:00 giờ Việt Nam): như `today` (hook `day` của phòng lệch được), cộng độ lệch toàn tiến
   * trình `dailyShift` của hook `daily {shift}` (để bot chọn ngày có bộ bài cần thử và mang cùng ngày đó sang phòng sân đấu).
   */
  dailyDay() { return vnDay(bossNow() + (this.dayShift + dailyShift) * 86400000); }
  /** Bộ khảo hạch hôm nay (dailyIds) từ các dòng `quests` đã lưu; bài chưa có dòng thì chưa nhận. Dòng của ngày khác bỏ qua. */
  dailyOf(saved: QuestProgress[] | undefined, day = this.dailyDay()) {
    return { dailyDay: day, daily: dailyIds(day).map((id) => saved?.find((q) => q.chain === id) ?? questStart(id)) };
  }
  /**
   * Sang ngày mới (00:00 giờ Việt Nam, dailyDay) thì thay bằng bộ bài mới chưa nhận; bài cũ dở dang bỏ luôn (dòng cũ trong bảng `quests`
   * bị xóa ở lần ghi túi kế tiếp, writeBag). Trả true khi vừa đặt lại (nơi gọi gửi tin "daily").
   */
  dailyFresh(d: PData, day = this.dailyDay()) {
    if (d.dailyDay === day) return false;
    Object.assign(d, this.dailyOf(undefined, day));
    d.bagDirty = true;
    return true;
  }
  /**
   * Các món mã `code` nộp được cho mục tiêu `give`: nằm trong túi (không gắn), chưa cường hóa / nâng cấp, không phải hồn hoàn đang hấp
   * thụ (#165: đồ đang dùng không làm nguyên liệu đồng thời); rẻ nhất trước.
   */
  giveItems(d: PData, code: string) {
    return d.bag.filter((it) => it.code === code && it.vohonId === null && !(it.enhance > 0) && it.id !== d.absorbing?.itemId)
      .sort((a, b) => (sellPrice(a) ?? 0) - (sellPrice(b) ?? 0));
  }
  /**
   * Số đếm của mục tiêu `give` = số món đang có trong túi (kẹp ở `n`), tính lại mỗi khi túi đổi. Trả chỉ số bài vừa đủ mục tiêu
   * (-1 = không có) và có đổi số đếm nào không.
   */
  dailyGive(d: PData, list: QuestProgress[] = d.daily) {
    let changed = false, ready = -1;
    list.forEach((q, i) => {
      const step = q.accepted ? questChain(q.chain)?.steps[q.step] : undefined; if (!step) return;
      const was = questStatus(q);
      step.goals.forEach((g, k) => {
        if (g.k !== "give" || !g.item) return;
        const n = Math.min(g.n, this.giveItems(d, g.item).reduce((a, it) => a + it.qty, 0));
        if (q.prog[k] !== n) { q.prog[k] = n; changed = true; }
      });
      if (was !== "ready" && questStatus(q) === "ready") ready = i;
    });
    return { changed, ready };
  }
  /**
   * Tin riêng "daily": ngày (vnDay), DAILY.count bài (tiến độ như tin "quest" và trạng thái), `ev` vừa nhận / vừa đủ / vừa trả /
   * vừa đặt lại sang ngày mới (`reset`) kèm `i` = bài đó, và `route` chỉ đường từ bản đồ này (mapRoute) để client chấm mục tiêu
   * ở bản đồ khác lên cổng đúng hướng. Nội dung bài client tự suy từ mã (questChain).
   */
  sendDaily(id: string, ev?: "accept" | "ready" | "reward" | "reset", i = -1) {
    const d = this.pdata.get(id), c = this.clients.getById(id); if (!d || !c) return;
    if (this.dailyFresh(d)) ev = "reset";
    this.dailyGive(d);
    c.send("daily", { day: d.dailyDay, list: d.daily.map((q) => ({ ...q, prog: [...q.prog], status: questStatus(q) })), ev, i, route: mapRoute(this.state.mapId) });
  }
  /** Túi vừa đổi: mục tiêu nộp vật phẩm có thể vừa đủ / vừa thiếu, gửi lại tin "daily" khi đổi số đếm. */
  dailyBag(id: string) {
    const d = this.pdata.get(id); if (!d) return;
    const t = this.dailyGive(d, d.tongTasks); // tông vụ nộp vật phẩm (#197)
    if (t.changed) {
      if (t.ready >= 0) this.log(id, `Đã đủ đồ cho tông vụ "${questChain(d.tongTasks[t.ready].chain)?.steps[0].name}": mang tới nộp cho sứ giả tông môn.`, "#86e0b0");
      this.sendTong(id);
    }
    const { changed, ready } = this.dailyGive(d); if (!changed) return;
    if (ready >= 0) this.log(id, `Đã đủ đồ cho khảo hạch "${questChain(d.daily[ready].chain)?.steps[0].name}": mang tới nộp cho ${npcDef(DAILY.giver)?.name} ở ${MAPS[DAILY.map].name}.`, "#86e0b0");
    this.sendDaily(id, ready >= 0 ? "ready" : undefined, ready);
  }
  /**
   * Nhận / trả bài khảo hạch `chainId` của hôm nay: như questAction (NPC DAILY.giver có ở bản đồ này, không gục, đứng trong NPC_RANGE).
   * Trả bài: đủ mục tiêu; mục tiêu `give` bớt đồ khỏi túi trước (rẻ nhất trước) rồi mới kiểm tra túi đủ chỗ cho phần thưởng (thiếu thì
   * trả lại túi như cũ, giữ tiến độ). Bài của ngày đã qua thì từ chối. Ghi ngay qua chuỗi lưu như questAction.
   */
  dailyAction(id: string, op: unknown, chainId: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendDaily(id); };
    if (this.dailyFresh(d)) this.sendDaily(id, "reset");
    const i = d.daily.findIndex((q) => q.chain === chainId);
    if (i < 0) return warn(`Bài khảo hạch đó đã hết hạn: hôm nay ${npcDef(DAILY.giver)?.name} ra bài mới.`);
    if (op !== "accept" && op !== "turnin") return warn("Thao tác nhiệm vụ không hợp lệ.");
    const giver = npcDef(DAILY.giver)!, verb = op === "accept" ? "nhận" : "trả";
    if (!this.map.npcs.some((n) => n.id === DAILY.giver)) return warn(`${giver.name} không ở đây: tới ${MAPS[DAILY.map].name} để ${verb} khảo hạch.`);
    if (p.dead) return warn("Đã gục ngã, không thể nói chuyện.");
    if (!this.npcNear(id, { id: DAILY.giver })) return warn(`Hãy lại gần ${giver.name} hơn để ${verb} khảo hạch.`);
    const step = questChain(chainId)!.steps[0];
    this.dailyGive(d);
    const st = questStatus(d.daily[i]);
    if (st === "done") return warn(`Đã xong "${step.name}" hôm nay: mai có bài mới.`);
    if (op === "accept") {
      if (st !== "offer") return warn(`Đang làm "${step.name}": xong rồi quay lại trả bài.`);
      d.daily[i] = { chain: chainId, step: 0, accepted: true, prog: step.goals.map(() => 0) };
      d.bagDirty = true;
      this.dailyGive(d);
      this.log(id, `Nhận khảo hạch "${step.name}": ${step.desc}`, giver.col);
      const ready = questStatus(d.daily[i]) === "ready";
      if (ready) this.log(id, `Đã đạt sẵn mục tiêu của "${step.name}": trả bài ngay để nhận thưởng.`, "#86e0b0");
      this.sendDaily(id, ready ? "ready" : "accept", i);
      this.saveTrade(id, d);
      return;
    }
    if (st === "offer") return warn(`Chưa nhận "${step.name}".`);
    if (st !== "ready") return warn(`Chưa xong "${step.name}": ${step.goals.map((g, k) => `${g.text} ${d.daily[i].prog[k] ?? 0}/${g.n}`).join(", ")}.`);
    const gives = step.goals.some((g) => g.k === "give");
    if (gives && claimHeld(d)) return warn(CLAIM_BUSY); // #165: như bán / bỏ đồ
    // Nộp vật phẩm trên bản sao túi: túi không đủ chỗ cho phần thưởng thì trả lại túi cũ. Bài không nộp đồ thì không chép túi (#165:
    // các món đang chờ DB xác nhận, như phần thưởng boss, giữ nguyên đối tượng).
    const keep = d.bag, dirty = d.bagDirty;
    if (gives) d.bag = d.bag.map((it) => ({ ...it }));
    for (const g of step.goals) {
      if (g.k !== "give" || !g.item) continue;
      let left = g.n;
      for (const it of this.giveItems(d, g.item)) { if (left <= 0) break; const n = Math.min(left, it.qty); this.takeItem(d, it, n); left -= n; }
    }
    if (!this.rewardFits(d, step.reward)) {
      d.bag = keep; d.bagDirty = dirty;
      return warn(`Túi đồ không đủ chỗ cho phần thưởng (${questRewardText(step.reward)}): bỏ hoặc bán bớt đồ trước.`);
    }
    const got = this.grantReward(d, step.reward);
    d.daily[i] = { chain: chainId, step: 1, accepted: false, prog: [] };
    d.bagDirty = true;
    const given = step.goals.filter((g) => g.k === "give").map((g) => `${g.n} ${itemDef(g.item ?? "")?.name ?? g.item}`).join(", ");
    this.log(id, `Trả khảo hạch "${step.name}"${given ? ` (nộp ${given})` : ""}: nhận ${got}.`, "#f2c84b");
    this.sendBag(id);
    this.sendDaily(id, "reward", i);
    this.save(id); // phần thưởng, đồ đã nộp và bài đã xong ghi ngay, cùng một lần ghi túi đồ
  }

  // ---------- Đại Đấu Hồn Trường: xếp hàng ở NPC, bảng xếp hạng (mục 5.9, bước 7.2; trận đấu ở ArenaRoom) ----------
  /**
   * Lý do chưa ghép trận được lúc này ("" = được): đang chuyển bản đồ / đi qua cổng, đã gục, đang hấp thụ, đang giao chiến,
   * hoặc tổ đội chưa đủ điều kiện 2 người cùng phòng. Người đang xếp hàng mà rơi vào một trạng thái này thì vòng ghép bỏ qua
   * (vẫn giữ chỗ), trừ khi rời phòng thì cả bên bị bỏ khỏi hàng.
   */
  arenaAccounts(accountId: number) {
    const members = party.partyMembers(accountId);
    return members.length ? [...members] : [accountId];
  }

  /** Lý do một hồn sư chưa rời bản đồ sang sân được (xếp hàng, xem trận); "" = được. */
  arenaBusyOne(q: PlayerState, x: PData): string {
    if (x.travelling) return "Đang chuyển bản đồ.";
    if (x.travelCast) return "Đang đi qua cổng.";
    if (q.dead) return "Đã gục ngã.";
    if (x.absorbing) return "Đang hấp thụ hồn hoàn.";
    if (x.fight < TEAM_COMBAT_SECS) return "Đang giao chiến.";
    return "";
  }
  arenaBusy(id: string): string {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return "Không có hồn sư.";
    const one = (q: PlayerState, x: PData) => this.arenaBusyOne(q, x);
    const own = one(p, d); if (own) return own;
    const pid = party.partyIdOf(d.accountId); if (!pid) return "";
    const members = party.partyMembers(d.accountId);
    if (members.length !== 2) return "Tổ đội Đại Đấu Hồn Trường cần đúng 2 người.";
    if (party.partyLeader(d.accountId) !== d.accountId) return "Chỉ trưởng nhóm được xếp hàng cho tổ đội.";
    if (!party.partyInRoom(d.accountId, this.roomId)) return "Hai thành viên phải ở cùng kênh bản đồ.";
    for (const acc of members) {
      const row = [...this.pdata.entries()].find(([, x]) => x.accountId === acc);
      if (!row) return "Cả hai thành viên phải đang ở cùng kênh bản đồ.";
      const q = this.state.players.get(row[0]); if (!q) return "Cả hai thành viên phải đang ở cùng kênh bản đồ.";
      const why = one(q, row[1]); if (why) return `${why} (thành viên tổ đội).`;
    }
    return "";
  }

  /** Kiểm tra phiên của cả bên còn nguyên trước khi mở phòng riêng, tránh tạo trận thiếu thành viên. */
  arenaCanFound(rows: [string, PData][]) {
    return rows.every(([sid, d]) => this.clients.getById(sid) && this.state.players.get(sid) && this.pdata.get(sid) === d && !d.travelling);
  }

  /** Báo và đưa bên còn nguyên về hàng khi đối thủ rời đúng lúc vòng ghép mở phòng. */
  arenaQueueRetry(rows: [string, PData][]) {
    for (const [sid] of rows) {
      if (!this.pdata.has(sid)) continue;
      this.log(sid, "Đối thủ vừa rời hàng chờ, tiếp tục tìm trận.", "#ff9a8a");
      this.sendArenaQueue(sid);
    }
  }

  /** Báo cho phiên còn lại rằng mục hàng đã hủy vì bên này không còn đủ người vào sân. */
  arenaQueueAbort(rows: [string, PData][]) {
    for (const [sid] of rows) {
      if (!this.pdata.has(sid)) continue;
      this.log(sid, "Không thể vào sân Đại Đấu Hồn Trường, hàng chờ đã hủy.", "#ffb35c");
      this.sendArenaQueue(sid);
    }
  }

  /** Tin riêng "arena" k = "queue": đang xếp hàng hay không (client hiện / ẩn ô "Đang tìm trận"). */
  sendArenaQueue(id: string) {
    const d = this.pdata.get(id), q = d && arenaQueued(d.accountId);
    this.clients.getById(id)?.send("arena", q ? { k: "queue", on: true, elo: q.elo, members: q.members.map((m) => m.name), secs: (Date.now() - q.since) / 1000 } : { k: "queue", on: false });
  }

  /**
   * `arena {op}` (7.2): `queue` xếp hàng (phải đứng cạnh NPC Đại Đấu Hồn Trường, NPC_RANGE; không gục, không đi cổng, không hấp thụ,
   * không giao chiến), `cancel` hủy xếp hàng, `top` xin bảng xếp hạng kèm thành tích của mình (ở đâu cũng xem được, cách nhau ARENA.topCd
   * giây). Elo đọc từ DB lúc xếp hàng, hai lần đọc của một tài khoản cách nhau ít nhất ARENA.queueCd giây (arenaQueueSlots; cả bên ghi
   * mốc nguyên tử, xếp rồi hủy
   * liên tục không tạo tải DB đều đặn); `cancel` trong lúc đang đọc thì đọc xong không xếp hàng (#225). Ghép trận ở arenaQueue.ts, trận
   * đấu ở ArenaRoom. Xem trực tiếp (#278): `live` danh sách trận đang đếm ngược / giao đấu, `watch {roomId}` vào xem (arenaWatch).
   */
  arenaAction(id: string, raw: unknown, roomId?: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const op = strIn(raw), warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendArenaQueue(id); };
    if (op === "top") return this.arenaTop(id);
    if (op === "live") return this.arenaLiveList(id);
    if (op === "watch") return this.arenaWatch(id, strIn(roomId));
    if (op === "cancel") {
      const accounts = this.arenaAccounts(d.accountId), removed = arenaDequeue(d.accountId), cancelled = accounts.some((acc) => arenaReadCancel(acc));
      if (removed || cancelled) {
        // Hủy mục đã vào queue thì mở khóa ngay; hủy lúc đọc Elo chỉ đánh dấu, Promise phải tự hạ cờ khi kết thúc.
        for (const acc of accounts) {
          const row = [...this.pdata.entries()].find(([, x]) => x.accountId === acc);
          if (row) { if (removed) row[1].arenaBusy = false; this.sendArenaQueue(row[0]); }
        }
        this.log(id, "Đã hủy xếp hàng Đại Đấu Hồn Trường.");
      }
      return this.sendArenaQueue(id);
    }
    if (op !== "queue") return warn("Thao tác Đại Đấu Hồn Trường không hợp lệ.");
    if (d.arenaBusy && arenaReadCancelled(d.accountId)) return warn("Thao tác quá nhanh, chờ một chút rồi xếp hàng lại.");
    if (arenaQueued(d.accountId) || d.arenaBusy) return warn("Đang tìm đối thủ rồi.");
    const why = this.arenaBusy(id); if (why) return warn(`${why} Chưa xếp hàng được.`);
    const accounts = this.arenaAccounts(d.accountId);
    const rows = accounts.map((acc) => [...this.pdata.entries()].find(([, x]) => x.accountId === acc)).filter((x): x is [string, PData] => !!x);
    if (rows.length !== accounts.length) return warn("Cả hai thành viên phải đang ở cùng kênh bản đồ.");
    if (!rows.every(([sid]) => this.npcNear(sid, { role: "arena" }))) return warn("Cả hai thành viên phải lại gần Đại Đấu Hồn Trường.");
    if (!arenaQueueSlots(accounts)) return warn("Thao tác quá nhanh, chờ một chút rồi xếp hàng lại.");
    rows.forEach(([, x]) => { x.arenaBusy = true; });
    Promise.all([Promise.all(rows.map(([, x]) => arenaReadElo(x.accountId, () => store.getArena(x.accountId, ARENA.startElo)))),
      Promise.all(rows.map(([, x]) => store.isTestAccount(x.accountId)))]).then(([recs, tests]) => {
      rows.forEach(([, x]) => { x.arenaBusy = false; });
      if (rows.some(([sid, x]) => this.pdata.get(sid) !== x) || recs.some((rec) => !rec)) return;
      // Tổ đội lẫn tài khoản test và người thật không xếp hàng được (#518): đội test chỉ gặp đội test, nên người thật trong đó sẽ bị đổi Elo bởi trận với tài khoản test.
      if (tests.some(Boolean) && !tests.every(Boolean)) return warn("Tổ đội có cả tài khoản test và người thật: không xếp hàng xếp hạng được.");
      const current = this.arenaAccounts(d.accountId);
      if (current.length !== accounts.length || current.some((acc) => !accounts.includes(acc))) return;
      const late = this.arenaBusy(id); if (late) return warn(`${late} Chưa xếp hàng được.`);
      const e: ArenaTeamEntry = { id: party.partyIdOf(d.accountId) ? `party:${party.partyIdOf(d.accountId)}` : `solo:${d.accountId}`,
        members: rows.map(([, x], i) => ({ accountId: x.accountId, name: this.state.players.get(rows[i][0])!.name, rec: recs[i]!, ...(tests[i] ? { test: true } : {}) })),
        elo: arenaTeamElo(recs.map((rec) => rec!.elo)), since: Date.now(),
        ready: () => this.pdata.get(id) === d && this.arenaAccounts(d.accountId).length === accounts.length
          && this.arenaAccounts(d.accountId).every((acc) => accounts.includes(acc)) && !this.arenaBusy(id),
        canFound: () => this.arenaCanFound(rows), found: (roomId, foe) => this.arenaFound(rows, roomId, foe),
        requeue: () => this.arenaQueueRetry(rows), abort: () => this.arenaQueueAbort(rows), rollback: () => this.arenaFoundRollback(rows) };
      return arenaEnqueue(e).then(() => {
        for (const [sid] of rows) { this.log(sid, `Đang tìm đối thủ (Elo đội ${e.elo}): ghép đội Elo gần nhất, chờ càng lâu càng nới rộng.`, "#ff9a8a"); this.sendArenaQueue(sid); }
      }, (err) => { console.error("Không xếp hàng được đội Đại Đấu Hồn Trường", err); rows.forEach(([, x]) => { x.arenaBusy = false; }); warn("Không xếp hàng được, thử lại."); });
    }, (e) => { rows.forEach(([, x]) => { x.arenaBusy = false; }); console.error(`Không đọc được Elo đội Đại Đấu Hồn Trường`, e); warn("Không xếp hàng được, thử lại."); });
  }

  /**
   * Đã ghép trận (arenaQueue.ts): dừng mọi hành động như lúc đi cổng (freeze), báo client vào phòng ArenaRoom `roomId`. Client rời
   * phòng này (onLeave lưu vị trí như thường: sau trận quay về đúng chỗ cũ); không rời trong ARENA.joinSecs giây thì server ngắt kết
   * nối. Trả false nếu một thành viên đã rời phòng; arenaQueue sẽ hủy trận và trả bên còn nguyên về hàng.
   */
  arenaFound(rows: [string, PData][], roomId: string, foe: ArenaTeamEntry) {
    if (!this.arenaCanFound(rows)) return false;
    for (const [id, d] of rows) {
      const c = this.clients.getById(id)!, p = this.state.players.get(id)!;
      this.freeze(id); this.portalHint(id, p, d); d.arenaGone = true;
      c.send("arena", { k: "found", roomId, foe: foe.members.map((m) => m.name).join(" / "), elo: foe.elo, members: foe.members.map((m) => m.name) });
      this.clock.setTimeout(() => { if (d.arenaGone && this.clients.getById(id)) c.leave(4006); }, ARENA.joinSecs * 1000);
    }
    return true;
  }

  /**
   * Tin riêng "arena" k = "live" (#278): tối đa ARENA.liveN trận đang đếm ngược / giao đấu (giao đấu trước, rồi ít thời gian còn lại
   * hơn): mã phòng, 1v1 / 2v2, tên và Elo hai bên, pha, giây còn lại, số người xem / tối đa. Xin lại cách nhau ARENA.topCd giây.
   */
  arenaLiveList(id: string) {
    const d = this.pdata.get(id); if (!d) return;
    const now = Date.now(); if (now - d.arenaLiveAt < ARENA.topCd * 1000) return;
    d.arenaLiveAt = now;
    arenaLiveOpenList().then((all) => {
      const list = all.sort((a, b) => (a.phase === "fight" ? 0 : 1) - (b.phase === "fight" ? 0 : 1) || a.secs - b.secs).slice(0, ARENA.liveN)
        .map((l) => ({ ...l, secs: Math.ceil(l.secs), max: arenaWatchMax() }));
      this.clients.getById(id)?.send("arena", { k: "live", list });
    }, (e) => console.error("Không đọc được sổ xem trận", e));
  }

  /**
   * Vào xem trực tiếp trận `roomId` (#278, mục 5.9): đứng gần Đại Đấu Hồn Trường, cùng điều kiện như xếp hàng (arenaBusyOne), không đang
   * xếp hàng / xem trận khác; trận còn đếm ngược / giao đấu và còn chỗ (arenaWatchMax, gồm chỗ đang giữ). Giữ chỗ cho tài khoản
   * ARENA.joinSecs giây rồi đi đúng đường vào sân như người đấu (freeze, tin `arena {k: "watch"}`, không rời kịp thì ngắt kết nối).
   */
  arenaWatch(id: string, roomId: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id), c = this.clients.getById(id); if (!p || !d || !c) return;
    const no = (text: string) => this.log(id, `${text} Chưa vào xem được.`, "#ffb35c");
    // L1 #789: nhịp ARENA.topCd như top / live, và mã phòng sai dạng bị bỏ trước khi chạm sổ presence dùng chung.
    const now = Date.now(); if (now - d.arenaWatchAt < ARENA.topCd * 1000) return;
    d.arenaWatchAt = now;
    if (!roomId || roomId.length > 64) return no("Mã trận không hợp lệ.");
    if (!this.npcNear(id, { role: "arena" })) return no("Hãy lại gần Đại Đấu Hồn Trường.");
    const why = this.arenaBusyOne(p, d); if (why) return no(why);
    if (arenaQueued(d.accountId) || d.arenaBusy) return no("Đang xếp hàng: hủy hàng trước khi xem trận.");
    const until = Date.now() + ARENA.joinSecs * 1000;
    arenaLiveHold(roomId, d.accountId, until, arenaWatchMax()).then((r) => {
      if (r === "other") return no("Đang xem một trận khác.");
      if (r === "gone") return no("Trận đấu không còn diễn ra.");
      if (r === "full") return no(`Trận đã đủ ${arenaWatchMax()} người xem.`);
      const p2 = this.state.players.get(id);
      // Trong lúc chờ sổ presence người chơi có thể đã rời / đi cổng / xếp hàng: nhả chỗ giữ, không freeze.
      if (!p2 || this.pdata.get(id) !== d || d.travelling || arenaQueued(d.accountId) || d.arenaBusy || !this.clients.getById(id)) {
        void arenaLiveRelease(roomId, d.accountId).catch((e) => console.error("Không nhả chỗ giữ xem trận", e)); return;
      }
      this.freeze(id); this.portalHint(id, p2, d); d.arenaGone = true;
      c.send("arena", { k: "watch", roomId, sides: r.sides });
      this.clock.setTimeout(() => { if (d.arenaGone && this.clients.getById(id)) c.leave(4006); }, ARENA.joinSecs * 1000);
    }, (e) => { console.error("Không giữ được chỗ xem trận", e); no("Hệ thống bận."); });
  }

  /** Hoàn tác freeze nếu bên kia mất phiên ngay sau khi matchMaker mở phòng nhưng trước khi cả hai nhận mã. */
  arenaFoundRollback(rows: [string, PData][]) {
    for (const [sid, d] of rows) {
      const p = this.state.players.get(sid);
      if (!p || this.pdata.get(sid) !== d) continue;
      d.travelling = false; d.arenaGone = false; this.portalHint(sid, p, d);
    }
  }

  /** Tin riêng "arenaTop": ARENA.topN dòng đầu bảng xếp hạng (dòng của mình có `me`), hạng / thành tích của mình, lượt thắng có thưởng còn lại hôm nay. */
  arenaTop(id: string) {
    const d = this.pdata.get(id); if (!d) return;
    const now = Date.now(); if (now - d.arenaTopAt < ARENA.topCd * 1000) return;
    d.arenaTopAt = now;
    Promise.all([store.arenaTop(ARENA.topN, d.accountId), store.bossClaims(d.accountId, this.today(), ARENA.claimKind)]).then(([t, n]) => {
      this.clients.getById(id)?.send("arenaTop", { list: t.list.map((r) => ({ name: r.name, elo: r.elo, wins: r.wins, losses: r.losses, draws: r.draws, me: r.accountId === d.accountId })),
        me: t.me, start: ARENA.startElo, left: Math.max(0, ARENA.dailyWins - n), queued: !!arenaQueued(d.accountId) });
    }, (e) => console.error("Không đọc được bảng xếp hạng Đại Đấu Hồn Trường", e));
  }

  /** Lưu túi đồ sau mua / bán qua chuỗi lưu (mục 6); bấm dồn dập thì chỉ một lần chờ trong chuỗi, lần đó chụp túi mới nhất. */
  saveTrade(id: string, d: PData) {
    if (d.tradeQueued) return;
    d.tradeQueued = true;
    this.chain(d, () => { d.tradeQueued = false; return this.write(id); });
  }

  /** Số món mã `code` túi còn nhận được: chỗ trống trong ô cùng mã (cùng trạng thái khoá `locked`) chưa đầy và các ô trống (như addItem). */
  bagRoom(d: PData, code: string, locked = false) {
    const def = itemDef(code); if (!def) return 0;
    const part = d.bag.reduce((a, it) => a + (it.code === code && it.vohonId === null && !!it.locked === locked ? Math.max(0, def.stack - it.qty) : 0), 0);
    return part + Math.max(0, d.bagSlots - bagUsed(d.bag)) * def.stack;
  }

  /**
   * Mua `rawQty` món `rawCode` ở thương nhân (giá đồng mỗi món theo bảng hàng của thương nhân đứng gần, shopOf: SHOP trong thành,
   * CAMP_SHOP ở trại cổng): phải đứng gần thương nhân, mã có trong bảng hàng đó, 1..SHOP_MAX_QTY món, đủ Hồn Tệ và túi đủ chỗ cho cả
   * số món đó (thiếu thì từ chối hết, không trừ tiền). Server tính giá; ghi DB qua chuỗi lưu.
   */
  buyItem(id: string, rawCode: unknown, rawQty: unknown, rawNpc?: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const npc = this.shopFor(id, d, rawNpc, "mua");
    if (typeof npc === "string") return warn(npc);
    const row = shopOf(npc.id).find((s) => s.code === rawCode), def = row && itemDef(row.code);
    if (!row || !def) return warn("Thương nhân không bán món này.");
    const qty = Number.isInteger(rawQty) ? (rawQty as number) : 0;
    if (qty < 1 || qty > SHOP_MAX_QTY) return warn(`Mỗi lần mua từ 1 đến ${SHOP_MAX_QTY} món.`);
    const cost = row.price * qty;
    if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: ${qty} ${def.name} giá ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
    if (this.bagRoom(d, row.code) < qty) return warn(`Túi đồ không đủ chỗ cho ${qty} ${def.name} (${d.bagSlots} ô): bỏ hoặc bán bớt đồ trước.`);
    d.honTe -= cost; d.bagDirty = true;
    this.addItem(d, row.code, qty);
    this.log(id, `Mua ${qty} ${def.name}: −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)}).`, def.col);
    this.sendBag(id);
    this.saveTrade(id, d);
  }

  /** Số mảnh đã đổi ở Thương hội hôm nay (đã được DB xác nhận); sang ngày mới (giờ Việt Nam) thì về 0 (#282). */
  shardBuyToday(d: PData) {
    if (d.shardBuy.day !== this.today()) { d.shardBuy.day = this.today(); d.shardBuy.n = 0; }
    return d.shardBuy.n;
  }
  /** Tin riêng "shardinfo" (#282): số mảnh đã đổi hôm nay (kể cả lần đang chờ DB) và trần ngày; client tính giá bằng shardBuyPrice. */
  sendShardInfo(id: string) {
    const d = this.pdata.get(id); if (!d) return;
    this.clients.getById(id)?.send("shardinfo", { n: this.shardBuyToday(d) + d.shardBuy.pend, daily: SHARD_BUY.daily });
  }

  /**
   * Đổi `rawQty` mảnh võ hồn `rawVohon` ở Thương hội Thiên Đấu (#282, mục 5.7): phải đứng cạnh đúng NPC SHARD_BUY.npc, ngoài giao
   * chiến (shopFor), võ hồn trong ARENA_SHARDS (không bao giờ bán mảnh UR), không vượt SHARD_BUY.daily mảnh hôm nay, đủ Hồn Tệ và
   * túi đủ chỗ cho cả số mảnh (thiếu thì từ chối hết). Giá tăng dần theo số mảnh đã đổi trong ngày (shardBuyCost). Như rương thú
   * vương (grantChest): giữ chỗ ngay (`pend`, claimBusy chặn bán / bỏ đồ), tới lượt trong chuỗi lưu mới kiểm lại, trừ tiền, cho mảnh
   * vào túi và ngay đó tăng lượt cùng ghi túi (cả Hồn Tệ) trong một transaction (store.claimBoss). Giá tính theo số lượt đã được DB
   * xác nhận lúc tới lượt, nên bấm dồn không sai giá hay vượt trần. DB báo hết lượt hoặc lỗi thì trả lại tiền và lấy lại mảnh.
   */
  buyShards(id: string, rawVohon: unknown, rawQty: unknown, rawNpc: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); this.sendShardInfo(id); };
    const npc = this.shopFor(id, d, rawNpc, "đổi mảnh");
    if (typeof npc === "string") return warn(npc);
    if (npc.id !== SHARD_BUY.npc) return warn("Chỉ Chưởng quỹ Thương hội Thiên Đấu (Thiên Đấu Thành) đổi mảnh võ hồn.");
    const vh = typeof rawVohon === "string" && ARENA_SHARDS.includes(rawVohon) ? VOHON[vohonIndex(rawVohon)] : undefined;
    const def = vh && itemDef(shardCode(vh.id));
    if (!vh || !def) return warn("Thương hội chỉ đổi mảnh võ hồn SR / SSR (không có mảnh UR).");
    const K = SHARD_BUY, left = K.daily - this.shardBuyToday(d) - d.shardBuy.pend;
    if (left <= 0) return warn(`Hôm nay đã đổi đủ ${K.daily}/${K.daily} mảnh ở Thương hội. Lượt mới lúc 00:00 giờ Việt Nam.`);
    const qty = Number.isInteger(rawQty) ? (rawQty as number) : 0;
    if (qty < 1 || qty > left) return warn(`Mỗi lần đổi từ 1 đến ${left} mảnh (hôm nay còn ${left}/${K.daily}).`);
    const need = shardBuyCost(K.daily - left, qty);
    if (d.honTe < need) return warn(`Không đủ Hồn Tệ: ${qty} ${def.name} giá ${formatHonTe(need)}, đang có ${formatHonTe(d.honTe)}.`);
    if (this.bagRoom(d, def.id) < qty) return warn(`Túi đồ không đủ chỗ cho ${qty} ${def.name} (${d.bagSlots} ô): bỏ hoặc bán bớt đồ trước.`);
    const day = this.today();
    d.shardBuy.pend += qty; d.claimBusy++;
    this.chain(d, async () => {
      // Tới lượt: kiểm lại theo số lượt DB đã xác nhận (các lần đổi trước đã xong), rồi trừ tiền + cho mảnh ngay trước khi chụp túi.
      if (this.today() !== day) return warn("Đã sang ngày mới: mở lại trang Thương hội để xem giá.");
      const done = this.shardBuyToday(d), cost = shardBuyCost(done, qty);
      if (done + qty > K.daily) return warn(`Hôm nay chỉ còn ${Math.max(0, K.daily - done)}/${K.daily} mảnh ở Thương hội.`);
      if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: ${qty} ${def.name} giá ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
      if (this.bagRoom(d, def.id) < qty) return warn(`Túi đồ không đủ chỗ cho ${qty} ${def.name} (${d.bagSlots} ô): bỏ hoặc bán bớt đồ trước.`);
      d.honTe -= cost; d.bagDirty = true; this.addItem(d, def.id, qty);
      const takeBack = () => {
        d.honTe += cost; d.bagDirty = true;
        let n = qty;
        for (const x of d.bag.filter((i) => i.code === def.id && i.vohonId === null).reverse()) { // cả ô vừa khoá trong lúc chờ
          const k = Math.min(n, x.qty); this.takeItem(d, x, k); n -= k; if (!n) break;
        }
      };
      let n: number | null;
      try { n = await store.claimBoss(d.accountId, day, K.claimKind, K.daily, this.bagSnapshot(d), qty); }
      catch (e) { takeBack(); warn(`Không lưu được lần đổi ${def.name}, thử lại sau (không mất Hồn Tệ).`); throw e; }
      if (n === null) {
        takeBack(); d.shardBuy.n = await store.bossClaims(d.accountId, day, K.claimKind).catch(() => K.daily);
        return warn(`Hôm nay đã đổi đủ ${K.daily}/${K.daily} mảnh ở Thương hội.`);
      }
      if (d.shardBuy.day === day) d.shardBuy.n = n;
      this.log(id, `Đổi ${qty} ${def.name} ở Thương hội: −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)}), hôm nay ${n}/${K.daily} mảnh.`, vh.col);
    }).then(() => {
      d.shardBuy.pend -= qty; d.claimBusy--;
      if (this.pdata.get(id) === d) { this.sendBag(id); this.sendShardInfo(id); }
    });
  }

  /**
   * Bán cho thương nhân `rawQty` món (thiếu: cả ô) ở ô `rawId` trong túi của chính người gửi: phải đứng gần thương nhân; không bán
   * đồ đang gắn trên võ hồn (hồn cốt, hồn hạch), hồn hoàn đang hấp thụ, đan và rương (sellPrice null). Giá do
   * server tính (sellPrice theo niên hạn / sao / độ hiếm); ghi DB qua chuỗi lưu.
   */
  sellItem(id: string, rawId: unknown, rawQty: unknown, rawNpc?: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const npc = this.shopFor(id, d, rawNpc, "bán");
    if (typeof npc === "string") return warn(npc);
    const it = typeof rawId === "string" ? d.bag.find((i) => i.id === rawId) : undefined;
    if (!it) return warn("Không có vật phẩm này trong túi đồ.");
    if (it.vohonId !== null) return warn(`${this.itemLabel(it)} đang gắn trên võ hồn: tháo ra trước mới bán được.`);
    if (it.locked) return warn(`${this.itemLabel(it)} đang khoá: mở khoá ở túi đồ rồi mới bán được.`);
    if (d.absorbing?.itemId === it.id) return warn("Đang hấp thụ hồn hoàn này, không bán được.");
    if (claimHeld(d)) return warn(CLAIM_BUSY); // #165: phần thưởng boss đang chờ DB xác nhận lượt
    const price = sellPrice(it);
    if (price === null) return warn(`Thương nhân không mua ${itemDef(it.code)?.name ?? "vật phẩm lạ"}.`);
    const qty = rawQty === undefined || rawQty === null ? it.qty : Number.isInteger(rawQty) ? (rawQty as number) : 0;
    if (qty < 1 || qty > it.qty) return warn(`Số lượng bán phải từ 1 đến ${it.qty}.`);
    const label = this.itemLabel({ ...it, qty }), gain = price * qty;
    // Thương nhân giữ bản sao đúng món vừa bán (chỉ số, cấp cường hóa, số lượng) để mua lại (9.8); mới nhất trước, tối đa BUYBACK_MAX.
    const entry: Buyback = { key: randomUUID(), item: { ...it, qty, vohonId: null, stats: it.stats == null ? null : structuredClone(it.stats) }, price };
    editBuyback(d.accountId, (cur) => [entry, ...cur].slice(0, BUYBACK_MAX)).then(() => this.sendBag(id), (err) => console.error("Không lưu được món bán vào danh sách mua lại", err));
    this.takeItem(d, it, qty); d.lockIds.add(it.id);
    this.addCoin(d, gain);
    this.log(id, `Bán ${label}: +${formatHonTe(gain)} (còn ${formatHonTe(d.honTe)}).`, "#f2c84b");
    this.sendBag(id);
    this.saveTrade(id, d);
  }

  /**
   * Mua lại đồ vừa bán nhầm (bước 9.8): món `rawKey` trong danh sách mua lại của chính tài khoản (buybacks), phải đứng gần thương
   * nhân, đủ Hồn Tệ cho đúng giá đã bán và túi đủ chỗ (đồ không gộp cần một ô trống). Món về túi đúng như lúc bán (chỉ số, cấp
   * cường hóa) với id mới; ghi DB qua chuỗi lưu như mua / bán. Tự bán đang bật mà bộ lọc sẽ bán món này thì món về túi ở trạng thái
   * khoá (#216), để nhịp sau không tự bán lại ngay khi túi vẫn dưới AUTO_SELL_FREE ô trống.
   */
  async buybackItem(id: string, rawKey: unknown, rawNpc?: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const npc = this.shopFor(id, d, rawNpc, "mua lại");
    if (typeof npc === "string") return warn(npc);
    // Đồ bán tay (RAM, BUYBACK_MAX món) hoặc đồ tự bán (#216, lưu DB, AUTO_SELL_BUYBACK món): cùng một nút mua lại, cùng giá đã nhận.
    const list = buybacks.get(d.accountId) ?? [], key = typeof rawKey === "string" ? rawKey : undefined;
    const e = key === undefined ? undefined : list.find((x) => x.key === key) ?? d.sold.find((x) => x.key === key);
    if (!e) return warn(`Thương nhân không còn giữ món này (chỉ giữ ${BUYBACK_MAX} món bán gần nhất, mất khi rời game; ${AUTO_SELL_BUYBACK} món tự bán gần nhất).`);
    const def = itemDef(e.item.code), label = this.itemLabel(e.item), cost = e.price * e.item.qty;
    if (!def) return warn("Vật phẩm không tồn tại.");
    if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: mua lại ${label} giá ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
    const lock = d.sellCfg.on && autoSellable({ ...e.item, locked: false, vohon: null }, d.sellCfg);
    if (def.stack > 1 ? this.bagRoom(d, def.id, lock) < e.item.qty : bagUsed(d.bag) >= d.bagSlots)
      return warn(`Túi đồ không đủ chỗ để mua lại ${label} (${d.bagSlots} ô): bỏ hoặc bán bớt đồ trước.`);
    if (list.includes(e)) {
      // Đồ bán tay: lấy khỏi danh sách ở presence trước khi trao (hai tiến trình / hai lần bấm không cùng nhận một món); sau await kiểm lại.
      const claimed = await claimBuyback(d.accountId, e.key).catch((err) => { console.error("Không lấy được món mua lại trong presence", err); return null; });
      if (!claimed) return warn(`Thương nhân không còn giữ món này (chỉ giữ ${BUYBACK_MAX} món bán gần nhất, mất khi rời game; ${AUTO_SELL_BUYBACK} món tự bán gần nhất).`);
      const room = def.stack > 1 ? this.bagRoom(d, def.id, lock) >= e.item.qty : bagUsed(d.bag) < d.bagSlots;
      if (this.pdata.get(id) !== d || d.travelling || d.honTe < cost || !room) {
        await editBuyback(d.accountId, (cur) => [claimed, ...cur.filter((x) => x.key !== claimed.key)].slice(0, BUYBACK_MAX)).catch((err) => console.error("Không trả món mua lại về presence", err));
        return warn("Không mua lại được lúc này, thử lại.");
      }
    }
    d.sold = d.sold.filter((x) => x !== e);
    d.honTe -= cost; d.bagDirty = true;
    if (def.stack > 1) this.addItem(d, def.id, e.item.qty, lock);
    else {
      const it = newItem(def, 1, e.item.years);
      it.stars = e.item.stars; it.enhance = e.item.enhance; it.stats = e.item.stats == null ? null : structuredClone(e.item.stats);
      if (lock) it.locked = true;
      d.bag.push(it);
    }
    this.log(id, `Mua lại ${label}: −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)})${lock ? ", đã khoá để không bị tự bán lại" : ""}.`, def.col);
    this.sendBag(id);
    this.saveTrade(id, d);
  }

  /** Xóa danh sách mua lại của tài khoản khi rời game (9.8). ArenaRoom không xóa: rời sân là về bản đồ cũ. */
  forgetBuyback(accountId: number) { buybacks.delete(accountId); void presenceBackend.delete(buybackKey(accountId)).catch((e) => console.error(`Không xóa được danh sách mua lại của #${accountId}`, e)); }

  // ---------- Tự bán từ xa (#216, mục 5.7 "Tự bán") ----------
  /** Khoá / mở khoá một ô trong túi của chính người gửi: món khoá không bị bán (tay hay tự bán), bỏ, hay làm nguyên liệu. */
  lockItem(id: string, raw: unknown) {
    const d = this.pdata.get(id); if (!d || d.travelling) return; // #165: như mọi thao tác túi đồ, không đổi sau khi đã chụp túi để đi cổng
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw) : undefined;
    if (!it) return this.log(id, "Không có vật phẩm này trong túi đồ.", "#ffb35c");
    it.locked = !it.locked; d.bagDirty = true; d.lockIds.add(it.id);
    this.log(id, `${it.locked ? "Đã khoá" : "Đã mở khoá"} ${this.itemLabel(it)}${it.locked ? ": không bán, bỏ hay làm nguyên liệu được" : ""}.`);
    this.sendBag(id);
    this.saveTrade(id, d);
  }

  /** Bộ lọc tự bán (bảng Túi đồ): server kẹp bằng parseSell, lưu cùng túi đồ qua chuỗi lưu; bật thì xét tự bán ngay ở nhịp tới. */
  setAutoSell(id: string, raw: unknown) {
    const d = this.pdata.get(id); if (!d || d.travelling) return;
    const was = d.sellCfg.on;
    d.sellCfg = parseSell(raw); d.bagDirty = true;
    if (was !== d.sellCfg.on) this.log(id, d.sellCfg.on
      ? `Bật tự bán: túi còn dưới ${AUTO_SELL_FREE} ô trống thì bán từ xa đồ hợp bộ lọc, đúng giá thương nhân trong thành.` : "Tắt tự bán.", "#86e0b0");
    this.sendBag(id);
    this.saveTrade(id, d);
  }

  /**
   * Tự bán từ xa (#216): bật tự bán và túi còn dưới AUTO_SELL_FREE ô trống thì bán mọi món hợp bộ lọc
   * (autoSellable) với đúng giá thương nhân trong thành (sellPrice, 100%), không cần đứng gần thương nhân. Không bán khi đang đi cổng /
   * truyền tống, đang hấp thụ, đang chờ DB xử lý vật phẩm, trong sân đấu. Món đã bán vào danh sách mua lại AUTO_SELL_BUYBACK món (lưu DB
   * cùng túi). Trả về số ô đã giải phóng.
   */
  autoSell(id: string) {
    const d = this.pdata.get(id); if (!d || !d.sellCfg.on || d.travelling || d.travelCast || d.absorbing || claimHeld(d) || d.shardBusy) return 0;
    if (this.map.kind === "arena" || d.bagSlots - bagUsed(d.bag) >= AUTO_SELL_FREE) return 0;
    const sold: SoldRow[] = [];
    let coins = 0, n = 0;
    for (const it of d.bag) {
      if (!autoSellable({ ...it, vohon: it.vohonId }, d.sellCfg)) continue;
      const price = sellPrice(it)!;
      sold.push({ key: randomUUID(), item: { ...it, vohonId: null, locked: false, stats: it.stats == null ? null : structuredClone(it.stats) }, price, at: Date.now() });
      coins += price * it.qty; n += it.qty;
    }
    if (!sold.length) return 0;
    const gone = new Set(sold.map((r) => r.item.id));
    d.bag = d.bag.filter((i) => !gone.has(i.id));
    d.sold = [...sold.reverse(), ...d.sold].slice(0, AUTO_SELL_BUYBACK);
    this.addCoin(d, coins);
    d.soldN += n; d.soldCoins += coins;
    console.log(`[tự bán] tài khoản #${d.accountId} ở ${this.state.mapId}: ${n} món (${gone.size} ô), +${coins} đồng`);
    const text = `Đã tự bán ${n.toLocaleString("vi-VN")} món, +${formatHonTe(coins)}`;
    this.log(id, `${text} (còn ${formatHonTe(d.honTe)}). Mua lại ${AUTO_SELL_BUYBACK} món gần nhất ở thương nhân.`, "#f2c84b");
    this.clients.getById(id)?.send("autosold", { n, coins, slots: gone.size });
    this.sendBag(id);
    this.saveTrade(id, d);
    return gone.size;
  }

  /**
   * Mở rộng túi ở thương nhân (bước 9.8): +BAG_EXPAND ô, tối đa BAG_MAX_SLOTS, giá theo lần mở (bagExpandCost). Phải đứng gần thương
   * nhân trong thành (shopExpands: thương nhân lưu động ở trại cổng không mở rộng túi) và đủ Hồn Tệ. Số ô lưu cùng túi đồ (`accounts.bag_slots`) qua chuỗi lưu.
   */
  expandBag(id: string, rawNpc?: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const npc = this.shopFor(id, d, rawNpc, "mở rộng túi");
    if (typeof npc === "string") return warn(npc);
    if (!shopExpands(npc.id)) return warn(`${npcDef(npc.id)?.name ?? "Thương nhân"} không mở rộng túi: về thương nhân trong thành.`);
    const cost = bagExpandCost(d.bagSlots);
    if (cost === null) return warn(`Túi đồ đã mở rộng tối đa (${BAG_MAX_SLOTS} ô).`);
    if (d.honTe < cost) return warn(`Không đủ Hồn Tệ: mở rộng túi giá ${formatHonTe(cost)}, đang có ${formatHonTe(d.honTe)}.`);
    const from = d.bagSlots;
    d.bagSlots = Math.min(BAG_MAX_SLOTS, d.bagSlots + BAG_EXPAND);
    d.honTe -= cost; d.bagDirty = true;
    this.log(id, `Mở rộng túi đồ: ${from} → ${d.bagSlots} ô, −${formatHonTe(cost)} (còn ${formatHonTe(d.honTe)}).`, "#f2c84b");
    this.sendBag(id);
    this.saveTrade(id, d);
  }

  log(id: string, text: string, col?: string) { this.clients.getById(id)?.send("log", { text, col }); }

  /**
   * Hook kiểm thử cho bot (client/scripts/bot-test.mjs), chỉ chạy khi server bật biến môi trường GAME_TEST=1; mặc định chỉ trả
   * lời "không bật". Đi qua đúng các hàm luật chơi: `down` (võ hồn ra trận gục), `kill {tier}` (nhận kinh nghiệm như hạ hồn thú),
   * `rest {s}` (nghỉ ngoài trận s giây; hiệu ứng có lợi cũng trôi s giây), `set {rowId, level, xp, rings, stars}` (đặt tiến độ một võ hồn của mình; `stars` từ 9.5; có lưu DB),
   * `energy {v}` (đặt năng lượng tiên cơ mọi võ hồn chưa gục trong đội, tính như vừa giao chiến), `spawn {tier, dx, dy}` (sinh hồn thú cạnh mình),
   * `hurt {pct}` (võ hồn ra trận mất pct% sinh lực hiện có, bỏ qua khiên), `clear` (bỏ mọi hồn thú trong vòng 160 pixel quanh mình),
   * `beast {dx, dy}` (đặt một hồn thú thường 1 máu, đứng yên, lệch (dx, dy) so với mình; chỉ bản đồ có vùng săn),
   * `give {code, qty, years}` (thêm vật phẩm vào túi, gộp và giới hạn ô như nhặt đồ; hồn hoàn mang `years` năm), `coin {n}` (đặt
   * Hồn Tệ), `drain {pct}` (mất pct% hồn lực hiện có), `goto {x, y}` (đứng ở điểm đứng được), `drops {s}` (mọi hồn hoàn dưới đất
   * già thêm s giây). `rest` cũng trừ hồi chiêu đan. Từ 3.2 `beast`, `spawn`, `kill` nhận thêm `years` (tuổi hồn thú; thiếu thì
   * lấy mốc năm của bậc).
   * Từ 2.5a: `status {s, n, secs, all}` (gây trạng thái lên hồn thú gần nhất trong 160 pixel, `all`: mọi hồn thú trong 160 pixel,
   * bằng applyStatus với sức mạnh 1), `boom` (Viêm bạo lên hồn thú gần nhất), `bhp {pct}` (hồn thú gần nhất còn pct% sinh lực,
   * coi như vừa bị đánh), `regen {s}` (hồn thú gần nhất hồi máu s giây bằng regenBeast; trả `gain`), `ready {mp}` (hết hồi chiêu
   * hồn kỹ, hồn lực còn mp%), `pregen {s, hp, mp, hit}` (#112: người gọi còn hp% sinh lực, mp% hồn lực, vừa bị đánh nếu `hit`, rồi
   * hồi s giây bằng regenPlayer; trả phần hồi và `safe`), `grant {vohon}` (thêm võ hồn bất kỳ, kể cả UR, vào tài khoản; có lưu DB). `down` / `hurt` bỏ qua cả
   * miễn sát thương.
   * Từ BĐ3: `legacy {mapId, x, y}` ghi `map_id` cũ đã bỏ khỏi MAPS (mã trong MAP_MOVED, ví dụ `tinh_dau`) và vị trí (x, y) như tài
   * khoản của bản trước, qua đúng transaction đi cổng (freeze, saveTravel; trả `saved`); client rời phòng rồi hỏi lại /api/me.
   * Từ 2.5c: `lei {v}` (đặt Phong Lôi Chi Lực, tính như vừa giao chiến; đủ max thì chỉ tung khi đánh trúng lần tới).
   * Từ 3.4: `shard {r, i}` cố định số ngẫu nhiên rơi mảnh võ hồn (r: 0..100, rơi khi r/100 < shardChance; −1 bỏ) và võ hồn
   * được chọn (chỉ số i trong MAPS[bản đồ].shards, −1 ngẫu nhiên); `give` nhận cả mã mảnh (shardCode).
   * Từ 3.5: `spawn` nhận `species` (mã loài); `tele {i}` hồn thú gần nhất báo trước chiêu thứ i nhắm người gọi ngay (trả `bid`, `name`);
   * `pst {s, n, secs}` gây trạng thái lên chính người gọi (PLAYER_STATUS). Hồn thú của `beast` không có chiêu báo trước.
   * Từ BĐ4: `elite` trả mọi ô tinh anh của phòng (vị trí, vùng, chỉ số, người tham gia, Cuồng nộ, giây chờ hồi sinh; từ #119 `dmgBy` / `supBy`); `etick {s}` chạy
   * luật tinh anh như đã trôi `s` giây (loại người ở ngoài bán kính, giảm số người, bỏ giao chiến, Cuồng nộ hết giờ); `erespawn {s}`
   * rút thời gian chờ hồi sinh của mọi tinh anh đã bị hạ xuống còn `s` giây; từ #119 `elock {s}` xem / đặt lại khóa nhận thưởng tinh anh
   * nhiều kênh của chính mình (ELITE.lock); `clear {keep}` giữ lại tinh anh; `beast` nhận `boss`
   * (mã trong BOSSES): tinh anh 1 máu, không thuộc ô tinh anh nào (không hồi sinh), để thử thưởng khi hạ (hồn cốt x ELITE.bone).
   * Từ 4.1: `bone {r, s}` cố định số ngẫu nhiên rơi hồn cốt (r: 0..100, rơi khi r/100 < boneChance; −1 bỏ) và vị trí (chỉ số s
   * trong BONE_SLOTS, −1 ngẫu nhiên); `beast` nhận `species` (mã loài trong BEASTS); `give` hồn cốt (BONE_ITEM) nhận `years`,
   * `beast`, `slot` (mã vị trí).
   * Từ 5.1: `core {r, stars, set}` cố định số ngẫu nhiên rơi hồn hạch (r: 0..100, rơi khi r/100 < coreChance, tinh anh luôn rơi; −1
   * bỏ), sao (0 = ngẫu nhiên trong khoảng theo niên hạn; ngoài khoảng cũng là ngẫu nhiên) và bộ (chỉ số trong CORE_SETS, −1 theo bản
   * đồ); `give` hồn hạch (CORE_ITEM) nhận `stars`, `set` (mã bộ) và tung chỉ số như khi rơi.
   * Từ 4.2: `stats {rowId}` trả chỉ số một võ hồn của mình (`base` không hồn cốt, `stats` có hồn cốt, `bones` phần cộng thêm,
   * `live` chỉ số đang dùng nếu là võ hồn ra trận).
   * Nhiều kênh: `chan {reset, nolock}` trả `chMax` (người tối đa mỗi kênh: CHANNEL_MAX, hoặc biến môi trường CHANNEL_MAX khi
   * GAME_TEST=1), `channel`, `roomId`; `reset` bỏ thời gian chờ đổi kênh; `nolock` lần rời phòng kế tiếp không khóa kênh.
   * Từ #116: hồn thú do `spawn` / `beast` sinh có thủ chuẩn (BEAST_DEF.ref) trừ khi có `realDef`; `bst` trả thêm `def`; `bdmg {v}` gây đúng `v`
   * sát thương đòn trực tiếp (không chí mạng) lên hồn thú gần nhất / `bid`, trả `dealt`.
   * Từ #161: `ground {ttl}` trả các vùng lưu lại của phòng (`grounds`) và trạng thái trên người gọi (`st`: số tầng, giây còn lại); `ttl`
   * đặt mọi vùng còn đúng ngần ấy giây.
   * Từ #218: `bmax {bid, x}` nhân máu tối đa hồn thú (cả máu gốc tinh anh / boss) và hồi đầy; `elock {key, s}` đặt khóa thưởng tinh anh `key`
   * cho chính mình; `auto {kn, wn}` đặt số lượt nhận thưởng thú vương / boss thế giới hôm nay trong bộ nhớ, trả thêm trạng thái trận boss
   * của tự săn; `perf {reset}` thời gian tick / bản vá (server PERF_LOG=1).
   * Từ #677: `baglimit {on}` bật / tắt giới hạn tin ghi túi cho chính mình; khi GAME_TEST=1 mặc định TẮT (bot dọn túi hàng trăm ô một lúc), chỉ bài dồn sortbag bật.
   * Từ #164: `throw` ném lỗi ngay trong handler (không trả lời): thử lớp chặn chung onUncaughtException giữ server sống.
   * Từ #270: `crash {reject}` trả lời rồi ném lỗi NGOÀI phòng (hẹn giờ thường của Node, không qua clock của phòng; `reject`: promise bị từ
   * chối không ai bắt): thử process.on ở index.ts lưu người chơi đang online rồi thoát mã 1. Chỉ bài `bot:local --fatal` gọi.
   */
  async testHook(c: Client, m: unknown) {
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, op = strIn(o.op);
    if (process.env.GAME_TEST !== "1") return c.send("test", { op, enabled: false });
    if (op === "throw") throw new Error("hook test: lỗi cố ý (#164)");
    if (op === "baglimit") { const d = this.pdata.get(c.sessionId); if (d) d.msgLimit = !!o.on; return c.send("test", { op, on: !!o.on }); } // #677: bật giới hạn tin theo nhóm (mặc định tắt khi GAME_TEST=1)
    if (op === "crash") {
      const reject = !!o.reject;
      c.send("test", { op, reject });
      // CỐ Ý setTimeout toàn cục, KHÔNG đổi sang this.clock (#700): lỗi phải ném ngoài phòng để thử process.on ở index.ts.
      setTimeout(() => {
        if (reject) void Promise.reject(new Error("hook test: promise bị từ chối không ai bắt (#270)"));
        else throw new Error("hook test: lỗi cố ý ngoài phòng (#270)");
      }, 100);
      return;
    }
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const int = (x: unknown, lo: number, hi: number, def: number) => (Number.isInteger(x) ? Math.max(lo, Math.min(hi, x as number)) : def);
    if ((op === "down" || op === "hurt") && d.buffs.delete("inv")) this.syncBuffs(p, d);
    // Hồn thú các hook nhắm: đúng `bid` nếu có (BĐ6e: tinh anh có tùy tùng / hồn thú khác đứng gần hơn), không thì gần nhất trong 160 pixel.
    const nearB = () => {
      const bid = typeof o.bid === "string" && this.state.beasts.has(o.bid) ? o.bid : this.nearestBeast(p, 160);
      return bid ? { bid, b: this.state.beasts.get(bid)!, bd: this.bdata.get(bid)! } : null;
    };
    /** Trạng thái trên người gọi (số tầng, giây còn lại) cho hook `ground` / `cold`. */
    const pst = () => Object.fromEntries([...d.st].map(([s, x]) => [s, { n: x.n, t: x.t }]));
    let out: Record<string, unknown> = {};
    const yearsOf = (tier: number) => int(o.years, TIERS[0].years, MAX_YEARS, TIERS[tier].years);
    if (op === "down" && !p.dead) { d.inv = 0; d.shield = 0; this.hurtPlayer(id, d.hpF / VOHON[p.vh].def + 1); }
    else if (op === "hurt" && !p.dead) { d.inv = 0; d.shield = 0; this.hurtPlayer(id, Math.floor(d.hpF * int(o.pct, 0, 99, 0) / 100) / VOHON[p.vh].def); }
    else if (op === "kill") this.rewardKill(id, yearsOf(int(o.tier, 0, TIERS.length - 1, 0)));
    else if (op === "beast" && this.map.zones.length) {
      // Hồn thú thường 1 máu đứng yên tại (x+dx, y+dy) so với người gọi, để bot thử đạn hồn kỹ trúng đích đúng lúc và nhặt hồn hoàn.
      const sp = typeof o.species === "string" ? Math.max(0, beastIndex(o.species)) : 0; // từ 4.1: loài theo mã (hồn cốt mang tên loài)
      const boss = typeof o.boss === "string" ? bossIndex(o.boss) : -1; // từ BĐ4: tinh anh theo mã BOSSES (không thuộc ô tinh anh nào)
      const bid = this.addBeast(0, yearsOf(0), boss >= 0 ? boss : sp, p.x + int(o.dx, -200, 200, 0), p.y + int(o.dy, -200, 200, 0), boss >= 0 ? 1 : 0);
      // Không tung chiêu báo trước; `skills` (#173): giữ chiêu (chỉ tung khi bot gọi `tele`, Song Sắc Mãng đổi dạng).
      this.state.beasts.get(bid)!.hp = 1; this.bdata.get(bid)!.wt = 1e9; if (o.skills) this.bdata.get(bid)!.skT = 1e9; else this.bdata.get(bid)!.skills = [];
      if (!o.realDef) this.bdata.get(bid)!.def = BEAST_DEF.ref; // #116: thủ chuẩn như `spawn`
      // #192 `hpx`: tinh anh đầy máu, máu gốc × hpx (eliteScale tính lại theo máu gốc) để bot đọc đóng góp sau một chiêu mạnh.
      const e = this.bdata.get(bid)!.elite, hb = this.state.beasts.get(bid)!, hpx = int(o.hpx, 1, 1000, 1);
      if (e && hpx > 1) { e.base *= hpx; hb.maxHp = hb.hp = Math.round(e.base * bossHpMult(e.n)); }
      out = { bid }; // bot nhận ra đúng con này (hồn thú hoang có thể sinh cùng lúc)
    }
    else if (op === "chan") {
      // Nhiều kênh (mục 6): `reset` xóa thời gian chờ đổi kênh (CHANNEL_CD) của tài khoản; `nolock`: lần rời phòng kế tiếp không khóa
      // vào lại kênh này (leftRoom); trả số người tối đa mỗi kênh, số kênh, phòng.
      if (o.reset) { channelSwitchAt.delete(d.accountId); leftRoom.delete(d.accountId); bg(presenceBackend.delete(channelSwitchKey(d.accountId)), "presence"); bg(presenceBackend.delete(channelLeftKey(d.accountId)), "presence"); }
      if (o.nolock) testNoLeaveLock.add(d.accountId);
      out = { chMax: CHANNEL_CAP, channel: this.state.channel, roomId: this.roomId };
    }
    else if (op === "slay") {
      // 7.1: hạ hồn thú gần nhất như do người gọi ra đòn cuối (qua killBeast: kinh nghiệm chia tổ đội, đồ rơi, Hồn Tệ). Từ BĐ6d `bid`:
      // hạ đúng hồn thú đó (dù ở xa).
      const sb = typeof o.bid === "string" ? this.state.beasts.get(o.bid) : undefined;
      const x = sb ? { bid: o.bid as string, b: sb } : nearB(); if (x) { this.killBeast(x.bid, id); out = { bid: x.bid, x: x.b.x, y: x.b.y, years: x.b.years }; }
    }
    else if (op === "chat") { if (o.cop === "rlreset") { chatReset(d.accountId); bg(presenceBackend.delete(worldChatKey(d.accountId)), "presence"); } } // #188: xóa bộ đếm chat mọi kênh + hồi kênh thế giới của người gọi
    else if (op === "rally") { if (o.rop === "rlreset") rallyReset(d.accountId); } // R6 #433: xóa bộ đếm đặt dấu tập trung của người gọi
    else if (op === "friend") { if (o.fop === "rlreset") friendReset(d.accountId); } // #195: xóa bộ đếm thao tác bạn bè của người gọi
    else if (op === "party") {
      // 7.1: `rlreset` xóa bộ đếm lời mời của người gọi; `age {name, s}` đẩy lùi lúc rời game của `name` s giây rồi dọn (party.sweep);
      // mọi `pop` trả khung tổ đội của người gọi.
      const pop = String(o.pop ?? "");
      if (pop === "rlreset") inviteReset(d.accountId);
      else if (pop === "age") {
        const aged = await party._ageOffline(String(o.name ?? ""), int(o.s, 0, 86400, 0));
        this.partyPublish(await party.sweep(Date.now()));
        out = { aged };
      }
      out = { ...out, view: party.partyView(d.accountId, this.roomId, Date.now()).view };
    }
    else if (op === "view") {
      // 11.4: `all` tắt (true) / bật lại (false) lọc đồng bộ theo vùng cho người gọi; trả số thực thể đang thấy và cả phòng, số hồn thú
      // đang thức; `bid`: vị trí hồn thú đó, có trong view người gọi không, đang thức / đang đi không.
      if (typeof o.all === "boolean") this.interest.setAll(id, o.all);
      let awake = 0, ranked = 0; this.state.beasts.forEach((b) => { if (this.interest.awake(b.x, b.y)) awake++; if (b.rank) ranked++; });
      const vb = typeof o.bid === "string" ? this.state.beasts.get(o.bid) : undefined;
      out = { ...this.interest.stats(id), total: { players: this.state.players.size, beasts: this.state.beasts.size, drops: this.state.drops.size, ranked }, awake,
        ...(vb ? { beast: { x: vb.x, y: vb.y, seen: this.interest.sees(id, "b", o.bid as string), awake: this.interest.awake(vb.x, vb.y), moving: vb.moving } } : {}) };
    }
    else if (op === "goto") {
      const x = Number(o.x), y = Number(o.y);
      // Dừng luôn hướng đi đang giữ; tăng `seq` để client đang dự đoán chuyển động biết input cuối của nó đã bị bỏ và gửi lại (mục 6).
      if (this.map.standable(x, y)) { p.x = x; p.y = y; d.input = { x: 0, y: 0 }; p.seq = (p.seq + 1) >>> 0; p.seqT = 0; }
    }
    else if (op === "drops") {
      const s = int(o.s, 0, 3600, 0);
      this.state.drops.forEach((dr) => { dr.ownerTtl = Math.max(0, dr.ownerTtl - s); dr.ttl = Math.max(0.01, dr.ttl - s); });
    }
    else if (op === "rest") {
      const s = int(o.s, 0, 3600, 0); d.fight = Math.max(d.fight + s, TEAM_COMBAT_SECS);
      this.tickDowns(id, s); this.tickEnergy(id, s); this.sendSquad(id);
      for (const [b, x] of d.buffs) { x.t -= s; if (x.t <= 0) d.buffs.delete(b); } // hiệu ứng có lợi cũng hết giờ
      if (d.lastSkill) d.lastSkill.t -= s * 1000; // hồn kỹ gần nhất cũng cũ đi (cửa sổ Phục Chế COPY_WINDOW, 9.3)
      this.syncBuffs(p, d);
      this.tickAva(id, s); // Võ Hồn Chân Thân và hồi chiêu của nó (8.1a)
      this.tickFusion(id, s); // lời mời dung hợp kỹ đang chờ (#192); hồi chiêu theo tài khoản cũng trôi `s` giây
      const fu = fusionReady.get(d.accountId); if (fu !== undefined) fusionReady.set(d.accountId, fu - s * 1000);
      d.danCd = Math.max(0, d.danCd - s); this.sendBag(id);
    }
    else if (op === "give") {
      const code = String(o.code ?? ""), qty = int(o.qty, 1, 1e6, 1); // đủ lấp túi BAG_MAX_SLOTS ô đồ gộp (#215)
      let got = 0;
      if (code === RING_ITEM) while (got < qty && this.addRing(d, yearsOf(0))) got++;
      else if (code === BONE_ITEM) {
        const beast = beastIndex(String(o.beast ?? "")) >= 0 ? String(o.beast) : BEASTS[0].id;
        const slot = BONE_SLOTS.some((s) => s.id === o.slot) ? String(o.slot) : BONE_SLOTS[0].id;
        // 8.2: `enhance` cho sẵn cấp cường hóa (và đúng số điểm của cấp đó) để thử cộng minh mà không phải cường hóa từng món.
        const e = int(o.enhance, 0, BONE_MAX_ENHANCE, 0);
        for (let it; got < qty && (it = this.addBone(d, yearsOf(0), beast, slot)); got++)
          if (e) { it.enhance = e; it.stats = { ...(it.stats as object), xp: boneEnhanceNeed(e) }; }
      }
      else if (code === CORE_ITEM) {
        const stars = int(o.stars, 1, MAX_CORE_STARS, 1), si = coreSetIndex(o.set), e = int(o.enhance, 0, CORE_MAX_ENHANCE, 0); // 8.2: như hồn cốt
        for (let it; got < qty && (it = this.addCore(d, stars, rollCoreStats(stars, MAPS[this.state.mapId]?.cores ?? [], Math.random, si >= 0 ? si : undefined))); got++)
          if (e) { it.enhance = e; it.stats = { ...(it.stats as object), xp: coreEnhanceNeed(e) }; }
      }
      else got = this.addItem(d, code, qty);
      if (got < qty) this.log(id, itemDef(code) ? `Túi đồ đã đầy (${d.bagSlots} ô): ${qty - got} món không nhận được.` : "Vật phẩm không tồn tại.", "#ffb35c");
      this.sendBag(id);
    }
    else if (op === "coin") { d.honTe = int(o.n, 0, 1e12, d.honTe); d.bagDirty = true; this.sendBag(id); }
    else if (op === "gmadmin") { _gmSetAdmin(d.accountId, o.on !== false); } // #518: bật / tắt quyền admin GM của người gọi (bot không biết trước mã tài khoản)
    else if (op === "shard") {
      const r = int(o.r, -1, 100, -1);
      d.testShard = r < 0 ? null : { r: Math.min(0.9999, r / 100), i: int(o.i, -1, 99, -1) };
    }
    else if (op === "red") {
      // BĐ6d: cố định số ngẫu nhiên ra hồn thú thường MAX_YEARS năm (r: 0..100, ra khi r/100 < RED_BEAST_CHANCE; −1 bỏ) cho cả phòng;
      // `zone` (tên vùng) thì gọi spawnBeast vùng đó `n` lần ngay (bỏ qua `count`). Trả số hồn thú thường MAX_YEARS năm của kênh.
      const r = int(o.r, -1, 100, -1); this.testRed = r < 0 ? null : r / 100;
      const zi = this.map.zones.findIndex((z) => z.name === o.zone), years: number[] = [];
      if (zi >= 0) for (let k = int(o.n, 0, 50, 1); k > 0; k--) {
        const before = new Set(this.state.beasts.keys()); this.spawnBeast(zi);
        for (const [bid, b] of this.state.beasts) if (!before.has(bid)) years.push(b.years);
      }
      out = { years, reds: [...this.state.beasts.values()].filter((b) => !b.rank && b.years >= MAX_YEARS).length,
        elites: [...this.state.beasts.values()].filter((b) => b.rank && b.years >= MAX_YEARS).length };
    }
    else if (op === "locfile") {
      // 11.5: các lần ghi vị trí sau (kể cả lần cuối khi rời phòng) ghi kèm file Tiled `file` thay cho file đang dùng, giả vị trí lưu
      // ở bản đồ phiên bản khác (`file` rỗng = NULL như dòng ghi trước 11.5); bỏ `file` thì ghi như thường.
      d.testLocFile = o.file === undefined ? undefined : String(o.file).slice(0, 64) || null;
    }
    else if (op === "herb") {
      // BĐ6b: cố định số ngẫu nhiên rơi tiên thảo (r: 0..100, rơi khi r/100 < herbChance; −1 bỏ) và loại (chỉ số i trong HERBS).
      const r = int(o.r, -1, 100, -1);
      d.testHerb = r < 0 ? null : { r: Math.min(0.9999, r / 100), i: int(o.i, -1, 99, -1) };
    }
    // E1: `gear {tpl, ilvl?, enhance?, roll?, luck?, affixes?}` tạo một món trang bị vào túi (mẫu trong EQUIP_TEMPLATES; `roll` −1..1 nhân EQUIP_ROLL,
    // thiếu thì 0; `luck` đặt thẳng, thiếu thì 0; `affixes` [[mã, mức]…] thiếu thì không có dòng phụ) và trả id; `gear {clear: true}` bỏ hết trang bị trong túi và đang mặc.
    // Không qua tung ngẫu nhiên nên bot so được chỉ số với equipStats.
    else if (op === "gear") {
      if (o.clear === true) { d.bag = d.bag.filter((i) => i.code !== EQUIP_ITEM); d.gear = []; d.gearSt = gearStats(d.gear); d.bagDirty = true; this.afterBones(id, d.ch); this.sendGear(id); out = { cleared: true }; }
      else {
        const tpl = typeof o.tpl === "string" ? equipTemplate(o.tpl) : undefined;
        if (!tpl) out = { error: "mẫu lạ" };
        else if (bagUsed(d.bag) >= d.bagSlots) out = { error: "túi đầy" };
        else {
          const def = itemDef(EQUIP_ITEM)!, it = newItem(def, 1), base = rollEquip(tpl, int(o.ilvl, 1, 99, 1), () => 0.5);
          it.enhance = int(o.enhance, 0, EQUIP_MAX_ENHANCE, 0);
          it.stats = { ...base, roll: Math.max(-1, Math.min(1, typeof o.roll === "number" && Number.isFinite(o.roll) ? o.roll : 0)) * EQUIP_ROLL, luck: equipSlotDef(tpl.slot).luck ? int(o.luck, 0, EQUIP_LUCK_MAX, 0) : 0,
            affixes: Array.isArray(o.affixes) ? (o.affixes as unknown[]).filter((x): x is [CoreStat, number] => Array.isArray(x) && CORE_STAT_IDS.includes(x[0]) && typeof x[1] === "number") : [] };
          d.bag.push(it); d.bagDirty = true; this.sendBag(id); out = { id: it.id };
        }
      }
    }
    // E2: `edrop {seed}` đặt RNG có hạt (mulberry32) cho MỌI lần tung rơi trang bị của người này (hạ hồn thú, mở rương, nhận offline); `{off: true}` trả về ngẫu nhiên.
    // Bot tung lại cùng hạt bằng rollEquipDrop của shared để so kết quả (hạt dùng tiếp theo thứ tự các lần gọi).
    else if (op === "edrop") {
      if (o.off === true) d.testEquip = null;
      else { let a = int(o.seed, 0, 2 ** 31, 1) >>> 0; d.testEquip = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    }
    else if (op === "bone") {
      const r = int(o.r, -1, 100, -1);
      d.testBone = r < 0 ? null : { r: Math.min(0.9999, r / 100), s: int(o.s, -1, BONE_SLOTS.length - 1, -1) };
    }
    else if (op === "core") {
      const r = int(o.r, -1, 100, -1);
      d.testCore = r < 0 ? null : { r: Math.min(0.9999, r / 100), stars: int(o.stars, 0, MAX_CORE_STARS, 0), set: int(o.set, -1, CORE_SETS.length - 1, -1) };
    }
    // #165: `claimhold {on}` bật / tắt cờ riêng như đang chờ DB ghi phần thưởng boss (MemoryStore ghi xong ngay nên bot không bắt được lúc
    // đó; không đụng bộ đếm claimBusy thật); trả có đang giữ không. `travellost` (#165): lần đi cổng kế tiếp commit xong rồi mới báo lỗi.
    else if (op === "claimhold") { d.testClaimHold = o.on === true; out = { busy: claimHeld(d) }; }
    else if (op === "travellost") { d.testTravelLost = true; }
    // E3: `enhroll {r}` ép số tung cường hóa trang bị (0..100 → 0..1; r < 0 bỏ ép): r nhỏ hơn tỉ lệ nấc thì thành công. `enhslow {ms}` chờ trong chuỗi lưu để bot dồn lệnh.
    else if (op === "enhroll") { const r = int(o.r, -1, 100, -1); d.testEnh = r < 0 ? null : Math.min(0.9999, r / 100); }
    else if (op === "synroll") { const r = int(o.r, -1, 100, -1); d.testSyn = r < 0 ? null : Math.min(0.9999, r / 100); } // E4: ép số tung hợp thành / phân giải (r nhỏ hơn tỉ lệ thì thành công / ra đủ)
    // #559: `itemlock {id, on}` giữ / nhả khóa Redis `lock:item:<id>` như một tiến trình khác đang xử lý món đó (chỉ có tác dụng khi presence là Redis); trả `redis` và `held`.
    else if (op === "itemlock") {
      const item = strIn(o.id), key = itemLockKey(item), ghost = `test-ghost:${item}`;
      if (presenceBackend.mode === "redis" && item) {
        if (o.on === true) out = { redis: true, held: (await presenceBackend.acquireFenced(key, ghost, 20_000)) > 0 };
        else { await presenceBackend.releaseLease(key, ghost); out = { redis: true, held: false }; }
      } else out = { redis: false, held: false };
    }
    else if (op === "enhslow") { d.testEnhSlow = int(o.ms, 0, 5000, 0); }
    else if (op === "roll") { const r = int(o.r, -1, 100, -1); d.testRoll = r < 0 ? null : Math.min(0.9999, r / 100); }
    else if (op === "rush") { if (d.absorbing) this.finishAbsorb(id); }
    else if (op === "drain") { d.mpF = Math.floor(d.mpF * (100 - int(o.pct, 0, 100, 0)) / 100); p.mp = Math.floor(d.mpF); }
    else if (op === "lei") { d.lei = int(o.v, 0, PHONG_LOI.max, 0); p.lei = d.lei; d.fight = 0; }
    else if (op === "bond") out = Object.fromEntries(BOND_KEYS.map((k) => [k, this.bondV(d, k)])); // tổng mỗi loại ràng buộc của đội hiện tại (2.5d, 9.4)
    else if (op === "energy") { const v = int(o.v, 0, TIEN_CO_MAX, 0); d.fight = 0; for (const r of d.team) if (r && !d.down.has(r)) d.energy.set(r, v); }
    else if (op === "spawn") {
      const years = yearsOf(int(o.tier, 0, TIERS.length - 1, 0));
      const x = Math.max(8, Math.min(this.map.MW * TILE - 8, p.x + int(o.dx, -200, 200, 20)));
      const y = Math.max(8, Math.min(this.map.MH * TILE - 8, p.y + int(o.dy, -200, 200, 0)));
      // Vùng chứa điểm sinh theo cả hai trục (Cực Bắc BĐ6c chia vùng theo hàng); không có thì vùng đầu tiên cùng cột như trước.
      const inZ = this.map.zones.findIndex((z) => x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1);
      const zi = Math.max(0, inZ >= 0 ? inZ : this.map.zones.findIndex((z) => x >= z.x0 && x < z.x1)), sp = beastIndex(String(o.species ?? ""));
      const bid = this.addBeast(zi, years, sp >= 0 ? sp : this.map.zones[zi]?.beasts[0]?.species ?? 0, x, y);
      // `hpx` (8.1a): nhân sinh lực hồn thú vừa sinh để bot đếm đủ các nhát của tuyệt kỹ nhiều nhát (không ảnh hưởng luật chơi thật).
      const hb = this.state.beasts.get(bid), hpx = int(o.hpx, 1, 1000, 1); if (hb && hpx > 1) hb.hp = hb.maxHp = hb.maxHp * hpx;
      // #116: hồn thú thử mặc định có thủ chuẩn (BEAST_DEF.ref) để các bài so sát thương đúng công thức không phụ thuộc loài / niên hạn;
      // `realDef` giữ thủ thật theo loài và số năm.
      if (!o.realDef) this.bdata.get(bid)!.def = BEAST_DEF.ref;
      out = { bid }; // bot nhận ra con vừa sinh theo id (hồn thú bậc cao lao về phía người gọi trước bản vá state kế tiếp)
    }
    else if (op === "tele") {
      // Hồn thú gần nhất báo trước chiêu thứ `i` nhắm người gọi ngay lúc này (bỏ qua tầm, hồi chiêu và thời gian chờ). `cancel`: bỏ chiêu
      // nó đang tự báo trước để tung chiêu này.
      const x = nearB(), s = x?.bd.skills[int(o.i, 0, 9, 0)];
      if (x && s && o.cancel) this.cancelCast(x.bid, x.b, x.bd);
      if (x && s && !x.bd.cast) { x.bd.target = id; x.b.aggro = true; this.beginCast(x.bid, x.b, x.bd, s, id, p); out = { bid: x.bid, name: s.def.name }; }
    }
    else if (op === "ground") {
      // #161: các vùng lưu lại của phòng (id, kiểu, hồn thú gây ra, tâm, bán kính, giây còn lại) và trạng thái trên người gọi (số tầng,
      // giây còn lại) để bot đếm Trúng độc theo nhịp. `ttl {s}`: mọi vùng còn đúng s giây (bot không phụ thuộc thời gian thật của vùng).
      if (typeof o.ttl === "number" && o.ttl >= 0) this.grounds.setTtl(Math.min(60, o.ttl));
      out = { grounds: this.grounds.info(), st: pst() };
    }
    else if (op === "cold") {
      // #163: Hỏa Đàn, Cực Hàn đang chạy không, số giây đã tích của người gọi và tầng Hàn / Đóng băng trên người gọi; `acc {s}` đặt số
      // giây đã tích (bot không phải chờ đủ nhịp thật).
      out = { ...this.cold.info(id, typeof o.acc === "number" && o.acc >= 0 ? Math.min(60, o.acc) : undefined), st: pst() };
    }
    else if (op === "tide") {
      // #174: Thủy Triều Dâng đang chạy không, giây tới đợt kế tiếp, id vùng / tâm vùng ngập của đợt gần nhất, mức Làm chậm của người gọi
      // (đã cộng mọi trạng thái, tối đa SLOW_CAP) và trạng thái trên người gọi. `next {s}`: 0 = dâng một đợt ngay, > 0 = đặt giây chờ.
      const t = this.tide.info(typeof o.next === "number" && o.next >= 0 ? Math.min(600, o.next) : undefined);
      out = { ...t, grounds: this.grounds.info(), slow: d ? this.pctl(d).slow : 0, st: pst() };
    }
    else if (op === "split") {
      // #173: hang chia phần đang chạy không, giây tới lần đổi kế tiếp, phần đang hóa, các phần của hang, vùng lưu lại và trạng thái trên
      // người gọi. `next {s}`: 0 = đổi phần ngay, > 0 = đặt giây chờ.
      const t = this.split.info(typeof o.next === "number" && o.next >= 0 ? Math.min(600, o.next) : undefined);
      out = { ...t, grounds: this.grounds.info(), slow: this.pctl(d).slow, st: pst() };
    }
    else if (op === "form") {
      // #173: dạng của hồn thú đổi dạng (`bid` hoặc gần nhất; BossDef.forms): chỉ số dạng, giây còn lại. `next {s}`: 0 = đổi ngay, > 0 = đặt giây.
      const x = nearB(), e = x?.bd.elite, fd = x && x.b.rank ? BOSSES[x.b.species]?.forms : undefined;
      if (x && e && fd) {
        if (o.next === 0) e.formT = 0; else if (typeof o.next === "number" && o.next > 0) e.formT = Math.min(600, o.next);
        if (o.next === 0) this.tickForm(x.bid, x.b, e, fd, 0);
        out = { bid: x.bid, form: e.form, t: e.formT, name: fd.forms[e.form]?.name, sync: x.b.form, warn: x.b.formWarn };
      }
    }
    else if (op === "pst") {
      // Trạng thái lên chính người gọi như do hồn thú gần nhất gây (sát thương đòn thường của nó cho Trúng độc / Thiêu đốt).
      const s = String(o.s ?? "") as StatusId, x = nearB();
      this.applyPStatus(id, { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) }, x?.bd.dmg ?? 10);
    }
    else if (op === "pvp") {
      // Cân bằng PvP (#277), đo không phụ thuộc ngẫu nhiên. `k`: `hit` gây `dmg` (tính như lên hồn thú) cho đối thủ đầu tiên qua damageFoe,
      // cộng `crit` vào tỉ lệ chí mạng (-1: không chí mạng trừ khi hiệu ứng bộ bù), trả sinh lực + khiên đối thủ mất; `st` gây trạng thái
      // lên đối thủ như hồn kỹ công 1 (`self`: lên chính mình như do hồn thú, không nguồn), trả trạng thái đó; `fx` đặt hiệu ứng bộ hồn
      // hạch đang dùng (tới lần tính lại chỉ số kế tiếp; mọi `k` kèm `fx` thì đặt trước khi làm); `heal` trả hệ số hồi máu / khiên.
      const fid = this.foesOf(id)[0], fd = fid ? this.pdata.get(fid) : undefined, k = o.k;
      const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0);
      if (o.fx && typeof o.fx === "object") {
        const fx: Record<string, number> = {};
        for (const [key, v] of Object.entries(o.fx)) if (typeof v === "number" && Number.isFinite(v)) fx[key] = Math.max(-10, Math.min(10, v));
        d.coreFx = fx as CoreFx; out = { ...d.coreFx };
      }
      if (k === "hit" && fid && fd) {
        // `full`: đối thủ đầy sinh lực trước đòn (Trúng độc / Thiêu đốt của bài thử không làm võ hồn ra trận gục giữa chừng).
        const f = this.state.players.get(fid); if (o.full && f) { fd.hpF = f.maxHp; f.hp = f.maxHp; }
        const before = fd.hpF + fd.shield;
        const hit = this.damageFoe(fid, num(o.dmg, 0, 1e6), id, "#fff", undefined, { crit: num(o.crit, -10, 10) });
        out = { hit, dealt: Math.round(before - (fd.hpF + fd.shield)), vh: p.vh, foeVh: this.state.players.get(fid)?.vh };
      } else if (k === "st") {
        const s = String(o.s ?? "") as StatusId, tid = o.self ? id : fid, td = tid ? this.pdata.get(tid) : undefined;
        const a: StatusApply = { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) };
        if (tid && td) this.applyPStatus(tid, a, o.self ? 10 : this.atkOf(d, true, "mid") * ARENA.dmgMult, o.self ? undefined : id);
        const x = td?.st.get(s); out = x ? { t: x.t, v: x.v, n: x.n, src: x.src === id } : { none: true };
      } else if (k === "heal") out = { mult: this.healMult(d) };
    }
    else if (op === "status") {
      const s = String(o.s ?? "") as StatusId, x = nearB();
      const a: StatusApply = { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) };
      if (x && (STATUS_IDS as readonly string[]).includes(s))
        for (const bid of o.all ? [...this.state.beasts.keys()].filter((k) => { const b = this.state.beasts.get(k)!; return Math.hypot(b.x - p.x, b.y - p.y) < 160; }) : [x.bid])
          this.applyStatus(bid, a, id);
    }
    else if (op === "boom") { const x = nearB(); if (x) this.detonateBurn(x.bid, id); }
    else if (op === "bst") {
      // Trạng thái trên hồn thú gần nhất (5.2): giây còn lại, số tầng, độ lớn, có phải do người gọi gây không.
      const x = nearB();
      out = x ? { bid: x.bid, def: x.bd.def, st: Object.fromEntries([...x.bd.st].map(([s, i]) => [s, { t: i.t, n: i.n, v: i.v, mine: i.src === id }])) } : {};
    }
    else if (op === "bdmg") {
      // #116: đòn trực tiếp đúng `v` (không chí mạng) lên hồn thú gần nhất / `bid`, đi qua damageBeast (thủ, Phá giáp, xuyên thủ); trả `dealt`.
      const x = nearB(); if (x) out = { dealt: this.damageBeast(x.bid, int(o.v, 1, 1e8, 1), id, "#ffffff", undefined, { crit: -9 }) };
    }
    else if (op === "bmax") {
      // #218: nhân máu tối đa hồn thú gần nhất / `bid` lên `x` lần và hồi đầy (tinh anh / thú vương / boss: cả máu gốc theo 1 người), để bot
      // đánh đủ lâu mà kiểm tra giữa trận.
      const x = nearB(), k = int(o.x, 1, 10000, 1);
      if (x) { if (x.bd.elite) x.bd.elite.base *= k; x.b.maxHp *= k; x.b.hp = x.b.maxHp; out = { bid: x.bid, hp: x.b.hp }; }
    }
    else if (op === "bhp") { const x = nearB(); if (x) { x.b.hp = Math.max(1, Math.round(x.b.maxHp * int(o.pct, 1, 100, 100) / 100)); x.bd.calm = 0; x.bd.regen = 0; } }
    else if (op === "regen") { const x = nearB(); if (x) { const h0 = x.b.hp; this.regenBeast(x.b, x.bd, int(o.s, 0, 60, 0)); out = { gain: x.b.hp - h0 }; } }
    else if (op === "pregen" && !p.dead && !d.travelling) {
      // #112: sinh lực / hồn lực của người gọi còn hp% / mp%, `hit`: vừa bị đánh (không thì đã lâu), rồi hồi s giây bằng regenPlayer.
      d.hpF = Math.max(1, p.maxHp * int(o.hp, 1, 100, 100) / 100); d.mpF = p.maxMp * int(o.mp, 0, 100, 100) / 100; d.lastHit = o.hit ? 0 : 99;
      const h0 = d.hpF, m0 = d.mpF, safe = this.regenPlayer(p, d, int(o.s, 0, 60, 0)); // kể cả võ hồn ngoài sân (benchHp)
      out = { safe, hp: d.hpF - h0, mp: d.mpF - m0, hp0: h0, mp0: m0, maxHp: p.maxHp, maxMp: p.maxMp, level: p.level, vh: p.vh };
    }
    else if (op === "ready") { d.avaCd.clear(); p.avaCd = 0; fusionReady.delete(d.accountId); bg(presenceBackend.delete(fusionKey(d.accountId)), "presence"); p.ctCd = 0; d.skCd.clear(); for (let i = 0; i < 4; i++) p.cds[i] = 0; for (let i = 0; i < p.bcds.length; i++) p.bcds[i] = 0; d.mpF = p.maxMp * int(o.mp, 0, 100, 100) / 100; p.mp = Math.floor(d.mpF); }
    else if (op === "grant") {
      const vohon = String(o.vohon ?? "");
      if (vohonIndex(vohon) >= 0) {
        store.addVohon(d.accountId, p.name, vohon, d.ch.level).then((v) => {
          if (v && this.pdata.get(id) === d) { d.owned.push(v); this.resCheck(id); }
          this.sendVohons(c); c.send("test", { op, enabled: true });
        }).catch((e) => { console.error("grant thất bại", e); c.send("test", { op, enabled: true }); });
        return;
      }
    }
    else if (op === "legacy") {
      const to = String(o.mapId ?? "");
      if (Object.hasOwn(MAP_MOVED, to) && !d.travelling) {
        this.freeze(id);
        this.chain(d, async () => {
          await store.saveTravel(d.accountId, this.unsaved(id), this.state.mapId, to, int(o.x, 0, 1e5, 0), int(o.y, 0, 1e5, 0), this.unsavedBag(d));
          d.travelled = true;
        }).then(() => {
          if (!d.travelled) d.travelling = false;
          this.sendVohons(c); c.send("test", { op, enabled: true, saved: d.travelled });
        });
        return;
      }
    }
    else if (op === "stats") {
      // Chỉ số của một võ hồn của mình (thiếu rowId: võ hồn ra trận): `bones` là phần hồn cốt cộng thêm (4.2), `base` là khi không
      // gắn gì; võ hồn ra trận kèm `live` (chỉ số đang dùng trong trận: maxHp, maxMp, atk). Từ 5.2: `cores` (chỉ số hồn hạch kèm phần
      // của bộ), `sets` (số món từng bộ), `fx` (hiệu ứng bộ), `slots` (id hồn hạch -> ô); `live` thêm chí mạng và hiệu ứng bộ đang dùng.
      // Từ 8.2: `base` và `stats` kèm cộng minh của tài khoản (không phải đồ gắn), `res` là tiến độ / mốc / % cộng minh hiện tại.
      // E1: `gear` (chỉ số trang bị hồn sư đang mặc, `stats` đã gồm), `live.atkRolls` (12 lần tung công đòn trực tiếp: vũ khí, may mắn).
      // Từ 9.1: `live.buffs` (hiệu ứng có lợi: giây còn lại, độ lớn), `live.shield` / `shieldT` để thử hiệu ứng lan từ đồng đội tổ đội.
      const v = d.owned.find((x) => x.rowId === o.rowId) ?? d.ch;
      if (v === d.ch) this.syncCh(id);
      const vh = Math.max(0, vohonIndex(v.vohon)), rings = v.rings.map(tierOfYears), bones = this.boneBonusOf(d, v.rowId);
      const worn = this.coresOn(d, v.rowId), cores = coreBonus(worn);
      out = { rowId: v.rowId, bones, cores, sets: Object.fromEntries(coreSetCounts(worn)), fx: coreFx(worn),
        slots: Object.fromEntries(worn.map((w) => [w.it.id, w.slot])),
        base: calcStats(vh, v.level, rings, v.stars, {}, {}, d.res.bonus, herbBonus(v.herbs)),
        stats: calcStats(vh, v.level, rings, v.stars, bones, this.withGear(d, cores), d.res.bonus, herbBonus(v.herbs)), gear: { bonus: d.gearSt.bonus, weapon: d.gearSt.weapon, red: d.gearSt.red, luck: d.gearSt.luck }, res: d.res, herbs: { ...v.herbs },
        live: v === d.ch ? { maxHp: p.maxHp, maxMp: p.maxMp, atk: d.atk, passive: d.passive, crit: d.crit, critMult: d.critMult, fx: d.coreFx,
          atkNow: this.atkOf(d, true, "mid"), atkRolls: Array.from({ length: 12 }, () => this.atkOf(d)), spd: d.speed * (1 + this.buffV(d, "spd")), def: this.buffV(d, "def"), critB: this.buffV(d, "crit"),
          ava: d.ava && { row: d.ava.row, t: d.ava.t, stats: d.ava.stats }, avaCd: d.avaCd.get(v.rowId) ?? 0,
          buffs: Object.fromEntries([...d.buffs].map(([k, x]) => [k, { t: x.t, v: x.v }])), shield: d.shield, shieldT: d.shieldT } : null,
        skills: loadoutOf(v.vohon, v.skills), saved: [...v.skills] };
    }
    else if (op === "elite") out = { ...(() => {
      // #119 `bid`: thêm `one` là tinh anh đó (kể cả tinh anh do hook `beast {boss}` sinh, không thuộc ô nào): giao chiến, người tham gia, đóng góp.
      const bd = typeof o.bid === "string" ? this.bdata.get(o.bid) : undefined, e = bd?.elite, b = e && this.state.beasts.get(o.bid as string);
      return e && b ? { one: { bid: o.bid, hp: b.hp, maxHp: b.maxHp, engaged: e.engaged, n: e.n, parts: [...e.parts.keys()], dmgBy: Object.fromEntries(e.dmgBy),
        supBy: Object.fromEntries(e.supBy) } } : {};
    })(), list: this.elites.map((slot) => {
      const b = slot.bid ? this.state.beasts.get(slot.bid) : undefined, bd = slot.bid ? this.bdata.get(slot.bid) : undefined, e = bd?.elite;
      const { spot } = slot, def = BOSSES[spot.boss];
      return { boss: def.id, name: beastName(1, spot.boss), zone: this.map.zones[spot.zone].name, zi: spot.zone,
        rect: { x: spot.x, y: spot.y, w: spot.w, h: spot.h }, bid: slot.bid, respawn: slot.bid ? 0 : slot.t,
        ...(b && bd && e ? { x: b.x, y: b.y, hx: bd.hx, hy: bd.hy, years: b.years, hp: b.hp, maxHp: b.maxHp, base: e.base, dmg: bd.dmg, n: e.n, engaged: e.engaged,
          parts: [...e.parts.keys()], dmgBy: Object.fromEntries(e.dmgBy), supBy: Object.fromEntries(e.supBy), rage: bd.buffs.get("rage") ?? 0, rageCd: e.rageCd, skills: bd.skills.map((x) => x.def.name), minions: bd.minions.size } : {}) };
    }) };
    else if (op === "etick") {
      // Từ BĐ5 chạy cả luật thú vương (người tham gia trong hang, bỏ giao chiến, rút đi khi hết giờ).
      const s = Math.min(1200, Math.max(0, Number(o.s) || 0));
      for (const [bid, bd] of [...this.bdata]) { const b = this.state.beasts.get(bid); if (b && bd.elite) this.tickElite(bid, b, bd, s); }
    }
    else if (op === "king") {
      // BĐ5: `warn {s}` / `spawn {life}` phát sự kiện lịch boss qua presence cho mọi phòng (như schedule.ts), bản đồ `mapId` (mặc định
      // bản đồ của phòng); `info` trả thú vương của phòng (máu, số người, giai đoạn, chiêu, đóng góp, thời gian còn lại; từ 9.2 `dmgBy` / `supBy`).
      // Từ BĐ6e: `mapId` là bản đồ boss thế giới (MapDef.world) thì phát lịch boss thế giới; `boss` chọn con (mặc định con của ngày).
      const kop = String(o.kop ?? "info"), mid = typeof o.mapId === "string" && (MAPS[o.mapId]?.king || MAPS[o.mapId]?.world?.length) ? o.mapId : this.state.mapId;
      const wl = MAPS[mid].world ?? [], kingId = wl.length ? (typeof o.boss === "string" && wl.includes(o.boss) ? o.boss : worldBossOn(mid, bossNow())) : MAPS[mid].king;
      if ((kop === "warn" || kop === "spawn") && kingId) {
        const slot = Date.now();
        publishBoss(this.presence, { mapId: mid, king: kingId, phase: kop, slot, in: kop === "warn" ? int(o.s, 0, 3600, KING.warnSecs) : 0,
          life: int(o.life, 1, 7200, wl.length ? WORLD.lifeSecs : KING.lifeSecs), test: true });
      }
      const bid = this.king?.bid, b = bid ? this.state.beasts.get(bid) : undefined, bd = bid ? this.bdata.get(bid) : undefined, e = bd?.elite, k = e?.king, w = k?.world;
      // `clock` / `clockMode`: đồng hồ lịch boss (BOSS_CLOCK; GAME_TEST mặc định đứng yên ngoài mọi khung) để bot biết lịch thật có chen vào không.
      out = { lair: this.map.lair, slot: this.king?.slot ?? 0, seat: this.king?.seat.state ?? "", roomId: this.roomId, clock: bossNow(), clockMode: bossClockMode(), ...(b && bd && e && k ? { bid, x: b.x, y: b.y, years: b.years, hp: b.hp, maxHp: b.maxHp, base: e.base,
        dmg: bd.dmg, engaged: e.engaged, parts: [...e.parts.keys()], phase: k.phase, roar: k.roar, spd: k.spd, life: k.life, rank: b.rank, boss: k.def.id, now: this.beastDmg(bd),
        skills: bd.skills.map((x) => x.def.name), st: [...bd.st.keys()], cast: bd.cast?.def.name ?? "", charge: !!bd.cast?.charge, ...this.kingRank(e),
        dmgBy: Object.fromEntries(e.dmgBy), supBy: Object.fromEntries(e.supBy), // 9.2: sát thương / hỗ trợ thô theo người
        ...(w ? { world: { rage: w.rage, weak: w.weak, weakT: w.weakT, weakNext: w.weakNext, shield: w.shield, shieldT: w.shieldT, brk: w.brk, dive: w.dive, surf: w.surf,
          chargeT: w.chargeT, armorT: w.armorT, miasmaT: w.miasmaT, diveT: w.diveT, slamT: w.slamT } } : {}) } : {}) };
    }
    else if (op === "wmech") {
      // BĐ6e: chạy ngay một cơ chế của boss thế giới trong phòng: `m` = weak {he, secs} | charge | armor | miasma | dive | surface | slam |
      // rage (đặt thời gian còn lại để tick sau nổi giận) | timers (đẩy mọi chờ cơ chế ra xa 999 giây để bot thử từng cơ chế riêng) |
      // hold {secs} (giữ boss đứng yên để bot đứng cạnh thử luật; 0 = thả).
      const bid = this.king?.bid, b = bid ? this.state.beasts.get(bid) : undefined, bd = bid ? this.bdata.get(bid) : undefined, k = bd?.elite?.king, w = k?.world, mm = k?.def.world ?? {};
      if (bid && b && bd && k && w) {
        // Đang lặn (Du Thủy) thì không chạy cơ chế khác / lặn chồng (như tickWorld).
        const m = String(o.m ?? ""), he = HE_IDS.find((x) => x === o.he) ?? null, up = w.dive <= 0;
        if (m === "weak") this.worldWeak(bid, b, w, he, int(o.secs, 1, 600, WORLD.weakSecs));
        else if (m === "charge" && mm.charge && up) { this.cancelCast(bid, b, bd); this.worldCast(bid, b, bd, mm.charge.skill, true); }
        else if (m === "miasma" && mm.miasma && up) { this.cancelCast(bid, b, bd); this.worldCast(bid, b, bd, mm.miasma.skill, false); }
        else if (m === "slam" && up) { this.cancelCast(bid, b, bd); this.worldCast(bid, b, bd, WORLD_SLAM, false); }
        else if (m === "armor" && mm.armor && up) this.worldArmor(bid, b, w, mm.armor);
        else if (m === "dive" && mm.dive && up) this.worldDive(bid, b, bd, w, mm.dive);
        else if (m === "surface" && w.dive > 0) this.worldSurface(bid, b, bd, k, w);
        else if (m === "rage") k.life = Math.min(k.life, WORLD.lifeSecs - WORLD.enrageSecs);
        else if (m === "hold") { // giữ boss đứng yên (Choáng đặt thẳng, bỏ qua miễn khống chế) `secs` giây; 0 = bỏ
          const secs = Math.min(600, Math.max(0, Number(o.secs) || 0));
          if (secs > 0) bd.st.set("stun", { t: secs, n: 1, v: 0, src: id }); else bd.st.delete("stun");
          this.syncStatus(b, bd);
        }
        else if (m === "timers") { w.chargeT = w.armorT = w.miasmaT = w.diveT = w.slamT = 999; w.weakNext = int(o.weakNext, 0, WORLD.weakAt.length, WORLD.weakAt.length); }
        out = { ok: m, weak: w.weak, shield: w.shield, dive: w.dive, surf: w.surf, cast: bd.cast?.def.name ?? "", charge: !!bd.cast?.charge, life: k.life,
          safe: bd.cast?.safe ?? [], x: b.x, y: b.y };
      }
    }
    else if (op === "egg") {
      // #162: bọc trứng của phòng (eggs.info) và số hồn thú do thú vương gọi ra còn sống; `t {s}` đặt mọi bọc còn đúng s giây trước khi nở (tối đa 25: `BeastState.egg` là uint8).
      const t = typeof o.t === "number" && o.t >= 0 ? Math.min(25, o.t) : undefined, kd = this.king?.bid ? this.bdata.get(this.king.bid) : undefined;
      out = { eggs: this.eggs.info(t), minions: kd ? [...kd.minions].filter((m) => this.state.beasts.has(m)) : [] };
    }
    else if (op === "kdmg") {
      // BĐ5: gây đúng `v` sát thương lên thú vương của phòng (không chí mạng, đi qua damageBeast: thành người tham gia, ghi đóng góp).
      // Từ #119 `bid`: lên hồn thú đó (tinh anh, dù ở xa).
      const bid = typeof o.bid === "string" && this.state.beasts.has(o.bid) ? o.bid : this.king?.bid; if (bid) out = { dealt: this.damageBeast(bid, int(o.v, 1, 1e8, 1), id, "#ffffff", undefined, { direct: false }) };
    }
    else if (op === "chest") {
      // BĐ5: cố định số ngẫu nhiên khi mở rương: hồn cốt / mảnh UR (0..100, rơi khi r/100 < tỉ lệ), võ hồn i trong kingShardPool, số mảnh n,
      // vị trí hồn cốt s; mọi giá trị −1 = ngẫu nhiên; `off` bỏ.
      const pct = (x: unknown) => { const v = int(x, -1, 100, -1); return v < 0 ? -1 : Math.min(0.9999, v / 100); };
      d.testChest = o.off ? null : { bone: pct(o.bone), ur: pct(o.ur), i: int(o.i, -1, 99, -1), n: int(o.n, -1, 99, -1), s: int(o.s, -1, BONE_SLOTS.length - 1, -1) };
    }
    else if (op === "day") {
      this.dayShift = int(o.shift, -3650, 3650, 0); out = { day: this.today() };
      for (const [pid, pd] of this.pdata) if (this.dailyFresh(pd)) this.sendDaily(pid, "reset"); // khảo hạch hằng ngày đặt lại ngay
    }
    else if (op === "tweek") { // #197: lệch tuần tông cho cả tiến trình (số ngày); trả tuần hiện tại
      if (typeof o.shift === "number") tongShift = int(o.shift, -3650, 3650, 0);
      out = { week: tongWeek(this.tongNow()), shift: tongShift };
    }
    else if (op === "ttask") { // #197: đặt tiến độ tông vụ `i` như hook daily; trả bộ tông vụ
      this.tongFresh(d);
      const i = int(o.i, -1, TONG_DAILY.count - 1, -1), q = d.tongTasks[i];
      if (q && Number.isInteger(o.step)) { d.tongTasks[i] = parseQuest({ step: o.step, accepted: o.accepted === true, prog: o.prog }, q.chain); d.bagDirty = true; this.sendTong(id); }
      out = { day: d.tongDay, tasks: d.tongTasks.map((x) => ({ ...x, status: questStatus(x) })) };
    }
    else if (op === "tpts") { // #197: cộng `n` điểm tông tuần hiện tại (qua chuỗi lưu), xong thì gửi log "[test] điểm tông …"
      const n = int(o.n, 0, 10000, 0), tong = d.tong, week = tongWeek(this.tongNow());
      if (tong) this.chain(d, async () => { const pts = await store.addTongPoints(d.accountId, week, tong, n); this.log(id, `[test] điểm tông ${pts}`); });
      out = { week, tong };
    }
    else if (op === "daily") {
      // Khảo hạch hằng ngày: `shift` lệch ngày của bộ bài cho cả tiến trình (mọi phòng, kể cả phòng sân đấu mở sau; phòng khác đặt lại
      // ở lần kiểm tra ngày kế tiếp trong tick); đặt tiến độ bài `i` của hôm nay (bước, đã nhận, số đếm; kẹp như khi nạp DB); trả ngày
      // và tiến độ cả bộ.
      if (o.shift !== undefined) {
        dailyShift = int(o.shift, -3650, 3650, 0);
        for (const [pid, pd] of this.pdata) if (this.dailyFresh(pd)) this.sendDaily(pid, "reset");
      }
      const i = int(o.i, -1, DAILY.count - 1, -1), q = d.daily[i];
      if (q && Number.isInteger(o.step)) { d.daily[i] = parseQuest({ step: o.step, accepted: o.accepted === true, prog: o.prog }, q.chain); d.bagDirty = true; this.sendDaily(id); }
      out = { day: d.dailyDay, daily: d.daily.map((x) => ({ ...x, status: questStatus(x) })) };
    }
    else if (op === "quest") {
      // 6.2: đặt tiến độ chuỗi cố định `chain` (mặc định tân thủ; bước, đã nhận, số đếm; kẹp như khi nạp DB) như tài khoản đang ở giữa chuỗi;
      // trả tiến độ hiện tại.
      const q = this.fixedQuest(d, typeof o.chain === "string" ? o.chain : QUEST_STARTER);
      if (q && Number.isInteger(o.step)) { Object.assign(q, parseQuest({ step: o.step, accepted: o.accepted === true, prog: o.prog }, q.chain)); d.bagDirty = true; this.sendQuest(id, undefined, undefined, q.chain); }
      out = { quest: q && { ...q, status: questStatus(q) } };
    }
    else if (op === "warp") {
      // 6.2: chuyển sang bản đồ `mapId` tại (x, y) qua đúng transaction đi cổng (beginTravel, như một cổng ẩn); client nhận `travel`
      // rồi vào phòng mới như đi cổng thật. Chỗ không đứng được thì vào ở `spawn`.
      const to = String(o.mapId ?? "");
      if (Object.hasOwn(MAPS, to) && MAPS[to].kind !== "arena" && to !== this.state.mapId && !d.travelling && !d.travelCast) {
        this.beginTravel(id, { name: "warp", to, arrive: "", ax: Number(o.x) || 0, ay: Number(o.y) || 0, level: null, boat: false, x: 0, y: 0, w: 0, h: 0 });
        out = { warp: to };
      }
    }
    else if (op === "awatch") { const n = int(o.max, 0, ARENA.watchMax, -1); setTestWatchMax(n < 0 ? null : n); out = { max: arenaWatchMax() }; } // #278: số người xem tối đa
    else if (op === "aelo") {
      // 7.2: ghi Elo / thành tích Đại Đấu Hồn Trường của người gọi (qua chuỗi lưu, không thưởng) để thử ghép theo Elo và bảng xếp hạng.
      const rec = { elo: int(o.elo, 0, 1e6, ARENA.startElo), wins: int(o.wins, 0, 1e6, 0), losses: int(o.losses, 0, 1e6, 0), draws: int(o.draws, 0, 1e6, 0) };
      this.chain(d, async () => {
        const cur = await store.getArena(d.accountId, ARENA.startElo);
        await store.saveArena(d.accountId, ARENA.startElo, { elo: rec.elo - cur.elo, wins: rec.wins - cur.wins, losses: rec.losses - cur.losses, draws: rec.draws - cur.draws });
      }).then(() => { this.sendVohons(c); c.send("test", { op, enabled: true, rec }); });
      return;
    }
    else if (op === "aslow") arenaTestSlow(d.accountId, int(o.ms, 0, 10000, 0)); // #225: lần đọc Elo kế tiếp lúc xếp hàng chậm thêm `ms` mili giây
    else if (op === "claims") {
      // BĐ5: lượt nhận rương thú vương hôm nay trong bộ nhớ và trong DB (đọc sau khi chuỗi lưu xong).
      this.chain(d, async () => {
        const db = await store.bossClaims(d.accountId, this.today(), BOSS_CLAIM_KING), wdb = await store.bossClaims(d.accountId, this.today(), BOSS_CLAIM_WORLD);
        const sdb = await store.bossClaims(d.accountId, this.today(), SHARD_BUY.claimKind); // #282: mảnh đã đổi ở Thương hội
        this.sendVohons(c); c.send("test", { op, enabled: true, day: this.today(), n: this.claimsToday(d), db, w: this.claimsToday(d, true), wdb, s: this.shardBuyToday(d), sdb });
      });
      return;
    }
    else if (op === "auto") {
      // Auto 1: `used` đặt số giây đã treo hôm nay (thử hết giờ); `pvp` một đòn như của người chơi khác (hurtPlayer với `pvp`, phòng bản
      // đồ không có PvP thật); trả trạng thái tự săn (mục tiêu, đồ đang nhặt, điểm neo, võ hồn chính khi đổi tay tiên cơ).
      if (typeof o.used === "number" && Number.isFinite(o.used)) { d.autoUsed = Math.max(0, Math.min(AUTO_DAILY_SECS, o.used)); d.autoDay = this.today(); d.autoDirty = true; this.sendAuto(id); }
      // Auto 2: `bonus` đặt quỹ giờ treo cộng thêm (giây, 0..AUTO_BONUS_MAX).
      if (typeof o.bonus === "number" && Number.isFinite(o.bonus)) { d.autoBonus = Math.max(0, Math.min(AUTO_BONUS_MAX, o.bonus)); d.autoDirty = true; this.sendAuto(id); }
      if (o.pvp && !p.dead) { d.inv = 0; this.hurtPlayer(id, 1, { pvp: { dealt: 0 } }); }
      // `rate: true` dùng nhịp tin `auto` thật (AUTO_MSG_RATE) và đầy lại lượt; `rate: false` nới lại (thử F2 báo cáo soát).
      if (typeof o.rate === "boolean") { d.autoRealRate = o.rate; d.autoTok = AUTO_MSG_RATE.burst; d.autoTokAt = Date.now(); d.autoSetPend = null; }
      const a = d.auto;
      // #213: `pace` đặt nợ nhịp (giây) của lượt tự săn đang chạy (thử trần tốc độ AUTO_PACE).
      if (a && typeof o.pace === "number" && Number.isFinite(o.pace)) a.pace = Math.max(-3600, Math.min(3600, o.pace));
      // AH4 (#611): `loop` điền sẵn các điểm đứng quanh chỗ này (giả lập đi vòng lặp AUTO_STUCK.window giây): mẫu kế tiếp kích hoạt chống kẹt.
      if (a && o.loop) { a.trail = Array.from({ length: Math.ceil(AUTO_STUCK.window / AUTO_STUCK.sample) - 1 }, () => ({ x: p.x, y: p.y })); a.trailT = 0; }
      // #218: `kn` / `wn` đặt số lượt nhận thưởng thú vương / boss thế giới hôm nay trong bộ nhớ (thử tự săn bỏ boss khi hết lượt; DB vẫn
      // là nguồn chính lúc nhận, claimBoss).
      if (typeof o.kn === "number") Object.assign(d.claims, { day: this.today(), n: int(o.kn, 0, KING.daily, 0) });
      if (typeof o.wn === "number") Object.assign(d.wclaims, { day: this.today(), n: int(o.wn, 0, WORLD.daily, 0) });
      // `bid`: hồn thú đó đang nhắm ai, ai đánh gần nhất, đang về chỗ sinh; #266: số giây tự săn của mình còn bỏ qua nó (kẹt / không tới
      // được; null khi không bị bỏ qua hoặc đã hết hạn mà chưa tới nhịp dọn), những người treo ngoài tổ đội đang nhắm nó (như
      // AutoHunter.claimed: tự săn của mình không nhắm theo).
      const bid = typeof o.bid === "string" ? o.bid : "", bd = bid ? this.bdata.get(bid) : undefined, skipTo = a?.skip.get(bid);
      const claim: string[] = []; if (bd) for (const [sid, x] of this.pdata) if (x.auto && x.auto !== a && x.auto.target === bid && !a?.ally(sid)) claim.push(sid);
      // `secs`: giây đã treo lượt này theo nhịp server (cùng đồng hồ với nợ nhịp; bot đo cửa sổ trần tốc độ bằng nó, #328).
      out = { on: !!a, used: d.autoUsed, bonus: d.autoBonus, day: d.autoDay, secs: a?.secs ?? null, target: a?.target ?? null, pace: a?.pace ?? null, est: a?.est ?? null, why: a?.why?.w ?? null, mates: a?.mates().length ?? 0, goal: a?.goal ?? null, path: a?.path.length ?? null,
        drop: a?.loot ? (({ x, y, item, owner, ownerTtl }) => ({ x, y, item, owner, ownerTtl }))(this.state.drops.get(a.loot) ?? ({} as DropState)) : null, loot: a?.loot ?? null, anchor: a?.anchor ?? null, home: a?.home ?? null, cfg: d.autoCfg,
        // #218: mục tiêu là boss, số lần bắt đầu né, chỗ né đang đi tới, đang lùi vì ít máu, hệ võ hồn cơ chế đang cần.
        boss: a?.boss ?? false, dodges: a?.dodges ?? 0, dodge: a?.dodge ?? null, away: a?.away ?? false, warm: a?.warm ?? false, role: a?.role?.he ?? null, cleanse: a?.cleanseRow(d) ?? null,
        // #291: nhịp trước đi thẳng tới mục tiêu ("line") hay theo đường A* ("path"), số lần tìm đường A*, số lần tính đường thẳng.
        way: a?.way ?? null, plans: a?.plans ?? 0, lines: a?.lines ?? 0,
        // AH3 (#610): đang nghỉ hồi (hết đan), đang đi dạo tới vùng hồi sinh đã nhớ (điểm đi dạo), số vùng nhớ, số hồn kỹ diện rộng đã tung vì
        // đông, các ô hồn kỹ diện rộng (quanh thân / trước mặt) của võ hồn ra trận, số con trong AUTO_CLUSTER.r quanh mình.
        resting: a?.resting ?? false, spawning: a?.spawning ?? false, patrol: a?.patrol ?? null, spawns: a?.spawns.size ?? 0, aoeCasts: a?.aoeCasts ?? 0,
        aoe: a ? a.cfg.skills.filter((i) => { const sk = a.skillAt(p, d, i)?.sk; return !!sk && (sk.area === "around" || sk.area === "front") && sk.dmg > 0; }) : [],
        ...(bd ? { beast: { target: bd.target, hitBy: bd.hitBy, calm: bd.calm, ret: bd.ret, skip: a && skipTo !== undefined && skipTo > a.clock ? skipTo - a.clock : null, claim } } : {}) };
    }
    else if (op === "tong") {
      // #196: `back` (số ngày) lùi lúc gia nhập tông về trước (giả lập thời gian trôi, ghi DB); trả tông, lúc gia nhập, số giây còn chờ.
      // #198: `set` = mã tông (hoặc "" / null để rời) đặt thẳng, bỏ qua điều kiện sứ giả / cấp / chờ đổi (bài chat tông); ghi DB như gia nhập.
      if ("set" in o) {
        const t = tongDef(o.set), now = Date.now();
        d.tong = t?.id ?? null; d.tongPend = []; p.tong = t ? TONG_MON.findIndex((x) => x.id === t.id) + 1 : 0;
        if (t) d.tongAt = now;
        // Như tongAction: gia nhập hay rời đều xoá điểm tuần (week); tong_at giữ (COALESCE ở PgStore).
        const id2 = d.tong, at = t ? now : null; this.chain(d, () => t ? store.setTong(d.accountId, id2, at, tongWeek(now)) : store.setTong(d.accountId, null, null, tongWeek(now)));
        if (t) this.questEvent(id, { k: "tong" }); // #286: như gia nhập thật
        this.sendTong(id);
      }
      if (d.tongAt !== null && typeof o.back === "number" && Number.isFinite(o.back)) {
        d.tongAt -= Math.max(0, Math.min(365, o.back)) * 86400000;
        const at = d.tongAt; this.chain(d, () => store.setTong(d.accountId, d.tong, at));
      }
      out = { tong: d.tong, at: d.tongAt, ptong: p.tong };
    }
    else if (op === "perf") {
      // #218: thời gian tick / bản vá trung bình và lớn nhất (ms) của phòng từ lần đặt lại trước (chỉ đo khi server bật PERF_LOG=1);
      // `reset` đặt lại sau khi đọc.
      const a = this.perfAll, n = Math.max(1, a.n);
      out = { on: this.perfOn, n: a.n, tick: a.tick / n, patch: a.patch / n, max: a.max, auto: a.auto / n, players: this.state.players.size, beasts: this.state.beasts.size, ...(o.mem === true ? (({ rss, heapUsed }) => ({ rss, heap: heapUsed }))(process.memoryUsage()) : {}) };
      if (o.reset) Object.assign(a, { n: 0, tick: 0, patch: 0, max: 0, auto: 0 });
    }
    else if (op === "offline") {
      // Auto 3: `ago` (giây, 0–7 ngày) lùi thời điểm của lần ủy thác offline kế tiếp (giả lập thời gian trôi); trả vùng săn chỗ đang
      // đứng nếu thoát ở đây thì được ủy thác (null = không), `ago` đang đặt, chế độ và giờ của đồng hồ lịch (chia quỹ theo ngày).
      if (typeof o.ago === "number" && Number.isFinite(o.ago)) testOfflineAgo.set(d.accountId, Math.max(0, Math.min(7 * 86400, o.ago)));
      out = { zone: this.offlineZone(id)?.name ?? null, ago: testOfflineAgo.get(d.accountId) ?? 0, clock: bossClockMode(),
        now: bossNow() + this.dayShift * 86400000, day: this.today() };
    }
    else if (op === "elock") {
      // #119: khóa nhận thưởng tinh anh của chính mình (mọi bản đồ): `s` (>= 0) đặt mọi khóa đang có còn `s` giây (0 = bỏ khóa);
      // trả `locks` (`${mapId}|${mã tinh anh}` -> giây còn lại).
      const now = Date.now(), sv = o.s === undefined ? -1 : Math.max(0, Number(o.s) || 0), locks: Record<string, number> = {};
      // #218: `key` (`${mapId}|${mã tinh anh}`) với `s` > 0: đặt khóa mới cho chính mình (thử tự săn bỏ tinh anh đang khóa).
      if (typeof o.key === "string" && sv > 0) { let m = eliteLocks.get(o.key); if (!m) eliteLocks.set(o.key, m = new Map()); m.set(d.accountId, now + sv * 1000); }
      for (const [key, m] of eliteLocks) {
        if (!m.has(d.accountId)) continue;
        if (sv === 0) m.delete(d.accountId); else if (sv > 0) m.set(d.accountId, now + sv * 1000);
        const l = eliteLockLeft(key, d.accountId, now); if (l > 0) locks[key] = l;
      }
      out = { locks };
    }
    else if (op === "erespawn") { const s = Math.max(0, Number(o.s) || 0); for (const slot of this.elites) if (!slot.bid) slot.t = Math.min(slot.t, s); }
    else if (op === "clear") this.state.beasts.forEach((b, bid) => { // `keep`: giữ tinh anh (BĐ4); `all`: cả bản đồ, không chỉ quanh người gọi (BĐ6d)
      // `but` (#213): giữ hồn thú có id này / trong danh sách này (bài tự săn dọn hồn thú tự nhiên quanh mình mà không xóa mục tiêu đang thử).
      if ((o.all || Math.hypot(b.x - p.x, b.y - p.y) < 160) && !(o.keep && b.rank) && !(Array.isArray(o.but) ? o.but.includes(bid) : bid === o.but)) { this.state.beasts.delete(bid); this.bdata.delete(bid); }
    });
    else if (op === "set") {
      const v = d.owned.find((x) => x.rowId === o.rowId);
      if (v) {
        this.syncCh(id);
        v.level = int(o.level, 1, MAX_LEVEL, v.level); v.xp = int(o.xp, 0, 1e9, v.xp); v.stars = int(o.stars, 1, MAX_STARS, v.stars);
        if (Array.isArray(o.rings)) v.rings = o.rings.filter((y) => Number.isInteger(y) && y > 0).slice(0, MAX_RINGS) as number[];
        if (v === d.ch) { d.ringYears = [...v.rings]; this.showVohon(p, v); this.recalc(id, true); } else d.dirty.add(v.rowId);
        this.resCheck(id);
      }
    }
    // Sinh lực / hồn lực đổi qua hpF / mpF (hurtPlayer, drain…) chỉ chép vào state ở tick(): chép ngay, để bản vá state đầu tiên sau tin
    // trả đã có số mới (bot đọc state ngay sau hook; tick có thể chạy sau bản vá kế tiếp khi server bận).
    if (!p.dead && this.pdata.get(id) === d) { p.hp = Math.ceil(Math.min(p.maxHp, d.hpF)); p.mp = Math.floor(Math.min(p.maxMp, d.mpF)); }
    this.sendVohons(c);
    c.send("test", { op, enabled: true, ...out });
  }

  /**
   * Lệnh GM (#518): chỉ tài khoản trong ADMIN_ACCOUNTS (server-authoritative; trống = tắt hẳn), mỗi lệnh qua gmAllow (giới hạn tốc độ), kiểm bằng
   * parseGm, ghi nhật ký server một dòng `[GM]`. Người không có quyền chỉ nhận một dòng từ chối. Admin dùng lệnh thì tài khoản tự bật is_test.
   */
  gmAction(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const now = Date.now(), text = typeof raw === "string" ? raw.slice(0, 200) : "";
    if (!gmAllow(d.accountId, now)) return; // bỏ im lặng: không để spam sinh nhật ký / phản hồi
    if (!gmEnabled() || !isAdmin(d.accountId)) {
      console.warn(`[GM] TỪ CHỐI tài khoản #${d.accountId} (${p.name}): ${JSON.stringify(text)}`);
      return this.log(id, "Không có quyền dùng lệnh GM.", "#ffb35c");
    }
    if (this.state.mapId === ARENA_MAP) return this.log(id, "Không dùng lệnh GM trong sân đấu.", "#ffb35c");
    const cmd = parseGm(text);
    if ("error" in cmd) { console.log(`[GM] #${d.accountId} ${p.name}: ${JSON.stringify(text)} -> lỗi: ${cmd.error}`); return this.log(id, cmd.error, "#ffb35c"); }
    if (d.gmReset) return this.log(id, "Đã áp mức dựng sẵn: vào lại game rồi dùng tiếp.", "#ffb35c");
    const done = (msg: string) => { console.log(`[GM] #${d.accountId} ${p.name}: ${JSON.stringify(text)} -> ${msg}`); this.log(id, `GM: ${msg}`, "#9fd8ff"); };
    const run = async () => {
      if (!d.gmMarked) { await store.markTest(d.accountId); d.gmMarked = true; } // tự bật is_test ngay lần dùng đầu
      if (this.pdata.get(id) !== d) return;
      done(await this.gmRun(id, d, cmd));
      if (this.pdata.get(id) === d) { const c = this.clients.getById(id); if (c) this.sendVohons(c); this.sendBag(id); this.sendGear(id); }
    };
    this.chain(d, run).catch((e) => { console.error(`[GM] lỗi lệnh ${JSON.stringify(text)}`, e); this.log(id, "Lệnh GM lỗi (xem log server).", "#ff8a8a"); });
  }

  /** Thực thi một lệnh GM đã kiểm; trả câu mô tả kết quả. Chạy trong chuỗi lưu của người chơi (gmAction), nên ghi DB không chạy chồng lần lưu khác. */
  async gmRun(id: string, d: PData, cmd: GmCmd): Promise<string> {
    const p = this.state.players.get(id)!, full = () => `Túi đồ đã đầy (${d.bagSlots} ô).`;
    switch (cmd.op) {
      case "level": {
        const v = d.ch; this.syncCh(id);
        v.level = cmd.level; v.xp = 0;
        // Cấp phải đi qua đủ bình cảnh: thiếu hồn hoàn thì thêm hồn hoàn đúng giới hạn của vòng (luôn hợp lệ).
        while (v.rings.length < Math.min(MAX_RINGS, Math.ceil(cmd.level / 10) - 1)) v.rings.push(ringLimit(v.rings.length + 1));
        d.ringYears = [...v.rings]; this.showVohon(p, v); this.recalc(id, true); d.dirty.add(v.rowId); this.resCheck(id);
        return `${VOHON[vohonIndex(v.vohon)].name} cấp ${v.level}, ${v.rings.length} hồn hoàn.`;
      }
      case "give": { const n = this.addItem(d, cmd.code, cmd.qty); return n < cmd.qty ? `${full()} Đã cho ${n}/${cmd.qty}.` : `Đã cho ${n} ${itemDef(cmd.code)!.name}.`; }
      case "ring": { let n = 0; while (n < cmd.qty && this.addRing(d, cmd.years)) n++; return n < cmd.qty ? `${full()} Đã cho ${n}/${cmd.qty} hồn hoàn.` : `Đã cho ${n} hồn hoàn ${formatYears(cmd.years)}.`; }
      case "bone": {
        const it = this.addBone(d, cmd.years, cmd.beast, cmd.slot); if (!it) return full();
        if (cmd.enhance) it.stats = { ...(it.stats as object), xp: boneEnhanceNeed(cmd.enhance), subs: boneAddSubs(cmd.slot, cmd.years, cmd.enhance, [], Math.random).subs };
        it.enhance = cmd.enhance;
        return `Đã cho ${boneName(cmd.beast, cmd.slot, cmd.years, cmd.enhance)}.`;
      }
      case "core": {
        const base = rollCoreStats(cmd.stars, [], Math.random, coreSetIndex(cmd.set)), data = cmd.enhance ? coreUpgradeSubs(base, cmd.stars, coreSubRolls(0, cmd.enhance), Math.random).data : base;
        const it = this.addCore(d, cmd.stars, data); if (!it) return full();
        if (cmd.enhance) { it.stats = { ...(it.stats as object), subs: data.subs, xp: coreEnhanceNeed(cmd.enhance) }; it.enhance = cmd.enhance; }
        return `Đã cho ${coreName(cmd.set, cmd.stars, cmd.enhance)}.`;
      }
      case "gear": {
        const tpl = equipTemplate(cmd.tpl)!, it = this.addEquip(d, rollEquip(tpl, cmd.ilvl, () => 0.5)); if (!it) return full();
        it.enhance = cmd.enhance;
        return `Đã cho ${equipName(cmd.tpl, cmd.enhance)}.`;
      }
      case "vohon": {
        const vi = vohonIndex(cmd.vohon), name = VOHON[vi].name;
        if (d.owned.some((v) => v.vohon === cmd.vohon)) return `Đã sở hữu ${name}.`;
        const v = await store.unlockVohon(d.accountId, p.name, cmd.vohon, 1, this.bagSnapshot(d));
        if (!v) return `Đã sở hữu ${name}.`;
        v.rings = Array.from({ length: cmd.rings }, (_, k) => ringLimit(k + 1)); v.level = Math.min(cmd.level, 10 * (v.rings.length + 1)); d.dirty.add(v.rowId);
        d.owned.push(v); this.resCheck(id);
        return `Đã thêm ${name} cấp ${v.level}, ${v.rings.length} hồn hoàn${cmd.level > v.level ? " (cấp bị kẹp theo bình cảnh, cần thêm hồn hoàn)" : ""}.`;
      }
      case "coin": d.honTe = cmd.n; d.bagDirty = true; return `Hồn Tệ = ${formatHonTe(cmd.n)}.`;
      case "fog": {
        // Sương mù khám phá (R8): mở cả bản đồ đang đứng, hoặc xoá về trống (rồi mở quanh chỗ đứng). Ghi DB như mọi lần đánh dấu (fogFlush).
        if (!this.fogOn) return "Bản đồ này mở sẵn, không có sương mù.";
        if (!d.fog) return "Sương mù chưa nạp xong, thử lại sau.";
        const dims = this.fogDims();
        d.fog = cmd.mode === "open" ? fogFill(dims) : fogEmpty(dims);
        d.fogDirty = true; if (cmd.mode === "reset") this.fogMarkOne(id, d);
        this.sendFog(id);
        return cmd.mode === "open" ? "Đã mở cả bản đồ." : "Đã xoá sương mù về trống (mở lại quanh chỗ đứng).";
      }
      case "tp": {
        if (cmd.mapId === this.state.mapId) return "Đang ở bản đồ đó rồi.";
        if (d.travelling || d.travelCast) return "Đang đi cổng, thử lại sau.";
        this.beginTravel(id, { name: "gm", to: cmd.mapId, arrive: "", ax: 0, ay: 0, level: null, boat: false, x: 0, y: 0, w: 0, h: 0 });
        return `Dịch chuyển tới ${MAPS[cmd.mapId].name}.`;
      }
      case "preset": {
        // Ghi đè DB bằng mức dựng sẵn rồi ngắt client: từ lúc bắt đầu phiên bị khoá (freeze: mọi handler bỏ qua người đang travelling,
        // lưu định kỳ bỏ qua) và mọi lần ghi xếp thêm bị bỏ (gmReset, ở chain), nên không đè lại mức vừa áp bằng túi cũ trong RAM.
        d.gmReset = true; this.freeze(id);
        try { await store.seedTestAccount(p.name, null, buildPreset(cmd.preset)); }
        catch (e) { d.gmReset = false; d.travelling = false; throw e; } // lỗi: trả lại như cũ, người chơi chơi tiếp
        this.clock.setTimeout(() => this.clients.getById(id)?.leave(4000), 800); // clock của phòng: phòng dispose thì tự huỷ (#700)
        return `Đã áp mức "${cmd.preset}": vào lại game để thấy thay đổi.`;
      }
    }
  }

  /**
   * Kinh nghiệm hạ hồn thú `years` năm (mục 5.1, 5.3; tăng theo số năm, beastStats): giảm theo chênh cấp giữa võ hồn ra trận và
   * cấp tương đương của số năm (beastLevel, từ BĐ3) một lần, rồi chia cho đội:
   * võ hồn ra trận XP_SHARE_ACTIVE, mỗi võ hồn khác trong đội XP_SHARE_BENCH (kể cả võ hồn đã gục). Ô trống và võ hồn
   * ở bình cảnh không nhận, phần đó không chia lại. `mult`: hệ số theo bậc hồn thú (tinh anh ELITE.xp, BĐ4).
   */
  rewardKill(id: string, years: number, mult = 1) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const base = beastStats(years).xp * mult * xpLevelScale(p.level, beastLevel(years));
    for (const r of d.team) {
      const v = d.owned.find((o) => o.rowId === r); if (!v) continue;
      if (v === d.ch) this.addXp(id, Math.round(base * XP_SHARE_ACTIVE));
      else this.benchXp(id, v, Math.round(base * XP_SHARE_BENCH));
    }
  }

  /** Kinh nghiệm cho võ hồn trong đội đang không ra trận (cùng luật lên cấp, bình cảnh như addXp). */
  benchXp(id: string, v: Character, n: number) {
    if (n <= 0 || xpBlocked(v.level, v.rings.length)) return;
    const d = this.pdata.get(id)!, name = VOHON[Math.max(0, vohonIndex(v.vohon))].name, lv0 = v.level;
    v.xp += n; d.dirty.add(v.rowId);
    while (!xpBlocked(v.level, v.rings.length) && v.xp >= xpNeed(v.level)) {
      v.xp -= xpNeed(v.level); v.level++;
      if (!d.down.has(v.rowId)) d.benchHp.delete(v.rowId); // lên cấp thì hồi đầy, như võ hồn ra trận
      if (xpBlocked(v.level, v.rings.length)) {
        v.xp = 0;
        this.log(id, `${name} đạt cấp ${v.level}: bình cảnh! Cần hấp thụ hồn hoàn thứ ${v.rings.length + 1}.`, "#ffe08a");
      } else this.log(id, `${name} lên cấp ${v.level}.`);
    }
    if (v.level !== lv0) this.resCheck(id); // cộng minh (8.2)
  }

  addXp(id: string, n: number) {
    const p = this.state.players.get(id)!, lv0 = p.level;
    if (n <= 0 || xpBlocked(p.level, p.rings.length)) return;
    p.xp += n;
    while (!xpBlocked(p.level, p.rings.length) && p.xp >= xpNeed(p.level)) {
      p.xp -= xpNeed(p.level); p.level++;
      this.recalc(id, false); this.pdata.get(id)!.hpF = p.maxHp;
      this.broadcast("fx", { k: "wave", x: p.x, y: p.y, r: 30, col: "#ffe9a0" });
      if (xpBlocked(p.level, p.rings.length)) {
        p.xp = 0;
        this.log(id, `Đạt cấp ${p.level}: bình cảnh! Hãy săn hồn thú và hấp thụ hồn hoàn thứ ${p.rings.length + 1}.`, "#ffe08a");
      } else this.log(id, `Lên cấp ${p.level}.`);
    }
    this.recalc(id, false);
    if (p.level !== lv0) this.resCheck(id); // cộng minh (8.2): võ hồn cấp 30+
  }

  /**
   * Hồn thú gây `dmg` cho hồn sư `id`. Trả về true nếu đòn trúng (kể cả khiên đỡ hết), false nếu bị bỏ qua (vừa bị đánh, bất tử,
   * miễn sát thương, đang chuyển bản đồ). Từ 3.5: Dễ thương / Phá giáp trên hồn sư tăng sát thương nhận; `dot`: sát thương theo
   * thời gian (Trúng độc, Thiêu đốt: bỏ qua và không đặt khung bất tử 0,45 giây, không lan Cảm điện); đòn trực tiếp trúng hồn sư
   * Cảm điện thì lan STATUS.shock.chain sang hồn sư Cảm điện khác gần đó (`chain`: phần lan, không lan tiếp).
   */
  hurtPlayer(id: string, dmg: number, o: { dot?: boolean; chain?: boolean; pvp?: { dealt: number }; crit?: boolean } = {}): boolean {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, direct = !o.dot && !o.chain;
    if ((direct && d.inv > 0) || p.dead || d.travelling) return false; // trong vùng an toàn hồn thú đã bỏ mục tiêu (tick) nên không đánh tới
    if (d.travelCast) this.stopCast(id, d.travelCast.wp ? "Bị tấn công: đã hủy truyền tống." : "Bị tấn công: đã hủy đi qua cổng.");
    if (o.pvp) this.autoStop(id, "bị người chơi tấn công."); // tự săn (mục 5.13)
    // Miễn sát thương (Vô Địch Thần Quang): không mất gì nhưng vẫn tính là bị đánh (giao chiến), hiện chữ "Miễn".
    // Đòn của đối thủ (Đại Đấu Hồn Trường, `pvp`, 7.2) không đặt khung bất tử 0,45 giây (hồn kỹ nhiều nhát vẫn trúng đủ) và không lan Cảm điện;
    // bất tử do hồn kỹ / lúc vào sân vẫn chặn.
    if (this.buffV(d, "inv")) { d.fight = 0; if (direct && !o.pvp) d.inv = 0.45; this.broadcast("dmg", { x: p.x, y: p.y - 18, v: 0, c: "#fff2b0", id, immune: true }); return false; }
    // Tàng hình (đã chốt 2026-10-20): bị đòn trực tiếp đánh trúng thì hiện hình, kể cả khi khiên đỡ hết; đòn bị miễn ở trên thì không.
    if (direct) this.unhide(p, d);
    const raw = dmg, armor = d.st.get("armor"), poison = d.st.get("poison");
    // Bộ hồn hạch Xà Hoàng 4 món lên hồn sư (#277): Trúng độc đủ tầng do đối thủ mang bộ gây (src, chỉ đối thủ trong sân ghi) thì như
    // Dễ thương thêm, mọi đòn kể cả sát thương theo thời gian.
    const pv = poison?.src && poison.n >= CORE_FX_RULE.poisonStacks ? this.pdata.get(poison.src)?.coreFx.poisonVuln ?? 0 : 0;
    dmg *= 1 + (d.st.has("vuln") ? STATUS.vuln.amp : 0) + (direct && armor ? STATUS.armor.amp * armor.n : 0) + pv;
    dmg = Math.round(dmg * VOHON[p.vh].def * (1 - Math.min(0.9, this.buffV(d, "def"))));
    // Khiên (tiên cơ phụ trợ) đỡ trước; vẫn tính là bị đánh (giao chiến, gián đoạn hấp thụ).
    const blocked = Math.min(d.shield, dmg); d.shield -= blocked; dmg -= blocked; p.shield = Math.ceil(d.shield);
    d.hpF -= dmg; if (direct && !o.pvp) d.inv = 0.45; d.lastHit = 0; d.fight = 0;
    if (o.pvp) o.pvp.dealt = dmg;
    // Khiên đỡ hết thì hiện số bị đỡ (màu lam) thay cho số 0.
    this.broadcast("dmg", { x: p.x, y: p.y - 18, v: -(dmg || blocked), crit: o.crit, c: blocked ? "#9ad8ff" : o.crit ? "#ffe14d" : o.dot ? "#8ef08a" : "#ff6b6b", id }); // id: client chạy animation hurt cho hồn sư này
    if (d.absorbing) this.cancelAbsorb(id, "Bị tấn công: quá trình hấp thụ bị gián đoạn, hồn hoàn vẫn còn trong túi.");
    if (d.hpF <= 0) { d.hpF = 0; p.hp = 0; this.knockOut(id); }
    if (direct && !o.pvp && d.st.has("shock")) {
      const sh = STATUS.shock;
      for (const [oid, op] of this.state.players.entries())
        if (oid !== id && !op.dead && this.pdata.get(oid)?.st.has("shock") && Math.hypot(op.x - p.x, op.y - p.y) < sh.chainR) this.hurtPlayer(oid, raw * sh.chain, { chain: true });
    }
    return true;
  }

  /**
   * Võ hồn ra trận gục (mục 5.1): tự đổi sang võ hồn chưa gục kế tiếp trong đội (theo thứ tự ô, hết thì vòng lại ô 1), không
   * tính và không chờ hồi chiêu đổi. Cả đội gục thì sau RESPAWN_SECS giây về doanh trại; không mất kinh nghiệm hay đồ (mục 2).
   */
  knockOut(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, fallen = d.ch, name = VOHON[p.vh].name;
    d.down.set(fallen.rowId, REVIVE_SECS); d.energy.delete(fallen.rowId); // gục thì mất hết năng lượng tiên cơ
    if (fallen.vohon === PHONG_LOI.vohon) { d.lei = 0; p.lei = 0; } // Lam Điện Bá Vương Long gục thì mất Phong Lôi Chi Lực
    const at = d.team.indexOf(fallen.rowId);
    let next: Character | undefined;
    for (let k = 1; k < TEAM_SIZE && !next; k++) {
      const r = d.team[(at + k) % TEAM_SIZE];
      if (r && !d.down.has(r)) next = d.owned.find((v) => v.rowId === r);
    }
    const c = this.clients.getById(id);
    if (next) {
      const nextName = VOHON[Math.max(0, vohonIndex(next.vohon))].name;
      this.activate(id, next, `${name} đã gục! ${nextName} tự động ra trận. ${name} hồi lại sau ${REVIVE_SECS} giây ngoài trận hoặc khi về doanh trại.`);
      c?.send("ko", { fallen: fallen.vohon, next: next.vohon });
      this.persistTeam(d);
      if (c) this.sendVohons(c);
    } else {
      p.dead = true; d.deadT = RESPAWN_SECS; this.clearPStatus(p, d); this.endAva(id, "");
      this.autoStop(id, "cả đội đã gục."); // tự săn (mục 5.13)
      this.log(id, `${name} đã gục, cả đội đều đã gục. Đang trở về doanh trại… (không mất kinh nghiệm hay đồ)`, "#ff8a8a");
      c?.send("ko", { fallen: fallen.vohon, next: null });
      this.sendSquad(id, true);
    }
  }

  /** Hồi các võ hồn đã gục, đầy sinh lực. */
  revive(id: string, rows: number[], where: string) {
    const d = this.pdata.get(id)!;
    for (const r of rows) { d.down.delete(r); d.benchHp.delete(r); }
    const names = rows.map((r) => VOHON[Math.max(0, vohonIndex(d.owned.find((v) => v.rowId === r)?.vohon ?? ""))].name);
    this.log(id, `${names.join(", ")} đã hồi phục ${where}, đổi vào trận được rồi.`, "#86e0b0");
    this.sendSquad(id, true);
  }

  // ---------- Chiến đấu ----------
  attack(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.atkCd > 0 || d.travelling || this.pctl(d).noAtk) return; // Choáng: không đánh
    // Bộ hồn hạch Linh Miêu 4 món (5.2): đang tăng tốc đánh thì hồi chiêu đánh thường ngắn lại.
    d.atkCd = ATTACK_CD / (1 + (d.haste > 0 ? d.coreFx.haste ?? 0 : 0));
    if (this.map.inSafe(p.x, p.y)) { d.atkCd = 1; return this.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c"); }
    this.unhide(p, d);
    const ax = p.x + d.dir.x * ATTACK_REACH.fwd, ay = p.y - 6 + d.dir.y * ATTACK_REACH.fwd;
    this.broadcast("fx", { k: "slash", id, dx: d.dir.x, dy: d.dir.y, col: VOHON[p.vh].col });
    const hit: Hit = { kind: "attack", done: false };
    const near = this.beastsNear(ax, ay, ATTACK_REACH.r + BEAST_HALF).filter(([, b]) => Math.hypot(b.x - ax, b.y - TIERS[b.tier].size / 2 - ay) < ATTACK_REACH.r + TIERS[b.tier].size / 2);
    // Đối thủ trong Đại Đấu Hồn Trường (7.2): tâm thân hồn sư cao hơn chân ARENA.body pixel.
    const foes = this.foesOf(id).filter((f) => { const q = this.state.players.get(f); return q && !q.dead && Math.hypot(q.x - ax, q.y - ARENA.body - ay) < 18 + ARENA.body; });
    // Bộ Hạo Thiên 4 món (5.2): đòn thường trúng thứ comboN liên tiếp (cách nhau không quá comboGap giây) thêm sát thương; trượt thì đếm lại.
    let mult = 1;
    if (d.coreFx.combo) {
      d.combo = near.length || foes.length ? (d.comboT <= CORE_FX_RULE.comboGap ? d.combo + 1 : 1) : 0; d.comboT = 0;
      if (d.combo >= CORE_FX_RULE.comboN) { d.combo = 0; mult += d.coreFx.combo; this.broadcast("fx", { k: "combo", id, col: CORE_SETS[coreSetIndex("hao_thien")].col }); }
    }
    const atk = this.atkOf(d); // một lần tung vũ khí cho cả đòn
    for (const [bid] of near) this.damageBeast(bid, atk * mult * atkRoll(Math.random()), id, VOHON[p.vh].col, hit);
    for (const f of foes) this.damageFoe(f, atk * mult * atkRoll(Math.random()), id, VOHON[p.vh].col, hit);
  }

  /** Độ lớn hiệu ứng có lợi `b` đang có trên hồn sư (0 = không có), cộng cả bị động hồn cốt cùng tên (4.3) của võ hồn ra trận. */
  buffV(d: PData, b: BuffId) {
    const resonance = b === "def" ? (d.res.bonus.def ?? 0) / 100 : 0;
    // Giảm sát thương: bị động hồn cốt cộng giảm của trang bị dưới cùng một trần BONE_PASSIVE_CAP.def (mục 5.15).
    const passive = b === "def" ? equipDefTotal(d.passive.buff.def ?? 0, d.gearSt.red) : d.passive.buff[b as PassiveBuff] ?? 0;
    return resonance + (d.buffs.get(b)?.v ?? 0) + passive + (d.ava ? d.ava.stats[b as ChanThanStat] ?? 0 : 0); // + cộng minh Sao võ hồn và Chân Thân (8.1a)
  }
  /** Công hiện tại của võ hồn ra trận, tính cả hiệu ứng tăng công. */
  atkOf(d: PData, bond = true, weapon: "roll" | "mid" | "none" = "roll") {
    // Công vũ khí (5.15) cộng vào công một đòn trước hệ số: "roll" = đòn trực tiếp (tung trong [min, max], may mắn), "mid" = công giữa (sát thương theo thời gian, hiển thị), "none" = không (dung hợp).
    const w = d.gearSt.weapon, add = !w || weapon === "none" ? 0 : weapon === "mid" ? (w.min + w.max) / 2 : equipWeaponRoll(w, d.gearSt.luck, Math.random);
    return (d.atk + add) * (1 + this.buffV(d, "atk") + (bond ? this.bondV(d, "atk") : 0));
  } // + ràng buộc Thất Bảo Lưu Ly Tông (9.4); dung hợp kỹ không nhận (#192)
  /** Chỉ số võ hồn ra trận cho công thức tự đánh (offlineFight): ủy thác offline và trần tốc độ tự săn (AUTO_PACE). */
  offlinePower(d: PData, p: PlayerState): OfflinePower { return { atk: this.atkOf(d, true, "mid"), crit: d.crit, critMult: d.critMult, maxHp: p.maxHp, def: VOHON[p.vh].def }; }
  /** Đồng bộ PlayerState.buff (bit theo BUFF_IDS) để mọi người thấy hào quang. */
  syncBuffs(p: PlayerState, d: PData) { let m = 0; for (const b of d.buffs.keys()) m |= buffBit(b); p.buff = m; }
  /**
   * Ràng buộc (BONDS, 2.5d, đủ bảng ở 9.4): tổng hiệu ứng `k` của các cặp võ hồn cùng trong đội của hồn sư (ô bất kỳ, kể cả đang
   * gục), võ hồn nào ra trận cũng hưởng; cùng loại từ nhiều cặp thì cộng.
   */
  bondV(d: PData, k: BondKey) {
    return bondSum(d.team.map((r) => d.owned.find((v) => v.rowId === r)?.vohon ?? ""), k);
  }
  /** Hệ số hồi máu và khiên do hồn sư tạo: bộ hồn hạch Lưu Ly 2 món (5.2) + ràng buộc Lam Ngân Hoàng (9.4), cộng nhau. */
  healMult(d: PData) { return 1 + (d.coreFx.heal ?? 0) + this.bondV(d, "heal"); }
  /** Đánh thường, tung hồn kỹ hoặc tiên cơ thì hết tàng hình (Yêu Hồ, 2.5c); từ 2026-10-20 bị đòn trực tiếp đánh trúng cũng hết (hurtPlayer). */
  unhide(p: PlayerState, d: PData) { if (d.buffs.delete("hide")) this.syncBuffs(p, d); }

  /** Hồn thú gần hồn sư nhất trong bán kính r. */
  nearestBeast(p: PlayerState, r: number) {
    let best: string | undefined, bd = r;
    for (const [bid, b] of this.beastsNear(p.x, p.y, r)) { const dd = Math.hypot(b.x - p.x, b.y - p.y); if (dd < bd) { bd = dd; best = bid; } }
    return best;
  }

  /** Hồn thú còn ít sinh lực nhất (theo tỉ lệ) trong bán kính r; bằng nhau thì con gần hơn (Nguyệt Nhận khóa mục tiêu yếu máu). */
  weakestBeast(p: PlayerState, r: number) {
    let best: string | undefined, bf = 2, bd = r;
    for (const [bid, b] of this.beastsNear(p.x, p.y, r)) {
      const dd = Math.hypot(b.x - p.x, b.y - p.y), f = b.hp / Math.max(1, b.maxHp);
      if (dd < r && (f < bf - 1e-6 || (Math.abs(f - bf) <= 1e-6 && dd < bd))) { bf = f; bd = dd; best = bid; }
    }
    return best;
  }

  /** Lướt theo d.dir tối đa `dist` pixel, dừng khi vướng vật cản. Trả về quãng đã lướt. */
  dashStep(p: PlayerState, d: PData, dist: number) {
    let moved = 0;
    while (moved < dist && !this.map.hits(p.x + d.dir.x * 2, p.y + d.dir.y * 2, 5, 4)) { p.x += d.dir.x * 2; p.y += d.dir.y * 2; moved += 2; }
    return moved;
  }

  /** Quay mặt về mục tiêu `b` (hồn thú, hoặc đối thủ ở 7.2) cỡ `size` pixel rồi lướt tới sát nó (tối đa `dist`). */
  dashTo(p: PlayerState, d: PData, b: { x: number; y: number }, dist: number, size: number) {
    const dd = Math.max(1, Math.hypot(b.x - p.x, b.y - p.y));
    d.dir = { x: (b.x - p.x) / dd, y: (b.y - p.y) / dd }; p.dir = dir4(d.dir.x, d.dir.y);
    return this.dashStep(p, d, Math.min(dist, Math.max(0, dd - size / 2 - 8)));
  }

  /** Kéo hồn thú về sát hồn sư (gom quái), từng bước nhỏ để không xuyên vật cản. */
  pullBeast(bid: string, p: PlayerState) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid); if (!b || !bd || bd.rooted) return; // thú thực vật cắm rễ (#116)
    const hw = Math.max(3, TIERS[b.tier].size / 3);
    for (let k = 0; k < 40; k++) {
      const dx = p.x - b.x, dy = p.y - b.y, dd = Math.hypot(dx, dy), stop = TIERS[b.tier].size / 2 + 8;
      if (dd <= stop) break;
      const s = Math.min(4, dd - stop), x0 = b.x, y0 = b.y;
      this.moveBeast(b, (dx / dd) * s, (dy / dd) * s, hw); // không kéo vào vùng an toàn
      if (b.x === x0 && b.y === y0) break;
    }
    bd.kx = 0; bd.ky = 0;
  }

  /**
   * Đẩy lùi hồn thú ra xa hồn sư `dist` pixel (nhân CC_TIER_MULT theo bậc), từng bước nhỏ để không xuyên vật cản. Hồn thú đang
   * Choáng / Trói và thú thực vật đứng yên (#116) không bị đẩy (mục 5.1), và không bị đẩy vào vùng an toàn (moveBeast).
   */
  pushBeast(bid: string, p: PlayerState, dist: number) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid); if (!b || !bd || bd.st.has("stun") || bd.st.has("root") || bd.rooted) return;
    const hw = Math.max(3, TIERS[b.tier].size / 3), dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1;
    let left = dist * (CC_TIER_MULT[b.tier] ?? 1);
    while (left > 0) {
      const s = Math.min(4, left), x0 = b.x, y0 = b.y;
      this.moveBeast(b, (dx / dd) * s, (dy / dd) * s, hw); left -= s;
      if (b.x === x0 && b.y === y0) break;
    }
  }

  /** Hẹn chạy `fn` sau `t` giây (trong tick). */
  later(t: number, fn: () => void) { this.timers.push({ t, fn }); }

  /** Hồi sinh lực theo tỉ lệ cho võ hồn ra trận và mọi võ hồn chưa gục trong đội (Hộ Thể, Vô Địch Thần Quang). */
  healTeam(id: string, frac: number) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    d.hpF = Math.min(p.maxHp, d.hpF + p.maxHp * frac); p.hp = Math.ceil(d.hpF);
    for (const r of d.team) {
      const v = d.owned.find((o) => o.rowId === r);
      if (!v || v === d.ch || d.down.has(r) || !d.benchHp.has(r)) continue;
      const max = this.maxHpOf(d, v), hp = d.benchHp.get(r)! + max * frac;
      if (hp >= max) d.benchHp.delete(r); else d.benchHp.set(r, hp);
    }
  }

  /**
   * Hiệu ứng lên bản thân của hồn kỹ (SkillDef.self): hiệu ứng có lợi, hồi sinh lực cả đội, khiên, hồi hồn lực; nhân `bpow`.
   * `share` (9.1): mã võ hồn gốc của hồn kỹ khi được lan cho đồng đội tổ đội đứng gần (partyShare); bỏ trống thì chỉ lên chính mình.
   */
  selfEffect(id: string, e: NonNullable<SkillDef["self"]>, bpow: number, col: string, share?: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, secs = e.secs ?? 5;
    for (const [b, v] of Object.entries(e.buff ?? {}) as [BuffId, number][]) {
      const cur = d.buffs.get(b), val = b === "inv" || b === "hide" ? 1 : v * bpow;
      d.buffs.set(b, { t: Math.max(cur?.t ?? 0, secs), v: Math.max(cur?.v ?? 0, val) });
    }
    this.syncBuffs(p, d);
    const hm = this.healMult(d); // bộ hồn hạch Lưu Ly 2 món (5.2), ràng buộc Lam Ngân Hoàng (9.4): hồi máu và khiên mạnh thêm
    if (e.heal) this.healTeam(id, e.heal * bpow * hm);
    if (e.shield) { d.shield = Math.max(d.shield, Math.round(p.maxHp * e.shield * bpow * hm)); d.shieldT = Math.max(d.shieldT, secs); p.shield = d.shield; }
    if (e.mp) { d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * e.mp * bpow); p.mp = Math.floor(d.mpF); }
    if (e.cleanse) this.clearPStatus(p, d); // giải khống chế (Xúc Xích, từ 3.5)
    this.broadcast("fx", { k: "buff", id, col });
    if (share) this.partyShare(id, e, bpow, hm, col, share);
  }

  /**
   * Mã võ hồn gốc `src` để lan hiệu ứng lên bản thân cho tổ đội (9.1) nếu võ hồn đang ra trận của người tung thuộc hệ Phụ trợ,
   * không thì undefined (không lan). `src` khác võ hồn ra trận khi Phục Chế chép hồn kỹ của võ hồn khác.
   */
  shareOf(p: PlayerState, src: string) { return VOHON[p.vh].he === "phu_tro" ? src : undefined; }

  /**
   * Đồng đội nhận hiệu ứng phụ trợ của `id` (9.1): thành viên tổ đội cùng phòng (cùng bản đồ, cùng kênh), chưa gục cả đội, không đang
   * đi cổng / chuyển bản đồ, không đứng trong vùng an toàn, cách người tung dưới PARTY_BUFF_R pixel. Không gồm chính người tung.
   */
  partyBuffNear(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id), pid = d ? party.partyIdOf(d.accountId) : 0, out: string[] = [];
    if (!p || !pid) return out;
    for (const [qid, o] of this.pdata) {
      const q = this.state.players.get(qid);
      if (qid === id || !q || q.dead || o.travelling || o.travelCast || party.partyIdOf(o.accountId) !== pid) continue;
      if (Math.hypot(q.x - p.x, q.y - p.y) < PARTY_BUFF_R && !this.map.inSafe(q.x, q.y)) out.push(qid);
    }
    return out;
  }

  /**
   * Lan hiệu ứng lên bản thân `e` của người tung `id` cho đồng đội đứng gần (9.1), mức × PARTY_BUFF_MULT: hiệu ứng có lợi (trừ
   * PARTY_BUFF_SKIP; tàng hình chỉ khi võ hồn gốc `src` là Phụ trợ), hồi sinh lực và khiên theo sinh lực tối đa của võ hồn đang ra trận
   * của đồng đội (`hm`: hệ số hồi máu / khiên của người tung), hồn lực. Cùng hiệu ứng thì lấy mức mạnh hơn và thời gian dài hơn.
   * Thanh tẩy lan tới đồng đội hợp lệ nhưng không nhân hệ số. Đồng đội thấy số hồi / khiên trên đầu và một dòng "<tên> … cho bạn".
   */
  partyShare(id: string, e: NonNullable<SkillDef["self"]>, bpow: number, hm: number, col: string, src: string) {
    const p = this.state.players.get(id); if (!p) return;
    const secs = e.secs ?? 5, m = PARTY_BUFF_MULT, hideOk = VOHON[Math.max(0, vohonIndex(src))].he === "phu_tro";
    const buffs = (Object.entries(e.buff ?? {}) as [BuffId, number][]).filter(([b]) => !PARTY_BUFF_SKIP.includes(b) && (b !== "hide" || hideOk));
    for (const qid of this.partyBuffNear(id)) {
      const q = this.state.players.get(qid)!, o = this.pdata.get(qid)!, said: string[] = [];
      for (const [b, v] of buffs) {
        const cur = o.buffs.get(b), val = b === "inv" || b === "hide" ? 1 : v * bpow * m;
        o.buffs.set(b, { t: Math.max(cur?.t ?? 0, secs), v: Math.max(cur?.v ?? 0, val) });
        said.push(BUFFS[b].name.toLowerCase());
      }
      if (buffs.length) { this.syncBuffs(q, o); this.broadcast("fx", { k: "buff", id: qid, col, ally: true }); }
      let sup = 0; // 9.2: sinh lực hồi thực + khiên tạo thêm cho đồng đội, tính đóng góp boss của người tung
      if (e.heal) {
        const add = Math.min(q.maxHp - o.hpF, q.maxHp * e.heal * bpow * hm * m);
        if (add > 0) {
          o.hpF += add; q.hp = Math.ceil(o.hpF); sup += add; said.push(`hồi ${Math.round(add)} sinh lực`);
          this.broadcast("dmg", { x: q.x, y: q.y - 18, v: Math.round(add), c: "#7dff8a", heal: true, to: qid });
        }
      }
      if (e.shield) {
        const sh = Math.round(q.maxHp * e.shield * bpow * hm * m), gain = sh - o.shield;
        o.shield = Math.max(o.shield, sh); o.shieldT = Math.max(o.shieldT, secs); q.shield = o.shield;
        if (gain > 0) { sup += gain; said.push(`tạo khiên ${gain}`); this.broadcast("dmg", { x: q.x, y: q.y - 26, v: gain, c: "#9ad8ff", shield: true, to: qid }); }
      }
      if (e.mp) {
        const add = Math.min(q.maxMp - o.mpF, q.maxMp * e.mp * bpow * m);
        if (add > 0) { o.mpF += add; q.mp = Math.floor(o.mpF); said.push(`hồi ${Math.round(add)} hồn lực`); }
      }
      if (e.cleanse) {
        const hadStatus = o.st.size > 0;
        this.clearPStatus(q, o);
        if (hadStatus) said.push("thanh tẩy");
      }
      if (said.length) this.log(qid, `${p.name} ${said.join(", ")} cho bạn.`, col);
      if (sup > 0) this.supportCredit(id, qid, sup);
    }
  }

  /**
   * Đóng góp hỗ trợ (9.2, mục 5.4): `id` vừa hồi thực / tạo thêm khiên `v` cho người khác `qid`. Mỗi tinh anh / thú vương / boss thế
   * giới đang giao chiến mà `qid` đang là người tham gia thì cộng `v` vào `supBy` của `id`, và `id` thành người tham gia (mục 5.4 "Người
   * tham gia", điều kiện 2; máu tăng theo số người, giữ tỉ lệ). Hồi / khiên cho chính mình không bao giờ tới đây (chống tự buff lấy rương).
   */
  supportCredit(id: string, qid: string, v: number) {
    const pd = this.pdata.get(id);
    if (id === qid || v <= 0 || !pd || pd.travelling) return;
    for (const [bid, bd] of this.bdata) {
      const e = bd.elite, b = this.state.beasts.get(bid);
      if (!e || !b || b.hp <= 0 || !e.engaged || !e.parts.has(qid)) continue;
      this.credit(e, "supBy", id, v);
      this.joinFight(e, id); this.eliteScale(b, e);
    }
  }

  /** Cộng `v` vào đóng góp `kind` của `pid` và ghi tài khoản của phiên (#119, `EliteData.acc`). */
  credit(e: EliteData, kind: "dmgBy" | "supBy", pid: string, v: number) {
    e[kind].set(pid, (e[kind].get(pid) ?? 0) + v);
    const d = this.pdata.get(pid); if (d) e.acc.set(pid, d.accountId);
  }

  /**
   * Đóng góp theo tài khoản (mục 5.4, #119): tài khoản `acc` vừa vào phòng với phiên `sid`; mọi tinh anh / thú vương / boss thế giới
   * còn giữ đóng góp của phiên cũ cùng tài khoản (thoát rồi vào lại, đổi kênh rồi quay về khi boss chưa bỏ giao chiến) thì chuyển đóng
   * góp và lần nhắc hết lượt sang phiên mới. Không thành người tham gia lại: phải đánh / hỗ trợ lại như người vào giữa trận.
   */
  rebindContrib(sid: string, acc: number) {
    for (const bd of this.bdata.values()) {
      const e = bd.elite; if (!e) continue;
      for (const [old, a] of [...e.acc]) {
        if (a !== acc || old === sid) continue;
        for (const m of [e.dmgBy, e.supBy]) { const v = m.get(old); m.delete(old); if (v !== undefined) m.set(sid, (m.get(sid) ?? 0) + v); }
        e.acc.delete(old); e.acc.set(sid, acc);
        if (e.king?.noted.delete(old)) e.king.noted.add(sid);
      }
    }
  }

  /** Đóng góp tổng của `pid` lên tinh anh / thú vương (9.2): sát thương + hỗ trợ × SUPPORT_CONTRIB. */
  contribOf(e: EliteData, pid: string) { return (e.dmgBy.get(pid) ?? 0) + (e.supBy.get(pid) ?? 0) * SUPPORT_CONTRIB; }
  /** Mọi người có đóng góp (sát thương hoặc hỗ trợ) lên tinh anh / thú vương (9.2). */
  contributors(e: EliteData) { return [...new Set([...e.dmgBy.keys(), ...e.supBy.keys()])]; }
  /**
   * Người đóng góp nhiều nhất còn trong phòng (không thì `by`): ưu tiên hồn hoàn của tinh anh / thú vương theo đóng góp tổng;
   * `dmgOnly` (hồn hoàn đỏ boss thế giới, 9.2) chỉ xếp theo sát thương. `ok` (#119): chỉ xét người thỏa (tinh anh: chưa bị khóa nhận
   * thưởng); không ai thỏa thì null.
   */
  topContrib(e: EliteData, by: string, dmgOnly?: boolean): string;
  topContrib(e: EliteData, by: string, dmgOnly: boolean, ok: (pid: string) => boolean): string | null;
  topContrib(e: EliteData, by: string, dmgOnly = false, ok: (pid: string) => boolean = () => true) {
    const val = (pid: string) => (dmgOnly ? e.dmgBy.get(pid) ?? 0 : this.contribOf(e, pid));
    let owner: string | null = ok(by) ? by : null;
    for (const pid of dmgOnly ? e.dmgBy.keys() : this.contributors(e))
      if (this.state.players.has(pid) && ok(pid) && (owner === null || val(pid) > val(owner))) owner = pid;
    return owner;
  }

  /**
   * Bộ máy hồn kỹ theo dữ liệu (SkillDef trong shared/data.ts) cho hồn kỹ chung, hồn kỹ riêng và chiêu tiên cơ riêng.
   * `power`: sức mạnh (skillPower theo số năm hồn hoàn của vòng, hoặc tienCoDmgMult cho tiên cơ); `bpow`: hệ số hiệu ứng lên
   * bản thân (buffPower). `hit`: đòn tạo năng lượng tiên cơ (bỏ trống với tiên cơ). Vùng "target" không có mục tiêu thì
   * lướt theo hướng nhìn nếu có `dash` (người gọi đã kiểm tra trước với hồn kỹ thường). `share` (9.1): mã võ hồn gốc khi hiệu ứng lên
   * bản thân lan cho tổ đội (shareOf), bỏ trống thì không lan. `fus` (#192, Võ Hồn Dung Hợp Kỹ): vùng "around" đặt cố định ở `at`;
   * `atk` là công dùng thay công của `id` (cả sát thương theo thời gian); `pair` là đồng đội dung hợp: không nhận ràng buộc, đóng góp tinh
   * anh / thú vương / boss chia đôi.
   */
  runSkill(id: string, sk: SkillDef, power: number, bpow: number, col: string, hit?: Hit, share?: string, fus?: FusHit & { at: { x: number; y: number } }) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, atk = (fus ? fus.atk : this.atkOf(d)) * power, pair = fus?.pair;
    /** Một nhát trúng hồn thú `bid`: sát thương (kèm % sinh lực, theo tầng trạng thái) rồi gây trạng thái. */
    const strike = (bid: string, last: boolean) => {
      const b = this.state.beasts.get(bid), bd = this.bdata.get(bid); if (!b || !bd || b.hp <= 0) return;
      let dmg = atk * sk.dmg;
      if (sk.pctHp) dmg += Math.min(b.maxHp * sk.pctHp, atk * PCT_HP_CAP);
      if (sk.perStack) dmg += atk * sk.perStack.dmg * (bd.st.get(sk.perStack.s)?.n ?? 0);
      if (sk.lowHp) dmg *= 1 + sk.lowHp * (1 - b.hp / Math.max(1, b.maxHp)); // hạ mục tiêu yếu máu (Nguyệt Nhận)
      if (sk.vsSt && sk.vsSt.s.some((s) => bd.st.has(s))) dmg *= 1 + sk.vsSt.v; // mục tiêu đang có trạng thái (Băng Hỏa Lưỡng Nghi, #192)
      if (dmg > 0) this.damageBeast(bid, dmg, id, col, hit, { crit: sk.crit, lifesteal: sk.lifesteal, pair });
      if (!this.state.beasts.has(bid)) return;
      if (sk.dispel) this.dispelBeast(bid, id); // xóa buff địch (Thiên Càn Trấn Áp, BĐ4)
      if (sk.push) this.pushBeast(bid, p, sk.push);
      // Viêm bạo (Hỏa Long): kích nổ mọi tầng Thiêu đốt rồi đặt lại `keep` tầng. Từ 8.1b `boom.last`: chỉ nhát cuối kích nổ, `mult` nổ mạnh thêm.
      if (sk.boom && (!sk.boom.last || last)) {
        this.detonateBurn(bid, id, sk.boom.mult);
        if (sk.boom.keep > 0) this.applyStatus(bid, { s: "burn", n: sk.boom.keep }, id, power, fus);
      }
      for (const a of [...(sk.status ?? []), ...(last ? sk.finisher ?? [] : [])]) this.applyStatus(bid, a, id, power, fus);
    };
    /**
     * Một nhát trúng đối thủ `fid` (Đại Đấu Hồn Trường, 7.2): cùng công thức sát thương như lên hồn thú (damageFoe nhân ARENA.dmgMult),
     * trạng thái lên hồn sư qua applyPStatus (chỉ trạng thái có trong PLAYER_STATUS). Đẩy lùi, kéo, xóa buff, kích nổ chỉ áp lên hồn thú.
     */
    const strikeFoe = (fid: string, last: boolean) => {
      const f = this.state.players.get(fid), fd = this.pdata.get(fid); if (!f || !fd || f.dead) return;
      let dmg = atk * sk.dmg;
      if (sk.pctHp) dmg += Math.min(f.maxHp * sk.pctHp, atk * PCT_HP_CAP);
      if (sk.perStack) dmg += atk * sk.perStack.dmg * (fd.st.get(sk.perStack.s)?.n ?? 0);
      if (sk.lowHp) dmg *= 1 + sk.lowHp * (1 - f.hp / Math.max(1, f.maxHp));
      if (sk.vsSt && sk.vsSt.s.some((s) => fd.st.has(s))) dmg *= 1 + sk.vsSt.v;
      const landed = dmg > 0 ? this.damageFoe(fid, dmg, id, col, hit, { crit: sk.crit, lifesteal: sk.lifesteal }) : !this.buffV(fd, "inv");
      if (!landed) return;
      // Mê hoặc / Đóng băng trên hồn sư chỉ do hồn thú gây (PLAYER_STATUS_PVE, #116).
      for (const a of [...(sk.status ?? []), ...(last ? sk.finisher ?? [] : [])]) if (!PLAYER_STATUS_PVE.includes(a.s)) this.applyPStatus(fid, a, atk * ARENA.dmgMult, id);
    };
    const near = (r: number, x = p.x, y = p.y) => this.beastsNear(x, y, r).filter(([, b]) => Math.hypot(b.x - x, b.y - y) < r).map(([bid]) => bid);
    if (sk.fly) this.broadcast("fx", { k: "fly", id, t: sk.fly, col });
    if (sk.area === "around") {
      // `n` > 1: nhiều nhát quanh vị trí hiện tại của hồn sư cách nhau `every` giây (cánh hoa xoay); nhát cuối mới gây `finisher`.
      // Từ 2.5c: `at` đặt vùng cố định tại hồn thú gần nhất (bay tới nếu có `dash`), `fixed` cố định ở chỗ hồn sư đứng lúc tung.
      const n = sk.n ?? 1;
      let at: { x: number; y: number } | null = fus ? fus.at : sk.fixed ? { x: p.x, y: p.y } : null;
      if (sk.at && !fus) {
        // Không có hồn thú trong tầm thì đặt vào đối thủ gần nhất (7.2).
        const bid = this.nearestBeast(p, sk.at), b = bid ? this.state.beasts.get(bid) : undefined;
        const fid = b ? undefined : this.nearestFoe(id, sk.at), t = b ?? (fid ? this.state.players.get(fid) : undefined);
        const size = b ? TIERS[b.tier].size : ARENA.body * 2;
        if (t && sk.dash) { const x0 = p.x, y0 = p.y; if (this.dashTo(p, d, t, sk.dash, size) > 0) this.broadcast("fx", { k: "trail", x0, y0, x1: p.x, y1: p.y, col }); }
        at = t ? { x: t.x, y: t.y } : { x: p.x, y: p.y };
      }
      if (at && n > 1) this.broadcast("fx", { k: "zone", x: at.x, y: at.y - 4, r: sk.r, t: n * (sk.every ?? 0.15), col });
      for (let k = 0; k < n; k++) {
        const go = () => {
          const me = this.state.players.get(id); if (me !== p || me.dead) return;
          const cx = at?.x ?? p.x, cy = at?.y ?? p.y;
          this.broadcast("fx", { k: "wave", id, x: cx, y: cy - 6, r: sk.r, col, ...(sk.shake && k === 0 ? { shake: 0.5 } : {}) });
          const ids = near(sk.r, cx, cy), fids = this.foesNear(id, sk.r, cx, cy);
          // Từ 8.1c `shockR`: sét tìm mục tiêu Cảm điện ở xa hơn `r` (cả đối thủ đang Cảm điện); tia sét từ tâm vùng tới từng mục tiêu (fx zap).
          if (sk.shockR) {
            const far = near(sk.shockR, cx, cy).filter((bid) => !ids.includes(bid) && this.bdata.get(bid)?.st.has("shock"));
            const ffar = this.foesNear(id, sk.shockR, cx, cy).filter((fid) => !fids.includes(fid) && this.pdata.get(fid)?.st.has("shock"));
            const to = [...far.map((bid) => this.state.beasts.get(bid)!), ...ffar.map((fid) => this.state.players.get(fid)!)].map((t) => ({ x: Math.round(t.x), y: Math.round(t.y) }));
            if (to.length) this.broadcast("fx", { k: "zap", x: cx, y: cy - 6, to, col });
            ids.push(...far); fids.push(...ffar);
          }
          if (sk.pull) { this.broadcast("fx", { k: "pull", x: p.x, y: p.y - 4, r: sk.r, col }); for (const bid of ids) this.pullBeast(bid, p); }
          for (const bid of ids) strike(bid, k === n - 1);
          for (const fid of fids) strikeFoe(fid, k === n - 1);
        };
        if (k === 0) go(); else this.later(k * (sk.every ?? 0.15), go);
      }
    } else if (sk.area === "front") {
      this.broadcast("fx", { k: "arc", id, x: p.x, y: p.y - 6, dx: d.dir.x, dy: d.dir.y, r: sk.r, col });
      for (const [bid, b] of this.beastsNear(p.x, p.y, sk.r)) {
        const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1;
        if (dd < sk.r + TIERS[b.tier].size / 2 && (dx * d.dir.x + dy * d.dir.y) / dd > 0.2) strike(bid, true);
      }
      for (const fid of this.foesOf(id)) {
        const f = this.state.players.get(fid); if (!f) continue;
        const dx = f.x - p.x, dy = f.y - p.y, dd = Math.hypot(dx, dy) || 1;
        if (dd < sk.r + ARENA.body && (dx * d.dir.x + dy * d.dir.y) / dd > 0.2) strikeFoe(fid, true);
      }
    } else if (sk.area === "dash") {
      const sx = p.x, sy = p.y, dist = this.dashStep(p, d, sk.r);
      this.broadcast("fx", { k: "trail", x0: sx, y0: sy, x1: p.x, y1: p.y, col });
      const L = Math.max(1, dist), ux = (p.x - sx) / L, uy = (p.y - sy) / L;
      for (const [bid, b] of this.beastsNear((sx + p.x) / 2, (sy + p.y) / 2, L / 2 + 14)) {
        const bx = b.x - sx, by = b.y - sy, pr = Math.max(0, Math.min(L, bx * ux + by * uy));
        if (Math.hypot(bx - ux * pr, by - uy * pr) < 14 + TIERS[b.tier].size / 2) strike(bid, true);
      }
      for (const fid of this.foesOf(id)) {
        const f = this.state.players.get(fid); if (!f) continue;
        const bx = f.x - sx, by = f.y - sy, pr = Math.max(0, Math.min(L, bx * ux + by * uy));
        if (Math.hypot(bx - ux * pr, by - uy * pr) < 14 + ARENA.body) strikeFoe(fid, true);
      }
    } else if (sk.area === "proj") {
      const n = sk.n ?? 1, spread = (sk.spread ?? 0) * Math.PI / 180, ring = spread >= Math.PI * 2 - 1e-6, a0 = Math.atan2(d.dir.y, d.dir.x);
      for (let k = 0; k < n; k++) {
        const a = ring ? (k / n) * Math.PI * 2 : a0 + (n > 1 ? (k / (n - 1) - 0.5) * spread : 0);
        this.projs.push({ x: p.x, y: p.y - 8, vx: Math.cos(a) * PROJ_SPEED, vy: Math.sin(a) * PROJ_SPEED, life: sk.r / PROJ_SPEED, owner: id,
          fire: (bid) => strike(bid, true), foe: (fid) => strikeFoe(fid, true) });
      }
      this.broadcast("fx", ring ? { k: "burst", id, x: p.x, y: p.y - 8, col } : { k: "burst", id, x: p.x, y: p.y - 8, col, n, a0, spread, r: sk.r });
    } else if (sk.area === "target") {
      const bid = sk.pick === "low" ? this.weakestBeast(p, sk.r) : this.nearestBeast(p, sk.r), b = bid ? this.state.beasts.get(bid) : undefined;
      // Không có hồn thú trong tầm thì nhắm đối thủ gần nhất (Đại Đấu Hồn Trường, 7.2).
      const fid = b ? undefined : this.nearestFoe(id, sk.r), f = fid ? this.state.players.get(fid) : undefined;
      if (!b && !f) {
        if (sk.dash) { const x0 = p.x, y0 = p.y; this.dashStep(p, d, sk.dash); this.broadcast("fx", { k: "trail", x0, y0, x1: p.x, y1: p.y, col }); }
      } else {
        if (sk.dash) { const x0 = p.x, y0 = p.y; if (this.dashTo(p, d, (b ?? f)!, sk.dash, b ? TIERS[b.tier].size : ARENA.body * 2) > 0) this.broadcast("fx", { k: "trail", x0, y0, x1: p.x, y1: p.y, col }); }
        const n = sk.n ?? 1;
        for (let k = 0; k < n; k++) {
          const go = () => {
            const me = this.state.players.get(id); if (!me || me.dead) return;
            if (bid) {
              const t = this.state.beasts.get(bid); if (!t) return;
              this.broadcast("fx", { k: "claw", x: t.x, y: t.y - TIERS[t.tier].size / 2, col, i: k });
              strike(bid, k === n - 1);
            } else if (fid) {
              const t = this.state.players.get(fid); if (!t || t.dead) return;
              this.broadcast("fx", { k: "claw", x: t.x, y: t.y - ARENA.body, col, i: k });
              strikeFoe(fid, k === n - 1);
            }
          };
          if (k === 0) go(); else this.later(k * (sk.every ?? 0.15), go);
        }
      }
    }
    if (sk.self) this.selfEffect(id, sk.self, bpow, col, share);
    if (sk.inv) d.inv = Math.max(d.inv, sk.inv);
  }

  // ---------- Trạng thái dùng chung trên hồn thú (mục 5.1) ----------
  /**
   * Gây trạng thái `a` lên hồn thú `bid`, người gây `by`, sức mạnh hồn kỹ `power`. Cộng dồn tầng tới STATUS.max, thời gian lấy
   * phần còn lại dài hơn, độ lớn lấy giá trị mạnh hơn. Khống chế ngắn hơn với hồn thú bậc cao (CC_TIER_MULT).
   * `fus` (#192): gây bởi Võ Hồn Dung Hợp Kỹ: công `fus.atk` thay công của `by`, không nhận ràng buộc, sát thương theo thời gian chia
   * đôi đóng góp với đồng đội `fus.pair`.
   */
  applyStatus(bid: string, a: StatusApply, by: string, power = 1, fus?: FusHit) {
    const pair = fus?.pair;
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), pd = this.pdata.get(by), p = this.state.players.get(by);
    // Như damageBeast: đang chuyển bản đồ hoặc đứng trong vùng an toàn thì không gây trạng thái.
    if (!b || !bd || b.hp <= 0 || !pd || !p || pd.travelling || this.map.inSafe(p.x, p.y)) return;
    const def = STATUS[a.s], fx = pd.coreFx, w = bd.elite?.king?.world, cc = def.noMove || def.noAtk || def.noSkill || def.wander;
    // Thú vương đang gầm chuyển giai đoạn (BĐ5): không nhận khống chế.
    if (bd.elite?.king?.roar && cc) return;
    // Boss thế giới (BĐ6e): đang lặn thì không nhận gì; không nhận khống chế (bá thể), chỉ tính lần ngắt tích lực của võ hồn Khống chế.
    if (w && (w.dive > 0 || cc)) { if (cc && w.dive <= 0) this.worldBreak(bid, b, bd, w, by); return; }
    if (a.s === "allure" && bd.st.has("charm")) return; // đang Mê hoặc thì không cộng Mị hoặc (không khống chế nối liền)
    // Bộ hồn hạch Lam Ngân 2 món (5.2): khống chế do hồn sư gây kéo dài hơn.
    const secs = (a.secs ?? def.secs) * (def.noMove || def.noAtk ? CC_TIER_MULT[b.tier] ?? 1 : 1) * (isCcStatus(a.s) ? 1 + (fx.cc ?? 0) : 1);
    // Ràng buộc Tà Hỏa – Hỏa Ảnh (2.5d), bộ hồn hạch Phượng Hoàng / Xà Hoàng 2 món (5.2): Thiêu đốt / Trúng độc của hồn sư mạnh
    // thêm, tính lúc gây như tăng công.
    const amp = a.s === "burn" ? (pair ? 0 : this.bondV(pd, "burn")) + (fx.burn ?? 0) : a.s === "poison" ? fx.poison ?? 0 : 0;
    const v = def.dot ? (fus ? fus.atk : this.atkOf(pd, true, "mid")) * def.dot * power * (1 + amp) : def.amp;
    // Bộ Phượng Hoàng 4 món: Thiêu đốt của hồn sư thêm tầng tối đa (người khác gây tiếp không làm giảm số tầng đang có).
    const max = def.max + (a.s === "burn" ? fx.burnMax ?? 0 : 0);
    const cur = bd.st.get(a.s), n = a.n ?? 1;
    if (cur) { cur.n = Math.max(cur.n, Math.min(max, cur.n + n)); cur.t = Math.max(cur.t, secs); cur.v = Math.max(cur.v, v); cur.src = by; cur.pair = pair; }
    else bd.st.set(a.s, { t: secs, n: Math.min(max, n), v, src: by, pair });
    if (def.noMove) { bd.kx = 0; bd.ky = 0; }
    // Đủ tầng thì bùng phát (2.5c): Mị hoặc thành Mê hoặc, Phong ấn thành Dễ thương 6,8 giây; tầng về 0.
    if (def.burst && bd.st.get(a.s)!.n >= def.max) {
      bd.st.delete(a.s);
      this.applyStatus(bid, { s: def.burst.s, ...(def.burst.secs ? { secs: def.burst.secs } : {}) }, by, power, fus);
      if (STATUS[def.burst.s].wander) { bd.target = null; b.aggro = false; }
    }
    this.syncStatus(b, bd);
  }

  /** Đồng bộ trạng thái hồn thú cho client: bit theo STATUS_IDS và số tầng Thiêu đốt / Trúng độc / Phá giáp / Mị hoặc / Phong ấn. */
  syncStatus(b: BeastState, bd: BData) {
    let m = 0; for (const s of bd.st.keys()) m |= statusBit(s);
    b.st = m; b.burn = bd.st.get("burn")?.n ?? 0; b.poison = bd.st.get("poison")?.n ?? 0; b.armor = bd.st.get("armor")?.n ?? 0;
    b.allure = bd.st.get("allure")?.n ?? 0; b.lock = bd.st.get("lock")?.n ?? 0;
  }

  /**
   * Viêm bạo: kích nổ mọi tầng Thiêu đốt còn lại cùng lúc (sát thương còn lại × boom), xóa Thiêu đốt. Hỏa Long dùng (SkillDef.boom, 2.5b).
   * `by`: người kích nổ; bộ hồn hạch Phượng Hoàng 4 món của người đó (không có `by` thì của người gây Thiêu đốt) thêm sát thương (5.2).
   * `extra`: hồn kỹ nổ mạnh thêm (SkillDef.boom.mult, tuyệt kỹ Hỏa Long 8.1b), cộng với bộ hồn hạch.
   */
  detonateBurn(bid: string, by?: string, extra = 0) {
    const bd = this.bdata.get(bid), s = bd?.st.get("burn"); if (!bd || !s) return;
    bd.st.delete("burn"); this.syncStatus(this.state.beasts.get(bid)!, bd);
    const boom = 1 + (this.pdata.get(by ?? s.src)?.coreFx.boom ?? 0) + extra;
    this.damageBeast(bid, s.v * s.n * s.t * STATUS.burn.boom * boom, s.src, STATUS.burn.col, undefined, { direct: false, pair: s.pair });
  }

  /** Mỗi tick: trạng thái hết giờ thì bỏ; mỗi STATUS_TICK giây Thiêu đốt / Trúng độc gây sát thương (người gây đã rời thì bỏ). */
  tickStatus(bid: string, dt: number) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid); if (!b || !bd || !bd.st.size) return;
    bd.dotT += dt;
    const dots: [StatusId, SInst][] = [];
    if (bd.dotT >= STATUS_TICK) { bd.dotT -= STATUS_TICK; for (const [s, x] of bd.st) if (STATUS[s].dot) dots.push([s, { ...x }]); }
    let changed = false;
    for (const [s, x] of bd.st) { x.t -= dt; if (x.t <= 0) { bd.st.delete(s); changed = true; } }
    if (changed) this.syncStatus(b, bd);
    for (const [s, x] of dots) {
      if (!this.state.players.has(x.src)) { bd.st.delete(s); this.syncStatus(b, bd); continue; }
      if (!this.state.beasts.has(bid)) return;
      this.damageBeast(bid, x.v * x.n, x.src, STATUS[s].col, undefined, { direct: false, pair: x.pair });
    }
    if (!bd.st.size) bd.dotT = 0;
  }

  /**
   * Hồi sinh lực / hồn lực của hồn sư trong `dt` giây (mục 4, hpRegen / mpRegen); vùng an toàn hồi nhanh hơn (SAFE_REGEN_MULT).
   * Võ hồn khác trong đội (chưa gục) hồi sinh lực cùng nhịp với võ hồn ra trận. Trả về có đang ở vùng an toàn không.
   */
  regenPlayer(p: PlayerState, d: PData, dt: number): boolean {
    const safe = this.map.inSafe(p.x, p.y), regen = (max: number) => hpRegen(max, d.lastHit, safe) * dt;
    d.mpF = Math.min(p.maxMp, d.mpF + mpRegen(p.level, VOHON[p.vh].mp, safe) * dt);
    d.hpF = Math.min(p.maxHp, d.hpF + regen(p.maxHp));
    p.hp = Math.ceil(d.hpF); p.mp = Math.floor(d.mpF);
    for (const [r, hp] of d.benchHp) {
      const v = d.owned.find((o) => o.rowId === r), max = v ? this.maxHpOf(d, v) : 0;
      const nv = hp + regen(max);
      if (!v || nv >= max) d.benchHp.delete(r); else d.benchHp.set(r, nv);
    }
    return safe;
  }

  /** Hồn thú không mục tiêu, không bị đánh BEAST_REGEN.delay giây thì hồi máu; Trúng độc giảm hồi máu (healCut). */
  regenBeast(b: BeastState, bd: BData, dt: number, pct = BEAST_REGEN.pct) {
    if (b.hp >= b.maxHp || b.hp <= 0) { bd.regen = 0; return; }
    bd.regen += b.maxHp * pct * dt * (bd.st.has("poison") ? 1 - STATUS.poison.healCut : 1);
    const add = Math.floor(bd.regen); if (add > 0) { bd.regen -= add; b.hp = Math.min(b.maxHp, b.hp + add); }
  }

  // ---------- Chiêu có báo trước của hồn thú (mục 5.3, 5.4; bước 3.5) ----------
  /**
   * Hồn thú `bid` bắt đầu báo trước chiêu `s` nhắm hồn sư `pid`: khóa vùng (hướng vệt / nón, tâm vòng dưới chân mục tiêu) theo vị
   * trí lúc này, gửi `fx tele` (vùng và thời lượng) cho mọi người. Hồn thú đứng yên, không đánh thường cho tới khi tung.
   */
  beginCast(bid: string, b: BeastState, bd: BData, s: BData["skills"][number], pid: string, tgt: { x: number; y: number }) {
    const def = s.def, ang = Math.atan2(tgt.y - b.y, tgt.x - b.x);
    // Từ BĐ4 một chiêu có thể có nhiều vùng (teleZones); fx gửi vùng đầu như 3.5, các vùng còn lại trong `parts`.
    // Từ BĐ5 vòng rơi ngẫu nhiên (`scatter`, Độc Châm Vũ) do server tung.
    const teles = def.floor ? this.floorTeles() : teleZones(def, b.x, b.y, tgt.x, tgt.y, Math.random);
    // Chiêu toàn sàn né được (#118): vòng an toàn rải trong sàn, khóa cùng lúc với vùng.
    const safe = def.floor && def.safe ? floorSafeZones(this.map, { x: bd.hx, y: bd.hy }, def.safe.n, def.safe.r, Math.random) : undefined;
    // Hồn thú đổi dạng (#173): trạng thái theo dạng lúc này (đổi dạng giữa lúc báo trước không đổi chiêu đang tung).
    const status = def.forms && bd.elite ? def.forms[bd.elite.form] : undefined;
    bd.cast = { def, teles, t: def.warn, target: pid, safe, status }; this.casting.add(bid);
    s.cd = def.cd * (0.8 + Math.random() * 0.4) * (bd.elite?.king?.world?.rage ? WORLD.rageCd : 1); // boss thế giới nổi giận: hồi chiêu nhanh hơn
    b.cast = true; b.moving = false; if (Math.abs(Math.cos(ang)) > 0.1) b.face = Math.cos(ang) > 0 ? 1 : -1;
    this.broadcast("fx", { k: "tele", bid, name: def.name, ...teles[0], parts: teles.slice(1), t: def.warn, ...(safe ? { safe } : {}) });
  }

  /**
   * Vùng của chiêu toàn sàn (BeastSkillDef.floor, BĐ6e): một dải phủ đúng chữ nhật sàn đấu (object `boss`), nên teleHits trúng đúng
   * người đứng trong sàn và client vẽ như mọi vệt. Vòng an toàn (BeastSkillDef.safe, #118) ở `cast.safe`, chọn trong beginCast.
   */
  floorTeles(): Tele[] {
    const l = this.map.lair; if (!l) return [];
    return [{ shape: "line", x: l.x, y: l.y + l.h / 2, ang: 0, r: l.w, w: l.h, arc: 0 }];
  }

  /** Các chiêu đang báo trước của phòng (vùng đã khóa, giây còn lại, vòng an toàn): tự săn đọc để né (#218). */
  *activeCasts() {
    for (const bid of this.casting) { const c = this.bdata.get(bid)?.cast; if (c) yield c; else this.casting.delete(bid); }
  }

  /** Bỏ chiêu đang báo trước (hồn thú bị Choáng / Câm lặng / Mê hoặc: "ngắt chiêu"); client xóa vùng cảnh báo. */
  cancelCast(bid: string, b: BeastState, bd: BData) {
    if (!bd.cast) return;
    bd.cast = null; b.cast = false; bd.skT = Math.max(bd.skT, 1); b.brk = 0; b.chg = false;
    this.broadcast("fx", { k: "teleEnd", bid });
  }

  /**
   * Hết thời gian báo trước: tính trúng theo vị trí THẬT của mọi hồn sư lúc này (teleHits). Không trúng người đã gục, đang chuyển
   * bản đồ hay đứng trong vùng an toàn (mục 5.3), hay đứng trong vòng an toàn của chiêu toàn sàn (teleSafe, #118); hurtPlayer bỏ qua
   * người đang bất tử / miễn sát thương (khi đó cũng không dính trạng thái). Có `dash` thì hồn thú lao tới cuối vệt / tâm vòng (dừng
   * khi vướng, không vào vùng an toàn).
   */
  fireCast(bid: string, b: BeastState, bd: BData) {
    const c = bd.cast!, def = c.def, x0 = b.x, y0 = b.y, main = c.teles[Math.floor(c.teles.length / 2)], base = this.beastDmg(bd);
    bd.cast = null; b.cast = false; bd.skT = Math.max(bd.skT, 1.2); b.brk = 0; b.chg = false;
    // Tích lực không bị ngắt (BĐ6e): cả sàn trúng, báo cho cả phòng.
    if (c.charge) this.broadcast("boss", { k: "chargeHit", bid, name: def.name });
    const hit: string[] = [];
    this.state.players.forEach((p, pid) => {
      const d = this.pdata.get(pid);
      if (d && !p.dead && !d.travelling && !this.map.inSafe(p.x, p.y) && c.teles.some((t) => teleHits(t, p.x, p.y))
        && !c.safe?.some((t) => teleSafe(t, p.x, p.y))) hit.push(pid);
    });
    if (def.dash && !bd.rooted) {
      // Nhiều vùng (BĐ4): lao theo vùng giữa.
      const tx = def.shape === "line" ? main.x + Math.cos(main.ang) * def.r : main.x, ty = def.shape === "line" ? main.y + Math.sin(main.ang) * def.r : main.y;
      const hw = Math.max(3, TIERS[b.tier].size / 3), n = Math.ceil(Math.hypot(tx - b.x, ty - b.y) / 6);
      for (let k = 0; k < n; k++) this.moveBeast(b, (tx - x0) / n, (ty - y0) / n, hw);
    }
    this.broadcast("fx", { k: "teleHit", bid, name: def.name, ...c.teles[0], parts: c.teles.slice(1), hit, x0, y0, x1: b.x, y1: b.y, ...(c.safe ? { safe: c.safe } : {}) });
    for (const pid of hit) {
      const rooted = !!def.drain && !!this.pdata.get(pid)?.st.has("root"); // BĐ6b Hút Sinh: xét Trói trước khi chiêu gây trạng thái mới
      if (!this.hurtPlayer(pid, base * def.dmg * (0.9 + Math.random() * 0.2))) continue;
      for (const a of c.status ?? def.status ?? []) this.applyPStatus(pid, a, base);
      if (def.pull) this.pullPlayer(pid, b, def.pull);
      if (rooted && b.hp > 0) {
        const add = Math.min(b.maxHp - b.hp, Math.ceil(b.maxHp * def.drain!));
        if (add > 0) { b.hp += add; this.broadcast("dmg", { x: b.x, y: b.y - 10, v: add, c: "#7dff8a" }); } // số xanh: hồi máu
      }
    }
    if (def.eggs) this.eggs.lay(bid, b, def.eggs); // #162: đẻ bọc trứng, phá kịp thì không nở
    if (def.summon) this.summonPack(b, bd, def.summon, c.target);
    if (def.ground) this.grounds.add(bid, def.ground, c.teles, base); // #161: vũng / sương độc lưu lại
  }

  /** Kéo hồn sư `id` về phía hồn thú `b` tối đa `dist` pixel (Quấn Kéo, Lưỡi Quất; BĐ4): dừng khi vướng, sát hồn thú hoặc sắp vào vùng an toàn. */
  pullPlayer(id: string, b: BeastState, dist: number) {
    const p = this.state.players.get(id); if (!p) return;
    this.dragPlayer(id, b.x, b.y, Math.min(dist, Math.hypot(b.x - p.x, b.y - p.y) - TIERS[b.tier].size / 2 - 8));
  }

  /**
   * Kéo hồn sư `id` thẳng về phía (tx, ty) tối đa `dist` pixel, không quá điểm đó (bước tối đa 2 pixel): dừng khi vướng hoặc sắp vào vùng
   * an toàn; không kéo người đã gục / đang đi cổng / đang đứng trong vùng an toàn. Dùng cho chiêu có `pull` (pullPlayer) và xoáy nước
   * (GroundDef.pull, #174).
   */
  dragPlayer(id: string, tx: number, ty: number, dist: number) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || p.dead || d.travelling || this.map.inSafe(p.x, p.y)) return;
    const dd = Math.hypot(tx - p.x, ty - p.y), go = Math.min(dist, dd); if (go <= 0) return;
    const ux = (tx - p.x) / dd, uy = (ty - p.y) / dd;
    for (let moved = 0; moved < go; moved += 2) {
      const ox = p.x, oy = p.y, st = Math.min(2, go - moved);
      this.map.moveEnt(p, ux * st, uy * st, PLAYER_HW, PLAYER_HH);
      if (this.map.inSafe(p.x, p.y)) { p.x = ox; p.y = oy; break; }
      if (p.x === ox && p.y === oy) break;
    }
  }

  /**
   * Gọi bầy (Hú Bầy; BeastSkillDef.summon, BĐ4): thêm hồn thú loài `s.species` quanh thân tới khi đủ `s.n` con do hồn thú này gọi còn
   * sống. Hồn thú gọi ra thuộc vùng của người gọi (tính vào `count` của vùng, nên vùng không sinh thêm cho tới khi chúng bị hạ), tuổi tung
   * trong `years` của vùng, lao ngay vào mục tiêu của người gọi.
   */
  summonPack(b: BeastState, bd: BData, s: NonNullable<BeastSkillDef["summon"]>, target: string) {
    const sp = beastIndex(s.species), z = this.map.zones[bd.zone]; if (sp < 0 || !z) return;
    for (const m of bd.minions) if (!this.state.beasts.has(m)) bd.minions.delete(m);
    for (let tries = 0; bd.minions.size < s.n && tries < 20; tries++) {
      const a = Math.random() * Math.PI * 2, x = b.x + Math.cos(a) * 28, y = b.y + Math.sin(a) * 20;
      if (this.map.hits(x, y, 6, 4) || this.map.inSafe(x, y)) continue;
      // Thú vương gọi nhện con trẻ hơn (summon.years); hồn thú gọi ra là hồn thú thường nên không bao giờ đúng MAX_YEARS (mục 5.3).
      const yr = s.years ?? z.years, years = Math.min(MAX_YEARS - 1, yr ? rollYears(yr[0], yr[1], Math.random()) : b.years);
      const mid = this.addBeast(bd.zone, years, sp, x, y), mb = this.bdata.get(mid)!;
      if (this.state.players.has(target)) { mb.target = target; this.state.beasts.get(mid)!.aggro = true; mb.skT = TELE_FIRST[1]; }
      bd.minions.add(mid);
      this.broadcast("fx", { k: "wave", x, y, r: 14, col: b.rank ? BOSSES[b.species]?.aura : TIERS[b.tier].glow });
    }
  }

  /** Mỗi tick của hồn thú đang báo trước: Choáng / Câm lặng / Mê hoặc ngắt chiêu; hết giờ thì tung. */
  tickCast(bid: string, b: BeastState, bd: BData, dt: number, interrupt: boolean) {
    if (!bd.cast) return;
    if (interrupt) return this.cancelCast(bid, b, bd);
    if ((bd.cast.t -= dt) <= 0) this.fireCast(bid, b, bd);
  }

  // ---------- Trạng thái trên hồn sư (từ 3.5, PLAYER_STATUS) ----------
  /**
   * Gây trạng thái `a` lên hồn sư `id` (do chiêu báo trước, `base`: sát thương đòn thường của hồn thú, nhân `dot` thành sát thương
   * mỗi giây mỗi tầng). Cùng luật cộng tầng với hồn thú (applyStatus). Không gây cho người đã gục, đang chuyển bản đồ, trong vùng an toàn.
   * `src`: đối thủ gây (Đại Đấu Hồn Trường, #277; `base` đã × ARENA.dmgMult): khống chế × ARENA.ccMult sau kháng; Thiêu đốt / Trúng độc ×
   * ARENA_HE_DMG theo hệ người gây × (1 + bộ Phượng Hoàng / Xà Hoàng 2 món + ràng buộc Tà Hỏa – Hỏa Ảnh), tính một lần lúc gây; bộ
   * Phượng Hoàng 4 món thêm tầng Thiêu đốt tối đa; Trúng độc ghi người gây (Xà Hoàng 4 món, hurtPlayer).
   */
  applyPStatus(id: string, a: StatusApply, base: number, src?: string): void {
    const p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.travelling || this.map.inSafe(p.x, p.y) || !PLAYER_STATUS.includes(a.s)) return;
    // Kháng trạng thái của bị động hồn cốt (4.3): thời gian ngắn đi theo tỉ lệ.
    // Đóng băng / Mê hoặc (#116) dùng kháng Choáng khi bị động không ghi riêng (RESIST_AS).
    const res = d.passive.resist[a.s] ?? (RESIST_AS[a.s] ? d.passive.resist[RESIST_AS[a.s]!] ?? 0 : 0);
    const sd = src ? this.pdata.get(src) : undefined, sp = src ? this.state.players.get(src) : undefined, fx: CoreFx = sd?.coreFx ?? {};
    const def = STATUS[a.s], secs = (a.secs ?? def.secs) * (1 - res) * (sd && isCcStatus(a.s) ? ARENA.ccMult : 1);
    const amp = !sd ? 0 : a.s === "burn" ? this.bondV(sd, "burn") + (fx.burn ?? 0) : a.s === "poison" ? fx.poison ?? 0 : 0;
    const he = sp ? VOHON[sp.vh]?.he : undefined, pvp = he ? ARENA_HE_DMG[he] * (1 + amp) : 1;
    const v = def.dot ? base * def.dot * pvp : def.amp, max = def.max + (sd && a.s === "burn" ? fx.burnMax ?? 0 : 0), cur = d.st.get(a.s), n = a.n ?? 1;
    if (cur) { cur.n = Math.max(cur.n, Math.min(max, cur.n + n)); cur.t = Math.max(cur.t, secs); cur.v = Math.max(cur.v, v); if (src) cur.src = src; }
    else d.st.set(a.s, { t: secs, n: Math.min(max, n), v, src: src ?? "" });
    if (def.wander) d.charm = null; // Mê hoặc mới (#116): đi lung tung quanh chỗ đang đứng lúc trúng
    // Đủ tầng thì bùng phát (#163, tầng Hàn thành Đóng băng): bỏ trạng thái này, gây trạng thái `burst.s` (qua kháng như mọi lần gây).
    if (def.burst && d.st.get(a.s)!.n >= def.max) {
      d.st.delete(a.s); this.syncPStatus(p, d);
      return this.applyPStatus(id, { s: def.burst.s, secs: def.burst.secs }, base, src);
    }
    this.syncPStatus(p, d); // Trói / Choáng: tick bỏ qua input (giữ nguyên hướng phím, hết khống chế thì đi tiếp)
  }
  syncPStatus(p: PlayerState, d: PData) { let m = 0; for (const s of d.st.keys()) m |= statusBit(s); p.st = m; p.han = d.st.get("chill")?.n ?? 0; }
  clearPStatus(p: PlayerState, d: PData) { d.hanT = 0; if (d.st.size) { d.st.clear(); d.dotT = 0; d.charm = null; this.syncPStatus(p, d); } }
  /**
   * Khống chế đang có trên hồn sư: không đi (Choáng, Đóng băng, Trói), không đánh (Choáng, Đóng băng, Mê hoặc), không dùng hồn kỹ (thêm
   * Câm lặng), đi lung tung (Mê hoặc, #116), làm chậm.
   */
  pctl(d: PData) {
    let noMove = false, noAtk = false, noSkill = false, wander = false, slow = 0;
    for (const [s, x] of d.st) { const def = STATUS[s]; noMove ||= def.noMove; noAtk ||= def.noAtk; noSkill ||= def.noAtk || def.noSkill; wander ||= def.wander; slow += def.slow * x.n; }
    return { noMove, noAtk, noSkill, wander, slow: Math.min(SLOW_CAP, slow) };
  }
  /** Tên khống chế đang chặn hồn kỹ (`move`: đang chặn đi, cho đi cổng / truyền tống) của hồn sư, cho tin từ chối. */
  ccName(d: PData, move = false) {
    const order = move ? (["freeze", "stun", "charm", "root"] as const) : (["freeze", "stun", "charm", "silence"] as const);
    return STATUS[order.find((s) => d.st.has(s)) ?? order[order.length - 1]].name;
  }
  /**
   * Hồn sư đang Mê hoặc (#116, PLAYER_CHARM): hướng đi server tự chọn tới một điểm ngẫu nhiên quanh chỗ bị Mê hoặc, đổi điểm mỗi
   * `turn` giây; tới nơi thì đứng.
   */
  charmDir(p: PlayerState, d: PData, dt: number) {
    const c = d.charm ??= { ox: p.x, oy: p.y, tx: p.x, ty: p.y, t: 0 }, [t0, t1] = PLAYER_CHARM.turn;
    if ((c.t -= dt) <= 0) {
      c.t = t0 + Math.random() * (t1 - t0);
      c.tx = c.ox + (Math.random() * 2 - 1) * PLAYER_CHARM.r; c.ty = c.oy + (Math.random() * 2 - 1) * PLAYER_CHARM.r;
    }
    const dx = c.tx - p.x, dy = c.ty - p.y, dd = Math.hypot(dx, dy);
    return dd > 2 ? { x: dx / dd, y: dy / dd } : { x: 0, y: 0 };
  }
  /** Mỗi tick: vào vùng an toàn thì hết mọi trạng thái; hết giờ thì bỏ; mỗi STATUS_TICK giây Trúng độc / Thiêu đốt gây sát thương. */
  tickPStatus(id: string, p: PlayerState, d: PData, dt: number) {
    if (!d.st.size) return;
    if (this.map.inSafe(p.x, p.y)) return this.clearPStatus(p, d);
    d.dotT += dt;
    let dot = 0;
    if (d.dotT >= STATUS_TICK) { d.dotT -= STATUS_TICK; for (const [s, x] of d.st) if (STATUS[s].dot) dot += x.v * x.n; }
    let changed = false;
    for (const [s, x] of d.st) { x.t -= dt; if (x.t <= 0) { d.st.delete(s); changed = true; } }
    if (changed) this.syncPStatus(p, d);
    if (!d.st.size) d.dotT = 0;
    if (dot > 0) this.hurtPlayer(id, dot, { dot: true });
  }

  /**
   * Hồn kỹ ở ô `i` (U/I/O/P). Từ 8.1a mỗi ô mang hồn kỹ của một vòng do người chơi chọn (loadoutOf; mặc định vòng 1–4): vòng 1–4
   * là hồn kỹ riêng của võ hồn ra trận nếu có (VOHON_SKILLS), không thì 4 hồn kỹ dùng chung; vòng 5, 6, 8, 9, 10 từ VOHON_SKILLS_HIGH.
   * Hồn kỹ vòng r mở khi có hồn hoàn thứ r, mạnh theo số năm của hồn hoàn đó (skillPower, mục 5.2). Hồi chiêu theo ô (`p.cds[i]`).
   * Hồn kỹ đánh một mục tiêu mà không có hồn thú trong tầm thì không tung (không tốn hồn lực, không hồi chiêu).
   * Từ 9.6: đang Võ Hồn Chân Thân thì ô P (CHAN_THAN_SKILL_SLOT) tung hồn kỹ Chân Thân (ChanThanDef.skill) thay hồn kỹ đang mang ở ô
   * đó (kể cả ô trống), mạnh theo hồn hoàn vòng 7, hồi chiêu riêng `p.ctCd` (không đụng `p.cds` / skCd của hồn kỹ ô P cũ).
   */
  skill(c: Client, i: number) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.travelling || !(Number.isInteger(i) && i >= 0 && i < LOADOUT_SIZE)) return;
    if (this.map.inSafe(p.x, p.y)) return this.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c");
    const ct = i === CHAN_THAN_SKILL_SLOT && d.ava ? chanThanOf(d.ch.vohon)?.skill ?? null : null; // hồn kỹ Chân Thân (9.6)
    const r = ct ? CHAN_THAN_RING - 1 : loadoutOf(d.ch.vohon, d.ch.skills)[i];
    if (r < 0) return this.log(id, `Ô ${i + 1} chưa mang hồn kỹ: chọn ở bảng đội hình (V).`);
    if (r >= p.rings.length) return this.log(id, `Hồn kỹ vòng ${r + 1} cần hồn hoàn thứ ${r + 1}.`);
    if (ct ? p.ctCd > 0 : p.cds[i] > 0) return;
    if (this.pctl(d).noSkill) return this.log(id, `Đang bị ${this.ccName(d)}: không dùng được hồn kỹ.`, "#ffb35c");
    const set = skillsOf(VOHON[p.vh].id), sk = ct ?? ringSkill(d.ch.vohon, r)!, cost = sk.cost * (1 - Math.min(0.9, this.buffV(d, "mp")));
    // Phục Chế (Xúc Xích, 2.5c; 9.3): tung lại hồn kỹ gần nhất của võ hồn khác trong đội hoặc đồng đội tổ đội đứng gần; chưa có thì không tung.
    const src = sk.copy ? this.copySource(id) : null;
    if (sk.copy && !src) return this.log(id, `${sk.name}: chưa có hồn kỹ của võ hồn khác trong đội (chưa gục) hay đồng đội tổ đội đứng gần tung trong ${COPY_WINDOW} giây để sao chép.`);
    const run = src?.sk ?? sk;
    if (d.mpF < cost) return this.log(id, "Không đủ hồn lực.");
    const reach = run.area === "target" ? run.r : run.at;
    if (reach && !this.nearestBeast(p, reach) && !this.nearestFoe(id, reach)) return this.log(id, `${run.name}: không có ${this.foesOf(id).length ? "đối thủ" : "hồn thú"} trong tầm.`);
    // Sao võ hồn (9.5, mục 5.1): hồn kỹ vòng 1–4 mạnh hơn theo sao (starSkillMult), từ 4★ hồi chiêu ngắn hơn (starCdMult).
    const star = starRing(r) ? d.ch.stars : 1, cd = sk.cd * starCdMult(star);
    d.mpF -= cost;
    if (ct) p.ctCd = cd; else { p.cds[i] = cd; d.skCd.set(`${d.ch.rowId}:${r}`, cd); }
    this.unhide(p, d);
    const tier = p.rings[r], years = d.ringYears[r] ?? TIERS[tier].years;
    // i: vòng hồn hoàn của hồn kỹ, client làm sáng vòng đó và hiện tên hồn kỹ; `ct`: hồn kỹ Chân Thân (9.6, vòng 7)
    this.broadcast("fx", { k: "soulring", id, tier, i: r, vh: p.vh, ...(ct ? { ct: 1 } : {}) });
    if (sk.ult) this.broadcast("fx", { k: "ult", id, name: sk.name, col: TIERS[tier].glow }); // tuyệt kỹ vòng 10 (8.1a): ai cũng thấy
    if (src) this.log(id, `${sk.name}: sao chép ${run.name}${src.by ? ` của ${src.by}` : ""}.`, VOHON[p.vh].col);
    // Phục Chế nhân `copy` cả sát thương lẫn hiệu ứng lên bản thân (hồi máu, khiên, hồn lực, hiệu ứng có lợi; inv/hide giữ nguyên);
    // hệ số sao (9.5) cũng nhân cả hai, theo sao của võ hồn tung và vòng của ô (không theo hồn kỹ được sao chép).
    // Ràng buộc Song Sinh Võ Hồn (9.4): sức mạnh hồn kỹ ô U / I / O / P (mọi vòng) × (1 + bondV skill), như hệ số sao.
    const mult = (sk.copy ?? 1) * starSkillMult(star) * (1 + this.bondV(d, "skill")), hit: Hit = { kind: "skill", done: false };
    // Bộ hồn hạch Lam Ngân 4 món (5.2): hồn kỹ có gây khống chế, trúng ít nhất một hồn thú thì hồi hồn lực (một lần mỗi lần tung).
    const ccMp = d.coreFx.ccMp ?? 0;
    if (ccMp && [...(run.status ?? []), ...(run.finisher ?? [])].some((a) => isCcStatus(a.s))) hit.onHit = () => {
      const q = this.state.players.get(id); if (q !== p || p.dead) return;
      d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * ccMp); p.mp = Math.floor(d.mpF);
    };
    // 9.1: võ hồn Phụ trợ ra trận thì hiệu ứng lên bản thân lan cho tổ đội; Phục Chế lấy võ hồn gốc của hồn kỹ đã chép.
    const share = this.shareOf(p, src ? src.vh : d.ch.vohon);
    this.runSkill(id, run, skillPower(years) * mult, buffPower(years) * mult, run.glow ? TIERS[tier].glow : VOHON[p.vh].col, hit, share);
    // Tuyệt kỹ vòng 10 (8.1a) không ghi vào hồn kỹ gần nhất: Phục Chế (hồi 14 giây) không được sao chép tuyệt kỹ (hồi 45–50 giây).
    // Hồn kỹ Chân Thân (9.6) cũng không: là một phần của Chân Thân.
    if (!set.some((x) => x.copy) && !sk.ult && !ct) d.lastSkill = { sk, row: d.ch.rowId, vh: d.ch.vohon, t: Date.now() };
  }

  /**
   * Hồn kỹ Phục Chế của `id` chép (2.5c, 9.3): hồn kỹ gần nhất về thời gian, tung trong COPY_WINDOW giây, của võ hồn khác còn trong
   * đội của mình (chưa gục) hoặc của đồng đội tổ đội cùng phòng (chưa gục cả đội, không đi cổng, không phải đối thủ, võ hồn đã tung
   * còn trong đội và chưa gục) đứng cách dưới COPY_R pixel. `by`: tên đồng đội khi chép của tổ đội. Không có thì null.
   */
  copySource(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return null;
    const now = Date.now(), pid = party.partyIdOf(d.accountId), foes = this.foesOf(id);
    let best: { sk: SkillDef; vh: string; t: number; by?: string } | null = null;
    const pick = (o: PData, by?: string) => {
      const l = o.lastSkill;
      if (!l || now - l.t > COPY_WINDOW * 1000 || !o.team.includes(l.row) || o.down.has(l.row) || (!by && l.row === d.ch.rowId)) return;
      if (!best || l.t > best.t) best = { sk: l.sk, vh: l.vh, t: l.t, by };
    };
    pick(d);
    if (pid) for (const [qid, o] of this.pdata) {
      const q = this.state.players.get(qid);
      if (qid === id || !q || q.dead || o.travelling || o.travelCast || foes.includes(qid) || party.partyIdOf(o.accountId) !== pid) continue;
      if (Math.hypot(q.x - p.x, q.y - p.y) < COPY_R) pick(o, q.name);
    }
    return best as { sk: SkillDef; vh: string; t: number; by?: string } | null;
  }

  /**
   * Xếp 4 ô hồn kỹ mang theo của võ hồn `rowId` (8.1a, mục 5.2): mỗi ô là chỉ số vòng có hồn kỹ đã mở (ringSkill, vòng < số hồn hoàn)
   * hoặc -1 (trống), không trùng. Cùng luật với gắn hồn cốt (boneLock): ngoài giao chiến, không gục, không hấp thụ. Võ hồn đang ra
   * trận: hồi chiêu đi theo hồn kỹ, không theo ô: mỗi ô mới lấy hồi chiêu của chính hồn kỹ đó (ô cũ của nó trong `prev`, và PData.skCd),
   * không giữ hồi chiêu của hồn kỹ vừa rời ô; ô trống về 0. Nên đổi chỗ, bỏ ra rồi xếp lại không làm mới hồi chiêu, và hồn kỹ đang sẵn
   * sàng không bị khóa vì hồn kỹ khác. Sửa ô của võ hồn đang nghỉ: lúc võ hồn đó vào trận, carrySkillCds áp skCd. Lưu ngay qua chuỗi lưu.
   */
  setLoadout(c: Client, rowId: number, raw: unknown) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const deny = (text: string) => { this.log(id, text, "#ffb35c"); this.sendVohons(c); };
    const v = d.owned.find((x) => x.rowId === rowId);
    if (!v) return deny("Bạn không sở hữu võ hồn này.");
    const next = parseLoadout(raw);
    if (!next) return deny("Ô hồn kỹ không hợp lệ.");
    const vi = Math.max(0, vohonIndex(v.vohon)), name = VOHON[vi].name;
    for (const r of next) {
      if (r < 0) continue;
      if (!ringSkill(v.vohon, r)) return deny(r + 1 === CHAN_THAN_RING ? "Võ Hồn Chân Thân dùng phím riêng (R), không xếp vào ô hồn kỹ." : `${name} chưa có hồn kỹ vòng ${r + 1}.`);
      if (r >= v.rings.length) return deny(`${name} chưa có hồn hoàn thứ ${r + 1}.`);
    }
    const prev = loadoutOf(v.vohon, v.skills);
    if (next.every((r, i) => r === prev[i])) return this.sendVohons(c);
    const lock = this.boneLock(p, d, "hồn kỹ"); if (lock) return deny(lock.replace("gắn / tháo", "xếp ô"));
    v.skills = next;
    if (v === d.ch) {
      const old = [...p.cds];
      next.forEach((r, i) => { const from = prev.indexOf(r);
        p.cds[i] = r < 0 ? 0 : Math.max(from >= 0 ? old[from] : 0, d.skCd.get(`${v.rowId}:${r}`) ?? 0); });
    }
    this.chainLatest(d, `skills:${v.rowId}`, () => store.saveSkills(d.accountId, v.rowId, [...next])); // gửi dồn: ghi một lần, bản mới nhất
    const keys = ["U", "I", "O", "P"];
    this.log(id, `${name} mang theo: ${next.map((r, i) => `${keys[i]} ${r < 0 ? "trống" : ringSkill(v.vohon, r)!.name}`).join(", ")}.`, VOHON[vi].col);
    this.sendVohons(c);
  }

  // ---------- Võ Hồn Dung Hợp Kỹ (#192, mục 5.9; FUSION, FUSIONS) ----------
  /** Message `fusion {op}`: "start" (A mời đồng đội gần nhất hợp lệ), "join" (B hưởng ứng lời mời đang chờ). */
  fusionAction(id: string, op: string) {
    if (op === "start") this.fusionStart(id);
    else if (op === "join") this.fusionJoin(id);
  }

  /**
   * Lý do hồn sư `id` không tham gia dung hợp kỹ được lúc này ("" = được): bị chặn như hồn kỹ (gục, hấp thụ, đi cổng / truyền tống,
   * vùng an toàn, Choáng / Câm lặng…), còn hồi chiêu dung hợp, võ hồn ra trận thiếu hồn hoàn (FUSION.minRings), thiếu hồn lực.
   * Câu trả về ghép sau tên người ("bạn …" / "<tên> …").
   */
  fusionBlock(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || d.travelling) return "không còn ở bản đồ này";
    if (p.dead) return "đã gục";
    if (d.absorbing) return "đang hấp thụ hồn hoàn";
    if (d.travelCast) return "đang đi cổng / truyền tống";
    if (this.map.inSafe(p.x, p.y)) return "đang ở vùng an toàn";
    if (this.pctl(d).noSkill) return `đang bị ${this.ccName(d)}`;
    const cd = fusionCdLeft(d.accountId); if (cd > 0) return `còn hồi chiêu dung hợp ${Math.ceil(cd)} giây`;
    if (p.rings.length < FUSION.minRings) return `chỉ có ${p.rings.length} hồn hoàn trên ${VOHON[p.vh].name} (cần ${FUSION.minRings})`;
    if (d.mpF < FUSION.cost) return `không đủ hồn lực (cần ${FUSION.cost})`;
    return "";
  }

  /**
   * Lý do cặp A (`a`) – B (`b`) không dung hợp được ("" = được): võ hồn ra trận không ghép thành cặp `fi` của FUSIONS (fi < 0: cặp bất
   * kỳ), cách nhau từ FUSION.r trở lên, một trong hai bị chặn (fusionBlock). Câu trả về là cả câu, không có dấu chấm cuối.
   */
  fusionCheck(a: string, b: string, fi = -1) {
    const pa = this.state.players.get(a), da = this.pdata.get(a), pb = this.state.players.get(b), db = this.pdata.get(b);
    if (!pa || !da || !pb || !db) return "đồng đội đã rời bản đồ";
    const pid = party.partyIdOf(da.accountId);
    if (!pid || party.partyIdOf(db.accountId) !== pid) return `${pb.name} không còn cùng tổ đội`;
    const k = fusionIndex(da.ch.vohon, db.ch.vohon);
    if (k < 0 || (fi >= 0 && k !== fi)) return `${VOHON[pa.vh].name} và ${VOHON[pb.vh].name} của ${pb.name} không ghép thành cặp dung hợp`;
    const wa = this.fusionBlock(a); if (wa) return `${pa.name} ${wa}`;
    const wb = this.fusionBlock(b); if (wb) return `${pb.name} ${wb}`;
    const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
    if (dist >= FUSION.r) return `${pb.name} đứng xa (${Math.round(dist)} pixel, cần dưới ${FUSION.r})`;
    return "";
  }

  /**
   * A gửi `fusion {op: "start"}` (#192): server tìm đồng đội tổ đội cùng phòng gần nhất hợp lệ (fusionCheck, không đang có lời mời khác),
   * gửi B tin riêng `fusion {k: "ask"}` nhắc hưởng ứng trong FUSION.window giây, A nhận `fusion {k: "wait"}`. Không có ai thì báo lý do
   * của đồng đội gần nhất cầm võ hồn ghép cặp (không có thì báo cặp cần có). Cấm trong sân đấu (ArenaRoom BLOCKED; có đối thủ thì cũng từ chối).
   */
  fusionStart(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const say = (t: string) => this.log(id, `Dung hợp kỹ: ${t}.`, "#ffb35c");
    if (this.map.kind === "arena" || this.foesOf(id).length) return say("không dùng được ở Đại Đấu Hồn Trường");
    if (d.fus) return say(d.fus.init ? `đang chờ ${this.state.players.get(d.fus.with)?.name ?? "đồng đội"} hưởng ứng`
      : `${this.state.players.get(d.fus.with)?.name ?? "đồng đội"} đang mời bạn, hãy hưởng ứng`);
    const pairs = fusionsOf(d.ch.vohon);
    if (!pairs.length) return say(`${VOHON[p.vh].name} không có dung hợp kỹ`);
    const why = this.fusionBlock(id); if (why) return say(`bạn ${why}`);
    const pid = party.partyIdOf(d.accountId);
    if (!pid) return say("cần ở trong tổ đội với đồng đội cầm võ hồn ghép cặp");
    const mates = [...this.pdata].filter(([q, o]) => q !== id && party.partyIdOf(o.accountId) === pid && this.state.players.has(q)).map(([q]) => q);
    if (!mates.length) return say("không có đồng đội tổ đội nào cùng bản đồ, cùng kênh");
    const dist = (q: string) => { const t = this.state.players.get(q)!; return Math.hypot(t.x - p.x, t.y - p.y); };
    mates.sort((x, y) => dist(x) - dist(y));
    let first = "";
    for (const q of mates) {
      const o = this.pdata.get(q)!, fi = fusionIndex(d.ch.vohon, o.ch.vohon); if (fi < 0) continue;
      const w = o.fus ? `${this.state.players.get(q)!.name} đang chờ một dung hợp khác` : this.fusionCheck(id, q, fi);
      if (w) { first ||= w; continue; }
      const def = FUSIONS[fi], qn = this.state.players.get(q)!.name;
      d.fus = { with: q, t: FUSION.window, init: true, fi }; o.fus = { with: id, t: FUSION.window, init: false, fi };
      this.clients.getById(q)?.send("fusion", { k: "ask", by: p.name, i: fi, t: FUSION.window });
      this.clients.getById(id)?.send("fusion", { k: "wait", to: qn, i: fi, t: FUSION.window });
      this.log(q, `${p.name} mời Võ Hồn Dung Hợp Kỹ ${def.name} [G]: hưởng ứng trong ${FUSION.window} giây.`, VOHON[p.vh].col);
      this.log(id, `Dung hợp kỹ ${def.name}: chờ ${qn} hưởng ứng trong ${FUSION.window} giây.`, VOHON[p.vh].col);
      return;
    }
    say(first || `không đồng đội nào ra trận ${pairs.map((f) => VOHON[Math.max(0, vohonIndex(f.pair[0] === d.ch.vohon ? f.pair[1] : f.pair[0]))].name).join(" / ")} để ghép cặp với ${VOHON[p.vh].name}`);
  }

  /** B gửi `fusion {op: "join"}` (#192): kiểm lại cả hai (fusionCheck với đúng cặp đã mời); hợp lệ thì tung, không thì hủy không tốn gì. */
  fusionJoin(id: string) {
    const d = this.pdata.get(id), f = d?.fus; if (!d) return;
    if (!f || f.init) return this.log(id, "Dung hợp kỹ: chưa có lời mời dung hợp nào.", "#ffb35c");
    const why = this.fusionCheck(f.with, id, f.fi);
    if (why) return this.fusionCancel(id, `Dung hợp kỹ đã hủy: ${why} (không tốn gì).`);
    this.fusionFire(f.with, id, f.fi);
  }

  /** Hủy lời mời đang chờ của `id` và của đồng đội trong lời mời đó, báo cả hai `why`; không tốn gì. */
  fusionCancel(id: string, why: string) {
    const d = this.pdata.get(id), f = d?.fus; if (!d || !f) return;
    d.fus = null;
    const o = this.pdata.get(f.with); if (o?.fus?.with === id) o.fus = null;
    for (const q of [id, f.with]) { this.clients.getById(q)?.send("fusion", { k: "cancel" }); this.log(q, why, "#ffb35c"); }
  }

  /**
   * Tung dung hợp kỹ `fi` của A (`a`, người mời, là người gây đòn) và B (`b`): mỗi người tốn FUSION.cost hồn lực, vào hồi chiêu FUSION.cd
   * của hồn sư. Sức mạnh: công = trung bình công võ hồn ra trận hai người (kể cả tăng công, không ràng buộc) × skillPower theo hồn hoàn
   * năm cao nhất thấp hơn giữa hai võ hồn; không sao, không Phục Chế, không năng lượng tiên cơ (runSkill không có `hit`). Các phần nổ ở
   * điểm giữa hai người (phần có `side` dời về phía người cầm võ hồn đó); đóng góp chia đôi (DmgOpt.pair). `fx fusion` công khai.
   */
  fusionFire(a: string, b: string, fi: number) {
    const pa = this.state.players.get(a)!, da = this.pdata.get(a)!, pb = this.state.players.get(b)!, db = this.pdata.get(b)!, def = FUSIONS[fi];
    da.fus = null; db.fus = null;
    const now = Date.now(); for (const [k, t] of fusionReady) if (t <= now) fusionReady.delete(k); // dọn hồi chiêu đã hết của mọi tài khoản
    for (const [q, p, d] of [[a, pa, da], [b, pb, db]] as const) {
      d.mpF -= FUSION.cost; p.mp = Math.floor(d.mpF); fusionReady.set(d.accountId, Date.now() + FUSION.cd * 1000); this.unhide(p, d);
      void presenceBackend.putJson(fusionKey(d.accountId), fusionReady.get(d.accountId), FUSION.cd * 1000).catch((e) => console.error("Không lưu được hồi chiêu dung hợp trong presence", e));
      this.clients.getById(q)?.send("fusion", { k: "done", i: fi, cd: FUSION.cd });
    }
    const top = (d: PData) => Math.max(TIERS[0].years, ...d.ringYears), years = Math.min(top(da), top(db));
    const atk = (this.atkOf(da, false, "none") + this.atkOf(db, false, "none")) / 2, power = skillPower(years); // công trung bình, không ràng buộc
    const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }, col = TIERS[tierOfYears(years)].glow;
    // `va` / `vb`: võ hồn ra trận của A / B (màu luồng sáng, tiếng theo hệ ở client #193; người xem có thể không có A / B trong state, 11.4).
    this.broadcast("fx", { k: "fusion", id: a, to: b, x: Math.round(mid.x), y: Math.round(mid.y), i: fi, col, va: pa.vh, vb: pb.vh });
    for (const part of def.parts) {
      const h = part.side === undefined ? null : da.ch.vohon === def.pair[part.side] ? pa : pb;
      const at = h ? { x: (mid.x + h.x) / 2, y: (mid.y + h.y) / 2 } : mid;
      this.runSkill(a, part, power, 1, col, undefined, undefined, { at, pair: b, atk });
    }
    this.log(a, `Võ Hồn Dung Hợp Kỹ ${def.name} cùng ${pb.name}!`, col);
    this.log(b, `Võ Hồn Dung Hợp Kỹ ${def.name} cùng ${pa.name}!`, col);
    for (const q of [a, b]) this.questEvent(q, { k: "fusion" }); // #286: tính cho cả người mời lẫn người hưởng ứng
  }

  /** Trôi `dt` giây cho lời mời đang chờ (tick, hook `rest`): người mời hết giờ hoặc đồng đội đã rời thì hủy. */
  tickFusion(id: string, dt: number) {
    const d = this.pdata.get(id), f = d?.fus; if (!d || !f) return;
    if (!this.pdata.has(f.with)) return this.fusionCancel(id, "Dung hợp kỹ đã hủy: đồng đội đã rời bản đồ (không tốn gì).");
    if ((f.t -= dt) <= 0 && f.init) this.fusionCancel(id, `Dung hợp kỹ đã hủy: hết ${FUSION.window} giây chờ hưởng ứng (không tốn gì).`);
  }

  /**
   * Võ Hồn Chân Thân (vòng 7, 8.1a, mục 5.2): võ hồn ra trận có hồn hoàn thứ CHAN_THAN_RING và dữ liệu CHAN_THAN thì biến hình `secs`
   * giây: chỉ số cộng thêm (chanThanStats theo số năm vòng 7; atk / def / spd / crit / mp qua buffV, sinh lực tối đa trong recalc,
   * phần sinh lực tối đa tăng thêm được hồi luôn), tung `burst` ngay lúc biến hình. Tốn hồn lực, hồi chiêu riêng từng võ hồn.
   * Cùng luật chặn với hồn kỹ (gục, hấp thụ, đi cổng, vùng an toàn, Choáng / Câm lặng).
   */
  chanThan(c: Client) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.travelling) return;
    const def = chanThanOf(d.ch.vohon), name = VOHON[p.vh].name;
    if (!def) return this.log(id, `${name} chưa có Võ Hồn Chân Thân (bản sau).`);
    if (p.rings.length < CHAN_THAN_RING) return this.log(id, `Võ Hồn Chân Thân cần hồn hoàn thứ ${CHAN_THAN_RING}.`);
    if (d.ava) return this.log(id, `${def.name} còn ${Math.ceil(d.ava.t)} giây.`);
    if (this.map.inSafe(p.x, p.y)) return this.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c");
    if ((d.avaCd.get(d.ch.rowId) ?? 0) > 0) return;
    if (this.pctl(d).noSkill) return this.log(id, `Đang bị ${this.ccName(d)}: không biến hình được.`, "#ffb35c");
    const cost = def.cost * (1 - Math.min(0.9, this.buffV(d, "mp")));
    if (d.mpF < cost) return this.log(id, "Không đủ hồn lực.");
    d.mpF -= cost; p.mp = Math.floor(d.mpF);
    const ri = CHAN_THAN_RING - 1, tier = p.rings[ri], years = d.ringYears[ri] ?? TIERS[tier].years, col = VOHON[p.vh].col;
    d.avaCd.set(d.ch.rowId, def.cd); p.avaCd = def.cd;
    const hp0 = p.maxHp;
    d.ava = { row: d.ch.rowId, t: def.secs, stats: chanThanStats(def, years) }; p.ava = def.secs;
    this.unhide(p, d);
    this.recalc(id, false);
    d.hpF = Math.min(p.maxHp, d.hpF + Math.max(0, p.maxHp - hp0)); p.hp = Math.ceil(d.hpF);
    // av: chỉ cho client biết đây là biến hình Chân Thân (hiển thị), không phải tung hồn kỹ vòng 7 (G3, #394)
    this.broadcast("fx", { k: "soulring", id, tier, i: ri, vh: p.vh, av: 1 });
    this.broadcast("fx", { k: "avatar", id, name: def.name, col, on: true });
    if (def.burst) this.runSkill(id, def.burst, skillPower(years), buffPower(years), TIERS[tier].glow, { kind: "skill", done: false }, this.shareOf(p, d.ch.vohon));
    this.log(id, `${def.name}: ${def.secs} giây.`, col);
  }
  /** Ô hồn kỹ của võ hồn ra trận nhận ít nhất hồi chiêu còn lại của hồn kỹ đang ở ô đó (PData.skCd; xếp lại ô, đổi võ hồn). */
  carrySkillCds(p: PlayerState, d: PData) {
    loadoutOf(d.ch.vohon, d.ch.skills).forEach((r, i) => { if (r >= 0) p.cds[i] = Math.max(p.cds[i], d.skCd.get(`${d.ch.rowId}:${r}`) ?? 0); });
  }
  /** Hết Võ Hồn Chân Thân (hết giờ, đổi võ hồn, cả đội gục, đi cổng): bỏ chỉ số cộng thêm; `why` = "" thì không báo. */
  endAva(id: string, why: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d?.ava) return;
    d.ava = null; p.ava = 0;
    this.recalc(id, false);
    this.broadcast("fx", { k: "avatar", id, on: false });
    if (why) this.log(id, why, VOHON[p.vh].col);
  }
  /** Trôi `dt` giây cho Võ Hồn Chân Thân và hồi chiêu Chân Thân của từng võ hồn (tick, hook `rest`). */
  tickAva(id: string, dt: number) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    for (const [r, t] of d.avaCd) if (t - dt <= 0) d.avaCd.delete(r); else d.avaCd.set(r, t - dt);
    p.avaCd = d.avaCd.get(d.ch.rowId) ?? 0;
    if (d.ava) {
      d.ava.t -= dt; p.ava = Math.max(0, d.ava.t);
      if (d.ava.t <= 0) this.endAva(id, `${chanThanOf(d.ch.vohon)?.name ?? "Võ Hồn Chân Thân"} đã hết.`);
    }
  }

  /**
   * Kỹ năng chủ động của hồn cốt (mục 5.5, bước 4.3) ở nút `i` (BONE_ACTIVE_SLOTS: đầu, tay trái, tay phải) của võ hồn ĐANG RA TRẬN.
   * Kỹ năng theo loài hồn thú gốc (BONE_SKILLS), mạnh theo số năm hồn cốt (skillPower / buffPower như hồn kỹ), chạy bằng runSkill.
   * Mỗi nút một hồi chiêu riêng (`PlayerState.bcds`, thuộc hồn sư: đổi võ hồn không làm mới), tốn hồn lực. Cùng luật chặn với hồn kỹ:
   * gục, hấp thụ, đang chuyển bản đồ, vùng an toàn, Choáng / Câm lặng; kỹ năng đánh một mục tiêu mà không có hồn thú trong tầm thì
   * không tung (không tốn hồn lực, không hồi chiêu). Đang niệm đi cổng / truyền tống vẫn dùng được, không hủy niệm (mục 5.3, #270).
   */
  boneSkill(c: Client, i: number) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.travelling || !(Number.isInteger(i) && i >= 0 && i < BONE_ACTIVE_SLOTS.length)) return;
    const slot = BONE_SLOTS[boneSlotIndex(BONE_ACTIVE_SLOTS[i])];
    const bone = this.bonesOn(d, d.ch.rowId).find((b) => b.slot === slot.id);
    const k = bone ? boneSkillOf(bone.beast, bone.slot) : null;
    if (!bone || !k?.active) return this.log(id, `Ô ${slot.name} của ${VOHON[p.vh].name} chưa gắn hồn cốt có kỹ năng chủ động.`, "#ffb35c");
    if (this.map.inSafe(p.x, p.y)) return this.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c");
    if (p.bcds[i] > 0) return;
    if (this.pctl(d).noSkill) return this.log(id, `Đang bị ${this.ccName(d)}: không dùng được kỹ năng hồn cốt.`, "#ffb35c");
    const sk = k.sk, cost = sk.cost * (1 - Math.min(0.9, this.buffV(d, "mp")));
    if (d.mpF < cost) return this.log(id, "Không đủ hồn lực.");
    const reach = sk.area === "target" ? sk.r : sk.at;
    if (reach && !this.nearestBeast(p, reach) && !this.nearestFoe(id, reach)) return this.log(id, `${sk.name}: không có ${this.foesOf(id).length ? "đối thủ" : "hồn thú"} trong tầm.`);
    d.mpF -= cost; p.mp = Math.floor(d.mpF); p.bcds[i] = sk.cd;
    this.unhide(p, d);
    const tier = tierOfYears(bone.years), col = TIERS[tier].glow;
    // Client tra tên kỹ năng theo loài (chỉ số BEASTS) và vị trí; `i` là nút, hào quang theo niên hạn hồn cốt.
    this.broadcast("fx", { k: "bone", id, i, sp: beastIndex(bone.beast), tier });
    // Mốc cường hóa +5 / +10 / +15 / +20 nâng kỹ năng (4.4): sức mạnh và hiệu ứng lên bản thân nhân boneSkillMult.
    const em = boneSkillMult(bone.enhance);
    this.runSkill(id, sk, skillPower(bone.years) * em, buffPower(bone.years) * em, col, { kind: "skill", done: false }, sk.self ? d.ch.vohon : undefined);
  }

  /**
   * `hit`: đòn đánh thường / hồn kỹ tạo năng lượng tiên cơ cho đội; bỏ trống (chiêu tiên cơ, sát thương theo thời gian, lan
   * Cảm điện) thì không tạo. Dễ thương tăng mọi sát thương, Phá giáp tăng sát thương đòn trực tiếp; đòn trực tiếp trúng hồn
   * thú Cảm điện thì lan sang hồn thú Cảm điện gần đó. Trả về sát thương đã gây.
   * Người đang chuyển bản đồ hoặc đứng trong vùng an toàn không gây sát thương (kể cả tiên cơ, nhát hẹn giờ của hồn kỹ liên
   * hoàn, mũi đạn đang bay, sát thương theo thời gian và lan Cảm điện) và không tích năng lượng: kills / kinh nghiệm sau lúc
   * chụp dữ liệu đi cổng sẽ mất (mục 6), vùng an toàn không giao chiến (mục 5.3).
   */
  damageBeast(bid: string, dmg: number, by: string, col: string, hit?: Hit, o: DmgOpt = {}) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), p = this.state.players.get(by), pd = this.pdata.get(by);
    if (!b || !bd || !p || !pd || b.hp <= 0 || pd.travelling || this.map.inSafe(p.x, p.y)) return 0;
    const w = bd.elite?.king?.world, he = VOHON[p.vh]?.he;
    if (w && w.dive > 0) return 0; // boss thế giới đang lặn (Du Thủy, BĐ6e): không nhận sát thương
    const direct = o.direct !== false && !o.chain, fx = pd.coreFx;
    const vuln = bd.st.get("vuln"), armor = bd.st.get("armor"), poison = bd.st.get("poison"), shocked = bd.st.has("shock");
    // Bộ hồn hạch Xà Hoàng 4 món (5.2): Trúng độc đủ tầng do người mang bộ gây thì như Dễ thương thêm (mọi nguồn).
    const pv = poison && poison.n >= CORE_FX_RULE.poisonStacks ? this.pdata.get(poison.src)?.coreFx.poisonVuln ?? 0 : 0;
    // Ràng buộc Băng Hỏa Lưỡng Nghi (9.4): hồn thú đang Choáng hoặc Thiêu đốt nhận thêm sát thương của hồn sư (mọi nguồn, như Dễ thương).
    const sb = (bd.st.has("stun") || bd.st.has("burn")) && !o.pair ? this.bondV(pd, "stunBurn") : 0; // dung hợp kỹ không nhận ràng buộc (#192)
    // Thủ (#116, BEAST_DEF): đòn trực tiếp nhân defMult; Phá giáp (STATUS.armor.shred mỗi tầng) và xuyên thủ của bộ Thất Sát 2 món giảm
    // thủ, tối đa hết thủ. Phần chênh so với hồn thú thủ chuẩn cộng như các hệ số khác.
    const thu = direct ? defMult(bd.def, (armor ? STATUS.armor.shred * armor.n : 0) + (fx.pierce ?? 0)) - 1 : 0;
    dmg *= 1 + (vuln ? vuln.v : 0) + pv + sb + thu + this.phoenixAmp(b);
    // Chí mạng theo võ hồn ra trận (CRIT cộng hồn hạch, 5.2); bộ Thất Sát 4 món thêm tỉ lệ lên hồn thú Phá giáp.
    const crit = direct && Math.random() < pd.crit + (o.crit ?? 0) + this.buffV(pd, "crit") + (o.pair ? 0 : this.bondV(pd, "crit")) + (armor ? fx.armorCrit ?? 0 : 0);
    if (crit) dmg *= pd.critMult;
    if (crit && fx.haste) pd.haste = CORE_FX_RULE.hasteSecs; // bộ Linh Miêu 4 món: chí mạng thì tăng tốc đánh một lúc
    // Điểm yếu hệ của boss thế giới (BĐ6e): võ hồn ra trận đúng hệ gây x WORLD.weakMult, hệ khác x WORLD.offMult.
    if (w?.weak) dmg *= he === w.weak ? WORLD.weakMult : WORLD.offMult;
    dmg = Math.max(1, Math.round(dmg));
    // Tinh anh (BĐ4): người gây sát thương thành người tham gia trước (máu tối đa tăng theo số người, giữ tỉ lệ), rồi mới trừ máu.
    // Dung hợp kỹ (#192): đồng đội dung hợp còn trong phòng cũng thành người tham gia và nhận nửa đóng góp.
    // Đồng đội đã rời, đang đi cổng, đã gục hay đứng trong vùng an toàn (độc / lửa của chiêu còn cháy) thì không nhận phần, A nhận cả.
    const mp = o.pair && o.pair !== by ? this.state.players.get(o.pair) : undefined, md = mp && this.pdata.get(o.pair!);
    // Tinh anh / thú vương: B phải đang trong bán kính giao chiến (hang) như người tham gia khác (inFight).
    const mate = mp && md && !md.travelling && !mp.dead && !this.map.inSafe(mp.x, mp.y) && (!bd.elite || this.inFight(b, bd.elite, mp)) ? o.pair : undefined;
    if (bd.elite) { if (mate) this.joinFight(bd.elite, mate); this.eliteJoin(b, bd, by); } // eliteJoin tính lại máu theo số người
    // Khiên Bá Thể (BĐ6e) đỡ trước; võ hồn hệ của khiên phá nhanh gấp `mult`. Phần đánh vào khiên vẫn tính đóng góp.
    let hpDmg = dmg, credit = Math.min(dmg, b.hp);
    const ar = w && w.shield > 0 ? bd.elite!.king!.def.world?.armor : undefined;
    if (w && ar) {
      const m = he === ar.he ? ar.mult : 1, eff = dmg * m, used = Math.min(eff, w.shield);
      w.shield -= used; hpDmg = Math.round((eff - used) / m); credit = Math.round(used) + Math.min(hpDmg, b.hp);
      b.shield = Math.ceil(w.shield);
      if (w.shield <= 0) { w.shield = 0; w.shieldT = 0; b.shield = 0; this.broadcast("boss", { k: "armorBreak", bid, name: ar.name, by: p.name }); }
      this.broadcast("dmg", { x: b.x, y: b.y - TIERS[b.tier].size - 8, v: Math.round(used), c: "#9ad8ff", bid, by, dot: !direct || undefined });
    }
    if (bd.elite && mate) { this.credit(bd.elite, "dmgBy", by, credit / 2); this.credit(bd.elite, "dmgBy", mate, credit / 2); }
    else if (bd.elite) this.credit(bd.elite, "dmgBy", by, credit);
    // Khiên đỡ hết đòn: vẫn là một đòn trúng (năng lượng tiên cơ, tích Lôi, onHit như đòn trúng máu), chỉ không trừ máu.
    if (hpDmg <= 0) {
      b.aggro = true; bd.target = by; bd.hitBy = by; bd.calm = 0; if (o.direct !== false) { pd.fight = 0; if (mate) this.pdata.get(mate)!.fight = 0; }
      if (hit && !hit.done) { hit.done = true; this.gainEnergy(by, hit.kind); this.gainLei(by, hit.kind, bd.st.has("shock")); hit.onHit?.(); }
      return dmg;
    }
    dmg = hpDmg;
    b.hp = Math.max(0, b.hp - dmg); b.aggro = true; bd.target = by; bd.hitBy = by; bd.calm = 0;
    if (o.direct !== false) { pd.fight = 0; if (mate) this.pdata.get(mate)!.fight = 0; } // sát thương theo thời gian không giữ hồn sư trong giao chiến; dung hợp kỹ: cả đồng đội
    if (direct && !bd.st.has("stun") && !bd.st.has("root") && !bd.rooted) { // thú thực vật đứng yên không bị đẩy lùi (#116)
      const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1, kb = b.rank >= 2 ? 0 : b.tier >= 3 ? 40 : 110; // thú vương không bị đẩy lùi
      bd.kx = (dx / dd) * kb; bd.ky = (dy / dd) * kb;
    }
    this.broadcast("dmg", { x: b.x, y: b.y - TIERS[b.tier].size, v: dmg, crit, c: crit ? "#ffe14d" : col, bid, by, dot: !direct || undefined, kill: b.hp <= 0 || undefined }); // by / dot: chỉ để client chọn hiệu ứng đánh; kill: đòn kết liễu (chỉ để hiển thị: client chạy hiệu ứng chết, hồn thú bị xoá cùng tick)
    if (hit && !hit.done) { hit.done = true; this.gainEnergy(by, hit.kind); this.gainLei(by, hit.kind, bd.st.has("shock")); hit.onHit?.(); }
    // Hút máu của hồn kỹ (đòn trực tiếp) cộng hút huyết `leech` của hồn sư (Quỷ Mị, 2.5d: mọi sát thương, kể cả theo thời gian và lan
    // Cảm điện), hồi cho võ hồn ra trận; cả đội đã gục thì không hồi.
    const steal = (o.lifesteal ?? 0) + this.buffV(pd, "leech");
    if (steal && !p.dead) { pd.hpF = Math.min(p.maxHp, pd.hpF + dmg * steal); p.hp = Math.ceil(pd.hpF); }
    // Bộ hồn hạch Bá Vương Long 4 món (5.2): đòn trực tiếp trúng hồn thú Cảm điện hồi hồn lực, mỗi shockMpCd giây một lần.
    if (direct && shocked && fx.shockMp && pd.shockMpCd <= 0 && !p.dead) {
      pd.shockMpCd = CORE_FX_RULE.shockMpCd; pd.mpF = Math.min(p.maxMp, pd.mpF + p.maxMp * fx.shockMp); p.mp = Math.floor(pd.mpF);
    }
    // Cảm điện: lan một phần sát thương sang hồn thú Cảm điện khác gần đó (một bước, không lan tiếp); bộ Bá Vương Long 2 món lan mạnh thêm.
    if (direct && bd.st.has("shock")) {
      const sh = STATUS.shock;
      for (const [oid, ob] of this.beastsNear(b.x, b.y, sh.chainR))
        if (oid !== bid && this.bdata.get(oid)?.st.has("shock") && Math.hypot(ob.x - b.x, ob.y - b.y) < sh.chainR)
          this.damageBeast(oid, dmg * sh.chain * (1 + (fx.chain ?? 0)), by, sh.col, undefined, { chain: true, pair: o.pair });
    }
    if (b.hp <= 0) this.killBeast(bid, by);
    return dmg;
  }

  // ---------- Đối thủ người chơi (PvP chỉ có trong Đại Đấu Hồn Trường, mục 5.9, bước 7.2) ----------
  /** Người chơi mà `id` đánh được lúc này. MapRoom: không ai (PvP ngoài rừng không có, mục 5.9); ArenaRoom ghi đè khi đang giao đấu. */
  foesOf(_id: string): string[] { return []; }
  /** Đối thủ chưa gục đứng trong bán kính `r` quanh (x, y) (tính tới chân), kể cả đang tàng hình (đòn diện rộng vẫn trúng). */
  foesNear(id: string, r: number, x: number, y: number) {
    return this.foesOf(id).filter((f) => { const q = this.state.players.get(f); return !!q && !q.dead && Math.hypot(q.x - x, q.y - y) < r; });
  }
  /** Đối thủ gần `id` nhất trong bán kính `r` mà khóa mục tiêu được (chưa gục, không tàng hình). */
  nearestFoe(id: string, r: number) {
    const p = this.state.players.get(id); if (!p) return undefined;
    let best: string | undefined, bd = r;
    for (const f of this.foesOf(id)) {
      const q = this.state.players.get(f), dd = q ? Math.hypot(q.x - p.x, q.y - p.y) : Infinity;
      if (q && !q.dead && !this.pdata.get(f)?.buffs.has("hide") && dd < bd) { bd = dd; best = f; }
    }
    return best;
  }
  /**
   * Hồn sư `by` gây `dmg` (tính như lên hồn thú) cho đối thủ `fid` (7.2). Thứ tự (#277, mục 5.9): × ARENA_HE_DMG theo hệ võ hồn ra trận
   * của người đánh → × ARENA.dmgMult → chí mạng theo người đánh (tỉ lệ, hồn kỹ, hiệu ứng có lợi, ràng buộc, bộ Thất Sát 4 món lên đối
   * thủ Phá giáp) → hurtPlayer (Dễ thương / Phá giáp / Xà Hoàng 4 món, thủ theo hệ, tăng thủ, khiên, miễn sát thương, gục từng võ hồn).
   * Đòn trúng tạo năng lượng tiên cơ / Phong Lôi Chi Lực, hút máu, bộ Linh Miêu / Bá Vương Long 4 món như damageBeast. Lãnh vực phượng
   * hoàng, kích nổ, đẩy lùi, lan Cảm điện chỉ áp lên hồn thú. Trả về đòn có trúng không.
   */
  damageFoe(fid: string, dmg: number, by: string, _col: string, hit?: Hit, o: DmgOpt = {}) {
    const p = this.state.players.get(by), pd = this.pdata.get(by), f = this.state.players.get(fid), fd = this.pdata.get(fid);
    if (!p || !pd || !f || !fd || f.dead || pd.travelling || fd.travelling || !this.foesOf(by).includes(fid)) return false;
    const direct = o.direct !== false && !o.chain, fx = pd.coreFx, he = VOHON[p.vh]?.he, shocked = fd.st.has("shock");
    const crit = direct && Math.random() < pd.crit + (o.crit ?? 0) + this.buffV(pd, "crit") + this.bondV(pd, "crit") + (fd.st.has("armor") ? fx.armorCrit ?? 0 : 0);
    const r = { dealt: 0 };
    if (!this.hurtPlayer(fid, dmg * (he ? ARENA_HE_DMG[he] : 1) * ARENA.dmgMult * (crit ? pd.critMult : 1), { dot: !direct, pvp: r, crit })) return false;
    if (crit && fx.haste) pd.haste = CORE_FX_RULE.hasteSecs; // bộ Linh Miêu 4 món
    // Bộ Bá Vương Long 4 món: đòn trực tiếp trúng đối thủ Cảm điện hồi hồn lực, chung hồi chiêu shockMpCd với hồn thú.
    if (direct && shocked && fx.shockMp && pd.shockMpCd <= 0 && !p.dead) {
      pd.shockMpCd = CORE_FX_RULE.shockMpCd; pd.mpF = Math.min(p.maxMp, pd.mpF + p.maxMp * fx.shockMp); p.mp = Math.floor(pd.mpF);
    }
    if (direct) pd.fight = 0;
    if (hit && !hit.done) { hit.done = true; this.gainEnergy(by, hit.kind); this.gainLei(by, hit.kind, fd.st.has("shock")); hit.onHit?.(); }
    const steal = (o.lifesteal ?? 0) + this.buffV(pd, "leech");
    if (steal && !p.dead && r.dealt > 0) { pd.hpF = Math.min(p.maxHp, pd.hpF + r.dealt * steal); p.hp = Math.ceil(pd.hpF); }
    return true;
  }

  /**
   * Lãnh vực phượng hoàng (Tà Hỏa Phượng Hoàng, 2.5b): hồn thú trong PHOENIX_FIELD_R quanh một hồn sư đang có lãnh vực nhận thêm
   * sát thương từ mọi nguồn (lấy lãnh vực mạnh nhất, không cộng nhiều lãnh vực). Hồn sư đã gục, đang chuyển bản đồ hoặc đứng
   * trong vùng an toàn thì lãnh vực không có tác dụng. Từ 8.1b bán kính theo phoenixFieldR: võ hồn ra trận đang Chân Thân có
   * `field` (Tà Hỏa Phượng Hoàng Chân Thân) thì lãnh vực rộng hơn.
   */
  phoenixAmp(b: BeastState) {
    let a = 0;
    for (const [pid, pd] of this.pdata) {
      const v = pd.buffs.get("phoenix")?.v ?? 0, pp = this.state.players.get(pid);
      if (v <= a || !pp || pp.dead || pd.travelling || this.map.inSafe(pp.x, pp.y)) continue;
      if (Math.hypot(b.x - pp.x, b.y - pp.y) < phoenixFieldR(pd.ch.vohon, !!pd.ava)) a = v;
    }
    return a;
  }

  /** Bộ hồn hạch Tiên Cơ (mục 5.6) gắn trên võ hồn `v` (từ 5.2): 2 món tích năng lượng nhanh hơn (khi ở ngoài), 4 món tiên cơ mạnh hơn. */
  tienCoSet(d: PData, v: Character) {
    const n = coreSetCounts(this.coresOn(d, v.rowId)).get("tien_co") ?? 0;
    return { set2: n >= CORE_SET_2, set4: n >= CORE_SET_4 };
  }

  /** Võ hồn ra trận đánh trúng: mỗi võ hồn khác trong đội chưa gục tích năng lượng tiên cơ (mục 5.1 "Trong trận"). */
  gainEnergy(id: string, kind: Hit["kind"]) {
    const d = this.pdata.get(id); if (!d) return;
    for (const r of d.team) {
      const v = d.owned.find((o) => o.rowId === r);
      if (!v || v === d.ch || d.down.has(r)) continue;
      d.energy.set(r, Math.min(TIEN_CO_MAX, (d.energy.get(r) ?? 0) + energyGain(kind, this.tienCoSet(d, v).set2)));
    }
    this.sendSquad(id);
  }

  /**
   * Phong Lôi Chi Lực (PHONG_LOI, 2.5c): Lam Điện Bá Vương Long ra trận đánh trúng thì tích (gấp shockMult nếu hồn thú trúng đầu
   * tiên đang Cảm điện). Đầy thì hẹn tung Lôi Động Minh Thiên ở tick sau (không tung giữa lúc đang tính một đòn).
   * Từ 8.1c: đang Võ Hồn Chân Thân thì tích gấp `ChanThanDef.lei` (Chân Thân thuộc võ hồn ra trận nên chỉ khi Lam Điện đang biến hình).
   */
  gainLei(id: string, kind: Hit["kind"], shocked: boolean) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || VOHON[p.vh].id !== PHONG_LOI.vohon) return;
    const ava = d.ava ? chanThanOf(PHONG_LOI.vohon)?.lei ?? 1 : 1;
    d.lei = Math.min(PHONG_LOI.max, d.lei + PHONG_LOI.gain[kind] * (shocked ? PHONG_LOI.shockMult : 1) * ava); p.lei = Math.floor(d.lei);
    if (d.lei >= PHONG_LOI.max && !d.leiQueued) { d.leiQueued = true; this.later(0, () => this.leiDong(id)); }
  }

  /** Lôi Động Minh Thiên: chỉ khi Lam Điện vẫn ra trận, còn sống, không trong vùng an toàn / đang chuyển bản đồ (không thì giữ thanh đầy). */
  leiDong(id: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    d.leiQueued = false;
    if (p.dead || d.travelling || VOHON[p.vh].id !== PHONG_LOI.vohon || d.lei < PHONG_LOI.max || this.map.inSafe(p.x, p.y)) return;
    d.lei = 0; p.lei = 0;
    const sk = PHONG_LOI.skill, col = VOHON[p.vh].col, years = Math.max(TIERS[0].years, ...d.ringYears);
    this.broadcast("fx", { k: "bolt", id, x: p.x, y: p.y, r: sk.r, col, name: sk.name });
    this.runSkill(id, sk, skillPower(years), 1, col);
    this.log(id, `${PHONG_LOI.name} đầy: ${sk.name}!`, col);
  }

  /** Ra khỏi giao chiến quá TIEN_CO_IDLE_SECS giây: năng lượng cả đội (và Phong Lôi Chi Lực) giảm dần mỗi giây. */
  tickEnergy(id: string, dt: number) {
    const d = this.pdata.get(id)!, idle = Math.min(dt, d.fight - TIEN_CO_IDLE_SECS);
    if (idle > 0 && d.lei > 0) { d.lei = Math.max(0, d.lei - idle * PHONG_LOI.decay); this.state.players.get(id)!.lei = Math.floor(d.lei); }
    if (idle <= 0 || !d.energy.size) return;
    for (const [r, e] of d.energy) { if (e - idle * TIEN_CO_DECAY <= 0) d.energy.delete(r); else d.energy.set(r, e - idle * TIEN_CO_DECAY); }
  }

  /**
   * Chiêu tiên cơ của võ hồn vừa đổi vào. Võ hồn có tiên cơ riêng (TIEN_CO_RIENG, bước 2.5a) chạy bằng bộ máy hồn kỹ với sức
   * mạnh tienCoDmgMult. Còn lại dùng tiên cơ chung theo hệ (bảng TIEN_CO, bước 2.4): cường công nổ diện rộng, mẫn công lướt tới
   * hồn thú gần nhất và chém mạnh, khống chế choáng diện rộng, phụ trợ hồi sinh lực cả đội và tạo khiên. Không tốn hồn lực,
   * không tạo năng lượng.
   */
  tienCo(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, def = VOHON[p.vh], he = def.he, tc = TIEN_CO[he];
    const mult = tienCoDmgMult(this.tienCoSet(d, d.ch).set4), dmg = this.atkOf(d) * tc.dmg * mult, col = def.col, x0 = p.x, y0 = p.y;
    const own = TIEN_CO_RIENG[def.id];
    this.unhide(p, d); // tung tiên cơ cũng hiện hình như đánh thường / hồn kỹ
    this.questEvent(id, { k: "tienco" }); // 6.2
    if (own) {
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, vh: p.vh, own: true });
      // Sao võ hồn (9.5): sát thương và mức hiệu ứng tiên cơ riêng × starTienCoMult (6★ thêm STAR_TIEN_CO).
      const sm = starTienCoMult(d.ch.stars);
      this.runSkill(id, own, mult * sm, sm, col, undefined, this.shareOf(p, def.id)); // 9.1: tiên cơ của võ hồn Phụ trợ lan cho tổ đội
      this.log(id, `Tiên cơ – ${def.name}: ${own.name}, ${own.desc}!`, col);
      this.sendSquad(id);
      return;
    }
    if (he === "man_cong") {
      // Lướt về hồn thú gần nhất trong tầm (không có thì lướt theo hướng đang nhìn), dừng sát mục tiêu hoặc khi vướng vật cản.
      let tgt: string | undefined, b: BeastState | undefined, best = tc.range;
      for (const [bid, o] of this.beastsNear(p.x, p.y, tc.range)) { const dd = Math.hypot(o.x - p.x, o.y - p.y); if (dd < best) { best = dd; tgt = bid; b = o; } }
      // Không có hồn thú trong tầm thì lướt tới đối thủ gần nhất (Đại Đấu Hồn Trường, 7.2).
      const fid = b ? undefined : this.nearestFoe(id, tc.range), f = fid ? this.state.players.get(fid) : undefined;
      if (b) this.dashTo(p, d, b, tc.dash, TIERS[b.tier].size); else if (f) this.dashTo(p, d, f, tc.dash, ARENA.body * 2); else this.dashStep(p, d, tc.dash);
      d.inv = Math.max(d.inv, 0.35);
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, x0, y0 });
      // Lướt vào vùng an toàn thì không chém (không giao chiến trong vùng an toàn).
      if (tgt && b && !this.map.inSafe(p.x, p.y) && Math.hypot(b.x - p.x, b.y - p.y) < 18 + TIERS[b.tier].size) this.damageBeast(tgt, dmg, id, col);
      if (fid && f && Math.hypot(f.x - p.x, f.y - p.y) < 18 + ARENA.body * 2) this.damageFoe(fid, dmg, id, col);
    } else if (he === "phu_tro") {
      const hm = this.healMult(d); // bộ hồn hạch Lưu Ly 2 món (5.2), ràng buộc Lam Ngân Hoàng (9.4)
      this.healTeam(id, tc.heal * hm);
      d.shield = Math.max(d.shield, Math.round(p.maxHp * tc.shield * hm)); d.shieldT = tc.shieldSecs; p.shield = d.shield;
      this.partyShare(id, { heal: tc.heal, shield: tc.shield, secs: tc.shieldSecs }, 1, hm, col, def.id); // 9.1: lan cho tổ đội
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y });
    } else {
      this.broadcast("fx", { k: "tienco", id, he, col, x: p.x, y: p.y, r: tc.r });
      const near = this.beastsNear(p.x, p.y, tc.r).filter(([, b]) => Math.hypot(b.x - p.x, b.y - p.y) < tc.r + TIERS[b.tier].size / 2);
      for (const [bid] of near) {
        if (tc.stun) this.applyStatus(bid, { s: "stun", secs: tc.stun }, id);
        this.damageBeast(bid, dmg, id, col);
      }
      for (const fid of this.foesNear(id, tc.r + ARENA.body, p.x, p.y)) {
        if (this.damageFoe(fid, dmg, id, col) && tc.stun) this.applyPStatus(fid, { s: "stun", secs: tc.stun }, 0, id);
      }
    }
    this.log(id, `Tiên cơ – ${def.name}: ${tc.name}, ${tc.desc}!`, col);
    this.sendSquad(id);
  }

  /**
   * Hạ hồn thú: kinh nghiệm, Hồn Tệ, và hồn hoàn rơi xuống đất mang đúng số năm của hồn thú (mục 5.2); người hạ được ưu tiên nhặt.
   * Tinh anh (mục 5.4, BĐ4): kinh nghiệm x ELITE.xp cho người hạ; hồn hoàn và hồn cốt ưu tiên người đóng góp nhiều nhất còn trong
   * phòng; tỉ lệ hồn cốt x ELITE.bone, hồn cốt mang loài gốc; chắc chắn rơi 1 hồn hạch (từ 5.1).
   * Tổ đội (mục 5.9, bước 7.1): kinh nghiệm (kể cả x ELITE.xp của tinh anh) chia cho người hạ và đồng đội trong PARTY_XP_RANGE
   * (partyNear), mỗi người partyXpShare(n) phần gốc, rồi từng người tự giảm theo chênh cấp và chia 40/20 (rewardKill). Hồn Tệ, mảnh
   * vào túi vẫn chỉ của người hạ. Đồ rơi ưu tiên cả tổ đội của người được ưu tiên (newDrop chụp id tổ đội).
   */
  killBeast(bid: string, by: string) {
    if (this.eggs.has(bid)) return this.eggs.broke(bid, by); // bọc trứng (#162): vỡ, không nở, không thưởng
    const b = this.state.beasts.get(bid)!, e = this.bdata.get(bid)?.elite, zone0 = this.bdata.get(bid)?.zone; // zone0: vùng sinh thật (B2 tự săn nhớ chỗ hồi sinh)
    const td = TIERS[b.tier], name = beastName(b.rank, b.species), age = formatYears(b.years);
    this.state.beasts.delete(bid); this.bdata.delete(bid);
    // 6.2: vùng săn tính theo chỗ hồn thú bị hạ (khung vùng trong Tiled).
    const zone = this.map.zones.find((z) => b.x >= z.x0 && b.x < z.x1 && b.y >= z.y0 && b.y < z.y1)?.name;
    const fit = (pid: string) => fitBeast(this.state.players.get(pid)?.level ?? 1, b.years); // khảo hạch hằng ngày: hồn thú hợp cấp của từng người
    const team = this.partyNear(by, b.x, b.y), grp = team.length > 1; // #256: cờ `party` của mục tiêu hạ hồn thú: từ 2 người chia kinh nghiệm
    this.questEvent(by, { k: "kill", map: this.state.mapId, zone, fit: fit(by), party: grp });
    if (e?.king) return this.killKing(bid, b, e, by); // tà hóa thú vương (BĐ5): thưởng theo đóng góp, rương
    const p = this.state.players.get(by)!; p.kills++;
    const ad = this.pdata.get(by); if (ad?.auto && !b.rank) ad.auto.killed(this.offlinePower(ad, p), b.years, BEASTS[b.species]?.id ?? "", zone0); // trần tốc độ tự săn
    const share = partyXpShare(team.length);
    // Giới hạn săn tinh anh nhiều kênh (#119, mục 5.4): tài khoản đã nhận thưởng loài tinh anh này trên bản đồ này trong ELITE.lock giây
    // (ở bất kỳ kênh nào) thì lần này chỉ nhận như hồn thú thường; ai nhận thưởng tinh anh lần này thì bị khóa ELITE.lock giây.
    const now = Date.now(), lockKey = e ? eliteKey(this.state.mapId, b) : "";
    const accOf = (pid: string) => this.pdata.get(pid)?.accountId ?? -1;
    const left = new Map<string, number>(); // chụp trước khi ghi khóa của lần này
    const lockLeft = (pid: string) => { if (!e) return 0; let v = left.get(pid); if (v === undefined) left.set(pid, v = eliteLockLeft(lockKey, accOf(pid), now)); return v; };
    const free = (pid: string) => !lockLeft(pid);
    const owner = e ? this.topContrib(e, by, false, free) : by; // 9.2: đóng góp tổng (sát thương + hỗ trợ); #119: người chưa bị khóa
    const byFree = free(by); // chụp trước khi ghi khóa của lần này
    // Người đứng đầu đóng góp bị khóa thì quyền ưu tiên sang người kế tiếp: câu báo không được nói "đóng góp nhiều nhất".
    const why = e && owner && owner !== this.topContrib(e, by) ? "đóng góp nhiều nhất trong số người chưa bị khóa thưởng tinh anh" : "đóng góp nhiều nhất";
    const got = new Set<string>(); // người nhận thưởng tinh anh lần này (kinh nghiệm x ELITE.xp, quyền ưu tiên đồ rơi tinh anh)
    for (const pid of team) {
      const full = !!e && free(pid); if (full) got.add(pid);
      this.rewardKill(pid, b.years, (full ? ELITE.xp : 1) * share);
    }
    if (owner) got.add(owner);
    if (e) {
      const notice = new Set([...team, ...this.contributors(e).filter((pid) => this.state.players.has(pid))]);
      for (const pid of notice) {
        const l = lockLeft(pid); if (!l || got.has(pid)) continue;
        this.log(pid, `Đã nhận thưởng ${name} trên bản đồ này chưa lâu (kênh nào cũng tính): còn ${Math.ceil(l / 60)} phút mới nhận lại; lần này chỉ thưởng như hồn thú thường.`, "#ffb35c");
      }
      let m = eliteLocks.get(lockKey); if (!m) { m = new Map(); eliteLocks.set(lockKey, m); }
      for (const pid of got) m.set(accOf(pid), now + ELITE.lock * 1000);
      void persistEliteLock(lockKey, m).catch((err) => console.error("Không lưu được khóa tinh anh trong presence", err));
    }
    const elite = !!e && !!owner, drOwner = owner ?? by; // elite: còn người nhận đồ rơi tinh anh (hồn cốt x ELITE.bone, chắc chắn hồn hạch)
    // 6.2 + 7.1: đồng đội cùng chia kinh nghiệm (cùng phòng, trong PARTY_XP_RANGE) cũng được tính mục tiêu hạ hồn thú của nhiệm vụ.
    for (const pid of team) if (pid !== by) this.questEvent(pid, { k: "kill", map: this.state.mapId, zone, fit: fit(pid), party: grp });
    if (e) for (const pid of team) this.questEvent(pid, { k: "elite", map: this.state.mapId }); // #256 (#284: kèm bản đồ): người hạ và đồng đội được chia kinh nghiệm cùng tính "tham gia hạ tinh anh"
    if (team.length > 1) {
      const names = team.map((pid) => this.state.players.get(pid)?.name ?? "").join(", ");
      for (const pid of team) this.log(pid, `Tổ đội ${team.length} người chia kinh nghiệm hạ ${name} (${names}): mỗi người ${(share * 100).toFixed(1).replace(".", ",")}% phần gốc.`, "#7dff8a");
    }
    const coin = this.rewardCoin(by, b.tier);
    const drop = this.newDrop(b.x, b.y, drOwner);
    drop.tier = b.tier; drop.years = b.years;
    this.state.drops.set(uid("d"), drop);
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: td.size + 10, col: td.glow });
    this.log(by, `Hạ ${name} (${age}), nhận ${formatHonTe(coin)} Hồn Tệ. Hồn hoàn ${age} rơi xuống đất: ${this.lootNote(drOwner, by, why)}`, td.glow);
    if (drOwner !== by) this.log(drOwner, `Bạn ${why} khi hạ ${name}: hồn hoàn ${age} ưu tiên bạn nhặt ${DROP_OWNER_SECS} giây đầu (phím E).`, td.glow);
    if (e) this.broadcast("elite", { k: "down", name, by: p.name, col: BOSSES[b.species]?.aura });
    this.rollShard(by, b.years, b.x, b.y);
    this.rollHerb(by, zone, b.x, b.y, !!e && byFree);
    const base = e ? Math.max(0, beastIndex(BOSSES[b.species]?.species ?? "")) : b.species;
    this.rollBone(by, drOwner, base, b.years, b.tier, b.x, b.y, elite ? ELITE.bone : 1, why);
    this.rollCoreDrop(by, drOwner, b.years, b.x, b.y, elite, why);
    this.rollEquipGround(by, drOwner, elite ? 1 : 0, b.x, b.y, why);
  }

  /**
   * Hồn hạch (bước 5.1, bảng rơi 5.3): hạ hồn thú `years` năm thì tung coreChance (tinh anh `sure`: chắc chắn rơi, mục 5.4); trúng thì
   * một hồn hạch sao theo niên hạn, bộ đặc trưng của bản đồ (MapDef.cores) hoặc bộ bất kỳ, chỉ số chính / phụ tung ngay lúc rơi
   * (giữ trong coreDrops). Rơi xuống đất cạnh hồn hoàn, cùng luật đồ rơi: `owner` ưu tiên DROP_OWNER_SECS giây, nhặt (E) vào túi,
   * túi đầy thì báo. Hook test `core` của người hạ `id` cố định được số ngẫu nhiên, sao và bộ.
   * Rương tà hóa thú vương (BĐ5, openChest) cho hồn hạch thẳng vào túi bằng `rollCore(..., { high: true })` rồi `addCore`.
   */
  rollCoreDrop(id: string, owner: string, years: number, x: number, y: number, sure = false, why?: string) {
    const d = this.pdata.get(id); if (!d) return;
    const t = d.testCore;
    if ((t ? t.r : Math.random()) >= (sure ? 1 : coreChance(years))) return;
    const core = rollCore(years, MAPS[this.state.mapId]?.cores ?? [], Math.random, t ? { stars: t.stars, set: t.set >= 0 ? t.set : undefined } : {});
    // Bên phải hồn hoàn (hồn cốt nằm bên trái, mảnh võ hồn khi túi đầy sát bên phải) để biểu tượng và nhãn không chồng lên nhau.
    // Không chỗ nào đứng được (hồn thú gục sát vật cản) thì nằm đúng chỗ hồn hoàn, như hồn hoàn.
    const [cx, cy] = [[x + 16, y], [x, y + 8]].find(([a, b]) => this.map.standable(a, b)) ?? [x, y];
    const drop = this.newDrop(cx, cy, owner);
    const si = Math.max(0, coreSetIndex(core.data.set)), col = CORE_SETS[si].col;
    drop.item = CORE_ITEM; drop.qty = 1; drop.tier = tierOfYears(years); drop.years = years; drop.stars = core.stars; drop.cset = si;
    const did = uid("d");
    this.coreDrops.set(did, core); this.state.drops.set(did, drop);
    this.broadcast("fx", { k: "wave", x: drop.x, y: drop.y, r: 30, col });
    const msg = `${coreName(core.data.set, core.stars)} rơi xuống đất!`;
    this.log(id, `${msg} ${this.lootNote(owner, id, why)}`, col);
    if (owner !== id) this.log(owner, `${msg} ${this.lootNote(owner, owner)}`, col);
  }

  /**
   * Hồn cốt (bước 4.1, bảng rơi 5.3): hạ hồn thú `years` năm thì tung boneChance; trúng thì một hồn cốt cùng loài, cùng số năm, vị
   * trí ngẫu nhiên trong 6 vị trí, rơi xuống đất cạnh hồn hoàn. Cùng luật đồ rơi như hồn hoàn: người hạ ưu tiên DROP_OWNER_SECS
   * giây, nhặt (E) vào túi, túi đầy thì báo. Hook test `bone` của người hạ `id` cố định được số ngẫu nhiên và vị trí.
   * Tinh anh (BĐ4): `mult` = ELITE.bone, quyền ưu tiên thuộc `owner` (người đóng góp nhiều nhất, như hồn hoàn).
   */
  rollBone(id: string, owner: string, species: number, years: number, tier: number, x: number, y: number, mult = 1, why?: string) {
    const d = this.pdata.get(id); if (!d) return;
    const t = d.testBone;
    if ((t ? t.r : Math.random()) >= boneChance(years, mult)) return;
    const slot = t && t.s >= 0 ? t.s % BONE_SLOTS.length : Math.floor(Math.random() * BONE_SLOTS.length);
    const drop = this.map.standable(x - 8, y) ? this.newDrop(x - 8, y, owner) : this.newDrop(x, y, owner);
    drop.item = BONE_ITEM; drop.qty = 1; drop.tier = tier; drop.years = years; drop.species = species; drop.slot = slot;
    this.state.drops.set(uid("d"), drop);
    this.broadcast("fx", { k: "wave", x: drop.x, y: drop.y, r: 30, col: TIERS[tier].glow });
    const bone = `Hồn cốt ${boneName(BEASTS[species]?.id ?? "", BONE_SLOTS[slot].id, years)} rơi xuống đất!`;
    this.log(id, `${bone} ${this.lootNote(owner, id, why)}`, TIERS[tier].glow);
    if (owner !== id) this.log(owner, `${bone} ${this.lootNote(owner, owner)}`, TIERS[tier].glow);
  }

  /**
   * Đồ rơi tại (x, y): người hạ `owner` được ưu tiên nhặt DROP_OWNER_SECS giây, tồn tại DROP_TTL_SECS giây (mục 4, 5.2). Từ 7.1 chụp
   * tổ đội của `owner` lúc rơi: cả tổ đội cùng được ưu tiên (người vào đội sau lúc rơi thì không, người rời đội thì mất quyền).
   */
  newDrop(x: number, y: number, owner: string) {
    const drop = new DropState(), od = this.pdata.get(owner);
    drop.x = x; drop.y = y; drop.owner = owner; drop.ownerTtl = DROP_OWNER_SECS; drop.ttl = DROP_TTL_SECS;
    drop.party = od ? party.partyIdOf(od.accountId) : 0;
    return drop;
  }

  // ---------- Mảnh võ hồn, mở võ hồn, lên sao (mục 5.1 "Sưu tầm võ hồn", 5.3 "Rơi đặc trưng", bước 3.4) ----------
  /**
   * Hạ hồn thú `years` năm: tung tỉ lệ rơi mảnh (shardChance, bảng rơi 5.3); trúng thì SHARD_QTY mảnh của một võ hồn ngẫu nhiên
   * trong MAPS[bản đồ].shards vào thẳng túi người hạ. Túi đầy thì phần không nhận rơi xuống đất cạnh hồn hoàn, cùng luật ưu tiên
   * người hạ như hồn hoàn (3.2). Hook test `shard` cố định được số ngẫu nhiên và võ hồn được chọn.
   */
  rollShard(id: string, years: number, x: number, y: number) {
    const d = this.pdata.get(id), list = MAPS[this.state.mapId].shards; if (!d || !list.length) return;
    const t = d.testShard;
    if ((t ? t.r : Math.random()) >= shardChance(years)) return;
    const vohon = list[t && t.i >= 0 ? t.i % list.length : Math.floor(Math.random() * list.length)], code = shardCode(vohon), def = itemDef(code);
    if (!def) return;
    const got = this.addItem(d, code, SHARD_QTY);
    if (got) { this.log(id, `Nhận ${got} ${def.name}${this.shardNote(d, code)}.`, def.col); this.sendBag(id); }
    if (got < SHARD_QTY) {
      // Cạnh hồn hoàn nếu chỗ đó đứng được (không thì chồng lên hồn hoàn; nhấn E lần nữa để nhặt nốt).
      const drop = this.map.standable(x + 8, y) ? this.newDrop(x + 8, y, id) : this.newDrop(x, y, id);
      drop.item = code; drop.qty = SHARD_QTY - got;
      this.state.drops.set(uid("d"), drop);
      this.log(id, `Túi đồ đã đầy (${d.bagSlots} ô): ${drop.qty} ${def.name} rơi xuống đất, ${this.lootNote(id, id)}`, "#ffb35c");
    }
  }

  // ---------- Tiên thảo (mục 5.3 "Lạc Nhật Sâm Lâm", 5.7; bước BĐ6b) ----------
  /**
   * Hạ hồn thú ở vùng `zone` (tên vùng nơi hồn thú bị hạ): bản đồ có MapDef.herbs thì tung herbChance (tinh anh x HERB_ELITE); trúng
   * thì 1 tiên thảo ngẫu nhiên trong HERBS vào thẳng túi người hạ như mảnh võ hồn; túi đầy thì rơi xuống đất cạnh hồn hoàn, người hạ ưu
   * tiên nhặt. Hook test `herb` của người hạ cố định được số ngẫu nhiên và loại.
   */
  rollHerb(id: string, zone: string | undefined, x: number, y: number, elite: boolean) {
    const d = this.pdata.get(id), chance = herbChance(this.state.mapId, zone, elite); if (!d || chance <= 0) return;
    const t = d.testHerb;
    if ((t ? t.r : Math.random()) >= chance) return;
    const h = HERBS[t && t.i >= 0 ? t.i % HERBS.length : Math.floor(Math.random() * HERBS.length)], def = itemDef(h.id); if (!def) return;
    this.broadcast("fx", { k: "wave", x, y: y - 6, r: 26, col: h.col });
    if (this.addItem(d, h.id, 1)) { this.log(id, `Tìm được tiên thảo ${h.name}! (túi đồ: dùng cho một võ hồn)`, h.col); this.sendBag(id); return; }
    const drop = this.map.standable(x, y + 8) ? this.newDrop(x, y + 8, id) : this.newDrop(x, y, id);
    drop.item = h.id; drop.qty = 1;
    this.state.drops.set(uid("d"), drop);
    this.log(id, `Túi đồ đã đầy (${d.bagSlots} ô): tiên thảo ${h.name} rơi xuống đất, ${this.lootNote(id, id)}`, "#ffb35c");
  }

  /**
   * Dùng tiên thảo `it` cho võ hồn `raw` (vohons.id, phải là võ hồn của chính người gửi): võ hồn đó +HERB_PCT % chỉ số của loại tiên
   * thảo, vĩnh viễn, mỗi loại tối đa HERB_MAX cây mỗi võ hồn. Dùng được cả khi giao chiến (như lên sao); trong sân đấu thì `use` bị chặn.
   * Bớt 1 cây và ghi số cây trên võ hồn ngay, rồi trong chuỗi lưu ghi võ hồn và túi trong MỘT transaction (store.saveVohonsBag, như
   * lên sao); lỗi thì đánh dấu để lần lưu sau ghi tiếp.
   */
  useHerb(id: string, d: PData, it: Item, raw: unknown) {
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const h = herbDef(it.code), v = d.owned.find((x) => x.rowId === raw); if (!h) return warn("Vật phẩm này không dùng trực tiếp được.");
    if (!v) return warn(`Chọn võ hồn để dùng ${h.name}.`);
    const name = VOHON[Math.max(0, vohonIndex(v.vohon))].name, n = v.herbs[h.id] ?? 0;
    if (n >= HERB_MAX) return warn(`${name} đã dùng đủ ${HERB_MAX} cây ${h.name}.`);
    this.takeItem(d, it, 1);
    v.herbs = { ...v.herbs, [h.id]: n + 1 };
    if (v === d.ch) this.recalc(id, false); else d.dirty.add(v.rowId);
    const p = this.state.players.get(id);
    if (p) this.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 24, col: h.col });
    this.log(id, `${name} dùng ${h.name} (${n + 1}/${HERB_MAX}): tiên thảo đã dùng ${herbText(v.herbs)}.`, h.col);
    const c = this.clients.getById(id); if (c) this.sendVohons(c);
    this.sendBag(id);
    this.chain(d, async () => {
      const list = this.unsaved(id), bag = this.bagSnapshot(d);
      if (!list.some((x) => x.rowId === v.rowId)) list.push({ ...v, rings: [...v.rings], skills: [...v.skills], herbs: { ...v.herbs } });
      try { await store.saveVohonsBag(d.accountId, list, bag); }
      catch (e) { for (const x of list) if (x.rowId !== d.ch.rowId) d.dirty.add(x.rowId); d.bagDirty = true; throw e; }
    });
  }

  /** Tổng số mảnh mã `code` trong túi (mọi ô). */
  shardCount(d: PData, code: string) { return d.bag.reduce((n, i) => n + (i.code === code && i.vohonId === null ? i.qty : 0), 0); }

  /** Bớt `n` mảnh mã `code` khỏi túi, lấy từ các ô ít nhất trước (gọi sau khi đã kiểm tra đủ). */
  takeShards(d: PData, code: string, n: number) {
    for (const it of d.bag.filter((i) => i.code === code && i.vohonId === null).sort((a, b) => a.qty - b.qty)) {
      if (n <= 0) break;
      const k = Math.min(n, it.qty); this.takeItem(d, it, k); n -= k;
    }
  }

  /** Chú thích tiến độ sau khi nhận mảnh: " (12/50)" khi chưa sở hữu, " (8/40 lên 3★)" khi đã sở hữu, "" khi đã tối đa sao. */
  shardNote(d: PData, code: string) {
    const vohon = itemDef(code)?.vohon; if (!vohon) return "";
    const n = this.shardCount(d, code), v = d.owned.find((x) => x.vohon === vohon);
    if (!v) return ` (${n}/${SHARD_UNLOCK})`;
    const cost = starCost(v.stars);
    return cost === null ? "" : ` (${n}/${cost} lên ${v.stars + 1}★)`;
  }

  /**
   * Mở võ hồn `raw` (mã trong VOHON) bằng SHARD_UNLOCK mảnh (mục 5.1): chỉ võ hồn chưa sở hữu. Trừ mảnh ngay (bấm hai lần không
   * tiêu hai lần), rồi trong chuỗi lưu ghi võ hồn mới (cấp 1, 1 sao) và cả túi đồ trong một transaction (store.unlockVohon).
   * DB lỗi hoặc tài khoản đã có võ hồn này thì trả lại mảnh.
   */
  unlockVohon(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const vohon = typeof raw === "string" ? raw : "", vi = vohonIndex(vohon);
    if (vi < 0) return warn("Võ hồn không tồn tại.");
    const name = VOHON[vi].name, code = shardCode(vohon);
    if (d.owned.some((v) => v.vohon === vohon)) return warn(`Đã sở hữu ${name}: dùng mảnh để lên sao.`);
    if (d.shardBusy) return warn("Đang mở võ hồn, đợi một chút.");
    if (claimHeld(d)) return warn(CLAIM_BUSY); // #282: mảnh vừa đổi ở Thương hội còn chờ DB xác nhận lượt, chưa tiêu được
    const have = this.shardCount(d, code);
    if (have < SHARD_UNLOCK) return warn(`Cần ${SHARD_UNLOCK} Mảnh ${name} để mở, mới có ${have}.`);
    this.takeShards(d, code, SHARD_UNLOCK);
    d.shardBusy = true;
    this.sendBag(id);
    // Không mở được thì trả mảnh, kể cả khi túi vừa đầy (không bao giờ mất đồ; ô thêm có thể tạm vượt số ô túi).
    const refund = () => {
      const left = SHARD_UNLOCK - this.addItem(d, code, SHARD_UNLOCK);
      if (left > 0) d.bag.push(...itemStacks(code, left));
      d.bagDirty = true;
    };
    this.chain(d, async () => {
      let v: Character | null;
      try { v = await store.unlockVohon(d.accountId, p.name, vohon, 1, this.bagSnapshot(d)); }
      catch (e) { refund(); throw e; }
      if (!v) { refund(); return; }
      d.owned.push(v);
      this.log(id, `Mở võ hồn ${name}! Đã vào bộ sưu tập (cấp 1, 1★): xếp vào đội ở bảng đội hình (phím V).`, VOHON[vi].col);
      this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã mở võ hồn ${name} bằng ${SHARD_UNLOCK} mảnh.` });
    }).then(() => {
      d.shardBusy = false;
      if (this.pdata.get(id) !== d) return;
      if (!d.owned.some((v) => v.vohon === vohon)) warn(`Chưa mở được ${name}, mảnh đã trả lại túi đồ.`);
      else this.resCheck(id); // cộng minh (8.2): võ hồn mới cũng nhận phần cộng
      const c = this.clients.getById(id); if (c) this.sendVohons(c);
      this.sendBag(id);
    });
  }

  /**
   * Lên sao võ hồn `raw` (mã trong VOHON) đã sở hữu bằng mảnh theo STAR_COST (mục 5.1), tối đa MAX_STARS. Mỗi sao tăng chỉ số
   * gốc (starMult trong calcStats). Đổi trong bộ nhớ ngay, rồi trong chuỗi lưu ghi võ hồn và cả túi đồ trong một transaction
   * (store.saveVohonsBag); lỗi thì đánh dấu lại để lần lưu sau ghi tiếp. Hiệu ứng hồn kỹ theo sao để bước sau.
   */
  starUp(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const vohon = typeof raw === "string" ? raw : "", vi = vohonIndex(vohon), v = d.owned.find((x) => x.vohon === vohon);
    if (vi < 0) return warn("Võ hồn không tồn tại.");
    const name = VOHON[vi].name, code = shardCode(vohon);
    if (!v) return warn(`Chưa sở hữu ${name}: đủ ${SHARD_UNLOCK} mảnh thì mở trước.`);
    if (claimHeld(d)) return warn(CLAIM_BUSY); // #282: như mở võ hồn
    const cost = starCost(v.stars);
    if (cost === null) return warn(`${name} đã đạt ${MAX_STARS}★, không lên sao thêm được.`);
    const have = this.shardCount(d, code);
    if (have < cost) return warn(`Cần ${cost} Mảnh ${name} để lên ${v.stars + 1}★, mới có ${have}.`);
    this.takeShards(d, code, cost);
    v.stars++;
    this.resCheck(id); // cộng minh (8.2): mốc Sao phải cập nhật ngay theo đường starup thật
    if (v === d.ch) this.recalc(id, false); else d.dirty.add(v.rowId);
    this.log(id, `${name} lên ${v.stars}★! Chỉ số gốc tăng.`, VOHON[vi].col);
    const c = this.clients.getById(id); if (c) this.sendVohons(c);
    this.sendBag(id);
    this.chain(d, async () => {
      const list = this.unsaved(id), bag = this.bagSnapshot(d);
      if (!list.some((x) => x.rowId === v.rowId)) list.push({ ...v, rings: [...v.rings] });
      try { await store.saveVohonsBag(d.accountId, list, bag); }
      catch (e) { for (const x of list) if (x.rowId !== d.ch.rowId) d.dirty.add(x.rowId); d.bagDirty = true; throw e; }
    });
  }

  // ---------- Gắn hồn cốt (mục 5.5, bước 4.2) ----------
  /** Hồn cốt đang gắn trên võ hồn `rowId` (món của chính người chơi trong `d.bag`, `vohonId` = rowId); dữ liệu hỏng thì bỏ qua. */
  bonesOn(d: PData, rowId: number) {
    return d.bag.flatMap((it) => {
      const b = it.vohonId === rowId && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
      return b ? [{ it, beast: b.beast, slot: b.slot, years: it.years!, enhance: it.enhance }] : [];
    });
  }
  /** Tổng chỉ số hồn cốt đang gắn trên võ hồn `rowId` (boneBonus: chỉ số chính và dòng phụ), cộng vào calcStats. */
  boneBonusOf(d: PData, rowId: number) { return boneBonus(this.bonesOn(d, rowId).map((b) => ({ ...b, subs: parseBoneSubs(b.it.stats) }))); }
  /**
   * Tung bù dòng phụ hồn cốt (#187) khi nạp túi đồ lúc vào phòng: hồn cốt +N có ít dòng hơn số mốc đã đạt (cường hóa trước khi có
   * dòng phụ, hoặc tạo bằng hook test) được tung phần còn thiếu (boneAddSubs), đánh dấu `bagDirty`; nơi gọi ghi ngay qua chuỗi lưu.
   * Đã đủ dòng thì lần vào sau không tung thêm. Trả số dòng đã thêm.
   */
  fillBoneSubs(d: PData) {
    let n = 0;
    for (const it of d.bag) {
      const bone = it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null; if (!bone) continue;
      const r = boneAddSubs(bone.slot, it.years!, it.enhance, parseBoneSubs(it.stats), Math.random);
      if (r.added.length) { it.stats = { ...(it.stats as object), subs: r.subs }; n += r.added.length; }
    }
    if (n) d.bagDirty = true;
    return n;
  }

  /** Luật chung khi gắn / tháo hồn cốt (từ 5.2 cả hồn hạch: `what`), như xếp đội hình: không gục, không hấp thụ, ngoài giao chiến. "" = được. */
  boneLock(p: PlayerState, d: PData, what = "hồn cốt") {
    if (p.dead) return `Đã gục ngã, không thể gắn / tháo ${what}.`;
    if (d.absorbing) return `Đang hấp thụ hồn hoàn, không thể gắn / tháo ${what}.`;
    if (d.fight < TEAM_COMBAT_SECS) return `Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới gắn / tháo ${what} được.`;
    return "";
  }

  /**
   * Gắn hồn cốt `rawItem` (id ô trong túi) vào võ hồn `rawVohon` (vohons.id) của chính người gửi (mục 5.5). Hồn cốt chỉ vào ô
   * cùng vị trí: client gửi kèm `rawSlot` (ô được thả vào) thì phải đúng vị trí của hồn cốt. Ô đã có hồn cốt thì đổi chỗ, món cũ
   * về túi (số ô túi không đổi nên không cần chỗ trống). Đổi trong bộ nhớ ngay; túi (cả cột vohon_id) ghi DB cùng lần lưu túi
   * kế tiếp (lưu định kỳ, rời phòng, transaction đi cổng). Võ hồn đang ra trận thì chỉ số đổi ngay.
   */
  equipBone(id: string, rawItem: unknown, rawVohon: unknown, rawSlot: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem) : undefined;
    const bone = it && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null;
    if (!it || !bone) return warn("Không có hồn cốt này trong túi đồ.");
    const v = Number.isInteger(rawVohon) ? d.owned.find((x) => x.rowId === rawVohon) : undefined;
    if (!v) return warn("Bạn không sở hữu võ hồn này.");
    if (it.vohonId === v.rowId) return this.sendBag(id);
    if (it.vohonId !== null) return warn("Hồn cốt này đang gắn trên võ hồn khác: tháo ra trước.");
    const slot = BONE_SLOTS[boneSlotIndex(bone.slot)];
    if (rawSlot !== undefined && rawSlot !== null && rawSlot !== bone.slot) {
      const to = BONE_SLOTS[boneSlotIndex(rawSlot)];
      return warn(`Hồn cốt ${slot.name} chỉ gắn vào ô ${slot.name}${to ? `, không gắn vào ô ${to.name}` : ""}.`);
    }
    const lock = this.boneLock(p, d); if (lock) return warn(lock);
    const old = this.bonesOn(d, v.rowId).find((b) => b.slot === bone.slot)?.it;
    if (old) old.vohonId = null;
    it.vohonId = v.rowId; d.bagDirty = true;
    const vname = VOHON[Math.max(0, vohonIndex(v.vohon))].name;
    this.log(id, `Gắn ${this.itemLabel(it)} vào ô ${slot.name} của ${vname}.${old ? ` ${this.itemLabel(old)} về túi đồ.` : ""}`, TIERS[tierOfYears(it.years!)].glow);
    this.questEvent(id, { k: "equip" }); // 6.2
    this.afterBones(id, v);
  }

  /** Tháo hồn cốt `rawItem` đang gắn trên một võ hồn của chính người gửi về túi; túi đầy thì từ chối. Giữ nguyên cấp cường hóa. */
  unequipBone(id: string, rawItem: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem && i.vohonId !== null && i.code === BONE_ITEM) : undefined;
    if (!it) return warn("Hồn cốt này không gắn trên võ hồn nào.");
    const lock = this.boneLock(p, d); if (lock) return warn(lock);
    if (bagUsed(d.bag) >= d.bagSlots) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới tháo được hồn cốt.`);
    const v = d.owned.find((x) => x.rowId === it.vohonId);
    it.vohonId = null; d.bagDirty = true;
    this.log(id, `Tháo ${this.itemLabel(it)}${v ? ` khỏi ${VOHON[Math.max(0, vohonIndex(v.vohon))].name}` : ""} về túi đồ (giữ cường hóa +${it.enhance}).`);
    if (v) this.afterBones(id, v); else this.sendBag(id);
  }

  /**
   * Cường hóa hồn cốt `rawTarget` (id ô của chính người gửi, trong túi hoặc đang gắn) bằng các hồn cốt nguyên liệu `rawMats` (mục
   * 5.5, bước 4.4): nguyên liệu phải là hồn cốt nằm trong túi (không đang gắn), không phải chính nó, không trùng, tối đa
   * BONE_FEED_MAX món. Điểm tính bằng boneEnhancePreview (niên hạn, cùng vị trí +50%, trả lại phần điểm đã nạp vào nguyên liệu),
   * cộng dồn vào `stats.xp`, cấp ở `items.enhance` (tối đa +20, điểm dư bị bỏ). Mỗi mốc BONE_ENHANCE_MILESTONES vượt qua thêm 1 dòng
   * phụ ngẫu nhiên (#187, boneAddSubs, ghi vào `stats.subs`). Phí Hồn Tệ của mọi cấp vừa vượt qua (#281, enhanceFee theo
   * BONE_ENHANCE_FEE) trừ cùng lúc với nguyên liệu; thiếu thì từ chối cả lần, không mất gì. Không bao giờ thất bại, nguyên liệu bị
   * xóa khỏi túi. Cùng luật như gắn / tháo (boneLock: ngoài giao chiến, không gục, không hấp thụ), không đang chuyển bản đồ. Hồn cốt
   * đang gắn thì chỉ số / kỹ năng đổi ngay (afterBones). Ghi DB qua chuỗi lưu (save) như các thay đổi túi đồ khác (túi và Hồn Tệ cùng
   * một transaction); transaction đi cổng cũng mang theo nếu lần lưu này chưa kịp chạy. Lò rèn ở Nặc Đinh Thành
   * (6.1) sẽ mở cùng message này.
   */
  enhanceBone(id: string, rawTarget: unknown, rawMats: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const boneIn = (it: Item | undefined) => (it && it.code === BONE_ITEM && it.years !== null ? parseBone(it.stats) : null);
    const it = typeof rawTarget === "string" ? d.bag.find((i) => i.id === rawTarget) : undefined, bone = boneIn(it);
    if (!it || !bone) return warn("Không có hồn cốt này để cường hóa.");
    if (it.enhance >= BONE_MAX_ENHANCE) return warn(`${this.itemLabel(it)} đã cường hóa tối đa +${BONE_MAX_ENHANCE}.`);
    if (!Array.isArray(rawMats) || !rawMats.length) return warn("Chọn ít nhất một hồn cốt làm nguyên liệu.");
    if (rawMats.length > BONE_FEED_MAX) return warn(`Mỗi lần cường hóa tối đa ${BONE_FEED_MAX} nguyên liệu.`);
    if (new Set(rawMats).size !== rawMats.length) return warn("Nguyên liệu bị chọn trùng.");
    const mats: Item[] = [];
    for (const raw of rawMats) {
      if (raw === it.id) return warn("Không dùng chính hồn cốt đang cường hóa làm nguyên liệu.");
      const m = typeof raw === "string" ? d.bag.find((i) => i.id === raw) : undefined;
      if (!m || !boneIn(m)) return warn("Nguyên liệu phải là hồn cốt trong túi đồ.");
      if (m.vohonId !== null) return warn(`${this.itemLabel(m)} đang gắn trên võ hồn: tháo ra trước mới dùng làm nguyên liệu được.`);
      if (m.locked) return warn(`${this.itemLabel(m)} đang khoá: mở khoá rồi mới dùng làm nguyên liệu được.`);
      mats.push(m);
    }
    const lock = this.boneLock(p, d); if (lock) return warn(lock.replace("gắn / tháo", "cường hóa"));
    const r = boneEnhancePreview({ slot: bone.slot, xp: boneXp(it.stats) },
      mats.map((m) => ({ slot: parseBone(m.stats)!.slot, years: m.years!, xp: boneXp(m.stats) })));
    const fee = enhanceFee(BONE_ENHANCE_FEE, r.from, r.level); // #281: phí mỗi cấp vừa vượt qua, thiếu thì từ chối cả lần
    if (d.honTe < fee) return warn(`Không đủ Hồn Tệ: cường hóa lên +${r.level} cần phí ${formatHonTe(fee)}, đang có ${formatHonTe(d.honTe)}.`);
    const sub = boneAddSubs(bone.slot, it.years!, r.level, parseBoneSubs(it.stats), Math.random); // #187: dòng phụ ở mốc
    const drop = new Set(mats);
    d.bag = d.bag.filter((x) => !drop.has(x));
    it.stats = { ...(it.stats as object), xp: r.xp, ...(sub.added.length ? { subs: sub.subs } : {}) }; it.enhance = r.level; d.honTe -= fee; d.bagDirty = true;
    const up = r.level > r.from ? ` lên +${r.level}` : ` (vẫn +${r.level})`;
    this.log(id, `Cường hóa ${this.itemLabel(it)}${up}: ${mats.length} nguyên liệu, +${r.gain.toLocaleString("vi-VN")} điểm`
      + (fee ? `, phí −${formatHonTe(fee)} (còn ${formatHonTe(d.honTe)})` : "")
      + (r.waste ? ` (dư ${r.waste.toLocaleString("vi-VN")} điểm bị bỏ vì đã tối đa)` : "")
      + sub.added.map(([k, v]) => `; thêm dòng phụ ${coreStatText(k, v)}`).join("") + ".", TIERS[tierOfYears(it.years!)].glow);
    this.clients.getById(id)?.send("enhanced", { id: it.id, from: r.from, to: r.level, gain: r.gain, xp: r.xp, used: mats.length, fee,
      subs: sub.added.map(([k, v]) => ({ k, v })) });
    const v = it.vohonId !== null ? d.owned.find((x) => x.rowId === it.vohonId) : undefined;
    if (v) this.afterBones(id, v); else this.sendBag(id);
    this.save(id); // nguyên liệu đã mất: ghi ngay qua chuỗi lưu
  }

  /**
   * Sau khi gắn / tháo hồn cốt hoặc hồn hạch (5.2) trên võ hồn `v`: võ hồn ra trận thì tính lại chỉ số (và hiệu ứng bộ) ngay; gửi lại
   * túi và sinh lực đội (sinh lực tối đa đổi).
   */
  afterBones(id: string, v: Character) {
    const d = this.pdata.get(id)!;
    if (v === d.ch) this.recalc(id, false);
    this.resCheck(id); // cộng minh (8.2): hồn cốt +10 / hồn hạch 5★ đang gắn
    this.sendBag(id);
    this.sendSquad(id, true);
  }

  // ---------- Trang bị hồn sư (mục 5.15, bước E1) ----------
  /** Tin riêng "gear": các món đang mặc (`slot` = chỉ số trong EQUIP_SLOTS) và chỉ số tổng `st` (equipStats). Chỉ chính chủ; không vào state công khai (riêng bậc áo / mũ đang mặc được đẩy sang `gearAo` / `gearMu`, `gearLook`). */
  sendGear(id: string) {
    const d = this.pdata.get(id), c = this.clients.getById(id); if (!d || !c) return;
    const p = this.state.players.get(id); if (p) gearLook(p, d.gear); // mọi đường đổi d.gear (mặc / tháo / phá huỷ khi cường hóa / hook test) đều gửi tin này
    c.send("gear", { items: d.gear.map((i) => ({ id: i.id, code: i.code, enhance: i.enhance, stats: i.stats, slot: i.equipSlot, ...(i.locked ? { lock: true } : {}) })), st: d.gearSt });
  }
  /** Sau khi đổi trang bị: tính lại chỉ số, báo client, ghi ngay qua chuỗi lưu (túi + ô mặc cùng một transaction). */
  afterGear(id: string, d: PData) {
    d.gearSt = gearStats(d.gear); d.bagDirty = true;
    this.afterBones(id, d.ch); this.sendGear(id);
    void this.save(id);
  }
  /**
   * Mặc trang bị `rawItem` (id món trong túi của chính người gửi): ô lấy từ mẫu của món (EQUIP_TEMPLATES; vòng / nhẫn trái phải là mẫu riêng).
   * Ô đã có món thì đổi chỗ, món cũ về túi đúng chỗ món mới rời (số ô túi không đổi). Cùng luật gắn / tháo hồn cốt (boneLock: ngoài giao chiến,
   * không gục, không hấp thụ); trong sân Đại Đấu Hồn Trường bị chặn (ArenaRoom BLOCKED). Thuộc hồn sư nên cộng cho cả đội; chỉ số tính lại ngay.
   */
  equipGear(id: string, rawItem: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const idx = typeof rawItem === "string" ? d.bag.findIndex((i) => i.id === rawItem && i.vohonId === null && i.code === EQUIP_ITEM) : -1, it = d.bag[idx];
    const e = it ? parseEquip(it.stats) : null, tpl = e ? equipTemplate(e.tpl) : undefined;
    if (!it || !e || !tpl) return warn("Không có trang bị này trong túi đồ.");
    if (claimHeld(d)) return warn(CLAIM_BUSY);
    const lock = this.boneLock(p, d, "trang bị"); if (lock) return warn(lock);
    const slot = equipSlotIndex(tpl.slot), oi = d.gear.findIndex((g) => g.equipSlot === slot), old = d.gear[oi];
    if (old) { d.gear.splice(oi, 1); delete old.equipSlot; }
    it.equipSlot = slot; d.bag.splice(idx, 1, ...(old ? [old] : [])); d.gear.push(it);
    d.lockIds.add(it.id); if (old) d.lockIds.add(old.id);
    this.log(id, `Mặc ${equipName(e.tpl, it.enhance)} (${EQUIP_SLOTS[slot].name}).${old ? ` ${equipName(parseEquip(old.stats)?.tpl, old.enhance)} về túi đồ.` : ""}`, "#e8dcff");
    this.afterGear(id, d);
  }
  /** Tháo trang bị ở ô `rawSlot` (chỉ số 0..9 hoặc mã ô trong EQUIP_SLOTS) về túi; túi đầy thì từ chối. Giữ nguyên cấp cường hóa và chỉ số. */
  unequipGear(id: string, rawSlot: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const slot = typeof rawSlot === "number" && Number.isInteger(rawSlot) ? rawSlot : typeof rawSlot === "string" ? equipSlotIndex(rawSlot) : -1;
    const gi = d.gear.findIndex((g) => g.equipSlot === slot);
    if (gi < 0) return warn("Ô này chưa mặc trang bị nào.");
    if (claimHeld(d)) return warn(CLAIM_BUSY);
    const lock = this.boneLock(p, d, "trang bị"); if (lock) return warn(lock);
    if (bagUsed(d.bag) >= d.bagSlots) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới tháo được trang bị.`);
    const [it] = d.gear.splice(gi, 1); delete it.equipSlot; d.bag.push(it); d.lockIds.add(it.id);
    this.log(id, `Tháo ${equipName(parseEquip(it.stats)?.tpl, it.enhance)} về túi đồ.`);
    this.afterGear(id, d);
  }

  /** Món trang bị `raw` của chính chủ, trong túi hoặc đang mặc (undefined nếu không có / không phải trang bị). */
  equipOf(d: PData, raw: unknown) {
    if (typeof raw !== "string") return undefined;
    const it = d.bag.find((i) => i.id === raw && i.vohonId === null && i.code === EQUIP_ITEM) ?? d.gear.find((i) => i.id === raw && i.code === EQUIP_ITEM);
    return it && parseEquip(it.stats) ? it : undefined;
  }
  /** Số vật phẩm mã `code` trong túi (mọi ô gộp, kể cả ô khóa). */
  countOf(d: PData, code: string) { return d.bag.reduce((n, i) => (i.code === code && i.vohonId === null ? n + i.qty : n), 0); }
  /** Trừ `n` vật phẩm mã `code` (đã kiểm đủ); trả hàm hoàn lại đúng ô cũ, dùng khi transaction lưu thất bại (equipEnhance). */
  spendItem(d: PData, code: string, n: number) {
    const undo: { it: Item; n: number; at: number; gone: boolean }[] = [];
    let left = n;
    for (const it of [...d.bag]) {
      if (left <= 0) break;
      if (it.code !== code || it.vohonId !== null) continue;
      const k = Math.min(left, it.qty), at = d.bag.indexOf(it);
      undo.push({ it, n: k, at, gone: k >= it.qty }); this.takeItem(d, it, k); left -= k;
    }
    return () => { for (const u of undo.reverse()) { if (u.gone) { u.it.qty = u.n; d.bag.splice(Math.min(u.at, d.bag.length), 0, u.it); } else u.it.qty += u.n; } d.bagDirty = true; };
  }

  /**
   * `equipenhpreview {id}` trả "equipenhp" cho bảng Thợ rèn: nấc cường hóa tiếp theo (tỉ lệ, đá, phí, hậu quả khi thất bại) và số đá / bùa /
   * Hồn Tệ đang có. Chỉ đọc, không ghi gì.
   */
  equipEnhancePreview(id: string, rawId: unknown) {
    const d = this.pdata.get(id), c = this.clients.getById(id); if (!d || !c) return;
    const it = this.equipOf(d, rawId); if (!it) return;
    const step = equipEnhanceStep(it.enhance), stone = step ? EQUIP_STONES[step.stone] : null;
    c.send("equipenhp", { id: it.id, enhance: it.enhance, to: step ? it.enhance + 1 : null, p: step?.p ?? 0, fail: step?.fail ?? null,
      stone: stone?.id ?? null, qty: step?.qty ?? 0, have: stone ? this.countOf(d, stone.id) : 0, fee: step?.fee ?? 0, honTe: d.honTe, charm: this.countOf(d, EQUIP_CHARM), busy: d.enhBusy });
  }

  /**
   * Cường hóa trang bị `rawId` (E3, mục 5.15) ở Thợ rèn: +1 → +15 theo EQUIP_ENHANCE. Đá và phí trừ **trước** khi tung, cả khi thất bại;
   * `charm` (người chơi chọn dùng Bùa Hộ Mệnh) chỉ trừ bùa khi nấc phá hủy và thất bại thật sự xảy ra. Server tung (`testEnh` chỉ có khi GAME_TEST).
   * Chống nhân đồ / đua lệnh: một lệnh đang xử lý (`enhBusy`) thì lệnh tới sau bị từ chối ngay; lệnh chạy trong chuỗi lưu của tài khoản, đổi túi
   * trong bộ nhớ rồi ghi MỘT transaction (saveBag: khóa dòng tài khoản, rồi dòng món theo id tăng dần kèm kiểm cấp lưu, `Bag.lock`); lỗi ghi thì
   * hoàn lại đá, phí, bùa, món về như trước và gửi lại túi. Phá hủy: món bị xóa khỏi túi / ô mặc (DELETE trong transaction). `claimBusy` chặn bán / bỏ đồ
   * trong lúc chờ DB. Món đang mặc cường hóa được, chỉ số tính lại ngay. Ngoài giao chiến và gần Thợ rèn (cùng luật coreset).
   */
  equipEnhance(id: string, rawId: unknown, charm: boolean) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    if (d.enhBusy) return this.log(id, "Đang xử lý lệnh cường hóa trước, đợi một chút.", "#ffb35c");
    d.enhBusy = true; d.claimBusy++;
    this.chain(d, () => this.itemLocked(id, [rawId], async () => {
      const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); this.equipEnhancePreview(id, rawId); };
      if (d.testEnhSlow) await new Promise((r) => setTimeout(r, d.testEnhSlow));
      const it = this.equipOf(d, rawId), e = it ? parseEquip(it.stats) : null; if (!it || !e) return warn("Không có trang bị này để cường hóa.");
      const npc = this.npcNear(id, { role: "forge" }); if (!npc) return warn("Hãy lại gần Thợ rèn hơn để cường hóa trang bị.");
      const lock = this.boneLock(p, d, "trang bị"); if (lock) return warn(lock.replace("gắn / tháo", "cường hóa"));
      const step = equipEnhanceStep(it.enhance); if (!step) return warn(`${this.itemLabel(it)} đã cường hóa tối đa +${EQUIP_MAX_ENHANCE}.`);
      const stone = EQUIP_STONES[step.stone], label = this.itemLabel(it), from = it.enhance, wear = it.equipSlot !== undefined;
      if (this.countOf(d, stone.id) < step.qty) return warn(`Không đủ ${stone.name}: lên +${from + 1} cần ${step.qty}, đang có ${this.countOf(d, stone.id)}.`);
      if (d.honTe < step.fee) return warn(`Không đủ Hồn Tệ: lên +${from + 1} cần phí ${formatHonTe(step.fee)}, đang có ${formatHonTe(d.honTe)}.`);
      if (charm && step.fail.kind === "destroy" && !this.countOf(d, EQUIP_CHARM)) return warn("Không có Bùa Hộ Mệnh trong túi đồ.");
      const undoStone = this.spendItem(d, stone.id, step.qty);
      d.honTe -= step.fee;
      const ok = (d.testEnh ?? Math.random()) < step.p, res = equipEnhanceResult(from, ok, charm)!;
      const undoCharm = res.charmUsed ? this.spendItem(d, EQUIP_CHARM, 1) : () => {};
      const at = (wear ? d.gear : d.bag).indexOf(it);
      if (res.destroyed) (wear ? d.gear : d.bag).splice(at, 1); else it.enhance = res.enhance;
      d.bagDirty = true;
      try { await store.saveBag(d.accountId, { ...this.bagSnapshot(d), lock: [{ id: it.id, enhance: from }] }); }
      catch (err) {
        // Hoàn lại trên d.bag / d.gear / d.honTe HIỆN TẠI (trong lúc chờ DB có thể nhặt thêm đồ / Hồn Tệ): cộng lại đúng phần đã trừ, không gán giá trị cũ.
        undoCharm(); undoStone(); d.honTe += step.fee; it.enhance = from;
        if (res.destroyed) { const home = wear ? d.gear : d.bag; home.splice(Math.min(at, home.length), 0, it); }
        d.bagDirty = true;
        if (wear) { d.gearSt = gearStats(d.gear); this.afterBones(id, d.ch); this.sendGear(id); }
        this.sendBag(id);
        warn("Không lưu được lần cường hóa, đã hoàn lại đá, phí và món đồ. Thử lại sau."); throw err;
      }
      const verb = res.destroyed ? `thất bại, ${label} đã bị PHÁ HỦY` : ok ? `thành công lên +${res.enhance}` : res.charmUsed ? `thất bại, Bùa Hộ Mệnh giữ nguyên +${res.enhance}`
        : res.enhance < from ? `thất bại, tụt xuống +${res.enhance}` : `thất bại, giữ +${res.enhance}`;
      this.log(id, `Cường hóa ${res.destroyed ? label : equipName(e.tpl, from)} → +${from + 1}: ${verb} (−${step.qty} ${stone.name}, phí −${formatHonTe(step.fee)}${res.charmUsed ? ", −1 Bùa Hộ Mệnh" : ""}).`,
        ok ? "#9cff9c" : res.destroyed ? "#ff5a5a" : "#ffb35c");
      this.clients.getById(id)?.send("equipenhd", { id: it.id, from, to: res.destroyed ? null : res.enhance, ok, destroyed: res.destroyed, charmUsed: res.charmUsed, stone: stone.id, qty: step.qty, fee: step.fee });
      if (wear) { d.gearSt = gearStats(d.gear); this.afterBones(id, d.ch); this.sendGear(id); }
      this.sendBag(id);
      if (!res.destroyed) this.equipEnhancePreview(id, it.id);
    })).then(() => { d.enhBusy = false; d.claimBusy--; });
  }

  /**
   * Khắc may mắn của một món: `luck` hiện tại, bước kế (`equipLuckStep`) và lý do không khắc được (`slot` ô không có may mắn, `max` món đã đạt
   * EQUIP_LUCK_MAX, `worn` tổng hai ô đang mặc đã đạt EQUIP_LUCK_MAX). Món đang mặc tính trần theo tổng hai ô, món trong túi theo chính nó.
   */
  luckInfo(d: PData, it: Item, e: EquipData) {
    const wear = it.equipSlot !== undefined, slotOk = !!equipSlotDef(equipTemplate(e.tpl)?.slot).luck, wornLuck = d.gear.reduce((n, g) => n + (parseEquip(g.stats)?.luck ?? 0), 0);
    const step = slotOk ? equipLuckStep(e.luck, wear ? wornLuck : null) : null;
    return { wear, step, reason: !slotOk ? "slot" : step ? null : e.luck >= EQUIP_LUCK_MAX ? "max" : "worn" };
  }
  /** `equipluckpreview {id}` trả "equipluckp": tỉ lệ khắc may mắn kế tiếp, số Thần Hồn đang có, lý do bị chặn. Chỉ đọc. `busy`: lệnh sắp xong gửi false (cờ `enhBusy` chưa nhả). */
  equipLuckPreview(id: string, rawId: unknown, busy?: boolean) {
    const d = this.pdata.get(id), c = this.clients.getById(id); if (!d || !c) return;
    const it = this.equipOf(d, rawId), e = it ? parseEquip(it.stats) : null; if (!it || !e) return;
    const { step, reason } = this.luckInfo(d, it, e);
    c.send("equipluckp", { id: it.id, luck: e.luck, to: step?.to ?? null, p: step?.p ?? 0, reason, soul: this.countOf(d, EQUIP_SOUL), max: EQUIP_LUCK_MAX, busy: busy ?? d.enhBusy });
  }
  /**
   * Khắc may mắn (Thợ rèn): tốn 1 Thần Hồn mỗi lần, may mắn n → n + 1 với tỉ lệ EQUIP_LUCK_UP[n] (server tung; `testEnh` chỉ có khi GAME_TEST). Thất bại
   * mất Thần Hồn, giữ may mắn, KHÔNG phá món, không phí Hồn Tệ. Chỉ vũ khí / dây chuyền (ô `luck`). Chặn khi món đã đạt EQUIP_LUCK_MAX, món đang mặc
   * chặn khi tổng hai ô đã đạt EQUIP_LUCK_MAX. Cùng hàng đợi / khóa / transaction ghi như cường hóa; lỗi ghi thì hoàn lại Thần Hồn và may mắn.
   */
  equipLuck(id: string, rawId: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    if (d.enhBusy) return this.log(id, "Đang xử lý lệnh Thợ rèn trước, đợi một chút.", "#ffb35c");
    d.enhBusy = true; d.claimBusy++;
    this.chain(d, () => this.itemLocked(id, [rawId], async () => {
      const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); this.equipLuckPreview(id, rawId); };
      if (d.testEnhSlow) await new Promise((r) => setTimeout(r, d.testEnhSlow));
      const it = this.equipOf(d, rawId), e = it ? parseEquip(it.stats) : null; if (!it || !e) return warn("Không có trang bị này để khắc may mắn.");
      const npc = this.npcNear(id, { role: "forge" }); if (!npc) return warn("Hãy lại gần Thợ rèn hơn để khắc may mắn.");
      const lock = this.boneLock(p, d, "trang bị"); if (lock) return warn(lock.replace("gắn / tháo", "khắc may mắn"));
      const label = this.itemLabel(it), { wear, step, reason } = this.luckInfo(d, it, e);
      if (!step) return warn(reason === "slot" ? `${label} không khắc may mắn được (chỉ vũ khí và dây chuyền).`
        : reason === "max" ? `${label} đã đạt may mắn tối đa ${EQUIP_LUCK_MAX}.` : `Tổng may mắn hai ô đang mặc đã đạt tối đa ${EQUIP_LUCK_MAX}.`);
      if (this.countOf(d, EQUIP_SOUL) < 1) return warn("Không có Thần Hồn trong túi đồ.");
      const undoSoul = this.spendItem(d, EQUIP_SOUL, 1), from = e.luck;
      const ok = (d.testEnh ?? Math.random()) < step.p, was = it.stats;
      if (ok) it.stats = { tpl: e.tpl, ilvl: e.ilvl, roll: e.roll, affixes: e.affixes.map(([k, v]) => [k, v]), luck: step.to };
      d.bagDirty = true;
      try { await store.saveBag(d.accountId, { ...this.bagSnapshot(d), lock: [{ id: it.id, enhance: it.enhance }] }); }
      catch (err) {
        undoSoul(); it.stats = was; d.bagDirty = true;
        if (wear) { d.gearSt = gearStats(d.gear); this.afterBones(id, d.ch); this.sendGear(id); }
        this.sendBag(id);
        warn("Không lưu được lần khắc may mắn, đã hoàn lại Thần Hồn và món đồ. Thử lại sau."); throw err;
      }
      this.log(id, `Khắc may mắn ${equipName(e.tpl, it.enhance)} M${from} → M${from + 1}: ${ok ? "thành công" : `thất bại, giữ M${from}`} (−1 ${itemDef(EQUIP_SOUL)?.name ?? "Thần Hồn"}).`, ok ? "#9cff9c" : "#ffb35c");
      this.clients.getById(id)?.send("equipluckd", { id: it.id, from, to: ok ? step.to : from, ok });
      if (wear) { d.gearSt = gearStats(d.gear); this.afterBones(id, d.ch); this.sendGear(id); }
      this.sendBag(id);
      this.equipLuckPreview(id, it.id, false);
    })).then(() => { d.enhBusy = false; d.claimBusy--; });
  }

  /**
   * Thêm `qty` món mã `code` vào túi (addItem) và trả `got` (số đã nhận) cùng hàm hoàn lại ĐÚNG phần vừa thêm trên túi hiện tại (ô mới bị bỏ,
   * ô gộp bớt đúng số vừa cộng): dùng khi transaction lưu thất bại mà trong lúc chờ DB túi có thể đã nhận thêm đồ.
   */
  addTracked(d: PData, code: string, qty: number) {
    const before = new Map(d.bag.filter((i) => i.code === code && i.vohonId === null).map((i) => [i, i.qty] as const));
    const got = this.addItem(d, code, qty);
    const delta = d.bag.filter((i) => i.code === code && i.vohonId === null).map((i) => ({ it: i, n: i.qty - (before.get(i) ?? 0) })).filter((x) => x.n > 0);
    return { got, undo: () => { for (const x of delta) x.it.qty -= x.n; d.bag = d.bag.filter((i) => i.qty > 0); d.bagDirty = true; } };
  }
  /** Bỏ các món `its` khỏi túi (ghi nhớ vị trí); trả hàm đặt lại đúng chỗ cũ (theo thứ tự ngược). */
  removeTracked(d: PData, its: Item[]) {
    const gone = its.map((it) => { const at = d.bag.indexOf(it); d.bag.splice(at, 1); return { it, at }; });
    d.bagDirty = true;
    return () => { for (const g of [...gone].reverse()) d.bag.splice(Math.min(g.at, d.bag.length), 0, g.it); d.bagDirty = true; };
  }
  /**
   * Chạy `run` khi giữ khóa Redis `lock:item:<id>` của các món `rawIds` (#559; chỉ khi chạy nhiều tiến trình, `withItemLocks`): món đang bị tiến trình /
   * phiên khác xử lý thì từ chối "đang xử lý" (như claimBusy), Redis lỗi thì từ chối luôn (fail-closed); cả hai trường hợp `run` không chạy nên không đổi gì.
   * Lỗi của chính `run` (vd. ghi DB) vẫn ném lên chuỗi lưu như trước.
   */
  async itemLocked(id: string, rawIds: unknown[], run: () => Promise<void>, quiet = false) {
    const ids = rawIds.filter((x): x is string => typeof x === "string");
    let ran = false;
    try { await withItemLocks(presenceBackend, ids, async () => { ran = true; await run(); }); }
    catch (e) {
      if (ran) throw e;
      if (!quiet) this.log(id, e instanceof ItemLockBusy ? "Trang bị này đang được xử lý, đợi một chút." : "Không khóa được trang bị lúc này, thử lại sau.", "#ffb35c");
      if (!(e instanceof ItemLockBusy)) console.error(`Không lấy được khóa Redis món đồ của tài khoản ${this.pdata.get(id)?.accountId}`, e);
      this.sendBag(id);
    }
  }
  /**
   * Hàng đợi chung của các lệnh Thợ rèn trang bị mới (hợp thành, phân giải; E4): cờ `enhBusy` như cường hóa (E3), một lệnh đang xử lý thì lệnh tới
   * sau bị từ chối ngay, lệnh chạy trong chuỗi lưu của tài khoản; `claimBusy` chặn bán / bỏ đồ trong lúc chờ DB. `quiet`: lệnh tự động, không báo từ chối.
   */
  forgeLane(id: string, d: PData, run: () => Promise<void>, quiet = false, rawIds: unknown[] = []) {
    if (d.enhBusy) { if (!quiet) this.log(id, "Đang xử lý lệnh Thợ rèn trước, đợi một chút.", "#ffb35c"); return; }
    d.enhBusy = true; d.claimBusy++;
    this.chain(d, async () => {
      if (d.testEnhSlow) await new Promise((r) => setTimeout(r, d.testEnhSlow));
      await this.itemLocked(id, rawIds, run, quiet);
    }).then(() => { d.enhBusy = false; d.claimBusy--; });
  }
  /** Các món trang bị trong túi (không tính món đang mặc) theo danh sách id, kèm dữ liệu đã đọc; trả chuỗi lỗi nếu có id lạ, trùng, đang mặc hoặc khóa. */
  equipBagItems(d: PData, ids: unknown[]) {
    const out: { it: Item; e: NonNullable<ReturnType<typeof parseEquip>>; tier: number; slot: string }[] = [];
    for (const raw of ids) {
      if (typeof raw !== "string" || out.some((x) => x.it.id === raw)) return "Danh sách trang bị không hợp lệ.";
      if (d.gear.some((g) => g.id === raw)) return "Trang bị đang mặc: hãy tháo về túi trước.";
      const it = d.bag.find((i) => i.id === raw && i.vohonId === null && i.code === EQUIP_ITEM), e = it ? parseEquip(it.stats) : null, tpl = e ? equipTemplate(e.tpl) : undefined;
      if (!it || !e || !tpl) return "Không có trang bị này trong túi đồ.";
      if (it.locked) return `${this.itemLabel(it)} đang khóa.`;
      out.push({ it, e, tier: tpl.tier, slot: tpl.slot });
    }
    return out;
  }

  /**
   * Hợp thành 3 → 1 (E4, mục 5.15) ở Thợ rèn: món chính `rawMain` + 2 hiến tế `rawSac` (id trong túi) cùng bậc, cùng ô, không khóa, không đang mặc ra
   * 1 món bậc kế (EQUIP_SYNTH). Phí Hồn Tệ và Tinh Hoa trừ trước khi tung, cả khi thất bại. Thành công: mẫu ngẫu nhiên cùng ô, ilvl cao nhất trong ba
   * món, `enhance` = floor(món chính × EQUIP_SYNTH_KEEP). Thất bại theo equipSynthOutcome (mất 2 hiến tế; T3 → T4 món chính −1 cấp; T4 → T5 mất cả
   * ba, hoàn một phần Tinh Hoa). Chống nhân đồ như cường hóa: hàng đợi `forgeLane`, đổi túi trong bộ nhớ rồi ghi MỘT transaction (saveBag + khóa cấp),
   * lỗi ghi thì hoàn lại đúng phần đã đổi và gửi lại túi.
   */
  equipSynth(id: string, rawMain: unknown, rawSac: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    if (!Array.isArray(rawSac) || rawSac.length !== 2) return this.log(id, "Hợp thành cần 1 món chính và đúng 2 món hiến tế.", "#ffb35c");
    this.forgeLane(id, d, async () => {
      const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
      const list = this.equipBagItems(d, [rawMain, ...rawSac]); if (typeof list === "string") return warn(list);
      const [main, ...sac] = list, tier = main.tier, step = equipSynthStep(tier);
      if (list.some((x) => x.tier !== tier || x.slot !== main.slot)) return warn("Ba món phải cùng bậc và cùng ô trang bị.");
      if (!step) return warn(`${EQUIP_TIERS[tier].name} đã là bậc cao nhất, không hợp thành được nữa.`);
      if (!this.npcNear(id, { role: "forge" })) return warn("Hãy lại gần Thợ rèn hơn để hợp thành trang bị.");
      const lock = this.boneLock(p, d, "trang bị"); if (lock) return warn(lock.replace("gắn / tháo", "hợp thành"));
      const next = EQUIP_TEMPLATES.filter((t) => t.slot === main.slot && t.tier === tier + 1 && t.w > 0), wsum = next.reduce((a, t) => a + t.w, 0);
      if (!next.length) return warn("Không có mẫu trang bị bậc kế cho ô này.");
      if (d.honTe < step.fee) return warn(`Không đủ Hồn Tệ: hợp thành cần phí ${formatHonTe(step.fee)}, đang có ${formatHonTe(d.honTe)}.`);
      if (this.countOf(d, EQUIP_ESSENCE) < step.essence) return warn(`Không đủ Tinh Hoa Đường Môn: cần ${step.essence}, đang có ${this.countOf(d, EQUIP_ESSENCE)}.`);
      const undoEss = step.essence ? this.spendItem(d, EQUIP_ESSENCE, step.essence) : () => {};
      d.honTe -= step.fee;
      const ok = (d.testSyn ?? Math.random()) < step.p, res = equipSynthOutcome(tier, main.it.enhance, ok)!, fromEnh = main.it.enhance;
      const label = this.itemLabel(main.it), mainId = main.it.id;
      const redo: (() => void)[] = [undoEss];
      let made: Item | null = null, refund = 0;
      if (res.ok) {
        redo.push(this.removeTracked(d, list.map((x) => x.it)));
        let r = Math.random() * wsum, tpl = next[next.length - 1]; for (const t of next) { if ((r -= t.w) < 0) { tpl = t; break; } }
        made = newItem(itemDef(EQUIP_ITEM)!, 1); made.stats = rollEquip(tpl, Math.max(...list.map((x) => x.e.ilvl)), Math.random); made.enhance = res.enhance; d.bag.push(made);
      } else if (res.main === null) {
        redo.push(this.removeTracked(d, list.map((x) => x.it)));
        if (res.refund > 0) { const t = this.addTracked(d, EQUIP_ESSENCE, res.refund); refund = t.got; redo.push(t.undo); }
      } else {
        redo.push(this.removeTracked(d, sac.map((x) => x.it))); main.it.enhance = res.main; d.bagDirty = true;
      }
      const undoAll = () => { if (made) d.bag = d.bag.filter((i) => i !== made); for (const f of [...redo].reverse()) f(); main.it.enhance = fromEnh; d.honTe += step.fee; d.bagDirty = true; };
      try { await store.saveBag(d.accountId, { ...this.bagSnapshot(d), lock: list.map((x) => ({ id: x.it.id, enhance: x.it === main.it ? fromEnh : x.it.enhance })) }); }
      catch (err) { undoAll(); this.sendBag(id); warn("Không lưu được lần hợp thành, đã hoàn lại món đồ, phí và Tinh Hoa. Thử lại sau."); throw err; }
      const cost = `phí −${formatHonTe(step.fee)}${step.essence ? `, −${step.essence} Tinh Hoa Đường Môn` : ""}`;
      const text = res.ok ? `thành công: ${this.itemLabel(made!)} (+${made!.enhance})`
        : res.main === null ? `thất bại, mất cả 3 món${refund ? `, hoàn ${refund} Tinh Hoa Đường Môn` : ""}` : `thất bại, mất 2 món hiến tế${res.main < fromEnh ? `, ${label} tụt xuống +${res.main}` : ""}`;
      this.log(id, `Hợp thành ${EQUIP_TIERS[tier].name} → ${EQUIP_TIERS[tier + 1].name} ${text} (${cost}).`, res.ok ? "#9cff9c" : "#ffb35c");
      this.clients.getById(id)?.send("equipsynd", { ok: res.ok, from: tier, main: mainId, made: made?.id ?? null, enhance: res.ok ? res.enhance : res.main, fee: step.fee, essence: step.essence, refund });
      this.sendBag(id);
    }, false, [rawMain, ...rawSac]);
  }

  /**
   * Phân giải hàng loạt (E4, mục 5.15) ở Thợ rèn (hoặc tự phân giải khi `auto`): các món `rawIds` (≤ EQUIP_SALVAGE_MAX, trong túi, không khóa, không đang mặc) →
   * Hồn Tệ và nguyên liệu theo equipSalvage; KHÔNG cho kinh nghiệm. Cả lượt là một transaction (saveBag): túi không đủ chỗ cho nguyên liệu thì từ chối cả lượt,
   * không mất món; lỗi ghi thì hoàn lại. Tự phân giải (tùy chọn, mặc định tắt) chạy im lặng, không cần đứng gần Thợ rèn, không qua `boneLock`.
   */
  salvageEquip(id: string, rawIds: unknown, auto = false) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    if (!Array.isArray(rawIds) || !rawIds.length) return auto ? undefined : this.log(id, "Chưa chọn trang bị nào để phân giải.", "#ffb35c");
    if (rawIds.length > EQUIP_SALVAGE_MAX) return this.log(id, `Mỗi lần phân giải tối đa ${EQUIP_SALVAGE_MAX} món.`, "#ffb35c");
    this.forgeLane(id, d, async () => {
      const warn = (text: string) => { if (auto) return; this.log(id, text, "#ffb35c"); this.sendBag(id); };
      const list = this.equipBagItems(d, rawIds); if (typeof list === "string") return warn(list);
      if (!auto) {
        if (!this.npcNear(id, { role: "forge" })) return warn("Hãy lại gần Thợ rèn hơn để phân giải trang bị.");
        const lock = this.boneLock(p, d, "trang bị"); if (lock) return warn(lock.replace("gắn / tháo", "phân giải"));
      }
      let coin = 0; const mats = new Map<string, number>();
      for (const x of list) {
        const r = equipSalvage(x.tier, x.it.enhance, () => d.testSyn ?? Math.random());
        coin += r.coin; for (const m of r.items) mats.set(m.code, (mats.get(m.code) ?? 0) + m.qty);
      }
      const redo: (() => void)[] = [this.removeTracked(d, list.map((x) => x.it))], honTe0 = d.honTe;
      this.addCoin(d, coin); const gain = d.honTe - honTe0;
      const undoAll = () => { for (const f of [...redo].reverse()) f(); d.honTe -= gain; d.bagDirty = true; };
      for (const [code, qty] of mats) {
        const t = this.addTracked(d, code, qty); redo.push(t.undo);
        if (t.got < qty) { undoAll(); return warn(`Túi đồ không đủ chỗ cho ${itemDef(code)?.name ?? code}: bỏ bớt vật phẩm rồi phân giải lại (không mất món nào).`); }
      }
      try { await store.saveBag(d.accountId, { ...this.bagSnapshot(d), lock: list.map((x) => ({ id: x.it.id, enhance: x.it.enhance })) }); }
      catch (err) { undoAll(); this.sendBag(id); warn("Không lưu được lần phân giải, đã hoàn lại. Thử lại sau."); throw err; }
      const items = [...mats].map(([code, qty]) => ({ code, qty })), what = items.map((m) => `${m.qty} ${itemDef(m.code)?.name ?? m.code}`).join(", ");
      this.log(id, `${auto ? "Tự phân giải" : "Phân giải"} ${list.length} trang bị: +${formatHonTe(gain)}${what ? `, ${what}` : ""}.`, "#f2c84b");
      this.clients.getById(id)?.send("equipsalvd", { n: list.length, coin: gain, items, auto });
      this.sendBag(id);
    }, auto, rawIds);
  }
  /** Tự phân giải trang bị (E4, tùy chọn, mặc định tắt): túi còn dưới AUTO_SELL_FREE ô trống thì phân giải các món hợp bộ lọc (equipAutoSalvageable). Thử lại không quá 1 lần / 5 giây. */
  autoSalvage(id: string) {
    const d = this.pdata.get(id); if (!d || d.sellCfg.salv <= 0 || d.enhBusy || d.travelling || d.travelCast || d.absorbing || claimHeld(d) || d.shardBusy) return;
    if (this.map.kind === "arena" || d.bagSlots - bagUsed(d.bag) >= AUTO_SELL_FREE || Date.now() < d.salvAt) return;
    const ids = d.bag.filter((i) => equipAutoSalvageable({ ...i, vohon: i.vohonId }, d.sellCfg)).slice(0, EQUIP_SALVAGE_MAX).map((i) => i.id);
    if (!ids.length) return;
    d.salvAt = Date.now() + 5000;
    this.salvageEquip(id, ids, true);
  }

  // ---------- Gắn hồn hạch (mục 5.6, bước 5.2) ----------
  /** Hồn hạch đang gắn trên võ hồn `rowId` (món của chính người chơi, `vohonId` = rowId), kèm ô (coreSlotOf); dữ liệu hỏng thì bỏ qua. */
  coresOn(d: PData, rowId: number) {
    return d.bag.flatMap((it) => {
      const c = it.vohonId === rowId && it.code === CORE_ITEM ? parseCore(it.stats) : null;
      return c ? [{ it, stars: it.stars ?? 1, data: c, enhance: it.enhance, slot: coreSlotOf(it.stats) }] : [];
    });
  }
  /** Tổng chỉ số hồn hạch đang gắn trên võ hồn `rowId` (coreBonus, kèm phần chỉ số của bộ), cộng vào calcStats. */
  coreBonusOf(d: PData, rowId: number) { return this.withGear(d, coreBonus(this.coresOn(d, rowId))); }
  /** Cộng chỉ số trang bị hồn sư đang mặc (thuộc hồn sư, dùng chung mọi võ hồn) vào bảng chỉ số kiểu hồn hạch; cùng đơn vị với coreBonus. */
  withGear(d: PData, b: Record<CoreStat, number>) {
    const out = { ...b };
    for (const k of CORE_STAT_IDS) out[k] = Math.round((out[k] + d.gearSt.bonus[k]) * 10) / 10;
    return out;
  }
  /** Câu báo khi bộ `set` trên võ hồn `rowId` vừa đủ 2 / 4 món ("" nếu không). */
  coreSetNote(d: PData, rowId: number, set: string) {
    const n = coreSetCounts(this.coresOn(d, rowId)).get(set) ?? 0, cs = CORE_SETS[coreSetIndex(set)];
    if (!cs || (n !== CORE_SET_2 && n !== CORE_SET_4)) return "";
    return ` Kích hoạt bộ ${cs.name} ${n} món: ${n === CORE_SET_4 ? cs.set4 : cs.set2}.`;
  }

  /**
   * Gắn hồn hạch `rawItem` (id ô trong túi) vào ô `rawSlot` (0..CORE_SLOTS − 1; bỏ trống thì ô trống đầu tiên) của võ hồn `rawVohon`
   * (vohons.id) của chính người gửi (mục 5.6). Ô nào cũng nhận mọi hồn hạch. Ô đã có thì đổi chỗ, món cũ về túi (số ô túi không đổi);
   * hồn hạch đang gắn trên chính võ hồn đó thì chuyển sang ô kia (hai ô đổi chỗ cho nhau). Cùng luật với hồn cốt (boneLock), không
   * đang chuyển bản đồ. Đổi trong bộ nhớ ngay; ghi DB cùng lần lưu túi kế tiếp (ô ở `items.stats.slot`, võ hồn ở `items.vohon_id`;
   * lưu định kỳ, rời phòng, transaction đi cổng). Võ hồn đang ra trận thì chỉ số và hiệu ứng bộ đổi ngay.
   */
  equipCore(id: string, rawItem: unknown, rawVohon: unknown, rawSlot: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem) : undefined;
    const core = it && it.code === CORE_ITEM ? parseCore(it.stats) : null;
    if (!it || !core) return warn("Không có hồn hạch này trong túi đồ.");
    const v = Number.isInteger(rawVohon) ? d.owned.find((x) => x.rowId === rawVohon) : undefined;
    if (!v) return warn("Bạn không sở hữu võ hồn này.");
    if (it.vohonId !== null && it.vohonId !== v.rowId) return warn("Hồn hạch này đang gắn trên võ hồn khác: tháo ra trước.");
    const vname = VOHON[Math.max(0, vohonIndex(v.vohon))].name, worn = this.coresOn(d, v.rowId);
    const full = `${vname} đã đủ ${CORE_SLOTS} hồn hạch: chọn một ô để thay.`;
    let slot: number;
    if (rawSlot === undefined || rawSlot === null) {
      if (it.vohonId === v.rowId) return this.sendBag(id);
      slot = [...Array(CORE_SLOTS).keys()].find((s) => !worn.some((w) => w.slot === s)) ?? -1;
      if (slot < 0) return warn(full);
    } else if (typeof rawSlot === "number" && Number.isInteger(rawSlot) && rawSlot >= 0 && rawSlot < CORE_SLOTS) slot = rawSlot;
    else return warn(`Ô hồn hạch không hợp lệ: chỉ có ô 1–${CORE_SLOTS}.`);
    const lock = this.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock);
    const st = (x: Item) => x.stats as Record<string, unknown>, ow = worn.find((w) => w.slot === slot && w.it !== it), old = ow?.it;
    const oldName = ow ? coreName(ow.data.set, ow.stars, ow.it.enhance) : "";
    if (it.vohonId === v.rowId) {
      // Đổi chỗ trong cùng võ hồn: chỉ số và bộ không đổi.
      const from = coreSlotOf(it.stats); if (from === slot) return this.sendBag(id);
      if (old) { if (from >= 0) st(old).slot = from; else delete st(old).slot; }
      st(it).slot = slot; d.bagDirty = true;
      this.log(id, `Chuyển ${this.itemLabel(it)} sang ô ${slot + 1} của ${vname}.${old && from >= 0 ? ` ${oldName} sang ô ${from + 1}.` : ""}`);
      return this.sendBag(id);
    }
    if (!old && worn.length >= CORE_SLOTS) return warn(full);
    if (old) { old.vohonId = null; delete st(old).slot; }
    it.vohonId = v.rowId; st(it).slot = slot; d.bagDirty = true;
    this.log(id, `Gắn ${this.itemLabel(it)} vào ô ${slot + 1} của ${vname}.${old ? ` ${oldName} về túi đồ.` : ""}${this.coreSetNote(d, v.rowId, core.set)}`,
      CORE_SETS[coreSetIndex(core.set)]?.col);
    this.questEvent(id, { k: "equip" }); // 6.2
    this.afterBones(id, v);
  }

  /** Tháo hồn hạch `rawItem` đang gắn trên một võ hồn của chính người gửi về túi; túi đầy thì từ chối. Giữ nguyên cấp nâng cấp. */
  unequipCore(id: string, rawItem: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem && i.vohonId !== null && i.code === CORE_ITEM) : undefined;
    if (!it) return warn("Hồn hạch này không gắn trên võ hồn nào.");
    const lock = this.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock);
    if (bagUsed(d.bag) >= d.bagSlots) return warn(`Túi đồ đã đầy (${d.bagSlots} ô): bỏ bớt vật phẩm rồi mới tháo được hồn hạch.`);
    const v = d.owned.find((x) => x.rowId === it.vohonId);
    it.vohonId = null; if (it.stats && typeof it.stats === "object") delete (it.stats as Record<string, unknown>).slot; d.bagDirty = true;
    this.log(id, `Tháo ${this.itemLabel(it)}${v ? ` khỏi ${VOHON[Math.max(0, vohonIndex(v.vohon))].name}` : ""} về túi đồ (giữ nâng cấp +${it.enhance}).`);
    if (v) this.afterBones(id, v); else this.sendBag(id);
  }

  /**
   * Nâng cấp hồn hạch `rawTarget` (id ô của chính người gửi, trong túi hoặc đang gắn) bằng các hồn hạch nguyên liệu `rawMats` (mục
   * 5.6, bước 5.3): nguyên liệu phải là hồn hạch nằm trong túi (không đang gắn), không phải chính nó, không trùng, tối đa
   * CORE_FEED_MAX món; một món sai thì cả lần bị từ chối, không mất gì. Điểm tính bằng coreEnhancePreview (theo sao, cùng bộ thêm,
   * trả lại phần điểm đã nạp vào nguyên liệu), cộng dồn vào `stats.xp`, cấp ở `items.enhance` (tối đa +15, điểm dư bị bỏ). Mỗi mốc
   * +3 / +6 / +9 / +12 / +15 vượt qua thì tăng 1 dòng phụ ngẫu nhiên (coreUpgradeSubs, ghi vào `stats.subs`). Phí Hồn Tệ như hồn
   * cốt (#281, CORE_ENHANCE_FEE): thiếu thì từ chối cả lần. Không bao giờ thất bại, nguyên liệu bị xóa khỏi túi. Cùng luật như gắn
   * / tháo (boneLock), không đang chuyển bản đồ. Đang gắn thì chỉ số đổi ngay (afterBones). Ghi DB qua chuỗi lưu (save) như cường hóa hồn cốt; transaction đi cổng cũng mang theo nếu lần lưu chưa kịp chạy.
   */
  enhanceCore(id: string, rawTarget: unknown, rawMats: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const coreIn = (it: Item | undefined) => (it && it.code === CORE_ITEM ? parseCore(it.stats) : null);
    const it = typeof rawTarget === "string" ? d.bag.find((i) => i.id === rawTarget) : undefined, core = coreIn(it);
    if (!it || !core) return warn("Không có hồn hạch này để nâng cấp.");
    if (it.enhance >= CORE_MAX_ENHANCE) return warn(`${this.itemLabel(it)} đã nâng cấp tối đa +${CORE_MAX_ENHANCE}.`);
    if (!Array.isArray(rawMats) || !rawMats.length) return warn("Chọn ít nhất một hồn hạch làm nguyên liệu.");
    if (rawMats.length > CORE_FEED_MAX) return warn(`Mỗi lần nâng cấp tối đa ${CORE_FEED_MAX} nguyên liệu.`);
    if (new Set(rawMats).size !== rawMats.length) return warn("Nguyên liệu bị chọn trùng.");
    const mats: Item[] = [];
    for (const raw of rawMats) {
      if (raw === it.id) return warn("Không dùng chính hồn hạch đang nâng cấp làm nguyên liệu.");
      const m = typeof raw === "string" ? d.bag.find((i) => i.id === raw) : undefined;
      if (!m || !coreIn(m)) return warn("Nguyên liệu phải là hồn hạch trong túi đồ.");
      if (m.vohonId !== null) return warn(`${this.itemLabel(m)} đang gắn trên võ hồn: tháo ra trước mới dùng làm nguyên liệu được.`);
      if (m.locked) return warn(`${this.itemLabel(m)} đang khoá: mở khoá rồi mới dùng làm nguyên liệu được.`);
      mats.push(m);
    }
    const lock = this.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock.replace("gắn / tháo", "nâng cấp"));
    const stars = it.stars ?? 1, r = coreEnhancePreview({ set: core.set, xp: coreXp(it.stats), subs: core.subs.length },
      mats.map((m) => ({ set: parseCore(m.stats)!.set, stars: m.stars ?? 1, xp: coreXp(m.stats) })));
    const fee = enhanceFee(CORE_ENHANCE_FEE, r.from, r.level); // #281: như hồn cốt
    if (d.honTe < fee) return warn(`Không đủ Hồn Tệ: nâng cấp lên +${r.level} cần phí ${formatHonTe(fee)}, đang có ${formatHonTe(d.honTe)}.`);
    const up = coreUpgradeSubs(core, stars, r.rolls, Math.random), label = this.itemLabel(it); // tên trước khi lên cấp
    const drop = new Set(mats);
    d.bag = d.bag.filter((x) => !drop.has(x));
    it.stats = { ...(it.stats as object), subs: up.data.subs, xp: r.xp }; it.enhance = r.level; d.honTe -= fee; d.bagDirty = true;
    const lv = r.level > r.from ? ` lên +${r.level}` : ` (vẫn +${r.level})`;
    // "thêm dòng phụ Công +3,2%" / "dòng phụ Sinh lực +150 (tăng +62)"
    const subs = up.ups.map((u) => (u.add ? `thêm dòng phụ ${coreStatText(u.k, u.v)}`
      : `dòng phụ ${coreStatText(u.k, u.to)} (tăng +${coreStatText(u.k, u.v).split(" +").pop()})`));
    this.log(id, `Nâng cấp ${label}${lv}: ${mats.length} nguyên liệu, +${r.gain.toLocaleString("vi-VN")} điểm`
      + (fee ? `, phí −${formatHonTe(fee)} (còn ${formatHonTe(d.honTe)})` : "")
      + (r.waste ? ` (dư ${r.waste.toLocaleString("vi-VN")} điểm bị bỏ vì đã tối đa)` : "") + (subs.length ? `; ${subs.join("; ")}` : "") + ".",
      CORE_SETS[coreSetIndex(core.set)]?.col);
    this.clients.getById(id)?.send("enhancedcore", { id: it.id, from: r.from, to: r.level, gain: r.gain, xp: r.xp, used: mats.length, fee, subs: up.ups });
    const v = it.vohonId !== null ? d.owned.find((x) => x.rowId === it.vohonId) : undefined;
    if (v) this.afterBones(id, v); else this.sendBag(id);
    this.save(id); // nguyên liệu đã mất: ghi ngay qua chuỗi lưu
  }

  /**
   * Đổi bộ hồn hạch `rawItem` (id ô của chính người gửi, trong túi hoặc đang gắn) sang bộ `rawSet` ở Thợ rèn (mục 5.6 "Đổi bộ",
   * #283): phải đứng trong NPC_RANGE của Thợ rèn (`rawNpc` = mã Thợ rèn đang mở hộp thoại, thiếu thì Thợ rèn gần nhất), ngoài giao
   * chiến (boneLock); bộ đích phải có trong CORE_SETS và khác bộ hiện tại; phí coreResetFee(sao) mỗi lần, thiếu thì từ chối.
   * Chỉ đổi `stats.set` (giữ sao, cấp, điểm, chỉ số chính, dòng phụ, khoá). Đang gắn thì tính lại hiệu ứng bộ ngay (afterBones).
   * Ghi món và Hồn Tệ cùng một lần qua chuỗi lưu (save).
   */
  resetCoreSet(id: string, rawItem: unknown, rawSet: unknown, rawNpc: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => { this.log(id, text, "#ffb35c"); this.sendBag(id); };
    const it = typeof rawItem === "string" ? d.bag.find((i) => i.id === rawItem) : undefined, core = it && it.code === CORE_ITEM ? parseCore(it.stats) : null;
    if (!it || !core) return warn("Không có hồn hạch này để đổi bộ.");
    const npc = typeof rawNpc === "string" ? this.npcNear(id, { id: rawNpc }) : this.npcNear(id, { role: "forge" });
    if (!npc || npcDef(npc.id)?.role !== "forge") return warn("Hãy lại gần Thợ rèn hơn để đổi bộ hồn hạch.");
    const lock = this.boneLock(p, d, "hồn hạch"); if (lock) return warn(lock.replace("gắn / tháo", "đổi bộ"));
    if (typeof rawSet !== "string" || coreSetIndex(rawSet) < 0) return warn("Bộ hồn hạch không hợp lệ.");
    if (rawSet === core.set) return warn(`${this.itemLabel(it)} đã thuộc ${coreSetName(rawSet)}.`);
    const fee = coreResetFee(it.stars ?? 1);
    if (d.honTe < fee) return warn(`Không đủ Hồn Tệ: đổi bộ cần phí ${formatHonTe(fee)}, đang có ${formatHonTe(d.honTe)}.`);
    const from = coreSetName(core.set), label = this.itemLabel(it);
    it.stats = { ...(it.stats as object), set: rawSet }; d.honTe -= fee; d.bagDirty = true;
    this.log(id, `Đổi bộ ${label}: ${from} → ${coreSetName(rawSet)}, phí −${formatHonTe(fee)} (còn ${formatHonTe(d.honTe)}).`, CORE_SETS[coreSetIndex(rawSet)].col);
    const v = it.vohonId !== null ? d.owned.find((x) => x.rowId === it.vohonId) : undefined;
    if (v) this.afterBones(id, v); else this.sendBag(id);
    this.save(id);
  }

  // ---------- Hồn hoàn ----------
  /**
   * Hấp thụ hồn hoàn trong túi vào một võ hồn (mục 5.2 "Hấp thụ", bước 3.3). Client gửi id ô và `vohonId` (vohons.id; thiếu thì
   * võ hồn đang ra trận); server kiểm tra ô thuộc túi và võ hồn thuộc bộ sưu tập của chính người gửi. Chỉ khi võ hồn ở bình cảnh
   * và không giao chiến; vượt giới hạn của vòng (RING_LIMIT) thì thất bại theo bảng ABSORB_FAIL, vượt > 100% thì không cho.
   * Hồn hoàn nằm trong túi suốt lúc hấp thụ (absorbSecs theo số năm): di chuyển hoặc bị đánh thì hủy, không mất gì.
   */
  tryAbsorb(c: Client, raw: unknown, rawVohon: unknown) {
    const id = c.sessionId, p = this.state.players.get(id), d = this.pdata.get(id);
    if (!p || !d || p.dead || d.absorbing || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    if (d.travelCast) return warn("Đang đi qua cổng, không thể hấp thụ.");
    if (claimHeld(d)) return warn(CLAIM_BUSY); // #165: hồn hoàn boss thế giới vào túi trước khi DB xác nhận lượt
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined;
    if (!it || it.code !== RING_ITEM || it.years === null) return warn("Hãy chọn một hồn hoàn trong túi đồ để hấp thụ (phím B).");
    const v = rawVohon === undefined || rawVohon === null ? d.ch : d.owned.find((x) => x.rowId === rawVohon);
    if (!v) return warn("Bạn không sở hữu võ hồn này.");
    if (v === d.ch) this.syncCh(id);
    const name = VOHON[Math.max(0, vohonIndex(v.vohon))].name, slot = v.rings.length + 1, years = it.years;
    if (v.rings.length >= MAX_RINGS) return warn(`${name} đã đủ ${MAX_RINGS} hồn hoàn, không hấp thụ thêm được.`);
    if (!atBottleneck(v.level, v.rings.length)) return warn(`${name} cần đạt cấp ${slot * 10} (bình cảnh) mới hấp thụ được hồn hoàn thứ ${slot}.`);
    if (d.fight < TEAM_COMBAT_SECS) return warn(`Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới hấp thụ được.`);
    const ch = absorbChance(years, slot);
    if (ch.fail === null) return warn(`Hồn hoàn ${formatYears(years)} vượt giới hạn vòng thứ ${slot} (${formatYears(ch.limit)}) tới ${ch.over}%: cơ thể không chịu nổi, không thể hấp thụ.`);
    const dur = absorbSecs(years);
    d.absorbing = { itemId: it.id, rowId: v.rowId, slot, years, t: 0, dur, fail: ch.fail };
    p.absorbTier = tierOfYears(years); p.absorb = 0.001;
    c.send("absorbing", { on: true, rowId: v.rowId, years, slot, secs: dur, over: ch.over, fail: ch.fail });
    const secs = `${String(dur).replace(".", ",")} giây`;
    if (ch.fail) this.log(id, `Bắt đầu hấp thụ hồn hoàn ${formatYears(years)} vào ${name}: vượt giới hạn ${ch.over}%, ${Math.round(ch.fail * 100)}% thất bại (mất hồn hoàn). Cần ${secs}.`, "#ffb35c");
    else this.log(id, `Bắt đầu hấp thụ hồn hoàn ${formatYears(years)} vào ${name} (${secs}). Đừng di chuyển và đừng để bị tấn công.`);
    this.dailyBag(id); // #165: hồn hoàn đang hấp thụ không còn tính cho bài khảo hạch nộp hồn hoàn
  }

  /** Hủy hấp thụ (di chuyển, bị đánh): không mất gì, hồn hoàn vẫn trong túi. */
  cancelAbsorb(id: string, text: string) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d?.absorbing) return;
    const a = d.absorbing; d.absorbing = null; p.absorb = 0;
    this.clients.getById(id)?.send("absorbing", { on: false, result: "cancel", rowId: a.rowId, years: a.years });
    this.log(id, text, "#ffb35c");
    this.dailyBag(id); // hồn hoàn lại tính cho bài khảo hạch nộp hồn hoàn
  }

  /**
   * Hết thời gian hấp thụ: server tung kết quả (hook test `roll` cố định được số ngẫu nhiên). Thành công hay thất bại hồn hoàn đều
   * rời túi; thất bại không phạt gì thêm. Thành công: lưu số năm vào vòng, lên 1 cấp (tối đa MAX_LEVEL). Hồn kỹ vòng 5–10 chưa có
   * (bước 8.1): vòng 5+ chỉ tăng chỉ số qua calcStats.
   */
  finishAbsorb(id: string) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!, a = d.absorbing!, c = this.clients.getById(id);
    d.absorbing = null; p.absorb = 0;
    const it = d.bag.find((i) => i.id === a.itemId), v = d.owned.find((x) => x.rowId === a.rowId);
    if (v === d.ch) this.syncCh(id);
    // Hồn hoàn hoặc võ hồn không còn đúng như lúc bắt đầu: bỏ qua, không mất gì.
    if (!it || it.years !== a.years || !v || v.rings.length + 1 !== a.slot || !atBottleneck(v.level, v.rings.length)) {
      c?.send("absorbing", { on: false, result: "cancel", rowId: a.rowId, years: a.years });
      this.dailyBag(id);
      return;
    }
    const years = a.years, tier = tierOfYears(years), age = formatYears(years), name = VOHON[Math.max(0, vohonIndex(v.vohon))].name;
    // Thành công hay thất bại hồn hoàn đều rời túi (thất bại là vỡ tan).
    this.takeItem(d, it, 1); this.sendBag(id);
    const roll = d.testRoll ?? Math.random();
    if (roll < a.fail) {
      c?.send("absorbing", { on: false, result: "fail", rowId: v.rowId, years, slot: a.slot });
      this.log(id, `Thất bại! Hồn hoàn ${age} vỡ tan (vượt giới hạn vòng thứ ${a.slot}). ${name} không bị tổn hại gì thêm.`, "#ff8a8a");
      this.save(id); return;
    }
    v.rings.push(years); v.level = Math.min(MAX_LEVEL, v.level + 1); v.xp = 0;
    const n = v.rings.length;
    if (v === d.ch) {
      this.showVohon(p, v); d.ringYears = [...v.rings];
      this.recalc(id, true);
      this.broadcast("fx", { k: "absorbed", id, tier });
    } else {
      d.dirty.add(v.rowId);
      if (!d.down.has(v.rowId)) d.benchHp.delete(v.rowId); // lên cấp thì hồi đầy, như benchXp
    }
    c?.send("absorbing", { on: false, result: "ok", rowId: v.rowId, years, slot: n, level: v.level });
    if (!a.fail) this.questEvent(id, { k: "absorb" }); // 6.2: chỉ hồn hoàn không vượt giới hạn của vòng
    // Từ 8.1a: vòng 5–10 mở hồn kỹ / Chân Thân nếu võ hồn đã có dữ liệu; chưa có thì vòng này chỉ tăng chỉ số.
    const nk = ringSkill(v.vohon, n - 1), ct = n === CHAN_THAN_RING ? chanThanOf(v.vohon) : null;
    const sk = nk ? ` Nhận Hồn kỹ vòng ${n}: ${nk.name}${n > LOADOUT_SIZE ? " (xếp vào 4 ô mang theo ở bảng đội hình, phím V)" : ""}.`
      : ct ? ` Mở Võ Hồn Chân Thân: ${ct.name} (phím R).` : " Võ hồn này chưa có hồn kỹ vòng này (bản sau); vòng này tăng chỉ số.";
    const lv = n >= MAX_RINGS ? ` Đủ ${MAX_RINGS} hồn hoàn, cấp tối đa ${v.level}.` : ` Lên cấp ${v.level}.`;
    this.log(id, `Hấp thụ thành công hồn hoàn ${age} vào ${name} (vòng ${n})!${lv}${sk}`, TIERS[tier].glow);
    this.broadcast("chat", { name: "Hệ thống", text: `${p.name} đã hấp thụ hồn hoàn thứ ${n} (${age}) cho ${name}.` });
    if (c) this.sendVohons(c);
    this.resCheck(id); // cộng minh (8.2): tổng hồn hoàn, võ hồn cấp 30+
    this.save(id);
  }

  // ---------- Hồn thú ----------
  /**
   * Sinh một hồn thú trong vùng `zi`: tuổi ngẫu nhiên trong khoảng `years` của vùng (bảng 5.3; vùng thiếu `years` thì tung bậc
   * theo `weights` rồi tung tuổi trong bậc), loài theo trọng số `beasts` của vùng. Mỗi phòng tối đa 1 hồn thú thường
   * MAX_YEARS năm cùng lúc (mục 5.3, `redFree`): đã có thì tung dưới mức đó. Từ BĐ6d vùng có mức trên MAX_YEARS (Hải Thần Uyên) ra
   * đúng MAX_YEARS với tỉ lệ RED_BEAST_CHANCE (hook test `red` cố định được), còn lại dưới MAX_YEARS. Không sinh trong vùng an toàn,
   * cách người chơi dưới 140 pixel, hay trong SPAWN_CLEAR quanh trại cổng, cổng và điểm xuất hiện (map.nearGate: hồn thú lang thang
   * không tới đánh người vừa tới nơi, vừa hồi sinh, đang niệm cổng).
   */
  spawnBeast(zi: number) {
    const z = this.map.zones[zi], hasRed = !this.redFree();
    let years: number;
    if (z.years) {
      const hi = Math.min(z.years[1], MAX_YEARS - 1);
      const red = z.years[1] >= MAX_YEARS && !hasRed && (this.testRed ?? Math.random()) < RED_BEAST_CHANCE;
      if (!red && hi < z.years[0]) return;
      years = red ? MAX_YEARS : rollYears(z.years[0], hi, Math.random());
    } else {
      let r = Math.random(), tier = 0;
      for (let i = 0; i < z.weights.length; i++) { r -= z.weights[i]; if (r <= 0) { tier = i; break; } }
      if (tier === TIERS.length - 1 && hasRed) tier--;
      const [lo, hi] = tierBand(tier);
      years = rollYears(lo, hi, Math.random());
    }
    const species = this.pickSpecies(zi);
    for (let k = 0; k < 40; k++) {
      const x = z.x0 + 8 + Math.random() * (z.x1 - z.x0 - 16), y = z.y0 + 24 + Math.random() * (z.y1 - z.y0 - 48);
      if (this.map.hits(x, y, 6, 4) || this.map.inSafe(x, y) || this.map.nearGate(x, y)) continue;
      if ([...this.state.players.values()].some((p) => Math.hypot(p.x - x, p.y - y) < 140)) continue;
      this.addBeast(zi, years, species, x, y);
      return;
    }
  }

  /** Kênh này chưa có hồn thú THƯỜNG nào MAX_YEARS năm (mục 5.3: tối đa 1 con; tinh anh, thú vương, boss không tính). */
  redFree() { for (const b of this.state.beasts.values()) if (!b.rank && b.years >= MAX_YEARS) return false; return true; }

  /**
   * Thêm hồn thú `years` năm: bậc (màu, kích thước) suy từ số năm, máu và sát thương tăng liên tục theo số năm (beastStats).
   * `rank` 1 (tinh anh, BĐ4): `species` là chỉ số trong BOSSES; máu x ELITE.hp, sát thương x ELITE.dmg so với loài gốc cùng năm,
   * 2 chiêu báo trước của BOSSES (không phụ thuộc mốc 1.000 năm).
   * `rank` 2 (tà hóa thú vương, BĐ5): máu x BossDef.hp, sát thương x KING.dmg; chiêu giai đoạn 1 của BOSSES, giai đoạn 2 thêm khi
   * còn KING.phaseHp máu; `slot` / `life`: khung giờ đã sinh và số giây trước khi rút đi.
   */
  addBeast(zi: number, years: number, species: number, x: number, y: number, rank = 0, slot = 0, life: number = KING.lifeSecs) {
    // Từ BĐ6e `rank` 3 (boss thế giới): máu x WORLD.hp, sát thương x WORLD.dmg, dùng bộ máy thú vương (KingData.world).
    const st = beastStats(years), b = new BeastState(), boss = rank >= 1 && rank <= 3 ? BOSSES[species] : undefined;
    const world = boss?.rank === 3, king = boss?.rank === 2 || world;
    const hp = Math.round(st.hp * (!boss ? 1 : world ? WORLD.hp : king ? boss.hp ?? 6 : ELITE.hp));
    b.x = x; b.y = y; b.years = years; b.tier = tierOfYears(years); b.species = species; b.rank = boss ? boss.rank : 0; b.hp = b.maxHp = hp;
    b.phase = king ? 1 : 0; b.parts = boss ? 1 : 0;
    const id = uid("b"); this.state.beasts.set(id, b); this.interest.beasts.put(id, x, y);
    const sk = boss ? null : beastSkillOf(BEASTS[species]?.id ?? "", years);
    this.bdata.set(id, { zone: zi, hx: x, hy: y, tx: x, ty: y, wt: 0, cd: 0, kx: 0, ky: 0, target: null, hitBy: null, anim: 0, ret: 0, rooted: isRooted(b.rank, species), reach: 0,
      st: new Map(), dotT: 0, calm: 99, regen: 0, dmg: st.dmg * (!boss ? 1 : world ? WORLD.dmg : king ? KING.dmg : ELITE.dmg), def: beastDefOf(b.rank, species, years),
      skills: boss ? boss.skills.map((def) => ({ def, cd: 0 })) : sk ? [{ def: sk, cd: 0 }] : [], skT: 0, cast: null,
      buffs: new Map(), minions: new Set(),
      elite: boss ? { base: hp, n: 1, engaged: false, parts: new Map(), lonely: 0, dropT: 0, dmgBy: new Map(), supBy: new Map(), acc: new Map(), rageCd: 0,
        form: boss.forms ? Math.floor(Math.random() * boss.forms.forms.length) : 0, formT: boss.forms?.every ?? 0,
        king: king ? { def: boss, slot, life, phase: 1, roar: 0, spd: 1, noted: new Set(), rankT: 0, world: world ? newWorld(boss) : null } : null } : null });
    const bd = this.bdata.get(id)!; if (bd.rooted) bd.reach = rootedReach(b.tier, bd.skills.map((s) => s.def));
    if (boss?.forms) b.form = bd.elite!.form + 1;
    return id;
  }

  // ---------- Tinh anh (mục 5.4, bước BĐ4) ----------
  /**
   * Sinh tinh anh của ô `i` ở điểm ngẫu nhiên trong chữ nhật `elite`: niên hạn = mức trên của vùng (mục 5.4), không sinh trong vùng an
   * toàn, quanh trại cổng / cổng / điểm xuất hiện (SPAWN_CLEAR) hay sát người chơi (thử lại sau 5 giây). `announce`: báo cả bản đồ.
   */
  spawnElite(i: number, announce: boolean) {
    const slot = this.elites[i], { spot } = slot, z = this.map.zones[spot.zone], def = BOSSES[spot.boss];
    const years = z.years ? z.years[1] : tierBand(z.weights.reduce((t, w, k) => (w > 0 ? k : t), 0))[1];
    for (let k = 0; k < 40; k++) {
      const x = spot.x + 6 + Math.random() * Math.max(0, spot.w - 12), y = spot.y + 6 + Math.random() * Math.max(0, spot.h - 12);
      if (this.map.hits(x, y, 6, 4) || this.map.inSafe(x, y) || this.map.nearGate(x, y)) continue;
      if ([...this.state.players.values()].some((p) => Math.hypot(p.x - x, p.y - y) < 140)) continue;
      slot.bid = this.addBeast(spot.zone, years, spot.boss, x, y, 1);
      if (announce) this.broadcast("elite", { k: "spawn", name: beastName(1, spot.boss), zone: z.name, x, y, col: def.aura });
      return;
    }
    slot.t = 5;
  }

  /** Sát thương đòn thường hiện tại của hồn thú (đánh thường và bội số chiêu): Cuồng nộ cộng thêm ELITE_RAGE.dmg. */
  beastDmg(bd: BData) { return bd.dmg * (bd.buffs.has("rage") ? 1 + ELITE_RAGE.dmg : 1) * (bd.elite?.king?.world?.rage ? WORLD.rageDmg : 1); } // boss thế giới nổi giận (BĐ6e)
  syncBeastBuff(b: BeastState, bd: BData) { let m = 0; for (const k of bd.buffs.keys()) m |= beastBuffBit(k); b.buff = m; }

  /**
   * Hồn sư `by` sắp gây sát thương lên tinh anh (mục 5.4 "Máu tăng theo số người tham gia"): lần đầu bị đánh thì bắt đầu giao chiến,
   * mọi hồn sư trong ELITE.radius thành người tham gia; sau đó ai gây sát thương cũng thành người tham gia. Số người tăng thì máu tối
   * đa tăng ngay, máu hiện tại giữ tỉ lệ. Hồi máu / tạo khiên cho người tham gia khác chưa tính: hồi máu và khiên hiện chỉ cho đội võ
   * hồn của chính hồn sư.
   */
  eliteJoin(b: BeastState, bd: BData, by: string) {
    const e = bd.elite!;
    if (!e.engaged) {
      e.engaged = true; e.lonely = 0;
      this.state.players.forEach((p, pid) => {
        if (!this.pdata.get(pid)?.travelling && this.inFight(b, e, p)) this.joinFight(e, pid);
      });
    }
    this.joinFight(e, by);
    this.eliteScale(b, e);
  }

  /** Bán kính giao chiến (mục 5.4): tinh anh ELITE.radius pixel quanh thân, thú vương cả hang (object `boss`). */
  inFight(b: BeastState, e: EliteData, p: PlayerState) {
    return e.king ? this.map.inLair(p.x, p.y) : Math.hypot(p.x - b.x, p.y - b.y) <= ELITE.radius;
  }

  /** Thêm người tham gia; thú vương: người đã hết lượt nhận thưởng hôm nay được nhắc một lần mỗi trận (mục 5.4). */
  joinFight(e: EliteData, pid: string) {
    if (e.parts.has(pid)) return;
    e.parts.set(pid, 0);
    const d = this.pdata.get(pid); if (d) e.acc.set(pid, d.accountId); // #119: vào lại thì lần nhắc hết lượt (noted) cũng chuyển sang phiên mới
    const world = !!e.king?.world, K = bossK(e.king), what = world ? "boss thế giới" : "thú vương";
    if (e.king && d && !e.king.noted.has(pid) && this.claimsToday(d, world) >= K.daily) {
      e.king.noted.add(pid);
      this.log(pid, `Hôm nay đã hết lượt nhận thưởng ${what} (${K.daily}/${K.daily}): vẫn đánh và nhận kinh nghiệm được, nhưng không nhận ${world ? "hồn hoàn và rương" : "rương"}. Lượt mới lúc 00:00 giờ Việt Nam.`, "#ffb35c");
    }
  }

  /** Áp số người tham gia vào máu: tăng thì ngay, giảm tối đa 1 mỗi ELITE.dropEvery giây; máu hiện tại giữ tỉ lệ phần trăm. */
  eliteScale(b: BeastState, e: EliteData) {
    const want = Math.max(1, e.parts.size);
    let n = e.n;
    if (want > n) n = want;
    else if (want < n && e.dropT <= 0) { n--; e.dropT = e.king ? bossK(e.king).dropEvery : ELITE.dropEvery; }
    if (n === e.n) return;
    const ratio = b.hp / Math.max(1, b.maxHp);
    e.n = n; b.parts = n; b.maxHp = Math.round(e.base * bossHpMult(n));
    if (b.hp > 0) b.hp = Math.max(1, Math.min(b.maxHp, Math.round(ratio * b.maxHp)));
  }

  /**
   * Mỗi tick của tinh anh: Cuồng nộ (máu dưới ELITE_RAGE.hp), loại người tham gia đã rời phòng / ở ngoài bán kính ELITE.outSecs giây
   * liên tục, bỏ giao chiến sau ELITE.idleSecs giây không còn người tham gia nào trong bán kính. Hook test `etick` gọi với `dt` lớn.
   */
  /**
   * Đổi dạng (#173, BossDef.forms; tinh anh Song Sắc Mãng): mỗi `every` giây sang dạng kế tiếp (báo cả vùng gần bằng `fx form`), `warn`
   * giây cuối của dạng thì `formWarn` (client nhấp nháy màu dạng sắp tới). Chạy cả khi chưa giao chiến để người tới gần thấy dạng thật.
   */
  tickForm(bid: string, b: BeastState, e: EliteData, fd: FormDef, dt: number) {
    if ((e.formT -= dt) <= 0) {
      e.form = (e.form + 1) % fd.forms.length; e.formT += fd.every; if (e.formT <= 0) e.formT = fd.every;
      b.form = e.form + 1;
      const f = fd.forms[e.form]; this.broadcast("fx", { k: "form", bid, name: f.name, col: f.col, x: b.x, y: b.y });
    }
    const warn = e.formT <= fd.warn; if (b.formWarn !== warn) b.formWarn = warn;
  }

  tickElite(bid: string, b: BeastState, bd: BData, dt: number) {
    const e = bd.elite!, k = e.king;
    e.rageCd = Math.max(0, e.rageCd - dt); e.dropT = Math.max(0, e.dropT - dt);
    const rage = bd.buffs.get("rage"), forms = BOSSES[b.species]?.forms;
    if (forms) this.tickForm(bid, b, e, forms, dt);
    if (k) { if (this.tickKing(bid, b, bd, k, dt)) return; } // thú vương: rút đi, giai đoạn 2 (không có Cuồng nộ)
    else if (rage !== undefined) {
      if (rage - dt <= 0) { bd.buffs.delete("rage"); e.rageCd = ELITE_RAGE.cd; this.syncBeastBuff(b, bd); } else bd.buffs.set("rage", rage - dt);
    } else if (e.rageCd <= 0 && b.hp > 0 && b.hp < b.maxHp * ELITE_RAGE.hp) {
      bd.buffs.set("rage", ELITE_RAGE.secs); this.syncBeastBuff(b, bd);
      this.broadcast("fx", { k: "rage", bid, name: BEAST_BUFFS.rage.name });
    }
    if (!e.engaged) return;
    let near = false;
    const outSecs = k ? bossK(k).outSecs : ELITE.outSecs, idleSecs = k ? bossK(k).idleSecs : ELITE.idleSecs;
    for (const [pid, out] of e.parts) {
      const p = this.state.players.get(pid);
      if (!p || this.pdata.get(pid)?.travelling) { e.parts.delete(pid); continue; } // rời phòng, mất kết nối, đi cổng
      if (this.inFight(b, e, p)) { near = true; e.parts.set(pid, 0); }
      else if (out + dt >= outSecs) e.parts.delete(pid);
      else e.parts.set(pid, out + dt);
    }
    if (near) e.lonely = 0;
    else if ((e.lonely += dt) >= idleSecs) return this.eliteReset(bid, b, bd);
    this.eliteScale(b, e);
    // Bảng xếp hạng sát thương chỉ gửi cho người tham gia (đang áp vào máu hoặc đã có đóng góp), không phủ màn hình người đứng xem.
    if (k && (k.rankT -= dt) <= 0) {
      k.rankT = 1;
      const msg = { k: "rank", bid, ...this.kingRank(e) };
      for (const pid of new Set([...e.parts.keys(), ...this.contributors(e)])) this.clients.getById(pid)?.send("boss", msg);
    }
  }

  /** Bỏ giao chiến (mục 5.4): về chỗ sinh, hồi đầy máu (1 người), xóa người tham gia, đóng góp, trạng thái và hiệu ứng có lợi. */
  eliteReset(bid: string, b: BeastState, bd: BData) {
    const e = bd.elite!;
    this.cancelCast(bid, b, bd);
    e.engaged = false; e.parts.clear(); e.dmgBy.clear(); e.supBy.clear(); e.acc.clear(); e.lonely = 0; e.n = 1; b.parts = 1; e.dropT = 0; e.rageCd = 0;
    bd.st.clear(); bd.buffs.clear(); this.syncStatus(b, bd); this.syncBeastBuff(b, bd);
    // Thú vương (BĐ5): về giai đoạn 1, bỏ chiêu giai đoạn 2; cả phòng được báo (thanh máu và bảng xếp hạng đặt lại).
    if (e.king) {
      const k = e.king; k.phase = 1; b.phase = 1; k.roar = 0; k.spd = 1; k.noted.clear(); k.rankT = 0;
      bd.skills = k.def.skills.map((def) => ({ def, cd: 0 }));
      // Boss thế giới (BĐ6e): cơ chế, điểm yếu, khiên, lặn về như lúc mới sinh; đã quá giờ nổi giận thì tick sau nổi giận lại.
      if (k.world) { k.world = newWorld(k.def); b.weak = 0; b.shield = 0; b.brk = 0; b.dive = false; }
      this.broadcast("boss", { k: "reset", bid, name: beastName(b.rank, b.species) });
    }
    bd.target = null; b.aggro = false; bd.kx = 0; bd.ky = 0; bd.ret = 0; b.x = bd.hx; b.y = bd.hy; bd.tx = bd.hx; bd.ty = bd.hy;
    b.maxHp = e.base; b.hp = e.base; bd.regen = 0;
  }

  /**
   * "Xóa buff địch" (SkillDef.dispel, Thiên Càn Trấn Áp của Thiên Càn Bạch Ngọc Đỉnh): bỏ mọi hiệu ứng có lợi trên hồn thú `bid`;
   * Cuồng nộ bị xóa thì ELITE_RAGE.cd giây sau mới nổi lại được. Như applyStatus: người gây đang chuyển bản đồ / trong vùng an toàn thì không.
   */
  dispelBeast(bid: string, by: string) {
    const b = this.state.beasts.get(bid), bd = this.bdata.get(bid), p = this.state.players.get(by), pd = this.pdata.get(by);
    if (!b || !bd || !p || !pd || !bd.buffs.size || pd.travelling || this.map.inSafe(p.x, p.y)) return;
    const names = [...bd.buffs.keys()].map((k) => BEAST_BUFFS[k].name).join(", ");
    bd.buffs.clear(); this.syncBeastBuff(b, bd);
    if (bd.elite) bd.elite.rageCd = ELITE_RAGE.cd;
    this.broadcast("fx", { k: "dispel", bid });
    this.log(by, `Xóa ${names} của ${beastName(b.rank, b.species)}.`, "#f0e0a0");
  }

  // ---------- Tà hóa thú vương (mục 5.4, 6; bước BĐ5) ----------
  /** Ngày nhận thưởng boss theo giờ Việt Nam (đổi lúc 00:00; hook test `day` lệch được để thử đặt lại lượt). */
  today() { return vnDay(bossNow() + this.dayShift * 86400000); }
  /** Tinh anh (theo ô tinh anh) và thú vương / boss thế giới đang sống của phòng: mục tiêu chung của tự săn (#218). */
  autoBosses(): [string, BeastState][] {
    const out: [string, BeastState][] = [];
    for (const bid of [...this.elites.map((s) => s.bid), this.king?.bid]) { const b = bid ? this.state.beasts.get(bid) : undefined; if (b && b.hp > 0) out.push([bid!, b]); }
    return out;
  }
  /**
   * Tài khoản của `d` còn nhận được thưởng của tinh anh / thú vương / boss thế giới `b` không (#218, mục 5.4): tinh anh chưa bị khóa
   * ELITE.lock; thú vương / boss thế giới còn lượt hôm nay và chưa nhận rương của khung giờ này ở kênh nào. Tự săn chỉ nhắm con còn nhận
   * được thưởng (người hết lượt vào đánh chỉ làm boss nhiều máu hơn cho người khác).
   */
  autoBossOk(d: PData, b: BeastState) {
    if (b.rank === 1) return eliteLockLeft(eliteKey(this.state.mapId, b), d.accountId) <= 0;
    const world = b.rank === 3;
    return this.claimsToday(d, world) < (world ? WORLD : KING).daily && !this.king?.claimed.has(d.accountId);
  }

  /** Lượt nhận rương thú vương (hoặc boss thế giới khi `world`, BĐ6e) hôm nay của người chơi (sang ngày mới thì về 0). */
  claimsToday(d: PData, world = false) {
    const c = world ? d.wclaims : d.claims;
    if (c.day !== this.today()) { c.day = this.today(); c.n = 0; }
    return c.n;
  }

  /** Tin "boss" gửi client cho một sự kiện lịch: tên, bản đồ, còn bao nhiêu giây, thú vương có ở bản đồ của phòng này không. */
  bossMsg(ev: BossEvent, k: string, secs: number) {
    const bi = bossIndex(ev.king), m = MAPS[ev.mapId], rank = BOSSES[bi]?.rank ?? 2;
    return { k, name: beastName(rank, bi), mapId: ev.mapId, mapName: m?.name ?? ev.mapId, in: Math.max(0, Math.round(secs)), life: ev.life,
      here: ev.mapId === this.state.mapId, col: BOSSES[bi]?.aura, world: rank === 3 };
  }

  /**
   * Sự kiện lịch boss trên presence (schedule.ts hoặc hook test): mọi phòng báo cho người chơi của mình (đếm ngược / xuất hiện); phòng
   * của đúng bản đồ sinh thú vương khi `spawn` (mỗi khung giờ một lần, mỗi kênh một con).
   */
  onBossEvent(ev: BossEvent) {
    if (!ev || !Object.hasOwn(MAPS, ev.mapId) || bossIndex(ev.king) < 0) return;
    if (ev.phase === "warn") {
      this.bossWarn = { ...ev, at: Date.now() + ev.in * 1000 };
      kingWarns.set(ev.mapId, this.bossWarn);
      bg(presenceBackend.putJson(`king-warn:${ev.mapId}`, this.bossWarn, (ev.in + ev.life + 60) * 1000), "presence");
      this.broadcast("boss", this.bossMsg(ev, "warn", ev.in));
    } else if (ev.phase === "spawn") {
      if (this.bossWarn?.mapId === ev.mapId) this.bossWarn = null;
      kingWarns.delete(ev.mapId);
      bg(presenceBackend.delete(`king-warn:${ev.mapId}`), "presence");
      this.broadcast("boss", this.bossMsg(ev, "spawn", 0));
      if (ev.mapId === this.state.mapId) void this.spawnKing(ev.slot, ev.life, ev.king);
    }
  }

  /**
   * Sinh thú vương của bản đồ trong hang (object `boss`) cho khung giờ `slot`, rút đi sau `life` giây. Niên hạn = mức trên của bản đồ
   * (mục 5.4). Mỗi phòng lấy một suất mỗi khung giờ (takeKingSeat); suất của phòng cũ đã hủy mà đã hạ / rút đi thì không sinh, còn sống
   * thì sinh lại đầy máu ở giai đoạn 1 (phòng trống là không ai trong hang: như bỏ giao chiến) với thời gian còn lại của suất. Đang có
   * thú vương sống thì bỏ qua. Thú vương không tính vào `count` của vùng.
   */
  async spawnKing(slot: number, life: number, want?: string) {
    const lair = this.map.lair, mid = this.state.mapId, years = kingYears(mid), now = Date.now();
    if (!lair || !years || life <= 0 || this.king?.slot === slot) return;
    if (this.king?.bid && this.state.beasts.has(this.king.bid)) return;
    if (this.kingTaking === slot) return;
    // Boss của khung: thú vương theo hang; boss thế giới (BĐ6e) theo lịch luân phiên (hoặc hook test), giữ theo khung ở kingSeats.
    const world = MAPS[mid].world ?? [], pick = world.length ? (want && world.includes(want) ? want : worldBossOn(mid, slot + bossOffset(now))!) : BOSSES[lair.boss].id;
    this.kingTaking = slot;
    let taken: Awaited<ReturnType<typeof takeKingSeat>>;
    try { taken = await takeKingSeat(mid, slot, now + life * 1000, this.roomId, pick); } catch (e) { this.kingTaking = 0; throw e; }
    const { seat, claimed, boss } = taken;
    this.king = { slot, bid: null, seat, claimed };
    if (seat.state === "alive" && seat.leaveAt <= now) seat.state = "gone";
    if (seat.state !== "alive") return;
    life = (seat.leaveAt - now) / 1000;
    const cx = lair.x + lair.w / 2, cy = lair.y + lair.h / 2;
    let x = cx, y = cy;
    for (let k = 0; k < 40 && this.map.hits(x, y, BOSS_BOX.hw, BOSS_BOX.hh); k++) { x = cx + (Math.random() - 0.5) * lair.w * 0.6; y = cy + (Math.random() - 0.5) * lair.h * 0.6; }
    const bi = bossIndex(boss);
    this.king.bid = this.addBeast(lair.zone, years, bi, x, y, BOSSES[bi].rank, slot, life);
  }

  /**
   * Mỗi tick của thú vương: hết KING.lifeSecs thì rút đi; máu còn KING.phaseHp thì sang giai đoạn 2; đếm tiếng gầm. Trả true nếu thú
   * vương đã rời bản đồ (tick dừng ở đây).
   */
  tickKing(bid: string, b: BeastState, bd: BData, k: KingData, dt: number) {
    if ((k.life -= dt) <= 0) { this.kingLeave(bid, b, bd); return true; }
    if (k.roar > 0) k.roar = Math.max(0, k.roar - dt);
    if (k.world) this.tickWorld(bid, b, bd, k, k.world, dt);
    else if (k.phase === 1 && k.def.phase2 && b.hp > 0 && b.hp <= b.maxHp * KING.phaseHp) this.kingPhase2(bid, b, bd, k);
    return false;
  }

  // ---------- Boss thế giới (mục 5.4 "Boss thế giới 100.000 năm", bước BĐ6e) ----------
  /**
   * Mỗi tick của boss thế giới (sau tickKing): nổi giận sau WORLD.enrageSecs; điểm yếu hệ ở mỗi mốc WORLD.weakAt; khiên Bá Thể hết giờ
   * thì hồi máu bằng phần còn lại; lặn / nổi lên (Du Thủy); khi đang giao chiến thì tới giờ cơ chế nào chạy cơ chế đó (không chồng
   * lên chiêu đang báo trước, không chạy khi đang Choáng sau lần ngắt tích lực), nổi giận thì thêm Bạo Nộ toàn sàn mỗi WORLD.slamEvery giây.
   */
  tickWorld(bid: string, b: BeastState, bd: BData, k: KingData, w: WorldData, dt: number) {
    const m = k.def.world ?? {};
    if (!w.rage && k.life <= WORLD.lifeSecs - WORLD.enrageSecs) this.worldEnrage(bid, b, bd, k, w);
    if (w.weak && (w.weakT -= dt) <= 0) { w.weak = null; w.weakT = 0; b.weak = 0; this.broadcast("boss", { k: "weakEnd", bid }); }
    while (w.weakNext < WORLD.weakAt.length && b.hp > 0 && b.hp <= b.maxHp * WORLD.weakAt[w.weakNext]) { w.weakNext++; this.worldWeak(bid, b, w, null, WORLD.weakSecs); }
    if (w.shield > 0 && (w.shieldT -= dt) <= 0) {
      const add = Math.min(b.maxHp - b.hp, Math.round(w.shield));
      w.shield = 0; w.shieldT = 0; b.shield = 0;
      if (add > 0 && b.hp > 0) { b.hp += add; this.broadcast("dmg", { x: b.x, y: b.y - 10, v: add, c: "#7dff8a" }); }
      this.broadcast("boss", { k: "armorEnd", bid, name: m.armor?.name ?? "", heal: add });
    }
    if (w.dive > 0) { if ((w.dive -= dt) <= 0) this.worldSurface(bid, b, bd, k, w); return; }
    if (!bd.elite?.engaged || b.hp <= 0) return;
    w.chargeT -= dt; w.armorT -= dt; w.miasmaT -= dt; w.diveT -= dt; if (w.rage) w.slamT -= dt;
    if (bd.cast || k.roar > 0 || bd.st.has("stun")) return;
    if (w.rage && w.slamT <= 0) { w.slamT = WORLD.slamEvery; return this.worldCast(bid, b, bd, WORLD_SLAM, false); }
    if (m.charge && w.chargeT <= 0) { w.chargeT = m.charge.every; return this.worldCast(bid, b, bd, m.charge.skill, true); }
    if (m.miasma && w.miasmaT <= 0) { w.miasmaT = m.miasma.every; return this.worldCast(bid, b, bd, m.miasma.skill, false); }
    if (m.armor && w.armorT <= 0 && w.shield <= 0) { w.armorT = m.armor.every; return this.worldArmor(bid, b, w, m.armor); }
    if (m.dive && w.diveT <= 0) { w.diveT = m.dive.every; return this.worldDive(bid, b, bd, w, m.dive); }
  }

  /** Tung một chiêu cơ chế (toàn sàn) của boss thế giới; `charge`: tích lực phải ngắt (đếm khống chế từ 0, báo cả phòng). */
  worldCast(bid: string, b: BeastState, bd: BData, def: BeastSkillDef, charge: boolean) {
    const pid = bd.target ?? [...(bd.elite?.parts.keys() ?? [])][0]; const tgt = pid ? this.state.players.get(pid) : undefined;
    this.beginCast(bid, b, bd, { def, cd: 0 }, pid ?? "", tgt ?? b);
    const w = bd.elite!.king!.world!, need = bd.elite!.king!.def.world?.charge?.need ?? 0;
    if (charge) { bd.cast!.charge = true; w.brk = 0; w.brkAt.clear(); b.brk = 0; b.chg = true; }
    this.broadcast("boss", { k: charge ? "charge" : "floor", bid, name: def.name, secs: def.warn, need });
  }

  /**
   * Khống chế (Choáng, Trói, Câm lặng, Mê hoặc…) trúng boss thế giới: boss không nhận, nhưng nếu đang tích lực (cast.charge) và người
   * gây đang cho võ hồn hệ Khống chế ra trận thì tính một lần ngắt (mỗi người tối đa một lần trong 0,3 giây: một hồn kỹ gây nhiều khống
   * chế chỉ tính một). Đủ `need` lần thì ngắt chiêu, boss Choáng `stun` giây.
   */
  worldBreak(bid: string, b: BeastState, bd: BData, w: WorldData, by: string) {
    const ch = bd.elite?.king?.def.world?.charge, p = this.state.players.get(by), now = Date.now();
    if (!ch || !bd.cast?.charge || !p || VOHON[p.vh]?.he !== "khong_che" || now - (w.brkAt.get(by) ?? 0) < 300) return;
    w.brkAt.set(by, now); w.brk++; b.brk = w.brk;
    this.broadcast("boss", { k: "brk", bid, n: w.brk, need: ch.need, by: p.name });
    if (w.brk < ch.need) return;
    this.cancelCast(bid, b, bd);
    bd.st.set("stun", { t: ch.stun, n: 1, v: 0, src: by }); this.syncStatus(b, bd);
    bd.kx = 0; bd.ky = 0;
    this.broadcast("boss", { k: "broken", bid, name: ch.skill.name, by: p.name, secs: ch.stun });
  }

  /** Điểm yếu hệ `he` (null = ngẫu nhiên, khác hệ đang hiện) trong `secs` giây: võ hồn hệ đó gây x WORLD.weakMult, hệ khác x WORLD.offMult. */
  worldWeak(bid: string, b: BeastState, w: WorldData, he: He | null, secs: number) {
    const pool = HE_IDS.filter((x) => x !== w.weak), pick = he ?? pool[Math.floor(Math.random() * pool.length)];
    w.weak = pick; w.weakT = secs; b.weak = 1 + HE_IDS.indexOf(pick);
    this.broadcast("boss", { k: "weak", bid, he: pick, secs, mult: WORLD.weakMult, off: WORLD.offMult });
  }

  /** Nổi giận (mục 5.4): sát thương x WORLD.rageDmg, tốc độ x WORLD.rageSpd, hồi chiêu nhanh hơn, Bạo Nộ toàn sàn mỗi WORLD.slamEvery giây. */
  worldEnrage(bid: string, b: BeastState, bd: BData, k: KingData, w: WorldData) {
    w.rage = true; w.slamT = WORLD.slamEvery; k.phase = 2; b.phase = 2; k.spd = WORLD.rageSpd; k.roar = KING.roarSecs;
    this.cancelCast(bid, b, bd); bd.kx = 0; bd.ky = 0;
    const name = beastName(b.rank, b.species);
    this.broadcast("fx", { k: "roar", bid, name: "Nổi giận", col: k.def.aura, secs: KING.roarSecs });
    this.broadcast("boss", { k: "rage", bid, name, dmg: WORLD.rageDmg, every: WORLD.slamEvery, col: k.def.aura, life: k.life });
  }

  /** Bá Thể (Thái Thản Cự Viên): khiên `pct` máu tối đa trong `secs` giây; võ hồn hệ `he` phá nhanh gấp `mult`. */
  worldArmor(bid: string, b: BeastState, w: WorldData, a: NonNullable<NonNullable<BossDef["world"]>["armor"]>) {
    w.shield = Math.round(b.maxHp * a.pct); w.shieldT = a.secs; b.shield = w.shield;
    this.broadcast("fx", { k: "buff", x: b.x, y: b.y, col: "#9ad8ff" });
    this.broadcast("boss", { k: "armor", bid, name: a.name, he: a.he, mult: a.mult, secs: a.secs, shield: w.shield });
  }

  /**
   * Du Thủy (Thiên Thanh Ngưu Mãng): lặn ra giữa hồ (object `lake`; bản đồ không có thì lặn tại chỗ) `secs` giây (không nhận sát thương,
   * không đánh, bỏ chiêu đang báo trước). Chỗ nổi lên (cách chỗ lặn ít nhất `away` pixel) chọn ngay và báo trước cho cả phòng (#118).
   */
  worldDive(bid: string, b: BeastState, bd: BData, w: WorldData, dv: NonNullable<NonNullable<BossDef["world"]>["dive"]>) {
    this.cancelCast(bid, b, bd);
    // Sàn không tìm được chỗ nổi lên thì nổi lại đúng chỗ lặn (trong sàn), không kẹt lại giữa hồ.
    w.dive = dv.secs; w.surf = surfaceSpot(this.map, { x: bd.hx, y: bd.hy }, b.x, b.y, dv.away, Math.random) ?? { x: b.x, y: b.y }; b.dive = true; b.moving = false; bd.kx = 0; bd.ky = 0;
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 50, col: "#4ab0ff" });
    const lake = this.map.lake;
    if (lake) { b.x = lake.x; b.y = lake.y; this.interest.beasts.put(bid, b.x, b.y); this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 50, col: "#4ab0ff" }); }
    this.broadcast("boss", { k: "dive", bid, name: dv.name, secs: dv.secs, sx: w.surf.x, sy: w.surf.y });
  }

  /** Nổi lên đúng chỗ đã báo trước lúc lặn (WorldData.surf), lộ điểm yếu hệ của Du Thủy `weakSecs` giây. */
  worldSurface(bid: string, b: BeastState, bd: BData, k: KingData, w: WorldData) {
    const dv = k.def.world?.dive;
    if (w.surf) { b.x = w.surf.x; b.y = w.surf.y; this.interest.beasts.put(bid, b.x, b.y); } // dời xa hơn lề lưới (11.4): cập nhật ngay
    w.dive = 0; w.surf = null; b.dive = false;
    bd.skT = Math.max(bd.skT, 1);
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 60, col: "#4ab0ff" });
    if (dv) this.worldWeak(bid, b, w, dv.he, dv.weakSecs);
    this.broadcast("boss", { k: "surface", bid, name: dv?.name ?? "" });
  }

  /** Thông tin boss thế giới gửi kèm tin "boss" k = "here" cho người mới vào (đồng hồ nổi giận, điểm yếu đang hiện). */
  worldInfo(k: KingData) {
    const w = k.world; if (!w) return {};
    return { world: true, rageIn: Math.max(0, k.life - (WORLD.lifeSecs - WORLD.enrageSecs)), rage: w.rage, weak: w.weak, weakT: w.weakT,
      ...(w.dive > 0 && w.surf ? { dive: w.dive, diveSecs: k.def.world?.dive?.secs ?? w.dive, sx: w.surf.x, sy: w.surf.y } : {}) }; // đang lặn (#118): chỗ nổi lên đã báo
  }

  /**
   * Giai đoạn 2 (mục 5.4): gầm lên, đứng yên KING.roarSecs giây (không nhận khống chế, mất khống chế đang có, ngắt chiêu đang báo trước),
   * rồi thêm chiêu của BossDef.phase2 và nhanh hơn (phase2.spd). Cả phòng được báo.
   */
  kingPhase2(bid: string, b: BeastState, bd: BData, k: KingData) {
    const ph = k.def.phase2!;
    k.phase = 2; b.phase = 2; k.roar = KING.roarSecs; k.spd = ph.spd;
    this.cancelCast(bid, b, bd);
    let cc = false;
    for (const s of [...bd.st.keys()]) { const def = STATUS[s]; if (def.noMove || def.noAtk || def.noSkill || def.wander) { bd.st.delete(s); cc = true; } }
    if (cc) this.syncStatus(b, bd);
    bd.skills.push(...ph.skills.map((def) => ({ def, cd: KING.roarSecs + 1 })));
    bd.skT = Math.max(bd.skT, KING.roarSecs);
    bd.kx = 0; bd.ky = 0;
    const name = beastName(2, b.species);
    this.broadcast("fx", { k: "roar", bid, name: ph.name, col: k.def.aura, secs: KING.roarSecs });
    this.broadcast("boss", { k: "phase", bid, name, phase: 2, title: ph.name, desc: ph.desc, col: k.def.aura });
  }

  /**
   * Bảng xếp hạng đóng góp lên thú vương: tối đa 10 người (sessionId, tên, `pct` % đóng góp tổng, từ 9.2 `sup` % phần hỗ trợ trong
   * tổng), tổng đóng góp (sát thương + hỗ trợ × SUPPORT_CONTRIB) và số người tham gia; xếp theo đóng góp tổng.
   */
  kingRank(e: EliteData) {
    const all = this.contributors(e).map((id) => [id, this.contribOf(e, id), (e.supBy.get(id) ?? 0) * SUPPORT_CONTRIB] as const);
    const total = all.reduce((a, x) => a + x[1], 0), pc = (v: number) => (total ? +(v / total * 100).toFixed(1) : 0);
    const list = all.sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([id, v, s]) => ({ id, name: this.state.players.get(id)?.name ?? "(đã rời)", pct: pc(v), sup: pc(s) }));
    return { list, total, n: e.n };
  }

  /** Không ai hạ trong KING.lifeSecs giây: thú vương rút đi, không ai nhận thưởng; cả phòng và toàn server được báo. */
  kingLeave(bid: string, b: BeastState, bd: BData) {
    this.cancelCast(bid, b, bd);
    const world = !!bd.elite?.king?.world, K = world ? WORLD : KING, name = beastName(b.rank, b.species), map = MAPS[this.state.mapId].name;
    this.state.beasts.delete(bid); this.bdata.delete(bid);
    if (this.king?.bid === bid) { this.king.bid = null; this.king.seat.state = "gone"; void persistKingSeat(this.state.mapId, this.king.slot, this.king.seat, this.king.claimed); }
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 60, col: BOSSES[b.species]?.aura });
    this.broadcast("boss", { k: "leave", bid, name, mapName: map, world, mins: K.lifeSecs / 60 });
    this.presence.publish(ANNOUNCE_TOPIC, { text: world ? `${name} ở ${map} đã lặn xuống hồ: không ai hạ được trong ${K.lifeSecs / 60} phút.`
      : `${name} ở ${map} đã rút đi: không ai hạ được trong ${K.lifeSecs / 60} phút.` });
  }

  /**
   * Người tham gia ngẫu nhiên trong tầm `range` của thú vương để đánh dấu (BeastSkillDef.mark, Huyết Cuồng); `weak` (BĐ6d, Huyết Khí):
   * người có tỉ lệ sinh lực thấp nhất thay vì ngẫu nhiên. Không có thì null.
   */
  markTarget(b: BeastState, bd: BData, range: number, weak = false): [string, PlayerState] | null {
    const list: [string, PlayerState][] = [];
    for (const pid of bd.elite?.parts.keys() ?? []) {
      const p = this.state.players.get(pid), pd = this.pdata.get(pid);
      if (p && pd && !p.dead && !pd.travelling && !pd.buffs.has("hide") && !this.map.inSafe(p.x, p.y) && Math.hypot(p.x - b.x, p.y - b.y) <= range) list.push([pid, p]);
    }
    if (weak) return list.reduce<[string, PlayerState] | null>((a, x) => (!a || x[1].hp / x[1].maxHp < a[1].hp / a[1].maxHp ? x : a), null);
    return list.length ? list[Math.floor(Math.random() * list.length)] : null;
  }

  /**
   * Hạ thú vương (mục 5.4 "Chia thưởng theo đóng góp"): đóng góp = sát thương + hồi máu / khiên cho người tham gia khác (9.2,
   * contribOf). Mọi người đóng góp còn trong phòng nhận kinh nghiệm x KING.xp; người hạ nhận Hồn Tệ; hồn hoàn rơi ưu tiên người đóng
   * góp nhiều nhất DROP_OWNER_SECS giây (boss thế giới: hồn hoàn đỏ cho người gây sát thương nhiều nhất); ai từ KING.share (3%) nhận
   * rương vào túi (giới hạn KING.daily lần/ngày, grantChest). Cả phòng nhận bảng xếp hạng cuối, toàn server được báo.
   */
  killKing(bid: string, b: BeastState, e: EliteData, by: string) {
    const k = e.king!, name = beastName(b.rank, b.species), map = MAPS[this.state.mapId].name, rank = this.kingRank(e), K = bossK(k), world = !!k.world;
    // Tài khoản đã nhận rương của khung giờ này (ở kênh nào cũng vậy): mỗi khung một rương, đổi kênh không nhân thưởng (mục 6).
    const cached = this.king?.bid === bid ? kingClaimCache.get(`${this.state.mapId}:${this.king.slot}`) : undefined;
    if (cached && this.king) for (const accountId of cached) this.king.claimed.add(accountId);
    const claimed = this.king?.bid === bid ? this.king.claimed : undefined;
    if (this.king?.bid === bid) { this.king.bid = null; this.king.seat.state = "down"; void persistKingSeat(this.state.mapId, this.king.slot, this.king.seat, this.king.claimed); }
    const p = this.state.players.get(by)!; p.kills++;
    const total = rank.total || 1;
    // 9.2: ưu tiên hồn hoàn thú vương theo đóng góp tổng; hồn hoàn đỏ boss thế giới vẫn cho người gây sát thương nhiều nhất.
    const owner = this.topContrib(e, by, world);
    const coin = this.rewardCoin(by, b.tier);
    // Boss thế giới (BĐ6e): hồn hoàn vào thẳng túi cùng rương (WORLD_RING), không rơi xuống đất.
    if (!world) { const drop = this.newDrop(b.x, b.y, owner); drop.tier = b.tier; drop.years = b.years; this.state.drops.set(uid("d"), drop); }
    this.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: 80, col: k.def.aura });
    const ownerName = this.state.players.get(owner)!.name, age = formatYears(b.years);
    for (const pid of this.contributors(e)) {
      const v = this.contribOf(e, pid), d = this.pdata.get(pid); if (!d || !this.state.players.has(pid) || d.travelling) continue;
      const pct = v / total, pctTxt = `${(pct * 100).toFixed(1).replace(".", ",")}%`;
      this.rewardKill(pid, b.years, K.xp);
      this.questEvent(pid, { k: "king", map: this.state.mapId }); // #256: mọi người có đóng góp còn trong phòng (boss thế giới cũng tính)
      if (world) this.questEvent(pid, { k: "world", map: this.state.mapId }); // #284: chương 3 "Thủ hộ của Tiểu Vũ"
      const ring = world ? "" : pid === owner ? ` Hồn hoàn ${age} ưu tiên bạn nhặt ${DROP_OWNER_SECS} giây đầu (phím E).` : "";
      const coinTxt = pid === by ? ` Nhận ${formatHonTe(coin)} Hồn Tệ.` : "";
      // Hồn hoàn boss thế giới: người nhiều nhất hồn hoàn đỏ 100.000 năm; người khác WORLD_RING.red cơ hội đỏ, còn lại đen.
      const ry = !world ? undefined : pid === owner || Math.random() < WORLD_RING.red ? WORLD_RING.top : rollYears(WORLD_RING.black[0], WORLD_RING.black[1], Math.random());
      if (pct >= K.share && claimed?.has(d.accountId))
        this.log(pid, `Hạ ${name}! Đóng góp ${pctTxt}: đã nhận ${world ? "thưởng" : "rương"} của khung giờ này ở kênh khác, không nhận thêm.${coinTxt}${ring}`, "#ffb35c");
      else if (pct >= K.share) { this.log(pid, `Hạ ${name}! Đóng góp ${pctTxt}.${coinTxt}${ring}`, k.def.aura); this.grantChest(pid, k.def, claimed, ry); }
      else this.log(pid, `Hạ ${name}! Đóng góp ${pctTxt}: cần từ ${K.share * 100}% mới nhận ${world ? "thưởng" : "rương"}.${coinTxt}${ring}`, "#ffb35c");
    }
    if (!e.dmgBy.has(by) && !e.supBy.has(by)) this.log(by, `Hạ ${name}, nhận ${formatHonTe(coin)} Hồn Tệ.`, k.def.aura);
    this.broadcast("boss", { k: "down", bid, name, by: p.name, top: ownerName, topDmg: world, mapName: map, ...rank });
    this.presence.publish(ANNOUNCE_TOPIC, { text: `${name} ở ${map} đã bị hạ! ${ownerName} ${world ? "gây sát thương" : "đóng góp"} nhiều nhất, ${p.name} ra đòn cuối.` });
  }

  /**
   * Rương thú vương cho người chơi `id` (đóng góp từ KING.share): hôm nay còn lượt (KING.daily, tính chung mọi bản đồ, đặt lại 00:00 giờ
   * Việt Nam) thì tới lượt trong chuỗi lưu mới cho rương vào túi và ngay đó tăng lượt cùng ghi cả túi trong một transaction
   * (store.claimBoss). Không lần ghi nào khác chụp được túi có rương trước transaction này (mọi lần ghi nối tiếp trong chuỗi), nên DB
   * không bao giờ có rương mà chưa trừ lượt. DB báo hết lượt hoặc lỗi thì lấy lại rương. Túi đầy thì rương vẫn vào (ô tạm vượt
   * số ô túi, như trả mảnh ở 3.4) để không mất thưởng. `claimed`: tài khoản đã nhận rương của khung giờ (mọi kênh); ghi ngay khi
   * cho rương, bỏ ra nếu không nhận được.
   */
  grantChest(id: string, def: BossDef, claimed?: Set<number>, ringYears?: number) {
    const d = this.pdata.get(id), it = itemDef(chestCode(def.id)), ri = itemDef(RING_ITEM); if (!d || !it || !ri) return;
    // Boss thế giới (BĐ6e): lượt riêng (BOSS_CLAIM_WORLD, WORLD.daily), thêm hồn hoàn `ringYears` vào túi cùng transaction với rương.
    const world = def.rank === 3, K = world ? WORLD : KING, kind = world ? BOSS_CLAIM_WORLD : BOSS_CLAIM_KING, what = world ? "boss thế giới" : "thú vương";
    const day = this.today(), warn = (text: string) => this.log(id, text, "#ffb35c"), rec = () => (world ? d.wclaims : d.claims);
    if (this.claimsToday(d, world) >= K.daily) return warn(`Hôm nay đã hết lượt nhận thưởng ${what} (${K.daily}/${K.daily}): không nhận ${world ? "hồn hoàn và rương" : "rương"}. Lượt mới lúc 00:00 giờ Việt Nam.`);
    let ring: Item | null = null;
    const takeBack = () => {
      const x = d.bag.find((i) => i.code === it.id && i.vohonId === null); if (x) this.takeItem(d, x, 1);
      // Theo id (#165): túi có thể đã được chép sang đối tượng mới trong lúc chờ DB.
      const ri = ring ? d.bag.findIndex((i) => i.id === ring!.id) : -1;
      if (ri >= 0) { d.bag.splice(ri, 1); d.bagDirty = true; }
      claimed?.delete(d.accountId);
      if (claimed && this.king) void persistKingSeat(this.state.mapId, this.king.slot, this.king.seat, claimed);
    };
    claimed?.add(d.accountId);
    if (claimed && this.king) void persistKingSeat(this.state.mapId, this.king.slot, this.king.seat, claimed);
    d.claimBusy++;
    this.chain(d, async () => {
      // Rương vào túi ngay trước khi chụp túi cho transaction (không có await xen giữa); chặn mở / bỏ rương tới khi xong (claimBusy).
      const full = !this.addItem(d, it.id, 1);
      if (full) { d.bag.push(newItem(it, 1)); d.bagDirty = true; }
      // Hồn hoàn mỗi chiếc một ô; túi đầy thì vẫn vào (ô tạm vượt số ô túi) như rương, để không mất thưởng.
      if (ringYears) { ring = newItem(ri, 1, ringYears); d.bag.push(ring); d.bagDirty = true; }
      let n: number | null;
      try { n = await store.claimBoss(d.accountId, day, kind, K.daily, this.bagSnapshot(d)); }
      catch (e) { takeBack(); warn(`Không lưu được ${it.name}, thử lại sau.`); throw e; }
      if (n === null) { takeBack(); Object.assign(rec(), { day, n: K.daily }); return warn(`Hôm nay đã hết lượt nhận thưởng ${what} (${K.daily}/${K.daily}): không nhận ${world ? "hồn hoàn và rương" : "rương"}.`); }
      Object.assign(rec(), { day, n });
      const rtxt = ringYears ? `hồn hoàn ${formatYears(ringYears)} và ` : "";
      this.log(id, `Nhận ${rtxt}${it.name} vào túi đồ (lượt ${n}/${K.daily} hôm nay). Mở rương trong túi đồ (B).`, it.col);
      if (full || bagUsed(d.bag) > d.bagSlots) warn(`Túi đồ đã đầy: phần thưởng vẫn vào túi, bỏ bớt đồ để mở được rương (cần ${world ? WORLD_CHEST.slots : KING_CHEST.slots} ô trống).`);
    }).then(() => { d.claimBusy--; if (this.pdata.get(id) === d) this.sendBag(id); });
  }

  /**
   * Mở rương thú vương `raw` (id ô trong túi; KING_CHEST, mục 5.3): cần KING_CHEST.slots ô trống. Server tung: hồn cốt (boneChance theo
   * năm thú vương x KING_CHEST.bone, loài gốc, vị trí ngẫu nhiên), mảnh võ hồn (kingShardPool của bản đồ thú vương), mảnh UR
   * (KING_CHEST.ur), và luôn 1 hồn hạch sao cao nhất theo năm thú vương, bộ theo bản đồ thú vương (rollCore `high`, 5.1). Hook test
   * `chest` cố định được các số ngẫu nhiên.
   */
  openChest(id: string, raw: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    const it = typeof raw === "string" ? d.bag.find((i) => i.id === raw && i.vohonId === null) : undefined, def = it && itemDef(it.code);
    if (!it || !def) return warn("Không có vật phẩm này trong túi đồ.");
    const boss = BOSSES[bossIndex(def.boss ?? "")];
    if (def.kind !== "ruong" || !boss) return warn(`${def.name} không mở được.`);
    if (claimHeld(d)) return warn("Đang nhận rương, đợi một chút.");
    if (boss.rank === 3) return this.openWorldChest(id, p, d, it, def, boss);
    if (d.bagSlots - bagUsed(d.bag) < KING_CHEST.slots) return warn(`Cần ${KING_CHEST.slots} ô trống trong túi đồ để mở ${def.name}.`);
    const mapId = Object.values(MAPS).find((m) => m.king === boss.id)?.id ?? this.state.mapId, years = kingYears(mapId) ?? TIERS[0].years;
    const t = d.testChest, r = (v: number | undefined) => (v !== undefined && v >= 0 ? v : Math.random());
    this.takeItem(d, it, 1);
    const got: string[] = [];
    if (r(t?.bone) < boneChance(years, KING_CHEST.bone)) {
      const slot = BONE_SLOTS[t && t.s >= 0 ? t.s % BONE_SLOTS.length : Math.floor(Math.random() * BONE_SLOTS.length)].id;
      if (this.addBone(d, years, boss.species, slot)) got.push(`hồn cốt ${boneName(boss.species, slot, years)}`);
    }
    const pool = kingShardPool(mapId), wsum = pool.reduce((a, x) => a + x.w, 0);
    let pick = pool[0];
    if (t && t.i >= 0) pick = pool[t.i % pool.length];
    else { let x = Math.random() * wsum; for (const q of pool) { x -= q.w; if (x <= 0) { pick = q; break; } } }
    const [lo, hi] = KING_CHEST.shards, qty = t && t.n > 0 ? t.n : lo + Math.floor(Math.random() * (hi - lo + 1));
    const sc = shardCode(pick.vohon), sd = itemDef(sc), n1 = sd ? this.addItem(d, sc, qty) : 0;
    if (sd && n1) got.push(`${n1} ${sd.name}${this.shardNote(d, sc)}`);
    let ur = "";
    if (r(t?.ur) < KING_CHEST.ur) {
      const u = KING_CHEST.urShards[Math.floor(Math.random() * KING_CHEST.urShards.length)], uc = shardCode(u), ud = itemDef(uc);
      if (ud && this.addItem(d, uc, 1)) { got.push(`1 ${ud.name} (UR)${this.shardNote(d, uc)}`); ur = ud.name; }
    }
    const core = rollCore(years, MAPS[mapId].cores, Math.random, { high: true });
    if (this.addCore(d, core.stars, core.data)) got.push(coreName(core.data.set, core.stars).replace("Hồn hạch", "hồn hạch"));
    this.chestEquip(d, 2, mapId, got);
    this.sendBag(id);
    this.log(id, `Mở ${def.name}: ${got.join(", ")}.`, def.col);
    if (ur) this.broadcast("chat", { name: "Hệ thống", text: `${p.name} mở ${def.name} nhận được ${ur}!` });
    this.save(id);
  }

  /**
   * Mở rương boss thế giới (WORLD_CHEST, BĐ6e): cần WORLD_CHEST.slots ô trống. Hồn cốt boneChance(100.000 năm, WORLD_CHEST.bone) của
   * loài gốc boss; WORLD_CHEST.ur mảnh UR của một võ hồn trong KING_CHEST.urShards; luôn 1 hồn hạch sao trong WORLD_CHEST.stars, bộ bất
   * kỳ. Hook test `chest`: `bone` (0..100), `i` (võ hồn UR), `n` (số mảnh UR), `s` (vị trí hồn cốt).
   */
  openWorldChest(id: string, p: PlayerState, d: PData, it: Item, def: ItemDef, boss: BossDef) {
    if (d.bagSlots - bagUsed(d.bag) < WORLD_CHEST.slots) return this.log(id, `Cần ${WORLD_CHEST.slots} ô trống trong túi đồ để mở ${def.name}.`, "#ffb35c");
    const years = MAPS[Object.values(MAPS).find((m) => m.world?.includes(boss.id))?.id ?? ""]?.years?.[1] ?? WORLD_RING.top;
    const t = d.testChest, r = (v: number | undefined) => (v !== undefined && v >= 0 ? v : Math.random());
    this.takeItem(d, it, 1);
    const got: string[] = [];
    if (r(t?.bone) < boneChance(years, WORLD_CHEST.bone)) {
      const slot = BONE_SLOTS[t && t.s >= 0 ? t.s % BONE_SLOTS.length : Math.floor(Math.random() * BONE_SLOTS.length)].id;
      if (this.addBone(d, years, boss.species, slot)) got.push(`hồn cốt ${boneName(boss.species, slot, years)}`);
    }
    const urs = KING_CHEST.urShards, u = urs[t && t.i >= 0 ? t.i % urs.length : Math.floor(Math.random() * urs.length)];
    const [lo, hi] = WORLD_CHEST.ur, qty = t && t.n > 0 ? t.n : lo + Math.floor(Math.random() * (hi - lo + 1)), uc = shardCode(u), ud = itemDef(uc);
    const nu = ud ? this.addItem(d, uc, qty) : 0;
    if (ud && nu) got.push(`${nu} ${ud.name} (UR)${this.shardNote(d, uc)}`);
    const [s0, s1] = WORLD_CHEST.stars, stars = s0 + Math.floor(Math.random() * (s1 - s0 + 1));
    const core = rollCore(years, CORE_SETS.map((c) => c.id), Math.random, { stars });
    if (this.addCore(d, core.stars, core.data)) got.push(coreName(core.data.set, core.stars).replace("Hồn hạch", "hồn hạch"));
    this.chestEquip(d, 3, Object.values(MAPS).find((m) => m.world?.includes(boss.id))?.id ?? "", got);
    this.sendBag(id);
    this.log(id, `Mở ${def.name}: ${got.join(", ")}.`, def.col);
    if (nu) this.broadcast("chat", { name: "Hệ thống", text: `${p.name} mở ${def.name} nhận được ${nu} ${ud!.name}!` });
    this.save(id);
  }

  /** Chọn loài theo trọng số trong số loài khai báo ở vùng; vùng không có loài hợp lệ thì lấy loài bất kỳ. */
  pickSpecies(zi: number) {
    let list = this.map.zones[zi].beasts;
    if (!list.length) list = BEASTS.map((_, i) => ({ species: i, w: 1 }));
    let r = Math.random() * list.reduce((a, b) => a + b.w, 0);
    for (const b of list) { r -= b.w; if (r <= 0) return b.species; }
    return list[list.length - 1].species;
  }

  /** Võ hồn đã gục: hồi ngay khi hồn sư đứng trong doanh trại, hoặc sau REVIVE_SECS giây ngoài trận (giao chiến thì đồng hồ dừng). */
  tickDowns(id: string, dt: number) {
    const p = this.state.players.get(id)!, d = this.pdata.get(id)!;
    if (!d.down.size) return;
    if (this.map.inSpawn(p.x, p.y)) return this.revive(id, [...d.down.keys()], "ở doanh trại");
    if (d.fight < TEAM_COMBAT_SECS) return;
    const done: number[] = [];
    for (const [r, t] of d.down) { if (t - dt <= 0) done.push(r); else d.down.set(r, t - dt); }
    if (done.length) this.revive(id, done, "sau khi nghỉ ngoài trận");
  }

  // ---------- Chat (mục 4 "Lệnh chat", #188) ----------
  /**
   * Tin chat `chat {text, ch?, to?}`: `ch` thiếu = "map" (mọi người trong phòng, như cũ); "party" = mọi thành viên tổ đội; "whisper" =
   * hồn sư tên `to` đang trong game (kèm bản sao cho người gửi); "world" = mọi phòng, từ cấp WORLD_CHAT.minLevel, 1 tin /
   * WORLD_CHAT.cdSecs giây; "tong" (#198) = mọi thành viên cùng tông đang trong game (chưa thuộc tông thì báo). Tổ đội / riêng / thế
   * giới / tông đi qua presence CHAT_TOPIC tới phòng đang giữ người nhận (có thể ở bản đồ / kênh khác). Kiểm luật kênh trước, rồi mới
   * tính lượt chống spam (riêng từng kênh, ratelimit.chatCheck). Lỗi báo riêng người gửi.
   */
  chatAction(id: string, m: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d) return;
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>;
    const ch = o.ch === undefined ? "map" : strIn(o.ch);
    if (ch !== "map" && ch !== "party" && ch !== "whisper" && ch !== "world" && ch !== "tong") return;
    if (!chatText(o.text)) return;
    const warn = (text: string) => this.log(id, text, "#ffb35c"), acc = d.accountId, now = Date.now();
    let to: number[] | undefined, toName: string | undefined;
    if (ch === "party") {
      to = party.partyMembers(acc);
      if (!to.length) return warn("Bạn không ở trong tổ đội nào: mời bằng /moi <tên> trước.");
    } else if (ch === "whisper") {
      const name = chatText(o.to).slice(0, 40);
      if (!name) return warn("Gõ /t <tên> <tin> để nhắn riêng.");
      const t = party.onlineByName(name);
      if (!t) return warn(`${name} không trong game: tin không được gửi.`);
      if (t.acc === acc) return warn("Không thể tự nhắn riêng cho chính mình.");
      const bw = this.blockDeny(acc, t.acc, t.name, "tin riêng"); if (bw) return warn(bw);
      to = [acc, t.acc]; toName = t.name;
    } else if (ch === "world") {
      if (p.level < WORLD_CHAT.minLevel) return warn(`Kênh thế giới mở từ cấp ${WORLD_CHAT.minLevel}.`);
      const wait = worldWait(acc, now);
      if (wait) return warn(`Kênh thế giới: mỗi ${WORLD_CHAT.cdSecs} giây một tin, đợi ${wait} giây.`);
    } else if (ch === "tong") {
      if (!d.tong) return warn("Ngươi chưa thuộc tông môn nào: gia nhập ở sứ giả tông môn (Thiên Đấu Thành) rồi mới chat tông (/tm).");
    }
    const r = chatCheck(acc, o.text, now, ch);
    if (!r) return;
    if ("error" in r) return warn(r.error);
    // Chat bản đồ: không gửi tới người trong phòng đã chặn người gửi (#195).
    if (ch === "map") return this.broadcast("chat", { name: p.name, text: r.text }, { except: this.clients.filter((c) => { const a = accOf(c); return a !== undefined && a !== acc && friends.blocked(a, acc); }) });
    if (ch === "world") {
      worldMark(acc, now);
      void presenceBackend.putJson(worldChatKey(acc), now, WORLD_CHAT.cdSecs * 1000).catch((e) => console.error("Không lưu được hồi kênh thế giới trong presence", e));
    }
    const route: ChatRoute = { ...(to ? { to } : {}), ...(ch === "tong" ? { tong: d.tong! } : {}), from: acc, msg: { ch, name: p.name, text: r.text, ...(toName ? { to: toName } : {}) } };
    this.presence.publish(CHAT_TOPIC, route);
  }

  // ---------- Bạn bè và chặn (mục 5.9 "Bạn bè", #195; trạng thái và luật ở server/src/friends.ts) ----------
  /**
   * Lý do không gửi được `what` (tin riêng, lời mời tổ đội) từ `acc` tới `target` (tên `name`) vì chặn: `acc` đang chặn người đó, hoặc
   * người đó đã chặn `acc`. Không chặn thì null.
   */
  blockDeny(acc: number, target: number, name: string, what: string) {
    if (friends.blocked(acc, target)) return `Bạn đang chặn ${name}: bỏ chặn trước khi gửi ${what}.`;
    if (friends.blocked(target, acc)) return `Không gửi được: ${name} không nhận ${what} của bạn.`;
    return null;
  }

  /**
   * Sau khi tổ đội ghi `acc` vào / rời phòng (`party.goOnline` / `goOffline`, có thể chờ presence, #149): báo những người đã thêm nhau
   * với `acc` đang trong game gửi lại bảng bạn bè. `leaveSid`: phiên vừa rời, bỏ danh sách của nó khỏi RAM ngay (danh sách người cần báo
   * chụp trước khi bỏ). Tổ đội lỗi presence thì vẫn báo.
   */
  friendAfter(done: Promise<unknown>, acc: number, leaveSid?: string) {
    const mates = friends.mutualOnline(acc);
    if (leaveSid !== undefined) friends.leave(acc, leaveSid);
    const ping = () => this.friendPublish([{ to: leaveSid === undefined ? friends.mutualOnline(acc) : mates }]);
    void done.then(ping, ping);
  }

  /** Phát các thông báo bạn bè lên presence: phòng đang giữ người nhận (có thể ở bản đồ khác) gửi lại bảng bạn bè và dòng log. */
  friendPublish(notes: FriendNote[]) { for (const n of notes) if (n.to.length) this.presence.publish(FRIEND_TOPIC, n); }

  /** Thông báo bạn bè trên presence: người của phòng này có trong `to` nhận dòng log (nếu có) và bảng bạn bè mới. */
  friendNote(n: FriendNote) {
    if (!Array.isArray(n?.to)) return;
    for (const [id, d] of this.pdata) {
      if (!n.to.includes(d.accountId)) continue;
      if (n.text) this.log(id, n.text, FRIEND_COL);
      // Lời thêm bạn của người mình đã chặn không được gửi (mục 5.9).
      const add = n.added && !friends.blocked(d.accountId, n.added.acc) ? n.added : undefined;
      this.sendFriends(id, add && { name: add.name, back: friends.has(d.accountId, add.acc) });
    }
  }

  /**
   * Tin riêng "friends" (bảng bạn bè của chính chủ): danh sách bạn (đã thêm nhau chưa; bản đồ / kênh chỉ khi đã thêm nhau và đang trong
   * game), danh sách chặn. `added`: người vừa thêm mình (`back`: mình đã có người đó, tức hai bên đã là bạn bè; không thì client hiện
   * nút "Thêm lại").
   */
  sendFriends(id: string, added?: { name: string; back: boolean }) {
    const d = this.pdata.get(id); if (!d) return;
    this.clients.getById(id)?.send("friends", { ...friends.view(d.accountId, party.whereIs), ...(added ? { added } : {}) });
  }

  /**
   * Thao tác bạn bè từ client `friend {op, name?}` (#195): `list` (xin bảng), `add` / `block` (theo tên, kể cả người ngoại tuyến: tra
   * danh sách của mình, người đang trong game rồi mới tới DB), `remove` / `unblock` (tên trong danh sách của mình). Luật ở friends.ts.
   * Mỗi thao tác có tên (kể cả bị từ chối, vì tra tên có thể tốn một lần đọc DB) tính một lượt chống spam (ratelimit.friendCheck);
   * thao tác hợp lệ ghi DB phần của chính người gửi qua chuỗi lưu, lỗi ghi thì báo người gửi.
   */
  async friendAction(id: string, m: unknown) {
    const d = this.pdata.get(id); if (!d || d.travelling) return;
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, op = strIn(o.op);
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    if (op === "list") return this.ask(id, "friends", () => this.sendFriends(id)); // theo nhịp ASK_CD như các tin xin lại dữ liệu riêng
    if (op !== "add" && op !== "remove" && op !== "block" && op !== "unblock") return;
    const name = strIn(o.name).replace(/\s+/g, " ").trim().slice(0, 40), acc = d.accountId;
    if (!name) return warn("Gõ tên hồn sư.");
    const rl = friendCheck(acc, Date.now()); if (rl) return warn(rl.error);
    let r: FriendResult;
    if (op === "remove") r = friends.remove(acc, name);
    else if (op === "unblock") r = friends.unblock(acc, name);
    else {
      const on = party.onlineByName(name);
      const t = friends.known(acc, name) ?? (on ? { id: on.acc, name: on.name } : await store.findAccount(name).catch((e) => {
        console.error(`Không tra được hồn sư "${name}" (bạn bè)`, e); return undefined;
      }));
      if (this.pdata.get(id) !== d || d.travelling) return; // rời phòng / đi cổng trong lúc tra DB
      if (t === undefined) return warn("Chưa tra được tên hồn sư, thử lại sau.");
      if (!t) return warn(`Không có hồn sư nào tên "${name}".`);
      r = op === "add" ? friends.add(acc, t) : friends.block(acc, t);
    }
    if ("error" in r) return warn(r.error);
    // Lời "đã thêm bạn" tới cùng một người chỉ gửi lại sau một lúc (xóa rồi thêm lại liên tục không làm ngập log người kia).
    for (const n of r.notes) if (n.added && !friendNoteOk(acc, n.to[0], Date.now())) delete n.added;
    const w = r.write;
    if (w.block) { // lời mời tổ đội giữa hai người có từ trước khi chặn cũng bỏ (cả hai chiều; qua presence như mọi thao tác tổ đội, #149)
      void party.dropInvite(acc, w.other).then((had) => { if (had) this.sendParty(id, true); })
        .catch((e) => console.error("Không bỏ được lời mời tổ đội trong presence", e));
      this.partyPublish(party.dropInvite(w.other, acc).then((had): party.PartyNote[] => (had ? [{ to: [w.other] }] : [])));
    }
    this.chain(d, () => (w.block !== undefined ? store.setBlock(acc, w.other, w.block) : store.setFriend(acc, w.other, !!w.friend)).catch((e) => {
      this.log(id, "Không lưu được danh sách bạn bè / chặn: thao tác vừa rồi có thể mất khi vào lại game.", "#ff6b6b");
      throw e; // chuỗi lưu ghi log và giữ chuỗi
    }));
    this.friendPublish(r.notes);
  }

  // ---------- Tổ đội người chơi (mục 5.9, bước 7.1; trạng thái và luật ở server/src/party.ts) ----------
  /** Phát các thông báo tổ đội lên presence: phòng đang giữ người nhận (có thể ở bản đồ khác) gửi lại khung tổ đội và dòng log. */
  partyPublish(notes: party.PartyNote[] | Promise<party.PartyNote[]>) {
    void Promise.resolve(notes).then((list) => { for (const n of list) void this.presence.publish(party.PARTY_TOPIC, n); })
      .catch((e) => console.error("Không cập nhật được tổ đội trong presence", e));
  }

  /** Thông báo tổ đội trên presence: người của phòng này có trong `to` nhận dòng log (nếu có) và khung tổ đội mới. */
  partyNote(n: party.PartyNote) {
    if (!Array.isArray(n?.to)) return;
    for (const [id, d] of this.pdata) {
      if (!n.to.includes(d.accountId)) continue;
      if (n.text) this.log(id, n.text, n.col);
      this.sendParty(id, true);
    }
  }

  /** Tin riêng "party" (khung tổ đội, party.partyView): chỉ gửi khi nội dung đổi, trừ khi `force`. */
  sendParty(id: string, force = false) {
    const d = this.pdata.get(id); if (!d) return;
    const { view, key } = party.partyView(d.accountId, this.roomId, Date.now());
    if (!force && key === d.partyKey) return;
    d.partyKey = key;
    this.clients.getById(id)?.send("party", view);
  }

  /**
   * Thao tác tổ đội từ client `party {op, name?, sid?}` (7.1): `invite` (theo tên, hoặc `sid` của người cùng phòng khi bấm vào hồn sư),
   * `accept` / `decline` (tên người mời), `leave`, `kick` / `lead` (trưởng nhóm, tên thành viên), `get` (xin khung tổ đội). Server kiểm
   * tra mọi thứ trong party.ts; lời mời hợp lệ mới tính vào giới hạn tốc độ (ratelimit.inviteCheck, như chat). Lỗi báo riêng.
   */
  async partyAction(id: string, m: unknown) {
    const d = this.pdata.get(id); if (!d) return;
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, op = strIn(o.op);
    const warn = (text: string) => this.log(id, text, "#ffb35c");
    let name = strIn(o.name).replace(/\s+/g, " ").trim().slice(0, 40);
    const now = Date.now(), acc = d.accountId;
    if (["invite", "accept", "leave", "kick", "lead"].includes(op)) {
      const locked = arenaQueueLocked(acc) || party.partyMembers(acc).some((member) => arenaQueueLocked(member));
      if (locked || d.arenaBusy) return warn("Tổ đội đang xếp hàng Đại Đấu Hồn Trường: chờ ghép hoặc hủy trước.");
    }
    let r: party.PartyResult;
    if (op === "get") return this.sendParty(id, true);
    if (op === "invite") {
      if (typeof o.sid === "string" && o.sid) {
        // Chỉ hồn sư client đang thấy (bấm vào trên màn hình): `sid` ở xa (lấy từ tin `mini`) không được đổi ra tên (11.4).
        const t = this.state.players.get(o.sid);
        if (!t || !this.interest.sees(id, "p", o.sid)) return warn("Hồn sư này không còn ở đây.");
        name = t.name;
      }
      if (!name) return warn("Gõ tên hồn sư muốn mời, ví dụ /moi Đường Tam.");
      // #195: kiểm chặn trước, để người bị chặn không đọc được tình trạng tổ đội của người chặn qua lỗi của inviteDeny.
      const on = party.onlineByName(name), bw = on && this.blockDeny(acc, on.acc, on.name, "lời mời tổ đội"); if (bw) return warn(bw);
      const ok = party.inviteDeny(acc, name, now);
      if ("error" in ok) return warn(ok.error);
      const rl = inviteCheck(acc, ok.target, now);
      if (rl) return warn(rl.error);
      r = { notes: await party.addInvite(acc, ok.target, now) };
    }
    else if (op === "accept") {
      // Lời mời được tạo trước khi người mời xếp đơn cũng phải bị chặn; nếu không tổ đội mới sẽ làm mục solo cũ sai thành phần.
      const inviter = party.inviteFrom(acc, name, now);
      if (inviter !== null && (arenaQueueLocked(inviter) || arenaReadActive(inviter))) return warn("Người mời đang xếp hàng Đại Đấu Hồn Trường: chờ ghép hoặc hủy trước.");
      const bw = inviter !== null && this.blockDeny(acc, inviter, name, "lời mời tổ đội"); if (bw) return warn(bw); // #195
      r = await party.accept(acc, name, now);
    }
    else if (op === "decline") r = await party.decline(acc, name, now);
    else if (op === "leave") r = await party.leave(acc);
    else if (op === "kick") r = await party.kick(acc, name);
    else if (op === "lead") r = await party.promote(acc, name);
    else return;
    if ("error" in r) { warn(r.error); return this.sendParty(id, true); }
    this.partyPublish(r.notes);
  }

  /**
   * Tin `rally {tx, ty}` (R6 #433): thành viên tổ đội đặt dấu "Tập trung ở đây" ở ô (tx, ty) của bản đồ đang đứng. Server kiểm: có ở trong
   * tổ đội, không ở Đại Đấu Hồn Trường / đang đổi bản đồ, ô nằm trong bản đồ và đi được, rồi mới tính giới hạn tốc độ (ratelimit.rallyCheck).
   * Bản đồ và kênh lấy từ chính phòng này (client không gửi). Hợp lệ thì phát `RALLY_TOPIC` tới thành viên tổ đội (kể cả tiến trình khác);
   * server không giữ dấu, mỗi nơi nhận tự đếm `RALLY.secs`. Lỗi báo riêng người đặt.
   */
  rallyAction(id: string, m: unknown) {
    const p = this.state.players.get(id), d = this.pdata.get(id); if (!p || !d || d.travelling) return;
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, warn = (text: string) => this.log(id, text, "#ffb35c");
    if (this.map.kind === "arena") return warn("Đại Đấu Hồn Trường không có dấu tập trung.");
    const acc = d.accountId, members = party.partyMembers(acc);
    if (members.length < 2) return warn("Cần ở trong tổ đội để đặt dấu Tập trung ở đây.");
    const pt = rallyPoint(o.tx, o.ty, this.map.MW, this.map.MH);
    if (!pt || !this.map.standable(pt.tx * TILE, pt.ty * TILE)) return warn("Chỗ đó không đi được, hãy đặt dấu ở chỗ trống.");
    const rl = rallyCheck(acc, Date.now()); if (rl) return warn(rl.error);
    const msg: RallyMsg = { from: p.name, map: this.state.mapId, ch: this.state.channel, tx: pt.tx, ty: pt.ty, secs: RALLY.secs };
    void this.presence.publish(party.RALLY_TOPIC, { to: members, pid: party.partyIdOf(acc), from: acc, msg, map: MAPS[this.state.mapId]?.name ?? this.state.mapId } satisfies party.RallyRoute);
  }

  /** Dấu tập trung trên presence: người của phòng này có trong `to` (và còn trong đúng tổ đội đó, không chặn người đặt) nhận tin riêng `rally` kèm một dòng chat hệ thống. */
  rallyNote(r: party.RallyRoute) {
    if (!Array.isArray(r?.to) || !r.msg) return;
    const here = r.msg.map === this.state.mapId && r.msg.ch === this.state.channel;
    for (const [id, d] of this.pdata) {
      if (!r.to.includes(d.accountId) || party.partyIdOf(d.accountId) !== r.pid || d.travelling) continue;
      if (d.accountId !== r.from && friends.blocked(d.accountId, r.from)) continue;
      const c = this.clients.getById(id); if (!c) continue;
      c.send("rally", r.msg);
      const at = here ? "" : ` (${r.map}${r.msg.ch ? ` · Kênh ${r.msg.ch}` : ""})`;
      c.send("chat", { ch: "party", name: "Hệ thống", text: `${r.msg.from} đánh dấu Tập trung ở đây${at}.` });
    }
  }

  /**
   * Người cùng chia kinh nghiệm khi `by` hạ hồn thú ở (x, y) (mục 5.9): chính `by`, cùng các thành viên tổ đội của `by` trong phòng này
   * (cùng bản đồ, cùng kênh), chưa gục, không đang chuyển bản đồ, cách chỗ hồn thú gục dưới PARTY_XP_RANGE pixel. Kênh khác của cùng
   * bản đồ là phòng khác nên không tính.
   */
  partyNear(by: string, x: number, y: number) {
    const d = this.pdata.get(by), pid = d ? party.partyIdOf(d.accountId) : 0;
    const out = [by]; if (!pid) return out;
    for (const [id, o] of this.pdata) {
      const p = this.state.players.get(id);
      if (id === by || !p || p.dead || o.travelling || party.partyIdOf(o.accountId) !== pid) continue;
      if (Math.hypot(p.x - x, p.y - y) < PARTY_XP_RANGE) out.push(id);
    }
    return out;
  }

  /** Được nhặt đồ rơi `dr` lúc này không: không ai được ưu tiên, của mình, của tổ đội mình (7.1), hoặc hết DROP_OWNER_SECS giây. */
  canLoot(dr: DropState, id: string) {
    if (!dr.owner || dr.owner === id || dr.ownerTtl <= 0) return true;
    const d = this.pdata.get(id);
    return !!dr.party && !!d && party.partyIdOf(d.accountId) === dr.party;
  }

  /**
   * Câu báo ai được ưu tiên đồ rơi của `owner`, gửi cho người `id` (một mình / cả tổ đội, mục 5.9). `why`: vì sao `owner` được ưu tiên
   * (#119: tinh anh mà người đứng đầu bị khóa thưởng thì là người đóng góp nhiều nhất chưa bị khóa).
   */
  lootNote(owner: string, id: string, why = "đóng góp nhiều nhất") {
    const d = this.pdata.get(owner), team = d && party.partyIdOf(d.accountId) ? "tổ đội " : "";
    if (owner === id) return `${DROP_OWNER_SECS} giây đầu chỉ ${team ? "tổ đội của bạn" : "bạn"} nhặt được (phím E).`;
    return `${DROP_OWNER_SECS} giây đầu thuộc ${team}${this.state.players.get(owner)?.name ?? ""} (${why}).`;
  }

  // ---------- Vòng lặp ----------
  // ---------- Hiệu năng bản đồ lớn (bước 11.4, mục 6 "Đồng bộ xuống client") ----------
  /**
   * Tin hiệu ứng `fx` / `dmg` chỉ gửi cho client cách điểm hiệu ứng dưới SYNC_VIEW.fx (client ở xa không thấy thực thể đó nên vốn bỏ
   * qua); điểm lấy từ `x, y`, `x1, y1` (vệt lướt), hồn sư `id` / `to` hoặc hồn thú `bid`. Không xác định được điểm thì gửi mọi người.
   */
  broadcast(type: string | number, message?: any, options?: Parameters<Room["broadcast"]>[2]) {
    if ((type === "fx" || type === "dmg") && message && !this.interest?.all) {
      const at = this.fxAt(message);
      if (at) {
        const far = this.clients.filter((c) => this.interest.far(c.sessionId, at.x, at.y));
        if (far.length) options = { ...options, except: far.concat(options?.except ?? []) };
      }
    }
    super.broadcast(type, message, options);
  }

  fxAt(m: Record<string, unknown>): { x: number; y: number } | null {
    const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
    if (num(m.x) && num(m.y)) return { x: m.x as number, y: m.y as number };
    if (num(m.x1) && num(m.y1)) return { x: m.x1 as number, y: m.y1 as number };
    const sid = typeof m.id === "string" ? m.id : typeof m.to === "string" ? m.to : null, p = sid ? this.state.players.get(sid) : undefined;
    if (p) return p;
    const b = typeof m.bid === "string" ? this.state.beasts.get(m.bid) : undefined;
    return b ?? null;
  }

  /**
   * Hồn thú có thể nằm trong bán kính r quanh (x, y): ứng viên theo lưới không gian (đã cộng nửa cỡ hồn thú lớn nhất), thay cho quét cả
   * bản đồ. Nơi gọi vẫn tự lọc theo khoảng cách thật.
   */
  beastsNear(x: number, y: number, r: number): [string, BeastState][] {
    const out: [string, BeastState][] = [];
    for (const id of this.interest.beasts.near(x, y, r + BEAST_HALF)) { const b = this.state.beasts.get(id); if (b) out.push([id, b]); }
    return out;
  }

  // ---------- Sương mù khám phá (R8 #435, GAME_DESIGN.md mục 5.17) ----------
  /** Bản đồ này có sương mù (bản đồ trong FOG.open mở sẵn; sân đấu nằm trong đó nên không bao giờ có). */
  get fogOn() { return fogMapOn(this.state.mapId); }
  fogDims() { return fogDims(this.map.MW, this.map.MH); }

  /**
   * Nạp bitset của người chơi ở bản đồ này (chạy trong chuỗi lưu: không chạy chồng lần ghi) rồi mở ô quanh chỗ đứng và gửi cả bitset. Dòng ghi cho
   * file Tiled khác, sai kích thước hoặc có bit thừa (dữ liệu lạ) thì bỏ, bắt đầu từ trống: tài khoản cũ bắt đầu trống và chỉ mở quanh chỗ đứng.
   */
  fogLoad(id: string) {
    const d = this.pdata.get(id); if (!d || !this.fogOn) return;
    this.chain(d, async () => {
      const dims = this.fogDims(), mapId = this.state.mapId;
      let bits: Uint8Array | null = null;
      try { bits = await store.getFog(d.accountId, mapId, mapFile(mapId)); } catch (e) { console.error(`Không đọc được sương mù của #${d.accountId} (${mapId})`, e); }
      if (this.pdata.get(id) !== d) return;
      if (bits && !fogValid(bits, dims)) { console.warn(`[fog] #${d.accountId} ${mapId}: bỏ bitset sai dạng (${bits.length} byte, cần ${dims.bytes})`); bits = null; }
      d.fog = bits ?? fogEmpty(dims);
      if (!bits) d.fogDirty = true;
      this.fogMarkOne(id, d);
      d.fogAdd.length = 0; // cả bitset gửi ngay dưới đây, không cần gửi lại từng ô
      this.sendFog(id);
    });
  }

  /** Mở ô quanh vị trí thật của một người (server tự lấy từ state, không nhận gì từ client). */
  fogMarkOne(id: string, d: PData) {
    const p = this.state.players.get(id); if (!p || !d.fog || d.travelling) return;
    const add = fogReveal(d.fog, this.fogDims(), p.x / TILE, p.y / TILE);
    if (add.length) { d.fogDirty = true; for (const i of add) d.fogAdd.push(i); }
  }
  fogMark() { this.pdata.forEach((d, id) => this.fogMarkOne(id, d)); }

  /** Gửi các ô vừa mở (tối đa FOG.maxAdd mỗi tin, dư để nhịp sau) cho từng người, tin `fogd {add}`; số ô thô theo thứ tự hàng. */
  fogSend() {
    this.pdata.forEach((d, id) => {
      if (!d.fog || !d.fogAdd.length) return;
      const c = this.clients.getById(id); if (!c) return;
      c.send("fogd", { add: d.fogAdd.splice(0, FOG.maxAdd) });
    });
  }

  /** Tin riêng `fog {bits}`: cả bitset ô thô của chính người đó ở bản đồ này (cỡ lưới client tự tính từ cỡ bản đồ). Chưa nạp xong thì chưa gửi. */
  sendFog(id: string) {
    const d = this.pdata.get(id), c = this.clients.getById(id); if (!d?.fog || !c) return;
    d.fogAdd.length = 0;
    c.send("fog", { bits: d.fog });
  }

  /** Ghi bitset nếu đổi từ lần ghi trước (chỉ gọi trong chuỗi lưu). Lỗi ghi: đánh dấu lại để lần sau ghi tiếp, không làm hỏng lần lưu khác. */
  async fogFlush(d: PData) {
    if (!d.fog || !d.fogDirty) return;
    d.fogDirty = false;
    const mapId = this.state.mapId;
    try { await store.saveFog(d.accountId, mapId, mapFile(mapId), d.fog); }
    catch (e) { d.fogDirty = true; console.error(`Lưu sương mù của #${d.accountId} (${mapId}) thất bại`, e); }
  }

  /**
   * Bản đồ nhỏ (tin `mini`, mỗi SYNC_VIEW.mini giây): `p` vị trí theo ô `[sid, x, y]` của hồn sư, hồn thú thường từ nghìn năm `b`
   * `[x, y, bậc]` và đồ rơi `d` `[x, y, bậc]` cả bản đồ, vì `players` / `beasts` / `drops` trong state chỉ còn thực thể ở gần. Tinh anh,
   * thú vương luôn có trong state. Hồn sư tính RIÊNG cho từng client (R5, `RADAR.far`): người lạ ngoài `RADAR.far` ô không có trong
   * tin (không lộ vị trí); đồng đội tổ đội cùng kênh và người cùng tông môn luôn có. Hồn thú / đồ rơi dùng chung một bản.
   */
  sendMini() {
    const t = (v: number) => Math.floor(v / TILE), b: number[] = [], d: number[] = [];
    this.state.beasts.forEach((q) => { if (q.tier >= 3 && !q.rank) b.push(t(q.x), t(q.y), q.tier); });
    this.state.drops.forEach((q) => { d.push(t(q.x), t(q.y), q.tier); });
    // Đồng đội: tài khoản -> sid trong phòng; cùng tông: tông -> các sid.
    const sidOf = new Map<number, string>(), clan = new Map<number, string[]>();
    for (const [sid, x] of this.pdata) {
      sidOf.set(x.accountId, sid);
      const tg = this.state.players.get(sid)?.tong ?? 0;
      if (tg > 0) { const l = clan.get(tg); if (l) l.push(sid); else clan.set(tg, [sid]); }
    }
    const far = RADAR.far * TILE, far2 = far * far;
    for (const c of this.clients) {
      const me = this.state.players.get(c.sessionId), mx = this.pdata.get(c.sessionId);
      if (!me || !mx) continue;
      const ids = new Set<string>(), p: (string | number)[] = [];
      const put = (id: string) => { if (ids.has(id)) return; const q = this.state.players.get(id); if (!q) return; ids.add(id); p.push(id, t(q.x), t(q.y)); };
      put(c.sessionId);
      for (const id of this.interest.players.near(me.x, me.y, far)) {
        const q = this.state.players.get(id);
        if (q && (q.x - me.x) ** 2 + (q.y - me.y) ** 2 <= far2) put(id);
      }
      for (const acc of party.partyMembers(mx.accountId)) { const id = sidOf.get(acc); if (id) put(id); }
      if (me.tong > 0) for (const id of clan.get(me.tong) ?? []) put(id);
      c.send("mini", { p, b, d });
    }
  }

  /**
   * PERF_LOG=1: cộng dồn thời gian tick / bản vá, mỗi 10 giây một dòng `[perf]`. Nhịp chậm (#273): thời gian thật từ đầu tick tới hết bản
   * vá vượt PERF_SLOW_MS, hoặc nhịp bắt đầu trễ (từ đầu nhịp trước quá PERF_GAP_MS) thì in `[perf-slow]` ở nhịp sau: từng đoạn của tick,
   * CPU luồng chính trong nhịp (gần bằng thời gian thật = server bận; nhỏ hơn nhiều = hệ điều hành cắt luồng), GC chồng lên nhịp, và
   * khoảng giữa hai nhịp (CPU ngoài tick: tin nhắn, chuỗi lưu, phòng khác). Dòng `[perf]` thêm số nhịp chậm trong 10 giây.
   */
  perfLog(t0: number, t1: number, t2: number, c0: number, ti: number) {
    const f = this.perf, c2 = cpuMs(), pv = this.perfPrev, T = this.perfT;
    f.n++; f.tick += t1 - t0; f.patch += t2 - t1; f.max = Math.max(f.max, t2 - t0);
    const a = this.perfAll; a.n++; a.tick += t1 - t0; a.patch += t2 - t1; a.max = Math.max(a.max, t2 - t0);
    // In nhịp chậm của các nhịp trước (bản ghi GC đã tới).
    for (const s of this.perfPend.splice(0)) {
      const g = gcIn(s.t0, s.t2), gg = gcIn(s.t0 - s.gap, s.t0);
      console.log(`[perf-slow] ${this.state.mapId}#${this.state.channel} ${s.at} wall ${s.wall.toFixed(1)} ms, cpu ${s.cpu.toFixed(1)} ms, ` +
        `gc ${g.ms.toFixed(1)} ms${g.kinds.length ? ` (${g.kinds.join("+")})` : ""} | ${s.parts} | gap ${s.gap.toFixed(1)} ms, cpu ngoài tick ${s.gapCpu.toFixed(1)} ms, ` +
        `gc ngoài tick ${gg.ms.toFixed(1)} ms | players ${this.state.players.size}, beasts ${this.state.beasts.size}`);
    }
    const wall = t2 - t0, gap = pv.t0 ? t0 - pv.t0 : 0;
    if (wall > PERF_SLOW_MS || gap > PERF_GAP_MS) {
      this.perfSlowN++;
      const d = (i: number) => (T[i + 1] - T[i]).toFixed(1);
      const A = this.perfAuto, top = A.slice().sort((x, y) => y[1] - x[1]).slice(0, 3).map(([i, ms]) => `${i.slice(0, 4)} ${ms.toFixed(1)}`).join(", ");
      const plans = this.perfPlan.map(([i, ms, w]) => `${i.slice(0, 4)} ${ms.toFixed(1)} ms ${w}`).join(", ");
      this.perfPend.push({ at: clock(), t0, t2, wall, cpu: c2 - c0, gap, gapCpu: pv.t2 ? c0 - pv.c2 : 0,
        parts: `auto ${A.length} người ${A.reduce((a, x) => a + x[1], 0).toFixed(1)} ms (lớn nhất ${top || "-"}), tìm đường ${this.perfPlan.length} lần (${plans || "-"}) | ` +
        `tick ${(ti - t0).toFixed(1)} (đầu ${d(0)}, người ${d(1)}, thú ${d(2)}, thế giới ${d(3)}, cuối ${d(4)}), view ${(t1 - ti).toFixed(1)}, vá ${(t2 - t1).toFixed(1)}` });
    }
    Object.assign(pv, { t0, t2, c2 });
    if (Date.now() - f.at < 10000) return;
    let awake = 0; this.state.beasts.forEach((b) => { if (this.interest.awake(b.x, b.y)) awake++; });
    console.log(`[perf] ${this.state.mapId}#${this.state.channel} tick ${(f.tick / f.n).toFixed(3)} ms, patch ${(f.patch / f.n).toFixed(3)} ms, ` +
      `max ${f.max.toFixed(2)} ms, slow ${this.perfSlowN}, beasts ${this.state.beasts.size} (awake ${awake}), players ${this.state.players.size}`);
    const sv = this.perfSave;
    if (sv.n) { console.log(`[perf-save] ${this.state.mapId}#${this.state.channel} ${sv.n} lần lưu, chụp túi ${sv.snap.toFixed(1)} ms, ghi DB (đồng bộ) ${sv.store.toFixed(1)} ms, ${sv.items} món`); Object.assign(sv, { n: 0, snap: 0, store: 0, items: 0 }); }
    Object.assign(f, { n: 0, tick: 0, patch: 0, max: 0, at: Date.now() }); this.perfSlowN = 0;
  }

  tick(dt: number) {
    if (this.state.channel && (this.channelT -= dt * 1000) <= 0) {
      this.channelT = PRESENCE_HEARTBEAT_MS;
      void touchChannel(this.state.mapId, this.roomId, this.state.channel).catch((e) => console.error("Không gia hạn được kênh", e));
    }
    // Lease tài khoản có TTL: tiến trình chết không để khóa vĩnh viễn; mất Redis thì đóng phiên để tránh split-brain.
    for (const [id, d] of this.pdata) {
      d.leaseT -= dt * 1000;
      if (d.leaseT > 0) continue;
      d.leaseT = PRESENCE_HEARTBEAT_MS;
      void presenceBackend.renewLease(accountLeaseKey(d.accountId), d.leaseOwner, PRESENCE_TTL_MS).then((ok) => {
        if (!ok) this.clients.getById(id)?.leave(4001);
      }).catch((e) => { console.error(`Không gia hạn được phiên giữ tài khoản #${d.accountId}`, e); this.clients.getById(id)?.leave(1011); });
    }
    const pt = this.perfOn ? this.perfT : null; // #273: mốc đoạn của tick (PERF_LOG=1)
    if (pt) { pt[0] = performance.now(); this.perfAuto.length = 0; this.perfPlan.length = 0; }
    // Khảo hạch hằng ngày: qua 00:00 giờ Việt Nam thì mỗi giây kiểm tra một lần, đặt lại bộ bài và báo người đang chơi.
    if ((this.dayT -= dt) <= 0) {
      this.dayT = 1;
      const day = this.dailyDay();
      for (const [id, d] of this.pdata) if (!d.travelling && this.dailyFresh(d, day)) this.sendDaily(id, "reset");
      for (const [id, d] of this.pdata) if (!d.travelling && this.tongFresh(d, day)) this.sendTong(id); // tông vụ (#197)
    }
    // Tổ đội (7.1): mỗi 0,5 giây ghi cấp / sinh lực vào party.ts (đồng đội ở bản đồ khác cũng thấy), gửi lại khung tổ đội khi đổi,
    // dọn lời mời hết hạn và người rời game quá lâu.
    this.partyT -= dt;
    if (this.partyT <= 0) {
      this.partyT = 0.5;
      for (const [id, d] of this.pdata) {
        const p = this.state.players.get(id);
        if (p && !d.travelling) party.setLive(d.accountId, id, { level: p.level, vh: p.vh, hp: p.hp, maxHp: p.maxHp, dead: p.dead });
      }
      this.partyPublish(party.sweep(Date.now()));
      for (const id of this.pdata.keys()) this.sendParty(id);
    }
    // việc hẹn giờ (các nhát của hồn kỹ liên hoàn)
    if (this.timers.length) {
      const due: (() => void)[] = [];
      this.timers = this.timers.filter((t) => { t.t -= dt; if (t.t > 0) return true; due.push(t.fn); return false; });
      for (const fn of due) fn();
    }
    if (pt) pt[1] = performance.now();

    // người chơi
    this.state.players.forEach((p, id) => {
      const d = this.pdata.get(id)!;
      d.atkCd -= dt; d.inv -= dt; d.lastHit += dt; d.fight += dt;
      d.haste -= dt; d.shockMpCd -= dt; d.comboT += dt; // hiệu ứng bộ hồn hạch (5.2)
      for (let i = 0; i < 4; i++) if (p.cds[i] > 0) p.cds[i] = Math.max(0, p.cds[i] - dt);
      if (p.ctCd > 0) p.ctCd = Math.max(0, p.ctCd - dt); // hồn kỹ Chân Thân (9.6)
      if (d.ava || d.avaCd.size) this.tickAva(id, dt);
      if (d.fus) this.tickFusion(id, dt); // lời mời Võ Hồn Dung Hợp Kỹ đang chờ (#192)
      for (const [k, t] of d.skCd) if (t - dt <= 0) d.skCd.delete(k); else d.skCd.set(k, t - dt);
      for (let i = 0; i < p.bcds.length; i++) if (p.bcds[i] > 0) p.bcds[i] = Math.max(0, p.bcds[i] - dt);
      if (p.swCd > 0) p.swCd = Math.max(0, p.swCd - dt);
      if (Math.hypot(d.input.x, d.input.y) > MOVE_DEAD) p.seqT += dt; // thời gian input cuối đã áp, kể cả lúc choáng / gục (mục 6)
      if (d.danCd > 0) d.danCd = Math.max(0, d.danCd - dt);
      if (d.shieldT > 0) { d.shieldT -= dt; if (d.shieldT <= 0) d.shield = 0; p.shield = Math.ceil(d.shield); }
      if (d.buffs.size) {
        for (const [b, x] of d.buffs) { x.t -= dt; if (x.t <= 0 || p.dead) d.buffs.delete(b); } // cả đội gục thì mất hiệu ứng có lợi
        this.syncBuffs(p, d);
      }
      if (d.travelling) { p.moving = false; return; } // đang chuyển bản đồ: đứng yên chờ client rời phòng
      this.tickPStatus(id, p, d, dt);
      // Tự bán từ xa (#216): túi vừa đổi (sendBag đặt cờ) thì xét một lần, không quét túi mỗi nhịp.
      if (d.sellCheck) { d.sellCheck = false; this.autoSell(id); this.autoSalvage(id); }
      if (p.dead) {
        if (d.target) setLock(this, id, d, "");
        d.deadT -= dt;
        if (d.deadT <= 0) {
          // Cả đội gục: về doanh trại, cả đội hồi đầy.
          const s = this.spawnPoint(); p.x = s.x; p.y = s.y; p.dead = false; d.inv = 1.5;
          d.down.clear(); d.benchHp.clear(); this.recalc(id, true);
          this.log(id, "Đã về doanh trại, cả đội hồi phục.", "#86e0b0");
          this.sendSquad(id, true);
        }
        return;
      }
      // Tự săn (Auto 1): quyết định và đặt hướng đi như input của người chơi, trước bước di chuyển dưới đây.
      if (d.auto) { if (this.perfOn) { const t = performance.now(); d.auto.tick(dt); const ms = performance.now() - t; this.perfAll.auto += ms; this.perfAuto.push([id, ms]); } else d.auto.tick(dt); }
      // Choáng / Trói / Đóng băng (từ 3.5, do chiêu báo trước của hồn thú): không đi; Làm chậm giảm tốc. Mê hoặc (#116): bỏ qua phím,
      // server tự đi lung tung (charmDir).
      const ctl = this.pctl(d), cm = ctl.wander && !ctl.noMove ? this.charmDir(p, d, dt) : null;
      if (!ctl.wander) d.charm = null;
      const { x: ix, y: iy } = cm ?? (ctl.noMove || ctl.wander ? { x: 0, y: 0 } : d.input); const il = Math.hypot(ix, iy);
      // 11.1: ngoài giao chiến tự chạy (× RUN_MULT) trừ khi giữ Shift; giao chiến thì đi bộ. Tăng tốc, Làm chậm vẫn nhân như cũ.
      p.calm = d.fight >= TEAM_COMBAT_SECS; p.walk = d.walk;
      const sp = cm ? d.speed * PLAYER_CHARM.spd * (1 - ctl.slow)
        : ctl.noMove ? 0 : d.speed * (1 + this.buffV(d, "spd")) * (1 - ctl.slow) * (p.calm && !d.walk ? RUN_MULT : 1);
      p.spd = cm ? 0 : sp; // client dự đoán chuyển động bằng đúng tốc độ này; đang Mê hoặc thì không dự đoán (server tự đi)
      p.moving = il > MOVE_DEAD;
      if (p.moving) {
        if (d.absorbing) this.cancelAbsorb(id, "Di chuyển: đã hủy hấp thụ, hồn hoàn vẫn còn trong túi.");
        this.map.moveEnt(p, ix * sp * dt, iy * sp * dt, PLAYER_HW, PLAYER_HH, moveNudge(!!d.auto));
        d.dir = { x: ix / il, y: iy / il };
        p.dir = dir4(ix, iy);
      }
      if (d.absorbing) { d.absorbing.t += dt; p.absorb = Math.min(0.999, d.absorbing.t / d.absorbing.dur); if (d.absorbing.t >= d.absorbing.dur) this.finishAbsorb(id); }
      if (d.target) tickLock(this, id, p, d); // khoá mục tiêu (M3 #750): trong tầm thì quay mặt, đánh thường theo hồi chiêu
      this.portalHint(id, p, d);
      this.waypointTick(id, p, d);
      if (d.travelCast?.wp) {
        const cast = d.travelCast, wp = cast.wp!;
        if (p.moving || Math.hypot(p.x - wp.x0, p.y - wp.y0) > 2) this.stopCast(id, "Di chuyển: đã hủy truyền tống.");
        else if ((cast.t -= dt) <= 0) { d.travelCast = null; this.finishRecall(id, cast.portal, wp); }
      } else if (d.travelCast) {
        const cast = d.travelCast;
        if (this.map.portalAt(p.x, p.y) !== cast.portal) { d.travelCast = null; this.log(id, "Đã rời cổng: hủy đi qua cổng."); }
        else if ((cast.t -= dt) <= 0) {
          d.travelCast = null;
          const why = this.travelDeny(id, cast.portal.name);
          if (why === null) this.beginTravel(id, cast.portal); else if (why) this.log(id, why, "#ffb35c");
        }
      }
      this.regenPlayer(p, d, dt);
      this.tickDowns(id, dt);
      this.tickEnergy(id, dt);
      d.squadT -= dt;
      if (d.squadT <= 0) { d.squadT = 0.5; this.sendSquad(id); }
    });

    if (pt) pt[2] = performance.now();
    // 11.4: lưới hồn sư theo vị trí mới, đánh dấu vùng hồn thú còn thức quanh mọi hồn sư.
    this.interest.beginTick();
    // hồn thú: trạng thái trước (sát thương theo thời gian có thể hạ hồn thú), rồi di chuyển và đánh
    for (const bid of [...this.state.beasts.keys()]) this.tickStatus(bid, dt);
    this.state.beasts.forEach((b, id) => {
      const bd = this.bdata.get(id)!, td = TIERS[b.tier];
      // Bọc trứng (#162): không đi, không đánh, không hồi máu; đếm giờ nở ở eggs.tick. Không giữ mục tiêu / hung hăng sau khi bị đánh
      // (tự săn thấy bọc như hồn thú thường vừa bị đánh: `hitBy` / `calm` vẫn đếm như hồn thú khác).
      if (b.egg) { bd.calm += dt; bd.target = null; if (b.aggro) b.aggro = false; return; }
      bd.cd -= dt; bd.anim += dt; bd.calm += dt;
      // 11.4: hồn thú thường không mục tiêu, không đang về chỗ sinh / niệm chiêu / bị đẩy, cách mọi hồn sư quá SYNC_VIEW.wake thì ngủ:
      // không lang thang, không tìm mục tiêu (không ai trong tầm phát hiện), chỉ hồi máu và đếm hồi chiêu như khi thức.
      if (!bd.elite && !bd.target && !bd.ret && !bd.cast && !bd.kx && !bd.ky && !this.interest.awake(b.x, b.y)) {
        if (b.moving) b.moving = false;
        if (b.aggro) b.aggro = false;
        bd.skT -= dt; for (const s of bd.skills) s.cd -= dt;
        if (bd.calm > BEAST_REGEN.delay) this.regenBeast(b, bd, dt);
        return;
      }
      if (bd.elite) this.tickElite(id, b, bd, dt);
      if (!this.state.beasts.has(id)) return; // thú vương vừa rút đi (BĐ5)
      const king = bd.elite?.king;
      // Thú vương đang gầm chuyển giai đoạn (BĐ5): đứng yên, không đánh, không tung chiêu. Boss thế giới đang lặn (BĐ6e) cũng vậy.
      if (king?.roar || king?.world?.dive) { b.moving = false; bd.kx = 0; bd.ky = 0; return; }
      // Từ 2.5c: hồn thú đang chịu trạng thái `wander` (Mê hoặc) bỏ mục tiêu, đi lung tung.
      const charm = [...bd.st.keys()].some((s) => STATUS[s].wander);
      if (charm) bd.target = null;
      let tgt = bd.target ? this.state.players.get(bd.target) : undefined;
      // Không đuổi theo người đã vào vùng an toàn, đang chuyển bản đồ (mục 5.3, 6) hoặc đang tàng hình (Yêu Hồ, 2.5c).
      const off = (p: PlayerState, pid: string) => { const pd = this.pdata.get(pid); return p.dead || this.map.inSafe(p.x, p.y) || !!pd?.travelling || !!pd?.buffs.has("hide"); };
      // Thú vương (BĐ5) chỉ đuổi người trong hang và nhận mục tiêu là bất kỳ ai trong hang; hồn thú khác xa chỗ sinh quá BEAST_LEASH.r
      // thì bỏ mục tiêu và chạy về chỗ sinh (11.1); đang về thì không nhận mục tiêu, kể cả người vừa đánh nó.
      const far = !king && Math.hypot(b.x - bd.hx, b.y - bd.hy) > BEAST_LEASH.r;
      if (tgt && (off(tgt, bd.target!) || (king && !this.map.inLair(tgt.x, tgt.y)))) { bd.target = null; tgt = undefined; }
      // Thú thực vật đứng yên (#116): mục tiêu ra ngoài tầm với thì bỏ (không đuổi theo được).
      if (tgt && bd.rooted && Math.hypot(tgt.x - b.x, tgt.y - b.y) > bd.reach) { bd.target = null; tgt = undefined; }
      if (tgt && far && !bd.ret) bd.ret = BEAST_LEASH.secs;
      if (bd.ret > 0) {
        bd.target = null; tgt = undefined;
        if ((bd.ret -= dt) <= 0 || Math.hypot(b.x - bd.hx, b.y - bd.hy) < BEAST_LEASH.near) { bd.ret = 0; bd.wt = 0; }
      }
      if (!tgt && !bd.ret && (b.tier >= 1 || king) && !charm) {
        let best = king ? Infinity : bd.rooted ? Math.min(BEAST_AGGRO_R, bd.reach) : BEAST_AGGRO_R; // thú đứng yên: trong tầm với
        const look = (p: PlayerState | undefined, pid: string) => {
          if (!p || off(p, pid) || (king && !this.map.inLair(p.x, p.y))) return;
          const dd = Math.hypot(p.x - b.x, p.y - b.y); if (dd < best) { best = dd; bd.target = pid; tgt = p; }
        };
        // Thú vương xét mọi người trong hang; hồn thú khác chỉ xét hồn sư gần theo lưới không gian (11.4).
        if (king) this.state.players.forEach(look);
        else for (const pid of this.interest.players.near(b.x, b.y, BEAST_AGGRO_R)) look(this.state.players.get(pid), pid);
      }
      // Vừa có mục tiêu: chờ TELE_FIRST giây mới tung chiêu báo trước đầu tiên (3.5).
      if (tgt && !b.aggro) bd.skT = Math.max(bd.skT, TELE_FIRST[0] + Math.random() * (TELE_FIRST[1] - TELE_FIRST[0]));
      b.aggro = !!tgt;
      bd.skT -= dt; for (const s of bd.skills) s.cd -= dt;
      const hw = Math.max(3, td.size / 3);
      // Khống chế (mục 5.1): Choáng đứng yên và không đánh; Trói không đi (vẫn đánh khi kề bên).
      // Bị khống chế không di chuyển thì cũng không bị đẩy lùi.
      // Từ 2.5c đọc cờ trong bảng STATUS (Mê hoặc không đánh); Làm chậm / Mị hoặc giảm tốc độ theo tầng (tối đa SLOW_CAP).
      // Từ 3.5: Câm lặng (noSkill) chỉ chặn và ngắt chiêu báo trước; Choáng, Mê hoặc (noAtk) chặn cả đánh thường lẫn chiêu.
      const stun = bd.st.has("stun");
      let noMove = false, noAtk = false, noSkill = false, slow = 0;
      for (const [s, x] of bd.st) { const def = STATUS[s]; noMove ||= def.noMove; noAtk ||= def.noAtk; noSkill ||= def.noSkill; slow += def.slow * x.n; }
      // Tinh anh đang giao chiến không tự hồi máu (bỏ giao chiến thì hồi đầy, mục 5.4).
      // Bỏ đuổi về chỗ sinh (11.1): hồn thú thường hồi nhanh BEAST_LEASH.heal trên đường về (tinh anh hồi đầy khi bỏ giao chiến).
      if (bd.ret > 0) { if (!bd.elite) this.regenBeast(b, bd, dt, BEAST_LEASH.heal); }
      else if (!tgt && bd.calm > BEAST_REGEN.delay && !bd.elite?.engaged) this.regenBeast(b, bd, dt);
      this.tickCast(id, b, bd, dt, noAtk || noSkill);
      if (stun) { bd.kx = 0; bd.ky = 0; b.moving = false; return; }
      if (noMove) { bd.kx = 0; bd.ky = 0; }
      if (bd.kx || bd.ky) { this.moveBeast(b, bd.kx * dt, bd.ky * dt, hw); bd.kx *= 0.85; bd.ky *= 0.85; if (Math.abs(bd.kx) < 2 && Math.abs(bd.ky) < 2) { bd.kx = 0; bd.ky = 0; } }
      if (bd.cast) { b.moving = false; return; } // đang báo trước: đứng yên, không đánh thường
      let mx = 0, my = 0, sp = td.spd * (1 - Math.min(SLOW_CAP, slow)) * (bd.buffs.has("rage") ? 1 + ELITE_RAGE.spd : 1) * (king?.spd ?? 1);
      if (bd.ret > 0) {
        const ex = bd.hx - b.x, ey = bd.hy - b.y, ed = Math.hypot(ex, ey);
        if (ed > 1 && !noMove) { mx = ex / ed; my = ey / ed; sp *= BEAST_GAIT.ret; }
      } else if (tgt) {
        sp *= BEAST_GAIT.chase; // 11.1: đuổi nhanh hơn lang thang
        const dx = tgt.x - b.x, dy = tgt.y - b.y, dd = Math.hypot(dx, dy);
        // Chiêu báo trước: hết chờ, chiêu hết hồi và mục tiêu trong tầm (không nhắm người trong vùng an toàn: đã bỏ mục tiêu ở trên).
        // Chiêu đánh dấu (BĐ5, `mark`): nhắm một người tham gia ngẫu nhiên trong tầm thay cho mục tiêu đang đuổi; `weak` (BĐ6d):
        // người tham gia ít máu nhất (chưa có ai thì mục tiêu đang đuổi).
        if (!(noAtk || noSkill || bd.skT > 0)) for (const s of bd.skills) {
          if (s.cd > 0) continue;
          const near = dd <= s.def.range ? [bd.target!, tgt] as [string, PlayerState] : null;
          const m = s.def.mark ? this.markTarget(b, bd, s.def.range) : s.def.weak ? this.markTarget(b, bd, s.def.range, true) ?? near : near;
          if (m) { this.beginCast(id, b, bd, s, m[0], m[1]); return; }
        }
        if (bd.rooted) { if (Math.abs(dx) > 1) b.face = dx > 0 ? 1 : -1; } // đứng yên: chỉ quay mặt về mục tiêu (#116)
        if (dd > beastMelee(b.tier, bd.rooted)) { if (!noMove && !bd.rooted) { mx = dx / dd; my = dy / dd; } }
        else if (bd.cd <= 0 && !noAtk) { bd.cd = BEAST_ATK_CD; this.hurtPlayer(bd.target!, this.beastDmg(bd) * atkRoll(Math.random())); }
      } else {
        bd.wt -= dt;
        // Mê hoặc: đổi hướng liên tục quanh chỗ đang đứng, đi nhanh hơn lúc lang thang thường.
        if (charm && bd.wt > 0.7) bd.wt = 0;
        if (bd.wt <= 0) {
          const [ox, oy, w] = charm ? [b.x, b.y, 80] : [bd.hx, bd.hy, 2 * BEAST_WANDER];
          bd.wt = charm ? 0.4 + Math.random() * 0.3 : 2 + Math.random() * 3; bd.tx = ox + (Math.random() - 0.5) * w; bd.ty = oy + (Math.random() - 0.5) * w;
        }
        const ex = bd.tx - b.x, ey = bd.ty - b.y, ed = Math.hypot(ex, ey);
        if (ed > 4 && !noMove && !bd.rooted) { mx = ex / ed; my = ey / ed; sp *= charm ? BEAST_GAIT.charm : BEAST_GAIT.wander; }
      }
      b.moving = !!(mx || my);
      if (b.moving) { this.moveBeast(b, mx * sp * dt, my * sp * dt, hw); if (Math.abs(mx) > 0.1) b.face = mx > 0 ? 1 : -1; }
    });

    if (pt) pt[3] = performance.now();
    // #161: vùng lưu lại trên mặt đất (sau vòng hồn thú: vùng vừa để lại gây nhịp đầu ngay trong nhịp này).
    this.grounds.tick(dt);
    // #163: Cực Hàn tích tầng Hàn cho người tham gia trong hang, Hỏa Đàn xả tầng.
    this.cold.tick(dt);
    // #174: Thủy Triều Dâng dâng đợt nước mới (vùng có tác dụng từ nhịp sau, sau báo trước).
    this.tide.tick(dt);
    // #173: hang chia phần luân phiên đổi phần đang hóa (vùng có tác dụng sau báo trước).
    this.split.tick(dt);
    // 11.4: lưới hồn thú / đồ rơi theo vị trí sau khi di chuyển (đạn, hồn kỹ, lọc đồng bộ dùng tới nhịp sau).
    this.interest.syncEntities();
    // đạn hồn kỹ
    this.projs = this.projs.filter((pr) => {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      if (pr.life <= 0 || this.map.hits(pr.x, pr.y + 6, 1, 1)) return false;
      for (const [bid, b] of this.beastsNear(pr.x, pr.y, 5))
        if (Math.hypot(b.x - pr.x, b.y - TIERS[b.tier].size / 2 - pr.y) < TIERS[b.tier].size / 2 + 5) { pr.fire(bid); return false; }
      if (pr.foe) for (const fid of this.foesOf(pr.owner)) {
        const f = this.state.players.get(fid);
        if (f && !f.dead && Math.hypot(f.x - pr.x, f.y - ARENA.body - pr.y) < ARENA.body + 5) { pr.foe(fid); return false; }
      }
      return true;
    });

    // #162: bọc trứng đếm giờ nở, hết giờ thì nở nhện con
    this.eggs.tick(dt);

    // hồn hoàn rơi dưới đất: hết DROP_TTL_SECS giây thì biến mất (từ 3.2 hấp thụ từ túi, không còn ai "đang hấp thụ" hồn hoàn dưới đất)
    this.state.drops.forEach((dr, id) => {
      dr.ttl -= dt; if (dr.ownerTtl > 0) dr.ownerTtl = Math.max(0, dr.ownerTtl - dt);
      if (dr.ttl <= 0) { this.state.drops.delete(id); this.coreDrops.delete(id); this.equipDrops.delete(id); }
    });

    if (pt) pt[4] = performance.now();
    // hồi sinh hồn thú
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.2;
      const { zones } = this.map, counts = zones.map(() => 0); this.bdata.forEach((b) => { if (!b.elite) counts[b.zone]++; }); // tinh anh không tính vào `count`
      zones.forEach((z, i) => { if (counts[i] < z.count) this.spawnBeast(i); });
    }

    // thú vương bị hook test `clear` xóa: coi như đã rời (không sinh lại trong cùng khung giờ)
    if (this.king?.bid && !this.state.beasts.has(this.king.bid)) this.king.bid = null;
    // tinh anh: bị hạ (hoặc bị hook test xóa) thì hồi sinh sau ELITE.respawn giây ngẫu nhiên, server không báo giờ (mục 5.4)
    this.elites.forEach((slot, i) => {
      if (slot.bid && !this.state.beasts.has(slot.bid)) { slot.bid = null; slot.t = ELITE.respawn[0] + Math.random() * (ELITE.respawn[1] - ELITE.respawn[0]); }
      if (!slot.bid && (slot.t -= dt) <= 0) this.spawnElite(i, true);
    });

    // bản đồ nhỏ (11.4): vị trí cả bản đồ, phòng sân đấu (không lọc) thì không cần
    if (!this.interest.all && (this.miniT -= dt) <= 0) { this.miniT = SYNC_VIEW.mini; this.sendMini(); }

    // sương mù khám phá (R8): đánh dấu ô quanh từng người theo nhịp FOG.markSecs, gửi phần mới theo nhịp FOG.sendSecs
    if (this.fogOn) {
      if ((this.fogT -= dt) <= 0) { this.fogT = FOG.markSecs; this.fogMark(); }
      if ((this.fogSendT -= dt) <= 0) { this.fogSendT = FOG.sendSecs; this.fogSend(); }
    }

    // lưu định kỳ (bỏ qua người đang chuyển bản đồ: transaction đi cổng là lần ghi cuối của phòng này cho người đó)
    this.saveT += dt;
    if (this.saveT > 30) { this.saveT = 0; this.pdata.forEach((d, id) => { if (!d.travelling) this.save(id); }); }
    if (pt) pt[5] = performance.now();
  }

  /** Hồn thú di chuyển nhưng không bước vào vùng an toàn. */
  moveBeast(b: BeastState, dx: number, dy: number, hw: number) {
    const ox = b.x, oy = b.y;
    this.map.moveEnt(b, dx, dy, hw, 3);
    // Thú vương (BĐ5) không ra khỏi hang; boss thế giới (BĐ6e) không ra khỏi sàn đấu.
    if (this.map.inSafe(b.x, b.y) || (b.rank >= 2 && this.map.lair && !this.map.inLair(b.x, b.y))) { b.x = ox; b.y = oy; }
  }
}

// ---------- Lễ thức tỉnh (gọi từ /api/awaken, trước khi vào phòng) ----------
/** Tài khoản chưa có võ hồn: tặng Lam Ngân Thảo + 1 võ hồn SSR tự chọn. Hồn lực bẩm sinh do server roll. */
export async function awakenAccount(accountId: number, name: string, choice: unknown):
  Promise<{ character: Character } | { status: number; error: string }> {
  const pick = AWAKEN_CHOICES.find((v) => v.id === choice);
  if (!pick) return { status: 400, error: "Hãy chọn một võ hồn SSR trong danh sách." };
  // Tạo nhân vật diễn ra ngay trước bước chọn SSR của lễ thức tỉnh.
  if (!(await store.getLooks(accountId)).chosen) return { status: 409, error: "Hãy tạo nhân vật trước lễ thức tỉnh." };
  // Hồn lực bẩm sinh 1–10 thuộc về hồn sư: làm cấp khởi đầu của cả hai võ hồn.
  const level = Math.random() < 0.04 ? 10 : 1 + Math.floor(Math.pow(Math.random(), 1.6) * 9);
  const character = await store.awaken(accountId, name, [AWAKEN_GIFT, pick.id], pick.id, level);
  if (!character) return { status: 409, error: "Tài khoản đã thức tỉnh võ hồn rồi." };
  return { character };
}

/** Tạo nhân vật (một lần): client gửi ngoại hình LPC (Mẫu dựng sẵn / Tự tạo); preset kiểu cũ (client cũ) được đổi sang LPC gần nhất (HL2 #571, parseNewLooks). */
export async function chooseLooks(accountId: number, body: unknown):
  Promise<{ looks: AccountLooks } | { status: number; error: string }> {
  const looks = parseNewLooks(body);
  if (!looks) return { status: 400, error: "Ngoại hình không hợp lệ." };
  if (!(await store.chooseLooks(accountId, looks))) return { status: 409, error: "Bạn đã chọn ngoại hình rồi, không đổi được nữa." };
  return { looks: { ...looks, chosen: true, changes: 0 } };
}
