# Triển khai (CI/CD lên Kubernetes + ArgoCD)

Luồng một chiều, không có staging, chỉ có prod `https://soulland.oleqima.com` (một bản, `Recreate`):

```
PR → CI (check.yml) → merge main → Release (release.yml) → promote (promote.yml, chạy tay) → PR ở repo GitOps → merge → ArgoCD sync
```

| Bước | Ai / cái gì | Kết quả |
| --- | --- | --- |
| 1. Merge vào `main` | người / agent, sau khi CI xanh | CI chạy lại trên `main` |
| 2. **Release** (`.github/workflows/release.yml`) | tự chạy khi CI của `main` xanh (`workflow_run`), hoặc chạy tay trên `main` | Dựng image, chạy thử container với PostgreSQL tạm (bot khói), Trivy chặn CRITICAL; đạt mới đẩy `asia-southeast1-docker.pkg.dev/landing-page-455614/soul-land/game:sha-<7 ký tự>` và `:main` |
| 3. **Promote** (`.github/workflows/promote.yml`) | chủ repo chạy tay (Actions → Promote → Run workflow, nhập SHA hoặc để trống = bản main mới nhất) | Mở PR ở `nguyenbinhanltv/soul-land-gitops` đổi `newTag` trong `apps/soul-land/overlays/prod/kustomization.yaml`; **không tự merge** |
| 4. Duyệt + merge PR promote | chủ repo | ArgoCD tự sync; người chơi online bị ngắt khoảng 10–30 giây (đã có `reconnect`) |

Merge `main` **không** tự deploy, vì mỗi lần deploy ngắt người chơi. Kết quả mỗi bước ghi ở GitHub: lượt chạy trong tab Actions (kèm bảng tóm tắt), trạng thái commit `release/image` của commit trên `main`.

## Quay lui

Revert PR promote ở repo GitOps (nút Revert trên PR đã merge, rồi merge PR revert). ArgoCD sync về tag cũ. Tag cũ còn trên registry vì mỗi bản được promote mang thêm tag `prod-<sha7>` (workflow Promote gắn), và chính sách dọn giữ mãi tag `prod-*` (`deploy/gcp/README.md` mục 5). Bản chưa từng promote chỉ giữ 30 bản `sha-*` mới nhất / 14 ngày.

## Kiểm một bản trước khi promote

Release đã chạy bot khói vào chính image đó với DB rỗng. Không chạy bot / đo tải vào DB prod (#406): bot chỉ chạy ở máy (`npm run bot:local`) hoặc trong `release.yml` với service container tạm. `GAME_TEST` không bao giờ bật ở prod; image không chứa nó (chỉ bước thử của release đặt biến này cho container thử).

## Thiết lập một lần (chủ repo)

1. Chạy `deploy/gcp/setup.sh` (Artifact Registry, Workload Identity Federation, hai service account), làm theo `deploy/gcp/README.md`.
2. Ở GitHub repo game đặt `GCP_WIF_PROVIDER`, `GCP_SA_EMAIL` (Variable hoặc Secret đều được: release.yml / promote.yml đọc `vars.X || secrets.X`) và Secret `GITOPS_TOKEN` (hướng dẫn trong README đó).
3. Repo GitOps (`soul-land-gitops`, private): manifest Kustomize, ArgoCD, SealedSecret `soul-land-env` (`DATABASE_URL`) và pull secret `ar-pull`.

## Thông số image / pod (để khớp repo GitOps)

- Image chạy `node --enable-source-maps dist/index.mjs` (JS do esbuild gộp ở tầng build, không có tsx / esbuild trong image; node là PID 1), user `node` (không root), cổng `2567`, `GET /health`.
- `terminationGracePeriodSeconds` = `SHUTDOWN_SAVE_MS` (`server/src/index.ts`, hiện 6000 ms) + 30 giây = 36 giây, `preStop` ngủ 5 giây. Đổi hằng thì đổi theo ở repo GitOps.
- Biến môi trường prod: `PORT`, `TRUST_PROXY=1`, `CLIENT_ORIGIN=https://soulland.oleqima.com`, `NODE_ENV=production`, `DATABASE_URL` (từ secret). Không đặt `GAME_TEST`, `REDIS_URL`, `PUBLIC_ADDRESS` (pha 1 một bản).
