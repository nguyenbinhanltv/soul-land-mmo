// Kiểm thử chuyển ngoại hình preset cũ sang LPC (HL2 #571): hàm thuần presetToLpc / parseNewLooks và MemoryStore.getLooks. Không cần bật server.
// Chạy: npm run test:looks-migrate --prefix server
import assert from "node:assert/strict";
import { SEXES, HAIR_STYLES, HAIR_COLORS, OUTFIT_COLORS, SKIN_TONES, presetToLpc, parseLpc, parseLooks, parseNewLooks, encodeLpc, type Looks } from "../../shared/data.ts";
import { MemoryStore } from "../src/db.ts";

const all: Looks[] = [];
for (let sex = 0; sex < SEXES.length; sex++) for (let hair = 0; hair < HAIR_STYLES[sex].length; hair++) for (let hairCol = 0; hairCol < HAIR_COLORS.length; hairCol++)
  for (let outfitCol = 0; outfitCol < OUTFIT_COLORS.length; outfitCol++) for (let skin = 0; skin < SKIN_TONES.length; skin++) all.push({ sex, hair, hairCol, outfitCol, skin, mode: "preset" });

console.log(`✓ ${all.length} tổ hợp preset`);
for (const l of all) {
  const lpc = presetToLpc(l);
  assert.ok(parseLpc(lpc), `không hợp lệ ${JSON.stringify(l)}`);
  assert.equal(lpc.body, l.sex); assert.equal(lpc.colors.skin, ["light", "amber", "bronze"][l.skin]);
  assert.ok(lpc.parts.hair && lpc.colors.hair, "có tóc và màu tóc");
  assert.deepEqual(presetToLpc(l), lpc, "hàm thuần, kết quả ổn định");
}
console.log("✓ mọi tổ hợp cho LPC hợp lệ: thể hình, da, tóc đúng; kết quả ổn định");
const kinds = new Set(all.map((l) => encodeLpc(presetToLpc(l))));
assert.ok(kinds.size > all.length / 3, "các tổ hợp khác nhau cho bộ LPC khác nhau");
console.log(`✓ ${kinds.size} bộ LPC khác nhau`);

// Giá trị lạ (bảng bị rút bớt) vẫn ra tổ hợp hợp lệ.
for (const bad of [{ sex: 0, hair: 99, hairCol: -1, outfitCol: 1.5, skin: 9 }, { sex: 7, hair: 0, hairCol: 0, outfitCol: 0, skin: 0 }]) assert.ok(parseLpc(presetToLpc(bad as Looks)));
console.log("✓ giá trị ngoài khoảng vẫn hợp lệ");

// parseNewLooks: preset (client cũ) thành lpc, lpc giữ nguyên, rác bị từ chối.
const n = parseNewLooks({ sex: 1, hair: 2, hairCol: 3, outfitCol: 4 })!;
assert.equal(n.mode, "lpc"); assert.deepEqual(n.lpc, presetToLpc({ sex: 1, hair: 2, hairCol: 3, outfitCol: 4, skin: 0 })); assert.equal(n.sex, 1); assert.equal(n.hair, 0);
assert.deepEqual(parseNewLooks({ mode: "lpc", lpc: n.lpc }), n);
assert.equal(parseNewLooks({ sex: 9 }), null); assert.equal(parseLooks({ sex: 1, hair: 2, hairCol: 3, outfitCol: 4 })?.mode, "preset");
console.log("✓ parseNewLooks: preset -> lpc, lpc giữ nguyên, sai -> null; parseLooks vẫn đọc preset cũ");

// MemoryStore.getLooks: chuyển lười, không tăng số lần đổi, chưa chọn thì giữ nguyên, chạy lại cho kết quả như cũ.
const st = new MemoryStore();
const a = (await st.login("migrate a", "mật-khẩu-1", true)) as { accountId: number }, b = (await st.login("migrate b", "mật-khẩu-1", true)) as { accountId: number };
assert.equal((await st.getLooks(b.accountId)).chosen, false);
assert.equal((await st.getLooks(b.accountId)).mode, "preset");
assert.ok(await st.chooseLooks(a.accountId, { sex: 0, hair: 3, hairCol: 5, outfitCol: 2, skin: 2, mode: "preset" }));
const g1 = await st.getLooks(a.accountId), g2 = await st.getLooks(a.accountId);
assert.equal(g1.mode, "lpc"); assert.ok(g1.chosen); assert.equal(g1.changes, 0); assert.ok(parseLpc(g1.lpc));
assert.deepEqual(g1, g2);
assert.deepEqual(g1.lpc, presetToLpc({ sex: 0, hair: 3, hairCol: 5, outfitCol: 2, skin: 2 }));
assert.equal((await st.getLooks(b.accountId)).mode, "preset");
console.log("✓ MemoryStore.getLooks: chuyển lười, không tăng looks_changes, tài khoản chưa chọn giữ nguyên");
