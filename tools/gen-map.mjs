// Sinh các bản đồ Tiled khởi đầu: shared/assets/<mapId>.json cho mỗi mapId trong MAPS (shared/data.ts).
//   tinh_dau_ngoai_vi  Tinh Đấu Ngoại vi: 4 vùng 300–2.000 năm, cổng về Nặc Đinh Thành và vào Nội địa (BĐ3, mục 5.3)
//   tinh_dau_noi_dia   Tinh Đấu Nội địa: 4 vùng 1.500–25.000 năm, cổng về Ngoại vi (BĐ3; Lõi Tinh Đấu để BĐ6)
//   (bản đồ `tinh_dau` của BĐ1–BĐ2 đã tách thành hai bản đồ trên ở BĐ3)
//   thanh_hon_thon  Thánh Hồn Thôn: làng an toàn ở giữa, 3 vùng săn cấp 1–10 (BĐ2, mục 5.3, 5.8)
//   nac_dinh_thanh  Nặc Đinh Thành: thành an toàn, chỗ đứng cho NPC của 6.1 (BĐ2)
// Sau khi sinh, mở file bằng Tiled (https://www.mapeditor.org) để vẽ tiếp bằng tay.
// Chạy: node tools/gen-map.mjs [mapId…]   (không ghi mapId thì sinh tất cả)
import { writeFileSync } from "node:fs";

const T = 16;
// gid = id ô trong tileset + 1 (ô vẽ trong tools/gen-tiles.py)
const GID = {
  grass: [1, 2, 3, 4], flower: [5, 6], path: 7, pathDark: 8, water: 9, camp: 10, tent: 11, fire: 12,
  pave: 13, roof: 14, wall: 15, rice: 16, tree: [17, 18, 19, 20], canopy: [21, 22, 23, 24],
};
// id ô (không phải gid) chặn đường: nước, lều, lửa trại, mái, tường, cây
const COLLIDES = [8, 10, 11, 13, 14, 16, 17, 18, 19];

const prop = (name, type, value) => ({ name, type, value });
const rng = (seed) => { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296); };

/** Lớp object: tạo object chữ nhật / điểm theo ô (tọa độ ô, Tiled lưu theo pixel). */
function objects() {
  let oid = 1;
  const list = [];
  const rect = (type, name, x, y, w, h, props = []) =>
    list.push({ id: oid++, name, type, x: x * T, y: y * T, width: w * T, height: h * T, rotation: 0, visible: true, properties: props });
  const point = (type, name, x, y, props = []) =>
    list.push({ id: oid++, name, type, point: true, x: x * T, y: y * T, width: 0, height: 0, rotation: 0, visible: true, properties: props });
  // beasts: mã loài trong BEASTS (shared/data.ts) kèm trọng số; years: khoảng niên hạn theo bảng 5.3 (từ 3.2 server tung tuổi
  // hồn thú trong khoảng này); weights: trọng số theo bậc TIERS, chỉ dùng khi vùng thiếu `years`.
  const zone = (name, hint, x, y, w, h, weights, count, beasts, years = "") => rect("zone", name, x, y, w, h, [
    prop("hint", "string", hint), prop("weights", "string", weights.join(",")), prop("count", "int", count), prop("beasts", "string", beasts),
    ...(years ? [prop("years", "string", years)] : []),
  ]);
  // Cổng: to = mapId đích, arrive = tên điểm xuất hiện ở bản đồ đích (phải nằm ngoài mọi cổng ở đó), level = cấp đề xuất.
  const portal = (name, x, y, w, h, to, arrive, level = "") =>
    rect("portal", name, x, y, w, h, [prop("to", "string", to), prop("arrive", "string", arrive), ...(level ? [prop("level", "string", level)] : [])]);
  return { list, rect, point, zone, portal, next: () => oid };
}

