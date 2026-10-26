// Nhóm bot "quest" (#703 bước 3, tách nguyên văn từ bot-test.mjs).
import { readFileSync } from "node:fs";
import { post, sleep, waitFor, ok, mapUrl, zonesByName, bot, enter, qtyOf, bagKey, npcSpot, talk, looseOf, same, test, needHookSkip } from "./lib.mjs";
import { BAG_SLOTS, itemDef, formatHonTe, MAPS, RING_ITEM, ringLimit, CORE_ITEM, npcDef, QUEST_STARTER, questChain, questStart, parseQuest, questStatus, questRewardText, SWITCH_CD } from "../../../shared/data.ts";

/**
 * 6.2: chuỗi tân thủ của Ngọc Tiểu Cương. Dữ liệu (QUESTS: số bài, mục tiêu, NPC / vùng / bản đồ có thật, phần thưởng hợp lệ,
 * parseQuest kẹp dữ liệu hỏng); tài khoản mới D bắt đầu ở bài 1, ở Thánh Hồn Thôn không nhận được. Với hook: D sang Nặc Đinh Thành
 * (hook warp đi qua đúng transaction đi cổng), đi hết 7 bài: mục tiêu chỉ đếm sau khi nhận, đếm theo sự kiện thật (nói chuyện, hạ hồn
 * thú đúng vùng / bản đồ, đổi tay khi đang giao chiến, tiên cơ, hấp thụ trong giới hạn, gắn hồn hạch, vào Ngoại vi); nhận / trả khi
 * đứng xa, chưa xong, chưa nhận đều bị từ chối; thưởng đúng Hồn Tệ và vật phẩm; túi đầy thì không trả được; mục tiêu đã đạt sẵn tính
 * xong ngay khi nhận (tài khoản cũ); đi cổng, thoát vào lại giữ tiến độ.
 */
