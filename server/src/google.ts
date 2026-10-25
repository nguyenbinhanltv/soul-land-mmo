// Đăng nhập Google (SSO, #612): xác minh ID token của Google Identity Services và vé ngắn hạn cho bước chọn tên nhân vật.
// Định danh là `sub` (cố định); không lưu email, tên hay token Google, và không ghi chúng vào log.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

export const GOOGLE = "google";
/** Vé chọn tên có hiệu lực 10 phút (đủ để gõ tên, ngắn để vé lộ ra không dùng được lâu). */
const TICKET_TTL_MS = 10 * 60_000;

/** Client ID công khai (không phải bí mật), client đọc qua GET /api/config. Trống = tắt đăng nhập Google. */
export const googleClientId = () => process.env.GOOGLE_CLIENT_ID?.trim() || null;

/** Bộ kiểm giả (token `test:<sub>[:tên gợi ý]`): CHỈ khi GAME_TEST=1 và không phải production. Ở prod luôn tắt dù ai đặt cờ. */
export const fakeVerifierOn = () => process.env.GAME_TEST === "1" && process.env.NODE_ENV !== "production";
/** Đăng nhập Google có dùng được không (có Client ID, hoặc đang ở bộ kiểm giả). */
export const googleEnabled = () => !!googleClientId() || fakeVerifierOn();

let client: OAuth2Client | undefined;
export type GoogleUser = { sub: string; name: string };

/**
 * Xác minh `credential` (ID token JWT). Thành công: { sub, name gợi ý }. Lỗi: { error } thông báo chung (không lộ lý do chi tiết).
 * Kiểm chữ ký, iss, aud (= GOOGLE_CLIENT_ID), exp (thư viện) và email_verified.
 */
export async function verifyGoogle(credential: unknown): Promise<GoogleUser | { error: string }> {
  if (typeof credential !== "string" || credential.length < 8 || credential.length > 4096) return { error: "Mã đăng nhập Google không hợp lệ." };
  if (fakeVerifierOn() && credential.startsWith("test:")) {
    const [, sub, name] = credential.split(":");
    return sub && /^[\w-]{1,64}$/.test(sub) ? { sub: `test-${sub}`, name: name ?? "" } : { error: "Mã đăng nhập Google không hợp lệ." };
  }
  const id = googleClientId();
  if (!id) return { error: "Máy chủ chưa bật đăng nhập Google." };
  try {
    client ??= new OAuth2Client();
    const p = (await client.verifyIdToken({ idToken: credential, audience: id })).getPayload();
    if (!p?.sub || !p.email_verified) return { error: "Tài khoản Google chưa xác minh email." };
    return { sub: p.sub, name: p.name ?? "" };
  } catch {
    return { error: "Mã đăng nhập Google không hợp lệ hoặc đã hết hạn." };
  }
}

// ---------- Vé chọn tên ----------
// Khoá ký: GOOGLE_TICKET_SECRET (đặt khi chạy nhiều tiến trình để vé do tiến trình này cấp, tiến trình kia kiểm được); thiếu thì ngẫu nhiên mỗi
// lần khởi động (vé cũ hỏng khi khởi động lại, người chơi bấm Google lại là xong).
const secret = process.env.GOOGLE_TICKET_SECRET || randomBytes(32).toString("hex");
const sign = (body: string) => createHmac("sha256", secret).update(body).digest("base64url");

/** Vé ký bằng server, chỉ chứa `sub` và hạn dùng (không email, không tên). */
export function makeTicket(sub: string, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ s: sub, e: now + TICKET_TTL_MS })).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** `sub` trong vé còn hạn và chữ ký đúng; sai / hết hạn thì null. */
export function readTicket(ticket: unknown, now = Date.now()): string | null {
  if (typeof ticket !== "string" || ticket.length > 1024) return null;
  const [body, mac, extra] = ticket.split(".");
  if (!body || !mac || extra !== undefined) return null;
  const want = Buffer.from(sign(body)), got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { s?: unknown; e?: unknown };
    return typeof p.s === "string" && typeof p.e === "number" && p.e > now ? p.s : null;
  } catch { return null; }
}
