// Vòng tick của phòng bản đồ (GAME_DESIGN.md mục 5.1, 5.4, 11.1, 11.4), tách khỏi MapRoom.ts (#702, bước 19): `tick` (thứ tự các bước: kênh / lease / ngày /
// tổ đội / việc hẹn giờ, người chơi, hồn thú, vùng lưu lại / đạn / trứng / đồ rơi, hồi sinh hồn thú / tinh anh, bản đồ nhỏ, sương mù, lưu định kỳ),
// `moveBeast` và `perfLog` (PERF_LOG=1). Hàm nhận phòng (`room: MapRoom`) như combat.ts; nguyên văn từ MapRoom, không đổi số / thứ tự RNG / thứ tự xử lý trong tick.
// MapRoom chỉ chuyển tiếp 3 hàm (`setSimulationInterval` trong `setup` gọi `tick` / `perfLog`; `ArenaRoom.tick` vẫn gọi `super.tick`).
import { TIERS, STATUS, ARENA, BEAST_REGEN, BEAST_LEASH, BEAST_GAIT, BEAST_AGGRO_R, BEAST_ATK_CD, BEAST_WANDER, ELITE, ELITE_RAGE, TELE_FIRST, SLOW_CAP,
  RUN_MULT, dir4, TEAM_COMBAT_SECS, PLAYER_CHARM, SYNC_VIEW, FOG, moveNudge, atkRoll, beastMelee, RESPAWN_INVULN_SECS } from "../../../shared/data.ts";
