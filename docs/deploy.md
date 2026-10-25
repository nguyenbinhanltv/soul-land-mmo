# Triển khai (CI/CD lên Kubernetes + ArgoCD)

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

Release đã chạy bot khói vào chính image đó với DB rỗng. Không chạy bot / đo tải vào DB prod (#406): bot chỉ chạy ở máy (`npm run bot:local`) hoặc trong `release.yml` với service container tạm. `GAME_TEST` không bao giờ bật ở prod; image không chứa nó (chỉ bước thử của release đặt biến này cho container thử).

## Thiết lập một lần (chủ repo)

1. Chạy `deploy/gcp/setup.sh` (Artifact Registry, Workload Identity Federation, hai service account), làm theo `deploy/gcp/README.md`.
2. Đăng nhập GCP của CI: **hoặc** secret `GCP_SA_KEY` (key JSON của SA writer, tạo bằng `deploy/gcp/setup.sh --sa-key`, xoay 90 ngày; `deploy/gcp/README.md` mục 2b), **hoặc** WIF. Có `GCP_SA_KEY` thì workflow dùng key, không thì dùng WIF; thiếu cả hai thì báo lỗi. Với WIF, ở GitHub repo game đặt `GCP_WIF_PROVIDER`, `GCP_SA_EMAIL` (Variable hoặc Secret đều được: release.yml / promote.yml đọc `vars.X || secrets.X`). Cả hai cách đều cần Secret `GITOPS_TOKEN` (hướng dẫn trong README đó).
3. Repo GitOps (`soul-land-gitops`, private): manifest Kustomize, ArgoCD, SealedSecret `soul-land-env` (`DATABASE_URL`) và pull secret `ar-pull`.

## Đăng nhập Google (chủ repo tạo OAuth client một lần, #612)

Nút "Đăng nhập bằng Google" chỉ hiện khi server có `GOOGLE_CLIENT_ID`; thiếu thì client ẩn nút và game chạy như cũ (tên + mật khẩu). Client ID là cấu hình công khai (không phải bí mật), **không** đưa giá trị thật vào repo.

1. Google Cloud Console, project `landing-page-455614` → **APIs & Services → OAuth consent screen**: loại **External**, điền tên app, email hỗ trợ (logo tuỳ chọn), rồi **Publish app** (để "Testing" thì chỉ email trong Test users vào được). Scope cơ bản `openid` / `email` / `profile` thường không cần Google duyệt.
2. **Credentials → Create credentials → OAuth client ID → Web application**. **Authorized JavaScript origins**: `https://soulland.oleqima.com`, `http://localhost:5173`, `http://localhost:2567`. Không cần Authorized redirect URIs (luồng ID token, không redirect) và không dùng client secret.
3. Đưa Client ID vào ConfigMap của repo GitOps làm biến `GOOGLE_CLIENT_ID` (kiểu `…apps.googleusercontent.com`); chạy dev thì đặt trong `server/.env`.
4. Chạy nhiều tiến trình (nhiều pod) thì đặt thêm `GOOGLE_TICKET_SECRET` (chuỗi ngẫu nhiên dài, đưa vào SealedSecret) để vé chọn tên của pod này đọc được ở pod kia; một bản thì có thể bỏ qua.
5. Kiểm: mở trang, thấy nút Google dưới form đăng nhập; chọn tài khoản Google mới → màn "Chọn tên nhân vật" → tạo nhân vật. Tài khoản cũ: đăng nhập tên + mật khẩu → **Cài đặt → Tài khoản Google** để liên kết.

Server không lưu email, tên hay token Google (chỉ mã người dùng `sub`, bảng `account_identities`). Bộ kiểm giả (`test:<mã>`) chỉ có khi `GAME_TEST=1` và `NODE_ENV` khác `production`; ở prod luôn tắt. Chi tiết luật: `GAME_DESIGN.md` mục HTTP / Bảo mật.

## Thông số image / pod (để khớp repo GitOps)

- Image chạy `node --enable-source-maps dist/index.mjs` (JS do esbuild gộp ở tầng build, không có tsx / esbuild trong image; node là PID 1), user `node` (không root), cổng `2567`, `GET /health`. Có `REDIS_URL` thì `/health` trả 503 khi Redis mất (dùng làm readiness: ngừng chuyển người chơi mới tới, tiến trình không thoát, tự phục hồi); liveness probe dùng `GET /live` (luôn 200 khi tiến trình còn chạy) để k8s không khởi động lại cả tiến trình chỉ vì Redis mất (#561).
- `terminationGracePeriodSeconds` = `SHUTDOWN_SAVE_MS` (`server/src/index.ts`, hiện 6000 ms) + 30 giây = 36 giây, `preStop` ngủ 5 giây. Đổi hằng thì đổi theo ở repo GitOps.
- Biến môi trường prod: `PORT`, `TRUST_PROXY=1`, `CLIENT_ORIGIN=https://soulland.oleqima.com`, `NODE_ENV=production`, `DATABASE_URL` (từ secret), tuỳ chọn `GOOGLE_CLIENT_ID` (và `GOOGLE_TICKET_SECRET` khi nhiều pod; mục "Đăng nhập Google" ở trên). Không đặt `GAME_TEST`, `REDIS_URL`, `PUBLIC_ADDRESS` (pha 1 một bản).

## Cache tài sản tĩnh và Cloudflare (#580)

Origin (`server/src/staticCache.ts`) tự đặt `Cache-Control` cho `client/dist`; Cloudflare chỉ cần cache theo header đó:

| Nhóm | Header origin | Ghi chú |
| --- | --- | --- |
| `/assets/<tên>-<hash>.*` (JS, CSS, font do Vite hash) | `public, max-age=31536000, immutable` | Phaser tách chunk riêng (`phaser-<hash>.js`) nên đổi code game không tải lại Phaser |
| `index.html` | `no-cache` | luôn hỏi lại (ETag, thường 304) vì nó trỏ tới file hash mới |
| ảnh / âm thanh / bản đồ / manifest không hash (`lpcparts`, `sprites`, `iso`, `mini`, `audio`, `*.json`) khi URL có `?v=` | `public, max-age=31536000, immutable` | client gắn `?v=<hash nội dung shared/assets>` (`client/src/assetUrl.ts`, `vite.config.ts`): asset đổi thì URL đổi, không kẹt cache |
| như trên, không có `?v=` (bot, trang thử) | ảnh / âm thanh: `max-age=604800, stale-while-revalidate=86400`; json: `no-cache` | |

Nén: Cloudflare đã nén br cho HTML / JS / JSON từ origin không nén (kiểm bằng `curl -H 'Accept-Encoding: br'`: có `Content-Encoding: br`), nên origin không bật nén; PNG / ogg vốn đã nén.

**Cache Rules cho chủ repo** (Cloudflare → Caching → Cache Rules):

1. Rule "Static game assets": khi `Hostname = soulland.oleqima.com` **và** đường dẫn **không** bắt đầu bằng `/api/`, `/matchmake/`, `/health` (và không phải WebSocket) thì **Eligible for cache**; **Edge TTL**: *Use cache-control header if present* (Respect origin; nếu thiếu header thì 1 tháng); **Browser TTL**: *Respect existing headers*. Cloudflare mặc định chỉ cache theo đuôi file (png, js, css…) và **không cache `.json`**; rule này bật cache cả bản đồ / manifest `.json` (có `?v=`). `index.html` vẫn `no-cache` nên luôn được hỏi lại.
2. Rule "Không cache API": `/api/*`, `/matchmake/*` (và `/health`) → **Bypass cache**. WebSocket (Colyseus) tự không qua cache; không đặt rule cho nó.
3. Không dùng "Override origin" cho Browser TTL: ghi đè 4 giờ như hiện nay (`max-age=14400` ở `/assets/*`) làm mất `immutable` và bắt người chơi tải lại sau 4 giờ.
4. Sau khi deploy bản này, kiểm: `curl -sI 'https://soulland.oleqima.com/lpcparts/<sheet>.png?v=<v>' | grep -i 'cache-control\|cf-cache-status'` lần hai phải `cf-cache-status: HIT`.

Client tải bền (`client/src/assetUrl.ts`): tối đa 12 file cùng lúc (Phaser loader và hàng đợi riêng của `lpcRig.ts`), lỗi mạng / 5xx thì thử lại 5 lần với backoff 0,4 / 1,2 / 3,6 / 8 / 8 giây (± nhiễu); hết lần thì hình dự phòng (thiếu lớp LPC, preset) và `lpcRig` tải lại sheet đó sau 30 giây. Thử tải lỗi ở máy: server `GAME_TEST=1 ASSET_FAIL_RATE=0.3` trả 504 ngẫu nhiên cho 30% request png / json / ogg / m4a (không có tác dụng khi thiếu `GAME_TEST`). Atlas / nén PNG để giảm số file (#556) thêm vào `assetUrl.ts` được: chỉ cần URL đi qua `assetUrl()`.
