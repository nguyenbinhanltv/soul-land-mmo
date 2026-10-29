// Nền tảng asset theo mục 5.11 của GAME_DESIGN.md:
// - tải ảnh thật theo shared/assets/sprites/manifest.json (chỉ key có trong danh sách, tránh 404);
// - tạo animation từ chỉ số khung cố định, key `{sheet}:{animation}_{hướng}`;
// - ánh xạ khung lớp thân sang lớp áo, tóc, phụ thể;
// - hoán màu dải 4 xám chuẩn, key `{gốc}@{chỉ số màu}`;
// - hồn sư chỉ còn LPC (HL3 #572): thân là sheet isometric 64×64, 24 × 6 (5 hướng vẽ, 3 lật) do lpcRig.ts ghép lúc chạy (`lpcc_…`) hoặc
//   sheet NPC `lpc_<mã>`; không còn sprite hồn sư preset 32×32 / 64×64 (m_0 / f_0);
// - hồn thú `beast_{loài}` có `"iso": true` là sheet isometric khung vuông theo bậc, 20 × 5, 8 hướng (vẽ 5, lật 3);
//   thêm `"static": true` là hồn thú lai (#386): 3 ảnh tĩnh nam / đông / bắc, chuyển động vẽ bằng code (staticBeastPose);
//   `beast_{loài}_anim` (H3 #688) là hoạt ảnh vẽ thật 6 cột × 20 hàng (beastAnim.ts), ưu tiên hơn ảnh tĩnh của cùng loài.
// Key nào chưa có ảnh thì makeTextures() trong textures.ts vẽ bằng code như cũ.
import Phaser from "phaser";
import { TELE_WARN, PT_FRAME } from "../../shared/data.ts";
import { SPR, type Dir8 } from "./iso.ts";
import { lightingOn } from "./lighting.ts";
import { loadPhuAnchors } from "./phutheAnchor.ts";
import { phuClipOf, phuClipIndex, phuDirOk, phuDirRow, phuFrame, phuHalf, phuOriginY, phuSheetFits, parsePhuLayout, type PhuLayout } from "./phutheAnim.ts";
import { registerVohonSheet, registerBlankSheet, setBeastSheetHook, isLazySkillFx, markPartialAnim, vohonKeys, vohonBlank } from "./vohonLazy.ts";
import { readFxPrefs } from "./fxSettings.ts";
import { DEFAULT_LAYOUT, beastDirPlan, lungeKeep, newBeastAnimState, parseLayout, stepBeastAnim, type AnimLayout, type BeastAnimState } from "./beastAnim.ts";

const MANIFEST_KEY = "sprites-manifest";
const BASE = "sprites/";

/** Bố cục spritesheet phụ thể cũ 48×48 (vẽ bằng code, honsuArt.ts): 16 cột × 4 hàng. */
export const SHEET_COLS = 16;
/** Khung phụ thể 48×48 (khung thân mở rộng 8 pixel mỗi phía), gốc tại (24,38). */
export const VH_FRAME = 48;
export const VH_ORIGIN = { x: 0.5, y: 38 / 48 };

/** Hướng được vẽ, theo thứ tự hàng 0, 1, 2. Hướng trái dùng `right` và lật ngang. */
export const DIRS = ["down", "right", "up"] as const;
export type Dir = (typeof DIRS)[number] | "left";

interface AnimDef { col: number; ms: readonly number[]; loop: boolean; row?: number }

/** Hồn sư isometric (mục 5.11, từ 10.4): khung 64×64 gốc (32,58); phụ thể 96×96 gốc (48,74). Sheet hồn sư 24 cột × 6 hàng;
 *  phụ thể cùng bố cục cột, hai nửa theo giới (24 × 12, vohonHalf). */
export const ISO_HS_FRAME = 64, ISO_VH_FRAME = 96, ISO_SHEET_COLS = 24;
export const ISO_HS_ORIGIN = { x: 0.5, y: 58 / 64 };
export const ISO_VH_ORIGIN = { x: 0.5, y: 74 / 96 };
/** 5 hướng vẽ theo thứ tự hàng 0–4; sw, w, nw dùng se, e, ne lật ngang. */
export const ISO_DIRS = ["s", "se", "e", "ne", "n"] as const;
export type IsoDir = (typeof ISO_DIRS)[number];
const ISO_FLIP: Partial<Record<Dir8, IsoDir>> = { sw: "se", w: "e", nw: "ne" };

/** Bảng animation hồn sư isometric (mục 5.11): cột bắt đầu và thời gian từng khung (ms); `die` dừng ở khung cuối (nằm). */
export const ISO_HS_ANIMS = {
  idle:   { col: 0,  ms: [200, 200, 200, 200], loop: true },
  walk:   { col: 4,  ms: [100, 100, 100, 100, 100, 100], loop: true },
  attack: { col: 10, ms: [70, 70, 90, 120], loop: false },
  cast:   { col: 14, ms: [100, 200, 140], loop: false },
  hurt:   { col: 17, ms: [80, 120], loop: false },
  die:    { col: 19, ms: [120, 120, 120, 120], loop: false },
  absorb: { col: 0,  ms: [500, 500], loop: true, row: 5 }, // chỉ hướng s
} satisfies Record<string, AnimDef>;

/** Bảng animation của phụ thể 48×48 cũ vẽ bằng code (mục 5.11): cột bắt đầu và thời gian từng khung (ms). */
export const HS_ANIMS = {
  idle:   { col: 0,  ms: [400, 400], loop: true },
  walk:   { col: 2,  ms: [120, 120, 120, 120], loop: true },
  attack: { col: 6,  ms: [80, 80, 140], loop: false },
  cast:   { col: 9,  ms: [100, 200, 140], loop: false },
  hurt:   { col: 12, ms: [150], loop: false },
  die:    { col: 13, ms: [120, 120, 120], loop: false }, // dừng ở khung cuối (nằm)
  absorb: { col: 0,  ms: [500, 500], loop: true, row: 3 }, // chỉ hướng xuống
} satisfies Record<string, AnimDef>;
export type HsAnim = keyof typeof HS_ANIMS;

/** Sheet hồn sư / phụ thể theo bố cục isometric 24 cột (khung 64 hoặc 96) hay không (phụ thể 48×48 cũ vẽ bằng code thì không). */
export function isIsoSheet(scene: Phaser.Scene, key: string) {
  if (!scene.textures.exists(key)) return false;
  const w = scene.textures.get(key).source[0].width;
  return w === ISO_SHEET_COLS * ISO_HS_FRAME || w === ISO_SHEET_COLS * ISO_VH_FRAME;
}

/** Tổng thời gian một animation hồn sư (ms). */
export const honsuAnimMs = (a: HsAnim) => ISO_HS_ANIMS[a].ms.reduce((x, y) => x + y, 0);

/**
 * Gốc và hệ số phóng của một lớp hồn sư / phụ thể theo texture đang đặt: hình chứa (container) của hồn sư phóng SPR cho phụ thể
 * 48×48 cũ vẽ bằng code, nên lớp isometric 64×64 / 96×96 phóng 1 / SPR để 1 pixel ảnh là 1 pixel màn hình nội bộ.
 */
export function fitHonsuLayer<T extends Phaser.GameObjects.Sprite>(s: T, vohon = false): T {
  const iso = isIsoSheet(s.scene, s.texture.key), o = vohon ? (iso ? ISO_VH_ORIGIN : VH_ORIGIN) : ISO_HS_ORIGIN;
  if (s.originY !== o.y) s.setOrigin(o.x, o.y);
  const k = iso || !vohon ? 1 / SPR : 1;
  if (s.scaleX !== k) s.setScale(k);
  return s;
}

/** Khung hồn thú theo bậc niên hạn (TIERS): rộng × cao. */
export const BEAST_FRAMES: readonly [number, number][] = [[16, 16], [32, 32], [48, 32], [48, 48], [64, 64]];

