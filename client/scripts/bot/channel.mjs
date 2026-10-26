// Nhóm bot "channel" (#703 bước 6, tách nguyên văn từ bot-test.mjs): Nhiều kênh và tài khoản test.
import { Client } from "colyseus.js";
import { WS, post, sleep, waitFor, RUN, ok, bot, enter, qtyOf, bagKey, AT, objOf, test } from "./lib.mjs";
import { CHANNEL_CD, TEAM_SIZE, VOHON, formatHonTe, TEAM_COMBAT_SECS, MAPS, MAX_RINGS, MAX_LEVEL, MAX_STARS, BONE_ITEM, BONE_SLOTS, bossIndex, ELITE, beastName, chestCode, CORE_ITEM, CORE_SLOTS, TONG_MON, EQUIP_SLOTS, EQUIP_MAX_ENHANCE } from "../../../shared/data.ts";

/**
 * Bot thứ 3 vào kênh 2; danh sách kênh; đổi kênh (từ chối khi đầy / chưa mở / đang ở / giao chiến / vừa đổi) giữ tiến độ chưa lưu và
 * vị trí; vào game và đi cổng ưu tiên kênh của đồng đội tổ đội, không thì kênh ít người nhất còn chỗ; thú vương mỗi kênh một con,
 * báo toàn server qua mọi kênh, đổi kênh rồi hạ thú vương kênh khác trong cùng khung giờ không nhận thêm rương.
 */
