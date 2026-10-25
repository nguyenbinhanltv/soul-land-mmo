// Kiểm thử Predictor (client/src/predict.ts) không cần server: giả lập server theo đúng thứ tự tick() của MapRoom (nhận input -> đếm
// seqT -> gục thì đứng -> đi bằng moveEnt) và đường truyền trễ cố định mỗi chiều. Chạy: npm run test:predict --prefix client
// (Node >= 22.18 tự bỏ kiểu của file .ts).
import { Predictor } from "../src/predict.ts";
import { moveEnt, hits, clampDir, MOVE_DEAD, PLAYER_HW, PLAYER_HH } from "../../shared/move.ts";
import { TICK_RATE, TILE, dir4, RUN_MULT, MOVE_NUDGE } from "../../shared/data.ts";
import { findPath, clearLine, pathLength } from "../../shared/path.ts";

let fails = 0;
const ok = (c, msg) => { console.log(`${c ? "✓" : "✗"} ${msg}`); if (!c) fails++; };

const W = 200, H = 200, grid = { MW: W, MH: H, solid: new Uint8Array(W * H) }; // bản đồ trống
const SPD = 100, RUN = SPD * RUN_MULT, TICK = 1 / TICK_RATE, FRAME = 1 / 60;

/**
 * Một phiên giả lập: `keys(t)` trả hướng đang giữ ở giây t của client; `lag` giây mỗi chiều. Server gửi bản vá sau mỗi nhịp.
 * `events` (theo giây của server): { t, die } gục, { t, respawn: {x, y} } hồi sinh, { t, goto: {x, y} } hook thử, { t, mute: s }
 * server không gửi state s giây, { t, dir } quay mặt (như khi đánh), { t, calm } vào / ra giao chiến (11.1: ngoài giao chiến chạy
 * × RUN_MULT trừ khi input giữ Shift `w`). `SPD` là tốc độ đi bộ; mặc định ngoài giao chiến nên đang chạy.
 */
function run({ keys, lag = 0.1, secs, events = [], onFrame }) {
  const pred = new Predictor(grid);
  const sv = { x: 1600, y: 1600, dir: 0, seq: 0, seqT: 0, spd: RUN, dead: false, calm: true, walk: false, input: { x: 0, y: 0 }, muteTo: -1 };
  const toServer = [], toClient = []; // { at, m }
  let me = null, lastKey = "", dir = { x: 0, y: 0 }, nextTick = 0;
  const ev = [...events].sort((a, b) => a.t - b.t);
  const frames = [];
  for (let t = 0; t < secs; t += FRAME) {
    // server: xử lý mọi nhịp tới thời điểm t
    while (nextTick <= t) {
      const now = nextTick; nextTick += TICK;
      while (toServer.length && toServer[0].at <= now) {
        const m = toServer.shift().m; sv.input = clampDir(m.x, m.y); sv.walk = !!m.w; if (m.s > 0) sv.seq = m.s; sv.seqT = 0;
      }
      while (ev.length && ev[0].t <= now) {
        const e = ev.shift();
        if (e.die) sv.dead = true;
        if (e.respawn) { sv.dead = false; sv.x = e.respawn.x; sv.y = e.respawn.y; }
        if (e.goto) { sv.x = e.goto.x; sv.y = e.goto.y; sv.input = { x: 0, y: 0 }; sv.seq = (sv.seq + 1) >>> 0; sv.seqT = 0; }
        if (e.mute) sv.muteTo = now + e.mute;
        if (e.dir !== undefined) sv.dir = e.dir;
        if (e.calm !== undefined) sv.calm = e.calm;
      }
      sv.spd = SPD * (sv.calm && !sv.walk ? RUN_MULT : 1); // như MapRoom.tick
      if (Math.hypot(sv.input.x, sv.input.y) > MOVE_DEAD) sv.seqT += TICK;
      if (!sv.dead && Math.hypot(sv.input.x, sv.input.y) > MOVE_DEAD) {
        moveEnt(grid, sv, sv.input.x * sv.spd * TICK, sv.input.y * sv.spd * TICK, PLAYER_HW, PLAYER_HH);
        sv.dir = dir4(sv.input.x, sv.input.y);
      }
      // float32 như schema
      const f = Math.fround;
      if (now >= sv.muteTo) toClient.push({ at: now + lag, m: { x: f(sv.x), y: f(sv.y), dir: sv.dir, seq: sv.seq, seqT: f(sv.seqT), spd: f(sv.spd), dead: sv.dead, calm: sv.calm, walk: sv.walk } });
    }
    // client: nhận state, gửi input khi đổi hướng (như GameScene.sendInput), rồi dự đoán
    while (toClient.length && toClient[0].at <= t) me = toClient.shift().m;
    if (!me) continue;
    const k = keys(t), key = `${k.x},${k.y},${!!k.w}`;
    if (pred.resend) lastKey = "";
    if (key !== lastKey) { lastKey = key; dir = clampDir(k.x, k.y); toServer.push({ at: t + lag, m: { x: k.x, y: k.y, s: pred.next(), ...(k.w ? { w: 1 } : {}) } }); }
    const at = pred.update(me, dir, FRAME, !!k.w);
    frames.push({ t, at, me: { ...me }, sv: { x: sv.x, y: sv.y }, look: pred.look(me, dir), snaps: pred.snaps });
    onFrame?.(frames.at(-1));
  }
  return { frames, pred };
}

