// Nhóm bot "pathflow" (L1 #1659; BOT_ONLY=pathflow): bài ĐO luồng đường đi trên bản đồ săn, không phải cổng chặn CI.
// Bot đứng ở trại hồi sinh, đi tới từng mốc (truyền tống trận, cổng, tinh anh, hang thú vương) bằng đúng đường client dùng để tự đi
// (findLongPath, shared/path.ts) và lái hướng bằng `input` như người bấm phím (có lách góc), rồi ghi: số giây, số lần đứng yên > 1 giây
// (đoạn đứng yên liên tiếp tính một lần), số lần tính lại đường, và kẹt thật (không tiến thêm AUTOWALK.stuckSecs giây).
// In bảng từng tuyến + tổng mỗi bản đồ + một dòng `PATHFLOW_JSON {...}` để dán / so baseline trước và sau khi sửa bản đồ (L2, L3, L5).
// Cố định: cùng bản đồ, cùng trại, cùng thứ tự mốc, hồn thú dọn sạch trước mỗi tuyến (không giao chiến) nên hai lượt cho số gần giống nhau.
// Biến: PF_MAPS (mã bản đồ cách nhau dấu phẩy; mặc định Ngoại vi, Nội địa, Lạc Nhật), PF_MIN_TILES (bỏ mốc gần trại hơn số ô này, mặc định 10).
import { readFileSync } from "node:fs";
import { solidGrid, hits, PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { findLongPath, buildNav, pathLength } from "../../../shared/path.ts";
import { sleep, waitFor, ok, mapUrl, bot, enter, test, needHookSkip } from "./lib.mjs";
import { MAPS, TILE, AUTO_MOVE, AUTOWALK, TICK_RATE } from "../../../shared/data.ts";

const DEFAULT_MAPS = ["tinh_dau_ngoai_vi", "tinh_dau_noi_dia", "lac_nhat_sam_lam"];
const KIND_NAME = { waypoint: "truyền tống", portal: "cổng", elite: "tinh anh", boss: "hang" };
const MOVE_PX = 3;       // dịch ít hơn số này kể từ mốc chuyển động gần nhất thì tính là đứng yên
const IDLE_MS = 1000;    // đứng yên quá ngưỡng này là một lần "đứng yên > 1 giây"
const f1 = (n) => n.toFixed(1);

/** Mốc của bản đồ từ file Tiled: [{ kind, name, x, y }] theo thứ tự cố định (loại rồi tên). */
function landmarksOf(mapId) {
  const raw = JSON.parse(readFileSync(mapUrl(mapId), "utf8")), objs = raw.layers.flatMap((l) => l.objects ?? []);
  const spawn = objs.find((o) => o.type === "spawn");
  const c = (o) => ({ x: o.x + (o.width ?? 0) / 2, y: o.y + (o.height ?? 0) / 2 });
  const order = ["waypoint", "portal", "elite", "boss"];
  const marks = objs.filter((o) => order.includes(o.type)).map((o) => ({ kind: o.type, name: o.name || o.type, ...c(o) }))
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.name.localeCompare(b.name, "vi"));
  return { raw, spawn: spawn ? c(spawn) : null, marks };
}

/** Điểm đứng được gần (x, y) nhất trong 4 ô, hộp hồn sư nới 1 px như clearLine (nếu chính nó đứng được thì giữ nguyên). */
function standNear(g, x, y) {
  const okAt = (px, py) => px > 0 && py > 0 && px < g.MW * TILE && py < g.MH * TILE && !hits(g, px, py, PLAYER_HW + 1, PLAYER_HH + 1);
  if (okAt(x, y)) return { x, y };
  let best = null, bd = Infinity;
  for (let dy = -4 * TILE; dy <= 4 * TILE; dy += 8) for (let dx = -4 * TILE; dx <= 4 * TILE; dx += 8) {
    const d = Math.hypot(dx, dy); if (d < bd && okAt(x + dx, y + dy)) { bd = d; best = { x: x + dx, y: y + dy }; }
  }
  return best;
}

/**
 * Đi tới `goal` như một lần "tự đi" của client (đường dài, lái hướng bằng input, kẹt 0,5 giây thì tính lại đường) và đo.
 * Trả { res: "arrived" | "stuck" | "none" | "timeout", secs, idle, idleSecs, repaths }.
 */
