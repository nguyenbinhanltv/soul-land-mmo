// Cộng minh, võ hồn sở hữu và đội hình (GAME_DESIGN.md mục 5.1, 5.10): tính tiến độ cộng minh (resCheck / sendRes / resonanceTop), tin riêng "vohons" / "squad", xếp đội hình, đổi võ hồn, cho võ hồn ra trận, lưu đội hình; tách khỏi MapRoom.ts (#702, bước 12).
// Hàm nhận phòng (`room: MapRoom`) như equip.ts / shop.ts / bag.ts; nguyên văn từ MapRoom, không đổi hành vi / thứ tự ghi DB qua `room.chain`.
// MapRoom chỉ chuyển tiếp (onMessage, tick, autoHunt.ts, gm.ts, các miền khác gọi `room.resCheck` / `room.activate` / `room.sendVohons` như cũ); `ArenaRoom` vẫn override `switchSlot`.

import type { Client } from "colyseus";
import { store, type Character } from "../db.ts";
import { VOHON, tierOfYears, vohonIndex, TEAM_SIZE, SWITCH_CD, TEAM_COMBAT_SECS, TIEN_CO_MAX, parseTeam, loadoutOf, BONE_ITEM, CORE_ITEM, CORE_SETS, CORE_FX_RULE, coreFx, coreSetIndex,
  SHARD_UNLOCK, MAX_STARS, starCost, shardCode,
  RESONANCE, RESONANCE_RANK_PAGE_SIZE, RESONANCE_RANK_PAGE_MAX, RESONANCE_RANK_CD, resonanceProgress, resonanceLevels, resonanceBonus, resonanceText } from "../../../shared/data.ts";
import { itemStacks } from "./items.ts";
import type { PlayerState } from "./schema.ts";
import { type MapRoom } from "./MapRoom.ts";
import type { PData } from "./types.ts";
import { fusionCdLeft } from "./procState.ts";
import { intIn, CLAIM_BUSY, claimHeld } from "./common.ts";

/**
 * Cộng minh (bước 8.2, mục 5.10): tính lại tiến độ 5 trụ cột từ dữ liệu sẵn có của tài khoản (mọi võ hồn sở hữu: cấp, số hồn
 * hoàn; hồn cốt / hồn hạch đang gắn trên võ hồn của mình). Võ hồn ra trận đọc tiến độ đang chơi (p.level, d.ringYears). Số mốc
 * đổi thì tính lại chỉ số võ hồn ra trận (võ hồn khác tính khi cần qua maxHpOf / calcStats nên đổi vào sau cũng đúng), gửi lại
 * sinh lực đội; `announce` thì báo từng mốc mới đạt (log + `ev` trong tin riêng "resonance") và mốc bị mất (tháo đồ). Tiến độ đổi
 * thì gửi lại tin "resonance". Gọi khi nạp tài khoản và sau mọi thay đổi liên quan: lên cấp (ra trận / trong đội), hấp thụ, mở
 * võ hồn, gắn / tháo / cường hóa / nâng cấp đồ đang gắn (afterBones), hook test.
 */
