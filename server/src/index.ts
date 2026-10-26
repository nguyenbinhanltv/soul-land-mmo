import http from "node:http";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server, matchMaker } from "colyseus";
import { RedisDriver } from "@colyseus/redis-driver";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MapRoom, awakenAccount, chooseLooks, pickChannel, CHANNEL_CAP, saveStats } from "./rooms/MapRoom.ts";
import { ArenaRoom } from "./rooms/ArenaRoom.ts";
import { store } from "./db.ts";
import { loginBegin, loginEnd, signupBegin, signupEnd, ssoCheck, apiCheck, loginRate, PASSWORD_MAX_LEN } from "./ratelimit.ts";
import { GOOGLE, googleClientId, googleEnabled, verifyGoogle, makeTicket, readTicket } from "./google.ts";
import { cleanName, isReservedName } from "./names.ts";
import { cacheControlFor } from "./staticCache.ts";
import { loadMap } from "./map.ts";
import { startSchedule } from "./schedule.ts";
import { MAPS, MSG_MAX_PAYLOAD, parseLooks } from "../../shared/data.ts";
import { gamePresence, presenceBackend, isRedisFailure, guardClient } from "./presence.ts";
import { configurePresence as configurePartyPresence } from "./party.ts";

configurePartyPresence(presenceBackend);

