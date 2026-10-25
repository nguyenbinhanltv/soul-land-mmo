// Ảnh giao diện HTML (bước 10.8, GAME_DESIGN.md mục 5.11 "Chân dung và thẻ võ hồn", phong cách C thủy mặc / D lưu ly):
// - đọc shared/assets/sprites/manifest.json một lần, chỉ dùng key "iso" có trong danh sách (key chưa có ảnh thì giao diện giữ kiểu
//   vẽ bằng CSS / SVG cũ, không 404);
// - mảnh `ui_*` thành biến CSS `--ui-<tên>` (ảnh) và `--nine-<tên>` (số điểm giữ nguyên ở mỗi mép khi kéo giãn 9 lát, theo "nine");
// - hồn cốt là bản xám: tô theo màu niên hạn bằng canvas (nhân màu từng điểm ảnh), giữ nguyên điểm ảnh;
// - tỉ lệ giao diện `--u` theo cài đặt Cỡ giao diện (tự động hoặc 75–150%) và các lớp `ui-w*` / `ui-h*` theo kích thước logic.
import { TIERS, VOHON_SKILLS } from "../../shared/data.ts";
import { assetUrl, fetchAsset } from "./assetUrl.ts";

const BASE = "sprites/";
interface Entry { key: string; iso?: boolean; nine?: number }
const keys = new Map<string, Entry>();

/** Đường dẫn ảnh theo key isometric của giao diện (mục 5.11 "Tên file"); key lạ thì null. */
function pathOf(key: string) {
  const m = key.match(/^(ui|card|portrait|he|npc|item|status|thu|skill|gi)_([a-z0-9_]+)$/); if (!m) return null;
  const dir = { ui: "ui", card: "ui", portrait: "portrait", he: "he", npc: "npc", item: "item", status: "status", thu: "thu", skill: "skill", gi: "gi" }[m[1]];
  return assetUrl(`${BASE}iso/${dir}/${m[1] === "card" ? "the_" : ""}${m[2]}.png`);
}

/** URL ảnh của key nếu manifest có (key "iso"); không có thì null để nơi gọi dùng kiểu cũ. */
export function artUrl(key: string) {
  return keys.get(key)?.iso ? pathOf(key) : null;
}
/**
 * Biểu tượng hồn kỹ vòng `ring` (chỉ số 0..9) của võ hồn `vohonId` (#384): key `skill_<mã võ hồn>_<ring>`, võ hồn dùng bảng chung SKILLS thì
 * `skill_chung_<ring>`. Chưa có ảnh thì "" để nơi gọi giữ ký tự `icon` của hồn kỹ.
 */
export function skillImg(vohonId: string, ring: number, cls = "") {
  return artImg(`skill_${VOHON_SKILLS[vohonId] ? vohonId : "chung"}_${ring}`, cls);
}
/** Biểu tượng Võ Hồn Chân Thân `gi_ct_<mã võ hồn>` (nút R), `skill` = hồn kỹ Chân Thân `gi_ctskill_<mã>` (ô P khi biến hình); chưa có ảnh thì "". */
export function chanThanImg(vohonId: string, skill = false, cls = "") {
  return artImg(`gi_ct${skill ? "skill" : ""}_${vohonId}`, cls);
}
/** Biểu tượng Dung hợp kỹ `gi_fusion_<tên không dấu>` (ví dụ "Yêu Nguyệt" → gi_fusion_yeu_nguyet); chưa có ảnh thì "". */
export function fusionImg(name: string, cls = "") {
  return artImg(fusionImgKey(name), cls);
}
/** Key `gi_fusion_<tên không dấu>` của Dung hợp kỹ (dùng chung HTML và nhãn trên đầu). */
export function fusionImgKey(name: string) {
  return `gi_fusion_${name.toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "_")}`;
}
/** `<img>` điểm ảnh của key (alt rỗng: chỉ để trang trí, nghĩa nằm ở nhãn của phần tử chứa); không có ảnh thì "". */
export function artImg(key: string, cls = "") {
  const u = artUrl(key);
  return u ? `<img class="${cls}" src="${u}" alt="" draggable="false">` : "";
}

