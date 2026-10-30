// Phòng của một bản đồ (mapId): toàn bộ logic game chạy ở đây (server-authoritative).
// Mỗi bản đồ có thể có nhiều phòng (kênh); mọi phòng dùng chung một lớp, khác nhau ở dữ liệu bản đồ.
// Client chỉ gửi ý định (hướng di chuyển, bấm đánh...), server quyết định kết quả.
import { Room, Client, ServerError, matchMaker, OnMessageException, type RoomException } from "colyseus";
import { randomUUID } from "node:crypto";
import { MapState, PlayerState, BeastState, DropState } from "./schema.ts";
import { TIERS, VOHON, xpNeed, xpBlocked, calcStats, TICK_RATE, tierOfYears, vohonIndex,
  AWAKEN_GIFT, AWAKEN_CHOICES, AWAKEN_LEVEL, TEAM_COMBAT_SECS,
  MAPS, DEFAULT_MAP, parseNewLooks, encodeLpc, dir4,
  BOAT_CAST, CHANNEL_MAX, CHANNEL_CD,
  TILE,
  itemDef, formatHonTe, type ItemDef,
  RING_ITEM, DROP_OWNER_SECS,
  SHARD_UNLOCK, starCost,
  BONE_ITEM, BONE_SLOTS, parseBone, boneBonus,
  CORE_ITEM, parseCore, type CoreData,
  CORE_STAT_IDS, type CoreStat, EQUIP_ITEM, equipDefTotal, equipWeaponRoll, equipName, rollEquipDrop, rollEquipCharm, EQUIP_CHARM, type EquipData, type EquipDrop,
  coreSlotOf, coreBonus, coreFx, coreSetCounts, type CoreFx,
  bonePassive, type BonePassive, type PassiveBuff,
  parseBoneSubs, boneAddSubs,
  STATUS, CC_TIER_MULT, BEAST_REGEN, buffBit,
  bondSum,
  loadoutOf, phoenixFieldR, type ChanThanStat, type BondKey, type SkillDef, type StatusId, type StatusApply, type BuffId,
  type BeastSkillDef, type Tele,
  BOSSES, bossIndex, ELITE, ELITE_RAGE, beastName, beastBuffBit, BEAST_BUFFS, type BeastBuffId,
  KING, kingActive, kingNext, vnDay, type BossDef, type FormDef,
  WORLD, worldActive, worldNext, worldBossOn, type He,
  npcDef, NPC_RANGE, looksChangeCost, TONG_SWITCH_DAYS, tongDef, sellPrice, type NpcRole,
  QUEST_STARTER, QUEST_AFTER, questChain, questStart, questStatus, questRewardText, type QuestReward, type QuestProgress, type QuestEvent, type QuestGoal,
  DAILY, dailyIds,
  tongTaskIds,
  PARTY_XP_RANGE, PARTY_BUFF_R, PARTY_BUFF_MULT, PARTY_BUFF_SKIP, BUFFS,
  type ResEffect,
  herbBonus,
  RADAR, type AutoHint, type AutoSettings, type AutoSummary,
  type OfflinePower,
  type SellSettings } from "../../../shared/data.ts";
import { hpRegen, mpRegen } from "../../../shared/data.ts"; // hồi sinh lực / hồn lực (mục 4), regenPlayer
import { powerScore, teamPowerScore } from "../../../shared/data.ts"; // điểm Sức mạnh (bảng Xếp Hạng X3, bảng Nhân vật)
import { FOG } from "../../../shared/data.ts"; // sương mù khám phá (R8)
import type { Vitals } from "../../../shared/vitals.ts";
import { fogDims, fogEmpty, fogReveal, fogValid, fogOn as fogMapOn } from "../../../shared/fog.ts";
import { ASK_CD, MSG_GROUP, MSG_HARD, MSG_FLOOD_CODE, type MsgGroup } from "../../../shared/data.ts"; // nhịp tin client xin lại dữ liệu riêng (#165)
import { clampDir, MOVE_DEAD } from "../../../shared/move.ts";
import { loadMap, mapFile, mapRoute, type GameMap, type Portal, type EliteSpot, type NpcSpot, type Zone } from "../map.ts";
import { BOSS_TOPIC, ANNOUNCE_TOPIC, bossOffset, bossNow, type BossEvent } from "../schedule.ts";
import { store, Character, type AccountLooks, type Location, type Item, type Bag, type AutoRow, type SoldRow, type TongRow, type SocialRow } from "../db.ts";
import { takeToken, type TokenBucket, type ChatChannel } from "../ratelimit.ts";
import { SpiderEggs } from "./eggs.ts";
import * as party from "../party.ts";
import * as join from "./join.ts";
import * as autoRun from "./autoRun.ts";
import { friends, FRIEND_TOPIC, type FriendNote } from "../friends.ts";
import { watchGc, cpuMs } from "../perf.ts";
import { arenaDequeue, arenaQueued, arenaReadCancel } from "./arenaQueue.ts";
import { Interest } from "./interest.ts";
import { AutoHunter } from "./autoHunt.ts";
import { type BagSent } from "../../../shared/bagSync.ts";
import { Grounds } from "./ground.ts";
import { presenceBackend, bg } from "../presence.ts";
import { ColdStacks } from "./cold.ts";
import { _gmSetAdmin, type GmCmd } from "../gm.ts"; // lệnh GM của admin (#518)
import { Tide } from "./tide.ts";
import { LairSplit } from "./split.ts";
import { newItem, bagUsed, itemLabel, shardCount, type GearStats } from "./items.ts";
import { questBump } from "./questBump.ts";
import { coreSetNoteOf, beastDmgOf, buffMask, contribOf, contributors, pickNearest, pickWeakest, fxPoint } from "./calc.ts";
import { targetMsg, manualAttack } from "./lock.ts";
import * as equip from "./equip.ts";
import * as bones from "./bones.ts";
import * as absorb from "./absorb.ts";
import * as skill from "./skill.ts";
import * as combat from "./combat.ts";
import * as boss from "./boss.ts";
import * as social from "./social.ts";
import * as shop from "./shop.ts";
import * as gm from "./gm.ts";
import * as tong from "./tong.ts";
import { calendarAction } from "./calendar.ts";
import { welfareAction } from "./welfare.ts";
import { achvAction } from "./achv.ts";
import { mailAction } from "./mail.ts";
import { bicanhAction } from "./bicanh.ts";
import * as quest from "./quest.ts";
import * as bag from "./bag.ts";
import * as team from "./team.ts";
import * as rank from "./rank.ts";
import * as arena from "./arena.ts";
import * as travel from "./travel.ts";
import * as persist from "./persist.ts";
import * as tick from "./tick.ts";
import * as loot from "./loot.ts";
import * as spawn from "./spawn.ts";
import * as status from "./status.ts";
import * as itemUse from "./item.ts";
import * as cast from "./cast.ts";
import * as kill from "./kill.ts";
import * as ava from "./ava.ts";
import * as tienco from "./tienco.ts";

