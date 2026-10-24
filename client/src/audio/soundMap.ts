import { BEASTS, BOSSES, TIERS, VOHON, type VoHonDef } from "../../../shared/data.ts";

// Ánh xạ sự kiện game → nhóm tiếng mẫu (G2, #393). Chỉ là bảng chọn tiếng, không phải số cân bằng; tên nhóm khớp
// tools/audio/sfx-catalog.json (tools/audio/sfx-lib.mjs: SFX_REQUIRED).

export type Weapon = "kiem" | "chuy" | "thuong" | "trao" | "quyen";
export type Element = "fire" | "ice" | "lightning" | "poison" | "light" | "dark" | "wood" | "wind";
export type SkillPhase = "start" | "fly" | "boom";
export type Material = "thit" | "giap" | "bang" | "go" | "da" | "linh_the";
export type Surface = "co" | "dat" | "da" | "tuyet" | "go" | "nuoc";
export type BeastFamily = "lang" | "hung" | "bao" | "xa" | "chim" | "trung" | "thiem" | "thuc";

export const WEAPONS: readonly Weapon[] = ["kiem", "chuy", "thuong", "trao", "quyen"];
export const ELEMENTS: readonly Element[] = ["fire", "ice", "lightning", "poison", "light", "dark", "wood", "wind"];
export const SKILL_PHASES: readonly SkillPhase[] = ["start", "fly", "boom"];
/** Nhóm âm thanh G2 đã có mẫu; không mở rộng trong C1 để không đổi catalog audio. */
export const MATERIALS: readonly Material[] = ["thit", "giap", "bang", "go"];
/** Sáu chất liệu visual C1; `da` / `linh_the` dùng fallback tiếng va chạm chung nếu chưa có mẫu riêng. */
export const COMBAT_MATERIALS: readonly Material[] = ["thit", "giap", "bang", "go", "da", "linh_the"];
export const SURFACES: readonly Surface[] = ["co", "dat", "da", "tuyet", "go", "nuoc"];
export const BEAST_FAMILIES: readonly BeastFamily[] = ["lang", "hung", "bao", "xa", "chim", "trung", "thiem", "thuc"];

/** Võ hồn dùng vũ khí / đòn nào (theo hình võ hồn); mặc định quyền. */
const WEAPON_OF: Readonly<Record<string, Weapon>> = {
  cuu_tinh_that_sat_kiem: "kiem", nguyet_nhan: "kiem", ky_nhung_thong_thien_cuc: "kiem",
  hao_thien_chuy: "chuy", thien_can_bach_ngoc_dinh: "chuy", cuu_bao_luu_ly_thap: "chuy", xuc_xich: "chuy",
  pha_hon_thuong: "thuong", liet_hoa_thuong_lang: "thuong", lam_ngan_thao: "thuong",
  bach_ho: "trao", u_minh_linh_mieu: "trao", kim_vu_mieu_ung: "trao", yeu_ho: "trao", tu_vong_chu_hoang: "trao", bich_lan_xa_hoang: "trao", hoa_long: "trao",
};
export function weaponOf(vohonId: string | undefined): Weapon { return (vohonId && WEAPON_OF[vohonId]) || "quyen"; }

const ELEMENT_OF_FLOW: Readonly<Record<string, Element>> = {
  "Thiêu đốt": "fire", "Cảm điện": "lightning", "Trúng độc": "poison", "Băng phong": "ice", "Chấn động": "wind",
  "Phá giáp": "light", "Bùng nổ": "dark", "Đánh boss": "wood",
};
const ELEMENT_OVERRIDE: Readonly<Record<string, Element>> = {
  lam_ngan_thao: "wood", quy_mi: "dark", u_minh_linh_mieu: "dark", hao_thien_chuy: "light", tu_vong_chu_hoang: "dark",
};
/** Hệ âm thanh của một võ hồn: theo lưu phái đầu tiên (Thiêu đốt → lửa, Cảm điện → sét…), vài võ hồn đặc thù đặt riêng. */
export function elementOf(def: Pick<VoHonDef, "id" | "he" | "flows"> | undefined): Element {
  if (!def) return "light";
  return ELEMENT_OVERRIDE[def.id] ?? ELEMENT_OF_FLOW[def.flows[0] ?? ""] ?? (def.he === "phu_tro" ? "light" : "wind");
}
export const elementOfVohonIndex = (index: number | undefined): Element => elementOf(index === undefined ? undefined : VOHON[index]);

/** Loại tin `fx` của hồn kỹ → giai đoạn tiếng của hệ. */
export const SKILL_PHASE_OF_FX: Readonly<Record<string, SkillPhase>> = {
  soulring: "start", ult: "start", avatar: "start", zone: "start", tienco: "start", fusion: "start", buff: "start",
  fly: "fly", bolt: "fly", zap: "fly", pull: "fly",
  burst: "boom", wave: "boom", bone: "boom",
};
/** Hồn kỹ nặng: hạ nhạc nền một lúc. */
export const LOUD_FX: ReadonlySet<string> = new Set(["ult", "avatar", "fusion", "roar"]);

