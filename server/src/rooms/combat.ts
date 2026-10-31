// Chiến đấu cơ bản của người chơi (GAME_DESIGN.md mục 2, 5.1, 5.2, 5.9; docs/design/ky-nang-combat-phap-tuong.md), tách khỏi MapRoom.ts (#702, bước 18):
// đánh thường `attack`, hồn thú đánh hồn sư `hurtPlayer`, gục / hồi sinh `knockOut` / `revive`, hồn sư đánh hồn thú `damageBeast` và đánh đối thủ `damageFoe`.
// Hàm nhận phòng (`room: MapRoom`) như skill.ts; nguyên văn từ MapRoom, không đổi số / thứ tự RNG / thứ tự xử lý trong tick. MapRoom chỉ chuyển tiếp 6 hàm
// (`onMessage`, `tick`, `skill.ts`, `boss.ts`, `autoHunt.ts`, `gm.ts`, `ArenaRoom` gọi như cũ).
// Còn ở MapRoom: `killBeast`, `applyStatus` / `applyPStatus`, `chanThan` / `endAva` / `tickAva`, `selfEffect` / `partyShare`, tiên cơ (`tienCo`, `gainEnergy`), `buffV` / `atkOf`.
import { TIERS, BEAST_HALF, VOHON, vohonIndex, TEAM_SIZE, REVIVE_SECS, RESPAWN_SECS, PHONG_LOI, ATTACK_CD, ATTACK_REACH, atkRoll, CORE_FX_RULE, CORE_SETS, coreSetIndex,
  STATUS, ARENA, ARENA_HE_DMG, WORLD, defMult, HIT_INVULN_SECS } from "../../../shared/data.ts";
import type { Character } from "../db.ts";
import type { MapRoom, Hit, DmgOpt } from "./MapRoom.ts";

/**
 * Hồn thú gây `dmg` cho hồn sư `id`. Trả về true nếu đòn trúng (kể cả khiên đỡ hết), false nếu bị bỏ qua (vừa bị đánh, bất tử,
 * miễn sát thương, đang chuyển bản đồ). Từ 3.5: Dễ thương / Phá giáp trên hồn sư tăng sát thương nhận; `dot`: sát thương theo
 * thời gian (Trúng độc, Thiêu đốt: bỏ qua và không đặt khung bất tử 0,45 giây, không lan Cảm điện); đòn trực tiếp trúng hồn sư
 * Cảm điện thì lan STATUS.shock.chain sang hồn sư Cảm điện khác gần đó (`chain`: phần lan, không lan tiếp).
 */
