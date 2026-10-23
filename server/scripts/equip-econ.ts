// Ước lượng kinh tế trang bị hồn sư (mục 5.15, E0): rơi / giờ theo bản đồ, chi phí cường hóa, so với hồn cốt / hồn hạch.
// Không cần bật server; số ra là ước lượng theo giả định ở đầu file, dùng để duyệt bảng số trong shared/data.ts, KHÔNG phải đo thật.
// Chạy: npm run econ:equip --prefix server   (thêm --md để in bảng Markdown)
import {
  MAPS, TIERS, BEAST_COIN, rollYears, tierOfYears, ELITE, KING, WORLD,
  EQUIP_MAPS, EQUIP_TIERS, EQUIP_STONES, EQUIP_ENHANCE, EQUIP_SYNTH, EQUIP_SYNTH_KEEP, EQUIP_MAX_ENHANCE, EQUIP_CHARM, EQUIP_DROP,
  equipEnhanceStep, equipEnhanceMult, equipIlvlK, equipStats, equipSalvage, rollEquipDrop, rollEquipCharm,
  calcStats, VOHON, CORE_STATS, CORE_STAT_IDS, CORE_STAR_K, CORE_ENHANCE_MAIN, CORE_SUBS, CORE_SUB_ROLL, BONE_ENHANCE_FEE, CORE_ENHANCE_FEE,
  boneStats, BONE_SLOTS, BONE_ENHANCE_STAT, type CoreStat, type EquipInput,
} from "../../shared/data.ts";

// ---------- Giả định (đổi ở đây rồi chạy lại) ----------
/** Hồn thú thường hạ mỗi giờ khi săn tập trung (≈ 7 giây một con, gồm đi lại, hồi sinh lực). */
const TRASH_PER_HOUR = 500;
/** Tinh anh hạ mỗi giờ (hồi sinh 480–720 giây, một điểm tinh anh; khoá ELITE.lock chung mọi kênh). */
const ELITE_PER_HOUR = 5;
/** Số lần hạ thú vương / boss thế giới mỗi ngày (KING.daily = 3 rương/ngày; KING_TIMES 2 lần; WORLD.daily = 1). */
const KING_PER_DAY = 2, WORLD_PER_DAY = 1;
/** Số giờ chơi hiệu quả mỗi ngày dùng để quy đổi "ngày". */
const HOURS_PER_DAY = 3;

const md = process.argv.includes("--md");
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toLocaleString("vi-VN", { maximumFractionDigits: d, minimumFractionDigits: 0 }) : "∞");
const row = (cells: (string | number)[]) => (md ? `| ${cells.join(" | ")} |` : cells.map((c) => String(c).padStart(11)).join(" "));
const head = (cells: string[]) => (md ? `${row(cells)}\n|${cells.map(() => "---").join("|")}|` : row(cells));
const title = (t: string) => console.log(`\n${md ? "### " : "== "}${t}${md ? "" : " =="}\n`);

