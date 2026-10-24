// Tạo / dựng lại / xoá tài khoản TEST (#517): max, giữa game, mới. Hướng dẫn từng bước cho chủ repo: docs/test-accounts.md.
//
//   npm run seed:test --prefix server -- --name <tên> --preset max|giua-game|moi            # CHẠY THỬ: chỉ in, không nối DB
//   npm run seed:test --prefix server -- --name <tên> --preset max --confirm-db <host>      # ghi thật (host = host trong DATABASE_URL)
//   npm run seed:test --prefix server -- --name <tên> --remove --confirm-db <host>          # xoá sạch tài khoản test
//
// An toàn (đọc kỹ trước khi sửa):
//  - Mặc định chạy thử, KHÔNG nối DB. Chỉ nối khi có `--confirm-db <host>` khớp host của DATABASE_URL; script không tự đọc server/.env
//    (DATABASE_URL phải do chính bạn đặt trong phiên shell). `--dry-run` kèm `--confirm-db`: nối chỉ đọc (không chạy migration), báo tài khoản đã có chưa.
//  - Không chạy khi có biến CI. Chỉ đụng đúng tài khoản `--name`; tài khoản không có cờ is_test thì từ chối (cả ghi đè lẫn xoá).
//  - Từ chối khi tài khoản đang online (khoá phiên trong Redis nếu có REDIS_URL, không thì phiên đăng nhập trong 30 phút gần nhất; `--force-offline` bỏ
//    qua heuristic này khi bạn đã chắc), vì server ghi đè dữ liệu lúc người chơi thoát.
//  - Mọi thay đổi trong MỘT transaction (Store.seedTestAccount / removeTestAccount, server/src/db.ts).
import { parseArgs } from "node:util";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { PgStore } from "../src/db.ts";
import { cleanName } from "../src/names.ts";
import { buildPreset, describeSeed, isPresetId, PRESETS } from "../src/testPreset.ts";

/** Phiên đăng nhập trong chừng này mili giây gần nhất coi như có thể đang online khi không có Redis để hỏi khoá phiên. */
const RECENT_LOGIN_MS = 30 * 60_000;

const { values: a } = parseArgs({
  options: {
    name: { type: "string" }, password: { type: "string" }, preset: { type: "string" }, remove: { type: "boolean", default: false },
    "confirm-db": { type: "string" }, "dry-run": { type: "boolean", default: false }, "force-offline": { type: "boolean", default: false }, help: { type: "boolean", default: false },
  },
  allowPositionals: false,
});

const die = (msg: string): never => { console.error(`✗ ${msg}`); process.exit(1); };
if (a.help) {
  console.log(`Dùng: npm run seed:test --prefix server -- --name <tên> --preset ${PRESETS.join("|")} [--password <mk>] [--confirm-db <host>] [--dry-run] [--force-offline]
      npm run seed:test --prefix server -- --name <tên> --remove --confirm-db <host>
Không có --confirm-db: chỉ in thay đổi (chạy thử), không nối DB. Chi tiết: docs/test-accounts.md.`);
  process.exit(0);
}
if (process.env.CI) die("Không chạy công cụ tài khoản test trong CI.");
const name = cleanName(a.name ?? "");
if (!name) die("Thiếu --name <tên tài khoản test>.");
if (!a.remove && !isPresetId(a.preset)) die(`Thiếu hoặc sai --preset (một trong: ${PRESETS.join(", ")}).`);

const preset = !a.remove && isPresetId(a.preset) ? a.preset : null;
const seed = preset ? buildPreset(preset) : null;

console.log(`${a.remove ? "Xoá" : `Dựng mức "${preset}" cho`} tài khoản test "${name}"`);
if (seed) for (const line of describeSeed(seed)) console.log(`  • ${line}`);
else console.log("  • Xoá: items, teams, vohons, quests, waypoints, boss_claims, auto_hunt, auto_offline, tong_points, arena_ratings, arena_pairs, friends, blocks, sessions, characters, inventory, accounts (chỉ dòng của tài khoản này).");

