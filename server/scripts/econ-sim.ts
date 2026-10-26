// Giả lập dòng Hồn Tệ THEO NGÀY (tới ngày 120) cho các hồ sơ tay + treo (#906, theo dõi #253 / #168 / #418).
// Bổ sung `equip-sim.ts` (chỉ có săn tay, chỉ có sink trang bị): thêm tự săn (AUTO_PACE, offlineFight), bán đồ rơi (sellPrice) và các sink
// còn thiếu (mảnh Thương hội, phí cường hóa hồn cốt / hồn hạch theo số võ hồn trang bị, mở rộng túi, đổi ngoại hình, cường hóa trang bị).
// Mọi số game đọc từ `shared/data.ts`; số ra là ƯỚC LƯỢNG theo giả định ở đầu file (chưa đo thật), KHÔNG đổi số cân bằng nào.
// Chạy: npm run sim:econ --prefix server   (thêm --md để in bảng Markdown)
// Bán hồn hoàn (#1040): mặc định tắt; `--sell-rings` = người chơi bán MỌI hồn hoàn rơi (hạ nào cũng rơi 1 chiếc, kill.ts); `--sell-rings=guard` = chỉ bán
// hồn hoàn dưới AUTO_SELL_GUARD năm (giữ hồn hoàn lớn để hấp thụ, như tự bán khi tắt `high`). Cột E1 luôn tách sẵn hai phần để so.
import {
  MAPS, BEAST_COIN, TIERS, rollYears, tierOfYears, beastStats, beastLevel, xpNeed, xpLevelScale, XP_SHARE_ACTIVE, ELITE,
  VOHON, calcStats, offlineFight, type OfflinePower, AUTO_DAILY_SECS, AUTO_TOKEN_PRICE, AUTO_TOKEN_SECS, AUTO_BONUS_MAX,
  sellPrice, ringSellPrice, BONE_ITEM, CORE_ITEM, shardCode, vohonIndex, boneChance, coreChance, coreStarBand, CORE_STAR_W, shardChance, SHARD_SELL, SHARD_QTY,
  SHARD_BUY, shardBuyCost, BAG_EXPAND_COST, LOOKS_CHANGE, BONE_SLOTS, BONE_ENHANCE_FEE, BONE_MAX_ENHANCE, CORE_SLOTS, CORE_ENHANCE_FEE, CORE_MAX_ENHANCE, TEAM_SIZE,
  AUTO_SELL_GUARD, OFFLINE,
  EQUIP_SLOTS, EQUIP_MAX_ENHANCE, equipEnhanceStep, equipEnhanceResult, rollEquipDrop, equipSalvage, equipTemplate, EQUIP_DROP,
} from "../../shared/data.ts";

