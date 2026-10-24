// Giả lập kinh tế trang bị hồn sư THEO THỜI GIAN CHƠI (E7, #418): một người chơi tự động săn, mặc, hợp thành, cường hóa, phân giải mỗi ngày.
// Khác `equip-econ.ts` (kỳ vọng từng khâu): ở đây có đủ vòng lặp rơi → mặc → hợp thành → cường hóa → phân giải, Hồn Tệ vào / ra theo ngày,
// và phần B so sức mạnh đấu trường. Dùng đúng hàm / bảng của `shared/data.ts`; số ra là ước lượng theo giả định ở đầu file, KHÔNG phải đo thật.
// Chạy: npm run sim:equip --prefix server   (thêm --md để in bảng Markdown; --seeds N số lượt tung, mặc định 40)
import {
  MAPS, BEAST_COIN, rollYears, tierOfYears,
  EQUIP_SLOTS, EQUIP_TIERS, EQUIP_STONES, EQUIP_SYNTH, EQUIP_SYNTH_KEEP, EQUIP_MAX_ENHANCE, EQUIP_MAX_TIER, EQUIP_CHARM, EQUIP_ESSENCE, EQUIP_SOUL, EQUIP_DROP, EQUIP_MAPS,
  equipEnhanceStep, equipEnhanceResult, equipEnhanceMult, equipIlvlK, equipStats, equipSalvage, equipTemplate, rollEquipDrop, rollEquipCharm, equipDefTotal,
  calcStats, VOHON, CORE_STATS, CORE_STAT_IDS, CORE_STAR_K, CORE_ENHANCE_MAIN, CORE_SUBS, CORE_SUB_ROLL, BONE_SLOTS, boneStats, BONE_PASSIVE_CAP,
  ARENA, ARENA_HE_DMG, CRIT, EQUIP_TEMPLATES, type CoreStat, type EquipData, type EquipInput,
} from "../../shared/data.ts";

// ---------- Giả định (đổi ở đây rồi chạy lại) ----------
const TRASH_PER_HOUR = 500, ELITE_PER_HOUR = 5;
const KING_PER_DAY = 2, WORLD_PER_DAY = 1;
const DAYS = 120;
/** Hồ sơ người chơi: giờ săn mỗi ngày. Thú vương / boss thế giới mỗi ngày chỉ tính khi vào bản đồ có chúng. */
const PROFILES = [{ name: "Ít giờ (1 giờ/ngày)", hours: 1, king: 1 }, { name: "Vừa (3 giờ/ngày)", hours: 3, king: 2 }, { name: "Cày (6 giờ/ngày)", hours: 6, king: 2 }];
/** Lộ trình bản đồ theo số ngày chơi (boss thế giới ở Lõi Tinh Đấu, bản đồ cấp 90–100: chỉ từ đoạn Hải Thần; tính theo hồn hoàn / cấp: Ngoại vi từ cấp ~20, Nội địa ~35, Lạc Nhật ~50, Cực Bắc ~60, Hải Thần ~80+); giờ ít thì chậm hơn nhờ `pace`. */
const ROUTE: { from: number; map: string; lv: number; rings: number[]; king?: string; world?: boolean }[] = [
  { from: 0,  map: "thanh_hon_thon",    lv: 15, rings: [1, 2] },
  { from: 3,  map: "tinh_dau_ngoai_vi", lv: 30, rings: [1, 2, 2, 3] },
  { from: 9,  map: "tinh_dau_noi_dia",  lv: 45, rings: [1, 2, 2, 3, 3], king: "tinh_dau_noi_dia" },
  { from: 18, map: "lac_nhat_sam_lam",  lv: 60, rings: [1, 2, 2, 3, 3, 3, 4], king: "tinh_dau_noi_dia" },
  { from: 30, map: "cuc_bac_chi_dia",   lv: 75, rings: [1, 2, 2, 3, 3, 3, 4, 4], king: "cuc_bac_chi_dia" },
  { from: 45, map: "hai_than_dao",      lv: 100, rings: [1, 2, 2, 3, 3, 3, 4, 4, 4], king: "hai_than_dao", world: true },
];
/** Mức cường hóa mục tiêu theo bậc món đang mặc (người chơi không đổ đá vào món sắp bỏ). +13 trở lên cần bùa. */
const ENH_TARGET = [0, 3, 6, 9, 12, 15];
/** Hợp thành lên bậc nào tối đa (T3 → T4 mất cấp, T4 → T5 mất cả 3 món + Tinh Hoa: chỉ làm khi có đủ). */
const SYNTH_MAX_FROM = 4;
const SEEDS = Number(process.argv[process.argv.indexOf("--seeds") + 1]) || 40;
const md = process.argv.includes("--md");

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toLocaleString("vi-VN", { maximumFractionDigits: d, minimumFractionDigits: 0 }) : "∞");
const row = (cells: (string | number)[]) => (md ? `| ${cells.join(" | ")} |` : cells.map((c) => String(c).padStart(11)).join(" "));
const head = (cells: string[]) => (md ? `${row(cells)}\n|${cells.map(() => "---").join("|")}|` : row(cells));
const title = (t: string) => console.log(`\n${md ? "### " : "== "}${t}${md ? "" : " =="}\n`);
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
const avgCoin = (tier: number) => (BEAST_COIN[tier][0] + BEAST_COIN[tier][1]) / 2;