/** Loại tin `fx` là đòn đánh thường / vung vũ khí. */
export const SWING_FX: ReadonlySet<string> = new Set(["slash", "trail", "arc", "claw"]);

/** Họ tiếng theo từ trong mã loài (tách bằng "_"); họ nào có từ khớp trước thì lấy. */
const BEAST_FAMILY_TOKENS: ReadonlyArray<[BeastFamily, readonly string[]]> = [
  ["lang", ["lang"]],
  ["thiem", ["thiem", "chuong"]],
  ["thuc", ["dang", "hoa", "cuc", "moc"]],
  ["xa", ["xa", "mang", "ngac", "long", "ngu", "tich", "sa"]],
  ["chim", ["ung", "tuoc", "dieu", "buc", "diep"]],
  ["trung", ["chu", "cham", "hat"]],
  ["bao", ["bao", "ho", "mieu", "tho", "thu", "hau", "vien"]],
];
/** Họ tiếng của một loài hồn thú theo mã loài (BEASTS / `species` của boss); mặc định họ nặng (gấu, tê, tượng, giáp). */
export function beastFamilyOf(speciesId: string): BeastFamily {
  const tokens = speciesId.split("_");
  for (const [family, words] of BEAST_FAMILY_TOKENS) if (tokens.some((t) => words.includes(t))) return family;
  return "hung";
}
/** Mã loài của một hồn thú trong state: bậc > 0 thì `species` chỉ số trong BOSSES (dùng loài nền của nó). */
export function beastSpeciesId(species: number, rank: number): string {
  return (rank > 0 ? BOSSES[species]?.species : BEASTS[species]?.id) ?? "";
}

/** Chất liệu khi đánh trúng hồn thú: băng (loài băng / tuyết), gỗ-cây (họ thực vật), giáp-vỏ (loài giáp), còn lại thịt. */
export function materialOfBeast(speciesId: string): Material {
  if (/thai_than_cu_vien|thien_thanh_nguu_mang|u_linh_hai_mau/.test(speciesId)) return "linh_the";
  if (/cu_vien|thach|ngoc/.test(speciesId)) return "da";
  if (/bang|tuyet|han_/.test(speciesId)) return "bang";
  if (beastFamilyOf(speciesId) === "thuc") return "go";
  if (speciesId.split("_").some((t) => ["giap", "nguu", "giai", "lan"].includes(t))) return "giap";
  return "thit";
}

/** Bề mặt chân giẫm theo tên ô nền trong tiles.json. */
export function surfaceOfGround(name: string): Surface {
  if (!name) return "dat";
  if (name.startsWith("nuoc_") || name === "suoi_nong") return "nuoc";
  if (/tuyet|bang/.test(name)) return "tuyet";
  if (/^(co|la_|reu)/.test(name) || name === "ruong") return "co";
  if (/^(da|pho_da|san_da|duong_luu_ly|duong_da)/.test(name) || name === "da_cuoi_cung") return "da";
  if (/^duong_san/.test(name)) return "go";
  return "dat";
}

/** Nhịp bước chân (ms giữa hai tiếng): chạy nhanh hơn đi bộ. */
export const STEP_INTERVAL_MS = { run: 300, walk: 480 } as const;

/** Tiếng giao diện (G5, #396) → nhóm mẫu trong gói `ui`. */
export type UiSound = "open" | "close" | "drag" | "drop" | "equip" | "enhanceOk" | "enhanceFail" | "rare";
export const UI_GROUP: Readonly<Record<UiSound, string>> = {
  open: "ui-open", close: "ui-close", drag: "ui-drag", drop: "ui-drop", equip: "ui-equip",
  enhanceOk: "ui-enhance-ok", enhanceFail: "ui-enhance-fail", rare: "ui-rare",
};
/** Nhận món có độ hiếm (bag.rarityOf, 0..4) từ mức này trở lên thì phát tiếng đồ hiếm. */
export const RARE_LOOT_MIN = 3;

/** Nhịp tim khi máu thấp (PK, G6): từ tỉ lệ sinh lực này trở xuống mới đập; càng thấp càng dồn (khoảng cách giữa hai nhịp, ms). */
export const LOW_HP_RATIO = 0.3;
export const HEARTBEAT_MS = { slow: 1150, fast: 640 } as const;
/** Tỉ lệ sinh lực → khoảng cách nhịp (ms), tuyến tính từ LOW_HP_RATIO (chậm) về 0 (nhanh). */
export function heartbeatInterval(hpRatio: number): number {
  const k = Math.min(1, Math.max(0, hpRatio / LOW_HP_RATIO));
  return HEARTBEAT_MS.fast + (HEARTBEAT_MS.slow - HEARTBEAT_MS.fast) * k;
}

/** Hồn hoàn sáng theo niên hạn: bậc càng cao càng trầm (hạ cao độ), vang (đưa vào reverb) và to hơn. */
export function ringGlowMix(tier: number): { rate: number; wet: number; gain: number } {
  const k = Math.min(1, Math.max(0, tier / Math.max(1, TIERS.length - 1)));
  return { rate: 1.12 - 0.5 * k, wet: 0.1 + 0.65 * k, gain: 0.7 + 0.5 * k };
}
