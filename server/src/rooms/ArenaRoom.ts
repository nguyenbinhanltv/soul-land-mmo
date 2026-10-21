// Phòng Đại Đấu Hồn Trường (mục 5.9, bước 7.2): một trận đấu đội võ hồn 1v1 giữa hai hồn sư đã ghép ở hàng chờ (arenaQueue.ts).
// Lớp con của MapRoom trên sân `ARENA_MAP`: dùng lại nguyên vòng lặp, di chuyển, đánh thường, hồn kỹ, tiên cơ, kỹ năng hồn cốt, đổi
// võ hồn, gục từng võ hồn; MapRoom.foesOf trả đối thủ khi đang giao đấu nên đòn đánh trúng được hồn sư bên kia (damageFoe). Ở đây chỉ
// có luật riêng của trận: các pha (chờ vào sân, đếm ngược, giao đấu, kết quả), thắng thua, Elo, thưởng, rời sân = thua.
// Server quyết định mọi thứ; client chỉ gửi ý định như ở bản đồ (mục 6).
import { Client, ServerError } from "colyseus";
import { MapRoom, type AuthData, type PData } from "./MapRoom.ts";
import { ArenaState, ArenaSide } from "./schema.ts";
import { ARENA, ARENA_MAP, ARENA_SHARDS, arenaRanked, dir4, eloAfter, shardCode, sellPrice, type ArenaRecord } from "../../../shared/data.ts";
import { arenaMatches, type ArenaMatch } from "./arenaQueue.ts";
import { store, type Item, type Bag } from "../db.ts";

type Phase = "wait" | "ready" | "fight" | "end";
type Reason = "ko" | "time" | "leave" | "noshow";
/** Một bên của trận: tài khoản, thành tích trước trận (Elo dùng để tính), phiên đang ở sân, đã rời sân, lượt thắng có thưởng hôm nay. */
interface Side { accountId: number; name: string; rec: ArenaRecord; sid: string; left: boolean; claims: number; }
/**
 * Phần thưởng thắng đã chuẩn bị nhưng CHƯA vào túi đang chơi: túi và Hồn Tệ sau khi thưởng (`items`, `honTeAfter`, chỉ áp vào sau khi
 * DB xác nhận còn lượt), ảnh chụp để ghi DB (`bag`), và phần báo client (`honTe`, `code`, `qty`, `coin`).
 */
interface Reward { items: Item[]; honTeAfter: number; bag: Bag; honTe: number; code: string; qty: number; coin: number; }

/**
 * Message chỉ dùng ngoài trận: chặn trong sân (xếp đội, xếp ô hồn kỹ mang theo (8.1a), hấp thụ, gắn / tháo / cường hóa đồ, dùng đan,
 * mua bán, đi cổng, NPC…), để
 * chỉ số hai bên cố định suốt trận và trận không làm đổi đồ ngoài phần thưởng. Đăng ký lại đè handler của MapRoom (message chưa đăng
 * ký làm Colyseus ngắt kết nối client, nên không bỏ hẳn).
 */
const BLOCKED = ["absorb", "pickup", "discard", "team", "travel", "use", "open", "unlock", "starup", "equip", "unequip", "equipcore",
  "unequipcore", "enhance", "enhancecore", "talk", "buy", "sell", "buyback", "expand", "loadout"];
const REASON_TEXT: Record<Reason, string> = { ko: "hạ hết đội võ hồn", time: "hết giờ, so sinh lực cả đội", leave: "đối thủ rời sân", noshow: "đối thủ không vào sân" };
/** Mã đóng kết nối khi trận đã xong và hết ARENA.endSecs: client tự quay về bản đồ cũ. */
export const ARENA_END_CODE = 4005;

