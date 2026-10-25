// Tùy chọn hiệu ứng lưu ở localStorage (khóa `soul-land-fx-v1`, G1 #392): một chỗ đọc / ghi / mặc định / kiểu cho cả combatFx, arenaShow, sprites.
// Không import Phaser để mô-đun nhẹ nào cũng dùng được. Bản lưu hỏng hoặc thiếu trường thì dùng mặc định.
import type { HaoQuangMode } from "../../shared/data.ts";
import { FX_DEFAULT_LEVEL, normalizeFxLevel } from "./combatFeelRules.ts";

export type FxLevel = "low" | "mid" | "high";
/** Rung màn hình (#437): Tắt (không rung / giật), Chỉ boss (mặc định: tinh anh trở lên, chiêu mạnh vào mình, hồn kỹ lớn), Đầy đủ (thêm chí mạng lên hồn thú thường, trừ khi tự săn). */
export type ShakeMode = "off" | "boss" | "full";
export interface FxPrefs { level: FxLevel; reduce: boolean; shake: ShakeMode; cine: boolean; cutin: boolean; halo: HaoQuangMode; hideHat: boolean; /** Tự hạ mức hiệu ứng khi FPS thấp (H8 #491); chỉ hạ, không nâng quá mức người chơi chọn. */ auto: boolean }

export const FX_STORAGE_KEY = "soul-land-fx-v1";
const store = (): Storage | null => { try { return window.localStorage; } catch { return null; } };
/** Hệ điều hành bật "giảm chuyển động" (mặc định của `reduce` khi chưa lưu). */
export const prefersReduce = (): boolean => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

export function defaultFxPrefs(): FxPrefs {
  return { level: FX_DEFAULT_LEVEL, reduce: prefersReduce(), shake: "boss", cine: true, cutin: true, halo: "halo", hideHat: false, auto: true };
}

/** Đọc tùy chọn đã lưu, trường nào thiếu / sai kiểu thì lấy mặc định. */
export function readFxPrefs(): FxPrefs {
  const def = defaultFxPrefs();
  try {
    const raw = JSON.parse(store()?.getItem(FX_STORAGE_KEY) ?? "null");
    if (raw && typeof raw === "object") return { level: normalizeFxLevel(raw.level), reduce: typeof raw.reduce === "boolean" ? raw.reduce : def.reduce, shake: raw.shake === "off" || raw.shake === "full" ? raw.shake : "boss", cine: typeof raw.cine === "boolean" ? raw.cine : true, cutin: typeof raw.cutin === "boolean" ? raw.cutin : true, halo: raw.halo === "feet" || raw.halo === "old" ? raw.halo : "halo", hideHat: raw.hideHat === true, auto: raw.auto !== false }; // bản lưu cũ không có `shake` → Chỉ boss
  } catch { /* hỏng thì dùng mặc định */ }
  return def;
}

export function writeFxPrefs(p: FxPrefs): void {
  try { store()?.setItem(FX_STORAGE_KEY, JSON.stringify(p)); } catch { /* localStorage có thể bị khóa */ }
}
