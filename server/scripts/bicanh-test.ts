// Bí Cảnh (docs/design/bi-canh.md mục 5.22, bước P1 + P2 + P4): hàm thuần (khóa ngày 05:00, đếm ngược, giá lượt lũy tiến), bảng quan hệ cân bằng (quyển ≪ một giờ săn, giá lượt vs
// các nơi tiêu Hồn Tệ khác), `runView` và luật trần mua của `MemoryStore.claimBoss` (cùng luật với PgStore). Phần chạy trong phòng (tin `bicanh`, mua lượt, dùng quyển cho võ hồn dự bị,
// bình cảnh, hoàn lại khi lỗi, qua 05:00) do bot thử (BOT_ONLY=bicanh). Chạy: npm run test:bicanh --prefix server
import assert from "node:assert/strict";
import { MemoryStore } from "../src/db.ts";
import { BAG_EXPAND_COST, BICANH, ITEMS, RING_LIMIT, SHARD_BUY, XP_SHARE_BENCH, beastStats, bicanhBuyKind, bicanhDay, bicanhResetIn, bicanhRunKind, bicanhRunPrice, bicanhScene,
  itemDef, sellPrice, shardBuyPrice, vnAt, vnDay } from "../../shared/data.ts";
import { runView } from "../src/rooms/bicanh.ts";

function test(title: string, fn: () => void | Promise<void>) { return Promise.resolve(fn()).then(() => console.log(`✓ ${title}`)); }
const S = BICANH.scenes[0], HOUR = 3600000;

