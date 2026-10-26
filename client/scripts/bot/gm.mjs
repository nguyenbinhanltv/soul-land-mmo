// Nhóm bot "gm" (#703 bước 2, tách nguyên văn từ bot-test.mjs).
import { RING_ITEM, BEASTS, BONE_ITEM, CORE_ITEM, EQUIP_ITEM, formatHonTe, AUTO_TOKEN } from "../../../shared/data.ts";
import { bot, test, enter, ok, post, sleep, waitFor } from "./lib.mjs";

/**
 * Lệnh GM (#518, BOT_ONLY=gm): tài khoản thường gửi lệnh bị từ chối và không đổi gì; admin (hook `gmadmin`, vì bot không biết trước mã tài khoản) dùng được
 * level / give / ring / bone / core / gear / vohon / coin / tp, lệnh sai báo lỗi, lần đầu dùng tự bật is_test (ẩn khỏi xếp hạng cộng minh), `preset` ghi đè DB
 * và không bị lần ghi lúc thoát đè lại.
 */
export async function gmTest(){
  console.log("[#518] Lệnh GM của tài khoản admin");
  const N=await bot("GM thường","kim_vu_mieu_ung",{sex:1,hair:0,hairCol:1,outfitCol:1});
  const G=await bot("GM admin","yeu_ho",{sex:0,hair:1,hairCol:2,outfitCol:3});
  if(!(await test(G,"ping"))?.enabled){ console.log("  ⚠ bỏ qua lệnh GM (cần hook gmadmin): bật server bằng GAME_TEST=1"); await N.room.leave(); await G.room.leave(); return; }
  const me=b=>b.room.state.players?.get(b.room.sessionId);
  const gm=async(b,cmd)=>{ const l=b.logs.length; b.room.send("gm",{cmd}); await waitFor(()=>b.logs.length>l,2000); await sleep(150); return b.logs.slice(l).join(" | "); };
  await waitFor(()=>me(N)&&N.bag&&me(G)&&G.bag,4000);
  // Chưa có admin nào (ADMIN_ACCOUNTS trống): tắt hẳn, người thường bị từ chối.
  const lv0=me(N).level, honTe0=N.bag.honTe;
  ok(/Không có quyền/.test(await gm(N,"level 100")),"ADMIN_ACCOUNTS trống: lệnh GM bị từ chối");
  ok(/Không có quyền/.test(await gm(G,"coin 999")),"chưa là admin: bị từ chối");
  await test(G,"gmadmin",{on:true});
  ok(/Không có quyền/.test(await gm(N,"coin 999999")),"đã có admin khác: tài khoản thường vẫn bị từ chối");
  ok(me(N).level===lv0&&N.bag.honTe===honTe0,"tài khoản thường: không đổi gì");
  // Admin: từng lệnh.
  let t=await gm(G,"coin 123456"); ok(/GM: Hồn Tệ/.test(t)&&await waitFor(()=>G.bag.honTe===123456,2000),`coin: ${t}`);
  t=await gm(G,"give hoi_huyet_dan 150"); ok(await waitFor(()=>G.bag.items.filter(i=>i.code==="hoi_huyet_dan").reduce((a,i)=>a+i.qty,0)>=150,2000),`give: ${t}`);
  t=await gm(G,"ring 5000 2"); ok(await waitFor(()=>G.bag.items.filter(i=>i.code===RING_ITEM&&i.years===5000).length===2,2000),`ring: ${t}`);
  t=await gm(G,`bone ${BEASTS[0].id} tay_trai 100000 10`); ok(await waitFor(()=>G.bag.items.some(i=>i.code===BONE_ITEM&&i.enhance===10&&i.years===100000),2000),`bone +10: ${t}`);
  t=await gm(G,"core hao_thien 5 6"); ok(await waitFor(()=>G.bag.items.some(i=>i.code===CORE_ITEM&&i.enhance===6&&i.stars===5),2000),`core 5★ +6: ${t}`);
  t=await gm(G,"gear vu_khi_chi_bao 7 15"); ok(await waitFor(()=>G.bag.items.some(i=>i.code===EQUIP_ITEM&&i.enhance===15),2000),`gear +15: ${t}`);
  t=await gm(G,"vohon hao_thien_chuy 40 3"); ok(await waitFor(()=>G.owned.list.some(v=>v.vohon==="hao_thien_chuy"&&v.level===40&&v.rings.length===3),2000),`vohon: ${t}`);
  t=await gm(G,"level 60"); ok(await waitFor(()=>me(G).level===60&&G.owned.list.find(v=>v.rowId===G.owned.active).rings.length>=5,2000),`level 60 kèm đủ hồn hoàn: ${t}`);
  // Lệnh sai / ngoài giới hạn: báo lỗi, không đổi gì.
  const items=G.bag.items.length;
  for(const bad of ["level 101","level 0","level x","give khong_co 1","give hon_hoan 1","coin -5",`bone ${BEASTS[0].id} tay_trai 5 0`,"core hao_thien 7","gear vu_khi_chi_bao 8","tp khong_co","tp dai_dau_hon_truong","preset khac","","xyz"])
    ok(!/GM: /.test(await gm(G,bad)),`lệnh sai bị từ chối: "${bad}"`);
  ok(G.bag.items.length===items&&me(G).level===60,"lệnh sai không đổi gì");
  // Tự bật is_test: không còn trong xếp hạng cộng minh dù cấp cao.
  G.resTop=null; G.room.send("resonance",{op:"top",page:1,pageSize:50}); await waitFor(()=>G.resTop,2000);
  ok(!G.resTop?.list?.some(r=>r.name===G.name),"admin dùng GM: tự bật is_test, ẩn khỏi xếp hạng cộng minh");
  // Dịch chuyển.
  G.travel=null; t=await gm(G,"tp tinh_dau_ngoai_vi"); ok(await waitFor(()=>G.travel?.mapId==="tinh_dau_ngoai_vi",4000),`tp: ${t}`);
  await G.room.leave(); await sleep(300); G.mapId=(await post("/api/me",{token:G.token})).mapId; await enter(G); await waitFor(()=>me(G)&&G.bag,3000);
  ok(G.mapId==="tinh_dau_ngoai_vi"&&G.owned.list.some(v=>v.vohon==="hao_thien_chuy")&&G.bag.honTe===123456,"vào lại: bản đồ, võ hồn mới và Hồn Tệ đã lưu");
  // Mức dựng sẵn: ghi đè DB rồi ngắt; lần ghi lúc thoát không đè lại.
  t=await gm(G,"preset moi"); ok(/moi/.test(t)&&await waitFor(()=>G.leftCode!==null,3000),`preset moi: ${t} (ngắt kết nối, mã ${G.leftCode})`);
  await sleep(500); G.mapId=(await post("/api/me",{token:G.token})).mapId; await enter(G); await waitFor(()=>me(G)&&G.bag&&G.owned,4000);
  ok(G.owned.list.length===2&&G.bag.honTe===0&&G.owned.list.every(v=>v.level===1),`vào lại sau preset: đúng mức mới (${G.owned.list.length} võ hồn, ${formatHonTe(G.bag.honTe)})`);
  // Thao tác ghi túi ngay sau preset (cửa sổ 800 ms trước khi ngắt): phiên đã khoá nên không chụp túi cũ trong RAM đè mức vừa áp.
  await gm(G,"coin 777"); t=await gm(G,`give ${AUTO_TOKEN} 1`);
  await waitFor(()=>G.bag.items.some(i=>i.code===AUTO_TOKEN),2000); const tok=G.bag.items.find(i=>i.code===AUTO_TOKEN); ok(!!tok&&G.bag.honTe===777,`chuẩn bị túi cũ: có Ủy Thác Lệnh, Hồn Tệ 777 (${t})`);
  G.leftCode=null; G.room.send("gm",{cmd:"preset max"});
  for(let k=0;k<3;k++){ G.room.send("use",{id:tok.id}); G.room.send("gm",{cmd:"coin 999"}); await sleep(30); }
  ok(await waitFor(()=>G.leftCode!==null,4000),`preset max rồi ghi túi ngay: bị ngắt kết nối (mã ${G.leftCode})`);
  await sleep(500); G.mapId=(await post("/api/me",{token:G.token})).mapId; await enter(G); await waitFor(()=>me(G)&&G.bag&&G.owned,4000);
  ok(G.owned.list.length>2&&G.bag.honTe>999,`vào lại: túi vẫn đúng mức max, không bị túi cũ đè (${G.owned.list.length} võ hồn, ${formatHonTe(G.bag.honTe)})`);
  await test(G,"gmadmin",{on:false});
  ok(/Không có quyền/.test(await gm(G,"coin 5")),"bỏ quyền admin: lại bị từ chối");
  await N.room.leave(); await G.room.leave();
}
