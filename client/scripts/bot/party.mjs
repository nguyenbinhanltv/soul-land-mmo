// Nhóm bot "party" (#703 bước 6, tách nguyên văn từ bot-test.mjs): Tổ đội: buff, mở rộng hiệu ứng, đóng góp hỗ trợ, Phục Chế.
import { sleep, waitFor, ok, bot, enter, qtyOf, sendTeam, same, test } from "./lib.mjs";
import { vohonIndex, TIEN_CO_MAX, skillsOf, buffPower, TIEN_CO_RIENG, statusBit, buffBit, TEAM_COMBAT_SECS, MAPS, BONE_ITEM, KING, chestCode, BONE_SKILLS, CORE_ITEM, CORE_SET_FX, SWITCH_CD, PARTY_BUFF_R, PARTY_BUFF_MULT, PARTY_BUFF_SKIP, SUPPORT_CONTRIB, COPY_R, COPY_WINDOW } from "../../../shared/data.ts";
import { skillCast } from "./village.mjs";

/**
 * 9.1: hiệu ứng phụ trợ lan cho đồng đội tổ đội. 3 bot mới ở Thánh Hồn Thôn: A (Cửu Bảo Lưu Ly Tháp ra trận) và B cùng tổ đội, O ở
 * ngoài. Lực Chi Lưu Ly: B đứng 100 pixel nhận tăng công × PARTY_BUFF_MULT (A vẫn ×1), O đứng gần không nhận; B đứng 300 pixel, B
 * trong vùng an toàn không nhận. Hồn Chi Lưu Ly hồi hồn lực, Phòng Chi Lưu Ly tạo khiên + tăng thủ cho B đúng tỉ lệ; tiên cơ Lưu Ly
 * Hộ Thể hồi sinh lực B đúng tỉ lệ (theo sinh lực tối đa của võ hồn ra trận của B), miễn sát thương; có số "+" và dòng "<tên> … cho bạn".
 */
