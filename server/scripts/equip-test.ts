// Kiểm thử hàm thuần trang bị hồn sư (shared/data.ts, mục 5.15): không cần bật server, RNG có hạt.
// Chạy: npm run test:equip --prefix server
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EQUIP_SLOTS, EQUIP_TIERS, EQUIP_TEMPLATES, EQUIP_DROP, EQUIP_MAPS, EQUIP_ENHANCE, EQUIP_SYNTH, EQUIP_MATERIALS, EQUIP_STONES, EQUIP_SALVAGE,
  EQUIP_LUCK_MAX, EQUIP_LUCK_UP, equipLuckStep, EQUIP_MAX_ENHANCE, KING_CHEST, WORLD_CHEST, EQUIP_ITEM, EQUIP_CHARM, BONE_PASSIVE_CAP, CORE_STATS, MAPS, ITEMS, ITEM_KINDS,
  equipTemplate, equipEnhanceMult, equipEnhanceStep, equipEnhanceResult, equipWeaponRoll, equipStats, equipDefTotal, equipSalvage,
  rollEquip, rollEquipDrop, rollEquipCharm, itemDef, equipIconKeys, equipIconChain, equipFrameKey,
} from "../../shared/data.ts";

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function test(title: string, fn: () => void) { fn(); console.log(`✓ ${title}`); }
const near = (got: number, want: number, tol: number, what: string) => assert.ok(Math.abs(got - want) <= tol, `${what}: ${got} lệch ${want} quá ±${tol}`);

test("Dữ liệu: 10 ô × 6 bậc = 60 mẫu, mã và tên không trùng, mọi mẫu tra được", () => {
  assert.equal(EQUIP_SLOTS.length, 10); assert.equal(EQUIP_TIERS.length, 6); assert.equal(EQUIP_TEMPLATES.length, 60);
  assert.equal(new Set(EQUIP_TEMPLATES.map((t) => t.id)).size, 60); assert.equal(new Set(EQUIP_TEMPLATES.map((t) => t.name)).size, 60);
  for (const t of EQUIP_TEMPLATES) assert.equal(equipTemplate(t.id), t);
  assert.equal(equipTemplate("khong_co"), undefined);
  assert.ok(EQUIP_SLOTS.every((s) => s.main in CORE_STATS), "chỉ số chính phải thuộc bộ CORE_STATS");
  assert.equal(EQUIP_SLOTS.filter((s) => s.luck).map((s) => s.id).join(), "vu_khi,day_chuyen");
  assert.equal(EQUIP_SLOTS.filter((s) => s.weapon).length, 1);
});

test("Dữ liệu: mọi bản đồ săn / Lõi có bảng rơi; vật phẩm, nguyên liệu có trong ITEMS; nhóm vật phẩm khai báo", () => {
  for (const m of Object.values(MAPS)) if (m.kind === "hunt" || m.kind === "boss") assert.ok(EQUIP_MAPS[m.id], `thiếu EQUIP_MAPS cho ${m.id}`);
  for (const id of Object.keys(EQUIP_MAPS)) assert.ok(MAPS[id], `bản đồ lạ ${id}`);
  assert.equal(itemDef(EQUIP_ITEM)?.kind, "trang_bi"); assert.ok("trang_bi" in ITEM_KINDS && "nguyen_lieu" in ITEM_KINDS);
  for (const m of EQUIP_MATERIALS) assert.equal(itemDef(m.id)?.kind, "nguyen_lieu");
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length, "mã vật phẩm trùng");
  for (const s of EQUIP_SALVAGE) for (const x of s.mats) assert.ok(itemDef(x.code), `phân giải ra mã lạ ${x.code}`);
  assert.equal(EQUIP_STONES.length, 5);
});

