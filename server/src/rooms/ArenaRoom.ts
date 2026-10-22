// Phòng Đại Đấu Hồn Trường (mục 5.9, bước 7.2): một trận đấu đội võ hồn 1v1 hoặc 2v2 giữa hai bên đã ghép ở hàng chờ (arenaQueue.ts).
// Lớp con của MapRoom trên sân `ARENA_MAP`: dùng lại nguyên vòng lặp, di chuyển, đánh thường, hồn kỹ, tiên cơ, kỹ năng hồn cốt, đổi
// võ hồn, gục từng võ hồn; MapRoom.foesOf trả đối thủ khi đang giao đấu nên đòn đánh trúng được hồn sư bên kia (damageFoe). Ở đây chỉ
// có luật riêng của trận: các pha (chờ vào sân, đếm ngược, giao đấu, kết quả), thắng thua, Elo, thưởng, rời sân = thua.
// Server quyết định mọi thứ; client chỉ gửi ý định như ở bản đồ (mục 6).
import { Client, ServerError } from "colyseus";
import { MapRoom, seatAccount, seatUsed, type AuthData, type PData, type SeatPass } from "./MapRoom.ts";
import { ArenaState, ArenaSide } from "./schema.ts";
import { ARENA, ARENA_MAP, ARENA_SHARDS, arenaCrossPairs, arenaRanked, dir4, eloAfter, shardCode, sellPrice, type ArenaRecord } from "../../../shared/data.ts";
import { arenaMatches, arenaLive, type ArenaMatch } from "./arenaQueue.ts";
import { store, type Item, type Bag, type SocialRow } from "../db.ts";
import * as friends from "../friends.ts";

type Phase = "wait" | "ready" | "fight" | "end";
type Reason = "ko" | "time" | "leave" | "noshow";
/** Thành viên của một bên: thành tích trước trận, phiên đang ở sân, đã rời sân, lượt thắng có thưởng hôm nay. */
interface Member { accountId: number; name: string; rec: ArenaRecord; sid: string; left: boolean; claims: number; }
/** Một bên trận 1v1 hoặc 2v2. Elo đội chỉ dùng để ghép và tính đối thủ; Elo lưu vẫn riêng từng tài khoản. */
interface Side { id: string; members: Member[]; elo: number; }
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
const BLOCKED = ["auto", "absorb", "pickup", "discard", "team", "travel", "wp", "use", "open", "unlock", "starup", "equip", "unequip", "equipcore",
  "unequipcore", "enhance", "enhancecore", "talk", "buy", "sell", "buyback", "expand", "shardbuy", "loadout",
  "fusion"]; // Võ Hồn Dung Hợp Kỹ cấm trong sân, kể cả 2v2 (#192, #178)
const REASON_TEXT: Record<Reason, string> = { ko: "hạ hết đội võ hồn", time: "hết giờ, so sinh lực cả đội", leave: "đối thủ rời sân", noshow: "đối thủ không vào sân" };
/** Mã đóng kết nối khi trận đã xong và hết ARENA.endSecs: client tự quay về bản đồ cũ. */
export const ARENA_END_CODE = 4005;
/** Dữ liệu xác thực của người xem trận (#278): chỉ tài khoản (và danh sách chặn để lọc chat, #195), không nạp võ hồn / túi đồ. */
interface WatchAuth { accountId: number; watch: true; social: SocialRow; }
const isWatch = (a: unknown): a is WatchAuth => (a as WatchAuth | undefined)?.watch === true;

