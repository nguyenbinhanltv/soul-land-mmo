// Phụ thể võ hồn tải theo nhu cầu (#716). Mỗi võ hồn hai sheet isometric 2304×1152 (nửa sau / nửa trước) kèm normal map: tải hết 25 võ hồn
// là 100 ảnh, ~1 GB điểm ảnh sau giải mã, chiếm phần lớn thời gian vào bản đồ (đo ở client/scripts/load-measure.mjs, docs/tech/tai-asset-vao-ban-do.md).
// Nên preloadSprites chỉ ghi spec vào đây; sheet được xin khi có người chơi dùng võ hồn đó (preload: những người đang trong phòng lúc vào;
// sau đó: lúc người mới tới / đổi võ hồn). Chưa tải xong thì nơi gọi chờ (không vẽ lớp phụ thể); tải lỗi hẳn thì dùng phụ thể vẽ bằng code
// như khi manifest không có ảnh (vohonTextures).
// Pháp tướng `pt_<mã>` (+ `_glow`, 2560×800, 35 ảnh; bước 2 của #716) cùng cơ chế: chỉ xin khi có người trong phòng đang Chân Thân (và sheet của
// chính mình, để cut-in có ảnh), không có normal map; chưa tải xong thì phapTuong.ts chưa dựng hình (không vẽ bản tạm để khỏi nháy).
// Hồn thú `beast_<loài>` (+ `_anim` nếu có; bước 3 của #716) cùng cơ chế: chỉ xin loài đang có hồn thú trong tầm (lúc vào: hồn thú đã trong state;
// sau đó: lúc hồn thú xuất hiện), nên chỉ tải loài của bản đồ đang vào + boss / thú vương / thú gọi ra; chưa tải xong thì ẩn sprite (không vẽ bản
// tạm bằng code để khỏi nháy).
// Hiệu ứng chiêu `fx_sk_<tên>` + lớp sáng `_g` (≈550 dải, 3,3 MB; bước 4 của #716) cùng cơ chế theo võ hồn: chỉ xin sheet chiêu của võ hồn đang có
// người dùng trong phòng (lớp sáng chỉ của chính mình, vì chiêu người khác không vẽ lớp sáng). Chưa tải xong thì chiêu rơi về hiệu ứng vẽ bằng code
// như khi manifest thiếu ảnh (SheetFx.play trả false); chỉ nhận chiêu khai trong SKILL_VISUAL, hiệu ứng khác (hệ, hợp thể) vẫn tải ngay.
import Phaser from "phaser";
import { PHAP_TUONG, VOHON } from "../../shared/data.ts";
import { attachNormal, lightingOn } from "./lighting.ts";
import { touchTexture } from "./textureLru.ts";
import { SKILL_VISUAL, type VisualSheet } from "./skillVisual.ts";

interface Spec { url: string; frame: readonly [number, number] }
const specs = new Map<string, Spec>();
/** Key tải lỗi hẳn (sau các lần thử lại của loader): coi như không có ảnh thật. */
const failed = new Set<string>();
/** Key đang xin theo từng scene (mỗi lần đổi bản đồ là scene mới nên không giữ qua scene). */
const pending = new WeakMap<Phaser.Scene, Set<string>>();

/** preloadSprites gọi cho mỗi `vh_*` / `pt_*` isometric trong manifest. */
export const registerVohonSheet = (key: string, url: string, frame: readonly [number, number]) => { specs.set(key, { url, frame }); };

/** Key `fx_sk_*` của chiêu từng võ hồn (thân, lớp sáng) suy từ SKILL_VISUAL; dựng một lần khi cần. */
let skillFxOf: Map<string, { body: string[]; glow: string[] }> | undefined;
let skillFxAll: Set<string> | undefined;
function skillFxTable() {
  if (!skillFxOf) {
    skillFxOf = new Map(); skillFxAll = new Set();
    for (const [k, v] of Object.entries(SKILL_VISUAL)) {
      const id = k.slice(0, k.indexOf(":"));
      const e = skillFxOf.get(id) ?? { body: [], glow: [] }; skillFxOf.set(id, e);
      for (const sh of [v.sheet, v.windupSheet, v.aftershock?.sheet] as (VisualSheet | undefined)[]) {
        if (!sh?.key.startsWith("fx_sk_")) continue;
        e.body.push(sh.key); skillFxAll.add(sh.key);
        if (sh.glow) { e.glow.push(sh.glow); skillFxAll.add(sh.glow); }
      }
    }
  }
  return skillFxOf;
}
/** preloadSprites hỏi: key `fx_sk_*` này do vohonLazy tải theo võ hồn (true) hay vẫn tải ngay như các hiệu ứng khác. */
export const isLazySkillFx = (key: string) => (skillFxTable(), skillFxAll!.has(key));