const PORT = Number(process.env.PORT ?? 2567);
const app = express();
// Sau proxy của nền tảng deploy (Render, Railway, Fly.io…): đặt TRUST_PROXY=1 để lấy đúng IP người chơi cho rate limit.
if (process.env.TRUST_PROXY) app.set("trust proxy", /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
// CORS trước express.json: lỗi đọc body (JSON hỏng, quá lớn) cũng có header, trình duyệt mới đọc được câu báo lỗi.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN ?? "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});
app.use(express.json({ limit: "10kb" }));

/**
 * Bọc route async: Express 4 không bắt promise bị từ chối, lỗi bất ngờ (DB…) sẽ để request treo tới hết giờ chờ. Ở đây trả 500
 * với thông báo chung (không kèm stack) và ghi log server.
 */
const route = (fn: (req: express.Request, res: express.Response) => Promise<void>): express.RequestHandler => (req, res) => {
  fn(req, res).catch((e) => {
    console.error(`Lỗi ${req.method} ${req.path}:`, e);
    if (!res.headersSent) res.status(500).json({ error: "Máy chủ gặp lỗi, vui lòng thử lại sau." });
  });
};

// chMax: số người tối đa mỗi kênh (bot đọc để biết server đang hạ CHANNEL_MAX cho phần thử nhiều kênh).
// Redis đã bật mà đang mất (#561): 503 để cân bằng tải / trình quản lý ngừng chuyển người chơi mới tới (fail-closed); tiến trình KHÔNG thoát, tự phục hồi khi
// Redis có lại. `/live` luôn 200 khi tiến trình còn chạy (dành cho liveness probe, không khởi động lại chỉ vì Redis mất).
app.get("/health", (_q, r) => { const up = presenceBackend.healthy(); r.status(up ? 200 : 503).json({ ok: up, chMax: CHANNEL_CAP, ...(up ? {} : { redis: "down" }) }); });
app.get("/live", (_q, r) => { r.json({ ok: true }); });

/** Giới hạn theo IP cho REST có token (#735): hết lượt thì trả 429 + Retry-After và trả false. */
function apiGate(req: express.Request, res: express.Response) {
  const blocked = apiCheck(req.ip ?? req.socket.remoteAddress ?? "?");
  if (!blocked) return true;
  res.setHeader("Retry-After", String(blocked.retryAfter)); res.status(429).json({ error: blocked.error });
  return false;
}

const NAME_RE = /^[\p{L}\p{N}_ ]{3,20}$/u, NAME_ERR = "Tên 3–20 ký tự, chỉ gồm chữ, số, dấu cách hoặc _.", RESERVED_ERR = "Tên này dành riêng cho hệ thống, hãy chọn tên khác.";

// Cấu hình công khai cho client: googleClientId null = ẩn nút Google (GOOGLE_CLIENT_ID không phải bí mật).
app.get("/api/config", (_q, r) => { r.json({ googleClientId: googleEnabled() ? googleClientId() ?? "" : null }); });

// Đăng nhập (tự tạo tài khoản nếu tên chưa tồn tại).
app.post("/api/login", route(async (req, res) => {
  // Tên hiển thị sau NFKC (names.ts); store và rate limit tự so sánh theo nameKey(name).
  const name = cleanName(String(req.body?.name ?? "")), password = String(req.body?.password ?? "");
  if (!NAME_RE.test(name)) { res.status(400).json({ error: NAME_ERR }); return; }
  // Tên cấm (#818) chỉ chặn TẠO MỚI: tài khoản đã có từ trước vẫn đăng nhập được.
  if (isReservedName(name) && !(await store.lookupAccount(name))) { res.status(400).json({ error: RESERVED_ERR }); return; }
  if (password.length < 4) { res.status(400).json({ error: "Mật khẩu tối thiểu 4 ký tự." }); return; }
  if (password.length > PASSWORD_MAX_LEN) { res.status(400).json({ error: `Mật khẩu tối đa ${PASSWORD_MAX_LEN} ký tự.` }); return; }
  // Giới hạn số lần sai theo tên và theo IP (server/src/ratelimit.ts).
  const ip = req.ip ?? req.socket.remoteAddress ?? "?";
  const blocked = loginRate(name, ip) ?? loginBegin(name, ip); // loginRate trước: loginBegin giữ chỗ (pending), chặn sau sẽ rò
  if (blocked) { res.setHeader("Retry-After", String(blocked.retryAfter)); res.status(429).json({ error: blocked.error }); return; }
  // Giới hạn số tài khoản MỚI mỗi IP (#207): hết lượt thì login không tạo, tài khoản cũ vẫn vào được; chỉ đếm khi thật sự tạo.
  const noSignup = signupBegin(ip);
  let r: Awaited<ReturnType<typeof store.login>>;
  try { r = await store.login(name, password, !noSignup); } catch (e) { loginEnd(name, ip, null); signupEnd(ip, !noSignup, false); throw e; }
  signupEnd(ip, !noSignup, !("error" in r) && r.created);
  if ("noCreate" in r) {
    // Không tính là đăng nhập sai (khoá oan quán net). 429 / 401 cho biết tên đã có hay chưa, như vốn có khi /api/login tự tạo tài khoản.
    loginEnd(name, ip, null);
    res.setHeader("Retry-After", String(noSignup!.retryAfter)); res.status(429).json({ error: noSignup!.error }); return;
  }
  const fail = loginEnd(name, ip, !("error" in r));
  if (fail || "error" in r) {
    if (fail?.retryAfter) res.setHeader("Retry-After", String(fail.retryAfter));
    res.status(fail?.retryAfter ? 429 : 401).json({ error: fail?.error ?? "Tên đăng nhập hoặc mật khẩu không đúng." }); return;
  }
  const [character, looks, loc] = await Promise.all([store.getCharacter(r.accountId), store.getLooks(r.accountId), store.getLocation(r.accountId)]);
  res.json({ token: r.token, character, looks, mapId: loc.mapId });
}));

// ---------- Đăng nhập Google (SSO, #612) ----------
/** Phản hồi đăng nhập thành công: giống /api/login. */
async function loginReply(res: express.Response, accountId: number, token: string) {
  const [character, looks, loc] = await Promise.all([store.getCharacter(accountId), store.getLooks(accountId), store.getLocation(accountId)]);
  res.json({ token, character, looks, mapId: loc.mapId });
}
/** Chung cho 3 route Google: giới hạn theo IP rồi xác minh credential; trả null nếu đã trả lỗi. */
async function googleGate(req: express.Request, res: express.Response, credential: unknown) {
  if (!googleEnabled()) { res.status(503).json({ error: "Máy chủ chưa bật đăng nhập Google." }); return null; }
  const blocked = ssoCheck(req.ip ?? req.socket.remoteAddress ?? "?");
  if (blocked) { res.setHeader("Retry-After", String(blocked.retryAfter)); res.status(429).json({ error: blocked.error }); return null; }
  return verifyGateCredential(res, credential);
}
async function verifyGateCredential(res: express.Response, credential: unknown) {
  const g = await verifyGoogle(credential);
  if ("error" in g) { res.status(401).json({ error: g.error }); return null; }
  return g;
}

// Đã liên kết: vào như /api/login. Chưa: trả `needName` + vé ngắn hạn (chỉ chứa mã Google, ký bằng server) và tên gợi ý; client hỏi tên rồi gọi /create.
app.post("/api/login/google", route(async (req, res) => {
  const g = await googleGate(req, res, req.body?.credential);
  if (!g) return;
  const id = await store.accountByIdentity(GOOGLE, g.sub);
  if (id !== null) { await loginReply(res, id, await store.startSession(id)); return; }
  res.json({ needName: true, ticket: makeTicket(g.sub), suggest: cleanName(g.name).replace(/[^\p{L}\p{N}_ ]/gu, "").slice(0, 20) });
}));

// Tạo tài khoản từ Google mới: tên nhân vật do người chơi chọn, qua cùng luật tên và giới hạn tạo tài khoản mới theo IP như /api/login.
app.post("/api/login/google/create", route(async (req, res) => {
  if (!googleEnabled()) { res.status(503).json({ error: "Máy chủ chưa bật đăng nhập Google." }); return; }
  const ip = req.ip ?? req.socket.remoteAddress ?? "?";
  const blocked = ssoCheck(ip);
  if (blocked) { res.setHeader("Retry-After", String(blocked.retryAfter)); res.status(429).json({ error: blocked.error }); return; }
  const sub = readTicket(req.body?.ticket);
  if (!sub) { res.status(401).json({ error: "Phiên đăng nhập Google hết hạn, hãy bấm đăng nhập Google lại." }); return; }
  const name = cleanName(String(req.body?.name ?? ""));
  if (!NAME_RE.test(name)) { res.status(400).json({ error: NAME_ERR }); return; }
  if (isReservedName(name)) { res.status(400).json({ error: RESERVED_ERR }); return; }
  const noSignup = signupBegin(ip);
  if (noSignup) { res.setHeader("Retry-After", String(noSignup.retryAfter)); res.status(429).json({ error: noSignup.error }); return; }
  let r: Awaited<ReturnType<typeof store.createIdentityAccount>>;
  try { r = await store.createIdentityAccount(name, GOOGLE, sub); } catch (e) { signupEnd(ip, true, false); throw e; }
  signupEnd(ip, true, !("error" in r));
  if ("error" in r) {
    if (r.error === "linked") { res.status(409).json({ error: "Tài khoản Google này đã có nhân vật, hãy đăng nhập Google lại." }); return; }
    res.status(409).json({ error: "Tên này đã có người dùng." }); return;
  }
  await loginReply(res, r.accountId, await store.startSession(r.accountId));
}));

// Liên kết Google với tài khoản đang đăng nhập (Cài đặt): một Google một tài khoản, một tài khoản tối đa một Google.
app.post("/api/link/google", route(async (req, res) => {
  // Giới hạn theo IP trước khi tra DB bằng token phiên (S5 báo cáo soát).
  if (!googleEnabled()) { res.status(503).json({ error: "Máy chủ chưa bật đăng nhập Google." }); return; }
  const blocked = ssoCheck(req.ip ?? req.socket.remoteAddress ?? "?");
  if (blocked) { res.setHeader("Retry-After", String(blocked.retryAfter)); res.status(429).json({ error: blocked.error }); return; }
  const acc = await store.accountFromToken(req.body?.token);
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const g = await verifyGateCredential(res, req.body?.credential);
  if (!g) return;
  const r = await store.linkIdentity(acc.accountId, GOOGLE, g.sub);
  if (r === "subject-taken") { res.status(409).json({ error: "Tài khoản Google này đã liên kết với nhân vật khác." }); return; }
  if (r === "has-provider") { res.status(409).json({ error: "Nhân vật này đã liên kết một tài khoản Google khác." }); return; }
  res.json({ ok: true, googleLinked: true });
}));

// Lấy nhân vật của phiên hiện tại: võ hồn ra trận (null = chưa thức tỉnh), ngoại hình (looks.chosen = đã tạo nhân vật)
// và bản đồ đang đứng (mapId, từ BĐ2): client truyền mapId này khi vào phòng để Colyseus ghép đúng bản đồ.
app.post("/api/me", route(async (req, res) => {
  if (!apiGate(req, res)) return;
  const acc = await store.accountFromToken(req.body?.token);
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const [character, looks, loc] = await Promise.all([store.getCharacter(acc.accountId), store.getLooks(acc.accountId), store.getLocation(acc.accountId)]);
  res.json({ character, looks, mapId: loc.mapId, googleLinked: await store.hasIdentity(acc.accountId, GOOGLE) });
}));

// Kênh để vào game (mục 6 "Nhiều kênh"): bản đồ đang lưu và phòng (kênh) nên vào: kênh còn chỗ có đồng đội tổ đội, không thì kênh
// ít người nhất còn chỗ. roomId null = mọi kênh đầy hoặc chưa có kênh: client joinOrCreate (Colyseus mở kênh mới).
app.post("/api/channel", route(async (req, res) => {
  if (!apiGate(req, res)) return;
  const acc = await store.accountFromToken(req.body?.token);
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const { mapId } = await store.getLocation(acc.accountId);
  res.json({ mapId, roomId: (await pickChannel(acc.accountId, mapId))?.roomId ?? null });
}));

// Tạo nhân vật (một lần, trước lễ thức tỉnh; tài khoản cũ chọn lại một lần): luật kiểm tra nằm trong MapRoom.ts.
app.post("/api/looks", route(async (req, res) => {
  if (!apiGate(req, res)) return;
  const acc = await store.accountFromToken(req.body?.token);
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const r = await chooseLooks(acc.accountId, req.body);
  if ("error" in r) { res.status(r.status).json({ error: r.error }); return; }
  res.json(r);
}));

// Hook test (chỉ GAME_TEST=1, HL2 #571): tạo tài khoản kiểu cũ (ngoại hình preset 5 số đã chọn) để bot thử chuyển sang LPC lúc nạp. /api/looks
// thật không còn tạo preset. Chỉ ghi được khi tài khoản chưa chọn ngoại hình (store.chooseLooks một lần).
if (process.env.GAME_TEST === "1") app.post("/api/test/legacy-looks", route(async (req, res) => {
  const acc = await store.accountFromToken(req.body?.token);
  const looks = parseLooks({ ...req.body, mode: "preset" });
  if (!acc || !looks) { res.status(400).json({ error: "token hoặc ngoại hình sai." }); return; }
  res.json({ ok: await store.chooseLooks(acc.accountId, looks) });
}));

// Lễ thức tỉnh (một lần): client gửi võ hồn SSR muốn chọn, luật kiểm tra nằm trong MapRoom.ts.
app.post("/api/awaken", route(async (req, res) => {
  if (!apiGate(req, res)) return;
  const acc = await store.accountFromToken(req.body?.token);
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const r = await awakenAccount(acc.accountId, acc.name, req.body?.vohon);
  if ("error" in r) { res.status(r.status).json({ error: r.error }); return; }
  res.json(r);
}));

// Lỗi trước khi vào route (JSON hỏng, body quá lớn): trả JSON ngắn thay vì trang lỗi mặc định của Express (có stack khi không đặt
// NODE_ENV=production).
app.use((err: { status?: number }, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(err);
  const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) console.error("Lỗi API:", err);
  res.status(status).json({ error: status === 413 ? "Dữ liệu gửi lên quá lớn." : status === 500 ? "Máy chủ gặp lỗi, vui lòng thử lại sau." : "Dữ liệu gửi lên không hợp lệ." });
});

