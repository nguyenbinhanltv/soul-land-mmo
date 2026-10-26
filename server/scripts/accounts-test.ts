// Kiểm thử tìm/tạo tài khoản theo tên chuẩn hóa (server/src/names.ts) trong server/src/db.ts.
// Chạy: npm run test:accounts --prefix server
// Mặc định chỉ thử MemoryStore. Đặt TEST_DATABASE_URL (một DB RIÊNG để thử, vd Postgres của docker-compose)
// để thử cả PgStore: test tạo tài khoản rác và chèn thẳng tài khoản trùng tên, KHÔNG trỏ vào DB thật.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { MemoryStore, PgStore, type Store, type Item, type Bag } from "../src/db.ts";
import { cleanName, nameKey } from "../src/names.ts";
import { mapFile } from "../src/map.ts";
import { DEFAULT_MAP, MAP_MOVED, BAG_SLOTS, MAPS } from "../../shared/data.ts";

// Mật khẩu thử sinh ngẫu nhiên mỗi lần chạy, không ghi cứng trong mã: PW[i] thay cho mật khẩu thứ i, WRONG là mật khẩu sai.
const PW = Array.from({ length: 7 }, () => randomUUID()), WRONG = randomUUID();

async function test(title: string, fn: () => Promise<void>) { await fn(); console.log(`✓ ${title}`); }
const ok = (r: Awaited<ReturnType<Store["login"]>>) => { assert.ok(!("error" in r), JSON.stringify(r)); return r.accountId; };

await test("cleanName giữ hoa/thường, chỉ chuẩn hóa NFKC và cắt khoảng trắng", async () => {
  assert.equal(cleanName("  ＴＡＭ Ｔａｍ "), "TAM Tam");
  assert.equal(cleanName("Đường Tam".normalize("NFD")), "Đường Tam".normalize("NFC"));
  assert.equal(nameKey("ＴＡＭ"), nameKey("Tam"));
});

/** Các kịch bản chung cho mọi Store. `u` thêm hậu tố để chạy lại trên Postgres không đụng tài khoản cũ. */
// Dọn phiên (#736): `age` lùi ngày mở của một phiên (MemoryStore sửa Map, PgStore sửa cột created_at).
async function sessionsTest(label: string, s: Store, u: string, age: (token: string, days: number) => Promise<void>) {
  await test(`${label}: phiên > 30 ngày hết hạn, mở phiên mới xóa phiên cũ của tài khoản, giữ tối đa 10 phiên mới nhất, quét định kỳ (#736)`, async () => {
    const id = ok(await s.login(cleanName(`Phiên${u}`), PW[4])), other = ok(await s.login(cleanName(`PhiênB${u}`), PW[4]));
    const otherTok = await s.startSession(other);
    const old = await s.startSession(id);
    await age(old, 31);
    assert.equal(await s.accountFromToken(old), null);               // quá hạn thì không dùng được dù chưa bị xóa
    const keep = await s.startSession(id);                            // mở phiên mới: phiên quá hạn của chính tài khoản bị xóa
    assert.ok(await s.accountFromToken(keep));
    const quét = await s.startSession(id); await age(quét, 40);       // phiên quá hạn của tài khoản khác chưa bị đụng tới...
    assert.ok((await s.pruneSessions()) >= 1);                        // ...quét định kỳ xóa
    assert.equal(await s.accountFromToken(quét), null);
    assert.ok(await s.accountFromToken(keep) && await s.accountFromToken(otherTok));
    const tokens: string[] = [];
    for (let i = 0; i < 14; i++) tokens.push(await s.startSession(id));
    const alive = (await Promise.all(tokens.map((t) => s.accountFromToken(t)))).filter(Boolean).length;
    assert.equal(alive, 10);                                           // 4 phiên cũ nhất bị đá, 10 mới nhất còn
    assert.ok(await s.accountFromToken(tokens[13]) && !(await s.accountFromToken(tokens[0])));
    assert.ok(await s.accountFromToken(otherTok));                    // tài khoản khác không bị ảnh hưởng
  });
}

