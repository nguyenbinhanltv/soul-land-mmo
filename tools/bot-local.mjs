// Chạy một lượt bot ở máy cho nhẹ khi nhiều agent làm song song (#228). Bot đầy đủ vẫn để job CI bot-ram lo.
//   npm run bot:local -- --only <nhóm> [--pg]   một nhóm BOT_ONLY (danh sách: --help), --pg thì lưu PostgreSQL thay vì RAM
//   npm run bot:local -- --part <1..6> [--pg]    một nhóm BOT_PART như CI (số nhóm: BOT_PARTS trong bot-test.mjs)
//   npm run bot:local -- --channels              lượt nhiều kênh (server CHANNEL_MAX=2)
//   npm run bot:local -- --full [--pg]           bot đầy đủ (~35 phút)
//   npm run bot:local -- --fatal [--pg]          lỗi nghiêm trọng ngoài phòng (#270, client/scripts/fatal-test.mjs): server lưu rồi thoát mã ≠ 0
//   npm run bot:local -- --pg-status | --pg-stop PostgreSQL chung của máy: xem / tắt
// Khác cách cũ (npm start + embedded-postgres riêng mỗi lượt):
// - Server build một lần bằng esbuild (cache theo hash nguồn ở server/dist/bot-<hash>.mjs) rồi chạy `node`, không qua npm / tsx.
// - Trần heap --max-old-space-size (mặc định 768 MB, --heap / BOT_HEAP_MB) cho server và bot.
// - Tối đa 2 lượt bot cùng lúc trên cả máy (BOT_LOCAL_MAX): file khoá ở %TEMP%/soul-bot-slots, lượt thừa chờ.
// - --pg dùng một PostgreSQL chung cho cả máy (binary embedded-postgres trong node_modules, cổng BOT_PG_PORT=5433, dữ liệu ở
//   BOT_PG_DIR, mặc định D:/soul-pg-shared), hoặc PostgreSQL có sẵn qua BOT_PG_URL. Mỗi lượt một database riêng, xoá khi xong.
// - Cổng server chọn ngẫu nhiên còn trống; chỉ tắt đúng tiến trình con của mình (kể cả khi Ctrl+C / lỗi). Không đọc server/.env.
// Mã thoát: của bot (khác 0 khi có dòng ✗), 1 khi server không lên / chết giữa chừng, 2 khi sai tham số.
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync, closeSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const serverDir = path.join(root, "server"), clientDir = path.join(root, "client");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mb = (b) => `${Math.round(b / 1048576)} MB`;
const secs = (t0) => `${((Date.now() - t0) / 1000).toFixed(1)} giây`;