// Khi deploy: phục vụ luôn bản build của client -> chỉ cần một đường link.
const dist = fileURLToPath(new URL("../../client/dist", import.meta.url));
if (existsSync(dist)) {
  // Chỉ để thử tải lỗi (#580): GAME_TEST=1 + ASSET_FAIL_RATE=0.3 trả 504 ngẫu nhiên cho 30% request ảnh / json / âm thanh, kiểm client thử lại.
  const failRate = process.env.GAME_TEST === "1" ? Math.min(1, Number(process.env.ASSET_FAIL_RATE) || 0) : 0;
  if (failRate > 0) app.use((req, res, next) => { if (/\.(png|json|ogg|m4a)$/.test(req.path) && Math.random() < failRate) { res.status(504).end(); return; } next(); });
  // Game ở /choi (landing ở "/", #656): phục vụ thẳng cả khi không có dấu gạch cuối (express.static chỉ chuyển hướng 301 sang /choi/); query (?thu=…, ?nopredict) giữ nguyên.
  app.get("/choi", (_q, res) => { res.setHeader("Cache-Control", "no-cache"); res.sendFile(path.join(dist, "choi", "index.html")); });
  // cacheControl: false để setHeaders đặt theo loại file (staticCache.ts); ETag / Last-Modified của express.static giữ nguyên.
  app.use(express.static(dist, {
    cacheControl: false,
    setHeaders: (res, file) => {
      const rel = "/" + path.relative(dist, file).split(path.sep).join("/");
      res.setHeader("Cache-Control", cacheControlFor(rel, typeof (res.req as express.Request).query.v === "string"));
    },
  }));
}

