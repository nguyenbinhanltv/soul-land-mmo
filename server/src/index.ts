import http from "node:http";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ForestRoom } from "./rooms/ForestRoom.ts";
import { store } from "./db.ts";
import { VOHON } from "../../shared/data.ts";

const PORT = Number(process.env.PORT ?? 2567);
const app = express();
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
  const name = String(req.body?.name ?? "").trim(), password = String(req.body?.password ?? "");
  if (!/^[\p{L}\p{N}_ ]{3,20}$/u.test(name)) { res.status(400).json({ error: "Tên 3–20 ký tự, chỉ gồm chữ, số, dấu cách hoặc _." }); return; }
  if (password.length < 4) { res.status(400).json({ error: "Mật khẩu tối thiểu 4 ký tự." }); return; }
  const r = await store.login(name, password);
  if ("error" in r) { res.status(401).json(r); return; }
  res.json({ token: r.token, character: await store.getCharacter(r.accountId) });
});

// Lấy nhân vật của phiên hiện tại.
app.post("/api/me", async (req, res) => {
  const acc = await store.accountFromToken(String(req.body?.token ?? ""));
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  res.json({ character: await store.getCharacter(acc.accountId) });
});

// Thức tỉnh võ hồn: server tự roll để người chơi không gian lận được.
app.post("/api/awaken", async (req, res) => {
  const acc = await store.accountFromToken(String(req.body?.token ?? ""));
  if (!acc) { res.status(401).json({ error: "Phiên đăng nhập hết hạn." }); return; }
  const cur = await store.getCharacter(acc.accountId);
  if (cur && !req.body?.reset) { res.json({ character: cur }); return; }
  // Tạm thời (đến bước 2.2): ngẫu nhiên 1 võ hồn SSR. Hồn lực bẩm sinh 1–10 làm cấp khởi đầu.
  const pool = VOHON.filter((v) => v.rarity === "SSR");
  const vohon = pool[Math.floor(Math.random() * pool.length)].id;
  const level = Math.random() < 0.04 ? 10 : 1 + Math.floor(Math.pow(Math.random(), 1.6) * 9);
  res.json({ character: await store.awaken(acc.accountId, acc.name, vohon, level) });
});

// Khi deploy: phục vụ luôn bản build của client -> chỉ cần một đường link.
const dist = fileURLToPath(new URL("../../client/dist", import.meta.url));
if (existsSync(dist)) app.use(express.static(dist));

const server = http.createServer(app);
const gameServer = new Server({ transport: new WebSocketTransport({ server }) });
gameServer.define("forest", ForestRoom);

await store.init();
await gameServer.listen(PORT);
console.log(`🌲 Server Rừng Săn Hồn chạy tại http://localhost:${PORT}`);
