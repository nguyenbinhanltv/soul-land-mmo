// Hồn kỹ và Võ Hồn Dung Hợp Kỹ (GAME_DESIGN.md mục 5.1, 5.2, 5.5, 5.9; docs/design/ky-nang-combat-phap-tuong.md), tách khỏi MapRoom.ts (#702, bước 17):
// bộ máy hồn kỹ `runSkill`, tung hồn kỹ ô U/I/O/P `skill`, Phục Chế `copySource`, xếp ô `setLoadout`, kỹ năng hồn cốt `boneSkill`, dung hợp kỹ
// `fusion*` / `tickFusion`. Hàm nhận phòng (`room: MapRoom`) như boss.ts; nguyên văn từ MapRoom, không đổi số / thứ tự RNG / thứ tự xử lý trong tick /
// thứ tự ghi DB qua `room.chainLatest`. MapRoom chỉ chuyển tiếp 7 hàm (`onMessage`, `tick`, `gm.ts`, `autoHunt.ts`, tiên cơ, `ArenaRoom.boneSkill` gọi như cũ).
// Còn ở MapRoom: `applyStatus` / `applyPStatus` (đánh thường / sát thương đã sang combat.ts), `chanThan` / `endAva` / `tickAva`. `selfEffect` / `partyShare` nay ở `support.ts`.
import type { Client } from "colyseus";
import { TIERS, VOHON, tierOfYears, vohonIndex, beastIndex, starSkillMult, starCdMult, starRing, BONE_SLOTS, boneSlotIndex, isCcStatus, BONE_ACTIVE_SLOTS,
  boneSkillOf, boneSkillMult, skillPower, buffPower, PCT_HP_CAP, PROJ_SPEED, skillsOf, FUSION, FUSIONS, fusionIndex, fusionsOf, ringSkill, loadoutOf,
  parseLoadout, LOADOUT_SIZE, CHAN_THAN_RING, chanThanOf, CHAN_THAN_SKILL_SLOT, COPY_R, COPY_WINDOW, ARENA, PLAYER_STATUS_PVE, SKILL_CONE_COS, type SkillDef } from "../../../shared/data.ts";
import { store } from "../db.ts";
import * as party from "../party.ts";
import { presenceBackend } from "../presence.ts";
import { type MapRoom } from "./MapRoom.ts";
import type { PData, Hit, FusHit } from "./types.ts";
import { fusionCdLeft, fusionReady } from "./procState.ts";
import { fusionKey } from "./common.ts";

/**
 * Bộ máy hồn kỹ theo dữ liệu (SkillDef trong shared/data.ts) cho hồn kỹ chung, hồn kỹ riêng và chiêu tiên cơ riêng.
 * `power`: sức mạnh (skillPower theo số năm hồn hoàn của vòng, hoặc tienCoDmgMult cho tiên cơ); `bpow`: hệ số hiệu ứng lên
 * bản thân (buffPower). `hit`: đòn tạo năng lượng tiên cơ (bỏ trống với tiên cơ). Vùng "target" không có mục tiêu thì
 * lướt theo hướng nhìn nếu có `dash` (người gọi đã kiểm tra trước với hồn kỹ thường). `share` (9.1): mã võ hồn gốc khi hiệu ứng lên
 * bản thân lan cho tổ đội (shareOf), bỏ trống thì không lan. `fus` (#192, Võ Hồn Dung Hợp Kỹ): vùng "around" đặt cố định ở `at`;
 * `atk` là công dùng thay công của `id` (cả sát thương theo thời gian); `pair` là đồng đội dung hợp: không nhận ràng buộc, đóng góp tinh
 * anh / thú vương / boss chia đôi.
 */
