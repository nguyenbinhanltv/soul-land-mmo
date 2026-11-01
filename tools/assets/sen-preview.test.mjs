import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { senPreview } from "./sen-preview.mjs";

test("Sen thử: giữ alpha, palette, thân, chân, khung 0 và nối vòng", () => {
  const out = mkdtempSync(path.join(os.tmpdir(), "sen-preview-"));
  try {
    const { original, sheet, mask, source } = senPreview(out);
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
