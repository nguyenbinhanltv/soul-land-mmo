// Mũi tên rìa màn chỉ hướng tới mục tiêu nhiệm vụ đang theo dõi (UI v2, kiểm kê UI #11; Part of #885). Chỉ hiển thị: GameScene đưa vào điểm mục tiêu
// đã tính sẵn cho bản đồ nhỏ (questTargets: NPC, vùng săn, cổng đi tiếp), không thêm tin server. Mục tiêu đang trong màn thì không vẽ mũi tên;
// ngoài màn thì mũi tên nằm trên khung chữ nhật (CSS đặt chừa chỗ cho các cột HUD) theo hướng từ tâm màn tới mục tiêu, kèm nhãn + khoảng cách
// (ô) để không chỉ truyền đạt bằng màu / hình. Hàm tính là hàm thuần để test bằng node.
import { isUi2 } from "./uiKit.ts";

export interface QPoint { /** tọa độ trên màn (cùng hệ với worldView của camera). */ x: number; y: number; /** loại mục tiêu để ghi nhãn. */ label: string; /** khoảng cách thế giới tới nhân vật, tính bằng ô. */ tiles: number }
export interface View { x: number; y: number; w: number; h: number }
export interface Arrow { /** vị trí trên khung 0..1 (trái→phải, trên→dưới). */ x: number; y: number; /** góc quay (độ) của mũi tên ▲ vẽ hướng lên: 0 = lên, 90 = phải. */ deg: number; label: string; tiles: number }

/** Điểm trong màn (kể cả sát mép `pad` theo tỉ lệ cạnh) thì coi là đang thấy: không cần mũi tên. */
export function inView(p: { x: number; y: number }, v: View, pad = 0.02): boolean {
  const fx = (p.x - v.x) / v.w, fy = (p.y - v.y) / v.h;
  return fx >= pad && fx <= 1 - pad && fy >= pad && fy <= 1 - pad;
}

/**
 * Giao của tia từ tâm khung (0,5; 0,5) hướng (dx, dy) với biên khung đơn vị [0,1]². dx = dy = 0 thì chỉ lên (tránh chia cho 0).
 * Kết quả: vị trí trên biên và góc quay (0 = lên, theo chiều kim đồng hồ).
 */
export function rimPoint(dx: number, dy: number): { x: number; y: number; deg: number } {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) return { x: 0.5, y: 0, deg: 0 };
  const k = 0.5 / Math.max(Math.abs(dx), Math.abs(dy));
  const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  return { x: 0.5 + dx * k, y: 0.5 + dy * k, deg };
}

/** Mục tiêu gần nhất (theo `tiles`) trong số các điểm ngoài màn; không còn điểm ngoài màn thì null. Ưu tiên hướng tới điểm gần nhất để mũi tên không nhảy. */
export function pickArrow(points: readonly QPoint[], v: View): Arrow | null {
  const out = points.filter((p) => !inView(p, v));
  if (!out.length || points.some((p) => inView(p, v))) return null;   // đã có mục tiêu trong màn thì không cần chỉ hướng
  const p = out.reduce((a, b) => (b.tiles < a.tiles ? b : a));
  const r = rimPoint(p.x - (v.x + v.w / 2), p.y - (v.y + v.h / 2));
  return { ...r, label: p.label, tiles: p.tiles };
}

/** Chữ nhãn: "Cổng → Rừng · 24 ô". */
export const arrowText = (a: Pick<Arrow, "label" | "tiles">) => `${a.label} · ${Math.max(1, Math.round(a.tiles))} ô`;

// ---- phần DOM ----
let el: HTMLElement | null = null, lastKey = "";
function ensure(): HTMLElement | null {
  if (!isUi2()) return null;
  if (el?.isConnected) return el;
  const hud = document.getElementById("hud"); if (!hud) return null;
  el = document.createElement("div"); el.id = "qarrow"; el.hidden = true; el.setAttribute("role", "img");
  el.innerHTML = `<div class="qa-pt"><i class="qa-ar" aria-hidden="true">▲</i><span class="qa-tx"></span></div>`;
  hud.appendChild(el);
  return el;
}
/** Đặt (hoặc ẩn, null) mũi tên. Chỉ ghi DOM khi giá trị đổi (gọi vài lần / giây). */
export function setQuestArrow(a: Arrow | null) {
  const e = ensure(); if (!e) return;
  const key = a ? `${a.x.toFixed(3)}|${a.y.toFixed(3)}|${Math.round(a.deg)}|${arrowText(a)}` : "";
  if (key === lastKey) return; lastKey = key;
  e.hidden = !a;
  if (!a) return;
  const pt = e.firstElementChild as HTMLElement, txt = arrowText(a);
  pt.style.left = `${a.x * 100}%`; pt.style.top = `${a.y * 100}%`;
  pt.style.setProperty("--qa-deg", `${Math.round(a.deg)}deg`);
  // nhãn nằm phía trong khung: cạnh phải thì lùi sang trái, cạnh dưới thì lên trên
  pt.dataset.x = a.x > 0.75 ? "r" : a.x < 0.25 ? "l" : "m"; pt.dataset.y = a.y > 0.75 ? "b" : "t";
  pt.querySelector(".qa-tx")!.textContent = txt;
  e.setAttribute("aria-label", `Mục tiêu nhiệm vụ: ${txt}`);
}
/** Gỡ mũi tên khi rời cảnh (đổi bản đồ, vào đấu trường). */
export function clearQuestArrow() { lastKey = ""; el?.remove(); el = null; }