export function runSkill(room: MapRoom, id: string, sk: SkillDef, power: number, bpow: number, col: string, hit?: Hit, share?: string, fus?: FusHit & { at: { x: number; y: number } }) {
  const p = room.state.players.get(id)!, d = room.pdata.get(id)!, atk = (fus ? fus.atk : room.atkOf(d)) * power, pair = fus?.pair;
  /** Một nhát trúng hồn thú `bid`: sát thương (kèm % sinh lực, theo tầng trạng thái) rồi gây trạng thái. */
  const strike = (bid: string, last: boolean) => {
    const b = room.state.beasts.get(bid), bd = room.bdata.get(bid); if (!b || !bd || b.hp <= 0) return;
    let dmg = atk * sk.dmg;
    if (sk.pctHp) dmg += Math.min(b.maxHp * sk.pctHp, atk * PCT_HP_CAP);
    if (sk.perStack) dmg += atk * sk.perStack.dmg * (bd.st.get(sk.perStack.s)?.n ?? 0);
    if (sk.lowHp) dmg *= 1 + sk.lowHp * (1 - b.hp / Math.max(1, b.maxHp)); // hạ mục tiêu yếu máu (Nguyệt Nhận)
    if (sk.vsSt && sk.vsSt.s.some((s) => bd.st.has(s))) dmg *= 1 + sk.vsSt.v; // mục tiêu đang có trạng thái (Băng Hỏa Lưỡng Nghi, #192)
    if (dmg > 0) room.damageBeast(bid, dmg, id, col, hit, { crit: sk.crit, lifesteal: sk.lifesteal, pair });
    if (!room.state.beasts.has(bid)) return;
    if (sk.dispel) room.dispelBeast(bid, id); // xóa buff địch (Thiên Càn Trấn Áp, BĐ4)
    if (sk.push) room.pushBeast(bid, p, sk.push);
    // Viêm bạo (Hỏa Long): kích nổ mọi tầng Thiêu đốt rồi đặt lại `keep` tầng. Từ 8.1b `boom.last`: chỉ nhát cuối kích nổ, `mult` nổ mạnh thêm.
    if (sk.boom && (!sk.boom.last || last)) {
      room.detonateBurn(bid, id, sk.boom.mult);
      if (sk.boom.keep > 0) room.applyStatus(bid, { s: "burn", n: sk.boom.keep }, id, power, fus);
    }
    for (const a of [...(sk.status ?? []), ...(last ? sk.finisher ?? [] : [])]) room.applyStatus(bid, a, id, power, fus);
  };
  /**
   * Một nhát trúng đối thủ `fid` (Đại Đấu Hồn Trường, 7.2): cùng công thức sát thương như lên hồn thú (damageFoe nhân ARENA.dmgMult),
   * trạng thái lên hồn sư qua applyPStatus (chỉ trạng thái có trong PLAYER_STATUS). Đẩy lùi, kéo, xóa buff, kích nổ chỉ áp lên hồn thú.
   */
  const strikeFoe = (fid: string, last: boolean) => {
    const f = room.state.players.get(fid), fd = room.pdata.get(fid); if (!f || !fd || f.dead) return;
    let dmg = atk * sk.dmg;
    if (sk.pctHp) dmg += Math.min(f.maxHp * sk.pctHp, atk * PCT_HP_CAP);
    if (sk.perStack) dmg += atk * sk.perStack.dmg * (fd.st.get(sk.perStack.s)?.n ?? 0);
    if (sk.lowHp) dmg *= 1 + sk.lowHp * (1 - f.hp / Math.max(1, f.maxHp));
    if (sk.vsSt && sk.vsSt.s.some((s) => fd.st.has(s))) dmg *= 1 + sk.vsSt.v;
    const landed = dmg > 0 ? room.damageFoe(fid, dmg, id, col, hit, { crit: sk.crit, lifesteal: sk.lifesteal }) : !room.buffV(fd, "inv");
    if (!landed) return;
    // Mê hoặc / Đóng băng trên hồn sư chỉ do hồn thú gây (PLAYER_STATUS_PVE, #116).
    for (const a of [...(sk.status ?? []), ...(last ? sk.finisher ?? [] : [])]) if (!PLAYER_STATUS_PVE.includes(a.s)) room.applyPStatus(fid, a, atk * ARENA.dmgMult, id);
  };
  const near = (r: number, x = p.x, y = p.y) => room.beastsNear(x, y, r).filter(([, b]) => Math.hypot(b.x - x, b.y - y) < r).map(([bid]) => bid);
  if (sk.fly) room.broadcast("fx", { k: "fly", id, t: sk.fly, col });
  if (sk.area === "around") {
    // `n` > 1: nhiều nhát quanh vị trí hiện tại của hồn sư cách nhau `every` giây (cánh hoa xoay); nhát cuối mới gây `finisher`.
    // Từ 2.5c: `at` đặt vùng cố định tại hồn thú gần nhất (bay tới nếu có `dash`), `fixed` cố định ở chỗ hồn sư đứng lúc tung.
    const n = sk.n ?? 1;
    let at: { x: number; y: number } | null = fus ? fus.at : sk.fixed ? { x: p.x, y: p.y } : null;
    if (sk.at && !fus) {
      // Không có hồn thú trong tầm thì đặt vào đối thủ gần nhất (7.2).
      const bid = room.nearestBeast(p, sk.at), b = bid ? room.state.beasts.get(bid) : undefined;
      const fid = b ? undefined : room.nearestFoe(id, sk.at), t = b ?? (fid ? room.state.players.get(fid) : undefined);
      const size = b ? TIERS[b.tier].size : ARENA.body * 2;
      if (t && sk.dash) { const x0 = p.x, y0 = p.y; if (room.dashTo(p, d, t, sk.dash, size) > 0) room.broadcast("fx", { k: "trail", x0, y0, x1: p.x, y1: p.y, col }); }
      at = t ? { x: t.x, y: t.y } : { x: p.x, y: p.y };
    }
    if (at && n > 1) room.broadcast("fx", { k: "zone", x: at.x, y: at.y - 4, r: sk.r, t: n * (sk.every ?? 0.15), col });
    for (let k = 0; k < n; k++) {
      const go = () => {
        const me = room.state.players.get(id); if (me !== p || me.dead) return;
        const cx = at?.x ?? p.x, cy = at?.y ?? p.y;
        room.broadcast("fx", { k: "wave", id, x: cx, y: cy - 6, r: sk.r, col, ...(sk.shake && k === 0 ? { shake: 0.5 } : {}) });
        const ids = near(sk.r, cx, cy), fids = room.foesNear(id, sk.r, cx, cy);
        // Từ 8.1c `shockR`: sét tìm mục tiêu Cảm điện ở xa hơn `r` (cả đối thủ đang Cảm điện); tia sét từ tâm vùng tới từng mục tiêu (fx zap).
        if (sk.shockR) {
          const far = near(sk.shockR, cx, cy).filter((bid) => !ids.includes(bid) && room.bdata.get(bid)?.st.has("shock"));
          const ffar = room.foesNear(id, sk.shockR, cx, cy).filter((fid) => !fids.includes(fid) && room.pdata.get(fid)?.st.has("shock"));
          const to = [...far.map((bid) => room.state.beasts.get(bid)!), ...ffar.map((fid) => room.state.players.get(fid)!)].map((t) => ({ x: Math.round(t.x), y: Math.round(t.y) }));
          if (to.length) room.broadcast("fx", { k: "zap", x: cx, y: cy - 6, to, col });
          ids.push(...far); fids.push(...ffar);
        }
        if (sk.pull) { room.broadcast("fx", { k: "pull", x: p.x, y: p.y - 4, r: sk.r, col }); for (const bid of ids) room.pullBeast(bid, p); }
        for (const bid of ids) strike(bid, k === n - 1);
        for (const fid of fids) strikeFoe(fid, k === n - 1);
      };
      if (k === 0) go(); else room.later(k * (sk.every ?? 0.15), go);
    }
  } else if (sk.area === "front") {
    room.broadcast("fx", { k: "arc", id, x: p.x, y: p.y - 6, dx: d.dir.x, dy: d.dir.y, r: sk.r, col });
    for (const [bid, b] of room.beastsNear(p.x, p.y, sk.r)) {
      const dx = b.x - p.x, dy = b.y - p.y, dd = Math.hypot(dx, dy) || 1;
      if (dd < sk.r + TIERS[b.tier].size / 2 && (dx * d.dir.x + dy * d.dir.y) / dd > SKILL_CONE_COS) strike(bid, true);
    }
    for (const fid of room.foesOf(id)) {
      const f = room.state.players.get(fid); if (!f) continue;
      const dx = f.x - p.x, dy = f.y - p.y, dd = Math.hypot(dx, dy) || 1;
      if (dd < sk.r + ARENA.body && (dx * d.dir.x + dy * d.dir.y) / dd > SKILL_CONE_COS) strikeFoe(fid, true);
    }
  } else if (sk.area === "dash") {
    const sx = p.x, sy = p.y, dist = room.dashStep(p, d, sk.r);
    room.broadcast("fx", { k: "trail", x0: sx, y0: sy, x1: p.x, y1: p.y, col });
    const L = Math.max(1, dist), ux = (p.x - sx) / L, uy = (p.y - sy) / L;
    for (const [bid, b] of room.beastsNear((sx + p.x) / 2, (sy + p.y) / 2, L / 2 + 14)) {
      const bx = b.x - sx, by = b.y - sy, pr = Math.max(0, Math.min(L, bx * ux + by * uy));
      if (Math.hypot(bx - ux * pr, by - uy * pr) < 14 + TIERS[b.tier].size / 2) strike(bid, true);
    }
    for (const fid of room.foesOf(id)) {
      const f = room.state.players.get(fid); if (!f) continue;
      const bx = f.x - sx, by = f.y - sy, pr = Math.max(0, Math.min(L, bx * ux + by * uy));
      if (Math.hypot(bx - ux * pr, by - uy * pr) < 14 + ARENA.body) strikeFoe(fid, true);
    }
  } else if (sk.area === "proj") {
    const n = sk.n ?? 1, spread = (sk.spread ?? 0) * Math.PI / 180, ring = spread >= Math.PI * 2 - 1e-6, a0 = Math.atan2(d.dir.y, d.dir.x);
    for (let k = 0; k < n; k++) {
      const a = ring ? (k / n) * Math.PI * 2 : a0 + (n > 1 ? (k / (n - 1) - 0.5) * spread : 0);
      room.projs.push({ x: p.x, y: p.y - 8, vx: Math.cos(a) * PROJ_SPEED, vy: Math.sin(a) * PROJ_SPEED, life: sk.r / PROJ_SPEED, owner: id,
        fire: (bid) => strike(bid, true), foe: (fid) => strikeFoe(fid, true) });
    }
    room.broadcast("fx", ring ? { k: "burst", id, x: p.x, y: p.y - 8, col } : { k: "burst", id, x: p.x, y: p.y - 8, col, n, a0, spread, r: sk.r });
  } else if (sk.area === "target") {
    const bid = sk.pick === "low" ? room.weakestBeast(p, sk.r) : room.nearestBeast(p, sk.r), b = bid ? room.state.beasts.get(bid) : undefined;
    // Không có hồn thú trong tầm thì nhắm đối thủ gần nhất (Đại Đấu Hồn Trường, 7.2).
    const fid = b ? undefined : room.nearestFoe(id, sk.r), f = fid ? room.state.players.get(fid) : undefined;
    if (!b && !f) {
      if (sk.dash) { const x0 = p.x, y0 = p.y; room.dashStep(p, d, sk.dash); room.broadcast("fx", { k: "trail", x0, y0, x1: p.x, y1: p.y, col }); }
    } else {
      if (sk.dash) { const x0 = p.x, y0 = p.y; if (room.dashTo(p, d, (b ?? f)!, sk.dash, b ? TIERS[b.tier].size : ARENA.body * 2) > 0) room.broadcast("fx", { k: "trail", x0, y0, x1: p.x, y1: p.y, col }); }
      const n = sk.n ?? 1;
      for (let k = 0; k < n; k++) {
        const go = () => {
          const me = room.state.players.get(id); if (!me || me.dead) return;
          if (bid) {
            const t = room.state.beasts.get(bid); if (!t) return;
            room.broadcast("fx", { k: "claw", x: t.x, y: t.y - TIERS[t.tier].size / 2, col, i: k });
            strike(bid, k === n - 1);
          } else if (fid) {
            const t = room.state.players.get(fid); if (!t || t.dead) return;
            room.broadcast("fx", { k: "claw", x: t.x, y: t.y - ARENA.body, col, i: k });
            strikeFoe(fid, k === n - 1);
          }
        };
        if (k === 0) go(); else room.later(k * (sk.every ?? 0.15), go);
      }
    }
  }
  if (sk.self) room.selfEffect(id, sk.self, bpow, col, share);
  if (sk.inv) d.inv = Math.max(d.inv, sk.inv);
}