// ---------- Tham số ----------
const argv = process.argv.slice(2);
const opt = { only: "", part: "", pg: false, full: false, channels: false, fatal: false, heap: Number(process.env.BOT_HEAP_MB ?? 768), env: [], once: false, procs: 1, seedTest: "" };
const botSrc = readFileSync(path.join(clientDir, "scripts", "bot-test.mjs"), "utf8");
const onlyNames = [...new Set([...botSrc.matchAll(/BOT_ONLY==="(\w+)"/g)].map((m) => m[1]))];
const partCount = Number(botSrc.match(/^const BOT_PARTS=(\d+);/m)?.[1] ?? 0);
const usage = () => console.log(`Cách dùng: npm run bot:local -- (--only <nhóm> | --part 1..${partCount} | --channels | --full | --fatal) [--pg] [--once] [--heap <MB>] [--env K=V]...
  --only     BOT_ONLY: ${onlyNames.join(", ")}
  --part     BOT_PART như job CI bot-ram
  --channels lượt nhiều kênh (server CHANNEL_MAX=2)
  --full     bot đầy đủ (~35 phút; thường để CI bot-ram chạy)
  --fatal    lỗi nghiêm trọng ngoài phòng (#270): hook ném lỗi / promise bị từ chối không ai bắt -> server ghi log, lưu người chơi
             đang online, thoát mã ≠ 0; với --pg bật lại server kiểm dữ liệu đã lưu
  --pg       lưu PostgreSQL (database riêng trên instance chung, xoá khi xong); server bật hai lần liên tiếp (migration chạy lại
             an toàn) rồi mới chạy bot, --once để chỉ bật một lần
  --heap     trần heap của server và bot (mặc định 768, biến BOT_HEAP_MB)
  --procs    số tiến trình server dùng chung Redis (#120, mặc định 1; bot chỉ nối tiến trình đầu, phòng mở ở tiến trình nào do server chọn):
             mỗi lượt tự bật một redis-server riêng ở cổng trống (biến BOT_REDIS_BIN, mặc định redis-server trong PATH) và tắt đúng PID đó khi xong;
             hai lượt cùng dùng chung một Redis thì nhiễu nhau (pub/sub, phòng, health-check của Colyseus không theo REDIS_PREFIX, #495).
             Tự bật Redis của mình thì truyền --env REDIS_URL=redis://127.0.0.1:<cổng> (mỗi lượt một cổng riêng); REDIS_URL của shell không được dùng
  --env      biến thêm cho server, ví dụ --env BOSS_CLOCK=20:00 --env MAP_V1=all
  --seed-test  (cần --pg) dựng tài khoản test mức max | giua-game | moi (server/scripts/seed-test-account.ts, #517) vào database của lượt này
             trước khi bật server, bot nhận BOT_TEST_NAME / BOT_TEST_PASS / BOT_TEST_PRESET (bài --only testacc)
  --pg-status / --pg-stop [--force]   xem / tắt PostgreSQL chung của máy
Biến: BOT_LOCAL_MAX (số lượt cùng lúc, mặc định 2), BOT_PG_URL (PostgreSQL có sẵn, ví dụ postgres://user:pass@localhost:5432/postgres),
BOT_PG_DIR (mặc định D:/soul-pg-shared nếu có ổ D), BOT_PG_PORT (mặc định 5433).`);
const die = (msg) => { console.error(`✗ ${msg}`); usage(); process.exit(2); };
let pgCmd = "", force = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i], val = () => argv[++i] ?? die(`${a} thiếu giá trị`);
  if (a === "--only") opt.only = val();
  else if (a === "--part") opt.part = val();
  else if (a === "--pg") opt.pg = true;
  else if (a === "--once") opt.once = true;
  else if (a === "--full") opt.full = true;
  else if (a === "--channels") opt.channels = true;
  else if (a === "--fatal") opt.fatal = true;
  else if (a === "--heap") opt.heap = Number(val());
  else if (a === "--procs") { opt.procs = Number(val()); if (!Number.isInteger(opt.procs) || opt.procs < 1 || opt.procs > 4) die("--procs là số nguyên 1..4"); }
  else if (a === "--seed-test") opt.seedTest = val();
  else if (a === "--env") { const e = val(); if (!/^[A-Z_][A-Z0-9_]*=/.test(e)) die(`--env cần dạng TÊN=giá trị: ${e}`); opt.env.push(e); }
  else if (a === "--pg-status" || a === "--pg-stop") pgCmd = a;
  else if (a === "--force") force = true;
  else if (a === "--help" || a === "-h") { usage(); process.exit(0); }
  else die(`không hiểu tham số ${a}`);
}
if (!pgCmd) {
  if ([opt.only, opt.part, opt.full, opt.channels, opt.fatal].filter(Boolean).length !== 1) die("chọn đúng một trong --only, --part, --channels, --full, --fatal");
  if (opt.seedTest && (!opt.pg || !["max", "giua-game", "moi"].includes(opt.seedTest))) die("--seed-test cần --pg và một mức: max | giua-game | moi");
  if (opt.only && !onlyNames.includes(opt.only)) die(`--only ${opt.only}: không có trong bot-test.mjs`);
  if (opt.part && opt.part !== "smoke" && !(/^\d+$/.test(opt.part) && +opt.part >= 1 && +opt.part <= partCount)) die(`--part chỉ nhận 1..${partCount} hoặc smoke`);
  if (!(opt.heap >= 128)) die("--heap tối thiểu 128 (MB)");
}

// ---------- Tiến trình còn sống không (Windows cũng hỗ trợ tín hiệu 0) ----------
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };

// ---------- Chỗ chạy toàn máy: tối đa BOT_LOCAL_MAX lượt ----------
const slotDir = path.join(os.tmpdir(), "soul-bot-slots");
const MAX = Math.max(1, Math.floor(Number(process.env.BOT_LOCAL_MAX ?? 2)) || 2);
/** Đọc file khoá; hỏng / tiến trình đã chết thì gỡ. Trả nội dung khi khoá còn hiệu lực. */
function readLock(file) {
  let info;
  try { info = JSON.parse(readFileSync(file, "utf8")); } catch (e) {
    if (e.code === "ENOENT") return null;
    // Đang ghi dở (vừa tạo) thì để yên vài giây; quá lâu mà vẫn hỏng thì gỡ.
    try { if (Date.now() - statSync(file).mtimeMs < 10_000) return { pid: 0 }; } catch { return null; }
    try { unlinkSync(file); } catch {}
    return null;
  }
  if (info.pid && alive(info.pid)) return info;
  try { unlinkSync(file); console.log(`(gỡ khoá cũ ${path.basename(file)} của PID ${info.pid} đã thoát)`); } catch {}
  return null;
}
/** Tạo file khoá nguyên tử (wx); được thì true. */
function tryLock(file, extra = {}) {
  try {
    const fd = openSync(file, "wx");
    writeFileSync(fd, JSON.stringify({ pid: process.pid, started: new Date().toISOString(), cwd: root, ...extra }));
    closeSync(fd);
    return true;
  } catch (e) { if (e.code === "EEXIST") return false; throw e; }
}
const releaseLock = (file) => { try { if (JSON.parse(readFileSync(file, "utf8")).pid === process.pid) unlinkSync(file); } catch {} };
/** Các khoá chỗ chạy còn hiệu lực (sau khi gỡ khoá chết). */
const liveSlots = () => (existsSync(slotDir) ? readdirSync(slotDir) : []).filter((f) => /^slot-\d+\.lock$/.test(f))
  .map((f) => readLock(path.join(slotDir, f))).filter((x) => x && x.pid);
