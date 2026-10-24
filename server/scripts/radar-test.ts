// Kiểm thử hàm thuần radar (shared/radar.ts, hằng RADAR / MAPVIEW / FOG ở shared/data.ts, mục 5.17): không cần bật server.
// Chạy: npm run test:radar --prefix server
import assert from "node:assert/strict";
import { RADAR, RADAR_ART, MAPVIEW, FOG, MAPS, TILE } from "../../shared/data.ts";
import {
  radarRotate, radarUnrotate, radarNorthAngle, radarCompassRotation, radarPlace, clampToCircle, radarHit, radarZoomStep, radarPrio,
  radarSortDots, radarPick,
} from "../../shared/radar.ts";

function test(title: string, fn: () => void) { fn(); console.log(`✓ ${title}`); }
const near = (got: number, want: number, what: string, tol = 1e-9) => assert.ok(Math.abs(got - want) <= tol, `${what}: ${got} lệch ${want}`);

test("Hằng số: tầm mặc định nằm trong bảng phóng, ưu tiên 1..7 liên tiếp, bản đồ mở sẵn có thật", () => {
  assert.equal(RADAR.zooms[RADAR.zoomDefault], RADAR.r); assert.deepEqual([...RADAR.zooms].sort((a, b) => a - b), RADAR.zooms);
  assert.ok(RADAR.far > RADAR.zooms[RADAR.zooms.length - 1] && RADAR.hz > 0 && RADAR.hitPx > 0);
  assert.deepEqual(RADAR.levels.map((l) => l.prio), [1, 2, 3, 4, 5, 6, 7]); assert.equal(new Set(RADAR.levels.map((l) => l.id)).size, 7);
  assert.ok(RADAR.levels.every((l) => l.size >= 5 && l.size <= 9));
  assert.ok(MAPVIEW.zoomMin <= MAPVIEW.zoomDefault && MAPVIEW.zoomDefault <= MAPVIEW.zoomMax);
  assert.equal(new Set(MAPVIEW.layers.map((l) => l.id)).size, MAPVIEW.layers.length);
  assert.ok(FOG.cell > 0 && FOG.sight > 0); for (const m of FOG.open) assert.ok(MAPS[m], `bản đồ mở sẵn lạ ${m}`);
  assert.deepEqual(Object.values(RADAR_ART).map((a) => a.key), ["ui_radar_frame", "ui_radar_compass", "ui_mapview_paper"]);
});

test("Chiếu iso: đi lên màn hình (thế giới −1,−1) thì lên radar; đi phải màn hình (1,−1) thì sang phải", () => {
  const up = radarRotate(-1, -1, "iso"); near(up.x, 0, "up.x"); assert.ok(up.y < 0);
  const right = radarRotate(1, -1, "iso"); near(right.y, 0, "right.y"); assert.ok(right.x > 0);
  const down = radarRotate(1, 1, "iso"); near(down.x, 0, "down.x"); assert.ok(down.y > 0);
});

test("Chiếu iso giữ khoảng cách (vòng tròn vẫn tròn); nhìn thẳng giữ nguyên; xoay ngược về đúng", () => {
  for (const [dx, dy] of [[10, 0], [0, 7], [-3, 4], [123, -45]]) {
    for (const mode of ["iso", "flat"] as const) {
      const p = radarRotate(dx, dy, mode); near(Math.hypot(p.x, p.y), Math.hypot(dx, dy), `độ dài ${mode}`);
      const q = radarUnrotate(p.x, p.y, mode); near(q.x, dx, `x ${mode}`, 1e-9); near(q.y, dy, `y ${mode}`, 1e-9);
    }
  }
  assert.deepEqual(radarRotate(5, -3, "flat"), { x: 5, y: -3 });
});

test("Hướng Bắc (thế giới −y): nhìn thẳng thì lên; iso thì lên-phải; ảnh la bàn xoay đúng góc đó", () => {
  near(radarNorthAngle("flat"), -Math.PI / 2, "flat"); near(radarNorthAngle("iso"), -Math.PI / 4, "iso");
  near(radarCompassRotation("flat"), 0, "la bàn thẳng"); near(radarCompassRotation("iso"), Math.PI / 4, "la bàn iso");
});