await test("BICANH: hình dạng (phụ bản mã duy nhất, lượt / trần mua dương, giá lũy tiến > 1), mã phụ bản lạ không tra được", () => {
  assert.ok(BICANH.scenes.length >= 1 && new Set(BICANH.scenes.map((s) => s.id)).size === BICANH.scenes.length);
  for (const s of BICANH.scenes) { assert.ok(s.runs >= 1 && s.buyMax >= 1 && s.buyBase > 0 && s.buyGrow > 1, `phụ bản ${s.id}`); assert.equal(bicanhScene(s.id), s); }
  for (const x of ["", "x", null, undefined, 0, {}, "Luyen_Hon", "__proto__"]) assert.equal(bicanhScene(x), undefined, `mã lạ ${String(x)}`);
  assert.ok(Number.isInteger(BICANH.resetHour) && BICANH.resetHour > 0 && BICANH.resetHour < 24);
  assert.notEqual(bicanhRunKind(S.id), bicanhBuyKind(S.id)); assert.ok(bicanhRunKind(S.id).startsWith(BICANH.claimKind));
});
await test("bicanhDay: đổi ngày lúc 05:00 giờ Việt Nam (04:59:59 vẫn ngày trước, 05:00:00 sang ngày mới), khác vnDay trong khoảng 00:00–05:00", () => {
  const d = Date.UTC(2026, 9, 28, 12, 0), at = (hh: number, mi: number, s: number, off = 0) => vnAt(d, "00:00", off) + ((hh * 60 + mi) * 60 + s) * 1000;
  assert.equal(bicanhDay(at(5, 0, 0)), "2026-10-28"); assert.equal(bicanhDay(at(4, 59, 59)), "2026-10-27"); assert.equal(bicanhDay(at(23, 59, 59)), "2026-10-28");
  assert.equal(bicanhDay(at(0, 0, 0)), "2026-10-27"); assert.equal(bicanhDay(at(0, 0, 0, 1)), "2026-10-28"); assert.equal(bicanhDay(at(5, 0, 0, 1)), "2026-10-29");
  assert.equal(vnDay(at(2, 0, 0)), "2026-10-28"); assert.equal(bicanhDay(at(2, 0, 0)), "2026-10-27", "00:00–05:00 còn thuộc ngày Bí Cảnh hôm trước");
  assert.equal(bicanhDay(Date.UTC(2026, 11, 31, 20, 0)), "2026-12-31", "qua năm: 03:00 ngày 1/1 giờ VN còn ngày Bí Cảnh 31/12"); // 20:00 UTC = 03:00 ngày 1/1 VN
  assert.equal(bicanhDay(Date.UTC(2026, 11, 31, 22, 0)), "2027-01-01", "05:00 ngày 1/1 giờ VN sang năm mới");
});
await test("bicanhResetIn: luôn > 0 và ≤ 24 giờ; đúng bằng khoảng tới 05:00 kế tiếp; đúng 05:00:00 là 24 giờ", () => {
  const d0 = Date.UTC(2026, 9, 28), at5 = vnAt(d0 + 12 * HOUR, "05:00");
  assert.equal(bicanhResetIn(at5 - 1), 1); assert.equal(bicanhResetIn(at5), 24 * HOUR); assert.equal(bicanhResetIn(at5 + 1), 24 * HOUR - 1);
  assert.equal(bicanhResetIn(at5 - 6 * HOUR), 6 * HOUR);
  for (let k = 0; k < 96; k++) {
    const ms = d0 + k * 15 * 60000, r = bicanhResetIn(ms);
    assert.ok(r > 0 && r <= 24 * HOUR, `ms ${ms}: ${r}`);
    assert.notEqual(bicanhDay(ms), bicanhDay(ms + r), "sau resetIn đã sang ngày Bí Cảnh mới"); assert.equal(bicanhDay(ms + r - 1), bicanhDay(ms), "ngay trước đó vẫn ngày cũ");
  }
});
await test("bicanhRunPrice: nguyên, dương, làm tròn trăm, tăng đơn điệu; lượt đầu = buyBase; số âm / lẻ kẹp về 0", () => {
  assert.equal(bicanhRunPrice(S, 0), Math.round(S.buyBase / 100) * 100);
  let prev = 0;
  for (let i = 0; i < 12; i++) { const p = bicanhRunPrice(S, i); assert.ok(Number.isInteger(p) && p > prev && p % 100 === 0, `giá ${i} = ${p}`); prev = p; }
  assert.equal(bicanhRunPrice(S, -3), bicanhRunPrice(S, 0)); assert.equal(bicanhRunPrice(S, 1.9), bicanhRunPrice(S, 1));
});
await test("Quan hệ cân bằng: quyển ≪ một giờ săn dự bị; Hồn Kinh Quyển không bán / mua được; giá lượt cùng cỡ nơi tiêu Hồn Tệ khác", () => {
  const def = itemDef(BICANH.tome); assert.ok(def && def.kind === "kinh_quyen" && def.stack > 1 && ITEMS.filter((i) => i.id === BICANH.tome).length === 1);
  assert.equal(sellPrice({ code: BICANH.tome, years: null, stars: null, enhance: 0 }), null, "quyển không bán cho thương nhân");
  // Một giờ săn tay (500 con / giờ như `HAND_KILLS_PER_HOUR` của sim:econ) cho võ hồn dự bị ở bậc hồn thú thấp nhất: kinh nghiệm một con × XP_SHARE_BENCH.
  const benchHour = 500 * beastStats(RING_LIMIT[0]).xp * XP_SHARE_BENCH, perDay = BICANH.tomeXp * BICANH.tomeDailyCap;
  assert.ok(perDay * 4 <= benchHour, `trần quyển một ngày (${perDay} kinh nghiệm) phải ≤ 1/4 một giờ săn dự bị (${benchHour})`);
  assert.ok(BICANH.tomeDailyCap >= S.runs, "trần quyển ngày không chặn nhận từ lượt miễn phí");
  assert.ok(bicanhRunPrice(S, 0) <= BAG_EXPAND_COST[0], "lượt mua đầu không đắt hơn bậc mở túi đầu"); assert.ok(bicanhRunPrice(S, 0) >= shardBuyPrice(0) / 2, "lượt mua đầu không rẻ hơn nửa giá một mảnh Thương hội");
  const buyAll = Array.from({ length: S.buyMax }, (_, i) => bicanhRunPrice(S, i)).reduce((a, x) => a + x, 0);
  assert.ok(buyAll <= SHARD_BUY.daily * shardBuyPrice(SHARD_BUY.daily - 1), "mua đủ trần lượt trong ngày không đắt hơn mua đủ mảnh Thương hội");
  assert.ok(BICANH.equivMin > 0 && (S.runs + S.buyMax) * BICANH.equivMin <= 12 * 60 / 4, "tổng lượt ngày ≤ 1/4 quỹ AUTO_DAILY_SECS (12 giờ)");
});
await test("runView: lượt còn lại = miễn phí + đã mua − đã vào; kẹp theo trần; hết lượt mua thì không còn giá", () => {
  assert.deepEqual(runView(S, 0, 0), { id: S.id, name: S.name, left: S.runs, max: S.runs, bought: 0, price: bicanhRunPrice(S, 0) });
  assert.equal(runView(S, S.runs, 0).left, 0); assert.equal(runView(S, S.runs, 1).left, 1); assert.equal(runView(S, 99, 0).left, 0, "không âm");
  const full = runView(S, 0, S.buyMax); assert.equal(full.price, null); assert.equal(full.max, S.runs + S.buyMax);
  assert.equal(runView(S, 0, 999).bought, S.buyMax, "số đã mua lạ bị kẹp về trần"); assert.equal(runView(S, 0, -5).bought, 0);
});
await test("MemoryStore.claimBoss (cùng luật PgStore): trần mua chặn nguyên tử, hai ngày Bí Cảnh và hai kind độc lập", async () => {
  const st = new MemoryStore(), acc = 7, bag = { items: [], honTe: 0 };
  const buy = (day: string) => st.claimBoss(acc, day, bicanhBuyKind(S.id), S.buyMax, bag, 1);
  for (let i = 1; i <= S.buyMax; i++) assert.equal(await buy("2026-10-28"), i);
  assert.equal(await buy("2026-10-28"), null, "lượt mua thứ buyMax + 1 bị từ chối");
  assert.equal(await st.bossClaims(acc, "2026-10-28", bicanhBuyKind(S.id)), S.buyMax);
  assert.equal(await st.bossClaims(acc, "2026-10-28", bicanhRunKind(S.id)), 0, "kind lượt vào độc lập với kind lượt mua");
  assert.equal(await buy("2026-10-29"), 1, "ngày Bí Cảnh mới đặt lại lượt mua");
  const rs = await Promise.all(Array.from({ length: 20 }, () => buy("2026-10-30")));
  assert.equal(rs.filter((x) => x !== null).length, S.buyMax, "dồn 20 lần mua cùng lúc chỉ thành buyMax lần");
});
