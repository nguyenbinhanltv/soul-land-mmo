#!/bin/bash
# Dùng: cho-merge.sh <PR> <session-id>
# Chờ AO review đạt ở đúng head hiện tại + CI xanh rồi squash merge. Chạy nền (run_in_background).
# Thoát không merge khi: head đổi giữa chừng, review không đạt, CI đỏ / đang chạy / bị hủy.
# Cần: ao, gh, python3 (hoặc python). Đổi <ĐƯỜNG_DẪN_WORKTREE_ORCHESTRATOR> thành thư mục repo của orchestrator.
P=$1; S=$2
PY=$(command -v python3 || command -v python)
cd "<ĐƯỜNG_DẪN_WORKTREE_ORCHESTRATOR>" || exit 1

H=$(gh pr view "$P" --json headRefOid --jq .headRefOid); echo "#$P head $H"

# 1. Chờ verdict của reviewer ở ĐÚNG head (tối đa ~90 phút, mỗi phút hỏi một lần).
v=""
for i in $(seq 1 90); do
  v=$(ao review ls "$S" --json 2>/dev/null | "$PY" -c "
import json,sys
d=json.load(sys.stdin); r=d if isinstance(d,list) else d.get('reviews',[])
for x in r:
  lr=x.get('latestRun') or {}
  if x.get('prNumber')==$P and (lr.get('targetSha') or '')=='$H': print(lr.get('verdict'))")
  { [ "$v" = approved ] || [ "$v" = changes_requested ]; } && break
  [ "$(gh pr view "$P" --json headRefOid --jq .headRefOid)" = "$H" ] || { echo "#$P head đổi khi chờ review"; exit 0; }
  sleep 60
done
echo "#$P review: $v"
[ "$v" = approved ] || exit 0

# 2. Chờ CI xong, kiểm head chưa đổi và không có check đỏ / đang chạy.
gh pr checks "$P" --watch --interval 60 >/dev/null 2>&1
[ "$(gh pr view "$P" --json headRefOid --jq .headRefOid)" = "$H" ] || { echo "#$P head đổi"; exit 0; }
if gh pr checks "$P" 2>&1 | cut -f2 | grep -qE 'fail|cancel|pending'; then
  gh pr checks "$P" 2>&1 | cut -f1,2 | grep -vE 'pass'
  echo "#$P NOT-MERGED"; exit 0
fi

# 3. Merge đúng bản đã review.
gh pr merge "$P" --squash --match-head-commit "$H" 2>&1 | tail -1
gh pr view "$P" --json state --jq '"#'"$P"' "+.state'