function writeMap(mapId, MW, MH, ground, trees, canopy, objs, props = []) {
  const layer = (id, name, data) => ({ id, name, type: "tilelayer", data, width: MW, height: MH, opacity: 1, visible: true, x: 0, y: 0 });
  const map = {
    compressionlevel: -1, type: "map", version: "1.10", tiledversion: "1.10.2",
    orientation: "orthogonal", renderorder: "right-down", infinite: false,
    width: MW, height: MH, tilewidth: T, tileheight: T,
    nextlayerid: 5, nextobjectid: objs.next(),
    ...(props.length ? { properties: props } : {}),
    layers: [
      layer(1, "ground", ground),
      layer(2, "trees", trees),
      { id: 3, name: "zones", type: "objectgroup", draworder: "topdown", objects: objs.list, opacity: 1, visible: true, x: 0, y: 0 },
      layer(4, "canopy", canopy),
    ],
    tilesets: [{
      firstgid: 1, name: "tiles", image: "tiles.png", imagewidth: 128, imageheight: 48,
      tilewidth: T, tileheight: T, columns: 8, tilecount: 24, margin: 0, spacing: 0,
      tiles: COLLIDES.map((id) => ({ id, properties: [prop("collides", "bool", true)] })),
    }],
  };
  writeFileSync(new URL(`../shared/assets/${mapId}.json`, import.meta.url), JSON.stringify(map));
  console.log(`Đã sinh shared/assets/${mapId}.json`, MW, "x", MH);
}

/** Lưới ô logic và các hàm vẽ dùng chung. Ô logic: 0 cỏ, 1 cây, 2 nước, 3 đường, 4 hoa, 5 trại, 6 đá lát, 7 ruộng, 8 mái, 9 tường. */
function grid(MW, MH) {
  const m = new Uint8Array(MW * MH);
  const inside = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  const set = (x, y, v) => { if (inside(x, y)) m[y * MW + x] = v; };
  const get = (x, y) => (inside(x, y) ? m[y * MW + x] : 1);
  const fill = (x0, y0, w, h, v) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, v); };
  const border = () => { for (let x = 0; x < MW; x++) { set(x, 0, 1); set(x, MH - 1, 1); } for (let y = 0; y < MH; y++) { set(0, y, 1); set(MW - 1, y, 1); } };
  /** Nhà: mái `h - 1` hàng, hàng dưới cùng là tường (đều chặn đường). */
  const house = (x0, y0, w, h) => { fill(x0, y0, w, h - 1, 8); fill(x0, y0 + h - 1, w, 1, 9); };
  return { m, set, get, fill, border, house };
}

/** Đổi ô logic thành 3 lớp Tiled; `grassOf(x, y)` chọn sắc cỏ (0–3) theo vùng. */
function toLayers(MW, MH, g, grassOf) {
  const ground = new Array(MW * MH).fill(0), trees = new Array(MW * MH).fill(0), canopy = new Array(MW * MH).fill(0);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x, t = g.m[i], z = grassOf(x, y);
    ground[i] = t === 2 ? GID.water : t === 3 ? GID.path : t === 5 ? GID.camp : t === 4 ? GID.flower[Math.min(z, 1)]
      : t === 6 ? GID.pave : t === 7 ? GID.rice : GID.grass[z];
    if (t === 1) { trees[i] = GID.tree[z]; if (y > 0) canopy[i - MW] = GID.canopy[z]; }
    if (t === 8) trees[i] = GID.roof;
    if (t === 9) trees[i] = GID.wall;
  }
  return { ground, trees, canopy };
}

// ---------- Tinh Đấu Đại Sâm Lâm: Ngoại vi và Nội địa (BĐ3, mục 5.3) ----------
/**
 * Rừng 90×60 ô chia 4 vùng theo chiều đông (càng sâu càng rậm, càng tối), trại cổng ở mép tây (điểm hồi sinh, cổng về bản đồ
 * trước), đường mòn đông–tây nối trại với mép đông. `spec`: seed, `shade` (sắc cỏ / cây 0–3 theo vùng), `dens` (mật độ cây theo
 * vùng), `feature(g, r)` vẽ thêm nét riêng (suối, đầm, thung lũng…) trước khi mở đường mòn và trại, `east(g)` vẽ mép đông sau cùng.
 */
