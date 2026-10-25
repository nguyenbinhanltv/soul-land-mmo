// Giới hạn tần suất (rate limit) chống dò mật khẩu, tạo tài khoản phụ hàng loạt và spam chat. Lưu trong RAM, mất khi tắt server.
// Đây là cấu hình bảo mật của server, không phải số cân bằng gameplay -> để hằng số ở đây, không đưa vào shared/data.ts.
// Mọi hàm nhận `now` (ms) để kiểm thử với đồng hồ giả (xem server/scripts/ratelimit-test.ts).

import { isIPv6 } from "node:net";
import { nameKey } from "./names.ts";
import { WORLD_CHAT, RALLY } from "../../shared/data.ts";

/**
 * Chuẩn hoá IP thành khoá giới hạn: IPv4-mapped (`::ffff:a.b.c.d`) về `a.b.c.d`, IPv6 cắt về /64 (4 nhóm đầu, đã mở `::`),
 * IPv4 và chuỗi lạ giữ nguyên. Dùng chung cho mọi bộ đếm theo IP (đăng nhập sai, tạo tài khoản mới) để đổi địa chỉ trong
 * cùng /64 hay đổi cách viết không có lượt mới.
 */
export function ipKey(ip: string): string {
  const a = ip.replace(/%.*$/, "").toLowerCase();
  const m = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(a);
  if (m) return m[1];
  if (!isIPv6(a)) return ip;
  const [head, tail] = a.split("::");
  const h = head ? head.split(":") : [], t = tail ? tail.split(":") : [];
  const g = (tail === undefined ? h : [...h, ...Array(8 - h.length - t.length).fill("0"), ...t]).map((x) => parseInt(x, 16));
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return `${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`;
  return `${g.slice(0, 4).map((x) => x.toString(16)).join(":")}::/64`;
}

// ---------- Đăng nhập ----------
/** Sai bao nhiêu lần với cùng một tên từ cùng một IP thì khóa cặp (tên, IP) đó.
 *  Chỉ khóa cặp chứ không khóa cả tên, để người khác không thể cố tình gõ sai vài lần mà khóa được tài khoản của nạn nhân. */
const LOGIN_PAIR_MAX_FAILS = 5;
/** Sai bao nhiêu lần với một tên (mọi IP cộng lại) thì khóa hẳn tên đó: chống dò phân tán qua nhiều IP.
 *  Cao hơn nhiều so với ngưỡng cặp để kẻ phá phải dùng nhiều IP mới khóa được tài khoản người khác. */
const LOGIN_NAME_MAX_FAILS = 30;
/** Sai bao nhiêu lần từ cùng một IP (mọi tên cộng lại) thì khóa tạm IP đó. Cao hơn ngưỡng cặp vì nhiều người có thể chung IP. */
const LOGIN_IP_MAX_FAILS = 20;
/** Lần khóa đầu dài 1 phút, mỗi lần khóa tiếp theo gấp đôi (1, 2, 4, 8… phút)… */
const LOGIN_LOCK_BASE_MS = 60_000;
/** …nhưng không quá 30 phút. */
const LOGIN_LOCK_MAX_MS = 30 * 60_000;
/** Không sai thêm lần nào trong 1 giờ thì xóa hẳn bộ đếm (kể cả mức khóa tăng dần). */
const LOGIN_FORGET_MS = 60 * 60_000;

// ---------- Tạo tài khoản mới (#207) ----------
// /api/login tự tạo tài khoản khi tên chưa có: không giới hạn thì một IP tạo được tài khoản phụ liên tục (phình DB, cày Elo).
// Chỉ đếm tài khoản THẬT SỰ được tạo, không đếm lần đăng nhập tài khoản cũ. Ngưỡng nới cho nhiều người chung IP (quán net, NAT,
// mạng di động); deploy sau proxy mà quên TRUST_PROXY thì mọi người chung IP của proxy: server ghi cảnh báo khi IP chạm ngưỡng.
/** Một IP tạo tối đa 10 tài khoản mới mỗi giờ (cửa sổ trượt)… */
const SIGNUP_IP_HOUR_MAX = 10;
const SIGNUP_HOUR_MS = 60 * 60_000;
/** …và 30 tài khoản mỗi 24 giờ. */
const SIGNUP_IP_DAY_MAX = 30;
const SIGNUP_DAY_MS = 24 * 60 * 60_000;
/** GAME_TEST=1: bot tạo vài trăm tài khoản từ localhost mỗi lượt -> nhân ngưỡng lên 1000 lần (coi như tắt). Chỉ có hiệu lực khi
 *  bật GAME_TEST=1; bài test:ratelimit đặt lại bằng _setSignupScale. */
