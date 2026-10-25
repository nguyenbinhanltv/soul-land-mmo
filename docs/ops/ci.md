# CI của PR (check.yml)

CI chạy trên mọi PR vào `main` và mỗi push vào `main`. Luật dùng CI trong quy trình review / merge ở `CONTRIBUTING.md`; trang này mô tả CI làm gì. Lệnh chạy bot ở máy: `docs/ops/chay-local.md`. Release / Promote sau merge: `docs/ops/trien-khai.md`.

Ba job chính (`changes`, `check-build`, `bot-ram`):

- `check-build` (ubuntu + Windows): `npm ci` (server + client, cài đúng lockfile), bài âm thanh, `npm run check`, `npm run build`.
- `changes` (job đầu tiên, `tools/ci/changes.sh`): chọn **mức bot** theo file PR đổi so với base, in mức và lý do ra Summary. `full` khi chạm `server/**`, `shared/**` (trừ ảnh / âm thanh / manifest sprite), `client/src/net.ts`, `predict.ts`, `hud.ts`, `autoPanel.ts`, `main.ts`, `scenes/GameScene.ts`, `client/scripts/**`, `tools/**`, `.github/**`, `package*.json`, `server/sql/**`, file bản đồ `shared/assets/<bản đồ>[.v2].json`, hoặc file không nhận ra (không chắc thì full); `smoke` khi chỉ đổi mã giao diện client còn lại (`client/src/**`, CSS, html); `skip` khi chỉ đổi ảnh / âm thanh / manifest sprite / `*.md` / `docs/**` / `art/**`. Push vào `main` luôn `full`. Nhãn PR ép mức: `ci:full` → full, `ci:bot-khoi` → ít nhất smoke; nhãn được đọc lúc job `changes` chạy: gắn nhãn rồi bấm Re-run (hoặc push) là có hiệu lực, đổi nhãn không tự tạo lượt CI mới. `check-build` luôn chạy đủ ở mọi mức.
- `bot-ram` (ubuntu): ở mức `skip` không chạy bot, báo success; ở mức `smoke` job `bot-smoke` chạy `test:predict`, `test:charbag` và một lượt bot khói (`BOT_PART=smoke`: phần chung đăng nhập / bản đồ / di chuyển / đánh quái / túi / nhân vật cùng vài bài nhẹ khai báo ở `SMOKE` trong `client/scripts/bot-test.mjs`, ~3 phút); ở mức `full` bot trên server mới bật `GAME_TEST=1` chế độ RAM, chia 4 job song song `bot-ram (nhóm 1|2|3|4)` theo `BOT_PART` (bot đầy đủ ~25 phút, mỗi nhóm ~9 phút; phần nào thuộc nhóm nào khai báo một chỗ ở `INLINE` / `STANDALONE` đầu phần chia nhóm trong `client/scripts/bot-test.mjs`, bài mới tự tạo bot thì thêm vào `STANDALONE` và gắn nhóm đang nhẹ theo dòng `⏱` thời gian từng phần mà mỗi nhóm in ở annotation; bước bot quá 12 phút thì coi là treo); nhóm 1 chạy thêm `test:predict`, `test:ratelimit`, `test:accounts` và lượt nhiều kênh (`CHANNEL_MAX=2`). Job `bot-ram` gộp kết quả 4 nhóm (annotation phân biệt có nhóm trượt với bị hủy / hết giờ). Mỗi lượt qua `tools/ci/bot-run.sh` (chạy được ở máy Linux / macOS: `BOT_PART=2 bash tools/ci/bot-run.sh nhom-2`). Bot trượt thì in log server, log đầy đủ ở artifact `bot-logs-<nhóm>` của lượt chạy.

## Vai trò
- CI **chỉ để tham khảo**, không là status check bắt buộc trong bảo vệ nhánh `main` (Q29 ở `docs/quyet-dinh.md`; không đổi ruleset). CI đỏ thì đọc log: lỗi do PR thì sửa, bot chập chờn thì xử lý theo skill `bot-flakiness`, lỗi hạ tầng (GitHub Actions, mạng) thì ghi lý do trong PR.

## Đọc kết quả
- **Reviewer dùng kết quả CI cho bot RAM**, không tự chạy lại bot RAM: `gh pr checks <PR>` (`bot-ram` và 4 nhóm của đúng head đang review), `gh run view <run-id>` in annotation số dòng ✓ / ✗ / ⚠ của từng nhóm và các dòng ✗ (bảng đầy đủ kèm dòng ⚠ ở trang lượt chạy, mục Summary), đỏ thì `gh run view <run-id> --log-failed`. Head chưa có lượt `bot-ram` xong (đang chạy, bị hủy) thì chờ lượt mới. Lượt **PostgreSQL** CI chưa có: PR đổi SQL / `db.ts` thì reviewer vẫn tự chạy bằng `npm run bot:local -- --only <nhóm> --pg` (`CONTRIBUTING.md` mục Xin review).

## Issue liên quan
#171, #182 (CI chỉ để tham khảo, reviewer đọc kết quả CI), #228 (`bot:local`).
