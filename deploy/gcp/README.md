# Dựng GCP cho CI/CD của game (K2, #500)

Chủ repo tự chạy (cần quyền admin ở project GCP). Worker / agent **không** chạy lệnh nào vào GCP thật. Luồng tổng thể: xem `docs/deploy.md`.

Kết quả sau khi chạy:
- Artifact Registry `soul-land` (docker, `asia-southeast1`), image `asia-southeast1-docker.pkg.dev/landing-page-455614/soul-land/game`.
- Workload Identity Federation: GitHub Actions của đúng repo `nguyenbinhanltv/soul-land-mmo`, đúng nhánh `main`, đẩy image **không cần key JSON**.
- Service account **writer** (`soul-land-ci-push`, chỉ `artifactregistry.writer` trên repo `soul-land`) cho CI.
- Service account **reader** (`soul-land-ar-pull`, chỉ `artifactregistry.reader`) cho cụm K8s kéo image.

## 1. Chạy script

```bash
gcloud auth login                       # tài khoản có quyền admin project landing-page-455614
deploy/gcp/setup.sh --dry-run           # xem trước các lệnh gcloud, không chạm GCP
deploy/gcp/setup.sh                     # chạy thật (hỏi xác nhận project); chạy lại bao nhiêu lần cũng được
```

Script idempotent: tài nguyên đã có thì bỏ qua (riêng provider WIF được cập nhật lại điều kiện, chính sách dọn được ghi lại). Giá trị mặc định đổi được bằng biến môi trường (đầu file `setup.sh`), ví dụ `CLEANUP_DRY_RUN=true` để chính sách dọn chỉ mô phỏng.

Cuối script in hai giá trị cần đặt ở GitHub (mục 2).

## 2. Biến GitHub Actions của repo game

Settings → Secrets and variables → Actions:

| Loại | Tên | Giá trị |
| --- | --- | --- |
| Variable hoặc Secret | `GCP_WIF_PROVIDER` | dòng `projects/<số project>/locations/global/workloadIdentityPools/github-actions/providers/github` script in ra |
| Variable hoặc Secret | `GCP_SA_EMAIL` | `soul-land-ci-push@landing-page-455614.iam.gserviceaccount.com` |
| Secret | `GITOPS_TOKEN` | xem mục 3 |

Hai giá trị này không phải khoá bí mật (để Variable hay Secret đều được). Không có key JSON nào ở GitHub.

Provider WIF chỉ nhận token có `repository == nguyenbinhanltv/soul-land-mmo`, `ref == refs/heads/main`, sự kiện `workflow_run` / `workflow_dispatch` và workflow `release.yml` / `promote.yml` (thêm workflow mới cần mượn quyền thì sửa điều kiện ở `setup.sh` rồi chạy lại). Nên chạy kèm `GITHUB_REPO_ID=$(gh api repos/nguyenbinhanltv/soul-land-mmo --jq .id) deploy/gcp/setup.sh` để quyền gắn theo id repo bất biến (chống tạo lại repo cùng tên). `release.yml` (chạy sau CI của main bằng `workflow_run`) và `promote.yml` (`workflow_dispatch`) đều chạy trên nhánh mặc định nên khớp điều kiện; PR hay nhánh khác không lấy được quyền.

## 3. `GITOPS_TOKEN` (cho `promote.yml`)

`promote.yml` mở PR ở repo `nguyenbinhanltv/soul-land-gitops` (private) để đổi tag image. Cần một token **chỉ** ghi vào repo đó:

- **Fine-grained PAT:** GitHub → Settings → Developer settings → Fine-grained tokens → Resource owner `nguyenbinhanltv`, *Only select repositories* = `soul-land-gitops`, quyền Repository: **Contents: Read and write**, **Pull requests: Read and write** (Metadata: Read tự có). Hết hạn đặt ≤ 90 ngày, nhớ xoay.
- Hoặc **GitHub App** cài chỉ vào `soul-land-gitops` với đúng hai quyền trên (không phải xoay tay; cần đổi `promote.yml` sang `actions/create-github-app-token`).