async function acquireSlot(what) {
  mkdirSync(slotDir, { recursive: true });
  const t0 = Date.now(); let told = false;
  for (;;) {
    for (let i = 0; i < MAX; i++) {
      const f = path.join(slotDir, `slot-${i}.lock`);
      if (readLock(f)) continue;
      if (tryLock(f, { what })) { if (told) console.log(`✓ Có chỗ sau ${secs(t0)}`); return f; }
    }
    if (!told) {
      const busy = liveSlots().map((s) => `PID ${s.pid}${s.what ? ` (${s.what})` : ""}`).join(", ");
      console.log(`⏳ Đã có ${MAX} lượt bot đang chạy trên máy (${busy}); chờ chỗ trống… (BOT_LOCAL_MAX=${MAX}, khoá ở ${slotDir})`);
      told = true;
    }
    await sleep(2000);
  }
}
/** Khoá ngắn (bật PostgreSQL chung): chờ tới khi lấy được. */
async function withLock(name, fn) {
  mkdirSync(slotDir, { recursive: true });
  const f = path.join(slotDir, name);
  while (!tryLock(f)) { readLock(f); await sleep(500); }
  try { return await fn(); } finally { releaseLock(f); }
}

// ---------- PostgreSQL chung ----------
const requireServer = createRequire(path.join(serverDir, "package.json"));
const pgDir = path.resolve(process.env.BOT_PG_DIR ?? (process.platform === "win32" && existsSync("D:/") ? "D:/soul-pg-shared" : path.join(os.tmpdir(), "soul-pg-shared")));
// postgres.log: log của postgres (pg_ctl -l); bot-local.log: output của initdb / pg_ctl (hai file riêng, Windows không cho ghi chung).
const pgData = path.join(pgDir, "data"), pgLog = path.join(pgDir, "postgres.log"), toolLog = path.join(pgDir, "bot-local.log");
const pgPort = Number(process.env.BOT_PG_PORT ?? 5433);
const adminUrl = process.env.BOT_PG_URL || `postgres://postgres@localhost:${pgPort}/postgres`;
const pgLocal = (() => { try { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(adminUrl).hostname); } catch { return false; } })();

