import type { Looks } from "../../shared/data.ts";

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
export interface PortalInfo { name: string; to?: string; toName?: string; level?: [number, number] | null; warn?: boolean; }

/** Tin nhắn riêng "vohons": mọi võ hồn mình sở hữu, đội hình (rowId theo ô, 0 = trống) và võ hồn đang ra trận. */
export interface OwnedVohons { active: number; team: number[]; list: { rowId: number; vohon: string; level: number; xp: number; stars: number; rings: number[] }[]; }
/**
 * Tin nhắn riêng "squad": sinh lực từng võ hồn trong đội; `down` > 0 là võ hồn đã gục, còn ngần ấy giây ngoài trận nữa thì hồi.
 * `en`: năng lượng tiên cơ (0..TIEN_CO_MAX). `combat`: đang giao chiến (đồng hồ hồi dừng).
 */
export interface Squad { combat: boolean; list: { rowId: number; hp: number; maxHp: number; down: number; en: number }[]; }

/** Một ô túi đồ trong tin "bag": `code` là mã trong ITEMS, `vohon` = vohons.id nếu đang gắn vào võ hồn (không chiếm ô túi). */
export interface BagItem { id: string; kind: string; code: string; qty: number; years: number | null; stars: number | null; enhance: number; stats: unknown; vohon: number | null; }
/** Tin nhắn riêng "bag": túi đồ, số ô tối đa, Hồn Tệ (đồng) và số giây còn lại của hồi chiêu chung đan. */
export interface BagMsg { slots: number; honTe: number; cd: number; items: BagItem[]; }

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
