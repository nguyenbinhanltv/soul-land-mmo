# bang_phuong_hoang — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**Chọn làm tham chiếu ngoại hình theo quyết định mới ở PR #1145; chưa phải phụ thể đạt năm hướng.** Lượt 1 và 2: ne quay trái và lộ mặt, cánh ngoài cắt mép. Lượt 3: ne quay phải nhưng vẫn lộ mắt/mỏ; se và e quá giống nhau, cánh sát biên. Khoảng 3 góc thật đúng, n nhìn lưng đúng. Đúng lam thẫm, lam băng, lõi tím; còn chi tiết nhỏ và viền màu sáng, thiếu vòng trận hoa tuyết. Chưa đạt 5 hướng.

- Lượt 1: `candidates/concept-attempt1.png`; SHA256 ảnh `6bc3de2091aab98ec6e934f92b74d0f16e0863ba3dd0afe312a6b5ab90a54f5c`; SHA256 prompt `b4be4f0752dd6b8b5f776dad26f89e9a36784d6e7deed1e548ca550aea1da536`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `e92e2e04e1af3a1b47d5ba5cc72a789248ed9771d033469dc33cd836d235ed62`; SHA256 prompt `b4be4f0752dd6b8b5f776dad26f89e9a36784d6e7deed1e548ca550aea1da536`.
- Lượt 3: `concept-attempt3.png`; SHA256 ảnh `2060b04e927be7a829816508203ed5663a993930ffe94b77be0ad4a0b6e16d2c`; SHA256 prompt `b4be4f0752dd6b8b5f776dad26f89e9a36784d6e7deed1e548ca550aea1da536`.

Bản tốt nhất để tham chiếu ngoại hình: `concept-attempt3.png` (lượt 3), đã chọn ở thư mục chính với trạng thái `selected_appearance_reference`. Lượt 1 và 2 ở `candidates` để đối chiếu. Các lỗi còn lại của lượt 3 giữ ở mục khai báo duyệt mắt; chưa duyệt làm phụ thể năm hướng. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/bang_phuong_hoang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW + chân dung RAW và bản thử P1c #1158; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |

## Khai báo duyệt mắt (`--eye`)

Công cụ vohon-check hiện không có cờ `--eye`; các khai báo dưới đây dùng cùng khuôn lỗi mắt, không chạy bộ kiểm hồn thú cho võ hồn.

```text
--eye "concept-attempt3=hướng — ne / se-e — ne còn lộ mắt/mỏ, se/e gần nhau"
--eye "concept-attempt3=bố cục — cánh — sát biên; thiếu vòng trận hoa tuyết"
```

```text
LỖI: concept-attempt3 — hướng — ne / se-e — ne còn lộ mắt/mỏ, se/e gần nhau (mắt)
LỖI: concept-attempt3 — bố cục — cánh — sát biên; thiếu vòng trận hoa tuyết (mắt)
```

Theo quyết định ở PR #1145: concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý ở khâu phụ thể bằng hình nộm. Giữ nguyên kết quả kiểm RAW và mọi lỗi đã quan sát, không coi ảnh này là sheet năm hướng dùng trực tiếp. SHA256 ảnh và prompt không đổi khi chuyển vị trí.

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `4a4c95174c656736833ff9ac4b9a6dd98f55968f92abc2d947798bf2f765de38`. Prompt CLI nguyên văn `candidates/portrait-attempt1.prompt.txt`, SHA256 `120c7addc3eb02482a0235f03f048a269c5f7b492e0e1f45638cc690fa4136cc`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt3.png`, SHA256 `2060b04e927be7a829816508203ed5663a993930ffe94b77be0ad4a0b6e16d2c`. Hồ sơ lệnh và kết quả kiểm: `candidates/portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `candidates/portrait-attempt1-P1c/bang_phuong_hoang-portrait.png`, 64×64, 8 màu, giữ 8/8 điểm sáng. Xem `candidates/portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — đầu gần chính diện; mào băng nhiều nhánh, sáng ngoài mắt/mỏ và hình rối ở 64×64; còn sáng-tran, nhieu-chi-tiet, gan-mau, nen-chu-the theo bộ kiểm"
```

**Kết luận chân dung:** lượt 1 chưa đạt brief, toàn bộ ở `candidates/`; chưa có chân dung cuối được chọn. Prompt lưu UTF-8 LF theo Git, chỉ chuẩn hóa xuống dòng so với chuỗi CLI; SHA256 chuỗi gửi ban đầu `d07338c24d61fd03e7313b61b818931018dc66b9ce804b6100b4abc32f3426fb`, SHA256 file prompt Git `120c7addc3eb02482a0235f03f048a269c5f7b492e0e1f45638cc690fa4136cc`. Không sửa nội dung prompt.

```text
--eye "portrait-attempt1=bản P1c — 64×64 — mất nhiều khối tối; điểm mắt/đầu chưa tách rõ, chưa đạt brief; giữ làm candidate"
```


## Icon lượt 1 — #1159, chưa nhập game

Ngày 2026-10-27. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW giữ nguyên byte: `icon-attempt1.png`, SHA256 `34c7d11b20389f26b6d01ef54e6c10229a367788d5d7e29e1d1be1f2bf6d2873`; prompt tự sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type icon --id bang_phuong_hoang --style-ref art/src/vohon-v2/bang_phuong_hoang/concept-attempt3.png`, SHA256 `49fa53b91c4b2e2dd851930a0b17fccd9ac3d0e7c3284674e164b95433b91d24`. Ảnh neo ngoại hình: `concept-attempt3.png`. Không viết tay prompt, không dùng lượt hỏng làm ảnh neo. Hồ sơ: `icon-attempt1.source.json`.

Chuyển bằng `vohon-pixelize --type icon --preset icon --colors 8 --merge 24 --passes 2 --protect on`. Bản 24/32 px ở `icon-attempt1-pixel/`; báo cáo JSON kèm từng ảnh. Đây là ứng viên cần duyệt, không tự tuyên bố đạt đẹp.

RAW: NHẸ; số đo `{"w":1254,"h":1254,"ratio":1,"border":{"clear":1,"flat70":0},"fill":0.91,"softness":0.884,"bigColors":114,"grid":{"period":37,"ratio":1.24},"paletteMatch":0.77,"smallAccent":"8/8"}`.

32px: NHẸ; số đo `{"w":32,"h":32,"colors":8,"outline":1,"hot":0.47,"contrast":0.343,"edge":0.647,"sep":28.2,"bgRatio":1.01,"accent":"8/8"}`.

24px: NHẸ; số đo `{"w":24,"h":24,"colors":8,"outline":1,"hot":0.453,"contrast":0.34,"edge":0.673,"sep":40.6,"bgRatio":1.04,"accent":"8/8"}`.

### Khai báo duyệt mắt icon (`--eye`)

CLI vohon:check chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên kết quả máy.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 88% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.24 ở chu kỳ 37 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (4 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — sang-tran — vùng sáng 47%: sáng tràn, mất đối lập tối / sáng của phong cách mực tối"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.647 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32px — gan-mau — hai màu lớn chỉ cách nhau 28.2 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (7 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — sang-tran — vùng sáng 45%: sáng tràn, mất đối lập tối / sáng của phong cách mực tối"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.673 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=duyệt mắt — Đầu phượng băng là biểu tượng đơn; cần so sánh mắt, mào và các mảng tinh thể ở 24/32 px."
```