test("Cường hóa: hệ số tăng dần, +0 = ×1, +15 ≈ ×1,93; nấc đúng theo bảng", () => {
  assert.equal(equipEnhanceMult(0), 1);
  for (let e = 1; e <= EQUIP_MAX_ENHANCE; e++) assert.ok(equipEnhanceMult(e) > equipEnhanceMult(e - 1));
  near(equipEnhanceMult(15), 1.93, 0.01, "×+15"); near(equipEnhanceMult(99), equipEnhanceMult(15), 1e-9, "kẹp cấp"); assert.equal(equipEnhanceMult(-3), 1);
  assert.equal(equipEnhanceStep(0), EQUIP_ENHANCE[0]); assert.equal(equipEnhanceStep(2), EQUIP_ENHANCE[0]); assert.equal(equipEnhanceStep(3), EQUIP_ENHANCE[1]);
  assert.equal(equipEnhanceStep(9), EQUIP_ENHANCE[3]); assert.equal(equipEnhanceStep(12), EQUIP_ENHANCE[4]); assert.equal(equipEnhanceStep(14), EQUIP_ENHANCE[4]);
  assert.equal(equipEnhanceStep(15), null); assert.equal(equipEnhanceResult(15, true, false), null);
});

test("Cường hóa: thất bại theo từng nấc; +13–15 không bùa phá hủy, có bùa giữ cấp và tiêu bùa", () => {
  assert.deepEqual(equipEnhanceResult(5, true, false), { enhance: 6, destroyed: false, charmUsed: false });
  assert.deepEqual(equipEnhanceResult(4, false, false), { enhance: 4, destroyed: false, charmUsed: false }, "nấc +4–6 giữ cấp");
  assert.deepEqual(equipEnhanceResult(8, false, false), { enhance: 7, destroyed: false, charmUsed: false }, "nấc +7–9 tụt 1");
  assert.deepEqual(equipEnhanceResult(11, false, false), { enhance: 10, destroyed: false, charmUsed: false }, "nấc +10–12 tụt 1");
  for (const e of [12, 13, 14]) {
    assert.deepEqual(equipEnhanceResult(e, false, false), { enhance: 0, destroyed: true, charmUsed: false }, `+${e} thất bại không bùa`);
    assert.deepEqual(equipEnhanceResult(e, false, true), { enhance: e, destroyed: false, charmUsed: true }, `+${e} thất bại có bùa`);
    assert.deepEqual(equipEnhanceResult(e, true, true), { enhance: e + 1, destroyed: false, charmUsed: false }, "thành công không tiêu bùa");
  }
  assert.deepEqual(equipEnhanceResult(2, false, true), { enhance: 2, destroyed: false, charmUsed: false }, "bùa không tiêu ở nấc không phá hủy");
});

test("May mắn: tổng ≥ 9 thì 1.000 đòn đều ra max; 0 thì rải đều trong [min, max]; xác suất max = L/9", () => {
  const w = { min: 40, max: 60 }, r = rng(1);
  for (let i = 0; i < 1000; i++) assert.equal(equipWeaponRoll(w, EQUIP_LUCK_MAX, r), 60);
  for (let i = 0; i < 1000; i++) assert.equal(equipWeaponRoll(w, 99, r), 60);
  let sum = 0, atMax = 0, n = 100000;
  for (let i = 0; i < n; i++) { const v = equipWeaponRoll(w, 0, r); assert.ok(v >= 40 && v <= 60); sum += v; if (v === 60) atMax++; }
  near(sum / n, 50, 0.2, "trung bình luck 0"); assert.equal(atMax, 0);
  atMax = 0; for (let i = 0; i < n; i++) if (equipWeaponRoll(w, 3, r) === 60) atMax++;
  near(atMax / n, 3 / 9, 0.01, "xác suất max luck 3");
});

