// Phòng Đại Đấu Hồn Trường (mục 5.9, bước 7.2): một trận đấu đội võ hồn 1v1 giữa hai hồn sư đã ghép ở hàng chờ (arenaQueue.ts).
// Lớp con của MapRoom trên sân `ARENA_MAP`: dùng lại nguyên vòng lặp, di chuyển, đánh thường, hồn kỹ, tiên cơ, kỹ năng hồn cốt, đổi
// võ hồn, gục từng võ hồn; MapRoom.foesOf trả đối thủ khi đang giao đấu nên đòn đánh trúng được hồn sư bên kia (damageFoe). Ở đây chỉ
// có luật riêng của trận: các pha (chờ vào sân, đếm ngược, giao đấu, kết quả), thắng thua, Elo, thưởng, rời sân = thua.
// Server quyết định mọi thứ; client chỉ gửi ý định như ở bản đồ (mục 6).
import { Client, ServerError } from "colyseus";
import { MapRoom, type AuthData, type PData } from "./MapRoom.ts";
import { ArenaState, ArenaSide } from "./schema.ts";
import { ARENA, ARENA_MAP, ARENA_SHARDS, TILE, dir4, eloAfter, shardCode, sellPrice, type ArenaRecord } from "../../../shared/data.ts";
import { arenaMatches, type ArenaMatch } from "./arenaQueue.ts";
import { store, type Item } from "../db.ts";

type Phase = "wait" | "ready" | "fight" | "end";
type Reason = "ko" | "time" | "leave" | "noshow";
/** Một bên của trận: tài khoản, thành tích trước trận (Elo dùng để tính), phiên đang ở sân, đã rời sân, lượt thắng có thưởng hôm nay. */
interface Side { accountId: number; name: string; rec: ArenaRecord; sid: string; left: boolean; claims: number; }
/** Phần thưởng vừa cộng vào túi (để báo client) và túi trước khi cộng (trả lại nếu DB báo đã hết lượt trong ngày). */
interface Reward { honTe: number; code: string; qty: number; coin: number; before: { bag: Item[]; honTe: number }; }

/**
 * Message chỉ dùng ngoài trận: chặn trong sân (xếp đội, hấp thụ, gắn / tháo / cường hóa đồ, dùng đan, mua bán, đi cổng, NPC…), để
 * chỉ số hai bên cố định suốt trận và trận không làm đổi đồ ngoài phần thưởng. Đăng ký lại đè handler của MapRoom (message chưa đăng
 * ký làm Colyseus ngắt kết nối client, nên không bỏ hẳn).
 */
const BLOCKED = ["absorb", "pickup", "discard", "team", "travel", "use", "open", "unlock", "starup", "equip", "unequip", "equipcore",
  "unequipcore", "enhance", "enhancecore", "talk", "buy", "sell"];
const REASON_TEXT: Record<Reason, string> = { ko: "hạ hết đội võ hồn", time: "hết giờ, so sinh lực cả đội", leave: "đối thủ rời sân", noshow: "đối thủ không vào sân" };
/** Mã đóng kết nối khi trận đã xong và hết ARENA.endSecs: client tự quay về bản đồ cũ. */
export const ARENA_END_CODE = 4005;