const FOREST = { MW: 90, MH: 60, xs: [9, 22, 45, 68, 89], camp: { x: 3, y: 25, w: 6, h: 11 }, pathY: 30 };
function forest(spec) {
  const { MW, MH, xs } = FOREST, r = rng(spec.seed), g = grid(MW, MH);
  const zoneOf = (x) => { const i = xs.findIndex((x1) => x < x1); return i < 0 ? xs.length - 2 : Math.max(0, i - 1); };
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const z = zoneOf(x);
    if (r() < spec.dens[z]) g.set(x, y, 1); else if (spec.shade[z] < 2 && r() < 0.05) g.set(x, y, 4);
  }
  // Bụi cây lớn, vùng càng sâu càng to.
  for (let i = 0; i < 70; i++) {
    const cx = (r() * MW) | 0, cy = (r() * MH) | 0, rad = 1 + r() * (1 + zoneOf(cx));
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (Math.hypot(x, y) < rad && r() < 0.65) g.set(cx + x, cy + y, 1);
  }
  spec.feature?.(g, r);
  // Đường mòn đông–tây (uốn lượn, về lại hàng pathY ở hai đầu để nối cổng) và 4 lối bắc–nam; trại cổng ở mép tây.
  let py = FOREST.pathY;
  for (let x = 1; x < MW - 1; x++) {
    g.set(x, py, 3); g.set(x, py + 1, 3);
    if (x >= MW - 14) py += Math.sign(FOREST.pathY - py);
    else if (x > 10 && r() < 0.3) py = Math.max(8, Math.min(MH - 10, py + (r() < 0.5 ? -1 : 1)));
  }
  for (const x0 of [14, 33, 55, 76]) { let x = x0; for (let y = 2; y < MH - 2; y++) { g.set(x, y, 3); g.set(x + 1, y, 3); if (r() < 0.25) x += r() < 0.5 ? -1 : 1; } }
  g.fill(1, FOREST.camp.y, 8, FOREST.camp.h, 5);
  spec.east?.(g);
  g.border();
  const { ground, trees, canopy } = toLayers(MW, MH, g, (x) => spec.shade[zoneOf(x)]);
  // Đường mòn ở vùng tối nhất dùng ô đường tối.
  for (let i = 0; i < MW * MH; i++) if (g.m[i] === 3 && spec.shade[zoneOf(i % MW)] >= 3) ground[i] = GID.pathDark;
  trees[27 * MW + 2] = GID.tent;
  trees[30 * MW + 4] = GID.fire;
  return { MW, MH, ground, trees, canopy, o: objects() };
}
/** Vùng thứ i của rừng (cột FOREST.xs[i]..xs[i+1], cả chiều cao). Vùng khai báo `years` nên `weights` không dùng. */
const forestZone = (o, i, name, hint, count, beasts, years) =>
  o.zone(name, hint, FOREST.xs[i], 0, FOREST.xs[i + 1] - FOREST.xs[i], FOREST.MH, [1], count, beasts, years);

