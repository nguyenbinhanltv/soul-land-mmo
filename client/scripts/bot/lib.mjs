// Tiện ích chung của bài bot (#703): bot-test.mjs (bộ chạy + bảng nhóm) và các nhóm trong bot/<nhóm>.mjs cùng dùng.
// Biến toàn cục cũ (API, RUN, PASS, đếm lỗi) nằm ở đây và được export; đếm lỗi đọc qua failCount() vì không export được `let` ghi đè.
import { randomUUID } from "node:crypto";

export const API = process.env.SERVER_URL ?? "http://localhost:2567", WS = API.replace(/^http/, "ws");
export const post = async (p, b) => { const r = await fetch(API + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); return { status: r.status, ...await r.json() }; };
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const waitFor = async (fn, ms = 2000) => { for (let t = 0; t < ms; t += 50) { if (fn()) return true; await sleep(50); } return false; };
// Mật khẩu bot sinh ngẫu nhiên mỗi lần chạy (không ghi cứng trong mã); tên bot kèm hậu tố lần chạy nên luôn là tài khoản mới.
export const PASS = randomUUID(), RUN = Date.now().toString(36).slice(-5);

let fails = 0;
/** Ghi một kiểm tra: in ✓ / ✗ và cộng số lỗi. */
export const ok = (cond, msg) => { console.log(cond ? "  ✓" : "  ✗", msg); if (!cond) fails++; };
/** Số kiểm tra thất bại tới lúc này (đọc mã thoát / dòng tổng kết). */
export const failCount = () => fails;
