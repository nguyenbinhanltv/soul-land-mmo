// Nhóm bot gear (#703 bước 4): khắc may mắn, xem trước cường hóa, ghi DB lỗi, mua lại, soát xã hội, equipSoak. Tách nguyên văn từ bot-test.mjs.
import { post, sleep, waitFor, PASS, RUN, ok, bot, enter, bagKey, npcSpot, looseOf, same, test } from "./lib.mjs";
import * as SD from "../../../shared/data.ts";
import { TIERS, CHANNEL_CD, TEAM_COMBAT_SECS, RING_ITEM, CORE_ITEM, coreResetFee, sellPrice, TONG_MON, AWAKEN_CHOICES, TICK_RATE, BAG_MSG_BURST, BAG_MSG_RATE, EQUIP_MAX_ENHANCE, EQUIP_LUCK_MAX, parseEquip, EQUIP_STONES, EQUIP_CHARM, equipEnhanceStep, EQUIP_SOUL, EQUIP_LUCK_UP, equipLuckStep } from "../../../shared/data.ts";

/**
 * Khắc may mắn (#662): bảng EQUIP_LUCK_UP và hàm thuần equipLuckStep (trần món / trần tổng hai ô đang mặc), thành công (+1 may mắn, trừ 1 Thần Hồn, không trừ Hồn Tệ),
 * thất bại (mất Thần Hồn, giữ may mắn, món còn nguyên và cấp cường hóa không đổi), từ chối (xa Thợ rèn, thiếu Thần Hồn, ô không có may mắn, đã đạt trần, id lạ),
 * trần tổng hai ô đang mặc (món đang mặc bị chặn, món trong túi vẫn khắc tới trần của chính nó), chỉ số tính lại khi mặc, 20 lệnh dồn chỉ 1 lệnh, lưu qua lần vào lại.
 */
export async function gearLuckTest(){
  console.log("[#662] Thợ rèn: khắc may mắn bằng Thần Hồn");
  ok(EQUIP_LUCK_UP.length===EQUIP_LUCK_MAX&&EQUIP_LUCK_UP.every((p,i)=>p>0&&p<=1&&(i===0||p<=EQUIP_LUCK_UP[i-1])),"bảng EQUIP_LUCK_UP: một mức mỗi bước tới EQUIP_LUCK_MAX, tỉ lệ giảm dần trong (0, 1]");
  ok(same(equipLuckStep(0,null),{to:1,p:EQUIP_LUCK_UP[0]})&&same(equipLuckStep(EQUIP_LUCK_MAX-1,null),{to:EQUIP_LUCK_MAX,p:EQUIP_LUCK_UP[EQUIP_LUCK_MAX-1]})&&equipLuckStep(EQUIP_LUCK_MAX,null)===null
    &&equipLuckStep(3,EQUIP_LUCK_MAX)===null&&equipLuckStep(3,EQUIP_LUCK_MAX-1)?.to===4&&equipLuckStep(EQUIP_LUCK_MAX,3)===null,
    "equipLuckStep: món trong túi chặn ở EQUIP_LUCK_MAX, món đang mặc còn chặn khi tổng hai ô đã đạt EQUIP_LUCK_MAX");
  const S=await bot("Khac may man","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ console.log("  ⚠ bỏ qua khắc may mắn (cần hook gear, give, coin, enhroll, enhslow): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
  const me=()=>S.room.state.players?.get(S.room.sessionId), loose=()=>looseOf(S), find=id=>loose().find(i=>i.id===id)??S.gear?.items.find(g=>g.id===id);
  const watch=()=>{ S.lucN=0; S.lucLast=null; S.room.onMessage("equipluckd",m=>{ S.lucLast=m; S.lucN++; }); S.room.onMessage("equipluckp",()=>{}); };
  watch();
  S.travel=null; S.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>S.travel,4000);
  if(S.travel){ const t=S.travel; await S.room.leave(); await sleep(300); S.mapId=t.mapId; await enter(S,t.roomId??undefined); watch(); }
  await waitFor(()=>me()&&S.bag&&S.gear,4000);
  async function rejoin(){ await S.room.leave(); await sleep(400); S.mapId=(await post("/api/me",{token:S.token})).mapId; await enter(S); watch(); await waitFor(()=>me()&&S.bag&&S.gear,4000); }
  const lr=npcSpot("nac_dinh_thanh","lo_ren");
  const have=code=>loose().filter(i=>i.code===code).reduce((n,i)=>n+i.qty,0);
  const give=async(code,qty)=>{ const n=have(code); await test(S,"give",{code,qty}); await waitFor(()=>have(code)===n+qty,2000); };
  const coin=async n=>{ await test(S,"coin",{n}); await waitFor(()=>S.bag.honTe===n,1500); };
  const mk=async(tpl,luck,enhance=0)=>{ const r=await test(S,"gear",{tpl,enhance,ilvl:3,luck}); await waitFor(()=>loose().some(i=>i.id===r?.id),1500); return r?.id; };
  const luckOf=id=>parseEquip(find(id)?.stats)?.luck;
  /** Gửi equipluck; trả kết quả (tin equipluckd) hoặc null kèm dòng log từ chối. */
  async function luck(id){ const n=S.lucN, l=S.logs.length; S.room.send("equipluck",{id}); await waitFor(()=>S.lucN>n||S.logs.length>l,2500); await sleep(150); return S.lucN>n?S.lucLast:null; }
  const wear=async id=>{ S.room.send("equipgear",{id}); await waitFor(()=>S.gear?.items.some(g=>g.id===id),2000); };
  await test(S,"gear",{clear:true}); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); await test(S,"enhroll",{r:0}); await coin(1e6);

  // ---- Từ chối: không đổi gì ----
  const A=await mk("vu_khi_pham_khi",2,4); await give(EQUIP_SOUL,5);
  let r=await luck(A); ok(r===null&&/lại gần Thợ rèn/.test(S.logs.at(-1))&&luckOf(A)===2&&have(EQUIP_SOUL)===5,`xa Thợ rèn: bị từ chối, giữ nguyên Thần Hồn (${S.logs.at(-1)})`);
  await test(S,"goto",{x:lr.x,y:lr.y+16});
  r=await luck("khong-co-id"); ok(r===null&&/Không có trang bị/.test(S.logs.at(-1)),"id lạ: bị từ chối");
  const AO=await mk("ao_pham_khi",0); r=await luck(AO); ok(r===null&&/chỉ vũ khí và dây chuyền/.test(S.logs.at(-1))&&have(EQUIP_SOUL)===5,`ô không có may mắn (áo): bị từ chối, giữ Thần Hồn (${S.logs.at(-1)})`);
  const MX=await mk("vu_khi_pham_khi",EQUIP_LUCK_MAX); r=await luck(MX); ok(r===null&&/tối đa/.test(S.logs.at(-1))&&luckOf(MX)===EQUIP_LUCK_MAX&&have(EQUIP_SOUL)===5,`món đã đạt may mắn tối đa: bị từ chối, giữ Thần Hồn (${S.logs.at(-1)})`);
  S.room.send("discard",{id:loose().find(i=>i.code===EQUIP_SOUL)?.id}); await waitFor(()=>have(EQUIP_SOUL)===0,2000);
  r=await luck(A); ok(r===null&&/Không có Thần Hồn/.test(S.logs.at(-1))&&luckOf(A)===2,`thiếu Thần Hồn: bị từ chối (${S.logs.at(-1)})`);

  // ---- Thành công: M2 → M3, đúng 1 Thần Hồn, không trừ Hồn Tệ, cấp cường hóa giữ ----
  await give(EQUIP_SOUL,10); const coin0=S.bag.honTe;
  r=await luck(A); ok(r?.ok===true&&r.from===2&&r.to===3&&luckOf(A)===3&&have(EQUIP_SOUL)===9&&S.bag.honTe===coin0&&find(A).enhance===4,"tung thắng: M2 → M3, trừ 1 Thần Hồn, không phí Hồn Tệ, +4 vẫn giữ");

  // ---- Thất bại: mất Thần Hồn, giữ may mắn, món không bị phá ----
  await test(S,"enhroll",{r:99});
  r=await luck(A); ok(r&&!r.ok&&r.to===3&&luckOf(A)===3&&!!find(A)&&find(A).enhance===4&&have(EQUIP_SOUL)===8&&S.bag.honTe===coin0,"tung thua: giữ M3, mất 1 Thần Hồn, món còn nguyên (+4), không phí Hồn Tệ");
  await rejoin(); ok(luckOf(A)===3&&find(A)?.enhance===4&&have(EQUIP_SOUL)===8,"vào lại: may mắn M3 và số Thần Hồn đã lưu");

  // ---- Trần tổng hai ô đang mặc ----
  await test(S,"enhroll",{r:0}); await test(S,"gear",{clear:true}); await test(S,"goto",{x:lr.x,y:lr.y+16}); await test(S,"rest",{s:TEAM_COMBAT_SECS+1});
  const W=await mk("vu_khi_pham_khi",5), N=await mk("day_chuyen_pham_khi",3), B=await mk("vu_khi_tu_kim",5);
  await wear(W); await wear(N);
  let g=await test(S,"stats"); ok(g.gear.luck===8,`mặc vũ khí M5 + dây chuyền M3: tổng may mắn ${g.gear.luck} = 8`);
  r=await luck(W); g=await test(S,"stats"); ok(r?.ok&&luckOf(W)===6&&g.gear.luck===9,`khắc món đang mặc: vũ khí M6, tổng hai ô tính lại = ${g.gear.luck} (trần ${EQUIP_LUCK_MAX})`);
  const soul1=have(EQUIP_SOUL); r=await luck(N);
  ok(r===null&&/Tổng may mắn hai ô đang mặc/.test(S.logs.at(-1))&&luckOf(N)===3&&have(EQUIP_SOUL)===soul1,`tổng hai ô đã đạt trần: món đang mặc bị chặn, giữ Thần Hồn (${S.logs.at(-1)})`);
  r=await luck(B); ok(r?.ok&&luckOf(B)===6&&have(EQUIP_SOUL)===soul1-1,"món TRONG TÚI không tính trần tổng: vẫn khắc M5 → M6");
  await rejoin(); g=await test(S,"stats"); ok(luckOf(W)===6&&luckOf(N)===3&&g.gear.luck===9,`vào lại: may mắn món đang mặc đã lưu, tổng ${g.gear.luck}`);

  // ---- 20 lệnh dồn cùng lúc: một lệnh được xử lý ----
  await test(S,"gear",{clear:true}); await test(S,"goto",{x:lr.x,y:lr.y+16}); await test(S,"enhroll",{r:0});
  const T=await mk("day_chuyen_than_khi",0); await give(EQUIP_SOUL,30);
  const soul0=have(EQUIP_SOUL), n0=S.lucN; await test(S,"enhslow",{ms:400});
  for(let k=0;k<20;k++) S.room.send("equipluck",{id:T});
  await waitFor(()=>S.lucN>n0,3000); await sleep(900); await test(S,"enhslow",{ms:0});
  ok(S.lucN===n0+1&&luckOf(T)===1&&have(EQUIP_SOUL)===soul0-1,`20 lệnh dồn: đúng 1 lệnh được xử lý (M0 → M${luckOf(T)}), trừ ${soul0-have(EQUIP_SOUL)} Thần Hồn`);
  r=await luck(T); ok(r?.ok&&luckOf(T)===2,"sau khi xong, lệnh kế tiếp được nhận lại bình thường");
  await test(S,"enhroll",{r:-1}); await test(S,"gear",{clear:true});
  }finally{ await S.room.leave().catch(()=>{}); }
}