// ---------- Giả định (đổi ở đây rồi chạy lại) ----------
const DAYS = 120;
/** Hạ tay mỗi giờ: như E0 / equip-sim (≈ 7 giây một con, gồm đi lại); tinh anh mỗi giờ như E0. */
const HAND_KILLS_PER_HOUR = 500, ELITE_PER_HOUR = 5;
/** Treo: mỗi con tốn `offlineFight(...).secs` giây (trần tốc độ AUTO_PACE bằng đúng ước lượng này); không tính tinh anh / thú vương khi treo (thận trọng). */
const AUTO_HOURS = AUTO_DAILY_SECS / 3600;
/** AUTO_PACE: mỗi con tốn max(thời gian thật, ước lượng offlineFight). Thời gian thật mỗi con (đi tới + đánh) lấy bằng nhịp săn tay (3600 / HAND_KILLS_PER_HOUR); `--auto-fast` = chỉ dùng ước lượng (cận trên). */
const AUTO_REAL_SECS = process.argv.includes("--auto-fast") ? 0 : 3600 / HAND_KILLS_PER_HOUR;
const SAMPLES = 600;
/** Lộ trình bản đồ theo ngày chơi (cùng ROUTE của equip-sim): lv + vòng hồn hoàn để tính chỉ số võ hồn ra trận khi treo. */
const ROUTE: { from: number; map: string; lv: number; rings: number[] }[] = [
  { from: 0,  map: "thanh_hon_thon",    lv: 15, rings: [1, 2] },
  { from: 3,  map: "tinh_dau_ngoai_vi", lv: 30, rings: [1, 2, 2, 3] },
  { from: 9,  map: "tinh_dau_noi_dia",  lv: 45, rings: [1, 2, 2, 3, 3] },
  { from: 18, map: "lac_nhat_sam_lam",  lv: 60, rings: [1, 2, 2, 3, 3, 3, 4] },
  { from: 30, map: "cuc_bac_chi_dia",   lv: 75, rings: [1, 2, 2, 3, 3, 3, 4, 4] },
  { from: 45, map: "hai_than_dao",      lv: 100, rings: [1, 2, 2, 3, 3, 3, 4, 4, 4] },
];
/** Hồ sơ: giờ tay, giờ treo mỗi ngày; `paceHours` = giờ dùng để đẩy lộ trình bản đồ (chuẩn 3 giờ/ngày, như equip-sim). */
const PROFILES = [
  { name: "1 giờ tay", hand: 1, auto: 0, pace: 1 },
  { name: "3 giờ tay", hand: 3, auto: 0, pace: 3 },
  { name: "3 giờ tay + 12 giờ treo (lộ trình theo 3 giờ)", hand: 3, auto: AUTO_HOURS, pace: 3 },
  { name: "3 giờ tay + 12 giờ treo (lộ trình theo 15 giờ, cận trên)", hand: 3, auto: AUTO_HOURS, pace: 3 + AUTO_HOURS },
];
/** Số võ hồn có đủ hồn cốt / hồn hạch để cường hóa (sink theo TEAM_SIZE võ hồn trong đội). */
const VOHON_COUNTS = [1, 2, TEAM_SIZE];
/** Ngoại hình: giả định 1 lần đổi trả phí mỗi 30 ngày. */
const LOOKS_EVERY = 30;
const md = process.argv.includes("--md");
/** Bán hồn hoàn rơi ở giá thương nhân (`ringSellPrice`): "off" (mặc định) | "all" | "guard" (chỉ dưới AUTO_SELL_GUARD năm). */
const SELL_RINGS: "off" | "all" | "guard" = process.argv.includes("--sell-rings") ? "all" : process.argv.includes("--sell-rings=guard") ? "guard" : "off";

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toLocaleString("vi-VN", { maximumFractionDigits: d, minimumFractionDigits: 0 }) : "∞");
const row = (cells: (string | number)[]) => (md ? `| ${cells.join(" | ")} |` : cells.map((c) => String(c).padStart(12)).join(" "));
const head = (cells: string[]) => (md ? `${row(cells)}\n|${cells.map(() => "---").join("|")}|` : row(cells));
const title = (t: string) => console.log(`\n${md ? "### " : "== "}${t}${md ? "" : " =="}\n`);
const avgCoin = (tier: number) => (BEAST_COIN[tier][0] + BEAST_COIN[tier][1]) / 2;

// ---------- Kịch bản chỉnh số (chỉ để ước lượng tác động, KHÔNG sửa shared/data.ts) ----------
interface Scenario { name: string; coin: (years: number) => number; sell: number; tokenPrice: number }
const baseCoin = (y: number) => avgCoin(tierOfYears(y));
/**
 * Làm mượt vách đá: nội suy log giữa các mốc đặt ở TRUNG ĐIỂM hình học của mỗi bậc (bậc cuối ở đúng mốc của nó), lấy Hồn Tệ trung bình mỗi bậc làm giá trị,
 * để một con nằm giữa bậc nhận đúng bằng bảng hiện tại (không đặt mốc ở biên dưới của bậc vì sẽ tăng mặt bằng thu nhập).
 */
