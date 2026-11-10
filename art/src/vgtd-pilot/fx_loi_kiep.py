# Pixel hóa tia Lôi Kiếp (r1_strike.png, nền đen) thành dải 4 khung fx_loi_kiep_tia.
# Dùng: python fx_loi_kiep.py <r1_strike.png> <ra.png>  (cần Pillow; chỉ đọc ảnh nguồn)
# Khóa nền đen bằng độ sáng (alpha = max kênh), xoá dấu ✦ Gemini ở góc dưới-phải, cắt sát, thu về FW×FH,
# lượng tử về thang tím/bạc của art/palette.gpl, alpha 0/255; 4 khung: sáng nhất → mảnh → nhánh phụ → tàn.
import sys
from PIL import Image
FW, FH = 64, 144
RAMP = [(0x2b,0x1a,0x40),(0x5d,0x43,0x80),(0x8a,0x6b,0xff),(0xc0,0xcc,0xe0),(0xf4,0xf8,0xff),(0xff,0xff,0xff)]  # Tím tối, Tím gốc, Tím phát sáng, Bạc 3, Bạc 4, Trắng
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
w, h = im.size
for y in range(int(h*0.90), h):            # ✦ góc dưới-phải
    for x in range(int(w*0.80), w):
        im.putpixel((x, y), (0, 0, 0))
bb = im.convert("L").point(lambda v: 255 if v > 40 else 0).getbbox()
im = im.crop(bb)
sc = min((FW-2)/im.width, (FH-2)/im.height)
sm = im.resize((max(1, round(im.width*sc)), max(1, round(im.height*sc))), Image.LANCZOS)
def frame(gain, cut):
    f = Image.new("RGBA", (FW, FH), (0,0,0,0))
    ox, oy = (FW-sm.width)//2, FH-sm.height
    for y in range(sm.height):
        for x in range(sm.width):
            r, g, b = sm.getpixel((x, y))
            v = (0.3*r + 0.59*g + 0.11*b)*gain
            if v < cut: continue
            t = min(1.0, v/255) ** 1.5
            # bậc thang theo độ sáng (gamma 1,5): lõi trắng, quầng tím
            i = min(len(RAMP)-1, int(t*len(RAMP)))
            f.putpixel((ox+x, oy+y), RAMP[i]+(255,))
    return f
frames = [frame(1.25, 38), frame(1.15, 80), frame(1.0, 55), frame(0.75, 45)]
sheet = Image.new("RGBA", (FW*len(frames), FH), (0,0,0,0))
for i, f in enumerate(frames): sheet.paste(f, (i*FW, 0))
sheet.save(out)
print(out, sheet.size, "frame", FW, FH)