/**
 * Hồn kỹ ở ô `i` (U/I/O/P). Từ 8.1a mỗi ô mang hồn kỹ của một vòng do người chơi chọn (loadoutOf; mặc định vòng 1–4): vòng 1–4
 * là hồn kỹ riêng của võ hồn ra trận nếu có (VOHON_SKILLS), không thì 4 hồn kỹ dùng chung; vòng 5, 6, 8, 9, 10 từ VOHON_SKILLS_HIGH.
 * Hồn kỹ vòng r mở khi có hồn hoàn thứ r, mạnh theo số năm của hồn hoàn đó (skillPower, mục 5.2). Hồi chiêu theo ô (`p.cds[i]`).
 * Hồn kỹ đánh một mục tiêu mà không có hồn thú trong tầm thì không tung (không tốn hồn lực, không hồi chiêu).
 * Từ 9.6: đang Võ Hồn Chân Thân thì ô P (CHAN_THAN_SKILL_SLOT) tung hồn kỹ Chân Thân (ChanThanDef.skill) thay hồn kỹ đang mang ở ô
 * đó (kể cả ô trống), mạnh theo hồn hoàn vòng 7, hồi chiêu riêng `p.ctCd` (không đụng `p.cds` / skCd của hồn kỹ ô P cũ).
 */