test("radarPlace: trong tầm tỉ lệ theo tầm, ngoài tầm kẹp vào mép có lùi, kèm khoảng cách ô và góc", () => {
  const rPx = 84, rT = 40;
  const a = radarPlace(rT * TILE / 2, 0, "flat", rT, rPx); assert.equal(a.outside, false); near(a.x, rPx / 2, "x"); near(a.y, 0, "y"); near(a.tiles, 20, "tiles");
  const b = radarPlace(0, -100 * TILE, "flat", rT, rPx, 6); assert.equal(b.outside, true);
  near(Math.hypot(b.x, b.y), rPx - 6, "mép"); near(b.y, -(rPx - 6), "hướng lên"); near(b.tiles, 100, "tiles"); near(b.angle, -Math.PI / 2, "góc");
  const c = radarPlace(rT * TILE, 0, "flat", rT, rPx); assert.equal(c.outside, false, "đúng bán kính vẫn trong tầm");
  near(Math.hypot(c.x, c.y), rPx, "ở mép tròn");
  const d = radarPlace(0, 0, "iso", rT, rPx); assert.deepEqual([d.x, d.y, d.outside, d.tiles], [0, 0, false, 0]);
  const e = radarPlace(-60 * TILE, -60 * TILE, "iso", rT, rPx); assert.equal(e.outside, true); near(e.x, 0, "iso lên: x", 1e-6); assert.ok(e.y < 0);
});

test("clampToCircle / radarHit: trong đĩa giữ nguyên, ngoài về mép đúng hướng, tâm không chia 0", () => {
  assert.deepEqual(clampToCircle(3, 4, 10), { x: 3, y: 4 }); assert.deepEqual(clampToCircle(0, 0, 10), { x: 0, y: 0 });
  const p = clampToCircle(30, 40, 10); near(p.x, 6, "x"); near(p.y, 8, "y"); assert.deepEqual(clampToCircle(5, 5, 0), { x: 0, y: 0 });
  assert.ok(radarHit(3, 4, 5)); assert.ok(!radarHit(3.1, 4, 5));
});

test("Thu phóng: phóng to = tầm nhỏ lại, kẹp hai đầu, chỉ số lạ được kẹp", () => {
  assert.equal(radarZoomStep(1, 1), 0); assert.equal(radarZoomStep(1, -1), 2); assert.equal(radarZoomStep(0, 1), 0); assert.equal(radarZoomStep(2, -1), 2);
  assert.equal(radarZoomStep(9, -1), 2); assert.equal(radarZoomStep(-4, 1), 0);
});

test("Xếp chấm: ưu tiên thấp vẽ trước, cao đè sau, cùng mức giữ thứ tự, không sửa mảng gốc; chọn chấm theo ưu tiên", () => {
  assert.equal(radarPrio("boss"), 7); assert.equal(radarPrio("beast"), 1); assert.equal(radarPrio("la"), 0);
  const dots = [{ n: "boss", prio: radarPrio("boss"), x: 0, y: 0 }, { n: "t1", prio: 1, x: 0, y: 0 }, { n: "ally", prio: radarPrio("ally"), x: 1, y: 0 },
    { n: "t2", prio: 1, x: 5, y: 5 }, { n: "player", prio: radarPrio("player"), x: 0, y: 1 }];
  const before = dots.map((d) => d.n);
  assert.deepEqual(radarSortDots(dots).map((d) => d.n), ["t1", "t2", "player", "ally", "boss"]);
  assert.deepEqual(dots.map((d) => d.n), before);
  assert.equal(radarPick(dots, 0, 0)?.n, "boss", "chồng nhau thì chọn mức cao nhất");
  assert.equal(radarPick(dots, 5, 5)?.n, "t2"); assert.equal(radarPick(dots, 50, 50), undefined);
  assert.equal(radarPick([{ prio: 1, x: 1, y: 0 }, { prio: 1, x: 0.2, y: 0 }], 0, 0)?.x, 0.2, "cùng mức thì chọn gần hơn");
});
