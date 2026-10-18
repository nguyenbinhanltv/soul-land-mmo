import { defineConfig } from "vite";

export default defineConfig({
  // Bản đồ Tiled (<mapId>.json) và tiles.png nằm ở shared/assets để server cũng đọc được.
  publicDir: "../shared/assets",
  server: { port: 5173, fs: { allow: [".."] } },
  build: { outDir: "dist", chunkSizeWarningLimit: 2000 },
});
