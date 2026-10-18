# Một container chạy cả server game lẫn client đã build -> một link duy nhất để chia sẻ.
FROM node:22-slim
WORKDIR /app
COPY . .
RUN npm install --prefix server && npm install --prefix client && npm run build --prefix client
ENV PORT=2567
EXPOSE 2567
CMD ["npm", "start", "--prefix", "server"]