/** Nửa phụ thể trống hoàn toàn (manifest `"blank": true`, #974): không có file, không tải; nơi vẽ ẩn lớp đó. */
const blanks = new Set<string>();
/** preloadSprites gọi cho mỗi `vh_*` có `"blank": true` trong manifest. */
export const registerBlankSheet = (key: string) => { blanks.add(key); };
const vohonPair = (id: string): [string, string] => [`vh_${id}_b`, `vh_${id}_f`];
/** Nửa [sau, trước] của phụ thể võ hồn `id` là nửa trống (không có ảnh): nơi vẽ ẩn lớp đó. Cả hai trống thì không coi là trống (dùng bản vẽ code). */
export const vohonBlank = (id: string): [boolean, boolean] => {
  const [b, f] = vohonPair(id).map((k) => blanks.has(k));
  return b && f ? [false, false] : [b, f];
};
/** Nửa [sau, trước] của phụ thể hoạt ảnh vẽ thật `vhanim_{id}` là nửa trống (manifest `"blank": true`); nơi vẽ ẩn lớp đó (như vohonBlank). */
export const vohonAnimBlank = (id: string): [boolean, boolean] => {
  const [b, f] = [`vhanim_${id}_b`, `vhanim_${id}_f`].map((k) => blanks.has(k));
  return b && f ? [false, false] : [b, f];
};
/** Key sheet hoạt ảnh của võ hồn `id` có trong manifest (không trống, chưa lỗi); rỗng = võ hồn chưa có sheet mới (nhánh cũ). */
const phuAnimKeys = (id: string): string[] => {
  const [bb, fb] = vohonAnimBlank(id), ks = [`vhanim_${id}_b`, `vhanim_${id}_f`].filter((_, i) => !(i ? fb : bb));
  return ks.length && ks.every((k) => specs.has(k) && !failed.has(k)) ? ks : [];
};
/** Texture hai lớp phụ thể; nửa trống mượn texture của nửa kia (cùng kích thước / bố cục khung nên mọi phép tính khung giữ nguyên), vohonBlank báo ẩn. */
export const vohonKeys = (id: string): [string, string] => {
  const [kb, kf] = vohonPair(id), [bb, fb] = vohonBlank(id);
  return [bb ? kf : kb, fb ? kb : kf];
};

/** Việc làm thêm khi một sheet hồn thú vừa tới (sprites.ts đăng ký: dựng animation, đo thân; vohonLazy không import ngược sprites.ts). */
let onBeastSheet: ((scene: Phaser.Scene, key: string) => void) | undefined;
export const setBeastSheetHook = (f: (scene: Phaser.Scene, key: string) => void) => { onBeastSheet = f; };

/** Xử lý khi loader xong một đợt: sheet đã tới thì gắn normal map, sheet không tới thì đánh dấu lỗi để dùng bản vẽ bằng code. */
function settle(scene: Phaser.Scene) {
  const set = pending.get(scene);
  if (!set) return;
  for (const key of [...set]) {
    if (scene.textures.exists(key)) {
      if (key.startsWith("vh_") || key.startsWith("beast_")) attachNormal(scene, key);
      if (key.startsWith("beast_")) onBeastSheet?.(scene, key);
    }
    else failed.add(key);
    set.delete(key);
  }
}

/**
 * Xin phụ thể của võ hồn `id` (VOHON[i].id). Trả `"ready"` (đã có ảnh, của manifest hay vẽ bằng code), `"wait"` (đang tải, hỏi lại sau)
 * hoặc `"code"` (không có ảnh thật: nơi gọi dùng vohonTextures). `start`: gọi sau preload thì phải khởi động loader.
 */
