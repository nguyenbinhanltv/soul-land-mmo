import http from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MapRoom, awakenAccount } from "./rooms/MapRoom.ts";
import { store } from "./db.ts";
import { loginBegin, loginEnd } from "./ratelimit.ts";
import { cleanName } from "./names.ts";

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

app.get("/health", (_q, r) => { r.json({ ok: true }); });

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
  res.json({ token: r.token, character: await store.getCharacter(r.accountId) });
});

// Lấy nhân vật của phiên hiện tại.
app.post("/api/me", async (req, res) => {
  const acc = await store.accountFromToken(String(req.body?.token ?? ""));
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  res.json({ character: await store.getCharacter(acc.accountId) });
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
const gameServer = new Server({ transport: new WebSocketTransport({ server }) });
// Mọi bản đồ dùng chung một loại phòng; Colyseus ghép người cùng mapId vào chung phòng, phòng đầy thì mở kênh mới.
gameServer.define("map", MapRoom).filterBy(["mapId"]);

await store.init();
await gameServer.listen(PORT);
console.log(`🌲 Server Rừng Săn Hồn chạy tại http://localhost:${PORT}`);
