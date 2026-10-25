# Vận hành (docs/ops)

Chạy game ở máy, CI / CD, deploy lên prod. Thiết kế game ở `docs/design`, kiến trúc ở `docs/tech`, ảnh / âm thanh ở `docs/art`.

| Việc | Trang |
|---|---|
| Lệnh dev, bot, PostgreSQL / Supabase test, tài khoản test, lệnh GM, nhiều phiên song song | [chay-local.md](chay-local.md) |
| CI của PR: job, mức bot, cách đọc kết quả | [ci.md](ci.md) |
| Release → Promote → ArgoCD, quay lui, thông số image / pod, thiết lập GCP một lần | [trien-khai.md](trien-khai.md) (cùng `deploy/gcp/README.md`) |
| Repo GitOps `soul-land-gitops` (chỉ liên kết, không bí mật) | [gitops.md](gitops.md) |
| DB, migration, Redis, sao lưu | [db-redis-sao-luu.md](db-redis-sao-luu.md) |
| Đăng nhập Google (`GOOGLE_CLIENT_ID` ConfigMap, `GOOGLE_TICKET_SECRET` Secret riêng ngoài SealedSecret) | [sso-google.md](sso-google.md) |
| Cache tài sản tĩnh, Cloudflare | [cache-cloudflare.md](cache-cloudflare.md) |
| Kho asset riêng (gói giấy phép hạn chế) | [../asset-rieng.md](../asset-rieng.md) |
| Tài khoản test cho chủ repo | [../test-accounts.md](../test-accounts.md) |
| Làm việc liên tục 24/7 cho agent của collaborator | [../lam-viec-lien-tuc.md](../lam-viec-lien-tuc.md) |
| Sự cố hay gặp | [su-co.md](su-co.md) |

## Sắp đổi (chưa làm)
Trang giới thiệu (landing, #656) sắp đổi route: `/` → landing, `/choi` → game. **Hiện tại `/` vẫn là game.** Khi đổi, cần rà lại ở đây: Authorized JavaScript origins và đường dẫn Google, rule Cloudflare (bypass theo đường dẫn), probe `/health` / `/live`, `robots.txt` / `sitemap.xml`, và các liên kết trong `docs/ops/`. Các trang trong thư mục này vẫn mô tả route hiện hành.

## Luật chung cho vận hành
- Prod là một bản, không staging; merge `main` không tự deploy (Q31 ở `docs/quyet-dinh.md`).
- Supabase là DB **test**; prod không bao giờ trỏ từ máy dev, bot, đo tải, `seed:test` (Q39 ở `docs/quyet-dinh.md`).
- Không ghi key / mật khẩu / giá trị Secret vào repo, issue, PR, log.
- Worker / agent không chạy lệnh vào GCP, cụm hay repo GitOps thật.
