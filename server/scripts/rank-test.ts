// Kiểm thử Bảng Xếp Hạng (docs/design/xep-hang.md, bước X2): điểm Cấp / Sưu tầm (hàm thuần `rankScores`), thứ tự xếp (`rankCompare`) và
// `MemoryStore.rankPut / rankTop / rankMe` (cùng luật với PgStore: tie-break, `updated_at` chỉ đổi khi `score` đổi, ẩn tài khoản test, trang).
// Phần chạy trong phòng (tin `rank`, mốc ghi, ArenaRoom chặn) do bot thử (BOT_ONLY=rank). Chạy: npm run test:rank --prefix server
import assert from "node:assert/strict";
import { MemoryStore } from "../src/db.ts";
import { RANK_BOARDS, RANK_PAGE_MAX, RANK_POWER, TEAM_SIZE, calcStats, powerScore, rankBoardOf, rankCompare, rankScores, teamPowerScore } from "../../shared/data.ts";

function test(title: string, fn: () => void | Promise<void>) { return Promise.resolve(fn()).then(() => console.log(`✓ ${title}`)); }
const v = (rowId: number, vohon: string, level: number, xp: number, stars: number) => ({ rowId, vohon, level, xp, stars });
const put = (s: MemoryStore, id: number, level: number, xp: number, count = 1, team = [1]) =>
  s.rankPut(id, rankScores(Array.from({ length: count }, (_, i) => v(i + 1, "hao_thien_chuy", i === 0 ? level : 1, i === 0 ? xp : 0, 1)), team).map((r) => ({ board: r.board, period: 0, score: r.score, tie: r.tie, extra: r.lineup })));

