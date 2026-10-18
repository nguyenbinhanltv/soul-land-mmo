// Địa chỉ server. Khi chạy dev (vite cổng 5173) -> server ở cổng 2567.
// Khi deploy chung một link, client và server cùng địa chỉ.
// Có thể ghi đè bằng biến môi trường VITE_SERVER_URL.
export const API: string = import.meta.env.VITE_SERVER_URL
  ?? (location.port === "5173" ? `${location.protocol}//${location.hostname}:2567` : location.origin);
export const WS = API.replace(/^http/, "ws");

export interface Character { accountId: number; name: string; vohon: number; innate: number; level: number; xp: number; rings: number[]; kills: number; }

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
