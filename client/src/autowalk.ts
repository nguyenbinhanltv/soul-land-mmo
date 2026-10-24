// Cờ "Đi tới" (GAME_DESIGN.md mục 5.17, R4 #431): trạng thái của cờ và thanh cờ dưới radar. Chỉ hiển thị và giữ ý định của người chơi;
// GameScene lái hướng đi (cùng đường `input` như bấm chuột), server vẫn tính vị trí, va chạm và cổng. Module sống qua đổi bản đồ
// (GameScene dựng lại mỗi bản đồ) nên chuyến đi xuyên cổng tiếp tục ở bản đồ mới.
import { MAPS } from "../../shared/data.ts";

/** Cờ: `map` là bản đồ đích; `tx`, `ty` là ô (null = chỉ cần tới bản đồ đó); `on` = đang tự đi. */
export interface Flag { map: string; tx: number | null; ty: number | null; name: string; on: boolean;
  /** Đã xin qua cổng: bản đồ sau (cảnh dựng lại) tiếp tục chuyến đi; mất kết nối / thoát ra thì không tự đi lại. */ cross: boolean }

let flag: Flag | null = null;
let onGo: () => void = () => {}, onStop: () => void = () => {}, onClear: () => void = () => {};
const el = (id: string) => document.getElementById(id) as HTMLElement | null;

export const getFlag = () => flag;
export const mapName = (id: string) => MAPS[id]?.name ?? id;

/** GameScene gắn một lần mỗi cảnh: bấm Đi / Dừng / Xoá trên thanh cờ. */
export function bindFlagBar(go: () => void, stop: () => void, clear: () => void) {
  onGo = go; onStop = stop; onClear = clear;
  for (const [id, fn] of [["flagGo", () => onGo()], ["flagStop", () => onStop()], ["flagClear", () => onClear()]] as const) {
    const b = el(id); if (!b || b.dataset.bound) continue; b.dataset.bound = "1";
    b.addEventListener("click", () => { b.blur(); fn(); });
  }
}

/** Đặt / đổi / xoá cờ (null) rồi vẽ lại thanh cờ. */
export function setFlag(f: Flag | null) { flag = f; renderFlagBar(); }
export function patchFlag(p: Partial<Flag>) { if (flag) { flag = { ...flag, ...p }; renderFlagBar(); } }

/** Thanh cờ dưới radar: tên đích, nút Đi (chưa đi) / Dừng (đang đi), nút xoá. Ẩn khi không có cờ. */
export function renderFlagBar() {
  const bar = el("flagBar"); if (!bar) return;
  bar.hidden = !flag;
  if (!flag) return;
  const txt = el("flagText")!;
  txt.textContent = flag.on ? `Đang đi tới ${flag.name}…` : `Cờ: ${flag.name}`;
  el("flagGo")!.hidden = flag.on; el("flagStop")!.hidden = !flag.on;
}