const ANCHOR = TIERS.map((t, i) => (i < TIERS.length - 1 ? Math.sqrt(t.years * TIERS[i + 1].years) : t.years));
const smoothWith = (val: (tier: number) => number) => (y: number) => {
  if (y <= ANCHOR[0]) return val(0); if (y >= ANCHOR[ANCHOR.length - 1]) return val(ANCHOR.length - 1);
  let i = 0; while (y > ANCHOR[i + 1]) i++;
  const t = Math.log(y / ANCHOR[i]) / Math.log(ANCHOR[i + 1] / ANCHOR[i]);
  return val(i) + (val(i + 1) - val(i)) * t;
};
const smoothCoin = smoothWith(avgCoin);
/** Làm mượt nhưng hạ mốc bậc cuối (100.000 năm) xuống 2 × mốc bậc 3, để Hồn Tệ cấp cao không tăng so với hiện tại. */
const smoothCapped = smoothWith((t) => (t === TIERS.length - 1 ? avgCoin(t - 1) * 2 : avgCoin(t)));
const SCENARIOS: Scenario[] = [
  { name: "Hiện tại", coin: baseCoin, sell: 1, tokenPrice: AUTO_TOKEN_PRICE },
  { name: "BEAST_COIN bậc 3–4 × 0,5", coin: (y) => baseCoin(y) * (tierOfYears(y) >= 3 ? 0.5 : 1), sell: 1, tokenPrice: AUTO_TOKEN_PRICE },
  { name: "BEAST_COIN bậc 2–4 × 0,5", coin: (y) => baseCoin(y) * (tierOfYears(y) >= 2 ? 0.5 : 1), sell: 1, tokenPrice: AUTO_TOKEN_PRICE },
  { name: "Giá bán đồ rơi (hồn cốt / hồn hạch / mảnh) × 0,5", coin: baseCoin, sell: 0.5, tokenPrice: AUTO_TOKEN_PRICE },
  { name: "BEAST_COIN làm mượt (nội suy log)", coin: smoothCoin, sell: 1, tokenPrice: AUTO_TOKEN_PRICE },
  { name: "BEAST_COIN làm mượt + mốc 100.000y = 2 × bậc 3", coin: smoothCapped, sell: 1, tokenPrice: AUTO_TOKEN_PRICE },
  { name: "Mọi nguồn vào × 0,5 (cận dưới)", coin: (y) => baseCoin(y) * 0.5, sell: 0.5, tokenPrice: AUTO_TOKEN_PRICE },
];

