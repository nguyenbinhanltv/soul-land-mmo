// Nhóm bot "calendar" (Lịch Hoạt Động, mục 5.20, L2 #877): tin `calendar {op:"get", week?}` qua server thật.
import { sleep, waitFor, ok, bot, test, needHookSkip } from "./lib.mjs";
import { ASK_CD, EVENT_DEFS, KING_TIMES, MAPS, BOSSES, worldBossOn, weekdayVn } from "../../../shared/data.ts";

const DAY = 86400000, WEEK = 7 * DAY;
/**
 * Tuần trước / này / sau liền nhau, mỗi khung có thứ + tên boss khớp luật (thú vương = MapDef.king, boss thế giới = worldBossOn); `week` lạ bị
 * kẹp về -1 / 0 / 1 (hoặc 0); đẩy ngày bằng hook `day` (dayShift, như `today()`) sang tuần khác thì tên boss thế giới đổi đúng; xin dồn trong
 * ASK_CD bị gộp, còn tuần khác nhau thì không gộp lẫn.
 */
export async function calendarTest(){
  console.log("[#877] Lịch Hoạt Động: tin calendar qua server");
  const A=await bot("Lịch A","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3});
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua lịch hoạt động (cần hook day): bật server bằng GAME_TEST=1"); await A.room.leave(); return; }
  const nameOf=id=>BOSSES.find(b=>b.id===id)?.name;
  const get=async(w,msg={})=>{ await sleep(ASK_CD*1000+100); const n=A.cals.length; A.room.send("calendar",{op:"get",...(w===undefined?{}:{week:w}),...msg}); await waitFor(()=>A.cals.length>n,3000); return A.cals.length>n?A.cals.at(-1):null; };
  const slotDefs=EVENT_DEFS.filter(d=>d.kind==="slot"&&d.map), per=slotDefs.reduce((n,d)=>n+(d.world?1:KING_TIMES.length),0);
  const checkWeek=(c,label)=>{
    ok(!!c&&Array.isArray(c.items)&&Array.isArray(c.fixed)&&Number.isInteger(c.weekStart)&&c.now>0,`${label}: có now / weekStart / items / fixed`);
    if(!c) return;
    ok(c.items.length===7*per,`${label}: ${c.items.length} khung = 7 ngày × ${per}`);
    ok(c.weekStart<=c.now+7*DAY&&weekdayVn(c.weekStart)===0,`${label}: weekStart là 00:00 thứ Hai`);
    ok(c.items.every((x,i)=>x.s>=c.weekStart&&x.e>x.s&&x.s<c.weekStart+WEEK&&x.d===weekdayVn(x.s)&&(i===0||c.items[i-1].s<=x.s)),`${label}: khung nằm trong tuần, thứ đúng, tăng dần`);
    ok(c.items.every(x=>x.boss&&x.boss===nameOf(x.id.startsWith("world:")?worldBossOn(x.map,x.s):MAPS[x.map].king)),`${label}: tên boss khớp luật (worldBossOn / MapDef.king)`);
  };
  // 1. Tuần này / trước / sau: liền nhau đúng 7 ngày; `now` do server chốt.
  const cur=await get(0), prev=await get(-1), next=await get(1);
  checkWeek(cur,"tuần này"); checkWeek(prev,"tuần trước"); checkWeek(next,"tuần sau");
  ok(cur&&prev&&next&&cur.weekStart-prev.weekStart===WEEK&&next.weekStart-cur.weekStart===WEEK,"ba tuần liền nhau, cách đúng 7 ngày");
  ok(cur&&cur.now>=cur.weekStart&&cur.now<cur.weekStart+WEEK,"now thuộc tuần này");
  const noWeek=await get(undefined); ok(noWeek?.weekStart===cur?.weekStart,"không gửi week: lấy tuần này");
  // 2. `week` lạ bị kẹp (số lớn / âm sâu / số lẻ / chuỗi / null / đối tượng); `op` lạ bị bỏ.
  for(const [w,want] of [[5,next?.weekStart],[-9,prev?.weekStart],[1e9,next?.weekStart],[0.5,cur?.weekStart],["1",cur?.weekStart],[null,cur?.weekStart],[{a:1},cur?.weekStart],[NaN,cur?.weekStart]]){
    const c=await get(w); ok(c?.weekStart===want,`week=${JSON.stringify(w)} -> ${c&&c.weekStart===want?"kẹp đúng":"sai"} tuần`);
  }
  { await sleep(ASK_CD*1000+100); const n=A.cals.length; A.room.send("calendar",{op:"set"}); A.room.send("calendar",null); A.room.send("calendar",{}); await sleep(700);
    ok(A.cals.length===n&&A.leftCode===null,"op lạ / tin rỗng: không trả lịch, vẫn kết nối"); }
  // 3. Đẩy ngày (hook `day`, +7 ngày): tuần này dịch đúng một tuần, tên boss thế giới đổi đúng theo ngày mới (7 ngày lẻ so với chu kỳ luân phiên).
  const base=cur?.items.filter(x=>x.id.startsWith("world:"))??[];
  await test(A,"day",{shift:7}); const sh=await get(0); checkWeek(sh,"tuần này sau khi đẩy +7 ngày");
  ok(sh&&next&&sh.weekStart===next.weekStart,"đẩy +7 ngày: tuần này = tuần sau cũ");
  const shWorld=sh?.items.filter(x=>x.id.startsWith("world:"))??[];
  ok(base.length>0&&shWorld.length===base.length&&shWorld.every((x,i)=>x.d===base[i].d&&x.s-base[i].s===WEEK),"khung boss thế giới dịch đúng 7 ngày, cùng thứ");
  const wl=MAPS[base[0]?.map]?.world??[];
  ok(wl.length>1&&7%wl.length!==0&&shWorld.length>0&&shWorld.every((x,i)=>x.boss!==base[i].boss),`tên boss thế giới đổi khi đẩy +7 ngày (${wl.length} boss luân phiên, 7 không chia hết)`);
  ok(shWorld.every(x=>x.boss===nameOf(worldBossOn(x.map,x.s))),"mọi tên sau khi đẩy khớp worldBossOn của ngày mới");
  await test(A,"day",{shift:0}); const back=await get(0); ok(back?.weekStart===cur?.weekStart&&JSON.stringify(back.items)===JSON.stringify(cur?.items),"trả ngày về 0: lịch như ban đầu");
  // 4. Xin dồn trong ASK_CD: gộp (≤ 2 tin: một gửi ngay, một hẹn); tuần khác nhau không gộp lẫn nhau.
  await sleep(ASK_CD*1000+100); let n0=A.cals.length;
  for(let i=0;i<20;i++) A.room.send("calendar",{op:"get",week:0});
  const got=await waitFor(()=>A.cals.length>n0,2000); await waitFor(()=>A.cals.length>n0+2,ASK_CD*3000);
  ok(got&&A.cals.length-n0<=2,`gửi dồn 20 tin calendar: nhận ${A.cals.length-n0} tin (gộp theo nhịp ASK_CD ${ASK_CD} giây)`);
  await sleep(ASK_CD*1000+100); n0=A.cals.length;
  for(const w of [-1,0,1]) A.room.send("calendar",{op:"get",week:w});
  await waitFor(()=>A.cals.length>=n0+3,2000);
  ok(new Set(A.cals.slice(n0).map(c=>c.weekStart)).size===3,"ba tuần xin cùng lúc: đủ ba bản, không gộp lẫn");
  ok(A.leftCode===null,"suốt bài vẫn kết nối");
  await A.room.leave();
}
