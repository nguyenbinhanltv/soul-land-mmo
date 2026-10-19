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
/** Khoảng năm [nhỏ nhất, lớn nhất] của bậc `tier` (bảng màu 5.2): trắng 10–99 … đen 10.000–99.999, đỏ đúng 100.000. */
export const tierBand = (tier: number): [number, number] =>
  [TIERS[tier].years, tier + 1 < TIERS.length ? TIERS[tier + 1].years - 1 : MAX_YEARS];
/**
 * Tuổi hồn thú trong khoảng [lo, hi] từ một số ngẫu nhiên r ∈ [0, 1) (server tự gọi Math.random()). Phân bố theo log (chờ chốt):
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
export type MapKind = "town" | "hunt" | "boss";
export interface MapDef {
  /** Mã cố định, cũng là tên file Tiled `shared/assets/<id>.json`. */
  id: string;
  name: string; kind: MapKind;
  level: [number, number] | null; // cấp đề xuất (thành: null)
  years: [number, number] | null; // niên hạn hồn thú (thành: null)
  /** Mã võ hồn (VOHON) mà hồn thú bản đồ này rơi mảnh (bảng "Rơi đặc trưng" mục 5.3, bước 3.4); mọi vùng của bản đồ dùng chung. */
  shards: string[];
  /** Mã bộ hồn hạch (CORE_SETS) đặc trưng của bản đồ (bảng "Rơi đặc trưng" mục 5.3, bước 5.1): hồn hạch rơi ở đây phần lớn thuộc các bộ này. */
  cores: string[];
}

/** Bản đồ đang có (bảng 5.3). Cổng tới bản đồ chưa có (Lõi Tinh Đấu, BĐ6) thì không đặt trong Tiled. */
export const MAPS: Record<string, MapDef> = {
  thanh_hon_thon: { id: "thanh_hon_thon", name: "Thánh Hồn Thôn", kind: "hunt", level: [1, 10], years: [10, 450],
    shards: ["lam_ngan_thao", "nhu_cot_tho"], cores: ["lam_ngan", "tien_co"] },
  nac_dinh_thanh: { id: "nac_dinh_thanh", name: "Nặc Đinh Thành", kind: "town", level: null, years: null, shards: [], cores: [] },
  // BĐ3: tách Tinh Đấu Đại Sâm Lâm (`tinh_dau` của BĐ1–BĐ2) thành Ngoại vi và Nội địa.
  tinh_dau_ngoai_vi: { id: "tinh_dau_ngoai_vi", name: "Tinh Đấu Ngoại vi", kind: "hunt", level: [10, 30], years: [300, 2000],
    shards: ["u_minh_linh_mieu", "kim_vu_mieu_ung", "xuc_xich"], cores: ["linh_mieu", "hao_thien", "xa_hoang"] },
  tinh_dau_noi_dia: { id: "tinh_dau_noi_dia", name: "Tinh Đấu Nội địa", kind: "hunt", level: [30, 60], years: [1500, 25000],
    shards: ["tu_vong_chu_hoang", "lam_dien_ba_vuong_long", "cuu_tinh_that_sat_kiem"], cores: ["ba_vuong_long", "that_sat", "luu_ly"] },
};
/**
 * Mã bản đồ cũ đã bỏ khỏi MAPS -> bản đồ thay thế (mục 6): `accounts.map_id` còn mã cũ thì vào bản đồ thay thế, ở `spawn`
 * (vị trí cũ không còn nghĩa). Mã không có ở đây và không có trong MAPS thì về DEFAULT_MAP.
 */
export const MAP_MOVED: Record<string, string> = { tinh_dau: "tinh_dau_ngoai_vi" };
/** Bản đồ khởi đầu: tài khoản mới, và tài khoản cũ chưa lưu bản đồ (từ BĐ2), bắt đầu ở đây (mục 5.3). */
export const DEFAULT_MAP = "thanh_hon_thon";
/** "10-30" -> [10, 30]; "10" -> [10, 10]; sai -> null. Dùng cho thuộc tính `level` của cổng và `years` của vùng trong Tiled. */
export function parseLevelRange(s: unknown): [number, number] | null {
  const m = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(String(s ?? ""));
  if (!m) return null;
  const a = Number(m[1]), b = m[2] === undefined ? a : Number(m[2]);
  return a <= b ? [a, b] : null;
}
/** Đi qua cổng: số giây niệm (bị đánh thì hủy, chờ chốt ở 5.3) và số giây server chờ client rời phòng cũ (mục 6). */
export const TRAVEL_CAST = 1;
export const TRAVEL_LEAVE_SECS = 10;

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
];

const VOHON_INDEX = new Map(VOHON.map((v, i) => [v.id, i]));
/** Chỉ số trong VOHON của một mã võ hồn (-1 nếu không có). */
export const vohonIndex = (id: string) => VOHON_INDEX.get(id) ?? -1;

// ---------- Lễ thức tỉnh, đội hình và đổi võ hồn ----------
/** Võ hồn tặng cho mọi tài khoản khi thức tỉnh. */
export const AWAKEN_GIFT = "lam_ngan_thao";
/** Võ hồn được tự chọn khi thức tỉnh: mọi SSR cơ bản. */
export const AWAKEN_CHOICES = VOHON.filter((v) => v.rarity === "SSR");
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
/** Chia kinh nghiệm hạ hồn thú cho đội (mục 5.1): võ hồn ra trận 40%, mỗi võ hồn khác trong đội 20%. Ô trống, võ hồn ở bình cảnh: phần đó bỏ đi. */
export const XP_SHARE_ACTIVE = 0.4;
export const XP_SHARE_BENCH = 0.2;

// ---------- Năng lượng và chiêu tiên cơ (mục 5.1 "Trong trận"; mọi số dưới đây chờ chốt) ----------
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
/** Ngoại hình hồn sư: 4 số nhỏ lưu theo tài khoản, đồng bộ trong PlayerState để người khác thấy. */
export interface Looks { sex: number; hair: number; hairCol: number; outfitCol: number; }
/** Ngoại hình của tài khoản chưa tự chọn (tài khoản tạo trước bước 2.2a). */
export const DEFAULT_LOOKS: Looks = { sex: 0, hair: 0, hairCol: 0, outfitCol: 0 };
/** Kiểm tra ngoại hình: mỗi trường phải là số nguyên trong khoảng của bảng tương ứng. Sai bất kỳ trường nào thì null. */
export function parseLooks(x: unknown): Looks | null {
  const o = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
  const pick = (k: keyof Looks, n: number) => {
    const v = o[k];
    return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < n ? v : -1;
  };
  const sex = pick("sex", SEXES.length);
  const l: Looks = { sex, hair: pick("hair", HAIR_STYLES[Math.max(0, sex)].length), hairCol: pick("hairCol", HAIR_COLORS.length), outfitCol: pick("outfitCol", OUTFIT_COLORS.length) };
  return Object.values(l).every((v) => v >= 0) ? l : null;
}

