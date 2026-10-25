# Kho asset riêng (gói giấy phép hạn chế)

Repo game là **công khai**. Gói **CC BY / public domain** (Free Pixel Effects Pack, Battle Effects của pimen) có thể vào repo công khai kèm ghi công; pipeline vẫn cho chúng đi qua kho riêng (`tier: cong_khai` trong `private-packs.json` ghi rõ) để gọn một đường. Một số gói asset mua / tải miễn phí cho dùng **trong game** nhưng **cấm phân phối lại file** (kể cả đã sửa): Pixel Holy Effects Pack 01, Super Pixel Effects Gigapack, Topdown Fantasy - Forest (giấy phép từng gói ở `tools/assets/private-packs.json`). Đưa ảnh vào repo công khai là phân phối lại, nên:

- **ảnh đã xử lý chỉ nằm ở kho riêng** `nguyenbinhanltv/soul-land-assets-private` (repo private);
- repo game giữ **mô tả** (`tools/assets/private-packs.json`), **manifest** (`shared/assets/sprites/private-manifest.json`, mục nào cũng `"private": true`), **CREDITS** và công cụ nhập (`tools/assets/import-pack.mjs`);
- CI release (`release.yml`) kéo kho riêng vào `shared/assets/private/` lúc build image; client tải từ server game như mọi asset (đúng "kèm trong game");
- **không có kho** (dev, fork, chưa cấu hình) thì mọi thứ vẫn chạy: client không thấy `private/present.json`, bỏ qua, game dùng hình cũ (PixelLab / LPC / vẽ bằng code).

Hai ràng buộc thêm: Gigapack **phải ghi công** "Super Pixel Effects Gigapack - Will Tice / unTied Games" (đã có ở `art/CREDITS.md`); Gigapack và Forest **cấm đưa vào AI** (không dùng làm ảnh tham chiếu, không đưa vào PixelLab / model).

## Việc của chủ repo (một lần, KHÔNG để agent làm)

Không agent nào tạo khóa, token hay repo private thay bạn. Các lệnh dưới chạy bằng tài khoản của bạn (cần `gh` đã đăng nhập và `ssh-keygen`).

1. **Tạo repo private** (rỗng):
   ```bash
   gh repo create nguyenbinhanltv/soul-land-assets-private --private --description "Asset gói giấy phép hạn chế của soul-land-mmo (không công khai)"
   ```
2. **Tạo deploy key chỉ đọc** (khóa nằm ở máy bạn, không vào repo nào):
   ```bash
   ssh-keygen -t ed25519 -N "" -C "soul-land-assets-deploy" -f ./assets-deploy-key
   gh repo deploy-key add ./assets-deploy-key.pub --repo nguyenbinhanltv/soul-land-assets-private --title "release-read-only"
   ```
   (không thêm `--allow-write`: mặc định chỉ đọc.)
3. **Đặt secret Actions ở repo game** (nội dung khóa riêng):
   ```bash
   gh secret set ASSETS_DEPLOY_KEY --repo nguyenbinhanltv/soul-land-mmo < ./assets-deploy-key
   ```
4. **Xóa file khóa ở máy** (secret đã lưu ở GitHub; khóa công khai nằm ở deploy key):
   ```bash
   rm ./assets-deploy-key ./assets-deploy-key.pub
   ```
5. **Đẩy ảnh đã nhập vào kho riêng.** Thư mục ra của `import-pack.mjs` (xem dưới) là gốc của kho: `packs/`, `licenses/`, `present.json`, `CREDITS-private.md`.
   ```bash
   cd <thư mục ra của import-pack>
   git init -b main && git add . && git commit -m "Nhập gói asset (#623)"
   git remote add origin git@github.com:nguyenbinhanltv/soul-land-assets-private.git
   git push -u origin main
   ```
6. Chạy workflow **Release** (Actions → Release → Run workflow trên `main`). Bảng tóm tắt lượt chạy có dòng "Asset riêng: đã kèm kho riêng". Thấy cảnh báo "Không clone được kho asset riêng" thì kiểm tên repo, deploy key đã thêm vào đúng repo, secret đặt đúng tên `ASSETS_DEPLOY_KEY`.

Đổi / thêm hiệu ứng: chạy lại `import-pack.mjs` (xem dưới), commit + push ở kho riêng, chạy lại Release. Đổi mô tả / manifest thì đi qua PR repo game như mọi thay đổi khác.

## Luật đặt tên

Asset từ gói ngoài **phải đổi tên theo quy ước game**, không giữ tên gốc của gói:

- tiền tố + tên tiếng Việt không dấu theo công dụng, chữ thường: `fx_*` hiệu ứng (`fx_hoi_mau`, `fx_khien_sang`, `fx_no_lon`, `fx_khoi_luot`, `fx_lua_xoay`), `vat_*` vật đứng (`vat_cay_thong_1`); không trùng khóa của manifest công khai (`fx_lua_ngon` đã có nên ngọn lửa đứng là `fx_lua_dung`);
- khóa manifest = tên file: `packs/<khóa>.png`, lớp sáng `packs/<khóa>_hao.png`;
- **bảng đổi tên** `tools/assets/private-rename.json` (khóa game → tên gốc + đường dẫn trong gói) là nơi DUY NHẤT trong repo chứa tên gốc, cùng CREDITS (cột "Tên game ← tên gốc") và `licenses/<gói>.md` ở kho riêng;
- `import-pack.mjs` từ chối khóa sai quy ước hoặc thiếu trong bảng đổi tên, và kiểm cuối lượt không còn tên gốc trong tên file / manifest; `tools/ci/check-private-assets.mjs` (CI) kiểm lại manifest ở repo.

Thêm hiệu ứng mới: thêm dòng vào `entries` (`private-packs.json`, khóa mới) **và** vào `private-rename.json`.

## Nhập gói (người làm asset)

Gói tải về để ở một thư mục **ngoài repo game** (chỉ đọc ảnh và văn bản, không chạy file thực thi nào trong gói).

```bash
node tools/assets/import-pack.mjs --out <thư mục ngoài repo> \
  --giga "<…/Super Pixel Effects Gigapack (Free Version)>" \
  --holy "<…/PixelHolyEffectsPack01 v1_1>" \
  --forest "<…/TopDownFantasy-Forest>" \
  --manifest shared/assets/sprites/private-manifest.json --credits art/CREDITS.md
```

- Công cụ **từ chối** `--out` nằm trong repo game.
- Mục nào gói chưa chỉ định (`--giga` / `--holy` / `--forest`) thì bỏ qua; `--only fx_no_lon,fx_bui_dat` nhập một phần.
- Nhuộm theo độ sáng vào dải 4 màu của bảng màu game (`ramps` trong `private-packs.json`), alpha 4 mức, viền `#1a1020` cho khói / bụi, cắt viền trống chung mọi khung (giữ tâm), tách lớp sáng `_glow` (client chạy cộng sáng).
- `layout` của hiệu ứng: dải một hàng (mặc định), `vertical` (khung xếp dọc, cần `fw` `fh`), `grid` (lưới, bỏ ô trống cuối); `rect` cắt trước khi tách khung.
- Vật đứng (`kind: prop`): `node tools/assets/import-pack.mjs --list <ảnh.png>` liệt kê hộp bao các mảnh rời để chọn `rect`.
- Thêm hiệu ứng mới: xem "Luật đặt tên", chạy lại, rồi nối vào code ở `client/src/` bằng `playPriv(sheets, "<key>", {...})` (`privateAssets.ts`).
- Thư mục ra có `preview.html` xem nhanh từng hiệu ứng lặp.

## Dev local: đặt kho riêng vào đúng chỗ

Có quyền đọc kho riêng thì:

```bash
git clone git@github.com:nguyenbinhanltv/soul-land-assets-private.git shared/assets/private
npm run dev:client        # tự thấy private/present.json
```

`shared/assets/private/` và `art/src/private/` đã nằm trong `.gitignore`; không `git add -f`. Muốn thấy hình cũ để so: thêm `?pfx=0` vào URL (trang thử `?thu=fx` cũng nhận). `npm run check` có bước `tools/ci/check-private-assets.mjs` (CI chạy luôn): báo lỗi nếu file kho riêng bị theo dõi trong git, `.gitignore` thiếu dòng chặn, hoặc tên file trùng gói gốc.

Không có quyền đọc kho riêng: bỏ qua, mọi thứ chạy như cũ.

## Nối vào game (hiện tại)

| Hiệu ứng | Gói | Chỗ nối | Thay gì |
|---|---|---|---|
| `fx_va_cham_vang` (tia lửa va chạm), `fx_ket_lieu` (nổ nhỏ, độ nặng 3) | Gigapack | `hitFeel.ts` `playHitFeelSheets` | chồng lên sheet code `fxh_*` |
| `fx_no_lon` | Gigapack | `GameScene.tienCoFx` (tiên cơ Cường Công) | thay quả nổ LPC `fx_no` (thiếu thì giữ `fx_no`) |
| `fx_chem_sang` | Holy | `skillVisual.ts` `SkillVisualPlayer.overlay` (chiêu T2+ hệ Quang của chính mình; lớp sét giáng đã bỏ) | chồng lên sheet PixelLab S3, **không thay** sheet S3 nào |
| `fx_hoi_mau`, `fx_khien_sang` | Holy | `GameScene` tin `dmg` có `heal` / `shield` | thêm hiệu ứng ở người nhận (trước chỉ có số) |
| `fx_song_quang` | Holy | `GameScene.tienCoFx` nhánh Hộ thể (Phụ trợ) | chồng lên vòng hạt |
| `fx_khoi_luot`, `fx_bui_dat` | Gigapack | `GameScene.tienCoFx` nhánh Lướt (Mẫn Công) | thêm khói chỗ xuất phát, bụi chỗ dừng |

Vật rừng (`vat_*`, Forest (cây, bụi, đá, nấm, khúc gỗ)) đã cắt vào kho riêng nhưng **chưa nối vào bản đồ** (cần chọn ô gid và bản đồ ở bước sau).