// ---------- Mô hình một người chơi ----------
interface Item { tpl: string; tier: number; slot: string; ilvl: number; enh: number; roll: number; affixes: [CoreStat, number][]; luck: number }
const toItem = (e: EquipData, enh = 0): Item => { const t = equipTemplate(e.tpl)!; return { tpl: e.tpl, tier: t.tier, slot: t.slot, ilvl: e.ilvl, enh, roll: e.roll, affixes: e.affixes, luck: e.luck }; };
/** Điểm một món để so cùng ô: chỉ số chính × bậc × ilvl × cường hóa (cùng ô nên cùng đơn vị), cộng nhẹ dòng phụ theo số dòng. */
const score = (it: Item) => { const t = EQUIP_TIERS[it.tier]; return t.k * equipIlvlK(it.ilvl) * equipEnhanceMult(it.enh) * (1 + it.roll) + 0.04 * it.affixes.length * t.lineK * equipIlvlK(it.ilvl); };
const toInput = (it: Item): EquipInput => ({ tpl: it.tpl, ilvl: it.ilvl, enhance: it.enh, roll: it.roll, affixes: it.affixes, luck: it.luck });

interface Totals { coinHunt: number; coinSalv: number; feeEnh: number; feeSyn: number; destroyed: number; charmUsed: number; charmGot: number; enhTries: number; synTries: number; synFail: number; salvaged: number; dropped: number; stoneGot: number[]; stoneUsed: number[] }
const newTotals = (): Totals => ({ coinHunt: 0, coinSalv: 0, feeEnh: 0, feeSyn: 0, destroyed: 0, charmUsed: 0, charmGot: 0, enhTries: 0, synTries: 0, synFail: 0, salvaged: 0, dropped: 0, stoneGot: Array(5).fill(0), stoneUsed: Array(5).fill(0) });

interface Snap { day: number; map: string; tierAvg: number; enhAvg: number; t4: number; t5: number; maxEnh: number; worn: EquipInput[]; hp: number; atk: number; mp: number; crit: number; red: number; tot: Totals; coin: number; stones: number[]; charm: number; essence: number; bag: number }

