# Nhập icon võ hồn v2 — #1159

PR làn code dựa trên nhánh PR1262 (nguồn/ảnh chân dung và Xúc Xích). Không đổi server, không nới trần32 màu.24 võ hồn dùng RAW có sẵn; Xúc Xích dùng RAW lượt4 được duyệt thêm trong PR1262.

## Kết quả

Đủ25/25 võ hồn, mỗi võ hồn có icon24/32 px. Xúc Xích chọn lượt4 (lượt1/3 bổ sung): một vật chính, không chiếc phụ, nền phẳng. Nguồn và hai PNG thành phẩm ở PR1262; PR này bổ sung hai khóa manifest/client. Không cần lượt5–6.

Các file `iso/portrait/<id>_icon24/32.png` được lượng tử hóa từ nearest đã có bằng `quantizeNearestIcon`: bảng trung vị có trọng số và bảo vệ điểm sáng, dành một màu cho viền; không làm cứng hay đổi alpha/hình. Tất cả tối đa32 màu, alpha đổi0; số đo lệch màu lớn nhất0,03. Đã xem cả25 bộ trước/sau ở cỡ nhỏ: chưa thấy mất nét nhận diện rõ. Cảnh báo NHẸ về nét vụn/sáng tràn còn từ nguồn, không khai là ĐẸP.

[Trang so sánh1×/3×](icon-32-mau.html), [hash và số đo từng ảnh](ICON-32-MAU.json).

## Tái tạo

```sh
node tools/assets/vohon-pixelize.mjs --type icon --from-nearest --id bach_ho --in art/src/vohon-v2/bach_ho/icon-attempt1-nearest/bach_ho-icon-32.png --out <tmp> --colors 32
```

`--from-nearest` suy cỡ từ input24/32 và chỉ lượng tử màu. `--preset icon-nearest32` dùng khi cần từ RAW qua nearest rồi giảm màu. Preset icon-nearest cũ giữ nguyên cho so sánh; bộ nhập game không miễn trần màu.

Khóa `icon_<id>_24/32`, manifest iso, đúng mã võ hồn và cỡ. `validate --register ... --iso --keep-order` giữ nguyên văn các mục cũ, khối UI Kit ở cuối. Client dùng24px ở dải chọn võ hồn;32px ở ô hồn cốt nhỏ, thiếu icon thì dùng ảnh cũ/chữ. Hình hồn sư ghép trang bị và chân dung/thẻ lớn giữ nguyên.
