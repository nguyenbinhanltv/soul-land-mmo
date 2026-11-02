import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ROOT,readPng } from "./lib.mjs";

test("Tinh thể tím: nhịp sáng giữ alpha, viền, chân, palette, normal và nối vòng",()=>{
  const dir=`${ROOT}/art/src/prop-clip/tinh_the_tim`;
  const source=JSON.parse(readFileSync(`${dir}/nguon.json`,"utf8"));
  const file=`${ROOT}/shared/assets/sprites/iso/props/tinh_the_tim.png`;
  const base=readPng(file),clip=readPng(file.replace(".png","_clip.png")),mask=readPng(`${dir}/mat-na.png`);
  const normal=readPng(file.replace(".png","_clip_n.png")),baseNormal=readPng(file.replace(".png","_n.png"));
  const sha=f=>createHash("sha256").update(readFileSync(f)).digest("hex");
  assert.equal(sha(file),source.originalSHA256);
  assert.equal(sha(file.replace(".png","_clip.png")),source.clipSHA256);
  assert.equal(sha(file.replace(".png","_clip_n.png")),source.normalSHA256);
  assert.deepEqual([clip.w,clip.h,normal.w,normal.h],[768,48,768,48]);
  const colors=new Set(),phases=new Set(),steps=[];
  for(let y=0;y<48;y++)for(let x=0;x<48;x++)colors.add(base.get(x,y).join());
  let changed=0;
  for(let n=0;n<16;n++){
    const pixels=[];let step=0;
    for(let y=0;y<48;y++)for(let x=0;x<48;x++){
      const c=clip.get(n*48+x,y),b=base.get(x,y);
      assert.equal(c[3],b[3]);assert.ok(colors.has(c.join()));
      if(!mask.alpha(x,y)||n===0)assert.deepEqual(c,b);
      if(c.join()!==b.join())changed++;
      if(c.join()!==clip.get(((n+1)%16)*48+x,y).join())step++;
      assert.deepEqual(normal.get(n*48+x,y),baseNormal.get(x,y));
      pixels.push(c.join());
    }
    phases.add(pixels.join());steps.push(step);
  }
  assert.ok(changed>0);assert.ok(phases.size>=5);
  assert.ok(steps[15]<=Math.max(...steps.slice(0,15)),"Mối nối không nhảy lớn hơn bước trong vòng");
  const tiles=JSON.parse(readFileSync(`${ROOT}/shared/assets/iso/tiles.json`,"utf8"));
  assert.deepEqual(tiles.props.tinh_the_tim,{key:"prop_tinh_the_tim",clip:{key:"prop_tinh_the_tim_clip",frames:16,ms:100},foot:[24,46]});
  assert.deepEqual([source.frames,source.ms,source.foot],[16,100,[24,46]]);
  const manifest=JSON.parse(readFileSync(`${ROOT}/shared/assets/sprites/manifest.json`,"utf8"));
  assert.deepEqual(manifest.sprites.find(p=>p.key==="prop_tinh_the_tim_clip"),{key:"prop_tinh_the_tim_clip",frame:[48,48],iso:true,map:"tinh_dau_noi_dia"});
});
