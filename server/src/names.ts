import { RESERVED_NAMES } from "../../shared/data.ts";

// Chuẩn hóa tên tài khoản. Chỗ DUY NHẤT quyết định hai tên có phải cùng một tài khoản hay không:
// db.ts (tìm/tạo tài khoản) và ratelimit.ts (bộ đếm đăng nhập sai) đều dùng nameKey, nên không thể lệch nhau.

/** Tên hiển thị: chuẩn hóa NFKC (chữ full-width "Ｔａｍ" -> "Tam", dấu tổ hợp -> chữ dựng sẵn) và cắt khoảng trắng hai đầu.
 *  Giữ nguyên hoa/thường như người dùng gõ. */
export const cleanName = (name: string) => name.normalize("NFKC").trim();

/**
 * Khóa so sánh tên: NFKC rồi mới đổi chữ thường, để mọi cách viết của cùng một tên (full-width, dựng sẵn/tổ hợp,
 * hoa/thường) ra cùng một khóa. Gộp thêm hai chỗ toLowerCase của JS cho kết quả khác thường gặp:
 * "İ" -> "i" + dấu chấm tổ hợp (gộp về "i"), "Σ" cuối từ -> "ς" (gộp về "σ").
 * Khóa được tính trong JS rồi lưu vào accounts.name_key, không dùng lower() của Postgres (phụ thuộc collation).
 * ĐỔI HÀM NÀY = đổi tài khoản nào trùng tài khoản nào: phải có migration tính lại name_key cho tài khoản cũ.
 */
export const nameKey = (name: string) =>
  cleanName(name).toLowerCase().replace(/i̇/g, "i").replace(/ς/g, "σ");

/** Khóa so tên cấm: nameKey, bỏ dấu (đ -> d), bỏ dấu cách và "_": "HỆ  Thống", "he_thong", "Ｓystem" ra cùng khóa với tên trong RESERVED_NAMES. */
const reservedKey = (name: string) => nameKey(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[ _]/g, "");
const RESERVED_KEYS = new Set(RESERVED_NAMES.map(reservedKey)); // map-co-dinh: dựng một lần từ RESERVED_NAMES (danh sách cố định trong shared/data.ts)
/** Tên có trùng tên cấm (RESERVED_NAMES) không. Chỉ dùng cho tên MỚI (tạo tài khoản); tài khoản cũ trùng tên không bị đổi. */
export const isReservedName = (name: string) => RESERVED_KEYS.has(reservedKey(name));
