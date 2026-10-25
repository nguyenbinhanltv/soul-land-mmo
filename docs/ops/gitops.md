# GitOps: repo `soul-land-gitops`

Trạng thái triển khai của prod nằm ở repo riêng **[nguyenbinhanltv/soul-land-gitops](https://github.com/nguyenbinhanltv/soul-land-gitops)** (private). Trang này chỉ liên kết và ghi cách repo game chạm tới nó; **không chép bí mật, giá trị Secret hay địa chỉ nội bộ** vào đây hay vào repo game.

## Repo GitOps chứa gì
- Manifest Kustomize cho ứng dụng `soul-land`; overlay prod ở `apps/soul-land/overlays/prod/kustomization.yaml` (trường `newTag` là bản image đang chạy).
- Cấu hình ArgoCD (tự sync khi PR được merge).
- ConfigMap (ví dụ `GOOGLE_CLIENT_ID`, `CLIENT_ORIGIN`), SealedSecret `soul-land-env` (`DATABASE_URL`) và pull secret `ar-pull` kéo image từ Artifact Registry. Khoá `GOOGLE_TICKET_SECRET` (khi nhiều pod) chủ repo thêm thẳng vào Secret trên cụm, **không** qua SealedSecret (`docs/ops/sso-google.md`).
- Thông số pod (`terminationGracePeriodSeconds`, `preStop`, probe `/health` / `/live`) phải khớp `server/src/index.ts`: bảng ở `docs/ops/trien-khai.md`.

## Repo game chạm tới GitOps ở đâu
- **Promote** (`.github/workflows/promote.yml`, chủ repo chạy tay) mở PR đổi `newTag`, dùng Secret `GITOPS_TOKEN` của repo game. Không tự merge; chủ repo duyệt và merge, ArgoCD sync. Luồng đầy đủ và quay lui (revert PR promote): `docs/ops/trien-khai.md`.
- Đổi biến môi trường, ConfigMap, Secret: sửa ở repo GitOps, không ở repo game. Biến prod hiện có liệt kê ở `docs/ops/trien-khai.md`; ý nghĩa từng biến: `.env.example`, `docs/ops/sso-google.md`, `docs/ops/db-redis-sao-luu.md`.

## Quy tắc cho agent / worker
- Worker **không** chạy lệnh vào GCP, cụm hay repo GitOps thật; chỉ chủ repo (hoặc orchestrator được giao rõ) thao tác.
- Không đặt `GAME_TEST`, `REDIS_URL` hay `PUBLIC_ADDRESS` ở prod một bản (`docs/ops/trien-khai.md`); không trỏ bot / đo tải / `seed:test` vào DB prod (Q39 ở `docs/quyet-dinh.md`); không đặt `ADMIN_ACCOUNTS` cho server chạy bot hoặc đo tải ngoài máy mình.