// ---------- 1. Rơi mỗi giờ theo bản đồ ----------
const hunts = Object.values(MAPS).filter((m) => m.kind === "hunt");
const avgCoin = (tier: number) => (BEAST_COIN[tier][0] + BEAST_COIN[tier][1]) / 2;
interface Income { coin: number; items: number[]; stones: number[]; salvCoin: number; salvStones: number[]; essence: number; soul: number }
function simulate(rank: number, mapId: string, kills: number, seed: number): Income {
  const r = rng(seed), out: Income = { coin: 0, items: Array(6).fill(0), stones: Array(5).fill(0), salvCoin: 0, salvStones: Array(5).fill(0), essence: 0, soul: 0 };
  for (let i = 0; i < kills; i++) {
    for (const d of rollEquipDrop(rank, mapId, r)) {
      if (d.kind === "stone") out.stones[EQUIP_STONES.findIndex((s) => s.id === d.code)] += d.qty;
      else {
        const tier = Number(EQUIP_TIERS.findIndex((t) => d.item.tpl.endsWith(t.id)));
        out.items[tier]++;
        const sv = equipSalvage(tier, 0, r); out.salvCoin += sv.coin;
        for (const m of sv.items) { const si = EQUIP_STONES.findIndex((s) => s.id === m.code); if (si >= 0) out.salvStones[si] += m.qty; else if (m.code === "tinh_hoa_duong_mon") out.essence += m.qty; else out.soul += m.qty; }
      }
    }
  }
  const per = (a: number) => a / kills;
  out.items = out.items.map(per); out.stones = out.stones.map(per); out.salvStones = out.salvStones.map(per); out.salvCoin = per(out.salvCoin); out.essence = per(out.essence); out.soul = per(out.soul);
  return out;
}
const N = 200000;
const hourly: Record<string, { coin: number; items: number[]; stones: number[]; salvCoin: number; salvStones: number[]; essence: number; soul: number }> = {};
title("1. Thu nhập mỗi giờ săn tập trung (thường " + TRASH_PER_HOUR + " + tinh anh " + ELITE_PER_HOUR + " con/giờ), chưa tính thú vương / boss");
console.log(head(["Bản đồ", "Hồn Tệ gốc", "T0", "T1", "T2", "T3", "T4", "T5", "Đá I", "Đá II", "Đá III", "Đá IV", "Đá V", "HT phân giải"]));
hunts.forEach((m, mi) => {
  const [lo, hi] = m.years!, r = rng(mi + 7);
  let coin = 0; for (let i = 0; i < 20000; i++) coin += avgCoin(tierOfYears(rollYears(lo, hi, r())));
  coin = (coin / 20000) * TRASH_PER_HOUR + avgCoin(tierOfYears(hi)) * ELITE_PER_HOUR;
  const a = simulate(0, m.id, N, mi + 100), b = simulate(1, m.id, N, mi + 200);
  const w = (x: number[], y: number[]) => x.map((v, i) => v * TRASH_PER_HOUR + y[i] * ELITE_PER_HOUR);
  const items = w(a.items, b.items), stones = w(a.stones, b.stones), salvStones = w(a.salvStones, b.salvStones);
  const salvCoin = a.salvCoin * TRASH_PER_HOUR + b.salvCoin * ELITE_PER_HOUR;
  hourly[m.id] = { coin, items, stones, salvCoin, salvStones, essence: a.essence * TRASH_PER_HOUR + b.essence * ELITE_PER_HOUR, soul: 0 };
  console.log(row([m.name, f(coin, 0), ...items.map((x) => f(x, 2)), ...stones.map((x) => f(x, 1)), f(salvCoin, 0)]));
});

title("2. Thú vương và boss thế giới (mỗi lần hạ, phần của một người nhận rương theo đóng góp)");
console.log(head(["Loại", "T0", "T1", "T2", "T3", "T4", "T5", "Đá I", "Đá II", "Đá III", "Đá IV", "Đá V", "Bùa"]));
const bossRows: Record<string, Income & { charm: number }> = {};
for (const [name, rank, mapId] of [["Thú vương Nội địa", 2, "tinh_dau_noi_dia"], ["Thú vương Cực Bắc", 2, "cuc_bac_chi_dia"], ["Thú vương Hải Thần", 2, "hai_than_dao"], ["Boss thế giới", 3, "loi_tinh_dau"]] as const) {
  const s = simulate(rank, mapId, 100000, rank * 31), charm = EQUIP_DROP.ranks[rank].charm;
  bossRows[name] = { ...s, charm };
  console.log(row([name, ...s.items.map((x) => f(x, 2)), ...s.stones.map((x) => f(x, 1)), f(charm, 2)]));
}