export class ArenaRoom extends MapRoom {
  // Không chia kênh (mục 6 "Nhiều kênh"): mỗi trận một phòng riêng tối đa 4 người, không theo CHANNEL_MAX; `state.channel` = 0 nên MapRoom
  // không cấp số kênh, không khóa kênh khi rời sân, tin `channel` bị từ chối;
  // rời sân thì vào bản đồ cũ theo pickChannel (kênh đồng đội, không thì ít người nhất). Thêm tối đa ARENA.watchMax người xem (#278).
  maxClients = 4 + ARENA.watchMax;
  state = new ArenaState();
  match!: ArenaMatch;
  sides: Side[] = [];
  /** Trận đã có kết quả (finish chỉ chạy một lần); `kicked`: đã đưa mọi người ra khỏi sân. */
  done = false; kicked = false;
  syncT = 0;
  /** Người xem trực tiếp (#278): phiên -> tài khoản. Không có PlayerState / PData, mọi message bị bỏ qua trừ `arena {op: "unwatch"}`. */
  watchers = new Map<string, number>();

  get phase() { return this.state.phase as Phase; }
  setPhase(p: Phase, secs: number) { this.state.phase = p; this.state.time = secs; }

  onCreate(options: { mapId?: unknown; matchId?: unknown }) {
    // Mỗi trận đã ghép đúng một phòng: phòng đầu tiên nhận trận, lần mở thứ hai (kể cả client tự gọi create("arena")) bị từ chối.
    const m = typeof options?.matchId === "string" ? arenaMatches.get(options.matchId) : undefined;
    if (!m || m.roomId) throw new ServerError(400, "Trận đấu không tồn tại.");
    m.roomId = this.roomId;
    this.match = m;
    this.sides = m.sides.map((s) => ({ id: s.id, elo: s.elo, members: s.members.map((member) => ({ ...member, rec: { ...member.rec }, sid: "", left: false, claims: 0 })) }));
    // Chỉ vào được bằng mã phòng (joinById) do server gửi cho đúng các thành viên của hai bên đã ghép.
    void this.setPrivate(true);
    this.setup(ARENA_MAP);
    this.interest.all = true; // sân nhỏ: không lọc đồng bộ theo vùng (11.4), không gửi tin bản đồ nhỏ
    for (const s of this.sides) { const a = new ArenaSide(); a.name = s.members.map((member) => member.name).join(" / "); a.elo = s.elo; this.state.sides.push(a); }
    // Chống dàn xếp (9.7): báo trước cho hai bên nếu cặp đã đủ ARENA.pairDaily trận tính Elo hôm nay. Chỉ để hiển thị; trận có tính
    // Elo không là do lần đếm lúc hết trận (finish) quyết định.
    const pairs = arenaCrossPairs(this.sides[0].members.map((m) => m.accountId), this.sides[1].members.map((m) => m.accountId));
    Promise.all(pairs.map(([a, b]) => store.arenaPairCount(this.today(), a, b))).then((counts) => { if (!this.done) this.state.friendly = counts.some((n) => !arenaRanked(n + 1)); },
      (e) => console.error("Không đọc được số trận của cặp đấu hồn", e));
    this.setPhase("wait", ARENA.joinSecs);
    // Danh sách xem trực tiếp (#278): MapRoom đọc pha / giờ còn lại / số người xem qua sổ mức tiến trình.
    arenaLive.set(this.roomId, { roomId: this.roomId, mode: this.sides.some((x) => x.members.length > 1) ? "2v2" : "1v1",
      sides: this.sides.map((x) => ({ name: x.members.map((member) => member.name).join(" / "), elo: x.elo })),
      phase: () => this.phase, secs: () => this.state.time, holds: new Map(), watching: new Map() });
    for (const t of BLOCKED) this.onMessage(t, (c) => this.log(c.sessionId, "Đang ở Đại Đấu Hồn Trường: không làm được việc này trong trận.", "#ffb35c"));
    this.onMessage("quest", (c, msg: { op: unknown }) => {
      if (msg?.op === "get") this.askQuest(c.sessionId); else this.log(c.sessionId, "Đang ở Đại Đấu Hồn Trường: nhiệm vụ để sau trận.", "#ffb35c");
    });
    this.onMessage("arena", (c, msg: { op: unknown }) => {
      if (msg?.op === "unwatch" && this.watchers.has(c.sessionId)) c.leave(ARENA_END_CODE); // người xem rời: về bản đồ cũ như hết trận
      else if (msg?.op === "top") this.arenaTop(c.sessionId);
    });
  }

