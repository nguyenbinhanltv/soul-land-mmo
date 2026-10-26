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
import Phaser from "phaser";
import { PHAP_TUONG, VOHON } from "../../shared/data.ts";
import { attachNormal, lightingOn } from "./lighting.ts";

interface Spec { url: string; frame: readonly [number, number] }
const specs = new Map<string, Spec>();
/** Key tải lỗi hẳn (sau các lần thử lại của loader): coi như không có ảnh thật. */
const failed = new Set<string>();
/** Key đang xin theo từng scene (Game bị huỷ mỗi lần đổi bản đồ nên không giữ qua scene). */
const pending = new WeakMap<Phaser.Scene, Set<string>>();

/** preloadSprites gọi cho mỗi `vh_*` / `pt_*` isometric trong manifest. */
export const registerVohonSheet = (key: string, url: string, frame: readonly [number, number]) => { specs.set(key, { url, frame }); };

export const vohonKeys = (id: string): [string, string] => [`vh_${id}_b`, `vh_${id}_f`];

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
  const keys = vohonKeys(id);
  if (keys.every((k) => scene.textures.exists(k))) return "ready";
  if (keys.some((k) => !specs.has(k) || failed.has(k))) return "code";
  queue(scene, keys, lightingOn(scene.game), start);
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
  if (keys.every((k) => scene.textures.exists(k))) return "ready";
  queue(scene, keys, lightingOn(scene.game), start);
  return "wait";
}

/** Phụ thể của võ hồn thứ `i` trong VOHON (chỉ số server gửi ở `p.vh`; ngoài khoảng thì võ hồn đầu như vohonTextures). */
export const vohonIdAt = (i: number) => (VOHON[i] ?? VOHON[0]).id;