export function hurtPlayer(room: MapRoom, id: string, dmg: number, o: { dot?: boolean; chain?: boolean; pvp?: { dealt: number }; crit?: boolean } = {}): boolean {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!, direct = !o.dot && !o.chain;
  if ((direct && d.inv > 0) || p.dead || d.travelling) return false; // trong vùng an toàn hồn thú đã bỏ mục tiêu (tick) nên không đánh tới
  if (d.travelCast) room.stopCast(id, d.travelCast.wp ? "Bị tấn công: đã hủy truyền tống." : "Bị tấn công: đã hủy đi qua cổng.");
  if (o.pvp) room.autoStop(id, "bị người chơi tấn công."); // tự săn (mục 5.13)
  // Miễn sát thương (Vô Địch Thần Quang): không mất gì nhưng vẫn tính là bị đánh (giao chiến), hiện chữ "Miễn".
  // Đòn của đối thủ (Đại Đấu Hồn Trường, `pvp`, 7.2) không đặt khung bất tử 0,45 giây (hồn kỹ nhiều nhát vẫn trúng đủ) và không lan Cảm điện;
  // bất tử do hồn kỹ / lúc vào sân vẫn chặn.
  if (room.buffV(d, "inv")) { d.fight = 0; if (direct && !o.pvp) d.inv = HIT_INVULN_SECS; room.broadcast("dmg", { x: p.x, y: p.y - 18, v: 0, c: "#fff2b0", id, immune: true }); return false; }
  // Tàng hình (đã chốt 2026-10-20): bị đòn trực tiếp đánh trúng thì hiện hình, kể cả khi khiên đỡ hết; đòn bị miễn ở trên thì không.
  if (direct) room.unhide(p, d);
  const raw = dmg, armor = d.st.get("armor"), poison = d.st.get("poison");
  // Bộ hồn hạch Xà Hoàng 4 món lên hồn sư (#277): Trúng độc đủ tầng do đối thủ mang bộ gây (src, chỉ đối thủ trong sân ghi) thì như
  // Dễ thương thêm, mọi đòn kể cả sát thương theo thời gian.
  const pv = poison?.src && poison.n >= CORE_FX_RULE.poisonStacks ? room.pdata.get(poison.src)?.coreFx.poisonVuln ?? 0 : 0;
  dmg *= 1 + (d.st.has("vuln") ? STATUS.vuln.amp : 0) + (direct && armor ? STATUS.armor.amp * armor.n : 0) + pv;
  dmg = Math.round(dmg * VOHON[p.vh].def * (1 - Math.min(0.9, room.buffV(d, "def"))));
  // Khiên (tiên cơ phụ trợ) đỡ trước; vẫn tính là bị đánh (giao chiến, gián đoạn hấp thụ).
  const blocked = Math.min(d.shield, dmg); d.shield -= blocked; dmg -= blocked; p.shield = Math.ceil(d.shield);
  d.hpF -= dmg; if (direct && !o.pvp) d.inv = HIT_INVULN_SECS; d.lastHit = 0; d.fight = 0;
  if (o.pvp) o.pvp.dealt = dmg;
  // Khiên đỡ hết thì hiện số bị đỡ (màu lam) thay cho số 0.
  room.broadcast("dmg", { x: p.x, y: p.y - 18, v: -(dmg || blocked), crit: o.crit, c: blocked ? "#9ad8ff" : o.crit ? "#ffe14d" : o.dot ? "#8ef08a" : "#ff6b6b", id }); // id: client chạy animation hurt cho hồn sư này
  if (d.absorbing) room.cancelAbsorb(id, "Bị tấn công: quá trình hấp thụ bị gián đoạn, hồn hoàn vẫn còn trong túi.");
  if (d.hpF <= 0) { d.hpF = 0; p.hp = 0; room.knockOut(id); }
  if (direct && !o.pvp && d.st.has("shock")) {
    const sh = STATUS.shock;
    for (const [oid, op] of room.state.players.entries())
      if (oid !== id && !op.dead && room.pdata.get(oid)?.st.has("shock") && Math.hypot(op.x - p.x, op.y - p.y) < sh.chainR) room.hurtPlayer(oid, raw * sh.chain, { chain: true });
  }
  return true;
}

/**
 * Võ hồn ra trận gục (mục 5.1): tự đổi sang võ hồn chưa gục kế tiếp trong đội (theo thứ tự ô, hết thì vòng lại ô 1), không
 * tính và không chờ hồi chiêu đổi. Cả đội gục thì sau RESPAWN_SECS giây về doanh trại; không mất kinh nghiệm hay đồ (mục 2).
 */
export function knockOut(room: MapRoom, id: string) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!, fallen = d.ch, name = VOHON[p.vh].name;
  d.down.set(fallen.rowId, REVIVE_SECS); d.energy.delete(fallen.rowId); // gục thì mất hết năng lượng tiên cơ
  if (fallen.vohon === PHONG_LOI.vohon) { d.lei = 0; p.lei = 0; } // Lam Điện Bá Vương Long gục thì mất Phong Lôi Chi Lực
  const at = d.team.indexOf(fallen.rowId);
  let next: Character | undefined;
  for (let k = 1; k < TEAM_SIZE && !next; k++) {
    const r = d.team[(at + k) % TEAM_SIZE];
    if (r && !d.down.has(r)) next = d.owned.find((v) => v.rowId === r);
  }
  const c = room.clients.getById(id);
  if (next) {
    const nextName = VOHON[Math.max(0, vohonIndex(next.vohon))].name;
    room.activate(id, next, `${name} đã gục! ${nextName} tự động ra trận. ${name} hồi lại sau ${REVIVE_SECS} giây ngoài trận hoặc khi về doanh trại.`);
    c?.send("ko", { fallen: fallen.vohon, next: next.vohon });
    room.persistTeam(d);
    if (c) room.sendVohons(c);
  } else {
    p.dead = true; d.deadT = RESPAWN_SECS; room.clearPStatus(p, d); room.endAva(id, "");
    room.autoStop(id, "cả đội đã gục."); // tự săn (mục 5.13)
    room.log(id, `${name} đã gục, cả đội đều đã gục. Đang trở về doanh trại… (không mất kinh nghiệm hay đồ)`, "#ff8a8a");
    c?.send("ko", { fallen: fallen.vohon, next: null });
    room.sendSquad(id, true);
  }
}


