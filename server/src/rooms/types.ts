// Kiểu dữ liệu của phòng bản đồ, tách khỏi MapRoom.ts (#702, miền E1): `PData` (trạng thái riêng từng hồn sư), `BData` / `EliteData` / `KingData` / `WorldData` (hồn thú, tinh anh,
// thú vương, boss thế giới), `Hit` / `FusHit` / `DmgOpt` / `SInst` / `RecallCast` / `AuthData` / `ChatRoute` / `Proj`. Nguyên văn từ MapRoom: chỉ `interface`, KHÔNG có mã chạy
// (esbuild xóa hết lúc biên dịch). Các file miền `import type` từ đây thay vì từ MapRoom.
import type { CoreFx, BonePassive, ChanThanStat, SkillDef, StatusId, StatusApply, BuffId, BeastSkillDef, Tele, BeastBuffId, BossDef, He, QuestProgress, ResEffect, AutoHint, AutoSettings, SellSettings } from "../../../shared/data.ts";
import type { Vitals } from "../../../shared/vitals.ts";
import type { MsgGroup } from "../../../shared/data.ts";
import type { Portal } from "../map.ts";
import type { Character, AccountLooks, Location, Item, Bag, AutoRow, SoldRow, TongRow, SocialRow } from "../db.ts";
import type { TokenBucket, ChatChannel } from "../ratelimit.ts";
import type { AutoHunter } from "./autoHunt.ts";
import type { BagSent } from "../../../shared/bagSync.ts";
import type { GearStats } from "./items.ts";

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
export interface RecallCast { label: string; fee: number; remote?: boolean; itemId?: string; x0: number; y0: number; dur: number; }
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
/** Mũi hồn kỹ đang bay của hồn sư `owner`: chạm hồn thú đầu tiên thì gọi `fire` (sát thương và trạng thái của hồn kỹ). */
export interface Proj { x: number; y: number; vx: number; vy: number; life: number; owner: string; fire: (bid: string) => void; foe?: (pid: string) => void; } // foe: trúng đối thủ (7.2)
/** Tùy chọn của một lần gây sát thương lên hồn thú. `direct` = false: sát thương theo thời gian (không chí mạng, không đẩy lùi,
 *  không tính Phá giáp, không lan Cảm điện). `chain`: sát thương lan của Cảm điện (không chí mạng, không lan tiếp).
 *  `pair` (#192): đòn của Võ Hồn Dung Hợp Kỹ, phiên đồng đội dung hợp: không nhận ràng buộc, đóng góp tinh anh / thú vương / boss chia đôi. */
export interface DmgOpt { crit?: number; lifesteal?: number; direct?: boolean; chain?: boolean; pair?: string; }
/** Một đòn của Võ Hồn Dung Hợp Kỹ (#192): đồng đội dung hợp và công trung bình của hai người (không ràng buộc). */
export interface FusHit { pair: string; atk: number; }

// ---------- Chat xuyên phòng (mục 6 "Xã hội") ----------
export interface ChatRoute { to?: number[]; tong?: string; from?: number; msg: { ch: ChatChannel; name: string; text: string; to?: string } }
