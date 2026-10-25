// Phụ thể võ hồn tải theo nhu cầu (#716). Mỗi võ hồn hai sheet isometric 2304×1152 (nửa sau / nửa trước) kèm normal map: tải hết 25 võ hồn
// là 100 ảnh, ~1 GB điểm ảnh sau giải mã, chiếm phần lớn thời gian vào bản đồ (đo ở client/scripts/load-measure.mjs, docs/tech/tai-asset-vao-ban-do.md).
// Nên preloadSprites chỉ ghi spec vào đây; sheet được xin khi có người chơi dùng võ hồn đó (preload: những người đang trong phòng lúc vào;
// sau đó: lúc người mới tới / đổi võ hồn). Chưa tải xong thì nơi gọi chờ (không vẽ lớp phụ thể); tải lỗi hẳn thì dùng phụ thể vẽ bằng code
// như khi manifest không có ảnh (vohonTextures).
import Phaser from "phaser";
import { VOHON } from "../../shared/data.ts";
import { attachNormal, lightingOn } from "./lighting.ts";

interface Spec { url: string; frame: readonly [number, number] }
const specs = new Map<string, Spec>();
/** Key tải lỗi hẳn (sau các lần thử lại của loader): coi như không có ảnh thật. */
const failed = new Set<string>();
/** Key đang xin theo từng scene (Game bị huỷ mỗi lần đổi bản đồ nên không giữ qua scene). */
const pending = new WeakMap<Phaser.Scene, Set<string>>();

/** preloadSprites gọi cho mỗi `vh_*` isometric trong manifest. */
export const registerVohonSheet = (key: string, url: string, frame: readonly [number, number]) => { specs.set(key, { url, frame }); };

export const vohonKeys = (id: string): [string, string] => [`vh_${id}_b`, `vh_${id}_f`];

/** Xử lý khi loader xong một đợt: sheet đã tới thì gắn normal map, sheet không tới thì đánh dấu lỗi để dùng bản vẽ bằng code. */
function settle(scene: Phaser.Scene) {
  const set = pending.get(scene);
  if (!set) return;
  for (const key of [...set]) {
    if (scene.textures.exists(key)) attachNormal(scene, key);
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
  let set = pending.get(scene);
  if (!set) { set = new Set(); pending.set(scene, set); scene.load.on(Phaser.Loader.Events.COMPLETE, () => settle(scene)); }
  const normals = lightingOn(scene.game);
  let queued = false;
  for (const k of keys) {
    if (set.has(k) || scene.textures.exists(k)) continue;
    const s = specs.get(k)!;
    set.add(k); queued = true;
    scene.load.spritesheet(k, s.url, { frameWidth: s.frame[0], frameHeight: s.frame[1] });
    if (normals) scene.load.image(`${k}_n`, s.url.replace(/\.png$/, "_n.png"));
  }
  if (queued && start) scene.load.start();
  return "wait";
}

/** Phụ thể của võ hồn thứ `i` trong VOHON (chỉ số server gửi ở `p.vh`; ngoài khoảng thì võ hồn đầu như vohonTextures). */
export const vohonIdAt = (i: number) => (VOHON[i] ?? VOHON[0]).id;
