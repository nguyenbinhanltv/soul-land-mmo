#!/usr/bin/env bash
# Bot khói (BOT_PART=smoke) chạy vào MỘT SERVER ĐÃ BẬT SẴN, dùng cho release.yml: container image vừa build + PostgreSQL tạm (K3, #500).
# Cách gọi: tools/ci/bot-image.sh <URL server>          ví dụ: tools/ci/bot-image.sh http://localhost:3141
# Server phải bật GAME_TEST=1 (chỉ ở lượt thử này) và dùng DB rỗng của service container. Mã thoát: của bot (khác 0 khi có dòng ✗).
# AN TOÀN (#406): bot tạo hàng trăm tài khoản, không bao giờ được trỏ vào DB thật. Script từ chối chạy nếu DATABASE_URL (của shell này)
# không phải localhost / 127.0.0.1; URL server phải là localhost.
set -uo pipefail
url=${1:?Cách dùng: $0 <URL server, ví dụ http://localhost:3141>}
case "$url" in http://localhost:*|http://127.0.0.1:*) ;; *) echo "✗ chỉ chạy bot vào server localhost (nhận: $url)"; exit 1 ;; esac
if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in *@localhost[:/]*|*@127.0.0.1[:/]*) ;; *) echo "✗ DATABASE_URL không trỏ localhost: từ chối chạy bot (#406)"; exit 1 ;; esac
fi
root=$(cd "$(dirname "$0")/../.." && pwd)
logs="$root/ci-logs"; mkdir -p "$logs"; blog="$logs/image-bot.log"

for i in $(seq 1 120); do curl -sf "$url/health" >/dev/null && break; sleep 0.5; done
curl -sf "$url/health" >/dev/null || { echo "✗ server không sẵn sàng sau 60 giây ($url)"; exit 1; }
echo "server sẵn sàng sau ~$((i / 2)) giây: $(curl -s "$url/health")"

start=$SECONDS
(cd "$root/client" && BOT_PART=smoke SERVER_URL="$url" npm run bot) 2>&1 | tee "$blog"
code=${PIPESTATUS[0]}
n() { grep -c "$1" "$blog"; }
echo "bot khói xong sau $((SECONDS - start)) giây, mã thoát $code: ✓ $(n '^  ✓'), ✗ $(n '^  ✗'), ⚠ $(n '⚠')"
if [ -n "${GITHUB_ACTIONS:-}" ]; then
  grep '^  ✗' "$blog" | head -n 10 | sed 's/%/%25/g' | while IFS= read -r l; do echo "::error title=bot image ✗::${l#  ✗ }"; done
fi
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### Bot khói vào image: $([ "$code" -eq 0 ] && echo "đạt" || echo "TRƯỢT (mã $code)") sau $((SECONDS - start)) giây"
    echo ""
    echo "| ✓ | ✗ | ⚠ |"
    echo "|---|---|---|"
    echo "| $(n '^  ✓') | $(n '^  ✗') | $(n '⚠') |"
    if grep -q '^ *✗' "$blog"; then echo ""; echo '```'; grep '^ *✗' "$blog" | head -n 50; echo '```'; fi
    echo ""
  } >>"$GITHUB_STEP_SUMMARY"
fi
exit "$code"