const confirm = a["confirm-db"]?.trim();
if (!confirm) {
  console.log("\nCHẠY THỬ: chưa nối DB, chưa ghi gì. Ghi thật: thêm --confirm-db <host trong DATABASE_URL>.");
  process.exit(0);
}
const url = process.env.DATABASE_URL?.trim();
if (!url) die("Thiếu DATABASE_URL trong môi trường (script không tự đọc server/.env: đặt biến trong phiên shell rồi chạy lại).");
let host: URL;
try { host = new URL(url!); } catch { host = die("DATABASE_URL không đúng dạng URL."); }
if (![host.host, host.hostname].some((h) => h.toLowerCase() === confirm.toLowerCase()))
  die(`--confirm-db "${confirm}" không khớp host của DATABASE_URL ("${host.host}"). Không nối DB.`);

const store = new PgStore(url!);
// presence.ts tự nối Redis khi import nếu có REDIS_URL, nên chỉ nạp sau khi đã qua --confirm-db (chạy thử không nối gì).
const { presenceBackend, accountLeaseKey } = await import("../src/presence.ts");
const presence = presenceBackend.mode === "redis" ? presenceBackend : null;

async function readPassword() {
  if (a.password) return a.password;
  if (!process.stdin.isTTY) die("Tài khoản chưa có: cần --password <mật khẩu> (hoặc chạy trong terminal để nhập ẩn).");
  const mute = new Writable({ write(chunk, _enc, cb) { if (!muted) process.stdout.write(chunk); cb(); } });
  let muted = false;
  const rl = createInterface({ input: process.stdin, output: mute, terminal: true });
  process.stdout.write(`Mật khẩu cho tài khoản mới "${name}": `);
  muted = true;
  const pw = await new Promise<string>((r) => rl.question("", r));
  rl.close(); process.stdout.write("\n");
  return pw;
}

async function main() {
  const dry = a["dry-run"];
  if (!dry) await store.init(); // chạy mọi file server/sql (cùng việc server làm lúc khởi động): cần cho cột is_test (028)
  const acc = await store.lookupAccount(name).catch((e) => {
    if (dry && /is_test/.test((e as Error).message)) { console.log("  Lưu ý: DB chưa có cột is_test (chưa chạy migration 028); lần ghi thật sẽ chạy migration trước."); return null; }
    throw e;
  });
  console.log(acc ? `Tài khoản đã có (#${acc.id}, ${acc.isTest ? "có cờ is_test" : "KHÔNG có cờ is_test"}).` : "Tài khoản chưa có.");
  if (acc && !acc.isTest) die(`Tài khoản "${name}" là tài khoản thật (không có is_test): từ chối ${a.remove ? "xoá" : "ghi đè"}.`);
  if (a.remove && !acc) die(`Không có tài khoản "${name}" để xoá.`);
  if (acc) {
    if (presence) {
      const held = await presence.get(accountLeaseKey(acc.id));
      if (held) die(`Tài khoản "${name}" đang online (có khoá phiên trong Redis). Thoát game rồi chạy lại.`);
    } else if (!a["force-offline"] && acc.lastLogin !== null && Date.now() - acc.lastLogin < RECENT_LOGIN_MS)
      die(`Tài khoản "${name}" vừa đăng nhập ${Math.round((Date.now() - acc.lastLogin) / 60_000)} phút trước, có thể đang online (không có REDIS_URL để hỏi chắc). Thoát game, đợi, hoặc thêm --force-offline nếu đã chắc.`);
  }
  if (dry) { console.log("\nCHẠY THỬ (--dry-run): đã nối chỉ đọc, chưa ghi gì."); return; }
  if (a.remove) {
    const n = await store.removeTestAccount(name);
    console.log("\n✓ Đã xoá tài khoản test, số dòng mỗi bảng:");
    for (const [t, c] of Object.entries(n)) console.log(`    ${t}: ${c}`);
    return;
  }
  const pw = acc ? null : await readPassword();
  const r = await store.seedTestAccount(name, pw, seed!);
  console.log(`\n✓ ${r.created ? "Đã tạo" : "Đã dựng lại"} tài khoản test "${name}" (#${r.accountId}) mức "${preset}". Đăng nhập bằng đúng tên đó${r.created ? " và mật khẩu vừa đặt" : " (mật khẩu giữ nguyên)"}.`);
}

main().then(
  async () => { await Promise.allSettled([store.close(), presenceBackend.close()]); process.exit(0); },
  async (e) => { console.error(`✗ ${(e as Error).message}`); await Promise.allSettled([store.close(), presenceBackend.close()]); process.exit(1); },
);