const server = http.createServer(app);
// Một tiến trình dùng LocalPresence và bộ nhớ. Khi có REDIS_URL, pub/sub + registry phòng dùng Redis để nhiều tiến trình nhìn thấy nhau.
const driver = presenceBackend.mode === "redis" ? new RedisDriver(process.env.REDIS_URL) : undefined;
if (driver) guardClient("Redis (registry phòng)", (driver as unknown as { _client: Parameters<typeof guardClient>[1] })._client);
// PUBLIC_ADDRESS (mỗi tiến trình một địa chỉ client tới được, vd "game.example.com/2567"): phòng mở ở tiến trình khác thì chỗ giữ mang địa chỉ này để
// client mở WebSocket đúng tiến trình giữ phòng (không đặt thì phòng ở tiến trình khác không vào được). Sân đấu luôn mở ở tiến trình ghép trận vì
// `arenaMatches` (arenaQueue.ts) là bộ nhớ của tiến trình đó; phòng khác giữ cách chọn mặc định của Colyseus (tiến trình ít phòng nhất).
const publicAddress = process.env.PUBLIC_ADDRESS?.trim() || undefined;
// gracefullyShutdown: false: Colyseus không tự gắn uncaughtException / tín hiệu tắt; việc tắt server chỉ do `shutdown` dưới đây (#270).
const gameServer = new Server({ transport: new WebSocketTransport({ server, maxPayload: MSG_MAX_PAYLOAD }), presence: gamePresence, gracefullyShutdown: false, ...(driver ? { driver } : {}), ...(publicAddress ? { publicAddress } : {}),
  selectProcessIdToCreateRoom: async (roomName) => roomName === "arena"
    ? matchMaker.processId
    : (await matchMaker.stats.fetchAll()).sort((a, b) => a.roomCount > b.roomCount ? 1 : -1)[0]?.processId || matchMaker.processId });