/** Hướng nhìn 4 phía của hồn sư (trường `dir` trong PlayerState): chỉ số trong mảng này. Hướng trái do client lật ngang hướng phải. */
export const DIRS4 = ["down", "right", "up", "left"] as const;
/** Hướng nhìn theo vector di chuyển: trục trội quyết định, chéo đúng 45° thì ưu tiên ngang. */
export const dir4 = (x: number, y: number) => (Math.abs(x) >= Math.abs(y) ? (x >= 0 ? 1 : 3) : y > 0 ? 0 : 2);

// ---------- Trạng thái dùng chung (mục 5.1 "Trạng thái dùng chung"; bước 2.5a, mọi số chờ chốt) ----------
/** Thứ tự trong mảng là bit trong `BeastState.st` (bit i = 1 << i). Chỉ thêm vào cuối. */
export const STATUS_IDS = ["burn", "shock", "poison", "vuln", "armor", "stun", "silence", "root",
  // Từ 2.5c (lưu phái Cảm điện): Mị hoặc (cộng dồn thành Mê hoặc), Mê hoặc, Làm chậm, Phong ấn (cộng dồn thành Dễ thương).
  "allure", "charm", "slow", "lock"] as const;
export type StatusId = (typeof STATUS_IDS)[number];
/**
 * - `secs`: thời gian mặc định (giây); gây lại thì lấy thời gian còn lại dài hơn. `max`: số tầng tối đa (1 = không cộng dồn).
 * - `dot`: sát thương mỗi giây cho mỗi tầng = dot × công người gây × sức mạnh hồn kỹ lúc gây (không chí mạng, không tạo năng lượng tiên cơ).
 * - `amp`: Dễ thương: hồn thú nhận thêm amp sát thương từ mọi nguồn; Phá giáp: thêm amp mỗi tầng cho đòn trực tiếp (hồn thú
 *   chưa có chỉ số thủ, "giảm thủ" tạm quy thành nhận thêm sát thương đòn trực tiếp; đổi khi hồn thú có thủ).
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
  dot: number; amp: number; healCut: number; chain: number; chainR: number; boom: number;
  noMove: boolean; noAtk: boolean; noSkill: boolean;
  slow: number; wander: boolean; burst?: { s: StatusId; secs?: number };
}
const st = (name: string, col: string, secs: number, max: number, o: Partial<StatusDef> = {}): StatusDef =>
  ({ name, col, secs, max, dot: 0, amp: 0, healCut: 0, chain: 0, chainR: 0, boom: 0, noMove: false, noAtk: false, noSkill: false, slow: 0, wander: false, ...o });
export const STATUS: Record<StatusId, StatusDef> = {
  burn:    st("Thiêu đốt", "#ff7a2a", 4, 5, { dot: 0.25, boom: 1.5 }),
  shock:   st("Cảm điện",  "#7fd0ff", 6, 1, { chain: 0.4, chainR: 64 }),
  poison:  st("Trúng độc", "#6ee06a", 6, 5, { dot: 0.18, healCut: 0.5 }),
  vuln:    st("Dễ thương", "#ff6b9a", 5, 1, { amp: 0.25 }),
  armor:   st("Phá giáp",  "#c0cce0", 6, 3, { amp: 0.1 }),
  stun:    st("Choáng",    "#ffe08a", 1.5, 1, { noMove: true, noAtk: true }),
  silence: st("Câm lặng",  "#b58cff", 3, 1, { noSkill: true }), // từ 3.5 không còn chặn đánh thường của hồn thú
  root:    st("Trói",      "#4ab0ff", 2, 1, { noMove: true }),
  // Từ 2.5c (chờ chốt): Yêu Hồ cộng dồn Mị hoặc (mỗi tầng chậm 15%), đủ 3 tầng thì Mê hoặc 2,5 giây; Càn Khôn Hỗn Nguyên Tỏa
  // cộng dồn Phong ấn, đủ 3 tầng thì Dễ thương 6,8 giây. Đang Mê hoặc thì không nhận thêm Mị hoặc (không khống chế nối liền).
  allure:  st("Mị hoặc",   "#ff9ad5", 5, 3, { slow: 0.15, burst: { s: "charm" } }),
  charm:   st("Mê hoặc",   "#ff5ab8", 2.5, 1, { noAtk: true, wander: true }),
  slow:    st("Làm chậm",  "#a0c8ff", 2, 1, { slow: 0.4 }),
  lock:    st("Phong ấn",  "#e0b04a", 6, 3, { burst: { s: "vuln", secs: 6.8 } }),
};
/** Tốc độ hồn thú giảm tối đa ngần này dù chồng nhiều trạng thái làm chậm (2.5c). */
export const SLOW_CAP = 0.8;
export const statusBit = (s: StatusId) => 1 << STATUS_IDS.indexOf(s);
/** Trạng thái sát thương theo thời gian gây sát thương mỗi ngần này giây. */
export const STATUS_TICK = 1;
/** Thời gian khống chế (noMove / noAtk) nhân theo bậc hồn thú: hồn thú vạn năm, 10 vạn năm bị khống chế ngắn hơn. */
export const CC_TIER_MULT = [1, 1, 1, 0.75, 0.5];
/**
 * Trạng thái trên hồn sư (từ 3.5, chờ chốt): chỉ chiêu báo trước của hồn thú gây, cùng bảng STATUS và luật cộng tầng. Choáng: không
 * đi, không đánh, không dùng hồn kỹ; Trói: không đi; Câm lặng: không dùng hồn kỹ; Làm chậm: giảm tốc (tối đa SLOW_CAP); Trúng độc /
 * Thiêu đốt: mỗi tầng `dot` × sát thương đòn thường của hồn thú mỗi giây; Dễ thương / Phá giáp: nhận thêm sát thương; Cảm điện: đòn
 * của hồn thú trúng hồn sư Cảm điện lan `chain` sang hồn sư Cảm điện khác trong `chainR`. Thuộc hồn sư nên đổi võ hồn vẫn còn; vào
 * vùng an toàn, cả đội gục thì hết. Tiên cơ Xúc Xích (Thanh Tâm Hương Tràng) và Thiên Càn Bạch Ngọc Đỉnh (Bạch Ngọc Thánh Quang) giải
 * mọi trạng thái này.
 */