export function skill(room: MapRoom, c: Client, i: number) {
  const id = c.sessionId, p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d || p.dead || d.absorbing || d.travelling || !(Number.isInteger(i) && i >= 0 && i < LOADOUT_SIZE)) return;
  if (room.map.inSafe(p.x, p.y)) return room.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c");
  const ct = i === CHAN_THAN_SKILL_SLOT && d.ava ? chanThanOf(d.ch.vohon)?.skill ?? null : null; // hồn kỹ Chân Thân (9.6)
  const r = ct ? CHAN_THAN_RING - 1 : loadoutOf(d.ch.vohon, d.ch.skills)[i];
  if (r < 0) return room.log(id, `Ô ${i + 1} chưa mang hồn kỹ: chọn ở bảng đội hình (V).`);
  if (r >= p.rings.length) return room.log(id, `Hồn kỹ vòng ${r + 1} cần hồn hoàn thứ ${r + 1}.`);
  if (ct ? p.ctCd > 0 : p.cds[i] > 0) return;
  if (room.pctl(d).noSkill) return room.log(id, `Đang bị ${room.ccName(d)}: không dùng được hồn kỹ.`, "#ffb35c");
  const set = skillsOf(VOHON[p.vh].id), sk = ct ?? ringSkill(d.ch.vohon, r)!, cost = sk.cost * (1 - Math.min(0.9, room.buffV(d, "mp")));
  // Phục Chế (Xúc Xích, 2.5c; 9.3): tung lại hồn kỹ gần nhất của võ hồn khác trong đội hoặc đồng đội tổ đội đứng gần; chưa có thì không tung.
  const src = sk.copy ? copySource(room, id) : null;
  if (sk.copy && !src) return room.log(id, `${sk.name}: chưa có hồn kỹ của võ hồn khác trong đội (chưa gục) hay đồng đội tổ đội đứng gần tung trong ${COPY_WINDOW} giây để sao chép.`);
  const run = src?.sk ?? sk;
  if (d.mpF < cost) return room.log(id, "Không đủ hồn lực.");
  const reach = run.area === "target" ? run.r : run.at;
  if (reach && !room.nearestBeast(p, reach) && !room.nearestFoe(id, reach)) return room.log(id, `${run.name}: không có ${room.foesOf(id).length ? "đối thủ" : "hồn thú"} trong tầm.`);
  // Sao võ hồn (9.5, mục 5.1): hồn kỹ vòng 1–4 mạnh hơn theo sao (starSkillMult), từ 4★ hồi chiêu ngắn hơn (starCdMult).
  const star = starRing(r) ? d.ch.stars : 1, cd = sk.cd * starCdMult(star);
  d.mpF -= cost;
  if (ct) p.ctCd = cd; else { p.cds[i] = cd; d.skCd.set(`${d.ch.rowId}:${r}`, cd); }
  room.unhide(p, d);
  const tier = p.rings[r], years = d.ringYears[r] ?? TIERS[tier].years;
  // i: vòng hồn hoàn của hồn kỹ, client làm sáng vòng đó và hiện tên hồn kỹ; `ct`: hồn kỹ Chân Thân (9.6, vòng 7)
  room.broadcast("fx", { k: "soulring", id, tier, i: r, vh: p.vh, ...(ct ? { ct: 1 } : {}) });
  if (sk.ult) room.broadcast("fx", { k: "ult", id, name: sk.name, col: TIERS[tier].glow }); // tuyệt kỹ vòng 10 (8.1a): ai cũng thấy
  if (src) room.log(id, `${sk.name}: sao chép ${run.name}${src.by ? ` của ${src.by}` : ""}.`, VOHON[p.vh].col);
  // Phục Chế nhân `copy` cả sát thương lẫn hiệu ứng lên bản thân (hồi máu, khiên, hồn lực, hiệu ứng có lợi; inv/hide giữ nguyên);
  // hệ số sao (9.5) cũng nhân cả hai, theo sao của võ hồn tung và vòng của ô (không theo hồn kỹ được sao chép).
  // Ràng buộc Song Sinh Võ Hồn (9.4): sức mạnh hồn kỹ ô U / I / O / P (mọi vòng) × (1 + bondV skill), như hệ số sao.
  const mult = (sk.copy ?? 1) * starSkillMult(star) * (1 + room.bondV(d, "skill")), hit: Hit = { kind: "skill", done: false };
  // Bộ hồn hạch Lam Ngân 4 món (5.2): hồn kỹ có gây khống chế, trúng ít nhất một hồn thú thì hồi hồn lực (một lần mỗi lần tung).
  const ccMp = d.coreFx.ccMp ?? 0;
  if (ccMp && [...(run.status ?? []), ...(run.finisher ?? [])].some((a) => isCcStatus(a.s))) hit.onHit = () => {
    const q = room.state.players.get(id); if (q !== p || p.dead) return;
    d.mpF = Math.min(p.maxMp, d.mpF + p.maxMp * ccMp); p.mp = Math.floor(d.mpF);
  };
  // 9.1: võ hồn Phụ trợ ra trận thì hiệu ứng lên bản thân lan cho tổ đội; Phục Chế lấy võ hồn gốc của hồn kỹ đã chép.
  const share = room.shareOf(p, src ? src.vh : d.ch.vohon);
  runSkill(room, id, run, skillPower(years) * mult, buffPower(years) * mult, run.glow ? TIERS[tier].glow : VOHON[p.vh].col, hit, share);
  // Tuyệt kỹ vòng 10 (8.1a) không ghi vào hồn kỹ gần nhất: Phục Chế (hồi 14 giây) không được sao chép tuyệt kỹ (hồi 45–50 giây).
  // Hồn kỹ Chân Thân (9.6) cũng không: là một phần của Chân Thân.
  if (!set.some((x) => x.copy) && !sk.ult && !ct) d.lastSkill = { sk, row: d.ch.rowId, vh: d.ch.vohon, t: Date.now() };
}

