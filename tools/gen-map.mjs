// Sinh các bản đồ Tiled khởi đầu: shared/assets/<mapId>.json cho mỗi mapId trong MAPS (shared/data.ts).
//   tinh_dau_ngoai_vi  Tinh Đấu Ngoại vi: 4 vùng 300–2.000 năm, cổng về Nặc Đinh Thành và vào Nội địa (BĐ3, mục 5.3)
//   tinh_dau_noi_dia   Tinh Đấu Nội địa: 4 vùng 1.500–25.000 năm, cổng về Ngoại vi (BĐ3; Lõi Tinh Đấu để BĐ6)
//   lac_nhat_sam_lam   Lạc Nhật Sâm Lâm: 4 vùng 5.000–30.000 năm (thực vật / độc), suối Băng Hỏa Lưỡng Nghi Nhãn, cổng về Thiên Đấu Thành (BĐ6b)
//   hai_than_dao       Hải Thần Đảo / Ma Quỷ Hải Vực: đảo và rạn biển, 4 vùng 50.000–100.000 năm, bến thuyền về Thiên Đấu Thành (BĐ6d)
//   (bản đồ `tinh_dau` của BĐ1–BĐ2 đã tách thành hai bản đồ trên ở BĐ3)
//   thanh_hon_thon  Thánh Hồn Thôn: làng an toàn ở giữa, 3 vùng săn cấp 1–10 (BĐ2, mục 5.3, 5.8)
//   Mỗi vùng săn có 1 object `elite` (tinh anh, BĐ4, mục 5.4); Ngoại vi và Nội địa có 1 object `boss` (hang thú vương, BĐ5).
//   nac_dinh_thanh  Nặc Đinh Thành: thành an toàn, NPC Đại Sư, thương nhân, lò rèn (BĐ2; hoạt động từ 6.1); cổng bắc đi Thiên Đấu Thành (BĐ6a)
//   thien_dau_thanh  Thiên Đấu Thành: thủ đô, thành an toàn lớn; Đại Đấu Hồn Trường, Sử Lai Khắc Học Viện, thương nhân, lò rèn;
//                    cổng tây đi Lạc Nhật (mở từ BĐ6b), bến thuyền đi Hải Thần Đảo (mở từ BĐ6d); cổng bắc (Cực Bắc) chưa mở (BĐ6a, mục 5.3, 5.8)
//   dai_dau_hon_truong  sân Đại Đấu Hồn Trường: sân lát đá vây tường và khán đài, không cổng, không hồn thú (bước 7.2, mục 5.9)
// Sau khi sinh, mở file bằng Tiled (https://www.mapeditor.org) để vẽ tiếp bằng tay.
// Chạy: node tools/gen-map.mjs [mapId…]   (không ghi mapId thì sinh tất cả)
import { writeFileSync } from "node:fs";

const T = 16;
// gid = id ô trong tileset + 1 (ô vẽ trong tools/gen-tiles.py)
const GID = {
  grass: [1, 2, 3, 4], flower: [5, 6], path: 7, pathDark: 8, water: 9, camp: 10, tent: 11, fire: 12,
  pave: 13, roof: 14, wall: 15, rice: 16, tree: [17, 18, 19, 20], canopy: [21, 22, 23, 24],
  // BĐ6d (hàng 4 của tileset): cát, rạn nông (nước cạn có san hô, đi được), biển sâu, đá ngầm. Ô mới của bản đồ khác dùng gid 29 trở đi.
  sand: 25, shallow: 26, deep: 27, reef: 28,
};
// id ô (không phải gid) chặn đường: nước, lều, lửa trại, mái, tường, cây; biển sâu, đá ngầm (BĐ6d)
const COLLIDES = [8, 10, 11, 13, 14, 16, 17, 18, 19, 26, 27];
const TILE_ROWS = 4; // số hàng của tiles.png (tools/gen-tiles.py), 8 ô mỗi hàng

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
  // Cổng: to = mapId đích, arrive = tên điểm xuất hiện ở bản đồ đích (phải nằm ngoài mọi cổng ở đó), level = cấp đề xuất;
  // boat (BĐ6d) = bến thuyền (đi thuyền BOAT_CAST giây thay cho TRAVEL_CAST).
  const portal = (name, x, y, w, h, to, arrive, level = "", boat = false) =>
    rect("portal", name, x, y, w, h, [prop("to", "string", to), prop("arrive", "string", arrive), ...(level ? [prop("level", "string", level)] : []),
      ...(boat ? [prop("boat", "bool", true)] : [])]);
  // Tinh anh (BĐ4, mục 5.4): boss = mã trong BOSSES (shared/data.ts); chữ nhật nằm trong vùng, xa trại cổng / cổng (SPAWN_CLEAR).
  const elite = (name, boss, x, y, w, h) => rect("elite", name, x, y, w, h, [prop("boss", "string", boss)]);
  // Hang tà hóa thú vương (BĐ5, mục 5.4, 6): boss = mã thú vương trong BOSSES (MAPS.king); chữ nhật là hang, cũng là bán kính giao chiến.
  const boss = (name, id, x, y, w, h) => rect("boss", name, x, y, w, h, [prop("boss", "string", id)]);
  return { list, rect, point, zone, portal, elite, boss, next: () => oid };
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
      firstgid: 1, name: "tiles", image: "tiles.png", imagewidth: 128, imageheight: TILE_ROWS * T,
      tilewidth: T, tileheight: T, columns: 8, tilecount: 8 * TILE_ROWS, margin: 0, spacing: 0,
      tiles: COLLIDES.map((id) => ({ id, properties: [prop("collides", "bool", true)] })),
    }],
  };
  writeFileSync(new URL(`../shared/assets/${mapId}.json`, import.meta.url), JSON.stringify(map));
  console.log(`Đã sinh shared/assets/${mapId}.json`, MW, "x", MH);
}