/**
 * Ảnh vật phẩm tô theo màu khi hiển thị (ngoài hồn cốt xám): hồn hoàn theo niên hạn, mảnh võ hồn theo màu võ hồn, rương và tiên
 * thảo (bản xám, #170) theo `col` của món.
 */
const TINTED = ["item_hon_hoan", "item_manh_vo_hon", "item_ruong", "item_tien_thao"];
const tintCache = new Map<string, string>();
const grays = new Map<string, HTMLImageElement>();
/** Tải trước ảnh xám (hồn cốt) để tô màu đồng bộ được. */
function preloadGray(key: string) {
  const u = artUrl(key); if (!u || grays.has(key)) return Promise.resolve();
  const img = new Image(); grays.set(key, img);
  return new Promise<void>((res) => { img.onload = img.onerror = () => res(); img.src = u; });
}
/**
 * Ảnh `key` (hồn cốt bản xám, hồn hoàn, mảnh võ hồn) nhân màu `col` (#rrggbb) thành data URL (hồn cốt tô theo màu niên hạn, mục 5.11);
 * chưa tải xong hoặc trình duyệt chặn canvas thì trả URL ảnh gốc.
 */
export function tintedUrl(key: string, col: string) {
  const id = `${key}|${col}`, hit = tintCache.get(id); if (hit) return hit;
  const img = grays.get(key), u = artUrl(key);
  if (!u) return null;
  if (!img?.complete || !img.naturalWidth) return u;
  try {
    const cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const ctx = cv.getContext("2d")!; ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, cv.width, cv.height), n = parseInt(col.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    // Độ sáng của điểm (ảnh màu như hồn hoàn, mảnh võ hồn cũng tô được) nhân màu như tint của Phaser, nâng sáng một chút để bậc
    // trắng / vàng không xỉn (điểm tối nhất vẫn là viền).
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.min(255, (d.data[i] * 0.3 + d.data[i + 1] * 0.59 + d.data[i + 2] * 0.11) * 1.15);
      d.data[i] = (v * r) / 255; d.data[i + 1] = (v * g) / 255; d.data[i + 2] = (v * b) / 255;
    }
    ctx.putImageData(d, 0, 0);
    const out = cv.toDataURL(); tintCache.set(id, out); return out;
  } catch { return u; }
}

/** Lựa chọn cỡ giao diện ở bảng Cài đặt: "auto" hoặc một hệ số cố định; lưu localStorage để lần sau giữ nguyên. */
export const UI_SCALE_CHOICES = [
  { v: "auto", label: "Tự động" }, { v: "0.75", label: "75%" }, { v: "1", label: "100%" }, { v: "1.25", label: "125%" }, { v: "1.5", label: "150%" },
] as const;
export type UiScalePref = (typeof UI_SCALE_CHOICES)[number]["v"];
const SCALE_KEY = "shh-ui-scale";
export function getUiScalePref(): UiScalePref {
  try { const v = localStorage.getItem(SCALE_KEY); if (UI_SCALE_CHOICES.some((c) => c.v === v)) return v as UiScalePref; } catch { /* trình duyệt chặn lưu trữ */ }
  return "auto";
}
export function setUiScalePref(v: UiScalePref) {
  try { localStorage.setItem(SCALE_KEY, v); } catch { /* không lưu được thì chỉ áp dụng lượt này */ }
  applyScale();
}

/**
 * Tỉ lệ giao diện. Hệ số cố định thì dùng đúng hệ số. Tự động: bằng (cỡ cửa sổ / 1280×720) chia 1,5, làm tròn tới 0,5, tối thiểu 1
 * (1080p → 1×, 1440p → 1,5×, 4K → 2×), không nhảy thẳng 1× → 2× như trước; bậc nửa vẫn rơi đúng điểm ảnh thiết bị trên màn 2× dpi,
 * trên màn thường ảnh giấy / font Galmuri lệch lưới nhẹ ở bậc 1,5 (muốn sắc nét tuyệt đối thì chọn 100% / 150% hoặc 200% trên màn lớn).
 */