/**
 * Hồn kỹ Phục Chế của `id` chép (2.5c, 9.3): hồn kỹ gần nhất về thời gian, tung trong COPY_WINDOW giây, của võ hồn khác còn trong
 * đội của mình (chưa gục) hoặc của đồng đội tổ đội cùng phòng (chưa gục cả đội, không đi cổng, không phải đối thủ, võ hồn đã tung
 * còn trong đội và chưa gục) đứng cách dưới COPY_R pixel. `by`: tên đồng đội khi chép của tổ đội. Không có thì null.
 */
export function copySource(room: MapRoom, id: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return null;
  const now = Date.now(), pid = party.partyIdOf(d.accountId), foes = room.foesOf(id);
  let best: { sk: SkillDef; vh: string; t: number; by?: string } | null = null;
  const pick = (o: PData, by?: string) => {
    const l = o.lastSkill;
    if (!l || now - l.t > COPY_WINDOW * 1000 || !o.team.includes(l.row) || o.down.has(l.row) || (!by && l.row === d.ch.rowId)) return;
    if (!best || l.t > best.t) best = { sk: l.sk, vh: l.vh, t: l.t, by };
  };
  pick(d);
  if (pid) for (const [qid, o] of room.pdata) {
    const q = room.state.players.get(qid);
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
export function setLoadout(room: MapRoom, c: Client, rowId: number, raw: unknown) {
  const id = c.sessionId, p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || d.travelling) return;
  const deny = (text: string) => { room.log(id, text, "#ffb35c"); room.sendVohons(c); };
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
  if (next.every((r, i) => r === prev[i])) return room.sendVohons(c);
  const lock = room.boneLock(p, d, "hồn kỹ"); if (lock) return deny(lock.replace("gắn / tháo", "xếp ô"));
  v.skills = next;
  if (v === d.ch) {
    const old = [...p.cds];
    next.forEach((r, i) => { const from = prev.indexOf(r);
      p.cds[i] = r < 0 ? 0 : Math.max(from >= 0 ? old[from] : 0, d.skCd.get(`${v.rowId}:${r}`) ?? 0); });
  }
  room.chainLatest(d, `skills:${v.rowId}`, () => store.saveSkills(d.accountId, v.rowId, [...next])); // gửi dồn: ghi một lần, bản mới nhất
  const keys = ["U", "I", "O", "P"];
  room.log(id, `${name} mang theo: ${next.map((r, i) => `${keys[i]} ${r < 0 ? "trống" : ringSkill(v.vohon, r)!.name}`).join(", ")}.`, VOHON[vi].col);
  room.sendVohons(c);
}

// ---------- Võ Hồn Dung Hợp Kỹ (#192, mục 5.9; FUSION, FUSIONS) ----------
/** Message `fusion {op}`: "start" (A mời đồng đội gần nhất hợp lệ), "join" (B hưởng ứng lời mời đang chờ). */
export function fusionAction(room: MapRoom, id: string, op: string) {
  if (op === "start") fusionStart(room, id);
  else if (op === "join") fusionJoin(room, id);
}

/**
 * Lý do hồn sư `id` không tham gia dung hợp kỹ được lúc này ("" = được): bị chặn như hồn kỹ (gục, hấp thụ, đi cổng / truyền tống,
 * vùng an toàn, Choáng / Câm lặng…), còn hồi chiêu dung hợp, võ hồn ra trận thiếu hồn hoàn (FUSION.minRings), thiếu hồn lực.
 * Câu trả về ghép sau tên người ("bạn …" / "<tên> …").
 */
export function fusionBlock(room: MapRoom, id: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d || d.travelling) return "không còn ở bản đồ này";
  if (p.dead) return "đã gục";
  if (d.absorbing) return "đang hấp thụ hồn hoàn";
  if (d.travelCast) return "đang đi cổng / truyền tống";
  if (room.map.inSafe(p.x, p.y)) return "đang ở vùng an toàn";
  if (room.pctl(d).noSkill) return `đang bị ${room.ccName(d)}`;
  const cd = fusionCdLeft(d.accountId); if (cd > 0) return `còn hồi chiêu dung hợp ${Math.ceil(cd)} giây`;
  if (p.rings.length < FUSION.minRings) return `chỉ có ${p.rings.length} hồn hoàn trên ${VOHON[p.vh].name} (cần ${FUSION.minRings})`;
  if (d.mpF < FUSION.cost) return `không đủ hồn lực (cần ${FUSION.cost})`;
  return "";
}