export async function partyBuffTest({ leaveSafe, inSafeOf }){
  console.log("[9.1] hiệu ứng phụ trợ lan cho đồng đội tổ đội đứng gần");
  ok(PARTY_BUFF_R===160&&PARTY_BUFF_MULT===0.7&&PARTY_BUFF_SKIP.includes("phoenix"),`PARTY_BUFF_R ${PARTY_BUFF_R}, PARTY_BUFF_MULT ${PARTY_BUFF_MULT}, không lan: ${PARTY_BUFF_SKIP.join(", ")}`);
  const A=await bot("Lưu Ly A","bich_lan_xa_hoang",{sex:1,hair:1,hairCol:2,outfitCol:3});
  const B=await bot("Lưu Ly B","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:4,outfitCol:1});
  const O=await bot("Lưu Ly O","bich_lan_xa_hoang",{sex:0,hair:3,hairCol:1,outfitCol:5});
  const meP=b=>b.room.state.players.get(b.room.sessionId), live=async b=>(await test(b,"stats")).live;
  await waitFor(()=>[A,B,O].every(b=>b.owned&&b.party&&meP(b)),3000);
  try{
    // A: Cửu Bảo Lưu Ly Tháp 4 hồn hoàn ra trận, võ hồn khởi đầu ở ô 2 (để đổi tay tung tiên cơ).
    const CB="cuu_bao_luu_ly_thap", sk=skillsOf(CB), tc=TIEN_CO_RIENG[CB], Y=[423,764,1760,5000], BP=i=>buffPower(Y[i]);
    await test(A,"grant",{vohon:CB}); const rowOf=id=>A.owned.list.find(v=>v.vohon===id)?.rowId, cb=rowOf(CB), st=rowOf("bich_lan_xa_hoang");
    await test(A,"set",{rowId:cb,level:40,xp:0,rings:Y});
    await sendTeam(A,[cb,0,0,0]); await sendTeam(A,[cb,st,0,0]);
    ok(A.owned.active===cb&&await waitFor(()=>meP(A).vh===vohonIndex(CB)),"A: Cửu Bảo Lưu Ly Tháp ra trận (4 hồn hoàn)");
    // Tổ đội A + B.
    await test(A,"party",{pop:"rlreset"});
    const n=B.partyMsgs; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>B.partyMsgs>n);
    B.room.send("party",{op:"accept",name:A.name}); await waitFor(()=>A.party?.members?.length===2&&B.party?.id===A.party.id,2000);
    ok(A.party?.members.length===2&&B.party?.id===A.party.id&&!O.party?.id,"A và B cùng tổ đội, O không trong đội");
    // Ra khỏi làng; mọi người đặt quanh A bằng hook goto (thử từng hướng tới khi đứng được, đúng trong / ngoài làng).
    await leaveSafe(A); const pa=meP(A), ax=pa.x, ay=pa.y;
    async function place(b,dist,{inside=false}={}){
      for(const [ux,uy] of [[1,0],[0,1],[0,-1],[-1,0],[0.7071,0.7071],[0.7071,-0.7071],[-0.7071,0.7071],[-0.7071,-0.7071]]){
        const x=+(ax+ux*dist).toFixed(1), y=+(ay+uy*dist).toFixed(1); await test(b,"goto",{x,y});
        if(await waitFor(()=>Math.hypot(meP(b).x-x,meP(b).y-y)<0.5,600)&&inSafeOf(b)===inside) return true;
      }
      console.log(`  ⚠ không đặt được ${b.name} cách A ${dist} pixel${inside?" trong làng":""}`); return false;
    }
    const clean=async()=>{ await test(A,"clear"); await test(B,"clear"); }; // hồn thú quanh đó không xen vào
    const dist=b=>Math.round(Math.hypot(meP(b).x-meP(A).x,meP(b).y-meP(A).y));
    ok(await place(B,100)&&await place(O,90),`B cách A ${dist(B)} pixel, O (ngoài đội) cách ${dist(O)} pixel, ngoài làng`);
    // ---- Lực Chi Lưu Ly: B nhận công × 0,7, A ×1, O không ----
    await clean(); await test(A,"ready"); let lb=B.logs.length; A.room.send("skill",{i:0});
    // Tin log và bản vá state đi riêng: chờ cả hào quang trong state (đọc ngay khi log tới thì có lúc state chưa vá).
    await waitFor(()=>B.logs.length>lb,1500); await waitFor(()=>(meP(B).buff&buffBit("atk"))!==0,1000);
    let la=await live(A), lB=await live(B), want=sk[0].self.buff.atk*BP(0);
    const lO=await live(O);
    ok(Math.abs((la.buffs.atk?.v??0)-want)<1e-9&&Math.abs((lB.buffs.atk?.v??0)-want*PARTY_BUFF_MULT)<1e-9&&Math.abs((lB.buffs.atk?.t??0)-sk[0].self.secs)<1,
      `${sk[0].name}: A công +${(want*100).toFixed(1)}%, B (100 pixel) +${((lB.buffs.atk?.v??0)*100).toFixed(1)}% (cần ×${PARTY_BUFF_MULT}), ${lB.buffs.atk?.t?.toFixed(1)} giây`);
    ok(Math.abs(lB.atkNow-lB.atk*(1+want*PARTY_BUFF_MULT))<1e-6&&(meP(B).buff&buffBit("atk"))!==0,`B: công đang dùng ${lB.atkNow.toFixed(1)} (gốc ${lB.atk.toFixed(1)}), mọi người thấy hào quang`);
    ok(B.logs.slice(lb).some(t=>t.includes(`${A.name} tăng công cho bạn`)),`B nhận dòng: ${B.logs.slice(lb).join(" | ")}`);
    ok(!lO.buffs.atk&&!O.logs.some(t=>t.includes(A.name)),"O (ngoài tổ đội, đứng gần) không nhận");
    // ---- Đứng 300 pixel / trong vùng an toàn: không nhận ----
    await test(B,"rest",{s:30}); await place(B,300);
    await clean(); await test(A,"ready"); lb=B.logs.length; A.room.send("skill",{i:0}); await sleep(400);
    lB=await live(B); ok(dist(B)>PARTY_BUFF_R&&!lB.buffs.atk&&B.logs.length===lb,`B đứng ${dist(B)} pixel: không nhận`);
    if(await place(B,60,{inside:true})){
      await test(A,"ready"); lb=B.logs.length; A.room.send("skill",{i:0}); await sleep(400);
      lB=await live(B); ok(inSafeOf(B)&&!lB.buffs.atk&&B.logs.length===lb,`B đứng ${dist(B)} pixel nhưng trong làng (vùng an toàn): không nhận`);
    }
    await place(B,100);
    // ---- Hồn Chi Lưu Ly: hồi hồn lực × 0,7, giảm tiêu hao ----
    await test(B,"ready",{mp:20}); await waitFor(()=>Math.abs(meP(B).mp-meP(B).maxMp*0.2)<=2); const m0=meP(B).mp;
    await clean(); await test(A,"ready"); lb=B.logs.length; A.room.send("skill",{i:2}); await waitFor(()=>B.logs.length>lb,1500);
    // Hồn lực tự hồi vài điểm mỗi giây nên đo phần hồi qua dòng log, sinh lực / hồn lực trong state chỉ cần không ít hơn.
    want=Math.round(meP(B).maxMp*sk[2].self.mp*BP(2)*PARTY_BUFF_MULT);
    // Tin log tới trước bản vá state: chờ hồn lực trong state tăng đủ rồi mới đọc (đọc ngay thì còn giá trị cũ, chỉ hơn m0 vài điểm tự hồi).
    await waitFor(()=>meP(B).mp>=m0+want-1,1500); lB=await live(B);
    const gotMp=+(B.logs.slice(lb).join(" ").match(/hồi (\d+) hồn lực cho bạn/)?.[1]??-1);
    ok(Math.abs(gotMp-want)<=1&&meP(B).mp>=m0+want-1&&Math.abs((lB.buffs.mp?.v??0)-sk[2].self.buff.mp*BP(2)*PARTY_BUFF_MULT)<1e-9,
      `${sk[2].name}: B hồi ${gotMp} hồn lực (cần ${want} = ${sk[2].self.mp*100}% × buffPower × ${PARTY_BUFF_MULT}), ${m0} -> ${meP(B).mp}, giảm tiêu hao ${((lB.buffs.mp?.v??0)*100).toFixed(1)}%`);
    // ---- Phòng Chi Lưu Ly: khiên theo sinh lực tối đa của B × 0,7, tăng thủ ----
    await clean(); await test(A,"ready"); B.gifts=[]; lb=B.logs.length; A.room.send("skill",{i:3}); await waitFor(()=>B.logs.length>lb,1500);
    await waitFor(()=>meP(B).shield>0&&B.gifts.some(g=>g.shield),1000); lB=await live(B); la=await live(A); want=Math.round(lB.maxHp*sk[3].self.shield*BP(3)*PARTY_BUFF_MULT);
    ok(lB.shield===want&&meP(B).shield===want&&la.shield===Math.round(la.maxHp*sk[3].self.shield*BP(3))&&Math.abs((lB.buffs.def?.v??0)-sk[3].self.buff.def*BP(3)*PARTY_BUFF_MULT)<1e-9,
      `${sk[3].name}: khiên B ${lB.shield} (cần ${want}), A ${la.shield}; thủ B +${((lB.buffs.def?.v??0)*100).toFixed(1)}%`);
    ok(B.gifts.some(g=>g.shield&&g.v===want)&&/tăng thủ, tạo khiên \d+ cho bạn/.test(B.logs.slice(lb).join(" | ")),`B thấy số khiên +${B.gifts.find(g=>g.shield)?.v}: ${B.logs.slice(lb).join(" | ")}`);
    // ---- Tiên cơ Lưu Ly Hộ Thể: hồi sinh lực B × 0,7 (võ hồn ra trận của B), miễn sát thương; O bị thương không được hồi ----
    await test(B,"rest",{s:30}); await test(O,"rest",{s:30});
    await sleep(150); await waitFor(()=>meP(A).swCd===0,3500); A.room.send("switch",{slot:1}); await waitFor(()=>A.owned.active===st);
    await sleep(150); await waitFor(()=>meP(A).swCd===0,3500);
    await test(B,"hurt",{pct:50}); await test(O,"hurt",{pct:50}); await sleep(150);
    const h0=meP(B).hp, o0=meP(O).hp, mB=meP(B).maxHp, heal=Math.round(mB*tc.self.heal*PARTY_BUFF_MULT);
    await test(A,"energy",{v:TIEN_CO_MAX}); await clean(); B.gifts=[]; lb=B.logs.length;
    A.room.send("switch",{slot:0}); await waitFor(()=>B.logs.length>lb,1500);
    want=Math.min(mB,h0+heal);
    // Dòng log tới trước bản vá state (sinh lực, cờ miễn sát thương) và tin "dmg": chờ đủ cả ba rồi mới đọc.
    await waitFor(()=>A.owned.active===cb&&Math.abs(meP(B).hp-want)<=1&&(meP(B).buff&buffBit("inv"))!==0&&B.gifts.some(g=>g.heal),1500);
    ok(A.owned.active===cb&&Math.abs(meP(B).hp-want)<=1&&B.gifts.some(g=>g.heal&&Math.abs(g.v-heal)<=1),
      `tiên cơ ${tc.name}: sinh lực B ${h0} -> ${meP(B).hp}/${mB} (cần ~${want}, ${tc.self.heal*100}% × ${PARTY_BUFF_MULT}), số +${B.gifts.find(g=>g.heal)?.v}`);
    ok((meP(B).buff&buffBit("inv"))!==0&&B.logs.slice(lb).some(t=>t.startsWith(`${A.name} miễn sát thương, hồi `)&&t.endsWith(" sinh lực cho bạn.")),
      `B miễn sát thương: ${B.logs.slice(lb).join(" | ")}`);
    // O vẫn tự hồi sinh lực chậm theo thời gian: chỉ cần không nhận phần hồi của tiên cơ, không miễn sát thương, không có dòng của A.
    ok(meP(O).hp<o0+heal/2&&!(meP(O).buff&buffBit("inv"))&&!O.logs.some(t=>t.includes(A.name)),`O (ngoài đội) không được hồi: ${o0} -> ${meP(O).hp}`);
  } finally { for(const b of [A,B,O]) await b.room.leave().catch(()=>{}); }
}