function simulate(seed: number, hours: number, kingPerDay: number) {
  const r = rng(seed * 7919 + hours), tot = newTotals();
  const worn = new Map<string, Item>(), bag: Item[] = [];
  const stones = Array(5).fill(0) as number[];
  let coin = 0, charm = 0, essence = 0, soul = 0;
  const firstDay = { e10: 0, e12: 0, e15: 0, set10: 0, t4: 0, t5: 0 };
  const snaps: Snap[] = [];
  const vh = VOHON.findIndex((v) => v.he === "cuong_cong");
  let coinPerKill = 0;

  const addMat = (code: string, qty: number) => {
    const si = EQUIP_STONES.findIndex((s) => s.id === code);
    if (si >= 0) { stones[si] += qty; tot.stoneGot[si] += qty; } else if (code === EQUIP_ESSENCE) essence += qty; else if (code === EQUIP_SOUL) soul += qty;
  };
  const drops = (rank: number, mapId: string, n: number) => {
    for (let i = 0; i < n; i++) for (const d of rollEquipDrop(rank, mapId, r)) {
      if (d.kind === "stone") { stones[EQUIP_STONES.findIndex((s) => s.id === d.code)] += d.qty; tot.stoneGot[EQUIP_STONES.findIndex((s) => s.id === d.code)] += d.qty; }
      else { bag.push(toItem(d.item)); tot.dropped++; }
    }
  };
  const salvage = (it: Item) => { const s = equipSalvage(it.tier, it.enh, r); coin += s.coin; tot.coinSalv += s.coin; for (const m of s.items) addMat(m.code, m.qty); tot.salvaged++; };
  const targetOf = (it: Item) => ENH_TARGET[it.tier];

  /** Mặc món tốt hơn; món bị thay về túi để làm nguyên liệu hoặc phân giải. */
  function wear() {
    for (let i = bag.length - 1; i >= 0; i--) {
      const it = bag[i], cur = worn.get(it.slot);
      if (!cur || score(it) > score(cur)) { if (cur) bag.push(cur); worn.set(it.slot, it); bag.splice(i, 1); }
    }
  }
  /** Hợp thành khi có ≥ 3 món cùng bậc cùng ô và bậc kế tốt hơn món đang mặc ô đó. */
  function synth() {
    for (const s of EQUIP_SLOTS) for (let t = 0; t <= SYNTH_MAX_FROM; t++) {
      const step = EQUIP_SYNTH[t], w = worn.get(s.id);
      if (w && w.tier >= t + 1) continue;
      for (;;) {
        const pool = bag.filter((x) => x.slot === s.id && x.tier === t).sort((a, b) => b.enh - a.enh);
        if (pool.length < 3 || coin < step.fee || essence < step.essence) break;
        const main = pool[0], sac = [pool[1], pool[2]];
        coin -= step.fee; tot.feeSyn += step.fee; essence -= step.essence; tot.synTries++;
        const ids = new Set<Item>([main, ...sac]);
        for (let i = bag.length - 1; i >= 0; i--) if (ids.has(bag[i])) bag.splice(i, 1);
        if (r() < step.p) {
          const tpls = EQUIP_TEMPLATES.filter((x) => x.slot === s.id && x.tier === t + 1);
          const tp = tpls[Math.floor(r() * tpls.length)];
          // ilvl lấy cao nhất trong 3 món vào; chỉ số phụ tung lại bằng rollEquip qua rollEquipDrop không có sẵn: dùng dòng phụ trung bình theo số dòng của bậc.
          const ilvl = Math.max(main.ilvl, sac[0].ilvl, sac[1].ilvl), n = EQUIP_TIERS[t + 1].lines;
          const others = CORE_STAT_IDS.filter((k) => k !== s.main);
          const affixes = Array.from({ length: n }, (_, i): [CoreStat, number] => [others[(Math.floor(r() * others.length) + i) % others.length], (CORE_SUB_ROLL[0] + CORE_SUB_ROLL[1]) / 2]);
          bag.push({ tpl: tp.id, tier: t + 1, slot: s.id, ilvl, enh: Math.floor(main.enh * EQUIP_SYNTH_KEEP), roll: 0, affixes, luck: 0 });
        } else {
          tot.synFail++;
          if (step.all) essence += Math.floor(step.essence * step.refund);
          else { main.enh = Math.max(0, main.enh - step.mainLoss); bag.push(main); }
        }
      }
    }
  }
  /** Phân giải mọi món trong túi không còn dùng làm nguyên liệu hợp thành (giữ tối đa 2 món mỗi bậc/ô nếu hợp thành còn có ích). */
  function cleanBag() {
    const keep = new Set<Item>();
    for (const s of EQUIP_SLOTS) for (let t = 0; t <= SYNTH_MAX_FROM; t++) {
      const w = worn.get(s.id);
      if (w && w.tier >= t + 1) continue;
      for (const x of bag.filter((x) => x.slot === s.id && x.tier === t).slice(0, 2)) keep.add(x);
    }
    for (let i = bag.length - 1; i >= 0; i--) if (!keep.has(bag[i])) { salvage(bag[i]); bag.splice(i, 1); }
  }
  /** Cường hóa món đang mặc còn dưới mục tiêu, món thấp nhất trước; đến khi hết đá / Hồn Tệ / bùa. */
  function enhance(day: number) {
    for (let guard = 0; guard < 4000; guard++) {
      const cand = [...worn.values()].filter((x) => x.enh < targetOf(x)).sort((a, b) => a.enh - b.enh);
      let did = false;
      for (const it of cand) {
        const st = equipEnhanceStep(it.enh)!, destroy = st.fail.kind === "destroy";
        if (stones[st.stone] < st.qty || coin < st.fee || (destroy && charm < 1)) continue;
        stones[st.stone] -= st.qty; tot.stoneUsed[st.stone] += st.qty; coin -= st.fee; tot.feeEnh += st.fee; tot.enhTries++;
        const res = equipEnhanceResult(it.enh, r() < st.p, destroy && charm >= 1)!;
        if (res.charmUsed) { charm--; tot.charmUsed++; }
        if (res.destroyed) { worn.delete(it.slot); tot.destroyed++; }
        else it.enh = res.enhance;
        if (it.enh >= 10 && !firstDay.e10) firstDay.e10 = day;
        if (it.enh >= 12 && !firstDay.e12) firstDay.e12 = day;
        if (it.enh >= 15 && !firstDay.e15) firstDay.e15 = day;
        did = true; break;
      }
      if (!did) break;
    }
  }
  const power = (lv: number, rings: number[]) => {
    const items = [...worn.values()].map(toInput), es = equipStats(items), c = { ...es.bonus } as Record<CoreStat, number>;
    if (es.weapon) c.atk += (es.weapon.min + es.weapon.max) / 2;
    const base = calcStats(vh, lv, rings), g = calcStats(vh, lv, rings, 1, {}, c);
    return { hp: (g.maxHp / base.maxHp - 1) * 100, atk: (g.atk / base.atk - 1) * 100, mp: (g.maxMp / base.maxMp - 1) * 100, crit: (g.crit - base.crit) * 100, red: es.red * 100 };
  };

  for (let day = 1; day <= DAYS; day++) {
    // Giờ ít thì lộ trình chậm lại: ngày tính theo giờ chơi lũy kế (chuẩn 3 giờ/ngày), nhưng không dưới 1/3.
    const eff = Math.floor(day * hours / 3), ph = [...ROUTE].reverse().find((p) => eff >= p.from)!;
    const m = MAPS[ph.map], [lo, hi] = m.years!;
    if (!coinPerKill) coinPerKill = 0;
    let c = 0; for (let i = 0; i < 400; i++) c += avgCoin(tierOfYears(rollYears(lo, hi, r())));
    const perKill = c / 400, kills = TRASH_PER_HOUR * hours, elites = ELITE_PER_HOUR * hours;
    const hunt = perKill * kills + avgCoin(tierOfYears(hi)) * elites; coin += hunt; tot.coinHunt += hunt;
    drops(0, ph.map, kills); drops(1, ph.map, elites);
    if (ph.king) for (let i = 0; i < Math.min(kingPerDay, KING_PER_DAY); i++) { drops(2, ph.king, 1); const ch = rollEquipCharm(2, r); charm += ch; tot.charmGot += ch; }
    if (ph.world) for (let i = 0; i < WORLD_PER_DAY; i++) { drops(3, "loi_tinh_dau", 1); const ch = rollEquipCharm(3, r); charm += ch; tot.charmGot += ch; }
    wear(); synth(); wear(); cleanBag(); enhance(day); wear();
    const ws = [...worn.values()];
    if (!firstDay.t4 && ws.some((x) => x.tier >= 4)) firstDay.t4 = day;
    if (!firstDay.t5 && ws.some((x) => x.tier >= 5)) firstDay.t5 = day;
    if (!firstDay.set10 && ws.length === 10 && ws.every((x) => x.enh >= 10)) firstDay.set10 = day;
    if ([1, 3, 7, 14, 30, 60, 90, 120].includes(day)) {
      const p = power(ph.lv, ph.rings);
      snaps.push({ day, map: ph.map, tierAvg: ws.reduce((a, x) => a + x.tier, 0) / 10, enhAvg: ws.reduce((a, x) => a + x.enh, 0) / 10, t4: ws.filter((x) => x.tier >= 4).length, t5: ws.filter((x) => x.tier >= 5).length,
        maxEnh: Math.max(0, ...ws.map((x) => x.enh)), worn: ws.map(toInput), ...p, tot: JSON.parse(JSON.stringify(tot)), coin, stones: [...stones], charm, essence, bag: bag.length });
    }
  }
  void soul; void EQUIP_CHARM; void EQUIP_MAX_ENHANCE; void EQUIP_MAX_TIER; void EQUIP_DROP; void EQUIP_MAPS;
  return { snaps, firstDay, worn: [...worn.values()], tot, coin };
}

