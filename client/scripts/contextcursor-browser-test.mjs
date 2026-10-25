import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { resolve, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
const root = fileURLToPath(new URL('../..', import.meta.url));
const git = (...args) => {
 const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
 assert.equal(result.status, 0, 'git ' + args[0] + ' failed');
 return result.stdout.trim();
};
const actualCheckout = git('rev-parse', 'HEAD');
const providerHead = process.env.C12_HEAD_SHA || actualCheckout;
const eventBase = process.env.C12_BASE_SHA;
assert.match(providerHead, /^[a-f0-9]{40}$/);
assert.match(eventBase || '', /^[a-f0-9]{40}$/, 'C12_BASE_SHA must be the event base SHA40');
assert.equal(actualCheckout, providerHead, 'checkout must match provider HEAD');
const mergeBase = git('merge-base', eventBase, providerHead);
const out = resolve(process.env.C12_OUTPUT || await mkdtemp(join(tmpdir(), 'c12-preview-')));
assert.ok(relative(root, out).startsWith('..'), 'generated preview must stay outside the repository');
const metadata = { providerHead, eventBase, mergeBase, actualCheckout,
 workingTreeDirty: !!git('status', '--porcelain'),
 comparison: 'BASE UI at mergebase and HEAD UI share one HEAD RAM GAME_TEST server; not BASE fullstack E2E',
 dataset: 'two fresh RAM accounts with the same looks/awakening preset; live names/positions/levels may differ',
 viewport: { desktop: [1280, 720], regression: [844, 390], dpr2: 2 } };
const report = { ...metadata, fixture: { resource: '/private/present.json', scope: 'exact URL on each BASE/HEAD origin only', replacementStatus: 404, baselineResponses: [] }, consoleErrors: [], expectedOptional404: [], warnings: [], checks: [], errors: [], layout: {}, passed: false };
const children = []; let browser, phase = 'khởi động';
report.consoleDetails = [];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise((r,j)=>{const s=createServer();s.on('error',j);s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n));});});
// Chỉ truyền đường dẫn runtime; không kế thừa URL DB/Redis hoặc token.
function start(args, cwd, env = {}) {
 const paths = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot', 'USERPROFILE'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
 const child = spawn(process.execPath, args, { cwd, detached: true,
  env: { ...paths, DATABASE_URL: '', BOT_PG_URL: '', REDIS_URL: '', ADMIN_ACCOUNTS: '', ...env }, stdio: 'ignore' });
 children.push(child);
 child.on('error', error => report.errors.push('child start: ' + error.message));
 return child;
}
function observe(page, name, optionalUrl) {
 page.on('pageerror', error => report.errors.push(name + ': ' + error.message));
 page.on('response', response => {
  if (response.status() >= 400 && !(response.url() === optionalUrl && response.status() === 404)) report.errors.push(name + ': HTTP ' + response.status() + ' ' + new URL(response.url()).pathname);
 });
 page.on('console', message => {
  if (message.type() === 'error') {
   if (message.location().url === optionalUrl && /404/.test(message.text())) report.expectedOptional404.push(name + ': /private/present.json 404');
   else { report.consoleErrors.push(name + ': ' + message.text()); report.consoleDetails.push({ version: name, phase, message: message.text(), source: message.location().url }); }
  } else if (message.type() === 'warning') report.warnings.push(name + ': ' + message.text());
 });
}
async function ready(url){for(let i=0;i<150;i++){if(await fetch(url).then(r=>r.ok).catch(()=>false))return;await delay(200);}throw Error('not ready '+url);}
try{
 await mkdir(out,{recursive:true});
 const base=await mkdtemp(join(tmpdir(),'c12-before-'));
 assert.equal(spawnSync('git',['archive','--output',base+'/base.tar',mergeBase,'package.json','client','shared'],{cwd:root}).status,0);
 assert.equal(spawnSync('tar',['-xf',base+'/base.tar','-C',base]).status,0);
 await symlink(root+'/client/node_modules',base+'/client/node_modules','dir');
 await symlink(root+'/node_modules',base+'/node_modules','dir');
 const api='http://127.0.0.1:'+await port(), before='http://127.0.0.1:'+await port(), after='http://127.0.0.1:'+await port();
 start(['server/node_modules/tsx/dist/cli.mjs','--tsconfig','server/tsconfig.json','server/src/index.ts'],root,{PORT:new URL(api).port,GAME_TEST:'1'});
 start([root+'/client/node_modules/vite/bin/vite.js','client','--host','127.0.0.1','--port',new URL(before).port],base,{VITE_SERVER_URL:api});
 start(['client/node_modules/vite/bin/vite.js','client','--host','127.0.0.1','--port',new URL(after).port],root,{VITE_SERVER_URL:api});
 await Promise.all([ready(api+'/health'),ready(before),ready(after)]);
 browser=await chromium.launch({...(process.env.C12_BROWSER_CHANNEL ? {channel:process.env.C12_BROWSER_CHANNEL} : {}),headless:true,args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 let current,context,currentToken;
 for(const [name,url]of [['before',before],['after',after]]){
  const post=async(path,body)=>{const r=await fetch(api+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();assert.ok(r.ok,d.error);return d;};
  const {token}=await post('/api/login',{name:'C12 '+name+Date.now().toString(36).slice(-5),password:'C12-local-test!'});
  await post('/api/looks',{token,sex:0,hair:0,hairCol:0,outfitCol:0});
  await post('/api/awaken',{token,vohon:'lam_dien_ba_vuong_long'});
  context=await browser.newContext({viewport:{width:1280,height:720}});
  await context.addInitScript(token=>localStorage.setItem('shh-token',token),token);
  context.setDefaultTimeout(15000);const page=await context.newPage();
  const optionalUrl=url+'/private/present.json';
  const original=await fetch(optionalUrl),originalText=await original.text();
  assert.equal(original.status,200);assert.match(original.headers.get('content-type')??'',/text\/html/);assert.ok(originalText.startsWith('<!doctype html>'));
  report.fixture.baselineResponses.push({version:name,resource:'/private/present.json',status:original.status,contentType:'text/html',missingFileHtmlFallback:true});
  observe(page,name,optionalUrl);
  await page.route(optionalUrl,route=>route.fulfill({status:404,contentType:'application/json',body:'{"error":"private assets not installed"}'}));
  phase=name+': vào game';await page.goto(url+'/choi/?lag=1');
  await page.getByRole('button',{name:'Vào Thánh Hồn Thôn',exact:true}).click();
  await page.waitForFunction(()=>window.__scene?.players.size>0,null,{timeout:60000});
  if(name==='after'){await page.waitForFunction(()=>document.querySelectorAll('#quickMenu .c12-ui-icon').length===6);await page.waitForFunction(()=>document.querySelector('#c12Connection.c12-with-icon')?.dataset.c12Key==='gi_ui_connected'&&document.querySelector('#hudMenuBtn.c12-with-icon')?.dataset.c12Key==='gi_ui_menu');report.checks.push('owner816 merged: menu and connected icons loaded');}
  await delay(2500); if(await page.getByRole('button',{name:'B\u1ecf qua',exact:true}).count()) await page.getByRole('button',{name:'B\u1ecf qua',exact:true}).click(); await delay(300);
  await page.screenshot({path:out+'/'+name+'-desktop.png'});
  report.layout[name]=await page.evaluate(()=>Object.fromEntries(['chanBtn','c12Connection','areaBtn','worldBtn'].map(id=>{const e=document.getElementById(id);if(!e)return[id,null];const r=e.getBoundingClientRect();return[id,{x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent,scroll:e.scrollWidth,client:e.clientWidth}]})));
  await page.setViewportSize({width:844,height:390});await delay(700);
  await page.screenshot({path:out+'/'+name+'-844.png'});
  if(name==='before'){await context.close();continue;}
  current=page;currentToken=token;
 }
 const page=current;
 await page.setViewportSize({width:1280,height:720});await delay(500);
 async function point(world){return page.evaluate(({x,y})=>{const s=window.__scene,c=s.cameras.main,r=s.game.canvas.getBoundingClientRect();return{x:r.x+((x-c.worldView.x)*c.zoom)/s.scale.gameSize.width*r.width,y:r.y+((y-c.worldView.y)*c.zoom)/s.scale.gameSize.height*r.height};},world);}
 async function move(world,kind){const p=await point(world);await page.mouse.move(p.x,p.y);try{await page.waitForFunction(kind=>document.querySelector('#game canvas')?.style.cursor.includes('cursor_'+kind+'_'),kind,{timeout:5000});}catch(e){console.log('cursor failure',JSON.stringify({kind,p,diag:await page.evaluate(()=>{const s=window.__scene;return{cursor:s.game.canvas.style.cursor,active:s.contextCursor?.active,dead:s.room.state.players.get(s.me)?.dead,pointer:{x:s.input.activePointer.x,y:s.input.activePointer.y},errors:[]};})}));throw e;}}
 const canvasSelector=await page.evaluate(()=>window.__scene.game.canvas.parentElement.id);
 console.log('canvas parent',canvasSelector);
 async function style(){return page.evaluate(()=>window.__scene.game.canvas.style.cursor);}
 async function test(op,extra={}){return page.evaluate(({op,extra})=>new Promise((resolve,reject)=>{const room=window.__scene.room;let off;const timeout=setTimeout(()=>{off?.();reject(Error('test timeout '+op));},5000);off=room.onMessage('test',m=>{clearTimeout(timeout);off();resolve(m);});room.send('test',{op,...extra});}),{op,extra});}
 const npcWorld=await page.evaluate(()=>{const n=window.__scene.npcs.find(n=>n.def);return{x:n.x,y:n.y};});
 phase='NPC goto';await test('goto',{x:npcWorld.x+24,y:npcWorld.y});await delay(1800);
 const npc=await page.evaluate(()=>{const s=window.__scene,c=s.cameras.main,cv=s.game.canvas,r=cv.getBoundingClientRect();for(const n of s.npcs){if(!n.def)continue;const x=n.x-n.y,y=(n.top+(n.x+n.y)/2)/2,cx=r.x+(x-c.worldView.x)*c.zoom,cy=r.y+(y-c.worldView.y)*c.zoom;if(cx>0&&cy>0&&cx<1280&&cy<720&&document.elementFromPoint(cx,cy)===cv)return{x,y};}throw Error('No visible NPC');});
 await move(npc,'talk');report.checks.push('NPC hover: talk');console.log('NPC talk passed');
 // Chọn nền chặn đang hiện trên canvas, không bị DOM che.
 const blocked=await page.evaluate(()=>{const s=window.__scene,c=s.cameras.main,cv=s.game.canvas,r=cv.getBoundingClientRect();for(let ty=0;ty<s.grid.MH;ty++)for(let tx=0;tx<s.grid.MW;tx++){if(s.grid.solid[ty*s.grid.MW+tx]!==1)continue;const x=tx*16+8,y=ty*16+8,sx=x-y,sy=(x+y)/2,cx=r.x+(sx-c.worldView.x)*c.zoom,cy=r.y+(sy-c.worldView.y)*c.zoom;if(cx>350&&cx<850&&cy>80&&cy<500&&document.elementFromPoint(cx,cy)===cv)return{x:sx,y:sy};}return null;});
 assert.ok(blocked,'a visible solid tile is required');await move(blocked,'blocked');report.checks.push('solid hover: blocked');
 phase='clear beasts';await test('clear');
 phase='spawn beast';const spawned=await test('spawn',{dx:65,dy:0,tier:0,hpx:100});await delay(500);
 const beast=await page.evaluate(id=>{const s=window.__scene,v=s.beasts.get(id);return{x:v.x,y:v.y-15};},spawned.bid);
 await page.evaluate(()=>{const s=window.__scene;s.__c12sent=[];const send=s.room.send.bind(s.room);s.room.send=(type,...args)=>{s.__c12sent.push(type);return send(type,...args)};});
 await move(beast,'attack');
 assert.equal(await page.evaluate(()=>window.__scene.__c12sent.filter(t=>t==='target'||t==='attack'||t==='pickup').length),0);
 report.checks.push('hover attack: no target/attack/pickup message');
 phase='M3 click lock';await page.mouse.click(...Object.values(await point(beast)));
 await page.waitForFunction(id=>window.__scene.lockId===id,spawned.bid);
 report.checks.push('M3 click beast still locks target');console.log('M3 click passed');
 await page.keyboard.press('ArrowLeft');await delay(150);await page.keyboard.up('ArrowLeft');
 const ui=await page.locator('#charBtn').boundingBox();await page.mouse.move(ui.x+ui.width/2,ui.y+ui.height/2);await delay(200);assert.ok(!(await style()).includes('cursor_'));
 report.checks.push('DOM overlay clears custom cursor');
 phase='slay/drop';await test('slay',{bid:spawned.bid});await delay(600);
 await page.waitForFunction(()=>window.__scene.drops.size>0,null,{timeout:5000});
 const lootWorld=await page.evaluate(()=>{const s=window.__scene,[id,v]=[...s.drops][0],d=s.room.state.drops.get(id);return{id,x:d.x,y:d.y};});
 phase='pickup goto';await test('goto',{x:lootWorld.x,y:lootWorld.y});await delay(1500);
 const lootPoint=await page.evaluate(id=>{const v=window.__scene.drops.get(id);return{x:v.img.x,y:v.img.y};},lootWorld.id);
 await move(lootPoint,'pickup');report.checks.push('actual drop in range: pickup cursor');
 await page.evaluate(()=>window.__scene.game.canvas.dispatchEvent(new PointerEvent('pointermove',{pointerType:'touch',clientX:10,clientY:10})));
 await delay(100);assert.ok(!(await style()).includes('cursor_'));report.checks.push('touch PointerEvent clears cursor');
 const lp=await point(lootPoint);await page.mouse.move(lp.x+1,lp.y+1);await delay(100);assert.ok((await style()).includes('cursor_pickup_'));report.checks.push('hybrid mouse restores cursor');
 report.dpi=await page.evaluate(()=>({dpr:devicePixelRatio,imageSet:CSS.supports('cursor','image-set(url("x.png") 1x, url("y.png") 2x) 2 2, default'),cursor:window.__scene.game.canvas.style.cursor}));
 await page.setViewportSize({width:844,height:390});await delay(400);
 const mobile=await page.evaluate(()=>{const s=window.__scene;return{cursor:s.game.canvas.style.cursor,actbar:document.getElementById('actbar')?.getBoundingClientRect().toJSON(),label:document.getElementById('c12Connection')?.getBoundingClientRect().toJSON()};});
 report.mobile=mobile; report.checks.push('844x390 screenshot only; no mobile feature changes');
 phase='room leave';await page.evaluate(()=>window.__scene.room.leave());
 await page.waitForFunction(()=>document.getElementById('c12Connection').textContent==='Mất kết nối');
 await page.waitForFunction(()=>document.querySelector('#c12Connection.c12-with-icon')?.dataset.c12Key==='gi_ui_disconnected');report.checks.push('owner816 merged: disconnected icon loaded');assert.equal(await page.locator('#overlay').isVisible(),true);
 report.checks.push('actual room leave: disconnected label and existing overlay');
 await page.screenshot({path:out+'/after-disconnected.png'});
 assert.ok(report.layout.after.worldBtn.scroll-report.layout.after.worldBtn.client<=report.layout.before.worldBtn.scroll-report.layout.before.worldBtn.client,'C12 must not increase existing world label overflow: '+JSON.stringify(report.layout));
 phase='DPR2 join';const hd=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:2});
 await hd.addInitScript(token=>localStorage.setItem('shh-token',token),currentToken);
 hd.setDefaultTimeout(15000);const hp=await hd.newPage(),requested=[];
 hp.on('request',r=>{if(/cursor_.*_64\.png/.test(r.url()))requested.push(r.url());});
 observe(hp,'DPR2',after+'/private/present.json');
 await hp.route(after+'/private/present.json',route=>route.fulfill({status:404,contentType:'application/json',body:'{"error":"private assets not installed"}'}));
 await hp.goto(after+'/choi/?lag=1');await hp.getByRole('button',{name:'V\u00e0o Th\u00e1nh H\u1ed3n Th\u00f4n',exact:true}).click();
 await hp.waitForFunction(()=>window.__scene?.players.size>0,null,{timeout:60000});await delay(1200);
 await hp.mouse.move(620,320);await hp.waitForFunction(()=>window.__scene?.game.canvas.style.cursor.includes('cursor_'));
 await delay(200);assert.ok(requested.length>0,'DPR2 must request a PNG64 cursor');
 report.dpr2={dpr:await hp.evaluate(()=>devicePixelRatio),requested64:true};
 await hp.screenshot({path:out+'/after-dpr2.png'});await hd.close();
 report.checks.push('DPR2 actual Chrome requests PNG64 cursor');
 const negative=await page.evaluate(async()=>{const r=await fetch('/c12-unmocked-probe.json');try{await r.json();return{parseFailed:false,status:r.status};}catch{return{parseFailed:true,status:r.status};}});
 assert.equal(negative.parseFailed,true,'new JSON resource is not rewritten or silently parsed by optional fixture');
 report.negativeFixture={resource:'/c12-unmocked-probe.json',unmocked:true,...negative};
 assert.deepEqual(report.consoleErrors,[]);
 assert.deepEqual(report.errors,[]);
 report.passed=true;
 console.log('C12 browser passed: '+providerHead+' ('+report.checks.length+' checks)');
} catch (error) {
 report.failure = error.message;
 throw error;
} finally {
 await browser?.close().catch(() => {});
 for (const child of children) if (child.pid && child.exitCode === null) {
  try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(2000)]);
  if (child.exitCode === null && child.signalCode === null) { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
 }
 await mkdir(out, { recursive: true });
 await writeFile(join(out, 'metadata.json'), JSON.stringify(metadata, null, 2));
 await writeFile(join(out, 'result.json'), JSON.stringify(report, null, 2));
 const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
 const images = ['before-desktop', 'after-desktop', 'before-844', 'after-844', 'after-disconnected', 'after-dpr2'];
 await writeFile(join(out, 'index.html'), `<!doctype html><html lang="vi"><meta charset="utf-8"><title>C12 preview</title><style>body{font:16px system-ui;max-width:1280px;margin:20px auto;padding:12px}img{max-width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>C12 — ${report.passed ? 'Đạt assertion browser' : 'Chưa đạt'}</h1><p>BASE UI dùng mergebase; hai UI dùng cùng HEAD RAM server, không phải BASE fullstack E2E. Hai tài khoản mới cùng preset; trạng thái sống có thể khác. Fixture duy nhất: exact /private/present.json trả404 JSON ở mỗi origin, sau khi xác minh cả hai gốc đều thiếu marker và Vite trả HTML200. Negative JSON probe không mock. Mọi console/pageerror khác đều làm test thất bại.</p><p>844×390 và DPR2 là hồi quy, Q40 phone hoãn; không nghiệm thu bố cục mobile. Screenshot không ghi con trỏ hệ điều hành; test CSS/hotspot/PNG64 kiểm riêng. Đây là output browser, không claim AO HTML renderer PASS. PG/RAM bot cũ không thuộc kết quả này.</p><pre>${escape(JSON.stringify(report, null, 2))}</pre>${images.map(name => `<figure><img src="${name}.png" alt="${name}"><figcaption>${name}</figcaption></figure>`).join('')}</html>`);
}