test("equipStats: bộ trống, một món, chỉ số chính đúng ô, công vũ khí là khoảng, giảm sát thương, may mắn kẹp 9, ô trùng bị bỏ", () => {
  const z = equipStats([]); assert.equal(z.weapon, null); assert.equal(z.red, 0); assert.equal(z.luck, 0); assert.ok(Object.values(z.bonus).every((v) => v === 0));
  const ao = equipStats([{ tpl: "ao_tu_kim", ilvl: 4 }]);
  assert.equal(ao.bonus.hp, Math.round(300 * 1 * 0.3 * 0.82)); near(ao.red, 0.03 * 0.7, 1e-9, "giảm ST áo T3");
  assert.equal(ao.bonus.atk, 0);
  const vk = equipStats([{ tpl: "vu_khi_chi_bao", ilvl: 7, enhance: 15 }, { tpl: "day_chuyen_than_khi", ilvl: 6, luck: 6 }, { tpl: "vu_khi_pham_khi", ilvl: 1 }]);
  assert.ok(vk.weapon && vk.weapon.max > vk.weapon.min && vk.weapon.min >= 1);
  const mid = 30 * 2 * 0.65 * 1.05 * (1 + 0.016 * Math.pow(15, 1.5)); near((vk.weapon!.min + vk.weapon!.max) / 2, mid, 1, "công giữa vũ khí Chí Bảo +15");
  assert.equal(vk.bonus.atk, 0, "công vũ khí không nằm trong bonus"); assert.equal(vk.luck, 6);
  // khắc may mắn: tỉ lệ theo bảng, trần món / trần tổng hai ô đang mặc
  assert.equal(EQUIP_LUCK_UP.length, EQUIP_LUCK_MAX); assert.deepEqual(equipLuckStep(0, null), { to: 1, p: EQUIP_LUCK_UP[0] });
  assert.equal(equipLuckStep(EQUIP_LUCK_MAX, null), null); assert.equal(equipLuckStep(2, EQUIP_LUCK_MAX), null); assert.equal(equipLuckStep(2, EQUIP_LUCK_MAX - 1)?.to, 3);
  assert.equal(equipStats([{ tpl: "vu_khi_tu_kim", ilvl: 3, luck: 7 }, { tpl: "day_chuyen_tu_kim", ilvl: 3, luck: 8 }]).luck, EQUIP_LUCK_MAX);
  assert.equal(equipStats([{ tpl: "ao_pham_khi", ilvl: 1 }, { tpl: "ao_chi_bao", ilvl: 7 }]).bonus.hp, equipStats([{ tpl: "ao_pham_khi", ilvl: 1 }]).bonus.hp, "ô trùng chỉ tính món đầu");
  assert.equal(equipStats([{ tpl: "khong_co", ilvl: 1 }]).red, 0);
  // dòng phụ cộng đúng mã
  const sub = equipStats([{ tpl: "mu_tu_kim", ilvl: 4, affixes: [["hp", 1], ["crit", 1]] }]);
  assert.equal(sub.bonus.hp, Math.round(90 * 0.2 * 0.82)); assert.equal(sub.bonus.mp, Math.round(120 * 0.6 * 0.3 * 0.82));
});

test("Giảm sát thương nhận chung trần với bị động hồn cốt; bộ Chí Bảo đủ 4 ô chỉ chiếm phần nhỏ của trần", () => {
  assert.equal(equipDefTotal(0.25, 0.1), BONE_PASSIVE_CAP.def); assert.equal(equipDefTotal(0, 0.05), 0.05); assert.equal(equipDefTotal(-1, -1), 0);
  const full = equipStats(EQUIP_SLOTS.map((s) => ({ tpl: `${s.id}_chi_bao`, ilvl: 7 })));
  near(full.red, 0.08, 1e-9, "giảm ST cả bộ Chí Bảo"); assert.ok(full.red < BONE_PASSIVE_CAP.def / 3);
});

test("rollEquip: dòng phụ đúng số theo bậc, khác nhau, khác chỉ số chính; may mắn chỉ ở ô may mắn", () => {
  const r = rng(5);
  for (const t of EQUIP_TEMPLATES) {
    const e = rollEquip(t, 3, r), slot = EQUIP_SLOTS.find((s) => s.id === t.slot)!;
    assert.equal(e.affixes.length, EQUIP_TIERS[t.tier].lines); assert.equal(new Set(e.affixes.map((a) => a[0])).size, e.affixes.length);
    assert.ok(e.affixes.every(([k, v]) => k !== slot.main && v >= 0.7 && v <= 1)); assert.ok(Math.abs(e.roll) <= 0.05);
    if (!slot.luck) assert.equal(e.luck, 0);
  }
  let lucky = 0; const w = EQUIP_TEMPLATES.find((t) => t.id === "vu_khi_tu_kim")!;
  for (let i = 0; i < 200000; i++) lucky += rollEquip(w, 3, r).luck;
  near(lucky / 200000, EQUIP_DROP.luck, 0.002, "tỉ lệ may mắn +1");
});

