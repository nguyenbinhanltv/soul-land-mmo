// Ảnh kiểm runtime #1382; chạy khi Vite worktree ở cổng 5198. Luôn tắt tiếng.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../../../../../client/package.json', import.meta.url));
const { chromium } = require('playwright');
const out = fileURLToPath(new URL('../ingame/',import.meta.url)); fs.mkdirSync(out,{recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1600,height:600}}), errors=[], records=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.addInitScript(()=>localStorage.setItem('soul-land-audio-v1',JSON.stringify({muted:true,master:0})));
try {
 for(const sex of ['m','f']) {
  await page.goto(`http://127.0.0.1:5198/choi/?thu=vukhi&vh=hoa_anh&gioi=${sex}&trang=idle&ms=0&zoom=2&khac=bach_ho`);
  await page.waitForFunction(()=>window.__vukhi?.mode()==='that'&&window.__vukhi.ready(),{},{timeout:60000});
  await page.waitForFunction(()=>document.querySelector('#vm')?.textContent.includes('sẵn sàng'),{},{timeout:30000});
  for(const clip of ['idle','walk','attack','cast','hurt'])for(const ms of [0,100,250,400]) {
   await page.evaluate(({clip,ms})=>{document.querySelector('#vs').value=clip;document.querySelector('#vt').value=String(ms);window.__vukhi.at(ms,clip);},{clip,ms});
   await page.waitForFunction(()=>window.__vukhi.ready(),{},{timeout:30000});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const state=await page.evaluate(()=>({mode:window.__vukhi.mode(),ready:window.__vukhi.ready(),shown:window.__vukhi.shown(),fallback:window.__vukhi.fallback()}));
   if(state.mode!=='that'||!state.ready||!state.fallback)throw Error(JSON.stringify(state));
   const name=`${sex}-${clip}-${ms}.png`;await page.screenshot({path:path.join(out,name)});records.push({sex,clip,ms,file:name,...state});
  }
  await page.locator('#vc').check();await page.evaluate(()=>{document.querySelector('#vs').value='attack';document.querySelector('#vt').value='250';window.__vukhi.at(250,'attack');});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const shown=await page.evaluate(()=>window.__vukhi.shown());if(shown!==0)throw Error(`Chân Thân còn ${shown} vũ khí`);
  await page.screenshot({path:path.join(out,`${sex}-chan-than.png`)});
 }
 fs.writeFileSync(path.join(out,'source.json'),JSON.stringify({date:'2026-10-30',url:'http://127.0.0.1:5198/choi/?thu=vukhi&vh=hoa_anh',browser:'Chrome headless, --mute-audio; Phaser noAudio; localStorage muted',records,errors,chanThanShown:0},null,2)+'\n');
 if(errors.length)throw Error(errors.join('\n'));
 const sections=['m','f'].map(sex=>`<h2>${sex==='m'?'Nam':'Nữ'}</h2>`+['idle','walk','attack','cast','hurt'].map(clip=>`<h3>${clip}</h3>`+records.filter(r=>r.sex===sex&&r.clip===clip).map(r=>`<details${r.ms===250?' open':''}><summary>${r.ms} ms</summary><img src="${r.file}" alt="${sex} ${clip} ${r.ms} ms"></details>`).join('')).join('')+`<h3>Chân Thân: thu vũ khí</h3><img src="${sex}-chan-than.png">`).join('');
 fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><title>Hỏa Ảnh — ảnh kiểm game</title><style>body{background:#142018;color:#eee;font:16px system-ui;margin:24px}a{color:#b5a1ff}img{max-width:100%;image-rendering:pixelated}summary{cursor:pointer;margin:12px}</style><h1>Hỏa Ảnh — mẫu găng-vuốt</h1><p>Ảnh thật trong ?thu=vukhi, Chrome tắt tiếng. Giới hạn ở <a href="../NGUON.md">NGUON.md</a>. Mỗi ảnh gồm s/se/e/ne/n/w và Bạch Hổ không vũ khí.</p>${sections}</html>`);
 console.log(`Đã kiểm ${records.length} ảnh runtime + hai ảnh Chân Thân, 0 lỗi browser`);
} finally {await browser.close();}
