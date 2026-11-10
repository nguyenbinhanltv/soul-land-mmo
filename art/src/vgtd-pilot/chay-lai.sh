#!/bin/sh
# Tái lập lô thử Vạn Giới Tiên Đồ → Đấu La Tu Tiên. Chạy ở gốc repo: VGTD=<thư mục assets-src/gemini của dự án cũ> sh art/src/vgtd-pilot/chay-lai.sh
# Chỉ ĐỌC nguồn. Ra art/src/vgtd-pilot/{icon,realm,prop,fx}. Chưa nối vào manifest / code / bản đồ.
set -e
S="${VGTD:?đặt VGTD=.../van-gioi-tien-do/assets-src/gemini}"; O=art/src/vgtd-pilot; T="${TMPDIR:-/tmp}/vgtd-pilot"; mkdir -p "$T" $O/icon $O/realm $O/prop $O/fx
G="node tools/assets/gemini-import.mjs"
# 1. Icon 32×32. Nền magenta lệch sắc từng ảnh: --key dò theo góc; --fringe 25 bỏ viền hồng (tím đậm như quả sấm bị ăn nếu fringe cao: giữ 25, thêm bản fringe 0 cho item_loi_qua).
$G --kind item --icon --grid 3x3 --names item_linh_lenh_cong_hien,item_linh_sam,item_hoa_lien,item_linh_thao,item_loi_qua,item_dan_lam,item_dan_luc,item_dan_hoang,item_dan_bach --key "#C020B8" --bg-tol 110 --fringe 30 --unline --out $T/alch "$S/items2/alchemy.png"
$G --kind item --icon --grid 3x3 --names item_bi_tich_t1_sach,item_bi_tich_t1_cuon,item_bi_tich_t1_bia,item_bi_tich_t2_sach,item_bi_tich_t2_cuon,item_bi_tich_t2_bia,item_bi_tich_t3_sach,item_bi_tich_t3_cuon,item_bi_tich_t3_bia --key "#FF2BFC" --bg-tol 100 --fringe 25 --unline --out $T/man "$S/items2/manuals.png"
$G --kind item --icon --grid 3x3 --names item_linh_lenh_cong_hien,item_linh_sam,item_hoa_lien,item_linh_thao,item_loi_qua,item_dan_lam,item_dan_luc,item_dan_hoang,item_dan_bach --key "#FD00F9" --bg-tol 90 --unline --out $T/alch0 "$S/items2/alchemy.png"   # fringe 0: chỉ lấy item_loi_qua
for p in heal_pill:item_dan_hoi_phuc breakthrough_pill:item_dan_pha_canh stone_low:item_linh_thach_ha; do  # craft_material.png làm gemini-import sập (removeLogo tràn ngăn xếp): bỏ khỏi lô thử
  $G --kind item --icon --grid 1x1 --names "${p##*:}" --key "#FF0AFB" --bg-tol 100 --fringe 25 --out "$T/${p##*:}" "$S/items/${p%%:*}.png"; done
# 2. Huy hiệu cảnh giới 32 và 24 (đánh số theo thứ tự ô trái→phải, trên→dưới; ánh xạ cảnh giới thật làm sau)
N=gi_canh_gioi_1,gi_canh_gioi_2,gi_canh_gioi_3,gi_canh_gioi_4,gi_canh_gioi_5,gi_canh_gioi_6,gi_canh_gioi_7,gi_canh_gioi_8,gi_canh_gioi_9
$G --kind item --icon --grid 3x3 --names $N --key "#FB00FD" --bg-tol 100 --fringe 25 --unline --out $T/realm32 "$S/realms/realm_badges.png"
$G --kind portrait --size 24 --grid 3x3 --names $N --key "#FB00FD" --bg-tol 100 --fringe 25 --unline --out $T/realm24 "$S/realms/realm_badges.png"
# 3. Công trình (vật đứng; mộc nhân cần gỡ bóng Tàng Kinh Các lọt vào ảnh gốc trước: python dummy_clean.py)
$G --kind object --names prop_dan_lo --size 96x128 --scale 1 --key "#F12FEF" --fringe 25 --out $T/furn "$S/sect/sect_alchemy_furnace.png"
$G --kind object --names prop_tang_kinh_cac --size 160x192 --scale 1.4 --key "#F331F2" --fringe 25 --out $T/pav "$S/sect/sect_scripture_pavilion.png"
python art/src/vgtd-pilot/dummy_clean.py "$S/sect/sect_training_dummy.png" $T/dummy_clean.png
$G --kind object --names prop_moc_nhan --size 96x128 --scale 1 --key "#F12FEF" --fringe 25 --out $T/dummy $T/dummy_clean.png
# 4. Lôi Kiếp
python art/src/vgtd-pilot/fx_loi_kiep.py "$S/tribulation/r1_strike.png" $O/fx/fx_loi_kiep_tia.png
# Gom bản chọn vào art/src/vgtd-pilot/
for f in $T/alch/item_*.png; do case "$f" in *item_loi_qua.png) ;; *) cp "$f" $O/icon/;; esac; done
cp $T/alch0/item_loi_qua.png $O/icon/; cp $T/man/item_*.png $O/icon/
for d in item_dan_hoi_phuc item_dan_pha_canh item_linh_thach_ha; do cp $T/$d/$d.png $O/icon/; done
for f in $T/realm32/gi_*.png; do cp "$f" $O/realm/; done
for f in $T/realm24/gi_*.png; do b=$(basename "$f" .png); cp "$f" $O/realm/${b}_1x.png; done
cp $T/furn/prop_dan_lo.png $T/pav/prop_tang_kinh_cac.png $T/dummy/prop_moc_nhan.png $O/prop/
node tools/assets/normal.mjs $O/prop/prop_dan_lo.png $O/prop/prop_tang_kinh_cac.png $O/prop/prop_moc_nhan.png