/** Hồn thú: một hàng 13 khung, chỉ vẽ hướng phải. */
export const BEAST_ANIMS = {
  idle:   { col: 0,  ms: [400, 400], loop: true },
  walk:   { col: 2,  ms: [120, 120, 120, 120], loop: true },
  // Khung đầu là tư thế báo trước, giữ cho khớp vùng cảnh báo TELE_WARN (mục 5.3, bước 3.5); hồn thú còn giữ khung này tới khi
  // server tung chiêu (BeastState.cast về false) rồi mới chạy 2 khung ra đòn.
  attack: { col: 6,  ms: [TELE_WARN * 1000, 80, 140], loop: false },
  hurt:   { col: 9,  ms: [150], loop: false },
  die:    { col: 10, ms: [120, 120, 120], loop: false },
} satisfies Record<string, AnimDef>;

/** Gốc hồn thú cách mép dưới khung 4 pixel (cùng gốc với sprite vẽ bằng code; normalize --anchor 16,28 cho khung 32). */
export const BEAST_FOOT = 4;

/** Hồn thú isometric (mục 5.11): khung vuông theo bậc, sheet 20 cột × 5 hàng (ISO_DIRS), gốc giữa đáy cách mép dưới ISO_BEAST_FOOT. */
export const ISO_BEAST_COLS = 20, ISO_BEAST_FOOT = 8;
export const ISO_BEAST_ANIMS = {
  idle:   { col: 0,  ms: [220, 220, 220, 220], loop: true },
  walk:   { col: 4,  ms: [100, 100, 100, 100, 100, 100], loop: true },
  // Khung đầu là tư thế báo trước như BEAST_ANIMS: giữ khi `BeastState.cast` bật rồi chạy 3 khung ra đòn.
  attack: { col: 10, ms: [TELE_WARN * 1000, 70, 90, 120], loop: false },
  hurt:   { col: 14, ms: [80, 120], loop: false },
  die:    { col: 16, ms: [120, 120, 120, 120], loop: false },
} satisfies Record<string, AnimDef>;

/** Sheet hồn thú theo bố cục isometric (20 × 5 khung vuông, rộng gấp 4 cao) hay sheet một hàng cũ. */
export function isIsoBeast(scene: Phaser.Scene, key: string) {
  if (!scene.textures.exists(key)) return false;
  const src = scene.textures.get(key).source[0];
  return src.width * ISO_DIRS.length === ISO_BEAST_COLS * src.height;
}

/** Hồn thú lai (#386): sheet tĩnh 3 khung vuông cạnh nhau (nam, đông, bắc), rộng gấp 3 cao; chuyển động do staticBeastPose vẽ bằng code. */
export function isStaticBeast(scene: Phaser.Scene, key: string) {
  if (!scene.textures.exists(key)) return false;
  const src = scene.textures.get(key).source[0];
  return src.width === STATIC_DIRS.length * src.height;
}
/** Bố cục của từng sheet hoạt ảnh vẽ thật `beast_{loài}_anim` (manifest `anim`), ghi lúc tải manifest. */
const ANIM_LAYOUTS = new Map<string, AnimLayout>();
/** Bố cục của sheet hoạt ảnh vẽ thật (mặc định theo đặc tả khi manifest không ghi). */
export const animLayoutOf = (key: string): AnimLayout => ANIM_LAYOUTS.get(key) ?? DEFAULT_LAYOUT;
/** Key sheet hoạt ảnh của từng loài đã tra (undefined = loài không có): tra mỗi hồn thú mỗi khung hình nên nhớ lại, xóa khi tạo lại animation. */
const ANIM_KEY_OF = new Map<string, string | undefined>();
/** Key `beast_{loài}_anim` nếu loài có sheet hoạt ảnh vẽ thật trong texture, không thì undefined. */
function animKeyOf(scene: Phaser.Scene, species: string): string | undefined {
  if (ANIM_KEY_OF.has(species)) return ANIM_KEY_OF.get(species);
  const k = `beast_${species}_anim`, v = isAnimBeast(scene, k) ? k : undefined;
  ANIM_KEY_OF.set(species, v);
  return v;
}
/** Sheet hoạt ảnh vẽ thật (H3): key `beast_{loài}_anim`, rộng 6 khung, cao 20 khung (5 hướng × 4 dải). */
export function isAnimBeast(scene: Phaser.Scene, key: string) {
  if (!/^beast_[a-z_]+_anim$/.test(key) || !scene.textures.exists(key)) return false;
  const src = scene.textures.get(key).source[0], L = ANIM_LAYOUTS.get(key) ?? DEFAULT_LAYOUT;
  return src.width * L.dirs.length * L.rowsPerDir === L.cols * src.height;
}
/** Bố cục của từng sheet phụ thể hoạt ảnh vẽ thật `vhanim_{id}_{b|f}` (manifest `anim` + `frame`), ghi lúc tải manifest; hỏng thì không có (nhánh cũ). */
const PHU_LAYOUTS = new Map<string, PhuLayout>();
/** Ghi bố cục của một sheet `vhanim_*` ngoài manifest (trang thử `?thu=phuthe` dựng sheet giả lúc chạy). */
export const setPhuLayout = (key: string, L: PhuLayout) => { PHU_LAYOUTS.set(key, L); };
/** Bố cục sheet phụ thể hoạt ảnh của key `vhanim_*`, nếu manifest ghi hợp lệ. */
export const phuLayoutOf = (key: string): PhuLayout | undefined => PHU_LAYOUTS.get(key);
/** Khung của sheet tĩnh theo thứ tự cột. */
export const STATIC_DIRS = ["s", "e", "n"] as const;
/** Hướng 8 trên màn hình → khung ảnh tĩnh và cờ lật ngang: se / sw nhìn nghiêng nên dùng ảnh đông, ne / nw dùng ảnh bắc. */
export const STATIC_DIR_MAP: Record<Dir8, readonly [number, boolean]> = {
  s: [0, false], se: [1, false], e: [1, false], ne: [2, false], n: [2, false], nw: [2, true], w: [1, true], sw: [1, true],
};
/** Hướng nhìn trên màn hình (đơn vị tương đối, y xuống) của 8 hướng, để lao tới và ngả người. */
const DIR_VEC: Record<Dir8, readonly [number, number]> = {
  s: [0, 1], se: [1, 0.5], e: [1, 0], ne: [1, -0.5], n: [0, -1], nw: [-1, -0.5], w: [-1, 0], sw: [-1, 0.5],
};
/** Họ hoạt ảnh của hồn thú lai (#395): quyết định kiểu đi, đứng, báo trước và ra đòn vẽ bằng code. Loài không ghi ở đây là thú bốn chân. */
export type BeastFamily = "quad" | "bird" | "snake" | "insect" | "plant";
const FAMILY_SPECIES: Record<Exclude<BeastFamily, "quad">, readonly string[]> = {
  bird: ["hoi_vu_tuoc", "kim_linh_ung", "loi_duc_ung", "bang_vu_ung", "han_nguyet_ung", "loi_van_hai_ung", "hac_vu_bien_buc", "loi_quang_hai_dieu"],
  snake: ["man_da_la_xa", "thanh_lan_xa", "xich_lan_mang", "bich_lan_xa", "hac_thuy_mang", "lam_lan_hai_xa", "thien_thanh_nguu_mang", "kiem_ngu", "tham_hai_ma_kinh", "huyet_nha_cu_sa", "quy_dien_hai_yeu", "thanh_lan_doc_co"],
  insect: ["doc_cham_phong", "nhan_dien_ma_chu", "nhan_dien_ma_chu_non", "kiem_vi_hat", "bang_tinh_hat", "bang_bich_hat", "huyen_minh_bang_tam", "hoa_linh_diep"],
  plant: ["quy_dang", "quy_dang_non", "thuc_nhan_hoa", "cuc_yeu_hoa_linh", "doc_cuc_dang", "co_moc_thu_nhan", "y_la_hoa_yeu", "tham_hai_ma_chuong", "u_linh_hai_mau"],
};
const FAMILY_OF = new Map<string, BeastFamily>();
for (const [f, ids] of Object.entries(FAMILY_SPECIES)) for (const id of ids) FAMILY_OF.set(id, f as BeastFamily);
export const beastFamily = (species: string | undefined): BeastFamily => FAMILY_OF.get(species ?? "") ?? "quad";