/**
 * Lưới ô logic và các hàm vẽ dùng chung. Ô logic: 0 cỏ, 1 cây, 2 nước, 3 đường, 4 hoa, 5 trại, 6 đá lát, 7 ruộng, 8 mái, 9 tường;
 * BĐ6d: 10 cát, 11 rạn nông (đi được), 12 biển sâu (chặn), 13 đá ngầm trên cát (chặn).
 */
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

/**
 * Hang thú vương (BĐ5): bãi trống hình bầu dục tâm (cx, cy), bán trục rx × ry ô, vây bằng một vòng cây dày, chừa lối vào rộng 4 ô
 * ở phía bắc (nối lối mòn bắc–nam). Không dùng số ngẫu nhiên để phần còn lại của bản đồ giữ nguyên khi thêm hang.
 */
function lairGround(g, cx, cy, rx, ry) {
  for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y++) for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
    const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
    if (d < 1) g.set(x, y, 0);
    else if (d < 1.3 && !(y < cy && Math.abs(x - cx) < 2.5)) g.set(x, y, 1);
  }
}

/** Đổi ô logic thành 3 lớp Tiled; `grassOf(x, y)` chọn sắc cỏ (0–3) theo vùng. */
function toLayers(MW, MH, g, grassOf) {
  const ground = new Array(MW * MH).fill(0), trees = new Array(MW * MH).fill(0), canopy = new Array(MW * MH).fill(0);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x, t = g.m[i], z = grassOf(x, y);
    ground[i] = t === 2 ? GID.water : t === 3 ? GID.path : t === 5 ? GID.camp : t === 4 ? GID.flower[Math.min(z, 1)]
      : t === 6 ? GID.pave : t === 7 ? GID.rice : t === 10 || t === 13 ? GID.sand : t === 11 ? GID.shallow : t === 12 ? GID.deep : GID.grass[z];
    if (t === 13) trees[i] = GID.reef;
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
/**
 * Hang thú vương của Ngoại vi và Nội địa (BĐ5): cùng chỗ ở vùng sâu nhất, phía đông nam, ngoài SPAWN_CLEAR của cổng đông (Ngoại vi) và
 * xa tinh anh phía bắc. Object `boss` phủ đúng bãi trống bên trong vòng cây.
 */
const LAIR = { cx: 77, cy: 51, rx: 7, ry: 5 };
const lairObj = (o, name, id) => o.boss(name, id, LAIR.cx - LAIR.rx, LAIR.cy - LAIR.ry, LAIR.rx * 2, LAIR.ry * 2);
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
    // Khoảng trống quanh cổng phía đông (trạm gác Rìa nội địa) để đứng niệm cổng và xuất hiện; hang Huyết Nguyệt Lang Vương phía đông nam.
    east(g) { g.fill(MW - 10, 26, 9, 10, 0); g.fill(MW - 10, 30, 9, 2, 3); lairGround(g, LAIR.cx, LAIR.cy, LAIR.rx, LAIR.ry); },
  });
  forestZone(o, 0, "Bìa rừng", "Hồn thú 300 – 700 năm", 14, "phong_lang:2,man_da_la_xa:1,tu_van_bao:1", "300-700");
  forestZone(o, 1, "Rừng thưa", "Hồn thú 600 – 1.200 năm", 12, "man_da_la_xa:1,quy_dang:1,loi_van_hau:1", "600-1200");
  forestZone(o, 2, "Khe suối", "Hồn thú 1.000 – 1.600 năm", 10, "quy_ho:1,thanh_lan_ngac:1,kim_linh_ung:1", "1000-1600");
  forestZone(o, 3, "Rìa nội địa", "Cẩn thận: hồn thú 1.400 – 2.000 năm", 9, "nhan_dien_ma_chu_non:1,liet_trao_hung:1,thiet_giap_te_nguu:1", "1400-2000");
  o.elite("Huyết Nhãn Phong Lang", "huyet_nhan_phong_lang", 12, 6, 8, 6);
  o.elite("Huyết Gai Quỷ Đằng", "huyet_gai_quy_dang", 30, 10, 8, 6);
  o.elite("Hắc Sát Quỷ Hổ", "hac_sat_quy_ho", 46, 44, 6, 8);
  o.elite("Ảnh Trảo Linh Miêu", "anh_trao_linh_mieu", 72, 8, 8, 6);
  lairObj(o, "Hang Huyết Nguyệt", "huyet_nguyet_lang_vuong");
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
    // Hang Thiên Độc Chu Hoàng ở phía đông nam Hắc Ám Lâm.
    east(g) {
      for (let y = 18; y < 43; y++) for (let x = MW - 9; x < MW - 1; x++) if (Math.hypot((x - (MW - 1)) * 1.6, y - 30.5) < 12) g.set(x, y, 2);
      lairGround(g, LAIR.cx, LAIR.cy, LAIR.rx, LAIR.ry);
    },
  });
  forestZone(o, 0, "Rừng cổ thụ", "Hồn thú 1.500 – 5.000 năm", 12, "nhan_dien_ma_chu:1,u_minh_lang:1,quy_dang:1", "1500-5000");
  forestZone(o, 1, "Đầm sương độc", "Hồn thú 4.000 – 12.000 năm", 10, "that_tinh_doc_thiem:1,xich_lan_mang:1,hac_vu_bien_buc:1", "4000-12000");
  forestZone(o, 2, "Lôi Cốc", "Hồn thú 10.000 – 18.000 năm", 9, "lam_loi_te_nguu:1,loi_duc_ung:1", "10000-18000");
  forestZone(o, 3, "Hắc Ám Lâm", "Cẩn thận: hồn thú 15.000 – 25.000 năm", 8, "am_kim_khung_trao_hung:1,kiem_vi_hat:1,quy_anh_bao:1", "15000-25000");
  o.elite("U Minh Lang Vương", "u_minh_lang_vuong", 12, 48, 8, 6);
  o.elite("Kim Bối Thất Tinh Thiềm", "kim_boi_that_tinh_thiem", 30, 10, 8, 6);
  o.elite("Lam Điện Lôi Tích", "lam_dien_loi_tich", 53, 28, 8, 6);
  o.elite("Huyết Văn Khủng Trảo Hùng", "huyet_van_khung_trao_hung", 72, 10, 8, 6);
  lairObj(o, "Hang Thiên Độc", "thien_doc_chu_hoang");
  const c = FOREST.camp;
  o.rect("spawn", "Trại cổng Nội địa", c.x, c.y, c.w, c.h);
  o.portal("Về Tinh Đấu Ngoại vi", 1, 29, 2, 4, "tinh_dau_ngoai_vi", "tu_tinh_dau_noi_dia", "10-30");
  o.point("arrive", "tu_tinh_dau_ngoai_vi", 5.5, 31.5);
  writeMap("tinh_dau_noi_dia", MW, MH, ground, trees, canopy, o, [prop("vignette", "float", 0.35)]);
}

