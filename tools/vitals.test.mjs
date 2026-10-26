// Bài đơn vị cho tin riêng `vit` (#949, shared/vitals.ts): khi nào server gửi lại, client đếm lùi, kiểm dữ liệu hỏng.
import test from "node:test";
import assert from "node:assert/strict";
import { SYNC_VIEW } from "../shared/data.ts";
import { emptyVitals, vitalsAfter, vitalsDue, vitalsPack, vitalsParse } from "../shared/vitals.ts";

const base = () => ({ ...emptyVitals(), xp: 5, xpNeed: 100, mp: 50, maxMp: 100 });
const with_ = (o) => ({ ...base(), ...o });

test("chưa gửi lần nào thì gửi", () => assert.equal(vitalsDue(null, base(), 0), true));
test("không đổi gì thì không gửi", () => assert.equal(vitalsDue(base(), base(), 5), false));
test("kinh nghiệm / hồn lực tối đa đổi: gửi ngay", () => {
  assert.equal(vitalsDue(base(), with_({ xp: 6 }), 0), true);
  assert.equal(vitalsDue(base(), with_({ xpNeed: 120 }), 0), true);
  assert.equal(vitalsDue(base(), with_({ maxMp: 110 }), 0), true);
});
test("hồn lực giảm (tung chiêu): gửi ngay; chỉ hồi dần: gộp theo vitGap", () => {
  assert.equal(vitalsDue(base(), with_({ mp: 40 }), 0), true);
  assert.equal(vitalsDue(base(), with_({ mp: 51 }), SYNC_VIEW.vitGap / 2), false);
  assert.equal(vitalsDue(base(), with_({ mp: 51 }), SYNC_VIEW.vitGap), true);
});
test("hồi chiêu vừa bật: gửi; chỉ giảm đúng nhịp client đếm lùi: không gửi", () => {
  assert.equal(vitalsDue(base(), with_({ cds: [3, 0, 0, 0] }), 0), true);
  assert.equal(vitalsDue(with_({ cds: [3, 0, 0, 0], swCd: 3 }), with_({ cds: [2, 0, 0, 0], swCd: 2 }), 1), false);
  assert.equal(vitalsDue(with_({ cds: [3, 0, 0, 0] }), with_({ cds: [0, 0, 0, 0] }), 1), true, "bị làm mới (hook ready): gửi");
});
test("client đếm nhanh hơn server (nhịp chậm) báo sẵn sàng sớm: gửi lại; chậm hơn trong dung sai thì không", () => {
  const sent = with_({ swCd: 3 });
  assert.equal(vitalsDue(sent, with_({ swCd: 3 - 1 + SYNC_VIEW.vitEarly * 2 }), 1), true, "server còn hồi chiêu hơn client tính");
  assert.equal(vitalsDue(sent, with_({ swCd: 2 - SYNC_VIEW.vitCd / 2 }), 1), false, "server hết sớm trong dung sai vitCd");
  assert.equal(vitalsDue(sent, with_({ swCd: 2 - SYNC_VIEW.vitCd * 2 }), 1), true);
});
test("vitalsAfter đếm lùi, không âm; không đổi bản gốc", () => {
  const v = with_({ cds: [1, 2, 0, 0], swCd: 0.5 }), a = vitalsAfter(v, 1);
  assert.deepEqual(a.cds, [0, 1, 0, 0]); assert.equal(a.swCd, 0); assert.equal(a.mp, 50); assert.deepEqual(v.cds, [1, 2, 0, 0]);
});
test("vitalsPack làm tròn; vitalsParse từ chối dữ liệu hỏng", () => {
  const p = vitalsPack(with_({ cds: [1.23456, 0, 0, 0], ctCd: 0.004 }));
  assert.equal(p.cds[0], 1.23); assert.equal(p.ctCd, 0);
  assert.deepEqual(vitalsParse(p), p);
  for (const bad of [null, 1, {}, { ...p, mp: "9" }, { ...p, cds: [0, 0] }, { ...p, bcds: [0, 0, NaN] }]) assert.equal(vitalsParse(bad), null);
});
