# Hướng dẫn cho agent AI (mọi công cụ)

Repo có nhiều người và nhiều agent cùng làm. Trước khi làm gì:

1. Đọc `CLAUDE.md` (luật cốt lõi, lệnh, bảng "sửa hệ thống X thì đọc file Y"; áp dụng cho mọi agent, không riêng Claude) và `GAME_DESIGN.md` (mục lục: số mục như "mục 5.3" nằm ở file nào trong `docs/`; kiến trúc bắt buộc giữ ở `docs/tech/`). Quyết định chủ repo: `docs/quyet-dinh.md`.
2. Đọc `CONTRIBUTING.md` và **làm đúng quy trình nhận việc**:
   - chỉ nhận issue mở có `san-sang`, chưa giao cho ai, không có `dang-lam` / `chan`:
     `gh issue list --label san-sang --search "no:assignee -label:dang-lam -label:chan" --state open`;
   - kiểm lại issue ngay trước khi làm; đã có người nhận thì **không làm**;
   - nhận: tự gán, thêm `dang-lam` và nhãn `agent:<tên>`, bỏ `san-sang`; cần file SQL mới thì ghi số file vào issue; bảng Project: Đang làm + Chủ;
   - nhánh `<agent>/<số-issue>-<tên-ngắn>` từ `origin/main`, **mở PR nháp ngay** với `Closes #<N>` và nhãn `agent:<tên>` (`gh pr create --draft --base main --label agent:<tên>`; quên thì `gh pr edit <số> --add-label agent:<tên>`);
   - bỏ dở thì gỡ nhãn ở cả issue lẫn PR, bỏ giao, ghi bình luận; bảng Project: Sẵn sàng + Chưa giao.
3. Chỉ làm đúng issue đã nhận. Không đụng nhánh / PR của người khác. Không rebase nhánh đã push, không force push (sửa bằng commit mới + `git merge origin/main`), không commit thẳng lên `main`.
4. Trước khi xin review: `npm run check`, `npm run build`, bot (RAM; thêm PostgreSQL khi đổi server / SQL), ghi kết quả vào mô tả PR theo mẫu. Comment `Review: đạt` phải có dòng ``**Head đã review:** `<SHA 40 ký tự>` ``; sửa code sau đó thì cập nhật SHA.
5. Làm liên tục 24/7 (tự nhận việc theo nhịp, làm tiếp sau khi hết quota): theo `docs/lam-viec-lien-tuc.md`.

Giao diện, chú thích, commit, PR viết tiếng Việt, dùng tên gốc Đấu La.