  /**
   * Mọi handler message của phòng (đăng ký ở MapRoom.setup và ở đây) đi qua lớp này: người xem (#278) gửi gì cũng bị bỏ qua, trừ
   * `arena {op: "unwatch"}`; handler cũ không gặp phiên không có pdata.
   */
  override onMessage<T = any>(type: "*", callback: (c: Client, type: string | number, message: T) => void): any;
  override onMessage<T = any>(type: string | number, callback: (c: Client, message: T) => void, validate?: (message: unknown) => T): any;
  override onMessage(type: string | number, callback: (c: Client, ...a: any[]) => void, validate?: (message: unknown) => unknown) {
    if (type === "*") return super.onMessage(type, callback as (c: Client, t: string | number, m: unknown) => void);
    return super.onMessage(type, (c: Client, m: unknown) => {
      if (this.watchers.has(c.sessionId) && !(type === "arena" && (m as { op?: unknown } | null)?.op === "unwatch")) return;
      callback(c, m);
    }, validate);
  }

  /** Hồi sinh lực và khiên trong sân (#277): × ARENA.healMult sau bộ Lưu Ly 2 món / ràng buộc Lam Ngân Hoàng. */
  healMult(d: PData) { return super.healMult(d) * ARENA.healMult; }

  /** Trước khi giữ chỗ (#235): token hợp lệ, chưa giữ quá số chỗ; không đối chiếu bản đồ đang đứng (seatAllowed kiểm thành viên). */
  static async onAuth(_token: string, options: { token?: unknown }) { return seatAccount(options?.token, null); }

  /**
   * Chỉ thành viên còn trong trận, hoặc người đang được giữ chỗ xem (#278, MapRoom arenaWatch), được giữ chỗ: người ngoài có token cũng
   * không chiếm được chỗ của sân.
   */
  seatAllowed(pass: SeatPass) {
    const s = this.sides.flatMap((x) => x.members).find((x) => x.accountId === pass.seatFor);
    if (s) return !s.left && !this.done;
    return !this.done && this.watchHold(pass.seatFor);
  }
  /** Tài khoản còn chỗ giữ xem trận này (chưa hết hạn). */
  watchHold(accountId: number) { return (arenaLive.get(this.roomId)?.holds.get(accountId) ?? 0) > Date.now(); }

  /** Chỉ thành viên của hai bên được vào, mỗi tài khoản một phiên (rời sân là bỏ trận); không đối chiếu bản đồ đang đứng. */
  async checkJoin(accountId: number) {
    const s = this.sides.flatMap((x) => x.members).find((x) => x.accountId === accountId);
    if (!s) throw new ServerError(403, "Bạn không ở trong trận đấu này.");
    if (s.left || this.done) throw new ServerError(409, "Trận đấu đã kết thúc.");
    const [ch, looks, loc] = await Promise.all([store.getCharacter(accountId), store.getLooks(accountId), store.getLocation(accountId)]);
    if (!looks.chosen || !ch) throw new ServerError(403, "Chưa có hồn sư.");
    return { ch, looks, loc };
  }