let signupScale = process.env.GAME_TEST === "1" ? 1000 : 1;

// ---------- Đăng nhập Google (#612) ----------
/** Token bucket theo IP cho /api/login/google, /api/login/google/create, /api/link/google: liền tối đa 10 lần, hồi 1 lượt mỗi 6 giây
 *  (mỗi lần tốn một lần xác minh chữ ký ID token và có thể ghi DB). GAME_TEST=1: nhân 1000 như ngưỡng tạo tài khoản. */
const SSO_BURST = 10;
const SSO_REFILL_MS = 6_000;
const ssoOps = new Map<string, { tokens: number; at: number }>();

/** Tính một lượt đăng nhập Google của IP `rawIp`. null = được; có lỗi thì trả 429 kèm `retryAfter` (giây). */
export function ssoCheck(rawIp: string, now = Date.now()): { error: string; retryAfter: number } | null {
  const key = ipKey(rawIp), burst = SSO_BURST * signupScale;
  let e = ssoOps.get(key);
  if (!e) { e = { tokens: burst, at: now }; ssoOps.set(key, e); }
  e.tokens = Math.min(burst, e.tokens + (now - e.at) / SSO_REFILL_MS); e.at = now;
  if (e.tokens < 1) {
    const sec = Math.ceil(((1 - e.tokens) * SSO_REFILL_MS) / 1000);
    return { error: `Đăng nhập Google quá nhiều lần. Vui lòng thử lại sau ${waitText(sec)}.`, retryAfter: sec };
  }
  e.tokens -= 1;
  return null;
}

// ---------- Chat ----------
/** Độ dài tối đa một tin (khớp maxlength của ô chat trong client/index.html). */
export const CHAT_MAX_LEN = 120;
/** Token bucket: gửi liền tối đa 5 tin… */
const CHAT_BURST = 5;
/** …sau đó hồi 1 lượt mỗi 2 giây (tức tối đa ~30 tin/phút khi gửi đều). */
const CHAT_REFILL_MS = 2_000;
/** Không được gửi lại đúng nội dung tin trước trong vòng 30 giây. */
const CHAT_REPEAT_MS = 30_000;
/** Người chơi im lặng quá 10 phút thì xóa trạng thái chat của họ khỏi RAM. */
const CHAT_FORGET_MS = 10 * 60_000;

// ---------- Lời mời tổ đội (bước 7.1) ----------
/** Token bucket: mời liền tối đa 3 lần… */
const INVITE_BURST = 3;
/** …sau đó hồi 1 lượt mỗi 10 giây. */
const INVITE_REFILL_MS = 10_000;
/** Không mời lại cùng một người trong 30 giây (kể cả khi người đó vừa từ chối). */
const INVITE_REPEAT_MS = 30_000;

// ---------- Bạn bè và chặn (#195) ----------
/** Token bucket: thêm / xóa / chặn / bỏ chặn liền tối đa 10 lần… */
const FRIEND_BURST = 10;
/** …sau đó hồi 1 lượt mỗi giây (thêm theo tên có thể phải tra DB). */
const FRIEND_REFILL_MS = 1_000;
/** Lời "X đã thêm bạn" từ cùng một người tới cùng một người: tối đa một lần mỗi 60 giây (xóa rồi thêm lại liên tục). */
const FRIEND_NOTE_REPEAT_MS = 60_000;

/** Dọn các mục cũ mỗi 5 phút để bộ nhớ không phình ra. */
const SWEEP_MS = 5 * 60_000;

interface FailEntry { fails: number; locks: number; lockUntil: number; last: number; pending: number; }

class FailCounter {
  map = new Map<string, FailEntry>();
  constructor(private maxFails: number) {}

