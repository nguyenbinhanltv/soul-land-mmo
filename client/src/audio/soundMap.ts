import { BEASTS, BOSSES, TIERS, VOHON, type VoHonDef } from "../../../shared/data.ts";

// Ánh xạ sự kiện game → nhóm tiếng mẫu (G2, #393). Chỉ là bảng chọn tiếng, không phải số cân bằng; tên nhóm khớp
// tools/audio/sfx-catalog.json (tools/audio/sfx-lib.mjs: SFX_REQUIRED).

export type Weapon = "kiem" | "chuy" | "thuong" | "trao" | "quyen" | "cung" | "day" | "quat";
export type Element = "fire" | "ice" | "lightning" | "poison" | "light" | "dark" | "wood" | "wind";
export type SkillPhase = "start" | "fly" | "boom";
export type Material = "thit" | "giap" | "bang" | "go" | "da" | "linh_the";
export type Surface = "co" | "dat" | "da" | "tuyet" | "go" | "nuoc";
export type BeastFamily = "lang" | "hung" | "bao" | "xa" | "chim" | "trung" | "thiem" | "thuc" | "bien";

export const WEAPONS: readonly Weapon[] = ["kiem", "chuy", "thuong", "trao", "quyen", "cung", "day", "quat"];
export const ELEMENTS: readonly Element[] = ["fire", "ice", "lightning", "poison", "light", "dark", "wood", "wind"];
export const SKILL_PHASES: readonly SkillPhase[] = ["start", "fly", "boom"];
/** Sáu nhóm chất liệu đều có mẫu; tiếng tổng hợp chỉ dự phòng chưa tải / lỗi tải. */
export const MATERIALS: readonly Material[] = ["thit", "giap", "bang", "go", "da", "linh_the"];
/** Chất liệu visual C1 khớp nhóm tiếng va chạm. */
export const COMBAT_MATERIALS: readonly Material[] = ["thit", "giap", "bang", "go", "da", "linh_the"];
export const SURFACES: readonly Surface[] = ["co", "dat", "da", "tuyet", "go", "nuoc"];
export const BEAST_FAMILIES: readonly BeastFamily[] = ["lang", "hung", "bao", "xa", "chim", "trung", "thiem", "thuc", "bien"];

