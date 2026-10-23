# Prompt mẫu cho worker

Thay `<…>` bằng giá trị của bạn. Đường dẫn artifact: `<ARTIFACTS>` (thư mục artifact của phiên orchestrator). Giữ khối **LUẬT MÁY** trong mọi prompt có chạy server / bot / Chrome. Giải thích từng phần: [../02-orchestrator-ao.md](../02-orchestrator-ao.md).

Cách dùng:

```bash
ao spawn --project <project-id> --name "<tên ngắn>" --prompt "$(cat prompt.txt)"
```

## Khối LUẬT MÁY (dán vào cuối mọi prompt)

```
LUẬT MÁY: server cổng = 3000 + số phiên của bạn; kiểm cổng trước, EADDRINUSE thì dừng, không nối vào server có sẵn; chỉ tắt PID con của mình (không taskkill theo cổng / tên). Bot ở máy chỉ qua `<lệnh bot cục bộ>`. Chrome luôn --mute-audio, không dùng cổng CDP <cổng đã có người dùng> (dùng --remote-debugging-port=0). Không force push, không push main. Đang review AO thì không push thêm trừ khi sửa theo review.
```

## 1. Việc code (một issue một PR)

```
Việc: issue #<N> "<tiêu đề>" (kế hoạch #<M>). Đọc issue, <tài liệu thiết kế>, skill <tên skill>, và <mockup / tài liệu liên quan>.

Nền tảng đã có trên main: <PR / khái niệm đã merge>. Nếu <PR chưa merge> chưa vào khi bạn bắt đầu thì làm trên main hiện tại và merge origin/main khi nó vào.

Làm (nhánh MỚI từ origin/main, PR nháp ngay 'Closes #<N>', nhãn dang-lam / agent:<tên> đã gắn):
- <hành vi 1>
- <hành vi 2>
- Giữ đủ chức năng cũ của <màn hình / module>. <Ranh giới: client chỉ hiển thị, không đổi server…>

Phối hợp: worker <id> đang sửa <file>. Chỉ sửa phần của bạn, tách code ra file riêng nếu hợp (ví dụ <file mới>) để ít xung đột; merge origin/main thường xuyên (không rebase).

Trước khi Ready: ảnh trước/sau (nếu đổi giao diện), <lệnh check>, <lệnh build>, <lệnh test nhóm liên quan>.
Xong: Ready + ao review trigger + báo orchestrator.
<KHỐI LUẬT MÁY>
```

## 2. Việc ảnh (có duyệt trước khi vào sản phẩm)

```
Việc: issue #<N> "Ảnh: <đối tượng>". Đọc kỹ issue (bảng ảnh cần, tiêu chí xong), <tài liệu quy tắc ảnh>, skill <asset-gen> mục ComfyUI.

Cách làm: ComfyUI img2img từ ảnh dẫn khối isometric (<công cụ ảnh dẫn> đúng tỉ lệ), denoise ~0,75, mode lcm; mỗi vật 2–4 seed. Làm trang xem trước HTML (gốc 1024 / sau xử lý / so cùng tỉ lệ với đồ đã có) trong thư mục artifact của phiên bạn; BÁO orchestrator đường dẫn để NGƯỜI DÙNG DUYỆT bản chọn TRƯỚC khi đưa vào sản phẩm. Sau khi duyệt: nhập bằng dây chuyền công cụ, ghi CREDITS (prompt, negative, seed, ảnh dẫn), chụp ảnh trong game ngày + đêm.

Quy trình: gh issue edit <N> --add-label dang-lam,agent:<tên> --remove-label san-sang; nhánh mới từ origin/main; PR nháp ngay 'Closes #<N>'. Trước Ready: <check>, <build>, <bài test liên quan>. Ready + ao review trigger + báo orchestrator.

LUẬT DÙNG MÁY SINH ẢNH (<MAC_IP>:8188, MCP comfyui-pixel, tool generate_pixel_art): worker <id khác> cũng đang dùng. Mỗi lần chỉ gửi MỘT job, chờ xong mới gửi tiếp (kiểm /queue trống); không hủy job người khác, không đổi cấu hình / model. KHÔNG dùng dịch vụ ảnh nào khác.
<KHỐI LUẬT MÁY>
```

## 3. Sửa bài test chập chờn