  get(key: string, now: number) {
    let e = this.map.get(key);
    if (!e || (e.pending === 0 && e.lockUntil <= now && now - e.last > LOGIN_FORGET_MS)) {
      e = { fails: 0, locks: 0, lockUntil: 0, last: now, pending: 0 }; this.map.set(key, e);
    }
    return e;
  }

  /** Số giây còn bị khóa (0 = không bị khóa). */
  lockedFor(key: string, now: number) {
    const e = this.map.get(key);
    return e && e.lockUntil > now ? Math.ceil((e.lockUntil - now) / 1000) : 0;
  }

  /** Đang có quá nhiều lần thử chưa xong: số lần đã sai + đang xử lý chạm ngưỡng (chống bắn nhiều request song song). */
  busy(key: string) {
    const e = this.map.get(key);
    return !!e && e.fails + e.pending >= this.maxFails;
  }

  begin(key: string, now: number) { this.get(key, now).pending++; }
  end(key: string) { const e = this.map.get(key); if (e && e.pending > 0) e.pending--; }

  /** Ghi nhận một lần sai. Chạm ngưỡng thì khóa (thời gian tăng dần). Trả về số lần còn được thử. */
  fail(key: string, now: number) {
    const e = this.get(key, now);
    e.fails++; e.last = now;
    if (e.fails >= this.maxFails) {
      e.lockUntil = now + Math.min(LOGIN_LOCK_MAX_MS, LOGIN_LOCK_BASE_MS * 2 ** e.locks);
      e.locks++; e.fails = 0;
    }
    return this.maxFails - e.fails;
  }

  reset(key: string) { const e = this.map.get(key); if (e) { e.fails = 0; e.locks = 0; e.lockUntil = 0; } }

  sweep(now: number) {
    for (const [k, e] of this.map) if (e.pending === 0 && e.lockUntil <= now && now - e.last > LOGIN_FORGET_MS) this.map.delete(k);
  }
}

const byPair = new FailCounter(LOGIN_PAIR_MAX_FAILS);
const byName = new FailCounter(LOGIN_NAME_MAX_FAILS);
const byIp = new FailCounter(LOGIN_IP_MAX_FAILS);

// Khóa của tên: nameKey (names.ts), đúng hàm db.ts dùng để tìm tài khoản. Các cách viết khác nhau của cùng một tên
// ("Ｔａｍ", "TAM", "tam") vừa là cùng một tài khoản vừa dùng chung bộ đếm, không lách được giới hạn.
// Đếm theo tên dù tài khoản có tồn tại hay không, nên thông báo lỗi không lộ điều đó.
// Tên chỉ gồm chữ, số, dấu cách, _ (kiểm tra ở index.ts) nên không thể chứa \u0000: ghép khóa cặp không bị trùng.
const pairKey = (k: string, ip: string) => `${k}\u0000${ip}`;

const waitText = (sec: number) => (sec >= 3600 ? `${Math.ceil(sec / 3600)} giờ` : sec >= 60 ? `${Math.ceil(sec / 60)} phút` : `${sec} giây`);
const lockedMsg = (sec: number) => `Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${waitText(sec)}.`;
const lockedSec = (k: string, ip: string, now: number) =>
  Math.max(byPair.lockedFor(pairKey(k, ip), now), byName.lockedFor(k, now), byIp.lockedFor(ip, now));

/**
 * Gọi TRƯỚC khi kiểm tra mật khẩu. Bị khóa -> trả lỗi, KHÔNG được kiểm tra mật khẩu.
 * Trả null -> được thử; sau đó BẮT BUỘC gọi loginEnd đúng một lần (kể cả khi lỗi, dùng try/finally).
 */
export function loginBegin(name: string, rawIp: string, now = Date.now()): { error: string; retryAfter: number } | null {
  const ip = ipKey(rawIp), k = nameKey(name), pk = pairKey(k, ip);
  const sec = lockedSec(k, ip, now);
  if (sec) return { error: lockedMsg(sec), retryAfter: sec };
  if (byPair.busy(pk) || byName.busy(k) || byIp.busy(ip)) return { error: "Đang xử lý quá nhiều lần đăng nhập. Vui lòng thử lại sau vài giây.", retryAfter: 3 };
  byPair.begin(pk, now); byName.begin(k, now); byIp.begin(ip, now);
  return null;
}