/**
 * Lý do cặp A (`a`) – B (`b`) không dung hợp được ("" = được): võ hồn ra trận không ghép thành cặp `fi` của FUSIONS (fi < 0: cặp bất
 * kỳ), cách nhau từ FUSION.r trở lên, một trong hai bị chặn (fusionBlock). Câu trả về là cả câu, không có dấu chấm cuối.
 */
export function fusionCheck(room: MapRoom, a: string, b: string, fi = -1) {
  const pa = room.state.players.get(a), da = room.pdata.get(a), pb = room.state.players.get(b), db = room.pdata.get(b);
  if (!pa || !da || !pb || !db) return "đồng đội đã rời bản đồ";
  const pid = party.partyIdOf(da.accountId);
  if (!pid || party.partyIdOf(db.accountId) !== pid) return `${pb.name} không còn cùng tổ đội`;
  const k = fusionIndex(da.ch.vohon, db.ch.vohon);
  if (k < 0 || (fi >= 0 && k !== fi)) return `${VOHON[pa.vh].name} và ${VOHON[pb.vh].name} của ${pb.name} không ghép thành cặp dung hợp`;
  const wa = fusionBlock(room, a); if (wa) return `${pa.name} ${wa}`;
  const wb = fusionBlock(room, b); if (wb) return `${pb.name} ${wb}`;
  const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
  if (dist >= FUSION.r) return `${pb.name} đứng xa (${Math.round(dist)} pixel, cần dưới ${FUSION.r})`;
  return "";
}

/**
 * A gửi `fusion {op: "start"}` (#192): server tìm đồng đội tổ đội cùng phòng gần nhất hợp lệ (fusionCheck, không đang có lời mời khác),
 * gửi B tin riêng `fusion {k: "ask"}` nhắc hưởng ứng trong FUSION.window giây, A nhận `fusion {k: "wait"}`. Không có ai thì báo lý do
 * của đồng đội gần nhất cầm võ hồn ghép cặp (không có thì báo cặp cần có). Cấm trong sân đấu (ArenaRoom BLOCKED; có đối thủ thì cũng từ chối).
 */
