// Kiểm thử tìm/tạo tài khoản theo tên chuẩn hóa (server/src/names.ts) trong server/src/db.ts.
// Chạy: npm run test:accounts --prefix server
// Mặc định chỉ thử MemoryStore. Đặt TEST_DATABASE_URL (một DB RIÊNG để thử, vd Postgres của docker-compose)
// để thử cả PgStore: test tạo tài khoản rác và chèn thẳng tài khoản trùng tên, KHÔNG trỏ vào DB thật.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { MemoryStore, PgStore, type Store } from "../src/db.ts";
import { cleanName, nameKey } from "../src/names.ts";
import { DEFAULT_MAP } from "../../shared/data.ts";

async function test(title: string, fn: () => Promise<void>) { await fn(); console.log(`✓ ${title}`); }
const ok = (r: Awaited<ReturnType<Store["login"]>>) => { assert.ok(!("error" in r), JSON.stringify(r)); return r.accountId; };

await test("cleanName giữ hoa/thường, chỉ chuẩn hóa NFKC và cắt khoảng trắng", async () => {
  assert.equal(cleanName("  ＴＡＭ Ｔａｍ "), "TAM Tam");
  assert.equal(cleanName("Đường Tam".normalize("NFD")), "Đường Tam".normalize("NFC"));
  assert.equal(nameKey("ＴＡＭ"), nameKey("Tam"));
});

/** Các kịch bản chung cho mọi Store. `u` thêm hậu tố để chạy lại trên Postgres không đụng tài khoản cũ. */
async function common(label: string, s: Store, u = "") {
  await test(`${label}: "ＴＡＭ${u}" và "Tam${u}" là cùng một tài khoản, tên hiển thị giữ như lần tạo`, async () => {
    const id = ok(await s.login(cleanName(`Tam${u}`), "matkhau1"));
    assert.equal(ok(await s.login(cleanName(`ＴＡＭ${u}`), "matkhau1")), id);
    assert.equal(ok(await s.login(cleanName(`tam${u}`), "matkhau1")), id);
    assert.ok("error" in await s.login(cleanName(`ＴＡＭ${u}`), "saimatkhau")); // không tạo tài khoản mới
    const r = await s.login(cleanName(`Ｔａｍ${u}`), "matkhau1") as { token: string };
    assert.deepEqual(await s.accountFromToken(r.token), { accountId: id, name: `Tam${u}` });
  });
  await test(`${label}: dấu dựng sẵn và dấu tổ hợp là cùng một tài khoản`, async () => {
    const id = ok(await s.login(cleanName(`Đường Tam${u}`), "matkhau2"));
    assert.equal(ok(await s.login(cleanName(`ĐƯỜNG TAM${u}`.normalize("NFD")), "matkhau2")), id);
  });
  await test(`${label}: bản đồ đang đứng, lớp chặn WHERE map_id và transaction đi cổng (BĐ2)`, async () => {
    const id = ok(await s.login(cleanName(`Cổng${u}`), "matkhau5"));
    const ch = (await s.awaken(id, `Cổng${u}`, ["lam_ngan_thao", "bich_lan_xa_hoang"], "bich_lan_xa_hoang", 3))!;
    const other = ok(await s.login(cleanName(`Khác${u}`), "matkhau5"));
    const och = (await s.awaken(other, `Khác${u}`, ["lam_ngan_thao", "ta_hoa_phuong_hoang"], "ta_hoa_phuong_hoang", 3))!;
    const level = async () => (await s.listVohons(id)).find((v) => v.rowId === ch.rowId)!.level;
    // Chưa lưu: bản đồ khởi đầu, vào ở spawn.
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: null, y: null });
    assert.equal(await s.saveLocation(id, "tinh_dau", 1, 2), false);         // phòng khác bản đồ không ghi được
    assert.equal(await s.saveLocation(id, DEFAULT_MAP, 10, 20), true);
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: 10, y: 20 });
    // Transaction lỗi thì không ghi gì: sai bản đồ đi, hoặc võ hồn không thuộc tài khoản.
    const bench = (await s.listVohons(id)).find((v) => v.rowId !== ch.rowId)!;
    await assert.rejects(s.saveTravel(id, [{ ...ch, level: 9 }], "tinh_dau", "nac_dinh_thanh", 88, 328));
    await assert.rejects(s.saveTravel(id, [{ ...ch, level: 9 }, { ...och, accountId: id, level: 9 }], DEFAULT_MAP, "nac_dinh_thanh", 88, 328));
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: 10, y: 20 });
    assert.equal(await level(), 3);
    assert.equal((await s.listVohons(other))[1].level, 3);
    // Thành công: võ hồn và bản đồ đổi cùng lúc; phòng cũ không còn ghi đè vị trí.
    await s.saveTravel(id, [{ ...ch, level: 7 }, { ...bench, xp: 5 }], DEFAULT_MAP, "nac_dinh_thanh", 88, 328);
    assert.deepEqual(await s.getLocation(id), { mapId: "nac_dinh_thanh", x: 88, y: 328 });
    assert.equal(await level(), 7);
    assert.equal((await s.listVohons(id)).find((v) => v.rowId === bench.rowId)!.xp, 5);
    assert.equal(await s.saveLocation(id, DEFAULT_MAP, 1, 1), false);
    assert.deepEqual(await s.getLocation(id), { mapId: "nac_dinh_thanh", x: 88, y: 328 });
  });
}