/** Thời gian (giây) và biên độ chuyển động vẽ bằng code của hồn thú lai (pixel màn hình nội bộ, gốc ở chân). */
export const STATIC_MOTION = {
  hurt: { sec: 0.25, shake: 2, flash: 16 },
  die: { sec: 0.7, turn: 1.35, sink: 4, sy: 0.3 },
  /** Báo trước (giữ tới khi server tung chiêu): `ease` giây vào tư thế; co giãn, ngả ra sau, lùi `back`, nhấc `up` pixel. */
  windup: {
    quad: { ease: 0.25, sy: 0.06, sx: 0.03, lean: 0.14, back: 1.5, up: 0 },
    bird: { ease: 0.25, sy: -0.06, sx: 0.02, lean: 0.2, back: 1, up: 5 },
    snake: { ease: 0.2, sy: 0.1, sx: -0.1, lean: 0.12, back: 3, up: 0 },
    insect: { ease: 0.2, sy: 0.02, sx: 0.02, lean: 0.1, back: 3, up: 1.5 },
    plant: { ease: 0.3, sy: -0.08, sx: -0.03, lean: 0.3, back: 0, up: 0 },
  },
  /** Ra đòn khi `cast` tắt: lao `sec` giây tới `dist` pixel (nhảy vòng `arc`, nghiêng `lean`, giãn ngang `sx`) rồi về trong `ret` giây;
   *  thực vật (`dist` 0) quất qua lại. Chim bổ nhào (arc lớn), rắn mổ (nhanh, giãn dài), côn trùng lao (nhanh, xa). */
  strike: {
    quad: { sec: 0.22, dist: 7, arc: 2, lean: 0.17, sx: 0.08, ret: 0.38 },
    bird: { sec: 0.3, dist: 9, arc: 7, lean: 0.35, sx: -0.05, ret: 0.45 },
    snake: { sec: 0.12, dist: 9, arc: 0, lean: 0.05, sx: 0.25, ret: 0.45 },
    insect: { sec: 0.14, dist: 12, arc: 1, lean: 0.1, sx: 0.05, ret: 0.3 },
    plant: { sec: 0.35, dist: 0, arc: 0, lean: 0.55, sx: 0, ret: 0.3 },
  },
  /** Đi: chu kỳ giây; nhấc `lift`, co giãn `sy` / `sx`, nghiêng `tilt`; `hover` giữ lơ lửng quanh mặt đất (côn trùng). */
  walk: {
    quad: { period: 0.42, lift: 2, sy: 0.04, sx: 0.02, tilt: 0.052, hover: 0 },
    bird: { period: 0.3, lift: 3, sy: 0.05, sx: 0.02, tilt: 0.04, hover: 0 },
    snake: { period: 0.5, lift: 0, sy: 0, sx: 0.07, tilt: 0.09, hover: 0 },
    insect: { period: 0.25, lift: 1.2, sy: 0.02, sx: 0.04, tilt: 0.05, hover: 2.5 },
    plant: { period: 0.8, lift: 0, sy: 0.03, sx: 0, tilt: 0.07, hover: 0 },
  },
  /** Đứng: thở / chao nhẹ chu kỳ giây (`tilt` cho rắn, cây); chim mổ đất mỗi `peck` giây; côn trùng lơ lửng. */
  idle: {
    quad: { period: 1.6, sy: 0.02, sx: 0.01, tilt: 0, peck: 0, hover: 0 },
    bird: { period: 1.4, sy: 0.015, sx: 0.01, tilt: 0, peck: 2.4, hover: 0 },
    snake: { period: 2, sy: 0.01, sx: 0.01, tilt: 0.035, peck: 0, hover: 0 },
    insect: { period: 0.35, sy: 0.01, sx: 0.01, tilt: 0, peck: 0, hover: 2.5 },
    plant: { period: 2.4, sy: 0.02, sx: 0, tilt: 0.045, peck: 0, hover: 0 },
  },
} as const;
export interface StaticPose { dx: number; dy: number; sx: number; sy: number; rot: number; flash: boolean }
interface StaticMotionState { cast: boolean; castAt: number; hp: number; atk: number; hit: number }

/** Mức chuyển động của hồn thú lai theo tùy chọn hiệu ứng chung (khóa `soul-land-fx-v1`, G1 #392): Giảm chuyển động gần như tắt, Thấp / Vừa / Cao. */
let motionAt = -1e9, motionVal = 1;
function motionScale(nowMs: number): number {
  if (nowMs - motionAt < 1000) return motionVal;
  motionAt = nowMs; motionVal = 1;
  const r = readFxPrefs();
  motionVal = r.reduce ? 0.2 : r.level === "low" ? 0.6 : r.level === "high" ? 1.25 : 1;
  return motionVal;
}
/** Mức chuyển động hiện tại (1 = Vừa); dưới 0,5 (Giảm chuyển động) thì GameScene bỏ vòng sóng xung kích. */
export const beastMotionLevel = (nowMs: number) => motionScale(nowMs);
/** Số giây từ lúc hồn thú tung đòn (cast tắt) tới `nowMs`, -1 nếu chưa tung hoặc không phải sprite tĩnh: để vẽ vòng sóng xung kích của tinh anh / thú vương / boss. */
export function beastStrikeAge(s: Phaser.GameObjects.Sprite, nowMs: number): number {
  const st: StaticMotionState | undefined = s.getData("sm");
  return st && st.atk > 0 ? (nowMs - st.atk) / 1000 : -1;
}

/**
 * Chuyển động của sprite tĩnh theo họ (beastFamily): thở / nhún / lơ lửng / trườn khi đi và đứng, báo trước (giữ tư thế tới khi server tung
 * chiêu), ra đòn (vồ, bổ nhào, mổ, lao, quất), lắc và nháy trắng khi mất máu: chỉ client, theo `moving`, `cast` và máu giảm. `power` > 1
 * (tinh anh, thú vương, boss) báo trước mạnh và rung nhịp hơn, ra đòn xa hơn. Dịch (dx, dy) tính theo pixel màn hình nội bộ, xoay / co giãn
 * quanh chân (gốc giữa đáy) nên sprite không trượt khỏi chỗ đứng.
 */
