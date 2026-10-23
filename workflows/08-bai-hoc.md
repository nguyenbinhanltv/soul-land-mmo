# 08. Bài học thực tế

Mỗi mục: **chuyện gì xảy ra → nguyên nhân → cách phòng**. Đây là những lỗi đã gặp thật khi chạy nhiều agent song song trong vài tuần; chỗ nào nhắc tới số issue / phiên là của Soul Land. Dự án mới nên đọc trước khi tăng số worker.

## Điều phối và phiên AO

| Chuyện xảy ra | Nguyên nhân | Cách phòng |
|---|---|---|
| Worker đã báo `[done]` rồi `ao send` trả `SERVICE_UNAVAILABLE` / `INTERNAL_ERROR` (gặp ở nhiều phiên) | Phiên đã kết thúc không còn nhận tin | Thử tối đa **2 lần**; kill và spawn worker mới (`--claim-pr <N>` nếu PR chưa đạt). Đừng chờ |
| `ao send` lỗi khi gửi lỗi review, rồi worker cũ đổi harness (`AGENT_SWITCH_IN_PROGRESS`) | Đổi harness giữa chừng | Spawn worker mới `--claim-pr`, kill phiên cũ sau |
| **Spawn trùng:** một lệnh `ao spawn` báo lỗi nhưng vẫn tạo phiên, lệnh lặp lại tạo thêm phiên thứ hai cùng việc | Lỗi giữa chừng không có nghĩa là chưa tạo | Chạy `ao spawn` **một lần**, đọc kỹ output, nếu lỗi thì `ao session ls` trước khi thử lại; trùng thì giữ phiên có tiến độ, kill phiên còn lại, claim PR cho phiên giữ |
| Hai worker cùng làm một việc, cùng chọn số migration (019 / 020) | Khai số chậm, hoặc giao hai issue chồng nhau | Khai **số migration vào issue** trước khi viết; orchestrator kiểm trùng khi giao; trùng thì dừng một bên, bên kia giữ số kế tiếp |
| Hai PR sửa trùng ~6 file | Giao việc không chia ranh giới | Chia theo file / phần; PR sau merge `origin/main` và chờ PR trước; nêu rõ trong prompt "worker khác đang sửa X" |
| Worker idle > 15 phút, chưa có PR | Hỏi quyền / kẹt công cụ / lạc hướng | Nhắc đúng một lần; vẫn kẹt thì kill + spawn lại với prompt chốt hơn |
| Reviewer treo ~30 phút (nhiều lần) | Hạ tầng reviewer | `ao review trigger --rerun` (reviewer song song), đừng chờ vô hạn |
| Lệnh Bash chạy nền bị dừng sau 30 phút giữa lần chạy bot / server | Timeout mặc định của lệnh nền | Đặt `timeout` dài (tối đa 2 giờ), chia đợt ≤ 6 lượt, bật server + bot trong **cùng một** lệnh nền rồi tắt ở cuối |
| `TaskStop` một lệnh nền chỉ tắt bash cha; script con (vòng `until` chờ cổng rồi chạy bot) mồ côi, sau đó chạy bot thứ hai lên server của lần sau và tắt luôn server | Tiến trình con không chết theo cha | Sau dừng lệnh nền, **liệt kê tiến trình và tắt đúng PID mồ côi** trước khi chạy lại; mỗi lần chạy dùng tên log mới |

## Tài nguyên và cổng

| Chuyện xảy ra | Nguyên nhân | Cách phòng |
|---|---|---|
| **Máy tràn RAM** khi ~6 worker cùng chạy bot + server + DB + Chrome → mọi worker chết | Không có trần | Tối đa ~4 worker; worker **không chạy bot đầy đủ ở máy** (CI lo), chỉ một nhóm; mỗi worker tối đa 1 server + 1 DB, tắt ngay khi xong; công cụ chạy bot có khóa toàn máy |
| Script đo A/B nối vào server của phiên khác (cổng bận) rồi `taskkill` theo cổng → **tắt nhầm server người khác** | Không kiểm cổng, tắt theo cổng | **Luật cứng:** kiểm cổng trước; bận / `EADDRINUSE` thì dừng, không nối; **chỉ tắt PID con do script vừa bật, không bao giờ theo cổng hay theo tên**; cổng = 3000 + số phiên |
| Server của mình chết, bot nối nhầm sang server phiên khác cùng cổng (báo `Room onError`) | Hai script cùng cổng | Trước khi chọn cổng, quét các số cổng trong thư mục script của phiên khác; thấy lỗi lạ thì kiểm PID đang nghe cổng có phải của mình |
| `npm run dev:server` (chạy bằng `tsx watch`): tắt PID đang nghe cổng nhưng tiến trình cha vẫn sống và tự bật lại khi file đổi | Cha giám sát | Chạy thử bằng `node --import tsx src/index.ts` (một tiến trình); tắt cả cha nếu lỡ dùng watch; **không dùng lệnh dev để chạy bot** |
| Chrome headless điều khiển nhầm trình duyệt đang dùng (cổng 9333, nghe `[::1]`) | Cổng CDP có người dùng | `--remote-debugging-port=0` + đọc `DevToolsActivePort`; nối WebSocket bằng `127.0.0.1` |
| Nhạc phát ra khi bot / thử game vì người dùng đang dùng máy | Chrome không tắt tiếng | **`--mute-audio` mọi lúc**; chép luật vào mọi prompt có Chrome / bot |
| Máy sinh ảnh bị hai worker gửi job chồng | Không có hàng đợi / kiểm queue | Kiểm `/queue` trống trước khi gửi; tối đa 2 worker; mỗi worker 1 job một lần |

