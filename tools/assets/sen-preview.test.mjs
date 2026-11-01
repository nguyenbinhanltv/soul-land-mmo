import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { senPreview } from "./sen-preview.mjs";
import { ROOT, readPng } from "./lib.mjs";

test("Sen thử: giữ alpha, palette, thân, chân, khung 0 và nối vòng", () => {
  const out = mkdtempSync(path.join(os.tmpdir(), "sen-preview-"));
  try {
    const { original, sheet, mask, source } = senPreview(out);
    const officialDir=path.join(ROOT,"art/src/prop-clip/sen_phat_sang");
    const saved=JSON.parse(readFileSync(path.join(officialDir,"nguon.json"),"utf8"));
    const sha=b=>createHash("sha256").update(b).digest("hex");
    assert.equal(sha(readFileSync(path.join(officialDir,"RAW.png"))),saved.rawSHA256);
    assert.equal(saved.rawSHA256,source.originalSHA256);
    assert.equal(saved.originalSHA256,source.originalSHA256);
    assert.deepEqual([saved.frames,saved.ms,saved.foot],[32,100,[16,28]]);
    assert.deepEqual(saved.nativeSize,[32,32]);
    const clipFile=path.join(ROOT,"shared/assets/sprites/iso/props/sen_phat_sang_clip.png");
    assert.equal(sha(readFileSync(clipFile)),saved.clipSHA256);
    assert.ok(readFileSync(clipFile).equals(readFileSync(path.join(out,"sen_phat_sang_clip.png"))));
    assert.ok(readFileSync(path.join(officialDir,"mat-na.png")).equals(readFileSync(path.join(out,"mat-na.png"))));
    const normalFile=clipFile.replace(".png","_n.png"), normal=readPng(normalFile);
    const originalNormal=readPng(clipFile.replace("_clip.png","_n.png"));
    assert.equal(sha(readFileSync(normalFile)),saved.normalSHA256);
    assert.deepEqual([normal.w,normal.h],[1024,32]);
    for(let n=0;n<32;n++)for(let y=0;y<32;y++)for(let x=0;x<32;x++)assert.deepEqual(normal.get(n*32+x,y),originalNormal.get(x,y));
    const tiles=JSON.parse(readFileSync(path.join(ROOT,"shared/assets/iso/tiles.json"),"utf8"));
    assert.deepEqual(tiles.props.sen_phat_sang,{key:"prop_sen_phat_sang",clip:{key:"prop_sen_phat_sang_clip",frames:32,ms:100},foot:[16,28]});
    assert.equal(tiles.maps.loi_tinh_dau.props[42],"sen_phat_sang");
    const manifest=JSON.parse(readFileSync(path.join(ROOT,"shared/assets/sprites/manifest.json"),"utf8"));
    assert.deepEqual(manifest.sprites.find(p=>p.key==="prop_sen_phat_sang_clip"),{key:"prop_sen_phat_sang_clip",frame:[32,32],iso:true,map:"loi_tinh_dau"});
    assert.deepEqual(source.foot,[16,28]);
    assert.equal(source.frames * source.ms,3200);
    const colors = new Set(), phases = new Set(), steps = [];
    for(let y=0;y<32;y++) for(let x=0;x<32;x++) colors.add(original.get(x,y).join());
    for(let n=0;n<32;n++) {
      let step=0; const pixels=[];
      for(let y=0;y<32;y++) for(let x=0;x<32;x++) {
        const c=sheet.get(n*32+x,y), base=original.get(x,y);
        assert.equal(c[3],base[3]); assert.ok(colors.has(c.join()));
        if(n===0 || !mask.alpha(x,y)) assert.deepEqual(c,base);
        if(c.some((v,i)=>v!==sheet.get(((n+1)%32)*32+x,y)[i])) step++;
        pixels.push(...c);
      }
      phases.add(pixels.join()); steps.push(step);
    }
    assert.ok(phases.size>=5);
    assert.ok(steps[31]<=Math.max(...steps.slice(0,31)));
  } finally { rmSync(out,{recursive:true,force:true}); }
});
