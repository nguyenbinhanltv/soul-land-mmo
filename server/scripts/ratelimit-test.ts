// Kiểm thử server/src/ratelimit.ts với đồng hồ giả (không cần bật server).
// Chạy: npm run test:ratelimit --prefix server
import assert from "node:assert/strict";
import { loginBegin, loginEnd, nameKey, chatCheck, sweep, _resetAll, CHAT_MAX_LEN } from "../src/ratelimit.ts";

let now = 1_000_000;
const sec = (s: number) => { now += s * 1000; };
/** Một lần thử đăng nhập trọn vẹn: trả về lỗi (nếu có). */
const attempt = (name: string, ip: string, ok: boolean) => loginBegin(name, ip, now)?.error ?? loginEnd(name, ip, ok, now)?.error ?? null;

function test(title: string, fn: () => void) {
  _resetAll(); now = 1_000_000;
  fn(); console.log(`✓ ${title}`);
}

// ---------- Đăng nhập ----------
test("Sai 5 lần với cùng (tên, IP) thì khóa cặp đó 1 phút, báo số lần còn lại khi gần hết", () => {
  assert.equal(attempt("Đường Tam", "1.1.1.1", false), "Tên đăng nhập hoặc mật khẩu không đúng.");
  attempt("Đường Tam", "1.1.1.1", false);
  assert.match(attempt("Đường Tam", "1.1.1.1", false)!, /Còn 2 lần/);
  assert.match(attempt("Đường Tam", "1.1.1.1", false)!, /Còn 1 lần/);
  assert.match(attempt("Đường Tam", "1.1.1.1", false)!, /thử lại sau 1 phút/);
  // Đang khóa: từ IP đó, kể cả mật khẩu đúng hay khác hoa thường cũng không được thử.
  assert.match(attempt("Đường Tam", "1.1.1.1", true)!, /quá nhiều lần/);
  assert.match(attempt("ĐƯỜNG TAM", "1.1.1.1", true)!, /quá nhiều lần/);
  sec(59); assert.match(loginBegin("Đường Tam", "1.1.1.1", now)!.error, /thử lại sau \d+ giây/);
  sec(2); assert.equal(attempt("Đường Tam", "1.1.1.1", true), null);
});

test("Kẻ phá gõ sai từ IP của mình không khóa được chủ tài khoản ở IP khác", () => {
  for (let i = 0; i < 5; i++) attempt("Tiểu Vũ", "6.6.6.6", false);
  assert.match(attempt("Tiểu Vũ", "6.6.6.6", true)!, /quá nhiều lần/);
  assert.equal(attempt("Tiểu Vũ", "2.2.2.2", true), null);
});

test("Mỗi lần khóa sau dài gấp đôi, tối đa 30 phút", () => {
  const lockFor = () => { for (let i = 0; i < 5; i++) attempt("Tiểu Vũ", "1.1.1.1", false); return loginBegin("Tiểu Vũ", "1.1.1.1", now)!.retryAfter; };
  const seen: number[] = [];
  for (let k = 0; k < 7; k++) { const s = lockFor(); seen.push(s); sec(s + 1); }
  assert.deepEqual(seen, [60, 120, 240, 480, 960, 1800, 1800]);
});

test("Dò phân tán: tổng 30 lần sai một tên từ nhiều IP thì khóa tên ở mọi IP", () => {
  for (let i = 0; i < 29; i++) attempt("Vinh Vinh", `10.0.${Math.floor(i / 4)}.${i % 4}`, false); // mỗi IP chỉ sai ≤ 4 lần
  assert.equal(attempt("Vinh Vinh", "2.2.2.2", true), null, "chưa tới 30 thì chủ tài khoản vẫn vào được");
  for (let i = 0; i < 29; i++) attempt("Vinh Vinh", `10.1.${Math.floor(i / 4)}.${i % 4}`, false);
  assert.match(attempt("Vinh Vinh", "10.9.9.9", false)!, /thử lại sau 1 phút/);
  assert.match(attempt("Vinh Vinh", "2.2.2.2", true)!, /thử lại sau 1 phút/);
  // Tên chưa có tài khoản cũng bị đếm và báo y hệt, nên không đoán được tài khoản có tồn tại hay không.
  assert.equal(attempt("Khong Ton Tai", "3.3.3.3", false), "Tên đăng nhập hoặc mật khẩu không đúng.");
  sec(61); assert.equal(attempt("Vinh Vinh", "2.2.2.2", true), null);
});

test("Chuẩn hóa NFKC: các cách viết khác của cùng một tên dùng chung bộ đếm", () => {
  assert.equal(nameKey("Ｔａｍ Ｔａｍ"), nameKey("tam tam")); // chữ full-width
  assert.equal(nameKey("Đường Tam".normalize("NFD")), nameKey("đường tam")); // dấu tổ hợp vs dựng sẵn
  const variants = ["Tam Tam", "ＴＡＭ ＴＡＭ", "tam tam", "Ｔａｍ Ｔａｍ", " TAM TAM "];
  for (const v of variants) attempt(v, "1.1.1.1", false);
  assert.match(attempt("tam tam", "1.1.1.1", true)!, /quá nhiều lần/);
  assert.equal(nameKey("İRİS"), nameKey("iris")); // "İ" của tiếng Thổ
  assert.equal(nameKey("ΟΔΥΣΣΕΥΣ"), nameKey("οδυσσευσ")); // "Σ" cuối từ
});

