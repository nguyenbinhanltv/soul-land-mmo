// Sinh các dãy ảnh tường theo đúng ô tường ngoài thành của bản đồ trước khi nhập.
// node tao-day-tuong.mjs <map-truoc.json> <layout.json>
import fs from "node:fs";
const [mapFile, layoutFile] = process.argv.slice(2);
if (!layoutFile) throw Error("Cần bản đồ trước và bố cục đầu ra");
const raw = JSON.parse(fs.readFileSync(mapFile, "utf8"));
const trees = raw.layers.find(l => l.name === "trees").data;
const W = raw.width, H = raw.height, rows = [];
function runs(axis, fixed, lo, hi) {
  let first = null;
  const point = v => axis === "x" ? [v, fixed] : [fixed, v];
  for (let v = lo; v <= hi + 1; v++) {
    const [x, y] = point(v), wall = v <= hi && trees[y * W + x] === 15;
    if (wall && first === null) first = v;
    if (!wall && first !== null) {
      rows.push({ type: "row", kind: `moss_wall_${axis}`, from: point(first), to: point(v - 1), step: 1 });
      first = null;
    }
  }
}
runs("x", 0, 0, W - 1); runs("x", H - 1, 0, W - 1);
runs("y", 0, 1, H - 2); runs("y", W - 1, 1, H - 2);
let text = fs.readFileSync(layoutFile, "utf8");
if (text.includes('"moss_wall_x"')) throw Error("Bố cục đã có dãy tường rêu");
text = text.replace('"practice_rack": 59', '"practice_rack": 59, "moss_wall_x": 62, "moss_wall_y": 63');
const re = /(^\s*\{ "type": "fence",[^\r\n]+,\r?\n)/m;
if (!re.test(text)) throw Error("Không thấy feature tường thành");
text = text.replace(re, "$1" + rows.map(r => "    " + JSON.stringify(r) + ",").join("\n") + "\n");
JSON.parse(text);
fs.writeFileSync(layoutFile, text);
console.log(`Đã sinh ${rows.length} dãy tường, giữ vị trí cổng và ô chặn`);