// ---------- Lạc Nhật Sâm Lâm (BĐ6b, mục 5.3): rừng thực vật / độc, cấp 40–70, 5.000–30.000 năm ----------
/**
 * Cùng khuôn rừng 90×60 của Tinh Đấu (hàm `forest`): trại cổng ở mép tây về Thiên Đấu Thành (cổng tây của thành), 4 vùng theo chiều
 * đông. Rừng hoa độc nhiều hoa; Đầm Bích Lân nhiều đầm nước nối nhau; Băng Hỏa Tuyền rải suối nhỏ; Lưỡng Nghi Nhãn là rừng già, cuối
 * đường mòn là suối đôi Băng Hỏa Lưỡng Nghi Nhãn (hai vũng tròn sát nhau ở mép đông). Hang Tà hóa Lưỡng Nghi Thủ Hộ Xà ở đông nam
 * (LAIR, như Ngoại vi / Nội địa). Mỗi chữ nhật `elite` được dọn trống (bãi cỏ) để tinh anh luôn có chỗ sinh.
 */
const LAC_NHAT_ELITES = [
  ["Huyết Mạn Thực Nhân Hoa", "huyet_man_thuc_nhan_hoa", 12, 8, 8, 6],
  ["Song Đầu Bích Lân Xà", "song_dau_bich_lan_xa", 30, 44, 8, 6],
  ["Băng Hỏa Song Sắc Mãng", "bang_hoa_song_sac_mang", 53, 10, 8, 6],
  ["Khô Đằng Thụ Vương", "kho_dang_thu_vuong", 70, 9, 8, 6],
];
function lacNhatSamLam() {
  const { MW, MH } = FOREST;
  const pool = (g, cx, cy, rad) => { for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (Math.hypot(x, y) < rad) g.set(Math.round(cx + x), Math.round(cy + y), 2); };
  const { ground, trees, canopy, o } = forest({
    seed: 40630, shade: [0, 1, 2, 3], dens: [0.06, 0.08, 0.1, 0.16],
    feature(g, r) {
      // Rừng hoa độc: thảm hoa dày.
      for (let y = 1; y < MH - 1; y++) for (let x = 9; x < 22; x++) if (g.get(x, y) === 0 && r() < 0.18) g.set(x, y, 4);
      // Đầm Bích Lân: nhiều vũng nước nối nhau (như Đầm sương độc của Nội địa).
      for (let i = 0; i < 18; i++) pool(g, 24 + r() * 19, 3 + r() * (MH - 6), 1.3 + r() * 2.2);
      // Băng Hỏa Tuyền: vài suối nhỏ rải rác.
      for (let i = 0; i < 7; i++) pool(g, 47 + r() * 19, 4 + r() * (MH - 8), 1 + r() * 1.3);
    },
    east(g) {
      // Suối Băng Hỏa Lưỡng Nghi Nhãn: hai vũng tròn sát nhau ở mép đông, cuối đường mòn (vây bằng bãi cỏ trống).
      for (let y = 17; y < 44; y++) for (let x = MW - 14; x < MW - 1; x++) if (Math.hypot(x - (MW - 6), (y - 30.5) * 0.8) < 11) g.set(x, y, 0);
      pool(g, MW - 6, 26, 4.2); pool(g, MW - 6, 35, 4.2);
      lairGround(g, LAIR.cx, LAIR.cy, LAIR.rx, LAIR.ry);
      for (const [, , x, y, w, h] of LAC_NHAT_ELITES) g.fill(x, y, w, h, 0);
    },
  });
  forestZone(o, 0, "Rừng hoa độc", "Hồn thú 5.000 – 10.000 năm", 12, "thuc_nhan_hoa:1,cuc_yeu_hoa_linh:1,doc_cuc_dang:1", "5000-10000");
  forestZone(o, 1, "Đầm Bích Lân", "Hồn thú 10.000 – 18.000 năm", 10, "bich_lan_xa:1,doc_vu_thiem:1,hac_thuy_mang:1", "10000-18000");
  forestZone(o, 2, "Băng Hỏa Tuyền", "Hồn thú 16.000 – 25.000 năm", 9, "liet_hoa_tich_dich:1,huyen_bang_thiem:1,hoa_linh_diep:1", "16000-25000");
  forestZone(o, 3, "Lưỡng Nghi Nhãn", "Cẩn thận: hồn thú 22.000 – 30.000 năm", 8, "co_moc_thu_nhan:1,y_la_hoa_yeu:1,thanh_lan_doc_co:1", "22000-30000");
  for (const [name, id, x, y, w, h] of LAC_NHAT_ELITES) o.elite(name, id, x, y, w, h);
  lairObj(o, "Hang Lưỡng Nghi", "luong_nghi_thu_ho_xa");
  const c = FOREST.camp;
  o.rect("spawn", "Trại cổng Lạc Nhật", c.x, c.y, c.w, c.h);
  o.portal("Về Thiên Đấu Thành", 1, 29, 2, 4, "thien_dau_thanh", "tu_lac_nhat_sam_lam");
  o.point("arrive", "tu_thien_dau_thanh", 5.5, 31.5);
  writeMap("lac_nhat_sam_lam", MW, MH, ground, trees, canopy, o, [prop("vignette", "float", 0.2)]);
}