// Ngoại vi (cấp 10–30, 300–2.000 năm): trại cổng phía tây về Nặc Đinh Thành, cổng phía đông vào Nội địa.
function tinhDauNgoaiVi() {
  const { MW, MH } = FOREST;
  const { ground, trees, canopy, o } = forest({
    seed: 20261019, shade: [0, 1, 1, 2], dens: [0.05, 0.09, 0.11, 0.15],
    feature(g, r) {
      // Ao nhỏ rải rác ở Bìa rừng và Rừng thưa, và con suối chảy bắc–nam qua vùng Khe suối.
      for (let i = 0; i < 8; i++) {
        const cx = 12 + r() * 30, cy = 4 + r() * (MH - 8), rad = 1.4 + r() * 2;
        for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (Math.hypot(x, y) < rad) g.set(Math.round(cx + x), Math.round(cy + y), 2);
      }
      let sx = 56;
      for (let y = 0; y < MH; y++) { for (let k = 0; k < 3; k++) g.set(sx + k, y, 2); if (r() < 0.35) sx = Math.max(50, Math.min(62, sx + (r() < 0.5 ? -1 : 1))); }
    },
    // Khoảng trống quanh cổng phía đông (trạm gác Rìa nội địa) để đứng niệm cổng và xuất hiện.
    east(g) { g.fill(MW - 10, 26, 9, 10, 0); g.fill(MW - 10, 30, 9, 2, 3); },
  });
  forestZone(o, 0, "Bìa rừng", "Hồn thú 300 – 700 năm", 14, "phong_lang:2,man_da_la_xa:1,tu_van_bao:1", "300-700");
  forestZone(o, 1, "Rừng thưa", "Hồn thú 600 – 1.200 năm", 12, "man_da_la_xa:1,quy_dang:1,loi_van_hau:1", "600-1200");
  forestZone(o, 2, "Khe suối", "Hồn thú 1.000 – 1.600 năm", 10, "quy_ho:1,thanh_lan_ngac:1,kim_linh_ung:1", "1000-1600");
  forestZone(o, 3, "Rìa nội địa", "Cẩn thận: hồn thú 1.400 – 2.000 năm", 9, "nhan_dien_ma_chu_non:1,liet_trao_hung:1,thiet_giap_te_nguu:1", "1400-2000");
  // Trại cổng (điểm hồi sinh) bắt đầu từ cột 3 để không ai hồi sinh ngay trong cổng ở mép tây.
  const c = FOREST.camp;
  o.rect("spawn", "Trại cổng Ngoại vi", c.x, c.y, c.w, c.h);
  o.portal("Về Nặc Đinh Thành", 1, 29, 2, 4, "nac_dinh_thanh", "tu_tinh_dau_ngoai_vi");
  o.point("arrive", "tu_nac_dinh_thanh", 5.5, 31.5);
  o.portal("Vào Tinh Đấu Nội địa", MW - 3, 28, 2, 6, "tinh_dau_noi_dia", "tu_tinh_dau_ngoai_vi", "30-60");
  o.point("arrive", "tu_tinh_dau_noi_dia", MW - 6.5, 31);
  writeMap("tinh_dau_ngoai_vi", MW, MH, ground, trees, canopy, o, [prop("vignette", "float", 0)]);
}

