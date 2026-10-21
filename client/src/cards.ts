// Thẻ võ hồn (bước 10.8, GAME_DESIGN.md mục 5.11 "Chân dung và thẻ võ hồn", phong cách D lưu ly): khung card_{sr,ssr,ur} 96×152 theo
// độ hiếm, chân dung 64×64 trong cửa sổ, huy hiệu hệ góc trên trái, sao, hàng hồn hoàn màu niên hạn, tên; tấm biển dưới đáy ghi cấp.
// Dùng ở bảng đội hình, mảnh võ hồn và lễ thức tỉnh. Màu, tên, hệ, độ hiếm, số sao tối đa đọc từ shared/data.ts; chỉ hiển thị.
import { TIERS, HE, MAX_STARS, tierOfYears, type VoHonDef } from "../../shared/data.ts";
import { artUrl } from "./uiArt.ts";

export interface CardOpts {
  /** Cấp võ hồn (ghi trên tấm biển); không có thì ghi độ hiếm. */ level?: number;
  /** Số sao (★ vàng, ☆ còn thiếu tới MAX_STARS); không có thì không vẽ hàng sao. */ stars?: number;
  /** Số năm từng hồn hoàn (chấm màu theo bậc niên hạn). */ rings?: readonly number[];
  /** Ô đội hình 1–4 (ấn son nhỏ góc trên phải). */ slot?: number;
  /** Đang ra trận: viền sáng màu võ hồn. */ active?: boolean;
  /** Chưa sở hữu (mảnh võ hồn chưa đủ): thẻ xám. */ locked?: boolean;
  /** Thay chữ trên tấm biển. */ plate?: string;
}

/** Màu chấm hồn hoàn theo bậc (bậc đen dùng `glow` tím để thấy trên nền tối, như vòng dưới chân). */
const ringDot = (t: number) => (t === 3 ? TIERS[3].glow : TIERS[t].col);

/**
 * Tạo thẻ võ hồn `def` (thẻ là `<button>` khi `tag` = "button"). Thiếu ảnh khung / chân dung (manifest chưa có) thì vẽ thẻ bằng CSS
 * với chấm màu võ hồn, cùng bố cục. Tên võ hồn gán bằng textContent.
 */
export function vohonCard(def: VoHonDef, o: CardOpts = {}, tag: "button" | "div" = "div") {
  const el = document.createElement(tag);
  if (el instanceof HTMLButtonElement) el.type = "button";
  const rar = def.rarity.toLowerCase(), frame = artUrl(`card_${rar}`), pic = artUrl(`portrait_${def.id}`), he = artUrl(`he_${def.he}`);
  el.className = `vcardx r-${rar}` + (frame ? "" : " noart") + (o.active ? " active" : "") + (o.locked ? " locked" : "");
  el.style.setProperty("--c", def.col);
  el.innerHTML = `<i class="cbg"></i>${pic ? `<img class="cpt" src="${pic}" alt="" draggable="false">` : `<i class="cpt dot"></i>`}`
    + `${frame ? `<img class="cfr" src="${frame}" alt="" draggable="false">` : ""}`
    + `${he ? `<img class="che" src="${he}" alt="" draggable="false">` : `<i class="che">${HE[def.he].name[0]}</i>`}`
    + `<span class="cst"></span><span class="crg"></span><b class="cnm"></b><span class="cpl"></span>`
    + (o.slot ? `<i class="csl">${o.slot}</i>` : "");
  el.querySelector(".cnm")!.textContent = def.name;
  el.querySelector(".cpl")!.textContent = o.plate ?? (o.level ? `Cấp ${o.level}` : def.rarity);
  if (o.stars) {
    const st = el.querySelector(".cst")!, on = document.createElement("b");
    on.textContent = "★".repeat(o.stars); st.append(on, "☆".repeat(Math.max(0, MAX_STARS - o.stars)));
  }
  const rg = el.querySelector(".crg")!;
  for (const y of o.rings ?? []) { const d = document.createElement("i"); d.style.background = ringDot(tierOfYears(y)); rg.appendChild(d); }
  const parts = [`${def.name}, ${def.rarity}, ${HE[def.he].name}`];
  if (o.level) parts.push(`cấp ${o.level}`);
  if (o.stars) parts.push(`${o.stars} sao`);
  if (o.rings?.length) parts.push(`${o.rings.length} hồn hoàn`);
  if (o.slot) parts.push(`ô ${o.slot}`);
  if (o.active) parts.push("đang ra trận");
  if (o.locked) parts.push("chưa mở");
  el.setAttribute("aria-label", parts.join(", "));
  return el;
}
