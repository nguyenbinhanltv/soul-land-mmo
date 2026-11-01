// Đo luồng di chuyển của bản đồ (L0 #1658; bản thiết kế cải tổ luồng di chuyển bản đồ (PR #1656) phần 0). CHỈ ĐỌC: không ghi dữ liệu bản đồ.
//   node tools/maps/do-luong.mjs [mapId…]            bảng chỉ số 0.2 cho mọi bản đồ (hoặc các mapId nêu tên)
//   node tools/maps/do-luong.mjs --png <thư mục>     kèm ảnh bề ngang ô mỗi bản đồ (xanh rộng → đỏ hẹp, đen chặn, trắng mốc)
//   node tools/maps/do-luong.mjs --sinh              kèm soát chỗ sinh hồn thú: bao nhiêu chỗ nằm ở ô khe 1 ô / sau khe (đúng luật spawn.ts)
//   node tools/maps/do-luong.mjs --tuyen             kèm từng tuyến trại hồi sinh → mốc (giây, đoạn cổ chai, ngang tuyến rộng nhất)
//   node tools/maps/do-luong.mjs --json              in JSON thay bảng (L2–L5 so trước / sau)
//   node tools/maps/do-luong.mjs --canh-bao [--strict]  chỉ in bản đồ vượt chỉ tiêu mục 1.1 (lib/nguong.mjs); thoát 0, --strict thì thoát 1 nếu có vượt (L4 #1662; `npm run check` gọi lệnh này, LUONG_STRICT=1 = --strict)
// Dùng file Tiled đang chạy trong game (`<mapId>.v2.json` nếu có, không thì `<mapId>.json`), cùng lưới ô chặn với server (shared/move.ts).
// Hàm đo thuần ở lib/luong.mjs (kiểm thử: lib/luong.test.mjs). `--canh-bao` chạy trong `npm run check` (chỉ cảnh báo).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gridStats, shortestPath, chokeRuns, widestPath } from "./lib/luong.mjs";
import { violations, GROUP_OF_KIND } from "./lib/nguong.mjs";
import { Img, encodePng, hex } from "../assets/lib.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const ASSETS = path.join(ROOT, "shared", "assets"), LAYOUTS = path.join(ROOT, "tools", "maps", "layouts");
const { solidGrid, hits } = await import(pathToFileURL(path.join(ROOT, "shared", "move.ts")).href);
const { TILE, PLAYER_SPEED, SPAWN_CLEAR, MAPS } = await import(pathToFileURL(path.join(ROOT, "shared", "data.ts")).href);

/** Tuyến bỏ qua nếu mốc đứng ngay trong trại (đường ngắn nhất dưới ngưỡng này, đơn vị ô): không phải đoạn đường người chơi phải đi. */
const MIN_ROUTE = 20;
/** Spawn.ts thử hộp 6×4 px quanh điểm (hộp 12×8); bước lấy mẫu 4 px. */
const SPAWN_HW = 6, SPAWN_HH = 4, STEP = 4;

/** Danh sách mapId đo được: mọi bố cục trong tools/maps/layouts (11 bản đồ), kèm file Tiled đang dùng. */
function mapList() {
  return readdirSync(LAYOUTS).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort().map((id) => {
    const file = existsSync(path.join(ASSETS, `${id}.v2.json`)) ? `${id}.v2.json` : `${id}.json`;
    return { id, file };
  });
}

const objectsOf = (raw) => raw.layers.filter((l) => l.type === "objectgroup").flatMap((l) => l.objects);
const prop = (o, n) => (o.properties ?? []).find((p) => p.name === n)?.value;
const centerCell = (o, MW) => Math.floor((o.y + (o.height || 0) / 2) / TILE) * MW + Math.floor((o.x + (o.width || 0) / 2) / TILE);

