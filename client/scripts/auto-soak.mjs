// Đo tải tự săn (Auto 1, mục 5.13): N bot rải đều trên một bản đồ săn, bật tự săn (MODE=auto, mặc định) hoặc đi lang thang bằng input
// như 11.4 (MODE=walk, để so), giữ SECS giây rồi thoát. Server bật `GAME_TEST=1 PERF_LOG=1` (hook warp / goto / set, log [perf] tick /
// bản vá mỗi 10 giây). Bản đồ mặc định là bản ×8 (11.5); bật đường lùi `MAP_V1` ở server thì chạy script với cùng `MAP_V1`.
//   GAME_TEST=1 PERF_LOG=1 PORT=2600 npm run dev:server
//   N=40 SECS=90 SERVER_URL=http://localhost:2600 node scripts/auto-soak.mjs
// In: số bot đang tự săn, số hồn thú hạ, số lần tự săn dừng theo lý do, số KB bản vá / tin mỗi client mỗi giây.
import { Client } from "colyseus.js";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { solidGrid, hits, PLAYER_HW, PLAYER_HH } from "../../shared/move.ts";
import { AUTO_RADIUS, AWAKEN_CHOICES, SYNC_VIEW, TILE } from "../../shared/data.ts";

const API = process.env.SERVER_URL ?? "http://localhost:2567", WS = API.replace(/^http/, "ws");
const N = Math.max(1, Number(process.env.N) || 20), SECS = Math.max(10, Number(process.env.SECS) || 60), MODE = process.env.MODE === "walk" ? "walk" : "auto";
const MAP = process.env.MAP ?? "tinh_dau_ngoai_vi";
const V1 = new Set((process.env.MAP_V1 ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const file = !(V1.has(MAP) || V1.has("all")) && existsSync(new URL(`../../shared/assets/${MAP}.v2.json`, import.meta.url)) ? `${MAP}.v2` : MAP;
const raw = JSON.parse(readFileSync(new URL(`../../shared/assets/${file}.json`, import.meta.url), "utf8")), grid = solidGrid(raw);
const objs = raw.layers.flatMap((l) => l.objects ?? []);
const keepOut = objs.filter((o) => ["spawn", "portal", "safe", "boss", "waypoint"].includes(o.type));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (fn, ms = 3000) => { for (let t = 0; t < ms; t += 50) { if (fn()) return true; await sleep(50); } return false; };
const post = async (p, b) => (await fetch(API + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).json();
const PASS = randomUUID(), RUN = Date.now().toString(36).slice(-5);

/** Điểm neo rải đều: lưới ô cách nhau ít nhất 2 ô lưới đồng bộ, đứng được, xa trại / cổng / hang. */
function anchors(n) {
  const out = [], W = grid.MW * TILE, H = grid.MH * TILE, gap = SYNC_VIEW.cell * 2;
  const ok = (x, y) => !hits(grid, x, y, PLAYER_HW + 2, PLAYER_HH + 2) && !keepOut.some((o) => x > o.x - 96 && x < o.x + o.width + 96 && y > o.y - 96 && y < o.y + o.height + 96);
  for (let tries = 0; out.length < n && tries < 20000; tries++) {
    const x = 32 + Math.random() * (W - 64), y = 32 + Math.random() * (H - 64);
    if (ok(x, y) && out.every((a) => Math.hypot(a.x - x, a.y - y) > gap)) out.push({ x: Math.round(x), y: Math.round(y) });
  }
  return out;
}

async function join(b) {
  const me = await post("/api/me", { token: b.token });
  b.room = await new Client(WS).joinOrCreate("map", { token: b.token, mapId: me.mapId });
  b.bytes = 0; b.room.connection.transport?.ws?.addEventListener?.("message", (e) => { b.bytes += e.data?.byteLength ?? e.data?.length ?? 0; });
  b.test = null; b.room.onMessage("test", (m) => { b.test = m; });
  b.auto = null; b.room.onMessage("auto", (m) => { b.auto = m; if (!m.on && m.why) stops.set(m.why, (stops.get(m.why) ?? 0) + 1); });
  for (const t of ["log", "chat", "fx", "dmg", "mini", "vohons", "squad", "bag", "party", "quest", "daily", "resonance", "portal", "wp", "elite", "boss", "ko", "absorbing"])
    b.room.onMessage(t, () => {});
  b.room.onMessage("travel", (m) => { b.travel = m; });
}
const hook = async (b, op, extra = {}) => { b.test = null; b.room.send("test", { op, ...extra }); await waitFor(() => b.test, 3000); return b.test; };
const stops = new Map();

async function makeBot(i, at) {
  const b = { name: `Soak ${MODE} ${i} ${RUN}` };
  const l = await post("/api/login", { name: b.name, password: PASS }); b.token = l.token;
  await post("/api/looks", { token: b.token, sex: i % 2, hair: i % 4, hairCol: i % 6, outfitCol: (i + 2) % 6 });
  await post("/api/awaken", { token: b.token, vohon: AWAKEN_CHOICES[i % AWAKEN_CHOICES.length].id });
  await join(b);
  if (!(await hook(b, "ping"))?.enabled) throw new Error("Server chưa bật GAME_TEST=1");
  b.travel = null; b.room.send("test", { op: "warp", mapId: MAP, x: at.x, y: at.y });
  await waitFor(() => b.travel, 5000); await b.room.leave(); await sleep(200); await join(b);
  await waitFor(() => b.room.state.players?.get(b.room.sessionId), 3000);
  // Võ hồn ra trận cấp 30, 3 hồn hoàn để bãi săn không quá khó (bot ít gục, tự săn chạy đủ thời gian đo).
  const v = await hook(b, "stats"); if (v?.rowId) await hook(b, "set", { rowId: v.rowId, level: 30, rings: [600, 1200, 2400] });
  b.at = at;
  return b;
}

const spots = anchors(N);
console.log(`[soak] ${N} bot, ${MODE}, ${SECS} giây, bản đồ ${file} (${grid.MW}×${grid.MH} ô), ${spots.length} điểm neo, bán kính tự săn ${AUTO_RADIUS} pixel`);
const bots = [];
for (let i = 0; i < spots.length; i++) bots.push(await makeBot(i, spots[i]));
const me = (b) => b.room.state.players?.get(b.room.sessionId);
const kills0 = bots.map((b) => me(b)?.kills ?? 0);
for (const b of bots) b.bytes = 0;
const t0 = Date.now();
let samples = 0, autoSum = 0;
while (Date.now() - t0 < SECS * 1000) {
  for (const b of bots) {
    const p = me(b); if (!p || p.dead) continue;
    if (MODE === "auto") {
      // Tự săn dừng (gục, túi đầy…): về điểm neo rồi bật lại, như người chơi quay lại treo tiếp.
      if (!p.auto) { b.room.send("test", { op: "goto", x: b.at.x, y: b.at.y }); b.room.send("auto", { op: "on" }); }
    } else if (Math.random() < 0.3) {
      const a = Math.random() * Math.PI * 2, back = Math.hypot(p.x - b.at.x, p.y - b.at.y) > AUTO_RADIUS;
      const dx = back ? b.at.x - p.x : Math.cos(a), dy = back ? b.at.y - p.y : Math.sin(a), d = Math.hypot(dx, dy) || 1;
      b.room.send("input", { x: dx / d, y: dy / d });
    }
  }
  await sleep(1000);
  samples++; autoSum += bots.filter((b) => me(b)?.auto).length;
}
const secs = (Date.now() - t0) / 1000, kills = bots.reduce((s, b, i) => s + (me(b)?.kills ?? 0) - kills0[i], 0);
const kb = bots.reduce((s, b) => s + b.bytes, 0) / bots.length / 1024 / secs;
console.log(`[soak] ${secs.toFixed(0)} giây: trung bình ${(autoSum / Math.max(1, samples)).toFixed(1)}/${bots.length} bot đang tự săn, ${kills} hồn thú bị hạ, ` +
  `${kb ? kb.toFixed(1) + " KB/s nhận mỗi client" : "không đo được số byte"}`);
if (stops.size) console.log(`[soak] tự săn dừng: ${[...stops].map(([k, v]) => `${k} ×${v}`).join(", ")}`);
for (const b of bots) await b.room.leave().catch(() => {});
process.exit(0);
