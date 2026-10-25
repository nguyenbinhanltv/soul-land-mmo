// C16: ảnh game thật và hồi quy marker trang rèn/toast; runtime RAM riêng, không DB ngoài.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const root=fileURLToPath(new URL('../../', import.meta.url));
const out=resolve(process.env.C16_OUTPUT ?? resolve(tmpdir(),'c16-preview'));
mkdirSync(out, {recursive:true});
const before=process.env.C16_BEFORE === '1';
const {execFileSync}=await import('node:child_process');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sourceDirty=!!execFileSync('git',['diff','--name-only','HEAD','--','client/src','shared'],{cwd:root,encoding:'utf8'}).trim();
const children=[]; let browser; let stopping=false;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise((res,rej)=>{const s=createServer();s.on('error',rej);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
function start(args,extra){const c=spawn(process.execPath,args,{cwd:root,detached:true,env:{...process.env,DATABASE_URL:'',REDIS_URL:'',ADMIN_ACCOUNTS:'',...extra},stdio:['ignore','pipe','pipe']});children.push(c);let log='';for(const s of [c.stdout,c.stderr])s.on('data',d=>log=(log+d).slice(-4000));c.on('exit',code=>{if(code&&!stopping)console.error('runtime exit',code,log);});}
async function ready(url){for(let n=0;n<150;n++){if(await fetch(url).then(r=>r.ok).catch(()=>false))return;await delay(200);}throw Error('runtime not ready');}
try{
 const apiPort=await port(),webPort=await port(),api=`http://127.0.0.1:${apiPort}`,web=`http://127.0.0.1:${webPort}`;
 start(['server/node_modules/tsx/dist/cli.mjs','--tsconfig','server/tsconfig.json','server/src/index.ts'],{PORT:String(apiPort),GAME_TEST:'1'});
 start(['client/node_modules/vite/bin/vite.js','client','--host','127.0.0.1','--port',String(webPort)],{VITE_SERVER_URL:api});
 await Promise.all([ready(api+'/health'),ready(web)]);console.log('Runtime RAM riêng',web);

 const post=async(p,b)=>{const r=await fetch(api+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const d=await r.json();if(!r.ok)throw Error(p+' status '+r.status);return d;};
 const {token}=await post('/api/login',{name:'tthoa_c16_demo',password:'Local-baseline-only!'});
 await post('/api/looks',{token,sex:0,hair:0,hairCol:0,outfitCol:0});await post('/api/awaken',{token,vohon:'lam_dien_ba_vuong_long'});
 browser=await chromium.launch({...(process.env.C16_CHANNEL ? {channel:process.env.C16_CHANNEL}:{}),headless:true,args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[], contrast=[];page.on('pageerror',e=>errors.push({message:e.message,jsonLoader:/JSONFile\d*\.onProcess/.test(e.stack??'')}));
 await page.addInitScript(({token})=>localStorage.setItem('shh-token',token),{token});
 await page.route('**/src/scenes/GameScene.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nconst c16Create=GameScene.prototype.create; GameScene.prototype.create=function(...args){window.__c16Scene=this;return c16Create.apply(this,args);};'});});
 await page.goto(web+'/choi/');await page.getByRole('button',{name:'Vào Thánh Hồn Thôn'}).click();
 await page.waitForFunction(()=>window.__c16Scene?.players.size>0&&window.__c16Scene.owned&&window.__c16Scene.bag,null,{timeout:60000});await delay(1500);
 if(!before) {
  const result=await page.evaluate(async(dataPath)=>{
   document.querySelector('#toasts')?.remove();
   const f=await import('/src/feedback.ts'); const {RARE_LOOT_MIN}=await import('/src/audio/soundMap.ts'); const {TIERS,RING_ITEM}=await import('/@fs'+dataPath);
   const ring=(years)=>({id:'r'+years,code:RING_ITEM,qty:1,years,stars:null,enhance:0,vohon:null,stats:null});
   const rare=ring(TIERS[RARE_LOOT_MIN].years); const common=ring(TIERS[RARE_LOOT_MIN].years-1);
   f.lootToasts([], [rare,common]);
   const nodes=()=>[...document.querySelectorAll('#toasts .toast')];
   const rareNode=nodes().find(t=>t.dataset.frame==='rare-ring');
   const initial={count:nodes().length,rareCount:nodes().filter(t=>t.dataset.frame==='rare-ring').length,rareKind:rareNode?.dataset.k};
   f.lootToasts([], [rare]);
   const merged={count:nodes().length,n:rareNode?.querySelector('.tn')?.textContent};
   f.toast('quest',rareNode?.dataset.title ?? 'x');
   const quest=nodes().find(t=>t.dataset.k==='quest');
   rareNode?.click();
   return {initial,merged,questFrame:quest?.dataset.frame??'',dismissed:rareNode?.classList.contains('out')};
  }, resolve(root,'shared/data.ts'));
  assert.equal(result.initial.rareCount,1,'Chỉ hồn hoàn hiếm phải có marker C2');
  assert.equal(result.initial.rareKind,'loot');assert.equal(result.initial.count,2);
  assert.equal(result.merged.count,2);assert.equal(result.merged.n,'×2');assert.equal(result.questFrame,'');assert.equal(result.dismissed,true);
  console.log('✓ Marker hiếm, ngưỡng có sẵn, gộp toast và bấm đóng');
 }

 async function shot(file, requiredText = []) {
  await page.mouse.move(2,2); await delay(300);
  const png=await page.screenshot({path:resolve(out,file)});
  if(before)return;
  const observed=await page.evaluate(async({data,helper})=>{
   const {insideScrollport}=await import(helper);
   const image=new Image();image.src='data:image/png;base64,'+data;
   await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
   const ink=document.createElement('canvas').getContext('2d');
   const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);
   const rows=[], clippedText=[];
   for(const root of document.querySelectorAll('#char:not([hidden]),#npc[data-c16-page]:not([hidden]),.toast[data-k="level"],.toast[data-frame="rare-ring"]')) {
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
     const text=walker.currentNode;if(!text.textContent.trim())continue;
     const el=text.parentElement,style=getComputedStyle(el);if(style.visibility==='hidden')continue;
     const range=document.createRange();range.selectNodeContents(text);
     const r=range.getBoundingClientRect();if(r.width<1||r.height<1||r.left<0||r.top<0||r.right>innerWidth||r.bottom>innerHeight)continue;
     if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
     ink.clearRect(0,0,1,1);ink.fillStyle=style.color;ink.fillRect(0,0,1,1);const fg=[...ink.getImageData(0,0,1,1).data].slice(0,3);
     let clipped=false;for(let a=el.parentElement;a;a=a.parentElement){const cs=getComputedStyle(a);if(['auto','scroll','hidden'].includes(cs.overflowY)){const cr=a.getBoundingClientRect();if(!insideScrollport(r,cr,a.clientTop,a.clientHeight)){clippedText.push({text:text.textContent.trim(),textTop:r.top,textBottom:r.bottom,ancestor:a.id||a.className,panelTop:cr.top,panelBottom:cr.bottom,clientTop:a.clientTop,clientHeight:a.clientHeight});clipped=true;}}}if(clipped)continue;
     const x=Math.floor(r.x),y=Math.floor(r.y),w=Math.max(1,Math.floor(r.width)),h=Math.max(1,Math.floor(r.height));
     const pixels=ctx.getImageData(x,y,w,h).data,hist=new Map();
     for(let i=0;i<pixels.length;i+=4){const k=[pixels[i],pixels[i+1],pixels[i+2]].join(',');hist.set(k,(hist.get(k)??0)+1);}
     let bg=[0,0,0],remaining=1;for(let a=el;a&&remaining>.001;a=a.parentElement){ink.clearRect(0,0,1,1);ink.fillStyle=getComputedStyle(a).backgroundColor;ink.fillRect(0,0,1,1);const c=[...ink.getImageData(0,0,1,1).data],alpha=c[3]/255;bg=bg.map((v,i)=>v+c[i]*alpha*remaining);remaining*=1-alpha;}bg=bg.map(Math.round);
     const sampled=[...hist].map(([color,n])=>({color:color.split(',').map(Number),n})).sort((a,b)=>a.color.reduce((v,c,i)=>v+(c-bg[i])**2,0)-b.color.reduce((v,c,i)=>v+(c-bg[i])**2,0))[0].color;
     const cssBg=bg;if(sampled.some((c,i)=>Math.abs(c-bg[i])>3)){rows.push({text:text.textContent.trim(),fg,bg,sampled,ratio:0,reason:'Không xác nhận được nền composite trong ảnh'});continue;}bg=sampled;
     const a=lum(fg),b=lum(bg);rows.push({text:text.textContent.trim(),fg,bg,cssBg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
    }
   }return {rows,clippedText};
  },{data:png.toString('base64'),helper:'/@fs'+resolve(root,'client/scripts/c16-contrast.mjs')});
  const measurements=observed.rows;
  contrast.push({file,measurements,clippedText:observed.clippedText});
  for(const text of requiredText)assert.ok(measurements.some(r=>r.text===text),file+': bắt buộc đo nhãn '+text+' sau cuộn');
  assert.ok(measurements.length>=2,file+': phải đo được nội dung chữ');
  const bad=measurements.filter(x=>x.ratio<4.5);
  assert.deepEqual(bad,[],file+': tương phản chữ trên nền composite phải >=4,5:1');
 }
 for(const vp of [{width:1280,height:720,touch:false},{width:960,height:540,touch:false},{width:844,height:390,touch:true}]){
  await page.evaluate(()=>document.querySelector('#toasts')?.remove());
  await page.setViewportSize({width:vp.width,height:vp.height});
  await page.evaluate(t=>document.body.classList.toggle('touch',t),vp.touch);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:vp.touch});await cdp.detach();
  await page.evaluate(async()=>{const h=await import('/src/hud.ts');const c=await import('/src/charPanel.ts');h.closeNpc();c.toggleChar(true);});await delay(500);
  await page.locator('#char [data-tab=bone]').evaluate(el=>el.click());await delay(250);assert.ok(await page.locator('#char').isVisible(),'Phải chụp đúng bảng Nhân vật');await shot(`${before?'before':'after'}-${vp.width}x${vp.height}-nhan-vat-hon-cot.png`);
  await page.locator('#char .cgroup').filter({hasText:/^Phụ$/}).evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));await delay(250);await shot(`${before?'before':'after'}-${vp.width}x${vp.height}-nhan-vat-chi-so-cuon.png`,['Phụ']);await page.locator('#char').evaluate(el=>el.scrollTop=0);
  await page.locator('#char [data-tab=core]').evaluate(el=>el.click());await delay(250);assert.ok(await page.locator('#char').isVisible(),'Phải chụp đúng bảng Nhân vật');await shot(`${before?'before':'after'}-${vp.width}x${vp.height}-nhan-vat-hon-hach.png`);
  async function npc(){await page.evaluate(async()=>{const h=await import('/src/hud.ts');const s=window.__c16Scene;const noop=()=>{};h.closeNpc();h.toggleWorld(false);h.openNpc('lo_ren',s.bag,{buy:noop,sell:noop,buyback:noop,expand:noop,enhance:noop,enhanceCore:noop,combat:()=>false,coreSet:noop,quest:noop,arena:noop,tong:noop,shard:noop,shardInfo:noop,gear:()=>s.gear??null,equipEnh:noop,equipEnhPreview:noop,equipLuck:noop,equipLuckPreview:noop,equipSynth:noop,equipSalvage:noop,owned:()=>[],looks:()=>null,changeLooks:noop});});}
  for(const [label,file]of [['Cường hóa hồn cốt','tho-ren-cuong-hoa'],['Nâng cấp hồn hạch','tho-ren-nang-cap'],['Hợp thành trang bị (3 → 1)','tho-ren-hop-thanh']]){await npc();await page.getByRole('button',{name:label,exact:true}).evaluate(el=>el.click());await delay(300);if(!before)assert.equal(await page.locator('#npc').getAttribute('data-c16-page'),{'tho-ren-cuong-hoa':'forge','tho-ren-nang-cap':'forgecore','tho-ren-hop-thanh':'forgesynth'}[file]);await shot(`${before?'before':'after'}-${vp.width}x${vp.height}-${file}.png`);}
  if(!before){await npc();assert.equal(await page.locator('#npc').getAttribute('data-c16-page'),null);await page.evaluate(async()=>(await import('/src/hud.ts')).closeNpc());assert.equal(await page.locator('#npc').getAttribute('data-c16-page'),null);}
  await page.evaluate(async()=>{(await import('/src/hud.ts')).closeNpc();const f=await import('/src/feedback.ts');f.toast('level','Cấp 30','Lam Điện Bá Vương Long','#ffe08a');f.lootToasts([],[{id:'c16-baseline-ring',code:'hon_hoan',qty:1,years:10000,stars:null,enhance:0,vohon:null,stats:null}]);});await delay(150);await shot(`${before?'before':'after'}-${vp.width}x${vp.height}-thong-bao.png`);
 }
 writeFileSync(out+'/contrast.json',JSON.stringify(contrast,null,2));
 writeFileSync(out+'/evidence.json',JSON.stringify({sha,sourceDirty,tool:'Playwright Chrome headless --mute-audio',viewports:['1280x720','960x540','844x390 touch'],runtime:'server RAM riêng, không DB/Redis',fixture:'Game thật; Nhân vật state server; trang NPC gọi openNpc với bag thật/no-op actions, chọn tab/trang bằng DOM handler, toast gọi hàm hiển thị trực tiếp. Không chứng minh server phát sinh sự kiện hay thao tác rèn.',pageErrors:errors,aoBrowser:'Không kiểm E2E AO Browser; thiếu capability'},null,2));
 assert.deepEqual(errors.filter(e=>!(e.jsonLoader&&e.message.startsWith("Unexpected token '<'"))),[], 'Lỗi trình duyệt mới ngoài lỗi JSON loader baseline');
 console.log('Đã chụp 21 ảnh game (3 viewport, gồm nhãn Phụ sau cuộn); lỗi JSON loader baseline:',errors.length);
}finally{stopping=true;await browser?.close().catch(()=>{});for(const c of children){try{process.kill(-c.pid);}catch{}}}
