# Triển khai: Release, Promote, ArgoCD

Lên prod: image dựng ở GitHub Actions, đưa lên cụm Kubernetes bằng GitOps + ArgoCD. CI kiểm PR ở `docs/ops/ci.md`; repo GitOps ở `docs/ops/gitops.md`; DB / Redis ở `docs/ops/db-redis-sao-luu.md`; đăng nhập Google ở `docs/ops/sso-google.md`; cache Cloudflare ở `docs/ops/cache-cloudflare.md`.

Luồng một chiều, không có staging, chỉ có prod `https://soulland.oleqima.com` (một bản, `Recreate`):

```
PR → CI (check.yml) → merge main → Release (release.yml) → promote (promote.yml, chạy tay) → PR ở repo GitOps → merge → ArgoCD sync
```

| Bước | Ai / cái gì | Kết quả |
| --- | --- | --- |
| 1. Merge vào `main` | người / agent, sau khi CI xanh | CI chạy lại trên `main` |
| 2. **Release** (`.github/workflows/release.yml`) | tự chạy khi CI của `main` xanh (`workflow_run`), hoặc chạy tay trên `main` | Dựng image, chạy thử container với PostgreSQL tạm (bot khói), Trivy chặn CRITICAL; đạt mới đẩy `asia-southeast1-docker.pkg.dev/landing-page-455614/soul-land/game:sha-<7 ký tự>` và `:main`. Tên lượt chạy là `Release <SHA đầy đủ>` = commit được build; bảng tóm tắt ghi lại commit đó. Tag `main` chỉ dời **tiến** (khi commit là đầu main, hoặc mới hơn theo git so với bản main hiện có), không bao giờ lùi |
| 3. **Promote** (`.github/workflows/promote.yml`) | chủ repo chạy tay (Actions → Promote → Run workflow, nhập SHA hoặc để trống = commit mới nhất trên main đã có tag `sha-*` trên registry, dò ngược 100 commit) | Mở PR ở `nguyenbinhanltv/soul-land-gitops` đổi `newTag` trong `apps/soul-land/overlays/prod/kustomization.yaml`; **không tự merge** |
| 4. Duyệt + merge PR promote | chủ repo | ArgoCD tự sync; người chơi online bị ngắt khoảng 10–30 giây (đã có `reconnect`) |

Một lượt Release chỉ build đúng một commit (SHA ở tên lượt); image `sha-<7>` chứa mọi commit tới commit đó. Gắn tag `prod-<sha7>` của Promote là idempotent: tag đã trỏ đúng digest thì bỏ qua (service account không có quyền `artifactregistry.tags.delete`, nên không bao giờ gắn đè lên tag có sẵn); trỏ digest khác thì báo lỗi.

Merge `main` **không** tự deploy, vì mỗi lần deploy ngắt người chơi. Kết quả mỗi bước ghi ở GitHub: lượt chạy trong tab Actions (kèm bảng tóm tắt), trạng thái commit `release/image` của commit trên `main`.

## Quay lui

Revert PR promote ở repo GitOps (nút Revert trên PR đã merge, rồi merge PR revert). ArgoCD sync về tag cũ. Tag cũ còn trên registry vì mỗi bản được promote mang thêm tag `prod-<sha7>` (workflow Promote gắn), và chính sách dọn giữ mãi tag `prod-*` (`deploy/gcp/README.md` mục 5). Bản chưa từng promote chỉ giữ 30 bản `sha-*` mới nhất / 14 ngày.

## Kiểm một bản trước khi promote

Release đã chạy bot khói vào chính image đó với DB rỗng. Không chạy bot / đo tải vào DB prod: bot chỉ chạy ở máy (`npm run bot:local`) hoặc trong `release.yml` với service container tạm. `GAME_TEST` không bao giờ bật ở prod; image không chứa nó (chỉ bước thử của release đặt biến này cho container thử).

## Thiết lập một lần (chủ repo)

1. Chạy `deploy/gcp/setup.sh` (Artifact Registry, Workload Identity Federation, hai service account), làm theo `deploy/gcp/README.md`.
2. Đăng nhập GCP của CI: **hoặc** secret `GCP_SA_KEY` (key JSON của SA writer, tạo bằng `deploy/gcp/setup.sh --sa-key`, xoay 90 ngày; `deploy/gcp/README.md` mục 2b), **hoặc** WIF. Có `GCP_SA_KEY` thì workflow dùng key, không thì dùng WIF; thiếu cả hai thì báo lỗi. Với WIF, ở GitHub repo game đặt `GCP_WIF_PROVIDER`, `GCP_SA_EMAIL` (Variable hoặc Secret đều được: release.yml / promote.yml đọc `vars.X || secrets.X`). Cả hai cách đều cần Secret `GITOPS_TOKEN` (hướng dẫn trong README đó).
3. Repo GitOps (`soul-land-gitops`, private): manifest Kustomize, ArgoCD, SealedSecret `soul-land-env` (`DATABASE_URL`) và pull secret `ar-pull`; khoá `GOOGLE_TICKET_SECRET` chủ repo thêm thẳng vào Secret trên cụm, không qua SealedSecret (`docs/ops/sso-google.md`).

## Thông số image / pod (để khớp repo GitOps)

- Image chạy `node --enable-source-maps dist/index.mjs` (JS do esbuild gộp ở tầng build, không có tsx / esbuild trong image; node là PID 1), user `node` (không root), cổng `2567`, `GET /health`. Có `REDIS_URL` thì `/health` trả 503 khi Redis mất (dùng làm readiness: ngừng chuyển người chơi mới tới, tiến trình không thoát, tự phục hồi); liveness probe dùng `GET /live` (luôn 200 khi tiến trình còn chạy) để k8s không khởi động lại cả tiến trình chỉ vì Redis mất 
- `terminationGracePeriodSeconds` = `SHUTDOWN_SAVE_MS` (`server/src/index.ts`, hiện 6000 ms) + 30 giây = 36 giây, `preStop` ngủ 5 giây. Đổi hằng thì đổi theo ở repo GitOps.
- Biến môi trường prod: `PORT`, `TRUST_PROXY=1`, `CLIENT_ORIGIN=https://soulland.oleqima.com`, `NODE_ENV=production`, `DATABASE_URL` (từ secret), tuỳ chọn `GOOGLE_CLIENT_ID` (ConfigMap) và `GOOGLE_TICKET_SECRET` (Secret `soul-land-env`, khi nhiều pod; `docs/ops/sso-google.md`). Không đặt `GAME_TEST`, `REDIS_URL`, `PUBLIC_ADDRESS` (pha 1 một bản).

## Issue liên quan
#406 (không đo tải vào DB prod), #500 (CI/CD K1–K3), #504 (release / promote), #561 (Redis mất giữa chừng, `/live` và `/health`), #645 (tag main chỉ dời tiến, promote dò git log, `prod-<sha7>` idempotent).