export function staticBeastPose(s: Phaser.GameObjects.Sprite, nowMs: number, moving: boolean, cast: boolean, hp: number, face: Dir8,
  family: BeastFamily = "quad", power = 1): StaticPose {
  const st: StaticMotionState = s.getData("sm") ?? { cast, castAt: nowMs, hp, atk: -1e9, hit: -1e9 };
  if (st.cast && !cast) st.atk = nowMs;
  if (!st.cast && cast) st.castAt = nowMs;
  if (hp < st.hp) st.hit = nowMs;
  st.cast = cast; st.hp = hp; s.setData("sm", st);
  const [vx0, vy0] = DIR_VEC[face], n = Math.hypot(vx0, vy0), vx = vx0 / n, vy = vy0 / n, side = vx >= 0 ? 1 : -1;
  const P: StaticPose = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, flash: false };
  const t = nowMs / 1000, M = STATIC_MOTION, since = (nowMs - st.atk) / 1000, hitT = (nowMs - st.hit) / 1000;
  const W = M.windup[family], S = M.strike[family], K = M.walk[family], I = M.idle[family], elite = power > 1;
  if (cast) {
    const k = Math.min(1, (nowMs - st.castAt) / 1000 / W.ease), pw = k * power, pulse = elite ? 1 + 0.03 * Math.sin(t * 14) * k : 1;
    P.sy = (1 - W.sy * pw) * pulse; P.sx = (1 + W.sx * pw) * pulse; P.rot = -W.lean * pw * side;
    P.dx = -vx * W.back * pw + Math.sin(t * 60) * 0.4 * pw; P.dy = -W.up * pw;
    if (family === "plant") P.rot += Math.sin(t * 9) * 0.05 * pw; // cây run run như sắp quất
  } else if (since >= 0 && since < S.sec + S.ret) {
    const reach = S.dist * (1 + 0.3 * (power - 1)), k = Math.min(1, since / S.sec);
    if (S.dist === 0) { // quất dây: quét qua rồi dội ngược, tắt dần trong `ret`
      P.rot = S.lean * power * side * Math.sin(k * Math.PI * 1.5) * (since < S.sec ? 1 : Math.max(0, 1 - (since - S.sec) / S.ret));
      P.sy = 1 + 0.12 * Math.sin(k * Math.PI);
    } else {
      const u = since < S.sec ? Math.sin(k * Math.PI / 2) : 1 - (since - S.sec) / S.ret;
      P.dx = vx * reach * u; P.dy = vy * reach * 0.5 * u - S.arc * Math.sin(k * Math.PI) * (since < S.sec ? 1 : 0);
      P.rot = S.lean * side * u; P.sx = 1 + S.sx * u;
      if (family === "bird") P.sy = 1 - S.sx * u * 0.5;
    }
  } else if (moving) {
    const ph = (t * 2 * Math.PI) / K.period;
    P.dy = -Math.abs(Math.sin(ph / 2)) * K.lift - K.hover - (K.hover ? Math.sin(ph) * 0.8 : 0);
    P.sy = 1 + K.sy * Math.cos(ph); P.sx = 1 - K.sx * Math.cos(ph); P.rot = K.tilt * Math.sin(ph / 2);
  } else {
    const ph = (t * 2 * Math.PI) / I.period;
    P.sy = 1 + I.sy * Math.sin(ph); P.sx = 1 - I.sx * Math.sin(ph); P.rot = I.tilt * Math.sin(ph);
    P.dy = -I.hover - (I.hover ? Math.sin(ph * 2) * 0.8 : 0);
    if (I.peck) { // chim cúi mổ đất ngắn mỗi `peck` giây (lệch pha theo sprite để cả đàn không mổ cùng lúc)
      const q = (t + (s.x * 0.37 % I.peck)) % I.peck;
      if (q < 0.18) { const w = Math.sin((q / 0.18) * Math.PI); P.sy = 1 - 0.1 * w; P.rot = 0.18 * side * w; P.dy += 1.2 * w; }
    }
  }
  if (hitT >= 0 && hitT < M.hurt.sec) {
    P.dx += Math.sin(hitT * 90) * M.hurt.shake * (1 - hitT / M.hurt.sec);
    P.flash = Math.floor(hitT * M.hurt.flash) % 2 === 0;
  }
  const mk = motionScale(nowMs);
  if (mk !== 1) { P.dx *= mk; P.dy *= mk; P.rot *= mk; P.sx = 1 + (P.sx - 1) * mk; P.sy = 1 + (P.sy - 1) * mk; }
  return P;
}

/** Phần chuyển động bằng code còn giữ khi hồn thú dùng hoạt ảnh vẽ thật (H3): báo trước (co giãn, ngả, lùi), nửa quãng lao khi ra đòn, lắc và nháy trắng khi
 *  trúng đòn. Đứng / đi / hoạt ảnh trúng đòn đã vẽ trong khung nên bỏ phần thở, nhún, nghiêng của staticBeastPose (tránh chồng hai lần). */
export function animBeastPose(s: Phaser.GameObjects.Sprite, nowMs: number, moving: boolean, cast: boolean, hp: number, face: Dir8,
  family: BeastFamily = "quad", power = 1): StaticPose {
  const P = staticBeastPose(s, nowMs, moving, cast, hp, face, family, power), state = (s.getData("ba") as BeastAnimState | undefined)?.state;
  if (state === "windup") return P;
  const sm = s.getData("sm") as StaticMotionState, hitT = (nowMs - sm.hit) / 1000, H = STATIC_MOTION.hurt, mk = motionScale(nowMs);
  // Quãng lao của code dài hơn dải ra đòn vẽ (STRIKE_MS): chỉ giữ một nửa, giảm đều về 0 đúng lúc dải hết; ngoài ra chỉ còn lắc khi trúng đòn.
  const lunge = state === "attack" ? lungeKeep(nowMs - sm.atk) : 0, shake = hitT >= 0 && hitT < H.sec ? Math.sin(hitT * 90) * H.shake * (1 - hitT / H.sec) * mk : 0;
  P.dx = (P.dx - shake) * lunge + shake; P.dy *= lunge;
  P.sx = 1; P.sy = 1; P.rot = 0;
  return P;
}

/** Sheet hồn thú là hình tạm ghép từ thú LPC (manifest `"lpc": true`): không dùng cho thú vương / boss (mục 5.11). */
const LPC_BEASTS = new Set<string>();
/** Loài dùng để chọn sheet `beast_{loài}` cho hồn thú bậc `rank`: thú vương / boss bỏ hình tạm LPC, vẽ bằng code theo bậc. */
export const beastSheetSpecies = (rank: number, species: string | undefined) =>
  species && rank >= 2 && LPC_BEASTS.has(`beast_${species}`) ? undefined : species;

/**
 * Đo thân thật trong khung idle đầu của sheet hồn thú isometric (pixel ảnh): mép trên cách đỉnh khung `top`, bề ngang `w` (lớn nhất
 * qua 5 hướng). Khung vuông theo bậc rộng hơn thân nhiều (thỏ trong khung 64 cao khoảng 20) nên thanh máu, bóng, lỗ khoét theo thân.
 */