// ================= PHẦN A: kinh tế theo thời gian =================
console.log(`Giả lập ${SEEDS} lượt × ${DAYS} ngày × ${PROFILES.length} hồ sơ; số ở bảng là trung vị các lượt.\n`);
const runs = PROFILES.map((p) => ({ p, rs: Array.from({ length: SEEDS }, (_, i) => simulate(i + 1, p.hours, p.king)) }));
for (const { p, rs } of runs) {
  title(`A1. ${p.name}: tiến trình bộ 10 ô theo ngày`);
  console.log(head(["Ngày", "Bản đồ", "Bậc TB", "+ TB", "+ cao nhất", "≥T4", "T5", "Sinh lực %", "Công %", "Giảm ST %", "Chí mạng"]));
  for (let k = 0; k < rs[0].snaps.length; k++) {
    const s = (g: (x: Snap) => number) => median(rs.map((r) => g(r.snaps[k])));
    console.log(row([rs[0].snaps[k].day, MAPS[rs[0].snaps[k].map].name, f(s((x) => x.tierAvg)), f(s((x) => x.enhAvg)), f(s((x) => x.maxEnh), 0), f(s((x) => x.t4), 0), f(s((x) => x.t5), 0), f(s((x) => x.hp)), f(s((x) => x.atk)), f(s((x) => x.red)), f(s((x) => x.crit))]));
  }
}
for (const { p, rs } of runs) {
  title(`A2. ${p.name}: Hồn Tệ vào / ra và nguyên liệu (cộng dồn)`);
  console.log(head(["Ngày", "HT săn", "HT phân giải", "HT cường hóa", "HT hợp thành", "Ra/Vào %", "Tồn HT", "Phá hủy", "Bùa kiếm/dùng", "Đá tồn I-V"]));
  for (let k = 0; k < rs[0].snaps.length; k++) {
    const s = (g: (x: Snap) => number) => median(rs.map((r) => g(r.snaps[k])));
    const inn = s((x) => x.tot.coinHunt + x.tot.coinSalv), out = s((x) => x.tot.feeEnh + x.tot.feeSyn);
    console.log(row([rs[0].snaps[k].day, f(s((x) => x.tot.coinHunt), 0), f(s((x) => x.tot.coinSalv), 0), f(s((x) => x.tot.feeEnh), 0), f(s((x) => x.tot.feeSyn), 0), f(out / inn * 100), f(s((x) => x.coin), 0), f(s((x) => x.tot.destroyed)),
      `${f(s((x) => x.tot.charmGot))}/${f(s((x) => x.tot.charmUsed))}`, [0, 1, 2, 3, 4].map((i) => f(s((x) => x.stones[i]), 0)).join("/")]));
  }
}
title("A3. Ngày đầu tiên đạt mốc (trung vị; ∞ = chưa đạt trong " + DAYS + " ngày, kèm % lượt đạt)");
console.log(head(["Hồ sơ", "Có T4", "Có T5", "Một món +10", "Một món +12", "Một món +15", "Cả bộ ≥ +10"]));
for (const { p, rs } of runs) {
  const c = (g: (r: typeof rs[0]) => number) => { const v = rs.map(g), ok = v.filter((x) => x > 0); return `${ok.length ? f(median(ok), 0) : "∞"} (${f(ok.length / v.length * 100, 0)}%)`; };
  console.log(row([p.name, c((r) => r.firstDay.t4), c((r) => r.firstDay.t5), c((r) => r.firstDay.e10), c((r) => r.firstDay.e12), c((r) => r.firstDay.e15), c((r) => r.firstDay.set10)]));
}