async function walkTo(T, g, nv, goal, maxMs) {
  const me = () => T.room.state.players.get(T.room.sessionId);
  const near = () => Math.max(3, me().spd * (1 / TICK_RATE + 0.05)), want = AUTOWALK.arrive * TILE;
  const t0 = Date.now();
  let idle = 0, idleMs = 0, repaths = -1, inIdle = false, anchor = { x: me().x, y: me().y, t: t0 };
  let best = Infinity, bestT = t0, res = "timeout";
  // Ghi chuyển động mỗi lần gọi (mỗi ~50 ms): đứng yên kể từ `anchor.t` quá IDLE_MS thì đếm một đoạn đứng yên.
  const track = () => {
    const q = me(), now = Date.now();
    if (Math.hypot(q.x - anchor.x, q.y - anchor.y) >= MOVE_PX) { if (inIdle) idleMs += now - anchor.t - IDLE_MS; inIdle = false; anchor = { x: q.x, y: q.y, t: now }; }
    else if (!inIdle && now - anchor.t >= IDLE_MS) { inIdle = true; idle++; }
  };
  outer: while (Date.now() - t0 < maxMs) {
    const p = me();
    if (Math.hypot(goal.x - p.x, goal.y - p.y) < want) { res = "arrived"; break; }
    const path = findLongPath(g, nv, { x: p.x, y: p.y }, goal, AUTO_MOVE.nav.look), end = path.at(-1);
    repaths++;
    if (!end || Math.hypot(end.x - goal.x, end.y - goal.y) > TILE * 2) { res = "none"; break; }
    let i = 0, dBest = Infinity, dT = Date.now();
    while (i < path.length && Date.now() - t0 < maxMs) {
      const q = me(); let w = path[i], L = Math.hypot(w.x - q.x, w.y - q.y);
      while (L < near() && i < path.length - 1) { w = path[++i]; L = Math.hypot(w.x - q.x, w.y - q.y); dBest = Infinity; dT = Date.now(); }
      if (L < near()) break;
      if (Date.now() - dT > AUTOWALK.holdMs) { if (L > dBest - 2) break; dBest = L; dT = Date.now(); }
      if (Math.hypot(goal.x - q.x, goal.y - q.y) < want) { res = "arrived"; break outer; }
      T.room.send("input", { x: +((w.x - q.x) / L).toFixed(2), y: +((w.y - q.y) / L).toFixed(2) });
      await sleep(50); track();
      // Kẹt thật: quãng đường còn lại theo đường đi không ngắn thêm AUTOWALK.progress ô trong AUTOWALK.stuckSecs giây.
      const rem = pathLength({ x: me().x, y: me().y }, path.slice(i)) / TILE;
      if (rem < best - AUTOWALK.progress) { best = rem; bestT = Date.now(); }
      else if (Date.now() - bestT > AUTOWALK.stuckSecs * 1000) { res = "stuck"; break outer; }
    }
    T.room.send("input", { x: 0, y: 0 }); await sleep(80); track();
  }
  T.room.send("input", { x: 0, y: 0 });
  return { res, secs: (Date.now() - t0) / 1000, idle, idleSecs: idleMs / 1000, repaths: Math.max(0, repaths) };
}

