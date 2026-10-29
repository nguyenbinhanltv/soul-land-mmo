// Vào / rời phòng và kênh (GAME_DESIGN.md mục 6 "Nhiều kênh", "Một tài khoản một phiên"): nghiệp vụ `onAuth` / `onJoin` / `onLeave` của phòng, giữ / nhả / chờ phiên cũ của tài khoản, danh sách kênh `sendChannels`, đổi kênh `switchChannel`; tách khỏi MapRoom.ts (#702, bước 14).
// Hàm nhận phòng (`room: MapRoom`) như persist.ts / team.ts / travel.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự / mọi `await`.
// Hook vòng đời Colyseus (`onAuth` / `onJoin` / `onLeave`) vẫn khai ở MapRoom và chỉ chuyển tiếp sang đây; `ArenaRoom` vẫn gọi `waitOldSession` / `holdAccount` / `releaseAccount` như cũ.

import { ServerError, type Client } from "colyseus";
import { PlayerState } from "./schema.ts";
import { store } from "../db.ts";
import { SAVE_EVERY_SECS } from "../../../shared/data.ts";
import { PRESENCE_HEARTBEAT_MS, PRESENCE_TTL_MS, presenceBackend, accountLeaseKey, bg } from "../presence.ts";
import { worldMark } from "../ratelimit.ts";
import { friends } from "../friends.ts";
import * as party from "../party.ts";
import { rankSync } from "./rank.ts";
import { sendState as sendWelfare } from "./welfare.ts";
import { sendState as sendAchv } from "./achv.ts";
import { sendState as sendMail } from "./mail.ts";
import { sendState as sendBicanh, nowOf as bicanhNow } from "./bicanh.ts";
import { gearLook, gearStats, itemStacks } from "./items.ts";
import { MAPS, CHANNEL_CD, TEAM_COMBAT_SECS, encodeLpc, bagSlotsOf, STARTER_ITEMS, SHARD_BUY, BOSS_CLAIM_KING, BOSS_CLAIM_WORLD, AUTO_MSG_RATE, parseAuto, parseSell,
  QUESTS, QUEST_STARTER, questStart, TONG_MON, tongDef, resonanceBonus, bicanhDay } from "../../../shared/data.ts";
import { HOLD_WAIT_MS, buybackKey, buybacks, channelLeftKey, channelSwitchAt, channelSwitchKey, fusionKey, fusionReady, intIn, leftLock, leftRoom, listChannels, newMsgBuckets,
  seatUsed, testNoLeaveLock, testOfflineAgo, worldChatKey, type AuthData, type Buyback, type MapRoom, type PData } from "./MapRoom.ts";

/**
 * Đá phiên cũ của tài khoản (ở mọi phòng) và chờ nó nhả tài khoản, tức là lần ghi cuối của nó (onLeave nối vào chuỗi lưu) đã
 * xong, rồi mới cho onAuth nạp DB. Không chờ thì phiên mới nạp bản cũ, phiên cũ lưu sau, và lần lưu kế tiếp của phiên mới
 * ghi đè làm mất tiến độ (mục 6).
 */
export async function waitOldSession(room: MapRoom, accountId: number, sessionId: string) {
  const key = accountLeaseKey(accountId), old = await presenceBackend.get(key);
  if (!old) return;
  room.presence.publish("kick", { accountId, sessionId });
  for (let t = 0; t < HOLD_WAIT_MS; t += 50) {
    await new Promise((r) => setTimeout(r, 50));
    if ((await presenceBackend.get(key)) !== old) return;
  }
  throw new ServerError(503, "Phiên trước của tài khoản chưa lưu xong, hãy thử lại sau giây lát.");
}

/** Phiên `sessionId` giữ tài khoản (lease `account:<acc>` trong presence) và đá phiên khác của tài khoản ở mọi phòng (mục 6). */
export function holdAccount(room: MapRoom, accountId: number, sessionId: string) {
  const leave = (code: number) => room.clients.getById(sessionId)?.leave(code);
  void presenceBackend.acquireLease(accountLeaseKey(accountId), room.leaseOwner(sessionId), PRESENCE_TTL_MS).then((ok) => {
    if (!ok) leave(4001);
  }).catch((e) => { console.error(`Không ghi được phiên giữ tài khoản #${accountId}`, e); leave(1011); });
  room.presence.publish("kick", { accountId, sessionId });
}

