import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const {chromium}=createRequire(new URL('../../../../../client/package.json',import.meta.url))('playwright');
const root=fileURLToPath(new URL('../../../../../',import.meta.url));
const out=fileURLToPath(new URL('./ingame/',import.meta.url));fs.mkdirSync(out,{recursive:true});
const children=[],errors=[],items=[];let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const port=()=>new Promise(r=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
function start(args,env){const c=spawn(process.execPath,args,{cwd:root,env:{...process.env,DATABASE_URL:'',REDIS_URL:'',ADMIN_ACCOUNTS:'',...env},stdio:['ignore','pipe','pipe']});children.push(c);c.stderr.on('data',d=>console.error(String(d)));}
async function ready(url){for(let i=0;i<200;i++){if(await fetch(url).then(r=>r.ok).catch(()=>false))return;await sleep(200);}throw Error('Không mở được '+url);}
try{
 const ap=await port(),wp=await port(),api=`http://127.0.0.1:${ap}`,web=`http://127.0.0.1:${wp}`;
 start(['server/node_modules/tsx/dist/cli.mjs','--tsconfig','server/tsconfig.json','server/src/index.ts'],{PORT:String(ap),GAME_TEST:'1'});
 start(['client/node_modules/vite/bin/vite.js','client','--host','127.0.0.1','--port',String(wp),'--strictPort'],{VITE_SERVER_URL:api});
 await Promise.all([ready(api+'/health'),ready(web)]);
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const post=async(p,b)=>{const r=await fetch(api+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const d=await r.json();if(!r.ok)throw Error(JSON.stringify(d));return d;};
 for(const [sex,number] of [['m',0],['f',1]]){
  const {token}=await post('/api/login',{name:`Cung857${sex}${Date.now().toString(36)}`,password:'Local-art-857!'});
  await post('/api/looks',{token,sex:number,hair:0,hairCol:0,outfitCol:0});
  await post('/api/awaken',{token,vohon:'ta_hoa_phuong_hoang'});
  const page=await browser.newPage({viewport:{width:1600,height:900}});page.on('pageerror',e=>errors.push(e.stack||String(e)));
  await page.addInitScript(({token})=>{localStorage.setItem('shh-token',token);localStorage.setItem('soul-land-audio-v1',JSON.stringify({master:0,music:0,sfx:0,ui:0,ambient:0,muted:true}));},{token});
  await page.route('**/src/scenes/GameScene.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nconst oldCreate857=GameScene.prototype.create;GameScene.prototype.create=function(...args){window.__cucScene=this;return oldCreate857.apply(this,args);};'});});
  console.log('Mở game',sex); await page.goto(web+'/choi?pfx=0');await page.getByRole('button',{name:'Vào Thánh Hồn Thôn'}).click();
  await page.waitForFunction(()=>window.__cucScene?.players.size>0&&window.__cucScene.owned,{},{timeout:45000});console.log('Scene sẵn sàng',sex);
  await page.evaluate(()=>window.__cucScene.room.send('test',{op:'grant',vohon:'bang_phuong_hoang'}));
  await page.waitForFunction(()=>window.__cucScene.owned.list.some(v=>v.vohon==='bang_phuong_hoang'));
  await page.evaluate(()=>{const s=window.__cucScene,r=s.owned.list.find(v=>v.vohon==='bang_phuong_hoang').rowId;s.room.send('team',{slots:[r,0,0,0]});});
  await page.waitForFunction(()=>window.__cucScene.owned.active===window.__cucScene.owned.list.find(v=>v.vohon==='bang_phuong_hoang').rowId);
  await page.waitForTimeout(6000);console.log('Đã chọn Băng Phượng',sex);await page.evaluate(()=>{const s=window.__cucScene,v=s.players.get(s.me);s.lpc.ready(v.lpcKey,'cast');s.lpc.ready(v.lpcKey,'attack');});await page.waitForTimeout(5000);
  await page.waitForTimeout(5000); for(let k=0;k<3;k++){const b=page.getByRole('button',{name:'Bỏ qua',exact:true});if(await b.count())await b.first().click();await page.waitForTimeout(300);} await page.evaluate(()=>{window.__cucScene.room.send('test',{op:'goto',x:2088,y:1232});});await page.waitForTimeout(1800);console.log('Đã bỏ hướng dẫn',sex);await page.evaluate(()=>{window.__cucScene.cameras.main.setZoom(3);});
  for(const dir of ['s','se','e','ne','n'])for(const [clip,ms]of [['attack',0],['attack',100],['attack',190],['attack',260],['cast',360]]){
   await page.evaluate(({dir,clip,ms})=>{const s=window.__cucScene;s.__cucConfig={dir,clip,ms};if(!s.__cucAnimate){s.__cucAnimate=s.animatePlayer;s.animatePlayer=function(id,v,p,time,moving,spd){if(id!==this.me)return this.__cucAnimate(id,v,p,time,moving,spd);const c=this.__cucConfig;v.face=c.dir;v.lpcFace.shown=['se','ne'].includes(c.dir)?'e':c.dir;v.act={anim:c.clip,t0:time-c.ms};this.__cucAnimate(id,v,p,time,false,spd);const ds=c.clip==='cast'?[100,200,140]:[70,70,90,120];let sum=0,step=0;for(;step<ds.length-1;step++){sum+=ds[step];if(c.ms<sum)break;}if(v.body.anims.currentAnim?.frames[step])v.body.anims.setCurrentFrame(v.body.anims.currentAnim.frames[step]);this.__cucAnimate(id,v,p,time,false,spd);};}s.players.get(s.me).playing='';},{dir,clip,ms});
   await page.waitForTimeout(400);const file=`game-${sex}-${dir}-${clip}-${ms}.png`;console.log('Chụp',file);await page.screenshot({path:path.join(out,file),timeout:15000});const state=await page.evaluate(()=>{const s=window.__cucScene,v=s.players.get(s.me);return{...s.__cucConfig,body:v.body.frame.name,weapon:v.vf.frame.name,texture:v.vf.texture.key,muted:JSON.parse(localStorage.getItem('soul-land-audio-v1')).muted};});items.push({file,sex,...state});console.log(file);
  }
  for(const [clip,ms]of [['idle',0],['walk',100],['attack',190],['cast',360]]){await page.goto(`${web}/choi?pfx=0&thu=vukhi&vh=bang_phuong_hoang&gioi=${sex}&trang=${clip}&ms=${ms}&zoom=3&tay=0`);await page.waitForFunction(()=>window.__vukhi?.mode()==='that'&&window.__vukhi.ready());await page.waitForFunction(()=>document.querySelector('#vm')?.textContent.includes('sẵn sàng'));await page.waitForTimeout(300);const file=`test-${sex}-${clip}-${ms}.png`;await page.screenshot({path:path.join(out,file)});items.push({file,sex,clip,ms,scene:'VukhiScene'});}
  await page.close();
 }
 fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({items,errors,method:'Playwright Chrome --mute-audio, RAM riêng; GameScene.animatePlayer thật, cố định bước thân và đồng hồ để chụp; không sửa repo.',viewport:[1600,900]},null,2));
 if(errors.length)throw Error(JSON.stringify(errors));console.log(JSON.stringify({out,images:items.length,errors}));
}finally{await browser?.close();for(const c of children){try{const k=spawn('taskkill',['/PID',String(c.pid),'/T','/F'],{stdio:'ignore'});await new Promise(r=>k.on('exit',r));}catch{}}}