const right = () => ({ x: 1, y: 0 });
/** Khung trong [t0, t1): dự đoán đi trước server (vị trí server đang có lúc đó) đúng spd × khứ hồi, không giật lùi. */
function steady(frames, t0, t1, lag, label, spd = RUN, tol = 0) {
  const fs = frames.filter((f) => f.t >= t0 && f.t < t1);
  const want = spd * 2 * lag;
  let worst = 0, back = 0;
  for (let i = 0; i < fs.length; i++) {
    worst = Math.max(worst, Math.abs(fs[i].at.x - fs[i].sv.x - spd * lag));
    if (i && fs[i].at.x < fs[i - 1].at.x - 0.01) back++;
  }
  // So với server THẬT (không trễ): client đi trước một chiều trễ (input tới server sau `lag`).
  // Server áp input ở đầu nhịp kế tiếp nên lệch tới một bước nhịp (spd × TICK), cộng 1 px; `tol`: lệch thêm cho phép.
  ok(fs.length > 0 && worst < spd * TICK + 1 + tol && back === 0,
    `${label}: lệch so với server thật + spd × trễ tối đa ${worst.toFixed(2)} px, ${back} khung giật lùi (đi trước state nhận được ~${Math.round(want)} px)`);
}

for (const lag of [0.05, 0.15]) {
  // 1. Đi thẳng, giữ phím.
  { const { frames } = run({ keys: right, lag, secs: 3 }); steady(frames, 1, 3, lag, `trễ ${lag * 1000} ms, đi thẳng`); }

  // 2. Gục trong lúc vẫn giữ phím, hồi sinh, giữ tiếp: phải dự đoán lại ngay (lỗi cũ: bỏ hết bước mới tới khi đổi hướng).
  {
    const { frames } = run({ keys: right, lag, secs: 8, events: [{ t: 1, die: true }, { t: 4, respawn: { x: 400, y: 400 } }] });
    const dead = frames.filter((f) => f.me.dead && f.t > 1.5 + lag && f.t < 4);
    ok(dead.length > 0 && dead.every((f) => Math.abs(f.at.x - f.me.x) < 0.01 && Math.abs(f.at.y - f.me.y) < 0.01), `trễ ${lag * 1000} ms, đang gục: đứng đúng chỗ server`);
    steady(frames, 4 + 2 * lag + 0.5, 8, lag, `trễ ${lag * 1000} ms, giữ phím qua lúc hồi sinh`);
  }

  // 3. Server im lặng quá MAX_PENDING (5 giây) rồi trả lời lại: bước cắt bỏ vẫn được tính, không lệch dòng thời gian.
  {
    const { frames } = run({ keys: right, lag, secs: 10, events: [{ t: 1, mute: 6 }] });
    steady(frames, 7 + 2 * lag + 0.5, 10, lag, `trễ ${lag * 1000} ms, server im 6 giây rồi trả lời`);
  }

  // 4. Hook thử goto dừng hướng đi của server: client gửi lại hướng đang giữ và đi tiếp.
  {
    const { frames, pred } = run({ keys: right, lag, secs: 4, events: [{ t: 1, goto: { x: 800, y: 800 } }] });
    ok(pred.seq >= 3, `trễ ${lag * 1000} ms, goto: client gửi lại hướng (seq ${pred.seq})`);
    steady(frames, 1 + 2 * lag + 0.5, 4, lag, `trễ ${lag * 1000} ms, giữ phím qua goto`);
  }

  // 5. Hướng nhìn: chạm phím phải ngắn hơn khứ hồi rồi nhả, không nhảy về hướng cũ của server; server quay mặt (đánh) thì theo.
  {
    const keys = (t) => (t >= 0.5 && t < 0.56 + lag ? { x: 1, y: 0 } : { x: 0, y: 0 });
    const { frames } = run({ keys, lag, secs: 2, events: [{ t: 1.5, dir: 2 }] });
    const after = frames.filter((f) => f.t >= 0.5 && f.t < 1.5);
    ok(after.length > 0 && after.every((f) => f.look === 1), `trễ ${lag * 1000} ms, nhả phím: giữ hướng phải (${[...new Set(after.map((f) => f.look))]})`);
    const last = frames.at(-1);
    ok(last.look === 2, `trễ ${lag * 1000} ms, server quay mặt khi đứng: theo server (${last.look})`);
  }

  // 6. Chạy / đi bộ (11.1): giữ Shift giữa chừng rồi nhả. Mỗi bước nhớ cờ đi bộ của nó nên đổi dáng không làm hình giật, không đặt thẳng.
  {
    // Dáng cũ còn chạy tới đầu nhịp server kế tiếp: lệch cố định thêm tối đa (RUN − SPD) × TICK so với server thật (vẫn khớp server).
    const keys = (t) => ({ x: 1, y: 0, w: t >= 1 && t < 2 }), tol = (RUN - SPD) * TICK;
    const { frames, pred } = run({ keys, lag, secs: 3 });
    steady(frames, 0.5, 1, lag, `trễ ${lag * 1000} ms, chạy ngoài giao chiến (${RUN} px/giây)`);
    steady(frames, 1 + lag + TICK + 0.05, 2, lag, `trễ ${lag * 1000} ms, giữ Shift: đi bộ (${SPD} px/giây)`, SPD, tol);
    steady(frames, 2 + lag + TICK + 0.05, 3, lag, `trễ ${lag * 1000} ms, nhả Shift: chạy lại`, RUN, tol);
    ok(pred.snaps === 0, `trễ ${lag * 1000} ms, đổi chạy / đi bộ không đặt thẳng vị trí (${pred.snaps})`);
  }

  // 7. Vào giao chiến khi đang chạy (server quyết định): về đi bộ, chỉ trượt nhẹ phần đã đoán trước, không giật lùi.
  {
    const { frames, pred } = run({ keys: right, lag, secs: 3, events: [{ t: 1, calm: false }] });
    steady(frames, 1 + 2 * lag + 0.5, 3, lag, `trễ ${lag * 1000} ms, vào giao chiến: đi bộ`, SPD);
    const fs = frames.filter((f) => f.t > 0.2); let back = 0;
    for (let i = 1; i < fs.length; i++) if (fs[i].at.x < fs[i - 1].at.x - 0.01) back++;
    ok(pred.snaps === 0 && back === 0, `trễ ${lag * 1000} ms, vào giao chiến: không đặt thẳng (${pred.snaps}), ${back} khung giật lùi`);
  }
}