// ---------- 2. Chi phí cường hóa (chuỗi Markov, mô hình nghiêm: luôn cố tới đích; +13–15 luôn dùng 1 bùa mỗi lần thất bại) ----------
function expectedCost(target: number, from = 0) {
  const attempts = Array(EQUIP_MAX_ENHANCE + 1).fill(0), stone = Array.from({ length: 5 }, () => Array(EQUIP_MAX_ENHANCE + 1).fill(0));
  const fee = Array(EQUIP_MAX_ENHANCE + 1).fill(0), charm = Array(EQUIP_MAX_ENHANCE + 1).fill(0);
  for (let it = 0; it < 4000; it++) for (let l = target - 1; l >= 0; l--) {
    const s = equipEnhanceStep(l)!, fail = s.fail.kind === "keep" || s.fail.kind === "destroy" ? l : s.fail.kind === "down" ? Math.max(0, l - s.fail.n) : Math.min(l, s.fail.to);
    const nx = (a: number[]) => s.p * (l + 1 >= target ? 0 : a[l + 1]) + (1 - s.p) * a[fail];
    attempts[l] = 1 + nx(attempts); fee[l] = s.fee + nx(fee); charm[l] = (s.fail.kind === "destroy" ? 1 - s.p : 0) + nx(charm);
    for (let j = 0; j < 5; j++) stone[j][l] = (s.stone === j ? s.qty : 0) + nx(stone[j]);
  }
  return { attempts: attempts[from], fee: fee[from], charm: charm[from], stone: stone.map((a) => a[from]) };
}
title("3. Chi phí kỳ vọng cường hóa 1 món từ +0 (theo bảng EQUIP_ENHANCE; mỗi lần cố đều tốn đá + phí)");
console.log(head(["Đích", "Lần cố", "Hồn Tệ", "Đá I", "Đá II", "Đá III", "Đá IV", "Đá V", "Bùa"]));
const costs: Record<number, ReturnType<typeof expectedCost>> = {};
for (const t of [3, 6, 9, 10, 12, 13, 14, 15]) {
  const c = costs[t] = expectedCost(t);
  console.log(row(["+" + t, f(c.attempts, 1), f(c.fee, 0), ...c.stone.map((x) => f(x, 0)), f(c.charm, 1)]));
}
console.log(`\nKhông có bùa, xác suất đi từ +12 tới +15 mà không phá hủy: ${f(Math.pow(EQUIP_ENHANCE[4].p, 3) * 100, 4)} %`);

// ---------- 3. Thời gian lên +10 và +15 (một món), chỉ săn ở một bản đồ ----------
title("4. Số giờ săn ở từng bản đồ để gom đủ nguyên liệu và Hồn Tệ cho MỘT món lên +10 (tiêu hết đá, kể cả đá có từ phân giải đồ rơi)");
console.log(head(["Bản đồ", "Giờ (đá)", "Giờ (Hồn Tệ)", "Nút thắt", "Ngày (" + HOURS_PER_DAY + "h)"]));
for (const m of hunts) {
  const h = hourly[m.id], need = costs[10];
  const stoneH = h.stones.map((x, i) => x + h.salvStones[i]);
  const hours = need.stone.map((n, i) => (n <= 0 ? 0 : stoneH[i] > 0 ? n / stoneH[i] : Infinity));
  const hs = Math.max(...hours), hc = need.fee / (h.coin + h.salvCoin), worst = hours.indexOf(hs);
  console.log(row([m.name, f(hs, 1), f(hc, 1), hs >= hc ? `Đá ${["I", "II", "III", "IV", "V"][worst]}` : "Hồn Tệ", f(Math.max(hs, hc) / HOURS_PER_DAY, 1)]));
}
title("5. Lên +15 (một món) bằng bùa: số ngày chỉ riêng chờ bùa và Đá V");
const c15 = costs[15], charmDay = bossRows["Thú vương Hải Thần"].charm * KING_PER_DAY + bossRows["Boss thế giới"].charm * WORLD_PER_DAY;
const vDay = bossRows["Thú vương Hải Thần"].stones[4] * KING_PER_DAY + bossRows["Boss thế giới"].stones[4] * WORLD_PER_DAY
  + (hourly["hai_than_dao"].stones[4] + hourly["hai_than_dao"].salvStones[4]) * HOURS_PER_DAY;
console.log(`Bùa cần ${f(c15.charm, 1)}; bùa kiếm ${f(charmDay, 2)}/ngày (KING ${KING_PER_DAY} + WORLD ${WORLD_PER_DAY} lần/ngày) → ${f(c15.charm / charmDay, 0)} ngày`);
console.log(`Đá V cần ${f(c15.stone[4], 0)}; kiếm ${f(vDay, 1)}/ngày (săn Hải Thần ${HOURS_PER_DAY}h + boss) → ${f(c15.stone[4] / vDay, 0)} ngày; Hồn Tệ ${f(c15.fee, 0)}`);