// ================= PHẦN B: đấu trường =================
/** Chỉ số hiệu dụng trong đấu trường (hệ số ARENA áp như nhau cho hai bên nên khi so tỉ lệ chúng triệt tiêu). Thắng 1v1 cùng kỹ năng ⇔ P lớn hơn: P = công × sinh lực / (1 − giảm ST) × (1 + chí mạng × (hệ số − 1)). */
function arenaPower(vh: number, lv: number, rings: number[], o: { eq?: EquipInput[]; bones?: Partial<Record<CoreStat, number>>; cores?: Partial<Record<CoreStat, number>>; bonePassiveDef?: number; luckMax?: boolean }) {
  const es = equipStats(o.eq ?? []), c = { ...(o.cores ?? {}) } as Record<CoreStat, number>;
  for (const k of CORE_STAT_IDS) c[k] = (c[k] ?? 0) + es.bonus[k];
  const st = calcStats(vh, lv, rings, 1, o.bones ?? {}, c), wAvg = es.weapon ? (es.weapon.min + es.weapon.max) / 2 : 0, wMax = es.weapon ? es.weapon.max : 0;
  const atk = st.atk + (o.luckMax ? wMax : wAvg), red = equipDefTotal(o.bonePassiveDef ?? 0, es.red);
  return { atk, hp: st.maxHp, red, P: atk * st.maxHp / (1 - red) * (1 + st.crit * (st.critMult - 1)) };
}
const SLOT_IDS = EQUIP_SLOTS.map((s) => s.id);
const setOf = (tier: number, ilvl: number, enh: number): EquipInput[] => SLOT_IDS.map((x) => ({ tpl: `${x}_${EQUIP_TIERS[tier].id}`, ilvl, enhance: enh, roll: 0,
  affixes: CORE_STAT_IDS.filter((k) => k !== EQUIP_SLOTS.find((s) => s.id === x)!.main).slice(0, EQUIP_TIERS[tier].lines).map((k): [CoreStat, number] => [k, 0.85]) }));