export class ArenaRoom extends MapRoom {
  // Không chia kênh (mục 6 "Nhiều kênh"): mỗi trận một phòng riêng 2 người, không theo CHANNEL_MAX; `state.channel` = 0 nên MapRoom
  // không cấp số kênh, không khóa kênh khi rời sân, tin `channel` bị từ chối;
  // rời sân thì vào bản đồ cũ theo pickChannel (kênh đồng đội, không thì ít người nhất).
  maxClients = 2;
  state = new ArenaState();
  match!: ArenaMatch;
  sides: Side[] = [];
  /** Trận đã có kết quả (finish chỉ chạy một lần); `kicked`: đã đưa mọi người ra khỏi sân. */
  done = false; kicked = false;
  syncT = 0;

  get phase() { return this.state.phase as Phase; }
  setPhase(p: Phase, secs: number) { this.state.phase = p; this.state.time = secs; }

  onCreate(options: { mapId?: unknown; matchId?: unknown }) {
    // Mỗi trận đã ghép đúng một phòng: phòng đầu tiên nhận trận, lần mở thứ hai (kể cả client tự gọi create("arena")) bị từ chối.
    const m = typeof options?.matchId === "string" ? arenaMatches.get(options.matchId) : undefined;
    if (!m || m.roomId) throw new ServerError(400, "Trận đấu không tồn tại.");
    m.roomId = this.roomId;
    this.match = m;
    this.sides = m.sides.map((s) => ({ accountId: s.accountId, name: s.name, rec: { ...s.rec }, sid: "", left: false, claims: 0 }));
    // Chỉ vào được bằng mã phòng (joinById) do server gửi cho đúng hai người đã ghép.
    void this.setPrivate(true);
    this.setup(ARENA_MAP);
    for (const s of this.sides) { const a = new ArenaSide(); a.name = s.name; a.elo = s.rec.elo; this.state.sides.push(a); }
    // Chống dàn xếp (9.7): báo trước cho hai bên nếu cặp đã đủ ARENA.pairDaily trận tính Elo hôm nay. Chỉ để hiển thị; trận có tính
    // Elo không là do lần đếm lúc hết trận (finish) quyết định.
    const [a, b] = this.sides.map((x) => x.accountId);
    store.arenaPairCount(this.today(), a, b).then((n) => { if (!this.done) this.state.friendly = !arenaRanked(n + 1); },
      (e) => console.error("Không đọc được số trận của cặp đấu hồn", e));
    this.setPhase("wait", ARENA.joinSecs);
    for (const t of BLOCKED) this.onMessage(t, (c) => this.log(c.sessionId, "Đang ở Đại Đấu Hồn Trường: không làm được việc này trong trận.", "#ffb35c"));
    this.onMessage("quest", (c, msg: { op: unknown }) => {
      if (msg?.op === "get") { this.sendQuest(c.sessionId); this.sendDaily(c.sessionId); } else this.log(c.sessionId, "Đang ở Đại Đấu Hồn Trường: nhiệm vụ để sau trận.", "#ffb35c");
    });
    this.onMessage("arena", (c, msg: { op: unknown }) => { if (msg?.op === "top") this.arenaTop(c.sessionId); });
  }

  /** Chỉ hai người của trận được vào, mỗi người một lần (rời sân là bỏ trận); không đối chiếu bản đồ đang đứng (vẫn là bản đồ cũ). */
  async checkJoin(accountId: number) {
    const s = this.sides.find((x) => x.accountId === accountId);
    if (!s) throw new ServerError(403, "Bạn không ở trong trận đấu này.");
    if (s.left || this.done) throw new ServerError(409, "Trận đấu đã kết thúc.");
    const [ch, looks, loc] = await Promise.all([store.getCharacter(accountId), store.getLooks(accountId), store.getLocation(accountId)]);
    if (!looks.chosen || !ch) throw new ServerError(403, "Chưa có hồn sư.");
    return { ch, looks, loc };
  }

  async onAuth(client: Client, options: { token?: string }) {
    const auth = await super.onAuth(client, options);
    const s = this.sides.find((x) => x.accountId === auth.accountId)!;
    s.claims = await store.bossClaims(auth.accountId, this.today(), ARENA.claimKind);
    return auth;
  }

