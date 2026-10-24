// Tải asset bền (#580): URL có phiên bản + thử lại có backoff. Server (server/src/index.ts) cho ảnh / âm thanh không hash cache rất dài khi URL
// có `?v=`, nên mọi đường tải asset tĩnh (shared/assets) đi qua đây: đổi nội dung asset thì `ASSET_V` (hash nội dung, vite.config.ts) đổi và
// URL đổi theo, không kẹt cache. Phaser loader: `installLoaderRetry()` (một lần), cùng cách cho fetch / Image ở nơi khác.
import Phaser from "phaser";

declare const __ASSET_V__: string | undefined;
/** Hash nội dung shared/assets lúc build; rỗng khi chạy ngoài vite (test node) hoặc `vite dev` (dev không cần cache dài). */
export const ASSET_V: string = typeof __ASSET_V__ === "string" ? __ASSET_V__ : "";

/** Số lần thử lại và trần chờ (ms): 400, 1200, 3600 + nhiễu để cả trăm file lỗi cùng lúc không dồn lại cùng một nhịp. */
export const ASSET_RETRIES = 3;
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

/** Phaser loader: URL có phiên bản và tải lại có backoff (Phaser tự thử lại ngay lập tức, lỗi 504 thoáng qua thì thử lại ngay cũng lỗi). */
let installed = false;
export function installLoaderRetry() {
  if (installed) return;
  installed = true;
  const F = Phaser.Loader.File.prototype as unknown as { load(): void; onError(): void; resetXHR(): void; url: unknown; retryAttempts: number; tries?: number; versioned?: boolean };
  const load = F.load;
  F.load = function (this: typeof F) {
    if (!this.versioned && typeof this.url === "string") { this.url = assetUrl(this.url); this.versioned = true; }
    load.call(this);
  };
  F.onError = function (this: typeof F & { loader: { nextFile(f: unknown, ok: boolean): void } }) {
    this.resetXHR();
    if (this.retryAttempts > 0) {
      this.retryAttempts--;
      this.tries = (this.tries ?? 0) + 1;
      setTimeout(() => load.call(this), retryDelay(this.tries - 1));
    } else this.loader.nextFile(this, false);
  };
}

/** Ảnh tải có phiên bản + thử lại có backoff; lỗi hẳn thì null. */
export async function loadImageRetry(url: string, tries = ASSET_RETRIES): Promise<HTMLImageElement | null> {
  for (let i = 0; ; i++) {
    const im = await new Promise<HTMLImageElement | null>((res) => { const e = new Image(); e.onload = () => res(e); e.onerror = () => res(null); e.src = assetUrl(url); });
    if (im || i >= tries) return im;
    await sleep(retryDelay(i));
  }
}