/** Mốc của bản đồ: trại hồi sinh (spawn), cổng, truyền tống trận, tinh anh, hang thú vương (đúng object trong file Tiled). */
function landmarks(raw, g) {
  const kinds = { spawn: "trại", portal: "cổng", waypoint: "truyền tống", elite: "tinh anh", boss: "hang" };
  const out = [];
  for (const o of objectsOf(raw)) {
    if (!kinds[o.type]) continue;
    let cell = centerCell(o, g.MW);
    if (g.solid[cell]) { // tâm rơi vào ô chặn: lấy ô đi được gần nhất trong 3 ô
      const x0 = cell % g.MW, y0 = (cell - x0) / g.MW; let best = -1, bd = 1e9;
      for (let y = y0 - 3; y <= y0 + 3; y++) for (let x = x0 - 3; x <= x0 + 3; x++) {
        const i = y * g.MW + x; if (x < 0 || y < 0 || x >= g.MW || y >= g.MH || g.solid[i]) continue;
        const d = Math.hypot(x - x0, y - y0); if (d < bd) { bd = d; best = i; }
      }
      cell = best;
    }
    if (cell >= 0) out.push({ type: o.type, name: o.name || o.type, cell });
  }
  return out;
}

/** Tuyến từ trại hồi sinh tới từng mốc còn lại (bỏ mốc trong trại): giây đi bộ, đoạn cổ chai, bề ngang tuyến rộng nhất. */
function routes(g, W, marks) {
  const from = marks.find((m) => m.type === "spawn");
  if (!from) return [];
  const out = [];
  for (const m of marks) {
    if (m === from) continue;
    const p = shortestPath(g, from.cell, m.cell);
    if (!p || p.len < MIN_ROUTE) continue;
    out.push({ to: m.name, type: m.type, tiles: p.len, secs: (p.len * TILE) / PLAYER_SPEED, choke: chokeRuns(W, p.cells), widest: widestPath(g, W, from.cell, m.cell), cells: p.cells });
  }
  return out;
}

/**
 * Soát sinh hồn thú (đúng luật server/src/rooms/spawn.ts `spawnBeast` / `spawnElite`): điểm ngẫu nhiên trong chữ nhật vùng,
 * bị loại nếu hộp 12×8 px chạm ô chặn (khe 1 ô rộng 16 px vẫn lọt), vùng an toàn, SPAWN_CLEAR quanh trại / cổng / trận / điểm xuất hiện.
 * Đếm tỷ lệ chỗ sinh được nằm ở ô khe 1 ô (bề ngang 1) hoặc ô sau khe (ngoài thành phần rộng chính). Lấy mẫu mỗi STEP px.
 */
function spawnAudit(raw, g, W, wide) {
  const objs = objectsOf(raw), safe = objs.filter((o) => o.type === "safe");
  const gates = [...objs.filter((o) => o.type === "spawn" || o.type === "portal" || o.type === "waypoint").map((o) => ({ x: o.x, y: o.y, w: o.width || 0, h: o.height || 0 })),
    ...objs.filter((o) => o.type === "arrive").map((o) => ({ x: o.x, y: o.y, w: 0, h: 0 }))];
  const inR = (r, x, y) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  const nearGate = (x, y) => gates.some((r) => x > r.x - SPAWN_CLEAR && x < r.x + r.w + SPAWN_CLEAR && y > r.y - SPAWN_CLEAR && y < r.y + r.h + SPAWN_CLEAR);
  const rows = [];
  const scan = (name, kind, x0, x1, y0, y1) => {
    let ok = 0, gap1 = 0, behind = 0;
    for (let y = y0; y <= y1; y += STEP) for (let x = x0; x <= x1; x += STEP) {
      if (hits(g, x, y, SPAWN_HW, SPAWN_HH) || safe.some((r) => inR(r, x, y)) || nearGate(x, y)) continue;
      ok++;
      const c = Math.floor(y / TILE) * g.MW + Math.floor(x / TILE);
      if (W[c] === 1) gap1++; else if (!wide[c]) behind++;
    }
    rows.push({ name, kind, ok, gap1, behind });
  };
  for (const o of objs) {
    if (o.type === "zone") scan(o.name, "vùng", o.x + 8, o.x + o.width - 8, o.y + 24, o.y + o.height - 24); // spawnBeast: biên 8 / 24 px
    if (o.type === "elite") scan(o.name || prop(o, "boss"), "tinh anh", o.x + 6, o.x + Math.max(6, o.width - 6), o.y + 6, o.y + Math.max(6, o.height - 6));
  }
  return rows;
}