// ---------- Thu nhập theo bản đồ (kỳ vọng mỗi con / mỗi giờ) ----------
const vhCuong = VOHON.findIndex((v) => v.he === "cuong_cong");
const SPECIES = ""; // chưa có hệ số thủ riêng (BEAST_DEF_MULT mặc định 1)
const starAvgSell = (years: number, sell: number) => {
  const [lo, hi] = coreStarBand(years), w = CORE_STAR_W.slice(0, hi - lo + 1), tw = w.reduce((a, x) => a + x, 0);
  return sell * w.reduce((a, x, i) => a + x * (sellPrice({ code: CORE_ITEM, years: null, stars: lo + i, enhance: 0 }) ?? 0), 0) / tw;
};
function shardSell(mapId: string) {
  const ids = MAPS[mapId].shards; if (!ids.length) return 0;
  return ids.reduce((a, id) => a + (sellPrice({ code: shardCode(id), years: null, stars: null, enhance: 0 }) ?? 0), 0) / ids.length * SHARD_QTY;
}
/** Hồn Tệ từ phân giải đồ trang bị rơi mỗi con (kỳ vọng tung mẫu): hạng 0 thường, hạng 1 tinh anh. */
const salvPerKill = new Map<string, number[]>();
function equipSalvagePerKill(mapId: string, rank: number) {
  const key = mapId; let v = salvPerKill.get(key); if (!v) { v = []; salvPerKill.set(key, v); }
  if (v[rank] !== undefined) return v[rank];
  const r = rng(77 + rank), N = 3000; let c = 0;
  for (let i = 0; i < N; i++) for (const d of rollEquipDrop(rank, mapId, r)) if (d.kind === "equip") c += equipSalvage(equipTemplate(d.item.tpl)!.tier, 0, r).coin;
  return (v[rank] = c / N);
}
interface MapIncome { map: string; perKillCoin: number; perKillSell: number; perKillSalv: number; perKillRingLow: number; perKillRingHigh: number; eliteRingLow: number; eliteRingHigh: number; eliteHour: number; autoSecs: number; autoKillsHour: number; autoCoinHour: number; autoSellHour: number; autoSalvHour: number; handCoinHour: number; handSellHour: number; handSalvHour: number; handRingLowHour: number; handRingHighHour: number; autoRingLowHour: number; autoRingHighHour: number }
function incomeAt(mapId: string, lv: number, rings: number[], sc: Scenario): MapIncome {
  const m = MAPS[mapId], [lo, hi] = m.years!, r = rng(1234), st = calcStats(vhCuong, lv, rings);
  const pw: OfflinePower = { atk: st.atk, crit: st.crit, critMult: st.critMult, maxHp: st.maxHp, def: VOHON[vhCuong].def };
  let coin = 0, sell = 0, ringLow = 0, ringHigh = 0, secs = 0, killSecs = 0, killed = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const y = rollYears(lo, hi, r()), fight = offlineFight(pw, y, SPECIES);
    secs += fight.secs; if (fight.ok) killed++;
    const c = sc.coin(y);
    const s = sc.sell * (boneChance(y) * (sellPrice({ code: BONE_ITEM, years: y, stars: null, enhance: 0 }) ?? 0) + coreChance(y) * starAvgSell(y, 1) + shardChance(y) * shardSell(mapId));
    const ring = ringSellPrice(y); if (y < AUTO_SELL_GUARD) ringLow += ring; else ringHigh += ring; // mỗi con hạ rơi đúng 1 hồn hoàn cùng số năm
    coin += c; sell += s; if (fight.ok) killSecs += fight.secs;
  }
  const perKillCoin = coin / SAMPLES, perKillSell = sell / SAMPLES, perKillSalv = equipSalvagePerKill(mapId, 0);
  // Tinh anh: Hồn Tệ theo bậc của mức trên bản đồ, hồn hạch chắc chắn, hồn cốt × ELITE.bone, trang bị hạng 1.
  const eliteCoin = sc.coin(hi), eliteSell = sc.sell * (boneChance(hi, ELITE.bone) * (sellPrice({ code: BONE_ITEM, years: hi, stars: null, enhance: 0 }) ?? 0) + starAvgSell(hi, 1)), eliteSalv = equipSalvagePerKill(mapId, 1);
  // Tinh anh cũng rơi 1 hồn hoàn theo niên hạn của nó (kill.ts), ta lấy mức trên bản đồ như hồn Tệ / hồn cốt ở trên.
  const eliteRing = ringSellPrice(hi), eliteRingLow = hi < AUTO_SELL_GUARD ? eliteRing : 0, eliteRingHigh = hi < AUTO_SELL_GUARD ? 0 : eliteRing;
  const perKillRingLow = ringLow / SAMPLES, perKillRingHigh = ringHigh / SAMPLES;
  const autoSecs = secs / SAMPLES, autoKillsHour = killed ? 3600 / Math.max(killSecs / killed, AUTO_REAL_SECS) * (killed / SAMPLES) : 0;
  return { map: mapId, perKillCoin, perKillSell, perKillSalv, perKillRingLow, perKillRingHigh, eliteRingLow, eliteRingHigh, eliteHour: ELITE_PER_HOUR * (eliteCoin + eliteSell + eliteSalv), autoSecs, autoKillsHour,
    autoCoinHour: autoKillsHour * perKillCoin, autoSellHour: autoKillsHour * perKillSell, autoSalvHour: autoKillsHour * perKillSalv,
    handCoinHour: HAND_KILLS_PER_HOUR * perKillCoin + ELITE_PER_HOUR * eliteCoin, handSellHour: HAND_KILLS_PER_HOUR * perKillSell + ELITE_PER_HOUR * eliteSell, handSalvHour: HAND_KILLS_PER_HOUR * perKillSalv + ELITE_PER_HOUR * eliteSalv,
    handRingLowHour: HAND_KILLS_PER_HOUR * perKillRingLow + ELITE_PER_HOUR * eliteRingLow, handRingHighHour: HAND_KILLS_PER_HOUR * perKillRingHigh + ELITE_PER_HOUR * eliteRingHigh,
    autoRingLowHour: autoKillsHour * perKillRingLow, autoRingHighHour: autoKillsHour * perKillRingHigh };
}
/** Hồn Tệ/giờ từ bán hồn hoàn theo chế độ đang chọn (0 khi tắt); `high` bán cả hồn hoàn ≥ AUTO_SELL_GUARD năm chỉ ở chế độ "all". */
const ringHour = (low: number, high: number) => (SELL_RINGS === "off" ? 0 : SELL_RINGS === "guard" ? low : low + high);
/** Hệ số trần OFFLINE.rings: tự săn mỗi lượt nhận chỉ nhặt tối đa bấy nhiêu hồn hoàn (giả định 1 lượt nhận mỗi ngày) trên `hours` giờ treo. */
const autoRingFactor = (killsHour: number, hours: number) => (killsHour > 0 && hours > 0 ? Math.min(1, OFFLINE.rings / (killsHour * hours)) : 0);
const incomeCache = new Map<string, MapIncome>();
const incomeFor = (day: number, pace: number, sc: Scenario) => {
  const eff = Math.floor(day * pace / 3), ph = [...ROUTE].reverse().find((p) => eff >= p.from)!, key = `${sc.name}|${ph.map}`;
  let v = incomeCache.get(key); if (!v) { v = incomeAt(ph.map, ph.lv, ph.rings, sc); incomeCache.set(key, v); } return v;
};

