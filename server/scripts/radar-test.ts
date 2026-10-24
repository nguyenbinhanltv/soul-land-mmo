// Kiểm thử hàm thuần radar (shared/radar.ts, hằng RADAR / MAPVIEW / FOG ở shared/data.ts, mục 5.17): không cần bật server.
// Chạy: npm run test:radar --prefix server
import assert from "node:assert/strict";
import { RADAR, RADAR_ART, MAPVIEW, FOG, MAPS, TILE, AUTOWALK } from "../../shared/data.ts";
import {
  radarRotate, radarUnrotate, radarNorthAngle, radarCompassRotation, radarPlace, clampToCircle, radarHit, radarZoomStep, radarPrio,
  radarSortDots, radarPick, mapviewToScreen, mapviewToTile, mapviewZoomAt, mapviewPan, mapviewClampCenter, mapviewClampZoom, mapviewLayer, type MapView,
} from "../../shared/radar.ts";
import { autoLeg } from "../../shared/autowalk.ts";
import { mapRoute } from "../src/map.ts";

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

test("Bản đồ khu vực: ô ↔ màn hình khứ hồi ở cả hai hướng; phóng quanh con trỏ giữ ô dưới con trỏ; kéo đi theo ngón tay; kẹp", () => {
  for (const mode of ["iso", "flat"] as const) {
    const v: MapView = { cx: 100, cy: 60, zoom: 3, mode };
    const s = mapviewToScreen(v, 130, 40), t = mapviewToTile(v, s.x, s.y); near(t.x, 130, `x ${mode}`, 1e-9); near(t.y, 40, `y ${mode}`, 1e-9);
    const c = mapviewToScreen(v, 100, 60); near(c.x, 0, "tâm x"); near(c.y, 0, "tâm y");
    const before = mapviewToTile(v, 70, -30), z = mapviewZoomAt(v, 2, 70, -30), after = mapviewToTile(z, 70, -30);
    near(z.zoom, 6, "zoom"); near(after.x, before.x, `ô dưới con trỏ x ${mode}`, 1e-9); near(after.y, before.y, `ô dưới con trỏ y ${mode}`, 1e-9);
    const g = mapviewToScreen(v, 120, 80), p = mapviewPan(v, 25, -10), g2 = mapviewToScreen(p, 120, 80);
    near(g2.x, g.x + 25, `kéo x ${mode}`, 1e-9); near(g2.y, g.y - 10, `kéo y ${mode}`, 1e-9);
  }
  assert.equal(mapviewZoomAt({ cx: 0, cy: 0, zoom: MAPVIEW.zoomMax, mode: "flat" }, 5, 0, 0).zoom, MAPVIEW.zoomMax);
  assert.equal(mapviewClampZoom(0.01), MAPVIEW.zoomMin);
  assert.deepEqual(mapviewClampCenter({ cx: -5, cy: 999, zoom: 3, mode: "flat" }, 255, 170), { cx: 0, cy: 170, zoom: 3, mode: "flat" });
  const up = mapviewToScreen({ cx: 0, cy: 0, zoom: 1, mode: "iso" }, -1, -1); near(up.x, 0, "iso lên x", 1e-9); assert.ok(up.y < 0, "đi lên màn hình thì lên");
});

test("Lớp lọc: loại chấm → lớp, `layer` tường minh thắng, mọi lớp trong bảng lọc đều có loại chấm hoặc là đồ rơi", () => {
  assert.equal(mapviewLayer("boss"), "beast"); assert.equal(mapviewLayer("ally"), "player"); assert.equal(mapviewLayer("poi"), "npc");
  assert.equal(mapviewLayer("quest", "drop"), "drop"); assert.equal(mapviewLayer("la"), "");
  const ids = new Set(MAPVIEW.layers.map((l) => l.id));
  for (const l of Object.values(MAPVIEW.layerOf)) assert.ok(ids.has(l), `lớp lạ ${l}`);
  for (const k of Object.keys(MAPVIEW.layerOf)) assert.ok(RADAR.levels.some((lv) => lv.id === k), `loại chấm lạ ${k}`);
  assert.ok(MAPVIEW.hitPx > 0 && MAPVIEW.dragPx > 0);
});

test("Tự đi tới cờ (R4): chặng kế tiếp theo bản đồ đứng, bản đồ đích và route", () => {
  assert.deepEqual(autoLeg("a", { map: "a", tile: true }, {}), { k: "flag" });
  assert.deepEqual(autoLeg("a", { map: "a", tile: false }, {}), { k: "arrived" });
  assert.deepEqual(autoLeg("a", { map: "c", tile: true }, { b: "b", c: "b" }), { k: "gate", to: "b" });
  assert.deepEqual(autoLeg("a", { map: "z", tile: true }, { b: "b" }), { k: "none" });
  assert.deepEqual(autoLeg("a", { map: "toString", tile: true }, {}), { k: "none" }, "không đọc thuộc tính của Object");
  assert.ok(AUTOWALK.arrive > 0 && AUTOWALK.stuckSecs > 0 && AUTOWALK.gateSecs > 0 && AUTOWALK.holdMs > 0);
});

test("Tự đi tới cờ (R4): mọi bản đồ đi bộ được đều có đường tới nhau qua cổng thật (mapRoute)", () => {
  const ids = Object.keys(MAPS).filter((id) => MAPS[id].kind !== "arena");
  for (const from of ids) {
    const r = mapRoute(from);
    for (const to of Object.keys(r)) assert.ok(Object.hasOwn(MAPS, r[to]) && r[to] !== from, `${from} → ${to}: chặng đầu ${r[to]}`);
  }
  const start = ids[0], far = Object.keys(mapRoute(start)).at(-1)!;
  assert.deepEqual(autoLeg(start, { map: far, tile: true }, mapRoute(start)), { k: "gate", to: mapRoute(start)[far] });
});
