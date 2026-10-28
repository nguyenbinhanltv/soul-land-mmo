// Đồng hồ máy chủ cho các màn UI v2 (Xếp Hạng, Lịch Hoạt Động, Phúc Lợi): tin của server mang giờ lịch (`now`, ms); client chỉ giữ độ lệch để đếm lùi
// hiển thị. Giờ này KHÔNG dùng để quyết điều gì (ngày điểm danh, khung giờ mở đều do server tính).
let skew = 0;
/** Ghi nhận giờ server vừa nhận (ms). Số lạ thì bỏ qua. */
export function syncServerNow(ms: unknown) { if (typeof ms === "number" && Number.isFinite(ms)) skew = ms - Date.now(); }
/** Giờ server ước tính (ms). */
export const serverNow = () => Date.now() + skew;

const VN = { timeZone: "Asia/Ho_Chi_Minh", hour12: false } as const;
/** "HH:MM" giờ Việt Nam. */
export const hhmmVn = (ms: number) => new Intl.DateTimeFormat("vi-VN", { ...VN, hour: "2-digit", minute: "2-digit" }).format(ms);