/** Nhả tài khoản sau lần ghi cuối của phiên `sessionId` (chỉ khi phiên đó vẫn đang giữ). */
export async function releaseAccount(room: MapRoom, accountId: number, sessionId: string) {
  // Redis mất thì không chặn onLeave / onDispose (lần ghi cuối đã xong, tắt server vẫn phải thoát): lease tự hết TTL, phiên mới chờ qua waitOldSession.
  try { await presenceBackend.releaseLease(accountLeaseKey(accountId), room.leaseOwner(sessionId)); }
  catch (e) { console.error(`Không nhả được phiên giữ tài khoản #${accountId} (lease tự hết hạn sau ${PRESENCE_TTL_MS / 1000} giây)`, e); }
}

export async function onAuth(room: MapRoom, client: Client, options: { token?: string }) {
  const acc = options?.token ? await store.accountFromToken(options.token) : null;
  if (!acc) throw new ServerError(401, "Phiên đăng nhập không hợp lệ.");
  await seatUsed(acc.accountId, client.sessionId);
  // Kiểm tra trước khi đá phiên cũ: lần vào bị từ chối không được đá phiên đang chơi. Chờ xong thì đọc và kiểm tra lại
  // (phiên cũ có thể vừa đi cổng xong, đổi map_id).
  await room.checkJoin(acc.accountId);
  await room.waitOldSession(acc.accountId, client.sessionId);
  const [{ ch, looks, loc }, owned] = await Promise.all([room.checkJoin(acc.accountId), store.listVohons(acc.accountId)]);
  // Vừa tự rời một kênh khác của bản đồ này (không qua đổi kênh), hoặc vừa đi cổng / đổi kênh tới kênh server chọn: chỉ được vào kênh
  // đó tới hết CHANNEL_CD giây (leftRoom).
  const back = room.state.channel ? await leftLock(acc.accountId, room.state.mapId, await listChannels(room.state.mapId)) : null;
  if (back && back.roomId !== room.roomId) {
    const l = leftRoom.get(acc.accountId)!, wait = Math.ceil((l.until - Date.now()) / 1000);
    throw new ServerError(409, l.travel ? `Hãy vào kênh ${back.ch} (kênh server đã chọn) hoặc chờ ${wait} giây.` : `Vừa rời kênh ${back.ch}: vào lại kênh ${back.ch} hoặc chờ ${wait} giây.`);
  }
  const auth: AuthData = { accountId: acc.accountId, ch: owned.find((v) => v.rowId === ch.rowId) ?? ch, owned, team: [], looks, loc,
    bag: { items: [], honTe: 0 }, starter: false, claims: { day: room.today(), n: 0 }, wclaims: { day: room.today(), n: 0 }, shardBuy: { day: room.today(), n: 0 }, wps: [],
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

export function onJoin(room: MapRoom, client: Client, _o: unknown, auth: AuthData) {
  const { ch, owned, team, looks, loc, bag } = auth;
  // Một tài khoản chỉ được vào một lần: giữ tài khoản cho phiên này, đá phiên cũ ở mọi phòng (kể cả phòng này). onAuth đã
  // chờ phiên cũ lưu xong; lần đá này chặn hai lần vào gần như cùng lúc.
  if (room.state.channel) { leftRoom.delete(auth.accountId); bg(presenceBackend.delete(channelLeftKey(auth.accountId)), "presence"); } // đã vào được (đúng kênh vừa rời, hoặc qua đường server duyệt): bỏ khóa kênh
  const leaseOwner = room.leaseOwner(client.sessionId);
  room.holdAccount(auth.accountId, client.sessionId);
  void presenceBackend.getJson<Buyback[]>(buybackKey(auth.accountId)).then((list) => { if (list?.length) buybacks.set(auth.accountId, list); else buybacks.delete(auth.accountId); })
    .catch((e) => console.error(`Không đọc được danh sách mua lại của #${auth.accountId}`, e));
  void presenceBackend.getJson<number>(fusionKey(auth.accountId)).then((t) => { if (t && t > Date.now()) fusionReady.set(auth.accountId, t); })
    .catch((e) => console.error(`Không đọc được hồi chiêu dung hợp của #${auth.accountId}`, e));
  void presenceBackend.getJson<number>(worldChatKey(auth.accountId)).then((t) => { if (t) worldMark(auth.accountId, t); })
    .catch((e) => console.error(`Không đọc được hồi kênh thế giới của #${auth.accountId}`, e));
  const p = new PlayerState();
  p.name = ch.name; room.showVohon(p, ch);
  p.sex = looks.sex; p.hair = looks.hair; p.hairCol = looks.hairCol; p.outfitCol = looks.outfitCol; p.skin = looks.skin; p.lpc = looks.lpc ? encodeLpc(looks.lpc) : "";
  gearLook(p, bag.items.filter((i) => i.equipSlot !== undefined));
  // Vị trí đã lưu; chưa có, kẹt trong ô chặn hoặc ngoài bản đồ thì về `spawn` (mục 6).
  const pos = loc.x !== null && loc.y !== null && room.map.standable(loc.x, loc.y) ? { x: loc.x, y: loc.y } : room.spawnPoint();
  p.x = pos.x; p.y = pos.y;
  const d: PData = { accountId: auth.accountId, leaseOwner, leaseT: PRESENCE_HEARTBEAT_MS, owned, team, ch, ringYears: [...ch.rings], input: { x: 0, y: 0 }, dir: { x: 1, y: 0 }, walk: false,
    target: "", atk: 0, speed: 0, atkCd: 0, inv: 1.5, lastHit: 99, deadT: 0, absorbing: null, testRoll: null, testShard: null, testBone: null, testCore: null, testHerb: null, looksN: looks.changes, looksBusy: false, shardBusy: false, mpF: 0, hpF: 0, fight: 99,
    benchHp: new Map(), down: new Map(), dirty: new Set(), squadKey: "", squadT: 0,
    saving: Promise.resolve(), saveSig: "", saveIn: SAVE_EVERY_SECS * (0.5 + Math.random() * 0.5), teamQueued: false, tradeQueued: false, latest: new Map(), portalKey: "", travelCast: null, travelling: false, travelled: false, gmReset: false, gmMarked: false, chListAt: 0, chListQueued: false, bossAskAt: 0, msgLimit: process.env.GAME_TEST !== "1", msgTok: newMsgBuckets(), msgOver: 0, msgOverAt: 0, msgGone: false, statsRow: undefined, askAt: new Map(), askQueued: new Set(),
    wps: new Set(auth.wps), wpKey: "", fog: null, fogAdd: [], fogDirty: false,
    energy: new Map(), shield: 0, shieldT: 0, buffs: new Map(), lei: 0, leiQueued: false, lastSkill: null,
    bag: bag.items.filter((i) => i.equipSlot === undefined), gear: bag.items.filter((i) => i.equipSlot !== undefined), gearSt: gearStats(bag.items.filter((i) => i.equipSlot !== undefined)), honTe: bag.honTe, bagSlots: bagSlotsOf(bag.slots), bagDirty: false, bagSent: null, bagBuyback: "",
    sellCfg: parseSell(bag.sell), sold: bag.sold ?? [], sellCheck: true, sellSent: "", soldN: 0, soldCoins: 0, autoSold0: [0, 0], danCd: 0, starterNote: auth.starter, st: new Map(), dotT: 0, hanT: 0, charm: null,
    claims: auth.claims, wclaims: auth.wclaims, shardBuy: { ...auth.shardBuy, pend: 0 }, claimBusy: 0, lockIds: new Set(), enhBusy: false, tongBusy: false, salvAt: 0, testSyn: null, testEnh: null, testEnhSlow: 0, testEquip: null, testClaimHold: false, testTravelLost: false, testChest: null, passive: { buff: {}, resist: {} },
    vit: null, vitAt: 0, coreFx: {}, crit: 0, critMult: 1, combo: 0, comboT: 99, haste: 0, shockMpCd: 0, partyKey: "",
    quest: bag.quests?.find((q) => q.chain === QUEST_STARTER) ?? questStart(QUEST_STARTER),
    chains: QUESTS.filter((c) => c.id !== QUEST_STARTER).map((c) => bag.quests?.find((q) => q.chain === c.id) ?? questStart(c.id)), ...room.dailyOf(bag.quests), ...room.tongTasksOf(bag.quests), tongBoardAt: 0, tongPend: [],
    res: { prog: [], lv: [], bonus: resonanceBonus([]) }, resKey: "", ava: null, avaCd: new Map(), fus: null, skCd: new Map(), arenaBusy: false, arenaTopAt: 0, arenaLiveAt: 0, arenaWatchAt: 0, resonanceTopAt: 0, rankTopAt: 0, rankSig: "", rankAt: 0, welfareDay: room.today(), achvReady: -1, bicanhDay: bicanhDay(bicanhNow(room)), arenaGone: false,
    auto: null, autoCfg: parseAuto(auth.auto.settings), autoDay: room.today(), autoUsed: auth.auto.day === room.today() ? auth.auto.used : 0,
    autoBonus: auth.auto.bonus, autoDirty: false, autoTok: AUTO_MSG_RATE.burst, autoTokAt: Date.now(), autoSetPend: null, autoRealRate: false, autoPace: [0, 0], autoHintC: null, offMsg: null, offAsk: false,
    tong: tongDef(auth.tong.tong)?.id ?? null, tongAt: auth.tong.at };
  p.tong = d.tong ? TONG_MON.findIndex((t) => t.id === d.tong) + 1 : 0;
  room.pdata.set(client.sessionId, d);
  room.state.players.set(client.sessionId, p);
  room.state.online = room.state.players.size;
  room.rebindContrib(client.sessionId, auth.accountId); // #119: đóng góp boss theo tài khoản, vào lại không mất
  room.interest.join(client, p); // 11.4: view riêng, chỉ thực thể ở gần (state đầy đủ đầu tiên gửi sau onJoin)
  const filled = room.fillBoneSubs(d); // #187: tung bù dòng phụ hồn cốt cũ một lần (trước khi tính chỉ số)
  room.resCheck(client.sessionId, false); // cộng minh (8.2) tính trước chỉ số ban đầu, không báo mốc
  room.recalc(client.sessionId, true);
  if (filled) room.save(client.sessionId); // ghi ngay qua chuỗi lưu để lần vào sau không tung lại
  room.fogLoad(client.sessionId); // sương mù khám phá (R8): nạp bitset của bản đồ này rồi mở quanh chỗ đứng
  room.chain(d, () => room.claimOffline(client.sessionId)); // ủy thác offline (Auto 3): nhận thưởng thời gian vắng mặt
  room.questEvent(client.sessionId, { k: "map", map: room.state.mapId }); // 6.2: mục tiêu "đặt chân tới bản đồ"
  room.broadcast("chat", { sys: true, name: "Hệ thống", text: `${p.name} đã tới ${MAPS[room.state.mapId].name}.` }, { except: client });
  // Tổ đội (7.1): có mặt trong game (tổ đội giữ nguyên khi đi cổng); đồng đội ở mọi bản đồ thấy đổi bản đồ / vào lại.
  const online = party.goOnline({ acc: auth.accountId, name: p.name, sid: client.sessionId, mapId: room.state.mapId, roomId: room.roomId,
    ch: room.state.channel, level: p.level, vh: p.vh, hp: p.hp, maxHp: p.maxHp, dead: p.dead });
  room.partyPublish(online);
  room.sendParty(client.sessionId, true);
  // Bạn bè (#195): giữ danh sách vừa nạp; người đã thêm nhau đang trong game thấy mình online / đổi bản đồ, kênh (báo sau khi bảng
  // `Live` của tổ đội đã ghi chỗ mới, vì bảng bạn bè đọc vị trí ở đó).
  friends.enter(auth.accountId, client.sessionId, p.name, auth.social);
  room.friendAfter(online, auth.accountId);
  void sendBicanh(room, client.sessionId); // Bí Cảnh: chấm đỏ "còn lượt" ngay lúc vào phòng
  void sendMail(room, client.sessionId); // Thư: chấm đỏ "có thư chưa đọc / chưa nhận" ngay lúc vào phòng
  void sendAchv(room, client.sessionId); // Thành Tựu: chấm đỏ "có thành tựu chưa nhận" ngay lúc vào phòng
  void sendWelfare(room, client.sessionId); // Phúc Lợi: chấm đỏ "chưa điểm danh" ngay lúc vào phòng
  void room.chain(d, () => rankSync(room, client.sessionId, d, true)); // Bảng Xếp Hạng: người mới / chưa có điểm lên bảng ngay, không chờ lần lưu đầu
}

export async function onLeave(room: MapRoom, client: Client) {
  const id = client.sessionId, p = room.state.players.get(id), d = room.pdata.get(id);
  room.interest.leave(id);
  if (p && d) {
    // Client đã đi: dừng mọi tiến độ ngay (hấp thụ dở bị hủy). Không dừng thì trong lúc chờ ghi DB, tick vẫn có thể hấp thụ
    // xong hay đạn còn bay hạ hồn thú, cộng vào nhân vật sau khi write() đã chụp dữ liệu, rồi mất khi pdata bị xóa.
    if (d.absorbing) { d.absorbing = null; p.absorb = 0; }
    const zone = room.offlineZone(id); // ủy thác offline (Auto 3): chụp chỗ đứng trước khi freeze
    room.freeze(id);
    // Tổ đội (7.1): vẫn trong đội PARTY_OFFLINE_SECS giây (đi cổng, vào lại); quá thì party.sweep cho ra khỏi đội.
    const offline = party.goOffline(d.accountId, id, Date.now());
    room.partyPublish(offline);
    // Bạn bè (#195): người đã thêm nhau thấy mình rời phòng (đi cổng / đổi kênh thì onJoin của phòng mới báo bản đồ / kênh mới;
    // không tới được phòng mới thì vẫn đúng là ngoại tuyến), sau khi `Live` đã ghi rời phòng. Lần ghi bạn bè còn trong chuỗi lưu.
    room.friendAfter(offline, d.accountId, id);
    // Nối vào chuỗi lưu: chờ mọi lần ghi trước (kể cả transaction đi cổng) rồi mới xét. Đã đi cổng thành công thì
    // không ghi gì nữa; transaction lỗi hoặc chưa đi cổng thì lưu như thường (có lớp chặn WHERE map_id).
    await room.chain(d, async () => {
      if (d.travelled || d.gmReset) return;
      await room.write(id, true);
      // Ủy thác offline (Auto 3, mục 5.13): rời game (không qua cổng / đổi kênh / vào sân đấu) khi đứng trong vùng săn thì ghi vùng và
      // thời điểm (đồng hồ server; hook test `offline` lùi thời điểm), sau lần ghi cuối để giờ treo trong ngày đã lưu.
      if (!zone || d.arenaGone) return;
      const ago = testOfflineAgo.get(d.accountId) ?? 0; testOfflineAgo.delete(d.accountId);
      await store.startOffline(d.accountId, { mapId: room.state.mapId, zone: zone.name, at: Date.now() - ago * 1000, day: d.autoDay, used: d.autoUsed });
    });
    if (!d.travelled) room.broadcast("chat", { sys: true, name: "Hệ thống", text: `${p.name} đã rời ${MAPS[room.state.mapId].name}.` });
    if (!d.travelled && !d.arenaGone) room.forgetBuyback(d.accountId); else buybacks.delete(d.accountId); // rời game: thương nhân quên đồ vừa bán (9.8); sang phòng khác (có thể tiến trình khác): bản ở presence là bản đúng, nạp lại lúc vào
    // Rời không qua đi cổng / đổi kênh: khóa vào lại đúng kênh này CHANNEL_CD giây (trước khi nhả tài khoản cho phiên mới).
    if (room.state.channel && !d.travelled && !testNoLeaveLock.delete(d.accountId)) {
      const lock = { mapId: room.state.mapId, roomId: room.roomId, ch: room.state.channel, until: Date.now() + CHANNEL_CD * 1000 };
      leftRoom.set(d.accountId, lock); bg(presenceBackend.putJson(channelLeftKey(d.accountId), lock, CHANNEL_CD * 1000), "presence");
    }
  }
  room.state.players.delete(id);
  room.state.online = room.state.players.size;
  room.pdata.delete(id);
  // Lần ghi cuối đã xong: phiên mới của tài khoản (đang chờ trong onAuth) được nạp DB.
  const accountId = d?.accountId ?? (client.auth as AuthData | undefined)?.accountId;
  if (!d && accountId !== undefined) friends.leave(accountId, id); // người xem trận (#278) không có pdata
  if (accountId !== undefined) await room.releaseAccount(accountId, id);
}

/**
 * Tin riêng "channels": các kênh đang mở của bản đồ (số kênh, số người, tối đa, đầy) và kênh hiện tại; tối đa 1 lần / giây. Xin
 * dồn trong 1 giây thì không bỏ mà hẹn gửi một lần khi hết giây đó (client đang chờ danh sách mới).
 */
export async function sendChannels(room: MapRoom, c: Client) {
  const d = room.pdata.get(c.sessionId), now = Date.now();
  if (!d) return;
  if (!room.state.channel) return c.send("channels", { cur: 0, list: [] }); // sân đấu (7.2) không có kênh
  const wait = d.chListAt + 1000 - now;
  if (wait > 0) {
    if (!d.chListQueued) {
      d.chListQueued = true;
      room.clock.setTimeout(() => { d.chListQueued = false; if (room.pdata.get(c.sessionId) === d) room.sendChannels(c); }, wait);
    }
    return;
  }
  d.chListAt = now;
  const list = await listChannels(room.state.mapId);
  if (!room.clients.getById(c.sessionId)) return;
  c.send("channels", { cur: room.state.channel, list: list.map(({ ch, n, max, full }) => ({ ch, n, max, full })) });
}

/**
 * Đổi sang kênh `raw` của cùng bản đồ: kênh phải đang mở và còn chỗ; người chơi ngoài giao chiến, chưa gục, không hấp thụ, không
 * đang đi cổng, cách lần đổi trước CHANNEL_CD giây. Lưu đúng như đi cổng (beginTravel: một transaction nối vào chuỗi lưu, đích là
 * chính bản đồ này tại vị trí đang đứng); commit xong mới gửi `travel {mapId, roomId}` để client vào đúng phòng của kênh đó.
 * Đóng góp lên tinh anh / thú vương tính theo phiên nên không theo sang kênh mới.
 */
export async function switchChannel(room: MapRoom, c: Client, raw: unknown) {
  const id = c.sessionId, warn = (t: string) => room.log(id, t, "#ffb35c");
  const deny = () => {
    const p = room.state.players.get(id), d = room.pdata.get(id);
    if (!p || !d || d.travelling || d.travelCast) return "";
    if (p.dead) return "Đã gục ngã, không đổi kênh được.";
    if (d.absorbing) return "Đang hấp thụ hồn hoàn, không đổi kênh được.";
    if (d.fight < TEAM_COMBAT_SECS) return `Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới đổi kênh được.`;
    return null;
  };
  if (!room.state.channel) return warn("Ở đây không có kênh để đổi."); // sân đấu (7.2)
  let why = deny();
  if (why !== null) { if (why) warn(why); return; }
  const d = room.pdata.get(id)!, ch = intIn(raw);
  if (!Number.isInteger(ch) || ch < 1) return warn("Kênh không hợp lệ.");
  if (ch === room.state.channel) return warn(`Đang ở kênh ${ch}.`);
  const switchedAt = (await presenceBackend.getJson<number>(channelSwitchKey(d.accountId))) ?? channelSwitchAt.get(d.accountId) ?? 0;
  const left = switchedAt + CHANNEL_CD * 1000 - Date.now();
  if (left > 0) return warn(`Vừa đổi kênh: chờ ${Math.ceil(left / 1000)} giây nữa.`);
  const to = (await listChannels(room.state.mapId)).find((x) => x.ch === ch);
  // Trong lúc chờ danh sách, người chơi có thể đã rời, gục hay đã xin đổi kênh lần nữa: kiểm tra lại.
  if (room.pdata.get(id) !== d) return;
  why = deny();
  if (why !== null) { if (why) warn(why); return; }
  if (!to) return warn(`Kênh ${ch} không còn mở.`);
  if (to.full) return warn(`Kênh ${ch} đã đầy (${to.n}/${to.max}).`);
  const switched = Date.now(); channelSwitchAt.set(d.accountId, switched); bg(presenceBackend.putJson(channelSwitchKey(d.accountId), switched, CHANNEL_CD * 1000), "presence");
  const p = room.state.players.get(id)!;
  room.log(id, `Đang chuyển sang kênh ${ch}…`);
  room.beginTravel(id, { name: "", to: room.state.mapId, arrive: "", ax: p.x, ay: p.y, level: null, boat: false, x: 0, y: 0, w: 0, h: 0 }, to);
}