```
Việc: sửa <N> bài bot chập chờn (skill bot-flakiness). Làm lần lượt, mỗi issue một PR riêng.

1. #<A>: <tên bài> — <mô tả chập chờn>. Thay <sleep cố định / chờ theo giờ> bằng chờ theo điều kiện (state / tin server), có hạn chót và chẩn đoán trong dòng ✗.
2. #<B>: <tên bài> trượt chập chờn. Đọc chẩn đoán, tìm chỗ chờ theo giờ / điều kiện đua, sửa bài thử (hoặc server nếu là lỗi thật — khi đó báo orchestrator trước).

Mỗi issue: gh issue edit N --add-label dang-lam,agent:<tên> --remove-label san-sang; nhánh mới từ origin/main; PR nháp ngay 'Closes #N'; chứng minh bằng `<lệnh bot> --only <nhóm>` chạy nhiều lần (≥ 5 lần nhóm liên quan + 2 lần mỗi --part tương ứng), ghi kết quả vào PR; Ready + ao review trigger; báo orchestrator. Xong #<A> thì sang #<B>.
<KHỐI LUẬT MÁY>
```

## 4. Review-only (PR của collaborator)

```
Việc REVIEW-ONLY (không sửa code, không push, không claim/attach PR): kiểm lại độc lập PR của collaborator <tên>:
1. PR #<N> "<tiêu đề>" (Closes #<I>), head <sha-40>.
Tác giả đã tự review "Review: đạt" khớp đúng head; CI <k/k> xanh.

Mỗi PR: đọc issue liên quan, CLAUDE.md, tài liệu thiết kế (phần liên quan), diff (gh pr diff N). Soát: đúng phạm vi issue; không đổi luật / số cân bằng ngoài chỗ cho phép; <tiêu chí riêng theo loại PR: hiệu năng, bảo mật, migration…>. Chạy cài thư viện (nếu thiếu) + <lệnh check> trên đúng head (gh pr checkout N trong worktree của bạn — chỉ để đọc / kiểm, không commit). Bot: ĐỌC kết quả CI (gh pr checks N, gh run view) thay vì tự chạy; chỉ tự chạy khi CI thiếu / lỗi hạ tầng; phần CI chưa có (ví dụ lượt DB thật) thì tự chạy khi PR đổi liên quan.

Kết quả: gửi review GitHub bằng gh pr review N --comment --body "..." (KHÔNG --approve / --request-changes), mở đầu "Orchestrator kiểm lại: **đạt**" hoặc "**chưa đạt**", ghi "Head đã review: <sha 40 ký tự>", liệt kê điểm cần sửa (nếu có, kèm file:dòng). Rồi báo orchestrator kết luận từng PR. Không merge.
<KHỐI LUẬT MÁY>
```

## 5. Tiếp quản PR (worker cũ không nhận tin)

```
Tiếp quản PR #<N> (<tên việc>, Closes #<I>) từ phiên <id> (không nhận tin). AO review (head <sha-7>) CẦN SỬA:
1. <file>:<dòng> — <vấn đề, đề xuất sửa>.
2. <file>:<dòng> — <vấn đề>.
Sửa luôn <k> gợi ý: (a) …; (b) …; (c) ….

Đọc comment inline trên PR (gh pr view <N> --comments; gh api repos/<OWNER>/<REPO>/pulls/<N>/comments). Merge origin/main nếu cần (không rebase, không force push). Cài thư viện nếu thiếu; chạy <check>, <build>, <test nhóm liên quan>. Chụp lại ảnh trước/sau nếu giao diện đổi. Push, ao review trigger, báo orchestrator. Lưu ý worker <id khác> đang làm <việc khác> cũng sửa <khu vực> — chỉ sửa phần của PR này.
```

Spawn kèm claim: `ao spawn --project <id> --name "tiep-quan-<N>" --claim-pr <N> --prompt "$(cat prompt.txt)"`.

## 6. Prompt cho collaborator

Bộ prompt cho collaborator (cài đặt, nhận việc, làm, xin merge, sửa góp ý, bỏ dở, chạy liên tục, "Luật PR") xây theo [../03-collaborator.md](../03-collaborator.md); mỗi collaborator được một bản đã thay `<tên>`, nhãn `agent:<tên>` và **dải cổng riêng**.
