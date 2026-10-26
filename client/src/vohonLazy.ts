// Phụ thể võ hồn tải theo nhu cầu (#716). Mỗi võ hồn hai sheet isometric 2304×1152 (nửa sau / nửa trước) kèm normal map: tải hết 25 võ hồn
// là 100 ảnh, ~1 GB điểm ảnh sau giải mã, chiếm phần lớn thời gian vào bản đồ (đo ở client/scripts/load-measure.mjs, docs/tech/tai-asset-vao-ban-do.md).
// Nên preloadSprites chỉ ghi spec vào đây; sheet được xin khi có người chơi dùng võ hồn đó (preload: những người đang trong phòng lúc vào;
// sau đó: lúc người mới tới / đổi võ hồn). Chưa tải xong thì nơi gọi chờ (không vẽ lớp phụ thể); tải lỗi hẳn thì dùng phụ thể vẽ bằng code
// như khi manifest không có ảnh (vohonTextures).
// Pháp tướng `pt_<mã>` (+ `_glow`, 2560×800, 35 ảnh; bước 2 của #716) cùng cơ chế: chỉ xin khi có người trong phòng đang Chân Thân (và sheet của
// chính mình, để cut-in có ảnh), không có normal map; chưa tải xong thì phapTuong.ts chưa dựng hình (không vẽ bản tạm để khỏi nháy).
// Hồn thú `beast_<loài>` (+ `_anim` nếu có; bước 3 của #716) cùng cơ chế: chỉ xin loài đang có hồn thú trong tầm (lúc vào: hồn thú đã trong state;
// sau đó: lúc hồn thú xuất hiện), nên chỉ tải loài của bản đồ đang vào + boss / thú vương / thú gọi ra; chưa tải xong thì ẩn sprite (không vẽ bản
// tạm bằng code để khỏi nháy). `_anim` lỗi lần đầu thì tải ngay sheet tĩnh hiển thị tạm, `_anim` thử lại nền (#1084).
// Hiệu ứng chiêu `fx_sk_<tên>` + lớp sáng `_g` (≈550 dải, 3,3 MB; bước 4 của #716) cùng cơ chế theo võ hồn: chỉ xin sheet chiêu của võ hồn đang có
// người dùng trong phòng (lớp sáng chỉ của chính mình, vì chiêu người khác không vẽ lớp sáng). Chưa tải xong thì chiêu rơi về hiệu ứng vẽ bằng code
// như khi manifest thiếu ảnh (SheetFx.play trả false); chỉ nhận chiêu khai trong SKILL_VISUAL, hiệu ứng khác (hệ, hợp thể) vẫn tải ngay.
import Phaser from "phaser";
import { PHAP_TUONG, VOHON } from "../../shared/data.ts";
import { attachNormal, lightingOn } from "./lighting.ts";
import { touchTexture } from "./textureLru.ts";
import { FILE_RETRY } from "./loaderRetry.ts";
import { SKILL_VISUAL, type VisualSheet } from "./skillVisual.ts";

interface Spec { url: string; frame: readonly [number, number] }
const specs = new Map<string, Spec>();
/** Key tải lỗi hẳn (sau các lần thử lại của loader): coi như không có ảnh thật. */
const failed = new Set<string>();
/** Sheet hoạt ảnh `beast_<loài>_anim` đã lỗi lần đầu (đang thử lại nền): trong lúc chờ, wantBeast dùng sheet tĩnh cùng loài làm dự phòng (#1084). */
const slow = new Set<string>();
/**
 * Theo từng scene: `_anim` đã lỗi lần đầu và được loader bỏ để không giữ đợt tải (deferRetry; `first`), và những key đó chờ đợt tải xong
 * (`requeue`): chưa phải lỗi hẳn, wantBeast xin lại nền một lần nữa (lần đó thử lại đủ backoff rồi mới tính lỗi hẳn). Theo scene (không theo module)
 * để bản đồ mới lại bỏ lần lỗi đầu của preload, không bị giữ ~27 s.
 */
const defers = new WeakMap<Phaser.Scene, { first: Set<string>; requeue: Set<string> }>();
const deferOf = (scene: Phaser.Scene) => { let d = defers.get(scene); if (!d) defers.set(scene, d = { first: new Set(), requeue: new Set() }); return d; };
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

