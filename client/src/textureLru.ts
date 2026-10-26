// Giới hạn texture file giữ qua các lần đổi bản đồ (#716 bước 6). Từ bước 5 Phaser.Game được giữ nên texture hồn thú / phụ thể / pháp tướng /
// hiệu ứng chiêu / ô nền / vật đứng đã tải ở lại bộ nhớ; tập đó hữu hạn nhưng có thể lên tới hàng trăm MB nếu đi hết bản đồ. Ở đây mỗi lần
// vào bản đồ là một "lượt"; texture nào được xin (`touchTexture`) thì ghi lượt hiện tại, lúc rời bản đồ texture không còn được xin trong
// KEEP_VISITS lượt gần nhất bị gỡ (xin lại thì tải lại từ cache HTTP). Texture của chính mình được xin lại mỗi lần vào nên không bị gỡ.
// Thêm trần theo byte (#1062): sheet hồn thú `_anim` 4–35 MB mỗi loài (cả `_n`) nên 4 lượt có thể lên ~400 MB; vượt MAX_BYTES thì gỡ tiếp
// texture cũ nhất, không đụng texture của lượt vừa rời (bản đồ đang dùng: scene mới xin lại ngay sau đó) nên trần là trần mềm.
import type Phaser from "phaser";

/** Giữ texture dùng trong chừng này lượt vào bản đồ gần nhất (kể cả lượt vừa rời). */
export const KEEP_VISITS = 4;
/** Trần điểm ảnh ước tính (w×h×4, gồm `_n`) của texture file được theo dõi; không phải số cân bằng gameplay. */
export const MAX_BYTES = 192 * 1024 * 1024;
const lastUsed = new Map<string, number>();
let visit = 0;

/** Ghi texture `key` (và normal map `<key>_n`) được dùng ở lượt này. */
export const touchTexture = (key: string) => { lastUsed.set(key, visit); };

/** Byte điểm ảnh ước tính của texture `key` và `<key>_n` đang có. */
function texBytes(game: Phaser.Game, key: string): number {
  let b = 0;
  for (const k of [key, `${key}_n`]) {
    if (!game.textures.exists(k)) continue;
    const src = game.textures.get(k).source[0];
    if (src) b += src.width * src.height * 4;
  }
  return b;
}

/**
 * Gọi khi rời bản đồ (scene đã gỡ): gỡ texture ngoài KEEP_VISITS lượt gần nhất, rồi nếu tổng vẫn quá MAX_BYTES thì gỡ tiếp từ lượt cũ nhất
 * (trừ lượt vừa rời), rồi sang lượt mới. Trả số key đã gỡ.
 */
export function evictStaleTextures(game: Phaser.Game): number {
  let n = 0;
  const drop = (key: string) => {
    lastUsed.delete(key);
    for (const k of [key, `${key}_n`]) if (game.textures.exists(k)) { game.textures.remove(k); n++; }
  };
  for (const [key, v] of lastUsed) if (v <= visit - KEEP_VISITS) drop(key);
  const sizes = new Map<string, number>();
  let total = 0;
  for (const key of [...lastUsed.keys()]) {
    const b = texBytes(game, key);
    if (!b) { lastUsed.delete(key); continue; }
    sizes.set(key, b); total += b;
  }
  if (total > MAX_BYTES) {
    const old = [...lastUsed].filter(([, v]) => v < visit).sort((a, b) => a[1] - b[1]);
    for (const [key] of old) {
      if (total <= MAX_BYTES) break;
      total -= sizes.get(key)!; drop(key);
    }
  }
  visit++;
  return n;
}
