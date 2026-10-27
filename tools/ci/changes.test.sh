#!/usr/bin/env bash
# Thử tools/ci/changes.sh với danh sách file mẫu (mức assets, #1118). Chạy: bash tools/ci/changes.test.sh
# Mỗi ca: <mong đợi> | <biến môi trường> | <file cách nhau dấu cách>
cd "$(dirname "$0")/../.." || exit 1
fail=0
t() {
  local want=$1 envs=$2; shift 2
  local got
  got=$(printf '%s\n' "$@" | env $envs bash tools/ci/changes.sh 2>/dev/null | sed -n 's/^level=//p')
  if [ "$got" = "$want" ]; then echo "✓ $want  [$envs] $*"; else echo "✗ mong $want, ra $got  [$envs] $*"; fail=1; fi
}
S=shared/assets/sprites
# PR
t assets X=1 art/src/a.png $S/beast/x/a.png $S/beast/x/a_n.png
t assets X=1 $S/a.png $S/manifest.json shared/assets/credits/credits.json docs/x.md art/CREDITS.md
t smoke  X=1 $S/a.png client/src/sprites.ts
t full   X=1 $S/a.png client/src/hud.ts
t full   X=1 $S/a.png tools/assets/x.mjs
t full   X=1 $S/a.png shared/assets/ban-do.json
t full   X=1 $S/a.png shared/assets/ban-do.v2.json
t full   X=1 $S/a.png shared/data.ts
t full   X=1 $S/a.png server/src/x.ts
t full   X=1 .github/PULL_REQUEST_TEMPLATE.md
t full   X=1 tools/ci/README.md
t skip   X=1 shared/assets/audio/a.ogg $S/a.png
t skip   X=1 shared/assets/iso/tiles.json
t full   X=1 $S/a.png package.json
t full   LABELS=ci:full,x $S/a.png
t smoke  LABELS=ci:bot-khoi $S/a.png
t full   X=1
# Push main
t assets PUSH=1 $S/a.png docs/x.md art/a.png shared/assets/credits/credits.json
t full   PUSH=1 $S/a.png shared/assets/audio/a.ogg
t full   PUSH=1 $S/a.png client/src/sprites.ts
t full   PUSH=1 $S/a.png shared/assets/ban-do.json
t full   PUSH=1 LABELS=x server/a.ts
t full   PUSH=1
exit $fail
