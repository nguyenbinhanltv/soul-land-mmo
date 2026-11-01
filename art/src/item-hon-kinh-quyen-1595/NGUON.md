# Hồn Kinh Quyển — đã duyệt và nhập chính thức

Issue #1595, PR #1608. **Chủ repo đã duyệt mẫu và vị trí thưởng**, điều phối qua phiên soul_land_game-815 ngày 01/11/2026. Đã nhập đúng byte bản 32px được duyệt vào `shared/assets/sprites/iso/item/hon_kinh_quyen.png`, đăng ký `item_hon_kinh_quyen`; Túi/Thư dùng đường tìm ảnh hiện hành, Bí Cảnh hiện cùng ảnh ở 24px trong dòng nhận thưởng. Không tự merge.

Codex builtin OpenAI `image_gen.imagegen`, ngày 01/11/2026, lượt 1/3, nền trong. Công cụ không trả model ID hoặc seed. Điều khoản đầu ra OpenAI, không CC0. Prompt thật ở `prompt.txt` (UTF-8, LF).

`RAW.png` sao chép nguyên byte từ đầu ra công cụ, native **1254×1254**; không resize hoặc mã hóa lại RAW. So SHA256 bản nguồn và bản sao trước khi nhập.

| File | SHA256 |
|---|---|
| RAW.png | 165ba9b119c2f49d8e501784ade58c36d42245469be680ca1f79d28ef1a77013 |
| prompt.txt | 6429a2b58a0a674bcf664a9dbe82f81370d2dab1feec793a5036ab95c18983eb |
| Bản đã nhập 32px `shared/assets/sprites/iso/item/hon_kinh_quyen.png` (khớp artifacts `icon/hon_kinh_quyen.png`) | baa0249b56e8b72195535236d55451c04314ab00d45a7709da585f81e16d3bfa |
| Bản thử 24px `icon/hon_kinh_quyen_24.png` (artifacts) | 8d6d9a4a9207b59ad970e301bbae85f3a2f36d3513b9fc216e94b59b15286306 |

## Tham chiếu

Chỉ hai ảnh vật phẩm có sẵn trong repo làm tham chiếu phong cách/lưới, không dùng ảnh thương mại mới: `shared/assets/sprites/iso/item/hoi_thanh_phu.png` và `uy_thac_lenh.png`. Hồi Thành Phù: Gwes / Tuomo Untinen (Reemax), LPC Items and game effects, CC-BY-SA 3.0 (các lựa chọn GPL giữ ở `art/CREDITS.md`). Ủy Thác Lệnh: ComfyUI SDXL + pixel-art-xl, hồ sơ hiện có trong `art/CREDITS.md`. Giữ nguyên byte, giấy phép và ghi công của ảnh cũ. Cuộn kinh mới không cắt/ghép pixel từ hai ảnh đó.

## Tái tạo bản thử ngoài repo

Chạy từ gốc repo, thay `<ngoai-repo>` bằng thư mục artifacts hoặc thư mục tạm:

```sh
node tools/assets/gemini-import.mjs --kind item --icon --cell auto --logo off --grid 1x1 --names hon_kinh_quyen --out <ngoai-repo>/32 art/src/item-hon-kinh-quyen-1595/RAW.png
node tools/assets/gemini-import.mjs --kind item --icon --size 24 --cell auto --logo off --grid 1x1 --names hon_kinh_quyen --out <ngoai-repo>/24 art/src/item-hon-kinh-quyen-1595/RAW.png
```

Tên công cụ hậu kỳ giữ tên cũ `gemini-import.mjs`; ảnh nguồn thực tế do Codex vẽ. Không nới checker. 32×32 theo vật phẩm hiện có; 24×24 chỉ để duyệt độ đọc. Cả hai dùng bảng màu chuẩn, alpha nhị phân.

## Trang duyệt trước nhập (lịch sử)

Artifacts phiên `soul_land_game-969`: `duyet-hon-kinh-quyen.html`, `so-sanh-icon.png`, sáu ảnh `truoc/sau-{tui,thu,bi-canh}.png`. Chrome `--mute-audio`, viewport 1280×720; client thật với dữ liệu dựng thử, không kết nối phòng game. Ở bước duyệt trước nhập, manifest thử chỉ cấp trong trình duyệt; ảnh sau Bí Cảnh gắn thử 24px vào dòng nhận thưởng để duyệt vị trí (client khi đó chỉ có chữ). Trang duyệt đã cập nhật thêm ảnh sau nhập thật bên dưới; không đổi luật/số thưởng.

Ảnh sau nhập thật ở `sau-nhap/{tui,thu,bi-canh}-<viewport>.png` trong artifacts, chụp bằng `npm run test:hon-kinh-browser --prefix client` với `HON_KINH_OUTPUT` trỏ thư mục ngoài repo. Ba viewport 1280×720, 1920×1080, 640×360; manifest và asset thật, không chặn request hoặc chèn ảnh vào DOM sau dựng màn. Bài kiểm xác nhận ảnh tải được ở cả ba nơi, Bí Cảnh hiện 24px, không hiện ảnh thưởng khi chưa nhận/hoàn lượt và ảnh lỗi vẫn giữ nhãn. Dữ liệu dựng thử chỉ ở client, không nối phòng game.

`BICANH_TOME` giữ nguyên mã `hon_kinh_quyen` dùng chung cho `BICANH.tome` và `ITEMS`; cách khai báo hằng chuỗi được bộ đọc `itemIconIds` hiện có hỗ trợ giống `AUTO_TOKEN`. Không sửa/nới checker, không đổi giá trị hoặc luật thưởng. Đăng ký bằng `validate.mjs --register item_hon_kinh_quyen --iso --keep-order` cùng thông tin nguồn ở CREDITS. Trước xin gộp: merge `origin/main`, sinh lại credits bằng `node tools/assets/credits.mjs`, kiểm `credits.test`, check/build/test:assets, AO review và CI đúng head theo luật #1483.
