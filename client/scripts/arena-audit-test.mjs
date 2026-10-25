// Soát chống gian lận Đại Đấu Hồn Trường (#741, vòng 4b): mỗi giả thuyết một khối bên dưới, báo cáo ở docs/tech/soat-gian-lan-dai-dau-hon-truong.md.
// Gọi từ bot-test.mjs (BOT_ONLY=arenaAudit, hoặc nhóm BOT_PART), truyền các hàm dùng chung `h`; không import ngược bot-test.
//   ok(...)     hành vi đúng đang được giữ: sai thì bài thất bại.
//   known(...)  LỖ HỖNG ĐÃ BIẾT (kèm issue sửa): mặc định chỉ in cảnh báo để CI không đỏ; AUDIT_STRICT=1 thì thất bại, dùng khi kiểm bản vá.
// Không sửa server: các điểm yếu chỉ được ghi nhận và tách issue riêng.

export async function arenaAuditTest(h) {
  const { bot, enter, test, post, waitFor, sleep, ok, npcSpot, AT, ARENA, MAPS, TEAM_SIZE } = h;
  const strict = process.env.AUDIT_STRICT === "1";
  let holes = 0;
  const known = (good, msg, issue) => {
    if (good) return ok(true, `${msg} (đã được sửa${issue ? `, ${issue}` : ""})`);
    holes++;
    if (strict) return ok(false, msg);
    console.log(`  ⚠ LỖ HỖNG ĐÃ BIẾT${issue ? ` (${issue})` : ""}: ${msg}`);
    return false;
  };
  console.log("[#741] Soát chống gian lận Đại Đấu Hồn Trường");

  const A = await bot("Soát đấu A", "bich_lan_xa_hoang", { sex: 0, hair: 1, hairCol: 3, outfitCol: 1 });
  const B = await bot("Soát đấu B", "hoa_anh", { sex: 1, hair: 2, hairCol: 1, outfitCol: 3 });
  const C = await bot("Soát đấu C", "u_minh_linh_mieu", { sex: 0, hair: 0, hairCol: 2, outfitCol: 4 });
  const all = [A, B, C];
  if (!(await test(A, "ping"))?.enabled) {
    console.log("  ⚠ bỏ qua soát đấu trường (cần hook warp, aslow, afast, down): bật server bằng GAME_TEST=1");
    for (const b of all) await b.room.leave();
    return;
  }
  const ns = npcSpot(AT, "dau_hon_truong"), meOf = (b) => b.room.state.players?.get(b.room.sessionId);
  const at = (b, dx = 0) => test(b, "goto", { x: ns.x + dx, y: ns.y + 16 });
  const endOf = (b) => b.arena.filter((m) => m.k === "end").at(-1);
  async function back(b) { b.mapId = (await post("/api/me", { token: b.token })).mapId; await enter(b); await waitFor(() => meOf(b) && b.owned && b.bag && b.squad, 3000); }
  async function warpTown(b) {
    b.travel = null; b.room.send("test", { op: "warp", mapId: AT, x: ns.x, y: ns.y + 16 });
    ok(await waitFor(() => b.travel?.mapId === AT, 4000), `${b.name}: tới ${MAPS[AT].name}`);
    await b.room.leave(); await sleep(300); await back(b);
  }
  const qwait = () => sleep(ARENA.queueCd * 1000 + 50);
  async function aop(b, op) {
    if (op === "queue") await qwait();
    const l = b.logs.length, n = b.aqN; b.room.send("arena", { op }); await waitFor(() => b.aqN > n && (op !== "queue" || b.logs.length > l), 2000);
    await sleep(60); return b.logs.slice(l).at(-1) ?? "";
  }
  for (const b of all) { await warpTown(b); await at(b, all.indexOf(b) * 10 - 10); }

  // ---- (b) `arena watch` / `arena live` không hạn nhịp ----
  // `live` có nhịp ARENA.topCd (arenaLiveAt), `watch` cũng vậy (arenaWatchAt, #789). Trước khi sửa `watch` không có nhịp: mỗi tin tới lượt khóa sổ presence `arena:live` dùng chung mọi tiến trình
  // (arenaLiveHold -> liveEdit -> withLock) kể cả khi mã phòng không có thật. Đo bằng số phản hồi đã được xử lý.
  {
    const N = 25, n = A.arena.length;
    for (let i = 0; i < N; i++) A.room.send("arena", { op: "live" });
    await sleep(1500);
    const lives = A.arena.slice(n).filter((m) => m.k === "live").length;
    ok(lives >= 1 && lives <= 2, `live: ${N} tin dồn trong một nhịp chỉ trả ${lives} lần (nhịp ${ARENA.topCd} giây)`);
    const l2 = A.logs.length;
    for (let i = 0; i < N; i++) A.room.send("arena", { op: "watch", roomId: "khong-co-that" });
    await sleep(1500);
    const watches = A.logs.slice(l2).filter((x) => /không còn diễn ra/.test(x)).length;
    ok(watches === 1, `watch mã phòng không có thật: ${N} tin dồn, server xử lý ${watches} lượt (nhịp ${ARENA.topCd} giây, #789)`);
  }

  // ---- đầu vào lạ cho `arena` (op, roomId sai kiểu / dài 3000 ký tự (dài hơn 4 KB thì ws ngắt kết nối)): không ném lỗi, phòng vẫn sống ----
  {
    const weird = [null, 5, "queue", [], {}, { op: {} }, { op: ["queue"] }, { op: null }, { op: 7 }, { op: "watch" }, { op: "watch", roomId: {} },
      { op: "watch", roomId: ["a"] }, { op: "watch", roomId: "x".repeat(3000) }, { op: "WATCH", roomId: "a" }];
    await sleep(ARENA.topCd * 1000 + 50);
    for (const w of weird) A.room.send("arena", w);
    await sleep(500);
    ok(A.leftCode === null && !!(await test(A, "ping"))?.enabled, `${weird.length} tin arena sai kiểu / dài 3000 ký tự (dài hơn 4 KB thì ws ngắt kết nối): phòng vẫn sống, không bị ngắt`);
    ok(!A.aq?.on, "tin lạ không xếp hàng nhầm");
  }

  // ---- (c) lách arenaBusy trong lúc đọc Elo ----
  // Rời phòng giữa lúc đọc: không được để lại mục ma trong hàng chờ (B xếp hàng sau đó không được ghép với người đã rời), và tài khoản vào lại xếp hàng bình thường.
  {
    await test(A, "aslow", { ms: 1500 });
    await qwait(); A.room.send("arena", { op: "queue" }); await sleep(100);
    await A.room.leave(); await sleep(200);
    const nB = B.arena.length; await aop(B, "queue");
    await sleep(ARENA.queueCd * 1000 + 3500);
    ok(!B.arena.slice(nB).some((m) => m.k === "found") && B.aq?.on, "A rời phòng giữa lúc đọc Elo: không thành mục ma, B không bị ghép với A");
    await aop(B, "cancel");
    await back(A); await at(A, -10);
    const t = await aop(A, "queue");
    ok(/Đang tìm đối thủ/.test(t), `A vào lại: xếp hàng được, không kẹt cờ arenaBusy (${t})`);
    await aop(A, "cancel");
  }
  // Gục trong lúc đọc Elo: kiểm lại arenaBusy sau khi đọc xong (`late`), không vào hàng chờ khi đã gục.
  {
    await test(C, "aslow", { ms: 1200 });
    await qwait(); C.room.send("arena", { op: "queue" }); await sleep(50);
    for (let j = 0; j < TEAM_SIZE && !meOf(C).dead; j++) await test(C, "down");
    await sleep(1800);
    ok(!C.aq?.on && C.logs.some((x) => /Đã gục ngã\. Chưa xếp hàng được/.test(x)), "gục trong lúc đọc Elo: đọc xong vẫn bị từ chối, không vào hàng chờ");
    // Một tài khoản gục không được chờ sẵn trong hàng cho người khác ghép: B xếp hàng, C vẫn không xuất hiện.
    const nB = B.arena.length; await aop(B, "queue"); await sleep(2500);
    ok(!B.arena.slice(nB).some((m) => m.k === "found"), "B xếp hàng cạnh C đã gục: không ghép được với C");
    await aop(B, "cancel");
  }

  // ---- (a) nuôi Elo: trận bỏ cuộc (noshow) vẫn tính Elo + thưởng + một lượt arena_pairs ----
  // Tài khoản phụ xếp hàng rồi không vào sân: người còn lại thắng "đối thủ không vào sân" có Elo và phần thưởng đủ, không phải đánh ai.
  // Trần duy nhất là arena_pairs (ARENA.pairDaily trận / cặp / ngày) và ARENA.dailyWins lượt thưởng / tài khoản / ngày; không có trần Elo theo ngày.
  {
    await at(A, -12); await at(B, 12);
    const nA = A.arena.length, nB = B.arena.length;
    await aop(A, "queue"); await aop(B, "queue");
    const fa = () => A.arena.slice(nA).filter((m) => m.k === "found").at(-1);
    ok(await waitFor(() => fa() && B.arena.slice(nB).some((m) => m.k === "found"), 4000), "A và B (Elo khởi đầu) được ghép");
    await A.room.leave(); await enter(A, fa().roomId); await waitFor(() => meOf(A) && A.owned && A.bag && A.squad, 3000);
    await test(A, "afast", { s: 0 }); // B không vào sân: hết ARENA.joinSecs
    ok(await waitFor(() => endOf(A), 4000), "hết giờ chờ vào sân: trận kết thúc");
    const e = endOf(A);
    if (!e) { for (const b of all) await b.room.leave(); return; } // thiếu tin end: đã ghi thất bại ở trên, bỏ phần còn lại của khối
    ok(e.reason === "noshow" && e.score === 1, `A thắng vì B không vào sân (${e.reason})`);
    known(!(e.elo1 > e.elo0 || e.reward), `thắng bỏ cuộc vẫn đổi Elo ${e.elo0} → ${e.elo1}${e.reward ? " và có thưởng" : ""} (tài khoản phụ xếp hàng rồi bỏ đi nuôi Elo, chỉ bị chặn bởi arena_pairs)`, "#790");
    await test(A, "afast", { s: 0 });
    await waitFor(() => A.leftCode === 4005, 3000); await back(A);
    await waitFor(() => B.leftCode === 4006, ARENA.joinSecs * 1000 + 2000); await back(B);
  }

  console.log(`  ${holes ? `⚠ ${holes} lỗ hổng đã biết (xem docs/tech/soat-gian-lan-dai-dau-hon-truong.md)` : "không còn lỗ hổng đã biết"}`);
  for (const b of all) await b.room.leave();
}