// ---------- Hải Thần Đảo / Ma Quỷ Hải Vực (BĐ6d, mục 5.3): đảo và rạn biển, cấp 80–100, 50.000–100.000 năm ----------
/**
 * 90×60 ô, cùng khung vùng với rừng (FOREST.xs, LAIR) nhưng nền là biển sâu bao quanh đảo. Mép tây là bến thuyền: cầu tàu (đường đất)
 * ra biển, thuyền neo cạnh cầu, cổng `boat` ở đầu cầu về Thiên Đấu Thành; trại "Bến Hải Thần" trên bãi cát. 4 vùng theo chiều đông:
 * Bãi san hô (cát, vũng rạn nông, đá, dừa), Ma Quỷ Hải Vực (rạn nông đi được, rãnh biển sâu và đá ngầm), Vách Hải Thần (vách đá
 * trên cỏ), Hải Thần Uyên (cỏ tối, hố biển sâu). Đường cát đông–tây và 4 lối bắc–nam vẽ sau cùng để mọi chỗ nối được với nhau qua
 * rãnh biển. Hang Tà hóa Thâm Hải Ma Kình Vương ở đông nam (LAIR), vây đá ngầm, lối vào phía bắc. Chữ nhật `elite` được dọn trống.
 */
const HAI_THAN_ELITES = [
  ["Hắc Giáp Cự Giải Vương", "hac_giap_cu_giai_vuong", 13, 7, 8, 6],
  ["Ma Chương Vương", "ma_chuong_vuong", 30, 44, 8, 6],
  ["Huyết Sa Bạo Quân", "huyet_sa_bao_quan", 53, 10, 8, 6],
  ["Hắc Uyên Ma Kình", "hac_uyen_ma_kinh", 70, 9, 8, 6],
];
function haiThanDao() {
  const { MW, MH, xs } = FOREST, r = rng(51991), g = grid(MW, MH);
  const zoneOf = (x) => { const i = xs.findIndex((x1) => x < x1); return i < 0 ? xs.length - 2 : Math.max(0, i - 1); };
  const blob = (cx, cy, rad, v, keep) => {
    for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) {
      const tx = Math.round(cx + x), ty = Math.round(cy + y);
      if (Math.hypot(x, y) < rad && keep(tx, ty)) g.set(tx, ty, v);
    }
  };
  // Biển sâu bao quanh; đảo có bờ lượn sóng (bắc, nam, đông), bờ tây thẳng ở cột 5 cho bến thuyền.
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const top = 2 + Math.round(1.2 * Math.sin(x / 4) + 0.8 * Math.sin(x / 9 + 1)), bot = MH - 3 - Math.round(1.2 * Math.sin(x / 5 + 2));
    const east = MW - 3 - Math.round(1.2 * Math.sin(y / 4));
    if (!(x >= 5 && x <= east && y >= top && y <= bot)) { g.set(x, y, 12); continue; }
    const z = zoneOf(x);
    g.set(x, y, z === 0 ? 10 : z === 1 ? 11 : 0);
  }
  // Bãi san hô: vũng rạn nông, đá, dừa thưa.
  for (let i = 0; i < 14; i++) blob(10 + r() * 13, 4 + r() * (MH - 8), 1.2 + r() * 1.8, 11, (x, y) => g.get(x, y) === 10);
  for (let y = 0; y < MH; y++) for (let x = 9; x < 24; x++) if (g.get(x, y) === 10) { const q = r(); if (q < 0.035) g.set(x, y, 13); else if (q < 0.07) g.set(x, y, 1); }
  // Ma Quỷ Hải Vực: rạn nông, rãnh biển sâu và đá ngầm.
  for (let i = 0; i < 16; i++) blob(25 + r() * 20, 3 + r() * (MH - 6), 1.4 + r() * 2.4, 12, (x, y) => x >= 24 && x < 46 && g.get(x, y) === 11);
  for (let y = 0; y < MH; y++) for (let x = 24; x < 46; x++) if (g.get(x, y) === 11 && r() < 0.05) g.set(x, y, 13);
  // Vách Hải Thần: vách đá thành cụm lớn trên cỏ, vài cây.
  for (let i = 0; i < 22; i++) blob(47 + r() * 20, 3 + r() * (MH - 6), 1.3 + r() * 2.6, 13, (x, y) => x >= 46 && x < 68 && g.get(x, y) === 0);
  for (let y = 0; y < MH; y++) for (let x = 46; x < 68; x++) if (g.get(x, y) === 0 && r() < 0.05) g.set(x, y, 1);
  // Hải Thần Uyên: hố biển sâu và đá ngầm trên cỏ tối.
  for (let i = 0; i < 10; i++) blob(69 + r() * 16, 3 + r() * (MH - 6), 1.5 + r() * 2.5, 12, (x, y) => x >= 68 && g.get(x, y) === 0);
  for (let y = 0; y < MH; y++) for (let x = 68; x < MW; x++) if (g.get(x, y) === 0) { const q = r(); if (q < 0.05) g.set(x, y, 13); else if (q < 0.09) g.set(x, y, 1); }
  // Đường cát đông–tây (uốn lượn, về hàng pathY ở hai đầu) và 4 lối bắc–nam: nối mọi vùng qua rãnh biển.
  let py = FOREST.pathY;
  for (let x = 5; x < MW - 4; x++) {
    g.set(x, py, 10); g.set(x, py + 1, 10);
    if (x >= MW - 14) py += Math.sign(FOREST.pathY - py);
    else if (x > 12 && r() < 0.3) py = Math.max(8, Math.min(MH - 10, py + (r() < 0.5 ? -1 : 1)));
  }
  for (const x0 of [14, 33, 55, 76]) {
    let x = x0;
    for (let y = 5; y < MH - 5; y++) { g.set(x, y, 10); g.set(x + 1, y, 10); if (r() < 0.25) x += r() < 0.5 ? -1 : 1; }
  }
  // Hang Thâm Hải Ma Kình Vương: bãi cát bầu dục vây đá ngầm, chừa lối vào phía bắc (như lairGround).
  {
    const { cx, cy, rx, ry } = LAIR;
    for (let y = Math.floor(cy - ry - 2); y <= Math.ceil(cy + ry + 2); y++) for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d < 1) g.set(x, y, 10); else if (d < 1.3 && !(y < cy && Math.abs(x - cx) < 2.5)) g.set(x, y, 13);
    }
  }
  for (const [, , x, y, w, h] of HAI_THAN_ELITES) for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) g.set(xx, yy, [10, 11, 0, 0][zoneOf(xx)]);
  // Bến thuyền: bãi cát trại ở bờ tây, cầu tàu (đường đất) ra biển tới mép bản đồ, thuyền neo phía bắc cầu (mái + tường, chặn đường).
  g.fill(5, 24, 7, 13, 10);
  g.fill(0, 29, 6, 3, 3);
  g.house(1, 25, 4, 3);
  const shade = [0, 0, 1, 3];
  const { ground, trees, canopy } = toLayers(MW, MH, g, (x) => shade[zoneOf(x)]);
  trees[26 * MW + 7] = GID.tent;
  trees[34 * MW + 8] = GID.fire;
  const o = objects();
  const zoneH = (i, name, hint, count, beasts, years) => o.zone(name, hint, xs[i], 0, xs[i + 1] - xs[i], MH, [1], count, beasts, years);
  zoneH(0, "Bãi san hô", "Hồn thú 50.000 – 65.000 năm", 12, "thiet_giap_cu_giai:1,lam_lan_hai_xa:1,kiem_ngu:1", "50000-65000");
  zoneH(1, "Ma Quỷ Hải Vực", "Rạn nông: hồn thú 60.000 – 80.000 năm", 10, "quy_dien_hai_yeu:1,tham_hai_ma_chuong:1,loi_quang_hai_dieu:1", "60000-80000");
  zoneH(2, "Vách Hải Thần", "Hồn thú 75.000 – 90.000 năm", 9, "kim_lan_long_quy:1,huyet_nha_cu_sa:1,loi_van_hai_ung:1", "75000-90000");
  zoneH(3, "Hải Thần Uyên", "Cẩn thận: hồn thú 85.000 – 100.000 năm", 8, "tham_hai_ma_kinh:1,u_linh_hai_mau:1", "85000-100000");
  for (const [name, id, x, y, w, h] of HAI_THAN_ELITES) o.elite(name, id, x, y, w, h);
  o.boss("Vực Ma Kình", "tham_hai_ma_kinh_vuong", LAIR.cx - LAIR.rx, LAIR.cy - LAIR.ry, LAIR.rx * 2, LAIR.ry * 2);
  o.rect("spawn", "Bến Hải Thần", 6, 25, 5, 11);
  // Bến thuyền về Thiên Đấu Thành ở đầu cầu tàu (thành: không cấp đề xuất), đi thuyền BOAT_CAST giây.
  o.portal("Thuyền về Thiên Đấu Thành", 0, 29, 2, 3, "thien_dau_thanh", "tu_hai_than_dao", "", true);
  o.point("arrive", "tu_thien_dau_thanh", 7.5, 30.5);
  writeMap("hai_than_dao", MW, MH, ground, trees, canopy, o, [prop("vignette", "float", 0.25)]);
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
  o.elite("Bạch Nhung Thỏ Vương", "bach_nhung_tho_vuong", 7, 9, 8, 7);
  o.elite("Ngân Bối Phong Lang Đầu Lĩnh", "ngan_boi_phong_lang_dau_linh", 60, 41, 7, 7);
  o.elite("Thiết Nha Dã Trư Vương", "thiet_nha_da_tru_vuong", 31, 3, 9, 6);
  o.rect("safe", "Thánh Hồn Thôn", V.x - 1, V.y - 1, V.w + 2, V.h + 2);
  o.rect("spawn", "Quảng trường làng", V.x + 6, V.y + 5, 6, 4);
  o.portal("Đi Nặc Đinh Thành", 35, MH - 3, 3, 2, "nac_dinh_thanh", "tu_thanh_hon_thon");
  o.point("arrive", "tu_nac_dinh_thanh", 36.5, MH - 6);
  o.point("npc", "Lão Kiệt Khắc", V.x + 3.5, V.y + 5.5, [prop("npc", "string", "lao_kiet_khac")]);
  o.point("npc", "Tố Vân Đào", V.x + 14.5, V.y + 5.5, [prop("npc", "string", "to_van_dao")]);
  writeMap("thanh_hon_thon", MW, MH, ground, trees, canopy, o);
}