// ---------- Sink ----------
/** Phí cường hóa MỘT món trang bị từ +0 tới +EQUIP_MAX_ENHANCE, luôn dùng bùa ở nấc phá hủy (ước lượng trung bình; chưa tính hợp thành). */
function equipFeePerItem() {
  const r = rng(99), N = 400; let fee = 0;
  for (let n = 0; n < N; n++) { let e = 0; for (let g = 0; g < 5000 && e < EQUIP_MAX_ENHANCE; g++) { const s = equipEnhanceStep(e)!; fee += s.fee; e = equipEnhanceResult(e, r() < s.p, true)!.enhance; } }
  return fee / N;
}
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const BONE_FEE_FULL = sum(BONE_ENHANCE_FEE.slice(0, BONE_MAX_ENHANCE)), CORE_FEE_FULL = sum(CORE_ENHANCE_FEE.slice(0, CORE_MAX_ENHANCE));
const EQUIP_FEE_FULL = equipFeePerItem() * EQUIP_SLOTS.length, BAG_FULL = sum(BAG_EXPAND_COST);
const SHARD_DAY = shardBuyCost(0, SHARD_BUY.daily);

// ---------- Mô phỏng theo ngày ----------
interface Day { day: number; map: string; inHunt: number; inSell: number; inSalv: number; inRing: number; outShard: number; outLooks: number; outPool: number; stock: number; cumIn: number; cumOut: number; poolLeft: number }
function simulate(p: typeof PROFILES[0], nVohon: number, sc: Scenario, shardDaily = SHARD_BUY.daily) {
  // Sink "một lần" xếp sau mảnh Thương hội mỗi ngày: túi → hồn cốt / hồn hạch (theo số võ hồn) → trang bị. Trần sức chứa: bỏ qua thời điểm có đồ để nâng.
  let pool = BAG_FULL + nVohon * (BONE_SLOTS.length * BONE_FEE_FULL + CORE_SLOTS * CORE_FEE_FULL) + EQUIP_FEE_FULL;
  const pool0 = pool; let coin = 0, cumIn = 0, cumOut = 0, looks = 0, drained = 0;
  const days: Day[] = [];
  for (let d = 1; d <= DAYS; d++) {
    const inc = incomeFor(d, p.pace, sc);
    const inHunt = p.hand * inc.handCoinHour + (p.auto > 0 ? p.auto * inc.autoCoinHour : 0), inSell = p.hand * inc.handSellHour + (p.auto > 0 ? p.auto * inc.autoSellHour : 0), inSalv = p.hand * inc.handSalvHour + (p.auto > 0 ? p.auto * inc.autoSalvHour : 0);
    // Tự săn chỉ nhặt tối đa OFFLINE.rings hồn hoàn mỗi lượt nhận (MapRoom.claimOffline); giả định 1 lượt nhận mỗi ngày.
    const inRing = p.hand * ringHour(inc.handRingLowHour, inc.handRingHighHour) + p.auto * autoRingFactor(inc.autoKillsHour, p.auto) * ringHour(inc.autoRingLowHour, inc.autoRingHighHour);
    const income = inHunt + inSell + inSalv + inRing; coin += income; cumIn += income;
    let outShard = 0, outLooks = 0, outPool = 0;
    for (let k = 0; k < shardDaily; k++) { const price = shardBuyCost(k, 1); if (coin >= price) { coin -= price; outShard += price; } else break; }
    if (d % LOOKS_EVERY === 0 && coin >= LOOKS_CHANGE.cost) { coin -= LOOKS_CHANGE.cost; outLooks += LOOKS_CHANGE.cost; looks++; }
    const pay = Math.min(coin, pool); coin -= pay; pool -= pay; outPool = pay; if (!drained && pool <= 0) drained = d;
    cumOut += outShard + outLooks + outPool;
    days.push({ day: d, map: inc.map, inHunt, inSell, inSalv, inRing, outShard, outLooks, outPool, stock: coin, cumIn, cumOut, poolLeft: pool });
  }
  void looks; void pool0;
  return { days, drained };
}
const at = (days: Day[], d: number) => days[d - 1];
const MILE = [7, 30, 60, 90, 120];