/**
 * Xem trước cường hóa + đổi bộ hồn hạch ở Thợ rèn (#699, BOT_ONLY=forgepreview, nhóm 5): `equipenhpreview {id}` chỉ đọc (số liệu khớp bảng EQUIP_ENHANCE và kết quả
 * `equipenh` thật, không đổi túi / Hồn Tệ / log; id lạ, món của người khác, vật phẩm không phải trang bị, giá trị lạ: không trả lời; cờ busy khi lệnh đang xử lý;
 * gọi dồn bị bộ đếm token chặn), `coreset {id,set,npc}` (sai sở hữu, không phải hồn hạch, bộ lạ, NPC lạ, đang giao chiến, vừa đủ phí, bấm dồn chỉ trừ phí một lần).
 */
export async function forgePreviewTest(){
  console.log("[#699] Thợ rèn: xem trước cường hóa và đổi bộ hồn hạch");
  const S=await bot("Xem truoc","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ console.log("  ⚠ bỏ qua xem trước cường hóa (cần hook gear, give, coin, enhroll, enhslow): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  const Q=await bot("Xem truoc Q","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  try{
  const me=()=>S.room.state.players?.get(S.room.sessionId), loose=()=>looseOf(S), find=id=>loose().find(i=>i.id===id)??S.gear?.items.find(g=>g.id===id);
  const st=l=>equipEnhanceStep(l), stone=l=>EQUIP_STONES[st(l).stone].id;
  const watch=()=>{ S.enhN=0; S.enhLast=null; S.pvN=0; S.pv=null;
    S.room.onMessage("equipenhd",m=>{ S.enhLast=m; S.enhN++; }); S.room.onMessage("equipenhp",m=>{ S.pv=m; S.pvN++; }); };
  watch();
  S.travel=null; S.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>S.travel,4000);
  if(S.travel){ const t=S.travel; await S.room.leave(); await sleep(300); S.mapId=t.mapId; await enter(S,t.roomId??undefined); watch(); }
  await waitFor(()=>me()&&S.bag&&S.gear,4000);
  // Q vào đúng phòng của S: id của Q là id có thật trong cùng MapRoom (pdata của phòng có Q), không phải id lạ.
  Q.travel=null; Q.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>Q.travel,4000);
  { const t=Q.travel; await Q.room.leave(); await sleep(300); Q.mapId=t?.mapId??Q.mapId; await enter(Q,S.room.roomId); await waitFor(()=>Q.bag,4000); }
  const sameRoom=Q.room.roomId===S.room.roomId; ok(sameRoom,"bot Q cùng phòng với S (Nặc Đinh Thành): món / hồn hạch của Q là id có thật trong phòng");
  const lr=npcSpot("nac_dinh_thanh","lo_ren"), ds=npcSpot("nac_dinh_thanh","dai_su");
  const have=code=>loose().filter(i=>i.code===code).reduce((n,i)=>n+i.qty,0);
  const give=async(code,qty)=>{ const n=have(code); await test(S,"give",{code,qty}); await waitFor(()=>have(code)===n+qty,2000); };
  const coin=async n=>{ await test(S,"coin",{n}); await waitFor(()=>S.bag.honTe===n,1500); };
  const mk=async(tpl,enhance)=>{ const r=await test(S,"gear",{tpl,enhance,ilvl:3}); await waitFor(()=>loose().some(i=>i.id===r?.id),1500); return r?.id; };
  /** Gửi equipenhpreview; trả tin equipenhp mới nhất hoặc null (không trả lời trong 400 ms). */
  async function pv(id){ const n=S.pvN; S.room.send("equipenhpreview",{id}); await waitFor(()=>S.pvN>n,400); return S.pvN>n?S.pv:null; }
  async function enh(id,charm=false){ const n=S.enhN, l=S.logs.length; S.room.send("equipenh",{id,charm}); await waitFor(()=>S.enhN>n||S.logs.length>l,2500); await sleep(200); return S.enhN>n?S.enhLast:null; }
  await test(S,"gear",{clear:true}); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); await test(S,"goto",{x:lr.x,y:lr.y+16}); await coin(1e6);

  // ---- Số liệu khớp bảng cường hóa ở mọi nấc, không đổi túi / Hồn Tệ / log ----
  await give(EQUIP_CHARM,2);
  let allOk=true, bad="";
  for(const lv of [0,3,5,6,9,11,13,14]){
    const id=await mk("vu_khi_pham_khi",lv); await give(stone(lv),2); const s=st(lv), bk=bagKey(S), nl=S.logs.length, p=await pv(id);
    const good=p&&p.id===id&&p.enhance===lv&&p.to===lv+1&&p.p===s.p&&same(p.fail,s.fail)&&p.stone===stone(lv)&&p.qty===s.qty&&p.fee===s.fee&&p.have===have(stone(lv))&&p.honTe===S.bag.honTe&&p.charm===2&&p.busy===false;
    if(!good||bagKey(S)!==bk||S.logs.length!==nl){ allOk=false; bad+=` +${lv}:${JSON.stringify(p)}`; }
  }
  ok(allOk,`xem trước +0..+14: khớp equipEnhanceStep (tỉ lệ, hậu quả, đá, phí) và số đá / Hồn Tệ / bùa đang có, không đổi túi, không ghi log${bad}`);
  { const id=await mk("vu_khi_pham_khi",EQUIP_MAX_ENHANCE), p=await pv(id);
    ok(p&&p.enhance===EQUIP_MAX_ENHANCE&&p.to===null&&p.fail===null&&p.stone===null&&p.qty===0&&p.fee===0,`vượt trần: món +${EQUIP_MAX_ENHANCE} xem trước không có nấc kế (to / fail / đá null, phí 0): ${JSON.stringify(p)}`); }
  { const far=await mk("ao_pham_khi",2); await test(S,"goto",{x:ds.x,y:ds.y+16}); const bk=bagKey(S), p=await pv(far);
    ok(p?.to===3&&bagKey(S)===bk,"đứng xa Thợ rèn: vẫn xem trước được (chỉ đọc, bảng chỉ mở ở lò rèn)"); await test(S,"goto",{x:lr.x,y:lr.y+16}); }

  // ---- Nhánh lỗi: không trả lời, không đổi gì ----
  const A=await mk("vu_khi_pham_khi",3);
  await test(Q,"gear",{clear:true});
  const qr=await test(Q,"gear",{tpl:"vu_khi_pham_khi",enhance:2,ilvl:3}); await waitFor(()=>looseOf(Q).some(i=>i.id===qr?.id),1500);
  await test(S,"give",{code:RING_ITEM,years:100}); await waitFor(()=>loose().some(i=>i.code===RING_ITEM),1500);
  const ring=loose().find(i=>i.code===RING_ITEM)?.id;
  { const bk=bagKey(S), nl=S.logs.length;
    ok(sameRoom&&qr?.id&&(await pv(qr.id))===null,"món của người chơi khác (id có thật nhưng ở túi người khác): không trả lời");
    ok((await pv("khong-co-id"))===null&&(await pv(""))===null&&(await pv(7))===null,"id lạ / rỗng / dạng số: không trả lời");
    ok(ring&&(await pv(ring))===null,"id của vật phẩm không phải trang bị (hồn hoàn): không trả lời");
    const n=S.pvN; for(const v of [{toString:0},{x:{y:[1]}},[1],null,true,NaN,Infinity,1e308]) S.room.send("equipenhpreview",{id:v});
    S.room.send("equipenhpreview",null); S.room.send("equipenhpreview","x"); S.room.send("equipenhpreview",[1]); S.room.send("equipenhpreview");
    await sleep(500); ok(S.pvN===n&&bagKey(S)===bk&&S.logs.length===nl&&(await test(S,"ping"))?.enabled,"giá trị lạ (đối tượng, mảng, null, NaN, Infinity) ở id và cả thân tin: bỏ qua, phòng vẫn chạy, túi không đổi"); }

  // ---- Đang xử lý: busy=true khi lệnh cường hóa đang chờ trong chuỗi lưu, xem trước không chen vào ----
  await test(S,"enhroll",{r:0}); await give(stone(3),st(3).qty*2); await coin(1e6);
  { await test(S,"enhslow",{ms:700}); const n0=S.enhN; S.room.send("equipenh",{id:A,charm:false}); await sleep(150);
    const p=await pv(A); ok(p?.busy===true&&p.enhance===3&&find(A).enhance===3&&S.enhN===n0,`lệnh cường hóa đang xử lý: xem trước báo busy, món chưa đổi (${JSON.stringify(p)})`);
    await waitFor(()=>S.enhN>n0,3000); await test(S,"enhslow",{ms:0}); await sleep(200);
    const q=await pv(A); ok(S.enhLast?.ok===true&&q?.busy===false&&q.enhance===4&&q.to===5,`xong lệnh: busy về false, xem trước nấc kế +4 → +5 (${JSON.stringify(q)})`); }

  // ---- Nhánh đúng: xem trước khớp kết quả cường hóa thật ----
  { const run=async(lv,roll,charm)=>{
      const id=await mk("vu_khi_pham_khi",lv); await give(stone(lv),st(lv).qty); await give(EQUIP_CHARM,1); await coin(1e6); await test(S,"enhroll",{r:roll});
      const p=await pv(id), stones=have(stone(lv)), charms=have(EQUIP_CHARM), c0=S.bag.honTe, r=await enh(id,charm);
      return {id,p,r,dStone:stones-have(stone(lv)),dCoin:c0-S.bag.honTe,dCharm:charms-have(EQUIP_CHARM)}; };
    let x=await run(3,0,false);
    ok(x.r?.ok&&x.r.stone===x.p.stone&&x.r.qty===x.p.qty&&x.r.fee===x.p.fee&&x.dStone===x.p.qty&&x.dCoin===x.p.fee&&x.r.to===x.p.to&&find(x.id).enhance===x.p.to,
      `thắng: bảng xem trước (+${x.p?.enhance} → +${x.p?.to}, ${x.p?.qty} đá, phí ${x.p?.fee}) khớp lần cường hóa thật`);
    x=await run(11,99,false);
    ok(x.p?.fail.kind==="down"&&x.r&&!x.r.ok&&!x.r.destroyed&&x.r.to===x.p.enhance-1&&x.dStone===x.p.qty&&x.dCoin===x.p.fee&&x.dCharm===0,"thua nấc 'down': đúng hậu quả đã báo (tụt 1 cấp), đá và phí đã báo bị trừ, bùa không mất");
    x=await run(5,99,false);
    ok(x.p?.fail.kind==="keep"&&x.r&&!x.r.ok&&x.r.to===x.p.enhance&&find(x.id).enhance===x.p.enhance&&x.dStone===x.p.qty&&x.dCoin===x.p.fee,"thua nấc 'keep': giữ cấp như đã báo, vẫn mất đá và phí");
    x=await run(14,99,true);
    ok(x.p?.fail.kind==="destroy"&&x.r?.charmUsed&&!x.r.destroyed&&x.r.to===14&&x.dCharm===1&&x.dStone===x.p.qty&&x.dCoin===x.p.fee,"thua nấc 'destroy' có bùa: giữ +14 như đã báo, mất đúng 1 bùa");
    x=await run(14,99,false);
    ok(x.p?.fail.kind==="destroy"&&x.r?.destroyed&&!find(x.id)&&x.dCharm===0,"thua nấc 'destroy' không bùa: món bị phá hủy đúng như đã báo");
    ok(await pv(x.id)===null,"món đã bị phá hủy: xem trước không trả lời nữa");
    await test(S,"enhroll",{r:-1}); }
  // equipEnhance tự gọi lại xem trước trong warn: mỗi lần từ chối đúng một tin, không lặp.
  { const id=await mk("vu_khi_pham_khi",EQUIP_MAX_ENHANCE), bk=bagKey(S), l=S.logs.length, k=S.pvN, r=await enh(id);
    ok(r===null&&/tối đa/.test(S.logs.at(-1))&&S.logs.length===l+1&&bagKey(S)===bk&&S.pvN-k===1,`vượt trần: cường hóa bị từ chối, xem trước tự gửi lại đúng 1 tin (${S.pvN-k}), không lặp vô hạn`); }
  { const id=await mk("vu_khi_pham_khi",1); await coin(0); const l=S.logs.length, k=S.pvN; S.room.send("equipenh",{id,charm:false}); await waitFor(()=>S.logs.length>l,2000); await sleep(500);
    ok(/Không đủ/.test(S.logs.at(-1))&&S.pvN-k===1,`thiếu đá / phí: từ chối, xem trước tự gửi lại đúng 1 tin (${S.pvN-k})`); await coin(1e6); }
  { const id=await mk("ao_pham_khi",0); await give(stone(0),st(0).qty); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); S.room.send("equipgear",{id}); await waitFor(()=>S.gear?.items.some(g=>g.id===id),2000);
    const p=await pv(id); ok(p?.id===id&&p.to===1&&p.p===st(0).p,"món đang mặc: xem trước vẫn trả đúng nấc kế"); }

  // ---- Gọi dồn: bộ đếm token (#677) chặn, phòng vẫn chạy ----
  { const id=await mk("vu_khi_pham_khi",3), bk=bagKey(S), n=S.pvN; await test(S,"baglimit",{on:true}); const t0=Date.now();
    for(let k=0;k<150;k++) S.room.send("equipenhpreview",{id});
    await sleep(1500); const got=S.pvN-n, secs=(Date.now()-t0)/1000; await test(S,"baglimit",{on:false});
    ok(got>=1&&got<=BAG_MSG_BURST+BAG_MSG_RATE*secs+2&&bagKey(S)===bk&&(await test(S,"ping"))?.enabled,`150 lần xem trước dồn: server chỉ trả ${got} tin (≤ BAG_MSG_BURST ${BAG_MSG_BURST} + ${BAG_MSG_RATE}/giây), túi không đổi, phòng vẫn chạy`);
    const m=S.pvN; for(let k=0;k<40;k++) S.room.send("equipenhpreview",{id}); await waitFor(()=>S.pvN-m>=40,3000);
    ok(S.pvN-m===40&&bagKey(S)===bk,"tắt giới hạn: 40 lần xem trước dồn, mỗi lần một tin trả lời, không đổi túi"); }

  // ---- coreset: nhánh lỗi còn thiếu ----
  await test(S,"gear",{clear:true}); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); await coin(1e6); await test(S,"goto",{x:lr.x,y:lr.y+16});
  { const had=new Set(S.bag.items.map(i=>i.id));
    await test(S,"give",{code:CORE_ITEM,stars:2,set:"lam_ngan"}); await test(Q,"give",{code:CORE_ITEM,stars:2,set:"lam_ngan"});
    await waitFor(()=>looseOf(Q).some(i=>i.code===CORE_ITEM),1500);
    const c=S.bag.items.find(i=>!had.has(i.id)&&i.code===CORE_ITEM), qc=looseOf(Q).find(i=>i.code===CORE_ITEM);
    const cur=id=>S.bag.items.find(i=>i.id===id), fee=coreResetFee(2);
    const set=async(id,to,npc="lo_ren")=>{ const l=S.logs.length; S.room.send("coreset",{id,set:to,npc}); await waitFor(()=>S.logs.length>l,1200); await sleep(150); return S.logs.length>l?S.logs.at(-1):""; };
    ok(sameRoom&&!!c&&!!qc,"coreset: có hồn hạch 2★ của mình và của bot Q để thử");
    let bk=bagKey(S), t=await set(qc.id,"hao_thien"); ok(/Không có hồn hạch/.test(t)&&bagKey(S)===bk&&looseOf(Q).find(i=>i.id===qc.id)?.stats.set==="lam_ngan","hồn hạch của người khác: bị từ chối, không trừ Hồn Tệ, hồn hạch của họ giữ nguyên bộ");
    t=await set(ring,"hao_thien"); ok(/Không có hồn hạch/.test(t)&&bagKey(S)===bk,"id của vật phẩm không phải hồn hạch (hồn hoàn): bị từ chối");
    t=await set("","hao_thien"); ok(/Không có hồn hạch/.test(t)&&bagKey(S)===bk,"id rỗng: bị từ chối");
    const odd=[{toString:0},{x:{y:[1]}},[1],null,true,7,NaN,"","__proto__","constructor","toString"];
    for(const v of odd){ S.room.send("coreset",{id:c.id,set:v,npc:"lo_ren"}); S.room.send("coreset",{id:v,set:"hao_thien",npc:"lo_ren"}); }
    S.room.send("coreset",null); S.room.send("coreset","x"); S.room.send("coreset",[1]); S.room.send("coreset");
    await sleep(600); ok(bagKey(S)===bk&&cur(c.id).stats.set==="lam_ngan"&&(await test(S,"ping"))?.enabled,`${odd.length} giá trị lạ ở set / id (kể cả "__proto__", "constructor"): bị bỏ qua, bộ và Hồn Tệ giữ nguyên, phòng vẫn chạy`);
    await test(S,"goto",{x:ds.x,y:ds.y+16}); bk=bagKey(S);
    for(const v of [{toString:0},[1],null,7,true]) S.room.send("coreset",{id:c.id,set:"hao_thien",npc:v});
    S.room.send("coreset",{id:c.id,set:"hao_thien"}); await sleep(500);
    ok(bagKey(S)===bk&&cur(c.id).stats.set==="lam_ngan","NPC là giá trị lạ / thiếu, đứng xa Thợ rèn: coi như Thợ rèn gần nhất, bị từ chối vì xa, không đổi gì");
    await test(S,"goto",{x:lr.x,y:lr.y+16});
    await test(S,"hurt",{pct:1}); bk=bagKey(S); t=await set(c.id,"hao_thien");
    ok(/giao chiến/.test(t)&&bagKey(S)===bk&&cur(c.id).stats.set==="lam_ngan",`đang giao chiến: bị từ chối, không trừ phí (${t})`);
    await test(S,"rest",{s:TEAM_COMBAT_SECS+1});
    await coin(fee); t=await set(c.id,"hao_thien");
    ok(cur(c.id).stats.set==="hao_thien"&&S.bag.honTe===0&&/Đổi bộ/.test(t),`đúng bằng phí (${fee}): đổi được, Hồn Tệ về đúng 0 (${t})`);
    await coin(fee*5+3); const ht=S.bag.honTe; for(let k=0;k<12;k++) S.room.send("coreset",{id:c.id,set:"lam_ngan",npc:"lo_ren"});
    await waitFor(()=>cur(c.id).stats.set==="lam_ngan",2000); await sleep(600);
    ok(cur(c.id).stats.set==="lam_ngan"&&S.bag.honTe===ht-fee,`bấm dồn 12 lần cùng một bộ: chỉ trừ phí một lần (${ht} → ${S.bag.honTe})`); }
  }finally{ await S.room.leave().catch(()=>{}); await Q.room.leave().catch(()=>{}); }
}

