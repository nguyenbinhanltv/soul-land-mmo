# Đăng nhập Google (SSO)

Chủ repo tạo OAuth client một lần. Nút "Đăng nhập bằng Google" chỉ hiện khi server có `GOOGLE_CLIENT_ID`; thiếu thì client ẩn nút và game chạy như cũ (tên + mật khẩu). Client ID là cấu hình công khai (không phải bí mật), **không** đưa giá trị thật vào repo. Luật chơi và giao thức: `docs/tech/giao-thuc-server.md` ("Đăng nhập Google").

## Nơi đặt từng biến
| Biến | Đặt ở đâu | Ghi chú |
|---|---|---|
| `GOOGLE_CLIENT_ID` | **ConfigMap** của repo GitOps (xem `docs/ops/gitops.md`); chạy dev thì `server/.env` | dạng `…apps.googleusercontent.com`; công khai, `GET /api/config` trả cho client |
| `GOOGLE_TICKET_SECRET` | **Secret `soul-land-env`** trên cụm (chủ repo tạo tay, không Sealed Secrets; deployment nạp bằng `envFrom` `secretRef`, cùng chỗ với `DATABASE_URL`) | chuỗi ngẫu nhiên dài; **chỉ cần khi chạy nhiều tiến trình / pod**, để vé chọn tên của pod này đọc được ở pod kia; một bản thì có thể bỏ qua |

Prod hiện là một bản, nên `GOOGLE_TICKET_SECRET` chưa bắt buộc. Thiếu thì server dùng khoá ngẫu nhiên và in một dòng cảnh báo.

## Tạo OAuth client (một lần)
1. Google Cloud Console, project `landing-page-455614` → **APIs & Services → OAuth consent screen**: loại **External**, điền tên app, email hỗ trợ (logo tuỳ chọn), rồi **Publish app** (để "Testing" thì chỉ email trong Test users vào được). Scope cơ bản `openid` / `email` / `profile` thường không cần Google duyệt.
2. **Credentials → Create credentials → OAuth client ID → Web application**. **Authorized JavaScript origins**: `https://soulland.oleqima.com`, `http://localhost:5173`, `http://localhost:2567`. Không cần Authorized redirect URIs (luồng ID token, không redirect) và không dùng client secret.
3. Đưa Client ID vào ConfigMap (bảng trên).
4. (Nhiều pod) Tạo `GOOGLE_TICKET_SECRET` bằng `openssl rand -hex 32` hoặc `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, đặt khoá vào Secret `soul-land-env` trên cụm (chủ repo tạo tay, không Sealed Secrets), rồi `kubectl rollout restart` deployment để pod nhận giá trị mới; không dán giá trị vào repo, issue, PR, log.

## Kiểm
Mở trang, thấy nút Google dưới form đăng nhập; chọn tài khoản Google mới → màn "Chọn tên nhân vật" → tạo nhân vật. Tài khoản cũ: đăng nhập tên + mật khẩu → **Cài đặt → Tài khoản Google** để liên kết.

## Dữ liệu và thử ở máy
Server không lưu email, tên hay token Google (chỉ mã người dùng `sub`, bảng `account_identities`). Bộ kiểm giả (`test:<mã>`) chỉ có khi `GAME_TEST=1` và `NODE_ENV` khác `production`; ở prod luôn tắt. Thử: `npm run test:google --prefix server`, `npm run bot:local -- --only google [--pg]`.

## Issue liên quan
#612 (đăng nhập Google), #615 (SSO2).
