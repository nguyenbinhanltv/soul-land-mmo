import http from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server, LocalPresence } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MapRoom, awakenAccount, chooseLooks, pickChannel, CHANNEL_CAP } from "./rooms/MapRoom.ts";
import { store } from "./db.ts";
import { loginBegin, loginEnd } from "./ratelimit.ts";
import { cleanName } from "./names.ts";
import { loadMap } from "./map.ts";
import { startSchedule } from "./schedule.ts";
import { MAPS } from "../../shared/data.ts";

const PORT = Number(process.env.PORT ?? 2567);
const app = express();
// Sau proxy của nền tảng deploy (Render, Railway, Fly.io…): đặt TRUST_PROXY=1 để lấy đúng IP người chơi cho rate limit.
if (process.env.TRUST_PROXY) app.set("trust proxy", /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
app.use(express.json({ limit: "10kb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN ?? "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

// chMax: số người tối đa mỗi kênh (bot đọc để biết server đang hạ CHANNEL_MAX cho phần thử nhiều kênh).
app.get("/health", (_q, r) => { r.json({ ok: true, chMax: CHANNEL_CAP }); });

// Đăng nhập (tự tạo tài khoản nếu tên chưa tồn tại).
app.post("/api/login", async (req, res) => {
  // Tên hiển thị sau NFKC (names.ts); store và rate limit tự so sánh theo nameKey(name).
  const name = cleanName(String(req.body?.name ?? "")), password = String(req.body?.password ?? "");
  if (!/^[\p{L}\p{N}_ ]{3,20}$/u.test(name)) { res.status(400).json({ error: "Tên 3–20 ký tự, chỉ gồm chữ, số, dấu cách hoặc _." }); return; }
  if (password.length < 4) { res.status(400).json({ error: "Mật khẩu tối thiểu 4 ký tự." }); return; }
  // Giới hạn số lần sai theo tên và theo IP (server/src/ratelimit.ts).
  const ip = req.ip ?? req.socket.remoteAddress ?? "?";
  const blocked = loginBegin(name, ip);
  if (blocked) { res.setHeader("Retry-After", String(blocked.retryAfter)); res.status(429).json({ error: blocked.error }); return; }
  let r: Awaited<ReturnType<typeof store.login>>;
  try { r = await store.login(name, password); } catch (e) { loginEnd(name, ip, null); throw e; }
  const fail = loginEnd(name, ip, !("error" in r));
  if (fail || "error" in r) {
    if (fail?.retryAfter) res.setHeader("Retry-After", String(fail.retryAfter));
    res.status(fail?.retryAfter ? 429 : 401).json({ error: fail?.error ?? "Tên đăng nhập hoặc mật khẩu không đúng." }); return;
  }
  const [character, looks, loc] = await Promise.all([store.getCharacter(r.accountId), store.getLooks(r.accountId), store.getLocation(r.accountId)]);
  res.json({ token: r.token, character, looks, mapId: loc.mapId });
});

// Lấy nhân vật của phiên hiện tại: võ hồn ra trận (null = chưa thức tỉnh), ngoại hình (looks.chosen = đã tạo nhân vật)
// và bản đồ đang đứng (mapId, từ BĐ2): client truyền mapId này khi vào phòng để Colyseus ghép đúng bản đồ.
app.post("/api/me", async (req, res) => {
  const acc = await store.accountFromToken(String(req.body?.token ?? ""));
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const [character, looks, loc] = await Promise.all([store.getCharacter(acc.accountId), store.getLooks(acc.accountId), store.getLocation(acc.accountId)]);
  res.json({ character, looks, mapId: loc.mapId });
});

// Kênh để vào game (mục 6 "Nhiều kênh"): bản đồ đang lưu và phòng (kênh) nên vào: kênh còn chỗ có đồng đội tổ đội, không thì kênh
// ít người nhất còn chỗ. roomId null = mọi kênh đầy hoặc chưa có kênh: client joinOrCreate (Colyseus mở kênh mới).
app.post("/api/channel", async (req, res) => {
  const acc = await store.accountFromToken(String(req.body?.token ?? ""));
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const { mapId } = await store.getLocation(acc.accountId);
  res.json({ mapId, roomId: (await pickChannel(acc.accountId, mapId))?.roomId ?? null });
});

// Tạo nhân vật (một lần, trước lễ thức tỉnh; tài khoản cũ chọn lại một lần): luật kiểm tra nằm trong MapRoom.ts.
app.post("/api/looks", async (req, res) => {
  const acc = await store.accountFromToken(String(req.body?.token ?? ""));
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const r = await chooseLooks(acc.accountId, req.body);
  if ("error" in r) { res.status(r.status).json({ error: r.error }); return; }
  res.json(r);
});

// Lễ thức tỉnh (một lần): client gửi võ hồn SSR muốn chọn, luật kiểm tra nằm trong MapRoom.ts.
app.post("/api/awaken", async (req, res) => {
  const acc = await store.accountFromToken(String(req.body?.token ?? ""));
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const r = await awakenAccount(acc.accountId, acc.name, req.body?.vohon);
  if ("error" in r) { res.status(r.status).json({ error: r.error }); return; }
  res.json(r);
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

// Nạp sẵn mọi bản đồ: thiếu file thì dừng ngay, object sai (cổng, loài) thì cảnh báo lúc khởi động thay vì lúc có người vào.
for (const id of Object.keys(MAPS)) loadMap(id);
await store.init();
await gameServer.listen(PORT);
// Lịch tà hóa thú vương 20:00 / 22:00 giờ Việt Nam (BĐ5): báo toàn server trước 5 phút, phòng của bản đồ đó sinh thú vương.
startSchedule(presence);
console.log(`🌲 Server Rừng Săn Hồn chạy tại http://localhost:${PORT}`);