## Kiểm thử và bot

| Chuyện xảy ra | Nguyên nhân | Cách phòng |
|---|---|---|
| Bài bot trượt chập chờn nhiều lần (tin tới trước bản vá state; sleep cố định; cửa sổ vị trí hẹp; hồn thú hoang can thiệp; trạng thái bài trước để lại) | Bài thử đo sai, hoặc thực sự có đua (race) | [05-testing.md](05-testing.md): tái hiện, đối chứng main, chờ theo state, chẩn đoán trong dòng ✗, chạy N lần chứng minh. **✗ trên main = lỗi thật** |
| Bài thú vương phụ thuộc giờ thật → trượt đúng khung 20:00 | Bot chạy theo đồng hồ thật | Đồng hồ test đứng yên, đặt được qua biến môi trường |
| Một dòng ✗ đầu kéo 50–70 ✗ sau | Hệ quả dây chuyền | Đọc **dòng ✗ đầu tiên** |
| Kiểm tra đủ nhưng chỉ có "bỏ qua" | Server không bật chế độ test | Bot báo ⚠ bỏ qua khi thiếu `GAME_TEST=1`; đọc ✗ và ⚠ chứ không chỉ "xong" |
| `npm run check` "qua" nhưng không kiểm gì | Worktree mới chưa `node_modules` | Cài thư viện trước (`npm run install:all`); review-only cũng vậy |
| Chạy bot dừng giữa chừng → lượt sau trượt dây chuyền | Thực thể thử còn trong phòng RAM | Khởi động lại server trước lượt sau |
| So sánh dữ liệu JSONB trong bot thất bại | Cột JSONB đổi thứ tự khóa khi đọc lại | Sắp khóa trước khi so |
| "Lúc qua lúc trượt" do máy tải | Nhiều phiên cùng chạy | Chạy tuần tự khi cần kết quả sạch, vẫn sửa bài bằng chờ theo state |
| Một công cụ chạy lệnh tay (`--hook`) treo tới hết giờ | Đọc JSON từ stdin | Chạy tay dùng `npm run check` |

## Git, PR, merge

| Chuyện xảy ra | Nguyên nhân | Cách phòng |
|---|---|---|
| Collaborator rebase + force push nhiều lần | Thói quen cá nhân | Nhắc; ruleset cấm force push cho **mọi nhánh** (`target *`); luật "merge `origin/main`, không rebase nhánh đã push" ghi trong `CONTRIBUTING.md` |
| Review-only `request-changes` rồi tác giả sửa vẫn bị **BLOCKED** khi merge | Ruleset còn trạng thái changes-requested | Sau khi tác giả sửa, review-only / orchestrator `gh pr review --approve` kèm ghi chú rồi mới merge |
| PR bị tắc CI vì GitHub kẹt head cũ / cần chạy CI trên main mới | Sự kiện không bắn | **Đóng rồi mở lại PR**, không push commit rác |
| PR collaborator đã "Review: đạt" nhưng orchestrator bỏ sót | Ghi trong *review body* thay vì comment; sửa comment cũ thay vì ghi mới; PR còn nháp | Đọc `comments` **và** `reviews`; so SHA 40 ký tự với head; PR nháp thì nhắc bấm Ready (một lần); nhãn `cho-review` nằm ở issue |
| Một PR ghi "CI bắt buộc" trong tài liệu, trái quyết định của chủ repo | Agent suy diễn từ file CI | Tài liệu và CI phải ghi đúng quyết định hiện hành (CI tham khảo, không bắt buộc) |
| Push khi PR đang review làm review chạy lại từ đầu, mất hiệu lực "Review: đạt" | Mỗi commit đổi head | **Đóng băng PR** sau khi gửi review; chỉ push khi sửa theo review / được yêu cầu |
| `git show origin/main:đường/dẫn > file` xóa trắng file trên Git Bash | Git Bash đổi `origin/main:đường` thành đường dẫn Windows | `MSYS_NO_PATHCONV=1 git show …` |
| Nhánh PR bị worktree của phiên cũ giữ, `git checkout` báo "already used" | Một nhánh chỉ ở một worktree | Tạo nhánh cục bộ từ `origin/<nhánh>` rồi `git push origin HEAD:<nhánh PR>` (push thường) |
| Script ảnh trước / sau: `git restore` về HEAD **xóa thay đổi chưa commit** | Restore ghi đè | Commit trước; script dừng nếu `git status --porcelain` các file đó không rỗng |
| Script Python / heredoc có chuỗi tiếng Việt tìm-thay không khớp, chuỗi dài truyền qua heredoc lỗi `unexpected EOF` | Mã hóa / giới hạn heredoc | Ghi script ra file bằng công cụ ghi file rồi chạy; dùng công cụ Edit cho thay thế có dấu |

