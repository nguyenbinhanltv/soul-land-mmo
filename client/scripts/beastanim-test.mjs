// H3 (#688): chọn khung hoạt ảnh vẽ thật của hồn thú theo hướng / trạng thái; bố cục manifest; lùi về mặc định khi thiếu.
import assert from "node:assert/strict";
import { ANIM_DIRS, ART_MS, DEFAULT_LAYOUT as L, animDir, animDirOk, beastDirPlan, animFrame, dieFrame, dieMs, lungeKeep, STRIKE_MS, newBeastAnimState, parseLayout, stepBeastAnim } from "../src/beastAnim.ts";

// hướng: 5 hướng vẽ, tây lật ngang
const flips = { s: ["s", false], se: ["se", false], e: ["e", false], ne: ["ne", false], n: ["n", false], sw: ["se", true], w: ["e", true], nw: ["ne", true] };
for (const [f, [d, flip]] of Object.entries(flips)) assert.deepEqual(animDir(f), { dir: ANIM_DIRS.indexOf(d), flip }, f);

// khung: 6 cột, mỗi hướng 4 dải; idle / hurt chung dải 0
assert.equal(animFrame(L, "idle", 0, 0), 0);
assert.equal(animFrame(L, "hurt", 0, 1), 5);
assert.equal(animFrame(L, "walk", 0, 5), 6 + 5);
assert.equal(animFrame(L, "attack", 1, 0), (1 * 4 + 2) * 6);
assert.equal(animFrame(L, "die", 4, 9), (4 * 4 + 3) * 6 + 3, "kẹp ở khung cuối");
const seen = new Set();
for (let d = 0; d < 5; d++) for (const [a, s] of Object.entries(L.anims)) for (let i = 0; i < s.n; i++) seen.add(animFrame(L, a, d, i));
assert.equal(seen.size, 5 * 22, "22 khung / hướng, không trùng");
assert.ok([...seen].every((n) => n < 6 * 20));

// thiếu / lạ → mặc định; hợp lệ → dùng
assert.equal(parseLayout(undefined), L);
assert.equal(parseLayout({ anims: { idle: {} }, dirs: [] }), L);
const M = parseLayout({ dirs: [...ANIM_DIRS], cols: 6, rowsPerDir: 4, anims: { idle: { band: 0, col: 0, n: 2 }, hurt: { band: 0, col: 4, n: 2 }, walk: { band: 1, col: 0, n: 6 }, attack: { band: 2, col: 0, n: 6 }, die: { band: 3, col: 0, n: 4 } } });
assert.equal(M.anims.idle.n, 2);

// đứng: vòng lặp theo giờ, đổi hướng giữa chừng giữ nguyên số khung
let st = newBeastAnimState(0, false, 10), r = stepBeastAnim(st, L, 0, false, false, 10, "s");
assert.equal(r.state, "idle"); assert.equal(r.frame, 0);
for (let t = 16; t <= ART_MS.idle * 2.5; t += 16) r = stepBeastAnim(st, L, t, false, false, 10, "s");
assert.equal(r.frame % 6, 2, "khung 2 sau ~2,5 nhịp");
const idx = r.frame, r2 = stepBeastAnim(st, L, ART_MS.idle * 2.5 + 16, false, false, 10, "ne");
assert.equal(r2.frame % 6, idx % 6, "đổi hướng chỉ đổi hàng");
assert.equal(Math.floor(r2.frame / 24), 3, "hàng khối ne");

// đi: dải đi, giữ thêm walkHold sau khi tắt cờ moving
st = newBeastAnimState(0, false, 10);
r = stepBeastAnim(st, L, 16, true, false, 10, "e");
assert.equal(r.state, "walk"); assert.ok(r.frame >= 2 * 24 + 6 && r.frame < 2 * 24 + 12);
assert.equal(stepBeastAnim(st, L, 40, false, false, 10, "e").state, "walk", "chưa hết walkHold");
assert.equal(stepBeastAnim(st, L, 40 + ART_MS.walkHold + 1, false, false, 10, "e").state, "idle");
// hướng tây lật ngang
assert.equal(stepBeastAnim(st, L, 400, true, false, 10, "w").flip, true);
assert.equal(stepBeastAnim(st, L, 416, true, false, 10, "e").flip, false);
// nhịp đi theo walkScale (cộng dồn pha)
const a = newBeastAnimState(0, false, 1), b = newBeastAnimState(0, false, 1);
let fa = 0, fb = 0;
for (let t = 16; t <= 480; t += 16) { fa = stepBeastAnim(a, L, t, true, false, 1, "s", 0.7).frame; fb = stepBeastAnim(b, L, t, true, false, 1, "s", 1.4).frame; }
assert.notEqual(fa, fb);

// đánh: báo trước giữ khung 0 dải đánh, tung chiêu chạy khung 1..5 rồi về đứng
st = newBeastAnimState(0, false, 10);
for (let t = 16; t < 500; t += 16) { r = stepBeastAnim(st, L, t, false, true, 10, "se"); assert.equal(r.state, "windup"); assert.equal(r.frame, animFrame(L, "attack", 1, 0)); }
const T0 = 512, got = [];
for (let t = T0; t < T0 + 500; t += 10) { r = stepBeastAnim(st, L, t, false, false, 10, "se"); if (r.state === "attack") got.push(r.frame % 6); }
assert.deepEqual([...new Set(got)], [1, 2, 3, 4, 5], "ra đòn đi hết khung 1..5 theo thứ tự");
assert.ok(got.every((v, i) => i === 0 || v >= got[i - 1]));
assert.equal(stepBeastAnim(st, L, T0 + 600, false, false, 10, "se").state, "idle");