export async function pathflowTest() {
  console.log("[L1 #1659] Đường đi từ trại hồi sinh tới từng mốc: giây, đứng yên > 1 giây, tính lại đường, kẹt");
  const mapIds = (process.env.PF_MAPS ?? DEFAULT_MAPS.join(",")).split(",").map((s) => s.trim()).filter(Boolean);
  const minTiles = Number(process.env.PF_MIN_TILES ?? 10);
  const T = await bot("Luồng", "lam_dien_ba_vuong_long", { sex: 0, hair: 1, hairCol: 2, outfitCol: 1 });
  const me = () => T.room.state.players?.get(T.room.sessionId);
  await waitFor(() => me(), 3000);
  if (!(await test(T, "ping"))?.enabled) { needHookSkip("bỏ qua pathflow (cần hook warp, goto, clear): bật server bằng GAME_TEST=1"); await T.room.leave(); return; }

  async function warp(mapId, x, y) {
    T.travel = null; T.room.send("test", { op: "warp", mapId, x, y });
    if (!(await waitFor(() => T.travel?.mapId === mapId, 4000))) return false;
    const roomId = T.travel?.roomId ?? undefined; await T.room.leave(); await sleep(300); T.mapId = mapId; await enter(T, roomId);
    return await waitFor(() => me() && T.room.state.mapId === mapId, 4000);
  }
  async function placeAt(p) {
    for (const [dx, dy] of [[0, 0], [16, 0], [0, 16], [-16, 0], [0, -16], [32, 32], [-32, 32], [32, -32], [-32, -32]]) {
      const q = { x: p.x + dx, y: p.y + dy }; await test(T, "goto", q);
      if (me() && Math.hypot(me().x - q.x, me().y - q.y) < 2) return true;
    }
    return false;
  }

  const all = {};
  for (const mapId of mapIds) {
    if (!MAPS[mapId]) { ok(false, `PF_MAPS: không có bản đồ ${mapId}`); continue; }
    const { raw, spawn, marks } = landmarksOf(mapId), g = solidGrid(raw), nv = buildNav(g, AUTO_MOVE.nav.block);
    if (!spawn) { ok(false, `${MAPS[mapId].name}: không có object spawn`); continue; }
    const home = standNear(g, spawn.x, spawn.y);
    ok(!!home && await warp(mapId, home.x, home.y), `${MAPS[mapId].name}: vào bản đồ ở trại hồi sinh`);
    if (!me() || T.room.state.mapId !== mapId) continue;
    const rows = [];
    for (const m of marks) {
      const goal = standNear(g, m.x, m.y);
      if (!goal || Math.hypot(goal.x - home.x, goal.y - home.y) / TILE < minTiles) continue; // mốc nằm ngay trong trại: không phải đoạn đường phải đi
      await test(T, "clear", { all: true }); T.room.send("input", { x: 0, y: 0 });
      if (!(await placeAt(home))) { ok(false, `${MAPS[mapId].name}: không đặt được bot ở trại`); break; }
      await sleep(150);
      const r = await walkTo(T, g, nv, goal, 120000);
      rows.push({ kind: m.kind, name: m.name, ...r });
      if (r.res === "stuck" || r.res === "none" || r.res === "timeout") console.log(`  ⚠ ${MAPS[mapId].name} → ${m.name}: ${r.res} sau ${f1(r.secs)} giây tại (${Math.round(me().x / TILE)}, ${Math.round(me().y / TILE)}) ô`);
    }
    await test(T, "clear", { all: true });
    all[mapId] = rows;
    ok(rows.length > 0, `${MAPS[mapId].name}: có tuyến để đo (${rows.length})`);
  }

  // Bảng: từng tuyến rồi tổng mỗi bản đồ.
  console.log("\n  Bản đồ / tuyến".padEnd(46) + "kết quả   giây  đứng yên>1s (giây)  tính lại đường");
  const json = {};
  for (const [mapId, rows] of Object.entries(all)) {
    for (const r of rows) console.log(`  ${(MAPS[mapId].name + " → " + KIND_NAME[r.kind] + " " + r.name).padEnd(52)} ${r.res.padEnd(9)} ${f1(r.secs).padStart(5)}  ${String(r.idle).padStart(6)} (${f1(r.idleSecs).padStart(4)})  ${String(r.repaths).padStart(10)}`);
    const sum = (k) => rows.reduce((a, r) => a + r[k], 0), n = rows.length;
    const real = rows.filter((r) => r.res !== "arrived").length;
    console.log(`  ${(MAPS[mapId].name + ": tổng " + n + " tuyến").padEnd(52)} ${(real ? real + " kẹt" : "0 kẹt").padEnd(9)} ${f1(sum("secs")).padStart(5)}  ${String(sum("idle")).padStart(6)} (${f1(sum("idleSecs")).padStart(4)})  ${String(sum("repaths")).padStart(10)}`);
    json[mapId] = rows.map((r) => ({ m: `${r.kind}:${r.name}`, res: r.res, s: +r.secs.toFixed(1), idle: r.idle, idleS: +r.idleSecs.toFixed(1), repath: r.repaths }));
  }
  console.log("PATHFLOW_JSON " + JSON.stringify(json));
  await T.room.leave();
}