export function fusionStart(room: MapRoom, id: string) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d) return;
  const say = (t: string) => room.log(id, `Dung hợp kỹ: ${t}.`, "#ffb35c");
  if (room.map.kind === "arena" || room.foesOf(id).length) return say("không dùng được ở Đại Đấu Hồn Trường");
  if (d.fus) return say(d.fus.init ? `đang chờ ${room.state.players.get(d.fus.with)?.name ?? "đồng đội"} hưởng ứng`
    : `${room.state.players.get(d.fus.with)?.name ?? "đồng đội"} đang mời bạn, hãy hưởng ứng`);
  const pairs = fusionsOf(d.ch.vohon);
  if (!pairs.length) return say(`${VOHON[p.vh].name} không có dung hợp kỹ`);
  const why = fusionBlock(room, id); if (why) return say(`bạn ${why}`);
  const pid = party.partyIdOf(d.accountId);
  if (!pid) return say("cần ở trong tổ đội với đồng đội cầm võ hồn ghép cặp");
  const mates = [...room.pdata].filter(([q, o]) => q !== id && party.partyIdOf(o.accountId) === pid && room.state.players.has(q)).map(([q]) => q);
  if (!mates.length) return say("không có đồng đội tổ đội nào cùng bản đồ, cùng kênh");
  const dist = (q: string) => { const t = room.state.players.get(q)!; return Math.hypot(t.x - p.x, t.y - p.y); };
  mates.sort((x, y) => dist(x) - dist(y));
  let first = "";
  for (const q of mates) {
    const o = room.pdata.get(q)!, fi = fusionIndex(d.ch.vohon, o.ch.vohon); if (fi < 0) continue;
    const w = o.fus ? `${room.state.players.get(q)!.name} đang chờ một dung hợp khác` : fusionCheck(room, id, q, fi);
    if (w) { first ||= w; continue; }
    const def = FUSIONS[fi], qn = room.state.players.get(q)!.name;
    d.fus = { with: q, t: FUSION.window, init: true, fi }; o.fus = { with: id, t: FUSION.window, init: false, fi };
    room.clients.getById(q)?.send("fusion", { k: "ask", by: p.name, i: fi, t: FUSION.window });
    room.clients.getById(id)?.send("fusion", { k: "wait", to: qn, i: fi, t: FUSION.window });
    room.log(q, `${p.name} mời Võ Hồn Dung Hợp Kỹ ${def.name} [G]: hưởng ứng trong ${FUSION.window} giây.`, VOHON[p.vh].col);
    room.log(id, `Dung hợp kỹ ${def.name}: chờ ${qn} hưởng ứng trong ${FUSION.window} giây.`, VOHON[p.vh].col);
    return;
  }
  say(first || `không đồng đội nào ra trận ${pairs.map((f) => VOHON[Math.max(0, vohonIndex(f.pair[0] === d.ch.vohon ? f.pair[1] : f.pair[0]))].name).join(" / ")} để ghép cặp với ${VOHON[p.vh].name}`);
}

/** B gửi `fusion {op: "join"}` (#192): kiểm lại cả hai (fusionCheck với đúng cặp đã mời); hợp lệ thì tung, không thì hủy không tốn gì. */
export function fusionJoin(room: MapRoom, id: string) {
  const d = room.pdata.get(id), f = d?.fus; if (!d) return;
  if (!f || f.init) return room.log(id, "Dung hợp kỹ: chưa có lời mời dung hợp nào.", "#ffb35c");
  const why = fusionCheck(room, f.with, id, f.fi);
  if (why) return fusionCancel(room, id, `Dung hợp kỹ đã hủy: ${why} (không tốn gì).`);
  fusionFire(room, f.with, id, f.fi);
}

/** Hủy lời mời đang chờ của `id` và của đồng đội trong lời mời đó, báo cả hai `why`; không tốn gì. */
export function fusionCancel(room: MapRoom, id: string, why: string) {
  const d = room.pdata.get(id), f = d?.fus; if (!d || !f) return;
  d.fus = null;
  const o = room.pdata.get(f.with); if (o?.fus?.with === id) o.fus = null;
  for (const q of [id, f.with]) { room.clients.getById(q)?.send("fusion", { k: "cancel" }); room.log(q, why, "#ffb35c"); }
}

/**
 * Tung dung hợp kỹ `fi` của A (`a`, người mời, là người gây đòn) và B (`b`): mỗi người tốn FUSION.cost hồn lực, vào hồi chiêu FUSION.cd
 * của hồn sư. Sức mạnh: công = trung bình công võ hồn ra trận hai người (kể cả tăng công, không ràng buộc) × skillPower theo hồn hoàn
 * năm cao nhất thấp hơn giữa hai võ hồn; không sao, không Phục Chế, không năng lượng tiên cơ (runSkill không có `hit`). Các phần nổ ở
 * điểm giữa hai người (phần có `side` dời về phía người cầm võ hồn đó); đóng góp chia đôi (DmgOpt.pair). `fx fusion` công khai.
 */
export function fusionFire(room: MapRoom, a: string, b: string, fi: number) {
  const pa = room.state.players.get(a)!, da = room.pdata.get(a)!, pb = room.state.players.get(b)!, db = room.pdata.get(b)!, def = FUSIONS[fi];
  da.fus = null; db.fus = null;
  const now = Date.now(); for (const [k, t] of fusionReady) if (t <= now) fusionReady.delete(k); // dọn hồi chiêu đã hết của mọi tài khoản
  for (const [q, p, d] of [[a, pa, da], [b, pb, db]] as const) {
    d.mpF -= FUSION.cost; p.mp = Math.floor(d.mpF); fusionReady.set(d.accountId, Date.now() + FUSION.cd * 1000); room.unhide(p, d);
    void presenceBackend.putJson(fusionKey(d.accountId), fusionReady.get(d.accountId), FUSION.cd * 1000).catch((e) => console.error("Không lưu được hồi chiêu dung hợp trong presence", e));
    room.clients.getById(q)?.send("fusion", { k: "done", i: fi, cd: FUSION.cd });
  }
  const top = (d: PData) => Math.max(TIERS[0].years, ...d.ringYears), years = Math.min(top(da), top(db));
  const atk = (room.atkOf(da, false, "none") + room.atkOf(db, false, "none")) / 2, power = skillPower(years); // công trung bình, không ràng buộc
  const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }, col = TIERS[tierOfYears(years)].glow;
  // `va` / `vb`: võ hồn ra trận của A / B (màu luồng sáng, tiếng theo hệ ở client #193; người xem có thể không có A / B trong state, 11.4).
  room.broadcast("fx", { k: "fusion", id: a, to: b, x: Math.round(mid.x), y: Math.round(mid.y), i: fi, col, va: pa.vh, vb: pb.vh });
  for (const part of def.parts) {
    const h = part.side === undefined ? null : da.ch.vohon === def.pair[part.side] ? pa : pb;
    const at = h ? { x: (mid.x + h.x) / 2, y: (mid.y + h.y) / 2 } : mid;
    runSkill(room, a, part, power, 1, col, undefined, undefined, { at, pair: b, atk });
  }
  room.log(a, `Võ Hồn Dung Hợp Kỹ ${def.name} cùng ${pb.name}!`, col);
  room.log(b, `Võ Hồn Dung Hợp Kỹ ${def.name} cùng ${pa.name}!`, col);
  for (const q of [a, b]) room.questEvent(q, { k: "fusion" }); // #286: tính cho cả người mời lẫn người hưởng ứng
}