// Mọi bản đồ dùng chung một loại phòng; Colyseus ghép người cùng mapId vào chung phòng, phòng đầy thì mở kênh mới. Client thường
// vào thẳng kênh do /api/channel hoặc tin `travel` chọn (joinById); joinOrCreate chỉ là dự phòng khi kênh đó vừa đầy / vừa đóng.
// MapRoom / ArenaRoom có cả `static onAuth` (kiểm token trước khi giữ chỗ, #235) lẫn onAuth của phòng: Colyseus in dòng "onAuth() defined
// at the instance level will be ignored", nhưng _reserveSeat của phòng bỏ authData nên onAuth của phòng vẫn chạy lúc mở WebSocket.
gameServer.define("map", MapRoom).filterBy(["mapId"]);
// Đại Đấu Hồn Trường (7.2): mỗi trận một phòng riêng, server mở khi ghép trận (arenaQueue.ts); client vào bằng mã phòng (joinById).
gameServer.define("arena", ArenaRoom);
// Client không gọi được `create` (mặc định Colyseus mở cho mọi người, kể cả chưa đăng nhập): mở phòng bản đồ mới chỉ qua
// joinOrCreate khi mọi kênh đầy, sân đấu chỉ do server mở (arenaQueue.ts, matchMaker.createRoom). Chặn tự mở kênh riêng (#164);
// joinOrCreate / joinById kiểm token ở static onAuth trước khi giữ chỗ / mở kênh (#235).
matchMaker.controller.exposedMethods = ["joinOrCreate", "join", "joinById", "reconnect"];

