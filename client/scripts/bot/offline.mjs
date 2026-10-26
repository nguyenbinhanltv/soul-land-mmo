// Nhóm bot "offline" (#703 bước 6, tách nguyên văn từ bot-test.mjs): Ủy thác offline (Auto 3).
import { readFileSync } from "node:fs";
import { post, sleep, waitFor, ok, mapUrl, bot, enter, qtyOf, npcSpot, looseOf, same, test, needHookSkip } from "./lib.mjs";
import { formatHonTe, parseLevelRange, RING_ITEM, AUTO_DAILY_SECS, autoTimeText, OFFLINE, offlineSplit, offlineFight } from "../../../shared/data.ts";

/**
 * Ủy thác offline (Auto 3, mục 5.13; BOT_ONLY=offline chỉ chạy phần này): hàm thuần offlineSplit / offlineFight; thoát trong vùng săn rồi
 * giả lập thời gian trôi bằng hook `offline {ago}`, vào lại nhận thưởng đúng số giây, Hồn Tệ, hồn hoàn tối đa OFFLINE.rings; quỹ giờ treo
 * chung với tự săn (còn 10 phút / hết giờ); chia quỹ theo ngày (đồng hồ lịch đứng yên của GAME_TEST); vùng quá sức; túi đầy thì dừng;
 * vắng quá ngắn và thoát trong vùng an toàn thì không có thưởng.
 */
