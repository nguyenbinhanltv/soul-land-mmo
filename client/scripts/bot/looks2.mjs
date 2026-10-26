// Nhóm bot "looks2" (#703 bước 2, tách nguyên văn từ bot-test.mjs).
import { LPC_PARTS, LPC_RAMPS, parseLooks, encodeLpc, decodeLpc, parseLpc, LPC_PRESETS, presetToLpc } from "../../../shared/data.ts";
import { enter, ok, post, sleep, PASS, RUN } from "./lib.mjs";

/**
 * Looks v2 (#509, BOT_ONLY=looks2): ngoại hình chế độ Tự tạo (LPC) song song với Mẫu dựng sẵn. Hàm thuần parseLooks / parseLpc / encodeLpc;
 * /api/looks nhận preset (có / không `mode`, như client cũ) và lpc hợp lệ; mã lạ, sai ô, sai giới, màu lạ, quá dài, khóa thừa bị 400
 * (không tạo nhân vật); lưu qua lần đăng nhập lại; người khác trong phòng nhận đúng chuỗi `lpc` và hồn sư preset có chuỗi rỗng.
 */
export async function looks2Test(){
  console.log("[#509] Looks v2: preset / lpc, kiểm theo danh mục, đồng bộ");
  const partOf=(slot,pred=()=>true)=>LPC_PARTS.find(p=>p.slot===slot&&pred(p));
  const fOnly=LPC_PARTS.find(p=>p.sex==="f"&&p.slot==="torso");
  const hair=partOf("hair"), torso=partOf("torso",p=>p.sex==="mf"&&p.mats.some(m=>m.startsWith("cloth"))), fixed=LPC_PARTS.find(p=>p.colors.length&&p.sex==="mf"&&p.slot!=="torso"&&p.slot!=="hair");
  const good={v:1,body:0,parts:{body:"body.body",head:"head.male",hair:hair.id,torso:torso.id,[fixed.slot]:fixed.id},colors:{skin:LPC_RAMPS.body.allow[2],eye:"green",hair:LPC_RAMPS.hair.allow[1],torso:LPC_RAMPS.cloth.allow[3],[fixed.slot]:fixed.colors[1]}};
  const L=(lpc,extra={})=>({mode:"lpc",lpc,...extra});
  const mut=f=>{const c=structuredClone(good); f(c); return c;};

  // Hàm thuần.
  const g=parseLooks(L(good));
  ok(g&&g.mode==="lpc"&&g.sex===0&&g.hair===0&&g.hairCol===0&&g.outfitCol===0&&g.skin===0&&g.lpc.parts.hair===hair.id,"parseLooks nhận lpc hợp lệ, sex lấy từ lpc.body, số preset = 0");
  const enc=encodeLpc(g.lpc), dec=decodeLpc(enc);
  ok(dec&&encodeLpc(dec)===enc&&enc.length<400&&enc.startsWith("1|0|"),`encodeLpc gọn (${enc.length} ký tự) và decodeLpc khôi phục đúng`);
  ok(parseLooks({sex:1,hair:2,hairCol:3,outfitCol:4,skin:2}).mode==="preset"&&parseLooks({sex:1,hair:2,hairCol:3,outfitCol:4,mode:"preset"})?.skin===0,"thiếu mode = preset; thiếu skin = 0 (client cũ)");
  ok(parseLooks({sex:0,hair:0,hairCol:0,outfitCol:0,mode:"xyz"})===null&&parseLooks({sex:0,hair:0,hairCol:0,outfitCol:0,mode:1})===null,"mode lạ -> null");
  ok(decodeLpc("1|0|||body.body")===null&&decodeLpc("2|0|||body.body,head.male")===null&&decodeLpc("1|0|||body.body,head.male,zzz.x")===null&&decodeLpc("1|0|||body.body,body.body,head.male")===null&&decodeLpc("x".repeat(2000))===null,"decodeLpc: thiếu ô bắt buộc / phiên bản lạ / mã lạ / trùng ô / quá dài -> null");

  // Các ca bị từ chối (cả ở hàm thuần lẫn /api/looks).
  const bad={
    "mã lạ":mut(c=>{c.parts.hair="hair.khong_co";}),
    "sai ô (mã tóc nằm ô áo)":mut(c=>{c.parts.torso=hair.id;}),
    "ô lạ":mut(c=>{c.parts.wings=hair.id;}),
    "thiếu thân":mut(c=>{delete c.parts.body;}),
    "thiếu mặt":mut(c=>{delete c.parts.head;}),
    "món chỉ nữ, thân nam":mut(c=>{c.parts.torso=fOnly.id; delete c.colors.torso;}),
    "màu da lạ":mut(c=>{c.colors.skin="tim_than_ky";}),
    "màu tóc không có trong allow (orange chỉ là dải gốc)":mut(c=>{c.colors.hair="orange";}),
    "màu sheet vẽ sẵn không có trong món":mut(c=>{c.colors[fixed.slot]="khong_co";}),
    "màu cho ô không có món":mut(c=>{c.colors.cape="black";}),
    "màu không phải chuỗi":mut(c=>{c.colors.hair=3;}),
    "mã không phải chuỗi":mut(c=>{c.parts.hair=5;}),
    "thể hình lạ":mut(c=>{c.body=2;}),
    "thể hình không nguyên":mut(c=>{c.body=0.5;}),
    "phiên bản lạ":mut(c=>{c.v=2;}),
    "parts là mảng":mut(c=>{c.parts=[];}),
    "quá nhiều ô":mut(c=>{for(let i=0;i<40;i++) c.parts["x"+i]="body.body";}),
    "mã quá dài":mut(c=>{c.parts.hair="hair."+"a".repeat(5000);}),
    "màu khóa toString":JSON.parse('{"v":1,"body":0,"parts":{"body":"body.body","head":"head.male"},"colors":{"toString":"x"}}'),
    "màu khóa constructor":JSON.parse('{"v":1,"body":0,"parts":{"body":"body.body","head":"head.male"},"colors":{"constructor":"x"}}'),
    "màu khóa __proto__":JSON.parse('{"v":1,"body":0,"parts":{"body":"body.body","head":"head.male"},"colors":{"__proto__":"x"}}'),
    "khóa __proto__":JSON.parse('{"v":1,"body":0,"parts":{"body":"body.body","head":"head.male","__proto__":"x"},"colors":{}}'),
  };
  for(const [n,l] of Object.entries(bad)) ok(parseLpc(l)===null&&parseLooks(L(l))===null,`lpc sai (${n}) -> null`);
  ok(parseLooks({mode:"lpc"})===null&&parseLooks(L(null))===null&&parseLooks(L("x"))===null&&parseLooks(L(good,{sex:1}))===null,"mode lpc thiếu / sai kiểu lpc, hoặc sex khác lpc.body -> null");
  ok(parseLooks(L(good,{sex:0,hair:3,skin:9}))?.hair===0,"mode lpc bỏ qua các số preset (đặt 0)");
  ok(parseLooks(L(mut(c=>{c.body=1;}))).sex===1,"thân nữ -> sex 1");
  const ff=mut(c=>{c.body=1; c.parts.torso=fOnly.id; delete c.colors.torso; if(fOnly.colors.length) c.colors.torso=fOnly.colors[0];});
  ok(parseLooks(L(ff))!==null,`món chỉ nữ (${fOnly.id}) với thân nữ -> nhận`);
  // Bộ LPC dựng sẵn (HL1 #565): mỗi bộ phải còn hợp lệ y nguyên (không bị chuẩn hóa đổi) khi LPC_PARTS / LPC_RAMPS thay đổi.
  ok(LPC_PRESETS.length>=8&&LPC_PRESETS.length<=12,`LPC_PRESETS có ${LPC_PRESETS.length} bộ (8–12)`);
  ok(new Set(LPC_PRESETS.map(p=>p.id)).size===LPC_PRESETS.length,"LPC_PRESETS: mã bộ không trùng");
  const nPre=LPC_PRESETS.filter(p=>p.lpc.body===0).length;
  ok(nPre>0&&Math.abs(nPre-(LPC_PRESETS.length-nPre))<=1,`LPC_PRESETS: nam ${nPre} / nữ ${LPC_PRESETS.length-nPre} cân bằng`);
  for(const p of LPC_PRESETS){
    const r=parseLpc(p.lpc);
    ok(r!==null&&JSON.stringify(r)===JSON.stringify(p.lpc),`bộ ${p.id}: parseLpc nhận và không đổi gì`);
    ok(r!==null&&encodeLpc(decodeLpc(encodeLpc(r)))===encodeLpc(r)&&parseLooks(L(p.lpc))?.mode==="lpc",`bộ ${p.id}: khứ hồi encode / decode, parseLooks nhận`);
  }

  // /api/looks: ca sai không tạo nhân vật, ca đúng tạo được; nhận qua lần đăng nhập lại.
  const newAcc=async n=>{ const l=await post("/api/login",{name:`${n} ${RUN}`,password:PASS}); ok(!l.looks?.chosen&&l.looks?.mode!=="lpc"&&l.looks?.lpc===undefined,`${n}: tài khoản mới chưa chọn, mặc định là preset`); return l; };
  const A=await newAcc("L2 lpc"), B=await newAcc("L2 preset"), C=await newAcc("L2 cu");
  for(const [n,l] of Object.entries(bad)) ok((await post("/api/looks",{token:A.token,...L(l)})).status===400,`/api/looks lpc sai (${n}) -> 400`);
  ok((await post("/api/looks",{token:A.token,mode:"lpc"})).status===400&&(await post("/api/looks",{token:A.token,mode:"khac",sex:0,hair:0,hairCol:0,outfitCol:0})).status===400,"/api/looks: lpc thiếu / mode lạ -> 400");
  ok(!(await post("/api/login",{name:`L2 lpc ${RUN}`,password:PASS})).looks?.chosen,"các ca sai không làm tài khoản thành đã chọn");
  const ra=await post("/api/looks",{token:A.token,...L(good)});
  ok(ra.status===200&&ra.looks?.chosen&&ra.looks.mode==="lpc"&&ra.looks.sex===0&&JSON.stringify(ra.looks.lpc)===JSON.stringify(parseLpc(good)),"tạo lpc hợp lệ -> 200, trả đúng phần lpc");
  ok((await post("/api/looks",{token:A.token,...L(good)})).status===409,"đổi / tạo lại sau khi đã chọn -> 409 (luật hiện tại giữ nguyên)");
  const P=await newAcc("L2 mau"), rp=await post("/api/looks",{token:P.token,...L(LPC_PRESETS[0].lpc)});
  ok(rp.status===200&&rp.looks?.mode==="lpc"&&JSON.stringify(rp.looks.lpc)===JSON.stringify(LPC_PRESETS[0].lpc),`/api/looks nhận bộ dựng sẵn ${LPC_PRESETS[0].id} -> 200, giữ nguyên`);
  const A2=await post("/api/login",{name:`L2 lpc ${RUN}`,password:PASS});
  ok(A2.looks?.mode==="lpc"&&A2.looks.chosen&&encodeLpc(A2.looks.lpc)===enc,"đăng nhập lại: lpc lưu đúng (DB / RAM)");
  // HL2 #571: /api/looks không còn tạo preset, đổi sang LPC gần nhất; tài khoản kiểu cũ (hook test) tự chuyển lúc nạp, không tăng looks_changes.
  const PB={sex:1,hair:2,hairCol:3,outfitCol:4,skin:1}, PC={sex:0,hair:3,hairCol:5,outfitCol:1,skin:0};
  const rb=await post("/api/test/legacy-looks",{token:B.token,...PB});
  if(rb.status!==200){ console.log("  ⚠ bỏ qua chuyển tài khoản preset cũ (cần GAME_TEST=1)"); }
  else{
    ok(rb.ok===true,"tạo tài khoản kiểu cũ (preset đã chọn) bằng hook test");
    const lb=await post("/api/login",{name:`L2 preset ${RUN}`,password:PASS}), mb=await post("/api/me",{token:B.token});
    ok(lb.looks?.mode==="lpc"&&lb.looks.chosen&&lb.looks.changes===0&&JSON.stringify(lb.looks.lpc)===JSON.stringify(presetToLpc(PB))&&parseLpc(lb.looks.lpc)!==null,"HL2: đăng nhập tài khoản preset cũ -> LPC hợp lệ đúng presetToLpc, looks_changes vẫn 0");
    ok(JSON.stringify(mb.looks)===JSON.stringify(lb.looks)&&mb.looks.sex===1,"HL2: /api/me trả đúng cùng ngoại hình LPC (chuyển một lần, chạy lại như cũ)");
    ok((await post("/api/test/legacy-looks",{token:B.token,...PC})).ok===false,"HL2: hook cũ không ghi đè tài khoản đã chọn");
  }
  const rc=await post("/api/looks",{token:C.token,...PC});
  ok(rc.status===200&&rc.looks.mode==="lpc"&&JSON.stringify(rc.looks.lpc)===JSON.stringify(presetToLpc(PC))&&rc.looks.changes===0,"HL2: client cũ gửi preset (không mode, không skin) -> lưu LPC gần nhất");
  ok((await post("/api/login",{name:`L2 cu ${RUN}`,password:PASS})).looks?.mode==="lpc","đăng nhập lại: vẫn LPC");

  // Đồng bộ: vào phòng, người khác thấy đúng chuỗi.
  for(const [x,v] of [[A,"lam_dien_ba_vuong_long"],[B,"bich_lan_xa_hoang"]]){ const a=await post("/api/awaken",{token:x.token,vohon:v}); ok(a.status===200,`thức tỉnh ${v}`); }
  const mk=async(l,n)=>{ const me=await post("/api/me",{token:l.token}); const b={name:n,token:l.token,logs:[],owned:null,ownedMsgs:0,looks:me.looks,isNew:true,mapId:me.mapId,near:false}; await enter(b); return b; };
  const ba=await mk(A,"L2 lpc"), bb=await mk(B,"L2 preset");
  await sleep(800);
  const seenA=bb.room.state.players.get(ba.room.sessionId), seenB=ba.room.state.players.get(bb.room.sessionId);
  ok(ba.room.roomId===bb.room.roomId&&seenA&&seenB,"hai bot cùng phòng, thấy nhau");
  ok(seenA?.lpc===enc&&decodeLpc(seenA.lpc)&&seenA.sex===0&&seenA.hair===0,`B thấy đúng chuỗi lpc của A (${seenA?.lpc?.length} ký tự)`);
  ok(seenB?.lpc===encodeLpc(presetToLpc(PB))&&seenB.sex===1&&seenB.hair===0&&seenB.skin===0,"A thấy B (tài khoản preset cũ đã chuyển) là LPC đúng chuỗi, số preset = 0");
  await ba.room.leave(); await bb.room.leave();
}
