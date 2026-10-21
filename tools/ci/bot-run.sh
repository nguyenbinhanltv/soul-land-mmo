#!/usr/bin/env bash
# Một lượt bot trên server mới bật (chế độ RAM, không DATABASE_URL), dùng cho job bot-ram của CI (.github/workflows/check.yml).
# Cách gọi: tools/ci/bot-run.sh <tên lượt> [BIẾN=giá trị ...]   (biến môi trường thêm cho server, ví dụ CHANNEL_MAX=2)
# Server: GAME_TEST=1, cổng BOT_PORT (mặc định 3141); log ở ci-logs/<tên lượt>-server.log và ci-logs/<tên lượt>-bot.log.
# Mã thoát: của bot (khác 0 khi có dòng ✗), hoặc 1 nếu server không sẵn sàng / chết giữa chừng.
set -uo pipefail
name=$1; shift
port=${BOT_PORT:-3141}
root=$(cd "$(dirname "$0")/../.." && pwd)
logs="$root/ci-logs"; mkdir -p "$logs"
slog="$logs/$name-server.log"; blog="$logs/$name-bot.log"

# setsid: server (npm -> tsx -> node) chạy trong nhóm tiến trình riêng để tắt được cả nhóm.
(cd "$root/server" && exec env -u DATABASE_URL GAME_TEST=1 PORT="$port" "$@" setsid npm start) >"$slog" 2>&1 &
pid=$!
stop() { kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; }
trap stop EXIT

# Chờ /health (tối đa 60 giây), không ngủ cứng.
for i in $(seq 1 120); do
  curl -sf "http://localhost:$port/health" >/dev/null && break
  if ! kill -0 "$pid" 2>/dev/null; then echo "✗ [$name] server thoát trước khi sẵn sàng"; cat "$slog"; exit 1; fi
  sleep 0.5
done
if ! curl -sf "http://localhost:$port/health" >/dev/null; then echo "✗ [$name] server không sẵn sàng sau 60 giây"; cat "$slog"; exit 1; fi
echo "[$name] server sẵn sàng sau ~$((i / 2)) giây: $(curl -s "http://localhost:$port/health")"

start=$SECONDS
(cd "$root/client" && SERVER_URL="http://localhost:$port" npm run bot) 2>&1 | tee "$blog"
code=${PIPESTATUS[0]}
echo "[$name] bot xong sau $((SECONDS - start)) giây, mã thoát $code"
if ! kill -0 "$pid" 2>/dev/null; then echo "✗ [$name] server đã chết trong lúc chạy bot"; code=1; fi
if [ "$code" -ne 0 ]; then echo "---- log server [$name] (200 dòng cuối) ----"; tail -n 200 "$slog"; fi
exit "$code"
