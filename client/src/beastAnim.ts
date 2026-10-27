// Hoạt ảnh vẽ thật của hồn thú (H3, #688; đặc tả docs/art/hon-thu-hoat-anh.md): sheet game `beast_<loài>_anim`, 6 cột × 20 hàng khung vuông
// (5 hướng vẽ × 4 dải; đứng + trúng đòn chung dải 1). Module thuần (không Phaser) để kiểm bằng node: chọn khung theo hướng / trạng thái.
import type { Dir8 } from "./iso.ts";

const sum = (a: readonly number[]) => a.reduce((x, y) => x + y, 0);
export type AnimName = "idle" | "walk" | "attack" | "hurt" | "die";
/** 5 hướng vẽ thật theo thứ tự khối hàng; sw, w, nw dùng se, e, ne lật ngang. */
export const ANIM_DIRS = ["s", "se", "e", "ne", "n"] as const;
export type AnimDir = (typeof ANIM_DIRS)[number];
const FLIP_OF: Partial<Record<Dir8, AnimDir>> = { sw: "se", w: "e", nw: "ne" };

export interface AnimSlot { band: number; col: number; n: number }
/** Bố cục sheet: manifest `anim` (do beast-sheet-cut.mjs ghi) hoặc mặc định theo đặc tả. */
export interface AnimLayout {
  cols: number; rowsPerDir: number; dirs: readonly string[]; anims: Record<AnimName, AnimSlot>;
  /** Hướng vẽ đạt duyệt (#869, manifest `anim.dirsOk`); thiếu = đủ mọi hướng. Hướng không đạt chạy ảnh tĩnh + chuyển động code. */
  dirsOk?: readonly string[];
}

export const DEFAULT_LAYOUT: AnimLayout = {
  cols: 6, rowsPerDir: 4, dirs: ANIM_DIRS,
  anims: { idle: { band: 0, col: 0, n: 4 }, hurt: { band: 0, col: 4, n: 2 }, walk: { band: 1, col: 0, n: 6 }, attack: { band: 2, col: 0, n: 6 }, die: { band: 3, col: 0, n: 4 } },
};

/** Nhịp khung (ms) của từng hoạt ảnh; số khung lấy theo bố cục. Khung 0 của `attack` giữ khi báo trước (cast), `die` giữ khung cuối. */
export const ART_MS = {
  idle: 220, walk: 100, hurt: [90, 130], die: 120,
  /** Khung 1.. của `attack` sau khi server tung chiêu (khung 0 là tư thế báo trước): gồng → lao → chạm → thu về. */
  attack: [60, 60, 80, 100, 120],
  /** Giữ walk thêm chừng này sau khi `moving` tắt (server có lúc tắt cờ một nhịp): tránh nháy đứng - đi. */
  walkHold: 120,
} as const;

/** Đọc `anim` trong manifest (có thể thiếu hoặc lạ): trả bố cục hợp lệ hoặc mặc định. */
export function parseLayout(a: unknown): AnimLayout {
  const o = a as Partial<AnimLayout> | undefined;
  if (!o || typeof o !== "object" || !o.anims || !Array.isArray(o.dirs)) return DEFAULT_LAYOUT;
  const anims = {} as Record<AnimName, AnimSlot>;
  for (const k of Object.keys(DEFAULT_LAYOUT.anims) as AnimName[]) {
    const s = o.anims[k];
    if (!s || !Number.isInteger(s.band) || !Number.isInteger(s.col) || !(s.n >= 1)) return DEFAULT_LAYOUT;
    anims[k] = { band: s.band, col: s.col, n: s.n };
  }
  const ok = Array.isArray(o.dirsOk) ? o.dirsOk.filter((d, i, a) => o.dirs!.includes(d) && a.indexOf(d) === i) : undefined;
  return { cols: o.cols ?? 6, rowsPerDir: o.rowsPerDir ?? 4, dirs: o.dirs, anims, ...(ok && ok.length < o.dirs.length ? { dirsOk: ok } : {}) };
}

/** Hướng 8 trên màn hình → chỉ số hướng vẽ (0–4) và cờ lật ngang. */
export function animDir(face: Dir8, layout: AnimLayout = DEFAULT_LAYOUT): { dir: number; flip: boolean } {
  const f = FLIP_OF[face], d = f ?? face;
  const i = layout.dirs.indexOf(d);
  return { dir: i < 0 ? 0 : i, flip: !!f };
}

/** Hướng `face` có hoạt ảnh vẽ thật đạt không (tây tính theo hướng đông tương ứng); false thì nơi gọi dùng ảnh tĩnh. */
export function animDirOk(face: Dir8, layout: AnimLayout = DEFAULT_LAYOUT): boolean {
  if (!layout.dirsOk) return true;
  return layout.dirsOk.includes(FLIP_OF[face] ?? face);
}

/**
 * Cách vẽ hồn thú ở hướng `face` (#869): "anim" = khung hoạt ảnh vẽ thật của `face`; "static" = sheet tĩnh `beast_<loài>` (hướng chưa đạt, sheet tĩnh đã có);
 * "near" = hướng chưa đạt mà sheet tĩnh chưa tới: vẽ tạm khung của hướng đạt gần nhất (`face` trả về), tuyệt đối không vẽ khung chưa duyệt.
 */
