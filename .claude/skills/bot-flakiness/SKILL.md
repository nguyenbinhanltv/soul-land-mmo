---
name: bot-flakiness
description: Quy trình xử lý bài kiểm tra chập chờn của bot (client/scripts/bot-test.mjs): lúc qua lúc trượt không đổi code. Tái hiện N lượt trên server mới, đối chứng với origin/main, tìm dòng ✗ đầu tiên của chuỗi, phân loại nguyên nhân (tin tới trước bản vá state, sleep cố định, cửa sổ vị trí hẹp so với tốc độ, hồn thú hoang, giờ boss thật, trạng thái bot để lại, máy tải cao), sửa bằng chờ theo state, ghi vào issue. Dùng khi bot có ✗ mà nghi không phải lỗi của việc đang làm, khi lượt RAM và PostgreSQL cho kết quả khác nhau, hoặc khi được giao issue nhãn bot-test.
---

# Bot chập chờn

Bot không chập chờn tới khi chứng minh được: các nguồn chập chờn cũ đã sửa, **✗ trên main mới nhất mặc định là lỗi thật**. Không "chạy lại cho qua", không nới lỏng bài kiểm tra (tăng ngưỡng, bỏ dòng, nuốt lỗi) chỉ để xanh.

Ý tưởng phỏng theo skill `test-flakiness` và `regression-suite` của [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT), viết lại cho bot của repo này.

## 1. Tái hiện
- Mỗi lượt một **server mới** (state sạch), chạy tuần tự bằng `npm run bot:local -- --only <nhóm>` (hoặc `--part 1..6`; `CLAUDE.md` phần Lệnh): tự bật server ở cổng trống, tự dọn, in số ✓ / ✗ / ⚠ và log ở `ci-logs/local-*`. Ghi output ra file ở thư mục artifact.
- Ít nhất **3 lượt** trước khi gọi là chập chờn (1 trượt / 2 lượt chỉ là nghi ngờ); muốn kết luận đã sửa thì 5–10 lượt. Ghi tỉ lệ trượt từng dòng.
- Thu hẹp: khối có `BOT_ONLY` (`waypoint`, `bigmap`, `view`, `daily`) thì chạy riêng khối đó. Không có thì viết script tái hiện ngoài repo chỉ lặp đúng thao tác trượt 20–40 lần (#139: `walkToX` trượt 10/30, sau sửa 0/40).
- Dừng bot giữa chừng thì **khởi động lại server** trước lượt sau (hồn thú thử còn trong phòng RAM làm lượt sau trượt dây chuyền).

## 2. Đối chứng với main
- Trượt cả trên `origin/main` thì không phải do nhánh đang làm: báo orchestrator / tạo issue riêng, không sửa lẫn vào PR đang làm.
- Chạy main cạnh nhánh: `git archive origin/main | tar -x -C <thư mục tạm ngoài repo>`, nối `node_modules` bằng junction (`cmd /c mklink /J <tạm>\client\node_modules <repo>\client\node_modules`, tương tự `server`), chạy cùng kịch bản. Gỡ junction bằng `cmd /c rmdir` **trước** khi xóa thư mục tạm.
- So RAM và PostgreSQL: chỉ trượt ở một chế độ là manh mối (thời gian ghi DB khác nhau), không phải lý do bỏ qua.

## 3. Tìm gốc
- Đọc **dòng ✗ đầu tiên**: một ✗ thường kéo theo hàng chục ✗ sau (#139: "tới cổng: null" kéo 50–70 ✗ cổng / thương nhân). Đọc phần chẩn đoán trong dòng ✗ (`[ra trận …, hướng …, log …]`) và log server cùng lúc.
- Thêm chẩn đoán vào chính dòng `ok(...)` (vị trí, sinh lực, võ hồn ra trận, log gần nhất) thay vì đoán.

| Nguồn đã gặp | Dấu hiệu | Cách sửa |
|---|---|---|
| Tin (`log`, `dmg`, trả hook `test`) tới **trước bản vá state** | log / số đúng nhưng đọc state ngay sau thì cũ | `waitFor(() => <state>)` sau tin; `test()` đã chờ bản vá đầu tiên (`b.patchN`) |
| `sleep` cố định cho việc "hết sau T giây" | trượt khi máy tải (thời gian trạng thái chạy theo nhịp server, `dt` bị kẹp) | "còn sau T" đo bằng sleep được; "hết sau T" phải `waitFor` |
| Cửa sổ vị trí hẹp hơn quãng đi mỗi nhịp | bước qua đích (11.1: chạy 7,6 px/nhịp, cửa sổ ±3 px) | gần đích đẩy cần nhẹ (`goTo`), đi bộ `w: 1` |
| Nhận hồn thú theo vị trí / "key mới đầu tiên" | hồn thú vừa sinh đã lao đi, nhận nhầm con khác | dùng `bid` do hook `spawn` / `beast` trả; luôn truyền `bid` khi nhắm tinh anh / boss |
| Hồn thú hoang đánh bot trong lúc chờ | nửa máu, võ hồn gục rồi tự đổi | hook `clear` quanh chỗ đứng; thử trong vùng an toàn khi bài cho phép |
| Bài trước để lại vị trí / sinh lực / võ hồn khác | bài sau trượt dù chạy riêng thì qua | cuối bài trả bot về chỗ cũ, chờ hồi đầy; thêm `ok` khẳng định trạng thái đầu bài sau |
| Giờ boss thật (`KING_TIMES`, `WORLD_TIME`) | chỉ trượt vào khung giờ đó | `GAME_TEST=1` mặc định đứng 12:00; muốn thử khung thật thì `BOSS_CLOCK=HH:MM` |
| Hook đọc số bằng `int()` | gửi `13.5` thành mặc định, không báo lỗi | gửi số nguyên đúng đơn vị hook nhận |
| Máy tải cao (nhiều phiên, Chrome, embedded-postgres) | trượt lẻ ở bài có cửa sổ thời gian ngắn | chạy tuần tự để có kết quả sạch; rồi vẫn sửa bài bằng chờ theo state |

Chi tiết từng ca: PR #28, #36, #71 (chờ bản vá state, `BOSS_CLOCK`), #140 (#139).

## 4. Sửa
- Sửa ở bot nếu bot đo sai; sửa server nếu là lỗi thật (bot chỉ lộ ra). Không thêm luật riêng cho bot ở server; thiếu thao tác thì thêm `op` cho hook `test` (chỉ chạy khi `GAME_TEST=1`).
- Sau sửa: script tái hiện 0 trượt / N lượt, rồi bot đầy đủ RAM ×2 và PostgreSQL ×2 (khi đổi server / shared), mỗi lượt một server mới.

## 5. Ghi lại
- Issue (nhãn `bot-test`, mẫu "Lỗi"): commit, chế độ (RAM / PG), số lượt và tỉ lệ trượt từng dòng, dòng ✗ đầu tiên, nghi vấn. Đang làm việc khác thì chỉ tạo issue, không sửa ngoài phạm vi.
- PR sửa: bảng lượt trước / sau như PR #140 (mã, RAM, PostgreSQL), nguồn gốc từng ✗, xác nhận không bài nào bị nới lỏng.
