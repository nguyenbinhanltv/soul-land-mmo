// Nhóm bot "issue121" (#703 bước 6, tách nguyên văn từ bot-test.mjs): Kiểm thử bổ sung #121 và biên đấu trường.
import { post, sleep, waitFor, ok, bot, enter, bagKey, AT, npcSpot, trade, test, needHookSkip } from "./lib.mjs";
import { TEAM_COMBAT_SECS, RING_ITEM, ARENA } from "../../../shared/data.ts";

/**
 * #121: các tình huống bổ sung cho hồn hoàn và Đại Đấu Hồn Trường. Chạy riêng bằng BOT_ONLY=issue121 để có server mới, state sạch.
 */
export async function issue121Test(){
  console.log("[121] hồn hoàn đang hấp thụ, hòa / hết lượt thưởng và ngắt kết nối sau khi ghép");
  await absorbSellTest();
  await arenaEdgeTest();
}

export async function absorbSellTest(){
  const C=await bot("B121Sell","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:1,outfitCol:1});
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan");
  try{
    if(!(await test(C,"ping"))?.enabled){ needHookSkip("bỏ qua bán hồn hoàn đang hấp thụ (cần GAME_TEST=1)"); return; }
    C.travel=null; await test(C,"warp",{mapId:"nac_dinh_thanh",x:tn.x,y:tn.y+16});
    ok(await waitFor(()=>C.travel?.mapId==="nac_dinh_thanh",4000),"#121: đi tới Nặc Đinh Thành để thử bán");
    const travel=C.travel; await C.room.leave(); await sleep(300); C.mapId=travel.mapId; await enter(C,travel.roomId??undefined);
    await waitFor(()=>C.room.state.players?.get(C.room.sessionId)&&C.owned&&C.bag,3000);
    await test(C,"goto",{x:tn.x,y:tn.y+16}); await test(C,"rest",{s:TEAM_COMBAT_SECS+1});
    const rowId=C.owned.active;
    await test(C,"set",{rowId,level:10,xp:0,rings:[]});
    for(const it of C.bag.items.filter(i=>i.code===RING_ITEM)) C.room.send("discard",{id:it.id});
    await waitFor(()=>!C.bag.items.some(i=>i.code===RING_ITEM),2000);
    await test(C,"give",{code:RING_ITEM,qty:1,years:10});
    const ring=C.bag.items.find(i=>i.code===RING_ITEM&&i.years===10);
    C.absorbing=null; C.room.send("absorb",{itemId:ring?.id,vohonId:rowId});
    ok(await waitFor(()=>C.absorbing?.on,1500),"#121: bắt đầu hấp thụ hồn hoàn 10 năm");
    const before=bagKey(C), log=await trade(C,"sell",{id:ring?.id});
    ok(/Đang hấp thụ hồn hoàn này, không bán được/.test(log)&&bagKey(C)===before&&C.bag.items.some(i=>i.id===ring?.id),
      "#121: đang hấp thụ thì không bán được hồn hoàn ("+log+")");
    await test(C,"rush"); await waitFor(()=>C.absorbing&&!C.absorbing.on,1500);
  } finally { await C.room?.leave().catch(()=>{}); }
}

export async function arenaEdgeTest(){
  const warpTown=async b=>{
    const ns=npcSpot(AT,"dau_hon_truong"); b.travel=null;
    await test(b,"warp",{mapId:AT,x:ns.x,y:ns.y+16}); await waitFor(()=>b.travel?.mapId===AT,4000);
    const t=b.travel; await b.room.leave(); await sleep(300); b.mapId=t.mapId; await enter(b,t.roomId??undefined);
    await waitFor(()=>b.room.state.players?.get(b.room.sessionId)&&b.owned&&b.bag,3000);
  };
  const back=async b=>{ b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>b.room.state.players?.get(b.room.sessionId)&&b.owned&&b.bag,3000); };
  const ns=npcSpot(AT,"dau_hon_truong");
  const queue=async b=>{ const l=b.logs.length, n=b.aqN; b.room.send("arena",{op:"queue"}); await waitFor(()=>b.aqN>n&&b.logs.length>l,2000); };
  const found=b=>b.arena.filter(m=>m.k==="found").at(-1), ended=b=>b.arena.filter(m=>m.k==="end").at(-1);
  const enterArena=async b=>{ const id=found(b)?.roomId; await b.room.leave(); await enter(b,id); await waitFor(()=>b.room.state.players?.get(b.room.sessionId)&&b.owned&&b.bag,3000); };
  const leaveArena=async b=>{ const r=b.room; if(r) await Promise.race([r.leave().catch(()=>{}),sleep(1000)]); await sleep(300); await back(b); };
  const close=async b=>{ const r=b.room; if(!r) return; await Promise.race([r.leave().catch(()=>{}),sleep(300)]); };
  const at=async b=>test(b,"goto",{x:ns.x,y:ns.y+16});

  const D=await bot("B121DrawA","bich_lan_xa_hoang",{sex:1,hair:0,hairCol:2,outfitCol:2});
  const E=await bot("B121DrawB","u_minh_linh_mieu",{sex:0,hair:2,hairCol:3,outfitCol:3});
  const W=await bot("B121Win","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:4,outfitCol:4});
  const opponents=[];
  try{
    if(!(await test(D,"ping"))?.enabled){ needHookSkip("bỏ qua đấu trường bổ sung (cần GAME_TEST=1)"); return; }
    for(const b of [D,E,W]) await warpTown(b);

    // Hai bên đầy sinh lực, không ai tác động trong trận: hết giờ phải là hòa, không thưởng, Elo / thành tích ghi hòa.
    await at(D); await at(E); await queue(D); await queue(E);
    ok(await waitFor(()=>found(D)&&found(E)&&found(D).roomId===found(E).roomId,3000),"#121: ghép cặp để thử trận hòa");
    await enterArena(D); await enterArena(E); await waitFor(()=>D.room.state.phase==="ready",3000);
    await test(D,"afast",{s:0}); await waitFor(()=>D.room.state.phase==="fight",1500); await test(D,"afast",{s:0});
    ok(await waitFor(()=>ended(D)&&ended(E),3000),"#121: trận hòa kết thúc");
    const drawD=ended(D), drawE=ended(E);
    ok(drawD?.score===0.5&&drawE?.score===0.5&&drawD.reason==="time"&&!drawD.reward&&!drawE.reward&&drawD.rec.draws===1&&drawE.rec.draws===1,
      "#121: hòa theo hết giờ, không thưởng (D "+drawD?.elo0+" → "+drawD?.elo1+", E "+drawE?.elo0+" → "+drawE?.elo1+")");
    await leaveArena(D); await leaveArena(E);

    // Mỗi đối thủ chỉ dùng tối đa 3 lần để không rơi vào trận giao hữu; 4 đối thủ đủ 11 trận thắng xếp hạng cho một tài khoản.
    for(let i=0;i<4;i++){ const b=await bot("B121O"+(i+1),i%2?"u_minh_linh_mieu":"hoa_anh",{sex:i%2,hair:i%3,hairCol:i%5,outfitCol:(i+1)%6}); await warpTown(b); opponents.push(b); }
    // Trận đầu là noshow (#790: không Elo, không thưởng, không đếm cặp); các trận sau tính một lượt thưởng mỗi trận.
    for(let i=0;i<ARENA.dailyWins+2;i++){
      const O=opponents[i%opponents.length];
      if(O.leftCode!==null) await back(O);
      await at(W); await at(O);
      W.arena=[]; O.arena=[]; await queue(W); await queue(O);
      ok(await waitFor(()=>found(W)&&found(O)&&found(W).roomId===found(O).roomId,3000),"#121: ghép trận thưởng "+(i+1)+"/"+(ARENA.dailyWins+1));
      // Trận đầu: O vẫn giữ phòng bản đồ, W vào sân trước để giữ ArenaRoom sống trong lúc chờ MapRoom tự ngắt O (20 s).
      // Các trận sau: cả hai vào sân rồi O rời, kết thúc ngay (reason "leave"), không chờ 20 s mỗi trận.
      const slow=i===0;
      await enterArena(W);
      if(slow) ok(await waitFor(()=>O.leftCode===4006,ARENA.joinSecs*1000+2000),"#121: server ngắt kết nối người chưa vào sân (mã "+O.leftCode+")");
      else { await enterArena(O); await close(O); }
      ok(await waitFor(()=>ended(W),5000),"#121: trận thưởng "+(i+1)+" kết thúc ("+(slow?"noshow":"đối thủ rời sân")+")");
      const m=ended(W), k=i-1, paid=!slow&&k<ARENA.dailyWins;
      if(slow) ok(m?.score===1&&m.reason==="noshow"&&m.friendly&&!m.reward&&m.elo1===m.elo0&&m.left===ARENA.dailyWins,
        "#790: trận bỏ cuộc: bên còn lại không đổi Elo ("+m?.elo0+" → "+m?.elo1+"), không thưởng, không mất lượt (left "+m?.left+")");
      else ok(!m?.friendly&&!m.eloCapped&&m?.score===1&&m.reason==="leave"&&(paid ? !!m.reward&&!m.capped : !m.reward&&m.left===0)&&m.left===Math.max(0,ARENA.dailyWins-k-1),
        "#121: trận "+(i+1)+" "+(paid?"còn lượt thưởng":"hết lượt thưởng, không thưởng")+" (left "+m?.left+", capped "+m?.capped+")");
      await leaveArena(W);
    }
  } finally {
    for(const b of [D,E,W,...opponents]) await close(b);
  }
}
