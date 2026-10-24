# Image chạy một tiến trình: server game (Colyseus + Express) phục vụ luôn client đã build (server/src/index.ts: ../../client/dist).
# Ba tầng: deps-server (chỉ thư viện production của server) / build (build client) / runtime (node:22-slim, không root).
# Bố cục trong image giữ như repo (server/src import ../../shared, ../../client/dist). Server chạy bằng tsx (giữ như `npm start`),
# gọi thẳng `node --import tsx` để node là PID 1 và nhận SIGTERM trực tiếp (server tự lưu người chơi khi tắt, #270).

FROM node:22-slim AS deps-server
WORKDIR /app
# package.json gốc cần có vì server khai báo "rung-san-hon-online": "file:.." (liên kết tượng trưng tới gốc repo).
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json server/
RUN npm ci --omit=dev --no-audit --no-fund --prefix server

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
COPY --chown=node:node server/package.json server/tsconfig.json server/
COPY --chown=node:node server/src server/src
COPY --chown=node:node server/sql server/sql
# Server chỉ đọc mã dùng chung (*.ts) và bản đồ (*.json) ở shared/; ảnh / âm thanh nằm trong client/dist.
COPY --chown=node:node shared/*.ts shared/
COPY --chown=node:node shared/assets/*.json shared/assets/
COPY --chown=node:node --from=build /app/client/dist client/dist
USER node
WORKDIR /app/server
EXPOSE 2567
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||2567)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "--import", "tsx", "src/index.ts"]