/** Đủ 25 dạng cầm tay đã nhập (#1495); trượng cúc theo hồ sơ #1385, không theo mô tả quạt nhầm trong issue. */
const WEAPON_OF: Readonly<Record<string, Weapon>> = {
  cuu_tinh_that_sat_kiem: "kiem", nguyet_nhan: "kiem", ta_hoa_phuong_hoang: "kiem",
  hao_thien_chuy: "chuy", thien_can_bach_ngoc_dinh: "chuy", cuu_bao_luu_ly_thap: "chuy", xuc_xich: "chuy",
  pha_hon_thuong: "thuong", ky_nhung_thong_thien_cuc: "thuong", quy_mi: "thuong",
  bach_ho: "trao", u_minh_linh_mieu: "trao", kim_vu_mieu_ung: "trao", lam_dien_ba_vuong_long: "trao", liet_hoa_thuong_lang: "trao",
  nhu_cot_tho: "quyen", hoa_anh: "quyen",
  lam_ngan_thao: "day", a_ngan: "day", hoa_long: "day", tu_vong_chu_hoang: "day", bich_lan_xa_hoang: "day", can_khon_hon_nguyen_toa: "day",
  bang_phuong_hoang: "cung", yeu_ho: "quat",
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
/**
 * Nhóm tiếng T3 riêng của một võ hồn (C4 #579, `tools/audio/sfx-catalog.json`): `ult` = tuyệt kỹ vòng 10, `ct` = hồn kỹ Chân Thân (cả hai có 3 pha
 * start / fly / boom), `avatar` = tiếng biến hình (không pha). Tên nhóm dùng gạch ngang thay gạch dưới của mã võ hồn.
 */
export function t3Group(kind: "ult" | "ct" | "avatar", vohonId: string, phase?: SkillPhase): string {
  const id = vohonId.replaceAll("_", "-");
  return kind === "avatar" ? `skill-t3-avatar-${id}` : `skill-t3-${kind}-${id}-${phase ?? "start"}`;
}
/** Sau khi một người tung chiêu T3, các tin `fx` bay / nổ của chính chiêu đó trong chừng này ms cũng dùng tiếng T3 của võ hồn. */
export const T3_WINDOW_MS = 1600;
/** Người khác (không phải mình) chỉ được phát tiếng T3 cách nhau tối thiểu chừng này ms (đông người cùng tung không chồng thành một mảng ồn). */
export const T3_OTHERS_GAP_MS = 700;
/** Hệ số âm lượng tiếng T3 của người khác. */
export const T3_OTHERS_GAIN = 0.7;

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
/** Loài dưới nước ở Hải Thần Đảo; khai rõ để không lẫn mã chứa chương / ngư / sa với cóc / rắn. Hải Ưng vẫn là chim. */
const AQUATIC_SPECIES: ReadonlySet<string> = new Set([
  "thiet_giap_cu_giai", "lam_lan_hai_xa", "kiem_ngu", "quy_dien_hai_yeu", "tham_hai_ma_chuong",
  "loi_quang_hai_dieu", "kim_lan_long_quy", "huyet_nha_cu_sa", "tham_hai_ma_kinh", "u_linh_hai_mau",
]);
/** Họ tiếng theo loài nền (BEASTS / `species` của tinh anh, thú vương); gầm boss vẫn dùng nhóm riêng. */
export function beastFamilyOf(speciesId: string): BeastFamily {
  if (AQUATIC_SPECIES.has(speciesId)) return "bien";
  const tokens = speciesId.split("_");
  for (const [family, words] of BEAST_FAMILY_TOKENS) if (tokens.some((t) => words.includes(t))) return family;
  return "hung";
}
/** Mã loài của một hồn thú trong state: bậc > 0 thì `species` chỉ số trong BOSSES (dùng loài nền của nó). */
export function beastSpeciesId(species: number, rank: number): string {
  return (rank > 0 ? BOSSES[species]?.species : BEASTS[species]?.id) ?? "";
}

/** Chất liệu khi đánh trúng hồn thú: linh thể đặc biệt, đá (cự viên / thạch / ngọc), băng, gỗ-cây, giáp-vỏ, còn lại thịt. */
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
export type UiSound = "open" | "close" | "drag" | "drop" | "equip" | "enhanceOk" | "enhanceFail" | "rare" | "click" | "error" | "reward" | "notify";
export const UI_GROUP: Readonly<Record<UiSound, string>> = {
  open: "ui-open", close: "ui-close", drag: "ui-drag", drop: "ui-drop", equip: "ui-equip",
  enhanceOk: "ui-enhance-ok", enhanceFail: "ui-enhance-fail", rare: "ui-rare",
  click: "ui-click", error: "ui-error", reward: "ui-reward", notify: "ui-notify",   // đợt 1c UI v2 (#599): bấm nút, lỗi / từ chối, nhận thưởng, toast
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

// ---- Cân âm lượng, giới hạn chồng tiếng, nén / hạ nhạc khi đông tiếng (G8, #399). Chỉ trộn tiếng, không phải số cân bằng gameplay. ----

/** Chỉnh độ to (dB) từng nhóm tiếng mẫu về cùng mức mục tiêu của loại (vung / va chạm / hồn kỹ / T3 / thú / bước chân…). Bảng SINH bằng `node tools/audio/measure-sfx.mjs`
 * (đo RMS thật của clip, đã chừa đỉnh); chạy lại và dán khi thêm / thay clip. Khóa: nhóm, riêng hồn kỹ theo hệ gộp ba pha (`skill-fire`), T3 theo kiểu + pha. Thiếu khóa = 0 dB. */
export const GROUP_TRIM_DB: Readonly<Record<string, number>> = {
  "hit-da": 0.5, "hit-linh_the": 2,
  "swing-cung": 5.5, "swing-day": 0.5, "swing-quat": 0.5,
  "beast-bien": 5.5,
  "swing-kiem": 3.5, "swing-chuy": -4, "swing-thuong": -4.5, "swing-trao": 0.5, "swing-quyen": -4.5, "hit-thit": -4, "hit-giap": 4, "hit-bang": 3, "hit-go": 3,
  "skill-fire": -1, "skill-ice": 1, "skill-lightning": -0.5, "skill-poison": 1.5, "skill-light": 2, "skill-dark": -1, "skill-wood": -2.5, "skill-wind": -6,
  "beast-lang": -3, "beast-hung": -2.5, "beast-bao": -4.5, "beast-xa": 3.5, "beast-chim": 3.5, "beast-trung": 3, "beast-thiem": 5.5, "beast-thuc": -1, "beast-boss": -3, "beast-die": -3.5,
  "ring-glow": -1, "ring-drop": 4.5, "step-co": 1.5, "step-dat": -0.5, "step-da": 1.5, "step-tuyet": -4, "step-go": -0.5, "step-nuoc": 1.5,
  "amb-wind": -3.5, "amb-wind-lanh": -4.5, "amb-wave": -4, "amb-bird": -2, "amb-cricket": -4.5, "amb-fire": -1.5, "amb-bell": -1.5,
  "ui-open": -2, "ui-close": -3, "ui-drag": 3, "ui-drop": -2, "ui-enhance-ok": -3, "ui-enhance-fail": -5, "ui-rare": -0.5, "ui-click": -2, "ui-error": -6, "ui-reward": -7, "ui-notify": -5,
  "pk-open": -1, "pk-count": -1.5, "pk-go": 1, "pk-kill": 1, "pk-heartbeat": -3,
  "skill-t3-ult-start": 5.5, "skill-t3-ult-fly": 4, "skill-t3-ult-boom": 2, "skill-t3-ct-start": 2.5, "skill-t3-ct-fly": 3, "skill-t3-ct-boom": -1, "skill-t3-avatar": 5,
};

/** Khóa trong GROUP_TRIM_DB của một nhóm tiếng: hồn kỹ theo hệ bỏ pha; T3 bỏ mã võ hồn (còn kiểu + pha). */
export function groupTrimKey(group: string): string {
  const t3 = /^skill-t3-(ult|ct)-.*-(start|fly|boom)$/.exec(group);
  if (t3) return `skill-t3-${t3[1]}-${t3[2]}`;
  if (group.startsWith("skill-t3-avatar")) return "skill-t3-avatar";
  return group.replace(/^(skill-[a-z]+)-(start|fly|boom)$/, "$1");
}
/** Hệ số khuếch đại (tuyến tính) của nhóm tiếng theo GROUP_TRIM_DB. */
export function groupTrim(group: string): number { return 10 ** ((GROUP_TRIM_DB[groupTrimKey(group)] ?? 0) / 20); }

/** Loại tiếng để giới hạn chồng: mỗi loại có trần số tiếng đồng thời riêng, nên một loại (40 người cùng đánh) không nuốt hết 16 chỗ của tiếng khác. */
export type VoiceClass = "melee" | "skill" | "t3" | "beast" | "ring" | "step" | "amb" | "ui" | "pk" | "synth";
export const VOICE_CAP: Readonly<Record<VoiceClass, number>> = { melee: 5, skill: 5, t3: 3, beast: 4, ring: 2, step: 4, amb: 3, ui: 4, pk: 3, synth: 6 };
export function voiceClassOf(group: string): VoiceClass {
  if (/^(swing|hit)-/.test(group)) return "melee";
  if (group.startsWith("skill-t3-")) return "t3";
  if (group.startsWith("skill-")) return "skill";
  if (group.startsWith("beast-")) return "beast";
  if (group.startsWith("ring-")) return "ring";
  if (group.startsWith("step-")) return "step";
  if (group.startsWith("amb-")) return "amb";
  if (group.startsWith("ui-")) return "ui";
  if (group.startsWith("pk-")) return "pk";
  return "synth";
}

/** Đông tiếng (từ `voices` tiếng đang phát trở lên): hạ nhạc nền còn `music` và môi trường còn `ambient` trong `ms` để tiếng chiến đấu không bị nhạc / nền chồng lên. */
export const CROWD_DUCK = { voices: 9, music: 0.8, ambient: 0.55, ms: 500 } as const;
/** Bộ nén chung của ba kênh tiếng (chặn đỉnh khi nhiều tiếng cộng dồn): ngưỡng dB, đầu gối dB, tỉ lệ, vào / ra (giây). */
export const MASTER_COMPRESSOR = { threshold: -16, knee: 10, ratio: 4, attack: 0.004, release: 0.2 } as const;
