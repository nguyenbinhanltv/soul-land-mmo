# Nhập icon võ hồn v2 — #1159

PR làn code, độc lập với PR chân dung/thẻ #1262. Không đổi server. Không sinh RAW mới, không nới trần32 màu.

## Kết quả

Đủ24/25 võ hồn, mỗi võ hồn có icon24/32 px. Xúc Xích thiếu:3/3 lượt RAW đều nhiều chiếc phụ, crop lượt3 không đạt; không sinh lượt thứ tư.

Các file `iso/portrait/<id>_icon24/32.png` được lượng tử hóa từ nearest đã có bằng `quantizeNearestIcon`: bảng trung vị có trọng số và bảo vệ điểm sáng, dành một màu cho viền; không làm cứng hay đổi alpha/hình. Tất cả tối đa32 màu, alpha đổi0; số đo lệch màu lớn nhất0,03. Đã xem cả24 bộ trước/sau ở cỡ nhỏ: chưa thấy mất nét nhận diện rõ. Cảnh báo NHẸ về nét vụn/sáng tràn còn từ nguồn, không khai là ĐẸP.

[Trang so sánh1×/3×](icon-32-mau.html), [hash và số đo từng ảnh](ICON-32-MAU.json).

## Tái tạo

```sh
node tools/assets/vohon-pixelize.mjs --type icon --from-nearest --id bach_ho --in art/src/vohon-v2/bach_ho/icon-attempt1-nearest/bach_ho-icon-32.png --out <tmp> --colors 32
```

`--from-nearest` suy cỡ từ input24/32 và chỉ lượng tử màu. `--preset icon-nearest32` dùng khi cần từ RAW qua nearest rồi giảm màu. Preset icon-nearest cũ giữ nguyên cho so sánh; bộ nhập game không miễn trần màu.

Khóa `icon_<id>_24/32`, manifest iso, đúng mã võ hồn và cỡ. `validate --register ... --iso --keep-order` giữ nguyên văn các mục cũ, khối UI Kit ở cuối. Client dùng24px ở dải chọn võ hồn;32px ở ô hồn cốt nhỏ, thiếu icon thì dùng ảnh cũ/chữ. Hình hồn sư ghép trang bị và chân dung/thẻ lớn giữ nguyên.