// ---------- Nặc Đinh Thành (mục 5.8): thành an toàn; NPC (mã trong NPCS của shared/data.ts) hoạt động từ bước 6.1 ----------
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
  // Nhà: Học viện Nặc Đinh (tây bắc), lò rèn (đông bắc), cửa hàng (tây nam), trạm sứ giả Đại Đấu Hồn Trường (đông nam; 7.2 là lối
  // vào tạm, từ BĐ6a Đại Đấu Hồn Trường dời về Thiên Đấu Thành).
  g.house(4, 4, 14, 8); g.house(38, 5, 10, 7); g.house(5, 27, 9, 6); g.house(40, 27, 12, 7);
  // Hàng cây trang trí ven đường, rồi lối đi lát đá từ cửa mỗi nhà ra đại lộ.
  for (let x = 3; x < MW - 3; x += 4) if (x < 23 || x > 36) { g.set(x, 16, 1); g.set(x, 24, 1); }
  g.fill(10, 12, 2, 6, 6); g.fill(42, 12, 2, 6, 6); g.fill(8, 23, 2, 4, 6); g.fill(45, 23, 2, 4, 6);
  g.set(0, 19, 6); g.set(0, 20, 6); g.set(0, 21, 6); g.set(MW - 1, 19, 6); g.set(MW - 1, 20, 6); g.set(MW - 1, 21, 6);
  g.fill(28, 0, 4, 1, 6); // BĐ6a: cổng bắc trên đường bắc–nam, đi Thiên Đấu Thành

  const { ground, trees, canopy } = toLayers(MW, MH, g, () => 0);
  // Cổng phủ cả cột cổng thành ở mép bản đồ (ô lát đá, đi vào được) để không đứng lọt ra ngoài cổng.
  const o = objects();
  o.rect("spawn", "Quảng trường Nặc Đinh", 26, 17, 8, 7);
  o.portal("Về Thánh Hồn Thôn", 0, 18, 3, 5, "thanh_hon_thon", "tu_nac_dinh_thanh", "1-10");
  o.portal("Đi Tinh Đấu Ngoại vi", MW - 3, 18, 3, 5, "tinh_dau_ngoai_vi", "tu_nac_dinh_thanh", "10-30");
  o.point("arrive", "tu_thanh_hon_thon", 5.5, 20.5);
  o.point("arrive", "tu_tinh_dau_ngoai_vi", MW - 5.5, 20.5);
  // BĐ6a: thành an toàn nên cổng đi Thiên Đấu Thành không có cấp đề xuất (bảng 5.3: "–"), không cảnh báo.
  o.portal("Đi Thiên Đấu Thành", 28, 0, 4, 3, "thien_dau_thanh", "tu_nac_dinh_thanh");
  o.point("arrive", "tu_thien_dau_thanh", 30, 5.5);
  o.point("npc", "Ngọc Tiểu Cương (Đại Sư)", 11, 13, [prop("npc", "string", "dai_su")]);
  o.point("npc", "Thợ rèn", 43, 13, [prop("npc", "string", "lo_ren")]);
  o.point("npc", "Thương nhân", 9, 24, [prop("npc", "string", "thuong_nhan")]);
  // Chỗ của lối vào tạm Đại Đấu Hồn Trường (7.2): từ BĐ6a là sứ giả chỉ đường lên Thiên Đấu Thành.
  o.point("npc", "Sứ giả Đại Đấu Hồn Trường", 46, 24, [prop("npc", "string", "su_gia_dau_hon")]);
  writeMap("nac_dinh_thanh", MW, MH, ground, trees, canopy, o);
}

