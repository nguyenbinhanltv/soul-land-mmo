// #1598: A/B asset thật, cùng camera; công cụ kiểm trình duyệt riêng, không phải bot.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync,mkdirSync,writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
const root=fileURLToPath(new URL("../../",import.meta.url));
assert.ok(process.env.TINH_THE_OUTPUT,"Cần TINH_THE_OUTPUT ngoài repo");
const out=path.resolve(process.env.TINH_THE_OUTPUT);
assert.ok(out.toLowerCase()!==path.resolve(root).toLowerCase()&&!out.toLowerCase().startsWith(path.resolve(root).toLowerCase()+path.sep));
mkdirSync(out,{recursive:true});
const children=[];let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,"127.0.0.1",()=>{const p=s.address().port;s.close(()=>r(p));});});
function start(args,env){const c=spawn(process.execPath,args,{cwd:root,env:{...process.env,DATABASE_URL:"",REDIS_URL:"",ADMIN_ACCOUNTS:"",...env},stdio:"ignore"});children.push(c);}
async function ready(url){for(let i=0;i<200;i++){if(await fetch(url).then(r=>r.ok).catch(()=>false))return;await sleep(200);}throw Error(url);}
function cleanup(){for(const c of children)if(c.pid&&c.exitCode===null&&c.signalCode===null){if(process.platform==="win32")spawn("taskkill",["/pid",String(c.pid),"/t","/f"],{stdio:"ignore"});else c.kill();}}
const timer=setTimeout(()=>{cleanup();process.exit(1);},300000);
try{
  const api=`http://127.0.0.1:${await port()}`,web=`http://127.0.0.1:${await port()}`;
  start(["server/node_modules/tsx/dist/cli.mjs","--tsconfig","server/tsconfig.json","server/src/index.ts"],{PORT:api.split(":").at(-1),GAME_TEST:"1"});
  start(["client/node_modules/vite/bin/vite.js","client","--host","127.0.0.1","--port",web.split(":").at(-1)],{VITE_SERVER_URL:api});
  await Promise.all([ready(api+"/health"),ready(web)]);
  console.log("Preview",web+"/choi/?light=1");
  const post=async(p,b)=>{const r=await fetch(api+p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});const d=await r.json();assert.ok(r.ok,JSON.stringify(d));return d;};
  const {token}=await post("/api/login",{name:`TinhThe ${Date.now().toString(36)}`,password:"Tinh-the-local-test!"});
  await post("/api/looks",{token,sex:0,hair:0,hairCol:0,outfitCol:0});
  await post("/api/awaken",{token,vohon:"lam_dien_ba_vuong_long"});
  browser=await chromium.launch({channel:"chrome",headless:false,args:["--mute-audio","--use-gl=angle","--use-angle=d3d11"]});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.addInitScript(({token})=>{localStorage.setItem("shh-token",token);localStorage.setItem("soul-land-fx-v1",JSON.stringify({level:"high",reduce:false,auto:false}));},{token});
  // Chỉ xuất tham chiếu cảnh cho phép đo; không sửa loader, lighting hay bộ phát clip.
  await page.route("**/src/scenes/GameScene.ts*",async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+"\nconst tinhCreate=GameScene.prototype.create;GameScene.prototype.create=function(...a){window.__tinhScene=this;return tinhCreate.apply(this,a);};"});});
  await page.goto(web+"/choi/?light=1");
  await page.getByRole("button",{name:"Vào Thánh Hồn Thôn"}).click();
  await page.waitForFunction(()=>window.__tinhScene?.players.size>0,null,{timeout:60000});
  const map=JSON.parse(readFileSync(path.join(root,"shared/assets/tinh_dau_noi_dia.v2.json"),"utf8"));
  const points=[];
  map.layers.find(l=>l.name==="trees").data.forEach((gid,i)=>{if(gid===38){const x=(i%map.width)*16+8,y=Math.floor(i/map.width)*16+8;points.push({x,y,sx:x-y,sy:(x+y)/2});}});
  assert.ok(points.length);
  const center=points.map(p=>({...p,n:points.filter(q=>Math.abs(q.sx-p.sx)<250&&Math.abs(q.sy-p.sy)<125).length})).sort((a,b)=>b.n-a.n)[0];
  await page.evaluate(p=>window.__tinhScene.room.send("test",{op:"warp",mapId:"tinh_dau_noi_dia",x:p.x,y:p.y}),center);
  await page.waitForFunction(()=>window.__tinhScene?.mapId==="tinh_dau_noi_dia"&&window.__tinhScene.players.size>0,null,{timeout:60000});
  await page.locator("#guide .g-skip").click();await page.locator(".ob-skip").click();
  await page.waitForFunction(()=>!document.querySelector("#guide:not([hidden])")&&!document.querySelector("#onboard:not([hidden])"));
  await page.evaluate(p=>{const c=window.__tinhScene.cameras.main;c.stopFollow();c.centerOn(p.sx,p.sy);window.__isTinh=c=>c.frames.some(f=>f.key.includes("tinh_the_tim")||String(f.frame).includes("tinh_the_tim"));},center);
  if(process.env.TINH_THE_STRESS==="1"){
    // Dữ liệu trình duyệt thử: thay 11×11 ô cách nhau 2 ô, không đổi map repo/server.
    await page.evaluate(()=>{window.__tinhScene.cameras.main.removeBounds();window.__tinhScene.cameras.main.centerOn(-10000,-10000);});await sleep(500);
    await page.evaluate(p=>{const m=window.__tinhScene.isoMap,cx=Math.floor(p.x/16),cy=Math.floor(p.y/16);for(let dy=-10;dy<=10;dy+=2)for(let dx=-10;dx<=10;dx+=2){const x=cx+dx,y=cy+dy;if(x>=0&&x<m.MW&&y>=0&&y<m.MH)m.trees[y*m.MW+x]=38;}window.__tinhScene.cameras.main.centerOn(p.sx,p.sy);},center);
    await sleep(500);
  }
  const stats=()=>page.evaluate(()=>{const s=window.__tinhScene,m=s.isoMap;return{images:s.children.list.filter(o=>o.type==="Image").length,sprites:s.children.list.filter(o=>o.type==="Sprite").length,mapImages:[...m.live.values()].reduce((n,c)=>n+c.ims.length,0),clips:[...m.clips.values()].filter(window.__isTinh).length,textures:s.textures.getTextureKeys().length};});
  const results={stress:process.env.TINH_THE_STRESS==="1",center,totalCrystals:points.length,modes:{},renderer:await page.evaluate(()=>{const gl=window.__tinhScene.game.renderer.gl,e=gl.getExtension("WEBGL_debug_renderer_info");return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):"WebGL";})};
  await sleep(5000);
  for(const mode of ["static","clip"]){
    await page.evaluate(mode=>{for(const c of window.__tinhScene.isoMap.clips.values())if(window.__isTinh(c))c.ms=mode==="static"?1e12:100;},mode);
    await sleep(5000);
    const timing=await page.evaluate(()=>new Promise(resolve=>{const d=[],start=performance.now();let last=start;function tick(t){d.push(t-last);last=t;if(t-start<25000)requestAnimationFrame(tick);else{d.shift();d.sort((a,b)=>a-b);resolve({fps:1000/(d.reduce((a,b)=>a+b,0)/d.length),p1:1000/d[Math.floor(d.length*.99)]});}}requestAnimationFrame(tick);}));
    results.modes[mode]={...timing,...await stats()};assert.ok(results.modes[mode].clips>0);
    await page.screenshot({path:path.join(out,`tinh-the-${mode}.png`)});console.log(mode,results.modes[mode]);
  }
  const a=await page.evaluate(()=>[...window.__tinhScene.isoMap.clips.values()].find(window.__isTinh).current);await sleep(350);
  const b=await page.evaluate(()=>[...window.__tinhScene.isoMap.clips.values()].find(window.__isTinh).current);results.highMoving=a!==b;assert.ok(results.highMoving);
  // Ghi video vòng lặp thật, không ép pha hoặc vá bộ phát.
  const frames=path.join(process.env.TEMP??process.env.TMP??"/tmp",process.env.TINH_THE_STRESS==="1"?"tinh-the-1598-stress-frames":"tinh-the-1598-frames");mkdirSync(frames,{recursive:true});
  results.frameDir=frames;
  for(let n=0;n<32;n++){await page.screenshot({path:path.join(frames,`${String(n).padStart(2,"0")}.png`)});await sleep(100);}
  await page.evaluate(async()=>{const m=await import("/src/combatFx.ts");m.fxPrefs.reduce=true;});await sleep(300);
  results.reduced=await page.evaluate(()=>[...window.__tinhScene.isoMap.clips.values()].filter(window.__isTinh).every(c=>c.current===0));
  await page.evaluate(async()=>{const m=await import("/src/combatFx.ts");m.fxPrefs.reduce=false;m.fxPrefs.level="low";});await sleep(300);
  results.low=await page.evaluate(()=>[...window.__tinhScene.isoMap.clips.values()].filter(window.__isTinh).every(c=>c.current===0));
  await page.evaluate(()=>{const c=window.__tinhScene.cameras.main;c.removeBounds();c.centerOn(-10000,-10000);});await sleep(300);
  results.offscreen=(await stats()).clips;assert.equal(results.offscreen,0);
  await page.evaluate(p=>window.__tinhScene.cameras.main.centerOn(p.sx,p.sy),center);await sleep(500);results.returned=(await stats()).clips;assert.ok(results.returned>0);
  await page.evaluate(()=>{window.__oldTinh=window.__tinhScene.isoMap;window.__tinhScene.room.send("test",{op:"warp",mapId:"thanh_hon_thon"});});
  await page.waitForFunction(()=>window.__tinhScene?.mapId==="thanh_hon_thon"&&window.__tinhScene.players.size>0,null,{timeout:60000});
  results.cleanup=await page.evaluate(()=>({oldImagesAlive:[...window.__oldTinh.clips.keys()].filter(im=>!!im.scene).length,newCrystals:[...window.__tinhScene.isoMap.clips.values()].filter(window.__isTinh).length}));
  writeFileSync(path.join(out,"ket-qua.json"),JSON.stringify(results,null,2));
  assert.ok(results.reduced&&results.low);assert.equal(results.cleanup.oldImagesAlive,0);assert.equal(results.cleanup.newCrystals,0);
  for(const k of ["images","sprites","mapImages","textures"])assert.equal(results.modes.static[k],results.modes.clip[k],k);
}finally{clearTimeout(timer);await browser?.close();cleanup();}
