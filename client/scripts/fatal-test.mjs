// Bài thử lỗi nghiêm trọng ngoài phòng (#270): chỉ chạy qua `npm run bot:local -- --fatal [--pg]` (tools/bot-local.mjs), không thuộc bot
// thường vì làm server thoát. Hai pha, mỗi pha một lần chạy script này với SERVER_URL của server do bot-local bật (GAME_TEST=1):
//   FATAL_PHASE=crash  tài khoản mới vào làng, đổi tiến độ chưa lưu (kinh nghiệm hạ hồn thú qua hook `kill`, đứng ở chỗ khác chỗ sinh) rồi gọi hook
//                      `crash {reject}` (FATAL_KIND=throw | reject): server phải ngắt kết nối; ghi tài khoản và tiến độ vào FATAL_FILE.
//   FATAL_PHASE=verify (chỉ khi lưu PostgreSQL, server bật lại trên cùng database) đăng nhập lại: vị trí, cấp và kinh nghiệm đúng như
//                      lúc lỗi, tức server đã lưu người chơi đang online trước khi thoát.
// bot-local tự kiểm phần còn lại: mã thoát ≠ 0, log server có lỗi kèm stack và dòng đã lưu.
import { Client } from "colyseus.js";
import { bindVit } from "./bot/vit.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const API = process.env.SERVER_URL ?? "http://localhost:2567", WS = API.replace(/^http/, "ws");
const PHASE = process.env.FATAL_PHASE, KIND = process.env.FATAL_KIND === "reject" ? "reject" : "throw", FILE = process.env.FATAL_FILE;
const post = async (p, b) => { const r = await fetch(API + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); return { status: r.status, ...await r.json() }; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (fn, ms = 2000) => { for (let t = 0; t < ms; t += 50) { if (fn()) return true; await sleep(50); } return !!fn(); };
let fails = 0;
const ok = (c, msg) => { console.log(`${c ? "✓" : "✗"} ${msg}`); if (!c) fails++; return c; };

/** Vào phòng bản đồ đang lưu của tài khoản; trả phòng, người chơi của mình và hàm gọi hook test. */
async function join(token) {
  const me = await post("/api/me", { token });
  const room = await new Client(WS).joinOrCreate("map", { token, mapId: me.mapId });
  const replies = [];
  const installVit = bindVit(room); // #949: xp không còn trong state công khai, tin riêng "vit"
  room.onMessage("test", (m) => replies.push(m));
  room.onMessage("*", () => {}); // tin khác (log, fx, bag…) không cần đọc
  const p = () => room.state.players?.get(room.sessionId);
  if (!await waitFor(() => p(), 5000)) throw new Error("không thấy nhân vật của mình trong state");
  const test = async (op, args = {}) => { const n = replies.length; room.send("test", { op, ...args }); await waitFor(() => replies.length > n, 2000); return replies[n]; };
  await installVit();
  return { room, p, test };
}

if (PHASE === "crash") {
  const name = `fatal${Date.now().toString(36).slice(-6)}`, password = randomUUID();
  const l = await post("/api/login", { name, password });
  ok(l.token, `tài khoản mới ${name}`);
  await post("/api/looks", { token: l.token, sex: 0, hair: 1, hairCol: 1, outfitCol: 1 });
  ok((await post("/api/awaken", { token: l.token, vohon: "bich_lan_xa_hoang" })).status === 200, "thức tỉnh");
  const { room, p, test } = await join(l.token);
  ok((await test("ping"))?.enabled, "server bật GAME_TEST=1");
  // Tiến độ chưa lưu: kinh nghiệm của 3 hồn thú (hook kill) và đứng ở cổng làng (xa chỗ sinh). Lưu định kỳ chưa tới lượt trong vài giây này.
  const xp0 = p().xp, lv0 = p().level;
  for (let i = 0; i < 3; i++) await test("kill", { tier: 0 });
  // File bản đồ server đang dùng (state.mapFile: bản dựng .v2, trống = theo mapId).
  const gate = JSON.parse(readFileSync(new URL(`../../shared/assets/${room.state.mapFile || room.state.mapId}.json`, import.meta.url), "utf8"))
    .layers.flatMap((x) => x.objects ?? []).find((o) => o.type === "portal");
  const at = { x: gate.x + gate.width / 2, y: gate.y + gate.height / 2 };
  await test("goto", at);
  ok(await waitFor(() => (p().level > lv0 || p().xp > xp0) && Math.hypot(p().x - at.x, p().y - at.y) < 1),
    `kinh nghiệm 3 hồn thú (cấp ${lv0} -> ${p().level}, ${xp0} -> ${p().xp}), đứng ở ${gate.name} (${p().x}, ${p().y})`);
  const saved = { name, password, x: p().x, y: p().y, level: p().level, xp: p().xp };
  let left = null;
  room.onLeave((code) => { left = code; });
  const r = await test("crash", { reject: KIND === "reject" });
  ok(r?.op === "crash" && r.reject === (KIND === "reject"), `hook crash (${KIND === "reject" ? "promise bị từ chối không ai bắt" : "ném lỗi ngoài phòng"}) đã nhận`);
  ok(await waitFor(() => left !== null, 15000), `server ngắt kết nối sau lỗi (mã ${left})`);
  writeFileSync(FILE, JSON.stringify(saved));
} else if (PHASE === "verify") {
  const saved = JSON.parse(readFileSync(FILE, "utf8"));
  const l = await post("/api/login", { name: saved.name, password: saved.password });
  ok(l.token, `đăng nhập lại ${saved.name} sau khi server khởi động lại`);
  const { room, p } = await join(l.token);
  ok(Math.hypot(p().x - saved.x, p().y - saved.y) < 1 && p().level === saved.level && p().xp === saved.xp,
    `đã lưu trước khi thoát: vị trí (${p().x}, ${p().y}) / (${saved.x}, ${saved.y}), cấp ${p().level} / ${saved.level}, kinh nghiệm ${p().xp} / ${saved.xp}`);
  await room.leave();
} else ok(false, `FATAL_PHASE=${PHASE}: chỉ nhận crash | verify`);
process.exit(fails ? 1 : 0);
