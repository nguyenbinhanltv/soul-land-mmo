// Prompt hoạt ảnh hồn thú đúng với loài lớn chưa có turnaround, loài không chân, câu hurt / attack theo loài (#1049).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, MANIFEST } from "./lib.mjs";
import { speciesInfo, sheetPlan, LEGLESS } from "./beast-sheet-lib.mjs";
import { MOVE, MOVE_OVERRIDE, moveFor } from "./beast-sheet-motion.mjs";
import { parseLessons, lessonsFor } from "./beast-sheet-lessons.mjs";
import { buildDirectionPrompt, buildTurnaroundPrompt, buildPrompt, stageDocs, LEGLESS_NOTE } from "./beast-sheet-prompt.mjs";

const promptsOf = (info) => {
  const dirPlan = sheetPlan(info.frame, "direction"), plan = sheetPlan(info.frame);
  return [buildTurnaroundPrompt(info, info.desc), ...dirPlan.map((s) => buildDirectionPrompt(info, s, info.desc)), ...plan.map((s) => buildPrompt(info, s, info.desc))];
};
const allIds = () => JSON.parse(readFileSync(MANIFEST, "utf8")).sprites.filter((e) => e.static && e.key.startsWith("beast_")).map((e) => e.key.slice(6));
const LEG_WORDS = /\b(feet|foot|legs?|paws?|talons?|roots?|stems?|vines?|ground line)\b/i;

test("direction mode: chưa có turnaround đã duyệt thì ghi hướng dẫn turnaround trước, không đòi ảnh chưa có", () => {
  const info = speciesInfo("bang_nguyen_cu_tuong");
  const docs = stageDocs(info, "direction", info.desc, undefined, { hasTurnaround: false });
  assert.deepEqual(docs.map(([n]) => n), ["bang_nguyen_cu_tuong-turnaround.md"]);
  const md = docs[0][1];
  assert.match(md, /chưa có turnaround đã duyệt/);
  assert.match(md, /2 lượt riêng/);
  assert.match(md, /--stage direction/);
  assert.doesNotMatch(md, /approved TURNAROUND/);
  assert.match(md, /turnaround reference sheet/);
});

test("direction mode: có turnaround rồi thì 5 tờ hướng như cũ, tham chiếu 2 = turnaround đã duyệt", () => {
  const info = speciesInfo("bang_nguyen_cu_tuong");
  const docs = stageDocs(info, "direction", info.desc, undefined, { hasTurnaround: true });
  assert.equal(docs.length, 5);
  for (const [, md] of docs) assert.match(md, /image 2 = the approved TURNAROUND/);
});

test("kiểm turnaround mặc định bằng file thật: id không có thư mục thì qua bước turnaround; loài đã có turnaround.png giữ 5 tờ", () => {
  const docs = stageDocs({ ...speciesInfo("u_linh_hai_mau"), id: "__khong_co__" }, "direction", "x");
  assert.equal(docs.length, 1);
  assert.match(docs[0][0], /turnaround\.md$/);
  // bang_vu_ung đã có turnaround.png trong repo.
  assert.equal(stageDocs(speciesInfo("bang_vu_ung"), "direction", "x").length, 5);
});

test("Băng Nguyên Cự Tượng: attack dùng ngà + vòi, hurt không vừa lùi bước vừa đứng yên", () => {
  const info = speciesInfo("bang_nguyen_cu_tuong"), mv = moveFor(info);
  assert.match(mv.attack, /tusks/);
  assert.match(mv.attack, /trunk/);
  assert.doesNotMatch(mv.attack, /bite|claw/);
  assert.match(mv.hurt, /planted/);
  assert.doesNotMatch(mv.hurt.replace("(no step)", ""), /\bstep/); // chỉ được nhắc "no step"
  for (const p of promptsOf(info)) assert.doesNotMatch(p, /bite or claw swipe/);
});

test("câu hurt của họ bốn chân nhất quán: đứng yên bốn chân thì không có bước lùi", () => {
  assert.doesNotMatch(MOVE.quad.hurt, /recoils a short step/);
  assert.match(MOVE.quad.hurt, /no step/);
});

test("U Linh Hải Mẫu thuộc họ phù du không chân; prompt không còn feet / legs / roots / stems / vines / ground line", () => {
  const info = speciesInfo("u_linh_hai_mau");
  assert.equal(info.family, "float");
  assert.ok(LEGLESS.has("float"));
  for (const p of promptsOf(info)) {
    const body = p.replace(LEGLESS_NOTE, "");
    assert.doesNotMatch(body, LEG_WORDS, body.match(LEG_WORDS)?.[0]);
    assert.match(p, /LEGLESS|NO legs, feet/i);
    assert.match(p, /pulses|drifts|tentacles/);
  }
  const mv = moveFor(info);
  assert.match(mv.walk, /drifts/);
  assert.match(mv.idle, /pulses/);
  assert.match(mv.attack, /tentacles/);
});