function measureIsoBeast(scene: Phaser.Scene, key: string) {
  const tex = scene.textures.get(key), img = tex.getSourceImage() as HTMLImageElement, f = img.height / ISO_DIRS.length;
  const c = document.createElement("canvas"); c.width = f; c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
  ctx.drawImage(img, 0, 0, f, img.height, 0, 0, f, img.height); // cột 0: khung idle đầu của 5 hướng
  const a = ctx.getImageData(0, 0, f, img.height).data;
  let top = f, w = 0;
  for (let r = 0; r < ISO_DIRS.length; r++) {
    let x0 = f, x1 = -1;
    for (let y = 0; y < f; y++) for (let x = 0; x < f; x++) if (a[((r * f + y) * f + x) * 4 + 3]) { top = Math.min(top, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    w = Math.max(w, x1 - x0 + 1);
  }
  (tex.customData as { body?: BeastBodyPx }).body = { top: top < f ? top : 0, w: w || f };
}

/** Như measureIsoBeast cho sheet tĩnh: đo thân lớn nhất qua 3 khung nam / đông / bắc. */
function measureStaticBeast(scene: Phaser.Scene, key: string) {
  const tex = scene.textures.get(key), img = tex.getSourceImage() as HTMLImageElement, f = img.height;
  const c = document.createElement("canvas"); c.width = img.width; c.height = f;
  const ctx = c.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
  ctx.drawImage(img, 0, 0);
  const a = ctx.getImageData(0, 0, img.width, f).data;
  let top = f, w = 0;
  for (let i = 0; i < STATIC_DIRS.length; i++) {
    let x0 = f, x1 = -1;
    for (let y = 0; y < f; y++) for (let x = 0; x < f; x++) if (a[(y * img.width + i * f + x) * 4 + 3]) { top = Math.min(top, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    w = Math.max(w, x1 - x0 + 1);
  }
  (tex.customData as { body?: BeastBodyPx }).body = { top: top < f ? top : 0, w: w || f };
}

/** Như measureIsoBeast cho sheet hoạt ảnh vẽ thật: đo khung idle đầu của 5 hướng. */
function measureAnimBeast(scene: Phaser.Scene, key: string) {
  const tex = scene.textures.get(key), img = tex.getSourceImage() as HTMLImageElement, L = ANIM_LAYOUTS.get(key) ?? DEFAULT_LAYOUT, f = img.width / L.cols;
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
  ctx.drawImage(img, 0, 0);
  const a = ctx.getImageData(0, 0, img.width, img.height).data, i0 = L.anims.idle;
  let top = f, w = 0;
  for (let d = 0; d < L.dirs.length; d++) {
    if (L.dirsOk && !L.dirsOk.includes(L.dirs[d])) continue; // hướng chưa đạt: ô trống / hỏng, không đo
    const r0 = (d * L.rowsPerDir + i0.band) * f;
    let x0 = f, x1 = -1;
    for (let y = 0; y < f; y++) for (let x = 0; x < f; x++) if (a[((r0 + y) * img.width + i0.col * f + x) * 4 + 3]) { top = Math.min(top, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
    w = Math.max(w, x1 - x0 + 1);
  }
  (tex.customData as { body?: BeastBodyPx }).body = { top: top < f ? top : 0, w: w || f };
}

interface BeastBodyPx { top: number; w: number }
/** Thân của sprite hồn thú trên màn hình (sheet isometric đã đo; sheet khác lấy cả khung): mép trên (y), bề ngang, chiều cao. */
export function beastBody(s: Phaser.GameObjects.Sprite): BeastBodyPx & { h: number } {
  const b = (s.texture.customData as { body?: BeastBodyPx }).body;
  if (!b) return { top: s.y - s.displayHeight * s.originY, w: s.displayWidth, h: s.displayHeight };
  const h = (s.frame.height * s.originY - b.top) * s.scaleY;
  return { top: s.y - h, w: b.w * s.scaleX, h };
}

/**
 * Hồn thú theo loài (M4): nếu loài đã có sheet `beast_{loài}` thì đặt sheet đó, gốc giữa đáy và chạy `idle`/`walk`.
 * Trả false khi loài chưa có ảnh thật để nơi gọi vẽ `b{tier}_…` bằng code như cũ. Sheet isometric (trả "iso") chọn hàng theo hướng
 * `face` và tự lật sw / w / nw; sheet một hàng cũ (trả "flat") để nơi gọi lật ngang. Sheet tĩnh 3 khung của hồn thú lai (trả "static")
 * chỉ chọn khung và cờ lật theo hướng; chuyển động do nơi gọi áp staticBeastPose.
 */
export function syncBeastSprite(s: Phaser.GameObjects.Sprite, species: string | undefined, moving: boolean, aggro: boolean, cast = false,
  face: Dir8 = "se", art?: { now: number; hp: number; walkScale: number; atk?: number }): false | "iso" | "flat" | "static" | "anim" {
  const key = `beast_${species}`, akey = species && art ? animKeyOf(s.scene, species) : undefined;
  // Hoạt ảnh vẽ thật (H3, #688): ưu tiên hơn ảnh tĩnh; loài chưa có sheet rơi xuống các nhánh cũ nguyên vẹn.
  if (species && art && akey) {
    const L = ANIM_LAYOUTS.get(akey) ?? DEFAULT_LAYOUT;
    let st: BeastAnimState | undefined = s.getData("ba");
    if (st && s.getData("baKey") !== akey) st = undefined; // `ba` giữ qua lúc đổi giữa sheet hoạt ảnh và ảnh tĩnh của cùng loài (hướng chưa đạt)
    s.setData("baKey", akey);
    if (!st) { st = newBeastAnimState(art.now, cast, art.hp); s.setData("ba", st); }
    // Hướng chưa đạt (#869 anim.dirsOk): sheet tĩnh (wantBeast luôn xin kèm khi anim có dirsOk) + chuyển động code; trạng thái `ba` chạy tiếp nên đổi qua lại không nhảy khung.
    // Sheet tĩnh chưa tới thì vẽ tạm khung của hướng đạt gần nhất, không bao giờ vẽ khung hướng chưa duyệt.
    const plan = beastDirPlan(face, L, isStaticBeast(s.scene, key));
    const r = stepBeastAnim(st, L, art.now, moving, cast, art.hp, plan.face, art.walkScale, art.atk);
    if (plan.mode !== "static") {
      if (s.texture.key !== akey) {
        if (s.anims.isPlaying) s.anims.stop();
        s.setTexture(akey, 0);
        s.setOrigin(0.5, (s.frame.height - ISO_BEAST_FOOT) / s.frame.height);
        s.setData("sm", undefined);
      }
      if (s.frame.name !== String(r.frame)) s.setFrame(r.frame);
      if (s.flipX !== r.flip) s.setFlipX(r.flip);
      if (aggro) s.setTint(0xffb4b4); else s.clearTint();
      return "anim";
    }
  } else if (s.getData("ba")) s.setData("ba", undefined);
  if (species && isStaticBeast(s.scene, key)) {
    const [col, flip] = STATIC_DIR_MAP[face];
    if (s.anims.isPlaying) s.anims.stop();
    if (s.texture.key !== key) {
      s.setTexture(key, col);
      s.setOrigin(0.5, (s.frame.height - ISO_BEAST_FOOT) / s.frame.height);
      s.setData("sm", undefined);
    } else if (s.frame.name !== String(col)) s.setFrame(col);
    if (s.flipX !== flip) s.setFlipX(flip);
    if (aggro) s.setTint(0xffb4b4); else s.clearTint();
    return "static";
  }
  const iso = !!species && isIsoBeast(s.scene, key), f = iso ? ISO_FLIP[face] : undefined;
  const dir = iso ? `_${f ?? face}` : "", anim = `${key}:${moving ? "walk" : "idle"}${dir}`, atk = `${key}:attack${dir}`;
  if (!species || !s.scene.anims.exists(anim)) return false;
  if (s.texture.key !== key) {
    s.setTexture(key, 0);
    const foot = iso ? ISO_BEAST_FOOT : BEAST_FOOT;
    s.setOrigin(0.5, (s.frame.height - foot) / s.frame.height);
  }
  if (iso && s.flipX !== !!f) s.setFlipX(!!f);
  // Báo trước chiêu (3.5): giữ khung đầu của `attack`; tung xong thì chạy nốt 2 khung ra đòn rồi mới về idle / walk.
  const cur = s.anims.currentAnim?.key === atk;
  if (cast) { if (!cur || !(s.anims.isPaused || s.anims.isPlaying)) { s.play(atk); s.anims.pause(); } }
  else if (cur && s.anims.isPaused) { s.anims.resume(); s.anims.nextFrame(); }
  else if (!(cur && s.anims.isPlaying)) s.play(anim, true);
  // Chưa có dấu "!" riêng cho trạng thái hung hăng (5.11): tạm ửng đỏ nhẹ để vẫn nhận ra.
  if (aggro) s.setTint(0xffb4b4); else s.clearTint();
  return iso ? "iso" : "flat";
}

/** Dải 4 xám chuẩn (tối → sáng) dùng khi vẽ phụ thể bằng code (honsuArt.ts). Viền ngoài #1a1020 không thuộc dải. */
export const GRAY_RAMP = ["#3a3a3a", "#6a6a6a", "#9a9a9a", "#cacaca"] as const;

interface SheetSpec { url: string; frame?: readonly [number, number] }
type ManifestEntry = string | { key: string; frame?: [number, number]; iso?: boolean; lpc?: boolean; static?: boolean; anim?: unknown; blank?: boolean };

/** Đường dẫn ảnh và kích thước khung suy ra từ key (bảng thư mục ở mục 5.11). */
function sheetSpec(key: string, frame?: readonly [number, number], iso = false): SheetSpec | null {
  let m: RegExpMatchArray | null;
  if ((m = key.match(/^vh_([a-z_]+_[bf])$/))) return { url: `vohon/${m[1]}.png`, frame: iso ? [ISO_VH_FRAME, ISO_VH_FRAME] : [VH_FRAME, VH_FRAME] };
  // Phụ thể hoạt ảnh vẽ thật (Phụ thể v2 P2, #1023): nửa sau / trước; khung vuông 96 hoặc 128 do manifest ghi (`frame`), mặc định 96.
  if ((m = key.match(/^vhanim_([a-z_]+_[bf])$/))) return { url: `vohonanim/${m[1]}.png`, frame: frame ?? [ISO_VH_FRAME, ISO_VH_FRAME] };
  // Vũ khí cầm tay (phụ thể v2 kiểu vũ khí, #1312): cùng bố cục như vhanim, thư mục riêng `vukhianim/`.
  if ((m = key.match(/^vkanim_([a-z_]+_[bf])$/))) return { url: `vukhianim/${m[1]}.png`, frame: frame ?? [ISO_VH_FRAME, ISO_VH_FRAME] };
  if ((m = key.match(/^b(\d)$/)) && BEAST_FRAMES[+m[1]]) return { url: `beast/${key}.png`, frame: frame ?? BEAST_FRAMES[+m[1]] };
  // Khung của từng loài phụ thuộc bậc của loài, nên manifest phải ghi `frame`.
  if ((m = key.match(/^beast_([a-z_]+)$/)) && frame) return { url: `beast/${m[1]}.png`, frame };
  if (/^ring\d$/.test(key)) return { url: `ring/${key}.png` };
  if (/^halo\d$/.test(key)) return { url: `ring/${key}.png`, frame: [24, 10] };
  // Hiệu ứng (tools/assets/lpc-item.mjs, #201): dải một hàng, manifest ghi `frame`; chạy bằng playFx.
  if ((m = key.match(/^fx_([a-z0-9_]+)$/)) && frame) return { url: `iso/fx/${m[1]}.png`, frame };
  // NPC phụ / dân thường ghép từ LPC (mục 5.11 "NPC phụ và dân thường"): một lớp đã tô màu, bố cục sheet hồn sư isometric.
  // Pháp tướng Võ Hồn Chân Thân (#482): sheet 16 cột × 5 hàng, khung 160 (PT_FRAME); không có normal map. Do phapTuong.ts dùng.
  if ((m = key.match(/^pt_([a-z_]+)$/))) return { url: `phaptuong/${m[1]}.png`, frame: [PT_FRAME, PT_FRAME] };
  if ((m = key.match(/^lpc_([a-z0-9_]+)$/))) return { url: `iso/lpc/${m[1]}.png`, frame: [ISO_HS_FRAME, ISO_HS_FRAME] };
  return null;
}

/** Xếp hàng tải một key theo sheetSpec (bỏ qua nếu texture đã có). */
export function loadSpriteKey(scene: Phaser.Scene, key: string) {
  const spec = sheetSpec(key);
  if (!spec || scene.textures.exists(key)) return;
  if (spec.frame) scene.load.spritesheet(key, BASE + spec.url, { frameWidth: spec.frame[0], frameHeight: spec.frame[1] });
  else scene.load.image(key, BASE + spec.url);
}

/**
 * Gọi trong preload(): đọc manifest rồi xếp hàng tải các ảnh có trong đó. Sheet NPC LPC (`lpc_<tên>`) chỉ cần cho bản đồ đang vào
 * nên không tải hết: `lpc` nhận danh sách tên có trong manifest và tự xếp hàng tải những tên bản đồ dùng (crowd.ts).
 */
export function preloadSprites(scene: Phaser.Scene, lpc?: (names: Set<string>) => void, after?: () => void) {
  void loadPhuAnchors(BASE + "vohonanim/anchor.json"); // neo khối thân của phụ thể (phutheAnchor.ts); thiếu thì hành vi cũ
  scene.cache.json.remove(MANIFEST_KEY); // Game giữ qua các bản đồ (#716 bước 5): cache JSON còn thì loader bỏ qua file, sự kiện filecomplete không bắn
  scene.load.json(MANIFEST_KEY, BASE + "manifest.json");
  scene.load.once(`filecomplete-json-${MANIFEST_KEY}`, (_key: string, _type: string, data: { sprites?: ManifestEntry[] }) => {
    const lpcNames = new Set<string>();
    for (const e of data?.sprites ?? []) {
      // Asset isometric (mục 5.11): từ 10.4 tải bộ hồn sư (cả 3 lớp cùng có "iso", validate.mjs kiểm), từ 10.5 phụ thể 96×96 (võ hồn
      // chưa có ảnh mới vẫn dùng bộ 48×48 cũ hoặc vẽ bằng code; vohonFrame ánh xạ khung giữa hai bố cục); vật đứng do isoMap.ts tải
      // theo shared/assets/iso/tiles.json (chỉ vật bản đồ đang vào dùng); hồn thú `beast_{loài}` khung vuông theo bậc, sheet 20 × 5
      // (loài chưa có vẫn sheet một hàng cũ hoặc vẽ bằng code; `"lpc": true` là hình tạm từ thú LPC, beastSheetSpecies); chân dung,
      // NPC, vật phẩm do giao diện HTML đọc manifest (uiArt.ts); hiệu ứng `fx_*` (#201) là dải một hàng, chạy bằng playFx.
      const key = typeof e === "string" ? e : e.key, iso = typeof e !== "string" && !!e.iso;
      if (/^lpc_/.test(key)) { lpcNames.add(key.slice(4)); continue; }
      if (iso && !/^(vh|vhanim|vkanim|beast|fx|pt)_/.test(key)) continue;
      if (typeof e !== "string" && e.anim && /^beast_[a-z_]+_anim$/.test(key)) { const L = parseLayout(e.anim); ANIM_LAYOUTS.set(key, L); markPartialAnim(key, !!L.dirsOk); }
      if (typeof e !== "string" && /^(vhanim|vkanim)_[a-z_]+_[bf]$/.test(key)) { const L = parsePhuLayout(e.anim, e.frame); if (L) PHU_LAYOUTS.set(key, L); else console.warn(`[sprites] anim của ${key} không hợp lệ: phụ thể chạy nhánh cũ`); }
      if (typeof e !== "string" && e.lpc && key.startsWith("beast_")) LPC_BEASTS.add(key);
      // Nửa phụ thể trống hoàn toàn (#974): không có file, không tải (cả normal map); lớp đó ẩn (vohonBlank).
      if (typeof e !== "string" && e.blank && /^(vh|vhanim|vkanim)_/.test(key)) { registerBlankSheet(key); continue; }
      const spec = sheetSpec(key, typeof e === "string" ? undefined : e.frame, iso);
      if (!spec) { console.warn(`[sprites] key không hợp lệ trong manifest: ${key}`); continue; }
      // Phụ thể isometric (2304×1152 × 2 lớp × 25 võ hồn) tải theo nhu cầu (vohonLazy.ts), không tải hết mỗi lần vào bản đồ.
      // Pháp tướng (2560×800 × 35) cũng tải theo nhu cầu (wantPhapTuong).
      // Hồn thú (134 file) cũng tải theo loài đang có trong tầm (wantBeast).
      // Hiệu ứng chiêu `fx_sk_*` theo võ hồn (wantSkillFx, bước 4).
      if (iso && spec.frame && (/^(vh|vhanim|vkanim|pt|beast)_/.test(key) || isLazySkillFx(key))) { registerVohonSheet(key, BASE + spec.url, spec.frame); continue; }
      if (spec.frame) scene.load.spritesheet(key, BASE + spec.url, { frameWidth: spec.frame[0], frameHeight: spec.frame[1] });
      else scene.load.image(key, BASE + spec.url);
      // Normal map của bộ hồn sư / phụ thể isometric (`<ảnh>_n.png`, 10.7): tải riêng, GameScene gắn vào texture (attachNormal).
      if (iso && !key.startsWith("fx_") && !key.startsWith("pt_") && lightingOn(scene.game)) scene.load.image(`${key}_n`, BASE + spec.url.replace(/\.png$/, "_n.png"));
    }
    lpc?.(lpcNames);
    after?.(); // sau khi manifest đã ghi spec (vohonLazy): nơi gọi xin thêm sheet cần ngay
  });
}

/** Thêm khung đánh số theo lưới cho texture vẽ bằng code, để dùng y như spritesheet tải từ ảnh. */
export function addGridFrames(scene: Phaser.Scene, key: string, fw: number, fh: number) {
  const tex = scene.textures.get(key), src = tex.source[0];
  const cols = Math.floor(src.width / fw), rows = Math.floor(src.height / fh);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (!tex.has(String(i))) tex.add(i, 0, c * fw, r * fh, fw, fh);
  }
}

/** Thời gian mỗi khung của hiệu ứng `fx_*` (ms): dải nổ 10 khung chạy khoảng nửa giây. */
const FX_FRAME_MS = 50;
/**
 * Chạy một lần hiệu ứng `fx_<tên>` (dải một hàng tải theo manifest) ở (x, y) màn hình, phóng `scale`, rồi tự hủy. Chưa có ảnh
 * (manifest thiếu key) thì không làm gì để nơi gọi giữ hiệu ứng vẽ bằng code.
 */
export function playFx(scene: Phaser.Scene, key: string, x: number, y: number, scale: number, depth: number) {
  if (!scene.textures.exists(key)) return null;
  const anim = `${key}:play`;
  if (!scene.anims.exists(anim)) scene.anims.create({ key: anim, frames: scene.anims.generateFrameNumbers(key), duration: FX_FRAME_MS * (scene.textures.get(key).frameTotal - 1), repeat: 0 });
  const s = scene.add.sprite(x, y, key, 0).setScale(scale).setDepth(depth);
  s.play(anim); s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
  return s;
}

function makeAnim(scene: Phaser.Scene, sheet: string, key: string, start: number, a: AnimDef) {
  if (scene.anims.exists(key)) return;
  const frames = scene.anims.generateFrameNumbers(sheet, { start, end: start + a.ms.length - 1 });
  if (frames.length !== a.ms.length) return; // sheet thiếu khung: bỏ qua thay vì tạo animation hỏng
  scene.anims.create({ key, frames: frames.map((f, i) => ({ ...f, duration: a.ms[i] })), repeat: a.loop ? -1 : 0 });
}

/** Tạo animation `{sheet}:{animation}_{hướng}` cho một sheet thân hồn sư isometric: hướng s, se, e, ne, n (`absorb_s`). */
export function createHonsuAnims(scene: Phaser.Scene, sheet: string) {
  if (!scene.textures.exists(sheet)) return;
  for (const [name, a] of Object.entries(ISO_HS_ANIMS) as [HsAnim, AnimDef][]) {
    if (a.row !== undefined) makeAnim(scene, sheet, `${sheet}:${name}_s`, a.row * ISO_SHEET_COLS + a.col, a);
    else ISO_DIRS.forEach((d, row) => makeAnim(scene, sheet, `${sheet}:${name}_${d}`, row * ISO_SHEET_COLS + a.col, a));
  }
}

/** Tạo animation cho sheet hồn thú: isometric `{sheet}:{animation}_{hướng}` (5 hàng s, se, e, ne, n), sheet một hàng cũ `{sheet}:{animation}`. */
export function createBeastAnims(scene: Phaser.Scene, sheet: string) {
  if (!scene.textures.exists(sheet)) return;
  if (isAnimBeast(scene, sheet)) { measureAnimBeast(scene, sheet); return; } // chọn khung theo giờ (stepBeastAnim), không dùng animation của Phaser
  if (sheet.startsWith("beast_") && isStaticBeast(scene, sheet)) { measureStaticBeast(scene, sheet); return; } // không có animation: chuyển động bằng code
  if (sheet.startsWith("beast_") && isIsoBeast(scene, sheet)) {
    for (const [name, a] of Object.entries(ISO_BEAST_ANIMS)) ISO_DIRS.forEach((d, row) => makeAnim(scene, sheet, `${sheet}:${name}_${d}`, row * ISO_BEAST_COLS + a.col, a));
    measureIsoBeast(scene, sheet);
    return;
  }
  for (const [name, a] of Object.entries(BEAST_ANIMS)) makeAnim(scene, sheet, `${sheet}:${name}`, a.col, a);
}

// Sheet hồn thú tới sau lúc dựng scene (vohonLazy.wantBeast): dựng animation / đo thân như createSheetAnims, bỏ nhớ tạm "loài không có hoạt ảnh".
setBeastSheetHook((scene, key) => { createBeastAnims(scene, key); ANIM_KEY_OF.delete(key.replace(/^beast_/, "").replace(/_anim$/, "")); });

/** Tạo animation cho mọi sheet NPC LPC (thân hồn sư LPC ghép lúc chạy tự tạo ở lpcRig.ts) và hồn thú đang có (ảnh thật hoặc vẽ bằng code). */
export function createSheetAnims(scene: Phaser.Scene) {
  ANIM_KEY_OF.clear();
  for (const key of scene.textures.getTextureKeys()) {
    if (/^lpc_[a-z0-9_]+$/.test(key)) createHonsuAnims(scene, key);
    else if (/^(b\d|beast_[a-z_]+)$/.test(key) && !key.endsWith("_n")) createBeastAnims(scene, key); // `_n`: normal map, không phải sheet
  }
}

/** Key animation và cờ lật ngang cho hướng 8 phía trên màn hình; `absorb` chỉ có hướng xuống. sw, w, nw lật se, e, ne. */
export function honsuAnimKey(sheet: string, anim: HsAnim, d: Dir8): { key: string; flip: boolean } {
  if (anim === "absorb") return { key: `${sheet}:absorb_s`, flip: false };
  const f = ISO_FLIP[d];
  return { key: `${sheet}:${anim}_${f ?? d}`, flip: !!f };
}

/** Đọc một khung theo bố cục sheet hồn sư: animation, hàng hướng (absorb: 0), khung thứ mấy; null nếu ô ngoài bố cục. */
function decodeFrame(n: number, iso: boolean): { anim: HsAnim; row: number; i: number } | null {
  const cols = iso ? ISO_SHEET_COLS : SHEET_COLS, table: Record<HsAnim, AnimDef> = iso ? ISO_HS_ANIMS : HS_ANIMS;
  const row = Math.floor(n / cols), col = n % cols, dirs = iso ? ISO_DIRS.length : DIRS.length;
  for (const [anim, a] of Object.entries(table) as [HsAnim, AnimDef][]) {
    const onRow = a.row !== undefined ? row === a.row : row < dirs;
    if (onRow && col >= a.col && col < a.col + a.ms.length) return { anim, row: a.row !== undefined ? 0 : row, i: col - a.col };
  }
  return null;
}

/** Hàng hướng giữa hai bố cục: isometric s, se, e, ne, n → cũ down, right, up; và ngược lại. */
const ISO_ROW_TO_OLD = [0, 1, 1, 1, 2], OLD_ROW_TO_ISO = [0, 2, 4];

/**
 * Bảng ánh xạ khung lớp phụ thể (mục 5.11; phụ thể chỉ vẽ idle / walk / attack / cast): cùng animation, cùng hướng, cùng khung (phụ thể
 * ít khung hơn thì khung cuối); hurt → idle khung đầu; absorb → idle hướng xuống, mờ 60%; die → ẩn (null). Thân và phụ thể có thể khác
 * bố cục trong lúc chuyển sang isometric (thân từ 10.4, phụ thể từ 10.5) nên ánh xạ qua (animation, hướng, khung).
 */
export function vohonFrame(bodyFrame: number, isoBody = false, isoVohon = false): { frame: number; alpha: number } | null {
  const f = decodeFrame(bodyFrame, isoBody);
  if (!f || f.anim === "die") return null;
  const [anim, i, alpha]: [HsAnim, number, number] = f.anim === "absorb" ? ["idle", f.i, 0.6] : f.anim === "hurt" ? ["idle", 0, 1] : [f.anim, f.i, 1];
  const row = isoBody === isoVohon ? f.row : isoBody ? ISO_ROW_TO_OLD[f.row] : OLD_ROW_TO_ISO[f.row];
  const a = (isoVohon ? ISO_HS_ANIMS : HS_ANIMS)[anim];
  return { frame: row * (isoVohon ? ISO_SHEET_COLS : SHEET_COLS) + a.col + Math.min(i, a.ms.length - 1), alpha };
}

/** Số hàng mỗi nửa sheet phụ thể isometric; sheet đủ hai nửa (nam rồi nữ, mục 5.11) cao 2 × ISO_VH_HALF_ROWS khung. */
const ISO_VH_HALF_ROWS = 6;

/**
 * Phụ thể isometric (10.5) có một nửa sheet cho mỗi dáng thân, ghép theo điểm neo của thân mẫu giới đó (mục 5.11: nam hàng 0–4,
 * nữ hàng 6–10, vì tay nữ khép sát người hơn). Trả số khung cần cộng vào khung phụ thể: thân nữ (`lpcc_f_…`)
 * dùng nửa nữ nếu sheet có đủ hai nửa; sheet cũ / vẽ bằng code: 0.
 */
export function vohonHalf(scene: Phaser.Scene, vohonKey: string, bodyKey: string): number {
  if (!/^lpcc_f_/.test(bodyKey) || !isIsoSheet(scene, vohonKey)) return 0;
  return scene.textures.get(vohonKey).source[0].height >= 2 * ISO_VH_HALF_ROWS * ISO_VH_FRAME ? ISO_VH_HALF_ROWS * ISO_SHEET_COLS : 0;
}

/** Đặt khung lớp phụ thể (theo bảng ánh xạ, nửa sheet theo giới) theo khung lớp thân hiện tại. */
export function syncLayers(body: Phaser.GameObjects.Sprite, vohon: Phaser.GameObjects.Sprite[]) {
  const n = Number(body.frame.name), isoBody = isIsoSheet(body.scene, body.texture.key);
  const v = vohon.length ? vohonFrame(n, isoBody, isIsoSheet(body.scene, vohon[0].texture.key)) : null;
  const half = v ? vohonHalf(body.scene, vohon[0].texture.key, body.texture.key) : 0;
  for (const s of vohon) {
    s.setVisible(v !== null).setFlipX(body.flipX);
    if (v) s.setFrame(v.frame + half).setAlpha(v.alpha);
  }
}

/** Phụ thể hoạt ảnh vẽ thật của một hồn sư (võ hồn có `vhanim_{id}`): bố cục và texture [sau, trước]; thiếu thì võ hồn chạy nhánh cũ (syncLayers). */
export interface PhuAnimSet {
  layout: PhuLayout; keys: [string, string];
  /** Phụ thể tĩnh cũ `vh_{id}` (texture + nửa trống) cho hướng chưa nhập (layout.dirsOk); null khi nhập đủ 5 hướng. */
  statik: { keys: [string, string]; blank: [boolean, boolean] } | null;
}
/** Key `vhanim_{id}_b` / `_f` (nửa trống mượn texture nửa kia, như vohonKeys). */
export const isPhuAnimKey = (key: string) => key.startsWith("vhanim_");

/** Hướng `face` chạy phụ thể tĩnh cũ thay vì clip vẽ thật (võ hồn nhập từng hướng, layout.dirsOk, hướng này chưa nhập). */
export const phuUsesStatic = (pa: PhuAnimSet, face: Dir8): boolean => pa.statik !== null && !phuDirOk(pa.layout, face);

/** Gốc và hệ số phóng của lớp phụ thể hoạt ảnh (khung 96: gốc (48, 74); 128: (64, 90)); hình chứa phóng SPR nên lớp phóng 1 / SPR. */
export function fitPhuLayer<T extends Phaser.GameObjects.Sprite>(s: T, L: PhuLayout): T {
  const oy = phuOriginY(L.frame);
  if (s.originY !== oy || s.originX !== 0.5) s.setOrigin(0.5, oy);
  if (s.scaleX !== 1 / SPR) s.setScale(1 / SPR);
  return s;
}

/** Bố cục + texture phụ thể hoạt ảnh của võ hồn `id` nếu cả hai nửa (không trống) đã có trong texture và đúng kích thước; không thì null (nhánh cũ). */
export const phuAnimSetOf = (scene: Phaser.Scene, id: string, blank: readonly [boolean, boolean]): PhuAnimSet | null => animSetOf(scene, id, blank, "vhanim");
/**
 * Vũ khí cầm tay (sheet `vkanim_{id}`, #1312) của võ hồn `id`: cùng bố cục và cùng cách đặt khung như phụ thể hoạt ảnh, nhưng chỉ nhận sheet manifest ghi `anim.kind: "vukhi"`
 * và đủ 5 hướng (thiếu hướng thì không trộn vũ khí với phụ thể tĩnh: cả võ hồn chạy nhánh hiện nay). Thiếu sheet / sai kích thước thì null (nhánh hiện nay).
 */
export function vukhiSetOf(scene: Phaser.Scene, id: string, blank: readonly [boolean, boolean]): PhuAnimSet | null {
  const set = animSetOf(scene, id, blank, "vkanim");
  return set && set.layout.weapon && !set.layout.dirsOk ? set : null;
}
function animSetOf(scene: Phaser.Scene, id: string, blank: readonly [boolean, boolean], prefix: "vhanim" | "vkanim"): PhuAnimSet | null {
  const kb = `${prefix}_${id}_b`, kf = `${prefix}_${id}_f`, L = PHU_LAYOUTS.get(kb) ?? PHU_LAYOUTS.get(kf);
  if (!L || (!blank[0] && !PHU_LAYOUTS.has(kb)) || (!blank[1] && !PHU_LAYOUTS.has(kf))) return null;
  const keys: [string, string] = [blank[0] ? kf : kb, blank[1] ? kb : kf];
  for (const k of keys) {
    if (!scene.textures.exists(k)) return null;
    const src = scene.textures.get(k).source[0];
    if (!phuSheetFits(src.width, src.height, PHU_LAYOUTS.get(k) ?? L)) return null;
  }
  return { layout: L, keys, statik: L.dirsOk ? { keys: vohonKeys(id), blank: vohonBlank(id) } : null };
}

/**
 * Đặt khung lớp phụ thể hoạt ảnh vẽ thật theo hoạt ảnh thân `anim` đang hiển thị (không dùng animation của Phaser, không tạo object): hàng theo
 * hướng 5 (`face`, phuFaceOf), cột theo clip; vòng lặp theo bước thân hiện tại, một lần theo tuổi `age` (ms từ lúc bắt đầu hoạt ảnh, -1 nếu không biết).
 * `die`: ẩn; `absorb`: clip idle, mờ 60%. Trả clip đang phát (để nơi gọi cộng độ dời `layout.offset[clip]`), null khi ẩn.
 */
export function syncPhuLayers(body: Phaser.GameObjects.Sprite, layers: Phaser.GameObjects.Sprite[], pa: PhuAnimSet, anim: HsAnim, face: Dir8, age: number): ReturnType<typeof phuClipOf> {
  const clip = phuClipOf(anim), L = pa.layout;
  // Hướng chưa nhập (anim.dirsOk): phụ thể tĩnh cũ + syncLayers cho riêng hướng đó (tây theo hàng nguồn đông); trả null để nơi gọi không cộng độ dời clip.
  const st = phuUsesStatic(pa, face), want = st ? pa.statik!.keys : pa.keys;
  layers.forEach((s, i) => { if (s.texture.key !== want[i]) { s.setTexture(want[i]); if (st) fitHonsuLayer(s, true); else fitPhuLayer(s, L); } });
  if (st) { syncLayers(body, layers); return null; }
  if (!clip) { for (const s of layers) s.setVisible(false); return null; }
  const A = ISO_HS_ANIMS[anim], steps = A.ms.length, step = Number(body.frame.name) % ISO_SHEET_COLS - A.col;
  const i = phuClipIndex(L.clips[clip].n, steps, step, A.loop, age, honsuAnimMs(anim), !!L.weapon);
  const half = phuHalf(layers[0].texture.source[0].height, L, /^lpcc_f_/.test(body.texture.key));
  const f = phuFrame(L, clip, phuDirRow(face), half, i), a = anim === "absorb" ? 0.6 : 1;
  for (const s of layers) { s.setVisible(true).setFlipX(body.flipX); s.setFrame(f).setAlpha(a); }
  return clip;
}
