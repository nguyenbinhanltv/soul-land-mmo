// Phân luồng dòng thông báo hệ thống của ô chat (#755, đợt 1c UI v2): thuần, không chạm DOM, test bằng node.
// Không đọc chữ tiếng Việt: mức quan trọng suy từ MÀU do nơi phát đặt (server `log(id, text, col)` và các lệnh `hud.log(text, col)` dùng
// cùng bảng màu cảnh báo / lỗi) và từ việc dòng có nút hành động; mọi dòng còn lại (nhặt đồ, kinh nghiệm, Hồn Tệ, tin tình hình) là
// "thường": vào lịch sử tab "Hệ thống", không chen vào dòng chat của tab Tất cả / Bản đồ… để khỏi che dòng người chơi nhắn.

/** Màu cảnh báo / lỗi đang dùng cho dòng hệ thống (khớp màu server và GameScene): cam cảnh báo, đỏ lỗi / nguy hiểm, đỏ cơ chế boss. Màu do DỮ LIỆU quyết định (hào quang boss) không nằm ở đây: nơi phát đánh dấu tường minh bằng `logImp`. */
const WARN_COLS: ReadonlySet<string> = new Set(["#ffb35c", "#ff8a8a", "#ff6b6b", "#ff9a8a", "#ff8a6a", "#ff6a5a", "#ff5a5a"]);

/** Dòng hệ thống quan trọng: lỗi / từ chối / cảnh báo (theo màu), hoặc có nút hành động (ví dụ "Thêm lại"). Quan trọng thì hiện ở mọi tab. */
export function sysImportant(col: string | undefined, hasAct = false): boolean {
  return hasAct || (!!col && WARN_COLS.has(col.toLowerCase()));
}

/** Hai dòng hệ thống giống hệt nhau trong chừng này ms thì gộp thành một dòng "×n" (nhặt cùng món liên tiếp, bấm lỗi lặp). */
export const SYS_MERGE_MS = 6000;

export interface SysLike { text: string; col?: string; at: number; n?: number; }

/** Dòng mới `l` có gộp được vào dòng liền trước `prev` (cùng chữ, cùng màu, đủ gần) không. */
export function canMerge(prev: SysLike | undefined, l: SysLike): boolean {
  return !!prev && prev.text === l.text && prev.col === l.col && l.at - prev.at <= SYS_MERGE_MS;
}

/** Chữ hiển thị của dòng có đếm gộp: "Nhặt Hồn Tệ ×3". */
export const mergedText = (text: string, n = 1): string => (n > 1 ? `${text} ×${n}` : text);

/** Biên nhận văn bản cũ đã có dòng nhận từ túi; chỉ bỏ các mẫu nhận thành công, không bỏ lỗi, nhiệm vụ hay thông báo đồ rơi. */
export function legacyLootReceipt(text: string): boolean {
  return /^Nhặt .+ vào túi đồ(?:[. (]|$)/u.test(text) || /^Nhận \d+ (?:Mảnh |Đá Cường Hóa )/u.test(text);
}

/**
 * Thu lịch sử: tối đa `keep` dòng; dòng thường (nhặt đồ…) chỉ được chiếm `keepSys` chỗ để không đẩy mất lịch sử chat và dòng quan trọng.
 * Sửa tại chỗ `hist`; trả về hist.
 */
export function trimHist<T extends { ch: string; imp?: boolean }>(hist: T[], keep: number, keepSys: number): T[] {
  const normal = (l: T) => l.ch === "sys" && !l.imp;
  let nNormal = hist.reduce((n, l) => n + (normal(l) ? 1 : 0), 0);
  while (nNormal > keepSys) { const i = hist.findIndex(normal); hist.splice(i, 1); nNormal--; }
  while (hist.length > keep) hist.shift();
  return hist;
}
