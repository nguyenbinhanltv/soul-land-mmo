import fs from'node:fs';import path from'node:path';const dir=path.join(process.env.TEMP,'nac-dinh-1722-dot-2');for(const[axis,offset]of[['x',9],['y',8]]){const s=[],P=(x,y,z)=>axis==='x'?[x,y,z]:[y,x,z],poly=(p,c)=>s.push({t:'poly',p:p.map(q=>P(...q)),c}),box=(x,y,z,w,d,h,c='#8f8c86',extra={})=>s.push(axis==='x'?{t:'box',x,y,z,w,d,h,c,...extra}:{t:'box',x:y,y:x,z,w:d,d:w,h,c,...extra});const gap=offset-2,mid=(offset+2)/2,z=x=>1.8+1.6*Math.sqrt(Math.max(0,1-((x-mid)/(gap/2))**2)),ang=40*Math.PI/180;
 // Cửa cong theo lòng vòm, bản lề tại hai jamb; hai lá mở đối xứng vào phía sau.
 for(const[hinge,sign]of[[2,1],[offset,-1]]){const q=(t,h)=>[hinge+sign*t*Math.cos(ang),1.58-t*Math.sin(ang),h],curve=[];for(let t=gap/2;t>=0;t-=gap/24)curve.push(q(t,z(hinge+sign*t)));poly([q(0,0),q(gap/2,0),...curve],'#60442f');for(const h of[.65,1.35])poly([q(0,h),q(gap/2,h),q(gap/2,h+.13),q(0,h+.13)],'#43444a')}
 const curve=[];for(let x=offset;x>=2;x-=.25)curve.push([x,1.65,z(x)]);poly([[2,.35,4.6],[offset,.35,4.6],...curve.map(([x,y,z])=>[x,.35,z])],'#6d6a66');poly([[2,.35,4.6],[offset,.35,4.6],[offset,1.65,4.6],[2,1.65,4.6]],'#a8a49c');for(let x=2;x<offset;x+=.25)poly([[x,.35,z(x)],[x+.25,.35,z(x+.25)],[x+.25,1.65,z(x+.25)],[x,1.65,z(x)]],'#6d6a66');poly([[2,1.65,4.6],[offset,1.65,4.6],...curve],'#8f8c86');
 // Huy hiệu nằm trong bề dày vòm, không hạ xuống khoảng trống đi qua.
 poly([[mid-.6,1.72,4.48],[mid+.6,1.72,4.48],[mid+.52,1.72,3.95],[mid,1.72,3.63],[mid-.52,1.72,3.95]],'#a68b54');
 for(const x of[0,offset]){box(x,0,0,2,2,4.5);box(x-.15,-.15,4.5,2.3,2.3,.2);for(const dx of[.15,1.6])for(const dy of[.15,1.6])box(x+dx,dy,4.7,.25,.25,1.2);for(const dx of[.6,1.15]){box(x+dx,-.1,4.7,.3,.25,.35);box(x+dx,1.85,4.7,.3,.25,.35)}box(x-.1,-.1,5.9,2.2,2.2,.12,'#8f8c86',{roof:{h:1,eave:.25,c:'#8a4a32'}})}
 fs.writeFileSync(path.join(dir,'gate-'+axis+'-guide.json'),JSON.stringify(s,null,2));}