/**
 * 9.4: hiệu ứng tổ đội của #114. A là Phụ trợ, B cùng tổ đội, O đứng gần nhưng ngoài đội: thanh tẩy chỉ tới B; khiên hồn cốt
 * chỉ tới B; bộ Lưu Ly 4 món chỉ phát công cho B theo PARTY_BUFF_MULT.
 */
export async function partyEffectExpansionTest({ leaveSafe, inSafeOf }){
  console.log("[#114] thanh tẩy, hồn cốt và hồn hạch hỗ trợ lan cho đồng đội");
  const A=await bot("Mở rộng A","xuc_xich",{sex:1,hair:1,hairCol:2,outfitCol:3});
  const B=await bot("Mở rộng B","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:4,outfitCol:1});
  const O=await bot("Mở rộng O","bich_lan_xa_hoang",{sex:0,hair:3,hairCol:1,outfitCol:5});
  const meP=b=>b.room.state.players.get(b.room.sessionId), live=async b=>(await test(b,"stats")).live;
  await waitFor(()=>[A,B,O].every(b=>b.owned&&b.party&&meP(b)),3000);
  try{
    const xuc="xuc_xich", xrow=A.owned.active, Y=[423,764,1760,5000,12000,20000,35000,50000];
    await test(A,"set",{rowId:xrow,level:60,xp:0,rings:Y});
    await test(A,"grant",{vohon:"bich_lan_xa_hoang"});
    const stRow=A.owned.list.find(v=>v.vohon==="bich_lan_xa_hoang")?.rowId;
    await sendTeam(A,[xrow,stRow,0,0]); await sendTeam(A,[xrow,stRow,0,0]);
    const loadN=A.ownedMsgs;
    A.room.send("loadout",{rowId:xrow,skills:[7,1,2,3]});
    await waitFor(()=>A.ownedMsgs>loadN&&same(A.owned.list.find(v=>v.rowId===xrow)?.skills,[7,1,2,3]),1500);
    ok(same(A.owned.list.find(v=>v.rowId===xrow)?.skills,[7,1,2,3]),"Xúc Xích mang thanh tẩy vòng 8 ở ô U");
    await test(A,"party",{pop:"rlreset"}); const n=B.partyMsgs; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>B.partyMsgs>n);
    B.room.send("party",{op:"accept",name:A.name}); await waitFor(()=>A.party?.members?.length===2&&B.party?.id===A.party.id,2000);
    await leaveSafe(A); const pa=meP(A), ax=pa.x, ay=pa.y;
    async function place(b,dist){ for(const [ux,uy] of [[1,0],[0,1],[0,-1],[-1,0],[0.7071,0.7071],[-0.7071,0.7071]]){
      const x=+(ax+ux*dist).toFixed(1), y=+(ay+uy*dist).toFixed(1); await test(b,"goto",{x,y});
      if(await waitFor(()=>Math.hypot(meP(b).x-x,meP(b).y-y)<0.5,600)&&!inSafeOf(b)) return true;
    } return false; }
    ok(await place(B,100)&&await place(O,90),`B trong đội, O ngoài đội, khoảng cách < ${PARTY_BUFF_R}`);
    await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});

    // Thanh tẩy: kỹ năng vòng 8 của Xúc Xích không gây sát thương, chỉ giải trạng thái cho đồng đội hợp lệ.
    await test(B,"pst",{s:"stun",secs:60}); await test(O,"pst",{s:"stun",secs:60}); await test(A,"ready");
    A.room.send("skill",{i:0}); await waitFor(()=>((meP(B).st??0)&statusBit("stun"))===0,1500);
    ok(((meP(B).st??0)&statusBit("stun"))===0&&((meP(O).st??0)&statusBit("stun"))!==0,"thanh tẩy lan tới B, không lan tới O");

    // Hồn cốt khiên tự thân: chỉ self được phép lan; sát thương / trạng thái hồn thú vẫn xử lý ở A.
    await test(B,"hurt",{pct:1}); await test(B,"rest",{s:30});
    const n0=A.bagMsgs??0, l0=A.logs.length; await test(A,"give",{code:BONE_ITEM,years:5000,beast:"thiet_giap_xuyen_son_giap",slot:"tay_trai"});
    await waitFor(()=>A.bagMsgs>n0&&A.logs.length>l0,2000); const bone=A.bag.items.find(i=>i.code===BONE_ITEM&&i.stats?.beast==="thiet_giap_xuyen_son_giap"&&i.stats?.slot==="tay_trai"&&i.vohon===null);
    ok(!!bone,"nhận được hồn cốt Thiết Giáp Xuyên Sơn Giáp");
    const equipN=A.bagMsgs??0;
    A.room.send("equip",{itemId:bone?.id,vohonId:xrow});
    await waitFor(()=>A.bagMsgs>equipN&&A.bag.items.find(i=>i.id===bone?.id)?.vohon===xrow,1500);
    ok(A.bag.items.find(i=>i.id===bone?.id)?.vohon===xrow,"gắn hồn cốt vào Xúc Xích");
    await test(A,"clear"); await test(A,"beast",{dx:16,dy:0,years:5000}); await test(A,"ready"); await test(B,"clear"); await test(O,"clear");
    await test(B,"rest",{s:30}); await test(O,"rest",{s:30}); A.room.send("boneskill",{i:1}); await waitFor(()=>(meP(B).shield??0)>0,1500);
    const bLive=await live(B), oLive=await live(O), boneShield=Math.round(bLive.maxHp*BONE_SKILLS.thiet_giap_xuyen_son_giap.active.self.shield*buffPower(5000)*PARTY_BUFF_MULT);
    ok(bLive.shield===boneShield&&oLive.shield===0,`khiên hồn cốt của B ${bLive.shield} (cần ${boneShield}), O không nhận`);

    // Lưu Ly 4 món: chỉ hiệu ứng hỗ trợ atk lan, không có trạng thái / sát thương hồn thú từ CoreFx.
    await test(A,"clear"); await test(A,"rest",{s:TEAM_COMBAT_SECS+1});
    const cores=[]; for(let i=0;i<4;i++){ const giveN=A.bagMsgs??0; await test(A,"give",{code:CORE_ITEM,stars:6,set:"luu_ly"}); await waitFor(()=>A.bagMsgs>giveN,1500); cores.push(A.bag.items.find(v=>v.code===CORE_ITEM&&v.stats?.set==="luu_ly"&&v.vohon===null&&!cores.some(c=>c.id===v.id))); }
    ok(cores.length===4&&cores.every(Boolean),"nhận đủ 4 hồn hạch Lưu Ly");
    for(const [i,c] of cores.entries()){
      const equipCoreN=A.bagMsgs??0;
      A.room.send("equipcore",{itemId:c?.id,vohonId:xrow,slot:i});
      await waitFor(()=>A.bagMsgs>equipCoreN&&A.bag.items.find(v=>v.id===c?.id)?.vohon===xrow,1500);
    }
    ok(cores.every(c=>A.bag.items.find(v=>v.id===c?.id)?.vohon===xrow),"gắn đủ 4 hồn hạch Lưu Ly");
    // Đổi tay theo state (#185). Tin "vohons" (A.owned) tới trước bản vá có swCd = SWITCH_CD: đọc swCd ngay sau tin thì còn số 0 cũ,
    // lần đổi sau gửi khi server còn hồi chiêu nên bị bỏ qua im lặng. Chờ cả tin lẫn võ hồn mới trong state (vh đổi cùng bản vá với
    // swCd). swCd giảm theo nhịp server (dt kẹp 100 ms), máy tải thì lâu hơn SWITCH_CD giây thật: giới hạn chờ rộng, trả ngay khi về 0.
    const swapA=async(slot,row)=>{ const free=await waitFor(()=>meP(A).swCd===0,SWITCH_CD*3000), vh=vohonIndex(A.owned.list.find(v=>v.rowId===row)?.vohon);
      A.room.send("switch",{slot}); return free&&await waitFor(()=>A.owned.active===row&&meP(A).vh===vh,3000); };
    await test(A,"rest",{s:30}); const sw1=await swapA(1,stRow);
    const lb=B.logs.length, sw2=await swapA(0,xrow);
    await waitFor(()=>B.logs.length>lb&&(meP(B).buff&buffBit("atk"))!==0,3000); // dòng log và hào quang trong state của B
    const coreB=await live(B), coreO=await live(O), coreWant=CORE_SET_FX.luu_ly.four.swapAtk*PARTY_BUFF_MULT;
    ok(Math.abs((coreB.buffs.atk?.v??0)-coreWant)<1e-9&&!coreO.buffs.atk,`Lưu Ly 4 món: B nhận công ${(coreB.buffs.atk?.v??0)*100}% (cần ${coreWant*100}%), O không nhận [đổi tay ${sw1}/${sw2}, B: ${B.logs.slice(lb).join(" | ")}]`);
  } finally { for(const b of [A,B,O]) await b.room.leave().catch(()=>{}); }
}