/**
 * Gọi sau khi kiểm tra mật khẩu. ok=null nghĩa là lỗi hệ thống (không tính là sai).
 * Sai -> trả thông báo lỗi chung, không cho biết tài khoản có tồn tại hay không.
 * Đúng -> xóa bộ đếm của cặp (tên, IP) và của tên (đã chứng minh biết mật khẩu của đúng tài khoản ứng với khóa tên);
 * bộ đếm IP giữ nguyên để kẻ dò không "rửa" bằng tài khoản của chính mình.
 */
export function loginEnd(name: string, rawIp: string, ok: boolean | null, now = Date.now()): { error: string; retryAfter?: number } | null {
  const ip = ipKey(rawIp), k = nameKey(name), pk = pairKey(k, ip);
  byPair.end(pk); byName.end(k); byIp.end(ip);
  if (ok === null) return null;
  if (ok) { byPair.reset(pk); byName.reset(k); return null; }
  const left = Math.min(byPair.fail(pk, now), byName.fail(k, now), byIp.fail(ip, now));
  const sec = lockedSec(k, ip, now);
  if (sec) return { error: lockedMsg(sec), retryAfter: sec };
  return { error: `Tên đăng nhập hoặc mật khẩu không đúng.${left <= 2 ? ` Còn ${left} lần thử trước khi bị khóa tạm.` : ""}` };
}

// ---------- Tạo tài khoản mới ----------
/** at: thời điểm các tài khoản đã tạo trong 24 giờ qua (tăng dần); pending: số yêu cầu đang được phép tạo mà chưa xong. */
interface SignupEntry { at: number[]; pending: number; warned: boolean; }
const signups = new Map<string, SignupEntry>();

/**
 * Số giây phải chờ trước khi IP được tạo thêm tài khoản (wait 0 = được tạo); lần chờ tính theo tài khoản cũ nhất còn trong cửa sổ.
 * full: riêng số tài khoản đã tạo đã chạm ngưỡng; false mà wait > 0 là chạm ngưỡng (toàn bộ hay một phần) do các yêu cầu đang xử lý
 * (kể cả đăng nhập tài khoản cũ), ví dụ 9 đã tạo + 1 đang xử lý: vài giây sau có thể vẫn tạo được.
 */
function signupWait(e: SignupEntry, now: number) {
  e.at = e.at.filter((t) => now - t < SIGNUP_DAY_MS);
  let wait = 0, full = false;
  for (const [max, ms] of [[SIGNUP_IP_HOUR_MAX, SIGNUP_HOUR_MS], [SIGNUP_IP_DAY_MAX, SIGNUP_DAY_MS]]) {
    const lim = max * signupScale, recent = e.at.filter((t) => now - t < ms);
    if (recent.length + e.pending < lim) continue;
    // Tài khoản đã tạo đủ ngưỡng: chờ tài khoản thứ k (tính từ cũ nhất) ra khỏi cửa sổ. Chạm ngưỡng có phần do các yêu cầu đang xử lý
    // (chưa biết có tạo không): chờ vài giây như `busy` của đăng nhập.
    if (recent.length >= lim) {
      const k = Math.min(recent.length + e.pending - lim, recent.length - 1);
      full = true; wait = Math.max(wait, Math.ceil((recent[k] + ms - now) / 1000));
    } else wait = Math.max(wait, 3);
  }
  return { wait, full };
}

/**
 * Gọi TRƯỚC store.login, sau loginBegin. null -> IP còn được tạo tài khoản mới: đã giữ một chỗ, gọi login với quyền tạo và BẮT BUỘC gọi
 * signupEnd(ip, true, created) đúng một lần. Có lỗi -> gọi login KHÔNG được tạo (tài khoản cũ vẫn đăng nhập bình thường); login báo
 * tên chưa có thì trả 429 với lỗi này. Giữ chỗ trước để nhiều request song song không vượt ngưỡng.
 */