export function uiScale() {
  const pref = getUiScalePref();
  if (pref !== "auto") return Number(pref);
  const fit = Math.min(innerWidth / 1280, innerHeight / 720);
  return Math.max(1, Math.round((fit / 1.5) * 2) / 2);
}
/**
 * Đặt `--u` và các lớp theo kích thước LOGIC (cỡ cửa sổ chia `--u`, vì HUD phóng bằng `zoom`): `ui-w640` / `ui-w560` / `ui-w520` / `ui-w420`
 * khi bề rộng logic ≤ số đó, `ui-h500` / `ui-h460` khi chiều cao logic ≤ số đó, `ui-portrait` khi cao hơn rộng. CSS dùng các lớp này thay
 * `@media (max-width)` để chọn cỡ 150% trên màn 1280 cũng co bố cục đúng như màn hẹp.
 */
function applyScale() {
  const u = uiScale(), root = document.documentElement;
  root.style.setProperty("--u", String(u));
  const w = innerWidth / u, h = innerHeight / u, cl = document.body?.classList;
  if (!cl) return;
  for (const n of [640, 560, 520, 420]) cl.toggle(`ui-w${n}`, w <= n);
  for (const n of [500, 460]) cl.toggle(`ui-h${n}`, h <= n);
  cl.toggle("ui-portrait", h > w);
  cl.toggle("ui-wide", w >= 960); // hai bảng Nhân vật / Túi cạnh nhau theo bố cục màn ngang (NV1 #455)
}

/**
 * Token màu niên hạn / độ hiếm (UI-0): `--tier-N` (viền, chấm, vòng), `--tier-N-glow` (chữ trên tấm mực) và bí danh `--rare-N` cho độ hiếm
 * vật phẩm, đọc từ TIERS (shared/data.ts) để CSS không chép số. Chữ màu niên hạn đặt trên tấm mực dùng glow (Tím 7,3 : 1, Đỏ 5,5 : 1),
 * không đặt thẳng trên giấy.
 */
function applyTierTokens() {
  const root = document.documentElement.style;
  TIERS.forEach((t, i) => {
    root.setProperty(`--tier-${i}`, t.col); root.setProperty(`--tier-${i}-glow`, t.glow);
    root.setProperty(`--rare-${i}`, t.col); root.setProperty(`--rare-${i}-glow`, t.glow);
  });
}

let ready: Promise<void> | null = null;
/**
 * Gọi một lần lúc mở trang: đọc manifest, đặt biến CSS cho mảnh giao diện, tải trước ảnh xám hồn cốt, bật tỉ lệ giao diện. Lỗi mạng thì
 * giao diện vẫn chạy bằng kiểu CSS cũ.
 */
export function loadUiArt() {
  applyScale(); applyTierTokens(); addEventListener("resize", applyScale);
  return ready ??= (async () => {
    try {
      // Quá 5 giây thì bỏ (giao diện vẽ bằng CSS cũ) để màn đăng nhập không treo trắng khi mạng chậm.
      const r = await fetchAsset(BASE + "manifest.json", { signal: AbortSignal.timeout(5000) }, 1);
      const data = (await r.json()) as { sprites?: (string | Entry)[] };
      for (const e of data.sprites ?? []) if (typeof e !== "string" && e.iso) keys.set(e.key, e);
    } catch { return; }
    const root = document.documentElement.style;
    for (const [key, e] of keys) {
      if (!key.startsWith("ui_")) continue;
      const name = key.slice(3).replace(/_/g, "-");
      // URL tuyệt đối: url() tương đối trong biến CSS được phân giải theo tệp CSS đã build (assets/), không theo trang.
      root.setProperty(`--ui-${name}`, `url("${new URL(pathOf(key)!, document.baseURI).href}")`);
      if (e.nine) root.setProperty(`--nine-${name}`, String(e.nine));
    }
    document.documentElement.classList.add("thuymac");
    // Chờ tối đa 5 giây; ảnh tải xong sau đó vẫn được tô ở lần vẽ kế tiếp (trước đó tintedUrl trả ảnh gốc).
    await Promise.race([Promise.all([...keys.keys()].filter((k) => k.startsWith("item_hon_cot_") || TINTED.includes(k)).map(preloadGray)),
      new Promise((r) => setTimeout(r, 5000))]);
  })();
}