/** Hồi các võ hồn đã gục, đầy sinh lực. */
export function revive(room: MapRoom, id: string, rows: number[], where: string) {
  const d = room.pdata.get(id)!;
  for (const r of rows) { d.down.delete(r); d.benchHp.delete(r); }
  const names = rows.map((r) => VOHON[Math.max(0, vohonIndex(d.owned.find((v) => v.rowId === r)?.vohon ?? ""))].name);
  room.log(id, `${names.join(", ")} đã hồi phục ${where}, đổi vào trận được rồi.`, "#86e0b0");
  room.sendSquad(id, true);
}

// ---------- Chiến đấu ----------
export function attack(room: MapRoom, id: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d || p.dead || d.absorbing || d.atkCd > 0 || d.travelling || room.pctl(d).noAtk) return; // Choáng: không đánh
  // Bộ hồn hạch Linh Miêu 4 món (5.2): đang tăng tốc đánh thì hồi chiêu đánh thường ngắn lại.
  d.atkCd = ATTACK_CD / (1 + (d.haste > 0 ? d.coreFx.haste ?? 0 : 0));
  if (room.map.inSafe(p.x, p.y)) { d.atkCd = 1; return room.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c"); }
  room.unhide(p, d);
  const ax = p.x + d.dir.x * ATTACK_REACH.fwd, ay = p.y - 6 + d.dir.y * ATTACK_REACH.fwd;
  room.broadcast("fx", { k: "slash", id, dx: d.dir.x, dy: d.dir.y, col: VOHON[p.vh].col });
  const hit: Hit = { kind: "attack", done: false };
  const near = room.beastsNear(ax, ay, ATTACK_REACH.r + BEAST_HALF).filter(([, b]) => Math.hypot(b.x - ax, b.y - TIERS[b.tier].size / 2 - ay) < ATTACK_REACH.r + TIERS[b.tier].size / 2);
  // Đối thủ trong Đại Đấu Hồn Trường (7.2): tâm thân hồn sư cao hơn chân ARENA.body pixel.
  const foes = room.foesOf(id).filter((f) => { const q = room.state.players.get(f); return q && !q.dead && Math.hypot(q.x - ax, q.y - ARENA.body - ay) < ATTACK_REACH.r + ARENA.body; });
  // Bộ Hạo Thiên 4 món (5.2): đòn thường trúng thứ comboN liên tiếp (cách nhau không quá comboGap giây) thêm sát thương; trượt thì đếm lại.
  let mult = 1;
  if (d.coreFx.combo) {
    d.combo = near.length || foes.length ? (d.comboT <= CORE_FX_RULE.comboGap ? d.combo + 1 : 1) : 0; d.comboT = 0;
    if (d.combo >= CORE_FX_RULE.comboN) { d.combo = 0; mult += d.coreFx.combo; room.broadcast("fx", { k: "combo", id, col: CORE_SETS[coreSetIndex("hao_thien")].col }); }
  }
  const atk = room.atkOf(d); // một lần tung vũ khí cho cả đòn
  for (const [bid] of near) room.damageBeast(bid, atk * mult * atkRoll(Math.random()), id, VOHON[p.vh].col, hit);
  for (const f of foes) room.damageFoe(f, atk * mult * atkRoll(Math.random()), id, VOHON[p.vh].col, hit);
}

/**
 * `hit`: đòn đánh thường / hồn kỹ tạo năng lượng tiên cơ cho đội; bỏ trống (chiêu tiên cơ, sát thương theo thời gian, lan
 * Cảm điện) thì không tạo. Dễ thương tăng mọi sát thương, Phá giáp tăng sát thương đòn trực tiếp; đòn trực tiếp trúng hồn
 * thú Cảm điện thì lan sang hồn thú Cảm điện gần đó. Trả về sát thương đã gây.
 * Người đang chuyển bản đồ hoặc đứng trong vùng an toàn không gây sát thương (kể cả tiên cơ, nhát hẹn giờ của hồn kỹ liên
 * hoàn, mũi đạn đang bay, sát thương theo thời gian và lan Cảm điện) và không tích năng lượng: kills / kinh nghiệm sau lúc
 * chụp dữ liệu đi cổng sẽ mất (mục 6), vùng an toàn không giao chiến (mục 5.3).
 */