  /** Vào sân: cả đội đầy sinh lực (MapRoom.onJoin hồi đầy, chưa gục võ hồn nào), đứng ở hai phía sân (1/4 và 3/4 chiều ngang) quay mặt vào nhau. */
  onJoin(client: Client, o: unknown, auth: AuthData) {
    super.onJoin(client, o, auth);
    const i = this.sides.findIndex((x) => x.accountId === auth.accountId), p = this.state.players.get(client.sessionId)!, d = this.pdata.get(client.sessionId)!;
    this.sides[i].sid = client.sessionId; this.state.sides[i].sid = client.sessionId;
    const sp = this.map.spawn;
    p.x = Math.round(sp.x + sp.w * (i === 0 ? 0.25 : 0.75)); p.y = Math.round(sp.y + sp.h / 2);
    d.dir = { x: i === 0 ? 1 : -1, y: 0 }; p.dir = dir4(d.dir.x, 0);
    this.syncSides();
    if (this.phase === "wait" && this.sides.every((x) => x.sid)) {
      this.setPhase("ready", ARENA.readySecs);
      this.broadcast("arena", { k: "ready", secs: ARENA.readySecs });
    }
  }

  /** Rời sân trước khi có kết quả (đóng tab, mất mạng, bấm rời) là bỏ trận: thua (mục 5.9, bước 7.2). */
  async onLeave(client: Client) {
    const i = this.sides.findIndex((x) => x.sid === client.sessionId);
    if (i >= 0 && !this.done) { this.sides[i].left = true; this.finish(1 - i, "leave"); }
    await super.onLeave(client);
  }

  /** Rời sân là về bản đồ cũ, không phải rời game: giữ danh sách mua lại của thương nhân (9.8). */
  override forgetBuyback() {}

  async onDispose() {
    await super.onDispose();
    arenaMatches.delete(this.match?.id);
  }

  // ---------- Luật trận đấu ----------
  /** Đối thủ chỉ có khi đang giao đấu: chờ, đếm ngược, kết quả thì không ai đánh trúng ai. */
  foesOf(id: string): string[] {
    if (this.phase !== "fight") return [];
    const i = this.sides.findIndex((x) => x.sid === id), o = i >= 0 ? this.sides[1 - i] : undefined;
    return o?.sid && this.state.players.has(o.sid) ? [o.sid] : [];
  }
  attack(id: string) { if (this.phase === "fight") super.attack(id); }
  skill(c: Client, i: number) {
    if (this.phase !== "fight") return this.log(c.sessionId, this.phase === "end" ? "Trận đấu đã kết thúc." : "Chưa vào trận: đợi đếm ngược xong.", "#ffb35c");
    super.skill(c, i);
  }
  boneSkill(c: Client, i: number) {
    if (this.phase !== "fight") return this.log(c.sessionId, this.phase === "end" ? "Trận đấu đã kết thúc." : "Chưa vào trận: đợi đếm ngược xong.", "#ffb35c");
    super.boneSkill(c, i);
  }
  /**
   * Võ Hồn Chân Thân (8.1a) chỉ khi đang giao đấu, như hồn kỹ. Biến hình, hồi chiêu Chân Thân và hồi chiêu hồn kỹ (`ava`, `avaCd`, `skCd`)
   * nằm trong dữ liệu riêng của phòng, không lưu DB: vào sân thì như mới, rời sân về bản đồ cũng không mang theo.
   */
  chanThan(c: Client) {
    if (this.phase !== "fight") return this.log(c.sessionId, this.phase === "end" ? "Trận đấu đã kết thúc." : "Chưa vào trận: đợi đếm ngược xong.", "#ffb35c");
    super.chanThan(c);
  }
  switchSlot(c: Client, slot: number) { if (this.phase !== "end") super.switchSlot(c, slot); }
  /** Trong sân không mời / nhận lời mời tổ đội (đấu hồn là 1v1, 7.1); xem khung tổ đội, từ chối, rời đội vẫn được. */
  partyAction(id: string, m: unknown) {
    const op = (m as { op?: unknown } | null)?.op;
    if (op === "invite" || op === "accept") return this.log(id, "Đang ở Đại Đấu Hồn Trường: mời / nhận tổ đội sau trận.", "#ffb35c");
    super.partyAction(id, m);
  }
  /** Võ hồn đã gục không hồi trong trận (không có doanh trại, không đếm giờ ngoài trận). */
  tickDowns(_id: string, _dt: number) {}
  /** Đội hình và võ hồn ra trận đã lưu giữ như trước khi vào sân: đổi tay / gục trong trận không ghi DB. */
  persistTeam(_d: PData) {}
  /** Trong sân chỉ túi đồ có thể đổi (phần thưởng): không ghi võ hồn hay vị trí (bản đồ đang đứng vẫn là bản đồ cũ). */
  async write(id: string) {
    const d = this.pdata.get(id); if (!d) return;
    const bag = this.unsavedBag(d); if (!bag) return;
    try { await store.saveBag(d.accountId, bag); } catch (e) { d.bagDirty = true; throw e; }
  }

