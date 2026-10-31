// #1465: dùng server thật để thử xem trước, xác nhận, khóa và lưu qua vào lại.
import { bot, test, waitFor, sleep, looseOf, ok, enter, post } from "./lib.mjs";
import { ASK_CD, TEAM_COMBAT_SECS } from "../../../shared/data.ts";
export async function equipBestTest() {
  const s = await bot("Mặc tốt nhất", "u_minh_linh_mieu", {sex:1,hair:0,hairCol:1,outfitCol:2});
  try {
    const watch = () => { s.best = []; s.room.onMessage("equipbestp", m => s.best.push(m)); };
    watch(); await waitFor(() => s.gear && s.bag, 4000);
    await test(s, "gear", {clear:true}); await test(s,"rest",{s:TEAM_COMBAT_SECS+1});
    const make = async (tpl, extra={}) => { const r=await test(s,"gear",{tpl,...extra}); await waitFor(()=>looseOf(s).some(i=>i.id===r?.id)); return r.id; };
    const a = await make("ao_pham_khi", {ilvl:1,roll:0});
    const b = await make("ao_tu_kim", {ilvl:5,roll:0});
    const hat = await make("mu_tu_kim", {ilvl:5,roll:0});
    const preview = async (extra={}) => { await sleep(ASK_CD+100); const n=s.best.length; s.room.send("equipbest",extra); await waitFor(()=>s.best.length>n); return s.best.at(-1); };
    const p = await preview({id:a, gain:999999, items:[a]});
    ok(p?.count===2 && p.gain>0 && s.gear.items.length===0,"server chọn hai ô, không tin món/điểm giả; xem trước chưa mặc");
    s.room.send("equipbest",{token:p.token}); await waitFor(()=>s.gear.items.length===2);
    ok(s.gear.items.some(i=>i.id===b)&&s.gear.items.some(i=>i.id===hat)&&looseOf(s).some(i=>i.id===a),"xác nhận mặc món tăng Sức mạnh đội hình lớn nhất");
    s.room.send("equipbest",{token:p.token}); await sleep(200);
    ok(s.gear.items.length===2,"gửi lại token không nhân đồ");
    const empty=await preview(); ok(empty.count===0 && empty.gain===0,"thiếu món tốt hơn giữ bộ hiện tại");
    const better=await make("ao_chi_bao",{ilvl:7,roll:0});
    const pre=await preview({slot:2}); ok(pre.count===1,"xem trước một ô");
    await test(s,"hurt",{pct:1}); s.room.send("equipbest",{slot:2,token:pre.token}); await sleep(200);
    ok(!s.gear.items.some(i=>i.id===better),"giao chiến sau xem trước chặn xác nhận");
    await test(s,"rest",{s:TEAM_COMBAT_SECS+1});
    s.room.send("lock",{id:better}); await waitFor(()=>looseOf(s).find(i=>i.id===better)?.lock);
    const locked=await preview(); ok(locked.count===0,"món khóa không tự mặc");
    for(const m of [null,[],{slot:{}},{slot:-1},{token:{}}]) { s.room.send("equipbest",m); await sleep(100); }
    ok(s.leftCode===null && s.gear.items.length===2,"payload sai kiểu không ngắt kết nối hoặc đổi đồ");
    const keep=s.gear.items.map(i=>i.id).sort().join();
    await s.room.leave(); await sleep(400); s.mapId=(await post("/api/me",{token:s.token})).mapId; await enter(s); watch();
    await waitFor(()=>s.gear?.items.map(i=>i.id).sort().join()===keep,4000);
    ok(s.gear.items.map(i=>i.id).sort().join()===keep,"vào lại giữ đúng trang bị, không mất/nhân món");
  } finally { await s.room.leave(); }
}
