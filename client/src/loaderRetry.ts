// Phaser loader: URL có phiên bản + thử lại có backoff (#580). Tách khỏi assetUrl.ts để test node (audio) không phải nạp Phaser.
import Phaser from "phaser";
import { assetUrl, retryDelay } from "./assetUrl.ts";

/** Phaser loader: URL có phiên bản và tải lại có backoff (Phaser tự thử lại ngay lập tức, lỗi 504 thoáng qua thì thử lại ngay cũng lỗi). */
let installed = false;
export function installLoaderRetry() {
  if (installed) return;
  installed = true;
  const F = Phaser.Loader.File.prototype as unknown as { load(): void; onError(): void; onLoad(xhr: XMLHttpRequest, event: Event): void; resetXHR(): void; url: unknown; retryAttempts: number; tries?: number; versioned?: boolean };
  const load = F.load;
  F.load = function (this: typeof F) {
    if (!this.versioned && typeof this.url === "string") { this.url = assetUrl(this.url); this.versioned = true; }
    load.call(this);
  };
  // Phaser chỉ coi lỗi mạng (xhr error) là lần thử lại; 5xx / 408 / 429 (504 từ proxy) đi qua onLoad và hỏng luôn: đẩy sang onError.
  const onLoad = F.onLoad;
  F.onLoad = function (this: typeof F, xhr: XMLHttpRequest, event: Event) {
    if (this.retryAttempts > 0 && xhr.readyState === 4 && (xhr.status >= 500 || xhr.status === 408 || xhr.status === 429)) this.onError();
    else onLoad.call(this, xhr, event);
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

