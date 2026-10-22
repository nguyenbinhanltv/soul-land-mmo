// Bảng nhận thưởng ủy thác offline (Auto 3, GAME_DESIGN.md mục 5.13 "Ủy thác offline"): server tính và cộng thưởng lúc vào game rồi
// gửi tin riêng `offline`; client chỉ hiển thị (khung giấy cuộn thủy mặc như bảng kết quả trận), nút "Nhận" đóng bảng.
import { autoTimeText, formatHonTe } from "../../shared/data.ts";

/**
 * Tin riêng "offline": vắng `away` giây, tính `secs` giây (quỹ giờ treo chung với tự săn), đã săn `used` giây; bản đồ, vùng; số hồn thú
 * hạ được và số con quá sức bỏ qua; kinh nghiệm gốc (trước khi chia cho đội), Hồn Tệ, vật phẩm đã vào túi; giờ treo còn lại (phần còn
 * của hôm nay cộng quỹ Ủy Thác Lệnh `bonus`) / giờ miễn phí mỗi ngày; `bonusUsed`: giây đã lấy từ quỹ Ủy Thác Lệnh (Auto 2);
 * `stop`: lý do dừng sớm (túi đầy, vùng quá sức, hết giờ treo).
 */
export interface OfflineMsg {
  away: number; secs: number; used: number; map: string; zone: string; kills: number; weak: number; xp: number; coins: number;
  items: { name: string; qty: number }[]; left: number; max: number; bonus?: number; bonusUsed?: number; stop?: string;
}

const box = () => document.querySelector<HTMLElement>("#offline");

/** Hiện bảng nhận thưởng (null = đóng). */
export function showOffline(m: OfflineMsg | null) {
  const el = box(); if (!el) return;
  el.innerHTML = "";
  el.hidden = !m; if (!m) return;
  const add = (tag: string, text: string, cls = "") => { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; el.appendChild(e); return e; };
  add("h2", "Ủy thác trở về");
  add("div", `${m.zone} · ${m.map}`, "oline omuted");
  add("div", `Vắng mặt ${autoTimeText(m.away)}: tính ${autoTimeText(m.secs)} treo, đã săn ${autoTimeText(m.used)}.`, "oline");
  add("div", `Hạ ${m.kills.toLocaleString("vi-VN")} hồn thú${m.weak ? ` (bỏ qua ${m.weak.toLocaleString("vi-VN")} con quá sức)` : ""}.`, "oline");
  add("div", `Kinh nghiệm: ${m.xp.toLocaleString("vi-VN")} (chia cho đội như khi săn) · Hồn Tệ: ${formatHonTe(m.coins)}`, "oline orew");
  if (m.items.length) {
    const ul = document.createElement("ul"); ul.className = "oitems";
    for (const it of m.items) { const li = document.createElement("li"); li.textContent = `${it.qty} × ${it.name}`; ul.appendChild(li); }
    el.appendChild(ul);
  } else add("div", "Không có vật phẩm.", "oline omuted");
  if (m.stop) add("div", `Dừng sớm: ${m.stop}.`, "oline ostop");
  if (m.bonusUsed) add("div", `Đã dùng ${autoTimeText(m.bonusUsed)} từ Ủy Thác Lệnh sau khi hết giờ miễn phí.`, "oline omuted");
  add("small", `Giờ treo còn lại: ${autoTimeText(m.left)}${m.bonus ? ` (trong đó ${autoTimeText(m.bonus)} từ Ủy Thác Lệnh)` : ""}; mỗi ngày ${autoTimeText(m.max)} miễn phí, chung với tự săn.`, "rnote");
  const row = document.createElement("div"); row.className = "brow";
  const b = document.createElement("button"); b.type = "button"; b.className = "buse absorb"; b.textContent = "Nhận";
  b.addEventListener("click", () => { b.blur(); showOffline(null); }); row.appendChild(b);
  el.appendChild(row);
}
