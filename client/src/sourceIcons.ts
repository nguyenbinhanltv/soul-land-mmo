// Icon phân loại có sẵn của bộ menu Hub (#1585) cho nguồn Thư và nhóm bảng Xếp Hạng (#1599). Chỉ hiển thị: ảnh trang trí, nhãn chữ giữ nguyên.
import { MAIL_KINDS } from "../../shared/data.ts";
import { menuIconUrl } from "./uiIcons.ts";

/** Nguồn thư (khoá `MAIL_KINDS`) -> khoá icon menu; nguồn khác / mặc định "Hệ thống" dùng icon Thư. */
export const MAIL_KIND_ICON: Record<string, string> = { welfare: "gi_menu_welfare", bicanh: "gi_menu_bicanh", gm: "gi_menu_mail" };
/** Nhóm bảng Xếp Hạng (`group` của server / `legacyBoards`) -> khoá icon menu; nhóm lạ thì không icon. */
export const RANK_GROUP_ICON: Record<string, string> = { "Người chơi": "gi_menu_char", "Đấu trường": "gi_menu_arena", "Tông môn": "gi_menu_friends" };

/** Icon theo tên người gửi hiện trên thư (server gửi `MAIL_KINDS[kind]`, mặc định "Hệ thống"). */
export function mailFromIconKey(from: string): string {
  const kind = Object.keys(MAIL_KINDS).find((k) => MAIL_KINDS[k] === from);
  return (kind && MAIL_KIND_ICON[kind]) || "gi_menu_mail";
}
export const mailFromIcon = (from: string) => menuIconUrl(mailFromIconKey(from)) ?? undefined;
export const rankGroupIcon = (group: string) => { const k = RANK_GROUP_ICON[group]; return (k && menuIconUrl(k)) || undefined; };