/** Ô "rộng": ngang ≥ 2 và thuộc thành phần rộng (4 hướng) lớn nhất. Cùng định nghĩa với behindGap. */
function wideMask(g, W) {
  const { MW, MH } = g, comp = new Int32Array(MW * MH).fill(-1), sizes = [];
  for (let s = 0; s < MW * MH; s++) {
    if (W[s] < 2 || comp[s] >= 0) continue;
    const id = sizes.length; let n = 0; const st = [s]; comp[s] = id;
    while (st.length) {
      const i = st.pop(); n++; const x = i % MW, y = (i - x) / MW;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= MW || Y >= MH) continue;
        const k = Y * MW + X; if (W[k] >= 2 && comp[k] < 0) { comp[k] = id; st.push(k); }
      }
    }
    sizes.push(n);
  }
  const main = sizes.indexOf(Math.max(...sizes, 0)), m = new Uint8Array(MW * MH);
  for (let i = 0; i < m.length; i++) if (comp[i] === main && main >= 0) m[i] = 1;
  return m;
}

/** Ảnh bề ngang ô: mỗi ô 3 điểm; chặn đen, ngang 1 đỏ → ≥ 5 xanh, mốc trắng. */
function widthPng(g, W, marks) {
  const S = 3, img = new Img(g.MW * S, g.MH * S);
  const ramp = ["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60", "#1a9850"].map((c) => [...hex(c), 255]);
  const box = (x, y, c, r = 0) => { for (let yy = y * S - r; yy < (y + 1) * S + r; yy++) for (let xx = x * S - r; xx < (x + 1) * S + r; xx++) if (xx >= 0 && yy >= 0 && xx < img.w && yy < img.h) img.set(xx, yy, c); };
  for (let y = 0; y < g.MH; y++) for (let x = 0; x < g.MW; x++) { const i = y * g.MW + x; box(x, y, g.solid[i] ? [20, 20, 24, 255] : ramp[Math.min(W[i], 6) - 1]); }
  for (const m of marks) box(m.cell % g.MW, Math.floor(m.cell / g.MW), [255, 255, 255, 255], 4);
  return encodePng(img);
}

const strictTag = (o) => (o.strict ? "LỖI (--strict): " : "Cảnh báo: ");
const f = (n, d = 1) => n.toFixed(d).replace(".", ",");

function measure(mp, opt) {
  const raw = JSON.parse(readFileSync(path.join(ASSETS, mp.file), "utf8")), g = solidGrid(raw), st = gridStats(g), W = st.W, marks = landmarks(raw, g);
  const rs = opt.nhanh ? [] : routes(g, W, marks), n = rs.length; // --canh-bao bỏ tuyến (A*) cho nhanh
  const res = {
    id: mp.id, kind: MAPS[mp.id]?.kind, ten: MAPS[mp.id]?.name ?? mp.id, file: mp.file, cols: g.MW, rows: g.MH,
    chanCung: st.solidPct, chanTrong: st.solidInnerPct, ngangTB: st.meanW, hepPct: st.narrowPct, thoangPct: st.open5Pct,
    nhoPct: st.smallBlockPct, kepCheo: st.pinchPer1000, ngoCut: st.deadEndPer1000, sauKhe: st.behindGap, thanhPhan: st.components,
    coChai: n ? rs.reduce((a, r) => a + r.choke, 0) : null, tuyen: n,
    ngangTuyen: n ? rs.reduce((a, r) => a + r.widest, 0) / n : null, giayTB: n ? rs.reduce((a, r) => a + r.secs, 0) / n : null,
  };
  if (opt.tuyen) res.dsTuyen = rs.map(({ cells, ...r }) => r);
  if (opt.sinh) res.sinh = spawnAudit(raw, g, W, wideMask(g, W));
  if (opt.png) { mkdirSync(opt.png, { recursive: true }); writeFileSync(path.join(opt.png, `${mp.id}.luong.png`), widthPng(g, W, marks)); }
  return res;
}

