// Kiểm thử phần thuần của lệnh GM (#518): danh sách admin, giới hạn tốc độ, đọc và kiểm lệnh. Phần chạy trong phòng do bot (BOT_ONLY=gm) thử.
// Chạy: npm run test:gm --prefix server
import assert from "node:assert/strict";
import { parseAdmins, parseGm, gmAllow, _gmReset, GM_BURST, GM_WINDOW_MS, gmEnabled, isAdmin, type GmCmd } from "../src/gm.ts";
import { MAX_LEVEL, MAX_YEARS, BEASTS, itemDef } from "../../shared/data.ts";

function test(title: string, fn: () => void) { fn(); console.log(`✓ ${title}`); }
const ok = (s: string): GmCmd => { const r = parseGm(s); assert.ok(!("error" in r), `${s}: ${"error" in r ? r.error : ""}`); return r as GmCmd; };
const bad = (s: unknown) => { const r = parseGm(s); assert.ok("error" in r, `${JSON.stringify(s)} lẽ ra bị từ chối`); };

test("ADMIN_ACCOUNTS: trống / sai dạng = không ai là admin; chỉ nhận số nguyên dương", () => {
  for (const x of [undefined, "", " ", ",", "abc", "-3", "0", "1.5", "1e3"]) assert.equal(parseAdmins(x).size, 0, String(x));
  assert.deepEqual([...parseAdmins(" 12, 57 ,x,12,0")].sort(), [12, 57]);
  assert.equal(gmEnabled(), false, "môi trường thử không đặt ADMIN_ACCOUNTS: tắt hẳn");
  assert.equal(isAdmin(1), false);
});
test("giới hạn tốc độ theo tài khoản, cửa sổ trượt", () => {
  _gmReset();
  for (let i = 0; i < GM_BURST; i++) assert.equal(gmAllow(7, 1000 + i), true);
  assert.equal(gmAllow(7, 1000 + GM_BURST), false, "quá nhịp bị chặn");
  assert.equal(gmAllow(8, 1000), true, "tài khoản khác không bị ảnh hưởng");
  assert.equal(gmAllow(7, 1000 + GM_WINDOW_MS + 1), true, "hết cửa sổ thì được lại");
});
test("lệnh hợp lệ được đọc đúng, mặc định hợp lý", () => {
  assert.deepEqual(ok("level 100"), { op: "level", level: MAX_LEVEL });
  assert.deepEqual(ok("give hoi_huyet_dan 50"), { op: "give", code: "hoi_huyet_dan", qty: 50 });
  assert.deepEqual(ok("give hoi_huyet_dan"), { op: "give", code: "hoi_huyet_dan", qty: 1 });
  assert.deepEqual(ok("ring 5000"), { op: "ring", years: 5000, qty: 1 });
  assert.deepEqual(ok(`bone ${BEASTS[0].id} dau`), { op: "bone", beast: BEASTS[0].id, slot: "dau", years: MAX_YEARS, enhance: 0 });
  assert.deepEqual(ok("core hao_thien 6 15"), { op: "core", set: "hao_thien", stars: 6, enhance: 15 });
  assert.equal(ok("gear vu_khi_chi_bao").op, "gear");
  assert.deepEqual(ok("vohon hao_thien_chuy 30 2"), { op: "vohon", vohon: "hao_thien_chuy", level: 30, rings: 2 });
  assert.deepEqual(ok("coin 0"), { op: "coin", n: 0 });
  assert.deepEqual(ok("tp thien_dau_thanh"), { op: "tp", mapId: "thien_dau_thanh" });
  assert.deepEqual(ok("preset max"), { op: "preset", preset: "max" });
  assert.deepEqual(ok("  level   7  "), { op: "level", level: 7 });
});
test("lệnh sai / ngoài giới hạn bị từ chối (không ném lỗi)", () => {
  for (const s of ["", "xyz", "level", "level 0", "level 101", "level 1.5", "level 1e2", "level -1", "give", "give khong_co", "give hon_hoan 1", "give hon_cot 1", "give trang_bi 1",
    "give hoi_huyet_dan 0", "give hoi_huyet_dan 99999999999", "ring 5", "ring 100001", "ring 5000 99", "bone", "bone khong_co dau", `bone ${BEASTS[0].id} tay`, `bone ${BEASTS[0].id} dau 5`,
    `bone ${BEASTS[0].id} dau 100000 21`, "core", "core khong_co 3", "core hao_thien 0", "core hao_thien 7", "core hao_thien 3 16", "gear", "gear khong_co", "gear vu_khi_chi_bao 0",
    "gear vu_khi_chi_bao 8", "gear vu_khi_chi_bao 7 16", "vohon", "vohon khong_co", "vohon hao_thien_chuy 0", "vohon hao_thien_chuy 1 11", "coin", "coin -1", "coin 99999999999999",
    "tp", "tp khong_co", "tp dai_dau_hon_truong", "preset", "preset khac", "__proto__ 1", "constructor"]) bad(s);
  for (const x of [null, undefined, 5, {}, [], "x".repeat(201)]) bad(x);
  assert.ok(itemDef("hoi_huyet_dan"));
});
