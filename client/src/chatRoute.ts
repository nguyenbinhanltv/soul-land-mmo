// Phân luồng dòng thông báo hệ thống của ô chat (#755, đợt 1c UI v2): thuần, không chạm DOM, test bằng node.
// Mức quan trọng suy từ màu / nút hành động. Dòng thường hiện ở Hệ thống / Tất cả khi bộ lọc bật (#1462).
// Chỉ các helper biên nhận cuối file đọc mẫu văn bản cũ để tránh trùng với dữ liệu nhận từ túi; không dùng chữ để suy độ hiếm.

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

const COIN_AMOUNT = String.raw`\d[\d.]* (?:kim|ngân|đồng)(?: \d[\d.]* (?:kim|ngân|đồng))*`;
/** Log hạ quái vẫn giữ tên / đóng góp / đồ rơi; tiền đã có dòng cộng tổng từ túi riêng. Không đụng lỗi hay nhiệm vụ. */
export function lootLogText(text: string): string {
  if (!text.startsWith("Hạ ")) return text;
  return text.replace(new RegExp(`, nhận ${COIN_AMOUNT} Hồn Tệ\\.`, "u"), ".")
    .replace(new RegExp(` Nhận ${COIN_AMOUNT} Hồn Tệ\\.`, "u"), "");
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
