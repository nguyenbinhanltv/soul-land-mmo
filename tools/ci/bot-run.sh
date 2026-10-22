#!/usr/bin/env bash
# Một lượt bot trên server mới bật (chế độ RAM, không DATABASE_URL), dùng cho job bot-ram của CI (.github/workflows/check.yml).
# Cách gọi: tools/ci/bot-run.sh <tên lượt> [BIẾN=giá trị ...]   (biến môi trường thêm cho server, ví dụ CHANNEL_MAX=2)
# Server: GAME_TEST=1, cổng BOT_PORT (mặc định 3141); BOT_PART (nếu đặt) tới bot để chạy một nhóm; log ở ci-logs/<tên lượt>-server.log và ci-logs/<tên lượt>-bot.log.
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

n() { grep -c "$1" "$blog"; }
# Annotation: `gh run view <id>` in ra (step summary thì chỉ có ở trang lượt chạy). Một dòng số ✓ / ✗ / ⚠, mỗi dòng ✗ một lỗi (tối đa 10).
if [ -n "${GITHUB_ACTIONS:-}" ]; then
  esc() { sed 's/%/%25/g'; } # message của annotation: % phải viết %25
  echo "::$([ "$code" -eq 0 ] && echo notice || echo error) title=bot $name::$([ "$code" -eq 0 ] && echo "đạt" || echo "TRƯỢT (mã $code)"): ✓ $(n '^  ✓'), ✗ $(n '^  ✗'), ⚠ $(n '⚠'), $((SECONDS - start)) giây"
  grep '^  ✗' "$blog" | head -n 10 | esc | while IFS= read -r l; do echo "::error title=bot $name ✗::${l#  ✗ }"; done
  # Thời gian từng phần (dòng ⏱ của bot-test.mjs, #236): đọc bằng gh run view để chia lại nhóm BOT_PART cho cân.
  grep -m1 '^⏱' "$blog" | esc | while IFS= read -r l; do echo "::notice title=bot $name ⏱::${l#⏱ }"; done
fi
# Tóm tắt ở trang lượt chạy: số dòng ✓ / ✗ / ⚠, rồi các dòng ✗ và ⚠ (tối đa 50 dòng mỗi loại).
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### bot \`$name\`: $([ "$code" -eq 0 ] && echo "đạt" || echo "TRƯỢT (mã $code)") sau $((SECONDS - start)) giây"
    echo ""
    echo "| ✓ | ✗ | ⚠ |"
    echo "|---|---|---|"
    echo "| $(n '^  ✓') | $(n '^  ✗') | $(n '⚠') |"
    if grep -q '^⏱' "$blog"; then echo ""; grep -m1 '^⏱' "$blog"; fi
    for mark in ✗ ⚠; do
      if grep -q "^ *$mark" "$blog"; then
        echo ""; echo "<details$([ "$mark" = ✗ ] && echo " open")><summary>Dòng $mark</summary>"; echo ""; echo '```'
        grep "^ *$mark" "$blog" | head -n 50; echo '```'; echo "</details>"
      fi
    done
    echo ""
  } >>"$GITHUB_STEP_SUMMARY"
fi
if [ "$code" -ne 0 ]; then echo "---- log server [$name] (200 dòng cuối) ----"; tail -n 200 "$slog"; fi
exit "$code"