/** Phân bố bậc của các món rơi sau `kills` lần hạ (hồn thú bậc `rank` ở `mapId`). */
function dist(rank: number, mapId: string, kills: number, seed: number, rate = 0) {
  const r = rng(seed), tiers = Array(6).fill(0), stones = Array(5).fill(0); let equips = 0, rollsStone = 0;
  for (let i = 0; i < kills; i++) for (const d of rollEquipDrop(rank, mapId, r, rate)) {
    if (d.kind === "equip") { tiers[EQUIP_TIERS.findIndex((t) => d.item.tpl.endsWith(t.id))]++; equips++; } else { stones[EQUIP_STONES.findIndex((s) => s.id === d.code)] += d.qty; rollsStone++; }
  }
  return { tiers, stones, equips, rollsStone };
}
test("Monte Carlo rơi: 100.000 lần hạ thú vương ở Hải Thần Đảo, tỉ lệ từng nhóm bậc nằm trong ±2% cấu hình", () => {
  const cfg = EQUIP_DROP.ranks[2], d = dist(2, "hai_than_dao", 100000, 11), rolls = 100000 * (cfg.rolls[0] + cfg.rolls[1]) / 2, tot = cfg.p.reduce((a, x) => a + x, 0);
  const share = (lo: number, hi: number) => d.tiers.slice(lo, hi + 1).reduce((a, x) => a + x, 0) / rolls;
  near(share(0, 1), cfg.p[1] / tot, 0.02, "T0–T1"); near(share(2, 3), cfg.p[2] / tot, 0.02, "T2–T3"); near(share(4, 5), cfg.p[3] / tot, 0.02, "T4–T5");
  near(d.rollsStone / rolls, cfg.p[0] / tot, 0.02, "đồ tạp");
  const t45 = d.tiers[4] + d.tiers[5]; near(d.tiers[5] / t45, cfg.t5, 0.02, "T5 trong T4–T5");
});
test("Monte Carlo rơi: mỗi bậc hồn thú (thường, tinh anh, thú vương, boss) khớp cấu hình; số lượt trung bình đúng", () => {
  EQUIP_DROP.ranks.forEach((cfg, rank) => {
    const kills = rank === 0 ? 400000 : 100000, d = dist(rank, "loi_tinh_dau", kills, 20 + rank), tot = cfg.p.reduce((a, x) => a + x, 0);
    const rolls = kills * cfg.chance * (cfg.rolls[0] + cfg.rolls[1]) / 2;
    near((d.equips + d.rollsStone) / rolls, 1, 0.02, `bậc ${rank}: số lượt rơi`);
    const share = (lo: number, hi: number) => d.tiers.slice(lo, hi + 1).reduce((a, x) => a + x, 0) / rolls;
    near(share(0, 1), cfg.p[1] / tot, 0.02, `bậc ${rank} T0–T1`); near(share(2, 3), cfg.p[2] / tot, 0.02, `bậc ${rank} T2–T3`); near(share(4, 5), cfg.p[3] / tot, 0.02, `bậc ${rank} T4–T5`);
  });
});
test("Rơi: bản đồ kẹp bậc tối đa, bản đồ / bậc lạ không rơi, rate âm = chỉ rơi đồ tạp, rate vượt trần bị kẹp", () => {
  const th = dist(3, "thanh_hon_thon", 20000, 31); assert.equal(th.tiers.slice(EQUIP_MAPS.thanh_hon_thon.maxTier + 1).reduce((a, x) => a + x, 0), 0);
  assert.ok(th.tiers[EQUIP_MAPS.thanh_hon_thon.maxTier] > 0);
  assert.deepEqual(rollEquipDrop(2, "khong_co", rng(1)), []); assert.deepEqual(rollEquipDrop(9, "hai_than_dao", rng(1)), []); assert.deepEqual(rollEquipDrop(-1, "hai_than_dao", rng(1)), []);
  const neg = dist(2, "hai_than_dao", 5000, 41, -1); assert.equal(neg.equips, 0); assert.ok(neg.rollsStone > 0);
  assert.equal(dist(2, "hai_than_dao", 5000, 41, NaN).equips > 0, true, "rate NaN coi như 0");
  const capped = dist(0, "hai_than_dao", 300000, 51, 999), capD = dist(0, "hai_than_dao", 300000, 51, EQUIP_DROP.rateCap - 1);
  assert.deepEqual(capped.tiers, capD.tiers, "rate lớn bị kẹp bằng trần");
  const base = dist(0, "hai_than_dao", 300000, 51, 0); assert.ok(capD.equips > base.equips * 2, "rate tăng xác suất trang bị");
  // đá rơi theo bản đồ: Thánh Hồn Thôn không ra đá III trở lên
  assert.equal(th.stones.slice(2).reduce((a, x) => a + x, 0), 0);
});
test("Rương (E2): số ô trống cần để mở đủ chứa lượt rơi tối đa + Bùa Hộ Mệnh, ngoài 4 ô hồn cốt / mảnh / UR / hồn hạch (thú vương: 3 thứ, boss: 3 thứ + 1 dự phòng)", () => {
  assert.ok(KING_CHEST.slots >= 4 + EQUIP_DROP.ranks[2].rolls[1] + 1, `KING_CHEST.slots ${KING_CHEST.slots} không đủ`);
  assert.ok(WORLD_CHEST.slots >= 4 + EQUIP_DROP.ranks[3].rolls[1] + 1, `WORLD_CHEST.slots ${WORLD_CHEST.slots} không đủ`);
});
test("Monte Carlo so với docs/trang-bi-kinh-te.md mục 2: mỗi lần hạ thú vương / boss thế giới, số món từng bậc, đá và Bùa khớp bảng (100.000 lần)", () => {
  const md = readFileSync(new URL("../../docs/trang-bi-kinh-te.md", import.meta.url), "utf8"), start = md.indexOf("### 2."), end = md.indexOf("### 3.");
  assert.ok(start >= 0 && end > start, "không thấy mục 2 trong docs");
  const rows = new Map<string, number[]>();
  for (const line of md.slice(start, end).split(/\r?\n/)) {
    const c = line.split("|").map((x) => x.trim()).filter(Boolean);
    if (c.length === 13 && !c[0].startsWith("---") && c[0] !== "Loại") rows.set(c[0], c.slice(1).map((x) => Number(x.replace(/\./g, "").replace(",", "."))));
  }
  const kinds: [string, number, string][] = [["Thú vương Nội địa", 2, "tinh_dau_noi_dia"], ["Thú vương Cực Bắc", 2, "cuc_bac_chi_dia"], ["Thú vương Hải Thần", 2, "hai_than_dao"], ["Boss thế giới", 3, "loi_tinh_dau"]];
  for (const [name, rank, mapId] of kinds) {
    const want = rows.get(name); assert.ok(want && want.length === 12, `thiếu hàng "${name}" trong docs`);
    const d = dist(rank, mapId, 100000, rank * 31), r = rng(rank * 77); let charm = 0; for (let i = 0; i < 100000; i++) charm += rollEquipCharm(rank, r);
    const got = [...d.tiers.map((x) => x / 100000), ...d.stones.map((x) => x / 100000), charm / 100000];
    got.forEach((v, i) => near(v, want[i], 0.06, `${name} cột ${i}`));
  }
});
test("Bùa Hộ Mệnh: chỉ thú vương / boss thế giới, tần suất khớp cấu hình", () => {
  const r = rng(61); let n2 = 0, n3 = 0, n0 = 0;
  for (let i = 0; i < 200000; i++) { n2 += rollEquipCharm(2, r); n3 += rollEquipCharm(3, r); n0 += rollEquipCharm(0, r) + rollEquipCharm(1, r); }
  near(n2 / 200000, EQUIP_DROP.ranks[2].charm, 0.01, "thú vương"); near(n3 / 200000, EQUIP_DROP.ranks[3].charm, 0.01, "boss thế giới"); assert.equal(n0, 0);
  assert.equal(itemDef(EQUIP_CHARM)?.kind, "nguyen_lieu");
});