function table(rows) {
  const head = ["Bản đồ", "Cỡ ô", "Chặn %", "Ngang TB", "≤2 ô %", "≥5×5 %", "Kẹt chéo/1000", "Ngõ cụt/1000", "Sau khe", "Cổ chai", "Ngang tuyến", "Giây TB"];
  const body = rows.map((r) => [r.ten, `${r.cols}×${r.rows}`, f(r.chanCung), f(r.ngangTB, 2), f(r.hepPct), f(r.thoangPct), f(r.kepCheo), f(r.ngoCut), String(r.sauKhe),
    r.coChai === null ? "–" : `${r.coChai} / ${r.tuyen} tuyến`, r.ngangTuyen === null ? "–" : f(r.ngangTuyen), r.giayTB === null ? "–" : f(r.giayTB)]);
  const w = head.map((h, i) => Math.max(h.length, ...body.map((b) => [...b[i]].length)));
  const line = (c) => c.map((s, i) => (i ? s.padStart(w[i]) : s.padEnd(w[i]))).join(" | ");
  return [line(head), w.map((x) => "-".repeat(x)).join("-|-"), ...body.map(line)].join("\n");
}

const argv = process.argv.slice(2), opt = { canhBao: false, strict: process.env.LUONG_STRICT === "1", nhanh: false, png: null, sinh: false, tuyen: false, json: false }, ids = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--png") opt.png = path.resolve(argv[++i] ?? "");
  else if (argv[i] === "--sinh") opt.sinh = true;
  else if (argv[i] === "--tuyen") opt.tuyen = true;
  else if (argv[i] === "--json") opt.json = true;
  else if (argv[i] === "--canh-bao") opt.canhBao = opt.nhanh = true;
  else if (argv[i] === "--strict") opt.strict = true;
  else if (argv[i].startsWith("--")) { console.error(`Cờ lạ: ${argv[i]}`); process.exit(2); }
  else ids.push(argv[i]);
}
const all = mapList(), pick = ids.length ? all.filter((m) => ids.includes(m.id)) : all;
for (const id of ids) if (!all.some((m) => m.id === id)) { console.error(`Không có bản đồ: ${id} (có: ${all.map((m) => m.id).join(", ")})`); process.exit(2); }
const rows = pick.map((m) => measure(m, opt));

if (opt.canhBao) {
  const fmt = (v) => (Number.isInteger(v) ? String(v) : f(v, v < 10 ? 2 : 1));
  const bad = rows.map((r) => ({ r, v: violations(r) })).filter((x) => x.v.length);
  if (!bad.length) console.log(`[luong] ${rows.length} bản đồ đều đạt chỉ tiêu bố cục (mục 1.1).`);
  else {
    console.log(`[luong] ${strictTag(opt)}${bad.length}/${rows.length} bản đồ vượt chỉ tiêu bố cục (docs/design/cai-to-luong-di-chuyen-ban-do.md mục 1.1; chi tiết: node tools/maps/do-luong.mjs):`);
    for (const { r, v } of bad) console.log(`  ${r.ten} (${GROUP_OF_KIND[r.kind]}): ${v.map((x) => `${x.ten} ${fmt(x.value)} (cần ${x.op} ${x.limit})`).join("; ")}`);
    if (opt.strict) process.exit(1);
  }
} else if (opt.json) console.log(JSON.stringify(rows, null, 2));
else {
  console.log(table(rows));
  if (opt.tuyen) for (const r of rows) if (r.dsTuyen?.length) {
    console.log(`\n${r.ten} — tuyến từ trại hồi sinh`);
    for (const t of r.dsTuyen) console.log(`  ${t.type.padEnd(11)} ${t.to.padEnd(26)} ${f(t.secs).padStart(5)} s  cổ chai ${String(t.choke).padStart(2)}  ngang rộng nhất ${t.widest}`);
  }
  if (opt.sinh) for (const r of rows) {
    const z = r.sinh ?? []; if (!z.length) continue;
    const t = z.reduce((a, x) => ({ ok: a.ok + x.ok, g: a.g + x.gap1, b: a.b + x.behind }), { ok: 0, g: 0, b: 0 });
    console.log(`\n${r.ten} — chỗ sinh hồn thú (mẫu ${STEP}px): ${t.ok} điểm; ở ô khe 1 ô ${t.g} (${f((100 * t.g) / (t.ok || 1))}%), ô sau khe ${t.b} (${f((100 * t.b) / (t.ok || 1))}%)`);
    for (const x of z.filter((x) => x.gap1 + x.behind > 0).sort((a, b) => b.gap1 + b.behind - (a.gap1 + a.behind)).slice(0, 5))
      console.log(`  ${x.kind} ${x.name}: ${x.ok} điểm, khe 1 ô ${x.gap1}, sau khe ${x.behind}`);
  }
}
