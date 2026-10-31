// Hạ hồn thú (GAME_DESIGN.md mục 5.2, 5.4, 5.9), tách khỏi MapRoom.ts (#702, bước 24): `killBeast` (kinh nghiệm, Hồn Tệ, đồ rơi, khóa tinh anh, chia tổ đội).
// Hàm nhận phòng (`room: MapRoom`) như loot.ts; nguyên văn từ MapRoom, không đổi thứ tự xử lý / thứ tự gọi RNG (`roll*` giữ thứ tự cũ). MapRoom chỉ chuyển tiếp `killBeast`.
import { TIERS, BEASTS, beastIndex, formatHonTe, formatYears, DROP_OWNER_SECS, BOSSES, ELITE, beastName, fitBeast, partyXpShare } from "../../../shared/data.ts";
import { achvCount } from "./achv.ts";
import { type MapRoom } from "./MapRoom.ts";
import { persistEliteLock } from "./presenceState.ts";
import { eliteLocks, eliteKey, eliteLockLeft } from "./procState.ts";
import { uid } from "./common.ts";

/**
 * Hạ hồn thú: kinh nghiệm, Hồn Tệ, và hồn hoàn rơi xuống đất mang đúng số năm của hồn thú (mục 5.2); người hạ được ưu tiên nhặt.
 * Tinh anh (mục 5.4, BĐ4): kinh nghiệm x ELITE.xp cho người hạ; hồn hoàn và hồn cốt ưu tiên người đóng góp nhiều nhất còn trong
 * phòng; tỉ lệ hồn cốt x ELITE.bone, hồn cốt mang loài gốc; chắc chắn rơi 1 hồn hạch (từ 5.1).
 * Tổ đội (mục 5.9, bước 7.1): kinh nghiệm (kể cả x ELITE.xp của tinh anh) chia cho người hạ và đồng đội trong PARTY_XP_RANGE
 * (partyNear), mỗi người partyXpShare(n) phần gốc, rồi từng người tự giảm theo chênh cấp và chia 40/20 (rewardKill). Hồn Tệ, mảnh
 * vào túi vẫn chỉ của người hạ. Đồ rơi ưu tiên cả tổ đội của người được ưu tiên (newDrop chụp id tổ đội).
 */
