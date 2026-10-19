// Sinh các bản đồ Tiled khởi đầu: shared/assets/<mapId>.json cho mỗi mapId trong MAPS (shared/data.ts).
//   tinh_dau        Tinh Đấu Đại Sâm Lâm (BĐ1; BĐ2 thêm cổng về Nặc Đinh Thành)
//   thanh_hon_thon  Thánh Hồn Thôn: làng an toàn ở giữa, 3 vùng săn cấp 1–10 (BĐ2, mục 5.3, 5.8)
//   nac_dinh_thanh  Nặc Đinh Thành: thành an toàn, chỗ đứng cho NPC của 6.1 (BĐ2)
// Sau khi sinh, mở file bằng Tiled (https://www.mapeditor.org) để vẽ tiếp bằng tay.
// Chạy: node tools/gen-map.mjs [mapId…]   (không ghi mapId thì sinh cả ba)
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

// ---------- Tinh Đấu Đại Sâm Lâm (giữ nguyên ô của BĐ1; BĐ2 chỉ thêm cổng, điểm xuất hiện và thu hẹp doanh trại) ----------
function tinhDau() {
  const MW = 90, MH = 60;
  const zoneOf = (x) => (x < 22 ? 0 : x < 45 ? 1 : x < 68 ? 2 : 3);
  const r = rng(20261019);
  // ô logic: 0 cỏ, 1 cây, 2 nước, 3 đường, 4 hoa, 5 trại
  const m = new Uint8Array(MW * MH);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MW && y < MH) m[y * MW + x] = v; };
  const dens = [0.05, 0.09, 0.13, 0.17];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const z = zoneOf(x);
    if (r() < dens[z]) set(x, y, 1); else if (z < 2 && r() < 0.05) set(x, y, 4);
  }
  for (let i = 0; i < 70; i++) {
    const cx = (r() * MW) | 0, cy = (r() * MH) | 0, rad = 1 + r() * (1 + zoneOf(cx));
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (Math.hypot(x, y) < rad && r() < 0.65) set(cx + x, cy + y, 1);
  }
  for (let i = 0; i < 13; i++) {
    const cx = 10 + r() * (MW - 14), cy = 4 + r() * (MH - 8), rad = 1.6 + r() * 2.6;
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++)
      if (Math.hypot(x, y) < rad * (0.8 + r() * 0.35)) set(Math.round(cx + x), Math.round(cy + y), 2);
  }
  let py = 30;
  for (let x = 1; x < MW - 1; x++) { set(x, py, 3); set(x, py + 1, 3); if (r() < 0.3) py = Math.max(6, Math.min(MH - 8, py + (r() < 0.5 ? -1 : 1))); }
  for (const x0 of [14, 33, 55, 76]) { let x = x0; for (let y = 2; y < MH - 2; y++) { set(x, y, 3); set(x + 1, y, 3); if (r() < 0.25) x += r() < 0.5 ? -1 : 1; } }
  for (let y = 25; y <= 35; y++) for (let x = 1; x <= 8; x++) set(x, y, 5);
  for (let x = 0; x < MW; x++) { set(x, 0, 1); set(x, MH - 1, 1); }
  for (let y = 0; y < MH; y++) { set(0, y, 1); set(MW - 1, y, 1); }

  const ground = new Array(MW * MH).fill(0), trees = new Array(MW * MH).fill(0), canopy = new Array(MW * MH).fill(0);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x, t = m[i], z = zoneOf(x);
    ground[i] = t === 2 ? GID.water : t === 3 ? (z >= 3 ? GID.pathDark : GID.path) : t === 5 ? GID.camp : t === 4 ? GID.flower[Math.min(z, 1)] : GID.grass[z];
    if (t === 1) { trees[i] = GID.tree[z]; if (y > 0) canopy[i - MW] = GID.canopy[z]; }
  }
  trees[27 * MW + 2] = GID.tent;
  trees[30 * MW + 4] = GID.fire;

  const o = objects();
  o.zone("Bìa rừng", "Hồn thú 300 – 700 năm", 9, 0, 13, MH, [0.85, 0.15, 0, 0, 0], 14, "phong_lang:2,man_da_la_xa:1,tu_van_bao:1", "300-700");
  o.zone("Rừng thưa", "Hồn thú 600 – 1.200 năm", 22, 0, 23, MH, [0.2, 0.65, 0.15, 0, 0], 12, "man_da_la_xa:1,quy_dang:1,loi_van_hau:1,quy_ho:1", "600-1200");
  o.zone("Rừng cổ thụ", "Hồn thú 1.500 – 5.000 năm", 45, 0, 23, MH, [0, 0.25, 0.6, 0.15, 0], 10, "quy_dang:1,nhan_dien_ma_chu:1,u_minh_lang:1,kiem_vi_hat:1", "1500-5000");
  o.zone("Hắc Ám Lâm", "Cẩn thận: hồn thú 15.000 – 25.000 năm", 68, 0, 21, MH, [0, 0, 0.35, 0.63, 0.02], 9, "u_minh_lang:1,am_kim_khung_trao_hung:1,kiem_vi_hat:1,quy_anh_bao:1,xich_lan_mang:1", "15000-25000");
  // Doanh trại = trại cổng của Tinh Đấu (mục 5.8). Cổng về Nặc Đinh Thành ở mép tây, trên đường mòn; doanh trại (điểm hồi sinh)
  // bắt đầu từ cột 3 để không ai hồi sinh ngay trong cổng.
  o.rect("spawn", "Doanh trại", 3, 25, 6, 11);
  o.portal("Về Nặc Đinh Thành", 1, 29, 2, 4, "nac_dinh_thanh", "tu_tinh_dau");
  o.point("arrive", "tu_nac_dinh_thanh", 5.5, 31.5);
  writeMap("tinh_dau", MW, MH, ground, trees, canopy, o, [prop("vignette", "bool", true)]);
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
  o.portal("Đi Tinh Đấu Đại Sâm Lâm", MW - 3, 18, 3, 5, "tinh_dau", "tu_nac_dinh_thanh", "10-60");
  o.point("arrive", "tu_thanh_hon_thon", 5.5, 20.5);
  o.point("arrive", "tu_tinh_dau", MW - 5.5, 20.5);
  o.point("npc", "Ngọc Tiểu Cương (Đại Sư)", 11, 13, [prop("npc", "string", "dai_su")]);
  o.point("npc", "Thợ rèn", 43, 13, [prop("npc", "string", "lo_ren")]);
  o.point("npc", "Thương nhân", 9, 24, [prop("npc", "string", "thuong_nhan")]);
  o.point("npc", "Đại Đấu Hồn Trường (sắp mở)", 46, 24, [prop("npc", "string", "dau_hon_truong")]);
  writeMap("nac_dinh_thanh", MW, MH, ground, trees, canopy, o);
}

const GEN = { tinh_dau: tinhDau, thanh_hon_thon: thanhHonThon, nac_dinh_thanh: nacDinhThanh };
const want = process.argv.slice(2);
for (const id of want.length ? want : Object.keys(GEN)) {
  if (!GEN[id]) { console.error("Không có bản đồ:", id); process.exit(1); }
  GEN[id]();
}
