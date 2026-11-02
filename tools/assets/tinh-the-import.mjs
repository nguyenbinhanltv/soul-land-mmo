// Nhập ứng viên #1598 vào PR nháp; không đồng nghĩa chủ repo đã duyệt mỹ thuật.
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { ROOT } from "./lib.mjs";
import { tinhThePreview } from "./tinh-the-preview.mjs";

const raw=process.argv[2];
assert.ok(raw,"node tools/assets/tinh-the-import.mjs <RAW Codex 4×2.png>");
const scratch=mkdtempSync(path.join(tmpdir(),"tinh-the-import-"));
try {
  const {source}=tinhThePreview(raw,scratch);
  const dir=path.join(ROOT,"art/src/prop-clip/tinh_the_tim");
  mkdirSync(dir,{recursive:true});
  const saved=path.join(dir,"nguon.json");
  // Không được âm thầm đổi nguồn/clip của bản đã bàn giao.
  try { assert.deepEqual(JSON.parse(readFileSync(saved,"utf8")),source); }
  catch(e) { if(e.code!=="ENOENT")throw e; }
  for(const name of ["nguon.json","mat-na.png"])copyFileSync(path.join(scratch,name),path.join(dir,name));
  for(const name of ["tinh_the_tim_clip.png","tinh_the_tim_clip_n.png"])copyFileSync(path.join(scratch,name),path.join(ROOT,"shared/assets/sprites/iso/props",name));
  const file=path.join(ROOT,"shared/assets/iso/tiles.json");
  let text=readFileSync(file,"utf8");
  const def=JSON.parse(text).props.tinh_the_tim;
  assert.deepEqual(def.foot,[24,46]);
  const expected={key:"prop_tinh_the_tim_clip",frames:16,ms:100};
  if(def.clip)assert.deepEqual(def.clip,expected);
  else {
    const needle='"key": "prop_tinh_the_tim",';
    assert.ok(text.includes(needle));
    text=text.replace(needle,needle+(text.includes("\r\n")?"\r\n":"\n")+'   "clip": { "key": "prop_tinh_the_tim_clip", "frames": 16, "ms": 100 },');
    writeFileSync(file,text);
  }
} finally {rmSync(scratch,{recursive:true,force:true});}