export interface PData {
  /** Hồn thú đang khoá (M3 #750, rooms/lock.ts); "" = không khoá. */
  target: string;
  accountId: number;
  leaseOwner: string;
  /** Mốc giờ thật (`Date.now()`) phải gia hạn lease tài khoản kế tiếp; không tính bằng `dt` vì tick bị kẹp 100 ms (máy tải thì chậm hơn TTL). */
  leaseAt: number;
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
  saveSig: string;      // dấu vết tiến độ + vị trí ở lần ghi định kỳ gần nhất (#1001): không đổi thì lần lưu định kỳ kế bỏ qua
  saveIn: number;       // giây còn lại tới lần lưu định kỳ kế của người này (rải đều theo người, #1001)
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
  vit: Vitals | null; vitAt: number; // tin riêng "vit" (#949, rooms/vitals.ts): bản đã gửi gần nhất (null = chưa gửi) và giờ gửi (ms, giờ thật)
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
  tongBusy: boolean;   // đang chờ DB ghi lệnh gia nhập / rời tông (#796): lệnh tông tới sau bị từ chối ngay, bộ nhớ chỉ đổi sau khi ghi xong
  tongPend: { week: number; tong: string; n: number }[]; // điểm tông vụ chờ ghi cùng túi (#320): chỉ bỏ khỏi hàng sau khi lần ghi thành công
  // Đại Đấu Hồn Trường (7.2): đang chờ DB đọc Elo trước khi vào hàng chờ; lúc xin bảng xếp hạng gần nhất (ms, chống xin dồn dập).
  arenaBusy: boolean; arenaTopAt: number; arenaLiveAt: number; arenaWatchAt: number; resonanceTopAt: number;
  // Bảng Xếp Hạng (rank.ts): lúc xin bảng gần nhất (ms), dấu vết điểm đã ghi `rank_scores` và lúc ghi (ms).
  rankTopAt: number; rankSig: string; rankAt: number;
  bicanhDay: string; // Bí Cảnh (bicanh.ts): khóa ngày Bí Cảnh (05:00) đã gửi trạng thái cho người này; đổi ngày thì gửi lại
  achvReady: number; // Thành Tựu (achv.ts): số thành tựu đã đạt chưa nhận ở lần báo gần nhất (-1 = chưa báo); chỉ báo lại khi đổi
  welfareDay: string; // Phúc Lợi (welfare.ts): ngày (room.today()) đã gửi trạng thái Sổ Điểm Danh cho người này; đổi ngày thì gửi lại
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
export interface Hit { kind: "attack" | "skill"; done: boolean; onHit?: () => void; } // onHit: gọi một lần khi trúng lần đầu (5.2, bộ Lam Ngân)
export interface AuthData { accountId: number; ch: Character; owned: Character[]; team: number[]; looks: AccountLooks; loc: Location; bag: Bag; starter: boolean;
  claims: { day: string; n: number }; wclaims: { day: string; n: number }; shardBuy: { day: string; n: number }; wps: string[]; auto: AutoRow; tong: TongRow; social: SocialRow; }
/**
 * Niệm truyền tống (11.2): tên nơi đến, phí (đồng, trừ lúc dịch chuyển), ô Hồi Thành Phù sẽ dùng (không có = truyền tống trận), chỗ
 * đứng lúc bắt đầu (lệch quá 2 pixel thì hủy: di chuyển, bị đẩy / kéo), tổng số giây (thanh niệm của client).
 */
export interface RecallCast { label: string; fee: number; itemId?: string; x0: number; y0: number; dur: number; }
/** Một trạng thái trên hồn thú: giây còn lại, số tầng, độ lớn mỗi tầng (sát thương mỗi giây hoặc tỉ lệ), người gây. */
export interface SInst { t: number; n: number; v: number; src: string; pair?: string; } // pair (#192): đồng đội dung hợp chia đôi đóng góp
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
export interface EliteData {
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
export interface KingData { def: BossDef; slot: number; life: number; phase: 1 | 2; roar: number; spd: number; noted: Set<string>; rankT: number;
  world: WorldData | null; } // world: boss thế giới (BĐ6e), cùng bộ máy thú vương
/**
 * Boss thế giới (mục 5.4, BĐ6e): `rage` đã nổi giận (sau WORLD.enrageSecs), `slamT` chờ trước Bạo Nộ kế tiếp; `weakNext` mốc máu
 * WORLD.weakAt kế tiếp, `weak` / `weakT` điểm yếu hệ đang hiện và giây còn lại; `chargeT` / `armorT` / `miasmaT` / `diveT` chờ trước
 * lần cơ chế kế tiếp (BossDef.world); `brk` số lần khống chế đã trúng khi đang tích lực, `brkAt` lần tính gần nhất theo người (một
 * hồn kỹ gây nhiều khống chế chỉ tính một lần); `shield` / `shieldT` khiên Bá Thể; `dive` giây lặn còn lại (> 0 = đang lặn), `surf` chỗ
 * nổi lên đã báo trước (#118).
 */
export interface WorldData {
  rage: boolean; slamT: number; weakNext: number; weak: He | null; weakT: number;
  chargeT: number; armorT: number; miasmaT: number; diveT: number;
  brk: number; brkAt: Map<string, number>; shield: number; shieldT: number; dive: number; surf: { x: number; y: number } | null;
}
/** Trạng thái boss thế giới lúc mới sinh / bỏ giao chiến: các cơ chế chờ `every` × WORLD.firstMech giây mới chạy lần đầu. */
export function newWorld(def: BossDef): WorldData {
  const m = def.world ?? {}, first = (e?: number) => (e ?? 0) * WORLD.firstMech;
  return { rage: false, slamT: WORLD.slamEvery, weakNext: 0, weak: null, weakT: 0, chargeT: first(m.charge?.every), armorT: first(m.armor?.every),
    miasmaT: first(m.miasma?.every), diveT: first(m.dive?.every), brk: 0, brkAt: new Map(), shield: 0, shieldT: 0, dive: 0, surf: null };
}
/** Bộ hằng số theo bậc của boss có lịch: thú vương KING, boss thế giới WORLD (người tham gia, thưởng, lượt mỗi ngày). */
export const bossK = (k: KingData | null | undefined) => (k?.world ? WORLD : KING);
/** Mũi hồn kỹ đang bay của hồn sư `owner`: chạm hồn thú đầu tiên thì gọi `fire` (sát thương và trạng thái của hồn kỹ). */
interface Proj { x: number; y: number; vx: number; vy: number; life: number; owner: string; fire: (bid: string) => void; foe?: (pid: string) => void; } // foe: trúng đối thủ (7.2)
/** Tùy chọn của một lần gây sát thương lên hồn thú. `direct` = false: sát thương theo thời gian (không chí mạng, không đẩy lùi,
 *  không tính Phá giáp, không lan Cảm điện). `chain`: sát thương lan của Cảm điện (không chí mạng, không lan tiếp).
 *  `pair` (#192): đòn của Võ Hồn Dung Hợp Kỹ, phiên đồng đội dung hợp: không nhận ràng buộc, đóng góp tinh anh / thú vương / boss chia đôi. */
export interface DmgOpt { crit?: number; lifesteal?: number; direct?: boolean; chain?: boolean; pair?: string; }
/** Một đòn của Võ Hồn Dung Hợp Kỹ (#192): đồng đội dung hợp và công trung bình của hai người (không ràng buộc). */
export interface FusHit { pair: string; atk: number; }

let nextId = 1;
export const uid = (p: string) => p + (nextId++).toString(36);

// ---------- Phiên giữ tài khoản (mục 6 "Mỗi tài khoản một phiên") ----------
/** Phiên giữ tài khoản: lease `account:<acc>` trong presence, từ onJoin tới khi lần ghi DB cuối của phiên đó xong (accountLeaseKey). */
/**
 * Chat xuyên phòng (#188, mục 6 "Xã hội"): tổ đội, tin riêng, thế giới, tông môn phát lên chủ đề presence này; mọi phòng nghe và gửi
 * tin `chat` cho người chơi của mình có trong `to`, hoặc thuộc tông `tong` (#198); không có cả hai: mọi người (kênh thế giới). Không
 * lưu lịch sử.
 */
export const CHAT_TOPIC = "chatx";
/** Màu dòng log của bạn bè / chặn (#195). */
export const FRIEND_COL = "#9fd8ff";
export interface ChatRoute { to?: number[]; tong?: string; from?: number; msg: { ch: ChatChannel; name: string; text: string; to?: string } }
/** Tài khoản của phiên (client.auth; cả người xem trận, #278). */
export const accOf = (c: Client) => (c.auth as { accountId?: number } | undefined)?.accountId;
/** Lý do từ chối bán / bỏ / hấp thụ / nộp đồ trong lúc phần thưởng boss đang chờ DB xác nhận lượt (claimBusy, #165). */
export const CLAIM_BUSY = "Đang lưu phần thưởng boss / mảnh vừa đổi, đợi một chút."; // claimBusy: rương, thưởng boss, đổi mảnh ở Thương hội (#282)
/** Đang chờ DB ghi phần thưởng boss (grantChest) hoặc hook test `claimhold` giữ: chặn mở rương, bán / bỏ / hấp thụ / nộp / sắp xếp / tự bán. */
export const claimHeld = (d: { claimBusy: number; testClaimHold: boolean }) => d.claimBusy > 0 || d.testClaimHold;
/** Phiên mới chờ phiên cũ lưu xong tối đa bấy nhiêu mili giây; quá thì từ chối vào phòng (không nạp dữ liệu cũ). */
export const HOLD_WAIT_MS = 8000;

// ---------- Giá trị client gửi (mục 6 "Mỗi message: ép kiểu và kẹp giá trị", #164) ----------
// Chỉ kiểm `typeof`, không Number() / String() / phép so sánh trên giá trị thô: msgpack giải ra object tùy ý, đổi kiểu một object
// có thể ném lỗi.
/** Số hữu hạn client gửi; khác (chuỗi, object, NaN, Infinity…) thì 0. */
const numIn = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
/** Bộ đếm token đầy cho mọi nhóm tin của một kết nối (#734). */
export const newMsgBuckets = (): Record<MsgGroup | "hard", TokenBucket> => {
  const t = Date.now(), b = { hard: { n: MSG_HARD.burst, t } } as Record<MsgGroup | "hard", TokenBucket>;
  for (const g of Object.keys(MSG_GROUP) as MsgGroup[]) b[g] = { n: MSG_GROUP[g].burst, t };
  return b;
};
/** Số nguyên client gửi; khác thì NaN (hàm nhận tự từ chối). */
export const intIn = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : NaN);
/** Chuỗi client gửi; khác thì "". */
export const strIn = (v: unknown) => (typeof v === "string" ? v : "");
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
export const kingClaimCache = new Map<string, Set<number>>();
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
export const eliteLocks = new Map<string, Map<number, number>>();
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
export async function persistEliteLock(key: string, changes: Map<number, number>) {
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
export const fusionReady = new Map<number, number>();
export const fusionKey = (accountId: number) => `fusion:${accountId}`;
export const worldChatKey = (accountId: number) => `world-chat:${accountId}`;
/** Số giây hồi chiêu dung hợp kỹ còn lại của tài khoản `acc` (0 = dùng được); bỏ mục đã hết hạn. */
export function fusionCdLeft(acc: number) {
  const t = fusionReady.get(acc); if (t === undefined) return 0;
  const left = (t - Date.now()) / 1000; if (left <= 0) fusionReady.delete(acc);
  return Math.max(0, left);
}
/** Khóa nhận thưởng của tinh anh `b` trên bản đồ `mapId` (khóa của eliteLocks): theo loài tinh anh (mã BOSSES). */
export const eliteKey = (mapId: string, b: BeastState) => `${mapId}|${BOSSES[b.species]?.id ?? b.species}`;
/** Số giây còn lại trước khi tài khoản `acc` nhận lại thưởng tinh anh `key` (0 = nhận được); bỏ các mục đã hết hạn của `key`. */
export function eliteLockLeft(key: string, acc: number, now = Date.now()): number {
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
export async function persistKingSeat(mapId: string, slot: number, seat: KingSeat, claimed: Set<number>) {
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
export async function takeKingSeat(mapId: string, slot: number, until: number, roomId: string, boss: string): Promise<{ seat: KingSeat; claimed: Set<number>; boss: string }> {
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
export const BEAST_HALF = Math.max(...TIERS.map((t) => t.size)) / 2;

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
export async function touchChannel(mapId: string, roomId: string, ch: number) {
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
export const channelSwitchAt = new Map<number, number>(); // dòng hết CHANNEL_CD giây bị sweepChannelMaps dọn (#957); hook test `chan {reset}` ở gm.ts xóa tay
export const channelSwitchKey = (accountId: number) => `channel-switch:${accountId}`;
/**
 * Kênh vừa rời không qua đường server duyệt (đóng tab, mất mạng, client tự rời; onLeave không ghi khi đi cổng / đổi kênh đã commit): trong
 * CHANNEL_CD giây tài khoản chỉ được vào lại đúng kênh đó của bản đồ (onAuth từ chối kênh khác khi kênh cũ còn mở và còn chỗ;
 * pickChannel đưa về kênh cũ). Không có lớp này thì client tự rời rồi joinById kênh khác là né được luật đổi kênh (giao chiến, chờ).
 * Từ #164 (`travel`): đi cổng / đổi kênh / truyền tống sang bản đồ khác commit xong cũng ghi kênh server đã chọn ở bản đồ đích, để
 * client vào đúng kênh đó (mục 6: client không chọn kênh đích) chứ không tự joinById kênh khác.
 */
export const leftRoom = new Map<number, { mapId: string; roomId: string; ch: number; until: number; travel?: boolean }>();
export const channelLeftKey = (accountId: number) => `channel-left:${accountId}`;
/**
 * #957: dọn dòng hết hạn của channelSwitchAt (đã qua CHANNEL_CD giây) và leftRoom (until đã qua): hai Map này khóa theo tài khoản nên
 * không dọn thì phình theo số tài khoản từng chơi. Chỉ xóa dòng mà luật đổi kênh đã coi như không có (không đổi luật); trả số dòng đã xóa.
 */
export function sweepChannelMaps(now: number) {
  let n = 0;
  for (const [k, at] of channelSwitchAt) if (now - at >= CHANNEL_CD * 1000) { channelSwitchAt.delete(k); n++; }
  for (const [k, l] of leftRoom) if (l.until <= now) { leftRoom.delete(k); n++; }
  return n;
}
const CHANNEL_SWEEP_MS = 5 * 60_000;
setInterval(() => sweepChannelMaps(Date.now()), CHANNEL_SWEEP_MS).unref();
/** Hook test `chan {nolock}`: lần rời phòng kế tiếp của tài khoản không ghi leftRoom (bot thử chọn kênh khi vào game). */
export const testNoLeaveLock = new Set<number>(); // map-co-dinh: đường xóa duy nhất là `testNoLeaveLock.delete` ở onLeave (join.ts), như trước khi tách
/**
 * Hook test `offline {ago}` (Auto 3, chỉ GAME_TEST): lần ủy thác offline kế tiếp của tài khoản ghi thời điểm bắt đầu lùi `ago` giây,
 * như đã thoát từ `ago` giây trước (giả lập thời gian trôi: bot vào lại ngay mà vẫn nhận thưởng theo quãng vắng mặt đó).
 */
export const testOfflineAgo = new Map<number, number>(); // map-co-dinh: đường xóa duy nhất là `testOfflineAgo.delete` ở onLeave (join.ts), như trước khi tách
/** Kênh vừa rời của tài khoản ở bản đồ `mapId` nếu còn khóa và kênh đó còn mở, còn chỗ (trong `list`). */
export async function leftLock(accountId: number, mapId: string, list: ChannelInfo[]) {
  // Redis: sổ presence dùng chung là nguồn duy nhất (Map RAM của tiến trình khác / lần đi cổng trước có thể đã cũ, chặn nhầm); RAM: presence chính là Map.
  const shared = await presenceBackend.getJson<{ mapId: string; roomId: string; ch: number; until: number; travel?: boolean }>(channelLeftKey(accountId));
  const l = presenceBackend.mode === "redis" ? shared : shared ?? leftRoom.get(accountId);
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
export interface Buyback { key: string; item: Item; price: number; }
export const buybacks = new Map<number, Buyback[]>();
const BUYBACK_TTL_MS = 6 * 3600 * 1000;
export const buybackKey = (accountId: number) => `buyback:${accountId}`;
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


/**
 * Hook test `daily {shift}` (`daily`): lệch ngày của khảo hạch hằng ngày cho cả tiến trình (MapRoom.dailyDay); `tweek {shift}` #197 (`tong`): lệch số ngày
 * của tuần tông (tongNow, tongWeek) cho cả tiến trình. Chỉ đổi khi GAME_TEST=1 (hook ở gm.ts, nên là đối tượng chung thay cho hai biến `let`).
 */
export const testShift = { daily: 0, tong: 0 };

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
  announceSub = (m: { text: string }) => this.broadcast("chat", { sys: true, name: "Hệ thống", text: String(m?.text ?? "") });
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
  /** Mốc giờ thật (`Date.now()`) gia hạn kênh kế tiếp (cùng lý do với `PData.leaseAt`). */
  channelAt = 0;
  kickSub = (m: { accountId: number; sessionId: string }) => {
    for (const other of this.clients) if (other.sessionId !== m.sessionId && (other.auth as AuthData)?.accountId === m.accountId) other.leave(4001);
  };

  /**
   * Đá phiên cũ của tài khoản (ở mọi phòng) và chờ nó nhả tài khoản, tức là lần ghi cuối của nó (onLeave nối vào chuỗi lưu) đã
   * xong, rồi mới cho onAuth nạp DB. Không chờ thì phiên mới nạp bản cũ, phiên cũ lưu sau, và lần lưu kế tiếp của phiên mới
   * ghi đè làm mất tiến độ (mục 6).
   */
  waitOldSession(accountId: number, sessionId: string) { return join.waitOldSession(this, accountId, sessionId); }

  /** Phiên `sessionId` giữ tài khoản (lease `account:<acc>` trong presence) và đá phiên khác của tài khoản ở mọi phòng (mục 6). */
  holdAccount(accountId: number, sessionId: string) { join.holdAccount(this, accountId, sessionId); }

  /** Nhả tài khoản sau lần ghi cuối của phiên `sessionId` (chỉ khi phiên đó vẫn đang giữ). */
  releaseAccount(accountId: number, sessionId: string) { return join.releaseAccount(this, accountId, sessionId); }

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

  onAuth(client: Client, options: { token?: string }) { return join.onAuth(this, client, options); }

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
    this.onLimitedMsg("social", "party", (c, m: unknown) => { void this.partyAction(c.sessionId, m).catch((e) => console.error("Lỗi thao tác tổ đội", e)); }); // tổ đội người chơi (7.1)
    this.onLimitedMsg("social", "rally", (c, m: unknown) => this.rallyAction(c.sessionId, m)); // đánh dấu "Tập trung ở đây" cho tổ đội (R6 #433)
    this.onLimitedMsg("social", "quest", (c, m: { op: unknown; chain: unknown }) => this.questAction(c.sessionId, m?.op, m?.chain)); // nhiệm vụ (6.2; `chain` = khảo hạch hằng ngày)
    this.onLimitedMsg("social", "arena", (c, m: { op: unknown; roomId?: unknown }) => this.arenaAction(c.sessionId, m?.op, m?.roomId)); // Đại Đấu Hồn Trường (7.2)
    this.onLimitedMsg("read", "resonance", (c, m: { op?: unknown; page?: unknown; pageSize?: unknown }) => {
      if (m?.op === "top") return this.resonanceTop(c.sessionId, m.page, m.pageSize);
      this.sendRes(c.sessionId, [], true);
    }); // cộng minh (8.2): bảng tiến độ riêng; op=top là bảng xếp hạng
    this.onLimitedMsg("read", "rank", (c, m: { op?: unknown; board?: unknown; page?: unknown; pageSize?: unknown }) => rank.rankAction(this, c.sessionId, m)); // Bảng Xếp Hạng (5.19): boards / top
    this.onLimitedMsg("read", "mail", (c, m: { op?: unknown; id?: unknown }) => mailAction(this, c.sessionId, m)); // Thư (5.24): get / read (read) / claim, claimAll, del (thêm nhịp trade trong mail.ts)
    this.onLimitedMsg("read", "achv", (c, m: { op?: unknown; id?: unknown }) => achvAction(this, c.sessionId, m)); // Thành Tựu (5.23): get (read) / claim (thêm nhịp trade trong achv.ts)
    this.onLimitedMsg("read", "welfare", (c, m: { op?: unknown; day?: unknown; pay?: unknown }) => welfareAction(this, c.sessionId, m)); // Phúc Lợi (5.21): get (read) / sign, makeup (thêm nhịp trade ở welfare.ts); giờ do server quyết
    this.onLimitedMsg("read", "bicanh", (c, m: { op?: unknown; id?: unknown; pay?: unknown }) => bicanhAction(this, c.sessionId, m)); // Bí Cảnh (5.22): get (read) / enter, buy (thêm nhịp trade ở bicanh.ts); giờ do server quyết
    this.onLimitedMsg("read", "calendar", (c, m: { op?: unknown; week?: unknown }) => calendarAction(this, c.sessionId, m)); // Lịch Hoạt Động (5.20): lịch tuần theo giờ server, chỉ đọc
    this.onMessage("chat", (c, m: unknown) => this.chatAction(c.sessionId, m)); // chat bản đồ / tổ đội / riêng / thế giới (#188)
    this.onMessage("friend", (c, m: unknown) => this.friendAction(c.sessionId, m)); // bạn bè và chặn (#195)
  }

  onJoin(client: Client, o: unknown, auth: AuthData) { join.onJoin(this, client, o, auth); }

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

  onLeave(client: Client) { return join.onLeave(this, client); }

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

  // ---------- Lưu người chơi (logic ở `persist.ts`, #702; các hàm dưới chỉ chuyển tiếp, `ArenaRoom` vẫn override `write`) ----------
  chain(d: PData, fn: () => unknown) { return persist.chain(this, d, fn); }
  chainLatest(d: PData, key: string, fn: () => unknown) { persist.chainLatest(this, d, key, fn); }
  save(id: string) { return persist.save(this, id); }
  unsaved(id: string) { return persist.unsaved(this, id); }
  write(id: string, final = false): Promise<boolean> { return persist.write(this, id, final); }
  writeNow(id: string, final = false): Promise<boolean> { return persist.writeNow(this, id, final); }

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
    const power = powerScore(total), teamPower = this.teamPowerOf(d); // Sức mạnh (X3): trước khi cộng Chân Thân (hiệu ứng trận không tính), cùng hàm với hạng mục `suc_manh`
    if (d.ava?.row === v.rowId) total.maxHp = Math.round(total.maxHp * (1 + (d.ava.stats.hp ?? 0))); // như recalc
    c.send("stats", { rowId: v.rowId, total, base, gear, power, teamPower });
  }

  /** Điểm Sức mạnh của đội hình đang lưu (`teamPowerScore`, bước X3): chỉ số thật của từng võ hồn trong ô đội, không buff tạm / Chân Thân; dùng cho bảng Nhân vật và hạng mục `suc_manh`. */
  teamPowerOf(d: PData) {
    const seen = new Set<number>(), stats: ReturnType<typeof calcStats>[] = [];
    for (const r of d.team) {
      const v = r && !seen.has(r) ? d.owned.find((o) => o.rowId === r) : undefined; if (!v) continue; seen.add(r);
      stats.push(calcStats(Math.max(0, vohonIndex(v.vohon)), v.level, v.rings.map(tierOfYears), v.stars, this.boneBonusOf(d, r), this.coreBonusOf(d, r), d.res.bonus, herbBonus(v.herbs)));
    }
    return teamPowerScore(stats);
  }
  /** Sinh lực tối đa của một võ hồn sở hữu (dù đang ra trận hay không), kể cả hồn cốt (4.2), hồn hạch (5.2) đang gắn, cộng minh (8.2) và tiên thảo (BĐ6b). */
  maxHpOf(d: PData, v: Character) {
    return calcStats(Math.max(0, vohonIndex(v.vohon)), v.level, v.rings.map(tierOfYears), v.stars, this.boneBonusOf(d, v.rowId), this.coreBonusOf(d, v.rowId),
      d.res.bonus, herbBonus(v.herbs)).maxHp;
  }
  // ---------- Cộng minh, võ hồn sở hữu và đội hình (mục 5.1, 5.10) ----------
  /** Đội hình / võ hồn / cộng minh: logic ở `team.ts` (#702), các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ (`ArenaRoom` vẫn override `switchSlot`). */
  resCheck(id: string, announce = true) { team.resCheck(this, id, announce); }
  sendRes(id: string, ev: { pillar: number; step: number; up: boolean }[] = [], force = false) { team.sendRes(this, id, ev, force); }
  resonanceTop(id: string, rawPage: unknown, rawPageSize: unknown) { team.resonanceTop(this, id, rawPage, rawPageSize); }
  sendVohons(c: Client) { team.sendVohons(this, c); }
  sendSquad(id: string, force = false) { team.sendSquad(this, id, force); }
  setTeam(c: Client, slots: unknown) { team.setTeam(this, c, slots); }
  switchSlot(c: Client, slot: number) { team.switchSlot(this, c, slot); }
  activate(id: string, next: Character, text?: string) { team.activate(this, id, next, text); }
  persistTeam(d: PData) { team.persistTeam(this, d); }


  // ---------- Tự săn (Auto 1, mục 5.13; quyết định ở autoHunt.ts) ----------
  /** Hướng đi của hồn sư như tin `input` (người chơi gửi, hoặc tự săn đặt): kẹp độ dài, cờ đi bộ. Vị trí vẫn do tick() tính. */
  applyInput(d: PData, x: number, y: number, walk: boolean) { d.input = clampDir(x, y); d.walk = walk; }

  /** Người chơi tự bấm đánh / hồn kỹ / Chân Thân / kỹ năng hồn cốt: tay luôn được ưu tiên, tắt tự săn trước. */
  autoHand(id: string) { if (this.pdata.get(id)?.auto) this.autoStop(id, "bạn tự ra đòn."); }

  /** Tự săn và ủy thác offline (xem rooms/autoRun.ts, #702): các hàm dưới chỉ chuyển tiếp để `onMessage`, autoHunt.ts, combat.ts, item.ts, join.ts, persist.ts, travel.ts, gm.ts gọi như cũ. */
  autoAction(id: string, op: unknown, cfg: unknown): void { autoRun.autoAction(this, id, op, cfg); }
  autoStop(id: string, why: string): void { autoRun.autoStop(this, id, why); }
  sendAuto(id: string, why?: string, sum?: AutoSummary): void { autoRun.sendAuto(this, id, why, sum); }
  useAutoToken(id: string, d: PData, it: Item, def: ItemDef): void { autoRun.useAutoToken(this, id, d, it, def); }
  flushAuto(d: PData): Promise<void> { return autoRun.flushAuto(this, d); }
  offlineZone(id: string): Zone | null { return autoRun.offlineZone(this, id); }
  claimOffline(id: string): Promise<void> { return autoRun.claimOffline(this, id); }
  sendOffline(id: string): void { autoRun.sendOffline(this, id); }

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

  /** Đi cổng / truyền tống / Hồi Thành Phù (xem rooms/travel.ts, #702): các hàm dưới chỉ chuyển tiếp để `onMessage`, `tick`, `useItem`, gm.ts gọi như cũ. */
  travelDeny(id: string, name: string): string | null { return travel.travelDeny(this, id, name); }

  travel(c: Client, name: string) { travel.travel(this, c, name); }

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

  beginTravel(id: string, portal: Portal, to?: { roomId: string; ch: number }, undo?: () => void) { travel.beginTravel(this, id, portal, to, undo); }

  // ---------- Kênh (mục 6 "Nhiều kênh") ----------
  /**
   * Tin riêng "channels": các kênh đang mở của bản đồ (số kênh, số người, tối đa, đầy) và kênh hiện tại; tối đa 1 lần / giây. Xin
   * dồn trong 1 giây thì không bỏ mà hẹn gửi một lần khi hết giây đó (client đang chờ danh sách mới).
   */
  sendChannels(c: Client) { return join.sendChannels(this, c); }

  /**
   * Đổi sang kênh `raw` của cùng bản đồ: kênh phải đang mở và còn chỗ; người chơi ngoài giao chiến, chưa gục, không hấp thụ, không
   * đang đi cổng, cách lần đổi trước CHANNEL_CD giây. Lưu đúng như đi cổng (beginTravel: một transaction nối vào chuỗi lưu, đích là
   * chính bản đồ này tại vị trí đang đứng); commit xong mới gửi `travel {mapId, roomId}` để client vào đúng phòng của kênh đó.
   * Đóng góp lên tinh anh / thú vương tính theo phiên nên không theo sang kênh mới.
   */
  switchChannel(c: Client, raw: unknown) { return join.switchChannel(this, c, raw); }

  waypointTick(id: string, p: PlayerState, d: PData) { travel.waypointTick(this, id, p, d); }

  waypointAction(id: string, op: unknown, key: unknown) { travel.waypointAction(this, id, op, key); }




  stopCast(id: string, why: string) { travel.stopCast(this, id, why); }


  useRecall(id: string, it: Item) { travel.useRecall(this, id, it); }


  finishRecall(id: string, dest: Portal, wp: RecallCast) { travel.finishRecall(this, id, dest, wp); }

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
  /** Túi đồ: logic ở `bag.ts` (#702), các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ. */
  unsavedBag(d: PData): Bag | undefined { return bag.unsavedBag(this, d); }
  bagSnapshot(d: PData): Bag { return bag.bagSnapshot(this, d); }
  sendBag(id: string, full = false) { bag.sendBag(this, id, full); }
  addItem(d: PData, code: string, qty: number, locked = false) { return bag.addItem(this, d, code, qty, locked); }
  takeItem(d: PData, it: Item, n: number) { bag.takeItem(this, d, it, n); }
  addCoin(d: PData, n: number) { bag.addCoin(this, d, n); }
  sortBag(id: string) { bag.sortBag(this, id); }
  rewardCoin(id: string, tier: number) { return bag.rewardCoin(this, id, tier); }
  bagFits(d: PData, items: { code: string; qty: number }[], extra = 0) { return bag.bagFits(this, d, items, extra); }
  bagRoom(d: PData, code: string, locked = false) { return bag.bagRoom(this, d, code, locked); }
  discardItem(id: string, raw: unknown) { bag.discardItem(this, id, raw); }
  lockItem(id: string, raw: unknown) { bag.lockItem(this, id, raw); }



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

  rollEquipGround(id: string, owner: string, rank: number, x: number, y: number, why?: string) { loot.rollEquipGround(this, id, owner, rank, x, y, why); }

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
  itemLabel(it: Item) { return itemLabel(it); }

/** Nhặt đồ dưới đất (xem rooms/item.ts, #702): `only` = chỉ xét đúng món đó (tự săn). */
  pickup(id: string, only?: string) { itemUse.pickup(this, id, only); }

/** Dùng một món trong túi (xem rooms/item.ts): đan, Hồi Thành Phù, Ủy Thác Lệnh, tiên thảo (kèm `vohonId`). */
  useItem(id: string, raw: unknown, vohonId?: unknown) { itemUse.useItem(this, id, raw, vohonId); }

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

  /** Nói chuyện với NPC (xem rooms/quest.ts): gửi tin riêng `npc {id}` để client mở hộp thoại. */
  talkNpc(id: string, raw: unknown) { quest.talkNpc(this, id, raw); }

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
  tongNow() { return Date.now() + testShift.tong * 86400000; }
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

  /** Tin client `tong` (xem rooms/tong.ts): gia nhập / rời tông, tông vụ, bảng tuần, thưởng tuần. */
  tongAction(id: string, op: unknown, raw: unknown, chain?: unknown) { tong.tongAction(this, id, op, raw, chain); }

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
  questBump(q: QuestProgress, ev: QuestEvent): "hit" | "ready" | null { return questBump(q, ev); }


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

  /** Tin client `quest` (xem rooms/quest.ts): nhận / trả bước chuỗi nhiệm vụ, hoặc xin tiến độ; `chainId` khảo hạch thì chuyển `dailyAction`. */
  questAction(id: string, op: unknown, chainId?: unknown) { quest.questAction(this, id, op, chainId); }

  // ---------- Khảo hạch hằng ngày của Phất Lan Đức (mục 5.8 "Nhiệm vụ hằng ngày") ----------
  /**
   * Ngày của bộ khảo hạch (vnDay, đổi lúc 00:00 giờ Việt Nam): như `today` (hook `day` của phòng lệch được), cộng độ lệch toàn tiến
   * trình `testShift.daily` của hook `daily {shift}` (để bot chọn ngày có bộ bài cần thử và mang cùng ngày đó sang phòng sân đấu).
   */
  dailyDay() { return vnDay(bossNow() + (this.dayShift + testShift.daily) * 86400000); }
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
  /** Nhận / trả bài khảo hạch hằng ngày (xem rooms/quest.ts). */
  dailyAction(id: string, op: unknown, chainId: string) { quest.dailyAction(this, id, op, chainId); }

  // ---------- Đại Đấu Hồn Trường: xếp hàng ở NPC, bảng xếp hạng (mục 5.9, bước 7.2; trận đấu ở ArenaRoom) ----------
  /** Xếp hàng / hủy / xem trực tiếp / bảng xếp hạng và vào sân (xem rooms/arena.ts, #702): các hàm dưới chỉ chuyển tiếp để `onMessage`, `onLeave` và ArenaRoom gọi như cũ. */
  arenaAction(id: string, raw: unknown, roomId?: unknown) { arena.arenaAction(this, id, raw, roomId); }
  sendArenaQueue(id: string) { arena.sendArenaQueue(this, id); }
  arenaTop(id: string) { arena.arenaTop(this, id); }

  /** Lưu túi đồ sau mua / bán qua chuỗi lưu (mục 6); bấm dồn dập thì chỉ một lần chờ trong chuỗi, lần đó chụp túi mới nhất. */
  saveTrade(id: string, d: PData) {
    if (d.tradeQueued) return;
    d.tradeQueued = true;
    this.chain(d, () => { d.tradeQueued = false; return this.write(id); });
  }


  // ---------- Cửa hàng / thương nhân (mục 5.7, 9.8) ----------
  /** Mua / bán / mua lại / đổi mảnh / tự bán / mở rộng túi: logic ở `shop.ts` (#702), các hàm dưới chỉ chuyển tiếp để `onMessage`, `tick` và hook test gọi như cũ. */
  buyItem(id: string, rawCode: unknown, rawQty: unknown, rawNpc?: unknown) { return shop.buyItem(this, id, rawCode, rawQty, rawNpc); }
  shardBuyToday(d: PData) { return shop.shardBuyToday(this, d); }
  sendShardInfo(id: string) { return shop.sendShardInfo(this, id); }
  buyShards(id: string, rawVohon: unknown, rawQty: unknown, rawNpc: unknown) { return shop.buyShards(this, id, rawVohon, rawQty, rawNpc); }
  sellItem(id: string, rawId: unknown, rawQty: unknown, rawNpc?: unknown) { return shop.sellItem(this, id, rawId, rawQty, rawNpc); }
  buybackItem(id: string, rawKey: unknown, rawNpc?: unknown) { return shop.buybackItem(this, id, rawKey, rawNpc); }
  /** Xóa danh sách mua lại của tài khoản khi rời game (9.8). ArenaRoom không xóa: rời sân là về bản đồ cũ. */
  forgetBuyback(accountId: number) { return shop.forgetBuyback(accountId); }
  setAutoSell(id: string, raw: unknown) { return shop.setAutoSell(this, id, raw); }
  autoSell(id: string) { return shop.autoSell(this, id); }
  expandBag(id: string, rawNpc?: unknown) { return shop.expandBag(this, id, rawNpc); }


  // ---------- Tự bán từ xa (#216, mục 5.7 "Tự bán") ----------
  log(id: string, text: string, col?: string) { this.clients.getById(id)?.send("log", { text, col }); }

  testHook(c: Client, m: unknown) { return gm.testHook(this, c, m); } // các op mô tả ở rooms/gm.ts
  gmAction(id: string, raw: unknown) { gm.gmAction(this, id, raw); }
  gmRun(id: string, d: PData, cmd: GmCmd): Promise<string> { return gm.gmRun(this, id, d, cmd); }

  rewardKill(id: string, years: number, mult = 1) { loot.rewardKill(this, id, years, mult); }
  benchXp(id: string, v: Character, n: number) { loot.benchXp(this, id, v, n); }
  addXp(id: string, n: number) { loot.addXp(this, id, n); }

  hurtPlayer(id: string, dmg: number, o: { dot?: boolean; chain?: boolean; pvp?: { dealt: number }; crit?: boolean } = {}): boolean { return combat.hurtPlayer(this, id, dmg, o); }

  knockOut(id: string) { return combat.knockOut(this, id); }
  revive(id: string, rows: number[], where: string) { return combat.revive(this, id, rows, where); }

  attack(id: string) { return combat.attack(this, id); }

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
  syncBuffs(p: PlayerState, d: PData) { p.buff = buffMask(d.buffs.keys(), buffBit); }
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
  nearestBeast(p: PlayerState, r: number) { return pickNearest(p, r, this.beastsNear(p.x, p.y, r)); }

  /** Hồn thú còn ít sinh lực nhất (theo tỉ lệ) trong bán kính r; bằng nhau thì con gần hơn (Nguyệt Nhận khóa mục tiêu yếu máu). */
  weakestBeast(p: PlayerState, r: number) { return pickWeakest(p, r, this.beastsNear(p.x, p.y, r)); }

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
  contribOf(e: EliteData, pid: string) { return contribOf(e.dmgBy, e.supBy, pid); }
  /** Mọi người có đóng góp (sát thương hoặc hỗ trợ) lên tinh anh / thú vương (9.2). */
  contributors(e: EliteData) { return contributors(e.dmgBy, e.supBy); }
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

  runSkill(id: string, sk: SkillDef, power: number, bpow: number, col: string, hit?: Hit, share?: string, fus?: FusHit & { at: { x: number; y: number } }) { return skill.runSkill(this, id, sk, power, bpow, col, hit, share, fus); }

  // ---------- Trạng thái dùng chung trên hồn thú (mục 5.1) ----------
  applyStatus(bid: string, a: StatusApply, by: string, power = 1, fus?: FusHit): void { return status.applyStatus(this, bid, a, by, power, fus); }

  syncStatus(b: BeastState, bd: BData) { return status.syncStatus(this, b, bd); }

  detonateBurn(bid: string, by?: string, extra = 0) { return status.detonateBurn(this, bid, by, extra); }

  tickStatus(bid: string, dt: number) { return status.tickStatus(this, bid, dt); }

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
  beginCast(bid: string, b: BeastState, bd: BData, s: BData["skills"][number], pid: string, tgt: { x: number; y: number }) { return cast.beginCast(this, bid, b, bd, s, pid, tgt); }

  floorTeles(): Tele[] { return cast.floorTeles(this); }

  /** Các chiêu đang báo trước của phòng (vùng đã khóa, giây còn lại, vòng an toàn): tự săn đọc để né (#218). */
  *activeCasts() {
    for (const bid of this.casting) { const c = this.bdata.get(bid)?.cast; if (c) yield c; else this.casting.delete(bid); }
  }

  cancelCast(bid: string, b: BeastState, bd: BData) { return cast.cancelCast(this, bid, b, bd); }

  fireCast(bid: string, b: BeastState, bd: BData) { return cast.fireCast(this, bid, b, bd); }

  pullPlayer(id: string, b: BeastState, dist: number) { return cast.pullPlayer(this, id, b, dist); }

  dragPlayer(id: string, tx: number, ty: number, dist: number) { return cast.dragPlayer(this, id, tx, ty, dist); }

  summonPack(b: BeastState, bd: BData, s: NonNullable<BeastSkillDef["summon"]>, target: string) { return cast.summonPack(this, b, bd, s, target); }

  tickCast(bid: string, b: BeastState, bd: BData, dt: number, interrupt: boolean) { return cast.tickCast(this, bid, b, bd, dt, interrupt); }

  // ---------- Trạng thái trên hồn sư (từ 3.5, PLAYER_STATUS) ----------
  applyPStatus(id: string, a: StatusApply, base: number, src?: string): void { return status.applyPStatus(this, id, a, base, src); }
  syncPStatus(p: PlayerState, d: PData) { return status.syncPStatus(this, p, d); }
  clearPStatus(p: PlayerState, d: PData) { return status.clearPStatus(this, p, d); }
  pctl(d: PData) { return status.pctl(this, d); }
  ccName(d: PData, move = false) { return status.ccName(this, d, move); }
  charmDir(p: PlayerState, d: PData, dt: number) { return status.charmDir(this, p, d, dt); }
  tickPStatus(id: string, p: PlayerState, d: PData, dt: number) { return status.tickPStatus(this, id, p, d, dt); }

  skill(c: Client, i: number) { return skill.skill(this, c, i); }

  copySource(id: string) { return skill.copySource(this, id); }

  setLoadout(c: Client, rowId: number, raw: unknown) { return skill.setLoadout(this, c, rowId, raw); }

  fusionAction(id: string, op: string) { return skill.fusionAction(this, id, op); }
  tickFusion(id: string, dt: number) { return skill.tickFusion(this, id, dt); }

  chanThan(c: Client) { return ava.chanThan(this, c); }
  /** Ô hồn kỹ của võ hồn ra trận nhận ít nhất hồi chiêu còn lại của hồn kỹ đang ở ô đó (PData.skCd; xếp lại ô, đổi võ hồn). */
  carrySkillCds(p: PlayerState, d: PData) {
    loadoutOf(d.ch.vohon, d.ch.skills).forEach((r, i) => { if (r >= 0) p.cds[i] = Math.max(p.cds[i], d.skCd.get(`${d.ch.rowId}:${r}`) ?? 0); });
  }
  endAva(id: string, why: string) { return ava.endAva(this, id, why); }
  tickAva(id: string, dt: number) { return ava.tickAva(this, id, dt); }

  boneSkill(c: Client, i: number) { return skill.boneSkill(this, c, i); }

  damageBeast(bid: string, dmg: number, by: string, col: string, hit?: Hit, o: DmgOpt = {}) { return combat.damageBeast(this, bid, dmg, by, col, hit, o); }

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
  damageFoe(fid: string, dmg: number, by: string, _col: string, hit?: Hit, o: DmgOpt = {}) { return combat.damageFoe(this, fid, dmg, by, _col, hit, o); }

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

  tienCoSet(d: PData, v: Character) { return tienco.tienCoSet(this, d, v); }

  gainEnergy(id: string, kind: Hit["kind"]) { return tienco.gainEnergy(this, id, kind); }

  gainLei(id: string, kind: Hit["kind"], shocked: boolean) { return tienco.gainLei(this, id, kind, shocked); }

  leiDong(id: string) { return tienco.leiDong(this, id); }

  tickEnergy(id: string, dt: number) { return tienco.tickEnergy(this, id, dt); }

  tienCo(id: string) { return tienco.tienCo(this, id); }

  killBeast(bid: string, by: string) { return kill.killBeast(this, bid, by); }

  rollCoreDrop(id: string, owner: string, years: number, x: number, y: number, sure = false, why?: string) { loot.rollCoreDrop(this, id, owner, years, x, y, sure, why); }
  rollBone(id: string, owner: string, species: number, years: number, tier: number, x: number, y: number, mult = 1, why?: string) { loot.rollBone(this, id, owner, species, years, tier, x, y, mult, why); }
  newDrop(x: number, y: number, owner: string) { return loot.newDrop(this, x, y, owner); }
  rollShard(id: string, years: number, x: number, y: number) { loot.rollShard(this, id, years, x, y); }
  rollHerb(id: string, zone: string | undefined, x: number, y: number, elite: boolean) { loot.rollHerb(this, id, zone, x, y, elite); }

/** Dùng tiên thảo cho võ hồn (xem rooms/item.ts). */
  useHerb(id: string, d: PData, it: Item, raw: unknown) { return itemUse.useHerb(this, id, d, it, raw); }

  /** Tổng số mảnh mã `code` trong túi (mọi ô). */
  shardCount(d: PData, code: string) { return shardCount(d.bag, code); }

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

  /** Mở võ hồn / lên sao bằng mảnh: logic ở `team.ts` (#702), chuyển tiếp cho `onMessage`. */
  unlockVohon(id: string, raw: unknown) { return team.unlockVohon(this, id, raw); }
  starUp(id: string, raw: unknown) { return team.starUp(this, id, raw); }

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
  /** Trang bị / Thợ rèn: logic ở `equip.ts` (#702), các hàm dưới chỉ chuyển tiếp để `onMessage`, `tick` và hook test gọi như cũ. */
  sendGear(id: string) { return equip.sendGear(this, id); }
  equipGear(id: string, rawItem: unknown) { return equip.equipGear(this, id, rawItem); }
  unequipGear(id: string, rawSlot: unknown) { return equip.unequipGear(this, id, rawSlot); }
  equipEnhancePreview(id: string, rawId: unknown) { return equip.equipEnhancePreview(this, id, rawId); }
  equipEnhance(id: string, rawId: unknown, charm: boolean) { return equip.equipEnhance(this, id, rawId, charm); }
  equipLuckPreview(id: string, rawId: unknown, busy?: boolean) { return equip.equipLuckPreview(this, id, rawId, busy); }
  equipLuck(id: string, rawId: unknown) { return equip.equipLuck(this, id, rawId); }
  equipSynth(id: string, rawMain: unknown, rawSac: unknown) { return equip.equipSynth(this, id, rawMain, rawSac); }
  salvageEquip(id: string, rawIds: unknown, auto = false) { return equip.salvageEquip(this, id, rawIds, auto); }
  autoSalvage(id: string) { return equip.autoSalvage(this, id); }

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
  coreSetNote(d: PData, rowId: number, set: string) { return coreSetNoteOf(coreSetCounts(this.coresOn(d, rowId)).get(set) ?? 0, set); }

  /** Hồn cốt / hồn hạch (gắn, tháo, cường hóa, đổi bộ): logic ở `bones.ts` (#702), các hàm dưới chỉ chuyển tiếp để `onMessage` gọi như cũ. */
  equipBone(id: string, rawItem: unknown, rawVohon: unknown, rawSlot: unknown) { return bones.equipBone(this, id, rawItem, rawVohon, rawSlot); }
  unequipBone(id: string, rawItem: unknown) { return bones.unequipBone(this, id, rawItem); }
  enhanceBone(id: string, rawTarget: unknown, rawMats: unknown) { return bones.enhanceBone(this, id, rawTarget, rawMats); }
  equipCore(id: string, rawItem: unknown, rawVohon: unknown, rawSlot: unknown) { return bones.equipCore(this, id, rawItem, rawVohon, rawSlot); }
  unequipCore(id: string, rawItem: unknown) { return bones.unequipCore(this, id, rawItem); }
  enhanceCore(id: string, rawTarget: unknown, rawMats: unknown) { return bones.enhanceCore(this, id, rawTarget, rawMats); }
  resetCoreSet(id: string, rawItem: unknown, rawSet: unknown, rawNpc: unknown) { return bones.resetCoreSet(this, id, rawItem, rawSet, rawNpc); }

  // ---------- Hồn hoàn ----------
  /** Hấp thụ hồn hoàn (bình cảnh, tỉ lệ thất bại, gắn vòng): logic ở `absorb.ts` (#702), các hàm dưới chỉ chuyển tiếp để `onMessage` / `tick` gọi như cũ. */
  tryAbsorb(c: Client, raw: unknown, rawVohon: unknown) { return absorb.tryAbsorb(this, c, raw, rawVohon); }
  cancelAbsorb(id: string, text: string) { return absorb.cancelAbsorb(this, id, text); }
  finishAbsorb(id: string) { return absorb.finishAbsorb(this, id); }
  // ---------- Hồn thú ----------
  /** Sinh hồn thú thường / tinh anh / thú vương (chọn điểm, loài, niên hạn, giao chiến tinh anh, đổi dạng, bỏ giao chiến): logic ở `spawn.ts` (#702), các hàm dưới chỉ chuyển tiếp để `tick` / `boss.ts` / `gm.ts` gọi như cũ. */
  spawnBeast(zi: number) { return spawn.spawnBeast(this, zi); }
  redFree() { return spawn.redFree(this); }
  addBeast(zi: number, years: number, species: number, x: number, y: number, rank = 0, slot = 0, life: number = KING.lifeSecs) { return spawn.addBeast(this, zi, years, species, x, y, rank, slot, life); }
  spawnElite(i: number, announce: boolean) { return spawn.spawnElite(this, i, announce); }
  eliteJoin(b: BeastState, bd: BData, by: string) { return spawn.eliteJoin(this, b, bd, by); }
  inFight(b: BeastState, e: EliteData, p: PlayerState) { return spawn.inFight(this, b, e, p); }
  joinFight(e: EliteData, pid: string) { return spawn.joinFight(this, e, pid); }
  eliteScale(b: BeastState, e: EliteData) { return spawn.eliteScale(this, b, e); }
  tickForm(bid: string, b: BeastState, e: EliteData, fd: FormDef, dt: number) { return spawn.tickForm(this, bid, b, e, fd, dt); }
  tickElite(bid: string, b: BeastState, bd: BData, dt: number) { return spawn.tickElite(this, bid, b, bd, dt); }
  eliteReset(bid: string, b: BeastState, bd: BData) { return spawn.eliteReset(this, bid, b, bd); }
  async spawnKing(slot: number, life: number, want?: string) { return spawn.spawnKing(this, slot, life, want); }
  pickSpecies(zi: number) { return spawn.pickSpecies(this, zi); }



  // ---------- Tinh anh (mục 5.4, bước BĐ4) ----------

  /** Sát thương đòn thường hiện tại của hồn thú (đánh thường và bội số chiêu): Cuồng nộ cộng thêm ELITE_RAGE.dmg. */
  beastDmg(bd: BData) { return beastDmgOf(bd.dmg, bd.buffs.has("rage"), !!bd.elite?.king?.world?.rage); } // boss thế giới nổi giận (BĐ6e)
  syncBeastBuff(b: BeastState, bd: BData) { b.buff = buffMask(bd.buffs.keys(), beastBuffBit); }








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
      if (ev.mapId === this.state.mapId) void this.spawnKing(ev.slot, ev.life, ev.king).catch((e) => console.error("Lỗi sinh thú vương", e));
    }
  }


  /** Thú vương và boss thế giới (tick, giai đoạn 2, cơ chế boss thế giới, rút đi, hạ boss chia thưởng, rương): logic ở `boss.ts` (#702), các hàm dưới chỉ chuyển tiếp để `onMessage` / `tick` / `gm.ts` gọi như cũ. */
  tickKing(bid: string, b: BeastState, bd: BData, k: KingData, dt: number) { return boss.tickKing(this, bid, b, bd, k, dt); }
  worldCast(bid: string, b: BeastState, bd: BData, def: BeastSkillDef, charge: boolean) { return boss.worldCast(this, bid, b, bd, def, charge); }
  worldBreak(bid: string, b: BeastState, bd: BData, w: WorldData, by: string) { return boss.worldBreak(this, bid, b, bd, w, by); }
  worldWeak(bid: string, b: BeastState, w: WorldData, he: He | null, secs: number) { return boss.worldWeak(this, bid, b, w, he, secs); }
  worldArmor(bid: string, b: BeastState, w: WorldData, a: NonNullable<NonNullable<BossDef["world"]>["armor"]>) { return boss.worldArmor(this, bid, b, w, a); }
  worldDive(bid: string, b: BeastState, bd: BData, w: WorldData, dv: NonNullable<NonNullable<BossDef["world"]>["dive"]>) { return boss.worldDive(this, bid, b, bd, w, dv); }
  worldSurface(bid: string, b: BeastState, bd: BData, k: KingData, w: WorldData) { return boss.worldSurface(this, bid, b, bd, k, w); }
  worldInfo(k: KingData) { return boss.worldInfo(this, k); }
  kingRank(e: EliteData) { return boss.kingRank(this, e); }
  markTarget(b: BeastState, bd: BData, range: number, weak = false): [string, PlayerState] | null { return boss.markTarget(this, b, bd, range, weak); }
  killKing(bid: string, b: BeastState, e: EliteData, by: string) { return boss.killKing(this, bid, b, e, by); }
  openChest(id: string, raw: unknown) { return boss.openChest(this, id, raw); }

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
  chatAction(id: string, m: unknown) { return social.chatAction(this, id, m); }

  // ---------- Bạn bè và chặn (mục 5.9 "Bạn bè", #195; trạng thái và luật ở server/src/friends.ts) ----------
  blockDeny(acc: number, target: number, name: string, what: string) { return social.blockDeny(acc, target, name, what); }

  friendAfter(done: Promise<unknown>, acc: number, leaveSid?: string) { return social.friendAfter(this, done, acc, leaveSid); }

  friendPublish(notes: FriendNote[]) { return social.friendPublish(this, notes); }

  friendNote(n: FriendNote) { return social.friendNote(this, n); }

  sendFriends(id: string, added?: { name: string; back: boolean }) { return social.sendFriends(this, id, added); }

  friendAction(id: string, m: unknown) { return social.friendAction(this, id, m); }

  // ---------- Tổ đội người chơi (mục 5.9, bước 7.1; trạng thái và luật ở server/src/party.ts) ----------
  partyPublish(notes: party.PartyNote[] | Promise<party.PartyNote[]>) { return social.partyPublish(this, notes); }

  partyNote(n: party.PartyNote) { return social.partyNote(this, n); }

  sendParty(id: string, force = false) { return social.sendParty(this, id, force); }

  partyAction(id: string, m: unknown) { return social.partyAction(this, id, m); }

  rallyAction(id: string, m: unknown) { return social.rallyAction(this, id, m); }

  rallyNote(r: party.RallyRoute) { return social.rallyNote(this, r); }

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
    return fxPoint(m, (id) => this.state.players.get(id), (id) => this.state.beasts.get(id));
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

  perfLog(t0: number, t1: number, t2: number, c0: number, ti: number) { return tick.perfLog(this, t0, t1, t2, c0, ti); }

  tick(dt: number) { return tick.tick(this, dt); }

  /** Hồn thú di chuyển nhưng không bước vào vùng an toàn. */
  moveBeast(b: BeastState, dx: number, dy: number, hw: number) { return tick.moveBeast(this, b, dx, dy, hw); }
}

// ---------- Lễ thức tỉnh (gọi từ /api/awaken, trước khi vào phòng) ----------
/** Tài khoản chưa có võ hồn: tặng Lam Ngân Thảo + 1 võ hồn SSR tự chọn. Hồn lực bẩm sinh do server roll. */
export async function awakenAccount(accountId: number, name: string, choice: unknown):
  Promise<{ character: Character } | { status: number; error: string }> {
  const pick = AWAKEN_CHOICES.find((v) => v.id === choice);
  if (!pick) return { status: 400, error: "Hãy chọn một võ hồn SSR trong danh sách." };
  // Tạo nhân vật diễn ra ngay trước bước chọn SSR của lễ thức tỉnh.
  if (!(await store.getLooks(accountId)).chosen) return { status: 409, error: "Hãy tạo nhân vật trước lễ thức tỉnh." };
  // Hồn lực bẩm sinh (1 đến AWAKEN_LEVEL.max) thuộc về hồn sư: làm cấp khởi đầu của cả hai võ hồn.
  const level = Math.random() < AWAKEN_LEVEL.maxChance ? AWAKEN_LEVEL.max : 1 + Math.floor(Math.pow(Math.random(), AWAKEN_LEVEL.curve) * (AWAKEN_LEVEL.max - 1));
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
