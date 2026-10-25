// Kiểm thử đăng nhập Google (#612): vé chọn tên, bộ kiểm giả chỉ khi GAME_TEST (cấm ở production), liên kết trong Store, giới hạn tốc độ.
// Chạy: npm run test:google --prefix server. Mặc định MemoryStore; đặt TEST_DATABASE_URL (DB riêng để thử) để thử cả PgStore.
import assert from "node:assert/strict";
import { MemoryStore, PgStore, type Store } from "../src/db.ts";
import { makeTicket, readTicket, verifyGoogle, fakeVerifierOn, googleEnabled } from "../src/google.ts";
import { ssoCheck, _resetAll } from "../src/ratelimit.ts";

async function test(title: string, fn: () => Promise<void> | void) { await fn(); console.log(`✓ ${title}`); }
const run = Date.now().toString(36).slice(-5);

await test("vé: đúng ký, đúng hạn, không chứa email; sửa / hết hạn / lạ bị từ chối", () => {
  const t = makeTicket("sub-1", 1000);
  assert.equal(readTicket(t, 2000), "sub-1");
  assert.equal(readTicket(t, 1000 + 10 * 60_000 + 1), null);
  assert.equal(readTicket(t + "x", 2000), null);
  const [body, mac] = t.split(".");
  assert.equal(readTicket(`${Buffer.from(JSON.stringify({ s: "sub-2", e: 9e15 })).toString("base64url")}.${mac}`, 2000), null);
  for (const bad of [undefined, 5, "", "a", "a.b.c", `${body}.`, {}]) assert.equal(readTicket(bad, 2000), null);
  assert.ok(!Buffer.from(body, "base64url").toString().includes("@"));
});

await test("bộ kiểm giả: chỉ khi GAME_TEST=1 và không phải production", async () => {
  const save = { GAME_TEST: process.env.GAME_TEST, NODE_ENV: process.env.NODE_ENV, GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID };
  try {
    delete process.env.GOOGLE_CLIENT_ID; delete process.env.GAME_TEST; delete process.env.NODE_ENV;
    assert.equal(fakeVerifierOn(), false); assert.equal(googleEnabled(), false);
    assert.ok("error" in await verifyGoogle("test:abc"), "không GAME_TEST: token giả bị từ chối");
    process.env.GAME_TEST = "1";
    assert.equal(fakeVerifierOn(), true);
    assert.deepEqual(await verifyGoogle("test:abc:Tên Gợi Ý"), { sub: "test-abc", name: "Tên Gợi Ý" });
    assert.ok("error" in await verifyGoogle("test:"), "thiếu sub");
    assert.ok("error" in await verifyGoogle("test:a b"), "sub sai định dạng");
    process.env.NODE_ENV = "production";
    assert.equal(fakeVerifierOn(), false);
    assert.ok("error" in await verifyGoogle("test:abc"), "production: cấm kể cả khi bật GAME_TEST");
    // Có Client ID, không phải token Google thật: bị từ chối (chữ ký / định dạng), không ném lỗi.
    delete process.env.GAME_TEST; delete process.env.NODE_ENV; process.env.GOOGLE_CLIENT_ID = "x.apps.googleusercontent.com";
    assert.ok("error" in await verifyGoogle("eyJhbGciOi.khong-hop-le.chu-ky"));
    for (const bad of [undefined, 1, "", "ab", "x".repeat(5000)]) assert.ok("error" in await verifyGoogle(bad));
  } finally {
    for (const [k, v] of Object.entries(save)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});

await test("giới hạn tốc độ theo IP: hết lượt thì 429, hồi dần, IP khác không ảnh hưởng", () => {
  _resetAll();
  const t0 = 1_000_000;
  for (let i = 0; i < 10; i++) assert.equal(ssoCheck("1.2.3.4", t0), null);
  const blocked = ssoCheck("1.2.3.4", t0);
  assert.ok(blocked && blocked.retryAfter >= 1);
  assert.equal(ssoCheck("5.6.7.8", t0), null);
  assert.equal(ssoCheck("1.2.3.4", t0 + 6_100), null);
});

async function common(label: string, s: Store, u = "") {
  await test(`${label}: tạo tài khoản bằng Google, đăng nhập lại, trùng tên / trùng Google`, async () => {
    const sub = `s1${u}`;
    assert.equal(await s.accountByIdentity("google", sub), null);
    const a = await s.createIdentityAccount(`Gg ${run}${u}`, "google", sub);
    assert.ok("accountId" in a);
    assert.equal(await s.accountByIdentity("google", sub), a.accountId);
    assert.deepEqual(await s.accountFromToken(await s.startSession(a.accountId)), { accountId: a.accountId, name: `Gg ${run}${u}` });
    assert.deepEqual(await s.createIdentityAccount(`GG ${run}${u}`, "google", `s2${u}`), { error: "taken" });
    assert.equal(await s.accountByIdentity("google", `s2${u}`), null, "tên trùng không để lại liên kết");
    assert.deepEqual(await s.createIdentityAccount(`Gh ${run}${u}`, "google", sub), { error: "linked" });
    assert.equal(await s.hasIdentity(a.accountId, "google"), true);
  });
  await test(`${label}: liên kết: một Google một tài khoản, một tài khoản một Google, liên kết lại đúng cái cũ thì ổn`, async () => {
    const p = await s.login(`Gp ${run}${u}`, "mat-khau-thu") as { accountId: number };
    assert.equal(await s.hasIdentity(p.accountId, "google"), false);
    assert.equal(await s.linkIdentity(p.accountId, "google", `s1${u}`), "subject-taken");
    assert.equal(await s.linkIdentity(p.accountId, "google", `s3${u}`), "ok");
    assert.equal(await s.linkIdentity(p.accountId, "google", `s3${u}`), "ok");
    assert.equal(await s.linkIdentity(p.accountId, "google", `s4${u}`), "has-provider");
    assert.equal(await s.accountByIdentity("google", `s3${u}`), p.accountId);
    assert.equal(await s.hasIdentity(p.accountId, "google"), true);
    // Tài khoản Google-only không đăng nhập được bằng mật khẩu đoán (mật khẩu ngẫu nhiên không ai biết).
    assert.ok("error" in await s.login(`Gg ${run}${u}`, "mat-khau-thu"));
  });
}

await common("MemoryStore", new MemoryStore());
if (process.env.TEST_DATABASE_URL) {
  const pg = new PgStore(process.env.TEST_DATABASE_URL);
  await pg.init();
  try { await common("PgStore", pg, `-${run}`); } finally { await pg.close(); }
} else console.log("⚠ bỏ qua PgStore (đặt TEST_DATABASE_URL để thử)");
console.log("✓ Mọi kiểm tra đều qua");