export const PLAYER_STATUS: readonly StatusId[] = ["poison", "burn", "shock", "vuln", "armor", "stun", "silence", "root", "slow"];
/** Hồn thú không có mục tiêu và không bị đánh `delay` giây thì hồi `pct` sinh lực tối đa mỗi giây (Trúng độc giảm hồi máu). */
export const BEAST_REGEN = { delay: 6, pct: 0.04 };
/** Hồn thú từ 100 năm (bậc 1 trở lên) thấy người chơi trong bán kính BEAST_AGGRO_R thì đuổi đánh; không có mục tiêu thì lang thang
 *  tối đa BEAST_WANDER pixel mỗi trục quanh chỗ sinh. */
export const BEAST_AGGRO_R = 70, BEAST_WANDER = 60;
/** Không sinh hồn thú trong khoảng này (mỗi trục) quanh trại cổng (object `spawn`), mọi cổng và mọi điểm xuất hiện `arrive` (mục 5.3,
 *  5.8), để vừa tới nơi, vừa hồi sinh hay đang niệm cổng không bị vây. Phải ≥ BEAST_WANDER + BEAST_AGGRO_R (130) thì hồn thú tự lang thang
 *  mới không tới tầm phát hiện người đứng ở đó; 160 như GATE_CLEAR của BĐ3 (đã gộp vào đây). Người chơi kéo hồn thú về thì vẫn bị đuổi. */
export const SPAWN_CLEAR = 160;

// ---------- Chiêu có báo trước của hồn thú (mục 5.3, 5.4; bước 3.5, mọi số chờ chốt) ----------
/** Hình vùng: vệt (đường thẳng dài `r`, rộng `w`), nón (quạt bán kính `r`, góc `arc` độ), vòng (tròn bán kính `r`). */
export type TeleShape = "line" | "cone" | "circle";
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
 */
export interface BeastSkillDef {
  name: string; shape: TeleShape; at?: "target";
  r: number; w?: number; arc?: number; range: number;
  warn: number; cd: number; dmg: number;
  status?: StatusApply[]; dash?: boolean; years?: number;
  count?: number; spread?: number; step?: number;
  summon?: { species: string; n: number }; pull?: number;
}
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
  // "Để lại vũng độc" của Thất Tinh Độc Thiềm chưa làm: Trúng độc 3 tầng thay cho vũng.
  that_tinh_doc_thiem: [bs("Phun Độc", "circle", 34, { at: "target", range: 120, dmg: 1, status: [{ s: "poison", n: 3, secs: 5 }] })],
  xich_lan_mang: [bs("Quấn Siết", "circle", 32, { dmg: 1.2, status: [{ s: "root", secs: 1.5 }] })],
  hac_vu_bien_buc: [bs("Âm Ba", "cone", 64, { arc: 70, dmg: 1, status: [{ s: "silence", secs: 2 }] })],
  lam_loi_te_nguu: [bs("Lôi Xung", "line", 140, { w: 18, dmg: 1.7, dash: true, cd: 9, status: [{ s: "shock" }] })],
  loi_duc_ung:  [bs("Lôi Bạo", "circle", 34, { at: "target", range: 130, dmg: 1.6, status: [{ s: "shock" }] })],
  am_kim_khung_trao_hung: [bs("Vỗ Đất", "circle", 56, { dmg: 2, status: [{ s: "stun", secs: 0.6 }] })],
  kiem_vi_hat:  [bs("Kiếm Vĩ Đâm", "line", 85, { w: 12, dmg: 1.6, status: [{ s: "armor", n: 2 }] })],
  quy_anh_bao:  [bs("Ảnh Trảm", "cone", 54, { arc: 90, dmg: 1.8 })],
};
/** Chiêu báo trước của hồn thú thường loài `species` (mã) `years` năm: chiêu cuối cùng đủ năm, không có thì null. */
export function beastSkillOf(species: string, years: number): BeastSkillDef | null {
  if (years < BEAST_SKILL_YEARS) return null;
  const list = (BEAST_SKILLS[species] ?? []).filter((s) => years >= (s.years ?? BEAST_SKILL_YEARS));
  return list.length ? list[list.length - 1] : null;
}
/** Một vùng cảnh báo đã khóa: gốc (x, y), hướng `ang` (radian, vệt / nón), kích thước theo BeastSkillDef. */
export interface Tele { shape: TeleShape; x: number; y: number; ang: number; r: number; w: number; arc: number; }
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
 */
export function teleZones(def: BeastSkillDef, bx: number, by: number, tx: number, ty: number): Tele[] {
  const ang = Math.atan2(ty - by, tx - bx), at = def.at === "target", n = Math.max(1, def.count ?? 1), out: Tele[] = [];
  for (let k = 0; k < n; k++) {
    const off = n > 1 ? k / (n - 1) - 0.5 : 0; // -0,5 .. 0,5
    if (def.shape === "circle" && at) {
      const d = off * (n - 1) * (def.step ?? def.r * 2);
      out.push({ shape: "circle", x: tx + Math.cos(ang) * d, y: ty + Math.sin(ang) * d, ang, r: def.r, w: 0, arc: 0 });
    } else {
      const a = ang + off * ((def.spread ?? 0) * Math.PI) / 180;
      out.push({ shape: def.shape, x: at ? tx : bx, y: at ? ty : by, ang: a, r: def.r, w: def.w ?? 0, arc: def.arc ?? 0 });
    }
  }
  return out;
}

// ---------- Tinh anh, thú vương, boss thế giới (mục 5.4, 6; bước BĐ4, mọi số chờ chốt) ----------
/** Bậc hồn thú (`BeastState.rank`): 0 thường, 1 tinh anh, 2 tà hóa thú vương (BĐ5), 3 boss thế giới (BĐ6). */
export const RANK_NAMES = ["", "Tinh anh", "Tà hóa", "Boss thế giới"] as const;
/**
 * Một tinh anh / thú vương / boss. `species`: loài gốc (mã BEASTS): dùng lại chỉ số theo năm của loài và sprite (phóng ELITE.scale).
 * `aura`: màu vầng sáng riêng (client vẽ bằng code). `skills`: chiêu báo trước (tinh anh: 2 chiêu, cùng bộ máy với 3.5).
 * Hệ số máu / sát thương theo bậc nằm ở ELITE (thú vương thêm `hp` riêng khi làm BĐ5).
 */
