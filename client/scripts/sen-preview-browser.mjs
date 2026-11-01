// #1551: A/B chỉ qua route của Chrome thử, không nhập asset/cấu hình chính thức.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { senPreview } from "../../tools/assets/sen-preview.mjs";
const root = fileURLToPath(new URL("../../", import.meta.url));
const official=process.env.SEN_OFFICIAL === "1";
assert.ok(process.env.SEN_OUTPUT,"Cần SEN_OUTPUT trỏ thư mục ngoài repo");
const out = path.resolve(process.env.SEN_OUTPUT);
assert.ok(out.toLowerCase() !== path.resolve(root).toLowerCase() && !out.toLowerCase().startsWith(path.resolve(root).toLowerCase()+path.sep), "Ảnh thử phải ngoài repo");
const candidate = path.join(out,"ung-vien");
senPreview(candidate);
const children=[]; let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,"127.0.0.1",()=>{const p=s.address().port;s.close(()=>r(p));});});
function start(args,env){const c=spawn(process.execPath,args,{cwd:root,detached:process.platform!=="win32",env:{...process.env,DATABASE_URL:"",REDIS_URL:"",ADMIN_ACCOUNTS:"",...env},stdio:"ignore"});children.push(c);}
async function ready(url){for(let i=0;i<200;i++){if(await fetch(url).then(r=>r.ok).catch(()=>false))return;await sleep(200);}throw Error(url);}
const cleanup=()=>{for(const c of children){
  if(!c.pid||c.exitCode!==null||c.signalCode!==null)continue;
  if(process.platform==="win32")spawn("taskkill",["/pid",String(c.pid),"/t","/f"],{stdio:"ignore"});
  else try{process.kill(-c.pid);}catch(e){console.warn("Không dọn được nhóm tiến trình thử",e.message);}
}};
const timer=setTimeout(async()=>{await browser?.close().catch(e=>console.warn("Không đóng được Chrome thử",e.message));cleanup();process.exit(1);},300000);
try {
  const api=`http://127.0.0.1:${await port()}`,web=`http://127.0.0.1:${await port()}`;
  start(["server/node_modules/tsx/dist/cli.mjs","--tsconfig","server/tsconfig.json","server/src/index.ts"],{PORT:api.split(":").at(-1),GAME_TEST:"1"});
  start(["client/node_modules/vite/bin/vite.js","client","--host","127.0.0.1","--port",web.split(":").at(-1)],{VITE_SERVER_URL:api});
  await Promise.all([ready(api+"/health"),ready(web)]);
  console.log("Preview",web+"/choi/?light=1");
  const post=async(p,b)=>{const r=await fetch(api+p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});const d=await r.json();assert.ok(r.ok,JSON.stringify(d));return d;};
  const {token}=await post("/api/login",{name:`Sen ${Date.now().toString(36)}`,password:"Sen-local-test!"});
  await post("/api/looks",{token,sex:0,hair:0,hairCol:0,outfitCol:0});
  await post("/api/awaken",{token,vohon:"lam_dien_ba_vuong_long"});
  browser=await chromium.launch({channel:"chrome",headless:false,args:["--mute-audio","--use-gl=angle","--use-angle=d3d11"]});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.addInitScript(({token})=>{localStorage.setItem("shh-token",token);localStorage.setItem("soul-land-fx-v1",JSON.stringify({level:"high",reduce:false,auto:false}));window.__senMode="static";},{token});
  await page.route("**/src/scenes/GameScene.ts*",async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+"\nconst senCreate=GameScene.prototype.create;GameScene.prototype.create=function(...a){window.__senScene=this;return senCreate.apply(this,a);};"});});
  if(!official){
  await page.route("**/iso/tiles.json",async route=>{const response=await route.fetch();const d=await response.json();d.props.sen_phat_sang.clip={key:"prop_sen_phat_sang_clip",frames:32,ms:100};await route.fulfill({json:d});});
  await page.route("**/sen_phat_sang_clip*.png",route=>route.fulfill({path:path.join(candidate,route.request().url().includes("_n.png")?"sen_phat_sang_clip_n.png":"sen_phat_sang_clip.png")}));
  await page.route("**/src/isoMap.ts*",async route=>{const response=await route.fetch();const body=(await response.text()).replace("const n = moving ? Math.floor(this.scene.time.now / clip.ms) % clip.frames.length : 0",'const n = moving && (clip.frames.length !== 32 || window.__senMode === "clip") ? clip.frames.length === 32 && window.__senPhase !== undefined ? window.__senPhase : Math.floor(this.scene.time.now / clip.ms) % clip.frames.length : 0');assert.ok(body.includes("window.__senMode"));await route.fulfill({response,body});});
  await page.route("**/src/lighting.ts*",async route=>{const response=await route.fetch();let body=await response.text();body+='\nimport {fxPrefs as senPrefs,fxLevel as senLevel} from "/src/combatFx.ts";GLOW_PROPS.sen_phat_sang={col:"#caa46a",r:28,i:0.22,h:14};';body=body.replace("d.i * fl * k",'d.i * fl * k * (g.kind !== "sen_phat_sang" ? 1 : window.__senMode !== "light" ? 0 : senPrefs.reduce || senLevel() === "low" ? 1 : 0.85 + 0.15 * Math.cos(time * Math.PI * 2 / 3200))');assert.ok(body.includes("window.__senMode"));await route.fulfill({response,body});});
  // Normal map cùng hình dáng cho cả 32 pha, tránh thay đổi cảm giác khối khi đổi độ sáng.
  const { Img,readPng,encodePng }=await import("../../tools/assets/lib.mjs");
  const normal=readPng(path.join(root,"shared/assets/sprites/iso/props/sen_phat_sang_n.png"));
  const strip=new Img(1024,32);for(let n=0;n<32;n++)strip.blit(normal,0,0,32,32,n*32,0);
  writeFileSync(path.join(candidate,"sen_phat_sang_clip_n.png"),encodePng(strip));
  }
  await page.goto(web+"/choi/?light=1");
  await page.getByRole("button",{name:"Vào Thánh Hồn Thôn"}).click();
  await page.waitForFunction(()=>window.__senScene?.players.size>0,null,{timeout:60000});
  const map=JSON.parse(readFileSync(path.join(root,"shared/assets/loi_tinh_dau.v2.json"),"utf8"));
  const trees=map.layers.find(l=>l.name==="trees").data, points=[];
  trees.forEach((gid,i)=>{if(gid===42){const x=(i%map.width)*16+8,y=Math.floor(i/map.width)*16+8;points.push({x,y,sx:x-y,sy:(x+y)/2});}});
  const center=points.map(p=>({...p,n:points.filter(q=>Math.abs(q.sx-p.sx)<250&&Math.abs(q.sy-p.sy)<125).length})).sort((a,b)=>b.n-a.n)[0];
  await page.evaluate(p=>window.__senScene.room.send("test",{op:"warp",mapId:"loi_tinh_dau",x:p.x,y:p.y}),center);
  await page.waitForFunction(()=>window.__senScene?.mapId==="loi_tinh_dau"&&window.__senScene.players.size>0,null,{timeout:60000});
  await page.locator("#guide .g-skip").click();
  await page.locator(".ob-skip").click();
  await page.waitForFunction(()=>!document.querySelector("#guide:not([hidden])")&&!document.querySelector("#onboard:not([hidden])"));
  await page.evaluate(p=>{const c=window.__senScene.cameras.main;c.stopFollow();c.centerOn(p.sx,p.sy);},center);
  await sleep(5000);
  const stats=()=>page.evaluate(()=>{const s=window.__senScene,m=s.isoMap;return{images:s.children.list.filter(o=>o.type==="Image").length,sprites:s.children.list.filter(o=>o.type==="Sprite").length,mapImages:[...m.live.values()].reduce((n,c)=>n+c.ims.length,0),clips:[...m.clips.values()].filter(c=>c.frames.length===32).length,textures:s.textures.getTextureKeys().length};});
  const renderer=await page.evaluate(()=>{const gl=window.__senScene.game.renderer.gl,e=gl.getExtension("WEBGL_debug_renderer_info");return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):"WebGL";});
  const results={official,center,totalSen:points.length,renderer,modes:{}};
  for(const mode of official?["static","clip"]:["static","clip","light"]){
    await page.evaluate(({mode,official})=>{
      window.__senMode=mode;
      // Bản chính thức: không vá loader/bộ phát; baseline chỉ kéo dài khung 0 của sen.
      if(official)for(const c of window.__senScene.isoMap.clips.values())if(c.frames.length===32)c.ms=mode==="static"?1e12:100;
    },{mode,official});await sleep(5000);
    const timing=await page.evaluate(()=>new Promise(resolve=>{const d=[],start=performance.now();let last=start;function tick(t){d.push(t-last);last=t;if(t-start<25000)requestAnimationFrame(tick);else{d.shift();d.sort((a,b)=>a-b);resolve({fps:1000/(d.reduce((a,b)=>a+b,0)/d.length),p1:1000/d[Math.floor(d.length*.99)]});}}requestAnimationFrame(tick);}));
    results.modes[mode]={...timing,...await stats()};
    assert.ok(results.modes[mode].clips>0,"Phải có sen thật trong cảnh");
    if(mode==="clip"){
      const a=await page.evaluate(()=>[...window.__senScene.isoMap.clips.values()].find(c=>c.frames.length===32).current);
      await sleep(400);
      const b=await page.evaluate(()=>[...window.__senScene.isoMap.clips.values()].find(c=>c.frames.length===32).current);
      results.highMoving=a!==b;assert.ok(results.highMoving);
    }
    await page.screenshot({path:path.join(out,`sen-${mode}.png`)});
    console.log(mode,results.modes[mode]);
    if(mode==="clip"&&!official){
      const frames=path.join(out,`${mode}-frames`);mkdirSync(frames,{recursive:true});
      for(let n=0;n<32;n++){await page.evaluate(n=>window.__senPhase=n,n);await sleep(100);await page.screenshot({path:path.join(frames,`${String(n).padStart(2,"0")}.png`)});}
      await page.evaluate(()=>delete window.__senPhase);
    }
  }
  await page.evaluate(async()=>{window.__senMode="clip";const m=await import("/src/combatFx.ts");m.fxPrefs.reduce=true;});await sleep(300);
  results.reduced=await page.evaluate(()=>[...window.__senScene.isoMap.clips.values()].filter(c=>c.frames.length===32).every(c=>c.current===0));
  await page.evaluate(async()=>{const m=await import("/src/combatFx.ts");m.fxPrefs.reduce=false;m.fxPrefs.level="low";});await sleep(300);
  results.low=await page.evaluate(()=>[...window.__senScene.isoMap.clips.values()].filter(c=>c.frames.length===32).every(c=>c.current===0));
  await page.evaluate(()=>{const c=window.__senScene.cameras.main;c.removeBounds();c.centerOn(-10000,-10000);});await sleep(300);
  results.offscreenSen=await page.evaluate(()=>[...window.__senScene.isoMap.clips.values()].filter(c=>c.frames.length===32).length);
  assert.equal(results.offscreenSen,0);
  await page.evaluate(p=>window.__senScene.cameras.main.centerOn(p.sx,p.sy),center);await sleep(500);
  results.returnedSen=(await stats()).clips;assert.ok(results.returnedSen>0);
  await page.evaluate(()=>{window.__oldSenMap=window.__senScene.isoMap;window.__senScene.room.send("test",{op:"warp",mapId:"thanh_hon_thon"});});
  await page.waitForFunction(()=>window.__senScene?.mapId==="thanh_hon_thon"&&window.__senScene.players.size>0,null,{timeout:60000});
  results.cleanup=await page.evaluate(()=>({oldImagesAlive:[...window.__oldSenMap.clips.keys()].filter(im=>!!im.scene).length,newSceneSen:[...window.__senScene.isoMap.clips.values()].filter(c=>c.frames.length===32).length}));
  writeFileSync(path.join(out,"ket-qua.json"),JSON.stringify(results,null,2));
  assert.ok(results.reduced&&results.low);assert.equal(results.cleanup.oldImagesAlive,0);assert.equal(results.cleanup.newSceneSen,0);
  for(const m of Object.values(results.modes))for(const k of ["images","sprites","mapImages","textures"])assert.equal(m[k],results.modes.static[k],k);
} finally {clearTimeout(timer);await browser?.close();cleanup();}