export function damageBeast(room: MapRoom, bid: string, dmg: number, by: string, col: string, hit?: Hit, o: DmgOpt = {}) {
  const b = room.state.beasts.get(bid), bd = room.bdata.get(bid), p = room.state.players.get(by), pd = room.pdata.get(by);
  if (!b || !bd || !p || !pd || b.hp <= 0 || pd.travelling || room.map.inSafe(p.x, p.y)) return 0;
  const w = bd.elite?.king?.world, he = VOHON[p.vh]?.he;
  if (w && w.dive > 0) return 0; // boss thế giới đang lặn (Du Thủy, BĐ6e): không nhận sát thương
  const direct = o.direct !== false && !o.chain, fx = pd.coreFx;
  const vuln = bd.st.get("vuln"), armor = bd.st.get("armor"), poison = bd.st.get("poison"), shocked = bd.st.has("shock");
  // Bộ hồn hạch Xà Hoàng 4 món (5.2): Trúng độc đủ tầng do người mang bộ gây thì như Dễ thương thêm (mọi nguồn).
  const pv = poison && poison.n >= CORE_FX_RULE.poisonStacks ? room.pdata.get(poison.src)?.coreFx.poisonVuln ?? 0 : 0;
  // Ràng buộc Băng Hỏa Lưỡng Nghi (9.4): hồn thú đang Choáng hoặc Thiêu đốt nhận thêm sát thương của hồn sư (mọi nguồn, như Dễ thương).
  const sb = (bd.st.has("stun") || bd.st.has("burn")) && !o.pair ? room.bondV(pd, "stunBurn") : 0; // dung hợp kỹ không nhận ràng buộc (#192)
  // Thủ (#116, BEAST_DEF): đòn trực tiếp nhân defMult; Phá giáp (STATUS.armor.shred mỗi tầng) và xuyên thủ của bộ Thất Sát 2 món giảm
  // thủ, tối đa hết thủ. Phần chênh so với hồn thú thủ chuẩn cộng như các hệ số khác.
  const thu = direct ? defMult(bd.def, (armor ? STATUS.armor.shred * armor.n : 0) + (fx.pierce ?? 0)) - 1 : 0;
  dmg *= 1 + (vuln ? vuln.v : 0) + pv + sb + thu + room.phoenixAmp(b);
  // Chí mạng theo võ hồn ra trận (CRIT cộng hồn hạch, 5.2); bộ Thất Sát 4 món thêm tỉ lệ lên hồn thú Phá giáp.
  const crit = direct && Math.random() < pd.crit + (o.crit ?? 0) + room.buffV(pd, "crit") + (o.pair ? 0 : room.bondV(pd, "crit")) + (armor ? fx.armorCrit ?? 0 : 0);
  if (crit) dmg *= pd.critMult;
  if (crit && fx.haste) pd.haste = CORE_FX_RULE.hasteSecs; // bộ Linh Miêu 4 món: chí mạng thì tăng tốc đánh một lúc
  // Điểm yếu hệ của boss thế giới (BĐ6e): võ hồn ra trận đúng hệ gây x WORLD.weakMult, hệ khác x WORLD.offMult.
  if (w?.weak) dmg *= he === w.weak ? WORLD.weakMult : WORLD.offMult;
  dmg = Math.max(1, Math.round(dmg));
  // Tinh anh (BĐ4): người gây sát thương thành người tham gia trước (máu tối đa tăng theo số người, giữ tỉ lệ), rồi mới trừ máu.
  // Dung hợp kỹ (#192): đồng đội dung hợp còn trong phòng cũng thành người tham gia và nhận nửa đóng góp.
  // Đồng đội đã rời, đang đi cổng, đã gục hay đứng trong vùng an toàn (độc / lửa của chiêu còn cháy) thì không nhận phần, A nhận cả.
  const mp = o.pair && o.pair !== by ? room.state.players.get(o.pair) : undefined, md = mp && room.pdata.get(o.pair!);
  // Tinh anh / thú vương: B phải đang trong bán kính giao chiến (hang) như người tham gia khác (inFight).
  const mate = mp && md && !md.travelling && !mp.dead && !room.map.inSafe(mp.x, mp.y) && (!bd.elite || room.inFight(b, bd.elite, mp)) ? o.pair : undefined;
  if (bd.elite) { if (mate) room.joinFight(bd.elite, mate); room.eliteJoin(b, bd, by); } // eliteJoin tính lại máu theo số người
  // Khiên Bá Thể (BĐ6e) đỡ trước; võ hồn hệ của khiên phá nhanh gấp `mult`. Phần đánh vào khiên vẫn tính đóng góp.
  let hpDmg = dmg, credit = Math.min(dmg, b.hp);
  const ar = w && w.shield > 0 ? bd.elite!.king!.def.world?.armor : undefined;
  if (w && ar) {
    const m = he === ar.he ? ar.mult : 1, eff = dmg * m, used = Math.min(eff, w.shield);
    w.shield -= used; hpDmg = Math.round((eff - used) / m); credit = Math.round(used) + Math.min(hpDmg, b.hp);
    b.shield = Math.ceil(w.shield);
    if (w.shield <= 0) { w.shield = 0; w.shieldT = 0; b.shield = 0; room.broadcast("boss", { k: "armorBreak", bid, name: ar.name, by: p.name }); }
    room.broadcast("dmg", { x: b.x, y: b.y - TIERS[b.tier].size - 8, v: Math.round(used), c: "#9ad8ff", bid, by, dot: !direct || undefined });
  }
  if (bd.elite && mate) { room.credit(bd.elite, "dmgBy", by, credit / 2); room.credit(bd.elite, "dmgBy", mate, credit / 2); }
  else if (bd.elite) room.credit(bd.elite, "dmgBy", by, credit);
  // Khiên đỡ hết đòn: vẫn là một đòn trúng (năng lượng tiên cơ, tích Lôi, onHit như đòn trúng máu), chỉ không trừ máu.
  if (hpDmg <= 0) {
    b.aggro = true; bd.target = by; bd.hitBy = by; bd.calm = 0; if (o.direct !== false) { pd.fight = 0; if (mate) room.pdata.get(mate)!.fight = 0; }
    if (hit && !hit.done) { hit.done = true; room.gainEnergy(by, hit.kind); room.gainLei(by, hit.kind, bd.st.has("shock")); hit.onHit?.(); }
    return dmg;
  }
  dmg = hpDmg;
  b.hp = Math.max(0, b.hp - dmg); b.aggro = true; bd.target = by; bd.hitBy = by; bd.calm = 0;
  if (o.direct !== false) { pd.fight = 0; if (mate) room.pdata.get(mate)!.fight = 0; } // sát thương theo thời gian không giữ hồn sư trong giao chiến; dung hợp kỹ: cả đồng đội
  if (direct && !bd.st.has("stun") && !bd.st.has("root") && !bd.rooted) { // thú thực vật đứng yên không bị đẩy lùi (#116)
    const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1, kb = b.rank >= 2 ? 0 : b.tier >= 3 ? 40 : 110; // thú vương không bị đẩy lùi
    bd.kx = (dx / dd) * kb; bd.ky = (dy / dd) * kb;
  }
  room.broadcast("dmg", { x: b.x, y: b.y - TIERS[b.tier].size, v: dmg, crit, c: crit ? "#ffe14d" : col, bid, by, dot: !direct || undefined, kill: b.hp <= 0 || undefined }); // by / dot: chỉ để client chọn hiệu ứng đánh; kill: đòn kết liễu (chỉ để hiển thị: client chạy hiệu ứng chết, hồn thú bị xoá cùng tick)
  if (hit && !hit.done) { hit.done = true; room.gainEnergy(by, hit.kind); room.gainLei(by, hit.kind, bd.st.has("shock")); hit.onHit?.(); }
  // Hút máu của hồn kỹ (đòn trực tiếp) cộng hút huyết `leech` của hồn sư (Quỷ Mị, 2.5d: mọi sát thương, kể cả theo thời gian và lan
  // Cảm điện), hồi cho võ hồn ra trận; cả đội đã gục thì không hồi.
  const steal = (o.lifesteal ?? 0) + room.buffV(pd, "leech");
  if (steal && !p.dead) { pd.hpF = Math.min(p.maxHp, pd.hpF + dmg * steal); p.hp = Math.ceil(pd.hpF); }
  // Bộ hồn hạch Bá Vương Long 4 món (5.2): đòn trực tiếp trúng hồn thú Cảm điện hồi hồn lực, mỗi shockMpCd giây một lần.
  if (direct && shocked && fx.shockMp && pd.shockMpCd <= 0 && !p.dead) {
    pd.shockMpCd = CORE_FX_RULE.shockMpCd; pd.mpF = Math.min(p.maxMp, pd.mpF + p.maxMp * fx.shockMp); p.mp = Math.floor(pd.mpF);
  }
  // Cảm điện: lan một phần sát thương sang hồn thú Cảm điện khác gần đó (một bước, không lan tiếp); bộ Bá Vương Long 2 món lan mạnh thêm.
  if (direct && bd.st.has("shock")) {
    const sh = STATUS.shock;
    for (const [oid, ob] of room.beastsNear(b.x, b.y, sh.chainR))
      if (oid !== bid && room.bdata.get(oid)?.st.has("shock") && Math.hypot(ob.x - b.x, ob.y - b.y) < sh.chainR)
        room.damageBeast(oid, dmg * sh.chain * (1 + (fx.chain ?? 0)), by, sh.col, undefined, { chain: true, pair: o.pair });
  }
  if (b.hp <= 0) room.killBeast(bid, by);
  return dmg;
}

