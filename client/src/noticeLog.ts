// Nhật ký thông báo (đợt 4b, Part of #885): phần thuần của `feedback.ts` (không CSS / DOM) để test bằng node. Loại toast và nhãn chữ ở đây.
/** Loại toast: nhãn nhỏ ở đầu dòng và màu vạch trái (đặt ở CSS theo `data-k`, màu niên hạn của đồ rơi theo `--c`). */
export type ToastKind = "loot" | "level" | "quest" | "boss" | "info";
export const NOTICE_LABEL: Record<ToastKind, string> = { loot: "Nhận", level: "Lên cấp", quest: "Nhiệm vụ", boss: "Boss", info: "Tin" };

/** Nhật ký thông báo (đợt 4b, kiểm kê UI/UX, thiếu #21): giữ `LOG_MAX` toast gần nhất để đọc lại ở hộp "Thông báo" của hub. Toast gộp "×n" cộng vào dòng cũ, không thêm dòng. */
export interface Notice { kind: ToastKind; title: string; sub: string; t: number; n: number }
export const LOG_MAX = 50;
const noticeList: Notice[] = [];
const noticeSubs = new Set<() => void>();
/** Mới nhất ở cuối. */
export const notices = (): readonly Notice[] => noticeList;
export function onNotices(fn: () => void): () => void { noticeSubs.add(fn); return () => { noticeSubs.delete(fn); }; }
export function clearNotices() { if (!noticeList.length) return; noticeList.length = 0; for (const f of [...noticeSubs]) f(); }
/** Ghi một toast vào nhật ký (`merged`: toast gộp ×n thì tăng đếm của dòng cùng loại + tiêu đề gần nhất). Xuất để test. */
export function logNotice(kind: ToastKind, title: string, sub: string, merged: boolean, t = Date.now()) {
  const last = merged ? [...noticeList].reverse().find((x) => x.kind === kind && x.title === title) : undefined;
  if (last) { last.n++; last.t = t; if (sub) last.sub = sub; }
  else { noticeList.push({ kind, title, sub, t, n: 1 }); if (noticeList.length > LOG_MAX) noticeList.splice(0, noticeList.length - LOG_MAX); }
  for (const f of [...noticeSubs]) f();
}