function avgCores(stars: number, enh: number, n = 6) {
  const out = Object.fromEntries(CORE_STAT_IDS.map((k) => [k, 0])) as Record<CoreStat, number>, wsum = CORE_STAT_IDS.reduce((a, k) => a + CORE_STATS[k].w, 0), kk = CORE_STAR_K[stars - 1];
  for (const x of CORE_STAT_IDS) {
    out[x] += n * (CORE_STATS[x].w / wsum) * CORE_STATS[x].main * kk * (1 + CORE_ENHANCE_MAIN * enh);
    out[x] += n * CORE_SUBS[stars - 1] / (CORE_STAT_IDS.length - 1) * (1 - CORE_STATS[x].w / wsum) * CORE_STATS[x].sub * kk * ((CORE_SUB_ROLL[0] + CORE_SUB_ROLL[1]) / 2);
  }
  return out;
}
function avgBones(years: number, enh: number) {
  const out: Partial<Record<CoreStat, number>> = {};
  for (const s of BONE_SLOTS) for (const [k, v] of Object.entries(boneStats(s.id, years, enh))) out[k as CoreStat] = (out[k as CoreStat] ?? 0) + (v as number);
  return out;
}
const HES = ["cuong_cong", "man_cong", "khong_che", "phu_tro"] as const;
const LV = [{ n: "Cấp 30", lv: 30, rings: [1, 2, 2, 3], bone: [1000, 0], core: [3, 3], gear: [[1, 2, 3], [2, 2, 3]] }, { n: "Cấp 60", lv: 60, rings: [1, 2, 2, 3, 3, 3, 4], bone: [10000, 6], core: [5, 6], gear: [[3, 4, 9], [4, 5, 9]] }, { n: "Cấp 100", lv: 100, rings: [1, 2, 2, 3, 3, 3, 4, 4, 4], bone: [100000, 12], core: [6, 12], gear: [[3, 6, 10], [4, 6, 12], [5, 7, 15]] }];
title("B1. Đấu trường: chỉ số sức mạnh P = công × sinh lực ÷ (1 − giảm ST) × (hệ số chí mạng), võ hồn Cường công; tỉ lệ P so với người CÙNG cấp / hồn hoàn / hồn cốt / hồn hạch nhưng KHÔNG trang bị");
console.log(head(["Mốc", "Bộ trang bị", "Công", "Sinh lực", "Giảm ST %", "P / P(không)", "Thắng 1v1?"]));
const bClass: Record<string, number> = {};
for (const L of LV) {
  const common = { bones: avgBones(L.bone[0], L.bone[1]), cores: avgCores(L.core[0], L.core[1]) }, vh = VOHON.findIndex((v) => v.he === "cuong_cong");
  const base = arenaPower(vh, L.lv, L.rings, common);
  console.log(row([L.n, "không trang bị", f(base.atk, 0), f(base.hp, 0), 0, "1,00", "-"]));
  for (const [t, il, en] of L.gear) {
    const a = arenaPower(vh, L.lv, L.rings, { ...common, eq: setOf(t, il, en), luckMax: false }), ratio = a.P / base.P;
    bClass[`${L.n} T${t}+${en}`] = ratio;
    console.log(row(["", `T${t} +${en} ilvl ${il}`, f(a.atk, 0), f(a.hp, 0), f(a.red * 100), f(ratio, 2), ratio > 1 ? "thắng" : "-"]));
  }
}
title("B2. Cùng bộ đồ, khác hệ võ hồn: chênh lệch từ trang bị so với chênh lệch có sẵn của hệ (ARENA_HE_DMG) ở cấp 100, T5 +15 so với không trang bị");
console.log(head(["Hệ", "Hệ số sát thương", "P không", "P T5+15", "Tăng %"]));
for (const he of HES) {
  const vh = VOHON.findIndex((v) => v.he === he), L = LV[2], common = { bones: avgBones(L.bone[0], L.bone[1]), cores: avgCores(L.core[0], L.core[1]) };
  const b = arenaPower(vh, L.lv, L.rings, common), a = arenaPower(vh, L.lv, L.rings, { ...common, eq: setOf(5, 7, 15) });
  console.log(row([he, f(ARENA_HE_DMG[he], 2), f(b.P, 0), f(a.P, 0), f((a.P / b.P - 1) * 100)]));
}
title("B3. Hai người cùng cấp 100, bộ trang bị khác nhau, đối đầu 1v1 cùng kỹ năng (mô hình thời gian hạ gục)");
console.log(head(["A", "B", "Hạ B mất (giây)", "Hạ A mất (giây)", "Thắng"]));
{
  const vh = VOHON.findIndex((v) => v.he === "cuong_cong"), L = LV[2], common = { bones: avgBones(L.bone[0], L.bone[1]), cores: avgCores(L.core[0], L.core[1]) };
  // thời gian hạ gục: sinh lực đối thủ ÷ (công × (1 − giảm ST đối thủ) × hệ số × dmgMult × nhịp đánh); lấy nhịp 1,2 đòn/giây chỉ để quy ra giây (tỉ lệ không phụ thuộc).
  const rate = 1.2 * ARENA_HE_DMG.cuong_cong * ARENA.dmgMult;
  const ttk = (a: ReturnType<typeof arenaPower>, b: ReturnType<typeof arenaPower>) => b.hp / (a.atk * (1 - b.red) * rate);
  const pairs: [string, EquipInput[], string, EquipInput[]][] = [
    ["T5+15", setOf(5, 7, 15), "T3+10", setOf(3, 6, 10)], ["T5+15", setOf(5, 7, 15), "không", []], ["T4+12", setOf(4, 6, 12), "không", []], ["T3+10", setOf(3, 6, 10), "không", []], ["T5+15", setOf(5, 7, 15), "T4+12", setOf(4, 6, 12)],
  ];
  for (const [an, ae, bn, be] of pairs) {
    const a = arenaPower(vh, L.lv, L.rings, { ...common, eq: ae }), b = arenaPower(vh, L.lv, L.rings, { ...common, eq: be }), ta = ttk(a, b), tb = ttk(b, a);
    console.log(row([an, bn, f(ta), f(tb), `${ta < tb ? an : bn} (${f(Math.max(ta, tb) / Math.min(ta, tb), 2)}× nhanh hơn; trận ${ARENA.fightSecs} giây)`]));
  }
}
title("B4. Để so: hồn cốt + hồn hạch đủ bộ so với không có gì (cùng cấp 100 / Cường công), và trang bị cộng thêm lên trên");
console.log(head(["Cấu hình", "P", "P / P(trần)", "TTK so với trần"]));
{
  const vh = VOHON.findIndex((v) => v.he === "cuong_cong"), L = LV[2], none = arenaPower(vh, L.lv, L.rings, {});
  const bc = { bones: avgBones(L.bone[0], L.bone[1]), cores: avgCores(L.core[0], L.core[1]) };
  for (const [n, o] of [["Không gì (cấp 100 + 9 hồn hoàn)", {}], ["+ hồn cốt 100.000y +12", { bones: bc.bones }], ["+ hồn hạch 6★ +12", { cores: bc.cores }], ["+ cả hai", bc], ["+ cả hai + T3 +10", { ...bc, eq: setOf(3, 6, 10) }], ["+ cả hai + T5 +15", { ...bc, eq: setOf(5, 7, 15) }]] as [string, Parameters<typeof arenaPower>[3]][]) {
    const a = arenaPower(vh, L.lv, L.rings, o); console.log(row([n, f(a.P, 0), f(a.P / none.P, 2), f(none.P / a.P, 2)]));
  }
}
title("B5. Chênh lệch thật giữa các hồ sơ người chơi (cùng cấp 100, cùng hồn cốt / hồn hạch; chỉ khác bộ trang bị do giả lập ra; P so với hồ sơ Vừa cùng ngày)");
console.log(head(["Ngày", "Ít giờ / Vừa", "Cày / Vừa", "Cày / Ít giờ", "Vừa / không đồ"]));
{
  const vh = VOHON.findIndex((v) => v.he === "cuong_cong"), L = LV[2], bc = { bones: avgBones(L.bone[0], L.bone[1]), cores: avgCores(L.core[0], L.core[1]) };
  for (const k of [3, 4, 5, 6, 7]) {
    const P = (pi: number) => median(runs[pi].rs.map((r) => arenaPower(vh, L.lv, L.rings, { ...bc, eq: r.snaps[k].worn }).P));
    const none = arenaPower(vh, L.lv, L.rings, bc).P;
    console.log(row([runs[1].rs[0].snaps[k].day, f(P(0) / P(1), 2), f(P(2) / P(1), 2), f(P(2) / P(0), 2), f(P(1) / none, 2)]));
  }
}
const cap = BONE_PASSIVE_CAP.def;
console.log(`\nTrần giảm sát thương chung: ${f(cap * 100, 0)}%; bộ T5 đầy đủ cho ${f(equipStats(setOf(5, 7, 15)).red * 100)}% (bị động hồn cốt cộng vào dưới cùng trần).`);
void CRIT;