// Nội địa (cấp 30–60, 1.500–25.000 năm): trại cổng phía tây về Ngoại vi. Cuối Hắc Ám Lâm là bờ hồ trung tâm; cổng đi Lõi
// Tinh Đấu (`loi_tinh_dau`, BĐ6) chưa đặt vì bản đồ đó chưa có trong MAPS (cổng tới bản đồ chưa có thì không hiện, mục 5.3).
function tinhDauNoiDia() {
  const { MW, MH } = FOREST;
  const { ground, trees, canopy, o } = forest({
    seed: 30111, shade: [2, 2, 3, 3], dens: [0.09, 0.08, 0.12, 0.17],
    feature(g, r) {
      // Đầm sương độc: nhiều vũng nước nối nhau.
      for (let i = 0; i < 16; i++) {
        const cx = 24 + r() * 19, cy = 3 + r() * (MH - 6), rad = 1.3 + r() * 2.4;
        for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (Math.hypot(x, y) < rad * (0.8 + r() * 0.35)) g.set(Math.round(cx + x), Math.round(cy + y), 2);
      }
      // Lôi Cốc: vách cây dày phía bắc và phía nam, lòng thung lũng ở giữa thưa cây.
      for (let x = 45; x < 68; x++) for (let y = 0; y < MH; y++) {
        const wall = y < 14 + Math.round(3 * Math.sin(x / 3)) || y > MH - 15 + Math.round(3 * Math.cos(x / 4));
        if (wall && r() < 0.6) g.set(x, y, 1);
      }
    },
    // Bờ hồ trung tâm (Lõi Tinh Đấu, BĐ6) ở mép đông, cuối đường mòn.
    east(g) { for (let y = 18; y < 43; y++) for (let x = MW - 9; x < MW - 1; x++) if (Math.hypot((x - (MW - 1)) * 1.6, y - 30.5) < 12) g.set(x, y, 2); },
  });
  forestZone(o, 0, "Rừng cổ thụ", "Hồn thú 1.500 – 5.000 năm", 12, "nhan_dien_ma_chu:1,u_minh_lang:1,quy_dang:1", "1500-5000");
  forestZone(o, 1, "Đầm sương độc", "Hồn thú 4.000 – 12.000 năm", 10, "that_tinh_doc_thiem:1,xich_lan_mang:1,hac_vu_bien_buc:1", "4000-12000");
  forestZone(o, 2, "Lôi Cốc", "Hồn thú 10.000 – 18.000 năm", 9, "lam_loi_te_nguu:1,loi_duc_ung:1", "10000-18000");
  forestZone(o, 3, "Hắc Ám Lâm", "Cẩn thận: hồn thú 15.000 – 25.000 năm", 8, "am_kim_khung_trao_hung:1,kiem_vi_hat:1,quy_anh_bao:1", "15000-25000");
  const c = FOREST.camp;
  o.rect("spawn", "Trại cổng Nội địa", c.x, c.y, c.w, c.h);
  o.portal("Về Tinh Đấu Ngoại vi", 1, 29, 2, 4, "tinh_dau_ngoai_vi", "tu_tinh_dau_noi_dia", "10-30");
  o.point("arrive", "tu_tinh_dau_ngoai_vi", 5.5, 31.5);
  writeMap("tinh_dau_noi_dia", MW, MH, ground, trees, canopy, o, [prop("vignette", "float", 0.35)]);
}

