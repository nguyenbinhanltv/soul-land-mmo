// Nhóm bot chuong2 (#703 bước 4): chương 2 Sử Lai Khắc Thất Quái (#189, #256). Tách nguyên văn từ bot-test.mjs.
import { post, sleep, waitFor, ok, bot, enter, qtyOf, npcSpot, talk, same, test } from "./lib.mjs";
import { VOHON, itemDef, MAPS, shardCode, BOSSES, bossIndex, npcDef, QUEST_STARTER, QUEST_CH2, QUEST_AFTER, questChain, parseQuest, questStatus, questGoalHit, questRewardText } from "../../../shared/data.ts";

/**
 * Chương 2 "Sử Lai Khắc Thất Quái" (#189, phần 1 và #256 phần 2; BOT_ONLY=chuong2, nhóm 6 của BOT_PART): dữ liệu chuỗi (9 bài, NPC Triệu Vô Cực ở Thiên Đấu
 * Thành, mục tiêu trỏ tới bản đồ / NPC có thật, không thưởng mảnh UR, khớp sự kiện elite / king / party); server giữ tiến độ nhiều chuỗi:
 * chương 2 chỉ mở sau tân thủ, tiến độ tân thủ không đổi; nhận / trả bài 1 (đặt chân tới Thiên Đấu Thành, nói chuyện với Phất Lan Đức)
 * và lưu qua lần vào lại; phần 2: sự kiện elite / king / party và đi hết 9 bài.
 */
