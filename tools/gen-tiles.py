"""Tạo tileset pixel tạm thời (shared/assets/tiles.png). Có thể thay bằng tileset vẽ tay trong Aseprite,
miễn giữ nguyên vị trí ô (xem tools/gen-map.mjs)."""
from PIL import Image, ImageDraw
import random
random.seed(7)
T=16; COLS=8; ROWS=5 # BĐ6c: hàng 4 (ô 24–31) là băng tuyết của Cực Bắc Chi Địa; BĐ6d: hàng 5 (ô 32–35) là biển của Hải Thần Đảo
img=Image.new("RGBA",(COLS*T,ROWS*T),(0,0,0,0)); d=ImageDraw.Draw(img)
def H(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))+(255,)
def rect(x,y,w,h,c): d.rectangle([x,y,x+w-1,y+h-1],fill=H(c) if isinstance(c,str) else c)
GRASS=['#5a9440','#467e38','#335f35','#27453a']; GD=['#4c8236','#3b6c30','#2a502d','#1f3830']; GL=['#6ea84f','#579146','#40733f','#33584a']
CAN=['#2f7a2c','#276528','#1e4a2a','#2b2f55']; CAND=['#24612a','#1d5024','#163a22','#1f2240']; CANL=['#4b9c3f','#388636','#2b6436','#434a80']
def pos(i): return (i%COLS)*T,(i//COLS)*T
def grass(i,z):
    X,Y=pos(i); rect(X,Y,T,T,GRASS[z])
    for _ in range(6): rect(X+random.randrange(15),Y+random.randrange(14),1,2,random.choice([GD[z],GL[z]]))
for z in range(4): grass(z,z)
for k,z in enumerate([0,1]):
    grass(4+k,z); X,Y=pos(4+k)
    for _ in range(4): rect(X+2+random.randrange(11),Y+2+random.randrange(11),2,2,random.choice(['#ffd2e6','#fff27a','#c9b6ff','#ffffff']))
for k,c in enumerate(['#8c7552','#5d5146']):
    X,Y=pos(6+k); rect(X,Y,T,T,c)
    for _ in range(4): rect(X+random.randrange(14),Y+random.randrange(14),2,1,random.choice(['#a08a63','#6f5b3f']))
X,Y=pos(8); rect(X,Y,T,T,'#2d6a96'); rect(X+2,Y+4,6,1,'#5a9cc9'); rect(X+8,Y+10,5,1,'#5a9cc9')
X,Y=pos(9); rect(X,Y,T,T,'#957d57'); rect(X+3,Y+5,2,2,'#7d6747'); rect(X+10,Y+11,2,2,'#7d6747')
# tent
X,Y=pos(10); rect(X,Y,T,T,'#957d57')
for i in range(12): rect(X+8-(i+2)//2, Y+2+i, i+2, 1, '#c9a46a')
rect(X+6,Y+9,4,5,'#3a2a18')
# campfire
X,Y=pos(11); rect(X,Y,T,T,'#957d57'); rect(X+3,Y+11,10,3,'#5a3b22'); rect(X+5,Y+5,6,7,'#ff9a2e'); rect(X+7,Y+7,3,4,'#ffe066')
for z in range(4):
    grass(16+z,z); X,Y=pos(16+z)
    rect(X+3,Y+13,10,2,(0,0,0,70)); rect(X+6,Y+7,4,8,'#5a3b22'); rect(X+6,Y+7,1,8,'#6e4b2c')
    rect(X+2,Y,12,8,CAN[z]); rect(X+1,Y,14,5,CAN[z]); rect(X+2,Y+7,12,2,CAND[z]); rect(X+9,Y+2,2,2,CANL[z])
    X,Y=pos(20+z)
    rect(X+2,Y+11,12,5,CAN[z]); rect(X+1,Y+13,14,3,CAN[z]); rect(X+4,Y+9,8,2,CAN[z]); rect(X+4,Y+12,4,3,CANL[z])
# BĐ2: ô cho làng và thành (vẽ sau cùng để các ô cũ giữ nguyên điểm ảnh khi chạy lại)
# 12 đá lát (đường trong thành)
X,Y=pos(12); rect(X,Y,T,T,'#8e8a80')
for j in range(4):
    for i in range(4): rect(X+i*4+(2 if j%2 else 0),Y+j*4,3,3,random.choice(['#a39f94','#9a968b','#b0ab9f']))
# 13 mái ngói (chặn đường)
X,Y=pos(13); rect(X,Y,T,T,'#8f3b2e')
for j in range(4): rect(X,Y+j*4+3,T,1,'#5e2219'); rect(X+(j%2)*4,Y+j*4,2,3,'#b0574a')
# 14 tường nhà có cửa sổ (chặn đường)
X,Y=pos(14); rect(X,Y,T,T,'#d8c8a2'); rect(X,Y,T,2,'#5e2219'); rect(X,Y+14,T,2,'#8a7a5c'); rect(X+5,Y+5,6,6,'#3a2a18'); rect(X+6,Y+6,4,4,'#7fb8d8'); rect(X+7,Y+6,1,4,'#3a2a18'); rect(X+6,Y+8,4,1,'#3a2a18')
# 15 ruộng lúa
X,Y=pos(15); rect(X,Y,T,T,'#6b8a3a')
for i in range(0,T,3): rect(X+i,Y+1,1,13,random.choice(['#c9b84a','#a9a03c','#d8c860'])); rect(X+i,Y+1,2,2,'#e8d878')
# BĐ6c: ô băng tuyết cho Cực Bắc Chi Địa (màu theo art/palette.gpl: bạc, nước, đá, tán). Vẽ sau cùng như ô BĐ2.
# 24 tuyết, 25 tuyết sâu (xám xanh), 26 mặt băng (đi được), 27 khe băng (chặn), 28 lối tuyết giẫm,
# 29 thông tuyết (thân, chặn; nền trong suốt), 30 tán thông tuyết (lớp canopy), 31 băng tinh (khối pha lê băng, chặn; nền trong suốt)
def speck(X,Y,n,cols,w=1,h=1):
    for _ in range(n): rect(X+random.randrange(16-w+1),Y+random.randrange(16-h+1),w,h,random.choice(cols))
X,Y=pos(24); rect(X,Y,T,T,'#f4f8ff'); speck(X,Y,7,['#c0cce0','#ffffff'],2,1)
X,Y=pos(25); rect(X,Y,T,T,'#c0cce0'); speck(X,Y,7,['#7a8aa8','#f4f8ff'],2,1)
X,Y=pos(26); rect(X,Y,T,T,'#5a9cc9')
for _ in range(3): x0,y0=random.randrange(10),random.randrange(14); rect(X+x0,Y+y0,5,1,'#c0cce0'); rect(X+x0+1,Y+y0+1,3,1,'#f4f8ff')
rect(X+3,Y+11,1,3,'#2d6a96'); rect(X+4,Y+10,3,1,'#2d6a96'); rect(X+11,Y+3,1,2,'#2d6a96')
X,Y=pos(27); rect(X,Y,T,T,'#1f4a6b'); rect(X,Y,T,2,'#2d6a96'); rect(X,Y+14,T,2,'#2d6a96'); rect(X+2,Y+6,12,4,'#1a1020'); rect(X+5,Y+4,6,1,'#5a9cc9')
X,Y=pos(28); rect(X,Y,T,T,'#c0cce0'); speck(X,Y,5,['#8a87a0','#7a8aa8'],2,1)
for k in range(2): rect(X+3+k*6,Y+4+k*5,2,3,'#8a87a0'); rect(X+6+k*6,Y+8-k*4,2,3,'#8a87a0')
X,Y=pos(29)
rect(X+3,Y+14,10,2,(26,16,32,60)); rect(X+7,Y+11,2,4,'#5a3b22')
for i in range(11): rect(X+8-(i+4)//2,Y+i,i+4,1,'#1e4a2a' if i%4 else '#163a22')
for i in (2,6,9): rect(X+8-(i+4)//2,Y+i,(i+4)//2,1,'#f4f8ff')
X,Y=pos(30)
for i in range(10): rect(X+8-(i+2)//2,Y+6+i,i+2,1,'#1e4a2a' if i%3 else '#163a22')
rect(X+7,Y+5,2,2,'#f4f8ff'); rect(X+5,Y+9,3,1,'#f4f8ff'); rect(X+4,Y+13,4,1,'#f4f8ff')
X,Y=pos(31)
rect(X+2,Y+13,12,3,(26,16,32,60))
for (x0,w,h) in ((3,4,8),(7,4,13),(11,3,6)):
    rect(X+x0,Y+15-h,w,h,'#5a9cc9'); rect(X+x0,Y+15-h,1,h,'#c0cce0'); rect(X+x0+w-1,Y+15-h,1,h,'#2d6a96'); rect(X+x0,Y+15-h,w,1,'#f4f8ff')
# BĐ6d (Hải Thần Đảo): hàng 5, ô 32–35. Bản đồ khác thêm ô mới thì dùng ô 36 trở đi.
# 32 cát (đi được)
X,Y=pos(32); rect(X,Y,T,T,'#d9c48a')
for _ in range(7): rect(X+random.randrange(15),Y+random.randrange(15),1,1,random.choice(['#c4ad72','#ead9a6','#bfa468']))
# 33 rạn nông: nước cạn trên cát, có san hô (đi được)
X,Y=pos(33); rect(X,Y,T,T,'#4fa8b8'); rect(X+1,Y+3,5,1,'#7fd0d8'); rect(X+9,Y+11,5,1,'#7fd0d8')
for _ in range(3): rect(X+1+random.randrange(13),Y+1+random.randrange(13),2,2,random.choice(['#ff7a8a','#ffb07a','#e86ad0']))
# 34 biển sâu (chặn đường)
X,Y=pos(34); rect(X,Y,T,T,'#173f63'); rect(X+2,Y+5,6,1,'#2c5f8a'); rect(X+8,Y+11,6,1,'#2c5f8a')
# 35 đá ngầm trên cát (chặn đường)
X,Y=pos(35); rect(X,Y,T,T,'#d9c48a'); rect(X+2,Y+12,12,3,(0,0,0,70)); rect(X+2,Y+4,12,9,'#6a6258'); rect(X+4,Y+2,8,3,'#6a6258')
rect(X+4,Y+3,4,2,'#8f877a'); rect(X+3,Y+10,10,2,'#4f4840')
img.save("shared/assets/tiles.png"); print("tiles.png", img.size)
