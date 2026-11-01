// NPC #1552: cử chỉ đáp lời, kiểm trên game thật với server RAM riêng và Chrome --mute-audio.
// NPC_REPLY_ID / NPC_REPLY_MAP chọn NPC và bản đồ; mặc định kiểm hồi quy Đại Sư.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.NPC_REPLY_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "npc-reply-")));
const npcId = process.env.NPC_REPLY_ID ?? "dai_su", npcMap = process.env.NPC_REPLY_MAP ?? "nac_dinh_thanh", sheet = `lpc_${npcId}`;
const children = [];
let browser;
const killChildren = () => { for (const child of children) { if (child.exitCode !== null || !child.pid) continue; if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); else child.kill("SIGTERM"); } };
// Chặn treo: cả bài quá NPC_REPLY_TIMEOUT_MS (mặc định 180 s) thì tắt tiến trình con rồi thoát mã 1.
const watchdog = setTimeout(() => { console.error("npc-reply-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.NPC_REPLY_TIMEOUT_MS ?? 180000));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => {
  const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); });
});
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, detached: process.platform !== "win32", env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  let log = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (d) => { log = (log + d).slice(-12000); });
  child.on("exit", (code) => { if (code) console.error(log); });
  return () => log;
}
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw new Error(`Không mở được ${url}`);
}
const clientLog = []; // lỗi / cảnh báo console của trang, in kèm khi trượt