test("Phân giải: Hồn Tệ theo bậc × (1 + cấp/5), nguyên liệu theo bảng, không bao giờ cho kinh nghiệm", () => {
  assert.deepEqual(equipSalvage(0, 0, () => 0.99), { coin: 4, items: [{ code: "da_cuong_hoa_1", qty: 2 }] }); assert.deepEqual(equipSalvage(2, 0, () => 0.99).items.map((i) => i.code), ["da_cuong_hoa_2"], "p 0,5 không ra khi tung 0,99");
  assert.equal(equipSalvage(2, 5, () => 0.99).coin, 80);
  const all = equipSalvage(5, 0, () => 0); assert.equal(all.coin, 1200); assert.ok(all.items.some((i) => i.code === "than_hon") && all.items.some((i) => i.code === "tinh_hoa_duong_mon"));
  for (let t = 0; t < 6; t++) assert.ok(equipSalvage(t, 0, rng(t)).coin > 0);
  const c = EQUIP_SALVAGE.map((s) => s.coin); assert.deepEqual([...c].sort((a, b) => a - b), c, "Hồn Tệ phân giải tăng theo bậc");
});

test("Hợp thành: 5 bước T0→T5, tỉ lệ giảm dần, đúng luật thất bại đã chốt (T3→T4 trừ 1 cấp chính, T4→T5 mất cả 3 và hoàn Tinh Hoa)", () => {
  assert.equal(EQUIP_SYNTH.length, 5);
  for (let i = 0; i < 5; i++) { assert.equal(EQUIP_SYNTH[i].from, i); if (i) assert.ok(EQUIP_SYNTH[i].p < EQUIP_SYNTH[i - 1].p && EQUIP_SYNTH[i].fee > EQUIP_SYNTH[i - 1].fee); }
  assert.equal(EQUIP_SYNTH[3].mainLoss, 1); assert.equal(EQUIP_SYNTH[3].all, false); assert.equal(EQUIP_SYNTH[4].all, true); assert.equal(EQUIP_SYNTH[4].refund, 0.3);
  assert.ok(EQUIP_SYNTH[4].essence > 0);
});
test("Cân bằng: bậc cao hơn luôn mạnh hơn bậc dưới ở cùng cấp vật phẩm; cùng bậc bản đồ sâu mạnh hơn; +cường hóa không lấn quá bậc kế quá xa", () => {
  const a = (t: number, il = 4, e = 0) => equipStats([{ tpl: `ao_${EQUIP_TIERS[t].id}`, ilvl: il, enhance: e }]).bonus.hp;
  for (let t = 1; t < 6; t++) assert.ok(a(t) > a(t - 1));
  for (let il = 2; il <= 7; il++) assert.ok(a(3, il) >= a(3, il - 1));
  assert.ok(a(2, 4, 10) < a(4, 4, 0) * 1.3, "Hàn Ngọc +10 không vượt xa Thần Khí +0");
});