async function pgBins() {
  const pkg = `@embedded-postgres/${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`;
  try { return await import(pkg); } catch { throw new Error(`thiếu ${pkg}: chạy \`npm install\` ở thư mục gốc repo (devDependency embedded-postgres), hoặc đặt BOT_PG_URL`); }
}
/** Chạy lệnh, trả mã thoát (stdio ghi vào bot-local.log). `detached`: postgres do pg_ctl bật sống tiếp sau khi lượt này thoát. */
function run(cmd, args, { detached = false } = {}) {
  return new Promise((resolve, reject) => {
    const fd = openSync(toolLog, "a");
    const p = spawn(cmd, args, { stdio: ["ignore", fd, fd], detached, windowsHide: true });
    p.on("error", reject);
    p.on("exit", (code) => { closeSync(fd); resolve(code ?? 1); });
  });
}
async function pgConnect(url, quiet = true) {
  const pg = requireServer("pg");
  const c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 3000 });
  try { await c.connect(); return c; } catch (e) { if (!quiet) throw e; return { error: e }; }
}
/** Nối được thì dùng lại; chưa chạy thì initdb (lần đầu) + pg_ctl start. */
async function ensurePg() {
  if (process.env.BOT_PG_URL) {
    const c = await pgConnect(adminUrl);
    if (c.error) throw new Error(`không nối được BOT_PG_URL: ${c.error.message}`);
    await c.end(); return;
  }
  await withLock("pg-start.lock", async () => {
    let c = await pgConnect(adminUrl);
    if (!c.error) { await c.end(); return; }
    if (c.error.code !== "ECONNREFUSED") throw new Error(`cổng ${pgPort} có dịch vụ khác (${c.error.message}); đặt BOT_PG_PORT khác hoặc BOT_PG_URL`);
    const bins = await pgBins();
    mkdirSync(pgDir, { recursive: true });
    if (!existsSync(path.join(pgData, "PG_VERSION"))) {
      console.log(`… Tạo PostgreSQL chung lần đầu ở ${pgData}`);
      // UTF8 + locale C: chữ Việt trong file SQL (cluster mặc định trên Windows là WIN1252). trust: chỉ nghe localhost, dữ liệu thử.
      const code = await run(bins.initdb, ["-D", pgData, "-U", "postgres", "-A", "trust", "-E", "UTF8", "--locale=C"]);
      if (code !== 0) throw new Error(`initdb lỗi (mã ${code}), xem ${toolLog}`);
    }
    console.log(`… Bật PostgreSQL chung cổng ${pgPort} (${pgData})`);
    // Cấu hình truyền lúc bật (không ghi postgresql.conf) để instance đã tạo cũng nhận khi công cụ đổi. Ít RAM, ít tiến trình nền:
    // io_method=sync (không có 3 io_worker của PG 18), không autovacuum (database sống vài phút rồi xoá), không logical replication.
    const flags = [`-p ${pgPort}`, "-c listen_addresses=localhost", "-c shared_buffers=32MB", "-c max_connections=60", "-c work_mem=4MB",
      "-c maintenance_work_mem=32MB", "-c synchronous_commit=off", "-c io_method=sync", "-c autovacuum=off", "-c max_logical_replication_workers=0"];
    const code = await run(bins.pg_ctl, ["start", "-D", pgData, "-l", pgLog, "-w", "-t", "60", "-o", flags.join(" ")], { detached: true });
    if (code !== 0) throw new Error(`pg_ctl start lỗi (mã ${code}), xem ${toolLog} và ${pgLog}`);
    c = await pgConnect(adminUrl, false); await c.end();
  });
}
const qid = (s) => `"${s.replace(/"/g, '""')}"`;
// Database của công cụ: tên `soulbot_<phiên>_<pid>` và dấu COMMENT ON DATABASE lúc tạo. Chỉ dọn database có đủ cả hai, để không bao giờ
// đụng database thật trên PostgreSQL cài sẵn (BOT_PG_URL) chỉ vì tên na ná.
const DB_PREFIX = "soulbot_", DB_MARK = "tools/bot-local.mjs";
const ownDbs = async (c) => (await c.query(String.raw`SELECT datname FROM pg_database WHERE datname LIKE 'soulbot\_%' AND shobj_description(oid, 'pg_database') = $1 ORDER BY 1`, [DB_MARK])).rows.map((x) => x.datname);
/** Xoá database của lượt đã chết (chỉ database có dấu của công cụ, chỉ với PostgreSQL ở máy này). */
async function dropStale(c) {
  if (!pgLocal) return;
  for (const datname of await ownDbs(c)) {
    const pid = Number(/_(\d+)$/.exec(datname)?.[1]);
    if (pid && pid !== process.pid && !alive(pid)) {
      await c.query(`DROP DATABASE IF EXISTS ${qid(datname)} WITH (FORCE)`).then(() => console.log(`(xoá database cũ ${datname})`), () => {});
    }
  }
}
async function createDb() {
  const session = (process.env.AO_SESSION_ID || "local").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 30);
  const name = `${DB_PREFIX}${session}_${process.pid}`;
  const c = await pgConnect(adminUrl, false);
  try {
    await dropStale(c);
    const r = await c.query("SELECT shobj_description(oid, 'pg_database') AS mark FROM pg_database WHERE datname = $1", [name]);
    if (r.rows.length && r.rows[0].mark !== DB_MARK) throw new Error(`đã có database ${name} không phải của công cụ, không đụng tới; đổi BOT_PG_URL`);
    if (r.rows.length) await c.query(`DROP DATABASE ${qid(name)} WITH (FORCE)`);
    await c.query(`CREATE DATABASE ${qid(name)} ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`);
    await c.query(`COMMENT ON DATABASE ${qid(name)} IS '${DB_MARK}'`);
  } finally { await c.end(); }
  const u = new URL(adminUrl); u.pathname = `/${name}`;
  return { name, url: u.href };
}
/** BOT_PG_STATS=1: in n_tup_upd / n_dead_tup của `items` và `accounts` trong database của lượt này trước khi xoá (đo ghi thừa, #737). */
async function printPgStats(name) {
  const u = new URL(adminUrl); u.pathname = `/${name}`;
  const c = await pgConnect(u.href);
  if (c.error) return;
  try {
    const r = await c.query("SELECT relname, n_tup_ins, n_tup_upd, n_tup_del, n_dead_tup FROM pg_stat_user_tables WHERE relname IN ('items','accounts') ORDER BY 1");
    for (const x of r.rows) console.log(`📊 ${x.relname}: ins=${x.n_tup_ins} upd=${x.n_tup_upd} del=${x.n_tup_del} dead=${x.n_dead_tup}`);
  } catch (e) { console.log(`⚠ Không đọc được pg_stat: ${e.message}`); }
  finally { await c.end(); }
}
async function dropDb(name) {
  if (process.env.BOT_PG_STATS === "1") await printPgStats(name);
  const c = await pgConnect(adminUrl);
  if (c.error) { console.log(`⚠ Không xoá được database ${name}: ${c.error.message}`); return; }
  try { await c.query(`DROP DATABASE IF EXISTS ${qid(name)} WITH (FORCE)`); console.log(`✓ Đã xoá database ${name}`); }
  catch (e) { console.log(`⚠ Không xoá được database ${name}: ${e.message}`); }
  finally { await c.end(); }
}

