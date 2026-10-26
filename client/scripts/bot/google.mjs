// Nhóm bot "google" (#703, tách từ bot-test.mjs): đăng nhập Google qua bộ kiểm giả. Chỉ cần API / post / RUN / PASS / ok từ lib.
import { API, post, RUN, PASS, ok } from "./lib.mjs";

/**
 * Đăng nhập Google (SSO1 #612, BOT_ONLY=google): bộ kiểm giả `test:<sub>[:tên]` (chỉ GAME_TEST=1). Google mới -> vé + tên gợi ý -> chọn tên -> vào game;
 * đăng nhập lại; tên trùng / sai luật; vé giả; liên kết tài khoản mật khẩu (một Google một tài khoản, một tài khoản một Google); credential hỏng.
 * Server không bật GAME_TEST thì bộ kiểm giả bị từ chối: bài báo bỏ qua phần còn lại.
 */
export async function googleTest(){
  console.log("— Đăng nhập Google (#612)");
  const cfg=await (await fetch(API+"/api/config")).json();
  const probe=await post("/api/login/google",{credential:`test:probe${RUN}`});
  if(probe.status!==200){ ok(probe.status===401||probe.status===503,`server không bật GAME_TEST: bộ kiểm giả bị từ chối (${probe.status}), bỏ qua phần còn lại`); return; }
  ok(typeof cfg.googleClientId==="string","GET /api/config có googleClientId khi bật đăng nhập Google");
  const A=`test:a${RUN}`, B=`test:b${RUN}`, C=`test:c${RUN}`;
  ok(probe.needName===true&&!!probe.ticket&&!("token" in probe),"Google mới: chưa có tài khoản, trả vé chọn tên, không cấp token");
  ok(!JSON.stringify(probe).includes("@"),"phản hồi không chứa email");
  const a=await post("/api/login/google",{credential:`${A}:Hiệp Sĩ Gợi Ý`});
  ok(a.needName&&a.suggest==="Hiệp Sĩ Gợi Ý",`tên gợi ý lấy từ tên Google (${a.suggest})`);
  const name=`Gg ${RUN}`;
  ok((await post("/api/login/google/create",{ticket:a.ticket,name:"a!"})).status===400,"tên sai luật bị từ chối");
  ok((await post("/api/login/google/create",{ticket:a.ticket+"x",name})).status===401,"vé bị sửa bị từ chối");
  ok((await post("/api/login/google/create",{ticket:"",name})).status===401,"thiếu vé bị từ chối");
  const made=await post("/api/login/google/create",{ticket:a.ticket,name});
  ok(made.status===200&&!!made.token&&!made.looks?.chosen&&made.character===null,"chọn tên: tạo tài khoản mới, trả token, chưa tạo nhân vật");
  const ch=await post("/api/channel",{token:made.token}); ok(ch.status===200&&typeof ch.mapId==="string","token Google dùng được cho /api/channel (vào game)");
  ok((await post("/api/me",{token:made.token})).googleLinked===true,"/api/me báo đã liên kết Google");
  ok((await post("/api/login/google/create",{ticket:a.ticket,name:`Gg2 ${RUN}`})).status===409,"vé dùng lại sau khi đã có tài khoản: bị từ chối (một Google một tài khoản)");
  const again=await post("/api/login/google",{credential:A});
  ok(again.status===200&&!!again.token&&!again.needName&&again.token!==made.token,"đăng nhập Google lần sau: vào thẳng, token mới");
  const b=await post("/api/login/google",{credential:B});
  ok((await post("/api/login/google/create",{ticket:b.ticket,name:name.toUpperCase()})).status===409,"tên trùng (khác hoa / thường) bị từ chối");
  ok((await post("/api/login/google/create",{ticket:b.ticket,name:`Gb ${RUN}`})).status===200,"đổi tên khác thì tạo được (cùng vé)");
  const pw=await post("/api/login",{name:`Gp ${RUN}`,password:PASS});
  ok((await post("/api/me",{token:pw.token})).googleLinked===false,"tài khoản mật khẩu: chưa liên kết Google");
  ok((await post("/api/link/google",{token:"x".repeat(32),credential:C})).status===401,"liên kết cần token đăng nhập hợp lệ");
  ok((await post("/api/link/google",{token:pw.token,credential:"test:"})).status===401,"credential hỏng bị từ chối");
  ok((await post("/api/link/google",{token:pw.token,credential:A})).status===409,"Google đã thuộc tài khoản khác: không liên kết được");
  const lk=await post("/api/link/google",{token:pw.token,credential:C});
  ok(lk.status===200&&lk.googleLinked,"liên kết Google cho tài khoản mật khẩu");
  ok((await post("/api/link/google",{token:pw.token,credential:C})).status===200,"liên kết lại đúng Google đó: vẫn ổn");
  ok((await post("/api/link/google",{token:pw.token,credential:`test:d${RUN}`})).status===409,"một tài khoản tối đa một Google");
  const viaG=await post("/api/login/google",{credential:C});
  ok(viaG.status===200&&!viaG.needName&&!!viaG.token,"sau khi liên kết: vào bằng Google");
  ok((await post("/api/me",{token:viaG.token})).googleLinked===true&&(await post("/api/me",{token:pw.token})).googleLinked===true,"/api/me báo đã liên kết");
  ok((await post("/api/login/google",{credential:"test:bad id!"})).status===401&&(await post("/api/login/google",{credential:"khong-phai-jwt-hop-le"})).status===401,"credential hỏng bị từ chối");
}