/**
 * Hồn sư `by` gây `dmg` (tính như lên hồn thú) cho đối thủ `fid` (7.2). Thứ tự (#277, mục 5.9): × ARENA_HE_DMG theo hệ võ hồn ra trận
 * của người đánh → × ARENA.dmgMult → chí mạng theo người đánh (tỉ lệ, hồn kỹ, hiệu ứng có lợi, ràng buộc, bộ Thất Sát 4 món lên đối
 * thủ Phá giáp) → hurtPlayer (Dễ thương / Phá giáp / Xà Hoàng 4 món, thủ theo hệ, tăng thủ, khiên, miễn sát thương, gục từng võ hồn).
 * Đòn trúng tạo năng lượng tiên cơ / Phong Lôi Chi Lực, hút máu, bộ Linh Miêu / Bá Vương Long 4 món như damageBeast. Lãnh vực phượng
 * hoàng, kích nổ, đẩy lùi, lan Cảm điện chỉ áp lên hồn thú. Trả về đòn có trúng không.
 */
export function damageFoe(room: MapRoom, fid: string, dmg: number, by: string, _col: string, hit?: Hit, o: DmgOpt = {}) {
  const p = room.state.players.get(by), pd = room.pdata.get(by), f = room.state.players.get(fid), fd = room.pdata.get(fid);
  if (!p || !pd || !f || !fd || f.dead || pd.travelling || fd.travelling || !room.foesOf(by).includes(fid)) return false;
  const direct = o.direct !== false && !o.chain, fx = pd.coreFx, he = VOHON[p.vh]?.he, shocked = fd.st.has("shock");
  const crit = direct && Math.random() < pd.crit + (o.crit ?? 0) + room.buffV(pd, "crit") + room.bondV(pd, "crit") + (fd.st.has("armor") ? fx.armorCrit ?? 0 : 0);
  const r = { dealt: 0 };
  if (!room.hurtPlayer(fid, dmg * (he ? ARENA_HE_DMG[he] : 1) * ARENA.dmgMult * (crit ? pd.critMult : 1), { dot: !direct, pvp: r, crit })) return false;
  if (crit && fx.haste) pd.haste = CORE_FX_RULE.hasteSecs; // bộ Linh Miêu 4 món
  // Bộ Bá Vương Long 4 món: đòn trực tiếp trúng đối thủ Cảm điện hồi hồn lực, chung hồi chiêu shockMpCd với hồn thú.
  if (direct && shocked && fx.shockMp && pd.shockMpCd <= 0 && !p.dead) {
    pd.shockMpCd = CORE_FX_RULE.shockMpCd; pd.mpF = Math.min(p.maxMp, pd.mpF + p.maxMp * fx.shockMp); p.mp = Math.floor(pd.mpF);
  }
  if (direct) pd.fight = 0;
  if (hit && !hit.done) { hit.done = true; room.gainEnergy(by, hit.kind); room.gainLei(by, hit.kind, fd.st.has("shock")); hit.onHit?.(); }
  const steal = (o.lifesteal ?? 0) + room.buffV(pd, "leech");
  if (steal && !p.dead && r.dealt > 0) { pd.hpF = Math.min(p.maxHp, pd.hpF + r.dealt * steal); p.hp = Math.ceil(pd.hpF); }
  return true;
}