export function signupBegin(ip: string, now = Date.now()): { error: string; retryAfter: number } | null {
  const key = ipKey(ip);
  let e = signups.get(key);
  if (!e) { e = { at: [], pending: 0, warned: false }; signups.set(key, e); }
  const { wait: sec, full } = signupWait(e, now);
  if (!sec) { e.pending++; return null; }
  if (!full) return { error: "Đang xử lý nhiều lần đăng nhập từ mạng của bạn. Vui lòng thử lại sau vài giây.", retryAfter: sec };
  if (!e.warned) {
    e.warned = true;
    console.warn(`⚠  IP ${ip} chạm giới hạn tạo tài khoản mới (#207). Nếu mọi người chơi cùng hiện một IP thì kiểm tra TRUST_PROXY.`);
  }
  return { error: `Mạng của bạn đã tạo quá nhiều tài khoản mới. Vui lòng đăng nhập tài khoản cũ hoặc thử lại sau ${waitText(sec)}.`, retryAfter: sec };
}

/** Gọi sau store.login. reserved: signupBegin đã trả null; created: login vừa tạo tài khoản mới (chỉ lúc đó mới đếm). */
export function signupEnd(ip: string, reserved: boolean, created: boolean, now = Date.now()) {
  const e = signups.get(ipKey(ip));
  if (!e) return;
  if (reserved && e.pending > 0) e.pending--;
  if (created) { e.at.push(now); e.warned = false; }
}

/** Chỉ dùng trong kiểm thử: hệ số nhân ngưỡng (1 = như server thật, không phụ thuộc GAME_TEST của môi trường chạy bài thử). */
export function _setSignupScale(n: number) { signupScale = n; }

// ---------- Chat ----------
/** Kênh chat (#188, #198): bản đồ (phòng hiện tại), tổ đội, tin riêng, thế giới, tông môn. Mỗi kênh một bộ đếm riêng. */
export type ChatChannel = "map" | "party" | "whisper" | "world" | "tong";
interface ChatEntry { tokens: number; at: number; lastText: string; lastAt: number; }
const chat = new Map<string, ChatEntry>();
const chatKey = (key: string | number, ch: ChatChannel) => `${ch}:${key}`;
/** Tài khoản -> lúc gửi tin kênh thế giới gần nhất (ms), cho hồi WORLD_CHAT.cdSecs giây. */
const worldAt = new Map<number, number>();

/** Chuẩn hoá nội dung tin: chỉ nhận chuỗi (String() trên object tùy ý client gửi có thể ném lỗi, #164), gộp khoảng trắng. */
export function chatText(raw: unknown) { return (typeof raw === "string" ? raw : "").replace(/\s+/g, " ").trim(); }

/**
 * Kiểm tra một tin chat của người chơi `key` (nên dùng accountId để vào lại phòng không được hồi lượt) trên kênh `ch` (mỗi kênh
 * một bucket riêng: spam tổ đội không làm hết lượt chat bản đồ). Hợp lệ -> { text } đã cắt khoảng trắng (đã tính lượt). Bị chặn ->
 * { error } để báo riêng cho người gửi. Tin rỗng -> null (bỏ qua im lặng). Gọi sau các bước kiểm tra luật của kênh.
 */
export function chatCheck(key: string | number, raw: unknown, now = Date.now(), ch: ChatChannel = "map"): { text: string } | { error: string } | null {
  const text = chatText(raw);
  if (!text) return null;
  if (text.length > CHAT_MAX_LEN) return { error: `Tin nhắn quá dài (tối đa ${CHAT_MAX_LEN} ký tự).` };
  const k = chatKey(key, ch);
  let e = chat.get(k);
  if (!e) { e = { tokens: CHAT_BURST, at: now, lastText: "", lastAt: 0 }; chat.set(k, e); }
  e.tokens = Math.min(CHAT_BURST, e.tokens + (now - e.at) / CHAT_REFILL_MS); e.at = now;
  if (e.tokens < 1) return { error: `Bạn chat quá nhanh. Đợi ${Math.ceil(((1 - e.tokens) * CHAT_REFILL_MS) / 1000)} giây rồi gửi tiếp.` };
  const norm = text.toLowerCase();
  if (norm === e.lastText && now - e.lastAt < CHAT_REPEAT_MS) return { error: "Đừng gửi lặp lại cùng một nội dung liên tục." };
  e.tokens -= 1; e.lastText = norm; e.lastAt = now;
  return { text };
}