// ---------- Thánh Hồn Thôn (mục 5.3, 5.8) ----------
function thanhHonThon() {
  const MW = 72, MH = 54, r = rng(5031);
  const g = grid(MW, MH);
  // Làng (vùng safe) ở giữa; Hậu Sơn phía bắc, Đồng lúa phía tây và phía nam, Bãi tập phía đông.
  const V = { x: 27, y: 20, w: 18, h: 14 };
  const inVillage = (x, y) => x >= V.x && x < V.x + V.w && y >= V.y && y < V.y + V.h;
  const area = (x, y) => (inVillage(x, y) ? "village" : y < V.y && x >= V.x && x < V.x + V.w ? "hill" : x >= V.x + V.w ? "field" : "rice");
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const a = area(x, y);
    if (a === "village") continue;
    const dens = { hill: 0.16, field: 0.05, rice: 0.03 }[a];
    if (r() < dens) g.set(x, y, 1); else if (a !== "hill" && r() < 0.04) g.set(x, y, 4);
  }
  // Ruộng lúa ở Đồng lúa (tây và nam), xen bờ cỏ.
  for (let i = 0; i < 16; i++) {
    const x0 = 2 + ((r() * 22) | 0), y0 = 2 + ((r() * 48) | 0), w = 3 + ((r() * 4) | 0), h = 2 + ((r() * 3) | 0);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (area(x, y) === "rice") g.set(x, y, 7);
  }
  for (let i = 0; i < 6; i++) {
    const x0 = V.x + 1 + ((r() * 14) | 0), y0 = V.y + V.h + 3 + ((r() * 12) | 0), w = 3 + ((r() * 3) | 0), h = 2 + ((r() * 2) | 0);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (area(x, y) === "rice" && Math.abs(x - 36) > 2) g.set(x, y, 7);
  }
  // Ao nước ở Bãi tập và đồi sau làng.
  for (const [cx, cy, rad] of [[58, 12, 2.6], [52, 42, 2.2], [31, 8, 1.8], [12, 44, 2]])
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (Math.hypot(x, y) < rad) g.set(cx + x, cy + y, 2);
  // Làng: hàng cây quanh làng chừa 4 lối ra, nhà dọc mép làng, quảng trường ở giữa.
  for (let x = V.x - 1; x <= V.x + V.w; x++) { g.set(x, V.y - 1, 1); g.set(x, V.y + V.h, 1); }
  for (let y = V.y - 1; y <= V.y + V.h; y++) { g.set(V.x - 1, y, 1); g.set(V.x + V.w, y, 1); }
  g.fill(V.x, V.y, V.w, V.h, 0);
  g.house(V.x + 1, V.y + 1, 5, 4);   // nhà trưởng thôn
  g.house(V.x + 12, V.y + 1, 5, 4);  // phân điện Vũ Hồn Điện
  g.house(V.x + 1, V.y + 9, 4, 3);
  g.house(V.x + 13, V.y + 9, 4, 3);
  g.fill(V.x + 6, V.y + 5, 6, 4, 5); // quảng trường
  // Đường: bắc–nam qua làng tới cổng đi Nặc Đinh Thành ở mép nam; đông–tây qua quảng trường.
  for (let y = 2; y < MH - 1; y++) { g.set(35, y, 3); g.set(36, y, 3); g.set(37, y, 3); }
  for (let x = 2; x < MW - 2; x++) { g.set(x, 27, 3); g.set(x, 28, 3); }
  g.fill(V.x + 6, V.y + 5, 6, 4, 5);
  g.border();

  const grassOf = (x, y) => ({ village: 0, rice: 0, field: 1, hill: 2 }[area(x, y)]);
  const { ground, trees, canopy } = toLayers(MW, MH, g, grassOf);
  const o = objects();
  o.zone("Đồng lúa ven làng", "Hồn thú 10 – 100 năm", 1, 1, V.x - 2, MH - 2, [1, 0, 0, 0, 0], 12, "nhu_cot_tho_hoang:2,dien_thu:2,hoi_vu_tuoc:1", "10-100");
  o.zone("Đồng lúa ven làng", "Hồn thú 10 – 100 năm", V.x - 1, V.y + V.h + 1, V.w + 2, MH - V.y - V.h - 2, [1, 0, 0, 0, 0], 5, "nhu_cot_tho_hoang:2,dien_thu:2,hoi_vu_tuoc:1", "10-100");
  o.zone("Bãi tập hồn sư", "Hồn thú 80 – 250 năm", V.x + V.w + 1, 1, MW - V.x - V.w - 2, MH - 2, [0.6, 0.4, 0, 0, 0], 12,
    "phong_lang_con:2,doc_cham_phong:1,thiet_giap_xuyen_son_giap:2", "80-250");
  o.zone("Hậu Sơn", "Hồn thú 200 – 450 năm", V.x - 1, 1, V.w + 2, V.y - 2, [0, 1, 0, 0, 0], 8, "hac_boi_da_tru:1,thanh_lan_xa:1,quy_dang_non:1", "200-450");
  o.rect("safe", "Thánh Hồn Thôn", V.x - 1, V.y - 1, V.w + 2, V.h + 2);
  o.rect("spawn", "Quảng trường làng", V.x + 6, V.y + 5, 6, 4);
  o.portal("Đi Nặc Đinh Thành", 35, MH - 3, 3, 2, "nac_dinh_thanh", "tu_thanh_hon_thon");
  o.point("arrive", "tu_nac_dinh_thanh", 36.5, MH - 6);
  o.point("npc", "Lão Kiệt Khắc", V.x + 3.5, V.y + 5.5, [prop("npc", "string", "lao_kiet_khac")]);
  o.point("npc", "Tố Vân Đào", V.x + 14.5, V.y + 5.5, [prop("npc", "string", "to_van_dao")]);
  writeMap("thanh_hon_thon", MW, MH, ground, trees, canopy, o);
}

