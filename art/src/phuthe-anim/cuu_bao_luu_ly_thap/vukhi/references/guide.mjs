// Chỉ sơ đồ cấu trúc ảnh dẫn theo chủ repo; không tạo/sửa pixel vũ khí nhập game.
import fs from 'node:fs';
import { Img, encodePng } from '../../../../../../tools/assets/lib.mjs';
const im=new Img(640,960),bg=[238,238,238,255],ink=[26,16,32,255];
const rect=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)im.set(i,j,c);};
rect(0,0,640,960,bg);
const colors=[[40,109,117],[57,89,134],[84,77,136],[113,71,120],[145,62,87],[170,100,59],[180,147,70],[112,86,143],[102,160,186]];
rect(220,891,200,24,ink);rect(224,895,192,16,[38,51,62,255]);
for(let i=0;i<9;i++){
 const y=860-i*88,w=130-i*9;
 rect(320-w+16,y,2*w-32,32,ink);rect(320-w+20,y+3,2*w-40,26,[38,61,80,255]);
 for(let j=0;j<22;j++){const half=w-Math.floor((21-j)*.8);rect(320-half,y-22+j,2*half,1,ink);if(j>2&&j<19)rect(323-half,y-22+j,2*half-6,1,[...colors[i],255]);}
 rect(314,y+8,12,15,[188,155,80,255]);
}
for(let j=0;j<60;j++){const w=Math.max(1,Math.floor(j/5));rect(320-w,74+j,w*2,1,[188,155,80,255]);}
fs.writeFileSync(new URL('./nine-roofs-guide.png',import.meta.url),encodePng(im));
