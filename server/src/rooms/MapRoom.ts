// Phòng của một bản đồ (mapId): toàn bộ logic game chạy ở đây (server-authoritative).
// Mỗi bản đồ có thể có nhiều phòng (kênh); mọi phòng dùng chung một lớp, khác nhau ở dữ liệu bản đồ.
// Client chỉ gửi ý định (hướng di chuyển, bấm đánh...), server quyết định kết quả.
import { Room, Client, ServerError, OnMessageException, type RoomException } from "colyseus";
import { MapState, PlayerState, BeastState, DropState } from "./schema.ts";
import { TICK_RATE,
  AWAKEN_GIFT, AWAKEN_CHOICES, AWAKEN_LEVEL, TEAM_COMBAT_SECS,
  MAPS, parseNewLooks, encodeLpc,

  TILE,
  itemDef, formatHonTe, type ItemDef,
  RING_ITEM, DROP_OWNER_SECS,
  SHARD_UNLOCK, starCost,
  BONE_ITEM,
  CORE_ITEM, type CoreData,
  type CoreStat, EQUIP_ITEM, equipName, rollEquipDrop, rollEquipCharm, EQUIP_CHARM, type EquipData, type EquipDrop,
  loadoutOf, type BondKey, type SkillDef, type StatusApply, type BuffId,
  type BeastSkillDef, type Tele,
  BOSSES, bossIndex, ELITE_RAGE, beastName, beastBuffBit, BEAST_BUFFS,
  KING, kingNext, vnDay, type BossDef, type FormDef,
  WORLD, worldNext, worldBossOn, type He,
  npcDef, looksChangeCost, type NpcRole,
  QUEST_STARTER, type QuestReward, type QuestProgress, type QuestEvent, type QuestGoal,
  PARTY_BUFF_R,
  type AutoSummary,
  type OfflinePower,
  } from "../../../shared/data.ts";
import { ASK_CD, MSG_GROUP, MSG_HARD, MSG_FLOOD_CODE, type MsgGroup } from "../../../shared/data.ts"; // nhịp tin client xin lại dữ liệu riêng (#165)
import { clampDir, MOVE_DEAD } from "../../../shared/move.ts";
import { loadMap, mapFile, type GameMap, type Portal, type EliteSpot, type NpcSpot, type Zone } from "../map.ts";
import { BOSS_TOPIC, ANNOUNCE_TOPIC, bossOffset, bossNow, type BossEvent } from "../schedule.ts";
import { store, Character, type AccountLooks, type Item, type Bag } from "../db.ts";
import { takeToken } from "../ratelimit.ts";
import { SpiderEggs } from "./eggs.ts";
import * as party from "../party.ts";
import * as join from "./join.ts";
import * as autoRun from "./autoRun.ts";
import { friends, FRIEND_TOPIC, type FriendNote } from "../friends.ts";
import { watchGc, cpuMs } from "../perf.ts";
import { Interest } from "./interest.ts";
import { Grounds } from "./ground.ts";
import { presenceBackend, bg } from "../presence.ts";
import { ColdStacks } from "./cold.ts";
import { _gmSetAdmin, type GmCmd } from "../gm.ts"; // lệnh GM của admin (#518)
import { Tide } from "./tide.ts";
import { LairSplit } from "./split.ts";
import { newItem, bagUsed, itemLabel, shardCount } from "./items.ts";
import { questBump } from "./questBump.ts";
import { beastDmgOf, buffMask, contribOf, contributors, pickNearest, pickWeakest, fxPoint, spawnPointIn } from "./calc.ts";
import { targetMsg, manualAttack } from "./lock.ts";
import * as equip from "./equip.ts";
import { equipBest } from "./equipBest.ts";
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
import * as stats from "./stats.ts";
import * as support from "./support.ts";
import * as motion from "./motion.ts";
import * as contrib from "./contrib.ts";
import type { PData, Hit, AuthData, RecallCast, BData, EliteData, KingData, WorldData, Proj, DmgOpt, FusHit, ChatRoute } from "./types.ts";
import * as fog from "./fog.ts";
import { CHAT_TOPIC, accOf, intIn, strIn, saveStats } from "./common.ts";
import { kingSlotNow, applyEliteLock, eliteKey, eliteLockLeft, CHANNEL_CAP, type KingSeat, startChannelSweep } from "./procState.ts";
import { ELITE_LOCK_TOPIC, loadEliteLocks, loadKingState, persistKingSeat } from "./presenceState.ts";
import { takeChannel, releaseChannel } from "./channel.ts";
import { seatAdd, seatUsed, seatAccount, joinableMap, mapIdIn, type SeatPass } from "./seat.ts";