export function wantVohon(scene: Phaser.Scene, id: string, start = true): "ready" | "wait" | "code" {
  const [bb, fb] = vohonBlank(id), pair = vohonPair(id), keys = pair.filter((_, i) => !(i ? fb : bb));
  const anim = phuAnimKeys(id); // sheet hoạt ảnh vẽ thật (Phụ thể v2): tải kèm sheet tĩnh; lỗi thì bỏ, võ hồn chạy nhánh cũ
  keys.forEach(touchTexture); anim.forEach(touchTexture);
  if (keys.every((k) => scene.textures.exists(k)) && anim.every((k) => scene.textures.exists(k))) return "ready";
  if (keys.some((k) => !specs.has(k) || failed.has(k))) return "code";
  queue(scene, keys, lightingOn(scene.game), start);
  queue(scene, anim, false, start);
  return "wait";
}

/** Xếp hàng tải các key chưa có / chưa xin trong scene này; `normals`: kèm `<key>_n`. */
function queue(scene: Phaser.Scene, keys: string[], normals: boolean, start: boolean) {
  let set = pending.get(scene);
  if (!set) { set = new Set(); pending.set(scene, set); scene.load.on(Phaser.Loader.Events.COMPLETE, () => settle(scene)); }
  let queued = false;
  for (const k of keys) {
    if (set.has(k) || scene.textures.exists(k)) continue;
    const s = specs.get(k)!;
    set.add(k); queued = true;
    scene.load.spritesheet(k, s.url, { frameWidth: s.frame[0], frameHeight: s.frame[1] });
    if (normals) scene.load.image(`${k}_n`, s.url.replace(/\.png$/, "_n.png"));
  }
  if (queued && start) scene.load.start();
}

/**
 * Xin sheet pháp tướng của võ hồn `id`: `"ready"` (đã có thân, lớp sáng có thì cũng đã tới), `"wait"` (đang tải), `"code"` (manifest không có
 * ảnh thật hoặc tải lỗi: dùng sheet tạm vẽ bằng code, ensurePtSheet). Lớp sáng `_glow` lỗi / không có thì bỏ, như khi manifest không ghi.
 */
export function wantPhapTuong(scene: Phaser.Scene, id: string, start = true): "ready" | "wait" | "code" {
  const def = PHAP_TUONG[id]; if (!def) return "code";
  const body = def.sheet, glow = `${body}_glow`;
  if (!specs.has(body) || failed.has(body)) return scene.textures.exists(body) ? "ready" : "code";
  const keys = [body, ...(specs.has(glow) && !failed.has(glow) ? [glow] : [])];
  keys.forEach(touchTexture);
  if (keys.every((k) => scene.textures.exists(k))) return "ready";
  queue(scene, keys, false, start);
  return "wait";
}

/**
 * Xin sheet hồn thú loài `species` (mã BEASTS): `"ready"` (đã có ảnh, bản tĩnh / hoạt ảnh đều tới), `"wait"` (đang tải: nơi gọi ẩn sprite), `"code"`
 * (manifest không có ảnh thật của loài hoặc tải lỗi: vẽ bằng code theo bậc như trước).
 */
export function wantBeast(scene: Phaser.Scene, species: string, start = true): "ready" | "wait" | "code" {
  const keys = [`beast_${species}`, `beast_${species}_anim`].filter((k) => specs.has(k) && !failed.has(k));
  if (!keys.length) return "code";
  keys.forEach(touchTexture);
  if (keys.every((k) => scene.textures.exists(k))) return "ready";
  queue(scene, keys, lightingOn(scene.game), start);
  return "wait";
}

/**
 * Xin sheet hiệu ứng chiêu của võ hồn `id` (không chặn, không ai chờ: chưa tới thì chiêu dùng hiệu ứng vẽ bằng code). `mine`: kèm lớp sáng `_g`.
 */
export function wantSkillFx(scene: Phaser.Scene, id: string, mine: boolean, start = true) {
  const e = skillFxTable().get(id); if (!e) return;
  const keys = [...new Set([...e.body, ...(mine ? e.glow : [])])].filter((k) => specs.has(k) && !failed.has(k));
  keys.forEach(touchTexture);
  queue(scene, keys, false, start);
}

/** Phụ thể của võ hồn thứ `i` trong VOHON (chỉ số server gửi ở `p.vh`; ngoài khoảng thì võ hồn đầu như vohonTextures). */
export const vohonIdAt = (i: number) => (VOHON[i] ?? VOHON[0]).id;
