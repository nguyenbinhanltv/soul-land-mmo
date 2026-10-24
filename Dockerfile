# Image chạy một tiến trình: server game (Colyseus + Express) phục vụ luôn client đã build (server/src/index.ts: ../../client/dist).
# Bốn tầng: deps-server (chỉ thư viện production của server) / build-server (esbuild gộp server + shared thành server/dist/index.mjs) /
# build (build client) / runtime (node:22-slim, không root).
# Tầng chạy KHÔNG có tsx / esbuild (esbuild là binary Go, Trivy báo CVE của Go stdlib trong đó, #500): chạy JS đã biên dịch.
# Bố cục giữ như repo: server/dist/index.mjs cùng độ sâu với server/src nên ../sql, ../../shared/assets, ../../client/dist vẫn đúng.
# Gọi thẳng `node` để node là PID 1 và nhận SIGTERM trực tiếp (server tự lưu người chơi khi tắt, #270).

FROM node:22-slim AS deps-server
WORKDIR /app
# package.json gốc cần có vì server khai báo "rung-san-hon-online": "file:.." (liên kết tượng trưng tới gốc repo).
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/
RUN npm ci --omit=dev --no-audit --no-fund --prefix server

FROM node:22-slim AS build-server
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/
RUN npm ci --no-audit --no-fund --prefix server
COPY shared shared
COPY server/tsconfig.json server/
COPY server/src server/src
RUN npm run build --prefix server

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json client/
RUN npm ci --no-audit --no-fund --prefix client
# shared/ (publicDir của vite là shared/assets) và mã client đổi thường xuyên hơn thư viện nên copy sau npm ci.
COPY shared shared
COPY client client
RUN npm run build --prefix client

FROM node:22-slim AS runtime
ARG VERSION=dev
ARG REVISION=unknown
ARG CREATED=unknown
LABEL org.opencontainers.image.title="soul-land-game" \
      org.opencontainers.image.description="Server game Đấu La (Colyseus) kèm client đã build" \
      org.opencontainers.image.source="https://github.com/nguyenbinhanltv/soul-land-mmo" \
      org.opencontainers.image.version="$VERSION" \
      org.opencontainers.image.revision="$REVISION" \
      org.opencontainers.image.created="$CREATED"
WORKDIR /app
ENV NODE_ENV=production PORT=2567
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=deps-server /app/server/node_modules server/node_modules
COPY --chown=node:node server/package.json server/
COPY --chown=node:node --from=build-server /app/server/dist server/dist
COPY --chown=node:node server/sql server/sql
# Mã dùng chung (shared/*.ts) đã nằm trong bản gộp; lúc chạy server chỉ đọc bản đồ (*.json) ở shared/assets; ảnh / âm thanh nằm trong client/dist.
COPY --chown=node:node shared/assets/*.json shared/assets/
COPY --chown=node:node --from=build /app/client/dist client/dist
USER node
WORKDIR /app/server
EXPOSE 2567
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||2567)+'/live').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