/**
 * Chống gian lận khắc may mắn (#740, BOT_ONLY=luckrace; tài khoản riêng, túi riêng, không dùng chung trạng thái với bài khác): trong lúc `equipluck` đang chờ
 * DB (hook enhslow giữ lệnh trong chuỗi lưu) gửi tháo / mặc / đổi món / bỏ / phân giải / hợp thành: tất cả bị chặn (claimBusy + enhBusy), nên trần tổng
 * hai ô đang mặc (EQUIP_LUCK_MAX) không lách được và món đang khắc không đổi chỗ giữa chừng. Xong lệnh thì tháo / mặc lại được. Nhánh hoàn lại khi lỗi ghi DB
 * chưa có bài (không có hook làm hỏng ghi; xem docs/tech/chong-gian-lan-khac-may-man-tong-mon.md).
 */
export async function luckRaceTest(){
  console.log("[#740] Chống gian lận khắc may mắn: tháo / mặc giữa lúc chờ DB");
  const S=await bot("Luck race","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ console.log("  ⚠ bỏ qua luckrace (cần hook gear, give, coin, enhroll, enhslow): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
  const me=()=>S.room.state.players?.get(S.room.sessionId), loose=()=>looseOf(S);
  S.lucN=0; S.room.onMessage("equipluckd",()=>{ S.lucN++; }); S.room.onMessage("equipluckp",()=>{});
  S.travel=null; S.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>S.travel,4000);
  if(S.travel){ const t=S.travel; await S.room.leave(); await sleep(300); S.mapId=t.mapId; await enter(S,t.roomId??undefined); S.lucN=0; S.room.onMessage("equipluckd",()=>{ S.lucN++; }); S.room.onMessage("equipluckp",()=>{}); }
  await waitFor(()=>me()&&S.bag&&S.gear,4000);
  const lr=npcSpot("nac_dinh_thanh","lo_ren");
  const have=code=>loose().filter(i=>i.code===code).reduce((n,i)=>n+i.qty,0);
  const mk=async(tpl,luck)=>{ const r=await test(S,"gear",{tpl,enhance:0,ilvl:3,luck}); await waitFor(()=>loose().some(i=>i.id===r?.id),1500); return r?.id; };
  const find=id=>loose().find(i=>i.id===id)??S.gear?.items.find(g=>g.id===id);
  const luckOf=id=>parseEquip(find(id)?.stats)?.luck;
  const worn=()=>(S.gear?.items??[]).map(g=>g.id).sort().join(",");
  const wear=async id=>{ S.room.send("equipgear",{id}); await waitFor(()=>S.gear?.items.some(g=>g.id===id),2000); };
  await test(S,"gear",{clear:true}); await test(S,"goto",{x:lr.x,y:lr.y+16}); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); await test(S,"enhroll",{r:0});
  await test(S,"coin",{n:1e6}); await waitFor(()=>S.bag.honTe===1e6,1500);
  const W=await mk("vu_khi_pham_khi",EQUIP_LUCK_MAX-4), N=await mk("day_chuyen_pham_khi",3), B=await mk("vu_khi_tu_kim",EQUIP_LUCK_MAX-1), C=await mk("day_chuyen_tu_kim",EQUIP_LUCK_MAX-1);
  await test(S,"give",{code:EQUIP_SOUL,qty:5}); await waitFor(()=>have(EQUIP_SOUL)===5,2000);
  await wear(W); await wear(N);
  let g=await test(S,"stats"); const start=worn(), wornLuck0=g.gear.luck;
  ok(wornLuck0===EQUIP_LUCK_MAX-1,`mở bài: mặc vũ khí M${EQUIP_LUCK_MAX-4} + dây chuyền M3, tổng ${wornLuck0} = trần − 1`);

  // ---- Trong lúc equipluck chờ DB: mọi cách đổi món đang mặc / đang khắc đều bị chặn ----
  await test(S,"enhslow",{ms:700}); const n0=S.lucN;
  S.room.send("equipluck",{id:W}); await sleep(120);
  S.room.send("equipgear",{id:B});                  // đổi vũ khí khác (M cao) vào chỗ món đang khắc
  S.room.send("equipgear",{id:C});                  // đổi dây chuyền (M cao) để vượt trần tổng
  S.room.send("unequipgear",{slot:"vu_khi"});       // tháo chính món đang khắc
  S.room.send("unequipgear",{slot:"day_chuyen"});
  S.room.send("discard",{id:W}); S.room.send("discard",{id:B});
  S.room.send("equipsalvage",{ids:[B,C]});
  S.room.send("equipsynth",{main:B,sacrifice:[C,C]});
  await sleep(200);
  ok(worn()===start,"đang chờ DB: tháo / mặc / đổi món đều bị chặn, hai ô mặc không đổi");
  await waitFor(()=>S.lucN>n0,3000); await sleep(500); await test(S,"enhslow",{ms:0});
  g=await test(S,"stats");
  ok(S.lucN===n0+1&&luckOf(W)===EQUIP_LUCK_MAX-3&&worn()===start&&g.gear.luck===EQUIP_LUCK_MAX&&have(EQUIP_SOUL)===4,`xong lệnh: W M${luckOf(W)}, tổng ${g.gear.luck} ≤ trần ${EQUIP_LUCK_MAX}, đúng 1 Thần Hồn, ô mặc giữ nguyên`);
  ok(!!find(B)&&!!find(C)&&luckOf(B)===EQUIP_LUCK_MAX-1&&luckOf(C)===EQUIP_LUCK_MAX-1&&!!find(W),"bỏ / phân giải / hợp thành lúc chờ không xóa món nào, không đổi may mắn món trong túi");
  // Đã chạm trần: khắc tiếp món đang mặc bị chặn, nhưng chặn thoáng qua đã nhả: mặc / tháo lại được.
  const l0=S.logs.length; S.room.send("equipluck",{id:W}); await waitFor(()=>S.logs.length>l0,2000); await sleep(150);
  ok(/Tổng may mắn hai ô đang mặc/.test(S.logs.at(-1))&&luckOf(W)===EQUIP_LUCK_MAX-3&&have(EQUIP_SOUL)===4,`tổng đã chạm trần: khắc tiếp bị chặn, giữ Thần Hồn (${S.logs.at(-1)})`);
  await wear(C); ok(worn().includes(C)&&!worn().includes(N),"sau khi xong lệnh: mặc món khác lại được (cờ chặn đã nhả)");
  await test(S,"gear",{clear:true}); await test(S,"enhroll",{r:-1});
  }finally{ await S.room.leave().catch(()=>{}); }
}

