// Kiểm thử hàm đo luồng (L0 #1658) trên lưới giả nhỏ: node --test tools/maps/lib/luong.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { gridFromRows, widths, pinches, deadEnds, behindGap, components, shortestPath, chokeRuns, widestPath, gridStats } from "./luong.mjs";

const at = (g, x, y) => y * g.MW + x;

test("bề ngang ô: khe 1 ô, hành lang 2 ô, khoảng trống 3×3", () => {
  const g = gridFromRows([
    "#########",
    "#...#...#",
    "#...#...#",
    "#...#####",
    "#########",
  ]);
  const W = widths(g);
  assert.equal(W[at(g, 1, 1)], 3);
  assert.equal(W[at(g, 3, 3)], 3);
  assert.equal(W[at(g, 5, 1)], 2); // hành lang 3×2: ô chỉ nằm trong hình vuông 2×2
  assert.equal(W[at(g, 4, 1)], 0); // ô chặn
  const g1 = gridFromRows(["#####", "#...#", "#####"]);
  assert.deepEqual([...widths(g1)].filter((w) => w), [1, 1, 1]);
});

test("kẹt chéo: hai ô chặn chéo nhau, hai ô còn lại trống", () => {
  const g = gridFromRows(["....", ".#..", "..#.", "...."]);
  assert.equal(pinches(g), 1);
  assert.equal(pinches(gridFromRows(["....", ".##.", "....", "...."])), 0); // hai ô chặn kề nhau, không phải kẹt chéo
  assert.equal(pinches(gridFromRows(["##", "##"])) , 0);
});

test("ngõ cụt: ô trống có ≥ 3 ô kề chặn", () => {
  const g = gridFromRows(["#####", "#...#", "###.#", "#####"]);
  // (3,2) kề trên trống, ba hướng còn lại chặn → ngõ cụt; (1,1) có trái + trên + dưới chặn → ngõ cụt
  assert.equal(deadEnds(g), 2);
});

test("ô sau khe: vùng rộng chỉ nối vào qua khe 1 ô", () => {
  const g = gridFromRows([
    "##############",
    "#....#.......#",
    "#....#.......#",
    "#.........|..#".replace("|", "."),
    "#....#.......#",
    "#....#.......#",
    "##############",
  ]);
  // Hai sảnh rộng nối nhau qua cửa 1 ô (hàng 3): sảnh nhỏ hơn (4×5 = 20 ô) là "sau khe" so với sảnh lớn (7×5 = 35).
  const W = widths(g);
  assert.equal(behindGap(g, W), 20);
  assert.equal(components(g), 1);
});

test("đường ngắn nhất 8 hướng không cắt góc; cổ chai và ngang tuyến rộng nhất", () => {
  const g = gridFromRows([
    "#######",
    "#.....#",
    "#.###.#",
    "#.#...#",
    "#.###.#",
    "#.....#",
    "#######",
  ]);
  const p = shortestPath(g, at(g, 1, 1), at(g, 5, 5));
  assert.ok(p && p.len > 0);
  assert.equal(p.cells[0], at(g, 1, 1));
  assert.equal(p.cells.at(-1), at(g, 5, 5));
  // đường đi không bước chéo qua góc chặn
  for (let i = 1; i < p.cells.length; i++) {
    const [x0, y0, x1, y1] = [p.cells[i - 1] % g.MW, Math.floor(p.cells[i - 1] / g.MW), p.cells[i] % g.MW, Math.floor(p.cells[i] / g.MW)];
    if (x0 !== x1 && y0 !== y1) assert.ok(!g.solid[y0 * g.MW + x1] && !g.solid[y1 * g.MW + x0]);
  }
  const W = widths(g);
  assert.equal(widestPath(g, W, at(g, 1, 1), at(g, 5, 5)), 1); // vòng ngoài toàn hành lang 1 ô
  assert.equal(chokeRuns(W, p.cells), 1); // một đoạn liền ≥ 3 ô hẹp
  assert.equal(shortestPath(gridFromRows(["..#.."]), 0, 4), null);
});

test("widestPath chọn lối rộng hơn khi có hai lối", () => {
  // Hai sảnh nối bằng cửa 2 ô (hàng 2–3) và cửa 1 ô (hàng 5, dài hơn).
  const rows = ["#########", "#..#....#", "#.......#", "#.......#", "#..#....#", "#.......#", "#########"];
  const g = gridFromRows(rows);
  const W = widths(g);
  assert.equal(W[at(g, 3, 2)], 2);
  assert.equal(W[at(g, 3, 5)], 1);
  assert.equal(widestPath(g, W, at(g, 1, 1), at(g, 7, 4)), 2);
  // Bịt cửa 2 ô thì chỉ còn lối 1 ô.
  const g2 = gridFromRows(["#########", "#..#....#", "#..#....#", "#..#....#", "#..#....#", "#.......#", "#########"]);
  assert.equal(widestPath(g2, widths(g2), at(g2, 1, 1), at(g2, 7, 4)), 1);
});

test("gridStats: số đếm khớp tay trên lưới nhỏ", () => {
  const g = gridFromRows(["####", "#..#", "#..#", "####"]);
  const s = gridStats(g);
  assert.equal(s.cells, 16); assert.equal(s.walk, 4);
  assert.equal(s.solidPct, 75);
  assert.equal(s.meanW, 2);
  assert.equal(s.narrowPct, 100);
  assert.equal(s.pinchPer1000, 0);
});
