import { defineConfig } from "vite";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Phiên bản asset tĩnh (#580): hash nội dung shared/assets (tên + nội dung từng file). Client gắn `?v=<hash>` vào URL asset không hash
 * (client/src/assetUrl.ts) nên server cho cache rất dài (server/src/index.ts), asset đổi thì hash đổi và URL đổi theo. `vite dev` để rỗng.
 */
function assetVersion(dir: string): string {
  const h = createHash("sha1");
  const walk = (d: string) => {
    for (const n of readdirSync(d).sort()) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else h.update(p.slice(dir.length)).update(readFileSync(p));
    }
  };
  if (existsSync(dir)) walk(dir);
  return h.digest("hex").slice(0, 10);
}

export default defineConfig(({ command }) => ({
  // Bản đồ Tiled (<mapId>.json) và tiles.png nằm ở shared/assets để server cũng đọc được.
  publicDir: "../shared/assets",
  define: { __ASSET_V__: JSON.stringify(command === "build" ? assetVersion("../shared/assets") : "") },
  server: { port: 5173, fs: { allow: [".."] } },
  // Phaser (phần lớn dung lượng JS) tách chunk riêng: đổi code game thì trình duyệt giữ chunk Phaser từ cache (tên có hash nội dung).
  // Nhiều trang (#656): "/" = landing (không nạp Phaser / net), "/choi" = game.
  build: { outDir: "dist", chunkSizeWarningLimit: 2000, rollupOptions: { input: { landing: resolve(__dirname, "index.html"), choi: resolve(__dirname, "choi/index.html") }, output: { manualChunks: { phaser: ["phaser"] } } } },
}));
