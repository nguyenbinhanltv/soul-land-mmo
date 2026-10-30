// Miền GM / hook test (GAME_DESIGN.md mục 4 lệnh GM #518; hook `test` chỉ chạy khi GAME_TEST=1), tách khỏi MapRoom.ts (#702, bước 6).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / shop.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.chain`.
// MapRoom chỉ chuyển tiếp (đăng ký `onMessage("test" | "gm")` giữ nguyên thứ tự ở đó; ArenaRoom vẫn override `testHook`).
import { Client } from "colyseus";
import { DropState } from "./schema.ts";
import { ACHV_COUNTERS, TIERS, VOHON, MAX_LEVEL, calcStats, tierOfYears, vohonIndex, TEAM_COMBAT_SECS, MAX_RINGS, BEASTS, beastIndex, MAPS, MAP_MOVED, TIEN_CO_MAX, TILE, itemDef, formatHonTe, MAX_YEARS, formatYears, RING_ITEM, MAX_STARS, BONE_ITEM, BONE_SLOTS, boneName, CORE_ITEM, CORE_SETS, rollCoreStats, coreName, coreSetIndex, MAX_CORE_STARS, CORE_STAT_IDS, type CoreStat, EQUIP_ITEM, EQUIP_LUCK_MAX, EQUIP_MAX_ENHANCE, EQUIP_ROLL, equipTemplate, equipName, equipSlotDef, rollEquip, coreBonus, coreFx, coreSetCounts, type CoreFx, BONE_MAX_ENHANCE, boneEnhanceNeed, boneAddSubs, SHARD_BUY, CORE_MAX_ENHANCE, coreEnhanceNeed, coreUpgradeSubs, STATUS_IDS, PHONG_LOI, BOND_KEYS, loadoutOf, type StatusId, type StatusApply, BOSSES, bossIndex, bossHpMult, beastName, KING, BOSS_CLAIM_KING, WORLD, WORLD_SLAM, BOSS_CLAIM_WORLD, worldBossOn, HE_IDS, TONG_MON, tongDef, tongWeek, QUEST_STARTER, parseQuest, questStatus, DAILY, TONG_DAILY, herbBonus, ARENA, AUTO_DAILY_SECS, AUTO_STUCK, AUTO_MSG_RATE, AUTO_BONUS_MAX, BEAST_DEF, ringLimit, coreSubRolls } from "../../../shared/data.ts";
import { fogEmpty, fogFill } from "../../../shared/fog.ts";
import { publishBoss, bossNow, bossClockMode } from "../schedule.ts";
import { randomUUID } from "node:crypto";
import { store, saveFailTest } from "../db.ts";
import { sendState as achvSend } from "./achv.ts";
import { mailNotify } from "./mail.ts";
import { chatReset, inviteReset, rallyReset, friendReset } from "../ratelimit.ts";
import { arenaWatchMax, setTestWatchMax, arenaTestSlow } from "./arenaQueue.ts";
import { itemLockKey } from "../itemLock.ts";
import { presenceBackend, bg } from "../presence.ts";
import { wpCooldownKey, remoteCdLeft } from "./travel.ts";
import { gmAllow, gmEnabled, isAdmin, parseGm, _gmSetAdmin, type GmCmd } from "../gm.ts";
import { buildPreset } from "../testPreset.ts";
import { newItem, gearStats, bagUsed } from "./items.ts";
import { savePeriodic } from "./persist.ts";
import * as party from "../party.ts";
import { CHANNEL_CAP, channelLeftKey, channelSwitchAt, channelSwitchKey, claimHeld, eliteLockLeft, eliteLocks, fusionKey, fusionReady, leftRoom, strIn, testNoLeaveLock, testOfflineAgo, testShift, worldChatKey, type MapRoom, type PData } from "./MapRoom.ts";

/**
 * Hook kiểm thử cho bot (client/scripts/bot-test.mjs), chỉ chạy khi server bật biến môi trường GAME_TEST=1; mặc định chỉ trả
 * lời "không bật". Đi qua đúng các hàm luật chơi: `down` (võ hồn ra trận gục), `kill {tier}` (nhận kinh nghiệm như hạ hồn thú),
 * `rest {s}` (nghỉ ngoài trận s giây; hiệu ứng có lợi cũng trôi s giây), `set {rowId, level, xp, rings, stars}` (đặt tiến độ một võ hồn của mình; `stars` từ 9.5; có lưu DB),
 * `energy {v}` (đặt năng lượng tiên cơ mọi võ hồn chưa gục trong đội, tính như vừa giao chiến), `spawn {tier, dx, dy}` (sinh hồn thú cạnh mình),
 * `hurt {pct}` (võ hồn ra trận mất pct% sinh lực hiện có, bỏ qua khiên), `clear` (bỏ mọi hồn thú trong vòng 160 pixel quanh mình),
 * `beast {dx, dy}` (đặt một hồn thú thường 1 máu, đứng yên, lệch (dx, dy) so với mình; chỉ bản đồ có vùng săn),
 * `give {code, qty, years}` (thêm vật phẩm vào túi, gộp và giới hạn ô như nhặt đồ; hồn hoàn mang `years` năm), `coin {n}` (đặt
 * Hồn Tệ), `wpcd {secs}` (đặt / xóa hồi dịch chuyển từ xa), `drain {pct}` (mất pct% hồn lực hiện có), `goto {x, y}` (đứng ở điểm đứng được), `drops {s}` (mọi hồn hoàn dưới đất
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
 * Từ #797: `savefail {n, only}` ép n lần ghi túi / tông kế tiếp của chính mình lỗi (saveBag, setTong, saveProgress có túi; `only` "bag" / "tong" chỉ chặn loại đó; n = 0 bỏ ép; trả `left` = số lượt ép còn chưa bị tiêu thụ trước lệnh này): thử nhánh hoàn lại khi lỗi DB.
 * Từ #164: `throw` ném lỗi ngay trong handler (không trả lời): thử lớp chặn chung onUncaughtException giữ server sống.
 * Từ #270: `crash {reject}` trả lời rồi ném lỗi NGOÀI phòng (hẹn giờ thường của Node, không qua clock của phòng; `reject`: promise bị từ
 * chối không ai bắt): thử process.on ở index.ts lưu người chơi đang online rồi thoát mã 1. Chỉ bài `bot:local --fatal` gọi.
 */
