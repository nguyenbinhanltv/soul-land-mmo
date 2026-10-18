// Dữ liệu game dùng chung cho client và server.
// Sửa cân bằng game ở đây – cả hai phía sẽ dùng cùng con số.

export interface TierDef {
  /** Số năm nhỏ nhất của bậc (hồn hoàn lưu trong DB theo số năm). */
  years: number;
  age: string; col: string; glow: string;
  hp: number; dmg: number; xp: number; spd: number;
  atkb: number; hpb: number; size: number; body: string;
}

export const TIERS: TierDef[] = [
  { years: 10,     age: "10 năm",      col: "#f3f3f3", glow: "#ffffff", hp: 30,   dmg: 4,  xp: 12,   spd: 26, atkb: 2,  hpb: 12,  size: 8,  body: "#d9cbb3" },
  { years: 100,    age: "100 năm",     col: "#f2c84b", glow: "#ffe08a", hp: 95,   dmg: 9,  xp: 40,   spd: 32, atkb: 5,  hpb: 30,  size: 11, body: "#8b8f96" },
  { years: 1000,   age: "1.000 năm",   col: "#a253e0", glow: "#c99bff", hp: 300,  dmg: 19, xp: 150,  spd: 36, atkb: 12, hpb: 80,  size: 13, body: "#5d4380" },
  { years: 10000,  age: "10.000 năm",  col: "#1a1820", glow: "#8a6bff", hp: 950,  dmg: 42, xp: 500,  spd: 33, atkb: 30, hpb: 220, size: 16, body: "#2c2c35" },
  { years: 100000, age: "100.000 năm", col: "#e0303a", glow: "#ff6a5a", hp: 4200, dmg: 95, xp: 2500, spd: 40, atkb: 85, hpb: 700, size: 22, body: "#8f1f2a" },
];

export const TIER_MULT = [1, 1.35, 1.9, 2.8, 4.5];

/** Bậc (chỉ số trong TIERS) của một hồn hoàn theo số năm. */
export function tierOfYears(years: number) {
  let t = 0;
  for (let i = 0; i < TIERS.length; i++) if (years >= TIERS[i].years) t = i;
  return t;
}

// ---------- Bản đồ và hồn thú (GAME_DESIGN.md mục 5.3, 6) ----------
export type MapKind = "town" | "hunt" | "boss";
export interface MapDef {
  /** Mã cố định, cũng là tên file Tiled `shared/assets/<id>.json`. */
  id: string;
  name: string; kind: MapKind;
  level: [number, number]; // cấp đề xuất
  years: [number, number]; // niên hạn hồn thú
}

/** Bản đồ đang có. Đến BĐ2 chỉ có một bản đồ; BĐ3 tách `tinh_dau` thành Ngoại vi và Nội địa. */
export const MAPS: Record<string, MapDef> = {
  tinh_dau: { id: "tinh_dau", name: "Tinh Đấu Đại Sâm Lâm", kind: "hunt", level: [1, 100], years: [10, 100000] },
};
/** Bản đồ server tự chọn khi vào game (đến BĐ2 chưa lưu bản đồ đang đứng). */
export const DEFAULT_MAP = "tinh_dau";

export interface BeastDef {
  /** Mã cố định (sprite `beast_{id}`, thuộc tính `beasts` của vùng trong Tiled). Không đổi mã đã dùng. */
  id: string;
  name: string;
  /** Bậc tạm (chỉ số trong TIERS) để lấy chỉ số, cho đến khi hồn thú có tuổi theo số năm (bước 3.2). */
  tier: number;
}

/** Hồn thú theo loài, tên theo bảng Ngoại vi / Nội địa ở mục 5.3. Thêm loài mới vào cuối mảng (state đồng bộ theo chỉ số). */
export const BEASTS: BeastDef[] = [
  { id: "phong_lang",             name: "Phong Lang",             tier: 0 },
  { id: "man_da_la_xa",           name: "Mạn Đà La Xà",           tier: 0 },
  { id: "tu_van_bao",             name: "Tử Văn Báo",             tier: 1 },
  { id: "quy_dang",               name: "Quỷ Đằng",               tier: 1 },
  { id: "loi_van_hau",            name: "Lôi Văn Hầu",            tier: 1 },
  { id: "quy_ho",                 name: "Quỷ Hổ",                 tier: 2 },
  { id: "nhan_dien_ma_chu",       name: "Nhân Diện Ma Chu",       tier: 2 },
  { id: "u_minh_lang",            name: "U Minh Lang",            tier: 2 },
  { id: "am_kim_khung_trao_hung", name: "Ám Kim Khủng Trảo Hùng", tier: 3 },
  { id: "kiem_vi_hat",            name: "Kiếm Vĩ Hạt",            tier: 3 },
  { id: "quy_anh_bao",            name: "Quỷ Ảnh Báo",            tier: 3 },
  // Nội địa chưa có hồn thú thường 10 vạn năm; tạm dùng loài mãng xà lớn nhất cho bậc đỏ đến bước 3.2.
  { id: "xich_lan_mang",          name: "Xích Lân Mãng",          tier: 4 },
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

export const SKILLS = [
  { name: "Hồn Bạo",    cost: 12, cd: 3,   desc: "Nổ hồn lực quanh thân" },
  { name: "Thiểm Kích", cost: 16, cd: 4.5, desc: "Lao về phía trước" },
  { name: "Hồn Tiễn",   cost: 22, cd: 5,   desc: "Bắn 10 mũi hồn lực" },
  { name: "Hồn Vực",    cost: 40, cd: 12,  desc: "Lãnh vực hủy diệt" },
];

/** Niên hạn tối đa (chỉ số tier) mà vòng thứ `slot` chịu được. */
export const ringLimit = (slot: number) => (slot === 1 ? 1 : slot <= 3 ? 2 : slot <= 6 ? 3 : 4);
export const xpNeed = (level: number) => Math.floor(10 + level * level * 1.2);
export const atBottleneck = (level: number, rings: number) => level >= 10 * (rings + 1);
/** Số hồn hoàn tối đa của một võ hồn (mục 3): vòng thứ k hấp thụ ở bình cảnh cấp 10×k. */
export const MAX_RINGS = 10;

// ---------- Giảm kinh nghiệm khi săn hồn thú quá yếu (mục 5.3) ----------
/**
 * Cấp tương đương của hồn thú: cấp nhỏ nhất mà võ hồn hấp thụ được hồn hoàn của nó trong giới hạn (ringLimit).
 * Đến BĐ3 hồn thú chỉ có bậc nên tính theo bậc (10 / 10 / 20 / 40 / 70); BĐ3 đổi sang bảng giới hạn theo số năm.
 */
export function beastLevel(tier: number) {
  for (let slot = 1; slot <= MAX_RINGS; slot++) if (ringLimit(slot) >= tier) return slot * 10;
  return MAX_RINGS * 10;
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

export const TILE = 16;
export const TICK_RATE = 20; // số lần server cập nhật mỗi giây
