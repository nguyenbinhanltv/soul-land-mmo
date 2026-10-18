"""Tạo tileset pixel tạm thời (shared/assets/tiles.png). Có thể thay bằng tileset vẽ tay trong Aseprite,
miễn giữ nguyên vị trí ô (xem tools/gen-map.mjs)."""
from PIL import Image, ImageDraw
import random
random.seed(7)
T=16; COLS=8; ROWS=3
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
img.save("shared/assets/tiles.png"); print("tiles.png", img.size)