console.log(`Bán hồn hoàn: ${SELL_RINGS === "off" ? "TẮT (thêm --sell-rings hoặc --sell-rings=guard)" : SELL_RINGS === "all" ? "BẬT, bán mọi hồn hoàn rơi" : `BẬT, chỉ hồn hoàn dưới ${f(AUTO_SELL_GUARD, 0)} năm`}; tự săn nhặt tối đa ${OFFLINE.rings} hồn hoàn mỗi lượt nhận (giả định 1 lượt/ngày).`);
console.log(`Giả lập dòng Hồn Tệ ${DAYS} ngày (kỳ vọng, không tung ngẫu nhiên theo ngày; tung mẫu ${SAMPLES} niên hạn mỗi bản đồ). ƯỚC LƯỢNG, CHƯA ĐO.`);
console.log(`Sink: mảnh Thương hội ${SHARD_BUY.daily}/ngày = ${f(SHARD_DAY, 0)}; túi ${f(BAG_FULL, 0)}; hồn cốt ${f(BONE_FEE_FULL, 0)} × ${BONE_SLOTS.length} ô và hồn hạch ${f(CORE_FEE_FULL, 0)} × ${CORE_SLOTS} ô mỗi võ hồn; trang bị ${f(EQUIP_FEE_FULL, 0)} cho ${EQUIP_SLOTS.length} ô (+${EQUIP_MAX_ENHANCE}); đổi ngoại hình ${f(LOOKS_CHANGE.cost, 0)} mỗi ${LOOKS_EVERY} ngày.`);
void EQUIP_DROP;

// ================= E1: thu nhập mỗi giờ theo bản đồ =================
title("E1. Thu nhập kỳ vọng mỗi giờ theo bản đồ (Hồn Tệ; hiện tại), một võ hồn Cường công ở cấp / hồn hoàn của lộ trình, chưa trang bị");
console.log(head(["Bản đồ", "Giây/con khi treo", "Con/giờ khi treo", "Tay: rơi tiền", "Tay: bán đồ", "Tay: phân giải", `Tay: hồn hoàn <${f(AUTO_SELL_GUARD, 0)}y (${SELL_RINGS === "off" ? "chưa tính" : "đã tính"})`, `Tay: hồn hoàn ≥${f(AUTO_SELL_GUARD, 0)}y (${SELL_RINGS === "all" ? "đã tính" : "chưa tính"})`, "Tay: tổng/giờ", "Treo: tổng/giờ", "Treo/Tay", "Lệnh 2h trả giá/giờ treo"]));
for (const ph of ROUTE) {
  const x = incomeFor(ph.from * 3, 1, SCENARIOS[0]), hand = x.handCoinHour + x.handSellHour + x.handSalvHour + ringHour(x.handRingLowHour, x.handRingHighHour), auto = x.autoCoinHour + x.autoSellHour + x.autoSalvHour + autoRingFactor(x.autoKillsHour, AUTO_HOURS) * ringHour(x.autoRingLowHour, x.autoRingHighHour);
  console.log(row([MAPS[x.map].name, f(x.autoSecs), f(x.autoKillsHour, 0), f(x.handCoinHour, 0), f(x.handSellHour, 0), f(x.handSalvHour, 0), f(x.handRingLowHour, 0), f(x.handRingHighHour, 0), f(hand, 0), f(auto, 0), f(auto / hand, 2), `${f(AUTO_TOKEN_PRICE / AUTO_TOKEN_SECS * 3600, 0)} (${f(AUTO_TOKEN_PRICE / AUTO_TOKEN_SECS * 3600 / auto * 100, 2)}% thu/giờ)`]));
}
console.log(`\nLệnh Ủy Thác: ${f(AUTO_TOKEN_PRICE, 0)} Hồn Tệ cho ${AUTO_TOKEN_SECS / 3600} giờ treo thêm (tích tối đa ${AUTO_BONUS_MAX / 3600} giờ); chỉ tiêu sau khi đã treo hết ${AUTO_DAILY_SECS / 3600} giờ miễn phí.`);