// ---------- Thiên Đấu Thành (BĐ6a, mục 5.3, 5.8): thủ đô, thành an toàn lớn hơn Nặc Đinh Thành ----------
/**
 * 80×56 ô, tường thành bao quanh, phía đông là sông có bến thuyền. Đại lộ bắc–nam (cột 38–41) từ cổng nam (về Nặc Đinh Thành) lên
 * cổng bắc (Cực Bắc Chi Địa, chưa mở), đại lộ đông–tây (hàng 26–29) từ cổng tây (Lạc Nhật Sâm Lâm, mở từ BĐ6b) ra bến thuyền (Hải
 * Thần Đảo, mở từ BĐ6d); quảng trường có đài phun nước ở giữa. Hoàng cung Thiên Đấu (tây bắc), thương nhân và lò rèn (đông bắc), Sử Lai Khắc
 * Học Viện (tây nam), Đại Đấu Hồn Trường (đông nam). Cổng chưa mở là tường thành đóng kín kèm biển "sắp mở" (NPC vai trò `talk`);
 * khi làm bản đồ đích (BĐ6b–d) thì mở tường, đặt object `portal` thay biển (BĐ6b: cổng tây, 4 ô tường cuối đại lộ đông–tây; BĐ6d:
 * bến thuyền, thuyền dời lên phía bắc đầu cầu tàu, cầu tàu nối tới mép bản đồ, cổng `boat` ở đầu cầu).
 */
