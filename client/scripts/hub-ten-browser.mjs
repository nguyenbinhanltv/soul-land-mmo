// Hồi quy tên thẻ Menu (Hub) không bị bẻ giữa từ (#1600) bằng Chrome tắt âm: 4 cỡ màn × 3 cỡ chữ (a11y-fs-*).
// Đo bằng Range từng từ: một từ nằm trên hai dòng = bị bẻ giữa từ. `HUB_PREFIX=truoc` đổi tiền tố ảnh; `HUB_SOFT=1` chỉ in lỗi, không dừng (chụp ảnh "trước").
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { chromium } from "playwright";

const prefix = process.env.HUB_PREFIX ?? "sau", soft = process.env.HUB_SOFT === "1";
const out = process.env.HUB_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "hub-ten-"));
await mkdir(out, { recursive: true });
const port = await new Promise((done) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
const vite = spawn(process.execPath, ["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(port)], { cwd: fileURLToPath(new URL("../../", import.meta.url)), stdio: ["ignore", "pipe", "pipe"] });
let log = "", browser;
for (const stream of [vite.stdout, vite.stderr]) stream.on("data", (d) => { log = (log + d).slice(-4000); });
const problems = [];
try {
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) break; await new Promise((r) => setTimeout(r, 100)); if (i === 99) throw new Error(log); }
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio"] });
  const page = await browser.newPage();
  const errors = []; page.on("pageerror", (e) => errors.push(e.stack ?? e.message));
  await page.goto(url + "/choi/");
  await page.evaluate(async () => {
    await (await import("/src/uiArt.ts")).loadUiArt();
    document.querySelector("#overlay")?.remove();
    document.querySelector("#hud").hidden = false; document.querySelector("#hud").style.display = "block";
    const hub = await import("/src/hubMenu.ts");
    hub.initHub(Object.fromEntries(["vohon", "char", "reso", "bag", "rank", "quest", "world", "friends", "auto", "settings", "mail", "achv", "welfare", "bicanh", "calendar", "guide", "notice"].map((id) => [id, () => {}])), new AbortController().signal);
    hub.setHubOpen(true);
  });
  for (const [width, height] of [[640, 360], [960, 540], [1280, 720], [1920, 1080]]) for (const fs of [0, 1, 2]) {
    await page.setViewportSize({ width, height });
    await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
    await page.waitForTimeout(150);
    await page.locator("#hub img").evaluateAll(async (imgs) => { await Promise.all(imgs.map((i) => i.decode().catch(() => {}))); });
    await page.screenshot({ path: resolve(out, `${prefix}-${width}x${height}-chu-${fs}.png`) });
    const tag = `${width}×${height}, chữ ${fs}`;
    const rows = await page.evaluate(() => [...document.querySelectorAll("#hub .hub-grid .p2-card-t, #hub .hub-big .p2-card-t, #hub .hub-mid .p2-card-t")].map((el) => {
      const text = el.firstChild, broken = [], lineTops = new Set();
      for (const m of el.textContent.matchAll(/\S+/g)) {
        const r = document.createRange(); r.setStart(text, m.index); r.setEnd(text, m.index + m[0].length);
        const tops = new Set([...r.getClientRects()].map((q) => Math.round(q.top)));
        if (tops.size > 1) broken.push(m[0]);
        tops.forEach((t) => lineTops.add(t));
      }
      return { label: el.textContent, broken, lines: lineTops.size, over: el.scrollWidth > el.clientWidth + 1 };
    }));
    assert.ok(rows.length >= 12, `${tag}: đủ thẻ để đo (${rows.length})`);
    for (const r of rows) {
      if (r.broken.length) problems.push(`${tag}: "${r.label}" bị bẻ giữa từ (${r.broken.join(", ")})`);
      if (r.lines > 2) problems.push(`${tag}: "${r.label}" ${r.lines} dòng (tối đa 2)`);
      if (r.over) problems.push(`${tag}: "${r.label}" tràn ngang thẻ`);
    }
  }
  if (problems.length) console.log(problems.join("\n"));
  if (!soft) assert.deepEqual(problems, [], "tên thẻ Hub vỡ giữa từ / quá 2 dòng / tràn");
  assert.deepEqual(errors, []);
  console.log(`✓ Tên thẻ Hub nguyên từ, 4 cỡ màn × 3 cỡ chữ: ${out}`);
} finally { await browser?.close(); vite.kill(); vite.stdout.destroy(); vite.stderr.destroy(); vite.unref(); }
