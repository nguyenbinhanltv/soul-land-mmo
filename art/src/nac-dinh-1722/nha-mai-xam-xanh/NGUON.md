# Nhà mái xám xanh — Nặc Đinh Thành (#1722)

Codex tạo biến thể mái xám xanh từ ảnh nhà hai tầng Codex đợt 1 bằng OpenAI `image_gen.imagegen`, ngày 03/11/2026. Giấy phép theo điều khoản đầu ra OpenAI, không CC0. Không dùng ảnh phim hoặc gói ngoài. RAW giữ ngoài repo; hash tại `nguon.json`.

## Prompt thật

Use case: precise-object-edit. Edit target: attached own Codex two-storey half-timber house sprite. Create the blue-grey tiled roof variant for the SAME game city street. Change ONLY the orange-red clay roof tiles and chimney cap tiles to muted slate BLUE-GREY, cool desaturated blue-green slate with subtle tile shading. Preserve the exact silhouette, footprint, framing, orthographic isometric 2:1 camera, two floors, cream plaster, dark timber, arched windows, wrought iron balcony, door at ground level, chimney stone, outline and upper-left light. Roof ridges remain perfectly straight along existing axes, no geometric redesign. Pixel game art matching input, no text or sign, no people, no extra objects, no ground plane or shadow. Actual transparent background outside house; preserve original alpha. One isolated house, centered, entire house visible.

## Nhập lại

`gemini-import.mjs` chỉ là tên công cụ nhập; nguồn ảnh là Codex.

```sh
node tools/assets/gemini-import.mjs --kind object --size 112x112 --cell 1 --logo off --grid 1x1 --palette gpl --names nha_mai_xam_xanh --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs prop nha_mai_xam_xanh <tmp>/nhap/nha_mai_xam_xanh.png --map nac_dinh_thanh
node tools/assets/normal.mjs shared/assets/sprites/iso/props/nha_mai_xam_xanh.png
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

Khung cuối 96×112, chân [48,108], không lật ngang. Thay ba nhà tại các khối [17,44], [40,44], [54,44] trong `build.compounds` Nặc Đinh, giữ nhà mái đỏ cam xen kẽ. Không đổi bố cục vật lý, footprint, lưới chặn hoặc gameplay; không cần sửa công cụ dựng nhà.