  async onAuth(client: Client, options: { token?: string }) {
    // Người xem (#278): không phải thành viên, có chỗ giữ xem. Chỉ kiểm token và chờ phiên ở bản đồ nhả tài khoản (lần ghi cuối của
    // onLeave xong), không nạp võ hồn / túi đồ.
    const acc = options?.token ? await store.accountFromToken(options.token) : null;
    if (acc && !this.sides.some((x) => x.members.some((member) => member.accountId === acc.accountId))) {
      seatUsed(acc.accountId, client.sessionId);
      if (this.done || !this.watchHold(acc.accountId)) throw new ServerError(403, "Không có chỗ xem trận đấu này.");
      await this.waitOldSession(acc.accountId, client.sessionId);
      const social = await store.getSocial(acc.accountId); // chặn vẫn lọc tin tổ đội / riêng / thế giới khi xem trận (#195)
      return { accountId: acc.accountId, watch: true, social } satisfies WatchAuth as unknown as AuthData;
    }
    const auth = await super.onAuth(client, options);
    const s = this.sides.flatMap((x) => x.members).find((x) => x.accountId === auth.accountId)!;
    s.claims = await store.bossClaims(auth.accountId, this.today(), ARENA.claimKind);
    return auth;
  }

  /** Vào sân: cả đội đầy sinh lực, đứng ở hai phía sân (1/4 và 3/4 chiều ngang) quay mặt vào nhau; thành viên 2v2 lệch nhẹ theo chiều dọc. */
  onJoin(client: Client, o: unknown, auth: AuthData) {
    if (isWatch(auth)) return this.joinWatch(client, auth);
    super.onJoin(client, o, auth);
    const i = this.sides.findIndex((x) => x.members.some((member) => member.accountId === auth.accountId)), s = this.sides[i];
    const mi = s.members.findIndex((member) => member.accountId === auth.accountId), p = this.state.players.get(client.sessionId)!, d = this.pdata.get(client.sessionId)!;
    s.members[mi].sid = client.sessionId; this.state.sides[i].sid = s.members.map((member) => member.sid).filter(Boolean).join(",");
    const sp = this.map.spawn;
    p.x = Math.round(sp.x + sp.w * (i === 0 ? 0.25 : 0.75)); p.y = Math.round(sp.y + sp.h * (s.members.length === 1 ? 0.5 : mi ? 0.58 : 0.42));
    d.dir = { x: i === 0 ? 1 : -1, y: 0 }; p.dir = dir4(d.dir.x, 0);
    this.syncSides();
    if (this.phase === "wait" && this.sides.every((x) => x.members.every((member) => member.sid && !member.left))) {
      this.setPhase("ready", ARENA.readySecs);
      this.broadcast("arena", { k: "ready", secs: ARENA.readySecs });
    }
  }

  /**
   * Người xem vào sân (#278): giữ tài khoản (đá phiên khác như người chơi), không có hồn sư trên sân, view thấy cả sân; hết chỗ giữ
   * (hoặc trận vừa xong) thì đóng kết nối như hết trận.
   */
  joinWatch(client: Client, auth: WatchAuth) {
    const l = arenaLive.get(this.roomId);
    this.holdAccount(auth.accountId, client.sessionId);
    friends.enter(auth.accountId, client.sessionId, "", auth.social); // MapRoom.onLeave bỏ ra
    this.watchers.set(client.sessionId, auth.accountId);
    l?.holds.delete(auth.accountId); l?.watching.set(client.sessionId, auth.accountId);
    this.state.watchers = this.watchers.size;
    this.interest.spectate(client);
    if (this.done) client.leave(ARENA_END_CODE);
  }

  /** Rời sân trước khi có kết quả (đóng tab, mất mạng, bấm rời) là bỏ trận: thua (mục 5.9, bước 7.2). Người xem rời không ảnh hưởng trận. */
  async onLeave(client: Client) {
    if (this.watchers.delete(client.sessionId)) {
      arenaLive.get(this.roomId)?.watching.delete(client.sessionId);
      this.state.watchers = this.watchers.size;
    }
    const i = this.sides.findIndex((x) => x.members.some((member) => member.sid === client.sessionId));
    const member = i >= 0 ? this.sides[i].members.find((x) => x.sid === client.sessionId) : undefined;
    if (member && !this.done) { member.left = true; this.finish(1 - i, "leave"); }
    await super.onLeave(client);
  }

  /** Rời sân là về bản đồ cũ, không phải rời game: giữ danh sách mua lại của thương nhân (9.8). */
  override forgetBuyback() {}

