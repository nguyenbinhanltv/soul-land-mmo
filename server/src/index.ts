import http from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server, LocalPresence, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MapRoom, awakenAccount, chooseLooks, pickChannel, CHANNEL_CAP } from "./rooms/MapRoom.ts";
import { ArenaRoom } from "./rooms/ArenaRoom.ts";
import { store } from "./db.ts";
import { loginBegin, loginEnd, signupBegin, signupEnd } from "./ratelimit.ts";
import { cleanName } from "./names.ts";
import { loadMap } from "./map.ts";
import { startSchedule } from "./schedule.ts";
import { MAPS } from "../../shared/data.ts";

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
app.get("/health", (_q, r) => { r.json({ ok: true, chMax: CHANNEL_CAP }); });

// Đăng nhập (tự tạo tài khoản nếu tên chưa tồn tại).
app.post("/api/login", route(async (req, res) => {
  // Tên hiển thị sau NFKC (names.ts); store và rate limit tự so sánh theo nameKey(name).
  const name = cleanName(String(req.body?.name ?? "")), password = String(req.body?.password ?? "");
  if (!/^[\p{L}\p{N}_ ]{3,20}$/u.test(name)) { res.status(400).json({ error: "Tên 3–20 ký tự, chỉ gồm chữ, số, dấu cách hoặc _." }); return; }
  if (password.length < 4) { res.status(400).json({ error: "Mật khẩu tối thiểu 4 ký tự." }); return; }
  // Giới hạn số lần sai theo tên và theo IP (server/src/ratelimit.ts).
  const ip = req.ip ?? req.socket.remoteAddress ?? "?";
  const blocked = loginBegin(name, ip);
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

// Lấy nhân vật của phiên hiện tại: võ hồn ra trận (null = chưa thức tỉnh), ngoại hình (looks.chosen = đã tạo nhân vật)
// và bản đồ đang đứng (mapId, từ BĐ2): client truyền mapId này khi vào phòng để Colyseus ghép đúng bản đồ.
app.post("/api/me", route(async (req, res) => {
  const acc = await store.accountFromToken(req.body?.token);
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const [character, looks, loc] = await Promise.all([store.getCharacter(acc.accountId), store.getLooks(acc.accountId), store.getLocation(acc.accountId)]);
  res.json({ character, looks, mapId: loc.mapId });
}));

// Kênh để vào game (mục 6 "Nhiều kênh"): bản đồ đang lưu và phòng (kênh) nên vào: kênh còn chỗ có đồng đội tổ đội, không thì kênh
// ít người nhất còn chỗ. roomId null = mọi kênh đầy hoặc chưa có kênh: client joinOrCreate (Colyseus mở kênh mới).
app.post("/api/channel", route(async (req, res) => {
  const acc = await store.accountFromToken(req.body?.token);
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const { mapId } = await store.getLocation(acc.accountId);
  res.json({ mapId, roomId: (await pickChannel(acc.accountId, mapId))?.roomId ?? null });
}));

// Tạo nhân vật (một lần, trước lễ thức tỉnh; tài khoản cũ chọn lại một lần): luật kiểm tra nằm trong MapRoom.ts.
app.post("/api/looks", route(async (req, res) => {
  const acc = await store.accountFromToken(req.body?.token);
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const r = await chooseLooks(acc.accountId, req.body);
  if ("error" in r) { res.status(r.status).json({ error: r.error }); return; }
  res.json(r);
}));

// Lễ thức tỉnh (một lần): client gửi võ hồn SSR muốn chọn, luật kiểm tra nằm trong MapRoom.ts.
app.post("/api/awaken", route(async (req, res) => {
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
if (existsSync(dist)) app.use(express.static(dist));

const server = http.createServer(app);
// Presence trong bộ nhớ (một tiến trình): đá phiên trùng, thông báo toàn server và lịch boss (mục 6). Nhiều tiến trình thì RedisPresence.
const presence = new LocalPresence();
const gameServer = new Server({ transport: new WebSocketTransport({ server }), presence });
// Mọi bản đồ dùng chung một loại phòng; Colyseus ghép người cùng mapId vào chung phòng, phòng đầy thì mở kênh mới. Client thường
// vào thẳng kênh do /api/channel hoặc tin `travel` chọn (joinById); joinOrCreate chỉ là dự phòng khi kênh đó vừa đầy / vừa đóng.
gameServer.define("map", MapRoom).filterBy(["mapId"]);
// Đại Đấu Hồn Trường (7.2): mỗi trận một phòng riêng, server mở khi ghép trận (arenaQueue.ts); client vào bằng mã phòng (joinById).
gameServer.define("arena", ArenaRoom);
// Client không gọi được `create` (mặc định Colyseus mở cho mọi người, kể cả chưa đăng nhập): mở phòng bản đồ mới chỉ qua
// joinOrCreate khi mọi kênh đầy, sân đấu chỉ do server mở (arenaQueue.ts, matchMaker.createRoom). Chặn tự mở kênh riêng (#164); còn
// joinOrCreate / joinById giữ chỗ trước khi kiểm token: #235.
matchMaker.controller.exposedMethods = ["joinOrCreate", "join", "joinById", "reconnect"];

// Nạp sẵn mọi bản đồ: thiếu file thì dừng ngay, object sai (cổng, loài) thì cảnh báo lúc khởi động thay vì lúc có người vào.
for (const id of Object.keys(MAPS)) loadMap(id);
await store.init();
await gameServer.listen(PORT);
// Lịch tà hóa thú vương 20:00 / 22:00 giờ Việt Nam (BĐ5): báo toàn server trước 5 phút, phòng của bản đồ đó sinh thú vương.
startSchedule(presence);
console.log(`🌲 Server Rừng Săn Hồn chạy tại http://localhost:${PORT}`);