Đặt vào secret `GITOPS_TOKEN` của repo game. Token không được có quyền ở repo game hay repo khác.

## 4. Pull secret `ar-pull` cho cụm K8s

Cụm kéo image bằng service account **reader**. Key JSON chỉ tồn tại **cục bộ**, ngắn ngủi: tạo → đóng gói thành SealedSecret → xóa. Chỉ SealedSecret (đã mã hóa) được commit vào repo GitOps.

```bash
# 1) Tạo key (file cục bộ, KHÔNG commit, KHÔNG gửi qua chat / CI)
KEY=$(mktemp)
gcloud iam service-accounts keys create "$KEY" \
  --iam-account soul-land-ar-pull@landing-page-455614.iam.gserviceaccount.com

# 2) Dựng Secret dockerconfigjson (không áp vào cụm: --dry-run=client) rồi mã hóa bằng kubeseal
kubectl create secret docker-registry ar-pull \
  --namespace soul-land \
  --docker-server=asia-southeast1-docker.pkg.dev \
  --docker-username=_json_key \
  --docker-password="$(cat "$KEY")" \
  --dry-run=client -o yaml \
  | kubeseal --format yaml --controller-namespace <ns của sealed-secrets> --controller-name <tên controller> \
  > ar-pull-sealed.yaml

# 3) Xóa key cục bộ ngay
shred -u "$KEY" 2>/dev/null || rm -f "$KEY"
```

Đặt `ar-pull-sealed.yaml` vào repo GitOps đúng chỗ (xem README repo đó), merge, ArgoCD sync. Tên và namespace trong SealedSecret phải đúng `ar-pull` / `soul-land` (SealedSecret gắn chặt tên + namespace).

**Xoay 90 ngày:** lặp lại bước 1–3 với key mới, merge SealedSecret mới, kiểm pod kéo được image, rồi xóa key cũ:

```bash
gcloud iam service-accounts keys list --iam-account soul-land-ar-pull@landing-page-455614.iam.gserviceaccount.com
gcloud iam service-accounts keys delete <KEY_ID> --iam-account soul-land-ar-pull@landing-page-455614.iam.gserviceaccount.com
```

Đặt nhắc lịch 90 ngày. Nâng cấp sau (không cần bây giờ): WIF cho chính cụm (cần OIDC issuer công khai) hoặc CronJob làm mới token.

## 5. Dọn image

Chính sách của Artifact Registry (script đặt ở bước 3):
- **Giữ mãi** mọi bản có tag `prod-<sha7>`: `promote.yml` gắn tag này vào bản được promote ngay khi mở PR, nên bản đang chạy ở prod và các bản prod trước đó (dùng để quay lui bằng revert PR promote) không bị xóa dù `main` ra bao nhiêu commit.
- Các tag `sha-*` khác: giữ 30 bản mới nhất; cũ hơn 14 ngày (`TAGGED_DAYS`) và ngoài 30 bản đó thì xóa.
- Bản không tag quá 14 ngày thì xóa.

Hệ quả: chỉ bản **chưa từng promote** mới bị dọn. Bản prod đầu tiên (nếu đặt tag tay trước khi có `promote.yml`) cần gắn tay `gcloud artifacts docker tags add <image>:sha-xxxxxxx <image>:prod-xxxxxxx`. Muốn thử chính sách trước: `CLEANUP_DRY_RUN=true deploy/gcp/setup.sh`, rồi xem log kiểm toán (Cloud Logging) để biết sẽ xóa gì. Muốn bỏ bớt `prod-*` cũ thì xóa tag tay.

## 6. Kiểm nhanh sau khi chạy

```bash
gcloud artifacts repositories describe soul-land --location asia-southeast1 --project landing-page-455614
gcloud iam workload-identity-pools providers describe github --location global \
  --workload-identity-pool github-actions --project landing-page-455614 --format='value(attributeCondition)'
```

Rồi chạy tay workflow `Release` (hoặc merge một PR vào `main`): lượt đạt sẽ đẩy `sha-<7 ký tự>` và `main` lên registry.