export async function questTest({blocked}){
  console.log("[6.2] Nhiệm vụ: chuỗi tân thủ của Ngọc Tiểu Cương");
  const ch=questChain(QUEST_STARTER), mapObjs=id=>JSON.parse(readFileSync(mapUrl(id),"utf8")).layers.flatMap(l=>l.objects??[]);
  ok(ch&&ch.steps.length>=6&&ch.steps.length<=10&&npcSpot(ch.map,ch.giver),`chuỗi "${ch?.name}": ${ch?.steps.length} bài, ${npcDef(ch?.giver)?.name} ở ${MAPS[ch?.map]?.name}`);
  ok(new Set(ch.steps.map(s=>s.id)).size===ch.steps.length&&ch.steps.every(s=>s.offer.length&&s.done.length&&s.goals.length&&s.goals.every(g=>Number.isInteger(g.n)&&g.n>0&&g.text)
    &&s.reward.honTe>=0&&(s.reward.honTe>0||s.reward.items.length)&&s.reward.items.every(r=>itemDef(r.code)&&r.qty>0)),"mỗi bài có lời giao, lời trả, mục tiêu và phần thưởng hợp lệ");
  ok(ch.steps.every(s=>s.goals.every(g=>(!g.map||MAPS[g.map])&&(!g.npc||Object.keys(MAPS).some(m=>npcSpot(m,g.npc)))
    &&(!g.zone||mapObjs(g.map).some(o=>o.type==="zone"&&o.name===g.zone)))),"mục tiêu trỏ tới NPC, bản đồ, vùng săn có thật");
  ok(same(parseQuest({step:99,accepted:true,prog:[5]},QUEST_STARTER),{chain:QUEST_STARTER,step:ch.steps.length,accepted:false,prog:[]})
    &&same(parseQuest({step:1,accepted:true,prog:[99]},QUEST_STARTER).prog,[ch.steps[1].goals[0].n])&&same(parseQuest({step:2,accepted:true,prog:["x",-3]},QUEST_STARTER).prog,[0,0])
    &&same(parseQuest(null,QUEST_STARTER),questStart(QUEST_STARTER))&&questStatus(parseQuest({step:ch.steps.length},QUEST_STARTER))==="done","parseQuest kẹp bước, số đếm, dữ liệu hỏng");
  const D=await bot("Đệ tử "+Date.now().toString(36).slice(-5),"u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  const dme=()=>D.room.state.players?.get(D.room.sessionId);
  /** Gửi `quest {op}`; server luôn trả tin "quest" (kèm log khi nhận / trả / từ chối). Trả dòng log cuối của lần này. */
  async function qop(op){ const n=D.questMsgs, l=D.logs.length; D.room.send("quest",{op}); await waitFor(()=>D.questMsgs>n,1500); await sleep(60); return D.logs.slice(l).at(-1)??""; }
  ok(await waitFor(()=>D.quest,2000)&&D.quest.chain===QUEST_STARTER&&D.quest.step===0&&!D.quest.accepted&&D.quest.status==="offer",`tài khoản mới: bài 1 chưa nhận (${JSON.stringify(D.quest)})`);
  let t=await qop("accept"); ok(/không ở đây/.test(t)&&!D.quest.accepted,`ở Thánh Hồn Thôn: không nhận được nhiệm vụ (${t})`);
  t=await qop("lung_tung"); ok(/không hợp lệ/.test(t),`thao tác lạ bị từ chối (${t})`);
  if(!(await test(D,"ping"))?.enabled){ needHookSkip("bỏ qua đi hết chuỗi (cần hook warp, goto, beast, give…): bật server bằng GAME_TEST=1"); await D.room.leave(); return; }
  /** Hook warp: sang `mapId` tại (x, y) qua transaction đi cổng, rồi rời phòng và vào phòng mới như đi cổng thật. */
  async function warp(mapId,x,y){
    const q0=JSON.stringify([D.quest.step,D.quest.accepted,D.quest.prog]), bk=bagKey(D);
    D.travel=null; D.room.send("test",{op:"warp",mapId,x,y});
    ok(await waitFor(()=>D.travel?.mapId===mapId,4000),`warp -> ${mapId}`);
    await D.room.leave(); await sleep(300); D.mapId=(await post("/api/me",{token:D.token})).mapId; await enter(D);
    await waitFor(()=>dme()&&D.bag&&D.quest,3000);
    ok(D.room.state.mapId===mapId&&bagKey(D)===bk&&(JSON.stringify([D.quest.step,D.quest.accepted,D.quest.prog])===q0||D.quest.status==="active"||D.quest.status==="ready"),
      `vào ${MAPS[mapId].name}: túi đồ và tiến độ nhiệm vụ qua transaction đi cổng (${JSON.stringify(D.quest.prog)})`);
  }
  const ds=npcSpot(ch.map,ch.giver), atGiver=()=>test(D,"goto",{x:ds.x,y:ds.y+16}), go=(id)=>{ const sp=npcSpot(ch.map,id); return test(D,"goto",{x:sp.x,y:sp.y+16}); };
  async function accept(i,expect="accept"){ const tt=await qop("accept"); ok(D.quest.step===i&&D.quest.accepted&&D.quest.ev===expect,`nhận bài ${i+1} "${ch.steps[i].name}" (${tt})`); }
  async function turnIn(i){
    const s=ch.steps[i], ht=D.bag.honTe, before=Object.fromEntries(s.reward.items.map(r=>[r.code,qtyOf(D,r.code)])), n=D.bagMsgs??0;
    const tt=await qop("turnin"); await waitFor(()=>(D.bagMsgs??0)>n,1500);
    ok(D.quest.step===i+1&&!D.quest.accepted&&D.quest.done===s.id&&D.bag.honTe===ht+s.reward.honTe&&s.reward.items.every(r=>qtyOf(D,r.code)===before[r.code]+r.qty),
      `trả bài ${i+1} "${s.name}": +${questRewardText(s.reward)} (${tt})`);
  }
  /** Đặt hồn thú 1 máu ngay chỗ D đứng rồi đánh hạ. */
  async function killOne(){
    const st=D.room.state; await test(D,"clear"); const ids=new Set(st.beasts.keys());
    // Hook beast trả id (con mới đầu tiên chưa chắc là nó: hồn thú hoang ở Bãi tập sinh lại cùng lúc thì vòng đánh chờ nhầm con).
    const r=await test(D,"beast",{dx:0,dy:0}); const fresh=()=>r?.bid&&st.beasts.has(r.bid)?r.bid:[...st.beasts.keys()].find(k=>!ids.has(k)); await waitFor(fresh,1000); const bid=fresh();
    for(let i=0;i<15&&bid&&st.beasts.has(bid);i++){ D.room.send("attack"); await waitFor(()=>!st.beasts.has(bid),450); }
    return !!bid&&!st.beasts.has(bid);
  }
  const progOf=()=>JSON.stringify(D.quest.prog);
  // Bài 1: gặp Thương nhân. Nói chuyện trước khi nhận không tính; nhận / trả khi đứng xa bị từ chối.
  const tn=npcSpot(ch.map,"thuong_nhan");
  await warp(ch.map,tn.x,tn.y+16);
  ok(await talk(D,"thuong_nhan")==="thuong_nhan"&&!D.quest.accepted,"chưa nhận bài: nói chuyện với Thương nhân không tính");
  t=await qop("accept"); ok(/lại gần Ngọc Tiểu Cương/.test(t)&&!D.quest.accepted,`đứng xa Đại Sư: không nhận được (${t})`);
  await atGiver(); ok(await talk(D,ch.giver)===ch.giver,"đứng cạnh Đại Sư: mở hộp thoại");
  t=await qop("turnin"); ok(/Chưa nhận/.test(t)&&D.quest.step===0,`chưa nhận thì không trả được (${t})`);
  await accept(0);
  t=await qop("accept"); ok(/Đang làm/.test(t)&&D.quest.step===0,`nhận lại bài đang làm bị từ chối (${t})`);
  const hb=D.bag.honTe; t=await qop("turnin"); ok(/Chưa xong/.test(t)&&D.quest.step===0&&D.bag.honTe===hb,`chưa xong thì không trả được (${t})`);
  await go("thuong_nhan"); await talk(D,"thuong_nhan");
  ok(await waitFor(()=>D.quest.status==="ready")&&D.quest.ev==="ready"&&same(D.quest.prog,[1]),`nói chuyện với Thương nhân: bài 1 xong (${progOf()})`);
  t=await qop("turnin"); ok(/lại gần Ngọc Tiểu Cương/.test(t)&&D.quest.step===0&&D.bag.honTe===hb,`đứng ở cửa hàng: trả nhiệm vụ bị từ chối, chưa nhận thưởng (${t})`);
  await atGiver(); await turnIn(0);
  t=await qop("turnin"); ok(/Chưa nhận/.test(t)&&D.quest.step===1,`trả lần hai bị từ chối, không nhận thưởng hai lần (${t})`);
  // Bài 2: hạ 8 hồn thú ở Bãi tập hồn sư. Hạ ở Đồng lúa thì không tính. Chỗ đứng trong vùng đọc từ file Tiled đang dùng (bản cũ
  // 90×60 hay bản ×8 đều được, 11.5): tâm các mảnh vùng, thử từng mảnh tới khi đứng được.
  const zoneSpot=(name)=>{ const os=JSON.parse(readFileSync(mapUrl("thanh_hon_thon"),"utf8")).layers.flatMap(l=>l.objects??[]);
    const sf=os.find(o=>o.type==="safe"), rs=zonesByName(os).get(name)?.rects??[];
    for(const r of rs) for(const [fx,fy] of [[0.5,0.5],[0.3,0.3],[0.7,0.7],[0.3,0.7],[0.7,0.3]]){ const x=Math.round(r.x+r.width*fx), y=Math.round(r.y+r.height*fy);
      if(!blocked(x,y)&&!(sf&&x>=sf.x&&x<=sf.x+sf.width&&y>=sf.y&&y<=sf.y+sf.height)) return {x,y}; }
    return {x:rs[0].x+rs[0].width/2,y:rs[0].y+rs[0].height/2}; };
  const bt=zoneSpot("Bãi tập hồn sư"), dl=zoneSpot("Đồng lúa ven làng");
  await accept(1); const need2=ch.steps[1].goals[0].n;
  await warp("thanh_hon_thon",dl.x,dl.y);
  ok(await killOne()&&D.quest.prog[0]===0,`hạ hồn thú ở Đồng lúa: Bãi tập vẫn ${progOf()}`);
  await test(D,"goto",bt); await test(D,"rest",{s:10});
  for(let k=0;k<need2;k++) await killOne();
  ok(await waitFor(()=>D.quest.status==="ready")&&D.quest.prog[0]===need2,`hạ ${need2} hồn thú ở Bãi tập hồn sư: ${progOf()}`);
  // Đang ở Thánh Hồn Thôn: không trả được, phải về Nặc Đinh Thành.
  t=await qop("turnin"); ok(/không ở đây/.test(t)&&D.quest.step===1,`ở Thánh Hồn Thôn: không trả được (${t})`);
  await warp(ch.map,ds.x,ds.y+16); await turnIn(1);
  // Bài 3: đổi tay khi giao chiến (ngoài giao chiến không tính) và tiên cơ.
  await accept(2);
  await warp("thanh_hon_thon",bt.x,bt.y); await test(D,"rest",{s:10});
  const other=()=>D.owned.team.findIndex(r=>r&&r!==D.owned.active);
  await switchSlot(other()); ok(D.quest.prog[0]===0,`đổi võ hồn ngoài giao chiến: không tính (${progOf()})`);
  // Hồn thú hoang ở Bãi tập có thể đánh gục võ hồn ra trận trong lúc chờ hồi chiêu đổi: dọn quanh mình trước.
  await sleep(SWITCH_CD*1000+200); await test(D,"clear"); const killed=await killOne(), tk=Date.now();
  await switchSlot(other()); ok(await waitFor(()=>D.quest.prog[0]===1),`đổi võ hồn khi đang giao chiến: ${progOf()} (${D.logs.slice(-3).join(" | ")})`+
    (D.quest.prog[0]===1?"":` [hạ được ${killed}, đổi sau ${Date.now()-tk} ms, swCd ${D.room.state.players.get(D.room.sessionId)?.swCd}]`));
  await sleep(SWITCH_CD*1000+200); await test(D,"energy",{v:100}); await test(D,"beast",{dx:8,dy:0});
  await switchSlot(other());
  ok(await waitFor(()=>D.quest.status==="ready")&&D.quest.prog[1]===1,`tung tiên cơ: bài 3 xong (${progOf()})`);
  await warp(ch.map,ds.x,ds.y+16); await turnIn(2);
  // Bài 4: hấp thụ trong giới hạn. Vượt giới hạn (thành công nhờ hook roll) không tính; trong giới hạn thì tính.
  await accept(3); ok(D.quest.prog[0]===0,"chưa võ hồn nào có hồn hoàn: bài 4 chưa xong khi nhận");
  const [r1,r2]=D.owned.team.filter(Boolean);
  for(const r of [r1,r2]) await test(D,"set",{rowId:r,level:10,xp:0,rings:[]});
  await test(D,"roll",{r:99});
  const absorbOne=async(years,rowId)=>{ await test(D,"give",{code:RING_ITEM,years}); const it=D.bag.items.find(i=>i.code===RING_ITEM&&i.years===years);
    D.absorbing=null; D.room.send("absorb",{itemId:it.id,vohonId:rowId}); await waitFor(()=>D.absorbing?.on,1500); D.absorbing=null; await test(D,"rush"); await waitFor(()=>D.absorbing&&!D.absorbing.on,1500); return D.absorbing?.result; };
  const over=Math.round(ringLimit(1)*1.18);
  ok(await absorbOne(over,r1)==="ok"&&D.quest.prog[0]===0,`hấp thụ hồn hoàn ${over} năm (vượt giới hạn vòng 1, thành công nhờ hook roll): không tính (${progOf()})`);
  ok(await absorbOne(ringLimit(1)-123,r2)==="ok"&&await waitFor(()=>D.quest.status==="ready"),`hấp thụ hồn hoàn ${ringLimit(1)-123} năm trong giới hạn: bài 4 xong (${progOf()})`);
  await test(D,"roll",{r:-1});
  await turnIn(3);
  // Tài khoản cũ (đã có hồn hoàn): nhận bài 4 thì tính xong ngay. Lùi tiến độ bằng hook rồi đặt lại bài 5 (không trả lần hai).
  await test(D,"quest",{step:3,accepted:false}); await accept(3,"ready");
  ok(D.quest.status==="ready","đã có võ hồn mang hồn hoàn: nhận bài 4 là xong ngay (mục tiêu đã đạt sẵn)");
  await test(D,"quest",{step:4,accepted:false}); ok(D.quest.step===4&&!D.quest.accepted,"hook quest: về lại bài 5 chưa nhận");
  // Bài 5: gắn hồn hạch (sự kiện gắn thật, ngoài giao chiến).
  await accept(4); ok(D.quest.prog[0]===0,"chưa gắn gì: bài 5 chưa xong khi nhận");
  await test(D,"give",{code:CORE_ITEM,stars:2,set:"tien_co"}); const core=D.bag.items.find(i=>i.code===CORE_ITEM&&i.vohon===null);
  D.room.send("equipcore",{itemId:core.id,vohonId:D.owned.active});
  ok(await waitFor(()=>D.quest.status==="ready"),`gắn hồn hạch vào võ hồn ra trận: bài 5 xong (${progOf()})`);
  await turnIn(4);
  // Bài 6: gặp Thợ rèn.
  await accept(5); await go("lo_ren"); await talk(D,"lo_ren");
  ok(await waitFor(()=>D.quest.status==="ready"),"nói chuyện với Thợ rèn: bài 6 xong");
  await atGiver(); await turnIn(5);
  // Bài 7: vào Tinh Đấu Ngoại vi và hạ 5 hồn thú ở đó; thoát vào lại giữa chừng vẫn giữ tiến độ.
  await accept(6); ok(same(D.quest.prog,[0,0]),"đang ở Nặc Đinh Thành: chưa đặt chân tới Ngoại vi");
  const ar7=mapObjs("tinh_dau_ngoai_vi").find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh"); await warp("tinh_dau_ngoai_vi",ar7.x,ar7.y); ok(D.quest.prog[0]===1,`vào Tinh Đấu Ngoại vi: ${progOf()}`);
  const need7=ch.steps[6].goals[1].n;
  for(let k=0;k<2;k++) await killOne();
  ok(D.quest.prog[1]===2,`hạ 2 hồn thú ở Ngoại vi: ${progOf()}`);
  const q7=progOf(); await D.room.leave(); await sleep(400); await enter(D); await waitFor(()=>dme()&&D.quest);
  ok(progOf()===q7&&D.quest.accepted&&D.quest.step===6,`thoát vào lại: tiến độ bài 7 giữ nguyên ${progOf()}`);
  for(let k=2;k<need7;k++) await killOne();
  ok(await waitFor(()=>D.quest.status==="ready"),`hạ đủ ${need7} hồn thú ở Ngoại vi: bài 7 xong (${progOf()})`);
  await warp(ch.map,ds.x,ds.y+16);
  // Túi đầy: không trả được, không mất tiến độ, không nhận thưởng; bỏ bớt đồ rồi trả được.
  await test(D,"give",{code:"hoi_hon_dan",qty:BAG_SLOTS*itemDef("hoi_hon_dan").stack});
  const hf=D.bag.honTe; t=await qop("turnin");
  ok(/không đủ chỗ/.test(t)&&D.quest.step===6&&D.quest.status==="ready"&&D.bag.honTe===hf,`túi đầy: không trả được bài 7, giữ tiến độ (${t})`);
  for(const it of looseOf(D).filter(i=>i.code==="hoi_hon_dan").slice(0,6)) D.room.send("discard",{id:it.id});
  await waitFor(()=>looseOf(D).length<=BAG_SLOTS-6,2000);
  await turnIn(6);
  ok(D.quest.status==="done"&&D.quest.ev==="finish",`xong cả chuỗi "${ch.name}"`);
  t=await qop("accept"); ok(/Đã học xong/.test(t),`xong rồi thì không nhận thêm (${t})`);
  const bk=bagKey(D); await D.room.leave(); await sleep(400); await enter(D); await waitFor(()=>dme()&&D.quest&&D.bag);
  ok(D.quest.status==="done"&&D.quest.step===ch.steps.length&&bagKey(D)===bk,`thoát vào lại: chuỗi đã xong, túi và Hồn Tệ còn nguyên (${formatHonTe(D.bag.honTe)})`);
  await D.room.leave();
  /** Đổi sang ô `slot` của đội, chờ server gửi lại đội hình. */
  // Hồi chiêu đổi đếm theo nhịp server (server bận thì chậm hơn đồng hồ thật): chờ swCd về 0 trong state rồi mới đổi, không thì bị từ chối.
  async function switchSlot(slot){ await waitFor(()=>!(D.room.state.players.get(D.room.sessionId)?.swCd>0),SWITCH_CD*1000+1500);
    const n=D.ownedMsgs; D.room.send("switch",{slot}); await waitFor(()=>D.ownedMsgs>n,1500); await sleep(80); }
}