test("Khóa ảnh: 76 khóa duy nhất (60 mẫu + 10 hình ô + 6 khung), chuỗi tra mẫu → ô → nhóm; mã lạ về ảnh nhóm", () => {
  const k = equipIconKeys(); assert.equal(k.length, 76); assert.equal(new Set(k).size, 76);
  assert.deepEqual(equipIconChain("mu_tu_kim"), ["item_equip_mu_tu_kim", "item_equip_slot_mu", "item_trang_bi"]);
  assert.deepEqual(equipIconChain("khong_co"), ["item_trang_bi"]); assert.equal(equipFrameKey(5), "item_equip_frame_chi_bao");
});

test("Rate: xác suất trang bị mỗi lần hạ ≤ rateCap × gốc, đá mỗi lần hạ và số lượt rơi không đổi theo rate (mọi bậc hồn thú)", () => {
  const n = 300000;
  for (const rank of [0, 1, 2, 3]) {
    const base = dist(rank, "hai_than_dao", n, 70 + rank, 0), hi = dist(rank, "hai_than_dao", n, 70 + rank, 99), mid = dist(rank, "hai_than_dao", n, 70 + rank, 1);
    const cfg = EQUIP_DROP.ranks[rank], eqBase = base.equips / n, stoneBase = base.rollsStone / n;
    assert.ok(hi.equips / n <= eqBase * EQUIP_DROP.rateCap * 1.03 + 0.001, `bậc ${rank}: rate ở trần ${hi.equips / n} vượt ${EQUIP_DROP.rateCap} × ${eqBase}`);
    assert.ok(hi.equips >= base.equips && mid.equips >= base.equips, "rate không làm giảm trang bị");
    near(hi.rollsStone / n, stoneBase, Math.max(0.003, stoneBase * 0.03), `bậc ${rank}: số lần rơi đá đổi theo rate`);
    near(mid.rollsStone / n, stoneBase, Math.max(0.003, stoneBase * 0.03), `bậc ${rank}: số lần rơi đá đổi theo rate (1)`);
    void cfg;
  }
  const t = dist(0, "hai_than_dao", 1_000_000, 90, 2), t0 = dist(0, "hai_than_dao", 1_000_000, 90, 0);
  near(t.equips / t0.equips, 3, 0.15, "hồn thú thường, rate = 2 (mult 3): đúng ×3, không ×4,3");
});