startChannelSweep(); // dọn Map kênh định kỳ (#957); chạy đúng một lần lúc nạp MapRoom, như khi timer còn ở module này

// ---------- Giá trị client gửi (mục 6 "Mỗi message: ép kiểu và kẹp giá trị", #164) ----------
// Chỉ kiểm `typeof`, không Number() / String() / phép so sánh trên giá trị thô: msgpack giải ra object tùy ý, đổi kiểu một object
// có thể ném lỗi.
/** Số hữu hạn client gửi; khác (chuỗi, object, NaN, Infinity…) thì 0. */
const numIn = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
/** Cùng một lỗi bất ngờ ở cùng một chỗ (onUncaughtException) chỉ ghi log tối đa một lần mỗi bấy nhiêu mili giây. */
const ERR_LOG_MS = 10_000;

// ---------- Báo trước thú vương theo bản đồ (mức tiến trình, mục 6); trạng thái suất / khóa ở procState.ts + presenceState.ts ----------
/**
 * Báo trước thú vương gần nhất theo bản đồ (kênh "boss", `at` = giờ xuất hiện, ms): phòng mở ra trong lúc chờ (kể cả báo trước của
 * hook test) vẫn có đếm ngược. Xóa khi thú vương của bản đồ đó xuất hiện.
 */