export async function chapter2Test(){
  console.log("[#189] Chương 2: Sử Lai Khắc Thất Quái");
  const ch=questChain(QUEST_CH2);
  ok(ch&&ch.steps.length===9&&npcSpot(ch.map,ch.giver)&&npcDef(ch.giver)?.name==="Triệu Vô Cực"&&QUEST_AFTER[QUEST_CH2]===QUEST_STARTER,
    `chuỗi "${ch?.name}": ${ch?.steps.length} bài, ${npcDef(ch?.giver)?.name} ở ${MAPS[ch?.map]?.name}, mở sau chuỗi tân thủ`);
  ok(new Set(ch.steps.map(x=>x.id)).size===9&&ch.steps.every(x=>x.offer.length&&x.done.length&&x.goals.length&&x.goals.every(g=>Number.isInteger(g.n)&&g.n>0&&g.text)
    &&x.reward.items.every(r=>itemDef(r.code)&&r.qty>0&&VOHON.find(v=>shardCode(v.id)===r.code)?.rarity!=="UR")),"mỗi bài có lời giao, lời trả, mục tiêu và thưởng hợp lệ (không mảnh UR)");
  ok(ch.steps.every(x=>x.goals.every(g=>(!g.map||MAPS[g.map])&&(!g.npc||Object.keys(MAPS).some(m=>npcSpot(m,g.npc))))),"mục tiêu trỏ tới NPC, bản đồ có thật");
  const el=ch.steps[1].goals[0], kg=ch.steps[5].goals[0], king=ch.steps[7].goals[0];
  ok(questGoalHit(el,{k:"elite"})&&!questGoalHit(el,{k:"kill"})&&questGoalHit(king,{k:"king"})&&!questGoalHit(kg,{k:"kill",fit:true})&&!questGoalHit(kg,{k:"kill",party:true})
    &&questGoalHit(kg,{k:"kill",fit:true,party:true}),"khớp sự kiện elite / king; kill cần cả fit và party");
  ok(same(parseQuest({step:99,accepted:true,prog:[5]},QUEST_CH2),{chain:QUEST_CH2,step:9,accepted:false,prog:[]}),"parseQuest kẹp bước của chương 2");
  const D=await bot("Thất Quái","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  const dme=()=>D.room.state.players?.get(D.room.sessionId);
  if(!(await test(D,"ping"))?.enabled){ console.log("  ⚠ bỏ qua phần server (cần hook warp, goto, quest…): bật server bằng GAME_TEST=1"); await D.room.leave(); return; }
  async function warp(mapId,x,y){
    D.travel=null; D.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>D.travel?.mapId===mapId,4000),`warp -> ${mapId}`);
    await D.room.leave(); await sleep(300); D.mapId=(await post("/api/me",{token:D.token})).mapId; await enter(D);
    await waitFor(()=>dme()&&D.bag&&D.quest&&D.chains[QUEST_CH2],3000);
  }
  /** Gửi `quest {op, chain: QUEST_CH2}`; server luôn trả tin "quest" của chuỗi đó. Trả dòng log cuối. */
  async function qop(op){ const n=D.chainMsgs, l=D.logs.length; D.room.send("quest",{op,chain:QUEST_CH2}); await waitFor(()=>D.chainMsgs>n,1500); await sleep(60); return D.logs.slice(l).at(-1)??""; }
  const q2=()=>D.chains[QUEST_CH2];
  ok(await waitFor(()=>q2(),2000)&&q2().step===0&&!q2().accepted&&D.quest.chain===QUEST_STARTER&&D.quest.step===0,`tài khoản mới: có tiến độ cả hai chuỗi, chương 2 ở bài 1 (${JSON.stringify(q2())})`);
  const gs=npcSpot(ch.map,ch.giver);
  await warp(ch.map,gs.x,gs.y+16);
  let t=await qop("accept"); ok(/Chưa mở/.test(t)&&!q2().accepted,`chưa xong chuỗi tân thủ: không nhận được chương 2 (${t})`);
  await test(D,"quest",{step:questChain(QUEST_STARTER).steps.length,accepted:false});
  ok(await waitFor(()=>D.quest.status==="done"),"hook quest: đặt chuỗi tân thủ xong");
  t=await qop("turnin"); ok(/Chưa nhận/.test(t)&&q2().step===0,`xong tân thủ: chương 2 mở, chưa nhận thì không trả được (${t})`);
  await test(D,"goto",{x:gs.x+800,y:gs.y}); t=await qop("accept"); ok(/lại gần Triệu Vô Cực/.test(t)&&!q2().accepted,`đứng xa Triệu Vô Cực: không nhận được (${t})`);
  await test(D,"goto",{x:gs.x,y:gs.y+16}); t=await qop("accept");
  ok(q2().accepted&&q2().ev==="accept"&&q2().prog[0]===1&&q2().prog[1]===0&&D.quest.status==="done",`nhận bài 1: đã đứng ở Thiên Đấu Thành nên xong mục tiêu bản đồ (${JSON.stringify(q2().prog)})`);
  const pg=npcSpot(ch.map,"phat_lan_duc"); await test(D,"goto",{x:pg.x,y:pg.y+16}); await talk(D,"phat_lan_duc");
  ok(await waitFor(()=>q2().status==="ready")&&q2().ev==="ready","nói chuyện với Phất Lan Đức: bài 1 xong");
  await test(D,"goto",{x:gs.x,y:gs.y+16});
  const s=ch.steps[0], ht=D.bag.honTe, qty0=qtyOf(D,s.reward.items[0].code); t=await qop("turnin");
  ok(q2().step===1&&!q2().accepted&&q2().done===s.id&&D.bag.honTe===ht+s.reward.honTe&&qtyOf(D,s.reward.items[0].code)===qty0+s.reward.items[0].qty,`trả bài 1 "${s.name}": +${questRewardText(s.reward)} (${t})`);
  await D.room.leave(); await sleep(400); await enter(D); await waitFor(()=>dme()&&D.quest&&D.chains[QUEST_CH2]);
  ok(q2().step===1&&D.quest.status==="done","thoát vào lại: chương 2 ở bài 2, chuỗi tân thủ vẫn xong");
  // Phần 2 (#256): sự kiện elite / king / party do server phát, rồi đi hết 9 bài. Bài đếm bằng sự kiện đã có từ trước (bản đồ, hạ hồn thú, hấp thụ,
  // đấu trường) đặt đủ số đếm bằng hook quest để khỏi lặp lại bài tân thủ / khảo hạch; bài elite, king, party đi bằng sự kiện thật.
  const setStep=async(i,accepted=false,prog)=>{ await test(D,"quest",{chain:QUEST_CH2,step:i,accepted,prog}); await waitFor(()=>q2().step===i&&q2().accepted===accepted); };
  const cnt=(i=0)=>q2().prog?.[i]??0, back=()=>warp(ch.map,gs.x,gs.y+16);
  async function acc(i){ const tt=await qop("accept"); ok(q2().step===i&&q2().accepted&&q2().ev==="accept",`nhận bài ${i+1} "${ch.steps[i].name}" (${tt})`); }
  async function turn(i){
    const r=ch.steps[i].reward, ht=D.bag.honTe, q0=r.items.map(x=>qtyOf(D,x.code)), n=D.bagMsgs??0, tt=await qop("turnin"); await waitFor(()=>(D.bagMsgs??0)>n,1500);
    ok(q2().step===i+1&&!q2().accepted&&D.bag.honTe===ht+r.honTe&&r.items.every((x,k)=>qtyOf(D,x.code)===q0[k]+x.qty),`trả bài ${i+1} "${ch.steps[i].name}": +${questRewardText(r)} (${tt})`);
  }
  /** Bài đếm bằng sự kiện đã có sẵn: nhận, đặt đủ số đếm, trả. */
  async function viaHook(i){ await setStep(i); await acc(i); await setStep(i,true,ch.steps[i].goals.map(g=>g.n)); ok(await waitFor(()=>q2().status==="ready"),`bài ${i+1}: đủ mục tiêu`); await turn(i); }
  const spot=()=>({x:dme().x,y:dme().y});
  const slayAt=async(extra)=>{ await test(D,"clear"); const r=await test(D,"beast",{dx:14,dy:0,...extra}); await test(D,"slay",{bid:r?.bid}); await sleep(200); return r?.bid; };
  // Bài 2 (elite): hạ tinh anh trước khi nhận không tính; sau khi nhận thì tính.
  await warp("thanh_hon_thon",0,0); const EB=(await test(D,"elite"))?.list?.[0]?.boss;
  ok(!!EB&&!!BOSSES[bossIndex(EB)],`Thánh Hồn Thôn có tinh anh (${EB})`);
  await setStep(1); await slayAt({boss:EB}); ok(cnt()===0,`hạ tinh anh khi chưa nhận bài 2: không tính (${JSON.stringify(q2().prog)})`);
  await back(); await acc(1); await warp("thanh_hon_thon",0,0);
  await slayAt({boss:EB}); ok(await waitFor(()=>q2().status==="ready")&&cnt()===1,`bài 2: hạ tinh anh sau khi nhận: xong (${JSON.stringify(q2().prog)})`);
  await back(); await turn(1);
  await viaHook(2); await viaHook(3); await viaHook(4);
  // Bài 6 (party): hạ hồn thú hợp cấp một mình không tính; có đồng đội trong tổ đội và trong tầm chia kinh nghiệm thì tính.
  const E=await bot("Đồng đội "+Date.now().toString(36).slice(-4),"nhu_cot_tho",{sex:1,hair:0,hairCol:5,outfitCol:2});
  await setStep(5); await acc(5); await warp("thanh_hon_thon",0,0);
  await slayAt(); ok(cnt()===0,`hạ hồn thú hợp cấp một mình: không tính party (${JSON.stringify(q2().prog)})`);
  D.room.send("party",{op:"invite",name:E.name}); await sleep(300); E.room.send("party",{op:"accept",name:D.name}); await sleep(400);
  ok(await waitFor(()=>D.party?.id&&D.party.id===E.party?.id,2000),"D và đồng đội đã vào cùng tổ đội");
  await test(E,"goto",spot()); await sleep(200); await slayAt(); ok(await waitFor(()=>cnt()===1),`hạ hồn thú hợp cấp khi đồng đội trong tầm: tính party (${JSON.stringify(q2().prog)})`);
  await setStep(5,true,[ch.steps[5].goals[0].n]); await back(); await turn(5);
  D.room.send("party",{op:"leave"}); E.room.send("party",{op:"leave"});
  await viaHook(6);
  // Bài 8 (king): thú vương tà hóa bị hạ, người có đóng góp còn trong phòng được tính.
  await setStep(7); await acc(7); await warp("tinh_dau_ngoai_vi",0,0);
  await test(D,"king",{kop:"spawn"}); const kb=()=>[...D.room.state.beasts.entries()].find(([,b])=>b.rank===2);
  ok(await waitFor(()=>kb(),2000),"thú vương xuất hiện ở Tinh Đấu Ngoại vi");
  const kid=kb()?.[0]; await test(D,"status",{s:"stun",secs:60}); await test(D,"kdmg",{v:1,bid:kid}); await test(D,"slay",{bid:kid});
  ok(await waitFor(()=>q2().status==="ready")&&cnt()===1,`bài 8: có đóng góp khi hạ thú vương: xong (${JSON.stringify(q2().prog)})`);
  await back(); await turn(7);
  await viaHook(8);
  ok(q2().step===9&&questStatus(q2())==="done","đi hết 9 bài của chương 2");
  await E.room.leave();
  await D.room.leave();
}
