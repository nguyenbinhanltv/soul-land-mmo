import assert from "node:assert/strict";
import { VOHON } from "../../shared/data.ts";
import { applySpiritPose, SPIRIT_FAMILY, SPIRIT_MOTION, SPIRIT_PIVOT, spiritPose, spiritScale, spiritPhase, kickEnvelope, pivotShift, newSpiritPose } from "../src/spiritMotion.ts";

// H7 (#490): mọi võ hồn có họ chuyển động, mọi họ có đủ số liệu cho 4 trạng thái
for (const v of VOHON) assert.ok(SPIRIT_FAMILY[v.id], `thiếu họ chuyển động cho ${v.id}`);
for (const id of Object.keys(SPIRIT_FAMILY)) assert.ok(VOHON.some((v) => v.id === id), `họ chuyển động thừa mã lạ ${id}`);
const fams = [...new Set(Object.values(SPIRIT_FAMILY))];
for (const f of fams) for (const s of ["idle", "walk", "attack", "cast"]) assert.ok(SPIRIT_MOTION[s][f], `${s}/${f}`);
for (const f of fams) assert.ok(SPIRIT_PIVOT[f] > 0);

// mức chuyển động: Giảm chuyển động tắt, Thấp < Vừa < Cao, người khác nhẹ hơn chính mình
assert.equal(spiritScale("high", true, true), 0);
assert.ok(spiritScale("low", false, true) < spiritScale("mid", false, true) && spiritScale("mid", false, true) < spiritScale("high", false, true));
assert.ok(spiritScale("mid", false, false) < spiritScale("mid", false, true));

const P = newSpiritPose();
// k = 0: không đụng ảnh gốc
spiritPose(P, "wing", "walk", 1234, 0, 0, 1, -1, 0, 0);
assert.equal(P.active, false); assert.equal(P.rot, 0); assert.equal(P.sx, 1); assert.equal(P.sy, 1);
// đi: đuôi vẫy quanh 0 và có độ lệch; không tạo object (cùng tham chiếu trả về)
let maxRot = 0;
for (let t = 0; t < 2000; t += 10) { assert.equal(spiritPose(P, "tail", "walk", t, 0, 0, 1, -1, 1, 0), P); maxRot = Math.max(maxRot, Math.abs(P.rot)); }
assert.ok(maxRot > 0.05 && maxRot <= SPIRIT_MOTION.walk.tail.rot + 1e-9);
// biên độ tỉ lệ với mức; lật ngang đổi dấu xoay
spiritPose(P, "weapon", "attack", 0, 150, 300, 1, -1, 1, 0); const r1 = P.rot;
spiritPose(P, "weapon", "attack", 0, 150, 300, -1, -1, 1, 0); assert.ok(Math.abs(P.rot + r1) < 1e-9 && r1 !== 0);
spiritPose(P, "weapon", "attack", 0, 150, 300, 1, -1, 0.5, 0); assert.ok(Math.abs(P.rot - r1 / 2) < 1e-9);
// cú đánh: bắt đầu và kết thúc ở 0, lấy đà ngược chiều trước khi vung
assert.equal(kickEnvelope(0), 0); assert.equal(kickEnvelope(1), 0);
assert.ok(kickEnvelope(SPIRIT_MOTION.kick.wind * 0.9) < 0, "lấy đà ngược chiều");
assert.ok(kickEnvelope(0.65) > 0.5, "vung ra");
// phép xoay quanh điểm xoay: điểm xoay đứng yên (gần như)
{
  const q = newSpiritPose(); q.rot = 0.2; q.pivot = 30; q.dx = 0; q.dy = 0;
  const sh = pivotShift({ x: 0, y: 0 }, q);
  // điểm (0,-30) sau xoay quanh gốc rồi cộng độ lệch phải về chính nó
  const px = 0 * Math.cos(q.rot) + 30 * Math.sin(q.rot), py = 0 * Math.sin(q.rot) - 30 * Math.cos(q.rot);
  assert.ok(Math.abs(px + sh.x - 0) < 1e-9 && Math.abs(py + sh.y + 30) < 1e-9);
}
// lệch pha ổn định và phân tán
assert.equal(spiritPhase("abc"), spiritPhase("abc"));
const ph = new Set(Array.from({ length: 40 }, (_, i) => spiritPhase("p" + i).toFixed(2)));
assert.ok(ph.size > 30, "40 người lệch pha khác nhau");
// bị đánh: giật trong hurt.ms rồi hết
spiritPose(P, "ghost", "idle", 0, 0, 0, 1, 40, 1, 0); const h1 = P.dx;
spiritPose(P, "ghost", "idle", 0, 0, 0, 1, SPIRIT_MOTION.hurt.ms + 1, 1, 0); assert.notEqual(h1, P.dx);
// ảnh 48×48 (base 1) và 96×96 (base 1/SPR): độ dời trong khung chứa như nhau, chỉ độ phóng khác
{
  const SPR = 2, mk = () => ({ x: 0, y: 0, setRotation() {}, sc: [1, 1], setScale(a, b) { this.sc = [a, b]; } });
  const q = newSpiritPose(); q.rot = 0.2; q.pivot = 26; q.dx = 3; q.dy = -2;
  const a = mk(), b = mk();
  applySpiritPose([a], q, { x: 0, y: 0 }, 0, 0, 1 / SPR, 1 / SPR); applySpiritPose([b], q, { x: 0, y: 0 }, 0, 0, 1, 1 / SPR);
  assert.equal(a.x, b.x); assert.equal(a.y, b.y);
  assert.notEqual(a.sc[0], b.sc[0]);
}
console.log("spiritmotion-test: ok");