if (pgCmd) {
  if (process.env.BOT_PG_URL) { console.log("BOT_PG_URL đang đặt: PostgreSQL đó do bạn tự quản."); process.exit(0); }
  const c = await pgConnect(adminUrl);
  const running = !c.error;
  if (running) {
    console.log(`PostgreSQL chung: đang chạy, cổng ${pgPort}, dữ liệu ${pgData}; database của lượt bot: ${(await ownDbs(c)).join(", ") || "(không)"}`);
    await c.end();
  } else console.log(`PostgreSQL chung: không chạy (cổng ${pgPort}, dữ liệu ${pgData})`);
  if (pgCmd === "--pg-stop" && running) {
    const busy = liveSlots();
    if (busy.length && !force) { console.log(`✗ Còn ${busy.length} lượt bot đang chạy (PID ${busy.map((s) => s.pid).join(", ")}); đợi xong hoặc thêm --force`); process.exit(1); }
    const code = await run((await pgBins()).pg_ctl, ["stop", "-D", pgData, "-m", "fast", "-w"]);
    console.log(code === 0 ? "✓ Đã tắt PostgreSQL chung" : `✗ pg_ctl stop lỗi (mã ${code}), xem ${toolLog}`);
    process.exit(code === 0 ? 0 : 1);
  }
  process.exit(0);
}

// ---------- Build server (esbuild, cache theo hash nguồn) ----------
function hashSources() {
  const h = createHash("sha256");
  const add = (f) => { h.update(path.relative(root, f)); h.update(readFileSync(f)); };
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith(".ts")) add(p);
  } };
  walk(path.join(serverDir, "src"));
  for (const f of readdirSync(path.join(root, "shared")).sort()) if (f.endsWith(".ts")) add(path.join(root, "shared", f));
  add(path.join(serverDir, "tsconfig.json")); add(path.join(serverDir, "package-lock.json"));
  return h.digest("hex").slice(0, 12);
}
async function buildServer() {
  const t0 = Date.now();
  const distDir = path.join(serverDir, "dist");
  // Cùng thư mục cha với src/ để các đường dẫn `new URL("../sql/", import.meta.url)`, `../../shared/assets/` vẫn đúng.
  const out = path.join(distDir, `bot-${hashSources()}.mjs`);
  if (existsSync(out) && existsSync(`${out}.map`)) return { out, cached: true, ms: Date.now() - t0 };
  let esbuild;
  try { esbuild = requireServer("esbuild"); } catch { throw new Error("thiếu esbuild (đi kèm tsx): chạy `npm run install:all`"); }
  const r = await esbuild.build({
    entryPoints: [path.join(serverDir, "src", "index.ts")], bundle: true, platform: "node", format: "esm", target: "node22",
    packages: "external", tsconfig: path.join(serverDir, "tsconfig.json"), sourcemap: true, outfile: out, write: false, logLevel: "warning",
  });
  mkdirSync(distDir, { recursive: true });
  // Ghi file tạm rồi đổi tên: lượt khác trong cùng worktree không đọc phải file viết dở. .map trước để .mjs xuất hiện là đủ cặp.
  const isMap = (f) => Number(f.path.endsWith(".map"));
  for (const f of [...r.outputFiles].sort((a, b) => isMap(b) - isMap(a))) {
    const tmp = `${f.path}.${process.pid}.tmp`;
    writeFileSync(tmp, f.contents);
    try { renameSync(tmp, f.path); } catch (e) { rmSync(tmp, { force: true }); if (!existsSync(f.path)) throw e; }
  }
  // Dọn bản build cũ (quá 1 giờ, lượt đang chạy đã nạp xong file).
  for (const f of readdirSync(distDir)) {
    const p = path.join(distDir, f);
    if (/^bot-[0-9a-f]{12}\.mjs(\.map)?$/.test(f) && !p.startsWith(out)) try { if (Date.now() - statSync(p).mtimeMs > 3_600_000) rmSync(p); } catch {}
  }
  return { out, cached: false, ms: Date.now() - t0 };
}

// ---------- Tiến trình con ----------
// Nạp trước vào server và bot: (1) tự thoát khi lượt này đã chết (bị tắt cứng, không kịp dọn) để không còn tiến trình mồ côi giữ RAM;
// (2) ghi RSS đỉnh / heap đỉnh mỗi giây ra file để báo cáo (Windows tắt con bằng TerminateProcess, không có sự kiện exit).
const preload = "data:text/javascript," + encodeURIComponent(`
import { writeFileSync } from "node:fs";
const parent = Number(process.env.BOT_LOCAL_PARENT), file = process.env.BOT_LOCAL_STATS; let heap = 0;
const tick = () => {
  try { process.kill(parent, 0); } catch (e) { if (e.code !== "EPERM") process.exit(1); }
  heap = Math.max(heap, process.memoryUsage().heapUsed);
  try { writeFileSync(file, JSON.stringify({ rss: process.resourceUsage().maxRSS * 1024, heap })); } catch {}
};
setInterval(tick, 1000).unref(); tick();`);
const children = new Set();
const logDir = path.join(root, "ci-logs");
const stamp = `local-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}-${process.pid}`;
const readStats = (f) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch { return null; } };