export function killBeast(room: MapRoom, bid: string, by: string) {
  if (room.eggs.has(bid)) return room.eggs.broke(bid, by); // bọc trứng (#162): vỡ, không nở, không thưởng
  const b = room.state.beasts.get(bid)!, e = room.bdata.get(bid)?.elite, zone0 = room.bdata.get(bid)?.zone; // zone0: vùng sinh thật (B2 tự săn nhớ chỗ hồi sinh)
  const td = TIERS[b.tier], name = beastName(b.rank, b.species), age = formatYears(b.years);
  room.state.beasts.delete(bid); room.bdata.delete(bid);
  // 6.2: vùng săn tính theo chỗ hồn thú bị hạ (khung vùng trong Tiled).
  const zone = room.map.zones.find((z) => b.x >= z.x0 && b.x < z.x1 && b.y >= z.y0 && b.y < z.y1)?.name;
  const fit = (pid: string) => fitBeast(room.state.players.get(pid)?.level ?? 1, b.years); // khảo hạch hằng ngày: hồn thú hợp cấp của từng người
  const team = room.partyNear(by, b.x, b.y), grp = team.length > 1; // #256: cờ `party` của mục tiêu hạ hồn thú: từ 2 người chia kinh nghiệm
  room.questEvent(by, { k: "kill", map: room.state.mapId, zone, fit: fit(by), party: grp });
  if (e?.king) return room.killKing(bid, b, e, by); // tà hóa thú vương (BĐ5): thưởng theo đóng góp, rương
  const p = room.state.players.get(by)!; p.kills++;
  const ad = room.pdata.get(by); if (ad?.auto && !b.rank) ad.auto.killed(room.offlinePower(ad, p), b.years, BEASTS[b.species]?.id ?? "", zone0); // trần tốc độ tự săn
  const share = partyXpShare(team.length);
  // Giới hạn săn tinh anh nhiều kênh (#119, mục 5.4): tài khoản đã nhận thưởng loài tinh anh này trên bản đồ này trong ELITE.lock giây
  // (ở bất kỳ kênh nào) thì lần này chỉ nhận như hồn thú thường; ai nhận thưởng tinh anh lần này thì bị khóa ELITE.lock giây.
  const now = Date.now(), lockKey = e ? eliteKey(room.state.mapId, b) : "";
  const accOf = (pid: string) => room.pdata.get(pid)?.accountId ?? -1;
  const left = new Map<string, number>(); // chụp trước khi ghi khóa của lần này
  const lockLeft = (pid: string) => { if (!e) return 0; let v = left.get(pid); if (v === undefined) left.set(pid, v = eliteLockLeft(lockKey, accOf(pid), now)); return v; };
  const free = (pid: string) => !lockLeft(pid);
  const owner = e ? room.topContrib(e, by, false, free) : by; // 9.2: đóng góp tổng (sát thương + hỗ trợ); #119: người chưa bị khóa
  const byFree = free(by); // chụp trước khi ghi khóa của lần này
  // Người đứng đầu đóng góp bị khóa thì quyền ưu tiên sang người kế tiếp: câu báo không được nói "đóng góp nhiều nhất".
  const why = e && owner && owner !== room.topContrib(e, by) ? "đóng góp nhiều nhất trong số người chưa bị khóa thưởng tinh anh" : "đóng góp nhiều nhất";
  const got = new Set<string>(); // người nhận thưởng tinh anh lần này (kinh nghiệm x ELITE.xp, quyền ưu tiên đồ rơi tinh anh)
  for (const pid of team) {
    const full = !!e && free(pid); if (full) got.add(pid);
    room.rewardKill(pid, b.years, (full ? ELITE.xp : 1) * share);
  }
  if (owner) got.add(owner);
  if (e) {
    const notice = new Set([...team, ...room.contributors(e).filter((pid) => room.state.players.has(pid))]);
    for (const pid of notice) {
      const l = lockLeft(pid); if (!l || got.has(pid)) continue;
      room.log(pid, `Đã nhận thưởng ${name} trên bản đồ này chưa lâu (kênh nào cũng tính): còn ${Math.ceil(l / 60)} phút mới nhận lại; lần này chỉ thưởng như hồn thú thường.`, "#ffb35c");
    }
    let m = eliteLocks.get(lockKey); if (!m) { m = new Map(); eliteLocks.set(lockKey, m); }
    for (const pid of got) { m.set(accOf(pid), now + ELITE.lock * 1000); achvCount(room, pid, "elite"); } // Thành Tựu: chỉ người nhận thưởng tinh anh (khóa ELITE.lock giây chặn đếm lặp)
    void persistEliteLock(lockKey, m).catch((err) => console.error("Không lưu được khóa tinh anh trong presence", err));
  }
  const elite = !!e && !!owner, drOwner = owner ?? by; // elite: còn người nhận đồ rơi tinh anh (hồn cốt x ELITE.bone, chắc chắn hồn hạch)
  // 6.2 + 7.1: đồng đội cùng chia kinh nghiệm (cùng phòng, trong PARTY_XP_RANGE) cũng được tính mục tiêu hạ hồn thú của nhiệm vụ.
  for (const pid of team) if (pid !== by) room.questEvent(pid, { k: "kill", map: room.state.mapId, zone, fit: fit(pid), party: grp });
  if (e) for (const pid of team) room.questEvent(pid, { k: "elite", map: room.state.mapId }); // #256 (#284: kèm bản đồ): người hạ và đồng đội được chia kinh nghiệm cùng tính "tham gia hạ tinh anh"
  if (team.length > 1) {
    const names = team.map((pid) => room.state.players.get(pid)?.name ?? "").join(", ");
    for (const pid of team) room.log(pid, `Tổ đội ${team.length} người chia kinh nghiệm hạ ${name} (${names}): mỗi người ${(share * 100).toFixed(1).replace(".", ",")}% phần gốc.`, "#7dff8a");
  }
  const coin = room.rewardCoin(by, b.tier);
  const drop = room.newDrop(b.x, b.y, drOwner);
  drop.tier = b.tier; drop.years = b.years;
  room.state.drops.set(uid("d"), drop);
  room.broadcast("fx", { k: "wave", x: b.x, y: b.y, r: td.size + 10, col: td.glow });
  room.log(by, `Hạ ${name} (${age}), nhận ${formatHonTe(coin)} Hồn Tệ. Hồn hoàn ${age} rơi xuống đất: ${room.lootNote(drOwner, by, why)}`, td.glow);
  if (drOwner !== by) room.log(drOwner, `Bạn ${why} khi hạ ${name}: hồn hoàn ${age} ưu tiên bạn nhặt ${DROP_OWNER_SECS} giây đầu (phím E).`, td.glow);
  if (e) room.broadcast("elite", { k: "down", name, by: p.name, col: BOSSES[b.species]?.aura });
  room.rollShard(by, b.years, b.x, b.y);
  room.rollHerb(by, zone, b.x, b.y, !!e && byFree);
  const base = e ? Math.max(0, beastIndex(BOSSES[b.species]?.species ?? "")) : b.species;
  room.rollBone(by, drOwner, base, b.years, b.tier, b.x, b.y, elite ? ELITE.bone : 1, why);
  room.rollCoreDrop(by, drOwner, b.years, b.x, b.y, elite, why);
  room.rollEquipGround(by, drOwner, elite ? 1 : 0, b.x, b.y, why);
}
