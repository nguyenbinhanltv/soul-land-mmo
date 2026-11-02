# Xe hàng Nặc Đinh Thành (#1722)

Hai ảnh do Codex tạo bằng OpenAI image_gen.imagegen ngày 03/11/2026 (+07:00), trên khung 3D tự dựng. Bản có ngựa dùng ảnh xe không ngựa làm mẫu thiết kế/vật liệu. Không dùng ảnh phim hoặc gói ngoài. Theo điều khoản đầu ra OpenAI, không CC0. Prompt thật ở `prompts.json`; RAW để ngoài repo, hash và thông số ở `nguon.json`.

Tên công khai: `xe_hang_khong_ngua`, `xe_ngua_hang`. Xe gỗ bốn bánh, bạt vải, thùng gỗ/bao tải, vòng bánh bọc sắt; ngựa nâu có càng và dây kéo, không người đánh xe. Mô hình dùng phép chiếu sx=x-y, sy=(x+y)/2-z. Cả hai ảnh quy về cùng 16 pixel/đơn vị mô hình trước khi lượng tử về bảng màu chung + Nặc Đinh.

Khung xe riêng 80×80, neo [40,64]; xe có ngựa 128×112, neo [59,82]. Neo là tâm vùng chiếm chỗ trên mặt đất, không phải đáy khung. Không lật ngang. Normal do công cụ sinh. Cỡ khung khác nhau để giữ thân xe/bánh cùng tỷ lệ, không thu nhỏ riêng bản có ngựa.

Tái tạo từ gốc repo, với hai RAW đúng tên và hash:

```sh
node art/src/nac-dinh-1722/xe-hang/nhap-xe.mjs <thu-muc-RAW> <thu-muc-tam>
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

`nhap-xe.mjs` gọi bộ nhập để tách nền, chuẩn hóa theo biên mô hình, rồi gọi `iso-build prop` và `normal`; ghi thông số neo ra thư mục tạm. Đã kiểm bốn PNG màu/normal tái tạo khớp byte. Có thể dựng lại ảnh khung bằng `tools/assets/comfy-shape.mjs <model.json> <tmp.png> --size 1024 --fit .85`.

Bố trí dùng `build.compounds` hiện có với `walls:false`: xe có ngựa tại vùng [9,74,7,3] ở chợ, xe riêng tại [164,65,3,3] ở mép sân cổng đông. Dùng vùng chặn đầy đủ cho toàn xe; không đổi code client/server. So baseline 3670c0c7 thêm 30 ô chặn (0,156% diện tích), không bỏ ô chặn. Năm bề ngang tuyến [16,16,7,16,16], 0/5 tuyến cổ chai và thời gian TB 12,5 giây giữ nguyên. Ngang toàn bản đồ 10,34 → 10,32 ô, vùng rộng ≥5×5 là 86,4% → 86,3%. Chỉ bộ Nặc Đinh tham chiếu hai xe mới.

Giữ PR nháp Loại B để chủ repo xem ảnh trước/sau, không tự gộp.