export async function channelTest(health){
  console.log(`\n== Nhiều kênh: server ${health.chMax} người / kênh ==`);
  const chOf=b=>b.room.state.channel, meC=b=>b.room.state.players?.get(b.room.sessionId);
  const T=async(b,op,extra={})=>{ b.test=null; b.room.send("test",{op,...extra}); await waitFor(()=>b.test,2000); await sleep(80); return b.test; };
  const say=async(b,type,msg)=>{ const l=b.logs.length; b.room.send(type,msg); await waitFor(()=>b.logs.length>l,2000); await sleep(50); return b.logs.slice(l).join(" | "); };
  const chans=async b=>{ await sleep(1050); b.chans=null; b.room.send("channels"); await waitFor(()=>b.chans,1500); return b.chans; };
  const fresh=async b=>{ b.owned=null; b.bag=null; b.room.send("vohons"); b.room.send("bag"); await waitFor(()=>b.owned&&b.bag&&meC(b),2000); };
  /** Đi theo tin `travel` như client: rời phòng cũ, vào đúng phòng server chọn (roomId null thì joinOrCreate). */
  const follow=async b=>{ const t=b.travel; if(!t) return; await b.room.leave(); await sleep(200); b.mapId=t.mapId; await enter(b,t.roomId??undefined); await fresh(b); };
  /** Xin đổi kênh `ch` rồi đi theo `travel`. Hồn thú hoang có thể đánh trúng giữa `rest` và lệnh (fight về 0): server từ chối "Đang giao chiến"
   * đúng luật nên dọn quanh bot, nghỉ, gửi lại (tối đa 4 lần). Server chỉ gửi `travel` sau khi lưu xong nên chờ tới 10 giây; hết giờ thì ✗ kèm log. */
  const gotoChannel=async(b,ch,what)=>{
    let got=false;
    for(let i=0;i<4&&!got;i++){
      await T(b,"clear",{keep:1}); await T(b,"rest",{s:TEAM_COMBAT_SECS+1}); await T(b,"chan",{reset:1});
      b.travel=null; const l=await say(b,"channel",{ch});
      got=await waitFor(()=>b.travel,/giao chiến/.test(l)?300:10000);
    }
    ok(got,`${what}: nhận travel (log: ${b.logs.slice(-3).join(" | ")})`); if(got) await follow(b); return got; };
  const prog=b=>JSON.stringify(b.owned.list.map(v=>[v.rowId,v.level,v.xp,v.stars,v.rings]));
  const pact=async(b,op,extra,w)=>{ const n=w.partyMsgs; b.room.send("party",{op,...extra}); await waitFor(()=>w.partyMsgs>n,2000); await sleep(120); };

  // ---- Phòng đầy thì mở kênh mới; số kênh đồng bộ cho client ----
  const P1=await bot("Kenh P1","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:1,outfitCol:1}), P2=await bot("Kenh P2","nhu_cot_tho",{sex:1,hair:1,hairCol:2,outfitCol:2});
  await waitFor(()=>chOf(P1)&&chOf(P2));
  ok(P1.room.roomId===P2.room.roomId&&chOf(P1)===1&&chOf(P2)===1,`P1, P2 cùng kênh ${chOf(P1)} của ${P1.room.state.mapId}`);
  const P3=await bot("Kenh P3","u_minh_linh_mieu",{sex:0,hair:2,hairCol:3,outfitCol:3}); await waitFor(()=>chOf(P3));
  ok(P3.room.roomId!==P1.room.roomId&&chOf(P3)===2&&P3.room.state.mapId===P1.room.state.mapId,`bot thứ 3 vào kênh ${chOf(P3)} (kênh 1 đã đủ 2 người)`);
  ok((await T(P3,"chan")).chMax===2,"hook chan: 2 người / kênh");
  let cl=await chans(P3);
  ok(cl?.cur===2&&JSON.stringify(cl.list)===JSON.stringify([{ch:1,n:2,max:2,full:true},{ch:2,n:1,max:2,full:false}]),`danh sách kênh: ${JSON.stringify(cl)}`);
  // Xin dồn trong 1 giây (mở, đóng, mở lại bảng): không bị bỏ, server gửi lại khi hết giây đó.
  await sleep(1050); let nCh=0; P3.room.onMessage("channels",m=>{P3.chans=m; nCh++;}); P3.room.send("channels"); await sleep(100); P3.room.send("channels");
  ok(await waitFor(()=>nCh>=2,2500),`xin danh sách 2 lần trong 1 giây: nhận đủ ${nCh} lần (lần sau được hẹn gửi lại)`);
  ok(/đã đầy/.test(await say(P3,"channel",{ch:1})),"đổi sang kênh 1 (đã đầy) bị từ chối");
  ok(/không còn mở/.test(await say(P3,"channel",{ch:3})),"kênh 3 (chưa mở) bị từ chối");
  ok(/Đang ở kênh 2/.test(await say(P3,"channel",{ch:2})),"chọn kênh đang ở bị từ chối");
  ok(/không hợp lệ/.test(await say(P3,"channel",{ch:"x"})),"số kênh sai kiểu bị từ chối");

  // ---- Đổi kênh giữ tiến độ chưa lưu (kinh nghiệm, túi đồ) và vị trí: lưu như đi cổng ----
  await fresh(P2); await T(P2,"kill",{tier:1}); await T(P2,"give",{code:"hoi_huyet_dan",qty:3}); await fresh(P2);
  await T(P2,"lei",{v:0}); // vừa giao chiến
  ok(/giao chiến/.test(await say(P2,"channel",{ch:2})),"đang giao chiến thì không đổi kênh được");
  await T(P2,"rest",{s:TEAM_COMBAT_SECS+1}); await fresh(P2);
  const before={prog:prog(P2),bag:bagKey(P2),x:meC(P2).x,y:meC(P2).y};
  P2.travel=null; const l2=await say(P2,"channel",{ch:2});
  ok(/Đang chuyển sang kênh 2/.test(l2)&&await waitFor(()=>P2.travel,3000)&&P2.travel.mapId===P2.mapId&&P2.travel.roomId===P3.room.roomId,
    `đổi sang kênh 2: "${l2}", travel ${JSON.stringify(P2.travel)}`);
  { // #164: client không tự chọn kênh đích: rời phòng rồi joinById kênh khác kênh server chọn bị từ chối (CHANNEL_CD giây)
    const t=P2.travel; await P2.room.leave(); await sleep(200);
    let other=""; try{ const r=await new Client(WS).joinById(P1.room.roomId,{token:P2.token,mapId:P2.mapId}); await r.leave(); other="vào được"; }catch(e){ other=String(e?.message??e); }
    ok(/kênh 2/.test(other)&&other!=="vào được",`đổi sang kênh 2 nhưng tự joinById kênh 1: bị từ chối ("${other}")`);
    await enter(P2,t.roomId); await fresh(P2);
  }
  ok(P2.room.roomId===P3.room.roomId&&chOf(P2)===2,`P2 vào kênh ${chOf(P2)} cùng P3`);
  ok(prog(P2)===before.prog&&bagKey(P2)===before.bag,`đổi kênh giữ tiến độ: võ hồn ${before.prog}, túi đồ giữ nguyên`);
  ok(Math.hypot(meC(P2).x-before.x,meC(P2).y-before.y)<1,`giữ vị trí (${before.x.toFixed(0)},${before.y.toFixed(0)}) -> (${meC(P2).x.toFixed(0)},${meC(P2).y.toFixed(0)})`);
  ok(/Vừa đổi kênh/.test(await say(P2,"channel",{ch:1})),`đổi lại ngay: phải chờ ${CHANNEL_CD} giây`);
  cl=await chans(P1); ok(JSON.stringify(cl?.list.map(c=>[c.ch,c.n]))==="[[1,1],[2,2]]",`sau khi đổi: kênh 1 có 1 người, kênh 2 có 2 người (${JSON.stringify(cl?.list)})`);
  // Thoát vào lại: tiến độ đã nằm trong DB (transaction đổi kênh), không phải chỉ trong bộ nhớ phòng.
  // Tự rời rồi joinById kênh khác không né được luật đổi kênh: CHANNEL_CD giây chỉ vào lại được kênh vừa rời; /api/channel đưa về đó.
  await P2.room.leave(); await sleep(400);
  let pick=await post("/api/channel",{token:P2.token});
  ok(pick.mapId===P2.mapId&&pick.roomId===P3.room.roomId,"vừa tự rời kênh 2: /api/channel đưa về đúng kênh 2");
  let dodge=""; try{ const r=await new Client(WS).joinById(P1.room.roomId,{token:P2.token,mapId:P2.mapId}); await r.leave(); dodge="vào được"; }catch(e){ dodge=String(e?.message??e); }
  ok(/Vừa rời kênh 2/.test(dodge),`tự rời rồi joinById kênh 1 ngay: bị từ chối ("${dodge}")`);
  await enter(P2,pick.roomId); await fresh(P2);
  ok(chOf(P2)===2&&prog(P2)===before.prog&&bagKey(P2)===before.bag,"thoát vào lại kênh 2: tiến độ trước khi đổi kênh vẫn còn (đã lưu)");
  await T(P2,"chan",{nolock:1}); await P2.room.leave(); await sleep(400); // hook: lần rời này không khóa kênh
  pick=await post("/api/channel",{token:P2.token});
  ok(pick.roomId===P1.room.roomId,"không tổ đội, không vừa rời kênh nào: vào game ở kênh ít người nhất còn chỗ (bằng nhau thì kênh số nhỏ hơn): kênh 1");
  await enter(P2,pick.roomId); await fresh(P2); ok(chOf(P2)===1,"P2 vào kênh 1");

  // ---- Tổ đội: vào game / đi cổng ưu tiên kênh của đồng đội ----
  await T(P3,"party",{pop:"rlreset"});
  await pact(P3,"invite",{name:P2.name},P2); await pact(P2,"accept",{name:P3.name},P3); await waitFor(()=>P3.party?.members?.length===2,2000);
  const m2=P3.party?.members.find(m=>m.name===P2.name);
  ok(m2&&!m2.sid&&m2.map===P2.mapId&&m2.ch===1,`khung tổ đội của P3 (kênh 2) ghi P2 ở ${m2?.map} · Kênh ${m2?.ch}`);
  { // #188: chat tổ đội / tin riêng xuyên kênh cùng bản đồ (qua presence); chat bản đồ chỉ trong kênh của người gửi
    for(const b of [P1,P2]) await T(b,"chat",{cop:"rlreset"});
    P1.chats=[]; P3.chats=[]; const tp=`đội kênh ${RUN}`, tw=`riêng kênh ${RUN}`, tm=`bđ kênh ${RUN}`;
    P2.room.send("chat",{text:tp,ch:"party"}); P1.room.send("chat",{text:tw,ch:"whisper",to:P3.name}); P2.room.send("chat",{text:tm});
    ok(await waitFor(()=>P3.chats.some(m=>m.ch==="party"&&m.text===tp&&m.name===P2.name)&&P3.chats.some(m=>m.ch==="whisper"&&m.text===tw&&m.name===P1.name),2000),
      "P3 (kênh 2) nhận chat tổ đội của P2 và tin riêng của P1 (kênh 1)");
    ok(await waitFor(()=>P1.chats.some(m=>m.text===tm),2000)&&(await sleep(300),!P3.chats.some(m=>m.text===tm)),"chat bản đồ của P2 tới P1 (kênh 1), không sang kênh 2");
    // #198: chat tông xuyên kênh (P1, P3 không cùng tổ đội, chỉ cùng tông; hook tong {set} đặt thẳng tông rồi trả lại).
    for(const b of [P1,P3]) await T(b,"tong",{set:TONG_MON[0].id});
    const tt=`tông kênh ${RUN}`; P1.room.send("chat",{text:tt,ch:"tong"});
    ok(await waitFor(()=>P3.chats.some(m=>m.ch==="tong"&&m.text===tt&&m.name===P1.name),2000),`P3 (kênh 2) nhận chat tông ${TONG_MON[0].name} của P1 (kênh 1)`);
    for(const b of [P1,P3]) await T(b,"tong",{set:null});
  }
  await T(P2,"chan",{nolock:1}); await P2.room.leave(); await sleep(400);
  pick=await post("/api/channel",{token:P2.token});
  ok(pick.roomId===P3.room.roomId,"có tổ đội: vào game ở kênh của đồng đội (kênh 2) dù kênh 1 cũng còn chỗ");
  await enter(P2,pick.roomId); await fresh(P2); ok(P2.room.roomId===P3.room.roomId&&chOf(P2)===2,"P2 vào kênh 2 cùng đồng đội P3");
  // Đi cổng (hook warp, cùng transaction đi cổng): P3 mở kênh ở Ngoại vi, đồng đội P2 được xếp vào đó, P1 (không tổ đội) sang kênh 2.
  const NV="tinh_dau_ngoai_vi";
  P3.travel=null; await T(P3,"warp",{mapId:NV,x:0,y:0}); await waitFor(()=>P3.travel,3000);
  ok(P3.travel?.mapId===NV&&P3.travel.roomId===null,`P3 đi cổng tới ${NV}: chưa có kênh nào (roomId null, client mở kênh mới)`);
  await follow(P3);
  P2.travel=null; await T(P2,"warp",{mapId:NV,x:0,y:0}); await waitFor(()=>P2.travel,3000);
  ok(P2.travel?.roomId===P3.room.roomId,"đồng đội P2 đi cổng: server chọn đúng kênh của P3");
  await follow(P2);
  P1.travel=null; await T(P1,"warp",{mapId:NV,x:0,y:0}); await waitFor(()=>P1.travel,10000); await follow(P1);
  ok(chOf(P3)===1&&chOf(P2)===1&&chOf(P1)===2,`Ngoại vi: P3, P2 kênh ${chOf(P3)}; P1 kênh ${chOf(P1)} (kênh 1 đầy)`);
  { // #819: khóa kênh đích sau đổi kênh nằm ở presence dùng chung (chạy --procs 2: phòng đích khác tiến trình vẫn thấy khóa, không chặn nhầm)
    await T(P2,"chan",{reset:1}); P2.travel=null; await say(P2,"channel",{ch:2}); await waitFor(()=>P2.travel,3000);
    const t=P2.travel; await P2.room.leave(); await sleep(200);
    let other=""; try{ const r=await new Client(WS).joinById(P3.room.roomId,{token:P2.token,mapId:NV}); await r.leave(); other="vào được"; }catch(e){ other=String(e?.message??e); }
    ok(/kênh 2/.test(other)&&other!=="vào được",`#819 Ngoại vi: đổi sang kênh 2 nhưng joinById kênh 1: bị từ chối ("${other}")`);
    await enter(P2,t.roomId); await fresh(P2);
    ok(chOf(P2)===2,"#819: vào đúng kênh server chọn: khóa không chặn nhầm");
    await gotoChannel(P2,1,"P2 đổi sang kênh 1");
    ok(chOf(P2)===1&&chOf(P1)===2,"#819: P2 về kênh 1 như cũ (khóa cũ đã gỡ, không chặn lần vào hợp lệ kế tiếp)");
  }

  // ---- Thú vương: mỗi kênh một con (suất theo bản đồ), báo toàn server mọi kênh, mỗi khung giờ một rương dù đổi kênh ----
  const king=b=>[...b.room.state.beasts.values()].find(x=>x.rank===2), chestN=b=>qtyOf(b,chestCode("huyet_nguyet_lang_vuong"));
  await T(P1,"king",{kop:"spawn"});
  ok(await waitFor(()=>king(P1)&&king(P3),2000),"thú vương xuất hiện ở cả hai kênh của Ngoại vi (mỗi kênh một con)");
  /** Đứng cạnh thú vương trong hang rồi hạ ngay (hook kdmg). */
  async function slayKing(b){ const ki=await T(b,"king"), L=ki.lair; const inL=(x,y)=>x>=L.x&&x<=L.x+L.w&&y>=L.y&&y<=L.y+L.h;
    for(const [dx,dy] of [[30,0],[-30,0],[0,30],[0,-30],[40,40],[-40,-40]]){ const x=Math.round(ki.x+dx), y=Math.round(ki.y+dy); if(!inL(x,y)) continue;
      await T(b,"goto",{x,y}); if(Math.hypot(meC(b).x-x,meC(b).y-y)<1) break; }
    await T(b,"kdmg",{v:1e8}); }
  P3.chats=[]; P1.logs=[]; await slayKing(P1);
  ok(await waitFor(()=>!king(P1)&&chestN(P1)===1,3000),`P1 hạ thú vương kênh 2: nhận rương (${P1.logs.find(t=>/lượt/.test(t))??P1.logs.slice(-2).join(" | ")})`);
  ok(await waitFor(()=>P3.chats.some(m=>/đã bị hạ/.test(m.text)),1500)&&king(P3),`kênh 1 nhận thông báo toàn server ("${P3.chats.find(m=>/bị hạ/.test(m.text))?.text}"), thú vương kênh 1 vẫn còn`);
  await P2.room.leave(); await sleep(300); // kênh 1 còn chỗ
  await gotoChannel(P1,1,"P1 đổi sang kênh 1");
  ok(chOf(P1)===1&&king(P1),"P1 đổi sang kênh 1 (vẫn trong khung giờ đó, thú vương kênh 1 còn sống)");
  P1.logs=[]; await slayKing(P1); await waitFor(()=>!king(P1),3000); await sleep(400);
  ok(!king(P1)&&chestN(P1)===1&&/đã nhận rương của khung giờ này ở kênh khác/.test(P1.logs.join("\n")),
    `hạ thú vương kênh 1 trong cùng khung giờ: không nhận thêm rương ("${P1.logs.find(t=>/kênh khác/.test(t))??P1.logs.slice(-3).join(" | ")}")`);

  // ---- #119: tinh anh mỗi kênh hồi sinh riêng, nhưng thưởng tinh anh khóa theo tài khoản ELITE.lock giây ở mọi kênh; đổi kênh rồi
  // quay về thì đóng góp lên tinh anh còn giao chiến vẫn còn (gắn theo tài khoản) ----
  {
    const EB=(await T(P1,"elite")).list[0]?.boss, ek=`${NV}|${EB}`, newDrops=(b,bf)=>[...b.room.state.drops.entries()].filter(([k])=>!bf.has(k)).map(([,x])=>x);
    const one=async(b,bid)=>(await T(b,"elite",{bid})).one;
    /** `b` hạ ngay tinh anh `bid` (hook slay, như ra đòn cuối); trả đồ rơi mới và các dòng log. */
    const slayE=async(b,bid)=>{ const bf=new Set(b.room.state.drops.keys()), l=b.logs.length; await T(b,"slay",{bid}); await sleep(250); return {nd:newDrops(b,bf),log:b.logs.slice(l).join(" | ")}; };
    /**
     * Đổi kênh như người chơi (rời giao chiến, bỏ chờ CHANNEL_CD bằng hook); hồn thú hoang có thể vừa đánh: thử lại tối đa 3 lần.
     * Tinh anh còn giao chiến đứng gần và bầy sói Hú Bầy của nó đánh liên tục thì `rest` vừa xong đã lại giao chiến (cả 3 lần trượt,
     * chập chờn trên CI): trước mỗi lần xóa hồn thú thường quanh `b` (giữ tinh anh) và cho hồn thú quanh `b` Choáng vài giây.
     */
    const swap=async(b,ch)=>{ for(let k=0;k<3;k++){ await T(b,"clear",{keep:1}); await T(b,"status",{s:"stun",secs:5,all:1});
      await T(b,"rest",{s:TEAM_COMBAT_SECS+1}); await T(b,"chan",{reset:1});
      b.travel=null; const w=await say(b,"channel",{ch}); if(await waitFor(()=>b.travel,3000)) return follow(b);
      console.log(`    ${b.name} chưa đổi được sang kênh ${ch} (đang ở kênh ${chOf(b)}): "${w}"`); } };
    ok(!!EB,`tinh anh của ${MAPS[NV].name}: ${EB}`);
    // Kênh 1: P1 hạ tinh anh (hook sinh 1 máu, cùng mã): chắc chắn rơi hồn hạch (số ngẫu nhiên 0,5), bị khóa ELITE.lock giây.
    await T(P1,"elock",{s:0}); await T(P1,"core",{r:50});
    let r=await slayE(P1,(await T(P1,"beast",{boss:EB,dx:14,dy:0})).bid), lc=(await T(P1,"elock")).locks;
    ok(chOf(P1)===1&&r.nd.some(x=>x.item===CORE_ITEM&&x.owner===P1.room.sessionId)&&lc[ek]>ELITE.lock-60,`kênh 1: P1 hạ ${beastName(1,bossIndex(EB))}: hồn hạch chắc chắn, khóa ${lc[ek]?.toFixed(0)} giây`);
    // Tinh anh còn giao chiến ở kênh 1: P3 đứng cạnh (giữ giao chiến), P1 ở xa gây 7, P3 gây 5 sát thương.
    const E1=(await T(P3,"beast",{boss:EB,dx:14,dy:0})).bid; await T(P3,"bhp",{pct:100,bid:E1});
    await T(P3,"kdmg",{v:5,bid:E1}); await T(P1,"kdmg",{v:7,bid:E1});
    let o=await one(P3,E1); const s1=P1.room.sessionId;
    ok(o?.engaged&&o.dmgBy[s1]===7&&o.dmgBy[P3.room.sessionId]===5,`kênh 1: P1, P3 cùng đánh tinh anh (đóng góp ${JSON.stringify(o?.dmgBy)})`);
    // P1 sang kênh 2 (P2 vào game mở kênh 2): hạ tinh anh cùng mã ở kênh 2 trong lúc còn khóa thì chỉ như hồn thú thường.
    { const pick=await post("/api/channel",{token:P2.token}); await enter(P2,pick.roomId??undefined); await fresh(P2); }
    await swap(P1,2);
    ok(chOf(P2)===2&&chOf(P1)===2,`P2 vào kênh ${chOf(P2)}, P1 đổi sang kênh ${chOf(P1)}`);
    await T(P1,"core",{r:50}); r=await slayE(P1,(await T(P1,"beast",{boss:EB,dx:14,dy:0})).bid);
    ok(r.nd.length&&!r.nd.some(x=>x.item===CORE_ITEM)&&/chưa lâu \(kênh nào cũng tính\)/.test(r.log),`kênh 2 trong lúc còn khóa: không hồn hạch chắc chắn ("${r.log}")`);
    // P1 quay về kênh 1: đóng góp 7 chuyển sang phiên mới; hạ tinh anh khi còn khóa thì quyền ưu tiên sang P3 (chưa khóa) dù P1 đóng góp nhiều hơn.
    await swap(P1,1);
    o=await one(P3,E1); const s2=P1.room.sessionId;
    ok(chOf(P1)===1&&s2!==s1&&o?.engaged&&o.dmgBy[s2]===7&&!(s1 in o.dmgBy),`đổi kênh rồi quay về kênh 1: đóng góp của P1 vẫn ${o?.dmgBy[s2]} (phiên mới), phiên cũ không còn`);
    await T(P3,"elock",{s:0}); await T(P1,"core",{r:50}); r=await slayE(P1,E1); const sid3=P3.room.sessionId;
    // Chỉ xét đồ rơi tinh anh (hồn hoàn, hồn cốt, hồn hạch): mảnh / tiên thảo của người hạ rơi xuống đất khi túi P1 đầy thì vẫn thuộc P1.
    const eliteDr=r.nd.filter(x=>x.item===""||x.item===BONE_ITEM||x.item===CORE_ITEM);
    ok(eliteDr.some(x=>x.item===CORE_ITEM&&x.owner===sid3)&&eliteDr.every(x=>x.owner===sid3)&&/chưa bị khóa thưởng tinh anh/.test(r.log)&&(await T(P3,"elock")).locks[ek]>0,
      `P1 (còn khóa, đóng góp 7) hạ tinh anh: đồ rơi tinh anh ưu tiên P3 (đóng góp 5, chưa khóa), P3 bị khóa`);
    for(const b of [P1,P3]){ await T(b,"core",{r:100}); await T(b,"elock",{s:0}); }
    await P2.room.leave(); await sleep(300);
  }

  // ---- BĐ6a: Thiên Đấu Thành chia kênh như mọi bản đồ (P3 mở kênh 1, P1 vào cùng, P2 vào kênh 2 khi kênh 1 đầy) ----
  const TD=AT;
  for(const b of [P1,P3]) await T(b,"rest",{s:TEAM_COMBAT_SECS+1});
  const tdS=objOf(TD,"arrive","tu_nac_dinh_thanh");
  P3.travel=null; await T(P3,"warp",{mapId:TD,x:tdS.x,y:tdS.y}); await waitFor(()=>P3.travel,3000);
  ok(P3.travel?.mapId===TD&&P3.travel.roomId===null,`P3 tới ${MAPS[TD].name}: chưa có kênh nào (roomId null)`);
  await follow(P3);
  P1.travel=null; await T(P1,"warp",{mapId:TD,x:tdS.x+16,y:tdS.y}); await waitFor(()=>P1.travel,10000);
  ok(P1.travel?.roomId===P3.room.roomId,"P1 tới Thiên Đấu Thành: vào kênh 1 còn chỗ của P3"); await follow(P1);
  { const pick=await post("/api/channel",{token:P2.token}); await enter(P2,pick.roomId??undefined); await fresh(P2); }
  P2.travel=null; await T(P2,"warp",{mapId:TD,x:tdS.x-16,y:tdS.y}); await waitFor(()=>P2.travel,10000); await follow(P2);
  ok(P2.room.state.mapId===TD&&chOf(P3)===1&&chOf(P1)===1&&chOf(P2)===2&&P2.room.roomId!==P3.room.roomId,
    `Thiên Đấu Thành: P3, P1 kênh ${chOf(P3)}; P2 kênh ${chOf(P2)} (kênh 1 đầy, đồng đội P3 không còn chỗ)`);
  cl=await chans(P2); ok(JSON.stringify(cl?.list.map(c=>[c.ch,c.n]))==="[[1,2],[2,1]]",`danh sách kênh Thiên Đấu Thành: ${JSON.stringify(cl?.list)}`);
  for(const b of [P1,P2,P3]) await b.room.leave();
}

/**
 * Tài khoản TEST dựng sẵn (#517, BOT_ONLY=testacc): đăng nhập tài khoản đã dựng bằng `npm run seed:test` (bot:local --pg --seed-test max --only testacc dựng
 * sẵn trước khi bật server; biến BOT_TEST_NAME / BOT_TEST_PASS / BOT_TEST_PRESET). Kiểm vào game, mở túi, đổi võ hồn, đánh hồn thú, ẩn khỏi xếp hạng, vào lại.
 */
export async function testAccTest(){
  const name=process.env.BOT_TEST_NAME, pass=process.env.BOT_TEST_PASS, preset=process.env.BOT_TEST_PRESET??"max";
  console.log(`[#517] Tài khoản test dựng sẵn (mức ${preset})`);
  if(!name||!pass){ console.log("  ⚠ bỏ qua: cần tài khoản dựng sẵn (npm run bot:local -- --pg --seed-test max --only testacc)"); return; }
  const l=await post("/api/login",{name,password:pass});
  ok(l.token&&l.character&&l.looks?.chosen,`đăng nhập tài khoản test: đã thức tỉnh, đã tạo nhân vật (cấp ${l.character?.level})`);
  if(!l.token) return;
  const me0=await post("/api/me",{token:l.token});
  const b={name,token:l.token,logs:[],owned:null,ownedMsgs:0,looks:me0.looks,isNew:false,mapId:me0.mapId,near:false};
  await enter(b);
  const p=()=>b.room.state.players?.get(b.room.sessionId);
  ok(await waitFor(()=>p()&&b.owned&&b.bag&&b.gear,4000),"vào phòng: nhận danh sách võ hồn, túi đồ, trang bị");
  const max=preset==="max";
  if(max){
    ok(b.owned.list.length===VOHON.length&&b.owned.list.every(v=>v.level===MAX_LEVEL&&v.stars===MAX_STARS&&v.rings.length===MAX_RINGS),`mọi ${VOHON.length} võ hồn cấp ${MAX_LEVEL}, ${MAX_STARS} sao, ${MAX_RINGS} hồn hoàn`);
    ok(b.owned.list.every(v=>v.skills?.length===4&&v.skills.every(r=>r>=0)),"mỗi võ hồn mang đủ 4 hồn kỹ");
    ok(b.owned.team.filter(Boolean).length===TEAM_SIZE&&p().level===MAX_LEVEL,`đội ${TEAM_SIZE} võ hồn, hồn sư cấp ${p().level}`);
    const worn=(b.bag.items??[]).filter(i=>i.vohon!==null);
    ok(worn.filter(i=>i.code===BONE_ITEM).length===VOHON.length*BONE_SLOTS.length&&worn.filter(i=>i.code===CORE_ITEM).length===VOHON.length*CORE_SLOTS,"túi: hồn cốt 6 / hồn hạch 6 gắn cho từng võ hồn");
    ok(b.gear.items?.length===EQUIP_SLOTS.length&&b.gear.items.every(i=>i.enhance===EQUIP_MAX_ENHANCE&&i.slot>=0),`${EQUIP_SLOTS.length} trang bị đang mặc, cùng +${EQUIP_MAX_ENHANCE}`);
    ok(b.bag.honTe>=1e6,`Hồn Tệ ${formatHonTe(b.bag.honTe)}`);
  }
  // Mở túi lại, đổi võ hồn trong đội.
  b.bag=null; b.room.send("bag"); ok(await waitFor(()=>b.bag,2000),"mở túi đồ (xin lại tin bag)");
  const slot=b.owned.team.findIndex((r,i)=>r&&r!==b.owned.active&&i>0);
  if(slot>=0){ const want=b.owned.team[slot]; b.room.send("switch",{slot}); ok(await waitFor(()=>b.owned?.active===want,3000),`đổi võ hồn sang ô ${slot+1}`); }
  // Đánh hồn thú ở bản đồ săn (hook warp, beast, slay).
  if(!(await test(b,"ping"))?.enabled){ console.log("  ⚠ bỏ qua đánh hồn thú (cần hook warp, beast, slay): bật server bằng GAME_TEST=1"); }
  else{
    b.travel=null; b.room.send("test",{op:"warp",mapId:"tinh_dau_ngoai_vi",x:0,y:0});
    ok(await waitFor(()=>b.travel?.mapId==="tinh_dau_ngoai_vi",4000),"warp -> Tinh Đấu Ngoại vi");
    await b.room.leave(); await sleep(300); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>p()&&b.bag,3000);
    const t=await test(b,"beast"), before=b.bag.honTe;
    await test(b,"slay",{bid:t?.bid});
    ok(await waitFor(()=>b.bag.honTe>before,3000),`hạ hồn thú: Hồn Tệ ${formatHonTe(before)} -> ${formatHonTe(b.bag.honTe)}`);
  }
  // Ẩn khỏi bảng xếp hạng đấu trường và cộng minh.
  b.top=null; b.room.send("arena",{op:"top"}); ok(await waitFor(()=>b.top,2000),"xin bảng xếp hạng đấu trường");
  ok(!b.top?.list?.some(r=>r.name===name)&&!b.top?.list?.some(r=>r.me),"tài khoản test không có trong bảng xếp hạng đấu trường, không có hạng");
  b.resTop=null; b.room.send("resonance",{op:"top",page:1,pageSize:50}); ok(await waitFor(()=>b.resTop,2000),"xin bảng xếp hạng cộng minh");
  ok(!b.resTop?.list?.some(r=>r.name===name),"tài khoản test không có trong bảng xếp hạng cộng minh");
  // Thoát rồi vào lại: dữ liệu giữ nguyên.
  const lv=b.owned.list.length, items=b.bag.items.length;
  await b.room.leave(); await sleep(500); await enter(b); await waitFor(()=>p()&&b.bag&&b.owned,4000);
  ok(b.owned.list.length===lv&&b.bag.items.length>=items,"thoát vào lại: đủ võ hồn và đồ như trước");
  await b.room.leave();
}