/**
 * Một file vừa tới (Phaser FILE_COMPLETE): gắn normal map, dựng khung / đo thân ngay, không chờ cả đợt xong (COMPLETE chỉ tới khi file chậm nhất, kể cả
 * file đang thử lại ~27 s, xong). `<key>_n` tới sau sheet thì gắn normal ở đây.
 */
function arrive(scene: Phaser.Scene, file: string) {
  const key = file.replace(/_n$/, "");
  if (!pending.get(scene)?.has(key) || !scene.textures.exists(key)) return;
  if (key.startsWith("vh_") || key.startsWith("beast_")) attachNormal(scene, key);
  if (file === key && key.startsWith("beast_")) onBeastSheet?.(scene, key);
}

/** Xử lý khi loader xong một đợt: sheet đã tới thì bỏ khỏi hàng chờ, sheet không tới thì đánh dấu lỗi để dùng bản vẽ bằng code. */
function settle(scene: Phaser.Scene) {
  const set = pending.get(scene);
  if (!set) return;
  const d = deferOf(scene);
  for (const key of [...set]) {
    if (scene.textures.exists(key)) slow.delete(key);
    else if (!d.requeue.delete(key)) failed.add(key); // `_anim` bị loader bỏ lần đầu (deferRetry) chưa là lỗi hẳn: wantBeast xin lại nền
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
  if (!set) {
    set = new Set(); pending.set(scene, set);
    scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, (file: string) => arrive(scene, file));
    scene.load.on(Phaser.Loader.Events.COMPLETE, () => settle(scene));
    scene.load.on(FILE_RETRY, (f: { key: string; deferRetry?: boolean }) => beastStaticFallback(scene, f));
  }
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
 * Hoạt ảnh hồn thú `beast_<loài>_anim` lỗi lần đầu (còn ~27 s thử lại): tải ngay sheet tĩnh cùng loài để hiển thị tạm, `_anim` vẫn thử lại nền và thay khi tới (#1084).
 * Lần đầu loader bỏ `_anim` ngay (deferRetry: đợt tải, và preload của scene, không bị giữ ~27 s); wantBeast xin lại `_anim` nền khi đợt tải xong,
 * lần hai thử lại đủ backoff, lỗi hẳn mới bỏ. Mỗi file tới là xử lý ngay (arrive), không chờ tin COMPLETE của cả đợt (đang giữ bởi `_anim` thử lại).
 */
function beastStaticFallback(scene: Phaser.Scene, file: { key: string; deferRetry?: boolean }) {
  const animKey = file.key, m = /^beast_([a-z_]+)_anim$/.exec(animKey), stat = m && `beast_${m[1]}`;
  if (!stat || !specs.has(animKey) || !specs.has(stat) || failed.has(stat)) return;
  slow.add(animKey);
  const d = deferOf(scene);
  if (!d.first.has(animKey)) { d.first.add(animKey); d.requeue.add(animKey); file.deferRetry = true; }
  queue(scene, [stat], lightingOn(scene.game), true);
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
 * Xin sheet hồn thú loài `species` (mã BEASTS): `"ready"` (đã có ảnh: hoạt ảnh nếu có, không thì bản tĩnh), `"wait"` (đang tải: nơi gọi ẩn sprite), `"code"`
 * (manifest không có ảnh thật của loài hoặc tải lỗi: vẽ bằng code theo bậc như trước).
 */
export function wantBeast(scene: Phaser.Scene, species: string, start = true): "ready" | "wait" | "code" {
  // Có hoạt ảnh vẽ thật thì không tải sheet tĩnh cùng loài (syncBeastSprite ưu tiên anim; #1062); anim không có / tải lỗi hẳn thì rơi về sheet tĩnh.
  // Anim lỗi lần đầu (slow, #1084): sheet tĩnh hiện tạm ngay, anim vẫn thử lại nền và thay khi tới.
  const anim = `beast_${species}_anim`, stat = `beast_${species}`, animOk = specs.has(anim) && !failed.has(anim), statOk = specs.has(stat) && !failed.has(stat);
  if (animOk && scene.textures.exists(anim)) { touchTexture(anim); return "ready"; }
  const key = statOk && (!animOk || slow.has(anim)) ? stat : animOk ? anim : "";
  if (!key) return "code";
  touchTexture(key);
  if (key === stat && animOk) queue(scene, [anim], lightingOn(scene.game), start);
  if (scene.textures.exists(key)) return "ready";
  queue(scene, [key], lightingOn(scene.game), start);
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
