# Gỡ bóng ma của Tàng Kinh Các lọt vào sect_training_dummy.png: xoá hộp ngoài thân mộc nhân, giữ cụm liên thông lớn nhất.
# Dùng: python dummy_clean.py <sect_training_dummy.png> <ra.png>  (Pillow; chỉ đọc nguồn)
import sys
from PIL import Image, ImageDraw, ImageFilter
im = Image.open(sys.argv[1]).convert("RGBA"); k = im.getpixel((5, 5))[:3]
d = ImageDraw.Draw(im); s = im.width/900
for r in [(0,0,275,560),(570,0,900,255),(665,0,900,560)]: d.rectangle([r[0]*s,r[1]*s,r[2]*s,r[3]*s], fill=k+(255,))
W = 512; px = im.resize((W, W), Image.BOX).load()
m = [[sum(abs(px[x,y][i]-k[i]) for i in range(3)) > 110 for x in range(W)] for y in range(W)]
seen = [[0]*W for _ in range(W)]; best = []
for y in range(W):
  for x in range(W):
    if m[y][x] and not seen[y][x]:
      st = [(x,y)]; seen[y][x] = 1; c = []
      while st:
        cx, cy = st.pop(); c.append((cx, cy))
        for dx in (-1,0,1):
          for dy in (-1,0,1):
            nx, ny = cx+dx, cy+dy
            if 0<=nx<W and 0<=ny<W and m[ny][nx] and not seen[ny][nx]: seen[ny][nx] = 1; st.append((nx,ny))
      if len(c) > len(best): best = c
keep = Image.new("L", (W, W), 0); kp = keep.load()
for x, y in best: kp[x, y] = 255
keep = keep.filter(ImageFilter.MaxFilter(9)).resize(im.size, Image.BILINEAR).point(lambda v: 255 if v > 20 else 0)
bg = Image.new("RGBA", im.size, k+(255,)); bg.paste(im, (0,0), keep); bg.save(sys.argv[2])
