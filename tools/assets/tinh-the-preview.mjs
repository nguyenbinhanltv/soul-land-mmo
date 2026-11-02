// #1598: nguồn Codex dẫn mặt nạ sáng; giữ pixel/alpha/neo của tinh thể đã duyệt.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, Img, readPng, encodePng } from "./lib.mjs";

export function tinhThePreview(rawFile, out) {
  const originalFile = path.join(ROOT,"shared/assets/sprites/iso/props/tinh_the_tim.png");
  const original = readPng(originalFile), raw = readPng(rawFile);
  assert.deepEqual([original.w,original.h],[48,48],"Ảnh gốc đổi cỡ; cần duyệt lại mặt nạ");
  const palette = [...new Map(Array.from({length:48*48},(_,i)=>original.get(i%48,Math.floor(i/48))).filter(c=>c[3]).map(c=>[c.join(),c])).values()];
  const lum = c => c[0]*0.2126+c[1]*0.7152+c[2]*0.0722;
  const violet = c => c[3] && c[2]>c[1]*1.1 && c[2]>c[0]*1.05 && lum(c)>50;
  const ramp = palette.filter(violet).sort((a,b)=>lum(a)-lum(b));
  assert.ok(ramp.length>=3,"Thiếu dải tím");
  // Tờ 4×2: lấy mặt sáng ở ô thứ 5; chuẩn hóa hộp bao, chỉ dẫn ngưỡng sáng bên trong.
  const x0=0,y0=Math.floor(raw.h/2),x1=Math.floor(raw.w/4),y1=raw.h;
  let l=x1,t=y1,r=x0,b=y0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(raw.alpha(x,y)>=160){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
  assert.ok(r>l&&b>t,"Ô sáng Codex trống");
  const sheet=new Img(48*16,48),mask=new Img(48,48);
  const normalBase=readPng(originalFile.replace(".png","_n.png")),normal=new Img(48*16,48);
  for(let n=0;n<16;n++) {
    normal.blit(normalBase,0,0,48,48,n*48,0);
    const pulse=(1-Math.cos(n*Math.PI*2/16))/2;
    for(let y=0;y<48;y++)for(let x=0;x<48;x++){
      const c=original.get(x,y);
      // Bảo vệ viền, đá/chân và mọi điểm giáp alpha trong suốt.
      const interior=x>0&&x<47&&y>0&&y<39&&[[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>original.alpha(x+dx,y+dy));
      const at=ramp.findIndex(p=>p.join()===c.join());
      const selected=interior&&violet(c)&&at>=0&&at<ramp.length-1;
      if(selected)mask.set(x,y,[255,255,255,255]);
      const sample=raw.get(Math.round(l+(r-l)*x/47),Math.round(t+(b-t)*y/47));
      const threshold=0.2+0.65*(1-lum(sample)/255);
      sheet.set(n*48+x,y,selected&&pulse>threshold?ramp[at+1]:c);
    }
  }
  mkdirSync(out,{recursive:true});
  const sha=b=>createHash("sha256").update(b).digest("hex");
  const clipBytes=encodePng(sheet),normalBytes=encodePng(normal);
  const source={tool:"Codex builtin OpenAI image_gen.imagegen",date:"2026-11-03",license:"Đầu ra OpenAI, không CC0; hình gốc Gemini giữ nguồn/điều khoản hiện có trong art/CREDITS.md",nativeSize:[raw.w,raw.h],originalSHA256:sha(readFileSync(originalFile)),rawSHA256:sha(readFileSync(rawFile)),clipSHA256:sha(clipBytes),normalSHA256:sha(normalBytes),frames:16,ms:100,foot:[24,46],mask:"Mặt tím bên trong, y < 39, bảo vệ viền giáp alpha; RAW ô 5 dẫn ngưỡng sáng"};
  for(const [name,bytes] of [["tinh_the_tim_clip.png",clipBytes],["tinh_the_tim_clip_n.png",normalBytes],["mat-na.png",encodePng(mask)]])writeFileSync(path.join(out,name),bytes);
  writeFileSync(path.join(out,"nguon.json"),JSON.stringify(source,null,2)+"\n");
  return {original,sheet,mask,normal,source};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [raw,out]=process.argv.slice(2);
  assert.ok(raw&&out,"node tools/assets/tinh-the-preview.mjs <RAW Codex 4×2.png> <thư mục ngoài repo>");
  assert.ok(!path.resolve(out).toLowerCase().startsWith(ROOT.toLowerCase()+path.sep),"Ứng viên phải ngoài repo");
  tinhThePreview(raw,out);
}
