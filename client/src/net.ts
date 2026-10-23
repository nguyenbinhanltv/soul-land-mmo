import type { Looks, QuestProgress, QuestStatus, ResEffect, AutoSettings, AutoSummary, SellSettings } from "../../shared/data.ts";
import type { BagDelta } from "../../shared/bagSync.ts";

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
/**
 * Tin riêng "world" (11.2, bảng bản đồ thế giới): bản đồ đang ở, truyền tống trận đang đứng (`cur`, "" = chỉ xem), Hồn Tệ, các cặp
 * bản đồ nối bằng cổng, mọi trận (đã mở chưa, phí từ bản đồ này; null = không tới được).
 */
export interface WorldMsg {
  map: string; cur: string; honTe: number; links: [string, string][];
  list: { key: string; map: string; label: string; open: boolean; fee: number | null }[];
}
/**
 * Tin riêng "auto" (mục 5.13): đang tự săn không, giây treo còn lại (phần còn của hôm nay cộng quỹ Ủy Thác Lệnh `bonus`), giây miễn
 * phí mỗi ngày, cài đặt (AutoSettings), lý do vừa dừng hoặc từ chối bật, tổng kết lượt vừa dừng (Auto 2).
 */
export interface AutoMsg { on: boolean; left: number; max: number; bonus: number; cfg: AutoSettings; why?: string; sum?: AutoSummary; }
export interface PortalInfo { name: string; to?: string; toName?: string; level?: [number, number] | null; warn?: boolean; boat?: number; }

/** Tin nhắn riêng "vohons": mọi võ hồn mình sở hữu, đội hình (rowId theo ô, 0 = trống) và võ hồn đang ra trận. Từ 8.1a `skills`: 4 ô
 *  hồn kỹ mang theo (chỉ số vòng theo ô U / I / O / P, -1 = trống; server đã áp mặc định loadoutOf). `fcd`: giây hồi chiêu Võ Hồn Dung
 *  Hợp Kỹ còn lại của hồn sư (#193, thiếu = dùng được). */
export interface OwnedVohons { active: number; team: number[]; list: { rowId: number; vohon: string; level: number; xp: number; stars: number; rings: number[]; skills: number[]; herbs?: Record<string, number> }[]; fcd?: number; }
/**
 * Tin nhắn riêng "squad": sinh lực từng võ hồn trong đội; `down` > 0 là võ hồn đã gục, còn ngần ấy giây ngoài trận nữa thì hồi.
 * `en`: năng lượng tiên cơ (0..TIEN_CO_MAX). `combat`: đang giao chiến (đồng hồ hồi dừng).
 */
export interface Squad { combat: boolean; list: { rowId: number; hp: number; maxHp: number; down: number; en: number }[]; }

/**
 * Một ô túi đồ trong tin "bag": `code` là mã trong ITEMS, `vohon` = vohons.id nếu đang gắn vào võ hồn (không chiếm ô túi), `lock`:
 * người chơi đã khoá (#216: không bán, bỏ, làm nguyên liệu).
 */
export interface BagItem { id: string; kind: string; code: string; qty: number; years: number | null; stars: number | null; enhance: number; stats: unknown; vohon: number | null; lock?: boolean; }
/** Một món thương nhân còn giữ để mua lại (9.8): `key` gửi lại trong `buyback {key}`, `price` là giá mỗi món đã nhận lúc bán. */
export interface BuybackItem { key: string; kind: string; code: string; qty: number; years: number | null; stars: number | null; enhance: number; stats: unknown; price: number; }
/** Một món đã tự bán (#216, lưu DB, AUTO_SELL_BUYBACK món mới nhất trước): mua lại như BuybackItem; `at` = lúc bán (ms). */
export interface SoldItem extends BuybackItem { at: number; }
/**
 * Tin nhắn riêng "bag": túi đồ, số ô tối đa (từ 9.8 theo tài khoản, mở rộng ở thương nhân), Hồn Tệ (đồng), số giây còn lại của hồi
 * chiêu chung đan và danh sách mua lại của thương nhân (9.8, mới nhất trước). Từ #216 bộ lọc tự bán `sell` và đồ tự bán gần nhất `sold`.
 */
/** Tin riêng "gear" (trang bị hồn sư, mục 5.15): món đang mặc (`slot` = chỉ số ô trong EQUIP_SLOTS) và chỉ số tổng server tính (equipStats). */
export interface GearItem { id: string; code: string; enhance: number; stats: unknown; slot: number; lock?: boolean; }
export interface GearMsg { items: GearItem[]; st: { bonus: Record<string, number>; weapon: { min: number; max: number } | null; red: number; luck: number }; }
export interface BagMsg { slots: number; honTe: number; cd: number; items: BagItem[]; buyback?: BuybackItem[]; sell?: SellSettings; sold?: SoldItem[]; }
/**
 * Tin riêng "bagd" (#215): túi đổi so với lần gửi trước (shared/bagSync.ts, áp bằng applyBagDelta lên tin "bag" đang có); số ô, Hồn
 * Tệ, hồi chiêu luôn có, danh sách mua lại chỉ khi đổi; bộ lọc tự bán và đồ tự bán (#216) cũng chỉ khi đổi (đi cùng nhau).
 */
