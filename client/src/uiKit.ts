// UI Kit v2, lớp token (P5 #883, theo dõi #877; docs/art/ui-kit.md mục "Lớp token ui2"):
// - cờ `ui2`: `?ui=2` bật và lưu localStorage, `?ui=0` tắt; bật thì `body.ui2`. TẮT mặc định, tắt thì không đổi gì ở giao diện hiện tại;
// - mảnh kit `ui2_<tên>` trong manifest (do `ui:cut` xuất: bản 2× và 1×, vạch 9-slice `nine.x2` / `nine.x1`) thành biến CSS
//   `--ui2-<tên>` (ảnh), `--ui2-<tên>-nine` (vạch cắt, tính bằng điểm ảnh của bản đang dùng), `--ui2-<tên>-bw` (độ dày viền CSS = vạch / hệ số kit);
// - bản 2× khi `--u` × DPR ≥ 2, ngược lại bản 1× (khuyến nghị cỡ kit ở docs); chưa có mảnh thì không đặt biến và không thêm lớp
//   `ui2-k-<tên>` lên body, helper khung ở ui2.css không áp, phần tử giữ kiểu cũ.
// Hàm thuần (không đụng DOM) để test bằng node; phần DOM ở cuối tệp.
import { assetUrl } from "./assetUrl.ts";

const FLAG_KEY = "shh-ui2";

/** Cờ từ chuỗi truy vấn: "2" bật, "0" tắt, khác thì null (giữ giá trị đã lưu). */
export function ui2FromSearch(search: string): boolean | null {
  const v = new URLSearchParams(search).get("ui");
  return v === "2" ? true : v === "0" ? false : null;
}

/** Mảnh kit trong manifest: `nine` là số (một bản) hoặc { x2, x1 } do cutter ghi. */
export interface KitEntry { key: string; iso?: boolean; nine?: number | { x2: number; x1: number } | null }

/** Hệ số bản kit: 2 khi `--u` × DPR ≥ 2 (ảnh 2× đúng điểm), ngược lại 1. */
export function kitScale(u: number, dpr: number): 1 | 2 { return u * dpr >= 2 - 1e-6 ? 2 : 1; }

/** `ui2_khung_muc_lon` → `khung-muc-lon`; key không thuộc kit thì null. */
export function kitName(key: string): string | null {
  const m = key.match(/^ui2_([a-z0-9_]+)$/); return m ? m[1].replace(/_/g, "-") : null;
}

/** Đường dẫn ảnh mảnh kit theo bản (đúng đầu ra `ui:cut`: `2x/ui2_<tên>.png`, `1x/ui2_<tên>.png`). */
export function kitPath(key: string, scale: 1 | 2): string {
  return assetUrl(`sprites/iso/ui2/${scale}x/${key}.png`);
}

/** Vạch cắt của mảnh ở bản `scale`; thiếu thì null (mảnh không kéo giãn 9 lát). */
export function kitNine(e: KitEntry, scale: 1 | 2): number | null {
  const n = e.nine; if (n == null) return null;
  if (typeof n === "number") return n;
  return scale === 2 ? n.x2 : n.x1;
}

/**
 * Biến CSS của mọi mảnh kit: `--ui2-<tên>`, và với mảnh 9-slice thêm `-nine` (vạch, điểm ảnh bản đang dùng) và `-bw` (độ dày viền CSS =
 * vạch / hệ số kit, để cạnh khung chiếm đúng số điểm thiết bị). `toUrl` tách ra để test không cần `document`.
 */
export function kitTokens(entries: KitEntry[], scale: 1 | 2, toUrl: (key: string, scale: 1 | 2) => string = kitPath): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of entries) {
    const name = e.iso ? kitName(e.key) : null; if (!name) continue;
    out[`--ui2-${name}`] = `url("${toUrl(e.key, scale)}")`;
    const nine = kitNine(e, scale);
    if (nine != null) { out[`--ui2-${name}-nine`] = String(nine); out[`--ui2-${name}-bw`] = `${nine / scale}px`; }
  }
  return out;
}

/** Tên lớp `ui2-k-<tên>` cho từng mảnh có trong manifest (helper khung chỉ áp khi mảnh có thật). */
export function kitClasses(entries: KitEntry[]): string[] {
  return entries.flatMap((e) => { const n = e.iso ? kitName(e.key) : null; return n ? [`ui2-k-${n}`] : []; });
}

// ---- phần DOM ----
let kit: KitEntry[] = [];
let applied: string[] = [];

let flagCache: boolean | null = null;
export function isUi2(): boolean {
  if (flagCache !== null) return flagCache;
  return flagCache = readFlag();
}
function readFlag(): boolean {
  try {
    const q = ui2FromSearch(location.search);
    if (q !== null) { if (q) localStorage.setItem(FLAG_KEY, "1"); else localStorage.removeItem(FLAG_KEY); }
    return localStorage.getItem(FLAG_KEY) === "1";
  } catch { return ui2FromSearch(location.search) === true; } // trình duyệt chặn lưu trữ: chỉ theo lượt này
}

/** Bật / tắt `body.ui2` và (lại) đặt biến kit theo cỡ hiện tại. Tắt thì gỡ sạch biến và lớp (giao diện cũ không bị đụng). */
export function applyUi2(u: number) {
  const root = document.documentElement.style, cl = document.body?.classList;
  for (const k of applied) root.removeProperty(k);
  if (cl) for (const c of [...cl].filter((c) => c.startsWith("ui2-k-"))) cl.remove(c);
  applied = [];
  const on = isUi2(); cl?.toggle("ui2", on);
  if (!on || !cl) return;
  // URL tuyệt đối: url() tương đối trong biến CSS được phân giải theo tệp CSS đã build (/assets/), nên ở bản build mọi khung kit mất ảnh
  const abs = (key: string, scale: 1 | 2) => new URL(kitPath(key, scale), document.baseURI).href;
  const tokens = kitTokens(kit, kitScale(u, devicePixelRatio || 1), abs);
  for (const [k, v] of Object.entries(tokens)) { root.setProperty(k, v); applied.push(k); }
  for (const c of kitClasses(kit)) cl.add(c);
}

/** Nhận danh sách mảnh `ui2_*` từ manifest (uiArt.ts gọi sau khi đọc manifest). */
export function setKit(entries: KitEntry[]) { kit = entries.filter((e) => e.iso && kitName(e.key)); }