// ---------- Nặc Đinh Thành (mục 5.8): thành an toàn, chưa có NPC hoạt động (bước 6.1) ----------
function nacDinhThanh() {
  const MW = 60, MH = 40, r = rng(7707);
  const g = grid(MW, MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (r() < 0.04) g.set(x, y, 4);
  // Tường thành (chặn đường) với cổng tây và cổng đông trên đại lộ.
  for (let x = 0; x < MW; x++) { g.set(x, 0, 9); g.set(x, MH - 1, 9); }
  for (let y = 0; y < MH; y++) { g.set(0, y, 9); g.set(MW - 1, y, 9); }
  // Đại lộ đông–tây (hàng 18–22) và đường bắc–nam (cột 28–31), lát đá.
  g.fill(1, 18, MW - 2, 5, 6);
  g.fill(28, 1, 4, MH - 2, 6);
  g.fill(24, 15, 12, 11, 6); // quảng trường
  // Nhà: Học viện Nặc Đinh (tây bắc), lò rèn (đông bắc), cửa hàng (tây nam), lối vào tạm Đại Đấu Hồn Trường (đông nam).
  g.house(4, 4, 14, 8); g.house(38, 5, 10, 7); g.house(5, 27, 9, 6); g.house(40, 27, 12, 7);
  // Hàng cây trang trí ven đường, rồi lối đi lát đá từ cửa mỗi nhà ra đại lộ.
  for (let x = 3; x < MW - 3; x += 4) if (x < 23 || x > 36) { g.set(x, 16, 1); g.set(x, 24, 1); }
  g.fill(10, 12, 2, 6, 6); g.fill(42, 12, 2, 6, 6); g.fill(8, 23, 2, 4, 6); g.fill(45, 23, 2, 4, 6);
  g.set(0, 19, 6); g.set(0, 20, 6); g.set(0, 21, 6); g.set(MW - 1, 19, 6); g.set(MW - 1, 20, 6); g.set(MW - 1, 21, 6);

  const { ground, trees, canopy } = toLayers(MW, MH, g, () => 0);
  // Cổng phủ cả cột cổng thành ở mép bản đồ (ô lát đá, đi vào được) để không đứng lọt ra ngoài cổng.
  const o = objects();
  o.rect("spawn", "Quảng trường Nặc Đinh", 26, 17, 8, 7);
  o.portal("Về Thánh Hồn Thôn", 0, 18, 3, 5, "thanh_hon_thon", "tu_nac_dinh_thanh", "1-10");
  o.portal("Đi Tinh Đấu Ngoại vi", MW - 3, 18, 3, 5, "tinh_dau_ngoai_vi", "tu_nac_dinh_thanh", "10-30");
  o.point("arrive", "tu_thanh_hon_thon", 5.5, 20.5);
  o.point("arrive", "tu_tinh_dau_ngoai_vi", MW - 5.5, 20.5);
  o.point("npc", "Ngọc Tiểu Cương (Đại Sư)", 11, 13, [prop("npc", "string", "dai_su")]);
  o.point("npc", "Thợ rèn", 43, 13, [prop("npc", "string", "lo_ren")]);
  o.point("npc", "Thương nhân", 9, 24, [prop("npc", "string", "thuong_nhan")]);
  o.point("npc", "Đại Đấu Hồn Trường (sắp mở)", 46, 24, [prop("npc", "string", "dau_hon_truong")]);
  writeMap("nac_dinh_thanh", MW, MH, ground, trees, canopy, o);
}

const GEN = { thanh_hon_thon: thanhHonThon, nac_dinh_thanh: nacDinhThanh, tinh_dau_ngoai_vi: tinhDauNgoaiVi, tinh_dau_noi_dia: tinhDauNoiDia };
const want = process.argv.slice(2);
for (const id of want.length ? want : Object.keys(GEN)) {
  if (!GEN[id]) { console.error("Không có bản đồ:", id); process.exit(1); }
  GEN[id]();
}
