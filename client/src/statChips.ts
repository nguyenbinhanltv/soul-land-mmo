// Chip thông tin ở cột chỉ số trái (tối ưu HUD, PR3; docs/design/giao-dien.md "Cột trái chỉ còn trạng thái"): võ hồn đang ra trận (icon hệ, hệ, số sao)
// và Hồn Tệ. Chỉ hiển thị từ tin riêng có sẵn (`vohons`, `bag`); không thêm tin server, không tính gì. Chip hồn hoàn / Tự động do hudBar.ts / hudMisc.ts.
import { VOHON, HE, honTeParts, formatHonTe } from "../../shared/data.ts";
import { artImg } from "./uiArt.ts";
import type { OwnedVohons } from "./net.ts";

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
let lastVh = "";

/** Chip võ hồn ra trận: icon hệ (`he_*`, thiếu ảnh thì chữ cái đầu của hệ), hệ, số sao; tên đầy đủ ở chú thích (tên đã ở cạnh avatar). */
export function setVhChip(data: OwnedVohons) {
  const chip = byId("vhChip"), row = data.list.find((v) => v.rowId === data.active), def = row && VOHON.find((d) => d.id === row.vohon);
  if (!chip) return;
  chip.hidden = !def;
  if (!def || !row) return;
  const he = HE[def.he], key = `${def.id}|${row.stars}`;
  if (key === lastVh) return; lastVh = key;
  chip.querySelector<HTMLElement>(".chip-ico")!.innerHTML = artImg(`he_${def.he}`, "chip-he") || he.name.slice(0, 1);
  chip.querySelector<HTMLElement>(".chip-txt")!.textContent = `${he.name} · ${row.stars}★`;
  chip.title = `${def.name}\nHệ ${he.name} · ${row.stars} sao\nVõ hồn đang ra trận (bấm để mở bảng Võ Hồn)`;
  chip.setAttribute("aria-label", `${def.name}, hệ ${he.name}, ${row.stars} sao`);
}

let lastCoin = -1;
/** Chip Hồn Tệ: hai đơn vị lớn nhất cho gọn ("1 kim 20 ngân"), đủ số ở chú thích. */
export function setCoinChip(dong: number) {
  const chip = byId("coinChip"); if (!chip || dong === lastCoin) return; lastCoin = dong;
  chip.querySelector<HTMLElement>(".chip-txt")!.textContent = honTeParts(dong).slice(0, 2).map((p) => `${p.n.toLocaleString("vi-VN")} ${p.unit}`).join(" ");
  chip.title = `Hồn Tệ\n${formatHonTe(dong)}`;
  chip.setAttribute("aria-label", `Hồn Tệ: ${formatHonTe(dong)}`);
  chip.hidden = false;
}