export interface BossDef { id: string; name: string; rank: 1 | 2 | 3; species: string; aura: string; skills: BeastSkillDef[]; }
/**
 * Bảng BOSSES (mục 6). Mã cố định, dùng trong thuộc tính `boss` của object `elite` (Tiled); `BeastState.species` của hồn thú bậc > 0
 * là chỉ số trong bảng này, nên chỉ thêm vào cuối. BĐ4: 11 tinh anh của 3 bản đồ săn, tên và chiêu theo cột Tinh anh ở bảng 5.3.
 * Chiêu nhiều nhát nối tiếp (Tam Liên Vồ, Liên Hoàn Trảo, Cuồng Bạo Vỗ "2 lần liền", Lôi Trụ "nổ lần lượt") làm bản tối thiểu:
 * các vùng tung cùng lúc / gộp bội số (chờ chốt). Loài gốc chưa có trong BEASTS thì mượn loài gần nhất (Ảnh Trảo Linh Miêu: Tử Văn
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
    // Vũng độc 6 giây chưa làm (như Phun Độc 3.5): Trúng độc 3 tầng 6 giây thay cho vũng.
    bs("Nổ Túi Độc", "circle", 56, { dmg: 1.2, status: [{ s: "poison", n: 3, secs: 6 }] }),
    bs("Lưỡi Quất", "line", 110, { w: 12, dmg: 1.1, pull: 60 })] },
  { id: "lam_dien_loi_tich", name: "Lam Điện Lôi Tích", rank: 1, species: "lam_loi_te_nguu", aura: "#4ab0ff", skills: [
    bs("Lôi Trụ", "circle", 26, { at: "target", range: 140, count: 3, step: 46, dmg: 1.6, status: [{ s: "shock" }] }),
    bs("Lôi Quang Xung", "line", 170, { w: 18, dmg: 1.8, dash: true, cd: 9, status: [{ s: "shock" }] })] },
  { id: "huyet_van_khung_trao_hung", name: "Huyết Văn Khủng Trảo Hùng", rank: 1, species: "am_kim_khung_trao_hung", aura: "#e0303a", skills: [
    bs("Ám Kim Liệt Địa", "line", 110, { w: 14, count: 3, spread: 50, dmg: 1.8 }),
    bs("Cuồng Bạo Vỗ", "circle", 56, { dmg: 2.6, status: [{ s: "stun", secs: 0.6 }] })] },
];
const BOSS_INDEX = new Map(BOSSES.map((b, i) => [b.id, i]));
/** Chỉ số trong BOSSES của một mã (-1 nếu không có). */
export const bossIndex = (id: string) => BOSS_INDEX.get(id) ?? -1;
/**
 * Tinh anh (mục 5.4, chờ chốt trừ các số đã ghi trong bảng 5.4): máu x`hp`, sát thương x`dmg` so với hồn thú thường cùng loài, cùng
 * năm (niên hạn = mức trên của vùng); kinh nghiệm x`xp`; tỉ lệ hồn cốt x`bone` (nhân vào boneChance, bảng rơi 4.1); hồi sinh
 * ngẫu nhiên `respawn` giây sau khi bị hạ; sprite loài gốc phóng `scale`.
 * Người tham gia: đứng trong `radius` pixel lúc tinh anh bắt đầu giao chiến (lần đầu bị đánh), hoặc gây sát thương sau đó; ở ngoài
 * bán kính `outSecs` giây liên tục hoặc rời phòng thì bị loại; số người giảm tối đa 1 mỗi `dropEvery` giây; `idleSecs` giây không còn
 * người tham gia nào trong bán kính thì bỏ giao chiến (về chỗ, hồi đầy máu, xóa danh sách và đóng góp).
 */
export const ELITE = { hp: 2.5, dmg: 1.5, xp: 2.5, bone: 3, respawn: [480, 720] as [number, number], scale: 1.25,
  radius: 250, outSecs: 30, dropEvery: 10, idleSecs: 15 };
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
 * Cuồng nộ của tinh anh (chờ chốt): máu dưới `hp` phần tối đa thì nổi cuồng nộ `secs` giây, sát thương (đánh thường và chiêu) +`dmg`,
 * tốc độ +`spd`; hết giờ hoặc bị xóa thì `cd` giây sau mới nổi lại được (nếu máu vẫn dưới mức).
 */
export const ELITE_RAGE = { hp: 0.5, dmg: 0.3, spd: 0.25, secs: 10, cd: 20 };

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
/** Bán kính lãnh vực phượng hoàng (pixel), đi theo hồn sư; đổi võ hồn vẫn còn như mọi hiệu ứng có lợi (bước 2.5b, chờ chốt). */
export const PHOENIX_FIELD_R = 90;
export const buffBit = (b: BuffId) => 1 << BUFF_IDS.indexOf(b);
/** Tỉ lệ chí mạng gốc của đòn đánh vào hồn thú và hệ số sát thương chí mạng. */
export const CRIT = { chance: 0.12, mult: 1.8 };

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
 * - `copy` (self): Phục Chế: tung lại hồn kỹ gần nhất của một võ hồn khác còn trong đội và chưa gục; sát thương và hiệu ứng lên
 *   bản thân (hồi máu, khiên, hồn lực, hiệu ứng có lợi trừ inv/hide) × `copy`, theo hồn hoàn của vòng này.
 * Từ 3.5: `self.cleanse`: giải mọi trạng thái trên hồn sư (PLAYER_STATUS, do chiêu báo trước của hồn thú gây).
 * Từ BĐ4: `dispel`: xóa mọi hiệu ứng có lợi (BEAST_BUFF_IDS, ví dụ Cuồng nộ của tinh anh) trên hồn thú trúng ("xóa buff địch").
 */