  /** Sinh lực cả đội theo % (võ hồn đã gục tính 0), số võ hồn chưa gục / trong đội của một bên. */
  teamHp(sid: string) {
    const p = this.state.players.get(sid), d = this.pdata.get(sid);
    if (!p || !d) return { pct: 0, alive: 0, total: 0 };
    let hp = 0, max = 0, alive = 0, total = 0;
    for (const r of d.team) {
      const v = d.owned.find((x) => x.rowId === r); if (!v) continue;
      const m = v === d.ch ? p.maxHp : this.maxHpOf(d, v);
      total++; max += m;
      if (d.down.has(r) || (v === d.ch && p.dead)) continue;
      alive++; hp += v === d.ch ? Math.max(0, d.hpF) : Math.min(m, d.benchHp.get(r) ?? m);
    }
    return { pct: max ? hp / max : 0, alive, total };
  }
  syncSides() {
    this.sides.forEach((s, i) => {
      const a = this.state.sides[i]; if (!s.sid || !this.state.players.has(s.sid)) return;
      const t = this.teamHp(s.sid); a.pct = t.pct; a.alive = t.alive; a.total = t.total;
    });
  }

  tick(dt: number) {
    super.tick(dt);
    this.state.time = Math.max(0, this.state.time - dt);
    if ((this.syncT -= dt) <= 0 && this.phase !== "end") { this.syncT = 0.2; this.syncSides(); }
    if (this.phase === "wait" && this.state.time <= 0) {
      const joined = this.sides.findIndex((s) => s.sid && !s.left);
      if (joined >= 0) this.finish(joined, "noshow"); else this.cancel();
    } else if (this.phase === "ready" && this.state.time <= 0) {
      this.setPhase("fight", ARENA.fightSecs);
      for (const d of this.pdata.values()) d.inv = 0; // bỏ khung bất tử lúc vào sân (không ai đánh được trong lúc đếm ngược)
      this.broadcast("arena", { k: "fight", secs: ARENA.fightSecs });
    } else if (this.phase === "fight") {
      const dead = this.sides.map((s) => !!this.state.players.get(s.sid)?.dead);
      if (dead[0] || dead[1]) this.finish(dead[0] && dead[1] ? null : dead[0] ? 1 : 0, "ko");
      else if (this.state.time <= 0) {
        this.syncSides();
        const [a, b] = [this.state.sides[0].pct, this.state.sides[1].pct];
        this.finish(Math.abs(a - b) <= ARENA.drawPct ? null : a > b ? 0 : 1, "time");
      }
    } else if (this.phase === "end" && this.state.time <= 0 && !this.kicked) {
      this.kicked = true;
      for (const c of this.clients) c.leave(ARENA_END_CODE);
    }
  }

