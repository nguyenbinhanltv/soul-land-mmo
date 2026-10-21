# Hướng dẫn cho agent AI (mọi công cụ)

Repo có nhiều người và nhiều agent cùng làm. Trước khi làm gì:

1. Đọc `CLAUDE.md` (quy tắc code, lệnh, kiểm thử; áp dụng cho mọi agent, không riêng Claude) và `GAME_DESIGN.md` (mục 6 Kiến trúc bắt buộc giữ).
2. Đọc `CONTRIBUTING.md` và **làm đúng quy trình nhận việc**:
   - chỉ nhận issue mở có `san-sang`, chưa giao cho ai, không có `dang-lam` / `chan`:
     `gh issue list --label san-sang --search "no:assignee -label:dang-lam -label:chan" --state open`;
   - kiểm lại issue ngay trước khi làm; đã có người nhận thì **không làm**;
   - nhận: tự gán, thêm `dang-lam` và nhãn `agent:<tên>`, bỏ `san-sang`; cần file SQL mới thì ghi số file vào issue;
   - nhánh `<agent>/<số-issue>-<tên-ngắn>` từ `origin/main`, **mở PR nháp ngay** với `Closes #<N>`;
   - bỏ dở thì gỡ nhãn, bỏ giao, ghi bình luận.
3. Chỉ làm đúng issue đã nhận. Không đụng nhánh / PR của người khác. Không rebase nhánh đã push, không force push, không commit thẳng lên `main`.
4. Trước khi xin review: `npm run check`, `npm run build`, bot (RAM; thêm PostgreSQL khi đổi server / SQL), ghi kết quả vào mô tả PR theo mẫu.
5. Làm liên tục 24/7 (tự nhận việc theo nhịp, làm tiếp sau khi hết quota): theo `docs/lam-viec-lien-tuc.md`.

Giao diện, chú thích, commit, PR viết tiếng Việt, dùng tên gốc Đấu La.