await test("RANK_BOARDS: mã cố định, không trùng; rankBoardOf nhận mã lạ = undefined", () => {
  assert.deepEqual(RANK_BOARDS.map((b) => b.code), ["cap", "suu_tam", "suc_manh"]);
  assert.equal(rankBoardOf("cap")?.period, 0); assert.equal(rankBoardOf("xyz"), undefined); assert.equal(rankBoardOf(undefined), undefined);
});
await test("rankScores: chưa có võ hồn thì không có dòng; Cấp = cấp cao nhất, phụ = kinh nghiệm võ hồn đó; Sưu tầm = số võ hồn, phụ = tổng sao", () => {
  assert.deepEqual(rankScores([], []), []);
  const r = rankScores([v(1, "a", 10, 5, 2), v(2, "b", 30, 100, 3), v(3, "c", 30, 250, 1)], [2, 0, 3, 1, 9]);
  const cap = r.find((x) => x.board === "cap")!, st = r.find((x) => x.board === "suu_tam")!;
  assert.equal(cap.score, 30); assert.equal(cap.tie, 250, "cấp bằng nhau: kinh nghiệm cao hơn");
  assert.equal(st.score, 3); assert.equal(st.tie, 6);
  assert.deepEqual(cap.lineup, [{ vohon: "b", level: 30, stars: 3 }, { vohon: "c", level: 30, stars: 1 }, { vohon: "a", level: 10, stars: 2 }], "ô trống / mã lạ bị bỏ, chỉ mã võ hồn + cấp + sao");
  assert.deepEqual(Object.keys(cap.lineup[0]).sort(), ["level", "stars", "vohon"], "đội hình công khai không lộ thêm gì");
  assert.ok(rankScores([v(1, "a", 1, 0, 1)], [1, 1, 1, 1, 1, 1]).every((x) => x.lineup.length <= TEAM_SIZE));
});
await test("powerScore: hàm thuần theo RANK_POWER, tăng theo từng chỉ số, bỏ số hỏng; teamPowerScore cộng tối đa TEAM_SIZE võ hồn", () => {
  const st = { maxHp: 1000, maxMp: 200, atk: 100, crit: 0.1, critMult: 1.5 };
  assert.equal(powerScore(st), Math.floor(1000 * RANK_POWER.hp + 200 * RANK_POWER.mp + 100 * (1 + 0.1 * 0.5 * RANK_POWER.crit) * RANK_POWER.atk));
  for (const k of ["maxHp", "maxMp", "atk", "crit", "critMult"] as const) assert.ok(powerScore({ ...st, [k]: st[k] * 2 }) > powerScore(st), `${k} tăng thì điểm tăng`);
  assert.equal(powerScore({ ...st, atk: NaN }), 0); assert.equal(powerScore({ maxHp: -5, maxMp: -5, atk: -5, crit: -1, critMult: 0 }), 0);
  assert.equal(teamPowerScore([]), 0);
  assert.equal(teamPowerScore(Array(TEAM_SIZE + 3).fill(st)), TEAM_SIZE * powerScore(st), "chỉ tính TEAM_SIZE ô đầu");
  const lv = (level: number) => powerScore(calcStats(0, level, [], 1));
  assert.ok(lv(2) > lv(1) && lv(60) > lv(30), "điểm theo cấp từ calcStats thật");
});
await test("rankScores: Sức mạnh chỉ có khi có power (>0); phụ = tổng cấp đội hình; không đổi dòng Cấp / Sưu tầm", () => {
  const owned = [v(1, "a", 20, 0, 1), v(2, "b", 10, 0, 4)];
  assert.deepEqual(rankScores(owned, [1, 2]).map((r) => r.board), ["cap", "suu_tam"]);
  assert.deepEqual(rankScores(owned, [1, 2], 0).map((r) => r.board), ["cap", "suu_tam"]);
  const r = rankScores(owned, [1, 2], 1234.9), p = r.find((x) => x.board === "suc_manh")!;
  assert.equal(p.score, 1234); assert.equal(p.tie, 30); assert.equal(p.lineup.length, 2);
  assert.deepEqual(r.filter((x) => x.board !== "suc_manh"), rankScores(owned, [1, 2]));
});
await test("rankCompare: điểm, phụ, ai đạt trước, mã tài khoản", () => {
  const x = (score: number, tie: number, at: number, accountId: number) => ({ score, tie, at, accountId });
  assert.deepEqual([x(5, 0, 1, 1), x(9, 0, 5, 2), x(9, 3, 9, 3), x(9, 3, 2, 4), x(9, 3, 2, 0)].sort(rankCompare).map((r) => r.accountId), [0, 4, 3, 2, 1]);
});
await test("MemoryStore: xếp đúng thứ tự, hạng của mình, hạng mục lạ rỗng", async () => {
  const s = new MemoryStore(); for (const [i, n] of [[1, "A"], [2, "B"], [3, "C"]] as const) s.names.set(i, n);
  await put(s, 1, 30, 10); await put(s, 2, 30, 90); await put(s, 3, 50, 0);
  const t = await s.rankTop("cap", 0, 1, 10);
  assert.deepEqual(t.rows.map((r) => [r.rank, r.name, r.score, r.tie]), [[1, "C", 50, 0], [2, "B", 30, 90], [3, "A", 30, 10]]);
  assert.equal(t.total, 3); assert.equal(t.hasNext, false);
  assert.equal((await s.rankMe("cap", 0, 2))?.rank, 2); assert.equal(await s.rankMe("cap", 0, 99), null);
  assert.equal((await s.rankTop("xyz", 0, 1, 10)).total, 0);
});
await test("updated_at chỉ đổi khi score đổi: đổi xp / đội hình không đổi thứ tự 'đạt trước', nhưng xp vẫn quyết thứ tự", async () => {
  const s = new MemoryStore(); for (const [i, n] of [[1, "A"], [2, "B"]] as const) s.names.set(i, n);
  await put(s, 1, 40, 0); await put(s, 2, 40, 0);
  const at1 = (await s.rankMe("cap", 0, 1))!.at;
  assert.equal((await s.rankMe("cap", 0, 1))!.rank, 1, "bằng điểm và phụ: A đạt mốc trước");
  await put(s, 1, 40, 5); // chỉ xp đổi
  assert.equal((await s.rankMe("cap", 0, 1))!.at, at1, "chỉ đổi tie: at không đổi");
  await put(s, 2, 40, 500);
  assert.equal((await s.rankMe("cap", 0, 2))!.rank, 1, "xp cao hơn thì đứng trước dù đạt mốc sau");
  assert.equal((await s.rankMe("cap", 0, 2))!.at, (await s.rankMe("cap", 0, 2))!.at);
  await put(s, 1, 41, 0);
  assert.ok((await s.rankMe("cap", 0, 1))!.at > at1, "score đổi thì at mới");
});
await test("extra (đội hình) cập nhật khi chỉ đổi đội hình, không đổi score", async () => {
  const s = new MemoryStore(); s.names.set(1, "A");
  const owned = [v(1, "a", 20, 0, 1), v(2, "b", 10, 0, 4)], rows = (team: number[]) => rankScores(owned, team).map((r) => ({ board: r.board, period: 0, score: r.score, tie: r.tie, extra: r.lineup }));
  await s.rankPut(1, rows([1, 2])); const at = (await s.rankMe("cap", 0, 1))!.at;
  await s.rankPut(1, rows([2, 1]));
  assert.deepEqual((await s.rankTop("cap", 0, 1, 5)).rows[0].lineup.map((x) => x.vohon), ["b", "a"]);
  assert.equal((await s.rankMe("cap", 0, 1))!.at, at);
});
await test("tài khoản is_test bị ẩn khỏi bảng và khỏi hạng của chính nó; bật cờ sau khi đã có điểm cũng ẩn", async () => {
  const s = new MemoryStore(); for (const [i, n] of [[1, "A"], [2, "T"], [3, "C"]] as const) s.names.set(i, n);
  await put(s, 1, 10, 0); await put(s, 2, 99, 0); await put(s, 3, 5, 0);
  s.tests.add(2);
  assert.deepEqual((await s.rankTop("cap", 0, 1, 10)).rows.map((r) => r.name), ["A", "C"]);
  assert.equal(await s.rankMe("cap", 0, 2), null, "người ẩn nhận me: null");
  assert.equal((await s.rankMe("cap", 0, 3))!.rank, 2);
});
await test("phân trang: total, hasNext, trang cuối, trang quá cuối rỗng, pageSize kẹp RANK_PAGE_MAX", async () => {
  const s = new MemoryStore(); const n = RANK_PAGE_MAX + 5;
  for (let i = 1; i <= n; i++) { s.names.set(i, `P${i}`); await put(s, i, i, 0); }
  const p1 = await s.rankTop("cap", 0, 1, 9999);
  assert.equal(p1.pageSize, RANK_PAGE_MAX); assert.equal(p1.rows.length, RANK_PAGE_MAX); assert.equal(p1.hasNext, true); assert.equal(p1.total, n);
  const p2 = await s.rankTop("cap", 0, 2, 9999);
  assert.equal(p2.rows.length, 5); assert.equal(p2.hasNext, false); assert.equal(p2.rows[0].rank, RANK_PAGE_MAX + 1);
  assert.equal((await s.rankTop("cap", 0, 99, 10)).rows.length, 0);
  assert.equal((await s.rankTop("cap", 0, -3, 10)).page, 1, "trang < 1 về trang 1");
});
await test("xoá tài khoản test xoá cả dòng rank_scores", async () => {
  const s = new MemoryStore(); s.accounts.set("t", { id: 1, pass: "x" }); s.names.set(1, "T"); s.tests.add(1);
  await put(s, 1, 10, 0);
  const n = await s.removeTestAccount("T");
  assert.equal(n.rank_scores, 2); assert.equal(s.rankRows.size, 0);
});