async function logoutTest(label: string, s: Store, u: string) {
  await test(`${label}: đăng xuất thu hồi đúng phiên đó, phiên khác của tài khoản giữ nguyên, gọi lại / token sai không lỗi (#999)`, async () => {
    const id = ok(await s.login(cleanName(`Thoát${u}`), PW[4]));
    const a = await s.startSession(id), b = await s.startSession(id);
    assert.ok(await s.accountFromToken(a));
    assert.equal(await s.endSession(a), true);
    assert.equal(await s.accountFromToken(a), null);                  // token cũ không vào được
    assert.ok(await s.accountFromToken(b));                           // thiết bị khác vẫn dùng được
    assert.equal(await s.endSession(a), false);                       // gọi lại: không lỗi
    for (const t of [undefined, null, 5, "", "x'; DROP TABLE sessions;--", "\0".repeat(32)]) assert.equal(await s.endSession(t), false);
    assert.ok(await s.accountFromToken(b));
  });
}

async function common(label: string, s: Store, u = "") {
  await test(`${label}: "ＴＡＭ${u}" và "Tam${u}" là cùng một tài khoản, tên hiển thị giữ như lần tạo`, async () => {
    const id = ok(await s.login(cleanName(`Tam${u}`), PW[1]));
    assert.equal(ok(await s.login(cleanName(`ＴＡＭ${u}`), PW[1])), id);
    assert.equal(ok(await s.login(cleanName(`tam${u}`), PW[1])), id);
    assert.ok("error" in await s.login(cleanName(`ＴＡＭ${u}`), WRONG)); // không tạo tài khoản mới
    const r = await s.login(cleanName(`Ｔａｍ${u}`), PW[1]) as { token: string };
    assert.deepEqual(await s.accountFromToken(r.token), { accountId: id, name: `Tam${u}` });
  });
  await test(`${label}: dấu dựng sẵn và dấu tổ hợp là cùng một tài khoản`, async () => {
    const id = ok(await s.login(cleanName(`Đường Tam${u}`), PW[2]));
    assert.equal(ok(await s.login(cleanName(`ĐƯỜNG TAM${u}`.normalize("NFD")), PW[2])), id);
  });
  await test(`${label}: cờ created chỉ đúng ở lần tạo; create=false không tạo tài khoản mới nhưng tài khoản cũ vẫn vào được (#207)`, async () => {
    const created = (r: Awaited<ReturnType<Store["login"]>>) => { assert.ok(!("error" in r), JSON.stringify(r)); return r.created; };
    assert.equal(created(await s.login(cleanName(`Mới${u}`), PW[0])), true);
    assert.equal(created(await s.login(cleanName(`MỚI${u}`), PW[0])), false);
    assert.equal(created(await s.login(cleanName(`mới${u}`), PW[0], false)), false); // IP hết lượt tạo vẫn vào tài khoản cũ
    assert.ok(!("noCreate" in await s.login(cleanName(`Mới${u}`), WRONG, false))); // sai mật khẩu là lỗi thường, không phải noCreate
    const r = await s.login(cleanName(`Chưa Có${u}`), PW[0], false);
    assert.deepEqual("noCreate" in r && r.noCreate, true);
    // Không tạo gì: lần sau (được tạo) mới là lần tạo, với mật khẩu khác cũng được.
    assert.equal(created(await s.login(cleanName(`Chưa Có${u}`), PW[1])), true);
  });
  await test(`${label}: token sai định dạng (NUL, object, số, quá dài) -> null, không ném lỗi`, async () => {
    for (const t of ["\u0000", `${"a".repeat(31)}\u0000`, "", "a".repeat(33), "a".repeat(10_000), { $ne: 1 }, ["x"], 42, null, undefined])
      assert.equal(await s.accountFromToken(t), null, JSON.stringify(t));
  });
  await test(`${label}: hai lần tạo cùng tên cùng lúc, khác mật khẩu -> một tài khoản, lần kia sai mật khẩu`, async () => {
    // Bên nào băm / chèn xong trước thì tạo tài khoản (scrypt chạy song song trên threadpool): không giả định thứ tự.
    const pws = [PW[6], WRONG], r = await Promise.all([s.login(cleanName(`Đua${u}`), pws[0]), s.login(cleanName(`ĐUA${u}`), pws[1])]);
    const won = r.findIndex((x) => !("error" in x));
    assert.ok(won >= 0 && r.filter((x) => "error" in x).length === 1, JSON.stringify(r));
    const w = r[won]; assert.ok(!("error" in w) && w.created);
    assert.equal(ok(await s.login(cleanName(`đua${u}`), pws[won])), (r[won] as { accountId: number }).accountId);
    assert.ok("error" in await s.login(cleanName(`đua${u}`), pws[1 - won]));
  });
  await test(`${label}: bản đồ đang đứng, lớp chặn WHERE map_id và transaction đi cổng (BĐ2)`, async () => {
    const id = ok(await s.login(cleanName(`Cổng${u}`), PW[5]));
    const ch = (await s.awaken(id, `Cổng${u}`, ["lam_ngan_thao", "bich_lan_xa_hoang"], "bich_lan_xa_hoang", 3))!;
    const other = ok(await s.login(cleanName(`Khác${u}`), PW[5]));
    const och = (await s.awaken(other, `Khác${u}`, ["lam_ngan_thao", "ta_hoa_phuong_hoang"], "ta_hoa_phuong_hoang", 3))!;
    const level = async () => (await s.listVohons(id)).find((v) => v.rowId === ch.rowId)!.level;
    // Chưa lưu: bản đồ khởi đầu, vào ở spawn.
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: null, y: null });
    assert.equal(await s.saveLocation(id, "tinh_dau_ngoai_vi", 1, 2), false);         // phòng khác bản đồ không ghi được
    assert.equal(await s.saveLocation(id, DEFAULT_MAP, 10, 20), true);
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: 10, y: 20 });
    // Transaction lỗi thì không ghi gì: sai bản đồ đi, hoặc võ hồn không thuộc tài khoản.
    const bench = (await s.listVohons(id)).find((v) => v.rowId !== ch.rowId)!;
    await assert.rejects(s.saveTravel(id, [{ ...ch, level: 9 }], "tinh_dau_ngoai_vi", "nac_dinh_thanh", 88, 328));
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
  await test(`${label}: map_id cũ \`tinh_dau\` (đã tách ở BĐ3) -> Ngoại vi, vị trí bỏ, lớp chặn theo bản đồ đã ánh xạ`, async () => {
    const id = ok(await s.login(cleanName(`Tinh Đấu cũ${u}`), PW[5]));
    const ch = (await s.awaken(id, `Tinh Đấu cũ${u}`, ["lam_ngan_thao", "bich_lan_xa_hoang"], "bich_lan_xa_hoang", 3))!;
    assert.equal(MAP_MOVED.tinh_dau, "tinh_dau_ngoai_vi");
    // Ghi mã cũ như tài khoản của bản trước BĐ3 (saveTravel không kiểm tra bản đồ đích).
    await s.saveTravel(id, [ch], DEFAULT_MAP, "tinh_dau", 700, 480);
    assert.deepEqual(await s.getLocation(id), { mapId: "tinh_dau_ngoai_vi", x: null, y: null });
    assert.equal(await s.saveLocation(id, DEFAULT_MAP, 1, 1), false);           // phòng khác bản đồ đã ánh xạ không ghi được
    assert.equal(await s.saveLocation(id, "tinh_dau_ngoai_vi", 30, 40), true);  // phòng Ngoại vi ghi được, thay mã cũ
    assert.deepEqual(await s.getLocation(id), { mapId: "tinh_dau_ngoai_vi", x: 30, y: 40 });
    // 11.5: vị trí lưu trên file Tiled khác file đang dùng (bản cũ trước khi bản ×8 thành mặc định, đường lùi MAP_V1) thì vào ở `spawn`.
    assert.equal(await s.saveLocation(id, "tinh_dau_ngoai_vi", 30, 40, "tinh_dau_ngoai_vi.cu"), true);
    assert.deepEqual(await s.getLocation(id), { mapId: "tinh_dau_ngoai_vi", x: null, y: null });
    assert.equal(await s.saveLocation(id, "tinh_dau_ngoai_vi", 30, 40), true);
    assert.deepEqual(await s.getLocation(id), { mapId: "tinh_dau_ngoai_vi", x: 30, y: 40 });
    // Đi cổng từ bản đồ đã ánh xạ cũng qua được lớp chặn.
    await s.saveTravel(id, [ch], "tinh_dau_ngoai_vi", "tinh_dau", 700, 480);
    await s.saveTravel(id, [ch], "tinh_dau_ngoai_vi", "nac_dinh_thanh", 88, 328);
    assert.deepEqual(await s.getLocation(id), { mapId: "nac_dinh_thanh", x: 88, y: 328 });
  });
  await test(`${label}: vị trí ghi trên file Tiled khác file đang dùng (bản cũ / bản ×8, 11.5) thì bỏ, vào ở spawn`, async () => {
    const id = ok(await s.login(cleanName(`Bản đồ cũ${u}`), PW[5]));
    const ch = (await s.awaken(id, `Bản đồ cũ${u}`, ["lam_ngan_thao", "bich_lan_xa_hoang"], "bich_lan_xa_hoang", 3))!;
    const nv = "tinh_dau_ngoai_vi", cur = mapFile(nv), other = cur === nv ? `${nv}.v2` : nv;
    await s.saveTravel(id, [ch], DEFAULT_MAP, nv, 50, 60);                      // đi cổng: ghi kèm file đang dùng
    assert.deepEqual(await s.getLocation(id), { mapId: nv, x: 50, y: 60 });
    assert.equal(await s.saveLocation(id, nv, 30, 40, other), true);            // tọa độ của phiên bản khác
    assert.deepEqual(await s.getLocation(id), { mapId: nv, x: null, y: null });
    assert.equal(await s.saveLocation(id, nv, 30, 40, null), true);             // dòng trước 11.5 (NULL) = bản cũ `<mapId>`
    assert.deepEqual(await s.getLocation(id), cur === nv ? { mapId: nv, x: 30, y: 40 } : { mapId: nv, x: null, y: null });
    assert.equal(await s.saveLocation(id, nv, 30, 40), true);                   // ghi lại theo file đang dùng
    assert.deepEqual(await s.getLocation(id), { mapId: nv, x: 30, y: 40 });
    // Lõi Tinh Đấu cũng có bản dựng lại (11.5 phần 3, giữ cỡ): dòng NULL là bản cũ nên vị trí bỏ như mọi bản đồ khác.
    const lo = "loi_tinh_dau", loCur = mapFile(lo);
    await s.saveTravel(id, [ch], nv, lo, 10, 10);
    assert.equal(await s.saveLocation(id, lo, 12, 14, null), true);
    assert.deepEqual(await s.getLocation(id), loCur === lo ? { mapId: lo, x: 12, y: 14 } : { mapId: lo, x: null, y: null });
    // Bản đồ đang dùng file cũ (chưa có bản dựng lại, hoặc MAP_V1 bật đường lùi): NULL vẫn giữ vị trí.
    const v1 = Object.keys(MAPS).find((m) => mapFile(m) === m);
    if (v1) {
      await s.saveTravel(id, [ch], lo, v1, 10, 10);
      assert.equal(await s.saveLocation(id, v1, 12, 14, null), true);
      assert.deepEqual(await s.getLocation(id), { mapId: v1, x: 12, y: 14 });
    }
  });
  await test(`${label}: túi đồ, Hồn Tệ, vật phẩm khởi đầu một lần và túi đồ trong transaction đi cổng (3.1)`, async () => {
    const id = ok(await s.login(cleanName(`Túi${u}`), PW[5]));
    const ch = (await s.awaken(id, `Túi${u}`, ["lam_ngan_thao", "bich_lan_xa_hoang"], "bich_lan_xa_hoang", 3))!;
    const other = ok(await s.login(cleanName(`Túi khác${u}`), PW[5]));
    const och = (await s.awaken(other, `Túi khác${u}`, ["lam_ngan_thao", "ta_hoa_phuong_hoang"], "ta_hoa_phuong_hoang", 3))!;
    let t = Date.now();
    const item = (code: string, qty: number, extra: Partial<Item> = {}): Item =>
      ({ id: randomUUID(), kind: "dan", code, qty, years: null, stars: null, enhance: 0, stats: null, vohonId: null, created: t++, ...extra });
    const starter = [item("hoi_huyet_dan", 5), item("hoi_hon_dan", 5)];
    // loadBag trả kèm số ô túi (9.8) và tiến độ nhiệm vụ (6.2): tài khoản thử chưa mở rộng túi, chưa nhận nhiệm vụ; so phần còn lại.
    // Từ #216 kèm bộ lọc tự bán và đồ tự bán (`sell`, `sold`): PgStore luôn trả hai khóa này (`sold` rỗng), MemoryStore thì không; tài khoản thử
    // chưa tự bán gì.
    const items = (b: Bag) => {
      const { slots, quests, sell, sold, ...rest } = b;
      assert.equal(slots, BAG_SLOTS); assert.deepEqual(quests, []); assert.equal(sell, undefined); assert.ok(!sold?.length);
      return rest;
    };
    const loadItems = async (acc: number) => items((await s.loadBag(acc, [])).bag);
    // Lần nạp đầu: nhận vật phẩm khởi đầu đúng thứ tự; lần sau không nhận nữa (kể cả khi gửi danh sách khác).
    const first = await s.loadBag(id, starter);
    assert.equal(first.starter, true);
    assert.deepEqual(items(first.bag), { honTe: 0, items: starter });
    const again = await s.loadBag(id, [item("hoi_huyet_dan", 99)]);
    assert.equal(again.starter, false);
    assert.deepEqual(items(again.bag), items(first.bag));
    // Lưu cả túi: sửa ô (số lượng), xóa ô hết, thêm ô mới có số năm/sao/dòng chỉ số/gắn vào võ hồn; Hồn Tệ là số nguyên.
    const ring = item("hon_hoan", 1, { kind: "hon_hoan", years: 437, stars: 2, enhance: 3, stats: { main: ["atk", 12], sub: [["hp", 5]] }, vohonId: ch.rowId });
    const bag = { honTe: 1_234_567, items: [{ ...starter[0], qty: 3 }, ring] };
    await s.saveBag(id, bag);
    assert.deepEqual(await loadItems(id), bag);
    // Ghi lỗi thì không ghi gì: id trùng, số lượng sai, Hồn Tệ âm, đồ gắn vào võ hồn người khác, id thuộc tài khoản khác.
    await assert.rejects(s.saveBag(id, { honTe: 1, items: [bag.items[0], bag.items[0]] }));
    await assert.rejects(s.saveBag(id, { honTe: 1, items: [{ ...bag.items[0], qty: 0 }] }));
    await assert.rejects(s.saveBag(id, { honTe: -1, items: [] }));
    await assert.rejects(s.saveBag(id, { honTe: 1, items: [{ ...ring, vohonId: och.rowId }] }));
    await s.loadBag(other, []);
    await assert.rejects(s.saveBag(other, { honTe: 9, items: [{ ...bag.items[0], qty: 50 }] }));
    assert.deepEqual(await loadItems(id), bag);
    assert.deepEqual(await loadItems(other), { honTe: 0, items: [] });
    // Đi cổng: túi đồ ghi trong cùng transaction; transaction lỗi (sai bản đồ đi) thì túi giữ nguyên.
    const travelBag = { honTe: 42, items: [item("hoi_hon_dan", 7)] };
    await assert.rejects(s.saveTravel(id, [ch], "tinh_dau_ngoai_vi", "nac_dinh_thanh", 88, 328, travelBag));
    assert.deepEqual(await loadItems(id), bag);
    await s.saveTravel(id, [ch], DEFAULT_MAP, "nac_dinh_thanh", 88, 328, travelBag);
    assert.deepEqual(await loadItems(id), travelBag);
    assert.equal((await s.getLocation(id)).mapId, "nac_dinh_thanh");
    // Không có túi trong transaction (không đổi gì) thì túi giữ nguyên.
    await s.saveTravel(id, [ch], "nac_dinh_thanh", DEFAULT_MAP, 10, 10);
    assert.deepEqual(await loadItems(id), travelBag);
    // Lưu định kỳ / rời phòng (saveProgress, #165): vị trí, võ hồn và túi trong một transaction. Phòng của bản đồ khác (DB đã sang bản
    // đồ khác, vd transaction đi cổng đã commit dù phòng nhận lỗi rồi hoàn phí) thì không ghi gì, kể cả túi và võ hồn.
    const lv = async () => (await s.listVohons(id)).find((v) => v.rowId === ch.rowId)!.level;
    const level0 = await lv(), refund = { honTe: 9_999, items: [item("hoi_thanh_phu", 1, { kind: "phu" })] };
    assert.equal(await s.saveProgress(id, [{ ...ch, level: level0 + 5 }], "nac_dinh_thanh", 1, 2, undefined, refund), false);
    assert.deepEqual(await loadItems(id), travelBag);
    assert.equal(await lv(), level0);
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: 10, y: 10 });
    // Lỗi giữa chừng (võ hồn của tài khoản khác) thì không ghi gì.
    await assert.rejects(s.saveProgress(id, [{ ...ch, level: level0 + 5 }, { ...och, accountId: id }], DEFAULT_MAP, 3, 4, undefined, refund));
    assert.deepEqual(await loadItems(id), travelBag);
    assert.equal(await lv(), level0);
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: 10, y: 10 });
    // Đúng bản đồ: ghi hết; không có túi thì túi giữ nguyên.
    assert.equal(await s.saveProgress(id, [{ ...ch, level: level0 + 1 }], DEFAULT_MAP, 30, 40, undefined, refund), true);
    assert.deepEqual(await loadItems(id), refund);
    assert.equal(await lv(), level0 + 1);
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: 30, y: 40 });
    assert.equal(await s.saveProgress(id, [ch], DEFAULT_MAP, 31, 41), true);
    assert.deepEqual(await loadItems(id), refund);
    // Transaction đi cổng đã commit dù phòng nhận lỗi (MapRoom.beginTravel, #165): phòng đọc lại getLocation thấy bản đồ đích thì coi như đã
    // đi; phòng cũ không ghi đè được gì (kể cả phí đã hoàn trong RAM), phòng mới lưu bình thường.
    const moved = { honTe: 1_000, items: [item("hoi_hon_dan", 2)] };
    await s.saveTravel(id, [{ ...ch, level: level0 + 2 }], DEFAULT_MAP, "nac_dinh_thanh", 88, 328, moved);
    assert.equal((await s.getLocation(id)).mapId, "nac_dinh_thanh");
    assert.equal(await s.saveProgress(id, [{ ...ch, level: level0 + 1 }], DEFAULT_MAP, 31, 41, undefined, { ...moved, honTe: 1_030 }), false);
    assert.deepEqual(await loadItems(id), moved);
    assert.equal(await lv(), level0 + 2);
    assert.equal(await s.saveProgress(id, [{ ...ch, level: level0 + 3 }], "nac_dinh_thanh", 90, 330, undefined, { ...moved, honTe: 1_200 }), true);
    assert.deepEqual(await loadItems(id), { ...moved, honTe: 1_200 });
    assert.equal(await lv(), level0 + 3);
  });
}