// đòn thường (#1059): bộ đếm atk đổi thì chạy một lượt dải ra đòn; lần đọc đầu và khi không đổi thì không
st = newBeastAnimState(0, false, 10);
assert.equal(stepBeastAnim(st, L, 16, false, false, 10, "se", 1, 7).state, "idle", "lần đọc đầu không chạy bù");
assert.equal(stepBeastAnim(st, L, 32, false, false, 10, "se", 1, 7).state, "idle", "bộ đếm không đổi");
const g2 = [];
for (let t = 48; t < 48 + 500; t += 10) { r = stepBeastAnim(st, L, t, false, false, 10, "se", 1, 8); if (r.state === "attack") g2.push(r.frame % 6); }
assert.deepEqual([...new Set(g2)], [1, 2, 3, 4, 5], "đòn thường đi hết khung 1..5");
assert.equal(stepBeastAnim(st, L, 48 + 600, false, false, 10, "se", 1, 8).state, "idle", "xong lượt về đứng");
assert.equal(stepBeastAnim(st, L, 48 + 616, false, false, 10, "se", 1, 0).state, "attack", "quay vòng 255 → 0 vẫn tính là đổi");

// trúng đòn: máu giảm → 2 khung hurt rồi về; đang đánh thì giữ dải đánh
st = newBeastAnimState(0, false, 10);
stepBeastAnim(st, L, 100, false, false, 10, "s");
assert.deepEqual([stepBeastAnim(st, L, 116, false, false, 7, "s"), stepBeastAnim(st, L, 116 + ART_MS.hurt[0], false, false, 7, "s")].map((x) => [x.state, x.frame]), [["hurt", 4], ["hurt", 5]]);
assert.equal(stepBeastAnim(st, L, 116 + ART_MS.hurt[0] + ART_MS.hurt[1] + 1, false, false, 7, "s").state, "idle");
st = newBeastAnimState(0, true, 10);
assert.equal(stepBeastAnim(st, L, 50, false, true, 5, "s").state, "windup", "báo trước ưu tiên hơn trúng đòn");

// quãng lao của code: một nửa, giảm đều về 0 đúng lúc dải ra đòn hết (không còn nhảy khi chuyển sang đứng / đi)
assert.equal(lungeKeep(0), 0.5); assert.equal(lungeKeep(STRIKE_MS), 0); assert.equal(lungeKeep(STRIKE_MS + 500), 0);
assert.ok(lungeKeep(STRIKE_MS / 2) < 0.5 && lungeKeep(STRIKE_MS / 2) > 0);

// chết: giữ khung cuối
assert.equal(dieFrame(L, 2, 0), animFrame(L, "die", 2, 0));
assert.equal(dieFrame(L, 2, dieMs(L) + 5000), animFrame(L, "die", 2, 3));
// anim.dirsOk (#869): hướng chưa đạt dùng ảnh tĩnh; tây tính theo hướng đông tương ứng; đủ 5 hướng thì bỏ dirsOk; giá trị lạ / trùng bị lọc
const raw = { dirs: [...ANIM_DIRS], cols: 6, rowsPerDir: 4, anims: M.anims };
assert.equal(parseLayout(raw).dirsOk, undefined, "không khai = đủ mọi hướng");
assert.equal(parseLayout({ ...raw, dirsOk: [...ANIM_DIRS] }).dirsOk, undefined, "khai đủ 5 = đủ mọi hướng");
const P = parseLayout({ ...raw, dirsOk: ["s", "se", "e", "x", "e"] });
assert.deepEqual(P.dirsOk, ["s", "se", "e"]);
for (const [f, ok] of Object.entries({ s: true, se: true, e: true, ne: false, n: false, sw: true, w: true, nw: false })) assert.equal(animDirOk(f, P), ok, f);
assert.equal(animDirOk("n", L), true, "bố cục mặc định: mọi hướng đạt");
assert.deepEqual(parseLayout({ ...raw, dirsOk: [] }).dirsOk, [], "danh sách rỗng: mọi hướng dùng ảnh tĩnh");
// beastDirPlan (#869, review): hướng chưa đạt + sheet tĩnh có → static; chưa có → khung hướng đạt GẦN NHẤT (không bao giờ khung chưa duyệt)
for (const f of ["s", "se", "e", "sw", "w"]) assert.deepEqual(beastDirPlan(f, P, false), { mode: "anim", face: f }, f);
assert.deepEqual(beastDirPlan("ne", P, true), { mode: "static", face: "e" });
assert.deepEqual(beastDirPlan("n", P, false), { mode: "near", face: "e" });
assert.deepEqual(beastDirPlan("nw", P, false), { mode: "near", face: "w" }, "tây giữ lật ngang");
const S2 = parseLayout({ ...raw, dirsOk: ["s", "e"] });
assert.equal(beastDirPlan("se", S2, false).mode, "near");
assert.ok(animDirOk(beastDirPlan("n", S2, false).face, S2), "mọi mặt thay thế đều là hướng đạt");
for (const f of ["s", "se", "e", "ne", "n", "sw", "w", "nw"]) for (const sr of [true, false]) for (const lay of [P, S2]) {
  const pl = beastDirPlan(f, lay, sr); assert.ok(animDirOk(pl.face, lay), `${f} → ${pl.face}`);
}
console.log("beastanim-test: OK");