// ================= E2: theo ngày, mỗi hồ sơ =================
for (const p of PROFILES) {
  title(`E2. ${p.name}: Hồn Tệ vào / ra theo ngày (hiện tại; ${TEAM_SIZE} võ hồn đủ hồn cốt / hồn hạch ở sink một lần)`);
  const { days, drained } = simulate(p, TEAM_SIZE, SCENARIOS[0]);
  console.log(head(["Ngày", "Bản đồ", "Vào/ngày", "  rơi tiền", "  bán đồ", "  phân giải trang bị", "  bán hồn hoàn", "Ra: mảnh", "Ra: một lần", "Tồn", "Tổng vào", "Ra/Vào %"]));
  for (const d of MILE) { const x = at(days, d); console.log(row([d, MAPS[x.map].name, f(x.inHunt + x.inSell + x.inSalv + x.inRing, 0), f(x.inHunt, 0), f(x.inSell, 0), f(x.inSalv, 0), f(x.inRing, 0), f(x.outShard, 0), f(x.outPool + x.outLooks, 0), f(x.stock, 0), f(x.cumIn, 0), f(x.cumOut / x.cumIn * 100)])); }
  console.log(`\nSink một lần (túi + hồn cốt + hồn hạch + trang bị) cạn ở ngày: ${drained || `chưa cạn trong ${DAYS} ngày`}.`);
}

// ================= E3: số võ hồn trang bị =================
title("E3. Tồn Hồn Tệ ngày 120 (chính sách tiêu hết mọi sink) theo hồ sơ × số võ hồn có đủ hồn cốt / hồn hạch × có mua mảnh Thương hội hay không (hiện tại)");
console.log(head(["Hồ sơ", ...VOHON_COUNTS.flatMap((n) => [`Mua mảnh, ${n} võ hồn`, `Không mua mảnh, ${n} võ hồn`])]));
for (const p of PROFILES) console.log(row([p.name, ...VOHON_COUNTS.flatMap((n) => [f(at(simulate(p, n, SCENARIOS[0]).days, DAYS).stock, 0), f(at(simulate(p, n, SCENARIOS[0], 0).days, DAYS).stock, 0)])]));
console.log(`
Sink một lần tối đa (túi + hồn cốt + hồn hạch + trang bị; không tính thời điểm có đồ để nâng, và trang bị còn bị đá / bùa chặn): ${VOHON_COUNTS.map((n) => `${n} võ hồn = ${f(BAG_FULL + n * (BONE_SLOTS.length * BONE_FEE_FULL + CORE_SLOTS * CORE_FEE_FULL) + EQUIP_FEE_FULL, 0)}`).join("; ")}; mảnh Thương hội ${f(SHARD_DAY * DAYS, 0)} sau ${DAYS} ngày.`);