// 8. Tìm đường khi bấm chuột (11.1, shared/path.ts): bức tường chắn giữa, phải đi vòng qua khe; đi theo đường bằng đúng moveEnt
// của server thì tới nơi; điểm bấm trong ô chặn / bị vây thì tới ô gần nhất; xa quá khung thì đi dần về phía đó.
{
  const MW = 60, MH = 40, solid = new Uint8Array(MW * MH), g = { MW, MH, solid };
  for (let y = 0; y < 30; y++) solid[y * MW + 30] = 1;                 // tường dọc x = 30, khe ở y ≥ 30
  for (let y = 4; y <= 8; y++) for (let x = 44; x <= 48; x++) if (y === 4 || y === 8 || x === 44 || x === 48) solid[y * MW + x] = 1; // ô vây kín
  const from = { x: 20 * TILE + 8, y: 10 * TILE + 8 }, to = { x: 40 * TILE + 8, y: 10 * TILE + 8 };
  const path = findPath(g, from, to);
  let at = from, okSeg = true;
  for (const p of path) { okSeg &&= clearLine(g, at, p); at = p; }
  ok(path.length >= 2 && okSeg && path.some((p) => p.y >= 30 * TILE), `A*: đi vòng qua khe dưới tường (${path.length} điểm, dài ${pathLength(from, path).toFixed(0)} px), mọi đoạn đi thẳng được`);
  ok(Math.hypot(path.at(-1).x - to.x, path.at(-1).y - to.y) < 0.01, "A*: điểm cuối là đúng điểm bấm");
  // Đi theo đường như GameScene: lái về từng điểm, tốc độ chạy, mỗi nhịp moveEnt.
  const e = { ...from }; let i = 0;
  for (let t = 0; t < 20 && i < path.length; t += TICK) {
    const dx = path[i].x - e.x, dy = path[i].y - e.y, L = Math.hypot(dx, dy);
    if (L < 3) { i++; continue; }
    const st = Math.min(L, RUN * TICK); moveEnt(g, e, (dx / L) * st, (dy / L) * st, PLAYER_HW, PLAYER_HH);
  }
  ok(Math.hypot(e.x - to.x, e.y - to.y) < 3, `A*: đi theo đường bằng moveEnt tới nơi (${e.x.toFixed(0)}, ${e.y.toFixed(0)})`);
  const direct = findPath(g, from, { x: from.x + 50, y: from.y + 20 });
  ok(direct.length === 1, "A*: đường thẳng không vướng thì đi thẳng một đoạn");
  const boxed = findPath(g, { x: 40 * TILE + 8, y: 6 * TILE + 8 }, { x: 46 * TILE + 8, y: 6 * TILE + 8 }), end = boxed.at(-1);
  ok(boxed.length > 0 && end && Math.hypot(end.x - (43 * TILE + 8), end.y - (6 * TILE + 8)) < 0.01, `A*: điểm bấm trong ô vây kín: tới ô sát vách gần nhất (${end && `${end.x}, ${end.y}`})`);
  const far = findPath(g, { x: 2 * TILE + 8, y: 35 * TILE + 8 }, { x: 59 * TILE + 8, y: 35 * TILE + 8 }, { maxTiles: 10, maxNodes: 8000 });
  ok(far.length > 0 && far.at(-1).x <= 12 * TILE + 8 + 0.01 && far.at(-1).x > 8 * TILE, `A*: điểm bấm ngoài khung ${10} ô: đi tới mép khung (${far.at(-1)?.x})`);
}