{
  const m = new MemoryStore();
  await common("MemoryStore", m);
  await logoutTest("MemoryStore", m, "");
  await sessionsTest("MemoryStore", m, "", async (t, d) => { m.sessions.get(t)!.at -= d * 864e5; });
}

const url = process.env.TEST_DATABASE_URL;
if (!url) console.log("(Bỏ qua PgStore: chưa đặt TEST_DATABASE_URL.)");
else {
  const s = new PgStore(url);
  await s.init();
  const u = " " + randomBytes(3).toString("hex");
  await common("PgStore", s, u);
  await logoutTest("PgStore", s, u);
  await sessionsTest("PgStore", s, u, async (t, d) => { await s.pool.query("UPDATE sessions SET created_at = created_at - make_interval(days => $2) WHERE token=$1", [t, d]); });

  await test("PgStore: DB cũ có hai tài khoản trùng tên sau chuẩn hóa -> giữ tài khoản cũ nhất, không xóa tài khoản nào", async () => {
    // Giả lập dữ liệu tạo trước 004: chèn thẳng, name_key NULL. "ＶＩＮＨ…" tạo trước nên phải giữ tên.
    const ins = (n: string, t: string) => s.pool.query(
      "INSERT INTO accounts(name, pass_hash, created_at) VALUES ($1,'x:00',$2) RETURNING id", [n, t]).then((r) => Number(r.rows[0].id));
    const old = await ins(`ＶＩＮＨ${u}`, "2020-01-01");
    // Tài khoản tạo sau, có mật khẩu thật: tạo qua login rồi đưa về trạng thái trước 004.
    const dup = ok(await s.login(`Vinh${u}`, PW[4]));
    await s.pool.query("UPDATE accounts SET name_key=NULL, created_at='2021-01-01' WHERE id=$1", [dup]);
    await s.backfillNameKeys();
    const rows = (await s.pool.query("SELECT id, name_key FROM accounts WHERE id = ANY($1) ORDER BY id", [[old, dup]])).rows;
    assert.deepEqual(rows.map((r) => [Number(r.id), r.name_key]), [[old, nameKey(`Vinh${u}`)], [dup, null]]);
    await s.backfillNameKeys(); // chạy lại (lần khởi động sau) vẫn vậy
    // Chủ tài khoản bị loại vẫn vào được tài khoản CỦA MÌNH bằng mật khẩu riêng, cách viết nào cũng được; sai mật khẩu thì không.
    assert.equal(ok(await s.login(cleanName(`Vinh${u}`), PW[4])), dup);
    assert.equal(ok(await s.login(cleanName(`ＶＩＮＨ${u}`), PW[4])), dup);
    assert.ok("error" in await s.login(cleanName(`vinh${u}`), WRONG));
    assert.equal((await s.pool.query("SELECT count(*)::int n FROM accounts WHERE id = ANY($1)", [[old, dup]])).rows[0].n, 2);
    // Đổi tên tài khoản bị loại -> lần điền sau nó có khóa riêng và đăng nhập được bằng tên mới.
    await s.pool.query("UPDATE accounts SET name=$2 WHERE id=$1", [dup, `Vinh2${u}`]);
    await s.backfillNameKeys();
    assert.equal((await s.pool.query("SELECT name_key FROM accounts WHERE id=$1", [dup])).rows[0].name_key, nameKey(`Vinh2${u}`));
  });

  await test("PgStore: map_id không còn trong MAPS -> về bản đồ khởi đầu, vị trí bỏ, lưu được ở bản đồ đó", async () => {
    const id = ok(await s.login(cleanName(`Lạc${u}`), PW[6]));
    await s.pool.query("UPDATE accounts SET map_id='ban_do_da_bo', pos_x=5, pos_y=6 WHERE id=$1", [id]);
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: null, y: null });
    assert.equal(await s.saveLocation(id, DEFAULT_MAP, 30, 40), true);
    assert.deepEqual(await s.getLocation(id), { mapId: DEFAULT_MAP, x: 30, y: 40 });
  });

  await test("PgStore: nhiều yêu cầu tạo cùng một tên cùng lúc -> chỉ một tài khoản", async () => {
    const n = `Song${u}`, variants = [n, n.toUpperCase(), `Ｓｏｎｇ${u}`, n.toLowerCase()];
    const rs = await Promise.all(variants.map((v) => s.login(cleanName(v), PW[3])));
    assert.equal(new Set(rs.map(ok)).size, 1);
    assert.equal(rs.filter((x) => "created" in x && x.created).length, 1); // chỉ một lần được đếm là tạo mới (#207)
  });
  await s.pool.end();
}

console.log("Tất cả kiểm thử tài khoản đều đạt.");
