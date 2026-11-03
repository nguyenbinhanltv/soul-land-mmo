// Lễ thức tỉnh và tạo nhân vật (docs/design/vo-hon-doi-hinh.md "Lễ thức tỉnh"; #702, miền E8a): hai hàm mức module gọi từ `/api/awaken` và `/api/looks` ở `index.ts` TRƯỚC khi vào phòng,
// không phụ thuộc `MapRoom` (chỉ `store` + số liệu `shared/data.ts`). Nguyên văn từ MapRoom; không đổi mã lỗi / thứ tự kiểm / hai lần `Math.random` khi roll hồn lực. Đổi ngoại hình ở thợ may (`changeLooks`) vẫn ở MapRoom (miền E8b).
import { AWAKEN_GIFT, AWAKEN_CHOICES, AWAKEN_LEVEL, parseNewLooks } from "../../../shared/data.ts";
import { store, type Character, type AccountLooks } from "../db.ts";

/** Tài khoản chưa có võ hồn: tặng Lam Ngân Thảo + 1 võ hồn SSR tự chọn. Hồn lực bẩm sinh do server roll. */
export async function awakenAccount(accountId: number, name: string, choice: unknown):
  Promise<{ character: Character } | { status: number; error: string }> {
  const pick = AWAKEN_CHOICES.find((v) => v.id === choice);
  if (!pick) return { status: 400, error: "Hãy chọn một võ hồn SSR trong danh sách." };
  // Tạo nhân vật diễn ra ngay trước bước chọn SSR của lễ thức tỉnh.
  if (!(await store.getLooks(accountId)).chosen) return { status: 409, error: "Hãy tạo nhân vật trước lễ thức tỉnh." };
  // Hồn lực bẩm sinh (1 đến AWAKEN_LEVEL.max) thuộc về hồn sư: làm cấp khởi đầu của cả hai võ hồn.
  const level = Math.random() < AWAKEN_LEVEL.maxChance ? AWAKEN_LEVEL.max : 1 + Math.floor(Math.pow(Math.random(), AWAKEN_LEVEL.curve) * (AWAKEN_LEVEL.max - 1));
  const character = await store.awaken(accountId, name, [AWAKEN_GIFT, pick.id], pick.id, level);
  if (!character) return { status: 409, error: "Tài khoản đã thức tỉnh võ hồn rồi." };
  return { character };
}

/** Tạo nhân vật (một lần): client gửi ngoại hình LPC (Mẫu dựng sẵn / Tự tạo); preset kiểu cũ (client cũ) được đổi sang LPC gần nhất (HL2 #571, parseNewLooks). */
export async function chooseLooks(accountId: number, body: unknown):
  Promise<{ looks: AccountLooks } | { status: number; error: string }> {
  const looks = parseNewLooks(body);
  if (!looks) return { status: 400, error: "Ngoại hình không hợp lệ." };
  if (!(await store.chooseLooks(accountId, looks))) return { status: 409, error: "Bạn đã chọn ngoại hình rồi, không đổi được nữa." };
  return { looks: { ...looks, chosen: true, changes: 0 } };
}