/**
 * 9.2: hồi máu / khiên cho người khác tính vào đóng góp boss. 2 bot mới cùng tổ đội ở Tinh Đấu Ngoại vi: H (Cửu Bảo Lưu Ly Tháp, chỉ
 * hồi máu, không gây sát thương) và A (đánh thú vương). H tự hồi cho mình (A đầy máu): đóng góp không đổi. A mất máu, tiên cơ Lưu Ly
 * Hộ Thể của H hồi A: phần hồi thực (× PARTY_BUFF_MULT) vào `supBy` của H, bảng xếp hạng có cột hỗ trợ; hạ thú vương thì H đủ 3% nhận
 * rương và kinh nghiệm x KING.xp.
 */
export async function supportContribTest(){
  console.log("[9.2] hồi máu / khiên cho người tham gia khác tính đóng góp thú vương");
  ok(SUPPORT_CONTRIB===1&&KING.share===0.03,`SUPPORT_CONTRIB ${SUPPORT_CONTRIB} (1 sinh lực = 1 sát thương), ngưỡng rương ${KING.share*100}%`);
  const NV="tinh_dau_ngoai_vi", CB="cuu_bao_luu_ly_thap", tc=TIEN_CO_RIENG[CB], Y=[423,764,1760,5000], KB=MAPS[NV].king;
  const H=await bot("Hỗ Trợ H","bich_lan_xa_hoang",{sex:1,hair:2,hairCol:3,outfitCol:4});
  const A=await bot("Công Kích A","u_minh_linh_mieu",{sex:0,hair:1,hairCol:5,outfitCol:2});
  const mo=b=>b.room.state.players?.get(b.room.sessionId), sid=b=>b.room.sessionId;
  await waitFor(()=>[H,A].every(b=>b.owned&&b.party&&mo(b)),3000);
  try{
    // H: Cửu Bảo Lưu Ly Tháp ô 1 (cấp 35, 4 hồn hoàn: chưa bình cảnh nên còn nhận kinh nghiệm), võ hồn khởi đầu ô 2 để đổi tay tung tiên cơ.
    await test(H,"grant",{vohon:CB}); const rowOf=id=>H.owned.list.find(v=>v.vohon===id)?.rowId, cb=rowOf(CB), st=rowOf("bich_lan_xa_hoang");
    await test(H,"set",{rowId:cb,level:35,xp:0,rings:Y}); await sendTeam(H,[cb,0,0,0]); await sendTeam(H,[cb,st,0,0]);
    const ra=A.owned.active; await test(A,"set",{rowId:ra,level:35,xp:0,rings:Y});
    ok(H.owned.active===cb&&await waitFor(()=>mo(H).vh===vohonIndex(CB)),"H: Cửu Bảo Lưu Ly Tháp ra trận");
    await test(H,"party",{pop:"rlreset"});
    const n=A.partyMsgs; H.room.send("party",{op:"invite",name:A.name}); await waitFor(()=>A.partyMsgs>n);
    A.room.send("party",{op:"accept",name:H.name}); await waitFor(()=>H.party?.members?.length===2&&A.party?.id===H.party.id,2000);
    ok(A.party?.id&&A.party.id===H.party?.id,"H và A cùng tổ đội");
    // Sang Ngoại vi bằng hook warp (đi cổng ẩn); đồng đội được xếp cùng kênh.
    async function warpNV(b){ b.travel=null; await test(b,"warp",{mapId:NV,x:0,y:0}); await waitFor(()=>b.travel,3000); const t=b.travel;
      await b.room.leave(); await sleep(300); b.mapId=t.mapId; await enter(b,t.roomId??undefined); await waitFor(()=>mo(b)&&b.owned&&b.bag,3000); return b.room.state.mapId===NV; }
    ok(await warpNV(A)&&await warpNV(H)&&A.room.roomId===H.room.roomId,"A, H cùng kênh Tinh Đấu Ngoại vi");
    const kingB=()=>[...A.room.state.beasts.values()].find(b=>b.rank===2);
    await test(A,"king",{kop:"spawn"}); ok(await waitFor(()=>kingB(),2000),"thú vương xuất hiện");
    let ki=await test(A,"king"); const LR=ki.lair, inL=(x,y)=>x>=LR.x&&x<=LR.x+LR.w&&y>=LR.y&&y<=LR.y+LR.h;
    async function intoLair(b,dx,dy){ const t=kingB(); for(let k=0;k<24;k++){ const a=k*Math.PI/6, r=k<12?1:1.6, x=Math.round(t.x+dx*r*Math.cos(a)-dy*Math.sin(a)), y=Math.round(t.y+dx*r*Math.sin(a)+dy*Math.cos(a));
      if(!inL(x,y)) continue; await test(b,"goto",{x,y}); const q=mo(b); if(Math.hypot(q.x-x,q.y-y)<1) return true; } return false; }
    const dAH=()=>Math.round(Math.hypot(mo(A).x-mo(H).x,mo(A).y-mo(H).y));
    ok(await intoLair(A,40,0)&&await intoLair(H,-40,0)&&dAH()<PARTY_BUFF_R,`A, H vào hang, cách nhau ${dAH()} pixel (< ${PARTY_BUFF_R})`);
    await test(A,"clear",{keep:1}); await test(A,"kdmg",{v:1}); await test(A,"status",{s:"stun",secs:60}); ki=await test(A,"king");
    ok(ki.engaged&&ki.parts.includes(sid(A))&&ki.parts.includes(sid(H))&&!ki.list.some(x=>x.id===sid(H)),`A đánh: A, H là người tham gia; H chưa có đóng góp (${JSON.stringify(ki.list)})`);
    /**
     * H đổi sang võ hồn khởi đầu rồi đổi về Cửu Bảo Lưu Ly Tháp với năng lượng đầy: tung tiên cơ Lưu Ly Hộ Thể. Năng lượng về 0 trước
     * khi đổi sang võ hồn khởi đầu, để tiên cơ của nó (gây sát thương) không tung: H chỉ hồi máu.
     */
    async function huThe(){ await waitFor(()=>mo(H).swCd===0,SWITCH_CD*1000+1000); await test(H,"energy",{v:0}); H.room.send("switch",{slot:1}); await waitFor(()=>H.owned.active===st);
      await sleep(150); await waitFor(()=>mo(H).swCd===0,SWITCH_CD*1000+1000); await test(H,"energy",{v:TIEN_CO_MAX});
      const f=H.fxs.length; H.room.send("switch",{slot:0}); return await waitFor(()=>H.owned.active===cb&&H.fxs.slice(f).some(x=>x.k==="tienco"&&x.id===sid(H)),2000); }
    // ---- Tự hồi cho mình: A đầy máu (hook set hồi đầy), H mất máu; tiên cơ chỉ hồi H, đóng góp của H không đổi ----
    await test(A,"set",{rowId:ra}); await test(H,"hurt",{pct:50}); await sleep(150);
    const h0=mo(H).hp; A.gifts=[];
    ok(await huThe(),`H tung tiên cơ ${tc.name}`); await sleep(200); ki=await test(A,"king");
    ok(mo(H).hp>h0&&mo(A).hp===mo(A).maxHp&&!A.gifts.some(g=>g.heal)&&!ki.supBy[sid(H)]&&!ki.list.some(x=>x.id===sid(H)),
      `tự hồi: H ${h0} -> ${mo(H).hp}, A đầy máu không nhận phần hồi; đóng góp H vẫn 0 (supBy ${JSON.stringify(ki.supBy)})`);
    // ---- Hồi cho A (người tham gia): phần hồi thực vào đóng góp của H ----
    await test(A,"rest",{s:30}); await test(A,"hurt",{pct:50}); await sleep(150);
    const a0=mo(A).hp, mA=mo(A).maxHp, heal=Math.min(mA-a0,Math.round(mA*tc.self.heal*PARTY_BUFF_MULT)); A.gifts=[]; H.boss=[];
    ok(await huThe(),`H tung tiên cơ ${tc.name} lần 2`); await waitFor(()=>A.gifts.some(g=>g.heal),1500); ki=await test(A,"king");
    const got=A.gifts.find(g=>g.heal)?.v??0, sup=ki.supBy[sid(H)]??0, me=ki.list.find(x=>x.id===sid(H));
    ok(Math.abs(got-heal)<=1&&Math.abs(sup-got)<=1&&!ki.dmgBy[sid(H)]&&me&&me.sup===me.pct&&Math.abs(me.pct-+(sup*SUPPORT_CONTRIB/ki.total*100).toFixed(1))<0.15,
      `hồi A ${a0} -> ${mo(A).hp}/${mA} (+${got}, cần ${heal}): hỗ trợ H ${sup.toFixed(1)} = ${me?.pct}% đóng góp (cột hỗ trợ ${me?.sup}%), sát thương 0`);
    ok(await waitFor(()=>H.boss.some(m=>m.k==="rank"&&m.list.some(x=>x.id===sid(H)&&x.sup>0)),2500),"H nhận bảng xếp hạng có dòng của mình và cột hỗ trợ");
    // ---- Hạ thú vương: máu còn 1% (hook bhp) để phần hỗ trợ của H trên 3%; H nhận rương và kinh nghiệm ----
    // bhp theo bid: không có bid thì hook nhắm hồn thú gần nhất (sói thú vương gọi ra / hồn thú hoang) và thú vương còn nguyên máu.
    await test(A,"bhp",{pct:1,bid:ki.bid}); ki=await test(A,"king");
    const want=sup/(ki.total+ki.hp), cH=qtyOf(H,chestCode(KB)), xp0=JSON.stringify([mo(H).level,mo(H).xp]);
    H.logs=[]; A.boss=[]; await test(A,"kdmg",{v:1e8});
    ok(await waitFor(()=>A.boss.some(m=>m.k==="down"),2000),"hạ thú vương");
    const dn=A.boss.find(m=>m.k==="down"), hp=dn?.list.find(x=>x.id===sid(H))?.pct??0;
    ok(hp>=KING.share*100&&Math.abs(hp-want*100)<0.2,`kết quả: H đóng góp ${hp}% (chỉ hồi máu, cần ~${(want*100).toFixed(1)}%, từ ${KING.share*100}%)`);
    ok(await waitFor(()=>qtyOf(H,chestCode(KB))===cH+1,2500)&&H.logs.some(t=>/lượt 1\/3/.test(t)),`H nhận rương ${chestCode(KB)}: ${H.logs.filter(t=>/Đóng góp|lượt/.test(t)).join(" | ")}`);
    ok(JSON.stringify([mo(H).level,mo(H).xp])!==xp0,`H nhận kinh nghiệm thú vương x${KING.xp}: [cấp, kinh nghiệm] ${xp0} -> ${JSON.stringify([mo(H).level,mo(H).xp])}`);
  } finally { for(const b of [H,A]) await b.room.leave().catch(()=>{}); }
}

