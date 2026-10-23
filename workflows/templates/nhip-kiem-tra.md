# Nhịp kiểm tra (orchestrator <project-id>)

> Mẫu. Đặt file này **ngoài repo** (thư mục artifact của orchestrator), lịch cron chỉ **một dòng**: "Đọc `<đường dẫn file này>` và làm đúng một nhịp". Đổi quy trình thì sửa file, không sửa cron. Giải thích: [../02-orchestrator-ao.md](../02-orchestrator-ao.md).

Mỗi nhịp làm đúng các bước dưới đây. **Nhịp yên lặng:** nếu không có gì mới thì chỉ ghi một dòng Nhật ký, trả lời người dùng đúng một câu, không liệt kê lại. Chỉ mở ảnh khi cần người dùng duyệt; còn lại chỉ đưa link. Không nhắc lại báo cáo cũ đã xử lý.

## Kiểm tra (gộp trong một lệnh Bash)
- `ao session ls --project <project-id>` (dòng worker), `gh pr list --repo <OWNER>/<REPO> --state open --json number,headRefOid,mergeable`.
- `ao review ls <worker>` cho worker có PR. Worker không có PR thì `ao session get <id>`, xem dòng `branch`.
- **PR collaborator** (tác giả ≠ chủ repo), KHÔNG nháp: đọc CẢ comment LẪN review body (`gh pr view N --json comments,reviews`) có "Head đã review" hoặc "Review: đạt" (họ hay SỬA comment cũ thay vì ghi mới), so SHA 40 ký tự với head → đủ điều kiện thì spawn review-only NGAY trong nhịp (nhãn `cho-review` nằm ở ISSUE, không ở PR).
- PR collaborator NHÁP mà đã có "Review: đạt" khớp head → comment nhắc tác giả bấm Ready (một lần). Issue `cho-review` KHÔNG có PR (việc soát / phân tích) → đọc báo cáo; đề xuất đã chốt / xong thì đóng issue + Project Xong.
- PR mở thiếu nhãn `agent:<tác giả>` → `gh pr edit --add-label` (PR của mình = `agent:<orchestrator>`).
- **Đồng bộ Project theo nhãn issue** (collaborator hay quên): `dang-lam` → Đang làm, `cho-review` → Đang review, Chủ = `agent:<tên>` tương ứng (id trường / id lựa chọn ghi ở mục Trạng thái).
- **Sau mỗi merge:** Project item của PR + issue → Status Xong, điền "Ngày xong", "Bước lộ trình".
- Hộp thư ảnh / đầu vào ngoài (nếu có): liệt kê file mới chưa có trong `_processed.txt`.

## Xử lý
1. **PR:**
   - Review chưa chạy, hoặc head mới hơn bản đã review: `ao review trigger <worker> --pr <URL>`.
   - Approved, CI xanh, MERGEABLE: `gh pr merge N --squash --match-head-commit <sha>`, rồi tắt phiên worker (trừ khi còn việc tiếp theo).
   - `changes_requested`: đọc nội dung review (`ao review ls --json` và comment trong PR), gửi lỗi cho worker. `ao send` lỗi thì spawn worker mới `--claim-pr`.
   - CONFLICTING: huỷ review đang chạy, bảo worker merge `origin/main` (không rebase).
   - Chờ-rồi-merge nền: `bash cho-merge.sh <PR> <session>` (chạy nền).
2. **Worker báo `[done]` thường không nhận `ao send` nữa:** thử tối đa 2 lần; kill rồi spawn worker mới (PR chưa đạt thì `--claim-pr`). Chạy `ao spawn` MỘT lần, đọc kỹ output (lần lỗi vẫn có thể đã tạo phiên).
3. **Worker idle > 15 phút mà chưa có PR:** nhắc một lần. Kẹt thì `ao session kill`.
4. **Giao việc:** tối đa ~<4> worker cùng lúc; xem mục Trạng thái.
5. **Tài nguyên chung** (máy sinh ảnh, …): tối đa <2> worker, mỗi worker 1 job / lần.
6. Ghi **một dòng** vào Nhật ký.
7. Không tự sửa code, không nhắc lại key.

## Trạng thái (cập nhật khi thay đổi; GHI TRƯỚC KHI NÉN NGỮ CẢNH)
- **Luật tài nguyên:** <tối đa N worker; bot chỉ qua lệnh X; cổng = 3000 + số phiên; âm thanh --mute-audio>.
- **Worker đang chạy:** <id: việc / issue / PR>.
- **Quyết định người dùng (theo ngày):** <…>.
- **Collaborator:** <tên → nhãn, dải cổng>. PR của họ: tự review + "Review: đạt" → review-only → merge.
- **Hàng chờ review PR collaborator:** <…>.
- **Id Project:** <Project id, id trường Status / Chủ / Ngày xong, id các lựa chọn — dùng cho `gh project item-edit`>.
- **Đã merge gần nhất:** <#…>.

## Hàng chờ từ GitHub
- Lấy việc: `gh issue list --repo <OWNER>/<REPO> --label san-sang --search "no:assignee -label:dang-lam -label:chan" --json number,title,labels`. Ưu tiên <giai đoạn / loại>.
- Khi giao worker cho issue N:
  - `gh issue edit N --add-label dang-lam,agent:<orchestrator> --add-assignee @me`.
  - Prompt worker có "Closes #N" và mở PR nháp ngay.
  - Project: Status = Đang làm, Chủ = `agent:<orchestrator>` (`gh project item-edit …`).
- PR collaborator đủ điều kiện → spawn **review-only** (không claim PR, không dùng `ao review trigger`); đạt + CI + MERGEABLE thì `gh pr merge --squash --match-head-commit`; không đạt thì worker comment góp ý. Bot nặng: ĐỌC kết quả CI, chỉ tự chạy khi CI thiếu / lỗi hạ tầng.
- Lưu ý merge: PR từng bị `request-changes` thì sau khi tác giả sửa phải `gh pr review --approve` (kèm ghi chú) trước khi merge, nếu không ruleset chặn (BLOCKED).