export function resCheck(room: MapRoom, id: string, announce = true) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  const mine = new Set(d.owned.map((v) => v.rowId)), worn = d.bag.filter((i) => i.vohonId !== null && mine.has(i.vohonId));
  const prog = resonanceProgress({
    vohons: d.owned.map((v) => (v === d.ch ? { level: p.level, rings: d.ringYears.length, stars: v.stars } : { level: v.level, rings: v.rings.length, stars: v.stars })),
    bones: worn.filter((i) => i.code === BONE_ITEM).map((i) => ({ enhance: i.enhance })),
    cores: worn.filter((i) => i.code === CORE_ITEM).map((i) => ({ stars: i.stars ?? 1 })) });
  const lv = resonanceLevels(prog), old = d.res.lv, changed = lv.some((x, i) => x !== (old[i] ?? 0));
  d.res = { prog, lv, bonus: resonanceBonus(lv) };
  const ev: { pillar: number; step: number; up: boolean }[] = [];
  if (changed) {
    if (d.hpF > 0) { room.recalc(id, false); room.sendSquad(id, true); } // lúc vào phòng (chưa có sinh lực) onJoin tự recalc
    if (announce) RESONANCE.forEach((r, i) => {
      const a = old[i] ?? 0, b = lv[i];
      for (let s = a; s < b; s++) {
        ev.push({ pillar: i, step: s, up: true });
        room.log(id, `Cộng minh ${r.name} đạt mốc ${s + 1}/${r.steps.length} (${r.steps[s].need} ${r.what}): mọi võ hồn ${resonanceText(r.steps[s].bonus)}.`, r.col);
      }
      if (b < a) {
        ev.push({ pillar: i, step: b, up: false });
        room.log(id, `Cộng minh ${r.name} còn ${b}/${r.steps.length} mốc (${prog[i]} ${r.what}): mất phần cộng của mốc ${b + 1}${a - b > 1 ? `–${a}` : ""}.`, "#ffb35c");
      }
    });
  }
  room.sendRes(id, ev);
}

/** Tin riêng "resonance" (8.2): tiến độ, số mốc đã đạt từng trụ cột, tổng % đang cộng; chỉ gửi khi đổi, có `ev` hoặc `force`. */
export function sendRes(room: MapRoom, id: string, ev: { pillar: number; step: number; up: boolean }[] = [], force = false) {
  const d = room.pdata.get(id); if (!d) return;
  const msg = { prog: d.res.prog, lv: d.res.lv, bonus: d.res.bonus }, key = JSON.stringify(msg);
  if (!force && !ev.length && key === d.resKey) return;
  d.resKey = key;
  room.clients.getById(id)?.send("resonance", ev.length ? { ...msg, ev } : msg);
}