test("mọi loài không chân (float / swim) trong mọi tờ: không chân, không ground; cá không ngửa bụng", () => {
  const ids = allIds().filter((id) => LEGLESS.has(speciesInfo(id).family));
  for (const id of ["u_linh_hai_mau", "tham_hai_ma_chuong", "kiem_ngu", "huyet_nha_cu_sa", "tham_hai_ma_kinh", "loi_quang_hai_dieu"]) assert.ok(ids.includes(id), id);
  for (const id of ids) for (const p of promptsOf(speciesInfo(id))) {
    const body = p.replace(LEGLESS_NOTE, "");
    assert.doesNotMatch(body, LEG_WORDS, `${id}: ${body.match(LEG_WORDS)?.[0]}`);
    assert.doesNotMatch(body, /pecks|hopping|crawling|coils tighter|wings blur/, id);
  }
});

test("ATTACK theo đặc điểm loài: mô tả có ngà / vòi / nọc / xúc tu / càng / sừng thì câu đánh nhắc đúng bộ phận", () => {
  const traits = [[/\btusks?\b/, /tusk/], [/\bstinger\b/, /stinger/], [/\btentacles?\b/, /tentacle/], [/\bbill\b/, /bill/], [/\bhorns?\b/, /horn/]];
  for (const id of allIds()) {
    const info = speciesInfo(id), mv = moveFor(info);
    for (const [inDesc, inAttack] of traits) if (inDesc.test(info.desc) && (MOVE_OVERRIDE[id] || LEGLESS.has(info.family))) assert.match(mv.attack, inAttack, `${id}: ${info.desc}`);
  }
  assert.match(moveFor(speciesInfo("kiem_ngu")).attack, /bill/);
  assert.match(moveFor(speciesInfo("kiem_vi_hat")).attack, /stinger/);
  assert.match(moveFor(speciesInfo("tham_hai_ma_chuong")).attack, /tentacles/);
});

test("loài không bị ảnh hưởng giữ câu của họ (bird, snake, plant, insect không ghi đè)", () => {
  for (const [id, family] of [["kim_linh_ung", "bird"], ["bich_lan_xa", "snake"], ["thuc_nhan_hoa", "plant"], ["doc_cham_phong", "insect"]]) {
    const info = speciesInfo(id);
    assert.equal(info.family, family);
    assert.deepEqual(moveFor(info), { ...MOVE[family], ...MOVE_OVERRIDE[id] });
  }
  assert.deepEqual(moveFor(speciesInfo("kim_linh_ung")), MOVE.bird);
  assert.deepEqual(moveFor(speciesInfo("bich_lan_xa")), MOVE.snake);
});

test("côn trùng không cánh (bọ cạp, nhện, tằm) không còn 'wings blur / hovering'", () => {
  for (const id of ["bang_bich_hat", "bang_tinh_hat", "kiem_vi_hat", "nhan_dien_ma_chu", "nhan_dien_ma_chu_non", "huyen_minh_bang_tam"]) {
    const mv = moveFor(speciesInfo(id));
    assert.doesNotMatch(Object.values(mv).join(" "), /wing|hover|fly/i, id);
  }
});

test("bài học: cú pháp loại họ (!@) và họ mới float / swim", () => {
  const md = "- [all !@float] A\n- [direction @float] B\n- [@swim] C";
  assert.deepEqual(lessonsFor("direction", "float", md).map((l) => l.text), ["B"]);
  assert.deepEqual(lessonsFor("direction", "quad", md).map((l) => l.text), ["A"]);
  assert.deepEqual(lessonsFor("sheet", "swim", md).map((l) => l.text), ["A", "C"]);
  assert.throws(() => parseLessons("- [!@lạ] X"), /họ lạ/);
});

test("bài học trong lessons.md: loài không chân không nhận câu 'stays upright on its feet' / 'legs fold'", () => {
  for (const family of ["float", "swim"]) for (const st of ["turnaround", "direction", "sheet"]) {
    const text = lessonsFor(st, family).map((l) => l.text).join("\n");
    assert.doesNotMatch(text, /on its feet|legs fold|the legs fold|ground line/, `${family}/${st}`);
    assert.match(text, /HURT/);
  }
  assert.match(lessonsFor("direction", "quad").map((l) => l.text).join("\n"), /stays upright on its feet/);
});

test("rà toàn bộ loài có ảnh tĩnh: prompt không còn cặp câu mâu thuẫn đã biết", () => {
  for (const id of allIds()) {
    const info = speciesInfo(id);
    for (const p of promptsOf(info)) {
      assert.doesNotMatch(p, /short step backward[^.]*planted/, id);
      if (LEGLESS.has(info.family)) assert.match(p, /NO legs, feet/, id);
    }
  }
});

test("mô tả loài không còn là tên tiếng Việt (boss Thiên Thanh Ngưu Mãng có mô tả tiếng Anh)", () => {
  assert.match(speciesInfo("thien_thanh_nguu_mang").desc, /bull/);
});