function thienDauThanh() {
  const MW = 80, MH = 56, r = rng(9161);
  const g = grid(MW, MH);
  const RIVER = 72; // cột đầu tiên của sông phía đông
  for (let y = 0; y < MH; y++) for (let x = 0; x < RIVER; x++) if (r() < 0.03) g.set(x, y, 4);
  // Sông phía đông và tường thành (bờ tây sông là tường đông).
  g.fill(RIVER, 0, MW - RIVER, MH, 2);
  for (let x = 0; x < RIVER; x++) { g.set(x, 0, 9); g.set(x, MH - 1, 9); }
  for (let y = 0; y < MH; y++) { g.set(0, y, 9); g.set(RIVER - 1, y, 9); }
  // Hàng cây ven đại lộ (vẽ trước; đường, nhà, lối vào vẽ sau đè lên).
  for (let x = 3; x < RIVER - 2; x += 4) if (x < 29 || x > 50) { g.set(x, 24, 1); g.set(x, 31, 1); }
  for (let y = 3; y < MH - 3; y += 4) if (y < 20 || y > 35) { g.set(36, y, 1); g.set(43, y, 1); }
  // Đại lộ lát đá và quảng trường trung tâm (đài phun nước 4×4 ở giữa, chặn đường; đi vòng qua quảng trường).
  g.fill(38, 1, 4, MH - 2, 6);
  g.fill(1, 26, RIVER - 2, 4, 6);
  g.fill(30, 21, 20, 14, 6);
  g.fill(38, 26, 4, 4, 2);
  // Hoàng cung Thiên Đấu (tây bắc) có vườn cây bao quanh; thương nhân và lò rèn (đông bắc).
  g.house(7, 4, 24, 13);
  for (let x = 4; x < 35; x += 3) { g.set(x, 2, 1); g.set(x, 20, 1); }
  for (let y = 5; y < 20; y += 3) { g.set(4, y, 1); g.set(34, y, 1); }
  g.fill(18, 17, 3, 9, 6); // lối từ cửa hoàng cung xuống đại lộ
  g.house(46, 6, 10, 7); g.house(59, 6, 10, 7);
  g.fill(50, 13, 2, 13, 6); g.fill(63, 13, 2, 13, 6);
  // Sử Lai Khắc Học Viện (tây nam) và sân tập (đất); Đại Đấu Hồn Trường (đông nam) với sân đá trước cửa.
  g.house(5, 34, 20, 10);
  g.fill(5, 46, 20, 6, 3);
  g.house(46, 34, 22, 12);
  g.fill(46, 46, 22, 4, 6); g.fill(42, 47, 4, 2, 6);
  // Cổng nam mở (về Nặc Đinh Thành); cổng tây mở từ BĐ6b (đi Lạc Nhật Sâm Lâm); cổng bắc là tường đóng (chưa mở). Bến thuyền: cửa
  // tường đông + cầu tàu đường đất ra sông; từ BĐ6d cầu tàu nối tới mép bản đồ (đầu cầu là cổng `boat` đi Hải Thần Đảo), thuyền neo
  // phía bắc đầu cầu (mái + tường, chặn đường; BĐ6a thuyền chặn ngang đầu cầu).
  g.fill(38, MH - 1, 4, 1, 6);
  g.fill(0, 26, 1, 4, 6);
  g.fill(RIVER - 1, 27, 1, 2, 6);
  g.fill(RIVER, 27, MW - RIVER, 2, 3);
  g.house(RIVER + 3, 23, 4, 3);
  const { ground, trees, canopy } = toLayers(MW, MH, g, () => 0);
  const o = objects();
  o.rect("spawn", "Quảng trường Thiên Đấu", 31, 22, 18, 12);
  o.portal("Về Nặc Đinh Thành", 38, MH - 3, 4, 3, "nac_dinh_thanh", "tu_thien_dau_thanh");
  o.point("arrive", "tu_nac_dinh_thanh", 40, MH - 6.5);
  o.point("npc", "Đại Đấu Hồn Trường", 57, 48, [prop("npc", "string", "dau_hon_truong")]);
  o.point("npc", "Phất Lan Đức", 15, 47, [prop("npc", "string", "phat_lan_duc")]);
  o.point("npc", "Thương nhân Thiên Đấu", 51, 15, [prop("npc", "string", "thuong_nhan_thien_dau")]);
  o.point("npc", "Thợ rèn Thiên Đấu", 64, 15, [prop("npc", "string", "lo_ren_thien_dau")]);
  // BĐ6b: cổng tây (thay biển "sắp mở" `cong_lac_nhat`); chặn mềm theo cấp đề xuất của Lạc Nhật.
  o.portal("Đi Lạc Nhật Sâm Lâm", 0, 26, 2, 4, "lac_nhat_sam_lam", "tu_thien_dau_thanh", "40-70");
  o.point("arrive", "tu_lac_nhat_sam_lam", 5, 28);
  o.point("npc", "Cổng Cực Bắc Chi Địa", 40, 3, [prop("npc", "string", "cong_cuc_bac")]);
  // BĐ6d: bến thuyền (thay biển "sắp mở" `ben_thuyen_hai_than`); chặn mềm theo cấp đề xuất của Hải Thần Đảo, đi thuyền BOAT_CAST giây.
  o.portal("Thuyền đi Hải Thần Đảo", MW - 2, 27, 2, 2, "hai_than_dao", "tu_thien_dau_thanh", "80-100", true);
  o.point("arrive", "tu_hai_than_dao", RIVER + 1, 28);
  writeMap("thien_dau_thanh", MW, MH, ground, trees, canopy, o);
}

