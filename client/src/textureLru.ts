// Giới hạn texture file giữ qua các lần đổi bản đồ (#716 bước 6). Từ bước 5 Phaser.Game được giữ nên texture hồn thú / phụ thể / pháp tướng /
// hiệu ứng chiêu / ô nền / vật đứng đã tải ở lại bộ nhớ; tập đó hữu hạn nhưng có thể lên tới hàng trăm MB nếu đi hết bản đồ. Ở đây mỗi lần
// vào bản đồ là một "lượt"; texture nào được xin (`touchTexture`) thì ghi lượt hiện tại, lúc rời bản đồ texture không còn được xin trong
// KEEP_VISITS lượt gần nhất bị gỡ (xin lại thì tải lại từ cache HTTP). Texture của chính mình được xin lại mỗi lần vào nên không bị gỡ.
import type Phaser from "phaser";

/** Giữ texture dùng trong chừng này lượt vào bản đồ gần nhất (kể cả lượt vừa rời). */
export const KEEP_VISITS = 4;
const lastUsed = new Map<string, number>();
let visit = 0;

/** Ghi texture `key` (và normal map `<key>_n`) được dùng ở lượt này. */
export const touchTexture = (key: string) => { lastUsed.set(key, visit); };

/** Gọi khi rời bản đồ (scene đã gỡ): gỡ texture ngoài KEEP_VISITS lượt gần nhất, rồi sang lượt mới. Trả số key đã gỡ. */
export function evictStaleTextures(game: Phaser.Game): number {
  let n = 0;
  for (const [key, v] of lastUsed) {
    if (v > visit - KEEP_VISITS) continue;
    lastUsed.delete(key);
    for (const k of [key, `${key}_n`]) if (game.textures.exists(k)) { game.textures.remove(k); n++; }
  }
  visit++;
  return n;
}
