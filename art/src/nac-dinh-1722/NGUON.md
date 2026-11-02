# Nặc Đinh Thành — asset đợt 1 (#1722)

Ngày: 02/11/2026. Công cụ: Codex builtin OpenAI `image_gen.imagegen`, `transparent_background: true`. Không dùng ảnh tham chiếu ngoài, không sao chép hình phim. Giấy phép: điều khoản đầu ra OpenAI, **không CC0**. PR nháp #1723 chờ chủ repo duyệt; không tự gộp.

RAW giữ ngoài repository trong artifacts phiên `soul_land_game-1016`; hash và kích thước tại `nguon.json`. Không chỉnh byte RAW. PNG game và normal map sinh bằng công cụ bên dưới.

## Prompt thật

### cong_thanh_vom

Create one production game sprite of a fortified city arched gate, isolated on true transparent background. Original fantasy architecture, no franchise reference. Pixel art isometric 2:1 projection, elevated corner view, crisp hard pixel clusters, limited muted desaturated palette, dark outline #1a1020, light from upper left. Target final sprite 192 by 160 pixels, compose with generous transparent padding for later nearest-neighbor reduction. Grey mossy granite masonry arch, two stout flanking watch turrets, heavy iron strapped wooden double doors fully opened against the sides leaving a clearly transparent open passage through the arch. Small abstract city crest over arch, no letters, no people. Warm grey stone with restrained green moss and dull terracotta turret roofs. Entire structure visible, feet level aligned along isometric footprint. No ground slab, no scenery, no floor, no cast shadow, no glow, no text, no watermark. Single coherent building only.

### nha_khung_go_2tang

One single production game sprite of a two-storey half-timbered fantasy town house. True transparent background. Pixel art, strict isometric 2:1 ground projection viewed from elevated corner, crisp square pixel clusters, dark #1a1020 outlines, muted desaturated earthy palette, upper-left lighting. Intended final 112x112 sprite after reduction. Exposed dark brown structural timber framing with warm beige plaster infill, terracotta red-orange clay tiled pitched roof, small wrought-iron balcony, arched glass windows, simple ground floor wooden doorway. Two storeys clearly readable. Whole house visible and centered with padding, front and right side visible, vertical walls. No ground slab, no grass, no environment, no people, no cast shadow, no glow, no letters, no watermark. Original architecture, compact silhouette, detail readable at small pixel art scale.

### nha_khung_go_3tang

One single production game sprite: THREE STOREY half-timbered town house, isolated on true transparent background. Original fantasy architecture. Pixel art with crisp square pixel clusters, strict isometric 2:1 ground projection elevated corner view, upper-left lighting, dark #1a1020 outline, muted desaturated terracotta orange-red tiled pitched roof, warm beige plaster walls, exposed dark brown wooden beams, small wrought iron balcony, arched glass windows. Exactly three clearly distinct storeys, ground floor wooden shop door without signage. Front and right side visible; compact taller silhouette, entirely visible, padding for later reduction to 112x128 pixels. No ground base, no floor, no scenery, no people, no cast shadows, no glow, no letters, no text, no watermark. Readable game pixel art, sparse material detail and broad planes, not photorealistic.

## Dây chuyền nhập

`gemini-import.mjs` chỉ là tên công cụ nhập, nguồn ảnh là Codex:

```sh
node tools/assets/gemini-import.mjs --kind object --size <cỡ> --cell 1 --logo off --grid 1x1 --palette gpl --names <tên> --out <tmp> <RAW>
node tools/assets/iso-build.mjs prop <tên> <tmp>/<tên>.png --map nac_dinh_thanh
node tools/assets/normal.mjs shared/assets/sprites/iso/props/<tên>.png
node tools/assets/validate.mjs --register prop_<tên> --iso --keep-order --tool "ChatGPT / Codex (OpenAI image_gen.imagegen)" --prompt "<prompt>" --note "Đợt 1 #1722; điều khoản đầu ra OpenAI, không CC0; PR nháp chờ chủ repo duyệt."
```

Nhà 2 tầng nhập 112×112, nhà 3 tầng 112×128; công cụ cắt khoảng trống hai bên giữ tỷ lệ thành 96×112 và 96×128. Foot nhà đúng kết quả iso-build. Quy trình và chân của cổng thay mới ở mục sửa cổng bên dưới.

## Phạm vi bố cục

Bảy khối nhà phố hiện có tại hàng 44 dùng xen kẽ hai nhà mới qua `build.compounds`, không đổi lưới chặn. Ba cổng thay gid tường chặn sẵn tại [0,52], [169,52], [80,0] bằng `citygate`/`citygateNorth`; phần trụ neo ở đầu tường, phần vòm trải qua lối mở không chặn. Bản sửa sau phản hồi bỏ hai ô tường giữ chỗ phía trong; các lối qua cổng giữ nguyên, chỉ tiêu luồng không xấu đi. Bỏ tháp giữ chỗ ở góc/đầu tường (`build.tower`) để không chồng hai tháp rời lên cổng mới. Các sân cổng, điểm đến và đại lộ giữ nguyên. Các asset còn lại trong #1722 làm đợt sau.

## Sửa cổng theo phản hồi chủ repo (02/11/2026)

Cổng cũ bị loại do hình học lệch. Hai biến thể mới cong_thanh_vom_x/y dùng khung khối tự dựng bằng comfy-shape.mjs, phép chiếu sx=x-y, sy=(x+y)/2-z; không lật ngang. Codex chỉ tô vân đá/ngói/gỗ trên ảnh khung, không dùng tham chiếu ngoài. Mặt vòm là một khối liên tục, không phải dãy thanh rời.

Model ở gate-x-guide.json và gate-y-guide.json; tham số chiếu/chân ở gate-x-meta.json và gate-y-meta.json. render-cong.mjs dựng lại silhouette ở 16 pixel mỗi đơn vị thế giới và lấy màu/vân từ RAW Codex; chỉ khóa đường bao ngoài, bỏ các đường chia khối dựng bên trong. Chạy từ gốc repo với thư mục RAW và đầu ra tạm ngoài repo. Sau đó iso-build prop --foot-x 128, normal và validate như trên.

Chân sprite cuối: X [48,103] → [192,175], chênh [144,72] đúng 9 bước trục x; Y [176,95] → [48,159], chênh [-128,64] đúng 8 bước trục y. Mọi cạnh ngang có hướng chiếu 2:1. tiles.json neo từ tâm trụ thứ nhất; không suy chân theo đáy ảnh. Ảnh lưới 32×16 đánh dấu cả hai tâm trụ ở artifacts để chủ repo kiểm bằng mắt.

Cổng bắc dùng X, tây/đông dùng Y. Bỏ hai prop tường xám xanh giữ chỗ ở [78,2]/[92,2], nối trực tiếp với tường biên chính; chỉ tiêu luồng không xấu đi. Nhà khung gỗ giữ nguyên. PR vẫn nháp loại B.

Màu đá bổ sung đúng build.fence.wall (#8f8c86, #6d6a66, #a8a49c) vào bảng nhấn Nặc Đinh trước khi iso-build lượng tử, tránh bị đưa sang xám ngói ngả lam. Prompt thật của hai texture cuối ở gate-prompts.json. Không sửa ảnh nhà phố.
