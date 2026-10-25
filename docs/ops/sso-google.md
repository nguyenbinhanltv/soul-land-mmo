# Đăng nhập Google (SSO)

Chủ repo tạo OAuth client một lần. Nút "Đăng nhập bằng Google" chỉ hiện khi server có `GOOGLE_CLIENT_ID`; thiếu thì client ẩn nút và game chạy như cũ (tên + mật khẩu). Client ID là cấu hình công khai (không phải bí mật), **không** đưa giá trị thật vào repo. Luật chơi và giao thức: `docs/tech/giao-thuc-server.md` ("Đăng nhập Google").

## Nơi đặt từng biến
| Biến | Đặt ở đâu | Ghi chú |
|---|---|---|
| `GOOGLE_CLIENT_ID` | **ConfigMap** của repo GitOps (xem `docs/ops/gitops.md`); chạy dev thì `server/.env` | dạng `…apps.googleusercontent.com`; công khai, `GET /api/config` trả cho client |
| `GOOGLE_TICKET_SECRET` | **Secret `soul-land-env`** trên cụm (chủ repo tạo tay, không Sealed Secrets; deployment nạp bằng `envFrom` `secretRef`, cùng chỗ với `DATABASE_URL`) | chuỗi ngẫu nhiên dài; **chỉ cần khi chạy nhiều tiến trình / pod**, để vé chọn tên của pod này đọc được ở pod kia; một bản thì có thể bỏ qua |

Prod hiện là một bản, nên `GOOGLE_TICKET_SECRET` chưa bắt buộc. Thiếu thì server dùng khoá ngẫu nhiên và in một dòng cảnh báo.

## Tạo OAuth client (một lần)
Project GCP phải ở **ngoài tổ chức Workspace** (hoặc ít nhất Audience **External**). Màn đồng ý "Internal" của project thuộc tổ chức `oleqima.com` chỉ cho tài khoản trong domain đăng nhập, bạn bè dùng Gmail thường bị chặn (Q48).
1. Google Cloud Console, project riêng ngoài tổ chức → **Google Auth Platform / OAuth consent screen**: Audience **External**, điền tên app và email hỗ trợ, **không tải logo** (có logo thì Google đòi xác minh thương hiệu), rồi **Publish app** (**In production**; để "Testing" thì chỉ email trong Test users vào được). Scope cơ bản `openid` / `email` / `profile` thường không cần Google duyệt.
2. **Credentials → Create credentials → OAuth client ID → Web application**. **Authorized JavaScript origins**: `https://soulland.oleqima.com`, `http://localhost:5173`, `http://localhost:2567`. Không cần Authorized redirect URIs (luồng ID token, không redirect) và không dùng client secret.
3. Đưa Client ID vào ConfigMap (bảng trên).
4. **Sau khi đổi ConfigMap phải restart pod** (ConfigMap đổi không tự khởi động lại): `kubectl -n soul-land-mmo rollout restart deploy/soul-land-game`, rồi kiểm `https://soulland.oleqima.com/api/config` trả Client ID mới.
5. (Nhiều pod) Tạo `GOOGLE_TICKET_SECRET` bằng `openssl rand -hex 32` hoặc `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, đặt khoá vào Secret `soul-land-env` trên cụm (chủ repo tạo tay, không Sealed Secrets), rồi `kubectl rollout restart` deployment để pod nhận giá trị mới; không dán giá trị vào repo, issue, PR, log.

## Đổi project / Client ID
Định danh lưu ở `account_identities` là `sub` của tài khoản Google, **không đổi** khi đổi project hay Client ID. Tài khoản đã liên kết vẫn đăng nhập được sau khi đổi; không cần di chuyển dữ liệu.

## Kiểm
Landing (`/`) và game (`/choi`) cùng origin nên chỉ cần một origin ở bước 2. Landing có nút Google riêng (bấm là mở cửa sổ Google, xong vào `/choi`; tài khoản mới thì game hiện luôn màn chọn tên, vé chuyển qua `sessionStorage`). Kiểm: mở `/`, bấm "Đăng nhập Google" rồi vào `/choi`; hoặc mở `/choi`, thấy nút Google dưới form đăng nhập; chọn tài khoản Google mới → màn "Chọn tên nhân vật" → tạo nhân vật. Tài khoản cũ: đăng nhập tên + mật khẩu → **Cài đặt → Tài khoản Google** để liên kết.

## Dữ liệu và thử ở máy
Server không lưu email, tên hay token Google (chỉ mã người dùng `sub`, bảng `account_identities`). Bộ kiểm giả (`test:<mã>`) chỉ có khi `GAME_TEST=1` và `NODE_ENV` khác `production`; ở prod luôn tắt. Thử: `npm run test:google --prefix server`, `npm run bot:local -- --only google [--pg]`.

## Issue liên quan
#612 (đăng nhập Google), #615 (SSO2).
