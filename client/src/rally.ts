// Dấu "Tập trung ở đây" của tổ đội (GAME_DESIGN.md mục 5.17, R6 #433): danh sách dấu đồng đội đặt, giữ ở mức trang (đi cổng dựng lại cảnh
// nhưng dấu vẫn còn tới khi hết `RALLY.secs`). Chỉ hiển thị: server là bên kiểm và chuyển tiếp (`rallyAction` ở MapRoom), hàm thuần ở shared/rally.ts.
import { rallyRead, rallyUpsert, rallyPrune, type Rally } from "../../shared/rally.ts";

let list: Rally[] = [];

/** Các dấu còn hiệu lực (mảng đang giữ, đừng sửa). */
export const getRallies = () => list;

/** Nhận tin `rally` từ server: dữ liệu lạ bỏ; mỗi người một dấu. Trả dấu vừa thêm (null nếu bỏ). */
export function addRally(m: unknown, now = Date.now()): Rally | null {
  const r = rallyRead(m); if (!r) return null;
  list = rallyUpsert(rallyPrune(list, now, null), r, now);
  return list[list.length - 1];
}

/** Bỏ dấu hết hạn và dấu của người đã rời tổ đội (`members` = tên các thành viên). Trả true nếu có đổi. */
export function pruneRallies(members: ReadonlySet<string> | null, now = Date.now()): boolean {
  const next = rallyPrune(list, now, members);
  if (next.length === list.length) return false;
  list = next; return true;
}

/** Xoá hết (đăng xuất / vào lại game). */
export function clearRallies() { list = []; }