// ---------- Lách góc (moveEnt với nudge = MOVE_NUDGE, #748) ----------
{
  const N = 10, mk = (cells) => { const g = { MW: N, MH: N, solid: new Uint8Array(N * N) }; for (const [x, y] of cells) g.solid[y * N + x] = 1; return g; };
  const walk = (g, e, dx, dy, steps, nudge) => { for (let i = 0; i < steps; i++) moveEnt(g, e, dx, dy, PLAYER_HW, PLAYER_HH, nudge); return e; };
  // Góc ngoài: ô (5,5) = x 80..96, y 80..96; chân lệch xuống 2 px vào hàng ô 5 -> không nudge thì khựng, có nudge thì lách lên qua đỉnh ô.
  const corner = mk([[5, 5]]);
  const a = walk(corner, { x: 60, y: 77 }, 2, 0, 3, 0);
  ok(a.x < 75 && a.y === 77, "không nudge: vướng góc ô thì đứng khựng");
  const b = walk(corner, { x: 60, y: 77 }, 2, 0, 40, MOVE_NUDGE);
  ok(b.x > 100 && b.y < 77, `nudge: lách qua góc ngoài (x=${b.x}, y=${b.y})`);
  const c = walk(corner, { x: 60, y: 84 }, 2, 0, 40, MOVE_NUDGE);
  ok(c.x < 75 && c.y === 84, "chạm sâu hơn ngưỡng thì không lách (vẫn chặn)");
  // Lách xuống phía dưới khi lệch lên trên (đối xứng) và đi dọc trục y (lách theo x).
  const d = walk(corner, { x: 60, y: 99 }, 2, 0, 40, MOVE_NUDGE);
  ok(d.x > 100 && d.y > 99, `nudge đối xứng: lách xuống (x=${d.x}, y=${d.y})`);
  const e = walk(corner, { x: 77, y: 60 }, 0, 2, 40, MOVE_NUDGE);
  ok(e.y > 100 && e.x < 77, `đi dọc trục y: lách theo trục x (x=${e.x}, y=${e.y})`);
  // Hành lang 1 ô (hàng 5 trống, hàng 4 và 6 chặn từ cột 5): vào lệch 2 px thì được dẫn vào, không xuyên tường.
  const wall = []; for (let x = 5; x < N; x++) wall.push([x, 4], [x, 6]);
  const hall = mk(wall);
  const f = walk(hall, { x: 40, y: 94 }, 2, 0, 80, MOVE_NUDGE);
  ok(f.x > 130 && f.y >= 84 && f.y <= 92, `hành lang 1 ô: vào được và ở trong hành lang (x=${f.x}, y=${f.y})`);
  const f0 = walk(hall, { x: 40, y: 94 }, 2, 0, 80, 0);
  ok(f0.x < 75, "hành lang 1 ô: không nudge thì kẹt ở cửa");
  // Đi chéo dọc tường: không nudge thì trượt, có nudge thì cũng trượt y hệt (không bị đẩy ra xa, không xuyên).
  const floor = mk(Array.from({ length: N }, (_, x) => [x, 6]));
  const g1 = walk(floor, { x: 10, y: 80 }, 1.5, 1.5, 60, MOVE_NUDGE), g0 = walk(floor, { x: 10, y: 80 }, 1.5, 1.5, 60, 0);
  ok(g1.x === g0.x && g1.y === g0.y && g1.y <= 91 && g1.x > 90, `đi chéo dọc tường: trượt như cũ (x=${g1.x}, y=${g1.y})`);
  // Không bao giờ xuyên tường: đi ngẫu nhiên nhiều bước trên bản đồ có nhiều ô chặn, hộp luôn không chạm ô chặn.
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
  const cells = []; for (let i = 0; i < 22; i++) cells.push([1 + Math.floor(rnd() * 8), 1 + Math.floor(rnd() * 8)]);
  const maze = mk(cells), q = { x: 8, y: 8 }; let bad = 0;
  for (let i = 0; i < 20000; i++) {
    if (i % 40 === 0) { const a2 = rnd() * Math.PI * 2; var vx = Math.cos(a2) * 3, vy = Math.sin(a2) * 3; }
    moveEnt(maze, q, vx, vy, PLAYER_HW, PLAYER_HH, MOVE_NUDGE);
    if (hits(maze, q.x, q.y, PLAYER_HW, PLAYER_HH)) bad++;
  }
  ok(bad === 0, `không xuyên tường: 20000 bước ngẫu nhiên, ${bad} lần hộp chạm ô chặn`);
}

console.log(fails ? `${fails} kiểm tra trượt` : "Mọi kiểm tra dự đoán chuyển động và tìm đường đều qua");
process.exit(fails ? 1 : 0);
