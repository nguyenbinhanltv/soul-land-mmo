// Prompt hoạt ảnh đúng giải phẫu: rắn trườn, rắn biển, dây leo, côn trùng bay, tằm, hurt bốn chân (#1097).
import test from "node:test";
import { readFileSync } from "node:fs";
import { MANIFEST } from "./lib.mjs";
import assert from "node:assert/strict";
import { speciesInfo, sheetPlan, FAMILIES } from "./beast-sheet-lib.mjs";
import { MOVE, moveFor } from "./beast-sheet-motion.mjs";
import { lessonsFor } from "./beast-sheet-lessons.mjs";
import { buildDirectionPrompt, buildTurnaroundPrompt, buildPrompt, NOTE } from "./beast-sheet-prompt.mjs";

const promptsOf = (info) => [buildTurnaroundPrompt(info, info.desc), ...sheetPlan(info.frame, "direction").map((s) => buildDirectionPrompt(info, s, info.desc)), ...sheetPlan(info.frame).map((s) => buildPrompt(info, s, info.desc))];
/** Bỏ các câu phủ định ("no legs", "never draw…") rồi mới tìm từ cấm. */
const affirm = (t) => t.split(/(?<=\.)\s+|\n/).filter((x) => !/\b(NO|no|never|not|nothing)\b/.test(x)).join("\n");
const BAD_LEGGED = /\b(feet|foot|paws?|legs? fold|the legs|standing|stands?|upright on)\b/i;

test("họ mới (fly, vine, worm) có trong FAMILIES, MOVE và NOTE", () => {
  for (const f of ["fly", "vine", "worm"]) { assert.ok(FAMILIES.includes(f), f); assert.ok(MOVE[f], f); assert.ok(NOTE[f], f); }
});

test("rắn trườn (bốn loài rắn #1030): không chân / feet / đứng, có câu cấm chân, hurt co thân lùi, die duỗi dọc hướng", () => {
  for (const id of ["bich_lan_xa", "hac_thuy_mang", "thanh_lan_xa", "thien_thanh_nguu_mang"]) {
    const info = speciesInfo(id);
    assert.equal(info.family, "snake", id);
    for (const p of promptsOf(info)) {
      assert.doesNotMatch(affirm(p), BAD_LEGGED, `${id}: ${affirm(p).match(BAD_LEGGED)?.[0]}`);
      assert.match(p, /NO legs, feet, paws, claws or limbs/, id);
      assert.match(p, /belly (lying )?on the ground|along its belly/, id);
    }
    const mv = moveFor(info);
    assert.match(mv.walk, /slithers[^,]*on its belly/);
    assert.match(mv.hurt, /snap back[^,]*facing line/);
    assert.match(mv.die, /stretched out limp on the ground along its facing line/);
  }
});

test("Lam Lân Hải Xà là rắn biển bơi (swim): không chân, không ground, giữ thân chữ S đầu ngẩng", () => {
  const info = speciesInfo("lam_lan_hai_xa");
  assert.equal(info.family, "swim");
  const mv = moveFor(info);
  assert.match(mv.idle, /S-curve with the head raised/);
  assert.match(mv.walk, /swims forward/);
  for (const p of promptsOf(info)) assert.match(p, /NO legs, feet, paws, roots or ground contact/);
});

test("dây leo (Quỷ Đằng, Quỷ Đằng non, Độc Cức Đằng): rễ cắm, bò bằng rễ / tua, không chân người", () => {
  for (const id of ["quy_dang", "quy_dang_non", "doc_cuc_dang"]) {
    const info = speciesInfo(id);
    assert.equal(info.family, "vine", id);
    for (const p of promptsOf(info)) {
      assert.doesNotMatch(affirm(p), BAD_LEGGED, `${id}: ${affirm(p).match(BAD_LEGGED)?.[0]}`);
      assert.match(p, /NO human or animal legs, feet, paws, hands/, id);
      assert.match(p, /root base/, id);
    }
    const mv = moveFor(info);
    assert.match(mv.walk, /creeping its roots and trailing tendrils/);
    assert.match(mv.hurt, /root base stays planted/);
  }
});

