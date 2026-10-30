// Tái tạo mẫu #1378: node art/src/phuthe-anim/kim_vu_mieu_ung/vukhi/isolated/compose.mjs [e|all]
// RAW giữ nguyên; chỉ lấy mẫu nearest, lượng tử màu, xoay/dịch vào hai grip LPC.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { Img, readPng, encodePng } from '../../../../../../tools/assets/lib.mjs';
import { components, medianCut, nearest } from '../../../../../../tools/assets/beast-sheet-cut.mjs';
import { dummySheet, gripPoints, bodyFrame } from '../../../../../../tools/assets/phuthe-sheet-dummy.mjs';
import { sheetCells, bodyStepOf, framesOf, gameAnims, gameRow, frameOrigin, DIRS } from '../../../../../../tools/assets/phuthe-sheet-lib.mjs';
import { checkPhuThe, writeReport } from '../../../../../../tools/assets/phuthe-sheet-check.mjs';
const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const id = 'kim_vu_mieu_ung', F = 96, scale = 0.036;
const dirs = process.argv[2] === 'all' ? DIRS : [process.argv[2] ?? 'e'];
const out = path.join(root, 'result'); fs.mkdirSync(out, { recursive: true });
const halves = { b: new Img(22 * F, 10 * F), f: new Img(22 * F, 10 * F) };
const grip = {}, gripSex = { f: {} }, plans = [], allSamples = [];
const maps = { idle: [0,0,0,0], walk: [0,0,0,0,0,0], attack: [0,1,2,3,2,0], cast: [4,4,5,5], hurt: [0,0] };
const sha = f => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const registration = p => p[1] > 220 && p[0] < 100 && p[2] < 150;
for (const dir of dirs) {
  const attempt = path.join(root, dir, 'attempt1'), raw = readPng(path.join(attempt, 'poses.raw.png'));
  const mask = new Uint8Array(raw.w * raw.h);
  for (let i = 0; i < mask.length; i++) { const p = raw.get(i % raw.w, Math.floor(i / raw.w)); mask[i] = p[3] > 127 && !(p[0] > 170 && p[2] > 170 && p[1] < 100) ? 1 : 0; }
  const shapes = components(mask, raw.w, raw.h).filter(c => c.area > 1000), poses = Array(6);
  if (shapes.length !== 6) throw Error(`${dir}: cần sáu pose tách rời, thấy ${shapes.length}`);
  for (const c of shapes) {
    const dots = c.px.filter(i => registration(raw.get(i % raw.w, Math.floor(i / raw.w))));
    if (dots.length < 10) throw Error(`${dir}: thiếu marker cổ tay`);
    const anchor = dots.reduce((s,i) => [s[0]+i%raw.w+0.5,s[1]+Math.floor(i/raw.w)+0.5],[0,0]).map(v=>v/dots.length);
    const slot = Math.floor((c.y0+c.y1)/2/(raw.h/2))*3+Math.floor((c.x0+c.x1)/2/(raw.w/3));
    if (poses[slot]) throw Error(`${dir}: trùng slot ${slot}`);
    const img = new Img(raw.w,raw.h);
    for (const i of c.px) { const x=i%raw.w,y=Math.floor(i/raw.w),p=raw.get(x,y); if (!registration(p)) { img.set(x,y,p); allSamples.push(p.slice(0,3)); } }
    poses[slot]={img,anchor,box:[c.x0,c.y0,c.x1,c.y1]};
  }
  const boards = Object.fromEntries(['m','f'].map(sex=>[sex,dummySheet({group:'B',dir,frame:F,sex,key:'#30D030',guideKey:'#7A5CFF',gripKey:'#FFE000',gripN:2}).img]));
  const [ox,oy]=frameOrigin(F), distances=[], framePlans=[];
  for (const sex of ['m','f']) for (const c of sheetCells('B')) {
    const name=`${dir}/${c.anim}/${c.frame}`,step=bodyStepOf(c.anim,framesOf('B')[c.anim],c.frame);
    let measured=gripPoints({sex,dir,clip:c.anim,step,frame:F,count:2});
    if(measured.step!==step) measured=gripPoints({sex,dir,clip:c.anim,step,frame:F,count:1});
    if (!measured.hands.length) throw Error(`${sex}/${name}: không có grip`);
    const hands=measured.hands.map(p=>p.map(v=>v*F/256));
    const rel=hands.flatMap(p=>[Number((p[0]-ox).toFixed(3)),Number((p[1]-oy).toFixed(3))]);
    (sex==='m'?grip:gripSex.f)[name]=rel;
    const layers={b:new Img(F,F),f:new Img(F,F)}, pose=poses[maps[c.anim][c.frame]], counts=[];
    for (const [hand,g] of hands.entries()) {
      // Tay xa nằm sau thân ở e/se/ne; hướng n cả hai sau, hướng s cả hai trước.
      const side=dir==='n'||(dir!=='s'&&hand===1)?'b':'f';
      const mirror=dir==='s'&&hand===1 || dir==='n'&&hand===0;
      const angle=(c.anim==='attack'?[0,-12,0,12,5,0][c.frame]:0)*Math.PI/180;
      const co=Math.cos(angle),si=Math.sin(angle); let pixels=0,near=Infinity,edge=0;
      for(let y=0;y<F;y++)for(let x=0;x<F;x++){
        let dx=(x+.5-g[0])/scale,dy=(y+.5-g[1])/scale;
        if(mirror)dx=-dx;
        const sx=Math.floor(pose.anchor[0]+co*dx+si*dy),sy=Math.floor(pose.anchor[1]-si*dx+co*dy);
        if(sx<0||sy<0||sx>=raw.w||sy>=raw.h||!pose.img.alpha(sx,sy))continue;
        // Cổ tay đang nhìn thấy cần che da; phần vuốt tay xa vẫn sau thân.
        const pixelSide=side==='b'&&Math.hypot(x+.5-g[0],y+.5-g[1])<=4?'f':side;
        const p=pose.img.get(sx,sy);layers[pixelSide].set(x,y,p);pixels++;
        near=Math.min(near,Math.hypot(x+.5-g[0],y+.5-g[1]));
        if(x<2||y<2||x>=F-2||y>=F-2)edge++;
      }
      if(pixels<15||near>2||edge)throw Error(`${sex}/${name}/${hand}: pixels=${pixels}, grip=${near}, mép=${edge}`);
      counts.push({hand,side,pixels,near,edge});
    }
    for(const h of ['b','f'])halves[h].blit(layers[h],0,0,F,F,(gameAnims('B')[c.anim][0]+c.frame)*F,gameRow(sex,dir)*F,true);
    // Tờ kiểm giữ nguyên nộm và marker; ảnh pixel được phóng nearest.
    const board=boards[sex];
    for(let y=0;y<256;y++)for(let x=0;x<256;x++)for(const h of ['b','f']){
      const p=layers[h].get(Math.floor(x*F/256),Math.floor(y*F/256));
      if(p[3])board.set(c.col*256+x,c.row*256+y,p);
    }
    framePlans.push({sex,name,step,measuredStep:measured.step,fallback:measured.fallback,grip:rel,pose:maps[c.anim][c.frame],counts});distances.push(...counts.map(v=>v.near));
  }
  const composed=path.join(attempt,'composed');fs.mkdirSync(composed,{recursive:true});
  fs.writeFileSync(path.join(composed,`to${'ABCDE'[DIRS.indexOf(dir)]}.png`),encodePng(boards.m));
  const female=fs.mkdtempSync(path.join(os.tmpdir(),'kim-vu-f-'));
  fs.writeFileSync(path.join(female,`to${'ABCDE'[DIRS.indexOf(dir)]}.png`),encodePng(boards.f));
  for(const sex of ['m','f']){const check=checkPhuThe(id,{kind:'vukhi',frame:F,dummyKey:'#30D030',guideKey:'#7A5CFF',gripKey:'#FFE000',sex,dir:sex==='m'?composed:female});writeReport(check,path.join(composed,`review-${sex}`));console.log(`${dir}/${sex}: ${check.level}`);}
  fs.writeFileSync(path.join(composed,'female-board.png'),encodePng(boards.f));
  const plan={dir,F,scale,poses:poses.map(p=>({anchor:p.anchor,box:p.box})),frames:framePlans,maxGripDistance:Math.max(...distances)};
  fs.writeFileSync(path.join(composed,'compose-plan.json'),JSON.stringify(plan,null,2)+'\n');plans.push(plan);
  fs.writeFileSync(path.join(attempt,'poses.source.json'),JSON.stringify({date:'2026-10-30',tool:'Codex / OpenAI image_gen tích hợp',model:null,seed:null,direction:dir,attempt:1,generation:1,references:[],rawUnmodified:true,image:{path:'poses.raw.png',sha256:sha(path.join(attempt,'poses.raw.png'))},prompt:{path:'poses.prompt.txt',sha256:sha(path.join(attempt,'poses.prompt.txt'))},compositor:{path:'../../compose.mjs',sha256:sha(new URL(import.meta.url))},license:'Đầu ra OpenAI theo điều khoản dịch vụ; LPC giữ giấy phép nguồn.'},null,2)+'\n');
}
const palette=medianCut(allSamples,32);
for(const [h,im]of Object.entries(halves)){
  for(let i=0;i<im.data.length;i+=4)if(im.data[i+3])im.data.set(palette[nearest([...im.data.slice(i,i+3)],palette)],i);
  fs.writeFileSync(path.join(out,`vkanim_${id}_${h}.png`),encodePng(im));
}
const entries=['b','f'].map(h=>({key:`vkanim_${id}_${h}`,frame:[F,F],iso:true,anim:{kind:'vukhi',cols:22,anims:Object.fromEntries(Object.entries(gameAnims('B')).map(([k,[col,n]])=>[k,{col,n}])),origin:frameOrigin(F),layer:h==='b'?'sau':'truoc',dirsOk:dirs,grip,gripSex}}));
fs.writeFileSync(path.join(out,'manifest-entry.json'),JSON.stringify(entries,null,2)+'\n');
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({F,scale,palette,plans},null,2)+'\n');
const contact=new Img(dirs.length*F,6*F);
for(const sex of ['m','f'])for(const [r,clip]of ['idle','attack','cast'].entries())for(const [i,d]of dirs.entries()){
 const frame=clip==='idle'?0:2,step=bodyStepOf(clip,framesOf('B')[clip],frame),im=new Img(F,F),x=(gameAnims('B')[clip][0]+frame)*F,y=gameRow(sex,d)*F;
 im.blit(halves.b,x,y,F,F,0,0,true);im.blit(bodyFrame(sex,d,clip,step).fig,0,0,64,64,16,16,true);im.blit(halves.f,x,y,F,F,0,0,true);
 contact.blit(im,0,0,F,F,i*F,((sex==='m'?0:3)+r)*F,true);
}
fs.writeFileSync(path.join(out,'contact.png'),encodePng(contact));
console.log(`Đã ghép ${dirs.join(', ')} → ${out}`);
