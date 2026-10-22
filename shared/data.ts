// Dữ liệu game dùng chung cho client và server.
// Sửa cân bằng game ở đây – cả hai phía sẽ dùng cùng con số.

export interface TierDef {
  /** Số năm nhỏ nhất của bậc (hồn hoàn lưu trong DB theo số năm). */
  years: number;
  age: string;
  /** Tên màu hồn hoàn của bậc (bảng 5.2). */
  color: string;
  col: string; glow: string;
  hp: number; dmg: number; xp: number; spd: number;
  atkb: number; hpb: number; size: number; body: string;
}

export const TIERS: TierDef[] = [
  { years: 10,     age: "10 năm",     color: "Trắng",  col: "#f3f3f3", glow: "#ffffff", hp: 30,   dmg: 4,  xp: 12,   spd: 26, atkb: 2,  hpb: 12,  size: 8,  body: "#d9cbb3" },
  { years: 100,    age: "100 năm",    color: "Vàng",   col: "#f2c84b", glow: "#ffe08a", hp: 95,   dmg: 9,  xp: 40,   spd: 32, atkb: 5,  hpb: 30,  size: 11, body: "#8b8f96" },
  { years: 1000,   age: "1.000 năm",  color: "Tím",    col: "#a253e0", glow: "#c99bff", hp: 300,  dmg: 19, xp: 150,  spd: 36, atkb: 12, hpb: 80,  size: 13, body: "#5d4380" },
  { years: 10000,  age: "10.000 năm", color: "Đen",    col: "#1a1820", glow: "#8a6bff", hp: 950,  dmg: 42, xp: 500,  spd: 33, atkb: 30, hpb: 220, size: 16, body: "#2c2c35" },
  { years: 100000, age: "100.000 năm", color: "Đỏ",    col: "#e0303a", glow: "#ff6a5a", hp: 4200, dmg: 95, xp: 2500, spd: 40, atkb: 85, hpb: 700, size: 22, body: "#8f1f2a" },
];

export const TIER_MULT = [1, 1.35, 1.9, 2.8, 4.5];

/** Bậc (chỉ số trong TIERS) của một hồn hoàn theo số năm. */
export function tierOfYears(years: number) {
  let t = 0;
  for (let i = 0; i < TIERS.length; i++) if (years >= TIERS[i].years) t = i;
  return t;
}

// ---------- Niên hạn theo số năm (mục 5.2, 5.3; bước 3.2) ----------
/** Niên hạn tối đa (mục 3): hồn thú / hồn hoàn đỏ đúng 100.000 năm. Mỗi phòng (kênh) tối đa 1 hồn thú thường cỡ này cùng lúc. */
export const MAX_YEARS = TIERS[TIERS.length - 1].years;
/**
 * Hồn thú thường đúng MAX_YEARS năm (BĐ6d, mục 5.3): chỉ vùng có mức trên `years` bằng MAX_YEARS (Hải Thần Uyên) sinh được. Mỗi lần
 * sinh ở vùng đó có tỉ lệ `RED_BEAST_CHANCE` ra đúng MAX_YEARS nếu kênh chưa có con nào (tinh anh, thú vương không tính), còn lại tung
 * dưới MAX_YEARS (phân bố log của rollYears gần như không bao giờ ra đúng mức trên). Chờ chốt.
 */
export const RED_BEAST_CHANCE = 0.03;
/** Khoảng năm [nhỏ nhất, lớn nhất] của bậc `tier` (bảng màu 5.2): trắng 10–99 … đen 10.000–99.999, đỏ đúng 100.000. */
export const tierBand = (tier: number): [number, number] =>
  [TIERS[tier].years, tier + 1 < TIERS.length ? TIERS[tier + 1].years - 1 : MAX_YEARS];
/**
 * Tuổi hồn thú trong khoảng [lo, hi] từ một số ngẫu nhiên r ∈ [0, 1) (server tự gọi Math.random()). Phân bố theo log (đã chốt):
 * hồn thú càng già càng hiếm, khoảng hẹp như 300–700 thì gần như đều.
 */
export function rollYears(lo: number, hi: number, r: number) {
  const a = Math.max(TIERS[0].years, Math.min(lo, hi)), b = Math.min(MAX_YEARS, Math.max(lo, hi));
  return Math.max(a, Math.min(b, Math.floor(a * Math.pow((b + 1) / a, r))));
}
/**
 * Chỉ số hồn thú theo số năm (mục 5.3 "Chỉ số hồn thú tăng theo số năm"): nội suy hình học giữa hai mốc TIERS kề nhau, nên tăng
 * liên tục theo năm chứ không nhảy theo bậc; đúng mốc (10, 100, 1.000…) thì bằng đúng chỉ số của bậc đó. Kích thước, tốc độ,
 * Hồn Tệ vẫn theo bậc. Hệ số riêng từng loài để sau (bảng BEASTS chưa có).
 */
export function beastStats(years: number) {
  const y = Math.max(TIERS[0].years, Math.min(MAX_YEARS, years)), t = tierOfYears(y), a = TIERS[t], b = TIERS[Math.min(t + 1, TIERS.length - 1)];
  const f = b === a ? 0 : Math.log(y / a.years) / Math.log(b.years / a.years), mix = (x: number, z: number) => x * Math.pow(z / x, f);
  return { hp: Math.round(mix(a.hp, b.hp)), dmg: +mix(a.dmg, b.dmg).toFixed(2), xp: Math.round(mix(a.xp, b.xp)) };
}
/** "437 năm", "1.760 năm", "100.000 năm". */
export const formatYears = (years: number) => `${Math.max(0, Math.floor(years)).toLocaleString("vi-VN")} năm`;

// ---------- Bản đồ và hồn thú (GAME_DESIGN.md mục 5.3, 6) ----------
/** `arena` (bước 7.2): sân của Đại Đấu Hồn Trường, chỉ phòng ArenaRoom mở; không có hồn thú, không vùng an toàn, không vào bằng cổng. */
export type MapKind = "town" | "hunt" | "boss" | "arena";
export interface MapDef {
  /** Mã cố định, cũng là tên file Tiled `shared/assets/<id>.json`. */
  id: string;
  name: string; kind: MapKind;
  level: [number, number] | null; // cấp đề xuất (thành: null)
  years: [number, number] | null; // niên hạn hồn thú (thành: null)
  /**
   * Mã võ hồn (VOHON) mà hồn thú bản đồ này rơi mảnh (bảng "Rơi đặc trưng" mục 5.3, bước 3.4); mọi vùng của bản đồ dùng chung. Bản đồ săn
   * rơi 2–4 võ hồn (từ 8.3: A Ngân ở Thánh Hồn Thôn, Liệt Hỏa Thương Lang ở Lạc Nhật, Băng Phượng Hoàng ở Cực Bắc; từ 2026-10-20 Phá Hồn
   * Thương ở Hải Thần Đảo; đã chốt).
   */
  shards: string[];
  /** Tà hóa thú vương của bản đồ (mã trong BOSSES, bậc 2; BĐ5, mục 5.4): hang là object `boss` trong Tiled. Không có = không có thú vương. */
  king?: string;
  /** Mã bộ hồn hạch (CORE_SETS) đặc trưng của bản đồ (bảng "Rơi đặc trưng" mục 5.3, bước 5.1): hồn hạch rơi ở đây phần lớn thuộc các bộ này. */
  cores: string[];
  /**
   * Tiên thảo (BĐ6b, mục 5.3, 5.7): tỉ lệ rơi theo TÊN vùng (object `zone` trong Tiled, phải khớp tên), vùng càng sâu càng cao.
   * Không có = bản đồ không rơi tiên thảo (chỉ Lạc Nhật Sâm Lâm có). Xem HERB_ELITE, herbChance.
   */
  herbs?: Record<string, number>;
  /**
   * Boss thế giới của bản đồ `boss` (BĐ6e, mục 5.4): mã trong BOSSES (bậc 3), luân phiên theo ngày (worldBossOn). Sàn đấu là object
   * `boss` trong Tiled (thuộc tính `boss` là một mã trong danh sách này).
   */
  world?: string[];
  /** Đăng xuất (rời phòng không qua cổng / đổi kênh) ở bản đồ này thì lần sau về điểm `arrive` của cổng tới bản đồ `exit` (mục 6, BĐ6e). */
  exit?: string;
}

/**
 * Bản đồ đang có (bảng 5.3). Mọi cổng của Thiên Đấu Thành đã mở (cổng tây Lạc Nhật từ BĐ6b, cổng bắc Cực Bắc từ BĐ6c, bến thuyền
 * Hải Thần Đảo từ BĐ6d); bờ hồ Nội địa đi Lõi Tinh Đấu từ BĐ6e.
 */
export const MAPS: Record<string, MapDef> = {
  thanh_hon_thon: { id: "thanh_hon_thon", name: "Thánh Hồn Thôn", kind: "hunt", level: [1, 10], years: [10, 450],
    shards: ["lam_ngan_thao", "nhu_cot_tho", "a_ngan"], cores: ["lam_ngan", "tien_co"] },
  nac_dinh_thanh: { id: "nac_dinh_thanh", name: "Nặc Đinh Thành", kind: "town", level: null, years: null, shards: [], cores: [] },
  // BĐ3: tách Tinh Đấu Đại Sâm Lâm (`tinh_dau` của BĐ1–BĐ2) thành Ngoại vi và Nội địa.
  tinh_dau_ngoai_vi: { id: "tinh_dau_ngoai_vi", name: "Tinh Đấu Ngoại vi", kind: "hunt", level: [10, 30], years: [300, 2000],
    shards: ["u_minh_linh_mieu", "kim_vu_mieu_ung", "xuc_xich"], cores: ["linh_mieu", "hao_thien", "xa_hoang"], king: "huyet_nguyet_lang_vuong" },
  tinh_dau_noi_dia: { id: "tinh_dau_noi_dia", name: "Tinh Đấu Nội địa", kind: "hunt", level: [30, 60], years: [1500, 25000],
    shards: ["tu_vong_chu_hoang", "lam_dien_ba_vuong_long", "cuu_tinh_that_sat_kiem"], cores: ["ba_vuong_long", "that_sat", "luu_ly"], king: "thien_doc_chu_hoang" },
  // BĐ6a: thủ đô, thành an toàn; Đại Đấu Hồn Trường dời về đây. Cổng tây đi Lạc Nhật Sâm Lâm mở từ BĐ6b, cổng bắc đi Cực Bắc Chi Địa
  // từ BĐ6c, bến thuyền đi Hải Thần Đảo từ BĐ6d.
  thien_dau_thanh: { id: "thien_dau_thanh", name: "Thiên Đấu Thành", kind: "town", level: null, years: null, shards: [], cores: [] },
  // BĐ6b: rừng thực vật / độc quanh suối Băng Hỏa Lưỡng Nghi Nhãn, cổng tây Thiên Đấu Thành. Tiên thảo chỉ rơi ở đây (đã chốt).
  lac_nhat_sam_lam: { id: "lac_nhat_sam_lam", name: "Lạc Nhật Sâm Lâm", kind: "hunt", level: [40, 70], years: [5000, 30000],
    shards: ["bich_lan_xa_hoang", "ky_nhung_thong_thien_cuc", "hoa_long", "liet_hoa_thuong_lang"], cores: ["xa_hoang", "phuong_hoang"], king: "luong_nghi_thu_ho_xa",
    herbs: { "Rừng hoa độc": 0.01, "Đầm Bích Lân": 0.02, "Băng Hỏa Tuyền": 0.03, "Lưỡng Nghi Nhãn": 0.05,
      // 11.5: vùng có tên thêm ở bản ×8, cùng tỉ lệ với tầng niên hạn của nó
      "Hoa Cốc Mạn Đà": 0.01, "Lân Quang Trạch": 0.02, "Hỏa Diễm Nham": 0.03, "Cổ Đằng Lâm": 0.05 } },
  // BĐ6c: băng nguyên phía bắc Thiên Đấu Thành, 4 vùng 20.000–80.000 năm (từ vòng 7, giới hạn 50.000 năm, tới vòng 8), thú vương
  // Huyền Minh Băng Giao 80.000 năm.
  cuc_bac_chi_dia: { id: "cuc_bac_chi_dia", name: "Cực Bắc Chi Địa", kind: "hunt", level: [60, 85], years: [20000, 80000],
    shards: ["yeu_ho", "can_khon_hon_nguyen_toa", "nguyet_nhan", "bang_phuong_hoang"], cores: ["lam_ngan", "that_sat"], king: "huyen_minh_bang_giao" },
  // BĐ6d: đảo và rạn biển, đi bằng bến thuyền Thiên Đấu Thành (cổng `boat`, BOAT_CAST). Chỉ vùng Hải Thần Uyên (85.000–100.000 năm)
  // sinh được hồn thú thường 100.000 năm, tối đa 1 con mỗi kênh (RED_BEAST).
  hai_than_dao: { id: "hai_than_dao", name: "Hải Thần Đảo", kind: "hunt", level: [80, 100], years: [50000, 100000],
    // Phá Hồn Thương (8.3) chuyển về đây từ 2026-10-20 (trước đó chỉ có ở rương mọi thú vương, KING_CHEST.every).
    shards: ["quy_mi", "thien_can_bach_ngoc_dinh", "hoa_anh", "pha_hon_thuong"], cores: ["ba_vuong_long", "tien_co"], king: "tham_hai_ma_kinh_vuong" },
  // BĐ6e: hồ trung tâm Tinh Đấu Đại Sâm Lâm, chỉ có boss thế giới (không hồn thú thường, không tinh anh); cổng ở bờ hồ cuối Hắc Ám Lâm
  // của Nội địa (chặn mềm cấp 90). Đăng xuất ở đây thì lần sau về bờ hồ Nội địa (`exit`). Mảnh / hồn hạch chỉ có trong rương boss.
  loi_tinh_dau: { id: "loi_tinh_dau", name: "Lõi Tinh Đấu", kind: "boss", level: [90, 100], years: [100000, 100000], shards: [], cores: [],
    world: ["thai_than_cu_vien", "thien_thanh_nguu_mang"], exit: "tinh_dau_noi_dia" },
  // 7.2: sân đấu riêng của Đại Đấu Hồn Trường (ARENA_MAP). Không cổng nào dẫn tới, không lưu làm bản đồ đang đứng; chỉ ArenaRoom mở.
  dai_dau_hon_truong: { id: "dai_dau_hon_truong", name: "Đại Đấu Hồn Trường", kind: "arena", level: null, years: null, shards: [], cores: [] },
};
/**
 * Mã bản đồ cũ đã bỏ khỏi MAPS -> bản đồ thay thế (mục 6): `accounts.map_id` còn mã cũ thì vào bản đồ thay thế, ở `spawn`
 * (vị trí cũ không còn nghĩa). Mã không có ở đây và không có trong MAPS thì về DEFAULT_MAP.
 */
export const MAP_MOVED: Record<string, string> = { tinh_dau: "tinh_dau_ngoai_vi" };
/**
 * Mật độ hồn thú thường của bản đồ dựng bằng `tools/maps` (11.3): số con trên 1.000 ô đi được của mỗi vùng, theo tầng niên hạn
 * (`tier` trong `tools/maps/layouts/<mapId>.json`, nông → sâu). Công cụ đếm ô đi được rồi ghi `count` của từng vùng vào file Tiled.
 * Mỗi số đo trên bản cũ (90×60, Cực Bắc 72×96: số con mỗi vùng / ô đi được của vùng), nên bản ×8 diện tích giữ đúng mật độ và số hồn
 * thú tăng theo diện tích (11.5).
 */
export const BEAST_DENSITY: Record<string, number[]> = {
  tinh_dau_ngoai_vi: [21.5, 12.1, 10.7, 10.4], tinh_dau_noi_dia: [18.5, 11.2, 11.7, 9.4], lac_nhat_sam_lam: [17.4, 10.5, 9.4, 9.8],
  cuc_bac_chi_dia: [8.3, 8.2, 8.8, 5.7], hai_than_dao: [16.9, 9.6, 10.4, 10.9],
};
/** Bản đồ khởi đầu: tài khoản mới, và tài khoản cũ chưa lưu bản đồ (từ BĐ2), bắt đầu ở đây (mục 5.3). */
export const DEFAULT_MAP = "thanh_hon_thon";
/** "10-30" -> [10, 30]; "10" -> [10, 10]; sai -> null. Dùng cho thuộc tính `level` của cổng và `years` của vùng trong Tiled. */
export function parseLevelRange(s: unknown): [number, number] | null {
  const m = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(String(s ?? ""));
  if (!m) return null;
  const a = Number(m[1]), b = m[2] === undefined ? a : Number(m[2]);
  return a <= b ? [a, b] : null;
}
/** Đi qua cổng: số giây niệm (bị đánh thì hủy, đã chốt ở 5.3) và số giây server chờ client rời phòng cũ (mục 6). */
export const TRAVEL_CAST = 1;
/**
 * Bến thuyền (BĐ6d, mục 5.3): cổng có thuộc tính `boat` trong Tiled (Thiên Đấu Thành ↔ Hải Thần Đảo) "đi thuyền" ngần ấy giây thay cho
 * TRAVEL_CAST, cùng luật hủy (bị đánh, bước ra khỏi bến). Chờ chốt.
 */
export const BOAT_CAST = 3;
/**
 * Truyền tống trận (11.2, mục 5.3 "Truyền tống trận"): object `waypoint` trong Tiled, bước lên lần đầu thì mở khóa (bảng `waypoints`).
 * Đứng trên một trận đã mở, chọn trận đích trên bản đồ thế giới: niệm WAYPOINT_CAST giây (di chuyển hoặc bị đánh thì hủy), tốn
 * waypointFee(số lần đi cổng ít nhất giữa hai bản đồ) đồng, trừ lúc dịch chuyển. Hồi Thành Phù (ITEMS `hoi_thanh_phu`) dùng cùng
 * thời gian niệm và luật hủy, đưa về thành gần nhất. Chờ chốt.
 */
export const WAYPOINT_CAST = 3;
export const WAYPOINT_FEE = { base: 5, perHop: 10 };
/** Phí truyền tống (đồng) tới trận ở bản đồ cách `hops` lần đi cổng (cùng bản đồ: 0). */
export const waypointFee = (hops: number) => WAYPOINT_FEE.base + WAYPOINT_FEE.perHop * Math.max(0, Math.floor(hops));
export const TRAVEL_LEAVE_SECS = 10;
/**
 * Kênh (mục 6 "Nhiều kênh"): mỗi phòng của một bản đồ là một kênh, tối đa CHANNEL_MAX người; phòng đầy thì mở kênh mới.
 * Đổi kênh trong cùng bản đồ: ngoài giao chiến, mỗi tài khoản cách nhau ít nhất CHANNEL_CD giây (mỗi lần là một transaction lưu).
 */
export const CHANNEL_MAX = 60;
export const CHANNEL_CD = 10;
/**
 * Khoảng cách tối thiểu (giây) giữa hai lần client xin lại cùng một loại dữ liệu riêng (`bag`, `vohons`, `quest {op: "get"}`; #165):
 * xin dồn trong khoảng này thì server gộp thành đúng một lần gửi khi hết khoảng, để gửi dồn không tốn CPU / băng thông. Lần server tự
 * gửi khi dữ liệu đổi không theo nhịp này.
 */
export const ASK_CD = 0.25;
/**
 * Đồng bộ theo vùng gần (11.4, mục 6 "Đồng bộ xuống client"). Hằng kỹ thuật, không phải số cân bằng (đặt ở đây cho server và bot dùng
 * chung). Mỗi client chỉ nhận hồn thú thường, đồ rơi, hồn sư khác cách mình dưới `r` pixel thế giới, bỏ khi xa quá `out` (chênh nhau để
 * không vào / ra liên tục ở mép); tinh anh, thú vương, boss thế giới luôn đồng bộ. Tin `fx` / `dmg` chỉ gửi cho client cách điểm hiệu
 * ứng dưới `fx`. Hồn thú thường không có mục tiêu ở ô lưới cách mọi hồn sư trong phòng quá `wake` thì ngủ (không lang thang, không
 * tìm mục tiêu; vẫn hồi máu, trạng thái vẫn chạy); `wake` ≥ `out` nên hồn thú client đang thấy luôn thức. Lưới không gian ô `cell`
 * pixel. Bản đồ nhỏ nhận vị trí hồn sư, hồn thú từ nghìn năm, đồ rơi cả bản đồ mỗi `mini` giây
 * (tin `mini`). Khung camera VIEW_W × VIEW_H chiếu isometric phủ khoảng 340 pixel thế giới quanh mình.
 */
export const SYNC_VIEW = { r: 560, out: 660, fx: 760, wake: 660, cell: 128, mini: 1 };

export interface BeastDef {
  /** Mã cố định (sprite `beast_{id}`, thuộc tính `beasts` của vùng trong Tiled). Không đổi mã đã dùng. */
  id: string;
  name: string;
}

/** Hồn thú theo loài, tên theo bảng Ngoại vi / Nội địa ở mục 5.3. Thêm loài mới vào cuối mảng (state đồng bộ theo chỉ số). */
export const BEASTS: BeastDef[] = [
  { id: "phong_lang",             name: "Phong Lang" },
  { id: "man_da_la_xa",           name: "Mạn Đà La Xà" },
  { id: "tu_van_bao",             name: "Tử Văn Báo" },
  { id: "quy_dang",               name: "Quỷ Đằng" },
  { id: "loi_van_hau",            name: "Lôi Văn Hầu" },
  { id: "quy_ho",                 name: "Quỷ Hổ" },
  { id: "nhan_dien_ma_chu",       name: "Nhân Diện Ma Chu" },
  { id: "u_minh_lang",            name: "U Minh Lang" },
  { id: "am_kim_khung_trao_hung", name: "Ám Kim Khủng Trảo Hùng" },
  { id: "kiem_vi_hat",            name: "Kiếm Vĩ Hạt" },
  { id: "quy_anh_bao",            name: "Quỷ Ảnh Báo" },
  // Từ 3.2 tuổi hồn thú theo `years` của vùng (bảng 5.3), không theo loài; Xích Lân Mãng là loài thường của Nội địa.
  { id: "xich_lan_mang",          name: "Xích Lân Mãng" },
  // Thánh Hồn Thôn (BĐ2, bảng 5.3): 10–450 năm.
  { id: "nhu_cot_tho_hoang",      name: "Nhu Cốt Thỏ hoang" },
  { id: "dien_thu",               name: "Điền Thử" },
  { id: "hoi_vu_tuoc",            name: "Hôi Vũ Tước" },
  { id: "phong_lang_con",         name: "Phong Lang con" },
  { id: "doc_cham_phong",         name: "Độc Châm Phong" },
  { id: "thiet_giap_xuyen_son_giap", name: "Thiết Giáp Xuyên Sơn Giáp" },
  { id: "hac_boi_da_tru",         name: "Hắc Bối Dã Trư" },
  { id: "thanh_lan_xa",           name: "Thanh Lân Xà" },
  { id: "quy_dang_non",           name: "Quỷ Đằng non" },
  // BĐ3: loài còn thiếu của Ngoại vi (Khe suối, Rìa nội địa) và Nội địa (Đầm sương độc, Lôi Cốc). Quỷ Đằng ngàn năm dùng lại `quy_dang`.
  { id: "thanh_lan_ngac",         name: "Thanh Lân Ngạc" },
  { id: "kim_linh_ung",           name: "Kim Linh Ưng" },
  { id: "nhan_dien_ma_chu_non",   name: "Nhân Diện Ma Chu non" },
  { id: "liet_trao_hung",         name: "Liệt Trảo Hùng" },
  { id: "thiet_giap_te_nguu",     name: "Thiết Giáp Tê Ngưu" },
  { id: "that_tinh_doc_thiem",    name: "Thất Tinh Độc Thiềm" },
  { id: "hac_vu_bien_buc",        name: "Hắc Vụ Biên Bức" },
  { id: "lam_loi_te_nguu",        name: "Lam Lôi Tê Ngưu" },
  { id: "loi_duc_ung",            name: "Lôi Dực Ưng" },
  // BĐ6b: Lạc Nhật Sâm Lâm (5.000–30.000 năm, thực vật / độc), theo vùng: Rừng hoa độc, Đầm Bích Lân, Băng Hỏa Tuyền, Lưỡng Nghi Nhãn.
  { id: "thuc_nhan_hoa",          name: "Thực Nhân Hoa" },
  { id: "cuc_yeu_hoa_linh",       name: "Cúc Yêu Hoa Linh" },
  { id: "doc_cuc_dang",           name: "Độc Cức Đằng" },
  { id: "bich_lan_xa",            name: "Bích Lân Xà" },
  { id: "doc_vu_thiem",           name: "Độc Vụ Thiềm" },
  { id: "hac_thuy_mang",          name: "Hắc Thủy Mãng" },
  { id: "liet_hoa_tich_dich",     name: "Liệt Hỏa Tích Dịch" },
  { id: "huyen_bang_thiem",       name: "Huyền Băng Thiềm" },
  { id: "hoa_linh_diep",          name: "Hỏa Linh Điệp" },
  { id: "co_moc_thu_nhan",        name: "Cổ Mộc Thụ Nhân" },
  { id: "y_la_hoa_yeu",           name: "Ỷ La Hoa Yêu" },
  { id: "thanh_lan_doc_co",       name: "Thanh Lân Độc Cổ" },
  // BĐ6c: hồn thú băng của Cực Bắc Chi Địa (20.000–80.000 năm), theo vùng từ nam lên bắc.
  { id: "tuyet_lang",             name: "Tuyết Lang" },
  { id: "bang_nguyen_cu_tuong",   name: "Băng Nguyên Cự Tượng" },
  { id: "bang_vu_ung",            name: "Băng Vũ Ưng" },
  { id: "bang_giap_cu_quy",       name: "Băng Giáp Cự Quy" },
  { id: "tuyet_vi_yeu_ho",        name: "Tuyết Vĩ Yêu Hồ" },
  { id: "bang_tinh_hat",          name: "Băng Tinh Hạt" },
  { id: "han_bang_dia_long",      name: "Hàn Băng Địa Long" },
  { id: "bang_phong_bach_hung",   name: "Băng Phong Bạch Hùng" },
  { id: "han_nguyet_ung",         name: "Hàn Nguyệt Ưng" },
  { id: "bang_bich_hat",          name: "Băng Bích Hạt" },
  { id: "huyen_minh_bang_tam",    name: "Huyền Minh Băng Tằm" },
  { id: "tuyet_ma_vien",          name: "Tuyết Ma Viên" },
  // BĐ6d: Hải Thần Đảo / Ma Quỷ Hải Vực (50.000–100.000 năm, biển), theo vùng: Bãi san hô, Ma Quỷ Hải Vực, Vách Hải Thần, Hải Thần Uyên.
  { id: "thiet_giap_cu_giai",     name: "Thiết Giáp Cự Giải" },
  { id: "lam_lan_hai_xa",         name: "Lam Lân Hải Xà" },
  { id: "kiem_ngu",               name: "Kiếm Ngư" },
  { id: "quy_dien_hai_yeu",       name: "Quỷ Diện Hải Yêu" },
  { id: "tham_hai_ma_chuong",     name: "Thâm Hải Ma Chương" },
  { id: "loi_quang_hai_dieu",     name: "Lôi Quang Hải Diêu" },
  { id: "kim_lan_long_quy",       name: "Kim Lân Long Quy" },
  { id: "huyet_nha_cu_sa",        name: "Huyết Nha Cự Sa" },
  { id: "loi_van_hai_ung",        name: "Lôi Vân Hải Ưng" },
  { id: "tham_hai_ma_kinh",       name: "Thâm Hải Ma Kình" },
  { id: "u_linh_hai_mau",         name: "U Linh Hải Mẫu" },
  // BĐ6e: loài gốc của 2 boss thế giới 100.000 năm ở Lõi Tinh Đấu (không vùng nào sinh; dùng cho chỉ số, sprite, hồn cốt).
  { id: "thai_than_cu_vien",      name: "Thái Thản Cự Viên" },
  { id: "thien_thanh_nguu_mang",  name: "Thiên Thanh Ngưu Mãng" },
];

const BEAST_INDEX = new Map(BEASTS.map((b, i) => [b.id, i]));
/** Chỉ số trong BEASTS của một mã loài (-1 nếu không có). */
export const beastIndex = (id: string) => BEAST_INDEX.get(id) ?? -1;

// ---------- Võ hồn ----------
export type He = "cuong_cong" | "man_cong" | "khong_che" | "phu_tro";
export type Rarity = "SR" | "SSR" | "UR";

interface Mult { atk: number; hp: number; mp: number; spd: number; def: number; }

/** 4 hệ võ hồn. `def` là hệ số sát thương phải chịu (nhỏ hơn = lì đòn hơn). */
export const HE: Record<He, { name: string } & Mult> = {
  cuong_cong: { name: "Cường công", atk: 1.15, hp: 1,    mp: 1,    spd: 1,    def: 1 },
  man_cong:   { name: "Mẫn công",   atk: 1.05, hp: 0.9,  mp: 1,    spd: 1.15, def: 1 },
  khong_che:  { name: "Khống chế",  atk: 0.95, hp: 1.05, mp: 1.15, spd: 1,    def: 0.95 },
  phu_tro:    { name: "Phụ trợ",    atk: 0.85, hp: 1.1,  mp: 1.35, spd: 1,    def: 0.9 },
};
/** Thứ tự cố định của 4 hệ khi đồng bộ (BeastState.weak = 1 + chỉ số, BĐ6e). Chỉ thêm vào cuối. */
export const HE_IDS: readonly He[] = ["cuong_cong", "man_cong", "khong_che", "phu_tro"];
export const RARITY_MULT: Record<Rarity, number> = { SR: 0.95, SSR: 1, UR: 1.08 };

export interface VoHonDef extends Mult {
  /** Mã cố định lưu trong DB. Không bao giờ đổi mã đã dùng. */
  id: string;
  name: string; he: He; rarity: Rarity;
  owner: string;   // chủ nhân trong truyện (nhân vật đại diện)
  flows: string[]; // lưu phái
  trait: string;   // mô tả ngắn hiện khi thức tỉnh
  col: string; robe: string;
}

function vh(id: string, name: string, he: He, rarity: Rarity, owner: string, flows: string[],
  col: string, robe: string, trait: string): VoHonDef {
  const b = HE[he], r = RARITY_MULT[rarity];
  return { id, name, he, rarity, owner, flows, col, robe, trait,
    atk: +(b.atk * r).toFixed(3), hp: +(b.hp * r).toFixed(3), mp: b.mp, spd: b.spd, def: b.def };
}

/** Danh sách võ hồn (GAME_DESIGN.md mục 5.1). Thứ tự trong mảng chỉ dùng để đồng bộ, DB lưu theo `id`. */
export const VOHON: VoHonDef[] = [
  // SSR cơ bản – cường công
  vh("cuu_tinh_that_sat_kiem", "Cửu Tinh Thất Sát Kiếm", "cuong_cong", "SSR", "Kiếm Đấu La Trần Tâm", ["Phá giáp"],
    "#cfe3ff", "#3c4f70", "Vô Ngã Kiếm Trận quét diện rộng, gây Liệt thương giảm thủ."),
  vh("lam_dien_ba_vuong_long", "Lam Điện Bá Vương Long", "cuong_cong", "SSR", "Ngọc Thiên Hằng", ["Cảm điện"],
    "#5ab8ff", "#1f3f8f", "Sấm sét gây Cảm điện; đầy Phong Lôi Chi Lực thì tung Lôi Động Minh Thiên."),
  vh("ky_nhung_thong_thien_cuc", "Kỳ Nhung Thông Thiên Cúc", "cuong_cong", "SSR", "Cúc Đấu La Nguyệt Quan", ["Thiêu đốt", "Phá giáp"],
    "#ffb347", "#8a4a12", "Cánh hoa sát thương liên tục, hạn chế di chuyển kẻ địch."),
  vh("ta_hoa_phuong_hoang", "Tà Hỏa Phượng Hoàng", "cuong_cong", "SSR", "Mã Hồng Tuấn", ["Thiêu đốt"],
    "#ff6a2a", "#8f2a14", "Bay, thiêu đốt diện rộng; trong lãnh vực phượng hoàng địch nhận thêm sát thương."),
  // SSR cơ bản – mẫn công
  vh("u_minh_linh_mieu", "U Minh Linh Miêu", "man_cong", "SSR", "Chu Trúc Thanh", ["Chấn đãng"],
    "#b06bff", "#3e2266", "Tốc độ và chí mạng cao, cào liên hoàn."),
  vh("nguyet_nhan", "Nguyệt Nhận", "man_cong", "SSR", "Tà Nguyệt", ["Thiêu đốt", "Phá giáp"],
    "#e6e6f0", "#4a4a5e", "Lướt xuyên hàng trước, hạ nhanh mục tiêu yếu máu."),
  vh("hoa_long", "Hỏa Long", "man_cong", "SSR", "Hỏa Vô Song", ["Thiêu đốt"],
    "#ff4a2a", "#7a1c10", "Đánh tầm xa phạm vi rộng; Viêm bạo kích nổ thiêu đốt."),
  vh("nhu_cot_tho", "Nhu Cốt Thố", "man_cong", "SSR", "Tiểu Vũ", ["Chấn đãng"],
    "#ffc2e2", "#c86a9a", "Lướt, quật ngã, tăng chí mạng và hút máu."),
  vh("kim_vu_mieu_ung", "Kim Vũ Miêu Ưng", "man_cong", "SSR", "", ["Cảm điện"],
    "#ffd54a", "#7a5a12", "Bay, vuốt gây tê liệt và câm lặng; áo nghĩa phủ Cảm điện toàn vùng."),
  // SSR cơ bản – khống chế
  vh("tu_vong_chu_hoang", "Tử Vong Chu Hoàng", "khong_che", "SSR", "Bỉ Bỉ Đông", ["Trúng độc", "Cảm điện"],
    "#9a4aff", "#2a1240", "Giăng tơ gom quái, độc nhện khống chế."),
  vh("bich_lan_xa_hoang", "Bích Lân Xà Hoàng", "khong_che", "SSR", "Độc Đấu La Độc Cô Bác", ["Trúng độc"],
    "#3ad98a", "#145a38", "Trúng độc cộng dồn, câm lặng diện rộng; Vạn Xà Phệ Tâm hút máu."),
  vh("can_khon_hon_nguyen_toa", "Càn Khôn Hỗn Nguyên Tỏa", "khong_che", "SSR", "", ["Cảm điện"],
    "#e0b04a", "#5e4a18", "Tạo vùng phong tỏa giam kẻ địch, cộng dồn gây Dễ thương."),
  vh("hoa_anh", "Hỏa Ảnh", "khong_che", "SSR", "", ["Thiêu đốt"],
    "#ff3a4a", "#701822", "Choáng, thiêu đốt, đẩy lùi; gây Dễ thương cho đồng đội đánh."),
  vh("yeu_ho", "Yêu Hồ", "khong_che", "SSR", "Hồ Liệt Na", ["Cảm điện"],
    "#ff9ad5", "#7a2a5a", "Mê hoặc cộng dồn, ảo ảnh tàng hình, lãnh vực làm chậm."),
  // SSR cơ bản – phụ trợ
  vh("xuc_xich", "Xúc Xích", "phu_tro", "SSR", "Áo Tư Tạp", ["Cảm điện"],
    "#e8875a", "#6a3a22", "Hồi hồn lực, giải khống chế; áo nghĩa sao chép kỹ năng đồng đội."),
  vh("quy_mi", "Quỷ Mị", "phu_tro", "SSR", "Quỷ Đấu La", ["Bùng nổ"],
    "#8a8aff", "#22224a", "Biến sát thương thành hồi máu; Quỷ Ảnh Trùng Trùng tàng hình cả đội."),
  vh("thien_can_bach_ngoc_dinh", "Thiên Càn Bạch Ngọc Đỉnh", "phu_tro", "SSR", "", ["Đánh boss"],
    "#f0e0a0", "#6a5a2a", "Hồi máu và khiên; xóa buff địch, thanh tẩy đồng đội."),
  // Ngoài danh sách SSR cơ bản
  vh("lam_ngan_thao", "Lam Ngân Thảo", "khong_che", "SR", "Đường Tam", ["Chấn đãng"],
    "#4ab0ff", "#1f4a6b", "Gom quái, trói; tuyệt kỹ kéo cả vùng lại và giam."),
  vh("hao_thien_chuy", "Hạo Thiên Chùy", "cuong_cong", "UR", "Đường Hạo", ["Chấn đãng"],
    "#9aa0b4", "#22222c", "Sát thương theo % máu; Loạn Phi Phong Chùy Pháp kết thúc bằng hất tung."),
  vh("cuu_bao_luu_ly_thap", "Cửu Bảo Lưu Ly Tháp", "phu_tro", "UR", "Ninh Vinh Vinh", ["Thiêu đốt"],
    "#7ef0ff", "#2a6a7a", "Tăng công, thủ, tốc cho đội; Vô Địch Thần Quang miễn sát thương."),
  // Bước 8.3: 4 võ hồn ngoài danh sách SSR cơ bản (EXTRA_VOHON; hệ, độ hiếm, chủ nhân, lưu phái đã chốt). Chỉ mở bằng mảnh.
  vh("pha_hon_thuong", "Phá Hồn Thương", "cuong_cong", "SSR", "", ["Phá giáp"],
    "#7fe0d0", "#1f4a48", "Trường thương lướt đâm xuyên hàng, Phá giáp; phá hồn gây Câm lặng ngắt chiêu."),
  vh("a_ngan", "A Ngân", "phu_tro", "SSR", "A Ngân (Lam Ngân Hoàng, mẫu thân Đường Tam)", ["Chấn đãng"],
    "#7fd8ff", "#24527a", "Lam Ngân Hoàng mười vạn năm: hồi máu, khiên cho đội; dây Lam Ngân trói và gây Dễ thương."),
  vh("liet_hoa_thuong_lang", "Liệt Hỏa Thương Lang", "man_cong", "SR", "", ["Thiêu đốt"],
    "#ff7a3a", "#4a3a3a", "Sói lửa lao vồ, cắn xé liên hoàn chồng Thiêu đốt; tiếng tru tăng tốc."),
  vh("bang_phuong_hoang", "Băng Phượng Hoàng", "khong_che", "SSR", "Thủy Băng Nhi", ["Băng phong"],
    "#a8e8ff", "#2a5a8a", "Bay, băng phong diện rộng: đóng băng (Choáng), Làm chậm, gây Dễ thương."),
];

const VOHON_INDEX = new Map(VOHON.map((v, i) => [v.id, i]));
/** Chỉ số trong VOHON của một mã võ hồn (-1 nếu không có). */
export const vohonIndex = (id: string) => VOHON_INDEX.get(id) ?? -1;

// ---------- Lễ thức tỉnh, đội hình và đổi võ hồn ----------
/** Võ hồn tặng cho mọi tài khoản khi thức tỉnh. */
export const AWAKEN_GIFT = "lam_ngan_thao";
/**
 * Võ hồn thêm ở bước 8.3 (mục 5.1 "Võ hồn ngoài danh sách SSR cơ bản"): chỉ mở bằng mảnh (MapDef.shards, ARENA_SHARDS; rương thú vương của bản đồ rơi mảnh),
 * không vào lựa chọn thức tỉnh dù có độ hiếm SSR.
 */
export const EXTRA_VOHON = ["pha_hon_thuong", "a_ngan", "liet_hoa_thuong_lang", "bang_phuong_hoang"];
/** Võ hồn được tự chọn khi thức tỉnh: mọi SSR cơ bản (17 võ hồn, không gồm EXTRA_VOHON). */
export const AWAKEN_CHOICES = VOHON.filter((v) => v.rarity === "SSR" && !EXTRA_VOHON.includes(v.id));
/** Số ô của đội hình võ hồn (mục 3, 5.1). Bảng `teams` lưu ô 0..TEAM_SIZE-1. */
export const TEAM_SIZE = 4;
/** Hồi chiêu sau mỗi lần đổi võ hồn trong đội khi đang đánh (giây, mục 5.1 "Trong trận"). */
export const SWITCH_CD = 3;
/** Đổi đội hình (thay võ hồn khác vào đội): phải rời giao chiến (không đánh, không bị đánh) ít nhất ngần này giây. */
export const TEAM_COMBAT_SECS = 5;
/**
 * Võ hồn đã gục hồi lại (đầy sinh lực) sau ngần này giây ngoài trận (mục 5.1 "Trong trận"). Đồng hồ chỉ chạy khi
 * không giao chiến (như TEAM_COMBAT_SECS), giao chiến thì dừng lại chứ không đếm lại từ đầu. Về doanh trại thì hồi ngay.
 */
export const REVIVE_SECS = 60;
/** Cả đội gục: sau ngần này giây hồn sư về doanh trại, cả đội hồi đầy (không mất kinh nghiệm hay đồ, mục 2). */
export const RESPAWN_SECS = 2.5;
/**
 * Hồi sinh lực / hồn lực của hồn sư mỗi giây (mục 4 "Hồi sinh lực và hồn lực"), server tính trong `MapRoom.regenPlayer`:
 * - hồn lực: `mp` + `mpLevel` × cấp; võ hồn nhiều hồn lực (`VOHON[].mp` > 1) nhân `mpRich`;
 * - sinh lực: không bị đánh quá `calmSecs` giây thì `hpCalm` × sinh lực tối đa, không thì `hpHit` điểm. Võ hồn khác trong đội
 *   (chưa gục) hồi sinh lực cùng nhịp theo sinh lực tối đa của chính nó.
 */
export const PLAYER_REGEN = { mp: 4, mpLevel: 0.15, mpRich: 1.5, calmSecs: 5, hpCalm: 0.04, hpHit: 1.5 };
/** Trong vùng an toàn (cả bản đồ thành, vùng `safe` trong bản đồ săn) sinh lực và hồn lực hồi nhanh gấp ngần này lần ngoài rừng. */
export const SAFE_REGEN_MULT = 3;
/** Sinh lực hồi mỗi giây (PLAYER_REGEN): `lastHit` là số giây kể từ lần cuối bị đánh, `safe` đang đứng trong vùng an toàn. */
export const hpRegen = (maxHp: number, lastHit: number, safe: boolean) =>
  (lastHit > PLAYER_REGEN.calmSecs ? maxHp * PLAYER_REGEN.hpCalm : PLAYER_REGEN.hpHit) * (safe ? SAFE_REGEN_MULT : 1);
/** Hồn lực hồi mỗi giây (PLAYER_REGEN): `vohonMp` là hệ số hồn lực của võ hồn ra trận (`VOHON[].mp`). */
export const mpRegen = (level: number, vohonMp: number, safe: boolean) =>
  (PLAYER_REGEN.mp + level * PLAYER_REGEN.mpLevel) * (vohonMp > 1 ? PLAYER_REGEN.mpRich : 1) * (safe ? SAFE_REGEN_MULT : 1);
/** Chia kinh nghiệm hạ hồn thú cho đội (mục 5.1): võ hồn ra trận 40%, mỗi võ hồn khác trong đội 20%. Ô trống, võ hồn ở bình cảnh: phần đó bỏ đi. */
export const XP_SHARE_ACTIVE = 0.4;
export const XP_SHARE_BENCH = 0.2;

// ---------- Tổ đội người chơi (mục 5.9, bước 7.1) ----------
/** Số người tối đa một tổ đội (mục 5.9). */
export const PARTY_MAX = 4;
/**
 * Hạ hồn thú: thành viên tổ đội của người hạ ở cùng phòng (cùng bản đồ, cùng kênh), chưa gục, đứng cách chỗ hồn thú gục dưới ngần
 * này pixel thì cùng chia kinh nghiệm (mục 5.9 "khoảng 300px").
 */
export const PARTY_XP_RANGE = 300;
/** Mỗi người cùng chia làm tổng kinh nghiệm tăng thêm ngần này (mục 5.9 "mỗi người thêm 5%"; đã chốt). */
export const PARTY_XP_BONUS = 0.05;
/**
 * Phần kinh nghiệm gốc mỗi người nhận khi `n` người cùng chia: tổng = gốc × (1 + PARTY_XP_BONUS × (n − 1)), chia đều (2 người
 * 52,5%, 3 người 36,7%, 4 người 28,75%; đã chốt). Sau đó mỗi người tự giảm theo chênh cấp của võ hồn ra trận của mình
 * (xpLevelScale) và chia 40/20 cho đội võ hồn (XP_SHARE_ACTIVE / XP_SHARE_BENCH).
 */
export function partyXpShare(n: number) {
  const k = Math.max(1, Math.floor(n));
  return (1 + PARTY_XP_BONUS * (k - 1)) / k;
}
/**
 * Hiệu ứng phụ trợ lan cho đồng đội (bước 9.1, đã chốt 2026-10-20): hồn kỹ, tiên cơ, Chân Thân tung khi võ hồn hệ Phụ trợ ra trận có
 * hiệu ứng lên bản thân (`SkillDef.self`: hiệu ứng có lợi, hồi sinh lực, khiên, hồn lực) thì thành viên tổ đội cùng phòng, chưa gục,
 * không đang đi cổng, ngoài vùng an toàn, đứng trong PARTY_BUFF_R pixel quanh người tung cũng nhận, mức × PARTY_BUFF_MULT
 * (người tung vẫn ×1); thanh tẩy lan tới đồng đội hợp lệ nhưng không nhân hệ số. Kỹ năng hồn cốt chỉ chia phần `self`, không chia
 * sát thương / trạng thái lên hồn thú. Số bán kính và hệ số đặt ở đây để server dùng chung.
 */
export const PARTY_BUFF_R = 160;
export const PARTY_BUFF_MULT = 0.7;
/**
 * Hiệu ứng có lợi không bao giờ lan cho đồng đội: lãnh vực phượng hoàng (đã tác dụng lên hồn thú cho cả phòng). Tàng hình chỉ lan khi
 * hồn kỹ gốc là của võ hồn Phụ trợ ("cả đội tàng hình" của Quỷ Mị; tàng hình của Yêu Hồ chép bằng Phục Chế thì không).
 */
export const PARTY_BUFF_SKIP: readonly BuffId[] = ["phoenix"];
/**
 * Phục Chế chép hồn kỹ của đồng đội tổ đội (bước 9.3, đã chốt 2026-10-20): Phục Chế Hương Tràng (`SkillDef.copy`) chép hồn kỹ gần
 * nhất về thời gian do võ hồn khác trong đội của mình hoặc đồng đội tổ đội cùng phòng đứng trong COPY_R pixel tung trong COPY_WINDOW
 * giây (cả hai nguồn cùng cửa sổ). Không chép tuyệt kỹ, Chân Thân, tiên cơ, kỹ năng hồn cốt, hồn kỹ của võ hồn có Phục Chế.
 */
export const COPY_R = 200;
export const COPY_WINDOW = 8;
/** Lời mời vào tổ đội hết hạn sau ngần này giây (đã chốt). */
export const PARTY_INVITE_SECS = 60;
/**
 * Thành viên rời game (đóng tab, mất mạng) quá ngần này giây mà chưa vào lại thì tự rời tổ đội (đã chốt); đi cổng sang bản đồ
 * khác vẫn ở trong tổ đội.
 */
export const PARTY_OFFLINE_SECS = 60;

// ---------- Năng lượng và chiêu tiên cơ (mục 5.1 "Trong trận"; mọi số dưới đây đã chốt) ----------
/** Năng lượng tối đa của mỗi võ hồn trong đội. Đủ mức này thì đổi tay vào sẽ tung chiêu tiên cơ, dùng hết năng lượng. */
export const TIEN_CO_MAX = 100;
/**
 * Năng lượng mỗi võ hồn khác trong đội (không ra trận, chưa gục) nhận khi võ hồn ra trận đánh trúng: tính một lần cho mỗi đòn
 * đánh thường / mỗi lần tung hồn kỹ trúng ít nhất một hồn thú (10 mũi Hồn Tiễn vẫn là một lần). Võ hồn ra trận không tự tích;
 * đòn tiên cơ không tạo năng lượng (tránh nối tiên cơ vô hạn).
 */
export const TIEN_CO_GAIN = { attack: 10, skill: 20 };
/** Ra khỏi giao chiến (không đánh trúng, không bị đánh) quá ngần này giây thì năng lượng cả đội giảm dần TIEN_CO_DECAY mỗi giây. */
export const TIEN_CO_IDLE_SECS = 10;
export const TIEN_CO_DECAY = 10;
/** Bộ hồn hạch Tiên Cơ (mục 5.6, làm ở GĐ5): 2 món +20% tốc độ tích năng lượng, 4 món +35% sát thương chiêu tiên cơ. */
export const TIEN_CO_SET = { gain: 0.2, dmg: 0.35 };
/** Năng lượng một võ hồn nhận được cho một lần đánh trúng loại `kind`; `set2`: võ hồn đó gắn đủ 2 món bộ Tiên Cơ. */
export const energyGain = (kind: keyof typeof TIEN_CO_GAIN, set2 = false) => TIEN_CO_GAIN[kind] * (set2 ? 1 + TIEN_CO_SET.gain : 1);
/** Hệ số sát thương chiêu tiên cơ; `set4`: võ hồn tung chiêu gắn đủ 4 món bộ Tiên Cơ. */
export const tienCoDmgMult = (set4 = false) => (set4 ? 1 + TIEN_CO_SET.dmg : 1);
/**
 * Chiêu tiên cơ chung theo hệ (bước 2.4) cho võ hồn chưa có tiên cơ riêng (TIEN_CO_RIENG, bước 2.5a). Sát thương `dmg` là bội số công của võ hồn
 * vừa đổi vào (không dao động ngẫu nhiên, vẫn có thể chí mạng). Trường không dùng để 0.
 * - `r`: bán kính (pixel) quanh hồn sư; `dash`: quãng lướt tối đa, `range`: tầm tìm mục tiêu (mẫn công);
 * - `stun`: giây choáng (hồn thú không đi, không đánh); `heal`: hồi theo tỉ lệ sinh lực tối đa của mọi võ hồn chưa gục trong đội;
 * - `shield`: khiên theo tỉ lệ sinh lực tối đa của võ hồn ra trận, giữ `shieldSecs` giây (khiên thuộc hồn sư, đổi võ hồn vẫn còn).
 * Từ 2.5d mọi võ hồn trong VOHON đều có tiên cơ riêng; bảng này giữ làm dự phòng cho võ hồn thêm sau.
 */
export interface TienCoDef { name: string; desc: string; dmg: number; r: number; dash: number; range: number; stun: number; heal: number; shield: number; shieldSecs: number; }
export const TIEN_CO: Record<He, TienCoDef> = {
  cuong_cong: { name: "Bạo Liệt", desc: "nổ sát thương diện rộng quanh thân", dmg: 3,   r: 56, dash: 0,  range: 0,   stun: 0,   heal: 0,    shield: 0,   shieldSecs: 0 },
  man_cong:   { name: "Thiểm Sát", desc: "lướt tới hồn thú gần nhất, chém mạnh một mục tiêu", dmg: 5, r: 0, dash: 90, range: 110, stun: 0, heal: 0, shield: 0, shieldSecs: 0 },
  khong_che:  { name: "Phong Tỏa", desc: "choáng mọi hồn thú quanh thân", dmg: 1.2, r: 64, dash: 0,  range: 0,   stun: 1.5, heal: 0,    shield: 0,   shieldSecs: 0 },
  phu_tro:    { name: "Hộ Thể", desc: "hồi sinh lực cả đội, tạo khiên cho hồn sư", dmg: 0,   r: 0,  dash: 0,  range: 0,   stun: 0,   heal: 0.25, shield: 0.2, shieldSecs: 5 },
};

/**
 * Kiểm tra hình dạng đội hình: mảng đúng TEAM_SIZE ô, mỗi ô là mã dòng võ hồn (vohons.id, số nguyên dương) hoặc 0 = trống,
 * không trùng nhau, có ít nhất một võ hồn. Sai thì null. Võ hồn có thuộc tài khoản hay không do server kiểm tra riêng.
 */
export function parseTeam(x: unknown): number[] | null {
  if (!Array.isArray(x) || x.length !== TEAM_SIZE) return null;
  if (!x.every((v) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0)) return null;
  const ids = x.filter((v) => v > 0);
  return ids.length && new Set(ids).size === ids.length ? [...x] : null;
}

// ---------- Ngoại hình hồn sư khi tạo nhân vật (mục 3, 5.11) ----------
/** Giới tính, chỉ số là cột `sex` (0 nam, 1 nữ); sprite dùng hậu tố `m` / `f`. */
export const SEXES = ["Nam", "Nữ"] as const;
/** Tên 4 kiểu tóc theo giới tính: `HAIR_STYLES[sex][hair]`; mỗi kiểu là một bộ sprite `hs_{body,outfit,hair}_{m/f}_{hair}` (mục 5.11). */
export const HAIR_STYLES = [
  ["Ngắn rối", "Dài buộc thấp sau gáy", "Dựng nhọn", "Mái dài che một bên mắt"],
  ["Dài thả thẳng", "Đuôi ngựa cao", "Bím dài một bên", "Ngắn ngang vai, có mái"],
] as const;
/** Một màu tóc / áo: dải 4 sắc tối → sáng thay cho dải xám chuẩn khi hoán màu (mục 5.11). */
export interface SwatchDef { name: string; ramp: readonly [string, string, string, string]; }
// Mọi sắc độ lấy từ art/palette.gpl, không thêm màu mới vào bảng màu chung.
/** Màu tóc, chỉ số là cột `hair_col` (texture `hs_hair_…@{chỉ số}`). Chỉ thêm vào cuối mảng. */
export const HAIR_COLORS: SwatchDef[] = [
  { name: "Đen",      ramp: ["#1a1020", "#2b2430", "#47435c", "#5a5672"] },
  { name: "Nâu",      ramp: ["#2a1b14", "#3a2a18", "#5a3b22", "#957d57"] },
  { name: "Vàng kim", ramp: ["#6a4a12", "#b8862a", "#f2c84b", "#fff2b0"] },
  { name: "Bạc",      ramp: ["#3c4f70", "#7a8aa8", "#c0cce0", "#f4f8ff"] },
  { name: "Lam",      ramp: ["#1f4a6b", "#2d6a96", "#5a9cc9", "#c0cce0"] },
  { name: "Hồng",     ramp: ["#a8303a", "#e08a7a", "#ffd2e6", "#ffffff"] },
];
/** Màu áo, chỉ số là cột `outfit_col` (texture `hs_outfit_…@{chỉ số}`). Chỉ thêm vào cuối mảng. */
export const OUTFIT_COLORS: SwatchDef[] = [
  { name: "Lam",   ramp: ["#1f4a6b", "#2d6a96", "#5a9cc9", "#c0cce0"] },
  { name: "Đỏ",    ramp: ["#8f2a14", "#a8303a", "#ff3030", "#e08a7a"] },
  { name: "Lục",   ramp: ["#163a22", "#2f7a2c", "#467e38", "#5a9440"] },
  { name: "Tím",   ramp: ["#2b1a40", "#5d4380", "#8a6bff", "#c0cce0"] },
  { name: "Trắng", ramp: ["#8a87a0", "#c0cce0", "#f4f8ff", "#ffffff"] },
  { name: "Đen",   ramp: ["#1a1020", "#2b2430", "#47435c", "#5a5672"] },
];
/** Một tông da: dải 3 sắc tối → gốc → sáng thay cho 3 sắc da của tông 0 khi hoán màu lớp thân (mục 5.11, Lộ trình 9.9). */
export interface SkinDef { name: string; ramp: readonly [string, string, string]; }
/**
 * Tông da, chỉ số là cột `skin` (texture thân `hs_body_…@{chỉ số}`, tông 0 dùng thẳng sheet gốc). Tông 0 là 3 sắc da
 * sprite đang vẽ (`#f1c7a0`, nhóm "Da " trong art/palette.gpl); 2 tông sau lấy từ cuối palette.gpl. Chỉ thêm vào cuối mảng.
 */
export const SKIN_TONES: SkinDef[] = [
  { name: "Trắng hồng", ramp: ["#c98f6c", "#f1c7a0", "#ffe2c6"] },
  { name: "Bánh mật",   ramp: ["#9c6447", "#c98f6c", "#e3ae88"] },
  { name: "Ngăm",       ramp: ["#5a3b22", "#8a5a3c", "#b07d5a"] },
];
/** Ngoại hình hồn sư: các số nhỏ lưu theo tài khoản, đồng bộ trong PlayerState để người khác thấy. `skin` thêm ở 9.9. */
export interface Looks { sex: number; hair: number; hairCol: number; outfitCol: number; skin: number; }
/** Ngoại hình của tài khoản chưa tự chọn (tài khoản tạo trước bước 2.2a). */
export const DEFAULT_LOOKS: Looks = { sex: 0, hair: 0, hairCol: 0, outfitCol: 0, skin: 0 };
/**
 * Kiểm tra ngoại hình: mỗi trường phải là số nguyên trong khoảng của bảng tương ứng. Sai bất kỳ trường nào thì null.
 * Riêng `skin` (thêm sau, 9.9) thiếu hẳn thì là tông 0, như tài khoản cũ và client cũ; có mà sai thì vẫn null.
 */
export function parseLooks(x: unknown): Looks | null {
  const o = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
  const pick = (k: keyof Looks, n: number) => {
    const v = o[k];
    return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < n ? v : -1;
  };
  const sex = pick("sex", SEXES.length);
  const l: Looks = { sex, hair: pick("hair", HAIR_STYLES[Math.max(0, sex)].length), hairCol: pick("hairCol", HAIR_COLORS.length), outfitCol: pick("outfitCol", OUTFIT_COLORS.length),
    skin: o.skin === undefined || o.skin === null ? 0 : pick("skin", SKIN_TONES.length) };
  return Object.values(l).every((v) => v >= 0) ? l : null;
}

/** Hướng nhìn 4 phía của hồn sư (trường `dir` trong PlayerState): chỉ số trong mảng này. Hướng trái do client lật ngang hướng phải. */
export const DIRS4 = ["down", "right", "up", "left"] as const;
/** Hướng nhìn theo vector di chuyển: trục trội quyết định, chéo đúng 45° thì ưu tiên ngang. */
export const dir4 = (x: number, y: number) => (Math.abs(x) >= Math.abs(y) ? (x >= 0 ? 1 : 3) : y > 0 ? 0 : 2);

// ---------- Trạng thái dùng chung (mục 5.1 "Trạng thái dùng chung"; bước 2.5a, mọi số đã chốt) ----------
/** Thứ tự trong mảng là bit trong `BeastState.st` (bit i = 1 << i). Chỉ thêm vào cuối. */
export const STATUS_IDS = ["burn", "shock", "poison", "vuln", "armor", "stun", "silence", "root",
  // Từ 2.5c (lưu phái Cảm điện): Mị hoặc (cộng dồn thành Mê hoặc), Mê hoặc, Làm chậm, Phong ấn (cộng dồn thành Dễ thương).
  "allure", "charm", "slow", "lock",
  // Từ #116: Đóng băng (chỉ có trên hồn sư, chiêu băng của hồn thú gây).
  "freeze",
  // Từ #163: tầng Hàn (chỉ có trên hồn sư, Cực Hàn của Tà hóa Huyền Minh Băng Giao, BossPhase.cold).
  "chill"] as const;
export type StatusId = (typeof STATUS_IDS)[number];
/**
 * - `secs`: thời gian mặc định (giây); gây lại thì lấy thời gian còn lại dài hơn. `max`: số tầng tối đa (1 = không cộng dồn).
 * - `dot`: sát thương mỗi giây cho mỗi tầng = dot × công người gây × sức mạnh hồn kỹ lúc gây (không chí mạng, không tạo năng lượng tiên cơ).
 * - `amp`: Dễ thương: nhận thêm amp sát thương từ mọi nguồn; Phá giáp trên hồn sư: thêm amp mỗi tầng cho đòn trực tiếp (hồn sư
 *   không có chỉ số thủ).
 * - `shred` (#116): Phá giáp trên hồn thú giảm ngần ấy phần thủ (BEAST_DEF) mỗi tầng; đủ tầng tối đa thì thủ về 0.
 * - `healCut`: Trúng độc giảm hồi máu của hồn thú. `chain` / `chainR`: Cảm điện lan `chain` sát thương đòn trực tiếp sang hồn thú
 *   cảm điện khác trong bán kính `chainR` (một bước, không lan tiếp). `boom`: Viêm bạo kích nổ mọi tầng Thiêu đốt còn lại × boom.
 * - `noMove` / `noAtk`: khống chế (không đi / không đánh thường và không tung chiêu). `noSkill` (từ 3.5): chỉ chặn chiêu, Câm lặng:
 *   hồn thú không tung và bị ngắt chiêu báo trước (vẫn đánh thường); hồn sư không dùng hồn kỹ (vẫn đánh thường). Mọi trạng thái
 *   có `noAtk` hoặc `noSkill` đều ngắt chiêu báo trước đang hiện.
 * Từ 2.5c:
 * - `slow`: giảm tốc độ di chuyển của hồn thú theo tỉ lệ, nhân số tầng (cộng mọi trạng thái, tối đa SLOW_CAP).
 * - `wander`: hồn thú bỏ mục tiêu, đi lung tung (Mê hoặc); đi kèm `noAtk`.
 * - `burst`: đủ `max` tầng thì xóa trạng thái này và gây trạng thái `s` (thời gian `secs`, mặc định của `s`): Mị hoặc đủ tầng
 *   thành Mê hoặc, Phong ấn đủ tầng thành Dễ thương 6,8 giây.
 */
export interface StatusDef {
  name: string; col: string; secs: number; max: number;
  dot: number; amp: number; shred: number; healCut: number; chain: number; chainR: number; boom: number;
  noMove: boolean; noAtk: boolean; noSkill: boolean;
  slow: number; wander: boolean; burst?: { s: StatusId; secs?: number };
}
const st = (name: string, col: string, secs: number, max: number, o: Partial<StatusDef> = {}): StatusDef =>
  ({ name, col, secs, max, dot: 0, amp: 0, shred: 0, healCut: 0, chain: 0, chainR: 0, boom: 0, noMove: false, noAtk: false, noSkill: false, slow: 0, wander: false, ...o });
export const STATUS: Record<StatusId, StatusDef> = {
  burn:    st("Thiêu đốt", "#ff7a2a", 4, 5, { dot: 0.25, boom: 1.5 }),
  shock:   st("Cảm điện",  "#7fd0ff", 6, 1, { chain: 0.4, chainR: 64 }),
  poison:  st("Trúng độc", "#6ee06a", 6, 5, { dot: 0.18, healCut: 0.5 }),
  vuln:    st("Dễ thương", "#ff6b9a", 5, 1, { amp: 0.25 }),
  armor:   st("Phá giáp",  "#c0cce0", 6, 3, { amp: 0.1, shred: 1 / 3 }),
  stun:    st("Choáng",    "#ffe08a", 1.5, 1, { noMove: true, noAtk: true }),
  silence: st("Câm lặng",  "#b58cff", 3, 1, { noSkill: true }), // từ 3.5 không còn chặn đánh thường của hồn thú
  root:    st("Trói",      "#4ab0ff", 2, 1, { noMove: true }),
  // Từ 2.5c (đã chốt): Yêu Hồ cộng dồn Mị hoặc (mỗi tầng chậm 15%), đủ 3 tầng thì Mê hoặc 2,5 giây; Càn Khôn Hỗn Nguyên Tỏa
  // cộng dồn Phong ấn, đủ 3 tầng thì Dễ thương 6,8 giây. Đang Mê hoặc thì không nhận thêm Mị hoặc (không khống chế nối liền).
  allure:  st("Mị hoặc",   "#ff9ad5", 5, 3, { slow: 0.15, burst: { s: "charm" } }),
  charm:   st("Mê hoặc",   "#ff5ab8", 2.5, 1, { noAtk: true, wander: true }),
  slow:    st("Làm chậm",  "#a0c8ff", 2, 1, { slow: 0.4 }),
  lock:    st("Phong ấn",  "#e0b04a", 6, 3, { burst: { s: "vuln", secs: 6.8 } }),
  // Từ #116: Đóng băng trên hồn sư: như Choáng (không đi, không đánh, không dùng hồn kỹ), hình khối băng; thời gian ghi ở từng chiêu.
  freeze:  st("Đóng băng", "#9ad8ff", 1.5, 1, { noMove: true, noAtk: true }),
  // Từ #163 (thiết kế gốc đã chốt): tầng Hàn của Cực Hàn tự nó không gây gì; đủ 4 tầng thì bùng phát thành Đóng băng 3 giây. Tầng chỉ
  // mất theo luật Cực Hàn (Hỏa Đàn, thanh tẩy, rời hang, cả đội gục, thú vương bị hạ / rút đi; server/src/rooms/cold.ts), không tự hết giờ.
  chill:   st("Hàn",       "#d8f2ff", Infinity, 4, { burst: { s: "freeze", secs: 3 } }),
};
/** Tốc độ hồn thú giảm tối đa ngần này dù chồng nhiều trạng thái làm chậm (2.5c). */
export const SLOW_CAP = 0.8;
export const statusBit = (s: StatusId) => 1 << STATUS_IDS.indexOf(s);
/** Trạng thái sát thương theo thời gian gây sát thương mỗi ngần này giây. */
export const STATUS_TICK = 1;
/** Thời gian khống chế (noMove / noAtk) nhân theo bậc hồn thú: hồn thú vạn năm, 10 vạn năm bị khống chế ngắn hơn. */
export const CC_TIER_MULT = [1, 1, 1, 0.75, 0.5];
/**
 * Trạng thái trên hồn sư (từ 3.5, đã chốt): chỉ chiêu báo trước của hồn thú gây, cùng bảng STATUS và luật cộng tầng. Choáng, Đóng
 * băng (#116): không đi, không đánh, không dùng hồn kỹ; Mê hoặc (#116): không đánh, không dùng hồn kỹ, phím bị bỏ qua, server tự đi
 * lung tung quanh chỗ bị Mê hoặc (PLAYER_CHARM); Trói: không đi; Câm lặng: không dùng hồn kỹ; Làm chậm: giảm tốc (tối đa SLOW_CAP); Trúng độc /
 * Thiêu đốt: mỗi tầng `dot` × sát thương đòn thường của hồn thú mỗi giây; Dễ thương / Phá giáp: nhận thêm sát thương; Cảm điện: đòn
 * của hồn thú trúng hồn sư Cảm điện lan `chain` sang hồn sư Cảm điện khác trong `chainR`. Thuộc hồn sư nên đổi võ hồn vẫn còn; vào
 * vùng an toàn, cả đội gục thì hết. Tiên cơ Xúc Xích (Thanh Tâm Hương Tràng) và Thiên Càn Bạch Ngọc Đỉnh (Bạch Ngọc Thánh Quang) giải
 * mọi trạng thái này.
 */
export const PLAYER_STATUS: readonly StatusId[] = ["poison", "burn", "shock", "vuln", "armor", "stun", "silence", "root", "slow", "charm", "freeze", "chill"];
/**
 * Trạng thái trên hồn sư chỉ chiêu của hồn thú gây (#116): hồn kỹ của đối thủ ở Đại Đấu Hồn Trường có Mê hoặc chưa gây lên hồn sư (cân
 * bằng PvP riêng để #113).
 */
export const PLAYER_STATUS_PVE: readonly StatusId[] = ["charm", "freeze", "chill"];
/** Kháng trạng thái của bị động hồn cốt (BonePassiveDef.resist): kháng Choáng cũng rút ngắn Đóng băng, Mê hoặc trên hồn sư (trước #116 là Choáng). */
export const RESIST_AS: Partial<Record<StatusId, StatusId>> = { freeze: "stun", charm: "stun" };
/**
 * Hồn sư bị Mê hoặc (#116): server tự đi bộ × `spd` tới một điểm ngẫu nhiên cách chỗ bị Mê hoặc tối đa `r` pixel mỗi trục, đổi điểm
 * mỗi `turn` giây (ngẫu nhiên trong khoảng); tới nơi thì đứng chờ. Client không dự đoán (PlayerState.spd = 0).
 */
export const PLAYER_CHARM = { r: 40, spd: 0.6, turn: [0.4, 0.7] as [number, number] };
/** Hồn thú không có mục tiêu và không bị đánh `delay` giây thì hồi `pct` sinh lực tối đa mỗi giây (Trúng độc giảm hồi máu). */
export const BEAST_REGEN = { delay: 6, pct: 0.04 };
/**
 * Chỉ số thủ của hồn thú (#116, mục 5.1, 5.3): phần sát thương đòn trực tiếp hồn thú đỡ. Thủ = `ref` × hệ số niên hạn `years` (theo
 * mốc TIERS, nội suy log như beastStats) × hệ số loài BEAST_DEF_MULT (mặc định 1; tinh anh / thú vương / boss thế giới theo loài gốc),
 * tối đa `cap`. Phá giáp (STATUS.armor.shred mỗi tầng) và xuyên thủ (bộ Thất Sát) cộng lại thành phần thủ bị giảm, tối đa hết thủ.
 * Công hồn sư vốn cân theo hồn thú thủ chuẩn `ref`, nên đòn trực tiếp nhân defMult: hồn thú thủ chuẩn nhận đúng như trước khi có thủ;
 * `ref` = 3/13 để mỗi 1/3 thủ bị giảm đúng bằng +10% sát thương như Phá giáp / xuyên thủ cũ. Sát thương theo thời gian, lan Cảm điện,
 * sát thương cố định của hook thử không tính thủ. Chờ chốt.
 */
export const BEAST_DEF = { ref: 3 / 13, years: [0.7, 0.85, 1, 1.1, 1.2], cap: 0.6 };
/**
 * Hệ số thủ theo loài (mã BEASTS; loài không ghi là 1). Giáp / mai / vỏ cây dày thủ cao; côn trùng, chim, hoa, thú nhỏ thủ thấp. Chờ chốt.
 */
export const BEAST_DEF_MULT: Record<string, number> = {
  thiet_giap_xuyen_son_giap: 1.4, thiet_giap_te_nguu: 1.4, bang_giap_cu_quy: 1.4, kim_lan_long_quy: 1.4, thiet_giap_cu_giai: 1.4,
  co_moc_thu_nhan: 1.4,
  am_kim_khung_trao_hung: 1.2, kiem_vi_hat: 1.2, xich_lan_mang: 1.2, thanh_lan_ngac: 1.2, lam_loi_te_nguu: 1.2,
  bang_nguyen_cu_tuong: 1.2, bang_tinh_hat: 1.2, han_bang_dia_long: 1.2, bang_bich_hat: 1.2,
  nhu_cot_tho_hoang: 0.6, dien_thu: 0.6, hoi_vu_tuoc: 0.6, doc_cham_phong: 0.6, hac_vu_bien_buc: 0.6, cuc_yeu_hoa_linh: 0.6,
  hoa_linh_diep: 0.6, y_la_hoa_yeu: 0.6, thuc_nhan_hoa: 0.8, quy_dien_hai_yeu: 0.8, u_linh_hai_mau: 0.6,
};
/** Thủ của hồn thú loài `species` (mã BEASTS) `years` năm (BEAST_DEF). */
export function beastDef(species: string, years: number) {
  const y = Math.max(TIERS[0].years, Math.min(MAX_YEARS, years)), t = tierOfYears(y), u = Math.min(t + 1, TIERS.length - 1), k = BEAST_DEF.years;
  const f = u === t ? 0 : Math.log(y / TIERS[t].years) / Math.log(TIERS[u].years / TIERS[t].years);
  return Math.min(BEAST_DEF.cap, BEAST_DEF.ref * (k[t] + (k[u] - k[t]) * f) * (BEAST_DEF_MULT[species] ?? 1));
}
/** Hệ số sát thương đòn trực tiếp lên hồn thú thủ `def` khi bị giảm `cut` phần thủ (Phá giáp + xuyên thủ, kẹp 0–1). */
export const defMult = (def: number, cut: number) => (1 - def * (1 - Math.min(1, Math.max(0, cut)))) / (1 - BEAST_DEF.ref);
/** Hồn thú từ 100 năm (bậc 1 trở lên) thấy người chơi trong bán kính BEAST_AGGRO_R thì đuổi đánh; không có mục tiêu thì lang thang
 *  tối đa BEAST_WANDER pixel mỗi trục quanh chỗ sinh. */
export const BEAST_AGGRO_R = 70, BEAST_WANDER = 60;
/** Không sinh hồn thú trong khoảng này (mỗi trục) quanh trại cổng (object `spawn`), mọi cổng và mọi điểm xuất hiện `arrive` (mục 5.3,
 *  5.8), để vừa tới nơi, vừa hồi sinh hay đang niệm cổng không bị vây. Phải ≥ BEAST_WANDER + BEAST_AGGRO_R (130) thì hồn thú tự lang thang
 *  mới không tới tầm phát hiện người đứng ở đó; 160 như GATE_CLEAR của BĐ3 (đã gộp vào đây). Người chơi kéo hồn thú về thì vẫn bị đuổi. */
export const SPAWN_CLEAR = 160;

// ---------- Di chuyển (mục 4 "Di chuyển", bước 11.1) ----------
/** Tốc độ đi bộ gốc của hồn sư (pixel thế giới mỗi giây; ô TILE 16 pixel nên khoảng 6 ô/giây), nhân hệ số `spd` theo hệ (HE). */
export const PLAYER_SPEED = 95;
/** Ngoài giao chiến (TEAM_COMBAT_SECS) hồn sư tự chạy, nhanh gấp RUN_MULT; giữ Shift thì đi bộ. Đang giao chiến luôn đi bộ. */
export const RUN_MULT = 1.6;
/**
 * Tốc độ hồn thú: `spd` theo bậc (TIERS) nhân hệ số theo dáng đi: lang thang `wander`, bị Mê hoặc `charm`, đuổi mục tiêu `chase`, bỏ
 * về chỗ sinh `ret`. Cuồng nộ (ELITE_RAGE), giai đoạn 2 của thú vương (BossPhase.spd), nổi giận của boss thế giới và Làm chậm nhân thêm.
 */
export const BEAST_GAIT = { wander: 0.4, charm: 0.7, chase: 1.4, ret: 1.4 };
/**
 * Giới hạn đuổi: hồn thú thường và tinh anh cách chỗ sinh quá `r` pixel thì bỏ mục tiêu, chạy về chỗ sinh; trên đường về không nhận
 * mục tiêu mới (bị đánh cũng không quay lại), hồn thú thường hồi `heal` sinh lực tối đa mỗi giây (tinh anh hồi đầy khi bỏ giao chiến,
 * mục 5.4). Tới cách chỗ sinh dưới `near` pixel, hoặc sau `secs` giây (vướng vật cản), thì thôi về. Thú vương, boss thế giới ở trong hang.
 */
export const BEAST_LEASH = { r: 240, heal: 0.25, near: 8, secs: 8 };
/**
 * Hồn thú thực vật "đứng yên" (#116, mục 5.3): loài `ids` (mã BEASTS; Quỷ Đằng non là Quỷ Đằng trẻ; tinh anh mượn các loài này cũng vậy)
 * cắm rễ ở chỗ sinh: không lang thang, không đuổi, không bị đẩy lùi / kéo, bị Mê hoặc cũng không đi. Tầm với = tầm đánh thường (beastMelee,
 * thêm `lash`) hoặc tầm chiêu báo trước xa nhất, cộng `margin` pixel: nhận mục tiêu trong tầm với (tối đa BEAST_AGGRO_R), giữ mục tiêu khi còn
 * trong tầm với, xa hơn thì bỏ (không đuổi theo được).
 */
export const BEAST_ROOTED = { ids: ["thuc_nhan_hoa", "quy_dang", "quy_dang_non", "co_moc_thu_nhan"] as readonly string[], margin: 10, lash: 24 };
/**
 * Tầm đánh thường của hồn thú bậc `tier` (tính từ tâm, pixel): nửa kích thước + `BEAST_MELEE`. Thú đứng yên (#116) quất roi / rễ xa
 * thêm `BEAST_ROOTED.lash` để không bị hồn sư đứng ngoài tầm đánh trả mà vẫn trong tầm đánh thường của hồn sư (khoảng nửa kích thước + 28).
 */
export const BEAST_MELEE = 6;
export const beastMelee = (tier: number, rooted = false) => TIERS[tier].size / 2 + BEAST_MELEE + (rooted ? BEAST_ROOTED.lash : 0);
/**
 * Bấm chuột trên nền (client, mục 5.11 "Điều khiển"): tìm đường A* trên lưới ô chặn, chỉ trong `maxTiles` ô mỗi trục quanh chỗ đứng và
 * xét tối đa `maxNodes` ô; không tới được thì đi tới ô tới được gần điểm bấm nhất.
 */
export const CLICK_PATH = { maxTiles: 40, maxNodes: 8000 };

// ---------- Chiêu có báo trước của hồn thú (mục 5.3, 5.4; bước 3.5, mọi số đã chốt) ----------
/** Hình vùng: vệt (đường thẳng dài `r`, rộng `w`), nón (quạt bán kính `r`, góc `arc` độ), vòng (tròn bán kính `r`). */
export type TeleShape = "line" | "cone" | "circle";
/** Hình vùng theo chỉ số (đồng bộ ở `GroundState.shape`, #161); thêm hình mới vào cuối. */
export const TELE_SHAPES: readonly TeleShape[] = ["line", "cone", "circle"];
/**
 * Một chiêu báo trước. Hồn thú hiện vùng cảnh báo `warn` giây (đứng yên, không đánh thường), hết giờ mới tính trúng theo vị trí
 * THẬT của người chơi lúc đó: chạy ra khỏi vùng là né được.
 * - Hướng vệt / nón và tâm vòng `at: "target"` khóa lúc bắt đầu báo trước (theo vị trí mục tiêu lúc đó); vòng không có `at` thì quanh thân.
 * - `range`: mục tiêu trong khoảng này mới tung (vòng dưới chân mục tiêu: tầm ném). `cd`: hồi chiêu sau mỗi lần tung (± 20%).
 * - `dmg`: bội số sát thương đòn thường của hồn thú (beastStats theo số năm). `status`: trạng thái dùng chung gây cho người trúng.
 * - `dash`: tung xong hồn thú lao tới cuối vệt / tâm vòng (Vồ Lao, Xung Phong, Bổ Nhào), dừng khi vướng.
 * - `years`: loài có nhiều chiêu thì chiêu này dùng từ ngần ấy năm (hồn thú thường dùng chiêu cuối cùng đủ năm, mục 5.4: 1 chiêu).
 * Từ BĐ4 (chiêu của tinh anh, bảng BOSSES):
 * - `count` > 1: nhiều vùng trong một lần tung (trúng một vùng là trúng, mỗi người chỉ trúng một lần). Vệt / nón: `count` vùng tỏa
 *   đều trong góc `spread` độ quanh hướng mục tiêu (3 vết nứt tỏa quạt). Vòng dưới chân mục tiêu: `count` vòng thành hàng theo
 *   hướng hồn thú → mục tiêu, cách nhau `step`, vòng giữa ở chân mục tiêu (Gai Trồi, Lôi Trụ).
 * - `summon`: tung xong gọi thêm hồn thú loài `species` (mã BEASTS) quanh thân, tối đa `n` con do hồn thú này gọi còn sống (Hú Bầy).
 * - `pull`: người trúng bị kéo về phía hồn thú tối đa ngần ấy pixel (Quấn Kéo, Lưỡi Quất), dừng khi vướng hoặc sát hồn thú.
 * Từ BĐ5 (thú vương):
 * - `scatter`: vòng dưới chân mục tiêu rơi ngẫu nhiên trong bán kính này quanh mục tiêu (Độc Châm Vũ) thay vì thành hàng; vị trí do
 *   server tung (tham số `rnd` của teleZones).
 * - `mark`: đánh dấu một người tham gia ngẫu nhiên trong tầm (không nhất thiết là mục tiêu đang đuổi) rồi tung vào người đó (Huyết Cuồng).
 * - `summon.years`: tuổi hồn thú gọi ra (mặc định theo `years` của vùng).
 * - `eggs` (#162): tung xong đẻ bọc trứng quanh thân (Vạn Chu Phệ, EggDef), phá kịp thì không nở.
 * Từ BĐ6b:
 * - `drain`: mỗi người trúng chiêu mà đang bị Trói (trước khi chiêu gây trạng thái mới) thì hồn thú hồi ngần ấy phần máu tối đa (Hút
 *   Sinh của Khô Đằng Thụ Vương: "hồi máu từ người đang bị trói").
 * Từ BĐ6d:
 * - `weak`: nhắm người tham gia trong tầm có tỉ lệ sinh lực thấp nhất (Huyết Khí của Huyết Sa Bạo Quân: "vòng dưới chân người ít máu
 *   nhất") thay cho mục tiêu đang đuổi; chưa có người tham gia thì nhắm mục tiêu đang đuổi.
 * Từ BĐ6e (boss thế giới):
 * - `floor`: chiêu toàn sàn: vùng là cả sàn đấu (object `boss`), chỉ trúng người đứng trong sàn; client vẽ thành một dải phủ sàn.
 * Từ #118 (chiêu toàn sàn né được):
 * - `safe`: chiêu toàn sàn có `n` vòng an toàn bán kính `r` (FLOOR_SAFE) rải đều theo bề ngang sàn, vị trí do server tung lúc bắt đầu
 *   báo trước (đi thẳng tới được từ chỗ sinh của boss); người chạm một vòng (teleSafe) lúc chiêu nổ thì không trúng.
 * Từ #161:
 * - `ground`: tung xong (tính trúng như mọi chiêu) để lại vùng lưu lại trên mặt đất đúng hình các vùng báo trước (GroundDef).
 */
export interface BeastSkillDef {
  name: string; shape: TeleShape; at?: "target";
  r: number; w?: number; arc?: number; range: number;
  warn: number; cd: number; dmg: number;
  status?: StatusApply[]; dash?: boolean; years?: number;
  count?: number; spread?: number; step?: number;
  summon?: { species: string; n: number; years?: [number, number] }; pull?: number; eggs?: EggDef;
  scatter?: number; mark?: boolean;
  drain?: number;
  weak?: boolean;
  floor?: boolean;
  safe?: { n: number; r: number };
  ground?: GroundDef;
}
/**
 * Bọc trứng (#162, Vạn Chu Phệ của Tà hóa Thiên Độc Chu Hoàng, mục 5.4; số theo thiết kế gốc đã chốt): chiêu có `eggs` tung xong đẻ bọc
 * trứng quanh thân cho tới khi có `n` bọc do hồn thú này đẻ còn nguyên, nhưng không quá mức để nhện con còn sống do nó gọi cộng số nhện
 * sẽ nở từ các bọc vượt `n` × `per`. Bọc trứng là hồn thú đứng yên của loài `species` (không đi, không đánh, không tung chiêu, không bị
 * đẩy / kéo), tuổi tung trong `years`, máu bằng `hp` lần máu hồn thú loài đó cùng số năm; đánh được bằng mọi đòn như hồn thú. Còn nguyên
 * sau `secs` giây thì nở `per` con loài `species` cùng số năm tại chỗ (hồn thú do thú vương gọi ra như `summon`), lao vào mục tiêu của
 * thú vương; bị phá trước đó thì không nở. Thú vương bị hạ / rút đi thì bọc trứng của nó tan, không nở.
 */
export interface EggDef { species: string; n: number; per: number; secs: number; hp: number; years: [number, number]; }
/**
 * Vùng lưu lại trên mặt đất (#161, mục 5.3; vũng độc, sương độc; #173, #174 dùng lại): chiêu có `ground` tung xong thì để lại vùng đúng
 * hình các vùng báo trước của lần tung đó, tồn tại `secs` giây. Mỗi `every` giây (mặc định GROUND_TICK; nhịp đầu ngay lúc tung) hồn sư
 * đứng trong vùng (teleHits) bị gây `status`; ra khỏi vùng thì thôi nhận. Không gây cho người đã gục, đang đi cổng, đứng trong vùng an
 * toàn, đang miễn sát thương. Vùng mất khi hết giờ hoặc khi hồn thú gây ra bị hạ / rời bản đồ. `kind`: kiểu vùng (GROUND_KINDS: tên, màu client vẽ; không
 * dùng đỏ vì đỏ dành cho vùng báo trước).
 */
export type GroundKind = "pool" | "mist";
/** Kiểu vùng lưu lại; chỉ số trong mảng đồng bộ ở `GroundState.kind`, thêm kiểu mới vào cuối. */
export const GROUND_KINDS: { id: GroundKind; name: string; col: string }[] = [
  { id: "pool", name: "Vũng độc", col: "#9be23a" },
  { id: "mist", name: "Sương độc", col: "#c8f5b4" },
];
export interface GroundDef { kind: GroundKind; secs: number; every?: number; status: StatusApply[]; }
/** Nhịp gây trạng thái mặc định của vùng lưu lại (giây). */
export const GROUND_TICK = 1;
/** Tối đa vùng lưu lại cùng lúc trong một phòng (chống phình state); vượt thì bỏ vùng cũ nhất. */
export const GROUND_MAX = 48;
/** Mỗi nhịp vũng / sương độc gây Trúng độc 1 tầng, giữ ngần này giây (đứng lâu thì cộng tầng tới STATUS.poison.max). */
const POISON_GROUND: StatusApply[] = [{ s: "poison", n: 1, secs: 3 }];
/**
 * "Đóng băng" của hồn thú băng lên hồn sư: trạng thái Đóng băng (#116; trước đó là Choáng), thời gian ghi ở từng chiêu. "Mê hoặc" lên
 * hồn sư (Thực Nhân Hoa, Ỷ La Hoa Yêu, Tuyết Vĩ Yêu Hồ, Lục Vĩ Băng Hồ, Quỷ Diện Hải Yêu…): Mê hoặc `CHARM_P` (#116; trước đó là Choáng
 * ngắn cùng thời gian).
 */
const FREEZE: StatusApply = { s: "freeze" };
const CHARM_P: StatusApply = { s: "charm", secs: 0.8 };
/** Hồn thú thường từ ngần ấy năm mới có chiêu báo trước (mục 5.3: dưới 1.000 năm chỉ đánh thường). */
export const BEAST_SKILL_YEARS = 1000;
/** Thời gian báo trước mặc định (mục 5.3: khoảng 0,8 giây). Thú vương dài hơn (1–1,5 giây, BĐ5). */
export const TELE_WARN = 0.8;
/** Hồn thú vừa có mục tiêu chờ ngần này giây (ngẫu nhiên trong khoảng) mới tung chiêu đầu tiên. */
export const TELE_FIRST: [number, number] = [1.5, 3];
/** Người chơi là một hình tròn bán kính ngần này khi tính trúng (chạm mép vùng là trúng). */
export const TELE_PAD = 4;
const bs = (name: string, shape: TeleShape, r: number, o: Partial<BeastSkillDef> = {}): BeastSkillDef =>
  ({ name, shape, r, range: shape === "circle" && !o.at ? r * 0.8 : shape === "line" ? r * 0.8 : r * 0.9, warn: TELE_WARN, cd: 7, dmg: 1.5, ...o });
/**
 * Chiêu báo trước theo loài (mã trong BEASTS; tên theo bảng Ngoại vi / Nội địa của mục 5.3, loài chưa có chiêu trong bảng thì tự đặt).
 * Hồn thú dưới BEAST_SKILL_YEARS năm không dùng. Tinh anh (BĐ4) sẽ dùng 2 chiêu: bảng BOSSES riêng, cùng bộ máy.
 * Kích thước tính theo tốc độ hồn sư (58 pixel/giây ≈ 46 pixel trong 0,8 giây): vòng dưới chân ≤ 34, vòng quanh thân ≤ 56 để
 * người đứng sát hồn thú vẫn kịp chạy ra.
 */
export const BEAST_SKILLS: Record<string, BeastSkillDef[]> = {
  // Bìa rừng (300–700 năm) chưa tới 1.000 năm; chiêu để dành cho hồn thú sinh bằng hook và tinh anh.
  phong_lang:   [bs("Vồ", "line", 70, { w: 14, dmg: 1.4, dash: true })],
  tu_van_bao:   [bs("Vồ Nhanh", "line", 80, { w: 12, dmg: 1.5, dash: true, warn: 0.7 })],
  // Ngoại vi: Rừng thưa, Khe suối, Rìa nội địa.
  man_da_la_xa: [bs("Phun Độc", "line", 100, { w: 14, dmg: 1.2, status: [{ s: "poison", n: 2, secs: 4 }] })],
  quy_dang:     [bs("Quật Roi", "cone", 52, { arc: 140, dmg: 1.5 }),
    // Quỷ Đằng ngàn năm ở Rừng cổ thụ (Nội địa) dùng cùng mã loài.
    bs("Rễ Trói", "circle", 30, { at: "target", range: 120, dmg: 1.1, status: [{ s: "root", secs: 1.5 }], years: 1500 })],
  loi_van_hau:  [bs("Gọi Sét", "circle", 30, { at: "target", range: 130, dmg: 1.3, status: [{ s: "shock" }] })],
  quy_ho:       [bs("Vồ Lao", "line", 110, { w: 16, dmg: 1.6, dash: true })],
  thanh_lan_ngac: [bs("Táp Ngang", "cone", 46, { arc: 110, dmg: 1.7 })],
  kim_linh_ung: [bs("Bổ Nhào", "circle", 28, { at: "target", range: 110, dmg: 1.6, dash: true })],
  nhan_dien_ma_chu_non: [bs("Giăng Tơ", "circle", 34, { at: "target", range: 110, dmg: 0.8, status: [{ s: "slow", secs: 3 }] })],
  liet_trao_hung: [bs("Vỗ Đất", "circle", 48, { dmg: 1.8 })],
  thiet_giap_te_nguu: [bs("Xung Phong", "line", 150, { w: 18, dmg: 1.8, dash: true, cd: 9 })],
  // Nội địa: Rừng cổ thụ, Đầm sương độc, Lôi Cốc, Hắc Ám Lâm.
  nhan_dien_ma_chu: [bs("Phun Tơ", "line", 110, { w: 14, dmg: 0.9, status: [{ s: "root", secs: 1.5 }] })],
  u_minh_lang:  [bs("Ảnh Vồ", "line", 95, { w: 14, dmg: 1.5, dash: true })],
  // Phun Độc để lại vũng độc (#161): Trúng độc theo nhịp khi đứng trong vũng.
  that_tinh_doc_thiem: [bs("Phun Độc", "circle", 34, { at: "target", range: 120, dmg: 1, ground: { kind: "pool", secs: 4, status: POISON_GROUND } })],
  xich_lan_mang: [bs("Quấn Siết", "circle", 32, { dmg: 1.2, status: [{ s: "root", secs: 1.5 }] })],
  hac_vu_bien_buc: [bs("Âm Ba", "cone", 64, { arc: 70, dmg: 1, status: [{ s: "silence", secs: 2 }] })],
  lam_loi_te_nguu: [bs("Lôi Xung", "line", 140, { w: 18, dmg: 1.7, dash: true, cd: 9, status: [{ s: "shock" }] })],
  loi_duc_ung:  [bs("Lôi Bạo", "circle", 34, { at: "target", range: 130, dmg: 1.6, status: [{ s: "shock" }] })],
  am_kim_khung_trao_hung: [bs("Vỗ Đất", "circle", 56, { dmg: 2, status: [{ s: "stun", secs: 0.6 }] })],
  kiem_vi_hat:  [bs("Kiếm Vĩ Đâm", "line", 85, { w: 12, dmg: 1.6, status: [{ s: "armor", n: 2 }] })],
  quy_anh_bao:  [bs("Ảnh Trảm", "cone", 54, { arc: 90, dmg: 1.8 })],
  // Lạc Nhật Sâm Lâm (BĐ6b). "Mê hoặc" của Thực Nhân Hoa / Ỷ La Hoa Yêu là Mê hoặc trên hồn sư (CHARM_P, #116); Sương Độc của
  // Độc Vụ Thiềm để lại sương độc (#161); Tự Bạo của Hỏa Linh Điệp chỉ nổ, bướm không chết theo.
  thuc_nhan_hoa: [bs("Phấn Mê", "circle", 44, { dmg: 1.2, status: [CHARM_P] })],
  cuc_yeu_hoa_linh: [bs("Phi Hoa", "cone", 60, { arc: 80, dmg: 1.6 })],
  doc_cuc_dang: [bs("Gai Trồi", "line", 100, { w: 14, dmg: 1.7 })],
  bich_lan_xa:  [bs("Phun Độc", "line", 110, { w: 14, dmg: 1.3, status: [{ s: "poison", n: 2, secs: 5 }] })],
  doc_vu_thiem: [bs("Sương Độc", "circle", 34, { at: "target", range: 120, dmg: 1, ground: { kind: "mist", secs: 5, status: POISON_GROUND } })],
  hac_thuy_mang: [bs("Quật Đuôi", "cone", 56, { arc: 150, dmg: 1.8 })],
  liet_hoa_tich_dich: [bs("Phun Lửa", "cone", 58, { arc: 70, dmg: 1.4, status: [{ s: "burn", n: 2, secs: 4 }] })],
  huyen_bang_thiem: [bs("Băng Khí", "circle", 34, { at: "target", range: 120, dmg: 1.1, status: [{ s: "slow", secs: 3 }] })],
  hoa_linh_diep: [bs("Tự Bạo", "circle", 36, { dmg: 2.4, cd: 9 })],
  co_moc_thu_nhan: [bs("Dậm Rễ", "circle", 56, { dmg: 2, status: [{ s: "root", secs: 1 }] })],
  y_la_hoa_yeu: [bs("Hương Mê", "cone", 60, { arc: 80, dmg: 1.2, status: [CHARM_P] })],
  thanh_lan_doc_co: [bs("Độc Châm", "line", 100, { w: 10, dmg: 1.7, status: [{ s: "poison", n: 2, secs: 5 }] })],
  // Cực Bắc Chi Địa (BĐ6c, đã chốt): "đóng băng" = Đóng băng (FREEZE, #116), "Mê hoặc" trên hồn sư = Mê hoặc (CHARM_P, #116), băng
  // giá làm chậm = Làm chậm.
  tuyet_lang:   [bs("Băng Nha", "line", 90, { w: 14, dmg: 1.5, dash: true })],
  bang_nguyen_cu_tuong: [bs("Dậm Băng", "circle", 52, { dmg: 1.6, status: [{ s: "slow", secs: 3 }] })],
  bang_vu_ung:  [bs("Bổ Nhào", "circle", 30, { at: "target", range: 120, dmg: 1.6, dash: true })],
  bang_giap_cu_quy: [bs("Xoay Vỏ", "line", 140, { w: 20, dmg: 1.7, dash: true, cd: 9 })],
  tuyet_vi_yeu_ho: [bs("Mị Ảnh", "circle", 32, { at: "target", range: 120, dmg: 1, status: [CHARM_P] })],
  bang_tinh_hat: [bs("Băng Châm", "line", 100, { w: 12, dmg: 1.6 })],
  han_bang_dia_long: [bs("Phun Băng", "cone", 54, { arc: 90, dmg: 1.5, cd: 8, status: [{ ...FREEZE, secs: 1 }] })],
  bang_phong_bach_hung: [bs("Vỗ Đất", "circle", 56, { dmg: 2 })],
  han_nguyet_ung: [bs("Nguyệt Phong", "line", 120, { w: 14, dmg: 1.7 })],
  bang_bich_hat: [bs("Băng Bích Châm", "line", 100, { w: 12, dmg: 1.6, cd: 8, status: [{ ...FREEZE, secs: 1 }] })],
  huyen_minh_bang_tam: [bs("Nhả Tơ Băng", "line", 110, { w: 14, dmg: 1, status: [{ s: "root", secs: 1.5 }] })],
  tuyet_ma_vien: [bs("Ném Băng Khối", "circle", 32, { at: "target", range: 150, dmg: 1.8 })],
  // Hải Thần Đảo (BĐ6d). "Mê hoặc" của Mê Ca là Mê hoặc trên hồn sư (CHARM_P, #116); "nhiều vệt" của
  // Xúc Tu Quật là 3 vệt tỏa 60° tung cùng lúc; "vệt rộng" của Sóng Cuộn rộng 30.
  thiet_giap_cu_giai: [bs("Kìm Kẹp", "cone", 50, { arc: 100, dmg: 1.8 })],
  lam_lan_hai_xa: [bs("Thủy Tiễn", "line", 110, { w: 12, dmg: 1.6 })],
  kiem_ngu:     [bs("Xuyên Kích", "line", 160, { w: 12, dmg: 1.9, dash: true, cd: 9 })],
  quy_dien_hai_yeu: [bs("Mê Ca", "cone", 62, { arc: 80, dmg: 1.2, status: [CHARM_P] })],
  tham_hai_ma_chuong: [bs("Xúc Tu Quật", "line", 90, { w: 12, count: 3, spread: 60, dmg: 1.6 })],
  loi_quang_hai_dieu: [bs("Điện Lưu", "circle", 50, { dmg: 1.5, status: [{ s: "shock" }] })],
  kim_lan_long_quy: [bs("Sóng Cuộn", "line", 120, { w: 30, dmg: 1.7 })],
  huyet_nha_cu_sa: [bs("Lao Cắn", "line", 120, { w: 16, dmg: 2, dash: true })],
  loi_van_hai_ung: [bs("Lôi Bổ", "circle", 32, { at: "target", range: 130, dmg: 1.7, status: [{ s: "shock" }] })],
  tham_hai_ma_kinh: [bs("Quật Đuôi", "cone", 64, { arc: 160, dmg: 2.1 })],
  u_linh_hai_mau: [bs("Độc Điện", "circle", 48, { dmg: 1.4, status: [{ s: "poison", n: 2, secs: 5 }, { s: "shock" }] })],
};
/** Chiêu báo trước của hồn thú thường loài `species` (mã) `years` năm: chiêu cuối cùng đủ năm, không có thì null. */
export function beastSkillOf(species: string, years: number): BeastSkillDef | null {
  if (years < BEAST_SKILL_YEARS) return null;
  const list = (BEAST_SKILLS[species] ?? []).filter((s) => years >= (s.years ?? BEAST_SKILL_YEARS));
  return list.length ? list[list.length - 1] : null;
}
/** Một vùng cảnh báo đã khóa: gốc (x, y), hướng `ang` (radian, vệt / nón), kích thước theo BeastSkillDef. */
export interface Tele { shape: TeleShape; x: number; y: number; ang: number; r: number; w: number; arc: number; }
/**
 * Điểm (px, py) đứng trong vòng an toàn `s` của chiêu toàn sàn (BeastSkillDef.safe, #118): người chơi (hình tròn bán kính TELE_PAD)
 * chạm vòng là an toàn, cùng cách tính với teleHits. Hàm thuần: server tính, bot đối chiếu.
 */
export const teleSafe = (s: Tele, px: number, py: number) => Math.hypot(px - s.x, py - s.y) <= s.r + TELE_PAD;
/** Điểm (px, py) có trúng vùng `t` không (người chơi là hình tròn bán kính TELE_PAD). Hàm thuần: server tính, bot đối chiếu. */
export function teleHits(t: Tele, px: number, py: number) {
  const dx = px - t.x, dy = py - t.y, d = Math.hypot(dx, dy);
  if (t.shape === "circle") return d <= t.r + TELE_PAD;
  if (t.shape === "line") {
    const along = dx * Math.cos(t.ang) + dy * Math.sin(t.ang), side = -dx * Math.sin(t.ang) + dy * Math.cos(t.ang);
    return along >= -TELE_PAD && along <= t.r + TELE_PAD && Math.abs(side) <= t.w / 2 + TELE_PAD;
  }
  if (d > t.r + TELE_PAD) return false;
  if (d <= TELE_PAD * 2) return true; // sát gốc nón
  let da = Math.atan2(dy, dx) - t.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
  return Math.abs(da) <= (t.arc * Math.PI) / 360;
}
/**
 * Các vùng cảnh báo của chiêu `def` do hồn thú đứng ở (bx, by) tung về mục tiêu (tx, ty), khóa lúc bắt đầu báo trước. Chiêu thường
 * có 1 vùng; `count` > 1 (BĐ4) cho nhiều vùng (vệt / nón tỏa quạt, vòng dưới chân thành hàng). Hàm thuần: server khóa vùng, bot đối chiếu.
 * `scatter` (BĐ5): vòng đầu ở chân mục tiêu, các vòng còn lại rơi trong bán kính `scatter` theo số ngẫu nhiên `rnd` (server truyền
 * Math.random; không truyền thì rải đều trên vòng tròn, để hàm vẫn thuần).
 */
export function teleZones(def: BeastSkillDef, bx: number, by: number, tx: number, ty: number, rnd?: () => number): Tele[] {
  const ang = Math.atan2(ty - by, tx - bx), at = def.at === "target", n = Math.max(1, def.count ?? 1), out: Tele[] = [];
  for (let k = 0; k < n; k++) {
    const off = n > 1 ? k / (n - 1) - 0.5 : 0; // -0,5 .. 0,5
    if (def.shape === "circle" && at && def.scatter) {
      const a = rnd ? rnd() * Math.PI * 2 : (k / n) * Math.PI * 2, d = k === 0 ? 0 : def.scatter * (rnd ? Math.sqrt(rnd()) : 0.7);
      out.push({ shape: "circle", x: tx + Math.cos(a) * d, y: ty + Math.sin(a) * d, ang, r: def.r, w: 0, arc: 0 });
    } else if (def.shape === "circle" && at) {
      const d = off * (n - 1) * (def.step ?? def.r * 2);
      out.push({ shape: "circle", x: tx + Math.cos(ang) * d, y: ty + Math.sin(ang) * d, ang, r: def.r, w: 0, arc: 0 });
    } else {
      const a = ang + off * ((def.spread ?? 0) * Math.PI) / 180;
      out.push({ shape: def.shape, x: at ? tx : bx, y: at ? ty : by, ang: a, r: def.r, w: def.w ?? 0, arc: def.arc ?? 0 });
    }
  }
  return out;
}

// ---------- Tinh anh, thú vương, boss thế giới (mục 5.4, 6; bước BĐ4, mọi số đã chốt) ----------
/**
 * Vòng an toàn của chiêu toàn sàn boss thế giới (BeastSkillDef.safe, #118): `floor` cho Bạo Nộ và Thanh Lân Độc Vụ, `charge` cho tích
 * lực Đại Địa Chấn (ít vòng hơn vì báo trước lâu và còn cách ngắt). Thời gian báo trước tính để từ phần lớn sàn đi bộ (PLAYER_SPEED,
 * không bị chậm / khống chế) kịp tới vòng gần nhất (LAIR_SPOT.band giữ vòng khỏi sát mép).
 */
export const FLOOR_SAFE = { floor: { n: 3, r: 40 }, charge: { n: 2, r: 36 } };
/**
 * Chọn chỗ trên sàn đấu boss thế giới (#118: vòng an toàn, chỗ Du Thủy nổi lên): dọc trong dải `band` (phần bề cao sàn, để vòng không
 * nằm sát mép cây và đi bộ tới kịp trong thời gian báo trước), cách mép sàn `pad` pixel (chỗ nổi lên; vòng an toàn cách mép bằng bán
 * kính), thử tối đa `tries` lần mỗi chỗ. Vòng an toàn phải đứng được ở 8 hướng cách tâm `open` × bán kính.
 */
export const LAIR_SPOT = { band: [0.2, 0.8] as [number, number], pad: 16, tries: 30, open: 0.6 };
/** Bậc hồn thú (`BeastState.rank`): 0 thường, 1 tinh anh, 2 tà hóa thú vương (BĐ5), 3 boss thế giới (BĐ6). */
export const RANK_NAMES = ["", "Tinh anh", "Tà hóa", "Boss thế giới"] as const;
/**
 * Một tinh anh / thú vương / boss. `species`: loài gốc (mã BEASTS): dùng lại chỉ số theo năm của loài và sprite (phóng ELITE.scale).
 * `aura`: màu vầng sáng riêng (client vẽ bằng code). `skills`: chiêu báo trước (tinh anh: 2 chiêu, cùng bộ máy với 3.5).
 * Hệ số máu / sát thương theo bậc nằm ở ELITE (tinh anh) và KING (thú vương, BĐ5).
 * Thú vương (rank 2, BĐ5): `hp` là hệ số máu riêng của bản đồ (x6–8, bảng 5.3), niên hạn bằng mức trên của bản đồ (MAPS.years) trừ khi
 * có `years` riêng (BĐ6d: Hải Thần Đảo 100.000 năm là mức của hồn thú thường đỏ, thú vương 95.000 năm theo 5.4; xem kingYears);
 * `phase2`: giai đoạn 2 khi máu còn KING.phaseHp (tên, mô tả, hệ số tốc độ, chiêu thêm vào `skills`).
 */
export interface BossPhase { name: string; desc: string; spd: number; skills: BeastSkillDef[]; cold?: ColdDef; }
/**
 * Cực Hàn (#163, giai đoạn 2 của Tà hóa Huyền Minh Băng Giao, mục 5.4; thiết kế gốc đã chốt): từ khi hết tiếng gầm chuyển giai đoạn,
 * mọi hồn sư đang tham gia trong hang (chưa gục, không đi cổng) cứ `every` giây thêm một tầng Hàn (STATUS.chill: đủ tầng tối đa thì bùng phát thành Đóng băng); đang Đóng
 * băng hoặc miễn sát thương thì ngừng tích. Đứng cách Hỏa Đàn (đống lửa trong hang) không quá `fire.r` pixel hoặc được thanh tẩy thì xả
 * hết tầng. Hỏa Đàn đặt ở điểm đi được trong hang gần điểm tỉ lệ `fire.at` của hình chữ nhật `boss` nhất (hoaDanSpot, shared/hoaDan.ts),
 * quanh nó `fire.clear` pixel mỗi phía đều đi được.
 */
export interface ColdDef { every: number; fire: { r: number; at: [number, number]; clear: number } }
export interface BossDef { id: string; name: string; rank: 1 | 2 | 3; species: string; aura: string; skills: BeastSkillDef[]; hp?: number; phase2?: BossPhase; years?: number;
  world?: WorldMech; }
/**
 * Cơ chế riêng của boss thế giới (BĐ6e, mục 5.4 "buộc đổi võ hồn đúng lúc"; mọi số đã chốt). Mỗi cơ chế có chu kỳ `every` giây
 * (lần đầu sau `every` × WORLD.firstMech), không chạy khi đang báo trước chiêu khác, đang lặn hay đứng Choáng sau khi bị ngắt.
 * - `charge` (Đại Địa Chấn): tích lực toàn sàn `skill` (báo trước dài); chỉ khống chế (Choáng, Trói, Câm lặng, Mê hoặc…) của võ hồn
 *   hệ Khống chế đang ra trận mới tính, đủ `need` lần trúng thì ngắt, boss Choáng `stun` giây. Không ngắt thì cả sàn trúng `skill`
 *   (Vết thương sâu: trạng thái nặng mà chỉ thanh tẩy của võ hồn phụ trợ giải được).
 * - `armor` (Bá Thể): khoác khiên `pct` máu tối đa trong `secs` giây; sát thương của võ hồn hệ `he` lên khiên x`mult`. Hết giờ mà
 *   khiên chưa vỡ thì boss hồi máu bằng phần khiên còn lại.
 * - `miasma` (Thanh Lân Độc Vụ): chiêu toàn sàn `skill` gây Vết thương sâu (độc cộng dồn lâu), chỉ thanh tẩy giải được.
 * - `dive` (Du Thủy): lặn ra giữa hồ (object `lake` trong Tiled) `secs` giây (không nhận sát thương, không đánh); chỗ nổi lên trong sàn
 *   (cách chỗ lặn ít nhất `away` pixel) chọn ngay lúc lặn và báo trước cho cả phòng; nổi lên đúng chỗ đó và lộ điểm yếu hệ `he` trong
 *   `weakSecs` giây (mẫn công lướt tới kịp thì đánh trúng điểm yếu).
 */
export interface WorldMech {
  charge?: { every: number; need: number; stun: number; skill: BeastSkillDef };
  armor?: { name: string; every: number; pct: number; secs: number; he: He; mult: number };
  miasma?: { every: number; skill: BeastSkillDef };
  dive?: { name: string; every: number; secs: number; he: He; weakSecs: number; away: number };
}
/**
 * Bảng BOSSES (mục 6). Mã cố định, dùng trong thuộc tính `boss` của object `elite` (Tiled); `BeastState.species` của hồn thú bậc > 0
 * là chỉ số trong bảng này, nên chỉ thêm vào cuối. BĐ4: 11 tinh anh của 3 bản đồ săn, tên và chiêu theo cột Tinh anh ở bảng 5.3.
 * Chiêu nhiều nhát nối tiếp (Tam Liên Vồ, Liên Hoàn Trảo, Cuồng Bạo Vỗ "2 lần liền", Lôi Trụ "nổ lần lượt") làm bản tối thiểu:
 * các vùng tung cùng lúc / gộp bội số (đã chốt). Loài gốc chưa có trong BEASTS thì mượn loài gần nhất (Ảnh Trảo Linh Miêu: Tử Văn
 * Báo; Lam Điện Lôi Tích: Lam Lôi Tê Ngưu).
 */
export const BOSSES: BossDef[] = [
  // Thánh Hồn Thôn (10–450 năm)
  { id: "bach_nhung_tho_vuong", name: "Bạch Nhung Thỏ Vương", rank: 1, species: "nhu_cot_tho_hoang", aura: "#e8f0ff", skills: [
    bs("Đạp Đất", "circle", 36, { dmg: 1.4 }),
    bs("Phóng Nhảy", "line", 60, { w: 14, dmg: 1.5, dash: true })] },
  { id: "ngan_boi_phong_lang_dau_linh", name: "Ngân Bối Phong Lang Đầu Lĩnh", rank: 1, species: "phong_lang_con", aura: "#c9d6e8", skills: [
    bs("Hú Bầy", "circle", 40, { dmg: 0.8, cd: 12, summon: { species: "phong_lang_con", n: 2 } }),
    bs("Vồ", "line", 70, { w: 14, dmg: 1.5, dash: true })] },
  { id: "thiet_nha_da_tru_vuong", name: "Thiết Nha Dã Trư Vương", rank: 1, species: "hac_boi_da_tru", aura: "#e0a050", skills: [
    bs("Húc Lao", "line", 120, { w: 18, dmg: 1.7, dash: true, cd: 9 }),
    bs("Dậm Đất", "circle", 48, { dmg: 1.6 })] },
  // Tinh Đấu Ngoại vi (300–2.000 năm)
  { id: "huyet_nhan_phong_lang", name: "Huyết Nhãn Phong Lang", rank: 1, species: "phong_lang", aura: "#ff4a4a", skills: [
    bs("Hú Bầy", "circle", 40, { dmg: 0.8, cd: 12, summon: { species: "phong_lang", n: 3 } }),
    bs("Xé Toạc", "cone", 54, { arc: 110, dmg: 1.7 })] },
  { id: "huyet_gai_quy_dang", name: "Huyết Gai Quỷ Đằng", rank: 1, species: "quy_dang", aura: "#d04a7a", skills: [
    bs("Gai Trồi", "circle", 24, { at: "target", range: 130, count: 3, step: 44, dmg: 1.5 }),
    bs("Quấn Kéo", "line", 110, { w: 14, dmg: 1, pull: 60 })] },
  { id: "hac_sat_quy_ho", name: "Hắc Sát Quỷ Hổ", rank: 1, species: "quy_ho", aura: "#9a5aff", skills: [
    bs("Tam Liên Vồ", "line", 100, { w: 14, count: 3, spread: 40, dmg: 1.6, dash: true }),
    bs("Hổ Khiếu", "circle", 56, { dmg: 1.2, status: [{ s: "stun", secs: 1 }] })] },
  { id: "anh_trao_linh_mieu", name: "Ảnh Trảo Linh Miêu", rank: 1, species: "tu_van_bao", aura: "#7a6aff", skills: [
    // Lướt vệt dài xuyên qua mục tiêu ra sau lưng (tầm 90 nên mục tiêu luôn nằm giữa vệt).
    bs("Ảnh Tập", "line", 130, { w: 14, range: 90, dmg: 1.7, dash: true, warn: 0.7 }),
    bs("Liên Hoàn Trảo", "cone", 50, { arc: 100, dmg: 2.1 })] },
  // Tinh Đấu Nội địa (1.500–25.000 năm)
  { id: "u_minh_lang_vuong", name: "U Minh Lang Vương", rank: 1, species: "u_minh_lang", aura: "#6a8aff", skills: [
    bs("Hú Bầy", "circle", 44, { dmg: 0.8, cd: 12, summon: { species: "u_minh_lang", n: 3 } }),
    // Biến mất rồi hiện ra ở chân mục tiêu: vòng nhỏ báo trước, hồn thú lao tới tâm vòng.
    bs("Ảnh Tập", "circle", 30, { at: "target", range: 130, dmg: 1.8, dash: true })] },
  { id: "kim_boi_that_tinh_thiem", name: "Kim Bối Thất Tinh Thiềm", rank: 1, species: "that_tinh_doc_thiem", aura: "#f2c84b", skills: [
    // Vũng độc 6 giây (bảng gốc, #161).
    bs("Nổ Túi Độc", "circle", 56, { dmg: 1.2, ground: { kind: "pool", secs: 6, status: POISON_GROUND } }),
    bs("Lưỡi Quất", "line", 110, { w: 12, dmg: 1.1, pull: 60 })] },
  { id: "lam_dien_loi_tich", name: "Lam Điện Lôi Tích", rank: 1, species: "lam_loi_te_nguu", aura: "#4ab0ff", skills: [
    bs("Lôi Trụ", "circle", 26, { at: "target", range: 140, count: 3, step: 46, dmg: 1.6, status: [{ s: "shock" }] }),
    bs("Lôi Quang Xung", "line", 170, { w: 18, dmg: 1.8, dash: true, cd: 9, status: [{ s: "shock" }] })] },
  { id: "huyet_van_khung_trao_hung", name: "Huyết Văn Khủng Trảo Hùng", rank: 1, species: "am_kim_khung_trao_hung", aura: "#e0303a", skills: [
    bs("Ám Kim Liệt Địa", "line", 110, { w: 14, count: 3, spread: 50, dmg: 1.8 }),
    bs("Cuồng Bạo Vỗ", "circle", 56, { dmg: 2.6, status: [{ s: "stun", secs: 0.6 }] })] },
  // Tà hóa thú vương (BĐ5, bảng 5.3; mọi số đã chốt). Báo trước 1–2 giây (dài hơn hồn thú thường): vòng quanh thân ≤ 64 để chạy
  // kịp ra (58 pixel/giây × 1,2 giây ≈ 70). Bản tối thiểu: "3 nón liên tiếp, xoay dần" tung cùng lúc thành quạt; "tơ phủ 1/3 hang
  // luân phiên" thay bằng một dải tơ rộng báo trước 2 giây nhắm người chơi. Vạn Chu Phệ đẻ bọc trứng (EggDef, #162): máu bọc bằng nửa
  // nhện con cùng số năm để một người tập trung phá kịp cả 3 bọc trong thời gian nở.
  { id: "huyet_nguyet_lang_vuong", name: "Huyết Nguyệt Lang Vương", rank: 2, species: "phong_lang", aura: "#ff2a4a", hp: 6, skills: [
    bs("Huyết Nguyệt Hú", "circle", 60, { warn: 1.2, dmg: 1, cd: 14, summon: { species: "phong_lang", n: 4 } }),
    bs("Liệt Phong Trảo", "cone", 58, { arc: 60, count: 3, spread: 130, warn: 1, dmg: 1.4, cd: 8 })],
    phase2: { name: "Huyết Cuồng", desc: "tốc độ +40%, cứ 10 giây đánh dấu một người rồi lao xuyên tới", spd: 1.4, skills: [
      bs("Huyết Cuồng Xung", "line", 170, { w: 20, range: 160, warn: 1.2, dmg: 1.8, cd: 10, dash: true, mark: true })] } },
  { id: "thien_doc_chu_hoang", name: "Thiên Độc Chu Hoàng", rank: 2, species: "nhan_dien_ma_chu", aura: "#7bff5a", hp: 7, skills: [
    bs("Thiên La Võng", "circle", 64, { warn: 1.3, dmg: 0.9, cd: 12, status: [{ s: "root", secs: 2 }] }),
    bs("Độc Châm Vũ", "circle", 22, { at: "target", range: 150, count: 6, scatter: 70, warn: 1.2, dmg: 1, cd: 8,
      status: [{ s: "poison", n: 2, secs: 5 }] })],
    phase2: { name: "Vạn Chu Phệ", desc: "đẻ bọc trứng (không phá kịp thì nở nhện con), giăng dải tơ rộng (báo trước 2 giây), tốc độ +25%", spd: 1.25, skills: [
      bs("Vạn Chu Phệ", "circle", 40, { warn: 1, dmg: 0.6, cd: 16,
        eggs: { species: "nhan_dien_ma_chu_non", n: 3, per: 2, secs: 8, hp: 0.5, years: [4000, 8000] } }),
      bs("Chu Ti Phong Tỏa", "line", 190, { w: 64, range: 180, warn: 2, dmg: 1.2, cd: 12, status: [{ s: "slow", secs: 3 }] })] } },
  // Lạc Nhật Sâm Lâm (BĐ6b, 5.000–30.000 năm; bảng 5.3, mọi số đã chốt). Bản tối thiểu: "giữ 2 giây" của Nuốt Chửng là Trói 2 giây
  // sau khi kéo; Mê hoặc trên hồn sư như loài thường (CHARM_P, #116); Song Sắc Mãng không đổi băng / hỏa theo 10 giây, mỗi chiêu
  // gây cả Làm chậm lẫn Thiêu đốt; "chữ X" của Băng Hỏa Giao Thoa là 2 vệt tỏa 90°. Song Sắc Mãng mượn loài Hắc Thủy Mãng.
  { id: "huyet_man_thuc_nhan_hoa", name: "Huyết Mạn Thực Nhân Hoa", rank: 1, species: "thuc_nhan_hoa", aura: "#ff3a7a", skills: [
    bs("Nuốt Chửng", "circle", 50, { dmg: 1.3, cd: 9, pull: 50, status: [{ s: "root", secs: 2 }] }),
    bs("Đại Phấn Mê", "circle", 56, { dmg: 1.2, status: [{ ...CHARM_P, secs: 1 }] })] },
  { id: "song_dau_bich_lan_xa", name: "Song Đầu Bích Lân Xà", rank: 1, species: "bich_lan_xa", aura: "#3affa0", skills: [
    bs("Song Xà Phun", "line", 110, { w: 14, count: 2, spread: 40, dmg: 1.4, status: [{ s: "poison", n: 2, secs: 5 }] }),
    // Sương độc 8 giây (bảng gốc, #161).
    bs("Lân Độc Vụ", "circle", 56, { dmg: 1, ground: { kind: "mist", secs: 8, status: POISON_GROUND } })] },
  { id: "bang_hoa_song_sac_mang", name: "Băng Hỏa Song Sắc Mãng", rank: 1, species: "hac_thuy_mang", aura: "#b07aff", skills: [
    bs("Băng Hỏa Giao Thoa", "line", 120, { w: 14, count: 2, spread: 90, dmg: 1.6, status: [{ s: "slow", secs: 2 }, { s: "burn", n: 2, secs: 4 }] }),
    bs("Song Sắc Tức", "cone", 58, { arc: 100, dmg: 1.6, status: [{ s: "slow", secs: 3 }, { s: "burn", n: 2, secs: 4 }] })] },
  { id: "kho_dang_thu_vuong", name: "Khô Đằng Thụ Vương", rank: 1, species: "co_moc_thu_nhan", aura: "#a0b040", skills: [
    bs("Rễ Trói", "circle", 32, { at: "target", range: 130, dmg: 1.2, status: [{ s: "root", secs: 2 }] }),
    bs("Hút Sinh", "circle", 56, { dmg: 1.4, drain: 0.05 })] },
  // Thú vương Lạc Nhật (BĐ6b): mượn loài Hắc Thủy Mãng. GĐ2 bản tối thiểu: thay "hang chia nửa băng / nửa lửa đổi chỗ mỗi 12 giây" bằng
  // hai dải rộng phủ nửa hang phía mục tiêu, báo trước 2 giây, luân phiên băng (Đóng băng 1,5 giây, #116) và lửa (Thiêu đốt nặng).
  { id: "luong_nghi_thu_ho_xa", name: "Lưỡng Nghi Thủ Hộ Xà", rank: 2, species: "hac_thuy_mang", aura: "#9ad8ff", hp: 7, skills: [
    bs("Băng Tức", "cone", 62, { arc: 80, warn: 1.2, dmg: 1.4, cd: 8, status: [{ s: "slow", secs: 3 }] }),
    bs("Hỏa Tức", "cone", 62, { arc: 80, warn: 1.2, dmg: 1.5, cd: 8, status: [{ s: "burn", n: 3, secs: 5 }] })],
    phase2: { name: "Lưỡng Nghi Luân Chuyển", desc: "nửa hang hóa băng, nửa hang hóa lửa luân phiên (báo trước 2 giây), tốc độ +20%", spd: 1.2, skills: [
      bs("Lưỡng Nghi Băng", "line", 120, { w: 160, range: 140, warn: 2, dmg: 1.5, cd: 12, status: [{ ...FREEZE, secs: 1.5 }] }),
      bs("Lưỡng Nghi Hỏa", "line", 120, { w: 160, range: 140, warn: 2, dmg: 1.6, cd: 12, status: [{ s: "burn", n: 4, secs: 6 }] })] } },
  // Cực Bắc Chi Địa (BĐ6c, bảng 5.3; mọi số đã chốt). Đóng băng = Đóng băng (FREEZE, #116), giam = Trói, "làm chậm tăng dần" = Làm
  // chậm; "3 ảo ảnh nổ vòng" của Phân Thân là 3 vòng rơi quanh mục tiêu; Huyền Băng Tỏa Liên Mãng mượn Hàn Băng Địa Long
  // (Cực Bắc không có loài rắn thường).
  { id: "ngan_nguyet_tuyet_lang_vuong", name: "Ngân Nguyệt Tuyết Lang Vương", rank: 1, species: "tuyet_lang", aura: "#c0cce0", skills: [
    bs("Bão Tuyết", "circle", 56, { dmg: 1.2, status: [{ s: "slow", secs: 3 }] }),
    bs("Hú Bầy", "circle", 40, { dmg: 0.8, cd: 12, summon: { species: "tuyet_lang", n: 3 } })] },
  { id: "luc_vi_bang_ho", name: "Lục Vĩ Băng Hồ", rank: 1, species: "tuyet_vi_yeu_ho", aura: "#ff9ad5", skills: [
    bs("Phân Thân", "circle", 26, { at: "target", range: 130, count: 3, scatter: 60, dmg: 1.5 }),
    bs("Mị Nhãn", "cone", 60, { arc: 80, dmg: 1.3, status: [{ ...CHARM_P, secs: 1 }] })] },
  { id: "huyen_bang_toa_lien_mang", name: "Huyền Băng Tỏa Liên Mãng", rank: 1, species: "han_bang_dia_long", aura: "#5a9cc9", skills: [
    bs("Băng Liên Phong Tỏa", "circle", 44, { dmg: 1.2, status: [{ s: "root", secs: 2 }] }),
    bs("Băng Trùy Vũ", "circle", 22, { at: "target", range: 140, count: 5, scatter: 60, dmg: 1.4 })] },
  { id: "bang_bich_hat_vuong", name: "Băng Bích Hạt Vương", rank: 1, species: "bang_bich_hat", aura: "#7fd0ff", skills: [
    bs("Tam Liên Châm", "line", 110, { w: 12, count: 3, spread: 45, dmg: 1.7 }),
    bs("Cực Hàn Lĩnh Vực", "circle", 60, { dmg: 1, status: [{ s: "slow", secs: 4 }] })] },
  // Thú vương Cực Bắc (BĐ5 + BĐ6c, đã chốt). Giai đoạn 2 "Cực Hàn" (#163, thiết kế gốc): tầng Hàn tích theo thời gian, đủ tầng thì
  // Đóng băng (STATUS.chill), Hỏa Đàn / thanh tẩy xả tầng (ColdDef); thêm gió cực hàn quanh thân (Làm chậm). Băng phong dưới chân người
  // bị đánh dấu của bản tối thiểu (thay cho tầng Hàn) đã bỏ. Mỗi 5 giây một tầng: không về Hỏa Đàn thì 20 giây bị Đóng băng một lần;
  // Hỏa Đàn ở nửa trái hang, cách tâm hang (chỗ thú vương sinh) khoảng một phần tư bề ngang hang; phía sau theo phép chiếu isometric
  // (x + y nhỏ) nên vách hang không che đống lửa.
  { id: "huyen_minh_bang_giao", name: "Huyền Minh Băng Giao", rank: 2, species: "han_bang_dia_long", aura: "#8ad8ff", hp: 8, skills: [
    bs("Băng Phong Thiên Lý", "line", 230, { w: 20, range: 200, warn: 1.3, dmg: 1.8, cd: 10 }),
    bs("Băng Trùy Vũ", "circle", 22, { at: "target", range: 150, count: 6, scatter: 70, warn: 1.2, dmg: 1, cd: 8, status: [{ s: "slow", secs: 2 }] })],
    phase2: { name: "Cực Hàn", desc: "người tham gia trong hang tích tầng Hàn, đủ tầng thì bị đóng băng; đứng cạnh Hỏa Đàn hoặc được thanh tẩy để xả tầng; tốc độ +20%",
      spd: 1.2, cold: { every: 5, fire: { r: 40, at: [0.25, 0.5], clear: 20 } }, skills: [
      bs("Cực Hàn Phong Bạo", "circle", 64, { warn: 2, dmg: 0.8, cd: 12, status: [{ s: "slow", secs: 4 }] })] } },
  // Hải Thần Đảo (BĐ6d, 50.000–100.000 năm; bảng 5.3, mọi số đã chốt). Bản tối thiểu: "2 nón liên tiếp" của Song Kìm là 2 nón tỏa
  // 70° cùng lúc; "8 vệt luân phiên" của Bát Xúc Đập là 8 vệt tỏa đều quanh thân tung cùng lúc; "che tầm nhìn" của Phun Mực thay bằng
  // Câm lặng + Làm chậm (client chưa có hiệu ứng che màn hình); Huyết Khí nhắm người tham gia ít máu nhất (`weak`).
  { id: "hac_giap_cu_giai_vuong", name: "Hắc Giáp Cự Giải Vương", rank: 1, species: "thiet_giap_cu_giai", aura: "#4a5a7a", skills: [
    bs("Song Kìm", "cone", 54, { arc: 80, count: 2, spread: 70, dmg: 1.7 }),
    bs("Phun Bọt", "circle", 56, { dmg: 1, status: [{ s: "slow", secs: 3 }] })] },
  { id: "ma_chuong_vuong", name: "Ma Chương Vương", rank: 1, species: "tham_hai_ma_chuong", aura: "#8a3aff", skills: [
    bs("Bát Xúc Đập", "line", 100, { w: 12, count: 8, spread: 315, range: 80, dmg: 1.6, cd: 9 }),
    bs("Phun Mực", "circle", 40, { at: "target", range: 130, dmg: 1, status: [{ s: "silence", secs: 2 }, { s: "slow", secs: 2 }] })] },
  { id: "huyet_sa_bao_quan", name: "Huyết Sa Bạo Quân", rank: 1, species: "huyet_nha_cu_sa", aura: "#ff2a3a", skills: [
    bs("Tam Liên Xé", "line", 110, { w: 14, count: 3, spread: 40, dmg: 1.7 }),
    bs("Huyết Khí", "circle", 34, { at: "target", range: 160, warn: 1, dmg: 1.8, weak: true })] },
  { id: "hac_uyen_ma_kinh", name: "Hắc Uyên Ma Kình", rank: 1, species: "tham_hai_ma_kinh", aura: "#1a3aa0", skills: [
    bs("Hấp Thủy", "circle", 90, { range: 80, warn: 1, dmg: 0.8, cd: 10, pull: 70 }),
    bs("Thủy Trụ", "circle", 26, { at: "target", range: 150, count: 5, scatter: 70, dmg: 1.5 })] },
  // Thú vương Hải Thần Đảo (BĐ6d), 95.000 năm, máu x8. Bản tối thiểu: Thôn Hải kéo mọi người trong vòng lớn về phía thú vương và gây
  // sát thương cùng lúc ("hút về giữa rồi nổ vòng" gộp làm một); GĐ2 "vùng ngập luân phiên làm chậm 50%" là dải nước rộng báo trước 2
  // giây gây Làm chậm (40%, STATUS.slow), "xoáy nước kéo người vào" là các vòng rơi ngẫu nhiên kéo người trúng về phía thú vương.
  { id: "tham_hai_ma_kinh_vuong", name: "Thâm Hải Ma Kình Vương", rank: 2, species: "tham_hai_ma_kinh", aura: "#3a8aff", hp: 8, years: 95000, skills: [
    bs("Ma Kình Hống", "circle", 70, { warn: 1.3, dmg: 1.4, cd: 10, status: [{ s: "stun", secs: 1.5 }] }),
    bs("Thôn Hải", "circle", 110, { range: 100, warn: 1.4, dmg: 1.2, cd: 12, pull: 80 })],
    phase2: { name: "Thủy Triều Dâng", desc: "nước dâng thành dải làm chậm (báo trước 2 giây), xoáy nước kéo người vào, tốc độ +20%", spd: 1.2, skills: [
      bs("Thủy Triều", "line", 140, { w: 150, range: 160, warn: 2, dmg: 1.2, cd: 10, status: [{ s: "slow", secs: 4 }] }),
      bs("Xoáy Nước", "circle", 30, { at: "target", range: 160, count: 4, scatter: 80, warn: 1.5, dmg: 1.2, cd: 9, pull: 40 })] } },
  // Boss thế giới 100.000 năm ở Lõi Tinh Đấu (BĐ6e, mục 5.4; mọi số đã chốt). Máu / sát thương theo WORLD; chiêu thường ở `skills`,
  // cơ chế buộc đổi võ hồn ở `world`. "Vết thương sâu" là trạng thái thường nhưng nặng và lâu (Phá giáp 3 tầng / Trúng độc 3 tầng
  // 30 giây), chỉ thanh tẩy (tiên cơ / hồn kỹ phụ trợ) giải được vì Lõi Tinh Đấu không có vùng an toàn.
  { id: "thai_than_cu_vien", name: "Thái Thản Cự Viên", rank: 3, species: "thai_than_cu_vien", aura: "#ff9a3a", skills: [
    bs("Cự Thạch", "circle", 36, { at: "target", range: 260, count: 3, scatter: 70, warn: 1.4, dmg: 1.4, cd: 8 }),
    bs("Địa Liệt Quyền", "circle", 64, { warn: 1.2, dmg: 1.8, cd: 7, status: [{ s: "stun", secs: 0.8 }] })],
    world: {
      charge: { every: 40, need: 3, stun: 3,
        skill: bs("Đại Địa Chấn", "circle", 0, { floor: true, safe: FLOOR_SAFE.charge, warn: 4, dmg: 3, cd: 999, status: [{ s: "armor", n: 3, secs: 30 }, { s: "stun", secs: 1 }] }) },
      armor: { name: "Bá Thể", every: 35, pct: 0.06, secs: 12, he: "cuong_cong", mult: 3 },
    } },
  { id: "thien_thanh_nguu_mang", name: "Thiên Thanh Ngưu Mãng", rank: 3, species: "thien_thanh_nguu_mang", aura: "#3ad0a0", skills: [
    bs("Ngưu Giác Xung", "line", 300, { w: 24, range: 260, warn: 1.4, dmg: 2.2, cd: 10, dash: true }),
    bs("Mãng Vĩ Tảo", "cone", 80, { arc: 160, warn: 1.2, dmg: 1.6, cd: 7 })],
    world: {
      miasma: { every: 30, skill: bs("Thanh Lân Độc Vụ", "circle", 0, { floor: true, safe: FLOOR_SAFE.floor, warn: 2.5, dmg: 0.5, cd: 999, status: [{ s: "poison", n: 3, secs: 30 }] }) },
      dive: { name: "Du Thủy", every: 40, secs: 3, he: "man_cong", weakSecs: 6, away: 80 },
    } },
];
const BOSS_INDEX = new Map(BOSSES.map((b, i) => [b.id, i]));
/** Chỉ số trong BOSSES của một mã (-1 nếu không có). */
export const bossIndex = (id: string) => BOSS_INDEX.get(id) ?? -1;
/** Niên hạn tà hóa thú vương của bản đồ `mapId` (sinh ra và rương): BossDef.years nếu có, không thì mức trên MAPS.years; null nếu không có. */
export const kingYears = (mapId: string): number | null => {
  const m = MAPS[mapId], b = m?.king ? BOSSES[bossIndex(m.king)] : undefined;
  return b?.years ?? m?.years?.[1] ?? null;
};
/**
 * Tinh anh (mục 5.4, đã chốt 2026-10-20): máu x`hp`, sát thương x`dmg` so với hồn thú thường cùng loài, cùng
 * năm (niên hạn = mức trên của vùng); kinh nghiệm x`xp`; tỉ lệ hồn cốt x`bone` (nhân vào boneChance, bảng rơi 4.1); hồi sinh
 * ngẫu nhiên `respawn` giây sau khi bị hạ; sprite loài gốc phóng `scale`.
 * Người tham gia: đứng trong `radius` pixel lúc tinh anh bắt đầu giao chiến (lần đầu bị đánh), hoặc gây sát thương sau đó; ở ngoài
 * bán kính `outSecs` giây liên tục hoặc rời phòng thì bị loại; số người giảm tối đa 1 mỗi `dropEvery` giây; `idleSecs` giây không còn
 * người tham gia nào trong bán kính thì bỏ giao chiến (về chỗ, hồi đầy máu, xóa danh sách và đóng góp).
 * Giới hạn nhiều kênh (#119): nhận thưởng tinh anh (kinh nghiệm x`xp`, quyền ưu tiên đồ rơi tinh anh) của một loài tinh anh trên một bản
 * đồ thì `lock` giây sau mới nhận lại thưởng của loài đó trên bản đồ đó, ở bất kỳ kênh nào; không lớn hơn mức dưới của `respawn` để
 * chờ tinh anh hồi sinh trong cùng một phòng không bao giờ bị chặn (phòng mở lại sinh tinh anh ngay: hạ trong lúc còn khóa chỉ được
 * thưởng như hồn thú thường).
 */
export const ELITE = { hp: 2.5, dmg: 1.5, xp: 2.5, bone: 3, respawn: [480, 720] as [number, number], scale: 1.25,
  radius: 250, outSecs: 30, dropEvery: 10, idleSecs: 15, lock: 480 };
/** Máu tăng theo số người tham gia (mục 5.4, tinh anh trở lên): máu tối đa × (1 + BOSS_HP_PER_PLAYER × (N − 1)). */
export const BOSS_HP_PER_PLAYER = 0.6;
export const bossHpMult = (n: number) => 1 + BOSS_HP_PER_PLAYER * (Math.max(1, Math.floor(n)) - 1);
/** Loài gốc (BeastDef) của hồn thú bậc `rank` có `species` đồng bộ (BEASTS với hồn thú thường, BOSSES với bậc > 0). */
export const beastBase = (rank: number, species: number): BeastDef | undefined =>
  rank > 0 ? BEASTS[beastIndex(BOSSES[species]?.species ?? "")] : BEASTS[species];
/** Tên hiện trên bản đồ / khung mục tiêu: "Phong Lang", "Tinh anh Huyết Nhãn Phong Lang". */
export const beastName = (rank: number, species: number) =>
  rank > 0 ? `${RANK_NAMES[rank] ?? ""} ${BOSSES[species]?.name ?? ""}`.trim() : BEASTS[species]?.name ?? "Hồn thú";

// ---------- Hiệu ứng có lợi trên hồn thú (từ BĐ4; "xóa buff địch" của Thiên Càn Bạch Ngọc Đỉnh xóa các hiệu ứng này) ----------
/** Thứ tự là bit trong `BeastState.buff` (uint8). Chỉ thêm vào cuối. */
export const BEAST_BUFF_IDS = ["rage"] as const;
export type BeastBuffId = (typeof BEAST_BUFF_IDS)[number];
export const BEAST_BUFFS: Record<BeastBuffId, { name: string; col: string }> = {
  rage: { name: "Cuồng nộ", col: "#ff5a3a" },
};
export const beastBuffBit = (b: BeastBuffId) => 1 << BEAST_BUFF_IDS.indexOf(b);
/**
 * Cuồng nộ của tinh anh (đã chốt): máu dưới `hp` phần tối đa thì nổi cuồng nộ `secs` giây, sát thương (đánh thường và chiêu) +`dmg`,
 * tốc độ +`spd`; hết giờ hoặc bị xóa thì `cd` giây sau mới nổi lại được (nếu máu vẫn dưới mức).
 */
export const ELITE_RAGE = { hp: 0.5, dmg: 0.3, spd: 0.25, secs: 10, cd: 20 };

// ---------- Tà hóa thú vương (boss bản đồ, mục 5.4, 6; bước BĐ5, mọi số đã chốt) ----------
/**
 * Thú vương: máu x BossDef.hp (6–8 theo bản đồ), sát thương x`dmg` so với loài gốc cùng năm (niên hạn = mức trên của bản đồ);
 * kinh nghiệm x`xp` cho mọi người đóng góp còn trong phòng; sprite loài gốc phóng `scale` (khoảng 96×96, mục 5.11).
 * Giai đoạn 2: máu còn `phaseHp` thì gầm lên, đứng yên `roarSecs` giây (không nhận khống chế), rồi thêm chiêu BossDef.phase2 và nhanh hơn.
 * Người tham gia như tinh anh nhưng bán kính là cả hang (object `boss`): ngoài hang `outSecs` giây liên tục thì bị loại, số người giảm
 * tối đa 1 mỗi `dropEvery` giây, `idleSecs` giây không còn ai trong hang thì về chỗ, hồi đầy.
 * Lịch: xuất hiện theo KING_TIMES, báo toàn server trước `warnSecs` giây và lúc xuất hiện; không ai hạ trong `lifeSecs` giây thì rút đi.
 * Thưởng: đóng góp (sát thương) từ `share` (3%, đã chốt) và còn trong phòng thì nhận rương; tối đa `daily` lần/ngày (đã chốt), tính
 * chung mọi bản đồ, đặt lại 00:00 giờ Việt Nam (BOSS_TZ). Hồn hoàn ưu tiên người đóng góp nhiều nhất DROP_OWNER_SECS giây.
 */
export const KING = { dmg: 2, xp: 3, scale: 3, phaseHp: 0.5, roarSecs: 2, outSecs: 30, dropEvery: 10, idleSecs: 15,
  warnSecs: 300, lifeSecs: 900, share: 0.03, daily: 3 };
/**
 * Đóng góp hỗ trợ (bước 9.2, đã chốt 2026-10-20): mỗi điểm sinh lực hồi thực (bỏ phần tràn) hoặc khiên tạo thêm cho **người khác**
 * đang là người tham gia của tinh anh / thú vương / boss thế giới tính bằng ngần này điểm sát thương vào đóng góp của người hồi
 * (hồi / khiên cho chính mình không tính). Đóng góp tổng = sát thương + hỗ trợ × SUPPORT_CONTRIB, dùng cho ngưỡng rương (`share`),
 * kinh nghiệm chia cho người đóng góp, bảng xếp hạng và ưu tiên hồn hoàn của tinh anh / thú vương; hồn hoàn đỏ của người đứng đầu
 * boss thế giới vẫn xếp theo sát thương.
 */
export const SUPPORT_CONTRIB = 1;
/** Loại boss trong bảng `boss_claims` (cột `kind`): thú vương BĐ5; boss thế giới BĐ6 thêm loại riêng (giới hạn 1 lần/ngày). */
export const BOSS_CLAIM_KING = "thu_vuong";
/** Múi giờ của lịch boss và ngày nhận thưởng (mục 6): đổi ngày lúc 00:00 giờ Việt Nam, không dùng giờ máy chủ hay client. */
export const BOSS_TZ = "Asia/Ho_Chi_Minh";
/** Giờ xuất hiện của tà hóa thú vương mỗi ngày (giờ Việt Nam, "HH:MM"; mục 5.4: 20:00 và 22:00). Boss thế giới 21:00 ở BĐ6. */
export const KING_TIMES = ["20:00", "22:00"];
const TZ_FMT = new Intl.DateTimeFormat("en-CA", { timeZone: BOSS_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
/** Giờ Việt Nam của thời điểm `ms` (UTC): năm, tháng, ngày, giờ, phút, giây. */
export function vnClock(ms: number) {
  const p = Object.fromEntries(TZ_FMT.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}
/** Ngày nhận thưởng boss ("2026-10-19") theo giờ Việt Nam: cột `boss_claims.day`. */
export const vnDay = (ms: number) => { const c = vnClock(ms); return `${c.y}-${String(c.mo).padStart(2, "0")}-${String(c.d).padStart(2, "0")}`; };
/** Thời điểm (ms UTC) của giờ Việt Nam `hh:mm` trong ngày Việt Nam chứa `ms`, cộng thêm `dayOff` ngày. */
export function vnAt(ms: number, hhmm: string, dayOff = 0) {
  const c = vnClock(ms), off = Date.UTC(c.y, c.mo - 1, c.d, c.h, c.mi, c.s) - Math.floor(ms / 1000) * 1000; // giờ VN − UTC
  const [h, m] = hhmm.split(":").map(Number);
  return Date.UTC(c.y, c.mo - 1, c.d + dayOff, h, m) - off;
}
/** Các khung giờ thú vương (ms UTC) của hôm qua, hôm nay, ngày mai theo giờ Việt Nam, tăng dần. */
export const kingSlots = (ms: number) => [-1, 0, 1].flatMap((k) => KING_TIMES.map((t) => vnAt(ms, t, k))).sort((a, b) => a - b);
/** Khung giờ thú vương kế tiếp sau `ms` (ms UTC). */
export const kingNext = (ms: number) => kingSlots(ms).find((s) => s > ms)!;
/** Khung giờ thú vương đang diễn ra lúc `ms` (đã xuất hiện, chưa quá KING.lifeSecs), không có thì null. */
export const kingActive = (ms: number) => kingSlots(ms).find((s) => s <= ms && ms < s + KING.lifeSecs * 1000) ?? null;
/** "20:00" của khung `slot` theo giờ Việt Nam. */
export const vnHHMM = (ms: number) => { const c = vnClock(ms); return `${String(c.h).padStart(2, "0")}:${String(c.mi).padStart(2, "0")}`; };
/**
 * Rương tà hóa thú vương (mục 5.3 "Rơi đặc trưng", 5.4; đã chốt). Mở trong túi đồ (cần `slots` ô trống):
 * - Hồn cốt: tỉ lệ boneChance(năm thú vương, `bone`) (bảng rơi 4.1 nhân hệ số), loài gốc của thú vương, cùng số năm, vị trí ngẫu nhiên.
 * - Mảnh võ hồn: `shards` [ít nhất, nhiều nhất] mảnh của một võ hồn trong kingShardPool (mảnh của bản đồ đó, Tà Hỏa Phượng Hoàng,
 *   cả `every` (võ hồn không bản đồ nào rơi, trọng số 2; từ 8.3 là Phá Hồn Thương, từ 2026-10-20 để trống vì Phá Hồn Thương rơi ở Hải Thần Đảo),
 *   và trước BĐ6 cả võ hồn của bản đồ chưa mở để không võ hồn nào bị khóa hẳn).
 * - Mảnh UR: `ur` (5%, đã chốt) thêm 1 mảnh Hạo Thiên Chùy hoặc Cửu Bảo Lưu Ly Tháp; từ BĐ6 (có boss thế giới, BĐ6e) bỏ: `ur` = 0,
 *   mảnh UR chỉ còn trong rương boss thế giới (WORLD_CHEST, mục 5.3 "Mảnh UR trước BĐ6").
 * - Hồn hạch sao cao (từ 5.1): luôn 1 món, sao cao nhất của coreStarBand(năm thú vương) (rollCore `high`), bộ theo MapDef.cores của bản
 *   đồ thú vương như hồn hạch rơi. `slots` = 4: hồn cốt, mảnh, mảnh UR, hồn hạch mỗi thứ có thể cần một ô mới.
 */
export const KING_CHEST = { slots: 4, bone: 20, shards: [3, 5] as [number, number], ur: 0, urShards: ["hao_thien_chuy", "cuu_bao_luu_ly_thap"],
  fire: "ta_hoa_phuong_hoang", every: [] as string[], later: ["bich_lan_xa_hoang", "ky_nhung_thong_thien_cuc", "hoa_long", "yeu_ho", "can_khon_hon_nguyen_toa",
    "nguyet_nhan", "quy_mi", "thien_can_bach_ngoc_dinh", "hoa_anh"] };
/** Võ hồn có thể rơi mảnh từ rương thú vương của bản đồ `mapId`, kèm trọng số: mảnh của bản đồ 3, Tà Hỏa và `every` 2, bản đồ chưa mở 1. */
export const kingShardPool = (mapId: string) => [
  ...(MAPS[mapId]?.shards ?? []).map((v) => ({ vohon: v, w: 3 })), { vohon: KING_CHEST.fire, w: 2 },
  ...KING_CHEST.every.map((v) => ({ vohon: v, w: 2 })),
  ...KING_CHEST.later.filter((v) => !Object.values(MAPS).some((m) => m.shards.includes(v))).map((v) => ({ vohon: v, w: 1 })),
];
/** Mã vật phẩm rương của thú vương `bossId` (cột `items.code`; mỗi thú vương một mã, gộp được). Không đổi cách đặt mã. */
export const chestCode = (bossId: string) => `ruong_${bossId}`;

// ---------- Boss thế giới 100.000 năm (Lõi Tinh Đấu, mục 5.4, 6; bước BĐ6e, mọi số đã chốt) ----------
/**
 * Boss thế giới: máu x`hp` (30, mục 5.4), sát thương x`dmg` so với loài gốc cùng năm (100.000 năm); kinh nghiệm x`xp` cho mọi người
 * đóng góp còn trong phòng; sprite loài gốc phóng `scale`. Người tham gia / máu theo số người / bỏ giao chiến như thú vương (sàn đấu
 * là object `boss` của Lõi Tinh Đấu): ngoài sàn `outSecs` giây thì bị loại, số người giảm tối đa 1 mỗi `dropEvery` giây, `idleSecs`
 * giây không còn ai trong sàn thì về chỗ, hồi đầy.
 * Lịch: 1 lần/ngày lúc WORLD_TIME (21:00 giờ Việt Nam, đã chốt), báo toàn server trước `warnSecs` giây và lúc xuất hiện; hai boss
 * luân phiên theo ngày (worldBossOn). Sau `enrageSecs` giây thì nổi giận (BeastState.phase = 2): sát thương x`rageDmg`, tốc độ x`rageSpd`,
 * hồi chiêu x`rageCd`, thêm WORLD_SLAM mỗi `slamEvery` giây. Không ai hạ trong `lifeSecs` giây thì lặn xuống hồ, không ai nhận thưởng.
 * Điểm yếu hệ: máu xuống mỗi mốc `weakAt` thì hiện một hệ `weakSecs` giây: võ hồn hệ đó gây x`weakMult`, hệ khác x`offMult`.
 * Cơ chế riêng mỗi boss (BossDef.world) bắt đầu sau `every` × `firstMech` giây.
 * Thưởng: đóng góp (sát thương) từ `share` (3%, đã chốt) và còn trong phòng thì nhận hồn hoàn (WORLD_RING) và rương (WORLD_CHEST);
 * tối đa `daily` lần/ngày (1, đã chốt), loại BOSS_CLAIM_WORLD trong `boss_claims`, đặt lại 00:00 giờ Việt Nam.
 */
export const WORLD = { hp: 30, dmg: 3, xp: 5, scale: 4, outSecs: 30, dropEvery: 10, idleSecs: 15, warnSecs: 300, lifeSecs: 900,
  enrageSecs: 600, rageDmg: 3, rageSpd: 1.4, rageCd: 0.6, slamEvery: 15, weakAt: [0.75, 0.5, 0.25], weakSecs: 15, weakMult: 2.5, offMult: 0.5,
  firstMech: 0.5, share: 0.03, daily: 1 };
/** Chiêu toàn sàn khi nổi giận (mục 5.4, mỗi WORLD.slamEvery giây): né bằng cách đứng trong vòng an toàn (FLOOR_SAFE) hoặc ra khỏi sàn. */
export const WORLD_SLAM = bs("Bạo Nộ", "circle", 0, { floor: true, safe: FLOOR_SAFE.floor, warn: 2.5, dmg: 1, cd: WORLD.slamEvery });
/** Giờ xuất hiện của boss thế giới mỗi ngày (giờ Việt Nam; đã chốt 21:00, không trùng lịch thú vương 20:00 / 22:00). */
export const WORLD_TIME = "21:00";
/** Loại boss trong bảng `boss_claims` (cột `kind`) của boss thế giới: giới hạn WORLD.daily lần/ngày, riêng với lượt thú vương. */
export const BOSS_CLAIM_WORLD = "boss_the_gioi";
/** Khung giờ boss thế giới (ms UTC) của hôm qua, hôm nay, ngày mai theo giờ Việt Nam, tăng dần. */
export const worldSlots = (ms: number) => [-1, 0, 1].map((k) => vnAt(ms, WORLD_TIME, k));
/** Khung giờ boss thế giới kế tiếp sau `ms`. */
export const worldNext = (ms: number) => worldSlots(ms).find((s) => s > ms)!;
/** Khung giờ boss thế giới đang diễn ra lúc `ms` (đã xuất hiện, chưa quá WORLD.lifeSecs), không có thì null. */
export const worldActive = (ms: number) => worldSlots(ms).find((s) => s <= ms && ms < s + WORLD.lifeSecs * 1000) ?? null;
/** Số ngày (giờ Việt Nam) kể từ 1970-01-01 của thời điểm `ms`: hai boss thế giới luân phiên theo số này. */
const vnDayNum = (ms: number) => { const c = vnClock(ms); return Math.floor(Date.UTC(c.y, c.mo - 1, c.d) / 86400000); };
/**
 * Boss thế giới của ngày chứa khung `ms` ở bản đồ `mapId` (MapDef.world): luân phiên theo ngày Việt Nam (quyết định BĐ6e: luân
 * phiên, không bốc ngẫu nhiên, để người chơi biết trước hôm nay đánh con nào). Bản đồ không có boss thế giới thì null.
 */
export const worldBossOn = (mapId: string, ms: number) => { const l = MAPS[mapId]?.world; return l?.length ? l[vnDayNum(ms) % l.length] : null; };
/** Bản đồ có boss thế giới (MapDef.world): Lõi Tinh Đấu. */
export const worldMaps = () => Object.values(MAPS).filter((m) => m.world?.length);
/**
 * Hồn hoàn thưởng (mục 5.4): người đóng góp nhiều nhất nhận hồn hoàn đỏ `top` năm; những người khác (từ WORLD.share) có `red` cơ hội
 * nhận hồn hoàn đỏ, còn lại hồn hoàn đen trong `black` năm (rollYears). Vào thẳng túi đồ cùng rương (không rơi xuống đất).
 */
export const WORLD_RING = { top: 100000, red: 0.1, black: [80000, 99999] as [number, number] };
/**
 * Rương boss thế giới (mục 5.3 "Rơi đặc trưng", 5.4): cần `slots` ô trống. Hồn cốt boneChance(100.000 năm, `bone`), loài gốc của boss;
 * `ur` [ít nhất, nhiều nhất] mảnh UR (một võ hồn trong KING_CHEST.urShards); luôn 1 hồn hạch sao trong `stars` của bộ bất kỳ (CORE_SETS).
 */
export const WORLD_CHEST = { slots: 4, bone: 3, ur: [1, 2] as [number, number], stars: [5, 6] as [number, number] };

// ---------- Hiệu ứng có lợi trên hồn sư (hồn kỹ phụ trợ; thuộc hồn sư nên đổi võ hồn vẫn còn, như khiên) ----------
/** Thứ tự là bit trong `PlayerState.buff`. atk: +công, spd: +tốc độ, def: giảm sát thương nhận, crit: +tỉ lệ chí mạng,
 *  mp: giảm tiêu hao hồn lực của hồn kỹ, inv: miễn mọi sát thương, phoenix: lãnh vực phượng hoàng (từ 2.5b, Tà Hỏa Phượng Hoàng):
 *  hồn thú trong bán kính PHOENIX_FIELD_R quanh hồn sư nhận thêm v sát thương từ mọi nguồn; hide: tàng hình (từ 2.5c, Yêu Hồ):
 *  hồn thú bỏ mục tiêu và không nhắm tới hồn sư, đánh thường, tung hồn kỹ khác hoặc tiên cơ thì hiện hình; leech: hút huyết
 *  (từ 2.5d, Quỷ Mị): v phần mọi sát thương hồn sư gây ra lên hồn thú hồi thành sinh lực của võ hồn ra trận.
 *  Chỉ thêm vào cuối; `PlayerState.buff` là uint16 (từ 2.5d) nên còn chỗ cho 16 hiệu ứng. */
export const BUFF_IDS = ["atk", "spd", "def", "crit", "mp", "inv", "phoenix", "hide", "leech"] as const;
export type BuffId = (typeof BUFF_IDS)[number];
export const BUFFS: Record<BuffId, { name: string; col: string }> = {
  atk:  { name: "Tăng công",       col: "#ff8a5a" },
  spd:  { name: "Tăng tốc",        col: "#7ef0ff" },
  def:  { name: "Tăng thủ",        col: "#f2c84b" },
  crit: { name: "Tăng chí mạng",   col: "#ffe14d" },
  mp:   { name: "Giảm tiêu hao",   col: "#5a9cc9" },
  inv:  { name: "Miễn sát thương", col: "#fff2b0" },
  phoenix: { name: "Lãnh vực Phượng Hoàng", col: "#ff6a2a" },
  hide: { name: "Tàng hình", col: "#ff9ad5" },
  leech: { name: "Hút huyết", col: "#d04a6a" },
};
/** Bán kính lãnh vực phượng hoàng (pixel), đi theo hồn sư; đổi võ hồn vẫn còn như mọi hiệu ứng có lợi (bước 2.5b, đã chốt). */
export const PHOENIX_FIELD_R = 90;
export const buffBit = (b: BuffId) => 1 << BUFF_IDS.indexOf(b);
/** Tỉ lệ chí mạng gốc của đòn đánh vào hồn thú và hệ số sát thương chí mạng. */
export const CRIT = { chance: 0.12, mult: 1.8 };
/** Hồi chiêu đánh thường (giây); bộ hồn hạch Linh Miêu 4 món chia cho (1 + tăng tốc đánh). */
export const ATTACK_CD = 0.38;
/** Đòn đánh thường (hồn sư: MapRoom.attack; hồn thú: MapRoom.tick) gây công x (1 ± ATK_SPREAD), ngẫu nhiên đều; `r` trong [0, 1). */
export const ATK_SPREAD = 0.15;
export const atkRoll = (r: number) => 1 + (2 * r - 1) * ATK_SPREAD;
/** Hồi chiêu đòn đánh thường của hồn thú (giây; MapRoom.tick, ủy thác offline offlineFight). */
export const BEAST_ATK_CD = 1.1;

// ---------- Hồn kỹ (mục 5.2 "Hồn kỹ theo vòng") ----------
/**
 * Sức mạnh hồn kỹ theo số năm của hồn hoàn vòng đó (mục 5.2): nội suy theo log10(số năm) giữa các mốc TIERS[i].years ->
 * TIER_MULT[i]. Đúng mốc bậc thì bằng TIER_MULT cũ (10 năm 1, 100 năm 1,35, 1.000 năm 1,9, 1 vạn năm 2,8, 10 vạn năm 4,5),
 * ví dụ 423 năm ≈ 1,69, 5.000 năm ≈ 2,53. Nhân vào sát thương, sát thương theo thời gian.
 */
export function skillPower(years: number) {
  const y = Math.max(TIERS[0].years, Math.min(TIERS[TIERS.length - 1].years, years || TIERS[0].years));
  let i = 0;
  while (i < TIERS.length - 2 && y >= TIERS[i + 1].years) i++;
  const f = (Math.log10(y) - Math.log10(TIERS[i].years)) / (Math.log10(TIERS[i + 1].years) - Math.log10(TIERS[i].years));
  return +(TIER_MULT[i] + (TIER_MULT[i + 1] - TIER_MULT[i]) * Math.max(0, Math.min(1, f))).toFixed(4);
}
/** Hiệu ứng có lợi, hồi máu, khiên, hồi hồn lực tăng chậm hơn sát thương: 1 + (sức mạnh − 1) × BUFF_SCALE. */
export const BUFF_SCALE = 0.3;
export const buffPower = (years: number) => +(1 + (skillPower(years) - 1) * BUFF_SCALE).toFixed(4);
/** Sát thương theo % sinh lực tối đa (pctHp) mỗi nhát không vượt quá PCT_HP_CAP × công × sức mạnh hồn kỹ. */
export const PCT_HP_CAP = 3;
/** Tốc độ bay của mũi hồn kỹ (pixel/giây); tầm bay `r` quy ra thời gian sống r / PROJ_SPEED. */
export const PROJ_SPEED = 170;

/** Vùng tác dụng: quanh thân, nửa trước mặt, lướt thẳng, mục tiêu gần nhất, bắn mũi, chỉ bản thân. */
export type SkillArea = "around" | "front" | "dash" | "target" | "proj" | "self";
/** Gây trạng thái: `n` tầng (mặc định 1), `secs` giây (mặc định STATUS[s].secs). */
export interface StatusApply { s: StatusId; n?: number; secs?: number; }
/**
 * Một hồn kỹ (hoặc chiêu tiên cơ riêng, khi đó cost = cd = 0) do server chạy theo dữ liệu, các đợt sau chỉ cần thêm bảng.
 * - `r`: bán kính (around, front), tầm tìm mục tiêu (target), quãng lướt (dash), tầm bay (proj).
 * - `dmg`: bội số công × sức mạnh hồn kỹ cho mỗi nhát / mỗi mũi; `n` nhát cách nhau `every` giây (target) hoặc `n` mũi tỏa `spread` độ (proj).
 * - `pctHp`: cộng tỉ lệ sinh lực tối đa của mục tiêu mỗi nhát; `perStack`: cộng bội số công cho mỗi tầng trạng thái trên mục tiêu.
 * - `crit`: cộng tỉ lệ chí mạng; `lifesteal`: hồi sinh lực theo tỉ lệ sát thương gây ra; `pull`: kéo hồn thú trúng về sát thân;
 *   `dash`: lướt tới mục tiêu trước khi đánh (target); `inv`: giây bất tử; `glow`, `shake`: hiệu ứng (màu hào quang hồn hoàn, rung).
 * - `status`: trạng thái gây cho mỗi hồn thú trúng (mỗi nhát); `finisher`: chỉ nhát cuối (ví dụ hất tung).
 * - `self`: hiệu ứng có lợi `buff` (nhân buffPower) trong `secs` giây; `heal` / `shield` / `mp`: hồi sinh lực cả đội, khiên, hồi
 *   hồn lực theo tỉ lệ tối đa (nhân buffPower).
 * Từ 2.5b (lưu phái Thiêu đốt):
 * - `around` có `n` > 1: `n` nhát quanh vị trí hiện tại của hồn sư cách nhau `every` giây (cánh hoa xoay, sát thương liên tục).
 * - `boom`: Viêm bạo: kích nổ mọi tầng Thiêu đốt trên hồn thú trúng (STATUS.burn.boom), rồi đặt lại `keep` tầng.
 * - `push`: đẩy lùi hồn thú trúng ra xa hồn sư ngần ấy pixel (nhân CC_TIER_MULT; hồn thú đang Choáng / Trói không bị đẩy).
 * - `pick: "low"` (target): khóa hồn thú còn ít sinh lực nhất (theo tỉ lệ) trong tầm thay cho hồn thú gần nhất.
 * - `lowHp`: sát thương nhân thêm tới `lowHp` theo phần sinh lực mục tiêu đã mất (1 − sinh lực / tối đa), để hạ mục tiêu yếu máu.
 * - `fly`: bay lên trong ngần ấy giây, chỉ là hiệu ứng hình ảnh (bất tử khi bay dùng `inv`).
 * Từ 2.5c (lưu phái Cảm điện):
 * - `at` (around): đặt vùng tại hồn thú gần nhất trong tầm `at` (không có thì không tung, như vùng "mục tiêu"); có `dash` thì
 *   hồn sư bay tới đó trước (tối đa `dash`). Vùng cố định ở chỗ đặt, không đi theo hồn sư (vùng phong tỏa).
 * - `fixed` (around): vùng cố định ở chỗ hồn sư đứng lúc tung (lãnh vực đặt xuống đất), không đi theo khi hồn sư di chuyển.
 * - `copy` (self): Phục Chế: tung lại hồn kỹ gần nhất của một võ hồn khác còn trong đội và chưa gục (từ 9.3 cả đồng đội tổ đội đứng
 *   trong COPY_R, cùng cửa sổ COPY_WINDOW giây); sát thương và hiệu ứng lên
 *   bản thân (hồi máu, khiên, hồn lực, hiệu ứng có lợi trừ inv/hide) × `copy`, theo hồn hoàn của vòng này.
 * Từ 3.5: `self.cleanse`: giải mọi trạng thái trên hồn sư (PLAYER_STATUS, do chiêu báo trước của hồn thú gây).
 * Từ BĐ4: `dispel`: xóa mọi hiệu ứng có lợi (BEAST_BUFF_IDS, ví dụ Cuồng nộ của tinh anh) trên hồn thú trúng ("xóa buff địch").
 * Từ 8.1a: `ult`: tuyệt kỹ vòng 10 (chỉ là hiệu ứng: mọi người thấy tên tuyệt kỹ lớn và màn hình rung, fx `ult`).
 * Từ 8.1b: `boom.last`: chỉ nhát cuối (around có `n` > 1) mới kích nổ, các nhát trước chồng Thiêu đốt; `boom.mult`: sát thương kích nổ
 *   mạnh thêm ngần ấy phần (cộng với bộ hồn hạch Phượng Hoàng 4 món). Tuyệt kỹ Hỏa Long: Viêm bạo toàn vùng.
 * Từ 8.1c: `shockR` (around): sét tìm mục tiêu Cảm điện: mỗi nhát còn trúng mọi hồn thú (và đối thủ) đang Cảm điện ở ngoài `r` nhưng
 *   trong `shockR` (tuyệt kỹ Lam Điện Bá Vương Long "toàn vực": phủ Cảm điện rộng rồi đổi sang Lam Điện kích nổ cả vùng).
 * Từ #192: `vsSt`: sát thương mỗi nhát nhân thêm (1 + `v`) khi mục tiêu đang có ít nhất một trạng thái trong `s` (Băng Hỏa Lưỡng Nghi
 *   của Võ Hồn Dung Hợp Kỹ, FUSIONS).
 */
export interface SkillDef {
  name: string; desc: string; icon: string; cost: number; cd: number;
  area: SkillArea; r: number; dmg: number;
  n?: number; every?: number; spread?: number; pctHp?: number; perStack?: { s: StatusId; dmg: number };
  crit?: number; lifesteal?: number; pull?: boolean; dash?: number; inv?: number; glow?: boolean; shake?: boolean;
  status?: StatusApply[]; finisher?: StatusApply[];
  boom?: { keep: number; last?: boolean; mult?: number }; push?: number; pick?: "near" | "low"; lowHp?: number; fly?: number;
  at?: number; fixed?: boolean; copy?: number; shockR?: number; vsSt?: { s: StatusId[]; v: number };
  self?: { buff?: Partial<Record<BuffId, number>>; secs?: number; heal?: number; shield?: number; mp?: number; cleanse?: boolean };
  dispel?: boolean;
  ult?: boolean;
}

/**
 * 4 hồn kỹ dùng chung (Giai đoạn 1) cho võ hồn chưa có hồn kỹ riêng. Không đổi số khi thêm hồn kỹ riêng. Từ 2.5d mọi võ hồn trong
 * VOHON đều có hồn kỹ riêng nên không võ hồn nào dùng bảng này nữa (8.3: cả 4 võ hồn thêm sau cũng có); giữ làm dự phòng.
 */
export const SKILLS: SkillDef[] = [
  { name: "Hồn Bạo",    desc: "Nổ hồn lực quanh thân", icon: "✹", cost: 12, cd: 3,   area: "around", r: 50, dmg: 2.2 },
  { name: "Thiểm Kích", desc: "Lao về phía trước",     icon: "➤", cost: 16, cd: 4.5, area: "dash", r: 70, dmg: 2.6, inv: 0.35 },
  { name: "Hồn Tiễn",   desc: "Bắn 10 mũi hồn lực",    icon: "✶", cost: 22, cd: 5,   area: "proj", r: 110.5, dmg: 1.5, n: 10, spread: 360 },
  { name: "Hồn Vực",    desc: "Lãnh vực hủy diệt",     icon: "◎", cost: 40, cd: 12,  area: "around", r: 90, dmg: 4, glow: true, shake: true },
];

/**
 * Hồn kỹ riêng vòng 1–4 theo mã võ hồn (bước 2.5a: 5 võ hồn mẫu, mỗi hệ ít nhất một; 2.5b: 5 võ hồn lưu phái Thiêu đốt; 2.5c: 5 võ hồn lưu phái Cảm điện;
 * 2.5d: 5 võ hồn còn lại, đủ cả 20; 8.3: 4 võ hồn ngoài danh sách SSR cơ bản; mọi số đã chốt). Hồn kỹ thứ i mở khi có
 * hồn hoàn thứ i và mạnh theo số năm của hồn hoàn đó. Võ hồn chưa có trong bảng dùng SKILLS. Bảng chi tiết ở GAME_DESIGN.md 5.2.
 */
export const VOHON_SKILLS: Record<string, SkillDef[]> = {
  // Khống chế, chấn đãng: trói, gom quái, gây Dễ thương.
  lam_ngan_thao: [
    { name: "Triền Nhiễu", desc: "Dây Lam Ngân quấn mục tiêu gần nhất: trói, trúng độc", icon: "❦", cost: 12, cd: 4,
      area: "target", r: 80, dmg: 1.6, status: [{ s: "root" }, { s: "poison" }] },
    { name: "Ký Sinh", desc: "Gieo Lam Ngân ký sinh lên mục tiêu: Dễ thương 6 giây", icon: "✿", cost: 14, cd: 6,
      area: "target", r: 90, dmg: 1.2, status: [{ s: "vuln", secs: 6 }] },
    { name: "Lam Ngân Tù Lung", desc: "Kéo mọi hồn thú quanh thân lại và giam: trói 2,5 giây", icon: "⌘", cost: 24, cd: 9,
      area: "around", r: 90, dmg: 1.5, pull: true, status: [{ s: "root", secs: 2.5 }] },
    { name: "Chu Võng Thúc Phược", desc: "Lưới nhện trói buộc diện rộng: choáng 2 giây", icon: "✳", cost: 40, cd: 13,
      area: "around", r: 70, dmg: 2.6, glow: true, status: [{ s: "stun", secs: 2 }] },
  ],
  // Cường công, chấn đãng: sát thương theo % sinh lực, phá giáp, hất tung.
  hao_thien_chuy: [
    { name: "Hạo Thiên Trọng Kích", desc: "Nện chùy nửa trước mặt, thêm 3% sinh lực tối đa mục tiêu", icon: "⚒", cost: 12, cd: 3.5,
      area: "front", r: 36, dmg: 2.4, pctHp: 0.03 },
    { name: "Chấn Địa Chùy", desc: "Nện đất quanh thân: Phá giáp 2 tầng", icon: "✺", cost: 16, cd: 6,
      area: "around", r: 60, dmg: 1.8, status: [{ s: "armor", n: 2 }] },
    { name: "Loạn Phi Phong Chùy Pháp", desc: "4 nhát chùy liên hoàn vào một mục tiêu, nhát cuối hất tung (choáng 1 giây)", icon: "☄", cost: 24, cd: 8,
      area: "target", r: 50, dash: 30, n: 4, every: 0.22, dmg: 0.9, pctHp: 0.02, finisher: [{ s: "stun", secs: 1 }] },
    { name: "Hạo Thiên Phá Sơn", desc: "Đại chùy giáng xuống diện rộng, thêm 6% sinh lực tối đa, hất tung", icon: "▲", cost: 40, cd: 14,
      area: "around", r: 80, dmg: 4, pctHp: 0.06, glow: true, shake: true, status: [{ s: "stun", secs: 1.2 }] },
  ],
  // Mẫn công, chấn đãng: tốc độ, chí mạng cao, cào liên hoàn.
  u_minh_linh_mieu: [
    { name: "U Minh Đột Thứ", desc: "Lướt xuyên hàng hồn thú phía trước, +25% chí mạng", icon: "➹", cost: 12, cd: 3.5,
      area: "dash", r: 70, dmg: 2.2, crit: 0.25, inv: 0.3 },
    { name: "U Minh Trảo", desc: "Cào 3 nhát liên hoàn, mỗi nhát Phá giáp 1 tầng, +20% chí mạng", icon: "≋", cost: 16, cd: 5,
      area: "target", r: 40, dash: 20, n: 3, every: 0.15, dmg: 0.9, crit: 0.2, status: [{ s: "armor" }] },
    { name: "U Minh Ảnh Bộ", desc: "Ẩn vào bóng tối: tốc độ +40%, chí mạng +25% trong 6 giây", icon: "☾", cost: 18, cd: 14,
      area: "self", r: 0, dmg: 0, self: { buff: { spd: 0.4, crit: 0.25 }, secs: 6 } },
    { name: "U Minh Bách Trảo", desc: "Lướt tới mục tiêu, cào 8 nhát, +30% chí mạng", icon: "✥", cost: 40, cd: 14,
      area: "target", r: 70, dash: 60, n: 8, every: 0.12, dmg: 0.8, crit: 0.3, inv: 0.5, glow: true },
  ],
  // Khống chế, trúng độc (lõi): độc cộng dồn, câm lặng diện rộng, Vạn Xà Phệ Tâm hút máu.
  bich_lan_xa_hoang: [
    { name: "Bích Lân Độc Tiễn", desc: "Phun 3 mũi độc hình quạt, mỗi mũi 1 tầng Trúng độc", icon: "➶", cost: 12, cd: 3,
      area: "proj", r: 120, n: 3, spread: 40, dmg: 1, status: [{ s: "poison" }] },
    { name: "Bích Lân Độc Vụ", desc: "Màn độc quanh thân: Trúng độc 2 tầng", icon: "☁", cost: 16, cd: 6,
      area: "around", r: 60, dmg: 0.6, status: [{ s: "poison", n: 2 }] },
    { name: "Xà Hoàng Uy Áp", desc: "Uy áp Xà Hoàng diện rộng: Câm lặng 3 giây, Dễ thương 4 giây", icon: "◉", cost: 22, cd: 10,
      area: "around", r: 80, dmg: 0.8, status: [{ s: "silence" }, { s: "vuln", secs: 4 }] },
    { name: "Vạn Xà Phệ Tâm", desc: "Vạn xà cắn xé mục tiêu: mỗi tầng Trúng độc thêm 60% công, hút 40% sát thương thành sinh lực", icon: "☠", cost: 40, cd: 14,
      area: "target", r: 80, dmg: 3, perStack: { s: "poison", dmg: 0.6 }, lifesteal: 0.4, glow: true },
  ],
  // Phụ trợ: tăng công, tốc, thủ cho hồn sư (cả đội, vì hiệu ứng thuộc hồn sư), giảm tiêu hao hồn lực.
  cuu_bao_luu_ly_thap: [
    { name: "Lực Chi Lưu Ly", desc: "Cửu Bảo Lưu Ly, nhất viết lực: công +20% trong 12 giây", icon: "✦", cost: 12, cd: 14,
      area: "self", r: 0, dmg: 0, self: { buff: { atk: 0.2 }, secs: 12 } },
    { name: "Tốc Chi Lưu Ly", desc: "Nhị viết tốc: tốc độ +25% trong 12 giây", icon: "➠", cost: 12, cd: 14,
      area: "self", r: 0, dmg: 0, self: { buff: { spd: 0.25 }, secs: 12 } },
    { name: "Hồn Chi Lưu Ly", desc: "Tam viết hồn: hồi 25% hồn lực, hồn kỹ tốn ít hơn 30% trong 12 giây", icon: "✧", cost: 0, cd: 20,
      area: "self", r: 0, dmg: 0, self: { buff: { mp: 0.3 }, secs: 12, mp: 0.25 } },
    { name: "Phòng Chi Lưu Ly", desc: "Tứ viết phòng: sát thương nhận giảm 25% trong 12 giây, khiên 12% sinh lực", icon: "◈", cost: 30, cd: 16,
      area: "self", r: 0, dmg: 0, self: { buff: { def: 0.25 }, secs: 12, shield: 0.12 } },
  ],
  // ---- Bước 2.5b: lưu phái Thiêu đốt (mọi số đã chốt) ----
  // Cường công, thiêu đốt (lõi): bay, thiêu đốt diện rộng, lãnh vực phượng hoàng (+30% sát thương nhận).
  ta_hoa_phuong_hoang: [
    { name: "Phượng Hoàng Hỏa Tuyến", desc: "Phun lửa phượng hoàng nửa trước mặt: Thiêu đốt 1 tầng", icon: "♨", cost: 12, cd: 3.5,
      area: "front", r: 44, dmg: 2, status: [{ s: "burn" }] },
    { name: "Dục Hỏa Phượng Hoàng", desc: "Lửa tà hỏa bùng quanh thân: Thiêu đốt 2 tầng", icon: "✺", cost: 16, cd: 6,
      area: "around", r: 64, dmg: 1.6, status: [{ s: "burn", n: 2 }] },
    { name: "Phượng Hoàng Phi Thiên", desc: "Bay vút qua đầu hồn thú phía trước, đốt mọi hồn thú trên đường, bất tử khi bay", icon: "➶", cost: 20, cd: 9,
      area: "dash", r: 90, dmg: 1.8, inv: 0.6, fly: 0.6, status: [{ s: "burn" }] },
    { name: "Phượng Hoàng Lãnh Vực", desc: "Mở lãnh vực phượng hoàng 8 giây: hồn thú trong lãnh vực nhận thêm 30% sát thương; Thiêu đốt 2 tầng", icon: "◎", cost: 40, cd: 16,
      area: "around", r: PHOENIX_FIELD_R, dmg: 3, glow: true, shake: true, status: [{ s: "burn", n: 2 }],
      self: { buff: { phoenix: 0.3 }, secs: 8 } },
  ],
  // Mẫn công, thiêu đốt: đánh tầm xa phạm vi rộng, khó trượt; Viêm bạo kích nổ Thiêu đốt rồi đặt lại 1 tầng.
  hoa_long: [
    { name: "Hỏa Long Tức", desc: "Phun 5 mũi lửa hình quạt, mỗi mũi Thiêu đốt 1 tầng", icon: "➹", cost: 12, cd: 3,
      area: "proj", r: 140, n: 5, spread: 50, dmg: 0.9, status: [{ s: "burn" }] },
    { name: "Long Viêm Đạn", desc: "Đạn lửa khóa mục tiêu gần nhất trong tầm xa, không trượt: Thiêu đốt 2 tầng", icon: "✦", cost: 14, cd: 4.5,
      area: "target", r: 150, dmg: 2, status: [{ s: "burn", n: 2 }] },
    { name: "Hỏa Long Phần Thiên", desc: "Rồng lửa xoay vòng, 12 mũi lửa tỏa mọi hướng, mỗi mũi Thiêu đốt 1 tầng", icon: "✶", cost: 24, cd: 9,
      area: "proj", r: 130, n: 12, spread: 360, dmg: 1.1, status: [{ s: "burn" }] },
    { name: "Viêm Bạo", desc: "Kích nổ mọi tầng Thiêu đốt trên hồn thú quanh thân (Viêm bạo), rồi đặt lại 1 tầng", icon: "✹", cost: 40, cd: 13,
      area: "around", r: 110, dmg: 1.8, glow: true, shake: true, boom: { keep: 1 } },
  ],
  // Khống chế, thiêu đốt: choáng, thiêu đốt, đẩy lùi; gây Dễ thương cho đồng đội đánh.
  hoa_anh: [
    { name: "Hỏa Ảnh Chưởng", desc: "Chưởng lửa nửa trước mặt, đẩy lùi: Thiêu đốt 1 tầng", icon: "✋", cost: 12, cd: 4,
      area: "front", r: 40, dmg: 1.5, push: 40, status: [{ s: "burn" }] },
    { name: "Hỏa Ảnh Phược", desc: "Bóng lửa khóa mục tiêu gần nhất: Choáng 1,5 giây, Thiêu đốt 1 tầng", icon: "⛓", cost: 16, cd: 7,
      area: "target", r: 90, dmg: 1.4, status: [{ s: "stun" }, { s: "burn" }] },
    { name: "Liệt Hỏa Ấn", desc: "Ấn lửa quanh thân: Dễ thương 6 giây, Thiêu đốt 1 tầng", icon: "✧", cost: 22, cd: 10,
      area: "around", r: 80, dmg: 1, status: [{ s: "vuln", secs: 6 }, { s: "burn" }] },
    { name: "Hỏa Ảnh Bạo Phá", desc: "Bóng lửa nổ tung quanh thân, đẩy lùi: Choáng 1,5 giây, Thiêu đốt 2 tầng", icon: "✸", cost: 40, cd: 14,
      area: "around", r: 80, dmg: 2.6, push: 50, glow: true, shake: true, status: [{ s: "stun" }, { s: "burn", n: 2 }] },
  ],
  // Cường công, thiêu đốt / phá giáp: cánh hoa sát thương liên tục, hạn chế di chuyển; hồi chiêu ngắn lấp khoảng cho võ hồn bùng nổ.
  ky_nhung_thong_thien_cuc: [
    { name: "Cúc Hoa Phi Vũ", desc: "Phóng 3 cánh hoa hình quạt, mỗi cánh Phá giáp 1 tầng", icon: "❀", cost: 10, cd: 2.5,
      area: "proj", r: 120, n: 3, spread: 30, dmg: 1, status: [{ s: "armor" }] },
    { name: "Cúc Hoa Toàn Vũ", desc: "Cánh hoa xoay quanh thân 2 giây, 5 nhát, mỗi nhát Thiêu đốt 1 tầng", icon: "✿", cost: 18, cd: 7,
      area: "around", r: 56, n: 5, every: 0.5, dmg: 0.7, status: [{ s: "burn" }] },
    { name: "Kỳ Nhung Triền", desc: "Dây cánh hoa quấn hồn thú quanh thân: Trói 1,5 giây, Phá giáp 1 tầng", icon: "❦", cost: 18, cd: 8,
      area: "around", r: 70, dmg: 1.2, status: [{ s: "root", secs: 1.5 }, { s: "armor" }] },
    { name: "Thông Thiên Cúc Vũ", desc: "Bão cánh hoa quanh thân 2,8 giây, 8 nhát, mỗi nhát Thiêu đốt và Phá giáp 1 tầng, nhát cuối Trói", icon: "✾", cost: 40, cd: 14,
      area: "around", r: 84, n: 8, every: 0.4, dmg: 0.7, glow: true, status: [{ s: "burn" }, { s: "armor" }], finisher: [{ s: "root", secs: 1.5 }] },
  ],
  // Mẫn công, thiêu đốt / phá giáp: lướt xuyên hàng trước, khóa và hạ mục tiêu yếu máu ở hàng sau.
  nguyet_nhan: [
    { name: "Nguyệt Ảnh Đột", desc: "Lướt xuyên hàng hồn thú phía trước: Phá giáp 1 tầng", icon: "➤", cost: 12, cd: 3.5,
      area: "dash", r: 80, dmg: 2, inv: 0.3, status: [{ s: "armor" }] },
    { name: "Huyết Nguyệt Trảm", desc: "Khóa hồn thú yếu máu nhất, lướt tới chém 2 nhát; mục tiêu càng ít máu càng đau (tới +100%)", icon: "☾", cost: 16, cd: 5,
      area: "target", r: 110, pick: "low", dash: 90, n: 2, every: 0.15, dmg: 1.2, lowHp: 1, status: [{ s: "burn" }] },
    { name: "Song Nguyệt Hồi Toàn", desc: "Hai lưỡi trăng quét nửa trước mặt: Phá giáp 2 tầng, Thiêu đốt 1 tầng", icon: "◐", cost: 20, cd: 8,
      area: "front", r: 50, dmg: 1.8, status: [{ s: "armor", n: 2 }, { s: "burn" }] },
    { name: "Tà Nguyệt Trảm", desc: "Khóa hồn thú yếu máu nhất trong tầm xa, lướt tới chém 4 nhát (tới +150% khi mục tiêu ít máu), +20% chí mạng", icon: "☽", cost: 40, cd: 14,
      area: "target", r: 140, pick: "low", dash: 130, n: 4, every: 0.12, dmg: 1.1, lowHp: 1.5, crit: 0.2, inv: 0.5, glow: true },
  ],
  // ---- Bước 2.5c: lưu phái Cảm điện (mọi số đã chốt). Combo mẫu: Kim Vũ Miêu Ưng / Càn Khôn Hỗn Nguyên Tỏa phủ Cảm điện,
  // đổi sang Lam Điện Bá Vương Long đánh vào hồn thú Cảm điện (thêm sát thương theo tầng, lan 40% sang hồn thú Cảm điện gần đó). ----
  // Cường công, cảm điện (lõi): sấm sét diện rộng gây Cảm điện; đánh trúng tích Phong Lôi Chi Lực (PHONG_LOI), đầy thì tự tung Lôi Động Minh Thiên.
  lam_dien_ba_vuong_long: [
    { name: "Lam Điện Kích", desc: "Long trảo mang sấm sét quét nửa trước mặt: Cảm điện", icon: "ϟ", cost: 12, cd: 3.5,
      area: "front", r: 44, dmg: 2, status: [{ s: "shock" }] },
    { name: "Lôi Đình Phích Lịch", desc: "Sét đánh quanh thân: Cảm điện", icon: "✺", cost: 16, cd: 6,
      area: "around", r: 72, dmg: 1.6, status: [{ s: "shock" }] },
    { name: "Lôi Long Liên Kích", desc: "3 tia sét liên hoàn vào mục tiêu gần nhất trong tầm xa; mỗi tia lan sang hồn thú Cảm điện gần đó", icon: "☇", cost: 22, cd: 8,
      area: "target", r: 130, n: 3, every: 0.25, dmg: 0.9, status: [{ s: "shock" }] },
    { name: "Lam Điện Long Hống", desc: "Long hống sấm sét quanh thân: hồn thú đang Cảm điện chịu thêm 120% công", icon: "◎", cost: 40, cd: 14,
      area: "around", r: 100, dmg: 2.6, perStack: { s: "shock", dmg: 1.2 }, glow: true, shake: true, status: [{ s: "shock" }] },
  ],
  // Mẫn công, cảm điện: bay, vuốt gây tê liệt (Choáng 2 giây + Câm lặng, đã chốt 2026-10-20; trước đó Trói 3 giây); áo nghĩa phủ Cảm điện toàn vùng.
  kim_vu_mieu_ung: [
    { name: "Kim Vũ Trảo", desc: "Lướt tới mục tiêu, vuốt sét 2 nhát: Cảm điện", icon: "≋", cost: 12, cd: 3.5,
      area: "target", r: 50, dash: 40, n: 2, every: 0.15, dmg: 1.1, status: [{ s: "shock" }] },
    { name: "Lôi Trảo Tê Liệt", desc: "Vuốt sét tê liệt mục tiêu: Choáng 2 giây (không đi, không đánh), Câm lặng 5 giây", icon: "✋", cost: 16, cd: 9,
      area: "target", r: 70, dash: 60, dmg: 1.6, status: [{ s: "stun", secs: 2 }, { s: "silence", secs: 5 }] },
    { name: "Kim Vũ Phi Thiên", desc: "Bay vút qua đầu hồn thú phía trước: Cảm điện mọi hồn thú trên đường, bất tử khi bay", icon: "➶", cost: 20, cd: 8,
      area: "dash", r: 90, dmg: 1.8, inv: 0.6, fly: 0.6, status: [{ s: "shock" }] },
    { name: "Kim Ưng Lôi Vực", desc: "Áo nghĩa: sấm sét phủ toàn vùng, Cảm điện 8 giây mọi hồn thú trong 160", icon: "☈", cost: 40, cd: 16,
      area: "around", r: 160, dmg: 1.2, glow: true, shake: true, status: [{ s: "shock", secs: 8 }] },
  ],
  // Khống chế, cảm điện: bay tới tạo vùng phong tỏa giam và gây sát thương liên tục; Phong ấn cộng dồn thành Dễ thương 6,8 giây.
  can_khon_hon_nguyen_toa: [
    { name: "Càn Khôn Tỏa Liên", desc: "Xích Càn Khôn khóa mục tiêu gần nhất: Phong ấn 1 tầng, Cảm điện", icon: "⛓", cost: 12, cd: 3.5,
      area: "target", r: 100, dmg: 1.5, status: [{ s: "lock" }, { s: "shock" }] },
    { name: "Hỗn Nguyên Phong Tỏa", desc: "Bay tới hồn thú gần nhất, đặt vùng phong tỏa 3 giây: 6 nhát, mỗi nhát giam (Trói ngắn) và Phong ấn 1 tầng", icon: "⌗", cost: 18, cd: 9,
      area: "around", at: 110, dash: 80, fly: 0.3, r: 56, n: 6, every: 0.5, dmg: 0.45, status: [{ s: "root", secs: 0.6 }, { s: "lock" }] },
    { name: "Càn Khôn Đảo Chuyển", desc: "Kéo mọi hồn thú quanh thân lại: Phong ấn 1 tầng, Cảm điện", icon: "⌘", cost: 22, cd: 10,
      area: "around", r: 80, dmg: 1.2, pull: true, status: [{ s: "lock" }, { s: "shock" }] },
    { name: "Hỗn Nguyên Thiên Tỏa", desc: "Bay tới đặt vùng phong tỏa lớn 3,2 giây: 8 nhát, mỗi nhát giam, Phong ấn 1 tầng, Cảm điện", icon: "▣", cost: 40, cd: 15,
      area: "around", at: 130, dash: 110, fly: 0.4, r: 84, n: 8, every: 0.4, dmg: 0.6, glow: true, shake: true,
      status: [{ s: "root", secs: 0.5 }, { s: "lock" }, { s: "shock" }] },
  ],
  // Khống chế, cảm điện: Mị hoặc cộng dồn thành Mê hoặc, ảo ảnh tàng hình, lãnh vực làm chậm, ngắt chiêu (Câm lặng).
  yeu_ho: [
    { name: "Yêu Hồ Mị Nhãn", desc: "Ánh mắt mị hoặc nửa trước mặt: Mị hoặc 1 tầng (đủ 3 tầng thì Mê hoặc)", icon: "◉", cost: 12, cd: 3,
      area: "front", r: 50, dmg: 1.4, status: [{ s: "allure" }] },
    { name: "Hồ Ảnh Ảo Thuật", desc: "Để lại ảo ảnh nổ quanh thân (Mị hoặc 1 tầng) rồi tàng hình 3 giây: hồn thú mất dấu", icon: "☁", cost: 16, cd: 10,
      area: "around", r: 60, dmg: 1, status: [{ s: "allure" }], self: { buff: { hide: 1 }, secs: 3 } },
    { name: "Yêu Hồ Lãnh Vực", desc: "Lãnh vực đặt xuống chỗ đứng 3 giây: 6 nhát, mỗi nhát Làm chậm; nhát cuối Mị hoặc 1 tầng", icon: "❂", cost: 22, cd: 12,
      area: "around", fixed: true, r: 90, n: 6, every: 0.5, dmg: 0.4, status: [{ s: "slow", secs: 1 }], finisher: [{ s: "allure" }] },
    { name: "Vạn Hồ Mị Ảnh", desc: "Vạn ảo ảnh hồ ly quanh thân: Mị hoặc 2 tầng, Câm lặng 2 giây (ngắt chiêu), Cảm điện", icon: "✾", cost: 40, cd: 14,
      area: "around", r: 100, dmg: 2.2, glow: true, status: [{ s: "allure", n: 2 }, { s: "silence", secs: 2 }, { s: "shock" }] },
  ],
  // Phụ trợ, cảm điện: hồi sinh lực, hồi hồn lực, xúc xích bay; áo nghĩa Phục Chế Hương Tràng sao chép hồn kỹ của võ hồn khác trong đội.
  xuc_xich: [
    { name: "Khôi Phục Đại Hương Tràng", desc: "Xúc xích hồi phục: hồi 20% sinh lực cả đội", icon: "✚", cost: 12, cd: 10,
      area: "self", r: 0, dmg: 0, self: { heal: 0.2 } },
    { name: "Hồn Lực Hương Tràng", desc: "Xúc xích hồn lực: hồi 30% hồn lực tối đa", icon: "✧", cost: 0, cd: 16,
      area: "self", r: 0, dmg: 0, self: { mp: 0.3 } },
    { name: "Phi Hành Hương Tràng", desc: "Xúc xích bay: tốc độ +35% trong 8 giây, bay lên né đòn", icon: "➠", cost: 14, cd: 14,
      area: "self", r: 0, dmg: 0, fly: 0.6, inv: 0.6, self: { buff: { spd: 0.35 }, secs: 8 } },
    { name: "Phục Chế Hương Tràng", desc: "Áo nghĩa: sao chép hồn kỹ vừa tung (8 giây) của võ hồn khác trong đội (chưa gục) hoặc đồng đội tổ đội đứng gần, sát thương và hiệu ứng × 0,8", icon: "⧉", cost: 30, cd: 14,
      area: "self", r: 0, dmg: 0, copy: 0.8 },
  ],
  // ---- Bước 2.5d: 5 võ hồn còn lại (mọi số đã chốt). Từ đây cả 20 võ hồn trong VOHON đều có hồn kỹ riêng. ----
  // Cường công, phá giáp: Vô Ngã Kiếm Trận sát thương diện rộng liên tục, Liệt thương (Phá giáp); vòng 4 Thất Sát Trảm là bản nhỏ của
  // tuyệt kỹ Kiếm Trảm Sơn Hà (vòng 10, 8.1d; trước 8.1d vòng 4 mang tên này).
  cuu_tinh_that_sat_kiem: [
    { name: "Thất Sát Kiếm Khí", desc: "Kiếm khí quét nửa trước mặt: Liệt thương (Phá giáp 1 tầng)", icon: "⚔", cost: 12, cd: 3.5,
      area: "front", r: 48, dmg: 2.2, status: [{ s: "armor" }] },
    { name: "Cửu Tinh Kiếm Vũ", desc: "Phóng 9 thanh kiếm hình quạt, mỗi kiếm Phá giáp 1 tầng", icon: "✶", cost: 16, cd: 5.5,
      area: "proj", r: 130, n: 9, spread: 80, dmg: 0.7, status: [{ s: "armor" }] },
    { name: "Vô Ngã Kiếm Trận", desc: "Kiếm trận xoay quanh thân 3 giây, 6 nhát, mỗi nhát Phá giáp 1 tầng", icon: "✵", cost: 24, cd: 10,
      area: "around", r: 72, n: 6, every: 0.5, dmg: 0.6, status: [{ s: "armor" }] },
    { name: "Thất Sát Trảm", desc: "Một kiếm Thất Sát chém nửa trước mặt: mỗi tầng Phá giáp trên mục tiêu thêm 40% công", icon: "⚡", cost: 40, cd: 14,
      area: "front", r: 64, dmg: 3.6, perStack: { s: "armor", dmg: 0.4 }, glow: true, shake: true, status: [{ s: "armor", n: 2 }] },
  ],
  // Mẫn công, chấn đãng: lướt, quật ngã, tăng chí mạng, hút máu; ràng buộc chí mạng với Hạo Thiên Chùy (BONDS).
  nhu_cot_tho: [
    { name: "Yêu Cung", desc: "Lướt tới quật mục tiêu bằng Yêu Cung: quật ngã (Choáng 0,6 giây), +20% chí mạng, hút 20% sát thương", icon: "➰", cost: 12, cd: 3.5,
      area: "target", r: 50, dash: 40, dmg: 2, crit: 0.2, lifesteal: 0.2, status: [{ s: "stun", secs: 0.6 }] },
    { name: "Thuấn Di", desc: "Thuấn di xuyên hàng hồn thú phía trước, +20% chí mạng, bất tử 0,4 giây", icon: "➤", cost: 14, cd: 5,
      area: "dash", r: 80, dmg: 1.8, crit: 0.2, inv: 0.4 },
    { name: "Vô Địch Kim Thân", desc: "Kim thân bất tử 1,2 giây, chí mạng +30% trong 6 giây", icon: "✪", cost: 20, cd: 16,
      area: "self", r: 0, dmg: 0, inv: 1.2, self: { buff: { crit: 0.3 }, secs: 6 } },
    { name: "Bát Đoạn Suất", desc: "Lướt tới quăng quật mục tiêu 8 đoạn, +25% chí mạng, hút 25% sát thương; đoạn cuối quật ngã (Choáng 1,2 giây)", icon: "✥", cost: 40, cd: 14,
      area: "target", r: 60, dash: 50, n: 8, every: 0.14, dmg: 0.75, crit: 0.25, lifesteal: 0.25, inv: 0.5, glow: true, finisher: [{ s: "stun", secs: 1.2 }] },
  ],
  // Khống chế, trúng độc / cảm điện: giăng tơ gom quái, độc nhện khống chế.
  tu_vong_chu_hoang: [
    { name: "Chu Hoàng Độc Nha", desc: "Nanh độc cắn mục tiêu gần nhất: Trúng độc 2 tầng", icon: "☠", cost: 12, cd: 3.5,
      area: "target", r: 90, dmg: 1.5, status: [{ s: "poison", n: 2 }] },
    { name: "Chu Ti Triền Phược", desc: "Giăng tơ kéo mọi hồn thú quanh thân lại (gom quái): Trói 2 giây, Trúng độc 1 tầng", icon: "⌘", cost: 18, cd: 9,
      area: "around", r: 90, dmg: 1, pull: true, status: [{ s: "root" }, { s: "poison" }] },
    { name: "Tử Vong Độc Võng", desc: "Lưới độc đặt xuống chỗ đứng 3 giây: 6 nhát, mỗi nhát Làm chậm, Trúng độc 1 tầng; nhát cuối Trói", icon: "▦", cost: 22, cd: 11,
      area: "around", fixed: true, r: 80, n: 6, every: 0.5, dmg: 0.35, status: [{ s: "slow", secs: 1 }, { s: "poison" }], finisher: [{ s: "root", secs: 1 }] },
    { name: "Tử Vong Thiên La", desc: "Thiên la tơ nhện kéo mọi hồn thú quanh thân lại: mỗi tầng Trúng độc thêm 40% công, Trói 2,5 giây, Trúng độc 2 tầng, Cảm điện", icon: "✳", cost: 40, cd: 15,
      area: "around", r: 110, dmg: 2.2, pull: true, perStack: { s: "poison", dmg: 0.4 }, glow: true, shake: true,
      status: [{ s: "root", secs: 2.5 }, { s: "poison", n: 2 }, { s: "shock" }] },
  ],
  // Phụ trợ, đội bùng nổ: biến sát thương gây ra thành hồi máu (hiệu ứng có lợi `leech`), tăng sát thương đội;
  // vòng 4 Quỷ Ảnh Tiềm Hành tàng hình cả đội (hiệu ứng thuộc hồn sư nên đổi võ hồn vẫn còn), bản nhỏ của tuyệt kỹ Quỷ Ảnh Trùng Trùng (vòng 10, 8.1d).
  quy_mi: [
    { name: "Quỷ Ảnh Trảo", desc: "Quỷ ảnh lướt tới vồ mục tiêu: hút 30% sát thương thành sinh lực", icon: "≋", cost: 12, cd: 4,
      area: "target", r: 60, dash: 40, dmg: 1.6, lifesteal: 0.3 },
    { name: "Quỷ Huyết Ấn", desc: "20% mọi sát thương gây ra hồi thành sinh lực trong 10 giây (cả đội: đổi võ hồn vẫn còn)", icon: "♥", cost: 16, cd: 16,
      area: "self", r: 0, dmg: 0, self: { buff: { leech: 0.2 }, secs: 10 } },
    { name: "Quỷ Lực Gia Trì", desc: "Công +25%, chí mạng +10% trong 10 giây (cả đội)", icon: "✦", cost: 20, cd: 16,
      area: "self", r: 0, dmg: 0, self: { buff: { atk: 0.25, crit: 0.1 }, secs: 10 } },
    { name: "Quỷ Ảnh Tiềm Hành", desc: "Cả đội tàng hình 5 giây (hồn thú mất dấu), công +30%; ra đòn thì hiện hình", icon: "☾", cost: 40, cd: 20,
      area: "self", r: 0, dmg: 0, self: { buff: { hide: 1, atk: 0.3 }, secs: 5 } },
  ],
  // Phụ trợ, đánh boss: hồi máu, khiên, Dễ thương cho đồng đội đánh; vòng 4 Ngọc Đỉnh Hộ Thế là bản nhỏ của Tịnh Thế Lưu Ly (vòng 10, 8.1d;
  // tên trước 2026-10-20 là Lưu Ly Hộ Thế, đổi để không gần trùng tiên cơ Lưu Ly Hộ Thể của Cửu Bảo Lưu Ly Tháp).
  // "Xóa buff địch" ở Thiên Càn Trấn Áp (BĐ4), "thanh tẩy đội" ở tiên cơ (3.5).
  thien_can_bach_ngoc_dinh: [
    { name: "Bạch Ngọc Hồi Xuân", desc: "Hồi 18% sinh lực cả đội", icon: "✚", cost: 12, cd: 9,
      area: "self", r: 0, dmg: 0, self: { heal: 0.18 } },
    { name: "Bạch Ngọc Hộ Thuẫn", desc: "Khiên 15% sinh lực tối đa, sát thương nhận giảm 15% trong 6 giây", icon: "◈", cost: 16, cd: 14,
      area: "self", r: 0, dmg: 0, self: { buff: { def: 0.15 }, secs: 6, shield: 0.15 } },
    { name: "Thiên Càn Trấn Áp", desc: "Đỉnh ngọc trấn áp quanh thân: Dễ thương 6 giây, Câm lặng 2 giây, xóa hiệu ứng có lợi của hồn thú", icon: "▼", cost: 20, cd: 10,
      area: "around", r: 80, dmg: 1.2, status: [{ s: "vuln", secs: 6 }, { s: "silence", secs: 2 }], dispel: true },
    { name: "Ngọc Đỉnh Hộ Thế", desc: "Hồi 30% sinh lực cả đội, khiên 20% sinh lực tối đa 6 giây", icon: "✷", cost: 40, cd: 18,
      area: "self", r: 0, dmg: 0, glow: true, self: { secs: 6, heal: 0.3, shield: 0.2 } },
  ],
  // ---- Bước 8.3: 4 võ hồn ngoài danh sách SSR cơ bản (mọi số và tên hồn kỹ đã chốt). ----
  // Cường công, phá giáp: trường thương lướt đâm xuyên hàng, Phá giáp; "phá hồn" gây Câm lặng (ngắt chiêu báo trước của hồn thú).
  pha_hon_thuong: [
    { name: "Phá Hồn Thứ", desc: "Đâm thương nửa trước mặt: Phá giáp 1 tầng", icon: "➹", cost: 12, cd: 3.5,
      area: "front", r: 56, dmg: 2.2, status: [{ s: "armor" }] },
    { name: "Thương Ảnh Đột Kích", desc: "Lướt đâm xuyên hàng hồn thú phía trước: Phá giáp 1 tầng, bất tử 0,3 giây", icon: "➤", cost: 16, cd: 5,
      area: "dash", r: 80, dmg: 2, inv: 0.3, status: [{ s: "armor" }] },
    { name: "Phá Hồn Tỏa Phách", desc: "Lướt tới đâm mục tiêu 3 nhát, mỗi nhát Phá giáp 1 tầng; nhát cuối phá hồn (Câm lặng 2 giây)", icon: "⚔", cost: 22, cd: 9,
      area: "target", r: 90, dash: 60, n: 3, every: 0.18, dmg: 0.9, status: [{ s: "armor" }], finisher: [{ s: "silence", secs: 2 }] },
    { name: "Phá Hồn Nhất Thương", desc: "Một thương phá hồn quét nửa trước mặt: mỗi tầng Phá giáp trên mục tiêu thêm 40% công, Phá giáp 2 tầng, Câm lặng 1,5 giây", icon: "⚡", cost: 40, cd: 14,
      area: "front", r: 70, dmg: 3.6, perStack: { s: "armor", dmg: 0.4 }, glow: true, shake: true, status: [{ s: "armor", n: 2 }, { s: "silence", secs: 1.5 }] },
  ],
  // Phụ trợ, chấn đãng: Lam Ngân Hoàng mười vạn năm (mẫu thân Đường Tam): dây Lam Ngân trói, Dễ thương; hồi máu, khiên, tăng công cho đội
  // (hiệu ứng thuộc hồn sư nên đổi võ hồn vẫn còn).
  a_ngan: [
    { name: "Lam Ngân Triền Phược", desc: "Dây Lam Ngân quấn mục tiêu gần nhất: Trói 2 giây", icon: "❦", cost: 12, cd: 4,
      area: "target", r: 90, dmg: 1.4, status: [{ s: "root" }] },
    { name: "Lam Ngân Hồi Xuân", desc: "Hồi 18% sinh lực cả đội", icon: "✚", cost: 14, cd: 9,
      area: "self", r: 0, dmg: 0, self: { heal: 0.18 } },
    { name: "Hoàng Giả Hộ Thể", desc: "Lam Ngân Hoàng che chở: công +20%, khiên 12% sinh lực tối đa trong 8 giây (cả đội)", icon: "◈", cost: 20, cd: 14,
      area: "self", r: 0, dmg: 0, self: { buff: { atk: 0.2 }, secs: 8, shield: 0.12 } },
    { name: "Lam Ngân Tế Thế", desc: "Lam Ngân kéo mọi hồn thú quanh thân lại: Trói 2 giây, Dễ thương 5 giây; hồi 20% sinh lực cả đội", icon: "✿", cost: 40, cd: 16,
      area: "around", r: 90, dmg: 1.6, pull: true, glow: true, status: [{ s: "root" }, { s: "vuln" }], self: { heal: 0.2 } },
  ],
  // Mẫn công, thiêu đốt: sói lửa lao vồ, cắn xé liên hoàn chồng Thiêu đốt, tiếng tru tăng tốc.
  liet_hoa_thuong_lang: [
    { name: "Liệt Hỏa Phệ Giảo", desc: "Lao tới cắn mục tiêu 2 nhát, mỗi nhát Thiêu đốt 1 tầng", icon: "≋", cost: 12, cd: 3,
      area: "target", r: 50, dash: 40, n: 2, every: 0.15, dmg: 1, status: [{ s: "burn" }] },
    { name: "Thương Lang Đột Tập", desc: "Lao xuyên hàng hồn thú phía trước: Thiêu đốt 1 tầng, bất tử 0,3 giây", icon: "➤", cost: 14, cd: 4.5,
      area: "dash", r: 80, dmg: 1.8, inv: 0.3, status: [{ s: "burn" }] },
    { name: "Thương Lang Hống", desc: "Tru vang quanh thân (Làm chậm 2 giây); tốc độ +30%, công +15% trong 8 giây", icon: "◉", cost: 20, cd: 14,
      area: "around", r: 80, dmg: 1, status: [{ s: "slow" }], self: { buff: { spd: 0.3, atk: 0.15 }, secs: 8 } },
    { name: "Liệt Hỏa Cuồng Trảo", desc: "Lướt tới cào xé mục tiêu 6 nhát, +20% chí mạng, mỗi nhát Thiêu đốt 1 tầng", icon: "✥", cost: 40, cd: 14,
      area: "target", r: 70, dash: 60, n: 6, every: 0.12, dmg: 0.8, crit: 0.2, inv: 0.4, glow: true, status: [{ s: "burn" }] },
  ],
  // Khống chế, băng phong: bay, đóng băng (tạm dùng Choáng sẵn có, như hồn thú băng ở BĐ6c), Làm chậm, Dễ thương.
  bang_phuong_hoang: [
    { name: "Băng Phượng Vũ", desc: "Phóng 3 lông vũ băng hình quạt, mỗi lông Làm chậm 2 giây", icon: "➶", cost: 12, cd: 3,
      area: "proj", r: 120, n: 3, spread: 40, dmg: 1, status: [{ s: "slow" }] },
    { name: "Hàn Băng Tức", desc: "Hơi thở băng nửa trước mặt: Làm chậm 2 giây, Dễ thương 4 giây", icon: "❄", cost: 16, cd: 6,
      area: "front", r: 60, dmg: 1.6, status: [{ s: "slow" }, { s: "vuln", secs: 4 }] },
    { name: "Băng Phong Lĩnh Vực", desc: "Băng vực đặt xuống chỗ đứng 3 giây: 6 nhát, mỗi nhát Làm chậm; nhát cuối đóng băng (Choáng 1,2 giây)", icon: "❂", cost: 22, cd: 11,
      area: "around", fixed: true, r: 90, n: 6, every: 0.5, dmg: 0.4, status: [{ s: "slow", secs: 1 }], finisher: [{ s: "stun", secs: 1.2 }] },
    { name: "Băng Phượng Phong Ấn", desc: "Bay lên rồi giáng băng quanh thân: đóng băng (Choáng 2 giây), Dễ thương 5 giây", icon: "✾", cost: 40, cd: 14,
      area: "around", r: 100, dmg: 2.4, fly: 0.5, glow: true, shake: true, status: [{ s: "stun", secs: 2 }, { s: "vuln" }] },
  ],
};
/** Hồn kỹ của một võ hồn: bảng riêng nếu có, không thì 4 hồn kỹ dùng chung. */
export const skillsOf = (vohonId: string) => VOHON_SKILLS[vohonId] ?? SKILLS;

// ---------- Hồn kỹ vòng 5–10 và Võ Hồn Chân Thân (mục 5.2 "Hồn kỹ theo vòng", bước 8.1a; mọi số đã chốt) ----------
/**
 * Vòng (1..10) của các hồn kỹ trong VOHON_SKILLS_HIGH, theo đúng thứ tự: vòng 5–6 hồn kỹ thường, vòng 8–9 hồn kỹ mạnh, vòng 10 tuyệt
 * kỹ cuối. Vòng 7 (CHAN_THAN_RING) là Võ Hồn Chân Thân, không phải hồn kỹ mang theo (phím riêng, bảng CHAN_THAN).
 */
export const HIGH_RINGS = [5, 6, 8, 9, 10] as const;
export const CHAN_THAN_RING = 7;
/** Số ô hồn kỹ mang theo (phím U / I / O / P); mặc định vòng 1–4 theo thứ tự (như trước 8.1a). Ô = -1 là để trống. */
export const LOADOUT_SIZE = 4;
export const DEFAULT_LOADOUT: readonly number[] = [0, 1, 2, 3];
/**
 * Hồn kỹ vòng 5, 6, 8, 9, 10 (theo HIGH_RINGS) của võ hồn đã có dữ liệu (8.1a: 5 võ hồn mẫu; 8.1b–8.1d các lưu phái còn lại). Mạnh theo số năm
 * hồn hoàn của đúng vòng đó (skillPower / buffPower như vòng 1–4). Võ hồn chưa có trong bảng: vòng 5+ chỉ tăng chỉ số (calcStats).
 * Bảng chi tiết ở GAME_DESIGN.md 5.2.
 */
export const VOHON_SKILLS_HIGH: Record<string, SkillDef[]> = {
  // Khống chế, chấn đãng: trói, gom quái, Dễ thương; tuyệt kỹ kéo cả vùng lại và giam (5.1).
  lam_ngan_thao: [
    { name: "Lam Ngân Bá Vương Thương", desc: "Lam Ngân ngưng thành trường thương, lướt xuyên hàng hồn thú: Trói 1,5 giây", icon: "➶", cost: 45, cd: 10,
      area: "dash", r: 100, dmg: 2.6, inv: 0.4, status: [{ s: "root", secs: 1.5 }] },
    { name: "Lam Ngân Hoàng Lãnh Vực", desc: "Lãnh vực Lam Ngân Hoàng đặt ở chỗ đứng 3 giây: 6 nhát, Làm chậm, Dễ thương; nhát cuối Trói 2 giây", icon: "❀", cost: 50, cd: 14,
      area: "around", r: 100, fixed: true, n: 6, every: 0.5, dmg: 0.6, status: [{ s: "slow", secs: 1 }, { s: "vuln", secs: 4 }], finisher: [{ s: "root", secs: 2 }] },
    { name: "Lam Ngân Thiên Lao", desc: "Lam Ngân dựng lồng trời: kéo mọi hồn thú quanh thân lại, Trói 3 giây, Dễ thương 6 giây", icon: "⌘", cost: 60, cd: 18,
      area: "around", r: 120, dmg: 3.8, pull: true, glow: true, status: [{ s: "root", secs: 3 }, { s: "vuln", secs: 6 }] },
    { name: "Lam Ngân Triền Thần", desc: "12 sợi Lam Ngân bắn ra bốn phía, mỗi sợi Trói 1,5 giây và Trúng độc 1 tầng", icon: "✺", cost: 70, cd: 20,
      area: "proj", r: 150, n: 12, spread: 360, dmg: 1.6, status: [{ s: "root", secs: 1.5 }, { s: "poison" }] },
    { name: "Lam Ngân Thiên Hạ", desc: "Tuyệt kỹ: Lam Ngân phủ kín cả vùng, kéo mọi hồn thú lại và giam: Trói 4 giây, Dễ thương 8 giây, Trúng độc 3 tầng", icon: "❦", cost: 100, cd: 45,
      area: "around", r: 160, dmg: 6, pull: true, glow: true, shake: true, ult: true, status: [{ s: "root", secs: 4 }, { s: "vuln", secs: 8 }, { s: "poison", n: 3 }] },
  ],
  // Cường công, chấn đãng: % sinh lực, phá giáp, hất tung; tuyệt kỹ là Loạn Phi Phong Chùy Pháp đủ thức (vòng 3 là bản 4 nhát).
  hao_thien_chuy: [
    { name: "Đại Tu Di Chùy", desc: "Dồn lực Đại Tu Di nện quanh thân, thêm 5% sinh lực tối đa, Phá giáp 2 tầng", icon: "✺", cost: 45, cd: 10,
      area: "around", r: 80, dmg: 3, pctHp: 0.05, shake: true, status: [{ s: "armor", n: 2 }] },
    { name: "Hạo Thiên Chấn", desc: "Chùy chấn nửa trước mặt, thêm 6% sinh lực tối đa, hất tung (Choáng 1,2 giây)", icon: "⚒", cost: 50, cd: 12,
      area: "front", r: 70, dmg: 3.8, pctHp: 0.06, status: [{ s: "stun", secs: 1.2 }] },
    { name: "Hạo Thiên Cửu Tuyệt", desc: "3 đợt chùy chấn quanh thân, mỗi đợt thêm 4% sinh lực tối đa và Phá giáp 1 tầng; đợt cuối Choáng 1,5 giây", icon: "☄", cost: 60, cd: 18,
      area: "around", r: 100, n: 3, every: 0.4, dmg: 2, pctHp: 0.04, glow: true, status: [{ s: "armor" }], finisher: [{ s: "stun", secs: 1.5 }] },
    { name: "Phá Thiên Chùy", desc: "Lao tới một mục tiêu, một chùy phá trời: thêm 10% sinh lực tối đa, Phá giáp 3 tầng", icon: "▲", cost: 70, cd: 22,
      area: "target", r: 80, dash: 60, dmg: 6.5, pctHp: 0.1, glow: true, shake: true, status: [{ s: "armor", n: 3 }] },
    { name: "Loạn Phi Phong Chùy Pháp · Đại Thành", desc: "Tuyệt kỹ: 12 nhát chùy liên hoàn vào một mục tiêu, mỗi nhát thêm 3% sinh lực tối đa, nhát cuối hất tung (Choáng 2 giây)", icon: "☄", cost: 100, cd: 45,
      area: "target", r: 90, dash: 70, n: 12, every: 0.15, dmg: 0.75, pctHp: 0.03, inv: 0.5, glow: true, shake: true, ult: true, finisher: [{ s: "stun", secs: 2 }] },
  ],
  // Mẫn công, chấn đãng: tốc độ, chí mạng cao, cào liên hoàn; tuyệt kỹ U Minh Bách Trảo đủ thức (vòng 4 là bản 8 nhát).
  u_minh_linh_mieu: [
    { name: "U Minh Trảm", desc: "Lướt xuyên hàng hồn thú, +30% chí mạng, Phá giáp 1 tầng", icon: "➹", cost: 45, cd: 9,
      area: "dash", r: 100, dmg: 3, crit: 0.3, inv: 0.4, status: [{ s: "armor" }] },
    { name: "U Minh Ảnh Sát", desc: "Khóa hồn thú yếu máu nhất, lướt tới cào 3 nhát (tới +100% khi mục tiêu ít máu), +30% chí mạng", icon: "☾", cost: 50, cd: 12,
      area: "target", r: 130, pick: "low", dash: 110, n: 3, every: 0.12, dmg: 1.5, lowHp: 1, crit: 0.3, inv: 0.35 },
    { name: "U Minh Phân Thân", desc: "Phân thân bóng tối cào quanh thân 6 nhát, +30% chí mạng, mỗi nhát Phá giáp 1 tầng", icon: "≋", cost: 60, cd: 16,
      area: "around", r: 90, n: 6, every: 0.2, dmg: 0.9, crit: 0.3, status: [{ s: "armor" }] },
    { name: "U Minh Đoạt Phách", desc: "Lướt tới mục tiêu, cào 5 nhát, +40% chí mạng", icon: "✥", cost: 70, cd: 20,
      area: "target", r: 100, dash: 90, n: 5, every: 0.1, dmg: 1.4, crit: 0.4, inv: 0.5 },
    { name: "U Minh Bách Trảo · Vô Ảnh", desc: "Tuyệt kỹ: lướt tới mục tiêu, cào 16 nhát không thấy bóng, +40% chí mạng, mỗi nhát Phá giáp 1 tầng", icon: "✥", cost: 100, cd: 45,
      area: "target", r: 120, dash: 110, n: 16, every: 0.08, dmg: 0.75, crit: 0.4, inv: 1.3, glow: true, ult: true, status: [{ s: "armor" }] },
  ],
  // Khống chế, trúng độc (lõi): độc cộng dồn, câm lặng diện rộng, hút máu; tuyệt kỹ độc vực.
  bich_lan_xa_hoang: [
    { name: "Bích Lân Tử Độc", desc: "Phun 5 mũi tử độc hình quạt, mỗi mũi Trúng độc 2 tầng", icon: "➶", cost: 45, cd: 9,
      area: "proj", r: 150, n: 5, spread: 60, dmg: 1.2, status: [{ s: "poison", n: 2 }] },
    { name: "Xà Hoàng Độc Trận", desc: "Độc trận đặt ở chỗ đứng 3 giây: 6 nhát, Trúng độc, Làm chậm; nhát cuối Câm lặng 2 giây", icon: "☁", cost: 50, cd: 14,
      area: "around", r: 100, fixed: true, n: 6, every: 0.5, dmg: 0.4, status: [{ s: "poison" }, { s: "slow", secs: 1 }], finisher: [{ s: "silence", secs: 2 }] },
    { name: "Vạn Xà Triều", desc: "Triều rắn tràn quanh thân: mỗi tầng Trúng độc thêm 50% công, Trúng độc 2 tầng, Dễ thương 6 giây", icon: "◉", cost: 60, cd: 18,
      area: "around", r: 120, dmg: 2.5, perStack: { s: "poison", dmg: 0.5 }, glow: true, status: [{ s: "poison", n: 2 }, { s: "vuln", secs: 6 }] },
    { name: "Xà Hoàng Thôn Phệ", desc: "Xà Hoàng nuốt mục tiêu: mỗi tầng Trúng độc thêm 80% công, hút 50% sát thương thành sinh lực", icon: "☠", cost: 70, cd: 20,
      area: "target", r: 100, dmg: 5, perStack: { s: "poison", dmg: 0.8 }, lifesteal: 0.5, glow: true },
    { name: "Vạn Độc Bích Lân Vực", desc: "Tuyệt kỹ: độc vực Bích Lân phủ cả vùng: mỗi tầng Trúng độc thêm 100% công, hút 30%, Trúng độc đủ 5 tầng, Câm lặng 3 giây", icon: "☠", cost: 100, cd: 45,
      area: "around", r: 160, dmg: 5, perStack: { s: "poison", dmg: 1 }, lifesteal: 0.3, glow: true, shake: true, ult: true,
      status: [{ s: "poison", n: 5 }, { s: "silence", secs: 3 }] },
  ],
  // Phụ trợ: hiệu ứng thuộc hồn sư nên cả đội hưởng; tuyệt kỹ thật là Vô Địch Thần Quang (tiên cơ riêng Lưu Ly Hộ Thể là bản nhỏ 2,5 giây).
  cuu_bao_luu_ly_thap: [
    { name: "Phá Chi Lưu Ly", desc: "Ngũ viết phá: hào quang lưu ly quanh thân làm hồn thú yếu đi: Phá giáp 3 tầng, Dễ thương 6 giây", icon: "◇", cost: 40, cd: 12,
      area: "around", r: 100, dmg: 1.5, status: [{ s: "armor", n: 3 }, { s: "vuln", secs: 6 }] },
    { name: "Thần Chi Lưu Ly", desc: "Lục viết thần: chí mạng +20%, công +15% trong 12 giây, hồi 20% hồn lực", icon: "✧", cost: 0, cd: 20,
      area: "self", r: 0, dmg: 0, self: { buff: { crit: 0.2, atk: 0.15 }, secs: 12, mp: 0.2 } },
    { name: "Lưu Ly Thánh Quang", desc: "Thánh quang lưu ly: hồi 30% sinh lực cả đội, khiên 20% sinh lực tối đa 8 giây, thanh tẩy", icon: "✚", cost: 60, cd: 22,
      area: "self", r: 0, dmg: 0, self: { heal: 0.3, shield: 0.2, secs: 8, cleanse: true } },
    { name: "Cửu Bảo Tề Minh", desc: "Chín báu cùng vang: công +35%, tốc độ +25%, sát thương nhận giảm 20% trong 15 giây", icon: "✦", cost: 60, cd: 24,
      area: "self", r: 0, dmg: 0, self: { buff: { atk: 0.35, spd: 0.25, def: 0.2 }, secs: 15 } },
    { name: "Vô Địch Thần Quang", desc: "Tuyệt kỹ: cả đội miễn mọi sát thương 6 giây, công +30%, hồi 40% sinh lực, thanh tẩy", icon: "✷", cost: 100, cd: 50,
      area: "self", r: 0, dmg: 0, glow: true, ult: true, self: { buff: { inv: 1, atk: 0.3 }, secs: 6, heal: 0.4, cleanse: true } },
  ],
  // ---- Bước 8.1b: lưu phái Thiêu đốt (mọi số đã chốt) ----
  // Cường công, thiêu đốt (lõi): bay, thiêu đốt diện rộng, lãnh vực phượng hoàng; tuyệt kỹ Niết Bàn đốt đủ tầng cả vùng.
  ta_hoa_phuong_hoang: [
    { name: "Phượng Hoàng Lưu Tinh", desc: "Phun 7 mũi lửa phượng hoàng hình quạt, mỗi mũi Thiêu đốt 1 tầng", icon: "➶", cost: 45, cd: 9,
      area: "proj", r: 160, n: 7, spread: 70, dmg: 1.2, status: [{ s: "burn" }] },
    { name: "Phượng Dực Thiên Tường", desc: "Dang cánh lửa bay vút qua đầu hồn thú, đốt mọi hồn thú trên đường: Thiêu đốt 2 tầng, bất tử khi bay", icon: "♨", cost: 50, cd: 12,
      area: "dash", r: 120, dmg: 3, inv: 0.7, fly: 0.7, status: [{ s: "burn", n: 2 }] },
    { name: "Tà Hỏa Phần Thiên", desc: "Biển tà hỏa đặt ở chỗ đứng 3 giây: 6 nhát, mỗi nhát Thiêu đốt 1 tầng", icon: "✺", cost: 60, cd: 18,
      area: "around", r: 110, fixed: true, n: 6, every: 0.5, dmg: 0.8, glow: true, status: [{ s: "burn" }] },
    { name: "Phượng Hoàng Liệt Không", desc: "Phượng hoàng lửa nổ quanh thân: Thiêu đốt 3 tầng; mở lãnh vực phượng hoàng 8 giây", icon: "◎", cost: 70, cd: 22,
      area: "around", r: 120, dmg: 4.5, glow: true, shake: true, status: [{ s: "burn", n: 3 }], self: { buff: { phoenix: 0.3 }, secs: 8 } },
    { name: "Phượng Hoàng Niết Bàn", desc: "Tuyệt kỹ: phượng hoàng niết bàn bay lên rồi lao xuống cả vùng: Thiêu đốt đủ 5 tầng; lãnh vực phượng hoàng 10 giây", icon: "♨", cost: 100, cd: 45,
      area: "around", r: 160, dmg: 6, fly: 0.8, inv: 0.8, glow: true, shake: true, ult: true, status: [{ s: "burn", n: 5 }],
      self: { buff: { phoenix: 0.4 }, secs: 10 } },
  ],
  // Mẫn công, thiêu đốt: tầm xa phạm vi rộng, khó trượt, Viêm bạo; tuyệt kỹ chồng Thiêu đốt cả vùng rồi kích nổ (Viêm bạo toàn vùng).
  hoa_long: [
    { name: "Hỏa Long Liệt Diễm", desc: "Phun 7 mũi lửa rồng hình quạt tầm xa, mỗi mũi Thiêu đốt 1 tầng", icon: "➹", cost: 45, cd: 9,
      area: "proj", r: 170, n: 7, spread: 70, dmg: 1.3, status: [{ s: "burn" }] },
    { name: "Long Viêm Liên Đạn", desc: "3 đạn lửa liên tiếp khóa mục tiêu gần nhất trong tầm xa, không trượt, mỗi đạn Thiêu đốt 1 tầng", icon: "✦", cost: 50, cd: 12,
      area: "target", r: 180, n: 3, every: 0.25, dmg: 1.4, status: [{ s: "burn" }] },
    { name: "Hỏa Long Phệ Thiên", desc: "Rồng lửa cuộn quanh thân, 16 mũi lửa tỏa mọi hướng, mỗi mũi Thiêu đốt 1 tầng", icon: "✶", cost: 60, cd: 16,
      area: "proj", r: 170, n: 16, spread: 360, dmg: 1.5, glow: true, status: [{ s: "burn" }] },
    { name: "Long Viêm Bạo Liệt", desc: "Viêm bạo lớn quanh thân: kích nổ mọi tầng Thiêu đốt, rồi đặt lại 2 tầng", icon: "✹", cost: 70, cd: 20,
      area: "around", r: 130, dmg: 3.5, glow: true, shake: true, boom: { keep: 2 } },
    { name: "Hỏa Long Diệt Thế", desc: "Tuyệt kỹ: rồng lửa phủ cả vùng 3 đợt, mỗi đợt Thiêu đốt 2 tầng; đợt cuối Viêm bạo toàn vùng (kích nổ mạnh thêm 50%) trước khi đốt lại", icon: "✹", cost: 100, cd: 45,
      area: "around", r: 180, n: 3, every: 0.5, dmg: 1.6, glow: true, shake: true, ult: true, status: [{ s: "burn", n: 2 }],
      boom: { keep: 0, last: true, mult: 0.5 } },
  ],
  // Khống chế, thiêu đốt: choáng, đẩy lùi, Dễ thương cho đồng đội đánh; tuyệt kỹ đẩy và choáng cả vùng.
  hoa_anh: [
    { name: "Hỏa Ảnh Liên Chưởng", desc: "Chưởng lửa nửa trước mặt, đẩy lùi: Dễ thương 4 giây, Thiêu đốt 1 tầng", icon: "✋", cost: 45, cd: 9,
      area: "front", r: 64, dmg: 2.4, push: 50, status: [{ s: "vuln", secs: 4 }, { s: "burn" }] },
    { name: "Hỏa Ảnh Lao Lung", desc: "Lồng bóng lửa đặt ở chỗ đứng 3 giây: 6 nhát, Làm chậm, Thiêu đốt; nhát cuối Choáng 1,5 giây", icon: "⌗", cost: 50, cd: 14,
      area: "around", r: 90, fixed: true, n: 6, every: 0.5, dmg: 0.5, status: [{ s: "slow", secs: 1 }, { s: "burn" }], finisher: [{ s: "stun", secs: 1.5 }] },
    { name: "Liệt Hỏa Phong Ấn", desc: "Ấn lửa lớn quanh thân: Choáng 2 giây, Dễ thương 8 giây, Thiêu đốt 2 tầng", icon: "✧", cost: 60, cd: 18,
      area: "around", r: 110, dmg: 3, glow: true, status: [{ s: "stun", secs: 2 }, { s: "vuln", secs: 8 }, { s: "burn", n: 2 }] },
    { name: "Hỏa Ảnh Bạo Kích", desc: "Lao tới một mục tiêu, bóng lửa nổ tung: đẩy lùi, Choáng 2 giây, Thiêu đốt 3 tầng", icon: "✸", cost: 70, cd: 20,
      area: "target", r: 120, dash: 90, dmg: 5.5, push: 70, shake: true, status: [{ s: "stun", secs: 2 }, { s: "burn", n: 3 }] },
    { name: "Hỏa Ảnh Thiên Trọng", desc: "Tuyệt kỹ: ngàn bóng lửa nổ khắp cả vùng, đẩy lùi: Choáng 2,5 giây, Dễ thương 8 giây, Thiêu đốt 3 tầng", icon: "✸", cost: 100, cd: 45,
      area: "around", r: 160, dmg: 5, push: 60, glow: true, shake: true, ult: true,
      status: [{ s: "stun", secs: 2.5 }, { s: "vuln", secs: 8 }, { s: "burn", n: 3 }] },
  ],
  // Cường công, thiêu đốt / phá giáp: cánh hoa sát thương liên tục, hạn chế di chuyển, hồi chiêu ngắn hơn các võ hồn bùng nổ.
  ky_nhung_thong_thien_cuc: [
    { name: "Cúc Hoa Tán Vũ", desc: "Phóng 7 cánh hoa hình quạt, mỗi cánh Thiêu đốt và Phá giáp 1 tầng", icon: "❀", cost: 40, cd: 7,
      area: "proj", r: 150, n: 7, spread: 80, dmg: 1.3, status: [{ s: "burn" }, { s: "armor" }] },
    { name: "Kỳ Nhung Phược Hoa", desc: "Dây cánh hoa quấn hồn thú quanh thân: Trói 2 giây, Phá giáp 2 tầng", icon: "❦", cost: 45, cd: 10,
      area: "around", r: 90, dmg: 2.2, status: [{ s: "root", secs: 2 }, { s: "armor", n: 2 }] },
    { name: "Cúc Hoa Phong Bạo · Liên Hoàn", desc: "Bão cánh hoa quanh thân 2,4 giây, 8 nhát, mỗi nhát Thiêu đốt và Phá giáp 1 tầng, nhát cuối Trói 2 giây", icon: "✿", cost: 55, cd: 15,
      area: "around", r: 100, n: 8, every: 0.3, dmg: 0.9, glow: true, status: [{ s: "burn" }, { s: "armor" }], finisher: [{ s: "root", secs: 2 }] },
    { name: "Thông Thiên Cúc Trảm", desc: "Lướt tới mục tiêu, 4 nhát cánh hoa, mỗi tầng Phá giáp trên mục tiêu thêm 30% công", icon: "✾", cost: 65, cd: 18,
      area: "target", r: 120, dash: 90, n: 4, every: 0.15, dmg: 1.3, perStack: { s: "armor", dmg: 0.3 }, glow: true },
    { name: "Vạn Cúc Thông Thiên", desc: "Tuyệt kỹ: vạn cánh cúc phủ cả vùng 3,6 giây, 12 nhát, mỗi nhát Thiêu đốt và Phá giáp 1 tầng, nhát cuối Trói 3 giây", icon: "✾", cost: 100, cd: 45,
      area: "around", r: 160, n: 12, every: 0.3, dmg: 0.9, glow: true, shake: true, ult: true,
      status: [{ s: "burn" }, { s: "armor" }], finisher: [{ s: "root", secs: 3 }] },
  ],
  // Mẫn công, thiêu đốt / phá giáp: lướt xuyên hàng trước, khóa và hạ mục tiêu yếu máu; tuyệt kỹ 8 nhát vào hồn thú yếu máu nhất.
  nguyet_nhan: [
    { name: "Nguyệt Ảnh Liên Đột", desc: "Lướt xa xuyên hàng hồn thú phía trước: Phá giáp 2 tầng", icon: "➤", cost: 45, cd: 9,
      area: "dash", r: 110, dmg: 3, inv: 0.4, status: [{ s: "armor", n: 2 }] },
    { name: "Huyết Nguyệt Đoạt Hồn", desc: "Khóa hồn thú yếu máu nhất, lướt tới chém 3 nhát (tới +120% khi mục tiêu ít máu), +20% chí mạng, Thiêu đốt 1 tầng", icon: "☾", cost: 50, cd: 12,
      area: "target", r: 150, pick: "low", dash: 130, n: 3, every: 0.12, dmg: 1.5, lowHp: 1.2, crit: 0.2, status: [{ s: "burn" }] },
    { name: "Song Nguyệt Giao Huy", desc: "Hai vầng trăng giao nhau quét nửa trước mặt, +20% chí mạng: Phá giáp 2 tầng, Thiêu đốt 2 tầng", icon: "◐", cost: 60, cd: 16,
      area: "front", r: 72, dmg: 3.6, crit: 0.2, glow: true, status: [{ s: "armor", n: 2 }, { s: "burn", n: 2 }] },
    { name: "Tà Nguyệt Phá Không", desc: "Khóa hồn thú yếu máu nhất trong tầm rất xa, lướt tới chém 4 nhát (tới +150% khi mục tiêu ít máu), +30% chí mạng", icon: "☽", cost: 70, cd: 20,
      area: "target", r: 170, pick: "low", dash: 160, n: 4, every: 0.1, dmg: 1.8, lowHp: 1.5, crit: 0.3, inv: 0.5 },
    { name: "Tà Nguyệt Đoạt Mệnh · Huyết Nguyệt", desc: "Tuyệt kỹ: khóa hồn thú yếu máu nhất cả vùng, lướt tới chém 8 nhát (tới +200% khi mục tiêu ít máu), +40% chí mạng, mỗi nhát Phá giáp 1 tầng", icon: "☽", cost: 100, cd: 45,
      area: "target", r: 200, pick: "low", dash: 190, n: 8, every: 0.1, dmg: 1.2, lowHp: 2, crit: 0.4, inv: 1.2, glow: true, ult: true, status: [{ s: "armor" }] },
  ],
  // ---- Bước 8.1c: lưu phái Cảm điện (mọi số và tên đã chốt). Combo như 2.5c: Kim Vũ Miêu Ưng / Càn Khôn Hỗn Nguyên Tỏa / Yêu Hồ phủ
  // Cảm điện, đổi sang Lam Điện Bá Vương Long kích nổ (thêm sát thương theo tầng Cảm điện, lan 40%); Xúc Xích hồi hồn lực và Phục Chế. ----
  // Cường công, cảm điện (lõi): sấm sét diện rộng, đánh hồn thú Cảm điện đau hơn; tuyệt kỹ Lôi Động Minh Thiên toàn vực (sét tìm mục tiêu Cảm điện).
  lam_dien_ba_vuong_long: [
    { name: "Lam Điện Phá Không Kích", desc: "Long trảo sấm sét quét nửa trước mặt: hồn thú đang Cảm điện chịu thêm 100% công, Cảm điện", icon: "ϟ", cost: 45, cd: 9,
      area: "front", r: 72, dmg: 3, perStack: { s: "shock", dmg: 1 }, status: [{ s: "shock" }] },
    { name: "Lôi Long Cửu Liên", desc: "5 tia sét liên hoàn vào mục tiêu gần nhất trong tầm xa, mỗi tia Cảm điện và lan sang hồn thú Cảm điện gần đó", icon: "☇", cost: 50, cd: 12,
      area: "target", r: 160, n: 5, every: 0.2, dmg: 1.1, status: [{ s: "shock" }] },
    { name: "Lam Điện Lôi Ngục", desc: "Ngục sấm 3 đợt quanh thân: mỗi tầng Cảm điện thêm 60% công, Cảm điện; đợt cuối Choáng 1,5 giây", icon: "✺", cost: 60, cd: 18,
      area: "around", r: 120, n: 3, every: 0.4, dmg: 1.8, perStack: { s: "shock", dmg: 0.6 }, glow: true, status: [{ s: "shock" }], finisher: [{ s: "stun", secs: 1.5 }] },
    { name: "Bá Vương Long Hống", desc: "Long hống Bá Vương quanh thân: hồn thú đang Cảm điện chịu thêm 200% công, Câm lặng 2 giây (ngắt chiêu), Cảm điện", icon: "◎", cost: 70, cd: 20,
      area: "around", r: 140, dmg: 4.5, perStack: { s: "shock", dmg: 2 }, glow: true, shake: true, status: [{ s: "shock" }, { s: "silence", secs: 2 }] },
    { name: "Lôi Động Minh Thiên · Toàn Vực", desc: "Tuyệt kỹ: sấm sét 3 đợt quanh thân 160, sét còn tìm mọi hồn thú đang Cảm điện trong 280; mỗi tầng Cảm điện thêm 100% công; đợt cuối Choáng 2 giây", icon: "☇", cost: 100, cd: 45,
      area: "around", r: 160, shockR: 280, n: 3, every: 0.5, dmg: 2, perStack: { s: "shock", dmg: 1 }, glow: true, shake: true, ult: true,
      status: [{ s: "shock" }], finisher: [{ s: "stun", secs: 2 }] },
  ],
  // Mẫn công, cảm điện: bay, vuốt tê liệt (Choáng + Câm lặng); tuyệt kỹ áo nghĩa phủ Cảm điện cả vùng lâu nhất lưu phái.
  kim_vu_mieu_ung: [
    { name: "Kim Vũ Lôi Trảo", desc: "Lướt tới mục tiêu, vuốt sét 4 nhát, +20% chí mạng, Cảm điện", icon: "≋", cost: 45, cd: 9,
      area: "target", r: 80, dash: 70, n: 4, every: 0.12, dmg: 1.1, crit: 0.2, status: [{ s: "shock" }] },
    { name: "Kim Ưng Lôi Kích", desc: "Bay vút qua đầu hồn thú, giáng sét mọi hồn thú trên đường: Cảm điện, Câm lặng 2 giây, bất tử khi bay", icon: "➶", cost: 50, cd: 12,
      area: "dash", r: 130, dmg: 3, inv: 0.7, fly: 0.7, status: [{ s: "shock" }, { s: "silence", secs: 2 }] },
    { name: "Tê Liệt Lôi Trảo · Liên Hoàn", desc: "Lướt tới mục tiêu, vuốt sét 5 nhát, +30% chí mạng, Cảm điện; nhát cuối tê liệt: Choáng 2 giây, Câm lặng 4 giây", icon: "✋", cost: 60, cd: 16,
      area: "target", r: 110, dash: 100, n: 5, every: 0.12, dmg: 1.3, crit: 0.3, glow: true, status: [{ s: "shock" }],
      finisher: [{ s: "stun", secs: 2 }, { s: "silence", secs: 4 }] },
    { name: "Kim Vũ Lôi Bạo", desc: "12 lông vũ sét bắn ra bốn phía, mỗi lông Cảm điện 8 giây", icon: "✶", cost: 70, cd: 20,
      area: "proj", r: 170, n: 12, spread: 360, dmg: 1.5, glow: true, status: [{ s: "shock", secs: 8 }] },
    { name: "Kim Ưng Thiên Lôi Vực", desc: "Tuyệt kỹ: bay lên phủ sấm sét cả vùng 3 đợt, Cảm điện 10 giây mọi hồn thú trong 200; đợt cuối Câm lặng 3 giây", icon: "☈", cost: 100, cd: 45,
      area: "around", r: 200, n: 3, every: 0.5, dmg: 1.8, fly: 1, inv: 1, glow: true, shake: true, ult: true,
      status: [{ s: "shock", secs: 10 }], finisher: [{ s: "silence", secs: 3 }] },
  ],
  // Khống chế, cảm điện: bay tới đặt vùng phong tỏa, giam, Phong ấn cộng dồn thành Dễ thương 6,8 giây; vòng 9 đánh mạnh mục tiêu Dễ thương.
  can_khon_hon_nguyen_toa: [
    { name: "Càn Khôn Tỏa Thiên", desc: "3 xích Càn Khôn khóa mục tiêu gần nhất: mỗi xích Phong ấn 1 tầng, Cảm điện; xích cuối Trói 1,5 giây", icon: "⛓", cost: 45, cd: 9,
      area: "target", r: 130, n: 3, every: 0.2, dmg: 1.1, status: [{ s: "lock" }, { s: "shock" }], finisher: [{ s: "root", secs: 1.5 }] },
    { name: "Hỗn Nguyên Lao Ngục", desc: "Bay tới hồn thú gần nhất, đặt ngục phong tỏa 3 giây: 6 nhát, mỗi nhát giam, Phong ấn 1 tầng, Cảm điện", icon: "⌗", cost: 50, cd: 14,
      area: "around", at: 140, dash: 110, fly: 0.4, r: 90, n: 6, every: 0.5, dmg: 0.55, status: [{ s: "root", secs: 0.6 }, { s: "lock" }, { s: "shock" }] },
    { name: "Càn Khôn Định Thế", desc: "Kéo mọi hồn thú quanh thân lại và định thân: Phong ấn 2 tầng, Trói 2,5 giây, Cảm điện", icon: "⌘", cost: 60, cd: 18,
      area: "around", r: 120, dmg: 3.2, pull: true, glow: true, status: [{ s: "lock", n: 2 }, { s: "root", secs: 2.5 }, { s: "shock" }] },
    { name: "Hỗn Nguyên Toái Không", desc: "Lao tới một mục tiêu, Hỗn Nguyên đập vỡ hư không: mục tiêu đang Dễ thương chịu thêm 200% công, Choáng 1,5 giây, Cảm điện", icon: "▲", cost: 70, cd: 20,
      area: "target", r: 120, dash: 100, dmg: 5, perStack: { s: "vuln", dmg: 2 }, glow: true, shake: true, status: [{ s: "stun", secs: 1.5 }, { s: "shock" }] },
    { name: "Càn Khôn Hỗn Nguyên · Thiên Địa Tỏa", desc: "Tuyệt kỹ: bay tới đặt vùng phong tỏa trời đất bán kính 150 trong 3,2 giây: 8 nhát, mỗi nhát giam, Phong ấn 1 tầng, Cảm điện", icon: "▣", cost: 100, cd: 45,
      area: "around", at: 180, dash: 150, fly: 0.6, inv: 0.6, r: 150, n: 8, every: 0.4, dmg: 0.9, glow: true, shake: true, ult: true,
      status: [{ s: "root", secs: 0.5 }, { s: "lock" }, { s: "shock" }] },
  ],
  // Khống chế, cảm điện: Mị hoặc cộng dồn thành Mê hoặc, ảo ảnh tàng hình, lãnh vực làm chậm; tuyệt kỹ Mê hoặc diện rộng.
  yeu_ho: [
    { name: "Yêu Hồ Mị Ảnh", desc: "Ánh mắt mị hoặc nửa trước mặt: Mị hoặc 2 tầng, Cảm điện", icon: "◉", cost: 45, cd: 9,
      area: "front", r: 80, dmg: 2.8, status: [{ s: "allure", n: 2 }, { s: "shock" }] },
    { name: "Hồ Ảnh Phân Thân", desc: "Phân thân hồ ly nổ quanh thân: Mị hoặc 1 tầng, Câm lặng 2 giây; hồn sư tàng hình 4 giây", icon: "☁", cost: 50, cd: 14,
      area: "around", r: 90, dmg: 2, status: [{ s: "allure" }, { s: "silence", secs: 2 }], self: { buff: { hide: 1 }, secs: 4 } },
    { name: "Thiên Hồ Mị Vực", desc: "Mị vực đặt ở chỗ đứng 3 giây: 6 nhát, mỗi nhát Làm chậm, Mị hoặc 1 tầng (đủ 3 tầng thì Mê hoặc)", icon: "❂", cost: 60, cd: 18,
      area: "around", fixed: true, r: 120, n: 6, every: 0.5, dmg: 0.7, glow: true, status: [{ s: "slow", secs: 1 }, { s: "allure" }] },
    { name: "Yêu Hồ Đoạt Phách", desc: "Lướt tới một mục tiêu đoạt phách: Câm lặng 3 giây (ngắt chiêu), Mị hoặc 2 tầng, Cảm điện", icon: "✾", cost: 70, cd: 20,
      area: "target", r: 120, dash: 100, dmg: 5.5, glow: true, status: [{ s: "silence", secs: 3 }, { s: "allure", n: 2 }, { s: "shock" }] },
    { name: "Vạn Hồ Triều Bái", desc: "Tuyệt kỹ: vạn hồ ly mê hoặc cả vùng 180: Mê hoặc 4 giây, Câm lặng 3 giây, Làm chậm 4 giây, Cảm điện; hồn sư tàng hình 3 giây", icon: "✾", cost: 100, cd: 45,
      area: "around", r: 180, dmg: 4.5, glow: true, shake: true, ult: true,
      status: [{ s: "charm", secs: 4 }, { s: "silence", secs: 3 }, { s: "slow", secs: 4 }, { s: "shock" }], self: { buff: { hide: 1 }, secs: 3 } },
  ],
  // Phụ trợ, cảm điện: hồi sinh lực, hồi hồn lực, thanh tẩy; vòng 9 Phục Chế đại thành (không giảm, vẫn không chép tuyệt kỹ); hiệu ứng thuộc hồn sư.
  xuc_xich: [
    { name: "Đại Hương Tràng Hồi Xuân", desc: "Hồi 30% sinh lực cả đội, khiên 10% sinh lực tối đa 8 giây", icon: "✚", cost: 40, cd: 14,
      area: "self", r: 0, dmg: 0, self: { heal: 0.3, shield: 0.1, secs: 8 } },
    { name: "Lôi Điện Hương Tràng", desc: "8 xúc xích mang điện bay ra bốn phía, mỗi cây Cảm điện", icon: "✶", cost: 45, cd: 10,
      area: "proj", r: 150, n: 8, spread: 360, dmg: 1, status: [{ s: "shock" }] },
    { name: "Thanh Tâm Đại Hương Tràng", desc: "Hồi 30% sinh lực cả đội, 30% hồn lực, khiên 15% sinh lực tối đa 8 giây, thanh tẩy (giải khống chế)", icon: "✧", cost: 60, cd: 20,
      area: "self", r: 0, dmg: 0, glow: true, self: { heal: 0.3, mp: 0.3, shield: 0.15, secs: 8, cleanse: true } },
    { name: "Phục Chế Hương Tràng · Đại Thành", desc: "Áo nghĩa đại thành: sao chép hồn kỹ vừa tung (8 giây) của võ hồn khác trong đội (chưa gục) hoặc đồng đội tổ đội đứng gần, sát thương và hiệu ứng không giảm; không chép tuyệt kỹ", icon: "⧉", cost: 60, cd: 18,
      area: "self", r: 0, dmg: 0, glow: true, copy: 1 },
    { name: "Hương Tràng Thịnh Yến", desc: "Tuyệt kỹ: hồi 40% sinh lực cả đội, 30% hồn lực, khiên 20% sinh lực tối đa, công +20%, tốc độ +30% trong 10 giây, thanh tẩy", icon: "✚", cost: 100, cd: 50,
      area: "self", r: 0, dmg: 0, glow: true, ult: true, self: { buff: { atk: 0.2, spd: 0.3 }, secs: 10, heal: 0.4, mp: 0.3, shield: 0.2, cleanse: true } },
  ],
  // ---- Bước 8.1d: 5 võ hồn còn lại (mọi số đã chốt). Từ đây cả 20 võ hồn trong VOHON đều có vòng 5–10 và Chân Thân. ----
  // Cường công, phá giáp: kiếm trận diện rộng liên tục, Liệt thương; tuyệt kỹ Kiếm Trảm Sơn Hà thật (vòng 4 là bản nhỏ Thất Sát Trảm).
  cuu_tinh_that_sat_kiem: [
    { name: "Thất Sát Kiếm Mang", desc: "Kiếm mang Thất Sát quét nửa trước mặt: Liệt thương (Phá giáp 2 tầng)", icon: "⚔", cost: 45, cd: 9,
      area: "front", r: 70, dmg: 3, status: [{ s: "armor", n: 2 }] },
    { name: "Thất Tinh Kiếm Trận", desc: "Kiếm trận bảy sao xoay quanh thân 3,2 giây (đi theo hồn sư), 8 nhát, mỗi nhát Phá giáp 1 tầng", icon: "✵", cost: 50, cd: 14,
      area: "around", r: 100, n: 8, every: 0.4, dmg: 0.7, status: [{ s: "armor" }] },
    { name: "Cửu Tinh Kiếm Lưu", desc: "16 thanh kiếm bắn ra bốn phía, mỗi kiếm Phá giáp 1 tầng", icon: "✶", cost: 60, cd: 16,
      area: "proj", r: 170, n: 16, spread: 360, dmg: 1.4, glow: true, status: [{ s: "armor" }] },
    { name: "Nhân Kiếm Hợp Nhất", desc: "Người kiếm hợp nhất lao tới một mục tiêu: mỗi tầng Phá giáp trên mục tiêu thêm 60% công, Phá giáp 2 tầng", icon: "➹", cost: 70, cd: 20,
      area: "target", r: 110, dash: 90, dmg: 6, perStack: { s: "armor", dmg: 0.6 }, glow: true, shake: true, status: [{ s: "armor", n: 2 }] },
    { name: "Kiếm Trảm Sơn Hà", desc: "Tuyệt kỹ: dồn cả kiếm ý chém một kiếm núi sông nửa trước mặt cả vùng: mỗi tầng Phá giáp trên mục tiêu thêm 80% công, Phá giáp đủ 3 tầng", icon: "⚡", cost: 100, cd: 45,
      area: "front", r: 150, dmg: 7, perStack: { s: "armor", dmg: 0.8 }, inv: 0.5, glow: true, shake: true, ult: true, status: [{ s: "armor", n: 3 }] },
  ],
  // Mẫn công, chấn đãng: lướt, quật ngã, chí mạng, hút máu; hồn kỹ của Tiểu Vũ (Mị Hoặc, Thuấn Di, Vô Địch Kim Thân, Bát Đoạn Suất).
  nhu_cot_tho: [
    { name: "Mị Hoặc", desc: "Ánh mắt mị hoặc quét nửa trước mặt, +20% chí mạng: Mị hoặc 2 tầng", icon: "✾", cost: 45, cd: 9,
      area: "front", r: 60, dmg: 2.4, crit: 0.2, status: [{ s: "allure", n: 2 }] },
    { name: "Thuấn Di · Liên Hoàn", desc: "Thuấn di xa xuyên hàng hồn thú, +30% chí mạng, hút 20% sát thương, bất tử 0,5 giây", icon: "➤", cost: 50, cd: 12,
      area: "dash", r: 120, dmg: 3, crit: 0.3, lifesteal: 0.2, inv: 0.5 },
    { name: "Nhu Cốt Liên Suất", desc: "Lướt tới quật mục tiêu 5 đoạn, +30% chí mạng, hút 25% sát thương; đoạn cuối quật ngã (Choáng 1,5 giây)", icon: "➰", cost: 60, cd: 16,
      area: "target", r: 100, dash: 80, n: 5, every: 0.14, dmg: 1.3, crit: 0.3, lifesteal: 0.25, inv: 0.5, finisher: [{ s: "stun", secs: 1.5 }] },
    { name: "Vô Địch Kim Thân · Bất Hoại", desc: "Kim thân bất hoại: bất tử 2 giây; chí mạng +40%, công +25% trong 8 giây", icon: "✪", cost: 55, cd: 22,
      area: "self", r: 0, dmg: 0, inv: 2, glow: true, self: { buff: { crit: 0.4, atk: 0.25 }, secs: 8 } },
    { name: "Bát Đoạn Suất · Thập Vạn Niên", desc: "Tuyệt kỹ: sức mạnh thỏ mười vạn năm, lướt tới quật mục tiêu 8 đoạn, +40% chí mạng, hút 30% sát thương; đoạn cuối quật ngã (Choáng 2,5 giây)", icon: "✥", cost: 100, cd: 45,
      area: "target", r: 120, dash: 110, n: 8, every: 0.14, dmg: 1.5, crit: 0.4, lifesteal: 0.3, inv: 1.2, glow: true, shake: true, ult: true, finisher: [{ s: "stun", secs: 2.5 }] },
  ],
  // Khống chế, trúng độc / cảm điện: tơ độc, lưới giam đặt vào hồn thú, gom quái; tuyệt kỹ thiên võng kéo cả vùng lại.
  tu_vong_chu_hoang: [
    { name: "Chu Hoàng Độc Ti", desc: "Phun 5 sợi tơ độc hình quạt, mỗi sợi Trúng độc 1 tầng, Làm chậm 1 giây", icon: "➶", cost: 45, cd: 9,
      area: "proj", r: 160, n: 5, spread: 60, dmg: 1.2, status: [{ s: "poison" }, { s: "slow", secs: 1 }] },
    { name: "Tử Vong Chu Võng", desc: "Quăng lưới tơ chụp lên hồn thú gần nhất 3 giây: 6 nhát, mỗi nhát Trói 0,6 giây (giam), Trúng độc 1 tầng, Cảm điện", icon: "▦", cost: 50, cd: 14,
      area: "around", at: 140, r: 90, n: 6, every: 0.5, dmg: 0.5, status: [{ s: "root", secs: 0.6 }, { s: "poison" }, { s: "shock" }] },
    { name: "Vạn Chu Phệ Thể", desc: "Vạn nhện cắn xé quanh thân: mỗi tầng Trúng độc thêm 50% công, Trúng độc 2 tầng, Dễ thương 6 giây, Cảm điện", icon: "☠", cost: 60, cd: 18,
      area: "around", r: 120, dmg: 2.8, perStack: { s: "poison", dmg: 0.5 }, glow: true, status: [{ s: "poison", n: 2 }, { s: "vuln", secs: 6 }, { s: "shock" }] },
    { name: "Tử Vong Chu Hoàng Lãnh Vực", desc: "Lãnh vực Chu Hoàng đặt ở chỗ đứng 3,2 giây: 8 nhát, Trúng độc, Làm chậm, Cảm điện; nhát cuối Trói 2 giây", icon: "✳", cost: 70, cd: 20,
      area: "around", r: 130, fixed: true, n: 8, every: 0.4, dmg: 0.6, glow: true, status: [{ s: "poison" }, { s: "slow", secs: 1 }, { s: "shock" }], finisher: [{ s: "root", secs: 2 }] },
    { name: "Tử Vong Thiên Võng", desc: "Tuyệt kỹ: thiên võng tơ chết phủ cả vùng, kéo mọi hồn thú lại: mỗi tầng Trúng độc thêm 80% công, Trói 3,5 giây, Trúng độc đủ 5 tầng, Câm lặng 3 giây, Cảm điện", icon: "✳", cost: 100, cd: 45,
      area: "around", r: 160, dmg: 5.5, pull: true, perStack: { s: "poison", dmg: 0.8 }, glow: true, shake: true, ult: true,
      status: [{ s: "root", secs: 3.5 }, { s: "poison", n: 5 }, { s: "silence", secs: 3 }, { s: "shock" }] },
  ],
  // Phụ trợ, đội bùng nổ: hút máu, hút huyết cả đội, tăng công, Dễ thương; tuyệt kỹ Quỷ Ảnh Trùng Trùng thật (vòng 4 là bản nhỏ Quỷ Ảnh Tiềm Hành).
  quy_mi: [
    { name: "Quỷ Ảnh Phệ Huyết", desc: "Quỷ ảnh cắn xé quanh thân: hút 40% sát thương thành sinh lực, Dễ thương 4 giây", icon: "≋", cost: 45, cd: 10,
      area: "around", r: 90, dmg: 2, lifesteal: 0.4, status: [{ s: "vuln", secs: 4 }] },
    { name: "Quỷ Vương Gia Trì", desc: "Công +30%, chí mạng +15%, hút huyết 15% trong 12 giây (cả đội)", icon: "✦", cost: 50, cd: 18,
      area: "self", r: 0, dmg: 0, self: { buff: { atk: 0.3, crit: 0.15, leech: 0.15 }, secs: 12 } },
    { name: "Quỷ Huyết Tế", desc: "Huyết tế: hồi 20% sinh lực cả đội, 35% mọi sát thương gây ra hồi thành sinh lực trong 12 giây", icon: "♥", cost: 55, cd: 20,
      area: "self", r: 0, dmg: 0, glow: true, self: { buff: { leech: 0.35 }, secs: 12, heal: 0.2 } },
    { name: "Bách Quỷ Dạ Hành", desc: "Trăm quỷ tràn quanh thân: hút 30% sát thương, Dễ thương 8 giây; công +35% trong 10 giây (cả đội)", icon: "☾", cost: 70, cd: 22,
      area: "around", r: 120, dmg: 3, lifesteal: 0.3, glow: true, status: [{ s: "vuln", secs: 8 }], self: { buff: { atk: 0.35 }, secs: 10 } },
    { name: "Quỷ Ảnh Trùng Trùng", desc: "Tuyệt kỹ: trùng trùng quỷ ảnh nổ quanh thân (hút 40%, Dễ thương 8 giây), rồi cả đội tàng hình 8 giây (hồn thú mất dấu), công +50%, hút huyết 30%, bất tử 2 giây; ra đòn thì hiện hình", icon: "☾", cost: 100, cd: 50,
      area: "around", r: 140, dmg: 3.5, lifesteal: 0.4, inv: 2, glow: true, shake: true, ult: true, status: [{ s: "vuln", secs: 8 }],
      self: { buff: { hide: 1, atk: 0.5, leech: 0.3 }, secs: 8 } },
  ],
  // Phụ trợ, đánh boss: hồi máu, khiên, giảm sát thương, thanh tẩy đội; Dễ thương, Phá giáp, xóa buff địch; tuyệt kỹ Tịnh Thế Lưu Ly thật
  // (vòng 4 là bản nhỏ Ngọc Đỉnh Hộ Thế).
  thien_can_bach_ngoc_dinh: [
    { name: "Bạch Ngọc Trấn Hồn", desc: "Đỉnh ngọc trấn hồn quanh thân: Dễ thương 6 giây, Phá giáp 2 tầng, xóa hiệu ứng có lợi của hồn thú", icon: "▼", cost: 45, cd: 10,
      area: "around", r: 100, dmg: 1.6, dispel: true, status: [{ s: "vuln", secs: 6 }, { s: "armor", n: 2 }] },
    { name: "Thiên Càn Hộ Thể", desc: "Hồi 22% sinh lực cả đội, khiên 18% sinh lực tối đa, sát thương nhận giảm 20% trong 8 giây, thanh tẩy", icon: "◈", cost: 50, cd: 16,
      area: "self", r: 0, dmg: 0, self: { buff: { def: 0.2 }, secs: 8, heal: 0.22, shield: 0.18, cleanse: true } },
    { name: "Thiên Càn Phong Ma", desc: "Đỉnh ngọc giáng xuống phong ma quanh thân: Dễ thương 8 giây, Câm lặng 2,5 giây, xóa hiệu ứng có lợi của hồn thú", icon: "▼", cost: 60, cd: 18,
      area: "around", r: 130, dmg: 2.5, dispel: true, glow: true, status: [{ s: "vuln", secs: 8 }, { s: "silence", secs: 2.5 }] },
    { name: "Bạch Ngọc Thánh Đỉnh", desc: "Thánh đỉnh bạch ngọc: hồi 35% sinh lực cả đội, khiên 25% sinh lực tối đa, sát thương nhận giảm 25% trong 8 giây, thanh tẩy", icon: "✚", cost: 65, cd: 24,
      area: "self", r: 0, dmg: 0, glow: true, self: { buff: { def: 0.25 }, secs: 8, heal: 0.35, shield: 0.25, cleanse: true } },
    { name: "Tịnh Thế Lưu Ly", desc: "Tuyệt kỹ: lưu ly tịnh thế phủ cả vùng: Dễ thương 10 giây, Phá giáp 3 tầng, Câm lặng 3 giây, xóa hiệu ứng có lợi của hồn thú; hồi 50% sinh lực cả đội, khiên 30%, sát thương nhận giảm 30% trong 10 giây, thanh tẩy", icon: "✷", cost: 100, cd: 50,
      area: "around", r: 160, dmg: 3, dispel: true, glow: true, shake: true, ult: true,
      status: [{ s: "vuln", secs: 10 }, { s: "armor", n: 3 }, { s: "silence", secs: 3 }],
      self: { buff: { def: 0.3 }, secs: 10, heal: 0.5, shield: 0.3, cleanse: true } },
  ],
  // ---- Bước 8.3: 4 võ hồn ngoài danh sách SSR cơ bản (mọi số và tên hồn kỹ đã chốt). ----
  // Cường công, phá giáp: thương liên hoàn, mũi thương mang, chém phá hồn theo tầng Phá giáp; tuyệt kỹ đâm liên hoàn ngắt chiêu.
  pha_hon_thuong: [
    { name: "Phá Hồn Liên Thương", desc: "Lướt tới đâm mục tiêu 4 nhát, mỗi nhát Phá giáp 1 tầng", icon: "⚔", cost: 45, cd: 9,
      area: "target", r: 100, dash: 80, n: 4, every: 0.15, dmg: 1.1, status: [{ s: "armor" }] },
    { name: "Thương Mang Phá Không", desc: "Phóng 5 mũi thương mang hình quạt, mỗi mũi Phá giáp 1 tầng", icon: "✶", cost: 50, cd: 12,
      area: "proj", r: 160, n: 5, spread: 30, dmg: 1.4, status: [{ s: "armor" }] },
    { name: "Phá Hồn Trảm Phách", desc: "Thương quét nửa trước mặt: mỗi tầng Phá giáp trên mục tiêu thêm 50% công, Phá giáp 2 tầng, Câm lặng 2,5 giây", icon: "⚡", cost: 60, cd: 18,
      area: "front", r: 90, dmg: 4.2, perStack: { s: "armor", dmg: 0.5 }, glow: true, status: [{ s: "armor", n: 2 }, { s: "silence", secs: 2.5 }] },
    { name: "Xuyên Vân Phá Nhật", desc: "Lướt xa xuyên hàng hồn thú: mỗi tầng Phá giáp thêm 50% công, Phá giáp đủ 3 tầng, bất tử 0,6 giây", icon: "➹", cost: 70, cd: 20,
      area: "dash", r: 140, dmg: 5, perStack: { s: "armor", dmg: 0.5 }, inv: 0.6, shake: true, status: [{ s: "armor", n: 3 }] },
    { name: "Phá Hồn Diệt Phách · Thiên Thương", desc: "Tuyệt kỹ: lướt tới đâm mục tiêu 6 nhát, mỗi nhát Phá giáp và thêm 30% công mỗi tầng Phá giáp, Câm lặng 3 giây; nhát cuối Choáng 1,5 giây", icon: "⚡", cost: 100, cd: 45,
      area: "target", r: 130, dash: 110, n: 6, every: 0.12, dmg: 1.4, perStack: { s: "armor", dmg: 0.3 }, inv: 1, glow: true, shake: true, ult: true,
      status: [{ s: "armor" }, { s: "silence", secs: 3 }], finisher: [{ s: "stun", secs: 1.5 }] },
  ],
  // Phụ trợ, chấn đãng: Lam Ngân Hoàng giam cả vùng, hồi máu, thanh tẩy, tăng chỉ số cho đội; tuyệt kỹ Lam Ngân Hoàng · Sinh Sinh Bất Tức.
  a_ngan: [
    { name: "Lam Ngân Tù Thiên", desc: "Lam Ngân kéo mọi hồn thú quanh thân lại và giam: Trói 2,5 giây, Dễ thương 6 giây", icon: "⌘", cost: 45, cd: 14,
      area: "around", r: 110, dmg: 2.2, pull: true, status: [{ s: "root", secs: 2.5 }, { s: "vuln", secs: 6 }] },
    { name: "Lam Ngân Thánh Dũ", desc: "Hồi 25% sinh lực cả đội, khiên 15% sinh lực tối đa 6 giây, thanh tẩy", icon: "✚", cost: 50, cd: 16,
      area: "self", r: 0, dmg: 0, self: { secs: 6, heal: 0.25, shield: 0.15, cleanse: true } },
    { name: "Vạn Lý Lam Ngân", desc: "10 sợi Lam Ngân bắn vòng tròn, mỗi sợi Trói 1,5 giây, Dễ thương 4 giây", icon: "❀", cost: 60, cd: 18,
      area: "proj", r: 170, n: 10, spread: 360, dmg: 1.3, status: [{ s: "root", secs: 1.5 }, { s: "vuln", secs: 4 }] },
    { name: "Hoàng Giả Chúc Phúc", desc: "Công +30%, sát thương nhận giảm 20%, tốc độ +15% trong 12 giây, khiên 15% (cả đội)", icon: "✦", cost: 60, cd: 22,
      area: "self", r: 0, dmg: 0, glow: true, self: { buff: { atk: 0.3, def: 0.2, spd: 0.15 }, secs: 12, shield: 0.15 } },
    { name: "Lam Ngân Hoàng · Sinh Sinh Bất Tức", desc: "Tuyệt kỹ: Lam Ngân Hoàng phủ cả vùng, kéo mọi hồn thú lại và giam (Trói 3,5 giây, Dễ thương 8 giây); hồi 50% sinh lực cả đội, khiên 25%, sát thương nhận giảm 25% trong 10 giây, thanh tẩy", icon: "✿", cost: 100, cd: 50,
      area: "around", r: 160, dmg: 3, pull: true, glow: true, shake: true, ult: true, status: [{ s: "root", secs: 3.5 }, { s: "vuln", secs: 8 }],
      self: { buff: { def: 0.25 }, secs: 10, heal: 0.5, shield: 0.25, cleanse: true } },
  ],
  // Mẫn công, thiêu đốt: cắn xé chồng Thiêu đốt, lao xa, bầy sói lửa, khóa mục tiêu yếu máu; tuyệt kỹ cào xé liên hoàn.
  liet_hoa_thuong_lang: [
    { name: "Lang Nha Liệt Diễm", desc: "Nanh lửa cắn nửa trước mặt, +20% chí mạng: Thiêu đốt 2 tầng", icon: "≋", cost: 45, cd: 9,
      area: "front", r: 60, dmg: 2.4, crit: 0.2, status: [{ s: "burn", n: 2 }] },
    { name: "Hỏa Lang Bôn Tập", desc: "Lao xa xuyên hàng hồn thú: Thiêu đốt 2 tầng, bất tử 0,5 giây", icon: "➤", cost: 50, cd: 12,
      area: "dash", r: 120, dmg: 2.8, inv: 0.5, status: [{ s: "burn", n: 2 }] },
    { name: "Liệt Hỏa Lang Quần", desc: "Gọi 5 sói lửa lao ra hình quạt, mỗi con Thiêu đốt 2 tầng", icon: "✶", cost: 60, cd: 16,
      area: "proj", r: 150, n: 5, spread: 70, dmg: 1.5, status: [{ s: "burn", n: 2 }] },
    { name: "Thương Lang Diệt Ảnh", desc: "Khóa hồn thú yếu máu nhất, lướt tới cắn 4 nhát (tới +100% khi mục tiêu ít máu, mỗi tầng Thiêu đốt thêm 30% công), +30% chí mạng", icon: "☽", cost: 70, cd: 20,
      area: "target", r: 130, pick: "low", dash: 110, n: 4, every: 0.1, dmg: 1.4, lowHp: 1, perStack: { s: "burn", dmg: 0.3 }, crit: 0.3, inv: 0.5 },
    { name: "Liệt Hỏa Thương Lang · Phần Thiên Phệ", desc: "Tuyệt kỹ: hóa sói lửa lướt tới cào xé mục tiêu 10 nhát, +30% chí mạng, mỗi nhát Thiêu đốt 1 tầng; nhát cuối Choáng 1,5 giây", icon: "✥", cost: 100, cd: 45,
      area: "target", r: 140, dash: 120, n: 10, every: 0.1, dmg: 0.9, crit: 0.3, inv: 1.2, glow: true, shake: true, ult: true,
      status: [{ s: "burn" }], finisher: [{ s: "stun", secs: 1.5 }] },
  ],
  // Khống chế, băng phong: bay lướt, băng vực đặt vào hồn thú, mưa lông vũ băng, đóng băng (Choáng) diện rộng; tuyệt kỹ đóng băng cả vùng.
  bang_phuong_hoang: [
    { name: "Băng Phượng Xuyên Vân", desc: "Bay lướt xuyên hàng hồn thú: Làm chậm 2 giây, bất tử 0,4 giây", icon: "➠", cost: 45, cd: 10,
      area: "dash", r: 110, dmg: 2.4, fly: 0.4, inv: 0.4, status: [{ s: "slow" }] },
    { name: "Huyền Băng Lãnh Vực", desc: "Băng vực đặt lên hồn thú gần nhất 3 giây: 6 nhát, Làm chậm, Dễ thương 4 giây; nhát cuối đóng băng (Choáng 1,5 giây)", icon: "❂", cost: 50, cd: 14,
      area: "around", at: 140, r: 90, n: 6, every: 0.5, dmg: 0.5, status: [{ s: "slow", secs: 1 }, { s: "vuln", secs: 4 }], finisher: [{ s: "stun", secs: 1.5 }] },
    { name: "Vạn Băng Phượng Vũ", desc: "12 lông vũ băng bắn vòng tròn, mỗi lông Làm chậm 2 giây", icon: "✶", cost: 60, cd: 16,
      area: "proj", r: 170, n: 12, spread: 360, dmg: 1.4, status: [{ s: "slow" }] },
    { name: "Cực Hàn Băng Phong", desc: "Hàn khí cực độ quanh thân: đóng băng (Choáng 2,5 giây), Dễ thương 6 giây", icon: "❄", cost: 70, cd: 20,
      area: "around", r: 130, dmg: 3.6, glow: true, status: [{ s: "stun", secs: 2.5 }, { s: "vuln", secs: 6 }] },
    { name: "Băng Phượng Hoàng · Băng Phong Thiên Địa", desc: "Tuyệt kỹ: bay lên rồi đóng băng cả vùng: Choáng 3,5 giây, Dễ thương 8 giây, Làm chậm 4 giây, bất tử 1 giây", icon: "❄", cost: 100, cd: 45,
      area: "around", r: 170, dmg: 5.5, fly: 0.6, inv: 1, glow: true, shake: true, ult: true,
      status: [{ s: "stun", secs: 3.5 }, { s: "vuln", secs: 8 }, { s: "slow", secs: 4 }] },
  ],
};
/**
 * Hồn kỹ của vòng có chỉ số `ring` (0..MAX_RINGS − 1) của võ hồn: vòng 1–4 từ skillsOf, vòng 5, 6, 8, 9, 10 từ VOHON_SKILLS_HIGH; null nếu
 * vòng đó không có hồn kỹ (vòng 7 là Chân Thân, hoặc võ hồn chưa có dữ liệu vòng 5–10).
 */
export function ringSkill(vohonId: string, ring: number): SkillDef | null {
  if (!Number.isInteger(ring) || ring < 0) return null;
  if (ring < 4) return skillsOf(vohonId)[ring] ?? null;
  const k = (HIGH_RINGS as readonly number[]).indexOf(ring + 1);
  return k >= 0 ? VOHON_SKILLS_HIGH[vohonId]?.[k] ?? null : null;
}
/** Chỉ số vòng có hồn kỹ đã mở (võ hồn có `rings` hồn hoàn): các lựa chọn khi xếp 4 ô mang theo. */
export const skillChoices = (vohonId: string, rings: number) =>
  Array.from({ length: Math.max(0, Math.min(rings, 10)) }, (_, i) => i).filter((i) => ringSkill(vohonId, i));
/** Kiểm tra dạng 4 ô mang theo client gửi: LOADOUT_SIZE số nguyên -1..9, không trùng (trừ ô trống -1). Không kiểm vòng đã mở. */
export function parseLoadout(x: unknown): number[] | null {
  if (!Array.isArray(x) || x.length !== LOADOUT_SIZE || !x.every((v) => Number.isInteger(v) && v >= -1 && v < 10)) return null;
  const used = x.filter((v) => v >= 0);
  return new Set(used).size === used.length ? [...x] : null;
}
/**
 * 4 ô mang theo của võ hồn (chỉ số vòng theo ô U / I / O / P, -1 = trống) từ dữ liệu đã lưu (`vohons.skills`); chưa lưu hoặc không hợp lệ
 * (ví dụ vòng không còn hồn kỹ) thì dùng DEFAULT_LOADOUT (vòng 1–4). Ô trỏ tới vòng chưa mở hiện "Khóa" như trước 8.1a.
 */
export function loadoutOf(vohonId: string, saved: readonly number[] | null | undefined): number[] {
  const l = parseLoadout(saved);
  return l && l.every((r) => r < 0 || ringSkill(vohonId, r)) ? l : [...DEFAULT_LOADOUT];
}

/** Chỉ số tăng khi Chân Thân: atk / def / spd / crit / mp như hiệu ứng có lợi cùng tên (BUFFS), `hp`: sinh lực tối đa (tỉ lệ). */
export type ChanThanStat = "atk" | "def" | "spd" | "crit" | "mp" | "hp";
/**
 * Võ Hồn Chân Thân (vòng 7). Biến hình `secs` giây: chỉ số `stats` (ở sức mạnh ×1, nhân buffPower theo số năm hồn hoàn vòng 7), tung `burst`
 * ngay lúc biến hình (sức mạnh skillPower / buffPower của vòng 7). Tốn `cost` hồn lực, hồi `cd` giây (riêng từng võ hồn, tính từ lúc biến
 * hình). Thuộc võ hồn: đổi võ hồn, võ hồn gục, đi cổng thì hết. Hình Chân Thân là bộ sprite riêng sau này (mục 5.11); hiện vẽ bằng code.
 * Từ 8.1b `field`: bán kính lãnh vực phượng hoàng (hiệu ứng có lợi `phoenix`) của hồn sư khi võ hồn này đang Chân Thân, thay
 * PHOENIX_FIELD_R (Tà Hỏa Phượng Hoàng: "lãnh vực phượng hoàng mạnh hơn"; độ mạnh % lấy từ `burst.self`).
 * Từ 8.1c `lei`: Phong Lôi Chi Lực (PHONG_LOI) tích gấp ngần ấy lần khi võ hồn này đang Chân Thân (Lam Điện Bá Vương Long: Lôi Động
 * Minh Thiên tự tung thường hơn trong lúc biến hình).
 * Từ 9.6 `skill`: hồn kỹ Chân Thân: trong lúc biến hình ô P (CHAN_THAN_SKILL_SLOT) tung hồn kỹ này thay hồn kỹ đang mang ở ô đó, hồi
 * chiêu riêng (PlayerState.ctCd, không đụng hồi chiêu ô P cũ); hết Chân Thân / đổi võ hồn thì ô P trở lại. Mạnh theo số năm hồn hoàn
 * vòng 7 như đòn biến hình; hệ số đặt mạnh hơn hồn kỹ vòng 9 của chính võ hồn đó khoảng 20%, cùng lối đánh (phụ trợ: hồi máu / khiên /
 * hiệu ứng có lợi; khống chế: khống chế diện rộng). Không phải hồn kỹ mang theo, không nhận sao (chỉ vòng 1–4), Phục Chế không chép.
 */
export interface ChanThanDef { name: string; desc: string; icon: string; cost: number; cd: number; secs: number;
  stats: Partial<Record<ChanThanStat, number>>; skill: SkillDef; burst?: SkillDef; field?: number; lei?: number; }
/** Client phóng hình hồn sư ngần ấy lần khi đang Chân Thân (chỉ hình ảnh). */
export const CHAN_THAN_SCALE = 1.35;
const ctBurst = (name: string, o: Partial<SkillDef>): SkillDef => ({ name, desc: "", icon: "", cost: 0, cd: 0, area: "around", r: 90, dmg: 0, ...o });
/** Hồn kỹ Chân Thân (9.6, đã chốt): ô P (chỉ số trong 4 ô mang theo), hồn lực và hồi chiêu chung của mọi võ hồn. */
export const CHAN_THAN_SKILL_SLOT = LOADOUT_SIZE - 1;
export const CHAN_THAN_SKILL_COST = 40;
export const CHAN_THAN_SKILL_CD = 8;
const ctSkill = (name: string, desc: string, icon: string, o: Omit<SkillDef, "name" | "desc" | "icon" | "cost" | "cd">): SkillDef =>
  ({ name, desc, icon, cost: CHAN_THAN_SKILL_COST, cd: CHAN_THAN_SKILL_CD, ...o });
export const CHAN_THAN: Record<string, ChanThanDef> = {
  lam_ngan_thao: { name: "Lam Ngân Hoàng Chân Thân", desc: "Hóa thân Lam Ngân Hoàng: kéo hồn thú quanh thân lại, Trói 2 giây; công +25%, sát thương nhận giảm 30%, tốc độ +10%, sinh lực tối đa +20%",
    icon: "❦", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, def: 0.3, spd: 0.1, hp: 0.2 },
    skill: ctSkill("Lam Ngân Hoàng Triền Thiên", "12 sợi Lam Ngân Hoàng bắn ra bốn phía, mỗi sợi Trói 2 giây, Trúng độc 1 tầng, Dễ thương 4 giây", "❦",
      { area: "proj", r: 160, n: 12, spread: 360, dmg: 1.9, status: [{ s: "root", secs: 2 }, { s: "poison" }, { s: "vuln", secs: 4 }] }),
    burst: ctBurst("Lam Ngân Hoàng Chân Thân", { r: 100, dmg: 2, pull: true, status: [{ s: "root", secs: 2 }] }) },
  hao_thien_chuy: { name: "Hạo Thiên Chùy Chân Thân", desc: "Hóa thân Hạo Thiên Chùy: nện đất quanh thân (thêm 5% sinh lực tối đa, Choáng 1 giây); công +40%, sát thương nhận giảm 20%, sinh lực tối đa +15%",
    icon: "⚒", cost: 80, cd: 90, secs: 15, stats: { atk: 0.4, def: 0.2, hp: 0.15 },
    skill: ctSkill("Hạo Thiên Diệt Thế Chùy", "Lao tới một mục tiêu, chùy Hạo Thiên giáng xuống: thêm 12% sinh lực tối đa, Phá giáp 3 tầng, Choáng 1 giây", "▲",
      { area: "target", r: 90, dash: 70, dmg: 7.8, pctHp: 0.12, glow: true, shake: true, status: [{ s: "armor", n: 3 }, { s: "stun", secs: 1 }] }),
    burst: ctBurst("Hạo Thiên Chùy Chân Thân", { r: 90, dmg: 3, pctHp: 0.05, shake: true, status: [{ s: "stun", secs: 1 }] }) },
  u_minh_linh_mieu: { name: "U Minh Linh Miêu Chân Thân", desc: "Hóa thân U Minh Linh Miêu: cào quanh thân (Phá giáp 2 tầng); công +25%, tốc độ +35%, chí mạng +20%",
    icon: "☾", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, spd: 0.35, crit: 0.2 },
    skill: ctSkill("U Minh Thần Trảo", "Lướt tới mục tiêu, cào 5 nhát, +45% chí mạng, mỗi nhát Phá giáp 1 tầng", "✥",
      { area: "target", r: 110, dash: 100, n: 5, every: 0.1, dmg: 1.7, crit: 0.45, inv: 0.5, status: [{ s: "armor" }] }),
    burst: ctBurst("U Minh Linh Miêu Chân Thân", { r: 70, dmg: 2, crit: 0.3, status: [{ s: "armor", n: 2 }] }) },
  bich_lan_xa_hoang: { name: "Bích Lân Xà Hoàng Chân Thân", desc: "Hóa thân Bích Lân Xà Hoàng: độc khí quanh thân (Trúng độc 3 tầng, Câm lặng 2 giây); công +25%, sát thương nhận giảm 25%, sinh lực tối đa +20%",
    icon: "☠", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, def: 0.25, hp: 0.2 },
    skill: ctSkill("Xà Hoàng Vạn Độc Phệ", "Xà Hoàng cắn xé quanh thân: mỗi tầng Trúng độc thêm 95% công, hút 50% sát thương, Câm lặng 2 giây", "☠",
      { area: "around", r: 110, dmg: 6, perStack: { s: "poison", dmg: 0.95 }, lifesteal: 0.5, glow: true, status: [{ s: "silence", secs: 2 }, { s: "poison", n: 2 }] }),
    burst: ctBurst("Bích Lân Xà Hoàng Chân Thân", { r: 90, dmg: 1.5, status: [{ s: "poison", n: 3 }, { s: "silence", secs: 2 }] }) },
  cuu_bao_luu_ly_thap: { name: "Cửu Bảo Lưu Ly Tháp Chân Thân", desc: "Hóa thân Cửu Bảo Lưu Ly Tháp: hồi 25% sinh lực cả đội, khiên 15%; công +15%, sát thương nhận giảm 35%, hồn kỹ tốn ít hơn 30%, sinh lực tối đa +15%",
    icon: "✷", cost: 80, cd: 90, secs: 15, stats: { atk: 0.15, def: 0.35, mp: 0.3, hp: 0.15 },
    skill: ctSkill("Thất Bảo Tề Quang", "Bảo quang Cửu Bảo Lưu Ly: công +42%, tốc độ +30%, sát thương nhận giảm 24% trong 10 giây", "✦",
      { area: "self", r: 0, dmg: 0, glow: true, self: { buff: { atk: 0.42, spd: 0.3, def: 0.24 }, secs: 10 } }),
    burst: ctBurst("Cửu Bảo Lưu Ly Tháp Chân Thân", { area: "self", r: 0, self: { heal: 0.25, shield: 0.15, secs: 15 } }) },
  // ---- Bước 8.1b: lưu phái Thiêu đốt (mọi số đã chốt) ----
  ta_hoa_phuong_hoang: { name: "Tà Hỏa Phượng Hoàng Chân Thân", desc: "Hóa thân Tà Hỏa Phượng Hoàng: bay lên rồi lao xuống quanh thân (Thiêu đốt 3 tầng), mở lãnh vực phượng hoàng 15 giây (+30%, rộng hơn: bán kính 130 khi đang Chân Thân); công +30%, tốc độ +15%, sinh lực tối đa +15%",
    icon: "♨", cost: 80, cd: 90, secs: 15, stats: { atk: 0.3, spd: 0.15, hp: 0.15 }, field: 130,
    skill: ctSkill("Phượng Hoàng Hỏa Vũ", "Mưa lửa phượng hoàng quanh thân: Thiêu đốt 3 tầng", "♨",
      { area: "around", r: 130, dmg: 5.4, glow: true, shake: true, status: [{ s: "burn", n: 3 }] }),
    burst: ctBurst("Tà Hỏa Phượng Hoàng Chân Thân", { r: 130, dmg: 2.5, fly: 0.5, shake: true, status: [{ s: "burn", n: 3 }], self: { buff: { phoenix: 0.3 }, secs: 15 } }) }, // Chân Thân chỉ rộng hơn, không mạnh hơn (đã chốt 2026-10-20; trước đó 0,35)
  hoa_long: { name: "Hỏa Long Chân Thân", desc: "Hóa thân Hỏa Long: Viêm bạo quanh thân (kích nổ Thiêu đốt rồi đặt lại 1 tầng); công +25%, tốc độ +20%, chí mạng +15%",
    icon: "✹", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, spd: 0.2, crit: 0.15 },
    skill: ctSkill("Hỏa Long Thôn Thiên", "Hỏa Long nuốt trời: Viêm bạo quanh thân (kích nổ Thiêu đốt rồi đặt lại 2 tầng)", "✹",
      { area: "around", r: 130, dmg: 4.2, glow: true, shake: true, boom: { keep: 2 } }),
    burst: ctBurst("Hỏa Long Chân Thân", { r: 120, dmg: 2, shake: true, boom: { keep: 1 } }) },
  hoa_anh: { name: "Hỏa Ảnh Chân Thân", desc: "Hóa thân Hỏa Ảnh: bóng lửa nổ quanh thân, đẩy lùi (Choáng 1,5 giây, Dễ thương 6 giây, Thiêu đốt 1 tầng); công +20%, sát thương nhận giảm 30%, sinh lực tối đa +20%",
    icon: "✸", cost: 80, cd: 90, secs: 15, stats: { atk: 0.2, def: 0.3, hp: 0.2 },
    skill: ctSkill("Hỏa Ảnh Thiên Phạt", "Bóng lửa nổ quanh thân, đẩy lùi: Choáng 2 giây, Thiêu đốt 3 tầng", "✸",
      { area: "around", r: 120, dmg: 6.6, push: 60, shake: true, status: [{ s: "stun", secs: 2 }, { s: "burn", n: 3 }] }),
    burst: ctBurst("Hỏa Ảnh Chân Thân", { r: 100, dmg: 1.8, push: 50, status: [{ s: "stun", secs: 1.5 }, { s: "vuln", secs: 6 }, { s: "burn" }] }) },
  ky_nhung_thong_thien_cuc: { name: "Kỳ Nhung Thông Thiên Cúc Chân Thân", desc: "Hóa thân Kỳ Nhung Thông Thiên Cúc: bão cánh hoa 4 nhát quanh thân (Thiêu đốt và Phá giáp); công +30%, tốc độ +15%, hồn kỹ tốn ít hơn 20%",
    icon: "✾", cost: 80, cd: 90, secs: 15, stats: { atk: 0.3, spd: 0.15, mp: 0.2 },
    skill: ctSkill("Thông Thiên Cúc Vũ", "Lướt tới mục tiêu, 4 nhát cánh hoa: mỗi tầng Phá giáp thêm 35% công, mỗi nhát Phá giáp 1 tầng", "✾",
      { area: "target", r: 130, dash: 100, n: 4, every: 0.15, dmg: 1.55, perStack: { s: "armor", dmg: 0.35 }, glow: true, status: [{ s: "armor" }] }),
    burst: ctBurst("Kỳ Nhung Thông Thiên Cúc Chân Thân", { r: 90, n: 4, every: 0.3, dmg: 0.8, status: [{ s: "burn" }, { s: "armor" }] }) },
  nguyet_nhan: { name: "Nguyệt Nhận Chân Thân", desc: "Hóa thân Nguyệt Nhận: trăng máu quét quanh thân (Phá giáp 2 tầng, Thiêu đốt 1 tầng); công +25%, tốc độ +30%, chí mạng +25%",
    icon: "☽", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, spd: 0.3, crit: 0.25 },
    skill: ctSkill("Huyết Nguyệt Đoạt Hồn", "Khóa hồn thú yếu máu nhất, lướt tới chém 4 nhát (tới +150% khi mục tiêu ít máu), +35% chí mạng, Thiêu đốt", "☽",
      { area: "target", r: 170, pick: "low", dash: 160, n: 4, every: 0.1, dmg: 2.15, lowHp: 1.5, crit: 0.35, inv: 0.5, status: [{ s: "burn" }] }),
    burst: ctBurst("Nguyệt Nhận Chân Thân", { r: 80, dmg: 2, crit: 0.3, status: [{ s: "armor", n: 2 }, { s: "burn" }] }) },
  // ---- Bước 8.1c: lưu phái Cảm điện (mọi số đã chốt) ----
  lam_dien_ba_vuong_long: { name: "Lam Điện Bá Vương Long Chân Thân", desc: "Hóa thân Lam Điện Bá Vương Long: sấm sét nổ quanh thân (hồn thú Cảm điện thêm 100% công, Cảm điện); Phong Lôi Chi Lực tích gấp đôi; công +35%, sát thương nhận giảm 15%, sinh lực tối đa +15%",
    icon: "ϟ", cost: 80, cd: 90, secs: 15, stats: { atk: 0.35, def: 0.15, hp: 0.15 }, lei: 2,
    skill: ctSkill("Bá Vương Lôi Thần Nộ", "Sấm sét Bá Vương Long nổ quanh thân: hồn thú Cảm điện thêm 240% công, Cảm điện", "ϟ",
      { area: "around", r: 140, dmg: 5.4, perStack: { s: "shock", dmg: 2.4 }, glow: true, shake: true, status: [{ s: "shock" }] }),
    burst: ctBurst("Lam Điện Bá Vương Long Chân Thân", { r: 110, dmg: 2.2, perStack: { s: "shock", dmg: 1 }, shake: true, status: [{ s: "shock" }] }) },
  kim_vu_mieu_ung: { name: "Kim Vũ Miêu Ưng Chân Thân", desc: "Hóa thân Kim Vũ Miêu Ưng: bay lên giáng sét quanh thân (Cảm điện 8 giây); công +25%, tốc độ +35%, chí mạng +20%",
    icon: "☈", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, spd: 0.35, crit: 0.2 },
    skill: ctSkill("Kim Vũ Thiên Lôi", "12 lông vũ sét bắn ra bốn phía, mỗi chiếc Cảm điện 8 giây", "☈",
      { area: "proj", r: 180, n: 12, spread: 360, dmg: 1.8, glow: true, status: [{ s: "shock", secs: 8 }] }),
    burst: ctBurst("Kim Vũ Miêu Ưng Chân Thân", { r: 120, dmg: 2, fly: 0.5, status: [{ s: "shock", secs: 8 }] }) },
  can_khon_hon_nguyen_toa: { name: "Càn Khôn Hỗn Nguyên Tỏa Chân Thân", desc: "Hóa thân Càn Khôn Hỗn Nguyên Tỏa: kéo hồn thú quanh thân lại và phong tỏa (Phong ấn đủ 3 tầng: Dễ thương 6,8 giây, Trói 2 giây, Cảm điện); công +20%, sát thương nhận giảm 30%, sinh lực tối đa +20%",
    icon: "▣", cost: 80, cd: 90, secs: 15, stats: { atk: 0.2, def: 0.3, hp: 0.2 },
    skill: ctSkill("Càn Khôn Phong Thiên", "Kéo hồn thú quanh thân lại và phong tỏa: Phong ấn 2 tầng, Choáng 1,5 giây, Cảm điện", "▣",
      { area: "around", r: 120, dmg: 6, pull: true, shake: true, status: [{ s: "lock", n: 2 }, { s: "stun", secs: 1.5 }, { s: "shock" }] }),
    burst: ctBurst("Càn Khôn Hỗn Nguyên Tỏa Chân Thân", { r: 100, dmg: 1.8, pull: true, status: [{ s: "lock", n: 3 }, { s: "root", secs: 2 }, { s: "shock" }] }) },
  yeu_ho: { name: "Yêu Hồ Chân Thân", desc: "Hóa thân Yêu Hồ: mị thuật quanh thân (Mị hoặc 2 tầng, Làm chậm 3 giây, Cảm điện); công +25%, tốc độ +25%, sát thương nhận giảm 20%",
    icon: "✾", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, spd: 0.25, def: 0.2 },
    skill: ctSkill("Thiên Hồ Mị Thế", "Mị thuật Thiên Hồ quanh thân: Câm lặng 3 giây, Mị hoặc 2 tầng, Cảm điện", "✾",
      { area: "around", r: 120, dmg: 6.6, glow: true, status: [{ s: "silence", secs: 3 }, { s: "allure", n: 2 }, { s: "shock" }] }),
    burst: ctBurst("Yêu Hồ Chân Thân", { r: 110, dmg: 1.8, status: [{ s: "allure", n: 2 }, { s: "slow", secs: 3 }, { s: "shock" }] }) },
  xuc_xich: { name: "Xúc Xích Chân Thân", desc: "Hóa thân Xúc Xích: hồi 25% sinh lực cả đội, 30% hồn lực, thanh tẩy; sát thương nhận giảm 25%, hồn kỹ tốn ít hơn 30%, tốc độ +20%, sinh lực tối đa +15%",
    icon: "✚", cost: 80, cd: 90, secs: 15, stats: { def: 0.25, mp: 0.3, spd: 0.2, hp: 0.15 },
    skill: ctSkill("Thánh Quang Đại Hương Tràng", "Đại hương tràng thánh quang: hồi 30% sinh lực cả đội, 15% hồn lực, thanh tẩy", "✚",
      { area: "self", r: 0, dmg: 0, glow: true, self: { heal: 0.3, mp: 0.15, cleanse: true } }),
    burst: ctBurst("Xúc Xích Chân Thân", { area: "self", r: 0, self: { heal: 0.25, mp: 0.3, cleanse: true } }) },
  // ---- Bước 8.1d: 5 võ hồn còn lại (mọi số đã chốt) ----
  cuu_tinh_that_sat_kiem: { name: "Cửu Tinh Thất Sát Kiếm Chân Thân", desc: "Hóa thân kiếm: kiếm khí nổ quanh thân (Phá giáp đủ 3 tầng); công +35%, chí mạng +15%, tốc độ +10%",
    icon: "⚔", cost: 80, cd: 90, secs: 15, stats: { atk: 0.35, crit: 0.15, spd: 0.1 },
    skill: ctSkill("Thất Sát Phá Thiên Kiếm", "Lao tới một mục tiêu, nhân kiếm hợp nhất: mỗi tầng Phá giáp thêm 70% công, Phá giáp 2 tầng", "⚔",
      { area: "target", r: 120, dash: 100, dmg: 7.2, perStack: { s: "armor", dmg: 0.7 }, glow: true, shake: true, status: [{ s: "armor", n: 2 }] }),
    burst: ctBurst("Cửu Tinh Thất Sát Kiếm Chân Thân", { r: 100, dmg: 2.2, shake: true, status: [{ s: "armor", n: 3 }] }) },
  nhu_cot_tho: { name: "Nhu Cốt Thố Chân Thân", desc: "Hóa thân thỏ mười vạn năm: quật quanh thân (+30% chí mạng, hút 20%, Choáng 1 giây); công +25%, tốc độ +30%, chí mạng +25%",
    icon: "➰", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, spd: 0.3, crit: 0.25 },
    skill: ctSkill("Thỏ Hoàng Bạo Sát", "Lướt tới mục tiêu, quật 6 nhát, +45% chí mạng, nhát cuối Choáng 1,5 giây", "➰",
      { area: "target", r: 110, dash: 100, n: 6, every: 0.1, dmg: 1.2, crit: 0.45, inv: 0.7, finisher: [{ s: "stun", secs: 1.5 }] }),
    burst: ctBurst("Nhu Cốt Thố Chân Thân", { r: 80, dmg: 2, crit: 0.3, lifesteal: 0.2, status: [{ s: "stun", secs: 1 }] }) },
  tu_vong_chu_hoang: { name: "Tử Vong Chu Hoàng Chân Thân", desc: "Hóa thân Chu Hoàng: tơ kéo hồn thú quanh thân lại (Trói 2 giây, Trúng độc 2 tầng, Cảm điện); công +25%, sát thương nhận giảm 25%, sinh lực tối đa +20%",
    icon: "✳", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, def: 0.25, hp: 0.2 },
    skill: ctSkill("Chu Hoàng Thiên La Võng", "Lưới tơ Chu Hoàng kéo hồn thú quanh thân lại: Trói 2,5 giây, Trúng độc 2 tầng, Cảm điện", "✳",
      { area: "around", r: 130, dmg: 5.8, pull: true, glow: true, status: [{ s: "root", secs: 2.5 }, { s: "poison", n: 2 }, { s: "shock" }] }),
    burst: ctBurst("Tử Vong Chu Hoàng Chân Thân", { r: 110, dmg: 1.8, pull: true, status: [{ s: "root", secs: 2 }, { s: "poison", n: 2 }, { s: "shock" }] }) },
  quy_mi: { name: "Quỷ Mị Chân Thân", desc: "Hóa thân quỷ: quỷ khí quanh thân (hút 30%), hút huyết 30% trong 15 giây (cả đội); công +30%, chí mạng +15%, tốc độ +15%",
    icon: "☾", cost: 80, cd: 90, secs: 15, stats: { atk: 0.3, crit: 0.15, spd: 0.15 },
    skill: ctSkill("Bách Quỷ Phệ Hồn", "Bách quỷ cắn xé quanh thân: hút 35% sát thương, Dễ thương 8 giây; công +42% trong 10 giây (cả đội)", "☾",
      { area: "around", r: 120, dmg: 3.6, lifesteal: 0.35, glow: true, status: [{ s: "vuln", secs: 8 }], self: { buff: { atk: 0.42 }, secs: 10 } }),
    burst: ctBurst("Quỷ Mị Chân Thân", { r: 90, dmg: 1.5, lifesteal: 0.3, self: { buff: { leech: 0.3 }, secs: 15 } }) },
  thien_can_bach_ngoc_dinh: { name: "Thiên Càn Bạch Ngọc Đỉnh Chân Thân", desc: "Hóa thân đỉnh ngọc: trấn áp quanh thân (Dễ thương 6 giây, xóa hiệu ứng có lợi của hồn thú), hồi 25% sinh lực cả đội, khiên 20%, thanh tẩy; công +15%, sát thương nhận giảm 35%, hồn kỹ tốn ít hơn 20%, sinh lực tối đa +25%",
    icon: "✚", cost: 80, cd: 90, secs: 15, stats: { atk: 0.15, def: 0.35, mp: 0.2, hp: 0.25 },
    skill: ctSkill("Càn Khôn Ngọc Đỉnh Hộ Thế", "Đỉnh ngọc hộ thế: hồi 40% sinh lực cả đội, khiên 30% sinh lực tối đa, sát thương nhận giảm 30% trong 8 giây, thanh tẩy", "✚",
      { area: "self", r: 0, dmg: 0, glow: true, self: { buff: { def: 0.3 }, secs: 8, heal: 0.4, shield: 0.3, cleanse: true } }),
    burst: ctBurst("Thiên Càn Bạch Ngọc Đỉnh Chân Thân", { r: 100, dmg: 1.2, dispel: true, status: [{ s: "vuln", secs: 6 }], self: { heal: 0.25, shield: 0.2, secs: 15, cleanse: true } }) },
  // ---- Bước 8.3: 4 võ hồn ngoài danh sách SSR cơ bản (mọi số đã chốt) ----
  pha_hon_thuong: { name: "Phá Hồn Thương Chân Thân", desc: "Hóa thân thần thương: thương mang nổ quanh thân (Phá giáp đủ 3 tầng, Câm lặng 2 giây); công +35%, chí mạng +15%, tốc độ +15%",
    icon: "⚔", cost: 80, cd: 90, secs: 15, stats: { atk: 0.35, crit: 0.15, spd: 0.15 },
    skill: ctSkill("Phá Hồn Xuyên Thiên", "Thương mang lướt xuyên hàng hồn thú: mỗi tầng Phá giáp thêm 60% công, Phá giáp 3 tầng", "➹",
      { area: "dash", r: 150, dmg: 6, perStack: { s: "armor", dmg: 0.6 }, inv: 0.6, shake: true, status: [{ s: "armor", n: 3 }] }),
    burst: ctBurst("Phá Hồn Thương Chân Thân", { r: 100, dmg: 2.2, shake: true, status: [{ s: "armor", n: 3 }, { s: "silence", secs: 2 }] }) },
  a_ngan: { name: "A Ngân Chân Thân", desc: "Hóa thân Lam Ngân Hoàng mười vạn năm: kéo hồn thú quanh thân lại (Trói 2 giây), hồi 25% sinh lực cả đội, khiên 15%; công +15%, sát thương nhận giảm 30%, hồn kỹ tốn ít hơn 20%, sinh lực tối đa +25%",
    icon: "✿", cost: 80, cd: 90, secs: 15, stats: { atk: 0.15, def: 0.3, mp: 0.2, hp: 0.25 },
    skill: ctSkill("Lam Ngân Hoàng Thánh Quang", "Thánh quang Lam Ngân Hoàng: hồi 25% sinh lực cả đội, khiên 18%, công +36%, sát thương nhận giảm 24% trong 10 giây", "✿",
      { area: "self", r: 0, dmg: 0, glow: true, self: { buff: { atk: 0.36, def: 0.24 }, secs: 10, heal: 0.25, shield: 0.18 } }),
    burst: ctBurst("A Ngân Chân Thân", { r: 100, dmg: 1.5, pull: true, status: [{ s: "root", secs: 2 }], self: { heal: 0.25, shield: 0.15, secs: 15 } }) },
  liet_hoa_thuong_lang: { name: "Liệt Hỏa Thương Lang Chân Thân", desc: "Hóa thân sói lửa: cào lửa quanh thân (+30% chí mạng, Thiêu đốt 3 tầng); công +25%, tốc độ +35%, chí mạng +20%",
    icon: "✥", cost: 80, cd: 90, secs: 15, stats: { atk: 0.25, spd: 0.35, crit: 0.2 },
    skill: ctSkill("Thương Lang Liệt Hỏa Phệ", "Khóa hồn thú yếu máu nhất, lướt tới cào lửa 4 nhát (tới +100% khi mục tiêu ít máu, mỗi tầng Thiêu đốt thêm 35% công), +35% chí mạng", "✥",
      { area: "target", r: 140, pick: "low", dash: 120, n: 4, every: 0.1, dmg: 1.7, lowHp: 1, perStack: { s: "burn", dmg: 0.35 }, crit: 0.35, inv: 0.5, status: [{ s: "burn" }] }),
    burst: ctBurst("Liệt Hỏa Thương Lang Chân Thân", { r: 80, dmg: 2, crit: 0.3, status: [{ s: "burn", n: 3 }] }) },
  bang_phuong_hoang: { name: "Băng Phượng Hoàng Chân Thân", desc: "Hóa thân Băng Phượng Hoàng: bay lên giáng băng quanh thân (đóng băng: Choáng 1,5 giây, Làm chậm 3 giây); công +20%, sát thương nhận giảm 25%, tốc độ +15%, sinh lực tối đa +20%",
    icon: "❄", cost: 80, cd: 90, secs: 15, stats: { atk: 0.2, def: 0.25, spd: 0.15, hp: 0.2 },
    skill: ctSkill("Băng Phượng Cực Hàn Vực", "Băng vực phượng hoàng quanh thân: đóng băng (Choáng 2,5 giây), Làm chậm 3 giây, Dễ thương 6 giây", "❄",
      { area: "around", r: 140, dmg: 4.3, glow: true, status: [{ s: "stun", secs: 2.5 }, { s: "slow", secs: 3 }, { s: "vuln", secs: 6 }] }),
    burst: ctBurst("Băng Phượng Hoàng Chân Thân", { r: 110, dmg: 1.8, fly: 0.5, status: [{ s: "stun", secs: 1.5 }, { s: "slow", secs: 3 }] }) },
};
export const chanThanOf = (vohonId: string): ChanThanDef | null => CHAN_THAN[vohonId] ?? null;
/** Bán kính lãnh vực phượng hoàng của hồn sư có võ hồn ra trận `vohonId`, `ava` = đang Chân Thân (8.1b; server tính trúng, client vẽ). */
export const phoenixFieldR = (vohonId: string, ava: boolean) => (ava ? chanThanOf(vohonId)?.field : undefined) ?? PHOENIX_FIELD_R;
/** Chỉ số tăng thật khi Chân Thân với hồn hoàn vòng 7 `years` năm (× buffPower, như hiệu ứng có lợi của hồn kỹ phụ trợ). */
export function chanThanStats(def: ChanThanDef, years: number): Partial<Record<ChanThanStat, number>> {
  const k = buffPower(years);
  return Object.fromEntries(Object.entries(def.stats).map(([s, v]) => [s, +(v * k).toFixed(4)]));
}

/**
 * Chiêu tiên cơ riêng (bước 2.5a, nâng từ tiên cơ chung theo hệ của 2.4 cho 5 võ hồn mẫu; 2.5b thêm 5 võ hồn Thiêu đốt, 2.5c thêm 5 võ hồn Cảm điện, 2.5d thêm 5 võ hồn còn lại; đã chốt). Chạy bằng cùng bộ máy
 * hồn kỹ với sức mạnh 1 × tienCoDmgMult, không tốn hồn lực, không tạo năng lượng. Võ hồn chưa có trong bảng dùng TIEN_CO theo hệ.
 */
export const TIEN_CO_RIENG: Record<string, SkillDef> = {
  lam_ngan_thao: { name: "Lam Ngân Phong Tỏa", desc: "kéo hồn thú quanh thân lại, trói và gây Dễ thương", icon: "⌘", cost: 0, cd: 0,
    area: "around", r: 64, dmg: 1.2, pull: true, status: [{ s: "root" }, { s: "vuln", secs: 4 }] },
  hao_thien_chuy: { name: "Hạo Thiên Giáng Thế", desc: "nện chùy diện rộng, thêm 4% sinh lực tối đa, hất tung", icon: "⚒", cost: 0, cd: 0,
    area: "around", r: 60, dmg: 3, pctHp: 0.04, shake: true, status: [{ s: "stun", secs: 0.8 }] },
  u_minh_linh_mieu: { name: "U Minh Thiểm Trảo", desc: "lướt tới hồn thú gần nhất, cào 5 nhát, +30% chí mạng", icon: "✥", cost: 0, cd: 0,
    area: "target", r: 110, dash: 90, n: 5, every: 0.1, dmg: 1, crit: 0.3, inv: 0.35 },
  bich_lan_xa_hoang: { name: "Xà Hoàng Độc Vực", desc: "độc vực quanh thân: Trúng độc 3 tầng, Câm lặng 2 giây", icon: "☠", cost: 0, cd: 0,
    area: "around", r: 64, dmg: 1, status: [{ s: "poison", n: 3 }, { s: "silence", secs: 2 }] },
  // Tên trước 2026-10-20 là Vô Địch Thần Quang; đổi vì tuyệt kỹ vòng 10 mang tên đó (đã chốt).
  cuu_bao_luu_ly_thap: { name: "Lưu Ly Hộ Thể", desc: "cả đội miễn sát thương 2,5 giây, hồi 20% sinh lực", icon: "✷", cost: 0, cd: 0,
    area: "self", r: 0, dmg: 0, self: { buff: { inv: 1 }, secs: 2.5, heal: 0.2 } },
  // Bước 2.5b: lưu phái Thiêu đốt.
  ta_hoa_phuong_hoang: { name: "Phượng Hoàng Tiếu Thiên Kích", desc: "bay lên rồi lao xuống, Thiêu đốt 3 tầng quanh thân, mở lãnh vực phượng hoàng 5 giây", icon: "♨", cost: 0, cd: 0,
    area: "around", r: 72, dmg: 2.2, fly: 0.5, shake: true, status: [{ s: "burn", n: 3 }], self: { buff: { phoenix: 0.3 }, secs: 5 } },
  hoa_long: { name: "Long Viêm Bạo", desc: "kích nổ (Viêm bạo) mọi tầng Thiêu đốt quanh thân, rồi đặt lại 1 tầng", icon: "✹", cost: 0, cd: 0,
    area: "around", r: 100, dmg: 1.2, shake: true, boom: { keep: 1 } },
  hoa_anh: { name: "Hỏa Ảnh Trùng Trùng", desc: "bóng lửa vây quanh: Choáng 1,5 giây, Dễ thương 5 giây, Thiêu đốt 1 tầng", icon: "✸", cost: 0, cd: 0,
    area: "around", r: 72, dmg: 1.2, status: [{ s: "stun" }, { s: "vuln" }, { s: "burn" }] },
  ky_nhung_thong_thien_cuc: { name: "Cúc Hoa Phong Bạo", desc: "bão cánh hoa 4 nhát quanh thân, mỗi nhát Thiêu đốt 1 tầng, nhát cuối Trói", icon: "✾", cost: 0, cd: 0,
    area: "around", r: 64, n: 4, every: 0.3, dmg: 0.8, status: [{ s: "burn" }], finisher: [{ s: "root", secs: 1.5 }] },
  nguyet_nhan: { name: "Nguyệt Nhận Đoạt Mệnh", desc: "khóa hồn thú yếu máu nhất, lướt tới chém 3 nhát (tới +150% khi mục tiêu ít máu)", icon: "☽", cost: 0, cd: 0,
    area: "target", r: 130, pick: "low", dash: 110, n: 3, every: 0.1, dmg: 1.3, lowHp: 1.5, inv: 0.35 },
  // Bước 2.5c: lưu phái Cảm điện.
  lam_dien_ba_vuong_long: { name: "Lam Điện Lôi Bạo", desc: "sấm sét nổ quanh thân, hồn thú đang Cảm điện chịu thêm 150% công (kích nổ Cảm điện)", icon: "ϟ", cost: 0, cd: 0,
    area: "around", r: 110, dmg: 1.5, perStack: { s: "shock", dmg: 1.5 }, shake: true, status: [{ s: "shock" }] },
  kim_vu_mieu_ung: { name: "Kim Ưng Giáng Lôi", desc: "bay lên rồi giáng sét quanh thân: Cảm điện 8 giây, Câm lặng 2 giây", icon: "☈", cost: 0, cd: 0,
    area: "around", r: 100, dmg: 1.4, fly: 0.5, status: [{ s: "shock", secs: 8 }, { s: "silence", secs: 2 }] },
  can_khon_hon_nguyen_toa: { name: "Càn Khôn Đại Phong Tỏa", desc: "phong tỏa quanh thân: Phong ấn đủ 3 tầng (Dễ thương 6,8 giây), Trói 2 giây, Cảm điện", icon: "▣", cost: 0, cd: 0,
    area: "around", r: 72, dmg: 1.2, status: [{ s: "lock", n: 3 }, { s: "root" }, { s: "shock" }] },
  yeu_ho: { name: "Hồ Mị Thiên Hạ", desc: "mị thuật quanh thân: Mị hoặc đủ 3 tầng (Mê hoặc ngay), Làm chậm 3 giây", icon: "✾", cost: 0, cd: 0,
    area: "around", r: 80, dmg: 1.2, status: [{ s: "allure", n: 3 }, { s: "slow", secs: 3 }] },
  xuc_xich: { name: "Thanh Tâm Hương Tràng", desc: "hồi 20% sinh lực cả đội, 25% hồn lực, khiên 12% sinh lực, giải khống chế", icon: "✚", cost: 0, cd: 0,
    area: "self", r: 0, dmg: 0, self: { heal: 0.2, mp: 0.25, shield: 0.12, secs: 5, cleanse: true } },
  // Bước 2.5d: 5 võ hồn còn lại.
  cuu_tinh_that_sat_kiem: { name: "Thất Sát Kiếm Vực", desc: "kiếm khí nổ quanh thân, Liệt thương: Phá giáp đủ 3 tầng", icon: "⚔", cost: 0, cd: 0,
    area: "around", r: 72, dmg: 2.2, shake: true, status: [{ s: "armor", n: 3 }] },
  nhu_cot_tho: { name: "Nhu Cốt Thuấn Suất", desc: "thuấn di tới hồn thú gần nhất, quật 3 đoạn, +30% chí mạng, hút 30% sát thương, đoạn cuối quật ngã", icon: "➰", cost: 0, cd: 0,
    area: "target", r: 110, dash: 90, n: 3, every: 0.12, dmg: 1.4, crit: 0.3, lifesteal: 0.3, inv: 0.35, finisher: [{ s: "stun", secs: 0.8 }] },
  tu_vong_chu_hoang: { name: "Chu Hoàng Thiên Võng", desc: "giăng tơ kéo hồn thú quanh thân lại: Trói 2 giây, Trúng độc 2 tầng, Cảm điện", icon: "✳", cost: 0, cd: 0,
    area: "around", r: 80, dmg: 1.2, pull: true, status: [{ s: "root" }, { s: "poison", n: 2 }, { s: "shock" }] },
  quy_mi: { name: "Quỷ Ảnh Mê Tung", desc: "cả đội tàng hình 4 giây, 25% sát thương gây ra hồi thành sinh lực", icon: "☾", cost: 0, cd: 0,
    area: "self", r: 0, dmg: 0, self: { buff: { hide: 1, leech: 0.25 }, secs: 4 } },
  // Từ 3.5 thanh tẩy đội: giải mọi trạng thái trên hồn sư (do chiêu báo trước của hồn thú gây), như Xúc Xích.
  thien_can_bach_ngoc_dinh: { name: "Bạch Ngọc Thánh Quang", desc: "hồi 20% sinh lực cả đội, khiên 18% sinh lực tối đa 6 giây, thanh tẩy", icon: "✚", cost: 0, cd: 0,
    area: "self", r: 0, dmg: 0, self: { heal: 0.2, shield: 0.18, secs: 6, cleanse: true } },
  // Bước 8.3: 4 võ hồn ngoài danh sách SSR cơ bản.
  pha_hon_thuong: { name: "Phá Hồn Xuyên Tâm", desc: "lướt đâm xuyên hàng hồn thú: Phá giáp 2 tầng, phá hồn (Câm lặng 1,5 giây)", icon: "➹", cost: 0, cd: 0,
    area: "dash", r: 100, dmg: 2.4, inv: 0.35, shake: true, status: [{ s: "armor", n: 2 }, { s: "silence", secs: 1.5 }] },
  a_ngan: { name: "Lam Ngân Hoàng Ân", desc: "Lam Ngân kéo hồn thú quanh thân lại (Trói 2 giây), hồi 20% sinh lực cả đội", icon: "✿", cost: 0, cd: 0,
    area: "around", r: 72, dmg: 1, pull: true, status: [{ s: "root" }], self: { heal: 0.2 } },
  liet_hoa_thuong_lang: { name: "Liệt Hỏa Lang Tập", desc: "lao tới hồn thú gần nhất cắn 3 nhát, mỗi nhát Thiêu đốt 1 tầng", icon: "≋", cost: 0, cd: 0,
    area: "target", r: 110, dash: 90, n: 3, every: 0.1, dmg: 1.2, inv: 0.35, status: [{ s: "burn" }] },
  bang_phuong_hoang: { name: "Băng Phượng Lâm Thế", desc: "bay lên rồi giáng băng quanh thân: đóng băng (Choáng 1,5 giây), Làm chậm 3 giây", icon: "❄", cost: 0, cd: 0,
    area: "around", r: 90, dmg: 1.2, fly: 0.5, status: [{ s: "stun" }, { s: "slow", secs: 3 }] },
};

/**
 * Ràng buộc (mục 5.1, đã chốt; 2.5d hai cặp ví dụ, 9.4 đủ bảng): hai võ hồn cùng trong đội (ô bất kỳ, kể cả đang gục) thì hồn sư có
 * thêm hiệu ứng, võ hồn nào ra trận cũng hưởng; cùng loại hiệu ứng từ nhiều cặp thì cộng (`bondSum`). Loại hiệu ứng (`BondKey`):
 * - `crit`: cộng tỉ lệ chí mạng mọi đòn trực tiếp.
 * - `burn`: Thiêu đốt do hồn sư gây mạnh thêm tỉ lệ này (tính lúc gây, như tăng công).
 * - `skill` (9.4): sức mạnh hồn kỹ ô U / I / O / P (mọi vòng) nhân thêm (1 + tỉ lệ), cả sát thương lẫn mức hiệu ứng (như sao 9.5).
 * - `heal` (9.4): hồi máu và khiên do hồn sư tạo (hồn kỹ, tiên cơ, Chân Thân; cả phần lan cho tổ đội) mạnh thêm, cộng với bộ hồn hạch
 *   Lưu Ly; không tính hút máu / hút huyết và đan.
 * - `stunBurn` (9.4): mọi sát thương hồn sư gây lên hồn thú đang Choáng hoặc Thiêu đốt (do bất kỳ ai gây) mạnh thêm (cộng như Dễ thương).
 * - `atk` (9.4): công +tỉ lệ (cộng với hiệu ứng tăng công, như bị động hồn cốt).
 */
export type BondKey = "crit" | "burn" | "skill" | "heal" | "stunBurn" | "atk";
export const BOND_KEYS: BondKey[] = ["crit", "burn", "skill", "heal", "stunBurn", "atk"];
export interface BondDef { name: string; pair: [string, string]; desc: string; crit?: number; burn?: number; skill?: number; heal?: number; stunBurn?: number; atk?: number; }
export const BONDS: BondDef[] = [
  { name: "Hạo Thiên – Nhu Cốt", pair: ["hao_thien_chuy", "nhu_cot_tho"], desc: "chí mạng +10%", crit: 0.1 },
  { name: "Tà Hỏa – Hỏa Ảnh", pair: ["ta_hoa_phuong_hoang", "hoa_anh"], desc: "Thiêu đốt mạnh thêm 20%", burn: 0.2 },
  { name: "Song Sinh Võ Hồn", pair: ["lam_ngan_thao", "hao_thien_chuy"], desc: "sức mạnh hồn kỹ +8%", skill: 0.08 },
  { name: "Lam Ngân Hoàng", pair: ["a_ngan", "lam_ngan_thao"], desc: "hồi máu và khiên +15%", heal: 0.15 },
  { name: "Băng Hỏa Lưỡng Nghi", pair: ["bang_phuong_hoang", "hoa_long"], desc: "sát thương lên hồn thú đang Choáng hoặc Thiêu đốt +12%", stunBurn: 0.12 },
  { name: "Thất Bảo Lưu Ly Tông", pair: ["cuu_bao_luu_ly_thap", "cuu_tinh_that_sat_kiem"], desc: "công +8%", atk: 0.08 },
];
/** Ràng buộc đang có của một đội (danh sách mã võ hồn trong đội). */
export const bondsOf = (vohonIds: string[]) => BONDS.filter((b) => b.pair.every((v) => vohonIds.includes(v)));
/** Tổng hiệu ứng loại `k` của mọi ràng buộc đang có trong đội (9.4: cùng loại từ nhiều cặp thì cộng). */
export const bondSum = (vohonIds: string[], k: BondKey) => bondsOf(vohonIds).reduce((a, b) => a + (b[k] ?? 0), 0);

/**
 * Võ Hồn Dung Hợp Kỹ (#192, mục 5.9; chủ repo chốt 2026-10-22 ở #178): chiêu chủ động của HAI hồn sư cùng tổ đội, mỗi người đang ra
 * trận một võ hồn của một cặp trong FUSIONS, đứng cách nhau dưới `r` pixel (bằng PARTY_BUFF_R). Người A gửi `fusion {op: "start"}`,
 * đồng đội B hợp lệ gần nhất nhận lời nhắc trong `window` giây và gửi `fusion {op: "join"}` thì chiêu nổ ở điểm giữa hai người. Mỗi
 * người tốn `cost` hồn lực và vào hồi chiêu `cd` giây (của hồn sư: đổi võ hồn không làm mới); hết giờ hay có người không đủ điều kiện
 * thì hủy, không tốn gì. Cả hai võ hồn cần ít nhất `minRings` hồn hoàn (3 vòng ≈ cấp 30, giai đoạn Sử Lai Khắc).
 * Số đề xuất ở #192 (cost cỡ CHAN_THAN_SKILL_COST).
 */
export const FUSION = { r: PARTY_BUFF_R, window: 4, cd: 90, cost: 50, minRings: 3 };
/**
 * Một phần của chiêu dung hợp: hồn kỹ vùng "around" chạy bằng bộ máy hồn kỹ, tâm ở điểm giữa hai người; `side` 0 / 1 thì tâm dời về
 * phía người cầm võ hồn `pair[side]` (giữa điểm giữa và người đó). Các phần chạy lần lượt trong cùng một lần tung.
 */
export type FusionPart = SkillDef & { side?: 0 | 1 };
/**
 * Cặp dung hợp (#192): `pair` hai mã võ hồn (thứ tự không quan trọng khi ghép), tên chiêu, mô tả, biểu tượng, các phần (FusionPart).
 * Sức mạnh: công = trung bình công (kể cả tăng công) của võ hồn ra trận hai người, nhân skillPower theo hồn hoàn năm cao nhất thấp
 * hơn giữa hai võ hồn; không nhận sao, ràng buộc, Phục Chế; không tạo năng lượng tiên cơ. Tổng `dmg` mỗi chiêu khoảng 6–7 (ngang tuyệt
 * kỹ, nhưng cần hai người và hồi chiêu dài). Tên chiêu là tên phỏng theo truyện (GAME_DESIGN.md mục 5.9), thêm cặp mới vào cuối mảng.
 */
export interface FusionDef { name: string; pair: [string, string]; desc: string; icon: string; parts: FusionPart[]; }
export const FUSIONS: FusionDef[] = [
  // Hồ Liệt Na và Tà Nguyệt (đội Vũ Hồn Điện): truyện có dung hợp kỹ của hai người; tên "Yêu Nguyệt" phỏng theo, cần kiểm lại tên gốc.
  { name: "Yêu Nguyệt", pair: ["yeu_ho", "nguyet_nhan"], icon: "☽",
    desc: "Lưỡi trăng xoay 3 vòng quanh điểm giữa hai người: mỗi vòng Mị hoặc 1 tầng (đủ tầng thành Mê hoặc)",
    parts: [{ name: "Yêu Nguyệt", desc: "", icon: "☽", cost: 0, cd: 0, area: "around", r: 100, n: 3, every: 0.3, dmg: 2.2,
      glow: true, shake: true, status: [{ s: "allure" }] }] },
  // Đường Tam và Tiểu Vũ (phỏng theo), cùng tên ràng buộc Hạo Thiên – Nhu Cốt.
  { name: "Hạo Thiên Nhu Cốt", pair: ["hao_thien_chuy", "nhu_cot_tho"], icon: "⚒",
    desc: "Quật ngã cả vùng (Choáng 1,5 giây) rồi chùy giáng: thêm 5% sinh lực tối đa mỗi nhát (có trần)",
    parts: [{ name: "Hạo Thiên Nhu Cốt", desc: "", icon: "⚒", cost: 0, cd: 0, area: "around", r: 90, n: 2, every: 0.5, dmg: 3.2, pctHp: 0.05,
      glow: true, shake: true, status: [{ s: "stun", secs: 1.5 }] }] },
  // Ngọc Thiên Hằng và Độc Cô Nhạn (võ hồn Bích Lân Xà), phỏng theo.
  { name: "Lôi Độc Song Sát", pair: ["lam_dien_ba_vuong_long", "bich_lan_xa_hoang"], icon: "☇",
    desc: "Sấm độc giáng 2 đợt cả vùng: Cảm điện, Trúng độc 2 tầng mỗi đợt, mỗi tầng độc thêm 40% công",
    parts: [{ name: "Lôi Độc Song Sát", desc: "", icon: "☇", cost: 0, cd: 0, area: "around", r: 110, n: 2, every: 0.4, dmg: 3,
      perStack: { s: "poison", dmg: 0.4 }, glow: true, shake: true, status: [{ s: "shock" }, { s: "poison", n: 2 }] }] },
  // Cặp băng / hỏa ở Tinh Anh Đại Tái và suối Băng Hỏa Lưỡng Nghi Nhãn (phỏng theo), cùng tên ràng buộc.
  { name: "Băng Hỏa Lưỡng Nghi", pair: ["bang_phuong_hoang", "hoa_long"], icon: "☯",
    desc: "Nửa vùng phía Băng Phượng Hoàng đóng băng (Choáng 1,5 giây), nửa phía Hỏa Long Thiêu đốt 3 tầng; rồi băng hỏa giao nhau, hồn thú đang Choáng hoặc Thiêu đốt chịu thêm 50%",
    parts: [
      { name: "Băng", desc: "", icon: "❄", cost: 0, cd: 0, area: "around", r: 80, dmg: 2.2, side: 0, status: [{ s: "stun", secs: 1.5 }, { s: "slow" }] },
      { name: "Hỏa", desc: "", icon: "✹", cost: 0, cd: 0, area: "around", r: 80, dmg: 2.2, side: 1, status: [{ s: "burn", n: 3 }] },
      { name: "Lưỡng Nghi", desc: "", icon: "☯", cost: 0, cd: 0, area: "around", r: 110, dmg: 1.6, vsSt: { s: ["stun", "burn"], v: 0.5 },
        glow: true, shake: true },
    ] },
];
/** Chỉ số cặp dung hợp của hai võ hồn (mã), bất kể thứ tự; -1 nếu không ghép được. */
export const fusionIndex = (a: string, b: string) => FUSIONS.findIndex((f) => (f.pair[0] === a && f.pair[1] === b) || (f.pair[0] === b && f.pair[1] === a));
/** Các cặp dung hợp có võ hồn `v` (để báo "cần đồng đội cầm …"). */
export const fusionsOf = (v: string) => FUSIONS.filter((f) => f.pair.includes(v));
/**
 * Phong Lôi Chi Lực (bước 2.5c, đã chốt): thanh riêng của Lam Điện Bá Vương Long, 0..max, thuộc hồn sư (không lưu DB). Mỗi đòn đánh
 * thường / mỗi lần tung hồn kỹ của võ hồn này trúng ít nhất một hồn thú: +gain (một lần như năng lượng tiên cơ), × shockMult nếu hồn thú
 * trúng đầu tiên đang Cảm điện. Đầy thì tự tung Lôi Động Minh Thiên (sức mạnh theo hồn hoàn năm cao nhất của võ hồn; không tạo năng
 * lượng tiên cơ), về 0. Ngoài giao chiến quá TIEN_CO_IDLE_SECS giây thì giảm `decay` mỗi giây; Lam Điện gục thì mất hết.
 * Lôi Động Minh Thiên gây Choáng 1 giây: từ 3.5 Choáng ngắt chiêu báo trước đang hiện của hồn thú ("ngắt chiêu boss").
 */
export const PHONG_LOI: {
  vohon: string; name: string; max: number; gain: { attack: number; skill: number }; shockMult: number; decay: number; skill: SkillDef;
} = {
  vohon: "lam_dien_ba_vuong_long", name: "Phong Lôi Chi Lực", max: 100, gain: { attack: 4, skill: 10 }, shockMult: 2, decay: 10,
  skill: { name: "Lôi Động Minh Thiên", desc: "Phong Lôi Chi Lực đầy: sấm sét giáng quanh thân, hồn thú Cảm điện chịu thêm 100% công, Choáng 1 giây (ngắt chiêu)",
    icon: "☇", cost: 0, cd: 0, area: "around", r: 120, dmg: 3, perStack: { s: "shock", dmg: 1 }, glow: true, shake: true,
    status: [{ s: "shock" }, { s: "stun", secs: 1 }] },
};
/** Tên và mô tả chiêu tiên cơ của một võ hồn (riêng nếu có, không thì chung theo hệ). */
export const tienCoOf = (vohonId: string) => {
  const own = TIEN_CO_RIENG[vohonId];
  return own ?? TIEN_CO[VOHON[Math.max(0, vohonIndex(vohonId))].he];
};

/** Số hồn hoàn tối đa của một võ hồn (mục 3): vòng thứ k hấp thụ ở bình cảnh cấp 10×k. */
export const MAX_RINGS = 10;
/** Cấp tối đa của võ hồn (mục 3): hồn hoàn thứ 10 hấp thụ ở bình cảnh cấp 100 và không lên thêm cấp. */
export const MAX_LEVEL = 100;
/**
 * Giới hạn hấp thụ theo truyện (mục 5.2, lý thuyết của Đại Sư; vòng 5+ chờ đối chiếu lại với truyện): số năm tối đa mà vòng
 * thứ k (chỉ số k − 1) chịu được mà chắc chắn thành công. Vòng 8–10 đều 100.000 năm (= MAX_YEARS) nên không bao giờ vượt.
 */
export const RING_LIMIT = [423, 764, 1760, 5000, 12000, 20000, 50000, 100000, 100000, 100000];
/** Số năm tối đa (trong giới hạn) của vòng thứ `slot` (1..MAX_RINGS). */
export const ringLimit = (slot: number) => RING_LIMIT[Math.max(1, Math.min(MAX_RINGS, Math.floor(slot) || 1)) - 1];
export const xpNeed = (level: number) => Math.floor(10 + level * level * 1.2);
export const atBottleneck = (level: number, rings: number) => level >= 10 * (rings + 1);
/** Kinh nghiệm dừng lại: ở bình cảnh (cần hồn hoàn kế tiếp) hoặc đã đạt cấp tối đa. */
export const xpBlocked = (level: number, rings: number) => level >= MAX_LEVEL || atBottleneck(level, rings);

// ---------- Hấp thụ hồn hoàn (mục 5.2 "Hấp thụ", bước 3.3; tỉ lệ thất bại đã chốt) ----------
/**
 * Tỉ lệ thất bại theo phần trăm vượt giới hạn (làm tròn lên, ví dụ vượt 25,1% tính là 26%): vượt ≤ `pct`% thì thất bại `fail`
 * (xếp tăng dần). Vượt hơn mục cuối (> 100%) thì không cho hấp thụ. Thất bại chỉ mất hồn hoàn, không phạt gì thêm.
 */
export const ABSORB_FAIL = [{ pct: 25, fail: 0.3 }, { pct: 50, fail: 0.6 }, { pct: 100, fail: 0.9 }];
/**
 * Hấp thụ hồn hoàn `years` năm vào vòng thứ `slot`: giới hạn của vòng, phần trăm vượt (số nguyên, làm tròn lên; 0 = trong giới
 * hạn) và tỉ lệ thất bại (0 = luôn thành công, null = không cho hấp thụ). Hàm thuần: client hiển thị trước khi xác nhận, server
 * dùng đúng hàm này để quyết định.
 */
export function absorbChance(years: number, slot: number) {
  const limit = ringLimit(slot), over = years <= limit ? 0 : Math.ceil(((years - limit) / limit) * 100 - 1e-9);
  const fail = over === 0 ? 0 : ABSORB_FAIL.find((s) => over <= s.pct)?.fail ?? null;
  return { limit, over, fail };
}
/** Thời gian hấp thụ (giây): tăng theo log10 số năm, từ ABSORB_SECS[0] (10 năm, trắng) đến ABSORB_SECS[1] (100.000 năm, đỏ). */
export const ABSORB_SECS: [number, number] = [3, 15];
export function absorbSecs(years: number) {
  const lo = Math.log10(TIERS[0].years), hi = Math.log10(MAX_YEARS);
  const f = Math.max(0, Math.min(1, (Math.log10(Math.max(1, years)) - lo) / (hi - lo)));
  return +(ABSORB_SECS[0] + (ABSORB_SECS[1] - ABSORB_SECS[0]) * f).toFixed(1);
}

// ---------- Quy cấp theo niên hạn, giảm kinh nghiệm khi săn hồn thú quá yếu (mục 5.3, bước BĐ3) ----------
/**
 * Cấp tương đương của hồn thú `years` năm: cấp nhỏ nhất mà võ hồn hấp thụ được hồn hoàn của nó trong giới hạn, tức bình cảnh
 * 10×k của vòng k đầu tiên có RING_LIMIT ≥ số năm (≤ 423 năm: 10, 424–764: 20, … 50.001–100.000: 80). Tính thẳng từ
 * RING_LIMIT, đổi giới hạn thì cấp tương đương tự đổi theo.
 */
export function beastLevel(years: number) {
  const k = RING_LIMIT.findIndex((lim) => years <= lim);
  return 10 * (k < 0 ? MAX_RINGS : k + 1);
}
/** Khi so cấp, cấp võ hồn tính tối đa ngần này (vòng 8–10 cùng giới hạn 100.000 năm). */
export const XP_LEVEL_CAP = 80;
/** Hồn thú thấp hơn võ hồn ra trận từ `gap` cấp trở lên thì kinh nghiệm nhân `mult` (xếp từ chênh lớn đến nhỏ). */
export const XP_LEVEL_STEPS = [{ gap: 20, mult: 0.1 }, { gap: 10, mult: 0.5 }];
/** Hệ số kinh nghiệm theo chênh cấp giữa võ hồn ra trận và hồn thú bị hạ; áp một lần trước khi chia cho đội. */
export function xpLevelScale(level: number, beastLv: number) {
  const gap = Math.min(level, XP_LEVEL_CAP) - beastLv;
  return XP_LEVEL_STEPS.find((s) => gap >= s.gap)?.mult ?? 1;
}

/** Danh hiệu theo cấp võ hồn ra trận, mỗi bậc 10 cấp (mục 5.1). */
export const TITLES = ["Hồn Sĩ", "Hồn Sư", "Đại Hồn Sư", "Hồn Tôn", "Hồn Tông", "Hồn Vương", "Hồn Đế", "Hồn Thánh", "Hồn Đấu La", "Phong Hào Đấu La"];
export const titleOf = (level: number) => TITLES[Math.max(0, Math.min(TITLES.length - 1, Math.floor((level - 1) / 10)))];

/**
 * Chỉ số của võ hồn `vh` (chỉ số trong VOHON) ở `level`, hồn hoàn theo bậc `rings`, sao `stars` (1–6, bước 3.4: starMult).
 * `bones` (bước 4.2): tổng chỉ số các hồn cốt đang gắn (boneBonus), cộng thẳng sau hệ số hệ và sao: hồn cốt +118 hồn lực
 * thì võ hồn nào cũng +118. Từ #187 kèm dòng phụ hồn cốt (mã CORE_STATS), tính như dòng cùng mã của hồn hạch (`cores`).
 * `cores` (bước 5.2, **đã chốt**): tổng chỉ số hồn hạch đang gắn (coreBonus): dòng % nhân phần gốc (sau hệ số hệ và sao, trước
 * hồn cốt), dòng phẳng cộng thẳng như hồn cốt; chí mạng cộng vào `crit` / `critMult`.
 * `res` (bước 8.2, **đã chốt**): % cộng minh của tài khoản (resonanceBonus), cộng chung với dòng % của hồn hạch, áp cho mọi võ hồn.
 * `herbs` (bước BĐ6b, **đã chốt**): % tiên thảo đã dùng trên chính võ hồn này (herbBonus), cộng chung như `res`.
 */
export function calcStats(vh: number, level: number, rings: number[], stars = 1, bones: Partial<Record<CoreStat, number>> = {},
  cores: Partial<Record<CoreStat, number>> = {}, res: Partial<Record<ResEffect, number>> = {}, herbs: Partial<Record<ResStat, number>> = {}) {
  const v = VOHON[vh], k = starMult(stars);
  const pc = (x: CoreStat, r: ResStat) => 1 + ((cores[x] ?? 0) + (bones[x] ?? 0) + (res[r] ?? 0) + (herbs[r] ?? 0)) / 100;
  let hpB = 0, atkB = 0;
  for (const t of rings) { hpB += TIERS[t].hpb; atkB += TIERS[t].atkb; }
  return {
    maxHp: Math.round((80 + level * 14 + hpB) * v.hp * k * pc("hp_pct", "hp")) + (bones.hp ?? 0) + (cores.hp ?? 0),
    maxMp: Math.round((40 + level * 4 + rings.length * 15) * v.mp * k * pc("mp_pct", "mp")) + (bones.mp ?? 0) + (cores.mp ?? 0),
    atk: (6 + level * 1.6 + atkB) * v.atk * k * pc("atk_pct", "atk") + (bones.atk ?? 0) + (cores.atk ?? 0),
    speed: PLAYER_SPEED * v.spd * (1 + (res.spd ?? 0) / 100), // tốc độ đi bộ; ngoài giao chiến chạy × RUN_MULT (MapRoom.tick)
    // Từ 5.2: tỉ lệ và hệ số chí mạng của đòn đánh vào hồn thú (CRIT cộng hồn hạch).
    crit: CRIT.chance + ((cores.crit ?? 0) + (bones.crit ?? 0) + (res.crit ?? 0)) / 100,
    critMult: CRIT.mult + ((cores.crit_dmg ?? 0) + (bones.crit_dmg ?? 0)) / 100,
  };
}

// ---------- Mảnh võ hồn, mở võ hồn và lên sao (mục 5.1 "Sưu tầm võ hồn", 5.3 "Rơi đặc trưng", bước 3.4) ----------
/** Số mảnh để mở một võ hồn chưa sở hữu (mục 5.1). Võ hồn mới mở ở cấp 1, 1 sao. */
export const SHARD_UNLOCK = 50;
/** Sao tối đa. Võ hồn mới (thức tỉnh, mở bằng mảnh) bắt đầu ở 1 sao. */
export const MAX_STARS = 6;
/** Số mảnh để lên sao kế tiếp: STAR_COST[s - 1] là giá từ s sao lên s + 1 sao (1★→2★ … 5★→6★, mục 5.1). */
export const STAR_COST = [20, 40, 80, 120, 200];
/** Mảnh cần để lên sao kế tiếp từ `stars` sao; null = đã tối đa. */
export const starCost = (stars: number) => (stars >= 1 && stars < MAX_STARS ? STAR_COST[Math.floor(stars) - 1] : null);
/**
 * **(đã chốt)** Mỗi sao trên 1 cộng STAR_STAT vào chỉ số gốc (sinh lực, hồn lực, công; không đổi tốc độ): 6★ = +25%.
 * Hiệu ứng hồn kỹ theo sao: STAR_SKILL bên dưới (bước 9.5).
 */
export const STAR_STAT = 0.05;
/** Sao kẹp vào 1..MAX_STARS (số lạ / thiếu = 1★). */
const starOf = (stars: number) => Math.max(1, Math.min(MAX_STARS, Math.floor(stars) || 1));
export const starMult = (stars: number) => 1 + STAR_STAT * (starOf(stars) - 1);
/**
 * **(đã chốt 2026-10-20, bước 9.5)** Hiệu ứng hồn kỹ theo sao võ hồn (mục 5.1 "Sao"), ngoài STAR_STAT: mỗi sao trên 1 cộng
 * STAR_SKILL sức mạnh (sát thương và mức hiệu ứng) hồn kỹ vòng 1..STAR_SKILL_RINGS và tiên cơ riêng (6★ = +15%).
 * Từ STAR_CD_STARS sao: hồi chiêu hồn kỹ vòng 1..STAR_SKILL_RINGS × STAR_CD (−10%). Từ STAR_TIEN_CO_STARS sao: tiên cơ riêng thêm
 * STAR_TIEN_CO (cộng thẳng vào hệ số sao: 6★ = 1 + 0,15 + 0,2 = ×1,35).
 */
export const STAR_SKILL = 0.03;
export const STAR_SKILL_RINGS = 4;
export const STAR_CD_STARS = 4;
export const STAR_CD = 0.9;
export const STAR_TIEN_CO_STARS = 6;
export const STAR_TIEN_CO = 0.2;
/** Hệ số sức mạnh hồn kỹ vòng 1–4 theo sao (1★ = 1, 6★ = 1,15). */
export const starSkillMult = (stars: number) => 1 + STAR_SKILL * (starOf(stars) - 1);
/** Hệ số hồi chiêu hồn kỹ vòng 1–4 theo sao (dưới 4★ = 1, từ 4★ = 0,9). */
export const starCdMult = (stars: number) => (starOf(stars) >= STAR_CD_STARS ? STAR_CD : 1);
/** Hệ số sức mạnh tiên cơ riêng theo sao: starSkillMult, từ 6★ cộng thêm STAR_TIEN_CO. */
export const starTienCoMult = (stars: number) => starSkillMult(stars) + (starOf(stars) >= STAR_TIEN_CO_STARS ? STAR_TIEN_CO : 0);
/** Vòng `r` (chỉ số 0..9) có nhận hiệu ứng sao không (vòng 1..STAR_SKILL_RINGS). */
export const starRing = (r: number) => r >= 0 && r < STAR_SKILL_RINGS;
/**
 * **(đã chốt)** Tỉ lệ rơi mảnh võ hồn khi hạ hồn thú, theo số năm (bảng rơi mục 5.3): từ `years` năm trở lên thì `p`.
 * Rơi SHARD_QTY mảnh của một võ hồn ngẫu nhiên trong MAPS[...].shards, vào thẳng túi người hạ.
 */
export const SHARD_DROP = [{ years: 0, p: 0.1 }, { years: 1000, p: 0.15 }, { years: 10000, p: 0.2 }, { years: 100000, p: 1 }];
export const shardChance = (years: number) => SHARD_DROP.reduce((p, x) => (years >= x.years ? x.p : p), 0);
/** Số mảnh mỗi lần rơi (đã chốt). */
export const SHARD_QTY = 1;
/** Mảnh gộp tối đa ngần này một ô (đã chốt; đủ cho 6★ cần 460 mảnh trong một ô). */
export const SHARD_STACK = 999;
/** Mã vật phẩm mảnh của võ hồn `vohonId` (cột `items.code`). Không đổi cách đặt mã: DB lưu mã này. */
export const shardCode = (vohonId: string) => `manh_${vohonId}`;

// ---------- Hồn cốt (mục 5.5, bảng rơi 5.3, bước 4.1) ----------
/** Mã vật phẩm của hồn cốt (cột `items.code`, `kind` = `hon_cot`). Mỗi món một ô (không gộp): loài và vị trí lưu ở `items.stats`. */
export const BONE_ITEM = "hon_cot";
export type BoneSlot = "dau" | "than" | "tay_trai" | "tay_phai" | "chan_trai" | "chan_phai";
/** Chỉ số hồn cốt cộng cho võ hồn đang gắn (bước 4.2, boneBonus): sinh lực, hồn lực, công. */
export type BoneStat = "hp" | "mp" | "atk";
export const BONE_STAT_NAMES: Record<BoneStat, string> = { hp: "Sinh lực", mp: "Hồn lực", atk: "Công" };
/**
 * 6 vị trí hồn cốt (mục 5.5). Mã lưu trong DB (`items.stats.slot`), không đổi mã, thứ tự là chỉ số đồng bộ (`DropState.slot`).
 * `active`: đầu và hai tay cho kỹ năng chủ động, còn lại bị động (kỹ năng ở bước 4.3).
 * **(đã chốt)** Chỉ số chính `stat` = hệ số `k` × mức cộng của hồn hoàn cùng số năm (TIERS `hpb` cho sinh lực / hồn lực,
 * `atkb` cho công; nội suy theo số năm như beastStats): đầu hồn lực, thân sinh lực, hai tay công, hai chân sinh lực.
 */
export const BONE_SLOTS: { id: BoneSlot; name: string; active: boolean; stat: BoneStat; k: number }[] = [
  { id: "dau",       name: "Đầu",       active: true,  stat: "mp",  k: 0.3 },
  { id: "than",      name: "Thân",      active: false, stat: "hp",  k: 0.8 },
  { id: "tay_trai",  name: "Tay trái",  active: true,  stat: "atk", k: 0.6 },
  { id: "tay_phai",  name: "Tay phải",  active: true,  stat: "atk", k: 0.6 },
  { id: "chan_trai", name: "Chân trái", active: false, stat: "hp",  k: 0.5 },
  { id: "chan_phai", name: "Chân phải", active: false, stat: "hp",  k: 0.5 },
];
/** Chỉ số trong BONE_SLOTS của một mã vị trí (-1 nếu không có). */
export const boneSlotIndex = (slot: unknown) => BONE_SLOTS.findIndex((s) => s.id === slot);
/**
 * **(đã chốt)** Tỉ lệ rơi hồn cốt khi hạ hồn thú thường, theo số năm (bảng rơi mục 5.3): dưới 1.000 năm 0%, 1.000–9.999 1%,
 * 10.000–99.999 4%, 100.000 năm 20%. Vị trí ngẫu nhiên đều trong 6 vị trí (5.3 không ghi theo loài).
 * `mult`: hệ số theo bậc (mục 5.4: tinh anh x ELITE.bone = 3), tối đa 100%.
 */
export const BONE_DROP = [{ years: 0, p: 0 }, { years: 1000, p: 0.01 }, { years: 10000, p: 0.04 }, { years: 100000, p: 0.2 }];
export const boneChance = (years: number, mult = 1) =>
  Math.min(1, BONE_DROP.reduce((p, x) => (years >= x.years ? x.p : p), 0) * mult);
/**
 * Chỉ số chính của hồn cốt vị trí `slot`, `years` năm, cường hóa `+enhance` (mục 5.5 "niên hạn càng cao thì chỉ số gốc càng
 * mạnh"): chỉ số gốc tăng liên tục theo số năm; từ bước 4.4 mỗi cấp cường hóa cộng thêm BONE_ENHANCE_STAT phần chỉ số gốc (ít
 * nhất +1 mỗi cấp). Không lưu DB (đổi công thức thì mọi hồn cốt đã có đổi theo). Vị trí lạ: {}.
 */
export function boneStats(slot: unknown, years: number, enhance = 0): Partial<Record<BoneStat, number>> {
  const s = BONE_SLOTS[boneSlotIndex(slot)]; if (!s) return {};
  const y = Math.max(TIERS[0].years, Math.min(MAX_YEARS, years)), t = tierOfYears(y), a = TIERS[t], b = TIERS[Math.min(t + 1, TIERS.length - 1)];
  const f = b === a ? 0 : Math.log(y / a.years) / Math.log(b.years / a.years), mix = (x: number, z: number) => x * Math.pow(z / x, f);
  const base = Math.max(1, Math.round((s.stat === "atk" ? mix(a.atkb, b.atkb) : mix(a.hpb, b.hpb)) * s.k)), e = boneEnhanceClamp(enhance);
  return { [s.stat]: base + Math.max(e, Math.round(base * BONE_ENHANCE_STAT * e)) };
}
/**
 * Tổng chỉ số của các hồn cốt đang gắn trên một võ hồn, đưa vào calcStats: chỉ số chính (bước 4.2, kèm cấp cường hóa từ 4.4) vào
 * `hp` / `mp` / `atk`, cộng các dòng phụ (`subs`, #187; mã CORE_STATS, cùng đơn vị với coreBonus). Mỗi vị trí tối đa một hồn cốt
 * (server kiểm tra khi gắn).
 */
export function boneBonus(bones: { slot: unknown; years: number; enhance?: number; subs?: readonly [CoreStat, number][] }[]): Record<CoreStat, number> {
  const out = Object.fromEntries(CORE_STAT_IDS.map((k) => [k, 0])) as Record<CoreStat, number>;
  for (const b of bones) {
    for (const [k, v] of Object.entries(boneStats(b.slot, b.years, b.enhance ?? 0))) out[k as BoneStat] += v;
    for (const [k, v] of b.subs ?? []) out[k] += v;
  }
  for (const k of CORE_STAT_IDS) out[k] = Math.round(out[k] * 10) / 10;
  return out;
}
/** Loài và vị trí của một hồn cốt (`items.stats`); dữ liệu hỏng thì null. */
export function parseBone(stats: unknown): { beast: string; slot: BoneSlot } | null {
  const o = stats as { beast?: unknown; slot?: unknown } | null;
  if (!o || typeof o !== "object" || typeof o.beast !== "string" || boneSlotIndex(o.slot) < 0) return null;
  return { beast: o.beast, slot: o.slot as BoneSlot };
}
/**
 * Tên hồn cốt (mục 5.5): "Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm"; đã cường hóa thì "+N" đứng trước (bước 4.4):
 * "+5 Ám Kim Khủng Trảo Hùng – Tay phải, 32.000 năm". Loài không còn trong BEASTS: "Hồn thú lạ".
 */
export function boneName(beast: string, slot: unknown, years: number, enhance = 0) {
  const b = BEASTS[beastIndex(beast)]?.name ?? "Hồn thú lạ", s = BONE_SLOTS[boneSlotIndex(slot)]?.name ?? "Vị trí lạ", e = boneEnhanceClamp(enhance);
  return `${e ? `+${e} ` : ""}${b} – ${s}, ${formatYears(years)}`;
}

// ---------- Cường hóa hồn cốt (mục 5.5, bước 4.4; mọi số đã chốt) ----------
/** Cấp cường hóa tối đa (+0 đến +20). */
export const BONE_MAX_ENHANCE = 20;
/**
 * **(đã chốt)** Điểm cường hóa để lên từ +n lên +(n + 1): BONE_ENHANCE_COST[n]. Cộng dồn: +5 cần 165 điểm, +10 cần 665,
 * +15 cần 2.180, +20 cần 6.850 (khoảng 5 hồn cốt 100.000 năm cùng vị trí, hay 22 hồn cốt 32.000 năm khác vị trí).
 */
export const BONE_ENHANCE_COST = [20, 25, 30, 40, 50, 60, 75, 95, 120, 150, 185, 230, 290, 360, 450, 570, 710, 890, 1100, 1400];
/** **(đã chốt)** Nguyên liệu cho ngần này điểm mỗi năm niên hạn (1 điểm / 100 năm: 1.000 năm 10 điểm, 32.000 năm 320). */
export const BONE_FEED_PER_YEAR = 0.01;
/** Nguyên liệu cùng vị trí với hồn cốt được cường hóa thì điểm ×1,5 (mục 5.5 "cùng vị trí được thêm 50%"). */
export const BONE_FEED_SAME_SLOT = 1.5;
/** **(đã chốt)** Nguyên liệu đã cường hóa thì trả lại ngần này phần điểm đã nạp vào nó (không mất trắng công cường hóa cũ). */
export const BONE_FEED_CARRY = 0.8;
/** Tối đa ngần này nguyên liệu mỗi lần cường hóa (chặn message quá lớn). */
export const BONE_FEED_MAX = 20;
/** **(đã chốt)** Mỗi cấp cường hóa cộng thêm ngần này phần chỉ số chính gốc (+20 = gấp đôi chỉ số gốc), ít nhất +1 mỗi cấp. */
export const BONE_ENHANCE_STAT = 0.05;
/**
 * **(đã chốt)** Mốc cường hóa (mục 5.5): mỗi mốc đã đạt làm kỹ năng của hồn cốt mạnh thêm BONE_MILESTONE_SKILL (chủ động: sức
 * mạnh và hiệu ứng lên bản thân; bị động: mức cộng, vẫn kẹp BONE_PASSIVE_CAP), **và** thêm 1 dòng chỉ số phụ ngẫu nhiên (#187,
 * chủ repo duyệt 2026-10-22 ở #181; BONE_SUB_POOL, boneAddSubs).
 */
export const BONE_ENHANCE_MILESTONES = [5, 10, 15, 20];
export const BONE_MILESTONE_SKILL = 0.1;
/** Cấp cường hóa hợp lệ (số nguyên 0..BONE_MAX_ENHANCE). */
export function boneEnhanceClamp(e: unknown) { return Math.max(0, Math.min(BONE_MAX_ENHANCE, Math.floor(Number(e)) || 0)); }
/** Tổng điểm cường hóa để đạt +`level` từ +0. */
export function boneEnhanceNeed(level: number) { return BONE_ENHANCE_COST.slice(0, boneEnhanceClamp(level)).reduce((a, x) => a + x, 0); }
/** Cấp cường hóa ứng với tổng điểm `xp` (cộng dồn từ +0). */
export function boneEnhanceLevel(xp: number) {
  let lv = 0, need = 0;
  while (lv < BONE_MAX_ENHANCE && xp >= need + BONE_ENHANCE_COST[lv]) need += BONE_ENHANCE_COST[lv++];
  return lv;
}
/** Tổng điểm cường hóa đã nạp vào một hồn cốt (`items.stats.xp`; thiếu / hỏng thì 0, tối đa điểm của +20). */
export function boneXp(stats: unknown) {
  const x = Number((stats as { xp?: unknown } | null)?.xp);
  return Number.isSafeInteger(x) && x > 0 ? Math.min(x, boneEnhanceNeed(BONE_MAX_ENHANCE)) : 0;
}
/** Số mốc cường hóa đã đạt ở +`enhance` (0..4). */
export const boneMilestones = (enhance: number) => BONE_ENHANCE_MILESTONES.filter((m) => boneEnhanceClamp(enhance) >= m).length;
/** Hệ số kỹ năng hồn cốt theo cấp cường hóa: ×1 dưới +5, ×1,1 từ +5, ×1,2 từ +10, ×1,3 từ +15, ×1,4 ở +20. */
export const boneSkillMult = (enhance: number) => 1 + BONE_MILESTONE_SKILL * boneMilestones(enhance);
/**
 * Điểm một nguyên liệu cho hồn cốt vị trí `targetSlot`: niên hạn × BONE_FEED_PER_YEAR (ít nhất 1), cùng vị trí ×BONE_FEED_SAME_SLOT,
 * cộng BONE_FEED_CARRY phần điểm đã nạp vào chính nguyên liệu đó.
 */
export function boneFeedXp(mat: { slot: unknown; years: number; xp?: number }, targetSlot: unknown) {
  const base = Math.max(1, Math.round(Math.max(0, mat.years) * BONE_FEED_PER_YEAR * (mat.slot === targetSlot ? BONE_FEED_SAME_SLOT : 1)));
  return base + Math.floor(Math.max(0, mat.xp ?? 0) * BONE_FEED_CARRY);
}
/**
 * Một lần cường hóa (hàm thuần: client xem trước, server tính thật): hồn cốt đích (vị trí, điểm đã có) và các nguyên liệu. `gain`
 * tổng điểm nguyên liệu, `from` / `level` cấp trước / sau, `xp` điểm sau khi cộng (kẹp ở +20), `waste` điểm dư bị bỏ ở +20.
 */
export function boneEnhancePreview(target: { slot: unknown; xp: number }, mats: { slot: unknown; years: number; xp?: number }[]) {
  const cap = boneEnhanceNeed(BONE_MAX_ENHANCE), gain = mats.reduce((a, m) => a + boneFeedXp(m, target.slot), 0);
  const raw = Math.max(0, target.xp) + gain, xp = Math.min(cap, raw);
  return { gain, xp, from: boneEnhanceLevel(target.xp), level: boneEnhanceLevel(xp), waste: raw - xp };
}

// ---------- Hồn hạch (mục 5.6, bảng rơi 5.3, bước 5.1) ----------
/**
 * Mã vật phẩm của hồn hạch (cột `items.code`, `kind` = `hon_hach`). Mỗi món một ô (không gộp): sao ở `items.stars`, cấp nâng cấp ở
 * `items.enhance` (+0; nâng cấp ở 5.3), bộ / chỉ số chính / dòng phụ ở `items.stats` = `{set, main, subs: [[mã chỉ số, giá trị], ...]}`.
 */
export const CORE_ITEM = "hon_hach";
export type CoreSetId = "phuong_hoang" | "ba_vuong_long" | "xa_hoang" | "hao_thien" | "that_sat" | "linh_mieu" | "lam_ngan" | "luu_ly" | "tien_co";
/**
 * Các bộ hồn hạch (bảng mục 5.6). Mã lưu trong DB (`items.stats.set`), không đổi mã; thứ tự là chỉ số đồng bộ (`DropState.cset`),
 * chỉ thêm vào cuối. `col`: màu biểu tượng. Hiệu ứng 2 / 4 món (`set2` / `set4`) là chữ hiển thị; số và luật ở CORE_SET_FX (từ 5.2).
 */
export const CORE_SETS: { id: CoreSetId; name: string; tag: string; col: string; set2: string; set4: string }[] = [
  { id: "phuong_hoang",  name: "Phượng Hoàng",  tag: "Thiêu đốt", col: "#ff7a3c", set2: "+12% sát thương thiêu đốt",
    set4: "Thiêu đốt cộng dồn thêm 1 tầng tối đa; Viêm bạo gây thêm 30% sát thương" },
  { id: "ba_vuong_long", name: "Bá Vương Long", tag: "Cảm điện",  col: "#5cb8ff", set2: "+15% sát thương lan của cảm điện",
    set4: "Đánh trúng mục tiêu cảm điện hồi 3% hồn lực, mỗi giây 1 lần" },
  { id: "xa_hoang",      name: "Xà Hoàng",      tag: "Trúng độc", col: "#6fd35a", set2: "+15% sát thương độc",
    set4: "Mục tiêu trúng độc từ 5 tầng trở lên bị Dễ thương 10%" },
  { id: "hao_thien",     name: "Hạo Thiên",     tag: "Chấn đãng", col: "#b9a3ff", set2: "+15% công",
    set4: "Đòn đánh thứ 3 liên tiếp gây thêm 40% sát thương" },
  { id: "that_sat",      name: "Thất Sát",      tag: "Phá giáp",  col: "#e3e6f0", set2: "Đòn trực tiếp xuyên 1/3 thủ của hồn thú",
    set4: "Mục tiêu bị Liệt thương nhận thêm 15% chí mạng từ võ hồn mang bộ" },
  { id: "linh_mieu",     name: "Linh Miêu",     tag: "Mẫn công",  col: "#c77dff", set2: "+12% chí mạng",
    set4: "Chí mạng tăng 10% tốc độ đánh trong 4 giây" },
  { id: "lam_ngan",      name: "Lam Ngân",      tag: "Khống chế", col: "#3fd0c0", set2: "+20% thời gian khống chế",
    set4: "Hồn kỹ khống chế hồi lại 10% hồn lực" },
  { id: "luu_ly",        name: "Lưu Ly",        tag: "Phụ trợ",   col: "#ffe08a", set2: "+15% hiệu quả hồi máu và khiên",
    set4: "Đổi võ hồn vào thì tăng 15% công cho cả đội trong 6 giây" },
  { id: "tien_co",       name: "Tiên Cơ",       tag: "Tiên cơ",   col: "#ff9ad5", set2: "+20% tốc độ tích năng lượng tiên cơ",
    set4: "Chiêu tiên cơ gây thêm 35% sát thương" },
];
/** Chỉ số trong CORE_SETS của một mã bộ (-1 nếu không có). */
export const coreSetIndex = (set: unknown) => CORE_SETS.findIndex((s) => s.id === set);
export type CoreStat = "hp" | "atk" | "mp" | "hp_pct" | "atk_pct" | "mp_pct" | "crit" | "crit_dmg";
/**
 * **(đã chốt)** Chỉ số của hồn hạch. `pct`: tính theo % (hiển thị một chữ số thập phân), không thì cộng phẳng. `main`: chỉ số chính
 * ở 6★ +0; `sub`: mức lớn nhất của một dòng phụ ở 6★; sao thấp hơn nhân CORE_STAR_K. `w`: trọng số khi tung chỉ số chính (dòng phụ
 * tung đều, không trùng nhau và không trùng chỉ số chính). Mã lưu trong DB, không đổi. Cộng vào võ hồn từ 5.2 (coreBonus, calcStats).
 */
export const CORE_STATS: Record<CoreStat, { name: string; pct: boolean; main: number; sub: number; w: number }> = {
  hp:       { name: "Sinh lực",            pct: false, main: 300, sub: 90, w: 1 },
  atk:      { name: "Công",                pct: false, main: 30,  sub: 9,  w: 1 },
  mp:       { name: "Hồn lực",             pct: false, main: 120, sub: 36, w: 1 },
  hp_pct:   { name: "Sinh lực",            pct: true,  main: 12,  sub: 4,  w: 1 },
  atk_pct:  { name: "Công",                pct: true,  main: 12,  sub: 4,  w: 1 },
  mp_pct:   { name: "Hồn lực",             pct: true,  main: 12,  sub: 4,  w: 1 },
  crit:     { name: "Tỉ lệ chí mạng",      pct: true,  main: 8,   sub: 3,  w: 0.5 },
  crit_dmg: { name: "Sát thương chí mạng", pct: true,  main: 16,  sub: 5,  w: 0.5 },
};
export const CORE_STAT_IDS = Object.keys(CORE_STATS) as CoreStat[];
export const MAX_CORE_STARS = 6;
/** **(đã chốt)** Hệ số chỉ số theo sao 1★..6★ (chỉ số chính và mức dòng phụ): 6★ = 1. */
export const CORE_STAR_K = [0.15, 0.25, 0.4, 0.55, 0.75, 1];
/** Số dòng phụ khi rơi theo sao 1★..6★ (mục 5.6: 1★ 0 dòng … 6★ 4 dòng; các mức giữa **đã chốt**). Nâng cấp (5.3) thêm dòng sau. */
export const CORE_SUBS = [0, 1, 1, 2, 3, 4];
export const CORE_MAX_SUBS = 4;
/** **(đã chốt)** Một dòng phụ tung đều trong [lo, hi] × mức dòng phụ của sao đó. */
export const CORE_SUB_ROLL: [number, number] = [0.7, 1];
/**
 * Tỉ lệ rơi hồn hạch khi hạ hồn thú thường, theo số năm (bảng rơi mục 5.3): từ `years` năm trở lên thì `p`, sao trong `stars`.
 * Tinh anh (mục 5.4) chắc chắn rơi 1 hồn hạch, sao theo cùng bảng.
 */
export const CORE_DROP: { years: number; p: number; stars: [number, number] }[] = [
  { years: 0, p: 0.15, stars: [1, 2] }, { years: 1000, p: 0.25, stars: [2, 4] }, { years: 10000, p: 0.4, stars: [3, 5] }, { years: 100000, p: 1, stars: [5, 6] },
];
const coreDropOf = (years: number) => CORE_DROP.reduce((a, x) => (years >= x.years ? x : a), CORE_DROP[0]);
export const coreChance = (years: number) => coreDropOf(years).p;
/** Khoảng sao [thấp, cao] của hồn hạch rơi từ hồn thú `years` năm. */
export const coreStarBand = (years: number): [number, number] => [...coreDropOf(years).stars];
/** **(đã chốt)** Trọng số sao trong khoảng, từ sao thấp lên (khoảng 2 sao dùng 2 số đầu): 1–2★ 67% / 33%, 2–4★ 57% / 29% / 14%. */
export const CORE_STAR_W = [4, 2, 1];
/** **(đã chốt)** Tỉ lệ hồn hạch thuộc bộ đặc trưng của bản đồ (MapDef.cores); còn lại là một bộ bất kỳ trong CORE_SETS. */
export const CORE_MAP_SET = 0.8;
const clampCoreStars = (stars: number) => Math.max(1, Math.min(MAX_CORE_STARS, Math.floor(stars) || 1));
/** Làm tròn một chỉ số: % một chữ số thập phân (tối thiểu 0,1), cộng phẳng số nguyên (tối thiểu 1). */
const coreRound = (k: CoreStat, v: number) => (CORE_STATS[k].pct ? Math.max(0.1, Math.round(v * 10) / 10) : Math.max(1, Math.round(v)));
/**
 * Chỉ số chính của hồn hạch `stars` sao ở cấp nâng cấp `enhance`, tính lại từ sao và cấp (không lưu DB): mỗi cấp thêm
 * CORE_ENHANCE_MAIN phần chỉ số +0 (bước 5.3).
 */
export const coreMainValue = (main: CoreStat, stars: number, enhance = 0) =>
  coreRound(main, CORE_STATS[main].main * CORE_STAR_K[clampCoreStars(stars) - 1] * (1 + CORE_ENHANCE_MAIN * coreEnhanceClamp(enhance)));
/** Mức lớn nhất của một dòng phụ `k` ở `stars` sao (giá trị tung trong CORE_SUB_ROLL × mức này, đã làm tròn). */
export const coreSubMax = (k: CoreStat, stars: number) => CORE_STATS[k].sub * CORE_STAR_K[clampCoreStars(stars) - 1];
/** Nội dung `items.stats` của một hồn hạch. */
export interface CoreData { set: string; main: CoreStat; subs: [CoreStat, number][] }
/**
 * Tung một hồn hạch rơi từ hồn thú `years` năm (bước 5.1). Số ngẫu nhiên lấy từ `rnd` (server truyền Math.random), nên hàm vẫn
 * thuần. Sao trong coreStarBand theo CORE_STAR_W; `o.high`: sao cao nhất của khoảng (rương tà hóa thú vương, BĐ5); `o.stars`: cố
 * định nếu nằm trong khoảng. Bộ, chỉ số: rollCoreStats (`o.set`: chỉ số cố định trong CORE_SETS).
 */
export function rollCore(years: number, sets: readonly string[], rnd: () => number, o: { stars?: number; set?: number; high?: boolean } = {}) {
  const [lo, hi] = coreStarBand(years);
  let stars = lo;
  if (o.stars && o.stars >= lo && o.stars <= hi) stars = o.stars;
  else if (o.high) stars = hi;
  else {
    const w = CORE_STAR_W.slice(0, hi - lo + 1);
    let r = rnd() * w.reduce((a, x) => a + x, 0), i = 0;
    while (i < w.length - 1 && r >= w[i]) { r -= w[i]; i++; }
    stars = lo + i;
  }
  return { stars, data: rollCoreStats(stars, sets, rnd, o.set) };
}
/**
 * Bộ, chỉ số chính và dòng phụ của một hồn hạch `stars` sao. Bộ: CORE_MAP_SET thuộc `sets` (bộ đặc trưng của bản đồ), còn lại một
 * bộ bất kỳ; `setIdx` cố định chỉ số trong CORE_SETS. Chỉ số chính theo trọng số `w`; đúng CORE_SUBS[sao] dòng phụ, khác nhau và
 * khác chỉ số chính, giá trị trong CORE_SUB_ROLL × coreSubMax.
 */
export function rollCoreStats(stars: number, sets: readonly string[], rnd: () => number, setIdx?: number): CoreData {
  stars = clampCoreStars(stars);
  const pick = <T>(list: readonly T[]) => list[Math.min(list.length - 1, Math.floor(rnd() * list.length))];
  const set = setIdx !== undefined && CORE_SETS[setIdx] ? CORE_SETS[setIdx].id
    : sets.length && rnd() < CORE_MAP_SET ? pick(sets) : pick(CORE_SETS).id;
  let r = rnd() * CORE_STAT_IDS.reduce((a, k) => a + CORE_STATS[k].w, 0), main = CORE_STAT_IDS[CORE_STAT_IDS.length - 1];
  for (const k of CORE_STAT_IDS) { r -= CORE_STATS[k].w; if (r < 0) { main = k; break; } }
  const subs: [CoreStat, number][] = [];
  for (let n = 0; n < CORE_SUBS[stars - 1]; n++) {
    const k = pick(CORE_STAT_IDS.filter((x) => x !== main && !subs.some(([y]) => y === x)));
    subs.push([k, coreRound(k, coreSubMax(k, stars) * (CORE_SUB_ROLL[0] + rnd() * (CORE_SUB_ROLL[1] - CORE_SUB_ROLL[0])))]);
  }
  return { set, main, subs };
}
/** Bộ, chỉ số chính và dòng phụ của một hồn hạch (`items.stats`); dữ liệu hỏng thì null. Bộ không còn trong CORE_SETS vẫn giữ. */
export function parseCore(stats: unknown): CoreData | null {
  const o = stats as { set?: unknown; main?: unknown; subs?: unknown } | null;
  if (!o || typeof o !== "object" || typeof o.set !== "string" || !CORE_STAT_IDS.includes(o.main as CoreStat) || !Array.isArray(o.subs)) return null;
  const subs = o.subs.filter((x): x is [CoreStat, number] => Array.isArray(x) && CORE_STAT_IDS.includes(x[0]) && typeof x[1] === "number");
  return { set: o.set, main: o.main as CoreStat, subs: subs.slice(0, CORE_MAX_SUBS) };
}
/** Tên bộ (mã lạ: "Bộ lạ"). */
export const coreSetName = (set: string) => CORE_SETS[coreSetIndex(set)]?.name ?? "Bộ lạ";
/** Tên hồn hạch (mục 5.6): "Hồn hạch Hạo Thiên 4★"; đã nâng cấp (5.3) thì "+N" đứng trước: "+6 Hồn hạch Hạo Thiên 4★". */
export const coreName = (set: string, stars: number, enhance = 0) => {
  const e = coreEnhanceClamp(enhance);
  return `${e ? `+${e} ` : ""}Hồn hạch ${coreSetName(set)} ${clampCoreStars(stars)}★`;
};
/** Một dòng chỉ số: "Công +12%", "Sinh lực +300", "Tỉ lệ chí mạng +2,4%". */
export function coreStatText(k: CoreStat, v: number) {
  const s = CORE_STATS[k];
  return `${s.name} +${v.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}${s.pct ? "%" : ""}`;
}

// ---------- Gắn hồn hạch và hiệu ứng bộ (mục 5.6, bước 5.2; mọi số đã chốt) ----------
/** Số ô hồn hạch trên mỗi võ hồn. Ô nào cũng nhận mọi hồn hạch (5.6 không chia ô theo loại); ô đang gắn lưu ở `items.stats.slot`. */
export const CORE_SLOTS = 6;
/** Số món cùng bộ để nhận hiệu ứng 2 món / thêm hiệu ứng 4 món (6 ô: ghép 4 + 2 hoặc 2 + 2 + 2). */
export const CORE_SET_2 = 2, CORE_SET_4 = 4;
/** Ô (0..CORE_SLOTS − 1) của một hồn hạch đang gắn, đọc từ `items.stats.slot`; không có hoặc sai thì −1. */
export function coreSlotOf(stats: unknown) {
  const s = (stats as { slot?: unknown } | null)?.slot;
  return typeof s === "number" && Number.isInteger(s) && s >= 0 && s < CORE_SLOTS ? s : -1;
}
/**
 * Hiệu ứng bộ hồn hạch (bảng 5.6), mọi tỉ lệ là phần thêm (0,12 = +12%). Chỉ tính bộ trên **võ hồn đang ra trận**, trừ bộ Tiên Cơ
 * 2 món (tích năng lượng của chính võ hồn mang bộ khi đang ở ngoài, mục 5.1 bước 2.4).
 * - `burn` / `poison`: sát thương Thiêu đốt / Trúng độc do hồn sư gây (tính lúc gây). `burnMax`: Thiêu đốt thêm tầng tối đa.
 *   `boom`: Viêm bạo (kích nổ Thiêu đốt) thêm sát thương.
 * - `chain`: sát thương lan của Cảm điện. `shockMp`: đòn trực tiếp trúng hồn thú Cảm điện hồi tỉ lệ hồn lực tối đa, mỗi
 *   CORE_FX_RULE.shockMpCd giây một lần.
 * - `poisonVuln`: hồn thú Trúng độc từ CORE_FX_RULE.poisonStacks tầng (người gây cuối mang bộ) nhận thêm sát thương từ mọi nguồn,
 *   như Dễ thương (cộng với Dễ thương thật).
 * - `atk`: công (%; cộng vào chỉ số qua coreBonus). `combo`: đòn đánh thường trúng thứ CORE_FX_RULE.comboN liên tiếp (mỗi đòn cách
 *   nhau không quá comboGap giây, đòn trượt thì đếm lại) thêm sát thương.
 * - `pierce`: "xuyên thủ" (#116): đòn trực tiếp bỏ qua ngần ấy phần thủ của hồn thú (BEAST_DEF), cộng với phần Phá giáp giảm, tối đa
 *   hết thủ. `armorCrit`: thêm tỉ lệ chí mạng lên hồn thú đang Phá giáp (Liệt thương).
 * - `crit`: tỉ lệ chí mạng (cộng vào chỉ số qua coreBonus). `haste`: chí mạng thì tốc độ đánh thường tăng trong hasteSecs giây.
 * - `cc`: thời gian khống chế (trạng thái không đi / không đánh / câm lặng / mê hoặc) hồn sư gây lên hồn thú. `ccMp`: hồn kỹ có gây
 *   khống chế, trúng ít nhất một hồn thú thì hồi tỉ lệ hồn lực tối đa (một lần mỗi lần tung).
 * - `heal`: hồi máu và khiên từ hồn kỹ, tiên cơ, kỹ năng hồn cốt. `swapAtk`: đổi tay võ hồn mang bộ vào thì cả đội tăng công
 *   (hiệu ứng có lợi `atk` của hồn sư, đổi võ hồn vẫn còn) trong swapSecs giây.
 * - `energy` / `tienCo`: bộ Tiên Cơ, cùng số với TIEN_CO_SET (energyGain, tienCoDmgMult).
 */
export interface CoreFx {
  burn?: number; burnMax?: number; boom?: number; chain?: number; shockMp?: number; poison?: number; poisonVuln?: number;
  atk?: number; combo?: number; pierce?: number; armorCrit?: number; crit?: number; haste?: number; cc?: number; ccMp?: number;
  heal?: number; swapAtk?: number; energy?: number; tienCo?: number;
}
export const CORE_SET_FX: Record<CoreSetId, { two: CoreFx; four: CoreFx }> = {
  phuong_hoang:  { two: { burn: 0.12 },   four: { burnMax: 1, boom: 0.3 } },
  ba_vuong_long: { two: { chain: 0.15 },  four: { shockMp: 0.03 } },
  xa_hoang:      { two: { poison: 0.15 }, four: { poisonVuln: 0.1 } },
  hao_thien:     { two: { atk: 0.15 },    four: { combo: 0.4 } },
  that_sat:      { two: { pierce: 1 / 3 }, four: { armorCrit: 0.15 } },
  linh_mieu:     { two: { crit: 0.12 },   four: { haste: 0.1 } },
  lam_ngan:      { two: { cc: 0.2 },      four: { ccMp: 0.1 } },
  luu_ly:        { two: { heal: 0.15 },   four: { swapAtk: 0.15 } },
  tien_co:       { two: { energy: TIEN_CO_SET.gain }, four: { tienCo: TIEN_CO_SET.dmg } },
};
/** Luật thời gian / ngưỡng của hiệu ứng bộ (đã chốt): xem CoreFx. */
export const CORE_FX_RULE = { shockMpCd: 1, poisonStacks: 5, comboN: 3, comboGap: 2, hasteSecs: 4, swapSecs: 6 };
/** Trạng thái tính là khống chế cho bộ Lam Ngân (không đi, không đánh, câm lặng, mê hoặc). */
export const isCcStatus = (s: StatusId) => { const d = STATUS[s]; return d.noMove || d.noAtk || d.noSkill || d.wander; };
/** Một hồn hạch đang gắn: sao, dữ liệu (parseCore) và cấp nâng cấp (`items.enhance`, từ 5.3; thiếu = +0). */
export interface WornCore { stars: number; data: CoreData; enhance?: number }
/** Số món từng bộ (mã bộ -> số món) trong các hồn hạch đang gắn trên một võ hồn. */
export function coreSetCounts(cores: readonly WornCore[]) {
  const m = new Map<string, number>();
  for (const c of cores) m.set(c.data.set, (m.get(c.data.set) ?? 0) + 1);
  return m;
}
/** Các bộ đã đủ 2 món (bộ lạ bỏ qua), xếp theo thứ tự CORE_SETS; `four`: đủ 4 món. */
export function activeCoreSets(cores: readonly WornCore[]) {
  return [...coreSetCounts(cores)].filter(([set, n]) => n >= CORE_SET_2 && coreSetIndex(set) >= 0)
    .map(([set, n]) => ({ set: set as CoreSetId, n, four: n >= CORE_SET_4 }))
    .sort((a, b) => coreSetIndex(a.set) - coreSetIndex(b.set));
}
/** Tổng hiệu ứng bộ của các hồn hạch đang gắn: bộ đủ 2 món cộng `two`, đủ 4 món cộng thêm `four`. */
export function coreFx(cores: readonly WornCore[]): CoreFx {
  const out: Record<string, number> = {};
  for (const a of activeCoreSets(cores)) {
    const fx = CORE_SET_FX[a.set];
    for (const part of a.four ? [fx.two, fx.four] : [fx.two])
      for (const [k, v] of Object.entries(part)) out[k] = (out[k] ?? 0) + (v as number);
  }
  return out as CoreFx;
}
/**
 * Tổng chỉ số hồn hạch đang gắn trên một võ hồn (chỉ số chính theo sao + dòng phụ), đưa vào calcStats. Kèm phần chỉ số của hiệu
 * ứng bộ: +công của bộ Hạo Thiên 2 món (vào `atk_pct`), +chí mạng của bộ Linh Miêu 2 món (vào `crit`), cùng đơn vị %.
 * Từ 5.3 chỉ số chính tính theo cấp nâng cấp (coreMainValue), dòng phụ đã lưu sẵn giá trị sau nâng cấp.
 */
export function coreBonus(cores: readonly WornCore[]): Record<CoreStat, number> {
  const out = Object.fromEntries(CORE_STAT_IDS.map((k) => [k, 0])) as Record<CoreStat, number>;
  for (const c of cores) {
    out[c.data.main] += coreMainValue(c.data.main, c.stars, c.enhance ?? 0);
    for (const [k, v] of c.data.subs) out[k] += v;
  }
  const fx = coreFx(cores);
  out.atk_pct += (fx.atk ?? 0) * 100; out.crit += (fx.crit ?? 0) * 100;
  for (const k of CORE_STAT_IDS) out[k] = Math.round(out[k] * 10) / 10;
  return out;
}

// ---------- Nâng cấp hồn hạch (mục 5.6, bước 5.3; mọi số đã chốt) ----------
/** Cấp nâng cấp tối đa (+0 đến +15, mục 5.6). */
export const CORE_MAX_ENHANCE = 15;
/**
 * **(đã chốt)** Điểm để lên từ +n lên +(n + 1): CORE_ENHANCE_COST[n]. Cộng dồn: +3 cần 90 điểm, +6 cần 305, +9 cần 710, +12 cần
 * 1.380, +15 cần 2.450 (khoảng 5–6 hồn hạch 6★ cùng bộ, 8 hồn hạch 6★ khác bộ, hay 31 hồn hạch 4★ khác bộ). Một bảng cho mọi sao.
 */
export const CORE_ENHANCE_COST = [20, 30, 40, 55, 70, 90, 110, 135, 160, 190, 220, 260, 300, 350, 420];
/** **(đã chốt)** Điểm gốc một nguyên liệu theo sao 1★..6★ (gấp đôi mỗi sao: sao cao làm nguyên liệu đáng giá hơn nhiều). */
export const CORE_FEED_STAR = [10, 20, 40, 80, 160, 320];
/** **(đã chốt)** Nguyên liệu cùng bộ với hồn hạch được nâng cấp thì điểm gốc ×1,5 (như hồn cốt cùng vị trí ở 4.4). */
export const CORE_FEED_SAME_SET = 1.5;
/** **(đã chốt)** Nguyên liệu đã nâng cấp thì trả lại ngần này phần điểm đã nạp vào nó (cấp của nguyên liệu không mất trắng). */
export const CORE_FEED_CARRY = 0.8;
/** Tối đa ngần này nguyên liệu mỗi lần nâng cấp (chặn message quá lớn). */
export const CORE_FEED_MAX = 20;
/** **(đã chốt)** Mỗi cấp cộng thêm ngần này phần chỉ số chính +0 (+15 = ×2,5). */
export const CORE_ENHANCE_MAIN = 0.1;
/**
 * Cứ mỗi ngần này cấp (+3, +6, +9, +12, +15) tăng 1 dòng phụ ngẫu nhiên (mục 5.6): chưa đủ CORE_MAX_SUBS dòng thì thêm một dòng mới
 * (không trùng chỉ số chính và các dòng có sẵn), đủ rồi thì một dòng có sẵn (chọn đều) cộng thêm một lần tung, cùng khoảng
 * CORE_SUB_ROLL × coreSubMax như lúc rơi (**đã chốt**).
 */
export const CORE_SUB_EVERY = 3;
/** Cấp nâng cấp hợp lệ (số nguyên 0..CORE_MAX_ENHANCE). */
export function coreEnhanceClamp(e: unknown) { return Math.max(0, Math.min(CORE_MAX_ENHANCE, Math.floor(Number(e)) || 0)); }
/** Tổng điểm nâng cấp để đạt +`level` từ +0. */
export function coreEnhanceNeed(level: number) { return CORE_ENHANCE_COST.slice(0, coreEnhanceClamp(level)).reduce((a, x) => a + x, 0); }
/** Cấp nâng cấp ứng với tổng điểm `xp` (cộng dồn từ +0). */
export function coreEnhanceLevel(xp: number) {
  let lv = 0, need = 0;
  while (lv < CORE_MAX_ENHANCE && xp >= need + CORE_ENHANCE_COST[lv]) need += CORE_ENHANCE_COST[lv++];
  return lv;
}
/** Tổng điểm đã nạp vào một hồn hạch (`items.stats.xp`; thiếu / hỏng thì 0, tối đa điểm của +15). */
export function coreXp(stats: unknown) {
  const x = Number((stats as { xp?: unknown } | null)?.xp);
  return Number.isSafeInteger(x) && x > 0 ? Math.min(x, coreEnhanceNeed(CORE_MAX_ENHANCE)) : 0;
}
/** Số lần tăng dòng phụ khi lên từ +`from` tới +`to` (số mốc bội CORE_SUB_EVERY vượt qua). */
export const coreSubRolls = (from: number, to: number) =>
  Math.max(0, Math.floor(coreEnhanceClamp(to) / CORE_SUB_EVERY) - Math.floor(coreEnhanceClamp(from) / CORE_SUB_EVERY));
/**
 * Điểm một nguyên liệu `stars` sao bộ `set` cho hồn hạch bộ `targetSet`: CORE_FEED_STAR theo sao, cùng bộ ×CORE_FEED_SAME_SET, cộng
 * CORE_FEED_CARRY phần điểm đã nạp vào chính nguyên liệu đó.
 */
export function coreFeedXp(mat: { set: unknown; stars: number; xp?: number }, targetSet: unknown) {
  const base = Math.round(CORE_FEED_STAR[clampCoreStars(mat.stars) - 1] * (mat.set === targetSet ? CORE_FEED_SAME_SET : 1));
  return base + Math.floor(Math.max(0, mat.xp ?? 0) * CORE_FEED_CARRY);
}
/**
 * Một lần nâng cấp (hàm thuần: client xem trước, server tính thật): hồn hạch đích (bộ, điểm đã có, số dòng phụ) và các nguyên liệu.
 * `gain` tổng điểm, `from` / `level` cấp trước / sau, `xp` điểm sau khi cộng (kẹp ở +15), `waste` điểm dư bị bỏ ở +15, `rolls` số lần
 * tăng dòng phụ, `adds` trong đó bao nhiêu lần là dòng mới (còn lại tăng dòng có sẵn).
 */
export function coreEnhancePreview(target: { set: unknown; xp: number; subs: number }, mats: { set: unknown; stars: number; xp?: number }[]) {
  const cap = coreEnhanceNeed(CORE_MAX_ENHANCE), gain = mats.reduce((a, m) => a + coreFeedXp(m, target.set), 0);
  const raw = Math.max(0, target.xp) + gain, xp = Math.min(cap, raw), from = coreEnhanceLevel(target.xp), level = coreEnhanceLevel(xp);
  const rolls = coreSubRolls(from, level), adds = Math.min(rolls, Math.max(0, CORE_MAX_SUBS - target.subs));
  return { gain, xp, from, level, waste: raw - xp, rolls, adds };
}
/** Một lần tăng dòng phụ khi nâng cấp: `add` = dòng mới, không thì cộng `v` vào dòng có sẵn (giá trị sau là `to`). */
export interface CoreSubUp { k: CoreStat; v: number; to: number; add: boolean }
/**
 * Tăng dòng phụ `rolls` lần (bước 5.3, CORE_SUB_EVERY): trả dữ liệu mới (không sửa `data`) và từng lần tăng. Số ngẫu nhiên lấy từ
 * `rnd` (server truyền Math.random), nên hàm vẫn thuần.
 */
export function coreUpgradeSubs(data: CoreData, stars: number, rolls: number, rnd: () => number) {
  const subs = data.subs.map(([k, v]) => [k, v] as [CoreStat, number]), ups: CoreSubUp[] = [];
  const pick = <T>(list: readonly T[]) => list[Math.min(list.length - 1, Math.floor(rnd() * list.length))];
  const roll = (k: CoreStat) => coreRound(k, coreSubMax(k, stars) * (CORE_SUB_ROLL[0] + rnd() * (CORE_SUB_ROLL[1] - CORE_SUB_ROLL[0])));
  for (let n = 0; n < rolls; n++) {
    const free = CORE_STAT_IDS.filter((x) => x !== data.main && !subs.some(([y]) => y === x));
    if (subs.length < CORE_MAX_SUBS && free.length) {
      const k = pick(free), v = roll(k);
      subs.push([k, v]); ups.push({ k, v, to: v, add: true });
    } else if (subs.length) {
      const s = pick(subs), v = roll(s[0]);
      s[1] = coreRound(s[0], s[1] + v); ups.push({ k: s[0], v, to: s[1], add: false });
    }
  }
  return { data: { ...data, subs }, ups };
}

// ---------- Dòng phụ hồn cốt (mục 5.5, #187; chủ repo duyệt 2026-10-22 ở #181) ----------
/** Tối đa ngần này dòng phụ trên một hồn cốt: mỗi mốc BONE_ENHANCE_MILESTONES thêm 1 dòng, đủ ở mốc cuối. */
export const BONE_MAX_SUBS = 4;
/**
 * **(đã chốt)** Hệ số mức dòng phụ theo bậc niên hạn của hồn cốt (chỉ số trong TIERS: trắng, vàng, tím, đen, đỏ). Mức lớn nhất
 * một dòng = CORE_STATS[mã].sub × hệ số này (đỏ ngang dòng phụ hồn hạch 6★), giá trị tung đều trong CORE_SUB_ROLL × mức đó.
 */
export const BONE_SUB_K = [0.25, 0.4, 0.55, 0.75, 1];
/**
 * **(đã chốt)** Bộ dòng phụ có thể tung theo vị trí (mã CORE_STATS, không gồm chỉ số chính của vị trí). Hồn cốt giữ vai "kỹ năng
 * là chính": dòng phụ chỉ thêm ở mốc, không tăng thêm dòng có sẵn như hồn hạch.
 */
export const BONE_SUB_POOL: Record<BoneSlot, CoreStat[]> = {
  dau:       ["mp_pct", "hp_pct", "crit_dmg", "atk_pct"],
  than:      ["hp_pct", "mp", "mp_pct", "atk_pct"],
  tay_trai:  ["atk_pct", "crit", "crit_dmg", "hp"],
  tay_phai:  ["atk_pct", "crit", "crit_dmg", "hp"],
  chan_trai: ["hp_pct", "atk", "crit", "mp_pct"],
  chan_phai: ["hp_pct", "atk", "crit", "mp_pct"],
};
/** Mức lớn nhất của dòng phụ `k` trên hồn cốt `years` năm (giá trị tung trong CORE_SUB_ROLL × mức này, đã làm tròn). */
export const boneSubMax = (k: CoreStat, years: number) => CORE_STATS[k].sub * BONE_SUB_K[tierOfYears(years)];
/** Số dòng phụ hồn cốt +`enhance` phải có: một dòng mỗi mốc đã đạt, tối đa BONE_MAX_SUBS. */
export const boneSubsDue = (enhance: number) => Math.min(BONE_MAX_SUBS, boneMilestones(enhance));
/** Dòng phụ của một hồn cốt (`items.stats.subs`, như hồn hạch): bỏ mục hỏng / trùng mã, tối đa BONE_MAX_SUBS; thiếu thì []. */
export function parseBoneSubs(stats: unknown): [CoreStat, number][] {
  const raw = (stats as { subs?: unknown } | null)?.subs, out: [CoreStat, number][] = [];
  if (!Array.isArray(raw)) return out;
  for (const x of raw)
    if (Array.isArray(x) && CORE_STAT_IDS.includes(x[0]) && typeof x[1] === "number" && Number.isFinite(x[1]) && !out.some(([k]) => k === x[0]))
      out.push([x[0], x[1]]);
  return out.slice(0, BONE_MAX_SUBS);
}
/**
 * Thêm dòng phụ cho hồn cốt vị trí `slot`, `years` năm, đang có `subs`, tới đủ boneSubsDue(`enhance`) dòng (cường hóa qua mốc, hay
 * tung bù cho hồn cốt cũ): mỗi dòng mới chọn đều trong BONE_SUB_POOL của vị trí, không trùng dòng đã có và chỉ số chính, giá trị
 * CORE_SUB_ROLL × boneSubMax. Trả danh sách mới (không sửa `subs`) và các dòng vừa thêm (rỗng nếu đã đủ). Số ngẫu nhiên lấy từ
 * `rnd` (server truyền Math.random), nên hàm vẫn thuần.
 */
export function boneAddSubs(slot: unknown, years: number, enhance: number, subs: readonly [CoreStat, number][], rnd: () => number) {
  const s = BONE_SLOTS[boneSlotIndex(slot)], out = subs.map(([k, v]) => [k, v] as [CoreStat, number]), added: [CoreStat, number][] = [];
  if (!s) return { subs: out, added };
  for (let n = boneSubsDue(enhance) - out.length; n > 0; n--) {
    const free = BONE_SUB_POOL[s.id].filter((k) => k !== s.stat && !out.some(([x]) => x === k));
    if (!free.length) break;
    const k = free[Math.min(free.length - 1, Math.floor(rnd() * free.length))];
    const v = coreRound(k, boneSubMax(k, years) * (CORE_SUB_ROLL[0] + rnd() * (CORE_SUB_ROLL[1] - CORE_SUB_ROLL[0])));
    out.push([k, v]); added.push([k, v]);
  }
  return { subs: out, added };
}

// ---------- Kỹ năng hồn cốt (mục 5.5, bước 4.3; mọi số đã chốt) ----------
/** Hiệu ứng có lợi mà kỹ năng bị động cộng thường trực (cùng nghĩa với BUFFS: atk/spd/def/crit/mp/leech). */
export type PassiveBuff = "atk" | "spd" | "def" | "crit" | "mp" | "leech";
/**
 * Kỹ năng bị động của hồn cốt thân / chân: `buff` cộng thường trực như hiệu ứng có lợi cùng tên (công, tốc chạy, giảm sát thương
 * nhận, chí mạng, giảm tiêu hao hồn lực, hút máu); `resist`: trạng thái trên hồn sư (PLAYER_STATUS) ngắn đi ngần ấy phần thời gian.
 * Số trong bảng là mức gốc, nhân buffPower(số năm hồn cốt).
 */
export interface BonePassiveDef { name: string; desc: string; buff?: Partial<Record<PassiveBuff, number>>; resist?: Partial<Record<StatusId, number>>; }
/** Kỹ năng của hồn cốt một loài: `active` cho đầu / tay trái / tay phải (SkillDef, chạy bằng cùng bộ máy với hồn kỹ), `passive` cho thân / hai chân. */
export interface BoneSkillSet { active: SkillDef; passive: BonePassiveDef; }
/** Kỹ năng chủ động mặc định: tốn 18 hồn lực, hồi 10 giây (đã chốt); `icon` là chữ trên nút như hồn kỹ. */
const ba = (name: string, desc: string, icon: string, area: SkillArea, r: number, dmg: number, o: Partial<SkillDef> = {}): SkillDef =>
  ({ name, desc, icon, cost: 18, cd: 10, area, r, dmg, ...o });
const bp = (name: string, desc: string, o: Omit<BonePassiveDef, "name" | "desc">): BonePassiveDef => ({ name, desc, ...o });
/**
 * **(đã chốt)** Kỹ năng hồn cốt theo LOÀI hồn thú gốc (mã trong BEASTS), mỗi loài 1 kỹ năng chủ động (cùng một kỹ năng cho đầu,
 * tay trái, tay phải) và 1 bị động (cùng một kỹ năng cho thân, chân trái, chân phải). Chủ động lấy từ chiêu báo trước của loài đó
 * (BEAST_SKILLS, ví dụ Mạn Đà La Xà phun độc, Ám Kim Khủng Trảo Hùng vỗ đất); loài dưới 1.000 năm (Thánh Hồn Thôn, chỉ có hồn
 * cốt qua hook / rương sau này) tự đặt theo con vật. Sức mạnh: chủ động nhân skillPower(số năm hồn cốt) như hồn kỹ, bị động
 * nhân buffPower(số năm). Gắn nhiều hồn cốt cùng loài thì mỗi ô một nút / cộng dồn bị động (tới BONE_PASSIVE_CAP).
 * Thêm loài mới vào BEASTS thì thêm một mục ở đây; loài không có mục thì hồn cốt chỉ cộng chỉ số.
 */
export const BONE_SKILLS: Record<string, BoneSkillSet> = {
  phong_lang: { active: ba("Phong Lang Vồ", "Lao tới trước, cắn xé hồn thú trên đường", "➤", "dash", 70, 2, { inv: 0.25 }),
    passive: bp("Phong Bộ", "Tốc chạy tăng", { buff: { spd: 0.06 } }) },
  man_da_la_xa: { active: ba("Mạn Đà La Phun Độc", "Phun độc vào hồn thú gần nhất: Trúng độc 2 tầng", "☣", "target", 100, 1.4, { status: [{ s: "poison", n: 2 }] }),
    passive: bp("Xà Huyết", "Kháng Trúng độc", { resist: { poison: 0.3 } }) },
  tu_van_bao: { active: ba("Tử Văn Vồ Nhanh", "Lướt chớp nhoáng, +20% chí mạng", "➹", "dash", 80, 1.8, { crit: 0.2, inv: 0.3, cd: 8 }),
    passive: bp("Báo Nhãn", "Tỉ lệ chí mạng tăng", { buff: { crit: 0.04 } }) },
  quy_dang: { active: ba("Quỷ Đằng Rễ Trói", "Rễ cây trồi lên dưới hồn thú gần nhất: Trói 1,5 giây", "❦", "target", 110, 1.2, { status: [{ s: "root", secs: 1.5 }] }),
    passive: bp("Hút Nhựa", "Hút máu từ mọi sát thương gây ra", { buff: { leech: 0.03 } }) },
  loi_van_hau: { active: ba("Lôi Văn Gọi Sét", "Gọi sét xuống hồn thú gần nhất: Cảm điện", "ϟ", "around", 30, 1.6, { at: 130, status: [{ s: "shock" }] }),
    passive: bp("Lôi Văn Bì", "Kháng Cảm điện", { resist: { shock: 0.35 } }) },
  quy_ho: { active: ba("Quỷ Hổ Vồ Lao", "Vồ lao một đoạn dài, xé toạc hồn thú trên đường", "➤", "dash", 110, 2.2, { inv: 0.3, cd: 11 }),
    passive: bp("Hổ Uy", "Công tăng", { buff: { atk: 0.05 } }) },
  nhan_dien_ma_chu: { active: ba("Ma Chu Phun Tơ", "Phun tơ vào hồn thú gần nhất: Trói 1,5 giây, Làm chậm", "✳", "target", 110, 1, { status: [{ s: "root", secs: 1.5 }, { s: "slow", secs: 3 }] }),
    passive: bp("Ma Chu Túc", "Kháng Trói", { resist: { root: 0.35 } }) },
  u_minh_lang: { active: ba("U Minh Ảnh Vồ", "Hóa bóng lao tới, +15% chí mạng", "☾", "dash", 95, 2, { crit: 0.15, inv: 0.3 }),
    passive: bp("Ảnh Bộ", "Tốc chạy tăng", { buff: { spd: 0.05 } }) },
  am_kim_khung_trao_hung: { active: ba("Ám Kim Vỗ Đất", "Vỗ đất quanh thân: choáng 0,8 giây", "✺", "around", 56, 2.4, { status: [{ s: "stun", secs: 0.8 }], shake: true, cd: 12, cost: 22 }),
    passive: bp("Ám Kim Bì", "Giảm sát thương nhận", { buff: { def: 0.06 } }) },
  kiem_vi_hat: { active: ba("Kiếm Vĩ Đâm", "Đuôi kiếm đâm hồn thú gần nhất: Phá giáp 2 tầng", "†", "target", 60, 1.8, { dash: 20, status: [{ s: "armor", n: 2 }] }),
    passive: bp("Hạt Giáp", "Tỉ lệ chí mạng tăng", { buff: { crit: 0.05 } }) },
  quy_anh_bao: { active: ba("Quỷ Ảnh Trảm", "Chém nửa trước mặt, +15% chí mạng", "≋", "front", 54, 2.2, { crit: 0.15 }),
    passive: bp("Quỷ Ảnh", "Tốc chạy tăng", { buff: { spd: 0.06 } }) },
  xich_lan_mang: { active: ba("Xích Lân Quấn Siết", "Quấn siết quanh thân: Trói 1,5 giây", "◎", "around", 40, 1.4, { status: [{ s: "root", secs: 1.5 }] }),
    passive: bp("Xích Lân Giáp", "Kháng Choáng", { resist: { stun: 0.3 } }) },
  nhu_cot_tho_hoang: { active: ba("Thỏ Nhảy", "Bật nhảy tới trước, bất tử thoáng chốc", "➶", "dash", 60, 1.2, { inv: 0.4, cd: 8, cost: 12 }),
    passive: bp("Thỏ Túc", "Tốc chạy tăng", { buff: { spd: 0.05 } }) },
  dien_thu: { active: ba("Điền Thử Gặm", "Gặm hồn thú gần nhất: Phá giáp 1 tầng", "◆", "target", 40, 1.5, { status: [{ s: "armor" }], cost: 12 }),
    passive: bp("Tích Trữ", "Giảm tiêu hao hồn lực", { buff: { mp: 0.05 } }) },
  hoi_vu_tuoc: { active: ba("Vũ Tiễn", "Bắn 3 mũi lông vũ tỏa quạt", "✶", "proj", 110, 1, { n: 3, spread: 30, cost: 14 }),
    passive: bp("Khinh Vũ", "Tốc chạy tăng", { buff: { spd: 0.04 } }) },
  phong_lang_con: { active: ba("Lang Nha", "Cắn hồn thú gần nhất", "▼", "target", 40, 1.6, { dash: 20, cost: 12 }),
    passive: bp("Lang Tính", "Tỉ lệ chí mạng tăng", { buff: { crit: 0.03 } }) },
  doc_cham_phong: { active: ba("Độc Châm", "Bắn kim độc: Trúng độc 2 tầng", "➶", "proj", 120, 1.2, { status: [{ s: "poison", n: 2 }], cost: 14 }),
    passive: bp("Phong Độc", "Kháng Trúng độc", { resist: { poison: 0.3 } }) },
  thiet_giap_xuyen_son_giap: { active: ba("Cuộn Giáp", "Cuộn tròn: khiên 15% sinh lực 5 giây, hất văng hồn thú sát thân", "⛨", "around", 30, 1, { push: 24, self: { shield: 0.15, secs: 5 } }),
    passive: bp("Thiết Giáp", "Giảm sát thương nhận", { buff: { def: 0.05 } }) },
  hac_boi_da_tru: { active: ba("Dã Trư Húc", "Húc tới trước, đẩy lùi hồn thú", "➤", "dash", 80, 1.6, { push: 30 }),
    passive: bp("Dã Tính", "Công tăng", { buff: { atk: 0.04 } }) },
  thanh_lan_xa: { active: ba("Thanh Lân Cắn Độc", "Cắn hồn thú gần nhất: Trúng độc", "☣", "target", 50, 1.2, { status: [{ s: "poison" }], cost: 12 }),
    passive: bp("Thanh Lân", "Kháng Trúng độc", { resist: { poison: 0.25 } }) },
  quy_dang_non: { active: ba("Roi Mây", "Quất nửa trước mặt: Làm chậm", "∿", "front", 40, 1.4, { status: [{ s: "slow" }], cost: 12 }),
    passive: bp("Nhựa Non", "Hút máu từ mọi sát thương gây ra", { buff: { leech: 0.02 } }) },
  thanh_lan_ngac: { active: ba("Thanh Lân Táp Ngang", "Táp ngang nửa trước mặt", "◣", "front", 46, 2.2),
    passive: bp("Ngạc Giáp", "Giảm sát thương nhận", { buff: { def: 0.05 } }) },
  kim_linh_ung: { active: ba("Kim Linh Bổ Nhào", "Bổ nhào xuống hồn thú gần nhất", "▾", "around", 28, 2, { at: 110, dash: 110 }),
    passive: bp("Ưng Nhãn", "Tỉ lệ chí mạng tăng", { buff: { crit: 0.04 } }) },
  nhan_dien_ma_chu_non: { active: ba("Giăng Tơ", "Giăng lưới quanh hồn thú gần nhất: Làm chậm 3 giây", "✳", "around", 34, 0.8, { at: 110, status: [{ s: "slow", secs: 3 }], cost: 14 }),
    passive: bp("Tơ Nhện", "Kháng Làm chậm", { resist: { slow: 0.35 } }) },
  liet_trao_hung: { active: ba("Liệt Trảo Vỗ Đất", "Vỗ đất quanh thân", "✺", "around", 48, 2, { shake: true }),
    passive: bp("Hùng Lực", "Công tăng", { buff: { atk: 0.05 } }) },
  thiet_giap_te_nguu: { active: ba("Tê Ngưu Xung Phong", "Xung phong một đoạn dài, đẩy lùi hồn thú", "➤", "dash", 130, 2, { push: 30, inv: 0.3, cd: 12 }),
    passive: bp("Tê Giáp", "Giảm sát thương nhận", { buff: { def: 0.07 } }) },
  that_tinh_doc_thiem: { active: ba("Thất Tinh Phun Độc", "Phun độc trùm hồn thú gần nhất: Trúng độc 3 tầng", "☣", "around", 34, 1.1, { at: 120, status: [{ s: "poison", n: 3 }] }),
    passive: bp("Độc Thể", "Kháng Trúng độc", { resist: { poison: 0.4 } }) },
  hac_vu_bien_buc: { active: ba("Âm Ba", "Sóng âm nửa trước mặt: Câm lặng 2 giây", "≈", "front", 64, 1.2, { status: [{ s: "silence", secs: 2 }] }),
    passive: bp("Hút Huyết", "Hút máu từ mọi sát thương gây ra", { buff: { leech: 0.04 } }) },
  lam_loi_te_nguu: { active: ba("Lam Lôi Xung", "Mang sét xung phong: Cảm điện", "ϟ", "dash", 130, 1.9, { status: [{ s: "shock" }], inv: 0.3, cd: 12 }),
    passive: bp("Lam Lôi Giáp", "Kháng Cảm điện", { resist: { shock: 0.4 } }) },
  loi_duc_ung: { active: ba("Lôi Bạo", "Sét nổ trên hồn thú gần nhất: Cảm điện", "ϟ", "around", 34, 1.8, { at: 130, status: [{ s: "shock" }] }),
    passive: bp("Lôi Dực", "Tốc chạy tăng", { buff: { spd: 0.06 } }) },
  // Lạc Nhật Sâm Lâm (BĐ6b): chủ động theo chiêu báo trước của loài; trên hồn thú Mê hoặc có thật nên Phấn Mê / Hương Mê gây Mê hoặc.
  thuc_nhan_hoa: { active: ba("Thực Nhân Phấn Mê", "Rắc phấn quanh thân: Mê hoặc 1,5 giây", "✿", "around", 44, 1.2, { status: [{ s: "charm", secs: 1.5 }] }),
    passive: bp("Hoa Căn", "Hút máu từ mọi sát thương gây ra", { buff: { leech: 0.03 } }) },
  cuc_yeu_hoa_linh: { active: ba("Phi Hoa", "Cánh hoa quét nửa trước mặt", "❀", "front", 60, 2),
    passive: bp("Hoa Linh", "Tỉ lệ chí mạng tăng", { buff: { crit: 0.04 } }) },
  doc_cuc_dang: { active: ba("Độc Cức Gai Trồi", "Gai trồi dưới hồn thú gần nhất: Phá giáp 1 tầng", "⋔", "target", 100, 1.8, { status: [{ s: "armor" }] }),
    passive: bp("Gai Độc", "Kháng Trúng độc", { resist: { poison: 0.3 } }) },
  bich_lan_xa: { active: ba("Bích Lân Phun Độc", "Phun độc vào hồn thú gần nhất: Trúng độc 2 tầng", "☣", "target", 110, 1.5, { status: [{ s: "poison", n: 2 }] }),
    passive: bp("Bích Lân Huyết", "Kháng Trúng độc", { resist: { poison: 0.4 } }) },
  doc_vu_thiem: { active: ba("Độc Vụ", "Sương độc trùm hồn thú gần nhất: Trúng độc 3 tầng", "☁", "around", 34, 1.1, { at: 120, status: [{ s: "poison", n: 3 }] }),
    passive: bp("Thiềm Bì", "Giảm sát thương nhận", { buff: { def: 0.05 } }) },
  hac_thuy_mang: { active: ba("Hắc Thủy Quật Đuôi", "Quật đuôi nửa trước mặt", "∿", "front", 56, 2.3),
    passive: bp("Mãng Lực", "Công tăng", { buff: { atk: 0.05 } }) },
  liet_hoa_tich_dich: { active: ba("Liệt Hỏa Phun", "Phun lửa nửa trước mặt: Thiêu đốt 2 tầng", "♨", "front", 58, 1.6, { status: [{ s: "burn", n: 2 }] }),
    passive: bp("Hỏa Lân", "Kháng Thiêu đốt", { resist: { burn: 0.35 } }) },
  huyen_bang_thiem: { active: ba("Huyền Băng Khí", "Hàn khí trùm hồn thú gần nhất: Làm chậm 3 giây", "❄", "around", 34, 1.2, { at: 120, status: [{ s: "slow", secs: 3 }] }),
    passive: bp("Hàn Thể", "Kháng Làm chậm", { resist: { slow: 0.35 } }) },
  hoa_linh_diep: { active: ba("Hỏa Điệp Bạo", "Nổ lửa quanh thân: Thiêu đốt", "✹", "around", 40, 2.4, { status: [{ s: "burn" }], shake: true }),
    passive: bp("Điệp Vũ", "Tốc chạy tăng", { buff: { spd: 0.06 } }) },
  co_moc_thu_nhan: { active: ba("Cổ Mộc Dậm Rễ", "Dậm rễ quanh thân: Trói 1 giây", "✺", "around", 56, 2.2, { status: [{ s: "root", secs: 1 }], shake: true, cd: 12, cost: 22 }),
    passive: bp("Mộc Giáp", "Giảm sát thương nhận", { buff: { def: 0.07 } }) },
  y_la_hoa_yeu: { active: ba("Ỷ La Hương Mê", "Hương hoa nửa trước mặt: Mê hoặc 2 giây", "❁", "front", 60, 1.2, { status: [{ s: "charm", secs: 2 }] }),
    passive: bp("Ỷ La Hương", "Giảm tiêu hao hồn lực", { buff: { mp: 0.06 } }) },
  thanh_lan_doc_co: { active: ba("Thanh Lân Độc Châm", "Bắn kim độc: Trúng độc 2 tầng", "➶", "proj", 120, 1.6, { status: [{ s: "poison", n: 2 }] }),
    passive: bp("Độc Cổ", "Tỉ lệ chí mạng tăng", { buff: { crit: 0.05 } }) },
  // Cực Bắc Chi Địa (BĐ6c): "đóng băng" lên hồn thú là Choáng như chiêu báo trước của loài.
  tuyet_lang: { active: ba("Tuyết Lang Băng Nha", "Lao tới trước, răng băng cắn hồn thú trên đường: Làm chậm", "➤", "dash", 90, 2, { inv: 0.25, status: [{ s: "slow" }] }),
    passive: bp("Tuyết Bộ", "Tốc chạy tăng", { buff: { spd: 0.06 } }) },
  bang_nguyen_cu_tuong: { active: ba("Cự Tượng Dậm Băng", "Dậm băng quanh thân: Làm chậm 3 giây", "✺", "around", 52, 2, { status: [{ s: "slow", secs: 3 }], shake: true, cd: 12, cost: 22 }),
    passive: bp("Cự Tượng Bì", "Giảm sát thương nhận", { buff: { def: 0.07 } }) },
  bang_vu_ung: { active: ba("Băng Vũ Bổ Nhào", "Bổ nhào xuống hồn thú gần nhất", "▾", "around", 30, 2.1, { at: 120, dash: 120 }),
    passive: bp("Băng Vũ", "Tỉ lệ chí mạng tăng", { buff: { crit: 0.05 } }) },
  bang_giap_cu_quy: { active: ba("Cự Quy Xoay Vỏ", "Xoay vỏ lao tới trước: khiên 15% sinh lực 5 giây", "⛨", "dash", 110, 1.8, { inv: 0.3, self: { shield: 0.15, secs: 5 }, cd: 12 }),
    passive: bp("Băng Giáp", "Giảm sát thương nhận", { buff: { def: 0.08 } }) },
  tuyet_vi_yeu_ho: { active: ba("Yêu Hồ Mị Ảnh", "Ảo ảnh mê hoặc quanh hồn thú gần nhất: Mị hoặc 2 tầng", "✿", "around", 34, 1.5, { at: 120, status: [{ s: "allure", n: 2 }] }),
    passive: bp("Hồ Mị", "Kháng Choáng", { resist: { stun: 0.3 } }) },
  bang_tinh_hat: { active: ba("Băng Tinh Châm", "Bắn kim băng: Phá giáp 1 tầng", "➶", "proj", 120, 1.6, { status: [{ s: "armor" }] }),
    passive: bp("Băng Tinh Giáp", "Tỉ lệ chí mạng tăng", { buff: { crit: 0.05 } }) },
  han_bang_dia_long: { active: ba("Địa Long Phun Băng", "Phun băng nửa trước mặt: Choáng 0,8 giây (đóng băng)", "❄", "front", 54, 2, { status: [{ s: "stun", secs: 0.8 }], cd: 12, cost: 22 }),
    passive: bp("Hàn Long Lân", "Kháng Làm chậm", { resist: { slow: 0.4 } }) },
  bang_phong_bach_hung: { active: ba("Bạch Hùng Vỗ Đất", "Vỗ đất quanh thân", "✺", "around", 56, 2.4, { shake: true, cd: 11 }),
    passive: bp("Bạch Hùng Lực", "Công tăng", { buff: { atk: 0.06 } }) },
  han_nguyet_ung: { active: ba("Hàn Nguyệt Phong", "Lưỡi gió trăng lạnh bay thẳng", "☾", "proj", 140, 1.9, { crit: 0.15 }),
    passive: bp("Nguyệt Dực", "Tốc chạy tăng", { buff: { spd: 0.06 } }) },
  bang_bich_hat: { active: ba("Băng Bích Châm", "Đuôi băng đâm hồn thú gần nhất: Choáng 1 giây (đóng băng)", "†", "target", 70, 2, { dash: 20, status: [{ s: "stun", secs: 1 }], cd: 12 }),
    passive: bp("Băng Bích Giáp", "Kháng Choáng", { resist: { stun: 0.35 } }) },
  huyen_minh_bang_tam: { active: ba("Nhả Tơ Băng", "Phun tơ băng vào hồn thú gần nhất: Trói 1,5 giây", "✳", "target", 110, 1.2, { status: [{ s: "root", secs: 1.5 }] }),
    passive: bp("Huyền Minh Tơ", "Giảm tiêu hao hồn lực", { buff: { mp: 0.06 } }) },
  tuyet_ma_vien: { active: ba("Ném Băng Khối", "Ném khối băng xuống hồn thú gần nhất", "◆", "around", 32, 2.2, { at: 150, shake: true }),
    passive: bp("Ma Viên Lực", "Công tăng", { buff: { atk: 0.05 } }) },
  // Hải Thần Đảo (BĐ6d): chủ động theo chiêu báo trước của loài (hồn hoàn / hồn cốt 50.000 năm trở lên nên bội số cao hơn rừng);
  // trên hồn thú Mê hoặc có thật nên Mê Ca gây Mê hoặc.
  thiet_giap_cu_giai: { active: ba("Cự Giải Kìm Kẹp", "Kẹp nửa trước mặt: Phá giáp 1 tầng", "✂", "front", 50, 2.2, { status: [{ s: "armor" }] }),
    passive: bp("Thiết Giáp", "Giảm sát thương nhận", { buff: { def: 0.08 } }) },
  lam_lan_hai_xa: { active: ba("Thủy Tiễn", "Bắn tên nước xuyên thẳng", "➵", "proj", 130, 2),
    passive: bp("Lam Lân", "Tốc chạy tăng", { buff: { spd: 0.07 } }) },
  kiem_ngu: { active: ba("Kiếm Ngư Xuyên Kích", "Lao xuyên về phía trước, đâm mọi hồn thú trên đường", "➳", "dash", 90, 2.3, { inv: 0.3 }),
    passive: bp("Kiếm Vây", "Tỉ lệ chí mạng tăng", { buff: { crit: 0.06 } }) },
  quy_dien_hai_yeu: { active: ba("Mê Ca", "Tiếng hát nửa trước mặt: Mê hoặc 2 giây", "♫", "front", 62, 1.4, { status: [{ s: "charm", secs: 2 }] }),
    passive: bp("Hải Yêu Ca", "Giảm tiêu hao hồn lực", { buff: { mp: 0.08 } }) },
  tham_hai_ma_chuong: { active: ba("Xúc Tu Quật", "Xúc tu quật quanh thân: Làm chậm 2 giây", "✴", "around", 50, 2.2, { status: [{ s: "slow", secs: 2 }] }),
    passive: bp("Ma Chương Hấp", "Hút máu từ mọi sát thương gây ra", { buff: { leech: 0.04 } }) },
  loi_quang_hai_dieu: { active: ba("Điện Lưu", "Phóng điện quanh thân: Cảm điện", "ϟ", "around", 50, 2, { status: [{ s: "shock" }] }),
    passive: bp("Lôi Quang", "Kháng Cảm điện", { resist: { shock: 0.45 } }) },
  kim_lan_long_quy: { active: ba("Sóng Cuộn", "Sóng lớn nửa trước mặt, hất lùi hồn thú", "≋", "front", 64, 2.2, { push: 40 }),
    passive: bp("Long Quy Giáp", "Giảm sát thương nhận", { buff: { def: 0.1 } }) },
  huyet_nha_cu_sa: { active: ba("Huyết Nha Lao Cắn", "Lao tới hồn thú gần nhất mà cắn: Phá giáp 2 tầng", "⚔", "target", 100, 2.5, { dash: 80, status: [{ s: "armor", n: 2 }] }),
    passive: bp("Huyết Nha", "Công tăng", { buff: { atk: 0.07 } }) },
  loi_van_hai_ung: { active: ba("Lôi Bổ", "Sét bổ xuống hồn thú gần nhất: Cảm điện", "☇", "around", 34, 2.2, { at: 130, status: [{ s: "shock" }] }),
    passive: bp("Lôi Vân Dực", "Tốc chạy tăng", { buff: { spd: 0.08 } }) },
  tham_hai_ma_kinh: { active: ba("Ma Kình Quật Đuôi", "Quật đuôi nửa trước mặt, rung đất", "∿", "front", 64, 2.8, { shake: true, cd: 12, cost: 24 }),
    passive: bp("Ma Kình Thể", "Công tăng", { buff: { atk: 0.08 } }) },
  u_linh_hai_mau: { active: ba("U Linh Độc Điện", "Xúc tu độc điện quanh thân: Trúng độc 2 tầng, Cảm điện", "☣", "around", 48, 1.8, { status: [{ s: "poison", n: 2 }, { s: "shock" }] }),
    passive: bp("U Linh", "Kháng Trúng độc", { resist: { poison: 0.45 } }) },
  // BĐ6e: hồn cốt boss thế giới (chỉ có trong rương boss thế giới).
  thai_than_cu_vien: { active: ba("Thái Thản Chấn Địa", "Đấm xuống đất quanh thân: Choáng 1 giây", "✊", "around", 70, 2.8, { status: [{ s: "stun", secs: 1 }], shake: true, cd: 14, cost: 26 }),
    passive: bp("Thái Thản Lực", "Công tăng", { buff: { atk: 0.08 } }) },
  thien_thanh_nguu_mang: { active: ba("Thanh Mãng Giác Xung", "Lao sừng một đoạn dài: Trúng độc 3 tầng", "➤", "dash", 120, 2.6, { status: [{ s: "poison", n: 3 }], inv: 0.3, cd: 12, cost: 24 }),
    passive: bp("Thanh Lân Giáp", "Giảm sát thương nhận", { buff: { def: 0.08 } }) },
};
/** 3 vị trí có kỹ năng chủ động theo thứ tự nút (đầu, tay trái, tay phải): chỉ số i của message `boneskill {i}` và `PlayerState.bcds`. */
export const BONE_ACTIVE_SLOTS: BoneSlot[] = BONE_SLOTS.filter((s) => s.active).map((s) => s.id);
/** Bị động của nhiều hồn cốt cộng dồn, mỗi loại tối đa ngần này (đã chốt). */
export const BONE_PASSIVE_CAP: Record<PassiveBuff, number> & { resist: number } = { atk: 0.25, spd: 0.25, def: 0.3, crit: 0.15, mp: 0.3, leech: 0.12, resist: 0.8 };
export const PASSIVE_NAMES: Record<PassiveBuff, string> = { atk: "Công", spd: "Tốc chạy", def: "Giảm sát thương nhận", crit: "Chí mạng", mp: "Giảm tiêu hao hồn lực", leech: "Hút máu" };
/** Kỹ năng của hồn cốt loài `beast` ở vị trí `slot`: chủ động (đầu, hai tay) hoặc bị động (thân, hai chân); loài / vị trí lạ: null. */
export function boneSkillOf(beast: string, slot: unknown): { active: true; sk: SkillDef } | { active: false; ps: BonePassiveDef } | null {
  const set = BONE_SKILLS[beast], s = BONE_SLOTS[boneSlotIndex(slot)]; if (!set || !s) return null;
  return s.active ? { active: true, sk: set.active } : { active: false, ps: set.passive };
}
/** Hiệu ứng bị động đang có (đã nhân buffPower và kẹp BONE_PASSIVE_CAP). */
export interface BonePassive { buff: Partial<Record<PassiveBuff, number>>; resist: Partial<Record<StatusId, number>>; }
/**
 * Cộng bị động của các hồn cốt thân / chân đang gắn trên một võ hồn (vị trí chủ động và loài không có kỹ năng thì bỏ qua); mức của
 * mỗi hồn cốt nhân buffPower(số năm) × boneSkillMult(cường hóa, từ 4.4).
 */
export function bonePassive(bones: { beast: string; slot: unknown; years: number; enhance?: number }[]): BonePassive {
  const out: BonePassive = { buff: {}, resist: {} };
  for (const b of bones) {
    const k = boneSkillOf(b.beast, b.slot); if (!k || k.active) continue;
    const pow = buffPower(b.years) * boneSkillMult(b.enhance ?? 0);
    for (const [x, v] of Object.entries(k.ps.buff ?? {}) as [PassiveBuff, number][]) out.buff[x] = Math.min(BONE_PASSIVE_CAP[x], (out.buff[x] ?? 0) + v * pow);
    for (const [x, v] of Object.entries(k.ps.resist ?? {}) as [StatusId, number][]) out.resist[x] = Math.min(BONE_PASSIVE_CAP.resist, (out.resist[x] ?? 0) + v * pow);
  }
  for (const o of [out.buff, out.resist] as Record<string, number>[]) for (const x in o) o[x] = +o[x].toFixed(4);
  return out;
}
const pctTxt = (v: number) => `${(Math.round(v * 1000) / 10).toLocaleString("vi-VN")}%`;
/** Mô tả hiệu ứng bị động với số thật (tooltip, bảng hồn cốt): "Giảm sát thương nhận 7,6%", "Kháng Trúng độc: thời gian −38%". */
export function passiveText(p: { buff?: Partial<Record<PassiveBuff, number>>; resist?: Partial<Record<StatusId, number>> }, mult = 1) {
  return [...Object.entries(p.buff ?? {}).map(([k, v]) => `${PASSIVE_NAMES[k as PassiveBuff]} ${k === "def" || k === "mp" ? "" : "+"}${pctTxt(v * mult)}`),
    ...Object.entries(p.resist ?? {}).map(([k, v]) => `Kháng ${STATUS[k as StatusId].name}: thời gian −${pctTxt(v * mult)}`)].join(", ");
}

// ---------- Túi đồ, vật phẩm và Hồn Tệ (mục 5.7, bước 3.1; mọi số dưới đây đã chốt) ----------
/** Nhóm vật phẩm (cột `items.kind`). Có đan, hồn hoàn, mảnh võ hồn (3.4), hồn cốt (4.1), hồn hạch (5.1), rương thú vương (BĐ5), tiên thảo (BĐ6b, HERBS). */
export type ItemKind = "dan" | "hon_hoan" | "hon_cot" | "hon_hach" | "manh_vo_hon" | "tien_thao" | "ruong" | "phu" | "lenh";
export const ITEM_KINDS: Record<ItemKind, { name: string }> = {
  dan: { name: "Đan dược" },
  hon_hoan: { name: "Hồn hoàn" },
  hon_cot: { name: "Hồn cốt" },
  hon_hach: { name: "Hồn hạch" },
  manh_vo_hon: { name: "Mảnh võ hồn" },
  tien_thao: { name: "Tiên thảo" },
  ruong: { name: "Rương" }, // BĐ5: rương tà hóa thú vương
  phu: { name: "Phù chú" }, // 11.2: Hồi Thành Phù
  lenh: { name: "Lệnh bài" }, // Auto 2: Ủy Thác Lệnh
};
/**
 * Một loại vật phẩm. `id` là mã cố định (cột `items.code`), không đổi mã đã dùng. `stack`: số món tối đa trong một ô
 * (1 = không gộp, mỗi món một ô như hồn hoàn có số năm riêng). `cd`: nhóm hồi chiêu dùng chung (DAN_CD).
 * `hp` / `mp`: dùng thì hồi ngần ấy phần sinh lực tối đa của võ hồn ra trận / hồn lực tối đa.
 * `auto`: dùng thì cộng ngần ấy giây treo tự săn (Ủy Thác Lệnh, mục 5.13).
 */
export interface ItemDef { id: string; kind: ItemKind; name: string; desc: string; col: string; stack: number; cd?: "dan"; hp?: number; mp?: number; vohon?: string; boss?: string; recall?: true; auto?: number; }

// ---------- Tiên thảo (mục 5.3 "Lạc Nhật Sâm Lâm", 5.7; bước BĐ6b, mọi số đã chốt) ----------
/**
 * Tiên thảo: chỉ rơi ở bản đồ có MapDef.herbs (Lạc Nhật Sâm Lâm). Dùng cho MỘT võ hồn (nút "Dùng cho…" trong túi đồ) thì võ hồn đó
 * tăng vĩnh viễn HERB_PCT % chỉ số `stat` (sinh lực / hồn lực / công gốc, cộng chung với % cộng minh và dòng % hồn hạch trong
 * calcStats), mỗi loại tối đa HERB_MAX cây mỗi võ hồn (+10%). Số cây đã dùng lưu ở `vohons.herbs` (013_tien_thao.sql) theo mã.
 * Mã cố định (cột `items.code` và khóa trong `vohons.herbs`), chỉ thêm vào cuối.
 */
export interface HerbDef { id: string; name: string; stat: ResStat; col: string; }
export const HERBS: HerbDef[] = [
  { id: "y_la_uat_kim_huong",       name: "Ỷ La Uất Kim Hương",       stat: "hp",  col: "#ffd45a" },
  { id: "bat_giac_huyen_bang_thao", name: "Bát Giác Huyền Băng Thảo", stat: "mp",  col: "#8fe0ff" },
  { id: "liet_hoa_hanh_kieu_so",    name: "Liệt Hỏa Hạnh Kiều Sơ",    stat: "atk", col: "#ff7a3a" },
];
/** % chỉ số mỗi cây và số cây tối đa mỗi loại trên một võ hồn (đã chốt: +1% mỗi cây, tối đa 10 cây = +10%). */
export const HERB_PCT = 1;
export const HERB_MAX = 10;
/** Tinh anh rơi tiên thảo với tỉ lệ x HERB_ELITE (tối đa 100%), như hồn cốt x ELITE.bone. Thú vương không rơi tiên thảo (chỉ rương). */
export const HERB_ELITE = 3;
// RES_STAT_NAMES khai báo sau ITEMS (mục Cộng minh), nên mô tả vật phẩm dùng bảng tên riêng này lúc nạp module.
const HERB_STAT_NAMES: Record<ResStat, string> = { hp: "sinh lực", mp: "hồn lực", atk: "công" };
export const herbDef = (code: unknown) => HERBS.find((h) => h.id === code);
/** Tỉ lệ rơi tiên thảo khi hạ hồn thú ở vùng tên `zone` của bản đồ `mapId` (0 nếu bản đồ / vùng không rơi). */
export const herbChance = (mapId: string, zone: string | undefined, elite = false) =>
  Math.min(1, (zone ? MAPS[mapId]?.herbs?.[zone] ?? 0 : 0) * (elite ? HERB_ELITE : 1));
/** Đọc `vohons.herbs` (JSON mã -> số cây) an toàn: bỏ mã lạ, kẹp 0..HERB_MAX. */
export function parseHerbs(x: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (x && typeof x === "object") for (const h of HERBS) {
    const n = Math.max(0, Math.min(HERB_MAX, Math.floor(Number((x as Record<string, unknown>)[h.id])) || 0));
    if (n) out[h.id] = n;
  }
  return out;
}
/** % cộng của tiên thảo đã dùng trên một võ hồn (tham số `herbs` của calcStats). */
export function herbBonus(herbs: Record<string, number> | undefined): Record<ResStat, number> {
  const out: Record<ResStat, number> = { hp: 0, mp: 0, atk: 0 };
  for (const h of HERBS) out[h.stat] += Math.min(HERB_MAX, herbs?.[h.id] ?? 0) * HERB_PCT;
  return out;
}
/** "+3% Sinh lực, +1% Công" (bỏ chỉ số 0); rỗng nếu chưa dùng cây nào. */
export const herbText = (herbs: Record<string, number> | undefined) => {
  const b = herbBonus(herbs);
  return (Object.keys(b) as ResStat[]).filter((k) => b[k]).map((k) => `+${b[k]}% ${RES_STAT_NAMES[k]}`).join(", ");
};

/**
 * Ủy Thác Lệnh (Auto 2, mục 5.13; khai báo trước ITEMS vì mô tả vật phẩm dùng số này): mã AUTO_TOKEN, thương nhân trong thành bán
 * AUTO_TOKEN_PRICE đồng. Dùng thì cộng AUTO_TOKEN_SECS giây vào quỹ giờ treo cộng thêm (`auto_hunt.bonus_secs`), tích tối đa
 * AUTO_BONUS_MAX giây (đầy thì không dùng được). Quỹ này không đặt lại theo ngày, chỉ tiêu khi đã treo hết AUTO_DAILY_SECS của hôm nay.
 */
export const AUTO_TOKEN = "uy_thac_lenh";
export const AUTO_TOKEN_SECS = 2 * 3600;
export const AUTO_TOKEN_PRICE = 500;
export const AUTO_BONUS_MAX = 24 * 3600;
export const ITEMS: ItemDef[] = [
  { id: "hoi_huyet_dan", kind: "dan", name: "Hồi Huyết Đan", desc: "Hồi 30% sinh lực của võ hồn đang ra trận.", col: "#e0525a", stack: 99, cd: "dan", hp: 0.3 },
  { id: "hoi_hon_dan",   kind: "dan", name: "Hồi Hồn Đan",   desc: "Hồi 30% hồn lực.",                         col: "#4b9dff", stack: 99, cd: "dan", mp: 0.3 },
  // Hồn hoàn (bước 3.2): mỗi chiếc một ô, số năm lưu ở `items.years`; màu theo số năm (TIERS), `col` chỉ là màu mặc định.
  { id: "hon_hoan", kind: "hon_hoan", name: "Hồn hoàn", desc: "Hấp thụ vào một võ hồn đang ở bình cảnh (ngoài giao chiến).", col: "#ffe08a", stack: 1 },
  // Mảnh võ hồn (bước 3.4): mỗi võ hồn một mã `manh_<mã võ hồn>` (shardCode), `vohon` trỏ về VOHON. Mở / lên sao ở bảng đội hình (V).
  ...VOHON.map((v): ItemDef => ({ id: shardCode(v.id), kind: "manh_vo_hon", name: `Mảnh ${v.name}`, col: v.col, stack: SHARD_STACK, vohon: v.id,
    desc: `Đủ ${SHARD_UNLOCK} mảnh thì mở ${v.name}; đã có thì dùng để lên sao (bảng đội hình, phím V).` })),
  // Hồn cốt (bước 4.1): mỗi món một ô; số năm ở `items.years`, loài và vị trí ở `items.stats`, cấp cường hóa ở `items.enhance`.
  // Màu theo số năm (TIERS) như hồn hoàn. Gắn vào võ hồn từ bước 4.2 (`items.vohon_id`, không chiếm ô túi).
  { id: BONE_ITEM, kind: "hon_cot", name: "Hồn cốt", col: "#e8dcc0", stack: 1,
    desc: "Gắn vào ô cùng vị trí trong 6 ô hồn cốt của một võ hồn (bảng đội hình, phím V) để cộng chỉ số. Cường hóa bằng hồn cốt dư (nút Cường hóa…): mỗi cấp tăng chỉ số chính, mốc +5 / +10 / +15 / +20 nâng kỹ năng và thêm 1 dòng phụ ngẫu nhiên. Tháo ra vẫn giữ cấp cường hóa và dòng phụ." },
  // Hồn hạch (bước 5.1): mỗi món một ô; sao ở `items.stars`, bộ / chỉ số ở `items.stats`. Màu theo bộ (CORE_SETS), `col` chỉ là mặc định.
  { id: CORE_ITEM, kind: "hon_hach", name: "Hồn hạch", col: "#d9b8ff", stack: 1,
    desc: "Mỗi võ hồn có 6 ô hồn hạch: bấm \"Gắn…\" để gắn vào võ hồn (bảng đội hình). Gắn 2 hoặc 4 món cùng bộ trên võ hồn ra trận thì nhận hiệu ứng bộ." },
  // Rương tà hóa thú vương (BĐ5): mỗi thú vương một mã `ruong_<mã thú vương>` (chestCode), `boss` trỏ về BOSSES; mở trong túi đồ (KING_CHEST).
  ...BOSSES.filter((b) => b.rank === 2).map((b): ItemDef => ({ id: chestCode(b.id), kind: "ruong", name: `Rương ${b.name}`, col: b.aura, stack: 99, boss: b.id,
    desc: `Phần thưởng hạ Tà hóa ${b.name}. Mở ra: mảnh võ hồn, 1 hồn hạch sao cao, có thể có hồn cốt (cần ${KING_CHEST.slots} ô trống).` })),
  // Rương boss thế giới (BĐ6e): cùng cách đặt mã, mở bằng WORLD_CHEST.
  ...BOSSES.filter((b) => b.rank === 3).map((b): ItemDef => ({ id: chestCode(b.id), kind: "ruong", name: `Rương ${b.name}`, col: b.aura, stack: 99, boss: b.id,
    desc: `Phần thưởng hạ boss thế giới ${b.name}. Mở ra: mảnh võ hồn UR, 1 hồn hạch ${WORLD_CHEST.stars.join("–")}★ bộ bất kỳ, có thể có hồn cốt 100.000 năm (cần ${WORLD_CHEST.slots} ô trống).` })),
  // Tiên thảo (BĐ6b): mỗi loại một mã (HERBS), gộp 99; dùng cho một võ hồn từ túi đồ.
  ...HERBS.map((h): ItemDef => ({ id: h.id, kind: "tien_thao", name: h.name, col: h.col, stack: 99,
    desc: `Tiên thảo của Lạc Nhật Sâm Lâm. Dùng cho một võ hồn: +${HERB_PCT}% ${HERB_STAT_NAMES[h.stat]} vĩnh viễn, tối đa ${HERB_MAX} cây mỗi võ hồn.` })),
  // Đan lớn (bước 9.8): bán ở thương nhân để tiêu Hồn Tệ cấp cao, chung hồi chiêu đan (DAN_CD) với đan thường; thương nhân không mua lại.
  { id: "dai_hoi_huyet_dan", kind: "dan", name: "Đại Hồi Huyết Đan", desc: "Hồi 60% sinh lực của võ hồn đang ra trận.", col: "#ff3b4e", stack: 99, cd: "dan", hp: 0.6 },
  { id: "dai_hoi_hon_dan",   kind: "dan", name: "Đại Hồi Hồn Đan",   desc: "Hồi 60% hồn lực.",                         col: "#2f7dff", stack: 99, cd: "dan", mp: 0.6 },
  // Hồi Thành Phù (11.2): niệm WAYPOINT_CAST giây rồi về thành gần nhất; thương nhân bán, không mua lại.
  { id: "hoi_thanh_phu", kind: "phu", name: "Hồi Thành Phù", col: "#e8c25a", stack: 99, recall: true,
    desc: `Niệm ${WAYPOINT_CAST} giây rồi về thành gần nhất (ngoài giao chiến; di chuyển hoặc bị đánh thì hủy, phù vẫn còn).` },
  // Ủy Thác Lệnh (Auto 2, mục 5.13): cộng giờ treo tự săn ngoài AUTO_DAILY_SECS mỗi ngày; thương nhân trong thành bán, không mua lại.
  { id: AUTO_TOKEN, kind: "lenh", name: "Ủy Thác Lệnh", col: "#86e0b0", stack: 99, auto: AUTO_TOKEN_SECS,
    desc: `Dùng thì cộng ${AUTO_TOKEN_SECS / 3600} giờ treo tự săn (giữ qua ngày, chỉ tiêu sau khi đã treo hết giờ miễn phí của hôm nay; tích tối đa ${AUTO_BONUS_MAX / 3600} giờ).` },
];
const ITEM_INDEX = new Map(ITEMS.map((d) => [d.id, d]));
/** Định nghĩa vật phẩm theo mã; mã không còn trong ITEMS thì undefined (server vẫn giữ món đồ, client hiện "Vật phẩm lạ"). */
export const itemDef = (code: string) => ITEM_INDEX.get(code);
/**
 * Số ô túi đồ khởi đầu (mỗi ô một món hoặc một chồng đồ gộp), chia trang BAG_PAGE ô. Từ 9.8 mua "Mở rộng túi" ở thương nhân:
 * +BAG_EXPAND ô (một trang) mỗi lần, tối đa BAG_MAX_SLOTS; giá lần thứ i là BAG_EXPAND_COST[i] (đồng). Số ô của tài khoản lưu ở
 * `accounts.bag_slots` (NULL = BAG_SLOTS; tài khoản thời túi 40–80 ô đổi sang mức này ở server/sql/023_tui_250.sql).
 */
export const BAG_SLOTS = 250;
export const BAG_PAGE = 50;
export const BAG_EXPAND = 50;
export const BAG_MAX_SLOTS = 500;
export const BAG_EXPAND_COST = [5000, 10000, 20000, 40000, 80000];
/** Số ô hợp lệ từ dữ liệu lưu (null / hỏng = BAG_SLOTS; kẹp BAG_SLOTS..BAG_MAX_SLOTS). */
export const bagSlotsOf = (x: unknown) => {
  const n = Math.floor(Number(x));
  return x === null || x === undefined || !Number.isFinite(n) ? BAG_SLOTS : Math.max(BAG_SLOTS, Math.min(BAG_MAX_SLOTS, n));
};
/** Giá (đồng) lần mở rộng kế tiếp khi túi đang có `slots` ô; null = đã tối đa. */
export const bagExpandCost = (slots: number) =>
  slots >= BAG_MAX_SLOTS ? null : BAG_EXPAND_COST[Math.max(0, Math.floor((slots - BAG_SLOTS) / BAG_EXPAND))] ?? null;
/** Hồi chiêu chung (giây) của mọi đan có `cd: "dan"`: dùng Hồi Huyết Đan thì Hồi Hồn Đan cũng phải chờ. */
export const DAN_CD = 15;
/** Tài khoản nhận một lần ở lần vào game đầu tiên từ bước 3.1 (cả tài khoản cũ); nguồn đan tạm cho tới khi có thương nhân (6.1). */
export const STARTER_ITEMS = [{ code: "hoi_huyet_dan", qty: 5 }, { code: "hoi_hon_dan", qty: 5 }];
/** Hồn Tệ (đồng) rơi khi hạ hồn thú, theo bậc trong TIERS: ngẫu nhiên trong [min, max], người hạ nhận thẳng. */
export const BEAST_COIN: [number, number][] = [[1, 3], [4, 10], [15, 40], [60, 150], [300, 800]];
/** Mã vật phẩm của hồn hoàn (bước 3.2). */
export const RING_ITEM = "hon_hoan";
/**
 * Hồn hoàn rơi xuống đất khi hạ hồn thú (mục 4, 5.2): DROP_OWNER_SECS giây đầu chỉ người hạ nhặt được, tồn tại DROP_TTL_SECS giây.
 * Nhặt (phím E) khi đứng cách hồn hoàn dưới PICKUP_RANGE pixel thì hồn hoàn vào túi đồ.
 */
export const DROP_OWNER_SECS = 15;
export const DROP_TTL_SECS = 60;
export const PICKUP_RANGE = 22;
/** Quy đổi Hồn Tệ khi hiển thị: 1 ngân = 100 đồng, 1 kim = 100 ngân. DB chỉ lưu số đồng. */
export const HON_TE_NGAN = 100;
export const HON_TE_KIM = 100 * HON_TE_NGAN;
/** Hồn Tệ (đồng) -> các phần kim / ngân / đồng, bỏ phần bằng 0 (0 thì còn "0 đồng"). */
export function honTeParts(dong: number) {
  const n = Math.max(0, Math.floor(dong));
  const parts = [{ n: Math.floor(n / HON_TE_KIM), unit: "kim" }, { n: Math.floor((n % HON_TE_KIM) / HON_TE_NGAN), unit: "ngân" }, { n: n % HON_TE_NGAN, unit: "đồng" }]
    .filter((p) => p.n > 0);
  return parts.length ? parts : [{ n: 0, unit: "đồng" }];
}
/** "1 kim 2 ngân 5 đồng". */
export const formatHonTe = (dong: number) => honTeParts(dong).map((p) => `${p.n.toLocaleString("vi-VN")} ${p.unit}`).join(" ");

export const TILE = 16;
export const TICK_RATE = 20; // số lần server cập nhật mỗi giây

// ---------- NPC, thương nhân và lò rèn (mục 5.8, bước 6.1; mọi số đã chốt) ----------
/**
 * Vai trò NPC: `talk` chỉ có lời thoại; `shop` (thương nhân) mở cửa hàng mua đan / bán đồ dư; `forge` (lò rèn) mở bảng cường hóa
 * hồn cốt (4.4) và chỗ nâng cấp hồn hạch (5.3, sắp mở).
 */
export type NpcRole = "talk" | "shop" | "forge" | "arena"; // arena (7.2): xếp hàng Đại Đấu Hồn Trường, bảng xếp hạng
/**
 * Một NPC. `id` là mã cố định, khớp thuộc tính `npc` của object `npc` trong file Tiled (mục 6); không đổi mã đã dùng.
 * Hình: sheet NPC LPC `lpc_<id>` nếu có trong manifest (mục 5.11 "NPC phụ và dân thường"), không thì `looks` (ngoại hình vẽ bằng
 * sprite hồn sư); không có cả hai = biển hiệu đứng yên. `lines`: lời thoại, hiện lần lượt.
 */
export interface NpcDef { id: string; name: string; title: string; role: NpcRole; col: string; looks?: Looks; lines: string[]; }
/** Bản đồ đang có cấp đề xuất, để Đại Sư giới thiệu (lấy từ MAPS, không chép số). */
const mapLevels = () => Object.values(MAPS).filter((m) => m.level).map((m) => `${m.name} cấp ${m.level![0]}–${m.level![1]}`).join(", ");
export const NPCS: NpcDef[] = [
  { id: "to_van_dao", name: "Tố Vân Đào", title: "Chấp sự Vũ Hồn Điện", role: "talk", col: "#f2c84b",
    looks: { sex: 0, hair: 1, hairCol: 0, outfitCol: 4, skin: 0 },
    lines: [
      "Ta là Tố Vân Đào, chấp sự phân điện Vũ Hồn Điện ở Thánh Hồn Thôn. Lễ thức tỉnh võ hồn của ngươi do chính ta chủ trì đấy.",
      "Võ hồn là bản mệnh của hồn sư: khí võ hồn như Hạo Thiên Chùy, thú võ hồn như Lam Điện Bá Vương Long. Ngoài võ hồn đầu tiên, ngươi còn có thể thu thập thêm nhiều võ hồn khác.",
      "Hồn lực của mỗi võ hồn cứ mười cấp lại chạm bình cảnh. Khi đó phải săn hồn thú, hấp thụ hồn hoàn thì mới tiến lên được.",
      "Xếp bốn võ hồn thành một đội ở bảng đội hình (phím V); khi giao chiến đổi tay bằng phím 1–4. Đi đi, đừng phụ thiên phú của mình!",
    ] },
  { id: "lao_kiet_khac", name: "Lão Kiệt Khắc", title: "Trưởng thôn Thánh Hồn Thôn", role: "talk", col: "#c0cce0",
    looks: { sex: 0, hair: 0, hairCol: 3, outfitCol: 2, skin: 0 },
    lines: [
      "Ha ha, lại một đứa nhỏ của Thánh Hồn Thôn thức tỉnh võ hồn! Lão Kiệt Khắc ta làm trưởng thôn mấy chục năm, hiếm khi thấy làng vui thế này.",
      "Muốn luyện tay thì ra Đồng lúa ven làng, toàn hồn thú mười năm. Cứng cáp hơn thì sang Bãi tập hồn sư phía đông; Hậu Sơn phía bắc có hồn thú vài trăm năm, cẩn thận đấy.",
      "Theo con đường lớn xuống mép nam làng là cổng đi Nặc Đinh Thành. Trong thành có Đại Sư ở Học viện Nặc Đinh, thương nhân bán đan dược và lò rèn.",
      "Trong làng là vùng an toàn, hồn thú không vào được. Bị thương thì cứ về đây mà nghỉ.",
    ] },
  { id: "dai_su", name: "Ngọc Tiểu Cương", title: "Đại Sư · Học viện Nặc Đinh", role: "talk", col: "#86e0b0",
    looks: { sex: 0, hair: 3, hairCol: 0, outfitCol: 5, skin: 0 },
    lines: [
      "Ta là Ngọc Tiểu Cương, người đời gọi là Đại Sư. Võ hồn của ta chỉ là La Tam Pháo, nhưng lý luận mới là sức mạnh thật sự của hồn sư.",
      `Mỗi vòng hồn hoàn có giới hạn niên hạn: vòng 1 tối đa ${formatYears(RING_LIMIT[0])}, vòng 2 ${formatYears(RING_LIMIT[1])}, vòng 3 ${formatYears(RING_LIMIT[2])}, vòng 4 ${formatYears(RING_LIMIT[3])}, vòng 5 ${formatYears(RING_LIMIT[4])}…`,
      "Vượt giới hạn thì có thể thất bại và mất hồn hoàn, vượt càng nhiều càng dễ thất bại; vượt quá gấp đôi thì thân thể không chịu nổi, không thể hấp thụ.",
      `Chọn nơi săn theo cấp võ hồn: ${mapLevels()}. Hồn thú thấp hơn mình quá nhiều thì kinh nghiệm nhận được ít đi.`,
      "Muốn học thì nghe bài giảng của ta: bảy bài cho tân thủ, mỗi bài một việc, làm xong thì quay về đây báo lại (nhiệm vụ tân thủ).",
    ] },
  { id: "thuong_nhan", name: "Thương nhân", title: "Cửa hàng Nặc Đinh", role: "shop", col: "#ffb35c",
    looks: { sex: 1, hair: 1, hairCol: 1, outfitCol: 1, skin: 0 },
    lines: [
      "Khách quan muốn mua gì? Hồi Huyết Đan, Hồi Hồn Đan đều là hàng tốt nhất Nặc Đinh Thành!",
      "Hồn hoàn, hồn cốt, hồn hạch hay mảnh võ hồn dư thì cứ mang tới, ta trả giá phải chăng. Đồ đang gắn trên võ hồn thì ta không nhận.",
    ] },
  { id: "lo_ren", name: "Thợ rèn", title: "Lò rèn Nặc Đinh", role: "forge", col: "#ff7a3c",
    looks: { sex: 0, hair: 2, hairCol: 1, outfitCol: 5, skin: 0 },
    lines: [
      "Lò rèn Nặc Đinh, nghề rèn truyền ba đời. Hồn cốt dư mang tới đây, ta dung luyện vào hồn cốt chính của ngươi: không bao giờ thất bại.",
      "Hồn hạch thì phải đợi ta tìm đủ đồ nghề mới nâng cấp được (sắp mở).",
    ] },
  // 7.2: Đại Đấu Hồn Trường, mở trang xếp hàng / bảng xếp hạng (role "arena"). Lối vào tạm ở Nặc Đinh Thành (7.2), từ BĐ6a đặt ở
  // Thiên Đấu Thành (Nặc Đinh Thành còn sứ giả chỉ đường `su_gia_dau_hon`).
  { id: "dau_hon_truong", name: "Đại Đấu Hồn Trường", title: "Đấu hồn xếp hạng", role: "arena", col: "#ff6b6b",
    lines: [
      "Đại Đấu Hồn Trường: hai hồn sư đưa đội võ hồn của mình vào sân, đấu một chọi một. Thắng thua tính điểm Elo, có bảng xếp hạng.",
      "Đội nào gục hết trước thì thua; hết giờ thì bên còn nhiều sinh lực (theo % cả đội) thắng. Rời sân giữa trận là thua.",
      "Vào sân cả đội hồi đầy; thua không mất gì. Thắng nhận Hồn Tệ và mảnh võ hồn, mỗi ngày có giới hạn số trận được thưởng.",
      "Trận xong, ngươi trở về đúng chỗ đứng trước khi vào sân.",
    ] },
  // BĐ6a: chỗ của lối vào tạm (7.2) ở Nặc Đinh Thành thành sứ giả chỉ đường lên Thiên Đấu Thành.
  { id: "su_gia_dau_hon", name: "Sứ giả Đại Đấu Hồn Trường", title: "Chỉ đường lên Thiên Đấu Thành", role: "talk", col: "#ff6b6b",
    looks: { sex: 1, hair: 2, hairCol: 4, outfitCol: 2, skin: 0 },
    lines: [
      "Ngươi tìm Đại Đấu Hồn Trường? Đấu trường đã về lại chỗ của nó: Thiên Đấu Thành, thủ đô của Thiên Đấu Đế Quốc.",
      "Theo đường lớn bắc–nam ra cổng bắc Nặc Đinh Thành là tới Thiên Đấu Thành. Đường đi qua thành nên an toàn, cấp nào cũng đi được.",
      "Vào thành rồi thì xuống góc đông nam, biển Đại Đấu Hồn Trường đặt ngay trước cửa đấu trường. Trận xong, ngươi trở về đúng chỗ đứng trước khi vào sân.",
    ] },
  // BĐ6a: NPC ở Thiên Đấu Thành (mục 5.8). Biển cổng chưa mở không có `looks` (biển hiệu đứng yên), cổng / thuyền chưa đi được.
  { id: "phat_lan_duc", name: "Phất Lan Đức", title: "Viện trưởng Sử Lai Khắc Học Viện", role: "talk", col: "#9ad0ff",
    looks: { sex: 0, hair: 2, hairCol: 1, outfitCol: 0, skin: 0 },
    lines: [
      "Sử Lai Khắc Học Viện chỉ nhận quái vật, không nhận người thường! Ta là Phất Lan Đức, viện trưởng ở đây.",
      "Học viện mới dời về Thiên Đấu Thành, nhưng khảo hạch thì không nghỉ ngày nào: mỗi ngày ta ra vài bài, nửa đêm đổi bài mới (nhiệm vụ hằng ngày).",
      "Muốn mạnh lên thì ra Đại Đấu Hồn Trường mà rèn luyện thực chiến, hoặc quay về Tinh Đấu Đại Sâm Lâm săn hồn hoàn hợp vòng.",
    ] },
  { id: "thuong_nhan_thien_dau", name: "Chưởng quỹ", title: "Thương hội Thiên Đấu", role: "shop", col: "#ffb35c",
    looks: { sex: 0, hair: 1, hairCol: 2, outfitCol: 1, skin: 0 },
    lines: [
      "Thương hội Thiên Đấu, hàng hóa khắp đế quốc đều qua tay ta. Đan dược giá như ở Nặc Đinh Thành, không lấy thêm một đồng.",
      "Đồ dư mang tới đây ta cũng mua lại. Đồ đang gắn trên võ hồn thì ta không nhận.",
    ] },
  { id: "lo_ren_thien_dau", name: "Thợ rèn Thiên Đấu", title: "Lò rèn Thiên Đấu", role: "forge", col: "#ff7a3c",
    looks: { sex: 1, hair: 3, hairCol: 1, outfitCol: 5, skin: 0 },
    lines: [
      "Lò rèn lớn nhất thủ đô. Hồn cốt dư dung luyện vào hồn cốt chính, hồn hạch dư nâng cấp hồn hạch chính: không bao giờ thất bại.",
      "Tay nghề ở đây cũng như lò rèn Nặc Đinh, chỉ là lửa to hơn thôi.",
    ] },
  // Biển "sắp mở" của BĐ6a đã bỏ: `cong_lac_nhat` (BĐ6b), `cong_cuc_bac` (BĐ6c), `ben_thuyen_hai_than` (BĐ6d); các cổng đó là object
  // `portal` (bến thuyền có `boat`). Mã NPC không lưu DB.
  // #111: thương nhân lưu động ở trại cổng bản đồ săn, không đặt bằng object `npc` mà tự đứng ở trại (campMerchantSpot, shared/camp.ts).
  { id: "thuong_nhan_luu_dong", name: "Thương nhân lưu động", title: "Trại cổng", role: "shop", col: "#ffb35c",
    looks: { sex: 0, hair: 0, hairCol: 1, outfitCol: 3, skin: 0 },
    lines: [
      "Đường xa gánh nặng, đan dược có đắt hơn trong thành một chút, khách quan thông cảm. Hồi Thành Phù ta cũng mang theo.",
      "Hồn hoàn, hồn cốt, hồn hạch, mảnh võ hồn dư cứ bán cho ta, giá như thương nhân trong thành. Muốn mở rộng túi hay mua đan lớn thì phải về thành.",
    ] },
];
const NPC_INDEX = new Map(NPCS.map((n) => [n.id, n]));
/** NPC theo mã (thuộc tính `npc` của object Tiled); mã lạ thì undefined. */
export const npcDef = (id: unknown) => (typeof id === "string" ? NPC_INDEX.get(id) : undefined);
/** Khoảng cách (pixel, tính từ chân) tối đa để nói chuyện, mua bán, rèn với NPC; server kiểm tra lại mỗi lần. */
export const NPC_RANGE = 40;
/** Thương nhân bán (giá đồng mỗi món). Chỉ đồ có trong ITEMS; thêm món thì thêm dòng. Đan lớn từ 9.8 (120 đồng, hồi 60%). */
export const SHOP: { code: string; price: number }[] = [
  { code: "hoi_huyet_dan", price: 20 }, { code: "hoi_hon_dan", price: 20 },
  { code: "dai_hoi_huyet_dan", price: 120 }, { code: "dai_hoi_hon_dan", price: 120 },
  { code: "hoi_thanh_phu", price: 30 }, // 11.2
  { code: AUTO_TOKEN, price: AUTO_TOKEN_PRICE }, // Auto 2: Ủy Thác Lệnh
];
/** Thương nhân lưu động ở trại cổng bản đồ săn (#111): mã NPC trong NPCS. */
export const CAMP_MERCHANT = "thuong_nhan_luu_dong";
/** Giá mọi món của thương nhân lưu động (#160, đồng mỗi món), không rẻ hơn SHOP. */
export const CAMP_PRICE = 30;
/** Hàng của thương nhân lưu động: chỉ đan nhỏ và Hồi Thành Phù, mọi món giá CAMP_PRICE. Mua lại đồ dư như trong thành. */
export const CAMP_SHOP: { code: string; price: number }[] = ["hoi_huyet_dan", "hoi_hon_dan", "hoi_thanh_phu"].map((code) => ({ code, price: CAMP_PRICE }));
/** Bảng hàng của thương nhân `npcId` (thương nhân trong thành dùng chung SHOP). */
export const shopOf = (npcId: string) => (npcId === CAMP_MERCHANT ? CAMP_SHOP : SHOP);
/** Thương nhân `npcId` có mở rộng túi không (thương nhân lưu động thì không). */
export const shopExpands = (npcId: string) => npcId !== CAMP_MERCHANT;
/**
 * Chỗ đứng của thương nhân lưu động (campMerchantSpot): cách mép cổng / truyền tống trận ít nhất CAMP_GAP pixel, cách điểm `arrive` /
 * NPC khác ít nhất CAMP_PT_GAP (nhỏ hơn NPC_RANGE − CAMP_STEP: người vừa tới không đứng chồng lên nhưng vẫn trong tầm nói chuyện), lưới CAMP_STEP.
 */
export const CAMP_GAP = 16, CAMP_PT_GAP = 28, CAMP_STEP = 8;
/**
 * Mua lại đồ bán nhầm (bước 9.8): thương nhân giữ BUYBACK_MAX lần bán gần nhất của mỗi tài khoản (RAM, mất khi rời game), mua lại
 * đúng món (cùng chỉ số, cấp cường hóa) với đúng giá đã bán. Thương nhân nào cũng giữ chung danh sách này.
 */
export const BUYBACK_MAX = 5;
/** Số món tối đa mỗi lần mua. */
export const SHOP_MAX_QTY = 99;
/** Giá thương nhân mua lại một hồn hoàn theo số năm (đồng; nội suy theo log số năm giữa các mốc, ngoài khoảng thì kẹp). */
export const RING_SELL: [number, number][] = [[10, 1], [100, 3], [1000, 15], [10000, 80], [100000, 500]];
/** Hồn cốt bán được gấp BONE_SELL lần hồn hoàn cùng số năm, mỗi cấp cường hóa thêm BONE_SELL_ENH (10%). */
export const BONE_SELL = 4;
export const BONE_SELL_ENH = 0.1;
/** Giá mua lại hồn hạch theo sao (1★…6★, đồng). */
export const CORE_SELL = [5, 15, 40, 100, 300, 800];
/** Giá mua lại một mảnh võ hồn theo độ hiếm của võ hồn (đồng). */
export const SHARD_SELL: Record<Rarity, number> = { SR: 2, SSR: 4, UR: 20 };
/** Giá mua lại hồn hoàn `years` năm (đồng). */
export function ringSellPrice(years: number) {
  const y = Math.max(RING_SELL[0][0], Math.min(RING_SELL[RING_SELL.length - 1][0], years));
  let i = 0; while (i < RING_SELL.length - 2 && y > RING_SELL[i + 1][0]) i++;
  const [y0, p0] = RING_SELL[i], [y1, p1] = RING_SELL[i + 1];
  const t = y1 > y0 ? Math.log(y / y0) / Math.log(y1 / y0) : 0;
  return Math.max(1, Math.round(p0 + (p1 - p0) * t));
}
/**
 * Giá thương nhân mua lại MỘT món (đồng), hàm thuần dùng chung cho server và client; null = không mua (đan, rương, đồ lạ, dữ liệu
 * hỏng). Server còn từ chối đồ đang gắn và hồn hoàn đang hấp thụ.
 */
export function sellPrice(it: { code: string; years: number | null; stars: number | null; enhance: number }): number | null {
  const def = itemDef(it.code); if (!def) return null;
  if (def.kind === "hon_hoan") return it.years !== null ? ringSellPrice(it.years) : null;
  if (def.kind === "hon_cot") return it.years !== null ? Math.round(ringSellPrice(it.years) * BONE_SELL * (1 + BONE_SELL_ENH * Math.max(0, it.enhance))) : null;
  if (def.kind === "hon_hach") return CORE_SELL[Math.max(1, Math.min(CORE_SELL.length, Math.floor(it.stars ?? 1))) - 1];
  if (def.kind === "manh_vo_hon" && def.vohon) { const v = VOHON[vohonIndex(def.vohon)]; return v ? SHARD_SELL[v.rarity] : null; }
  return null;
}

// ---------- Tự bán từ xa (#216, mục 5.7 "Tự bán"; chủ repo chốt phương án A 2026-10-22) ----------
/**
 * Bật tự bán thì khi túi còn dưới AUTO_SELL_FREE ô trống (hoặc tự săn thấy túi đầy), server bán từ xa mọi món hợp bộ lọc với đúng giá
 * thương nhân trong thành (sellPrice, 100%). Giữ AUTO_SELL_BUYBACK món tự bán gần nhất (lưu DB) để mua lại đúng giá ở thương nhân.
 */
export const AUTO_SELL_FREE = 5;
export const AUTO_SELL_BUYBACK = 20;
/** Hồn hoàn, hồn cốt từ bấy nhiêu năm (vạn năm) trở lên không bao giờ tự bán, trừ khi người chơi bật `high`. */
export const AUTO_SELL_GUARD = 10000;
/** Bộ lọc tự bán của tài khoản (`accounts.auto_sell`; chỉnh ở bảng Túi đồ). Món khoá, món đang gắn không bao giờ bán. */
export interface SellSettings {
  on: boolean;     // bật tự bán (mặc định tắt)
  ring: number;    // bán hồn hoàn dưới bấy nhiêu năm (0 = không bán hồn hoàn)
  high: boolean;   // cho bán cả hồn hoàn / hồn cốt từ AUTO_SELL_GUARD năm trở lên
  bone: number;    // bán hồn cốt cường hóa dưới +bone (0 = không bán hồn cốt)
  core: number;    // bán hồn hạch chưa nâng cấp dưới bấy nhiêu sao (1 = không bán hồn hạch)
  shard: boolean;  // bán mảnh võ hồn (vật phẩm thường thương nhân mua; đan, phù chú, lệnh bài, rương, tiên thảo thì thương nhân không mua)
}
/** Mặc định: tắt; khi bật chỉ bán đồ giá trị thấp (hồn hoàn dưới nghìn năm, hồn hạch 1–2 sao), giữ hồn cốt và mảnh võ hồn. */
export const SELL_DEFAULTS: SellSettings = { on: false, ring: 1000, high: false, bone: 0, core: 3, shard: false };
/** Bộ lọc từ client / DB: kẹp từng giá trị, thiếu hoặc sai thì lấy mặc định. */
export function parseSell(raw: unknown): SellSettings {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>, D = SELL_DEFAULTS;
  const num = (v: unknown, lo: number, hi: number, def: number) => (typeof v === "number" && Number.isFinite(v) ? Math.round(Math.max(lo, Math.min(hi, v))) : def);
  const bool = (v: unknown, def: boolean) => (typeof v === "boolean" ? v : def);
  return { on: bool(o.on, D.on), ring: num(o.ring, 0, MAX_YEARS + 1, D.ring), high: bool(o.high, D.high),
    bone: num(o.bone, 0, BONE_MAX_ENHANCE + 1, D.bone), core: num(o.core, 1, MAX_CORE_STARS + 1, D.core), shard: bool(o.shard, D.shard) };
}
/**
 * Món `it` có bị tự bán theo bộ lọc `s` không (hàm thuần, client dùng để xem trước): không khoá, không gắn, thương nhân mua (sellPrice),
 * vạn năm trở lên chỉ khi bật `high`. Server còn bỏ qua hồn hoàn đang hấp thụ.
 */
export function autoSellable(it: { code: string; years: number | null; stars: number | null; enhance: number; locked?: boolean; vohon?: number | null },
  s: SellSettings): boolean {
  if (it.locked || (it.vohon ?? null) !== null || sellPrice(it) === null) return false;
  const kind = itemDef(it.code)?.kind, y = it.years ?? 0;
  if ((kind === "hon_hoan" || kind === "hon_cot") && y >= AUTO_SELL_GUARD && !s.high) return false;
  if (kind === "hon_hoan") return y < s.ring;
  if (kind === "hon_cot") return it.enhance < s.bone;
  if (kind === "hon_hach") return it.enhance === 0 && (it.stars ?? 1) < s.core;
  if (kind === "manh_vo_hon") return s.shard;
  return false;
}

// ---------- Nhiệm vụ: chuỗi tân thủ của Ngọc Tiểu Cương (mục 5.8, bước 6.2; nội dung, số lượng và phần thưởng đã chốt) ----------
/**
 * Loại mục tiêu, server đếm theo sự kiện thật (MapRoom.questEvent): `talk` nói chuyện với NPC `npc`; `kill` hạ hồn thú (tùy chọn
 * `map`, `zone` = tên vùng săn nơi hồn thú bị hạ); `switch` đổi võ hồn trong đội khi đang giao chiến; `tienco` tung chiêu tiên cơ;
 * `absorb` hấp thụ thành công một hồn hoàn không vượt giới hạn của vòng; `equip` gắn một hồn cốt hoặc hồn hạch vào võ hồn; `map`
 * có mặt ở bản đồ `map`. `have`: đã đạt sẵn lúc nhận nhiệm vụ (có võ hồn đã có hồn hoàn, đang gắn hồn cốt / hồn hạch, đang đứng ở
 * bản đồ đó) thì tính xong ngay, để tài khoản cũ không phải làm lại.
 */
export type QuestGoalKind = "talk" | "kill" | "switch" | "tienco" | "absorb" | "equip" | "map" | "arena" | "give";
/**
 * Từ nhiệm vụ hằng ngày (DAILY_POOL): `kill` thêm `fit` (chỉ hồn thú hợp cấp, fitBeast); `arena` đánh xong một trận Đại Đấu Hồn
 * Trường (thắng / thua / hòa, không tính bỏ trận hay đối thủ không vào sân); `give` nộp `n` món mã `item` lúc trả bài (số đếm là số
 * món đang có trong túi, server tính lại mỗi khi túi đổi); `near`: NPC chỉ đường trên bản đồ nhỏ.
 */
export interface QuestGoal {
  k: QuestGoalKind; n: number; text: string; npc?: string; map?: string; zone?: string; have?: boolean; fit?: boolean; item?: string; near?: string;
}
/** Phần thưởng một bước: Hồn Tệ (đồng) và vật phẩm vào túi (server kiểm tra túi đủ chỗ cho cả phần thưởng mới cho trả). */
export interface QuestReward { honTe: number; items: { code: string; qty: number }[]; }
/** Một bước (một bài học): `offer` lời giao, `done` lời khi trả nhiệm vụ, `desc` một câu tóm tắt cho khung theo dõi. */
export interface QuestStep { id: string; name: string; desc: string; goals: QuestGoal[]; reward: QuestReward; offer: string[]; done: string[]; }
/**
 * Chuỗi nhiệm vụ của NPC `giver` (mã trong NPCS) đứng ở bản đồ `map`: nhận và trả từng bước bằng hội thoại, đứng trong NPC_RANGE.
 * `finale`: lời sau bước cuối.
 */
export interface QuestChain { id: string; name: string; giver: string; map: string; steps: QuestStep[]; finale: string; }
/**
 * Tiến độ của một tài khoản trong một chuỗi (bảng `quests`, mỗi chuỗi một dòng): `step` là chỉ số bước đang làm (bằng số bước =
 * đã xong cả chuỗi), `accepted` đã nhận bước đó chưa, `prog` số đếm từng mục tiêu của bước đó (kẹp ở `n`).
 */
export interface QuestProgress { chain: string; step: number; accepted: boolean; prog: number[]; }
/** Sự kiện server báo cho bộ đếm nhiệm vụ (MapRoom.questEvent). */
export interface QuestEvent { k: QuestGoalKind; npc?: string; map?: string; zone?: string; fit?: boolean; }
/** Mã chuỗi tân thủ (mọi tài khoản, cả tài khoản cũ, bắt đầu ở bước 1 khi chưa có dòng trong bảng `quests`). */
export const QUEST_STARTER = "tan_thu";
const BAI_TAP = "Bãi tập hồn sư"; // tên vùng săn trong thanh_hon_thon.json (tools/gen-map.mjs)
export const QUESTS: QuestChain[] = [
  { id: QUEST_STARTER, name: "Bài học của Đại Sư", giver: "dai_su", map: "nac_dinh_thanh",
    finale: "Bảy bài của ta ngươi đã học xong. Phần còn lại phải tự mình đi, tự mình ngộ. Sau này tới Sử Lai Khắc Học Viện, ở đó có người dạy ngươi những điều ta không dạy được.",
    steps: [
      { id: "hau_can", name: "Hậu cần của hồn sư", desc: "Gặp Thương nhân ở tây nam đại lộ Nặc Đinh Thành.",
        offer: ["Ngươi muốn học lý luận của ta? Tốt. Ta có bảy bài cho tân thủ, mỗi bài một việc. Làm xong thì quay về đây, ta giảng bài kế tiếp.",
          "Bài thứ nhất: hồn sư vào rừng mà không mang đan dược thì cũng như kiếm khách quên mang kiếm. Thương nhân ở tây nam đại lộ bán Hồi Huyết Đan, Hồi Hồn Đan và mua lại đồ dư. Đi gặp hắn đi."],
        goals: [{ k: "talk", npc: "thuong_nhan", n: 1, text: "Nói chuyện với Thương nhân" }],
        done: ["Nhớ kỹ: hồn hoàn, hồn cốt, hồn hạch không dùng tới thì đem bán, đổi lấy đan dược. Hồn sư túi rỗng thì đi không xa."],
        reward: { honTe: 30, items: [{ code: "hoi_huyet_dan", qty: 2 }] } },
      { id: "bai_tap", name: "Luyện tay ở Bãi tập", desc: `Về Thánh Hồn Thôn, hạ hồn thú ở ${BAI_TAP} phía đông làng.`,
        offer: ["Bài thứ hai: thực chiến. Lý luận mà không có thực chiến chỉ là lời nói suông.",
          `Về Thánh Hồn Thôn, ra ${BAI_TAP} phía đông làng. Hồn thú ở đó tám mươi tới hai trăm năm mươi năm, vừa sức tân thủ. Hạ tám con rồi về đây.`],
        goals: [{ k: "kill", map: "thanh_hon_thon", zone: BAI_TAP, n: 8, text: `Hạ hồn thú ở ${BAI_TAP}` }],
        done: ["Không tệ. Hồn thú cũng có trí khôn: con biết né, con biết gọi bầy. Quan sát trước rồi mới ra tay."],
        reward: { honTe: 40, items: [{ code: "hoi_hon_dan", qty: 3 }] } },
      { id: "doi_tay", name: "Đổi tay giữa trận", desc: "Đang giao chiến thì đổi võ hồn (phím 1–4), rồi tung một chiêu tiên cơ.",
        offer: ["Bài thứ ba: đội hình. Một võ hồn mạnh không bằng bốn võ hồn biết phối hợp. Xếp đội ở bảng đội hình (phím V), trong trận đổi tay bằng phím 1–4.",
          "Võ hồn ngoài sân tích năng lượng mỗi khi võ hồn ra trận đánh trúng. Đầy năng lượng mà đổi vào thì tung chiêu tiên cơ. Đi đi, đổi tay giữa trận và tung một chiêu tiên cơ cho ta xem."],
        goals: [{ k: "switch", n: 1, text: "Đổi võ hồn khi đang giao chiến" }, { k: "tienco", n: 1, text: "Tung chiêu tiên cơ" }],
        done: ["Đúng rồi. Đổi tay đúng lúc, ra tiên cơ trước khi hồn thú kịp phản ứng: đó là cốt lõi của đội hình."],
        reward: { honTe: 50, items: [{ code: shardCode("lam_ngan_thao"), qty: 5 }] } },
      { id: "hon_hoan", name: "Hồn hoàn đầu tiên", desc: `Võ hồn chạm bình cảnh thì nhặt hồn hoàn (phím E) và hấp thụ một chiếc không vượt giới hạn (vòng 1: ${formatYears(RING_LIMIT[0])}).`,
        offer: ["Bài thứ tư, quan trọng nhất: hồn hoàn. Cứ mười cấp hồn lực lại chạm bình cảnh, phải hấp thụ hồn hoàn mới tiến lên được.",
          `Lý luận của ta: vòng thứ nhất chịu được tối đa ${formatYears(RING_LIMIT[0])}, vòng thứ hai ${formatYears(RING_LIMIT[1])}. Vượt giới hạn mà liều thì hồn hoàn có thể vỡ tan, uổng công săn. Chọn hồn hoàn trong giới hạn, hấp thụ thành công rồi về báo ta.`],
        goals: [{ k: "absorb", n: 1, have: true, text: "Hấp thụ thành công hồn hoàn trong giới hạn" }],
        done: ["Hồn hoàn đầu tiên quyết định hồn kỹ đầu tiên. Từ nay ngươi là hồn sư thật sự. Nhớ: vòng sau giới hạn lại cao hơn, đừng tham."],
        reward: { honTe: 80, items: [{ code: "hoi_huyet_dan", qty: 3 }, { code: "hoi_hon_dan", qty: 3 }] } },
      { id: "ho_than", name: "Hồn cốt, hồn hạch hộ thân", desc: "Gắn một hồn cốt hoặc hồn hạch vào võ hồn (bảng đội hình, phím V).",
        offer: ["Bài thứ năm: ngoại vật. Hồn thú còn để lại hồn cốt và hồn hạch. Hồn cốt hiếm, hồn thú từ nghìn năm trở lên mới rơi; hồn hạch thì gặp nhiều hơn.",
          "Mỗi võ hồn có sáu ô hồn cốt và sáu ô hồn hạch. Gắn một món vào võ hồn của ngươi (bảng đội hình, phím V) rồi quay lại."],
        goals: [{ k: "equip", n: 1, have: true, text: "Gắn hồn cốt hoặc hồn hạch vào võ hồn" }],
        done: ["Hồn hạch cùng bộ gắn đủ hai hay bốn món thì có hiệu ứng bộ. Đừng chỉ nhìn số sao, hãy nhìn cả bộ."],
        reward: { honTe: 60, items: [{ code: shardCode("nhu_cot_tho"), qty: 10 }] } },
      { id: "lo_ren", name: "Lò rèn Nặc Đinh", desc: "Gặp Thợ rèn ở lò rèn phía đông bắc Nặc Đinh Thành.",
        offer: ["Bài thứ sáu: hồn cốt dư đừng vội bán. Thợ rèn Nặc Đinh dung luyện được hồn cốt dư vào hồn cốt chính, không bao giờ thất bại.",
          "Lò rèn ở phía đông bắc thành. Ghé qua nói chuyện với hắn."],
        goals: [{ k: "talk", npc: "lo_ren", n: 1, text: "Nói chuyện với Thợ rèn" }],
        done: ["Cường hóa tới +5, +10, +15, +20 thì kỹ năng của hồn cốt mạnh thêm một bậc. Tích góp dần."],
        reward: { honTe: 30, items: [{ code: "hoi_huyet_dan", qty: 2 }] } },
      { id: "ngoai_vi", name: "Tinh Đấu Đại Sâm Lâm", desc: "Qua cổng đông Nặc Đinh Thành vào Tinh Đấu Ngoại vi, hạ hồn thú ở đó.",
        offer: ["Bài cuối cùng. Thánh Hồn Thôn đã quá nhỏ với ngươi. Phía đông thành là Tinh Đấu Đại Sâm Lâm, hồn thú vài trăm tới vài nghìn năm.",
          "Qua cổng đông vào Tinh Đấu Ngoại vi, hạ năm con hồn thú rồi trở về. Cẩn thận: hồn thú ở đó biết dùng chiêu, thấy vùng đỏ dưới đất thì tránh ra ngay."],
        goals: [{ k: "map", map: "tinh_dau_ngoai_vi", n: 1, have: true, text: "Đặt chân tới Tinh Đấu Ngoại vi" },
          { k: "kill", map: "tinh_dau_ngoai_vi", n: 5, text: "Hạ hồn thú ở Tinh Đấu Ngoại vi" }],
        done: ["Tốt lắm. Ngươi đã đứng vững ở Tinh Đấu Đại Sâm Lâm."],
        reward: { honTe: 150, items: [{ code: "hoi_huyet_dan", qty: 5 }, { code: "hoi_hon_dan", qty: 5 }, { code: shardCode("u_minh_linh_mieu"), qty: 10 }] } },
    ] },
];
const QUEST_INDEX = new Map(QUESTS.map((q) => [q.id, q]));
/** Chuỗi theo mã: chuỗi cố định trong QUESTS, hoặc bài khảo hạch hằng ngày `daily:<yyyymmdd>:<i>` (dailyChain). */
export const questChain = (id: string) => QUEST_INDEX.get(id) ?? dailyChain(id);
/** Tiến độ khi chưa có dòng trong bảng `quests` (tài khoản mới và cũ): bước 1, chưa nhận. */
export const questStart = (chain: string): QuestProgress => ({ chain, step: 0, accepted: false, prog: [] });
/** Đọc tiến độ từ DB / client gửi lên: kẹp bước, số đếm theo mục tiêu của bước; dữ liệu hỏng thì về `questStart`. */
export function parseQuest(raw: unknown, chain: string): QuestProgress {
  const c = questChain(chain), o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  if (!c || !Number.isInteger(o.step)) return questStart(chain);
  const step = Math.max(0, Math.min(c.steps.length, o.step as number)), goals = c.steps[step]?.goals ?? [];
  const accepted = step < c.steps.length && o.accepted === true, prog = Array.isArray(o.prog) ? o.prog : [];
  return { chain, step, accepted, prog: accepted ? goals.map((g, i) => (Number.isInteger(prog[i]) ? Math.max(0, Math.min(g.n, prog[i] as number)) : 0)) : [] };
}
/**
 * Trạng thái để hiển thị: `offer` có bài mới chưa nhận (dấu "!" trên đầu NPC), `active` đang làm, `ready` đủ mục tiêu chờ trả (dấu
 * "?"), `done` xong cả chuỗi.
 */
export type QuestStatus = "offer" | "active" | "ready" | "done";
export function questStatus(q: QuestProgress): QuestStatus {
  const s = questChain(q.chain)?.steps[q.step];
  if (!s) return "done";
  if (!q.accepted) return "offer";
  return s.goals.every((g, i) => (q.prog[i] ?? 0) >= g.n) ? "ready" : "active";
}
/** Sự kiện `ev` có tính cho mục tiêu `g` không. */
export const questGoalHit = (g: QuestGoal, ev: QuestEvent) => g.k !== "give" &&
  g.k === ev.k && (!g.npc || g.npc === ev.npc) && (!g.map || g.map === ev.map) && (!g.zone || g.zone === ev.zone) && (!g.fit || ev.fit === true);
/** "30 đồng, 2 Hồi Huyết Đan, 5 Mảnh Lam Ngân Thảo". */
export const questRewardText = (r: QuestReward) =>
  [r.honTe ? formatHonTe(r.honTe) : "", ...r.items.map((i) => `${i.qty} ${itemDef(i.code)?.name ?? i.code}`)].filter(Boolean).join(", ");

// ---------- Đại Đấu Hồn Trường (mục 5.9, bước 7.2; mọi số đã chốt) ----------
/** Mã bản đồ sân đấu (MAPS, kind `arena`): shared/assets/dai_dau_hon_truong.json, chỉ phòng ArenaRoom dùng. */
export const ARENA_MAP = "dai_dau_hon_truong";
/**
 * **(đã chốt)** Số liệu Đại Đấu Hồn Trường (mục 5.9, bước 7.2).
 * - `startElo`: Elo khởi đầu (chưa đấu trận nào); `k`: hệ số K của Elo (mọi trận như nhau); Elo không xuống dưới 0.
 * - `window`: ghép trận theo Elo gần nhất, chênh tối đa `base` + `perSec` × số giây chờ (nới dần), tối đa `max`.
 * - `joinSecs`: chờ cả hai vào sân (ai không vào là bỏ trận = thua); `readySecs`: đếm ngược trước khi giao đấu (chưa đánh được);
 *   `fightSecs`: thời gian một trận, hết giờ thì so % sinh lực cả đội; `endSecs`: hiện kết quả rồi đưa cả hai về bản đồ cũ.
 * - `dmgMult`: sát thương hồn sư lên hồn sư bằng ngần ấy lần sát thương lên hồn thú (sinh lực võ hồn thấp hơn hồn thú cùng cấp,
 *   không giảm thì trận kết thúc trong vài giây); `drawPct`: hết giờ mà % sinh lực chênh không quá mức này thì hòa.
 * - `body`: bán kính thân hồn sư (pixel) khi tính trúng đòn của đối thủ.
 * - Thưởng thắng `winHonTe` đồng + `winShards` mảnh của một võ hồn ngẫu nhiên trong ARENA_SHARDS; túi đầy thì mảnh đổi thành Hồn
 *   Tệ theo giá thương nhân mua lại (sellPrice). Mỗi ngày (giờ Việt Nam) tối đa `dailyWins` trận thắng có thưởng (chống cày bằng tài
 *   khoản phụ); hết lượt vẫn đấu và tính Elo. Lượt đếm ở bảng `boss_claims` với loại `claimKind`.
 * - `topN`: số dòng bảng xếp hạng; `topCd`: giây tối thiểu giữa hai lần xin bảng xếp hạng của một người.
 * - `queueCd`: giây tối thiểu giữa hai lần xếp hàng có đọc Elo từ DB của một tài khoản (bấm dồn / xếp rồi hủy liên tục bị từ chối).
 * - Chống dàn xếp (bước 9.7): cùng một cặp tài khoản chỉ `pairDaily` trận mỗi ngày (giờ Việt Nam, như lượt thưởng) tính Elo và
 *   thưởng; từ trận kế tiếp là **giao hữu** (không đổi Elo / thành tích, không thưởng, không đếm `dailyWins`). Đếm ở bảng
 *   `arena_pairs`. Hàng chờ: trong `rematchSecs` giây chờ đầu không ghép lại đối thủ của trận ngay trước nếu còn người khác
 *   trong cửa sổ (arenaPairs).
 */
export const ARENA = {
  startElo: 1000, k: 32,
  window: { base: 100, perSec: 25, max: 2000 },
  joinSecs: 20, readySecs: 5, fightSecs: 180, endSecs: 20,
  dmgMult: 0.35, drawPct: 0.005, body: 8,
  winHonTe: 60, winShards: 3, dailyWins: 10, claimKind: "dau_hon_truong",
  topN: 20, topCd: 1, queueCd: 1,
  pairDaily: 3, rematchSecs: 60,
};
/** Mảnh thưởng thắng trận: võ hồn SR / SSR (không có UR, không có Lam Ngân Thảo ai cũng sẵn). */
export const ARENA_SHARDS = VOHON.filter((v) => v.rarity !== "UR" && v.id !== AWAKEN_GIFT).map((v) => v.id);
/** Xác suất thắng kỳ vọng của Elo `r` trước Elo `ro`. */
export const eloExpect = (r: number, ro: number) => 1 / (1 + Math.pow(10, (ro - r) / 400));
/** Elo mới sau một trận: `score` 1 thắng, 0,5 hòa, 0 thua; làm tròn, không dưới 0. */
export const eloAfter = (r: number, ro: number, score: number, k = ARENA.k) => Math.max(0, Math.round(r + k * (score - eloExpect(r, ro))));
/** Chênh Elo tối đa được ghép sau `waitSecs` giây chờ (nới dần). */
export const arenaWindow = (waitSecs: number) => Math.min(ARENA.window.max, ARENA.window.base + ARENA.window.perSec * Math.max(0, waitSecs));
/**
 * Ghép trận (hàm thuần, server gọi định kỳ): `list` theo thứ tự xếp hàng (chờ lâu nhất trước), `wait` = số giây đã chờ. Người chờ lâu
 * nhất được ghép với người có Elo gần nhất trong cửa sổ của một trong hai (arenaWindow; bằng nhau thì người xếp hàng trước); không
 * ai vừa thì xét người kế tiếp. Trả các cặp mã.
 * Từ 9.7: `last` = đối thủ của trận ngay trước. Hai người vừa đấu nhau mà một trong hai còn chờ dưới ARENA.rematchSecs giây thì chỉ
 * được ghép lại khi không còn ai khác trong cửa sổ.
 */
export function arenaPairs<T>(list: { id: T; elo: number; wait: number; last?: T }[]): [T, T][] {
  const left = [...list], out: [T, T][] = [];
  for (let i = 0; i < left.length; ) {
    const a = left[i]; let best = -1, bd = Infinity, alt = -1, ad = Infinity;
    for (let j = 0; j < left.length; j++) {
      if (j === i) continue;
      const b = left[j], diff = Math.abs(a.elo - b.elo);
      if (diff > Math.max(arenaWindow(a.wait), arenaWindow(b.wait))) continue;
      if (diff < bd) { bd = diff; best = j; }
      const again = (a.last === b.id || b.last === a.id) && Math.min(a.wait, b.wait) < ARENA.rematchSecs;
      if (!again && diff < ad) { ad = diff; alt = j; }
    }
    if (alt >= 0) best = alt;
    if (best < 0) { i++; continue; }
    out.push([a.id, left[best].id]);
    left.splice(Math.max(i, best), 1); left.splice(Math.min(i, best), 1);
    i = 0;
  }
  return out;
}
/** Trận thứ `n` trong ngày của một cặp tài khoản (đếm cả trận này) có tính Elo và thưởng không; quá ARENA.pairDaily là giao hữu (9.7). */
export const arenaRanked = (n: number) => n <= ARENA.pairDaily;
/** Một dòng bảng xếp hạng / thành tích Đại Đấu Hồn Trường (bảng `arena_ratings`). */
export interface ArenaRecord { elo: number; wins: number; losses: number; draws: number; }

// ---------- Nhiệm vụ hằng ngày: khảo hạch Sử Lai Khắc của Phất Lan Đức (mục 5.8 "Nhiệm vụ hằng ngày") ----------
/**
 * Khảo hạch hằng ngày: `count` bài mỗi ngày (giờ Việt Nam, đặt lại lúc 00:00 như lượt thưởng boss: vnDay), nhận và trả với NPC
 * `giver` ở bản đồ `map`. Mỗi bài là một chuỗi một bước trong bảng `quests`, mã `daily:<yyyymmdd>:<i>` (dailyIds); nội dung bài suy
 * ra từ mã (dailyChain) nên không lưu gì thêm. Bài 0 lấy trong nhóm `hunt`, các bài sau lấy không trùng trong nhóm `misc` của
 * DAILY_POOL, bốc ổn định theo ngày (mọi người cùng một bộ bài trong ngày). Thưởng mỗi bài: `honTe` đồng của mẫu + `shards` mảnh của
 * một võ hồn trong ARENA_SHARDS (bốc theo ngày và số thứ tự bài).
 */
export const DAILY = { giver: "phat_lan_duc", map: "thien_dau_thanh", count: 3, name: "Khảo hạch Sử Lai Khắc" };
/** Một mẫu bài khảo hạch: `group` nhóm bốc (`hunt` bài 0, `misc` các bài sau); mục tiêu, lời giao / trả như QuestStep. */
export interface DailyTemplate {
  id: string; group: "hunt" | "misc"; name: string; desc: string; goals: QuestGoal[]; honTe: number; shards: number; offer: string[]; done: string[];
}
/**
 * Bảng mẫu khảo hạch (đã chốt; thêm mẫu mới thì thêm vào cuối nhóm: bộ bài của những ngày đã qua đổi theo, không sao vì bài ngày cũ
 * không còn trả được). Mục tiêu `fit`: hạ hồn thú hợp cấp (fitBeast, không bị giảm kinh nghiệm theo chênh cấp); `give`: nộp vật phẩm
 * đang có trong túi lúc trả bài (đồ đang gắn hoặc đã cường hóa / nâng cấp không tính); `near`: NPC chỉ đường trên bản đồ nhỏ.
 * Không có mẫu "hấp thụ hồn hoàn": chỉ làm được khi võ hồn chạm bình cảnh (mỗi 10 cấp), nên thay bằng nộp hồn hoàn.
 */
export const DAILY_POOL: DailyTemplate[] = [
  { id: "san_thu", group: "hunt", name: "Săn hồn thú hợp cấp", desc: "Hạ hồn thú hợp cấp (không bị giảm kinh nghiệm) ở bãi săn hợp cấp của võ hồn ra trận.",
    goals: [{ k: "kill", fit: true, n: 15, text: "Hạ hồn thú hợp cấp" }], honTe: 80, shards: 3,
    offer: ["Học viên Sử Lai Khắc mà không ra rừng mỗi ngày thì chỉ là người thường mặc đồng phục.", "Ra bãi săn hợp cấp, hạ mười lăm con hồn thú. Hồn thú yếu hơn mình quá nhiều thì không tính!"],
    done: ["Được, hôm nay ngươi chưa phụ cái danh quái vật."] },
  { id: "don_bay", group: "hunt", name: "Dọn bầy hồn thú", desc: "Hạ thật nhiều hồn thú hợp cấp ở bãi săn hợp cấp của võ hồn ra trận.",
    goals: [{ k: "kill", fit: true, n: 25, text: "Hạ hồn thú hợp cấp" }], honTe: 120, shards: 4,
    offer: ["Dân quanh thành than hồn thú sinh sôi quá nhanh. Sử Lai Khắc nhận việc này, mà học viện thì cần tiền.", "Hạ hai mươi lăm con hồn thú hợp cấp. Làm xong ta chia cho ngươi một phần, đừng mặc cả."],
    done: ["Hai mươi lăm con, không thiếu con nào. Phần của ngươi đây, cầm lấy trước khi ta đổi ý."] },
  { id: "dau_hon", group: "misc", name: "Thực chiến ở Đấu Hồn Trường", desc: "Đánh một trận ở Đại Đấu Hồn Trường (góc đông nam Thiên Đấu Thành), thắng thua đều được.",
    goals: [{ k: "arena", n: 1, near: "dau_hon_truong", text: "Đánh một trận đấu hồn" }], honTe: 80, shards: 3,
    offer: ["Năm xưa học viên của ta lăn lộn ở đấu hồn trường mà trưởng thành. Đánh với hồn thú khác hẳn đánh với hồn sư.", "Vào Đại Đấu Hồn Trường đánh một trận. Thắng hay thua không quan trọng, quan trọng là ngươi dám bước lên sân."],
    done: ["Thế nào, đối thủ biết suy nghĩ thì khó chơi hơn hồn thú nhiều phải không?"] },
  { id: "phoi_hop", group: "misc", name: "Phối hợp đội hình", desc: "Đang giao chiến thì đổi võ hồn (phím 1–4) nhiều lần và tung chiêu tiên cơ.",
    goals: [{ k: "switch", n: 5, text: "Đổi võ hồn khi đang giao chiến" }, { k: "tienco", n: 2, text: "Tung chiêu tiên cơ" }], honTe: 70, shards: 3,
    offer: ["Bảy quái vật Sử Lai Khắc mạnh vì biết phối hợp, không phải vì từng đứa mạnh.", "Ra trận đổi tay năm lần, tung tiên cơ hai lần. Để ta xem đội võ hồn của ngươi ăn ý tới đâu."],
    done: ["Không tệ. Đổi tay mà không lúng túng, đó mới là đội hình."] },
  { id: "nop_hon_hach", group: "misc", name: "Hồn hạch cho học viện", desc: "Mang hai hồn hạch chưa nâng cấp (đang để trong túi) tới nộp cho Phất Lan Đức.",
    goals: [{ k: "give", item: CORE_ITEM, n: 2, text: "Nộp hồn hạch" }], honTe: 90, shards: 3,
    offer: ["Phòng thí nghiệm của học viện thiếu hồn hạch. Đừng nhìn ta như thế, đây là việc nghiêm túc!", "Mang cho ta hai hồn hạch, sao nào cũng được, miễn chưa nâng cấp và không đang gắn trên võ hồn."],
    done: ["Hai hồn hạch, tốt. Phần thưởng của ngươi đây, học viện không để học viên chịu thiệt đâu… lần này."] },
  { id: "nop_hon_hoan", group: "misc", name: "Hồn hoàn cho học viện", desc: "Mang một hồn hoàn (đang để trong túi) tới nộp cho Phất Lan Đức.",
    goals: [{ k: "give", item: RING_ITEM, n: 1, text: "Nộp hồn hoàn" }], honTe: 70, shards: 3,
    offer: ["Đại Sư cần hồn hoàn để nghiên cứu. Hồn hoàn không hấp thụ được thì cũng đừng để mục trong túi.", "Mang cho ta một hồn hoàn, niên hạn bao nhiêu cũng được."],
    done: ["Hồn hoàn này Đại Sư sẽ dùng tới. Cầm lấy phần thưởng."] },
  { id: "tiep_te", group: "misc", name: "Tiếp tế đan dược", desc: "Mua Hồi Huyết Đan ở Thương hội Thiên Đấu rồi nộp cho Phất Lan Đức.",
    goals: [{ k: "give", item: "hoi_huyet_dan", n: 5, near: "thuong_nhan_thien_dau", text: "Nộp Hồi Huyết Đan" }], honTe: 120, shards: 2,
    offer: ["Kho đan dược của học viện lại cạn. Thương hội Thiên Đấu ngay trong thành, ngươi chạy một chuyến.", "Mang cho ta năm viên Hồi Huyết Đan. Tiền mua ta trả lại, còn dư một chút coi như công chạy việc."],
    done: ["Đủ năm viên. Đây, tiền của ngươi, thêm chút công. Ta đâu có keo kiệt như người ta đồn."] },
];
const DAILY_RE = /^daily:(\d{8}):(\d+)$/;
/** "2026-10-21" (vnDay) -> "20261021": phần ngày trong mã chuỗi khảo hạch. */
export const dailyKey = (day: string) => day.replace(/-/g, "");
/** Mã chuỗi của DAILY.count bài khảo hạch ngày `day` (vnDay): "daily:20261021:0"… */
export const dailyIds = (day: string) => Array.from({ length: DAILY.count }, (_, i) => `daily:${dailyKey(day)}:${i}`);
/** Mã chuỗi là bài khảo hạch hằng ngày (của ngày nào cũng được). */
export const isDaily = (chain: string) => DAILY_RE.test(chain);
/** Số ngẫu nhiên ổn định (mulberry32) theo `seed`: cùng ngày thì cùng bộ bài. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Bộ bài khảo hạch của ngày `key` (yyyymmdd): mẫu và võ hồn của mảnh thưởng từng bài. */
export function dailyPicks(key: string): { tpl: DailyTemplate; shard: string }[] {
  const rnd = seeded(Number(key) * 2654435761), pick = <T,>(l: T[]) => l[Math.floor(rnd() * l.length)];
  const hunt = DAILY_POOL.filter((t) => t.group === "hunt"), misc = DAILY_POOL.filter((t) => t.group === "misc");
  const out = [pick(hunt)];
  while (out.length < DAILY.count && misc.length) out.push(misc.splice(Math.floor(rnd() * misc.length), 1)[0]);
  return out.map((tpl) => ({ tpl, shard: pick(ARENA_SHARDS) }));
}
const dailyCache = new Map<string, QuestChain>();
/** Chuỗi một bước của bài khảo hạch mã `id` (dailyIds); mã sai thì undefined. */
function dailyChain(id: string): QuestChain | undefined {
  const hit = dailyCache.get(id); if (hit) return hit;
  const m = DAILY_RE.exec(id), i = m ? Number(m[2]) : -1, p = m && i < DAILY.count ? dailyPicks(m[1])[i] : undefined;
  if (!m || !p) return undefined;
  const t = p.tpl, c: QuestChain = { id, name: DAILY.name, giver: DAILY.giver, map: DAILY.map, finale: "Bài hôm nay xong rồi. Mai quay lại, ta có bài mới.",
    steps: [{ id: t.id, name: t.name, desc: t.desc, goals: t.goals, offer: t.offer, done: t.done,
      reward: { honTe: t.honTe, items: [{ code: shardCode(p.shard), qty: t.shards }] } }] };
  if (dailyCache.size > 64) dailyCache.clear();
  dailyCache.set(id, c);
  return c;
}
/** Hồn thú `years` năm hợp cấp với võ hồn cấp `level`: hạ nó không bị giảm kinh nghiệm theo chênh cấp (xpLevelScale = 1). */
export const fitBeast = (level: number, years: number) => xpLevelScale(level, beastLevel(years)) >= 1;
/** Bản đồ săn hợp cấp với cấp `level` (cấp đề xuất của bản đồ chứa nó): chỉ đường cho mục tiêu `fit`. */
export const fitMaps = (level: number) => {
  const lv = Math.max(1, Math.min(MAX_LEVEL, level));
  return Object.values(MAPS).filter((m) => m.kind === "hunt" && m.level && lv >= m.level[0] && lv <= m.level[1]).map((m) => m.id);
};
// ---------- Cộng minh (mục 5.10, bước 8.2; mốc theo thiết kế, giá trị cộng đã chốt) ----------
/** Chỉ số phần gốc dùng trong calcStats; giá trị là điểm phần trăm. */
export type ResStat = "hp" | "mp" | "atk";
export const RES_STAT_NAMES: Record<ResStat, string> = { hp: "Sinh lực", mp: "Hồn lực", atk: "Công" };
/** Hiệu ứng cộng minh công khai; crit / def / spd là hiệu ứng mới của trụ Sao võ hồn. */
export type ResEffect = ResStat | "crit" | "def" | "spd";
export const RES_EFFECT_NAMES: Record<ResEffect, string> = {
  hp: "Sinh lực", mp: "Hồn lực", atk: "Công", crit: "Chí mạng", def: "Giảm sát thương nhận", spd: "Tốc chạy",
};
export type ResPillar = "vohon" | "ring" | "bone" | "core" | "star";
/** Một mốc của trụ cột: đạt `need` thì cộng thêm `bonus` (% mỗi chỉ số, cộng dồn với các mốc trước). */
export interface ResonanceStep { need: number; bonus: Partial<Record<ResEffect, number>>; }
/** Trụ cột cộng minh: tên, thứ được đếm (`what`, hiện trong câu "x/mốc …"), màu giao diện, các mốc tăng dần. */
export interface ResonanceDef { id: ResPillar; name: string; what: string; col: string; steps: ResonanceStep[]; }
/** Trụ cột Võ hồn đếm võ hồn sở hữu từ cấp này (mục 5.10). */
export const RES_VOHON_LEVEL = 30;
/** Trụ cột Hồn cốt đếm hồn cốt **đang gắn** đã cường hóa từ cấp này (đã chốt: đang gắn, không tính hồn cốt nằm trong túi). */
export const RES_BONE_ENHANCE = 10;
/** Trụ cột Hồn hạch đếm hồn hạch **đang gắn** từ ngần này sao (đã chốt: đang gắn, không tính hồn hạch nằm trong túi). */
export const RES_CORE_STARS = 5;
/** Hiệu ứng cộng minh mới có giới hạn riêng, áp dụng sau khi cộng các mốc. */
export const RESONANCE_EFFECT_CAP: Partial<Record<ResEffect, number>> = { crit: 3, def: 5, spd: 5 };
export const RESONANCE_RANK_PAGE_SIZE = 10;
export const RESONANCE_RANK_PAGE_MAX = 20;
export const RESONANCE_RANK_CD = 2;
/** Giây giữ bảng xếp hạng cộng minh đã tính (dùng chung mọi phòng); bảng có thể trễ ngần này so với dữ liệu đã lưu. */
export const RESONANCE_RANK_CACHE = 30;
/**
 * 5 trụ cột cộng minh (mục 5.10). Thứ tự là thứ tự mảng tiến độ / mốc (`resonanceProgress`, `resonanceLevels`, tin "resonance");
 * mã `id` cố định. Mốc lấy đúng bảng ví dụ 5.10; **giá trị cộng đã chốt**:
 * Võ hồn +3 / +3 / +4% sinh lực, Hồn hoàn +3 / +3 / +4% công, Hồn cốt +2% sinh lực và +2% công mỗi mốc, Hồn hạch +4% hồn lực và
 * +2% công mỗi mốc. Đủ 15 mốc: sinh lực +16%, công +22%, hồn lực +12%;
 * trụ Sao cộng chí mạng / giảm sát thương nhận / tốc chạy theo bảng dưới, sau khi kẹp theo RESONANCE_EFFECT_CAP.
 * Tính lại từ dữ liệu sẵn có của tài khoản (võ hồn, hồn hoàn, đồ đang gắn), không lưu DB riêng.
 */
export const RESONANCE: ResonanceDef[] = [
  { id: "vohon", name: "Võ hồn", what: `võ hồn cấp ${RES_VOHON_LEVEL}+`, col: "#d09a20",
    steps: [{ need: 4, bonus: { hp: 3 } }, { need: 6, bonus: { hp: 3 } }, { need: 8, bonus: { hp: 4 } }] },
  { id: "ring", name: "Hồn hoàn", what: "hồn hoàn đã hấp thụ (mọi võ hồn)", col: "#9a62e0",
    steps: [{ need: 10, bonus: { atk: 3 } }, { need: 25, bonus: { atk: 3 } }, { need: 50, bonus: { atk: 4 } }] },
  { id: "bone", name: "Hồn cốt", what: `hồn cốt +${RES_BONE_ENHANCE} trở lên đang gắn`, col: "#b89a60",
    steps: [{ need: 6, bonus: { hp: 2, atk: 2 } }, { need: 12, bonus: { hp: 2, atk: 2 } }, { need: 24, bonus: { hp: 2, atk: 2 } }] },
  { id: "core", name: "Hồn hạch", what: `hồn hạch ${RES_CORE_STARS}★ trở lên đang gắn`, col: "#3aa8c0",
    steps: [{ need: 8, bonus: { mp: 4, atk: 2 } }, { need: 16, bonus: { mp: 4, atk: 2 } }, { need: 24, bonus: { mp: 4, atk: 2 } }] },
  { id: "star", name: "Sao võ hồn", what: "sao cộng thêm trên mọi võ hồn", col: "#e6b84d",
    steps: [{ need: 4, bonus: { crit: 1 } }, { need: 10, bonus: { def: 1 } }, { need: 18, bonus: { spd: 2 } }] },
];
/** Dữ liệu tài khoản dùng để tính cộng minh: mọi võ hồn sở hữu (cấp, số hồn hoàn), hồn cốt / hồn hạch **đang gắn**. */
export interface ResonanceInput { vohons: { level: number; rings: number; stars?: number }[]; bones: { enhance: number }[]; cores: { stars: number }[]; }
/** Tiến độ từng trụ cột (theo thứ tự RESONANCE). Hàm thuần: server tính, client chỉ hiển thị số server gửi. */
export function resonanceProgress(a: ResonanceInput): number[] {
  const of: Record<ResPillar, number> = {
    vohon: a.vohons.filter((v) => v.level >= RES_VOHON_LEVEL).length,
    ring: a.vohons.reduce((s, v) => s + v.rings, 0),
    bone: a.bones.filter((b) => b.enhance >= RES_BONE_ENHANCE).length,
    core: a.cores.filter((c) => c.stars >= RES_CORE_STARS).length,
    star: a.vohons.reduce((s, v) => s + Math.max(0, Math.floor(v.stars ?? 1) - 1), 0),
  };
  return RESONANCE.map((r) => of[r.id]);
}
/** Số mốc đã đạt của từng trụ cột (0..số mốc), theo tiến độ `prog`. */
export const resonanceLevels = (prog: readonly number[]) => RESONANCE.map((r, i) => r.steps.filter((s) => (prog[i] ?? 0) >= s.need).length);
/** Tổng % cộng minh (mọi trụ cột, mọi mốc đã đạt) → tham số `res` của calcStats. */
export function resonanceBonus(levels: readonly number[]): Record<ResEffect, number> {
  const out: Record<ResEffect, number> = { hp: 0, mp: 0, atk: 0, crit: 0, def: 0, spd: 0 };
  RESONANCE.forEach((r, i) => r.steps.slice(0, Math.max(0, levels[i] ?? 0)).forEach((s) => {
    for (const [k, v] of Object.entries(s.bonus) as [ResEffect, number][]) out[k] += v;
  }));
  for (const [k, cap] of Object.entries(RESONANCE_EFFECT_CAP) as [ResEffect, number][]) out[k] = Math.min(cap, out[k]);
  return out;
}
/** "Sinh lực +6%, Công +3%" ("" nếu không cộng gì). */
export const resonanceText = (b: Partial<Record<ResEffect, number>>) =>
  (Object.keys(RES_EFFECT_NAMES) as ResEffect[]).filter((k) => b[k]).map((k) => `${RES_EFFECT_NAMES[k]} +${b[k]}%`).join(", ");

export interface ResonanceRankValue {
  score: number;
  milestones: number;
  progressBp: number;
  extraStars: number;
}
/** Điểm xếp hạng cộng minh: mốc 1/2/3 lần lượt được 1/2/3 điểm, tối đa 30 điểm. */
export function resonanceRankValue(prog: readonly number[], levels: readonly number[], extraStars = 0): ResonanceRankValue {
  let score = 0, milestones = 0, progressBp = 0;
  RESONANCE.forEach((r, i) => {
    const lv = Math.max(0, Math.min(r.steps.length, Math.floor(levels[i] ?? 0)));
    for (let n = 1; n <= lv; n++) score += n;
    milestones += lv;
    const finalNeed = r.steps.at(-1)?.need ?? 0;
    progressBp += finalNeed ? Math.min(10000, Math.floor(Math.max(0, prog[i] ?? 0) / finalNeed * 10000)) : 0;
  });
  return { score, milestones, progressBp, extraStars: Math.max(0, Math.floor(extraStars)) };
}
export interface ResonanceRankRow extends ResonanceRankValue { accountId: number; }
/** So sánh giảm dần theo công thức đã chốt; accountId tăng dần là tie-break ổn định cuối cùng. */
export const resonanceRankCompare = (a: ResonanceRankRow, b: ResonanceRankRow) =>
  b.score - a.score || b.milestones - a.milestones || b.progressBp - a.progressBp || b.extraStars - a.extraStars || a.accountId - b.accountId;
// ---------- Tự săn (mục 5.13, Auto 1; chủ repo chốt 2026-10-22) ----------
/**
 * Tự săn khi online: server lái hồn sư bằng đúng các lệnh của người chơi (đi, đánh, hồn kỹ, đổi võ hồn, đan, nhặt), nên hiệu suất bằng
 * tự đánh (không giảm kinh nghiệm hay đồ rơi). Mỗi tài khoản treo tối đa AUTO_DAILY_SECS giây mỗi ngày (đặt lại 00:00 giờ Việt Nam).
 */
export const AUTO_DAILY_SECS = 12 * 3600;
/**
 * Phạm vi tự săn (`AutoSettings.scope`, #213): "map" (mặc định) săn khắp bản đồ đang đứng: nhắm hồn thú gần nhất hợp khoảng niên hạn
 * trong AUTO_RADIUS quanh mình, không có thì trên cả bản đồ (chỉ chỗ đi bộ tới được, không qua cổng / truyền tống, đường không đi vào vùng
 * an toàn), nhặt đồ trong AUTO_RADIUS quanh mình. "near" ("Chỉ quanh chỗ đứng", kiểu Auto 1) chỉ săn trong bán kính quanh điểm neo.
 */
export type AutoScope = "map" | "near";
/**
 * Bán kính (pixel) quanh điểm neo (chỗ bật tự săn) khi phạm vi "near": chỉ nhắm hồn thú, nhặt đồ trong vùng này; ra ngoài thì quay về.
 * Người chơi chọn trong bảng Tự động (`AutoSettings.radius`, số ô) từ AUTO_RADIUS_MIN tới AUTO_RADIUS (mặc định lớn nhất).
 */
export const AUTO_RADIUS = 15 * TILE;
export const AUTO_RADIUS_MIN = 5 * TILE;
/**
 * Nhịp quyết định (lần mỗi giây): giữ / đổi mục tiêu, tìm đường A*, hồn kỹ, đan, đổi tay tiên cơ, nhặt. Giữa hai nhịp server chỉ lái
 * hướng đi theo đường đã tìm và đánh thường khi mục tiêu trong tầm (như người giữ phím đánh).
 */
export const AUTO_HZ = 4;
/**
 * Trần tốc độ tự săn (chủ repo chốt 2026-10-22, #213): hiệu suất tối đa bằng tự đánh, cùng mốc với ủy thác offline. Mỗi hồn thú thường
 * người đang tự săn hạ (mục tiêu, đánh trả hay trúng lan) cộng vào "nợ nhịp" số giây offlineFight tính cho con đó với chỉ số võ hồn ra
 * trận lúc hạ (thời gian tự đánh một con, kể cả tìm / đi tới OFFLINE.seek). Nợ giảm theo thời gian thực; còn nợ thì không nhắm con mới
 * (đứng nghỉ, vẫn đánh trả và nhặt đồ). Mỗi con vì thế tốn khoảng max(thời gian thật, ước lượng). Nợ bị kẹp ở −`credit` giây khi không
 * có mục tiêu và khi thôi nhắm một mục tiêu (thời gian rảnh / đi đường dư không tích để sau hạ dồn); lúc đang đi tới / đánh một con thì
 * không kẹp, để trận dài hơn `credit` giây không bị tính hai lần (thời gian thật đã gồm trong ước lượng).
 */
export const AUTO_PACE = { credit: 10 };
/** Tối đa bấy nhiêu người treo có điểm neo trong cùng một ô lưới SYNC_VIEW.cell của một kênh (chống dồn một chỗ). */
export const AUTO_MAX_PER_CELL = 3;
/**
 * Không cướp quái: hồn thú đang nhắm người khác, hoặc bị người khác đánh trong AUTO_CLAIM_SECS giây gần nhất (ngoài tổ đội của mình),
 * thì không nhắm; hồn thú đang đánh chính mình thì luôn được đánh trả (kể cả ngoài khoảng niên hạn đã chọn).
 */
export const AUTO_CLAIM_SECS = 8;
/**
 * Di chuyển của tự săn: không có việc thì đi tới một điểm ngẫu nhiên trong vùng neo (phạm vi "map": quanh chỗ đang đứng), đổi điểm sau
 * `patrol` giây; mục tiêu / đồ không tới được hoặc kẹt `stuck` giây thì bỏ qua `skip` giây; mục tiêu đi xa đường đã tìm thì tìm lại sau
 * ít nhất `repath` giây. Tìm đường A* (shared/path.ts) trong khung `path` quanh chỗ đứng; đích xa hơn khung thì đi theo điểm trung gian
 * của đồ thị dẫn đường `nav` (#213): bản đồ chia khối `block`×`block` ô, mỗi vùng ô liền nhau trong một khối là một nút; A* trên đồ thị
 * nút rồi nối các điểm trung gian bằng đường thẳng (nhìn trước tối đa `look` nút) hoặc A* trong khung `path`.
 */
export const AUTO_MOVE = { patrol: [3, 6] as const, stuck: 1.5, skip: 10, repath: 1, path: { maxTiles: 24, maxNodes: 2500 }, nav: { block: 8, look: 6 } };
/**
 * Loại vật phẩm khác (ngoài hồn hoàn, hồn cốt, hồn hạch) có thể nằm dưới đất khi tự săn: mảnh võ hồn và tiên thảo rơi xuống khi túi
 * người hạ đã đầy. Bảng Tự động cho chọn nhặt từng loại (`AutoSettings.kinds`).
 */
export const AUTO_LOOT_KINDS: ItemKind[] = ["manh_vo_hon", "tien_thao"];
/**
 * Tự săn đánh tinh anh, thú vương, boss thế giới (#218, chủ repo chốt 2026-10-22; mục 5.13). Đây là mục tiêu chung: không có luật
 * "cướp quái", ai cũng vào đánh, đóng góp theo tài khoản; tự săn chỉ nhắm con mà mình còn nhận được thưởng (tinh anh chưa khóa
 * ELITE.lock, thú vương / boss thế giới còn lượt KING.daily / WORLD.daily và chưa nhận rương của khung giờ đó). Không tính vào trần
 * AUTO_PACE (máu boss tăng theo số người nên treo không hạ nhanh hơn tự đánh; thưởng đã giới hạn theo lượt / khóa); hồn thú thường bị
 * gọi ra trong trận (bầy, nhện con) vẫn tính như mọi hồn thú thường.
 * - `dodge`: né chiêu báo trước (kể cả chiêu toàn sàn, vòng an toàn) và vùng lưu lại trên đất: đứng trong vùng thì đi tới chỗ an toàn
 *   gần nhất đi thẳng tới được, tìm trên `dirs` hướng, mỗi `step` pixel tới `max` pixel (cùng các vòng an toàn của chiêu toàn sàn).
 * - `retreat` / `back`: sinh lực võ hồn ra trận dưới `retreat` phần thì lùi ra cách boss ít nhất `dist` pixel (uống đan theo ngưỡng
 *   cài đặt như thường), từ `back` phần mới quay lại đánh.
 * - `cleanse`: trạng thái xấu trên mình còn từ ngần ấy giây (Vết thương sâu của boss thế giới) thì đổi sang võ hồn phụ trợ có hồn kỹ
 *   thanh tẩy để giải; `hold`: giữ võ hồn đổi vì cơ chế (khống chế ngắt tích lực, phụ trợ thanh tẩy, đúng hệ điểm yếu / phá Bá Thể) tối
 *   đa ngần ấy giây mỗi lần rồi thôi (hồi chiêu chưa xong thì không đứng chờ mãi).
 * - `chill`: Cực Hàn (#163) từ ngần ấy tầng Hàn (STATUS.chill.max tầng thì Đóng băng) thì thanh tẩy (như trên) hoặc, không có thanh tẩy sẵn
 *   sàng, tới đứng cạnh Hỏa Đàn cho tới khi hết tầng.
 */
export const AUTO_BOSS = { dodge: { dirs: 16, step: 12, max: 168 }, retreat: 0.3, back: 0.6, dist: 120, cleanse: 8, hold: 8, chill: 2 };
/** Cài đặt tự săn của tài khoản (bảng `auto_hunt`; chỉnh ở bảng Tự động, Auto 2). */
export interface AutoSettings {
  scope: AutoScope;        // săn khắp bản đồ ("map") hay chỉ quanh điểm neo ("near")
  radius: number;          // bán kính vùng neo khi "near" (số ô, AUTO_RADIUS_MIN..AUTO_RADIUS)
  years: [number, number]; // khoảng niên hạn hồn thú thường được nhắm (số năm)
  hp: number; mp: number;  // uống đan khi sinh lực võ hồn ra trận / hồn lực dưới tỉ lệ này (0 = không uống)
  mpKeep: number;          // chừa tỉ lệ hồn lực này: không tung hồn kỹ làm hồn lực còn dưới mức đó
  skills: number[];        // thứ tự ưu tiên các ô hồn kỹ (0–3 = U / I / O / P); ô không có trong danh sách thì không tung
  slots: number[];         // thứ tự ưu tiên các ô đội hình (0 = ô 1) khi đổi tay tung tiên cơ; ô không có trong danh sách thì không đổi vào
  ring: number;            // nhặt hồn hoàn từ bấy nhiêu năm (−1 = không nhặt hồn hoàn)
  bone: boolean; core: boolean; // nhặt hồn cốt, hồn hạch dưới đất
  coreStar: number;        // chỉ nhặt hồn hạch từ bấy nhiêu sao (1..MAX_CORE_STARS)
  kinds: ItemKind[];       // loại vật phẩm khác được nhặt (trong AUTO_LOOT_KINDS)
  stopNoPot: boolean;      // cần uống đan hồi sinh lực mà hết thì dừng
  tienCo: boolean;         // võ hồn khác trong đội đầy năng lượng tiên cơ thì đổi tay vào tung, hết hồi chiêu đổi thì về võ hồn cũ
  elite: boolean; king: boolean; world: boolean; // #218: đánh cả tinh anh, thú vương, boss thế giới xuất hiện trên bản đồ đang đứng
}
/**
 * Mặc định: săn khắp bản đồ (vùng neo lớn nhất nếu chọn "near"), mọi niên hạn, uống đan dưới 45% sinh lực / 25% hồn lực, chừa 15% hồn
 * lực, hồn kỹ ô P → U, nhặt mọi thứ, đánh cả tinh anh, thú vương, boss thế giới (#218).
 */
export const AUTO_DEFAULTS: AutoSettings = { scope: "map", radius: AUTO_RADIUS / TILE, years: [0, MAX_YEARS], hp: 0.45, mp: 0.25, mpKeep: 0.15,
  skills: [3, 2, 1, 0], slots: Array.from({ length: TEAM_SIZE }, (_, i) => i), ring: 0, bone: true, core: true, coreStar: 1,
  kinds: [...AUTO_LOOT_KINDS], stopNoPot: false, tienCo: true, elite: true, king: true, world: true };
/** Cài đặt từ client / DB: kẹp từng giá trị, thiếu hoặc sai thì lấy mặc định (AUTO_DEFAULTS). */
export function parseAuto(raw: unknown): AutoSettings {
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>, D = AUTO_DEFAULTS;
  const num = (v: unknown, lo: number, hi: number, def: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def);
  const bool = (v: unknown, def: boolean) => (typeof v === "boolean" ? v : def);
  const y = Array.isArray(o.years) ? o.years : [];
  const y0 = Math.round(num(y[0], 0, MAX_YEARS, D.years[0])), y1 = Math.round(num(y[1], 0, MAX_YEARS, D.years[1]));
  const order = (v: unknown, n: number, def: number[]) => (Array.isArray(v)
    ? [...new Set(v.filter((i): i is number => Number.isInteger(i) && (i as number) >= 0 && (i as number) < n))] : [...def]);
  // Bản lưu từ Auto 1 chưa có `kinds` mà có cờ `item` (nhặt vật phẩm khác): false thì không nhặt loại nào.
  const kinds = Array.isArray(o.kinds) ? AUTO_LOOT_KINDS.filter((k) => (o.kinds as unknown[]).includes(k)) : o.item === false ? [] : [...D.kinds];
  // Bản lưu trước #213 chưa có `scope`: săn khắp bản đồ như mặc định mới.
  return { scope: o.scope === "near" ? "near" : "map", radius: Math.round(num(o.radius, AUTO_RADIUS_MIN / TILE, AUTO_RADIUS / TILE, D.radius)), years: [Math.min(y0, y1), Math.max(y0, y1)],
    hp: num(o.hp, 0, 0.95, D.hp), mp: num(o.mp, 0, 0.95, D.mp), mpKeep: num(o.mpKeep, 0, 0.9, D.mpKeep),
    skills: order(o.skills, LOADOUT_SIZE, D.skills), slots: order(o.slots, TEAM_SIZE, D.slots),
    ring: Math.round(num(o.ring, -1, MAX_YEARS, D.ring)), bone: bool(o.bone, D.bone), core: bool(o.core, D.core),
    coreStar: Math.round(num(o.coreStar, 1, MAX_CORE_STARS, D.coreStar)), kinds, stopNoPot: bool(o.stopNoPot, D.stopNoPot), tienCo: bool(o.tienCo, D.tienCo),
    // Bản lưu trước #218 chưa có ba công tắc: bật như mặc định.
    elite: bool(o.elite, D.elite), king: bool(o.king, D.king), world: bool(o.world, D.world) };
}
/**
 * Giây tự săn còn lại khi hôm nay đã dùng `used` giây: phần còn của AUTO_DAILY_SECS cộng quỹ giờ cộng thêm `bonus` (Ủy Thác Lệnh).
 */
export const autoLeft = (used: number, bonus = 0) => Math.max(0, AUTO_DAILY_SECS - used) + Math.max(0, bonus);
/**
 * Tổng kết một lượt tự săn (Auto 2), server gửi trong tin `auto` khi tắt / dừng: số giây đã treo, hồn thú đã hạ, kinh nghiệm (tổng
 * mọi võ hồn trong đội nhận), Hồn Tệ, đồ đã nhặt hoặc vào thẳng túi (tên món, số lượng; tối đa AUTO_SUM_LOOT dòng, nhiều nhất trước).
 * `sold`: số món đã tự bán trong lượt (#216) và Hồn Tệ thu được (đã nằm trong `coins`); không có thì lượt đó không tự bán gì.
 */
export interface AutoSummary { secs: number; kills: number; xp: number; coins: number; loot: [string, number][]; sold?: [number, number]; }
export const AUTO_SUM_LOOT = 12;
/** "11 giờ 30 phút" / "45 phút" (làm tròn xuống theo phút): giờ treo còn lại để hiển thị. */
export const autoTimeText = (secs: number) => {
  const m = Math.floor(Math.max(0, secs) / 60), h = Math.floor(m / 60);
  return h ? `${h} giờ${m % 60 ? ` ${m % 60} phút` : ""}` : `${m} phút`;
};

// ---------- Ủy thác offline (mục 5.13 "Ủy thác offline", Auto 3; chủ repo chốt hiệu suất 100%, chung quỹ AUTO_DAILY_SECS) ----------
/**
 * Ủy thác khi offline: thoát game ở bản đồ săn, đứng trong một vùng săn (ngoài vùng an toàn, không gục) thì lần vào sau server tính
 * thưởng theo thời gian vắng mặt bằng công thức, không sinh hay hạ hồn thú thật. Thời gian theo đồng hồ server.
 * - `minSecs`: vắng dưới bấy nhiêu giây thì không tính (vào lại ngay, đổi máy).
 * - `maxSecs`: trần giây tính cho một lần nhận, ngoài quỹ AUTO_DAILY_SECS mỗi ngày dùng chung với tự săn online.
 * - `rings`: tối đa bấy nhiêu hồn hoàn mỗi lần nhận (theo thứ tự hạ; sau đó bỏ qua như món tự săn không nhặt).
 * - `seek`: giây tìm / đi tới / nhặt đồ mỗi con (ngoài thời gian đánh và hồi máu); `skill`: hệ số sát thương của hồn kỹ, tiên cơ so với
 *   chỉ đánh thường. Hiệu chỉnh 2026-10-22 theo số con mỗi giờ của tự săn online lúc vùng còn đủ hồn thú (phút đầu, chưa săn cạn quanh
 *   điểm neo): Tinh Đấu Ngoại vi / Nội địa, võ hồn cấp 21–45, công thức lệch số đo khoảng ±30% (hồn kỹ diện rộng hạ nhiều con một lúc).
 * - `hpCap`: một trận lấy quá phần này sinh lực tối đa thì coi là không đánh nổi (bỏ con đó, mất `seek` giây).
 */
export const OFFLINE = { minSecs: 300, maxSecs: 24 * 3600, rings: 20, seek: 3.5, skill: 1.5, hpCap: 0.8 };
/** Chỉ số võ hồn ra trận cho công thức ủy thác (MapRoom chụp lúc nhận): công, chí mạng, sinh lực tối đa, hệ số sát thương nhận VOHON.def. */
export interface OfflinePower { atk: number; crit: number; critMult: number; maxHp: number; def: number; }
/**
 * Thời gian (giây) hạ một hồn thú thường `years` năm, loài `species` (mã BEASTS) khi ủy thác: đánh = máu / DPS (đánh thường mỗi
 * ATTACK_CD, chí mạng kỳ vọng, thủ của loài qua defMult, × OFFLINE.skill), hồi máu = sát thương nhận trong trận (đòn thường mỗi
 * BEAST_ATK_CD × `def`) / hồi sinh lực ngoài giao chiến (PLAYER_REGEN.hpCalm), cộng OFFLINE.seek. `ok` = false khi trận lấy quá
 * OFFLINE.hpCap sinh lực tối đa (không đánh nổi: chỉ mất OFFLINE.seek giây).
 */
export function offlineFight(pw: OfflinePower, years: number, species: string) {
  const st = beastStats(years);
  const dps = pw.atk * (1 + pw.crit * (pw.critMult - 1)) * defMult(beastDef(species, years), 0) * OFFLINE.skill / ATTACK_CD;
  const fight = dps > 0 ? st.hp / dps : Infinity, taken = fight * st.dmg * pw.def / BEAST_ATK_CD;
  const ok = pw.maxHp > 0 && taken <= pw.maxHp * OFFLINE.hpCap;
  return { ok, secs: ok ? OFFLINE.seek + fight + taken / (pw.maxHp * PLAYER_REGEN.hpCalm) : OFFLINE.seek };
}
/**
 * Chia quãng vắng mặt `secs` giây kết thúc lúc `endMs` (đồng hồ lịch boss, bossNow) theo ngày giờ Việt Nam: mỗi ngày tính tối đa phần
 * quỹ AUTO_DAILY_SECS còn lại (ngày `usedDay` đã treo `used` giây, ngày khác chưa treo), cộng dồn từ ngày cũ tới ngày mới tới trần
 * OFFLINE.maxSecs. Auto 2: phần thời gian trong ngày vượt quỹ miễn phí thì lấy tiếp từ quỹ giờ cộng thêm `bonus` (Ủy Thác Lệnh, không
 * theo ngày) tới khi hết quỹ, vẫn trong trần OFFLINE.maxSecs. Trả các phần được tính [{ day, secs, bonus? }] theo thứ tự thời gian
 * (`bonus`: phần lấy từ quỹ cộng thêm, trong một ngày luôn sau phần miễn phí).
 */
export function offlineSplit(endMs: number, secs: number, usedDay: string, used: number, bonus = 0) {
  const out: { day: string; secs: number; bonus?: true }[] = [];
  let t = endMs - Math.max(0, secs) * 1000, total = 0, extra = Math.max(0, bonus);
  while (t < endMs && total < OFFLINE.maxSecs) {
    const day = vnDay(t), next = Math.min(endMs, vnAt(t, "00:00", 1)), span = (next - t) / 1000;
    const n = Math.min(span, autoLeft(day === usedDay ? used : 0), OFFLINE.maxSecs - total);
    if (n > 0) { out.push({ day, secs: n }); total += n; }
    const b = Math.min(span - Math.max(0, n), extra, OFFLINE.maxSecs - total);
    if (b > 0) { out.push({ day, secs: b, bonus: true }); total += b; extra -= b; }
    t = next;
  }
  return out;
}