export interface BagDeltaMsg extends BagDelta<BagItem> { slots: number; honTe: number; cd: number; buyback?: BuybackItem[]; sell?: SellSettings; sold?: SoldItem[]; }
/** Tin riêng "autosold" (#216): vừa tự bán `n` món (`slots` ô) được `coins` đồng. */
export interface AutoSoldMsg { n: number; coins: number; slots: number; }
/**
 * Tin nhắn riêng "quest" (6.2): tiến độ chuỗi tân thủ và trạng thái; `ev` = vừa nhận / vừa đủ mục tiêu / vừa trả (`done` = mã bước
 * vừa trả) / vừa xong cả chuỗi. Nội dung bài và phần thưởng đọc từ QUESTS.
 */
export interface QuestMsg extends QuestProgress { status: QuestStatus; ev?: "accept" | "ready" | "reward" | "finish"; done?: string; }
/**
 * Tin nhắn riêng "daily": khảo hạch hằng ngày của Phất Lan Đức ngày `day` (vnDay), mỗi bài một chuỗi `daily:<yyyymmdd>:<i>` (nội dung
 * suy từ mã bằng questChain); `ev` + `i` = bài vừa nhận / vừa đủ / vừa trả, hoặc vừa sang ngày mới (`reset`); `route`: bản đồ đích ->
 * bản đồ kề nên đi tới trước từ bản đồ đang đứng (chỉ đường trên bản đồ nhỏ).
 */
export interface DailyMsg {
  day: string; list: (QuestProgress & { status: QuestStatus })[]; ev?: "accept" | "ready" | "reward" | "reset"; i: number; route: Record<string, string>;
}
/**
 * Tin nhắn riêng "resonance" (cộng minh, bước 8.2): tiến độ `prog` và số mốc đã đạt `lv` từng trụ cột (thứ tự RESONANCE), tổng %
 * đang cộng cho mọi võ hồn. `ev`: mốc vừa đạt (`up`) hoặc vừa mất (tháo đồ), chỉ có khi đổi.
 */
export interface ResonanceMsg { prog: number[]; lv: number[]; bonus: Record<ResEffect, number>; ev?: { pillar: number; step: number; up: boolean }[]; }
/** Bảng xếp hạng công khai: không có accountId; `me` chỉ là dòng của chính mình. */
export interface ResonanceTopMsg {
  page: number; pageSize: number; total: number; hasNext: boolean;
  list: { name: string; score: number; milestones: number; me: boolean }[];
  me: { rank: number; score: number; milestones: number; progressBp: number; extraStars: number } | null;
}

/**
 * Tin nhắn riêng "party" (tổ đội người chơi, bước 7.1): `id` tổ đội (0 = chưa có; so với DropState.party để biết đồ rơi của đội),
 * thành viên theo thứ tự vào đội (trưởng nhóm, chính mình, `sid` = sessionId khi cùng phòng, bản đồ, cấp / võ hồn / sinh lực võ hồn
 * ra trận, `off` = đã rời game hoặc đang qua cổng) và lời mời đang chờ (tên người mời, giây còn lại).
 */
export interface PartyMember { name: string; leader: boolean; me: boolean; sid: string; map: string; ch: number; level: number; vh: number; hp: number; maxHp: number; dead: boolean; off: boolean; }
/** Tin riêng "channels" (mục 6 "Nhiều kênh"): kênh hiện tại và các kênh đang mở của bản đồ (số người, tối đa, đầy chưa). */
export interface ChannelsMsg { cur: number; list: { ch: number; n: number; max: number; full: boolean }[]; }
/**
 * Tin "chat" (#188): `ch` thiếu = chat bản đồ (cả thông báo "Hệ thống"); "party" / "world" / "tong" (#198): `name` là người gửi; "whisper": `name`
 * là người gửi, `to` là người nhận (người gửi cũng nhận một bản).
 */
export interface ChatMsg { name: string; text: string; ch?: "party" | "whisper" | "world" | "tong"; to?: string; }
export interface PartyView { id: number; max: number; members: PartyMember[]; invites: { name: string; secs: number }[]; }
/**
 * Tin riêng "friends" (#195): bạn bè theo thứ tự thêm (`mutual`: hai bên đã thêm nhau; `map` / `ch` chỉ có khi đã thêm nhau và người đó
 * đang trong game), tên người đã chặn. `added`: người vừa thêm mình (`back`: mình đã có người đó, không thì hiện nút "Thêm lại").
 */
export interface FriendsMsg { list: { name: string; mutual: boolean; map?: string; ch?: number }[]; blocks: string[]; added?: { name: string; back: boolean }; }

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