export interface SkillDef {
  name: string; desc: string; icon: string; cost: number; cd: number;
  area: SkillArea; r: number; dmg: number;
  n?: number; every?: number; spread?: number; pctHp?: number; perStack?: { s: StatusId; dmg: number };
  crit?: number; lifesteal?: number; pull?: boolean; dash?: number; inv?: number; glow?: boolean; shake?: boolean;
  status?: StatusApply[]; finisher?: StatusApply[];
  boom?: { keep: number }; push?: number; pick?: "near" | "low"; lowHp?: number; fly?: number;
  at?: number; fixed?: boolean; copy?: number;
  self?: { buff?: Partial<Record<BuffId, number>>; secs?: number; heal?: number; shield?: number; mp?: number; cleanse?: boolean };
  dispel?: boolean;
}

/**
 * 4 hồn kỹ dùng chung (Giai đoạn 1) cho võ hồn chưa có hồn kỹ riêng. Không đổi số khi thêm hồn kỹ riêng. Từ 2.5d mọi võ hồn trong
 * VOHON đều có hồn kỹ riêng nên không võ hồn nào dùng bảng này nữa; giữ làm dự phòng cho võ hồn thêm sau (Phá Hồn Thương, A Ngân…).
 */
export const SKILLS: SkillDef[] = [
  { name: "Hồn Bạo",    desc: "Nổ hồn lực quanh thân", icon: "✹", cost: 12, cd: 3,   area: "around", r: 50, dmg: 2.2 },
  { name: "Thiểm Kích", desc: "Lao về phía trước",     icon: "➤", cost: 16, cd: 4.5, area: "dash", r: 70, dmg: 2.6, inv: 0.35 },
  { name: "Hồn Tiễn",   desc: "Bắn 10 mũi hồn lực",    icon: "✶", cost: 22, cd: 5,   area: "proj", r: 110.5, dmg: 1.5, n: 10, spread: 360 },
  { name: "Hồn Vực",    desc: "Lãnh vực hủy diệt",     icon: "◎", cost: 40, cd: 12,  area: "around", r: 90, dmg: 4, glow: true, shake: true },
];

/**
 * Hồn kỹ riêng vòng 1–4 theo mã võ hồn (bước 2.5a: 5 võ hồn mẫu, mỗi hệ ít nhất một; 2.5b: 5 võ hồn lưu phái Thiêu đốt; 2.5c: 5 võ hồn lưu phái Cảm điện;
 * 2.5d: 5 võ hồn còn lại, đủ cả 20; mọi số chờ chốt). Hồn kỹ thứ i mở khi có
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
  // ---- Bước 2.5b: lưu phái Thiêu đốt (mọi số chờ chốt) ----
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
  // ---- Bước 2.5c: lưu phái Cảm điện (mọi số chờ chốt). Combo mẫu: Kim Vũ Miêu Ưng / Càn Khôn Hỗn Nguyên Tỏa phủ Cảm điện,
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
  // Mẫn công, cảm điện: bay, vuốt gây tê liệt (co giật, câm lặng); áo nghĩa phủ Cảm điện toàn vùng.
  kim_vu_mieu_ung: [
    { name: "Kim Vũ Trảo", desc: "Lướt tới mục tiêu, vuốt sét 2 nhát: Cảm điện", icon: "≋", cost: 12, cd: 3.5,
      area: "target", r: 50, dash: 40, n: 2, every: 0.15, dmg: 1.1, status: [{ s: "shock" }] },
    { name: "Lôi Trảo Tê Liệt", desc: "Vuốt sét tê liệt mục tiêu: co giật 3 giây (không đi), Câm lặng 5 giây", icon: "✋", cost: 16, cd: 9,
      area: "target", r: 70, dash: 60, dmg: 1.6, status: [{ s: "root", secs: 3 }, { s: "silence", secs: 5 }] },
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
    { name: "Phục Chế Hương Tràng", desc: "Áo nghĩa: sao chép hồn kỹ vừa tung của võ hồn khác trong đội (chưa gục), sát thương và hiệu ứng × 0,8", icon: "⧉", cost: 30, cd: 14,
      area: "self", r: 0, dmg: 0, copy: 0.8 },
  ],
  // ---- Bước 2.5d: 5 võ hồn còn lại (mọi số chờ chốt). Từ đây cả 20 võ hồn trong VOHON đều có hồn kỹ riêng. ----
  // Cường công, phá giáp: Vô Ngã Kiếm Trận sát thương diện rộng liên tục, Liệt thương (Phá giáp); tuyệt kỹ Kiếm Trảm Sơn Hà.
  cuu_tinh_that_sat_kiem: [
    { name: "Thất Sát Kiếm Khí", desc: "Kiếm khí quét nửa trước mặt: Liệt thương (Phá giáp 1 tầng)", icon: "⚔", cost: 12, cd: 3.5,
      area: "front", r: 48, dmg: 2.2, status: [{ s: "armor" }] },
    { name: "Cửu Tinh Kiếm Vũ", desc: "Phóng 9 thanh kiếm hình quạt, mỗi kiếm Phá giáp 1 tầng", icon: "✶", cost: 16, cd: 5.5,
      area: "proj", r: 130, n: 9, spread: 80, dmg: 0.7, status: [{ s: "armor" }] },
    { name: "Vô Ngã Kiếm Trận", desc: "Kiếm trận xoay quanh thân 3 giây, 6 nhát, mỗi nhát Phá giáp 1 tầng", icon: "✵", cost: 24, cd: 10,
      area: "around", r: 72, n: 6, every: 0.5, dmg: 0.6, status: [{ s: "armor" }] },
    { name: "Kiếm Trảm Sơn Hà", desc: "Một kiếm chém núi sông nửa trước mặt: mỗi tầng Phá giáp trên mục tiêu thêm 40% công", icon: "⚡", cost: 40, cd: 14,
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
  // tuyệt kỹ Quỷ Ảnh Trùng Trùng tàng hình cả đội (hiệu ứng thuộc hồn sư nên đổi võ hồn vẫn còn).
  quy_mi: [
    { name: "Quỷ Ảnh Trảo", desc: "Quỷ ảnh lướt tới vồ mục tiêu: hút 30% sát thương thành sinh lực", icon: "≋", cost: 12, cd: 4,
      area: "target", r: 60, dash: 40, dmg: 1.6, lifesteal: 0.3 },
    { name: "Quỷ Huyết Ấn", desc: "20% mọi sát thương gây ra hồi thành sinh lực trong 10 giây (cả đội: đổi võ hồn vẫn còn)", icon: "♥", cost: 16, cd: 16,
      area: "self", r: 0, dmg: 0, self: { buff: { leech: 0.2 }, secs: 10 } },
    { name: "Quỷ Lực Gia Trì", desc: "Công +25%, chí mạng +10% trong 10 giây (cả đội)", icon: "✦", cost: 20, cd: 16,
      area: "self", r: 0, dmg: 0, self: { buff: { atk: 0.25, crit: 0.1 }, secs: 10 } },
    { name: "Quỷ Ảnh Trùng Trùng", desc: "Tuyệt kỹ: cả đội tàng hình 5 giây (hồn thú mất dấu), công +30%; ra đòn thì hiện hình", icon: "☾", cost: 40, cd: 20,
      area: "self", r: 0, dmg: 0, self: { buff: { hide: 1, atk: 0.3 }, secs: 5 } },
  ],
  // Phụ trợ, đánh boss: hồi máu, khiên, Dễ thương cho đồng đội đánh; kỹ năng Tịnh Thế Lưu Ly. "Xóa buff địch" và "thanh tẩy đội"
  // chưa làm: hồn thú chưa có hiệu ứng có lợi, hồn sư chưa bị trạng thái xấu (chờ hồn thú có chiêu, bước 3.5 / BĐ4; chờ chốt).
  thien_can_bach_ngoc_dinh: [
    { name: "Bạch Ngọc Hồi Xuân", desc: "Hồi 18% sinh lực cả đội", icon: "✚", cost: 12, cd: 9,
      area: "self", r: 0, dmg: 0, self: { heal: 0.18 } },
    { name: "Bạch Ngọc Hộ Thuẫn", desc: "Khiên 15% sinh lực tối đa, sát thương nhận giảm 15% trong 6 giây", icon: "◈", cost: 16, cd: 14,
      area: "self", r: 0, dmg: 0, self: { buff: { def: 0.15 }, secs: 6, shield: 0.15 } },
    { name: "Thiên Càn Trấn Áp", desc: "Đỉnh ngọc trấn áp quanh thân: Dễ thương 6 giây, Câm lặng 2 giây, xóa hiệu ứng có lợi của hồn thú", icon: "▼", cost: 20, cd: 10,
      area: "around", r: 80, dmg: 1.2, status: [{ s: "vuln", secs: 6 }, { s: "silence", secs: 2 }], dispel: true },
    { name: "Tịnh Thế Lưu Ly", desc: "Hồi 30% sinh lực cả đội, khiên 20% sinh lực tối đa 6 giây", icon: "✷", cost: 40, cd: 18,
      area: "self", r: 0, dmg: 0, glow: true, self: { secs: 6, heal: 0.3, shield: 0.2 } },
  ],
};
/** Hồn kỹ của một võ hồn: bảng riêng nếu có, không thì 4 hồn kỹ dùng chung. */
export const skillsOf = (vohonId: string) => VOHON_SKILLS[vohonId] ?? SKILLS;

