# Sự cố hay gặp

Bảng "triệu chứng → nguyên nhân thường gặp → cách xử lý". Chỉ ghi chuyện đã xảy ra hoặc đã có ghi chép ở tài liệu khác (cột cuối trỏ nơi chi tiết).

## Máy dev và bot
| Triệu chứng | Nguyên nhân thường gặp | Xử lý | Chi tiết |
|---|---|---|---|
| `npm run check` chạy rất nhanh, như bỏ qua typecheck | worktree mới chưa có `node_modules` | `npm run install:all` rồi chạy lại; không tin kết quả check khi thiếu thư viện | `docs/ops/chay-local.md` |
| Lượt bot đứng chờ | đã có 2 lượt bot đang chạy trên máy (khoá ở `%TEMP%/soul-bot-slots`) | chờ; lượt thứ 3 tự chạy khi có chỗ. Không tự bật server rời để lách | `docs/ops/chay-local.md` |
| `--pg` không nối được | PostgreSQL chung (cổng `BOT_PG_PORT` 5433) chưa chạy / kẹt | `npm run bot:local -- --pg-status`, `--pg-stop` rồi chạy lại | `docs/ops/chay-local.md` |
| Bot báo bỏ qua phần lớn kiểm tra | server không bật `GAME_TEST=1` hoặc là server cũ | dùng `bot:local` (tự bật đúng); chạy tay thì bật server mới với `GAME_TEST=1` | `docs/ops/chay-local.md` |
| Một bài bot lúc đỏ lúc xanh | bài chập chờn (chờ bản vá state, lịch boss, đặt giá) | theo skill `bot-flakiness`: tái hiện N lượt, đối chứng `main`, chờ theo state; trượt lại là lỗi thật, đọc dòng chẩn đoán | `.claude/skills/bot-flakiness` |
| Máy chậm, worker kẹt, lỗi ghi file | ổ C đầy (từng còn 0 GB) | dọn npm cache, worktree mồ côi, thư mục Temp; kiểm dung lượng trước khi mở thêm phiên song song | ghi chép của orchestrator |
| Cổng bị chiếm | Chrome CDP 9333 đã có người dùng; server dev khác | dùng cổng riêng, chỉ tắt đúng PID mình bật, không tắt theo cổng hay tên | `docs/ops/chay-local.md` |
| Chrome chụp ảnh phát nhạc | thiếu cờ | luôn `--mute-audio` | `docs/ops/chay-local.md` |
| `.git` gốc biến mất sau khi dừng phiên AO | dừng phiên bằng lệnh kill (đã xảy ra hai lần) | dừng phiên bằng `ao session exit-agent`, không dùng kill; khôi phục: clone bare rồi đăng ký lại worktree | ghi chép của orchestrator |

## Database và Redis
| Triệu chứng | Nguyên nhân thường gặp | Xử lý | Chi tiết |
|---|---|---|---|
| Server dev không kết nối được Supabase | project tạm dừng sau ~1 tuần không truy cập (gói miễn phí) | vào dashboard bấm Restore | `docs/ops/db-redis-sao-luu.md` |
| `/health` trả 503 `{redis:"down"}` | Redis mất (chỉ khi bật `REDIS_URL`) | server không thoát, không nhận phiên mới; Redis có lại thì tự phục hồi. `/live` vẫn 200 để k8s không khởi động lại | `docs/tech/presence-redis.md` |
| Hai tiến trình dùng chung dữ liệu lạ | dùng chung một Redis giữa hai cụm / hai lượt | mỗi cụm / lượt một Redis riêng (pub/sub không theo `REDIS_PREFIX`) | `docs/ops/db-redis-sao-luu.md` |
| Migration chạy lần hai lỗi | câu lệnh SQL không chạy lại an toàn | thêm `IF NOT EXISTS`; không sửa file SQL cũ đã chạy, viết file `00N_` mới | skill `db-migration` |

## Release, Promote, prod
| Triệu chứng | Nguyên nhân thường gặp | Xử lý | Chi tiết |
|---|---|---|---|
| Release đỏ ở bước quét | Trivy chặn CRITICAL | cập nhật gói nền / thư viện, chạy lại | `docs/ops/trien-khai.md` |
| Release / Promote báo lỗi đăng nhập GCP | thiếu cả `GCP_SA_KEY` lẫn `GCP_WIF_PROVIDER` + `GCP_SA_EMAIL`, hoặc WIF lỗi | đặt biến theo `deploy/gcp/README.md`; WIF lỗi thì dùng `GCP_SA_KEY` (xoay 90 ngày) | `deploy/gcp/README.md` |
| Promote không tìm thấy bản | commit chưa có tag `sha-<7>` trên registry (Release chưa xong hoặc quá 100 commit) | chờ Release, hoặc nhập SHA cụ thể | `docs/ops/trien-khai.md` |
| Promote báo tag `prod-<sha7>` trỏ digest khác | tag đã có và không bị đè | kiểm commit đã promote; không xoá tag (service account không có quyền) | `docs/ops/trien-khai.md` |
| Người chơi bị ngắt 10–30 giây | ArgoCD sync bản mới (`Recreate`) | bình thường; client tự `reconnect` | `docs/ops/trien-khai.md` |
| Cần quay lui | bản mới lỗi | revert PR promote ở repo GitOps | `docs/ops/gitops.md` |
| Nút Google không hiện | thiếu `GOOGLE_CLIENT_ID` ở ConfigMap | đặt biến (công khai) rồi sync | `docs/ops/sso-google.md` |
| Asset kho riêng không hiện | build không có kho `soul-land-assets-private` | game vẫn chạy bằng hình cũ; cấu hình kho cho CI release | `docs/asset-rieng.md` |
| Cloudflare giữ file cũ | rule cache ghi đè header origin | rule "Respect origin", ảnh có `?v=<hash>` | `docs/ops/cache-cloudflare.md` |