// ---------- 4. Hợp thành: số món kỳ vọng ----------
title("6. Hợp thành: số món đầu vào kỳ vọng cho 1 món ra (1 chính + 2 hiến tế mỗi lần thử; thất bại mất 2 hiến tế, T4→T5 mất cả 3)");
console.log(head(["Bước", "Tỉ lệ", "Món vào / món ra", "Hồn Tệ / món ra", "Tinh Hoa / món ra"]));
let cum = 1;
for (const s of EQUIP_SYNTH) {
  const tries = 1 / s.p, real = s.all ? 3 * tries : 1 + 2 * tries;
  cum *= real;
  console.log(row([`T${s.from}→T${s.from + 1}`, `${f(s.p * 100, 0)}%`, f(real, 1), f(s.fee * tries, 0), f(s.essence * tries - s.refund * s.essence * (tries - 1), 1)]));
}
console.log(`\nChỉ bằng hợp thành, 1 món T5 cần ${f(cum, 0)} món T0 (chỉ minh hoạ: thực tế T5 chủ yếu từ boss thế giới).`);

// ---------- 5. So sức mạnh: trang bị với hồn cốt / hồn hạch ----------
title("7. Sức mạnh trang bị so với hồn cốt / hồn hạch (võ hồn Cường công 1★, hồn hoàn theo cấp; % tăng so với chính võ hồn đó khi chưa gắn gì)");
const vh = VOHON.findIndex((v) => v.he === "cuong_cong");
const SLOT_IDS = ["vu_khi", "mu", "ao", "dai", "giay", "day_chuyen", "vong_trai", "vong_phai", "nhan_trai", "nhan_phai"];
/** Cả bộ 10 ô cùng bậc / cấp vật phẩm / cấp cường hóa, dòng phụ trung bình (mỗi mã khác chỉ số chính chia đều, mức giữa 0,85). */
function fullSet(tier: number, ilvl: number, enh: number) {
  const s = equipStats(SLOT_IDS.map((x): EquipInput => ({ tpl: `${x}_${EQUIP_TIERS[tier].id}`, ilvl, enhance: enh, roll: 0, affixes: [] })));
  for (const k of CORE_STAT_IDS) s.bonus[k] += (EQUIP_TIERS[tier].lines * 10 / (CORE_STAT_IDS.length - 1)) * CORE_STATS[k].sub * EQUIP_TIERS[tier].lineK * equipIlvlK(ilvl) * 0.85;
  return s;
}
/** Một bộ hồn hạch `stars`★ +enh kỳ vọng (chỉ số chính theo trọng số, dòng phụ chia đều các mã khác). */
function avgCores(stars: number, enh: number, n = 6) {
  const out = Object.fromEntries(CORE_STAT_IDS.map((k) => [k, 0])) as Record<CoreStat, number>, wsum = CORE_STAT_IDS.reduce((a, k) => a + CORE_STATS[k].w, 0), k = CORE_STAR_K[stars - 1];
  for (const x of CORE_STAT_IDS) {
    out[x] += n * (CORE_STATS[x].w / wsum) * CORE_STATS[x].main * k * (1 + CORE_ENHANCE_MAIN * enh);
    out[x] += n * CORE_SUBS[stars - 1] / (CORE_STAT_IDS.length - 1) * (1 - CORE_STATS[x].w / wsum) * CORE_STATS[x].sub * k * ((CORE_SUB_ROLL[0] + CORE_SUB_ROLL[1]) / 2);
  }
  return out;
}
function avgBones(years: number, enh: number) {
  const out: Partial<Record<CoreStat, number>> = {};
  for (const s of BONE_SLOTS) for (const [k, v] of Object.entries(boneStats(s.id, years, enh))) out[k as CoreStat] = (out[k as CoreStat] ?? 0) + (v as number);
  return out;
}
function gain(level: number, rings: number[], o: { cores?: Partial<Record<CoreStat, number>>; bones?: Partial<Record<CoreStat, number>>; eq?: ReturnType<typeof equipStats> }) {
  const base = calcStats(vh, level, rings), c = { ...(o.cores ?? {}) } as Record<CoreStat, number>;
  if (o.eq) { for (const k of CORE_STAT_IDS) c[k] = (c[k] ?? 0) + o.eq.bonus[k]; if (o.eq.weapon) c.atk += (o.eq.weapon.min + o.eq.weapon.max) / 2; }
  const g = calcStats(vh, level, rings, 1, o.bones ?? {}, c);
  return { hp: (g.maxHp / base.maxHp - 1) * 100, atk: (g.atk / base.atk - 1) * 100, mp: (g.maxMp / base.maxMp - 1) * 100, crit: (g.crit - base.crit) * 100, red: (o.eq?.red ?? 0) * 100 };
}
const ref = [
  { name: "Cấp 30 (4 vòng; Ngoại vi)", lv: 30, rings: [1, 2, 2, 3], eq: [[0, 2, 0], [1, 2, 3], [2, 2, 3]], cores: [3, 3], bone: [1000, 0] },
  { name: "Cấp 60 (7 vòng; Lạc Nhật / Cực Bắc)", lv: 60, rings: [1, 2, 2, 3, 3, 3, 4], eq: [[2, 3, 6], [3, 4, 9], [4, 5, 9]], cores: [5, 6], bone: [10000, 6] },
  { name: "Cấp 100 (9 vòng; Hải Thần / Lõi)", lv: 100, rings: [1, 2, 2, 3, 3, 3, 4, 4, 4], eq: [[3, 6, 10], [4, 6, 12], [5, 7, 15]], cores: [6, 12], bone: [100000, 12] },
];
console.log(head(["Mốc", "Bộ", "Sinh lực %", "Công %", "Hồn lực %", "Chí mạng", "Giảm ST"]));
for (const r of ref) {
  const gb = gain(r.lv, r.rings, { bones: avgBones(r.bone[0], r.bone[1]) }), gc = gain(r.lv, r.rings, { cores: avgCores(r.cores[0], r.cores[1]) });
  console.log(row([r.name, `6 hồn cốt ${f(r.bone[0], 0)}y +${r.bone[1]}`, f(gb.hp), f(gb.atk), f(gb.mp), f(gb.crit), "-"]));
  console.log(row(["", `6 hồn hạch ${r.cores[0]}★ +${r.cores[1]}`, f(gc.hp), f(gc.atk), f(gc.mp), f(gc.crit), "-"]));
  for (const [t, il, en] of r.eq) { const x = gain(r.lv, r.rings, { eq: fullSet(t, il, en) }); console.log(row(["", `10 trang bị T${t} +${en} ilvl ${il}`, f(x.hp), f(x.atk), f(x.mp), f(x.crit), f(x.red) + "%"])); }
}
console.log(`\nPhí cường hóa để so: hồn cốt 0→+20 tổng ${f(BONE_ENHANCE_FEE.reduce((a, x) => a + x, 0), 0)} đồng và hồn hạch 0→+15 tổng ${f(CORE_ENHANCE_FEE.reduce((a, x) => a + x, 0), 0)} đồng cho mỗi món (không bao giờ thất bại).`);
console.log(`Hệ số cường hóa: trang bị +5 ×${f(equipEnhanceMult(5), 2)}, +10 ×${f(equipEnhanceMult(10), 2)}, +15 ×${f(equipEnhanceMult(15), 2)}; hồn cốt +10 ×${f(1 + BONE_ENHANCE_STAT * 10, 2)}, +20 ×${f(1 + BONE_ENHANCE_STAT * 20, 2)}; hồn hạch +15 ×${f(1 + CORE_ENHANCE_MAIN * 15, 2)}.`);
void [TIERS, ELITE, KING, WORLD, EQUIP_MAPS, EQUIP_CHARM, EQUIP_SYNTH_KEEP, rollEquipCharm];