function spawnNode(script, { cwd, env, log, stats, onLine }) {
  const p = spawn(process.execPath, [`--max-old-space-size=${opt.heap}`, "--enable-source-maps", "--import", preload, script], {
    cwd, env: { ...env, BOT_LOCAL_PARENT: String(process.pid), BOT_LOCAL_STATS: stats }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  children.add(p);
  const w = createWriteStream(log, { flags: "a" });
  // close (không phải exit): đã đọc hết stdout / stderr, không mất dòng cuối của bot; chờ cả file log ghi xong (--fatal đọc log ngay sau).
  p.done = new Promise((r) => p.on("close", (code, sig) => { children.delete(p); w.end(() => r(code ?? (sig ? 1 : 0))); }));
  for (const s of [p.stdout, p.stderr]) {
    let buf = "";
    s.on("data", (d) => { w.write(d); buf += d; const lines = buf.split("\n"); buf = lines.pop(); for (const l of lines) onLine?.(l.replace(/\r$/, "")); });
  }
  return p;
}
/** Bật redis-server riêng của lượt này (cổng trống, không lưu đĩa); trả { p, url }. Chỉ tắt đúng tiến trình này (kill / cleanup). */
async function startRedis() {
  const bin = process.env.BOT_REDIS_BIN?.trim() || "redis-server", port = await freePort();
  let ready = false, err = "";
  const p = spawn(bin, ["--port", String(port), "--bind", "127.0.0.1", "--save", "", "--appendonly", "no"], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  p.on("error", (e) => { err = String(e); });
  children.add(p);
  p.done = new Promise((r) => p.on("close", (code, sig) => { children.delete(p); r(code ?? (sig ? 1 : 0)); }));
  p.stdout.on("data", (d) => { if (String(d).includes("Ready to accept connections")) ready = true; });
  p.stderr.resume();
  const t0 = Date.now();
  while (!ready) {
    if (err || p.exitCode !== null || p.signalCode !== null || Date.now() - t0 > 15_000) {
      await kill(p);
      die(`không bật được redis-server (${bin}): ${err || "không sẵn sàng"}. Cài redis-server, đặt BOT_REDIS_BIN, hoặc truyền --env REDIS_URL=redis://127.0.0.1:<cổng>`);
    }
    await sleep(50);
  }
  return { p, url: `redis://127.0.0.1:${port}` };
}
const kill = async (p) => { if (p && p.exitCode === null && p.signalCode === null) { p.kill(); await p.done; } };
const tail = (f, n) => { try { return readFileSync(f, "utf8").split("\n").slice(-n).join("\n"); } catch { return ""; } };
/** Cổng TCP còn trống do hệ điều hành cấp (dải động, không đụng các cổng 26xx–31xx các phiên hay dùng). */
const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer(); s.unref(); s.on("error", reject);
  s.listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

// ---------- Dọn khi thoát (cả Ctrl+C / lỗi) ----------
let slot = "", db = null, cleaning = null;
function cleanup() {
  cleaning ??= (async () => {
    for (const p of [...children]) await kill(p).catch(() => {});
    if (db) { const n = db.name; db = null; await dropDb(n); }
    if (slot) { releaseLock(slot); slot = ""; }
  })();
  return cleaning;
}
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) {
  process.on(sig, () => { console.log(`\n✗ Nhận ${sig}: dọn tiến trình con / database rồi thoát`); cleanup().finally(() => process.exit(130)); });
}
process.on("exit", () => { for (const p of children) try { p.kill(); } catch {} if (slot) releaseLock(slot); });

// ---------- Lượt chạy ----------
async function startServer(port, env, log, stats) {
  const t0 = Date.now();
  let ready = false;
  const p = spawnNode(build.out, { cwd: serverDir, env, log, stats, onLine: (l) => { if (l.includes(`http://localhost:${port}`)) ready = true; } });
  // Chờ dòng "chạy tại http://localhost:<cổng>" của chính tiến trình con (không hỏi /health, kẻo nối nhầm server của phiên khác).
  while (!ready) {
    if (p.exitCode !== null || p.signalCode !== null) throw new Error(`server thoát trước khi sẵn sàng (mã ${p.exitCode}); log ${log}:\n${tail(log, 40)}`);
    if (Date.now() - t0 > 90_000) { await kill(p); throw new Error(`server không sẵn sàng sau 90 giây; log ${log}:\n${tail(log, 40)}`); }
    await sleep(100);
  }
  return { p, ms: Date.now() - t0 };
}

/**
 * --fatal (#270): mỗi kiểu lỗi (ném lỗi trong hẹn giờ ngoài phòng, promise bị từ chối không ai bắt) một lượt: fatal-test.mjs pha crash
 * gọi hook `crash` -> server phải tự thoát mã ≠ 0, log có lỗi kèm stack và dòng đã lưu người chơi; với --pg bật lại server trên cùng
 * database, pha verify kiểm vị trí / cấp / kinh nghiệm đã lưu. Kết quả qua các dòng ✓ / ✗ gửi cho onLine. Mỗi lần bật lại server lấy cổng
 * trống mới (cổng cũ đã nhả có thể đã về tay lượt bot khác).
 */
async function fatalRun(server, port, senv, env, slog, blog, sstats, onLine) {
  const check = (c, msg) => onLine(`${c ? "✓" : "✗"} ${msg}`);
  const restart = async () => { port = await freePort(); return startServer(port, { ...senv, PORT: String(port) }, slog, sstats); };
  const stats = path.join(os.tmpdir(), `soul-bot-${process.pid}-fatal.json`);
  const script = (phase, kind, file) => spawnNode(path.join(clientDir, "scripts", "fatal-test.mjs"), {
    cwd: clientDir, log: blog, stats, onLine,
    env: { ...env, SERVER_URL: `http://localhost:${port}`, FATAL_PHASE: phase, FATAL_KIND: kind, FATAL_FILE: file },
  }).done;
  for (const kind of ["throw", "reject"]) {
    const file = path.join(os.tmpdir(), `soul-bot-${process.pid}-fatal-${kind}.json`);
    try {
      if (!server) server = await restart();
      const from = statSync(slog).size;
      check(await script("crash", kind, file) === 0, `[${kind}] pha crash của fatal-test.mjs đạt`);
      const exit = await Promise.race([server.p.done, sleep(20_000).then(() => null)]);
      if (exit === null) await kill(server.p);
      server = null;
      const log = readFileSync(slog).subarray(from).toString("utf8"); // `from` tính theo byte
      check(exit !== null && exit !== 0, `[${kind}] server tự thoát sau lỗi, mã ${exit ?? "(không thoát sau 20 giây, đã tắt)"}`);
      const msg = kind === "reject" ? "promise bị từ chối không ai bắt (#270)" : "lỗi cố ý ngoài phòng (#270)";
      check(/Lỗi nghiêm trọng ngoài phòng/.test(log) && log.includes(msg) && /\n\s+at /.test(log.slice(log.indexOf(msg))),
        `[${kind}] log server có lỗi kèm stack: ${log.match(/Lỗi nghiêm trọng ngoài phòng[^\n]*/)?.[0] ?? "(không có)"}`);
      check(/Tắt server: đã lưu người chơi đang online, đã đóng kết nối DB; thoát mã 1/.test(log),
        `[${kind}] log server: ${log.match(/Tắt server:[^\n]*/)?.[0] ?? "(không có dòng tắt server)"}`);
      if (opt.pg) {
        server = await restart();
        check(await script("verify", kind, file) === 0, `[${kind}] PostgreSQL: dữ liệu đã lưu trước khi thoát`);
      }
    } finally {
      rmSync(file, { force: true }); // có mật khẩu tài khoản thử
    }
  }
  if (server) await kill(server.p);
  rmSync(stats, { force: true }); rmSync(sstats, { force: true });
}

const what = opt.only ? `only=${opt.only}` : opt.part ? `part=${opt.part}` : opt.channels ? "channels" : opt.fatal ? "fatal" : "full";
const label = `${what}${opt.pg ? " pg" : ""}`;
let build;
let seedEnv = {};
let code = 1;
const tAll = Date.now();
try {
  build = await buildServer();
  console.log(`[bot-local ${label}] server ${build.cached ? "dùng bản build sẵn" : `build xong sau ${build.ms} ms`}: ${path.relative(root, build.out)}`);
  slot = await acquireSlot(`${label} @ ${path.basename(root)}`);
  mkdirSync(logDir, { recursive: true });
  const slog = path.join(logDir, `${stamp}-server.log`), blog = path.join(logDir, `${stamp}-bot.log`);
  const sstats = path.join(os.tmpdir(), `soul-bot-${process.pid}-server.json`), bstats = path.join(os.tmpdir(), `soul-bot-${process.pid}-bot.json`);
  const env = { ...process.env };
  for (const k of ["DATABASE_URL", "PGSSL", "PORT", "CHANNEL_MAX", "BOT_ONLY", "BOT_PART", "SERVER_URL", "NODE_OPTIONS", "REDIS_URL", "REDIS_PREFIX", "PUBLIC_ADDRESS"]) delete env[k];
  const senv = { ...env, GAME_TEST: "1" };
  if (opt.channels) senv.CHANNEL_MAX = "2";
  for (const e of opt.env) { const i = e.indexOf("="); senv[e.slice(0, i)] = e.slice(i + 1); }
  if (opt.procs > 1) {
    if (!senv.REDIS_URL) { const r = await startRedis(); senv.REDIS_URL = r.url; console.log(`[bot-local ${label}] redis-server riêng ${r.url} (PID ${r.p.pid})`); }
    if (!/^redis:\/\/(127\.0\.0\.1|localhost)[:/]/.test(senv.REDIS_URL ?? "")) die("--procs > 1 cần --env REDIS_URL=redis://127.0.0.1:<cổng> (Redis cục bộ)");
    senv.REDIS_PREFIX = `soulbot:${process.pid}`;
  }
  if (opt.pg) {
    const t0 = Date.now();
    await ensurePg();
    db = await createDb();
    Object.assign(senv, { DATABASE_URL: db.url, PGSSL: "false" });
    console.log(`[bot-local ${label}] database ${db.name} sẵn sàng sau ${secs(t0)}`);
    if (opt.seedTest) {
      // Dựng tài khoản test (#517) vào database riêng của lượt này: script tự chạy migration (is_test) rồi ghi một transaction.
      const name = `BotTest${opt.seedTest.replace(/\W/g, "")}${process.pid}`, pass = `pw-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      const r = spawnSync(process.execPath, ["--import", "tsx", "scripts/seed-test-account.ts", "--name", name, "--preset", opt.seedTest, "--password", pass, "--confirm-db", new URL(db.url).hostname],
        { cwd: serverDir, env: { ...env, DATABASE_URL: db.url, PGSSL: "false" }, encoding: "utf8", windowsHide: true });
      console.log((r.stdout ?? "").trimEnd());
      if (r.status !== 0) die(`dựng tài khoản test thất bại: ${(r.stderr ?? "").trim()}`);
      seedEnv = { BOT_TEST_NAME: name, BOT_TEST_PASS: pass, BOT_TEST_PRESET: opt.seedTest };
    }
  }
  const port = await freePort();
  senv.PORT = String(port);
  if (opt.procs > 1) senv.PUBLIC_ADDRESS = `localhost:${port}`;
  let server = await startServer(port, senv, slog, sstats);
  if (opt.pg && !opt.once) {
    // Migration phải chạy lại an toàn: tắt rồi bật lại trên cùng database (CLAUDE.md, mục Lệnh).
    await kill(server.p);
    server = await startServer(port, senv, slog, sstats);
    console.log(`[bot-local ${label}] server bật lần 2 (migration chạy lại) sẵn sàng sau ${server.ms} ms, cổng ${port}`);
  } else console.log(`[bot-local ${label}] server sẵn sàng sau ${server.ms} ms, cổng ${port}`);

  const extras = [];
  for (let i = 1; i < opt.procs; i++) {
    const xp = await freePort(), xlog = path.join(logDir, `${stamp}-server${i + 1}.log`), xstats = path.join(os.tmpdir(), `soul-bot-${process.pid}-server${i + 1}.json`);
    extras.push({ ...(await startServer(xp, { ...senv, PORT: String(xp), PUBLIC_ADDRESS: `localhost:${xp}` }, xlog, xstats)), xstats });
    console.log(`[bot-local ${label}] tiến trình server ${i + 1}/${opt.procs} cổng ${xp}, log ${path.relative(root, xlog)}`);
  }

  if (opt.fatal) {
    const n = { "✓": 0, "✗": 0 };
    await fatalRun(server, port, senv, env, slog, blog, sstats, (l) => { console.log(l); for (const k of Object.keys(n)) if (l.trimStart().startsWith(k)) n[k]++; });
    code = n["✗"] ? 1 : 0;
    console.log(`[bot-local ${label}] ${code === 0 ? "ĐẠT" : "TRƯỢT"}: ✓ ${n["✓"]}, ✗ ${n["✗"]}; tổng ${secs(tAll)}; log: ${path.relative(root, slog)}, ${path.relative(root, blog)}`);
  } else {
    const benv = { ...env, ...seedEnv, SERVER_URL: `http://localhost:${port}` };
    if (opt.only) benv.BOT_ONLY = opt.only;
    if (opt.part) benv.BOT_PART = opt.part;
    for (const e of opt.env) if (e.startsWith("MAP_V1=")) benv.MAP_V1 = e.slice(7); // bot cần cùng bản đồ với server
    const n = { "✓": 0, "✗": 0, "⚠": 0 };
    const tBot = Date.now();
    const bot = spawnNode(path.join(clientDir, "scripts", "bot-test.mjs"), {
      cwd: clientDir, env: benv, log: blog, stats: bstats,
      onLine: (l) => { console.log(l); for (const k of Object.keys(n)) if (l.trimStart().startsWith(k)) n[k]++; },
    });
    let serverDied = false;
    server.p.done.then(() => { if (bot.exitCode === null) { serverDied = true; console.log("✗ server chết trong lúc chạy bot"); kill(bot); } });
    code = await bot.done;
    if (serverDied) { code = 1; console.log(`---- log server (60 dòng cuối, đầy đủ ở ${slog}) ----\n${tail(slog, 60)}`); }
    await kill(server.p);
    for (const x of extras) { await kill(x.p); rmSync(x.xstats, { force: true }); }
    const ss = readStats(sstats), bs = readStats(bstats);
    rmSync(sstats, { force: true }); rmSync(bstats, { force: true });
    console.log(`[bot-local ${label}] ${code === 0 ? "ĐẠT" : `TRƯỢT (mã ${code})`}: ✓ ${n["✓"]}, ✗ ${n["✗"]}, ⚠ ${n["⚠"]}; bot ${secs(tBot)}, tổng ${secs(tAll)}`);
    console.log(`[bot-local ${label}] RAM đỉnh: server RSS ${ss ? mb(ss.rss) : "?"} (heap ${ss ? mb(ss.heap) : "?"}), bot RSS ${bs ? mb(bs.rss) : "?"}; trần heap ${opt.heap} MB`);
    console.log(`[bot-local ${label}] log: ${path.relative(root, slog)}, ${path.relative(root, blog)}`);
  }
} catch (e) {
  console.error(`✗ [bot-local ${label}] ${e.message}`);
  code = 1;
} finally {
  await cleanup();
}
process.exit(code);
