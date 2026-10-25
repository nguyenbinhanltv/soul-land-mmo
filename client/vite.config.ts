import { defineConfig, type Plugin } from "vite";
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

/** Landing (#656): gắn `?v=<hash>` vào ảnh / phông dưới /ui/landing/ trong index.html và CSS để server cho cache dài (server/src/staticCache.ts); ảnh og: giữ nguyên URL cho trình thu thập. */
function landingAssetVersion(v: string): Plugin {
  const re = /(["'(])(\/ui\/landing\/[^"')\s?]+)/g;
  return {
    name: "landing-asset-version",
    apply: "build",
    transformIndexHtml: (html) => html.replace(re, `$1$2?v=${v}`),
    generateBundle(_o, bundle) {
      for (const f of Object.values(bundle)) if (f.type === "asset" && f.fileName.endsWith(".css") && typeof f.source === "string") f.source = f.source.replace(re, `$1$2?v=${v}`);
    },
  };
}

/** `vite dev`: "/choi" không gạch cuối vào game (mặc định vite trả landing cho đường dẫn không có file); server thật làm việc này ở server/src/index.ts. */
function choiDevRoute(): Plugin {
  return {
    name: "choi-dev-route",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => { if (req.url && /^\/choi(\?|$)/.test(req.url)) req.url = req.url.replace("/choi", "/choi/"); next(); });
    },
  };
}

export default defineConfig(({ command }) => ({
  // Bản đồ Tiled (<mapId>.json) và tiles.png nằm ở shared/assets để server cũng đọc được.
  publicDir: "../shared/assets",
  plugins: [choiDevRoute(), landingAssetVersion(assetVersion("../shared/assets"))],
  define: { __ASSET_V__: JSON.stringify(command === "build" ? assetVersion("../shared/assets") : "") },
  server: { port: 5173, fs: { allow: [".."] } },
  // Phaser (phần lớn dung lượng JS) tách chunk riêng: đổi code game thì trình duyệt giữ chunk Phaser từ cache (tên có hash nội dung).
  // Nhiều trang (#656): "/" = landing (không nạp Phaser / net), "/choi" = game.
  build: { outDir: "dist", chunkSizeWarningLimit: 2000, rollupOptions: { input: { landing: resolve(__dirname, "index.html"), choi: resolve(__dirname, "choi/index.html") }, output: { manualChunks: { phaser: ["phaser"] } } } },
}));
