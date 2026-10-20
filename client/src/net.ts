import type { Looks, QuestProgress, QuestStatus } from "../../shared/data.ts";

// Địa chỉ server. Khi chạy dev (vite cổng 5173) -> server ở cổng 2567.
// Khi deploy chung một link, client và server cùng địa chỉ.
// Có thể ghi đè bằng biến môi trường VITE_SERVER_URL.
export const API: string = import.meta.env.VITE_SERVER_URL
  ?? (location.port === "5173" ? `${location.protocol}//${location.hostname}:2567` : location.origin);
export const WS = API.replace(/^http/, "ws");

/** Võ hồn đang ra trận. `vohon` là mã trong VOHON, `rings` là niên hạn (số năm) từng hồn hoàn. */
export interface Character { accountId: number; name: string; rowId: number; vohon: string; level: number; xp: number; stars: number; rings: number[]; kills: number; }

/** Ngoại hình hồn sư của tài khoản; `chosen` = đã tạo nhân vật (chỉ chọn một lần). */
export interface AccountLooks extends Looks { chosen: boolean; }
/** Trả về từ /api/login và /api/me: võ hồn ra trận (null = chưa thức tỉnh), ngoại hình và bản đồ đang đứng (do server lưu). */
export interface Me { character: Character | null; looks: AccountLooks; mapId: string; }

/** Tin nhắn riêng "portal": cổng đang đứng (name rỗng = không đứng ở cổng nào), cấp đề xuất, cảnh báo dưới cấp (chặn mềm). */
/** Hộp đi cổng (tin riêng `portal`); `boat` (BĐ6d): bến thuyền, số giây đi thuyền. */
export interface PortalInfo { name: string; to?: string; toName?: string; level?: [number, number] | null; warn?: boolean; boat?: number; }

/** Tin nhắn riêng "vohons": mọi võ hồn mình sở hữu, đội hình (rowId theo ô, 0 = trống) và võ hồn đang ra trận. Từ 8.1a `skills`: 4 ô
 *  hồn kỹ mang theo (chỉ số vòng theo ô U / I / O / P, -1 = trống; server đã áp mặc định loadoutOf). */
export interface OwnedVohons { active: number; team: number[]; list: { rowId: number; vohon: string; level: number; xp: number; stars: number; rings: number[]; skills: number[]; herbs?: Record<string, number> }[]; }
/**
 * Tin nhắn riêng "squad": sinh lực từng võ hồn trong đội; `down` > 0 là võ hồn đã gục, còn ngần ấy giây ngoài trận nữa thì hồi.
 * `en`: năng lượng tiên cơ (0..TIEN_CO_MAX). `combat`: đang giao chiến (đồng hồ hồi dừng).
 */
export interface Squad { combat: boolean; list: { rowId: number; hp: number; maxHp: number; down: number; en: number }[]; }

/** Một ô túi đồ trong tin "bag": `code` là mã trong ITEMS, `vohon` = vohons.id nếu đang gắn vào võ hồn (không chiếm ô túi). */
export interface BagItem { id: string; kind: string; code: string; qty: number; years: number | null; stars: number | null; enhance: number; stats: unknown; vohon: number | null; }
/** Một món thương nhân còn giữ để mua lại (9.8): `key` gửi lại trong `buyback {key}`, `price` là giá mỗi món đã nhận lúc bán. */
export interface BuybackItem { key: string; kind: string; code: string; qty: number; years: number | null; stars: number | null; enhance: number; stats: unknown; price: number; }
/**
 * Tin nhắn riêng "bag": túi đồ, số ô tối đa (từ 9.8 theo tài khoản, mở rộng ở thương nhân), Hồn Tệ (đồng), số giây còn lại của hồi
 * chiêu chung đan và danh sách mua lại của thương nhân (9.8, mới nhất trước).
 */
export interface BagMsg { slots: number; honTe: number; cd: number; items: BagItem[]; buyback?: BuybackItem[]; }
/**
 * Tin nhắn riêng "quest" (6.2): tiến độ chuỗi tân thủ và trạng thái; `ev` = vừa nhận / vừa đủ mục tiêu / vừa trả (`done` = mã bước
 * vừa trả) / vừa xong cả chuỗi. Nội dung bài và phần thưởng đọc từ QUESTS.
 */
export interface QuestMsg extends QuestProgress { status: QuestStatus; ev?: "accept" | "ready" | "reward" | "finish"; done?: string; }
/**
 * Tin nhắn riêng "resonance" (cộng minh, bước 8.2): tiến độ `prog` và số mốc đã đạt `lv` từng trụ cột (thứ tự RESONANCE), tổng %
 * đang cộng cho mọi võ hồn. `ev`: mốc vừa đạt (`up`) hoặc vừa mất (tháo đồ), chỉ có khi đổi.
 */
export interface ResonanceMsg { prog: number[]; lv: number[]; bonus: Record<"hp" | "mp" | "atk", number>; ev?: { pillar: number; step: number; up: boolean }[]; }

/**
 * Tin nhắn riêng "party" (tổ đội người chơi, bước 7.1): `id` tổ đội (0 = chưa có; so với DropState.party để biết đồ rơi của đội),
 * thành viên theo thứ tự vào đội (trưởng nhóm, chính mình, `sid` = sessionId khi cùng phòng, bản đồ, cấp / võ hồn / sinh lực võ hồn
 * ra trận, `off` = đã rời game hoặc đang qua cổng) và lời mời đang chờ (tên người mời, giây còn lại).
 */
export interface PartyMember { name: string; leader: boolean; me: boolean; sid: string; map: string; ch: number; level: number; vh: number; hp: number; maxHp: number; dead: boolean; off: boolean; }
/** Tin riêng "channels" (mục 6 "Nhiều kênh"): kênh hiện tại và các kênh đang mở của bản đồ (số người, tối đa, đầy chưa). */
export interface ChannelsMsg { cur: number; list: { ch: number; n: number; max: number; full: boolean }[]; }
export interface PartyView { id: number; max: number; members: PartyMember[]; invites: { name: string; secs: number }[]; }

export async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: "Server trả về dữ liệu lỗi." }));
  if (!r.ok) throw new Error(j.error ?? `Lỗi ${r.status}`);
  return j as T;
}

export const storage = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } },
};