/** Hạn giờ khi tắt server (ms): lưu người chơi đang online (rời mọi phòng), rồi đóng kết nối PostgreSQL. Tổng dưới 10 giây chờ của
 *  `docker stop` mặc định. */
const SHUTDOWN_SAVE_MS = 6000, SHUTDOWN_DB_MS = 2000;
let stopping: Promise<void> | null = null, exitCode = 0;
/** Chờ `p` tối đa `ms` mili giây; quá giờ hoặc lỗi thì ghi log rồi đi tiếp (đang tắt server, không chờ mãi). */
const within = async (what: string, p: () => Promise<unknown>, ms: number) => {
  let timer: NodeJS.Timeout | undefined;
  const late = new Promise<"late">((r) => { timer = setTimeout(() => r("late"), ms); });
  const r = await Promise.race([p().then(() => "ok" as const, (e) => { console.error(`${what}: lỗi`, e); return "err" as const; }), late]);
  clearTimeout(timer);
  if (r === "late") console.error(`${what}: quá ${ms} ms, bỏ qua.`);
  return r === "ok";
};
/**
 * Tắt server có kiểm soát (một lần): rời mọi phòng như khi người chơi thoát (onLeave / onDispose của MapRoom ghi lần cuối qua chuỗi lưu
 * this.chain), đóng PostgreSQL, rồi process.exit để trình quản lý tiến trình (pm2, nền tảng deploy) khởi động lại khi mã ≠ 0. Gọi lại
 * trong lúc đang tắt chỉ nâng mã thoát (lỗi nghiêm trọng giữa lúc tắt vì tín hiệu vẫn thoát 1).
 */
function shutdown(code: number, why: string) {
  exitCode = Math.max(exitCode, code);
  stopping ??= (async () => {
    let last = "";
    try {
      const { local } = matchMaker.stats, failed0 = saveStats.failed;
      console.error(`Đang tắt server (${why}): lưu ${local.ccu} người chơi đang online, hạn ${SHUTDOWN_SAVE_MS} ms…`);
      await within("Lưu người chơi đang online", () => gameServer.gracefullyShutdown(false), SHUTDOWN_SAVE_MS);
      // Colyseus tự bắt lỗi giữa chừng (in log) rồi vẫn trả về, nên xét theo số người còn trong phòng (ccu chỉ giảm sau khi onLeave, lần
      // ghi cuối, xong) và số lần ghi lỗi trong lúc tắt (chuỗi lưu chỉ ghi log lỗi). Phòng còn chỗ đặt trước chưa dùng chỉ đóng khi chỗ đó
      // hết hạn: không còn người nên không còn gì để lưu.
      const failed = saveStats.failed - failed0, saved = local.ccu <= 0 && !failed;
      if (!saved) exitCode = Math.max(exitCode, 1); // tắt vì tín hiệu mà chưa lưu xong cũng báo mã ≠ 0
      const closed = await within("Đóng kết nối PostgreSQL", () => store.close(), SHUTDOWN_DB_MS);
      last = `Tắt server: ${saved ? "đã lưu người chơi đang online" : `CHƯA lưu xong người chơi đang online (còn ${local.ccu} người, ${failed} lần lưu lỗi)`}, `
        + `${closed ? "đã đóng" : "chưa đóng"} kết nối DB; thoát mã ${exitCode}.\n`;
    } finally {
      // Thoát sau khi dòng cuối đã ghi ra (stderr là pipe thì ghi bất đồng bộ); lỗi bất ngờ ngay trong lúc tắt cũng không để tiến trình treo.
      const exit = () => process.exit(exitCode);
      setTimeout(exit, 500);
      process.stderr.write(last, exit);
    }
  })();
}
/**
 * Lỗi bất ngờ ngoài mọi phòng (hẹn giờ / callback của Node, promise bị từ chối không ai bắt): ghi log đầy đủ rồi thoát có kiểm soát,
 * không nuốt lỗi chạy tiếp (trạng thái tiến trình có thể đã hỏng). Lỗi ném ngay trong handler / hẹn giờ clock / tick của phòng do
 * MapRoom.onUncaughtException xử lý (phòng chạy tiếp) nên không tới đây; lỗi trong phần chạy sau một promise của phòng (`.then` sau chuỗi
 * lưu, callback presence) thì nằm ngoài lớp chặn đó và tới đây. @pm2/io (phụ thuộc gián tiếp của @colyseus/core, nạp động
 * trong `new Server` qua matchMaker.setup) cũng gắn handler hai sự kiện này, thường trước handler ở đây: nó chỉ in lại lỗi, không tự thoát
 * vì đã có handler khác (`uncaughtException` của nó chỉ process.exit(1) khi là listener duy nhất, tức lúc đang khởi động, chưa có ai để lưu).
 */