import { MOVE_DEAD, PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { PRESENCE_HEARTBEAT_MS, PRESENCE_TTL_MS, presenceBackend, accountLeaseKey } from "../presence.ts";
import { touchChannel, type MapRoom } from "./MapRoom.ts";
import * as party from "../party.ts";
import { gcIn, cpuMs, clock } from "../perf.ts";
import { setLock, tickLock } from "./lock.ts";
import { sendVitals } from "./vitals.ts";
import { savePeriodic } from "./persist.ts";
import { SAVE_EVERY_SECS } from "../../../shared/data.ts";
import type { BeastState, PlayerState } from "./schema.ts";

/** PERF_LOG=1 (#273): nhịp chậm khi từ đầu tick tới hết bản vá quá ngần này ms (= một nhịp TICK_RATE), hoặc từ đầu nhịp trước quá PERF_GAP_MS. */
const PERF_SLOW_MS = 50, PERF_GAP_MS = 100;

/**
 * PERF_LOG=1: cộng dồn thời gian tick / bản vá, mỗi 10 giây một dòng `[perf]`. Nhịp chậm (#273): thời gian thật từ đầu tick tới hết bản
 * vá vượt PERF_SLOW_MS, hoặc nhịp bắt đầu trễ (từ đầu nhịp trước quá PERF_GAP_MS) thì in `[perf-slow]` ở nhịp sau: từng đoạn của tick,
 * CPU luồng chính trong nhịp (gần bằng thời gian thật = server bận; nhỏ hơn nhiều = hệ điều hành cắt luồng), GC chồng lên nhịp, và
 * khoảng giữa hai nhịp (CPU ngoài tick: tin nhắn, chuỗi lưu, phòng khác). Dòng `[perf]` thêm số nhịp chậm trong 10 giây.
 */
export function perfLog(room: MapRoom, t0: number, t1: number, t2: number, c0: number, ti: number) {
  const f = room.perf, c2 = cpuMs(), pv = room.perfPrev, T = room.perfT;
  f.n++; f.tick += t1 - t0; f.patch += t2 - t1; f.max = Math.max(f.max, t2 - t0);
  const a = room.perfAll; a.n++; a.tick += t1 - t0; a.patch += t2 - t1; a.max = Math.max(a.max, t2 - t0);
  // In nhịp chậm của các nhịp trước (bản ghi GC đã tới).
  for (const s of room.perfPend.splice(0)) {
    const g = gcIn(s.t0, s.t2), gg = gcIn(s.t0 - s.gap, s.t0);
    console.log(`[perf-slow] ${room.state.mapId}#${room.state.channel} ${s.at} wall ${s.wall.toFixed(1)} ms, cpu ${s.cpu.toFixed(1)} ms, ` +
      `gc ${g.ms.toFixed(1)} ms${g.kinds.length ? ` (${g.kinds.join("+")})` : ""} | ${s.parts} | gap ${s.gap.toFixed(1)} ms, cpu ngoài tick ${s.gapCpu.toFixed(1)} ms, ` +
      `gc ngoài tick ${gg.ms.toFixed(1)} ms | players ${room.state.players.size}, beasts ${room.state.beasts.size}`);
  }
  const wall = t2 - t0, gap = pv.t0 ? t0 - pv.t0 : 0;
  if (wall > PERF_SLOW_MS || gap > PERF_GAP_MS) {
    room.perfSlowN++;
    const d = (i: number) => (T[i + 1] - T[i]).toFixed(1);
    const A = room.perfAuto, top = A.slice().sort((x, y) => y[1] - x[1]).slice(0, 3).map(([i, ms]) => `${i.slice(0, 4)} ${ms.toFixed(1)}`).join(", ");
    const plans = room.perfPlan.map(([i, ms, w]) => `${i.slice(0, 4)} ${ms.toFixed(1)} ms ${w}`).join(", ");
    room.perfPend.push({ at: clock(), t0, t2, wall, cpu: c2 - c0, gap, gapCpu: pv.t2 ? c0 - pv.c2 : 0,
      parts: `auto ${A.length} người ${A.reduce((a, x) => a + x[1], 0).toFixed(1)} ms (lớn nhất ${top || "-"}), tìm đường ${room.perfPlan.length} lần (${plans || "-"}) | ` +
      `tick ${(ti - t0).toFixed(1)} (đầu ${d(0)}, người ${d(1)}, thú ${d(2)}, thế giới ${d(3)}, cuối ${d(4)}), view ${(t1 - ti).toFixed(1)}, vá ${(t2 - t1).toFixed(1)}` });
  }
  Object.assign(pv, { t0, t2, c2 });
  if (Date.now() - f.at < 10000) return;
  let awake = 0; room.state.beasts.forEach((b) => { if (room.interest.awake(b.x, b.y)) awake++; });
  console.log(`[perf] ${room.state.mapId}#${room.state.channel} tick ${(f.tick / f.n).toFixed(3)} ms, patch ${(f.patch / f.n).toFixed(3)} ms, ` +
    `max ${f.max.toFixed(2)} ms, slow ${room.perfSlowN}, beasts ${room.state.beasts.size} (awake ${awake}), players ${room.state.players.size}`);
  const sv = room.perfSave;
  if (sv.n) { console.log(`[perf-save] ${room.state.mapId}#${room.state.channel} ${sv.n} lần lưu, chụp túi ${sv.snap.toFixed(1)} ms, ghi DB (đồng bộ) ${sv.store.toFixed(1)} ms, ${sv.items} món`); Object.assign(sv, { n: 0, snap: 0, store: 0, items: 0 }); }
  Object.assign(f, { n: 0, tick: 0, patch: 0, max: 0, at: Date.now() }); room.perfSlowN = 0;
}

/** Bộ đệm khóa hồn thú dùng chung (tick chạy đồng bộ, không lồng nhau). */
const BEAST_IDS: string[] = [];

export function tick(room: MapRoom, dt: number) {
  if (room.state.channel && (room.channelT -= dt * 1000) <= 0) {
    room.channelT = PRESENCE_HEARTBEAT_MS;
    void touchChannel(room.state.mapId, room.roomId, room.state.channel).catch((e) => console.error("Không gia hạn được kênh", e));
  }
  // Lease tài khoản có TTL: tiến trình chết không để khóa vĩnh viễn; mất Redis thì đóng phiên để tránh split-brain.
  for (const [id, d] of room.pdata) {
    d.leaseT -= dt * 1000;
    if (d.leaseT > 0) continue;
    d.leaseT = PRESENCE_HEARTBEAT_MS;
    void presenceBackend.renewLease(accountLeaseKey(d.accountId), d.leaseOwner, PRESENCE_TTL_MS).then((ok) => {
      if (!ok) room.clients.getById(id)?.leave(4001);
    }).catch((e) => { console.error(`Không gia hạn được phiên giữ tài khoản #${d.accountId}`, e); room.clients.getById(id)?.leave(1011); });
  }
  const pt = room.perfOn ? room.perfT : null; // #273: mốc đoạn của tick (PERF_LOG=1)
  if (pt) { pt[0] = performance.now(); room.perfAuto.length = 0; room.perfPlan.length = 0; }
  // Khảo hạch hằng ngày: qua 00:00 giờ Việt Nam thì mỗi giây kiểm tra một lần, đặt lại bộ bài và báo người đang chơi.
  if ((room.dayT -= dt) <= 0) {
    room.dayT = 1;
    const day = room.dailyDay();
    for (const [id, d] of room.pdata) if (!d.travelling && room.dailyFresh(d, day)) room.sendDaily(id, "reset");
    for (const [id, d] of room.pdata) if (!d.travelling && room.tongFresh(d, day)) room.sendTong(id); // tông vụ (#197)
  }
  // Tổ đội (7.1): mỗi 0,5 giây ghi cấp / sinh lực vào party.ts (đồng đội ở bản đồ khác cũng thấy), gửi lại khung tổ đội khi đổi,
  // dọn lời mời hết hạn và người rời game quá lâu.
  room.partyT -= dt;
  if (room.partyT <= 0) {
    room.partyT = 0.5;
    for (const [id, d] of room.pdata) {
      const p = room.state.players.get(id);
      if (p && !d.travelling) party.setLive(d.accountId, id, { level: p.level, vh: p.vh, hp: p.hp, maxHp: p.maxHp, dead: p.dead });
    }
    room.partyPublish(party.sweep(Date.now()));
    for (const id of room.pdata.keys()) room.sendParty(id);
  }
  // việc hẹn giờ (các nhát của hồn kỹ liên hoàn)
  if (room.timers.length) {
    const due: (() => void)[] = [];
    room.timers = room.timers.filter((t) => { t.t -= dt; if (t.t > 0) return true; due.push(t.fn); return false; });
    for (const fn of due) fn();
  }
  if (pt) pt[1] = performance.now();

  // người chơi
  room.state.players.forEach((p, id) => {
    const d = room.pdata.get(id)!;
    d.atkCd -= dt; d.inv -= dt; d.lastHit += dt; d.fight += dt;
    d.haste -= dt; d.shockMpCd -= dt; d.comboT += dt; // hiệu ứng bộ hồn hạch (5.2)
    for (let i = 0; i < 4; i++) if (p.cds[i] > 0) p.cds[i] = Math.max(0, p.cds[i] - dt);
    if (p.ctCd > 0) p.ctCd = Math.max(0, p.ctCd - dt); // hồn kỹ Chân Thân (9.6)
    if (d.ava || d.avaCd.size) room.tickAva(id, dt);
    if (d.fus) room.tickFusion(id, dt); // lời mời Võ Hồn Dung Hợp Kỹ đang chờ (#192)
    for (const [k, t] of d.skCd) if (t - dt <= 0) d.skCd.delete(k); else d.skCd.set(k, t - dt);
    for (let i = 0; i < p.bcds.length; i++) if (p.bcds[i] > 0) p.bcds[i] = Math.max(0, p.bcds[i] - dt);
    if (p.swCd > 0) p.swCd = Math.max(0, p.swCd - dt);
    if (Math.hypot(d.input.x, d.input.y) > MOVE_DEAD) p.seqT += dt; // thời gian input cuối đã áp, kể cả lúc choáng / gục (mục 6)
    if (d.danCd > 0) d.danCd = Math.max(0, d.danCd - dt);
    if (d.shieldT > 0) { d.shieldT -= dt; if (d.shieldT <= 0) d.shield = 0; p.shield = Math.ceil(d.shield); }
    if (d.buffs.size) {
      for (const [b, x] of d.buffs) { x.t -= dt; if (x.t <= 0 || p.dead) d.buffs.delete(b); } // cả đội gục thì mất hiệu ứng có lợi
      room.syncBuffs(p, d);
    }
    if (d.travelling) { p.moving = false; return; } // đang chuyển bản đồ: đứng yên chờ client rời phòng
    room.tickPStatus(id, p, d, dt);
    // Tự bán từ xa (#216): túi vừa đổi (sendBag đặt cờ) thì xét một lần, không quét túi mỗi nhịp.
    if (d.sellCheck) { d.sellCheck = false; room.autoSell(id); room.autoSalvage(id); }
    if (p.dead) {
      if (d.target) setLock(room, id, d, "", false, "dead");
      d.deadT -= dt;
      if (d.deadT <= 0) {
        // Cả đội gục: về doanh trại, cả đội hồi đầy.
        const s = room.spawnPoint(); p.x = s.x; p.y = s.y; p.dead = false; d.inv = RESPAWN_INVULN_SECS;
        d.down.clear(); d.benchHp.clear(); room.recalc(id, true);
        room.log(id, "Đã về doanh trại, cả đội hồi phục.", "#86e0b0");
        room.sendSquad(id, true);
      }
      return;
    }
    // Tự săn (Auto 1): quyết định và đặt hướng đi như input của người chơi, trước bước di chuyển dưới đây.
    if (d.auto) { if (room.perfOn) { const t = performance.now(); d.auto.tick(dt); const ms = performance.now() - t; room.perfAll.auto += ms; room.perfAuto.push([id, ms]); } else d.auto.tick(dt); }
    // Choáng / Trói / Đóng băng (từ 3.5, do chiêu báo trước của hồn thú): không đi; Làm chậm giảm tốc. Mê hoặc (#116): bỏ qua phím,
    // server tự đi lung tung (charmDir).
    const ctl = room.pctl(d), cm = ctl.wander && !ctl.noMove ? room.charmDir(p, d, dt) : null;
    if (!ctl.wander) d.charm = null;
    const { x: ix, y: iy } = cm ?? (ctl.noMove || ctl.wander ? { x: 0, y: 0 } : d.input); const il = Math.hypot(ix, iy);
    // 11.1: ngoài giao chiến tự chạy (× RUN_MULT) trừ khi giữ Shift; giao chiến thì đi bộ. Tăng tốc, Làm chậm vẫn nhân như cũ.
    p.calm = d.fight >= TEAM_COMBAT_SECS; p.walk = d.walk;
    const sp = cm ? d.speed * PLAYER_CHARM.spd * (1 - ctl.slow)
      : ctl.noMove ? 0 : d.speed * (1 + room.buffV(d, "spd")) * (1 - ctl.slow) * (p.calm && !d.walk ? RUN_MULT : 1);
    p.spd = cm ? 0 : sp; // client dự đoán chuyển động bằng đúng tốc độ này; đang Mê hoặc thì không dự đoán (server tự đi)
    p.moving = il > MOVE_DEAD;
    if (p.moving) {
      if (d.absorbing) room.cancelAbsorb(id, "Di chuyển: đã hủy hấp thụ, hồn hoàn vẫn còn trong túi.");
      room.map.moveEnt(p, ix * sp * dt, iy * sp * dt, PLAYER_HW, PLAYER_HH, moveNudge(!!d.auto));
      d.dir = { x: ix / il, y: iy / il };
      p.dir = dir4(ix, iy);
    }
    if (d.absorbing) { d.absorbing.t += dt; p.absorb = Math.min(0.999, d.absorbing.t / d.absorbing.dur); if (d.absorbing.t >= d.absorbing.dur) room.finishAbsorb(id); }
    if (d.target) tickLock(room, id, p, d); // khoá mục tiêu (M3 #750): trong tầm thì quay mặt, đánh thường theo hồi chiêu
    room.portalHint(id, p, d);
    room.waypointTick(id, p, d);
    if (d.travelCast?.wp) {
      const cast = d.travelCast, wp = cast.wp!;
      if (p.moving || Math.hypot(p.x - wp.x0, p.y - wp.y0) > 2) room.stopCast(id, "Di chuyển: đã hủy truyền tống.");
      else if ((cast.t -= dt) <= 0) { d.travelCast = null; room.finishRecall(id, cast.portal, wp); }
    } else if (d.travelCast) {
      const cast = d.travelCast;
      if (room.map.portalAt(p.x, p.y) !== cast.portal) { d.travelCast = null; room.log(id, "Đã rời cổng: hủy đi qua cổng."); }
      else if ((cast.t -= dt) <= 0) {
        d.travelCast = null;
        const why = room.travelDeny(id, cast.portal.name);
        if (why === null) room.beginTravel(id, cast.portal); else if (why) room.log(id, why, "#ffb35c");
      }
    }
    room.regenPlayer(p, d, dt);
    room.tickDowns(id, dt);
    room.tickEnergy(id, dt);
    d.squadT -= dt;
    if (d.squadT <= 0) { d.squadT = 0.5; room.sendSquad(id); }
  });

  if (pt) pt[2] = performance.now();
  // 11.4: lưới hồn sư theo vị trí mới, đánh dấu vùng hồn thú còn thức quanh mọi hồn sư.
  room.interest.beginTick();
  // hồn thú: trạng thái trước (sát thương theo thời gian có thể hạ hồn thú), rồi di chuyển và đánh
  // Bản chụp khóa (tickStatus có thể xóa hồn thú khi sát thương theo thời gian hạ nó): dùng lại một bộ đệm, không cấp phát mỗi nhịp.
  const bids = BEAST_IDS; bids.length = 0;
  for (const bid of room.state.beasts.keys()) bids.push(bid);
  for (let i = 0; i < bids.length; i++) room.tickStatus(bids[i], dt);
  bids.length = 0;
  room.state.beasts.forEach((b, id) => {
    const bd = room.bdata.get(id)!, td = TIERS[b.tier];
    // Bọc trứng (#162): không đi, không đánh, không hồi máu; đếm giờ nở ở eggs.tick. Không giữ mục tiêu / hung hăng sau khi bị đánh
    // (tự săn thấy bọc như hồn thú thường vừa bị đánh: `hitBy` / `calm` vẫn đếm như hồn thú khác).
    if (b.egg) { bd.calm += dt; bd.target = null; if (b.aggro) b.aggro = false; return; }
    bd.cd -= dt; bd.anim += dt; bd.calm += dt;
    // 11.4: hồn thú thường không mục tiêu, không đang về chỗ sinh / niệm chiêu / bị đẩy, cách mọi hồn sư quá SYNC_VIEW.wake thì ngủ:
    // không lang thang, không tìm mục tiêu (không ai trong tầm phát hiện), chỉ hồi máu và đếm hồi chiêu như khi thức.
    if (!bd.elite && !bd.target && !bd.ret && !bd.cast && !bd.kx && !bd.ky && !room.interest.awake(b.x, b.y)) {
      if (b.moving) b.moving = false;
      if (b.aggro) b.aggro = false;
      bd.skT -= dt; for (const s of bd.skills) s.cd -= dt;
      if (bd.calm > BEAST_REGEN.delay) room.regenBeast(b, bd, dt);
      return;
    }
    if (bd.elite) room.tickElite(id, b, bd, dt);
    if (!room.state.beasts.has(id)) return; // thú vương vừa rút đi (BĐ5)
    const king = bd.elite?.king;
    // Thú vương đang gầm chuyển giai đoạn (BĐ5): đứng yên, không đánh, không tung chiêu. Boss thế giới đang lặn (BĐ6e) cũng vậy.
    if (king?.roar || king?.world?.dive) { b.moving = false; bd.kx = 0; bd.ky = 0; return; }
    // Từ 2.5c: hồn thú đang chịu trạng thái `wander` (Mê hoặc) bỏ mục tiêu, đi lung tung.
    let charm = false;
    if (bd.st.size) for (const s of bd.st.keys()) if (STATUS[s].wander) { charm = true; break; }
    if (charm) bd.target = null;
    let tgt = bd.target ? room.state.players.get(bd.target) : undefined;
    // Không đuổi theo người đã vào vùng an toàn, đang chuyển bản đồ (mục 5.3, 6) hoặc đang tàng hình (Yêu Hồ, 2.5c).
    const off = (p: PlayerState, pid: string) => { const pd = room.pdata.get(pid); return p.dead || room.map.inSafe(p.x, p.y) || !!pd?.travelling || !!pd?.buffs.has("hide"); };
    // Thú vương (BĐ5) chỉ đuổi người trong hang và nhận mục tiêu là bất kỳ ai trong hang; hồn thú khác xa chỗ sinh quá BEAST_LEASH.r
    // thì bỏ mục tiêu và chạy về chỗ sinh (11.1); đang về thì không nhận mục tiêu, kể cả người vừa đánh nó.
    const far = !king && Math.hypot(b.x - bd.hx, b.y - bd.hy) > BEAST_LEASH.r;
    if (tgt && (off(tgt, bd.target!) || (king && !room.map.inLair(tgt.x, tgt.y)))) { bd.target = null; tgt = undefined; }
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
        if (!p || off(p, pid) || (king && !room.map.inLair(p.x, p.y))) return;
        const dd = Math.hypot(p.x - b.x, p.y - b.y); if (dd < best) { best = dd; bd.target = pid; tgt = p; }
      };
      // Thú vương xét mọi người trong hang; hồn thú khác chỉ xét hồn sư gần theo lưới không gian (11.4).
      if (king) room.state.players.forEach(look);
      else room.interest.players.nearEach(b.x, b.y, BEAST_AGGRO_R, (pid) => look(room.state.players.get(pid), pid));
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
    if (bd.ret > 0) { if (!bd.elite) room.regenBeast(b, bd, dt, BEAST_LEASH.heal); }
    else if (!tgt && bd.calm > BEAST_REGEN.delay && !bd.elite?.engaged) room.regenBeast(b, bd, dt);
    room.tickCast(id, b, bd, dt, noAtk || noSkill);
    if (stun) { bd.kx = 0; bd.ky = 0; b.moving = false; return; }
    if (noMove) { bd.kx = 0; bd.ky = 0; }
    if (bd.kx || bd.ky) { room.moveBeast(b, bd.kx * dt, bd.ky * dt, hw); bd.kx *= 0.85; bd.ky *= 0.85; if (Math.abs(bd.kx) < 2 && Math.abs(bd.ky) < 2) { bd.kx = 0; bd.ky = 0; } }
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
        const m = s.def.mark ? room.markTarget(b, bd, s.def.range) : s.def.weak ? room.markTarget(b, bd, s.def.range, true) ?? near : near;
        if (m) { room.beginCast(id, b, bd, s, m[0], m[1]); return; }
      }
      if (bd.rooted) { if (Math.abs(dx) > 1) b.face = dx > 0 ? 1 : -1; } // đứng yên: chỉ quay mặt về mục tiêu (#116)
      if (dd > beastMelee(b.tier, bd.rooted)) { if (!noMove && !bd.rooted) { mx = dx / dd; my = dy / dd; } }
      else if (bd.cd <= 0 && !noAtk) { bd.cd = BEAST_ATK_CD; b.atk = (b.atk + 1) & 255; room.hurtPlayer(bd.target!, room.beastDmg(bd) * atkRoll(Math.random())); }
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
    if (b.moving) { room.moveBeast(b, mx * sp * dt, my * sp * dt, hw); if (Math.abs(mx) > 0.1) b.face = mx > 0 ? 1 : -1; }
  });

  if (pt) pt[3] = performance.now();
  // #161: vùng lưu lại trên mặt đất (sau vòng hồn thú: vùng vừa để lại gây nhịp đầu ngay trong nhịp này).
  room.grounds.tick(dt);
  // #163: Cực Hàn tích tầng Hàn cho người tham gia trong hang, Hỏa Đàn xả tầng.
  room.cold.tick(dt);
  // #174: Thủy Triều Dâng dâng đợt nước mới (vùng có tác dụng từ nhịp sau, sau báo trước).
  room.tide.tick(dt);
  // #173: hang chia phần luân phiên đổi phần đang hóa (vùng có tác dụng sau báo trước).
  room.split.tick(dt);
  // 11.4: lưới hồn thú / đồ rơi theo vị trí sau khi di chuyển (đạn, hồn kỹ, lọc đồng bộ dùng tới nhịp sau).
  room.interest.syncEntities();
  // đạn hồn kỹ
  if (room.projs.length) room.projs = room.projs.filter((pr) => {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    if (pr.life <= 0 || room.map.hits(pr.x, pr.y + 6, 1, 1)) return false;
    for (const [bid, b] of room.beastsNear(pr.x, pr.y, 5))
      if (Math.hypot(b.x - pr.x, b.y - TIERS[b.tier].size / 2 - pr.y) < TIERS[b.tier].size / 2 + 5) { pr.fire(bid); return false; }
    if (pr.foe) for (const fid of room.foesOf(pr.owner)) {
      const f = room.state.players.get(fid);
      if (f && !f.dead && Math.hypot(f.x - pr.x, f.y - ARENA.body - pr.y) < ARENA.body + 5) { pr.foe(fid); return false; }
    }
    return true;
  });

  // #162: bọc trứng đếm giờ nở, hết giờ thì nở nhện con
  room.eggs.tick(dt);

  // hồn hoàn rơi dưới đất: hết DROP_TTL_SECS giây thì biến mất (từ 3.2 hấp thụ từ túi, không còn ai "đang hấp thụ" hồn hoàn dưới đất)
  room.state.drops.forEach((dr, id) => {
    dr.ttl -= dt; if (dr.ownerTtl > 0) dr.ownerTtl = Math.max(0, dr.ownerTtl - dt);
    if (dr.ttl <= 0) { room.state.drops.delete(id); room.coreDrops.delete(id); room.equipDrops.delete(id); }
  });

  if (pt) pt[4] = performance.now();
  // hồi sinh hồn thú
  room.spawnT -= dt;
  if (room.spawnT <= 0) {
    room.spawnT = 1.2;
    const { zones } = room.map, counts = zones.map(() => 0); room.bdata.forEach((b) => { if (!b.elite) counts[b.zone]++; }); // tinh anh không tính vào `count`
    zones.forEach((z, i) => { if (counts[i] < z.count) room.spawnBeast(i); });
  }

  // thú vương bị hook test `clear` xóa: coi như đã rời (không sinh lại trong cùng khung giờ)
  if (room.king?.bid && !room.state.beasts.has(room.king.bid)) room.king.bid = null;
  // tinh anh: bị hạ (hoặc bị hook test xóa) thì hồi sinh sau ELITE.respawn giây ngẫu nhiên, server không báo giờ (mục 5.4)
  room.elites.forEach((slot, i) => {
    if (slot.bid && !room.state.beasts.has(slot.bid)) { slot.bid = null; slot.t = ELITE.respawn[0] + Math.random() * (ELITE.respawn[1] - ELITE.respawn[0]); }
    if (!slot.bid && (slot.t -= dt) <= 0) room.spawnElite(i, true);
  });

  // bản đồ nhỏ (11.4): vị trí cả bản đồ, phòng sân đấu (không lọc) thì không cần
  if (!room.interest.all && (room.miniT -= dt) <= 0) { room.miniT = SYNC_VIEW.mini; room.sendMini(); }

  // sương mù khám phá (R8): đánh dấu ô quanh từng người theo nhịp FOG.markSecs, gửi phần mới theo nhịp FOG.sendSecs
  if (room.fogOn) {
    if ((room.fogT -= dt) <= 0) { room.fogT = FOG.markSecs; room.fogMark(); }
    if ((room.fogSendT -= dt) <= 0) { room.fogSendT = FOG.sendSecs; room.fogSend(); }
  }

  // tin riêng "vit" (#949): kinh nghiệm, hồn lực, hồi chiêu chỉ gửi cho chính chủ, sau khi mọi thay đổi của nhịp đã xong
  sendVitals(room);

  // lưu định kỳ (bỏ qua người đang chuyển bản đồ: transaction đi cổng là lần ghi cuối của phòng này cho người đó);
  // mỗi người một đồng hồ riêng (không dồn cả phòng một tick) và chỉ ghi khi có đổi (#1001, persist.savePeriodic)
  room.pdata.forEach((d, id) => { if ((d.saveIn -= dt) <= 0) { d.saveIn = SAVE_EVERY_SECS; if (!d.travelling) savePeriodic(room, id); } });
  if (pt) pt[5] = performance.now();
}

/** Hồn thú di chuyển nhưng không bước vào vùng an toàn. */
export function moveBeast(room: MapRoom, b: BeastState, dx: number, dy: number, hw: number) {
  const ox = b.x, oy = b.y;
  room.map.moveEnt(b, dx, dy, hw, 3);
  // Thú vương (BĐ5) không ra khỏi hang; boss thế giới (BĐ6e) không ra khỏi sàn đấu.
  if (room.map.inSafe(b.x, b.y) || (b.rank >= 2 && room.map.lair && !room.map.inLair(b.x, b.y))) { b.x = ox; b.y = oy; }
}
