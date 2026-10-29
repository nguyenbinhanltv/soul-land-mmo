// Trợ năng (#600, Part of #877): cỡ chữ UI 3 mức, chế độ mù màu (thêm hình / chữ, không chỉ màu), giảm chuyển động toàn cục, bảng phím tắt.
// Chỉ hiển thị ở client, lưu localStorage (`shh-a11y-v1`), không đụng server hay số cân bằng. Không import Phaser để test bằng node.
// Cỡ chữ đặt lớp `a11y-fs-1/2` lên body (ui2-settings.css đổi --fs-s/m/l); mù màu đặt `a11y-cb`. Giảm chuyển động dùng lớp `reduce-motion` trên <html>
// có sẵn của combatFx (theo `fxPrefs.reduce`, mặc định theo hệ điều hành); ui2-settings.css mở rộng ra mọi hoạt ảnh.
import type { Element } from "./audio/soundMap.ts";

/** Tên hệ ngắn (trùng ELEMENT_NAME ở skillFx.ts; chép lại để không kéo Phaser vào mô-đun này). */
const ELEMENT_NAME_VI: Record<Element, string> = { fire: "Hỏa", ice: "Băng", lightning: "Lôi", poison: "Độc", light: "Quang", dark: "Ám", wood: "Mộc", wind: "Phong" };

/** Cỡ chữ UI: 0 Chuẩn (1×), 1 Lớn (1,25×), 2 Rất lớn (1,5×). */
export type FontSize = 0 | 1 | 2;
export const FONT_SIZES: readonly { v: FontSize; label: string; k: number }[] = [
  { v: 0, label: "Chuẩn", k: 1 }, { v: 1, label: "Lớn", k: 1.25 }, { v: 2, label: "Rất lớn", k: 1.5 },
];
export interface A11yPrefs { font: FontSize; colorblind: boolean }

export const A11Y_STORAGE_KEY = "shh-a11y-v1";
const store = (): Storage | null => { try { return window.localStorage; } catch { return null; } };

export function readA11yPrefs(): A11yPrefs {
  const def: A11yPrefs = { font: 0, colorblind: false };
  try {
    const raw = JSON.parse(store()?.getItem(A11Y_STORAGE_KEY) ?? "null");
    if (raw && typeof raw === "object") return { font: raw.font === 1 || raw.font === 2 ? raw.font : 0, colorblind: raw.colorblind === true };
  } catch { /* bản lưu hỏng: dùng mặc định */ }
  return def;
}
let prefs: A11yPrefs = readA11yPrefs();
export const a11yPrefs = (): A11yPrefs => ({ ...prefs });

/** Lớp body theo tuỳ chọn (tách riêng để test không cần DOM). */
export function a11yClasses(p: A11yPrefs): string[] {
  return [...(p.font ? [`a11y-fs-${p.font}`] : []), ...(p.colorblind ? ["a11y-cb"] : [])];
}
const ALL_CLASSES = ["a11y-fs-1", "a11y-fs-2", "a11y-cb"];

/** Áp lên body; gọi lại sau mỗi lần đổi. */
export function applyA11y(): void {
  const cl = typeof document === "undefined" ? null : document.body?.classList;
  if (!cl) return;
  cl.remove(...ALL_CLASSES);
  cl.add(...a11yClasses(prefs));
}
export function setA11yPrefs(patch: Partial<A11yPrefs>): void {
  prefs = { ...prefs, ...patch };
  try { store()?.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs)); } catch { /* localStorage có thể bị khóa */ }
  applyA11y();
}

/** Ký hiệu hình cho 5 bậc niên hạn (trắng → đỏ), dùng thay / cùng màu: ○ △ □ ◇ ★. */
export const TIER_GLYPHS = ["○", "△", "□", "◇", "★"] as const;
export const tierGlyph = (tier: number): string => TIER_GLYPHS[Math.max(0, Math.min(TIER_GLYPHS.length - 1, Math.floor(tier)))];
/** Tiền tố chữ cho tên hồn thú / vật phẩm khi bật mù màu; tắt thì rỗng (chuỗi cũ không đổi). */
export const cbTierMark = (tier: number): string => (prefs.colorblind ? `${tierGlyph(tier)} ` : "");
/** Nhãn hệ ngắn ("Hỏa", "Băng"…) đi kèm màu hệ khi bật mù màu. */
export const cbElementMark = (el: Element | undefined): string => (prefs.colorblind && el ? `[${ELEMENT_NAME_VI[el]}] ` : "");

/** Phím tắt đang chạy ở GameScene.ts (khối `keydown`) + hud (SKILL_KEYS / BONE_SKILL_KEYS / AVA_KEY / FUSION_KEY). Bảng hiển thị; đổi phím chưa hỗ trợ. */
export interface KeyRow { code: string; key: string; action: string }
export const KEY_GROUPS: readonly { title: string; rows: readonly KeyRow[] }[] = [
  { title: "Di chuyển và đánh", rows: [
    { code: "Arrow", key: "W A S D / ←↑↓→", action: "Di chuyển" },
    { code: "KeyJ", key: "J / Space", action: "Đánh thường" },
    { code: "KeyE", key: "E", action: "Nhặt đồ" },
    { code: "KeyF", key: "F", action: "Vào cổng / nói chuyện NPC / mở bản đồ thế giới" },
    { code: "Tab", key: "Tab", action: "Đổi mục tiêu" },
    { code: "KeyY", key: "Y", action: "Tự đi tới cờ" },
    { code: "KeyT", key: "T", action: "Tự săn bật / tắt" },
  ] },
  { title: "Kỹ năng", rows: [
    { code: "KeyU", key: "U I O P", action: "Hồn kỹ vòng 1–4" },
    { code: "KeyZ", key: "Z X C", action: "Kỹ năng hồn cốt" },
    { code: "KeyR", key: "R", action: "Võ Hồn Chân Thân" },
    { code: "KeyG", key: "G", action: "Võ Hồn Dung Hợp Kỹ" },
    { code: "Digit1", key: "1–4", action: "Đổi võ hồn trong đội hình" },
  ] },
  { title: "Bảng và bản đồ", rows: [
    { code: "KeyH", key: "H", action: "Nhân vật" },
    { code: "KeyB", key: "B", action: "Túi" },
    { code: "KeyV", key: "V", action: "Võ Hồn / Đội hình" },
    { code: "KeyK", key: "K", action: "Cộng minh" },
    { code: "KeyL", key: "L", action: "Bạn bè" },
    { code: "KeyM", key: "M", action: "Bản đồ thế giới" },
    { code: "KeyN", key: "N", action: "Bản đồ khu vực" },
    { code: "BracketLeft", key: "[ ]", action: "Chuyển tab ở bảng Nhân vật" },
    { code: "Enter", key: "Enter", action: "Mở khung chat" },
    { code: "Escape", key: "Esc", action: "Đóng bảng trên cùng / bỏ khoá mục tiêu / mở menu" },
  ] },
];
