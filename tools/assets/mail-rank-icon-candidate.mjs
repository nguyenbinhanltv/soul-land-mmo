// Mẫu #1599: chỉ xuất ngoài repo, không nhập manifest hoặc client.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { ROOT, readPng, decodePng, encodePng } from "./lib.mjs";
import { cutUiSheet } from "./ui-sheet-cut.mjs";
import { fitFrame } from "./menu-icon-import.mjs";
const hash = b => createHash("sha256").update(b).digest("hex");
const dir = path.join(ROOT, "art/src/ui-kit/mail-rank-1599");
const out = process.argv[process.argv.indexOf("--out") + 1];
if (!process.argv.includes("--out") || !out) throw Error("Cần --out ngoài repo");
const rel = path.relative(ROOT, path.resolve(out));
if (!rel || (!rel.startsWith(".." + path.sep) && !path.isAbsolute(rel))) throw Error("Chỉ xuất ngoài repo");
mkdirSync(out, { recursive: true });
const source = JSON.parse(readFileSync(path.join(dir, "nguon.json"), "utf8"));
for (const v of ["a", "b"]) {
  const img = readPng(path.join(dir, v, "RAW.png"));
  for (const f of ["RAW.png", "prompt.txt"]) if (hash(readFileSync(path.join(dir, v, f))) !== source.variants[v][f]) throw Error("SHA256 lệch: " + v + "/" + f);
  if (img.w !== 1254 || img.h !== 1254) throw Error("RAW sai cỡ native");
  for (let y=0;y<img.h;y++) for(let x=0;x<img.w;x++) {
    const p=img.get(x,y); img.set(x,y,p[3]<128?[255,0,255,255]:[p[0],p[1],p[2],255]);
  }
  const cut=cutUiSheet({img,name:"mail-rank-"+v,kindId:"I",prefix:"mr_",soft:true});
  for(const m of source.mapping) {
    const piece=decodePng(cut.files.get("2x/ui2_mr_icon_"+String(m.index).padStart(2,"0")+".png"));
    for(const size of [24,32]) {
      const bytes=encodePng(fitFrame(piece,size));
      const name=v+"-"+m.key+"-"+size+".png", sample=decodePng(bytes), colors=new Set();
      let transparent=false;
      for(let y=0;y<size;y++) for(let x=0;x<size;x++){const p=sample.get(x,y);if(p[3]!==0 && p[3]!==255)throw Error("Alpha không nhị phân");if(p[3]===0)transparent=true;else colors.add(p.slice(0,3).join(","));}
      if(!transparent || colors.size>32)throw Error("Nền hoặc bảng màu sai");
      if(hash(bytes)!==source.variants[v].samples[name])throw Error("SHA256 PNG lệch: "+name);
      writeFileSync(path.join(out,name),bytes);
    }
  }
  console.log(JSON.stringify({variant:v,native:[img.w,img.h],issues:cut.check.issues}));
}
