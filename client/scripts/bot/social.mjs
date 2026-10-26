// Nhóm bot "social" (#703 bước 6, tách nguyên văn từ bot-test.mjs): Chat, bạn bè và chặn.
import { post, sleep, waitFor, PASS, RUN, ok, bot, enter, test } from "./lib.mjs";
import { TONG_MON, AWAKEN_CHOICES, WORLD_CHAT, FRIEND_MAX, BLOCK_MAX } from "../../../shared/data.ts";

/**
 * Chat tổ đội, tin riêng, kênh thế giới (#188), chat tông (#198; BOT_ONLY=chat, nhóm 5 của BOT_PART): `chat {text, ch?, to?}`, thiếu
 * `ch` là chat bản đồ như cũ; tổ đội / riêng / thế giới / tông tới người ở bản đồ khác (qua presence); người nhận phải đang trong game;
 * thế giới chặn dưới WORLD_CHAT.minLevel và 1 tin / WORLD_CHAT.cdSecs giây; tông chỉ tới người cùng tông, chưa có tông thì báo; chống
 * spam riêng từng kênh; giá trị lạ bị bỏ qua. Phần xuyên kênh cùng bản đồ ở channelTest (CHANNEL_MAX=2).
 */
export async function chatTest(){
  console.log("[#188, #198] Chat tổ đội, tin riêng, kênh thế giới, tông môn (xuyên bản đồ)");
  const T=async(b,op,extra={})=>{ b.test=null; b.room.send("test",{op,...extra}); await waitFor(()=>b.test,2000); await sleep(80); return b.test; };
  /** Gửi `chat` rồi chờ một dòng log từ chối (trả các dòng mới; "" nếu không có). */
  const said=async(b,msg)=>{ const l=b.logs.length; b.room.send("chat",msg); await waitFor(()=>b.logs.length>l,1500); await sleep(50); return b.logs.slice(l).join(" | "); };
  const has=(b,txt,ch)=>b.chats.find(m=>m.text===txt&&(ch?m.ch===ch:!m.ch));
  const got=(b,txt,ch)=>waitFor(()=>has(b,txt,ch),2000);
  const X=await bot("Chat X","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:1,outfitCol:2}), Y=await bot("Chat Y","nhu_cot_tho",{sex:1,hair:2,hairCol:0,outfitCol:1});
  const Z=await bot("Chat Z","u_minh_linh_mieu",{sex:0,hair:0,hairCol:3,outfitCol:4});
  try {
    // Z sang Nặc Đinh Thành (hook warp, như đi cổng): khác bản đồ, khác phòng với X, Y.
    Z.travel=null; await T(Z,"warp",{mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>Z.travel,3000);
    if(Z.travel){ const t=Z.travel; await Z.room.leave(); await sleep(200); Z.mapId=t.mapId; await enter(Z,t.roomId??undefined); }
    await waitFor(()=>Z.room.state.mapId==="nac_dinh_thanh",2000);
    ok(X.room.roomId===Y.room.roomId&&Z.room.state.mapId==="nac_dinh_thanh"&&Z.room.roomId!==X.room.roomId,`X, Y cùng phòng ${X.room.state.mapId}; Z ở ${Z.room.state.mapId}`);
    for(const b of [X,Y,Z]) await T(b,"chat",{cop:"rlreset"});

    // ---- Bản đồ (như cũ): chỉ phòng của người gửi ----
    const tMap=`bđ ${RUN}`; X.room.send("chat",{text:tMap});
    ok(await got(Y,tMap)&&has(Y,tMap).name===X.name,"chat bản đồ (thiếu ch): Y cùng phòng nhận, không có ch");
    await sleep(300); ok(!Z.chats.some(m=>m.text===tMap),"chat bản đồ không tới Z ở bản đồ khác");

    // ---- Tổ đội: chưa vào đội thì báo; vào đội rồi thì mọi thành viên nhận dù khác bản đồ ----
    ok(/không ở trong tổ đội/.test(await said(X,{text:"có ai không",ch:"party"})),"chat tổ đội khi chưa vào đội: báo lỗi riêng");
    { const n=Z.partyMsgs; X.room.send("party",{op:"invite",name:Z.name}); await waitFor(()=>Z.partyMsgs>n&&Z.party?.invites?.length,2000);
      Z.room.send("party",{op:"accept",name:X.name}); await waitFor(()=>X.party?.members?.length===2,2000); }
    ok(X.party?.members?.length===2,`X mời Z (bản đồ khác) vào tổ đội: ${X.party?.members?.map(m=>m.name).join(", ")}`);
    const tParty=`đội ${RUN}`; X.room.send("chat",{text:tParty,ch:"party"});
    ok(await got(Z,tParty,"party")&&has(Z,tParty,"party").name===X.name,"chat tổ đội: Z ở bản đồ khác nhận (ch party, tên người gửi)");
    ok(await got(X,tParty,"party"),"người gửi cũng nhận tin tổ đội của mình");
    await sleep(300); ok(!Y.chats.some(m=>m.text===tParty),"Y không trong tổ đội: không nhận");

    // ---- Tin riêng: tên không phân biệt hoa thường, người gửi nhận bản sao, người khác không thấy ----
    const tW=`riêng ${RUN}`; Y.room.send("chat",{text:tW,ch:"whisper",to:Z.name.toUpperCase()});
    ok(await got(Z,tW,"whisper")&&has(Z,tW,"whisper").name===Y.name&&has(Z,tW,"whisper").to===Z.name,"tin riêng Y → Z (bản đồ khác, tên viết hoa): Z nhận, kèm tên người gửi / nhận");
    ok(await got(Y,tW,"whisper")&&has(Y,tW,"whisper").to===Z.name,"người gửi nhận bản sao (to = tên đúng cách viết)");
    await sleep(300); ok(!X.chats.some(m=>m.text===tW),"X không thấy tin riêng của người khác");
    const tR=`trả lời ${RUN}`; Z.room.send("chat",{text:tR,ch:"whisper",to:Y.name}); // /r ở client = tin riêng tới người vừa nhắn
    ok(await got(Y,tR,"whisper"),"Z trả lời Y (bản đồ khác)");
    ok(/không trong game/.test(await said(Y,{text:"alo",ch:"whisper",to:`Không Ai ${RUN}`})),"tin riêng tới tên không có: báo không trong game");
    ok(/chính mình/.test(await said(Y,{text:"alo",ch:"whisper",to:Y.name})),"tự nhắn riêng cho mình bị từ chối");
    ok(/\/t/.test(await said(Y,{text:"alo",ch:"whisper"})),"tin riêng thiếu người nhận: nhắc cú pháp /t");

    // ---- Thế giới: dưới cấp WORLD_CHAT.minLevel bị chặn; 1 tin / WORLD_CHAT.cdSecs giây; mọi bản đồ nhận ----
    // Cấp nhân vật mới không cố định: đặt hẳn dưới ngưỡng bằng hook rồi mới thử.
    await T(X,"set",{rowId:X.owned.active,level:WORLD_CHAT.minLevel-1});
    await waitFor(()=>X.room.state.players.get(X.room.sessionId)?.level===WORLD_CHAT.minLevel-1,2000);
    ok(/từ cấp/.test(await said(X,{text:"thế giới",ch:"world"})),`kênh thế giới ở cấp ${WORLD_CHAT.minLevel-1}: bị chặn`);
    await T(X,"set",{rowId:X.owned.active,level:WORLD_CHAT.minLevel});
    await waitFor(()=>X.room.state.players.get(X.room.sessionId)?.level>=WORLD_CHAT.minLevel,2000);
    const tG=`thế giới ${RUN}`; X.room.send("chat",{text:tG,ch:"world"});
    ok(await got(Y,tG,"world")&&await got(Z,tG,"world")&&has(Z,tG,"world").name===X.name,`cấp ${WORLD_CHAT.minLevel}: tin thế giới tới Y (cùng phòng) và Z (bản đồ khác)`);
    ok(new RegExp(`${WORLD_CHAT.cdSecs} giây`).test(await said(X,{text:"lần hai",ch:"world"})),`gửi lại ngay: phải chờ ${WORLD_CHAT.cdSecs} giây`);
    await T(X,"chat",{cop:"rlreset"}); const tG2=`thế giới 2 ${RUN}`; X.room.send("chat",{text:tG2,ch:"world"});
    ok(await got(Z,tG2,"world"),"hết hồi (hook rlreset): gửi được tin thế giới tiếp");

    // ---- Tông môn (#198): chưa thuộc tông thì báo; cùng tông nhận dù khác bản đồ; tông khác không nhận; rời tông là thôi nhận ----
    // Hook tong {set} đặt thẳng tông (bỏ qua sứ giả / cấp / chờ đổi, luật gia nhập thử ở tongTest).
    const [TA,TB]=TONG_MON;
    for(const b of [X,Y,Z]) await T(b,"tong",{set:null});
    ok(/chưa thuộc tông/.test(await said(X,{text:"tông ơi",ch:"tong"})),"chat tông khi chưa thuộc tông: báo lỗi riêng");
    await T(X,"tong",{set:TA.id}); await T(Z,"tong",{set:TA.id}); await T(Y,"tong",{set:TB.id});
    const tT=`tông ${RUN}`; X.room.send("chat",{text:tT,ch:"tong"});
    ok(await got(Z,tT,"tong")&&has(Z,tT,"tong").name===X.name,`chat tông ${TA.name}: Z ở bản đồ khác nhận (ch tong, tên người gửi)`);
    ok(await got(X,tT,"tong"),"người gửi cũng nhận tin tông của mình");
    await sleep(300); ok(!Y.chats.some(m=>m.text===tT),`Y thuộc ${TB.name} (cùng phòng với X): không nhận tin tông khác`);
    const tY=`tông khác ${RUN}`; Y.room.send("chat",{text:tY,ch:"tong"});
    ok(await got(Y,tY,"tong")&&(await sleep(300),!X.chats.some(m=>m.text===tY)&&!Z.chats.some(m=>m.text===tY)),`tin tông của Y chỉ tới ${TB.name}`);
    await T(Z,"tong",{set:null}); const tT2=`rời tông ${RUN}`; X.room.send("chat",{text:tT2,ch:"tong"});
    ok(await got(X,tT2,"tong")&&(await sleep(300),!Z.chats.some(m=>m.text===tT2)),"Z rời tông: thôi nhận chat tông ngay");

    // ---- Chống spam riêng từng kênh, độ dài, giá trị lạ ----
    await T(X,"chat",{cop:"rlreset"});
    for(let i=0;i<5;i++) X.room.send("chat",{text:`spam ${i} ${RUN}`,ch:"party"});
    await waitFor(()=>has(Z,`spam 4 ${RUN}`,"party"),2000);
    ok(/quá nhanh/.test(await said(X,{text:`spam 5 ${RUN}`,ch:"party"})),"tổ đội: tin thứ 6 liền nhau bị chặn (5 tin, hồi 1 tin / 2 giây)");
    const tMap2=`bđ vẫn được ${RUN}`; X.room.send("chat",{text:tMap2});
    ok(await got(Y,tMap2),"hết lượt tổ đội nhưng chat bản đồ vẫn gửi được (bucket riêng)");
    const tT3=`tông vẫn được ${RUN}`; X.room.send("chat",{text:tT3,ch:"tong"});
    ok(await got(X,tT3,"tong"),"hết lượt tổ đội nhưng chat tông vẫn gửi được (bucket riêng)");
    ok(/quá dài/.test(await said(Y,{text:"a".repeat(121),ch:"whisper",to:Z.name})),"tin quá CHAT_MAX_LEN ký tự bị từ chối");
    for(const m of [{text:"x",ch:"abc"},{text:"x",ch:5},{text:{toString:0},ch:"party"},{text:"x",ch:"whisper",to:{a:1}},{text:"x",ch:"world",to:7},{text:{a:1},ch:"tong"},{text:"x",ch:["tong"]},{text:["x"]},null,"x"]) X.room.send("chat",m);
    const tAfter=`còn kết nối ${RUN}`; await sleep(300); X.room.send("chat",{text:tAfter});
    ok(await got(Y,tAfter)&&X.leftCode===null,"chat mang kênh / người nhận / nội dung lạ: bỏ qua, không ngắt kết nối");

    // ---- Người nhận rời game: báo, không lưu ----
    await Z.room.leave(); await sleep(400);
    ok(/không trong game/.test(await said(Y,{text:"còn đó không",ch:"whisper",to:Z.name})),"Z rời game: tin riêng tới Z báo không trong game");
    await T(X,"chat",{cop:"rlreset"}); const tSolo=`đội vắng ${RUN}`; X.room.send("chat",{text:tSolo,ch:"party"});
    ok(await got(X,tSolo,"party"),"đồng đội rời game: chat tổ đội vẫn gửi cho người còn trong game");
  } finally { for(const b of [X,Y,Z]) if(b.room.connection?.isOpen) await b.room.leave().catch(()=>{}); } // rời phòng 2 lần thì leave() treo
}

/**
 * #195: bạn bè và chặn. Thêm một chiều / hai chiều (chỉ hai bên đã thêm nhau mới thấy online và bản đồ / kênh), lời "đã thêm bạn"
 * kèm "Thêm lại", người ở bản đồ khác, rời game; chặn lọc tin riêng, lời mời tổ đội, lời thêm bạn, chat bản đồ / tổ đội / thế giới và
 * tự bỏ khỏi danh sách bạn bè; trần FRIEND_MAX / BLOCK_MAX (tài khoản ngoại tuyến tạo bằng /api); dữ liệu còn sau khi thoát vào lại
 * (lượt PostgreSQL kiểm qua DB thật).
 */
export async function friendTest(){
  console.log("[#195] Bạn bè và chặn");
  const T=async(b,op,extra={})=>{ b.test=null; b.room.send("test",{op,...extra}); await waitFor(()=>b.test,2000); await sleep(80); return b.test; };
  /** Gửi `friend {op, name}`: chờ dòng log (kết quả hoặc lý do); thao tác thành công ("Đã …") thì chờ thêm bảng bạn bè mới. Trả các dòng log mới. */
  const F=async(b,op,name)=>{ const n=b.friendsN, l=b.logs.length; b.room.send("friend",{op,name});
    await waitFor(()=>b.logs.length>l,2000); if(/^Đã /.test(b.logs[l]??"")) await waitFor(()=>b.friendsN>n,2000); await sleep(50); return b.logs.slice(l).join(" | "); };
  const list=async b=>{ const n=b.friendsN; b.room.send("friend",{op:"list"}); await waitFor(()=>b.friendsN>n,2000); return b.friends; };
  const entry=(b,o)=>b.friends?.list?.find(e=>e.name===o.name);
  const said=async(b,msg)=>{ const l=b.logs.length; b.room.send("chat",msg); await waitFor(()=>b.logs.length>l,1500); await sleep(50); return b.logs.slice(l).join(" | "); };
  const has=(b,txt,ch)=>b.chats.some(m=>m.text===txt&&(ch?m.ch===ch:!m.ch));
  const A=await bot("Hữu A","bich_lan_xa_hoang",{sex:0,hair:1,hairCol:1,outfitCol:2}), B=await bot("Hữu B","nhu_cot_tho",{sex:1,hair:2,hairCol:0,outfitCol:1});
  const D=await bot("Hữu D","u_minh_linh_mieu",{sex:0,hair:0,hairCol:3,outfitCol:4}), C=await bot("Hữu C","nhu_cot_tho",{sex:1,hair:1,hairCol:2,outfitCol:3});
  const all=[A,B,C,D];
  try {
    if(!(await T(A,"ping"))?.enabled){ console.log("  ⚠ bỏ qua bạn bè (cần hook test): bật server bằng GAME_TEST=1"); return; }
    // C sang Nặc Đinh Thành (hook warp, như đi cổng): khác bản đồ với A, B, D.
    C.travel=null; await T(C,"warp",{mapId:"nac_dinh_thanh",x:0,y:0}); await waitFor(()=>C.travel,3000);
    if(C.travel){ const t=C.travel; await C.room.leave(); await sleep(200); C.mapId=t.mapId; await enter(C,t.roomId??undefined); }
    await waitFor(()=>C.room.state.mapId==="nac_dinh_thanh",2000);
    ok(A.room.roomId===B.room.roomId&&B.room.roomId===D.room.roomId&&C.room.state.mapId==="nac_dinh_thanh",`A, B, D cùng phòng ${A.room.state.mapId}; C ở ${C.room.state.mapId}`);
    for(const b of all){ await T(b,"friend",{fop:"rlreset"}); await T(b,"chat",{cop:"rlreset"}); }
    const l0=await list(A); ok(l0&&l0.list.length===0&&l0.blocks.length===0,"bảng bạn bè ban đầu trống");

    // ---- Thêm một chiều: A thấy B nhưng chưa thấy online / vị trí; B nhận lời "đã thêm bạn" kèm Thêm lại ----
    const nB=B.friendsN; ok(/Đã thêm/.test(await F(A,"add",B.name.toUpperCase())),"A thêm B (tên viết hoa)");
    ok(entry(A,B)&&entry(A,B).mutual===false&&entry(A,B).map===undefined&&entry(A,B).ch===undefined,`một chiều: A có B nhưng không thấy online / bản đồ ${JSON.stringify(entry(A,B))}`);
    await waitFor(()=>B.friendsN>nB&&B.friends?.added,2000);
    ok(B.friends?.added?.name===A.name&&B.friends.added.back===false&&B.friends.list.length===0,`B nhận "A đã thêm bạn" (nút Thêm lại): ${JSON.stringify(B.friends?.added)}`);
    ok(/đã có/.test(await F(A,"add",B.name)),"thêm lại người đã có: từ chối");
    ok(/chính mình/.test(await F(A,"add",A.name)),"tự thêm chính mình: từ chối");
    ok(/Không có hồn sư/.test(await F(A,"add",`Không Ai ${RUN}`)),"thêm tên không có: từ chối");

    // ---- Hai chiều: B thêm lại A, cả hai thấy nhau online, bản đồ / kênh ----
    const nA=A.friendsN; ok(/Đã thêm/.test(await F(B,"add",A.name)),"B thêm lại A");
    await waitFor(()=>A.friendsN>nA&&entry(A,B)?.mutual,2000);
    ok(entry(B,A)?.mutual&&entry(B,A).map===A.room.state.mapId&&entry(B,A).ch===A.room.state.channel,`B thấy A: ${JSON.stringify(entry(B,A))}`);
    ok(entry(A,B)?.mutual&&entry(A,B).map===B.room.state.mapId&&A.friends.added?.back===true,`A được báo B thêm lại (back), thấy B: ${JSON.stringify(entry(A,B))}`);
    // C ở bản đồ khác: thêm nhau thì thấy bản đồ của C.
    await F(A,"add",C.name); await F(C,"add",A.name); await list(A);
    ok(entry(A,C)?.mutual&&entry(A,C).map==="nac_dinh_thanh",`A thấy C ở bản đồ khác: ${JSON.stringify(entry(A,C))}`);
    // D chỉ được A thêm: D không có A nên D không thấy gì, A không thấy D online.
    await F(A,"add",D.name); await list(D);
    ok(entry(A,D)?.mutual===false&&entry(A,D).map===undefined&&D.friends.list.length===0,"A thêm D một chiều: A không thấy D online, D không có A");
    // Xóa rồi thêm lại liên tục: lời "đã thêm bạn" tới cùng người chỉ gửi lại sau một lúc.
    { await F(A,"remove",D.name); const n=D.friendsN, a0=D.friends?.added; D.friends.added=undefined;
      ok(/Đã thêm/.test(await F(A,"add",D.name)),"A xóa D rồi thêm lại ngay"); await sleep(400);
      ok(!D.friends?.added,`D không nhận lại lời "đã thêm bạn" ngay (chống làm phiền): ${D.friendsN-n} bảng mới`); D.friends.added=a0; }

    // ---- C rời game: A thấy C không còn online (vẫn là bạn hai chiều) ----
    { const n=A.friendsN; await C.room.leave(); await waitFor(()=>A.friendsN>n&&entry(A,C)&&entry(A,C).map===undefined,2000); }
    ok(entry(A,C)?.mutual===true&&entry(A,C).map===undefined,`C rời game: A thấy C ngoại tuyến ${JSON.stringify(entry(A,C))}`);

    // ---- Chặn: B chặn A; A tự bị bỏ khỏi danh sách bạn bè của B, A không còn thấy B online ----
    { const n=B.partyMsgs; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>B.partyMsgs>n&&B.party?.invites?.some(i=>i.name===A.name),2000); }
    { const n=A.partyMsgs; B.room.send("party",{op:"invite",name:A.name}); await waitFor(()=>A.partyMsgs>n&&A.party?.invites?.some(i=>i.name===B.name),2000); }
    ok(B.party?.invites?.some(i=>i.name===A.name)&&A.party?.invites?.some(i=>i.name===B.name),"A và B mời nhau vào tổ đội (trước khi chặn)");
    { const n=A.friendsN, pn=B.partyMsgs; ok(/Đã chặn/.test(await F(B,"block",A.name)),"B chặn A"); await waitFor(()=>A.friendsN>n,2000);
      await waitFor(()=>B.partyMsgs>pn,2000); await waitFor(()=>!A.party?.invites?.some(i=>i.name===B.name),2000);
      ok(!B.party?.invites?.some(i=>i.name===A.name)&&!A.party?.invites?.some(i=>i.name===B.name),"chặn thì lời mời tổ đội đang chờ giữa hai người bị bỏ (cả hai chiều)");
      const l=A.logs.length; A.room.send("party",{op:"accept",name:B.name}); await waitFor(()=>A.logs.length>l,1500);
      ok(!A.party?.id&&/hiệu lực|không nhận/.test(A.logs.slice(l).join(" | ")),`A không vào được tổ đội của B (người đã chặn A): ${A.logs.slice(l).join(" | ")}`); }
    await T(A,"party",{pop:"rlreset"});
    ok(!entry(B,A)&&B.friends.blocks.includes(A.name),`chặn thì tự xóa A khỏi bạn bè của B, A vào danh sách chặn: ${JSON.stringify(B.friends)}`);
    ok(entry(A,B)?.mutual===false&&entry(A,B).map===undefined,"A vẫn có B (một chiều) nhưng không còn thấy B online");
    ok(/đã ở trong danh sách chặn/.test(await F(B,"block",A.name)),"chặn lại người đã chặn: từ chối");
    ok(/bỏ chặn trước/.test(await F(B,"add",A.name)),"thêm bạn người đang chặn: phải bỏ chặn trước");
    // Lời thêm bạn của A không tới B.
    await F(A,"remove",B.name); ok(!entry(A,B),"A xóa B khỏi danh sách của mình"); await T(A,"friend",{fop:"rlreset"});
    { const n=B.friendsN; ok(/Đã thêm/.test(await F(A,"add",B.name)),"A thêm B (A không biết bị chặn, danh sách của mình)");
      await sleep(400); ok(!(B.friendsN>n&&B.friends?.added),"B đã chặn A: không nhận lời thêm bạn của A"); }
    // Tin riêng.
    const tW=`riêng ${RUN}`; ok(/không nhận tin riêng/.test(await said(A,{text:tW,ch:"whisper",to:B.name})),"A nhắn riêng B (đã chặn A): báo không gửi được");
    await sleep(200); ok(!has(B,tW,"whisper"),"B không nhận tin riêng của A");
    ok(/đang chặn/.test(await said(B,{text:"alo",ch:"whisper",to:A.name})),"B nhắn riêng người mình chặn: phải bỏ chặn trước");
    // Lời mời tổ đội.
    { const l=A.logs.length; A.room.send("party",{op:"invite",name:B.name}); await waitFor(()=>A.logs.length>l,1500);
      ok(/không nhận lời mời tổ đội/.test(A.logs.slice(l).join(" | ")),"A mời B vào tổ đội: bị chặn"); }
    B.room.send("party",{op:"get"}); await sleep(300); ok(!(B.party?.invites??[]).some(i=>i.name===A.name),"B không có lời mời của A");
    // Chat bản đồ: D (cùng phòng) nhận, B không.
    const tM=`bản đồ ${RUN}`; A.room.send("chat",{text:tM});
    ok(await waitFor(()=>has(D,tM),2000),"chat bản đồ của A: D nhận"); await sleep(300); ok(!has(B,tM),"chat bản đồ của A: B (đã chặn A) không nhận");
    const tMB=`bản đồ B ${RUN}`; B.room.send("chat",{text:tMB}); ok(await waitFor(()=>has(A,tMB),2000),"chặn một chiều: A vẫn nhận chat bản đồ của B");
    // Chat thế giới: D nhận, B không.
    await T(A,"set",{rowId:A.owned.active,level:WORLD_CHAT.minLevel}); await waitFor(()=>A.room.state.players.get(A.room.sessionId)?.level>=WORLD_CHAT.minLevel,2000);
    const tG=`thế giới ${RUN}`; A.room.send("chat",{text:tG,ch:"world"});
    ok(await waitFor(()=>has(D,tG,"world"),2000),"chat thế giới của A: D nhận"); await sleep(300); ok(!has(B,tG,"world"),"chat thế giới của A: B không nhận");
    // Chat tổ đội: D mời A và B (D không bị chặn); tin tổ đội của A tới D, không tới B.
    for(const x of [A,B]){ const n=x.partyMsgs; D.room.send("party",{op:"invite",name:x.name}); await waitFor(()=>x.partyMsgs>n&&x.party?.invites?.length,2000); x.room.send("party",{op:"accept",name:D.name}); await sleep(300); }
    await waitFor(()=>D.party?.members?.length===3,2000); ok(D.party?.members?.length===3,"D, A, B cùng tổ đội");
    const tP=`đội ${RUN}`; A.room.send("chat",{text:tP,ch:"party"});
    ok(await waitFor(()=>has(D,tP,"party"),2000),"chat tổ đội của A: D nhận"); await sleep(300); ok(!has(B,tP,"party"),"chat tổ đội của A: B không nhận");
    ok(await waitFor(()=>has(A,tP,"party"),2000),"A vẫn nhận bản sao tin tổ đội của mình");
    // Chat tông (#198): A, B, D cùng tông; tin tông của A tới D, không tới B.
    for(const x of [A,B,D]) await T(x,"tong",{set:TONG_MON[0].id});
    const tT=`tông ${RUN}`; A.room.send("chat",{text:tT,ch:"tong"});
    ok(await waitFor(()=>has(D,tT,"tong"),2000),"chat tông của A: D nhận"); await sleep(300); ok(!has(B,tT,"tong"),"chat tông của A: B không nhận");
    for(const x of [A,B,D]) await T(x,"tong",{set:null});
    for(const x of [A,B,D]) x.room.send("party",{op:"leave"}); await sleep(300);
    // Bỏ chặn: tin riêng tới được.
    ok(/Đã bỏ chặn/.test(await F(B,"unblock",A.name.toLowerCase()))&&!B.friends.blocks.includes(A.name),"B bỏ chặn A (tên viết thường)");
    ok(/không có trong danh sách chặn/.test(await F(B,"unblock",A.name)),"bỏ chặn người không bị chặn: từ chối");
    await T(A,"chat",{cop:"rlreset"}); const tW2=`riêng 2 ${RUN}`; A.room.send("chat",{text:tW2,ch:"whisper",to:B.name});
    ok(await waitFor(()=>has(B,tW2,"whisper"),2000),"bỏ chặn rồi: B nhận tin riêng của A");

    // ---- Message lạ: bỏ qua, không ngắt kết nối ----
    for(const m of [{op:{}},{op:"add",name:{toString:0}},{op:"add",name:5},{op:"block",name:["x"]},{op:"zzz",name:"a"},null,"add",{op:"add",name:"   "}]) A.room.send("friend",m);
    await sleep(300); ok(A.leftCode===null&&(await list(A))?.list,"friend mang giá trị lạ: bỏ qua, không ngắt kết nối");

    // ---- Thoát vào lại: danh sách còn (DB), bạn hai chiều ngoại tuyến vẫn là hai chiều ----
    await A.room.leave(); await sleep(400); A.mapId=(await post("/api/me",{token:A.token})).mapId; await enter(A); await waitFor(()=>A.owned,3000);
    await list(A);
    ok(entry(A,B)&&entry(A,C)?.mutual===true&&entry(A,C).map===undefined&&entry(A,D)?.mutual===false,`vào lại: A vẫn có B, C (hai chiều, ngoại tuyến), D ${JSON.stringify(A.friends?.list)}`);
    await list(B); ok(B.friends.list.length===0&&B.friends.blocks.length===0,"B: danh sách bạn bè / chặn trống sau khi chặn rồi bỏ chặn");
    await F(B,"add",A.name); await list(A); ok(entry(A,B)?.mutual&&entry(A,B).map===B.room.state.mapId,"B thêm lại A sau khi bỏ chặn: hai bên lại thấy nhau");

    // ---- Trần FRIEND_MAX / BLOCK_MAX: tài khoản ngoại tuyến (đã thức tỉnh) tạo bằng /api ----
    const E=await bot("Hữu E","bich_lan_xa_hoang",{sex:0,hair:2,hairCol:1,outfitCol:0}); all.push(E);
    const names=[];
    for(let i=0;i<=BLOCK_MAX;i+=10) names.push(...(await Promise.all(Array.from({length:Math.min(10,BLOCK_MAX+1-i)},async(_,k)=>{
      const j=i+k, name=`Hữu ${j} ${RUN}`, l=await post("/api/login",{name,password:PASS});
      await post("/api/looks",{token:l.token,sex:j%2,hair:j%4,hairCol:j%5,outfitCol:j%6});
      return (await post("/api/awaken",{token:l.token,vohon:AWAKEN_CHOICES[j%AWAKEN_CHOICES.length].id})).status===200?name:null; }))));
    ok(names.length===BLOCK_MAX+1&&names.every(Boolean),`tạo ${names.length} tài khoản ngoại tuyến`);
    let fOk=0; for(let i=0;i<FRIEND_MAX;i++){ if(i%9===0) await T(E,"friend",{fop:"rlreset"}); if(/Đã thêm/.test(await F(E,"add",names[i]))) fOk++; }
    await T(E,"friend",{fop:"rlreset"});
    ok(fOk===FRIEND_MAX&&E.friends.list.length===FRIEND_MAX&&E.friends.list.every(e=>!e.mutual&&e.map===undefined),`thêm ${fOk} bạn ngoại tuyến (một chiều)`);
    ok(new RegExp(`đủ ${FRIEND_MAX}`).test(await F(E,"add",names[FRIEND_MAX])),`bạn thứ ${FRIEND_MAX+1}: từ chối (FRIEND_MAX)`);
    let bOk=0; for(let i=0;i<BLOCK_MAX;i++){ if(i%9===0) await T(E,"friend",{fop:"rlreset"}); if(/Đã chặn/.test(await F(E,"block",names[i]))) bOk++; }
    await T(E,"friend",{fop:"rlreset"});
    ok(bOk===BLOCK_MAX&&E.friends.blocks.length===BLOCK_MAX&&E.friends.list.length===0,`chặn ${bOk} người (${FRIEND_MAX} bạn tự bị xóa khỏi danh sách bạn bè)`);
    ok(new RegExp(`đủ ${BLOCK_MAX}`).test(await F(E,"block",names[BLOCK_MAX])),`chặn người thứ ${BLOCK_MAX+1}: từ chối (BLOCK_MAX)`);
    // Chống spam: quá 10 thao tác liền thì bị chặn lượt.
    let rl=""; for(let i=0;i<12&&!rl;i++){ const r=await F(E,"unblock",names[i]); if(/quá nhanh/.test(r)) rl=r; }
    ok(/quá nhanh/.test(rl),`thao tác bạn bè dồn dập: báo quá nhanh (${rl})`);
    await E.room.leave(); await sleep(400); E.mapId=(await post("/api/me",{token:E.token})).mapId; await enter(E); await waitFor(()=>E.owned,3000);
    await list(E); ok(E.friends.list.length===0&&E.friends.blocks.length===BLOCK_MAX-10&&!E.friends.blocks.includes(names[0])&&E.friends.blocks.includes(names[BLOCK_MAX-1]),
      `vào lại: danh sách chặn còn ${E.friends.blocks.length} người (đã bỏ chặn 10)`);
  } finally { for(const b of all) if(b.room.connection?.isOpen) await b.room.leave().catch(()=>{}); }
}