test("Đăng nhập đúng vào tài khoản trông giống (\"ＴＡＭ\") không xóa được bộ đếm của \"Tam\"", () => {
  for (let i = 0; i < 4; i++) attempt("Tam", "1.1.1.1", false);
  assert.equal(attempt("ＴＡＭ", "1.1.1.1", true), null); // db.ts coi đây là tài khoản khác: đăng nhập được
  assert.match(attempt("Tam", "1.1.1.1", false)!, /thử lại sau 1 phút/);
});

test("Đăng nhập đúng xóa bộ đếm của (tên, IP) và của tên", () => {
  for (let i = 0; i < 4; i++) attempt("Đái Mộc Bạch", "1.1.1.1", false);
  assert.equal(attempt("Đái Mộc Bạch", "1.1.1.1", true), null);
  for (let i = 0; i < 4; i++) assert.doesNotMatch(attempt("Đái Mộc Bạch", "1.1.1.1", false)!, /quá nhiều/);
});

test("Một IP dò nhiều tên: sai 20 lần thì khóa IP, IP khác vẫn vào được", () => {
  for (let i = 0; i < 20; i++) attempt(`acc${i % 4}x${Math.floor(i / 4)}`, "6.6.6.6", false); // mỗi tên chỉ sai 1 lần
  assert.match(attempt("Ninh Vinh Vinh", "6.6.6.6", true)!, /thử lại sau 1 phút/);
  assert.equal(attempt("Ninh Vinh Vinh", "7.7.7.7", true), null);
  // Đăng nhập đúng tài khoản của chính mình không "rửa" được bộ đếm IP.
  sec(61); attempt("Ninh Vinh Vinh", "6.6.6.6", true);
  for (let i = 0; i < 19; i++) attempt(`b${i}`, "6.6.6.6", false);
  assert.match(attempt("b99", "6.6.6.6", false)!, /thử lại sau 2 phút/);
});

test("Bắn nhiều request song song không vượt được giới hạn", () => {
  for (let i = 0; i < 5; i++) assert.equal(loginBegin("Áo Tư Tạp", "1.1.1.1", now), null);
  assert.match(loginBegin("Áo Tư Tạp", "1.1.1.1", now)!.error, /Đang xử lý/);
  for (let i = 0; i < 5; i++) loginEnd("Áo Tư Tạp", "1.1.1.1", false, now);
  assert.match(loginBegin("Áo Tư Tạp", "1.1.1.1", now)!.error, /thử lại sau 1 phút/);
});

test("Lỗi hệ thống (ok=null) không tính là sai", () => {
  for (let i = 0; i < 10; i++) { loginBegin("Mã Hồng Tuấn", "1.1.1.1", now); loginEnd("Mã Hồng Tuấn", "1.1.1.1", null, now); }
  assert.equal(attempt("Mã Hồng Tuấn", "1.1.1.1", true), null);
});

// ---------- Chat ----------
const send = (t: string, who = 1) => { const r = chatCheck(who, t, now); return r && ("error" in r ? r.error : "ok"); };

test("Token bucket: gửi liền 5 tin, tin thứ 6 bị chặn, sau 2 giây gửi được 1 tin", () => {
  for (let i = 0; i < 5; i++) assert.equal(send(`tin ${i}`), "ok");
  assert.match(send("tin 5")!, /chat quá nhanh/);
  assert.equal(send("khác", 2), "ok"); // người khác không bị ảnh hưởng
  sec(2); assert.equal(send("tin 6"), "ok");
  assert.match(send("tin 7")!, /chat quá nhanh/);
  sec(10); for (let i = 0; i < 5; i++) assert.equal(send(`lại ${i}`), "ok"); // hồi tối đa 5 lượt
  assert.match(send("lại 5")!, /chat quá nhanh/);
});

test("Giới hạn độ dài và tin rỗng", () => {
  assert.equal(send("a".repeat(CHAT_MAX_LEN)), "ok");
  assert.match(send("b".repeat(CHAT_MAX_LEN + 1))!, /quá dài/);
  assert.equal(send("   "), null);
  assert.equal(chatCheck(1, undefined, now), null);
});

test("Chặn lặp cùng nội dung liên tục trong 30 giây", () => {
  assert.equal(send("mua hồn hoàn"), "ok");
  assert.match(send("  MUA   hồn hoàn ")!, /lặp lại/);
  sec(5); assert.equal(send("chào"), "ok");
  sec(5); assert.equal(send("mua hồn hoàn"), "ok"); // xen tin khác thì được
  sec(29); assert.match(send("mua hồn hoàn")!, /lặp lại/);
  sec(2); assert.equal(send("mua hồn hoàn"), "ok");
});

test("Dọn dẹp xóa trạng thái cũ", () => {
  for (let i = 0; i < 5; i++) send(`x${i}`);
  sec(11 * 60); sweep(now);
  for (let i = 0; i < 5; i++) assert.equal(send(`y${i}`), "ok");
});

console.log("Tất cả kiểm thử rate limit đều đạt.");