/**
 * 9.3: Phục Chế Hương Tràng chép hồn kỹ của đồng đội tổ đội. A (Cửu Bảo Lưu Ly Tháp) và B (Xúc Xích ra trận, Cửu Bảo Lưu Ly Tháp
 * trong đội) cùng tổ đội, O (Cửu Bảo Lưu Ly Tháp) ngoài đội. A tung Phòng Chi Lưu Ly, B đứng 180 pixel (ngoài PARTY_BUFF_R nên
 * không nhận khiên lan) chép đúng hồn kỹ đó: khiên = sinh lực tối đa của B × tỉ lệ × buffPower vòng 4 của B × 0,8. Quá COPY_WINDOW
 * giây thì không còn gì để chép. A đứng xa (300 pixel) hoặc O (khác tổ đội, đứng 60 pixel) tung sau cùng thì B chép hồn kỹ của
 * đội mình (Lực Chi Lưu Ly do Cửu Bảo Lưu Ly Tháp của B tung).
 */
export async function copyPartyTest({ leaveSafe, inSafeOf }){
  console.log("[9.3] Phục Chế chép hồn kỹ của đồng đội tổ đội đứng gần");
  ok(COPY_R===200&&COPY_WINDOW===8&&COPY_R>PARTY_BUFF_R,`COPY_R ${COPY_R} pixel, COPY_WINDOW ${COPY_WINDOW} giây`);
  const A=await bot("Phục Chế A","bich_lan_xa_hoang",{sex:1,hair:0,hairCol:1,outfitCol:2});
  const B=await bot("Phục Chế B","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:3,outfitCol:4});
  const O=await bot("Phục Chế O","bich_lan_xa_hoang",{sex:1,hair:2,hairCol:5,outfitCol:0});
  const meP=b=>b.room.state.players.get(b.room.sessionId), live=async b=>(await test(b,"stats")).live;
  await waitFor(()=>[A,B,O].every(b=>b.owned&&b.party&&meP(b)),3000);
  try{
    const CB="cuu_bao_luu_ly_thap", XX="xuc_xich", sk=skillsOf(CB), pc=skillsOf(XX)[3], Y=[423,764,1760,5000];
    const rowOf=(b,id)=>b.owned.list.find(v=>v.vohon===id)?.rowId;
    for(const [b,ids] of [[A,[CB]],[B,[XX,CB]],[O,[CB]]]){
      for(const id of ids){ await test(b,"grant",{vohon:id}); await test(b,"set",{rowId:rowOf(b,id),level:40,xp:0,rings:Y}); }
      await sendTeam(b,[rowOf(b,ids[0]),0,0,0]); await sendTeam(b,[rowOf(b,ids[0]),rowOf(b,ids[1]??"bich_lan_xa_hoang"),0,0]);
    }
    ok(meP(A).vh===vohonIndex(CB)&&meP(B).vh===vohonIndex(XX)&&meP(O).vh===vohonIndex(CB),"A, O: Cửu Bảo Lưu Ly Tháp ra trận; B: Xúc Xích ra trận, Cửu Bảo Lưu Ly Tháp chờ");
    await test(A,"party",{pop:"rlreset"});
    const n=B.partyMsgs; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>B.partyMsgs>n);
    B.room.send("party",{op:"accept",name:A.name}); await waitFor(()=>A.party?.members?.length===2&&B.party?.id===A.party.id,2000);
    ok(A.party?.members.length===2&&B.party?.id===A.party.id&&!O.party?.id,"A và B cùng tổ đội, O không trong đội");
    await leaveSafe(A);
    // Đặt `b` cách `ref` đúng `dist` pixel ngoài làng (thử từng hướng tới khi đứng được).
    async function place(b,ref,dist){
      const cx=meP(ref).x, cy=meP(ref).y;
      for(const [ux,uy] of [[1,0],[0,1],[0,-1],[-1,0],[0.7071,0.7071],[0.7071,-0.7071],[-0.7071,0.7071],[-0.7071,-0.7071]]){
        const x=+(cx+ux*dist).toFixed(1), y=+(cy+uy*dist).toFixed(1); await test(b,"goto",{x,y});
        if(await waitFor(()=>Math.hypot(meP(b).x-x,meP(b).y-y)<0.5,600)&&!inSafeOf(b)) return true;
      }
      console.log(`  ⚠ không đặt được ${b.name} cách ${ref.name} ${dist} pixel`); return false;
    }
    const dist=(a,b)=>Math.round(Math.hypot(meP(a).x-meP(b).x,meP(a).y-meP(b).y));
    const clean=async()=>{ for(const b of [A,B,O]) await test(b,"clear"); };
    // B tung Phục Chế (ô P), trả các dòng log mới (đợi tới khi có dòng của Phục Chế).
    async function copy(){
      await test(B,"ready"); const l=B.logs.length; B.room.send("skill",{i:3});
      await waitFor(()=>B.logs.slice(l).some(t=>t.startsWith(`${pc.name}:`)),1500); return B.logs.slice(l).filter(t=>t.startsWith(`${pc.name}:`));
    }
    async function cast(b,i){ await test(b,"ready"); await skillCast(b,i,300); } // đếm từ lúc server đã xử lý (Phục Chế chép hồn kỹ mới nhất theo giờ)
    async function switchTo(b,row){ await sleep(150); await waitFor(()=>meP(b).swCd===0,3500); b.room.send("switch",{slot:b.owned.team.indexOf(row)}); return waitFor(()=>b.owned.active===row,1500); }
    ok(await place(B,A,180),`B cách A ${dist(A,B)} pixel (trong ${COPY_R}, ngoài ${PARTY_BUFF_R}), ngoài làng`);
    await clean();
    let lg=await copy();
    ok(/chưa có hồn kỹ/.test(lg.join(" "))&&meP(B).cds[3]===0,`chưa ai tung hồn kỹ: ${lg.join(" | ")}, không hồi chiêu`);
    // ---- A tung Phòng Chi Lưu Ly, B chép đúng hồn kỹ đó × 0,8 ----
    await cast(A,3); await test(B,"hurt",{pct:5}); await waitFor(()=>meP(B).shield===0);
    const s0=meP(B).shield; lg=await copy();
    const want=Math.round(meP(B).maxHp*sk[3].self.shield*buffPower(Y[3])*pc.copy);
    ok(s0===0&&lg.some(t=>t===`${pc.name}: sao chép ${sk[3].name} của ${A.name}.`)&&await waitFor(()=>meP(B).shield===want,800),
      `B chép ${sk[3].name} của A: khiên ${meP(B).shield} (cần ${want} = sinh lực B × ${sk[3].self.shield} × buffPower × ${pc.copy}); ${lg.join(" | ")}`);
    const lB=await live(B);
    ok(Math.abs((lB.buffs.def?.v??0)-sk[3].self.buff.def*buffPower(Y[3])*pc.copy)<1e-9&&meP(B).vh===vohonIndex(XX)&&meP(B).cds[3]>0,
      `B tăng thủ +${((lB.buffs.def?.v??0)*100).toFixed(1)}% (× ${pc.copy}), Xúc Xích vẫn ra trận, ô P hồi chiêu`);
    // ---- Quá COPY_WINDOW giây: không còn gì để chép ----
    await cast(A,0); await test(A,"rest",{s:COPY_WINDOW+1}); lg=await copy();
    ok(/chưa có hồn kỹ/.test(lg.join(" "))&&meP(B).cds[3]===0,`A tung ${sk[0].name} quá ${COPY_WINDOW} giây trước: ${lg.join(" | ")}`);
    // ---- Đứng xa / khác tổ đội: chép hồn kỹ của đội mình ----
    ok(await place(B,A,300)&&await place(O,B,60),`B cách A ${dist(A,B)} pixel, O (ngoài đội) cách B ${dist(O,B)} pixel`);
    await clean();
    ok(await switchTo(B,rowOf(B,CB)),"B đổi sang Cửu Bảo Lưu Ly Tháp"); await cast(B,0);
    ok(await switchTo(B,rowOf(B,XX)),`B tung ${sk[0].name} rồi đổi về Xúc Xích`);
    await cast(A,3); lg=await copy();
    ok(lg.some(t=>t===`${pc.name}: sao chép ${sk[0].name}.`),`A (${dist(A,B)} pixel) tung ${sk[3].name} sau cùng nhưng đứng xa: B chép hồn kỹ đội mình (${lg.join(" | ")})`);
    await cast(O,3); lg=await copy();
    ok(lg.some(t=>t===`${pc.name}: sao chép ${sk[0].name}.`),`O (khác tổ đội, ${dist(O,B)} pixel) tung ${sk[3].name} sau cùng: B chép hồn kỹ đội mình (${lg.join(" | ")})`);
    // ---- Đồng đội lại gần, tung sau hồn kỹ của đội mình: chép của đồng đội ----
    ok(await place(B,A,120),`B lại gần A (${dist(A,B)} pixel)`); await cast(A,2); lg=await copy();
    ok(lg.some(t=>t===`${pc.name}: sao chép ${sk[2].name} của ${A.name}.`),`A tung ${sk[2].name} gần nhất: B chép của A (${lg.join(" | ")})`);
  } finally { for(const b of [A,B,O]) await b.room.leave().catch(()=>{}); }
}