export async function offlineTest(){
  console.log("[Auto 3] Ủy thác offline");
  const D=AUTO_DAILY_SECS, H=3600, noon=Date.UTC(2026,9,22,5,0), tot=a=>a.reduce((s,x)=>s+x.secs,0); // noon: 12:00 giờ Việt Nam
  let sp=offlineSplit(noon,1800,"2026-10-22",D-600);
  ok(sp.length===1&&sp[0].secs===600,`offlineSplit: còn 10 phút quỹ hôm nay thì vắng 30 phút chỉ tính 600 giây (${JSON.stringify(sp)})`);
  sp=offlineSplit(noon,13*H,"2026-10-22",0);
  ok(same(sp,[{day:"2026-10-21",secs:H},{day:"2026-10-22",secs:12*H}]),`offlineSplit: vắng 13 giờ qua 00:00 thì chia hai ngày, mỗi ngày một quỹ (${JSON.stringify(sp)})`);
  sp=offlineSplit(noon,40*H,"2026-10-20",D);
  ok(tot(sp)===OFFLINE.maxSecs&&sp[0].day==="2026-10-21",`offlineSplit: vắng 40 giờ, ngày đầu đã hết quỹ, tối đa ${OFFLINE.maxSecs/H} giờ một lần (${JSON.stringify(sp)})`);
  // Auto 2: hết quỹ miễn phí của ngày thì lấy tiếp quỹ giờ cộng thêm (Ủy Thác Lệnh), vẫn trong trần OFFLINE.maxSecs.
  sp=offlineSplit(noon,3*H,"2026-10-22",D,2*H);
  ok(same(sp,[{day:"2026-10-22",secs:2*H,bonus:true}]),`offlineSplit: hết giờ miễn phí, quỹ Ủy Thác Lệnh 2 giờ, vắng 3 giờ thì tính 2 giờ từ quỹ (${JSON.stringify(sp)})`);
  sp=offlineSplit(noon,2*H,"2026-10-22",D-600,H);
  ok(same(sp,[{day:"2026-10-22",secs:600},{day:"2026-10-22",secs:H,bonus:true}]),`offlineSplit: còn 10 phút miễn phí rồi 1 giờ từ quỹ (${JSON.stringify(sp)})`);
  sp=offlineSplit(noon,40*H,"2026-10-20",0,24*H);
  ok(tot(sp)===OFFLINE.maxSecs,`offlineSplit: có quỹ cộng thêm vẫn tối đa ${OFFLINE.maxSecs/H} giờ một lần (${tot(sp)/H} giờ)`);
  const f1=offlineFight({atk:200,crit:0.12,critMult:1.8,maxHp:2000,def:1},100,"phong_lang"), f2=offlineFight({atk:5,crit:0.12,critMult:1.8,maxHp:60,def:1},50000,"phong_lang");
  ok(f1.ok&&f1.secs>OFFLINE.seek&&!f2.ok&&f2.secs===OFFLINE.seek,`offlineFight: mạnh hạ được (${f1.secs.toFixed(1)} giây/con), yếu thì quá sức (${f2.secs} giây bỏ qua)`);

  const A=await bot("Ủy thác","u_minh_linh_mieu",{sex:1,hair:0,hairCol:3,outfitCol:2});
  if(!(await test(A,"ping"))?.enabled){ needHookSkip("bỏ qua ủy thác offline (cần hook offline, goto, set, auto): bật server bằng GAME_TEST=1"); await A.room.leave(); return; }
  try{
  const NV="tinh_dau_ngoai_vi", me=b=>b.room.state.players?.get(b.room.sessionId);
  const objsOf=m=>JSON.parse(readFileSync(mapUrl(m),"utf8")).layers.flatMap(l=>l.objects??[]);
  const autoOp=async(b,op,more={})=>{ b.autoMsg=null; b.room.send("auto",{op,...more}); await waitFor(()=>b.autoMsg,1500); return b.autoMsg; };
  async function rejoin(b){ await b.room.leave(); await sleep(300); b.mapId=(await post("/api/me",{token:b.token})).mapId; await enter(b); await waitFor(()=>me(b)&&b.bag&&b.owned,3000); }
  async function warp(b,mapId,x,y){ b.travel=null; b.room.send("test",{op:"warp",mapId,x,y}); await waitFor(()=>b.travel?.mapId===mapId,4000); await rejoin(b); }
  /** Thoát (hồn thú quanh đó đã dọn để không bị hạ lúc chờ) với lần ủy thác lùi `ago` giây, vào lại, chờ tin `offline` (null nếu không có). */
  async function away(ago,ms=4000){ await test(A,"clear"); await test(A,"offline",{ago}); await rejoin(A); return await waitFor(()=>A.offMsg,ms)?A.offMsg:null; }
  await waitFor(()=>me(A)&&A.bag&&A.owned,3000);

  // ---- Thoát trong làng Thánh Hồn Thôn (vùng an toàn): không ủy thác ----
  const tv=npcSpot("thanh_hon_thon","to_van_dao"); await test(A,"goto",{x:tv.x,y:tv.y+16});
  let h=await test(A,"offline");
  let m=await away(H,1500);
  ok(h&&h.zone===null&&!m,`thoát trong làng (vùng an toàn): không ủy thác (vùng ${h?.zone}, tin ${JSON.stringify(m)})`);

  // ---- Tinh Đấu Ngoại vi: vùng nông nhất, võ hồn cấp 21, 2 hồn hoàn ----
  const ar=objsOf(NV).find(o=>o.type==="arrive"&&o.name==="tu_nac_dinh_thanh");
  await warp(A,NV,ar.x,ar.y);
  const zy=z=>parseLevelRange(z.properties?.find(q=>q.name==="years")?.value)??[0,0];
  const zs=objsOf(NV).filter(o=>o.type==="zone").sort((a,b)=>zy(a)[1]-zy(b)[1]), shallow=zs[0], deep=zs.at(-1);
  /** Đứng ở một điểm đi được trong vùng `z` mà hook xác nhận là vùng ủy thác (trả kết quả hook, null nếu không tìm được). */
  async function stand(z){
    for(const fy of [0.5,0.35,0.65,0.2,0.8]) for(const fx of [0.5,0.35,0.65,0.2,0.8]){
      const x=Math.round(z.x+z.width*fx), y=Math.round(z.y+z.height*fy); await test(A,"goto",{x,y});
      if(Math.hypot(me(A).x-x,me(A).y-y)<1){ const o=await test(A,"offline"); if(o?.zone===z.name) return o; }
    }
    return null;
  }
  const act=A.owned.active; await test(A,"set",{rowId:act,level:21,rings:[423,812]});
  h=await stand(shallow);
  ok(h,`đứng trong vùng ${shallow.name} (${zy(shallow).join("–")} năm): thoát ở đây được ủy thác (đồng hồ lịch ${h?.clock})`);
  const frozen=/^frozen/.test(h?.clock??"");
  // Không nhặt hồn cốt / hồn hạch (mỗi món một ô) để một giờ không đầy túi; hồn hoàn vẫn nhặt (tối đa OFFLINE.rings).
  await autoOp(A,"set",{cfg:{bone:false,core:false}});
  await test(A,"auto",{used:0});
  const coin0=A.bag.honTe, ring0=qtyOf(A,RING_ITEM);
  m=await away(H);
  ok(m&&m.secs===H&&m.away>=H&&m.zone===shallow.name&&m.used<=m.secs&&m.used>m.secs-120,`vắng 1 giờ: tính ${m?.secs} giây, đã săn ${m?.used} giây ở ${m?.zone}`);
  ok(m&&m.kills>0&&m.xp>0&&!m.stop,`hạ ${m?.kills} hồn thú (${m?.weak} con quá sức), ${m?.xp} kinh nghiệm gốc${m?.stop?`, dừng: ${m.stop}, ${JSON.stringify(m.items)}`:""}`);
  await waitFor(()=>A.bag.honTe===coin0+(m?.coins??0),2000);
  ok(m&&m.coins>0&&A.bag.honTe-coin0===m.coins,`Hồn Tệ vào túi đúng bảng thưởng (${formatHonTe(m?.coins??0)})`);
  const rq=m?.items.find(i=>/^Hồn hoàn/.test(i.name))?.qty??0;
  ok(rq>0&&rq<=OFFLINE.rings&&qtyOf(A,RING_ITEM)-ring0===rq,`hồn hoàn vào túi: ${rq} chiếc (tối đa ${OFFLINE.rings}), túi ${ring0} → ${qtyOf(A,RING_ITEM)}`);
  ok(m&&Math.abs(m.left-(D-m.used))<=1&&Math.abs((A.autoMsg?.left??-9)-m.left)<1,`quỹ giờ treo hôm nay trừ đúng phần đã săn (còn ${autoTimeText(m?.left??0)})`);

  // ---- Vắng quá ngắn: không tính ----
  m=await away(OFFLINE.minSecs-60,1500);
  ok(!m,`vắng dưới ${OFFLINE.minSecs} giây: không có bảng thưởng`);

  // ---- Quỹ chung với tự săn: còn 10 phút / hết giờ ----
  await test(A,"auto",{used:D-600});
  m=await away(1800);
  ok(m&&(frozen?m.secs===600:m.secs<=600)&&m.used<=m.secs&&m.left<=600-m.used+1,`còn 10 phút giờ treo hôm nay, vắng 30 phút: chỉ tính ${m?.secs} giây, còn ${m?.left?.toFixed(0)} giây`);
  await test(A,"auto",{used:D});
  m=await away(1800);
  ok(m&&m.secs===0&&m.kills===0&&m.stop==="hết giờ treo",`hết giờ treo hôm nay: không tính giây nào (${m?.stop})`);
  // Auto 2: hết giờ miễn phí nhưng còn quỹ Ủy Thác Lệnh 30 phút, vắng 1 giờ: tính 30 phút từ quỹ, quỹ trừ đúng phần đã săn.
  await test(A,"auto",{used:D,bonus:1800});
  m=await away(H); await waitFor(()=>A.autoMsg&&Math.abs(A.autoMsg.bonus-(m?.bonus??-9))<=1,2000);
  const info=await test(A,"auto");
  ok(m&&(frozen?m.secs===1800:m.secs<=1800)&&m.kills>0&&Math.abs(m.bonusUsed-m.used)<=1&&Math.abs(info?.bonus-(1800-m.used))<=1&&info?.used>=D&&Math.abs(m.left-info.bonus)<=1,
    `hết giờ miễn phí, quỹ Ủy Thác Lệnh 30 phút, vắng 1 giờ: tính ${m?.secs} giây, dùng ${m?.bonusUsed} giây từ quỹ, quỹ còn ${info?.bonus?.toFixed(0)} giây`);
  await test(A,"auto",{bonus:0});

  // ---- Qua 00:00 (đồng hồ lịch đứng yên 12:00 của GAME_TEST): mỗi ngày một quỹ; không nhặt hồn hoàn / hồn cốt / hồn hạch ----
  if(frozen){
    await autoOp(A,"set",{cfg:{ring:-1,bone:false,core:false}});
    await test(A,"auto",{used:0});
    const r1=qtyOf(A,RING_ITEM);
    m=await away(13*H);
    ok(m&&m.secs===13*H&&Math.abs(m.left-(D-Math.max(0,m.used-H)))<=1,`vắng 13 giờ qua 00:00: tính ${m?.secs/H} giờ (1 giờ hôm qua + 12 giờ hôm nay), hôm nay còn ${autoTimeText(m?.left??0)}`);
    ok(m&&qtyOf(A,RING_ITEM)===r1&&!m.items.some(i=>/^Hồn hoàn/.test(i.name)),"bộ lọc nhặt của tự săn (ring = −1): không nhận hồn hoàn");
    await autoOp(A,"set",{cfg:{}});
  } else console.log(`  ⚠ bỏ qua phần chia quỹ qua 00:00: đồng hồ lịch ${h?.clock} (cần GAME_TEST không đặt BOSS_CLOCK)`);

  // ---- Vùng quá sức: võ hồn cấp 1 ở vùng sâu nhất ----
  h=await stand(deep); await test(A,"set",{rowId:act,level:1,rings:[]});
  await test(A,"auto",{used:0});
  m=await away(H);
  ok(h&&m&&m.kills===0&&m.weak>0&&m.stop==="vùng quá sức",`cấp 1 ở ${deep.name} (${zy(deep).join("–")} năm): không hạ được con nào (${m?.weak} con quá sức, ${m?.stop})`);

  // ---- E2 (#413): túi đầy chỉ vì trang bị rơi thì bỏ món đó, vẫn săn tiếp (không dừng "túi đầy"), báo số món bỏ ----
  await test(A,"set",{rowId:act,level:21,rings:[423,812]}); h=await stand(shallow);
  await autoOp(A,"set",{cfg:{ring:-1,bone:false,core:false}});
  const free=()=>A.bag.slots-looseOf(A).length;
  for(const i of looseOf(A).filter(i=>i.code===RING_ITEM).slice(0,Math.max(0,6-free()))) A.room.send("discard",{id:i.id});
  await waitFor(()=>free()>=6,2000);
  const fill=Math.max(0,free()-6);
  for(let i=0;i<fill;i++) await test(A,"gear",{tpl:"vu_khi_chi_bao"});
  ok(await waitFor(()=>free()===6,3000),`làm đầy túi bằng ${fill} món trang bị: còn ${free()} ô trống (cần đúng 6)`);
  await test(A,"auto",{used:0});
  m=await away(H);
  ok(m&&m.stop!=="túi đầy"&&m.kills>0&&m.used>m.secs-120&&m.equipLost>0,`túi đầy vì trang bị: vẫn săn đủ ${m?.used}/${m?.secs} giây (${m?.kills} con), bỏ ${m?.equipLost} món (dừng: ${m?.stop})`);
  await test(A,"gear",{clear:true}); await autoOp(A,"set",{cfg:{}}); await waitFor(()=>free()>6,2000);

  // ---- Túi đầy: dừng sớm, chỉ trừ quỹ phần đã săn ----
  await test(A,"set",{rowId:act,level:21,rings:[423,812]}); h=await stand(shallow);
  await test(A,"give",{code:RING_ITEM,qty:Math.max(0,free()-1),years:20}); await waitFor(()=>free()===1,2000);
  await test(A,"auto",{used:0});
  m=await away(H);
  ok(m&&m.stop==="túi đầy"&&m.used<m.secs&&free()===0&&Math.abs(m.left-(D-m.used))<=1,`túi đầy: dừng sau ${m?.used}/${m?.secs} giây, quỹ chỉ trừ phần đã săn`);
  } finally { await A.room.leave().catch(()=>{}); }
}