const kingWarns = new Map<string, BossEvent & { at: number }>();




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
  /** Hàm nhỏ về đúng miền sở hữu (#702, E5a): `chatTong` / `partyNear` ở `social.ts`, `showVohon` / `syncCh` ở `team.ts`, `npcNear` ở `quest.ts`, `shopFor` ở `shop.ts`; các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ. */
  chatTong(c: Client): string | null { return social.chatTong(this, c); }
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
    this.onBagMsg("equipbest", (c, m: unknown) => equipBest(this, c.sessionId, m));
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
  spawnPoint() { return spawnPointIn(this.map.spawn, (x, y) => this.map.hits(x, y, 5, 4), Math.random); }

  /** Chỉ số hồn sư (tính lại, tin `stats`, Sức mạnh đội hình): logic ở `stats.ts` (#702), các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ. */
  recalc(id: string, full: boolean) { stats.recalc(this, id, full); }

  showVohon(p: PlayerState, ch: Character) { return team.showVohon(p, ch); }

  syncCh(id: string) { return team.syncCh(this, id); }

  // ---------- Lưu người chơi (logic ở `persist.ts`, #702; các hàm dưới chỉ chuyển tiếp, `ArenaRoom` vẫn override `write`) ----------
  chain(d: PData, fn: () => unknown) { return persist.chain(this, d, fn); }
  chainLatest(d: PData, key: string, fn: () => unknown) { persist.chainLatest(this, d, key, fn); }
  save(id: string) { return persist.save(this, id); }
  unsaved(id: string) { return persist.unsaved(this, id); }
  write(id: string, final = false): Promise<boolean> { return persist.write(this, id, final); }
  writeNow(id: string, final = false): Promise<boolean> { return persist.writeNow(this, id, final); }

  sendStats(id: string, rowId: unknown) { stats.sendStats(this, id, rowId); }

  teamPowerOf(d: PData) { return stats.teamPowerOf(d); }
  maxHpOf(d: PData, v: Character) { return stats.maxHpOf(d, v); }
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
  /** Hàm nhỏ về đúng miền sở hữu (#702, E5b): `portalHint` / `freeze` ở `travel.ts`, `saveTrade` ở `shop.ts` (ghi DB vẫn qua `room.chain`), `foesNear` / `nearestFoe` ở `combat.ts` (`foesOf` ở lại vì `ArenaRoom` override); các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ. */
  portalHint(id: string, p: PlayerState, d: PData) { return travel.portalHint(this, id, p, d); }

  /** Đi cổng / truyền tống / Hồi Thành Phù (xem rooms/travel.ts, #702): các hàm dưới chỉ chuyển tiếp để `onMessage`, `tick`, `useItem`, gm.ts gọi như cũ. */
  travelDeny(id: string, name: string): string | null { return travel.travelDeny(this, id, name); }

  travel(c: Client, name: string) { travel.travel(this, c, name); }

  freeze(id: string) { return travel.freeze(this, id); }

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
  npcNear(id: string, want: { id?: string; role?: NpcRole }): NpcSpot | undefined { return quest.npcNear(this, id, want); }

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
  /** Tin riêng `tong`, giờ tuần tông, bộ tông vụ: logic ở `tong.ts` (#702), các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ. */
  sendTong(id: string) { return tong.sendTong(this, id); }
  tongNow() { return tong.tongNow(); }
  tongTasksOf(saved: QuestProgress[] | undefined, day = this.dailyDay()) { return tong.tongTasksOf(this, saved, day); }
  tongFresh(d: PData, day = this.dailyDay()) { return tong.tongFresh(this, d, day); }

  /** Tin client `tong` (xem rooms/tong.ts): gia nhập / rời tông, tông vụ, bảng tuần, thưởng tuần. */
  tongAction(id: string, op: unknown, raw: unknown, chain?: unknown) { tong.tongAction(this, id, op, raw, chain); }

  shopFor(id: string, d: PData, rawNpc: unknown, verb: string): NpcSpot | string { return shop.shopFor(this, id, d, rawNpc, verb); }

  // ---------- Nhiệm vụ: chuỗi tân thủ của Ngọc Tiểu Cương (mục 5.8, bước 6.2) ----------
  /** Nhiệm vụ, khảo hạch hằng ngày, bộ đếm sự kiện, thưởng nhiệm vụ: logic ở `quest.ts` (#702), các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ. */
  sendQuest(id: string, ev?: "accept" | "ready" | "reward" | "finish", done?: string, chain = QUEST_STARTER) { return quest.sendQuest(this, id, ev, done, chain); }
  fixedQuest(d: PData, chain: string) { return quest.fixedQuest(d, chain); }
  questOpen(d: PData, chain: string) { return quest.questOpen(d, chain); }

  questHave(d: PData, g: QuestGoal) { return quest.questHave(this, d, g); }

  questEvent(id: string, ev: QuestEvent) { return quest.questEvent(this, id, ev); }
  /** Cộng sự kiện `ev` vào bước đang làm (đã nhận) của tiến độ `q`: null = không mục tiêu nào khớp, "ready" = vừa đủ mọi mục tiêu. */
  questBump(q: QuestProgress, ev: QuestEvent): "hit" | "ready" | null { return questBump(q, ev); }


  rewardFits(d: PData, r: QuestReward) { return quest.rewardFits(this, d, r); }

  grantReward(d: PData, r: QuestReward) { return quest.grantReward(this, d, r); }

  /** Tin client `quest` (xem rooms/quest.ts): nhận / trả bước chuỗi nhiệm vụ, hoặc xin tiến độ; `chainId` khảo hạch thì chuyển `dailyAction`. */
  questAction(id: string, op: unknown, chainId?: unknown) { quest.questAction(this, id, op, chainId); }

  // ---------- Khảo hạch hằng ngày của Phất Lan Đức (mục 5.8 "Nhiệm vụ hằng ngày") ----------
  dailyDay() { return quest.dailyDay(this); }
  dailyOf(saved: QuestProgress[] | undefined, day = this.dailyDay()) { return quest.dailyOf(this, saved, day); }
  dailyFresh(d: PData, day = this.dailyDay()) { return quest.dailyFresh(this, d, day); }
  giveItems(d: PData, code: string) { return quest.giveItems(d, code); }
  dailyGive(d: PData, list: QuestProgress[] = d.daily) { return quest.dailyGive(d, list); }
  sendDaily(id: string, ev?: "accept" | "ready" | "reward" | "reset", i = -1) { return quest.sendDaily(this, id, ev, i); }
  dailyBag(id: string) { return quest.dailyBag(this, id); }
  /** Nhận / trả bài khảo hạch hằng ngày (xem rooms/quest.ts). */
  dailyAction(id: string, op: unknown, chainId: string) { quest.dailyAction(this, id, op, chainId); }

  // ---------- Đại Đấu Hồn Trường: xếp hàng ở NPC, bảng xếp hạng (mục 5.9, bước 7.2; trận đấu ở ArenaRoom) ----------
  /** Xếp hàng / hủy / xem trực tiếp / bảng xếp hạng và vào sân (xem rooms/arena.ts, #702): các hàm dưới chỉ chuyển tiếp để `onMessage`, `onLeave` và ArenaRoom gọi như cũ. */
  arenaAction(id: string, raw: unknown, roomId?: unknown) { arena.arenaAction(this, id, raw, roomId); }
  sendArenaQueue(id: string) { arena.sendArenaQueue(this, id); }
  arenaTop(id: string) { arena.arenaTop(this, id); }

  saveTrade(id: string, d: PData) { return shop.saveTrade(this, id, d); }


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

  /** Hệ số buff / ràng buộc / hồi máu / công: logic ở `stats.ts` (#702); `ArenaRoom` vẫn override `healMult` nên phương thức ở lại. */
  buffV(d: PData, b: BuffId) { return stats.buffV(d, b); }
  atkOf(d: PData, bond = true, weapon: "roll" | "mid" | "none" = "roll") { return stats.atkOf(d, bond, weapon); }
  offlinePower(d: PData, p: PlayerState): OfflinePower { return stats.offlinePower(d, p); }
  syncBuffs(p: PlayerState, d: PData) { stats.syncBuffs(p, d); }
  bondV(d: PData, k: BondKey) { return stats.bondV(d, k); }
  healMult(d: PData) { return stats.healMult(d); }
  /** Đánh thường, tung hồn kỹ hoặc tiên cơ thì hết tàng hình (Yêu Hồ, 2.5c); từ 2026-10-20 bị đòn trực tiếp đánh trúng cũng hết (hurtPlayer). */
  unhide(p: PlayerState, d: PData) { if (d.buffs.delete("hide")) this.syncBuffs(p, d); }

  /** Hồn thú gần hồn sư nhất trong bán kính r. */
  nearestBeast(p: PlayerState, r: number) { return pickNearest(p, r, this.beastsNear(p.x, p.y, r)); }

  /** Hồn thú còn ít sinh lực nhất (theo tỉ lệ) trong bán kính r; bằng nhau thì con gần hơn (Nguyệt Nhận khóa mục tiêu yếu máu). */
  weakestBeast(p: PlayerState, r: number) { return pickWeakest(p, r, this.beastsNear(p.x, p.y, r)); }

  /** Lướt của hồn sư, kéo / đẩy hồn thú (logic ở `motion.ts`, #702; `pushBeast` bỏ qua hồn thú Choáng / Trói / thú thực vật): các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ. */
  dashStep(p: PlayerState, d: PData, dist: number) { return motion.dashStep(this, p, d, dist); }

  dashTo(p: PlayerState, d: PData, b: { x: number; y: number }, dist: number, size: number) { return motion.dashTo(this, p, d, b, dist, size); }

  pullBeast(bid: string, p: PlayerState) { return motion.pullBeast(this, bid, p); }

  pushBeast(bid: string, p: PlayerState, dist: number) { return motion.pushBeast(this, bid, p, dist); }

  /** Hẹn chạy `fn` sau `t` giây (trong tick). */
  later(t: number, fn: () => void) { this.timers.push({ t, fn }); }

  /** Chia buff / hồi máu đội (hiệu ứng lên bản thân, lan cho tổ đội): logic ở `support.ts` (#702), các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ; `partyBuffNear` ở lại vì `ArenaRoom` override. */
  healTeam(id: string, frac: number) { return support.healTeam(this, id, frac); }

  selfEffect(id: string, e: NonNullable<SkillDef["self"]>, bpow: number, col: string, share?: string) { return support.selfEffect(this, id, e, bpow, col, share); }

  shareOf(p: PlayerState, src: string) { return support.shareOf(p, src); }

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

  partyShare(id: string, e: NonNullable<SkillDef["self"]>, bpow: number, hm: number, col: string, src: string) { return support.partyShare(this, id, e, bpow, hm, col, src); }

  /** Đóng góp lên tinh anh / thú vương / boss thế giới (cộng, hỗ trợ, chuyển phiên, người nhận thưởng): logic ở `contrib.ts` (#702), các hàm dưới chỉ chuyển tiếp để mọi nơi gọi như cũ. */
  supportCredit(id: string, qid: string, v: number) { return contrib.supportCredit(this, id, qid, v); }
  credit(e: EliteData, kind: "dmgBy" | "supBy", pid: string, v: number) { return contrib.credit(this, e, kind, pid, v); }
  rebindContrib(sid: string, acc: number) { return contrib.rebindContrib(this, sid, acc); }

  /** Đóng góp tổng của `pid` lên tinh anh / thú vương (9.2): sát thương + hỗ trợ × SUPPORT_CONTRIB. */
  contribOf(e: EliteData, pid: string) { return contribOf(e.dmgBy, e.supBy, pid); }
  /** Mọi người có đóng góp (sát thương hoặc hỗ trợ) lên tinh anh / thú vương (9.2). */
  contributors(e: EliteData) { return contributors(e.dmgBy, e.supBy); }
  topContrib(e: EliteData, by: string, dmgOnly?: boolean): string;
  topContrib(e: EliteData, by: string, dmgOnly: boolean, ok: (pid: string) => boolean): string | null;
  topContrib(e: EliteData, by: string, dmgOnly = false, ok: (pid: string) => boolean = () => true) { return contrib.topContrib(this, e, by, dmgOnly, ok); }

  runSkill(id: string, sk: SkillDef, power: number, bpow: number, col: string, hit?: Hit, share?: string, fus?: FusHit & { at: { x: number; y: number } }) { return skill.runSkill(this, id, sk, power, bpow, col, hit, share, fus); }

  // ---------- Trạng thái dùng chung trên hồn thú (mục 5.1) ----------
  applyStatus(bid: string, a: StatusApply, by: string, power = 1, fus?: FusHit): void { return status.applyStatus(this, bid, a, by, power, fus); }

  syncStatus(b: BeastState, bd: BData) { return status.syncStatus(this, b, bd); }

  detonateBurn(bid: string, by?: string, extra = 0) { return status.detonateBurn(this, bid, by, extra); }

  tickStatus(bid: string, dt: number) { return status.tickStatus(this, bid, dt); }

  /** Hồi sinh lực / hồn lực của hồn sư (vùng an toàn hồi nhanh hơn) và hồi máu hồn thú: logic ở `motion.ts` (#702), `regenBeast` là hàm thuần. */
  regenPlayer(p: PlayerState, d: PData, dt: number): boolean { return motion.regenPlayer(this, p, d, dt); }

  regenBeast(b: BeastState, bd: BData, dt: number, pct?: number) { return motion.regenBeast(b, bd, dt, pct); }

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
  foesNear(id: string, r: number, x: number, y: number) { return combat.foesNear(this, id, r, x, y); }
  nearestFoe(id: string, r: number) { return combat.nearestFoe(this, id, r); }
  damageFoe(fid: string, dmg: number, by: string, _col: string, hit?: Hit, o: DmgOpt = {}) { return combat.damageFoe(this, fid, dmg, by, _col, hit, o); }

  /** Lãnh vực Phượng Hoàng khuếch đại sát thương lên hồn thú: logic ở `motion.ts` (#702). */
  phoenixAmp(b: BeastState) { return motion.phoenixAmp(this, b); }

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
  /** Tổng chỉ số hồn cốt: logic ở `stats.ts` (#702). */
  bonesOn(d: PData, rowId: number) { return stats.bonesOn(d, rowId); }
  boneBonusOf(d: PData, rowId: number) { return stats.boneBonusOf(d, rowId); }
  fillBoneSubs(d: PData) { return stats.fillBoneSubs(d); }

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
  sendGear(id: string, full = false) { return equip.sendGear(this, id, full); }
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
  /** Tổng chỉ số hồn hạch / trang bị: logic ở `stats.ts` (#702). */
  coresOn(d: PData, rowId: number) { return stats.coresOn(d, rowId); }
  coreBonusOf(d: PData, rowId: number) { return stats.coreBonusOf(d, rowId); }
  withGear(d: PData, b: Record<CoreStat, number>) { return stats.withGear(d, b); }
  coreSetNote(d: PData, rowId: number, set: string) { return stats.coreSetNote(d, rowId, set); }

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

  partyNear(by: string, x: number, y: number) { return social.partyNear(this, by, x, y); }

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

  /** Phạm vi quan tâm, sương mù khám phá, bản đồ nhỏ: logic ở `fog.ts` (#702), các hàm dưới chỉ chuyển tiếp để `tick`, `join`, `persist`, `travel`, `gm` và các miền gọi như cũ. */
  beastsNear(x: number, y: number, r: number): [string, BeastState][] { return fog.beastsNear(this, x, y, r); }
  get fogOn() { return fog.fogOn(this); }
  fogDims() { return fog.fogDims(this); }
  fogLoad(id: string) { fog.fogLoad(this, id); }
  fogMarkOne(id: string, d: PData) { fog.fogMarkOne(this, id, d); }
  fogMark() { fog.fogMark(this); }
  fogSend() { fog.fogSend(this); }
  sendFog(id: string) { fog.sendFog(this, id); }
  async fogFlush(d: PData) { return fog.fogFlush(this, d); }
  sendMini() { fog.sendMini(this); }

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
