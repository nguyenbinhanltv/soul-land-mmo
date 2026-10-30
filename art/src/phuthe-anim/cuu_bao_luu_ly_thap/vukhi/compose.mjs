// Atlas tháp riêng #1399; chỉ ghép art, dùng nguyên checker/cutter canonical.
// node art/src/phuthe-anim/cuu_bao_luu_ly_thap/vukhi/compose.mjs --sources <json> --out <tmp>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Img, readPng, encodePng } from '../../../../../tools/assets/lib.mjs';
import { components, medianCut, nearest } from '../../../../../tools/assets/beast-sheet-cut.mjs';
import { dummySheet, gripPoints } from '../../../../../tools/assets/phuthe-sheet-dummy.mjs';
import { DIRS, sheetCells, bodyStepOf, framesOf, gameAnims, gameRow, frameOrigin } from '../../../../../tools/assets/phuthe-sheet-lib.mjs';
import { checkPhuThe, toJson, writeReport } from '../../../../../tools/assets/phuthe-sheet-check.mjs';
import { cutPhuThe } from '../../../../../tools/assets/phuthe-sheet-cut.mjs';
import { buildPreview } from '../../../../../tools/assets/phuthe-sheet-preview.mjs';
const args=process.argv.slice(2), val=k=>args[args.indexOf(k)+1];
if(!args.includes('--sources')||!args.includes('--out'))throw Error('Cần --sources và --out');
const id='cuu_bao_luu_ly_thap', F=128, scale=.06;
const sources=JSON.parse(fs.readFileSync(val('--sources'),'utf8').replace(/^\uFEFF/,''));
const dirs=DIRS.filter(d=>sources[d]), out=path.resolve(val('--out'));
if(!dirs.length)throw Error('Thiếu nguồn');
fs.mkdirSync(out,{recursive:true});
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const registration=p=>p[1]>220&&p[0]<100&&p[2]<150;
const map={idle:[0,0],walk:[1,1,1,1],attack:[2,3,4,5],cast:[6,7],hurt:[0]};
const inputs=[],colors=[];
for(const dir of dirs){
 const source=sources[dir],raw=readPng(source.raw),mask=new Uint8Array(raw.w*raw.h);
 for(let i=0;i<mask.length;i++){const p=raw.get(i%raw.w,Math.floor(i/raw.w));mask[i]=p[3]>127&&!(p[0]>170&&p[2]>170&&p[1]<100)?1:0;}
 const parts=components(mask,raw.w,raw.h).filter(c=>c.area>1000),poses=Array(8);
 if(parts.length!==8)throw Error(`${dir}: cần tám hình, thấy ${parts.length}`);
 for(const c of parts){
  const dots=c.px.filter(i=>registration(raw.get(i%raw.w,Math.floor(i/raw.w))));
  if(dots.length<10)throw Error(`${dir}: thiếu marker đáy`);
  const root=dots.reduce((a,i)=>[a[0]+i%raw.w+.5,a[1]+Math.floor(i/raw.w)+.5],[0,0]).map(v=>v/dots.length);
  const slot=Math.floor(c.cy/(raw.h/2))*4+Math.floor(c.cx/(raw.w/4));
  if(poses[slot])throw Error(`${dir}: trùng ô${slot}`);
  const im=new Img(raw.w,raw.h);
  for(const i of c.px){const p=raw.get(i%raw.w,Math.floor(i/raw.w));if(!registration(p)){im.set(i%raw.w,Math.floor(i/raw.w),p);colors.push(p.slice(0,3));}}
  poses[slot]={im,root,box:[c.x0,c.y0,c.x1,c.y1]};
 }
 inputs.push({dir,raw,poses});
 const folder=path.dirname(source.raw),prompt=path.join(folder,'prompt.txt');
 fs.writeFileSync(path.join(folder,'source.json'),JSON.stringify({date:'2026-10-31',tool:'Codex / OpenAI image_gen tích hợp',model:null,seed:null,direction:dir,attempt:source.attempt,references:(source.references??[]).map(f=>({path:path.relative(folder,f).replaceAll('\\','/'),sha256:sha(f)})),status:'selected',rawUnmodified:true,image:{path:'poses.raw.png',sha256:sha(source.raw)},prompt:{path:'prompt.txt',sha256:sha(prompt)},compositor:{path:'../../compose.mjs',sha256:sha(fileURLToPath(import.meta.url))},license:'Đầu ra OpenAI theo điều khoản dịch vụ; LPC giữ giấy phép lớp nguồn.'},null,2)+'\n');
}
const palette=medianCut(colors,31);palette.push([26,16,32]);
const boards={},plans=[],[ox,oy]=frameOrigin(F);
for(const {dir,poses}of inputs){
 for(const sex of ['m','f']){
  const board=dummySheet({group:'A',dir,sex,frame:F,key:'#00D0D0',guideKey:'#7A5CFF',gripKey:'#00FF60',gripN:1,id}).img;
  for(const c of sheetCells('A')){
   const step=bodyStepOf(c.anim,framesOf('A')[c.anim],c.frame),g=gripPoints({sex,dir,clip:c.anim,step,frame:F,count:1,id});
   if(!g.hands.length)throw Error(`${sex}/${dir}/${c.anim}: không đo được tay`);
   const hand=g.hands[0].map(v=>v*F/256),p=poses[map[c.anim][c.frame]],im=new Img(F,F);
   let near=Infinity,edge=0,pixels=0;
   for(let y=0;y<F;y++)for(let x=0;x<F;x++){
    const sx=Math.floor(p.root[0]+(x+.5-hand[0])/scale),sy=Math.floor(p.root[1]+(y+.5-hand[1])/scale);
    if(sx<0||sy<0||sx>=p.im.w||sy>=p.im.h||!p.im.alpha(sx,sy))continue;
    const col=palette[nearest(p.im.get(sx,sy),palette)];im.set(x,y,[...col,255]);pixels++;
    near=Math.min(near,Math.hypot(x+.5-hand[0],y+.5-hand[1]));if(x<2||y<2||x>=F-2||y>=F-2)edge++;
   }
   if(pixels<15||edge||near>2)throw Error(`${sex}/${dir}/${c.anim}/${c.frame}: ${JSON.stringify({pixels,near,edge})}`);
   for(let y=0;y<256;y++)for(let x=0;x<256;x++){const p=im.get(Math.floor(x*F/256),Math.floor(y*F/256));if(p[3])board.set(c.col*256+x,c.row*256+y,p);}
   plans.push({...c,sex,dir,name:`${dir}/${c.anim}/${c.frame}`,step,measuredStep:g.step,fallback:g.fallback,hand,pose:map[c.anim][c.frame],pixels,near,edge});
  }
  const folder=path.join(out,`boards-${sex}`);fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,`to${'ABCDE'[DIRS.indexOf(dir)]}.png`),encodePng(board));
  (boards[sex]??={})['ABCDE'[DIRS.indexOf(dir)]]=board;
 }
}
const checks={};
for(const sex of ['m','f']){const r=checkPhuThe(id,{kind:'vukhi',frame:F,sex,dir:path.join(out,`boards-${sex}`),dummyKey:'#00D0D0',guideKey:'#7A5CFF',gripKey:'#00FF60'});checks[sex]=toJson(r);writeReport(r,path.join(out,`review-${sex}`));if(r.level==='chặn')throw Error(`${sex}: checker chặn`);}
fs.writeFileSync(path.join(out,'compose-report.json'),JSON.stringify({id,F,scale,palette,dirs,plans,checks},null,2)+'\n');
console.log(JSON.stringify({dirs,frames:plans.length,maxA:Math.max(...plans.map(p=>p.near)),levels:Object.fromEntries(Object.entries(checks).map(([s,c])=>[s,c.level]))}));
if(dirs.length!==5)process.exit(0);
const paletteFile=path.join(out,'palette.gpl');fs.writeFileSync(paletteFile,`GIMP Palette\nName: Cuu Bao\nColumns: 8\n#\n${palette.map(c=>c.join(' ')).join('\n')}\n`);
const halves={b:new Img(13*F,10*F),f:new Img(13*F,10*F)},cuts={},layers={};let entries;
for(const sex of ['m','f']){
 const lop={huong:Object.fromEntries(DIRS.map(d=>[d,{mac_dinh:['ne','n'].includes(d)?'sau':'truoc',vung:[]}])),khung:{}};
 for(const p of plans.filter(p=>p.sex===sex&&['ne','n'].includes(p.dir))){const [x,y]=p.hand;lop.khung[p.name]=[{nhan:'truoc',hop:[x-ox-3,y-oy-3,x-ox+3,y-oy+3]}];}
 layers[sex]=lop;
 const cut=cutPhuThe({id,kind:'vukhi',frame:F,dummySex:sex,dummyKey:'#00D0D0',guideKey:'#7A5CFF',gripKey:'#00FF60',sheets:boards[sex],palette:paletteFile,lop});
 if(cut.report.missing||cut.report.summary.block)throw Error(`Cutter ${sex} chặn: ${JSON.stringify(cut.report.summary)}`);
 cuts[sex]=cut.report;if(sex==='m')entries=cut.entries;
 for(const h of ['b','f'])if(cut.halves[h])for(let y=sex==='m'?0:5*F;y<(sex==='m'?5*F:10*F);y++)for(let x=0;x<13*F;x++)halves[h].set(x,y,cut.halves[h].get(x,y));
}
const geometry=plans.map(p=>{const x0=(gameAnims('A')[p.anim][0]+p.frame)*F,y0=gameRow(p.sex,p.dir)*F;let near=Infinity,edge=0,pixels=0;
 for(let y=0;y<F;y++)for(let x=0;x<F;x++)if(Object.values(halves).some(im=>im.alpha(x0+x,y0+y))){pixels++;near=Math.min(near,Math.hypot(x+.5-p.hand[0],y+.5-p.hand[1]));if(x<2||y<2||x>=F-2||y>=F-2)edge++;}
 return{name:`${p.sex}/${p.name}`,near,edge,pixels};});
if(geometry.some(p=>p.near>2||p.edge||p.pixels<15))throw Error('Sheet sau cutter không đạt grip/lề');
const dest=path.join(out,'import');fs.mkdirSync(dest,{recursive:true});
for(const h of ['b','f'])fs.writeFileSync(path.join(dest,`vkanim_${id}_${h}.png`),encodePng(halves[h]));
fs.writeFileSync(path.join(dest,'manifest-entry.json'),JSON.stringify(entries,null,2)+'\n');
fs.writeFileSync(path.join(dest,'_report.json'),JSON.stringify({frames:geometry.length,scale,geometry,cuts,layers,checks,maxA:Math.max(...geometry.map(p=>p.near)),edge:geometry.reduce((n,p)=>n+p.edge,0)},null,2)+'\n');
buildPreview(id,dest,2);console.log(`Cutter đạt ${geometry.length} khung → ${dest}`);
