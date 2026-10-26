// Bất biến dữ liệu kinh tế (shared/data.ts): chỉ khẳng định quan hệ giữa các số, không chép số cụ thể (luật "số chỉ ở data.ts").
// Chạy: npm run test:econ --prefix server
import assert from "node:assert/strict";
import {
  BONE_ENHANCE_COST, BONE_ENHANCE_FEE, BONE_MAX_ENHANCE, CORE_ENHANCE_COST, CORE_ENHANCE_FEE, CORE_MAX_ENHANCE, CORE_SELL, STAR_COST, EQUIP_SALVAGE,
  BAG_SLOTS, BAG_EXPAND, BAG_EXPAND_COST, BAG_MAX_SLOTS, BEAST_COIN, SHOP, CAMP_SHOP, SHARD_SELL, shardBuyPrice, RING_SELL, ringSellPrice, ITEMS, itemDef, sellPrice,
} from "../../shared/data.ts";

function test(title: string, fn: () => void) { fn(); console.log(`✓ ${title}`); }
const nonDecreasing = (a: readonly number[], what: string) => { for (let i = 1; i < a.length; i++) assert.ok(a[i] >= a[i - 1], `${what}[${i}] = ${a[i]} < ${a[i - 1]}`); };

test("Phí / giá theo cấp: không giảm, độ dài khớp cấp tối đa", () => {
  assert.equal(BONE_ENHANCE_COST.length, BONE_MAX_ENHANCE); assert.equal(BONE_ENHANCE_FEE.length, BONE_MAX_ENHANCE);
  assert.equal(CORE_ENHANCE_COST.length, CORE_MAX_ENHANCE); assert.equal(CORE_ENHANCE_FEE.length, CORE_MAX_ENHANCE);
  nonDecreasing(BONE_ENHANCE_COST, "BONE_ENHANCE_COST"); nonDecreasing(BONE_ENHANCE_FEE, "BONE_ENHANCE_FEE");
  nonDecreasing(CORE_ENHANCE_COST, "CORE_ENHANCE_COST"); nonDecreasing(CORE_ENHANCE_FEE, "CORE_ENHANCE_FEE");
  nonDecreasing(CORE_SELL, "CORE_SELL"); nonDecreasing(BAG_EXPAND_COST, "BAG_EXPAND_COST"); nonDecreasing(STAR_COST, "STAR_COST");
  nonDecreasing(EQUIP_SALVAGE.map((s) => s.coin), "EQUIP_SALVAGE.coin");
});

test("Túi: BAG_SLOTS + BAG_EXPAND × số bậc mở rộng = BAG_MAX_SLOTS", () => {
  assert.equal(BAG_SLOTS + BAG_EXPAND * BAG_EXPAND_COST.length, BAG_MAX_SLOTS);
});

test("Thương nhân: không món nào bán rẻ hơn giá mua lại (không vòng in tiền); mã có trong ITEMS", () => {
  for (const [name, shop] of [["SHOP", SHOP], ["CAMP_SHOP", CAMP_SHOP]] as const) {
    assert.equal(new Set(shop.map((s) => s.code)).size, shop.length, `${name} trùng mã`);
    for (const s of shop) {
      assert.ok(itemDef(s.code), `${name}: mã lạ ${s.code}`);
      assert.ok(s.price > 0, `${name}.${s.code} giá không dương`);
      const back = sellPrice({ code: s.code, years: null, stars: null, enhance: 0 });
      if (back !== null) assert.ok(s.price >= back, `${name}.${s.code}: bán ${s.price} < mua lại ${back}`);
    }
  }
  for (const s of SHOP) assert.ok(ITEMS.some((i) => i.id === s.code), `SHOP: ${s.code} không có trong ITEMS`);
  for (const c of CAMP_SHOP) { const base = SHOP.find((s) => s.code === c.code); if (base) assert.ok(c.price >= base.price, `CAMP_SHOP.${c.code} rẻ hơn SHOP`); }
});

test("Mảnh võ hồn: mua tăng dần, bán rẻ hơn mua một khoảng xa", () => {
  const buys = Array.from({ length: 20 }, (_, i) => shardBuyPrice(i));
  for (let i = 1; i < buys.length; i++) assert.ok(buys[i] > buys[i - 1], `shardBuyPrice(${i}) không tăng`);
  for (const [r, p] of Object.entries(SHARD_SELL)) assert.ok(p * 10 <= shardBuyPrice(0), `SHARD_SELL.${r} = ${p} không ≪ shardBuyPrice(0)`);
});

test("Hồn hoàn: ringSellPrice không giảm theo năm; mốc RING_SELL tăng", () => {
  nonDecreasing(RING_SELL.map((r) => r[0]), "RING_SELL.năm"); nonDecreasing(RING_SELL.map((r) => r[1]), "RING_SELL.giá");
  let prev = 0;
  for (let y = 1; y <= RING_SELL[RING_SELL.length - 1][0] * 2; y = Math.ceil(y * 1.05) + 1) { const p = ringSellPrice(y); assert.ok(p >= prev, `ringSellPrice(${y}) = ${p} < ${prev}`); prev = p; }
});

test("Tiền rơi hồn thú: min ≤ max, không giảm theo bậc", () => {
  for (const [i, [lo, hi]] of BEAST_COIN.entries()) assert.ok(lo <= hi, `BEAST_COIN[${i}]: ${lo} > ${hi}`);
  nonDecreasing(BEAST_COIN.map((c) => c[0]), "BEAST_COIN.min"); nonDecreasing(BEAST_COIN.map((c) => c[1]), "BEAST_COIN.max");
});