/**
 * Chiêu tiên cơ riêng (bước 2.5a, nâng từ tiên cơ chung theo hệ của 2.4 cho 5 võ hồn mẫu; 2.5b thêm 5 võ hồn Thiêu đốt, 2.5c thêm 5 võ hồn Cảm điện, 2.5d thêm 5 võ hồn còn lại; chờ chốt). Chạy bằng cùng bộ máy
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
  cuu_bao_luu_ly_thap: { name: "Vô Địch Thần Quang", desc: "cả đội miễn sát thương 2,5 giây, hồi 20% sinh lực", icon: "✷", cost: 0, cd: 0,
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
};

/**
 * Ràng buộc (mục 5.1, chờ chốt): hai võ hồn cùng trong đội (ô bất kỳ, kể cả đang gục) thì hồn sư có thêm hiệu ứng, võ hồn nào ra
 * trận cũng hưởng. Bản tối thiểu ở 2.5d chỉ có hai cặp ví dụ của thiết kế. `crit`: cộng tỉ lệ chí mạng mọi đòn trực tiếp;
 * `burn`: Thiêu đốt do hồn sư gây mạnh thêm tỉ lệ này (tính lúc gây, như tăng công).
 */
export interface BondDef { name: string; pair: [string, string]; desc: string; crit?: number; burn?: number; }
export const BONDS: BondDef[] = [
  { name: "Hạo Thiên – Nhu Cốt", pair: ["hao_thien_chuy", "nhu_cot_tho"], desc: "chí mạng +10%", crit: 0.1 },
  { name: "Tà Hỏa – Hỏa Ảnh", pair: ["ta_hoa_phuong_hoang", "hoa_anh"], desc: "Thiêu đốt mạnh thêm 20%", burn: 0.2 },
];
/** Ràng buộc đang có của một đội (danh sách mã võ hồn trong đội). */
export const bondsOf = (vohonIds: string[]) => BONDS.filter((b) => b.pair.every((v) => vohonIds.includes(v)));
/**
 * Phong Lôi Chi Lực (bước 2.5c, chờ chốt): thanh riêng của Lam Điện Bá Vương Long, 0..max, thuộc hồn sư (không lưu DB). Mỗi đòn đánh
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

// ---------- Hấp thụ hồn hoàn (mục 5.2 "Hấp thụ", bước 3.3; tỉ lệ thất bại chờ chốt) ----------
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
 * `bones` (bước 4.2): tổng chỉ số gốc các hồn cốt đang gắn (boneBonus), cộng thẳng sau hệ số hệ và sao: hồn cốt +118 hồn lực
 * thì võ hồn nào cũng +118.
 */
