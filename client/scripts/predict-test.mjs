// Kiểm thử Predictor (client/src/predict.ts) không cần server: giả lập server theo đúng thứ tự tick() của MapRoom (nhận input -> đếm
// seqT -> gục thì đứng -> đi bằng moveEnt) và đường truyền trễ cố định mỗi chiều. Chạy: npm run test:predict --prefix client
// (Node >= 22.18 tự bỏ kiểu của file .ts).
import { Predictor } from "../src/predict.ts";
import { moveEnt, clampDir, MOVE_DEAD, PLAYER_HW, PLAYER_HH } from "../../shared/move.ts";
import { TICK_RATE, dir4 } from "../../shared/data.ts";

let fails = 0;
const ok = (c, msg) => { console.log(`${c ? "✓" : "✗"} ${msg}`); if (!c) fails++; };

const W = 200, H = 200, grid = { MW: W, MH: H, solid: new Uint8Array(W * H) }; // bản đồ trống
const SPD = 100, TICK = 1 / TICK_RATE, FRAME = 1 / 60;

/**
 * Một phiên giả lập: `keys(t)` trả hướng đang giữ ở giây t của client; `lag` giây mỗi chiều. Server gửi bản vá sau mỗi nhịp.
 * `events` (theo giây của server): { t, die } gục, { t, respawn: {x, y} } hồi sinh, { t, goto: {x, y} } hook thử, { t, mute: s }
 * server không gửi state s giây, { t, dir } quay mặt (như khi đánh).
 */
function run({ keys, lag = 0.1, secs, events = [], onFrame }) {
  const pred = new Predictor(grid);
  const sv = { x: 1600, y: 1600, dir: 0, seq: 0, seqT: 0, spd: SPD, dead: false, input: { x: 0, y: 0 }, muteTo: -1 };
  const toServer = [], toClient = []; // { at, m }
  let me = null, lastKey = "", dir = { x: 0, y: 0 }, nextTick = 0;
  const ev = [...events].sort((a, b) => a.t - b.t);
  const frames = [];
  for (let t = 0; t < secs; t += FRAME) {
    // server: xử lý mọi nhịp tới thời điểm t
    while (nextTick <= t) {
      const now = nextTick; nextTick += TICK;
      while (toServer.length && toServer[0].at <= now) {
        const m = toServer.shift().m; sv.input = clampDir(m.x, m.y); if (m.s > 0) sv.seq = m.s; sv.seqT = 0;
      }
      while (ev.length && ev[0].t <= now) {
        const e = ev.shift();
        if (e.die) sv.dead = true;
        if (e.respawn) { sv.dead = false; sv.x = e.respawn.x; sv.y = e.respawn.y; }
        if (e.goto) { sv.x = e.goto.x; sv.y = e.goto.y; sv.input = { x: 0, y: 0 }; sv.seq = (sv.seq + 1) >>> 0; sv.seqT = 0; }
        if (e.mute) sv.muteTo = now + e.mute;
        if (e.dir !== undefined) sv.dir = e.dir;
      }
      if (Math.hypot(sv.input.x, sv.input.y) > MOVE_DEAD) sv.seqT += TICK;
      if (!sv.dead && Math.hypot(sv.input.x, sv.input.y) > MOVE_DEAD) {
        moveEnt(grid, sv, sv.input.x * SPD * TICK, sv.input.y * SPD * TICK, PLAYER_HW, PLAYER_HH);
        sv.dir = dir4(sv.input.x, sv.input.y);
      }
      // float32 như schema
      const f = Math.fround;
      if (now >= sv.muteTo) toClient.push({ at: now + lag, m: { x: f(sv.x), y: f(sv.y), dir: sv.dir, seq: sv.seq, seqT: f(sv.seqT), spd: f(sv.spd), dead: sv.dead } });
    }
    // client: nhận state, gửi input khi đổi hướng (như GameScene.sendInput), rồi dự đoán
    while (toClient.length && toClient[0].at <= t) me = toClient.shift().m;
    if (!me) continue;
    const k = keys(t), key = `${k.x},${k.y}`;
    if (pred.resend) lastKey = "";
    if (key !== lastKey) { lastKey = key; dir = clampDir(k.x, k.y); toServer.push({ at: t + lag, m: { x: k.x, y: k.y, s: pred.next() } }); }
    const at = pred.update(me, dir, FRAME);
    frames.push({ t, at, me: { ...me }, sv: { x: sv.x, y: sv.y }, look: pred.look(me, dir), snaps: pred.snaps });
    onFrame?.(frames.at(-1));
  }
  return { frames, pred };
}

const right = () => ({ x: 1, y: 0 });
/** Khung trong [t0, t1): dự đoán đi trước server (vị trí server đang có lúc đó) đúng spd × khứ hồi, không giật lùi. */
function steady(frames, t0, t1, lag, label) {
  const fs = frames.filter((f) => f.t >= t0 && f.t < t1);
  const want = SPD * 2 * lag;
  let worst = 0, back = 0;
  for (let i = 0; i < fs.length; i++) {
    worst = Math.max(worst, Math.abs(fs[i].at.x - fs[i].sv.x - SPD * lag));
    if (i && fs[i].at.x < fs[i - 1].at.x - 0.01) back++;
  }
  // So với server THẬT (không trễ): client đi trước một chiều trễ (input tới server sau `lag`).
  ok(fs.length > 0 && worst < 6 && back === 0,
    `${label}: lệch so với server thật + spd × trễ tối đa ${worst.toFixed(2)} px, ${back} khung giật lùi (đi trước state nhận được ~${want} px)`);
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
}

console.log(fails ? `${fails} kiểm tra trượt` : "Mọi kiểm tra dự đoán chuyển động đều qua");
process.exit(fails ? 1 : 0);
