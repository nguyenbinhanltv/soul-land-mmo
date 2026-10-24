#!/bin/bash
# S2 (#548): bật server GAME_TEST=1 ở cổng riêng (kiểm cổng bận), chạy real.mjs (Chrome headless --mute-audio, MemoryStore, KHÔNG DB thật), tắt đúng PID server.
# Dùng: PORT=3346 TAGS="sau truoc" GOTO=700,1300 OUT=<thư mục khung> bash tools/assets/skill-vfx/preview/run-real.sh <jobs.json>
# Cần client/dist đã build (npm run build --prefix client) và server/node_modules. GOTO: chỗ đứng ngoài trại (lac_nhat_sam_lam; trong trại không giao chiến).
JOBS=$1; PORT=${PORT:-3346}; TAGS=${TAGS:-sau}; OUT=${OUT:?cần OUT}
W=$(cd "$(dirname "$0")/../../../.." && pwd)
if netstat -ano | grep -q ":$PORT .*LISTENING"; then echo "cổng $PORT bận"; exit 1; fi
mkdir -p "$OUT"
( cd "$W/server" && unset DATABASE_URL REDIS_URL && export GAME_TEST=1 PORT=$PORT && exec node --import tsx src/index.ts > "$OUT/server.log" 2>&1 ) &
BP=$!; sleep 1; WP=$(cat /proc/$BP/winpid 2>/dev/null); echo "winpid server $WP"
for i in $(seq 1 60); do curl -s http://localhost:$PORT/health >/dev/null && break; sleep 1; done
for T in $TAGS; do GOTO=$GOTO node "$W/tools/assets/skill-vfx/preview/real.mjs" http://localhost:$PORT "$OUT/frames" "$(cygpath -w "$OUT/chrome-$T-$RANDOM")" $T "$JOBS"; done
taskkill //PID $WP //T //F >/dev/null 2>&1; kill $BP 2>/dev/null
echo done