export class ArenaRoom extends MapRoom {
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
    const m = typeof options?.matchId === "string" ? arenaMatches.get(options.matchId) : undefined;
    if (!m) throw new ServerError(400, "Trận đấu không tồn tại.");
    this.match = m;
    this.sides = m.sides.map((s) => ({ accountId: s.accountId, name: s.name, rec: { ...s.rec }, sid: "", left: false, claims: 0 }));
    // Chỉ vào được bằng mã phòng (joinById) do server gửi cho đúng hai người đã ghép.
    void this.setPrivate(true);
    this.setup(ARENA_MAP);
    for (const s of this.sides) { const a = new ArenaSide(); a.name = s.name; a.elo = s.rec.elo; this.state.sides.push(a); }
    this.setPhase("wait", ARENA.joinSecs);
    for (const t of BLOCKED) this.onMessage(t, (c) => this.log(c.sessionId, "Đang ở Đại Đấu Hồn Trường: không làm được việc này trong trận.", "#ffb35c"));
    this.onMessage("quest", (c, msg: { op: unknown }) => {
      if (msg?.op === "get") this.sendQuest(c.sessionId); else this.log(c.sessionId, "Đang ở Đại Đấu Hồn Trường: nhiệm vụ để sau trận.", "#ffb35c");
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

  /** Vào sân: cả đội đầy sinh lực (MapRoom.onJoin hồi đầy, chưa gục võ hồn nào), đứng ở hai đầu sân quay mặt vào nhau. */
  onJoin(client: Client, o: unknown, auth: AuthData) {
    super.onJoin(client, o, auth);
    const i = this.sides.findIndex((x) => x.accountId === auth.accountId), p = this.state.players.get(client.sessionId)!, d = this.pdata.get(client.sessionId)!;
    this.sides[i].sid = client.sessionId; this.state.sides[i].sid = client.sessionId;
    const sp = this.map.spawn;
    p.x = i === 0 ? sp.x + TILE * 1.5 : sp.x + sp.w - TILE * 1.5; p.y = sp.y + sp.h / 2;
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
  switchSlot(c: Client, slot: number) { if (this.phase !== "end") super.switchSlot(c, slot); }
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
   * Kết quả trận (một lần): bên `winner` thắng (null = hòa). Mỗi bên Elo mới theo eloAfter (K = ARENA.k), thêm thắng / thua / hòa;
   * người thắng còn ở sân và còn lượt hôm nay (ARENA.dailyWins) nhận Hồn Tệ và mảnh võ hồn vào túi. Ghi DB qua chuỗi lưu của người
   * đó (một transaction: Elo, lượt, túi); người không có trong phòng (bỏ trận trước khi vào sân) ghi thẳng. Thua không mất gì (mục 2).
   */
  finish(winner: number | null, reason: Reason) {
    if (this.done) return;
    this.done = true;
    this.syncSides();
    this.setPhase("end", ARENA.endSecs);
    this.state.winner = winner ?? 2;
    const day = this.today();
    this.sides.forEach((s, i) => {
      const o = this.sides[1 - i], score = winner === null ? 0.5 : winner === i ? 1 : 0;
      const rec: ArenaRecord = { elo: eloAfter(s.rec.elo, o.rec.elo, score), wins: s.rec.wins + (score === 1 ? 1 : 0),
        losses: s.rec.losses + (score === 0 ? 1 : 0), draws: s.rec.draws + (score === 0.5 ? 1 : 0) };
      const p = s.sid ? this.state.players.get(s.sid) : undefined, d = s.sid ? this.pdata.get(s.sid) : undefined;
      if (p && d) { d.input = { x: 0, y: 0 }; if (p.dead) d.deadT = Infinity; } // gục thì nằm lại tới khi rời sân
      const reward = score === 1 && p && d && !s.left && s.claims < ARENA.dailyWins ? this.giveReward(s.sid, d) : null;
      const save = () => store.saveArena(s.accountId, rec, reward && d ? { day, kind: ARENA.claimKind, limit: ARENA.dailyWins, bag: this.bagSnapshot(d) } : undefined)
        .then((paid) => { if (reward && d && !paid) this.revertReward(s.sid, d, reward); });
      if (d) this.chain(d, save); else save().catch((e) => console.error(`Lưu kết quả đấu hồn của tài khoản #${s.accountId} thất bại`, e));
      this.clients.getById(s.sid)?.send("arena", { k: "end", score, reason, why: REASON_TEXT[reason], foe: o.name, elo0: s.rec.elo, elo1: rec.elo, rec,
        reward: reward && { honTe: reward.honTe, code: reward.code, qty: reward.qty, coin: reward.coin },
        left: Math.max(0, ARENA.dailyWins - s.claims - (reward ? 1 : 0)), secs: ARENA.endSecs });
    });
    const [a, b] = this.sides, w = winner === null ? null : this.sides[winner];
    this.broadcast("chat", { name: "Hệ thống", text: w ? `${w.name} thắng ${this.sides[1 - winner!].name} (${REASON_TEXT[reason]}).` : `${a.name} và ${b.name} hòa (${REASON_TEXT[reason]}).` });
  }

  /** Thưởng thắng: ARENA.winHonTe đồng + ARENA.winShards mảnh của một võ hồn ngẫu nhiên (ARENA_SHARDS); túi đầy thì phần mảnh không nhận đổi ra Hồn Tệ. */
  giveReward(sid: string, d: PData): Reward {
    const before = { bag: d.bag.map((it) => ({ ...it, stats: it.stats == null ? null : structuredClone(it.stats) })), honTe: d.honTe };
    const code = shardCode(ARENA_SHARDS[Math.floor(Math.random() * ARENA_SHARDS.length)]);
    const qty = this.addItem(d, code, ARENA.winShards);
    const coin = (sellPrice({ code, years: null, stars: null, enhance: 0 }) ?? 0) * (ARENA.winShards - qty);
    d.honTe += ARENA.winHonTe + coin; d.bagDirty = true;
    this.sendBag(sid);
    return { honTe: ARENA.winHonTe + coin, code, qty, coin, before };
  }
  /** DB báo đã đủ lượt thắng có thưởng hôm nay (sang ngày / ghi lỗi giữa chừng): bỏ phần thưởng vừa cộng, báo người chơi. */
  revertReward(sid: string, d: PData, r: Reward) {
    d.bag = r.before.bag; d.honTe = r.before.honTe; d.bagDirty = false;
    this.sendBag(sid);
    this.log(sid, "Đã hết lượt thắng có thưởng hôm nay: phần thưởng trận này không được nhận (Elo vẫn tính).", "#ffb35c");
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