function fatal(kind: string, err: unknown) {
  // Lỗi kết nối Redis từ một lệnh chạy nền không ai bắt (#561): Redis mất không phải lỗi hỏng trạng thái tiến trình. Ghi log rõ rồi chạy tiếp ở chế độ
  // không phục vụ (/health 503, từ chối vào phòng mới); phiên mất lease tự bị đóng. Mọi lỗi khác vẫn thoát có kiểm soát như trước.
  if (!stopping && presenceBackend.mode === "redis" && isRedisFailure(err)) {
    console.error(`Lỗi Redis không ai bắt (${kind}), bỏ qua, tiến trình vẫn chạy (kiểm lệnh presence thiếu bg / catch):`, err);
    return;
  }
  console.error(`Lỗi nghiêm trọng ngoài phòng (${kind})${stopping ? " trong lúc đang tắt server" : ""}:`, err);
  shutdown(1, kind);
}

// Nạp sẵn mọi bản đồ: thiếu file thì dừng ngay, object sai (cổng, loài) thì cảnh báo lúc khởi động thay vì lúc có người vào.
for (const id of Object.keys(MAPS)) loadMap(id);
await store.init();
// Dọn phiên đăng nhập quá hạn mỗi giờ (#736); lỗi DB chỉ ghi log, không để rơi thành unhandledRejection.
setInterval(() => { store.pruneSessions().catch((e) => console.warn("Dọn phiên lỗi:", (e as Error).message)); }, 3_600_000).unref();
// Gắn sau khi nạp bản đồ / DB: lỗi lúc khởi động vẫn dừng ngay với lỗi gốc của Node (chưa có ai để lưu), trước khi server nhận kết nối.
process.on("uncaughtException", (err, origin) => fatal(origin, err));
process.on("unhandledRejection", (reason) => fatal("unhandledRejection", reason));
// Tắt bình thường (Ctrl+C, nền tảng deploy dừng / khởi động lại, nodemon): lưu như trên rồi thoát mã 0. Tín hiệu lặp lại trong lúc đang
// tắt không cắt ngang lần lưu (process.on, không once); tối đa SHUTDOWN_SAVE_MS + SHUTDOWN_DB_MS.
for (const sig of ["SIGINT", "SIGTERM", "SIGUSR2"] as const) process.on(sig, () => shutdown(0, sig));
await gameServer.listen(PORT);
// Lịch tà hóa thú vương 20:00 / 22:00 giờ Việt Nam (BĐ5): báo toàn server trước 5 phút, phòng của bản đồ đó sinh thú vương.
startSchedule(gamePresence, presenceBackend);
console.log(`🌲 Server Rừng Săn Hồn chạy tại http://localhost:${PORT} (${presenceBackend.mode === "redis" ? "RedisPresence" : "RAM presence"})`);