## Tài khoản, quota, ngữ cảnh

| Chuyện xảy ra | Nguyên nhân | Cách phòng |
|---|---|---|
| Worker hết quota giữa việc | Mỗi phiên gắn cố định một tài khoản, AO không tự chuyển gói | Kill + spawn lại (`--claim-pr`) trên tài khoản mặc định mới; đừng sửa DB của AO |
| Người dùng phải đổi tài khoản vì ngốn quota | Dùng cửa sổ ngữ cảnh lớn cho việc nhỏ | Chỉ bật ngữ cảnh lớn cho việc thật cần; giữ mặc định cho việc gọn |
| Orchestrator quên luật / worker sau khi nén ngữ cảnh | Luật chỉ có trong hội thoại | **Ghi trạng thái vào file trước khi nén**; luật người dùng chốt vào bộ nhớ; cron một dòng trỏ tới file |
| Ngữ cảnh orchestrator đầy nhanh (nhịp dài lặp lại, ảnh xem trước) | Prompt nhịp dài, ảnh nặng | **Nhịp yên lặng**, file hướng dẫn nhịp, chỉ mở ảnh khi cần duyệt |
| Collaborator hết quota / mất ngữ cảnh làm lại từ đầu | Không có bộ nhớ ngoài | Comment "Tiến độ" trong issue sau mỗi phần việc là bộ nhớ chung |
| Key dịch vụ lộ trong hội thoại / file cấu hình | Token nằm cứng trong file MCP | Không ghi key ở repo, log, PR, tin cho worker; token nằm ở máy dùng, ngoài repo; bỏ dịch vụ thì xóa key khỏi mọi bản sao cấu hình |

## Ảnh

| Chuyện xảy ra | Nguyên nhân | Cách phòng |
|---|---|---|
| Dịch vụ sinh ảnh trả phí hết lượt, lỗi 429 vẫn trừ lượt, rồi tắt lượt miễn phí | Mô hình giá | Thử lô nhỏ, ghi lý do loại, chuyển sang ComfyUI tự host ([07](07-asset-pipeline.md), [06](06-skills-mcp.md)) |
| Ảnh trên web (Gemini) vẽ lại nội dung lượt trước | Dùng chung cuộc trò chuyện | Mỗi ảnh một cuộc trò chuyện mới; ô nền cần đính khuôn để ra đúng tỉ lệ |
| Model vẽ công trình nhìn thẳng dù có chữ "isometric" | Prompt chữ không đủ | Ảnh dẫn khối isometric + img2img |
| Ảnh nhiều bản đồ trộn nguồn ô nền → lệch | Hai nguồn khác phong cách | Một bản đồ một nguồn ô nền |
| Ảnh headless chậm, hạt / ánh sáng không có | SwiftShader (WebGL phần mềm) | GPU thật qua `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist` |

## Tóm lại: 8 luật nên chép trước

1. Số worker có trần; bot / server chỉ qua một công cụ có khóa toàn máy.
2. Cổng theo số phiên, kiểm cổng, chỉ tắt PID con của mình.
3. `ao spawn` một lần, đọc output; `[done]` rồi thì đừng `ao send` quá 2 lần.
4. Khai tài nguyên đánh số (migration) vào issue trước khi viết.
5. PR đang review thì đóng băng; không rebase / force push.
6. ✗ trên main là lỗi thật; chờ theo state, không sleep.
7. Mọi quyết định và trạng thái nằm trong file / bộ nhớ, không trong hội thoại.
8. Không key / token / IP trong repo, log, PR, prompt; ảnh vào sản phẩm chỉ sau khi người dùng duyệt.
