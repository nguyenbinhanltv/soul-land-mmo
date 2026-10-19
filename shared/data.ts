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
}

/** Bản đồ đang có (bảng 5.3). Cổng tới bản đồ chưa có (Lõi Tinh Đấu, BĐ6) thì không đặt trong Tiled. */
export const MAPS: Record<string, MapDef> = {
  thanh_hon_thon: { id: "thanh_hon_thon", name: "Thánh Hồn Thôn", kind: "hunt", level: [1, 10], years: [10, 450] },
  nac_dinh_thanh: { id: "nac_dinh_thanh", name: "Nặc Đinh Thành", kind: "town", level: null, years: null },
  // BĐ3: tách Tinh Đấu Đại Sâm Lâm (`tinh_dau` của BĐ1–BĐ2) thành Ngoại vi và Nội địa.
  tinh_dau_ngoai_vi: { id: "tinh_dau_ngoai_vi", name: "Tinh Đấu Ngoại vi", kind: "hunt", level: [10, 30], years: [300, 2000] },
  tinh_dau_noi_dia: { id: "tinh_dau_noi_dia", name: "Tinh Đấu Nội địa", kind: "hunt", level: [30, 60], years: [1500, 25000] },
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
/** Hồn thú thường không sinh trong ngần này pixel quanh cổng và điểm xuất hiện (`arrive`), để vừa tới nơi hay đứng niệm cổng không bị vây. */
export const GATE_CLEAR = 160;

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
/** Tên 4 kiểu tóc theo giới tính: `HAIR_STYLES[sex][hair]`, sprite `hs_hair_{m/f}_{hair}`. */
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
 * - `noMove` / `noAtk`: khống chế. Câm lặng tạm chặn đòn đánh của hồn thú vì hồn thú chưa có chiêu (từ 3.5 chỉ chặn chiêu báo trước).
 * Từ 2.5c:
 * - `slow`: giảm tốc độ di chuyển của hồn thú theo tỉ lệ, nhân số tầng (cộng mọi trạng thái, tối đa SLOW_CAP).
 * - `wander`: hồn thú bỏ mục tiêu, đi lung tung (Mê hoặc); đi kèm `noAtk`.
 * - `burst`: đủ `max` tầng thì xóa trạng thái này và gây trạng thái `s` (thời gian `secs`, mặc định của `s`): Mị hoặc đủ tầng
 *   thành Mê hoặc, Phong ấn đủ tầng thành Dễ thương 6,8 giây.
 */
export interface StatusDef {
  name: string; col: string; secs: number; max: number;
  dot: number; amp: number; healCut: number; chain: number; chainR: number; boom: number;
  noMove: boolean; noAtk: boolean;
  slow: number; wander: boolean; burst?: { s: StatusId; secs?: number };
}
const st = (name: string, col: string, secs: number, max: number, o: Partial<StatusDef> = {}): StatusDef =>
  ({ name, col, secs, max, dot: 0, amp: 0, healCut: 0, chain: 0, chainR: 0, boom: 0, noMove: false, noAtk: false, slow: 0, wander: false, ...o });
export const STATUS: Record<StatusId, StatusDef> = {
  burn:    st("Thiêu đốt", "#ff7a2a", 4, 5, { dot: 0.25, boom: 1.5 }),
  shock:   st("Cảm điện",  "#7fd0ff", 6, 1, { chain: 0.4, chainR: 64 }),
  poison:  st("Trúng độc", "#6ee06a", 6, 5, { dot: 0.18, healCut: 0.5 }),
  vuln:    st("Dễ thương", "#ff6b9a", 5, 1, { amp: 0.25 }),
  armor:   st("Phá giáp",  "#c0cce0", 6, 3, { amp: 0.1 }),
  stun:    st("Choáng",    "#ffe08a", 1.5, 1, { noMove: true, noAtk: true }),
  silence: st("Câm lặng",  "#b58cff", 3, 1, { noAtk: true }),
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
/** Hồn thú không có mục tiêu và không bị đánh `delay` giây thì hồi `pct` sinh lực tối đa mỗi giây (Trúng độc giảm hồi máu). */
export const BEAST_REGEN = { delay: 6, pct: 0.04 };

// ---------- Hiệu ứng có lợi trên hồn sư (hồn kỹ phụ trợ; thuộc hồn sư nên đổi võ hồn vẫn còn, như khiên) ----------
/** Thứ tự là bit trong `PlayerState.buff`. atk: +công, spd: +tốc độ, def: giảm sát thương nhận, crit: +tỉ lệ chí mạng,
 *  mp: giảm tiêu hao hồn lực của hồn kỹ, inv: miễn mọi sát thương, phoenix: lãnh vực phượng hoàng (từ 2.5b, Tà Hỏa Phượng Hoàng):
 *  hồn thú trong bán kính PHOENIX_FIELD_R quanh hồn sư nhận thêm v sát thương từ mọi nguồn; hide: tàng hình (từ 2.5c, Yêu Hồ):
 *  hồn thú bỏ mục tiêu và không nhắm tới hồn sư, đánh thường hoặc tung hồn kỹ khác thì hiện hình. Chỉ thêm vào cuối. */
export const BUFF_IDS = ["atk", "spd", "def", "crit", "mp", "inv", "phoenix", "hide"] as const;
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
 * - `copy` (self): Phục Chế: tung lại hồn kỹ gần nhất của một võ hồn khác còn trong đội, sức mạnh × `copy` theo hồn hoàn của vòng này.
 */
export interface SkillDef {
  name: string; desc: string; icon: string; cost: number; cd: number;
  area: SkillArea; r: number; dmg: number;
  n?: number; every?: number; spread?: number; pctHp?: number; perStack?: { s: StatusId; dmg: number };
  crit?: number; lifesteal?: number; pull?: boolean; dash?: number; inv?: number; glow?: boolean; shake?: boolean;
  status?: StatusApply[]; finisher?: StatusApply[];
  boom?: { keep: number }; push?: number; pick?: "near" | "low"; lowHp?: number; fly?: number;
  at?: number; fixed?: boolean; copy?: number;
  self?: { buff?: Partial<Record<BuffId, number>>; secs?: number; heal?: number; shield?: number; mp?: number };
}

/** 4 hồn kỹ dùng chung (Giai đoạn 1) cho võ hồn chưa có hồn kỹ riêng. Không đổi số khi thêm hồn kỹ riêng. */
export const SKILLS: SkillDef[] = [
  { name: "Hồn Bạo",    desc: "Nổ hồn lực quanh thân", icon: "✹", cost: 12, cd: 3,   area: "around", r: 50, dmg: 2.2 },
  { name: "Thiểm Kích", desc: "Lao về phía trước",     icon: "➤", cost: 16, cd: 4.5, area: "dash", r: 70, dmg: 2.6, inv: 0.35 },
  { name: "Hồn Tiễn",   desc: "Bắn 10 mũi hồn lực",    icon: "✶", cost: 22, cd: 5,   area: "proj", r: 110.5, dmg: 1.5, n: 10, spread: 360 },
  { name: "Hồn Vực",    desc: "Lãnh vực hủy diệt",     icon: "◎", cost: 40, cd: 12,  area: "around", r: 90, dmg: 4, glow: true, shake: true },
];

/**
 * Hồn kỹ riêng vòng 1–4 theo mã võ hồn (bước 2.5a: 5 võ hồn mẫu, mỗi hệ ít nhất một; 2.5b: 5 võ hồn lưu phái Thiêu đốt; 2.5c: 5 võ hồn lưu phái Cảm điện;
 * mọi số chờ chốt). Hồn kỹ thứ i mở khi có
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
    { name: "Phục Chế Hương Tràng", desc: "Áo nghĩa: sao chép hồn kỹ vừa tung của võ hồn khác trong đội, sức mạnh × 0,8", icon: "⧉", cost: 30, cd: 14,
      area: "self", r: 0, dmg: 0, copy: 0.8 },
  ],
};
/** Hồn kỹ của một võ hồn: bảng riêng nếu có, không thì 4 hồn kỹ dùng chung. */
export const skillsOf = (vohonId: string) => VOHON_SKILLS[vohonId] ?? SKILLS;

/**
 * Chiêu tiên cơ riêng (bước 2.5a, nâng từ tiên cơ chung theo hệ của 2.4 cho 5 võ hồn mẫu; 2.5b thêm 5 võ hồn Thiêu đốt, 2.5c thêm 5 võ hồn Cảm điện; chờ chốt). Chạy bằng cùng bộ máy
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
  xuc_xich: { name: "Thanh Tâm Hương Tràng", desc: "hồi 20% sinh lực cả đội, 25% hồn lực, khiên 12% sinh lực", icon: "✚", cost: 0, cd: 0,
    area: "self", r: 0, dmg: 0, self: { heal: 0.2, mp: 0.25, shield: 0.12, secs: 5 } },
};
/**
 * Phong Lôi Chi Lực (bước 2.5c, chờ chốt): thanh riêng của Lam Điện Bá Vương Long, 0..max, thuộc hồn sư (không lưu DB). Mỗi đòn đánh
 * thường / mỗi lần tung hồn kỹ của võ hồn này trúng ít nhất một hồn thú: +gain (một lần như năng lượng tiên cơ), × shockMult nếu hồn thú
 * trúng đầu tiên đang Cảm điện. Đầy thì tự tung Lôi Động Minh Thiên (sức mạnh theo hồn hoàn năm cao nhất của võ hồn; không tạo năng
 * lượng tiên cơ), về 0. Ngoài giao chiến quá TIEN_CO_IDLE_SECS giây thì giảm `decay` mỗi giây; Lam Điện gục thì mất hết.
 * Lôi Động Minh Thiên gây Choáng 1 giây: "ngắt chiêu boss" làm khi hồn thú có chiêu báo trước (bước 3.5).
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

export function calcStats(vh: number, level: number, rings: number[]) {
  const v = VOHON[vh];
  let hpB = 0, atkB = 0;
  for (const t of rings) { hpB += TIERS[t].hpb; atkB += TIERS[t].atkb; }
  return {
    maxHp: Math.round((80 + level * 14 + hpB) * v.hp),
    maxMp: Math.round((40 + level * 4 + rings.length * 15) * v.mp),
    atk: (6 + level * 1.6 + atkB) * v.atk,
    speed: 58 * v.spd,
  };
}

// ---------- Túi đồ, vật phẩm và Hồn Tệ (mục 5.7, bước 3.1; mọi số dưới đây chờ chốt) ----------
/** Nhóm vật phẩm (cột `items.kind`). Mới có đan và hồn hoàn; các nhóm khác thêm ITEMS khi làm tới (mảnh 3.4, hồn cốt GĐ4, hồn hạch GĐ5, tiên thảo BĐ6). */
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
export interface ItemDef { id: string; kind: ItemKind; name: string; desc: string; col: string; stack: number; cd?: "dan"; hp?: number; mp?: number; }
export const ITEMS: ItemDef[] = [
  { id: "hoi_huyet_dan", kind: "dan", name: "Hồi Huyết Đan", desc: "Hồi 30% sinh lực của võ hồn đang ra trận.", col: "#e0525a", stack: 99, cd: "dan", hp: 0.3 },
  { id: "hoi_hon_dan",   kind: "dan", name: "Hồi Hồn Đan",   desc: "Hồi 30% hồn lực.",                         col: "#4b9dff", stack: 99, cd: "dan", mp: 0.3 },
  // Hồn hoàn (bước 3.2): mỗi chiếc một ô, số năm lưu ở `items.years`; màu theo số năm (TIERS), `col` chỉ là màu mặc định.
  { id: "hon_hoan", kind: "hon_hoan", name: "Hồn hoàn", desc: "Hấp thụ vào một võ hồn đang ở bình cảnh (ngoài giao chiến).", col: "#ffe08a", stack: 1 },
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
