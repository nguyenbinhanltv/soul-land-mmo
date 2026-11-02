# Lính canh giáp Nặc Đinh Thành (#1722)

Hai nhân vật vô danh do Codex vẽ bằng OpenAI image_gen.imagegen ngày 02/11/2026: lính cầm giáo/khiên tròn hướng đông nam và lính cầm khiên dài/kiếm đeo hướng tây nam. Không dùng ảnh hoặc gói bên ngoài, không mô phỏng nhân vật có tên. Theo điều khoản đầu ra OpenAI; không CC0. RAW để ngoài repo; hash, cỡ và thông số nhập tại `nguon.json`, prompt tại `prompts.json`.

Nhập từng RAW bằng công cụ có sẵn:

```sh
node tools/assets/gemini-import.mjs --kind object --size 32x48 --out <tam> --names <ten> --grid 1x1 --cell 1 --palette none --logo off <RAW>
node tools/assets/iso-build.mjs prop <ten> <tam>/<ten>.png --map nac_dinh_thanh --foot-x 16
node tools/assets/normal.mjs shared/assets/sprites/iso/props/<ten>.png
node tools/assets/validate.mjs --register prop_<ten> --iso --keep-order --tool "ChatGPT / Codex (OpenAI image_gen.imagegen)" --prompt "Lính canh giáp Nặc Đinh; nguồn tại art/src/nac-dinh-1722/linh-canh/NGUON.md" --note "Đầu ra OpenAI, không CC0"
node tools/maps/build.mjs nac_dinh_thanh
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

Tên `<ten>`: `linh_canh_giap_giao` và `linh_canh_giap_khien`. Bộ nhập tự tách nền và thu ảnh, iso-build lượng tử về bảng chung + Nặc Đinh. Khung 32×48, chân [16,44], không lật ngang; normal do công cụ sinh.

Lính là vật đứng cứng, không thuộc `gids.walk`. Sáu vị trí ở cánh tường, tránh vùng dọn cổng và hành lang chính, ghi trong `nguon.json`. So baseline thêm 6 ô chặn (0,031% diện tích), không bỏ ô chặn. Luồng: 0/5 tuyến cổ chai, ngang tuyến 14,2 ô và thời gian trung bình 12,5 giây giữ nguyên; ngang toàn bản đồ 10,39 → 10,34 ô, vùng rộng ≥5×5 là 86,4% → 86,4%. Giữ nháp để chủ repo duyệt bố trí/mỹ thuật.


Dọn hai bụi hoa không chặn ở [9,51] và [80,9] để nhìn thấy chân lính; hai ô vốn là sân lát đá, không đổi lưới va chạm.
