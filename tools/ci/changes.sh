#!/usr/bin/env bash
# Chọn mức bot của CI theo file PR thay đổi (job `changes` trong .github/workflows/check.yml).
# Cách gọi: git diff --name-only <base>...<head> | LABELS="ci:full,agent:x" tools/ci/changes.sh
#   stdin: mỗi dòng một đường dẫn file đổi; LABELS: nhãn của PR, ngăn bằng dấu phẩy; FORCE_FULL=1 luôn ra full.
#   PUSH=1 (push vào main): quy tắc chặt hơn, chỉ file thuần ảnh / tài liệu (danh sách ở mức assets dưới) mới ra assets; âm thanh, tiles và mọi thứ
#   khác ở shared/assets/** vẫn full. Nhãn không áp dụng. Không đọc được danh sách file (push đầu tiên, force push) thì full.
#   Mốc so sánh của push do check.yml chọn: commit của lượt CI main thành công gần nhất (lượt bị hủy không làm lượt sau ra skip, #1079), không phải commit ngay trước.
# In ra dòng `level=assets|skip|smoke|full` và `reason=...` (ghi vào $GITHUB_OUTPUT nếu có), kèm bảng tóm tắt ở $GITHUB_STEP_SUMMARY.
# Quy tắc theo từng file, mức cao nhất thắng (assets < skip < smoke < full); file không khớp quy tắc nào thì coi là full (không chắc thì full):
#   assets: art/**, shared/assets/sprites/** (ảnh, *_n.png, manifest.json), shared/assets/credits/credits.json, *.md, docs/**, .claude/**.
#          Mức riêng, KHÔNG phải skip: chỉ chạy `assets-check` (check.yml), bỏ check-build / bot / trình duyệt / docker. Release vẫn dựng image
#          (ảnh nằm trong image: release.yml chỉ xét file đổi, không xét mức CI). Chỉ PR có tờ art/src/beast-anim, ui-kit mới thêm beast-/ui-sheet-check.
#   skip : (chỉ PR) còn lại trong shared/assets/** không phải bản đồ: âm thanh, manifest âm thanh, iso/tiles.json, ảnh ngoài sprites/ (vẫn chạy check-build ubuntu)
#   smoke: mã giao diện client (client/src/** còn lại, CSS, html), trừ các file gửi / nhận tin server
#   full : còn lại, gồm server/**, shared/**, client/src/net.ts, predict.ts, hud.ts, autoPanel.ts, main.ts, scenes/GameScene.ts,
#          client/scripts/**, tools/**, .github/**, package*.json, server/sql/**, file bản đồ shared/assets/<bản đồ>[.v2].json
set -uo pipefail
rank() { case "$1" in assets) echo 0 ;; skip) echo 1 ;; smoke) echo 2 ;; *) echo 3 ;; esac; }
# Thuần ảnh / tài liệu (mức assets, dùng chung cho PR và push).
assets_file() {
  case "$1" in
    .github/*|tools/ci/*) return 1 ;; # đổi CI luôn theo quy tắc full dù là .md
    art/*|*.md|docs/*|.claude/*|shared/assets/credits/credits.json) return 0 ;;
    shared/assets/sprites/*.png|shared/assets/sprites/*.webp|shared/assets/sprites/manifest.json) return 0 ;; # `*` trong case khớp cả dấu /
  esac
  return 1
}
classify() {
  if assets_file "$1"; then echo assets; return; fi
  if [ -n "${PUSH:-}" ]; then echo full; return; fi
  case "$1" in
    # Mã gửi / nhận tin server (client/src có room.send / onMessage) và mọi thứ chạm luật chơi: full.
    server/*|shared/*.ts|shared/data/*|client/src/net.ts|client/src/predict.ts|client/src/hud.ts|client/src/autoPanel.ts|client/src/main.ts|client/src/scenes/GameScene.ts) echo full ;;
    client/scripts/*|.github/*|tools/ci/*|*package.json|*package-lock.json|*npm-shrinkwrap.json|Dockerfile|docker-compose.yml) echo full ;;
    # File bản đồ (server đọc để dựng vùng, cổng, tinh anh) nằm cạnh ảnh trong shared/assets: không được bỏ qua.
    shared/assets/*/*.json)
      case "$1" in shared/assets/audio/*manifest.json|shared/assets/iso/tiles.json) echo skip ;; *) echo full ;; esac ;;
    shared/assets/*.json) echo full ;;
    shared/assets/*.png|shared/assets/*.webp|shared/assets/*.ogg|shared/assets/*.m4a|shared/assets/*.mp3|shared/assets/*.wav) echo skip ;;
    client/src/*.ts|client/src/*/*.ts|client/src/*.css|client/index.html) echo smoke ;;
    *) echo full ;;
  esac
}
level=assets; reason=""; why_full=""; why_smoke=""; n=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  n=$((n + 1)); l=$(classify "$f")
  [ "$l" = full ] && [ "$(echo "$why_full" | wc -w)" -lt 8 ] && why_full="$why_full $f"
  [ "$l" = smoke ] && [ "$(echo "$why_smoke" | wc -w)" -lt 8 ] && why_smoke="$why_smoke $f"
  [ "$(rank "$l")" -gt "$(rank "$level")" ] && level=$l
done
case "$level" in
  full) reason="file kích full:${why_full}" ;;
  smoke) reason="chỉ đổi mã giao diện client:${why_smoke}" ;;
  skip) reason="chỉ đổi âm thanh / ảnh ngoài sprites / dữ liệu tĩnh ($n file)" ;;
  *) reason="chỉ đổi ảnh / sprite / ghi công / tài liệu ($n file)"; [ -n "${PUSH:-}" ] && reason="push chỉ đổi ảnh / sprite / ghi công / tài liệu ($n file)" ;;
esac
[ "$n" -eq 0 ] && { level=full; reason="không đọc được danh sách file đổi (không chắc thì full)"; }
case ",${LABELS:-}," in *,ci:full,*) level=full; reason="nhãn ci:full" ;; esac
case ",${LABELS:-}," in *,ci:bot-khoi,*) { [ "$level" = skip ] || [ "$level" = assets ]; } && { level=smoke; reason="nhãn ci:bot-khoi"; } ;; esac
[ -n "${FORCE_FULL:-}" ] && { level=full; reason="FORCE_FULL"; }
echo "level=$level"; echo "reason=$reason"
[ -n "${GITHUB_OUTPUT:-}" ] && { echo "level=$level"; echo "reason=$reason"; } >>"$GITHUB_OUTPUT"
[ -n "${GITHUB_STEP_SUMMARY:-}" ] && echo "### Mức bot CI: \`$level\` — $reason" >>"$GITHUB_STEP_SUMMARY"
exit 0
