// #1551: nhập đúng clip hậu kỳ đã được chủ repo duyệt, không gọi model.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { ROOT, Img, readPng, encodePng } from "./lib.mjs";
import { senPreview } from "./sen-preview.mjs";

const sourceDir = path.resolve(process.argv[2] ?? path.join(ROOT,"art/src/prop-clip/sen_phat_sang"));
const targetDir = path.join(ROOT,"art/src/prop-clip/sen_phat_sang");
const sha = b => createHash("sha256").update(b).digest("hex");
const source = JSON.parse(readFileSync(path.join(sourceDir,"nguon.json"),"utf8"));
const raw = readFileSync(path.join(sourceDir,"RAW.png"));
assert.equal(sha(raw),source.rawSHA256);
assert.deepEqual(source.nativeSize,[32,32]);
assert.deepEqual(source.foot,[16,28]);
const scratch = mkdtempSync(path.join(tmpdir(),"sen-import-"));
try {
  senPreview(scratch);
  const clip = readFileSync(path.join(scratch,"sen_phat_sang_clip.png"));
  assert.equal(sha(clip),source.clipSHA256,"Clip tái tạo phải khớp bản đã duyệt");
  assert.ok(raw.equals(readFileSync(path.join(scratch,"RAW.png"))),"Không đổi RAW gốc");
  const originalNormal=readPng(path.join(ROOT,"shared/assets/sprites/iso/props/sen_phat_sang_n.png"));
  const normal=new Img(1024,32);
  for(let n=0;n<32;n++)normal.blit(originalNormal,0,0,32,32,n*32,0);
  const normalBytes=encodePng(normal);
  if(source.normalSHA256)assert.equal(sha(normalBytes),source.normalSHA256);
  mkdirSync(targetDir,{recursive:true});
  const rawTarget=path.join(targetDir,"RAW.png");
  if(existsSync(rawTarget))assert.ok(readFileSync(rawTarget).equals(raw),"Cấm ghi đè RAW khác byte");
  else writeFileSync(rawTarget,raw);
  writeFileSync(path.join(targetDir,"mat-na.png"),readFileSync(path.join(scratch,"mat-na.png")));
  writeFileSync(path.join(targetDir,"nguon.json"),JSON.stringify({...source,normalSHA256:sha(normalBytes)},null,2)+"\n");
  const propDir=path.join(ROOT,"shared/assets/sprites/iso/props");
  writeFileSync(path.join(propDir,"sen_phat_sang_clip.png"),clip);
  writeFileSync(path.join(propDir,"sen_phat_sang_clip_n.png"),normalBytes);
  const manifestFile=path.join(ROOT,"shared/assets/sprites/manifest.json");
  let manifest=readFileSync(manifestFile,"utf8");
  const existingEntry=JSON.parse(manifest).sprites.find(p=>p.key==="prop_sen_phat_sang_clip");
  if(existingEntry)assert.deepEqual(existingEntry,{key:"prop_sen_phat_sang_clip",frame:[32,32],iso:true,map:"loi_tinh_dau"});
  else {
    const re=/(\{\s*"key": "prop_sen_phat_sang",[^{}]*\},)/;
    assert.ok(re.test(manifest),"Phải có mục sen tĩnh trước khi nhập");
    const nl=manifest.includes("\r\n")?"\r\n":"\n";
    manifest=manifest.replace(re,m=>m+nl+'    { "key": "prop_sen_phat_sang_clip", "frame": [32,32], "iso": true, "map": "loi_tinh_dau" },');
    writeFileSync(manifestFile,manifest);
  }
  const tilesFile=path.join(ROOT,"shared/assets/iso/tiles.json");
  let tiles=readFileSync(tilesFile,"utf8");
  const expected={key:"prop_sen_phat_sang_clip",frames:32,ms:100}, def=JSON.parse(tiles).props.sen_phat_sang;
  assert.deepEqual(def.foot,[16,28]);
  if(def.clip)assert.deepEqual(def.clip,expected);
  else {
    const needle='"key": "prop_sen_phat_sang",';assert.ok(tiles.includes(needle));
    tiles=tiles.replace(needle,needle+(tiles.includes("\r\n")?"\r\n":"\n")+'   "clip": { "key": "prop_sen_phat_sang_clip", "frames": 32, "ms": 100 },');
    writeFileSync(tilesFile,tiles);
  }
} finally { rmSync(scratch,{recursive:true,force:true}); }
