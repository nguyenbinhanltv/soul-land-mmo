// Chiêu có báo trước của hồn thú (GAME_DESIGN.md mục 5.3, 5.4; bước 3.5), tách khỏi MapRoom.ts (#702, bước 22):
// `beginCast` (khóa vùng, gửi `fx tele`), `tickCast`, `cancelCast`, `fireCast` (tính trúng, gây sát thương / trạng thái), `floorTeles`, `pullPlayer` / `dragPlayer`, `summonPack` (Hú Bầy).
// Hàm nhận phòng (`room: MapRoom`) như combat.ts; nguyên văn từ MapRoom, không đổi số / thứ tự RNG / thứ tự xử lý trong tick. MapRoom chỉ chuyển tiếp 8 hàm
// (`tick.ts`, `spawn.ts`, `boss.ts`, `ground.ts` gọi `room.beginCast` / `room.tickCast` ... như cũ). `*activeCasts` (tự săn đọc để né) ở lại MapRoom.
import { BeastState } from "./schema.ts";
import { TIERS, beastIndex, MAX_YEARS, rollYears, teleHits, teleSafe, TELE_FIRST, type BeastSkillDef, type Tele, teleZones, BOSSES, WORLD, SUMMON_RING } from "../../../shared/data.ts";
import { PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { floorSafeZones } from "./worldBoss.ts";
import type { MapRoom } from "./MapRoom.ts";
import type { BData } from "./types.ts";

/**
 * Hồn thú `bid` bắt đầu báo trước chiêu `s` nhắm hồn sư `pid`: khóa vùng (hướng vệt / nón, tâm vòng dưới chân mục tiêu) theo vị
 * trí lúc này, gửi `fx tele` (vùng và thời lượng) cho mọi người. Hồn thú đứng yên, không đánh thường cho tới khi tung.
 */
export function beginCast(room: MapRoom, bid: string, b: BeastState, bd: BData, s: BData["skills"][number], pid: string, tgt: { x: number; y: number }) {
  const def = s.def, ang = Math.atan2(tgt.y - b.y, tgt.x - b.x);
  // Từ BĐ4 một chiêu có thể có nhiều vùng (teleZones); fx gửi vùng đầu như 3.5, các vùng còn lại trong `parts`.
  // Từ BĐ5 vòng rơi ngẫu nhiên (`scatter`, Độc Châm Vũ) do server tung.
  const teles = def.floor ? room.floorTeles() : teleZones(def, b.x, b.y, tgt.x, tgt.y, Math.random);
  // Chiêu toàn sàn né được (#118): vòng an toàn rải trong sàn, khóa cùng lúc với vùng.
  const safe = def.floor && def.safe ? floorSafeZones(room.map, { x: bd.hx, y: bd.hy }, def.safe.n, def.safe.r, Math.random) : undefined;
  // Hồn thú đổi dạng (#173): trạng thái theo dạng lúc này (đổi dạng giữa lúc báo trước không đổi chiêu đang tung).
  const status = def.forms && bd.elite ? def.forms[bd.elite.form] : undefined;
  bd.cast = { def, teles, t: def.warn, target: pid, safe, status }; room.casting.add(bid);
  s.cd = def.cd * (0.8 + Math.random() * 0.4) * (bd.elite?.king?.world?.rage ? WORLD.rageCd : 1); // boss thế giới nổi giận: hồi chiêu nhanh hơn
  b.cast = true; b.moving = false; if (Math.abs(Math.cos(ang)) > 0.1) b.face = Math.cos(ang) > 0 ? 1 : -1;
  room.broadcast("fx", { k: "tele", bid, name: def.name, ...teles[0], parts: teles.slice(1), t: def.warn, ...(safe ? { safe } : {}) });
}

/**
 * Vùng của chiêu toàn sàn (BeastSkillDef.floor, BĐ6e): một dải phủ đúng chữ nhật sàn đấu (object `boss`), nên teleHits trúng đúng
 * người đứng trong sàn và client vẽ như mọi vệt. Vòng an toàn (BeastSkillDef.safe, #118) ở `cast.safe`, chọn trong beginCast.
 */
export function floorTeles(room: MapRoom): Tele[] {
  const l = room.map.lair; if (!l) return [];
  return [{ shape: "line", x: l.x, y: l.y + l.h / 2, ang: 0, r: l.w, w: l.h, arc: 0 }];
}

/** Bỏ chiêu đang báo trước (hồn thú bị Choáng / Câm lặng / Mê hoặc: "ngắt chiêu"); client xóa vùng cảnh báo. */
export function cancelCast(room: MapRoom, bid: string, b: BeastState, bd: BData) {
  if (!bd.cast) return;
  bd.cast = null; b.cast = false; bd.skT = Math.max(bd.skT, 1); b.brk = 0; b.chg = false;
  room.broadcast("fx", { k: "teleEnd", bid });
}

/**
 * Hết thời gian báo trước: tính trúng theo vị trí THẬT của mọi hồn sư lúc này (teleHits). Không trúng người đã gục, đang chuyển
 * bản đồ hay đứng trong vùng an toàn (mục 5.3), hay đứng trong vòng an toàn của chiêu toàn sàn (teleSafe, #118); hurtPlayer bỏ qua
 * người đang bất tử / miễn sát thương (khi đó cũng không dính trạng thái). Có `dash` thì hồn thú lao tới cuối vệt / tâm vòng (dừng
 * khi vướng, không vào vùng an toàn).
 */
export function fireCast(room: MapRoom, bid: string, b: BeastState, bd: BData) {
  const c = bd.cast!, def = c.def, x0 = b.x, y0 = b.y, main = c.teles[Math.floor(c.teles.length / 2)], base = room.beastDmg(bd);
  bd.cast = null; b.cast = false; bd.skT = Math.max(bd.skT, 1.2); b.brk = 0; b.chg = false;
  // Tích lực không bị ngắt (BĐ6e): cả sàn trúng, báo cho cả phòng.
  if (c.charge) room.broadcast("boss", { k: "chargeHit", bid, name: def.name });
  const hit: string[] = [];
  room.state.players.forEach((p, pid) => {
    const d = room.pdata.get(pid);
    if (d && !p.dead && !d.travelling && !room.map.inSafe(p.x, p.y) && c.teles.some((t) => teleHits(t, p.x, p.y))
      && !c.safe?.some((t) => teleSafe(t, p.x, p.y))) hit.push(pid);
  });
  if (def.dash && !bd.rooted) {
    // Nhiều vùng (BĐ4): lao theo vùng giữa.
    const tx = def.shape === "line" ? main.x + Math.cos(main.ang) * def.r : main.x, ty = def.shape === "line" ? main.y + Math.sin(main.ang) * def.r : main.y;
    const hw = Math.max(3, TIERS[b.tier].size / 3), n = Math.ceil(Math.hypot(tx - b.x, ty - b.y) / 6);
    for (let k = 0; k < n; k++) room.moveBeast(b, (tx - x0) / n, (ty - y0) / n, hw);
  }
  room.broadcast("fx", { k: "teleHit", bid, name: def.name, ...c.teles[0], parts: c.teles.slice(1), hit, x0, y0, x1: b.x, y1: b.y, ...(c.safe ? { safe: c.safe } : {}) });
  for (const pid of hit) {
    const rooted = !!def.drain && !!room.pdata.get(pid)?.st.has("root"); // BĐ6b Hút Sinh: xét Trói trước khi chiêu gây trạng thái mới
    if (!room.hurtPlayer(pid, base * def.dmg * (0.9 + Math.random() * 0.2))) continue;
    for (const a of c.status ?? def.status ?? []) room.applyPStatus(pid, a, base);
    if (def.pull) room.pullPlayer(pid, b, def.pull);
    if (rooted && b.hp > 0) {
      const add = Math.min(b.maxHp - b.hp, Math.ceil(b.maxHp * def.drain!));
      if (add > 0) { b.hp += add; room.broadcast("dmg", { x: b.x, y: b.y - 10, v: add, c: "#7dff8a" }); } // số xanh: hồi máu
    }
  }
  if (def.eggs) room.eggs.lay(bid, b, def.eggs); // #162: đẻ bọc trứng, phá kịp thì không nở
  if (def.summon) room.summonPack(b, bd, def.summon, c.target);
  if (def.ground) room.grounds.add(bid, def.ground, c.teles, base); // #161: vũng / sương độc lưu lại
}

/** Kéo hồn sư `id` về phía hồn thú `b` tối đa `dist` pixel (Quấn Kéo, Lưỡi Quất; BĐ4): dừng khi vướng, sát hồn thú hoặc sắp vào vùng an toàn. */
export function pullPlayer(room: MapRoom, id: string, b: BeastState, dist: number) {
  const p = room.state.players.get(id); if (!p) return;
  room.dragPlayer(id, b.x, b.y, Math.min(dist, Math.hypot(b.x - p.x, b.y - p.y) - TIERS[b.tier].size / 2 - 8));
}

/**
 * Kéo hồn sư `id` thẳng về phía (tx, ty) tối đa `dist` pixel, không quá điểm đó (bước tối đa 2 pixel): dừng khi vướng hoặc sắp vào vùng
 * an toàn; không kéo người đã gục / đang đi cổng / đang đứng trong vùng an toàn. Dùng cho chiêu có `pull` (pullPlayer) và xoáy nước
 * (GroundDef.pull, #174).
 */
export function dragPlayer(room: MapRoom, id: string, tx: number, ty: number, dist: number) {
  const p = room.state.players.get(id), d = room.pdata.get(id); if (!p || !d || p.dead || d.travelling || room.map.inSafe(p.x, p.y)) return;
  const dd = Math.hypot(tx - p.x, ty - p.y), go = Math.min(dist, dd); if (go <= 0) return;
  const ux = (tx - p.x) / dd, uy = (ty - p.y) / dd;
  for (let moved = 0; moved < go; moved += 2) {
    const ox = p.x, oy = p.y, st = Math.min(2, go - moved);
    room.map.moveEnt(p, ux * st, uy * st, PLAYER_HW, PLAYER_HH);
    if (room.map.inSafe(p.x, p.y)) { p.x = ox; p.y = oy; break; }
    if (p.x === ox && p.y === oy) break;
  }
}

/**
 * Gọi bầy (Hú Bầy; BeastSkillDef.summon, BĐ4): thêm hồn thú loài `s.species` quanh thân tới khi đủ `s.n` con do hồn thú này gọi còn
 * sống. Hồn thú gọi ra thuộc vùng của người gọi (tính vào `count` của vùng, nên vùng không sinh thêm cho tới khi chúng bị hạ), tuổi tung
 * trong `years` của vùng, lao ngay vào mục tiêu của người gọi.
 */
export function summonPack(room: MapRoom, b: BeastState, bd: BData, s: NonNullable<BeastSkillDef["summon"]>, target: string) {
  const sp = beastIndex(s.species), z = room.map.zones[bd.zone]; if (sp < 0 || !z) return;
  for (const m of bd.minions) if (!room.state.beasts.has(m)) bd.minions.delete(m);
  for (let tries = 0; bd.minions.size < s.n && tries < 20; tries++) {
    const a = Math.random() * Math.PI * 2, x = b.x + Math.cos(a) * SUMMON_RING.rx, y = b.y + Math.sin(a) * SUMMON_RING.ry;
    if (room.map.hits(x, y, 6, 4) || room.map.inSafe(x, y)) continue;
    // Thú vương gọi nhện con trẻ hơn (summon.years); hồn thú gọi ra là hồn thú thường nên không bao giờ đúng MAX_YEARS (mục 5.3).
    const yr = s.years ?? z.years, years = Math.min(MAX_YEARS - 1, yr ? rollYears(yr[0], yr[1], Math.random()) : b.years);
    const mid = room.addBeast(bd.zone, years, sp, x, y), mb = room.bdata.get(mid)!;
    if (room.state.players.has(target)) { mb.target = target; room.state.beasts.get(mid)!.aggro = true; mb.skT = TELE_FIRST[1]; }
    bd.minions.add(mid);
    room.broadcast("fx", { k: "wave", x, y, r: 14, col: b.rank ? BOSSES[b.species]?.aura : TIERS[b.tier].glow });
  }
}

/** Mỗi tick của hồn thú đang báo trước: Choáng / Câm lặng / Mê hoặc ngắt chiêu; hết giờ thì tung. */
export function tickCast(room: MapRoom, bid: string, b: BeastState, bd: BData, dt: number, interrupt: boolean) {
  if (!bd.cast) return;
  if (interrupt) return room.cancelCast(bid, b, bd);
  if ((bd.cast.t -= dt) <= 0) room.fireCast(bid, b, bd);
}