/** Kênh thế giới: số giây tài khoản `acc` còn phải chờ (0 = gửi được). Không tính lượt. */
export function worldWait(acc: number, now = Date.now()) {
  const left = (worldAt.get(acc) ?? -Infinity) + WORLD_CHAT.cdSecs * 1000 - now;
  return left > 0 ? Math.ceil(left / 1000) : 0;
}
/** Kênh thế giới: ghi lần gửi (sau chatCheck hợp lệ). */
export function worldMark(acc: number, now = Date.now()) { worldAt.set(acc, now); }

/** Hook kiểm thử (`test {op: "chat", cop: "rlreset"}`, chỉ khi GAME_TEST=1): xóa bộ đếm chat mọi kênh và hồi kênh thế giới của một tài khoản. */
export function chatReset(key: number) {
  for (const ch of ["map", "party", "whisper", "world", "tong"] as const) chat.delete(chatKey(key, ch));
  worldAt.delete(key);
}

// ---------- Lời mời tổ đội ----------
interface InviteEntry { tokens: number; at: number; last: Map<number, number>; }
const invites = new Map<number, InviteEntry>();

/**
 * Kiểm tra một lời mời tổ đội của tài khoản `key` tới tài khoản `target` (bước 7.1): chống spam như chat. Hợp lệ -> null (đã tính
 * lượt). Bị chặn -> { error } để báo riêng cho người mời. Gọi sau mọi bước kiểm tra luật (lời mời không hợp lệ không tốn lượt).
 */
export function inviteCheck(key: number, target: number, now = Date.now()): { error: string } | null {
  let e = invites.get(key);
  if (!e) { e = { tokens: INVITE_BURST, at: now, last: new Map() }; invites.set(key, e); }
  e.tokens = Math.min(INVITE_BURST, e.tokens + (now - e.at) / INVITE_REFILL_MS); e.at = now;
  const prev = e.last.get(target);
  if (prev !== undefined && now - prev < INVITE_REPEAT_MS) return { error: `Vừa mời người này rồi: đợi ${Math.ceil((INVITE_REPEAT_MS - (now - prev)) / 1000)} giây rồi mời lại.` };
  if (e.tokens < 1) return { error: `Bạn mời quá nhanh. Đợi ${Math.ceil(((1 - e.tokens) * INVITE_REFILL_MS) / 1000)} giây rồi mời tiếp.` };
  e.tokens -= 1; e.last.set(target, now);
  return null;
}

/** Hook kiểm thử (`test {op: "party", pop: "rlreset"}`, chỉ khi GAME_TEST=1): xóa bộ đếm lời mời của một tài khoản. */
export function inviteReset(key: number) { invites.delete(key); }

// ---------- Bạn bè và chặn ----------
const friendOps = new Map<number, { tokens: number; at: number }>();
const rallies = new Map<number, { tokens: number; at: number }>(); // dấu "Tập trung ở đây" (R6 #433), hàm rallyCheck ở cuối file

/**
 * Một thao tác bạn bè / chặn của tài khoản `key` (#195): chống spam (thêm theo tên có thể tra DB, mỗi lần ghi DB). Hợp lệ -> null
 * (đã tính lượt). Hết lượt -> { error } để báo riêng người gửi.
 */
export function friendCheck(key: number, now = Date.now()): { error: string } | null {
  let e = friendOps.get(key);
  if (!e) { e = { tokens: FRIEND_BURST, at: now }; friendOps.set(key, e); }
  e.tokens = Math.min(FRIEND_BURST, e.tokens + (now - e.at) / FRIEND_REFILL_MS); e.at = now;
  if (e.tokens < 1) return { error: `Thao tác bạn bè quá nhanh. Đợi ${Math.ceil(((1 - e.tokens) * FRIEND_REFILL_MS) / 1000)} giây rồi thử lại.` };
  e.tokens -= 1;
  return null;
}

