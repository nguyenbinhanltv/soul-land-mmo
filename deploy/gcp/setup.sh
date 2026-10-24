#!/usr/bin/env bash
# Dựng phần GCP cho CI/CD của game (K2, #500): Artifact Registry, chính sách dọn, Workload Identity Federation cho GitHub Actions,
# service account đẩy image (writer) và service account kéo image cho cụm K8s (reader).
# CHỦ REPO tự chạy (cần quyền Owner hoặc đủ quyền admin ở project). Chạy lại nhiều lần an toàn (mỗi tài nguyên: có rồi thì bỏ qua / cập nhật).
# Không tạo key JSON nào (key của reader tạo CỤC BỘ theo deploy/gcp/README.md). Không in bí mật.
#
# Cách dùng:  deploy/gcp/setup.sh [--dry-run]     (--dry-run: chỉ in các lệnh gcloud sẽ chạy, không chạm GCP)
# Ghi đè giá trị mặc định bằng biến môi trường: GCP_PROJECT, GCP_REGION, AR_REPO, GITHUB_REPO, GITHUB_REF_ALLOWED, WIF_POOL, WIF_PROVIDER_ID,
# SA_WRITER, SA_READER, KEEP_TAGGED, UNTAGGED_DAYS, CLEANUP_DRY_RUN=true (chính sách dọn chỉ mô phỏng, không xóa thật).
set -euo pipefail

PROJECT=${GCP_PROJECT:-landing-page-455614}
REGION=${GCP_REGION:-asia-southeast1}
REPO=${AR_REPO:-soul-land}
GH_REPO=${GITHUB_REPO:-nguyenbinhanltv/soul-land-mmo}
GH_REF=${GITHUB_REF_ALLOWED:-refs/heads/main}
POOL=${WIF_POOL:-github-actions}
PROVIDER=${WIF_PROVIDER_ID:-github}
SA_WRITER=${SA_WRITER:-soul-land-ci-push}
SA_READER=${SA_READER:-soul-land-ar-pull}
KEEP_TAGGED=${KEEP_TAGGED:-30}
UNTAGGED_DAYS=${UNTAGGED_DAYS:-14}
CLEANUP_DRY_RUN=${CLEANUP_DRY_RUN:-false}

DRY=0
case "${1:-}" in
  "") ;;
  --dry-run) DRY=1 ;;
  *) echo "Cách dùng: $0 [--dry-run]" >&2; exit 2 ;;
esac

# Chạy lệnh (hoặc chỉ in khi --dry-run).
run() { if [ "$DRY" = 1 ]; then echo "+ $*"; else "$@"; fi; }
# Lệnh chỉ đọc để kiểm tra tồn tại: --dry-run coi như chưa có.
exists() { [ "$DRY" = 0 ] && "$@" >/dev/null 2>&1; }
step() { echo; echo "== $*"; }

if [ "$DRY" = 0 ]; then
  command -v gcloud >/dev/null || { echo "Thiếu gcloud (https://cloud.google.com/sdk/docs/install)" >&2; exit 1; }
  ACCOUNT=$(gcloud config get-value account 2>/dev/null || true)
  [ -n "$ACCOUNT" ] || { echo "Chưa đăng nhập: chạy 'gcloud auth login'" >&2; exit 1; }
  echo "Tài khoản gcloud: $ACCOUNT"
fi
echo "Project: $PROJECT | Region: $REGION | Registry: $REPO | Repo GitHub: $GH_REPO ($GH_REF)"
if [ "$DRY" = 0 ] && [ -t 0 ]; then
  read -r -p "Tiếp tục với project '$PROJECT'? [y/N] " ok
  [ "$ok" = y ] || [ "$ok" = Y ] || { echo "Đã hủy."; exit 1; }
fi

if [ "$DRY" = 1 ]; then PROJECT_NUMBER="<PROJECT_NUMBER>"; else PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)'); fi
WRITER_EMAIL="$SA_WRITER@$PROJECT.iam.gserviceaccount.com"
READER_EMAIL="$SA_READER@$PROJECT.iam.gserviceaccount.com"

step "1. Bật API"
run gcloud services enable artifactregistry.googleapis.com iam.googleapis.com iamcredentials.googleapis.com \
  sts.googleapis.com cloudresourcemanager.googleapis.com --project "$PROJECT"

step "2. Artifact Registry '$REPO' (docker, $REGION)"
if exists gcloud artifacts repositories describe "$REPO" --location "$REGION" --project "$PROJECT"; then
  echo "đã có, bỏ qua"
else
  run gcloud artifacts repositories create "$REPO" --repository-format=docker --location "$REGION" --project "$PROJECT" \
    --description="Image game Đấu La (CI đẩy, cụm K8s kéo)"
fi