/** Trôi `dt` giây cho lời mời đang chờ (tick, hook `rest`): người mời hết giờ hoặc đồng đội đã rời thì hủy. */
export function tickFusion(room: MapRoom, id: string, dt: number) {
  const d = room.pdata.get(id), f = d?.fus; if (!d || !f) return;
  if (!room.pdata.has(f.with)) return fusionCancel(room, id, "Dung hợp kỹ đã hủy: đồng đội đã rời bản đồ (không tốn gì).");
  if ((f.t -= dt) <= 0 && f.init) fusionCancel(room, id, `Dung hợp kỹ đã hủy: hết ${FUSION.window} giây chờ hưởng ứng (không tốn gì).`);
}

/**
 * Kỹ năng chủ động của hồn cốt (mục 5.5, bước 4.3) ở nút `i` (BONE_ACTIVE_SLOTS: đầu, tay trái, tay phải) của võ hồn ĐANG RA TRẬN.
 * Kỹ năng theo loài hồn thú gốc (BONE_SKILLS), mạnh theo số năm hồn cốt (skillPower / buffPower như hồn kỹ), chạy bằng runSkill.
 * Mỗi nút một hồi chiêu riêng (`PlayerState.bcds`, thuộc hồn sư: đổi võ hồn không làm mới), tốn hồn lực. Cùng luật chặn với hồn kỹ:
 * gục, hấp thụ, đang chuyển bản đồ, vùng an toàn, Choáng / Câm lặng; kỹ năng đánh một mục tiêu mà không có hồn thú trong tầm thì
 * không tung (không tốn hồn lực, không hồi chiêu). Đang niệm đi cổng / truyền tống vẫn dùng được, không hủy niệm (mục 5.3, #270).
 */
export function boneSkill(room: MapRoom, c: Client, i: number) {
  const id = c.sessionId, p = room.state.players.get(id), d = room.pdata.get(id);
  if (!p || !d || p.dead || d.absorbing || d.travelling || !(Number.isInteger(i) && i >= 0 && i < BONE_ACTIVE_SLOTS.length)) return;
  const slot = BONE_SLOTS[boneSlotIndex(BONE_ACTIVE_SLOTS[i])];
  const bone = room.bonesOn(d, d.ch.rowId).find((b) => b.slot === slot.id);
  const k = bone ? boneSkillOf(bone.beast, bone.slot) : null;
  if (!bone || !k?.active) return room.log(id, `Ô ${slot.name} của ${VOHON[p.vh].name} chưa gắn hồn cốt có kỹ năng chủ động.`, "#ffb35c");
  if (room.map.inSafe(p.x, p.y)) return room.log(id, "Vùng an toàn: không thể giao chiến.", "#ffb35c");
  if (p.bcds[i] > 0) return;
  if (room.pctl(d).noSkill) return room.log(id, `Đang bị ${room.ccName(d)}: không dùng được kỹ năng hồn cốt.`, "#ffb35c");
  const sk = k.sk, cost = sk.cost * (1 - Math.min(0.9, room.buffV(d, "mp")));
  if (d.mpF < cost) return room.log(id, "Không đủ hồn lực.");
  const reach = sk.area === "target" ? sk.r : sk.at;
  if (reach && !room.nearestBeast(p, reach) && !room.nearestFoe(id, reach)) return room.log(id, `${sk.name}: không có ${room.foesOf(id).length ? "đối thủ" : "hồn thú"} trong tầm.`);
  d.mpF -= cost; p.mp = Math.floor(d.mpF); p.bcds[i] = sk.cd;
  room.unhide(p, d);
  const tier = tierOfYears(bone.years), col = TIERS[tier].glow;
  // Client tra tên kỹ năng theo loài (chỉ số BEASTS) và vị trí; `i` là nút, hào quang theo niên hạn hồn cốt.
  room.broadcast("fx", { k: "bone", id, i, sp: beastIndex(bone.beast), tier });
  // Mốc cường hóa +5 / +10 / +15 / +20 nâng kỹ năng (4.4): sức mạnh và hiệu ứng lên bản thân nhân boneSkillMult.
  const em = boneSkillMult(bone.enhance);
  runSkill(room, id, sk, skillPower(bone.years) * em, buffPower(bone.years) * em, col, { kind: "skill", done: false }, sk.self ? d.ch.vohon : undefined);
}