const friendNotes = new Map<string, number>(); // "người thêm|người được thêm" -> lúc gửi lời "đã thêm bạn" gần nhất

/** Được gửi lời "đã thêm bạn" của `key` tới `target` lúc này không (#195); được thì ghi lại lúc gửi. */
export function friendNoteOk(key: number, target: number, now = Date.now()) {
  const k = `${key}|${target}`, at = friendNotes.get(k);
  if (at !== undefined && now - at < FRIEND_NOTE_REPEAT_MS) return false;
  friendNotes.set(k, now);
  return true;
}

/** Hook kiểm thử (`test {op: "friend", fop: "rlreset"}`, chỉ khi GAME_TEST=1): xóa bộ đếm thao tác bạn bè và lời "đã thêm bạn" của một tài khoản. */
export function friendReset(key: number) {
  friendOps.delete(key);
  for (const k of friendNotes.keys()) if (k.startsWith(`${key}|`)) friendNotes.delete(k);
}

// ---------- Dọn dẹp ----------
export function sweep(now = Date.now()) {
  byPair.sweep(now); byName.sweep(now); byIp.sweep(now);
  for (const [k, e] of signups) if (e.pending === 0 && e.at.every((t) => now - t >= SIGNUP_DAY_MS)) signups.delete(k);
  for (const [k, e] of chat) if (now - Math.max(e.at, e.lastAt) > CHAT_FORGET_MS) chat.delete(k);
  for (const [k, at] of worldAt) if (now - at >= WORLD_CHAT.cdSecs * 1000) worldAt.delete(k);
  for (const [k, e] of invites) {
    for (const [t, at] of e.last) if (now - at >= INVITE_REPEAT_MS) e.last.delete(t);
    if (!e.last.size && now - e.at > CHAT_FORGET_MS) invites.delete(k);
  }
  for (const [k, e] of friendOps) if (now - e.at > CHAT_FORGET_MS) friendOps.delete(k);
  for (const [k, e] of ssoOps) if (now - e.at >= SSO_BURST * SSO_REFILL_MS) ssoOps.delete(k);
  for (const [k, at] of friendNotes) if (now - at >= FRIEND_NOTE_REPEAT_MS) friendNotes.delete(k);
  for (const [k, e] of rallies) if (now - e.at >= RALLY.burst * RALLY.refillMs) rallies.delete(k); // đã hồi đầy: giống như chưa có
}
setInterval(() => sweep(), SWEEP_MS).unref();

/** Chỉ dùng trong kiểm thử: xóa toàn bộ trạng thái. */
export function _resetAll() { byPair.map.clear(); byName.map.clear(); byIp.map.clear(); signups.clear(); chat.clear(); worldAt.clear(); invites.clear(); friendOps.clear(); friendNotes.clear(); rallies.clear(); ssoOps.clear(); }

// ---------- Đánh dấu "Tập trung ở đây" của tổ đội (R6 #433) ----------
/**
 * Kiểm tra một lần đặt dấu "Tập trung ở đây" của tài khoản `key`: token bucket `RALLY.burst` lượt, hồi 1 lượt mỗi `RALLY.refillMs`. Gọi sau
 * mọi bước kiểm tra luật (dấu không hợp lệ không tốn lượt). Hợp lệ -> null (đã tính lượt); hết lượt -> { error } báo riêng người đặt.
 */
export function rallyCheck(key: number, now = Date.now()): { error: string } | null {
  let e = rallies.get(key);
  if (!e) { e = { tokens: RALLY.burst, at: now }; rallies.set(key, e); }
  e.tokens = Math.min(RALLY.burst, e.tokens + (now - e.at) / RALLY.refillMs); e.at = now;
  if (e.tokens < 1) return { error: `Đặt dấu tập trung quá nhanh. Đợi ${Math.ceil(((1 - e.tokens) * RALLY.refillMs) / 1000)} giây rồi đặt tiếp.` };
  e.tokens -= 1;
  return null;
}

/** Hook kiểm thử (`test {op: "rally", rop: "rlreset"}`, chỉ khi GAME_TEST=1): xóa bộ đếm đặt dấu của một tài khoản. */
export function rallyReset(key: number) { rallies.delete(key); }