  async onDispose() {
    await super.onDispose();
    arenaMatches.delete(this.match?.id);
    arenaLive.delete(this.roomId);
  }

  // ---------- Luật trận đấu ----------
  /** Đối thủ chỉ có khi đang giao đấu: chờ, đếm ngược, kết quả thì không ai đánh trúng ai. */
  foesOf(id: string): string[] {
    if (this.phase !== "fight") return [];
    const i = this.sides.findIndex((x) => x.members.some((member) => member.sid === id)), o = i >= 0 ? this.sides[1 - i] : undefined;
    return o?.members.map((member) => member.sid).filter((sid) => !!sid && this.state.players.has(sid)) ?? [];
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
  /** Đấu hồn 1v1 / 2v2 (7.1): không lan hiệu ứng tổ đội trong sân, kể cả khi các thành viên cùng tổ đội. */
  partyBuffNear(_id: string): string[] { return []; }
  /** Trong sân không mời / nhận lời mời tổ đội; hiệu ứng phụ trợ tổ đội không lan, nhưng xem khung, từ chối, rời đội vẫn được. */
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
      const a = this.state.sides[i];
      a.sid = s.members.map((member) => member.sid).filter(Boolean).join(",");
      const stats = s.members.map((member) => member.sid ? this.teamHp(member.sid) : { pct: 0, alive: 0, total: 0 });
      const total = stats.reduce((n, t) => n + t.total, 0), alive = stats.reduce((n, t) => n + t.alive, 0);
      a.pct = stats.length ? stats.reduce((n, t) => n + t.pct, 0) / stats.length : 0; a.alive = alive; a.total = total;
    });
  }

  tick(dt: number) {
    super.tick(dt);
    this.state.time = Math.max(0, this.state.time - dt);
    if ((this.syncT -= dt) <= 0 && this.phase !== "end") { this.syncT = 0.2; this.syncSides(); }
    if (this.phase === "wait" && this.state.time <= 0) {
      const joined = this.sides.map((s) => s.members.every((member) => member.sid && !member.left));
      if (joined[0] !== joined[1]) this.finish(joined[0] ? 0 : 1, "noshow"); else this.cancel();
    } else if (this.phase === "ready" && this.state.time <= 0) {
      this.setPhase("fight", ARENA.fightSecs);
      for (const d of this.pdata.values()) d.inv = 0; // bỏ khung bất tử lúc vào sân (không ai đánh được trong lúc đếm ngược)
      this.broadcast("arena", { k: "fight", secs: ARENA.fightSecs });
    } else if (this.phase === "fight") {
      const dead = this.sides.map((s) => s.members.every((member) => !!member.sid && (member.left || this.state.players.get(member.sid)?.dead)));
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
   * Kết quả trận (một lần): bên `winner` thắng (null = hòa). Trước hết đếm trận này vào mọi cặp tài khoản chéo hôm nay
   * (bảng `arena_pairs`, 9.7); chỉ khi mọi cặp còn lượt thì trận có Elo / thành tích / thưởng, nếu không là giao hữu.
   * Elo và phần thưởng được tính riêng cho từng tài khoản, ghi qua chuỗi lưu của tài khoản đó. Người không vào sân ghi thẳng;
   * người rời sân không nhận thưởng. Tin `end` gửi sau khi DB xác nhận kết quả.
   */
  finish(winner: number | null, reason: Reason) {
    if (this.done) return;
    this.done = true;
    this.syncSides();
    this.setPhase("end", ARENA.endSecs);
    this.state.winner = winner ?? 2;
    const day = this.today();
    const pairs = arenaCrossPairs(this.sides[0].members.map((m) => m.accountId), this.sides[1].members.map((m) => m.accountId));
    const ranked = Promise.all(pairs.map(([a, b]) => store.arenaPairAdd(day, a, b))).then((counts) => counts.every(arenaRanked));
    ranked.then((r) => { this.state.friendly = !r; }, (e) => console.error("Không đếm được trận của cặp đấu hồn", e));
    this.sides.forEach((s, i) => {
      const o = this.sides[1 - i], score = winner === null ? 0.5 : winner === i ? 1 : 0;
      s.members.forEach((member) => {
        const sid = member.sid, p = sid ? this.state.players.get(sid) : undefined, d = sid ? this.pdata.get(sid) : undefined;
        // Mỗi tài khoản so Elo riêng với Elo trung bình của bên đối thủ; thưởng cũng xét lượt thắng của chính tài khoản này.
        const delta: ArenaRecord = { elo: eloAfter(member.rec.elo, o.elo, score) - member.rec.elo, wins: score === 1 ? 1 : 0, losses: score === 0 ? 1 : 0, draws: score === 0.5 ? 1 : 0 };
        if (d && !member.left && reason !== "noshow") this.questEvent(sid, { k: "arena" });
        // Khảo hạch phải ghi trước prepareReward để ảnh chụp túi có cả tiến độ trận.
        // Gục thì nằm lại tới khi rời sân; không tự dừng input để client vẫn nhận đúng dự đoán chuyển động.
        if (p && d && p.dead) d.deadT = Infinity;
        // Phần thưởng được chuẩn bị trên bản sao túi; trận giao hữu hoặc thành viên đã rời chỉ bỏ bản sao đó.
        const reward = score === 1 && p && d && !member.left && member.claims < ARENA.dailyWins ? this.prepareReward(d) : null;
        const report = (rec: ArenaRecord, paid: boolean, friendly: boolean) => this.clients.getById(sid)?.send("arena", { k: "end", score, reason, why: REASON_TEXT[reason], foe: o.members.map((x) => x.name).join(" / "),
          elo0: member.rec.elo, elo1: rec.elo, rec, reward: paid && reward ? { honTe: reward.honTe, code: reward.code, qty: reward.qty, coin: reward.coin } : null,
          capped: !friendly && !!reward && !paid, friendly, left: Math.max(0, ARENA.dailyWins - member.claims - (paid ? 1 : 0)), secs: this.state.time });
        const save = () => ranked.then((r) => r
          ? store.saveArena(member.accountId, ARENA.startElo, delta, reward ? { day, kind: ARENA.claimKind, limit: ARENA.dailyWins, bag: reward.bag } : undefined)
            .then(({ rec, paid }) => ({ rec, paid, friendly: false }))
          : store.getArena(member.accountId, ARENA.startElo).then((rec) => ({ rec, paid: false, friendly: true })))
          .then(({ rec, paid, friendly }) => {
            if (paid && reward && d && this.pdata.get(sid) === d) { d.bag = reward.items; d.honTe = reward.honTeAfter; this.sendBag(sid); }
            report(rec, paid, friendly);
          }, (e) => {
            this.log(sid, "Không lưu được kết quả trận đấu: Elo và phần thưởng chưa được ghi.", "#ff8a8a");
            report({ elo: member.rec.elo, wins: member.rec.wins, losses: member.rec.losses, draws: member.rec.draws }, false, false);
            throw e;
          });
        if (d) this.chain(d, save); else save().catch((e) => console.error(`Lưu kết quả đấu hồn của tài khoản #${member.accountId} thất bại`, e));
      });
    });
    const [a, b] = this.sides, w = winner === null ? null : this.sides[winner];
    const text = w ? `${w.members.map((x) => x.name).join(" / ")} thắng ${this.sides[1 - winner!].members.map((x) => x.name).join(" / ")} (${REASON_TEXT[reason]})`
      : `${a.members.map((x) => x.name).join(" / ")} và ${b.members.map((x) => x.name).join(" / ")} hòa (${REASON_TEXT[reason]})`;
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
    this.addCoin(d, ARENA.winHonTe + coin);
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