/**
 * Nhánh hoàn lại khi ghi DB lỗi (#797, BOT_ONLY=savefail; tài khoản riêng): hook `savefail {n}` (chỉ GAME_TEST, db.ts) ép n lần ghi túi / tông kế tiếp lỗi.
 * equipluck (món trong túi và món đang mặc), equipenh (thành công; nấc phá hủy trên món đang mặc), coreset (#699): lỗi ghi thì Thần Hồn / đá / phí về đúng,
 * `it.stats` / cấp về đúng, món không nhân / mất; thử lại không hook thì trừ đúng MỘT lần. coreset ghi qua write (không hoàn lại trong RAM, túi bẩn nên lần ghi
 * kế persist): vào lại phòng phải thấy bộ mới và phí trừ đúng một lần. setTong: DB giữ nguyên khi ghi lỗi (hook GM `tong set`; đường tongAction thật: #796).
 */
export async function saveFailTest(){
  console.log("[#797] Hoàn lại khi ghi DB lỗi: luck / enhance / coreset / tông");
  const S=await bot("Save fail","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  if(!(await test(S,"ping"))?.enabled){ console.log("  ⚠ bỏ qua savefail (cần hook gear, give, coin, enhroll, savefail): bật server bằng GAME_TEST=1"); await S.room.leave(); return; }
  try{
  const me=()=>S.room.state.players?.get(S.room.sessionId), loose=()=>looseOf(S);
  const watch=()=>{ S.lucN=0; S.enhN=0; S.room.onMessage("equipluckd",()=>{ S.lucN++; }); S.room.onMessage("equipluckp",()=>{}); S.room.onMessage("equipenhd",()=>{ S.enhN++; }); S.room.onMessage("equipenhp",()=>{}); };
  async function rejoin(){ await S.room.leave(); await sleep(400); S.mapId=(await post("/api/me",{token:S.token})).mapId; S.bag=null; S.gear=null; await enter(S); watch(); await waitFor(()=>me()&&S.bag&&S.gear,4000); }
  watch();
  S.travel=null; S.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>S.travel,4000);
  if(S.travel){ const t=S.travel; await S.room.leave(); await sleep(300); S.mapId=t.mapId; await enter(S,t.roomId??undefined); watch(); }
  await waitFor(()=>me()&&S.bag&&S.gear,4000);
  const lr=npcSpot("nac_dinh_thanh","lo_ren");
  const have=code=>loose().filter(i=>i.code===code).reduce((n,i)=>n+i.qty,0);
  const give=async(code,qty)=>{ const n=have(code); await test(S,"give",{code,qty}); await waitFor(()=>have(code)===n+qty,2000); };
  const coin=async n=>{ await test(S,"coin",{n}); await waitFor(()=>S.bag.honTe===n,1500); };
  const mk=async(tpl,enhance,luck=0)=>{ const r=await test(S,"gear",{tpl,enhance,ilvl:3,luck}); await waitFor(()=>loose().some(i=>i.id===r?.id),1500); return r?.id; };
  const find=id=>loose().find(i=>i.id===id)??S.gear?.items.find(g=>g.id===id);
  const copies=id=>loose().filter(i=>i.id===id).length+(S.gear?.items.filter(g=>g.id===id).length??0);
  const luckOf=id=>parseEquip(find(id)?.stats)?.luck;
  const wear=async id=>{ S.room.send("equipgear",{id}); await waitFor(()=>S.gear?.items.some(g=>g.id===id),2000); };
  /** Ép 1 lần ghi lỗi rồi chạy `send`; chờ log "Không lưu được" (nhánh hoàn lại đã chạy), trả true nếu thấy. */
  async function failed(send){ await sleep(300); const l=S.logs.length; await test(S,"savefail",{n:1,only:"bag"}); send(); const g=await waitFor(()=>S.logs.slice(l).some(x=>/Không lưu được/.test(x)),3000); await sleep(400); return g; }
  async function done(send,key){ await sleep(300); const k=S[key]; send(); await waitFor(()=>S[key]>k,3000); await sleep(300); }
  await test(S,"gear",{clear:true}); await test(S,"goto",{x:lr.x,y:lr.y+16}); await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); await test(S,"enhroll",{r:0});
  await coin(1e6); await give(EQUIP_SOUL,6);

  // ---- equipluck: món trong túi, rồi món đang mặc ----
  const A=await mk("vu_khi_pham_khi",0,0), B=await mk("day_chuyen_pham_khi",0,0); await wear(B);
  for(const [id,where] of [[A,"trong túi"],[B,"đang mặc"]]){
    const soul=have(EQUIP_SOUL), n0=S.lucN, g0=(await test(S,"stats")).gear.luck;
    ok(await failed(()=>S.room.send("equipluck",{id})),`equipluck ${where}: ghi lỗi thì báo "Không lưu được" (nhánh hoàn lại chạy)`);
    const g1=(await test(S,"stats")).gear.luck;
    ok(luckOf(id)===0&&have(EQUIP_SOUL)===soul&&copies(id)===1&&g1===g0&&S.lucN===n0,`equipluck ${where}: ghi lỗi hoàn lại Thần Hồn (${have(EQUIP_SOUL)}/${soul}), may mắn về M0, tổng ô mặc ${g1}/${g0}, món không nhân / mất, không báo thành công`);
    await done(()=>S.room.send("equipluck",{id}),"lucN");
    ok(luckOf(id)===1&&have(EQUIP_SOUL)===soul-1&&copies(id)===1,`equipluck ${where}: thử lại không lỗi → M1, trừ đúng 1 Thần Hồn (${have(EQUIP_SOUL)}/${soul-1})`);
  }

  // ---- equipenh: thành công (đá + phí hoàn), nấc phá hủy trên món đang mặc (món về đúng ô) ----
  const stone=l=>EQUIP_STONES[equipEnhanceStep(l).stone].id, stp=l=>equipEnhanceStep(l);
  { const lv=0, st=stp(lv), E=await mk("vu_khi_pham_khi",lv); await give(stone(lv),st.qty+1); await coin(st.fee+1234);
    const stones=have(stone(lv)), ht=S.bag.honTe;
    ok(await failed(()=>S.room.send("equipenh",{id:E})),"equipenh: ghi lỗi thì báo \"Không lưu được\"");
    ok(find(E)?.enhance===lv&&have(stone(lv))===stones&&S.bag.honTe===ht&&copies(E)===1&&S.enhN===0,`equipenh thành công bị ghi lỗi: đá (${have(stone(lv))}/${stones}) và Hồn Tệ (${S.bag.honTe}/${ht}) hoàn lại, món về +${lv}, không nhân / mất`);
    await done(()=>S.room.send("equipenh",{id:E,charm:false}),"enhN");
    ok(find(E)?.enhance===lv+1&&have(stone(lv))===stones-st.qty&&S.bag.honTe===ht-st.fee,`equipenh thử lại: +${lv+1}, trừ đúng ${st.qty} đá và phí ${st.fee} một lần`); }
  { const lv=[...Array(EQUIP_MAX_ENHANCE).keys()].find(l=>stp(l)?.fail.kind==="destroy"), st=stp(lv);
    ok(lv!==undefined,`có nấc phá hủy khi thất bại (+${lv}) để thử hoàn lại món`);
    await test(S,"enhroll",{r:100});
    const D=await mk("vu_khi_pham_khi",lv); await wear(D); await give(stone(lv),st.qty); await coin(st.fee+99);
    const stones=have(stone(lv)), ht=S.bag.honTe, slot=S.gear.items.find(g=>g.id===D)?.equipSlot;
    ok(await failed(()=>S.room.send("equipenh",{id:D,charm:false})),"equipenh nấc phá hủy: ghi lỗi thì báo \"Không lưu được\"");
    const back=S.gear.items.find(g=>g.id===D);
    ok(!!back&&back.enhance===lv&&back.equipSlot===slot&&copies(D)===1&&have(stone(lv))===stones&&S.bag.honTe===ht,`món suýt bị phá hủy được hoàn lại đúng ô mặc, +${lv}, đá / phí về đủ, không nhân / mất`);
    await test(S,"enhroll",{r:0}); }

  // ---- coreset (#699): ghi qua write, túi bẩn nên lần ghi kế persist ----
  await test(S,"rest",{s:TEAM_COMBAT_SECS+1}); await test(S,"goto",{x:lr.x,y:lr.y+16});
  const fee=coreResetFee(2); await coin(fee+500);
  const had=new Set(loose().map(i=>i.id)); await test(S,"give",{code:CORE_ITEM,stars:2,set:"lam_ngan"}); await waitFor(()=>loose().some(i=>!had.has(i.id)&&i.code===CORE_ITEM),1500);
  const C=loose().find(i=>!had.has(i.id)&&i.code===CORE_ITEM)?.id;
  ok(!!C,"coreset: có hồn hạch 2★ Lam Ngân để thử");
  await sleep(300); await test(S,"savefail",{n:1,only:"bag"}); { const l=S.logs.length; S.room.send("coreset",{id:C,set:"hao_thien",npc:"lo_ren"}); await waitFor(()=>S.logs.length>l,2000); await sleep(300); }
  // coreset không log khi ghi lỗi: chứng minh lượt ép đã bị lần ghi của coreset tiêu thụ (còn 0) bằng `left` của hook.
  { let left=1; for(let k=0;k<20&&left>0;k++){ left=(await test(S,"savefail",{n:1,only:"bag"})).left; if(left>0) await sleep(200); } await test(S,"savefail",{n:0});
    ok(left===0,`coreset: lần ghi bị ép lỗi đã chạy (lượt ép còn ${left}), RAM đã đổi bộ và trừ phí (${S.bag.honTe})`); }
  ok(copies(C)===1&&S.bag.honTe===500&&find(C)?.stats?.set==="hao_thien","coreset khi ghi lỗi: RAM giữ bộ mới và Hồn Tệ 500 (phí trừ một lần), món không nhân / mất; túi bẩn chờ lần ghi kế");

  // ---- setTong: ghi lỗi thì DB giữ nguyên ----
  const H=TONG_MON[0];
  await test(S,"tong",{set:H.id}); await sleep(500);
  await test(S,"savefail",{n:1,only:"tong"}); const tg=await test(S,"tong",{set:""}); await sleep(500); const tl=(await test(S,"savefail",{n:0})).left; ok(tl===0,`setTong: lần ghi bị ép lỗi đã chạy (lượt ép còn ${tl})`);

  // ---- vào lại phòng: đọc lại từ DB ----
  const hte=S.bag.honTe; await rejoin();
  const core=loose().find(i=>i.id===C);
  ok(core?.stats?.set==="hao_thien"&&S.bag.honTe===hte&&hte===500,`vào lại: hồn hạch đổi bộ đúng một lần (${core?.stats?.set}), Hồn Tệ ${S.bag.honTe} = 500 (phí ${fee} trừ đúng một lần)`);
  ok(luckOf(A)===1&&luckOf(B)===1&&copies(A)===1&&copies(B)===1,"vào lại: may mắn M1 của cả hai món đã persist đúng một nấc");
  const tn=await test(S,"tong",{}); ok(tg?.tong===null&&tn.tong===H.id,`setTong ghi lỗi: RAM đã rời (${tg?.tong}) nhưng DB giữ nguyên tông cũ sau khi vào lại: ${tn.tong} (kỳ vọng ${H.id})`);
  await test(S,"tong",{set:""}); await sleep(400); await test(S,"gear",{clear:true}); await test(S,"enhroll",{r:-1});
  }finally{ await S.room.leave().catch(()=>{}); }
}