// ================= E4: kịch bản chỉnh số (chỉ ước lượng) =================
title(`E4. Kịch bản chỉnh số (CHỈ ước lượng, không sửa shared/data.ts): hồ sơ "${PROFILES[2].name}", ${TEAM_SIZE} võ hồn`);
console.log(head(["Kịch bản", "Vào/ngày ở Lạc Nhật (ngày 30)", "Vào/ngày ở Hải Thần (ngày 120)", "Tồn ngày 120", "Ra/Vào % ngày 120", "Lệnh 2h / thu 2h treo Hải Thần %"]));
for (const sc of SCENARIOS) {
  const { days } = simulate(PROFILES[2], TEAM_SIZE, sc), a = at(days, 30), b = at(days, DAYS), inc = incomeFor(DAYS, PROFILES[2].pace, sc), auto2h = AUTO_TOKEN_SECS / 3600 * (inc.autoCoinHour + inc.autoSellHour + inc.autoSalvHour + autoRingFactor(inc.autoKillsHour, AUTO_TOKEN_SECS / 3600) * ringHour(inc.autoRingLowHour, inc.autoRingHighHour));
  console.log(row([sc.name, f(a.inHunt + a.inSell + a.inSalv + a.inRing, 0), f(b.inHunt + b.inSell + b.inSalv + b.inRing, 0), f(b.stock, 0), f(b.cumOut / b.cumIn * 100), f(sc.tokenPrice / auto2h * 100, 2)]));
}
title(`E4b. Cùng kịch bản, hồ sơ "${PROFILES[1].name}" (không treo)`);
console.log(head(["Kịch bản", "Vào/ngày ở Hải Thần", "Tồn ngày 120", "Ra/Vào % ngày 120"]));
for (const sc of SCENARIOS) { const { days } = simulate(PROFILES[1], TEAM_SIZE, sc), b = at(days, DAYS); console.log(row([sc.name, f(b.inHunt + b.inSell + b.inSalv + b.inRing, 0), f(b.stock, 0), f(b.cumOut / b.cumIn * 100)])); }

// ================= E5: vách đá BEAST_COIN theo bản đồ =================
title("E5. Vách đá BEAST_COIN: bản đồ có bao nhiêu con ≥ 10.000 / ≥ 100.000 năm, Hồn Tệ mỗi con, và số con cần để lên cấp");
console.log(`Hồn Tệ trung bình mỗi bậc: ${BEAST_COIN.map((_, t) => `${TIERS[t].years}y=${f(avgCoin(t), 1)}`).join(", ")}; vách đá 9.999 → 10.000 năm ×${f(avgCoin(3) / avgCoin(2), 1)}, 99.999 → 100.000 năm ×${f(avgCoin(4) / avgCoin(3), 1)}.\n`);
console.log(head(["Bản đồ", "Niên hạn", "% con ≥ 10.000y", "% con ≥ 100.000y", "% tiền từ ≥ 10.000y", "HT/con (hiện tại)", "HT/con (làm mượt)", "Mượt/Hiện tại", "KN/con (đã nhân hệ cấp)", "Con để lên cấp (đầu / giữa / cuối dải)", "HT mỗi cấp (đầu / giữa / cuối)"]));
for (const m of Object.values(MAPS)) {
  if (!m.years || !m.level) continue;
  const [lo, hi] = m.years, r = rng(4242); let over1 = 0, over2 = 0, cur = 0, smo = 0, curHi = 0, xp = 0;
  const L0 = m.level[0], L1 = m.level[1], Lm = Math.round((L0 + L1) / 2);
  for (let i = 0; i < 4000; i++) {
    const y = rollYears(lo, hi, r()), c = baseCoin(y); cur += c; smo += smoothCoin(y); if (y >= TIERS[3].years) { over1++; curHi += c; } if (y >= TIERS[4].years) over2++;
    xp += beastStats(y).xp * xpLevelScale(Lm, beastLevel(y));
  }
  const n = 4000, killsFor = (L: number) => { let x = 0; const r2 = rng(4242); for (let i = 0; i < 1000; i++) { const y = rollYears(lo, hi, r2()); x += beastStats(y).xp * xpLevelScale(L, beastLevel(y)); } return xpNeed(L) / (XP_SHARE_ACTIVE * (x / 1000)); };
  const ks = [L0, Lm, L1].map(killsFor), coinPerKill = cur / n;
  console.log(row([m.name, `${f(lo, 0)}–${f(hi, 0)}`, f(over1 / n * 100), f(over2 / n * 100), f(curHi / cur * 100), f(coinPerKill, 1), f(smo / n, 1), f(smo / cur, 2), f(xp / n, 0), ks.map((k) => f(k, 1)).join(" / "), ks.map((k) => f(k * coinPerKill, 0)).join(" / ")]));
}
console.log(`\n"Con để lên cấp" = xpNeed(cấp) ÷ (XP_SHARE_ACTIVE × kinh nghiệm TB một con của bản đồ): CHỈ tính kinh nghiệm võ hồn ra trận (võ hồn dự bị nhận XP_SHARE_BENCH thêm, bình cảnh chặn lên cấp không tính).`);