try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  const serverLog = start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => {
    const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json(); assert.ok(r.ok, data.error); return data;
  };
  const name = `NPC ${Date.now().toString(36).slice(-5)}`;
  const { token } = await post("/api/login", { name, password: "Npc-local-preview!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });

  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || undefined, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const videoStarted = Date.now();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } } });
  const errors = [];
  page.on("pageerror", (e) => { errors.push(e.message); console.error("[trình duyệt]", e.stack); });
  // Kho riêng không có trong worktree: mô phỏng 404 như server thật, tránh SPA fallback HTML của Vite.
  await page.route("**/private/present.json", route => route.fulfill({status:404, body:""}));
  page.on("websocket", (ws) => { const t0 = Date.now(); clientLog.push(`ws mở ${ws.url().slice(-40)}`); ws.on("close", () => clientLog.push(`ws đóng sau ${Date.now() - t0} ms`)); });
  page.on("console", (m) => { if (["warning", "error"].includes(m.type())) clientLog.push(m.text().slice(0, 200)); });
  await page.addInitScript((t) => { localStorage.setItem("shh-token", t); }, token);
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `
const replyCreate = GameScene.prototype.create;
GameScene.prototype.create = function(...a) {
  window.__npcReplyScene = this; window.__npcReplyTarget = ${JSON.stringify(npcId)}; window.__npcLpcStr = npcLpcStr; return replyCreate.apply(this, a);
};` });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__npcReplyScene?.players.size > 0);
  await page.waitForTimeout(1500);

  await page.evaluate(to => { if(window.__npcReplyScene.mapId !== to) window.__npcReplyScene.room.send("test", { op: "warp", mapId: to }); }, npcMap);
  await page.waitForFunction(to => window.__npcReplyScene?.mapId === to && window.__npcReplyScene.npcs.some(n => n.id === window.__npcReplyTarget), npcMap);
  await page.waitForTimeout(1200);
  const move = async (dx, dy) => {
    // Một số NPC sát tường: giảm khoảng cách trên cùng tia, không đổi hướng kiểm.
    const point = await page.evaluate(async ({dx,dy,moveUrl}) => {
      const { hits, PLAYER_HW, PLAYER_HH } = await import(moveUrl);
      const s=window.__npcReplyScene,n=s.npcs.find(n=>n.id===window.__npcReplyTarget);
      for (const k of [1, .5, .25, .125, .1]) {
        const x=n.x+dx*k,y=n.y+dy*k;
        if (Math.hypot(dx*k,dy*k)>2 && !hits(s.grid,x,y,PLAYER_HW,PLAYER_HH)) {
          s.room.send('test',{op:'goto',x,y}); return {x,y};
        }
      }
      throw new Error(`Không có điểm đứng cho hướng ${dx},${dy}`);
    }, {dx,dy,moveUrl:'/@fs/'+root.replaceAll('\\','/')+'shared/move.ts'});
    await page.waitForFunction(({x,y}) => { const s=window.__npcReplyScene,p=s.room.state.players.get(s.me); return Math.hypot(p.x-x,p.y-y)<.1; },point);
  };
  const close = async () => { await page.evaluate(async()=> (await import('/src/hudNpc.ts')).closeNpc()); await page.waitForFunction(()=>window.__npcReplyScene.talkingNpc===null); };
  const talk = async () => { await page.evaluate(()=>window.__npcReplyScene.talk(window.__npcReplyTarget)); await page.waitForFunction(()=>!!window.__npcReplyScene.npcReply.active, null, {timeout:5000}).catch(async e=>{console.log(await page.evaluate(async()=>({id:(await import('/src/hudNpc.ts')).npcOpenId(), stamp:(await import('/src/hudNpc.ts')).npcOpenStamp(), sceneStamp:window.__npcReplyScene.talkingNpcStamp,reduce:(await import('/src/combatFx.ts')).fxPrefs.reduce,texture:window.__npcReplyScene.npcs.find(n=>n.id===window.__npcReplyTarget).body.texture.key})));throw e;}); };
  const state = () => page.evaluate(()=>{const s=window.__npcReplyScene,n=s.npcs.find(n=>n.id===window.__npcReplyTarget),a=s.npcReply.active;return {active:!!a,head: a?{flip:a.head.flipX,frame:a.head.frame.name,y:a.head.y}:null,flip:n.body.flipX,crop:n.body.isCropped,anim:n.body.anims.currentAnim?.key,x:n.body.parentContainer.x,y:n.body.parentContainer.y,bodyX:n.body.x,bodyY:n.body.y};});
  await move(24,24);
  await page.evaluate(()=>{const s=window.__npcReplyScene,n=s.npcs.find(n=>n.id===window.__npcReplyTarget),c=s.cameras.main;c.stopFollow(); c.setZoom(5);c.centerOn(n.body.parentContainer.x+65,n.body.parentContainer.y-20);});
  // Quay clip trong game thật: mở bằng tin talk được server xác nhận, chờ về idle rồi đóng.
  const clipAt=(Date.now()-videoStarted)/1000;
  await talk();
  await page.waitForTimeout(900);
  await page.screenshot({path:resolve(out,'trong-game.png')});
  await close();
  const dirs = [[24,24],[-24,24],[-24,-24],[24,-24],[24,0],[0,24],[-24,0],[0,-24]];
  // So hướng bằng cùng hợp đồng dir8 của #1511, kiểm clone đầu lật cùng thân.
  for (const [dx,dy] of dirs) {
    await move(dx,dy);
    const expected=await page.evaluate(async({dx,dy})=>{const {dir8}=await import('/src/iso.ts'),{honsuAnimKey}=await import('/src/sprites.ts'); return honsuAnimKey('lpc_'+window.__npcReplyTarget,'idle',dir8(dx,dy));},{dx,dy});
    await talk(); const during=await state();
    assert.equal(during.anim,expected.key); assert.equal(during.flip,expected.flip); assert.equal(during.head.flip,expected.flip); assert.ok(during.crop);
    await page.waitForTimeout(560); const after=await state();
    assert.ok(!after.active&&!after.crop); assert.equal(after.anim,expected.key); assert.equal(after.x,during.x); assert.equal(after.y,during.y); assert.equal(after.bodyX,during.bodyX); assert.equal(after.bodyY,during.bodyY);
    await page.evaluate(async()=>{const h=await import('/src/hudNpc.ts');h.npcBag({slots:30,honTe:0,items:[],bones:[],cores:[],gears:[]});});
    await page.waitForTimeout(100); assert.ok(!(await state()).active,'túi không phát lại');
    await close(); assert.equal((await state()).anim,sheet+':idle_s');
  }
  console.log(npcId, '✓ Tám hướng / giữ điểm chân / về idle / cập nhật túi không phát lại');
  console.log("Kiểm đóng sớm"); await move(24,24); await talk(); await close(); assert.ok(!(await state()).active && !(await state()).crop);
  // Đổi NPC qua HUD thật để kiểm hủy lớp tạm (NPC còn lại xa nên chỉ kiểm vòng đời hiển thị).
  console.log("Kiểm đổi NPC"); await talk(); await page.evaluate(async()=>{const h=await import('/src/hudNpc.ts');h.openNpc('su_gia_dau_hon',null,{});}); await page.waitForTimeout(70); assert.ok(!(await state()).active);
  console.log("Kiểm mở lại nhanh"); await close(); await talk();
  await page.evaluate(async()=>{const h=await import('/src/hudNpc.ts');h.closeNpc();h.openNpc(window.__npcReplyTarget,null,{});});
  await page.waitForTimeout(70); assert.ok((await state()).active,'mở lại cùng NPC giữa hai frame'); await close();
  console.log("Kiểm Giảm chuyển động"); await page.evaluate(async()=>{(await import('/src/combatFx.ts')).fxPrefs.reduce=true;});
  await page.evaluate(()=>window.__npcReplyScene.talk(window.__npcReplyTarget)); await page.waitForFunction(()=>window.__npcReplyScene.talkingNpc===window.__npcReplyTarget); await page.waitForTimeout(160); assert.ok(!(await state()).active); await close();
  await page.evaluate(async()=>{(await import('/src/combatFx.ts')).fxPrefs.reduce=false;});
  await talk(); await page.evaluate(async()=>{(await import('/src/combatFx.ts')).fxPrefs.reduce=true;}); await page.waitForTimeout(60); assert.ok(!(await state()).active); await close();
  await page.evaluate(async()=>{(await import('/src/combatFx.ts')).fxPrefs.reduce=false;const s=window.__npcReplyScene,n=s.npcs.find(n=>n.id===window.__npcReplyTarget); const key=s.lpc.acquire(window.__npcLpcStr(n.def.looks));window.__fallbackKey=key;n.body.stop().setTexture(key).play(key+':idle_s');});
  await page.evaluate(()=>window.__npcReplyScene.talk(window.__npcReplyTarget)); await page.waitForFunction(()=>window.__npcReplyScene.talkingNpc===window.__npcReplyTarget); await page.waitForTimeout(160); assert.ok(!(await state()).active,'sheet không đúng giữ idle'); await close();
  await page.evaluate(()=>window.__npcReplyScene.npcs.find(n=>n.id===window.__npcReplyTarget).body.stop().setTexture('lpc_'+window.__npcReplyTarget).play('lpc_'+window.__npcReplyTarget+':idle_s'));
  await talk();
  await page.evaluate(()=>{window.__oldReply=window.__npcReplyScene.npcReply;window.__oldReplyMap=window.__npcReplyScene.mapId;window.__npcReplyScene.room.send('test',{op:'warp',mapId:window.__npcReplyScene.mapId==='thanh_hon_thon'?'nac_dinh_thanh':'thanh_hon_thon'});});
  await page.waitForFunction(()=>window.__npcReplyScene?.mapId!==window.__oldReplyMap&&window.__npcReplyScene.players.size>0);
  assert.ok(await page.evaluate(()=>!window.__oldReply.active));
  assert.deepEqual(errors,[]);
  console.log('✓ Đóng / đổi NPC / mở lại nhanh / Giảm chuyển động / fallback / đổi map');
  console.log(`Cử chỉ đầu tại giây ${clipAt.toFixed(2)}`);
  await page.close();
  console.log(`Clip và ảnh: ${out}`);
} finally {
  clearTimeout(watchdog);
  await browser?.close().catch(()=>{});
  killChildren();
}