export function calcStats(vh: number, level: number, rings: number[], stars = 1, bones: Partial<Record<BoneStat, number>> = {}) {
  const v = VOHON[vh], k = starMult(stars);
  let hpB = 0, atkB = 0;
  for (const t of rings) { hpB += TIERS[t].hpb; atkB += TIERS[t].atkb; }
  return {
    maxHp: Math.round((80 + level * 14 + hpB) * v.hp * k) + (bones.hp ?? 0),
    maxMp: Math.round((40 + level * 4 + rings.length * 15) * v.mp * k) + (bones.mp ?? 0),
    atk: (6 + level * 1.6 + atkB) * v.atk * k + (bones.atk ?? 0),
    speed: 58 * v.spd,
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
 * **(chờ chốt)** Mỗi sao trên 1 cộng STAR_STAT vào chỉ số gốc (sinh lực, hồn lực, công; không đổi tốc độ): 6★ = +25%.
 * Hiệu ứng hồn kỹ mở theo sao (mục 5.1) để bước sau.
 */
export const STAR_STAT = 0.05;
export const starMult = (stars: number) => 1 + STAR_STAT * (Math.max(1, Math.min(MAX_STARS, Math.floor(stars) || 1)) - 1);
/**
 * **(chờ chốt)** Tỉ lệ rơi mảnh võ hồn khi hạ hồn thú, theo số năm (bảng rơi mục 5.3): từ `years` năm trở lên thì `p`.
 * Rơi SHARD_QTY mảnh của một võ hồn ngẫu nhiên trong MAPS[...].shards, vào thẳng túi người hạ.
 */
export const SHARD_DROP = [{ years: 0, p: 0.1 }, { years: 1000, p: 0.15 }, { years: 10000, p: 0.2 }, { years: 100000, p: 1 }];
export const shardChance = (years: number) => SHARD_DROP.reduce((p, x) => (years >= x.years ? x.p : p), 0);
/** Số mảnh mỗi lần rơi (chờ chốt). */
export const SHARD_QTY = 1;
/** Mảnh gộp tối đa ngần này một ô (chờ chốt; đủ cho 6★ cần 460 mảnh trong một ô). */
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
 * **(chờ chốt)** Chỉ số chính `stat` = hệ số `k` × mức cộng của hồn hoàn cùng số năm (TIERS `hpb` cho sinh lực / hồn lực,
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
 * **(chờ chốt)** Tỉ lệ rơi hồn cốt khi hạ hồn thú thường, theo số năm (bảng rơi mục 5.3): dưới 1.000 năm 0%, 1.000–9.999 1%,
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
 * Tổng chỉ số chính của các hồn cốt đang gắn trên một võ hồn (bước 4.2, kèm cấp cường hóa từ 4.4), đưa vào calcStats. Mỗi vị trí
 * tối đa một hồn cốt (server kiểm tra khi gắn).
 */
export function boneBonus(bones: { slot: unknown; years: number; enhance?: number }[]): Record<BoneStat, number> {
  const out: Record<BoneStat, number> = { hp: 0, mp: 0, atk: 0 };
  for (const b of bones) for (const [k, v] of Object.entries(boneStats(b.slot, b.years, b.enhance ?? 0))) out[k as BoneStat] += v;
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

// ---------- Cường hóa hồn cốt (mục 5.5, bước 4.4; mọi số chờ chốt) ----------
/** Cấp cường hóa tối đa (+0 đến +20). */
export const BONE_MAX_ENHANCE = 20;
/**
 * **(chờ chốt)** Điểm cường hóa để lên từ +n lên +(n + 1): BONE_ENHANCE_COST[n]. Cộng dồn: +5 cần 165 điểm, +10 cần 665,
 * +15 cần 2.180, +20 cần 6.850 (khoảng 5 hồn cốt 100.000 năm cùng vị trí, hay 22 hồn cốt 32.000 năm khác vị trí).
 */
export const BONE_ENHANCE_COST = [20, 25, 30, 40, 50, 60, 75, 95, 120, 150, 185, 230, 290, 360, 450, 570, 710, 890, 1100, 1400];
/** **(chờ chốt)** Nguyên liệu cho ngần này điểm mỗi năm niên hạn (1 điểm / 100 năm: 1.000 năm 10 điểm, 32.000 năm 320). */
export const BONE_FEED_PER_YEAR = 0.01;
/** Nguyên liệu cùng vị trí với hồn cốt được cường hóa thì điểm ×1,5 (mục 5.5 "cùng vị trí được thêm 50%"). */
export const BONE_FEED_SAME_SLOT = 1.5;
/** **(chờ chốt)** Nguyên liệu đã cường hóa thì trả lại ngần này phần điểm đã nạp vào nó (không mất trắng công cường hóa cũ). */
export const BONE_FEED_CARRY = 0.8;
/** Tối đa ngần này nguyên liệu mỗi lần cường hóa (chặn message quá lớn). */
export const BONE_FEED_MAX = 20;
/** **(chờ chốt)** Mỗi cấp cường hóa cộng thêm ngần này phần chỉ số chính gốc (+20 = gấp đôi chỉ số gốc), ít nhất +1 mỗi cấp. */
export const BONE_ENHANCE_STAT = 0.05;
/**
 * **(chờ chốt)** Mốc cường hóa (mục 5.5 "mở thêm một dòng chỉ số phụ hoặc nâng kỹ năng"): bước 4.4 chọn **nâng kỹ năng**. Mỗi
 * mốc đã đạt làm kỹ năng của hồn cốt mạnh thêm BONE_MILESTONE_SKILL (chủ động: sức mạnh và hiệu ứng lên bản thân; bị động: mức
 * cộng, vẫn kẹp BONE_PASSIVE_CAP). Dòng chỉ số phụ ngẫu nhiên để sau (cần bảng dòng phụ, như hồn hạch GĐ5).
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
 * chỉ thêm vào cuối. `col`: màu biểu tượng. Hiệu ứng 2 / 4 món ở bước này chỉ để hiển thị, có tác dụng từ 5.2 (gắn hồn hạch).
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
  { id: "that_sat",      name: "Thất Sát",      tag: "Phá giáp",  col: "#e3e6f0", set2: "+10% xuyên thủ",
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
 * **(chờ chốt)** Chỉ số của hồn hạch. `pct`: tính theo % (hiển thị một chữ số thập phân), không thì cộng phẳng. `main`: chỉ số chính
 * ở 6★ +0; `sub`: mức lớn nhất của một dòng phụ ở 6★; sao thấp hơn nhân CORE_STAR_K. `w`: trọng số khi tung chỉ số chính (dòng phụ
 * tung đều, không trùng nhau và không trùng chỉ số chính). Mã lưu trong DB, không đổi. Cộng vào võ hồn ở 5.2.
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
/** **(chờ chốt)** Hệ số chỉ số theo sao 1★..6★ (chỉ số chính và mức dòng phụ): 6★ = 1. */
export const CORE_STAR_K = [0.15, 0.25, 0.4, 0.55, 0.75, 1];
/** Số dòng phụ khi rơi theo sao 1★..6★ (mục 5.6: 1★ 0 dòng … 6★ 4 dòng; các mức giữa **chờ chốt**). Nâng cấp (5.3) thêm dòng sau. */
export const CORE_SUBS = [0, 1, 1, 2, 3, 4];
export const CORE_MAX_SUBS = 4;
/** **(chờ chốt)** Một dòng phụ tung đều trong [lo, hi] × mức dòng phụ của sao đó. */
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
/** **(chờ chốt)** Trọng số sao trong khoảng, từ sao thấp lên (khoảng 2 sao dùng 2 số đầu): 1–2★ 67% / 33%, 2–4★ 57% / 29% / 14%. */
export const CORE_STAR_W = [4, 2, 1];
/** **(chờ chốt)** Tỉ lệ hồn hạch thuộc bộ đặc trưng của bản đồ (MapDef.cores); còn lại là một bộ bất kỳ trong CORE_SETS. */
export const CORE_MAP_SET = 0.8;
const clampCoreStars = (stars: number) => Math.max(1, Math.min(MAX_CORE_STARS, Math.floor(stars) || 1));
/** Làm tròn một chỉ số: % một chữ số thập phân (tối thiểu 0,1), cộng phẳng số nguyên (tối thiểu 1). */
const coreRound = (k: CoreStat, v: number) => (CORE_STATS[k].pct ? Math.max(0.1, Math.round(v * 10) / 10) : Math.max(1, Math.round(v)));
/** Chỉ số chính của hồn hạch `stars` sao, tính lại từ sao (không lưu DB; cấp nâng cấp cộng thêm ở 5.3). */
export const coreMainValue = (main: CoreStat, stars: number) => coreRound(main, CORE_STATS[main].main * CORE_STAR_K[clampCoreStars(stars) - 1]);
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
/** Tên hồn hạch (mục 5.6): "Hồn hạch Hạo Thiên 4★". */
export const coreName = (set: string, stars: number) => `Hồn hạch ${coreSetName(set)} ${clampCoreStars(stars)}★`;
/** Một dòng chỉ số: "Công +12%", "Sinh lực +300", "Tỉ lệ chí mạng +2,4%". */
export function coreStatText(k: CoreStat, v: number) {
  const s = CORE_STATS[k];
  return `${s.name} +${v.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}${s.pct ? "%" : ""}`;
}

// ---------- Kỹ năng hồn cốt (mục 5.5, bước 4.3; mọi số chờ chốt) ----------
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
/** Kỹ năng chủ động mặc định: tốn 18 hồn lực, hồi 10 giây (chờ chốt); `icon` là chữ trên nút như hồn kỹ. */
const ba = (name: string, desc: string, icon: string, area: SkillArea, r: number, dmg: number, o: Partial<SkillDef> = {}): SkillDef =>
  ({ name, desc, icon, cost: 18, cd: 10, area, r, dmg, ...o });
const bp = (name: string, desc: string, o: Omit<BonePassiveDef, "name" | "desc">): BonePassiveDef => ({ name, desc, ...o });
/**
 * **(chờ chốt)** Kỹ năng hồn cốt theo LOÀI hồn thú gốc (mã trong BEASTS), mỗi loài 1 kỹ năng chủ động (cùng một kỹ năng cho đầu,
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
};
/** 3 vị trí có kỹ năng chủ động theo thứ tự nút (đầu, tay trái, tay phải): chỉ số i của message `boneskill {i}` và `PlayerState.bcds`. */
export const BONE_ACTIVE_SLOTS: BoneSlot[] = BONE_SLOTS.filter((s) => s.active).map((s) => s.id);
/** Bị động của nhiều hồn cốt cộng dồn, mỗi loại tối đa ngần này (chờ chốt). */
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

// ---------- Túi đồ, vật phẩm và Hồn Tệ (mục 5.7, bước 3.1; mọi số dưới đây chờ chốt) ----------
/** Nhóm vật phẩm (cột `items.kind`). Có đan, hồn hoàn, mảnh võ hồn (3.4), hồn cốt (4.1), hồn hạch (5.1); tiên thảo thêm ITEMS ở BĐ6. */
export type ItemKind = "dan" | "hon_hoan" | "hon_cot" | "hon_hach" | "manh_vo_hon" | "tien_thao";
export const ITEM_KINDS: Record<ItemKind, { name: string }> = {
  dan: { name: "Đan dược" },
  hon_hoan: { name: "Hồn hoàn" },
  hon_cot: { name: "Hồn cốt" },
  hon_hach: { name: "Hồn hạch" },
  manh_vo_hon: { name: "Mảnh võ hồn" },
  tien_thao: { name: "Tiên thảo" },
};
/**
 * Một loại vật phẩm. `id` là mã cố định (cột `items.code`), không đổi mã đã dùng. `stack`: số món tối đa trong một ô
 * (1 = không gộp, mỗi món một ô như hồn hoàn có số năm riêng). `cd`: nhóm hồi chiêu dùng chung (DAN_CD).
 * `hp` / `mp`: dùng thì hồi ngần ấy phần sinh lực tối đa của võ hồn ra trận / hồn lực tối đa.
 */
export interface ItemDef { id: string; kind: ItemKind; name: string; desc: string; col: string; stack: number; cd?: "dan"; hp?: number; mp?: number; vohon?: string; }
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
    desc: "Gắn vào ô cùng vị trí trong 6 ô hồn cốt của một võ hồn (bảng đội hình, phím V) để cộng chỉ số. Cường hóa bằng hồn cốt dư (nút Cường hóa…): mỗi cấp tăng chỉ số chính, mốc +5 / +10 / +15 / +20 nâng kỹ năng. Tháo ra vẫn giữ cấp cường hóa." },
  // Hồn hạch (bước 5.1): mỗi món một ô; sao ở `items.stars`, bộ / chỉ số ở `items.stats`. Màu theo bộ (CORE_SETS), `col` chỉ là mặc định.
  { id: CORE_ITEM, kind: "hon_hach", name: "Hồn hạch", col: "#d9b8ff", stack: 1,
    desc: "Mỗi võ hồn có 6 ô hồn hạch; gắn 2 hoặc 4 món cùng bộ thì nhận hiệu ứng bộ (gắn và hiệu ứng bộ mở ở bước 5.2)." },
];
const ITEM_INDEX = new Map(ITEMS.map((d) => [d.id, d]));
/** Định nghĩa vật phẩm theo mã; mã không còn trong ITEMS thì undefined (server vẫn giữ món đồ, client hiện "Vật phẩm lạ"). */
export const itemDef = (code: string) => ITEM_INDEX.get(code);
/** Số ô túi đồ (mỗi ô một món hoặc một chồng đồ gộp). Mở rộng túi để sau. */
export const BAG_SLOTS = 40;
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