  /** Không ai vào sân trong ARENA.joinSecs giây: hủy trận, không tính Elo. */
  cancel() {
    this.done = true; this.kicked = true;
    this.setPhase("end", 0);
    void this.disconnect();
  }

  /**
   * Kết quả trận (một lần): bên `winner` thắng (null = hòa). Trước hết đếm trận này vào cặp hai tài khoản hôm nay (bảng arena_pairs,
   * 9.7): quá ARENA.pairDaily trận thì là **giao hữu**: không đổi Elo / thành tích, không thưởng, không đếm lượt ARENA.dailyWins.
   * Trận tính Elo: mỗi bên Elo mới theo eloAfter (K = ARENA.k), thêm thắng / thua / hòa; người thắng còn ở sân và còn lượt hôm nay
   * (ARENA.dailyWins) nhận Hồn Tệ và mảnh võ hồn. Ghi DB qua chuỗi lưu của người đó (một
   * transaction: cộng Elo / thành tích, lượt, túi có phần thưởng); phần thưởng chỉ vào túi đang chơi khi DB xác nhận còn lượt. Người
   * không có trong phòng (bỏ trận trước khi vào sân) ghi thẳng. Tin "end" gửi sau khi ghi xong. Thua không mất gì (mục 2).
   */
  finish(winner: number | null, reason: Reason) {
    if (this.done) return;
    this.done = true;
    this.syncSides();
    this.setPhase("end", ARENA.endSecs);
    this.state.winner = winner ?? 2;
    const day = this.today();
    // Một lần đếm cho cả hai bên, trước lần ghi kết quả của từng bên; lỗi DB thì lần ghi của cả hai bên cùng báo lỗi.
    const ranked = store.arenaPairAdd(day, this.sides[0].accountId, this.sides[1].accountId).then(arenaRanked);
    ranked.then((r) => { this.state.friendly = !r; }, (e) => console.error("Không đếm được trận của cặp đấu hồn", e));
    this.sides.forEach((s, i) => {
      const o = this.sides[1 - i], score = winner === null ? 0.5 : winner === i ? 1 : 0;
      const delta: ArenaRecord = { elo: eloAfter(s.rec.elo, o.rec.elo, score) - s.rec.elo, wins: score === 1 ? 1 : 0, losses: score === 0 ? 1 : 0, draws: score === 0.5 ? 1 : 0 };
      const sid = s.sid, p = sid ? this.state.players.get(sid) : undefined, d = sid ? this.pdata.get(sid) : undefined;
      // Khảo hạch hằng ngày "đánh một trận": người còn ở sân của trận đã giao đấu (không tính bỏ trận, đối thủ không vào sân). Trước
      // prepareReward để ảnh chụp túi ghi cùng phần thưởng có cả tiến độ này.
      if (d && !s.left && reason !== "noshow") this.questEvent(sid, { k: "arena" });
      // Gục thì nằm lại tới khi rời sân. Không tự dừng hướng đi đang giữ: sau trận vẫn đi lại được trong sân, và dự đoán chuyển động phía
      // client (mục 6) chỉ đúng khi server áp đúng input client đã gửi (muốn dừng thì phải tăng `PlayerState.seq` như hook `goto`).
      if (p && d && p.dead) d.deadT = Infinity;
      // Phần thưởng chuẩn bị trên bản sao túi: trận giao hữu chỉ việc bỏ đi.
      const reward = score === 1 && p && d && !s.left && s.claims < ARENA.dailyWins ? this.prepareReward(d) : null;
      const report = (rec: ArenaRecord, paid: boolean, friendly: boolean) => this.clients.getById(sid)?.send("arena", { k: "end", score, reason, why: REASON_TEXT[reason], foe: o.name,
        elo0: s.rec.elo, elo1: rec.elo, rec, reward: paid && reward ? { honTe: reward.honTe, code: reward.code, qty: reward.qty, coin: reward.coin } : null,
        capped: !friendly && !!reward && !paid, friendly, left: Math.max(0, ARENA.dailyWins - s.claims - (paid ? 1 : 0)), secs: this.state.time });
      const save = () => ranked.then((r) => r
        ? store.saveArena(s.accountId, ARENA.startElo, delta, reward ? { day, kind: ARENA.claimKind, limit: ARENA.dailyWins, bag: reward.bag } : undefined)
          .then(({ rec, paid }) => ({ rec, paid, friendly: false }))
        : store.getArena(s.accountId, ARENA.startElo).then((rec) => ({ rec, paid: false, friendly: true })))
        .then(({ rec, paid, friendly }) => {
          if (paid && reward && d && this.pdata.get(sid) === d) { d.bag = reward.items; d.honTe = reward.honTeAfter; this.sendBag(sid); }
          report(rec, paid, friendly);
        }, (e) => {
          this.log(sid, "Không lưu được kết quả trận đấu: Elo và phần thưởng chưa được ghi.", "#ff8a8a");
          report({ elo: s.rec.elo, wins: s.rec.wins, losses: s.rec.losses, draws: s.rec.draws }, false, false);
          throw e;
        });
      if (d) this.chain(d, save); else save().catch((e) => console.error(`Lưu kết quả đấu hồn của tài khoản #${s.accountId} thất bại`, e));
    });
    const [a, b] = this.sides, w = winner === null ? null : this.sides[winner];
    const text = w ? `${w.name} thắng ${this.sides[1 - winner!].name} (${REASON_TEXT[reason]})` : `${a.name} và ${b.name} hòa (${REASON_TEXT[reason]})`;
    ranked.catch(() => true).then((r) => this.broadcast("chat", { name: "Hệ thống", text: r ? `${text}.` : `${text}; trận giao hữu, không tính Elo.` }));
  }