test("cây khác (Thực Nhân Hoa, Cổ Mộc Thụ Nhân): không 'đứng trên chân' / 'gập chân'; thụ nhân giữ chân rễ đứng yên khi hurt", () => {
  for (const id of ["thuc_nhan_hoa", "co_moc_thu_nhan", "y_la_hoa_yeu"]) {
    const info = speciesInfo(id);
    for (const p of promptsOf(info)) assert.doesNotMatch(affirm(p), BAD_LEGGED, `${id}: ${affirm(p).match(BAD_LEGGED)?.[0]}`);
  }
  assert.match(moveFor(speciesInfo("co_moc_thu_nhan")).hurt, /root legs stay planted[^,]*\(no step\)/);
});

test("Hỏa Linh Điệp bay (fly): lơ lửng, không đứng trên chân / ground line; Huyền Minh Băng Tằm (worm) bò sát đất", () => {
  const fly = speciesInfo("hoa_linh_diep");
  assert.equal(fly.family, "fly");
  for (const p of promptsOf(fly)) { assert.doesNotMatch(affirm(p), /ground line|planted|upright on|standing/i); assert.match(p, /hovers? in the air|hovering/); }
  assert.match(moveFor(fly).hurt, /still hovering/);
  const worm = speciesInfo("huyen_minh_bang_tam");
  assert.equal(worm.family, "worm");
  for (const p of promptsOf(worm)) { assert.doesNotMatch(affirm(p), BAD_LEGGED, affirm(p).match(BAD_LEGGED)?.[0]); assert.match(p, /caterpillar-like worm/); }
});

test("Hàn Băng Địa Long: hurt bốn chân nhất quán (đầu giật lùi, thân hạ thấp, bốn chân đứng yên) và die không 'staggers' mâu thuẫn 'in place'", () => {
  const info = speciesInfo("han_bang_dia_long");
  const mv = moveFor(info);
  assert.doesNotMatch(mv.hurt, /dips|leans back|rears|step backward/);
  assert.match(mv.hurt, /head jerks back/);
  assert.match(mv.hurt, /four feet stay planted on the same spots \(no step\)/);
  assert.doesNotMatch(mv.die, /staggers/);
  for (const p of promptsOf(info)) {
    assert.match(p, /four feet never leave the spots where they stand/);
    assert.doesNotMatch(p, /head dips/);
  }
});

test("bài học theo họ: rắn / cây / bay / tằm không nhận câu 'upright on its feet' / 'legs fold'", () => {
  for (const family of ["snake", "plant", "vine", "fly", "worm", "float", "swim"]) for (const st of ["turnaround", "direction", "sheet"]) {
    const text = lessonsFor(st, family).map((l) => l.text).join("\n");
    assert.doesNotMatch(text, /on its feet|the legs fold/, `${family}/${st}`);
    assert.match(text, /HURT/, `${family}/${st}`);
  }
});

test("Quỷ Diện Hải Yêu (bò bốn chi vây) không bị câu rắn 'NO legs … limbs' (rà #1097)", () => {
  const info = speciesInfo("quy_dien_hai_yeu");
  assert.equal(info.family, "quad");
  for (const p of promptsOf(info)) assert.doesNotMatch(p, /NO legs, feet, paws, claws or limbs/);
});

test("mọi loài còn ở họ snake sau TOOL_FAMILY đều thật sự không chân (mô tả không nhắc chân / chi / bò bốn)", () => {
  const ids = JSON.parse(readFileSync(MANIFEST, "utf8")).sprites.filter((e) => e.static && e.key.startsWith("beast_")).map((e) => e.key.slice(6));
  const snakes = ids.map(speciesInfo).filter((i) => i.family === "snake");
  for (const id of ["bich_lan_xa", "hac_thuy_mang", "thanh_lan_xa", "thien_thanh_nguu_mang", "man_da_la_xa", "xich_lan_mang", "thanh_lan_doc_co"]) assert.ok(snakes.some((i) => i.id === id), id);
  for (const i of snakes) assert.doesNotMatch(i.desc, /\b(limbs?|legs?|feet|paws?|fins?|crouching)\b/i, `${i.id}: ${i.desc}`);
});
