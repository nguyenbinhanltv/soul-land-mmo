// Bảo vệ thân công trình đã duyệt: hoạt ảnh chỉ được đổi vùng lửa/tia nước.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ROOT, readPng } from "./lib.mjs";

const tiles = JSON.parse(readFileSync(`${ROOT}/shared/assets/iso/tiles.json`, "utf8"));
const feet = { cot_den_do: [24,94], cot_co_do_vang: [24,78], lua_trai: [40,46], dai_phun_nuoc: [40,62], lo_ren_lang: [56,91], lo_lua_dong: [24,62] };
for (const name of Object.keys(feet)) test(`${name}: thân tĩnh, chân và hồ sơ SHA256`, () => {
  const dir = `${ROOT}/art/src/prop-clip/${name}`, source = JSON.parse(readFileSync(`${dir}/nguon.json`, "utf8"));
  const originalFile = `${ROOT}/shared/assets/sprites/iso/props/${name}.png`, clipFile = originalFile.replace(".png", "_clip.png");
  const original = readPng(originalFile), clip = readPng(clipFile), [rx, ry, rw, rh] = source.region;
  const sha = f => createHash("sha256").update(readFileSync(f)).digest("hex");
  assert.equal(sha(originalFile), source.originalSHA256);
  assert.equal(sha(clipFile), source.clipSHA256);
  assert.equal(clip.w, original.w * source.frames); assert.equal(clip.h, original.h);
  assert.deepEqual(tiles.props[name].clip, { key: `prop_${name}_clip`, frames: source.frames, ms: source.ms });
  const variations = new Set();
  for (let n = 0; n < source.frames; n++) {
    const pixels = [];
    for (let y = 0; y < original.h; y++) for (let x = 0; x < original.w; x++) {
      const c = clip.get(n * original.w + x, y);
      assert.ok(c[3] === 0 || c[3] === 255);
      const [r, g, b, a] = original.get(x, y);
      const box = source.lanterns?.find(([l,t,w,h]) => x>=l && x<l+w && y>=t && y<t+h);
      const protectedPixel = (source.mask === "lantern-seams" && (!box || y<box[1]+2 || (a && r>40 && g>r*0.48 && r>b*1.3))) || (source.mask === "cloth-seam" && (x >= 26 || y <= 21)) || (source.mask === "warm-interior" && !(a && r > 125 && r > b * 1.35));
      if (x < rx || x >= rx + rw || y < ry || y >= ry + rh || protectedPixel) assert.deepEqual(c, original.get(x, y), `Khung ${n}, điểm ${x},${y}`);
      else pixels.push(...c);
    }
    variations.add(createHash("sha256").update(Buffer.from(pixels)).digest("hex"));
  }
  assert.ok(variations.size >= 8, "Clip phải có chuyển động thật");
  assert.deepEqual(tiles.props[name].foot, feet[name]);
});
test("Chỉ các loại được giao có clip", () => {
  assert.deepEqual(Object.keys(tiles.props).filter(name => tiles.props[name].clip).sort(), Object.keys(feet).sort());
});

test("Lò đồng: lớp thân không còn lửa cũ hoặc viền lửa trên miệng bát", () => {
  const dir = `${ROOT}/art/src/prop-clip/lo_lua_dong`, base = readPng(`${dir}/than-tinh.png`);
  for (let y = 0; y < 25; y++) for (let x = 0; x < base.w; x++) assert.equal(base.alpha(x, y), 0, `Viền/lửa cũ tại ${x},${y}`);
  const source = JSON.parse(readFileSync(`${dir}/nguon.json`, "utf8"));
  assert.deepEqual(source.clearZone, [8,5,32,20]);
});

test("Lò đồng: miệng bát luôn đặc ở lớp thân và cả 16 khung", () => {
  const dir = `${ROOT}/art/src/prop-clip/lo_lua_dong`, base = readPng(`${dir}/than-tinh.png`);
  const original = readPng(`${ROOT}/shared/assets/sprites/iso/props/lo_lua_dong.png`), clip = readPng(`${ROOT}/shared/assets/sprites/iso/props/lo_lua_dong_clip.png`);
  for (let y = 25; y <= 28; y++) for (let x = 0; x < original.w; x++) if (original.alpha(x, y) === 255) {
    assert.equal(base.alpha(x, y), 255, `Thân thủng tại ${x},${y}`);
    for (let n = 0; n < 16; n++) assert.equal(clip.alpha(n * original.w + x, y), 255, `Khung ${n} thủng tại ${x},${y}`);
  }
  const source = JSON.parse(readFileSync(`${dir}/nguon.json`, "utf8"));
  assert.deepEqual(source.solidZone, [8,25,32,4]);
});

for (const name of ["cot_co_do_vang", "cot_den_do"]) test(`${name}: RAW nguyên byte, kích thước native và palette không đổi`, () => {
  const dir = `${ROOT}/art/src/prop-clip/${name}`, source = JSON.parse(readFileSync(`${dir}/nguon.json`, "utf8"));
  const raw = readPng(`${dir}/RAW.png`), original = readPng(`${ROOT}/shared/assets/sprites/iso/props/${name}.png`), clip = readPng(`${ROOT}/shared/assets/sprites/iso/props/${name}_clip.png`);
  assert.deepEqual([raw.w,raw.h], source.nativeSize);
  assert.equal(createHash("sha256").update(readFileSync(`${dir}/RAW.png`)).digest("hex"), source.rawSHA256);
  const colors = new Set();
  for(let y=0;y<original.h;y++) for(let x=0;x<original.w;x++) if(original.alpha(x,y)) colors.add(original.get(x,y).join());
  for(let y=0;y<clip.h;y++) for(let x=0;x<clip.w;x++) if(clip.alpha(x,y)) assert.ok(colors.has(clip.get(x,y).join()));
 });

test("Đèn lồng: bước nối vòng không lớn hơn bước chuyển pha trong vòng", () => {
  const clip = readPng(`${ROOT}/shared/assets/sprites/iso/props/cot_den_do_clip.png`);
  const steps = Array.from({ length: 16 }, (_, n) => {
    let changed = 0;
    for (let y = 0; y < 96; y++) for (let x = 0; x < 48; x++) {
      if (clip.get(n * 48 + x, y).some((v, i) => v !== clip.get(((n + 1) % 16) * 48 + x, y)[i])) changed++;
    }
    return changed;
  });
  assert.ok(steps[15] <= Math.max(...steps.slice(0, 15)), `Bước nối vòng: ${steps}`);
});
