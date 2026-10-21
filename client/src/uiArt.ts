// Ảnh giao diện HTML (bước 10.8, GAME_DESIGN.md mục 5.11 "Chân dung và thẻ võ hồn", phong cách C thủy mặc / D lưu ly):
// - đọc shared/assets/sprites/manifest.json một lần, chỉ dùng key "iso" có trong danh sách (key chưa có ảnh thì giao diện giữ kiểu
//   vẽ bằng CSS / SVG cũ, không 404);
// - mảnh `ui_*` thành biến CSS `--ui-<tên>` (ảnh) và `--nine-<tên>` (số điểm giữ nguyên ở mỗi mép khi kéo giãn 9 lát, theo "nine");
// - hồn cốt là bản xám: tô theo màu niên hạn bằng canvas (nhân màu từng điểm ảnh), giữ nguyên điểm ảnh;
// - tỉ lệ giao diện `--u` (số nguyên) theo cỡ cửa sổ, như phóng số nguyên của cảnh 640×360.
import { VIEW_W, VIEW_H } from "./iso.ts";

const BASE = "sprites/";
interface Entry { key: string; iso?: boolean; nine?: number }
const keys = new Map<string, Entry>();

/** Đường dẫn ảnh theo key isometric của giao diện (mục 5.11 "Tên file"); key lạ thì null. */
function pathOf(key: string) {
  const m = key.match(/^(ui|card|portrait|he|npc|item|status)_([a-z0-9_]+)$/); if (!m) return null;
  const dir = { ui: "ui", card: "ui", portrait: "portrait", he: "he", npc: "npc", item: "item", status: "status" }[m[1]];
  return `${BASE}iso/${dir}/${m[1] === "card" ? "the_" : ""}${m[2]}.png`;
}

/** URL ảnh của key nếu manifest có (key "iso"); không có thì null để nơi gọi dùng kiểu cũ. */
export function artUrl(key: string) {
  return keys.get(key)?.iso ? pathOf(key) : null;
}
/** `<img>` điểm ảnh của key (alt rỗng: chỉ để trang trí, nghĩa nằm ở nhãn của phần tử chứa); không có ảnh thì "". */
export function artImg(key: string, cls = "") {
  const u = artUrl(key);
  return u ? `<img class="${cls}" src="${u}" alt="" draggable="false">` : "";
}

/** Ảnh vật phẩm tô theo màu khi hiển thị (ngoài hồn cốt xám): hồn hoàn theo niên hạn, mảnh võ hồn theo màu võ hồn. */
const TINTED = ["item_hon_hoan", "item_manh_vo_hon"];
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

/**
 * Tỉ lệ giao diện: nửa mức phóng của cảnh, làm tròn xuống (720p, 1080p → 1; 1440p → 2; 4K → 3), tối thiểu 1, luôn là số nguyên. Nhờ đó
 * bố cục HUD luôn có ít nhất khoảng 1280×720 điểm giao diện như lúc thiết kế, điểm ảnh giấy / font không bị kéo lẻ.
 */
export function uiScale() {
  const z = Math.max(1, Math.floor(Math.min(innerWidth / VIEW_W, innerHeight / VIEW_H)));
  return Math.max(1, Math.floor(z / 2));
}
function applyScale() { document.documentElement.style.setProperty("--u", String(uiScale())); }

let ready: Promise<void> | null = null;
/**
 * Gọi một lần lúc mở trang: đọc manifest, đặt biến CSS cho mảnh giao diện, tải trước ảnh xám hồn cốt, bật tỉ lệ giao diện. Lỗi mạng thì
 * giao diện vẫn chạy bằng kiểu CSS cũ.
 */
export function loadUiArt() {
  applyScale(); addEventListener("resize", applyScale);
  return ready ??= (async () => {
    try {
      // Quá 5 giây thì bỏ (giao diện vẽ bằng CSS cũ) để màn đăng nhập không treo trắng khi mạng chậm.
      const r = await fetch(BASE + "manifest.json", { signal: AbortSignal.timeout(5000) });
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