/** Tin riêng "resonanceTop": xếp hạng công khai chỉ có tên hiển thị / điểm; chi tiết tiến độ và hiệu ứng chỉ trả ở `me`. */
export function resonanceTop(room: MapRoom, id: string, rawPage: unknown, rawPageSize: unknown) {
  const d = room.pdata.get(id); if (!d) return;
  const now = Date.now(); if (now - d.resonanceTopAt < RESONANCE_RANK_CD * 1000) return;
  d.resonanceTopAt = now;
  const page = Math.max(1, intIn(rawPage) || 1);
  const pageSize = Math.max(1, Math.min(RESONANCE_RANK_PAGE_MAX, intIn(rawPageSize) || RESONANCE_RANK_PAGE_SIZE));
  store.resonanceTop(page, pageSize, d.accountId).then((t) => {
    room.clients.getById(id)?.send("resonanceTop", {
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
export function sendVohons(room: MapRoom, c: Client) {
  const d = room.pdata.get(c.sessionId); if (!d) return;
  room.syncCh(c.sessionId);
  const fcd = Math.round(fusionCdLeft(d.accountId) * 10) / 10;
  c.send("vohons", { active: d.ch.rowId, team: [...d.team],
    list: d.owned.map((v) => ({ rowId: v.rowId, vohon: v.vohon, level: v.level, xp: v.xp, stars: v.stars, rings: [...v.rings],
      skills: loadoutOf(v.vohon, v.skills), herbs: { ...v.herbs } })), ...(fcd > 0 ? { fcd } : {}) });
  room.sendSquad(c.sessionId, true);
}

/**
 * Tin riêng "squad": sinh lực từng võ hồn trong đội, võ hồn đã gục và số giây còn lại trước khi hồi, năng lượng tiên cơ `en`,
 * có đang giao chiến không (đồng hồ hồi chỉ chạy ngoài trận). Chỉ gửi khi nội dung đổi (`force` thì gửi luôn); tick kiểm tra định kỳ.
 */
export function sendSquad(room: MapRoom, id: string, force = false) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  const list = d.team.flatMap((r) => {
    const v = d.owned.find((o) => o.rowId === r); if (!v) return [];
    const maxHp = v === d.ch ? p.maxHp : room.maxHpOf(d, v), down = d.down.get(r);
    const hp = v === d.ch ? p.hp : down !== undefined ? 0 : Math.ceil(Math.min(maxHp, d.benchHp.get(r) ?? maxHp));
    return [{ rowId: r, hp, maxHp, down: down !== undefined ? Math.max(1, Math.ceil(down)) : 0, en: Math.floor(d.energy.get(r) ?? 0) }];
  });
  const msg = { combat: d.fight < TEAM_COMBAT_SECS, list }, key = JSON.stringify(msg);
  if (!force && key === d.squadKey) return;
  d.squadKey = key;
  room.clients.getById(id)?.send("squad", msg);
}

/** Xếp đội hình (thay võ hồn khác vào đội, đổi chỗ, bỏ ra): chỉ khi ngoài giao chiến. Client gửi đủ TEAM_SIZE ô. */
export function setTeam(room: MapRoom, c: Client, slots: unknown) {
  const id = c.sessionId, p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  // Từ chối thì gửi lại đội hình đang lưu để client bỏ thay đổi vừa làm.
  const deny = (text: string) => { room.log(id, text, "#ffb35c"); room.sendVohons(c); };
  const team = parseTeam(slots);
  if (!team) return deny("Đội hình không hợp lệ.");
  if (team.some((r) => r && !d.owned.some((v) => v.rowId === r))) return deny("Bạn không sở hữu võ hồn này.");
  if (team.every((r, i) => r === d.team[i])) return room.sendVohons(c);
  if (p.dead) return deny("Đã gục ngã, không thể đổi đội hình.");
  if (d.absorbing) return deny("Đang hấp thụ hồn hoàn, không thể đổi đội hình.");
  if (d.fight < TEAM_COMBAT_SECS) return deny(`Đang giao chiến: rời xa hồn thú ${TEAM_COMBAT_SECS} giây rồi mới đổi đội hình được.`);
  // Võ hồn ra trận bị bỏ khỏi đội thì võ hồn chưa gục ở ô đầu tiên còn lại ra trận.
  const nextId = team.includes(d.ch.rowId) ? d.ch.rowId : team.find((r) => r > 0 && !d.down.has(r));
  if (!nextId) return deny("Đội phải còn ít nhất một võ hồn chưa gục.");
  d.team = team;
  for (const r of d.energy.keys()) if (!team.includes(r)) d.energy.delete(r); // rời đội thì mất năng lượng tiên cơ
  if (nextId !== d.ch.rowId) room.activate(id, d.owned.find((v) => v.rowId === nextId)!);
  room.persistTeam(d);
  room.sendVohons(c);
}

/** Đổi sang võ hồn ở ô `slot` của đội, được cả khi đang đánh (mục 5.1 "Trong trận"); mỗi lần đổi hồi SWITCH_CD giây. */
export function switchSlot(room: MapRoom, c: Client, slot: number) {
  const id = c.sessionId, p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d || d.travelling || !(Number.isInteger(slot) && slot >= 0 && slot < TEAM_SIZE)) return;
  const next = d.owned.find((v) => v.rowId === d.team[slot]);
  if (!next) return room.log(id, `Ô ${slot + 1} của đội đang trống. Nhấn V để xếp đội hình.`, "#ffb35c");
  if (next === d.ch) return;
  if (p.dead) return room.log(id, "Đã gục ngã, không thể đổi võ hồn.", "#ffb35c");
  if (d.absorbing) return room.log(id, "Đang hấp thụ hồn hoàn, không thể đổi võ hồn.", "#ffb35c");
  const down = d.down.get(next.rowId);
  if (down !== undefined) return room.log(id, `${VOHON[Math.max(0, vohonIndex(next.vohon))].name} đã gục: hồi lại sau ${Math.ceil(down)} giây ngoài trận hoặc khi về doanh trại.`, "#ffb35c");
  if (p.swCd > 0) return; // client hiện hồi chiêu đổi trên thanh đội hình
  room.activate(id, next);
  p.swCd = SWITCH_CD;
  if (d.fight < TEAM_COMBAT_SECS) room.questEvent(id, { k: "switch" }); // 6.2: đổi tay khi đang giao chiến
  // Bộ hồn hạch Lưu Ly 4 món (5.2): đổi tay võ hồn mang bộ vào thì cả đội tăng công (hiệu ứng có lợi của hồn sư) một lúc.
  // Đọc lại bộ của võ hồn vừa vào trận để hiệu ứng vẫn đúng ngay cả khi recalc trước đó chưa cập nhật cache coreFx.
  const sa = coreFx(room.coresOn(d, next.rowId)).swapAtk;
  if (sa) {
    const cur = d.buffs.get("atk"), col = CORE_SETS[coreSetIndex("luu_ly")].col;
    d.buffs.set("atk", { t: Math.max(cur?.t ?? 0, CORE_FX_RULE.swapSecs), v: Math.max(cur?.v ?? 0, sa) });
    room.syncBuffs(p, d); room.broadcast("fx", { k: "buff", id, col });
    room.log(id, `Bộ Lưu Ly: cả đội tăng ${Math.round(sa * 100)}% công trong ${CORE_FX_RULE.swapSecs} giây.`, col);
    if (!room.map.inSafe(p.x, p.y)) room.partyShare(id, { buff: { atk: sa }, secs: CORE_FX_RULE.swapSecs }, 1, 1, col, d.ch.vohon);
  }
  // Đủ năng lượng thì tung chiêu tiên cơ ngay lúc xuất hiện (chỉ khi đổi tay; tự đổi lúc gục thì giữ năng lượng).
  // Vùng an toàn không giao chiến (mục 5.3): đổi vẫn được nhưng không tung, giữ năng lượng.
  if ((d.energy.get(next.rowId) ?? 0) >= TIEN_CO_MAX) {
    if (room.map.inSafe(p.x, p.y)) room.log(id, "Vùng an toàn: không tung tiên cơ.", "#ffb35c");
    else { d.energy.set(next.rowId, 0); room.tienCo(id); }
  }
  room.persistTeam(d);
  room.sendVohons(c);
}

/**
 * Cho võ hồn `next` (trong đội, chưa gục) ra trận: đổi chỉ số, hồn hoàn, phụ thể hiển thị; lưu tiến độ võ hồn vừa rút về.
 * Từ 2.3b mỗi võ hồn giữ sinh lực riêng. Hồn lực thuộc về hồn sư (thiết kế chưa tách theo võ hồn) nên vẫn giữ tỉ lệ như bước 2.2.
 * `text`: thông báo thay câu mặc định.
 */
export function activate(room: MapRoom, id: string, next: Character, text?: string) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!;
  room.syncCh(id);
  room.endAva(id, ""); // đổi võ hồn (cả khi tự đổi lúc gục) thì Võ Hồn Chân Thân của võ hồn cũ hết (8.1a)
  const prev = d.ch, mpR = d.mpF / Math.max(1, p.maxMp);
  if (d.down.has(prev.rowId)) d.benchHp.delete(prev.rowId); else d.benchHp.set(prev.rowId, d.hpF);
  d.ch = next; d.ringYears = [...next.rings]; d.dirty.delete(next.rowId);
  room.showVohon(p, next);
  room.carrySkillCds(p, d); // 8.1a: hồn kỹ của võ hồn vào trận vẫn giữ hồi chiêu còn lại của nó
  room.recalc(id, false);
  d.hpF = Math.min(p.maxHp, d.benchHp.get(next.rowId) ?? p.maxHp); d.benchHp.delete(next.rowId);
  d.mpF = mpR * p.maxMp; room.recalc(id, false);
  room.broadcast("fx", { k: "wave", x: p.x, y: p.y - 6, r: 34, col: VOHON[p.vh].col });
  room.log(id, text ?? `${VOHON[p.vh].name} ra trận (cấp ${p.level}, ${p.rings.length} hồn hoàn).`, VOHON[p.vh].col);
  const old = { ...prev, rings: [...prev.rings] };
  room.chainLatest(d, `ch:${old.rowId}`, () => store.saveCharacter(old)); // đổi qua lại dồn dập (đội hình): ghi một lần, bản mới nhất
}

/** Lưu đội hình cùng võ hồn ra trận qua chuỗi lưu. Đổi dồn dập thì không ghi chồng: đã có một lần chờ thì lần đó ghi bản mới nhất. */
export function persistTeam(room: MapRoom, d: PData) {
  if (d.teamQueued) return;
  d.teamQueued = true;
  room.chain(d, async () => {
    d.teamQueued = false;
    const ok = await store.saveTeam(d.accountId, [...d.team], d.ch.rowId);
    if (!ok) console.error(`Đội hình của tài khoản #${d.accountId} không hợp lệ, không lưu:`, d.team, d.ch.rowId);
  });
}

/**
 * Mở võ hồn `raw` (mã trong VOHON) bằng SHARD_UNLOCK mảnh (mục 5.1): chỉ võ hồn chưa sở hữu. Trừ mảnh ngay (bấm hai lần không
 * tiêu hai lần), rồi trong chuỗi lưu ghi võ hồn mới (cấp 1, 1 sao) và cả túi đồ trong một transaction (store.unlockVohon).
 * DB lỗi hoặc tài khoản đã có võ hồn này thì trả lại mảnh.
 */
export function unlockVohon(room: MapRoom, id: string, raw: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  const vohon = typeof raw === "string" ? raw : "", vi = vohonIndex(vohon);
  if (vi < 0) return warn("Võ hồn không tồn tại.");
  const name = VOHON[vi].name, code = shardCode(vohon);
  if (d.owned.some((v) => v.vohon === vohon)) return warn(`Đã sở hữu ${name}: dùng mảnh để lên sao.`);
  if (d.shardBusy) return warn("Đang mở võ hồn, đợi một chút.");
  if (claimHeld(d)) return warn(CLAIM_BUSY); // #282: mảnh vừa đổi ở Thương hội còn chờ DB xác nhận lượt, chưa tiêu được
  const have = room.shardCount(d, code);
  if (have < SHARD_UNLOCK) return warn(`Cần ${SHARD_UNLOCK} Mảnh ${name} để mở, mới có ${have}.`);
  room.takeShards(d, code, SHARD_UNLOCK);
  d.shardBusy = true;
  room.sendBag(id);
  // Không mở được thì trả mảnh, kể cả khi túi vừa đầy (không bao giờ mất đồ; ô thêm có thể tạm vượt số ô túi).
  const refund = () => {
    const left = SHARD_UNLOCK - room.addItem(d, code, SHARD_UNLOCK);
    if (left > 0) d.bag.push(...itemStacks(code, left));
    d.bagDirty = true;
  };
  room.chain(d, async () => {
    let v: Character | null;
    try { v = await store.unlockVohon(d.accountId, p.name, vohon, 1, room.bagSnapshot(d)); }
    catch (e) { refund(); throw e; }
    if (!v) { refund(); return; }
    d.owned.push(v);
    room.log(id, `Mở võ hồn ${name}! Đã vào bộ sưu tập (cấp 1, 1★): xếp vào đội ở bảng đội hình (phím V).`, VOHON[vi].col);
    room.broadcast("chat", { sys: true, name: "Hệ thống", text: `${p.name} đã mở võ hồn ${name} bằng ${SHARD_UNLOCK} mảnh.` });
  }).then(() => {
    d.shardBusy = false;
    if (room.pdata.get(id) !== d) return;
    if (!d.owned.some((v) => v.vohon === vohon)) warn(`Chưa mở được ${name}, mảnh đã trả lại túi đồ.`);
    else room.resCheck(id); // cộng minh (8.2): võ hồn mới cũng nhận phần cộng
    const c = room.clients.getById(id); if (c) room.sendVohons(c);
    room.sendBag(id);
  });
}

/**
 * Lên sao võ hồn `raw` (mã trong VOHON) đã sở hữu bằng mảnh theo STAR_COST (mục 5.1), tối đa MAX_STARS. Mỗi sao tăng chỉ số
 * gốc (starMult trong calcStats). Đổi trong bộ nhớ ngay, rồi trong chuỗi lưu ghi võ hồn và cả túi đồ trong một transaction
 * (store.saveVohonsBag); lỗi thì đánh dấu lại để lần lưu sau ghi tiếp. Hiệu ứng hồn kỹ theo sao để bước sau.
 */
export function starUp(room: MapRoom, id: string, raw: unknown) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const warn = (text: string) => room.log(id, text, "#ffb35c");
  const vohon = typeof raw === "string" ? raw : "", vi = vohonIndex(vohon), v = d.owned.find((x) => x.vohon === vohon);
  if (vi < 0) return warn("Võ hồn không tồn tại.");
  const name = VOHON[vi].name, code = shardCode(vohon);
  if (!v) return warn(`Chưa sở hữu ${name}: đủ ${SHARD_UNLOCK} mảnh thì mở trước.`);
  if (claimHeld(d)) return warn(CLAIM_BUSY); // #282: như mở võ hồn
  const cost = starCost(v.stars);
  if (cost === null) return warn(`${name} đã đạt ${MAX_STARS}★, không lên sao thêm được.`);
  const have = room.shardCount(d, code);
  if (have < cost) return warn(`Cần ${cost} Mảnh ${name} để lên ${v.stars + 1}★, mới có ${have}.`);
  room.takeShards(d, code, cost);
  v.stars++;
  room.resCheck(id); // cộng minh (8.2): mốc Sao phải cập nhật ngay theo đường starup thật
  if (v === d.ch) room.recalc(id, false); else d.dirty.add(v.rowId);
  room.log(id, `${name} lên ${v.stars}★! Chỉ số gốc tăng.`, VOHON[vi].col);
  const c = room.clients.getById(id); if (c) room.sendVohons(c);
  room.sendBag(id);
  room.chain(d, async () => {
    const list = room.unsaved(id), bag = room.bagSnapshot(d);
    if (!list.some((x) => x.rowId === v.rowId)) list.push({ ...v, rings: [...v.rings] });
    try { await store.saveVohonsBag(d.accountId, list, bag); }
    catch (e) { for (const x of list) if (x.rowId !== d.ch.rowId) d.dirty.add(x.rowId); d.bagDirty = true; throw e; }
  });
}

/** Hiện võ hồn `ch` lên trạng thái đồng bộ (người khác thấy võ hồn ra trận, cấp, hồn hoàn). */
export function showVohon(p: PlayerState, ch: Character) {
  p.vh = Math.max(0, vohonIndex(ch.vohon)); p.level = ch.level; p.xp = ch.xp; p.kills = ch.kills;
  p.rings.clear(); ch.rings.forEach((y) => p.rings.push(tierOfYears(y)));
}

/** Chép tiến độ đang chơi vào võ hồn ra trận (d.ch). */
export function syncCh(room: MapRoom, id: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  Object.assign(d.ch, { level: p.level, xp: p.xp, rings: [...d.ringYears], kills: p.kills });
}
