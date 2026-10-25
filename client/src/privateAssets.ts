// Asset kho riêng (#623, docs/asset-rieng.md): hiệu ứng từ gói giấy phép hạn chế (cấm phân phối lại file) không nằm trong repo công khai.
// CI release kéo kho riêng vào shared/assets/private/ lúc build image; `private/present.json` liệt kê file có thật. Không có kho (dev / fork /
// chưa cấu hình) thì không có present.json: mọi hàm ở đây trả false và nơi gọi giữ hình cũ (PixelLab S3 / LPC / vẽ bằng code).
// `?pfx=0` tắt hẳn (so trước / sau trong trang thử fxTest). Chỉ hiển thị, không đổi luật hay số cân bằng.
import type Phaser from "phaser";
import { fetchAsset } from "./assetUrl.ts";
import type { SheetFx, SheetPlay } from "./fxSheet.ts";

interface PrivDef { key: string; kind: string; file: string; glow?: string; frame: [number, number]; frames: number; fps?: number; normal?: boolean; foot?: [number, number] }
const defs = new Map<string, PrivDef>();
/** `?pfx=0`: tắt hẳn asset kho riêng (cả vật bản đồ ở isoMap.ts). */
export const PRIV_OFF = typeof location !== "undefined" && /[?&]pfx=0\b/.test(location.search);
const glowKey = (key: string) => `${key}_hao`;
const off = PRIV_OFF;
let started: Promise<void> | null = null;

/** Tải các sheet kho riêng có thật (gọi một lần khi vào cảnh, không chặn: sheet tới muộn thì lần phát sau mới có). Lỗi / thiếu thì im lặng. */
export function loadPrivateAssets(scene: Phaser.Scene): Promise<void> {
  if (off) return Promise.resolve();
  started ??= (async () => {
    try {
      const pr = await fetchAsset("private/present.json");
      if (!pr.ok) return;
      const present = new Set<string>(((await pr.json()) as { files?: string[] }).files ?? []);
      const mr = await fetchAsset("sprites/private-manifest.json");
      if (!mr.ok) return;
      const list = ((await mr.json()) as { sprites?: PrivDef[] }).sprites ?? [];
      let n = 0;
      for (const d of list) {
        if (d.kind !== "fx" || !present.has(d.file)) continue; // chỉ xin file có thật: không 404, không thử lại
        defs.set(d.key, d);
        scene.load.spritesheet(d.key, `private/${d.file}`, { frameWidth: d.frame[0], frameHeight: d.frame[1] });
        if (d.glow && present.has(d.glow)) scene.load.spritesheet(glowKey(d.key), `private/${d.glow}`, { frameWidth: d.frame[0], frameHeight: d.frame[1] });
        n++;
      }
      if (n) await new Promise<void>((ok) => { scene.load.once("complete", () => ok()); scene.load.start(); });
    } catch { /* không có kho riêng: bỏ qua */ }
  })();
  return started;
}

/** Hiệu ứng kho riêng đã tải và dùng được. */
export const hasPriv = (sheets: SheetFx, key: string) => !off && defs.has(key) && sheets.has(key);

/** Phát hiệu ứng kho riêng (thân + lớp cộng sáng nếu có); false khi chưa có để nơi gọi dùng hình cũ. */
export function playPriv(sheets: SheetFx, key: string, o: Omit<SheetPlay, "key">): boolean {
  const d = defs.get(key);
  if (off || !d || !sheets.has(key)) return false;
  const ok = sheets.play({ fps: d.fps, normal: d.normal, ...o, key });
  if (ok && d.glow && !o.light && sheets.has(glowKey(key))) sheets.play({ fps: d.fps, ...o, key: glowKey(key), normal: false, alpha: Math.min(1, (o.alpha ?? 1) * 0.55) });
  return ok;
}
