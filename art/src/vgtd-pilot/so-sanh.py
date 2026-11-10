# Dựng tờ so sánh trước (gốc thu nhỏ) / sau (pixel hóa) cạnh hồn sư 64×64 và ô nền thật.
# Dùng: python so-sanh.py <VGTD gemini dir> <thư mục ra>   (chạy ở gốc repo, sau chay-lai.sh; cần Pillow)
import sys, os
from PIL import Image, ImageDraw, ImageFont

S, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
P = "art/src/vgtd-pilot/"
BG = (34, 30, 42, 255)
MAG = (200, 40, 200, 255)
GREY = (96, 96, 110, 255)


def F(n):
    return ImageFont.truetype("C:/Windows/Fonts/arial.ttf", n)


def load(p):
    return Image.open(p).convert("RGBA")


def nn(im, k):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


def on_bg(im, col):
    b = Image.new("RGBA", im.size, col)
    b.alpha_composite(im)
    return b


def keyed(im, tol=130):
    """Bỏ nền khoá (màu ở góc) thành alpha, chỉ để cắt sát cột 'trước'."""
    im = im.convert("RGBA")
    k = im.getpixel((6, 6))[:3]
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if abs(r - k[0]) + abs(g - k[1]) + abs(b - k[2]) < tol:
                px[x, y] = (0, 0, 0, 0)
    return im


def fit_h(im, h):
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