step "3. Chính sách dọn: giữ $KEEP_TAGGED bản mới nhất, xóa bản không tag quá $UNTAGGED_DAYS ngày (dry-run=$CLEANUP_DRY_RUN)"
# KEEP thắng DELETE: bản nằm trong $KEEP_TAGGED bản mới nhất không bao giờ bị xóa; bản có tag cũ hơn 1 ngày và ngoài nhóm đó bị xóa.
# Bản đang chạy ở prod phải nằm trong nhóm giữ lại (hoặc đủ mới), xem mục "Dọn image" ở README.
POLICY=$(mktemp)
trap 'rm -f "$POLICY"' EXIT
cat >"$POLICY" <<JSON
[
  {"name": "xoa-khong-tag", "action": {"type": "Delete"}, "condition": {"tagState": "untagged", "olderThan": "$((UNTAGGED_DAYS * 86400))s"}},
  {"name": "giu-moi-nhat", "action": {"type": "Keep"}, "mostRecentVersions": {"keepCount": $KEEP_TAGGED}},
  {"name": "xoa-tag-cu", "action": {"type": "Delete"}, "condition": {"tagState": "tagged", "olderThan": "86400s"}}
]
JSON
if [ "$DRY" = 1 ]; then cat "$POLICY"; fi
if [ "$CLEANUP_DRY_RUN" = true ]; then DRYFLAG=--dry-run; else DRYFLAG=--no-dry-run; fi
run gcloud artifacts repositories set-cleanup-policies "$REPO" --location "$REGION" --project "$PROJECT" --policy="$POLICY" "$DRYFLAG"

step "4. Workload Identity pool '$POOL' + provider OIDC GitHub '$PROVIDER'"
if exists gcloud iam workload-identity-pools describe "$POOL" --location global --project "$PROJECT"; then
  echo "pool đã có, bỏ qua"
else
  run gcloud iam workload-identity-pools create "$POOL" --location global --project "$PROJECT" --display-name "GitHub Actions"
fi
# Chỉ token của đúng repo + đúng nhánh ($GH_REF) đổi được lấy quyền. workflow_run / workflow_dispatch chạy trên nhánh mặc định nên ref là main.
CONDITION="assertion.repository == '$GH_REPO' && assertion.ref == '$GH_REF'"
PROVIDER_ARGS=(--location global --project "$PROJECT" --workload-identity-pool "$POOL" --issuer-uri "https://token.actions.githubusercontent.com"
  --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref"
  --attribute-condition "$CONDITION")
if exists gcloud iam workload-identity-pools providers describe "$PROVIDER" --location global --project "$PROJECT" --workload-identity-pool "$POOL"; then
  echo "provider đã có: cập nhật điều kiện"
  run gcloud iam workload-identity-pools providers update-oidc "$PROVIDER" "${PROVIDER_ARGS[@]}"
else
  run gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" "${PROVIDER_ARGS[@]}"
fi

step "5. Service account writer '$SA_WRITER' (CI đẩy image)"
if exists gcloud iam service-accounts describe "$WRITER_EMAIL" --project "$PROJECT"; then
  echo "đã có, bỏ qua"
else
  run gcloud iam service-accounts create "$SA_WRITER" --project "$PROJECT" --display-name "CI đẩy image game (GitHub Actions)"
fi
run gcloud artifacts repositories add-iam-policy-binding "$REPO" --location "$REGION" --project "$PROJECT" \
  --member "serviceAccount:$WRITER_EMAIL" --role roles/artifactregistry.writer --condition=None
# Chỉ workflow của đúng repo (đã lọc nhánh ở provider) mượn được SA này.
run gcloud iam service-accounts add-iam-policy-binding "$WRITER_EMAIL" --project "$PROJECT" --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository/$GH_REPO"

step "6. Service account reader '$SA_READER' (cụm K8s kéo image)"
if exists gcloud iam service-accounts describe "$READER_EMAIL" --project "$PROJECT"; then
  echo "đã có, bỏ qua"
else
  run gcloud iam service-accounts create "$SA_READER" --project "$PROJECT" --display-name "Cụm K8s kéo image game (chỉ đọc)"
fi
run gcloud artifacts repositories add-iam-policy-binding "$REPO" --location "$REGION" --project "$PROJECT" \
  --member "serviceAccount:$READER_EMAIL" --role roles/artifactregistry.reader --condition=None

WIF_PROVIDER="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/providers/$PROVIDER"
cat <<OUT

================================================================
XONG. Đặt ở GitHub repo $GH_REPO (Settings > Secrets and variables > Actions > tab Variables):
  GCP_WIF_PROVIDER = $WIF_PROVIDER
  GCP_SA_EMAIL     = $WRITER_EMAIL
Image: $REGION-docker.pkg.dev/$PROJECT/$REPO/game
Reader (tạo pull secret 'ar-pull' cho cụm): $READER_EMAIL, xem deploy/gcp/README.md mục 4.
(Secret GITOPS_TOKEN cho promote.yml tạo riêng theo README mục 3.)
================================================================
OUT