/**
 * Chống gian lận mua lại nhiều tiến trình / kênh (#742, BOT_ONLY=buybackproc; tài khoản riêng "Mua lai", mỗi vòng một hồn hoàn): bán, đổi kênh NGAY (kênh mới có thể ở
 * tiến trình khác; danh sách mua lại đúng ở presence), rồi mua lại ba lần từ phiên mới, hai lần từ phiên cũ đang đi cổng và một lần từ phiên thứ hai của cùng tài khoản.
 * Bất biến: số hồn hoàn không vượt lúc đầu, Hồn Tệ không vượt lúc đầu (mua lại đúng giá đã bán), id không trùng; món có thể "mất cơ hội mua lại"
 * (danh sách chưa kịp sang) nhưng không nhân đồ / tiền. Cần CHANNEL_MAX=3 (--env CHANNEL_MAX=4; khác 2 để không chạy channelTest), tốt nhất `--procs 2 --pg`.
 * Báo cáo: docs/tech/soat-gian-lan-mua-lai-ban-be-chat.md.
 */
export async function buybackProcTest(){
  console.log("[#742] Mua lại nhiều tiến trình / kênh: không nhân đồ, không nhân tiền");
  const tn=npcSpot("nac_dinh_thanh","thuong_nhan");
  const T=async(b,op,extra={})=>{ b.test=null; b.room.send("test",{op,...extra}); await waitFor(()=>b.test,2000); await sleep(80); return b.test; };
  const F=[]; for(let i=1;i<=4;i++) F.push(await bot(`Mua lai F${i}`,"u_minh_linh_mieu",{sex:0,hair:1,hairCol:1,outfitCol:1}));
  const M=await bot("Mua lai M","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2});
  const all=[...F,M], bye=b=>b.room.connection?.isOpen?b.room.leave().catch(()=>{}):null;
  if(!(await T(M,"ping"))?.enabled){ console.log("  ⚠ bỏ qua buybackproc (cần hook warp, goto, coin, give, chan): bật server bằng GAME_TEST=1"); for(const b of all) await bye(b); return; }
  const meOf=b=>b.room.state.players?.get(b.room.sessionId), rings=b=>looseOf(b).filter(i=>i.code===RING_ITEM);
  const warp=async b=>{ b.travel=null; await T(b,"warp",{mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>b.travel,4000); const t=b.travel; await b.room.leave(); await sleep(250); b.mapId=t.mapId; await enter(b,t.roomId??undefined); await waitFor(()=>meOf(b)&&b.bag,3000); };
  const follow=async b=>{ const t=b.travel; if(b.room.connection?.isOpen) await b.room.leave(); await sleep(150); b.mapId=t.mapId; await enter(b,t.roomId??undefined); await waitFor(()=>meOf(b)&&b.bag,3000); };
  try{
  // Bốn người lấp kênh 1 (CHANNEL_MAX=4), F4 vào sau ở kênh 2: M đổi sang kênh 2 (còn chỗ cho cả phiên thứ hai) và quay về được.
  for(const b of [F[0],F[1],F[2],M,F[3]]) await warp(b);
  ok(M.room.state.mapId==="nac_dinh_thanh"&&F[3].room.roomId!==M.room.roomId&&F[0].room.roomId===M.room.roomId,`M cùng kênh ${M.room.state.channel} với F1..F3; F4 ở kênh ${F[3].room.state.channel} (phòng khác)`);
  await T(M,"coin",{n:1e6}); await T(M,"goto",{x:tn.x,y:tn.y+16}); await T(M,"rest",{s:TEAM_COMBAT_SECS+1});
  let dupes=0, lost=0, done=0;
  for(const [k,delay] of [[0,0],[1,40],[2,150]]){
    await T(M,"give",{code:RING_ITEM,qty:1,years:10}); await waitFor(()=>rings(M).length>=1,2000);
    const it=rings(M)[0]; if(!it){ ok(false,`vòng ${k}: không cấp được hồn hoàn thử (${M.logs.at(-1)})`); continue; }
    const r0=rings(M).length, c0=M.bag.honTe, price=sellPrice(it);
    M.room.send("sell",{id:it.id}); await sleep(delay);
    // Khóa kênh đích sau lần đi cổng / đổi kênh chỉ nằm trong RAM của tiến trình gốc (không ở presence): chờ hết CHANNEL_CD để khóa cũ không chặn nhầm lần vào kế tiếp (xem báo cáo, mục 1c).
    await sleep((CHANNEL_CD+1)*1000); await T(M,"chan",{reset:1}); await T(M,"rest",{s:TEAM_COMBAT_SECS+1});
    M.travel=null; const old=M.room; M.room.send("channel",{ch:2});
    if(!(await waitFor(()=>M.travel,3000))){ console.log(`    vòng ${k}: chưa đổi được kênh (${M.logs.at(-1)})`); continue; }
    console.log(`    vòng ${k}: travel ${JSON.stringify(M.travel)} phòng cũ ${old.roomId}, M kênh ${M.room.state.channel}, F4 ${F[3].room.roomId}, log "${M.logs.at(-1)}"`);
    const key=()=>M.bag?.buyback?.[0]?.key, stale=key();
    // Phiên cũ còn mở trong lúc đang đi cổng: mua lại bị chặn (d.travelling).
    if(stale){ old.send("buyback",{key:stale}); old.send("buyback",{key:stale}); }
    await follow(M); await sleep(200);
    // Phiên thứ hai của CÙNG tài khoản vào đúng phòng mới ngay sau khi phiên này gửi mua lại (đá phiên cũ khi lệnh còn đang chờ presence / DB).
    const k1=key(), room2=M.room.roomId;
    if(k1){ for(let n=0;n<3;n++) M.room.send("buyback",{key:k1}); await sleep(delay); } else lost++;
    try{ M.bag=null; await enter(M,room2); await waitFor(()=>meOf(M)&&M.bag,4000); }catch(e){ console.log(`    vòng ${k}: phiên thứ hai không vào được (${String(e?.message??e).slice(0,70)})`); }
    await sleep(600);
    if(!M.bag){ ok(false,`vòng ${k}: phiên thứ hai không nhận được túi: dừng bài`); break; }
    const r1=rings(M).length, c1=M.bag.honTe, ids=new Set(rings(M).map(i=>i.id));
    const dup=r1>r0||c1>c0+(r0-r1)*price||ids.size!==r1; // vượt giá trị đã bán = nhân đồ / tiền
    if(dup) dupes++; done++;
    ok(!dup&&((r1===r0&&c1===c0)||(r1===r0-1&&c1===c0+price)),`vòng ${k} (trễ ${delay} ms): hồn hoàn ${r0} → ${r1}, Hồn Tệ ${c0} → ${c1}, giá ${price}, khóa mua lại ${k1?"sang kịp":"chưa sang kịp"}`);
    // Quay về kênh 1 (không tấn công) cho vòng sau.
    await sleep((CHANNEL_CD+1)*1000); await T(M,"chan",{reset:1}); await T(M,"rest",{s:TEAM_COMBAT_SECS+1}); M.travel=null; M.room.send("channel",{ch:1});
    if(await waitFor(()=>M.travel,3000)) await follow(M); else console.log(`    vòng ${k}: chưa quay về được kênh 1 (${M.logs.at(-1)})`);
    await T(M,"goto",{x:tn.x,y:tn.y+16});
  }
  // Rời game rồi vào lại: bản lưu DB khớp bản trong RAM; danh sách mua lại bị xóa khi rời game.
  const r2=rings(M).length, c2=M.bag?.honTe;
  await M.room.leave(); await sleep(500); M.bag=null; { const pick=await post("/api/channel",{token:M.token}); M.mapId=pick.mapId; await enter(M,pick.roomId??undefined); } await waitFor(()=>meOf(M)&&M.bag,3000);
  ok(rings(M).length===r2&&M.bag.honTe===c2&&!(M.bag.buyback?.length),`vào lại: hồn hoàn ${rings(M).length}, Hồn Tệ ${M.bag.honTe} khớp lúc rời; danh sách mua lại rỗng (${M.bag.buyback?.length??0})`);
  ok(done>0&&dupes===0,`${done} vòng: không vòng nào nhân đồ / tiền (${lost} vòng danh sách mua lại chưa kịp sang phòng mới)`);
  }finally{ for(const b of all) await bye(b); }
}

/**
 * Chống gian lận bạn bè / chat (#742, BOT_ONLY=socialaudit; tài khoản riêng "Soat ..."): (1) friends.add dồn tên lạ chỉ tra DB tối đa FRIEND_BURST lần (phần còn lại bị
 * friendCheck chặn trước khi tra); (2) phản hồi dò tên (có / không có hồn sư; tin riêng không phân biệt ngoại tuyến với không tồn tại); (3) tin chat có ký tự điều
 * khiển / định hướng / độ rộng bằng 0; (4) tài khoản đặt tên "Hệ thống" / tin người chơi không có cờ `sys` (#827); (5) chat tông khi chưa có tông.
 * Báo cáo: docs/tech/soat-gian-lan-mua-lai-ban-be-chat.md.
 */
export async function socialAuditTest(){
  console.log("[#742] Bạn bè / chat: tra DB dồn, dò tên, ký tự lạ, giả hệ thống");
  const T=async(b,op,extra={})=>{ b.test=null; b.room.send("test",{op,...extra}); await waitFor(()=>b.test,2000); await sleep(80); return b.test; };
  const A=await bot("Soat A","u_minh_linh_mieu",{sex:1,hair:0,hairCol:1,outfitCol:2}), O=await bot("Soat O","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:1,outfitCol:1});
  const off=await bot("Soat Off","u_minh_linh_mieu",{sex:1,hair:1,hairCol:0,outfitCol:3});
  if(!(await T(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua socialaudit (cần hook chat / friend rlreset): bật server bằng GAME_TEST=1"); for(const b of [A,O,off]) await b.room.leave().catch(()=>{}); return; }
  await off.room.leave(); await sleep(400); // đã thức tỉnh, nay ngoại tuyến
  try{
  const said=async(b,type,msg,w=700)=>{ const l=b.logs.length; b.room.send(type,msg); await sleep(w); return b.logs.slice(l).join(" | "); };
  // ---- (1) friends.add dồn: tối đa FRIEND_BURST lần tra DB, phần còn lại bị chặn trước khi tra ----
  await T(A,"friend",{fop:"rlreset"});
  const l0=A.logs.length; for(let i=0;i<40;i++) A.room.send("friend",{op:"add",name:`Khong Co ${RUN} ${i}`}); await sleep(2500);
  const lg=A.logs.slice(l0), notFound=lg.filter(x=>/Không có hồn sư nào tên/.test(x)).length, fast=lg.filter(x=>/quá nhanh/.test(x)).length;
  ok(notFound>=10&&notFound<=11&&fast>=29,`40 tên lạ dồn: ${notFound} lần tra DB trả "không có hồn sư" (burst 10 + hồi 1/giây), ${fast} lần bị chặn "quá nhanh" trước khi tra`);
  // ---- (2) dò tên: tên có thật / không có phân biệt được (đã biết, giới hạn bởi friendCheck); tin riêng không lộ tài khoản ngoại tuyến ----
  await T(A,"friend",{fop:"rlreset"});
  const exists=await said(A,"friend",{op:"add",name:off.name.toUpperCase()}), none=await said(A,"friend",{op:"add",name:`Khong Co ${RUN} z`});
  ok(!/Không có hồn sư/.test(exists)&&/Không có hồn sư/.test(none),`dò tên: tên có thật (ngoại tuyến) "${exists||"thêm im lặng"}" khác tên không có "${none}"`);
  const w1=await said(A,"chat",{text:"alo",ch:"whisper",to:off.name}), w2=await said(A,"chat",{text:"alo",ch:"whisper",to:`Khong Co ${RUN} y`});
  ok(/không trong game/.test(w1)&&w1.replace(off.name,"X")===w2.replace(`Khong Co ${RUN} y`,"X"),`tin riêng: tài khoản ngoại tuyến và tên không tồn tại cùng một câu trả lời (${w1})`);
  // ---- (3) ký tự lạ trong chat: server chỉ gộp khoảng trắng; ghi lại cái gì tới người nhận ----
  await T(A,"chat",{cop:"rlreset"});
  const BAD_CTRL=/[\u0000-\u0008\u000b-\u001f\u007f]/, BAD_BIDI=/[\u202a-\u202e\u2066-\u2069]/;
  const probes=[["nul",`a\u0000b ${RUN}`],["rlo",`\u202eevil ${RUN}`],["zw",`\u200b\u200b\u200b`],["bel",`b\u0007\u001b[31m ${RUN}`],["nl",`d1\n\n\td2 ${RUN}`],["emoji","😀".repeat(60)]];
  const got={}; for(const [n,txt] of probes){ O.chats.length=0; A.room.send("chat",{text:txt}); await sleep(450); got[n]=O.chats.find(m=>m.name===A.name)?.text; await sleep(250); }
  console.log(`    nhận được: ${Object.entries(got).map(([k,v])=>`${k}=${v===undefined?"(bị bỏ)":JSON.stringify(v).slice(0,24)}`).join(" ")}`);
  O.chats.length=0; A.room.send("chat",{text:`sys ${RUN}`}); await sleep(500);
  const pm=O.chats.find(m=>m.text===`sys ${RUN}`);
  ok(pm!==undefined&&pm.sys===undefined,"tin người chơi tới nơi và không mang cờ sys (#827): client không tô như tin hệ thống");
  ok(got.nl===`d1 d2 ${RUN}`,"xuống dòng / tab gộp thành một dấu cách");
  ok(got.emoji!==undefined,"tin 60 emoji (120 đơn vị) tới nơi, không bị cắt giữa cặp thay thế");
  ok(got.zw===undefined,"tin toàn ký tự độ rộng 0 bị bỏ như tin rỗng, không thành dòng chat trống (#817)");
  ok([got.nul,got.bel].every(t=>t!==undefined&&!BAD_CTRL.test(t))&&got.rlo!==undefined&&!BAD_BIDI.test(got.rlo),"ký tự điều khiển / đổi chiều văn bản bị bỏ trước khi tới người khác, phần chữ còn lại vẫn tới (#817)");
  // ---- (5) chat tông khi chưa có tông ----
  await T(A,"tong",{set:null}); O.chats.length=0;
  ok(/chưa thuộc tông/.test(await said(A,"chat",{text:`tong ${RUN}`,ch:"tong"}))&&!O.chats.some(m=>m.text===`tong ${RUN}`),"chat tông khi chưa có tông: báo riêng, không phát cho ai");
  }finally{ for(const b of [A,O]) await b.room.leave().catch(()=>{}); }
  // ---- (4) tên "Hệ thống": tài khoản đặt tên trùng tên tin hệ thống ----
  const name="Hệ thống", l=await post("/api/login",{name,password:PASS});
  // Chỉ coi là đạt khi server từ chối TÊN (400). 401 (tài khoản từ lượt chạy trước, mật khẩu ngẫu nhiên khác) / 429 / lỗi khác: bỏ qua, không kết luận.
  if(l.status===400){ ok(true,`server từ chối tên "${name}" (${l.error}): không giả được tin hệ thống`); return; }
  if(!l.token){ console.log(`  ⚠ bỏ qua kiểm tên "${name}" (đăng nhập ${l.status}: tài khoản đã có từ lượt trước hoặc hết lượt tạo theo IP); chạy lại trên DB sạch (bot:local) để kiểm #818`); return; }
  if(!l.looks?.chosen) await post("/api/looks",{token:l.token,sex:0,hair:1,hairCol:1,outfitCol:1});
  if(!l.character) await post("/api/awaken",{token:l.token,vohon:"u_minh_linh_mieu"});
  const me=await post("/api/me",{token:l.token}), SP={name,token:l.token,logs:[],owned:null,ownedMsgs:0,looks:me.looks,mapId:me.mapId};
  await enter(SP);
  const V=await bot("Soat V","u_minh_linh_mieu",{sex:0,hair:0,hairCol:2,outfitCol:2});
  try{
    await sleep(300); V.chats.length=0; SP.room.send("chat",{text:`Bảo trì, hãy nhập lại mật khẩu ${RUN}`}); await sleep(700);
    const seen=V.chats.find(m=>m.text.includes(RUN));
    ok(seen!==undefined&&seen.sys!==true,"tài khoản cũ tên \"Hệ thống\" (tạo trước khi có tên cấm) không giả được tin hệ thống trong chat bản đồ");
  }finally{ await SP.room.leave().catch(()=>{}); await V.room.leave().catch(()=>{}); }
}

/**
 * Chạy dài trang bị hồn sư (E7 #418; BOT_ONLY=equipsoak, không chạy trong bot đầy đủ): ES_N bot (mặc định 20) đứng quanh Thợ rèn ở
 * Nạc Định Thành, mỗi bot mặc đủ 10 ô rồi lặp ES_SECS giây (mặc định 120): cường hóa (kể cả dùng bùa), hợp thành 3 → 1, phân giải nhiều món,
 * đổi món đang mặc, thỉnh thoảng thoát và vào lại (lưu / đọc lại trang bị). Cần server GAME_TEST=1, nên bật PERF_LOG=1:
 *   npm run bot:local -- --only equipsoak --env PERF_LOG=1 [--pg]    (ES_N, ES_SECS, ES_SAMPLE đặt bằng biến môi trường của shell)
 * In mỗi ES_SAMPLE giây (mặc định 15) một dòng: tick / bản vá của phòng, RSS và heap của server; cuối lượt: số lệnh, lỗi, độ trễ p50 / p95 của từng
 * loại lệnh, so nửa đầu với nửa sau (chậm dần / phình bộ nhớ), kiểm Hồn Tệ không âm, id không trùng, số món mặc sau khi vào lại.
 */
export async function equipSoak(){
  const N=Math.max(1,Number(process.env.ES_N)||20), SECS=Math.max(10,Number(process.env.ES_SECS)||120), SAMPLE=Math.max(3,Number(process.env.ES_SAMPLE)||15);
  console.log(`[E7 #418] Chạy dài trang bị: ${N} bot × ${SECS} giây (cường hóa, hợp thành, phân giải, mặc / tháo, vào lại)`);
  const SLOTS=SD.EQUIP_SLOTS.map(s=>s.id), TIERS=SD.EQUIP_TIERS.map(t=>t.id);
  const B=[]; for(let i=0;i<N;i++) B.push(await bot(`Soak TB ${i}`,AWAKEN_CHOICES[i%AWAKEN_CHOICES.length].id,{sex:i%2,hair:i%4,hairCol:i%5,outfitCol:i%6}));
  const O=await bot("Soak TB obs","u_minh_linh_mieu",{sex:0,hair:0,hairCol:0,outfitCol:0}), H=B[0], mo=b=>b.room.state.players?.get(b.room.sessionId);
  try{
    if(!(await test(H,"ping"))?.enabled){ console.log("  ⚠ bỏ qua: bật server bằng GAME_TEST=1"); return; }
    const lr=npcSpot("nac_dinh_thanh","lo_ren"), lat={enh:[],syn:[],salv:[],wear:[]}, cnt={enh:0,syn:0,salv:0,wear:0,rejoin:0,fail:0,destroyed:0,charm:0,synOk:0};
    const watch=b=>{ b.enhN=0; b.synN=0; b.salvN=0;
      b.room.onMessage("equipenhd",m=>{ b.enhLast=m; b.enhN++; }); b.room.onMessage("equipenhp",()=>{});
      b.room.onMessage("equipsynd",m=>{ b.synLast=m; b.synN++; }); b.room.onMessage("equipsalvd",m=>{ b.salvLast=m; b.salvN++; }); };
    const rejoin=async b=>{ await b.room.leave(); await sleep(150+Math.random()*250); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); watch(b); await waitFor(()=>mo(b)&&b.bag&&b.gear,4000); };
    const loose=b=>looseOf(b), slotRnd=()=>SLOTS[Math.floor(Math.random()*SLOTS.length)];
    const SPOTS=[[0,16],[8,16],[-8,16],[0,24],[12,20],[-12,20],[16,12],[-16,12]]; // chỗ đứng quanh Thợ rèn (NPC_RANGE 40); bot thử lần lượt tới khi đứng được và còn trong tầm
    const spot=async(b,bi)=>{ for(let k=0;k<SPOTS.length;k++){ const [dx,dy]=SPOTS[(bi+k)%SPOTS.length]; await test(b,"goto",{x:lr.x+dx,y:lr.y+dy}); const m=mo(b); if(m&&Math.hypot(m.x-lr.x,m.y-lr.y)<SD.NPC_RANGE-6) return true; } return false; };
    const why=new Map(), fail=(k,b,e)=>{ cnt.fail++; const m=`${k}: ${(e??b?.logs?.at(-1)??"(không có log)")}`.replace(/[0-9]+/g,"#").slice(0,90); why.set(m,(why.get(m)??0)+1); };
    const mk=async(b,tpl,more={})=>{ const r=await test(b,"gear",{tpl,ilvl:1+Math.floor(Math.random()*7),...more}); if(!r?.id){ fail("gear",b,r?.error??"không có trả lời"); return null; } await waitFor(()=>loose(b).some(i=>i.id===r.id),2000); return r.id; };
    const timed=async(kind,fn)=>{ const t=Date.now(), res=await fn(); lat[kind].push(Date.now()-t); cnt[kind]++; return res; };
    // Bot quan sát đứng cùng kênh Nạc Định Thành để hook perf đọc đúng phòng đang chịu tải.
    O.travel=null; O.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>O.travel,4000);
    if(O.travel){ const t=O.travel; await O.room.leave(); await sleep(200); O.mapId=t.mapId; await enter(O,t.roomId??undefined); }
    // Chuẩn bị: mỗi bot tới Nạc Định Thành, đứng cạnh Thợ rèn, mặc đủ 10 ô (bậc theo số thứ tự bot) và có sẵn Hồn Tệ, đá, bùa.
    await Promise.all(B.map(async(b,bi)=>{
      b.travel=null; b.room.send("test",{op:"warp",mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>b.travel,4000);
      if(b.travel){ const t=b.travel; await b.room.leave(); await sleep(200+bi*30); b.mapId=t.mapId; await enter(b,t.roomId??undefined); }
      watch(b); await waitFor(()=>mo(b)&&b.bag&&b.gear,5000);
      await test(b,"gear",{clear:true}); await test(b,"rest",{s:SD.TEAM_COMBAT_SECS+1}); await test(b,"coin",{n:5e7});
      for(const st of SD.EQUIP_STONES) await test(b,"give",{code:st.id,qty:400}); await test(b,"give",{code:SD.EQUIP_CHARM,qty:60});
      await spot(b,bi);
      for(const sl of SLOTS){ const id=await mk(b,`${sl}_${TIERS[(bi+SLOTS.indexOf(sl))%TIERS.length]}`,{enhance:8+(bi%8)}); if(id){ const g=b.gearN??0; b.room.send("equipgear",{id}); await waitFor(()=>(b.gearN??0)>g,2000); } }
    }));
    const wornOf=b=>b.gear?.items?.length??0;
    ok(B.every(b=>wornOf(b)===SLOTS.length),`${N} bot mặc đủ ${SLOTS.length} ô (${B.map(wornOf).join(",")})`);
    const perf=async(reset)=>test(O,"perf",{reset,mem:true}); // bot quan sát riêng, không chung hạn mức hook test với bot đang chạy lệnh
    const p0=await perf(true); console.log(`  · trước khi chạy: ${p0?.players} người, server RSS ${p0?.rss?Math.round(p0.rss/1048576):"?"} MB, heap ${p0?.heap?Math.round(p0.heap/1048576):"?"} MB`); const t0=Date.now(), deadline=t0+SECS*1000, series=[];
    const sampler=(async()=>{ while(Date.now()<deadline){ await sleep(SAMPLE*1000); const p=await perf(true); if(!p) continue; series.push({t:Math.round((Date.now()-t0)/1000),...p});
      console.log(`  · ${String(Math.round((Date.now()-t0)/1000)).padStart(4)} giây: ${p.on?`tick ${p.tick.toFixed(3)} ms, bản vá ${p.patch.toFixed(3)} ms, lớn nhất ${p.max.toFixed(1)} ms`:"(PERF_LOG tắt)"}; ${p.players} người; server RSS ${p.rss?Math.round(p.rss/1048576):"?"} MB, heap ${p.heap?Math.round(p.heap/1048576):"?"} MB; ${cnt.enh} cường hóa, ${cnt.syn} hợp thành, ${cnt.salv} phân giải, ${cnt.rejoin} lần vào lại, ${cnt.fail} lỗi`); } })();
    await Promise.all(B.map(async(b,bi)=>{
      let loop=0;
      while(Date.now()<deadline){
        loop++;
        try{
          const kind=loop%4;
          if(kind===0){ // cường hóa món đang mặc (ở nấc 13–15 luôn dùng bùa)
            const w=b.gear?.items?.[Math.floor(Math.random()*wornOf(b))]; if(!w) continue;
            if(w.enhance>=SD.EQUIP_MAX_ENHANCE){ await sleep(100); continue; }
            const r=await timed("enh",async()=>{ const n=b.enhN, l=b.logs.length; b.room.send("equipenh",{id:w.id,charm:Math.random()<0.8}); await waitFor(()=>b.enhN>n||b.logs.length>l,3000); return b.enhN>n?b.enhLast:null; });
            if(!r) fail("enh",b); else { if(r.destroyed) cnt.destroyed++; if(r.charmUsed) cnt.charm++; }
          }else if(kind===1){ // hợp thành 3 → 1 cùng ô cùng bậc (T0 / T1 / T2)
            const sl=slotRnd(), tier=TIERS[Math.floor(Math.random()*3)], ids=[]; for(let k=0;k<3;k++){ const id=await mk(b,`${sl}_${tier}`); if(id) ids.push(id); }
            if(ids.length<3){ if(ids.length) b.room.send("equipsalvage",{ids}); }
            else{ await test(b,"coin",{n:5e7}); const r=await timed("syn",async()=>{ const n=b.synN, l=b.logs.length; b.room.send("equipsynth",{main:ids[0],sacrifice:[ids[1],ids[2]]}); await waitFor(()=>b.synN>n||b.logs.length>l,3000); return b.synN>n?b.synLast:null; });
              if(!r) fail("syn",b); else if(r.ok) cnt.synOk++; }
          }else if(kind===2){ // phân giải 5–8 món một lượt
            const ids=[]; for(let k=0,n=5+Math.floor(Math.random()*4);k<n;k++){ const id=await mk(b,`${slotRnd()}_${TIERS[Math.floor(Math.random()*4)]}`); if(id) ids.push(id); }
            if(!ids.length) continue;
            const r=await timed("salv",async()=>{ const n=b.salvN, l=b.logs.length; b.room.send("equipsalvage",{ids}); await waitFor(()=>b.salvN>n||b.logs.length>l,3000); return b.salvN>n?b.salvLast:null; });
            if(!r) fail("salv",b);
          }else{ // đổi món đang mặc (món cũ về túi); mỗi 40 vòng (vài giây) thoát và vào lại
            const id=await mk(b,`${slotRnd()}_${TIERS[Math.floor(Math.random()*TIERS.length)]}`);
            if(id){ await test(b,"rest",{s:SD.TEAM_COMBAT_SECS+1}); await timed("wear",async()=>{ const g=b.gearN??0, l=b.logs.length; b.room.send("equipgear",{id}); await waitFor(()=>(b.gearN??0)>g||b.logs.length>l,3000); }); }
            if(loop%40===3){ await rejoin(b); cnt.rejoin++; await spot(b,bi); }
          }
          // giữ túi gọn: phân giải bớt trang bị lẻ trong túi để lượt sau không tràn ô
          const extra=loose(b).filter(i=>i.code===SD.EQUIP_ITEM).map(i=>i.id); if(extra.length>12) b.room.send("equipsalvage",{ids:extra.slice(0,SD.EQUIP_SALVAGE_MAX)});
          await sleep(30+Math.random()*120);
        }catch(e){ fail("ngoại lệ",b,e?.message??String(e)); await sleep(200); }
      }
    }));
    await sampler;
    for(const [m,n] of [...why].sort((a,b)=>b[1]-a[1]).slice(0,8)) console.log(`  · lỗi ×${n}: ${m}`);
    const q=(a,p)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))]:0;
    for(const k of ["enh","syn","salv","wear"]) console.log(`  · ${k.padEnd(4)}: ${String(cnt[k]).padStart(5)} lệnh, trễ p50 ${q(lat[k],0.5)} ms, p95 ${q(lat[k],0.95)} ms, lớn nhất ${q(lat[k],1)} ms`);
    console.log(`  · hợp thành thành công ${cnt.synOk}/${cnt.syn}, phá hủy ${cnt.destroyed}, dùng bùa ${cnt.charm}, vào lại ${cnt.rejoin}, lỗi / hết hạn ${cnt.fail}`);
    const ps=series.filter(x=>x.rss); if(ps.length>=4){ const h=Math.floor(ps.length/2), a=ps.slice(0,h), z=ps.slice(h), avg=(xs,k)=>xs.reduce((s,x)=>s+x[k],0)/xs.length;
      console.log(`  · nửa đầu → nửa sau: tick ${avg(a,"tick").toFixed(3)} → ${avg(z,"tick").toFixed(3)} ms, heap ${(avg(a,"heap")/1048576).toFixed(0)} → ${(avg(z,"heap")/1048576).toFixed(0)} MB, RSS ${(avg(a,"rss")/1048576).toFixed(0)} → ${(avg(z,"rss")/1048576).toFixed(0)} MB`); }
    // Kiểm cuối: mọi bot vào lại thấy đủ ô, Hồn Tệ không âm, id túi không trùng
    let bad=0; const sig=b=>JSON.stringify({g:(b.gear?.items??[]).map(g=>`${g.id}:${g.slot}:${g.enhance}`).sort(),l:loose(b).map(i=>i.id).sort()});
    for(const b of B){ await sleep(300); const before=sig(b); await rejoin(b); const ids=[...loose(b).map(i=>i.id),...(b.gear?.items??[]).map(g=>g.id)]; if(new Set(ids).size!==ids.length||b.bag.honTe<0||sig(b)!==before) bad++; }
    ok(bad===0,`sau chạy dài: ${N} bot vào lại thấy đúng món đang mặc (id, ô, cấp) và túi như trước, Hồn Tệ không âm, id không trùng (${bad} bot lệch)`);
    ok(cnt.fail<=Math.max(5,0.02*(cnt.enh+cnt.syn+cnt.salv+cnt.wear)),`lỗi / hết hạn ${cnt.fail} trên ${cnt.enh+cnt.syn+cnt.salv+cnt.wear} lệnh (tối đa 2%)`);
    const pl=series.filter(x=>x.on); if(pl.length) ok(Math.max(...pl.map(x=>x.tick))<1000/TICK_RATE/2,`tick trung bình lớn nhất ${Math.max(...pl.map(x=>x.tick)).toFixed(3)} ms < nửa chu kỳ ${(1000/TICK_RATE/2).toFixed(0)} ms`);
    for(const b of B) await b.room.leave().catch(()=>{}); B.length=0; await sleep(20000); // B rỗng: finally không rời lần hai (leave() trên phòng đã đóng không bao giờ xong)
    const pe=await perf(true); // mọi bot đã rời: bộ nhớ về đâu (GC chạy tự nhiên)
    console.log(`  · sau khi ${N} bot rời 20 giây: ${pe?.players} người, server RSS ${pe?.rss?Math.round(pe.rss/1048576):"?"} MB, heap ${pe?.heap?Math.round(pe.heap/1048576):"?"} MB (trước khi chạy: RSS ${p0?.rss?Math.round(p0.rss/1048576):"?"} MB, heap ${p0?.heap?Math.round(p0.heap/1048576):"?"} MB)`);
  }finally{ await O.room.leave().catch(()=>{}); for(const b of B) await b.room.leave().catch(()=>{}); }
}