def cell(src, idx, n=3):
    w = src.width // n
    return src.crop(((idx % n) * w, (idx // n) * w, (idx % n) * w + w, (idx // n) * w + w))


HS = load("shared/assets/sprites/iso/lpc/linh_gac_giao.png").crop((0, 0, 64, 64))
TILE = load("shared/assets/iso/ground/bai_co_tia_gon_0_lon.png")


def scene(items, k, n):
    """Nền thật: lưới n×n ô lớn 64x64 (thoi 64x32, tâm (32,37)); items = [(ảnh, gốc, (i, j))]."""
    w, h = 2 * n * 32, n * 32 + 60
    sc = Image.new("RGBA", (w, h), (20, 18, 26, 255))
    ox, oy = n * 32, 24

    def pos(i, j):
        return ox + (i - j) * 32, oy + (i + j) * 16

    for t in range(2 * n):
        for i in range(n):
            j = t - i
            if 0 <= j < n:
                x, y = pos(i, j)
                sc.alpha_composite(TILE, (x - 32, y - 37 + 20))
    for im, org, (i, j) in sorted(items, key=lambda t: t[2][0] + t[2][1]):
        x, y = pos(i, j)
        sc.alpha_composite(im, (x - org[0], y + 20 - org[1]))
    return nn(sc, k)


def label(d, xy, t, n=14, col=(230, 230, 230)):
    d.text(xy, t, font=F(n), fill=col)


def sheet(title, w, h):
    s = Image.new("RGBA", (w, h), BG)
    d = ImageDraw.Draw(s)
    label(d, (14, 8), title, 18, (255, 225, 140))
    return s, d


# ---------- A. icon vật phẩm ----------
names_a = "linh_lenh_cong_hien linh_sam hoa_lien linh_thao loi_qua dan_lam dan_luc dan_hoang dan_bach".split()
names_m = "t1_sach t1_cuon t1_bia t2_sach t2_cuon t2_bia t3_sach t3_cuon t3_bia".split()
single = [("items/heal_pill.png", "item_dan_hoi_phuc"), ("items/breakthrough_pill.png", "item_dan_pha_canh"), ("items/stone_low.png", "item_linh_thach_ha")]
entries = []
src = load(f"{S}/items2/alchemy.png")
for i, n in enumerate(names_a):
    entries.append((cell(src, i).resize((128, 128), Image.LANCZOS), f"item_{n}"))
src = load(f"{S}/items2/manuals.png")
for i, n in enumerate(names_m):
    entries.append((cell(src, i).resize((128, 128), Image.LANCZOS), f"item_bi_tich_{n}"))
for f, nm in single:
    entries.append((load(f"{S}/{f}").resize((128, 128), Image.LANCZOS), nm))
cols, cw, ch = 4, 300, 172
rows_n = (len(entries) + cols - 1) // cols
sh, d = sheet("A. Icon vật phẩm tu tiên: trước = gốc 2048² thu về 128 px | sau = icon 32×32 phóng ×4", cols * cw + 20, 44 + rows_n * ch + 24 + 534 + 10)
icons = []
for k, (before, nm) in enumerate(entries):
    x, y = 14 + (k % cols) * cw, 44 + (k // cols) * ch
    sh.alpha_composite(on_bg(before, MAG), (x, y))
    after = load(f"{P}icon/{nm}.png")
    icons.append(after)
    sh.alpha_composite(nn(on_bg(after, GREY), 4), (x + 140, y))
    label(d, (x, y + 132), nm, 12)
y0 = 44 + rows_n * ch
label(d, (14, y0), "Cạnh hồn sư 64×64 trên ô nền thật (ô lớn bai_co_tia_gon_0, ×3):", 14, (255, 225, 140))
its = [(HS, (32, 58), (2, 2))]
its += [(icons[k], (16, 30), pos) for k, pos in zip((0, 5, 6, 9, 12, 18, 19, 4), ((1, 1), (3, 1), (1, 3), (3, 3), (0, 2), (2, 0), (3, 2), (2, 3)))]
sh.alpha_composite(scene(its, 3, 4), (14, y0 + 24))
sh.convert("RGB").save(f"{OUT}/A_icon_vat_pham.png")

# ---------- B. huy hiệu cảnh giới ----------
rs = load(f"{S}/realms/realm_badges.png")
sh, d = sheet("B. Huy hiệu cảnh giới: trước = gốc thu về 128 | sau = 32×32 ×4 và 24×24 ×4", 3 * 330 + 120, 44 + 3 * 172 + 24 + 534 + 10)
b32 = []
for k in range(9):
    x, y = 14 + (k % 3) * 330, 44 + (k // 3) * 172
    sh.alpha_composite(on_bg(cell(rs, k).resize((128, 128), Image.LANCZOS), MAG), (x, y))
    a32, a24 = load(f"{P}realm/gi_canh_gioi_{k + 1}.png"), load(f"{P}realm/gi_canh_gioi_{k + 1}_1x.png")
    b32.append(a32)
    sh.alpha_composite(nn(on_bg(a32, GREY), 4), (x + 130, y))
    sh.alpha_composite(nn(on_bg(a24, GREY), 4), (x + 130 + 136, y + 16))
    label(d, (x, y + 134), f"gi_canh_gioi_{k + 1} (ô {k + 1})", 12)
yb = 44 + 3 * 172
label(d, (14, yb), "Cạnh hồn sư 64×64 trên ô nền thật (×3):", 14, (255, 225, 140))
its = [(HS, (32, 58), (2, 2))] + [(b32[k], (16, 30), pos) for k, pos in zip((0, 2, 4, 5, 6, 8), ((1, 1), (3, 1), (1, 3), (3, 3), (0, 2), (2, 0)))]
sh.alpha_composite(scene(its, 3, 4), (14, yb + 24))
sh.convert("RGB").save(f"{OUT}/B_huy_hieu_canh_gioi.png")

# ---------- C. công trình ----------
B = [("prop_dan_lo", "sect/sect_alchemy_furnace.png"), ("prop_tang_kinh_cac", "sect/sect_scripture_pavilion.png"), ("prop_moc_nhan", "sect/sect_training_dummy.png")]
sh, d = sheet("C. Công trình tông môn: trước = gốc thu nhỏ cùng chiều cao | sau = pixel hóa ×3, dưới là _n (×1) | phía dưới: trên ô nền thật cạnh hồn sư 64×64", 1500, 560 + 24 + 630 + 10)
props = []
x = 14
for nm, f in B:
    after = load(f"{P}prop/{nm}.png")
    props.append(after)
    bb = after.getbbox()
    h = bb[3] - bb[1]
    s0 = load(f"{S}/{f}")
    s0.thumbnail((900, 900))
    s1 = fit_h(keyed(s0), h * 3)
    sh.alpha_composite(on_bg(s1, MAG), (x, 50))
    x += s1.width + 10
    ac = nn(after.crop(bb), 3)
    sh.alpha_composite(on_bg(ac, GREY), (x, 50))
    label(d, (x, 50 + ac.height + 4), nm, 12)
    nmap = load(f"{P}prop/{nm}_n.png")
    sh.alpha_composite(nmap.crop(bb), (x, 50 + ac.height + 24))
    x += ac.width + 30
its = [(props[0], (48, 126), (1, 1)), (props[1], (80, 190), (3, 2)), (props[2], (48, 126), (1, 3)), (HS, (32, 58), (4, 3)), (HS, (32, 58), (2, 4))]
label(d, (14, 560), "Trên ô nền thật (×3) cạnh hồn sư 64×64:", 14, (255, 225, 140))
sh.alpha_composite(scene(its, 3, 5), (14, 585))
sh.convert("RGB").save(f"{OUT}/C_cong_trinh.png")

# ---------- D. Lôi Kiếp ----------
fx = load(f"{P}fx/fx_loi_kiep_tia.png")
sh, d = sheet("D. Lôi Kiếp: trước = r1_strike thu nhỏ | sau = dải 4 khung 64×144 (×3) | trên ô nền thật", 1500, 520 + 24 + 630 + 10)
r1 = load(f"{S}/tribulation/r1_strike.png").convert("RGB")
r1.thumbnail((210, 430))
sh.alpha_composite(r1.convert("RGBA"), (14, 50))
sh.alpha_composite(nn(on_bg(fx, (30, 28, 40, 255)), 3), (260, 50))
label(d, (260, 50 + 144 * 3 + 4), "fx_loi_kiep_tia (4 khung: sáng, mảnh, nhánh, tàn)", 12)
fr = [fx.crop((i * 64, 0, i * 64 + 64, 144)) for i in range(4)]
its = [(HS, (32, 58), (1, 3)), (HS, (32, 58), (3, 1)), (fr[0], (32, 142), (2, 2))]
label(d, (14, 520), "Giáng xuống cạnh hai hồn sư 64×64 (khung 0, ×3):", 14, (255, 225, 140))
sh.alpha_composite(scene(its, 3, 5), (14, 545))
sh.convert("RGB").save(f"{OUT}/D_loi_kiep.png")
print("xong", OUT)