export async function testHook(room: MapRoom, c: Client, m: unknown) {
  const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>, op = strIn(o.op);
  if (process.env.GAME_TEST !== "1") return c.send("test", { op, enabled: false });
  if (op === "throw") throw new Error("hook test: lỗi cố ý (#164)");
  if (op === "baglimit") { const d = room.pdata.get(c.sessionId); if (d) d.msgLimit = !!o.on; return c.send("test", { op, on: !!o.on }); } // #677: bật giới hạn tin theo nhóm (mặc định tắt khi GAME_TEST=1)
  if (op === "crash") {
    const reject = !!o.reject;
    c.send("test", { op, reject });
    // CỐ Ý setTimeout toàn cục, KHÔNG đổi sang room.clock (#700): lỗi phải ném ngoài phòng để thử process.on ở index.ts.
    setTimeout(() => {
      if (reject) void Promise.reject(new Error("hook test: promise bị từ chối không ai bắt (#270)"));
      else throw new Error("hook test: lỗi cố ý ngoài phòng (#270)");
    }, 100);
    return;
  }
  const id = c.sessionId, p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  const int = (x: unknown, lo: number, hi: number, def: number) => (Number.isInteger(x) ? Math.max(lo, Math.min(hi, x as number)) : def);
  if ((op === "down" || op === "hurt") && d.buffs.delete("inv")) room.syncBuffs(p, d);
  // Hồn thú các hook nhắm: đúng `bid` nếu có (BĐ6e: tinh anh có tùy tùng / hồn thú khác đứng gần hơn), không thì gần nhất trong 160 pixel.
  const nearB = () => {
    const bid = typeof o.bid === "string" && room.state.beasts.has(o.bid) ? o.bid : room.nearestBeast(p, 160);
    return bid ? { bid, b: room.state.beasts.get(bid)!, bd: room.bdata.get(bid)! } : null;
  };
  /** Trạng thái trên người gọi (số tầng, giây còn lại) cho hook `ground` / `cold`. */
  const pst = () => Object.fromEntries([...d.st].map(([s, x]) => [s, { n: x.n, t: x.t }]));
  let out: Record<string, unknown> = {};
  const yearsOf = (tier: number) => int(o.years, TIERS[0].years, MAX_YEARS, TIERS[tier].years);
  if (op === "down" && !p.dead) { d.inv = 0; d.shield = 0; room.hurtPlayer(id, d.hpF / VOHON[p.vh].def + 1); }
  else if (op === "hurt" && !p.dead) { d.inv = 0; d.shield = 0; room.hurtPlayer(id, Math.floor(d.hpF * int(o.pct, 0, 99, 0) / 100) / VOHON[p.vh].def); }
  else if (op === "kill") room.rewardKill(id, yearsOf(int(o.tier, 0, TIERS.length - 1, 0)));
  else if (op === "beast" && room.map.zones.length) {
    // Hồn thú thường 1 máu đứng yên tại (x+dx, y+dy) so với người gọi, để bot thử đạn hồn kỹ trúng đích đúng lúc và nhặt hồn hoàn.
    const sp = typeof o.species === "string" ? Math.max(0, beastIndex(o.species)) : 0; // từ 4.1: loài theo mã (hồn cốt mang tên loài)
    const boss = typeof o.boss === "string" ? bossIndex(o.boss) : -1; // từ BĐ4: tinh anh theo mã BOSSES (không thuộc ô tinh anh nào)
    const bid = room.addBeast(0, yearsOf(0), boss >= 0 ? boss : sp, p.x + int(o.dx, -200, 200, 0), p.y + int(o.dy, -200, 200, 0), boss >= 0 ? 1 : 0);
    // Không tung chiêu báo trước; `skills` (#173): giữ chiêu (chỉ tung khi bot gọi `tele`, Song Sắc Mãng đổi dạng).
    room.state.beasts.get(bid)!.hp = 1; room.bdata.get(bid)!.wt = 1e9; if (o.skills) room.bdata.get(bid)!.skT = 1e9; else room.bdata.get(bid)!.skills = [];
    if (!o.realDef) room.bdata.get(bid)!.def = BEAST_DEF.ref; // #116: thủ chuẩn như `spawn`
    // #192 `hpx`: tinh anh đầy máu, máu gốc × hpx (eliteScale tính lại theo máu gốc) để bot đọc đóng góp sau một chiêu mạnh.
    const e = room.bdata.get(bid)!.elite, hb = room.state.beasts.get(bid)!, hpx = int(o.hpx, 1, 1000, 1);
    if (e && hpx > 1) { e.base *= hpx; hb.maxHp = hb.hp = Math.round(e.base * bossHpMult(e.n)); }
    out = { bid }; // bot nhận ra đúng con này (hồn thú hoang có thể sinh cùng lúc)
  }
  else if (op === "chan") {
    // Nhiều kênh (mục 6): `reset` xóa thời gian chờ đổi kênh (CHANNEL_CD) của tài khoản; `nolock`: lần rời phòng kế tiếp không khóa
    // vào lại kênh này (leftRoom); trả số người tối đa mỗi kênh, số kênh, phòng.
    if (o.reset) { channelSwitchAt.delete(d.accountId); leftRoom.delete(d.accountId); bg(presenceBackend.delete(channelSwitchKey(d.accountId)), "presence"); bg(presenceBackend.delete(channelLeftKey(d.accountId)), "presence"); }
    if (o.nolock) testNoLeaveLock.add(d.accountId);
    out = { chMax: CHANNEL_CAP, channel: room.state.channel, roomId: room.roomId };
  }
  else if (op === "slay") {
    // 7.1: hạ hồn thú gần nhất như do người gọi ra đòn cuối (qua killBeast: kinh nghiệm chia tổ đội, đồ rơi, Hồn Tệ). Từ BĐ6d `bid`:
    // hạ đúng hồn thú đó (dù ở xa).
    const sb = typeof o.bid === "string" ? room.state.beasts.get(o.bid) : undefined;
    const x = sb ? { bid: o.bid as string, b: sb } : nearB(); if (x) { room.killBeast(x.bid, id); out = { bid: x.bid, x: x.b.x, y: x.b.y, years: x.b.years }; }
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
      room.partyPublish(await party.sweep(Date.now()));
      out = { aged };
    }
    out = { ...out, view: party.partyView(d.accountId, room.roomId, Date.now()).view };
  }
  else if (op === "view") {
    // 11.4: `all` tắt (true) / bật lại (false) lọc đồng bộ theo vùng cho người gọi; trả số thực thể đang thấy và cả phòng, số hồn thú
    // đang thức; `bid`: vị trí hồn thú đó, có trong view người gọi không, đang thức / đang đi không.
    if (typeof o.all === "boolean") room.interest.setAll(id, o.all);
    let awake = 0, ranked = 0; room.state.beasts.forEach((b) => { if (room.interest.awake(b.x, b.y)) awake++; if (b.rank) ranked++; });
    const vb = typeof o.bid === "string" ? room.state.beasts.get(o.bid) : undefined;
    out = { ...room.interest.stats(id), total: { players: room.state.players.size, beasts: room.state.beasts.size, drops: room.state.drops.size, ranked }, awake,
      ...(vb ? { beast: { x: vb.x, y: vb.y, seen: room.interest.sees(id, "b", o.bid as string), awake: room.interest.awake(vb.x, vb.y), moving: vb.moving } } : {}) };
  }
  else if (op === "goto") {
    const x = Number(o.x), y = Number(o.y);
    // Dừng luôn hướng đi đang giữ; tăng `seq` để client đang dự đoán chuyển động biết input cuối của nó đã bị bỏ và gửi lại (mục 6).
    if (room.map.standable(x, y)) { p.x = x; p.y = y; d.input = { x: 0, y: 0 }; p.seq = (p.seq + 1) >>> 0; p.seqT = 0; }
  }
  else if (op === "drops") {
    const s = int(o.s, 0, 3600, 0);
    room.state.drops.forEach((dr) => { dr.ownerTtl = Math.max(0, dr.ownerTtl - s); dr.ttl = Math.max(0.01, dr.ttl - s); });
  }
  else if (op === "rest") {
    const s = int(o.s, 0, 3600, 0); d.fight = Math.max(d.fight + s, TEAM_COMBAT_SECS);
    room.tickDowns(id, s); room.tickEnergy(id, s); room.sendSquad(id);
    for (const [b, x] of d.buffs) { x.t -= s; if (x.t <= 0) d.buffs.delete(b); } // hiệu ứng có lợi cũng hết giờ
    if (d.lastSkill) d.lastSkill.t -= s * 1000; // hồn kỹ gần nhất cũng cũ đi (cửa sổ Phục Chế COPY_WINDOW, 9.3)
    room.syncBuffs(p, d);
    room.tickAva(id, s); // Võ Hồn Chân Thân và hồi chiêu của nó (8.1a)
    room.tickFusion(id, s); // lời mời dung hợp kỹ đang chờ (#192); hồi chiêu theo tài khoản cũng trôi `s` giây
    const fu = fusionReady.get(d.accountId); if (fu !== undefined) fusionReady.set(d.accountId, fu - s * 1000);
    d.danCd = Math.max(0, d.danCd - s); room.sendBag(id);
  }
  else if (op === "give") {
    const code = String(o.code ?? ""), qty = int(o.qty, 1, 1e6, 1); // đủ lấp túi BAG_MAX_SLOTS ô đồ gộp (#215)
    let got = 0;
    if (code === RING_ITEM) while (got < qty && room.addRing(d, yearsOf(0))) got++;
    else if (code === BONE_ITEM) {
      const beast = beastIndex(String(o.beast ?? "")) >= 0 ? String(o.beast) : BEASTS[0].id;
      const slot = BONE_SLOTS.some((s) => s.id === o.slot) ? String(o.slot) : BONE_SLOTS[0].id;
      // 8.2: `enhance` cho sẵn cấp cường hóa (và đúng số điểm của cấp đó) để thử cộng minh mà không phải cường hóa từng món.
      const e = int(o.enhance, 0, BONE_MAX_ENHANCE, 0);
      for (let it; got < qty && (it = room.addBone(d, yearsOf(0), beast, slot)); got++)
        if (e) { it.enhance = e; it.stats = { ...(it.stats as object), xp: boneEnhanceNeed(e) }; }
    }
    else if (code === CORE_ITEM) {
      const stars = int(o.stars, 1, MAX_CORE_STARS, 1), si = coreSetIndex(o.set), e = int(o.enhance, 0, CORE_MAX_ENHANCE, 0); // 8.2: như hồn cốt
      for (let it; got < qty && (it = room.addCore(d, stars, rollCoreStats(stars, MAPS[room.state.mapId]?.cores ?? [], Math.random, si >= 0 ? si : undefined))); got++)
        if (e) { it.enhance = e; it.stats = { ...(it.stats as object), xp: coreEnhanceNeed(e) }; }
    }
    else got = room.addItem(d, code, qty);
    if (got < qty) room.log(id, itemDef(code) ? `Túi đồ đã đầy (${d.bagSlots} ô): ${qty - got} món không nhận được.` : "Vật phẩm không tồn tại.", "#ffb35c");
    room.sendBag(id);
  }
  else if (op === "achv") { // Thành Tựu (5.23): `key`, `n` cộng thẳng bộ đếm sự kiện của người gọi (như server đếm), rồi gửi lại trạng thái; trả bộ đếm hiện có
    const key = strIn(o.key), n = int(o.n, 1, 1e6, 1);
    if ((ACHV_COUNTERS as readonly string[]).includes(key)) await store.achvBump(d.accountId, key, n);
    await achvSend(room, id); out = { counters: (await store.achvGet(d.accountId)).counters };
  }
  else if (op === "mail") { // Thư (5.24): gửi một thư cho chính người gọi (`title`, `honTe`, `items` [{code, qty}], `dedup`, `ttlMs`, `kind`); trả kết quả `res` hoặc `error`
    try {
      const items = Array.isArray(o.items) ? o.items.slice(0, 20).map((x: { code?: unknown; qty?: unknown }) => ({ code: strIn(x?.code), qty: int(x?.qty, 0, 1e9, 1) })) : [];
      const res = await store.mailSend(d.accountId, { kind: strIn(o.kind) || "gm", dedup: strIn(o.dedup) || `test:${randomUUID()}`, title: strIn(o.title) || "Thư thử", body: strIn(o.body), honTe: int(o.honTe, 0, 1e9, 0), items, ttlMs: o.ttlMs === undefined ? undefined : int(o.ttlMs, 1, 1e12, 1) });
      if (res === "ok") mailNotify(room, id);
      out = { res };
    } catch (e) { out = { error: String((e as Error).message) }; }
  }
  else if (op === "coin") { d.honTe = int(o.n, 0, 1e12, d.honTe); d.bagDirty = true; room.sendBag(id); }
  else if (op === "wpcd") { // hồi dịch chuyển từ xa: `{secs}` đặt còn ngần ấy giây (0 = xóa), tin đáp `{left}` giây còn hồi
    const secs = int(o.secs, 0, 1e6, -1);
    if (secs === 0) await presenceBackend.delete(wpCooldownKey(d.accountId));
    else if (secs > 0) await presenceBackend.putJson(wpCooldownKey(d.accountId), Date.now() + secs * 1000, secs * 1000);
    out = { left: await remoteCdLeft(d.accountId) };
  }
  else if (op === "gmadmin") { _gmSetAdmin(d.accountId, o.on !== false); } // #518: bật / tắt quyền admin GM của người gọi (bot không biết trước mã tài khoản)
  else if (op === "shard") {
    const r = int(o.r, -1, 100, -1);
    d.testShard = r < 0 ? null : { r: Math.min(0.9999, r / 100), i: int(o.i, -1, 99, -1) };
  }
  else if (op === "red") {
    // BĐ6d: cố định số ngẫu nhiên ra hồn thú thường MAX_YEARS năm (r: 0..100, ra khi r/100 < RED_BEAST_CHANCE; −1 bỏ) cho cả phòng;
    // `zone` (tên vùng) thì gọi spawnBeast vùng đó `n` lần ngay (bỏ qua `count`). Trả số hồn thú thường MAX_YEARS năm của kênh.
    const r = int(o.r, -1, 100, -1); room.testRed = r < 0 ? null : r / 100;
    const zi = room.map.zones.findIndex((z) => z.name === o.zone), years: number[] = [];
    if (zi >= 0) for (let k = int(o.n, 0, 50, 1); k > 0; k--) {
      const before = new Set(room.state.beasts.keys()); room.spawnBeast(zi);
      for (const [bid, b] of room.state.beasts) if (!before.has(bid)) years.push(b.years);
    }
    out = { years, reds: [...room.state.beasts.values()].filter((b) => !b.rank && b.years >= MAX_YEARS).length,
      elites: [...room.state.beasts.values()].filter((b) => b.rank && b.years >= MAX_YEARS).length };
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
    if (o.clear === true) { d.bag = d.bag.filter((i) => i.code !== EQUIP_ITEM); d.gear = []; d.gearSt = gearStats(d.gear); d.bagDirty = true; room.afterBones(id, d.ch); room.sendGear(id); out = { cleared: true }; }
    else {
      const tpl = typeof o.tpl === "string" ? equipTemplate(o.tpl) : undefined;
      if (!tpl) out = { error: "mẫu lạ" };
      else if (bagUsed(d.bag) >= d.bagSlots) out = { error: "túi đầy" };
      else {
        const def = itemDef(EQUIP_ITEM)!, it = newItem(def, 1), base = rollEquip(tpl, int(o.ilvl, 1, 99, 1), () => 0.5);
        it.enhance = int(o.enhance, 0, EQUIP_MAX_ENHANCE, 0);
        it.stats = { ...base, roll: Math.max(-1, Math.min(1, typeof o.roll === "number" && Number.isFinite(o.roll) ? o.roll : 0)) * EQUIP_ROLL, luck: equipSlotDef(tpl.slot).luck ? int(o.luck, 0, EQUIP_LUCK_MAX, 0) : 0,
          affixes: Array.isArray(o.affixes) ? (o.affixes as unknown[]).filter((x): x is [CoreStat, number] => Array.isArray(x) && CORE_STAT_IDS.includes(x[0]) && typeof x[1] === "number") : [] };
        d.bag.push(it); d.bagDirty = true; room.sendBag(id); out = { id: it.id };
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
  else if (op === "savefail") { const n = int(o.n, 0, 10, 0), left = saveFailTest.get(d.accountId)?.n ?? 0; if (n) await savePeriodic(room, id).catch((e) => console.warn("[test savefail] xả túi lỗi:", e)); /* xả túi bẩn TRƯỚC khi ép lỗi: lần lưu định kỳ không ăn mất lượt ép (bot equipenh chập chờn) */ if (n) saveFailTest.set(d.accountId, { n, only: o.only === "bag" || o.only === "tong" ? o.only : "" }); else saveFailTest.delete(d.accountId); out = { n, left }; } // #797: ép n lần ghi túi / tông kế tiếp lỗi (xem db.ts)
  else if (op === "roll") { const r = int(o.r, -1, 100, -1); d.testRoll = r < 0 ? null : Math.min(0.9999, r / 100); }
  else if (op === "rush") { if (d.absorbing) room.finishAbsorb(id); }
  else if (op === "drain") { d.mpF = Math.floor(d.mpF * (100 - int(o.pct, 0, 100, 0)) / 100); p.mp = Math.floor(d.mpF); }
  else if (op === "lei") { d.lei = int(o.v, 0, PHONG_LOI.max, 0); p.lei = d.lei; d.fight = 0; }
  else if (op === "bond") out = Object.fromEntries(BOND_KEYS.map((k) => [k, room.bondV(d, k)])); // tổng mỗi loại ràng buộc của đội hiện tại (2.5d, 9.4)
  else if (op === "energy") { const v = int(o.v, 0, TIEN_CO_MAX, 0); d.fight = 0; for (const r of d.team) if (r && !d.down.has(r)) d.energy.set(r, v); }
  else if (op === "spawn") {
    const years = yearsOf(int(o.tier, 0, TIERS.length - 1, 0));
    const x = Math.max(8, Math.min(room.map.MW * TILE - 8, p.x + int(o.dx, -200, 200, 20)));
    const y = Math.max(8, Math.min(room.map.MH * TILE - 8, p.y + int(o.dy, -200, 200, 0)));
    // Vùng chứa điểm sinh theo cả hai trục (Cực Bắc BĐ6c chia vùng theo hàng); không có thì vùng đầu tiên cùng cột như trước.
    const inZ = room.map.zones.findIndex((z) => x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1);
    const zi = Math.max(0, inZ >= 0 ? inZ : room.map.zones.findIndex((z) => x >= z.x0 && x < z.x1)), sp = beastIndex(String(o.species ?? ""));
    const bid = room.addBeast(zi, years, sp >= 0 ? sp : room.map.zones[zi]?.beasts[0]?.species ?? 0, x, y);
    // `hpx` (8.1a): nhân sinh lực hồn thú vừa sinh để bot đếm đủ các nhát của tuyệt kỹ nhiều nhát (không ảnh hưởng luật chơi thật).
    const hb = room.state.beasts.get(bid), hpx = int(o.hpx, 1, 1000, 1); if (hb && hpx > 1) hb.hp = hb.maxHp = hb.maxHp * hpx;
    // #116: hồn thú thử mặc định có thủ chuẩn (BEAST_DEF.ref) để các bài so sát thương đúng công thức không phụ thuộc loài / niên hạn;
    // `realDef` giữ thủ thật theo loài và số năm.
    if (!o.realDef) room.bdata.get(bid)!.def = BEAST_DEF.ref;
    out = { bid }; // bot nhận ra con vừa sinh theo id (hồn thú bậc cao lao về phía người gọi trước bản vá state kế tiếp)
  }
  else if (op === "tele") {
    // Hồn thú gần nhất báo trước chiêu thứ `i` nhắm người gọi ngay lúc này (bỏ qua tầm, hồi chiêu và thời gian chờ). `cancel`: bỏ chiêu
    // nó đang tự báo trước để tung chiêu này.
    const x = nearB(), s = x?.bd.skills[int(o.i, 0, 9, 0)];
    if (x && s && o.cancel) room.cancelCast(x.bid, x.b, x.bd);
    if (x && s && !x.bd.cast) { x.bd.target = id; x.b.aggro = true; room.beginCast(x.bid, x.b, x.bd, s, id, p); out = { bid: x.bid, name: s.def.name }; }
  }
  else if (op === "ground") {
    // #161: các vùng lưu lại của phòng (id, kiểu, hồn thú gây ra, tâm, bán kính, giây còn lại) và trạng thái trên người gọi (số tầng,
    // giây còn lại) để bot đếm Trúng độc theo nhịp. `ttl {s}`: mọi vùng còn đúng s giây (bot không phụ thuộc thời gian thật của vùng).
    if (typeof o.ttl === "number" && o.ttl >= 0) room.grounds.setTtl(Math.min(60, o.ttl));
    out = { grounds: room.grounds.info(), st: pst() };
  }
  else if (op === "cold") {
    // #163: Hỏa Đàn, Cực Hàn đang chạy không, số giây đã tích của người gọi và tầng Hàn / Đóng băng trên người gọi; `acc {s}` đặt số
    // giây đã tích (bot không phải chờ đủ nhịp thật).
    out = { ...room.cold.info(id, typeof o.acc === "number" && o.acc >= 0 ? Math.min(60, o.acc) : undefined), st: pst() };
  }
  else if (op === "tide") {
    // #174: Thủy Triều Dâng đang chạy không, giây tới đợt kế tiếp, id vùng / tâm vùng ngập của đợt gần nhất, mức Làm chậm của người gọi
    // (đã cộng mọi trạng thái, tối đa SLOW_CAP) và trạng thái trên người gọi. `next {s}`: 0 = dâng một đợt ngay, > 0 = đặt giây chờ.
    const t = room.tide.info(typeof o.next === "number" && o.next >= 0 ? Math.min(600, o.next) : undefined);
    out = { ...t, grounds: room.grounds.info(), slow: d ? room.pctl(d).slow : 0, st: pst() };
  }
  else if (op === "split") {
    // #173: hang chia phần đang chạy không, giây tới lần đổi kế tiếp, phần đang hóa, các phần của hang, vùng lưu lại và trạng thái trên
    // người gọi. `next {s}`: 0 = đổi phần ngay, > 0 = đặt giây chờ.
    const t = room.split.info(typeof o.next === "number" && o.next >= 0 ? Math.min(600, o.next) : undefined);
    out = { ...t, grounds: room.grounds.info(), slow: room.pctl(d).slow, st: pst() };
  }
  else if (op === "form") {
    // #173: dạng của hồn thú đổi dạng (`bid` hoặc gần nhất; BossDef.forms): chỉ số dạng, giây còn lại. `next {s}`: 0 = đổi ngay, > 0 = đặt giây.
    const x = nearB(), e = x?.bd.elite, fd = x && x.b.rank ? BOSSES[x.b.species]?.forms : undefined;
    if (x && e && fd) {
      if (o.next === 0) e.formT = 0; else if (typeof o.next === "number" && o.next > 0) e.formT = Math.min(600, o.next);
      if (o.next === 0) room.tickForm(x.bid, x.b, e, fd, 0);
      out = { bid: x.bid, form: e.form, t: e.formT, name: fd.forms[e.form]?.name, sync: x.b.form, warn: x.b.formWarn };
    }
  }
  else if (op === "pst") {
    // Trạng thái lên chính người gọi như do hồn thú gần nhất gây (sát thương đòn thường của nó cho Trúng độc / Thiêu đốt).
    const s = String(o.s ?? "") as StatusId, x = nearB();
    room.applyPStatus(id, { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) }, x?.bd.dmg ?? 10);
  }
  else if (op === "pvp") {
    // Cân bằng PvP (#277), đo không phụ thuộc ngẫu nhiên. `k`: `hit` gây `dmg` (tính như lên hồn thú) cho đối thủ đầu tiên qua damageFoe,
    // cộng `crit` vào tỉ lệ chí mạng (-1: không chí mạng trừ khi hiệu ứng bộ bù), trả sinh lực + khiên đối thủ mất; `st` gây trạng thái
    // lên đối thủ như hồn kỹ công 1 (`self`: lên chính mình như do hồn thú, không nguồn), trả trạng thái đó; `fx` đặt hiệu ứng bộ hồn
    // hạch đang dùng (tới lần tính lại chỉ số kế tiếp; mọi `k` kèm `fx` thì đặt trước khi làm); `heal` trả hệ số hồi máu / khiên.
    const fid = room.foesOf(id)[0], fd = fid ? room.pdata.get(fid) : undefined, k = o.k;
    const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0);
    if (o.fx && typeof o.fx === "object") {
      const fx: Record<string, number> = {};
      for (const [key, v] of Object.entries(o.fx)) if (typeof v === "number" && Number.isFinite(v)) fx[key] = Math.max(-10, Math.min(10, v));
      d.coreFx = fx as CoreFx; out = { ...d.coreFx };
    }
    if (k === "hit" && fid && fd) {
      // `full`: đối thủ đầy sinh lực trước đòn (Trúng độc / Thiêu đốt của bài thử không làm võ hồn ra trận gục giữa chừng).
      const f = room.state.players.get(fid); if (o.full && f) { fd.hpF = f.maxHp; f.hp = f.maxHp; }
      const before = fd.hpF + fd.shield;
      const hit = room.damageFoe(fid, num(o.dmg, 0, 1e6), id, "#fff", undefined, { crit: num(o.crit, -10, 10) });
      out = { hit, dealt: Math.round(before - (fd.hpF + fd.shield)), vh: p.vh, foeVh: room.state.players.get(fid)?.vh };
    } else if (k === "st") {
      const s = String(o.s ?? "") as StatusId, tid = o.self ? id : fid, td = tid ? room.pdata.get(tid) : undefined;
      const a: StatusApply = { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) };
      if (tid && td) room.applyPStatus(tid, a, o.self ? 10 : room.atkOf(d, true, "mid") * ARENA.dmgMult, o.self ? undefined : id);
      const x = td?.st.get(s); out = x ? { t: x.t, v: x.v, n: x.n, src: x.src === id } : { none: true };
    } else if (k === "heal") out = { mult: room.healMult(d) };
  }
  else if (op === "status") {
    const s = String(o.s ?? "") as StatusId, x = nearB();
    const a: StatusApply = { s, n: int(o.n, 1, 9, 1), ...(typeof o.secs === "number" && o.secs > 0 ? { secs: Math.min(60, o.secs) } : {}) };
    if (x && (STATUS_IDS as readonly string[]).includes(s))
      for (const bid of o.all ? [...room.state.beasts.keys()].filter((k) => { const b = room.state.beasts.get(k)!; return Math.hypot(b.x - p.x, b.y - p.y) < 160; }) : [x.bid])
        room.applyStatus(bid, a, id);
  }
  else if (op === "boom") { const x = nearB(); if (x) room.detonateBurn(x.bid, id); }
  else if (op === "bst") {
    // Trạng thái trên hồn thú gần nhất (5.2): giây còn lại, số tầng, độ lớn, có phải do người gọi gây không.
    const x = nearB();
    out = x ? { bid: x.bid, def: x.bd.def, st: Object.fromEntries([...x.bd.st].map(([s, i]) => [s, { t: i.t, n: i.n, v: i.v, mine: i.src === id }])) } : {};
  }
  else if (op === "bdmg") {
    // #116: đòn trực tiếp đúng `v` (không chí mạng) lên hồn thú gần nhất / `bid`, đi qua damageBeast (thủ, Phá giáp, xuyên thủ); trả `dealt`.
    const x = nearB(); if (x) out = { dealt: room.damageBeast(x.bid, int(o.v, 1, 1e8, 1), id, "#ffffff", undefined, { crit: -9 }) };
  }
  else if (op === "bmax") {
    // #218: nhân máu tối đa hồn thú gần nhất / `bid` lên `x` lần và hồi đầy (tinh anh / thú vương / boss: cả máu gốc theo 1 người), để bot
    // đánh đủ lâu mà kiểm tra giữa trận.
    const x = nearB(), k = int(o.x, 1, 10000, 1);
    if (x) { if (x.bd.elite) x.bd.elite.base *= k; x.b.maxHp *= k; x.b.hp = x.b.maxHp; out = { bid: x.bid, hp: x.b.hp }; }
  }
  else if (op === "bhp") { const x = nearB(); if (x) { x.b.hp = Math.max(1, Math.round(x.b.maxHp * int(o.pct, 1, 100, 100) / 100)); x.bd.calm = 0; x.bd.regen = 0; } }
  else if (op === "regen") { const x = nearB(); if (x) { const h0 = x.b.hp; room.regenBeast(x.b, x.bd, int(o.s, 0, 60, 0)); out = { gain: x.b.hp - h0 }; } }
  else if (op === "pregen" && !p.dead && !d.travelling) {
    // #112: sinh lực / hồn lực của người gọi còn hp% / mp%, `hit`: vừa bị đánh (không thì đã lâu), rồi hồi s giây bằng regenPlayer.
    d.hpF = Math.max(1, p.maxHp * int(o.hp, 1, 100, 100) / 100); d.mpF = p.maxMp * int(o.mp, 0, 100, 100) / 100; d.lastHit = o.hit ? 0 : 99;
    const h0 = d.hpF, m0 = d.mpF, safe = room.regenPlayer(p, d, int(o.s, 0, 60, 0)); // kể cả võ hồn ngoài sân (benchHp)
    out = { safe, hp: d.hpF - h0, mp: d.mpF - m0, hp0: h0, mp0: m0, maxHp: p.maxHp, maxMp: p.maxMp, level: p.level, vh: p.vh };
  }
  else if (op === "ready") { d.avaCd.clear(); p.avaCd = 0; fusionReady.delete(d.accountId); bg(presenceBackend.delete(fusionKey(d.accountId)), "presence"); p.ctCd = 0; d.skCd.clear(); for (let i = 0; i < 4; i++) p.cds[i] = 0; for (let i = 0; i < p.bcds.length; i++) p.bcds[i] = 0; d.mpF = p.maxMp * int(o.mp, 0, 100, 100) / 100; p.mp = Math.floor(d.mpF); }
  else if (op === "grant") {
    const vohon = String(o.vohon ?? "");
    if (vohonIndex(vohon) >= 0) {
      store.addVohon(d.accountId, p.name, vohon, d.ch.level).then((v) => {
        if (v && room.pdata.get(id) === d) { d.owned.push(v); room.resCheck(id); }
        room.sendVohons(c); c.send("test", { op, enabled: true });
      }).catch((e) => { console.error("grant thất bại", e); c.send("test", { op, enabled: true }); });
      return;
    }
  }
  else if (op === "legacy") {
    const to = String(o.mapId ?? "");
    if (Object.hasOwn(MAP_MOVED, to) && !d.travelling) {
      room.freeze(id);
      room.chain(d, async () => {
        await store.saveTravel(d.accountId, room.unsaved(id), room.state.mapId, to, int(o.x, 0, 1e5, 0), int(o.y, 0, 1e5, 0), room.unsavedBag(d));
        d.travelled = true;
      }).then(() => {
        if (!d.travelled) d.travelling = false;
        room.sendVohons(c); c.send("test", { op, enabled: true, saved: d.travelled });
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
    if (v === d.ch) room.syncCh(id);
    const vh = Math.max(0, vohonIndex(v.vohon)), rings = v.rings.map(tierOfYears), bones = room.boneBonusOf(d, v.rowId);
    const worn = room.coresOn(d, v.rowId), cores = coreBonus(worn);
    out = { rowId: v.rowId, bones, cores, sets: Object.fromEntries(coreSetCounts(worn)), fx: coreFx(worn),
      slots: Object.fromEntries(worn.map((w) => [w.it.id, w.slot])),
      base: calcStats(vh, v.level, rings, v.stars, {}, {}, d.res.bonus, herbBonus(v.herbs)),
      stats: calcStats(vh, v.level, rings, v.stars, bones, room.withGear(d, cores), d.res.bonus, herbBonus(v.herbs)), gear: { bonus: d.gearSt.bonus, weapon: d.gearSt.weapon, red: d.gearSt.red, luck: d.gearSt.luck }, res: d.res, herbs: { ...v.herbs },
      live: v === d.ch ? { maxHp: p.maxHp, maxMp: p.maxMp, atk: d.atk, passive: d.passive, crit: d.crit, critMult: d.critMult, fx: d.coreFx,
        atkNow: room.atkOf(d, true, "mid"), atkRolls: Array.from({ length: 12 }, () => room.atkOf(d)), spd: d.speed * (1 + room.buffV(d, "spd")), def: room.buffV(d, "def"), critB: room.buffV(d, "crit"),
        ava: d.ava && { row: d.ava.row, t: d.ava.t, stats: d.ava.stats }, avaCd: d.avaCd.get(v.rowId) ?? 0,
        buffs: Object.fromEntries([...d.buffs].map(([k, x]) => [k, { t: x.t, v: x.v }])), shield: d.shield, shieldT: d.shieldT } : null,
      skills: loadoutOf(v.vohon, v.skills), saved: [...v.skills] };
  }
  else if (op === "elite") out = { ...(() => {
    // #119 `bid`: thêm `one` là tinh anh đó (kể cả tinh anh do hook `beast {boss}` sinh, không thuộc ô nào): giao chiến, người tham gia, đóng góp.
    const bd = typeof o.bid === "string" ? room.bdata.get(o.bid) : undefined, e = bd?.elite, b = e && room.state.beasts.get(o.bid as string);
    return e && b ? { one: { bid: o.bid, hp: b.hp, maxHp: b.maxHp, engaged: e.engaged, n: e.n, parts: [...e.parts.keys()], dmgBy: Object.fromEntries(e.dmgBy),
      supBy: Object.fromEntries(e.supBy) } } : {};
  })(), list: room.elites.map((slot) => {
    const b = slot.bid ? room.state.beasts.get(slot.bid) : undefined, bd = slot.bid ? room.bdata.get(slot.bid) : undefined, e = bd?.elite;
    const { spot } = slot, def = BOSSES[spot.boss];
    return { boss: def.id, name: beastName(1, spot.boss), zone: room.map.zones[spot.zone].name, zi: spot.zone,
      rect: { x: spot.x, y: spot.y, w: spot.w, h: spot.h }, bid: slot.bid, respawn: slot.bid ? 0 : slot.t,
      ...(b && bd && e ? { x: b.x, y: b.y, hx: bd.hx, hy: bd.hy, years: b.years, hp: b.hp, maxHp: b.maxHp, base: e.base, dmg: bd.dmg, n: e.n, engaged: e.engaged,
        parts: [...e.parts.keys()], dmgBy: Object.fromEntries(e.dmgBy), supBy: Object.fromEntries(e.supBy), rage: bd.buffs.get("rage") ?? 0, rageCd: e.rageCd, skills: bd.skills.map((x) => x.def.name), minions: bd.minions.size } : {}) };
  }) };
  else if (op === "etick") {
    // Từ BĐ5 chạy cả luật thú vương (người tham gia trong hang, bỏ giao chiến, rút đi khi hết giờ).
    const s = Math.min(1200, Math.max(0, Number(o.s) || 0));
    for (const [bid, bd] of [...room.bdata]) { const b = room.state.beasts.get(bid); if (b && bd.elite) room.tickElite(bid, b, bd, s); }
  }
  else if (op === "king") {
    // BĐ5: `warn {s}` / `spawn {life}` phát sự kiện lịch boss qua presence cho mọi phòng (như schedule.ts), bản đồ `mapId` (mặc định
    // bản đồ của phòng); `info` trả thú vương của phòng (máu, số người, giai đoạn, chiêu, đóng góp, thời gian còn lại; từ 9.2 `dmgBy` / `supBy`).
    // Từ BĐ6e: `mapId` là bản đồ boss thế giới (MapDef.world) thì phát lịch boss thế giới; `boss` chọn con (mặc định con của ngày).
    const kop = String(o.kop ?? "info"), mid = typeof o.mapId === "string" && (MAPS[o.mapId]?.king || MAPS[o.mapId]?.world?.length) ? o.mapId : room.state.mapId;
    const wl = MAPS[mid].world ?? [], kingId = wl.length ? (typeof o.boss === "string" && wl.includes(o.boss) ? o.boss : worldBossOn(mid, bossNow())) : MAPS[mid].king;
    if ((kop === "warn" || kop === "spawn") && kingId) {
      const slot = Date.now();
      publishBoss(room.presence, { mapId: mid, king: kingId, phase: kop, slot, in: kop === "warn" ? int(o.s, 0, 3600, KING.warnSecs) : 0,
        life: int(o.life, 1, 7200, wl.length ? WORLD.lifeSecs : KING.lifeSecs), test: true });
    }
    const bid = room.king?.bid, b = bid ? room.state.beasts.get(bid) : undefined, bd = bid ? room.bdata.get(bid) : undefined, e = bd?.elite, k = e?.king, w = k?.world;
    // `clock` / `clockMode`: đồng hồ lịch boss (BOSS_CLOCK; GAME_TEST mặc định đứng yên ngoài mọi khung) để bot biết lịch thật có chen vào không.
    out = { lair: room.map.lair, slot: room.king?.slot ?? 0, seat: room.king?.seat.state ?? "", roomId: room.roomId, clock: bossNow(), clockMode: bossClockMode(), ...(b && bd && e && k ? { bid, x: b.x, y: b.y, years: b.years, hp: b.hp, maxHp: b.maxHp, base: e.base,
      dmg: bd.dmg, engaged: e.engaged, parts: [...e.parts.keys()], phase: k.phase, roar: k.roar, spd: k.spd, life: k.life, rank: b.rank, boss: k.def.id, now: room.beastDmg(bd),
      skills: bd.skills.map((x) => x.def.name), st: [...bd.st.keys()], cast: bd.cast?.def.name ?? "", charge: !!bd.cast?.charge, ...room.kingRank(e),
      dmgBy: Object.fromEntries(e.dmgBy), supBy: Object.fromEntries(e.supBy), // 9.2: sát thương / hỗ trợ thô theo người
      ...(w ? { world: { rage: w.rage, weak: w.weak, weakT: w.weakT, weakNext: w.weakNext, shield: w.shield, shieldT: w.shieldT, brk: w.brk, dive: w.dive, surf: w.surf,
        chargeT: w.chargeT, armorT: w.armorT, miasmaT: w.miasmaT, diveT: w.diveT, slamT: w.slamT } } : {}) } : {}) };
  }
  else if (op === "wmech") {
    // BĐ6e: chạy ngay một cơ chế của boss thế giới trong phòng: `m` = weak {he, secs} | charge | armor | miasma | dive | surface | slam |
    // rage (đặt thời gian còn lại để tick sau nổi giận) | timers (đẩy mọi chờ cơ chế ra xa 999 giây để bot thử từng cơ chế riêng) |
    // hold {secs} (giữ boss đứng yên để bot đứng cạnh thử luật; 0 = thả).
    const bid = room.king?.bid, b = bid ? room.state.beasts.get(bid) : undefined, bd = bid ? room.bdata.get(bid) : undefined, k = bd?.elite?.king, w = k?.world, mm = k?.def.world ?? {};
    if (bid && b && bd && k && w) {
      // Đang lặn (Du Thủy) thì không chạy cơ chế khác / lặn chồng (như tickWorld).
      const m = String(o.m ?? ""), he = HE_IDS.find((x) => x === o.he) ?? null, up = w.dive <= 0;
      if (m === "weak") room.worldWeak(bid, b, w, he, int(o.secs, 1, 600, WORLD.weakSecs));
      else if (m === "charge" && mm.charge && up) { room.cancelCast(bid, b, bd); room.worldCast(bid, b, bd, mm.charge.skill, true); }
      else if (m === "miasma" && mm.miasma && up) { room.cancelCast(bid, b, bd); room.worldCast(bid, b, bd, mm.miasma.skill, false); }
      else if (m === "slam" && up) { room.cancelCast(bid, b, bd); room.worldCast(bid, b, bd, WORLD_SLAM, false); }
      else if (m === "armor" && mm.armor && up) room.worldArmor(bid, b, w, mm.armor);
      else if (m === "dive" && mm.dive && up) room.worldDive(bid, b, bd, w, mm.dive);
      else if (m === "surface" && w.dive > 0) room.worldSurface(bid, b, bd, k, w);
      else if (m === "rage") k.life = Math.min(k.life, WORLD.lifeSecs - WORLD.enrageSecs);
      else if (m === "hold") { // giữ boss đứng yên (Choáng đặt thẳng, bỏ qua miễn khống chế) `secs` giây; 0 = bỏ
        const secs = Math.min(600, Math.max(0, Number(o.secs) || 0));
        if (secs > 0) bd.st.set("stun", { t: secs, n: 1, v: 0, src: id }); else bd.st.delete("stun");
        room.syncStatus(b, bd);
      }
      else if (m === "timers") { w.chargeT = w.armorT = w.miasmaT = w.diveT = w.slamT = 999; w.weakNext = int(o.weakNext, 0, WORLD.weakAt.length, WORLD.weakAt.length); }
      out = { ok: m, weak: w.weak, shield: w.shield, dive: w.dive, surf: w.surf, cast: bd.cast?.def.name ?? "", charge: !!bd.cast?.charge, life: k.life,
        safe: bd.cast?.safe ?? [], x: b.x, y: b.y };
    }
  }
  else if (op === "egg") {
    // #162: bọc trứng của phòng (eggs.info) và số hồn thú do thú vương gọi ra còn sống; `t {s}` đặt mọi bọc còn đúng s giây trước khi nở (tối đa 25: `BeastState.egg` là uint8).
    const t = typeof o.t === "number" && o.t >= 0 ? Math.min(25, o.t) : undefined, kd = room.king?.bid ? room.bdata.get(room.king.bid) : undefined;
    out = { eggs: room.eggs.info(t), minions: kd ? [...kd.minions].filter((m) => room.state.beasts.has(m)) : [] };
  }
  else if (op === "kdmg") {
    // BĐ5: gây đúng `v` sát thương lên thú vương của phòng (không chí mạng, đi qua damageBeast: thành người tham gia, ghi đóng góp).
    // Từ #119 `bid`: lên hồn thú đó (tinh anh, dù ở xa).
    const bid = typeof o.bid === "string" && room.state.beasts.has(o.bid) ? o.bid : room.king?.bid; if (bid) out = { dealt: room.damageBeast(bid, int(o.v, 1, 1e8, 1), id, "#ffffff", undefined, { direct: false }) };
  }
  else if (op === "chest") {
    // BĐ5: cố định số ngẫu nhiên khi mở rương: hồn cốt / mảnh UR (0..100, rơi khi r/100 < tỉ lệ), võ hồn i trong kingShardPool, số mảnh n,
    // vị trí hồn cốt s; mọi giá trị −1 = ngẫu nhiên; `off` bỏ.
    const pct = (x: unknown) => { const v = int(x, -1, 100, -1); return v < 0 ? -1 : Math.min(0.9999, v / 100); };
    d.testChest = o.off ? null : { bone: pct(o.bone), ur: pct(o.ur), i: int(o.i, -1, 99, -1), n: int(o.n, -1, 99, -1), s: int(o.s, -1, BONE_SLOTS.length - 1, -1) };
  }
  else if (op === "day") {
    room.dayShift = int(o.shift, -3650, 3650, 0); out = { day: room.today() };
    for (const [pid, pd] of room.pdata) if (room.dailyFresh(pd)) room.sendDaily(pid, "reset"); // khảo hạch hằng ngày đặt lại ngay
  }
  else if (op === "tweek") { // #197: lệch tuần tông cho cả tiến trình (số ngày); trả tuần hiện tại
    if (typeof o.shift === "number") testShift.tong = int(o.shift, -3650, 3650, 0);
    out = { week: tongWeek(room.tongNow()), shift: testShift.tong };
  }
  else if (op === "ttask") { // #197: đặt tiến độ tông vụ `i` như hook daily; trả bộ tông vụ
    room.tongFresh(d);
    const i = int(o.i, -1, TONG_DAILY.count - 1, -1), q = d.tongTasks[i];
    if (q && Number.isInteger(o.step)) { d.tongTasks[i] = parseQuest({ step: o.step, accepted: o.accepted === true, prog: o.prog }, q.chain); d.bagDirty = true; room.sendTong(id); }
    out = { day: d.tongDay, tasks: d.tongTasks.map((x) => ({ ...x, status: questStatus(x) })) };
  }
  else if (op === "tpts") { // #197: cộng `n` điểm tông tuần hiện tại (qua chuỗi lưu), xong thì gửi log "[test] điểm tông …"
    const n = int(o.n, 0, 10000, 0), tong = d.tong, week = tongWeek(room.tongNow());
    if (tong) room.chain(d, async () => { const pts = await store.addTongPoints(d.accountId, week, tong, n); room.log(id, `[test] điểm tông ${pts}`); });
    out = { week, tong };
  }
  else if (op === "daily") {
    // Khảo hạch hằng ngày: `shift` lệch ngày của bộ bài cho cả tiến trình (mọi phòng, kể cả phòng sân đấu mở sau; phòng khác đặt lại
    // ở lần kiểm tra ngày kế tiếp trong tick); đặt tiến độ bài `i` của hôm nay (bước, đã nhận, số đếm; kẹp như khi nạp DB); trả ngày
    // và tiến độ cả bộ.
    if (o.shift !== undefined) {
      testShift.daily = int(o.shift, -3650, 3650, 0);
      for (const [pid, pd] of room.pdata) if (room.dailyFresh(pd)) room.sendDaily(pid, "reset");
    }
    const i = int(o.i, -1, DAILY.count - 1, -1), q = d.daily[i];
    if (q && Number.isInteger(o.step)) { d.daily[i] = parseQuest({ step: o.step, accepted: o.accepted === true, prog: o.prog }, q.chain); d.bagDirty = true; room.sendDaily(id); }
    out = { day: d.dailyDay, daily: d.daily.map((x) => ({ ...x, status: questStatus(x) })) };
  }
  else if (op === "quest") {
    // 6.2: đặt tiến độ chuỗi cố định `chain` (mặc định tân thủ; bước, đã nhận, số đếm; kẹp như khi nạp DB) như tài khoản đang ở giữa chuỗi;
    // trả tiến độ hiện tại.
    const q = room.fixedQuest(d, typeof o.chain === "string" ? o.chain : QUEST_STARTER);
    if (q && Number.isInteger(o.step)) { Object.assign(q, parseQuest({ step: o.step, accepted: o.accepted === true, prog: o.prog }, q.chain)); d.bagDirty = true; room.sendQuest(id, undefined, undefined, q.chain); }
    out = { quest: q && { ...q, status: questStatus(q) } };
  }
  else if (op === "warp") {
    // 6.2: chuyển sang bản đồ `mapId` tại (x, y) qua đúng transaction đi cổng (beginTravel, như một cổng ẩn); client nhận `travel`
    // rồi vào phòng mới như đi cổng thật. Chỗ không đứng được thì vào ở `spawn`.
    const to = String(o.mapId ?? "");
    if (Object.hasOwn(MAPS, to) && MAPS[to].kind !== "arena" && to !== room.state.mapId && !d.travelling && !d.travelCast) {
      room.beginTravel(id, { name: "warp", to, arrive: "", ax: Number(o.x) || 0, ay: Number(o.y) || 0, level: null, boat: false, x: 0, y: 0, w: 0, h: 0 });
      out = { warp: to };
    }
  }
  else if (op === "awatch") { const n = int(o.max, 0, ARENA.watchMax, -1); setTestWatchMax(n < 0 ? null : n); out = { max: arenaWatchMax() }; } // #278: số người xem tối đa
  else if (op === "aelo") {
    // 7.2: ghi Elo / thành tích Đại Đấu Hồn Trường của người gọi (qua chuỗi lưu, không thưởng) để thử ghép theo Elo và bảng xếp hạng.
    // `gain` (#791): trước đó ghi thêm ngần ấy Elo vào tổng cộng thêm hôm nay (kẹp ở ARENA.eloDaily) để thử trần; Elo rồi bị `elo` đặt lại như thường.
    const gain = int(o.gain, 0, 1e6, 0), rec = { elo: int(o.elo, 0, 1e6, ARENA.startElo), wins: int(o.wins, 0, 1e6, 0), losses: int(o.losses, 0, 1e6, 0), draws: int(o.draws, 0, 1e6, 0) };
    room.chain(d, async () => {
      if (gain) await store.saveArena(d.accountId, ARENA.startElo, { elo: gain, wins: 0, losses: 0, draws: 0 }, undefined, { day: room.today(), limit: ARENA.eloDaily });
      const cur = await store.getArena(d.accountId, ARENA.startElo);
      await store.saveArena(d.accountId, ARENA.startElo, { elo: rec.elo - cur.elo, wins: rec.wins - cur.wins, losses: rec.losses - cur.losses, draws: rec.draws - cur.draws });
    }).then(() => { room.sendVohons(c); c.send("test", { op, enabled: true, rec }); });
    return;
  }
  else if (op === "aslow") arenaTestSlow(d.accountId, int(o.ms, 0, 10000, 0)); // #225: lần đọc Elo kế tiếp lúc xếp hàng chậm thêm `ms` mili giây
  else if (op === "claims") {
    // BĐ5: lượt nhận rương thú vương hôm nay trong bộ nhớ và trong DB (đọc sau khi chuỗi lưu xong).
    room.chain(d, async () => {
      const db = await store.bossClaims(d.accountId, room.today(), BOSS_CLAIM_KING), wdb = await store.bossClaims(d.accountId, room.today(), BOSS_CLAIM_WORLD);
      const sdb = await store.bossClaims(d.accountId, room.today(), SHARD_BUY.claimKind); // #282: mảnh đã đổi ở Thương hội
      room.sendVohons(c); c.send("test", { op, enabled: true, day: room.today(), n: room.claimsToday(d), db, w: room.claimsToday(d, true), wdb, s: room.shardBuyToday(d), sdb });
    });
    return;
  }
  else if (op === "auto") {
    // Auto 1: `used` đặt số giây đã treo hôm nay (thử hết giờ); `pvp` một đòn như của người chơi khác (hurtPlayer với `pvp`, phòng bản
    // đồ không có PvP thật); trả trạng thái tự săn (mục tiêu, đồ đang nhặt, điểm neo, võ hồn chính khi đổi tay tiên cơ).
    if (typeof o.used === "number" && Number.isFinite(o.used)) { d.autoUsed = Math.max(0, Math.min(AUTO_DAILY_SECS, o.used)); d.autoDay = room.today(); d.autoDirty = true; room.sendAuto(id); }
    // Auto 2: `bonus` đặt quỹ giờ treo cộng thêm (giây, 0..AUTO_BONUS_MAX).
    if (typeof o.bonus === "number" && Number.isFinite(o.bonus)) { d.autoBonus = Math.max(0, Math.min(AUTO_BONUS_MAX, o.bonus)); d.autoDirty = true; room.sendAuto(id); }
    if (o.pvp && !p.dead) { d.inv = 0; room.hurtPlayer(id, 1, { pvp: { dealt: 0 } }); }
    // `rate: true` dùng nhịp tin `auto` thật (AUTO_MSG_RATE) và đầy lại lượt; `rate: false` nới lại (thử F2 báo cáo soát).
    if (typeof o.rate === "boolean") { d.autoRealRate = o.rate; d.autoTok = AUTO_MSG_RATE.burst; d.autoTokAt = Date.now(); d.autoSetPend = null; }
    const a = d.auto;
    // #213: `pace` đặt nợ nhịp (giây) của lượt tự săn đang chạy (thử trần tốc độ AUTO_PACE).
    if (a && typeof o.pace === "number" && Number.isFinite(o.pace)) a.pace = Math.max(-3600, Math.min(3600, o.pace));
    // AH4 (#611): `loop` điền sẵn các điểm đứng quanh chỗ này (giả lập đi vòng lặp AUTO_STUCK.window giây): mẫu kế tiếp kích hoạt chống kẹt.
    if (a && o.loop) { a.trail = Array.from({ length: Math.ceil(AUTO_STUCK.window / AUTO_STUCK.sample) - 1 }, () => ({ x: p.x, y: p.y })); a.trailT = 0; }
    // #218: `kn` / `wn` đặt số lượt nhận thưởng thú vương / boss thế giới hôm nay trong bộ nhớ (thử tự săn bỏ boss khi hết lượt; DB vẫn
    // là nguồn chính lúc nhận, claimBoss).
    if (typeof o.kn === "number") Object.assign(d.claims, { day: room.today(), n: int(o.kn, 0, KING.daily, 0) });
    if (typeof o.wn === "number") Object.assign(d.wclaims, { day: room.today(), n: int(o.wn, 0, WORLD.daily, 0) });
    // `bid`: hồn thú đó đang nhắm ai, ai đánh gần nhất, đang về chỗ sinh; #266: số giây tự săn của mình còn bỏ qua nó (kẹt / không tới
    // được; null khi không bị bỏ qua hoặc đã hết hạn mà chưa tới nhịp dọn), những người treo ngoài tổ đội đang nhắm nó (như
    // AutoHunter.claimed: tự săn của mình không nhắm theo).
    const bid = typeof o.bid === "string" ? o.bid : "", bd = bid ? room.bdata.get(bid) : undefined, skipTo = a?.skip.get(bid);
    const claim: string[] = []; if (bd) for (const [sid, x] of room.pdata) if (x.auto && x.auto !== a && x.auto.target === bid && !a?.ally(sid)) claim.push(sid);
    // `secs`: giây đã treo lượt này theo nhịp server (cùng đồng hồ với nợ nhịp; bot đo cửa sổ trần tốc độ bằng nó, #328).
    out = { on: !!a, used: d.autoUsed, bonus: d.autoBonus, day: d.autoDay, secs: a?.secs ?? null, target: a?.target ?? null, pace: a?.pace ?? null, est: a?.est ?? null, why: a?.why?.w ?? null, mates: a?.mates().length ?? 0, goal: a?.goal ?? null, path: a?.path.length ?? null,
      drop: a?.loot ? (({ x, y, item, owner, ownerTtl }) => ({ x, y, item, owner, ownerTtl }))(room.state.drops.get(a.loot) ?? ({} as DropState)) : null, loot: a?.loot ?? null, anchor: a?.anchor ?? null, home: a?.home ?? null, cfg: d.autoCfg,
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
      const id2 = d.tong, at = t ? now : null; room.chain(d, () => t ? store.setTong(d.accountId, id2, at, tongWeek(now)) : store.setTong(d.accountId, null, null, tongWeek(now)));
      if (t) room.questEvent(id, { k: "tong" }); // #286: như gia nhập thật
      room.sendTong(id);
    }
    if (d.tongAt !== null && typeof o.back === "number" && Number.isFinite(o.back)) {
      d.tongAt -= Math.max(0, Math.min(365, o.back)) * 86400000;
      const at = d.tongAt; room.chain(d, () => store.setTong(d.accountId, d.tong, at));
    }
    out = { tong: d.tong, at: d.tongAt, ptong: p.tong };
  }
  else if (op === "perf") {
    // #218: thời gian tick / bản vá trung bình và lớn nhất (ms) của phòng từ lần đặt lại trước (chỉ đo khi server bật PERF_LOG=1);
    // `reset` đặt lại sau khi đọc.
    const a = room.perfAll, n = Math.max(1, a.n);
    out = { on: room.perfOn, n: a.n, tick: a.tick / n, patch: a.patch / n, max: a.max, auto: a.auto / n, players: room.state.players.size, beasts: room.state.beasts.size, ...(o.mem === true ? (({ rss, heapUsed }) => ({ rss, heap: heapUsed }))(process.memoryUsage()) : {}) };
    if (o.reset) Object.assign(a, { n: 0, tick: 0, patch: 0, max: 0, auto: 0 });
  }
  else if (op === "offline") {
    // Auto 3: `ago` (giây, 0–7 ngày) lùi thời điểm của lần ủy thác offline kế tiếp (giả lập thời gian trôi); trả vùng săn chỗ đang
    // đứng nếu thoát ở đây thì được ủy thác (null = không), `ago` đang đặt, chế độ và giờ của đồng hồ lịch (chia quỹ theo ngày).
    if (typeof o.ago === "number" && Number.isFinite(o.ago)) testOfflineAgo.set(d.accountId, Math.max(0, Math.min(7 * 86400, o.ago)));
    out = { zone: room.offlineZone(id)?.name ?? null, ago: testOfflineAgo.get(d.accountId) ?? 0, clock: bossClockMode(),
      now: bossNow() + room.dayShift * 86400000, day: room.today() };
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
  else if (op === "erespawn") { const s = Math.max(0, Number(o.s) || 0); for (const slot of room.elites) if (!slot.bid) slot.t = Math.min(slot.t, s); }
  else if (op === "clear") room.state.beasts.forEach((b, bid) => { // `keep`: giữ tinh anh (BĐ4); `all`: cả bản đồ, không chỉ quanh người gọi (BĐ6d)
    // `but` (#213): giữ hồn thú có id này / trong danh sách này (bài tự săn dọn hồn thú tự nhiên quanh mình mà không xóa mục tiêu đang thử).
    if ((o.all || Math.hypot(b.x - p.x, b.y - p.y) < 160) && !(o.keep && b.rank) && !(Array.isArray(o.but) ? o.but.includes(bid) : bid === o.but)) { room.state.beasts.delete(bid); room.bdata.delete(bid); }
  });
  else if (op === "set") {
    const v = d.owned.find((x) => x.rowId === o.rowId);
    if (v) {
      room.syncCh(id);
      v.level = int(o.level, 1, MAX_LEVEL, v.level); v.xp = int(o.xp, 0, 1e9, v.xp); v.stars = int(o.stars, 1, MAX_STARS, v.stars);
      if (Array.isArray(o.rings)) v.rings = o.rings.filter((y) => Number.isInteger(y) && y > 0).slice(0, MAX_RINGS) as number[];
      if (v === d.ch) { d.ringYears = [...v.rings]; room.showVohon(p, v); room.recalc(id, true); } else d.dirty.add(v.rowId);
      room.resCheck(id);
    }
  }
  // Sinh lực / hồn lực đổi qua hpF / mpF (hurtPlayer, drain…) chỉ chép vào state ở tick(): chép ngay, để bản vá state đầu tiên sau tin
  // trả đã có số mới (bot đọc state ngay sau hook; tick có thể chạy sau bản vá kế tiếp khi server bận).
  if (!p.dead && room.pdata.get(id) === d) { p.hp = Math.ceil(Math.min(p.maxHp, d.hpF)); p.mp = Math.floor(Math.min(p.maxMp, d.mpF)); }
  room.sendVohons(c);
  c.send("test", { op, enabled: true, ...out });
}

/**
 * Lệnh GM (#518): chỉ tài khoản trong ADMIN_ACCOUNTS (server-authoritative; trống = tắt hẳn), mỗi lệnh qua gmAllow (giới hạn tốc độ), kiểm bằng
 * parseGm, ghi nhật ký server một dòng `[GM]`. Người không có quyền chỉ nhận một dòng từ chối. Admin dùng lệnh thì tài khoản tự bật is_test.
 */
export function gmAction(room: MapRoom, id: string, raw: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const now = Date.now(), text = typeof raw === "string" ? raw.slice(0, 200) : "";
  if (!gmAllow(d.accountId, now)) return; // bỏ im lặng: không để spam sinh nhật ký / phản hồi
  if (!gmEnabled() || !isAdmin(d.accountId)) {
    console.warn(`[GM] TỪ CHỐI tài khoản #${d.accountId} (${p.name}): ${JSON.stringify(text)}`);
    return room.log(id, "Không có quyền dùng lệnh GM.", "#ffb35c");
  }
  if (room.map.kind === "arena") return room.log(id, "Không dùng lệnh GM trong sân đấu.", "#ffb35c");
  const cmd = parseGm(text);
  if ("error" in cmd) { console.log(`[GM] #${d.accountId} ${p.name}: ${JSON.stringify(text)} -> lỗi: ${cmd.error}`); return room.log(id, cmd.error, "#ffb35c"); }
  if (d.gmReset) return room.log(id, "Đã áp mức dựng sẵn: vào lại game rồi dùng tiếp.", "#ffb35c");
  const done = (msg: string) => { console.log(`[GM] #${d.accountId} ${p.name}: ${JSON.stringify(text)} -> ${msg}`); room.log(id, `GM: ${msg}`, "#9fd8ff"); };
  const run = async () => {
    if (!d.gmMarked) { await store.markTest(d.accountId); d.gmMarked = true; } // tự bật is_test ngay lần dùng đầu
    if (room.pdata.get(id) !== d) return;
    done(await gmRun(room, id, d, cmd));
    if (room.pdata.get(id) === d) { const c = room.clients.getById(id); if (c) room.sendVohons(c); room.sendBag(id); room.sendGear(id); }
  };
  room.chain(d, run).catch((e) => { console.error(`[GM] lỗi lệnh ${JSON.stringify(text)}`, e); room.log(id, "Lệnh GM lỗi (xem log server).", "#ff8a8a"); });
}

/** Thực thi một lệnh GM đã kiểm; trả câu mô tả kết quả. Chạy trong chuỗi lưu của người chơi (gmAction), nên ghi DB không chạy chồng lần lưu khác. */
export async function gmRun(room: MapRoom, id: string, d: PData, cmd: GmCmd): Promise<string> {
  const p = room.state.players.get(id)!, full = () => `Túi đồ đã đầy (${d.bagSlots} ô).`;
  switch (cmd.op) {
    case "level": {
      const v = d.ch; room.syncCh(id);
      v.level = cmd.level; v.xp = 0;
      // Cấp phải đi qua đủ bình cảnh: thiếu hồn hoàn thì thêm hồn hoàn đúng giới hạn của vòng (luôn hợp lệ).
      while (v.rings.length < Math.min(MAX_RINGS, Math.ceil(cmd.level / 10) - 1)) v.rings.push(ringLimit(v.rings.length + 1));
      d.ringYears = [...v.rings]; room.showVohon(p, v); room.recalc(id, true); d.dirty.add(v.rowId); room.resCheck(id);
      return `${VOHON[vohonIndex(v.vohon)].name} cấp ${v.level}, ${v.rings.length} hồn hoàn.`;
    }
    case "give": { const n = room.addItem(d, cmd.code, cmd.qty); return n < cmd.qty ? `${full()} Đã cho ${n}/${cmd.qty}.` : `Đã cho ${n} ${itemDef(cmd.code)!.name}.`; }
    case "ring": { let n = 0; while (n < cmd.qty && room.addRing(d, cmd.years)) n++; return n < cmd.qty ? `${full()} Đã cho ${n}/${cmd.qty} hồn hoàn.` : `Đã cho ${n} hồn hoàn ${formatYears(cmd.years)}.`; }
    case "bone": {
      const it = room.addBone(d, cmd.years, cmd.beast, cmd.slot); if (!it) return full();
      if (cmd.enhance) it.stats = { ...(it.stats as object), xp: boneEnhanceNeed(cmd.enhance), subs: boneAddSubs(cmd.slot, cmd.years, cmd.enhance, [], Math.random).subs };
      it.enhance = cmd.enhance;
      return `Đã cho ${boneName(cmd.beast, cmd.slot, cmd.years, cmd.enhance)}.`;
    }
    case "core": {
      const base = rollCoreStats(cmd.stars, [], Math.random, coreSetIndex(cmd.set)), data = cmd.enhance ? coreUpgradeSubs(base, cmd.stars, coreSubRolls(0, cmd.enhance), Math.random).data : base;
      const it = room.addCore(d, cmd.stars, data); if (!it) return full();
      if (cmd.enhance) { it.stats = { ...(it.stats as object), subs: data.subs, xp: coreEnhanceNeed(cmd.enhance) }; it.enhance = cmd.enhance; }
      return `Đã cho ${coreName(cmd.set, cmd.stars, cmd.enhance)}.`;
    }
    case "gear": {
      const tpl = equipTemplate(cmd.tpl)!, it = room.addEquip(d, rollEquip(tpl, cmd.ilvl, () => 0.5)); if (!it) return full();
      it.enhance = cmd.enhance;
      return `Đã cho ${equipName(cmd.tpl, cmd.enhance)}.`;
    }
    case "vohon": {
      const vi = vohonIndex(cmd.vohon), name = VOHON[vi].name;
      if (d.owned.some((v) => v.vohon === cmd.vohon)) return `Đã sở hữu ${name}.`;
      const v = await store.unlockVohon(d.accountId, p.name, cmd.vohon, 1, room.bagSnapshot(d));
      if (!v) return `Đã sở hữu ${name}.`;
      v.rings = Array.from({ length: cmd.rings }, (_, k) => ringLimit(k + 1)); v.level = Math.min(cmd.level, 10 * (v.rings.length + 1)); d.dirty.add(v.rowId);
      d.owned.push(v); room.resCheck(id);
      return `Đã thêm ${name} cấp ${v.level}, ${v.rings.length} hồn hoàn${cmd.level > v.level ? " (cấp bị kẹp theo bình cảnh, cần thêm hồn hoàn)" : ""}.`;
    }
    case "mail": {
      const res = await store.mailSend(d.accountId, { kind: "gm", dedup: `gm:${randomUUID()}`, title: "Quà từ quản trị", body: "Thư thử do lệnh GM gửi.", items: [{ code: cmd.code, qty: cmd.qty }] });
      if (res === "ok") mailNotify(room, id);
      return res === "ok" ? `Đã gửi thư kèm ${cmd.qty} ${itemDef(cmd.code)!.name}.` : "Hộp thư đầy: xóa bớt thư đã nhận rồi thử lại.";
    }
    case "coin": d.honTe = cmd.n; d.bagDirty = true; return `Hồn Tệ = ${formatHonTe(cmd.n)}.`;
    case "fog": {
      // Sương mù khám phá (R8): mở cả bản đồ đang đứng, hoặc xoá về trống (rồi mở quanh chỗ đứng). Ghi DB như mọi lần đánh dấu (fogFlush).
      if (!room.fogOn) return "Bản đồ này mở sẵn, không có sương mù.";
      if (!d.fog) return "Sương mù chưa nạp xong, thử lại sau.";
      const dims = room.fogDims();
      d.fog = cmd.mode === "open" ? fogFill(dims) : fogEmpty(dims);
      d.fogDirty = true; if (cmd.mode === "reset") room.fogMarkOne(id, d);
      room.sendFog(id);
      return cmd.mode === "open" ? "Đã mở cả bản đồ." : "Đã xoá sương mù về trống (mở lại quanh chỗ đứng).";
    }
    case "tp": {
      if (cmd.mapId === room.state.mapId) return "Đang ở bản đồ đó rồi.";
      if (d.travelling || d.travelCast) return "Đang đi cổng, thử lại sau.";
      room.beginTravel(id, { name: "gm", to: cmd.mapId, arrive: "", ax: 0, ay: 0, level: null, boat: false, x: 0, y: 0, w: 0, h: 0 });
      return `Dịch chuyển tới ${MAPS[cmd.mapId].name}.`;
    }
    case "preset": {
      // Ghi đè DB bằng mức dựng sẵn rồi ngắt client: từ lúc bắt đầu phiên bị khoá (freeze: mọi handler bỏ qua người đang travelling,
      // lưu định kỳ bỏ qua) và mọi lần ghi xếp thêm bị bỏ (gmReset, ở chain), nên không đè lại mức vừa áp bằng túi cũ trong RAM.
      d.gmReset = true; room.freeze(id);
      try { await store.seedTestAccount(p.name, null, buildPreset(cmd.preset)); }
      catch (e) { d.gmReset = false; d.travelling = false; throw e; } // lỗi: trả lại như cũ, người chơi chơi tiếp
      room.clock.setTimeout(() => room.clients.getById(id)?.leave(4000), 800); // clock của phòng: phòng dispose thì tự huỷ (#700)
      return `Đã áp mức "${cmd.preset}": vào lại game để thấy thay đổi.`;
    }
  }
}