await common("MemoryStore", new MemoryStore());

const url = process.env.TEST_DATABASE_URL;
if (!url) console.log("(Bỏ qua PgStore: chưa đặt TEST_DATABASE_URL.)");
else {
  const s = new PgStore(url);
  await s.init();
  const u = " " + randomBytes(3).toString("hex");
  await common("PgStore", s, u);

  await test("PgStore: DB cũ có hai tài khoản trùng tên sau chuẩn hóa -> giữ tài khoản cũ nhất, không xóa tài khoản nào", async () => {
    // Giả lập dữ liệu tạo trước 004: chèn thẳng, name_key NULL. "ＶＩＮＨ…" tạo trước nên phải giữ tên.
    const ins = (n: string, t: string) => s.pool.query(
      "INSERT INTO accounts(name, pass_hash, created_at) VALUES ($1,'x:00',$2) RETURNING id", [n, t]).then((r) => Number(r.rows[0].id));
    const old = await ins(`ＶＩＮＨ${u}`, "2020-01-01");
    // Tài khoản tạo sau, có mật khẩu thật: tạo qua login rồi đưa về trạng thái trước 004.
    const dup = ok(await s.login(`Vinh${u}`, "matkhau4"));
    await s.pool.query("UPDATE accounts SET name_key=NULL, created_at='2021-01-01' WHERE id=$1", [dup]);
    await s.backfillNameKeys();
    const rows = (await s.pool.query("SELECT id, name_key FROM accounts WHERE id = ANY($1) ORDER BY id", [[old, dup]])).rows;
    assert.deepEqual(rows.map((r) => [Number(r.id), r.name_key]), [[old, nameKey(`Vinh${u}`)], [dup, null]]);
    await s.backfillNameKeys(); // chạy lại (lần khởi động sau) vẫn vậy
    // Chủ tài khoản bị loại vẫn vào được tài khoản CỦA MÌNH bằng mật khẩu riêng, cách viết nào cũng được; sai mật khẩu thì không.
    assert.equal(ok(await s.login(cleanName(`Vinh${u}`), "matkhau4")), dup);
    assert.equal(ok(await s.login(cleanName(`ＶＩＮＨ${u}`), "matkhau4")), dup);
    assert.ok("error" in await s.login(cleanName(`vinh${u}`), "saimatkhau"));
    assert.equal((await s.pool.query("SELECT count(*)::int n FROM accounts WHERE id = ANY($1)", [[old, dup]])).rows[0].n, 2);
    // Đổi tên tài khoản bị loại -> lần điền sau nó có khóa riêng và đăng nhập được bằng tên mới.
    await s.pool.query("UPDATE accounts SET name=$2 WHERE id=$1", [dup, `Vinh2${u}`]);
    await s.backfillNameKeys();
    assert.equal((await s.pool.query("SELECT name_key FROM accounts WHERE id=$1", [dup])).rows[0].name_key, nameKey(`Vinh2${u}`));
  });

  await test("PgStore: map_id không còn trong MAPS -> về bản đồ khởi đầu, vị trí bỏ, lưu được ở bản đồ đó", async () => {
    const id = ok(await s.login(cleanName(`Lạc${u}`), "matkhau6"));
    await s.pool.query("UPDATE accounts SET map_id='ban_do_da_bo', pos_x=5, pos_y=6 WHERE id=$1", [id]);
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: null, y: null });
    assert.equal(await s.saveLocation(id, DEFAULT_MAP, 30, 40), true);
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: 30, y: 40 });
  });

  await test("PgStore: nhiều yêu cầu tạo cùng một tên cùng lúc -> chỉ một tài khoản", async () => {
    const n = `Song${u}`, variants = [n, n.toUpperCase(), `Ｓｏｎｇ${u}`, n.toLowerCase()];
    const ids = (await Promise.all(variants.map((v) => s.login(cleanName(v), "matkhau3")))).map(ok);
    assert.equal(new Set(ids).size, 1);
  });
  await s.pool.end();
}

console.log("Tất cả kiểm thử tài khoản đều đạt.");