export function beastDirPlan(face: Dir8, layout: AnimLayout, staticReady: boolean): { mode: "anim" | "static" | "near"; face: Dir8 } {
  if (animDirOk(face, layout)) return { mode: "anim", face };
  const ok = layout.dirsOk ?? [], base = FLIP_OF[face] ?? face, at = ANIM_DIRS.indexOf(base as AnimDir);
  let best = ok[0] as AnimDir | undefined;
  for (const d of ok) if (Math.abs(ANIM_DIRS.indexOf(d as AnimDir) - at) < Math.abs(ANIM_DIRS.indexOf(best as AnimDir) - at)) best = d as AnimDir;
  const flipOf: Partial<Record<AnimDir, Dir8>> = { se: "sw", e: "w", ne: "nw" };
  const near = best ? ((FLIP_OF[face] && flipOf[best]) || best) as Dir8 : face;
  return { mode: staticReady ? "static" : "near", face: near };
}

/** Chỉ số khung (trong sheet đánh số theo hàng) của khung `i` hoạt ảnh `anim` ở hướng vẽ `dir`; `i` kẹp trong [0, n-1]. */
export function animFrame(layout: AnimLayout, anim: AnimName, dir: number, i: number): number {
  const s = layout.anims[anim];
  return (dir * layout.rowsPerDir + s.band) * layout.cols + s.col + Math.max(0, Math.min(s.n - 1, Math.floor(i)));
}

export type AnimState = "idle" | "walk" | "windup" | "attack" | "hurt";
/** Trạng thái theo từng sprite (giữ giữa các khung hình). */
export interface BeastAnimState { cast: boolean; atkN: number; atk: number; hp: number; hit: number; phase: number; last: number; moveAt: number; dir: number; state: AnimState }
export const newBeastAnimState = (now: number, cast: boolean, hp: number): BeastAnimState =>
  ({ cast, atkN: -1, atk: -1e9, hp, hit: -1e9, phase: 0, last: now, moveAt: -1e9, dir: 0, state: "idle" });

/** Thời gian (ms) chạy hết khung ra đòn 1..5: code chỉ được lao trong khoảng này để không lệch khỏi khung vẽ. */
export const STRIKE_MS = sum(ART_MS.attack);
const HURT_MS = sum(ART_MS.hurt);

/**
 * Chọn khung cho một lần vẽ. Trạng thái theo thứ tự ưu tiên: báo trước (giữ khung đầu `attack`) > ra đòn (khung 1.. theo giờ kể từ lúc cast tắt hoặc từ lúc bộ đếm đòn thường đổi)
 * > trúng đòn (máu giảm) > đi > đứng. Khung chọn theo giờ trong trạng thái chứ không theo animation của Phaser nên đổi hướng giữa chừng
 * chỉ đổi hàng, giữ nguyên số khung (không nhảy về khung đầu). `walkScale` nhân nhịp đi (đuổi nhanh hơn lang thang), cộng dồn pha nên đổi tỉ lệ không giật.
 */
export function stepBeastAnim(st: BeastAnimState, layout: AnimLayout, now: number, moving: boolean, cast: boolean, hp: number, face: Dir8, walkScale = 1, atkN = -1):
  { frame: number; flip: boolean; state: AnimState } {
  if (st.cast && !cast) st.atk = now;
  // Đòn thường (#1059): bộ đếm `atk` của server đổi thì chạy một lượt dải ra đòn; lần đọc đầu chỉ ghi nhớ (không chạy bù).
  if (atkN >= 0 && st.atkN >= 0 && atkN !== st.atkN && !cast) st.atk = now;
  if (atkN >= 0) st.atkN = atkN;
  if (hp < st.hp) st.hit = now;
  st.cast = cast; st.hp = hp;
  if (moving) st.moveAt = now;
  const dt = Math.max(0, Math.min(250, now - st.last)); st.last = now;
  const { dir, flip } = animDir(face, layout);
  st.dir = dir;
  const A = layout.anims, since = now - st.atk, hitT = now - st.hit;
  let state: AnimState, i: number;
  if (cast) { state = "windup"; i = 0; }
  else if (since >= 0 && since < STRIKE_MS) {
    state = "attack"; i = 1; let t = since;
    for (const ms of ART_MS.attack) { if (t < ms) break; t -= ms; i++; }
  } else if (hitT >= 0 && hitT < HURT_MS) {
    state = "hurt"; i = hitT < ART_MS.hurt[0] ? 0 : 1;
  } else if (now - st.moveAt < ART_MS.walkHold) { state = "walk"; st.phase += dt * walkScale; i = Math.floor(st.phase / ART_MS.walk); i = A.walk.n ? i % A.walk.n : 0; }
  else { state = "idle"; st.phase += dt; i = Math.floor(st.phase / ART_MS.idle) % A.idle.n; }
  st.state = state;
  const anim: AnimName = state === "windup" || state === "attack" ? "attack" : state;
  return { frame: animFrame(layout, anim, dir, i), flip, state };
}

/** Hệ số giữ lại của quãng lao do code khi đã có khung `attack` vẽ lao: một nửa, giảm đều về 0 đúng lúc dải ra đòn hết (`sinceMs` kể từ lúc tung chiêu). */
export const lungeKeep = (sinceMs: number) => 0.5 * Math.max(0, 1 - sinceMs / STRIKE_MS);

/** Khung `die` theo giờ `t` (ms) kể từ lúc ngã; giữ khung cuối. Dùng cho bóng ngã của hồn thú vừa bị kết liễu. */
export const dieFrame = (layout: AnimLayout, dir: number, t: number) => animFrame(layout, "die", dir, Math.floor(Math.max(0, t) / ART_MS.die));
/** Thời gian (ms) chạy hết dải `die` tới khung cuối. */
export const dieMs = (layout: AnimLayout) => layout.anims.die.n * ART_MS.die;
