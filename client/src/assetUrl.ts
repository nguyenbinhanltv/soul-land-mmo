// Tải asset bền (#580): URL có phiên bản + thử lại có backoff. Server (server/src/index.ts) cho ảnh / âm thanh không hash cache rất dài khi URL
// có `?v=`, nên mọi đường tải asset tĩnh (shared/assets) đi qua đây: đổi nội dung asset thì `ASSET_V` (hash nội dung, vite.config.ts) đổi và
// URL đổi theo, không kẹt cache. Phaser loader: `installLoaderRetry()` (loaderRetry.ts, tách file vì kéo theo Phaser), cùng cách cho fetch / Image ở nơi khác.

declare const __ASSET_V__: string | undefined;
/** Hash nội dung shared/assets lúc build; rỗng khi chạy ngoài vite (test node) hoặc `vite dev` (dev không cần cache dài). */
export const ASSET_V: string = typeof __ASSET_V__ === "string" ? __ASSET_V__ : "";

/** Số lần thử lại và trần chờ (ms): 400, 1200, 3600, 8000, 8000 + nhiễu để cả trăm file lỗi cùng lúc không dồn lại cùng một nhịp. */
export const ASSET_RETRIES = 5;
/** Số file tải cùng lúc (Phaser loader; lpcRig có hàng đợi riêng cùng mức): hàng trăm file nhỏ dồn một lúc làm proxy / pod chậm và dễ 504. */
export const MAX_PARALLEL = 12;
export const retryDelay = (attempt: number) => Math.min(8000, 400 * 3 ** attempt) * (0.75 + Math.random() * 0.5);

/** Gắn `?v=<phiên bản>` vào URL tương đối chưa có query (URL tuyệt đối, data:, blob: giữ nguyên). */
export function assetUrl(url: string): string {
  if (!ASSET_V || /^(?:[a-z]+:|\/\/)/i.test(url) || url.includes("?")) return url;
  return `${url}?v=${ASSET_V}`;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** fetch có phiên bản + thử lại (mạng lỗi, 5xx, 408, 429); 404 và lỗi 4xx khác trả ngay (không có gì để thử lại). */
export async function fetchAsset(url: string, init?: RequestInit, tries = ASSET_RETRIES): Promise<Response> {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(assetUrl(url), init);
      if (res.ok || i >= tries || (res.status < 500 && res.status !== 408 && res.status !== 429)) return res;
    } catch (e) { if (i >= tries || init?.signal?.aborted) throw e; }
    await sleep(retryDelay(i));
  }
}

/** Ảnh tải có phiên bản + thử lại có backoff; lỗi hẳn thì null. */
export async function loadImageRetry(url: string, tries = ASSET_RETRIES): Promise<HTMLImageElement | null> {
  for (let i = 0; ; i++) {
    const im = await new Promise<HTMLImageElement | null>((res) => { const e = new Image(); e.onload = () => res(e); e.onerror = () => res(null); e.src = assetUrl(url); });
    if (im || i >= tries) return im;
    await sleep(retryDelay(i));
  }
}