  /**
   * Chuẩn bị thưởng thắng trên BẢN SAO túi (túi đang chơi giữ nguyên tới khi DB xác nhận): ARENA.winHonTe đồng + ARENA.winShards mảnh
   * của một võ hồn ngẫu nhiên (ARENA_SHARDS); túi đầy thì phần mảnh không nhận đổi ra Hồn Tệ theo giá thương nhân mua lại.
   */
  prepareReward(d: PData): Reward {
    const items = d.bag, honTe = d.honTe, dirty = d.bagDirty;
    d.bag = items.map((it) => ({ ...it, stats: it.stats == null ? null : structuredClone(it.stats) }));
    const code = shardCode(ARENA_SHARDS[Math.floor(Math.random() * ARENA_SHARDS.length)]);
    const qty = this.addItem(d, code, ARENA.winShards);
    const coin = (sellPrice({ code, years: null, stars: null, enhance: 0 }) ?? 0) * (ARENA.winShards - qty);
    d.honTe += ARENA.winHonTe + coin;
    const r: Reward = { items: d.bag, honTeAfter: d.honTe, bag: this.bagSnapshot(d), honTe: ARENA.winHonTe + coin, code, qty, coin };
    d.bag = items; d.honTe = honTe; d.bagDirty = dirty;
    return r;
  }

  /** Hook kiểm thử (GAME_TEST=1): `afast {s}` rút thời gian còn lại của pha hiện tại xuống `s` giây; còn lại như MapRoom. */
  testHook(c: Client, m: unknown) {
    const o = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>;
    if (process.env.GAME_TEST === "1" && o.op === "afast") {
      this.state.time = Math.min(this.state.time, Math.max(0, Number(o.s) || 0));
      this.sendVohons(c); // như mọi hook khác: tin vohons trước tin test
      c.send("test", { op: "afast", enabled: true, phase: this.phase });
      return;
    }
    super.testHook(c, m);
  }
}