// ---------- Đại Đấu Hồn Trường (bước 7.2, mục 5.9): sân đấu 1v1, chỉ phòng ArenaRoom dùng ----------
// Không cổng, không vùng, không NPC: vào / ra bằng ghép trận. Object `spawn` là mặt sân; hai bên xuất hiện ở hai đầu sân (ArenaRoom).
function daiDauHonTruong() {
  const MW = 40, MH = 24; // rộng hơn khung nhìn nhỏ nhất (zoom 2 ở 1280×720 thấy 632×312 pixel) để không lộ nền tối
  const g = grid(MW, MH);
  // Tường bao quanh, khán đài (mái + tường) phía bắc và phía nam, hàng cây ở hai bên.
  for (let x = 0; x < MW; x++) { g.set(x, 0, 9); g.set(x, MH - 1, 9); }
  for (let y = 0; y < MH; y++) { g.set(0, y, 9); g.set(MW - 1, y, 9); }
  g.house(1, 1, MW - 2, 4);
  g.fill(1, MH - 3, MW - 2, 1, 8); g.fill(1, MH - 2, MW - 2, 1, 9);
  for (let y = 6; y < MH - 4; y += 2) { g.set(1, y, 1); g.set(MW - 2, y, 1); }
  // Mặt sân: viền đường đất, giữa lát đá.
  g.fill(3, 5, MW - 6, MH - 8, 3);
  g.fill(4, 6, MW - 8, MH - 10, 6);
  const { ground, trees, canopy } = toLayers(MW, MH, g, () => 0);
  const o = objects();
  o.rect("spawn", "Sân đấu", 4, 6, MW - 8, MH - 10);
  writeMap("dai_dau_hon_truong", MW, MH, ground, trees, canopy, o);
}

const GEN = { thanh_hon_thon: thanhHonThon, nac_dinh_thanh: nacDinhThanh, tinh_dau_ngoai_vi: tinhDauNgoaiVi, tinh_dau_noi_dia: tinhDauNoiDia,
  dai_dau_hon_truong: daiDauHonTruong, thien_dau_thanh: thienDauThanh, lac_nhat_sam_lam: lacNhatSamLam, hai_than_dao: haiThanDao };
const want = process.argv.slice(2);
for (const id of want.length ? want : Object.keys(GEN)) {
  if (!GEN[id]) { console.error("Không có bản đồ:", id); process.exit(1); }
  GEN[id]();
}
